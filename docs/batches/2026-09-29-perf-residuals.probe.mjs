/** 桌面渲染计时探针 · 增量 md 批（批档 §2.10 R 表真机腿 · 父侧直跑；来源 = `docs/batches/2026-09-29-render-perf.probe.mjs` 原件存续）。
 *
 *  R-1 ∕ R-2b ∕ R-3 原腿原样存续（回归基线 —— 读数比对在册）；
 *  R-6 帧成本 p95 ≤8ms@80KB（基线段）+ **10KB→80KB 帧成本比 ≤2**（平坦性）；
 *  R-7 帧成本 p95 ≤8ms@80KB（密文段）；
 *  R-8 组合边界腿：尾块终稿 + 新块追加同帧 ⇒ 帧成本 ≤8ms ∧ 尾块节点身份存续（`data-probe-mark` 存活）∧ 块数 +1；
 *  R-9 对拍腿：八类语料逐步流式（`ev:token` 真管道），每步以离岸容器 `md(raw)` 为全量参照 ——
 *      活面 `textContent` 逐字 + 结构归一（相邻文本节点合并 + 标签 ∕ class 序列）一致。
 *
 *  跑法：`node .thincoder/tmp/2026-09-29-perf-residuals.probe.mjs`（终位 = `docs/batches/` 同件）。
 */
import { createRequire } from "node:module"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const REPO = "D:/teamcode/thincoder"
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const base = mkdtempSync(join(tmpdir(), "perf-residuals-"))
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

  // ── 探针侧帧观测桩（非产品面）：同前批形（rAF 包裹 ⇒ tick ∕ 实绘帧计数；`force()` = 同任务内抢在原生 rAF 前同步出帧计时）
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
    window.requestAnimationFrame = (cb) => { pending.push(cb); return rawRaf(() => tick(cb)) }
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
    window.__norm = (node) => {
      const out = []
      const walk = (n) => {
        if (n.nodeType === 3) {
          if (n.textContent === "") return
          const last = out[out.length - 1]
          if (last && last.startsWith("t:")) out[out.length - 1] = last + n.textContent
          else out.push("t:" + n.textContent)
          return
        }
        if (n.nodeType !== 1) return
        if (n.classList?.contains?.("code-copy-btn")) return // 端侧复制钮（产品面附加节点——非 md 面）
        out.push("<" + n.tagName.toLowerCase() + (n.className ? "." + String(n.className).replace(/\s+/g, ".") : "") + ">")
        for (const child of n.childNodes) walk(child)
        out.push("</" + n.tagName.toLowerCase() + ">")
      }
      for (const child of node.childNodes) walk(child)
      return out.join("")
    }
  })

  const out = {}

  // ── R-1 同块逐 chunk 增长序列（真管道 reduce + 帧排；10 chunk 批测均摊）── 基线 0.0033 ∕ 0.22
  out.r1 = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    store.set({ activeSession: "1" })
    await window.__raf2()
    const PARA = "这是一段正文内容，含 **粗体** 与 `code` 行内码，用来逼近真实 markdown 重渲成本。"
    const CHUNK = PARA.repeat(9).slice(0, 500)
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
      criteria: { r1a: per80 !== null && per80 <= 0.3, r1b: per10 ? per80 / per10 <= 2 : null },
    }
  })

  // ── R-6 帧成本（基线段）：80KB 单块 + **10KB→80KB 平坦比**（同法各 15 帧；强径 = 同步出帧计时）──
  out.r6 = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    const CHUNK = "补充行 —— probe frame cost（基线同族文案）。".repeat(10).slice(0, 420)
    const measure = async () => {
      const times = []
      for (let i = 0; i < 15; i += 1) {
        await new Promise((r) => setTimeout(r, 70))
        store.set(reduce(store.get(), { channel: "ev:token", key: "6", text: CHUNK }))
        const dt = window.__probe.force()
        if (dt !== null) times.push(dt)
      }
      return { n: times.length, avg: window.__avg(times), p95: window.__p95(times), coreP95: window.__p95(times.filter((t) => t > 0)) }
    }
    store.set({ activeSession: "6", blocks: [] }) // 会话切口 = 清挂载面（现场口随 history:page 整置 —— 探针直置）
    await window.__raf2()
    let total = 0
    while (total < 10000) { store.set(reduce(store.get(), { channel: "ev:token", key: "6", text: CHUNK })); total += CHUNK.length }
    await new Promise((r) => setTimeout(r, 80))
    const small = await measure()
    while (total < 80000) { store.set(reduce(store.get(), { channel: "ev:token", key: "6", text: CHUNK })); total += CHUNK.length }
    await new Promise((r) => setTimeout(r, 80))
    const large = await measure()
    return {
      chars: total, content: "baseline-para",
      at10KB: small, at80KB: large,
      ratioCore: small.coreP95 && large.coreP95 ? large.coreP95 / small.coreP95 : null,
      criteria: { r6a: large.p95 !== null && large.p95 <= 8, r6b: small.coreP95 && large.coreP95 ? large.coreP95 / small.coreP95 <= 2 : null },
    }
  })

  // ── R-7 帧成本（密文段 ≈2× markdown 密度）：同法 + 10KB→80KB 平坦比（诊断面 —— 布局成本 ∝ 段长）──
  out.r7 = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    const DENSE = "这是一段正文内容，含 **粗体** 与 `code` 行内码。".repeat(22).slice(0, 500)
    const measure = async () => {
      const times = []
      for (let i = 0; i < 15; i += 1) {
        await new Promise((r) => setTimeout(r, 70))
        store.set(reduce(store.get(), { channel: "ev:token", key: "7", text: DENSE }))
        const dt = window.__probe.force()
        if (dt !== null) times.push(dt)
      }
      return { n: times.length, avg: window.__avg(times), p95: window.__p95(times), coreP95: window.__p95(times.filter((t) => t > 0)) }
    }
    store.set({ activeSession: "7", blocks: [] })
    await window.__raf2()
    let total = 0
    while (total < 10000) { store.set(reduce(store.get(), { channel: "ev:token", key: "7", text: DENSE })); total += DENSE.length }
    await new Promise((r) => setTimeout(r, 80))
    const small = await measure()
    while (total < 80000) { store.set(reduce(store.get(), { channel: "ev:token", key: "7", text: DENSE })); total += DENSE.length }
    await new Promise((r) => setTimeout(r, 80))
    const large = await measure()
    return {
      chars: total, content: "dense-markdown",
      at10KB: small, at80KB: large,
      ratioCore: small.coreP95 && large.coreP95 ? large.coreP95 / small.coreP95 : null,
      criteria: { r7: large.p95 !== null && large.p95 <= 8, r7flat: small.coreP95 && large.coreP95 ? large.coreP95 / small.coreP95 <= 2 : null },
    }
  })

  // ── R-8 组合边界腿：尾块近满 + 同帧「尾块终稿 + 新块追加」（不夹 rAF）⇒ 帧成本 + 零重挂 + 块数 +1 ──
  out.r8 = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    const PARA = "这是一段正文内容，含 **粗体** 与 `code` 行内码，用来逼近真实 markdown 重渲成本。"
    const CHUNK = PARA.repeat(9).slice(0, 500)
    const root = () => document.querySelector('[data-slot="flow"]')
    const settle = async (need) => {
      const deadline = performance.now() + 2000
      for (;;) {
        await window.__raf2()
        if ((root()?.textContent ?? "").includes(need)) return true
        if (performance.now() > deadline) return false
      }
    }
    const rounds = []
    for (let round = 0; round < 3; round += 1) {
      store.set({ activeSession: "8", blocks: [] })
      await window.__raf2()
      let total = 0
      while (total < 60000) { store.set(reduce(store.get(), { channel: "ev:token", key: "8", text: CHUNK })); total += CHUNK.length }
      await settle("逼近真实")
      const beforeCount = root().querySelectorAll("[data-block-kind]").length
      const head = root().querySelectorAll("[data-block-kind]")[beforeCount - 1]
      head.setAttribute("data-probe-mark", "1")
      await new Promise((r) => setTimeout(r, 80)) // 越过 FRAME_MIN_MS 窗（下一 tick 必为实绘帧）
      store.set(reduce(store.get(), { channel: "ev:token", key: "8", text: `·终稿${round}` }))
      store.set(reduce(store.get(), { channel: "ev:tool-call", key: "8", name: "bash", argsSummary: `probe-r8-${round}`, id: `probe-r8-${round}` }))
      const dt = window.__probe.force()
      await window.__raf2()
      const afterCount = root().querySelectorAll("[data-block-kind]").length
      rounds.push({ dt, beforeCount, afterCount, marked: root().querySelector('[data-probe-mark="1"]') !== null })
    }
    const times = rounds.map((r) => r.dt).filter((v) => v !== null && v !== undefined)
    return {
      rounds,
      frameMs: window.__avg(times), frameP95: window.__p95(times),
      markedAll: rounds.every((r) => r.marked),
      countsOk: rounds.every((r) => r.afterCount === r.beforeCount + 1),
      criteria: { r8a: window.__p95(times) !== null && window.__p95(times) <= 8, r8b: rounds.every((r) => r.marked), r8c: rounds.every((r) => r.afterCount === r.beforeCount + 1) },
    }
  })

  // ── R-9 对拍腿：八类语料逐步流式（真管道）⇒ 每步「活面 ≡ 离岸全量参照」（textContent 逐字 + 结构归一）──
  out.r9 = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    const { md } = await import("/rc/md.mjs")
    const PARA = "这是一段正文内容，含 **粗体** 与 `code` 行内码，用来逼近真实 markdown 重渲成本。"
    const CORPUS = [
      ["纯段", "abcd efgh 连续文本无空行"],
      ["纯段", PARA],
      ["空行分段", "第一段\n\n第二段有 **加粗**。\n\n第三段收尾。"],
      ["密文行内", "密：**粗**与`码`与*斜*与~~删~~ 反复：" + "**粗**`码`".repeat(6)],
      ["悬空尾", "悬空：`code 未闭"],
      ["悬空尾", "悬空2：**粗体 未闭"],
      ["围栏", "围栏：\n\n```js\nconst a = 1\n```\n\n后文"],
      ["列表", "列表：\n\n- 甲\n- 乙\n\n完"],
      ["混合 CJK", "混合 CJK 与 English 与数字 123\n换行续写 `x` 与 **y**"],
      ["转义", "转义：\\*不是星\\* 与 \\`不是码\\` 文本。"],
    ]
    const rows = []
    let checked = 0
    for (let index = 0; index < CORPUS.length; index += 1) {
      const [name, text] = CORPUS[index]
      const session = `r9-${index}`
      store.set({ activeSession: session, blocks: [] })
      await window.__raf2()
      let raw = ""
      let bad = 0
      const STEP = 4
      for (let at = 0; at < text.length; at += STEP) {
        raw += text.slice(at, at + STEP)
        store.set(reduce(store.get(), { channel: "ev:token", key: session, text: text.slice(at, at + STEP) }))
        // 帧降频（≥FRAME_MIN_MS）为机制内设计 ⇒ 比对面取「追平后」稳态：poll 至活面 data-raw 到齐
        const deadline = performance.now() + 1500
        for (;;) {
          await window.__raf2()
          const face = document.querySelector('[data-slot="flow"] [data-raw]')
          if ((face?.getAttribute("data-raw") ?? null) === raw) break
          if (performance.now() > deadline) break
        }
        const root = document.querySelector('[data-slot="flow"]')
        const live = root?.querySelector("[data-raw]") ?? null
        const ref = document.createElement("div")
        ref.innerHTML = md(raw)
        const liveNorm = live ? window.__norm(live) : "(缺活面)"
        const refNorm = window.__norm(ref)
        checked += 1
        if (liveNorm !== refNorm) {
          bad += 1
          if (bad === 1) rows.push({ name, raw, live: liveNorm.slice(0, 200), ref: refNorm.slice(0, 200) })
        }
      }
      rows.push({ name, steps: Math.ceil(text.length / STEP), bad })
    }
    const failures = rows.filter((row) => row.bad && row.bad > 0).length
    return { checked, failures, rows: rows.filter((row) => row.live !== undefined || row.bad), criteria: { r9: failures === 0 } }
  })

  // ── R-2b 帧数合并率（回归基底）：1000-chunk 流 ⇒ 实绘帧 ≤ ⌈窗/50ms⌉+2 ──
  out.r2b = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    const seen = window.__probe.seen
    seen.ticks = 0
    seen.frames = 0
    store.set({ activeSession: "2b", blocks: [] })
    await window.__raf2()
    window.__probe.observe(true)
    const CHUNK = "z".repeat(80)
    const t0 = performance.now()
    for (let i = 0; i < 1000; i += 1) {
      store.set(reduce(store.get(), { channel: "ev:token", key: "2b", text: CHUNK }))
      await new Promise((r) => setTimeout(r, 0))
    }
    const windowMs = performance.now() - t0
    await window.__raf2()
    window.__probe.observe(false)
    const allowed = Math.ceil(windowMs / 50) + 2
    return { windowMs, ticks: seen.ticks, frames: seen.frames, allowed, criteria: { r2b: seen.frames <= allowed } }
  })

  // ── R-3 工具卡保真（#605 回归）：跨 chunk 同元素 + scrollTop 保真 + 标记存活 + 行只增 ──
  out.r3 = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    store.set({ activeSession: "3", blocks: [] })
    await window.__raf2()
    store.set(reduce(store.get(), { channel: "ev:token", key: "3", text: "前置文本块（基线同境 —— 工具卡居次块）。" }))
    await window.__raf2()
    store.set(reduce(store.get(), { channel: "ev:tool-call", key: "3", name: "bash", argsSummary: "probe", id: "probe-t1" }))
    store.set(reduce(store.get(), { channel: "ev:tool-output", key: "3", id: "probe-t1", text: "line-0 —— probe tool output 内容行。\n" }))
    await window.__raf2()
    const root = document.querySelector('[data-slot="flow"]')
    // 帧降频为设计（≥FRAME_MIN_MS）⇒ poll 至首 chunk 落定
    const deadline = performance.now() + 1500
    for (;;) {
      await window.__raf2()
      if ((root?.querySelector("[data-tool-result]")?.textContent ?? "").includes("line-0")) break
      if (performance.now() > deadline) break
    }
    const before = root?.querySelector("[data-tool-result]") ?? null
    if (before === null) return { ok: false, reason: "结果区未在场" }
    before.setAttribute("data-probe-mark", "1")
    before.scrollTop = 7
    const scrollTop0 = before.scrollTop
    for (let i = 1; i <= 40; i += 1) {
      store.set(reduce(store.get(), { channel: "ev:tool-output", key: "3", id: "probe-t1", text: `line-${i} —— probe tool output 内容行。\n` }))
      await window.__raf2()
    }
    for (;;) {
      await window.__raf2()
      if ((root?.querySelector("[data-tool-result]")?.textContent ?? "").includes("line-40")) break
      if (performance.now() > deadline + 2000) break
    }
    const after = root.querySelector("[data-tool-result]")
    const lines = (after?.textContent ?? "").split("\n").length
    return {
      identity: after === before,
      marked: after?.getAttribute("data-probe-mark") === "1",
      scrollTop: { before: scrollTop0, after: after?.scrollTop },
      lines,
      criteria: { r3: after === before && after?.getAttribute("data-probe-mark") === "1" && after?.scrollTop === scrollTop0 && lines >= 41 },
    }
  })

  console.log(JSON.stringify(out, null, 1))
} catch (error) {
  console.error("PROBE ERROR:", error && error.stack ? error.stack : error)
  process.exitCode = 1
} finally {
  await app.close()
  if (process.exitCode !== 1) process.exit(0)
}
