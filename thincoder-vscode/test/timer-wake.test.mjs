/**
 * timer-wake.test.mjs — timer 到期自唤醒 · VSC 侧用例族（批 timer-wake 阶段 2 · 台账 #446 / #445）。
 *
 * 设计权威 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.10–§6.30.15（机制单源；VSC 块 = §6.30.11）；
 * 用例表 = §6.30.12，宿主落点 = 同节末「用例宿主」行。
 * 本档覆盖：T-TW23（空闲自唤醒）· T-TW24（窗内兑现）· T-TW25（可见面载荷半——`usage.timers`）·
 * T-TW26（域文本 + 旗标三跳）· T-TW27（开关关）。T-TW22（端差消解）宿主 = 原址改例
 * `test/agent-lifecycle-singleton.test.mjs`（§6.30.12 宿主行——本档不重复）。
 * 本轮随补三例（VSC 宿主面修正轮——号码位归设计侧）：开关真链（`config.json` 关 ⇒ 零注册；
 * 评审 🟡1）· 窗内 timer 轮中止容纳（`AbortError` ∧ 会话未停 ⇒ 容纳并重入——§6.30.10 对称句
 * 推广至端面自驱窗；评审 🟡2）· 触发落流 `timer { status:"fired", text }`（协议 §3.2 行 19）。
 * 形态：假 timer / 假 `runChat` / 面板桩 + `suspensionSession` 直驱——**零真实到期等待**（假钟 / 注入缝
 * 直驱；`waitUntil` 条件轮询 = 推进面，非挂钟判据）（先例 = CLI `test/timer-wake.test.mjs` / 本仓 `digest-visibility.test.mjs`）；真链例 = 沙箱
 * `config.json` + `hydrateRun`（config 缝 `_setConfigPathForTest`——装配夹具先例 = `ledger.test.mjs`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createTimerWatch, deliverExpiredTimers, fireTimerWake } from "../src/extension/timer-watch.mjs"
import { suspensionSession } from "../src/extension/suspension.mjs"
import { buildPanelCallbacks } from "../src/extension/panel-callbacks.mjs"
import { composeTurnDomain, VSC_TURN_OVERLAY } from "../src/agent/turn-domains.mjs"
import {
  TIMER_TURN_DOMAIN, UPSTREAM_TURN_DOMAIN,
  _gitFailureCooldownForTests, _clearGitFailureCooldownForTests,
} from "../src/agent/setup-reminders.mjs"
// 开关真链例（评审 🟡1）：装配入口 + 沙箱缝——生产同函数（先例 = `test/ledger.test.mjs` 装配夹具）
import { buildTopLevelAgent, hydrateRun } from "../src/agent/setup.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
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

/** 面板桩（空闲面）：闩 + 火面所需字段最小集（机读线 / 落盘面 / 忙态谓词）。 */
function panelStub({ timers = [], wake = true, busy = false } = {}) {
  const posted = []
  const saved = []
  const agent = { history: [], config: { agent: { timerWake: wake } }, _pendingTimers: timers }
  const lines = { fullHistory: [{ role: "user", content: "u1" }], contextHistory: [{ role: "user", content: "u1" }] }
  const panel = {
    _agent: agent,
    _slot: 1,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    turnBusy: () => busy,
    _activeLines: () => lines,
    _saveLines: (fh, ch) => saved.push({ fh, ch }),
    _publishTurnState() {},
    _refreshStatus() {},
  }
  return { panel, agent, posted, saved, lines }
}

/** 空闲闩 rig（onFire = 真 `fireTimerWake`；`runChat` 桩记录 opts；`clock` = 闩侧假钟——延迟断言确定性）。 */
function idleRig({ timers = [], wake = true, busy = false, clock = Date.now } = {}) {
  const rig = panelStub({ timers, wake, busy })
  const opened = []
  const timer = spyTimer()
  const cleared = []
  const watch = createTimerWatch({
    getAgent: () => rig.panel._agent,
    timer,
    clear: (h) => cleared.push(h),
    now: clock,
    onFire: () => fireTimerWake(rig.panel, { runChat: async (p, opts) => { opened.push(opts) } }),
  })
  return { ...rig, opened, timer, cleared, watch }
}

/** 目录清理（Windows 句柄释放滞后——rmSync 偶发 EPERM，短重试兜底；先例 = 本仓 expand-home 用例）。 */
async function rmDir(dir) {
  for (let i = 0; i < 6; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return } catch { await sleep(150) }
  }
}

/** 开关真链夹具（沙箱 config + 隔离 cwd——装配面直驱；git 失败冷却 ⇒ 零 spawn，形 = ledger 装配夹具）。 */
function chainFixture() {
  const dir = mkdtempSync(join(tmpdir(), "timer-wake-chain-"))
  _setConfigPathForTest(join(dir, "config.json"))
  _setSessionsDirForTest(join(dir, "sessions"))
  _gitFailureCooldownForTests(dir, Date.now())
  return dir
}
function chainTeardown(dir) {
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  _clearGitFailureCooldownForTests(dir)
  return rmDir(dir)
}

/** 窗内中止容纳 rig（池 live + 在途一项 + 假 timer；`entry.runTurn` 注入——各臂按需抛错）。 */
function windowRig({ timers, runTurn, controller = null } = {}) {
  const posted = []
  const calls = []
  const history = []
  history._suspended = false
  history._pendingAsyncResults = []
  history._asyncAdvisors = new Map()
  history._consultSessions = new Map()
  history._asyncSubagents = new Map([["1", { id: 1, role: "explore", status: "running" }]])
  const agent = { history: [], config: { agent: { timerWake: true } }, _pendingTimers: timers }
  const timer = spyTimer()
  const panel = {
    _agent: agent, _slot: 1,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _publishTurnState() {}, _refreshStatus() {}, _suspWake: null, _saveLines() {},
  }
  if (controller) panel._abortController = controller
  const session = suspensionSession(panel, {
    turnSlot: {}, distillSlot: {}, lines: { history, fullHistory: [], contextHistory: history },
    runTurn: async (opts) => { calls.push(opts); return runTurn(opts) },
    timer, clear: () => {}, // 注入缝（§6.30.11 窗内——同 CLI `ctx.timer` / `ctx.clear`）
  })
  return { panel, agent, history, timer, posted, calls, session }
}

// ─── T-TW23 · 正常：空闲自唤醒（交付 + 开 timer 轮）────────────────────────────

test("T-TW23 空闲自唤醒：交付恰一条（落盘面）+ `runChat` 桩收 {autoTurn,timerTurn} 恰一次；无到期 ⇒ 零开轮", async () => {
  const T0 = Date.now() // 闩侧假钟（确定性）——交付面用真钟（见下方即期推进）
  const entry = { id: 1, expiresAt: T0 + 30_000, message: "pull the data" }
  const rig = idleRig({ timers: [entry], clock: () => T0 })
  const delay = rig.watch.sync()
  assert.equal(rig.timer.calls.length, 1, "在途 ⇒ 注册恰一次")
  assert.equal(delay, 30_000, "延迟 = 最早到期差（假钟——零容差）")
  assert.equal(rig.timer.calls[0].unrefCalled, true, "unref() 被调（不阻断退出）")
  rig.agent._pendingTimers[0].expiresAt = Date.now() - 1 // 假钟推进（零真实等待）
  await rig.timer.calls[0].cb() // 到点兑现（火面全程 await）
  assert.equal(rig.agent._pendingTimers.length, 0, "到期出列（幂等——`takeExpiredTimers`）")
  assert.equal(rig.saved.length, 1, "空闲路送达落盘恰一次（下一次 run 自盘重建机读线）")
  const injected = rig.saved[0].ch.filter((m) => String(m.content ?? "").includes("⏰ timer"))
  assert.equal(injected.length, 1, "交付行恰一条（核注入单源逐字形态）")
  assert.equal(injected[0].content, "[System reminder: ⏰ timer — pull the data]", "逐字 = 系统提醒形态")
  assert.deepEqual(rig.saved[0].fh, rig.lines.fullHistory, "人读线零触碰（机器线独有——D-TW2）")
  assert.deepEqual(rig.opened, [{ text: "", autoTurn: true, timerTurn: true }], "开轮恰一次（顶层链 opts）")
  // 无到期（在途未到期 / 已清空）⇒ 零交付零开轮
  rig.agent._pendingTimers = [{ id: 2, expiresAt: Date.now() + 60_000, message: "later" }]
  assert.equal(await fireTimerWake(rig.panel, { runChat: async (p, o) => { rig.opened.push(o) } }), false, "未到期 ⇒ 不开轮")
  assert.equal(rig.opened.length, 1, "零新开轮")
})

test("T-TW23b 非空闲零动作：busy（回合在飞 / 挂起窗）⇒ 零交付 / 零开轮 / 在途不动", async () => {
  const rig = idleRig({ timers: [{ id: 1, expiresAt: Date.now() - 1, message: "m" }], busy: true })
  rig.watch.sync()
  await rig.timer.calls[0].cb()
  assert.equal(rig.agent._pendingTimers.length, 1, "在途不动（交在飞路径：回合边界 post-turn / 窗内第三兑现态）")
  assert.equal(rig.saved.length, 0, "零交付")
  assert.equal(rig.opened.length, 0, "零开轮")
})

// ─── T-TW24 · 正常：挂起窗第三兑现态 ─────────────────────────────────────────

test("T-TW24 窗内兑现：等待含 deadline；兑现 ⇒ timer 轮开（{autoTurn,timerTurn}）+ 注入在场；窗退零重复投递", async () => {
  const posted = []
  const calls = []
  const controller = new AbortController()
  // 会话活线 = 数组 + 池载体附加属性（与生产同形——JSON 序列化只走下标）
  const history = []
  history._suspended = false
  history._pendingAsyncResults = []
  history._asyncAdvisors = new Map()
  history._consultSessions = new Map()
  history._asyncSubagents = new Map([["1", { id: 1, role: "explore", status: "running" }]])
  const entry = { id: 1, expiresAt: Date.now() + 30_000, message: "check the deploy" }
  const agent = { history: [], config: { agent: { timerWake: true } }, _pendingTimers: [entry] }
  const timer = spyTimer()
  const panel = {
    _agent: agent,
    _slot: 1,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _publishTurnState() {}, _refreshStatus() {}, _suspWake: null, _saveLines() {},
  }
  const session = suspensionSession(panel, {
    turnSlot: {}, distillSlot: {}, lines: { history, fullHistory: [], contextHistory: history },
    runTurn: async (opts) => { calls.push(opts) },
    timer, clear: () => {}, // 注入缝（§6.30.11 窗内——同 CLI `ctx.timer` / `ctx.clear`）
  })
  try {
    await waitUntil(() => timer.calls.length === 1, { label: "窗内 deadline 武装" })
    assert.ok(timer.calls[0].ms > 0 && timer.calls[0].ms <= 30_000, `等待含 deadline（≤ 最近到期差，实测 ${timer.calls[0].ms}ms——无 deadline 则零注册）`)
    assert.equal(timer.calls[0].unrefCalled, true, "窗内闩同 unref")
    entry.expiresAt = Date.now() - 1 // 假钟推进——到点兑现
    await timer.calls[0].cb()
    await waitUntil(() => calls.length === 1, { label: "timer 轮开启" })
    assert.equal(calls[0].autoTurn, true, "窗内轮 = auto 轮")
    assert.equal(calls[0].timerTurn, true, "timer 旗标贯通（域文本选择面）")
    assert.equal(calls[0].text, "", "timer 轮无用户消息")
    assert.deepEqual(history.filter((m) => String(m.content ?? "").includes("⏰ timer")).map((m) => m.content),
      ["[System reminder: ⏰ timer — check the deploy]"], "注入在场（会话活线）")
    assert.equal(agent._pendingTimers.length, 0, "窗内出列")
    // 池空窗退：清池 + 唤醒一次 ⇒ 窗口自然退出；到期件已出列 ⇒ 零重复投递
    history._asyncSubagents.clear()
    panel._suspWake?.()
    await session
  } finally {
    controller.abort() // 兜底：任何断言失败也不留下活着的窗
    await Promise.race([session, sleep(50)])
  }
  assert.equal(calls.length, 1, "零重复投递（不再开第二轮）")
  assert.equal(history.filter((m) => String(m.content ?? "").includes("⏰ timer")).length, 1, "零重复注入")
})

// ─── 窗内 timer 轮中止容纳（§6.30.10 对称句推广至端面自驱窗 · 评审 🟡2）────────

test("窗内中止容纳：`AbortError` ∧ 会话未停 ⇒ 容纳并重入（零 digest 边界）；负臂 = 非 AbortError ∕ 会话停照旧上抛", async () => {
  // 正臂：timer 轮抛 AbortError（会话未停）⇒ 容纳（会话不 reject · 循环重入等待）
  const r1 = windowRig({
    timers: [{ id: 1, expiresAt: Date.now() + 30_000, message: "check the deploy" }],
    runTurn: async () => { throw Object.assign(new Error("Aborted"), { name: "AbortError" }) },
  })
  let settled = null
  r1.session.then(() => { settled = "resolved" }, (e) => { settled = `rejected:${e?.name}` })
  try {
    await waitUntil(() => r1.timer.calls.length === 1, { label: "窗内 deadline 武装" })
    r1.agent._pendingTimers[0].expiresAt = Date.now() - 1 // 到点兑现（零真实等待）
    await r1.timer.calls[0].cb()
    await waitUntil(() => r1.calls.length === 1, { label: "timer 轮开启（首击抛 AbortError）" })
    // 容纳后循环重入落定（条件轮询——零挂钟门；栓在世 = 重入停在等待）
    await waitUntil(() => r1.agent._asyncWaiters?.length === 1, { label: "容纳后重入等待" })
    assert.equal(settled, null, "容纳——会话未停（零 reject；上抛即 rejected:AbortError）")
    assert.equal(r1.timer.calls.length, 1, "重入零补注册（到期件已出列——不空转）")
    assert.equal(r1.agent._asyncWaiters?.length, 1, "重入后停在等待（栓在世）")
    assert.equal(r1.posted.filter((m) => m.type === "digest").length, 0, "零 digest 边界（timer 轮不发；中止路径同理）")
    assert.equal(r1.history.filter((m) => String(m.content ?? "").includes("⏰ timer")).length, 1, "交付仍到位（容纳不涉交付面）")
    r1.history._asyncSubagents.clear() // 池空 ⇒ 重入后自然退出
    r1.panel._suspWake?.()
    await waitUntil(() => settled !== null, { label: "会话退出" })
    assert.equal(settled, "resolved", "重入后池空自然退出（零上抛）")
    assert.equal(r1.calls.length, 1, "零第二轮（中止轮不重开）")
  } finally {
    r1.panel._suspWake?.() // 兜底：任何断言失败也不留下活着的窗
    await Promise.race([r1.session.catch(() => {}), sleep(50)])
  }
  // 负臂①：非 AbortError ⇒ 照旧上抛（§6.30.10「其余照旧上抛」——同一 throw 行）
  const r2 = windowRig({
    timers: [{ id: 1, expiresAt: Date.now() + 30_000, message: "m" }],
    runTurn: async () => { throw new Error("boom") },
  })
  await waitUntil(() => r2.timer.calls.length === 1, { label: "负臂① deadline 武装" })
  r2.agent._pendingTimers[0].expiresAt = Date.now() - 1
  await r2.timer.calls[0].cb()
  await assert.rejects(r2.session, /boom/, "非 AbortError 不纳入（照旧上抛）")
  // 负臂②：AbortError ∧ 会话停 ⇒ 照旧上抛（不纳入）
  const ctrl = new AbortController()
  const r3 = windowRig({
    timers: [{ id: 1, expiresAt: Date.now() + 30_000, message: "m" }], controller: ctrl,
    runTurn: async () => { ctrl.abort(); throw Object.assign(new Error("Aborted"), { name: "AbortError" }) },
  })
  await waitUntil(() => r3.timer.calls.length === 1, { label: "负臂② deadline 武装" })
  r3.agent._pendingTimers[0].expiresAt = Date.now() - 1
  await r3.timer.calls[0].cb()
  await assert.rejects(r3.session, (e) => e.name === "AbortError", "会话停不纳入（照旧上抛）")
})

// ─── T-TW25 · 正常：可见面载荷半（`usage.timers`——webview 段面 = 可见面舱）────────

test("T-TW25 可见面载荷：`usage.timers` = `{count, expired}` 活读投影；零在途 ⇒ 0/0", () => {
  const usageOf = (pending) => {
    const posted = []
    const panel = {
      _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
      _agent: { _pendingTimers: pending },
    }
    const cbs = buildPanelCallbacks(panel, { history: [{ role: "user", content: "hi" }], p: { model: "glm-5.2" } })
    cbs.onUsage({ prompt_tokens: 5, completion_tokens: 6 })
    const usage = posted.find((m) => m.type === "usage")
    assert.ok(usage != null, "usage 载荷已发（前置——既有消息增字段，零新消息类型）")
    return usage.timers
  }
  assert.deepEqual(usageOf([
    { id: 1, expiresAt: Date.now() + 60_000, message: "m" },
    { id: 2, expiresAt: Date.now() - 1, message: "m" },
  ]), { count: 2, expired: 1 }, "在途 2 / 含过期 1（核 `_pendingTimers` 活读投影）")
  assert.deepEqual(usageOf([]), { count: 0, expired: 0 }, "零在途 ⇒ 0/0（`⏰N` 段零节点由可见面舱落）")
  assert.deepEqual(usageOf(undefined), { count: 0, expired: 0 }, "无载体内（headless 面）零崩")
})

// ─── 触发落流（协议 §3.2 行 19）：`timer { status:"fired", text }` ─────────────

test("触发落流：交付点逐条发 `timer`（恰一条/项 · `text` = 交付原文逐字）；零到期 ⇒ 零条", async () => {
  // ① 空闲路（火面——真交付点）：到期一项 ⇒ 恰一条
  const one = idleRig({ timers: [{ id: 1, expiresAt: Date.now() - 1, message: "pull the data" }] })
  assert.equal(await fireTimerWake(one.panel, { runChat: async () => {} }), true, "到期 ⇒ 开轮（前置）")
  assert.deepEqual(one.posted.filter((m) => m.type === "timer"),
    [{ type: "timer", status: "fired", text: "[System reminder: ⏰ timer — pull the data]" }],
    "恰一条 · 载荷形态 / 原文逐字（协议 §3.2 行 19）")
  // ② 窗内形（`lines` 给定——窗内路与空闲路共用同一交付点）：两条到期 ⇒ 逐条两条（各原文）
  const two = panelStub({ timers: [
    { id: 1, expiresAt: Date.now() - 2, message: "first" },
    { id: 2, expiresAt: Date.now() - 1, message: "second" },
  ] })
  const injected = deliverExpiredTimers(two.panel, { lines: two.lines })
  assert.equal(injected.length, 2, "两条到期 ⇒ 合并一轮交付两条（成本闸）")
  assert.deepEqual(two.posted.filter((m) => m.type === "timer").map((m) => m.text), injected,
    "逐条：消息 `text` = 交付原文逐字（零裁切——显示裁在 webview 侧）")
  assert.equal(two.posted.every((m) => m.type !== "timer" || (m.status === "fired" && m.text.length > 0)), true,
    "`status` 恒 `fired` · `text` 恒非空")
  // ③ 零到期 ⇒ 零条（零交付零消息）
  const none = idleRig({ timers: [{ id: 9, expiresAt: Date.now() + 60_000, message: "later" }] })
  assert.equal(await fireTimerWake(none.panel, { runChat: async () => {} }), false, "未到期 ⇒ 不开轮")
  assert.equal(none.posted.filter((m) => m.type === "timer").length, 0, "零条")
})

// ─── T-TW26 · 正常：域文本（timer 轮基座 + 旗标三跳）──────────────────────────

test("T-TW26 域文本：timer 轮选核 `TIMER_TURN_DOMAIN`；`upstreamTurn` 优先不回归；端 overlay 恒在场", () => {
  assert.ok(TIMER_TURN_DOMAIN.startsWith("[System reminder:"), "核基座形态 = `[System reminder:` 起（合同）")
  assert.ok(!TIMER_TURN_DOMAIN.includes("\n"), "单行（合同）")
  const timer = composeTurnDomain(false, false, true)
  assert.ok(timer.startsWith(TIMER_TURN_DOMAIN.slice(0, -1)), "起头 = 核 TIMER_TURN_DOMAIN 逐字（端侧零自持字面）")
  assert.ok(timer.endsWith(VSC_TURN_OVERLAY + "]"), "收尾 = 端 overlay + `]`（括号形态不破）")
  assert.ok(composeTurnDomain(true, false, true).startsWith(UPSTREAM_TURN_DOMAIN.slice(0, -1)), "`upstreamTurn` 优先不回归（ask 轮更紧）")
  assert.equal(composeTurnDomain(false), composeTurnDomain(false, false, false), "既有两参调用逐字零回归")
  assert.notEqual(timer, composeTurnDomain(false), "timer 轮 ≠ digest 轮（换基座真发生）")
  // 旗标三跳（§6.30.11 域文本行）：解构 → opts 字面量 → 核读点 + 窗内闭包转发
  assert.ok(read("src/extension/panel-chat.mjs").includes("timerTurn = false"), "跳 1：opts 解构（panel-chat）")
  assert.ok(/^\s*timerTurn,$/m.test(read("src/extension/panel-turn-loop.mjs")), "跳 2：ro 字面量（panel-turn-loop → 核 runAgent）")
  assert.ok(read("src/agent.mjs").includes("opts.timerTurn === true"), "跳 3：核读点（agent.mjs 域文本选择）")
  assert.ok(read("src/extension/panel-turn-stages.mjs").includes("timerTurn: tTimer === true"), "窗内 `runTurn` 闭包转发")
})

// ─── T-TW27 · 边界：开关关（零注册 / 已注册者撤闩）────────────────────────────
// （桩字段直写 = 闩面判据臂；生产者真链 = 下方「开关真链」例——评审 🟡1 两面齐）

test("T-TW27 开关关：零注册（闩怠惰）；到期件保持；已在位 ⇒ 撤闩；显式开 ⇒ 恢复武装", () => {
  const T0 = Date.now() // 闩侧假钟（确定性——同 T-TW23）
  const rig = idleRig({ timers: [{ id: 1, expiresAt: T0 + 30_000, message: "m" }], wake: false, clock: () => T0 })
  assert.equal(rig.watch.sync(), null, "关 ⇒ sync 返回 null")
  assert.equal(rig.timer.calls.length, 0, "零注册")
  assert.equal(rig.agent._pendingTimers.length, 1, "到期件保持（回合边界投递路径不受影响——零静默丢）")
  rig.agent.config.agent.timerWake = true
  assert.equal(rig.watch.sync(), 30_000, "开 ⇒ 按在途（重）武装（假钟——零容差）")
  assert.equal(rig.timer.calls.length, 1, "恢复武装")
  rig.agent.config.agent.timerWake = false
  assert.equal(rig.watch.sync(), null, "关（已在位）⇒ 零新注册")
  assert.equal(rig.cleared.length, 1, "已注册者撤闩（撤旧）")
})

// ─── 开关真链（评审 🟡1）：`config.json` → 白名单生产者（setup.mjs）→ `agent.config.agent` ──

test("开关真链：`config.json` 的 `agent.timerWake` 经 hydrateRun 生产者落 `agent.config.agent`；关 ⇒ 零注册 / 缺省 ⇒ 开", async () => {
  const dir = chainFixture()
  const runOnce = () => hydrateRun(buildTopLevelAgent(), {
    provider: { model: "deepseek-v4-pro" }, cwd: dir, input: "hi",
    opts: {}, depth: 0, role: null, getAuto: () => false, restore: true,
  })
  const watchOf = (agent) => {
    agent._pendingTimers = [{ id: 1, expiresAt: Date.now() + 30_000, message: "m" }]
    const timer = spyTimer()
    return { timer, watch: createTimerWatch({ getAgent: () => agent, timer, clear: () => {}, onFire: () => {} }) }
  }
  try {
    // ① 显式关：config.json 原文 → 生产者（白名单整建曾漏该键 = 评审 🟡1）
    writeFileSync(join(dir, "config.json"), JSON.stringify({ agent: { timerWake: false } }))
    const off = await runOnce()
    assert.equal(off.agent.config.agent.timerWake, false, "生产者：显式 false 落 `agent.config.agent`（读面 = `timer-watch.mjs` 判据）")
    const a = watchOf(off.agent)
    assert.equal(a.watch.sync(), null, "关（真链）⇒ 零注册（闩怠惰）")
    assert.equal(a.timer.calls.length, 0, "零注册——非直写桩字段（桩掩已消解）")
    // ② 缺省：键缺席 ⇒ 核 DEFAULTS（true）——默认开不回归
    writeFileSync(join(dir, "config.json"), JSON.stringify({}))
    const on = await runOnce()
    assert.equal(on.agent.config.agent.timerWake, true, "缺省 = 核 DEFAULTS（true——默认开）")
    const b = watchOf(on.agent)
    assert.ok(b.watch.sync() !== null, "开（真链）⇒ 按在途武装")
    assert.equal(b.timer.calls.length, 1, "注册恰一次")
  } finally {
    await chainTeardown(dir)
  }
})
