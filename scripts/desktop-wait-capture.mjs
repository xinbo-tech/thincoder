#!/usr/bin/env node
// desktop-wait-capture.mjs — 「恢复即抓」看守件：轮询 CDP，直到渲染主线程解放的那一瞬，
// 立刻取读数（堆 ∥ DOM counters ∥ 监听器 ∥ 块数）并（可选）取全量堆快照。
//
// 用法（建议 detached 跑）：node scripts/desktop-wait-capture.mjs --out .thincoder/tmp/wait-capture.log [--snapshot .thincoder/tmp/freeze.heapsnapshot] [--max-min 60]
// 逻辑：每 5s 一次尝试——新鲜 WS 连接 + Runtime.getHeapUsage（4s 超时）：
//   超时/失败 ⇒ 记一行 "still blocked"（继续）；成功 ⇒ 立即抓全套 + 快照（若给）→ 退出 0。
// 只读；不改任何应用状态（快照除外——快照会短暂占用渲染线程，属预期）。
import { appendFileSync, createWriteStream } from "node:fs"
import { get } from "node:http"

const args = process.argv.slice(2)
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d }
const OUT = argOf("--out", ".thincoder/tmp/wait-capture.log")
const SNAP = argOf("--snapshot", null)
const MAX_MIN = Number(argOf("--max-min", "60"))
const started = Date.now()
const log = (m) => { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); appendFileSync(OUT, line + "\n") }

const httpGet = (path) => new Promise((res, rej) => {
  const r = get({ host: "127.0.0.1", port: 9222, path }, (x) => { let b = ""; x.on("data", (d) => (b += d)); x.on("end", () => res(b)) })
  r.on("error", rej); r.setTimeout(4000, () => { rej(new Error("http timeout")); r.destroy() })
})

const tryCapture = async () => {
  const targets = JSON.parse(await httpGet("/json/list"))
  const page = targets.find((t) => t.type === "page")
  if (!page?.webSocketDebuggerUrl) throw new Error("no page target")
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.addEventListener("open", res, { once: true }); ws.addEventListener("error", () => rej(new Error("ws err")), { once: true }); setTimeout(() => rej(new Error("ws timeout")), 4000) })
  let id = 0
  const send = (method, params = {}, ms = 5000) => new Promise((res, rej) => {
    const mid = ++id
    const h = (e) => { const m = JSON.parse(e.data); if (m.id === mid) { ws.removeEventListener("message", h); m.error ? rej(new Error(m.error.message)) : res(m.result) } }
    ws.addEventListener("message", h); ws.send(JSON.stringify({ id: mid, method, params }))
    setTimeout(() => { ws.removeEventListener("message", h); rej(new Error("cdp timeout " + method)) }, ms)
  })
  // 主线程解放探针：getHeapUsage 能答 ⇒ 已活
  const heap = await send("Runtime.getHeapUsage")
  log(`UNBLOCKED. heap used=${(heap.usedSize / 1048576).toFixed(1)}MB total=${(heap.totalSize / 1048576).toFixed(1)}MB`)
  const dom = await send("Memory.getDOMCounters").catch((e) => ({ err: e.message }))
  log("DOM counters: " + JSON.stringify(dom))
  await send("Performance.enable").catch(() => {})
  const perf = await send("Performance.getMetrics").catch(() => ({ metrics: [] }))
  log("perf: " + JSON.stringify(perf.metrics.filter((m) => /Nodes|JSHeap|Documents|Listeners/.test(m.name)).map((m) => [m.name, Math.round(m.value)])))
  const evalV = await send("Runtime.evaluate", { expression: "document.querySelectorAll('[data-idx]').length", returnByValue: true }, 8000).catch((e) => ({ err: e.message }))
  log("idxBlocks: " + JSON.stringify(evalV.result?.value ?? evalV.err))
  if (SNAP && heap.usedSize / 1048576 >= 300) {
    log("taking heap snapshot → " + SNAP + "（渲染线程会短暂占用——预期）")
    try {
      const stream = createWriteStream(SNAP)
      let bytes = 0
      const done = new Promise((res, rej) => {
        const onChunk = (e) => { const m = JSON.parse(e.data); if (m.method === "HeapProfiler.addHeapSnapshotChunk") { bytes += Buffer.byteLength(m.params.chunk); stream.write(m.params.chunk) } }
        ws.addEventListener("message", onChunk)
        send("HeapProfiler.takeHeapSnapshot", { reportProgress: false }, 240000).then(() => { ws.removeEventListener("message", onChunk); stream.end(res) }).catch((err) => { ws.removeEventListener("message", onChunk); stream.end(() => rej(err)) })
      })
      await done
      log(`SNAPSHOT DONE: ${SNAP}（${(bytes / 1048576).toFixed(1)}MB）`)
    } catch (e) { log("snapshot failed: " + e.message) }
  }
  ws.close()
}

log(`watcher start · out=${OUT} · snapshot=${SNAP ?? "off"} · max=${MAX_MIN}min`)
while (Date.now() - started < MAX_MIN * 60000) {
  try { await tryCapture(); log("CAPTURED — exit 0"); process.exit(0) }
  catch (e) { log("still blocked (" + (e.message || e) + ") — retry in 5s") }
  await new Promise((r) => setTimeout(r, 5000))
}
log("gave up after " + MAX_MIN + "min"); process.exit(2)
