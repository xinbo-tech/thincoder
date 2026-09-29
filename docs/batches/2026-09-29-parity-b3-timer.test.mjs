/**
 * 2026-09-29-parity-b3-timer.test.mjs — 批次本地单测件（timer 收编批 · VSC ∕ CLI 两端——对拍 T-TW35 · 8 例）。
 * 名随批次档 · 不进仓套件；复跑（仓根）= `node --test docs/batches/2026-09-29-parity-b3-timer.test.mjs`
 * （本刻暂存 `.thincoder/tmp/` 同名件——父侧 copy 至终位；导入以 `process.cwd()` 为仓根解析，须以仓根为 cwd 运行）。
 * 用例面 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.16 表 T-TW28–T-TW35（对拍形 = T-TW35——用例名 T 引 = 对应行）。
 * 对拍法（先例 = `.thincoder/tmp/r4-diff-probe.mjs` 同法）：**OLD 逐字拷贝（代码行，JSDoc 未复刻）× NEW 端模块现值**，
 * 同假钟同序列 ⇒ 可观察日志逐项 `deepEqual`；**改前先跑绿 → 改后同文件零改直跑仍绿**。
 * OLD 拷贝口径注记（替换全表；代码行为逐字）：① 同模块内函数互指一律指向本拷贝体（`OLD?_` 前缀名——`timerWakeEnabled`
 * ∕ `modalOpen` ∕ `reminderDisplay` 为独立拷贝体）；② VSC 火序列动态导入面改写为仓根可达路径（生产面不触达——四径恒注入
 * `runChat`）；③ VSC 装配 onFire 兜底体未复刻（不触达——装配驱动不 tick 装配面）。
 * 保真核对 = 与 `git diff HEAD` 删除面逐行读比（改前档不再在盘）；旁证 = R4 期独立拷贝 `.thincoder/tmp/r4-diff-probe.mjs:51-69`（VSC 侧）。
 */
import assert from "node:assert/strict"
import test from "node:test"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const root = process.cwd() // 仓根（导入以 process.cwd() 解析）
const load = (rel) => import(pathToFileURL(join(root, rel)).href)
const { createTimerWatch: CORE_createTimerWatch, pendingTimerDeadline, takeExpiredTimers, injectTimerReminders } =
  await load("thincoder-core/agent/timers.mjs")
const NEWV = await load("thincoder-vscode/src/extension/timer-watch.mjs")
const NEWC = await load("thincoder-cli/src/tui/timer-watch.mjs")
const { C } = await load("thincoder-cli/src/tui/ansi.mjs")
const { REMINDER_CAP } = await load("thincoder-cli/src/tui/tool-display.mjs")

/* ── OLD 拷贝 · VSC（src/extension/timer-watch.mjs 代码行逐行——除 `timerWakeEnabled` 指向本拷贝体）── */
function OLDV_timerWakeEnabled(agent) {
  return agent?.config?.agent?.timerWake !== false
}
function OLDV_createTimerWatch({ getAgent, onFire, timer = setTimeout, clear = clearTimeout, now = Date.now } = {}) {
  let handle = null
  const disarm = () => {
    const h = handle
    handle = null
    if (h !== null) { try { clear(h) } catch { /* 已触发 / 不可清——尽力面（同 CLI） */ } }
  }
  const sync = () => {
    const agent = getAgent?.()
    const deadline = OLDV_timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null
    if (deadline == null) { disarm(); return null } // 无在途 / 开关关 / 无 agent——撤旧，零注册
    disarm() // 单槽：重复武装 = 撤旧立新（延迟按最近到期重算）
    const delay = Math.max(0, deadline - now())
    handle = timer(() => { handle = null; onFire?.() }, delay)
    try { handle?.unref?.() } catch { /* unref 失败不阻断（一次性闩自然退出） */ }
    return delay
  }
  return { sync, disarm }
}
function OLDV_deliverExpiredTimers(panel, { lines = null, now = Date.now } = {}) {
  const agent = panel?._agent
  if (!agent) return []
  const target = lines ?? (panel._slot != null ? panel._activeLines() : null)
  if (!target) return [] // 空闲路槽未绑定——零动作（在途保持：链尾重同步再试）
  const injected = injectTimerReminders({ history: target.contextHistory ?? target.history }, takeExpiredTimers(agent, now()))
  if (injected.length === 0) return []
  if (!lines) panel._saveLines(target.fullHistory, target.contextHistory)
  for (const text of injected) panel._panel?.webview.postMessage({ type: "timer", status: "fired", text })
  return injected
}
async function OLDV_fireTimerWake(panel, { runChat, now = Date.now } = {}) {
  if (!panel?._agent || panel.turnBusy?.()) return false
  if (OLDV_deliverExpiredTimers(panel, { now }).length === 0) return false
  const open = runChat ?? (await load("thincoder-vscode/src/extension/panel-chat.mjs")).runPanelChat
  await open(panel, { text: "", autoTurn: true, timerTurn: true })
  return true
}
function OLDV_syncTimerWatch(panel) {
  const watch = panel._timerWatch ?? (panel._timerWatch = OLDV_createTimerWatch({
    getAgent: () => panel._agent,
    onFire: () => OLDV_fireTimerWake(panel).catch(() => { /* 兜底体不触达（装配驱动不 tick） */ }),
  }))
  return watch.sync()
}

/* ── OLD 拷贝 · CLI（src/tui/timer-watch.mjs 代码行逐行——除 `timerWakeEnabled` ∕ `modalOpen` 指向本拷贝体）── */
function OLDC_timerWakeEnabled(agent) {
  return agent?.config?.agent?.timerWake !== false
}
function OLDC_reminderDisplay(text) {
  const lines = String(text).split("\n")
  return lines.length > REMINDER_CAP ? lines.slice(0, REMINDER_CAP).join("\n") + "\n…" : text
}
function OLDC_deliverExpiredTimers(ctx, now = Date.now()) {
  const { agent, pushLine } = ctx
  const lines = injectTimerReminders(agent, takeExpiredTimers(agent, now))
  for (const line of lines) pushLine(OLDC_reminderDisplay(line), C.warn)
  return lines.length
}
function OLDC_createTimerWatch({ agent, onFire, timer = setTimeout, clear = clearTimeout, now = Date.now } = {}) {
  let handle = null
  const disarm = () => {
    const h = handle
    handle = null
    if (h !== null) { try { clear(h) } catch { /* 已触发 / 不可清——尽力面（同 heap-watch） */ } }
  }
  const sync = () => {
    const deadline = OLDC_timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null
    if (deadline == null) { disarm(); return null } // 无在途 / 开关关——撤旧，零注册
    disarm() // 单槽：重复武装 = 撤旧立新（延迟按最近到期重算）
    const delay = Math.max(0, deadline - now())
    handle = timer(() => { handle = null; onFire?.() }, delay)
    try { handle?.unref?.() } catch { /* unref 失败不阻断（一次性命令自然退出） */ }
    return delay
  }
  return { sync, disarm }
}
function OLDC_modalOpen(state) {
  return state?.picker != null || state?.wizard != null
}
async function OLDC_fireTimerWake(ctx, { runTurn, now = Date.now } = {}) {
  const { agent, state } = ctx
  if (state.processing || state.suspended || state._suspPending) return false
  if (OLDC_modalOpen(state)) return false
  if (OLDC_deliverExpiredTimers(ctx, now()) === 0) return false
  await (runTurn ?? ctx.runTurn)("", { autoTurn: true, timerTurn: true })
  return true
}

/* ── 假钟（同 r4-diff-probe 结构）── */
function fakeClock(start = 1_000_000) {
  let now = start
  const handles = []
  return {
    now: () => now,
    timer: (fn, ms) => {
      const h = { fn, at: now + ms, cleared: false, fired: false, unrefCalled: false, unref() { this.unrefCalled = true } }
      handles.push(h)
      return h
    },
    clear: (h) => { h.cleared = true },
    tick: (ms) => { now += ms; for (const h of handles) if (!h.cleared && !h.fired && h.at <= now) { h.fired = true; h.cleared = true; h.fn() } },
    live: () => handles.filter((h) => !h.cleared && !h.fired),
    all: () => handles,
  }
}
const agentOf = (timers, config = {}) => ({ _pendingTimers: timers, history: [], config: { agent: { timerWake: true, ...config } } })
const t = (ms, message) => ({ id: `t${ms}`, expiresAt: 1_000_000 + ms, message })

/* ── 闩面 ── */
function driveCliLatch(make) {
  const clock = fakeClock()
  const log = []
  const fires = []
  const agent = agentOf([t(1000, "a"), t(5000, "b")])
  const watch = make({ agent, onFire: () => fires.push(1), timer: clock.timer, clear: clock.clear, now: clock.now })
  log.push(["arm", watch.sync(), clock.live().length, clock.live().at(-1)?.unrefCalled])
  log.push(["rearm", watch.sync(), clock.live().length, clock.all().filter((h) => h.cleared).length])
  agent.config.agent.timerWake = false
  log.push(["off", watch.sync(), clock.live().length])
  agent.config.agent.timerWake = true
  log.push(["on-again", watch.sync(), clock.live().length])
  agent._pendingTimers = []
  log.push(["empty", watch.sync(), clock.live().length])
  agent._pendingTimers = [t(300, "near"), t(900, "far")]
  log.push(["refill", watch.sync(), clock.live().length])
  clock.tick(300)
  log.push(["fire", fires.length, clock.live().length])
  watch.disarm()
  log.push(["disarm", clock.live().length])
  return log
}
function driveVscLatch(make) {
  const clock = fakeClock()
  const log = []
  const fires = []
  let seen = agentOf([t(1000, "a")])
  const watch = make({ getAgent: () => seen, onFire: () => fires.push(1), timer: clock.timer, clear: clock.clear, now: clock.now })
  log.push(["arm", watch.sync(), clock.live().length, clock.live().at(-1)?.unrefCalled])
  log.push(["rearm", watch.sync(), clock.live().length, clock.all().filter((h) => h.cleared).length])
  seen = agentOf([t(500, "off")], { timerWake: false })
  log.push(["switch-off", watch.sync(), clock.live().length])
  seen = agentOf([t(700, "on")])
  log.push(["switch-on-new-agent", watch.sync(), clock.live().length])
  clock.tick(700)
  log.push(["fire", fires.length, clock.live().length])
  watch.disarm()
  log.push(["disarm", clock.live().length])
  return log
}
function driveVscAssembly(syncFn) {
  const clock = fakeClock()
  const st = globalThis.setTimeout, sc = globalThis.clearTimeout, dn = Date.now
  globalThis.setTimeout = clock.timer; globalThis.clearTimeout = clock.clear; Date.now = clock.now
  try {
    const log = []
    const agent = agentOf([t(1000, "a")])
    const panel = { _agent: agent }
    log.push(["sync", syncFn(panel), clock.live().length, clock.live().at(-1)?.unrefCalled])
    log.push(["resync", syncFn(panel), clock.live().length, clock.all().filter((h) => h.cleared).length])
    agent.config.agent.timerWake = false
    log.push(["off", syncFn(panel), clock.live().length])
    agent.config.agent.timerWake = true
    agent._pendingTimers = []
    log.push(["empty", syncFn(panel), clock.live().length])
    agent._pendingTimers = [t(300, "near")]
    log.push(["refill", syncFn(panel), clock.live().length])
    panel._timerWatch.disarm()
    log.push(["disarm", clock.live().length])
    log.push(["resync-after-disarm", syncFn(panel), clock.live().length])
    return log
  } finally {
    globalThis.setTimeout = st; globalThis.clearTimeout = sc; Date.now = dn
  }
}

/* ── 交付面 ── */
function driveCliDeliver(impl) {
  const clock = fakeClock()
  const agent = agentOf([t(1000, "due-a"), t(1000, "l1\nl2\nl3\nl4"), t(9000, "future")])
  const pushed = []
  const ctx = { agent, state: {}, pushLine: (text, color) => pushed.push([text, color]) }
  clock.tick(1000)
  const log = []
  log.push(["first", impl(ctx, clock.now()), pushed, agent.history.map((h) => h.content), agent._pendingTimers.map((x) => x.message)])
  log.push(["second(idempotent)", impl(ctx, clock.now()), pushed.length])
  return log
}
function driveVscDeliver(impl) {
  const clock = fakeClock()
  const log = []
  clock.tick(1000)
  { // 空闲路
    const agent = agentOf([t(1000, "due-a"), t(9000, "future")])
    const saved = [], posted = []
    const target = { fullHistory: [0], contextHistory: [], history: [] }
    const panel = {
      _agent: agent, _slot: 7,
      _activeLines: () => target,
      _saveLines: (f, c) => saved.push([f === target.fullHistory, c === target.contextHistory]),
      _panel: { webview: { postMessage: (m) => posted.push(m) } },
    }
    const r1 = impl(panel, { now: clock.now })
    const r2 = impl(panel, { now: clock.now })
    log.push(["idle", r1, r2, saved, posted, target.contextHistory.map((h) => h.content), agent._pendingTimers.length])
  }
  { // 窗内路（lines 给定时）+ 零槽 ∕ 无载体
    const agent = agentOf([t(1000, "w")])
    const target = { fullHistory: [], contextHistory: [], history: [] }
    const saved = [], posted = []
    const panel = { _agent: agent, _slot: null, _saveLines: () => saved.push(1), _panel: { webview: { postMessage: (m) => posted.push(m) } } }
    log.push(["window", impl(panel, { lines: target, now: clock.now }), saved.length, posted.length, target.contextHistory.length])
    log.push(["no-agent", impl({ _agent: null }, { now: clock.now })])
    log.push(["no-slot", impl({ _agent: agentOf([t(1000, "x")]) }, { now: clock.now })])
  }
  return log
}

/* ── 火面 ── */
async function driveCliFire(impl) {
  const log = []
  for (const s of ["processing", "suspended", "suspPending", "modal", "idle-due", "idle-none"]) {
    const clock = fakeClock()
    const agent = agentOf([s === "idle-none" ? t(9000, "future") : t(1000, "due")])
    const state = { processing: s === "processing", suspended: s === "suspended", _suspPending: s === "suspPending", picker: s === "modal" ? { title: "p" } : null }
    const lines = [], runs = []
    const ctx = { agent, state, pushLine: (text, color) => lines.push([text, color]) }
    clock.tick(1000)
    const res = await impl(ctx, {
      runTurn: (text, opts) => { runs.push([text, opts]); return Promise.resolve() },
      now: clock.now,
    })
    log.push([s, res, lines, runs, agent.history.map((h) => h.content), agent._pendingTimers.map((x) => x.message)])
  }
  return log
}
async function driveVscFire(impl) {
  const log = []
  for (const s of ["idle-due", "busy", "no-agent", "idle-none"]) {
    const clock = fakeClock()
    const agent = agentOf([s === "idle-none" ? t(9000, "future") : t(1000, "due")])
    const saved = [], posted = [], calls = []
    const target = { fullHistory: [], contextHistory: [], history: [] }
    const panel = {
      _agent: s === "no-agent" ? null : agent,
      turnBusy: () => s === "busy",
      _slot: 7,
      _activeLines: () => target,
      _saveLines: (f, c) => saved.push([f === target.fullHistory, c === target.contextHistory]),
      _panel: { webview: { postMessage: (m) => posted.push(m) } },
    }
    clock.tick(1000)
    const res = await impl(panel, {
      runChat: (p, opts) => { calls.push([p === panel, opts]); return Promise.resolve() },
      now: clock.now,
    })
    log.push([s, res, saved.length, posted, calls, target.contextHistory.map((h) => h.content), agent._pendingTimers.length])
  }
  return log
}

/* ── 驱动 ── */
test("T-TW35 ∕ T-TW28 · CLI 闩：单槽闩起 ∕ 重臂撤旧 ∕ 开关关 ∕ 空在途 ∕ fire ∕ disarm 可观察行为逐项相等", () => {
  assert.deepEqual(driveCliLatch((p) => NEWC.createTimerWatch(p)), driveCliLatch(OLDC_createTimerWatch))
})

test("T-TW35 · VSC 闩（活体重读）：旧副本 vs 核件（= 新端闩源）逐项相等", () => {
  assert.deepEqual(driveVscLatch((p) => CORE_createTimerWatch(p)), driveVscLatch(OLDV_createTimerWatch))
})

test("T-TW35 ∕ T-TW34 · VSC 装配（syncTimerWatch 全径——旧副本 vs 新模块现值）逐项相等", async () => {
  assert.deepEqual(await driveVscAssembly(OLDV_syncTimerWatch), await driveVscAssembly(NEWV.syncTimerWatch))
})

test("T-TW35 ∕ T-TW31 · CLI 交付：出列幂等 ∕ 原文逐字 ∕ 显示裁 ∕ 返回条数逐项相等", () => {
  assert.deepEqual(driveCliDeliver((c, n) => NEWC.deliverExpiredTimers(c, n)), driveCliDeliver(OLDC_deliverExpiredTimers))
})

test("T-TW35 ∕ T-TW32 · VSC 交付：空闲路落盘 + 发帧 ∕ 窗内路 ∕ 零槽 ∕ 无载体逐项相等", () => {
  assert.deepEqual(driveVscDeliver(NEWV.deliverExpiredTimers), driveVscDeliver(OLDV_deliverExpiredTimers))
})

test("T-TW35 ∕ T-TW29–T-TW30 · CLI 火（六径：processing ∕ suspended ∕ _suspPending ∕ modal ∕ idle-due ∕ idle-none）逐项相等", async () => {
  assert.deepEqual(await driveCliFire(NEWC.fireTimerWake), await driveCliFire(OLDC_fireTimerWake))
})

test("T-TW35 ∕ T-TW32–T-TW33 · VSC 火（四径：idle-due ∕ busy ∕ no-agent ∕ idle-none）逐项相等", async () => {
  assert.deepEqual(await driveVscFire(NEWV.fireTimerWake), await driveVscFire(OLDV_fireTimerWake))
})

test("T-TW35 · 开关判据：CLI 转口 vs 旧副本（缺省 ∕ 显式 false ∕ 无 config ∕ undefined）同值", () => {
  for (const a of [agentOf([]), agentOf([], { timerWake: false }), {}, undefined]) {
    assert.equal(NEWC.timerWakeEnabled(a), OLDC_timerWakeEnabled(a))
  }
})
