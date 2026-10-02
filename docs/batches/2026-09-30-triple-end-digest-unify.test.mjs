/**
 * 2026-09-30-triple-end-digest-unify.test.mjs — 批次本地单元件（台账 #747 · 三端消化面统一批 · 实施轮）·
 * ⚠ 断代（2026-10-01 · 台账 #765 拆批）：import 断——`views/chat-digest-seat.mjs` 已删；复跑必红为预期（留档对照 · 勿复跑）。
 * 任务书 = `docs/batches/2026-09-30-triple-end-digest-unify.md` §2 ∥ §4（判据载体 = §7「三端消化面统一批注」四腿）。
 * 四腿：① **行族累积**（`start` 逐轮追加 ∥ 旧轮零动 ∥ 零摘除 ∥ 无轮容器 ∥ cap 行尾追）
 *      ② **标签恒在**（`end` 只换计数行文 —— 标签行同节点 ∥ 同文）
 *      ③ **reclaim 归档落位**（回收窗逐条补发 `done` ⇒ 归档块居消费行族之前（座次入模 ∥ 边界物形）；
 *         起跑窗补发已撤 —— 起跑点零 `done`）
 *      ④ **重载复列**（记录 ⇒ 页内全量轮 + 消费轮配对；模型序 ⇒ 文档序零破）
 * 随批留存 · 不进仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：node --test docs/batches/2026-09-30-triple-end-digest-unify.test.mjs
 * 纪律：行为断言优先（真归约体 ∥ 真帧路 ∥ 真驱动装配）；真机一条 = 父侧闭合（D16 义务）——本档只落机检面。
 */
/*
 * ⚠️ **断代失效注（2026-10-01 · 台账 #754 收正 · 父侧直接执行 · 可 revert）**——本件四腿断言 = #747 语义
 * （① 行族累积 ② 标签恒在 ③ reclaim 族前落位 ④ 全量复列），经用户 2026-10-01 裁定（「三端都不该有 ∥ 只留当轮」）
 * 与 #754 批（`docs/batches/2026-10-01-digest-row-current-only.md`）**全数反转**（① `start` 全替 ② 终态非 ask
 * 标签退场 ③ 归档居族末之后 ④ 复列末条）；本件**冻结不维护**（现 0/4 属预期断代读数）；现语义守卫 =
 * `docs/batches/2026-10-01-digest-row-current-only.test.mjs`（八腿）。断代注形沿 #708 先例（`structure-split-2.test.mjs`）。
 */

import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（含 thincoder-core/）运行：cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const [wake, pageRead, i18n, i18nCore, seat, subagentReduce, driveMod, chat, chatModel, chatStream] = await Promise.all([
  mod("thincoder-desktop/renderer/events-wake.mjs"), // `ev:digest` ∥ `ev:susp` 归约（累积 ∥ 座次 ∥ 边界）
  mod("thincoder-desktop/renderer/page-read.mjs"), // 页读径（foldDigest ∥ 配对重排）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-desktop/renderer/views/chat-digest-seat.mjs"), // 消化行族构树 ∥ 座次 ∥ 位次面
  mod("thincoder-desktop/renderer/subagent-reduce.mjs"), // 子 agent 归约径（座次入模）
  mod("thincoder-desktop/src/main/suspension-drive.mjs"), // 挂起驱动（回收窗）
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 挂载 ∥ 帧尾（真路）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型
  mod("thincoder-desktop/renderer/views/chat-stream.mjs"), // 对齐步（alignPlan —— 帧输入同源）
])

const KEY = "1"
const zh = () => i18n.initDict({ locale: "zh", dict: i18nCore.projectDictionary("zh") })
const until = async (fn, ms = 4000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error("until timeout")
    await new Promise((r) => setTimeout(r, 5))
  }
  return true
}

// ─── 假 DOM（属性 ∕ 选择器（含逗号组）∕ 结构 —— 沿 digest-persistence 批内件先例）──────────

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
  get nextElementSibling() {
    let node = this.nextSibling
    while (node !== null && node.nodeType !== 1) node = node.nextSibling
    return node
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
  /** `dataset`（真 DOM 语义探针 —— 核件读面所需）。 */
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
function installFakeDom() {
  prevDoc = globalThis.document
  prevNode = globalThis.Node
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
}
function restoreFakeDom() {
  globalThis.document = prevDoc
  globalThis.Node = prevNode
}
async function withFakeDom(fn) {
  installFakeDom()
  try { return await fn() } finally { restoreFakeDom() }
}

// ─── 场景脚手架（真路：mountChat ∥ settleFrame 六步）────────────
const SCROLL = { readMetrics: () => ({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }) }
const EMPTY_PLAN = { evict: 0, prepend: 0, tail: [], ok: true }
const SUB_META = { key: "sub:explore#1", label: "sub:explore#1", role: "explore", id: 1, pool: true, status: "done", frozen: true, startedAt: 0, doneAt: 1500 }

const baseState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, subBlocks: {},
  pool: { running: 0, approval: 0, queue: [], approvals: [] },
  following: true, pendingNew: 0, history: {}, project: { cwd: "/p" }, ...over,
})
/** 行元素读面（无轮容器 —— `[data-digest]` 逐行承载）。 */
const rowsOf = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-digest") !== null)
const blocksOf = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-block-kind") !== null)
const indexOf = (root, node) => root.childNodes.indexOf(node)
const mount = (root, state, limit) => chat.mountChat(root, state, {}, limit)
/** 真帧路（镜像 `renderer/app.mjs` `paintChat`：帧前判据 ⇒ 对齐步 ⇒ 帧尾六步）；
 *  `align.ok` 断言 = 硬化「腿断言 ⇒ 真径」链（`ok` 假时真路走重挂径 —— `app.mjs:175-183`）。 */
const frame = (root, prev, next, mounted = []) => {
  const plan = chatStream.paintPlan({ prev, next, changedKeys: [] })
  const model = chatModel.chatModel(next)
  const tailExempt = plan.tier === "patch" || plan.tier === "patch-append" ? plan.tier : false
  const align = chatStream.alignPlan(mounted, model.blocks, tailExempt, plan.appended ?? 0)
  assert.equal(align.ok, true, "对齐步成立（ok 假 ⇒ 真路走重挂径 —— 本件只断言增量径）")
  return chat.settleFrame(root, model, SCROLL, align, plan.tier, {}, mounted)
}

// ─── 腿 1：行族累积（逐轮追加 ∥ 旧轮零动 ∥ 零摘除 ∥ 无轮容器 ∥ cap 行尾追）────────────────

test("腿 1·行族累积：`start` 逐轮追加（旧轮零动）；DOM 零摘除 ∥ 行元素并列兄弟 ∥ cap 行尾追", async () => {
  // 1a 归约面：两轮累积（旧轮原引用零动；cap/end 就末轮）
  let state = { digest: {}, blocks: [] }
  state = wake.onDigest(state, { key: KEY, status: "start", n: 2 })
  const first = state.digest[KEY][0]
  assert.equal(first.seat, 0, "座次 = 起跑水位（起跑帧当刻流末 —— 空模型 ⇒ 0）")
  assert.equal(first.boundary, true, "边界标 = 本轮（`ev:digest start` 设）")
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 900 })
  const ended = state.digest[KEY][0]
  state = wake.onDigest(state, { key: KEY, status: "start", n: 1 })
  assert.equal(state.digest[KEY].length, 2, "逐轮追加（累积 —— 旧轮零动）")
  assert.equal(state.digest[KEY][0], ended, "旧轮原引用（零全替 ∥ 零摘除）")
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 800 })
  state = wake.onDigest(state, { key: KEY, status: "cap", mode: "stop", turns: 2 })
  assert.equal(state.digest[KEY].length, 2, "`cap` 就末轮更新（零新轮）")
  assert.equal(state.digest[KEY][1].cap.mode, "stop", "撞帽事实就末轮")
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 700 })
  assert.equal(state.digest[KEY][0].status, "end", "旧轮终态存续")
  assert.deepEqual(state.digest[KEY][1].cap, { mode: "stop", turns: 2 }, "cap 事实跨 end 存续（末轮）")

  // 1b DOM 面：第二轮起跑 ⇒ 首轮行族零动 ∥ 新行族并列兄弟（无轮容器）∥ cap 行尾追（流末）
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const b0 = { kind: "assistant", text: "轮内前", id: "c1" } // 轮内后产块（座次 0 ⇒ 行族居其前）
    const s1 = baseState({ blocks: [b0], digest: { [KEY]: [first] } })
    const m1 = mount(root, s1)
    const label1 = rowsOf(root)[0]
    assert.equal(rowsOf(root).length, 2, "首轮行族 = 标签行 + 计数行（无轮容器 —— 两行并列兄弟）")
    assert.ok(label1.getAttribute("data-digest-label") !== null, "首行 = 标签行")
    assert.ok(label1.parentNode === root, "行元素直挂流内（无包裹元素）")
    const s2 = baseState({ blocks: [b0], digest: { [KEY]: [first, { status: "start", n: 1, tier: null, seat: 1, rid: 2, boundary: true }] } })
    const m2 = frame(root, s1, s2, m1.mounted)
    assert.equal(rowsOf(root)[0], label1, "旧轮首行同节点存续（零摘除）")
    assert.equal(rowsOf(root).length, 4, "两轮行族并列（2 + 2）")
    assert.ok(indexOf(root, rowsOf(root)[1]) < indexOf(root, blocksOf(root)[0]), "首轮行族居轮内后产块之前（座次 0）")
    const s3 = baseState({ blocks: [b0], digest: { [KEY]: [first, { status: "end", ok: true, ms: 500, n: 2, seat: 1, rid: 2, boundary: true, cap: { mode: "auto", turns: 3 } }] } })
    frame(root, s2, s3, m2)
    const rows = rowsOf(root)
    assert.equal(rows.length, 5, "cap 行补建（末轮）")
    assert.ok(rows[rows.length - 1].getAttribute("data-digest-cap") !== null, "cap 行 = 尾追（流末）")
    assert.equal(indexOf(root, rows[rows.length - 1]), root.childNodes.length - 1, "cap 行居流尾（cap 帧到达即随流尾追）")
  })
})

// ─── 腿 2：标签恒在（`end` 只换计数行文）────────────────────────

test("腿 2·标签恒在：`end` 只换计数行文（标签行同节点 ∥ 同文 ∥ 零动）", async () => {
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const b0 = { kind: "assistant", text: "轮内前", id: "k1" } // 轮内后产块（对齐步重合面 —— 增量径入）
    const live = { status: "start", n: 2, tier: null, seat: 0, rid: 1, boundary: true }
    const s1 = baseState({ blocks: [b0], digest: { [KEY]: [live] } })
    const m1 = mount(root, s1)
    const label = rowsOf(root)[0]
    const labelText = label.textContent
    const count = rowsOf(root)[1]
    assert.ok(count.getAttribute("data-digest-count") !== null, "计数行在场（n > 0）")
    assert.notEqual(label.textContent, count.textContent, "起跑两行文各异")
    const ended = { status: "end", ok: true, ms: 1200, n: 2, tier: null, seat: 0, rid: 1, boundary: true }
    const m2 = frame(root, s1, baseState({ blocks: [b0], digest: { [KEY]: [ended] } }), m1.mounted)
    assert.equal(rowsOf(root)[0], label, "标签行同节点存续（终态不撤 —— 恒在）")
    assert.equal(label.textContent, labelText, "标签行零动（`end` 只换计数行文）")
    assert.equal(rowsOf(root)[1], count, "计数行同节点（就地换文）")
    assert.notEqual(count.textContent, undefined, "计数行终态文")
    assert.ok(count.getAttribute("class").includes("digest-done"), "终态文 class = digest-done")
    const aborted = { status: "end", ok: false, ms: 700, n: 2, tier: null, seat: 0, rid: 1, boundary: true }
    frame(root, baseState({ blocks: [b0], digest: { [KEY]: [ended] } }), baseState({ blocks: [b0], digest: { [KEY]: [aborted] } }), m2)
    assert.ok(count.getAttribute("class").includes("digest-failed"), "失败终态 = digest-failed（同一计数行）")
    assert.equal(rowsOf(root)[0], label, "标签行仍在（零摘除）")
  })
})

// ─── 腿 3：reclaim 归档落位（座次入模 ∥ 边界物形；起跑窗补发已撤）────────────────

test("腿 3·reclaim 归档落位：归档块入其消费轮座次位（居消费行族之前）；起跑点零补发", async () => {
  // 3a 归约面：座次入模（消化回收 —— done on awaitingDigest）；`ev:susp` 收帧清边界 ⇒ 迟来 done 尾追
  const b0 = { kind: "assistant", text: "前" }
  const b1 = { kind: "assistant", text: "后" }
  let state = baseState({ blocks: [b0] })
  state = wake.onDigest(state, { key: KEY, status: "start", n: 1 })
  assert.equal(state.digest[KEY][0].seat, 1, "座次 = 起跑帧当刻流末（已有 1 块）")
  state = { ...state, blocks: [b0, b1] } // 轮内后产块（随流居其下）
  state = subagentReduce.onSubagent(state, { key: KEY, role: "subagent", id: 7, status: "started" }, 0)
  state = subagentReduce.onSubagent(state, { key: KEY, role: "subagent", id: 7, status: "settled" }, 0)
  assert.equal(state.subBlocks[KEY][0].awaitingDigest, true, "settled ⇒ 等待消化态（`awaitingDigest`）")
  const archived = subagentReduce.onSubagent(state, { key: KEY, role: "subagent", id: 7, status: "done" }, 0)
  assert.equal(archived.blocks.length, 3, "归档入流恰一枚（座次入模）")
  assert.equal(archived.blocks[0], b0, "首位块零动")
  assert.equal(archived.blocks[1].kind, "subagent", "归档块居座次位（先于轮内后产块）")
  assert.equal(archived.blocks[1].seat, 1, "座次段标（流内副本 —— 记录载荷零触）")
  assert.equal(archived.blocks[2], b1, "轮内后产块随流居其下")
  // 边界清（`ev:susp` 收帧 —— 对位 VSC `chat-messages.js:236`）⇒ 迟来 done 退化尾追
  const sealed = wake.onSusp(archived, { key: KEY, active: true, running: 0, queued: 0, pending: 0, done: 0 }, 0)
  assert.equal(sealed.digest[KEY][0].boundary, false, "收帧清边界")
  let late = subagentReduce.onSubagent(sealed, { key: KEY, role: "subagent", id: 8, status: "started" }, 0)
  late = subagentReduce.onSubagent(late, { key: KEY, role: "subagent", id: 8, status: "done" }, 0)
  assert.equal(late.blocks[late.blocks.length - 1].kind, "subagent", "迟来 done（边界已清）⇒ 尾追退化")
  assert.equal(late.blocks[late.blocks.length - 1].seat, undefined, "尾追块无座次标")

  // 3b DOM 面：归档块居消费行族之前 ∥ 轮内后产块居其后
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const round = archived.digest[KEY][0] // 带边界标（3a 的 archived 未清）
    const s1 = baseState({ blocks: [b0], digest: { [KEY]: [round] } })
    const m1 = mount(root, s1)
    const s2 = { ...s1, blocks: [b0, b1], digest: { [KEY]: [round] } }
    const m2 = frame(root, s1, s2, m1.mounted)
    const s3 = { ...s2, blocks: archived.blocks }
    const m3 = frame(root, s2, s3, m2)
    const rows = rowsOf(root)
    const blocks = blocksOf(root)
    assert.equal(blocks.length, 3, "块三枚（座次入模后与模型等长）")
    assert.equal(rows.length, 2, "行族在场（标签行 + 计数行）")
    assert.ok(indexOf(root, blocks[0]) < indexOf(root, blocks[1]), "序 = [前][归档块]")
    assert.ok(indexOf(root, blocks[1]) < indexOf(root, rows[0]), "归档块居消费行族之前（边界物形）")
    assert.ok(indexOf(root, rows[rows.length - 1]) < indexOf(root, blocks[2]), "行族居轮内后产块之前")
    assert.equal(m3.length, 3, "块记账三枚（DOM ≡ visible 不变式不破）")
    assert.equal(root.getAttribute("data-blocks"), "3", "根锚 data-blocks 随帧")
  })

  // 3b′ 头段换代径（块携 id ⇒ 增量判据 = reset ⇒ 对齐步「头段换代 + 前插」）：座次落位回正
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const x0 = { kind: "assistant", text: "前", id: "x0" }
    const x1 = { kind: "assistant", text: "后", id: "x1" }
    const round = archived.digest[KEY][0]
    const s1 = baseState({ blocks: [x0], digest: { [KEY]: [round] } })
    const m1 = mount(root, s1)
    const s2 = { ...s1, blocks: [x0, x1] }
    const m2 = frame(root, s1, s2, m1.mounted)
    assert.ok(indexOf(root, rowsOf(root)[0]) < indexOf(root, blocksOf(root)[1]), "前置：行族居轮内后产块之前")
    const arch = { ...archived.blocks[1], id: "s7" }
    const s3 = { ...s2, blocks: [x0, arch, x1] }
    const m3 = frame(root, s2, s3, m2)
    const rows = rowsOf(root)
    const blocks = blocksOf(root)
    assert.equal(m3.length, 3, "块记账三枚（头段换代后重记）")
    assert.ok(indexOf(root, blocks[1]) < indexOf(root, rows[0]), "头段换代：归档块仍居消费行族之前")
    assert.ok(indexOf(root, rows[rows.length - 1]) < indexOf(root, blocks[2]), "行族居轮内后产块之前（座次落位回正）")
    const m4 = frame(root, s3, s3, m3)
    assert.equal(m4.length, 3, "零动作帧：DOM ≡ visible 稳定")
    assert.equal(rowsOf(root)[0], rows[0], "零动作帧：行族零搬（已就位 ⇒ 零 DOM 写）")
  })

  // 3b″ 非跟滚补偿径（读数裁剪 —— 座次实动入预判）：同帧「起跑 + 轮内新块」⇒ 行族上移、补偿读数落位、不空读
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const x0 = { kind: "assistant", text: "前" }
    const b1 = { kind: "assistant", text: "轮内", id: "n1" }
    let reads = 0
    const scroll = { readMetrics: () => { reads += 1; return { scrollTop: 0, scrollHeight: 1000, clientHeight: 200 } } }
    const s1 = baseState({ blocks: [x0], digest: {}, following: false })
    const m1 = mount(root, s1)
    const round = { status: "start", n: 1, tier: null, seat: 1, rid: 1, boundary: true }
    const s2 = baseState({ blocks: [x0, b1], digest: { [KEY]: [round] }, following: false })
    const plan = chatStream.paintPlan({ prev: s1, next: s2, changedKeys: [] })
    const model = chatModel.chatModel(s2)
    const m2 = chat.settleFrame(root, model, scroll, chatStream.alignPlan(m1.mounted, model.blocks, false, 0), plan.tier, {}, m1.mounted)
    assert.equal(m2.length, 2, "块记账两枚")
    assert.ok(reads >= 1, "非跟滚 ∥ 座次实动 ⇒ 补偿径读数在场（预判含 `pendingLiveSeats` —— 不落空读）")
    const rows = rowsOf(root)
    assert.ok(indexOf(root, rows[rows.length - 1]) < indexOf(root, blocksOf(root)[1]), "同帧起跑+新块：行族上移居轮内新块之前（座次落位）")
    assert.equal(root.getAttribute("data-following"), "0", "跟滚位不被本帧改写")
  })

  // 3c 驱动面：回收窗（reclaim）逐条补发 `done`；起跑点零补发（起跑窗已撤 —— #747）；consult 族零补发（VSC 守卫同判）
  const entry = { role: "subagent", id: 7 }
  const consult = { role: "consult", id: 9 }
  const agent = {
    title: "t", cwd: null, _slot: 1,
    _asyncSubagents: new Map([["s1", { status: "running" }]]),
    _asyncAdvisors: new Map(), _consultSessions: new Map(), _pendingAsyncResults: [consult, entry],
    provider: { name: "vis", model: "claude-sonnet-4-5" }, config: { locale: "zh" }, memory: { db: null },
    history: [], _fullHistory: [],
  }
  const log = []
  const drive = driveMod.createSuspensionDrive({
    post: (ch, payload) => log.push({ type: "post", ch, payload }),
    runTurn: (key, agent1, text, opts = {}) => {
      log.push({ type: "run", text, opts })
      agent1._pendingAsyncResults.splice(0) // run 首行注入器全量消费
      return Promise.resolve()
    },
    timer: () => ({ unref() {} }), clear: () => {},
  })
  assert.equal(drive.start(KEY, agent, { cwd: "/p" }), true, "池活 ⇒ 入窗")
  await until(() => log.some((row) => row.type === "post" && row.ch === "ev:subagent" && row.payload.status === "done"))
  const startAt = log.findIndex((row) => row.type === "post" && row.ch === "ev:digest" && row.payload.status === "start")
  const doneAt = log.findIndex((row) => row.type === "post" && row.ch === "ev:subagent" && row.payload.status === "done")
  const runAt = log.findIndex((row) => row.type === "run")
  assert.ok(startAt >= 0 && doneAt >= 0 && runAt >= 0, "三事件皆在场")
  assert.ok(runAt < doneAt, "回收补发后于回合执行（reclaim = 消费完成点 —— 起跑点零补发）")
  assert.deepEqual(log[startAt].payload, { key: KEY, status: "start", n: 2 }, "起跑帧（n = 起跑 pending 数 —— 含 consult 条目）")
  assert.equal(log.filter((row) => row.type === "post" && row.ch === "ev:subagent" && row.payload.status === "done").length, 1, "恰一发（起跑窗补发已撤）")
  assert.ok(log.every((row) => !(row.ch === "ev:subagent" && row.payload?.role === "consult")), "consult 族零补发（VSC `suspension.mjs:115` 守卫同判 —— 无行可归档）")
})

// ─── 腿 4：重载复列（记录 ⇒ 页内全量轮 + 消费轮配对）────────────────

test("腿 4·重载复列：页内全量完整轮 + 消费轮配对（模型序 ⇒ 文档序零破）", async () => {
  const receipt = {
    ok: true,
    messages: [
      { kind: "assistant", text: "前", idx: 10, timestamp: 1 },
      { kind: "digest", status: "start", n: 2, tier: null, idx: 20 },
      { kind: "assistant", text: "轮内一", idx: 21, timestamp: 2 },
      { kind: "digest", status: "end", ok: true, ms: 500, idx: 22 },
      { kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "行" }], idx: 23 },
      { kind: "digest", status: "start", n: 1, tier: null, idx: 30 },
      { kind: "digest", status: "end", ok: true, ms: 800, idx: 31 },
      { kind: "assistant", text: "后", idx: 40, timestamp: 3 },
    ],
    hasOlder: false, next: null, meta: {}, flags: null, queue: null,
  }
  const pageState = { activeSession: KEY, blocks: [], digest: {}, stopMark: {}, timerNotice: {}, compress: {}, sessionMeta: {}, following: false, pendingNew: 0 }
  const s1 = pageRead.applyPage(pageState, receipt, { key: KEY, before: null })
  assert.equal(s1.digest[KEY].length, 2, "页内全量完整轮（两轮 —— 非仅最新一条）")
  assert.equal(s1.digest[KEY][0].at, 20, "首轮位次 = 起跑记录 idx")
  assert.equal(s1.digest[KEY][0].endAt, 22, "首轮终态位次（消费轮配对读面）")
  assert.equal(s1.digest[KEY][1].at, 30, "次轮位次")
  assert.equal(s1.digest[KEY][0].boundary, undefined, "折出轮零携运行期标（seat ∥ boundary）")
  assert.equal(s1.blocks[0].text, "前", "块序：首位块零动")
  assert.equal(s1.blocks[1].kind, "subagent", "复列配对：归档块前移至其消费轮位置（先于轮内后产块）")
  assert.equal(s1.blocks[2].text, "轮内一", "轮内后产块居其下")
  assert.equal(s1.blocks[3].text, "后", "次轮后块原位")
  // 4b 重建文档序：归档块居其消费行族之前；次轮行族居其后
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const m1 = mount(root, s1)
    const rows = rowsOf(root)
    const blocks = blocksOf(root)
    assert.equal(rows.length, 4, "两轮行族（无轮容器 —— 逐行并列）")
    assert.ok(indexOf(root, blocks[1]) < indexOf(root, rows[0]), "归档块居其消费轮行族之前")
    assert.ok(indexOf(root, rows[1]) < indexOf(root, blocks[2]), "消费轮行族居轮内后产块之前")
    assert.ok(indexOf(root, rows[2]) > indexOf(root, blocks[2]), "次轮行族居次轮内容之前")
    // 后续帧：零漂（对齐步复核 —— DOM ≡ visible 零破）
    const s2 = { ...s1, blocks: [...s1.blocks, { kind: "assistant", text: "新", idx: 50 }] }
    const m2 = frame(root, s1, s2, m1.mounted)
    assert.equal(rowsOf(root)[0], rows[0], "后续帧：行族同节点存续（零重座）")
    assert.ok(indexOf(root, blocksOf(root)[1]) < indexOf(root, rowsOf(root)[0]), "后续帧：归档块仍居行族之前（零漂）")
    assert.equal(m2.length, 5, "块记账随帧（DOM ≡ visible）")
    // 4c 负控：非消费轮归档（轮终态后另有块记录）⇒ 不配对（原位即记录位次）
    const record = {
      ok: true,
      messages: [
        { kind: "digest", status: "start", n: 1, tier: null, idx: 20 },
        { kind: "digest", status: "end", ok: true, ms: 100, idx: 21 },
        { kind: "assistant", text: "回合内", idx: 22, timestamp: 1 },
        { kind: "subagent", meta: { ...SUB_META }, rows: [], idx: 23 },
      ],
      hasOlder: false, next: null, meta: {}, flags: null, queue: null,
    }
    const s3 = pageRead.applyPage(pageState, record, { key: KEY, before: null })
    assert.equal(s3.blocks[0].text, "回合内", "非消费轮归档：原位（不前移）")
    assert.equal(s3.blocks[1].kind, "subagent", "非消费轮归档居记录位次")
  })

  // 4d ∥ 4e 保留面（#738 —— 窗下界 ∥ 未标块不作锚）：低于窗下界 ⇒ 零插入；无合格锚 ⇒ 落尾
  await withFakeDom(async () => {
    zh()
    const deep = { kind: "assistant", text: "深", at: 3712 }
    const live = { kind: "assistant", text: "活" }
    const old = { status: "end", ok: true, ms: 500, n: 1, at: 50 }
    // 4d 低于窗下界（首枚已标块位次之上）⇒ 不进树（零插入）
    const root1 = new FakeNode("div")
    root1.__connected = true
    mount(root1, baseState({ blocks: [live, deep], digest: { [KEY]: [{ ...old }] } }))
    assert.equal(rowsOf(root1).length, 0, "低于窗下界 ⇒ 零插入（绝不插流首）")
    // 4e 无合格锚（己位次段皆未标）⇒ 落尾组锚（不插首枚未标块之前）
    const head = { kind: "assistant", text: "前", at: 100 }
    const sub = { kind: "subagent", meta: { ...SUB_META }, rows: [] }
    const tail = { kind: "assistant", text: "后" }
    const root2 = new FakeNode("div")
    root2.__connected = true
    const m2 = mount(root2, baseState({ blocks: [head, sub, tail] }))
    const s2 = { ...baseState({ blocks: [head, sub, tail] }), digest: { [KEY]: [{ ...old, at: 500 }] } }
    frame(root2, baseState({ blocks: [head, sub, tail] }), s2, m2.mounted)
    const blocks2 = blocksOf(root2)
    assert.ok(rowsOf(root2).length > 0, "4e 在位")
    assert.ok(indexOf(root2, rowsOf(root2)[0]) > indexOf(root2, blocks2[blocks2.length - 1]), "4e 落尾（不落中段）")
  })

  // 4f ∥ 4g 屏代归一（#747 —— 座次 = 模型序锚）：首屏整置 ⇒ 重锚新模型尾 + 边界清（清屏即清）；回填 ⇒ 座次后移
  const live = { status: "start", n: 1, tier: null, seat: 1, rid: 1, boundary: true }
  const keep = (over = {}) => ({ activeSession: KEY, blocks: [{ kind: "assistant", text: "前" }], digest: { [KEY]: [live] }, stopMark: {}, timerNotice: {}, compress: {}, sessionMeta: {}, following: false, pendingNew: 0, ...over })
  const msg = (text, idx) => ({ kind: "assistant", text, idx, timestamp: 1 })
  // 4f 首屏：保留的未结末轮 ⇒ 座次重锚 = 新模型尾（2）+ 边界清
  const first = pageRead.applyPage(keep(), { ok: true, messages: [msg("一", 1), msg("二", 2)], hasOlder: false, next: null, meta: {}, flags: null, queue: null }, { key: KEY, before: null })
  assert.equal(first.digest[KEY].length, 1, "首屏：未结末轮保（切片清点）")
  assert.equal(first.digest[KEY][0].seat, 2, "首屏：座次重锚 = 新模型尾（行族现位）")
  assert.equal(first.digest[KEY][0].boundary, false, "首屏：边界清（清屏即清）")
  // 4g 回填：前插枚数使座次后移（1 ⇒ 3）
  const back = pageRead.applyPage(keep(), { ok: true, messages: [msg("旧一", 1), msg("旧二", 2)], hasOlder: true, next: 7, meta: {}, flags: null, queue: null }, { key: KEY, before: 5 })
  assert.equal(back.digest[KEY][0].seat, 3, "回填：座次后移（并入枚数——模型序锚随前插）")
  assert.equal(back.digest[KEY][0].boundary, true, "回填：边界不动（屏代未换）")
})
