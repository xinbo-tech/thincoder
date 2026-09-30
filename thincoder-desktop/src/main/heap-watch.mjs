/**
 * heap-watch.mjs — 桌面堆遥测与冻结取证（KD-53 ∕ 批档 §2.11 D7–D9 · 2026-09-30 · 台账 #694）。
 * 四缝合件：① 采样（60s ∕ 双档 70% ∕ 85%——CLI 同值；warn 行带**进程标签**）② 快照（阈值取 ∕ 冻结
 * 自复取两径 + 主进程近上限武装；once + 体积门〔上限 2500MB——超阈跳过 + 记录，父裁 2026-09-30〕）
 * ③ 现场（`~/.thincoder/crash-reports/` JSON——与 CLI 同目录契约）④ 冻结门与恢复动作（`unresponsive`
 * ∕ ping 兜底 ∥ `render-process-gone`；宽限 15s ⇒ `forcefullyCrashRenderer()` + `reload()`）。
 * **隔离形（禁令）= 策略面零 `electron` 顶层 import**：electron 原语全经注入缝（`sample` ∕ `snapshot`
 * ∕ `log` 三缝 + `ping` ∕ `killRenderer` ∕ `reload` 冻结 ∕ 恢复动作原语）；装配住 `src/main/main.mjs`
 * （先例 = KD-35 `notify.mjs`）⇒ 本档平 node 可 import 直测。
 * 键面：`diagnostics.heapWatch`（武装门——开机单读；关 ⇒ 零采样 ∕ 零快照 ∕ 零现场，唯运行期过渡行照记）· `diagnostics.heapSnapshot`（快照门——
 * 默认关〔fail-closed〕；桌面端运行期热读——装配面两源调用句柄 `setSnapshotEnabled` 应用；关 ⇒ 零快照，
 * 冻结门 ∕ 恢复动作不受影响）。
 * purge 核对（实施期，2026-09-30）：CLI `crash-reports.mjs` 四模式（`crash-*` ∕ `report.*` ∕ `tui-stderr-*` ∕ `Heap.*`）
 * 不含 `desktop-freeze-*.json`（且不得冒充 `crash-*`——会误触 CLI「上次运行异常终止」提示）⇒ 本档按**同策**（30 天）
 * 自清：现场 = 自名族；快照 = 与 CLI 同式 `/^Heap\..+\.heapsnapshot$/`（覆盖自名 ∥ 主臂 V8 名）。
 * 纪律：全步尽力面（写盘 ∕ 探针 ∕ 动作失败不阻断宿主；失败不静默——stderr `[heap]` 行 + warn 行同走核事件
 * 日志 `logEvent`（CLI 同径；核件内建测试隔离）；`ping` 注入视为**已含超时**的探针（超时常量 = `PING_TIMEOUT_MS`）。
 */
import { mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import * as v8 from "node:v8"
import { configDir } from "@thincoder/core/config.mjs"
import { logEvent } from "@thincoder/core/log.mjs"

export const SAMPLE_INTERVAL_MS = 60_000
export const HEAP_RATIOS = Object.freeze([0.7, 0.85]) // 与 CLI 同值（thincoder-cli/src/heap-watch.mjs:43）
export const RENDERER_WORKING_SET_MB = 800 // 发现 3 定值（两冻结案下沿 933MB × 0.85 ⇒ 圆整）
export const SNAPSHOT_VOLUME_CAP_MB = 2500 // 体积门（上限——超阈跳过 + 记录；父裁 2026-09-30）
export const FREEZE_GRACE_MS = 15_000 // D9 宽限
export const RELOAD_MIN_GAP_MS = 5 * 60_000 // D9 两次自动 reload 最小间隔（防循环）
const GONE_SETTLE_MS = 5_000 // 落刀后等 `render-process-gone` 收束的兜底窗（真机实测：事件 ms 级到达）
export const PING_INTERVAL_MS = 15_000 // D7 兜底（§2.14-D 检测提速收正：30s ⇒ 15s；超时 ∥ 连超阈不变）
export const PING_TIMEOUT_MS = 8_000 // D7（装配侧竞速用值）
export const PING_TIMEOUT_STREAK = 2 // D7 连续 2 次超时 ⇒ 冻结判定
export const SCENE_RETENTION_MS = 30 * 24 * 3_600_000 // 30 天（与 CLI purge 同策）
const SCENE_PREFIX = "desktop-freeze-" // 现场 JSON 名族（本档自清）
const SNAPSHOT_PREFIX = "Heap.desktop." // 渲染快照名族（命 CLI 正则 + 本档自清）
/** 渲染面识别（Electron `getAppMetrics()` 词汇 = `"Tab"`——真机实测 2026-09-30；`"renderer"` = 注入假源词汇）。 */
const RENDERER_TYPES = new Set(["Tab", "renderer"])

/** 现场 ∕ 快照落点（与 CLI crash-reports 同目录契约）。 */
export function crashReportsDir() {
  return join(configDir, "crash-reports")
}

/** 主进程自读堆读数（node 侧——electron 无关；装配 `sample` 的 `main` 段默认件）。 */
export function mainHeapReading() {
  const heapUsed = process.memoryUsage().heapUsed
  const heapLimit = v8.getHeapStatistics().heap_size_limit
  return { heapUsed, heapLimit, ratio: heapLimit > 0 ? heapUsed / heapLimit : 0 }
}

/** warn 行（带进程标签——消歧「哪个进程自警」；正文 = CLI `heapWarnLine` 逐字 + 标签段）。 */
export function heapWarnLine(label, used, limit, ratio) {
  const gb = (n) => (n / 1024 / 1024 / 1024).toFixed(1)
  return `[heap] warning (${label}): heapUsed ${gb(used)} GB / ${gb(limit)} GB heap limit (${Math.round(ratio * 100)}%) — long session; consider /new to reset context`
}

/** 自名族 ∥ 快照族 30 天自清（搭车点 = 武装；同策 = CLI purge——全步尽力面）。 */
function purgeOwnFiles(dir, nowMs) {
  const cutoff = nowMs - SCENE_RETENTION_MS
  let names
  try { names = readdirSync(dir) } catch { return } // 目录不可读 ⇒ 无事可做
  for (const name of names) {
    const own = (name.startsWith(SCENE_PREFIX) && name.endsWith(".json"))
      || /^Heap\..+\.heapsnapshot$/.test(name) // 与 CLI 同式（覆盖自名 ∥ 主臂 V8 名）
    if (!own) continue
    try { if (statSync(join(dir, name)).mtimeMs < cutoff) unlinkSync(join(dir, name)) } catch { /* 单档失败不影响其余 */ }
  }
}

/**
 * 启动看门狗（返回句柄：`stop()` ∕ `checkNow()`（直驱一次采样）+ 运行期快照门 `setSnapshotEnabled(enabled)`
 * + 冻结钩族 `onUnresponsive` ∕ `onResponsive` ∕ `onGone`）。`enabled: false` ⇒ 零武装（不注册定时器 ∕
 * 不预建目录 ∕ 不武装快照）；`snapshotEnabled` = 快照门**初始值**（判定归装配面——运行期热读经句柄应用）。
 * 注入缝：`sample` ∕ `snapshot` ∕ `log` + `ping` ∕ `killRenderer` ∕ `reload` + `armMainSnapshot`（臂调用观测）；
 * 时钟 ∕ 定时器可注入（平 node 直测）。
 */
export function createHeapWatch({
  enabled = true,
  snapshotEnabled = true,
  intervalMs = SAMPLE_INTERVAL_MS,
  ratios = HEAP_RATIOS,
  rendererWorkingSetMb = RENDERER_WORKING_SET_MB,
  volumeCapMb = SNAPSHOT_VOLUME_CAP_MB,
  graceMs = FREEZE_GRACE_MS,
  reloadMinGapMs = RELOAD_MIN_GAP_MS,
  pingIntervalMs = PING_INTERVAL_MS,
  pingTimeoutStreak = PING_TIMEOUT_STREAK,
  sceneDir = crashReportsDir(),
  now = () => Date.now(),
  timer = setInterval,
  clearTimer = clearInterval,
  setTimer = setTimeout,
  clearSetTimer = clearTimeout,
  sample = () => ({ main: mainHeapReading(), processes: [] }),
  snapshot = async () => null,
  log = () => {},
  ping = async () => true,
  killRenderer = () => {},
  reload = () => {},
  armMainSnapshot = () => v8.setHeapSnapshotNearHeapLimit(1),
} = {}) {
  const armed = enabled === true
  const warned = new Set()
  let sampleHandle = null
  let pingHandle = null
  let graceHandle = null
  let episode = null
  let lastReloadAt = -Infinity
  let pingTimeouts = 0
  let pressureTaken = false
  let lastReading = { main: null, processes: [] }
  let seq = 0
  let armDone = false // 近上限臂一次性安装标记（Node API 一次性 ⇒ 补装门 = `armed ∧ ¬armDone`）

  const rendererWorkingSet = () => (lastReading.processes ?? []).reduce((max, p) => (
    RENDERER_TYPES.has(p?.type) && Number.isFinite(p.workingSetMb) ? Math.max(max, p.workingSetMb) : max
  ), 0)

  const refreshReading = () => { // 采样一拍（主 ∥ 子进程读数归一）——采样拍 ∥ 冻结入场共用（现场读数新鲜度）
    const reading = sample()
    const main = reading?.main ?? {}
    lastReading = { main: { ...main, ratio: main.heapLimit > 0 ? main.heapUsed / main.heapLimit : 0 }, processes: Array.isArray(reading?.processes) ? reading.processes : [] }
  }

  const writeScene = () => { // 现场 JSON（动作逐条追加 ⇒ 原地覆盖重写；写失败 = `[heap] scene write failed` 行）
    if (episode === null) return null
    if (episode.scenePath === null) episode.scenePath = join(sceneDir, `${SCENE_PREFIX}${episode.at}-${process.pid}.json`)
    const record = {
      kind: "desktop-heap-freeze", at: episode.at, time: new Date(episode.at).toISOString(),
      trigger: episode.trigger, source: episode.source,
      main: lastReading.main, processes: lastReading.processes,
      actions: episode.actions, snapshot: episode.snapshot,
    }
    try {
      mkdirSync(sceneDir, { recursive: true })
      writeFileSync(episode.scenePath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", mode: 0o600 })
      return episode.scenePath
    } catch { log("[heap] scene write failed"); return null } // 失败不静默（stderr 行仍出）
  }

  /** 快照动作（两取径共用）：体积门（超阈跳过 + 记录）⇒ 取 ⇒ 结果记录（含时刻——actions 口径同拍）+ stderr 行。 */
  const takeSnapshot = async (kind) => {
    const at = now()
    if (!snapshotEnabled) return { skipped: "disabled", kind, at }
    const ws = rendererWorkingSet()
    if (ws >= volumeCapMb) {
      log(`[heap] snapshot skipped (over-cap): renderer workingSet ${ws} MB ≥ ${volumeCapMb} MB`)
      return { skipped: "over-cap", workingSetMb: ws, kind, at }
    }
    const path = join(sceneDir, `${SNAPSHOT_PREFIX}${now()}-${process.pid}-${++seq}.heapsnapshot`)
    let result = null
    try { result = (await snapshot({ kind, path })) ?? null } catch { result = null }
    const outcome = result?.path ? { path: result.path, kind, at } : { skipped: "failed", kind, at }
    log(`[heap] renderer snapshot (${kind}): ${outcome.path ?? `skipped (${outcome.skipped})`}`)
    return outcome
  }

  /** 采样拍：双档 warn（每档一次）+ 健康期阈值快照（once 按 pressure episode；∧ ping 正常）。 */
  const checkNow = async () => {
    const lines = []
    if (!armed) return lines
    try { refreshReading() } catch { return lines } // 采样失败不阻断（静默跳过本拍）
    const main = lastReading.main ?? {}
    const ratio = main.ratio ?? 0
    for (const tier of ratios) {
      if (ratio >= tier && !warned.has(tier)) {
        warned.add(tier)
        const line = heapWarnLine("main", main.heapUsed, main.heapLimit, ratio)
        lines.push(line)
        log(line)
        // 日志腿（与 CLI 同径——核事件日志；失败静默降级 NF-L1）
        try { logEvent("heap-warn", { kind: "heap-warn", label: "main", used: main.heapUsed, limit: main.heapLimit, ratio: Number(ratio.toFixed(3)) }) } catch { /* 日志失败不阻断 */ }
      }
    }
    const mainHit = ratio >= (ratios[1] ?? 0.85)
    const rendererHit = rendererWorkingSet() >= rendererWorkingSetMb
    if (!mainHit && !rendererHit) { pressureTaken = false; return lines } // 条件解除 ⇒ 重新武装
    if (pressureTaken || episode !== null) return lines
    if (!snapshotEnabled) return lines // 快照门关 ⇒ 零取（连 ping 竞速都不必）
    let alive = false
    try { alive = (await ping()) === true } catch { alive = false }
    if (!alive) return lines // ∧ ping 正常（阻塞期不尝试——省注定超时的调用；冻结判定归 ping 径）
    pressureTaken = true
    const outcome = await takeSnapshot("threshold")
    const line = `[heap] threshold hit (main ${Math.round(ratio * 100)}% ∧ renderer workingSet ${rendererWorkingSet()} MB) — snapshot ${outcome.path ?? `skipped (${outcome.skipped})`}`
    lines.push(line)
    log(line)
    return lines
  }

  /** ping 兜底拍：连续 2 次超时 ⇒ 冻结判定（与 `unresponsive` 径同序——发现 9）。 */
  const pingTick = async () => {
    if (!armed || episode !== null) return
    let alive = false
    try { alive = (await ping()) === true } catch { alive = false }
    if (alive) { pingTimeouts = 0; return }
    pingTimeouts += 1
    if (pingTimeouts >= pingTimeoutStreak) { pingTimeouts = 0; beginFreeze("ping-timeout", "ping") }
  }

  const closeEpisode = () => {
    if (graceHandle !== null) { try { clearSetTimer(graceHandle) } catch { /* 已停 ∕ 不可清——尽力面 */ } graceHandle = null }
    episode = null
  }

  /** 冻结入场（两径同序）：先补一拍读数（现场新鲜度——采样拍可能滞后 ≤60s）⇒ 落现场 ⇒ stderr 行 ⇒ 宽限定时。once 守卫 = episode（在场 ⇒ 零动作）。 */
  const beginFreeze = (trigger, source) => {
    if (!armed || episode !== null) return
    try { refreshReading() } catch { /* 补拍失败保留最近读数 */ }
    const at = now()
    episode = {
      trigger, source, at, recovered: false, snapshotDone: false, killed: false,
      actions: [{ type: "unresponsive", source, at }], snapshot: null, scenePath: null,
    }
    const file = writeScene()
    log(`[heap] freeze gate (${trigger}): scene ${file ?? "(write failed)"}`)
    graceHandle = setTimer(() => { void graceExpired() }, graceMs)
  }

  const graceExpired = async () => {
    graceHandle = null
    const current = episode
    if (current === null || current.recovered) return
    if (current.source === "ping") { // 「ping 续超时」判定（恢复 ⇒ 同自复径）
      let alive = false
      try { alive = (await ping()) === true } catch { alive = false }
      if (episode !== current) return
      if (alive) return void recover(current, "ping-recovered")
    }
    const at = now()
    if (at - lastReloadAt < reloadMinGapMs) { // 5min 守卫（防循环）：跳过 + 记录
      current.actions.push({ type: "reload", at, skipped: true, reason: "min-interval" })
      writeScene()
      log(`[heap] recovery reload skipped (min-interval ${reloadMinGapMs}ms): ${current.trigger}`)
      return closeEpisode()
    }
    lastReloadAt = at
    current.killed = true
    current.actions.push({ type: "reload", at })
    current.snapshot = { skipped: "renderer-replaced", at } // D8-3：转 reload 径 = 零快照（时刻随记）
    writeScene() // 先落现场后动刀
    log(`[heap] freeze persists past grace (${graceMs}ms) — forcefullyCrashRenderer() + reload()`)
    try { killRenderer() } catch { /* 动作失败不阻断 */ }
    try { reload() } catch { /* 同上 */ }
    // 收束 = `render-process-gone`（预期杀——同现场补收官动作，不另开现场）；兜底窗 = 事件缺失时关窗放行
    graceHandle = setTimer(() => { if (episode === current) closeEpisode() }, GONE_SETTLE_MS)
  }

  /** 恢复径（`responsive` ≤ 宽限 ∥ ping 复通）：恢复记 ⇒ 冻结自复快照（D8-2——旧堆尚在）。 */
  const recover = async (current, reason) => {
    current.recovered = true
    current.actions.push({ type: "responsive", at: now() })
    log(`[heap] renderer recovered within grace (${reason})`)
    if (current.snapshotDone !== true) {
      current.snapshotDone = true
      current.snapshot = await takeSnapshot("post-freeze")
    }
    writeScene()
    closeEpisode()
  }

  const stop = () => {
    if (sampleHandle !== null) { try { clearTimer(sampleHandle) } catch { /* 尽力面 */ } sampleHandle = null }
    if (pingHandle !== null) { try { clearTimer(pingHandle) } catch { /* 尽力面 */ } pingHandle = null }
    closeEpisode()
  }

  /** 运行期快照门应用（装配面两源调用——config-watch `onChange` ∥ 核 `onConfigSelfWrite` 订阅）：
   *  同值 ⇒ 零动作（幂等——不重复记过渡行）；`false` ⇒ 渲染径即时零取；`false→true` 且武装开启 ⇒
   *  近上限臂补装恰一次（`armDone` 闸——Node 一次性 API：不可重装 ∥ 已装态不可撤）。 */
  const setSnapshotEnabled = (value) => {
    const next = value === true
    if (next === snapshotEnabled) return
    snapshotEnabled = next
    log(`[heap] snapshot collection ${next ? "enabled" : "disabled"} (runtime)`)
    if (next && armed && !armDone) { armDone = true; try { armMainSnapshot(1) } catch { /* 补装失败不阻断 */ } }
  }

  if (armed) { // 武装：crash-reports 预建 + 自清 + 主进程近上限快照 + 双定时器（unref——不拖宿主退出）
    try { mkdirSync(sceneDir, { recursive: true }) } catch { /* 预建失败不阻断（写时重试） */ }
    purgeOwnFiles(sceneDir, now())
    if (snapshotEnabled) { armDone = true; try { armMainSnapshot(1) } catch { /* 武装失败不阻断 */ } }
    sampleHandle = timer(() => { void checkNow() }, intervalMs)
    try { sampleHandle?.unref?.() } catch { /* 尽力面 */ }
    pingHandle = timer(() => { void pingTick() }, pingIntervalMs)
    try { pingHandle?.unref?.() } catch { /* 尽力面 */ }
  }

  return {
    stop,
    checkNow,
    setSnapshotEnabled,
    onUnresponsive: () => beginFreeze("unresponsive", "event"),
    onResponsive: () => { if (episode !== null && !episode.recovered) void recover(episode, "responsive-event") },
    onGone: (details) => {
      if (!armed) return
      const reason = details?.reason ?? null
      if (episode !== null) { // 冻结期进程亡（本机落刀 = 预期杀 ∥ 自崩）：同现场补收官动作 + 收束——不另开现场
        episode.actions.push({ type: "gone", at: now(), reason })
        writeScene()
        log(`[heap] renderer gone (reason=${reason}${episode.killed === true ? " · expected (post-kill)" : ""}) — episode closed`)
        closeEpisode()
        return
      }
      if (reason === "clean-exit") return // 正常退出非异常面 ⇒ 零现场
      const at = now()
      episode = { trigger: "render-process-gone", source: "gone", at, recovered: true, snapshotDone: true, killed: true, actions: [{ type: "gone", at, reason }], snapshot: { skipped: "gone", at }, scenePath: null }
      const file = writeScene()
      episode = null
      log(`[heap] render-process-gone (reason=${reason}): scene ${file ?? "(write failed)"}`)
    },
  }
}
