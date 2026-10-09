/**
 * 2026-10-10-vsc-consistency.harness.mjs — 批内件测试台（mini 假 DOM + vscode 装缝 + 真词面装载；
 * 供 `2026-10-10-vsc-consistency.test.mjs` 腿族共用）。
 *
 * 装缝 = `registerHooks` vscode 桩（先例 = `docs/batches/2026-10-08-provider-key-guards-vsc.test.mjs:75`）；
 * mini 假 DOM = `docs/batches/2026-10-07-provider-config-parity-vsc-harness.mjs` 先例（按本批面收窄：
 * `select.options` 维护 ∥ 弹窗族 DYNAMIC_IDS（未开框 ⇒ null——单例判据真判）∥ 计时器桩 + 焦点序）。
 * 拆档由来 = 主档（腿族）越 500 软线 ⇒ 测试台抽公档（先例在册——「测试台抽公档（第三档，报备）」）。
 */
import { registerHooks } from "node:module"
import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// 家目录重定向（安全网：一切动态 import 之前覆盖——防误写真实配置 / 会话目录）
const _home = mkdtempSync(join(tmpdir(), "vsc-consistency-home-"))
process.env.HOME = _home
process.env.USERPROFILE = _home

export const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
export const vsc = (rel) => pathToFileURL(join(ROOT, "thincoder-vscode", rel)).href
export const core = (rel) => pathToFileURL(join(ROOT, "thincoder-core", rel)).href
export const vscSrc = (rel) => readFileSync(join(ROOT, "thincoder-vscode", rel), "utf8")

// ─── vscode 桩（registerHooks 短接——guards 先例）───────────────────────────────

export const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(`
export const notices = []
export const workspace = {
  workspaceFolders: [],
  workspaceFile: undefined,
  getConfiguration: () => ({ get: () => undefined, update: async () => {} }),
  onDidChangeWorkspaceFolders: () => ({ dispose() {} }),
  findFiles: async () => [],
  getWorkspaceFolder: () => null,
}
export const window = {
  showWarningMessage: async (m) => { notices.push({ kind: "warn", m }); return undefined },
  showErrorMessage: async (m) => { notices.push({ kind: "error", m }); return undefined },
  showInformationMessage: async (m) => { notices.push({ kind: "info", m }); return undefined },
  showQuickPick: async (...a) => (globalThis.__vscQuickPick ? globalThis.__vscQuickPick(...a) : undefined),
  showInputBox: async () => undefined,
  createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {}, tooltip: null, backgroundColor: null, command: null, text: "" }),
  activeTerminal: null,
  terminals: [],
  createTerminal: () => ({ show() {}, sendText() {}, dispose() {} }),
  onDidChangeTerminalShellIntegration: () => ({ dispose() {} }),
  onDidChangeActiveTextEditor: () => ({ dispose() {} }),
  withProgress: async (_o, fn) => fn({ report() {} }),
}
export const commands = { executeCommand: async () => undefined, registerCommand: () => ({ dispose() {} }) }
export const Uri = { file: (p) => ({ fsPath: p, toString: () => String(p) }), parse: (p) => ({ fsPath: String(p), toString: () => String(p) }) }
export class MarkdownString { constructor(v) { this.value = v } }
export class ThemeColor { constructor(id) { this.id = id } }
export class ThemeIcon { constructor(id) { this.id = id } }
export class Disposable { dispose() {} }
export class EventEmitter { constructor() { this.event = () => ({ dispose() {} }); this.fire = () => {} } }
export const StatusBarAlignment = { Left: 1, Right: 2 }
export const ViewColumn = { One: 1 }
export const env = { openExternal: async () => undefined, language: "en" }
export const extensions = { getExtension: () => null }
export const languages = { createDiagnosticCollection: () => ({ set() {}, clear() {}, dispose() {} }), getDiagnostics: () => [] }
export class Position { constructor(line, ch) { this.line = line; this.character = ch } }
export class Range { constructor(s, e) { this.start = s; this.end = e } }
export const SymbolKind = {}
export const ConfigurationTarget = { Global: 1, Workspace: 2 }
`)

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

// ─── mini 假 DOM ───────────────────────────────────────────────────────────────

const camelId = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
const _attached = new Map() // 挂树节点（真 DOM `getElementById` 语义面）
const _stubs = new Map()    // 静态件替身（index.html 件）
// 动态件：不在树 ⇒ null（真 DOM 语义——弹窗开 ∥ 关建清；否则单例判据被幻影桩假绿）
const DYNAMIC_IDS = new Set([
  "prov-add-dialog", "pa-type", "pa-preset-info", "pa-custom-fields", "pa-name", "pa-url", "pa-format",
  "pa-key", "pa-proxy", "pa-custom-tail", "pa-fetch-btn", "pa-conn-status", "pa-save-btn", "pa-cancel-btn",
])
export const _focused = [] // focus() 序

class FText { constructor(v) { this.textContent = String(v) } }

class FNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase(); this.id = ""; this.attrs = {}; this.dataset = {}
    this.children = []; this.listeners = []; this.textContent = ""; this.parent = null
    this.value = ""; this.checked = false; this.type = ""; this.title = ""; this.placeholder = ""
    this.disabled = false; this.options = []; this.offsetHeight = 0
    this.style = new Proxy({}, { get: (t, k) => (k in t ? t[k] : ""), set: (t, k, v) => { t[k] = v; return true } })
    this._classes = new Set()
    this.classList = {
      add: (...cs) => { for (const c of cs) this._classes.add(c) },
      remove: (...cs) => { for (const c of cs) this._classes.delete(c) },
      contains: (c) => this._classes.has(c),
      toggle: (c) => { this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c) },
    }
  }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)) }
  get className() { return [...this._classes].join(" ") }
  setAttribute(k, v) { const s = String(v); this.attrs[k] = s; if (k === "class") this.className = s; else if (k.startsWith("data-")) this.dataset[camelId(k.slice(5))] = s }
  getAttribute(k) { if (k.startsWith("data-")) { const v = this.dataset[camelId(k.slice(5))]; if (v !== undefined) return String(v) } return this.attrs[k] ?? null }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  removeEventListener() {}
  fire(type, extra = {}) {
    const ev = { type, target: this, stopped: false, preventDefault() {}, stopPropagation() { ev.stopped = true }, ...extra }
    for (const l of [...this.listeners]) if (l.type === type) l.fn(ev)
    return ev
  }
  focus() { _focused.push(this) }
  getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 } }
  get parentElement() { return this.parent }
  get childNodes() { return [...this.children] }
  appendChild(node) {
    const child = node instanceof FNode || node instanceof FText ? node : new FText(node)
    child.parent = this
    this.children.push(child)
    if (this.tagName === "SELECT" && child instanceof FNode && child.tagName === "OPTION") this.options.push(child)
    regTree(child)
    return child
  }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  prepend(node) { const child = node instanceof FNode || node instanceof FText ? node : new FText(node); child.parent = this; this.children.unshift(child); regTree(child) }
  replaceChildren(...nodes) { for (const c of [...this.children]) unregTree(c); this.children = []; this.options = []; for (const n of nodes) this.appendChild(n) }
  remove() {
    if (this.parent) {
      const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1)
      const oi = this.parent.options.indexOf(this); if (oi >= 0) this.parent.options.splice(oi, 1)
      this.parent = null
    }
    unregTree(this)
  }
  walk(fn) { for (const c of this.children) if (c instanceof FNode) { fn(c); c.walk(fn) } }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matchSelector(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (matchSelector(n, sel)) out.push(n) }); return out }
  closest() { return null }
  contains(n) { for (let c = n; c; c = c.parent ?? null) if (c === this) return true; return false }
  set innerHTML(v) { for (const c of [...this.children]) unregTree(c); this.children = []; this.options = []; this._html = String(v) }
  get innerHTML() { return this._html ?? "" }
  set outerHTML(v) { this._html = String(v); for (const c of [...this.children]) { c.parent = null; unregTree(c) }; this.children = [] }
  get outerHTML() { return this._html ?? "" }
}

function regTree(n) { if (!(n instanceof FNode)) return; if (n.id) _attached.set(n.id, n); for (const c of n.children) regTree(c) }
function unregTree(n) { if (!(n instanceof FNode)) return; if (n.id && _attached.get(n.id) === n) _attached.delete(n.id); for (const c of n.children) unregTree(c) }

/** 选择器（子集）：逗号 ∪ ∥ 后代空白 ∥ `#id` ∥ `.class` ∥ `[attr]` ∥ `[attr="v"]` ∥ tag。 */
function matchSelector(node, sel) {
  for (const part of String(sel).split(",")) { const s = part.trim(); if (s && matchCompound(node, s)) return true }
  return false
}
function matchCompound(node, sel) {
  const parts = sel.split(/\s+/).filter(Boolean)
  if (!matchSimple(node, parts[parts.length - 1])) return false
  let p = node.parent
  for (let i = parts.length - 2; i >= 0; i--) {
    let found = false
    while (p) { if (p instanceof FNode && matchSimple(p, parts[i])) { found = true; p = p.parent; break } p = p.parent }
    if (!found) return false
  }
  return true
}
function matchSimple(node, sel) {
  const re = /(\w+)|#([\w-]+)|\.([\w-]+)|\[([^\]=]+)(?:="([^"]*)")?\]/g
  let m; let matched = false
  while ((m = re.exec(sel)) !== null) {
    matched = true
    if (m[1] !== undefined) { if (node.tagName !== m[1].toUpperCase()) return false }
    else if (m[2] !== undefined) { if (node.id !== m[2]) return false }
    else if (m[3] !== undefined) { if (!node.classList.contains(m[3])) return false }
    else {
      const val = m[4].startsWith("data-") ? node.dataset[camelId(m[4].slice(5))] : node.attrs[m[4]]
      if (val === undefined || val === null) return false
      if (m[5] !== undefined && String(val) !== m[5]) return false
    }
  }
  return matched
}

// 计时器桩（推进 = 手动 `drainTimers`——开框焦点 +50ms）
const timers = []
globalThis.setTimeout = (fn, ms) => { const h = { fn, ms }; timers.push(h); return h }
globalThis.clearTimeout = (h) => { const i = timers.indexOf(h); if (i >= 0) timers.splice(i, 1) }
export const drainTimers = () => { let guard = 0; while (timers.length > 0 && guard++ < 1000) { const h = timers.shift(); try { h.fn() } catch { /* 桩件定时器兜底 */ } } }

export const postSink = [] // webview → host 上行捕获（全部出口）
globalThis.Node = FNode
export const bodyEl = new FNode("body")
globalThis.document = {
  body: bodyEl,
  documentElement: new FNode("html"),
  head: new FNode("head"),
  getElementById(id) {
    if (_attached.has(id)) return _attached.get(id)
    if (DYNAMIC_IDS.has(id)) return null
    if (!_stubs.has(id)) { const n = new FNode("div"); n.id = id; _stubs.set(id, n) }
    return _stubs.get(id)
  },
  createElement: (t) => new FNode(t),
  createTextNode: (v) => new FText(v),
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null },
  querySelectorAll(sel) { const out = []; bodyEl.walk((n) => { if (matchSelector(n, sel)) out.push(n) }); return out },
  addEventListener() {},
  removeEventListener() {},
}
globalThis.window = {
  _vscode: { postMessage: (m) => postSink.push(m) },
  innerWidth: 1200,
  innerHeight: 800,
  Event: class { constructor(t) { this.type = t } },
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
  cancelAnimationFrame: () => {},
  addEventListener() {},
  removeEventListener() {},
}
globalThis.acquireVsCodeApi = () => ({ postMessage: (m) => postSink.push(m), getState: () => ({}), setState() {} })

export const byId = (id) => document.getElementById(id)
/** 用例级清洗（各腿自守）：弹窗族件清（卡 ∥ 幕随 `remove`）、计时器排空、上行簿清零。 */
export const clearAll = () => {
  document.querySelectorAll(".settings-dialog-backdrop, .settings-dialog").forEach((el) => el.remove())
  drainTimers()
  postSink.length = 0
  _focused.length = 0
}

// ─── 装载 webview 链（DOM 桩就绪后）+ 真词面 ─────────────────────────────────────

const { setStrings } = await import(vsc("webview/i18n.js"))
export const EN = JSON.parse(vscSrc("locales/en.json"))
export const ZH = JSON.parse(vscSrc("locales/zh.json"))
setStrings(EN)
export const dialog = await import(vsc("webview/settings-provider-dialog.js"))
export const sessionBar = await import(vsc("webview/session-bar.js"))

// ─── 装载宿主链（registerHooks 之后）─────────────────────────────────────────────

export const vs = await import(VSCODE_STUB_URL)
export const sessionIo = await import(vsc("src/extension/session-io.mjs"))
export const panelMessages = await import(vsc("src/extension/panel-messages.mjs"))
export const panelProject = await import(vsc("src/extension/panel-project.mjs"))
export const settingsHandlers = await import(vsc("src/extension/panel-messages-settings.mjs"))

/** 工作区根设置（`workspaceFolders` 是共享 stub 数组——各腿先设后跑）。 */
export const setFolders = (...paths) => {
  vs.workspace.workspaceFolders = paths.map((p) => ({ name: p.split("/").pop(), uri: { fsPath: p } }))
}

/** 假 Memento（workspaceState）：`calls.get` 计数 = 「不读不写」判据面。 */
export const mkMemento = (seed = {}) => {
  const m = new Map(Object.entries(seed))
  return {
    calls: { get: 0, update: 0 },
    get(k) { this.calls.get += 1; return m.get(k) },
    update(k, v) { this.calls.update += 1; m.set(k, v); return Promise.resolve() },
  }
}

/** 宿主面板最小形（`_panel.webview` 收包面 + 假 context）；腿族按需补方法。
 *  `_projectInfo` = `ChatPanel` 同形委托（`pushProject` 消费面——真面板恒有）。 */
export const mkHostPanel = (sink, workspaceState) => ({
  _panel: { webview: { postMessage: (m) => sink.push(m) } },
  _context: { workspaceState, subscriptions: [] },
  _slot: null, _agent: null, _timerWatch: null, _liveLines: null, _distillController: null,
  turnBusy: () => false,
  _projectInfo: () => panelProject.projectInfo(null),
})
