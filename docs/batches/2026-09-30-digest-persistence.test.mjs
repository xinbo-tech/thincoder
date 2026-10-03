/**
 * 2026-09-30-digest-persistence.test.mjs — 批内件（消化面留档批 · 台账 #719 · **实施轮 B（读侧 · 渲染面）**）。
 * ⚠ 断代（2026-10-01 · 台账 #765 拆批；**2026-10-04 复验读数刷新——台账 #824**）：旧形态断言红（实测 = 3/9——腿 2 ∥ 3 ∥ 4 ∥ 5b ∥ 6 ∥ 7 红——位次 ∥ 终态轮 ∥ 键面面随后续批演进；import 未断）；留档对照 · 勿复跑。
 * 判据表 = 批档 `docs/batches/2026-09-30-digest-persistence.md` §五（腿 1–5）+ §2 ②/③/④ + §四 行 7–13 ∥ 16。
 * 腿族（腿 1 ∥ 腿 5 = 跨舱轴 —— A 舱写侧已落，本件全链跑；腿 6 = 复盘入件 · 腿 7 = 修复轮 3 补臂）：
 *   腿 1 记录写入：digest 三型 ⇒ 人读线逐条落录（形 ∥ 序 ∥ `ts`）· 机器线零新增（`contextHistory` 条目零增）
 *        ∥ `subagent` 快照 ⇒ `record:append` 出站（含非活动键 · `rows` 保尾上界 + 省略明示）；
 *   腿 2 直通 ∥ 折叠：伪槽档（记录 ∩ 消息混序）⇒ 页读回执记录在场；桌面折叠 ⇒ 终态轮集（携位次）∥
 *        痕元素位次正确（含「末轮无 `end` 不产」防双份例）；
 *   腿 3 块重建：`subagent` 记录 ⇒ 留档块（计 `data-blocks` ∥ 计 `data-hidden`）；退窗 ⇒ 折摘要块；回填 ⇒ 重现；
 *   腿 4 痕随窗：痕记录位次越出已渲染块区 ⇒ 不在场；回填 ⇒ 按位次重建（块挂载后落位 —— seatDigestRounds ④′ 步）；
 *   腿 5 非破坏 / 负控：`historyWindow` 不带 `opts` ⇒ 输出与改前逐字等价（git HEAD 抽取基线）；CLI ∥ VSC 读面零改（源面零触断言）。
 *   腿 6 尾径块身份面（复盘入件 —— 拆分重写实参面回归锁）：键 = 位序（hidden + index）∥ 标签 = 回合首 ∥ 重试钮随 `canRetry`；
 *   腿 7 写点前移（**修复轮 3** —— 批档 §2 裁定 (a)）：边界轮（`autoTurn ∧ ¬timerTurn`）`end` 记录 ∥ 发帧同点
 *        双动作、**先于 `settleTurn` 槽落盘**（结算落盘面读回即见 —— 消「收束后即时重载末轮痕缺」）；
 *        非边界 ∥ timer 轮零 `end`；失败径同出（`ok:false`）。
 * 红 ∕ 绿规程：修前（记录不通 ∕ 无折叠 ∥ 无位次面）⇒ 本件红（import 面先红 + 断言行）；落修 ⇒ 全绿。
 * 本件不入仓套件（批内件 · 随批留存）；跑法（仓根 `thincoder/`）：
 *   node --test docs/batches/2026-09-30-digest-persistence.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/session-slots.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

const [
  chat, chatStream, chatScroll, model, pageRead, store, i18n, i18nCore,
  slots, coreSlots, sessionIo, subagentReduce, historyWindow, turnFace,
] = await Promise.all([
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 挂载 ∥ 帧尾（settleFrame 真路）
  mod("thincoder-desktop/renderer/views/chat-stream.mjs"), // 对齐步（alignPlan —— 帧输入同源）
  mod("thincoder-desktop/renderer/views/chat-scroll.mjs"), // 窗限（nextWindow —— 限增宽窗）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型（chatModel）
  mod("thincoder-desktop/renderer/page-read.mjs"), // 页读径（applyPage ∥ blockOfMessage ∥ 记录折叠）
  mod("thincoder-desktop/renderer/store.mjs"), // 单状态树（initialState ∥ visibleWindow）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-desktop/src/main/session-slots.mjs"), // 端壳页读面（pageHistory —— 记录直通）
  mod("thincoder-core/session-slots.mjs"), // 核（沙箱缝 ∥ slotPath）
  mod("thincoder-desktop/src/main/session-io.mjs"), // 记录追加薄壳（appendRecord —— A 舱件）
  mod("thincoder-desktop/renderer/subagent-reduce.mjs"), // 子 agent 归约径（归档派生 ∥ record:append 出站）
  mod("thincoder-core/history-window.mjs"), // 核窗口（记录直通 opt-in）
  mod("thincoder-desktop/src/main/turn-face.mjs"), // 单回合执行面（腿 7：边界轮 `end` 写点前移 —— 先于结算落盘）
])

const KEY = "1"
const zh = () => i18n.initDict({ locale: "zh", dict: i18nCore.projectDictionary("zh") })
const tick = () => new Promise((r) => setImmediate(r))

// ─── 假 DOM（属性 ∕ 选择器（含逗号组）∕ 结构 ∕ 滚动读数面 —— 沿 digest-instream 批内件先例收窄）──

class FakeText {
  constructor(value) {
    this.textContent = String(value)
    this.parentNode = null
  }
  get nodeType() { return 3 }
  get nextSibling() {
    if (this.parentNode === null) return null
    const at = this.parentNode.childNodes.indexOf(this)
    return at < 0 ? null : this.parentNode.childNodes[at + 1] ?? null
  }
  remove() { if (this.parentNode !== null) this.parentNode.removeChild(this) }
}

class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.attrs = {}
    this.childNodes = []
    this.parentNode = null
    this.listeners = []
    this._scrollTop = 0
    this._height = 200
    this._scrollHeight = 1000
  }
  get nodeType() { return 1 }
  get children() { return this.childNodes.filter((node) => node instanceof FakeNode) }
  get firstChild() { return this.childNodes[0] ?? null }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] ?? null }
  get lastElementChild() { const list = this.children; return list[list.length - 1] ?? null }
  get nextSibling() {
    if (this.parentNode === null) return null
    const at = this.parentNode.childNodes.indexOf(this)
    return at < 0 ? null : this.parentNode.childNodes[at + 1] ?? null
  }
  get previousElementSibling() {
    if (this.parentNode === null) return null
    const list = this.parentNode.children
    const at = list.indexOf(this)
    return at <= 0 ? null : list[at - 1]
  }
  get isConnected() {
    for (let node = this; node !== null; node = node.parentNode) if (node.__connected === true) return true
    return false
  }
  get textContent() { return this.childNodes.map((child) => child.textContent).join("") }
  set textContent(value) {
    this.replaceChildren()
    if (String(value ?? "") !== "") this.append(new FakeText(value))
  }
  get innerHTML() { return this.textContent }
  set innerHTML(value) { this.replaceChildren(new FakeText(value)) }
  get className() { return this.attrs.class ?? "" }
  set className(value) { this.attrs.class = String(value) }
  get classList() {
    const read = () => (this.attrs.class ?? "").split(/\s+/).filter(Boolean)
    const self = this
    return {
      add: (...cs) => { self.attrs.class = [...new Set([...read(), ...cs])].join(" ") },
      remove: (...cs) => { self.attrs.class = read().filter((c) => !cs.includes(c)).join(" ") },
      contains: (c) => read().includes(c),
      toggle: (c, force) => {
        const want = force === undefined ? !read().includes(c) : force === true
        if (want) self.classList.add(c)
        else self.classList.remove(c)
      },
    }
  }
  /** `dataset`（真 DOM 语义探针 —— 核件 `refreshBlock` / `paintLabel` 读面所需）。 */
  get dataset() {
    const self = this
    const nameOf = (key) => `data-${String(key).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
    return new Proxy({}, {
      get: (_target, key) => (typeof key === "string" ? self.getAttribute(nameOf(key)) : undefined),
      set: (_target, key, value) => { self.setAttribute(nameOf(key), String(value)); return true },
    })
  }
  get scrollTop() { return this._scrollTop }
  set scrollTop(value) { this._scrollTop = Math.max(0, Math.min(Number(value) || 0, Math.max(0, this.scrollHeight - this._height))) }
  get scrollHeight() { return this._scrollHeight }
  set scrollHeight(value) { this._scrollHeight = Number(value) || 0 }
  get clientHeight() { return this._height }
  set clientHeight(value) { this._height = Number(value) || 0 }
  getAttribute(name) { return Object.hasOwn(this.attrs, name) ? this.attrs[name] : null }
  getAttributeNames() { return Object.keys(this.attrs) }
  setAttribute(name, value) { this.attrs[name] = String(value) }
  removeAttribute(name) { delete this.attrs[name] }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  removeEventListener(type, fn) { this.listeners = this.listeners.filter((l) => !(l.type === type && l.fn === fn)) }
  append(...nodes) {
    for (const node of nodes) {
      const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
      child.parentNode = this
      this.childNodes.push(child)
    }
  }
  appendChild(node) { this.append(node); return node }
  prepend(...nodes) {
    for (const node of [...nodes].reverse()) this.insertBefore(node, this.childNodes[0] ?? null)
  }
  insertBefore(node, ref) {
    const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
    if (child.parentNode !== null) {
      const at = child.parentNode.childNodes.indexOf(child)
      if (at >= 0) child.parentNode.childNodes.splice(at, 1)
    }
    child.parentNode = this
    const index = ref === null || ref === undefined ? -1 : this.childNodes.indexOf(ref)
    if (index < 0) this.childNodes.push(child)
    else this.childNodes.splice(index, 0, child)
    return child
  }
  removeChild(node) {
    const at = this.childNodes.indexOf(node)
    if (at >= 0) this.childNodes.splice(at, 1)
    node.parentNode = null
    return node
  }
  replaceWith(next) {
    if (this.parentNode === null) return
    this.parentNode.insertBefore(next, this)
    this.remove()
  }
  remove() {
    if (this.parentNode === null) return
    this.parentNode.removeChild(this)
  }
  replaceChildren(...nodes) {
    for (const child of this.childNodes) child.parentNode = null
    this.childNodes = []
    this.append(...nodes)
  }
  walk(fn) { for (const child of this.children) { fn(child); child.walk(fn) } }
  querySelector(sel) { let hit = null; this.walk((node) => { if (hit === null && select(node, sel)) hit = node }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((node) => { if (select(node, sel)) out.push(node) }); return out }
  closest(sel) { for (let node = this; node !== null; node = node.parentNode) if (node instanceof FakeNode && select(node, sel)) return node; return null }
  matches(sel) { return select(this, sel) }
}

/** 单段选择器（类 ∕ 标签 ∕ `[attr]` ∕ `[attr="v"]`）。 */
function matchesSegment(node, sel) {
  if (sel.startsWith(".")) return String(node.getAttribute("class") ?? "").split(/\s+/).includes(sel.slice(1))
  if (/^[a-zA-Z][\w-]*$/.test(sel)) return node.tagName === sel.toUpperCase()
  const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(sel)
  if (m === null) return false
  const value = node.getAttribute(m[1])
  if (value === null) return false
  return m[2] === undefined || value === m[2]
}

/** 选择器（逗号组 `a, b` ∨ 后代组合 `a b` —— 逐段 `matchesSegment`）。 */
function select(node, sel) {
  return String(sel).split(",").some((part) => selectOne(node, part.trim()))
}
function selectOne(node, sel) {
  const parts = String(sel).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return false
  if (!matchesSegment(node, parts[parts.length - 1])) return false
  let at = parts.length - 2
  for (let p = node.parentNode; p !== null && at >= 0; p = p.parentNode) {
    if (p instanceof FakeNode && matchesSegment(p, parts[at])) at -= 1
  }
  return at < 0
}

let prevDoc = null
let prevNode = null
let prevWindow = null

function installFakeDom() {
  prevDoc = globalThis.document
  prevNode = globalThis.Node
  prevWindow = globalThis.window
  globalThis.document = {
    activeElement: null,
    createElement: (tag) => new FakeNode(tag),
    createTextNode: (value) => new FakeText(value),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
  }
  globalThis.Node = FakeNode
  globalThis.window = {}
}
function restoreFakeDom() {
  globalThis.document = prevDoc
  globalThis.Node = prevNode
  globalThis.window = prevWindow
}
async function withFakeDom(fn) {
  installFakeDom()
  try { return await fn() } finally { restoreFakeDom() }
}

// ─── 场景脚手架（真路：pageHistory ⇒ applyPage ⇒ mountChat ∥ settleFrame）─────────────

const SCROLL = { readMetrics: () => ({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }) }
const SUB_META = { key: "sub:explore#1", label: "sub:explore#1", role: "explore", id: 1, pool: true, status: "done", frozen: true, startedAt: 0, doneAt: 1500 }

/** 沙箱槽档（伪槽：记录 ∩ 消息混序 —— 形 = 人读线条目）。 */
function sandbox(t) {
  const root = mkdtempSync(join(tmpdir(), "digest-persist-"))
  const cwd = join(root, "proj")
  mkdirSync(cwd, { recursive: true })
  mkdirSync(join(root, "sessions"), { recursive: true })
  coreSlots._setSessionsDirForTest(join(root, "sessions"))
  t.after(() => { coreSlots._resetSessionsDirForTest() })
  return { cwd, root }
}

/** 写槽档（version 2 + cwd 匹配 —— `loadSlotFile` 读面要求）。 */
function writeSlot(cwd, history) {
  writeFileSync(coreSlots.slotPath(cwd, 1), JSON.stringify({ version: 2, cwd, title: "", activeProvider: "", history }), "utf8")
}

/** 页读回执（首屏 ∕ 回填两径同源 —— 端壳真路）。 */
const pageOf = (cwd, before) => slots.pageHistory(cwd, { key: KEY, before })

/** 基础态（applyPage 输入 —— store 初态 + 活动会话 + 项目根）。 */
const baseState = (cwd, over = {}) => ({ ...store.initialState(), activeSession: KEY, project: { cwd, recent: [] }, digest: {}, following: true, ...over })

/** 树直取（根**直接子**层 —— 块 ∥ 轮元素；避免子件内部同类锚干扰文档序断言）。 */
const directBlocks = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-block-kind") !== null)
const directRounds = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-digest") !== null)
const indexOf = (root, node) => root.childNodes.indexOf(node)
const mount = (root, state, limit) => chat.mountChat(root, state, {}, limit)

// ─── 腿 1：记录写入（跨舱轴 —— A 舱写侧已落；含 subagent 出站 = 本舱）────────────

test("腿 1a·digest 三型 ⇒ 人读线逐条落录（形 ∥ 序 ∥ ts）；机器线零新增", () => {
  const agent = { cwd: null, _slot: 1, history: [], _fullHistory: [] }
  sessionIo.appendRecord(agent, { kind: "digest", status: "start", n: 2, tier: "ask", from: "upstream", msg: "问句" })
  sessionIo.appendRecord(agent, { kind: "digest", status: "cap", mode: "stop", turns: 3 })
  sessionIo.appendRecord(agent, { kind: "digest", status: "end", ok: true, ms: 1500 })
  assert.equal(agent._fullHistory.length, 3, "三型逐条落录（序 = 发帧序）")
  assert.deepEqual(agent._fullHistory.map((r) => [r.kind, r.status]), [["digest", "start"], ["digest", "cap"], ["digest", "end"]], "形 ∥ 序")
  assert.equal(agent._fullHistory[0].n, 2, "起跑事实原样（`tier` ∥ `from` ∥ `msg` 随行）")
  assert.equal(agent._fullHistory[0].tier, "ask", "上行档原样")
  assert.equal(agent._fullHistory[1].turns, 3, "撞帽事实原样")
  assert.equal(agent._fullHistory[2].ms, 1500, "终态事实原样")
  for (const record of agent._fullHistory) assert.equal(typeof record.ts, "number", "`ts` 打点（记时单点 = pushReal）")
  assert.equal(agent.history.length, 0, "机器线零新增（记录不喂模型 —— contextHistory 零触）")
})

test("腿 1b·subagent 快照 ⇒ `record:append` 出站（含非活动键 ∥ rows 保尾上界 + 省略明示）", async (t) => {
  const calls = []
  const prevBridge = globalThis.thincoder
  globalThis.thincoder = { invoke: (name, payload) => { calls.push([name, payload]); return Promise.resolve({ ok: true, reason: null }) } }
  t.after(() => { if (prevBridge === undefined) delete globalThis.thincoder; else globalThis.thincoder = prevBridge })
  const rows = Array.from({ length: 600 }, (_, i) => ({ kind: "text", text: `行${i}` }))
  const block = { key: "sub:explore#1", label: "sub:explore#1", role: "explore", id: 1, model: null, startedAt: 0, frozen: false, awaitingDigest: false, status: "running", rows }
  const state = { activeSession: "9", subBlocks: { [KEY]: [block] }, pool: {} } // 键 1 非活动（活动 = 9 ⇒ 含非活动键轴）
  const next = subagentReduce.onSubagent(state, { key: KEY, status: "done", role: "explore", id: 1 }, 1000)
  await tick()
  assert.equal(calls.length, 1, "归档派生点 ⇒ 恰一次出站")
  const [name, payload] = calls[0]
  assert.equal(name, "record:append", "通道名 = record:append")
  assert.equal(payload.key, KEY, "载荷键 = 会话键（含非活动键 —— 一并取宽）")
  assert.equal(payload.record.kind, "subagent", "记录形 = 留档块同形（kind ∥ meta ∥ rows）")
  assert.ok(payload.record.meta && typeof payload.record.meta === "object", "meta 快照在场")
  assert.ok(Array.isArray(payload.record.rows), "rows 快照在场")
  assert.ok(payload.record.rows.length <= 501, "rows 保尾上界（≤ 500 行 + 省略标记）")
  assert.equal(payload.record.rows.at(-1).text, "行599", "保尾：末行原样")
  assert.ok(String(payload.record.rows[0].text).includes("truncated"), "省略明示（首行 = 标记行）")
  assert.equal(payload.record.rows.some((row) => row.text === "行0"), false, "弃最旧（保尾截断）")
  assert.equal(next.blocks, undefined, "非活动键 ⇒ 流内零块（记录出站 ∥ 流面不动）")
  assert.equal(next.subBlocks[KEY][0].region, "flow", "表项墓碑（归档派生同径）")
})

// ─── 腿 2：直通 ∥ 折叠 ─────────────────────────────────────────────────────

test("腿 2·直通 ∥ 折叠：混序伪槽 ⇒ 回执携记录；折叠 ⇒ 终态轮携位次 ∥ 痕元素位次正确（末轮无 end 不产）", async (t) => {
  await withFakeDom(async () => {
    zh()
    const { cwd } = sandbox(t)
    writeSlot(cwd, [
      { role: "user", content: "问题一", ts: 1 }, // idx 0
      { role: "assistant", content: "回答一", ts: 2 }, // idx 1
      { kind: "digest", status: "start", n: 2, tier: null, from: null, msg: null, ts: 3 }, // idx 2
      { role: "user", content: "问题二", ts: 4 }, // idx 3
      { role: "assistant", content: "回答二", ts: 5 }, // idx 4
      { kind: "digest", status: "cap", mode: "auto", turns: 3, ts: 6 }, // idx 5
      { kind: "digest", status: "end", ok: true, ms: 1500, ts: 7 }, // idx 6
      { kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "子代理行" }], ts: 8 }, // idx 7
      { role: "user", content: "问题三", ts: 9 }, // idx 8
      { kind: "digest", status: "start", n: 1, tier: null, from: null, msg: null, ts: 10 }, // idx 9 未结（无 end）
    ])
    const receipt = pageOf(cwd, null)
    assert.equal(receipt.ok, true, "页读回执成立")
    assert.deepEqual(receipt.messages.map((m) => m.kind), ["user", "assistant", "digest", "user", "assistant", "digest", "digest", "subagent", "user", "digest"], "记录直通在场 ∥ 混序保序")
    assert.deepEqual(receipt.messages.filter((m) => m.kind === "digest" || m.kind === "subagent").map((m) => m.idx), [2, 5, 6, 7, 9], "记录携全局位次（idx）")
    const state = pageRead.applyPage(baseState(cwd), receipt, { key: KEY, before: null })
    const rounds = state.digest[KEY]
    assert.equal(rounds.length, 1, "折叠 ⇒ 恰一枚终态轮（末轮无 end 不产 —— 防双份）")
    assert.equal(rounds[0].status, "end", "终态轮（status = end）")
    assert.equal(rounds[0].at, 2, "携位次（起跑记录位次）")
    assert.equal(rounds[0].n, 2, "起跑 n 保")
    assert.deepEqual(rounds[0].cap, { mode: "auto", turns: 3 }, "cap 事实跨 end 存续")
    assert.equal(rounds[0].ok, true, "终态事实")
    assert.equal(rounds[0].ms, 1500, "终态计时")
    assert.equal(state.blocks.length, 6, "块面 = 六块（digest 记录不进块面；subagent 记录成块）")
    const sub = state.blocks.find((b) => b.kind === "subagent")
    assert.deepEqual([sub.meta.role, sub.meta.id, sub.at], ["explore", 1, 7], "留档块：与活流归档同形 + 携位次")
    // 渲染（重建径 —— mountChat）：痕元素位次正确（记录位次 2 ⇒ 居 idx1 块与 idx3 块之间）
    const root = new FakeNode("div")
    root.__connected = true
    const { model: frameModel } = mount(root, state, 150)
    const blocks = directBlocks(root)
    const roundEls = directRounds(root)
    assert.equal(blocks.length, 6, "块节点六枚（计 data-blocks 面）")
    assert.equal(roundEls.length, 1, "痕元素恰一枚")
    assert.equal(root.getAttribute("data-blocks"), "6", "根锚 data-blocks = 块数")
    assert.equal(root.getAttribute("data-hidden"), "0", "根锚 data-hidden = 0（窗内全渲染）")
    assert.equal(blocks[1].getAttribute("data-block-kind"), "assistant", "idx1 块 = 助手（定位基）")
    assert.equal(blocks[2].getAttribute("data-block-kind"), "user", "idx3 块 = 用户（定位基）")
    assert.ok(indexOf(root, roundEls[0]) > indexOf(root, blocks[1]), "痕元素居 idx1 块之下（重建按记录位次复列）")
    assert.ok(indexOf(root, roundEls[0]) < indexOf(root, blocks[2]), "痕元素居 idx3 块之上（段界可辨）")
    const countRow = roundEls[0].querySelector("[data-digest-count]")
    assert.equal(countRow.textContent, i18n.t("digest.done", { n: 2, seconds: "1.5" }), "终态行文单源（onDigest 同式折叠）")
    assert.equal(frameModel.digest.length, 1, "帧模型轮集 = 1（未结末轮不产）")
  })
})

// ─── 腿 3：块重建（留档块计 data-blocks ∥ 计 data-hidden；退窗 ⇒ 折摘要块；回填 ⇒ 重现）──

test("腿 3·块重建：subagent 记录 ⇒ 留档块；退窗 ⇒ 计 data-hidden + 折摘要块；限增（回填）⇒ 重现", async (t) => {
  await withFakeDom(async () => {
    zh()
    const { cwd } = sandbox(t)
    writeSlot(cwd, [
      { role: "user", content: "甲", ts: 1 },
      { role: "assistant", content: "乙", ts: 2 },
      { kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "行一" }], ts: 3 }, // idx 2
      { role: "user", content: "丙", ts: 4 },
      { role: "user", content: "丁", ts: 5 },
    ])
    const state = pageRead.applyPage(baseState(cwd), pageOf(cwd, null), { key: KEY, before: null })
    assert.equal(state.blocks.length, 5, "留档块入块序（计 data-blocks）")
    assert.equal(state.blocks.findIndex((b) => b.kind === "subagent"), 2, "块序 = 记录位次序（idx 2）")
    const wide = store.visibleWindow(state.blocks, 5)
    assert.deepEqual([wide.hidden, wide.visible.length], [0, 5], "满窗：零隐藏")
    const narrow = store.visibleWindow(state.blocks, 2)
    assert.deepEqual([narrow.hidden, narrow.visible.length], [3, 2], "退窗 ⇒ 留档块计入 data-hidden（与五型同规 —— 原「不计」例外退场）")
    const rootA = new FakeNode("div")
    rootA.__connected = true
    mount(rootA, state, 2)
    assert.equal(rootA.getAttribute("data-hidden"), "3", "根锚 data-hidden = 3（留档块记账）")
    assert.ok(rootA.querySelector("[data-summary]") !== null, "退窗 ⇒ 折摘要块在场")
    assert.equal(directBlocks(rootA).filter((n) => n.getAttribute("data-block-kind") === "subagent").length, 0, "退窗 ⇒ 留档块不在场（摘要块承接）")
    const rootB = new FakeNode("div")
    rootB.__connected = true
    mount(rootB, state, 5) // 限增宽窗（回填收束沿 —— 以宽窗容纳并入件）
    const subs = directBlocks(rootB).filter((n) => n.getAttribute("data-block-kind") === "subagent")
    assert.equal(subs.length, 1, "限增（回填）⇒ 留档块重现")
    assert.equal(subs[0].getAttribute("data-block-id"), "2", "块键面不动（位序键）")
    assert.ok(subs[0].querySelector(".advisor-block") !== null, "回显补装（核件重放 —— 归档同径）")
  })
})

// ─── 腿 4：痕随窗（位次越出已渲染块区 ⇒ 不在场；回填 ⇒ 按位次重建）──────────────

test("腿 4·痕随窗：头部淘汰 ⇒ 同拍摘越位痕；回填 ⇒ 按位次重建（块挂载后落位）", async (t) => {
  await withFakeDom(async () => {
    zh()
    const { cwd } = sandbox(t)
    // 340 条目：idx 100–101 = 一轮 digest（start ∥ end —— 居更早页）；余 = 消息。
    const history = []
    for (let i = 0; i < 340; i += 1) {
      if (i === 100) history.push({ kind: "digest", status: "start", n: 2, tier: null, from: null, msg: null, ts: i })
      else if (i === 101) history.push({ kind: "digest", status: "end", ok: true, ms: 800, ts: i })
      else history.push({ role: "user", content: `m${i}`, ts: i })
    }
    writeSlot(cwd, history)
    const receipt1 = pageOf(cwd, null) // 尾页 200 条（idx 140–339）—— 轮记录不在页内
    assert.equal(receipt1.messages.some((m) => m.kind === "digest"), false, "首屏页不含该轮记录（居更早页）")
    const state1 = pageRead.applyPage(baseState(cwd), receipt1, { key: KEY, before: null })
    assert.equal(state1.blocks.length, 200, "首屏 200 块（全消息）")
    assert.equal((state1.digest ?? {})[KEY], undefined, "首屏折叠：零轮（记录不在页内）")
    const root = new FakeNode("div")
    root.__connected = true
    const first = mount(root, state1, 150)
    assert.equal(directRounds(root).length, 0, "轮不在场（其记录未载 ⇒ 零痕元素）")
    // 回填帧（真路：页读 ⇒ applyPage ⇒ 限增 ⇒ alignPlan ⇒ settleFrame）
    const back = pageOf(cwd, state1.history.page)
    assert.equal(back.messages.some((m) => m.kind === "digest"), true, "回填页携轮记录")
    const state2 = pageRead.applyPage(state1, back, { key: KEY, before: state1.history.page })
    const added = state2.blocks.length - state1.blocks.length
    const limit2 = chatScroll.nextWindow({ limit: 150, inFlight: true }, false, added)
    assert.equal(limit2, 150 + added, "窗限增（收束沿 —— 本页实并入块数）")
    const model2 = model.chatModel(state2, limit2)
    const align2 = chatStream.alignPlan(first.mounted, model2.blocks, false, 0)
    const mounted2 = chat.settleFrame(root, model2, SCROLL, align2, "reset", {}, first.mounted)
    assert.equal(align2.prepend, added, "回填并入前部（prepend = 本页实并入块数）")
    assert.equal(state2.digest[KEY].length, 1, "回填折叠 ⇒ 终态轮入切片")
    assert.equal(state2.digest[KEY][0].at, 100, "位次 = 起跑记录位次")
    const roundEls = directRounds(root)
    assert.equal(roundEls.length, 1, "回填 ⇒ 痕元素按位次重建（块挂载后落位 —— ④′ 步）")
    const blocks2 = directBlocks(root)
    assert.equal(blocks2.length, model2.blocks.length, "块节点数 ≡ visible（不变式不破）")
    const at99 = model2.blocks.findIndex((b) => b.at === 99)
    const at102 = model2.blocks.findIndex((b) => b.at === 102)
    assert.ok(at99 >= 0 && at102 >= 0, "邻域块在场（99 ∥ 102 位次）")
    assert.ok(indexOf(root, blocks2[at99]) < indexOf(root, roundEls[0]), "位次 99 块居轮上")
    assert.ok(indexOf(root, blocks2[at102]) > indexOf(root, roundEls[0]), "位次 102 块居轮下（段界可辨）")
    // 头部淘汰（追加饱和 —— 位次 100 越出已渲染块区下界）⇒ 同拍摘越位痕
    const grown = [...state2.blocks]
    for (let i = 0; i < 120; i += 1) grown.push({ kind: "user", text: `n${i}` })
    const state3 = { ...state2, blocks: grown }
    const model3 = model.chatModel(state3, limit2)
    assert.ok(model3.blocks[0].at > 102, "头部已淘汰过轮位次（区下界越位）")
    const align3 = chatStream.alignPlan(mounted2, model3.blocks, false, 0)
    chat.settleFrame(root, model3, SCROLL, align3, "append", {}, mounted2)
    assert.equal(directRounds(root).length, 0, "头部淘汰 ⇒ 同拍摘越位痕（随窗）")
    assert.equal(directBlocks(root).length, model3.blocks.length, "块序不破（痕为非块节点 —— 摘除不动块序）")
    assert.equal(root.getAttribute("data-blocks"), String(model3.blocks.length), "根锚 data-blocks 随帧（帧尾态刷）")
  })
})

// ─── 腿 5：非破坏 / 负控（默认径逐字等价；CLI ∥ VSC 读面零改）────────────────────

test("腿 5a·负控：historyWindow 默认径 ⇔ 改前基线逐字等价；{records:false} 同值；直通 opt-in 零破默认", async () => {
  const fixture = [
    { role: "user", content: "问", ts: 1 },
    { role: "assistant", content: "答", reasoning: "想", ts: 2 },
    { kind: "digest", status: "start", n: 2, tier: null, from: null, msg: null, ts: 3 },
    { role: "user", content: "[System reminder: x]", ts: 4 },
    { kind: "subagent", meta: { role: "explore", id: 1 }, rows: [], ts: 5 },
  ]
  const runAll = (fn) => {
    const out = []
    for (const before of [null, 0, 1, 2, 3, 5]) for (const size of [1, 2, 3, 200]) out.push(JSON.stringify(fn(fixture, before, size)))
    return out
  }
  const current = runAll((h, b, s) => historyWindow.historyWindow(h, b, s))
  const off = runAll((h, b, s) => historyWindow.historyWindow(h, b, s, { records: false }))
  assert.deepEqual(current, off, "默认径 ⇔ `{ records: false }` 同值")
  assert.equal(current.some((row) => row.includes('"digest"') || row.includes('"subagent"')), false, "默认径零记录（记录盲 —— CLI ∥ VSC 零破）")
  const on = runAll((h, b, s) => historyWindow.historyWindow(h, b, s, { records: true }))
  assert.notDeepEqual(on, current, "直通 opt-in 生效（记录入窗）")
  // 基线对拍：git HEAD 抽取件（改前版）—— 默认径逐字等价；HEAD 已含直通（随批提交后）⇒ 退化为自证，显式记降级
  const baseline = execFileSync("git", ["show", "HEAD:thincoder-core/history-window.mjs"], { cwd: ROOT, encoding: "utf8" })
  const basePath = join(tmpdir(), `digest-persist-baseline-${process.pid}.mjs`)
  writeFileSync(basePath, baseline, "utf8")
  const baseMod = await import(pathToFileURL(basePath).href)
  const base = runAll((h, b, s) => baseMod.historyWindow(h, b, s))
  const baseHasRecords = Array.isArray(baseMod.historyWindow(fixture, null, 200, { records: true })?.messages) &&
    baseMod.historyWindow(fixture, null, 200, { records: true }).messages.some((m) => m.kind === "digest" || m.kind === "subagent")
  if (baseHasRecords) console.log("[leg5a] 基线 = 已含记录直通（HEAD 已随批提交）⇒ 逐字等价腿退化为自证（诚实记降级：以 `{records:false}` 同值 ∥ 记录盲两面为准）")
  else assert.equal(base.some((row) => row.includes('"digest"') || row.includes('"subagent"')), false, "基线 = 改前版（记录盲 —— 负控前提成立）")
  assert.deepEqual(current, base, "默认径 ⇔ 基线（逐字等价 —— 负控腿）")
})

test("腿 5b·负控：CLI ∥ VSC 读面零改（源面零触断言）；桌面 pageHistory 开直通", () => {
  const vsc = text("thincoder-vscode/src/extension/panel-session.mjs")
  assert.doesNotMatch(vsc, /records\s*:\s*true/, "VSC 读面未开直通（对齐实现 = 其板义务）")
  const vscWindow = text("thincoder-vscode/src/extension/history-window.mjs")
  assert.match(vscWindow, /export \{ historyWindow, HISTORY_PAGE_SIZE, isRealUserMsg \}/, "VSC 转口面零改")
  const cli = text("thincoder-cli/src/tui/startup.mjs")
  assert.doesNotMatch(cli, /records\s*:\s*true/, "CLI 读面未开直通")
  const desktopSlots = text("thincoder-desktop/src/main/session-slots.mjs")
  assert.match(desktopSlots, /historyWindow\(history, before, HISTORY_PAGE_SIZE, \{ records: true \}\)/, "桌面 pageHistory 开直通（§2 ② 读面义务）")
})

// ─── 腿 6：尾径块身份面（回归锁 —— chat 拆分重写实参面：键 ∥ 标签 ∥ 重试钮）───────────

test("腿 6·尾径块身份面：键 = 位序（hidden + index）∥ 标签 = 回合首 ∥ 重试钮随模型 canRetry", async () => {
  await withFakeDom(async () => {
    zh()
    const base = [
      { id: "u1", kind: "user", text: "问" },
      { id: "a1", kind: "assistant", text: "答" },
    ]
    const root = new FakeNode("div")
    root.__connected = true
    const first = mount(root, { ...baseState("D:/x"), blocks: base }, 150)
    assert.equal(first.mounted.length, 2, "初帧两块（mountChat 径）")
    // 尾径（append 帧 —— mountTail）：非回合首 tool 块（无 id ⇒ 键走位序兑底 —— 前位 = assistant ⇒ 零标签）
    const tool = { kind: "tool", tool: "bash", args: "ls", result: "ok" }
    const state2 = { ...baseState("D:/x"), blocks: [...base, tool] }
    const model2 = model.chatModel(state2, 150)
    const m2 = chat.settleFrame(root, model2, SCROLL, chatStream.alignPlan(first.mounted, model2.blocks, false, 0), "append", {}, first.mounted)
    const toolNode = root.querySelector('[data-block-kind="tool"]')
    assert.ok(toolNode !== null, "尾径挂载 tool 块在场")
    assert.equal(toolNode.getAttribute("data-block-id"), "2", "尾径键 = 位序 2（拆分重写实参面回归锁 —— 错位时为数 + model 对象串）")
    assert.equal(m2[m2.length - 1].node, toolNode, "记账面同节点")
    // 非回合首 ⇒ 零说话人标签（错位时 turnHeadOf 收 prev=undefined ⇒ 恒真 ⇒ 幻影标签）
    assert.equal(toolNode.querySelector(".msg-label"), null, "非回合首 ⇒ 零标签")
    // 回合首（前位 = user）⇒ 标签在场（同径异帧 —— 判据未伤）：续帧 + user2 ⇒ + assistant2（前位 = user2）
    const user2 = { kind: "user", text: "再问" }
    const state3 = { ...baseState("D:/x"), blocks: [...base, tool, user2] }
    const model3 = model.chatModel(state3, 150)
    const m3 = chat.settleFrame(root, model3, SCROLL, chatStream.alignPlan(m2, model3.blocks, false, 0), "append", {}, m2)
    const assistant2 = { kind: "assistant", text: "再答" }
    const state4 = { ...baseState("D:/x"), blocks: [...base, tool, user2, assistant2] }
    const model4 = model.chatModel(state4, 150)
    const m4 = chat.settleFrame(root, model4, SCROLL, chatStream.alignPlan(m3, model4.blocks, false, 0), "append", {}, m3)
    const a2Node = root.querySelector('[data-block-id="4"]')
    assert.ok(a2Node !== null, "尾径键 = 位序 4（续帧）")
    assert.notEqual(a2Node.querySelector(".msg-label"), null, "回合首（前位 = user2）⇒ 标签在场")
    // 重试钮：尾径 error 块 + 模型 canRetry（末 user 块在场）⇒ 钮在场（错位时 canRetry 恒 false ⇒ 钮缺）
    const err = { kind: "error", text: "炸" }
    const state5 = { ...baseState("D:/x"), blocks: [...base, tool, user2, assistant2, err] }
    const model5 = model.chatModel(state5, 150)
    assert.equal(model5.canRetry, true, "末 user 块在场 ⇒ 模型 canRetry 真")
    chat.settleFrame(root, model5, SCROLL, chatStream.alignPlan(m4, model5.blocks, false, 0), "append", {}, m4)
    const errNode = root.querySelector('[data-block-kind="error"]')
    assert.ok(errNode !== null, "尾径 error 块在场")
    assert.notEqual(errNode.querySelector(".error-retry-btn"), null, "重试钮随模型 canRetry（错位时钮缺）")
    assert.equal(directBlocks(root).length, model5.blocks.length, "块节点数 ≡ visible（不变式不破）")
  })
})

// ─── 腿 7：写点前移（修复轮 3 · 批档 §2 裁定 (a)）—— `end` 记录先于结算落盘 ─────────────────

test("腿 7·写点前移：边界轮 `end` 记录 ∥ 发帧同点、先于 `settleTurn` 槽落盘（读回即见）；非边界 ∥ timer 轮零 `end`", async (t) => {
  const { cwd } = sandbox(t)
  const faceOf = (runImpl = async () => {}) => {
    const posts = []
    const face = turnFace.createTurnFace({
      post: (ch, payload) => posts.push([ch, payload]),
      run: runImpl, bridge: () => ({}), postUsage: () => {}, flights: new Map(),
    })
    return { face, posts }
  }
  const agentOf = (slot, over = {}) => ({ cwd, _slot: slot, title: "T", history: [], _fullHistory: [], ...over })
  const slotHistory = (slot) => JSON.parse(readFileSync(coreSlots.slotPath(cwd, slot), "utf8")).history
  const endsOf = (rows) => rows.filter((r) => r.kind === "digest" && r.status === "end")

  // ① 边界轮（`autoTurn ∧ ¬timerTurn`）：恰一帧 `end` ∥ 恰一记录 —— 记录入结算落盘（槽档 history 读回即见）
  const a1 = agentOf(1)
  const f1 = faceOf()
  await f1.face.executeTurn(KEY, a1, "hi", { autoTurn: true })
  const frames1 = f1.posts.filter(([ch]) => ch === "ev:digest").map(([, p]) => p)
  assert.deepEqual(frames1.map((p) => p.status), ["end"], "边界轮 ⇒ 恰一帧 ev:digest end（零双帧）")
  assert.equal(frames1[0].ok, true, "成功径 ok 真")
  assert.equal(typeof frames1[0].ms, "number", "计时在场")
  const ends1 = endsOf(slotHistory(1))
  assert.equal(ends1.length, 1, "end 记录随结算落盘（红：改前写点晚于槽落盘 ⇒ 盘面零 end）")
  assert.deepEqual([ends1[0].ok, ends1[0].ms], [frames1[0].ok, frames1[0].ms], "记录 ∥ 发帧同值（同点双动作 —— ms 单算式）")
  assert.equal(a1.history.length, 0, "机器线零触（记录不入 contextHistory）")

  // ② 负控：非边界（用户回合 —— 无 `autoTurn`）⇒ 零 digest 帧 ∥ 盘面零 end
  const a2 = agentOf(2)
  const f2 = faceOf()
  await f2.face.executeTurn(KEY, a2, "hi", {})
  assert.deepEqual(f2.posts.filter(([ch]) => ch === "ev:digest"), [], "非边界轮零 digest 帧")
  assert.equal(endsOf(slotHistory(2)).length, 0, "非边界轮盘面零 end")

  // ③ 负控：timer 轮（`autoTurn ∧ timerTurn`）不冒充消化边界 ⇒ 零 digest 帧 ∥ 盘面零 end
  const a3 = agentOf(3)
  const f3 = faceOf()
  await f3.face.executeTurn(KEY, a3, "hi", { autoTurn: true, timerTurn: true })
  assert.deepEqual(f3.posts.filter(([ch]) => ch === "ev:digest"), [], "timer 轮零 digest 帧")
  assert.equal(endsOf(slotHistory(3)).length, 0, "timer 轮盘面零 end")

  // ④ 失败径（非 Abort 失败）：`end` 同出且先于结算落盘（ok:false —— 不静默）
  const a4 = agentOf(4)
  const f4 = faceOf(async () => { throw new Error("boom") })
  await assert.rejects(f4.face.executeTurn(KEY, a4, "hi", { autoTurn: true }), /boom/)
  const ends4 = endsOf(slotHistory(4))
  assert.equal(ends4.length, 1, "失败径 end 记录同样先于结算落盘")
  assert.equal(ends4[0].ok, false, "失败径 ok 假（不静默）")
})

