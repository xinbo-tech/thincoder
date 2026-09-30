/**
 * 2026-09-30-desktop-heap-freeze.test.mjs — 桌面堆取证批 · 单元腿（假源 · 平 node 直测；批内件，首落
 * `.thincoder/tmp/` ⇒ 父侧收位 `docs/batches/` 同名件——两层深相对路径与终位一致）。
 * 覆盖 12 用例（验收单源 = 批档 `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.11 + §2.14-D ∥ §2.14a ∥ §2.15）：
 *   ① 策略面平 node 装载（零 `electron` 顶层 import——隔离形禁令）+ 采样拍 + **E3 假源值域（间隔 15s ∕ 超时 8s ∕ 连超 2）**
 *   ② 双档阈值 70% ∕ 85%（与 CLI 同值；每档一次 + 进程标签）
 *   ③ 阈值取（主堆比 ≥85% ∨ 渲染 workingSet ≥800MB ∧ ping 正常 ⇒ 取；once 按 pressure episode）
 *   ④ 键两态（`heapWatch` 关 ⇒ 零武装；`heapSnapshot` 关 ⇒ 零取）
 *   ⑤ 门序 · `unresponsive` 径（现场先落 → 宽限 → kill+reload；once）
 *   ⑥ 门序 · ping 径（连续 2 次超时 ⇒ 冻结判定；单次不判）
 *   ⑦ 冻结自复 + 快照三点（`responsive` ≤ 宽限 ∥ ping 复通 ⇒ 不杀 + post-freeze 取；体积门 over-cap 跳过）
 *   ⑧ once ∕ 5min 守卫（重复冻结零双杀；5min 窗内跳过 + 记录；窗过放行；独立崩 ⇒ 落现场 ∕ clean-exit ⇒ 零现场）
 *   ⑨ **D9 补启**（§2.14a——假 DOM + 假窄桥装载真 `renderer/app.mjs`：`cwd` 非空 ⇒ 恰一次 `session:resume`
 *      ∥ `cwd` 空 / 空串 ⇒ 零触发 ∥ 拒径 ⇒ 恰一次尝试 + boot 仍 ok）
 *   **E4-JS 支（§2.15）三用例**：
 *   ⑩ 段界（12K ∕ 段 —— 逐段拼接 ≡ 全体）∥ 窗计划（首 ∥ 底 ∥ 视口±1）∥ 步进预算（远跳每帧 ≤2 变更 ∧ 有界收敛）∥ 预算削减
 *   ⑪ 补偿算式（锚上净变：卸上 ⇒ -h ∥ 挂上 ⇒ +h ∥ 锚下零 ∥ 跨界部分）
 *   ⑫ 进段阈值（> 24K；恰阈 ∥ reasoning 零启用）∥ 回滚三形（常量开关 ∥ 测试缝关态零 DOM 触 ∥ 分区抛错 ⇒ 该面退段不抛）
 * 跑法：`node --test .thincoder/tmp/2026-09-30-desktop-heap-freeze.test.mjs`（⑨ 经静态 import 的
 * `thincoder-desktop/test/rc-resolve.mjs` 解析 `/rc/` 取件 —— 平 node 与终位两处同效）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（⑨ 取 app.mjs 用 —— 须先于任何 /rc/ 取件）

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const MODULE_PATH = join(REPO, "thincoder-desktop", "src", "main", "heap-watch.mjs")
const APP_PATH = join(REPO, "thincoder-desktop", "renderer", "app.mjs")
const SEGMENTS_PATH = join(REPO, "thincoder-desktop", "renderer", "views", "chat-text-segments.mjs")
const MODULE_SRC = readFileSync(MODULE_PATH, "utf8")
const { createHeapWatch, heapWarnLine, HEAP_RATIOS, PING_INTERVAL_MS, PING_TIMEOUT_MS, PING_TIMEOUT_STREAK } = await import(pathToFileURL(MODULE_PATH).href)
const seg = await import(pathToFileURL(SEGMENTS_PATH).href)

const flush = async () => { for (let i = 0; i < 4; i += 1) await new Promise((done) => setTimeout(done, 0)) }
const reading = (ratio, wsMb) => ({
  main: { heapUsed: ratio * 4.2e9, heapLimit: 4.2e9 },
  processes: [{ type: "Tab", pid: 4321, workingSetMb: wsMb, cpu: 12 }], // 真机词汇（getAppMetrics 渲染面 = "Tab"）
})
const readScenes = (dir) => (existsSync(dir)
  ? readdirSync(dir).sort().map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")))
  : [])

/** 假源夹具：假时钟 ∕ 假定时器（句柄可直驱）∕ 记录式动作 ∕ 真盘现场。 */
function makeHarness() {
  const base = mkdtempSync(join(tmpdir(), "hf-unit-"))
  const sceneDir = join(base, "crash-reports")
  const calls = { snapshot: [], kill: 0, reload: 0, logs: [], killSceneCount: null, killScene: null, order: [], arm: [] }
  const intervals = new Map()
  const timeouts = new Map()
  let clock = 1_000_000
  let seq = 0
  const inject = {
    sceneDir,
    now: () => clock,
    timer: (cb, ms) => { const handle = { id: ++seq, cb, ms }; intervals.set(handle.id, handle); return handle },
    clearTimer: (handle) => intervals.delete(handle?.id),
    setTimer: (cb, ms) => { const handle = { id: ++seq, cb, ms }; timeouts.set(handle.id, handle); return handle },
    clearSetTimer: (handle) => timeouts.delete(handle?.id),
    sample: () => reading(0.2, 100),
    armMainSnapshot: (n) => calls.arm.push(n),
    snapshot: async ({ kind, path }) => { calls.snapshot.push({ kind, path }); return { path } },
    log: (line) => calls.logs.push(line),
    ping: async () => true,
    killRenderer: () => {
      calls.kill += 1
      calls.order.push("kill")
      calls.killSceneCount = readScenes(sceneDir).length // 先落现场后动刀（动刀时刻现场必须在盘）
      calls.killScene = readScenes(sceneDir)[0] ?? null
    },
    reload: () => { calls.reload += 1; calls.order.push("reload") },
  }
  return {
    base, sceneDir, inject, calls,
    intervals,
    timeouts,
    advance: (ms) => { clock += ms },
    pingTick: () => { const handle = [...intervals.values()].find((entry) => entry.ms === 15_000); handle.cb() },
    fireTimeout: () => { const [handle] = [...timeouts.values()]; if (handle) { timeouts.delete(handle.id); handle.cb() } },
    scenes: () => readScenes(sceneDir),
  }
}

test("① 策略面平 node 装载（零 electron）+ 采样拍 + E3 假源值域", async () => {
  assert.ok(!/(?:from\s+|require\(\s*|import\(\s*)["']electron["']/.test(MODULE_SRC), "隔离形禁令：零 electron 顶层 import（含 require ∕ import() 形）")
  assert.equal(PING_INTERVAL_MS, 15_000, "E3 假源值域：间隔 15s（§2.14-D 提速收正）")
  assert.equal(PING_TIMEOUT_MS, 8_000, "E3 假源值域：超时 8s（不变）")
  assert.equal(PING_TIMEOUT_STREAK, 2, "E3 假源值域：连续 2 次（不变）")
  const h = makeHarness()
  let samples = 0
  const watch = createHeapWatch({ ...h.inject, sample: () => { samples += 1; return reading(0.2, 100) } })
  assert.equal(h.intervals.size, 2, "采样 + ping 双定时器已注册")
  const [sampleTimer, pingTimer] = [...h.intervals.values()]
  assert.equal(sampleTimer.ms, 60_000, "采样间隔 = 60s")
  assert.equal(pingTimer.ms, 15_000, "ping 间隔 = 15s（D7 · §2.14-D）")
  assert.deepEqual(h.calls.arm, [1], "主臂武装：armHeapSnapshot(1) 恰一次")
  sampleTimer.cb()
  await flush()
  assert.equal(samples, 1, "60s 采样拍可直驱")
  assert.deepEqual(await watch.checkNow(), [], "低读数零行")
  assert.equal(samples, 2)
  watch.stop()
  assert.equal(h.intervals.size, 0, "stop 清定时器")
  assert.equal(heapWarnLine("main", 3 * 1024 ** 3, 4.2 * 1024 ** 3, 3 / 4.2),
    "[heap] warning (main): heapUsed 3.0 GB / 4.2 GB heap limit (71%) — long session; consider /new to reset context")
})

test("② 双档阈值 70% ∕ 85%（每档一次 + 进程标签）", async () => {
  assert.deepEqual([...HEAP_RATIOS], [0.7, 0.85], "与 CLI 同值")
  const h = makeHarness()
  let used = 0.5
  const watch = createHeapWatch({ ...h.inject, snapshotEnabled: false, sample: () => reading(used, 10) })
  assert.deepEqual(await watch.checkNow(), [], "50% ⇒ 零行")
  used = 0.72
  const tier1 = await watch.checkNow()
  assert.equal(tier1.length, 1)
  assert.match(tier1[0], /^\[heap\] warning \(main\):/, "warn 行带进程标签")
  assert.match(tier1[0], /\(72%\)/)
  used = 0.86
  const tier2 = await watch.checkNow()
  assert.equal(tier2.length, 1, "85% 档（70% 已触发不重复）")
  assert.match(tier2[0], /\(86%\)/)
  assert.equal((await watch.checkNow()).length, 0, "边缘一次（不重复刷屏）")
})

test("③ 阈值取：主堆比 ∥ 渲染 workingSet ∧ ping 正常；once 按 pressure episode", async () => {
  const h = makeHarness()
  let ratio = 0.2
  let ws = 100
  let alive = true
  const watch = createHeapWatch({ ...h.inject, sample: () => reading(ratio, ws), ping: async () => alive })
  assert.deepEqual(await watch.checkNow(), [], "低读数零取")
  ws = 850 // 渲染面触发（无需主堆比）
  const hit = await watch.checkNow()
  assert.equal(h.calls.snapshot.length, 1)
  assert.equal(h.calls.snapshot[0].kind, "threshold")
  assert.ok(h.calls.snapshot[0].path.startsWith(h.sceneDir), "快照落 crash-reports")
  assert.ok(/Heap\.desktop\..*\.heapsnapshot$/.test(h.calls.snapshot[0].path), "命名沿 CLI purge 正则族")
  assert.match(hit.at(-1), /threshold hit/)
  await watch.checkNow()
  assert.equal(h.calls.snapshot.length, 1, "once：同 pressure episode 不重取")
  ws = 100
  await watch.checkNow() // 条件解除 ⇒ 重新武装
  ws = 850
  await watch.checkNow()
  assert.equal(h.calls.snapshot.length, 2, "再跨阈 ⇒ 可再取")
  ws = 100
  await watch.checkNow()
  alive = false
  ws = 850
  await watch.checkNow()
  assert.equal(h.calls.snapshot.length, 2, "ping 不正常 ⇒ 不取")
  alive = true
  await watch.checkNow()
  assert.equal(h.calls.snapshot.length, 3)
  ws = 100 // 条件解除 ⇒ 重新武装（先回低读数）
  await watch.checkNow()
  ratio = 0.9 // 主进程自读堆比触发臂
  await watch.checkNow()
  assert.equal(h.calls.snapshot.length, 4)
  assert.equal(h.calls.snapshot[3].kind, "threshold")
})

test("④ 键两态：heapWatch 关 ⇒ 零武装；heapSnapshot 关 ⇒ 零取", async () => {
  const off = makeHarness()
  const unarmed = join(off.base, "unarmed")
  const watchOff = createHeapWatch({ ...off.inject, enabled: false, sceneDir: unarmed })
  assert.equal(off.intervals.size, 0, "关 ⇒ 零定时器")
  assert.equal(existsSync(unarmed), false, "关 ⇒ 零预建")
  assert.deepEqual(off.calls.arm, [], "关 ⇒ 零主臂武装")
  assert.deepEqual(await watchOff.checkNow(), [])
  watchOff.onUnresponsive()
  watchOff.onResponsive()
  watchOff.onGone({ reason: "crashed" })
  await flush()
  assert.equal(existsSync(unarmed), false, "关 ⇒ 零现场")
  watchOff.stop()

  const noSnap = makeHarness()
  const watchNoSnap = createHeapWatch({
    ...noSnap.inject, snapshotEnabled: false, sample: () => reading(0.9, 900),
    snapshot: async () => { throw new Error("must-not-take") },
  })
  assert.equal(noSnap.intervals.size, 2, "快照门不关采样 ∕ ping")
  assert.deepEqual(noSnap.calls.arm, [], "快照门关 ⇒ 零主臂武装")
  const lines = await watchNoSnap.checkNow()
  assert.equal(noSnap.calls.snapshot.length, 0, "关 ⇒ 零取")
  assert.deepEqual(lines.length, 2, "warn 双档照出（冻结门不受影响）")
})

test("⑤ 门序 · unresponsive 径：现场（先）→ 宽限 → kill+reload；once", async () => {
  const h = makeHarness()
  const watch = createHeapWatch({ ...h.inject })
  watch.onUnresponsive()
  watch.onUnresponsive() // once：同 episode 零第二现场
  assert.equal(h.scenes().length, 1, "恰一份现场")
  const opened = h.scenes()[0]
  assert.equal(opened.trigger, "unresponsive")
  assert.equal(opened.source, "event")
  assert.deepEqual(opened.actions.map((a) => a.type), ["unresponsive"])
  assert.equal(h.calls.kill, 0, "宽限内零动刀")
  assert.equal([...h.timeouts.values()][0]?.ms, 15_000, "宽限 = 15s（D9）")
  h.fireTimeout()
  await flush()
  assert.equal(h.calls.kill, 1)
  assert.equal(h.calls.reload, 1)
  assert.deepEqual(h.calls.order, ["kill", "reload"], "恢复动作序 = kill → reload")
  assert.equal(h.calls.killSceneCount, 1, "动刀时现场已落盘")
  assert.deepEqual((h.calls.killScene?.actions ?? []).map((a) => a.type), ["unresponsive", "reload"])
  assert.equal(h.scenes()[0].snapshot.skipped, "renderer-replaced", "D8-3 转 reload 径 = 零快照")
  assert.ok(h.calls.logs.some((line) => line.includes("forcefullyCrashRenderer")))
  watch.onGone({ reason: "killed" }) // 预期杀收束（真机事件序 = gone 晚于落刀 ⇒ 同现场补收官动作）
  assert.equal(h.scenes().length, 1, "预期杀不另开现场")
  assert.deepEqual(h.scenes()[0].actions.map((a) => a.type), ["unresponsive", "reload", "gone"])
  watch.stop()
})

test("⑥ 门序 · ping 径：2 连超时 ⇒ 冻结判定（同序）；单次 ∕ 复位序不判", async () => {
  const h = makeHarness()
  const queue = [false, true, false, false, false] // 败-成-败-败 ⇒ 第 4 拍成案；宽限复查（第 5 拍）= 仍超时 ⇒ 转恢复动作
  const watch = createHeapWatch({ ...h.inject, ping: async () => queue.shift() ?? true })
  assert.equal(h.intervals.size, 2)
  h.pingTick()
  await flush()
  assert.equal(h.scenes().length, 0, "单次超时不判")
  h.pingTick()
  await flush()
  assert.equal(h.scenes().length, 0, "成功后计数复位（败-成-败 不成案）")
  h.pingTick()
  await flush()
  assert.equal(h.scenes().length, 0)
  h.pingTick()
  await flush()
  assert.equal(h.scenes().length, 1, "2 连超时 ⇒ 冻结判定")
  const opened = h.scenes()[0]
  assert.equal(opened.trigger, "ping-timeout")
  assert.equal(opened.source, "ping")
  assert.equal(opened.actions[0].type, "unresponsive")
  assert.equal(opened.actions[0].source, "ping")
  assert.equal([...h.timeouts.values()][0]?.ms, 15_000, "宽限 = 15s")
  h.fireTimeout()
  await flush()
  assert.equal(h.calls.kill, 1, "同一门序：宽限 ⇒ kill+reload")
  assert.equal(h.calls.reload, 1)
  assert.deepEqual(h.scenes()[0].actions.map((a) => a.type), ["unresponsive", "reload"])
})

test("⑦ 冻结自复 + 快照三点", async () => {
  // (a) responsive ≤ 宽限 ⇒ 不杀 + post-freeze 取（D8-2）
  const a = makeHarness()
  const watchA = createHeapWatch({ ...a.inject })
  watchA.onUnresponsive()
  watchA.onResponsive()
  await flush()
  assert.equal(a.calls.kill, 0, "自复 ⇒ 零动刀")
  assert.equal(a.calls.reload, 0)
  assert.equal(a.calls.snapshot.length, 1)
  assert.equal(a.calls.snapshot[0].kind, "post-freeze")
  const sceneA = a.scenes()[0]
  assert.deepEqual(sceneA.actions.map((x) => x.type), ["unresponsive", "responsive"])
  assert.equal(typeof sceneA.snapshot.path, "string")
  assert.ok(Number.isFinite(sceneA.snapshot.at), "快照记录带时刻（actions 口径同拍）")
  // (b) ping 复通（宽限到期复查）⇒ 同自复径
  const b = makeHarness()
  const queue = [false, false, true]
  const watchB = createHeapWatch({ ...b.inject, ping: async () => queue.shift() ?? true })
  await watchB.checkNow() // 填最近读数（非快照径）
  b.pingTick()
  await flush()
  b.pingTick()
  await flush()
  assert.equal(b.scenes().length, 1)
  b.fireTimeout()
  await flush()
  assert.equal(b.calls.kill, 0, "ping 复通 ⇒ 不杀")
  assert.equal(b.calls.snapshot.length, 1)
  assert.equal(b.calls.snapshot[0].kind, "post-freeze")
  // (c) 体积门（上限 2500MB——父裁 2026-09-30）：超阈 ⇒ 跳过 + 记录
  const c = makeHarness()
  c.inject.sample = () => reading(0.2, 2600)
  const watchC = createHeapWatch({ ...c.inject })
  await watchC.checkNow()
  watchC.onUnresponsive()
  watchC.onResponsive()
  await flush()
  assert.equal(c.calls.snapshot.length, 0, "over-cap ⇒ 零取")
  assert.equal(c.scenes()[0].snapshot.skipped, "over-cap")
  assert.ok(c.calls.logs.some((line) => line.includes("over-cap")), "跳过必须记录（warn 行）")
})

test("⑧ once ∕ 5min 守卫", async () => {
  const h = makeHarness()
  const watch = createHeapWatch({ ...h.inject })
  watch.onUnresponsive()
  h.fireTimeout()
  await flush()
  assert.equal(h.calls.kill, 1, "首冻动刀")
  watch.onGone({ reason: "killed" }) // 预期杀收束（放行下一 episode）
  h.advance(60_000)
  watch.onUnresponsive() // 5min 窗内再冻
  assert.equal(h.scenes().length, 2, "新 episode 新现场")
  h.fireTimeout()
  await flush()
  assert.equal(h.calls.kill, 1, "5min 守卫：窗内跳过")
  const second = h.scenes().find((scene) => scene.at !== h.scenes()[0].at)
  const reloadAction = second.actions.find((action) => action.type === "reload")
  assert.equal(reloadAction.skipped, true, "跳过 + 记录")
  assert.equal(reloadAction.reason, "min-interval")
  h.advance(5 * 60_000)
  watch.onUnresponsive()
  h.fireTimeout()
  await flush()
  assert.equal(h.calls.kill, 2, "窗过 ⇒ 放行")
  // 独立 render-process-gone 分支（无 episode ⇒ 落现场）∥ clean-exit ⇒ 零现场
  const g = makeHarness()
  const watchG = createHeapWatch({ ...g.inject })
  watchG.onGone({ reason: "clean-exit" })
  assert.equal(g.scenes().length, 0, "clean-exit ⇒ 零现场")
  watchG.onGone({ reason: "crashed" })
  assert.equal(g.scenes().length, 1, "独立崩 ⇒ 落现场")
  assert.equal(g.scenes()[0].trigger, "render-process-gone")
  assert.deepEqual(g.scenes()[0].actions.map((a) => a.type), ["gone"])
})

test("⑨ D9 补启：boot 尾 —— cwd 非空 ⇒ 恰一次 session:resume；空 ∥ 缺 ⇒ 零触发；拒径不抛", async () => {
  // 假 DOM + 假窄桥装载**真** `renderer/app.mjs`（装法沿 `b10-probe-appdom.mjs` ∕ parity-b10 T5 件先例）；
  // `DOMContentLoaded` 回调直驱 = `boot()`。假宽桥只记通道名 + 计数（`session:resume` / `history:page`）。
  const makeEl = () => ({
    dataset: {}, style: {}, hidden: false, textContent: "",
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null },
    append() {}, appendChild() {}, remove() {}, removeChild() {},
    addEventListener() {}, removeEventListener() {},
    querySelector() { return null }, querySelectorAll() { return [] },
    classList: { add() {}, remove() {}, contains() { return false } },
    children: [], childNodes: [], firstChild: null, parentNode: null,
    focus() {}, blur() {}, setSelectionRange() {}, scrollTo() {},
  })
  const dom = { listeners: {}, gate: makeEl(), reason: makeEl() }
  globalThis.document = {
    documentElement: makeEl(), body: makeEl(), head: makeEl(),
    addEventListener(type, fn) { (dom.listeners[type] ??= []).push(fn) },
    removeEventListener() {},
    querySelector() { return null }, querySelectorAll() { return [] },
    getElementById(id) { return id === "boot-gate" ? dom.gate : id === "boot-reason" ? dom.reason : null },
    createElement() { return makeEl() }, createTextNode() { return makeEl() }, createDocumentFragment() { return makeEl() },
  }
  globalThis.window = globalThis
  globalThis.requestAnimationFrame = () => 0 // 帧面桩：mark 可挂起 —— 帧体不跑（五面 paint 零触）
  const calls = { names: [], resume: 0, history: 0 }
  let projectReceipt = { cwd: null, recent: [] }
  let resumeRejects = false
  globalThis.thincoder = {
    invoke: async (channel) => {
      calls.names.push(channel)
      if (channel === "config:read") return { config: {}, locale: "en", dict: {}, configured: true }
      if (channel === "project:recent") return projectReceipt
      if (channel === "sessions:list") return { sessions: [] }
      if (channel === "session:resume") {
        calls.resume += 1
        if (resumeRejects) throw new Error("resume-boom")
        return { ok: true, reason: null, cwd: projectReceipt.cwd, slot: 0 }
      }
      if (channel === "history:page") {
        calls.history += 1
        return { ok: true, messages: [], hasOlder: false, next: null, meta: {}, flags: [], queue: [] }
      }
      return {}
    },
  }
  const settle = async () => { for (let i = 0; i < 8; i += 1) await new Promise((done) => setImmediate(done)) }
  const realSetInterval = globalThis.setInterval
  const realClearInterval = globalThis.clearInterval
  globalThis.setInterval = () => 0 // 1s 拍生命周期桩（用例进程零持活句柄）
  globalThis.clearInterval = () => {}
  try {
    await import(pathToFileURL(APP_PATH).href) // 真 app.mjs（假 DOM —— 装配面不静默起火）
  } finally {
    globalThis.setInterval = realSetInterval
    globalThis.clearInterval = realClearInterval
  }
  const boot = dom.listeners["DOMContentLoaded"]?.[0]
  assert.equal(typeof boot, "function", "引导回调已注册（DOMContentLoaded）")

  // ① 重载态（cwd 非空串）⇒ 恰一次 resume + 开页 + boot ok
  projectReceipt = { cwd: "C:/fixture/project", recent: [] }
  calls.names = []
  calls.resume = 0
  calls.history = 0
  await boot()
  await settle()
  assert.equal(calls.resume, 1, "cwd 非空 ⇒ 恰一次 session:resume")
  assert.ok(calls.names.indexOf("session:resume") > calls.names.indexOf("project:recent"), "补启在 refreshRail 读面之后")
  assert.ok(calls.history >= 1, "resume 经 openResult ⇒ 开页（history:page 读）")
  assert.equal(globalThis.document.documentElement.dataset.boot, "ok")

  // ② 冷启（cwd null）⇒ 零触发（行为零变）
  projectReceipt = { cwd: null, recent: [] }
  calls.names = []
  calls.resume = 0
  calls.history = 0
  await boot()
  await settle()
  assert.equal(calls.resume, 0, "cwd 缺 ⇒ 零触发")
  assert.equal(calls.history, 0, "零开页")
  assert.equal(globalThis.document.documentElement.dataset.boot, "ok")

  // ③ 空串 cwd ⇒ 零触发（判据 = 非空串）
  projectReceipt = { cwd: "", recent: [] }
  calls.resume = 0
  await boot()
  await settle()
  assert.equal(calls.resume, 0, "空串 ⇒ 零触发")
  assert.equal(globalThis.document.documentElement.dataset.boot, "ok")

  // ④ resume 拒径 ⇒ 恰一次尝试 + boot 仍 ok（不抛 ∥ 不抬高 boot 判据；失败面 = 既有 R9 toast）
  projectReceipt = { cwd: "C:/fixture/project", recent: [] }
  resumeRejects = true
  calls.resume = 0
  await boot()
  await settle()
  assert.equal(calls.resume, 1, "拒径 = 恰一次尝试")
  assert.equal(globalThis.document.documentElement.dataset.boot, "ok", "失败不抬高 boot 判据")
  resumeRejects = false
})

test("⑩ E4-JS 段界 ∥ 窗计划 ∥ 步进预算（纯函数）", () => {
  assert.equal(seg.SEGMENT_CHARS, 12_000, "段 = 12K 渲染字符")
  assert.equal(seg.SEGMENT_ENTER_CHARS, 24_000, "进段阈值 = 24K")
  assert.equal(seg.SEGMENT_PAD, 1, "窗 = 视口段 ±1")
  assert.equal(seg.segmentCount(0), 1, "空文 ⇒ 1 段")
  assert.equal(seg.segmentCount(24_000), 2)
  assert.equal(seg.segmentCount(24_001), 3, "> 2×段 ⇒ 进第三段")
  assert.equal(seg.segmentCount(606_208), 51, "巨块 fixture ⇒ 51 段")
  const bounds = seg.segmentBounds(24_001)
  assert.deepEqual(bounds, [
    { start: 0, end: 12_000 }, { start: 12_000, end: 24_000 }, { start: 24_000, end: 24_001 },
  ])
  assert.equal(bounds.reduce((sum, item) => sum + (item.end - item.start), 0), 24_001, "逐段拼接 ≡ 全体（G2）")
  assert.equal(seg.segmentIndexOf(11_999, 606_208), 0)
  assert.equal(seg.segmentIndexOf(12_000, 606_208), 1)
  assert.equal(seg.segmentIndexOf(606_207, 606_208), 50)
  assert.deepEqual(seg.headWindow(51), { first: 0, last: 1 })
  assert.deepEqual(seg.tailWindow(51), { first: 49, last: 50 }, "底窗 = 末 1+ 垫")
  assert.deepEqual(seg.tailWindow(1), { first: 0, last: 0 })
  assert.deepEqual(seg.padWindow({ viewFirst: 10, viewLast: 10 }, 51), { first: 9, last: 11 })
  assert.deepEqual(seg.padWindow({ viewFirst: 0, viewLast: 50 }, 51), { first: 0, last: 50 }, "夹取")
  let window = seg.headWindow(51)
  let steps = 0
  for (;;) {
    const before = window
    window = seg.stepWindow(window, seg.tailWindow(51), 51)
    const delta = seg.windowDelta(before, window, 51)
    assert.ok(delta.hides.length + delta.shows.length <= 2, `每帧段状态变更 ≤2（第 ${steps} 步）`)
    steps += 1
    assert.ok(steps < 100, "远跳有界收敛（渐进）")
    if (window.first === 49 && window.last === 50) break
  }
  assert.ok(steps >= 48, `渐进收敛步数 = 距离（${steps}）`)
  const cut = seg.budgetChanges([3, 4], [8, 9])
  assert.deepEqual(cut, { hides: [3], shows: [8], dropped: 2 }, "预算削减：挂 ∥ 卸各至多一")
  assert.equal(seg.budgetChanges([], []).dropped, 0)
})

test("⑪ E4-JS 补偿算式（纯 —— 锚上净变）", () => {
  const above = { top: 0, height: 100 }
  const half = { top: 150, height: 100 }
  const below = { top: 300, height: 100 }
  assert.equal(seg.aboveHeight(above, 200), 100)
  assert.equal(seg.aboveHeight(half, 200), 50, "跨界 ⇒ 只计锚上部分")
  assert.equal(seg.aboveHeight(below, 200), 0, "锚下变更零补偿")
  assert.equal(seg.aboveHeight(null, 200), 0, "缺件零假造")
  assert.equal(seg.compensateSegments({ anchorTop: 200, hides: [above], shows: [] }), -100, "卸上 ⇒ scrollTop -= h")
  assert.equal(seg.compensateSegments({ anchorTop: 200, hides: [], shows: [above] }), 100, "挂上 ⇒ scrollTop += h")
  assert.equal(seg.compensateSegments({ anchorTop: 200, hides: [below], shows: [below] }), 0)
  assert.equal(seg.compensateSegments({ anchorTop: 200, hides: [above], shows: [above] }), 0, "净变零")
  // 段序版（内容序 —— 本轮实证修正）：锚前段 ⇒ 全高（写后屏位跨锚时屏面部分量会欠补偿）
  assert.equal(seg.aboveOf({ seg: 2, rect: { top: -100, height: 500 } }, 5, 0), 500, "锚前段 ⇒ 全高")
  assert.equal(seg.aboveOf({ seg: 7, rect: { top: 300, height: 500 } }, 5, 0), 0, "锚后段 ⇒ 零")
  assert.equal(seg.aboveOf({ seg: 5, rect: { top: -100, height: 500 } }, 5, 0), 100, "同段 ⇒ 屏面部分量")
  assert.equal(seg.aboveOf({ seg: 2, rect: null }, 5, 0), 0, "缺矩形零假造")
  assert.equal(seg.segmentShift({ anchorSeg: 5, anchorTop: 0, hides: [{ seg: 3, rect: { top: -900, height: 900 } }] }), -900, "卸上 ⇒ -全高")
  assert.equal(seg.segmentShift({ anchorSeg: 5, anchorTop: 0, shows: [{ seg: 4, rect: { top: -400, height: 400 } }] }), 400, "挂上 ⇒ +全高")
  assert.equal(seg.segmentShift({ anchorSeg: 5, anchorTop: 0, hides: [{ seg: 9, rect: { top: 100, height: 400 } }] }), 0, "锚下零补偿")
})

test("⑫ E4-JS 进段阈值 ∥ 回滚三形（常量 ∥ 测试缝 ∥ 面退段）", () => {
  assert.equal(seg.SEGMENT_MOUNT, true, "回滚形①：常量开关在册（false ⇒ 零分区 = 整块直挂）")
  assert.equal(seg.giantPrefilter({ text: "x".repeat(24_000) }), false, "阈值：恰 24K ⇒ 不分段")
  assert.equal(seg.giantPrefilter({ text: "x".repeat(24_001) }), true, "阈值：> 24K ⇒ 进分段")
  assert.equal(seg.giantPrefilter({ text: "x".repeat(30_000), kind: "reasoning" }), false, "reasoning 面本期零启用")
  assert.equal(seg.giantPrefilter(null), false, "缺件零假造")
  // 回滚形③（测试缝）：关态 ⇒ 零分区 ∥ 零窗（不触 DOM）
  seg.setSegmentMount(false)
  assert.equal(seg.segmentMountActive(), false)
  const blind = { querySelector() { throw new Error("must-not-touch") }, querySelectorAll() { throw new Error("must-not-touch") } }
  assert.equal(seg.mountSegments(blind, { text: "x".repeat(30_000) }, true), null, "关态 ⇒ 零分区（零 DOM 触）")
  assert.equal(seg.mountSegmentWindows(blind, {}, new Map()), 0, "关态 ⇒ 零初窗（零 DOM 触）")
  assert.equal(seg.segmentViewStep(blind, { following: true }, [{ block: { text: "x".repeat(30_000) } }]).faces, 0, "关态 ⇒ 零帧步（零 DOM 触）")
  seg.setSegmentMount(true)
  assert.equal(seg.segmentMountActive(), true, "缝可复原")
  // 回滚形②（自动回退）：分区抛错 ⇒ 该面退段 + 记错（不抛 ∥ 不全量放行 = null）
  const errors = []
  const realError = console.error
  console.error = (...args) => errors.push(args)
  try {
    const root = { nodeType: 3, data: "x".repeat(30_000), splitText() { throw new Error("boom") } }
    const face = {
      ownerDocument: { createElement() { throw new Error("boom") } },
      childNodes: [root], firstChild: root,
      getAttribute: () => "x".repeat(30_000), querySelectorAll: () => [], contains: () => true,
    }
    assert.equal(seg.mountSegments({ querySelector: () => face }, { text: "x".repeat(30_000) }, true), null, "抛错 ⇒ 退段（null，不抛）")
    assert.equal(errors.length, 1, "退段必须记错（warn 面）")
  } finally {
    console.error = realError
  }
})
