/** digest 两端复验探针 · VSC 侧（只读 · 临时件 · 忽略域）——多轮串行下消化行在场行为实测。
 * 假 DOM bootstrap 沿 `docs/batches/2026-09-29-vsc-carryover-webview.test.mjs` 先例（mini 假 DOM + 全局装载后动态 import webview 链）。
 * 跑法：node .thincoder/tmp/digest-ends-probe.mjs（自仓库根 thincoder/）。 */
const camelOf = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
class FakeText { constructor(value) { this.textContent = String(value) } }
class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase(); this.attrs = {}; this.dataset = {}; this.children = []; this.listeners = []
    this.textContent = ""; this.parent = null; this.open = false; this.isConnected = true
    this.scrollTop = 0; this.scrollHeight = 0; this.clientHeight = 0; this.value = ""; this.selectionStart = 0; this.selectionEnd = 0
    this.style = new Proxy({}, { get: (t, k) => t[k] ?? "", set: (t, k, v) => { t[k] = v; return true } })
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
  setAttribute(k, v) { const s = String(v); this.attrs[k] = s; if (k === "class") this.className = s; else if (k.startsWith("data-")) this.dataset[camelOf(k.slice(5))] = s }
  getAttribute(k) { if (k.startsWith("data-")) { const v = this.dataset[camelOf(k.slice(5))]; if (v !== undefined) return String(v) } return this.attrs[k] ?? null }
  removeAttribute(k) { delete this.attrs[k] }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  removeEventListener() {}
  fire(type, event = {}) { for (const l of this.listeners) if (l.type === type) l.fn({ type, preventDefault() {}, stopPropagation() {}, ...event }) }
  focus() {}
  get parentElement() { return this.parent }
  get parentNode() { return this.parent }
  get content() { return this }
  appendChild(node) { const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node); child.parent = this; this.children.push(child); this.bump(); return child }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  insertBefore(node, anchor) { const at = anchor == null ? -1 : this.children.indexOf(anchor); if (at < 0) this.children.push(node); else this.children.splice(at, 0, node); node.parent = this; this.bump(); return node }
  get childNodes() { return [...this.children] }
  get firstChild() { return this.children[0] ?? null }
  get lastElementChild() { return [...this.children].reverse().find((c) => c instanceof FakeNode) ?? null }
  get firstElementChild() { return this.children.find((c) => c instanceof FakeNode) ?? null }
  replaceChildren(...nodes) { for (const c of this.children) c.parent = null; this.children = []; for (const n of nodes) this.appendChild(n) }
  remove() { if (this.parent) { const at = this.parent.children.indexOf(this); if (at >= 0) this.parent.children.splice(at, 1); this.parent.bump() } }
  prepend(node) { this.children.unshift(node); node.parent = this; this.bump() }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matches(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (matches(n, sel)) out.push(n) }); return out }
  closest(sel) { for (let n = this; n != null; n = n.parent ?? null) if (n instanceof FakeNode && matches(n, sel)) return n; return null }
  walk(fn) { for (const c of this.children) { if (c instanceof FakeNode) { fn(c); c.walk(fn) } } }
  set innerHTML(v) { this._html = String(v) }
  get innerHTML() { return this._html ?? "" }
  bump() { this.textContent = this.children.map((c) => c.textContent ?? "").join("") }
}
function matches(node, sel) {
  if (sel.startsWith(".")) return node.classList.contains(sel.slice(1))
  if (/^[a-zA-Z][\w-]*$/.test(sel)) return node.tagName === sel.toUpperCase()
  const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(sel)
  if (m === null) return false
  const value = m[1].startsWith("data-") ? node.dataset[camelOf(m[1].slice(5))] : node.attrs[m[1]]
  if (value === undefined) return false
  return m[2] === undefined || String(value) === m[2]
}

globalThis.Node = FakeNode
const byId = new Map()
const elOf = (id) => { if (!byId.has(id)) byId.set(id, new FakeNode("div")); return byId.get(id) }
globalThis.document = {
  getElementById: elOf,
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (v) => new FakeText(v),
  querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, removeEventListener: () => {},
  body: new FakeNode("body"), documentElement: new FakeNode("html"),
}
const msgListeners = []
globalThis.window = {
  addEventListener: (type, fn) => { if (type === "message") msgListeners.push(fn) },
  removeEventListener: () => {},
}
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)
globalThis.cancelAnimationFrame = () => {}
globalThis.acquireVsCodeApi = () => ({ postMessage() {}, getState: () => ({}), setState() {} })
const timers = []
globalThis.setInterval = (fn, ms) => { const h = { fn, ms, cleared: false, unref() { return this } }; timers.push(h); return h }
globalThis.clearInterval = (h) => { if (h) h.cleared = true }

// ─── 装载真实 webview 链 + 直驱 showDigestStatus（三轮串行：两轮终态 + 一轮在跑）───

const { ctx } = await import("../../thincoder-vscode/webview/state.js")
const root = new FakeNode("div")
ctx.messagesEl = root
const { showDigestStatus } = await import("../../thincoder-vscode/webview/chat-status.js")

// 轮 1（n=2，终态 ok）
showDigestStatus({ status: "start", n: 2 })
showDigestStatus({ status: "end", ok: true, ms: 1200 })
// 轮 2（n=1，终态 ok）
showDigestStatus({ status: "start", n: 1 })
showDigestStatus({ status: "end", ok: true, ms: 900 })
// 轮 3（n=3，在跑——未终态）
showDigestStatus({ status: "start", n: 3 })

const labels = root.querySelectorAll(".digest-turn")
const counts = root.querySelectorAll(".digest-status")
console.log("[probe] VSC 多轮串行在场读数 = " + JSON.stringify({
  轮组标签行数: labels.length,
  计数元素数: counts.length,
  计数文本: counts.map((c) => c.textContent),
  轮1标签仍在: labels.length >= 1,
  说明: "start 逐轮 appendChild；end 仅就地更新本轮计数元素——旧轮零摘除（多轮全量在场）",
}))
process.exit(0)
