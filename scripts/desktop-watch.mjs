#!/usr/bin/env node
// desktop-watch.mjs — 常驻看守件：周期采样 + 冻结自捕（恢复瞬间自动读数 + 快照）
//
// 用法（detached）：node scripts/desktop-watch.mjs [--interval 240] [--min-heap 300] [--max-hours 8]
//   --interval  健康期采样间隔秒（默认 240）
//   --min-heap  快照阈值 MB（默认 300——小于此值视为新起实例，跳过快照）
//   --max-hours 运行上限小时（默认 8）
// 行为：
//   健康期：每 interval 秒读一次（堆 ∥ DOM counters ∥ 监听器 ∥ 块数）→ 逐行写日志；
//   冻结期（读超时）：转 15s 重试；恢复瞬间（读通）→ 若堆 ≥ 阈值 ⇒ 立刻取全量快照 + 打 FROZEN→RECOVERED 摘要（含冻结时长）。
// 只读（快照除外——快照会短暂占用渲染线程，属预期）。
import { appendFileSync, createWriteStream } from "node:fs"
import { get } from "node:http"

const args = process.argv.slice(2)
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d }
const INTERVAL = Number(argOf("--interval", "240")) * 1000
const MIN_HEAP_MB = Number(argOf("--min-heap", "300"))
const MAX_HOURS = Number(argOf("--max-hours", "8"))
const OUT = argOf("--out", ".thincoder/tmp/desktop-watch.log")
const SNAP_DIR = argOf("--snap-dir", ".thincoder/tmp")
const started = Date.now()

const log = (m) => { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); appendFileSync(OUT, line + "\n") }

const httpGet = (path) => new Promise((res, rej) => {
  const r = get({ host: "127.0.0.1", port: 9222, path }, (x) => { let b = ""; x.on("data", (d) => (b += d)); x.on("end", () => res(b)) })
  r.on("error", rej); r.setTimeout(4000, () => { rej(new Error("http timeout")); r.destroy() })
})

async function connect() {
  const targets = JSON.parse(await httpGet("/json/list"))
  const page = targets.find((t) => t.type === "page")
  if (!page?.webSocketDebuggerUrl) throw new Error("no page target")
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.addEventListener("open", res, { once: true }); ws.addEventListener("error", () => rej(new Error("ws err")), { once: true }); setTimeout(() => rej(new Error("ws timeout")), 4000) })
  let id = 0
  const send = (method, params = {}, ms = 6000) => new Promise((res, rej) => {
    const mid = ++id
    const h = (e) => { const m = JSON.parse(e.data); if (m.id === mid) { ws.removeEventListener("message", h); m.error ? rej(new Error(m.error.message)) : res(m.result) } }
    ws.addEventListener("message", h); ws.send(JSON.stringify({ id: mid, method, params }))
    setTimeout(() => { ws.removeEventListener("message", h); rej(new Error("cdp timeout " + method)) }, ms)
  })
  return { ws, send }
}

const mb = (n) => (n / 1048576).toFixed(1)

async function sample() {
  const { ws, send } = await connect()
  try {
    const heap = await send("Runtime.getHeapUsage")
    const dom = await send("Memory.getDOMCounters").catch(() => ({}))
    const idx = await send("Runtime.evaluate", { expression: "document.querySelectorAll('[data-idx]').length", returnByValue: true }, 8000).catch(() => ({}))
    return { heapMB: heap.usedSize / 1048576, totalMB: heap.totalSize / 1048576, nodes: dom.nodes, listeners: dom.jsEventListeners, idx: idx.result?.value }
  } finally { ws.close() }
}

async function snapshot() {
  const { ws, send } = await connect()
  const path = `${SNAP_DIR}/freeze-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.heapsnapshot`
  const stream = createWriteStream(path)
  let bytes = 0
  try {
    await new Promise((res, rej) => {
      const onChunk = (e) => { const m = JSON.parse(e.data); if (m.method === "HeapProfiler.addHeapSnapshotChunk") { bytes += Buffer.byteLength(m.params.chunk); stream.write(m.params.chunk) } }
      ws.addEventListener("message", onChunk)
      send("HeapProfiler.takeHeapSnapshot", { reportProgress: false }, 300000).then(() => { ws.removeEventListener("message", onChunk); stream.end(res) }).catch((err) => { ws.removeEventListener("message", onChunk); stream.end(() => rej(err)) })
    })
    log(`SNAPSHOT DONE → ${path}（${mb(bytes)}MB）`)
  } catch (e) { log(`snapshot failed: ${e.message}（可重试）`) }
  finally { ws.close() }
}

log(`watch start · interval=${INTERVAL / 1000}s · min-heap=${MIN_HEAP_MB}MB · max=${MAX_HOURS}h · out=${OUT}`)
let frozenSince = null
let lastSnapAt = 0, snapCount = 0
while (Date.now() - started < MAX_HOURS * 3600000) {
  try {
    const s = await sample()
    if (frozenSince) { log(`RECOVERED（冻结时长 ≈ ${Math.round((Date.now() - frozenSince) / 1000)}s）· heap=${s.heapMB.toFixed(1)}MB listeners=${s.listeners} nodes=${s.nodes}`); frozenSince = null }
    log(`sample · heap=${s.heapMB.toFixed(1)}/${s.totalMB.toFixed(1)}MB · listeners=${s.listeners} · nodes=${s.nodes} · idx=${s.idx}`)
    if (s.heapMB >= MIN_HEAP_MB && snapCount < 3 && Date.now() - lastSnapAt > 90 * 60000) {
      lastSnapAt = Date.now(); snapCount++
      log(`heap ≥ ${MIN_HEAP_MB}MB ⇒ 取快照（第 ${snapCount}/3 张；限频 90min）`)
      await snapshot()
    }
    await new Promise((r) => setTimeout(r, INTERVAL))
  } catch (e) {
    if (!frozenSince) { frozenSince = Date.now(); log(`FROZEN detected（${e.message}）——转 15s 重试`) }
    else if (Math.round((Date.now() - frozenSince) / 1000) % 60 < 16) log(`still frozen (${Math.round((Date.now() - frozenSince) / 1000)}s)`)
    await new Promise((r) => setTimeout(r, 15000))
  }
}
log("watch end（max-hours 到）"); process.exit(0)
