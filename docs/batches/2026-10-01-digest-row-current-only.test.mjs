/**
 * 2026-10-01-digest-row-current-only.test.mjs — 批次本地单元件（台账 #754 · 消化行只留当轮收正批 · 实施轮）·
 * ⚠ 断代（2026-10-01 · 台账 #765 拆批）：import 断——`views/chat-digest-seat.mjs` 已删；复跑必红为预期（留档对照 · 勿复跑）。
 * 任务书 = `docs/batches/2026-10-01-digest-row-current-only.md` §2 ∥ §四（判据载体 = `docs/desktop/design/PROJECT.md`
 * §7「消化行只留当轮收正批注」八腿）。
 * 八腿：1 **多轮串行换代**（新轮起跑 ⇒ 旧轮行族退场——DOM 摘除 ∥ 在场上限 1）
 *      2 **终态形态**（非 ask 标签行退场 ∥ ask 保留 ∥ 计数行终态文 ∥ cap 跨 `end` 存续）
 *      3 **记录复列**（`foldDigest` 末条 ∥ 合并 ≤ 1 ∥ 截断闸 ∥ 屏代归一）
 *      4 **落位取面**（边界行 = 族末元素（计数行）＋归档块居其后——假 DOM 文档序 [行族][块]）
 *      5 **起跑窗**（`done` 先于回合执行 ∥ 幂等零增）
 *      6 **闪现三修**（毕业出集 ∥ 算不中零搬 ∥ 兜底带序）
 *      7 **记录面零动负向锁**（显示面只留当轮 ∥ 轮事件全量出帧不变 ∥ 清点未结末轮保）
 *      8 归约全替 + `rid` 单调
 * 随批留存 · 不进仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：node --test docs/batches/2026-10-01-digest-row-current-only.test.mjs
 * 纪律：行为断言优先（真归约体 ∥ 真帧路 ∥ 真驱动装配）；真机一条 = 父侧闭合（D16 义务）——本档只落机检面。
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

const [wake, pageRead, i18n, i18nCore, seat, subagentReduce, driveMod, chat, chatModel, chatStream, digest] = await Promise.all([
  mod("thincoder-desktop/renderer/events-wake.mjs"), // `ev:digest` ∥ `ev:susp` 归约（全替 ∥ 座次 ∥ 边界）
  mod("thincoder-desktop/renderer/page-read.mjs"), // 页读径（foldDigest 末条 ∥ 合并 ≤1）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-desktop/renderer/views/chat-digest-seat.mjs"), // 行集 ∥ 座次 ∥ 位次面
  mod("thincoder-desktop/renderer/subagent-reduce.mjs"), // 子 agent 归约径（座次入模）
  mod("thincoder-desktop/src/main/suspension-drive.mjs"), // 挂起驱动（起跑窗）
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 挂载 ∥ 帧尾（真路）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型
  mod("thincoder-desktop/renderer/views/chat-stream.mjs"), // 对齐步
  mod("thincoder-desktop/renderer/views/chat-digest.mjs"), // 行族帧面（摘除扫 ∥ 边界行 ∥ 座次三修）
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

// ─── 假 DOM（属性 ∕ 选择器 ∕ 结构 —— 沿 `2026-09-30-triple-end-digest-unify.test.mjs` 先例）──────────

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
  addEventListener() {}
  removeEventListener() {}
  append(...nodes) {
    for (const node of nodes) {
      const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
      if (child.parentNode !== null) child.parentNode.removeChild(child)
      child.parentNode = this
      this.childNodes.push(child)
    }
  }
  appendChild(node) { this.append(node); return node }
  prepend(...nodes) { for (const node of [...nodes].reverse()) this.insertBefore(node, this.childNodes[0] ?? null) }
  insertBefore(node, ref) {
    const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
    if (child.parentNode !== null) child.parentNode.removeChild(child)
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
  remove() { if (this.parentNode !== null) this.parentNode.removeChild(this) }
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

function matchesSegment(node, sel) {
  if (sel.startsWith(".")) return String(node.getAttribute("class") ?? "").split(/\s+/).includes(sel.slice(1))
  if (/^[a-zA-Z][\w-]*$/.test(sel)) return node.tagName === sel.toUpperCase()
  const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(sel)
  if (m === null) return false
  const value = node.getAttribute(m[1])
  if (value === null) return false
  return m[2] === undefined || value === m[2]
}
function select(node, sel) { return String(sel).split(",").some((part) => selectOne(node, part.trim())) }
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

// ─── 场景脚手架（真路：mountChat ∥ settleFrame）────────────────

const SCROLL = { readMetrics: () => ({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }) }
const SUB_META = { key: "sub:explore#1", label: "sub:explore#1", role: "explore", id: 1, pool: true, status: "done", frozen: true, startedAt: 0, doneAt: 1500 }

const baseState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, subBlocks: {},
  pool: { running: 0, approval: 0, queue: [], approvals: [] },
  following: true, pendingNew: 0, history: {}, project: { cwd: "/p" }, ...over,
})
const rowsOf = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-digest") !== null)
const blocksOf = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-block-kind") !== null)
const indexOf = (root, node) => root.childNodes.indexOf(node)
const mount = (root, state, limit) => chat.mountChat(root, state, {}, limit)
const modelOf = (state) => chatModel.chatModel(state)
/** 真帧路（镜像 `renderer/app.mjs` `paintChat`：帧前判据 ⇒ 对齐步 ⇒ 帧尾六步；`align.ok` 断言 = 硬化「腿断言 ⇒ 真径」链）。 */
const frame = (root, prev, next, mounted = []) => {
  const plan = chatStream.paintPlan({ prev, next, changedKeys: [] })
  const model = modelOf(next)
  const tailExempt = plan.tier === "patch" || plan.tier === "patch-append" ? plan.tier : false
  const align = chatStream.alignPlan(mounted, model.blocks, tailExempt, plan.appended ?? 0)
  assert.equal(align.ok, true, "对齐步成立（ok 假 ⇒ 真路走重挂径 —— 本件只断言增量径）")
  return chat.settleFrame(root, model, SCROLL, align, plan.tier, {}, mounted)
}
const liveRound = (over = {}) => ({ status: "start", n: 2, tier: null, seat: 0, rid: 1, boundary: true, ...over })

// ─── 腿 1 ∥ 腿 8：多轮串行换代 ∥ 归约全替 + `rid` 单调 ────────────────────────────

test("腿 8·归约全替 + `rid` 单调：`start` 切片 = [本轮]；`rid` 跨轮递增；`cap` ∥ `end` 就末轮", () => {
  let state = { digest: {}, blocks: [] }
  state = wake.onDigest(state, { key: KEY, status: "start", n: 2 })
  const r1 = state.digest[KEY][0]
  assert.equal(state.digest[KEY].length, 1, "首轮：切片 = [本轮]")
  assert.equal(r1.rid, 1, "轮序标自 1 起")
  assert.equal(r1.seat, 0, "座次 = 起跑水位（空模型 ⇒ 0）")
  assert.equal(r1.boundary, true, "边界标 = 本轮（`ev:digest start` 设）")
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 900 })
  state = { ...state, blocks: [{ kind: "assistant", text: "轮内" }] }
  state = wake.onDigest(state, { key: KEY, status: "start", n: 1 })
  assert.equal(state.digest[KEY].length, 1, "全替：切片恒 1（旧轮**出模型**——真不留）")
  assert.equal(state.digest[KEY][0].status, "start", "在场 = 本轮（起跑态）")
  assert.equal(state.digest[KEY][0].rid, 2, "`rid` 单调保续（替换前算）")
  assert.equal(state.digest[KEY][0].seat, 1, "座次 = 第二轮起跑水位（1 块已在流）")
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 800 })
  state = wake.onDigest(state, { key: KEY, status: "cap", mode: "stop", turns: 2 })
  assert.equal(state.digest[KEY].length, 1, "`cap` 就末轮更新（零新轮）")
  assert.equal(state.digest[KEY][0].cap.mode, "stop", "撞帽事实就末轮")
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 700 })
  assert.equal(state.digest[KEY][0].status, "end", "终态就末轮")
  assert.deepEqual(state.digest[KEY][0].cap, { mode: "stop", turns: 2 }, "cap 事实跨 `end` 存续")
  // 旧轮湮灭面（真不留）：末轮替换 ⇒ 前轮对象零留存（切片单元素）
  state = wake.onDigest(state, { key: KEY, status: "start", n: 3 })
  assert.equal(state.digest[KEY].length, 1, "连续换代：切片恒 1")
  assert.equal(state.digest[KEY][0].rid, 3, "`rid` 三连递增")
})

test("腿 1·多轮串行换代（DOM）：新轮起跑 ⇒ 旧轮行族退场（摘除 ∥ 在场上限 1）", async () => {
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const b0 = { kind: "assistant", text: "轮内前", id: "c1" }
    const r1 = liveRound({ seat: 0, rid: 1 })
    const s1 = baseState({ blocks: [b0], digest: { [KEY]: [r1] } })
    const m1 = mount(root, s1)
    const firstRows = rowsOf(root)
    assert.equal(firstRows.length, 2, "首轮行族 = 标签行 + 计数行（无轮容器）")
    const s2 = baseState({ blocks: [b0], digest: { [KEY]: [liveRound({ seat: 1, rid: 2 })] } })
    const m2 = frame(root, s1, s2, m1.mounted)
    const rows = rowsOf(root)
    assert.equal(rows.length, 2, "换代后在场 = 1 轮行族（2 行）")
    assert.ok(rows.every((node) => node._digestRid === 2), "在场行全属本轮（rid 2）")
    assert.equal(firstRows[0].parentNode, null, "旧轮标签行已摘除（零节点——真摘除）")
    assert.equal(firstRows[1].parentNode, null, "旧轮计数行已摘除")
    assert.equal(rows[0], rowsOf(root)[0], "行族节点存续（幂等同节点）")
    assert.notEqual(rows[0], firstRows[0], "新旧行族元素互异（旧族退场）")
    const m3 = frame(root, s2, s2, m2)
    assert.equal(rowsOf(root)[0], rows[0], "零动作帧：行族同节点存续（幂等）")
    assert.equal(m3.length, 1, "块记账随帧")
  })
})

// ─── 腿 2：终态形态（非 ask 标签退场 ∥ ask 保留 ∥ 计数行终态文）────────────────────

test("腿 2·终态形态：非 ask 标签行退场；ask 保留；计数行就地换文；cap 跨 `end` 存续", async () => {
  // 2a 构树面（纯函数）：`digestRows` 行集随 `status`
  const terminal = { status: "end", ok: true, ms: 1200, n: 2, tier: null, seat: 0, rid: 1, boundary: true }
  assert.equal(seat.digestRows(terminal).length, 1, "终态非 ask：行集 = [计数行]（标签行退场）")
  assert.ok(seat.digestRows(terminal)[0].props["data-digest-count"] !== undefined, "唯一行 = 计数行")
  const askTerminal = { ...terminal, tier: "ask", from: "a", msg: "b" }
  assert.equal(seat.digestRows(askTerminal).length, 2, "ask 档终态：标签行保留（本轮独有信息）")
  const n0 = { ...terminal, n: 0, ok: false }
  assert.equal(seat.digestRows(n0).length, 0, "`n = 0` 终态非 ask：零行（无计数行、标签已退场）")
  const capped = { ...terminal, cap: { mode: "auto", turns: 3 } }
  assert.equal(seat.digestRows(capped).length, 2, "cap 行跨 `end` 存续（族内）")

  // 2b DOM 面：终态帧 ⇒ 标签行摘除 ∥ 计数行同节点换文 ∥ cap 行在场
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const b0 = { kind: "assistant", text: "轮内", id: "k1" }
    const live = liveRound({ seat: 0, rid: 1 })
    const s1 = baseState({ blocks: [b0], digest: { [KEY]: [live] } })
    const m1 = mount(root, s1)
    const label = rowsOf(root)[0]
    const count = rowsOf(root)[1]
    assert.notEqual(label, undefined, "起跑：标签行在场")
    assert.ok(count.getAttribute("data-digest-count") !== null, "起跑：计数行在场")
    const s2 = baseState({ blocks: [b0], digest: { [KEY]: [terminal] } })
    const m2 = frame(root, s1, s2, m1.mounted)
    const rows = rowsOf(root)
    assert.equal(rows.length, 1, "终态非 ask：在场行 = 1（标签行退场）")
    assert.equal(label.parentNode, null, "标签行已摘除（零节点）")
    assert.equal(rows[0], count, "计数行同节点存续（就地换文）")
    assert.ok(count.getAttribute("class").includes("digest-done"), "终态文 class = digest-done")
    assert.ok(count.textContent.includes("2"), "终态文携起跑数")
    // 失败终态：同节点换 class
    const aborted = { ...terminal, ok: false, ms: 700 }
    const m3 = frame(root, s2, baseState({ blocks: [b0], digest: { [KEY]: [aborted] } }), m2)
    assert.ok(count.getAttribute("class").includes("digest-failed"), "失败终态 = digest-failed（同一计数行）")
    assert.equal(rowsOf(root).length, 1, "失败终态：仍只计数行（零标签回插）")
    // ask 档终态：标签行保留
    const askLive = liveRound({ seat: 0, rid: 9, tier: "ask", from: "x", msg: "y" })
    const s4 = baseState({ blocks: [b0], digest: { [KEY]: [askLive] } })
    const m4 = frame(root, baseState({ blocks: [b0], digest: { [KEY]: [aborted] } }), s4, m3)
    assert.equal(rowsOf(root).length, 2, "ask 轮起跑：标签行 + 计数行")
    const askLabel = rowsOf(root)[0]
    const s5 = baseState({ blocks: [b0], digest: { [KEY]: [{ ...askLive, status: "end", ok: true, ms: 500 }] } })
    frame(root, s4, s5, m4)
    assert.equal(rowsOf(root)[0], askLabel, "ask 档终态：标签行保留（同节点）")
    assert.equal(rowsOf(root).length, 2, "ask 档终态：两行共存")
  })
})

// ─── 腿 3：记录复列（`foldDigest` 末条 ∥ 合并 ≤ 1 ∥ 截断闸）──────────────────────

test("腿 3·记录复列：`foldDigest` 末条 ∥ `withFoldedDigest` 合并 ≤ 1 ∥ 截断闸 ∥ 屏代归一", async () => {
  const receipt = {
    ok: true,
    messages: [
      { kind: "assistant", text: "前", idx: 10, timestamp: 1 },
      { kind: "digest", status: "start", n: 2, tier: null, idx: 20 },
      { kind: "assistant", text: "轮内一", idx: 21, timestamp: 2 },
      { kind: "digest", status: "end", ok: true, ms: 500, idx: 22 },
      { kind: "digest", status: "start", n: 1, tier: null, idx: 30 },
      { kind: "assistant", text: "内容A", idx: 32, timestamp: 3 },
      { kind: "digest", status: "end", ok: true, ms: 800, idx: 34 },
      { kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "行" }], idx: 36 },
      { kind: "assistant", text: "后", idx: 40, timestamp: 4 },
    ],
    hasOlder: false, next: null, meta: {}, flags: null, queue: null,
  }
  const pageState = { activeSession: KEY, blocks: [], digest: {}, stopMark: {}, timerNotice: {}, compress: {}, sessionMeta: {}, following: false, pendingNew: 0 }
  const s1 = pageRead.applyPage(pageState, receipt, { key: KEY, before: null })
  assert.equal(s1.digest[KEY].length, 1, "复列最新一条：页内两完整轮 ⇒ 只产末条")
  assert.equal(s1.digest[KEY][0].at, 30, "末条 = 第二轮（位次 = 其起跑记录 idx）")
  assert.equal(s1.digest[KEY][0].endAt, 34, "末条携终态位次（消费轮配对读面）")
  assert.equal(s1.digest[KEY][0].boundary, undefined, "折出轮零携运行期标（boundary ∥ seat）")
  assert.equal(s1.blocks[0].text, "前", "块序：首位块零动")
  assert.equal(s1.blocks[1].text, "轮内一", "首轮内容（其轮不在折出集 —— 原位即记录位次）")
  assert.equal(s1.blocks[2].kind, "subagent", "末轮消费轮配对：归档块前移至其消费轮内内容之前（座次位）")
  assert.equal(s1.blocks[3].text, "内容A", "该轮内容居其下")
  assert.equal(s1.blocks[4].text, "后", "轮后块原位")

  // 3b 合并 ≤ 1：现轮集非空 ⇒ 原样（零写）；空 ⇒ 采折叠最新
  const keep = { activeSession: KEY, blocks: [{ kind: "assistant", text: "前" }], digest: { [KEY]: [liveRound({ seat: 1, rid: 1 })] }, stopMark: {}, timerNotice: {}, compress: {}, sessionMeta: {}, following: false, pendingNew: 0 }
  const back = pageRead.applyPage(keep, { ok: true, messages: [{ kind: "digest", status: "start", n: 1, tier: null, idx: 30 }, { kind: "digest", status: "end", ok: true, ms: 800, idx: 34 }], hasOlder: true, next: 7, meta: {}, flags: null, queue: null }, { key: KEY, before: 5 })
  assert.equal(back.digest[KEY].length, 1, "合并 ≤ 1：现轮集非空 ⇒ 原样（不并入折叠轮）")
  assert.equal(back.digest[KEY][0].rid, 1, "现轮集原引用存续（运行期轮优先）")
  const empty = { ...keep, digest: {} }
  const back2 = pageRead.applyPage(empty, { ok: true, messages: [{ kind: "digest", status: "start", n: 1, tier: null, idx: 30 }, { kind: "digest", status: "end", ok: true, ms: 800, idx: 34 }], hasOlder: true, next: 7, meta: {}, flags: null, queue: null }, { key: KEY, before: 5 })
  assert.equal(back2.digest[KEY].length, 1, "现轮集空 ⇒ 采折叠最新（恰 1）")
  assert.equal(back2.digest[KEY][0].at, 30, "采入者 = 折叠末条")

  // 3c 截断闸：起跑未载（跨页）⇒ 该轮本页零产
  const truncated = { ok: true, messages: [{ kind: "digest", status: "end", ok: true, ms: 100, idx: 40 }], hasOlder: false, next: null, meta: {}, flags: null, queue: null }
  const s3 = pageRead.applyPage(pageState, truncated, { key: KEY, before: null })
  assert.equal(s3.digest[KEY], undefined, "截断闸：起跑未载 ⇒ 零产（零并轮零借位）")

  // 3d 屏代归一（保留面）：首屏未结末轮 ⇒ 座次重锚新模型尾 + 边界清
  const first = pageRead.applyPage(keep, { ok: true, messages: [{ kind: "assistant", text: "一", idx: 1 }, { kind: "assistant", text: "二", idx: 2 }], hasOlder: false, next: null, meta: {}, flags: null, queue: null }, { key: KEY, before: null })
  assert.equal(first.digest[KEY].length, 1, "首屏：未结末轮保（清点）")
  assert.equal(first.digest[KEY][0].seat, 2, "首屏：座次重锚 = 新模型尾")
  assert.equal(first.digest[KEY][0].boundary, false, "首屏：边界清（清屏即清）")

  // 3e 重建文档序（本批翻转）：[行族][归档块][轮内后产块]——末条轮为终态非 ask ⇒ 行族 = 计数行一条
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    mount(root, s1)
    const rows = rowsOf(root)
    const blocks = blocksOf(root)
    assert.equal(rows.length, 1, "重建：末条轮行族在场（终态非 ask ⇒ 仅计数行）")
    assert.ok(rows[0].getAttribute("data-digest-count") !== null, "重建行 = 计数行（标签行已退场）")
    assert.ok(indexOf(root, rows[0]) < indexOf(root, blocks[2]), "复列镜式：归档块居其消费轮行族**之后**（本批翻转）")
    assert.ok(indexOf(root, blocks[2]) < indexOf(root, blocks[3]), "归档块仍居该轮内容之前（座次位）")
  })
})

// ─── 腿 4：落位取面（边界行 = 族末元素（计数行）＋归档块居其后）────────────────────

test("腿 4·落位取面：边界行 = 计数行（族末）；归档块居其后（文档序 [行族][块]）；失效退化", async () => {
  const b0 = { kind: "assistant", text: "前" }
  const b1 = { kind: "assistant", text: "后" }
  let state = baseState({ blocks: [b0] })
  state = wake.onDigest(state, { key: KEY, status: "start", n: 1 })
  state = { ...state, blocks: [b0, b1] }
  state = subagentReduce.onSubagent(state, { key: KEY, role: "subagent", id: 7, status: "started" }, 0)
  state = subagentReduce.onSubagent(state, { key: KEY, role: "subagent", id: 7, status: "settled" }, 0)
  assert.equal(state.subBlocks[KEY][0].awaitingDigest, true, "settled ⇒ 等待消化态（起跑窗消费对象）")
  const archived = subagentReduce.onSubagent(state, { key: KEY, role: "subagent", id: 7, status: "done" }, 0)
  assert.equal(archived.blocks[1].kind, "subagent", "归档块入模（座次位——居轮内后产块之前）")
  assert.equal(archived.blocks[1].seat, 1, "座次段标（流内副本）")

  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const round = archived.digest[KEY][0] // 带边界标
    const s1 = baseState({ blocks: [b0], digest: { [KEY]: [round] } })
    const m1 = mount(root, s1)
    const s2 = { ...s1, blocks: [b0, b1] }
    const m2 = frame(root, s1, s2, m1.mounted)
    const s3 = { ...s2, blocks: archived.blocks }
    const m3 = frame(root, s2, s3, m2)
    const rows = rowsOf(root)
    const blocks = blocksOf(root)
    assert.equal(blocks.length, 3, "块三枚（对齐步记账不破）")
    assert.equal(rows.length, 2, "行族在场（标签 + 计数）")
    assert.equal(rows[rows.length - 1].getAttribute("data-digest-count") !== null, true, "族末元素 = 计数行")
    assert.equal(digest.boundaryRowOf(root, modelOf(s3)), rows[rows.length - 1], "边界行取面 = 计数行（本批翻转）")
    assert.ok(indexOf(root, blocks[1]) < indexOf(root, blocks[2]), "序 = [前][归档块]")
    assert.ok(indexOf(root, rows[rows.length - 1]) < indexOf(root, blocks[1]), "归档块居消费行族之后（[行族][块]）")
    assert.ok(indexOf(root, rows[0]) < indexOf(root, rows[1]), "族内序 = 标签 → 计数")
    // 插入点取面（本批）：边界之后 = 已归档块之后（逐枚落于前枚之后）
    const point = digest.archiveInsertPointOf(root, modelOf(s3))
    assert.equal(point.ref, blocksOf(root)[2], "二次落位插点 = 已归档块之后（到达序——不逆向）")
    // 4b 终态非 ask（标签退场）⇒ 边界行 = 计数行（同取面）
    const terminal = { ...round, status: "end", ok: true, ms: 500 }
    const m4 = frame(root, s3, { ...s3, digest: { [KEY]: [terminal] } }, m3)
    const rows2 = rowsOf(root)
    assert.equal(digest.boundaryRowOf(root, modelOf({ ...s3, digest: { [KEY]: [terminal] } })), rows2[rows2.length - 1], "终态径：边界行 = 计数行（零 null 退化）")
    assert.ok(indexOf(root, rows2[rows2.length - 1]) < indexOf(root, blocksOf(root)[1]), "终态径：归档块仍居行族之后")
    // 4c 边界失效（`ev:susp` 收帧清）⇒ 常规块插入点退化
    const sealed = wake.onSusp({ ...s3, digest: { [KEY]: [terminal] } }, { key: KEY, active: true, running: 0, queued: 0, pending: 0, done: 0 }, 0)
    assert.equal(sealed.digest[KEY][0].boundary, false, "收帧清边界")
    assert.equal(digest.boundaryRowOf(root, modelOf(sealed)), null, "边界失效 ⇒ 取面 null（调用面退化常规块插入点）")
    assert.equal(digest.archiveInsertPointOf(root, modelOf(sealed)), null, "失效 ⇒ 插点面 null（同一判据）")
    const late = { kind: "subagent", meta: { ...SUB_META }, rows: [] }
    const m5 = frame(root, { ...s3, digest: { [KEY]: [terminal] } }, { ...sealed, blocks: [...sealed.blocks, late] }, m4)
    const lateNode = blocksOf(root)[blocksOf(root).length - 1]
    assert.equal(lateNode.getAttribute("data-block-kind"), "subagent", "迟来 done ⇒ 归档块尾追退化（仍在场）")
    assert.ok(indexOf(root, lateNode) > indexOf(root, rowsOf(root)[rowsOf(root).length - 1]), "尾追退化：块居行族之后（恰合本批序）")
    void m5
  })
})

// ─── 腿 5：起跑窗（`done` 先于回合执行 ∥ 幂等零增）─────────────────────────────

test("腿 5·起跑窗：起跑点逐条补发 `done`（先于回合执行）；重复 `done` 幂等零增", async () => {
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
  assert.ok(startAt < doneAt, "边界帧先于补发")
  assert.ok(doneAt < runAt, "**起跑窗**：补发先于回合执行（本批 2026-10-01 复位——起跑点 = 主面）")
  assert.deepEqual(log[startAt].payload, { key: KEY, status: "start", n: 2 }, "起跑帧（n = 起跑 pending 数 —— 含 consult 条目）")
  assert.ok(log.every((row) => !(row.ch === "ev:subagent" && row.payload?.role === "consult")), "会话本体（consult）零补发（子块各自 settle —— 与两端同判）")
  const firstDoneCount = log.filter((row) => row.type === "post" && row.ch === "ev:subagent" && row.payload.status === "done").length
  assert.equal(firstDoneCount, 1, "起跑快照 = 1 可补发条目（entry；consult 跳过）⇒ 恰一发")
  // reclaim 兜底：消费后条目不在 pending ⇒ 再发一枚（幂等由渲染面承担）——补发不收口（起跑窗漏口 ∥ 迟结算面）
  await until(() => log.filter((row) => row.type === "post" && row.ch === "ev:subagent" && row.payload.status === "done").length >= 2)
  const second = log.filter((row) => row.type === "post" && row.ch === "ev:subagent" && row.payload.status === "done")
  assert.equal(second.length, 2, "reclaim = 兜底幂等面（补发一次；同一条目）")
  assert.deepEqual(second[0].payload, second[1].payload, "两发同形同键（渲染面 `drop-frozen` ∥ 已归档 ⇒ 幂等零增）")

  // 5b 幂等零增（渲染面负控）：同一 `done` 二次到达 ⇒ 零新块
  let st = baseState({ blocks: [{ kind: "assistant", text: "前" }] })
  st = wake.onDigest(st, { key: KEY, status: "start", n: 1 })
  st = subagentReduce.onSubagent(st, { key: KEY, role: "subagent", id: 7, status: "started" }, 0)
  st = subagentReduce.onSubagent(st, { key: KEY, role: "subagent", id: 7, status: "settled" }, 0)
  const once = subagentReduce.onSubagent(st, { key: KEY, role: "subagent", id: 7, status: "done" }, 0)
  const blocksOnce = once.blocks.length
  const twice = subagentReduce.onSubagent(once, { key: KEY, role: "subagent", id: 7, status: "done" }, 0)
  assert.equal(twice.blocks.length, blocksOnce, "重复 `done`：零新块（幂等零增）")
  assert.equal(twice.blocks.filter((block) => block.kind === "subagent").length, 1, "归档块恒一枚（不双份）")
})

// ─── 腿 6：闪现三修（毕业出集 ∥ 算不中零搬 ∥ 兜底带序）──────────────────────────

test("腿 6·闪现三修：毕业出集（落位后零重排）∥ 算不中零搬 ∥ 兜底带序（多轮禁同点）", async () => {
  await withFakeDom(async () => {
    zh()
    // 6a 毕业出集：行族落位完成同拍写毕业标 ⇒ 后续帧零重排（trim 帧不再拔插）
    const root = new FakeNode("div")
    root.__connected = true
    const blk = { kind: "assistant", text: "座次块" }
    const round = liveRound({ n: 1, seat: 0, rid: 1 }) // 座次 0 = 首块之前 ⇒ 行族应搬至块前
    const s1 = baseState({ blocks: [blk], digest: { [KEY]: [round] } })
    const m1 = mount(root, s1)
    const rows = rowsOf(root)
    assert.ok(indexOf(root, rows[0]) > indexOf(root, blocksOf(root)[0]), "起稿：行族居块之后（树序 —— 待座次落位）")
    const plan1 = chatStream.paintPlan({ prev: s1, next: s1, changedKeys: [] })
    const model1 = modelOf(s1)
    const m2 = chat.settleFrame(root, model1, SCROLL, chatStream.alignPlan(m1.mounted, model1.blocks, false, 0), plan1.tier, {}, m1.mounted)
    assert.ok(indexOf(root, rows[0]) < indexOf(root, blocksOf(root)[0]), "落位帧：行族搬至座次（块前）")
    // 二帧（零动作）：落位完成 ⇒ 同拍写毕业标
    const m2b = chat.settleFrame(root, model1, SCROLL, chatStream.alignPlan(m2, model1.blocks, false, 0), plan1.tier, {}, m2)
    assert.equal(rows[0]._digestGraduated, true, "毕业标 = 落位完成同拍写")
    assert.equal(rows[1]._digestGraduated, true, "族内逐行同拍（行族整体出运行集）")
    // trim 帧（窗口瞬变）：毕业 ⇒ 出运行集 ⇒ 零搬（同帧不同 hidden 亦零位移）
    const s3 = { ...s1, hidden: 1 }
    const before = indexOf(root, rows[0])
    const moved = digest.seatLiveRounds(root, modelOf(s3), null)
    assert.equal(moved, 0, "毕业出集：零搬（修① 消每帧重算）")
    assert.equal(indexOf(root, rows[0]), before, "零位移（元素未动）")
    void m2
  })

  await withFakeDom(async () => {
    zh()
    // 6b 算不中零搬：座次越窗（目标不可定）⇒ 零动作（禁兜尾组锚 ∕ 流末）
    const root = new FakeNode("div")
    root.__connected = true
    mount(root, baseState({ blocks: [], digest: {} }))
    const pill = new FakeNode("button")
    pill.setAttribute("data-pill", "")
    root.append(pill)
    const round = liveRound({ n: 1, seat: 9, rid: 1 })
    const state = baseState({ blocks: [], digest: { [KEY]: [round] } })
    const model = modelOf(state)
    digest.syncDigest(root, model, null)
    const rows = rowsOf(root)
    assert.equal(rows.length, 2, "行族已在流末（起跑帧落座次）")
    const at = indexOf(root, rows[0])
    assert.equal(digest.seatLiveRounds(root, model, pill), 0, "算不中（座次越界）⇒ 零搬（修②）")
    assert.equal(indexOf(root, rows[0]), at, "行族零位移（宁可不搬、不搬错）")
  })

  await withFakeDom(async () => {
    zh()
    // 6c 兜底带序：同帧两轮同目标 ⇒ 禁落同点（第二组错位其后）
    const root = new FakeNode("div")
    root.__connected = true
    const blk = { kind: "assistant", text: "块" }
    const s = baseState({ blocks: [blk], digest: {} })
    mount(root, s)
    const r1 = liveRound({ n: 1, seat: 0, rid: 1 }) // 两轮同座次且同目标（首块）⇒ 第二族须错位
    const r2 = liveRound({ n: 1, seat: 0, rid: 2 })
    const model = modelOf(baseState({ blocks: [blk], digest: { [KEY]: [r1, r2] } }))
    digest.syncDigest(root, model, null)
    const rows = rowsOf(root)
    for (const row of rows) { row.remove(); root.append(row) } // 两族皆置流末（待搬）
    const moved = digest.seatLiveRounds(root, model, null)
    assert.ok(moved >= 1, "至少一族实动")
    const family1 = rows.filter((node) => node._digestRid === 1)
    const family2 = rows.filter((node) => node._digestRid === 2)
    assert.equal(family1.length, 2, "轮 1 行族两行")
    assert.equal(family2.length, 2, "轮 2 行族两行")
    assert.notEqual(indexOf(root, family1[0]), indexOf(root, family2[0]), "两族禁落同点（修③——带序错位）")
  })
})

// ─── 腿 7：记录面零动负向锁（显示面只留当轮 ∥ 轮事件全量出帧 ∥ 清点未结末轮保）─────────

test("腿 7·记录面零动负向锁：三型轮记录全量出帧不变；显示面切片只留当轮；余切片零写", async () => {
  // 7a 三型轮事件全量出帧（记录面来源 = 同一事件流——零收窄）
  const log = []
  const agent = {
    title: "t", cwd: null, _slot: 1,
    _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _consultSessions: new Map(),
    _pendingAsyncResults: [{ role: "subagent", id: 1 }, { role: "subagent", id: 2 }],
    provider: { name: "vis", model: "m" }, config: { locale: "zh" }, memory: { db: null }, history: [], _fullHistory: [],
  }
  let runs = 0
  const drive = driveMod.createSuspensionDrive({
    post: (ch, payload) => log.push({ type: "post", ch, payload }),
    runTurn: (key, agent1) => {
      runs += 1
      agent1._pendingAsyncResults.splice(0, 1) // 每轮消费一条 ⇒ 恰两轮串行（三型轮多轮）
      return Promise.resolve()
    },
    timer: () => ({ unref() {} }), clear: () => {},
  })
  assert.equal(drive.start(KEY, agent, { cwd: "/p" }), true, "入窗")
  await until(() => log.filter((row) => row.type === "post" && row.ch === "ev:digest" && row.payload.status === "start").length >= 2)
  const digestFrames = log.filter((row) => row.type === "post" && row.ch === "ev:digest")
  const starts = digestFrames.filter((row) => row.payload.status === "start")
  assert.equal(starts.length, 2, "多轮串行：起跑帧逐轮全量（记录面零收窄）")
  assert.deepEqual(starts.map((row) => row.payload.n), [2, 1], "起跑数逐轮（n 面不变）")
  assert.deepEqual(starts.map((row) => row.payload.key), [KEY, KEY], "帧键面不变")
  // 轮事件面三型全量（记录面输入）：起跑帧面同点双动作未收窄（终态帧写点 = `turn-face.mjs` —— 本驱动面不产）
  assert.ok(log.every((row) => !(row.ch === "ev:digest" && row.payload.status === "end")), "终态帧不双发（写点单源 = `turn-face.mjs`）")

  // 7b 显示面切片只留当轮（与记录面分离）
  let st = { digest: {}, blocks: [] }
  st = wake.onDigest(st, { key: KEY, status: "start", n: 1 })
  st = wake.onDigest(st, { key: KEY, status: "end", ok: true, ms: 100 })
  const afterRound1 = { ...st }
  const otherKeys = Object.keys(afterRound1).filter((k) => k !== "digest")
  st = wake.onDigest(st, { key: KEY, status: "start", n: 2 })
  assert.equal(st.digest[KEY].length, 1, "显示面：切片恒 1（只留当轮）")
  assert.deepEqual(Object.keys(st).filter((k) => k !== "digest").sort(), otherKeys.sort(), "余切片零新增（键面零动）")
  assert.equal(st.blocks, afterRound1.blocks, "`blocks` 引用零动（归约面不触块面）")

  // 7c 切片清点：未结末轮保（`clearDigest` 现行规则）
  const slice = { [KEY]: [{ status: "start", rid: 1 }, { status: "end", rid: 2 }] }
  assert.equal(digest.clearDigest(slice, KEY)[KEY], undefined, "终态末轮 ⇒ 整清（保 0 —— 切片删键）")
  const open = { [KEY]: [{ status: "start", rid: 1 }] }
  assert.equal(digest.clearDigest(open, KEY), open, "未结末轮 ⇒ 原引用（保——零写）")
})
