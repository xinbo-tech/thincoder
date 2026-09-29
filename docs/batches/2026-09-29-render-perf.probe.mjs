/** 桌面渲染计时探针 · 扩面版（更新纪律收核批 · 批档 §2.5 R-1–R-5 真机腿 · 父侧直跑；来源 = `.thincoder/tmp/perf-probe.mjs`
 *  原件保留 · 本件 = 现件 + 两新径；实施舱暂存（`docs/batches/` 写面被拒 ⇒ 沿先例退舱），终位由父侧 copy。
 *
 *  R-1 同块逐 chunk 增长序列（端到端 `store.set` 驱动 —— 真管道：reduce + 帧排）：每 chunk 同步成本
 *      80KB 档 ≤0.3ms ∧ 比(80KB ∕ 10KB) ≤2（基线 = 原件：10KB=0.9ms ∕ 80KB=5.9ms ∕ ≈6.6×；本件按 10 chunk
 *      批测均摊 —— 单 chunk 低于计时器分辨率，批测把分辨率降到 0.01ms/chunk）；
 *  R-2 帧成本：80KB 单块帧内全链 p95 ≤8ms（强径 = 同任务内抢在原生 rAF 前同步出帧计时 —— 观测桩零负担：
 *      观察者仅在帧数相位挂载）· 帧数 ≤ ⌈窗/50ms⌉+2（1000-chunk 流 —— 实绘帧判据 = 本次 tick 落 DOM 变更）；
 *  R-3 工具卡保真（#605 判据）：跨 chunk `.tool-result` 节点身份不变 + scrollTop 保真 + 行只增；
 *  R-4 走查腿（单位时间输出可见延迟 ∕ Stop 可响应）= 人工读数（父侧）；
 *  R-5 VSC 零回归 = 父侧套件 + 批内件对拍（本探针不管）。
 *
 *  跑法：`node .thincoder/tmp/2026-09-29-render-perf-probe.mjs`（或终位 `docs/batches/` 同件）。 */
import { createRequire } from "node:module"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const REPO = "D:/teamcode/thincoder"
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const base = mkdtempSync(join(tmpdir(), "perf-probe-"))
const home = join(base, "home")
mkdirSync(join(home, ".thincoder"), { recursive: true })
writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
env.HOME = home; env.USERPROFILE = home; env.APPDATA = home; env.XDG_CONFIG_HOME = home

const app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env })
try {
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, { timeout: 30000 })

  // ── 探针侧帧观测桩（非产品面）：包裹 rAF ⇒ tick ∕ 实绘帧计数（观察者仅在计数相位挂载 —— 计时相位零负担）∕
  //    `__probeForce` = 同任务内抢在原生 rAF 前同步出帧并计时（= `flush` 强制同步同效另径）──
  await page.evaluate(() => {
    const rawRaf = window.requestAnimationFrame.bind(window)
    const pending = []
    const seen = { ticks: 0, frames: 0, times: [], timing: false }
    let observing = false
    const obs = new MutationObserver(() => {})
    const takeMutated = () => { if (!observing) return true; return obs.takeRecords().length > 0 }
    const tick = (cb) => {
      obs.takeRecords()
      const t0 = seen.timing ? performance.now() : 0
      cb(performance.now())
      if (seen.timing) seen.times.push(performance.now() - t0)
      if (observing) { seen.ticks += 1; if (takeMutated()) seen.frames += 1 }
    }
    window.requestAnimationFrame = (cb) => {
      pending.push(cb)
      return rawRaf(() => tick(cb))
    }
    window.__probe = {
      seen,
      observe(on) {
        if (on) { obs.takeRecords(); obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true }) }
        else obs.disconnect()
        observing = on === true
      },
      timing(on) { seen.timing = on === true },
      force() {
        const cb = pending.pop()
        if (!cb) return null
        const t0 = performance.now()
        cb(performance.now())
        return performance.now() - t0
      },
    }
    window.__raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    window.__avg = (list) => (list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : null)
    window.__p95 = (list) => { const s = list.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] : null }
  })

  const out = {}

  // ── R-1 同块逐 chunk 增长序列（真管道：reduce + 帧排；10 chunk 批测均摊 ⇒ 分辨率 0.01ms/chunk；
  //    文案 = 基线同族（原件 `para`）⇒ 与基线 0.9ms→5.9ms 同口径对比）──
  out.r1 = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    store.set({ activeSession: "1" })
    await window.__raf2()
    const PARA = "这是一段正文内容，含 **粗体** 与 `code` 行内码，用来逼近真实 markdown 重渲成本。"
    const CHUNK = PARA.repeat(9).slice(0, 500) // ~500 chars/chunk（基线同族文案）
    const BATCH = 10
    const at = []
    let total = 0
    while (total < 80000) {
      const t0 = performance.now()
      for (let i = 0; i < BATCH; i += 1) {
        store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: CHUNK }))
        total += CHUNK.length
      }
      at.push({ len: total, msPerChunk: (performance.now() - t0) / BATCH })
    }
    await window.__raf2()
    const band = (lo, hi) => at.filter((row) => row.len > lo && row.len <= hi).map((row) => row.msPerChunk)
    const per10 = window.__avg(band(0, 10000))
    const per80 = window.__avg(band(70000, 80000))
    return {
      chars: total, chunks: total / CHUNK.length, content: "baseline-para",
      msPerChunk10KB: per10, msPerChunk80KB: per80,
      msPerChunkMax: Math.max(...at.map((row) => row.msPerChunk)),
      ratio80to10: per10 ? per80 / per10 : null,
      criteria: { r1a: per80 !== null && per80 <= 0.3, r1b: per10 ? per80 / per10 <= 2 : null },
    }
  })

  // ── R-2a 帧成本：80KB 单块帧内全链（强径 = 同任务内抢占同步出帧；20 帧取 p95）——基线段文案 ──
  out.r2a = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    const CHUNK = "补充行 —— probe frame cost（基线同族文案）。".repeat(10).slice(0, 420)
    const times = []
    for (let i = 0; i < 20; i += 1) {
      await new Promise((r) => setTimeout(r, 70)) // 越过 FRAME_MIN_MS 窗（上一帧 ≥50ms 前）
      store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: CHUNK }))
      const dt = window.__probe.force() // 同任务内抢在原生 rAF 之前同步出帧
      if (dt !== null) times.push(dt)
    }
    return { n: times.length, avg: window.__avg(times), p95: window.__p95(times), max: times.length ? Math.max(...times) : null, content: "baseline-para", criteria: { r2a: window.__p95(times) !== null && window.__p95(times) <= 8 } }
  })

  // ── R-2aD 帧成本（密文变体 ≈2× markdown 密度 —— 诊断面，非判据）：同法 20 帧 ──
  out.r2aDense = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    const DENSE = "这是一段正文内容，含 **粗体** 与 `code` 行内码。".repeat(22).slice(0, 500)
    let total = 0
    while (total < 80000) { store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: DENSE })); total += DENSE.length }
    await new Promise((r) => setTimeout(r, 80))
    const times = []
    for (let i = 0; i < 20; i += 1) {
      await new Promise((r) => setTimeout(r, 70))
      store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: DENSE.slice(0, 400) }))
      const dt = window.__probe.force()
      if (dt !== null) times.push(dt)
    }
    return { n: times.length, avg: window.__avg(times), p95: window.__p95(times), max: times.length ? Math.max(...times) : null, content: "dense-markdown" }
  })

  // ── R-2c 原生帧耗时（步进让位 ⇒ 每个 tick 皆实绘 —— 交叉核；观察者关）──
  out.r2c = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    const seen = window.__probe.seen
    seen.times = []
    window.__probe.timing(true)
    const CHUNK = "补充行 —— probe native frame（基线同族文案）。".repeat(10).slice(0, 420)
    for (let i = 0; i < 20; i += 1) {
      store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: CHUNK }))
      await new Promise((r) => setTimeout(r, 80))
    }
    window.__probe.timing(false)
    return { n: seen.times.length, avg: window.__avg(seen.times), p95: window.__p95(seen.times), max: seen.times.length ? Math.max(...seen.times) : null, content: "dense-markdown" }
  })

  // ── R-2b 帧数合并率：1000-chunk 流 ⇒ 实绘帧 ≤ ⌈窗/50ms⌉+2（观察者仅本相位挂载）──
  out.r2b = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    const seen = window.__probe.seen
    seen.ticks = 0
    seen.frames = 0
    window.__probe.observe(true)
    const CHUNK = "z".repeat(80)
    const t0 = performance.now()
    for (let i = 0; i < 1000; i += 1) {
      store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: CHUNK }))
      await new Promise((r) => setTimeout(r, 0))
    }
    const windowMs = performance.now() - t0
    await window.__raf2()
    window.__probe.observe(false)
    const allowed = Math.ceil(windowMs / 50) + 2
    return { windowMs, ticks: seen.ticks, frames: seen.frames, allowed, criteria: { r2b: seen.frames <= allowed } }
  })

  // ── R-3 工具卡保真（#605）：跨 chunk 同元素 + scrollTop 保真 + 标记存活 + 行只增 ──
  out.r3 = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    store.set(reduce(store.get(), { channel: "ev:tool-call", key: "1", name: "bash", argsSummary: "probe", id: "probe-t1" }))
    store.set(reduce(store.get(), { channel: "ev:tool-output", key: "1", id: "probe-t1", text: "line-0 —— probe tool output 内容行。\n" }))
    await window.__raf2()
    const root = document.querySelector('[data-slot="flow"]')
    const before = root?.querySelector("[data-tool-result]") ?? null
    if (before === null) return { ok: false, reason: "结果区未在场（首 chunk 后应默认展开）" }
    before.setAttribute("data-probe-mark", "1")
    before.scrollTop = 7
    const scrollTop0 = before.scrollTop
    for (let i = 1; i <= 40; i += 1) {
      store.set(reduce(store.get(), { channel: "ev:tool-output", key: "1", id: "probe-t1", text: `line-${i} —— probe tool output 内容行。\n` }))
      await window.__raf2()
    }
    const after = root.querySelector("[data-tool-result]")
    const lines = (after?.textContent ?? "").split("\n").length
    const result = {
      identity: after === before,
      marked: after?.getAttribute("data-probe-mark") === "1",
      scrollTop: { before: scrollTop0, after: after?.scrollTop },
      lines,
      criteria: { r3: after === before && after?.getAttribute("data-probe-mark") === "1" && after?.scrollTop === scrollTop0 && lines >= 41 },
    }
    store.set(reduce(store.get(), { channel: "ev:tool-result", key: "1", id: "probe-t1", ok: true, result: "[stdout]:\n" + "done\n".repeat(3) + "(exit code 0)" }))
    await window.__raf2()
    const settled = root.querySelector("[data-tool-result]")
    return { ...result, settled: { identity: settled === before, text: (settled?.textContent ?? "").slice(0, 40) } }
  })

  // ── 现行件存档径（原件 ①②④：直驱 mountChat ∕ mountPool —— 落离岸根，零污染真管道面）──
  out.legacy = await page.evaluate(async () => {
    const log = {}
    const host = document.createElement("div")
    const chatMod = await import("./views/chat.mjs")
    const actMod = await import("./views/activity.mjs")
    const mkState = (n) => ({ activeSession: "1", blocks: Array.from({ length: n }, (_, i) => ({ key: `m#${i}`, kind: i % 2 ? "user" : "assistant", text: `第 ${i} 块 内容内容内容内容内容内容内容内容内容内容` })), pool: {}, poolCollapsed: {}, subBlocks: {} })
    const times = []
    for (let n = 1; n <= 200; n += 1) { const t0 = performance.now(); chatMod.mountChat(host, mkState(n), {}); times.push(performance.now() - t0) }
    log.chatPerStep = { avg1_10: window.__avg(times.slice(0, 10)), avg101_200: window.__avg(times.slice(100, 200)), max: Math.max(...times) }
    const rowsOf = (n) => Array.from({ length: n }, (_, i) => ({ kind: "text", text: `行 ${i + 1} 内容内容内容内容` }))
    const mkPool = (n) => ({ activeSession: "1", pool: {}, poolCollapsed: {}, subBlocks: { "1": [{ key: "sub:perf#1", label: "perf", role: "perf", id: 1, rows: rowsOf(n), frozen: false, region: "activity", status: "running" }] } })
    const poolRoot = document.createElement("div")
    const times2 = []
    for (let n = 1; n <= 200; n += 1) { const t0 = performance.now(); actMod.mountPool(poolRoot, mkPool(n), {}); times2.push(performance.now() - t0) }
    log.poolPerStep = { avg1_10: window.__avg(times2.slice(0, 10)), avg101_200: window.__avg(times2.slice(100, 200)), max: Math.max(...times2) }
    const para = "这是一段正文内容，含 **粗体** 与 `code` 行内码，用来逼近真实 markdown 重渲成本。"
    const steps = []
    for (const L of [500, 1000, 2000, 5000, 10000, 20000, 40000, 80000]) {
      const text = para.repeat(Math.ceil(L / para.length)).slice(0, L)
      const st = { activeSession: "1", blocks: [{ key: "m#0", kind: "assistant", text }], pool: {}, poolCollapsed: {}, subBlocks: {} }
      chatMod.mountChat(host, st, {})
      const t0 = performance.now()
      chatMod.mountChat(host, st, {})
      steps.push({ chars: L, ms: Math.round((performance.now() - t0) * 100) / 100 })
    }
    log.longBlockMountPerChunk = steps
    return log
  })

  console.log(JSON.stringify(out, null, 1))
} finally {
  await app.close()
  process.exit(0)
}
