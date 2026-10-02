/**
 * 2026-10-01-timer-wake-delivery.test.mjs — 批内件（timer 唤醒投递缺陷修复批 · 台账 #799 · 实施轮 · 四用例 T-TW36–T-TW39）。
 * 名随批次档 · 不进仓套件；用例名 T 引 = 对应行；跑法（仓根 `thincoder/`）：
 *   node --test docs/batches/2026-10-01-timer-wake-delivery.test.mjs
 * 用例面 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.17 用例表：
 *   T-TW36 = 缺陷复现（**先红后绿**）：窗内投递存活——重装须先于投递，否则整换机读线吞掉刚落下的投递行；
 *   T-TW37 = 边界：在途零项 ⇒ `deliver` 假（零重装 ∥ 零投递）∥ 到期两条 ⇒ 恰两行逐字 + 二次调用零返；
 *   T-TW38 = 回归：桌面 idle 径零变（投递行在 + 开轮 opts 同 + `reloadSlot` 零调用）；
 *   T-TW39 = 射程：CLI ∥ VSC 交付目标（各自轮读面活线 · 零整换）。
 * 挂载面（批内件挂载规范）：核件取件经**桌面端壳**（`thincoder-desktop/src/main/session-slots.mjs`——与
 * `loadAgentSlot` 链同实例）；直路 import 会落第二 ESM 实例 ⇒ `_setSessionsDirForTest` 沙箱缝失效（隔离击穿）。
 * 沙箱 = 核会话根隔离缝 + `mkdtemp` 临时 cwd（真实用户目录零触）；假钟 = `now` 注入缝（交付到期判据）。
 * 窗内等待原语注记：窗径的核 `waitForSettleOrWake` 走全局 `setTimeout`（该径无时钟注入缝——`delay =
 * max(0, deadline - Date.now())` = 0 ⇒ 即时宏任务）；假钟只裁交付面，等待以即时宏任务推进（零真实延时）。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const shell = await mod("thincoder-desktop/src/main/session-slots.mjs") // 端壳（junction 同源实例：沙箱缝 ∥ 槽路径 ∥ 写口）
const { createSuspensionDrive } = await mod("thincoder-desktop/src/main/suspension-drive.mjs")
const { createSuspensionTimers } = await mod("thincoder-desktop/src/main/suspension-timers.mjs")
const { loadAgentSlot } = await mod("thincoder-desktop/src/main/session-io.mjs")
const CLI = await mod("thincoder-cli/src/tui/timer-watch.mjs")
const VSC = await mod("thincoder-vscode/src/extension/timer-watch.mjs")

/** 投递行逐字形（核注入单源）。 */
const T = (message) => `[System reminder: ⏰ timer — ${message}]`
const tick = () => new Promise((r) => setTimeout(r, 0))
/** 推进至条件成立（即时宏任务——零真实延时）。 */
async function until(cond, tries = 200) {
  for (let i = 0; i < tries; i++) { if (cond()) return true; await tick() }
  return cond()
}

/* ── 沙箱（会话根隔离缝 + 临时 cwd） ── */
const SANDBOX = mkdtempSync(join(tmpdir(), "tw-delivery-"))
shell._setSessionsDirForTest(join(SANDBOX, "sessions"))
after(() => { shell._resetSessionsDirForTest(); rmSync(SANDBOX, { recursive: true, force: true }) })
const proj = (name) => { const p = join(SANDBOX, name); mkdirSync(p, { recursive: true }); return p }

/** 槽种子：机读线 = 一行 `slot-line`（重装整换的观察面 —— 真 `loadAgentSlot` 可达）。 */
function seedSlot(cwd, slot) {
  shell.writeSessionFile(shell.slotPath(cwd, slot), {
    version: 2, cwd, sessionStart: null,
    history: [{ role: "user", content: "slot-line" }],
    contextHistory: [{ role: "user", content: "slot-line" }],
  })
}

/** 代理夹具：`pool` 真 ⇒ 池 live 桩（窗内条件）；`_pendingTimers` = 在途 timer 表（核唯一读面）。 */
function makeAgent(cwd, { timers = [], pool = true } = {}) {
  const agent = { cwd, history: [], config: { agent: { timerWake: true } }, _pendingTimers: timers, _pendingAsyncResults: [] }
  if (pool) agent._asyncSubagents = new Map([["s1", { id: "s1", role: "subagent", status: "running" }]])
  return agent
}

/** 假钟（闩 ∕ 交付两读点同源；`tick` 同步点火）。 */
function fakeClock(start = 1_000_000) {
  let now = start
  const handles = []
  return {
    now: () => now,
    timer: (fn, ms) => { const h = { fn, at: now + ms, cleared: false, fired: false, unref() {} }; handles.push(h); return h },
    clear: (h) => { h.cleared = true },
    tick(ms) {
      now += ms
      for (const h of handles) if (!h.cleared && !h.fired && h.at <= now) { h.fired = true; h.cleared = true; h.fn() }
    },
    live: () => handles.filter((h) => !h.cleared && !h.fired),
  }
}

/* ── T-TW36 臂 1：缺陷复现（先红后绿）── */
test("T-TW36 · 窗内投递存活：重装先于投递 ⇒ 轮起跑刻 history 含逐字投递行", async () => {
  const cwd = proj("t36"), slot = 7, KEY = "k36"
  seedSlot(cwd, slot)
  const clock = fakeClock()
  const agent = makeAgent(cwd, { timers: [{ id: "t1", expiresAt: clock.now() - 1, message: "wake-799" }] })
  const posts = [], seq = [], reloads = [], runs = []
  const post = (channel, payload) => { posts.push([channel, payload]); if (channel === "ev:timer") seq.push("ev:timer") }
  const reloadSlot = (key, a, cwdArg) => {
    const before = a.history
    const linePresent = before.some((m) => m.content === T("wake-799")) // 重装刻投递行在场？（先于投递判据）
    seq.push("reload")
    const hit = loadAgentSlot(a, cwdArg, slot)
    reloads.push({ key, cwd: cwdArg, hit, linePresent, arraySwapped: a.history !== before })
    return hit
  }
  const runTurn = (key, a, body, opts) => {
    seq.push("turn")
    runs.push({ key, body, opts, history: a.history.map((m) => m.content) })
    return Promise.resolve()
  }
  const drive = createSuspensionDrive({ post, runTurn, reloadSlot, now: clock.now })

  assert.equal(drive.start(KEY, agent, { cwd }), true, "池 live ⇒ 入窗")
  await until(() => runs.length > 0)

  assert.equal(runs.length, 1, "timer 轮恰一次")
  assert.equal(runs[0].opts.autoTurn, true)
  assert.equal(runs[0].opts.timerTurn, true)
  assert.deepEqual(runs[0].history, ["slot-line", T("wake-799")], "轮起跑刻机读线 = 重装后数组 + 投递行存活")
  assert.equal(reloads.length, 1, "重装恰一次")
  assert.equal(reloads[0].key, KEY)
  assert.equal(reloads[0].cwd, cwd)
  assert.equal(reloads[0].hit, true, "槽真装载（整换可达）")
  assert.equal(reloads[0].linePresent, false, "重装先于投递")
  assert.equal(reloads[0].arraySwapped, true, "重装整换数组（缺陷作用面）")
  const evTimer = posts.filter(([c]) => c === "ev:timer")
  assert.equal(evTimer.length, 1, "ev:timer 恰一条")
  assert.deepEqual(evTimer[0][1], { key: KEY, status: "fired", text: T("wake-799") })
  assert.deepEqual(seq, ["reload", "ev:timer", "turn"], "序：重装 ⇒ 投递 ⇒ 开轮")
  drive.abort(KEY)
  await tick()
})

/* ── T-TW36 臂 2：零变不变量（其余轮重装时点零变）── */
test("T-TW36 ∥ 臂 2 · 零变不变量：窗内用户回合重装照旧恰一次 + 正文照达", async () => {
  const cwd = proj("t36b"), slot = 8, KEY = "k36b"
  seedSlot(cwd, slot)
  const agent = makeAgent(cwd) // 零在途 timer：先用户回合（timer 轮不介入）
  const posts = [], reloads = [], runs = []
  const drive = createSuspensionDrive({
    post: (c, p) => posts.push([c, p]),
    runTurn: (key, a, body, opts) => { runs.push({ key, body, opts }); return Promise.resolve() },
    reloadSlot: (key, a, cwdArg) => { reloads.push([key, cwdArg]); return loadAgentSlot(a, cwdArg, slot) },
  })

  assert.equal(drive.start(KEY, agent, { cwd }), true, "池 live ⇒ 入窗")
  assert.equal(drive.pushInput(KEY, "hello-36"), true, "窗内受理")
  await until(() => runs.length > 0)

  assert.equal(runs[0].body, "hello-36", "正文照达")
  assert.equal(runs[0].opts.autoTurn, false, "普通回合（非 auto）")
  assert.equal(reloads.length, 1, "用户回合重装照旧（恰一次）")
  drive.abort(KEY)
  await tick()
})

/* ── T-TW37 臂 1：在途零项 ⇒ 零交付 ∥ 零重装 ∥ 零投递 ── */
test("T-TW37 ∥ 臂 1 · 边界：在途零项 ⇒ deliver 假（零重装 ∥ 零投递）", () => {
  const clock = fakeClock()
  const cwd = proj("t37a")
  const agent = makeAgent(cwd, { timers: [] })
  const posts = [], reloads = [], runs = []
  const timers = createSuspensionTimers({
    post: (c, p) => posts.push([c, p]),
    runTurn: (...args) => { runs.push(args); return Promise.resolve() },
    reloadSlot: (...args) => { reloads.push(args); return true },
    now: clock.now,
  })
  const face = timers.faceOf("k37a", agent, cwd)

  assert.equal(face.deadline(), null, "空在途 ⇒ 零注册")
  assert.equal(face.deliver(), false, "零交付（严格布尔——核件 `=== true` 才开轮 ⇒ 零开轮）")
  assert.equal(reloads.length, 0, "早退 ⇒ 零重装")
  assert.equal(posts.length, 0, "零投递")
  assert.equal(runs.length, 0)
})

/* ── T-TW37 臂 2：到期两条 ⇒ 恰两行逐字 ∥ 二次调用零返 ── */
test("T-TW37 ∥ 臂 2 · 到期两条 ⇒ 恰两行逐字 ∥ 二次调用零返（出列幂等）", () => {
  const clock = fakeClock()
  const agent = makeAgent(proj("t37b"), {
    timers: [
      { id: "a", expiresAt: clock.now() - 10, message: "due-a" },
      { id: "b", expiresAt: clock.now() - 5, message: "due-b" },
      { id: "f", expiresAt: clock.now() + 9000, message: "future" },
    ],
  })
  const posts = [], reloads = []
  const timers = createSuspensionTimers({
    post: (c, p) => posts.push([c, p]),
    runTurn: () => Promise.resolve(),
    reloadSlot: () => { reloads.push(agent.history.length); return true },
    now: clock.now,
  })
  const face = timers.faceOf("k37b", agent, agent.cwd)

  assert.equal(face.deadline(), clock.now() - 10)
  assert.equal(face.deliver(), true)
  assert.equal(reloads.length, 1, "交付真 ⇒ 重装恰一次")
  assert.equal(reloads[0], 0, "重装刻机读线空（先于投递）")
  assert.deepEqual(agent.history.map((m) => m.content), [T("due-a"), T("due-b")], "恰两行逐字 ∥ 原序")
  assert.deepEqual(posts.map(([, p]) => p.text), [T("due-a"), T("due-b")])
  assert.equal(posts.every(([c]) => c === "ev:timer"), true)
  assert.equal(face.deliver(), false, "二次调用零返")
  assert.deepEqual(agent.history.map((m) => m.content), [T("due-a"), T("due-b")], "零重复投递")
  assert.deepEqual(agent._pendingTimers.map((t) => t.message), ["future"], "未到期项原样留途")
  assert.equal(reloads.length, 2, "在途仍非空（未到期）⇒ 非早退径（早退判据 = 零在途，非零到期）")
})

/* ── T-TW38：桌面 idle 径零变（回归）── */
test("T-TW38 · 回归：桌面 idle 径零变（投递行在 + opts 同 + reloadSlot 零调用）", async () => {
  const cwd = proj("t38"), KEY = "k38"
  const clock = fakeClock()
  const agent = makeAgent(cwd, { timers: [{ id: "i1", expiresAt: clock.now() + 1000, message: "idle-38" }], pool: false })
  const posts = [], seq = [], reloads = [], runs = []
  const drive = createSuspensionDrive({
    post: (c, p) => { posts.push([c, p]); if (c === "ev:timer") seq.push("ev:timer") },
    runTurn: (key, a, body, opts) => { seq.push("turn"); runs.push({ body, opts, history: a.history.map((m) => m.content) }); return Promise.resolve() },
    reloadSlot: () => { reloads.push(1); return true },
    timer: clock.timer, clear: clock.clear, now: clock.now,
  })

  assert.equal(drive.start(KEY, agent, { cwd }), false, "池空 ⇒ 零入窗（武装空闲闩）")
  assert.equal(drive.timerLatches(), 1, "闩在册")
  clock.tick(1000)
  await until(() => runs.length > 0)

  assert.deepEqual(runs[0].history, [T("idle-38")], "投递行在（零重装径——与修前同签）")
  assert.equal(runs[0].opts.autoTurn, true)
  assert.equal(runs[0].opts.timerTurn, true)
  assert.equal(reloads.length, 0, "idle 径 reloadSlot 零调用")
  assert.deepEqual(seq, ["ev:timer", "turn"])
  assert.equal(drive.timerLatches(), 0, "轮后链尾接管：投递尽 ⇒ 撤闩")
})

/* ── T-TW39：射程腿（CLI ∥ VSC 交付目标）── */
test("T-TW39 · 射程：CLI ∥ VSC 交付目标（各自轮读面活线 · 零整换）", () => {
  const clock = fakeClock()
  { // CLI：投递落 `agent.history`（跨轮单数组——无重装缝 ⇒ 零整换）
    const agent = makeAgent(proj("t39"), { timers: [{ id: "c1", expiresAt: clock.now() - 1, message: "cli-39" }] })
    const arr = agent.history
    const lines = []
    const n = CLI.deliverExpiredTimers({ agent, pushLine: (text, color) => lines.push([text, color]) }, clock.now())
    assert.equal(n, 1)
    assert.equal(agent.history, arr, "零整换（跨轮单数组）")
    assert.deepEqual(agent.history.map((m) => m.content), [T("cli-39")])
    assert.deepEqual(lines.map(([text]) => text), [T("cli-39")])
  }
  { // VSC：投递落会话活线 `lines.contextHistory`（注入即在场）
    const agent = makeAgent(proj("t39"), { timers: [{ id: "v1", expiresAt: clock.now() - 1, message: "vsc-39" }] })
    const target = { fullHistory: [], contextHistory: [], history: [] }
    const live = target.contextHistory
    const posted = [], saved = []
    const panel = {
      _agent: agent, _slot: 7,
      _activeLines: () => target,
      _saveLines: () => saved.push(1),
      _panel: { webview: { postMessage: (m) => posted.push(m) } },
    }
    const injected = VSC.deliverExpiredTimers(panel, { lines: target, now: clock.now })
    assert.equal(injected.length, 1)
    assert.equal(target.contextHistory, live, "零整换（活线）")
    assert.deepEqual(target.contextHistory.map((m) => m.content), [T("vsc-39")])
    assert.equal(saved.length, 0, "窗内活线：注入即在场（不落盘）")
    assert.deepEqual(posted, [{ type: "timer", status: "fired", text: T("vsc-39") }])
  }
})
