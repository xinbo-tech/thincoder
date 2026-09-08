/**
 * session-boot.test.mjs — SESSION-FLOW-B B2 测试（VSC 会话打开原子化——单向 boot）。
 * docs/design/SESSION-FLOW-B.md B2 节（F-B2a~c——快慢段拆/openSessionContent/会话打开
 * 原子化——AC-B2a~c + N2 红线）。
 * 组 ⑪⑫（评审 #2：chat-panel.test.mjs 485 行近 500 硬限不再追加——新文件登记 files.mjs）。
 * 手法：真实 ChatPanel 原型 + 真实模块链路（panel-session openSessionContent/loadSession/
 * pushSessions/status——不桩模块函数）+ tmp 会话/config 沙箱（session-io/config-io 测试缝
 * ——同 chat-panel.test.mjs）。桩只切 host API 面（vscode mock 缺失件局部补）；posted
 * 捕获 = webview.postMessage 记录——记参断言经 posted 载荷（真实载荷——非桩自证）。
 * Reload 真机验证 = 实现期项（N4——单元层锁"内容只在 webviewReady 后发"契约——真机走查
 * 归父侧/用户）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import { handlePanelMessage, _cwd } from "../src/extension/panel-messages.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { openSessionContent, status as bootstrapStatus } from "../src/extension/panel-session.mjs"
import { newSlot, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"

// ─── 环境隔离（真实槽/配置读写全部指向临时目录——同 chat-panel.test.mjs）───

let _tmp

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-boot-"))
  _setConfigPathForTest(join(_tmp, "config.json")) // 文件可缺席（loadRaw 缺省 {}）——migrate 会写
  _setSessionsDirForTest(join(_tmp, "sessions"))
  vscode.env.language = "en" // vscode mock 无 env.language——webviewReady 的 i18n 推送需要
  newSlot(_cwd()) // fixture 槽 1（文件在盘 + manifest 条目）——resumeSlot 各次认领确定性
})

after(() => {
  vscode.env.language = undefined
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

/** 会话内容消息族（B2 红线集——resolve/慢段不得发出其中任何一条）。 */
const CONTENT_TYPES = ["project", "autoApprove", "planMode", "clearMessages", "historyPage", "sessions"]

/**
 * 桩面板（真实原型方法——_pushStatus/_pushProject/_agentSettingsSession/_pushMcpStatus/
 * _maybePromptIndex/_status 全走 ChatPanel 原型真实实现——记参经 posted 真实载荷断言；
 * 仅 host API 缺件与状态字段实例级提供）。设计 B2.6 建议的 stub 覆盖点
 * （_agentSettingsSession/_pushStatus/_pushProject/_loadSession/_pushSessions）在此以
 * 原型真实方法替代——快段/慢段模块函数（loadSession/pushSessions/resumeSlot）为模块直调，
 * 面板级覆盖点本就不存在；真实链路跑 tmp 沙箱 = 锁定真实实现而非桩自证（强于覆盖记录）。
 */
function bootPanel(extra = {}) {
  const posted = []
  const p = Object.create(ChatPanel.prototype)
  Object.assign(p, {
    _slot: null, // 未绑槽——B2 断言点（槽绑定只在快段/webviewReady——AC-B2b/⑫）
    _agent: null,
    _autoApprove: false,
    _turnState: "idle",
    _susp: null,
    _distillController: null,
    _abortController: null,
    _statusBar: null,
    _context: {
      subscriptions: [],
      secrets: { get: async () => undefined, delete: async () => {} },
      globalState: { get: async () => undefined, update: async () => {} },
      workspaceState: { get: () => undefined, update: async () => {} },
    },
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    posted,
    ...extra,
  })
  return p
}

/** 微任务/短定时冲刷（status() 慢段的 migrate 为 async 链——单 setTimeout 足够）。 */
const settle = () => new Promise((r) => setTimeout(r, 10))

const typesOf = (p) => p.posted.map((m) => m.type)
const countType = (p, t) => typesOf(p).filter((x) => x === t).length

// ─── ⑪ 单向 boot（AC-B2a + N2 红线）───────────────

test("⑪ 单向 boot（AC-B2a/N2）：webviewReady = 四件握手先行 + 快段全量内容——clearMessages 先于 historyPage——sessions 恰一次（同 tick 无双发红线）", async () => {
  const p = bootPanel()
  await handlePanelMessage(p, { type: "webviewReady" })
  const types = typesOf(p)

  // 四件握手（C2/A 既有——:377-380 保序——零回退）恒在序列头
  assert.deepEqual(types.slice(0, 4), ["turnState", "i18n", "agentSettings", "providerStatus"],
    "四件握手先行（turnState/i18n/agentSettings/providerStatus——C2/A 序零回退）")

  // 快段内容紧随其后（全部在后半段——无内容混入握手段）
  for (const t of CONTENT_TYPES) {
    assert.ok(types.includes(t), `${t} 由快段发出`)
    assert.ok(types.indexOf(t) > 3, `${t} 在四件握手之后（快段内容不插队握手）`)
  }

  // 单向 boot 顺序（loadSession 内部序）：clearMessages → historyPage → sessions
  const iClear = types.indexOf("clearMessages")
  const iPage = types.indexOf("historyPage")
  const iSess = types.indexOf("sessions")
  assert.ok(iPage > iClear, "clearMessages 先于 historyPage（先清后灌——F-B2b 单向 boot）")
  assert.ok(iSess > iPage, "historyPage 先于 sessions（内容落定后列表刷新）")

  // N2 红线：sessions 同 tick 恰一次（F-B2c——loadSession 尾单发——无独立 pushSessions 双发）
  assert.equal(countType(p, "sessions"), 1, "sessions 恰一次（红线——同 tick 无双发）")
  for (const t of ["autoApprove", "planMode", "clearMessages", "historyPage", "project"]) {
    assert.equal(countType(p, t), 1, `${t} 恰一次`)
  }

  // 记参断言（真实载荷）：空 fixture 会话——末页空历史；列表含 fixture 槽；槽已绑定
  const hist = p.posted.find((m) => m.type === "historyPage")
  assert.deepEqual(hist.messages, [], "fixture 空会话——历史末页为空")
  assert.equal(hist.older, false, "boot 发的是末页（older=false——懒历史首屏）")
  assert.equal(hist.hasOlder, false)
  const sess = p.posted.find((m) => m.type === "sessions")
  assert.equal(sess.active, 1, "sessions.active = 绑定槽")
  assert.equal(sess.sessions.length, 1, "fixture 槽在会话列表")
  assert.equal(p._slot, 1, "槽绑定在 webviewReady 完成（快段 resumeSlot——单向 boot 落点）")
})

// ─── ⑪b resolve 零内容（AC-B2b——结构性断言）──────────

test("⑪b resolve 零内容（AC-B2b）：resolve 只触慢段——内容只在 webviewReady 后发（Reload 契约——真机 Reload 验证 = 实现期项 N4）", async () => {
  // vscode mock 缺 onDidChangeConfiguration（initStopTrace 需要）——局部补 + finally 还原
  const realOnCfg = vscode.workspace.onDidChangeConfiguration
  vscode.workspace.onDidChangeConfiguration = () => ({ dispose: () => {} })
  try {
    const p = bootPanel({
      _html: () => "<html>boot fixture</html>", // 原型 _html 需 asWebviewUri/cspSource（mock 缺）
      _initStatusBar() {}, // 原型需 window.createStatusBarItem（mock 缺）——非被测面
    })
    let listener = null
    const view = {
      webview: {
        options: {},
        html: "",
        postMessage: (m) => { p.posted.push(m); return Promise.resolve(true) },
        onDidReceiveMessage: (cb) => { listener = cb },
      },
      onDidDispose: () => {},
    }
    ChatPanel.prototype.resolveWebviewView.call(p, view, {}, {})
    await settle() // status() 慢段（async——migrate 链）冲刷

    // resolve 期：零内容（结构性断言——修 Reload 后对话区空缺陷的另一半：resolve 不再发）
    const before = typesOf(p)
    for (const t of CONTENT_TYPES) {
      assert.ok(!before.includes(t), `resolve 不发 ${t}（内容只在 webviewReady 后——AC-B2b）`)
    }
    // resolve 只触慢段：探测/设置消息在（慢段真实跑了）——但槽未绑（快段没跑）
    assert.ok(before.includes("providerStatus"), "resolve 期慢段 fullStatus 已起（头部 pushStatus）")
    assert.ok(before.includes("mcpStatus"), "resolve 期慢段 mcpStatus 已起")
    assert.ok(before.includes("i18n"), "resolve 直发 i18n 保留（握手重复推送幂等）")
    assert.equal(p._slot, null, "resolve 不绑槽（resumeSlot 只在快段——AC-B2c）")

    // Reload 握手（webview 冷启后 chat.js 发 webviewReady）→ 内容一次性落定
    assert.ok(typeof listener === "function", "resolve 注册了消息监听（webviewReady 可达）")
    await listener({ type: "webviewReady" })
    await settle()
    const after = typesOf(p)
    const iClear = after.indexOf("clearMessages")
    const iPage = after.indexOf("historyPage")
    assert.ok(iClear >= 0 && iPage > iClear, "webviewReady 后内容到位——clearMessages 先于 historyPage")
    assert.equal(countType(p, "sessions"), 1, "整条 resolve+ready 流 sessions 总恰一次（红线）")
    assert.equal(p._slot, 1, "握手后槽绑定完成")
  } finally {
    vscode.workspace.onDidChangeConfiguration = realOnCfg
  }
})

// ─── ⑫ 快慢段分离（AC-B2c）────────────────────

test("⑫ 快慢段分离（AC-B2c）：快段 openSessionContent 调用链 pushProject→loadSession（记参断言）——慢段 status 不含 loadSession/不绑槽", async () => {
  // 快段（webviewReady case 的调用对象——直接入口）
  const f = bootPanel()
  openSessionContent(f)
  let types = typesOf(f)
  const iProj = types.indexOf("project")
  const iClear = types.indexOf("clearMessages")
  const iPage = types.indexOf("historyPage")
  const iSess = types.indexOf("sessions")
  assert.ok(iProj >= 0 && iProj < iClear && iClear < iPage && iPage < iSess,
    "快段调用链序：pushProject → loadSession 内容（clearMessages→historyPage）→ sessions")
  assert.equal(countType(f, "sessions"), 1, "快段 sessions 恰一次（F-B2c——loadSession 尾单发——无独立 pushSessions）")
  const proj = f.posted.find((m) => m.type === "project")
  assert.equal(proj.multi, false, "记参断言——projectInfo 载荷（multi = mock 单根 false）")
  assert.equal(typeof proj.current, "string", "project.current 为 cwd 串")
  const hist = f.posted.find((m) => m.type === "historyPage")
  assert.deepEqual(hist, { type: "historyPage", messages: [], hasOlder: false, older: false },
    "记参断言——loadSession → historyWindow 末页载荷（messages/hasOlder/older 全参）")
  assert.ok(!types.includes("providerStatus") && !types.includes("mcpStatus"),
    "快段不含慢段产物（providerStatus/mcpStatus 不在——探测未在快段跑）")
  assert.equal(f._slot, 1, "快段绑槽（resumeSlot）")

  // 慢段（status——resolve 期入口——直接调用）
  const s = bootPanel()
  await bootstrapStatus(s)
  types = typesOf(s)
  for (const t of CONTENT_TYPES) {
    assert.ok(!types.includes(t), `慢段不含 ${t}（无 loadSession/无 pushProject——AC-B2c）`)
  }
  assert.ok(types.includes("providerStatus"), "慢段跑 fullStatus（头部 pushStatus——探测在慢段）")
  assert.ok(types.includes("mcpStatus"), "慢段跑 mcpStatus")
  assert.equal(s._slot, null, "慢段不绑槽（resumeSlot 只在快段——AC-B2c）")
})
