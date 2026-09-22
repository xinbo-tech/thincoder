/**
 * workspace-guard.test.mjs — 无工作区守卫批机器验收（`docs/batches/2026-09-21-vsc-no-folder-guard.md`
 * §2.6 用例 1–17）。机制单源 = `docs/vsc/design/PROJECT-SWITCHER.md` §4.1。
 *
 * 手法（§2.6）：真实 ChatPanel 原型 + 真实模块链 + tmp 沙箱（`_setSessionsDirForTest` /
 * `_setConfigPathForTest` / `THINCODER_LOG_DIR`）；守卫态显式置 `workspaceFolders = []`
 * （存 / 还原——先例 `image-downgrade.test.mjs:30-38`；mock 默认 = 单根）。
 * 两组手法同档混编（先例 `async-visibility.test.mjs`）：宿主组 1–14 + 17（真模块 + 桩/真原型
 * 面板）、webview 组 15–16（happy-dom 驱真 `chat.js` / `send.js` / `loading.js`）。
 * 三探针（`showWarningMessage` / `showInformationMessage` / `commands.executeCommand` /
 * `withProgress` / `showInputBox`）一律**用例内 patch**（save → patch → restore——先例
 * `chat-panel-messages.test.mjs:64-84`）⇒ mock 档只动「默认单根」一处。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import * as vscode from "vscode"
import { sessionPath } from "@thincoder/core/session-slots.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { handlePanelMessage, setProjectFolder, clearProjectOverride, _cwd } from "../src/extension/panel-messages.mjs"
import { handleNewSession, handleSwitchSession, handleDeleteSession, handleRenameSession, handleSetProject } from "../src/extension/panel-messages-session.mjs"
import { openSessionContent, ensureSlotAsync, status as bootstrapStatus } from "../src/extension/panel-session.mjs"
import { maybePromptIndex, buildIndex } from "../src/extension/panel-index.mjs"
import { runPanelChat } from "../src/extension/panel-chat.mjs"
import { hasWorkspaceFolder, blockOnNoWorkspace, notifyNoWorkspace, NO_WORKSPACE_MESSAGE, OPEN_FOLDER_LABEL, OPEN_FOLDER_COMMAND } from "../src/extension/workspace-guard.mjs"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"

const DATAURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
let _tmp, _sessionsDir, _logDir, _cleanupEnv, _capturedPosts, _defaultFolders
let W = null // webview 组（15/16）模块句柄——首用时装配

// ─── 环境（沙箱 + happy-dom；两组同档混编）────────────────────────
before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-wsguard-"))
  _defaultFolders = vscode.workspace.workspaceFolders // mock 默认单根（用例间还原的基准）
  _sessionsDir = join(_tmp, "sessions")
  _logDir = join(_tmp, "logs")
  _setSessionsDirForTest(_sessionsDir)
  _setConfigPathForTest(join(_tmp, "config.json")) // 文件可缺席（缺省 {} = 无 provider）
  process.env.THINCODER_LOG_DIR = _logDir // logEvent 写门 + 隔离（turn:start 断言用）
  vscode.env.language = "en"
  const env = setupWebview()
  _cleanupEnv = env.cleanup
  _capturedPosts = env.capturedPosts // webview → host 上行捕获
  installFullIndexFixture() // chat.js 顶层 init 读全量 index.html id
})

after(() => {
  // chat.js 启动加载画面的 3s 兜底计时器：providerStatus 是清它的那一拍（握手四件末环）
  try { window.dispatchEvent(new window.MessageEvent("message", { data: { type: "providerStatus", status: {}, keyOk: true } })) } catch { /* teardown edge */ }
  try { if (W?.toast?.showToast?._t) clearTimeout(W.toast.showToast._t) } catch { /* no toast */ }
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  clearProjectOverride()
  delete process.env.THINCODER_LOG_DIR
  vscode.env.language = undefined
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  _cleanupEnv?.()
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

// ─── 夹具 / 探针 ────────────────────────────────────────────────
/** 守卫态（存 / 还原——先例 `image-downgrade.test.mjs:30-38`；mock 默认单根 ⇔ 用例间还原）。 */
async function withNoFolder(fn) {
  const saved = vscode.workspace.workspaceFolders
  vscode.workspace.workspaceFolders = []
  try { return await fn() } finally { vscode.workspace.workspaceFolders = saved }
}
const setFolders = (paths) => { vscode.workspace.workspaceFolders = paths.map((p) => ({ uri: { fsPath: p } })) }

/** 变化处理器捕获（构造期注册——用例内 patch ⇒ 真 handler 句柄；先例 `chat-panel-messages.test.mjs:64-84`）。 */
function captureFolderListener() {
  const real = vscode.workspace.onDidChangeWorkspaceFolders
  const listeners = []
  vscode.workspace.onDidChangeWorkspaceFolders = (cb) => { listeners.push(cb); return { dispose: () => {} } }
  return { fire: () => { for (const l of listeners) l() }, restore: () => { vscode.workspace.onDidChangeWorkspaceFolders = real } }
}

/** 探针 patch（save → patch → restore；mock 未在册的键还原为删除态）。 */
async function withPatched(obj, key, impl, fn) {
  const had = Object.prototype.hasOwnProperty.call(obj, key)
  const real = obj[key]
  obj[key] = impl
  try { return await fn() } finally { if (had) obj[key] = real; else delete obj[key] }
}

/** 目录快照（递归相对路径）——文件系统副作用的判据面。 */
function snapshotDir(dir) {
  if (!existsSync(dir)) return []
  const out = []
  const walk = (rel) => {
    for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
      const p = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(p); else out.push(p)
    }
  }
  walk("")
  return out.sort()
}

/** 该 cwd 会话家族（`sessions/<sha1(cwd)>*`）文件名。 */
function cwdFamily(cwd) {
  const prefix = basename(sessionPath(cwd)).split(".")[0]
  try { return readdirSync(_sessionsDir).filter((n) => n.startsWith(prefix)).sort() } catch { return [] }
}

/** turn:start 事件行数（THINCODER_LOG_DIR 隔离目录——先例 `async-parity.test.mjs:48-59`）。 */
function turnStarts() {
  let names = []
  try { names = readdirSync(_logDir) } catch { return 0 }
  let n = 0
  for (const f of names) for (const line of readFileSync(join(_logDir, f), "utf8").split("\n")) {
    if (!line.trim()) continue
    try { if (JSON.parse(line).ev === "turn:start") n += 1 } catch { /* 半行忽略 */ }
  }
  return n
}

const settle = (ms = 15) => new Promise((r) => setTimeout(r, ms))
/** 条件等待（异步 boot / 认领落定——超时返回 false，由断言点名）。 */
async function waitFor(fn, ms = 800) {
  const t0 = Date.now()
  for (;;) {
    if (fn()) return true
    if (Date.now() - t0 > ms) return false
    await settle(5)
  }
}

function hostContext() {
  return {
    subscriptions: [],
    secrets: { get: async () => undefined, delete: async () => {} },
    globalState: { get: async () => undefined, update: async () => {} },
    workspaceState: { get: () => undefined, update: async () => {} },
  }
}

/** 桩/真面板（真 ChatPanel 原型——方法面真实，字段面实例提供）：posted 捕获 = webview 载荷。 */
function panelFixture(extra = {}) {
  const posted = []
  const p = Object.create(ChatPanel.prototype)
  Object.assign(p, {
    _slot: null, _agent: null, _autoApprove: false, _turnState: "idle", _susp: null,
    _distillController: null, _abortController: null, _statusBar: null, _context: hostContext(),
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    posted, _chatCalls: [], ...extra,
  })
  p._chat = (...args) => { p._chatCalls.push(args); return Promise.resolve() }
  return p
}

/** 真面板（构造期注册监听 ⇒ 捕获生效后 new）。 */
function realPanel() {
  const p = new ChatPanel(hostContext())
  const posted = []
  p._panel = { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } }
  p.posted = posted
  return p
}

const mkRoot = (name) => { const d = join(_tmp, name); mkdirSync(d, { recursive: true }); return d }
const typesOf = (p) => p.posted.map((m) => m.type)
const hasType = (p, t, extra = {}) => p.posted.some((m) => m.type === t && Object.entries(extra).every(([k, v]) => m[k] === v))

// ─── ① 拒启 + 零写入（用例 1–8）─────────────────────────────────
test("1 无文件夹 · 发消息带图：守卫拒（host 通知逐字）∧ `_chat` 零调 ∧ cwd 的 `.thincoder` 零新增（图片不落盘）", async () => {
  const thincoderDir = join(process.cwd(), ".thincoder")
  const before = snapshotDir(thincoderDir)
  const p = panelFixture()
  const warned = []
  await withPatched(vscode.window, "showWarningMessage", async (m) => { warned.push(m) }, () =>
    withNoFolder(() => handlePanelMessage(p, { type: "userMessage", text: "hi", images: [DATAURL] })))
  assert.deepEqual(p._chatCalls, [], "守卫态零回合（_chat 零调）")
  assert.ok(warned.includes(NO_WORKSPACE_MESSAGE), `host 通知逐字命中（实得 ${JSON.stringify(warned)}）`)
  assert.deepEqual(snapshotDir(thincoderDir), before, "cwd/.thincoder 零新增（② 先于 savePastedImages）")
})

test("2 无文件夹 · 命令面 `sendMessage`：守卫先于回显 ⇒ 无假气泡（webview 零 userMessage）∧ `_chat` 零调", async () => {
  const p = panelFixture()
  const warned = []
  await withPatched(vscode.window, "showWarningMessage", async (m) => { warned.push(m) }, () => withNoFolder(() => p.sendMessage("hi")))
  assert.deepEqual(typesOf(p), [], "命令面回显零发（无假气泡）")
  assert.deepEqual(p._chatCalls, [], "命令面不建回合")
  assert.equal(warned.length, 1, "被挡动作各提示一次")
})

test("3 无文件夹 · retry：守卫拒（② 同入口）∧ `_chat` 零调", async () => {
  const p = panelFixture({ _activeHistory: () => [{ role: "user", content: "retry-me", provider: "p1" }] })
  const warned = []
  await withPatched(vscode.window, "showWarningMessage", async (m) => { warned.push(m) }, () => withNoFolder(() => handlePanelMessage(p, { type: "retry" })))
  assert.deepEqual(p._chatCalls, [], "retry 不建回合")
  assert.equal(warned.length, 1, "retry 被挡同样提示（不静默丢）")
})

test("4 无文件夹 · 回合兜底：结构锁（runPanelChatImpl 首条语句 = 守卫早退）+ 行为锁（恒早退：`_turnState` idle ∧ `_agent` null ∧ 零 turn:start）", async () => {
  const lines = readFileSync(new URL("../src/extension/panel-chat.mjs", import.meta.url), "utf8").split("\n")
  const head = lines.slice(lines.findIndex((l) => l.startsWith("async function runPanelChatImpl(")) + 1)
  const firstCode = head.find((l) => l.trim() && !l.trim().startsWith("//"))
  assert.ok(firstCode?.includes("if (blockOnNoWorkspace(panel)) return"), `④ 结构锁：函数体首条语句 = 守卫早退（实得 ${firstCode?.trim()}）`)
  const code = head.map((l) => l.replace(/\/\/.*$/, "")).join("\n") // 去行注（注释里的例子不算语句）
  const guardAt = code.indexOf("if (blockOnNoWorkspace(panel)) return")
  assert.ok(guardAt > 0, "④ 结构锁：`if (blockOnNoWorkspace(panel)) return` 在 runPanelChatImpl 内")
  assert.ok(guardAt < code.search(/\bawait\b/), "④ 结构锁：守卫先于函数体首个 await")
  assert.ok(guardAt < code.indexOf('_publishTurnState("running")'), '④ 结构锁：守卫先于 `_publishTurnState("running")`')
  const p = panelFixture()
  const before = turnStarts()
  await withNoFolder(() => runPanelChat(p, { text: "x" })) // 行为锁：守卫态驱动真 runPanelChat ⇒ 恒早退
  assert.equal(p._turnState, "idle", "行为锁：忙态恒 idle（回合从未起跑）")
  assert.equal(p._agent, null, "行为锁：agent 未建（manifest 建档钩子不可达）")
  assert.equal(turnStarts(), before, "行为锁：零 turn:start（内部日志事件面）")
  assert.deepEqual(typesOf(p), [], "零协议消息（零 loading / 零 turnState 广播）")
})

test("5 无文件夹 · boot `openSessionContent`：零认领（会话家族零新增 ∧ `_slot === null`）∧ webview 收 `workspaceGuard{active:true}`", async () => {
  const cwd = process.cwd()
  const p = panelFixture()
  await withNoFolder(async () => {
    const before = cwdFamily(cwd)
    await openSessionContent(p)
    assert.deepEqual(cwdFamily(cwd), before, "会话家族零新增（不认领不写——零写入 B 档）")
    assert.equal(p._slot, null, "槽保持未绑（零认领）")
  })
  assert.ok(hasType(p, "workspaceGuard", { active: true }), "推守卫态 active:true")
  assert.ok(!hasType(p, "historyPage"), "零内容投递（boot 跳过）")
})

test("6 无文件夹 · 认领原语 `ensureSlotAsync`：返 null ∧ 零写", async () => {
  const cwd = process.cwd()
  const p = panelFixture()
  await withNoFolder(async () => {
    const before = cwdFamily(cwd)
    assert.equal(await ensureSlotAsync(p), null, "不认领（返 null）")
    assert.equal(p._slot, null, "面板不绑槽")
    assert.deepEqual(cwdFamily(cwd), before, "零会话文件落盘")
  })
})

test("7 无文件夹 · 会话族五 handler：各拒 ∧ 触面零调用 ∧ 会话目录零变化", async () => {
  const calls = []
  const p = panelFixture()
  p._newSession = async () => { calls.push("newSession") }
  p._deleteSession = async () => { calls.push("deleteSession") }
  p._loadSession = async () => { calls.push("loadSession") }
  p._applyProjectSwitch = async () => { calls.push("applyProjectSwitch") }
  p._pickProject = async () => { calls.push("pickProject") }
  const warned = [], inputBoxes = [], before = cwdFamily(process.cwd())
  await withPatched(vscode.window, "showWarningMessage", async (m) => { warned.push(m) }, () =>
    withPatched(vscode.window, "showInputBox", async () => { inputBoxes.push(1); return undefined }, () =>
      withNoFolder(async () => {
        await handleNewSession(p)
        await handleSwitchSession(p, { slot: 2 })
        await handleDeleteSession(p, { slot: 2 })
        await handleRenameSession(p, { slot: 2, currentTitle: "t" })
        await handleSetProject(p, { fsPath: join(_tmp, "nope") })
      })))
  assert.deepEqual(calls, [], "五 handler 触面零调用（新建 / 删 / 装载 / 切项目 / 选择器全不达）")
  assert.deepEqual(inputBoxes, [], "renameSession 输入框零弹（不改名）")
  assert.equal(warned.filter((m) => m === NO_WORKSPACE_MESSAGE).length, 5, "五 handler 各提示一次")
  assert.deepEqual(cwdFamily(process.cwd()), before, "会话目录零变化（不落槽 / 不写 manifest active）")
})

test("8 无文件夹 · 索引面：建档邀请零发 ∧ `buildIndex` 拒（零 withProgress）", async () => {
  const p = panelFixture()
  const infos = [], warned = [], progresses = []
  await withPatched(vscode.window, "showInformationMessage", async (m) => { infos.push(m); return undefined }, () =>
    withPatched(vscode.window, "showWarningMessage", async (m) => { warned.push(m) }, () =>
      withPatched(vscode.window, "withProgress", async (opts, task) => { progresses.push(opts); return task({ report: () => {} }) }, () =>
        withNoFolder(async () => {
          await maybePromptIndex(p)
          await bootstrapStatus(p) // 慢段（面板打开路径——⑧ 的既有调用点）
          await buildIndex(p)
        }))))
  assert.deepEqual(infos.filter((m) => String(m).includes("Vector search index not built")), [], `建档邀请零发（实得 ${JSON.stringify(infos)}）`)
  assert.deepEqual(progresses, [], "buildIndex 拒在 withProgress 之前（零索引动作）")
  assert.ok(warned.includes(NO_WORKSPACE_MESSAGE), "buildIndex 拒 ⇒ host 通知（提示 + return）")
})

// ─── ③ 恢复面（用例 9 / 10 / 14）──────────────────────────────────
test("9 恢复（空 → 非空）：`workspaceGuard{active:false}` + boot 跑（槽绑定 + 内容投递）+ 随后 userMessage 放行", async () => {
  const cap = captureFolderListener()
  try {
    const rootB = mkRoot("rootB")
    const p = realPanel()
    setFolders([]); cap.fire() // 入空窗（转空向——置「此前守卫」）
    assert.equal(p._slot, null, "空窗零绑定")
    setFolders([rootB]); cap.fire() // 空 → 非空
    assert.ok(await waitFor(() => hasType(p, "workspaceGuard", { active: false })), "推守卫态 active:false（放行）")
    assert.ok(await waitFor(() => p._slot != null), "boot 认领完成（槽已绑定）")
    for (const t of ["project", "clearMessages", "historyPage", "sessions"]) assert.ok(typesOf(p).includes(t), `boot 内容投递 ${t}`)
    const chatCalls = []
    p._chat = (...args) => { chatCalls.push(args); return Promise.resolve() }
    await handlePanelMessage(p, { type: "userMessage", text: "go" })
    assert.equal(chatCalls.length, 1, "放行后 userMessage 进既有权（_chat 单发）")
  } finally { clearProjectOverride(); vscode.workspace.workspaceFolders = _defaultFolders; cap.restore() }
})

test("10 恢复（非空 → 空 · 反方向）：推 active:true ∧ 不走 `_onProjectChanged`（不绑 process.cwd()）∧ 主动提示恰一次 ∧ 槽解绑", async () => {
  const cap = captureFolderListener()
  try {
    const p = realPanel()
    setFolders([mkRoot("rootA"), mkRoot("rootB")])
    assert.ok(setProjectFolder(join(_tmp, "rootB")).ok, "override = B")
    p._agent = { sentinel: true }
    p._slot = 7
    const calls = [], warned = []
    p._onProjectChanged = async () => { calls.push(1) }
    await withPatched(vscode.window, "showWarningMessage", async (m) => { warned.push(m) }, async () => {
      setFolders([]); cap.fire()
      await settle()
    })
    assert.ok(hasType(p, "workspaceGuard", { active: true }), "推守卫态 active:true")
    assert.equal(_cwd(), process.cwd(), "override 已清（_cwd() 回落不再被守卫面消费）")
    assert.equal(p._agent, null, "agent 销毁（既有销毁点语义）")
    assert.equal(p._slot, null, "槽解绑（守卫态零绑定——恢复面重新认领的前提）")
    assert.deepEqual(calls, [], "不再走 _onProjectChanged（旧路径会绑 process.cwd() 并落槽）")
    assert.equal(warned.filter((m) => m === NO_WORKSPACE_MESSAGE).length, 1, "主动提示恰一次")
  } finally { clearProjectOverride(); vscode.workspace.workspaceFolders = _defaultFolders; cap.restore() }
})

test("14 第三支路回归（非空 → 非空逐字保留）：override 根被移出 ⇒ override 清 + agent 销毁 + `_onProjectChanged` 跑；移除非 override 根 ⇒ 零动作", async () => {
  const cap = captureFolderListener()
  try {
    const rootA = mkRoot("rootA"), rootB = mkRoot("rootB")
    const p = realPanel()
    setFolders([rootA, rootB])
    assert.ok(setProjectFolder(rootB).ok, "override = B")
    p._agent = { sentinel: true }
    const calls = []
    p._onProjectChanged = async function (...args) { calls.push(args); return ChatPanel.prototype._onProjectChanged.apply(this, args) }
    setFolders([rootA]); cap.fire() // 移出被 override 的 B
    assert.equal(_cwd(), rootA, "override 清 ⇒ _cwd() 回落 folders[0] = A")
    assert.equal(p._agent, null, "agent 销毁（防 agent 指向死目录）")
    assert.equal(calls.length, 1, "_onProjectChanged 跑了（既有回落链逐字保留）")
    assert.ok(await waitFor(() => p._slot != null), "槽重绑 A 家族（回落兑现）")
    setFolders([rootA, rootB]); clearProjectOverride(); calls.length = 0 // 移除非 override 根（cwd = A 仍在册）
    setFolders([rootA]); cap.fire()
    await settle()
    assert.equal(calls.length, 0, "非 override 根移除 ⇒ 零动作（现状早退）")
    assert.equal(_cwd(), rootA, "cwd 不变")
  } finally { clearProjectOverride(); vscode.workspace.workspaceFolders = _defaultFolders; cap.restore() }
})

// ─── ② 提示面频度（11）· webview 出口（15 / 16）· 一键动作（17）──────
test("11 频度：① 连续两次面板启用 ⇒ 恰 1 条；② 释放后再入空窗 ⇒ 再 1 条；③ 被挡动作 2 次 ⇒ 2 条", async () => {
  const realOnCfg = vscode.workspace.onDidChangeConfiguration
  vscode.workspace.onDidChangeConfiguration = () => ({ dispose: () => {} })
  const cap = captureFolderListener()
  try {
    const p = realPanel()
    p._html = () => "<html>guard fixture</html>"
    p._initStatusBar = () => {}
    const warned = []
    const count = () => warned.filter((m) => m === NO_WORKSPACE_MESSAGE).length
    const view = () => ({
      webview: { options: {}, html: "", postMessage: (m) => { p.posted.push(m); return Promise.resolve(true) }, onDidReceiveMessage: () => {} },
      onDidDispose: () => {},
    })
    await withPatched(vscode.window, "showWarningMessage", async (m) => { warned.push(m) }, () =>
      withNoFolder(async () => {
        ChatPanel.prototype.resolveWebviewView.call(p, view(), {}, {}) // ① 面板启用 ×2
        ChatPanel.prototype.resolveWebviewView.call(p, view(), {}, {})
        assert.equal(count(), 1, "① 每空窗恰一次（连开两次面板只提示 1 条）")
        await settle(30) // 慢段（status / fullStatus / ⑧ 派生面）——若另发提示，本断言暴露
        assert.equal(count(), 1, "① 慢段零追加（⑧ 与派生面静默）")
        setFolders([mkRoot("release")]); cap.fire() // ② 释放（转非空）
        assert.ok(await waitFor(() => p._wsGuardNotified !== true), "释放复位去重标志")
        setFolders([]); cap.fire()
        assert.equal(count(), 2, "② 释放后再入空窗 ⇒ 再 1 条")
        p.sendMessage("a"); p.sendMessage("b")
        assert.equal(count(), 4, "③ 被挡动作 2 次 ⇒ 2 条（被动提示不去重）")
      }))
  } finally {
    clearProjectOverride(); vscode.workspace.workspaceFolders = _defaultFolders
    cap.restore(); vscode.workspace.onDidChangeConfiguration = realOnCfg
  }
})

/** webview 组装配（happy-dom 已注册——动态 import 保证模块顶层 DOM 读取在位）。 */
async function loadWebview() {
  if (W) return W
  const state = await import("../webview/state.js")
  await import("../webview/chat.js") // 真模块图：消息 case 唯一消费位
  W = {
    S: state.S, ctx: state.ctx,
    send: (await import("../webview/send.js")).send,
    applyBusyLock: (await import("../webview/loading.js")).applyBusyLock,
    toast: await import("../webview/toast.js"),
    t: (await import("../webview/i18n.js")).t,
  }
  return W
}

test("15 webview 出口守卫：守卫态 send() ⇒ 零 userMessage 上行 ∧ toast 逐字 ∧ 文本保留 ∧ 零假气泡 ∧ 无悬挂 loading", async () => {
  const { S, ctx, send, t } = await loadWebview()
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  assert.equal(t("workspace.required"), "Open a folder first — ThinCoder needs a workspace to work in.", "en 逐字")
  assert.equal(zh["workspace.required"], "请先打开文件夹——ThinCoder 需要一个工作区才能开工。", "zh 逐字")
  window.dispatchEvent(new window.MessageEvent("message", { data: { type: "workspaceGuard", active: true } }))
  assert.equal(S._workspaceRequired, true, "守卫态镜像入 S（chat-messages.js case）")
  S._turnState = "idle"
  ctx.inputEl.value = "hello"
  const mark = _capturedPosts.length
  const bubbles = document.querySelectorAll(".message.user").length
  send()
  assert.equal(_capturedPosts.slice(mark).filter((m) => m.type === "userMessage").length, 0, "零 userMessage 上行（拒发）")
  const toastEl = document.getElementById("paste-toast")
  assert.equal(toastEl?.textContent, t("workspace.required"), "toast 逐字命中")
  assert.ok(toastEl.classList.contains("visible"), "toast 可见（不吞）")
  assert.equal(ctx.inputEl.value, "hello", "文本保留不吞（开文件夹后可重按）")
  assert.equal(document.querySelectorAll(".message.user").length, bubbles, "零假气泡")
  assert.equal(S._phase, null, "无悬挂 loading")
  window.dispatchEvent(new window.MessageEvent("message", { data: { type: "workspaceGuard", active: false } }))
  assert.equal(S._workspaceRequired, false, "守卫释放 ⇒ 镜像复位")
})

test("16 `applyBusyLock` 第三态优先级（守卫 > busy > 常态）", async () => {
  const { S, ctx, applyBusyLock, t } = await loadWebview()
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  assert.equal(t("workspace.requiredPlaceholder"), "Open a folder to start…", "en 逐字")
  assert.equal(zh["workspace.requiredPlaceholder"], "请先打开文件夹…", "zh 逐字")
  ctx._interruptMode = false
  S._workspaceRequired = true; S._turnState = "running"
  applyBusyLock()
  assert.equal(ctx.inputEl.placeholder, t("workspace.requiredPlaceholder"), "守卫 > busy（即使 running）")
  S._workspaceRequired = false; S._turnState = "running"
  applyBusyLock()
  assert.equal(ctx.inputEl.placeholder, t("input.busyPlaceholder"), "守卫释放 ∧ running ⇒ busy 占位符")
  S._turnState = "idle"
  applyBusyLock()
  assert.equal(ctx.inputEl.placeholder, t("input.placeholder"), "两者皆假 ⇒ 常态占位符")
})

test("17 一键动作（③ 命令面路径驱动 · 真守卫模块）：通知逐字 + 按钮 ⇒ `vscode.openFolder` 恰一次且无参；用户关闭 ⇒ 零调用", async () => {
  const p = panelFixture()
  const warned = [], executed = [], answers = [OPEN_FOLDER_LABEL, undefined]
  await withPatched(vscode.window, "showWarningMessage", async (m, ...rest) => { warned.push([m, ...rest]); return answers.shift() }, () =>
    withPatched(vscode.commands, "executeCommand", async (...args) => { executed.push(args) }, () =>
      withNoFolder(async () => {
        p.sendMessage("x") // ③ 命令面入口（真守卫）——回按钮
        await settle()
        assert.equal(warned.length, 1, "命令面被挡 ⇒ 通知一发（③ 路径在位）")
        assert.equal(warned[0][0], NO_WORKSPACE_MESSAGE, "通知文本逐字")
        assert.equal(warned[0][1], OPEN_FOLDER_LABEL, "按钮 = `Open Folder`（逐字）")
        assert.equal(executed.length, 1, "回按钮 ⇒ executeCommand 恰一次")
        assert.deepEqual(executed[0], [OPEN_FOLDER_COMMAND], "命令名逐字 `vscode.openFolder` ∧ 无参")
        p.sendMessage("y") // 用户关闭通知（undefined）⇒ 零调用
        await settle()
        assert.equal(warned.length, 2, "第二次被挡仍提示（被动不去重）")
        assert.equal(executed.length, 1, "回 undefined ⇒ 零新调用")
        await notifyNoWorkspace() // 提示面自身契约直驱（响应耗尽 ⇒ 同为零调用）
        assert.equal(executed.length, 1, "提示面直驱不额外调命令")
      })))
})

// ─── 零回归 + 结构锁（用例 12 / 13）───────────────────────────────
test("12 零回归（有文件夹）：`hasWorkspaceFolder()` 真 ∧ `_cwd()` 逐字 = `process.cwd()` ∧ 真 `runPanelChat` 进既有权", async () => {
  vscode.workspace.workspaceFolders = _defaultFolders // mock 默认单根（用例间还原）
  assert.equal(hasWorkspaceFolder(), true, "mock 默认单根（守卫判据 true）")
  assert.equal(_cwd(), process.cwd(), "_cwd() 取值不变（强于翻默认——值恒等）")
  const probe = panelFixture()
  assert.equal(blockOnNoWorkspace(probe), false, "守卫不拦（false）")
  assert.equal(probe._wsGuardNotified, undefined, "有文件夹不置去重标志")
  const p = panelFixture({ _slot: 0, _distillState: undefined, _questionQueue: [], _permissionQueue: [], _turnControllers: [], _abortRequested: false })
  const warned = []
  await withPatched(vscode.window, "showWarningMessage", async (m) => { warned.push(m) }, async () => { await runPanelChat(p, { text: "x" }) })
  assert.ok(hasType(p, "error", { needsSetup: true }), "回合进既有权（无 provider ⇒ 现报错文案路径）")
  assert.ok(!warned.includes(NO_WORKSPACE_MESSAGE), "守卫提示零发（有文件夹）")
})

test("13 结构锁：`src/extension/**` 的 `workspaceFolders` 读点 = 在册四处（零新增旁路）+ 判据单源", () => {
  const dir = new URL("../src/extension/", import.meta.url)
  const files = readdirSync(dir).filter((n) => n.endsWith(".mjs"))
  const readers = files.filter((f) => readFileSync(new URL(f, dir), "utf8").includes("workspaceFolders")).sort()
  assert.deepEqual(readers, [
    "chat-panel.mjs",       // 工作区变化处理器（恢复面两向 + 第三支路）
    "panel-messages.mjs",   // `_cwd()` 回落链 + `setProjectFolder` 校验（逐字未改）
    "panel-project.mjs",    // projectInfo / pickProject（多根面）
    "workspace-guard.mjs",  // 判据（单源）
  ], "workspaceFolders 读点集合 = 在册四处（新增读点 ⇒ 本条点名；经守卫模块消费不在此列）")
  const judges = files.filter((f) => /workspaceFolders\?\.length/.test(readFileSync(new URL(f, dir), "utf8")))
  assert.deepEqual(judges, ["workspace-guard.mjs"], "「文件夹非空」判定只许住守卫档（判据单源）")
})
