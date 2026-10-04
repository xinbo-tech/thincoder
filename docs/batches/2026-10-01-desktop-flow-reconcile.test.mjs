/**
 * 2026-10-01-desktop-flow-reconcile.test.mjs — 批次本地单元件（台账 #764 · 桌面流面对账面重写（幻影机拔除）· 实施轮）·
 * 任务书 = `docs/batches/2026-10-01-desktop-flow-reconcile.md` §2 分块一–七 + 两修正块（**以修正块为准**）。
 * 六腿（腿集单源 = 批档 §2 分块六 + 修正块 1「腿 1 例表（修正后）」+ 修正块 2「号 8 · 缺口」+ 父侧「缺口-1」裁（本舱补记））：
 *   1 **结算纯件八例**（回填 ∥ 混帧两例已改指「`prepend` 已退场」——回填落位批 2026-10-04 收正）——append ∥ 回填（退场锁）∥ insert 中洞 ∥ cut 中段 ∥ build ∥ 刷判定 ∥ 混帧（随退场——本档删例）∥
 * **as-of 注（父侧 · 2026-10-04——回填落位批 #910 收口）**：腿 1b/1g/帧 4 已随 `prepend` 退场改指（回填径改用 build 整置）；面锚 ∥ 源断言 ∥ WRITES ∥ 作业点计数同拍收正。判据单源 = `docs/batches/2026-10-04-digest-reentry-order.md` §2。
 *     关页例（build 承 `none` 态：引导节点唯一子 —— 含 `session-wire` 真路）
 *   2 **同尺复测（全量换新 = 0）**——活动期观测窗：根 clear 零次 ∥ 同对象恒同节点（跨帧引用不变）∥ 块节点数 = 窗长
 *   3 **滚动补偿零回归**——贴底（跟滚写超值 ∥ 零读）∥ 补偿算式写值同式 ∥ 零动 ⇒ 零写
 *   4 **序 / 内容零回归**——块序 ≡ 模型窗逐位同对象 ∥ 文本族就地刷 ∥ 型变节点换 ∥ 构造径终态对拍
 *   5 **禁词 + 写点白名单**——射击面零命中（八词 + 词界 + 三豁免锚；历史批名不计面）∥ 结构写点全集 = `appendBlock` +
 *     四作业点（设计五处 − `insert` 作业点随 #765 座次支退场 —— 见件内注）
 *   6 **缺口-1 处置（退流清空）**——摘至零块 ⇒ 同笔并 `build`（真写点 `retractEcho`）⇒ `empty` 帧构造径 ⇒
 *     引导面在场；非空摘 ⇒ 只带 `cut`（对照）
 * 随批留存 · 不进仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：node --test docs/batches/2026-10-01-desktop-flow-reconcile.test.mjs
 * 纪律：行为断言优先（真结算件 ∥ 真帧路 ∥ 真装配）；真机一条 = 父侧闭合 —— 本档只落机检面。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（含 thincoder-core/）运行：cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

// 窄桥假件（`session-wire.mjs` 模块级取 host —— 关页真路腿消费）：须先于该档装载置位。
globalThis.thincoder = {
  async invoke(channel) {
    if (channel === "session:delete") return { ok: true }
    if (channel === "project:recent") return { cwd: "/p", recent: [] }
    if (channel === "sessions:list") return { sessions: [], ledger: null }
    return { ok: false, reason: `unexpected:${channel}` }
  },
}

const [stream, storeMod, events, chat, chatModel, chatTree, scrollMod, i18n, i18nCore, wireMod, composerWire] = await Promise.all([
  mod("thincoder-desktop/renderer/views/chat-stream.mjs"), // 结算纯件（blockKey ∥ flowStep）
  mod("thincoder-desktop/renderer/store.mjs"), // 状态树（flowOps 切片 ∥ withFlowOp ∥ appendBlock）
  mod("thincoder-desktop/renderer/events.mjs"), // 归约核心（openSession —— 关页）
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 挂载 ∥ 帧尾六步（真路）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型（窗出口）
  mod("thincoder-desktop/renderer/views/chat-tree.mjs"), // 构树面（none 态引导节点唯一子）
  mod("thincoder-desktop/renderer/views/chat-scroll.mjs"), // 补偿算式 ∥ 贴底 ∥ 窗限
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-desktop/renderer/session-wire.mjs"), // 会话族接线（关页真路：takeover 空列支）
  mod("thincoder-desktop/renderer/composer-wire.mjs"), // 输入区写面（退流真写点 —— `retractEcho`；腿 6）
])

const KEY = "1"
const zh = () => i18n.initDict({ locale: "zh", dict: i18nCore.projectDictionary("zh") })
const MAX = scrollMod.MAX_RENDER_BLOCKS

// ─── 假 DOM（属性 ∕ 选择器 ∕ 结构 —— 沿 `2026-10-01-desktop-digest-teardown.test.mjs` 先例）──────────

class FakeText {
  constructor(value) {
    this.textContent = String(value)
    this.parentNode = null
  }
  get nodeType() { return 3 }
  get ownerDocument() { return globalThis.document }
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
  get ownerDocument() { return globalThis.document }
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

/** 流根假件（比对追加两读数面）：`clears` = 根 clear 次数（**全量换新判据** —— 构造径唯一 clear 点）；
 *  `scrollWrites` = `scrollTop` 写入序（帧尾三写判据面 —— 写入原值，不做引擎鉗底投影）。 */
class FlowNode extends FakeNode {
  constructor(tag) {
    super(tag)
    this.clears = 0
    this.scrollWrites = []
  }
  set scrollTop(value) {
    this.scrollWrites.push(value)
    super.scrollTop = value
  }
  get scrollTop() { return super.scrollTop }
  replaceChildren(...nodes) {
    this.clears += 1
    super.replaceChildren(...nodes)
  }
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

// ─── 场景脚手架（真路：mountChat ∥ settleFrame；`drive` 镜像 `renderer/app.mjs` `paintChat` 两径）──

/** 账项（纯件面 —— node 只作引用槽）。 */
const ent = (block) => ({ node: { block, remove() {} }, block })

/** 帧态种子（镜像 app 侧帧时刻态：窗 ∥ 跟滚 ∥ 账载体）。 */
const seed = (over = {}) => ({
  locale: "zh", activeSession: KEY, blocks: [], flowOps: [],
  history: { hasOlder: false, inFlight: false, page: null },
  following: true, pendingNew: 0,
  digest: {}, timerNotice: {}, stopMark: {}, compress: {}, helpLines: {},
  project: { cwd: "/p" },
  pool: { running: 0, approval: 0, queue: [], approvals: [] },
  ...over,
})

const modelOf = (state, limit = MAX) => chatModel.chatModel(state, limit)

/** 帧驱动（镜像 `paintChat`：构造径（无账 ∥ 作业含 `build` ∥ 词面变）⇒ `mountChat`；否则 `settleFrame`）；
 *  返回 `{ account, constructed }`（`account` = 下帧账 —— `{ mounted, hidden }`）。 */
const drive = (root, prev, state, account = null, limit = MAX, scroll = null) => {
  const model = modelOf(state, limit)
  const ops = Array.isArray(state.flowOps) ? state.flowOps : []
  const construct = account === null || ops.some((op) => op?.kind === "build") || (prev !== null && state.locale !== prev.locale)
  if (construct) {
    const built = chat.mountChat(root, state, {}, limit)
    return { account: { mounted: built.mounted, hidden: model.hidden }, constructed: true }
  }
  const mounted = chat.settleFrame(root, model, scroll, {}, { mounted: account.mounted, hidden: account.hidden, ops })
  return { account: { mounted, hidden: model.hidden }, constructed: false }
}

/** 读数源（补偿腿：逐次读值可排 —— t0 ∥ t1）。 */
const scrollQueue = (values) => ({
  reads: 0,
  readMetrics() {
    const value = values[this.reads] ?? values[values.length - 1]
    this.reads += 1
    return { scrollTop: 0, scrollHeight: 0, clientHeight: 0, ...value }
  },
})

const blocksOf = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-block-kind") !== null)
const kindsOf = (root) => blocksOf(root).map((node) => node.getAttribute("data-block-kind"))
const seqOf = (root) => blocksOf(root).map((node) => [node.getAttribute("data-block-kind"), node.getAttribute("data-block-id"), node.querySelector("[data-raw]")?.getAttribute("data-raw") ?? null])
const indexIn = (root, node) => root.childNodes.indexOf(node)

// ─── 腿 1：结算纯件八例 ─────────────────────────────────────

test("腿 1·结算纯件八例：append ∥ 回填 ∥ insert 中洞 ∥ cut 中段 ∥ build ∥ 刷判定 ∥ 混帧 ∥ 关页例", async () => {
  const A = { kind: "assistant", text: "A" }
  const B = { kind: "assistant", text: "B" }
  const C = { kind: "assistant", text: "C" }
  const D = { kind: "assistant", text: "D" }
  const E = { kind: "assistant", text: "E" }

  // 1a append（追加零作业 —— 位次由账自明）
  {
    const account = { mounted: [ent(A), ent(B)], hidden: 0 }
    const plan = stream.flowStep({ account, model: { blocks: [A, B, C], hidden: 0 }, ops: [] })
    assert.deepEqual(plan.head, { drop: [], build: [] }, "append：头段零动")
    assert.equal(plan.drop.length + plan.refresh.length, 0, "append：零摘零刷")
    assert.equal(plan.build.length, 1, "append：恰一造项")
    assert.deepEqual([plan.build[0].index, plan.build[0].block, plan.build[0].before], [2, C, null], "append：窗位 2 ∥ 取值 model.blocks[pos] ∥ 尾插点")
  }

  // 1b 回填（`prepend` 已退场——回填落位批 2026-10-04：回填径改用 `build` 整置；回放支已删）
  {
    const P0 = { kind: "assistant", text: "P0" }
    const P1 = { kind: "assistant", text: "P1" }
    const account = { mounted: [ent(A), ent(B)], hidden: 0 }
    const plan = stream.flowStep({ account, model: { blocks: [P0, P1, A, B], hidden: 0 }, ops: [{ kind: "prepend", count: 2 }] })
    assert.deepEqual(plan.head.drop, [], "退场 op：零越位摘")
    assert.deepEqual(plan.head.build, [], "退场 op：零头段前插（`prepend` 回放支已删——零生产消费）")
  }

  // 1c insert 中洞（座次位 —— 类型在册；#765 后无生产写点，见腿 5 白名单）
  {
    const account = { mounted: [ent(A), ent(C)], hidden: 0 }
    const plan = stream.flowStep({ account, model: { blocks: [A, B, C], hidden: 0 }, ops: [{ kind: "insert", index: 1 }] })
    assert.deepEqual(plan.head, { drop: [], build: [] }, "中洞：头段零动（洞在保持段之内）")
    assert.equal(plan.build.length, 1, "中洞：就位一枚")
    assert.deepEqual([plan.build[0].index, plan.build[0].block], [1, B], "中洞：窗位 1 ∥ 取值 B")
    assert.equal(plan.build[0].before, account.mounted[1], "中洞：插点 = 其后首账项（C）")
    assert.equal(plan.drop.length + plan.refresh.length, 0, "中洞：零摘零刷")
  }

  // 1d cut 中段（退流摘 = 命中项按项摘）
  {
    const account = { mounted: [ent(A), ent(B), ent(C)], hidden: 0 }
    const plan = stream.flowStep({ account, model: { blocks: [A, C], hidden: 0 }, ops: [{ kind: "cut", index: 1 }] })
    assert.deepEqual(plan.drop, [account.mounted[1]], "cut：命中项按项入退货单")
    assert.equal(plan.build.length + plan.refresh.length, 0, "cut：零造零刷")
    assert.deepEqual(plan.head, { drop: [], build: [] }, "cut：头段零动")
  }

  // 1e build（整置 —— 账整清 + 窗位全造）
  {
    const X = { kind: "assistant", text: "X" }
    const Y = { kind: "assistant", text: "Y" }
    const Z = { kind: "assistant", text: "Z" }
    const account = { mounted: [ent(A), ent(B)], hidden: 0 }
    const plan = stream.flowStep({ account, model: { blocks: [X, Y, Z], hidden: 0 }, ops: [{ kind: "build" }] })
    assert.deepEqual(plan.head.drop, account.mounted, "build：账整清")
    assert.deepEqual(plan.head.build.map((item) => [item.index, item.block]), [[0, X], [1, Y], [2, Z]], "build：窗位全造")
    assert.equal(plan.drop.length + plan.build.length + plan.refresh.length, 0, "build：尾段零动")
  }

  // 1f 刷判定（留位且块对象变者 ⇒ 刷；同对象 ⇒ 零刷）
  {
    const A2 = { kind: "assistant", text: "A2" }
    const account = { mounted: [ent(A), ent(B)], hidden: 0 }
    const plan = stream.flowStep({ account, model: { blocks: [A2, B], hidden: 0 }, ops: [] })
    assert.equal(plan.refresh.length, 1, "刷判定：同位换对象 ⇒ 入刷单")
    assert.deepEqual([plan.refresh[0].index, plan.refresh[0].block, plan.refresh[0].entry], [0, A2, account.mounted[0]], "刷判定：窗位 ∥ 新块 ∥ 原账项")
    assert.equal(plan.build.length + plan.drop.length + plan.head.drop.length + plan.head.build.length, 0, "刷判定：余段零动")
    const same = stream.flowStep({ account, model: { blocks: [A, B], hidden: 0 }, ops: [] })
    assert.equal(same.refresh.length, 0, "刷判定：同位同对象 ⇒ 零刷")
  }

  // 1g 混帧（`prepend` + `cut` 同帧样本）——随 `prepend` 退场整删（回填落位批 2026-10-04：回填径改用 `build` 整置；累计回放样本不再可表）

  // 1h 关页例（build 承 none 态：引导节点唯一子 —— 纯件 ∩ 真路 ∩ 构树三面）
  {
    const closed = storeMod.withFlowOp(events.openSession(seed({ blocks: [A, B] }), null), { kind: "build" })
    assert.equal(closed.activeSession, null, "关页：页键落空")
    assert.deepEqual(closed.flowOps, [{ kind: "build" }], "关页：同笔带 build 作业（唯一写口）")
    const model = modelOf(closed)
    assert.equal(model.state, "none", "关页：none 态")
    assert.deepEqual(model.blocks, [], "关页：零块")
    const plan = stream.flowStep({ account: { mounted: [ent(A), ent(B)], hidden: 0 }, model, ops: closed.flowOps })
    assert.equal(plan.head.drop.length, 2, "关页：账整清")
    assert.deepEqual(plan.head.build, [], "关页：空窗 ⇒ 零造")
    const tree = chatTree.chatTree(model, {})
    assert.equal(tree.children.length, 1, "关页：none 态树 ⇒ 引导节点唯一子")
    assert.equal(tree.children[0].props["data-guide"], "no-session", "关页：引导码（项目在场 ⇒ no-session）")
    assert.equal(JSON.stringify(tree).includes("data-block-kind"), false, "关页：零块节点")
    // 真路：唯一会话删除 ⇒ `session-wire.mjs` 关页支（同笔作业）+ 构造径 ⇒ 引导节点唯一子
    const store = storeMod.store
    store.set({ ...storeMod.initialState(), activeSession: KEY, blocks: [A, B], sessions: [{ slot: 1, title: "t" }] })
    assert.equal(await wireMod.deleteSession(KEY), true, "删唯一会话：回执 ok ⇒ 接管出口成立")
    const after = store.get()
    assert.equal(after.activeSession, null, "删唯一会话：列表空 ⇒ 关页")
    assert.ok(after.flowOps.some((op) => op?.kind === "build"), "删唯一会话：关页同笔带 build 作业（真路）")
    await withFakeDom(async () => {
      zh()
      const root = new FlowNode("div")
      root.__connected = true
      const driven = drive(root, null, after, null)
      assert.equal(driven.constructed, true, "关页：作业含 build ⇒ 构造径")
      assert.equal(root.clears, 1, "关页：构造径一次清树")
      assert.equal(root.querySelector("[data-guide]")?.getAttribute("data-guide"), "no-session", "关页：引导节点在场")
      assert.equal(blocksOf(root).length, 0, "关页：零块节点（引导节点唯一子）")
      assert.equal(root.childNodes.filter((node) => node instanceof FakeNode).length, 1, "关页：根子恰一枚")
    })
  }
})

// ─── 腿 2：同尺复测（全量换新 = 0）────────────────────────────

test("腿 2·同尺复测（全量换新 = 0）：活动期观测窗 —— 根 clear 零次 ∥ 同对象恒同节点 ∥ 块节点数 = 窗长", async () => {
  await withFakeDom(async () => {
    zh()
    const root = new FlowNode("div")
    root.__connected = true
    const b = (id) => ({ kind: "assistant", id, text: `文本-${id}` })
    const b0 = b("b0")
    const b1 = b("b1")
    const b2 = b("b2")
    const b3 = b("b3")
    const b4 = b("b4")
    const p0 = b("p0")
    const p1 = b("p1")
    const idsOf = () => blocksOf(root).map((node) => node.getAttribute("data-block-id"))
    const nodeOf = (id) => blocksOf(root).find((node) => node.getAttribute("data-block-id") === id)

    // 首帧：构造径（无账）
    let frame = drive(root, null, seed({ blocks: [b0] }), null)
    assert.equal(frame.constructed, true, "首帧 = 构造径（无账）")
    assert.equal(root.clears, 1, "首帧：构造径一次清树")
    const nodeB0 = nodeOf("b0")
    assert.deepEqual(idsOf(), ["b0"], "首帧：块节点在场")

    // 帧 1–3：追加（零作业 —— 尾段追加）
    frame = drive(root, seed({ blocks: [b0] }), seed({ blocks: [b0, b1] }), frame.account)
    assert.equal(frame.constructed, false, "追加帧：走结算径")
    assert.deepEqual(idsOf(), ["b0", "b1"], "追加帧：尾段追加就位")
    assert.equal(nodeOf("b0"), nodeB0, "追加帧：既有节点同对象")
    frame = drive(root, seed({ blocks: [b0, b1] }), seed({ blocks: [b0, b1, b2] }), frame.account)
    frame = drive(root, seed({ blocks: [b0, b1, b2] }), seed({ blocks: [b0, b1, b2, b3] }), frame.account)
    assert.deepEqual(idsOf(), ["b0", "b1", "b2", "b3"], "三追加：块序")
    const nodeB2 = nodeOf("b2")

    // 帧 4：回填（整置——删档 + 新写；回填落位批 2026-10-04：`prepend` 已退场，回填径改用 build）
    frame = drive(root, seed({ blocks: [b0, b1, b2, b3] }),
      seed({ blocks: [p0, p1, b0, b1, b2, b3], flowOps: [{ kind: "build" }] }), frame.account)
    assert.deepEqual(idsOf(), ["p0", "p1", "b0", "b1", "b2", "b3"], "回填（整置）：块序 = 记录序")
    const nodeB0R = nodeOf("b0")
    assert.notEqual(nodeB0R, nodeB0, "整置：节点换代（删档 + 新写——非「既有项零动」）")
    assert.ok(nodeOf("b3"), "整置：新档全量（b3 在位）")
    const nodeB2R = nodeOf("b2")
    const nodeP0 = nodeOf("p0")

    // 帧 5：退流摘（cut{4} —— 命中项真摘除）
    frame = drive(root, seed({ blocks: [p0, p1, b0, b1, b2, b3] }),
      seed({ blocks: [p0, p1, b0, b1, b3], flowOps: [{ kind: "cut", index: 4 }] }), frame.account)
    assert.deepEqual(idsOf(), ["p0", "p1", "b0", "b1", "b3"], "退流摘：块序")
    assert.equal(nodeB2R.parentNode, null, "退流摘：b2 节点真摘除（parentNode === null）")
    assert.equal(nodeOf("b0"), nodeB0R, "退流摘：邻项节点同对象")

    // 帧 6：饱和窗（限 4 —— 头段越位摘按数）
    frame = drive(root, seed({ blocks: [p0, p1, b0, b1, b3] }), seed({ blocks: [p0, p1, b0, b1, b3] }), frame.account, 4)
    assert.deepEqual(idsOf(), ["p1", "b0", "b1", "b3"], "饱和窗：按数摘最旧")
    assert.equal(nodeP0.parentNode, null, "饱和窗：越位项节点摘离")
    assert.equal(nodeOf("b0"), nodeB0R, "饱和窗：保留项同对象")

    // 帧 7：饱和追加（摘 1 造 1 —— 同帧两动作；账数组不动 —— 窗只隐不删）
    frame = drive(root, seed({ blocks: [p0, p1, b0, b1, b3] }), seed({ blocks: [p0, p1, b0, b1, b3, b4] }), frame.account, 4)
    assert.deepEqual(idsOf(), ["b0", "b1", "b3", "b4"], "饱和追加：块序")
    assert.equal(nodeOf("b0"), nodeB0R, "跨帧引用不变（同对象恒同节点）")
    assert.equal(root.clears, 2, "活动期观测窗：根 clear = 2（初始 + 回填整置各一次；其余帧零全量换新）")
    assert.equal(blocksOf(root).length, 4, "块节点数 = 窗长")

    // 终态：DOM 块节点序 ≡ 模型窗逐位同对象（账为准）
    const entries = frame.account.mounted
    const model = modelOf(seed({ blocks: [p0, p1, b0, b1, b3, b4] }), 4)
    for (const [index, item] of entries.entries()) assert.equal(item.block, model.blocks[index], `账项 ${index}：逐位同对象`)
  })
})

// ─── 腿 3：滚动补偿零回归 ───────────────────────────────────

test("腿 3·滚动补偿零回归：贴底（跟滚 ∥ 零读）∥ 补偿算式写值同式 ∥ 零动 ⇒ 零写", async () => {
  await withFakeDom(async () => {
    zh()
    const root = new FlowNode("div")
    root.__connected = true
    const b = (id) => ({ kind: "assistant", id, text: id })
    const [b0, b1, b2, b3] = [b("b0"), b("b1"), b("b2"), b("b3")]

    // 3a 跟滚帧（头段摘 > 0）：贴底写超值 ∥ 两读数免读
    {
      const sc = scrollQueue([{ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }])
      const frame = drive(root, null, seed({ blocks: [b0, b1] }), null, 2, sc)
      root.scrollWrites.length = 0 // 构造径写面清点（贴底覆盖 —— 与帧尾三写同律）
      sc.reads = 0
      drive(root, seed({ blocks: [b0, b1] }), seed({ blocks: [b0, b1, b2] }), frame.account, 2, sc)
      assert.deepEqual(root.scrollWrites, [Number.MAX_SAFE_INTEGER], "跟滚帧：恰一次帧尾写 —— 写超值（不读 scrollHeight）")
      assert.equal(sc.reads, 0, "跟滚帧：两读数免读（零读）")
    }

    // 3b 非跟滚 ∧ 头段动数 > 0：补偿算式写值同式（= prevTop + (nextHeight − prevHeight)）
    {
      const root2 = new FlowNode("div")
      root2.__connected = true
      const sc = scrollQueue([
        { scrollTop: 400, scrollHeight: 2000, clientHeight: 200 }, // t0
        { scrollTop: 410, scrollHeight: 2064, clientHeight: 200 }, // t1
      ])
      const frame = drive(root2, null, seed({ blocks: [b0, b1], following: false }), null, 2, sc)
      root2.scrollWrites.length = 0
      sc.reads = 0
      drive(root2, seed({ blocks: [b0, b1] }), seed({ blocks: [b0, b1, b2], following: false }), frame.account, 2, sc)
      assert.equal(sc.reads, 2, "非跟滚 ∧ 头段动数 > 0：恰两读（t0 ∥ t1）")
      assert.deepEqual(root2.scrollWrites, [scrollMod.compensateTop({ prevTop: 400, prevHeight: 2000, nextHeight: 2064 })], "补偿写值 = 算式同式（prevTop + ΔH）")
    }

    // 3c 非跟滚 ∧ 头段零动（纯追加）：零读零写
    {
      const root3 = new FlowNode("div")
      root3.__connected = true
      const sc = scrollQueue([{ scrollTop: 300, scrollHeight: 2000, clientHeight: 200 }])
      const frame = drive(root3, null, seed({ blocks: [b0, b1], following: false }), null, 4, sc)
      root3.scrollWrites.length = 0
      sc.reads = 0
      drive(root3, seed({ blocks: [b0, b1] }), seed({ blocks: [b0, b1, b2], following: false }), frame.account, 4, sc)
      assert.equal(sc.reads, 0, "零动帧：零读")
      assert.deepEqual(root3.scrollWrites, [], "零动帧：零写")
    }
  })
})

// ─── 腿 4：序 / 内容零回归（含构造径终态对拍）──────────────────

test("腿 4·序 / 内容零回归：块序 ≡ 模型窗 ∥ 文本族就地刷 ∥ 型变节点换 ∥ 构造径终态对拍", async () => {
  await withFakeDom(async () => {
    zh()
    const root = new FlowNode("div")
    root.__connected = true
    const k0 = { kind: "assistant", id: "k0", text: "甲" }
    const k1 = { kind: "user", id: "k1", text: "乙" }

    let frame = drive(root, null, seed({ blocks: [k0, k1] }), null)
    const node0 = blocksOf(root)[0]
    assert.deepEqual(seqOf(root), [["assistant", "k0", "甲"], ["user", "k1", "乙"]], "起稿：块序 ∥ 键 ∥ 原文")

    // 4a 文本族就地刷（同位换对象 —— 节点身份存续）
    const k0b = { kind: "assistant", id: "k0", text: "甲丙" }
    frame = drive(root, seed({ blocks: [k0, k1] }), seed({ blocks: [k0b, k1] }), frame.account)
    assert.equal(blocksOf(root)[0], node0, "文本刷：节点身份存续（就地）")
    assert.equal(node0.querySelector("[data-raw]").getAttribute("data-raw"), "甲丙", "文本刷：原文逐字落锚")

    // 4b 型变（同位换 kind —— 单块节点换）
    const k0t = { kind: "tool", id: "k0", name: "read", status: "running", result: "" }
    const rootBefore = blocksOf(root)[0]
    frame = drive(root, seed({ blocks: [k0b, k1] }), seed({ blocks: [k0t, k1] }), frame.account)
    const after = blocksOf(root)[0]
    assert.notEqual(after, rootBefore, "型变：单块节点换（非就地）")
    assert.equal(rootBefore.parentNode, null, "型变：旧节点摘离")
    assert.equal(after.getAttribute("data-block-kind"), "tool", "型变：新节点随新 kind")
    assert.equal(indexIn(root, after), indexIn(root, blocksOf(root)[0]), "型变：原位就位")

    // 4c 构造径终态对拍（同态两径 —— DOM 块序 ∥ 键 ∥ 原文逐位同）
    const finalState = seed({ blocks: [k0t, k1] })
    const fresh = new FlowNode("div")
    fresh.__connected = true
    chat.mountChat(fresh, finalState, {}, MAX)
    assert.deepEqual(seqOf(root), seqOf(fresh), "构造径终态对拍：结算径终态 ≡ 构造径终态")
    assert.equal(root.clears, 1, "结算径整场零清树")
    void frame
  })
})

// ─── 腿 5：禁词 + 写点白名单 ────────────────────────────────

test("腿 5·禁词零命中（八词 ∥ 词界 ∥ 历史批名不计面）+ 结构写点白名单（appendBlock + 四作业点）", () => {
  const dir = join(ROOT, "thincoder-desktop/renderer")
  const walk = (rel) => {
    const out = []
    for (const entry of readdirSync(join(dir, rel), { withFileTypes: true })) {
      const path = rel === "" ? entry.name : `${rel}/${entry.name}`
      if (entry.isDirectory()) out.push(...walk(path))
      else out.push(path)
    }
    return out
  }
  const files = walk("").filter((file) => file.endsWith(".mjs"))
  const read = (file) => readFileSync(join(dir, file), "utf8").split("\n")

  // 5a 禁词面（射击面 = `chat-stream.mjs` 全文 + 本批改写区 + 本批新写行）：
  //   词表（八词）= ASCII `ok`（词界 —— `token` ∕ `broken` 类子串不命中）+ 中文七词（逐词面）；
  //   不计面 = 历史批名（「对齐第 N 批」形 —— 机检即剥除）。
  const WORDS = ["对齐", "对位", "重合", "档位", "换代", "重建", "回落"]
  const BATCH_NAME = /「?对齐第[一二三四五六七八九十0-9]+批」?/g
  const TOKENS = [/flowOps/, /withFlowOp/, /flowStep/, /结算步/, /作业单/, /结构作业/]
  const hitWords = (line) => {
    const bare = line.replace(BATCH_NAME, "")
    const hits = WORDS.filter((word) => bare.includes(word))
    if (/\bok\b/.test(bare)) hits.push("ok")
    return hits
  }
  const spanTo = (lines, startRe, endRe) => {
    const start = lines.findIndex((line) => startRe.test(line))
    assert.notEqual(start, -1, `面锚未命中（start）：${startRe}`)
    const end = lines.findIndex((line, index) => index >= start && endRe.test(line))
    assert.notEqual(end, -1, `面锚未命中（end）：${endRe}`)
    return [start, end]
  }
  const FACE = [
    { file: "views/chat-stream.mjs", whole: true },
    { file: "app.mjs", anchors: [
      [/对话流面 `paintChat`/, /本页\*\*实并入块数\*\*）/],
      [/收束沿只增/, /let chatFrame = null/],
      [/对话流帧出口/, /focusAutofocus\(root\)/],
    ] },
    { file: "views/chat.mjs", anchors: [
      [/帧尾六步 `settleFrame`/, /尾段步\*\*（步①）=/],
      [/造项挂载/, /return mountedOf\(root, model\.blocks\)/],
    ] },
    { file: "page-read.mjs", anchors: [
      [/两径各带\*\*结构作业\*\*/, /写不可拆（写口 = `withFlowOp`）/],
      [/结构作业（流面作业单）：`build`/, /withFlowOp\(first, \{ kind: "build" \}\)/],
    ] },
    { file: "composer-wire.mjs", anchors: [[/结构作业（流面作业单）/, /withFlowOp\(\{ blocks:/]] },
    { file: "session-wire.mjs", anchors: [[/删活动会话后的接管/, /store\.set\(withFlowOp\(openSession/]] },
    { file: "views/chat-text.mjs", anchors: [
      [/帧尾\*\*刷项\*\* —— `renderer\/views\/chat\.mjs` `refreshNode` 调用/, /帧尾\*\*刷项\*\* —— `renderer\/views\/chat\.mjs` `refreshNode` 调用/],
      [/全根推理块首帧钉底/, /`dressNode` 逐块钉底）。/],
    ] }, // 指针改指行 + 残件-2 收正句（旧机语汇零残留）
    { file: "views/chat-scroll.mjs", anchors: [[/④ `tailAction`（帧尾三写判据）/, /④ `tailAction`（帧尾三写判据）/]] }, // 残件-1：死导出随删（头注句收正行）
    { file: "store.mjs", anchors: [
      [/流面作业单（结构变更由发生点带上/, /流面作业单（结构变更由发生点带上/],
      [/流面作业单写口/, /return \{ \.\.\.state, flowOps:/],
    ] },
  ]
  const hits = []
  for (const face of FACE) {
    const lines = read(face.file)
    const marks = new Set()
    if (face.whole === true) for (let index = 0; index < lines.length; index += 1) marks.add(index)
    else for (const [startRe, endRe] of face.anchors) {
      const [start, end] = spanTo(lines, startRe, endRe)
      for (let index = start; index <= end; index += 1) marks.add(index)
    }
    for (let index = 0; index < lines.length; index += 1) {
      if (TOKENS.some((token) => token.test(lines[index]))) marks.add(index) // 本批新写行（含 import 面）
    }
    for (const index of [...marks].sort((a, b) => a - b)) {
      for (const word of hitWords(lines[index])) hits.push(`${face.file}:${index + 1} [${word}] ${lines[index].trim().slice(0, 80)}`)
    }
  }
  assert.deepEqual(hits, [], "射击面八词零命中（历史批名不计面）")

  // 5b 写点白名单（面 = `renderer/**/*.mjs`；判据 = `blocks` 键写行逐条归类）：
  const WRITES = [
    { file: "store.mjs", pattern: /blocks: \[\]/, why: "初态（空单）" },
    { file: "store.mjs", pattern: /blocks: \[\.\.\.state\.blocks, block\]/, why: "appendBlock（追加 —— 零作业）" },
    { file: "page-read.mjs", pattern: /blocks: page,/, why: "整置作业点（build）" },
    { file: "page-read.mjs", pattern: /blocks: \[\.\.\.page, \.\.\.\(flagged\.blocks \?\? \[\]\)\]/, why: "回填整置作业点（build —— 页并入；回填落位批 2026-10-04：`prepend` 退场、作业型改 build、写入行保留）" },
    { file: "composer-wire.mjs", pattern: /blocks: next \}, \{ kind: "cut", index \}/, why: "退流摘作业点（cut —— 摘至零块时同笔并 build）" },
    { file: "events-blocks.mjs", pattern: /blocks: next \}|blocks: \[\.\.\.blocks\.slice\(0, -1\)|blocks: \[\.\.\.blocks\.slice\(0, index\), (next|settled),/, why: "原地换（非结构 —— 长度不变）" },
    { file: "app.mjs", pattern: /blocks: toggleExpanded\(/, why: "原地换（非结构 —— 折叠旗）" },
    { file: "views/chat-model.mjs", pattern: /blocks: mode === "none" \? \[\] : visible/, why: "模型投影（读面）" },
    { file: "views/pool-tree.mjs", pattern: /blocks: mode === "none" \? \[\] : blocks/, why: "模型投影（读面）" },
    { file: "views/statusline.mjs", pattern: /blocks: state\?\.blocks \?\? \[\]/, why: "模型投影（读面）" },
  ]
  const unlisted = []
  let scanned = 0
  for (const file of files) {
    const lines = read(file)
    lines.forEach((line, index) => {
      if (!/(?<![\w.])blocks:\s/.test(line)) return
      scanned += 1
      const ok = WRITES.some((row) => row.file === file && row.pattern.test(line))
      if (!ok) unlisted.push(`${file}:${index + 1} ${line.trim().slice(0, 90)}`)
    })
  }
  assert.ok(scanned >= 10, `扫描面下界（防空集亦绿）：实扫 ${scanned} 行`)
  assert.deepEqual(unlisted, [], "结构写点全集 ⊂ 白名单（appendBlock + 四作业点 + 非结构归类）")

  // 5c 作业点计数（**四作业点** —— 设计五处；`insert`（`subagent-reduce.mjs` 座次支）随 #765 拆机退场，零生产写点）：
  const callSites = []
  for (const file of files) {
    const lines = read(file)
    lines.forEach((line, index) => {
      if (!line.includes("withFlowOp(")) return
      if (file === "store.mjs") return // 定义行（唯一写口本体）
      if (/function withFlowOp|import \{/.test(line)) return // 定义 ∥ 取件面
      callSites.push(`${file}:${index + 1}`)
    })
  }
  assert.deepEqual(
    callSites.map((site) => site.split(":")[0]).sort(),
    ["composer-wire.mjs", "composer-wire.mjs", "page-read.mjs", "page-read.mjs", "session-wire.mjs"],
    "作业点四文件 · 五笔调用（page-read ×2（首屏整置 + 回填整置）∥ composer-wire ×2（退流 + 摘空并 build）∥ session-wire ×1）",
  )
  assert.equal(callSites.length, 5, "作业点共五笔调用（回填作业型改 build——调用位不动）")
  const source = (file) => readFileSync(join(dir, file), "utf8")
  assert.ok(source("page-read.mjs").includes('withFlowOp(first, { kind: "build" })'), "作业点：首屏整置（build）")
  assert.equal(source("page-read.mjs").includes('{ kind: "prepend", count: page.length }'), false, "作业点：回填前插（prepend）已退场（回填落位批 2026-10-04——回填径改用 build 整置）")
  assert.ok(source("composer-wire.mjs").includes('{ kind: "cut", index }'), "作业点：退流摘（cut）")
  assert.ok(source("composer-wire.mjs").includes('withFlowOp(cut, { kind: "build" })'), "缺口-1：摘至零块 ⇒ 同笔并 build")
  assert.ok(source("session-wire.mjs").includes('withFlowOp(openSession(store.get(), null), { kind: "build" })'), "作业点：关页整置（build）")
  assert.equal(source("store.mjs").includes("export function withFlowOp"), true, "唯一写口在盘（store.mjs）")
  // 退场面负向锁：座次支不再写结构（归档 = 普通追加 —— 零作业）
  assert.equal(source("subagent-reduce.mjs").includes("withFlowOp"), false, "insert 作业点随 #765 退场（零生产写点）")
  // 两径判据在盘（app.mjs —— 源断言：构造径三触发字面）
  const app = source("app.mjs")
  assert.ok(app.includes('ops.some((op) => op?.kind === "build")'), "构造径判据：作业含 build")
  assert.ok(app.includes("chatFrame === null"), "构造径判据：无账（首帧）")
  assert.ok(app.includes("state.locale !== prev.locale"), "构造径判据：词面变")
  assert.ok(app.includes("store.set({ flowOps: [] })"), "清账：两径同清（root 缺位不清）")
  assert.equal(app.includes("settleFrame(root, model, chatScroll, handlers, { mounted: chatFrame.mounted, hidden: chatFrame.hidden, ops })"), true, "结算径：账 + 作业单交 settleFrame")
  // 删面负向锁（旧机零存）
  const streamSrc = source("views/chat-stream.mjs")
  for (const dead of ["streamDelta", "alignPlan", "paintPlan", "REMOUNT_KEYS", "matches"]) {
    assert.equal(streamSrc.includes(dead), false, `旧机零存：${dead}`)
  }
  assert.equal(source("views/chat-scroll.mjs").includes("plannedMoves"), false, "死导出零存（`plannedMoves` —— 全仓零引用）")
  assert.equal(source("views/chat-text.mjs").includes("零重合回落"), false, "旧机语汇零存（`零重合回落` —— 残件-2）")
})

// ─── 腿 6：缺口-1 处置（退流清空 ⇒ 同笔并 build ⇒ empty 帧引导面在场）────────

test("腿 6·缺口-1 处置：摘至零块 ⇒ 同笔并 `build` ⇒ empty 帧走构造径 ⇒ 引导面在场（非空摘 ⇒ 只带 cut）", async () => {
  const store = storeMod.store
  const k0 = { kind: "user", id: "k0", text: "唯一块" }
  const wire = composerWire.createComposerWire({ store })

  // 6a 真写点（`retractEcho` · 未认领槽 attempt = null 直调）：唯一块退流 ⇒ 块列清空 ∥ 作业单 = [cut, build]
  store.set({ ...storeMod.initialState(), locale: "zh", activeSession: KEY, blocks: [k0] })
  wire.noteEcho(KEY, k0)
  wire.retractEcho(KEY, null)
  const emptied = store.get()
  assert.deepEqual(emptied.blocks, [], "退流：块列清空")
  assert.deepEqual(emptied.flowOps, [{ kind: "cut", index: 0 }, { kind: "build" }], "摘至零块：同笔并 build（有序单 = [cut, build]）")

  // 6b 平 node 面：`build` 承 `empty` 态 —— 构造径判定 + 构树终态（引导节点首子）
  const model = modelOf(emptied)
  assert.equal(model.state, "empty", "空窗：empty 态")
  assert.equal(model.guide, "no-message", "空窗：引导码（欢迎条）")
  const tree = chatTree.chatTree(model, {})
  assert.equal(tree.children.length, 1, "构树终态：引导节点唯一子")
  assert.equal(tree.children[0].props["data-guide"], "no-message", "构树终态：引导码落形")
  assert.equal(tree.props["data-state"], "empty", "构树终态：根锚 data-state = empty")
  assert.equal(JSON.stringify(tree).includes("data-block-kind"), false, "构树终态：零块节点")

  // 6c 真帧路：作业含 build ⇒ 构造径（账在场亦不消费）⇒ 引导节点首子（欢迎条）
  await withFakeDom(async () => {
    zh()
    const root = new FlowNode("div")
    root.__connected = true
    const account = { mounted: [{ node: new FakeNode("div"), block: k0 }], hidden: 0 }
    const driven = drive(root, seed({ blocks: [k0] }), emptied, account)
    assert.equal(driven.constructed, true, "作业含 build ⇒ 构造径（账在场亦不消费）")
    assert.equal(root.clears, 1, "构造径：一次清树")
    const guide = root.querySelector("[data-guide]")
    assert.equal(guide?.getAttribute("data-guide"), "no-message", "empty 帧：引导节点在场")
    assert.equal(root.childNodes[0], guide, "empty 帧：引导节点 = 首子（在块序列 / 卡序列之前）")
    assert.equal(blocksOf(root).length, 0, "empty 帧：零块节点")
  })

  // 6d 对照（非空摘）：只带 cut（无 build —— 不触发构造径）
  store.set({ ...storeMod.initialState(), locale: "zh", activeSession: KEY, blocks: [k0, { kind: "assistant", id: "k1", text: "余" }] })
  wire.noteEcho(KEY, k0)
  wire.retractEcho(KEY, null)
  const kept = store.get()
  assert.equal(kept.blocks.length, 1, "非空摘：余项在场")
  assert.deepEqual(kept.flowOps, [{ kind: "cut", index: 0 }], "非空摘：只带 cut（零 build）")
  await withFakeDom(async () => {
    zh()
    const root = new FlowNode("div")
    root.__connected = true
    const k1 = kept.blocks[0]
    const model = modelOf(kept)
    const driven = drive(root, null, seed({ blocks: [k0, k1] }), null, MAX)
    const after = drive(root, seed({ blocks: [k0, k1] }), kept, driven.account)
    assert.equal(after.constructed, false, "非空摘：仍走结算径")
    assert.equal(blocksOf(root).length, model.blocks.length, "非空摘：块节点数 = 窗长")
    assert.deepEqual(blocksOf(root).map((node) => node.getAttribute("data-block-id")), model.blocks.map((block) => block.id), "非空摘：块序 = 模型窗")
  })
})

