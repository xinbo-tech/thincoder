/**
 * busy-injection-consume.test.mjs — F16（busy 期消息注入 · 台账 #213）机器验收 · CLI 半
 * （消费 / 送达 / 步边界族）。
 *
 * 拆分（2026-09-25 file-tier-sweep 批 S4 · KD-23「用例族 + 夹具自持」——原
 * `busy-injection.test.mjs` 474 行拆分；触发 = 前批登记「用例按族分档 · 下批执行」）：本档 =
 * 回合尾兜底转正（T-F16-2）/ driver 消费两态（T-F16-9 · T-F16-5）/ 合并批送达与中止残余
 * （T-F16-15 · T-F16-16）/ 步边界 pickup 与系统轮负向锁（T-F16-18 · T-F16-19）+ `turnRig`
 * 回合装置 / `RECEIPT` / `convText` 夹具；渲染 / 状态栏族见 `busy-injection-render.test.mjs`，
 * 按键门 + 入队族留守原档。用例号零改零重排；夹具自持（零跨档 import——`baseState` /
 * `stripAnsi` / `convText` / `turnRig`）。
 *
 * 设计权威：`docs/cli/design/TUI-INPUT-BOX.md` §4.1（执行序 / 消费回执）· `TUI.md` §7.5
 * （三时机）· `AGENT-LOOP-ASYNC-POOL.md` §6.8（步边界 pickup）；批档
 * `docs/batches/2026-09-21-busy-injection.md` §2 用例表 + busy-extend 批档 §2（T-F16-8/9）+
 * queue-visible 批（2026-09-24 · 台账 #249）批档 §2（T-F16-15…19）。快层直跑（`ctx.runAgent`
 * 桩 + 短微任务等待——零网络零 TTY；驱动会话必然终止）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { runAgentTurn } from "../src/tui/agent-turn.mjs"
import { suspensionSession } from "../src/tui/suspension-drive.mjs"
import { renderStatus } from "../src/tui/render-frame.mjs"
import { buildConvLines } from "../src/tui/render-conversation.mjs"
import { formatMergedMessages } from "../src/tui/queued-merge.mjs"
import { pickupQueuedAtStepBoundary } from "../src/tui/queued-pickup.mjs"

const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")
const RECEIPT = "[sending queued message]"

/** 最小按键态（挂起/释放窗口字段齐备——busy 判据三面全在；含状态栏渲染所需字段）。 */
function baseState(over = {}) {
  return {
    input: [], cursor: 0, history: [], historyIndex: -1, _draft: null,
    processing: false, suspended: false, _suspPending: false, pendingInput: [],
    queue: [], subTasks: {}, tasks: [], scroll: 0, _followTail: true,
    permission: null, question: null,
    status: "Ready", processingStarted: 0, currentTool: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 },
    ...over,
  }
}

/** 会话渲染夹具（`buildConvLines` 直驱——cols 给足免折行干扰形态断言；本族消费面自持副本）。 */
const convText = (state, cols = 120) => buildConvLines(state, cols, 0).map((l) => l.text)

// ─── T-F16-2 正常：回合尾兜底转正 → 队列续发新回合 + 消费回执 ───

/** 回合 rig（runAgentTurn / suspensionSession 共用；`ctx.runAgent` 桩——不触网）。 */
function turnRig({ pendingInput = [], live = false, pending = [] } = {}) {
  const lines = []
  const calls = []
  const agent = {
    provider: { name: "glm", baseURL: "https://api.example.com/v1", model: "glm-5.3" },
    history: [], title: "locked", autoApprove: false, planMode: false,
    _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _pendingAsyncResults: pending,
    _sessionAbort: new AbortController(), _sessionAbortAll: [], _suspended: false,
  }
  if (live) agent._asyncSubagents.set("1", { id: 1, role: "explore", status: "running" })
  const state = baseState({
    pendingInput, queue: [],
    status: "Ready", processingStarted: 0, currentTool: null, streaming: "", reasoning: "", lines: [],
    permissionPreview: [], _advisorBlocks: [], attentionAwaiting: false, exitArmed: false, controller: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 }, ctxCache: { tokens: 0 },
    _turnControllers: [],
  })
  const ctx = {
    agent, state,
    pushLine: (text) => lines.push(String(text)), pushLabel: (text) => lines.push(String(text)),
    render() {}, scheduleRender() {}, ensureAssistantLabel() {},
    askPermission: null, askBatchPermission: null, askQuestion: null,
    handleSlash: async () => {}, saveSession: async () => {},
    runAgent: async (_a, text) => {
      calls.push(String(text))
      agent._pendingAsyncResults = [] // 核回合头 drain（消费即清——防 digest 轮连开）
    },
  }
  return { agent, state, ctx, lines, calls }
}

test("T-F16-2 回合尾送达：池死 ⇒ 单槽转正队列 + 队列 while 续发新回合（首条 = 该文本）∧ 消费回执行在位", async () => {
  const r = turnRig({ pendingInput: ["msg"] })
  await runAgentTurn(r.ctx, "first")
  assert.deepEqual(r.calls, ["first", "msg"], "队列续发新回合——首条 user 文本 = 单槽文本")
  assert.equal(r.state.queue.length, 0, "转正条目消费清空（单槽语义：至多一条）")
  assert.ok(r.lines.includes(RECEIPT), `消费回执行在位（${RECEIPT}）`)
  assert.equal(r.state.pendingInput.length, 0, "单槽已清")
  assert.ok(r.lines.indexOf(RECEIPT) > r.lines.indexOf("first"), "回执在首回合之后（消费时推送）")
})

// ─── T-F16-9 正常：会话内回合执行期入槽 ⇒ driver 轮末步骤 1 消费（先于 digest 合并）───

test("T-F16-9 driver 轮末消费：会话内回合执行期投槽一条 ⇒ 步骤 1 以该文本开新回合（首条 = 该文本）∧ 消费回执行在位", async () => {
  const r = turnRig({ pendingInput: ["u1"], live: true })
  r.ctx.runAgent = async (_a, text) => {
    r.calls.push(String(text))
    if (r.calls.length === 1) r.state.pendingInput.push("u2") // 回合执行期 busy Enter 入槽（§4.1）
    r.agent._pendingAsyncResults = [] // 核回合头 drain（防 digest 轮连开）
  }
  const session = suspensionSession(r.ctx)
  await new Promise((res) => setTimeout(res, 20))
  assert.deepEqual(r.calls, ["u1", "u2"], "轮末回 driver ⇒ 步骤 1 消费该文本开新回合（先于 digest 合并——D-S5）")
  assert.equal(r.lines.filter((l) => l === RECEIPT).length, 2, "两次消费各一条回执（driver 消费点推送）")
  assert.equal(r.state.pendingInput.length, 0, "消费清槽")
  r.state._suspAborted = true // 会话终止（防悬挂）
  r.state._suspWake?.()
  await session
})

// ─── T-F16-5 正常：挂起 driver 消费单槽（输入优先）→ 用户回合 + 回执 ───

test("T-F16-5 driver 消费：池 live + digest pending 前入槽 ⇒ 单槽优先消费开用户回合（首条 = 该文本）∧ 回执行在位", async () => {
  const r = turnRig({ pendingInput: ["u-msg"], live: true, pending: [{ role: "subagent", id: 2 }] })
  const session = suspensionSession(r.ctx)
  await new Promise((res) => setTimeout(res, 15)) // 消费 + runAgentTurn（桩）微任务链
  assert.equal(r.calls[0], "u-msg", "driver 步骤 1 输入优先（先于 digest 轮——D-S5）")
  assert.ok(r.lines.includes(RECEIPT), `消费回执行在位（${RECEIPT}）`)
  assert.equal(r.state.pendingInput.length, 0, "消费清槽")
  // 会话终止（防悬挂）
  r.state._suspAborted = true
  r.state._suspWake?.()
  await session
  assert.equal(r.state.suspended, false, "会话退出复位 suspended")
})

// ═══ queue-visible 批（2026-09-24 · 台账 #249）：待发送块 / 合并计划 / 步边界 pickup ═══
// 设计 = `TUI.md` §7.5（待发送块 · 四态 · 三时机）· `TUI-INPUT-BOX.md` §4.1（容量 / 满队）·
// `AGENT-LOOP-ASYNC-POOL.md` §6.8（步边界 pickup）。用例表 T-F16-10…19（批档 §2）。

test("T-F16-15 回合尾兜底：入队 2 条 → 回合收尾 ⇒ state.queue 恰 1 项（合并文本）∧ 回执行 1 行 ∧ `❯ You:` 携合并文本（一次回合）", async () => {
  const r = turnRig({ pendingInput: ["u1", "u2"] })
  await runAgentTurn(r.ctx, "first")
  const merged = formatMergedMessages(["u1", "u2"])
  assert.deepEqual(r.calls, ["first", merged], "队列续发一次回合（合并文本——替代逐条转正）")
  assert.equal(r.state.queue.length, 0, "队列条目消费清空（`state.queue` 取走后零残留）")
  assert.equal(r.lines.filter((l) => l === RECEIPT).length, 1, "回执行 1 行（按批）")
  assert.ok(r.lines.includes("❯ You:"), "`❯ You:` 标签在位")
  assert.ok(r.lines.includes(merged), "合并文本落 state.lines")
  assert.equal(r.state.pendingInput.length, 0, "取批移出（队列清空——块随判据消失）")
})

test("T-F16-16 driver 取批 + 中止残余：池 live ⇒ 合并批开一回合（一次）；会话中止 ⇒ 残余按计划转 state.queue（零丢失）∧ 不渲染待发送块", async () => {
  // driver 步骤 1：队列 2 条 ⇒ 合并批开新回合（先于 digest 合并——D-S5 输入优先）
  const r = turnRig({ pendingInput: ["d1", "d2"], live: true })
  const session = suspensionSession(r.ctx)
  await new Promise((res) => setTimeout(res, 20))
  const merged = formatMergedMessages(["d1", "d2"])
  assert.deepEqual(r.calls, [merged], "driver 以本批合并消息开新回合（一次）")
  assert.equal(r.lines.filter((l) => l === RECEIPT).length, 1, "回执按批 1 行")
  assert.equal(r.state.pendingInput.length, 0, "消费清队（块随判据消失）")
  r.state._suspAborted = true // 会话终止（防悬挂）
  r.state._suspWake?.()
  await session
  // 中止残余：全量按计划转 state.queue（不渲染待发送块——TUI.md §7.5 边界）
  const r2 = turnRig({ pendingInput: ["k1", "k2"] })
  r2.agent._sessionAbort.abort() // 驱动首行 while 条件即假——直接走 finally 中止路径
  await suspensionSession(r2.ctx)
  assert.deepEqual(r2.state.queue, [{ text: formatMergedMessages(["k1", "k2"]) }], "残余按计划转 queue（合并条目——零丢失）")
  assert.equal(r2.state.pendingInput.length, 0, "队列清空（块随判据消失）")
  assert.ok(r2.lines.some((l) => /will run as a normal turn/.test(l)), "提示行明示去向（不静默丢）")
  assert.ok(!convText(r2.state).some((t) => t.includes("待发送")), "中止残余不渲染待发送块")
})

test("T-F16-18 步边界 pickup：队列 2 条 ⇒ 取批 ⇒ history 尾恰 +1 条 user 消息（合并文本）∧ lines 含回执 + `❯ You:` + 合并文本 ∧ 队列空 ∧ 零 `[User interrupt:]`（非中断锁）；空队列 ⇒ no-op", () => {
  const r = turnRig({ pendingInput: ["s1", "s2"] })
  pickupQueuedAtStepBoundary(r.ctx)
  const merged = formatMergedMessages(["s1", "s2"])
  assert.equal(r.agent.history.length, 1, "history 尾恰 +1 条")
  assert.deepEqual({ ...r.agent.history[0], ts: undefined }, { role: "user", content: merged, ts: undefined }, "内容 = R15 合并文本（普通 user 消息——下一步生效）")
  assert.ok(r.lines.includes(RECEIPT), "回执行在位")
  assert.ok(r.lines.includes("❯ You:") && r.lines.includes(merged), "`❯ You:` + 合并文本落 state.lines")
  assert.equal(r.state.pendingInput.length, 0, "取批清队")
  assert.ok(!r.lines.some((l) => String(l).includes("[User interrupt:")), "非中断锁（零 [User interrupt:]）")
  // 空队列 ⇒ 逐字节等价（零推送）
  const r2 = turnRig({ pendingInput: [] })
  pickupQueuedAtStepBoundary(r2.ctx)
  assert.deepEqual([r2.agent.history.length, r2.lines.length], [0, 0], "空队列 no-op（零推送）")
  // 单条批 ⇒ 原文直发（无编号包裹——与 planQueuedInput merged:false 同判）
  const r3 = turnRig({ pendingInput: ["solo"] })
  pickupQueuedAtStepBoundary(r3.ctx)
  assert.equal(r3.agent.history[0].content, "solo", "单条批原文直发")
})

test("T-F16-19 负向锁（系统轮不参与步边界）：autoTurn 轮传参面 ⇒ consumeQueuedInput 缺省（null）∧ history 零写入 ∧ 队列保持 2 条 ∧ 零回执 ∧ 状态栏条数段 ∧ 待发送块保持", async () => {
  const r = turnRig({ pendingInput: ["a1", "a2"] })
  let seen = null
  r.ctx.runAgent = async (_a, text, _cb, opts) => { r.calls.push(String(text)); seen = opts; opts?.consumeQueuedInput?.(_a) } // 核循环头同址（缺省 ⇒ 零调用）
  await runAgentTurn(r.ctx, "", { autoTurn: true, skipSession: true }) // digestTurn 同形（skipSession——轮末消费点归 driver）
  assert.equal(seen?.consumeQueuedInput, null, "autoTurn 轮不传 pickup 回调（端侧分流 = `autoTurn ? null : …`）")
  assert.equal(r.agent.history.length, 0, "history 零写入（零合并消息）")
  assert.deepEqual(r.state.pendingInput, ["a1", "a2"], "队列保持 2 条（零消费）")
  assert.ok(!r.lines.includes(RECEIPT), "零 `[sending queued message]`")
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0, _inAutoTurn: true }
  r.state.processing = true // 状态栏段判据 = processing（busy 帧读数——回合已收尾故同态取帧）
  assert.ok(stripAnsi(renderStatus(r.state, agent, 120, [])).includes("已排队 2 条消息"), "状态栏条数段在位（零消费证据）")
  assert.ok(convText(r.state).includes("⏳ 待发送 · 2 条消息（不打断当前执行，合并发送）"), "待发送块保持")
})
