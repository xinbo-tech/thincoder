/**
 * busy-injection.test.mjs — F16（busy 期消息注入 · 台账 #213）机器验收 · CLI 半。
 * 设计权威：`docs/cli/design/TUI-INPUT-BOX.md` §4.1（放行判据六条 / 执行序 / 二次提交 /
 * 消费回执）+ `docs/cli/design/TUI.md` §7.5（反馈两段式）；批次档
 * `docs/batches/2026-09-21-busy-injection.md` §2 用例表（T-F16-1…6 住本档；T-F16-7 =
 * `test/input-lock.test.mjs` AC-1 断言翻转 + AC-2/释放窗口/槽满/斜杠 busy 吞零回归面）。
 * 手法：① `createKeyHandler` 桩 ctx 直驱按键（无真实 TTY——先例 `input-lock.test.mjs`）；
 * ② `runAgentTurn` 测试缝（`ctx.runAgent` 桩——回合尾兜底转正 + 队列续发 + 消费回执）；
 * ③ `suspensionSession` 直驱（driver 消费单槽 + 回执——先例 `input-lock.test.mjs` AC-5）；
 * ④ `renderStatus` 纯函数直驱（状态栏 queued 段 + F13 零注意力色对——先例
 * `session-title-surface.test.mjs`）。快层直跑（无定时器悬挂：驱动会话必然终止）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { runAgentTurn } from "../src/tui/agent-turn.mjs"
import { suspensionSession } from "../src/tui/suspension-drive.mjs"
import { renderStatus } from "../src/tui/render-frame.mjs"

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

// ─── T-F16-1 正常：busy Enter → 入槽（清框 + history 收录 + 状态栏 queued 段）───

test("T-F16-1 busy 入槽：Enter ⇒ pendingInput 单槽 = 该文本 ∧ 输入框清空 ∧ history 收录 ∧ 状态栏段含「已排队 1 条消息」∧ 零 submit 零提示行零唤醒", () => {
  const s = baseState({ processing: true, input: [..."msg"], cursor: 3, status: "Processing...", processingStarted: Date.now() })
  const c = keyCtx(s)
  const kh = createKeyHandler(c)
  kh("m", { name: "m" }) // busy 期字符照常回显（吞提交不吞字符）
  assert.deepEqual(s.input, [..."msgm"], "字符回显零改")
  pressEnter(kh)
  assert.deepEqual(s.pendingInput, ["msgm"], "单槽填入该文本（判据六条全满足）")
  assert.deepEqual(s.input, [], "入槽清框（用户视为已发送）")
  assert.equal(s.cursor, 0, "光标复位")
  assert.deepEqual(s.history, ["msgm"], "history 照常收录")
  assert.equal(s.historyIndex, -1, "历史指针复位")
  assert.equal(s._draft, null, "草稿复位")
  assert.equal(c.calls.submit, 0, "不经 submit（回合在跑）")
  assert.equal(c.calls.lines.length, 0, "入槽无对话流提示行（反馈 = 状态栏段）")
  assert.equal(c.calls.wakes, 0, "busy 入槽不唤醒 driver（非挂起态）")
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
    status: "Ready", processingStarted: 0, currentTool: null, streaming: "", reasoning: "",
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

// ─── T-F16-3 边界：槽满二次提交 = 拒绝 + 提示 + 文本保留（不覆盖）───

test("T-F16-3 槽满：pendingInput 既有条目 ⇒ 第二条吞 + 槽满提示 + 输入框文本保留（单槽不变量——不覆盖不丢）", () => {
  const s = baseState({ processing: true, pendingInput: ["first"], input: [..."second"] })
  const c = keyCtx(s)
  pressEnter(createKeyHandler(c))
  assert.deepEqual(s.pendingInput, ["first"], "槽内既有不被覆盖")
  assert.deepEqual(s.input, [..."second"], "被吞文本保留在输入框")
  assert.equal(c.calls.lines.length, 1, "槽满提示一次")
  assert.match(c.calls.lines[0], /待发送/, "槽满提示明示（与挂起态槽满分支同文案）")
  assert.equal(c.calls.submit, 0, "零 submit")
})

// ─── T-F16-4 边界：排除面四形（模态 / digest / 斜杠 / 空）───

test("T-F16-4 排除面：审批卡（模态消费 Enter）/ 挂起会话内 digest / 斜杠 busy / 空 Enter 四形全吞——文本保留 ∧ 零入槽", () => {
  // ① 审批卡挂起（busy + permission）：模态分派链最前——Enter 被模态消费（D-BI1 结构保证：
  //    本路径物理不可达——判据表条件 2 为如实守卫），零入槽零 submit 文本保留
  const s1 = baseState({ processing: true, input: [..."during-approval"], permission: { name: "bash", args: {}, resolve() {} } })
  const c1 = keyCtx(s1)
  pressEnter(createKeyHandler(c1))
  assert.equal(c1.calls.submit, 0, "模态期 Enter 不落 busy 门禁（dispatch 序：模态在前）")
  assert.deepEqual(s1.pendingInput, [], "模态期零入槽（条件 2 排他）")
  assert.deepEqual(s1.input, [..."during-approval"], "文本保留在输入框")
  assert.equal(c1.calls.lines.length, 0, "模态消费静默（自有面板呈现——不叠 busy 提示行）")

  // ② 挂起会话内 digest（suspended ∧ processing）：条件 3 —— 仍吞 + busy 提示
  const s2 = baseState({ processing: true, suspended: true, input: [..."during-digest"] })
  const c2 = keyCtx(s2)
  pressEnter(createKeyHandler(c2))
  assert.deepEqual(s2.pendingInput, [], "digest 期零入槽（挂起两态零改）")
  assert.deepEqual(s2.input, [..."during-digest"], "文本保留")
  assert.match(c2.calls.lines[0], /主会话处理中/, "busy 提示同文案")

  // ③ 斜杠 busy（条件 4）：吞 + busy 提示 + 文本保留（白名单已删语义不变）
  const s3 = baseState({ processing: true, input: [..."/exit"] })
  const c3 = keyCtx(s3)
  pressEnter(createKeyHandler(c3))
  assert.deepEqual(s3.pendingInput, [], "斜杠零入槽")
  assert.deepEqual(s3.input, [..."/exit"], "文本保留输入框")
  assert.match(c3.calls.lines[0], /主会话处理中/, "斜杠吞同提示")
  assert.equal(c3.calls.submit, 0, "斜杠不经 submit（busy 禁发）")

  // ④ 空 Enter（条件 5）：静默（零提示行零入槽）
  const s4 = baseState({ processing: true, input: [..."   "] })
  const c4 = keyCtx(s4)
  pressEnter(createKeyHandler(c4))
  assert.equal(c4.calls.lines.length, 0, "空/纯空白静默无提示")
  assert.deepEqual(s4.pendingInput, [], "零入槽")
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

// ─── T-F16-6 机判：状态栏 queued 段纯函数面（含/不含 + F13 零注意力色对）───

test("T-F16-6 状态栏段：processing ∧ 槽非空 ⇒ strip-ANSI 含「已排队 1 条消息」∧ 零 \\x1b[43m；槽空/非 processing ⇒ 不含（现状文案零改）", () => {
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  const st = (over = {}) => ({
    input: [], cursor: 0, scroll: 0, tasks: [], queue: [], history: [], historyIndex: -1, _draft: null,
    processing: false, processingStarted: Date.now(), status: "Ready", currentTool: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 },
    permission: null, question: null, picker: null, wizard: null, search: null, interruptPrompt: null,
    suspended: false, _suspPending: false, attentionAwaiting: false, pendingInput: [],
    ...over,
  })
  const queued = renderStatus(st({ processing: true, pendingInput: ["x"] }), agent, 120, [])
  assert.ok(stripAnsi(queued).includes("已排队 1 条消息"), "busy ∧ 槽非空 ⇒ queued 段在位")
  assert.ok(!queued.includes("\x1b[43m"), "零注意力色对（F13 豁免——dim 信息段非 chip）")
  const busyEmpty = renderStatus(st({ processing: true, pendingInput: [] }), agent, 120, [])
  assert.ok(!stripAnsi(busyEmpty).includes("已排队 1 条消息"), "槽空 ⇒ 段零注入")
  assert.match(stripAnsi(busyEmpty), /主会话处理中/, "槽空走既有 busy 文案（零改）")
  assert.ok(!busyEmpty.includes("\x1b[43m"), "槽空态零注意力色对")
  const idle = renderStatus(st({ processing: false, pendingInput: ["x"] }), agent, 120, [])
  assert.ok(!stripAnsi(idle).includes("已排队 1 条消息"), "非 busy ⇒ 段零注入（派生自 processing ∧ 槽）")
  assert.match(stripAnsi(idle), /Enter: send/, "空闲文案零改")
})
