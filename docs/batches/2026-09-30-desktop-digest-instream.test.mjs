/**
 * 2026-09-30-desktop-digest-instream.test.mjs — 批内件（桌面消化行流内落位批 · 台账 #706）。
 * ⚠ 断代（2026-10-01 · 台账 #765 拆批）：import 断——`views/chat-digest.mjs` 已删；复跑必红为预期（留档对照 · 勿复跑）。
 *
 * 判据表 = 批档 `docs/batches/2026-09-30-desktop-digest-instream.md` §2 §五（腿 1–3）+ 修正轮块 ①（守卫形权威句）。
 * 覆盖：
 *   腿 1 单轮就地 + 守卫两径（`start` 帧 ⇒ 轮元素落发生点；随流新块居其下；归档块守卫过 ⇒ 前插末轮元素之前 ∥
 *        守卫不过 ∥ 无轮 = 守卫不过特例 ⇒ 常规块插入点〔两径皆落块序尾位 —— DOM 块节点序 ≡ visible〕）；
 *   腿 2 多轮发生序 + 跨帧旧元素身份零动（同态零写）+ 非尾聚判据（R1 之后仍有块内容）；
 *   腿 3 切回 ∕ 清点（收缩 = 保尾去首：末元素原位存续；全终态 ⇒ 零元素；零载体 ⇒ 原引用零写）；
 *   引用面收正（`blockAnchor` ∕ `compressAnchorOf` 去 `[data-digest]` 首锚；`digestBoundaryOf` 守卫判据；
 *        宿主再出口 identity）。
 * 红 ∕ 绿规程：修前（单组形 ∕ `digestGroupNode` ∕ 无 `digestBoundaryOf` ∕ `blockAnchor` 首锚为 `[data-digest]`）
 * ⇒ 本件红（import 面先红：`digestRoundNode` ∕ `digestBoundaryOf` 未导出）；落修 ⇒ 全绿。本件不入仓套件（批内件 ·
 * 随批留存）。
 * 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-09-30-desktop-digest-instream.test.mjs`。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = process.cwd()
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const [
  digest, chrome, compress, chat, model, i18n, dom, core,
] = await Promise.all([
  mod("thincoder-desktop/renderer/views/chat-digest.mjs"), // 腿 1–3 轮元素 ∕ 帧刷 ∕ 界锚 ∕ 清点
  mod("thincoder-desktop/renderer/views/chat-chrome.mjs"), // 锚面（blockAnchor ∕ 再出口）+ 帧尾态刷
  mod("thincoder-desktop/renderer/views/compress-status.mjs"), // 压缩行锚（去首锚同笔）
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 构树 ∥ 尾段挂载（settleFrame 真路）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型（chatModel）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-desktop/renderer/dom.mjs"), // 描述符建树（build —— 单源 = 本档）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
])

const KEY = "1"
const zh = () => i18n.initDict({ locale: "zh", dict: core.projectDictionary("zh") })

// ─── 假 DOM（属性 ∕ 选择器（含逗号组）∕ 结构 ∕ 滚动读数面 —— 沿 M-606 ∕ digest-parity 批内件先例收窄）──

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

/** 节点写入探针（同态零写判据）：`textContent` 集 ∕ `setAttribute` 计数（读面原样透传）。 */
function spyWrites(node) {
  const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), "textContent")
  const counts = { text: 0, attr: 0 }
  Object.defineProperty(node, "textContent", {
    configurable: true,
    get: () => desc.get.call(node),
    set: (value) => { counts.text += 1; desc.set.call(node, value) },
  })
  const setAttribute = node.setAttribute.bind(node)
  node.setAttribute = (...args) => { counts.attr += 1; return setAttribute(...args) }
  return counts
}

// ─── 场景脚手架（settleFrame 真路：帧模型 = chatModel；增删计划 = plan.tail）──────────────

const SCROLL = { readMetrics: () => ({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }) }
const round = (over = {}) => ({ status: "start", n: 1, tier: null, from: null, msg: null, ...over })
const FLOW = { state: "flow", pendingNew: 0, approval: [], compress: null, timerNotice: undefined, stopMark: {}, ledgerLines: undefined, pool: { approvals: [] }, settings: {}, locale: "zh" }

const blockOf = {
  user: (text) => ({ kind: "user", text }),
  assistant: (text) => ({ kind: "assistant", text }),
  subagent: (id) => ({
    kind: "subagent",
    meta: { key: `sub-${id}`, label: `sub-${id}`, role: "explore", id, pool: true, status: "done", frozen: true, startedAt: 0, doneAt: 1500 },
    rows: [],
  }),
}

/** 一帧（真路）：模型 = `chatModel(FLOW ∪ state)`；挂载面 = `plan.tail`。 */
function frame(root, state, tail, tier = "append", mounted = []) {
  const modelNow = model.chatModel({ activeSession: KEY, following: true, ...FLOW, ...state }, 150)
  return chat.settleFrame(root, modelNow, SCROLL, { evict: 0, prepend: 0, tail, ok: true }, tier, {}, mounted)
}

const indexOf = (root, node) => root.childNodes.indexOf(node)
const blockRefs = (root) => root.querySelectorAll("[data-block-kind]")
const roundRefs = (root) => root.querySelectorAll("[data-digest]")

// ─── 腿 1a：轮元素形（单轮一元素 —— 行集 ∕ 判据不变）────────────────────────────

test("腿 1a·轮元素形：单轮一元素（类 ∕ 锚零改；行集 = 起跑标签行 + `n > 0` 计数行 + cap 行）", async () => {
  await withFakeDom(() => {
    zh()
    const node = dom.build(digest.digestRoundNode(round({ n: 2 })))
    assert.equal(node.getAttribute("data-digest"), "", "元素锚 data-digest（值零改）")
    assert.equal(node.getAttribute("class"), "chat-digest", "元素类 = chat-digest（值零改）")
    const order = node.children.map((c) => (c.getAttribute("data-digest-label") !== null ? "label" : c.getAttribute("data-digest-count") !== null ? "count" : "cap"))
    assert.deepEqual(order, ["label", "count"], "行集 = 起跑标签行 + 计数行（单轮 —— 零余轮幻影）")
    assert.equal(node.querySelector("[data-digest-label]").textContent, i18n.t("digest.turnLabel"), "标签行文单源")
    assert.equal(node.querySelector("[data-digest-count]").textContent, i18n.t("digest.start", { n: 2 }), "计数行文单源")
    const zero = dom.build(digest.digestRoundNode(round({ n: 0, cap: { mode: "stop", turns: 3 } })))
    assert.equal(zero.querySelectorAll("[data-digest-count]").length, 0, "`n = 0` ⇒ 零计数行（幻影行禁出）")
    assert.equal(zero.children[zero.children.length - 1].getAttribute("data-digest-cap"), "", "cap 行为轮尾")
    assert.equal(digest.digestPresent([round()]), true, "在场判据 = 轮集非空（含终态轮 —— 留存）")
    assert.equal(digest.digestPresent([]), false, "空轮集 ⇒ 不在场")
  })
})

// ─── 腿 1b：单轮就地 + 守卫两径（settleFrame 真路）──────────────────────────────

test("腿 1b·单轮就地 + 守卫两径：轮元素落发生点；随流新块居其下；归档块守卫过 ⇒ 前插末轮元素之前 ∥ 守卫不过 ∥ 无轮 ⇒ 常规块插入点", async () => {
  await withFakeDom(() => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const user = blockOf.user("问题一")
    frame(root, { blocks: [user] }, [user])
    const userNode = root.querySelector('[data-block-kind="user"]')
    assert.ok(userNode !== null, "帧 1：常规块挂载（首块）")
    // 帧 2：`start` ⇒ 轮元素落流末（= 已挂块之后 —— 发生点）
    const r1 = round({ n: 2 })
    frame(root, { blocks: [user], digest: { [KEY]: [r1] } }, [], "none")
    const round1 = root.querySelector("[data-digest]")
    assert.ok(round1 !== null, "`start` 帧 ⇒ 轮元素在流（缺席自愈构树）")
    assert.ok(indexOf(root, round1) > indexOf(root, userNode), "轮元素居发生点（已挂块之下、流末）")
    // 帧 3：随流新块 ⇒ 居轮元素之后（轮行留发生位置、随流滚动）
    const reply = blockOf.assistant("回答一")
    frame(root, { blocks: [user, reply], digest: { [KEY]: [r1] } }, [reply])
    const replyNode = root.querySelector('[data-block-kind="assistant"]')
    assert.ok(indexOf(root, replyNode) > indexOf(root, round1), "常规新块随流居轮行之下")
    // 帧 4：归档块（守卫不过 —— 末轮元素之后已有块）⇒ 常规块插入点（两径皆落块序尾位）
    const sub = blockOf.subagent(1)
    frame(root, { blocks: [user, reply, sub], digest: { [KEY]: [r1] } }, [sub])
    const subNode = root.querySelector('[data-block-kind="subagent"]')
    assert.ok(subNode !== null, "归档块挂载")
    assert.ok(indexOf(root, subNode) > indexOf(root, replyNode), "守卫不过 ⇒ 落块序尾位（常规块插入点）")
    assert.deepEqual(blockRefs(root), [userNode, replyNode, subNode], "DOM 块节点序 ≡ visible（§2 不变式两径不破）")
    // 守卫过径（另起一景）：块序列 + 末轮元素（其后无块）⇒ 前插末轮元素之前
    const root2 = new FakeNode("div")
    root2.__connected = true
    frame(root2, { blocks: [user] }, [user])
    const userNode2 = root2.querySelector('[data-block-kind="user"]')
    const r2 = round({ n: 1 })
    frame(root2, { blocks: [user], digest: { [KEY]: [r2] } }, [], "none")
    const round2 = root2.querySelector("[data-digest]")
    const sub2 = blockOf.subagent(2)
    frame(root2, { blocks: [user, sub2], digest: { [KEY]: [r2] } }, [sub2])
    const sub2Node = root2.querySelector('[data-block-kind="subagent"]')
    assert.ok(indexOf(root2, sub2Node) < indexOf(root2, round2), "守卫过 ⇒ 归档块前插末轮元素之前")
    assert.ok(indexOf(root2, sub2Node) > indexOf(root2, userNode2), "前插位 = 块序尾位（旧块之下）")
    assert.deepEqual(blockRefs(root2), [userNode2, sub2Node], "守卫过径：块节点序 ≡ visible")
    // 多轮下守卫过 ⇒ 前插「末轮」元素之前（非首轮）
    const root4 = new FakeNode("div")
    root4.__connected = true
    frame(root4, { blocks: [user] }, [user])
    const userNode4 = root4.querySelector('[data-block-kind="user"]')
    const r4 = round({ n: 1 })
    frame(root4, { blocks: [user], digest: { [KEY]: [r4] } }, [], "none")
    const r5 = round({ n: 1 })
    frame(root4, { blocks: [user], digest: { [KEY]: [r4, r5] } }, [], "none")
    const els4 = roundRefs(root4)
    assert.equal(els4.length, 2, "二轮元素在场")
    const sub5 = blockOf.subagent(5)
    frame(root4, { blocks: [user, sub5], digest: { [KEY]: [r4, r5] } }, [sub5])
    const sub5Node = root4.querySelector('[data-block-kind="subagent"]')
    assert.ok(indexOf(root4, sub5Node) < indexOf(root4, els4[1]), "前插位 = 末轮元素之前")
    assert.ok(indexOf(root4, sub5Node) > indexOf(root4, els4[0]), "首轮元素零扰（前插不进首轮之前）")
    assert.ok(indexOf(root4, sub5Node) > indexOf(root4, userNode4), "前插位 = 块序尾位（旧块之下）")
    // 无轮退化（守卫不过特例）⇒ 流末
    const root3 = new FakeNode("div")
    root3.__connected = true
    frame(root3, { blocks: [user] }, [user])
    const userNode3 = root3.querySelector('[data-block-kind="user"]')
    const sub4 = blockOf.subagent(4)
    frame(root3, { blocks: [user, sub4] }, [sub4])
    const sub4Node = root3.querySelector('[data-block-kind="subagent"]')
    assert.ok(indexOf(root3, sub4Node) > indexOf(root3, userNode3), "无轮 ∥ 元素缺 = 守卫不过特例 ⇒ 流末退化")
    // 同帧组合序（守卫「挂载点逐枚现读」）：tail = [常规块, 归档块] —— 常规块先落流末 ⇒ 归档块守卫随之翻转 ⇒ 落块序尾位
    const root5 = new FakeNode("div")
    root5.__connected = true
    frame(root5, { blocks: [user] }, [user])
    const userNode5 = root5.querySelector('[data-block-kind="user"]')
    const r6 = round({ n: 1 })
    frame(root5, { blocks: [user], digest: { [KEY]: [r6] } }, [], "none")
    const round5 = root5.querySelector("[data-digest]")
    const reply5 = blockOf.assistant("同帧答复")
    const sub6 = blockOf.subagent(6)
    frame(root5, { blocks: [user, reply5, sub6], digest: { [KEY]: [r6] } }, [reply5, sub6])
    const refs5 = blockRefs(root5)
    assert.equal(refs5.length, 3, "同帧两枚（常规 + 归档）挂载")
    assert.equal(refs5[1].getAttribute("data-block-kind"), "assistant", "常规块在位（中位）")
    assert.equal(refs5[2].getAttribute("data-block-kind"), "subagent", "归档块在位（末位）")
    assert.ok(indexOf(root5, refs5[1]) > indexOf(root5, round5), "常规块随流居轮行之下")
    assert.ok(indexOf(root5, refs5[2]) > indexOf(root5, refs5[1]), "同帧后到归档块落块序尾位（前枚常规块翻转守卫 ⇒ 退化径）")
    assert.deepEqual(blockRefs(root5), [userNode5, refs5[1], refs5[2]], "DOM 块节点序 ≡ visible（组合序不破）")
  })
})

// ─── 腿 2：多轮发生序 + 跨帧身份零动 ─────────────────────────────────────────

test("腿 2·多轮发生序 + 跨帧身份零动：文档序 = 发生序；旧元素 ∕ 行身份零动（同态零写）；R1 之后仍有块内容", async () => {
  await withFakeDom(() => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const user = blockOf.user("q")
    frame(root, { blocks: [user] }, [user])
    const r1 = round({ n: 1 })
    frame(root, { blocks: [user], digest: { [KEY]: [r1] } }, [], "none")
    const e1 = root.querySelector("[data-digest]")
    const label1 = e1.querySelector("[data-digest-label]")
    const count1 = e1.querySelector("[data-digest-count]")
    const reply = blockOf.assistant("a")
    const r2 = round({ n: 3 })
    frame(root, { blocks: [user, reply], digest: { [KEY]: [r1, r2] } }, [reply])
    const replyNode = root.querySelector('[data-block-kind="assistant"]')
    const els = roundRefs(root)
    assert.equal(els.length, 2, "逐轮元素（R1 ∕ R2 各一枚）")
    assert.equal(els[0], e1, "R1 元素身份零动（跨帧复用）")
    assert.equal(els[0].querySelector("[data-digest-label]"), label1, "R1 标签行身份零动")
    assert.equal(els[0].querySelector("[data-digest-count]"), count1, "R1 计数行身份零动")
    assert.ok(indexOf(root, els[0]) < indexOf(root, els[1]), "元素文档序 = 发生序（R1 → R2）")
    assert.ok(indexOf(root, els[0]) < indexOf(root, replyNode), "非尾聚：R1 之后仍有块内容（随流下延）")
    assert.ok(indexOf(root, els[1]) > indexOf(root, replyNode), "R2 落流末（新轮 = 时点最新）")
    // 同态帧 ⇒ 零写 ∨ 身份零动
    const probes = [els[0], label1, count1, els[1]].map((node) => spyWrites(node))
    frame(root, { blocks: [user, reply], digest: { [KEY]: [r1, r2] } }, [], "none")
    assert.equal(roundRefs(root)[0], e1, "同态帧 ⇒ R1 元素零重建")
    assert.equal(roundRefs(root)[1], els[1], "同态帧 ⇒ R2 元素零重建")
    assert.deepEqual(probes.map((p) => [p.text, p.attr]), [[0, 0], [0, 0], [0, 0], [0, 0]], "同态帧 ⇒ 零 DOM 写（逐行等价）")
    // 终态就地刷（R2 `end`）⇒ 元素 ∕ 行身份存续
    const done = round({ n: 3, status: "end", ok: true, ms: 1500 })
    frame(root, { blocks: [user, reply], digest: { [KEY]: [r1, done] } }, [], "none")
    const count2 = roundRefs(root)[1].querySelector("[data-digest-count]")
    assert.equal(roundRefs(root)[1], els[1], "终态帧 ⇒ R2 元素身份存续")
    assert.equal(count2, els[1].querySelector("[data-digest-count]"), "终态就地刷（行身份存续）")
    assert.equal(count2.textContent, i18n.t("digest.done", { n: 3, seconds: "1.5" }), "终态文就地落（单源）")
    assert.equal(roundRefs(root)[0], e1, "前轮零扰")
  })
})

// ─── 腿 3：切回 ∕ 清点（收缩 = 保尾去首）─────────────────────────────────────

test("腿 3·切回 ∕ 清点：收缩 = 保尾去首（末元素原位存续）；全终态 ⇒ 零元素；零载体 ⇒ 原引用零写", async () => {
  await withFakeDom(() => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const r1 = round({ n: 1 })
    const r2 = round({ n: 4 })
    digest.syncDigest(root, { digest: [r1, r2] }, null)
    const els = roundRefs(root)
    assert.equal(els.length, 2, "两轮元素在场")
    const end = round({ n: 4, status: "end", ok: false, ms: 2000 })
    digest.syncDigest(root, { digest: [end] }, null) // 首屏清点后同帧：轮集收缩为末轮
    const live = roundRefs(root)
    assert.equal(live.length, 1, "收缩 ⇒ 前元素摘除（去首）")
    assert.equal(live[0], els[1], "存活元素 = 末元素原位存续（保尾 —— 身份零动）")
    assert.equal(live[0].querySelector("[data-digest-count]").textContent, i18n.t("digest.aborted", { seconds: "2.0" }), "末轮数据就地刷（不落首元素位）")
    // 全终态 ⇒ 键删（清点）⇒ 零八素
    const cleared = digest.clearDigest({ [KEY]: [end, end] }, KEY)
    assert.equal(Object.hasOwn(cleared, KEY), false, "全终态 ⇒ 键删（存量痕清）")
    digest.syncDigest(root, { digest: cleared[KEY] ?? null }, null)
    assert.equal(roundRefs(root).length, 0, "轮集空 ⇒ 零元素（全终态零残留）")
    // 零载体 ⇒ 原引用零写 ∥ 缺根 ∥ 无元素零抛
    const keep = { [KEY]: [round()] }
    assert.equal(digest.clearDigest(keep, KEY), keep, "保末轮即原样 ⇒ 原引用（零写）")
    assert.equal(digest.clearDigest(null, KEY), null, "null ⇒ 原引用（零写）")
    const blank = new FakeNode("div")
    assert.doesNotThrow(() => digest.syncDigest(blank, { digest: [round()] }, null), "无计时 ∕ 无轮元素根：syncDigest 建元素零抛")
    assert.doesNotThrow(() => digest.syncDigest(null, { digest: null }, null), "缺根 ⇒ 零动作")
  })
})

// ─── 引用面收正（`[data-digest]` 选择符语义 = 元素集）──────────────────────────

test("引用面收正：`blockAnchor` ∕ `compressAnchorOf` 去 `[data-digest]` 首锚；`digestBoundaryOf` 守卫两径；再出口 identity", async () => {
  await withFakeDom(() => {
    zh()
    const root = new FakeNode("div")
    const blockA = new FakeNode("div")
    blockA.setAttribute("data-block-kind", "user")
    const r1 = dom.build(digest.digestRoundNode(round({ n: 1 })))
    const r2 = dom.build(digest.digestRoundNode(round({ n: 1 })))
    const timer = dom.build(chrome.timerGroupNode({ text: "到期" }))
    root.append(blockA)
    root.append(r1)
    root.append(r2)
    root.append(timer)
    assert.equal(chrome.blockAnchor(root), timer, "blockAnchor 去首锚 `[data-digest]` ⇒ 尾组锚（常规新块落轮行之下）")
    assert.equal(compress.compressAnchorOf(root), timer, "compressAnchorOf 同去首锚 ⇒ 尾组锚（创建点 = 流末）")
    assert.equal(digest.digestBoundaryOf(root, chrome.blockAnchor(root)), r2, "守卫过（末轮元素即块序尾位）⇒ 末轮元素")
    const late = new FakeNode("div")
    late.setAttribute("data-block-kind", "assistant")
    root.append(late)
    assert.equal(digest.digestBoundaryOf(root, chrome.blockAnchor(root)), chrome.blockAnchor(root), "守卫不过（其后有块）⇒ 回落常规块插入点")
    const bare = new FakeNode("div")
    assert.equal(digest.digestBoundaryOf(bare, null), null, "无轮 ∥ 元素缺 = 守卫不过特例（回落面由调用面给）")
    assert.equal(digest.digestBoundaryOf(null, "F"), "F", "缺根 ⇒ 回落原样")
    assert.equal(chrome.digestRoundNode, digest.digestRoundNode, "再出口 identity：digestRoundNode")
    assert.equal(chrome.digestPresent, digest.digestPresent, "再出口 identity：digestPresent")
    assert.equal(chrome.digestBoundaryOf, digest.digestBoundaryOf, "再出口 identity：digestBoundaryOf")
    assert.equal(typeof digest.syncDigest, "function", "syncDigest 导出在场（帧尾两径消费）")
    assert.equal(digest.digestGroupNode, undefined, "旧组树导出退场（单组形零残留）")
    const digestSrc = readFileSync(resolve(ROOT, "thincoder-desktop/renderer/views/chat-digest.mjs"), "utf8")
    assert.doesNotMatch(digestSrc, /querySelector\("\[data-digest\]"\)/, "单数取件（`querySelector(\"[data-digest]\")`）零残留")
    assert.match(digestSrc, /querySelectorAll\("\[data-digest\]"\)/, "帧刷按元素集取件（文档序）")
  })
})
