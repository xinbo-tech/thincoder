/**
 * 2026-10-10-desktop-behavior-residues.test.mjs — 批内件（桌面行为残渣批 · 2026-10-10 · 八腿 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-10-desktop-behavior-residues.test.mjs
 *
 * 腿集（判据源 = `docs/batches/2026-10-10-desktop-behavior-residues.md` §2.4 AC 表）：
 *   A1 D29 扫描面（#809）：桌面 `renderer/` 13 档 CSS —— 减两核档豁免（`core-markdown.css` ∥ `core.css`）
 *      ⇒ 扫 11 档；`font-weight` ∈ {500,600,700} 零命中（修前红恰一处 = `chat-fixes.css:46`）。
 *   A2 `#809` 值面：`.chat-help .help-label` 规则含 `400` ∧ `var(--accent)`；`--accent` 在册（`theme.css`）。
 *   B  `#831` 诚实拒：台账歧义锚 ⇒ `ledgerRead` 拒绝直传（锚句「项目不可解析」）∥ 正常项目 ⇒ 三计数 0
 *      ∥ 无项目 ⇒ `no-project`（修前红 = 歧义径不拒而返空读）。
 *   C  `#912` 残值弃件链尾帧（三径）：C1 墓碑径 ⇒ 链尾一状态帧（修前红 = 零帧）；C2 `!stillHeld` 径 ⇒
 *      链尾状态帧 + 弃余计数 = **取批前**余量（含已取未达批）；C3 全消费正常径 ⇒ 帧序零增（恰四帧整序）。
 *   D  `#914` 回填收束帧门：同一合帧窗时序两臂 —— 无 `flush()` ⇒ 门（上帧在飞 ∧ 本帧坍落 ∧ 非跟滚）
 *      不可达（修前红）；有 `flush()` ⇒ 可达。
 *   E  `#979` 弹窗路由收口：`closeActiveModal` 导出 + 无在场幂等零抛 + `route()` 起点调用（源锁）。
 *   F  `#1039` 粘顶头 a11y：两滚动层（`[data-slot="settings"]` ∥ `.settings-modal`）`scroll-padding-top`
 *      同值形（修前红 = 两处皆缺）。
 *   G  `#1041` 首启板交棒：`custom` 径（键可空）⇒ 框开 + 键预填（修前红 = 空键早退零交棒）∥
 *      无参 ⇒ 零预填 ∥ 预设径零改（原位发消息、不掺交棒）。
 * 纪律：零网络 ∥ 零第三方新增（happy-dom = `thincoder-vscode/` 仓内既有 devDep，实读在盘）；
 * 只读面 ∕ 行为断言；⌛ 面（真机 CDP）归父侧闭合。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..", "..")
if (!existsSync(join(ROOT, "thincoder-desktop"))) throw new Error(`须从仓库根（thincoder/）运行——解析根 = ${ROOT}`)
const mod = (p) => import(pathToFileURL(join(ROOT, p)).href)
const text = (p) => readFileSync(join(ROOT, p), "utf8")
const until = async (fn, ms = 8000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error("until timeout"); await new Promise((r) => setTimeout(r, 5)) } return true }
const deferred = () => { let resolver = null; const promise = new Promise((res) => { resolver = res }); return { promise, resolve: resolver } }
const settle = async (ms = 60) => new Promise((done) => setTimeout(done, ms)) // 链尾拍（微任务链崩平）

/** console.error 捕获（诊断行断言 —— 原函数复位）。 */
async function capturingErrors(fn) {
  const lines = []
  const orig = console.error
  console.error = (...args) => lines.push(args.map(String).join(" "))
  try { await fn() } finally { console.error = orig }
  return lines
}

// ─── `/rc/` 解析钩子（须先于渲染档取件 —— 沿批内件先例）──────────────────────────────────────
await mod("thincoder-desktop/test/rc-resolve.mjs")

// ─── happy-dom（G 腿 —— VSC 真 webview 面；须先于 VSC 档取件：`state.js` 读 DOM ∕ `acquireVsCodeApi`）──
const { GlobalRegistrator } = await import(pathToFileURL(join(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = function () {}
const IDS = ["messages", "subagent-activity", "input", "send-btn", "abort-btn", "model-btn", "reasoning-btn", "model-dropdown", "reasoning-dropdown",
  "session-selector", "session-title", "session-dropdown", "welcome-panel", "welcome-heading", "welcome-text", "welcome-provider-label",
  "welcome-key-label", "welcome-save-btn", "welcome-skip-btn", "welcome-settings-btn", "project-btn"]
document.body.innerHTML = IDS.map((id) => `<div id="${id}"></div>`).join("") +
  `<select id="welcome-provider"></select><input id="welcome-key"></input>`
const posts = []
globalThis.acquireVsCodeApi = () => ({ postMessage: (m) => posts.push(m), getState: () => ({}), setState: () => {} })
const vscState = await mod("thincoder-vscode/webview/state.js")
const vscSS = (await mod("thincoder-vscode/webview/settings-state.js")).SS
const vscOnboarding = await mod("thincoder-vscode/webview/onboarding.js")
const vscDialog = await mod("thincoder-vscode/webview/settings-provider-dialog.js")

// ─── 桌面档（C ∥ D 腿）────────────────────────────────────────────────────────────────────
const [driveMod, storeMod, wqMod] = await Promise.all([
  mod("thincoder-desktop/src/main/suspension-drive.mjs"),
  mod("thincoder-desktop/renderer/store.mjs"),
  mod("thincoder-desktop/src/main/window-queue.mjs"),
])
const { createFrameMerge } = await import("/rc/flow/frame.mjs") // 真帧合并件（`/rc/` 钩子解析）

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
const img = () => PNG

/** 假 agent（挂起载体：池表三件显式在场 ⇒ `poolLive` 真值可控；pending 空 ⇒ 不触发消化轮）。 */
const makeAgent = () => ({
  title: "t", cwd: null, _slot: 1,
  _asyncSubagents: new Map([["s1", { status: "running" }]]),
  _asyncAdvisors: new Map(), _consultSessions: new Map(), _pendingAsyncResults: [],
  provider: { name: "vis", model: "claude-sonnet-4-5" }, config: { locale: "zh" }, memory: { db: null },
  history: [], _fullHistory: [],
})

/** 挂起驱动装配（假 `postQueue` ⇒ 帧面全录；时钟两缝假注入 ⇒ 零真实闩；`prepare` ∥ `hold` = 时序控制缝）。 */
function makeDrive({ agent, prepare = null, degrade = null, hold = null } = {}) {
  const runs = [], frames = [], events = []
  const runTurn = (key, agent1, item, opts = {}) => new Promise((res, rej) => { runs.push({ key, text: item, opts, res, rej }) })
  let drive = null
  const postQueue = (key, delivered = null) => frames.push({ key, delivered, items: drive === null ? null : drive.inputSnapshot(key) })
  drive = driveMod.createSuspensionDrive({
    post: (ch, payload) => events.push({ ch, payload }),
    runTurn, postQueue, prepare, degrade, hold,
    timer: () => ({ unref() {} }), clear: () => {},
  })
  return { drive, runs, frames, events }
}

/** 降级窗占位注入缝（假 hold：可摘 ⇒ `!stillHeld` 径）。 */
function makeHold() {
  let slot = null
  return {
    hold: () => { const c = new AbortController(); slot = c; return { signal: c.signal, active: () => slot === c, release: () => { if (slot === c) slot = null } } },
    evict: () => { slot = null },
  }
}

const frameKind = (f) => (f.delivered === null ? "state" : "delivered")
const lastStateFrame = (frames) => frames.at(-1)?.delivered === null

// ═══════════════════════════════════════════════════════════════════════════════════════════
// A 腿（#809 —— D29 逃逸收口）
// ═══════════════════════════════════════════════════════════════════════════════════════════

test("A1 桌面 CSS 扫描面（13 减 2 豁免 ⇒ 11 档）：{500,600,700} 零命中（修前红 = chat-fixes.css:46）", () => {
  const dir = resolve(ROOT, "thincoder-desktop/renderer")
  const all = readdirSync(dir).filter((f) => f.endsWith(".css")).sort()
  const EXEMPT = ["core-markdown.css", "core.css"] // markdown 修饰层豁免（`UI.md` §1 本批注 D29 项 3）
  const scanned = all.filter((f) => !EXEMPT.includes(f))
  assert.equal(all.length, 13, `桌面 CSS 全 13 档（实读 ${all.length}）`)
  assert.deepEqual(scanned.map((f) => f.replace(".css", "")).sort(),
    ["chat", "chat-cards", "chat-composer", "chat-fixes", "chrome", "pool", "session-list", "settings", "settings-modal", "skin", "theme"],
    "扫描集 = 11 档（枚举随动锁）")
  const hits = []
  for (const f of scanned) {
    text(`thincoder-desktop/renderer/${f}`).split("\n").forEach((line, i) => {
      const m = line.match(/font-weight\s*:\s*(\d+)/)
      if (m !== null && ["500", "600", "700"].includes(m[1])) hits.push(`${f}:${i + 1}`)
    })
  }
  assert.deepEqual(hits, [], "D29 ② 面：桌面自有文字零粗体（scan = 11 档）")
})

test("A2 #809 值面：`.chat-help .help-label` = 400 + accent；`--accent` 在册（theme.css）", () => {
  const css = text("thincoder-desktop/renderer/chat-fixes.css")
  const rule = (css.match(/\.chat-help \.help-label \{[^}]*\}/) ?? [""])[0]
  assert.ok(rule !== "", "规则在场")
  assert.match(rule, /font-weight:\s*400/, "字重归 400（D29 ②）")
  assert.match(rule, /color:\s*var\(--accent\)/, "强调落既有色位通道（accent）")
  assert.match(text("thincoder-desktop/renderer/theme.css"), /--accent:/, "--accent 在册（变量单源 = theme.css）")
  assert.match(css, /标签 accent/, "档头注句随正（「标签加重」⇒「标签 accent」）")
})

// ═══════════════════════════════════════════════════════════════════════════════════════════
// B 腿（#831 —— 台账歧义诚实拒）
// ═══════════════════════════════════════════════════════════════════════════════════════════

test("B #831 台账：歧义锚 ⇒ 拒绝直传（锚句）∥ 正常项目 ⇒ ok 三计数 0 ∥ 无项目 ⇒ no-project", async () => {
  const { ledgerRead } = await mod("thincoder-desktop/src/main/project-info.mjs")
  const LDB = await mod("thincoder-core/ledger-db.mjs")
  const roots = []
  const mk = (tag) => { const d = mkdtempSync(join(tmpdir(), `dbr-${tag}-`)); roots.push(d); return d }
  LDB._setLedgerDirForTest(join(mk("ldb"), "ledger")) // 台账库目录出局（零真实用户目录触碰）
  try {
    // 歧义夹具（沿 #828 先例）：容器 + 两带档子项目（`PROJECT-MANIFEST.json`）
    const anchor = mk("amb")
    for (const name of ["alpha", "beta"]) {
      const dir = join(anchor, name)
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }))
    }
    await assert.rejects(async () => ledgerRead({ cwd: anchor }),
      (err) => { assert.match(String(err?.message ?? err), /项目不可解析/, "歧义 ⇒ 锚句逐字（拒绝直传——不返空读）"); return true },
      "歧义锚 ⇒ 拒绝（诚实拒 —— 修前红 = 静默返空读）")
    // 正常项目（带档、无台账库）⇒ 合法空读
    const ok = mk("ok")
    writeFileSync(join(ok, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }))
    assert.deepEqual(await ledgerRead({ cwd: ok }), { ok: true, counts: { pool: 0, tech: 0, aged: 0 }, thresholdReached: false }, "三计数全 0 + ok（未发现台账 = 合法读数）")
    // 无项目（无 cwd 供读）
    assert.deepEqual(await ledgerRead({}), { ok: false, reason: "no-project" }, "无 cwd ⇒ no-project")
  } finally {
    LDB._resetLedgerDirForTest()
    for (const d of roots.reverse()) rmSync(d, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════════════════
// C 腿（#912 —— 残值弃件链尾帧）
// ═══════════════════════════════════════════════════════════════════════════════════════════

test("C1 #912 墓碑径：倾出后墓碑 ⇒ 链尾一状态帧（修前红 = 末帧残留消费形 ∕ 零状态帧）", async () => {
  const agent = makeAgent()
  const { drive, runs, frames } = makeDrive({ agent })
  drive.start("1", agent, { cwd: "/p" })
  drive.pushInput("1", "甲", null)
  await until(() => runs.length === 1) // 核取批消费 甲（窗内）
  drive.pushInput("1", "乙", null) // 残值（续发首条）
  drive.pushInput("1", "丙", null) // 弃件（取批前余量含它）
  agent._asyncSubagents.clear() // 池空 ⇒ 出窗后零重开
  runs[0].rej(new Error("boom")) // 非 Abort ⇒ 出窗 + 残值续发 ⇒ 乙 起跑（链停在 `await runTurn`）
  await until(() => runs.length === 2)
  drive.abort("1") // 续发在场 ⇒ 中止墓碑（非清队径）
  runs[1].res("done") // 乙 回合毕 ⇒ 循环次轮：墓碑命中 ⇒ 停链 + 链尾状态帧
  await settle()
  assert.equal(lastStateFrame(frames), true, `末帧 = 状态形（链尾收口 —— 实读 ${JSON.stringify(frames.at(-1))}）`)
  assert.deepEqual(drive.inputSnapshot("1"), [], "镜面终值 = 空（实况）")
  assert.equal(drive.active("1"), false, "零复活窗（墓碑径不接管）")
})

test("C2 #912 `!stillHeld` 径：链尾状态帧 + 弃余计数 = 取批前余量（含已取未达批）", async () => {
  const agent = makeAgent()
  const gate = deferred()
  let prepareCalled = false
  const h = makeHold()
  const { drive, runs, frames } = makeDrive({ agent, prepare: () => { prepareCalled = true; return gate.promise }, degrade: (attached) => attached, hold: h.hold })
  const lines = await capturingErrors(async () => {
    drive.start("1", agent, { cwd: "/p" })
    drive.pushInput("1", "甲", null)
    await until(() => runs.length === 1)
    drive.pushInput("1", "乙", [img()])
    drive.pushInput("1", "丙", null)
    drive.pushInput("1", "丁", null)
    agent._asyncSubagents.clear()
    runs[0].rej(new Error("boom")) // 出窗 ⇒ 残值续发 ⇒ 取乙 ⇒ 消费挂 `prepare`（degrade 落定式等待）
    await until(() => prepareCalled)
    h.evict() // 占位被摘（会话亡）——`!stillHeld` 径
    drive.abort("1") // 墓碑同落（诊断行落点）
    gate.resolve({ text: "乙", paths: [] })
    await settle() // 链尾拍（吞入 ∥ 停链 ∥ 诊断行全落）
  })
  const dropped = lines.find((l) => l.includes("aborted mid-resume"))
  assert.ok(dropped !== undefined, `诊断行在场（实读 ${JSON.stringify(lines)}）`)
  assert.match(dropped, /— 3 accepted message\(s\) dropped/, "弃余计数 = 取批前余量（乙已取未达 + 丙 ∥ 丁 = 3）")
  assert.equal(lastStateFrame(frames), true, "末帧 = 状态形（弃件径链尾帧）")
  assert.equal(runs.length, 1, "零起跑（占位被摘 ⇒ 乙不入回合）")
  assert.equal(drive.active("1"), false, "零复活窗")
})

test("C3 #912 全消费正常径：帧序零增（恰四帧整序 —— 修前修后同形）", async () => {
  const agent = makeAgent()
  const { drive, runs, frames } = makeDrive({ agent })
  drive.start("1", agent, { cwd: "/p" })
  drive.pushInput("1", "甲", null)
  await until(() => runs.length === 1)
  drive.pushInput("1", "乙", null)
  agent._asyncSubagents.clear()
  runs[0].rej(new Error("boom"))
  await until(() => runs.length === 2)
  assert.deepEqual(frames.map((f) => [frameKind(f), f.items.length]), [["state", 1], ["delivered", 0], ["state", 1], ["delivered", 0]], "帧序 = 受理即推 ⇒ 消费帧（合帧窗按批退化逐条——零增帧）")
  runs[1].res("done")
  await until(() => drive.inputSnapshot("1").length === 0)
  assert.deepEqual(frames.map(frameKind), ["state", "delivered", "state", "delivered"], "链尾零增帧（全消费径不出弃件帧）")
})

// ═══════════════════════════════════════════════════════════════════════════════════════════
// D 腿（#914 —— 回填收束帧门）
// ═══════════════════════════════════════════════════════════════════════════════════════════

test("D #914 回填收束帧门：同一时序两臂 —— 无 flush ⇒ 门不可达（修前红）∥ 有 flush ⇒ 可达", async () => {
  const { createStore, initialState, beginBackfill, endBackfill } = storeMod
  const gateOf = (prev, cur) => prev?.history?.inFlight === true && cur?.history?.inFlight !== true && cur.following !== true
  const arm = ({ flush }) => {
    const store = createStore({ ...initialState(), history: { ...(initialState().history ?? {}), hasOlder: true, inFlight: false }, following: false })
    const frames = []
    let prev = null
    const queued = []
    let clock = 0
    const frame = createFrameMerge({
      apply: () => { const cur = store.get(); frames.push({ inFlight: cur.history?.inFlight === true, gate: gateOf(prev, cur) }); prev = cur },
      raf: (cb) => queued.push(cb), now: () => (clock += 100),
    })
    store.subscribe((_state, changedKeys) => { frame.mark(changedKeys) }) // 装配缝（`app.mjs:336` 同形）
    store.set(beginBackfill(store.get(), { page: null }))
    if (flush) frame.flush()
    store.set(endBackfill(store.get()))
    for (let i = 0; i < 10 && queued.length > 0; i += 1) queued.shift()() // rAF 拍（同一合帧窗）
    return frames
  }
  const red = arm({ flush: false })
  assert.equal(red.some((f) => f.gate), false, `无 flush ⇒ 门不可达（受理 ∥ 收束并入一帧 —— 修前红灯基线；实读 ${JSON.stringify(red)}）`)
  const green = arm({ flush: true })
  assert.ok(green.some((f) => f.gate), `有 flush ⇒ 回执帧成收束帧（门可达；实读 ${JSON.stringify(green)}）`)
  // 接线锁（源面）：装配点 = `app.mjs` 滚动接线 `onBackfill` 包装（收束帧显式 flush）
  assert.match(text("thincoder-desktop/renderer/app.mjs"), /onBackfill: \(\) => \{ backfill\(\); frame\.flush\(\) \}/,
    "`onBackfill` 包装在册（backfill + 帧出口 flush）")
})

// ═══════════════════════════════════════════════════════════════════════════════════════════
// E 腿（#979 —— 弹窗路由收口）
// ═══════════════════════════════════════════════════════════════════════════════════════════

test("E #979 弹窗路由收口：`closeActiveModal` 导出 + 无在场幂等零抛 + `route()` 起点调用（源锁）", async () => {
  const modal = await mod("thincoder-server/public/modal.mjs")
  assert.equal(typeof modal.closeActiveModal, "function", "导出面在册（`active?.close()` 幂等单源）")
  assert.doesNotThrow(() => modal.closeActiveModal(), "无在场 ⇒ 零动作（首调）")
  assert.doesNotThrow(() => modal.closeActiveModal(), "无在场 ⇒ 零动作（再调——幂等）")
  const app = text("thincoder-server/public/app.mjs")
  assert.match(app, /import \{[^}]*closeActiveModal[^}]*\} from "\.\/modal\.mjs"/, "import 在册")
  const routeFn = (app.match(/async function route\(\) \{[\s\S]*?\n\}/) ?? [""])[0]
  assert.ok(routeFn !== "", "`route()` 函数体在册")
  assert.match(routeFn, /async function route\(\) \{\n\s*closeActiveModal\(\)/, "调用居 `route()` 起点（首句 —— 路由切换前先收弹窗）")
})

// ═══════════════════════════════════════════════════════════════════════════════════════════
// F 腿（#1039 —— 粘顶头 a11y）
// ═══════════════════════════════════════════════════════════════════════════════════════════

test("F #1039 两滚动层 `scroll-padding-top` 同值形（修前红 = 两处皆缺）", () => {
  const VALUE = /scroll-padding-top:\s*calc\(var\(--fs\) \* var\(--lh\) \+ 2 \* var\(--gap\)\)/
  const page = (text("thincoder-desktop/renderer/settings.css").match(/\[data-slot="settings"\] \{[^}]*\}/) ?? [""])[0]
  assert.ok(page !== "", "页滚动层规则在场（`[data-slot=\"settings\"]`）")
  assert.match(page, VALUE, "页层含 `scroll-padding-top`（头顶粘行高度 —— 滚动定位不遮标题）")
  const modal = (text("thincoder-desktop/renderer/settings-modal.css").match(/\.settings-modal \{[^}]*\}/) ?? [""])[0]
  assert.ok(modal !== "", "弹窗滚动层规则在场（`.settings-modal`）")
  assert.match(modal, VALUE, "弹窗层同值（单源变量面 —— 零新变量 ∥ 零新断点）")
  assert.match(text("thincoder-desktop/renderer/theme.css"), /--gap:/, "--gap 在册（变量单源 = theme.css）")
})

// ═══════════════════════════════════════════════════════════════════════════════════════════
// G 腿（#1041 —— 首启板交棒）
// ═══════════════════════════════════════════════════════════════════════════════════════════

test("G #1041 首启板交棒：custom 径（键可空）⇒ 框开 + 键预填（修前红 = 空键早退）", () => {
  const PRESETS = [{ name: "p1", desc: "P1", baseURL: "https://api.p1.example" }]
  const openDialog = (key) => { window._openAddProviderDialog(key === undefined ? undefined : { key }) }
  let opened = 0
  vscOnboarding.initOnboarding({ openSettings: () => { opened += 1 } })
  vscDialog.installProviderDialogHandlers()
  vscSS.providerStatus = { presets: PRESETS }
  const fresh = () => { vscDialog.closeAddProviderDialog(); posts.length = 0; vscState.S._welcomeDismissed = false; vscOnboarding.showWelcomePanel({ presets: PRESETS }) }

  // ① custom 径（键非空——既有行为保持）：框开 + 键预填 + 零直发
  fresh()
  vscState.ctx.welcomeProvider.value = "custom"
  vscState.ctx.welcomeKey.value = "  sk-welcome  "
  document.getElementById("welcome-save-btn").click()
  assert.equal(opened, 1, "交棒 ⇒ `_openSettings()`（设置面开出）")
  assert.ok(document.getElementById("prov-add-dialog") !== null, "框在场（交棒落地）")
  assert.equal(document.getElementById("pa-key").value, "sk-welcome", "键随交棒预填（trim 后逐字）")
  assert.deepEqual(posts, [], "custom 径零直发（不发 `addProvider`——框内提交）")

  // ② custom 径（空键——板面不再强制键；框内可补）
  fresh()
  vscState.ctx.welcomeProvider.value = "custom"
  vscState.ctx.welcomeKey.value = ""
  document.getElementById("welcome-save-btn").click()
  assert.ok(document.getElementById("prov-add-dialog") !== null, "空键 ⇒ 照常交棒（修前红 = 早退零框）")
  assert.equal(document.getElementById("pa-key").value, "", "无键 ⇒ 零预填")
  assert.deepEqual(posts, [], "空键径零直发")

  // ③ 无参 ⇒ 零预填（窗体其余调用点零改）
  vscDialog.closeAddProviderDialog()
  openDialog()
  assert.ok(document.getElementById("prov-add-dialog") !== null, "无参 ⇒ 照常开框")
  assert.equal(document.getElementById("pa-key").value, "", "无参 ⇒ 零预填")
  vscDialog.closeAddProviderDialog()

  // ④ 预设径零改：原位发消息（不掺交棒开框）
  fresh()
  vscState.ctx.welcomeProvider.value = "p1"
  vscState.ctx.welcomeKey.value = "sk-p1"
  document.getElementById("welcome-save-btn").click()
  assert.deepEqual(posts, [{ type: "addProvider", preset: "p1", key: "sk-p1" }], "预设径 ⇒ 原位发消息（逐字）")
  assert.equal(document.getElementById("prov-add-dialog"), null, "预设径零开框（零掺交棒）")
})
