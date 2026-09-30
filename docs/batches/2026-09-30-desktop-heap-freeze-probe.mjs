/**
 * 2026-09-30-desktop-heap-freeze-probe.mjs — 桌面堆取证批 · 真机腿 + 1d 收数 + **D9 重载补启腿** + **E4 巨块夹层四腿**（批内件；
 * 首落 `.thincoder/tmp/` ⇒ 父侧收位 `docs/batches/` 同名件）。面（单源 = 批档
 * `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.3-1d ∕ §2.11 ∕ §2.14a ∕ §2.14-B ∕ §2.14-C）：
 *   ① 装配（armed 副作用 = crash-reports 预建）② 基线 ∥ 负载逼近（子代理终报回放 × 巨块重放——真 reduce 径）
 *   ∥ 快照 diff（按构造器分组——CDP HeapProfiler，健康期取）③ 冻结门 F1（自复径：`unresponsive` ⇒ 宽限内
 *   `responsive` ⇒ post-freeze 快照落盘）④ 冻结门 F2（转 reload 径：⇒ kill+reload ⇒ 渲染换代 + 恢复重读）
 *   ⑤ **D9 补启**（真开项目 + 真 create/resume + 真通道子代理事件 ⇒ 手工 `forcefullyCrashRenderer()` +
 *   gone 驱动 reload ⇒ 活跃会话自动回（零手选）+ 重读存量页 + 在飞子代理随流）
 *   ⑥ **E4 巨块夹层四腿**（§2.14-B/C：CSS 落层 computed 断言 ∥ long-task（两载同径）∥ 帧采样 ∥ 巨块逐字等价
 *   ∥ 回填∕跟滚不跳——真会话 + 真 `history:page` 回填；两 long-task 为**读数项**——不并入全绿门）。
 *   ⑦ **E4-JS 支（§2.15）**：**⓪ 引擎标定（前置 —— 页内 A/B：整挂态 ∥ 分段态布局 + 单段窗步；不过 ⇒ 弃形停步）**
 *   + 窗态 census（G1/G2）∥ **滚过腿**（窗内连续滚过 ≥N 段 —— `segView` 拍在途；每帧段变更 ≤2 ∥ 可见段 ≤4 ∥ 锁偏 ≤2px）
 *   ∥ 流式合成（增长期窗保持 ∥ 零长任务）∥ 恢复合成（重挂转移：窗集不变）∥ 回填合成（E4 腿会话注巨块后三腿并行 ∥ 段链稳定）。
 * 输入触达 = **主进程侧 `webContents.sendInputEvent`**（渲染阻塞期 CDP 输入命令自身积压在渲染任务队列——
 * 曾实测不触达；主侧注入 = 浏览器侧待确认输入 ⇒ hang monitor 可达）。沙箱纪律：临时 HOME ∥ 独立
 * `--user-data-dir`（真机零触；传输 = playwright 私管 CDP——**不占 9222**，用户实例不受扰）；
 * D9 项目锚 = 仓根（`PROJECT-MANIFEST.json` 在场 ⇒ 台账族发现浅——临时目录锚会引爆祖先大目录扫描）。
 * 跑法：`node .thincoder/tmp/2026-09-30-desktop-heap-freeze-probe.mjs`（读数 → 同目录 `-readings.json`）。
 */
import { createRequire } from "node:module"
import { createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))
const MB = (n) => Math.round((n ?? 0) / 1048576)
const readScenes = (dir) => (existsSync(dir)
  ? readdirSync(dir).filter((name) => name.startsWith("desktop-freeze-") && name.endsWith(".json")).sort()
    .map((name) => ({ name, scene: JSON.parse(readFileSync(join(dir, name), "utf8")) }))
  : [])
const sceneFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((name) => name.startsWith("Heap.desktop.") && name.endsWith(".heapsnapshot")) : [])

/** CDP 全量堆快照（流式落盘——健康期径；playwright CDPSession 事件载荷 = params 本体）。 */
async function takeHeapSnapshot(cdp, file) {
  const stream = createWriteStream(file)
  let bytes = 0
  const onChunk = (params) => { // `HeapProfiler.addHeapSnapshotChunk` ⇒ { chunk }
    const chunk = params?.chunk ?? ""
    bytes += Buffer.byteLength(chunk)
    stream.write(chunk)
  }
  cdp.on("HeapProfiler.addHeapSnapshotChunk", onChunk)
  await cdp.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false })
  cdp.off("HeapProfiler.addHeapSnapshotChunk", onChunk)
  await new Promise((done) => stream.end(done))
  return { path: file, bytes }
}

/** 快照按构造器分组（object ∕ closure ∕ function 按名；余按 type）——两快照差集（top-N 按 |ΔKB|）。 */
function constructorGroups(file) {
  const snap = JSON.parse(readFileSync(file, "utf8"))
  const fields = snap.snapshot.meta.node_fields
  const iType = fields.indexOf("type")
  const iName = fields.indexOf("name")
  const iSize = fields.indexOf("self_size")
  const typeNames = snap.snapshot.meta.node_types[0]
  const groups = new Map()
  for (let index = 0; index < snap.snapshot.node_count; index += 1) {
    const offset = index * fields.length
    const type = typeNames[snap.nodes[offset + iType]]
    const name = type === "object" || type === "closure" || type === "function" ? (snap.strings[snap.nodes[offset + iName]] ?? "") : ""
    const key = name ? `${type}·${name}` : type
    const entry = groups.get(key) ?? { count: 0, bytes: 0 }
    entry.count += 1
    entry.bytes += snap.nodes[offset + iSize]
    groups.set(key, entry)
  }
  return { groups, nodeCount: snap.snapshot.node_count }
}
function snapshotDiff(beforeFile, afterFile, topN = 15) {
  const before = constructorGroups(beforeFile)
  const after = constructorGroups(afterFile)
  const rows = []
  for (const key of new Set([...before.groups.keys(), ...after.groups.keys()])) {
    const a = before.groups.get(key) ?? { count: 0, bytes: 0 }
    const b = after.groups.get(key) ?? { count: 0, bytes: 0 }
    rows.push({ key, countDelta: b.count - a.count, kbDelta: Math.round((b.bytes - a.bytes) / 1024), countAfter: b.count })
  }
  rows.sort((x, y) => Math.abs(y.kbDelta) - Math.abs(x.kbDelta))
  return { nodeCount: { before: before.nodeCount, after: after.nodeCount }, top: rows.slice(0, topN) }
}

const base = mkdtempSync(join(tmpdir(), "heap-freeze-probe-"))
const home = join(base, "home")
mkdirSync(join(home, ".thincoder"), { recursive: true })
writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
env.HOME = home; env.USERPROFILE = home; env.APPDATA = home; env.XDG_CONFIG_HOME = home

const crashDir = join(home, ".thincoder", "crash-reports")
const sessionsDir = join(home, ".thincoder", "sessions") // D9 腿：沙箱会话盘（槽文件面）
const snapDir = join(REPO, ".thincoder", "tmp", "heap-freeze-snap")
mkdirSync(snapDir, { recursive: true })
const out = { at: new Date().toISOString(), sandbox: base, ok: false, launch: "pending", phases: {} }
// 探针健壮性：真机 kill+reload（换代）会触 playwright 内部 `Target crashed` 断言（未捕获 ⇒ 进程亡、读数不落）——
// 全局接住并计入读数（读数主径 = 主进程侧 app.evaluate + 文件面，不依赖 page 对象）。
const incidents = []
process.on("uncaughtException", (error) => { incidents.push(`uncaught:${error?.message ?? error}`) })
process.on("unhandledRejection", (error) => { incidents.push(`rejected:${error?.message ?? error}`) })
let verdict = 1
let app = null
try {
  app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env }) // 启动失败亦走 finally（读数落新档——旧档不滞留）
  out.launch = "ok"
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, { timeout: 30000 })
  const cdp = await page.context().newCDPSession(page)

  const metrics = () => app.evaluate(({ app: electronApp }) => electronApp.getAppMetrics().map((m) => ({
    type: m.type, pid: m.pid, wsMb: Math.round((m.memory?.workingSetSize ?? 0) / 1024), cpu: m.cpu?.percentCPUUsage ?? null,
  })))
  const census = () => page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let textNodes = 0
    while (walker.nextNode()) textNodes += 1
    const rows = []
    for (const div of document.querySelectorAll(".advisor-text")) {
      let kids = 0
      for (const child of div.childNodes) if (child.nodeType === 3) kids += 1
      rows.push({ cls: div.className, kids, chars: div.textContent.length })
    }
    rows.sort((a, b) => b.kids - a.kids)
    return {
      textNodes, elements: document.querySelectorAll("*").length, advisorTexts: rows.length,
      advisorTop: rows.slice(0, 10), advisorTextNodeSum: rows.reduce((sum, row) => sum + row.kids, 0),
      flowChildren: document.querySelector('[data-slot="flow"]')?.children?.length ?? null,
      idxBlocks: document.querySelectorAll("[data-idx]").length,
    }
  })
  const sampleAll = async () => {
    const heap = await cdp.send("Runtime.getHeapUsage")
    const dom = await cdp.send("Memory.getDOMCounters")
    return { processes: await metrics(), heapMb: { used: MB(heap.usedSize), total: MB(heap.totalSize) }, dom, census: await census() }
  }
  /** 主进程侧输入注入（冻结期 CDP 输入不可达——渲染任务队列积压；主侧 = 浏览器侧待确认输入 ⇒ hang monitor 可达）。 */
  const tapInput = () => app.evaluate(({ webContents }) => {
    const win = webContents.getAllWebContents().find((item) => item.getType() === "window")
    if (!win || win.isCrashed()) return false
    win.sendInputEvent({ type: "mouseMove", x: 610, y: 360 })
    win.sendInputEvent({ type: "mouseDown", x: 610, y: 360, button: "left", clickCount: 1 })
    win.sendInputEvent({ type: "mouseUp", x: 610, y: 360, button: "left", clickCount: 1 })
    win.sendInputEvent({ type: "keyDown", keyCode: "Shift" })
    win.sendInputEvent({ type: "keyUp", keyCode: "Shift" })
    return true
  }).catch(() => false)
  /** 主进程侧渲染面读数（OS pid——`getProcessId()` = Chromium 内 id（实测恒 4）⇒ 用 `getOSProcessId()`）。 */
  const race = (promise, ms) => Promise.race([
    promise.then((value) => ({ ok: true, value }), (error) => ({ ok: false, value: `rej:${error.message}` })),
    sleep(ms).then(() => ({ ok: false, value: "timeout" })),
  ])
  const rendererInfo = () => race(app.evaluate(({ webContents }) => {
    const win = webContents.getAllWebContents().find((item) => item.getType() === "window")
    return win ? { osPid: win.getOSProcessId(), crashed: win.isCrashed(), url: win.getURL() } : null
  }), 6000).then((result) => (result.ok ? result.value : { error: String(result.value) }))
  /** 主进程侧恢复重读（引导位 = 恢复后收尾重读补显的观察面；崩态 ∥ 阻塞 ⇒ 竞速降级为读数）。 */
  const bootRead = () => race(app.evaluate(async ({ webContents }) => {
    const win = webContents.getAllWebContents().find((item) => item.getType() === "window")
    if (!win) return null
    const boot = await win.executeJavaScript("document.documentElement.dataset.boot").catch(() => null)
    return { osPid: win.getOSProcessId(), crashed: win.isCrashed(), boot }
  }), 8000).then((result) => (result.ok ? result.value : { error: String(result.value) }))

  // ── ① 装配（armed 副作用 = crash-reports 预建；boot ok/error）──────────────────────────────
  out.phases.assembly = { boot: await page.evaluate(() => document.documentElement.dataset.boot), crashDirCreated: existsSync(crashDir) }

  // ── ⓪ **E4-JS 引擎标定腿（前置 · §2.15-B⑦-5 ∥ §2.15-G）**：分段态 ∥ 整挂态布局 A/B——单段挂载 ≤ ~10ms 量级
  //     ∧ 巨块首挂（窗口态）≪ 基线；**不过 ⇒ 该形弃（回退整块直挂 + 停步报父侧）**。径 = 页内微基准（真核
  //     `md` + 真产品模块分区 ∥ 强制布局读数 —— 同引擎同 fixture 对拍）；失败 ⇒ 本跑停步（不跑后续 E4-JS 腿）。
  const calText = "巨块重放行 —— heap-freeze 负载逼近（592KB 级单块）。".repeat(Math.ceil((592 * 1024) / 24)).slice(0, 592 * 1024)
  out.phases.calibration = await race(page.evaluate(async ({ text }) => {
    const { md } = await import("/rc/md.mjs")
    const segs = await import(new URL("./views/chat-text-segments.mjs", document.baseURI).href)
    const flow = document.querySelector('[data-slot="flow"]')
    const box = document.createElement("div")
    box.className = "block block-assistant"
    const face = document.createElement("div")
    face.className = "block-text"
    face.setAttribute("data-raw", text)
    box.appendChild(face)
    flow.appendChild(box)
    const out = { chars: text.length, mountActive: segs.segmentMountActive() }
    try {
      // A 整挂态（= 无分段现状面）：真核 md 产出 + 强制布局
      const wholeStart = performance.now()
      face.innerHTML = md(text)
      void box.offsetHeight
      out.wholeMs = +(performance.now() - wholeStart).toFixed(1)
      // B 分段态（窗口态首挂）：真模块分区 + 初窗 ⇒ 强制布局
      const block = { kind: "assistant", text }
      const windowStart = performance.now()
      const record = segs.mountSegments(box, block, false)
      void box.offsetHeight
      out.windowMs = +(performance.now() - windowStart).toFixed(1)
      out.spans = face.querySelectorAll("span[data-seg]").length
      const shells = [...face.querySelectorAll("span[data-seg]")]
      out.visible = shells.filter((span) => span.style.display !== "none").length
      out.windowChars = face.textContent.length
      out.windowEq = face.textContent === text
      out.window = record === null ? null : { count: record.count, first: record.window.first, last: record.window.last }
      // C 单段窗步（卸一挂一 + 强制布局 —— 帧步成本量级）
      const stepStart = performance.now()
      if (shells[2]) shells[2].style.display = ""
      if (shells[0]) shells[0].style.display = "none"
      void box.offsetHeight
      out.stepMs = +(performance.now() - stepStart).toFixed(1)
      // 回滚形③ 现场直取（A/B 缝）：关态 ⇒ 零分区
      segs.setSegmentMount(false)
      out.offActive = segs.segmentMountActive()
      segs.setSegmentMount(true)
    } finally {
      box.remove()
    }
    return out
  }, { text: calText }), 180000).then((result) => (result.ok ? result.value : { error: String(result.value) }))
  out.calibrationVerdict = {
    windowFast: (out.phases.calibration?.windowMs ?? 1e9) <= 150 && (out.phases.calibration?.stepMs ?? 1e9) <= 50,
    layoutSaved: (out.phases.calibration?.wholeMs ?? 0) >= 1000
      && (out.phases.calibration?.windowMs ?? 1e9) * 10 <= (out.phases.calibration?.wholeMs ?? 0),
    windowEq: out.phases.calibration?.windowEq === true,
    formApplied: out.phases.calibration?.mountActive === true && out.phases.calibration?.offActive === false,
  }
  out.calibrationPass = Object.values(out.calibrationVerdict).every((value) => value === true)
  if (out.calibrationPass !== true) {
    // 弃形停步（§2.15-G：不过 ⇒ 回退整块直挂 + 报父侧）——读数已落，中断本跑
    out.aborted = "e4js-calibration"
    throw new Error(`e4js calibration failed: ${JSON.stringify(out.calibrationVerdict)}`)
  }

  // ── ② 基线 → 快照#1 → 负载逼近 → 快照#2 → 快照 diff（按构造器）────────────────────────────
  out.phases.baseline = await sampleAll()
  const snap1 = await takeHeapSnapshot(cdp, join(snapDir, "hf-baseline.heapsnapshot"))
  const drive = (kind) => page.evaluate(async ({ kind, chunkCount, bigChars }) => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
    const key = "hf-probe"
    const raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    // E4 腿① ∥ ②（批档 §2.14-C）：long-task（>50ms）观测 + 帧间隔采样——两负载（巨块重放 ∥ 8000 chunk 回放）同径
    const longTasks = []
    const po = new PerformanceObserver((list) => { for (const entry of list.getEntries()) longTasks.push(Math.round(entry.duration)) })
    try { po.observe({ entryTypes: ["longtask"] }) } catch { /* 观测面缺 ⇒ 该读数缺席（非阻断） */ }
    const frames = []
    let prevFrame = performance.now()
    let ticking = true
    const tick = () => { const now = performance.now(); frames.push(+(now - prevFrame).toFixed(1)); prevFrame = now; if (ticking) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
    const started = performance.now()
    let text = ""
    if (kind === "bigBlock") { // 巨块重放（592KB 级单块——E4 面）
      text = "巨块重放行 —— heap-freeze 负载逼近（592KB 级单块）。".repeat(Math.ceil(bigChars / 24)).slice(0, bigChars)
      store.set(reduce(store.get(), { channel: "ev:token", key, text }))
    } else {
      store.set({ activeSession: key, blocks: [], subBlocks: { [key]: [] } })
      await raf2()
      for (let agent = 1; agent <= 2; agent += 1) { // 子代理终报回放（§1.3c 线索面——逐 chunk 追加）
        const id = `hf${agent}`
        store.set(reduce(store.get(), { channel: "ev:subagent", key, status: "started", role: "advisor", id, model: "probe" }))
        for (let index = 0; index < Math.floor(chunkCount / 2); index += 1) {
          store.set(reduce(store.get(), { channel: "ev:subchunk", key, role: "advisor", id, kind: "think", text: `推理流片段 ${index} —— heap-freeze 负载逼近（逐 chunk 追加，不合并）。` }))
        }
        store.set(reduce(store.get(), { channel: "ev:subagent", key, status: "done", role: "advisor", id }))
      }
    }
    await raf2()
    const ms = Math.round(performance.now() - started) // 同径（store.set + raf2——与 1d 基线 18115ms 同构对拍面）
    // 渲染真落（帧合并可跳帧 ⇒ 尾帧可晚于 raf2）：轮询至目标面在场（≤60s）——另记 settleMs（读数面）
    const landed = () => (kind === "bigBlock"
      ? (document.querySelector('[data-block-kind="assistant"] [data-raw]')?.textContent.length ?? -1) === bigChars
      : document.querySelectorAll(".advisor-text").length >= 2)
    const deadline = performance.now() + 60000
    let settle = false
    while (performance.now() < deadline) { if (landed()) { settle = true; break } await new Promise((r) => setTimeout(r, 200)) }
    ticking = false
    await new Promise((r) => setTimeout(r, 300)) // 观测尾条目收口（long-task 条目随任务收尾派发）
    po.disconnect()
    const face = kind === "bigBlock" ? document.querySelector('[data-block-kind="assistant"] [data-raw]') : null
    const block = kind === "bigBlock" ? document.querySelector('[data-block-kind="assistant"]') : null
    return {
      ms, settleMs: Math.round(performance.now() - started), settle,
      bigChars: kind === "bigBlock" ? bigChars : undefined, chunkCount: kind === "flood" ? chunkCount : undefined,
      longTasks, frames, frameMax: frames.length > 0 ? Math.max(...frames) : null,
      chars: face ? face.textContent.length : undefined, eq: face ? face.textContent === text : undefined,
      blockHeight: block ? block.offsetHeight : undefined,
      flowScrollHeight: document.querySelector('[data-slot="flow"]')?.scrollHeight ?? null,
    }
  }, { kind, chunkCount: 8000, bigChars: 592 * 1024 })
  out.phases.load = { flood: await drive("flood") }
  await sleep(1500) // 帧收敛（FRAME_MIN_MS = 50 窗 + 重排）
  out.phases.loadedFlood = await sampleAll()
  const snap2 = await takeHeapSnapshot(cdp, join(snapDir, "hf-loaded.heapsnapshot"))
  out.phases.snapshotLanding = { baseline: snap1, loaded: snap2 }
  out.phases.snapshotDiff = snapshotDiff(snap1.path, snap2.path)
  out.phases.load.bigBlock = await drive("bigBlock")
  await sleep(1500)
  out.phases.loadedBigBlock = await sampleAll()
  await cdp.send("HeapProfiler.collectGarbage").catch(() => { /* 归一读失败零阻断 */ })
  await sleep(1000)
  out.phases.gcNormalized = await sampleAll()

  // ── ⓪′ **E4-JS 支（§2.15-B⑦ ①/②/④/⑥）**：窗态 census（G1/G2）∥ 滚过腿（有界性：每帧段变更 ≤2 ∥ 可见段 ≤4
  //     ∥ 锚偏）∥ 流式合成（增长期窗保持 ∥ 零长任务）∥ 恢复合成（重挂转移：窗集不变）——巨块 = 现活动会话项面 ──
  const e4js = { session: "hf-probe" }
  const giantCensus = () => page.evaluate(() => {
    const faces = [...document.querySelectorAll("[data-raw]")]
    const face = faces.sort((a, b) => b.textContent.length - a.textContent.length)[0] ?? null
    if (face === null) return null
    const shells = [...face.querySelectorAll("span[data-seg]")]
    const visible = shells.filter((span) => span.style.display !== "none").map((span) => Number(span.getAttribute("data-seg")))
    const chunks = shells.map((span) => span.textContent).join("")
    return {
      text: face.textContent.length, spans: shells.length, visible,
      visibleMin: visible.length > 0 ? Math.min(...visible) : null,
      visibleMax: visible.length > 0 ? Math.max(...visible) : null,
      joined: chunks.length, joinedPrefix: face.textContent.startsWith(chunks),
      blockHeight: face.closest("[data-block-kind]")?.offsetHeight ?? null,
    }
  })
  try {
    e4js.window = await giantCensus()
    e4js.scroll = await race(page.evaluate(async () => {
      const { store } = await import(new URL("./store.mjs", document.baseURI).href)
      const flow = document.querySelector('[data-slot="flow"]')
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const raf2 = async () => { await new Promise((resolve) => requestAnimationFrame(resolve)); await new Promise((resolve) => requestAnimationFrame(resolve)) }
      const face = [...document.querySelectorAll("[data-raw]")].sort((a, b) => b.textContent.length - a.textContent.length)[0] ?? null
      const out = { steps: 0, changes: 0, maxPerFrame: 0, visibleMax: 0, driftMax: 0, segMin: null, segMax: null, tasks: [] }
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
      try { po.observe({ entryTypes: ["longtask"] }) } catch { /* 观测面缺 ⇒ 读数缺席（非阻断） */ }
      const block = face.closest("[data-block-kind]")
      const bandTop = () => flow.getBoundingClientRect().top
      const blockTop = block.getBoundingClientRect().top - bandTop() + flow.scrollTop
      flow.scrollTop = Math.max(0, blockTop + 400)
      flow.dispatchEvent(new Event("scroll"))
      await raf2(); await sleep(250)
      const sample = () => {
        const shells = [...face.querySelectorAll("span[data-seg]")]
        const vis = shells.filter((span) => span.style.display !== "none").map((span) => Number(span.getAttribute("data-seg")))
        out.visibleMax = Math.max(out.visibleMax, vis.length)
        if (vis.length > 0) {
          out.segMin = out.segMin === null ? Math.min(...vis) : Math.min(out.segMin, ...vis)
          out.segMax = out.segMax === null ? Math.max(...vis) : Math.max(out.segMax, ...vis)
        }
        out.visibleNow = vis
        return vis.length
      }
      sample()
      // 视口顶锚 = **内容锚**（Range 随 DOM 变更自复位 —— 视口顶的文本位）；逐步重取（步前）——段窗挂 ∥ 卸后锚偏判据面
      const caretAt = () => {
        const rect = flow.getBoundingClientRect()
        const seed = typeof document.caretRangeFromPoint === "function" ? document.caretRangeFromPoint(rect.left + 40, rect.top + 40) : null
        if (seed === null) return null
        try { seed.setEnd(seed.startContainer, seed.startOffset + 1) } catch { /* 坍缩锚（位仍有义） */ }
        return seed
      }
      const topOf = (range) => {
        if (range === null) return null
        const box = range.getBoundingClientRect()
        return box.height === 0 && box.top === 0 ? null : +box.top.toFixed(2)
      }
      let measured = 0
      for (let index = 0; index < 30; index += 1) {
        const range = caretAt()
        const before = topOf(range)
        const scrollBefore = flow.scrollTop
        const intended = Math.max(0, scrollBefore - 1200) // 用户写（引擎鉗位）
        const pinned = intended <= 0 || scrollBefore <= 0 // 顶缘钉死 ⇒ 补偿无位可写 ⇒ 本步不入锚偏判（读数面记 pinned）
        const visBefore = [...face.querySelectorAll("span[data-seg]")].filter((span) => span.style.display !== "none").map((span) => Number(span.getAttribute("data-seg")))
        flow.scrollTop = intended
        flow.dispatchEvent(new Event("scroll"))
        await raf2(); await sleep(120)
        out.steps += 1
        const visAfter = sample()
        const after = topOf(range)
        const drift = before === null || after === null || pinned ? null : +((after - before) + (intended - scrollBefore)).toFixed(2)
        if (pinned) out.pinned = (out.pinned ?? 0) + 1
        if (drift === null) {
          out.anchorSkipped = (out.anchorSkipped ?? 0) + 1
        } else {
          out.driftMax = Math.max(out.driftMax, Math.abs(drift))
          measured += 1
          if (Math.abs(drift) > 1 && (out.hot ?? []).length < 6) {
            out.hot = out.hot ?? []
            out.hot.push({ step: index, drift, before, after, intended, scrollAfter: Math.round(flow.scrollTop), visBefore, visAfter })
          }
        }
      }
      out.driftMeasured = measured
      ticking = false
      observer.disconnect()
      await sleep(350)
      po.disconnect()
      out.maxPerFrame = perFrame.size > 0 ? Math.max(...perFrame.values()) : 0
      out.tasks = tasks
      out.frames = perFrame.size
      out.crossed = out.segMin === null || out.segMax === null ? 0 : out.segMax - out.segMin
      out.top = Math.round(flow.scrollTop)
      return out
    }), 90000).then((result) => (result.ok ? result.value : { error: String(result.value) }))
    e4js.windowAfterScroll = await giantCensus()
    e4js.streaming = await race(page.evaluate(async ({ bigChars }) => {
      const { store } = await import(new URL("./store.mjs", document.baseURI).href)
      const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const raf2 = async () => { await new Promise((resolve) => requestAnimationFrame(resolve)); await new Promise((resolve) => requestAnimationFrame(resolve)) }
      const key = store.get().activeSession
      const tasks = []
      const po = new PerformanceObserver((list) => { for (const entry of list.getEntries()) tasks.push(Math.round(entry.duration)) })
      try { po.observe({ entryTypes: ["longtask"] }) } catch { /* 缺席非阻断 */ }
      store.set({ following: true, blocks: [], pendingNew: 0 })
      await raf2()
      const fixture = "流式合成腿片段 —— heap-freeze E4-JS（增长期窗保持 ∥ 零长任务）。"
      const steps = 24
      const per = Math.ceil(bigChars / steps)
      const windows = []
      let text = ""
      const started = performance.now()
      for (let index = 1; index <= steps; index += 1) {
        const chunk = fixture.repeat(Math.ceil((per * index) / fixture.length)).slice(per * (index - 1), per * index) // `ev:token` = **续写语义**（增量块）
        text += chunk
        store.set(reduce(store.get(), { channel: "ev:token", key, text: chunk }))
        await raf2()
        await sleep(90)
        const face = document.querySelector('[data-block-kind="assistant"] [data-raw]')
        if (face === null) continue
        const shells = [...face.querySelectorAll("span[data-seg]")]
        const vis = shells.filter((span) => span.style.display !== "none").map((span) => Number(span.getAttribute("data-seg")))
        windows.push({ step: index, chars: text.length, spans: shells.length, visible: vis })
      }
      await sleep(500)
      po.disconnect()
      const face = document.querySelector('[data-block-kind="assistant"] [data-raw]')
      const shells = face === null ? [] : [...face.querySelectorAll("span[data-seg]")]
      const vis = shells.filter((span) => span.style.display !== "none").map((span) => Number(span.getAttribute("data-seg")))
      const tail = shells.length - 1
      return {
        ms: Math.round(performance.now() - started), steps, chars: text.length, spans: shells.length,
        eq: face !== null && face.textContent === text, visible: vis,
        faceChars: face === null ? 0 : face.textContent.length,
        follows: vis.includes(tail), tail,
        windowMoved: windows.length > 1 && (windows[windows.length - 1].visible[0] ?? 0) > (windows[0].visible[0] ?? 0),
        windows: windows.slice(-3), tasks,
      }
    }, { bigChars: 592 * 1024 }), 180000).then((result) => (result.ok ? result.value : { error: String(result.value) }))
    e4js.remount = await race(page.evaluate(async () => {
      const { store } = await import(new URL("./store.mjs", document.baseURI).href)
      const { mountChat } = await import(new URL("./views/chat.mjs", document.baseURI).href)
      const flow = document.querySelector('[data-slot="flow"]')
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const raf2 = async () => { await new Promise((resolve) => requestAnimationFrame(resolve)); await new Promise((resolve) => requestAnimationFrame(resolve)) }
      const faceOf = () => [...document.querySelectorAll("[data-raw]")].sort((a, b) => b.textContent.length - a.textContent.length)[0] ?? null
      const visOf = (face) => [...face.querySelectorAll("span[data-seg]")]
        .filter((span) => span.style.display !== "none").map((span) => Number(span.getAttribute("data-seg")))
      const before = faceOf()
      const tasks = []
      const po = new PerformanceObserver((list) => { for (const entry of list.getEntries()) tasks.push(Math.round(entry.duration)) })
      try { po.observe({ entryTypes: ["longtask"] }) } catch { /* 缺席非阻断 */ }
      const visibleBefore = before === null ? [] : visOf(before)
      const spansBefore = before === null ? 0 : before.querySelectorAll("span[data-seg]").length
      const started = performance.now()
      mountChat(flow, store.get(), {}, 150) // 真重挂径（paintChat remount 同函数）
      await raf2()
      await sleep(250)
      po.disconnect()
      const after = faceOf()
      const visibleAfter = after === null ? [] : visOf(after)
      return {
        ms: Math.round(performance.now() - started), spansBefore, spansAfter: after === null ? 0 : after.querySelectorAll("span[data-seg]").length,
        visibleBefore, visibleAfter,
        transferOk: visibleBefore.length > 0 && visibleBefore.join(",") === visibleAfter.join(","),
        chars: after === null ? 0 : after.textContent.length, tasks,
      }
    }), 90000).then((result) => (result.ok ? result.value : { error: String(result.value) }))
  } catch (error) {
    e4js.error = String(error?.stack ?? error)
  }
  out.phases.e4js = e4js
  // **中段落盘**（E4-JS 腿已定 —— 后续相位（冻结门 ∥ D9 ∥ E4 三腿）若超时被断，本段读数不丢）
  out.partial = "e4js-landed"
  writeFileSync(join(REPO, ".thincoder", "tmp", "2026-09-30-desktop-heap-freeze-readings.json"), `${JSON.stringify(out, null, 2)}\n`)

  // ── ③ 冻结门 F1（自复径）：先清场（洪峰卸压——冻结门与堆量无关）⇒ 20s 自限忙环 ⇒ 宽限内 responsive ──
  await page.evaluate(async () => { const { store } = await import(new URL("./store.mjs", document.baseURI).href); store.set({ blocks: [], subBlocks: {} }) })
  await cdp.send("HeapProfiler.collectGarbage").catch(() => {})
  await sleep(2000)
  const seen = new Set(readScenes(crashDir).map((entry) => entry.name))
  const waitScene = async (predicate, timeoutMs) => {
    const deadline = Date.now() + timeoutMs
    for (;;) {
      const hit = readScenes(crashDir).find((entry) => !seen.has(entry.name) && predicate(entry.scene))
      if (hit) return hit
      if (Date.now() > deadline) return null
      await sleep(1500)
    }
  }
  const f1Start = Date.now()
  const tapLog = { sent: 0 }
  const focusState = await race(app.evaluate(({ BrowserWindow }) => { const win = BrowserWindow.getAllWindows()[0]; win.show(); win.focus(); return win.isFocused() }), 5000).then((result) => (result.ok ? result.value : String(result.value)))
  void page.evaluate(() => { const t0 = performance.now(); while (performance.now() - t0 < 12000) { /* spin */ } return "self-ended" }).catch(() => {})
  const taps1 = setInterval(() => { void tapInput().then((ok) => { if (ok) tapLog.sent += 1 }) }, 1200)
  const f1 = await waitScene((scene) => {
    const types = (scene.actions ?? []).map((action) => action.type)
    return types.includes("responsive") || types.some((type, index) => type === "reload" && scene.actions[index].skipped !== true)
  }, 60000)
  clearInterval(taps1)
  if (f1 !== null) seen.add(f1.name) // F2 谓词只认 F1 之后的**新**现场
  let productSnapshots = []
  if (f1 !== null) {
    const deadline = Date.now() + 45000
    for (;;) {
      productSnapshots = sceneFiles(crashDir).map((name) => ({ name, bytes: statSync(join(crashDir, name)).size }))
      if (productSnapshots.length > 0 || Date.now() > deadline) break
      await sleep(2000)
    }
  }
  const f1SelfHeal = f1 !== null && (f1.scene.actions ?? []).some((action) => action.type === "responsive")
  out.phases.freezeSelfHeal = f1 === null ? { triggered: false, tapsSent: tapLog.sent, focused: focusState, note: "60s 内未见现场（12s 自限环内 unresponsive 未触发——触发时延标定：>12s）" } : {
    triggered: true,
    resolution: f1SelfHeal ? "responsive" : "kill",
    latencyMs: f1.scene.actions[0].at - f1Start,
    tapsSent: tapLog.sent,
    focused: focusState,
    trigger: f1.scene.trigger,
    source: f1.scene.source,
    actions: f1.scene.actions.map((action) => action.type),
    snapshot: f1.scene.snapshot,
    productSnapshots,
    scene: f1.scene,
  }

  // ── ④ 冻结门 F2（转 reload 径）：无限忙环 + 主侧输入 ⇒ 宽限 ⇒ kill+reload ⇒ 换代 + 存活 + 重读 ──
  try { await cdp.detach() } catch { /* 已断——尽力面 */ } // 快照已取尽：卸 CDP 会话（减 kill 期断言面）
  const f2Start = Date.now()
  const rendererBefore = await rendererInfo()
  const tapLog2 = { sent: 0 }
  void page.evaluate(() => { for (;;) { /* spin */ } }).catch(() => {})
  const taps2 = setInterval(() => { void tapInput().then((ok) => { if (ok) tapLog2.sent += 1 }) }, 1500)
  const f2 = await waitScene((scene) => (scene.actions ?? []).some((action) => action.type === "reload" && action.skipped !== true), 150000)
  clearInterval(taps2)
  let rendererAfter = null
  if (f2 !== null) {
    const deadline = Date.now() + 45000
    for (;;) {
      rendererAfter = await bootRead()
      if (rendererAfter?.boot === "ok" && rendererAfter.osPid !== rendererBefore?.osPid) break
      if (Date.now() > deadline) break
      await sleep(1500)
    }
  }
  const f2Final = f2 === null ? null : readScenes(crashDir).find((entry) => entry.name === f2.name)
  out.phases.freezeKill = f2 === null ? { triggered: false, tapsSent: tapLog2.sent, note: "150s 内未见 reload 径（unresponsive ∥ ping 径皆未达）" } : {
    triggered: true,
    latencyMs: f2.scene.actions[0].at - f2Start,
    tapsSent: tapLog2.sent,
    trigger: f2.scene.trigger,
    source: f2.scene.source,
    actions: f2Final?.scene.actions ?? f2.scene.actions,
    snapshot: f2Final?.scene.snapshot ?? f2.scene.snapshot,
    renderer: {
      before: rendererBefore, after: rendererAfter,
      replaced: (rendererAfter?.osPid ?? 0) > 0 && rendererAfter?.osPid !== rendererBefore?.osPid,
      recoveredBoot: rendererAfter?.boot === "ok",
    },
    appAlive: await app.evaluate(() => 1).then(() => true, () => false),
  }

  const scenes = readScenes(crashDir) // F2 后基线（D9 手工撞前——`noStandaloneGoneScene` 判据面）

  // ── ⑤ D9 补启（§2.14a · 用户 02:08 实报缺口）：真开项目 + 真 create/resume + 真通道子代理事件 ⇒
  //    手工 `forcefullyCrashRenderer()` + gone 驱动 reload ⇒ **活跃会话自动回**（零手选）+ 重读存量页 + 在飞随流 ──
  //    （`noStandaloneGoneScene` 已按上句 `scenes` 判——本腿手工撞产生的独立 gone 现场不入该判据。）
  // ── 共享执行缝（D9 ∥ E4 同径）：主侧 `executeJavaScript`（重载后 page 句柄亡 ⇒ 主侧径）──
  const execPage = (code, ms = 20000) => race(app.evaluate(async ({ webContents }, src) => {
    const win = webContents.getAllWebContents().find((item) => item.getType() === "window")
    if (!win || win.isCrashed() || win.isDestroyed()) return null
    return win.executeJavaScript(src)
  }, code), ms).then((result) => (result.ok ? result.value : { error: String(result.value) }))
  const bridge = (channel, payload) => race(app.evaluate(async ({ webContents }, args) => {
    const win = webContents.getAllWebContents().find((item) => item.getType() === "window")
    if (!win || win.isCrashed()) return null
    return win.executeJavaScript(`window.thincoder.invoke(${JSON.stringify(args.channel)}, ${JSON.stringify(args.payload)})`)
  }, { channel, payload: payload ?? null }), 30000).then((result) => (result.ok ? result.value : { error: String(result.value) }))
  const readStore = () => race(app.evaluate(async ({ webContents }) => {
    const win = webContents.getAllWebContents().find((item) => item.getType() === "window")
    if (!win || win.isCrashed()) return null
    return win.executeJavaScript(`(async () => {
      const { store } = await import(new URL("./store.mjs", document.baseURI).href)
      const state = store.get()
      const rows = {}
      for (const [key, list] of Object.entries(state.subBlocks ?? {})) rows[key] = (list ?? []).map((block) => ({ key: block?.key ?? null, frozen: block?.frozen === true, rows: (block?.rows ?? []).length }))
      return {
        boot: document.documentElement.dataset.boot, activeSession: state.activeSession, projectCwd: state.project?.cwd ?? null,
        sessionMetaKeys: Object.keys(state.sessionMeta ?? {}), subRows: rows, poolRunning: state.pool?.running ?? null,
        blockTexts: (state.blocks ?? []).map((block) => (typeof block?.text === "string" ? block.text.slice(0, 60) : block?.kind ?? null)),
      }
    })()`)
  }), 8000).then((result) => (result.ok ? result.value : { error: String(result.value) }))
  const stageActive = (slot) => app.evaluate(async ({ webContents }, key) => {
    const win = webContents.getAllWebContents().find((item) => item.getType() === "window")
    if (!win || win.isCrashed()) return null
    return win.executeJavaScript(`(async () => { const { store } = await import(new URL("./store.mjs", document.baseURI).href); store.set({ activeSession: ${JSON.stringify(key)} }); return store.get().activeSession })()`)
  }, slot).catch(() => null)
  const postEv = (channel, payload) => app.evaluate(({ webContents }, args) => {
    const win = webContents.getAllWebContents().find((item) => item.getType() === "window")
    if (!win || win.isCrashed() || win.isDestroyed()) return false
    win.send(args.channel, args.payload)
    return true
  }, { channel, payload }).catch(() => false)

  const d9 = { manualSelection: false, marker: "D9-MARK 存量页标记 —— 重载补启真机腿" }
  try {

    d9.project = REPO // 项目锚 = 仓根（`PROJECT-MANIFEST.json` 在场 ⇒ 台账族发现浅——临时目录锚会引爆祖先大目录扫描）
    d9.opened = await bridge("project:open", { fsPath: REPO })
    d9.created = await bridge("session:create", null)
    d9.resumed = await bridge("session:resume", null)
    const slot = String(d9.resumed?.slot ?? "")
    d9.slot = slot
    // 存量页标记：沙箱槽文件直写一条核历史行（重载后「重读面读盘」的证据面——形 = `{ role, content, ts }`）
    const slotName = existsSync(sessionsDir) ? readdirSync(sessionsDir).find((name) => name.endsWith(`.json.${slot}`)) : undefined
    d9.slotFile = slotName ?? null
    if (slotName !== undefined) {
      const file = join(sessionsDir, slotName)
      const data = JSON.parse(readFileSync(file, "utf8"))
      data.history = [...(Array.isArray(data.history) ? data.history : []), { role: "user", content: d9.marker, ts: Date.now() }]
      writeFileSync(file, JSON.stringify(data))
    }
    d9.staged = await stageActive(slot)

    // 预撞现场：真通道 `ev:subagent` started + 内容 chunk（在飞形态——无 done）
    await postEv("ev:subagent", { key: slot, status: "started", role: "advisor", id: "hf-d9", model: "probe" })
    for (let i = 0; i < 3; i += 1) {
      await postEv("ev:subchunk", { key: slot, role: "advisor", id: "hf-d9", kind: "think", text: `在飞推理片段 ${i} —— D9 重载补启腿（真通道）。` })
    }
    await sleep(800)
    d9.preReload = await readStore()

    // 手工撞 + gone 驱动 reload（产品恢复序同法——诊断实录 = 批档 §5 · A1/A2/B 三格）
    d9.rendererBefore = await rendererInfo()
    d9.reload = await race(app.evaluate(({ webContents }) => new Promise((resolve) => {
      const win = webContents.getAllWebContents().find((item) => item.getType() === "window")
      if (!win) return resolve({ ok: false, reason: "no-window" })
      let fired = false
      const go = () => { if (fired) return; fired = true; try { win.reload() } catch { /* 已亡——尽力面 */ } resolve({ ok: true }) }
      win.once("render-process-gone", go)
      setTimeout(go, 5000)
      try { win.forcefullyCrashRenderer() } catch { go() }
    })), 12000).then((result) => (result.ok ? result.value : { error: String(result.value) }))

    // 等新渲染进程 boot ok + 重读面落（`sessionMeta` 写入 = `applyPage` 已跑——补启在 `settleBoot` 前 await）
    const deadline = Date.now() + 60000
    let after = null
    for (;;) {
      after = await readStore()
      if (after?.boot === "ok" && (after?.sessionMetaKeys ?? []).includes(slot)) break
      if (Date.now() > deadline) break
      await sleep(1200)
    }
    d9.rendererAfter = await rendererInfo()
    d9.autoReturn = after
    d9.autoReturnOk = after?.boot === "ok" && after?.activeSession === slot && after?.projectCwd === REPO
      && d9.rendererAfter?.osPid > 0 && d9.rendererAfter?.osPid !== d9.rendererBefore?.osPid
      && (after?.sessionMetaKeys ?? []).includes(slot)
    d9.pageReloadOk = (after?.blockTexts ?? []).some((text) => typeof text === "string" && text.includes("D9-MARK"))

    // 重载后在飞随流（真通道 —— 同一子代理续流；生产侧 = 存活投影重投同义）
    await postEv("ev:subagent", { key: slot, status: "started", role: "advisor", id: "hf-d9", model: "probe" })
    for (let i = 0; i < 3; i += 1) {
      await postEv("ev:subchunk", { key: slot, role: "advisor", id: "hf-d9", kind: "think", text: `重载后续流片段 ${i} —— 在飞子代理态随流。` })
    }
    await sleep(800)
    d9.postReload = await readStore()
    const live = (d9.postReload?.subRows?.[slot] ?? []).find((block) => block?.key === "sub:advisor#hf-d9" && block?.frozen !== true)
    d9.subagentLiveOk = live != null && (d9.postReload?.poolRunning ?? 0) >= 1
  } catch (error) {
    d9.error = String(error?.stack ?? error)
  }
  out.phases.d9 = d9

  // ── ⑥ E4 巨块渲染夹层（CSS 落层 · 批档 §2.14-B ∕ §2.14-C）四腿读数：腿① ∥ ② = 上两载同径读数（longTasks ∥ frames——
  //    见 `phases.load.flood` ∥ `.bigBlock`）；腿③ = 巨块逐字等价（drive 内读 `chars` ∥ `eq`）；腿④ = 回填 ∕ 跟滚不跳
  //    （T-DSK18 ∥ T-DSK19 同判据——真会话 + 真 `history:page` 回填；高度确定性 = CSS 不含 `size` 前置）──
  const e4 = { cssApplied: null, session: null }
  try {
    // （0）CSS 落层断言（CSS 无 `node --check` ⇒ 探针面）：四容器 computed `contain` = "layout style paint"
    e4.cssApplied = await execPage(`(() => {
      const wrap = document.createElement("div"); wrap.style.display = "none"; document.body.appendChild(wrap)
      const out = {}
      for (const [name, cls] of [["block", "block"], ["blockText", "block-text"], ["reasoning", "reasoning-content"], ["advisor", "advisor-content"]]) {
        const el = document.createElement("div"); el.className = cls; wrap.appendChild(el)
        out[name] = getComputedStyle(el).contain
      }
      wrap.remove()
      return out
    })()`)
    // （i）真会话 + 两页历史（260 行 = 130 对 ⇒ 首屏页读取末 200 行、hasOlder true）——开会话走**渲染面真径**
    //（`session-wire.mjs` 包装件：`openPage` + `loadPage` —— 裸 IPC invoke 不开页，仅主侧建槽）
    const created = await execPage(`(async () => { const m = await import(new URL("./session-wire.mjs", document.baseURI).href); await m.createSession(); const { store } = await import(new URL("./store.mjs", document.baseURI).href); return { active: store.get().activeSession } })()`, 30000)
    const slot = String(created?.active ?? "")
    e4.session = { created, slot }
    const slotName = existsSync(sessionsDir) ? readdirSync(sessionsDir).find((name) => name.endsWith(`.json.${slot}`)) : undefined
    e4.session.slotFile = slotName ?? null
    if (slotName !== undefined) {
      const file = join(sessionsDir, slotName)
      const data = JSON.parse(readFileSync(file, "utf8"))
      const rows = []
      for (let index = 1; index <= 130; index += 1) {
        rows.push({ role: "user", content: `E4 回填腿 · 对 ${index} 用户侧 —— 更早页（首屏窗外）。`, ts: Date.now() - (130 - index) * 2000 })
        rows.push({ role: "assistant", content: `E4 回填腿 · 对 ${index} 助手侧 —— 更早页（首屏窗外）。`, ts: Date.now() - (130 - index) * 2000 + 500 })
      }
      data.history = [...(Array.isArray(data.history) ? data.history : []), ...rows]
      writeFileSync(file, JSON.stringify(data))
    }
    e4.session.resumed = await execPage(`(async () => { const m = await import(new URL("./session-wire.mjs", document.baseURI).href); await m.resumeOpened(); return true })()`, 30000)
    const loadDeadline = Date.now() + 30000
    let pageState = null
    for (;;) {
      pageState = await execPage(`(async () => { const { store } = await import(new URL("./store.mjs", document.baseURI).href); const state = store.get(); return { boot: document.documentElement.dataset.boot, active: state.activeSession, blocks: (state.blocks ?? []).length, hasOlder: state.history?.hasOlder ?? null, page: state.history?.page ?? null, meta: Object.keys(state.sessionMeta ?? {}) } })()`)
      if (pageState?.active === slot && (pageState?.blocks ?? 0) >= 150 && (pageState?.meta ?? []).includes(slot)) break
      if (Date.now() > loadDeadline) break
      await sleep(1000)
    }
    e4.session.page = pageState
    // （i′）**E4-JS 合成腿前置**（§2.15-B⑦-6）：向本会话注入巨块（真通道 `ev:token` —— 592KB 级单块）——
    // 下列三腿（跟滚 ∥ 停跟 ∥ 回填）在**巨块在场**下跑（段窗 ∥ 回填 ∥ 跟滚三径并行 ∥ 段链稳定判据面）
    e4.giant = await execPage(`(async () => {
      const { store } = await import(new URL("./store.mjs", document.baseURI).href)
      const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
      const key = ${JSON.stringify(slot)}
      const fixture = "巨块合成腿 —— E4-JS 回填 ∥ 跟滚 ∥ 停跟并行（592KB 级单块）。"
      const text = fixture.repeat(${Math.ceil((592 * 1024) / 24)}).slice(0, ${592 * 1024})
      store.set(reduce(store.get(), { channel: "ev:token", key, text }))
      await new Promise((resolve) => setTimeout(resolve, 1200))
      const giant = [...document.querySelectorAll("[data-raw]")].sort((a, b) => b.textContent.length - a.textContent.length)[0] ?? null
      return {
        injected: giant !== null, chars: giant === null ? 0 : giant.textContent.length,
        eq: giant !== null && giant.textContent === text,
        spans: giant === null ? 0 : giant.querySelectorAll("span[data-seg]").length,
        visible: giant === null ? [] : [...giant.querySelectorAll("span[data-seg]")].filter((span) => span.style.display !== "none").map((span) => Number(span.getAttribute("data-seg"))),
      }
    })()`, 90000)
    // （ii）腿④-a 跟滚贴底 ∥ （iii）腿④-b 停跟不跳 ∥ （iv）腿④-c 回填不跳（单脚本单语境——节点引用跨帧保持）
    // 注：巨块在场 ⇒ 帧内需容段窗滑动（每帧一步 —— 步成本 ~10ms 量级）；超时宽限 ⇒ 180s（时长本身 = 读数面）
    const legs = await execPage(`(async () => {
      const { store } = await import(new URL("./store.mjs", document.baseURI).href)
      const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
      const slot = ${JSON.stringify(slot)}
      const flow = document.querySelector('[data-slot="flow"]')
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      const raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
      const metrics = () => ({ scrollTop: Math.round(flow.scrollTop), scrollHeight: Math.round(flow.scrollHeight), clientHeight: Math.round(flow.clientHeight) })
      const topNode = () => { for (const node of flow.querySelectorAll("[data-block-kind]")) { if (node.getBoundingClientRect().bottom > 2) return node } return null }
      const topOf = (node) => (node && node.isConnected ? +node.getBoundingClientRect().top.toFixed(1) : null)
      const out = {}
      // （a）跟滚贴底（T-DSK19 前半）：复跟 ⇒ 新块到达 ⇒ 贴底、无药丸
      store.set({ following: true, pendingNew: 0 })
      await raf2(); await sleep(150)
      const beforeA = metrics()
      store.set(reduce(store.get(), { channel: "ev:token", key: slot, text: "E4 跟滚腿 —— 新块到达（贴底判据面）。" }))
      await raf2(); await sleep(250)
      const afterA = metrics()
      out.follow = { following: store.get().following, atBottom: flow.scrollHeight - flow.scrollTop - flow.clientHeight <= 2, pill: flow.querySelector("[data-pill]") !== null, before: beforeA, after: afterA }
      out.follow.ok = out.follow.following === true && out.follow.atBottom === true && out.follow.pill === false
      // （b）停跟不跳（T-DSK19 后半）：上滚中段 ⇒ scroll ⇒ 停跟 ⇒ 追加三新块 ⇒ 锚不动 + 药丸在场（滚位按头侧补偿随动——读数）
      flow.scrollTop = Math.max(0, Math.round((flow.scrollHeight - flow.clientHeight) / 2))
      flow.dispatchEvent(new Event("scroll"))
      await raf2(); await sleep(200)
      const nodeB = topNode()
      const topB = topOf(nodeB)
      const beforeB = metrics()
      store.set(reduce(store.get(), { channel: "ev:token", key: slot, text: "E4 停跟腿 —— 新块一（视口不跳判据面）。".repeat(6) }))
      store.set(reduce(store.get(), { channel: "ev:reasoning", key: slot, text: "E4 停跟腿 —— 新推理块（追加段二）。".repeat(4) }))
      store.set(reduce(store.get(), { channel: "ev:token", key: slot, text: "E4 停跟腿 —— 新块三（视口不跳判据面）。".repeat(6) }))
      await raf2(); await sleep(300)
      const afterB = metrics()
      const topB2 = topOf(nodeB)
      out.unfollow = {
        following: store.get().following, pill: flow.querySelector("[data-pill]") !== null,
        anchorId: nodeB?.getAttribute("data-block-id") ?? null, anchorConnected: nodeB?.isConnected === true,
        anchorTopBefore: topB, anchorTopAfter: topB2,
        anchorDelta: topB !== null && topB2 !== null ? +(topB2 - topB).toFixed(1) : null,
        scrollDelta: afterB.scrollTop - beforeB.scrollTop, before: beforeB, after: afterB,
      }
      out.unfollow.ok = out.unfollow.following === false && out.unfollow.anchorDelta !== null && Math.abs(out.unfollow.anchorDelta) <= 2 && out.unfollow.pill === true
      // （c）回填不跳（T-DSK18）：滚至顶 ⇒ scroll ⇒ 真回填（history:page）⇒ 补偿后锚不动 + scrollTop 按高度增量修正
      const beforeC = metrics()
      const blocksBeforeC = (store.get().blocks ?? []).length
      const guardC = { hasOlder: store.get().history?.hasOlder ?? null, inFlight: store.get().history?.inFlight ?? null, page: store.get().history?.page ?? null }
      flow.scrollTop = 0
      flow.dispatchEvent(new Event("scroll"))
      const nodeC = topNode() // 同步测（回填回执异步——首测在后端未落前）
      const topC = topOf(nodeC)
      const deadline = performance.now() + 25000
      let landedC = false
      while (performance.now() < deadline) {
        const state = store.get()
        if (state.history?.inFlight === false && (state.blocks ?? []).length > blocksBeforeC) { landedC = true; break }
        await sleep(150)
      }
      await raf2(); await sleep(250); await raf2()
      const afterC = metrics()
      const topC2 = topOf(nodeC)
      out.backfill = {
        guard: guardC, landed: landedC, blocksBefore: blocksBeforeC, blocksAfter: (store.get().blocks ?? []).length,
        hasOlderAfter: store.get().history?.hasOlder ?? null, inFlightAfter: store.get().history?.inFlight ?? null,
        anchorId: nodeC?.getAttribute("data-block-id") ?? null, anchorConnected: nodeC?.isConnected === true,
        anchorTopBefore: topC, anchorTopAfter: topC2,
        anchorDelta: topC !== null && topC2 !== null ? +(topC2 - topC).toFixed(1) : null,
        scrollTopAfter: afterC.scrollTop, heightDelta: afterC.scrollHeight - beforeC.scrollHeight,
        scrollTopCorrected: Math.abs(afterC.scrollTop - (afterC.scrollHeight - beforeC.scrollHeight)) <= 2,
        before: beforeC, after: afterC,
      }
      out.backfill.ok = out.backfill.landed === true && out.backfill.anchorDelta !== null && Math.abs(out.backfill.anchorDelta) <= 2
        && out.backfill.scrollTopCorrected === true && out.backfill.blocksAfter > out.backfill.blocksBefore && out.backfill.hasOlderAfter === false
      // （v）E4-JS 合成读数（巨块在场 —— 三腿后）：段链稳定 ∥ 窗态 census
      const giant = [...flow.querySelectorAll("[data-raw]")].sort((a, b) => b.textContent.length - a.textContent.length)[0] ?? null
      out.segments = giant === null ? null : {
        spans: giant.querySelectorAll("span[data-seg]").length,
        visible: [...giant.querySelectorAll("span[data-seg]")].filter((span) => span.style.display !== "none").map((span) => Number(span.getAttribute("data-seg"))),
        chars: giant.textContent.length,
      }
      return out
    })()`, 180000)
    if (legs !== null && typeof legs === "object") Object.assign(e4, legs)
    else e4.legsError = String(legs)
  } catch (error) {
    e4.error = String(error?.stack ?? error)
  }
  out.phases.e4 = e4

  const scenesAll = readScenes(crashDir)
  out.verdict = {
    assembly: out.phases.assembly.boot === "ok" && out.phases.assembly.crashDirCreated === true,
    snapshotLanding: snap1.bytes > 0 && snap2.bytes > 0,
    freezeGate: out.phases.freezeSelfHeal.triggered === true || out.phases.freezeKill.triggered === true,
    recoverySequence: out.phases.freezeKill.triggered === true && out.phases.freezeKill.renderer?.replaced === true && out.phases.freezeKill.renderer?.recoveredBoot === true,
    unresponsiveFired: out.phases.freezeSelfHeal.triggered === true, // 标定读数（false = 12s 自限环内未触发——真机校准腿，见批档 §5）
    noStandaloneGoneScene: !scenes.some((entry) => entry.scene.source === "gone"), // 预期杀不另开现场（真机实录修正项回归）；判据面 = F2 后基线（D9 手工撞另计）
    d9AutoResume: d9.autoReturnOk === true && d9.pageReloadOk === true,
    d9SubagentLive: d9.subagentLiveOk === true,
    e4CssApplied: e4.cssApplied !== null && ["block", "blockText", "reasoning", "advisor"].every((name) => {
      const value = e4.cssApplied?.[name]
      // Chromium 把 `contain: layout style paint` 的 computed 序列化为等价简写 `content`（= 除 size 外全部；MDN："equivalent to contain: layout paint style"）——两形皆收，拒 size
      if (typeof value !== "string" || value === "none" || value.includes("size")) return false
      return value === "content" || ["layout", "style", "paint"].every((token) => value.split(/\s+/).includes(token))
    }),
    e4TextEq: out.phases.load.bigBlock?.eq === true && out.phases.load.bigBlock?.chars === out.phases.load.bigBlock?.bigChars,
    e4NoJump: e4.follow?.ok === true && e4.unfollow?.ok === true && e4.backfill?.ok === true,
    e4LongTaskGiant: (out.phases.load.bigBlock?.longTasks ?? []).length === 0, // 读数（§2.14-C 腿① 对拍面——值 >0 ⇒ 该腿未达）
    e4LongTaskFlood: (out.phases.load.flood?.longTasks ?? []).length === 0, // 同上（腿① 流式半）
    // ── E4-JS 支（§2.15-B⑦ —— ① long-task ② 等价 ③ 不跳 ④ 有界 ⑥ 三载径）──
    e4jsCalibration: out.calibrationPass === true, // ⑤ 引擎标定（前置 —— 不过则本跑已停步）
    e4jsLongTask: (out.phases.load.bigBlock?.longTasks ?? [1]).length === 0, // ① long-task 门（对拍基线 = 18,115ms ∕ 18,293ms）
    e4jsWindowEq: (out.phases.e4js?.window?.text ?? 0) === 592 * 1024 && out.phases.e4js?.window?.joinedPrefix === true,
    e4jsScroll: (out.phases.e4js?.scroll?.steps ?? 0) >= 20 && (out.phases.e4js?.scroll?.crossed ?? 0) >= 6
      && (out.phases.e4js?.scroll?.driftMeasured ?? 0) >= 10 && (out.phases.e4js?.scroll?.tasks ?? [1]).length === 0
      && (out.phases.e4js?.scroll?.driftMax ?? 1e9) <= 2,
    e4jsBounded: (out.phases.e4js?.scroll?.maxPerFrame ?? 1e9) <= 2 && (out.phases.e4js?.scroll?.visibleMax ?? 1e9) <= 4,
    e4jsStreaming: out.phases.e4js?.streaming?.follows === true && out.phases.e4js?.streaming?.eq === true
      && (out.phases.e4js?.streaming?.tasks ?? [1]).length === 0,
    e4jsRemount: out.phases.e4js?.remount?.transferOk === true && (out.phases.e4js?.remount?.tasks ?? [1]).length === 0,
    e4jsBackfill: e4.backfill?.ok === true && e4.giant?.injected === true && (e4.giant?.spans ?? 0) > 1
      && e4.segments?.spans === e4.giant?.spans && (e4.segments?.chars ?? 0) >= (e4.giant?.chars ?? 0), // 段链零重切（腿内 token 续写 ⇒ chars 单调不减）
  }
  out.scenesTotal = scenesAll.map((entry) => ({ name: entry.name, trigger: entry.scene.trigger, actions: entry.scene.actions.map((action) => action.type) }))
  out.ok = ["assembly", "snapshotLanding", "freezeGate", "recoverySequence", "noStandaloneGoneScene", "d9AutoResume", "d9SubagentLive", "e4CssApplied", "e4TextEq", "e4NoJump", "e4jsCalibration", "e4jsLongTask", "e4jsWindowEq", "e4jsScroll", "e4jsBounded", "e4jsStreaming", "e4jsRemount", "e4jsBackfill"].every((key) => out.verdict[key] === true)
  verdict = out.ok ? 0 : 1
  console.log(JSON.stringify({ verdict: out.verdict, ok: out.ok }, null, 1))
} catch (error) {
  out.error = String(error?.stack ?? error)
  console.error("PROBE ERROR:", out.error)
} finally {
  out.incidents = incidents
  writeFileSync(join(REPO, ".thincoder", "tmp", "2026-09-30-desktop-heap-freeze-readings.json"), `${JSON.stringify(out, null, 2)}\n`)
  if (app !== null) { try { await app.close() } catch { /* 实例已亡 ∕ 关闭失败——读数已落盘 */ } }
}
process.exit(verdict)
