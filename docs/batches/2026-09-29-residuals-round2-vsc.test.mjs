/**
 * 2026-09-29-residuals-round2-vsc.test.mjs — 批内件（名随批次档 · 住批次目录；本刻暂存 `.thincoder/tmp/`
 * ——终位由父侧 copy 至 `docs/batches/`）· 不入仓套件 · 随批留存归档。
 *
 * 覆盖 = 波 2（VSC 面）腿 L3（#587 goal 面板默认合 + 🎯 开合 · #586 VSC 码面七处引文改指）：
 *   行为面（mini 假 DOM 直驱 `webview/panels.js` / `webview/status-bar.js`）——默认合 ∕ 两态切换 ∕
 *   重渲保态 ∕ 缺席即隐 ∕ task 支零动；
 *   源面锁——panels.js 显隐判据 ∕ state.js `_goalPanelOpen` 槽 ∕ status-bar.js 翻态写点（恰一处）∕
 *   index.html 首帧默认隐 ∕ 七处引文逐处命中 + VSC 活树旧引零残余。
 * 判据语义 = 本批 §2「#587 · #586」设计行（桌面 #554②对齐——两端可见行为一致五点）。
 * 跑法（从仓库根 `thincoder/`）：`node --test .thincoder/tmp/2026-09-29-residuals-round2-vsc.test.mjs`
 * （两层深 ⇒ 相对 import 与终位一致，两处可跑）。假 DOM harness 沿 `2026-09-29-stall-indicator-b.test.mjs`
 * 先例（按需裁剪 + `<template>.content` 补面）。
 * 注：源面锁（L3-S）为**逐字锁**（有意——防语义漂移换形；他日重排即红属预期，非行为回归）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const src = (rel) => readFileSync(`${ROOT}${rel}`, "utf8")

// ─── mini 假 DOM（VSC webview 装载面——沿 stall-indicator-b 先例，按需裁剪）────────────────────

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
  get content() { return this } // `<template>`.content（`cards/panel.mjs` `fragmentOf` 取件面——假 DOM 自持）
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
globalThis.window = { addEventListener: () => {}, removeEventListener: () => {} }
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)
globalThis.cancelAnimationFrame = () => {}
globalThis.acquireVsCodeApi = () => ({ postMessage() {}, getState: () => ({}), setState() {} })
// 假拍（panels.js 模块级 `setInterval`——防真实定时器挂住测试进程；沿 b 件先例）
const timers = []
globalThis.setInterval = (fn, ms) => { const h = { fn, ms, cleared: false, unref() { return this } }; timers.push(h); return h }
globalThis.clearInterval = (h) => { if (h) h.cleared = true }

// ─── 取件（VSC webview 链在我上全局后装载）───────────────────────────────────────────────────

const { S } = await import("../../thincoder-vscode/webview/state.js")
const { handleGoalMessage, renderGoalPanel, clearPanels } = await import("../../thincoder-vscode/webview/panels.js")
const { renderStatusBar } = await import("../../thincoder-vscode/webview/status-bar.js")

const goalPanel = elOf("goal-panel")
const statusLine = elOf("status-line")
const GOAL = { status: "active", objective: "达成两端一致", criteria: "五点判据" }

const clickGoalBadge = () => {
  assert.ok(statusLine.innerHTML.includes('id="goal-badge"'), "🎯 徽标在渲染面（开合入口在场）")
  const el = byId.get("goal-badge")
  assert.equal(typeof el?.onclick, "function", "翻态出口已接线（status-bar goal 支）")
  el.onclick({ stopPropagation() {} })
}
const seedClosed = () => { S._goalPanelOpen = false; handleGoalMessage(GOAL) } // 前置归位（默认合 + goal 在场）

// ─── L3-A 默认合 ─────────────────────────────────────────────────────────────

test("L3-A 默认合：goal 到达 ⇒ 面板隐（开合态 false）· 徽标在场 · 内容照常预装", () => {
  assert.equal(S._goalPanelOpen, false, "S 槽初始 = false（默认合载体）")
  handleGoalMessage(GOAL)
  assert.equal(S._goalPanelOpen, false, "goal 到达不自动开")
  assert.equal(goalPanel.style.display, "none", "goal active 到达 + 未开合 ⇒ 隐")
  assert.match(statusLine.innerHTML, /id="goal-badge"/, "🎯 徽标在场（开合入口）")
  assert.ok(goalPanel.children.length > 0, "goalPanelVisible 真 ⇒ 照常 replaceChildren（开时内容不陈旧）")
})

// ─── L3-B 两态切换（🎯 翻态出口）───────────────────────────────────────────────

test("L3-B 两态切换：点按 🎯 ⇒ 显（态 true）；再点 ⇒ 隐（态 false）", () => {
  seedClosed()
  assert.equal(S._goalPanelOpen, false, "前置 = 合")
  assert.equal(goalPanel.style.display, "none")
  clickGoalBadge()
  assert.equal(S._goalPanelOpen, true, "翻态 ⇒ true")
  assert.equal(goalPanel.style.display, "block", "点按 ⇒ 显")
  clickGoalBadge()
  assert.equal(S._goalPanelOpen, false, "再点 ⇒ false")
  assert.equal(goalPanel.style.display, "none", "再点 ⇒ 隐")
})

// ─── L3-C 重渲保态 ───────────────────────────────────────────────────────────

test("L3-C 重渲保态：开态下 goal 数据更新 ⇒ 保持开；内容随重渲替换（不陈旧）", () => {
  seedClosed()
  clickGoalBadge()
  assert.equal(goalPanel.style.display, "block", "前置 = 开")
  const before = goalPanel.children[0]
  handleGoalMessage({ ...GOAL, objective: "第二版目标" })
  assert.equal(S._goalPanelOpen, true, "数据更新不动开合态")
  assert.equal(goalPanel.style.display, "block", "开态留存（判据点④）")
  assert.notEqual(goalPanel.children[0], before, "内容随重渲替换（开时内容不陈旧）")
})

// ─── L3-D 缺席即隐（开合态不重置）─────────────────────────────────────────────

test("L3-D 缺席即隐：目标缺席 ∕ clearPanels ⇒ 隐；开合态不重置（构树重挂不丢态）", () => {
  seedClosed()
  assert.equal(S._goalPanelOpen, false, "前置 = 合")
  clickGoalBadge()
  assert.equal(S._goalPanelOpen, true, "前置 = 开")
  S._goalInfo = null
  renderGoalPanel()
  assert.equal(goalPanel.style.display, "none", "目标缺席 ⇒ 隐")
  assert.equal(S._goalPanelOpen, true, "开合态不重置（桌面同语义）")
  handleGoalMessage(GOAL)
  assert.equal(goalPanel.style.display, "block", "开态留存 ⇒ 目标回归照旧开")
  // clearPanels 支 = 开态穿越（判别性锁：态 true 时过清空径 ⇒ 仍 true + 显隐归隐；重置型实现在此必红）
  clearPanels()
  assert.equal(goalPanel.style.display, "none", "clearPanels ⇒ 隐")
  assert.equal(S._goalInfo, null, "清空径清目标")
  assert.equal(S._goalPanelOpen, true, "开态穿越 clearPanels ⇒ 不重置")
  handleGoalMessage(GOAL)
  assert.equal(goalPanel.style.display, "block", "清空后目标回归 ⇒ 照旧按留存开态显示")
  clickGoalBadge() // 归位 = 合（跨用例卫生）
  assert.equal(S._goalPanelOpen, false)
})

// ─── L3-E task 支零动（直翻 display——不经 S）───────────────────────────────────

test("L3-E task 支零动：task-badge 直翻 #task-panel display（与 goal 出口互不影响）", () => {
  S._taskStatus = "✓1/2"
  renderStatusBar()
  assert.ok(statusLine.innerHTML.includes('id="task-badge"'), "task 徽标在场")
  const taskPanel = elOf("task-panel")
  const el = byId.get("task-badge")
  assert.equal(typeof el?.onclick, "function")
  taskPanel.style.display = "none"
  el.onclick({ stopPropagation() {} })
  assert.equal(taskPanel.style.display, "block", "task 支 = 直翻 display（未改）")
  el.onclick({ stopPropagation() {} })
  assert.equal(taskPanel.style.display, "none")
  S._taskStatus = null
  renderStatusBar()
})

// ─── L3-S 源面锁（#587 三档 + 首帧默认隐）──────────────────────────────────────

test("L3-S 源面锁：判据 ∕ S 槽 ∕ 翻态写点（恰一处）∕ task 支照旧 ∕ 首帧 none", () => {
  const pan = src("thincoder-vscode/webview/panels.js")
  assert.match(pan, /if \(!goalPanelVisible\(S\._goalInfo\)\) \{ panel\.style\.display = "none"; return \}/)
  assert.match(pan, /panel\.replaceChildren\(goalPanelFragment\(S\._goalInfo\)\.el\)/, "可见时照常重渲（内容不陈旧）")
  assert.match(pan, /panel\.style\.display = S\._goalPanelOpen \? "block" : "none"/, "显示只随开合态")
  assert.match(src("thincoder-vscode/webview/state.js"), /_goalPanelOpen: false,/, "S 槽落位")
  const bar = src("thincoder-vscode/webview/status-bar.js")
  assert.match(bar, /wire\("task-badge", "task-panel"\)/, "task 支照旧 wire（零动）")
  assert.match(bar, /S\._goalPanelOpen = !S\._goalPanelOpen/, "goal 支翻态写点在场")
  assert.equal((bar.match(/S\._goalPanelOpen = !/g) ?? []).length, 1, "翻态写点恰一处")
  assert.match(src("thincoder-vscode/webview/index.html"), /id="goal-panel"[^>]*style="display:none"/, "首帧默认隐（HTML 初始 none）")
})

// ─── L3-CIT #586：VSC 码面七处引文改指 + VSC 活树旧引零残余 ────────────────────────

test("L3-CIT 引文改指：七处逐处命中新载体 ∕ 旧引（engine-floor-guard）零残余", () => {
  const files = [
    "thincoder-vscode/src/agent/setup-tooltable.mjs",
    "thincoder-vscode/src/embed-config.mjs",
    "thincoder-vscode/src/extension/ledger-surface.mjs",
    "thincoder-vscode/src/extension/panel-chat.mjs",
    "thincoder-vscode/src/extension/panel-turn-loop.mjs",
    "thincoder-vscode/src/extension/panel-turn-stages.mjs",
    "thincoder-vscode/src/extension/session-index-command.mjs",
  ]
  for (const rel of files) {
    const s = src(rel)
    assert.ok(s.includes("docs/batches/2026-09-29-residuals-round2.test.mjs"), `${rel}：新载体命中`)
    assert.ok(s.includes("单测树重建时回迁端侧单测档"), `${rel}：回迁注记在场`)
    assert.ok(!s.includes("engine-floor-guard"), `${rel}：旧引零残余`)
  }
  // VSC 活树全扫（*.mjs ∕ *.js ∕ *.cjs；排 node_modules ∕ .thincoder ∕ docs）——旧引零残余
  const SKIP = new Set(["node_modules", ".thincoder", "docs", "dist", ".git"])
  const hits = []
  const walk = (abs, rel) => {
    for (const n of readdirSync(abs)) {
      if (SKIP.has(n)) continue
      const p = `${abs}/${n}`
      if (statSync(p).isDirectory()) { walk(p, `${rel}/${n}`); continue }
      if (!/\.(?:mjs|js|cjs)$/.test(n)) continue
      if (readFileSync(p, "utf8").includes("engine-floor-guard")) hits.push(`${rel}/${n}`)
    }
  }
  walk(`${ROOT}thincoder-vscode`, "thincoder-vscode")
  assert.deepEqual(hits, [], "VSC 活树旧引零残余")
})
