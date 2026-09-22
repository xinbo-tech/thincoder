/**
 * panel-cancel-routing.test.mjs — 面板取消路由 / 事件中继面（2026-09-22 structure-debt §2.3 · #169A）：
 * 自 chat-panel-messages.test.mjs 迁出「取消路由 / 事件中继」主题连贯用例组（⑫ F-2 取消路由 ·
 * ⑬ W15 事件中继 · ⑭ T-AF11 advisor 目标取消）——D-2 拆分（迁出用例逐字搬移 / 新档头部自持 /
 * 零跨档 import / 用例数守恒）。
 * 手法：桩面板驱动（`stubPanel` 逐字副本——原档共享夹具，不迁出）+ 真核取消路由
 * （`handlePanelMessage` → executeCancelAction / relaySubagentEventToken）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"

/** C1/C2 桩面板——方法记录 + 字段直控（桩 _chat 记参返回 resolve——组④ 除外）。
 *  C2（SESSION-FLOW-C F-C2a）：忙态以 _turnState 枚举表达（旧 _turnActive 布尔已退役）。
 *  INPUT-LOCK（C'）：_suspQueue 已删（排队机制废弃）——不设。 */
function stubPanel(overrides = {}) {
  const posted = []
  const p = {
    _turnState: "idle",
    _turnControllers: [],
    _abortController: null,
    _abortRequested: false,
    _susp: null,
    _questionQueue: [],
    _questionSeq: 0,
    _permissionQueue: [],
    _statusBar: null,
    _stopClickTs: null,
    _chatCalls: [],
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _chat(...args) { p._chatCalls.push(args); return Promise.resolve() },
    _activeHistory() { return [] },
    _refreshStatus() {},
    _setStatus() {},
    posted,
    ...overrides,
  }
  return p
}

// ─── ⑫ F-2 queued 取消路由（QUEUED-VISIBILITY F-2——自 pool-snapshot.test.mjs 迁入——
// REMOVE-POOL-SNAPSHOT 2026-09-09：F-3 快照重推撤销——F-2 取消路由覆盖保留——红线）────

/** 最小 live lines history（真数组 + 池 expando——与 agent 运行期 history 同形——
 *  cancelSubagent 路由读 _asyncSubagents/_asyncTombstones 的最小载体面）。 */
function poolHistory() {
  const history = []
  Object.assign(history, {
    _asyncSubagents: new Map(),
    _asyncAdvisors: new Map(),
    _asyncTombstones: new Map(),
    _pendingAsyncResults: [],
  })
  return history
}

test("⑫ F-2 cancelSubagent 路由（queued 目标）：引擎出队 + 墓碑 + W15 等待头回收事件——陈旧 ⏹ no-op（用例表 F-2 错误行）", async () => {
  const history = poolHistory()
  // relayPrefix 必携（生产池条目形状——executeAsyncSpawn 写侧恒有；事件中继面据此解析 role/id）
  const e9 = { id: 9, role: "eng-coder", status: "queued", done: false, cancelled: false, _files: [], _dependsOn: [], relayPrefix: "eng-coder#9/" }
  // W13 键形单源（评审 🔴 收口）：核池键恒 `String(id)`（写侧 `set(String(id))`）——夹具锁 String 键，
  // 防读键形回归被数字键夹具掩盖（原 `Number(msg.id)` 归一在生产恒 miss 的旧病理）。
  history._asyncSubagents.set("9", e9)
  const p = stubPanel({ _liveLines: { history, fullHistory: history, cwd: "C:/ws" }, _wvReady: true })

  await handlePanelMessage(p, { type: "cancelSubagent", id: "9", role: "eng-coder" })

  assert.equal(history._asyncSubagents.has(9), false, "queued 目标出队（map 移除——核 executeCancelAction）")
  assert.equal(history._asyncSubagents.has("9"), false, "String 键形出池（键形单源——回归锁）")
  assert.deepEqual(history._asyncTombstones.get("9"), { status: "cancelled", role: "eng-coder" }, "出队即终态 → cancelled 墓碑（依赖者查得；键形 = String 归一）")
  // W15（R5——等待头回收 + W13 观察项）：核 `⟦ev⟧cancelled` 经事件中继面 → webview 协议消息
  // （原 `callbacks: {}` = 该事件 no-op——webview ⏳ 等待块悬留）。`_onCancelled` 端侧旧缝已退役（W13）
  // ——本面为唯一通道。
  assert.deepEqual(
    p.posted.filter((m) => m.type === "subagent" && m.status === "cancelled"),
    [{ type: "subagent", role: "eng-coder", id: 9, status: "cancelled", was: "queued" }],
    "queued 取消 → cancelled(was:'queued') 事件（webview activity.js 移除 ⏳ 等待块）",
  )
  assert.equal(p.posted.filter((m) => m.type === "token").length, 0, "事件 token 零裸文本泄漏（识别即消费）")

  // 陈旧 ⏹（块已出队残留点击——用例表 F-2 错误行）→ 路由 no-op（未知 id——无虚构状态）
  await handlePanelMessage(p, { type: "cancelSubagent", id: "9", role: "eng-coder" })
  assert.equal(history._asyncTombstones.size, 1, "无新墓碑（幂等）")
  assert.equal(p.posted.filter((m) => m.type === "subagent" && m.status === "cancelled").length, 1, "陈旧点击零新事件（no-op）")
})

// ─── ⑬ W15 事件中继面（R5）：核 ⟦ev⟧ 事件 token → webview 活动区协议消息映射单点 ────

test("⑬ W15 事件中继：queued/cancelled/stopped/turn/done/settled/async+[model] 映射；非事件不消费", async () => {
  const { relaySubagentEventToken } = await import("../src/extension/panel-callbacks.mjs")
  const posted = []
  const p = { _wvReady: true, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
  const consume = (tok) => relaySubagentEventToken(p, tok)
  const RS = "\x1e"

  // 池生命周期事件（核发射面：subagent-run / subagent-scheduler / subagent-async / async-settle / 核 agent.mjs 子代 turn）
  assert.equal(consume(`eng-coder#4/⟦ev⟧queued${RS}slot${RS}3${RS}queued${RS}`), true)
  assert.equal(consume(`explore#2/⟦ev⟧queued${RS}depc${RS}1${RS}queued${RS}dependency cancelled`), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧async${RS}`), true)
  assert.equal(consume("eng-coder#5/[model]glm-5.3"), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧turn${RS}7${RS}100${RS}llm${RS}`), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧cancelled${RS}`), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧stopped${RS}0${RS}0${RS}stopped${RS}`), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧settled${RS}0${RS}0${RS}settled${RS}`), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧done${RS}0${RS}0${RS}done${RS}`), true)
  // 非事件面：主会话普通 token / 无前缀 [model]——不消费（原样转发）；relay 前缀内容 chunk
  // 事件中继不消费（由内容中继面 relaySubagentContentChunk 接管 → `sub:` 面板频道——
  // 见 test/subagent-content-relay.test.mjs T1–T7）。
  assert.equal(consume("plain main-agent token"), false)
  assert.equal(consume("[model]glm-5.3"), false)
  assert.equal(consume("eng-coder#5/hello chunk"), false)

  const [q1, q2, started, turn, cancelled, stopped, settled, done] = posted
  // 载荷四项（#118）：`kind` 随行 = 显示面判词单源（slot ⇒ 槽满词 / 其余 ⇒ reason 原文）。
  assert.deepEqual(q1, { type: "subagent", role: "eng-coder", id: 4, status: "queued", position: 3, waiting: null, reason: null, kind: "slot" })
  assert.deepEqual(q2, { type: "subagent", role: "explore", id: 2, status: "queued", position: 1, waiting: "dependency-cancelled", reason: "dependency cancelled", kind: "depc" })
  assert.equal(started.status, "started")
  assert.equal(started.pool, true, "async 标记 → pool:true（webview ⏹/接管判据）")
  assert.equal(started.model, "glm-5.3")
  assert.ok(typeof started.startedAt === "number", "startedAt 随行（elapsed 不丢）")
  assert.deepEqual(turn, { type: "subagent", role: "eng-coder", id: 5, status: "turn", turn: 7, maxTurns: 100 })
  assert.deepEqual(cancelled, { type: "subagent", role: "eng-coder", id: 5, status: "cancelled", was: "queued" })
  // X6 收口（2026-09-20 · 父侧裁定 #134 ②）：`⟦ev⟧stopped` 第 4 位（原因词位——核发射恒字面
  // "stopped"）与冻结头 verb 重复 ⇒ **零注记**（CLI 标尺：`subagent-blocks.mjs:263-273` 同分支不置
  // `lastError`）；有值 / 空位两形归一为同一载荷。
  assert.deepEqual(stopped, { type: "subagent", role: "eng-coder", id: 5, status: "cancelled" })
  assert.deepEqual(settled, { type: "subagent", role: "eng-coder", id: 5, status: "settled" })
  assert.deepEqual(done, { type: "subagent", role: "eng-coder", id: 5, status: "done" })
})

// ─── ⑭ af 批 T-AF11：VSC ⏹ advisor 目标并入共用路径（F-11——原 advisor 专用分支退役）────

/** advisor 池 queued 条目最小形（核 launch 写侧形状——`advisor-async.mjs:414` 入队 +
 *  relayPrefix / position / run.docSetKey 齐；合成 parent 读取面）。 */
function advisorQueuedEntry(id, docSetKey) {
  return {
    id, role: "advisor", reviewType: "design", run: { reviewType: "design", docSetKey, round: 0 },
    reviewId: `r${id}`, designId: null, designToken: null, documents: null, paths: null, object: null,
    relayPrefix: `advisor#${id}/`, status: "queued", position: 1,
    report: null, error: null, done: false, cancelled: false, promise: null, _settle: null,
    startedAt: null, controller: { signal: { aborted: false } },
  }
}

test("⑭ T-AF11 cancelSubagent 路由（advisor 目标·queued）：并入共用路径 ⇒ cancelled(was:'queued') 中继 + 队列零残留 + 墓碑（先红：零消息——等待头悬留）", async () => {
  const history = poolHistory()
  const e5 = advisorQueuedEntry(5, "K1")
  history._asyncAdvisors.set("5", e5)
  history._asyncAdvisorQueue = [e5] // 核写侧载体（VSC 形 = history——CARRIER_FIELDS 绑定面）
  const p = stubPanel({ _liveLines: { history, fullHistory: history, cwd: "C:/ws" }, _wvReady: true })

  await handlePanelMessage(p, { type: "cancelSubagent", id: "5", role: "advisor" })

  assert.equal(history._asyncAdvisorQueue.length, 0, "队列零残留（核 dequeueAdvisor 经载体吸收命中）")
  assert.equal(history._asyncAdvisors.has("5"), false, "出池")
  assert.deepEqual(history._asyncTombstones.get("5"), { status: "cancelled", role: "advisor" }, "出队即终态 → cancelled 墓碑")
  assert.deepEqual(
    p.posted.filter((m) => m.type === "subagent"),
    [{ type: "subagent", role: "advisor", id: 5, status: "cancelled", was: "queued" }],
    "恰 1 条 cancelled(was:'queued')（webview 等待头移除；零 ⟦ev⟧stopped ⇒ 无第二条 cancelled）",
  )
  assert.equal(p.posted.filter((m) => m.type === "token").length, 0, "事件 token 零裸文本泄漏（识别即消费）")
  assert.equal(history.filter((m) => m.role === "user").length, 1, "机读线提醒恰 1 条（评审已取消——token 未签发）")
})
