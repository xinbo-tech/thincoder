/**
 * async-visibility.test.mjs — 第 10 批条目 A（VSC live 块出生可靠性）机器验收。
 * 设计权威：`docs/design/WEBVIEW.md` §5.1（契约 §5.1.4 / 用例 T-V1~T-V8 §5.1.7 / AC-A1~A8
 * §5.1.8）；批次档 `thincoder/docs/batches/2026-09-11-VSC-ASYNC-VISIBILITY.md` §2。
 *
 * 两组手法（同文件——happy-dom 注册只影响 DOM 全局，extension 侧模块零 DOM 依赖）：
 * ① 主侧（真 extension 模块 + 桩面板/真 ChatPanel 原型——session-boot 同骨架）：
 *    投递队列（入队/直投/flush/溢出/清队）+ 存活投影再断言 + webviewReady/清屏定序；
 * ② webview 侧（happy-dom 驱真 activity/streaming 模块——activity-flow 同骨架）：
 *    双 spawn 双块 / 新代接管 / 清屏恢复（pool:true + ⏹ + 位置=活动区尾）/ 终态补桩精确成员表。
 *    2026-09-11 活动区回归：块出生地 = `#subagent-activity`（WEBVIEW.md §12）——helper/fresh
 *    与位置断言随批改区（T-V2 = T-R6 / T-V4·T-V5 = T-R5 同断言族）。
 *
 * 环境隔离：config/会话目录/log 目录全部指向 tmp（loadSession 真读盘）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import files from "./files.mjs"
import { postSubagentEvent, flushSubagentOutbox, WV_OUTBOX_MAX } from "../src/extension/panel-callbacks.mjs"
import { reassertLiveChildren } from "../src/extension/suspension.mjs"
import { handlePanelMessage, _cwd } from "../src/extension/panel-messages.mjs"
import { loadSession } from "../src/extension/panel-session.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { newSlot, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let _tmp
let _logDir
let cleanupEnv

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-asyncvis-"))
  _logDir = join(_tmp, "logs")
  _setConfigPathForTest(join(_tmp, "config.json"))
  _setSessionsDirForTest(join(_tmp, "sessions"))
  process.env.THINCODER_LOG_DIR = _logDir // logEvent 写门（NODE_TEST_CONTEXT 下默认跳过）——ev:subdeliver 断言用
  vscode.env.language = "en" // vscode mock 无 env.language——webviewReady 的 i18n 推送需要
  newSlot(_cwd()) // fixture 槽 1（loadSession/resumeSlot 认领确定性）
  const env = setupWebview()
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

/** 桩面板（真 ChatPanel 原型——方法面真实，字段面实例提供）：posted 捕获 = webview 载荷。 */
function stubPanel(extra = {}) {
  const posted = []
  const p = Object.create(ChatPanel.prototype)
  Object.assign(p, {
    _slot: null,
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

/** 池 fixture（与 ⏹ 路由/投影同源形状）：running/queued 各一。 */
function liveLines(extra = {}) {
  return {
    history: {
      _asyncSubagents: new Map([
        [1, { id: 1, role: "explore", status: "running", pool: true, model: "glm-5.3", startedAt: 111 }],
        [2, { id: 2, role: "eng-coder", status: "queued", position: 2 }],
      ]),
      _asyncAdvisors: new Map([
        [3, { id: 3, role: "advisor", status: "running", reviewType: "design", model: "glm-5.3", startedAt: 222 }],
      ]),
      ...extra,
    },
    fullHistory: [],
    cwd: "/proj",
  }
}

const subagentMsgs = (p) => p.posted.filter((m) => m.type === "subagent")
const typesOf = (p) => p.posted.map((m) => m.type)

/** ev:subdeliver 事件行（THINCODER_LOG_DIR 隔离目录——单日文件）。 */
function deliverEvents() {
  let names = []
  try { names = readdirSync(_logDir) } catch { return [] }
  const out = []
  for (const n of names) {
    for (const line of readFileSync(join(_logDir, n), "utf8").split("\n")) {
      if (!line.trim()) continue
      try {
        const e = JSON.parse(line)
        if (e.ev === "ev:subdeliver") out.push(e)
      } catch { /* 半行（并发写）忽略 */ }
    }
  }
  return out
}

// ═══ ① 主侧：投递队列 / 再断言 / 定序 ═══════════════════════════════

// T-V6（AC-A1/A5）：暗窗口入队 → 就绪 flush（保持入队序）→ 再断言仅存活者。
// 注：boot 路径上 openSessionContent → loadSession 内部还含 §5.1.4 第 4 条的清屏再断言
// （幂等；先于 case 两拍）；本用例断言 flush 的**段内序**与“flush 在末次再断言之前”。
test("T-V6 队列：未就绪期零直投全入队——就绪按序 flush 3 条 + 其后落再断言 + ev:subdeliver 计数", async () => {
  const p = stubPanel({ _liveLines: liveLines() })
  assert.equal(p._wvReady, undefined, "冷启未就绪（直投闸门关）")
  postSubagentEvent(p, { type: "subagent", status: "started", role: "explore", id: 11, pool: true })
  postSubagentEvent(p, { type: "subagent", status: "started", role: "eng-coder", id: 12, pool: true })
  postSubagentEvent(p, { type: "subagent", status: "done", role: "explore", id: 19 })
  assert.equal(p.posted.length, 0, "未就绪期零直投（暗窗口零丢失 = 全入队）")
  assert.equal(p._wvOutbox.length, 3, "三条入队（保持入队序）")
  const beforeFlush = deliverEvents().filter((e) => e.action === "enqueue")
  assert.deepEqual(beforeFlush.map((e) => e.queued), [1, 2, 3], "enqueue 计数留痕（逐条 queued 递增）")

  await handlePanelMessage(p, { type: "webviewReady" })
  assert.equal(p._wvReady, true, "握手开闸（后续族消息直投）")
  assert.equal(p._wvOutbox.length, 0, "flush 清队（零残余）")
  const subs = subagentMsgs(p)
  // flush 段：三条按入队序相邻出现（started#11 → started#12 → done#19）
  const i11 = subs.findIndex((m) => m.id === 11)
  assert.deepEqual(subs.slice(i11, i11 + 3).map((m) => [m.status, m.id]), [["started", 11], ["started", 12], ["done", 19]],
    "flush 保持入队序（3 条——含终态）")
  // 末次再断言（case 两拍之二——存活投影）：双池 running/queued 全在，排在 flush 之后
  const tail = subs.slice(-3)
  assert.deepEqual(tail.map((m) => [m.status, m.id]), [["started", 1], ["queued", 2], ["started", 3]],
    "末次再断言 = 仅存活者（flush 之后——序固定：flush 终态先落，再补活着）")
  assert.ok(i11 + 3 <= subs.length - 3, "flush 段整体位于末次再断言之前")
  const flushEv = deliverEvents().find((e) => e.action === "flush")
  assert.equal(flushEv?.n, 3, "ev:subdeliver flush 记出队计数 3")

  // 直投分支（就绪后不再入队）
  postSubagentEvent(p, { type: "subagent", status: "done", role: "explore", id: 11 })
  assert.equal(p._wvOutbox.length, 0, "就绪后直投不入队")
  assert.equal(subagentMsgs(p).at(-1).status, "done", "直投即时到达")
})

test("T-V6b 存活投影载荷：双池 running/queued 全带 role/id——running 带 pool:true + startedAt", async () => {
  const p = stubPanel({ _liveLines: liveLines(), _wvReady: true })
  const n = reassertLiveChildren(p)
  const subs = subagentMsgs(p)
  assert.equal(n, 3, "投影条数 = 双池 live 条目数（running/queued）")
  const started = subs.filter((m) => m.status === "started")
  const queued = subs.filter((m) => m.status === "queued")
  assert.deepEqual(started.map((m) => [m.role, m.id, m.pool]), [["explore", 1, true], ["advisor", 3, true]],
    "running 行：role/id 必带 + pool:true（建块/⏹/接管守卫依赖）")
  assert.equal(started[0].startedAt, 111, "startedAt 随投影（elapsed 不丢）")
  assert.equal(started[1].model, "glm-5.3", "model 随投影")
  assert.deepEqual(queued.map((m) => [m.role, m.id, m.position]), [["eng-coder", 2, 2]], "queued 行：role/id/position")
  // 无存活 lines → no-op（零消息）
  const empty = stubPanel({ _wvReady: true })
  assert.equal(reassertLiveChildren(empty), 0, "无 live lines → 零投影")
  assert.equal(empty.posted.length, 0)
})

test("T-V7 溢出与清队：超上界丢最旧 + ev:subdeliver 记丢弃计数；view dispose 关闸清队", async () => {
  const p = stubPanel()
  for (let i = 0; i < WV_OUTBOX_MAX + 5; i++) {
    postSubagentEvent(p, { type: "subagent", status: "started", role: "explore", id: 1000 + i, pool: true })
  }
  assert.equal(p._wvOutbox.length, WV_OUTBOX_MAX, "队列不超上界（200）")
  assert.equal(p._wvOutbox[0].id, 1005, "溢出丢最旧（头 5 条出队）")
  assert.equal(p._wvOutbox.at(-1).id, 1000 + WV_OUTBOX_MAX + 4, "尾条保留（新条入队）")
  assert.equal(p._wvOutboxDropped, 5, "丢弃计数留痕（面板字段）")
  const drop = deliverEvents().filter((e) => e.action === "enqueue" && e.dropped > 0).at(-1)
  assert.equal(drop?.dropped, 5, "ev:subdeliver 报丢弃计数（NFR-A2 可诊断）")

  // view dispose（真实 dispose 路径——resolveWebviewView 注册的 onDidDispose 回调）
  const realOnCfg = vscode.workspace.onDidChangeConfiguration
  vscode.workspace.onDidChangeConfiguration = () => ({ dispose: () => {} })
  try {
    const q = stubPanel({ _html: () => "<html>vis fixture</html>", _initStatusBar() {} })
    let disposeCb = null
    const view = {
      webview: { options: {}, html: "", postMessage: () => Promise.resolve(true), onDidReceiveMessage: () => {} },
      onDidDispose: (cb) => { disposeCb = cb },
    }
    ChatPanel.prototype.resolveWebviewView.call(q, view, {}, {})
    q._wvReady = true
    postSubagentEvent(q, { type: "subagent", status: "started", role: "explore", id: 7, pool: true }) // 直投（不排队）
    postSubagentEvent(q, { type: "subagent", status: "started", role: "explore", id: 8, pool: true })
    q._wvOutbox = [{ type: "subagent", status: "done", id: 8 }] // 模拟待投残余
    assert.ok(typeof disposeCb === "function", "resolveWebviewView 注册了 view 销毁回调")
    disposeCb()
    assert.equal(q._wvReady, false, "dispose 关闸（跨 view 不串味）")
    assert.deepEqual(q._wvOutbox, [], "dispose 清队")
  } finally {
    vscode.workspace.onDidChangeConfiguration = realOnCfg
  }
})

// T-V3（主侧半——AC-A4）：清屏后再断言排在 clearMessages 与 historyPage 之后（期望位置 = 区尾——§12 修订）。
test("T-V3 清屏后再断言（主侧定序）：clearMessages → historyPage → 再断言——排在两者之后（期望位置=活动区尾）", () => {
  const p = stubPanel({ _slot: 1, _wvReady: true, _liveLines: liveLines() })
  loadSession(p)
  const types = typesOf(p)
  const iClear = types.indexOf("clearMessages")
  const iPage = types.indexOf("historyPage")
  const iSub = types.indexOf("subagent")
  assert.ok(iClear >= 0, "loadSession 发 clearMessages")
  assert.ok(iPage > iClear, "historyPage 在 clearMessages 之后（单向 boot 内部序）")
  assert.ok(iSub > iPage, "再断言在 historyPage 之后——期望位置 = 活动区尾（显式定序）")
  assert.ok(iSub > types.indexOf("planMode"), "再断言在既有推送之后（排于 case 既有面之后）")
  assert.equal(subagentMsgs(p).length, 3, "重建 3 条 live（双池 running ×2 + queued ×1）")
  const started = subagentMsgs(p).find((m) => m.id === 1)
  assert.equal(started.pool, true, "重建载荷带 pool:true（webview 侧 ⏹ 判据）")
  assert.equal(started.startedAt, 111, "重建载荷带 startedAt（elapsed 不丢）")
})

// ═══ ② webview 侧：块出生 / 接管 / 清屏恢复 / 补桩表 ═════════════════

async function loadWebview() {
  const state = await import("../webview/state.js")
  const activity = await import("../webview/activity.js")
  const streaming = await import("../webview/streaming.js")
  return { S: state.S, ctx: state.ctx, ...activity, subagentChunk: streaming.subagentChunk }
}

function fresh({ S, ctx }) {
  ctx.messagesEl.replaceChildren()
  ctx.activityEl.replaceChildren()
  S._subBlocks.clear()
  S._subTraceLog = []
  ctx._pinBottom = undefined
  ctx._pinActivity = undefined
}

function addMessage(ctx, tag) {
  const el = document.createElement("div")
  el.className = "message"
  if (tag != null) el.dataset.tag = tag
  ctx.messagesEl.appendChild(el)
  return el
}

const subBlocks = (ctx) => [...ctx.activityEl.children].filter((el) => el.classList.contains("sub-block"))

// T-V1（AC-A1——采样点改区，2026-09-11 §12 修订）：22:32 基例——背靠背双 spawn 各得一块 + ⏹。
test("T-V1 双 spawn 背靠背出生（22:32 基例——AC-A1）：两条不同 id started → 区内 2 live 块 + 各挂 ⏹", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 4, pool: true, model: "glm-5.3" })
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 5, pool: true, model: "glm-5.3" })
  const blocks = subBlocks(ctx)
  assert.equal(blocks.length, 2, "host 计 2 → webview 2 活块（原缺陷：只渲染 1）")
  assert.equal([...ctx.activityEl.querySelectorAll(":scope > .sub-block.sub-live")].length, 2, "区内 .sub-live 计数 == 2（AC-A1 采样点）")
  assert.equal([...ctx.messagesEl.children].filter((el) => el.classList.contains("sub-block")).length, 0, "#messages 零 .sub-block（块不落流）")
  assert.deepEqual([...new Set(blocks.map((b) => b.dataset.subname))].length, 2, "data-subname 唯一")
  for (const b of blocks) {
    assert.ok(b.classList.contains("sub-live") && !b.classList.contains("sub-frozen"), "live 态")
    assert.ok(b.querySelector(".sub-stop-btn"), "各挂 ⏹（pool:true）")
  }
  assert.equal(S._subBlocks.size, 2, "簿记 map 双条目")
})

// T-V2（AC-A2；= T-R6 新代接管）：冻结条目把持键 → 新代接管（新块 + 键重绑 + takeover 痕迹 + 旧块留区内）。
test("T-V2 重名新代接管（AC-A2）：冻结 #4 在场 → 新 started #4 建新块接管键 + takeover 痕迹 + 旧块留区内冻结", async () => {
  const { S, ctx, applySubagentStatus, subagentChunk } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 4, pool: true, model: "glm-5.3" })
  const old = S._subBlocks.get("sub:eng-coder#4")
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 4 })
  assert.ok(old._subMeta.frozen, "上一代已冻结（键被把持）")
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 4, pool: true, model: "glm-5.3", startedAt: 777 })
  const next = S._subBlocks.get("sub:eng-coder#4")
  assert.ok(next && next !== old, "新一代建块并接管键（原缺陷：返 null 永久失明）")
  assert.equal(next._subMeta.frozen, false, "新块 live（_subMeta.frozen === false）")
  assert.ok(next.classList.contains("sub-live"), "新块 sub-live")
  assert.ok(next.querySelector(".sub-stop-btn"), "新块挂 ⏹")
  assert.equal(next._subMeta.startedAt, 777, "新块水合新代 startedAt")
  assert.equal(old.isConnected, true, "旧冻结块以 DOM 留在区内（历史）")
  assert.ok(old.classList.contains("sub-frozen"), "旧块仍冻结（不被半复活）")
  assert.equal(subBlocks(ctx).length, 2, "区内两块（旧冻结 + 新 live）")
  assert.equal(old.parentNode, ctx.activityEl, "旧块在活动区（原地）")
  assert.ok(S._subTraceLog.some((e) => e.kind === "takeover"), "takeover 痕迹在位")
  // 接管后迟到 chunk 落新块（§5.1.4 第 5 条显式取舍）
  subagentChunk({ name: "sub:eng-coder#4", kind: "text", text: "late-generation chunk" })
  assert.ok(next.querySelector(".advisor-content").textContent.includes("late-generation chunk"), "迟到 chunk 落新块（取舍登记）")
  assert.ok(!old.querySelector(".advisor-content").textContent.includes("late-generation chunk"), "旧冻结块内容不变")
})

// T-V3（webview 半——AC-A4）：清屏 → historyPage → 再断言 → 重建块 pool:true/⏹ + 位置=活动区尾。
test("T-V3 清屏恢复（AC-A4）：clearMessages+historyPage 之后再断言 → 重建块 pool:true + ⏹ 在 + 位置=活动区尾", async () => {
  const { S, ctx, applySubagentStatus, resetActivity } = await loadWebview()
  fresh({ S, ctx })
  // 清屏前：两块 live（被 clearMessages 抹掉——host 清屏路径）
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 1, pool: true, model: "glm-5.3" })
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 2, pool: true })
  ctx.messagesEl.replaceChildren() // clearMessages（chat.js case：replaceChildren + resetActivity）
  S._advisorBlock = null
  resetActivity()
  assert.equal(subBlocks(ctx).length, 0, "清屏抹块 + 清簿记")
  assert.equal(ctx.activityEl.children.length, 0, "区零残留（live + 折叠全清）")
  // historyPage：末页消息重灌（模拟 webview 渲染历史）
  const lastHistory = addMessage(ctx, "h1")
  assert.equal(lastHistory.parentNode, ctx.messagesEl, "历史消息落 #messages（与区无关）")
  // 再断言（host reassertLiveChildren 载荷——running + queued）
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 1, pool: true, model: "glm-5.3", startedAt: 111 })
  applySubagentStatus({ type: "subagent", status: "queued", role: "eng-coder", id: 2, position: 2 })
  const rebuilt = S._subBlocks.get("sub:explore#1")
  assert.ok(rebuilt, "重建块在册（清屏后可恢复）")
  assert.equal(rebuilt._subMeta.pool, true, "重建块保留 pool:true（原缺陷：丢 pool → 无 ⏹）")
  assert.ok(rebuilt.querySelector(".sub-stop-btn"), "⏹ 在（控制面不降级）")
  assert.equal(rebuilt._subMeta.startedAt, 111, "startedAt 保留（elapsed 不丢）")
  assert.ok(rebuilt.querySelector(".sub-hdr").textContent.includes("async"), "async 词在（family + pool）")
  const queued = S._subBlocks.get("sub:eng-coder#2")
  assert.ok(queued.querySelector(".sub-hdr").textContent.includes("⏳"), "queued 得 ⏳ 头")
  // 位置断言（AC-A4——2026-09-11 §12 修订：块出生地 = 活动区）：重建块位于活动区（区尾——#messages 保持零块）
  assert.equal(rebuilt.parentNode, ctx.activityEl, "重建块位于活动区（不落流）")
  assert.equal(queued.parentNode, ctx.activityEl, "queued 头同区")
  assert.equal(ctx.activityEl.lastElementChild, queued, "区尾追加序保持（started → queued 逐条区尾）")
  assert.equal(rebuilt.compareDocumentPosition(queued) & Node.DOCUMENT_POSITION_FOLLOWING, Node.DOCUMENT_POSITION_FOLLOWING,
    "区内序：重建块在 queued 头之前")
  assert.equal([...ctx.messagesEl.children].filter((el) => el.classList.contains("sub-block")).length, 0, "#messages 零块（位置面与消息流无交）")
})

// T-V4/T-V5（AC-A3；= T-R5 终态补桩）：终态补桩精确成员表——补桩行 + 不补行。
test("T-V4 终态补桩（AC-A3）：never-born done/error/运行中 cancelled/terminated/failed → 补已折叠桩 + 头词 + 痕迹", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const cases = [
    [{ status: "done", role: "explore", id: 11 }, "done"],
    [{ status: "settled", role: "explore", id: 12 }, "done"],
    [{ status: "error", role: "eng-coder", id: 13, error: "boom" }, "error"],
    [{ status: "cancelled", role: "plan", id: 14 }, "stopped"], // 运行中取消（was 缺省）
    [{ status: "terminated", role: "coder", id: 15 }, "stopped"],
    [{ status: "failed", role: "eng-designer", id: 16 }, "error"],
  ]
  for (const [m, word] of cases) {
    const before = subBlocks(ctx).length
    applySubagentStatus({ type: "subagent", ...m })
    const block = S._subBlocks.get(`sub:${m.role}#${m.id}`)
    assert.ok(block, `${m.status}（never-born）补出块`)
    assert.equal(block._subMeta.frozen, true, "补桩即折叠（_subMeta.frozen === true）")
    assert.equal(subBlocks(ctx).length, before + 1, "区内计数 +1")
    assert.equal(block.parentNode, ctx.activityEl, "补桩块落活动区（区内出生）")
    const hdr = block.querySelector(".sub-hdr").textContent
    assert.ok(hdr.includes(word), `${m.status} 头词含 ${word}（断言用：${hdr}）`)
  }
  assert.equal(S._subTraceLog.filter((e) => e.kind === "late-terminal-stub").length, cases.length, "late-terminal-stub 逐条留痕")
})

test("T-V5 补桩边界（AC-A3 不补行）：role 未知/id 缺失/非法频道/answered 无块/queued-cancel 无块 → 一律 no-op", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const before = subBlocks(ctx).length
  // ① role 未知 ② id 缺失 ③ 非法频道名（id 非数字）
  applySubagentStatus({ type: "subagent", status: "done", role: "bogus", id: 3 })
  applySubagentStatus({ type: "subagent", status: "done", role: "explore" })
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: "abc" })
  // ④ answered 无块（§5 既有裁决：回复走 digest——不补）⑤ cancelled(was:"queued") 无块（从未启动——不补）
  applySubagentStatus({ type: "subagent", status: "answered", role: "explore", id: 41 })
  applySubagentStatus({ type: "subagent", status: "cancelled", role: "explore", id: 42, was: "queued" })
  assert.equal(subBlocks(ctx).length, before, "五例一律零新块")
  assert.equal(S._subBlocks.size, 0, "map 零新增条目")
  const traces = S._subTraceLog
  assert.equal(traces.filter((e) => e.kind === "drop-unknown-role").length, 3, "①②③ 各留一条 drop-unknown-role")
  assert.equal(traces.filter((e) => e.kind === "late-terminal-stub").length, 0, "不补行零补桩痕迹")
  // 有 map 条目者不受表影响：已冻结块再收终态 → no-op 且不补
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7 })
  applySubagentStatus({ type: "subagent", status: "error", role: "explore", id: 7, error: "late" })
  assert.equal(subBlocks(ctx).length, before + 1, "补桩块单一（不重复建）")
  assert.equal(S._subTraceLog.filter((e) => e.kind === "late-terminal-stub").length, 1, "重复终态不重复补桩")
})

// ═══ ③ 机检：零回归 grep + 新档在册（AC-A6/A7 的仓库面） ═══════════

test("AC-A6/A7 机检：postPoolSnapshot/SNAPSHOT_ROLES 零命中（REMOVE 面不复活）+ 本档登记 + ev:subdeliver 调用点在位", () => {
  const srcFiles = ["../src/extension/panel-callbacks.mjs", "../src/extension/suspension.mjs", "../src/extension/panel-messages.mjs", "../src/extension/panel-session.mjs", "../src/extension/chat-panel.mjs", "../webview/activity.js"]
  const src = srcFiles.map((f) => readFileSync(new URL(f, import.meta.url), "utf8")).join("\n")
  for (const f of ["panel-callbacks.mjs", "panel-session.mjs", "panel-messages.mjs", "chat-panel.mjs"]) {
    const body = readFileSync(new URL(`../src/extension/${f}`, import.meta.url), "utf8")
    assert.ok(!body.includes("postPoolSnapshot") && !body.includes("SNAPSHOT_ROLES"), `${f} 零 REMOVE 面残留`)
  }
  assert.ok(src.includes("ev:subdeliver"), "ev:subdeliver 留痕调用点在位（NFR-A2）")
  assert.ok(src.includes('traceSub("takeover"') && src.includes('traceSub("late-terminal-stub"') && src.includes('traceSub("drop-unknown-role"'), "三类痕迹调用点在位")
  assert.ok(files.includes("test/async-visibility.test.mjs"), "本档已登记 test/files.mjs（接线硬项）")
})
