/**
 * 2026-09-30-vsc-residuals.test.mjs — 批内件（VSC 残债清付 · #675 面板 agent 保存失败面接入 7⇒8）。
 * 跑法（从仓库根 `thincoder/`）：`node --test docs/batches/2026-09-30-vsc-residuals.test.mjs`
 * 不入仓套件 · 随批留存归档（批件直跑 = 本批验证面）。
 * 腿清单（判据语义 = 批档 §2.2）：
 *   L1（站点接线 · 行为）：写冲突 ⇒ stub panel 捕获 `{type:"providerError", scope:"agent", reason:"mtime-conflict"}`
 *   L2（负控）：正常保存 ⇒ 零 `providerError` 发射 ∧ 盘面写入生效
 *   L3（webview 段标）：`showSettingsError("agent","mtime-conflict")` ⇒ banner 在场 + 段标出词 + `data-scope="agent"`
 * L1 制造法：临时 config（核 `_setConfigPathForTest`）+ Proxy 载荷——`"defaultModel" in payload` 恰在核
 *   `writeConfigAtomic` 的 mutate 体（t0 stat 后 ∕ t1 stat 前）解引用 ⇒ 该点外部写盘 = 真实「窗内对端写」
 *   （沿核 `conflictError` 触发面）；utimesSync 使 mtime 确定相异（规避文件系统时间戳粒度）。
 * vscode 桩 = `2026-09-28-tech-debt-closeout-r8.test.mjs` 先例（registerHooks 短接——只供装载，行为面零触）。
 * 假 DOM（L3）= `2026-09-29-vsc-carryover-settings.test.mjs` 先例的最小面（banner 三判据所需）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mkdtempSync, readFileSync, writeFileSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// 家目录重定向（安全网：核 `configDir` 于模组装载期取值——一切动态 import 之前覆盖，防误写真实配置）
const _tmpHome = mkdtempSync(join(tmpdir(), "vsc-residuals-home-"))
process.env.HOME = _tmpHome
process.env.USERPROFILE = _tmpHome

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const vsc = (rel) => pathToFileURL(join(ROOT, "thincoder-vscode", rel)).href
const core = (rel) => pathToFileURL(join(ROOT, "thincoder-vscode", "node_modules", "@thincoder", "core", rel)).href

// ─── vscode 桩（宿主模块短接——VSC 扩展链只供装载）────────────────────────────

const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(`
export const workspace = { workspaceFolders: [], workspaceFile: undefined, getConfiguration: () => ({ get: () => undefined, update: async () => {} }) }
export const window = { showWarningMessage: async () => undefined, showErrorMessage: async () => undefined, showInformationMessage: async () => undefined, createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {}, tooltip: null, backgroundColor: null, command: null, text: "" }) }
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
export const languages = { createDiagnosticCollection: () => ({ set() {}, clear() {}, dispose() {} }) }
`)
registerHooks({ resolve(specifier, context, next) { if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }; return next(specifier, context) } })

// ─── 最小假 DOM（L3 banner 判据面）────────────────────────────────────────────

class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.id = ""; this.children = []; this.attrs = {}; this.parent = null; this.textContent = ""; this.style = {}; this._classes = new Set() }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)) }
  get className() { return [...this._classes].join(" ") }
  setAttribute(k, v) { this.attrs[k] = String(v) }
  getAttribute(k) { return this.attrs[k] ?? null }
  appendChild(node) { node.parent = this; this.children.push(node); return node }
  append(...ns) { for (const n of ns) this.appendChild(n) }
  prepend(node) { node.parent = this; this.children.unshift(node) }
  remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); this.parent = null } }
  addEventListener() {}
  focus() {}
}
const findIn = (node, id) => { if (node.id === id) return node; for (const c of node.children) { const hit = findIn(c, id); if (hit) return hit } return null }
const panelEl = new El("div"); panelEl.id = "settings-panel"; panelEl.style.display = "flex" // 开面板态（建面前提）
const bodyEl = new El("div"); bodyEl.id = "settings-body"
const lazyStubs = new Map() // 未知 id = 惰性桩（装载期零解析面；沿先例 getElementById 不返回 null）
const getEl = (id) => (id === panelEl.id ? panelEl : id === bodyEl.id ? bodyEl : findIn(bodyEl, id) ?? (lazyStubs.has(id) ? lazyStubs.get(id) : lazyStubs.set(id, new El("div")).get(id)))
globalThis.Node = El
globalThis.document = { getElementById: getEl, createElement: (tag) => new El(tag), querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, removeEventListener: () => {} }
globalThis.window = { _vscode: { postMessage: () => {} }, addEventListener: () => {}, removeEventListener: () => {} }
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)

// ─── L1 ∕ L2 扩展面：临时 config 直驱真实 `handleSaveAgentSettings` ─────────────

const tmpCfg = () => { const dir = mkdtempSync(join(tmpdir(), "vsc-residuals-675-")); const cfg = join(dir, "config.json"); writeFileSync(cfg, JSON.stringify({ agent: { maxTurns: 5 } }, null, 2)); return cfg }
const panelStub = (sink) => ({ _panel: { webview: { postMessage: (m) => sink.push(m) } }, _pushSettingsLight: () => sink.push({ type: "pushed" }) })

test("L1 接线（行为）：写冲突 ⇒ stub panel 捕获 providerError{scope:'agent', reason:'mtime-conflict'}", async () => {
  const { handleSaveAgentSettings } = await import(vsc("src/extension/panel-messages-settings.mjs"))
  const coreIo = await import(core("config-io.mjs"))
  const cfg = tmpCfg()
  coreIo._setConfigPathForTest(cfg)
  try {
    const sink = []
    // 窗内外部写：`"defaultModel" in payload` 恰在 `writeConfigAtomic` mutate 体（t0 后 ∕ t1 前）解引用
    let armed = true
    const payload = new Proxy({ maxTurns: 77 }, {
      has(target, key) {
        if (key === "defaultModel" && armed) {
          armed = false
          writeFileSync(cfg, JSON.stringify({ shell: "/externally-written" }, null, 2))
          const t = Date.now() + 5000 // mtime 确定相异（不依赖时间戳粒度）
          utimesSync(cfg, new Date(t), new Date(t))
        }
        return Reflect.has(target, key)
      },
    })
    handleSaveAgentSettings(panelStub(sink), { settings: payload })
    const errors = sink.filter((m) => m.type === "providerError")
    assert.deepEqual(errors, [{ type: "providerError", scope: "agent", reason: "mtime-conflict" }], "冲突 ⇒ 恰一条 agent scope 发射")
    assert.deepEqual(sink.map((m) => m.type), ["providerError", "pushed"], "发射序 = 失败面先 ∕ 回推后")
    assert.deepEqual(JSON.parse(readFileSync(cfg, "utf8")), { shell: "/externally-written" }, "冲突 ⇒ 本端写放弃（盘面 = 外部写内容）")
  } finally { coreIo._resetConfigPathForTest() }
})

test("L2 负控：正常保存 ⇒ 零 providerError 发射 ∧ 盘面写入生效", async () => {
  const { handleSaveAgentSettings } = await import(vsc("src/extension/panel-messages-settings.mjs"))
  const coreIo = await import(core("config-io.mjs"))
  const cfg = tmpCfg()
  coreIo._setConfigPathForTest(cfg)
  try {
    const sink = []
    handleSaveAgentSettings(panelStub(sink), { settings: { maxTurns: 42 } })
    assert.equal(sink.filter((m) => m.type === "providerError").length, 0, "零失败面发射")
    assert.deepEqual(sink.map((m) => m.type), ["pushed"], "仅回推")
    assert.equal(JSON.parse(readFileSync(cfg, "utf8")).agent?.maxTurns, 42, "盘面写入生效")
  } finally { coreIo._resetConfigPathForTest() }
})

// ─── L3 webview 段标（假 DOM 直驱）────────────────────────────────────────────

test("L3 webview 段标：showSettingsError('agent','mtime-conflict') ⇒ banner 在场 + 段标出词 + data-scope='agent'", async () => {
  const { setStrings } = await import(vsc("webview/i18n.js"))
  const EN = JSON.parse(readFileSync(join(ROOT, "thincoder-vscode/locales/en.json"), "utf8"))
  setStrings(EN) // 真词面（段标 ∕ 词化句断言 = en.json 真值）
  const { showSettingsError } = await import(vsc("webview/settings.js"))
  showSettingsError("agent", "mtime-conflict")
  const banner = findIn(bodyEl, "settings-error-banner")
  assert.ok(banner, "banner 在场（面板开态）")
  assert.equal(banner.parent, bodyEl, "banner 挂 settings-body")
  assert.equal(banner.getAttribute("data-scope"), "agent", "data-scope 携 agent")
  const scope = banner.children.find((c) => c.className === "settings-error-scope")
  assert.equal(scope?.textContent, EN["settings.agentSection"], "段标出词 = settings.agentSection")
  const text = banner.children.find((c) => c.className === "settings-error-text")
  assert.equal(text?.textContent, EN["settings.reason.mtimeConflict"], "词化句（表内出词）")
  assert.notEqual(text?.textContent, "mtime-conflict", "≠ 原串（词化成立）")
})
