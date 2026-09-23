/**
 * busy-injection.test.mjs — F16（busy 期消息注入 · 台账 #213；busy-extend 扩面 2026-09-22 ·
 * 台账 #224）机器验收 · CLI 半。
 * 设计权威：`docs/cli/design/TUI-INPUT-BOX.md` §4.1（放行判据五条 / 执行序 / 二次提交 /
 * 消费回执）+ `docs/cli/design/TUI.md` §7.5（反馈两段式 + `enterHint` 三态表）；批次档
 * `docs/batches/2026-09-21-busy-injection.md` §2 用例表（T-F16-1…6 住本档；T-F16-7 =
 * `test/input-lock.test.mjs` AC-1 断言翻转 + AC-2/释放窗口/槽满/斜杠 busy 吞零回归面）+ busy-extend
 * 批档 §2 用例面（T-F16-8 = 挂起内入槽 / 槽满；T-F16-9 = driver 轮末消费；T-F16-6 扩三态）。
 * 手法：① `createKeyHandler` 桩 ctx 直驱按键（无真实 TTY——先例 `input-lock.test.mjs`）；
 * ② `runAgentTurn` 测试缝（`ctx.runAgent` 桩——回合尾兜底转正 + 队列续发 + 消费回执）；
 * ③ `suspensionSession` 直驱（driver 消费单槽 + 回执——先例 `input-lock.test.mjs` AC-5）；
 * ④ `renderStatus` 纯函数直驱（状态栏 queued 段 + F13 零注意力色对——先例
 * `session-title-surface.test.mjs`）。快层直跑（无定时器悬挂：驱动会话必然终止）。
 * queue-visible 批（2026-09-24 · 台账 #249）：容量 8 + 合并消费（R15 恢复）+ 步边界 pickup——
 * 用例表 T-F16-10…19（本档）；设计 = `TUI.md` §7.5（待发送块 / 四态 / 三时机）· `TUI-INPUT-BOX.md`
 * §4.1（容量 / 满队）· `AGENT-LOOP-ASYNC-POOL.md` §6.8（步边界 pickup）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { runAgentTurn } from "../src/tui/agent-turn.mjs"
import { suspensionSession } from "../src/tui/suspension-drive.mjs"
import { renderStatus } from "../src/tui/render-frame.mjs"
import { buildConvLines } from "../src/tui/render-conversation.mjs"
import { planQueuedInput, formatMergedMessages, MAX_MERGE_ITEMS, MAX_MERGE_CHARS } from "../src/tui/queued-merge.mjs"
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

/** createKeyHandler 桩 ctx（submit / 提示行 / 唤醒计数——挂载点与生产同形）。 */
function keyCtx(state, over = {}) {
  const calls = { submit: 0, wakes: 0, lines: [], renders: 0 }
  state._suspWake ??= () => { calls.wakes++ }
  const base = {
    agent: {},
    state,
    render() { calls.renders++ },
    popPicker() {}, renderPickerLines() {},
    handleSlash: async () => {}, handleTab() {},
    submit: async () => { calls.submit++ },
    pasteClipboardImage: async () => {},
    wizardChooseProvider() {}, wizardSubmitText() {}, cancelWizard() {},
    wizardProviderItems: () => [], renderWizard() {},
    pushLine: (text) => calls.lines.push(String(text)),
    cleanup() {}, showPicker() {}, loadOlder() {},
    ...over,
  }
  base.calls = calls
  return base
}

const pressEnter = (kh) => kh("\r", { name: "return" })

// ─── T-F16-1 正常：busy Enter → 入队（清框 + history 收录 + 状态栏 queued 段）───

test("T-F16-1 busy 入队：Enter ⇒ pendingInput 队列 = 该文本 ∧ 输入框清空 ∧ history 收录 ∧ 状态栏段含「已排队 1 条消息」∧ 零 submit 零提示行零唤醒", () => {
  const s = baseState({ processing: true, input: [..."msg"], cursor: 3, status: "Processing...", processingStarted: Date.now() })
  const c = keyCtx(s)
  const kh = createKeyHandler(c)
  kh("m", { name: "m" }) // busy 期字符照常回显（吞提交不吞字符）
  assert.deepEqual(s.input, [..."msgm"], "字符回显零改")
  pressEnter(kh)
  assert.deepEqual(s.pendingInput, ["msgm"], "队列填入该文本（判据五条全满足——§4.1）")
  assert.deepEqual(s.input, [], "入队清框（用户视为已发送）")
  assert.equal(s.cursor, 0, "光标复位")
  assert.deepEqual(s.history, ["msgm"], "history 照常收录")
  assert.equal(s.historyIndex, -1, "历史指针复位")
  assert.equal(s._draft, null, "草稿复位")
  assert.equal(c.calls.submit, 0, "不经 submit（回合在跑）")
  assert.equal(c.calls.lines.length, 0, "入队无对话流提示行（反馈 = 状态栏段）")
  assert.equal(c.calls.wakes, 0, "busy 入队不唤醒 driver（非挂起态）")
  // 反馈段：同状态直驱 renderStatus（真派生——segment 读 pendingInput.length）
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  const flat = stripAnsi(renderStatus(s, agent, 120, []))
  assert.ok(flat.includes("已排队 1 条消息"), `状态栏 queued 段在位（实到 ${JSON.stringify(flat)}）`)
})

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

// ─── T-F16-3 边界：容量 8（第 9 条）= 拒绝 + 提示 + 文本保留（不覆盖）───

test("T-F16-3 容量：容量内再提交 ⇒ 连续入队；第 9 条吞 + 满队提示含「已排队 8 条消息」+ 输入框文本保留（不覆盖不丢）", () => {
  // 容量内（阈 1 → 8——queue-visible 批多槽裁定）：连续入队，每条各占一项
  const s0 = baseState({ processing: true, pendingInput: ["first"], input: [..."second"] })
  const c0 = keyCtx(s0)
  pressEnter(createKeyHandler(c0))
  assert.deepEqual(s0.pendingInput, ["first", "second"], "容量内再提交 ⇒ 连续入队（多槽）")
  assert.equal(c0.calls.submit, 0, "零 submit")

  // 第 9 条：拒 + 提示 + 文本保留
  const full = Array.from({ length: 8 }, (_, i) => `q${i}`)
  const s = baseState({ processing: true, pendingInput: [...full], input: [..."ninth"] })
  const c = keyCtx(s)
  pressEnter(createKeyHandler(c))
  assert.deepEqual(s.pendingInput, full, "满队不覆盖（8 条逐字保持）")
  assert.deepEqual(s.input, [..."ninth"], "被拒文本保留在输入框")
  assert.equal(c.calls.lines.length, 1, "满队提示一次")
  assert.match(c.calls.lines[0], /已排队 8 条消息/, "满队提示明示（阈 1 → 8）")
  assert.equal(c.calls.submit, 0, "零 submit")
})

// ─── T-F16-4 边界：排除面四形（模态 / digest / 斜杠 / 空）───

test("T-F16-4 排除与挂起面：审批卡（模态消费 Enter）/ 斜杠 busy 吞——文本保留 ∧ 零入槽；挂起会话内 busy ⇒ 同判据入槽（清框 + 唤醒）；空 Enter 静默", () => {
  // ① 审批卡挂起（busy + permission）：模态分派链最前——Enter 被模态消费（D-BI1 结构保证：
  //    本路径物理不可达——判据表条件 2 为如实守卫），零入槽零 submit 文本保留
  const s1 = baseState({ processing: true, input: [..."during-approval"], permission: { name: "bash", args: {}, resolve() {} } })
  const c1 = keyCtx(s1)
  pressEnter(createKeyHandler(c1))
  assert.equal(c1.calls.submit, 0, "模态期 Enter 不落 busy 门禁（dispatch 序：模态在前）")
  assert.deepEqual(s1.pendingInput, [], "模态期零入槽（条件 2 排他）")
  assert.deepEqual(s1.input, [..."during-approval"], "文本保留在输入框")
  assert.equal(c1.calls.lines.length, 0, "模态消费静默（自有面板呈现——不叠 busy 提示行）")

  // ② 挂起会话内 busy（suspended ∧ processing）：busy-extend 批改述——同判据入队（原「仍吞」撤销）
  const s2 = baseState({ processing: true, suspended: true, input: [..."during-digest"], cursor: 13 })
  const c2 = keyCtx(s2)
  pressEnter(createKeyHandler(c2))
  assert.deepEqual(s2.pendingInput, ["during-digest"], "入 pendingInput 队列（挂起两态不再是吞面）")
  assert.deepEqual(s2.input, [], "入槽清框 + 光标复位")
  assert.equal(s2.cursor, 0, "光标复位")
  assert.deepEqual(s2.history, ["during-digest"], "history 照常收录")
  assert.equal(c2.calls.wakes, 1, "挂起面入槽同款唤醒（呼叫点执行）")
  assert.equal(c2.calls.lines.length, 0, "入槽零提示行（反馈 = 状态栏段）")
  assert.equal(c2.calls.submit, 0, "不经 submit")

  // ③ 斜杠 busy（条件 3）：吞 + busy 提示 + 文本保留（白名单已删语义不变）
  const s3 = baseState({ processing: true, input: [..."/exit"] })
  const c3 = keyCtx(s3)
  pressEnter(createKeyHandler(c3))
  assert.deepEqual(s3.pendingInput, [], "斜杠零入槽")
  assert.deepEqual(s3.input, [..."/exit"], "文本保留输入框")
  assert.match(c3.calls.lines[0], /主会话处理中/, "斜杠吞同提示")
  assert.equal(c3.calls.submit, 0, "斜杠不经 submit（busy 禁发）")

  // ④ 空 Enter（条件 4）：静默（零提示行零入槽）
  const s4 = baseState({ processing: true, input: [..."   "] })
  const c4 = keyCtx(s4)
  pressEnter(createKeyHandler(c4))
  assert.equal(c4.calls.lines.length, 0, "空/纯空白静默无提示")
  assert.deepEqual(s4.pendingInput, [], "零入槽")
})

// ─── T-F16-8 正常/边界：挂起内 busy 入队 + 满队吞（可区分判据）───

test("T-F16-8 挂起内 busy：队列未满 ⇒ 入队（pendingInput + 清框 + history + 唤醒 + 零对话提示行）；满队 ⇒ 吞（清框不发生 + 队列既有项不被覆盖 + 非空恒显 dim 段）", () => {
  // 挂起会话内 busy + 队列未满：与普通 busy 同判据入队（busy-extend 批 AC-1 扩面）
  const s1 = baseState({ processing: true, suspended: true, input: [..."session-msg"], cursor: 11, })
  const c1 = keyCtx(s1)
  pressEnter(createKeyHandler(c1))
  assert.deepEqual(s1.pendingInput, ["session-msg"], "队列填入（两面共用同一队列）")
  assert.deepEqual(s1.input, [], "入队清框")
  assert.equal(s1.cursor, 0, "光标复位")
  assert.deepEqual(s1.history, ["session-msg"], "history 收录")
  assert.equal(s1._draft, null, "草稿复位")
  assert.equal(c1.calls.wakes, 1, "挂起面入队同款唤醒")
  assert.equal(c1.calls.submit, 0, "不经 submit")
  assert.equal(c1.calls.lines.length, 0, "零对话提示行（反馈 = 状态栏段）")

  // 满队形（挂起内 busy · 队列已满 8 条）：吞——可区分判据 = 清框不发生 + 既有项不覆盖 + 零入队
  const full = Array.from({ length: 8 }, (_, i) => `q${i}`)
  const s2 = baseState({ processing: true, suspended: true, pendingInput: [...full], input: [..."second"], cursor: 6 })
  const c2 = keyCtx(s2)
  pressEnter(createKeyHandler(c2))
  assert.equal(s2.pendingInput.length, 8, "队列既有不被覆盖（长度不变）")
  assert.equal(s2.pendingInput[0], "q0", "队列首项逐字不变")
  assert.deepEqual(s2.input, [..."second"], "清框不发生（输入框段文本逐字不变）")
  assert.equal(s2.cursor, 6, "光标零动")
  assert.equal(c2.calls.lines.length, 1, "吞 + 满队提示一次")
  assert.match(c2.calls.lines[0], /已排队 8 条消息/, "满队提示与既有满队分支逐字同构")
  assert.equal(c2.calls.wakes, 0, "吞 ⇒ 零唤醒（零入队）")
  // 提示段 = 队列非空恒显 dim 段（TUI.md §7.5 表第 1 行逐字）
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  assert.ok(stripAnsi(renderStatus(s2, agent, 120, [])).includes("已排队 8 条消息"), "队列非空 ⇒ dim 段在位（N = 8）")
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

// ─── T-F16-6 机判：状态栏段四态逐字（TUI.md §7.5）＋ F13 零注意力色对 ───

test("T-F16-6 状态栏段四态：队列非空 N = 2 ⇒ 「已排队 2 条消息」；队空 ⇒ 普通 busy / 挂起内用户回合 / 挂起内系统轮排队句逐字；非 processing ⇒ Enter: send；全程零 \\x1b[43m", () => {
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  const autoAgent = { ...agent, _inAutoTurn: true }
  const st = (over = {}) => ({
    input: [], cursor: 0, scroll: 0, tasks: [], queue: [], history: [], historyIndex: -1, _draft: null,
    processing: false, processingStarted: Date.now(), status: "Ready", currentTool: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 },
    permission: null, question: null, picker: null, wizard: null, search: null, interruptPrompt: null,
    suspended: false, _suspPending: false, attentionAwaiting: false, pendingInput: [],
    ...over,
  })
  const queued = renderStatus(st({ processing: true, pendingInput: ["x", "y"] }), agent, 120, [])
  assert.ok(stripAnsi(queued).includes("已排队 2 条消息"), "队列非空 ⇒ 条数段逐字（N = 2——多槽）")
  assert.ok(!queued.includes("\x1b[43m"), "零注意力色对（F13 豁免——dim 信息段非 chip）")
  const busyEmpty = renderStatus(st({ processing: true, pendingInput: [] }), agent, 120, [])
  assert.ok(!stripAnsi(busyEmpty).includes("已排队"), "队空 ⇒ 条数段零注入")
  assert.ok(stripAnsi(busyEmpty).includes("主会话处理中 — Enter 排队（当前步骤结束后自动发送）"), "队空 + 非挂起 ⇒ 普通 busy 排队句逐字（步边界承诺）")
  assert.ok(!busyEmpty.includes("\x1b[43m"), "队空态零注意力色对")
  const suspUser = renderStatus(st({ processing: true, pendingInput: [], suspended: true }), agent, 120, [])
  assert.ok(stripAnsi(suspUser).includes("会话内回合处理中 — Enter 排队（当前步骤结束后自动发送）"), "挂起内用户回合（_inAutoTurn 假）⇒ 步边界句逐字")
  assert.ok(!suspUser.includes("\x1b[43m"), "挂起态零注意力色对")
  const suspSys = renderStatus(st({ processing: true, pendingInput: [], suspended: true }), autoAgent, 120, [])
  assert.ok(stripAnsi(suspSys).includes("会话内回合处理中 — Enter 排队（本轮结束后优先发送）"), "挂起内系统轮（_inAutoTurn 真）⇒ 轮末句逐字")
  const winEmpty = renderStatus(st({ processing: true, pendingInput: [], _suspPending: true }), agent, 120, [])
  assert.ok(stripAnsi(winEmpty).includes("会话内回合处理中 — Enter 排队（当前步骤结束后自动发送）"), "释放窗口（_suspPending）同判")
  const idle = renderStatus(st({ processing: false, pendingInput: ["x"] }), agent, 120, [])
  assert.ok(!stripAnsi(idle).includes("已排队"), "非 processing ⇒ 段零注入（派生自 processing ∧ 队列）")
  assert.match(stripAnsi(idle), /Enter: send/, "空闲文案零改")
})

// ═══ queue-visible 批（2026-09-24 · 台账 #249）：待发送块 / 合并计划 / 步边界 pickup ═══
// 设计 = `TUI.md` §7.5（待发送块 · 四态 · 三时机）· `TUI-INPUT-BOX.md` §4.1（容量 / 满队）·
// `AGENT-LOOP-ASYNC-POOL.md` §6.8（步边界 pickup）。用例表 T-F16-10…19（批档 §2）。

/** 会话渲染夹具（`buildConvLines` 直驱——cols 给足免折行干扰形态断言）。 */
function convState(queued, over = {}) {
  return baseState({
    lines: [], streaming: "", reasoning: "", _advisorBlocks: [], expandedBlocks: new Set(),
    foldEnabled: true, search: null, _foldScroll: null, pendingInput: queued, ...over,
  })
}
const convText = (state, cols = 120) => buildConvLines(state, cols, 0).map((l) => l.text)

test("T-F16-10 排队块单条：队列 N = 1 ⇒ 标签行逐字 + 原文行 ∧ 无编号头 ∧ 渲染序在 state.streaming 之后 ∧ 零 state.lines 写入（派生插槽）", () => {
  const flat = convText(convState(["hello world"]))
  assert.ok(flat.includes("⏳ 待发送 · 不打断当前执行，自动发送"), `标签行逐字（实到 ${JSON.stringify(flat)}）`)
  assert.ok(flat.includes("hello world"), "原文行在位（含用户原文）")
  assert.ok(!flat.some((t) => /^\d+\. /.test(t)), "单条不加编号")
  // 渲染序（旧否决的正面处置）：块在 state.streaming 渲染行之后 ⇒ 流在上方增长、块恒居会话区底
  const flat2 = convText(convState(["tail-msg"], { streaming: "streamed-reply-line" }))
  assert.ok(flat2.indexOf("⏳ 待发送 · 不打断当前执行，自动发送") > flat2.indexOf("streamed-reply-line"), "块行序在 streaming 渲染行之后")
  // 载体 = 派生（零生命周期簿记——判据消失即消）
  const s = convState(["derived-only"])
  convText(s)
  assert.equal(s.lines.length, 0, "派生零写入（不入 state.lines / 不入会话历史）")
})

test("T-F16-11 排队块多条：N = 2 ⇒ 标签含条数逐字 ∧ `1. ` / `2. ` 编号行（顺序 = 入队序，编号 = 合并形态预览）", () => {
  const flat = convText(convState(["alpha", "beta"]))
  assert.ok(flat.includes("⏳ 待发送 · 2 条消息（不打断当前执行，合并发送）"), `多条标签逐字（N ≥ 2，实到 ${JSON.stringify(flat)}）`)
  const i1 = flat.indexOf("1. alpha")
  const i2 = flat.indexOf("2. beta")
  assert.ok(i1 >= 0 && i2 > i1, "编号行按入队序")
  assert.ok(flat.indexOf("⏳ 待发送 · 2 条消息（不打断当前执行，合并发送）") < i1, "标签行置于块首（C.warn 前置于 dim 连跑）")
})

test("T-F16-12 排队块边界（负向锁）：队列空 ⇒ 零该串 ∧ 字段缺省逐字节等价；超 3 行 ⇒ 原文行 ≤ 3 + 尾标记行逐字；全程零 \\x1b[43m", () => {
  // 负向锁（同 renderStatus 负向锁纪律）：队列空 / 字段缺省 ⇒ 零该串
  const emptyLines = buildConvLines(convState([]), 100, 0)
  assert.ok(!emptyLines.some((l) => l.text.includes("待发送")), "队列空 ⇒ 零该串")
  const undefLines = buildConvLines(convState([], { pendingInput: undefined }), 100, 0)
  assert.deepEqual(undefLines.filter((l) => l.text.includes("待发送")), [], "字段缺省同判（逐字节等价面）")
  // 超限：每条原文行 ≤ QUEUED_ITEM_MAX_LINES（3）+ 该条尾标记行逐字
  const longItem = Array.from({ length: 6 }, (_, i) => `body-${i}`).join("\n")
  const flat = convText(convState([longItem]))
  assert.equal(flat.filter((t) => t.startsWith("body-")).length, 3, "原文行 ≤ 3（QUEUED_ITEM_MAX_LINES）")
  assert.ok(flat.includes("… [该条共 6 行——发送后完整显示]"), "该条尾标记行逐字（N = 总行数）")
  // 超宽 / 长单行：折行后同样受上限约束（不劈半由既有 wrapText 保证）
  const wide = "宽".repeat(400)
  const wideLines = convText(convState([wide]), 40)
  assert.ok(wideLines.filter((t) => t.includes("宽")).length <= 3, "超宽长单行 ⇒ 折行后仍 ≤ 3 行")
  assert.ok(wideLines.some((t) => /共 \d+ 行——发送后完整显示/.test(t)), "折行数进尾标记")
  // F13 豁免（零注意力色对）——渲染帧全程
  const frame = convText(convState(["x"]))
  assert.ok(!frame.join("").includes("\x1b[43m"), "全程零 \\x1b[43m")
})

test("T-F16-13 容量 8：连续入队 8 条全入（长度 === 8）∧ 第 9 条拒 + 提示含「已排队 8 条消息」+ 文本保留 ∧ 入队恢复跟随", () => {
  const s = baseState({ processing: true, scroll: 42, _followTail: false })
  const c = keyCtx(s)
  const kh = createKeyHandler(c)
  for (let i = 0; i < 8; i++) {
    s.input = [...`m${i}`]; s.cursor = 2
    pressEnter(kh)
  }
  assert.equal(s.pendingInput.length, 8, "前 8 条全入（容量 8——多槽）")
  assert.deepEqual(s.pendingInput, Array.from({ length: 8 }, (_, i) => `m${i}`), "逐条可见（顺序 = 入队序）")
  assert.deepEqual([s.scroll, s._followTail], [0, true], "入队恢复跟随（F4——新提交消息同列；§7.5 跟随）")
  s.input = [..."ninth"]; s.cursor = 5
  pressEnter(kh)
  assert.equal(s.pendingInput.length, 8, "第 9 条拒（零覆盖）")
  assert.deepEqual(s.input, [..."ninth"], "被拒文本保留在输入框")
  assert.equal(c.calls.lines.length, 1, "拒 + 提示一次")
  assert.match(c.calls.lines[0], /已排队 8 条消息/, "满队提示逐字")
})

test("T-F16-14 合并计划（`planQueuedInput` 纯函数 · R15 逐字恢复）：2 条短 ⇒ 单动作 merged 批；9 条 ⇒ 截批先行；单条 > 2000 字符 ⇒ 直发；/cmd ⇒ 逐条动作（保序、不进合并）", () => {
  const p2 = planQueuedInput(["a", "b"])
  assert.equal(p2.length, 1, "2 条 ⇒ 单动作（一次消费）")
  assert.deepEqual([p2[0].kind, p2[0].count, p2[0].merged], ["turn", 2, true], "合并批（merged:true）")
  assert.equal(p2[0].text, "你排队了 2 条消息：\n1. a\n2. b\n——一次处理", "形态逐字 = R15（头 + 编号 + 尾）")
  assert.equal(p2[0].text, formatMergedMessages(["a", "b"]), "与格式化函数同源")
  const p9 = planQueuedInput(Array.from({ length: 9 }, (_, i) => `m${i}`))
  assert.equal(p9[0].count, 8, "9 条 ⇒ 首动作满批 8 条（≤ MAX_MERGE_ITEMS）")
  assert.equal(p9[1].count, 1, "余下留待下批（不丢——多回合）")
  const big = "x".repeat(MAX_MERGE_CHARS + 1)
  const pBig = planQueuedInput([big])
  assert.deepEqual([pBig[0].merged, pBig[0].count], [false, 1], "单条 > 2000 字符 ⇒ merged:false 直发（不进批）")
  assert.equal(pBig[0].text, big, "原文直发（零包裹）")
  const charCapped = planQueuedInput(["y".repeat(1500), "z".repeat(1500)])
  assert.equal(charCapped[0].count, 1, "合并文本超 2000 字符 ⇒ 截批先行")
  const pMix = planQueuedInput(["/help", "a", "b", "/exit", "c"])
  assert.deepEqual(pMix.map((a) => a.kind), ["slash", "turn", "slash", "turn"], "/cmd 逐条动作（保序——不进合并缓冲）")
  assert.equal(pMix[1].text, formatMergedMessages(["a", "b"]), "非 / 连续条目攒批")
})

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

test("T-F16-17 状态栏条数段（机判）：队列非空 N = 2 ⇒ 含「已排队 2 条消息」∧ 全程零 \\x1b[43m", () => {
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  const s = baseState({ processing: true, processingStarted: Date.now(), status: "Processing...", pendingInput: ["p", "q"] })
  const out = renderStatus(s, agent, 120, [])
  assert.ok(stripAnsi(out).includes("已排队 2 条消息"), `条数段逐字（N = 2——实到 ${JSON.stringify(stripAnsi(out))}）`)
  assert.ok(!out.includes("\x1b[43m"), "全程零 \\x1b[43m（F13 豁免）")
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

