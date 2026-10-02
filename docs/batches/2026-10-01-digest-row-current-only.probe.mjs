/** 2026-10-01-digest-row-current-only.probe.mjs —— 消化行只留当轮收正批（台账 #754）**两端臂探针**（实施轮）。
 * ⚠ 口径翻档（2026-10-01 · 台账 #768 消化行自然形收正批）：① ∥ ①b ∥ ①d ∥ ③ 四臂断言按**自然形**重写
 * （行/元素出即留 ∥ 终态 = 追加终态元素 ∥ 复列 = 全量完整轮）；①c ∥ ② ∥ ②b 保持——自此 = 现行口径两端复验面。
 * ① VSC 假 DOM 臂（行/元素出即留 ∥ 终态追加 ∥ 复列 = 全量 ∥ 边界取面 = 计数元素）；
 * ② VSC host 臂（`suspensionSession` 装配面：起跑点逐条补发 `done` ∥ reclaim 兜底幂等）；
 * ③ CLI 重建臂（`historyToLines` 记录分支：复列 = 全量完整轮）。
 * 说明：设计点名的批内件 `docs/batches/2026-10-01-digest-ends-probe.mjs`（#754 设计轮收位 ∥ 探针只读档）
 * 受**跨批写闸**保护（本舱绑定 = `2026-10-01-digest-row-current-only.md`，只可写同干名伴生件）⇒ 扩腿落位
 * = 本档（同干名）；`ends-probe` 原件保持只读（其跑读沿旧口径——本档为现行口径复验面）。
 * 假 DOM bootstrap 沿 `docs/batches/2026-09-29-vsc-carryover-webview.test.mjs` 先例。
 * 跑法：node docs/batches/2026-10-01-digest-row-current-only.probe.mjs（自仓库根 thincoder/）。 */
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
  get nextSibling() {
    if (this.parent == null) return null
    const at = this.parent.children.indexOf(this)
    return at < 0 ? null : this.parent.children[at + 1] ?? null
  }
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

// ─── ① VSC 假 DOM 臂：三轮串行 ⇒ 行/元素出即留（零退场）∥ 边界取面 = 计数元素 ───

const { ctx, S } = await import("../../thincoder-vscode/webview/state.js")
const root = new FakeNode("div")
ctx.messagesEl = root
const { showDigestStatus } = await import("../../thincoder-vscode/webview/chat-status.js")

// 轮 1（n=2，终态 ok）
showDigestStatus({ status: "start", n: 2 })
const labelRound1 = root.querySelectorAll(".digest-turn")[0]
showDigestStatus({ status: "end", ok: true, ms: 1200 })
const boundaryRound1 = S._digestBoundary
// 轮 2（n=1，终态 ok）
showDigestStatus({ status: "start", n: 1 })
showDigestStatus({ status: "end", ok: true, ms: 900 })
// 轮 3（n=3，在跑——未终态）
showDigestStatus({ status: "start", n: 3 })

const labels = root.querySelectorAll(".digest-turn")
const statusEls = root.querySelectorAll(".digest-status")
const countEls = statusEls.filter((n) => !n.classList.contains("digest-done") && !n.classList.contains("digest-failed"))
const termEls = statusEls.filter((n) => n.classList.contains("digest-done") || n.classList.contains("digest-failed"))
console.log("[probe] VSC 多轮串行在场读数 = " + JSON.stringify({
  轮组标签行数: labels.length,
  计数元素数: countEls.length,
  终态元素数: termEls.length,
  计数文本键面: countEls.map((c) => c.textContent),
  终态文本键面: termEls.map((c) => c.textContent),
  轮1标签在场: root.querySelectorAll(".digest-turn").includes(labelRound1) === true,
  轮1计数元素在场: statusEls.includes(boundaryRound1) === true,
  全轮累积: labels.length === 3 && countEls.length === 3 && termEls.length === 2,
  说明: "行/元素出即留（零退场）；终态 = 追加终态元素——原计数元素恒起跑文（词面 = 键面 —— 探针未装 i18n 字典）",
}))

// ①b 起跑族谱：cap 出即留（下轮起跑零退场——前族仍在）
showDigestStatus({ status: "start", n: 0, tier: "ask", from: "a", msg: "b" })
showDigestStatus({ status: "cap", mode: "stop", turns: 2 })
const countOf = (scope) => scope.querySelectorAll(".digest-status").filter((n) => !n.classList.contains("digest-done") && !n.classList.contains("digest-failed"))
const afterCap = { 标签行: root.querySelectorAll(".digest-turn").length, 计数元素: countOf(root).length, cap行: root.querySelectorAll(".digest-cap").length }
showDigestStatus({ status: "start", n: 2 })
console.log("[probe] VSC 起跑族谱读数 = " + JSON.stringify({
  cap在场读: afterCap,
  起跑换代后: { 标签行: root.querySelectorAll(".digest-turn").length, 计数元素: countOf(root).length, cap行: root.querySelectorAll(".digest-cap").length },
  说明: "cap 出即留 —— 新轮起跑零退场（前族仍在；自然形）",
}))

// ①c 边界取面（本批随正）：n > 0 轮 ⇒ 边界 = 计数元素；n = 0 轮 ⇒ 边界 = 标签元素
const boundaryWithCount = S._digestBoundary
showDigestStatus({ status: "start", n: 0, tier: "ask", from: "x", msg: "y" })
const boundaryNoCount = S._digestBoundary
console.log("[probe] VSC 边界取面读数 = " + JSON.stringify({
  有计数轮边界是计数元素: boundaryWithCount?.className === "digest-status",
  无计数轮边界是标签元素: boundaryNoCount?.className === "digest-turn",
  两边界元素互异: boundaryWithCount !== boundaryNoCount,
}))

// ①d 重建复列（§5.7 重放径 = 逐记录同调 showDigestStatus）：三条记录重放 ⇒ 全量完整轮
const rebuildRoot = new FakeNode("div")
ctx.messagesEl = rebuildRoot
showDigestStatus({ status: "start", n: 2 })
showDigestStatus({ status: "end", ok: true, ms: 1200 })
showDigestStatus({ status: "start", n: 1 })
showDigestStatus({ status: "end", ok: true, ms: 900 })
showDigestStatus({ status: "start", n: 3 })
const rbStatus = rebuildRoot.querySelectorAll(".digest-status")
const rbCounts = rbStatus.filter((n) => !n.classList.contains("digest-done") && !n.classList.contains("digest-failed"))
const rbTerms = rbStatus.filter((n) => n.classList.contains("digest-done") || n.classList.contains("digest-failed"))
console.log("[probe] VSC 重建复列读数 = " + JSON.stringify({
  重建后标签行数: rebuildRoot.querySelectorAll(".digest-turn").length,
  重建后计数元素数: rbCounts.length,
  重建后终态元素数: rbTerms.length,
  末轮计数文: rbCounts.at(-1)?.textContent ?? null,
  说明: "重放逐轮 ⇒ 全量完整轮（零退场——与桌面「复列全量完整轮」同判）",
}))
ctx.messagesEl = root

// ─── ② VSC host 臂：起跑点逐条补发 `done`（主面）∥ reclaim 兜底幂等 ───

const { suspensionSession } = await import("../../thincoder-vscode/src/extension/suspension.mjs")
const posts = []
const panel = {
  _panel: { webview: { postMessage: (m) => posts.push(m) } },
  _publishTurnState: () => {},
  _refreshStatus: () => {},
  _turnControllers: [],
  _agent: { config: {}, cwd: "/p" },
  _saveLines: () => {},
}
const history = {
  _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _consultSessions: new Map(),
  _pendingAsyncResults: [{ role: "subagent", id: 7 }, { role: "consult", id: 9 }],
  _suspended: false,
}
let turnRuns = 0
const entry = {
  turnSlot: {}, distillSlot: {},
  lines: { history, fullHistory: [] },
  runTurn: () => { turnRuns += 1; history._pendingAsyncResults.splice(0) }, // run 首行注入器消费全部
  timer: () => ({ unref() {} }),
  clear: () => {},
}
await suspensionSession(panel, entry)
const digestFrames = posts.filter((m) => m.type === "digest")
const doneFrames = posts.filter((m) => m.type === "subagent" && m.status === "done")
const start = digestFrames.find((m) => m.status === "start")
const startAt = posts.indexOf(start)
const firstDoneAt = posts.findIndex((m) => m.type === "subagent" && m.status === "done")
console.log("[probe] VSC host 起跑补发读数 = " + JSON.stringify({
  回合执行次数: turnRuns,
  起跑帧: start ?? null,
  起跑补发在回合执行前: firstDoneAt > -1 && firstDoneAt > startAt,
  补发条数: doneFrames.length,
  补发载荷: doneFrames.map((m) => `${m.role}#${m.id}`),
  consult零补发: doneFrames.every((m) => m.role !== "consult"),
  兜底幂等面_同键两发: doneFrames.filter((m) => m.id === 7).length,
  说明: "起跑窗 = 主面（start 帧后逐条 done）；reclaim = 兜底幂等（消费后再发同形 —— 已归档者 no-op）",
}))

// ─── ②b VSC 归档落位臂（本批 2026-10-01 裁 A：居本族文档序末元素之后——对位桌面 `archiveInsertPointOf`）───

const { applySubagentStatus } = await import("../../thincoder-vscode/webview/activity.js")
const stream = new FakeNode("div")
ctx.messagesEl = stream
ctx.activityEl = new FakeNode("div")
ctx._pinActivity = false
showDigestStatus({ status: "start", n: 2 }) // 起跑：边界 = 计数元素（族末）
const archiveBoundary = S._digestBoundary
for (const id of [7, 8]) {
  applySubagentStatus({ type: "subagent", role: "subagent", id, status: "started" })
  applySubagentStatus({ type: "subagent", role: "subagent", id, status: "settled" }) // 折叠 + awaitingDigest
  applySubagentStatus({ type: "subagent", role: "subagent", id, status: "done" }) // 归档（atBoundary ⇒ 边界面）
}
const orderOf = (node) => {
  const cls = node.className
  if (cls.includes("digest")) return cls.split(" ")[0]
  return `blk:${node.getAttribute("data-subid") ?? "?"}`
}
const seq = stream.children.map(orderOf)
const atOf = (name) => seq.indexOf(name)
console.log("[probe] VSC 归档落位读数 = " + JSON.stringify({
  序列: seq,
  边界元素: archiveBoundary?.className ?? null,
  归档块居族后: atOf("blk:7") > atOf("digest-status") && atOf("blk:8") > atOf("digest-status"),
  到达序: atOf("blk:7") > -1 && atOf("blk:8") === atOf("blk:7") + 1,
  说明: "裁 A：落位 = 本族文档序末元素之后（旧「族首之前」已退场）；多枚到达序 = 逐枚落于前枚之后",
}))
ctx.messagesEl = root

// ─── ③ CLI 重建臂：`historyToLines` 记录分支 = 复列全量完整轮 ───

const { historyToLines } = await import("../../thincoder-cli/src/tui/startup.mjs")
const historyRec = [
  { role: "user", content: "问一" },
  { kind: "digest", status: "start", n: 9, tier: "digest", ts: 1 },
  { kind: "digest", status: "end", ok: true, ms: 8888, ts: 2 },
  { role: "assistant", content: "轮一后" },
  { kind: "digest", status: "start", n: 4, tier: "digest", ts: 3 },
  { kind: "digest", status: "end", ok: true, ms: 1111, ts: 4 },
  { role: "assistant", content: "轮二后" },
]
const rendered = historyToLines(historyRec, 0, historyRec.length)
const flat = rendered.map((l) => l.text).join("\n")
console.log("[probe] CLI 重建复列读数 = " + JSON.stringify({
  渲染行: rendered.map((l) => l.text),
  末轮起跑行在: flat.includes("4"),
  旧轮起跑行在场: flat.includes("9") === true,
  末轮终态行在: flat.includes("1.1"),
  旧轮终态行在场: flat.includes("8.9") === true,
  说明: "记录分支逐轮复列 = 全量完整轮（零截点——旧轮痕行在场）；文案 = lifecycle-records 单一实现（探针未装 locale ⇒ 缺省 en 字面）",
}))
process.exit(0)
