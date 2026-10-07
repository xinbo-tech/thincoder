/**
 * 2026-10-07-provider-config-parity-vsc-harness.mjs — 批内件测试台（mini 假 DOM + 装缝 + 真词面装载；
 * 供 `2026-10-07-provider-config-parity-vsc.test.mjs` 腿族共用）。
 *
 * 设计面（逐条判据）= `docs/vsc/design/SETTINGS.md` §2.16；假 DOM harness 沿
 * `docs/batches/2026-09-29-vsc-carryover-settings.test.mjs` 先例（按需增强：后代 ∕ 逗号选择器、
 * `#id` 匹配、`select.options` 维护、`innerHTML` 子集解析、计时器桩 + 焦点序记录）。
 * 拆档由来 = 共享件破 500 硬限 ⇒ 按舱拆档；VSC 档腿 + 本台合计仍越限 ⇒ 测试台抽公档
 * （沿 `2026-10-07-browser-input.harness.mjs` 先例——「测试台抽公档（第三档，报备）」）。
 * 正文 = 原共享件逐字节搬移（仅加 `export`——腿族 import 面；`readFileSync` 随迁自持）。
 */
export const { readdirSync, readFileSync } = await import("node:fs")
export const VSC = new URL("../../thincoder-vscode/", import.meta.url).href
export const vscSrc = (rel) => readFileSync(new URL(rel, VSC), "utf8")

// ─── mini 假 DOM（装载面；`registerHooks` 零用——webview 链不 import vscode）─────────
const camelId = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
const _attached = new Map() // 挂树节点（真 DOM `getElementById` 语义面）
const _stubs = new Map()    // 静态件替身（index.html 件 ∥ innerHTML 未解析面）
// 动态件：不在树 ⇒ null（真 DOM 语义——弹窗开 ∥ 关建清；否则单例判据会被幻影桩假绿）
const DYNAMIC_IDS = new Set([
  "prov-add-dialog", "pa-type", "pa-preset-info", "pa-custom-fields", "pa-name", "pa-url", "pa-format",
  "pa-key", "pa-proxy", "pa-custom-tail", "pa-fetch-btn", "pa-conn-status", "pa-model",
  "pa-model-candidates", "pa-save-btn", "pa-cancel-btn",
])
export const _focused = [] // focus() 序（V9 同拍序末位焦点）

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
  get firstChild() { return this.children[0] ?? null }
  get firstElementChild() { return this.children.find((c) => c instanceof FNode) ?? null }
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
  insertBefore(node, anchor) { const at = anchor == null ? -1 : this.children.indexOf(anchor); if (at < 0) return this.appendChild(node); node.parent = this; this.children.splice(at, 0, node); regTree(node); return node }
  replaceChildren(...nodes) { for (const c of [...this.children]) unregTree(c); this.children = []; this.options = []; for (const n of nodes) this.appendChild(n) }
  remove() {
    if (this.parent) {
      const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1)
      const oi = this.parent.options.indexOf(this); if (oi >= 0) this.parent.options.splice(oi, 1)
      this.parent = null
    }
    unregTree(this)
  }
  replaceWith(node) { const p = this.parent; if (!p) return; const i = p.children.indexOf(this); if (i >= 0) p.children[i] = node; node.parent = p; regTree(node); unregTree(this) }
  walk(fn) { for (const c of this.children) if (c instanceof FNode) { fn(c); c.walk(fn) } }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matchSelector(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (matchSelector(n, sel)) out.push(n) }); return out }
  closest() { return null }
  contains(n) { for (let c = n; c; c = c.parent ?? null) if (c === this) return true; return false }
  set innerHTML(v) { for (const c of [...this.children]) unregTree(c); this.children = []; this.options = []; this._html = String(v); for (const n of parseHtml(this._html)) this.appendChild(n) }
  get innerHTML() { return this._html ?? "" }
  set outerHTML(v) { this._html = String(v); for (const c of [...this.children]) unregTree(c); this.children = [] }
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
/** `innerHTML` 子集解析（确认件驱动面：文本 div + 两 button 平铺）——深嵌套同 tag 退化为文本，绝不抛。 */
function parseHtml(html) {
  const out = []
  const re = /<(\w+)((?:\s[^>]*)?)>([\s\S]*?)<\/\1>/g
  let last = 0; let m
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) { const t = html.slice(last, m.index); if (t.trim()) out.push(new FText(t)) }
    const el = new FNode(m[1])
    for (const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) el.setAttribute(a[1], a[2] ?? "")
    for (const c of parseHtml(m[3])) el.appendChild(c)
    out.push(el)
    last = re.lastIndex
  }
  if (last < html.length) { const t = html.slice(last); if (t.trim()) out.push(new FText(t)) }
  return out
}

// 计时器桩（推进 = 手动 `drainTimers`——V9 同拍序 ∥ 开框焦点腿用）
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
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
  cancelAnimationFrame: () => {},
  addEventListener() {},
  removeEventListener() {},
}
globalThis.acquireVsCodeApi = () => ({ postMessage: (m) => postSink.push(m), getState: () => ({}), setState() {} })
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)

export const byId = (id) => document.getElementById(id)
export const bodyFind = (cls) => bodyEl.children.find((c) => c instanceof FNode && c.classList.contains(cls)) ?? null
export const surface = () => ({ backdrop: bodyFind("settings-dialog-backdrop"), card: byId("prov-add-dialog") })
/** 用例级清洗（各腿自守）：框族 ∥ 确认族件清、计时器排空、双簿清零。 */
export const clearAll = () => {
  document.querySelectorAll(".settings-dialog-backdrop, .settings-dialog").forEach((el) => el.remove())
  document.querySelectorAll(".auto-confirm, .auto-backdrop").forEach((el) => el.remove())
  drainTimers()
  postSink.length = 0
  _focused.length = 0
}

// ─── 装载 VSC webview 链 + 真词面 ───────────────────────────────────────────────────
const { setStrings } = await import(new URL("webview/i18n.js", VSC).href)
export const EN = JSON.parse(vscSrc("locales/en.json"))
export const ZH = JSON.parse(vscSrc("locales/zh.json"))
setStrings(EN)
const { initSettings } = await import(new URL("webview/settings.js", VSC).href)
export const { SS } = await import(new URL("webview/settings-state.js", VSC).href)
export const api = initSettings({ onClose: () => {}, getModels: () => [] })
export const openDialog = () => window._openAddProviderDialog()
const PRESETS = [
  { name: "deepseek", desc: "DeepSeek", model: "deepseek-chat", baseURL: "https://api.deepseek.com/v1" },
  { name: "glm", desc: "GLM (Zhipu)", model: "glm-4", baseURL: "https://open.bigmodel.cn/api/paas/v4" },
]
export const setPresets = () => { SS.providerStatus = { providers: {}, labels: {}, presets: PRESETS } }
export const setType = (v) => { byId("pa-type").value = v; byId("pa-type").fire("change") }
