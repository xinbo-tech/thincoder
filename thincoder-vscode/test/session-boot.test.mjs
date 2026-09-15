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
import { openSessionContent, loadOlder, status as bootstrapStatus } from "../src/extension/panel-session.mjs"
import { newSlot, loadSlot, saveSessionToSlot, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"

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

// ─── ⑬ 真实形状非空 history（SESSION-RESTORE-PARITY H/AC——评审 #3 补 ⑪ 空 fixture 缺口）──

/** 交替 user（偶 idx）/assistant（奇 idx）填充 [from, to]——真实形状（role 键 + pushReal 打点 ts）。 */
function fillAlt(from, to) {
  const out = []
  for (let i = from; i <= to; i++) {
    out.push(i % 2 === 0
      ? { role: "user", content: `user-${i}`, ts: 1000 + i }
      : { role: "assistant", content: `assistant-${i}`, ts: 2000 + i })
  }
  return out
}

const toolCall = (id, name, args) => ({ id, type: "function", function: { name, arguments: args } })
const toolMsg = (id, content) => ({ role: "tool", tool_call_id: id, name: "bash", content, ts: 3000 })

function writeFixture(history) {
  const cwd = _cwd()
  const disk = loadSlot(cwd, 1) ?? { version: 2, cwd, sessionStart: new Date().toISOString(), contextHistory: [], title: "" }
  saveSessionToSlot(cwd, 1, { ...disk, history }) // 字段往返 spread——sessionStart 不变防 F2 轮转
}

const historyPages = (p) => p.posted.filter((m) => m.type === "historyPage")

function assertPageShape(page, firstIdx, count, hasOlder, older, idxList) {
  assert.equal(page.messages.length, count, `页 ${count} 条消息`)
  assert.equal(page.hasOlder, hasOlder, "hasOlder 标志")
  assert.equal(page.older, older, "older 标志（boot 末页 false / loadOlder 旧页 true）")
  const want = idxList ?? Array.from({ length: count }, (_, k) => firstIdx + k)
  assert.deepEqual(page.messages.map((m) => m.idx), want, "idx = 全局原始下标（永不复编号）")
}

test("⑬ 真实形状非空 history：首窗 200 + hasOlder（AC-H）——模型/序/turnStart/配对/剔除 + loadOlder 越页配对（⑪⑫ 零破坏——追加末位）", () => {
  // fixture A：406 条——前段 [0,6) 含 reminder/纯工具回合帧（reasoning + 配对）/夹帧，尾 400 条交替
  const fixtureA = [
    { role: "user", content: "hello zero", ts: 10 },
    { role: "user", content: "[System reminder: git context]", ts: 11 },
    { role: "assistant", content: "mid", ts: 12 },
    { role: "assistant", content: null, reasoning_content: "planning", tool_calls: [toolCall("c1", "bash", '{"cmd":"ls"}')], ts: 13 },
    toolMsg("c1", "res-4"),
    { role: "user", content: "fifth", ts: 15 },
    ...fillAlt(6, 405),
  ]
  writeFixture(fixtureA)
  const p = bootPanel()
  openSessionContent(p)
  let pages = historyPages(p)
  assertPageShape(pages[0], 206, 200, true, false) // 首页 = 200（评审 #3——>200 fixture 首页 200 断言）
  assert.deepEqual(pages[0].messages.map((m) => m.kind).slice(0, 4), ["user", "assistant", "user", "assistant"], "尾段模型/序（user/assistant 交替）")
  assert.equal(pages[0].messages[0].text, "user-206")
  assert.equal(pages[0].messages[0].timestamp, 1000 + 206, "ts 经磁盘往返透传")
  assert.ok(pages[0].messages.every((m) => m.kind === "user" || m.kind === "assistant"), "首窗无独立 tool 消息（被消费条目随帧）")
  assert.ok(pages[0].messages.filter((m) => m.kind === "assistant").every((m) => m.turnStart === true), "交替尾段——每 assistant 帧都是新回合（turnStart）")
  assert.ok(pages[0].messages.every((m) => m.reasoning == null && (!m.tools || m.tools.length === 0)), "首窗帧无 reasoning/无工具（干净尾段）")

  // 第二页 [6,206)——滚回一页（loadOlder）
  loadOlder(p, 206)
  pages = historyPages(p)
  assertPageShape(pages[1], 6, 200, true, true)
  assert.equal(pages[1].messages[0].text, "user-6")

  // 第三页 [0,6)——剔除/夹帧 turnStart/配对/reasoning 全链（真实文件 → historyWindow）
  loadOlder(p, 6)
  pages = historyPages(p)
  assertPageShape(pages[2], 0, 4, false, true, [0, 2, 3, 5]) // reminder@1 与 tool@4（被消费）不占位
  assert.deepEqual(pages[2].messages[0], { kind: "user", text: "hello zero", timestamp: 10, idx: 0 }, "u0 原样")
  assert.deepEqual(pages[2].messages[1], { kind: "assistant", text: "mid", reasoning: null, timestamp: 12, idx: 2, turnStart: true, tools: [] }, "a2——reminder 夹帧间不重置（可见前驱 u0）")
  assert.deepEqual(pages[2].messages[2], {
    kind: "assistant", text: null, reasoning: "planning", timestamp: 13, idx: 3, turnStart: false,
    tools: [{ id: "c1", name: "bash", args: '{"cmd":"ls"}', result: "res-4" }],
  }, "纯工具回合帧——reminder 后不重置（可见前驱 a2）+ reasoning 透传 + 配对随帧（AC-A/C/E/B）")
  assert.deepEqual(pages[2].messages[3], { kind: "user", text: "fifth", timestamp: 15, idx: 5 }, "u5")
  assert.ok(pages[2].messages.every((m) => m.kind !== "user" || !m.text.startsWith("[System reminder:")), "reminder 零出现（C 剔除）")

  // fixture B：408 条——帧 F@204（双调用）的 tool 结果 @205/@206 跨在 loadOlder 窗口边界
  const fixtureB = [
    ...fillAlt(0, 203),
    { role: "assistant", content: null, tool_calls: [toolCall("c9", "bash", "{}"), toolCall("c10", "bash", "{}")], ts: 13 },
    toolMsg("c9", "res9"),
    toolMsg("c10", "res10"),
    ...fillAlt(207, 407),
  ]
  writeFixture(fixtureB)
  openSessionContent(p)
  pages = historyPages(p)
  assertPageShape(pages[3], 208, 200, true, false) // 尾窗干净 200（跨页结果在上一窗区域）
  assert.equal(pages[3].messages[0].idx, 208)

  // loadOlder(before=205)：窗口 [5,205) 末帧 F@204——其结果 @205/@206 在窗口末界后——
  // 照样配对入帧（规则 4 越页配对——半开区间 [s,e) 防重渲染）
  loadOlder(p, 205)
  pages = historyPages(p)
  assertPageShape(pages[4], 5, 200, true, true)
  assert.ok(pages[4].messages.every((m) => m.kind !== "tool"), "被消费 tool 条目不独立产消息（跨页——防双显）")
  const f = pages[4].messages[199]
  assert.equal(f.idx, 204, "末帧在页尾")
  assert.deepEqual(f.tools, [{ id: "c9", name: "bash", args: "{}", result: "res9" }, { id: "c10", name: "bash", args: "{}", result: "res10" }], "F 的未配调用消费窗口末界后紧邻 tool 条目（越页配对）")

  // 真实锚点（webview 最小已渲染 data-idx=208）路径同样成立——结果随帧同页
  loadOlder(p, 208)
  pages = historyPages(p)
  const f2 = pages[5].messages.find((m) => m.idx === 204)
  assert.ok(f2, "F@204 在 [8,208) 页内")
  assert.deepEqual(f2.tools.map((t) => t.result), ["res9", "res10"], "真实 loadOlder 锚路径配对不变")
  assert.ok(pages[5].messages.every((m) => m.kind !== "tool"), "结果随帧——无独立 tool 消息（防双显）")
})
