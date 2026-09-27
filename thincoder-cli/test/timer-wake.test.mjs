/**
 * timer-wake.test.mjs — timer 到期自唤醒 · CLI 侧用例族（批 timer-wake 2026-09-27 · 台账 #443 / #444）。
 *
 * 设计权威 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30（机制）· `docs/cli/design/TUI.md` §7.6
 * （显示形态）；用例表 = §6.30.7，宿主落点 = §6.30.7 末「用例宿主」行。
 * 本档覆盖：T-TW3（空闲闩武装）· T-TW4（空闲自唤醒）· T-TW5（busy 期零动作）· T-TW6（开关关）·
 * T-TW8（挂起窗第三兑现态）· T-TW10（状态行标记 + 负向锁）· T-TW12（子代理隔离）· T-TW13（attention 除外）。
 * 形态：假 timer / 假注入缝 + `ctx.runAgent` 桩 + 纯函数直驱——**全部零真实等待**
 * （先例 `heap-watch.test.mjs` / `busy-injection-consume.test.mjs`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createTimerWatch, fireTimerWake, timerWakeArmed } from "../src/tui/timer-watch.mjs"
import { suspensionSession } from "../src/tui/suspension-drive.mjs"
import { renderStatus } from "../src/tui/render-frame.mjs"
import { userNeededAtTurnEnd } from "../src/tui/agent-turn.mjs"
import { C } from "../src/tui/ansi.mjs"

const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")
const WARN_SEQ = C.warn // 到期态警示色（`C.warn`——同 ledgerHint 警示段口径）
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitUntil(fn, { ms = 3000, label = "condition" } = {}) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (fn()) return true
    await sleep(2)
  }
  throw new Error(`timed out waiting for ${label}`)
}

/** 假定时器（spy——记录注册 / unref；`cb()` 直驱触发——零真实等待）。 */
function spyTimer() {
  const calls = []
  const fn = (cb, ms) => {
    const h = { cb, ms, unrefCalled: false, unref() { this.unrefCalled = true } }
    calls.push(h)
    return h
  }
  fn.calls = calls
  return fn
}

/** 最小 TUI 状态（状态行渲染所需字段——同 `attention-state.test.mjs` 口径）。 */
function baseState(over = {}) {
  return {
    input: [], cursor: 0, scroll: 0, tasks: [], queue: [], history: [], historyIndex: -1, _draft: null,
    processing: false, processingStarted: Date.now(), status: "Ready", currentTool: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 },
    permission: null, question: null, picker: null, wizard: null, search: null, interruptPrompt: null,
    suspended: false, _suspPending: false, attentionAwaiting: false, pendingInput: [], lines: [],
    ...over,
  }
}
const agentStub = (over = {}) => ({
  provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0,
  _pendingTimers: [], ...over,
})

/** 空闲态闩 rig（onFire = 真 `fireTimerWake`；runTurn 桩记录 opts）。 */
function idleRig({ timers = [], state = baseState(), wake = true } = {}) {
  const lines = []
  const opened = []
  const agent = { history: [], config: { agent: { timerWake: wake } }, _pendingTimers: timers }
  const ctx = { agent, state, pushLine: (text, color) => lines.push({ text: String(text), color }) }
  const timer = spyTimer()
  const cleared = []
  const watch = createTimerWatch({
    agent,
    timer,
    clear: (h) => cleared.push(h),
    onFire: () => fireTimerWake(ctx, { runTurn: async (text, opts) => { opened.push({ text, opts }) } }),
  })
  return { agent, state, ctx, lines, opened, timer, cleared, watch }
}

// ─── T-TW3 · 正常：空闲闩武装 ───────────────────────────────────────────────

test("T-TW3 闩武装：注册恰一次 · 延迟 = 最早到期差 · unref 被调；无在途 ⇒ 零注册（并撤旧）", () => {
  const rig = idleRig({ timers: [{ id: 1, expiresAt: Date.now() + 30_000, message: "m" }] })
  const delay = rig.watch.sync()
  assert.equal(rig.timer.calls.length, 1, "注册恰一次")
  assert.ok(Math.abs(delay - 30_000) < 1_000, `延迟 = 最早到期差（实测 ${delay}ms）`)
  assert.equal(rig.timer.calls[0].unrefCalled, true, "unref() 被调（不阻断退出）")
  // 重复武装 = 撤旧立新（单槽）
  rig.watch.sync()
  assert.equal(rig.timer.calls.length, 2, "重复武装 = 立新")
  assert.equal(rig.cleared.length, 1, "撤旧（clear 恰一次）")
  // 无在途 ⇒ 零注册 + 撤旧
  rig.agent._pendingTimers = []
  assert.equal(rig.watch.sync(), null, "无在途 ⇒ 返回 null")
  assert.equal(rig.timer.calls.length, 2, "零新注册")
  assert.equal(rig.cleared.length, 2, "撤旧生效")
})

// ─── T-TW4 · 正常：空闲自唤醒（可复现）─────────────────────────────────────

test("T-TW4 空闲自唤醒：到期出列 + 注入恰一条 + 触发落流恰一行 + 开轮恰一次（{autoTurn,timerTurn}）", async () => {
  const rig = idleRig({ timers: [{ id: 1, expiresAt: Date.now() - 1, message: "pull the data" }] })
  rig.watch.sync()
  assert.equal(rig.timer.calls.length, 1, "到期项 ⇒ gap 0 立即武装")
  await rig.timer.calls[0].cb() // 假 timer 触发（零真实等待）
  assert.equal(rig.agent._pendingTimers.length, 0, "到期出列")
  assert.deepEqual(rig.agent.history.map((h) => h.content), ["[System reminder: ⏰ timer — pull the data]"], "注入恰一条")
  assert.equal(rig.lines.length, 1, "触发落流恰一行")
  assert.equal(rig.lines[0].text, "[System reminder: ⏰ timer — pull the data]", "逐字 = 系统提醒形态")
  assert.equal(rig.lines[0].color, C.warn, "C.warn")
  assert.deepEqual(rig.opened, [{ text: "", opts: { autoTurn: true, timerTurn: true } }], "开轮恰一次（顶层链 opts）")
})

test("T-TW4b 合并一轮：同批到期两条 ⇒ 注入两条 / 行两条 / 开轮仍一次（成本闸②）", async () => {
  const rig = idleRig({
    timers: [{ id: 1, expiresAt: Date.now() - 2, message: "first" }, { id: 2, expiresAt: Date.now() - 1, message: "second" }],
  })
  rig.watch.sync()
  await rig.timer.calls[0].cb()
  assert.deepEqual(rig.agent.history.map((h) => h.content), [
    "[System reminder: ⏰ timer — first]",
    "[System reminder: ⏰ timer — second]",
  ], "到期批逐条注入（原序）")
  assert.equal(rig.lines.length, 2, "逐条落流")
  assert.equal(rig.opened.length, 1, "合并一轮（不逐条开轮）")
})

test("T-TW4c 落流 cap + 异常兜底：多行 message ⇒ 三行 + 省略号（注入面仍全串）；开轮抛错不逃逸", async () => {
  const rig = idleRig({ timers: [{ id: 1, expiresAt: Date.now() - 1, message: "l1\nl2\nl3\nl4\nl5" }] })
  rig.watch.sync()
  await rig.timer.calls[0].cb()
  assert.equal(rig.lines[0].text, "[System reminder: ⏰ timer — l1\nl2\nl3\n…", "显示 = 前 3 行 + 省略号（同既有提醒镜像口径）")
  assert.equal(rig.agent.history[0].content, "[System reminder: ⏰ timer — l1\nl2\nl3\nl4\nl5]", "注入面仍是全串（显示 cap 不动 history）")
  // 异常兜底（index.mjs 装配形态）：开轮抛错 ⇒ onFire 的 Promise 已 catch（不逃逸为 unhandledRejection）+ 重同步
  const lines = []
  const agent = { history: [], config: { agent: { timerWake: true } }, _pendingTimers: [{ id: 9, expiresAt: Date.now() - 1, message: "retry me" }, { id: 10, expiresAt: Date.now() + 60_000, message: "later" }] }
  const ctx = { agent, state: baseState(), pushLine: (t, c) => lines.push({ text: String(t), color: c }) }
  const timer = spyTimer()
  const watch = createTimerWatch({
    agent, timer, clear: () => {},
    onFire: () => fireTimerWake(ctx, { runTurn: async () => { throw new Error("turn boom") } })
      .catch((e) => { ctx.pushLine(`[error] ${e?.message ?? e}`, C.error); watch.sync() }),
  })
  watch.sync()
  await timer.calls[0].cb()
  // 开轮抛错 ⇒ 兜底 catch 在后续微任务落流（async 链——等一拍）
  await waitUntil(() => lines.at(-1)?.text === "[error] turn boom", { label: "错误行落流" })
  assert.equal(timer.calls.length, 2, "重同步（尚有未到期项 ⇒ 再武装）")
})

// ─── T-TW5 · 边界：busy / 挂起两态触发零动作 ────────────────────────────────

test("T-TW5 非空闲零动作：processing / suspended / _suspPending 各态 ⇒ 零注入 / 零开轮 / 在途不动", async () => {
  for (const gov of [{ processing: true }, { suspended: true }, { _suspPending: true }]) {
    const rig = idleRig({ timers: [{ id: 1, expiresAt: Date.now() - 1, message: "m" }], state: baseState(gov) })
    rig.watch.sync()
    await rig.timer.calls[0].cb()
    assert.equal(rig.agent._pendingTimers.length, 1, `${Object.keys(gov)[0]}：在途不动（交在飞路径）`)
    assert.equal(rig.agent.history.length, 0, `${Object.keys(gov)[0]}：零注入`)
    assert.equal(rig.lines.length, 0, `${Object.keys(gov)[0]}：零落流`)
    assert.equal(rig.opened.length, 0, `${Object.keys(gov)[0]}：零开轮`)
  }
})

// ─── T-TW6 · 边界：开关关 ──────────────────────────────────────────────────

test("T-TW6 开关关：零注册（闩惰性）；到期件保持；显式开 ⇒ 恢复武装", () => {
  const rig = idleRig({ timers: [{ id: 1, expiresAt: Date.now() - 1, message: "m" }], wake: false })
  assert.equal(rig.watch.sync(), null, "关 ⇒ sync 返回 null")
  assert.equal(rig.timer.calls.length, 0, "零注册")
  assert.equal(rig.agent._pendingTimers.length, 1, "到期件保持（回合边界投递路径不受影响）")
  assert.equal(timerWakeArmed(rig.agent), false, "关 ⇒ 唤醒不会武装")
  rig.agent.config.agent.timerWake = true
  assert.equal(timerWakeArmed(rig.agent), true, "开 ⇒ 唤醒会武装")
  assert.equal(rig.watch.sync(), 0, "过期项 ⇒ 延迟 0（立即到期）")
  assert.equal(rig.timer.calls.length, 1, "恢复武装")
})

// ─── T-TW8 · 正常：挂起窗第三兑现态 ────────────────────────────────────────

/** 挂起窗 rig（`ctx.timer` / `ctx.clear` 注入缝 + `ctx.runAgent` 桩记录 opts）。 */
function windowRig({ timers = [] } = {}) {
  const lines = []
  const turnOpts = []
  const controller = new AbortController()
  const agent = {
    history: [], title: "locked", autoApprove: false, config: { agent: { timerWake: true } }, _pendingTimers: timers,
    provider: { name: "stub", baseURL: "http://stub.invalid/v1", model: "stub-model" }, // 防标题生成触网（`title` 已在位 ⇒ 捷径返回）
    _asyncSubagents: new Map([["1", { id: 1, role: "explore", status: "running" }]]),
    _asyncAdvisors: new Map(), _pendingAsyncResults: [], _consultSessions: new Map(),
    _sessionAbort: controller, _sessionAbortAll: [], _suspended: false,
  }
  const state = baseState({ pendingInput: [], status: "Ready" })
  const timer = spyTimer()
  const ctx = {
    agent, state,
    pushLine: (text, color) => lines.push({ text: String(text), color }), pushLabel: (t) => lines.push({ text: String(t) }),
    render() {}, scheduleRender() {}, ensureAssistantLabel() {},
    askPermission: null, askBatchPermission: null, askQuestion: null, handleSlash: async () => {},
    saveSession: async () => {}, timer, clear: () => {},
    runAgent: async (_a, _text, _cb, opts) => { turnOpts.push(opts) },
  }
  return { agent, state, ctx, lines, turnOpts, timer, controller }
}

test("T-TW8 挂起窗第三兑现态：等待含 deadline；兑现 ⇒ timer 轮开启 + 注入在场；池空窗退零重复投递", async () => {
  const entry = { id: 1, expiresAt: Date.now() + 30_000, message: "check the deploy" }
  const rig = windowRig({ timers: [entry] })
  const session = suspensionSession(rig.ctx)
  try {
    await waitUntil(() => rig.timer.calls.length === 1, { label: "窗内 deadline 武装" })
    assert.ok(Math.abs(rig.timer.calls[0].ms - 30_000) < 1_000, `等待含 deadline（实测 ${rig.timer.calls[0].ms}ms）`)
    assert.equal(rig.timer.calls[0].unrefCalled, true, "窗内闩同 unref")
    entry.expiresAt = Date.now() - 1 // 假钟推进（零真实等待）——到点兑现
    await rig.timer.calls[0].cb()
    await waitUntil(() => rig.turnOpts.length === 1, { label: "timer 轮开启" })
    assert.equal(rig.turnOpts[0].autoTurn, true, "窗内轮 = auto 轮")
    assert.equal(rig.turnOpts[0].timerTurn, true, "timer 旗标贯通到核（域文本选择面）")
    assert.ok(!rig.lines.some((l) => l.text.includes("❯ You:")), "auto 轮不画用户标签（既有形态）")
    assert.deepEqual(rig.agent.history.map((h) => h.content), ["[System reminder: ⏰ timer — check the deploy]"], "注入在场")
    assert.equal(rig.agent._pendingTimers.length, 0, "窗内出列")
    assert.equal(rig.lines.filter((l) => l.text.includes("⏰ timer")).length, 1, "触发落流一行")
    // 池空窗退：清池 + 唤醒一次 ⇒ 窗口自然退出；到期件已出列 ⇒ 零重复投递
    rig.agent._asyncSubagents.clear()
    rig.state._suspWake?.()
    await session
  } finally {
    rig.controller.abort() // 兜底：任何断言失败也不留下活着的窗（否则 1s suspTick 恒活）
    await Promise.race([session, sleep(50)])
  }
  assert.equal(rig.turnOpts.length, 1, "零重复投递（不再开第二轮）")
  assert.equal(rig.agent.history.length, 1, "零重复注入")
  assert.equal(rig.state.suspended, false, "窗退（idle）")
})

// ─── T-TW10 · 正常：状态行标记（+ 负向锁）───────────────────────────────────

test("T-TW10 状态行：在途 2 ⇒ 含 `⏰2`；含过期项 ⇒ 警示色序列；空 ⇒ 零 `⏰` + 逐字节等价", () => {
  const future = () => ({ id: 1, expiresAt: Date.now() + 60_000, message: "m" })
  const expired = () => ({ id: 2, expiresAt: Date.now() - 1, message: "m" })
  const row2 = renderStatus(baseState(), agentStub({ _pendingTimers: [future(), { ...future(), id: 3 }] }), 80, [])
  assert.ok(stripAnsi(row2).includes("⏰2"), "在途 2 ⇒ `⏰2`")
  assert.ok(!row2.includes(WARN_SEQ), "全未到期 ⇒ 常态 dim 段（零警示色）")
  const rowWarn = renderStatus(baseState(), agentStub({ _pendingTimers: [future(), expired()] }), 80, [])
  assert.ok(stripAnsi(rowWarn).includes("⏰2"), "在途数不变")
  assert.ok(rowWarn.includes(WARN_SEQ), "含过期项 ⇒ 警示色序列")
  // 负向锁：零在途 ⇒ 零 ⏰ + 逐字节等价（与「无该字段」的 agent 同帧同字节）+ 零新增警示色
  const empty = renderStatus(baseState(), agentStub({ _pendingTimers: [] }), 80, [])
  const absent = renderStatus(baseState(), agentStub({}), 80, [])
  assert.ok(!stripAnsi(empty).includes("⏰"), "零在途 ⇒ 零 `⏰`")
  assert.equal(empty, absent, "零在途 ⇒ 逐字节等价（零依赖）")
  assert.ok(!empty.includes(WARN_SEQ), "零新增色对")
  assert.ok(stripAnsi(empty).includes("Enter: send"), "常态字段在位（内容零省略）")
})

// ─── T-TW12 · 边界：子代理隔离（构造性零泄漏）──────────────────────────────

test("T-TW12 子代理隔离：depth-1 在途两条、主 agent 零条 ⇒ 主标记零 `⏰`", () => {
  const child = { _pendingTimers: [{ id: 1, expiresAt: Date.now() + 1000, message: "c1" }, { id: 2, expiresAt: Date.now() - 1, message: "c2" }] }
  const main = agentStub({ _pendingTimers: [], _asyncSubagents: new Map([["1", { id: 1, childAgent: child }]]) })
  const row = renderStatus(baseState(), main, 80, [])
  assert.ok(!stripAnsi(row).includes("⏰"), "读对象 = 主 agent 单对象 ⇒ 子代理 timer 不进本面")
  assert.ok(!row.includes(WARN_SEQ), "子代理过期项不染主状态行")
})

// ─── T-TW13 · 边界：attention 除外 ─────────────────────────────────────────

test("T-TW13 attention 除外：在途 timer ∧ 唤醒会武装 ⇒ 不计 awaiting；关 / 零在途 ⇒ 既有语义不回归", () => {
  const idle = () => baseState({ suspended: false, _suspPending: false, queue: [], processing: false })
  const withTimer = (wake) => agentStub({ _pendingTimers: [{ id: 1, expiresAt: Date.now() + 1000, message: "m" }], config: { agent: { timerWake: wake } } })
  assert.equal(userNeededAtTurnEnd(idle(), withTimer(true), false), false, "开 ⇒ 不计 awaiting（自动续跑在途）")
  assert.equal(userNeededAtTurnEnd(idle(), withTimer(false), false), true, "关 ⇒ 照常置位")
  assert.equal(userNeededAtTurnEnd(idle(), agentStub(), false), true, "零在途 ⇒ 既有语义不回归")
  assert.equal(userNeededAtTurnEnd(baseState({ processing: true }), withTimer(true), false), false, "既有排除项不回归（processing）")
  assert.equal(userNeededAtTurnEnd(idle(), withTimer(true), true), false, "既有排除项不回归（skipSession）")
})
