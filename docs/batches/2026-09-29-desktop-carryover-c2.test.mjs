/**
 * 2026-09-29-desktop-carryover-c2.test.mjs — 批次本地机检件 · 舱 2（#660 · KD-47 ⑤ 零块帧领用门放宽）。
 * 名随批次档 · 不入仓套件；复跑（自仓库根）= `node --test .thincoder/tmp/2026-09-29-desktop-carryover-c2.test.mjs`
 * （暂存位两层深 ⇒ 与终位 `docs/batches/` 同名件相对 import 一致；终位转正 = 父侧收口——写门拒子代理批内伴随件，
 * 沿 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §5「件暂存位」先例）。
 *
 * 被验面（批档 §2.7 判据 —— AC 机检腿）：
 *   M-660a 零块 ∧ 审批 ∕ 队列在场帧连发 ⇒ 审批 ∕ 队列条目节点引用不变 + 头原位 + 零块帧不产族壳
 *          （#660 门放宽主受益面；尾附「会话账不匹配 ⇒ 全新建」——判据仍有效）。
 *   M-660b 零块 → 出生 ⇒ 族容器全新建元素 + 会话账存续（`_poolSub === null` ∧ `_poolSubSession` 保留 —— R5 保持）。
 *   M-660c `none` ∕ `empty` 零节点语义不动（零回归）。
 * harness = rc-resolve 钩子（`/rc/` 取核件 · 静态 import 先行）+ mini 假 DOM（沿
 * `2026-09-29-subblock-follow-resume.test.mjs` 先例收窄 ∕ 收正：`insertBefore` ∕ `appendChild` ∕ `replaceWith`
 * 带**真 DOM 移动语义**（先摘后插 —— 族键控差分重排所需）；假 DOM 仅服务本批判据，不入仓套件）。
 * **假 DOM 已知局限（登记）**：`FakeNode.isConnected` 恒真（`:49`）——摘离 ∕ 换位不改该读（与真 DOM 异）；
 *  核件依赖该读的面（块 `.isConnected` 门控 ∕ 跟滚 no-op）在本件不可测（M-660a–c 判据不倚之 ⇒ 无假绿）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

// ─── mini 假 DOM（块构件族所需面 + 事件 ∕ 滚动读数 ∕ churn 模型）────────────────────────────────

const camelOf = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

class FakeText {
  constructor(value) { this.textContent = String(value) }
}

/** churn 模型（真浏览器语义）：节点摘离文档 ⇒ 其子树滚动盒销毁 ⇒ 位归零（R5 重挂判据测面）。 */
function zeroScroll(node) {
  if (!(node instanceof FakeNode)) return
  node.scrollTop = 0
  for (const child of node.children) zeroScroll(child)
}

class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.attrs = {}
    this.dataset = {}
    this.children = []
    this.listeners = []
    this.textContent = ""
    this.parent = null
    this.open = false
    this.isConnected = true
    this.scrollTop = 0
    this.scrollHeight = 0
    this.clientHeight = 0
    this._classes = new Set()
    this.classList = {
      add: (...cs) => { for (const c of cs) this._classes.add(c) },
      remove: (...cs) => { for (const c of cs) this._classes.delete(c) },
      contains: (c) => this._classes.has(c),
    }
  }
  set className(value) { this._classes = new Set(String(value).split(/\s+/).filter(Boolean)) }
  get className() { return [...this._classes].join(" ") }
  setAttribute(k, v) {
    const s = String(v)
    this.attrs[k] = s
    if (k === "class") this.className = s
    else if (k.startsWith("data-")) this.dataset[camelOf(k.slice(5))] = s
  }
  getAttribute(k) {
    if (k.startsWith("data-")) {
      const v = this.dataset[camelOf(k.slice(5))]
      if (v !== undefined) return String(v)
    }
    return this.attrs[k] ?? null
  }
  removeAttribute(k) { delete this.attrs[k] }
  addEventListener(type, fn, options) { this.listeners.push({ type, fn, options }) }
  /** 先摘后插（**真 DOM 移动语义** —— 族键控差分 `insertBefore(entry, cursor)` 重排所需；非此则假 DOM 复现条目）。 */
  detach() {
    if (this.parent === null) return
    const at = this.parent.children.indexOf(this)
    if (at >= 0) this.parent.children.splice(at, 1)
    this.parent = null
  }
  appendChild(node) {
    const child = node instanceof FakeNode ? node : new FakeText(node)
    if (child instanceof FakeNode) child.detach()
    child.parent = this
    this.children.push(child)
    this.bump()
    return child
  }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  insertBefore(node, anchor) {
    if (node instanceof FakeNode) node.detach()
    const at = anchor == null ? -1 : this.children.indexOf(anchor)
    if (at < 0) this.children.push(node); else this.children.splice(at, 0, node)
    node.parent = this
    this.bump()
    return node
  }
  prepend(node) { this.insertBefore(node, this.children[0] ?? null) }
  get childNodes() { return [...this.children] }
  get firstChild() { return this.children[0] ?? null }
  get firstElementChild() { return this.children.find((c) => c instanceof FakeNode) ?? null }
  get lastElementChild() { return [...this.children].reverse().find((c) => c instanceof FakeNode) ?? null }
  replaceChildren(...nodes) {
    for (const c of this.children) { if (c instanceof FakeNode) zeroScroll(c); c.parent = null }
    this.children = []
    for (const n of nodes) this.appendChild(n)
  }
  remove() {
    this.detach()
    zeroScroll(this)
  }
  replaceWith(next) {
    const p = this.parent
    if (!p) return
    if (next instanceof FakeNode) next.detach()
    const at = p.children.indexOf(this)
    p.children[at] = next
    next.parent = p
    p.bump()
    this.parent = null
    zeroScroll(this)
  }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matches(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (matches(n, sel)) out.push(n) }); return out }
  closest(sel) { for (let n = this; n != null; n = n.parent ?? null) if (n instanceof FakeNode && matches(n, sel)) return n; return null }
  walk(fn) { for (const c of this.children) { if (c instanceof FakeNode) { fn(c); c.walk(fn) } } }
  set innerHTML(value) { this._html = String(value) }
  get innerHTML() { return this._html ?? "" }
  bump() { this.textContent = this.children.map((c) => c.textContent ?? "").join("") }
}

/** 单段选择器（类 ∕ 标签 ∕ `[attr]` ∕ `[attr="v"]` —— 本批各查询点皆单段）。 */
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
globalThis.document = {
  getElementById: () => null,
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (value) => new FakeText(value),
}
globalThis.window = {}

// ─── 端词典装配（核件取词经注册端出 —— 沿 #518 先例）+ 被验面取件 ───────────────────────────────

const { initDict, setStringsSink } = await import("../../thincoder-desktop/renderer/i18n.mjs")
const { setStrings } = await import("/rc/i18n.mjs") // #788：与消费面同路同实例（rc-resolve 钩子经 desktop junction realpath）——直路 `thincoder-render-core/i18n.mjs` 在小写拼写下 = 第二实例（静默断链）
const { projectDictionary } = await import("../../thincoder-core/i18n.mjs")
setStringsSink(setStrings)
initDict({ locale: "en", dict: projectDictionary("en") })

const { mountPool } = await import("../../thincoder-desktop/renderer/views/activity.mjs")
const { syncSubBlocks } = await import("../../thincoder-desktop/renderer/views/pool-subagents.mjs")

// ─── 夹具 ──────────────────────────────────────────────────────────────────

const row = (text) => ({ kind: "text", text })
const liveEntry = (rows, extra = {}) => ({ key: "sub:coder#1", label: "coder#1", role: "coder", id: 1, status: "running", pool: true, frozen: false, rows, ...extra })
const poolState = (blocks, extra = {}) => ({
  activeSession: "1",
  pool: { approvals: [], queue: [], running: blocks.length, approval: 0 },
  subBlocks: { "1": blocks },
  poolCollapsed: {},
  ...extra,
})
const APPROVAL = { promptId: "A-1", shape: "single", tool: "Bash" }
const QUEUE = { title: "Q-1", status: "queued" }
/** 零块 ∧ 审批 ∕ 队列在场（帧可达配置 —— 主回合首个工具审批；态 pool 由 `approvals.length` 撑起）。 */
const zeroBlockState = (running, extra = {}) => ({
  activeSession: "1",
  pool: { approvals: [APPROVAL], queue: [QUEUE], running, approval: 1 },
  subBlocks: { "1": [] },
  poolCollapsed: {},
  ...extra,
})

// ─── M-660a（门放宽主受益面）──────────────────────────────────────────────────

test("M-660a·零块 ∧ 审批 ∕ 队列在场帧连发：条目引用不变 + 头原位 + 零块帧不产族壳", () => {
  const root = new FakeNode("div")
  mountPool(root, zeroBlockState(0)) // 首帧：壳缺位 ⇒ 建树全挂（② 径）
  const body = root.querySelector("[data-pool-body]")
  assert.ok(body !== null, "首帧：池体在场")
  const head0 = root.querySelector("[data-pool-head]")
  const entry0 = body.querySelector('[data-prompt-id="A-1"]')
  const queue0 = body.querySelector('[data-pool-item="queue"]')
  const famA0 = body.querySelector('[data-family="approvals"]')
  assert.ok(entry0 !== null && queue0 !== null, "首帧：审批 ∕ 队列条目在场（态 pool 可达配置）")
  assert.equal(body.querySelector('[data-family="subagents"]'), null, "零块帧不产族壳（族空零节点律）")
  assert.equal(root._poolSub, null, "零块帧：容器账空（R5）")
  assert.equal(root._poolSubSession, "1", "零块帧：会话账落位")

  mountPool(root, zeroBlockState(1)) // 帧连发（#660 前：门必假 ⇒ 每帧全建；#660 后：领用径 ③）
  mountPool(root, zeroBlockState(2))
  // 断点自 `root` 现取（活的树——非首帧引用；壳收账时假 DOM 旧壳仍自存子件，旧引用会假绿）
  const body2 = root.querySelector("[data-pool-body]")
  const head2 = root.querySelector("[data-pool-head]")
  assert.equal(body2, body, "壳在位 ⇒ 体原位（原位领用——零重建）")
  assert.equal(body2.querySelector('[data-prompt-id="A-1"]'), entry0, "帧连发 ⇒ 审批条目引用不变（键控差分）")
  assert.equal(body2.querySelector('[data-pool-item="queue"]'), queue0, "帧连发 ⇒ 队列条目引用不变")
  assert.equal(body2.querySelector('[data-family="approvals"]'), famA0, "审批族容器引用不变")
  assert.equal(body2.querySelectorAll('[data-pool-item="approval"]').length, 1, "审批条目唯一（复用不重插）")
  assert.equal(body2.querySelectorAll('[data-pool-item="queue"]').length, 1, "队列条目唯一（复用不重插）")
  assert.equal(body2.querySelector('[data-family="subagents"]'), null, "领用径零块帧不产族壳")
  assert.equal(root.querySelectorAll("[data-pool-head]").length, 1, "头恰一（原位存续）")
  // 2026-10-01 复核扫面收正批（M4 池头逐件就地差分）——锁点随动：头引用存续（原「引用换新」断言随 M4 作废）。
  assert.equal(head2, head0, "头同引用存续（逐件就地差分）")
  assert.equal(head2, root.firstElementChild, "头原位（宿主首元素 —— 零重排）")
  assert.equal(root._poolSub, null, "零块帧 ⇒ 弃容器账（R5 语义保持）")
  assert.equal(root._poolSubSession, "1", "会话账存续（#660 收窄）")

  mountPool(root, zeroBlockState(0, { activeSession: "2", subBlocks: { "2": [] } })) // 会话账不匹配 ⇒ 建树全挂
  const entry2 = root.querySelector('[data-prompt-id="A-1"]')
  assert.ok(entry2 !== null && entry2 !== entry0, "换代 ⇒ 全新建（不承旧节点 —— 判据仍有效）")
  assert.equal(root._poolSubSession, "2", "会话账随波落位")
})

// ─── M-660b（零块 → 出生 —— R5 保持）───────────────────────────────────────────

test("M-660b·零块 → 出生：族容器全新建元素 + 会话账存续（R5 零块弃账语义保持）", () => {
  const root = new FakeNode("div")
  mountPool(root, poolState([liveEntry([row("a")])])) // 帧 1：块在场 ⇒ 建树径建族壳 A
  const familyA = root.querySelector('[data-family="subagents"]')
  assert.ok(familyA !== null, "帧 1：族壳在场")
  assert.equal(root._poolSub, familyA, "帧 1：容器账 = 族壳 A")

  mountPool(root, poolState([], { pool: { approvals: [APPROVAL], queue: [], running: 1, approval: 1 } })) // 帧 2：零块（审批在场）
  assert.equal(root.querySelector('[data-family="subagents"]'), null, "零块帧 ⇒ 族壳摘离（族空零节点律）")
  assert.equal(root.querySelector(".sub-block"), null, "零块帧 ⇒ 零块元素（R5）")
  assert.equal(root._poolSub, null, "零块帧 ⇒ 弃容器账（R5）")
  assert.equal(root._poolSubSession, "1", "零块帧 ⇒ 会话账存续（#660 收窄）")
  assert.ok(root.querySelector("[data-pool-body]").querySelector('[data-prompt-id="A-1"]') !== null, "零块帧领用径：审批条目在场")

  mountPool(root, poolState([liveEntry([row("a")], { id: 2 })])) // 帧 3：出生
  const familyB = root.querySelector('[data-family="subagents"]')
  assert.ok(familyB !== null, "出生 ⇒ 族壳在场")
  assert.notEqual(familyB, familyA, "族容器全新建元素（不承旧容器账 —— R5）")
  assert.equal(root._poolSub, familyB, "容器账 = 族壳 B")
  assert.equal(root._poolSubSession, "1", "会话账存续（领用径）")
  assert.ok(root.querySelector(".sub-block") !== null, "块元素在场（出生正常）")
})

// ─── M-660c（none ∕ empty 零节点语义 —— 零回归）──────────────────────────────────

test("M-660c·none ∕ empty 零节点语义不动（零回归）", () => {
  const root = new FakeNode("div")
  mountPool(root, poolState([liveEntry([row("a")])]))
  assert.ok(root.querySelector(".sub-block") !== null, "前置：池面在场")

  mountPool(root, poolState([], { activeSession: null }))
  assert.equal(root.getAttribute("data-state"), "none", "无会话 ⇒ 态 none")
  assert.equal(root.children.length, 0, "none ⇒ 零子节点（清区）")
  assert.equal(root.querySelector("[data-pool-body]"), null, "none ⇒ 零池体")

  mountPool(root, poolState([]))
  assert.equal(root.getAttribute("data-state"), "empty", "三族皆空 ⇒ 态 empty")
  assert.equal(root.children.length, 0, "empty ⇒ 零子节点（内容退场 —— R10 E2）")

  mountPool(root, poolState([liveEntry([row("a")])]))
  assert.equal(root.getAttribute("data-state"), "pool", "回场 ⇒ 态 pool")
  assert.ok(root.querySelector(".sub-block") !== null, "回场 ⇒ 树在场（不承 none ∕ empty 期零节点账）")
})

// ─── 空族支边界（折叠 ∕ 墓碑 —— 覆盖补足；逐径核过等价正确）───────────────────────────────────

test("空族支 × 折叠：零块 ∧ 折叠 ∧ 审批在场 ⇒ 三族零节点 + 弃容器账 + 会话账存续", () => {
  const root = new FakeNode("div")
  mountPool(root, zeroBlockState(0)) // 首帧：建树径（展开态）
  assert.ok(root.querySelector('[data-prompt-id="A-1"]') !== null, "前置：审批条目在场")

  mountPool(root, zeroBlockState(1, { poolCollapsed: { "1": true } })) // 折叠帧（领用径 + 空族支）
  const body = root.querySelector("[data-pool-body]")
  assert.equal(root.getAttribute("data-state"), "pool", "态 pool（审批在场撑起）")
  assert.equal(root.querySelectorAll("[data-family]").length, 0, "折叠 ∧ 零块 ⇒ 三族零节点（含子 agent 族壳仍缺席）")
  assert.ok(body !== null && body.querySelectorAll("[data-pool-item]").length === 0, "体内零条目节点")
  assert.equal(root._poolSub, null, "弃容器账（R5）")
  assert.equal(root._poolSubSession, "1", "会话账存续（#660 收窄）")

  mountPool(root, zeroBlockState(2, { poolCollapsed: {} })) // 展开帧
  assert.ok(root.querySelector('[data-prompt-id="A-1"]') !== null, "展开 ⇒ 审批族复场")
  assert.equal(root.querySelector('[data-family="subagents"]'), null, "零块 ⇒ 族壳仍缺席")
})

test("空族支 × 墓碑帧：全 region:\"flow\" 过滤 ⇒ 零块同判（族壳缺席 + 弃容器账 + 会话账存续）", () => {
  const root = new FakeNode("div")
  const tomb = { ...liveEntry([row("a")]), region: "flow" }
  const state = () => poolState([tomb], { pool: { approvals: [APPROVAL], queue: [], running: 1, approval: 1 } })
  mountPool(root, state()) // 首帧：块表全墓碑 ⇒ 视图零块（池内退场）
  assert.equal(root.getAttribute("data-state"), "pool", "态 pool（审批在场撑起）")
  assert.equal(root.querySelector('[data-family="subagents"]'), null, "零块（墓碑过滤后）⇒ 族壳缺席")
  assert.equal(root.querySelector(".sub-block"), null, "零块元素（墓碑不入族）")
  assert.equal(root._poolSub, null, "弃容器账")
  assert.equal(root._poolSubSession, "1", "会话账落位")

  mountPool(root, state()) // 同态帧 ⇒ 领用径（#660）
  assert.equal(root.querySelector('[data-family="subagents"]'), null, "领用径同判：族壳仍缺席")
})

// ─── 空族守卫（防 null 族引用 —— 调用面空族支已断，本守卫为防御面）───────────────────────────────

test("空族守卫·syncSubBlocks 族缺 ∕ 非元素 ⇒ 零动作（不抛）", () => {
  assert.doesNotThrow(() => syncSubBlocks(new FakeNode("div"), null, { blocks: [liveEntry([row("a")])] }), "族缺 ⇒ 零动作")
  assert.doesNotThrow(() => syncSubBlocks(new FakeNode("div"), {}, { blocks: [] }), "非元素（无 querySelectorAll）⇒ 零动作")
})
