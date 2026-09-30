/**
 * 2026-09-30-desktop-heap-freeze-e4js-live.mjs — E4-JS 迭代探针（批内件 · 非交付读数件 —— 交付读数走
 * `…-probe.mjs` 全跑）：只跑 E4-JS 四腿（首挂 ∥ 滚过 ∥ 流式 ∥ 重挂）+ 诊断面，用于快速迭代；
 * 沙箱纪律同主探针（临时 HOME ∥ 独立 `--user-data-dir`；**不占 9222**）。
 * 跑法：`node .thincoder/tmp/2026-09-30-desktop-heap-freeze-e4js-live.mjs`（读数 → 同目录 `-e4js-live-readings.json`）。
 */
import { createRequire } from "node:module"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const base = mkdtempSync(join(tmpdir(), "e4js-live-"))
const home = join(base, "home")
mkdirSync(join(home, ".thincoder"), { recursive: true })
writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
env.HOME = home; env.USERPROFILE = home; env.APPDATA = home; env.XDG_CONFIG_HOME = home

const out = { at: new Date().toISOString(), ok: false }
const BIG = 592 * 1024
let app = null
try {
  app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env })
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, { timeout: 30000 })

  const census = () => page.evaluate(() => {
    const faces = [...document.querySelectorAll("[data-raw]")]
    const face = faces.sort((a, b) => b.textContent.length - a.textContent.length)[0] ?? null
    if (face === null) return null
    const shells = [...face.querySelectorAll("span[data-seg]")]
    const segs = shells.map((s) => Number(s.getAttribute("data-seg")))
    const visible = shells.filter((s) => s.style.display !== "none").map((s) => Number(s.getAttribute("data-seg")))
    const chunks = shells.map((s) => s.textContent).join("")
    return {
      text: face.textContent.length, spans: shells.length, distinct: new Set(segs).size,
      maxSeg: segs.length > 0 ? Math.max(...segs) : null, visible,
      joined: chunks.length, joinedPrefix: face.textContent.startsWith(chunks),
      blockHeight: face.closest("[data-block-kind]")?.offsetHeight ?? null,
    }
  })

  // 首挂（一次性巨块 —— 真 ev:token 径）
  out.mount = await page.evaluate(async ({ big }) => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
    const key = "live"
    store.set({ activeSession: key, blocks: [], subBlocks: {}, following: true, pendingNew: 0 })
    const raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    await raf2()
    const text = "巨块实时腿 —— E4-JS 迭代探针（592KB 级单块）。".repeat(Math.ceil(big / 24)).slice(0, big)
    const tasks = []
    const po = new PerformanceObserver((list) => { for (const entry of list.getEntries()) tasks.push(Math.round(entry.duration)) })
    try { po.observe({ entryTypes: ["longtask"] }) } catch { /* 缺席非阻断 */ }
    const started = performance.now()
    store.set(reduce(store.get(), { channel: "ev:token", key, text }))
    await raf2(); await new Promise((r) => setTimeout(r, 400))
    const face = document.querySelector('[data-block-kind="assistant"] [data-raw]')
    const shells = face === null ? [] : [...face.querySelectorAll("span[data-seg]")]
    const vis = shells.filter((s) => s.style.display !== "none").map((s) => Number(s.getAttribute("data-seg")))
    const finish = performance.now()
    await new Promise((r) => setTimeout(r, 300))
    po.disconnect()
    return {
      ms: Math.round(finish - started), chars: face === null ? 0 : face.textContent.length, eq: face !== null && face.textContent === text,
      spans: shells.length, visible: vis, tasks,
    }
  }, { big: BIG })
  out.mount.census = await census()

  // 滚过腿（视口顶锚 = 逐步重取内容锚 —— Range）
  out.scroll = await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const flow = document.querySelector('[data-slot="flow"]')
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    const face = [...document.querySelectorAll("[data-raw]")].sort((a, b) => b.textContent.length - a.textContent.length)[0] ?? null
    const out = { steps: 0, changes: 0, maxPerFrame: 0, visibleMax: 0, driftMax: 0, segMin: null, segMax: null, tasks: [], measured: 0, skipped: 0, hot: [] }
    if (face === null) return { error: "no-giant-face" }
    store.set({ following: false })
    let frame = 0
    let ticking = true
    const bump = () => { frame += 1; if (ticking) requestAnimationFrame(bump) }
    requestAnimationFrame(bump)
    const perFrame = new Map()
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName !== "style") continue
        perFrame.set(frame, (perFrame.get(frame) ?? 0) + 1)
        out.changes += 1
      }
    })
    observer.observe(face, { attributes: true, attributeFilter: ["style"], subtree: true })
    const tasks = []
    const po = new PerformanceObserver((list) => { for (const entry of list.getEntries()) tasks.push(Math.round(entry.duration)) })
    try { po.observe({ entryTypes: ["longtask"] }) } catch { /* 缺席非阻断 */ }
    const bandTop = () => flow.getBoundingClientRect().top
    const block = face.closest("[data-block-kind]")
    const blockTop = block.getBoundingClientRect().top - bandTop() + flow.scrollTop
    flow.scrollTop = Math.max(0, blockTop + 2400)
    flow.dispatchEvent(new Event("scroll"))
    await raf2(); await sleep(250)
    const sample = () => {
      const shells = [...face.querySelectorAll("span[data-seg]")]
      const vis = shells.filter((s) => s.style.display !== "none").map((s) => Number(s.getAttribute("data-seg")))
      out.visibleMax = Math.max(out.visibleMax, vis.length)
      if (vis.length > 0) {
        out.segMin = out.segMin === null ? Math.min(...vis) : Math.min(out.segMin, ...vis)
        out.segMax = out.segMax === null ? Math.max(...vis) : Math.max(out.segMax, ...vis)
      }
      return vis
    }
    sample()
    const anchorOf = () => {
      const rect = flow.getBoundingClientRect()
      const seed = typeof document.caretRangeFromPoint === "function" ? document.caretRangeFromPoint(rect.left + 40, rect.top + 40) : null
      if (seed === null) return null
      try { seed.setEnd(seed.startContainer, seed.startOffset + 1) } catch { /* 坍缩锚 */ }
      return seed
    }
    const topOf = (range) => {
      if (range === null) return null
      const box = range.getBoundingClientRect()
      return box.height === 0 && box.top === 0 ? null : +box.top.toFixed(2)
    }
    const anchorInfo = (range) => {
      if (range === null) return null
      const node = range.startContainer
      const data = typeof node?.data === "string" ? node.data : ""
      const seg = typeof node?.parentNode?.closest === "function" ? node.parentNode.closest("[data-seg]")?.getAttribute("data-seg") ?? null : null
      const box = range.getBoundingClientRect()
      return { seg, offset: range.startOffset, len: data.length, at: data.slice(Math.max(0, range.startOffset - 6), range.startOffset + 6), top: +box.top.toFixed(2), height: +box.height.toFixed(2) }
    }
    for (let index = 0; index < 30; index += 1) {
      const range = anchorOf() // 逐步重取（步前）
      const before = topOf(range)
      const infoBefore = anchorInfo(range)
      const scrollBefore = flow.scrollTop
      const intended = Math.max(0, scrollBefore - 4000) // 用户写（引擎鉗位）
      const visBefore = [...face.querySelectorAll("span[data-seg]")].filter((s) => s.style.display !== "none").map((s) => Number(s.getAttribute("data-seg")))
      flow.scrollTop = intended
      flow.dispatchEvent(new Event("scroll"))
      await raf2(); await sleep(120)
      out.steps += 1
      const visAfter = sample()
      const after = topOf(range)
      const drift = before === null || after === null ? null : +((after - before) + (intended - scrollBefore)).toFixed(2)
      if (drift === null) out.skipped += 1
      else {
        out.driftMax = Math.max(out.driftMax, Math.abs(drift))
        out.measured += 1
        if (Math.abs(drift) > 1) out.hot.push({ step: index, drift, before, after, intended, scrollAfter: Math.round(flow.scrollTop), visBefore, visAfter, infoBefore, infoAfter: anchorInfo(range) })
      }
    }
    ticking = false
    observer.disconnect()
    await sleep(300)
    po.disconnect()
    out.maxPerFrame = perFrame.size > 0 ? Math.max(...perFrame.values()) : 0
    out.tasks = tasks
    out.crossed = out.segMin === null || out.segMax === null ? 0 : out.segMax - out.segMin
    out.frames = perFrame.size
    return out
  })

  // 流式腿（增长期窗保持 ∥ 零长任务 —— 诊断面：distinct ∥ spans ∥ faceChars）；`ev:token` = **续写语义**（增量块）
  out.streaming = await page.evaluate(async ({ big }) => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    const key = store.get().activeSession
    const tasks = []
    const po = new PerformanceObserver((list) => { for (const entry of list.getEntries()) tasks.push(Math.round(entry.duration)) })
    try { po.observe({ entryTypes: ["longtask"] }) } catch { /* 缺席非阻断 */ }
    store.set({ following: true, blocks: [], pendingNew: 0 })
    await raf2()
    const fixture = "流式合成腿片段 —— heap-freeze E4-JS（增长期窗保持 ∥ 零长任务）。"
    const steps = 24
    const per = Math.ceil(big / steps)
    const windows = []
    let text = ""
    const started = performance.now()
    for (let index = 1; index <= steps; index += 1) {
      const chunk = fixture.repeat(Math.ceil((per * index) / fixture.length)).slice(per * (index - 1), per * index)
      text += chunk
      store.set(reduce(store.get(), { channel: "ev:token", key, text: chunk }))
      await raf2()
      await sleep(90)
      const face = document.querySelector('[data-block-kind="assistant"] [data-raw]')
      if (face === null) continue
      const shells = [...face.querySelectorAll("span[data-seg]")]
      const vis = shells.filter((s) => s.style.display !== "none").map((s) => Number(s.getAttribute("data-seg")))
      windows.push({ step: index, chars: text.length, faceChars: face.textContent.length, spans: shells.length, distinct: new Set(shells.map((s) => Number(s.getAttribute("data-seg")))).size, visible: vis })
    }
    await sleep(500)
    po.disconnect()
    const face = document.querySelector('[data-block-kind="assistant"] [data-raw]')
    const shells = face === null ? [] : [...face.querySelectorAll("span[data-seg]")]
    const vis = shells.filter((s) => s.style.display !== "none").map((s) => Number(s.getAttribute("data-seg")))
    return {
      ms: Math.round(performance.now() - started), steps, chars: text.length, faceChars: face === null ? 0 : face.textContent.length,
      eq: face !== null && face.textContent === text, spans: shells.length,
      distinct: new Set(shells.map((s) => Number(s.getAttribute("data-seg")))).size, visible: vis,
      follows: vis.includes(shells.length - 1), diff: face === null ? null : face.textContent === text ? null : { head: face.textContent.slice(0, 40), tail: face.textContent.slice(-40), textHead: text.slice(0, 40), textTail: text.slice(-40) },
      windows: windows.slice(-6), tasks,
    }
  }, { big: BIG })

  // 重挂腿（真 mountChat 径 —— 窗转移）
  out.remount = await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const { mountChat } = await import(new URL("./views/chat.mjs", document.baseURI).href)
    const flow = document.querySelector('[data-slot="flow"]')
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    const faceOf = () => [...document.querySelectorAll("[data-raw]")].sort((a, b) => b.textContent.length - a.textContent.length)[0] ?? null
    const visOf = (face) => [...face.querySelectorAll("span[data-seg]")].filter((s) => s.style.display !== "none").map((s) => Number(s.getAttribute("data-seg")))
    const before = faceOf()
    const visibleBefore = before === null ? [] : visOf(before)
    const spansBefore = before === null ? 0 : before.querySelectorAll("span[data-seg]").length
    const tasks = []
    const po = new PerformanceObserver((list) => { for (const entry of list.getEntries()) tasks.push(Math.round(entry.duration)) })
    try { po.observe({ entryTypes: ["longtask"] }) } catch { /* 缺席非阻断 */ }
    const started = performance.now()
    mountChat(flow, store.get(), {}, 150)
    await raf2(); await sleep(300)
    po.disconnect()
    const after = faceOf()
    const visibleAfter = after === null ? [] : visOf(after)
    return {
      ms: Math.round(performance.now() - started), spansBefore, spansAfter: after === null ? 0 : after.querySelectorAll("span[data-seg]").length,
      visibleBefore, visibleAfter, transferOk: visibleBefore.length > 0 && visibleBefore.join(",") === visibleAfter.join(","),
      chars: after === null ? 0 : after.textContent.length, tasks,
    }
  })
  out.ok = true
} catch (error) {
  out.error = String(error?.stack ?? error)
} finally {
  writeFileSync(join(REPO, ".thincoder", "tmp", "2026-09-30-desktop-heap-freeze-e4js-live-readings.json"), `${JSON.stringify(out, null, 2)}\n`)
  if (app !== null) { try { await app.close() } catch { /* 实例已亡 */ } }
}
console.log(JSON.stringify(out, null, 1))
process.exit(out.ok ? 0 : 1)
