/**
 * 2026-10-02-desktop-ux-closeout.test.mjs — 批内件（桌面 UX 收尾批 —— #702 桌面 MCP 警告消费 ∥ #697 P1 读数
 * 端面消费（桌面 ∥ VSC）∥ #801 右栏滚动复现判据 腿 A）。
 * 跑法（仓根 cwd）：`node --test docs/batches/2026-10-02-desktop-ux-closeout.test.mjs`
 * 腿清单（一对一对 §2.6 验收对照）：
 *   B1（#702 · 含三子组）：假装配 ⇒ 装配尾入队（首两段逐字同 CLI（`thincoder-cli/src/command-interactive.mjs:151-155`）
 *     ∧ 末行指路桌面可达出口）；装载后入队（槽携 `pendingReminders` ⇒ 不被覆盖）；负控 = 零警告零写 ∧
 *     同 key 复用不重推（装配一次推送一次）。
 *   C1（#697 桌面读数）：`readIndexCounts` 夹具 ⇒ `dbBytes` = `statSync` ∧ `origins` 逐条同值（与核出口
 *     `memoryStatus()` 直读对拍）；零径两腿（无 dir ∥ 库不在盘）。
 *   C2（#697 桌面渲染）：`index:status` 回执携两键 ⇒ 经 `createReads().loadTools` 段态 ⇒ `toolsBody` 两读行
 *     在场；缺位 ⇒ 零节点。
 *   C3（#697 VSC 载荷）：真 `pushIndexStatus`（vscode 钩子桩 + 沙箱句柄）⇒ 载荷 +2 键同值。
 *   C4（#697 VSC 渲染）：happy-dom + 真 `updateIndexStatus` ⇒ 两读在场；缺位 ∕ 空 ⇒ 隐藏。
 *   A（#801 腿 A）：隔离实例 60 块两臂（摘要形 ∥ 内容形）⇒ 溢出成立 ∧ 上滚 ×3 三拍内必动 ∧ `_poolPin`
 *     翻假 ∧ 程序化写位生效。
 * 纪律：零第三方新增（node: 内建 + 仓内既有 devDeps playwright-core ∕ happy-dom）；数据面 = 夹具 ∕ 沙箱库 ∕
 * 隔离实例 userData——真库 ∥ 真 config ∥ 真会话零触碰（HOME ∥ USERPROFILE ∥ APPDATA 全量沙箱）；
 * 模块实例单源 = 大写盘符 URL（junction realpath 同形——防 config ∕ 会话缝覆盖落空）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, mkdirSync, statSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { createRequire, registerHooks } from "node:module"
import { pathToFileURL } from "node:url"

const ROOT = "D:/teamcode/thincoder/"
const at = (p) => pathToFileURL(ROOT + p).href
const sandboxHome = (tag) => mkdtempSync(join(tmpdir(), `uxcloseout-${tag}-`))

// HOME 沙箱（先于任何核模块导入 —— 默认路径面兜底不落真库 ∕ 真 config）
const HOME = sandboxHome("home")
process.env.HOME = HOME
process.env.USERPROFILE = HOME
process.env.APPDATA = HOME
process.env.XDG_CONFIG_HOME = HOME

// ── vscode 钩子桩（VSC 侧模块图载入面 —— 零真宿主；workspaceFolders 取全局变量）──────────
const VSCODE_STUB = "data:text/javascript," + encodeURIComponent(`
export const workspace = {
  get workspaceFolders() { return globalThis.__VSCODE_FOLDERS ?? [] },
  findFiles: async () => [],
  getConfiguration: () => ({ get: () => undefined }),
}
export const window = {
  showInformationMessage: async () => undefined,
  showErrorMessage: async () => undefined,
  showWarningMessage: async () => undefined,
}
export const commands = { executeCommand: async () => undefined }
export const Uri = { file: (p) => ({ fsPath: p, toString: () => "file://" + p }) }
export const ProgressLocation = { Notification: 15 }
export class EventEmitter { constructor() { this.event = () => ({ dispose() {} }) } fire() {} dispose() {} }
export const RelativePattern = class {}
export const StatusBarAlignment = { Left: 1, Right: 2 }
export const ThemeIcon = class {}
export default {}
`)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "vscode") return { url: VSCODE_STUB, shortCircuit: true }
    return next(specifier, context)
  },
})

const deskReq = createRequire(ROOT + "thincoder-desktop/package.json")
const vscReq = createRequire(ROOT + "thincoder-vscode/package.json")

/** 核内存库夹具：两 origin（code + doc 行）——`createMemory` ∕ 表形沿 `2026-09-30-memory-db-family.test.mjs`。 */
async function buildMemoryFixture(dbPath) {
  const { createMemory } = await import(at("thincoder-core/memory/schema.mjs"))
  const memory = createMemory({ dbPath })
  const insCode = memory.db.prepare(`INSERT INTO code_chunks (origin, path, language, chunk_type, symbol_name, content, line_start, line_end, mtime_ms, embedding, seg_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const insDoc = memory.db.prepare(`INSERT INTO doc_chunks (origin, path, language, heading, content, line_start, line_end, mtime_ms, embedding, seg_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  memory.db.exec("BEGIN")
  try {
    insCode.run("D:/fxt/alpha", "a.mjs", "javascript", "file", "", "// a", 1, 1, 1, null, "")
    insCode.run("D:/fxt/alpha", "b.mjs", "javascript", "file", "", "// b", 1, 1, 1, null, "")
    insDoc.run("D:/fxt/alpha", "d.md", "markdown", "", "# d", 1, 1, 1, null, "")
    insCode.run("D:/fxt/beta", "c.mjs", "javascript", "file", "", "// c", 1, 1, 1, null, "")
  } finally { memory.db.exec("COMMIT") }
  memory.db.close()
}

// ─── B1 ∕ B2（#702）：装配尾 MCP 警告消费 ──────────────────────────────────────

test("B1（#702）：假装配携 `_mcpWarnings` ⇒ 装配尾入队（首两段逐字同 CLI）；装载后入队不被槽覆盖", async () => {
  const { createAgentHost } = await import(at("thincoder-desktop/src/main/agent-host.mjs"))
  const coreSlots = await import(at("thincoder-core/session-slots.mjs"))
  const cwd = sandboxHome("b1-project")
  const warnings = [`server "alpha" failed to connect: boom`, `server "beta" failed to connect: timeout`]
  let assembleCalls = 0
  const host = createAgentHost({
    emit: () => {},
    projects: { currentCwd: () => cwd },
    assemble: async ({ cwd: c, slot }) => {
      assembleCalls += 1
      return { cwd: c, _slot: slot, config: {}, _pendingReminders: ["pre-existing"], _mcpWarnings: warnings }
    },
  })
  const expected = `[System reminder: 2 MCP server(s) failed to connect at startup:\n` +
    warnings.map((w) => `  - ${w}`).join("\n") +
    `\nYou can try reconnecting from the Settings panel (MCP section → Reconnect).]`

  // 装载后入队（槽携 pendingReminders —— `applySession` 重设：入队若先于装载即被覆盖）
  const sessionsDir = sandboxHome("b1-sessions")
  coreSlots._setSessionsDirForTest(sessionsDir)
  try {
    mkdirSync(dirname(coreSlots.slotPath(cwd, 7)), { recursive: true })
    writeFileSync(coreSlots.slotPath(cwd, 7), JSON.stringify({ version: 2, cwd, history: [], pendingReminders: ["slot-seeded"] }))
    const agent = await host.ensure("k7", 7)
    assert.deepEqual(agent._pendingReminders, ["slot-seeded", expected], "装载后恰追加一条（槽值不被覆盖 ∕ 提醒不被吞）")
    assert.ok(agent._pendingReminders[1].startsWith("[System reminder: 2 MCP server(s) failed to connect at startup:\n  - "), "首两段逐字（计数行 + 逐条行）")
    assert.ok(!expected.includes("/mcp connect"), "末行指路桌面可达出口（非 CLI 的 /mcp connect）")
  } finally {
    coreSlots._resetSessionsDirForTest()
  }

  // 同 key 不重推（装配一次推送一次）
  const again = await host.ensure("k7", 7)
  assert.equal(again, host.agents.get("k7"), "同 key 复用同一代理")
  assert.equal(again._pendingReminders.length, 2, "复访不重推")
  assert.equal(assembleCalls, 1, "装配恰一次")

  // 零警告负控（零写）——空数组 ∥ 缺键两形
  const hostEmpty = createAgentHost({
    emit: () => {},
    projects: { currentCwd: () => cwd },
    assemble: async ({ cwd: c, slot }) => ({ cwd: c, _slot: slot, config: {}, _pendingReminders: [], _mcpWarnings: [] }),
  })
  assert.deepEqual((await hostEmpty.ensure("k1", 1))._pendingReminders, [], "零警告 ⇒ 零写")
  const hostAbsent = createAgentHost({
    emit: () => {},
    projects: { currentCwd: () => cwd },
    assemble: async ({ cwd: c, slot }) => ({ cwd: c, _slot: slot, config: {}, _pendingReminders: [] }),
  })
  assert.deepEqual((await hostAbsent.ensure("k1", 1))._pendingReminders, [], "`_mcpWarnings` 缺键 ⇒ 零写")
})

// ─── C1（#697 桌面）：readIndexCounts 两键透传 ────────────────────────────────

test("C1（#697 桌面）：`readIndexCounts` 夹具 ⇒ `dbBytes` = `statSync` ∧ `origins` 逐条同值（核出口对拍）；零径两腿", async () => {
  const cfgDir = sandboxHome("c1-cfg")
  const dbPath = join(cfgDir, "mem.db")
  await buildMemoryFixture(dbPath)
  const cfgPath = join(cfgDir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ memory: { dbPath } }))
  const configIo = await import(at("thincoder-core/config-io.mjs"))
  configIo._setConfigPathForTest(cfgPath)
  try {
    const { readIndexCounts } = await import(at("thincoder-desktop/src/main/index-status.mjs"))
    const counts = readIndexCounts({ dir: "D:/fxt/alpha" })
    assert.equal(counts.indexed, true)
    assert.equal(counts.files, 3, "计数面保持（3 文件）")
    assert.equal(counts.chunks, 3)
    assert.equal(counts.dbBytes, statSync(dbPath).size, "`dbBytes` = `statSync`（核口径）")
    assert.deepEqual(counts.origins, [
      { origin: "D:/fxt/alpha", code: 2, doc: 1 },
      { origin: "D:/fxt/beta", code: 1, doc: 0 },
    ], "`origins` 逐条同值（按名排序）")

    // 与核出口直读对拍（同一库——L-③-1 口径）
    const { createMemory } = await import(at("thincoder-core/memory/schema.mjs"))
    const { memoryStatus } = await import(at("thincoder-core/memory-status.mjs"))
    const memory = createMemory({ dbPath })
    try {
      const direct = memoryStatus(memory, { origin: "D:/fxt/alpha" })
      assert.equal(counts.dbBytes, direct.dbBytes)
      assert.deepEqual(counts.origins, direct.origins)
    } finally { memory.db.close() }

    // 零径：无 dir ∥ 库不在盘（两腿同零形 + 两键零位）
    const zeroShape = { indexed: false, files: 0, chunks: 0, dbBytes: null, origins: [] }
    assert.deepEqual(readIndexCounts({}), zeroShape, "无 dir ⇒ 零形")
    configIo._setConfigPathForTest(join(cfgDir, "absent.json"))
    assert.deepEqual(readIndexCounts({ dir: "D:/fxt/alpha" }), zeroShape, "库不在盘 ⇒ 零形（且不建库）")
    const coreCfg = await import(at("thincoder-core/config.mjs"))
    assert.equal(existsSync(join(coreCfg.configDir, "memory.db")), false, "读面零副作用——不建库（默认路径亦未现）")
  } finally { configIo._resetConfigPathForTest() }
})

// ─── C2（#697 桌面渲染）：回执携两键 ⇒ 两读行在场 ─────────────────────────────

test("C2（#697 桌面渲染）：`index:status` 回执携两键 ⇒ 段态 ⇒ 两读行在场；缺位 ⇒ 零节点", async () => {
  await import(at("thincoder-desktop/test/rc-resolve.mjs"))
  const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
  i18n.initDict({ locale: "en", dict: {} })
  const { createReads } = await import(at("thincoder-desktop/renderer/mount-settings-reads.mjs"))
  const { toolsBody } = await import(at("thincoder-desktop/renderer/views/settings-sections-tools.mjs"))

  const state = { settings: {} }
  const reads = createReads({
    ask: async (channel) => channel === "settings:tools"
      ? { ok: true, embedding: { hasKey: true }, websearch: { hasKey: false } }
      : { ok: true, status: { built: true, files: 3, chunks: 3, dbBytes: 131072, origins: [{ origin: "D:/fxt/alpha", code: 2, doc: 1 }], hasEmbedder: true } },
    store: { get: () => state },
    setSettings: (patch) => { state.settings = { ...state.settings, ...patch } },
    report: () => {},
  })
  await reads.loadTools()

  const section = state.settings.tools
  assert.equal(section.status.dbBytes, 131072, "段态透传 `dbBytes`")
  assert.deepEqual(section.status.origins, [{ origin: "D:/fxt/alpha", code: 2, doc: 1 }], "段态透传 `origins`")
  const nodes = toolsBody(section, {}).filter(Boolean)
  const dbRow = nodes.find((n) => n.props?.["data-index"] === "db")
  const originRowNodes = nodes.filter((n) => n.props?.["data-index"] === "origin")
  assert.ok(dbRow, "库大小行在场")
  assert.equal(dbRow.children.map((c) => c.children?.[0]).join(" | "), "Database size | 128.0 KB", "库大小行词面（名 ∕ 值）")
  assert.equal(originRowNodes.length, 1, "逐 origin 行数行在场")
  assert.equal(originRowNodes[0].children.map((c) => c.children?.[0]).join(" | "), "D:/fxt/alpha | code 2 · doc 1", "origin 行词面")

  // 缺位 ⇒ 零节点（两读皆不落）
  const missing = toolsBody({ ...section, status: { built: true, files: 3, chunks: 3, hasEmbedder: true } }, {}).filter(Boolean)
  assert.equal(missing.find((n) => n.props?.["data-index"] === "db"), undefined, "缺 `dbBytes` ⇒ 零节点")
  assert.equal(missing.filter((n) => n.props?.["data-index"] === "origin").length, 0, "缺 `origins` ⇒ 零节点")
  const empty = toolsBody({ ...section, status: { built: true, files: 3, chunks: 3, dbBytes: null, origins: [], hasEmbedder: true } }, {}).filter(Boolean)
  assert.equal(empty.find((n) => n.props?.["data-index"] === "db"), undefined, "`dbBytes` null ⇒ 零节点")
  assert.equal(empty.filter((n) => n.props?.["data-index"] === "origin").length, 0, "`origins` 空 ⇒ 零节点")
})

// ─── C3（#697 VSC 载荷）：pushIndexStatus +2 键 ───────────────────────────────

test("C3（#697 VSC 载荷）：真 `pushIndexStatus` ⇒ 载荷 +2 键同值（沙箱句柄；落点断言防真库误触）", async () => {
  const cfgDir = sandboxHome("c3-cfg")
  const dbPath = join(cfgDir, "mem.db")
  await buildMemoryFixture(dbPath)
  const cfgPath = join(cfgDir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ memory: { dbPath } }))
  const configIo = await import(at("thincoder-core/config-io.mjs"))
  configIo._setConfigPathForTest(cfgPath)
  try {
    globalThis.__VSCODE_FOLDERS = [{ uri: { fsPath: "D:/fxt/alpha" } }]
    const embed = await import(at("thincoder-vscode/src/embed-config.mjs"))
    embed.setMemoryFaceGate(() => true)
    embed._resetMemoryHandleForTest()
    const memory = await embed.ensureMemoryHandle()
    assert.equal(memory?.dbPath, dbPath, "句柄落点 = 沙箱库（防真库误触）")

    const { pushIndexStatus } = await import(at("thincoder-vscode/src/extension/panel-index.mjs"))
    const sent = []
    await pushIndexStatus({ _panel: { webview: { postMessage: (m) => sent.push(m) } } })
    const payload = sent.find((m) => m.type === "indexStatus")
    assert.ok(payload, "载荷在场")
    assert.equal(payload.status.files, 3)
    assert.equal(payload.status.chunks, 3)
    assert.equal(payload.status.dbBytes, statSync(dbPath).size, "`dbBytes` = `statSync`（核出口透传）")
    assert.deepEqual(payload.status.origins, [
      { origin: "D:/fxt/alpha", code: 2, doc: 1 },
      { origin: "D:/fxt/beta", code: 1, doc: 0 },
    ], "`origins` 逐条同值")
  } finally {
    configIo._resetConfigPathForTest()
    delete globalThis.__VSCODE_FOLDERS
  }
})

// ─── C4（#697 VSC 渲染）：两读在场 ∕ 缺位隐藏 ────────────────────────────────

test("C4（#697 VSC 渲染）：真 `updateIndexStatus` ⇒ 两读在场；缺位 ∕ 空 ⇒ 隐藏", async () => {
  const { GlobalRegistrator } = await import(pathToFileURL(vscReq.resolve("@happy-dom/global-registrator")).href)
  GlobalRegistrator.register({ url: "http://localhost/" })
  try {
    document.body.innerHTML = `
      <div id="row-embed"></div>
      <div id="index-status">—</div>
      <div id="index-db-size" style="display:none"></div>
      <div id="index-origins" style="display:none"></div>
      <button id="index-build-btn">Build Index</button>`
    const i18n = await import(at("thincoder-vscode/webview/i18n.js"))
    const en = JSON.parse((await import("node:fs")).readFileSync(ROOT + "thincoder-vscode/locales/en.json", "utf8"))
    i18n.setStrings(en)
    const { updateIndexStatus } = await import(at("thincoder-vscode/webview/settings-tools.js"))

    updateIndexStatus({ built: true, files: 3, chunks: 3, dbBytes: 131072, origins: [{ origin: "D:/fxt/alpha", code: 2, doc: 1 }], hasEmbedder: true })
    assert.equal(document.getElementById("index-status").textContent, "✓ Index built: 3 files, 3 chunks")
    assert.equal(document.getElementById("index-db-size").textContent, "Database size: 128.0 KB", "库大小行在场")
    assert.notEqual(document.getElementById("index-db-size").style.display, "none")
    assert.equal(document.getElementById("index-origins").textContent, "D:/fxt/alpha — code 2 · doc 1", "逐 origin 行数行在场")
    assert.notEqual(document.getElementById("index-origins").style.display, "none")

    // 缺位 ∥ 空 ⇒ 隐藏（零节点）
    updateIndexStatus({ built: true, files: 3, chunks: 3, hasEmbedder: true })
    assert.equal(document.getElementById("index-db-size").style.display, "none", "缺 `dbBytes` ⇒ 隐藏")
    assert.equal(document.getElementById("index-db-size").textContent, "")
    assert.equal(document.getElementById("index-origins").style.display, "none", "缺 `origins` ⇒ 隐藏")
    assert.equal(document.getElementById("index-origins").textContent, "")
    updateIndexStatus({ built: false, files: 0, chunks: 0, dbBytes: null, origins: [], hasEmbedder: false })
    assert.equal(document.getElementById("index-db-size").style.display, "none", "`dbBytes` null ⇒ 隐藏")
    assert.equal(document.getElementById("index-origins").style.display, "none", "`origins` 空 ⇒ 隐藏")
  } finally { await GlobalRegistrator.unregister() }
})

// ─── A（#801 腿 A）：60 块两臂 —— 溢出 ∧ 上滚 ×3 ∧ pin 翻假 ∧ 程序化写位 ────────

test("A（#801 腿 A）：60 块两臂（摘要形 ∥ 内容形）⇒ 溢出 ∧ 上滚 ×3 三拍内必动 ∧ `_poolPin` 翻假 ∧ 程序化写位生效", { timeout: 240000 }, async () => {
  const { _electron: electron } = deskReq("playwright-core")
  const home = sandboxHome("lega")
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
  delete env.ELECTRON_RUN_AS_NODE
  let app = null
  try {
    app = await electron.launch({ args: [".", `--user-data-dir=${join(home, "userData")}`], cwd: ROOT + "thincoder-desktop", env, colorScheme: "light" })
    const page = await app.firstWindow()
    await page.waitForLoadState("domcontentloaded")
    await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, { timeout: 30000 })
    await page.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); document.querySelector(".wizard-dismiss")?.click(); await wait(150) })

    const read = () => page.evaluate(() => { const r = document.querySelector('[data-slot="pool"]'); return { st: Math.round(r.scrollTop), pin: r._poolPin, max: r.scrollHeight - r.clientHeight } })
    const hold = (ms) => page.evaluate((t) => new Promise((r) => setTimeout(r, t)), ms).then(read)

    const armOf = async (kind) => {
      const setup = await page.evaluate(async (kind) => {
        const { store } = await import("./store.mjs")
        const { reduce } = await import("./events.mjs")
        const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms))
        if (kind === "summary") {
          store.set({ activeSession: "S1", locale: "en", blocks: [], following: true, pendingNew: 0, tabBadges: {}, pool: { running: 0, approval: 0, queue: [], approvals: [] }, subBlocks: {}, poolCollapsed: {}, history: { hasOlder: false, inFlight: false, page: null } })
          await wait()
          for (let i = 1; i <= 60; i += 1) store.set(reduce(store.get(), { channel: "ev:subagent", key: "S1", status: "started", role: "coder", id: i, pool: true, model: "m", startedAt: Date.now() }))
        } else {
          const rows = (n) => [{ kind: "text", text: Array.from({ length: n }, (_, i) => `row-${i + 1}`).join("\n") }]
          const entries = Array.from({ length: 60 }, (_, i) => ({ key: `k${i + 1}`, label: `coder #${i + 1}`, role: "coder", id: i + 1, rows: rows(6) }))
          store.set({ activeSession: "S1", locale: "en", blocks: [], following: true, pendingNew: 0, tabBadges: {}, pool: { running: 60, approval: 0, queue: [], approvals: [] }, subBlocks: { S1: entries }, poolCollapsed: {}, history: { hasOlder: false, inFlight: false, page: null } })
        }
        await wait(300)
        const root = document.querySelector('[data-slot="pool"]')
        root.scrollTop = 0
        await wait(60)
        return { blocks: root.querySelectorAll(".sub-block").length, sh: root.scrollHeight, ch: root.clientHeight }
      }, kind)

      assert.equal(setup.blocks, 60, `${kind}：60 块在场`)
      assert.ok(setup.sh > setup.ch, `${kind}：溢出成立（${setup.sh} > ${setup.ch}）`)

      await page.evaluate(() => { document.querySelector('[data-slot="pool"]').scrollTop = 1e9 })
      const bottom = await hold(200)
      assert.ok(bottom.st > 0, `${kind}：钉底成立（st=${bottom.st}）`)
      const rc = await page.evaluate(() => { const r = document.querySelector('[data-slot="pool"]').getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })
      await page.mouse.move(rc.x, rc.y)
      const ticks = []
      for (let i = 0; i < 3; i += 1) { await page.mouse.wheel(0, -600); ticks.push(await hold(250)) }
      const [t1, t2, t3] = ticks
      assert.ok(t1.st >= t2.st && t2.st >= t3.st, `${kind}：上滚单调不增（${t1.st} ≥ ${t2.st} ≥ ${t3.st}）`)
      assert.ok(t3.st < bottom.st, `${kind}：三拍内必动（${bottom.st} ⇒ ${t3.st}）`)
      assert.equal(t3.pin, false, `${kind}：_poolPin 翻假`)
      const target = Math.min(200, bottom.max)
      const prog = await page.evaluate(async (v) => { const r = document.querySelector('[data-slot="pool"]'); r.scrollTop = v; await new Promise((res) => setTimeout(res, 80)); return Math.round(r.scrollTop) }, target)
      assert.equal(prog, target, `${kind}：程序化写位生效（${prog}）`)
      return { kind, blocks: setup.blocks, sh: setup.sh, ch: setup.ch, bottom: bottom.st, ticks: [t1.st, t2.st, t3.st], pin: t3.pin, prog }
    }

    const summary = await armOf("summary")
    const content = await armOf("content")
    console.log("[腿A 读数]", JSON.stringify({ summary, content }))
  } finally {
    try { await app?.close() } catch { /* 已退出 */ }
    try { rmSync(home, { recursive: true, force: true }) } catch { /* 清理尽力而为 */ }
  }
})
