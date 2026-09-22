/**
 * session-boot.test.mjs — SESSION-FLOW-B B2 测试（VSC 会话打开原子化——单向 boot）。
 * docs/design/SESSION-FLOW-B.md B2 节（F-B2a~c——快慢段拆/openSessionContent/会话打开
 * 原子化——AC-B2a~c + N2 红线）。
 * 组 ⑪⑫（评审 #2：chat-panel.test.mjs 485 行近 500 硬限不再追加——新文件登记 files.mjs）。
 * 组 ⑬（SESSION-RESTORE-PARITY H/AC）· 组 ⑭（F-MI7 槽绑定束：零探测冷路径 / 解析缓存
 * 写穿 / 空槽写面短路——批档 2026-09-18-init-block §5 续轮）· 组 ⑮⑯（他端活槽不收养——
 * SESSION.md §6.15 P3/P4：switchSession / deleteSession 的 marker + 解析缓存收敛；组 ⑮ 兼
 * F-CR2 四不动——SESSION-CLAIM 批：受占拒绝路径共享指针 / 认领集零动）。
 * 手法：真实 ChatPanel 原型 + 真实模块链路（panel-session openSessionContent/loadSession/
 * pushSessions/status——不桩模块函数）+ tmp 会话/config 沙箱（session-io/config-io 测试缝
 * ——同 chat-panel.test.mjs）。桩只切 host API 面（vscode mock 缺失件局部补）；posted
 * 捕获 = webview.postMessage 记录——记参断言经 posted 载荷（真实载荷——非桩自证）。
 * Reload 真机验证 = 实现期项（N4——单元层锁"内容只在 webviewReady 后发"契约——真机走查
 * 归父侧/用户）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import { handlePanelMessage, _cwd } from "../src/extension/panel-messages.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { openSessionContent, loadOlder, ensureSlot, ensureSlotAsync, saveLines, deleteSession, status as bootstrapStatus } from "../src/extension/panel-session.mjs"
import { newSlot, loadSlot, saveSessionToSlot, cachedSlot, loadManifest, saveManifest, readEndMarker, slotOccupancy, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
import { _setProcessProbeTestImpl, _resetProcessProbeTestImpl } from "@thincoder/core/process-probe.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"

// ─── 环境隔离（真实槽/配置读写全部指向临时目录——同 chat-panel.test.mjs）───

let _tmp

before(async () => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-boot-"))
  _setConfigPathForTest(join(_tmp, "config.json")) // 文件可缺席（loadRaw 缺省 {}）——migrate 会写
  _setSessionsDirForTest(join(_tmp, "sessions"))
  vscode.env.language = "en" // vscode mock 无 env.language——webviewReady 的 i18n 推送需要
  await newSlot(_cwd()) // fixture 槽 1（文件在盘 + manifest 条目）——resumeSlot 各次认领确定性
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
  await openSessionContent(f)
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

test("⑬ 真实形状非空 history：首窗 200 + hasOlder（AC-H）——模型/序/turnStart/配对/剔除 + loadOlder 越页配对（⑪⑫ 零破坏——追加末位）", async () => {
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
  await openSessionContent(p)
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
  await openSessionContent(p)
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

// ─── ⑭ F-MI7 槽绑定束（零探测冷路径 / 解析缓存写穿 / 空槽写面短路）────────────

test("⑭ 零探测冷路径（F-MI7）：未解析 ⇒ ensureSlot 同步返 null（不等 exec）+ 后台收敛绑槽；解析缓存写穿 ⇒ 零探测直返；saveLines 遇 null 短路（零 .null 槽文件）", async () => {
  // 冷起点：换沙箱目录 = 解析缓存整体失效（session-io 沙箱缝）——无 manifest ⇒ 全新认领
  const dir2 = join(_tmp, "sessions2")
  _setSessionsDirForTest(dir2)
  const cwd = _cwd()
  assert.equal(cachedSlot(cwd), null, "沙箱缝清缓存（冷起点）")

  const p1 = bootPanel({ _slot: null })
  assert.equal(ensureSlot(p1), null, "① 冷路径同步返 null——零探测（绝不同步等 exec）")
  assert.equal(p1._slot, null, "① 同步面不绑槽（收敛在后台）")

  // ② 空槽写面短路（坑位 §5 第 1 条）：不抛、不落 `.null` 槽文件（`saveSlotData(cwd, null, …)` 会写坏文件）
  saveLines(p1, [], [], {}, undefined)
  const coldFiles = existsSync(dir2) ? readdirSync(dir2) : [] // 短路连沙箱目录都不建 ⇒ 缺目录亦满足「零写」
  assert.ok(!coldFiles.some((f) => f.includes(".null")), "② saveLines 冷短路——零 .null 槽文件（目录缺 ⇒ 更零写）")

  // ③ 后台收敛：resumeSlot 认领 ⇒ 面板绑槽 + 解析缓存写穿（供下一次零探测直返）
  for (let i = 0; i < 50 && p1._slot == null; i++) await settle()
  const bound = p1._slot
  assert.ok(typeof bound === "number" && bound >= 1, "③ 后台收敛绑槽（resumeSlot 认领）")
  assert.equal(cachedSlot(cwd), bound, "③ 认领写穿解析缓存")

  // ④ 缓存直返（零探测——同步路径 + awaited 路径同槽）
  const p2 = bootPanel({ _slot: null })
  assert.equal(ensureSlot(p2), bound, "④ 冷路径命中缓存同步直返")
  assert.equal(await ensureSlotAsync(p2), bound, "④ awaited 认领路径同槽（已绑定直返）")

  _setSessionsDirForTest(join(_tmp, "sessions")) // 还原沙箱（缝亦清缓存）
})

// ─── ⑮⑯ 他端活槽不收养（SESSION.md §6.15 P3/P4——批档 2026-09-18-init-block fix 轮 4）──────

/** 伪造他端活属主（pid 42424 + 产品命令行 ⇒ ownerState = "alive"——判据单源）：
 *  注入缝 = 核 process-probe（批量语义；`_resetProcessProbeTestImpl()` 清除）。
 *  读面 slotOccupancy（同步束）与恢复面 resumeSlot（异步束）同缝查表。 */
const OTHER_PID = 42424
const stubLiveOther = () => _setProcessProbeTestImpl({
  aliveFn: (pids) => new Set([...pids].filter((p) => p === OTHER_PID)),
  cmdlineFn: (pids) => new Map([...pids].map((p) => [p, "node bin/thincoder.cjs"])),
})

/** 他端槽 fixture：文件 + 条目 + 属主 = 伪造活进程（本进程 ≠ 该 sessionId）。 */
function foreignSlot(cwd, slot) {
  saveSessionToSlot(cwd, slot, {
    version: 2, cwd, title: "", updatedAt: Date.now(),
    history: [{ role: "user", content: "other-end", ts: 1 }],
    contextHistory: [], sessionStart: null,
  })
  const m = loadManifest(cwd)
  m.slotSessions = { ...(m.slotSessions ?? {}), [slot]: `${OTHER_PID}-other-end` }
  saveManifest(cwd, m)
}

test("⑮ 切到被占目标槽（SESSION.md §6.15 P3/P4 · F-CR2 四不动）：switchSession 不写本端记录（marker 保持原槽）+ 不污染解析缓存 + 面板回自身槽（不钉占槽）；共享 active 指针 / 认领集零动（判据前置）", async () => {
  _setSessionsDirForTest(join(_tmp, "sessions3"))
  const cwd = _cwd()
  try {
    assert.equal(await newSlot(cwd), 1, "fixture：本端槽 1（newSlot 写穿 marker + 缓存）")
    assert.equal(cachedSlot(cwd), 1, "fixture：解析缓存 = 1")
    foreignSlot(cwd, 2)
    stubLiveOther()
    assert.equal(slotOccupancy(cwd, 2).occupied, true, "fixture：槽 2 判占用（他端活属主）")
    const before = loadManifest(cwd) // F-CR2 四不动基准（拒绝前态）

    const p = bootPanel({ _slot: 1 })
    const warned = []
    const realWarn = vscode.window.showWarningMessage
    vscode.window.showWarningMessage = async (m) => { warned.push(m) }
    try {
      await handlePanelMessage(p, { type: "switchSession", slot: 2 })
    } finally {
      vscode.window.showWarningMessage = realWarn
    }

    // F-CR2（SESSION-CLAIM 批 · §6.15 / §6.16）：受占 ⇒ 判据前置、不进入 switchToSlot——
    // 共享指针与认领集与前态逐字段相等。
    const after = loadManifest(cwd)
    assert.equal(after.active, before.active, "F-CR2 四不动：共享 active 指针零动（判据前置——不进入 switchToSlot）")
    assert.deepEqual(after.slotSessions, before.slotSessions, "F-CR2 四不动：认领集零动（不认领占槽）")
    assert.equal(readEndMarker(cwd).slot, 1, "P4：本端记录保持原槽 1（被占 ⇒ 不写他端槽 marker）")
    assert.equal(cachedSlot(cwd), 1, "P3：解析缓存保持原槽 1（被占 ⇒ 不收养占槽）")
    assert.equal(p._slot, 1, "P3：面板不钉占槽——loadSession 经缓存绑回自身槽 1")
    assert.equal(warned.length, 1, "占用提示恰一次")
    assert.match(warned[0], /is being used by another live process/, "占用文案（不收养）")
    assert.equal(loadManifest(cwd).slotSessions[2], `${OTHER_PID}-other-end`, "不认领占槽（slotSessions[2] 仍是伪造属主——精确比对，非子串启发式）")
  } finally {
    _resetProcessProbeTestImpl()
    _setSessionsDirForTest(join(_tmp, "sessions")) // 还原沙箱（缝亦清缓存）
  }
})

test("⑯ 删本端绑定槽（SESSION.md §6.15 P3/P4）：面板不收养幸存 active（他端活槽）+ 不写其本端记录 + 解析缓存不残留——重解析 = 全新分配（不粘占槽 / 不复活被删槽）", async () => {
  _setSessionsDirForTest(join(_tmp, "sessions4"))
  const cwd = _cwd()
  try {
    assert.equal(await newSlot(cwd), 1, "fixture：本端槽 1")
    foreignSlot(cwd, 2)
    // 他端（CLI）把共享指针切到槽 2：删本端槽时 m.active 指向他端活槽（幸存指针的由来）
    saveManifest(cwd, { ...loadManifest(cwd), active: 2 }, null, { setActive: true })
    stubLiveOther()

    const p = bootPanel({ _slot: 1 })
    await deleteSession(p, 1)

    assert.equal(p._slot, null, "P3：面板不收养幸存 active（不钉他端占槽 2）")
    assert.equal(readEndMarker(cwd).slot, null, "P4：删本端槽 ⇒ 本端记录显式置空（不写他端占槽）")
    assert.equal(cachedSlot(cwd), null, "P3：解析缓存随删槽收敛（不残留他端占槽）")

    // 重解析收敛：resumeSlot 见显式 slot:null ⇒ allocateFresh（新号——不粘 2、不复活 1）
    for (let i = 0; i < 50 && p._slot == null; i++) await settle()
    assert.equal(await ensureSlotAsync(p), 3, "重解析 = max+1 全新分配（槽 2 他端占 / 槽 1 刚删）")
    assert.equal(readEndMarker(cwd).slot, 3, "重解析写本端记录 = 新槽 3（不写他端占槽）")
    assert.equal(loadManifest(cwd).active, 3, "共享 active 随认领翻新槽")
    assert.ok(loadSlot(cwd, 2), "他端槽 2 未被触碰（文件仍在盘）")
    assert.ok(!loadSlot(cwd, 1), "被删槽 1 未复活（文件不在盘）")
  } finally {
    _resetProcessProbeTestImpl()
    _setSessionsDirForTest(join(_tmp, "sessions")) // 还原沙箱（缝亦清缓存）
  }
})

// ─── ⑰ 受占 TOCTOU 第二判（台账 #171 · SESSION.md §6.15 / §6.16）────────────────

test("⑰ 前置判据与函数内判据之间的 TOCTOU 窗（台账 #171）：收到受占信号 ⇒ 面板保持 _slot 现值（不钉他端活槽）+ 提示 + 重绑本端原槽", async () => {
  _setSessionsDirForTest(join(_tmp, "sessions5"))
  const cwd = _cwd()
  try {
    assert.equal(await newSlot(cwd), 1, "fixture：本端槽 1")
    foreignSlot(cwd, 2)
    // TOCTOU 窗：前置判据（第一次占用探测）判空闲（判死）⇒ 进入 switchToSlot；函数内判据（第二次）
    // 撞占（判活）——同槽两判结果不同 = 窗内他端认领的真实形态。
    let probes = 0
    _setProcessProbeTestImpl({
      aliveFn: (pids) => { probes += 1; return probes >= 2 ? new Set(pids) : new Set() },
      cmdlineFn: (pids) => new Map([...pids].map((p) => [p, "node bin/thincoder.cjs"])),
    })
    const before = loadManifest(cwd)
    const markerBefore = readEndMarker(cwd).slot

    const p = bootPanel({ _slot: 1 })
    const warned = []
    const realWarn = vscode.window.showWarningMessage
    vscode.window.showWarningMessage = async (m) => { warned.push(m) }
    try {
      await handlePanelMessage(p, { type: "switchSession", slot: 2 })
    } finally {
      vscode.window.showWarningMessage = realWarn
    }

    assert.ok(probes >= 2, "两判各自探测一次（窗确实存在——非空转）")
    assert.equal(p._slot, 1, "第二判路载荷 = **保持 _slot 现值**（不钉他端活槽 2）")
    assert.equal(warned.length, 1, "受占提示恰一次")
    assert.match(warned[0], /is being used by another live process/, "提示文案（与前置判据路同款）")
    const after = loadManifest(cwd)
    assert.equal(after.active, before.active, "零写：共享 active 指针零动（受占分支不翻）")
    assert.deepEqual(after.slotSessions, before.slotSessions, "零写：认领集零动（不认领占槽 2）")
    assert.equal(after.slotSessions[2], `${OTHER_PID}-other-end`, "他端占槽认领零动（精确比对）")
    assert.equal(readEndMarker(cwd).slot, markerBefore, "零写：本端记录零动")
    assert.equal(cachedSlot(cwd), 1, "零写：解析缓存保持原槽 1")
  } finally {
    _resetProcessProbeTestImpl()
    _setSessionsDirForTest(join(_tmp, "sessions")) // 还原沙箱（缝亦清缓存）
  }
})
