/**
 * 2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs — 批内件（消化行自然形 · 两端跟正批 · 台账 #768）。
 * 判据表 = 批档 `docs/batches/2026-10-01-digest-rows-natural-form-cli-vsc.md` §2.1 / §2.5（含修复轮修订块）。
 * 腿族：
 *   CLI 腿（L1–L6；驱动 = 真 `digestTurn` + 真 `conversation-writer` 写入面——沿 #726 批内件 `turnFixture` 先例）：
 *     L1 行出即留 ∥ L2 终态 = 追加新行（点名腿）∥ L3 零清理负向锁（源面结构 ∥ 多轮串行）∥
 *     L4 复列全量 ∥ L5 记录面负向锁（写点三处 ∥ 记录形零增键）∥ L6 aborted 形；
 *   VSC 腿（V1–V4；假 DOM 直驱真 `showDigestStatus`——沿 #754 探针先例）：
 *     V1 元素出即留 ∥ V2 终态 = 追加终态元素（点名腿）∥ V3 零清理负向锁（痕元素族区段源面 ∥ 假 DOM 移除计数）∥
 *     V4 复列（live 面重放同调——机检腿落建随 #726 VSC 腿：恢复面盘面无实体 = 上抛①）；
 *   合并腿 L7 ∥ V5：`n = 0` 负向锁（两端同判：`end` ⇒ 零新行 ∥ 零新元素——修复轮 §3 轮次 2 发现 ② 补腿）。
 * 文面条款（§5.7 复列句）以交付报告定向 grep 读数核（**不作散文锚断言**——纯行为/结构机检面）。
 * VSC 词键/插值面 = 断言对象（`setStrings` 注入哨兵值——host 注入契约同形；真值单源 = 核字典 ∥ locales/*.json）。
 * 跑法（仓根 `thincoder/`）：
 *   node --test docs/batches/2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs
 * 本件不入仓套件（批内件 · 随批留存）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/context.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

// ─── 假 DOM bootstrap（VSC 腿——沿 #754 探针 `2026-10-01-digest-row-current-only.probe.mjs` 先例；+移除调用计数）──

const camelOf = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
class FakeText { constructor(value) { this.textContent = String(value) } }
class FakeNode {
  static removeCalls = 0 // 假 DOM 移除调用计数（V3 负向锁——多轮后子树零元素移除）
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
  remove() { FakeNode.removeCalls += 1; if (this.parent) { const at = this.parent.children.indexOf(this); if (at >= 0) this.parent.children.splice(at, 1); this.parent.bump() } }
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

// ─── 模块装载 ───

const [i18n, startup, drive, conversation, ansiMod] = await Promise.all([
  mod("thincoder-core/i18n.mjs"), // 痕行文案单源（live ∥ 重建同调断言用）
  mod("thincoder-cli/src/tui/startup.mjs"), // 读面（historyToLines 复列腿）
  mod("thincoder-cli/src/tui/suspension-drive.mjs"), // 写点①（digestTurn——真驱动）
  mod("thincoder-cli/src/tui/conversation-writer.mjs"), // 真写入面（pushLine/pushLabel）
  mod("thincoder-cli/src/tui/ansi.mjs"),
])
const { t } = i18n
const { ansi, C } = ansiMod

const [wstate, wi18n, wchat] = await Promise.all([
  mod("thincoder-vscode/webview/state.js"),
  mod("thincoder-vscode/webview/i18n.js"),
  mod("thincoder-vscode/webview/chat-status.js"), // 真 showDigestStatus
])
const { ctx: wctx, S: wS } = wstate
const { showDigestStatus } = wchat

/** VSC 注入字典（哨兵值——词键 + 插值面 = 断言对象；host 注入契约同形）。 */
const WDICT = {
  "digest.turnLabel": "TL",
  "digest.turnLabelAsk": "TLA:${from}:${msg}",
  "digest.start": "DS:${n}",
  "digest.done": "DD:${n}:${seconds}",
  "digest.aborted": "DA:${seconds}",
  "digest.capStop": "CS:${turns}",
  "digest.capAuto": "CA",
}
wi18n.setStrings(WDICT)

const isTerminalEl = (n) => n.classList.contains("digest-done") || n.classList.contains("digest-failed")
const labelsOf = (root) => root.children.filter((n) => n.classList.contains("digest-turn"))
const countsOf = (root) => root.children.filter((n) => n.classList.contains("digest-status") && !isTerminalEl(n))
const terminalsOf = (root) => root.children.filter(isTerminalEl)
const freshRoot = () => { const r = new FakeNode("div"); wctx.messagesEl = r; wctx._pinBottom = false; return r }

// ─── CLI 夹具（沿 #726 批内件先例）──

/** 伪存储（`_recordStore` 最小形——写缝承载）。 */
function fakeStore(entries = []) {
  const appended = []
  return {
    appended,
    entries,
    append(r) { appended.push(r); return true },
    firstUserMessage: () => null,
    total: () => entries.length,
    *iterate(direction = "newest") {
      for (const m of (direction === "oldest" ? entries : [...entries].reverse())) yield m
    },
    page(start, end, { margin = 1 } = {}) {
      const lo = Math.max(0, start - margin)
      const hi = Math.min(entries.length, end + margin)
      return { messages: entries.slice(lo, hi), base: lo }
    },
  }
}

/** TUI state 最小形（写入 ∥ 恢复面所需字段——真装配面字段子集）。 */
function tuiState() {
  return {
    lines: [], _linesChars: 0, _lineIdCounter: 0, _historyLoaded: 0, _historyTotal: 0, _hasOlder: false, scroll: 0,
    processing: false, status: "Ready", exitArmed: false, streaming: "", reasoning: "",
    _advisorBlocks: [], currentTool: null, processingStarted: 0, lastOutputAt: 0,
    _turnControllers: [], controller: null, interruptPrompt: null, attentionAwaiting: false,
    subTasks: {}, tasks: [], queue: [], pendingInput: [],
    suspended: false, _suspPending: false, _suspAborted: false,
    foldEnabled: true, expandedBlocks: new Set(), _foldScroll: new Map(),
    dims: { get: () => ({ cols: 80, rows: 24 }) },
    _agent: null,
  }
}

/** agent 最小形（写缝载体：`_fullHistory` 人读线 ∥ `_recordStore` 伪存储）。 */
function fakeAgent(over = {}) {
  const store = over._recordStore === undefined ? fakeStore() : over._recordStore
  return {
    cwd: "C:/fake", title: "t", autoApprove: true,
    history: [], _fullHistory: [], _historyWindow: 0,
    _recordStore: store,
    _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map(),
    _pendingDistill: null, _sessionAbort: null, _sessionAbortAll: null,
    ...over,
  }
}

/** 回合 ctx 最小形（`digestTurn` 直驱——真 conversation-writer 写入面）。 */
function turnFixture({ agent = fakeAgent(), state = tuiState(), runAgent = async () => {} } = {}) {
  const render = () => {}
  const writer = conversation.createConversationWriter({ state, render })
  const ctx = {
    agent, state, render, scheduleRender: render,
    pushLine: writer.pushLine, pushLabel: writer.pushLabel, ensureAssistantLabel: writer.ensureAssistantLabel,
    handleSlash: async () => {}, saveSession: () => {}, runAgent, distillFlushTimeoutMs: 1,
    askPermission: null, askBatchPermission: null, askQuestion: null,
  }
  return { ctx, agent, state }
}

const msToSeconds = (ms) => (ms / 1000).toFixed(1)
// 末条收尾记录（多轮夹具取本轮——墙钟 `ms` 逐轮可异，取首条会让后轮期望值错代）
const endRecOf = (agent) => [...agent._recordStore.appended].reverse().find((r) => r.kind === "digest" && r.status === "end")

// ═══ CLI 腿（L1–L6）═══

test("腿 L1·行出即留：两轮串行 digestTurn ⇒ 两轮行全量在场（旧轮行零摘除——行对象引用仍在 state.lines）", async () => {
  const { ctx, agent, state } = turnFixture()
  agent._pendingAsyncResults = [{ role: "explore", id: 1 }] // pend0 = 1
  await drive.digestTurn(ctx, false)
  const round1 = state.lines.slice()
  assert.equal(round1.length, 3, "轮 1 = 标签 + 计数 + 终态")
  assert.deepEqual(round1.map((l) => l.text), [
    t("digest.turnLabel"), t("digest.start", { n: 1 }), t("digest.done", { n: 1, seconds: msToSeconds(endRecOf(agent).ms) }),
  ], "轮 1 三行文案（记录 ms 同值单算式）")
  agent._pendingAsyncResults = [{ role: "eng-coder", id: 2 }, { role: "explore", id: 3 }] // pend0 = 2
  await drive.digestTurn(ctx, false)
  for (const line of round1) {
    assert.ok(state.lines.includes(line), `旧轮行对象仍在（${line.text}）——零摘除`)
    assert.equal(state.lines.indexOf(line), round1.indexOf(line), "旧轮行零搬移（原位）")
  }
  assert.deepEqual(state.lines.slice(0, 3), round1, "轮 1 三行逐对象同引用")
  assert.equal(state.lines.length, 6, "两轮各 3 行全量在场")
  assert.deepEqual(state.lines.slice(3).map((l) => l.text), [
    t("digest.turnLabel"), t("digest.start", { n: 2 }), t("digest.done", { n: 2, seconds: msToSeconds(endRecOf(agent).ms) }),
  ], "轮 2 三行 = 到达序追加")
})

test("腿 L2·终态 = 追加新行（点名腿）：原起跑两行在场且逐字不变 ∥ 终态行 = 新行对象 ∥ 追加位 = 当刻流末", async () => {
  const { ctx, agent, state } = turnFixture()
  agent._pendingAsyncResults = [{ role: "explore", id: 1 }, { role: "eng-coder", id: 2 }] // pend0 = 2
  let duringLines = null
  ctx.runAgent = async () => {
    duringLines = state.lines.slice()
    ctx.pushLine("回合中输出行", C.text) // 消化回合本体的可见输出（模拟）——终态行须落其后
  }
  await drive.digestTurn(ctx, false)
  const [label, count] = duringLines
  assert.equal(label.text, t("digest.turnLabel"), "起跑标签行逐字（digest.turnLabel）")
  assert.equal(count.text, t("digest.start", { n: 2 }), "起跑计数行逐字（digest.start）")
  // 终态后：原起跑两行在场且逐字/逐色不变
  assert.ok(state.lines.includes(label) && state.lines.includes(count), "原起跑两行在场")
  assert.equal(label.text, t("digest.turnLabel"))
  assert.equal(count.text, t("digest.start", { n: 2 }), "原起跑行文本逐字不变（零就地换文）")
  assert.equal(label.color, C.dim)
  assert.equal(count.color, C.dim)
  // 终态行 = 新行对象（非复用）
  const done = state.lines[state.lines.length - 1]
  assert.notEqual(done, count, "终态行非原起跑/计数行对象")
  assert.notEqual(done, label)
  assert.ok(!duringLines.includes(done), "终态行非起跑刻行集成员（出生 = 到达序）")
  assert.equal(done.text, t("digest.done", { n: 2, seconds: msToSeconds(endRecOf(agent).ms) }), "终态行文本（记录 ms 同值单算式）")
  assert.equal(done.color, C.dim)
  // 追加位 = 当刻流末（居回合中输出行之后）
  const midAt = state.lines.findIndex((l) => l.text === "回合中输出行")
  assert.ok(midAt > -1, "回合中输出行在场")
  assert.ok(state.lines.indexOf(done) > midAt, "终态行落于回合中输出之后（到达序——非族尾插点）")
  assert.equal(state.lines.indexOf(done), state.lines.length - 1, "追加位 = 当刻流末")
})

test("腿 L3·零清理负向锁：三档源面零退场机符号 ∥ 多轮串行行集单调增长（零摘除面触发）", async () => {
  const sd = readFileSync(resolve(ROOT, "thincoder-cli/src/tui/suspension-drive.mjs"), "utf8")
  assert.equal(sd.includes("dropLines"), false, "suspension-drive 零 dropLines")
  assert.equal(sd.includes("_digestRows"), false, "suspension-drive 零 _digestRows 写点")
  assert.equal(sd.includes("insertLineAt"), false, "suspension-drive 零 insertLineAt（族尾插点随拆）")
  const cw = readFileSync(resolve(ROOT, "thincoder-cli/src/tui/conversation-writer.mjs"), "utf8")
  assert.equal(cw.includes("dropLines"), false, "conversation-writer 零 dropLines（死亡码拆）")
  assert.equal(cw.includes("insertLineAt"), false, "conversation-writer 零 insertLineAt（死亡码拆）")
  assert.equal(cw.includes("releaseLine"), false, "死 import 清（releaseLine 随拆）")
  const su = readFileSync(resolve(ROOT, "thincoder-cli/src/tui/startup.mjs"), "utf8")
  assert.equal(su.includes("lastDigestRoundStart"), false, "startup 零截点机")
  assert.equal(su.includes("digestCut"), false, "startup 零 digestCut 闸")
  // 运行时：三轮串行 ⇒ 行集单调增长（零摘除面触发）
  const { ctx, agent, state } = turnFixture()
  let prev = 0
  for (let i = 0; i < 3; i++) {
    agent._pendingAsyncResults = [{ role: "explore", id: i + 1 }]
    await drive.digestTurn(ctx, false)
    assert.ok(state.lines.length > prev, `第 ${i + 1} 轮后行集增长（零摘除）`)
    prev = state.lines.length
  }
  assert.equal(state.lines.length, 9, "三轮 × 3 行全量在场（上界 = 累积）")
})

test("腿 L4·复列全量：混序记录（两完整轮 + 一尾残轮）⇒ 逐轮痕行按记录序出（旧轮零截 ∥ 终态行 n 回扫保持）", () => {
  const H = [
    { role: "user", content: "问题一", ts: 1 },
    { kind: "digest", status: "start", n: 2, tier: "digest", ts: 2 },
    { role: "assistant", content: "回答一", ts: 3 },
    { kind: "digest", status: "end", ok: true, ms: 1200, ts: 4 },
    { role: "user", content: "问题二", ts: 5 },
    { kind: "digest", status: "start", n: 1, tier: "digest", ts: 6 },
    { kind: "digest", status: "end", ok: true, ms: 800, ts: 7 },
    { role: "assistant", content: "回答二", ts: 8 },
    { kind: "digest", status: "start", n: 3, tier: "digest", ts: 9 }, // 尾残轮（未结）
  ]
  const texts = startup.historyToLines(H, 0, H.length).map((l) => l.text)
  const r1 = { count: t("digest.start", { n: 2 }), done: t("digest.done", { n: 2, seconds: "1.2" }) }
  const r2 = { count: t("digest.start", { n: 1 }), done: t("digest.done", { n: 1, seconds: "0.8" }) }
  const r3 = t("digest.start", { n: 3 })
  const trace = texts.filter((x) => [r1.count, r1.done, r2.count, r2.done, r3].includes(x))
  assert.deepEqual(trace, [r1.count, r1.done, r2.count, r2.done, r3], "痕行全量且按记录序（旧轮零截 ∥ 零错序）")
  assert.equal(texts.filter((x) => x === t("digest.turnLabel")).length, 3, "三轮起跑标签各一（旧轮零截）")
  const at = (s) => texts.indexOf(s)
  assert.ok(at(r1.count) > at("问题一") && at(r1.count) < at("回答一"), "轮 1 痕行居其记录位次")
  assert.ok(at(r1.done) > at("回答一") && at(r1.done) < at("问题二"), "轮 1 终态行位次（n = 页内回扫——2）")
  assert.ok(at(r2.count) > at("问题二"), "轮 2 起跑行位次")
  assert.ok(at(r2.done) > at(r2.count) && at(r2.done) < at("回答二"), "轮 2 终态行位次（n = 页内回扫——1）")
  assert.ok(at(r3) > at("回答二"), "尾残轮照现（未结——沿现行口径）")
})

test("腿 L5·记录面负向锁：写点三处 ∥ 记录四型形零增键（对照 #726 腿 C1 判据）", async () => {
  // 写点三处（行 ∥ 记录同点双动作——本批零改）
  const writePoints = [
    ["thincoder-cli/src/tui/suspension-drive.mjs", 2],
    ["thincoder-cli/src/tui/agent-turn.mjs", 1],
    ["thincoder-cli/src/tui/subagent-freeze.mjs", 1],
  ]
  for (const [file, n] of writePoints) {
    const src = readFileSync(resolve(ROOT, file), "utf8")
    assert.equal((src.match(/pushRecord\(/g) ?? []).length, n, `${file} pushRecord 调用 ${n} 处（写点不变）`)
    assert.equal(src.includes("clearDigest"), false, `${file} 零 clearDigest（桌面面符号——两端零引入）`)
  }
  const { ctx, agent } = turnFixture()
  agent._pendingAsyncResults = [{ role: "explore", id: 1 }]
  await drive.digestTurn(ctx, false)
  const recs = agent._recordStore.appended
  assert.deepEqual(recs.map((r) => r.status), ["start", "end"], "起跑 ∥ 收尾两级同点追加")
  assert.deepEqual(Object.keys(recs[0]).sort(), ["kind", "n", "status", "tier", "ts"], "start 形零增键")
  assert.deepEqual(Object.keys(recs[1]).sort(), ["kind", "ms", "ok", "status", "ts"], "end 形零增键")
  assert.equal(recs[0].n, 1)
  assert.equal(recs[1].ok, true)
  // cap ∥ subagent 两型（纯构造面——记录形单源 `lifecycle-records.mjs`；#726 C1b 现挂起 ⇒ 不走回合机）
  const lifecycle = await mod("thincoder-cli/src/tui/lifecycle-records.mjs")
  const capRec = lifecycle.digestCapRecord(3)
  assert.deepEqual(Object.keys(capRec).sort(), ["kind", "mode", "status", "turns"], "cap 形零增键")
  assert.deepEqual({ ...capRec, ts: 0 }, { kind: "digest", status: "cap", mode: "stop", turns: 3, ts: 0 }, "cap 形逐字")
  const subRec = lifecycle.subagentRecord({ key: "k#1", role: "r", started: 1, doneAt: 2, blocks: [{ kind: "text", text: "x" }] })
  assert.deepEqual(Object.keys(subRec).sort(), ["kind", "meta", "rows"], "subagent 形零增键")
  assert.deepEqual(Object.keys(subRec.meta).sort(), ["doneAt", "key", "maxTurns", "model", "pool", "role", "startedAt", "status", "turn"], "subagent meta 形零增键")
  assert.equal(subRec.meta.status, "done")
  assert.deepEqual(subRec.rows, [{ kind: "text", text: "x" }], "subagent rows 形")
})

test("腿 L6·aborted 形：outcome ≠ ok ⇒ 终态行 = digest.aborted（追加位 = 当刻流末 ∥ 原起跑行逐字不变）", async () => {
  // 中止径施压（AbortError 无注入消息 ⇒ 判定 "stop"——`outcome = "stopped"` ≠ "ok"）；ContinueError（撞帽）
  // 类身份跨解析路径不稳（实测挂起）——中止 ∥ 撞帽同判 face（本条判据不看因）。
  const { ctx, agent, state } = turnFixture({
    runAgent: async () => { const e = new Error("turn aborted"); e.name = "AbortError"; throw e },
  })
  agent._pendingAsyncResults = [{ role: "explore", id: 1 }]
  await drive.digestTurn(ctx, false)
  const endRec = endRecOf(agent)
  assert.equal(endRec.ok, false, "记录 ok = false（中止/失败同判）")
  const done = state.lines[state.lines.length - 1]
  assert.equal(done.text, t("digest.aborted", { seconds: msToSeconds(endRec.ms) }), "终态行 = digest.aborted 文本")
  assert.equal(done.color, C.dim)
  assert.equal(state.lines.indexOf(done), state.lines.length - 1, "追加位 = 当刻流末")
  assert.equal(state.lines[0].text, t("digest.turnLabel"), "原起跑标签行逐字不变")
  assert.equal(state.lines[1].text, t("digest.start", { n: 1 }), "原起跑计数行逐字不变")
  assert.ok(state.lines.some((l) => l.text === "[stopped]"), "中止痕行在场（runAgentTurn stop 径——行出即留：与痕行族共存）")
})

// ═══ VSC 腿（V1–V4）═══

test("腿 V1·元素出即留：三轮串行（第三轮 = 起跑已投 ∥ end 未投——半轮；三轮均 n > 0）⇒ 标签 ×3 ∥ 计数 ×3 ∥ 终态元素 ×2 全量在场；痕元素族零 remove()", () => {
  const root = freshRoot()
  const removes0 = FakeNode.removeCalls
  showDigestStatus({ status: "start", n: 2 }) // 轮 1（n = 2）
  const label1 = root.children.at(-2) // 起跑两元素 = 标签 + 计数（n > 0）
  showDigestStatus({ status: "end", ok: true, ms: 1200 })
  showDigestStatus({ status: "start", n: 1 }) // 轮 2（n = 1）
  const label2 = root.children.at(-2)
  showDigestStatus({ status: "end", ok: false, ms: 900 })
  showDigestStatus({ status: "start", n: 3 }) // 轮 3（n = 3——起跑已投 ∥ end 未投）
  assert.equal(labelsOf(root).length, 3, "标签 ×3（旧轮零摘除）")
  assert.equal(countsOf(root).length, 3, "计数 ×3（三轮均 n > 0——计数元素规则 `n > 0`）")
  assert.equal(terminalsOf(root).length, 2, "终态元素 ×2（第三轮半轮——end 未投）")
  assert.equal(root.children.length, 8, "8 = 3 + 3 + 2 全量在场（零摘除）")
  assert.ok(root.children.includes(label1) && root.children.includes(label2), "旧轮标签对象仍在子树（原位）")
  assert.equal(root.children.indexOf(label1), 0, "轮 1 标签居首（零搬移）")
  assert.equal(FakeNode.removeCalls - removes0, 0, "痕元素族零 remove() 调用（假 DOM 计数）")
})

test("腿 V2·终态 = 追加终态元素（点名腿）：原计数元素在场且逐字不变 ∥ 终态元素 = 新建 `.digest-status.digest-done` ∕ `.digest-failed` ∥ 追加位 = 当刻流末；ok:false 档同判", () => {
  const root = freshRoot()
  // ok 档
  showDigestStatus({ status: "start", n: 2 })
  const count = root.children.at(-1)
  assert.equal(count.className, "digest-status")
  assert.equal(count.textContent, "DS:2", "计数元素文案 = digest.start（n = dataset.n）")
  assert.equal(count.dataset.n, "2")
  showDigestStatus({ status: "end", ok: true, ms: 1200 })
  const done = root.children.at(-1)
  assert.notEqual(done, count, "终态元素 = 新建元素（非原计数元素复用）")
  assert.equal(count.textContent, "DS:2", "原计数元素文本逐字不变")
  assert.equal(count.className, "digest-status", "原计数元素类恒 digest-status（零就地换文）")
  assert.equal(done.className, "digest-status digest-done", "终态元素类 = .digest-status.digest-done")
  assert.equal(done.textContent, "DD:2:1.2", "终态文本逐字（digest.done——n 自本轮计数元素 ∥ seconds 同算式）")
  assert.equal(root.children.indexOf(done), root.children.length - 1, "追加位 = 当刻流末")
  // ok:false 档同判
  showDigestStatus({ status: "start", n: 1 })
  const count2 = root.children.at(-1)
  showDigestStatus({ status: "end", ok: false, ms: 900 })
  const failed = root.children.at(-1)
  assert.notEqual(failed, count2, "失败档终态元素 = 新建元素")
  assert.equal(count2.textContent, "DS:1", "ok:false 档原计数元素逐字不变")
  assert.equal(count2.className, "digest-status")
  assert.equal(failed.className, "digest-status digest-failed", "终态元素类 = .digest-status.digest-failed")
  assert.equal(failed.textContent, "DA:0.9", "终态文本逐字（digest.aborted）")
  assert.equal(root.children.indexOf(failed), root.children.length - 1, "追加位 = 当刻流末（失败档同判）")
})

test("腿 V3·零清理负向锁：痕元素族区段零 remove() ∥ 零 _digestRoundEls（源面结构）＋ 多轮后假 DOM 移除计数 = 0", () => {
  const src = readFileSync(resolve(ROOT, "thincoder-vscode/webview/chat-status.js"), "utf8")
  const lo = src.indexOf("─── Digest round visibility")
  const hi = src.indexOf("export {", lo)
  assert.ok(lo > -1 && hi > lo, "痕元素族区段可判（Digest round visibility → 导出行）")
  const seg = src.slice(lo, hi)
  assert.equal(seg.includes(".remove("), false, "痕元素族区段零 remove()（退场循环随拆）")
  assert.equal(seg.includes("_digestRoundEls"), false, "族谱账符号随拆——**零 `_digestRoundEls`**")
  // 两名关系（盘上实读钉名——修复轮 §3 轮次 2 发现 ③）：复数 `_digestRoundEls` = 本轮元素族谱账（本批拆除）；
  // 单数 `_digestRoundEl` = 本轮计数元素引用（保留——`end` 取 `dataset.n` 用）。两名非同物。
  assert.equal(seg.includes("_digestRoundEl"), true, "单数 `_digestRoundEl` 保留（`end` 取 dataset.n —— 非族谱账）")
  assert.equal(seg.includes("isConnected"), true, "零计数轮守判保持（el = _digestRoundEl?.isConnected ? … : null）")
  // 假 DOM：多轮串行后子树零元素移除
  const root = freshRoot()
  const removes0 = FakeNode.removeCalls
  for (let i = 0; i < 3; i++) {
    showDigestStatus({ status: "start", n: i + 1 })
    if (i < 2) showDigestStatus({ status: "end", ok: true, ms: 1000 })
  }
  assert.equal(FakeNode.removeCalls - removes0, 0, "`#messages` 子树零元素移除（假 DOM 移除调用计数 = 0）")
  assert.equal(root.children.length, 8, "三轮元素全量在场（零清理）")
})

test("腿 V4·复列（live 面重放同调）：逐记录重放 ⇒ 全量完整轮（记录序 ≡ 恢复序）∥ 机检腿落建随 #726 VSC 腿（上抛①）", () => {
  const root = freshRoot()
  const records = [
    { status: "start", n: 2, tier: "digest" },
    { status: "end", ok: true, ms: 1200 },
    { status: "start", n: 1, tier: "digest" },
    { status: "end", ok: true, ms: 900 },
  ]
  for (const r of records) showDigestStatus(r)
  assert.deepEqual(
    root.children.map((el) => el.className),
    ["digest-turn", "digest-status", "digest-status digest-done", "digest-turn", "digest-status", "digest-status digest-done"],
    "记录序 ≡ 恢复序（逐轮 标签 → 计数 → 终态 追加——零截）",
  )
  assert.equal(labelsOf(root).length, 2, "两完整轮俱在（复列 = 全量完整轮）")
  assert.equal(terminalsOf(root).length, 2, "两轮终态元素俱在")
  assert.equal(root.children[0].textContent, WDICT["digest.turnLabel"], "重放文案同调（single implementation）")
  assert.equal(root.children[3].textContent, WDICT["digest.turnLabel"])
})

// ═══ 合并腿（L7 ∥ V5——`n = 0` 负向锁；修复轮 §3 轮次 2 发现 ②）═══

test("腿 L7 ∥ V5·`n = 0` 负向锁（两端同判）：ask-only 轮 `end` ⇒ 零新行 ∥ 零新元素", async () => {
  // CLI：`pend0 = 0` ⇒ 起跑只标签行；终态行零产（`digestTraceLines` 同门 `pend0 > 0`）
  const { ctx, agent, state } = turnFixture()
  await drive.digestTurn(ctx, false)
  assert.equal(state.lines.length, 1, "CLI：零待消化 ⇒ 只标签行（计数/终态行零产）")
  assert.equal(state.lines[0].text, t("digest.turnLabel"))
  assert.deepEqual(agent._recordStore.appended.map((r) => r.status), ["start", "end"], "CLI：记录照旧两级（记录面零动）")
  assert.equal(agent._recordStore.appended[0].n, 0)
  assert.equal(agent._recordStore.appended[1].ok, true)
  // VSC：`n = 0`（ask-only）⇒ 只标签元素；`end` 零动作
  const root = freshRoot()
  showDigestStatus({ status: "start", n: 0, tier: "ask", from: "eng-designer#8", msg: "请复核" })
  assert.equal(labelsOf(root).length, 1, "VSC：标签元素一")
  assert.equal(countsOf(root).length, 0, "VSC：零计数元素（`n = 0` 规则）")
  assert.equal(root.children[0].textContent, "TLA:eng-designer#8:请复核", "ask 档标签逐字")
  const before = root.children.length
  showDigestStatus({ status: "end", ok: true, ms: 1200 })
  assert.equal(root.children.length, before, "VSC：`end` ⇒ 零新元素（零动作守判）")
  assert.equal(countsOf(root).length, 0, "VSC：零计数元素零补建（禁幻影行）")
  assert.equal(terminalsOf(root).length, 0, "VSC：零终态元素")
})
