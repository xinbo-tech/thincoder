/**
 * 2026-09-30-desktop-heap-freeze-e2.probe.mjs — E2 命中分支（render-core 续写支文本节点合并）真机腿 ·
 * 批内件；首落 `.thincoder/tmp/` ⇒ 父侧收位 `docs/batches/` 同名件。面（单源 = 批档
 * `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.13）：
 *   ① 流式驱动（大 reasoning chunk 批——真 `reduce` ∥ 真渲染径 `/rc/subblocks/block.mjs` ⇒
 *      `appendAdvisorChunk`；节奏 = 8 chunk ∕ 帧 ≈ 480 chunk/s）⇒ 修复态节点曲线（CDP
 *      `Memory.getDOMCounters` + 页内普查双读；取样前 GC ⇒ 读数 = 存活节点）
 *   ② long-task（>50ms）计数（PerformanceObserver——**流式窗**按驱动时刻 marks 归窗：页龄 ∕ 驱动前条目不计）
 *   ③ 呈现语义对拍（逐字等价三读：DOM `textContent` ∥ `Range` 复制串 ∥ 模型 `rows` 串；+ 滚到底→回顶复读
 *      不变 + 行盒几何对拍）
 *   ④ 同机同负载旧径对照（修前形逐字复刻 = 逐 chunk `createTextNode` + `appendChild`，离屏容器；
 *      权威修前基线 = E1 批内件读数——同负载 2 × 4000 think ⇒ 8,000 文本节点；`§1.3c` 现场 102K 同族）
 * 沙箱纪律：临时 HOME ∥ 独立 `--user-data-dir`（真机零触）；CDP = playwright 私管（临时端口——**不占 9222**，
 * 用户实例不受扰）。跑法：`node .thincoder/tmp/2026-09-30-desktop-heap-freeze-e2.probe.mjs`
 * 读数 → 同目录 `2026-09-30-desktop-heap-freeze-e2-readings.json`（退出码 = 判决合计）。
 */
import { createRequire } from "node:module"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const APP_DIR = join(REPO, "thincoder-desktop")
const TMP = join(REPO, ".thincoder", "tmp")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))
const MB = (n) => Math.round((n ?? 0) / 1048576)

// ─── 负载（同 E1 批内件负载形：2 × 4000 think chunk；+ toolOutput 2000 = 第二处支的流式面）────────
// 注：agent id 须为**数字**（核 `parseChannel` 键文法 `([\w-]+)#(\d+)`——否则模型 id 缺 ⇒ 块无 data-subid）。
const LOAD = { key: "e2-probe", chunksPerAgent: 4000, toolChunks: 2000, batch: 8 }
const thinkChunk = (agent, index) => `推理流片段 ${agent}:${index} —— E2 负载逼近（逐 chunk 追加，不合并）。\n`
const toolChunk = (index) => `工具输出行 ${index} —— E2 负载逼近（逐 chunk 追加，不合并）。\n`
const think1 = Array.from({ length: LOAD.chunksPerAgent }, (_, i) => thinkChunk(1, i))
const think2 = Array.from({ length: LOAD.chunksPerAgent }, (_, i) => thinkChunk(2, i))
const toolAll = Array.from({ length: LOAD.toolChunks }, (_, i) => toolChunk(i))
const segments = [
  { label: "think-21", id: 21, kind: "think", face: null, tool: null, sub: null, chunks: think1 },
  { label: "think-22", id: 22, kind: "think", face: null, tool: null, sub: null, chunks: think2 },
  { label: "tool-23", id: 23, kind: "tool", face: "toolOutput", tool: "read", sub: "read", chunks: toolAll },
]

const sandbox = mkdtempSync(join(tmpdir(), "e2-probe-"))
const home = join(sandbox, "home")
mkdirSync(join(home, ".thincoder"), { recursive: true })
writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
env.HOME = home; env.USERPROFILE = home; env.APPDATA = home; env.XDG_CONFIG_HOME = home

const out = {
  at: new Date().toISOString(),
  sandbox,
  load: { ...LOAD, thinkChunkSample: thinkChunk(1, 0), toolChunkSample: toolChunk(0) },
  phases: {},
}
let verdict = 1

// 修前基线（E1 批内件同负载实测——只读嵌入，供对照）
const prevPath = join(TMP, "2026-09-30-desktop-heap-freeze-readings.json")
const prev = existsSync(prevPath) ? JSON.parse(readFileSync(prevPath, "utf8")) : null
out.prefixBaseline = prev === null ? null : {
  source: "2026-09-30-desktop-heap-freeze-readings.json（E1 批内件 · 修前同负载实测）",
  load: prev.phases?.load ?? null,
  domNodes: prev.phases?.loaded?.dom?.nodes ?? null,
  textNodes: prev.phases?.loaded?.census?.textNodes ?? null,
  rows: prev.phases?.loaded?.census?.advisorTop ?? [],
}

const app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env })
try {
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, { timeout: 30000 })
  const cdp = await page.context().newCDPSession(page)

  const heapUsage = () => cdp.send("Runtime.getHeapUsage")
  const domCounters = () => cdp.send("Memory.getDOMCounters")
  const collectGarbage = () => cdp.send("HeapProfiler.collectGarbage").catch(() => {})
  const processes = () => app.evaluate(({ app: electronApp }) => electronApp.getAppMetrics().map((m) => ({
    type: m.type, pid: m.pid, wsMb: Math.round((m.memory?.workingSetSize ?? 0) / 1024), cpu: m.cpu?.percentCPUUsage ?? null,
  })))
  /** 页内普查：文本节点总数 ∥ 元素数 ∥ 续写行构成（直属文本子节点数 = E2 命中面读数） */
  const census = () => page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let textNodes = 0
    while (walker.nextNode()) textNodes += 1
    const rows = []
    for (const el of document.querySelectorAll(".advisor-text, .advisor-tool-line")) {
      let kids = 0
      for (const child of el.childNodes) if (child.nodeType === 3) kids += 1
      rows.push({ cls: el.className, kind: el.dataset.kind ?? el.dataset.face ?? "", sub: el.closest(".sub-block")?.dataset.subid ?? null, kids, chars: el.textContent.length })
    }
    rows.sort((a, b) => b.kids - a.kids)
    return {
      textNodes, elements: document.querySelectorAll("*").length, rowCount: rows.length, rowsTop: rows.slice(0, 8),
      subIds: [...document.querySelectorAll(".sub-block")].map((el) => el.dataset.subid ?? el.dataset.subname ?? null),
      toolLines: document.querySelectorAll(".advisor-tool-line").length,
    }
  })
  const sampleAll = async (label) => {
    await collectGarbage()
    await sleep(150)
    const heap = await heapUsage()
    const dom = await domCounters()
    return { label, gc: true, heapMb: { used: MB(heap.usedSize), total: MB(heap.totalSize) }, dom, processes: await processes(), census: await census() }
  }

  // ── ① 装配 + 基线 + long-task 观测 + 驱动初始化 ─────────────────────────────
  out.phases.assembly = { boot: await page.evaluate(() => document.documentElement.dataset.boot) }
  out.curve = [await sampleAll("baseline")]
  await page.evaluate(async ({ key }) => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    store.set({ activeSession: key, blocks: [], subBlocks: { [key]: [] } })
    await new Promise((r) => requestAnimationFrame(r))
    await new Promise((r) => requestAnimationFrame(r))
    window.__e2Long = []
    window.__e2Observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__e2Long.push({ start: Math.round(entry.startTime), dur: Math.round(entry.duration), attribution: entry.attribution?.map((item) => item.name ?? item.containerType ?? "") ?? [] })
    })
    window.__e2Observer.observe({ entryTypes: ["longtask"] })
    window.__e2Marks = { observerAt: performance.now(), segments: [] }
    return true
  }, { key: LOAD.key })

  // ── ② 流式驱动（三段：think ×2 + toolOutput ×1；批间 rAF 让渡——流式节奏）────────
  const driveSegment = (segment) => page.evaluate(async ({ key, batch, label, id, kind, face, tool, sub, chunks }) => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
    const startAt = performance.now()
    store.set(reduce(store.get(), { channel: "ev:subagent", key, status: "started", role: "probe", id, model: "probe" }))
    await new Promise((r) => requestAnimationFrame(r))
    const marks = []
    for (let start = 0; start < chunks.length; start += batch) {
      const t0 = performance.now()
      for (let i = start; i < Math.min(start + batch, chunks.length); i += 1) {
        const payload = { channel: "ev:subchunk", key, role: "probe", id, kind, text: chunks[i] }
        if (face !== null) payload.face = face
        if (tool !== null) payload.tool = tool
        if (sub !== null) payload.sub = sub
        store.set(reduce(store.get(), payload))
      }
      const t1 = performance.now()
      await new Promise((r) => requestAnimationFrame(r))
      const t2 = performance.now()
      marks.push({ at: Math.round(t0), batchMs: Math.round((t1 - t0) * 10) / 10, frameMs: Math.round((t2 - t1) * 10) / 10 })
    }
    await new Promise((r) => requestAnimationFrame(r))
    await new Promise((r) => requestAnimationFrame(r))
    const endAt = performance.now()
    window.__e2Marks.segments.push({ label, start: Math.round(startAt), end: Math.round(endAt) })
    const slow = marks.filter((mark) => mark.batchMs > 20 || mark.frameMs > 40)
    return {
      ms: Math.round(endAt - startAt), chunks: chunks.length, startAt: Math.round(startAt), endAt: Math.round(endAt),
      batches: marks.length,
      maxBatchMs: marks.reduce((max, mark) => Math.max(max, mark.batchMs), 0),
      maxFrameMs: marks.reduce((max, mark) => Math.max(max, mark.frameMs), 0),
      slow: slow.slice(0, 12),
    }
  }, { key: LOAD.key, batch: LOAD.batch, ...segment })

  out.phases.drive = []
  for (const segment of segments) {
    const result = await driveSegment(segment)
    await sleep(500)
    out.phases.drive.push({ label: segment.label, id: segment.id, kind: segment.kind, ...result })
    out.curve.push(await sampleAll(`after-${segment.label}`))
  }

  // ── ③ 呈现语义对拍（逐字三读 + 滚到底→回顶复读）─────────────────────────────
  out.phases.equivalence = await page.evaluate(async ({ key, targets }) => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const blocks = store.get().subBlocks?.[key] ?? []
    const readback = {}
    for (const target of targets) {
      const block = blocks.find((entry) => entry.id === target.id)
      const root = document.querySelector(`.sub-block[data-subid="${target.id}"]`)
      const el = root?.querySelector(target.selector) ?? null
      let rangeText = null
      if (el !== null) {
        const range = document.createRange()
        range.selectNodeContents(el)
        rangeText = range.toString()
      }
      const text = el === null ? null : el.textContent
      const model = Array.isArray(block?.rows) ? block.rows.map((row) => row.text).join("") : null
      readback[target.id] = {
        present: el !== null,
        className: el?.className ?? null,
        kids: el === null ? null : [...el.childNodes].filter((child) => child.nodeType === 3).length,
        chars: text?.length ?? null,
        expectedChars: target.expected.length,
        eq_textContent: text === target.expected,
        eq_range: rangeText === target.expected,
        eq_model: model === target.expected,
        head: text?.slice(0, 24) ?? null,
        tail: text?.slice(-24) ?? null,
      }
    }
    // 滚到底 → 回顶 → 复读首行文本（滚动位不改读出串）
    const root = document.querySelector(`.sub-block[data-subid="21"]`)
    const content = root?.querySelector(".advisor-content") ?? null
    let scroll = null
    if (content !== null) {
      content.scrollTop = content.scrollHeight
      await new Promise((r) => requestAnimationFrame(r))
      content.scrollTop = 0
      await new Promise((r) => requestAnimationFrame(r))
      const text = root.querySelector(".advisor-text")?.textContent ?? null
      scroll = {
        scrollHeight: content.scrollHeight, clientHeight: content.clientHeight,
        backToTop: { scrollTop: Math.round(content.scrollTop), eq_expected: text === targets[0].expected },
      }
    }
    return { readback, scroll }
  }, { key: LOAD.key, targets: [
    { id: 21, selector: ".advisor-text", expected: think1.join("") },
    { id: 22, selector: ".advisor-text", expected: think2.join("") },
    { id: 23, selector: ".advisor-tool-line", expected: toolAll.join("") },
  ] })

  // ── ④ long-task 读数（按 marks 归窗）────────────────────────────────────────
  out.phases.longTasks = await page.evaluate(() => {
    window.__e2Observer?.disconnect()
    const list = window.__e2Long ?? []
    const marks = window.__e2Marks ?? { observerAt: 0, segments: [] }
    const inWindow = (entry) => marks.segments.some((segment) => entry.start >= segment.start && entry.start <= segment.end)
    const driveEntries = list.filter(inWindow)
    return {
      observerAt: Math.round(marks.observerAt),
      segments: marks.segments,
      all: { count: list.length, entries: list.slice(0, 20) },
      streaming: { count: driveEntries.length, max: driveEntries.reduce((max, entry) => Math.max(max, entry.dur), 0), entries: driveEntries.slice(0, 20) },
    }
  })

  // ── ⑤ 终态取样（GC 后——在旧径对照之前，避开离屏夹具节点）─────────────────────
  out.phases.final = await sampleAll("final")

  // ── ⑥ 同机同负载旧径对照（修前形离屏复刻；节点曲线 + 行盒几何对拍）──────────────
  out.phases.legacyAB = await page.evaluate(async ({ chunks }) => {
    const started = performance.now()
    const host = document.createElement("div")
    host.className = "advisor-block sub-block"
    host.style.position = "absolute"; host.style.left = "-10000px"; host.style.top = "0"
    const content = document.createElement("div")
    content.className = "advisor-content"
    host.appendChild(content)
    document.body.appendChild(host)
    // (a) 旧径节点曲线（逐 chunk createTextNode + appendChild——修前形逐字）
    const legacyRow = document.createElement("div")
    legacyRow.className = "advisor-text advisor-think"
    content.appendChild(legacyRow)
    const curve = []
    for (let i = 0; i < chunks.length; i += 1) {
      legacyRow.appendChild(document.createTextNode(chunks[i]))
      if ((i + 1) % 1000 === 0) curve.push({ chunks: i + 1, textNodes: legacyRow.childNodes.length, chars: legacyRow.textContent.length })
    }
    const legacyFinal = {
      textNodes: legacyRow.childNodes.length, chars: legacyRow.textContent.length,
      eq_source: legacyRow.textContent === chunks.join(""),
    }
    // (b) 行盒几何对拍（同串两态：单文本节点 ≡ 逐节点——1000 chunk 样本）
    const sample = chunks.slice(0, 1000).join("")
    const fixedRow = document.createElement("div")
    fixedRow.className = "advisor-text advisor-think"
    fixedRow.textContent = sample
    const legacyRow2 = document.createElement("div")
    legacyRow2.className = "advisor-text advisor-think"
    for (const chunk of chunks.slice(0, 1000)) legacyRow2.appendChild(document.createTextNode(chunk))
    content.appendChild(fixedRow)
    content.appendChild(legacyRow2)
    await new Promise((r) => requestAnimationFrame(r))
    await new Promise((r) => requestAnimationFrame(r))
    const rectCount = (el) => { const range = document.createRange(); range.selectNodeContents(el); return range.getClientRects().length }
    const geometry = {
      sampleChars: sample.length,
      textEq: fixedRow.textContent === legacyRow2.textContent,
      fixed: { scrollHeight: fixedRow.scrollHeight, rects: rectCount(fixedRow), width: Math.round(fixedRow.getBoundingClientRect().width) },
      legacy: { scrollHeight: legacyRow2.scrollHeight, rects: rectCount(legacyRow2), width: Math.round(legacyRow2.getBoundingClientRect().width) },
    }
    host.remove()
    return { ms: Math.round(performance.now() - started), curve, legacyFinal, geometry }
  }, { chunks: think1 })

  // ── 判决（验收腿 = §2.13 ①②③⑤ + 节点账目标 ≤ 千级）──────────────────────────
  const readback = out.phases.equivalence.readback
  const readbackRows = [readback["21"], readback["22"], readback["23"]]
  const finalCensus = out.phases.final.census
  out.verdict = {
    nodeBound: readbackRows.every((row) => row.kids !== null && row.kids <= 1),
    textEquivalence: readbackRows.every((row) => row.eq_textContent && row.eq_range && row.eq_model),
    scrollReadback: out.phases.equivalence.scroll?.backToTop?.eq_expected === true,
    layoutEquivalence: out.phases.legacyAB.geometry.textEq === true
      && out.phases.legacyAB.geometry.fixed.rects === out.phases.legacyAB.geometry.legacy.rects
      && out.phases.legacyAB.geometry.fixed.scrollHeight === out.phases.legacyAB.geometry.legacy.scrollHeight,
    zeroLongTasks: out.phases.longTasks.streaming.count === 0,
    nodeReduction: finalCensus.textNodes <= 1000,
  }
  out.comparison = {
    before: out.prefixBaseline === null ? null : { textNodes: out.prefixBaseline.textNodes, domNodes: out.prefixBaseline.domNodes, rows: out.prefixBaseline.rows.map((row) => row.kids) },
    after: { textNodes: finalCensus.textNodes, domNodes: out.phases.final.dom.nodes, rows: finalCensus.rowsTop.map((row) => row.kids) },
    legacyAB: { curve: out.phases.legacyAB.curve, textNodes: out.phases.legacyAB.legacyFinal.textNodes },
  }
  out.ok = Object.values(out.verdict).every((value) => value === true)
  verdict = out.ok ? 0 : 1
  console.log(JSON.stringify({ verdict: out.verdict, comparison: out.comparison, streaming: out.phases.longTasks.streaming }, null, 1))
} catch (error) {
  out.error = String(error?.stack ?? error)
  console.error("PROBE ERROR:", out.error)
} finally {
  writeFileSync(join(TMP, "2026-09-30-desktop-heap-freeze-e2-readings.json"), `${JSON.stringify(out, null, 2)}\n`)
  try { await app.close() } catch { /* 实例已亡 ∕ 关闭失败——读数已落盘 */ }
}
process.exit(verdict)
