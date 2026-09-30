#!/usr/bin/env node
// desktop-mem-probe.mjs — 桌面渲染进程内存取证探针（CDP over WebSocket · 零依赖 · 只读取数）
//
// 前置：桌面实例带旗启动 ——  electron --remote-debugging-port=9222 --remote-allow-origins=* .
// 跑法：node scripts/desktop-mem-probe.mjs [--port 9222] [--snapshot <out.heapsnapshot>] [--json]
//
// 读数面：① Runtime.getHeapUsage（V8 堆实测——对照 Windows 私有 2GB 的差额 ⇒ 堆外持有量）
//        ② Memory.getDOMCounters（nodes ∥ documents ∥ jsEventListeners —— 监听器计数 = 泄漏金牌读数）
//        ③ Performance.getMetrics（Nodes / JSHeapUsedSize / Documents / LayoutCount …）
//        ④ 页面内 probe：data-idx 块数 ∥ 消息节点数（验窗裁是否真兜住）
//        ⑤ --snapshot：HeapProfiler.takeHeapSnapshot ⇒ 流式写盘（建议症状再現 ∕ GB 级时再取）
// 备注：snapshot 文件可由 Chrome DevTools ▸ Memory 面板离线打开做「retainer 树 top-N」分析；
//       本件不解析快照（多 GB JSON），只落盘 + 报字节数。
import { createWriteStream } from "node:fs"

const args = process.argv.slice(2)
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d }
const PORT = Number(argOf("--port", "9222"))
const SNAP = argOf("--snapshot", null)
const JSON_OUT = args.includes("--json")

const httpGet = (path) => new Promise((res, rej) => {
  import("node:http").then(({ get }) => {
    get({ host: "127.0.0.1", port: PORT, path }, (r) => {
      let b = ""
      r.on("data", (d) => (b += d))
      r.on("end", () => (r.statusCode === 200 ? res(JSON.parse(b)) : rej(new Error(`HTTP ${r.statusCode}: ${b.slice(0, 200)}`))))
    }).on("error", rej)
  })
})

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = []
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data)
      if (m.id && this.pending.has(m.id)) { const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result) }
      else if (m.method) this.events.push(m)
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })) })
  }
}

const main = async () => {
  const version = await httpGet("/json/version")
  const targets = await httpGet("/json/list")
  const page = targets.find((t) => t.type === "page") ?? targets[0]
  if (!page?.webSocketDebuggerUrl) throw new Error("no page target with webSocketDebuggerUrl")

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej) })
  const cdp = new CDP(ws)
  const out = { browser: version.Browser, target: { title: page.title, url: page.url } }

  out.heap = await cdp.send("Runtime.getHeapUsage")
  out.dom = await cdp.send("Memory.getDOMCounters")
  await cdp.send("Performance.enable").catch(() => {})
  const perf = await cdp.send("Performance.getMetrics")
  out.perf = Object.fromEntries(perf.metrics.filter((m) => /Nodes|JSHeapUsedSize|JSHeapTotalSize|Documents|Frames|LayoutCount|Listeners/i.test(m.name)).map((m) => [m.name, m.value]))

  const evalIn = async (expr) => (await cdp.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.value
  out.page = await evalIn(`(() => ({
    baseURI: document.baseURI,
    idxBlocks: document.querySelectorAll("[data-idx]").length,
    topLevelMsgs: document.querySelectorAll('[data-slot],[class*="msg"],[class*="block"]').length,
    flowChildren: document.querySelector('[data-slot="flow"]')?.children?.length ?? null,
  }))()`)

  if (SNAP) {
    const stream = createWriteStream(SNAP)
    let bytes = 0
    const done = new Promise((res) => {
      const onChunk = (e) => { const m = JSON.parse(e.data); if (m.method === "HeapProfiler.addHeapSnapshotChunk") { bytes += Buffer.byteLength(m.params.chunk); stream.write(m.params.chunk) } }
      ws.addEventListener("message", onChunk)
      cdp.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false }).then(() => { ws.removeEventListener("message", onChunk); stream.end(res) })
    })
    await done
    out.snapshot = { path: SNAP, bytes }
  }

  ws.close()
  if (JSON_OUT) console.log(JSON.stringify(out, null, 2))
  else {
    const mb = (n) => (n / 1048576).toFixed(1)
    console.log(`# desktop-mem-probe @ port ${PORT} · ${out.browser}`)
    console.log(`目标：${out.target.title} — ${out.target.url}`)
    console.log(`\n① V8 堆：used ${mb(out.heap.usedSize)}MB / total ${mb(out.heap.totalSize)}MB`)
    console.log(`② DOM：nodes ${out.dom.nodes} · documents ${out.dom.documents} · **jsEventListeners ${out.dom.jsEventListeners}**`)
    console.log(`③ Performance：${Object.entries(out.perf).map(([k, v]) => `${k}=${typeof v === "number" ? v.toFixed(0) : v}`).join(" · ")}`)
    console.log(`④ 页面：idxBlocks=${out.page.idxBlocks} · flowChildren=${out.page.flowChildren} · ${out.page.baseURI}`)
    if (out.snapshot) console.log(`⑤ 快照：${out.snapshot.path}（${mb(out.snapshot.bytes)}MB）— 用 Chrome DevTools ▸ Memory ▸ Load 打开做 retainer 分析`)
    console.log(`\n判读：① vs Windows 私有（如 2GB）差额 = 堆外持有（Blink/图片/缓存）；② 监听器只增不减 = 泄漏；④ 窗裁生效 ⇒ idxBlocks 应有界（≈150±页）`)
  }
}
main().catch((e) => { console.error("probe failed:", e.message); process.exit(1) })
