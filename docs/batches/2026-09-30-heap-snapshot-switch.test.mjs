/**
 * 2026-09-30-heap-snapshot-switch.test.mjs — 采集收网批 · 单元腿（批内件——随批档命名，不入仓套件；
 * 假源注入缝 + 平 node 直测）。首落 `.thincoder/tmp/`（跨批护栏挡 `docs/batches/*.test.mjs` 直写）⇒
 * 父侧收位 `docs/batches/` 同名件——两层深相对路径与终位一致（先例 = 2026-09-30-desktop-heap-freeze）。
 * 覆盖（验收单源 = 批档 `docs/batches/2026-09-30-heap-snapshot-switch.md` §2 三/四/五——A1–A4）：
 *   T1 基线取 ∥ T2 关后阈值零取 ∥ T3 关→开当拍恢复取（关态不占 once 位）∥ T4 同值幂等（零 arm ∥ 零日志）
 *   T5 `false→true` 补装臂恰一次（armDone 闸）∥ T6 heapWatch 关 ⇒ 零 arm（运行期开快照键亦零 arm）
 *   T7 过渡日志逐字 ∥ T8 关时冻结自复零取（`skipped:"disabled"` 记录）∥ T9 main.mjs 读抛径源扫
 *   A2 /config 切换面（ctx mock——菜单 ∥ 确认行逐字 ∥ 显式写布尔 ∥ Esc/异常负腿）∥ A3 默认腿（沙箱 config）
 *   A4 判定形结构扫（bin ∥ main.mjs 在场 ∥ `node --check` 五源档）
 * 跑法：`node --test docs/batches/2026-09-30-heap-snapshot-switch.test.mjs`（落位前 tmp 同跑）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const HEAP_WATCH = join(REPO, "thincoder-desktop", "src", "main", "heap-watch.mjs")
const MAIN_MJS = join(REPO, "thincoder-desktop", "src", "main", "main.mjs")
const CORE_CONFIG = join(REPO, "thincoder-core", "config.mjs")
const BIN_MJS = join(REPO, "thincoder-cli", "bin", "thincoder.mjs")
const CMD_CONFIG = join(REPO, "thincoder-cli", "src", "tui", "cmd-config.mjs")
const { createHeapWatch } = await import(pathToFileURL(HEAP_WATCH).href)
const coreConfig = await import(pathToFileURL(CORE_CONFIG).href)
const { handleConfigCommand } = await import(pathToFileURL(CMD_CONFIG).href)

const flush = async () => { for (let i = 0; i < 4; i += 1) await new Promise((done) => setTimeout(done, 0)) }
const reading = (ratio, wsMb) => ({
  main: { heapUsed: ratio * 4.2e9, heapLimit: 4.2e9 },
  processes: [{ type: "Tab", pid: 77, workingSetMb: wsMb }],
})
const readScenes = (dir) => (existsSync(dir)
  ? readdirSync(dir).sort().map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")))
  : [])

/** 假源夹具：假时钟 ∕ 假定时器 ∥ 记录式注入（arm ∕ snapshot ∕ log）∥ 真盘现场（tmp）。 */
function makeHarness() {
  const base = mkdtempSync(join(tmpdir(), "hs-switch-"))
  const calls = { arm: [], snapshot: [], logs: [] }
  const intervals = new Map()
  const timeouts = new Map()
  let clock = 1_000_000
  let seq = 0
  const inject = {
    sceneDir: join(base, "crash-reports"),
    now: () => clock,
    timer: (cb, ms) => { const h = { id: ++seq, cb, ms }; intervals.set(h.id, h); return h },
    clearTimer: (h) => intervals.delete(h?.id),
    setTimer: (cb, ms) => { const h = { id: ++seq, cb, ms }; timeouts.set(h.id, h); return h },
    clearSetTimer: (h) => timeouts.delete(h?.id),
    sample: () => reading(0.2, 100),
    armMainSnapshot: (n) => calls.arm.push(n),
    snapshot: async ({ kind, path }) => { calls.snapshot.push({ kind, path }); return { path } },
    log: (line) => calls.logs.push(line),
    ping: async () => true,
  }
  return { base, calls, intervals, timeouts, inject, advance: (ms) => { clock += ms } }
}

test("T1 基线取：默认开 ⇒ 阈值拍取（开机臂恰一次）", async () => {
  const h = makeHarness()
  let ws = 100
  const watch = createHeapWatch({ ...h.inject, sample: () => reading(0.2, ws) })
  assert.equal(typeof watch.setSnapshotEnabled, "function", "运行期句柄在场")
  assert.deepEqual(h.calls.arm, [1], "开机 armMainSnapshot(1) 恰一次")
  assert.deepEqual(await watch.checkNow(), [], "低读数零取")
  ws = 850
  const lines = await watch.checkNow()
  assert.equal(h.calls.snapshot.length, 1, "基线：阈值拍取快照")
  assert.equal(h.calls.snapshot[0].kind, "threshold")
  assert.match(lines.at(-1), /threshold hit/)
  watch.stop()
})

test("T2 关后阈值零取：运行期关 ⇒ 零取（warn 面不受影响）", async () => {
  const h = makeHarness()
  const watch = createHeapWatch({ ...h.inject, sample: () => reading(0.9, 900) })
  watch.setSnapshotEnabled(false)
  const lines = await watch.checkNow()
  assert.equal(h.calls.snapshot.length, 0, "关 ⇒ 零取")
  assert.equal(lines.length, 2, "warn 双档照出（快照门只管快照）")
  assert.ok(lines.every((line) => line.includes("warning")))
  watch.stop()
})

test("T3 关→开当拍恢复取：关态不占 once 位", async () => {
  const h = makeHarness()
  const watch = createHeapWatch({ ...h.inject, sample: () => reading(0.2, 850) })
  watch.setSnapshotEnabled(false)
  await watch.checkNow()
  assert.equal(h.calls.snapshot.length, 0, "关态压力在场零取")
  watch.setSnapshotEnabled(true)
  await watch.checkNow()
  assert.equal(h.calls.snapshot.length, 1, "再开当拍即取（关态未占 once 位）")
  assert.equal(h.calls.snapshot[0].kind, "threshold")
  watch.stop()
})

test("T4 同值幂等：零 arm ∥ 零日志", async () => {
  const h = makeHarness()
  const watch = createHeapWatch({ ...h.inject })
  watch.setSnapshotEnabled(true) // 与初始同值（默认开）
  assert.equal(h.calls.logs.length, 0, "同值 ⇒ 零日志")
  assert.deepEqual(h.calls.arm, [1], "同值 ⇒ 零 arm（仅开机一次）")
  watch.setSnapshotEnabled(false)
  assert.equal(h.calls.logs.length, 1, "过渡 ⇒ 恰一行")
  watch.setSnapshotEnabled(false)
  assert.equal(h.calls.logs.length, 1, "重复同值 ⇒ 零新增")
  assert.deepEqual(h.calls.arm, [1])
  watch.stop()
})

test("T5 false→true 补装臂恰一次（armDone 闸）", async () => {
  const h = makeHarness()
  const watch = createHeapWatch({ ...h.inject, snapshotEnabled: false })
  assert.deepEqual(h.calls.arm, [], "初始关 ⇒ 零 arm")
  watch.setSnapshotEnabled(true)
  assert.deepEqual(h.calls.arm, [1], "补装恰一次")
  watch.setSnapshotEnabled(false)
  watch.setSnapshotEnabled(true)
  assert.deepEqual(h.calls.arm, [1], "armDone 闸：再开不重装（Node 一次性 API）")
  watch.stop()
})

test("T6 heapWatch 关 ⇒ 零 arm（运行期开快照键亦零 arm）", async () => {
  const h = makeHarness()
  const watch = createHeapWatch({ ...h.inject, enabled: false }) // snapshotEnabled 默认 true
  assert.deepEqual(h.calls.arm, [], "关 ⇒ 开机零 arm")
  assert.equal(h.intervals.size, 0, "关 ⇒ 零定时器")
  watch.setSnapshotEnabled(false)
  watch.setSnapshotEnabled(true)
  assert.deepEqual(h.calls.arm, [], "运行期开快照键亦零 arm（补装门 armed ∧ ¬armDone）")
  watch.stop()
})

test("T7 过渡日志逐字", async () => {
  const h = makeHarness()
  const watch = createHeapWatch({ ...h.inject })
  watch.setSnapshotEnabled(false)
  watch.setSnapshotEnabled(true)
  assert.deepEqual(h.calls.logs, [
    "[heap] snapshot collection disabled (runtime)",
    "[heap] snapshot collection enabled (runtime)",
  ])
  watch.stop()
})

test("T8 关时冻结自复零取（skipped:\"disabled\" 记录）", async () => {
  const h = makeHarness()
  const watch = createHeapWatch({ ...h.inject, snapshotEnabled: false })
  watch.onUnresponsive()
  watch.onResponsive()
  await flush()
  assert.equal(h.calls.snapshot.length, 0, "关 ⇒ 冻结自复零取")
  const scene = readScenes(h.inject.sceneDir)[0]
  assert.equal(scene.snapshot.kind, "post-freeze")
  assert.equal(scene.snapshot.skipped, "disabled", "记录 = skipped:disabled")
  h.advance(1_000)
  watch.setSnapshotEnabled(true)
  watch.onUnresponsive()
  watch.onResponsive()
  await flush()
  assert.equal(h.calls.snapshot.length, 1, "开 ⇒ 同径取（对照）")
  assert.equal(h.calls.snapshot[0].kind, "post-freeze")
  watch.stop()
})

test("T9 main.mjs 读抛径源扫：catch 在场 ∧ console.error 零静默 ∧ 谓词 === true", () => {
  const src = readFileSync(MAIN_MJS, "utf8")
  const lines = src.split(/\r?\n/)
  const readIdxs = lines.map((line, i) => (line.includes("loadConfig()?.diagnostics") ? i : -1)).filter((i) => i >= 0)
  assert.ok(readIdxs.length >= 1, "读区块在场（loadConfig()?.diagnostics）")
  for (const i of readIdxs) {
    const window = lines.slice(i, i + 5).join("\n")
    assert.match(window, /catch/, `读区块 :${i + 1} catch 在场（读抛被捕获）`)
    assert.match(window, /console\.error/, `读区块 :${i + 1} 告警行 console.error（零静默）`)
  }
  assert.ok(lines.some((line) => /heapWatch\.setSnapshotEnabled\(d\.heapSnapshot === true\)/.test(line)), "落值谓词 === true（读抛 ⇒ 关——fail-closed）")
  assert.ok(!src.includes("heapSnapshot !== false"), "旧判定形（!== false）已退场")
})

/** ctx mock（沿 cmd-config-effort 先例）：首轮 picker 回指定项（null ⇒ Esc）；persistRaw 记录型（可置抛）。 */
function makeCmdCtx({ diagnostics, pick = "diagnostics.heapSnapshot", persistThrows = false } = {}) {
  const lines = []
  const writes = []
  const menu = []
  let call = 0
  const agent = {
    config: { agent: {}, embedding: {}, traces: {}, diagnostics },
    providers: [], activeProvider: "", activeModel: null, provider: {},
  }
  const ctx = {
    agent,
    pushLine: (text) => lines.push(text),
    pushLabel: () => {},
    maskKey: () => "****",
    pickModelForSlot: async () => null,
    askQuestion: async () => "",
    persistRaw: async (mutate) => {
      if (persistThrows) throw new Error("disk-write-refused")
      const raw = { diagnostics: { heapWatch: false } } // 族内他键（保留判据的探针）
      mutate(raw)
      writes.push(raw)
    },
    showPicker: async (_title, entries) => {
      call += 1
      if (call === 1) {
        menu.push(...entries)
        return pick === null ? null : (entries.find((e) => e.action === pick) ?? null)
      }
      return null // 第二轮 = Esc 退出
    },
  }
  return { ctx, lines, writes, menu }
}

test("A2 切换面腿：菜单 ∥ 确认行逐字 ∥ 显式写布尔 ∥ 族内他键保留", async () => {
  const base = mkdtempSync(join(tmpdir(), "hs-cmdcfg-"))
  coreConfig._setConfigPathForTest(join(base, "config.json"))
  try {
    // ① 关态（缺省 / 非 true 显示判定）：菜单 off ∥ 选择 ⇒ 写 true + 确认行
    const off = makeCmdCtx({ diagnostics: { heapWatch: true } })
    await handleConfigCommand(off.ctx)
    const item = off.menu.find((e) => e.action === "diagnostics.heapSnapshot")
    assert.equal(item?.text, "diagnostics.heapSnapshot = off（堆快照采集——默认关——桌面会话即时生效）", "菜单文案逐字（off）")
    assert.equal(off.writes.length, 1, "恰一次写")
    assert.deepEqual(off.writes[0].diagnostics, { heapWatch: false, heapSnapshot: true }, "显式布尔 + 族内他键保留")
    assert.ok(off.lines.includes("diagnostics.heapSnapshot = on（桌面会话即时生效 ∕ 本进程下次启动）"), "确认行文案逐字（on）")
    // ② 开态：菜单 on ∥ 选择 ⇒ 写 false
    const on = makeCmdCtx({ diagnostics: { heapSnapshot: true } })
    await handleConfigCommand(on.ctx)
    const item2 = on.menu.find((e) => e.action === "diagnostics.heapSnapshot")
    assert.equal(item2?.text, "diagnostics.heapSnapshot = on（堆快照采集——默认关——桌面会话即时生效）", "菜单文案逐字（on）")
    assert.deepEqual(on.writes[0].diagnostics, { heapWatch: false, heapSnapshot: false }, "on ⇒ off（显式布尔）")
    assert.ok(on.lines.includes("diagnostics.heapSnapshot = off（桌面会话即时生效 ∕ 本进程下次启动）"), "确认行文案逐字（off）")
    // ③ View 行（同拍——`traces.retentionHours` 邻位）
    const view = makeCmdCtx({ diagnostics: { heapSnapshot: true }, pick: "view" })
    await handleConfigCommand(view.ctx)
    assert.ok(view.lines.includes("diagnostics.heapSnapshot: on（堆快照采集——默认关——桌面会话即时生效）"), "View 行在场（on）")
  } finally {
    coreConfig._resetConfigPathForTest()
  }
})

test("A2 负腿：Esc ∥ 保存异常 ⇒ 零净写", async () => {
  const base = mkdtempSync(join(tmpdir(), "hs-cmdcfg-neg-"))
  coreConfig._setConfigPathForTest(join(base, "config.json"))
  try {
    const esc = makeCmdCtx({ diagnostics: {}, pick: null })
    await handleConfigCommand(esc.ctx)
    assert.equal(esc.writes.length, 0, "Esc ⇒ 零写")
    const boom = makeCmdCtx({ diagnostics: {}, persistThrows: true })
    await handleConfigCommand(boom.ctx)
    assert.equal(boom.writes.length, 0, "异常 ⇒ 零净写")
    assert.ok(boom.lines.some((line) => line.startsWith("Save failed:")), "失败面可见（不静默）")
  } finally {
    coreConfig._resetConfigPathForTest()
  }
})

test("A3 默认腿：空 config ⇒ 快照关（watch 开）∥ 显式 true 保留 ∥ 非布尔回退 false", async () => {
  const base = mkdtempSync(join(tmpdir(), "hs-default-"))
  const cfgPath = join(base, "config.json")
  coreConfig._setConfigPathForTest(cfgPath)
  try {
    assert.deepEqual(coreConfig.loadConfig().diagnostics, { heapWatch: true, heapSnapshot: false }, "空 config ⇒ 两键默认（watch 开 ∥ 快照关）")
    writeFileSync(cfgPath, JSON.stringify({ diagnostics: { heapSnapshot: true } }))
    assert.equal(coreConfig.loadConfig().diagnostics.heapSnapshot, true, "存量显式 true 保留（零迁移）")
    writeFileSync(cfgPath, JSON.stringify({ diagnostics: { heapSnapshot: "yes" } }))
    assert.equal(coreConfig.loadConfig().diagnostics.heapSnapshot, false, "非布尔 ⇒ 回退默认 false")
    writeFileSync(cfgPath, JSON.stringify({ diagnostics: { heapSnapshot: false, heapWatch: false } }))
    const both = coreConfig.loadConfig().diagnostics
    assert.deepEqual(both, { heapWatch: false, heapSnapshot: false }, "显式 false 保留（两键各自判定）")
  } finally {
    coreConfig._resetConfigPathForTest()
  }
})

test("A4 判定形腿（结构扫）：bin ∥ main.mjs 在场 ∥ node --check 五源档", () => {
  const bin = readFileSync(BIN_MJS, "utf8")
  assert.match(bin, /prepareCrashReporting\(\{ heapSnapshot: _diagnostics\.heapSnapshot === true \}\)/, "bin：快照键判定形 === true（fail-closed）")
  assert.match(bin, /startHeapWatch\(\{ enabled: _diagnostics\.heapWatch !== false \}\)/, "bin：watch 键判定形 !== false（默认开——零改）")
  const main = readFileSync(MAIN_MJS, "utf8")
  assert.match(main, /onConfigSelfWrite\(\(\) => syncHeapSnapshot\(\)\)/, "main：核自写订阅（源②）在场")
  assert.match(main, /snapshotEnabled: diagnostics\.heapSnapshot === true/, "main：启动判定形 === true")
  const watchIdx = main.indexOf("startConfigWatch(")
  const watchSeg = main.slice(watchIdx, watchIdx + 240)
  assert.ok(watchIdx >= 0 && watchSeg.includes('emit("ev:config"') && watchSeg.includes("syncHeapSnapshot()"), "main：onChange 同拍 sync（与 ev:config 出站并列）")
  const closedIdx = main.indexOf('win.on("closed"')
  const closedSeg = main.slice(closedIdx, closedIdx + 240)
  assert.ok(closedIdx >= 0 && closedSeg.includes("configWatch.dispose()") && closedSeg.includes("unsubscribeSelfWrite()"), "main：退订随窗口 closed（与 dispose 同点）")
  for (const file of [HEAP_WATCH, MAIN_MJS, CORE_CONFIG, BIN_MJS, CMD_CONFIG]) {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" })
  }
})
