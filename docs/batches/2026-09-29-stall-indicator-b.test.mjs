/**
 * 2026-09-29-stall-indicator-b.test.mjs — 批内件（名随批次档 · 住批次目录 ∕ 本刻暂存 `.thincoder/tmp/`（终位由父侧
 * copy 至 `docs/batches/`）· 不入仓套件 · 随批留存归档）。
 *
 * 覆盖 = B 舱（VSC 六档 + 桌面五档）机检判据（批档 §2.4 AC-4 侧）：常量 = 10000（两端两处）· 首显值 = 10s ·
 * 负向锁（VSC 零注入 ∕ 逐字节等价；桌面段零节点）· 拍 = 1s；重置点（VSC 八键 ∕ 桌面七通道单点）· 起算锚 ·
 * 终态消失 = 行为面。语义单源 = `docs/cli/design/TUI.md` §7.7；实现面 = `docs/vsc/design/WEBVIEW.md` §4.7 /
 * `docs/desktop/design/UI.md` §1「本批注（停滞轻显形 · 2026-09-29）」。
 *
 * 跑法（从仓库根 `thincoder/`）：`node --test .thincoder/tmp/2026-09-29-stall-indicator-b.test.mjs`
 * （两层深 ⇒ 相对 import 与终位一致，两处可跑）。VSC 面 harness = mini 假 DOM（沿
 * `2026-09-28-desktop-subblock-follow.test.mjs` 先例）；桌面面 = 平 node 直测（`quietSegment` / `reduce` / `createHeartbeat`）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const src = (rel) => readFileSync(`${ROOT}${rel}`, "utf8")

// ─── mini 假 DOM（VSC webview 装载面 —— 沿 subblock-follow 先例 + 按需补丁）────────────────

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
globalThis.document = {
  getElementById: (id) => { if (!byId.has(id)) byId.set(id, new FakeNode("div")); return byId.get(id) },
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (v) => new FakeText(v),
  querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, removeEventListener: () => {},
  body: new FakeNode("body"), documentElement: new FakeNode("html"),
}
const msgListeners = []
globalThis.window = { addEventListener: (type, fn) => { if (type === "message") msgListeners.push(fn) }, removeEventListener: () => {} }
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)
globalThis.cancelAnimationFrame = () => {}
globalThis.acquireVsCodeApi = () => ({ postMessage() {}, getState: () => ({}), setState() {} })
// 假钟（模块级 `setInterval` 装载面 —— 沿 `b4w1-vsc-heartbeat.mjs` 先例；防真实拍挂住测试进程）
const timers = []
globalThis.setInterval = (fn, ms) => { const h = { fn, ms, cleared: false, unref() { return this } }; timers.push(h); return h }
globalThis.clearInterval = (h) => { if (h) h.cleared = true }

// ─── 取件（VSC webview 链在我上全局后装载）─────────────────────────────────────

const { S } = await import("../../thincoder-vscode/webview/state.js")
const { setStrings } = await import("../../thincoder-vscode/webview/i18n.js")
const { renderStatusBar } = await import("../../thincoder-vscode/webview/status-bar.js")
const { composerHooks } = await import("../../thincoder-vscode/webview/input.js")
const { initMessageLoop } = await import("../../thincoder-vscode/webview/chat-messages.js")
const { initDict } = await import("../../thincoder-desktop/renderer/i18n.mjs")
const { quietSegment } = await import("../../thincoder-desktop/renderer/views/statusline-segments.mjs")
const { STATUS_SEGMENTS, statusModel, statusTree } = await import("../../thincoder-desktop/renderer/views/statusline.mjs")
const { reduce } = await import("../../thincoder-desktop/renderer/events.mjs")
const { initialState } = await import("../../thincoder-desktop/renderer/store.mjs")
const heartbeat = await import("../../thincoder-desktop/renderer/heartbeat.mjs")

// 词面注入（核字典键 `status.quiet` 现值 = 设计档单源值 —— 核字典本体 = A 舱落地物，本件不代落）
const EN_QUIET = { "status.quiet": "Quiet ${s}s", "status.elapsedSeconds": "${seconds}s" }
const ZH_QUIET = { "status.quiet": "已静默 ${s}s", "status.elapsedSeconds": "${seconds}s" }
setStrings(EN_QUIET)
initDict({ locale: "en", host: EN_QUIET })

// ─── 桌面 · quietSegment（平 node 直测）──────────────────────────────────────

const NOW = 1_800_000_000_000

test("B1 桌面 quietSegment：首显 = 10s（阈值边界 10000ms 恰在场）· 跳秒 = floor 秒", () => {
  assert.deepEqual(quietSegment(["running"], { k: NOW - 10000 }, "k", NOW), { code: "quiet", parts: [{ text: "Quiet 10s" }] })
  assert.equal(quietSegment(["running"], { k: NOW - 9999 }, "k", NOW), null, "未至阈值 ⇒ 零节点")
  assert.equal(quietSegment(["running"], { k: NOW - 10999 }, "k", NOW).parts[0].text, "Quiet 10s", "floor（10999ms ⇒ 10s）")
  assert.equal(quietSegment(["running"], { k: NOW - 12000 }, "k", NOW).parts[0].text, "Quiet 12s")
  assert.equal(quietSegment(["running"], { k: NOW - 59999 }, "k", NOW).parts[0].text, "Quiet 59s")
})

test("B2 桌面 quietSegment：负向锁（非 running ∕ 切片缺 ∕ 非数 ∕ 非载体 ⇒ 零节点）· 零警示色", () => {
  assert.equal(quietSegment([], { k: NOW - 60000 }, "k", NOW), null)
  assert.equal(quietSegment(["done"], { k: NOW - 60000 }, "k", NOW), null)
  assert.equal(quietSegment(["approval"], { k: NOW - 60000 }, "k", NOW), null)
  assert.equal(quietSegment(["running"], {}, "k", NOW), null, "切片缺键")
  assert.equal(quietSegment(["running"], { k: "x" }, "k", NOW), null, "非数")
  assert.equal(quietSegment(["running"], null, "k", NOW), null, "非载体")
  assert.equal(quietSegment(["running"], { k: NOW - 60000 }, "k", NOW).warn, undefined, "纯读数零警示色（D-7）")
})

test("B3 桌面 quietSegment：两语词面（zh = 已静默 ${s}s）", () => {
  initDict({ locale: "zh", host: ZH_QUIET })
  assert.equal(quietSegment(["running"], { k: NOW - 10000 }, "k", NOW).parts[0].text, "已静默 10s")
  initDict({ locale: "en", host: EN_QUIET })
})

test("B4 桌面承载段：17 段闭集 · quiet 序 = elapsed 之后（16 ⇒ 17 随动）", () => {
  assert.equal(STATUS_SEGMENTS.length, 17)
  assert.equal(new Set(STATUS_SEGMENTS).size, 17, "零重码")
  assert.equal(STATUS_SEGMENTS.indexOf("quiet"), STATUS_SEGMENTS.indexOf("elapsed") + 1)
})

const findSeg = (node, code) => {
  if (node?.props?.["data-seg"] === code) return node
  for (const child of node?.children ?? []) { const hit = findSeg(child, code); if (hit !== null) return hit }
  return null
}

test("B5 桌面 statusModel ∕ statusTree：running ∧ 静默 ≥ 10s ⇒ 段在场（elapsed 紧邻之后）；否 ⇒ 零节点", () => {
  const base = { activeSession: "1", badges: { 1: ["running"] }, turnStarts: { 1: NOW - 26000 }, lastOutputAt: { 1: NOW - 12000 }, now: NOW }
  const model = statusModel(base)
  const codes = model.segments.map((s) => s.code)
  assert.deepEqual(codes.slice(codes.indexOf("elapsed"), codes.indexOf("elapsed") + 2), ["elapsed", "quiet"])
  assert.equal(model.segments.find((s) => s.code === "elapsed").parts[0].text, "26s")
  assert.equal(model.segments.find((s) => s.code === "quiet").parts[0].text, "Quiet 12s")
  assert.ok(findSeg(statusTree(model), "quiet")?.props["data-seg"] === "quiet", "树节点 data-seg=quiet")
  // 负向锁：不足阈值 ∕ 非 running ∕ 切片缺 ⇒ 段零节点（树面零节点）
  for (const bad of [{ ...base, lastOutputAt: { 1: NOW - 9999 } }, { ...base, badges: { 1: ["done"] } }, { ...base, lastOutputAt: {} }]) {
    const m = statusModel(bad)
    assert.equal(m.segments.find((s) => s.code === "quiet"), undefined)
    assert.equal(findSeg(statusTree(m), "quiet"), null)
  }
  // 首显 = 10s（恰阈值）
  const first = statusModel({ ...base, lastOutputAt: { 1: NOW - 10000 } })
  assert.equal(first.segments.find((s) => s.code === "quiet").parts[0].text, "Quiet 10s")
})

// ─── 桌面 · reduce（重置单点 ∕ 起算锚 ∕ 复位）────────────────────────────────

test("B6 桌面 reduce：7 可见输出通道 ⇒ lastOutputAt[键] = now（重置单点）", () => {
  for (const channel of ["ev:token", "ev:reasoning", "ev:subchunk", "ev:tool-call", "ev:tool-output", "ev:tool-result", "ev:subagent"]) {
    const r = reduce(initialState(), { channel, key: "1" }, NOW)
    assert.equal(r.lastOutputAt?.["1"], NOW, channel)
  }
})

test("B7 桌面 reduce：非输出通道 ⇒ 零写（fail-closed——含 ev:error ∕ 内联形 ev:activity）", () => {
  for (const ev of [
    { channel: "ev:usage", key: "1" }, { channel: "ev:task", key: "1" }, { channel: "ev:question", key: "1" },
    { channel: "ev:error", key: "1" }, { channel: "ev:activity", key: "1" },
    { channel: "ev:activity", key: "1", fields: [] }, { channel: "ev:approval", key: "1" },
  ]) {
    const r = reduce(initialState(), ev, NOW)
    assert.equal(r.lastOutputAt, undefined, ev.channel + ("fields" in ev ? "(inline)" : ""))
  }
})

test("B8 桌面 reduce：回合起刻 = 初始锚（turn 首帧置 lastOutputAt ∕ turnStarts 邻位同置；后续费帧 ∕ 重置点随动）", () => {
  const r1 = reduce(initialState(), { channel: "ev:activity", event: "turn", n: 1, max: 5, key: "1" }, NOW)
  assert.equal(r1.lastOutputAt["1"], NOW)
  assert.equal(r1.turnStarts["1"], NOW, "邻位同置")
  const r2 = reduce(r1, { channel: "ev:activity", event: "turn", n: 2, max: 5, key: "1" }, NOW + 3000)
  assert.equal(r2.lastOutputAt["1"], NOW, "已 running 的后续 turn 帧不动锚（初始锚 = 回合首帧）")
  const r3 = reduce(r2, { channel: "ev:token", key: "1", text: "hi" }, NOW + 5000)
  assert.equal(r3.lastOutputAt["1"], NOW + 5000, "可见输出命中 ⇒ 锚随动")
  const r4 = reduce(r3, { channel: "ev:activity", event: "done", key: "1" }, NOW + 8000)
  assert.equal(r4.lastOutputAt["1"], NOW + 5000, "回合尾不动时间戳（显示门 = 位标离 running）")
  assert.ok(!(r4.tabBadges["1"] ?? []).includes("running"), "终态位标 ⇒ 段零节点（显示条件落）")
})

test("B9 桌面 heartbeat：拍值 1s（2s ⇒ 1s 收正——跳秒载体）", () => {
  assert.equal(heartbeat.HEARTBEAT_MS, 1000)
  let ticked = 0, seen = null
  const beat = heartbeat.createHeartbeat({
    tick: () => { ticked += 1 },
    timers: { setInterval: (fn, ms) => { seen = { fn, ms }; return 7 }, clearInterval: () => { seen = null } },
  })
  assert.equal(seen.ms, 1000, "周期 = HEARTBEAT_MS（单源）")
  seen.fn()
  assert.equal(ticked, 1)
  beat.stop()
})

// ─── VSC · renderStatusBar（mini 假 DOM 行为面）──────────────────────────────

const statusLine = byId.get("status-line") ?? new FakeNode("div")
if (!byId.has("status-line")) byId.set("status-line", statusLine)

test("B10 VSC renderStatusBar：在飞 ∧ 静默 ≥ 10s ⇒ 段在场（首显 = 10s）；跳秒 = floor", () => {
  const now = Date.now()
  S._lastUsage = null
  S._turnState = "running"
  S._turnStart = now - 26000
  S._lastOutputAt = now - 10000
  renderStatusBar()
  assert.match(statusLine.innerHTML, /Quiet 10s/)
  assert.match(statusLine.innerHTML, /26s/, "耗时段仍在（静默 ≠ 耗时替代）")
  S._lastOutputAt = now - 12500
  renderStatusBar()
  assert.match(statusLine.innerHTML, /Quiet 12s/)
  S._lastOutputAt = now - 20500
  renderStatusBar()
  assert.match(statusLine.innerHTML, /Quiet 20s/)
})

test("B11 VSC 负向锁：未至阈值 ∕ 非在飞 ⇒ 零注入（锚缺 vs 未至阈值 = 逐字节等价）", () => {
  const now = Date.now()
  S._turnState = "running"
  S._turnStart = now - 26000
  S._lastOutputAt = now - 5000
  renderStatusBar()
  assert.ok(!statusLine.innerHTML.includes("Quiet"), "未至阈值 ⇒ 零注入")
  S._turnState = "susp"
  S._lastOutputAt = now - 60000
  renderStatusBar()
  assert.ok(!statusLine.innerHTML.includes("Quiet"), "非在飞（susp）⇒ 零注入")
  S._turnState = "idle"
  renderStatusBar()
  assert.ok(!statusLine.innerHTML.includes("Quiet"), "终态 ⇒ 零注入")
  // 逐字节等价：`_lastOutputAt` 有值但未至阈值 vs 无锚（两态皆零注入 ⇒ 渲染串逐字节同）
  S._turnState = "running"
  S._turnStart = null
  S._lastOutputAt = now - 5000
  renderStatusBar()
  const below = statusLine.innerHTML
  S._lastOutputAt = null
  renderStatusBar()
  assert.equal(statusLine.innerHTML, below, "负向面逐字节等价")
})

test("B12 VSC 词面：zh 值 = 已静默 ${s}s（核字典键经投影面出词）", () => {
  const now = Date.now()
  setStrings(ZH_QUIET)
  S._turnState = "running"
  S._turnStart = now - 26000
  S._lastOutputAt = now - 10000
  renderStatusBar()
  assert.match(statusLine.innerHTML, /已静默 10s/)
  setStrings(EN_QUIET)
})

// ─── VSC · 分发器行为（重置八键 ∕ 起算锚 ∕ 终态清）────────────────────────────

initMessageLoop(new Proxy({}, { get: () => () => {} }))
const fire = (m) => { for (const fn of msgListeners) fn({ data: m }) }

test("B13 VSC 分发器：八键命中 ⇒ _lastOutputAt 置现刻（三类并集）", () => {
  assert.equal(msgListeners.length, 1, "消息循环注册在盘")
  const cases = [
    { type: "token", text: "a" }, { type: "reasoning", text: "b" }, { type: "toolCall", name: "read", args: "{}", id: "t1" },
    { type: "toolResult", name: "read", id: "t1", text: "ok" }, { type: "toolOutput", id: "t1", text: "chunk" },
    { type: "subagent", status: "started", key: "sub:x#1" }, { type: "subagentApproval", key: "sub:x#1", tool: null },
    { type: "toolPanel", name: "sub:x#1", text: "c" },
  ]
  for (const m of cases) {
    S._lastOutputAt = null
    const t0 = Date.now()
    fire(m)
    assert.ok(typeof S._lastOutputAt === "number" && S._lastOutputAt >= t0, m.type + " 重置")
  }
})

test("B14 VSC 分发器：非输出消息 ⇒ 零写；toolPanel 非 sub: 前缀 ⇒ 零写", () => {
  S._lastOutputAt = null
  fire({ type: "turnFrame", turn: 1, maxTurns: 5 })
  fire({ type: "usage", usage: {}, ctxPct: 1 })
  fire({ type: "toolPanel", name: "other#1", text: "x" })
  assert.equal(S._lastOutputAt, null, "非可见输出面零写")
})

test("B15 VSC 起算锚 ∕ 终态清：onTurnStart 置锚（= _turnStart）；complete ∕ aborted ⇒ 清点", () => {
  composerHooks.onTurnStart()
  assert.equal(S._lastOutputAt, S._turnStart, "回合起刻 = 初始锚（邻位同置）")
  assert.equal(typeof S._lastOutputAt, "number")
  fire({ type: "token", text: "x" })
  assert.ok(S._lastOutputAt !== null)
  fire({ type: "complete" })
  assert.equal(S._lastOutputAt, null, "终态（complete）⇒ 清点")
  fire({ type: "token", text: "x" })
  fire({ type: "aborted" })
  assert.equal(S._lastOutputAt, null, "终态（aborted）⇒ 清点")
})

// ─── 源面锁（不可直跑面 = 结构机检）────────────────────────────────────────

test("B16 VSC 源面锁：常量 10000 ∕ 起算 ∕ 重置 ∕ 终态四档在盘", () => {
  const bar = src("thincoder-vscode/webview/status-bar.js")
  assert.match(bar, /const QUIET_MS = 10000\b/)
  assert.match(bar, /S\._turnState === "running"/)
  assert.match(bar, /S\._lastOutputAt \?\? S\._turnStart/)
  assert.match(bar, /t\("status\.quiet", \{ s: Math\.floor\(quietMs \/ 1000\) \}\)/)
  assert.match(src("thincoder-vscode/webview/state.js"), /_lastOutputAt: null/)
  assert.match(src("thincoder-vscode/webview/input.js"), /S\._lastOutputAt = S\._turnStart/)
  assert.match(src("thincoder-vscode/webview/streaming.js"), /S\._lastOutputAt = null/)
  const cm = src("thincoder-vscode/webview/chat-messages.js")
  assert.equal((cm.match(/markOutput\(\)/g) ?? []).length, 8, "重置点恰 8 处（三类八键）")
  const parts = cm.split(/\n      case /)
  for (const label of ["token", "reasoning", "toolCall", "toolResult", "toolOutput", "subagent", "subagentApproval", "toolPanel"]) {
    const part = parts.find((p) => p.startsWith(`"${label}":`))
    assert.ok(part?.includes("markOutput("), `case ${label} 重置点在位`)
  }
})

test("B17 VSC 拍面锁：_panelTimer = 1s（恒定启 + running 门只作用状态行重挂）", () => {
  const pan = src("thincoder-vscode/webview/panels.js")
  assert.match(pan, /const _panelTimer = setInterval\(\(\) => \{\n  refreshLiveHeaders\(\)\n  if \(S\._turnState === "running"\) renderStatusBar\(\)\n\}, 1000\)/)
  assert.ok(!/renderStatusBar\(\)\n\}, 2000\)/.test(pan), "2s 拍零残留")
})

test("B17b VSC _panelTimer 行为：无子代理块的在飞回合照有帧（评审 #1 载体假设实证）", () => {
  const oneSecond = timers.filter((h) => h.ms === 1000)
  assert.equal(oneSecond.length, 1, "webview 链 1s 拍恰一处（防静默换绑——将来新增 1s 定时器即红）")
  const handle = oneSecond[0]
  const now = Date.now()
  S._subBlocks = new Map() // 无 live 块
  S._lastUsage = null
  S._turnState = "running"
  S._turnStart = now - 31000
  S._lastOutputAt = now - 30000
  statusLine.innerHTML = ""
  handle.fn()
  assert.match(statusLine.innerHTML, /Quiet 30s/, "拍体在无子代理块时仍重挂状态行（跳秒帧源）")
  S._turnState = "idle"
  statusLine.innerHTML = "sentinel"
  handle.fn()
  assert.equal(statusLine.innerHTML, "sentinel", "非在飞 ⇒ 零重绘（门只作用状态行重挂）")
})

test("B18 桌面源面锁：QUIET_MS = 10000 ∕ HEARTBEAT_MS = 1000 ∕ 17 段 ∕ 拍注随动", () => {
  assert.match(src("thincoder-desktop/renderer/views/statusline-segments.mjs"), /const QUIET_MS = 10000\b/)
  assert.match(src("thincoder-desktop/renderer/heartbeat.mjs"), /export const HEARTBEAT_MS = 1000\b/)
  assert.ok(!/HEARTBEAT_MS = 2000/.test(src("thincoder-desktop/renderer/heartbeat.mjs")), "2s 常量零残留")
  const app = src("thincoder-desktop/renderer/app.mjs")
  assert.ok(!app.includes("2s 拍"), "app.mjs 拍注随动（零 `2s 拍` 残留）")
  assert.ok(
    src("thincoder-desktop/renderer/views/statusline.mjs").includes(`"attention", ...BANNER_CODES, "state", "tool", "elapsed", "quiet",`),
    "STATUS_SEGMENTS 序：quiet = elapsed 之后（源面锁）")
})

test("B19 两端常量同值：VSC QUIET_MS == 桌面 QUIET_MS == 10000（三端同口径 B 舱两处）", () => {
  const vsc = /const QUIET_MS = (\d+)/.exec(src("thincoder-vscode/webview/status-bar.js"))?.[1]
  const desk = /const QUIET_MS = (\d+)/.exec(src("thincoder-desktop/renderer/views/statusline-segments.mjs"))?.[1]
  assert.equal(vsc, "10000")
  assert.equal(desk, "10000")
  assert.equal(vsc, desk)
})
