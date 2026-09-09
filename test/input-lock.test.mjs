/**
 * input-lock.test.mjs — INPUT-LOCK-ASYNC（C'——docs/design/INPUT-LOCK-ASYNC.md——2026-09-09）
 * 用例表测试锁：busy（processing 含 digest）输入禁用（提交吞 + busy 提示）/ 白名单忙时
 * 直执行 / 挂起空闲输入开放（单槽）/ 释放窗口单槽交接 / abort 零丢失 / 状态栏 busy 文案。
 * 手法：createKeyHandler 桩 ctx 直驱按键（无真实 TTY）；suspensionSession 桩 agent/state
 * 直驱驱动循环（ctx.runAgent 注入——runAgentTurn 测试缝——真实单消息交接路径）。快层直跑
 * （<800ms——无定时器悬挂：驱动会话必然终止）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { suspensionSession } from "../src/tui/suspension-drive.mjs"
import { renderStatus } from "../src/tui/render-frame.mjs"

/** busy 白名单（index.mjs submit 同集同源——测试复制锁：白名单任一变更需同步本集）。 */
const BUSY_SAFE = new Set(["/help", "/exit", "/model", "/submodel", "/shell", "/think", "/config", "/skills", "/mcp", "/goal", "/session"])
const busySafeCommand = (text) => BUSY_SAFE.has(text.split(/\s+/)[0].toLowerCase())

/** 最小按键态。 */
function baseState(over = {}) {
  return {
    input: [], cursor: 0, history: [], historyIndex: -1, _draft: null,
    processing: false, suspended: false, _suspPending: false, pendingInput: [],
    queue: [], subTasks: {}, tasks: [], scroll: 0, _followTail: true,
    ...over,
  }
}

/** createKeyHandler 桩 ctx（submit/提示行记录；唤醒槽 = state._suspWake——真实挂载点）。 */
function keyCtx(state, over = {}) {
  const calls = { submit: 0, wakes: 0, lines: [] }
  state._suspWake ??= () => { calls.wakes++ }
  const base = {
    agent: {},
    state,
    render() {},
    popPicker() {}, renderPickerLines() {},
    handleSlash: async () => {}, handleTab() {},
    submit: async () => { calls.submit++ },
    pasteClipboardImage: async () => {},
    wizardChooseProvider() {}, wizardSubmitText() {}, cancelWizard() {},
    wizardProviderItems: () => [], renderWizard() {},
    pushLine: (text) => calls.lines.push(text),
    cleanup() {}, showPicker() {}, loadOlder() {},
    busySafeCommand,
    ...over,
  }
  base.calls = calls
  return base
}

const pressEnter = (kh) => kh("\r", { name: "return" })

// ─── AC-1/AC-3：busy 提交吞 + 白名单直执行（普通回合 + digest 两态）────────

test("busy（processing）输入禁用：非白名单 Enter 提交吞 + busy 提示 + 字符保留（AC-1——F-3）；digest（processing+suspended）同判据不落 pendingInput；白名单忙时直执行（AC-3——F-4）；空 Enter 无提示", () => {
  // 普通回合 busy：打字照进输入框（回显），Enter 吞——文本保留 + busy 提示 + 不 submit
  const s1 = baseState({ processing: true, input: [..."hello"], cursor: 5 })
  const c1 = keyCtx(s1)
  const kh1 = createKeyHandler(c1)
  kh1("h", { name: "h" }) // 字符回显（busy 期可打字）
  assert.deepEqual(s1.input, [..."helloh"], "字符照进输入框回显（吞提交不吞字符）")
  pressEnter(kh1)
  assert.equal(c1.calls.submit, 0, "非白名单 Enter 提交被吞（不 submit）")
  assert.equal(c1.calls.lines.length, 1, "busy 提示一次")
  assert.match(c1.calls.lines[0], /主会话处理中/, "busy 提示文案含主会话处理中")
  assert.deepEqual(s1.input, [..."helloh"], "吞提交不清框（文本保留——回合结束重按 Enter）")

  // digest 两态（suspended && processing）：同一 processing 判据——吞——不落 pendingInput
  const s2 = baseState({ processing: true, suspended: true, input: [..."during-digest"] })
  const c2 = keyCtx(s2)
  pressEnter(createKeyHandler(c2))
  assert.equal(c2.calls.submit, 0, "digest 期 Enter 提交吞（F-1 单一判据）")
  assert.equal(s2.pendingInput.length, 0, "digest 期不排队（旧 D-S5 入队已废——禁排队）")
  assert.match(c2.calls.lines[0], /主会话处理中/, "digest 期 busy 提示同文案")

  // 白名单忙时直执行（/exit /help /model——检查先于吞判）
  const s3 = baseState({ processing: true, input: [..."/exit"] })
  const c3 = keyCtx(s3)
  pressEnter(createKeyHandler(c3))
  assert.equal(c3.calls.submit, 1, "白名单斜杠忙时直执行（不经吞——submit 直放行）")
  assert.equal(c3.calls.lines.length, 0, "白名单无 busy 提示")
  assert.deepEqual(s3.input, [..."/exit"], "submit 未执行清框（真实 submit 侧清框）")

  // 空 Enter busy：无提示无动作（静默——不刷屏）
  const s4 = baseState({ processing: true })
  const c4 = keyCtx(s4)
  pressEnter(createKeyHandler(c4))
  assert.equal(c4.calls.lines.length, 0, "空提交无 busy 提示")

  // 多行换行 Enter（meta+return——Shift+Enter 翻译形）busy 期照常编辑（插入 \n——不吞不提示）
  const s5 = baseState({ processing: true, input: [..."draft"], cursor: 5 })
  const c5 = keyCtx(s5)
  createKeyHandler(c5)("\r", { name: "return", meta: true })
  assert.deepEqual(s5.input, [..."draft", "\n"], "meta+Enter 插新行（编辑放行——F-3 吞提交不吞编辑）")
  assert.equal(c5.calls.lines.length, 0, "多行编辑无 busy 提示")
  assert.equal(c5.calls.submit, 0, "多行编辑不提交")
})

// ─── AC-2：挂起空闲输入开放（单槽）+ 释放窗口同路径 + 槽满吞 ────────────

test("挂起空闲输入开放：Enter 填 pendingInput 单槽 + 唤醒（AC-2——F-6）；释放窗口（_suspPending）同路径；槽满吞 + 提示（文本保留——不覆盖不丢失）；斜杠命令挂起空闲直走 submit", () => {
  // 挂起空闲（纯后台池跑——主空闲）：立即接收入单槽——唤醒 driver
  const s1 = baseState({ suspended: true, input: [..."pool-wait-msg"] })
  const c1 = keyCtx(s1)
  pressEnter(createKeyHandler(c1))
  assert.deepEqual(s1.pendingInput, ["pool-wait-msg"], "单槽填入（至多一条待交接）")
  assert.equal(c1.calls.wakes, 1, "唤醒 driver（waitForSettleOrWake）")
  assert.deepEqual(s1.input, [], "输入框已清空（用户视为已发送——气泡由回合起点补画）")
  assert.equal(c1.calls.submit, 0, "挂起 Enter 不经 submit")

  // 释放窗口（_suspPending——回合尾池仍 live）：同路径（单槽交接守卫保留——F-8）
  const s2 = baseState({ _suspPending: true, input: [..."window-msg"] })
  const c2 = keyCtx(s2)
  pressEnter(createKeyHandler(c2))
  assert.deepEqual(s2.pendingInput, ["window-msg"], "释放窗口 Enter 入单槽（偏差 #1 守卫语义保留）")

  // 槽满：第二条吞 + 提示——文本保留（不覆盖不静默丢）
  const s3 = baseState({ suspended: true, pendingInput: ["first"], input: [..."second"] })
  const c3 = keyCtx(s3)
  pressEnter(createKeyHandler(c3))
  assert.deepEqual(s3.pendingInput, ["first"], "槽满不覆盖（单槽不变量）")
  assert.deepEqual(s3.input, [..."second"], "被吞文本保留在输入框")
  assert.match(c3.calls.lines[0], /待发送/, "槽满提示明示")

  // 挂起空闲斜杠命令：submit 直行（submit 侧 handleSlash——控制通道）
  const s4 = baseState({ suspended: true, input: [..."/help"] })
  const c4 = keyCtx(s4)
  pressEnter(createKeyHandler(c4))
  assert.equal(c4.calls.submit, 1, "挂起态斜杠命令经 submit（紧急控制不排队）")
})

// ─── AC-5：单槽交接（释放窗口）+ abort 零丢失（suspensionSession 直驱）───

/** 最小驱动 ctx/agent/state（runAgentTurn 测试缝——ctx.runAgent 注入——不触网）。 */
function driveRig(pendingInput = []) {
  const agent = {
    _asyncSubagents: new Map([[1, { id: 1, role: "subagent", status: "running" }]]),
    _asyncAdvisors: new Map(),
    _sessionAbort: new AbortController(),
    _sessionAbortAll: [],
    _suspended: false,
    title: "locked", // ensureSessionTitle 短路（不触网）
    history: [],
  }
  const state = baseState({ pendingInput, suspended: false, queue: [] })
  const turns = []
  const lines = []
  const ctx = {
    agent,
    state,
    render() {},
    pushLine: (t) => lines.push(t),
    pushLabel() {},
    ensureAssistantLabel() {},
    scheduleRender() {},
    askPermission: null, askBatchPermission: null, askQuestion: null,
    handleSlash: null,
    runAgent: async (_a, text) => { turns.push(String(text)) },
    saveSession: async () => {},
  }
  return { agent, state, ctx, turns, lines }
}

test("单槽交接：driver 消费 pendingInput 单条即开回合（原文直发——无合并包裹）；abort 零丢失：中止时单槽残余转 state.queue + 提示（AC-5——F-8/AC-S2）", async () => {
  // 单槽交接：driver 挂起等待 → 消息入槽 + 唤醒 → 消费清槽 → 以原文开回合
  const { agent, state, ctx, turns } = driveRig()
  const session = suspensionSession(ctx)
  await new Promise((r) => setTimeout(r, 5)) // driver 进入 waitForSettleOrWake
  state.pendingInput.push("handover-msg")
  state._suspWake?.()
  await new Promise((r) => setTimeout(r, 15)) // 消费 + runAgentTurn（stub）微任务链
  assert.deepEqual(turns, ["handover-msg"], "driver 以原文单消息开回合（无合并/编号包裹——R15 废弃）")
  assert.equal(state.pendingInput.length, 0, "消费清槽")
  // 会话终止（_suspAborted + 唤醒）——防悬挂
  state._suspAborted = true
  state._suspWake?.()
  await session
  assert.equal(state.suspended, false, "会话退出复位 suspended")

  // abort 零丢失：中止前单槽已有消息（Enter 已清框入槽——用户视为已发送）→ 转 state.queue
  const r2 = driveRig(["keep-me"])
  r2.agent._sessionAbort.abort() // 驱动首行 while 条件即假——直接走 finally 中止路径
  await suspensionSession(r2.ctx)
  assert.deepEqual(r2.state.queue, [{ text: "keep-me" }], "中止残余单消息转正队列（下个普通回合续发——零丢失）")
  assert.equal(r2.lines.length, 1, "提示行明示去向")
  assert.match(r2.lines[0], /will run as a normal turn/, "abort 提示文案（不静默丢）")
})

// ─── busy 提示文案：状态栏（F-3——取代 (queue) 提示）──────────────

test("busy 状态栏文案：processing → 主会话处理中（Enter 提交禁用——无 (queue) 提示——F-7）；空闲 → Enter: send", () => {
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  const st = () => ({
    processing: true, status: "Processing...", processingStarted: Date.now(), currentTool: null,
    input: [], scroll: 0, tasks: [], queue: [],
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 },
  })
  const busy = renderStatus(st(), agent, 120, [])
  assert.match(busy, /主会话处理中/, "busy 文案（主会话处理中）")
  assert.ok(!busy.includes("(queue)"), "排队提示零残留")
  assert.ok(!busy.includes("queue:"), "排队计数提示零残留")
  const idle = renderStatus({ ...st(), processing: false, status: "Ready" }, agent, 120, [])
  assert.match(idle, /Enter: send/, "空闲 Enter: send")
})
