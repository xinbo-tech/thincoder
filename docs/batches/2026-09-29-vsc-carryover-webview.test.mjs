/**
 * 2026-09-29-vsc-carryover-webview.test.mjs — 批内件（名随批次档 · 本刻暂存 `.thincoder/tmp/`——
 * 终位由父侧 copy 至 `docs/batches/2026-09-29-vsc-carryover-webview.test.mjs`；不入仓套件 · 随批留存归档）。
 * 注：直写 `docs/batches/` 终位被写入闸拒（跨批批档保护——子代理仅可写自身绑定批档）；
 * 暂存形 = 本仓批件先例（#545 立即形；两处相对 import 同深 ⇒ 两处可跑）。
 *
 * 覆盖 = V2 舱（#642 ∥ #643 · webview 面）机检判据（批档 §2「#642」∕「#643」节）——五腿：
 *   #642（goal 面板回合存续——重置点归位：回合起点 → 会话边界）三腿：
 *     ① 源锁（判别性）：`input.js` 零 `clearPanels` 引用（import + 回合起点调用全清——旧 = 有 ⇒ 旧红新绿）；
 *        `chat-messages.js` `clearMessages` 支含 `clearPanels()`（旧 = 无 ⇒ 旧红新绿）。
 *     ② 回合起点存续腿（fake DOM · 直驱 `composerHooks.onTurnStart`）：goal ∕ task 面板态存续（🎯 ∕ task
 *        徽标在场、面板内容未失、可开合——旧 = 回合起点清 ⇒ 旧红）。
 *     ③ 会话边界清腿（fake DOM · 直驱 `clearMessages` 消息）：双清 + 双隐 + 开合态不重置（体零动）；`clearPanels` 直驱同判。
 *   #643（死计数清）两腿：
 *     ④ 源锁：`_llmCalls` 在 `thincoder-vscode/{webview,src,test}/**` 零命中（旧 = 3 命中 ⇒ 旧红新绿；
 *        render-core 三处注释 = 域外面，不入扫描域）。
 *     ⑤ 行为腿：`handleUsageMessage` 直驱 ⇒ `!("_llmCalls" in S)`（读数照常落槽——零误伤）。
 * 跑法（从仓库根 `thincoder/`）：`node --test .thincoder/tmp/2026-09-29-vsc-carryover-webview.test.mjs`
 * （两层深 ⇒ 相对 import 与终位一致，两处可跑）。
 * 假 DOM harness 沿 `2026-09-29-residuals-round2-vsc.test.mjs` ∕ `2026-09-29-stall-indicator-b.test.mjs` 先例
 * （mini 假 DOM + `<template>.content` 补面 + 消息循环捕获；按需裁剪）。
 * 注：源锁为**判别性直锁**（旧实现必红——非「同形复述」）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const src = (rel) => readFileSync(`${ROOT}${rel}`, "utf8")

// ─── mini 假 DOM（VSC webview 装载面——沿 residuals-round2-vsc ∕ stall-indicator-b 先例）──────────

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
  get content() { return this } // `<template>`.content（核 `cards/panel.mjs` `fragmentOf` 取件面——假 DOM 自持）
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
// 假拍（panels.js 模块级 `setInterval`——防真实定时器挂住测试进程；沿先例）
const timers = []
globalThis.setInterval = (fn, ms) => { const h = { fn, ms, cleared: false, unref() { return this } }; timers.push(h); return h }
globalThis.clearInterval = (h) => { if (h) h.cleared = true }

// ─── 取件（VSC webview 链在我上全局后装载）───────────────────────────────────────────────────

const { S } = await import("../../thincoder-vscode/webview/state.js")
const { handleGoalMessage, handleTaskProgress, renderGoalPanel, clearPanels } = await import("../../thincoder-vscode/webview/panels.js")
const { renderStatusBar, handleUsageMessage } = await import("../../thincoder-vscode/webview/status-bar.js")
const { composerHooks } = await import("../../thincoder-vscode/webview/input.js")
const { initMessageLoop } = await import("../../thincoder-vscode/webview/chat-messages.js")

initMessageLoop(new Proxy({}, { get: () => () => {} }))
const fire = (m) => { for (const fn of msgListeners) fn({ data: m }) }

const goalPanel = elOf("goal-panel")
const taskPanel = elOf("task-panel")
const statusLine = elOf("status-line")
const GOAL = { status: "active", objective: "达成两端一致", criteria: "五点判据" }

const seedGoal = () => { S._goalPanelOpen = false; handleGoalMessage(GOAL) } // 前置归位（默认合 + goal 在场）
const seedTask = () => handleTaskProgress({ total: 2, done: 1, pending: 0, inProgress: 0 })

// ─── ① #642 源锁（判别性）────────────────────────────────────────────────────

test("C1 #642 源锁：input.js 零 clearPanels 引用 ∕ chat-messages.js clearMessages 支含 clearPanels()", () => {
  const inp = src("thincoder-vscode/webview/input.js")
  assert.ok(!inp.includes("clearPanels"), "input.js 零 clearPanels 残留（import 行 + 回合起点调用全清——旧 = 有 ⇒ 旧红新绿）")
  assert.ok(inp.includes("S._turnStart = Date.now()"), "钩体簿记留位（_turnStart）")
  assert.ok(inp.includes("ctx.hadToolResult = false"), "钩体工具结果位留位（hadToolResult）")
  const cm = src("thincoder-vscode/webview/chat-messages.js")
  assert.match(cm, /import \{[^}]*\bclearPanels\b[^}]*\} from "\.\/panels\.js"/, "import 面含 clearPanels")
  const seg = cm.slice(cm.indexOf('case "clearMessages":'), cm.indexOf('case "historyPage":'))
  assert.ok(seg.includes("clearPanels()"), "clearMessages 支含 clearPanels()（旧 = 无 ⇒ 旧红新绿）")
})

// ─── ② #642 回合起点存续腿（回合后 🎯 ∕ task 存续）──────────────────────────────

test("C2 #642 回合起点存续：onTurnStart 直驱 ⇒ goal ∕ task 存续（🎯 ∕ task 徽标在场、内容未失、可开合）", () => {
  seedGoal(); seedTask()
  assert.equal(S._goalInfo?.status, "active", "前置：goal active 在盘")
  composerHooks.onTurnStart() // 回合起点（旧 = 内含 clearPanels ⇒ 旧红）
  assert.equal(S._goalInfo?.status, "active", "回合起点不再清 goal——存续")
  assert.equal(S._taskStatus, "✓1/2", "task 徽标文本存续（同判随动——KD-VC-5）")
  assert.notEqual(S._taskProgress, null, "task 面板态存续")
  assert.equal(S._lastOutputAt, S._turnStart, "簿记照常（_lastOutputAt 置锚——零误伤）")
  renderStatusBar()
  assert.match(statusLine.innerHTML, /id="goal-badge"/, "回合后 🎯 在场（存续面）")
  assert.match(statusLine.innerHTML, /id="task-badge"/, "task 徽标同判在场")
  S._goalPanelOpen = true; renderGoalPanel()
  assert.equal(goalPanel.style.display, "block", "回合后可开合（开合态存续）")
  assert.ok(goalPanel.children.length > 0, "面板内容未失（构树重挂不丢态）")
  S._goalPanelOpen = false; renderGoalPanel() // 归位（跨用例卫生）
})

// ─── ③ #642 会话边界清腿（切换即清 + 体零动）────────────────────────────────────

test("C3 #642 会话边界清：clearMessages 直驱 ⇒ 双清 + 双隐 + 开合态不重置；clearPanels 直驱同判", () => {
  seedGoal(); seedTask()
  S._goalPanelOpen = true; renderGoalPanel()
  assert.equal(goalPanel.style.display, "block", "前置：goal 面板开")
  fire({ type: "clearMessages" }) // 会话切换 ∕ 载入（宿主发射点单源）
  assert.equal(S._goalInfo, null, "会话切换清 goal（跨会话零残留）")
  assert.equal(S._taskProgress, null, "清 task 进度")
  assert.equal(S._taskStatus, null, "清 task 徽标源")
  assert.equal(goalPanel.style.display, "none", "双面板隐——goal")
  assert.equal(taskPanel.style.display, "none", "双面板隐——task")
  assert.equal(S._goalPanelOpen, true, "开合态不重置（体零动——构树重挂不丢态）")
  renderStatusBar()
  assert.ok(!statusLine.innerHTML.includes('id="goal-badge"'), "清后 🎯 零节点（新会话无目标）")
  assert.ok(!statusLine.innerHTML.includes('id="task-badge"'), "清后 task 徽标零节点")
  // clearPanels 直驱（同一函数——读侧同判）+ 体零动源锁（函数体内零开合态重置写）
  seedGoal(); seedTask()
  S._goalPanelOpen = true
  clearPanels()
  assert.equal(S._goalInfo, null, "clearPanels 直驱清 goal")
  assert.equal(S._taskProgress, null, "clearPanels 直驱清 task 进度")
  assert.equal(S._taskStatus, null, "clearPanels 直驱清 task 徽标源")
  assert.equal(S._goalPanelOpen, true, "开合态穿越 clearPanels ⇒ 不重置")
  const pan = src("thincoder-vscode/webview/panels.js")
  const at = pan.indexOf("export function clearPanels()")
  const fn = pan.slice(at, pan.indexOf("\n}", at))
  assert.ok(!fn.includes("_goalPanelOpen"), "体零动：函数体内零开合态写（源锁）")
  S._goalPanelOpen = false // 归位（跨用例卫生）
})

// ─── ④ #643 源锁（grep 零命中）────────────────────────────────────────────────

test("D1 #643 源锁：_llmCalls 在 thincoder-vscode/{webview,src,test}/** 零命中", () => {
  const hits = []
  const walk = (abs, rel) => {
    for (const n of readdirSync(abs)) {
      if (n === "node_modules" || n === "dist" || n === ".thincoder") continue
      const p = `${abs}/${n}`
      if (statSync(p).isDirectory()) { walk(p, `${rel}/${n}`); continue }
      if (!/\.(?:mjs|js|cjs)$/.test(n)) continue
      if (readFileSync(p, "utf8").includes("_llmCalls")) hits.push(`${rel}/${n}`)
    }
  }
  for (const sub of ["webview", "src", "test"]) walk(`${ROOT}thincoder-vscode/${sub}`, `thincoder-vscode/${sub}`)
  assert.deepEqual(hits, [], "旧 = 3 命中（state.js ∕ input.js ∕ status-bar.js）⇒ 旧红新绿；render-core 三注释 = 域外")
})

// ─── ⑤ #643 行为腿（usage 到达不再建槽）────────────────────────────────────────

test("D2 #643 行为腿：handleUsageMessage 直驱 ⇒ (!(\"_llmCalls\" in S))；读数照常落槽", () => {
  assert.ok(!("_llmCalls" in S), "槽已不在 S 定义面（旧 = state.js 定义 ⇒ 旧红）")
  handleUsageMessage({ usage: { prompt_tokens: 10, completion_tokens: 2 }, ctxPct: 12 })
  assert.ok(!("_llmCalls" in S), "usage 到达不再建槽 ∕ 计数（旧 = 自增建槽 ⇒ 旧红）")
  assert.equal(S._lastCtxPct, 12, "usage 读数照常落槽（零误伤）")
  assert.ok(statusLine.innerHTML.length > 0, "状态行照常重绘")
})
