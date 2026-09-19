/**
 * activity-live-visibility.test.mjs — VSC 子代理 live 块可见性批（2026-09-19 · 台账 #94）机器验收。
 * 设计权威：`docs/vsc/design/WEBVIEW.md` §5.3（T-A16–T-A32 · 机制单源）/ §5.5 / §6（D-W25–D-W31）；
 * 批次档 `docs/batches/2026-09-18-vsc-subagent-live-visibility.md` §2。真分发路径（禁夹具手写
 * 载荷）：host 侧真 token 串过真 `relaySubagentEventToken` / `relaySubagentContentChunk` → 捕获
 * 载荷喂真 webview 模块（`applySubagentStatus` / `streaming.subagentChunk` / `ensureBlock`）。
 * 修前红（实施轮实测原文见批次档 §5）：T-A16–T-A22 · T-A24–T-A31 红；T-A23 红（`scroll` 不在
 * 监听集）；T-A32 行为面绿（反例保持）+ 痕面红。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import files from "./files.mjs"
import { relaySubagentEventToken, relaySubagentContentChunk, buildPanelCallbacks, flushSubagentOutbox, WV_OUTBOX_MAX } from "../src/extension/panel-callbacks.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { loadSession } from "../src/extension/panel-session.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { newSlot, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

const RS = "\x1e", MAX = Number.MAX_SAFE_INTEGER // ⟦ev⟧ 载荷分隔符 / 滚动超值
let _tmp, _logDir, captured, cleanupEnv

before(async () => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-live-vis-"))
  _logDir = join(_tmp, "logs")
  _setConfigPathForTest(join(_tmp, "config.json"))
  _setSessionsDirForTest(join(_tmp, "sessions"))
  process.env.THINCODER_LOG_DIR = _logDir // logEvent 写门（NODE_TEST_CONTEXT 下默认跳过）
  vscode.env.language = "en" // vscode mock 无 env.language（resolveWebviewView 的 i18n 推送需要）
  await newSlot("/proj") // fixture 槽（loadSession 真读盘）
  const env = setupWebview()
  captured = env.capturedPosts
  cleanupEnv = env.cleanup
  installChatFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  vscode.env.language = undefined
  delete process.env.THINCODER_LOG_DIR
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  cleanupEnv()
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

/** 桩面板（真 ChatPanel 原型——方法面真实；`_wvReady` 缺省就绪 ⇒ 直投，false ⇒ 入队）。 */
function stubPanel(extra = {}) {
  const posted = []
  const p = Object.create(ChatPanel.prototype)
  Object.assign(p, {
    _slot: null, _agent: null, _turnState: "idle", _susp: null, _statusBar: null, _questionQueue: [], _permissionQueue: [],
    _context: {
      subscriptions: [],
      secrets: { get: async () => undefined, delete: async () => {} }, globalState: { get: async () => undefined, update: async () => {} },
      workspaceState: { get: () => undefined, update: async () => {} },
    },
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _wvReady: true,
  }, extra)
  p.posted = posted
  return p
}

/** 池 fixture（与 ⏹ 路由 / 存活投影同源形状）。 */
const liveLines = () => ({ history: { _asyncSubagents: new Map([["41", { id: 41, role: "explore", status: "running", pool: true, model: "glm-5.3", startedAt: 111 }]]) }, fullHistory: [], cwd: "/proj" })

/** logEvent 行读取（THINCODER_LOG_DIR 隔离目录——单日文件）。 */
function logEvents(ev) {
  let names = []
  try { names = readdirSync(_logDir) } catch { return [] }
  const out = []
  for (const n of names) for (const line of readFileSync(join(_logDir, n), "utf8").split("\n")) {
    if (!line.trim()) continue
    try { const e = JSON.parse(line); if (!ev || e.ev === ev) out.push(e) } catch { /* 半行忽略 */ }
  }
  return out
}

/** 真 token 串 → 真 relay → 载荷数组（生产 token 文法）。 */
function viaToken(p, tok) {
  const n = p.posted.length
  assert.equal(relaySubagentEventToken(p, tok), true, `token 识别：${tok}`)
  return p.posted.slice(n)
}

/** webview 侧真模块组（module cache——每文件一次）+ 逐测冷启复位（同文件串行共享 S/ctx）。 */
async function wv() {
  const state = await import("../webview/state.js")
  const activity = await import("../webview/activity.js")
  const streaming = await import("../webview/streaming.js")
  const diag = await import("../webview/activity-diag.js")
  const ui = await import("../webview/ui.js")
  const env = { S: state.S, ctx: state.ctx, diag, ui, subagentChunk: streaming.subagentChunk, ...activity }
  env.ctx.messagesEl.replaceChildren()
  env.ctx.activityEl.replaceChildren()
  env.S._subBlocks.clear()
  env.S._subDescShown = true // 说明行一次性标志（该面另有专档）
  env.ctx._pinBottom = undefined
  env.ctx._pinActivity = undefined
  env.diag.resetSubTrace()
  return env
}

const traces = (env) => env.diag.subTraceEntries()
const subMsg = (status, role, id, extra = {}) => ({ type: "subagent", status, role, id, ...extra })
/** 几何桩（happy-dom 无布局——activity-live-ux 同款）。 */
function geometry(el, scrollHeight, clientHeight) {
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true })
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true })
}
const heartbeat = () => import("../src/extension/panel-messages.mjs") // 心跳面（D-W20/D-W21——动态 import）

test("T-A16 出生闸①：冻结键 + 新代 started（真分发）——新块 + 旧 awaiting 归档 + takeover 痕", async () => {
  const env = await wv()
  env.applySubagentStatus(subMsg("started", "explore", 7, { pool: true, model: "glm-5.3" }))
  const old = env.S._subBlocks.get("sub:explore#7")
  env.applySubagentStatus(subMsg("settled", "explore", 7))
  assert.equal(old._subMeta.frozen, true, "前置：键已冻结（awaitingDigest 驻留）")
  const p = stubPanel()
  for (const m of viaToken(p, "explore#7/[model]m")) env.applySubagentStatus(m)
  assert.equal(p.posted.at(-1).type, "subagent", "直投（就绪态）")
  const next = env.S._subBlocks.get("sub:explore#7")
  assert.ok(next && next !== old, "新代块（修前红：ensureBlock 返 null ⇒ 零块）")
  assert.equal(next._subMeta.frozen, false, "新块 live（_subMeta.frozen === false）")
  assert.equal(old.parentNode, env.ctx.messagesEl, "旧 awaitingDigest 块归档（C-5③）")
  assert.ok(traces(env).some((e) => e.kind === "takeover"), "takeover 痕")
  assert.ok(logEvents("ev:subdeliver").some((e) => e.action === "direct" && e.ch === "sub:explore#7"), "direct 处置留痕")
})

test("T-A17 出生闸①：冻结键 + queued——新代块 + ⏳ 头 + takeover 痕", async () => {
  const env = await wv()
  env.applySubagentStatus(subMsg("started", "explore", 7, { pool: true }))
  env.applySubagentStatus(subMsg("settled", "explore", 7))
  const p = stubPanel()
  for (const m of viaToken(p, `explore#7/⟦ev⟧queued${RS}slot${RS}1${RS}queued${RS}`)) env.applySubagentStatus(m)
  const next = env.S._subBlocks.get("sub:explore#7")
  assert.ok(next && next._subMeta.frozen === false, "新代块（修前红：丢弃且无痕）")
  assert.ok(next.querySelector(".sub-hdr").textContent.includes("⏳"), "头 [⏳ …]")
  assert.ok(traces(env).some((e) => e.kind === "takeover"), "takeover 痕")
})

test("T-A18 出生闸②：escalate started（无块）——建块 + 无 sync/async 词 + 内容落同块", async () => {
  const env = await wv()
  const p = stubPanel()
  for (const m of viaToken(p, "escalate#6/[model]glm-5.2")) env.applySubagentStatus(m)
  const block = env.S._subBlocks.get("sub:escalate#6")
  assert.ok(block, "建块 sub:escalate#6（修前红：family 门 ⇒ 零块）")
  const hdr = block.querySelector(".sub-hdr").textContent
  assert.ok(!hdr.includes("sync") && !hdr.includes("async"), `consult/escalate 无模式词（实到 ${JSON.stringify(hdr)}）`)
  const c = stubPanel()
  assert.equal(relaySubagentContentChunk(c, "text", "escalate#6/hello"), true, "内容面分流")
  env.subagentChunk(c.posted.at(-1))
  assert.ok(block.querySelector(".advisor-content").textContent.includes("hello"), "后续内容落同块")
})

test("T-A19 出生闸②：consult started（无块）——键与内容面逐字一致", async () => {
  const env = await wv()
  const p = stubPanel()
  for (const m of viaToken(p, "consult#4/[model]glm-5.2")) env.applySubagentStatus(m)
  const block = env.S._subBlocks.get("sub:consult#4")
  assert.ok(block, "建块 sub:consult#4（修前红：零块）")
  const c = stubPanel()
  relaySubagentContentChunk(c, "text", "consult#4/reply")
  assert.equal(c.posted.at(-1).name, "sub:consult#4", "内容面键（`sub:` + head）逐字一致")
  env.subagentChunk(c.posted.at(-1))
  assert.ok(block.querySelector(".advisor-content").textContent.includes("reply"), "内容落同块")
})

test("T-A20 出生闸③：sync spawn 出生（首 chunk 前）——建块 + sync 词 + 首 chunk 复用", async () => {
  const env = await wv()
  const p = stubPanel()
  for (const m of viaToken(p, "coder#2/[model]m")) env.applySubagentStatus(m) // 无 ⟦ev⟧async ⇒ pool:false
  assert.equal(p.posted.at(-1).pool, false, "载荷 pool:false（sync spawn 出生面）")
  const block = env.S._subBlocks.get("sub:coder#2")
  assert.ok(block, "spawn 即建块（修前红：零块——首 chunk 后才出）")
  assert.ok(block.querySelector(".sub-hdr").textContent.includes("sync"), "sync 词（meta.pool 派生）")
  const c = stubPanel()
  relaySubagentContentChunk(c, "text", "coder#2/first")
  env.subagentChunk(c.posted.at(-1))
  assert.equal(env.S._subBlocks.get("sub:coder#2"), block, "首 chunk 复用同块（不重挂）")
})

// ═══ 出生可见性 / 投递面 / 留痕 / 窄缝（④⑤⑥⑦——T-A21..T-A32 + 移交件）══════
test("T-A21 呈现④：未钉底 + 新块出生——区首计数钮 N=1 且 scrollTop 零改", async () => {
  const env = await wv()
  geometry(env.ctx.activityEl, 500, 200)
  env.ctx.activityEl.scrollTop = 120 // 上读位
  env.ctx._pinActivity = false
  env.ensureBlock("sub:plan#9")
  const btn = env.ctx.activityEl.querySelector(".activity-new-btn")
  assert.ok(btn, "区首计数钮（修前红：零提示）")
  assert.equal(env.ctx.activityEl.firstElementChild, btn, "钮在区首（sticky）")
  assert.ok(btn.textContent.includes("1"), `N = 1（实到 ${JSON.stringify(btn.textContent)}）`)
  assert.equal(env.ctx.activityEl.scrollTop, 120, "scrollTop 零改（不夺阅读位）")
  env.ensureBlock("sub:plan#10")
  assert.ok(env.ctx.activityEl.querySelector(".activity-new-btn").textContent.includes("2"), "第二块出生 ⇒ N 递增")
})

test("T-A22 呈现④：计数钮回底——scrollTop=MAX + 钮移除 + N 归零", async () => {
  const env = await wv()
  geometry(env.ctx.activityEl, 500, 200)
  env.ctx.activityEl.scrollTop = 60
  env.ctx._pinActivity = false
  env.ensureBlock("sub:plan#9")
  const btn = env.ctx.activityEl.querySelector(".activity-new-btn")
  assert.ok(btn, "前置：钮在位")
  btn.click()
  assert.equal(env.ctx.activityEl.scrollTop, MAX, "回底（超值写）")
  assert.equal(env.ctx._pinActivity, true, "重 pin")
  assert.equal(env.ctx.activityEl.querySelector(".activity-new-btn"), null, "钮移除")
  assert.equal((await import("../webview/activity-new.js")).activityNewCount(), 0, "N 归零")
})

test("T-A23 呈现④：`scroll` 事件维护 pin（两向几何）", async () => {
  const env = await wv()
  env.ui.initScrollFollow(env.ctx) // 生产路径（scroll.js:11 同函数）
  geometry(env.ctx.activityEl, 500, 200)
  env.ctx.activityEl.scrollTop = 280 // gap = 500-280-200 = 20 < 24 → 近底
  env.ctx.activityEl.dispatchEvent(new window.Event("scroll"))
  assert.equal(env.ctx._pinActivity, true, "近底 → 钉底（修前红：scroll 零响应）")
  env.ctx.activityEl.scrollTop = 0 // gap 300 → 远底
  env.ctx.activityEl.dispatchEvent(new window.Event("scroll"))
  assert.equal(env.ctx._pinActivity, false, "远底 → 解钉")
})

// ═══ 投递面（⑤——T-A24..T-A26）═══════════════════════════════════
test("T-A24 投递⑤：未就绪窗口内容 chunk——入队不丢 + 正收据 + flush 补投", async () => {
  const p = stubPanel({ _wvReady: false })
  assert.equal(relaySubagentContentChunk(p, "text", "explore#1/hello"), true, "内容面识别（前缀分流）")
  assert.equal(p.posted.length, 0, "未就绪零直投（修前红：直投暗窗 ⇒ 永久丢）")
  assert.equal(p._wvOutbox.length, 1, "同口入队")
  const ev = logEvents("ev:subdeliver").at(-1)
  assert.equal(ev.action, "enqueue", "enqueue 处置留痕")
  assert.equal(ev.ch, "sub:explore#1", "载荷含 ch（频道名）")
  assert.ok(logEvents("ev:subcontent").some((e) => e.ch === "sub:explore#1" && e.face === "text"), "ev:subcontent 正收据（每频道首条）")
  flushSubagentOutbox(p)
  assert.equal(p.posted.at(-1).type, "toolPanel", "就绪 flush 补投")
  assert.equal(p._wvOutbox.length, 0, "清队")
})

test("T-A25 投递⑤：两路次序（事件先于内容）——flush 序 started → toolPanel", async () => {
  const env = await wv()
  const p = stubPanel({ _wvReady: false })
  relaySubagentEventToken(p, "explore#5/⟦ev⟧async")
  relaySubagentEventToken(p, "explore#5/[model]m")
  relaySubagentContentChunk(p, "text", "explore#5/hello")
  assert.equal(p.posted.length, 0, "未就绪零直投")
  assert.equal(p._wvOutbox.length, 2, "事件 + 内容同队（修前红：内容不入队）")
  flushSubagentOutbox(p)
  assert.deepEqual(p.posted.map((m) => m.type), ["subagent", "toolPanel"], "flush 序 = started → toolPanel（块先出生再吃内容）")
  for (const m of p.posted) { if (m.type === "subagent") env.applySubagentStatus(m); else env.subagentChunk(m) }
  const block = env.S._subBlocks.get("sub:explore#5")
  assert.ok(block && block.querySelector(".advisor-content").textContent.includes("hello"), "真 webview：块出生 + 内容落块")
})

test("T-A26 投递⑤：溢出丢最旧（内容面与事件面混灌）+ drop-overflow 留痕", async () => {
  const p = stubPanel({ _wvReady: false })
  for (let i = 0; i < WV_OUTBOX_MAX + 5; i++) {
    if (i % 2 === 0) relaySubagentEventToken(p, `explore#${1000 + i}/[model]m`)
    else relaySubagentContentChunk(p, "text", `explore#${1000 + i}/chunk`)
  }
  assert.equal(p._wvOutbox.length, WV_OUTBOX_MAX, "队列不超上界（混灌）")
  assert.equal(p._wvOutboxDropped, 5, "丢计数（修前红：内容面不入队 ⇒ 无）")
  assert.ok(logEvents("ev:subdeliver").some((e) => e.action === "drop-overflow" && e.dropped === 5), "drop-overflow 留痕（溢出丢最旧）")
})

// ═══ 留痕（⑦——T-A27 ③ T-A28）═══════════════════════════════════
test("T-A27 留痕⑦：丢弃路径逐条入痕——drop-frozen / drop-tombstone / drop-unknown-role", async () => {
  const env = await wv()
  env.applySubagentStatus(subMsg("started", "explore", 5, { pool: true }))
  env.applySubagentStatus(subMsg("done", "explore", 5))
  env.subagentChunk({ name: "sub:explore#5", kind: "text", text: "late" }) // 冻结键收 chunk
  env.applySubagentStatus(subMsg("started", "explore", 6, { pool: true }))
  env.S._subBlocks.get("sub:explore#6").remove() // live tombstone
  env.subagentChunk({ name: "sub:explore#6", kind: "text", text: "late" })
  env.applySubagentStatus(subMsg("done", "bogus role", 3)) // 前置失效终态（角色段非法）
  const kinds = traces(env).map((e) => e.kind)
  assert.ok(kinds.includes("drop-frozen"), "drop-frozen（修前红：无痕）")
  assert.ok(kinds.includes("drop-tombstone"), "drop-tombstone（修前红：无痕）")
  assert.ok(kinds.includes("drop-unknown-role"), "drop-unknown-role（触发面收窄后留取）")
  assert.equal(kinds.filter((k) => k === "drop-frozen").length, 1, "内容面每频道每生命周期首条（去重）")
})

test("T-A28 留痕⑦：痕上行——批内合并 panelDiag{subTrace} → host ev:subtrace（一行）", async () => {
  const env = await wv()
  await new Promise((r) => setTimeout(r, 5)) // 清在途 flush（前测残批）
  const mark = captured.length
  env.applySubagentStatus(subMsg("started", "explore", 8, { pool: true })) // birth
  env.applySubagentStatus(subMsg("done", "explore", 8))
  env.applySubagentStatus(subMsg("started", "explore", 8, { pool: true })) // takeover
  await new Promise((r) => setTimeout(r, 5))
  const diagMsgs = captured.slice(mark).filter((m) => m.type === "panelDiag")
  assert.equal(diagMsgs.length, 1, "批内合并（最多一消息 / 批——修前红：零上行）")
  assert.equal(diagMsgs[0].kind, "subTrace")
  assert.ok(diagMsgs[0].entries.some((e) => e.kind === "birth"), "birth 正收据")
  assert.ok(diagMsgs[0].entries.some((e) => e.kind === "takeover"), "takeover 痕")
  assert.ok(diagMsgs[0].entries.every((e) => e.channel && e.at), "条目形态 { kind, channel, at }")
  await handlePanelMessage(stubPanel(), diagMsgs[0]) // host case → 主侧日志
  const lines = logEvents("ev:subtrace")
  assert.equal(lines.length, 1, "主侧日志一行")
  assert.ok(String(lines[0].kinds).includes("takeover"), "痕族随行")
})

// ═══ 窄缝（⑥——T-A29..T-A31）+ 反例（T-A32）+ 移交件 ════════════════
test("T-A29 ⑥：view dispose 清队留痕——discard-dispose（+ 心跳停拍）", async () => {
  const realOnCfg = vscode.workspace.onDidChangeConfiguration
  vscode.workspace.onDidChangeConfiguration = () => ({ dispose: () => {} })
  try {
    const q = stubPanel({ _html: () => "<html>vis fixture</html>", _initStatusBar() {}, _status() {}, _wvReady: false })
    let disposeCb = null
    const view = { webview: { options: {}, html: "", postMessage: () => Promise.resolve(true), onDidReceiveMessage: () => {} }, onDidDispose: (cb) => { disposeCb = cb } }
    ChatPanel.prototype.resolveWebviewView.call(q, view, {}, {})
    const hb = await heartbeat()
    hb.startLiveHeartbeat(q)
    q._wvOutbox = [{ type: "subagent", status: "done", id: 9 }] // 待投残余（暗窗口）
    const mark = logEvents("ev:subdeliver").length
    assert.ok(typeof disposeCb === "function", "resolveWebviewView 注册了 view 销毁回调")
    disposeCb()
    assert.equal(q._wvReady, false, "dispose 关闸")
    assert.deepEqual(q._wvOutbox, [], "清队（语义不变——跨 view 不串味）")
    const ev = logEvents("ev:subdeliver").slice(mark).find((e) => e.action === "discard-dispose")
    assert.equal(ev?.n, 1, "discard-dispose 留痕（修前红：清队无痕）")
    hb.stopLiveHeartbeat(q)
  } finally {
    vscode.workspace.onDidChangeConfiguration = realOnCfg
  }
})

test("T-A30 ⑥：sync spawn 工具返回 ⇒ 块冻结（第 4 参）·无该参零动作", async () => {
  const env = await wv()
  env.applySubagentStatus(subMsg("started", "coder", 2, { model: "m" })) // sync 块（pool:false）
  const block = env.S._subBlocks.get("sub:coder#2")
  const p = stubPanel()
  const cbs = buildPanelCallbacks(p, { cwd: "/proj" })
  cbs.onToolResult("spawn", "report text", "call-1", "coder#2")
  const subs = p.posted.filter((m) => m.type === "subagent")
  assert.equal(subs.length, 1, "第 4 参在 ⇒ 补 done（修前红：零动作——块永不折叠）")
  assert.deepEqual([subs[0].status, subs[0].role, subs[0].id], ["done", "coder", 2], "done 载荷（键拆解）")
  for (const m of subs) env.applySubagentStatus(m)
  assert.equal(block._subMeta.frozen, true, "块冻结")
  assert.equal(block.parentNode, env.ctx.messagesEl, "归档落流")
  cbs.onToolResult("read", "out", "call-2") // 无第 4 参形（async ack / 普通工具）
  assert.equal(p.posted.filter((m) => m.type === "subagent").length, 1, "无该参零 subagent 载荷")
})

test("T-A31 ⑥/②：consult 终态无块 ⇒ 补桩（射程收正——原 drop-unknown-role）", async () => {
  const env = await wv()
  const p = stubPanel()
  for (const m of viaToken(p, "consult#4/⟦ev⟧done")) env.applySubagentStatus(m)
  const stub = env.S._subBlocks.get("sub:consult#4")
  assert.ok(stub, "补桩（修前红：drop-unknown-role、不补）")
  assert.equal(stub._subMeta.frozen, true, "桩 = 已折叠")
  assert.equal(stub.parentNode, env.ctx.messagesEl, "立即归档（流内可见）")
  assert.ok(traces(env).some((e) => e.kind === "late-terminal-stub"), "late-terminal-stub 痕")
})

test("T-A32 反例（NFR-A1）：冻结键收 chunk 不复活——零新块 / 零 append / 原块不变", async () => {
  const env = await wv()
  env.applySubagentStatus(subMsg("started", "explore", 5, { pool: true }))
  const block = env.S._subBlocks.get("sub:explore#5")
  env.applySubagentStatus(subMsg("done", "explore", 5))
  const content = block.querySelector(".advisor-content").textContent
  env.subagentChunk({ name: "sub:explore#5", kind: "text", text: "late" })
  assert.equal(env.S._subBlocks.get("sub:explore#5"), block, "键仍指原块（不复活重建）")
  assert.equal(env.ctx.activityEl.querySelectorAll(".sub-block").length, 0, "零新块（区）")
  assert.equal(block.parentNode, env.ctx.messagesEl, "原块位置不变（归档不动）")
  assert.equal(block.querySelector(".advisor-content").textContent, content, "原块内容不变（零 append）")
  assert.ok(traces(env).some((e) => e.kind === "drop-frozen"), "drop-frozen 痕（本批新增——反例行为面保持）")
})

test("T-A6/T-A7 移交件：心跳起停 + 未就绪不堆事件 + 切会话源新鲜度（n ≡ 0）", async () => {
  const hb = await heartbeat()
  const p = stubPanel({ _wvReady: false, _liveLines: liveLines() })
  const before0 = logEvents("ev:subreassert").length
  assert.equal(hb.liveHeartbeatBeat(p), 0, "未就绪跳过（零投递、零队列增长）")
  assert.equal(p.posted.length, 0, "零投递")
  assert.equal(p._wvOutbox, undefined, "零队列增长")
  assert.equal(logEvents("ev:subreassert").length, before0, "空拍零留痕（n=0）")
  p._wvReady = true
  assert.equal(hb.liveHeartbeatBeat(p), 1, "就绪后重发存活投影（池条目 1 条）")
  assert.equal(p.posted.length, 1, "投影载荷直投")
  assert.equal(logEvents("ev:subreassert").at(-1)?.n, 1, "n 变化即记（心跳摘要行）")
  const t1 = hb.startLiveHeartbeat(p)
  assert.ok(t1, "起拍（unref——不阻进程退出）")
  assert.equal(hb.startLiveHeartbeat(p), t1, "起拍幂等（同面板单拍）")
  hb.stopLiveHeartbeat(p)
  // 源新鲜度（D-W24）：loadSession 入口清 `_liveLines` ⇒ 心跳回落 `_susp?.lines`（无 susp ⇒ n ≡ 0）
  const p2 = stubPanel({ _slot: 1, _wvReady: true, _liveLines: liveLines() })
  loadSession(p2)
  assert.equal(p2._liveLines, null, "loadSession 置空 _liveLines（五路汇合单点）")
  assert.equal(hb.liveHeartbeatBeat(p2), 0, "切换后心跳 n ≡ 0（不投旧会话池块）")
  assert.ok(files.includes("test/activity-live-visibility.test.mjs"), "机检：本档已登记 test/files.mjs（接线硬项）")
})
