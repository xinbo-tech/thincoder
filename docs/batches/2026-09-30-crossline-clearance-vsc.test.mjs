/**
 * 2026-09-30-crossline-clearance-vsc.test.mjs — 批内件（跨线端差存量清零 · B 舱 = VSC 端）。
 * 腿清单（判据语义 = 批档 §2.8 I 行 ∕ §2.2 B 行 ∕ §2.3 族表）：
 *   T-XL3  中止形（I3）：真产者直跑（宿主 shell 中止样本）⇒ `killed: user interrupted` + 判据认族
 *   T-XL4  终端两形（I4）：`(stopped)` 字面零命中（负向锁）+ 两形族形在盘 + 判据真值面
 *   T-XL5  对表 `补` 行（I5）：§12 ∕ §13 两表处置列零 `补` ∕ 零 `删`（负向锁；防空扫）
 *   T-XL7  档位回退（I7）：未在册名（两 preview）⇒ VSC 回退集 = CLI 托底集；在册 ∕ 思考开关族零改
 *   T-XL9  memory 描述面（I9）：两端描述字节同源 + 端零自持描述字面 + 参数面核单源（layer 值域守卫）
 *   T-XL11 槽绑定（I11）：装配链 `agent._slot` 在场 ⇒ compact 直路径回执；负腿 = 未绑定**构造态**
 *          （现盘恒绑定：面板形 `engPersist` 每轮必绑——见批档 §5 披露）⇒ `cwd:` 发现形
 *   T-XL12 slotDigest 地板（I12）：mtime 追超墙钟样本 ⇒ ts = mtime + 写槽面地板源锁
 *   T-XL15a/b/c（I15）：P2-3 差异提交（载荷仅被编辑字段）· P2-5 URI 校验前置（缺 scheme ⇒ 保存即拒、零写盘）·
 *          P2-6 重建保留在编输入（原表单节点回插）
 *   T-XL16a 状态行 ctx 段（I16a）：`context X% Yk` 形 + 缓存复渲 + 尾串缺席 ∕ 警示色两腿
 * 跑法（从仓库根 `thincoder/`）：`node --test docs/batches/2026-09-30-crossline-clearance-vsc.test.mjs`
 * 不入仓套件 · 随批留存归档（单测树重建时回迁端侧单测档）。
 * 桩 ∕ 假 DOM = `2026-09-29-vsc-carryover-settings.test.mjs` ∥ `2026-09-29-residuals-round2-vsc.test.mjs`
 * 先例（registerHooks vscode 短接 + mini DOM）；差异 = 本件带**重建感知** `outerHTML`（providers 卡面：
 * 重建 ⇒ 表单面子树重解析为 fresh 空件——P2-6 判据的判别力本体）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mkdtempSync, readFileSync, writeFileSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// 家目录重定向（安全网：核 config 读写不落真家目录——一切动态 import 之前）
const _home = mkdtempSync(join(tmpdir(), "cc-vsc-home-"))
process.env.HOME = _home
process.env.USERPROFILE = _home

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const vsc = (rel) => pathToFileURL(join(ROOT, "thincoder-vscode", rel)).href
const core = (rel) => pathToFileURL(join(ROOT, "thincoder-core", rel)).href
const src = (rel) => readFileSync(join(ROOT, rel), "utf8")

// ─── vscode 桩（registerHooks 短接——只供装载，行为面零触） ───────────────────────────────

const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(`
export const workspace = { workspaceFolders: [], workspaceFile: undefined, getConfiguration: () => ({ get: () => undefined, update: async () => {} }) }
export const window = { showWarningMessage: async () => undefined, showErrorMessage: async () => undefined, showInformationMessage: async () => undefined, createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {}, tooltip: null, backgroundColor: null, command: null, text: "" }), activeTerminal: null, terminals: [], createTerminal: () => ({ show() {}, sendText() {}, dispose() {} }), onDidChangeTerminalShellIntegration: () => ({ dispose() {} }) }
export const commands = { executeCommand: async () => undefined, registerCommand: () => ({ dispose() {} }) }
export const Uri = { file: (p) => ({ fsPath: p, toString: () => String(p) }), parse: (p) => ({ fsPath: String(p), toString: () => String(p) }) }
export class MarkdownString { constructor(v) { this.value = v } }
export class ThemeColor { constructor(id) { this.id = id } }
export class ThemeIcon { constructor(id) { this.id = id } }
export class Disposable { dispose() {} }
export class EventEmitter { constructor() { this.event = () => ({ dispose() {} }); this.fire = () => {} } }
export const StatusBarAlignment = { Left: 1, Right: 2 }
export const ViewColumn = { One: 1 }
export const env = { openExternal: async () => undefined }
export const extensions = { getExtension: () => null }
export const languages = { createDiagnosticCollection: () => ({ set() {}, clear() {}, dispose() {} }), getDiagnostics: () => [] }
export class Position { constructor(line, ch) { this.line = line; this.character = ch } }
export class Range { constructor(s, e) { this.start = s; this.end = e } }
export const SymbolKind = {}
`)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    return next(specifier, context)
  },
})

// ─── mini 假 DOM（重建感知：`outerHTML=` ⇒ 本子树重解析；id 登记表两向维护） ─────────────

const _byId = new Map()
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
const reg = (n) => { if (n.id) _byId.set(n.id, n); for (const c of n.children) reg(c) }
const unreg = (n) => { if (n.id && _byId.get(n.id) === n) _byId.delete(n.id); for (const c of n.children) unreg(c) }
let onRebuild = null // 重建钩子（providers 卡面：挂 fresh 空件——模拟 re-parse）
class F {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase(); this.id = ""; this.children = []; this.parent = null; this.listeners = []
    this.value = ""; this.checked = false; this.textContent = ""; this.dataset = {}; this.attrs = {}; this.options = []
    this.style = { display: "" }; this._classes = new Set()
    this.classList = { add: (c) => this._classes.add(c), remove: (c) => this._classes.delete(c), contains: (c) => this._classes.has(c) }
  }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)) }
  get className() { return [...this._classes].join(" ") }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  fire(type) { for (const l of this.listeners) if (l.type === type) l.fn({ target: this, preventDefault() {}, stopPropagation() {} }) }
  appendChild(n) { n.parent = this; this.children.push(n); reg(n); return n }
  append(...ns) { for (const n of ns) this.appendChild(n) }
  replaceChildren(...ns) { for (const c of [...this.children]) unreg(c); this.children = []; for (const n of ns) this.appendChild(n) }
  replaceWith(n) { const p = this.parent; if (!p) return; const i = p.children.indexOf(this); if (i >= 0) p.children[i] = n; n.parent = p; reg(n); unreg(this) }
  remove() { const p = this.parent; if (!p) return; const i = p.children.indexOf(this); if (i >= 0) p.children.splice(i, 1); unreg(this) }
  querySelector() { return null }
  querySelectorAll() { return [] }
  closest() { return null }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k.startsWith("data-")) this.dataset[camel(k.slice(5))] = String(v) }
  getAttribute(k) { return k.startsWith("data-") ? (this.dataset[camel(k.slice(5))] ?? null) : (this.attrs[k] ?? null) }
  set innerHTML(v) { this._html = String(v); this.options = []; for (const c of [...this.children]) unreg(c); this.children = [] }
  get innerHTML() { return this._html ?? "" }
  set outerHTML(v) { this._html = String(v); for (const c of [...this.children]) unreg(c); this.children = []; onRebuild?.(this) }
  get outerHTML() { return this._html ?? "" }
}
globalThis.Node = F
globalThis.acquireVsCodeApi = () => ({ postMessage() {}, getState: () => ({}), setState() {} })
globalThis.document = {
  getElementById(id) { if (!_byId.has(id)) { const n = new F("div"); n.id = id; _byId.set(id, n) } return _byId.get(id) },
  createElement: (tag) => new F(tag),
  createTextNode: (v) => ({ textContent: String(v) }),
  querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, removeEventListener() {},
}
globalThis.window = { _vscode: { postMessage: () => {} }, Event: class { constructor(t) { this.type = t } }, addEventListener() {}, removeEventListener() {} }
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)
globalThis.cancelAnimationFrame = () => {}

const postSink = [] // webview → host 上行捕获
window._vscode.postMessage = (m) => postSink.push(m)
const $ = (id) => document.getElementById(id)

// ─── T-XL3 ∕ T-XL4：宿主 bash 中止面 + 终端两形（真产者 ∕ 源锁） ─────────────────────

const { bashTool } = await import(vsc("src/tools/shell.mjs"))
const { toolFailureStatus, isToolFailure } = await import(pathToFileURL(join(ROOT, "thincoder-render-core/lib.mjs")).href)

test("T-XL3 中止形：真产者（宿主 shell 中止）⇒ killed: user interrupted + 判据认族", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cc-xl3-"))
  writeFileSync(join(dir, "sleep.mjs"), "setTimeout(() => {}, 30000)\n")
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 700)
  const out = await bashTool.execute(
    { command: `"${process.execPath}" "${join(dir, "sleep.mjs")}"`, timeout: 15000 },
    { cwd: dir, signal: ctl.signal, agent: { config: {} } },
  )
  clearTimeout(t)
  assert.ok(out.includes("killed: user interrupted"), `实读：${out}`)
  assert.equal(toolFailureStatus(out), "(killed: user interrupted)")
  assert.equal(isToolFailure(out), true)
})

test("T-XL4 终端两形：`(stopped)` 零残留 + 两形族形在盘 + 判据真值面", () => {
  const s = src("thincoder-vscode/src/tools/shell.mjs")
  assert.equal((s.match(/\(stopped\)/g) ?? []).length, 0, "(stopped) 负向锁")
  assert.equal(s.includes("killed — timeout"), false, "破折号形零产者")
  assert.equal(s.includes("watch the terminal if it matters"), false, "旧完成形退场")
  assert.ok(s.includes("(killed: timeout ${timeout || BASH_TIMEOUT_MS}ms)"), "超时形 = 族成员形")
  assert.ok(s.includes("\\n(exit code unavailable in terminal mode)`"), "完成形 = 标记族形")
  assert.equal(toolFailureStatus("(killed: timeout 400ms)"), "(killed: timeout 400ms)")
  assert.equal(isToolFailure("[stdout]:\nhi\n(exit code unavailable in terminal mode)"), false)
})

// ─── T-XL5：对表 `补` 行结清（§12 ∕ §13 处置列负向锁） ────────────────────────────────

test("T-XL5 对表：§12 ∕ §13 两表处置列零 `补` ∖ 零 `删`（负向锁，防空扫）", () => {
  const txt = src("docs/vsc/design/WEBVIEW-PROTOCOL.md")
  const sec = txt.slice(txt.indexOf("## 12."), txt.indexOf("## 变更记录"))
  assert.ok(sec.length > 2000, "节面切片在场")
  const dispositions = sec.split("\n")
    .filter((l) => /^\|/.test(l) && !/^\|[\s\-|:]+\|$/.test(l))
    .map((l) => l.split("|")[4]?.trim())
    .filter((c) => c && ["`活`", "`删`", "`补`", "`未处置`"].includes(c))
  assert.ok(dispositions.length >= 80, `行数防空扫（实读 ${dispositions.length}）`)
  assert.deepEqual([...new Set(dispositions)], ["`活`"])
})

// ─── T-XL7：档位回退（未在册名 ⇒ 全档；对齐 CLI 托底形） ─────────────────────────────

const { effortEnumForModel } = await import(vsc("src/specs.mjs"))
const { SS, effortEnumFor, effortSelectView } = await import(vsc("webview/settings-state.js"))

test("T-XL7 档位回退：未在册名（两 preview）⇒ VSC 集 = CLI 托底集；在册 ∕ 思考开关族零改", () => {
  // CLI 托底形真源提取（单向读 CLI 码——非自证）
  const cliLine = /spec\.reasoningEffortEnum \?\? (\[[^\]]*\])/.exec(src("thincoder-cli/src/tui/cmd-think.mjs"))
  assert.ok(cliLine, "CLI 托底形在盘（cmd-think.mjs）")
  const cliFallback = JSON.parse(cliLine[1].replace(/'/g, '"'))
  for (const id of ["hy3-preview", "hy4-preview"]) {
    const vscEnum = effortEnumForModel(id)
    assert.deepEqual(vscEnum, ["high", "max"], id)
    assert.deepEqual(vscEnum, cliFallback, `${id} 两端同回退（CLI 托底集逐字）`)
    SS.getModels = () => [{ id, provider: "p", reasoning: vscEnum }]
    const view = effortSelectView(id, "high")
    assert.deepEqual(view.levels, ["—", "high", "max"], `${id} 下拉选项集`)
    assert.equal(view.selected, "high")
  }
  assert.deepEqual(effortEnumForModel("kimi-k3"), ["low", "high", "max"], "在册枚举零改")
  assert.deepEqual(effortEnumForModel("mimo-v2.5"), ["enabled"], "思考开关族单档零改")
  SS.getModels = () => []
  SS.agentSettings = { effortEnums: { "hy3-preview": ["high", "max"], "mimo-v2.5": ["enabled"] } }
  assert.deepEqual(effortEnumFor("hy3-preview"), ["high", "max"], "插补面同回退")
  assert.deepEqual(effortEnumFor("mimo-v2.5"), [], "enabled 哨兵两源同滤")
  assert.match(src("thincoder-vscode/src/extension/provider-probe-window.mjs"), /effortEnumForModel\(id\)/)
  assert.match(src("thincoder-vscode/src/extension/settings.mjs"), /\[id, effortEnumForModel\(id\)\]/)
})

// ─── T-XL9：memory 描述面核单源 ─────────────────────────────────────────────────────

test("T-XL9 memory 面：两端描述字节同源 + 端零自持描述字面 + 参数单源（layer 值域守卫）", async () => {
  const { memoryTool, wireMemoryFace } = await import(vsc("src/memory-tool.mjs"))
  const { memoryTools } = await import(core("memory.mjs"))
  const face = memoryTools(null, {})[0]
  assert.equal(memoryTool.description, face.description, "两端描述字节同源（直驱核 memoryTools）")
  wireMemoryFace(face)
  const p = memoryTool.parameters.properties
  assert.deepEqual(Object.keys(p), Object.keys(face.parameters.properties), "参数面核单源")
  assert.deepEqual(p.layer.enum, ["personal", "project"], "端唯一收窄 = layer 值域守卫")
  assert.equal(p.layer.description, face.parameters.properties.layer.description)
  const s = src("thincoder-vscode/src/memory-tool.mjs")
  for (const legacy of ["Manage long-term memory in ONE tool", "Save bugs, conventions, and preferences", "Operation to run (required)", "find knowledge saved in previous sessions"]) {
    assert.equal(s.includes(legacy), false, `端残留描述串：${legacy}`)
  }
  assert.match(src("thincoder-vscode/src/agent/tool-table.mjs"), /wireMemoryFace\(memoryTools\(null, \{\}\)\[0\]\)/)
})

// ─── T-XL11：槽绑定（装配链锁 + compact 回执两分支） ─────────────────────────────────

test("T-XL11 槽绑定：装配链 `agent._slot` 在场 ⇒ 直路径回执；未绑定（构造态）⇒ `cwd:` 形", async () => {
  const { setupAgentRun } = await import(vsc("src/agent/setup.mjs"))
  const { slotPath } = await import(vsc("src/extension/session-slots.mjs"))
  const { contextTool } = await import(core("agent-tools/context.mjs"))
  const cwd = mkdtempSync(join(tmpdir(), "cc-xl11-"))
  const slot = 3
  const { agent } = await setupAgentRun({
    provider: { model: "m", baseURL: "http://x" }, cwd, input: "hi",
    opts: { engPersist: { cwd, slot }, history: [], fullHistory: [] },
    depth: 0, role: null, getAuto: () => false,
  })
  assert.equal(agent._slot, slot, "装配链锁：面板槽 → agent._slot（setup.mjs:277 绑定）")
  const receipt = await contextTool.execute({ action: "compact", focus: "t" }, { agent })
  assert.ok(receipt.includes(`read_history path="${slotPath(cwd, slot)}"`), "直路径回执")
  // 负腿 = 构造态（现盘恒绑定：面板形 engPersist 每轮必绑——批档 §5 披露）：`_slot` 缺省 ⇒ `cwd:` 发现形
  const r2 = await contextTool.execute({ action: "compact", focus: "t" }, { agent: { cwd, history: [] } })
  assert.ok(r2.includes(`read_history path="cwd:${cwd}"`), "未绑定端仍走 `cwd:` 形")
  assert.equal(r2.includes("Full record (never compacted)"), false)
})

// ─── T-XL12：slotDigest ts 地板 ────────────────────────────────────────────────────

test("T-XL12 slotDigest 地板：mtime 追超墙钟 ⇒ ts = mtime + 写槽面地板源锁", async () => {
  const { _setSessionsDirForTest, _resetSessionsDirForTest, newSlot, loadManifest, slotPath } = await import(vsc("src/extension/session-io.mjs"))
  const { slotDigest } = await import(vsc("src/extension/session-slots.mjs"))
  const dir = mkdtempSync(join(tmpdir(), "cc-xl12-"))
  const cwd = mkdtempSync(join(tmpdir(), "cc-xl12-cwd-"))
  _setSessionsDirForTest(dir)
  try {
    const slot = await newSlot(cwd)
    const p = slotPath(cwd, slot)
    const digest = loadManifest(cwd).slots[slot]
    assert.ok(digest.ts >= statSync(p).mtimeMs, "写槽面 ts ≥ 写后 mtime（地板）")
  } finally { _resetSessionsDirForTest() }
  const future = Date.now() + 60_000
  assert.equal(slotDigest({ history: [] }, future).ts, future, "mtime 追超墙钟样本 ⇒ ts = mtime")
  assert.ok(slotDigest({ history: [] }).ts <= Date.now() + 1000, "mtime 缺省 ⇒ 裸墙钟")
  assert.match(src("thincoder-vscode/src/extension/session-io.mjs"), /slotDigest\(data, wroteMtime\)/)
})

// ─── T-XL15a/b/c：设置面三条（P2-3 ∕ P2-5 ∕ P2-6） ──────────────────────────────────

const tmpConfig = () => { const d = mkdtempSync(join(tmpdir(), "cc-xl15-")); const f = join(d, "config.json"); writeFileSync(f, "{}\n"); return f }

test("T-XL15a P2-3 差异提交：改一控件 ⇒ 载荷仅该字段 + 未编辑键零写盘", async () => {
  const { bindAgentControls } = await import(vsc("webview/settings-agent.js"))
  const card = new F("section"); card.className = "settings-card"
  const maxturns = new F("input"); maxturns.id = "ag-maxturns"; maxturns.value = "200"
  const subturns = new F("input"); subturns.id = "ag-subturns"; subturns.value = "100"
  const poolEng = new F("input"); poolEng.id = "ag-pool-engcoder"; poolEng.value = "4"
  card.appendChild(maxturns); card.appendChild(subturns); card.appendChild(poolEng)
  maxturns.closest = () => card
  const origQ = card.querySelectorAll.bind(card)
  card.querySelectorAll = (sel) => (sel === "input, select" ? [maxturns, subturns, poolEng] : origQ(sel))
  SS.agentSettings = { maxTurns: 200, subagentTurns: 100, consultModels: [] }
  bindAgentControls()
  maxturns.value = "300"
  maxturns.fire("change")
  const msg = postSink.at(-1)
  assert.equal(msg.type, "saveAgentSettings")
  assert.deepEqual(Object.keys(msg.settings), ["maxTurns"], "载荷仅被编辑字段")
  assert.equal(msg.settings.maxTurns, "300")
  poolEng.value = "5"
  poolEng.fire("change")
  assert.deepEqual(Object.keys(postSink.at(-1).settings), ["poolLimits"], "池组单位 = 载荷字段（写面原子单位）")
  // 写面负向锁：tmp config 直驱差异载荷 ⇒ 盘上只多 maxTurns（未编辑键零物化）
  const cfg = tmpConfig()
  const { _setConfigPathForTest } = await import(core("config-io.mjs"))
  _setConfigPathForTest(cfg)
  const { saveAgentSettingsFromPanel } = await import(vsc("src/extension/settings.mjs"))
  saveAgentSettingsFromPanel({ maxTurns: 300 })
  const after = JSON.parse(readFileSync(cfg, "utf8"))
  assert.deepEqual(Object.keys(after.agent ?? {}), ["maxTurns"])
})

test("T-XL15b P2-5 URI 校验前置：缺 scheme ⇒ 保存即拒（零写盘）；合形 ⇒ 落盘", async () => {
  const { _setConfigPathForTest } = await import(core("config-io.mjs"))
  const { saveProxySettingsFromPanel } = await import(vsc("src/extension/settings.mjs"))
  const cfg = tmpConfig()
  _setConfigPathForTest(cfg)
  const before = readFileSync(cfg, "utf8")
  assert.match(String(saveProxySettingsFromPanel({ uri: "10.2.2.112:3128" })), /Invalid proxy URI/)
  assert.equal(readFileSync(cfg, "utf8"), before, "拒 ⇒ 逐字节零写盘")
  assert.match(String(saveProxySettingsFromPanel({ uri: "socks5://x" })), /Unsupported proxy protocol/)
  assert.equal(readFileSync(cfg, "utf8"), before)
  assert.equal(saveProxySettingsFromPanel({ uri: "http://10.2.2.112:3128" }), null)
  assert.match(readFileSync(cfg, "utf8"), /http:\/\/10\.2\.2\.112:3128/)
})

test("T-XL15c P2-6 重建保留在编输入：background 准入变化 ⇒ 原位重建后未落盘输入仍在", async () => {
  const { updateProviderStatus } = await import(vsc("webview/settings-providers.js"))
  const panel = $("settings-panel"); panel.style.display = "flex"
  const card = $("providers-card")
  const form = new F("div"); form.id = "prov-add-form"; form.style.display = "block"
  const name = new F("input"); name.id = "pa-name"; name.value = "my-provider"
  const url = new F("input"); url.id = "pa-url"; url.value = "https://api.example.com/v1"
  const key = new F("input"); key.id = "pa-key"; key.value = "sk-1"
  form.appendChild(name); form.appendChild(url); form.appendChild(key)
  card.appendChild(form)
  onRebuild = (c) => { // 模拟 re-parse：本卡子树重解析 ⇒ 表单面为 fresh 空件
    const fresh = new F("div"); fresh.id = "prov-add-form"; fresh.style.display = "none"
    const list = new F("div"); list.id = "prov-list"
    c.appendChild(fresh); c.appendChild(list)
  }
  SS.providerStatus = { providers: { a: { configured: true } }, labels: {} }
  updateProviderStatus({ providers: { a: { configured: true }, b: { configured: true } }, labels: {} })
  const survived = $("prov-add-form")
  assert.equal(survived, form, "原表单节点回插（在编输入随节点存活）")
  assert.equal($("pa-name").value, "my-provider")
  assert.equal($("pa-url").value, "https://api.example.com/v1")
  assert.equal($("pa-key").value, "sk-1")
  assert.equal(survived.style.display, "block")
  assert.equal($("prov-list").style.display, "none")
})

// ─── T-XL16a：状态行 ctx 段 `context X% Yk` ────────────────────────────────────────

test("T-XL16a 状态行 ctx 段：`context X% Yk` 形 + 缓存复渲 + 尾串缺席 ∕ 警示色腿", async () => {
  const { renderStatusBar, handleUsageMessage } = await import(vsc("webview/status-bar.js"))
  const line = $("status-line")
  handleUsageMessage({ usage: {}, ctxPct: 24, ctxTokens: 12345 })
  assert.match(line.innerHTML, /context 24% 12k/)
  handleUsageMessage({ usage: {}, ctxPct: 30 })
  assert.match(line.innerHTML, /context 30%/, "tokens 缺 ⇒ 尾串缺席")
  assert.equal(/context 30% \d/.test(line.innerHTML), false)
  renderStatusBar()
  assert.match(line.innerHTML, /context 30%/, "无参复渲走缓存槽")
  handleUsageMessage({ usage: {}, ctxPct: 85, ctxTokens: 1500 })
  assert.match(line.innerHTML, /context 85% 1\.5k/, "警示色支尾串并存")
})
