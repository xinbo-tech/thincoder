/**
 * 2026-09-29-desktop-compress-row-pin.test.mjs — #674 压缩行位置冻结（批内件 · 平 node）。
 * ⚠ 断代失效（2026-09-30 · 台账 #731 核处）：本件白盒断言所测内部形态已随后续批次演进（#719 消化面重构 ∥ chat-tree 拆档 ∥ 锚链序变更等）——重跑必红为预期；特性现形态的回归锚以近期批件为准。本件留档参考，勿按红态排障。
 *
 * 判据表 = 批档 §2.3 用例表 A1–A4 ∕ B1–B5（单源：`docs/batches/2026-09-29-desktop-compress-row-pin.md`；
 * 现行有效 = §2.9 修正轮；机制单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）。
 * 红 ∕ 绿规程：修前（`blockAnchor` 首锚 = `[data-compress]`）⇒ A1–A3 ∕ B1–B3 红；落修（链去首锚）⇒ 全绿。
 * 本件不入仓套件；跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-09-29-desktop-compress-row-pin.test.mjs`。
 */
import test from "node:test"
import assert from "node:assert/strict"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const { blockAnchor } = await import("../../thincoder-desktop/renderer/views/chat-chrome.mjs")
const { initDict } = await import("../../thincoder-desktop/renderer/i18n.mjs")
const { chatModel } = await import("../../thincoder-desktop/renderer/views/chat-model.mjs")
const { mountChat, settleFrame } = await import("../../thincoder-desktop/renderer/views/chat.mjs")

// ─── 假 DOM（迷你解析 ∕ 属性 ∕ 选择器〔属性式 + `.class` 式 —— 核卡工厂取 `.approve` 等面〕）──

const VOID_TAGS = new Set(["br", "hr", "img", "input"])
const P_CLOSERS = new Set(["p", "ul", "ol", "table", "blockquote", "pre", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "li", "tr", "td", "th", "div", "details"])

class FakeText {
  constructor(text, doc) { this.textContent = String(text); this.ownerDocument = doc; this.parentNode = null }
  get nextSibling() { const p = this.parentNode; return p ? p.children[p.children.indexOf(this) + 1] ?? null : null }
  remove() { if (this.parentNode) this.parentNode.removeChild(this) }
}

class FakeNode {
  constructor(tag = "div", doc = null) {
    this.tagName = String(tag).toUpperCase()
    this.ownerDocument = doc
    this.attrs = new Map()
    this.children = []
    this.parentNode = null
    this.scrollTop = 0
    this.scrollHeight = 0
    this.clientHeight = 0
    this._text = ""
    this._html = ""
  }
  get classList() {
    const self = this
    const read = () => String(self.getAttribute("class") ?? "").split(/\s+/).filter(Boolean)
    const write = (list) => self.setAttribute("class", list.join(" "))
    return {
      add: (...names) => write([...new Set([...read(), ...names])]),
      remove: (...names) => write(read().filter((name) => !names.includes(name))),
      contains: (name) => read().includes(name),
      toggle: (name, on) => (on ? write([...new Set([...read(), name])]) : write(read().filter((n) => n !== name))),
    }
  }
  get dataset() {
    const self = this
    return new Proxy({}, {
      get: (_, key) => self.getAttribute("data-" + String(key).replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())),
      set: (_, key, value) => { self.setAttribute("data-" + String(key).replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()), value); return true },
      has: (_, key) => self.getAttribute("data-" + String(key)) !== null,
    })
  }
  get textContent() {
    if (this.children.length === 0) return this._text ?? ""
    return (this._text ?? "") + this.children.map((c) => c.textContent).join("")
  }
  set textContent(value) { this._text = String(value ?? ""); this.children.length = 0 }
  get innerHTML() { return this._html ?? "" }
  set innerHTML(html) {
    this._text = ""
    this._html = String(html)
    this.children = []
    for (const node of parseHtml(this._html, this.ownerDocument ?? globalThis.document)) this.appendChild(node)
  }
  setAttribute(name, value) { this.attrs.set(name, String(value)) }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null }
  removeAttribute(name) { this.attrs.delete(name) }
  getAttributeNames() { return [...this.attrs.keys()] }
  addEventListener() {}
  removeEventListener() {}
  append(child) {
    if (child !== null && typeof child === "object") { child.parentNode = this; this.children.push(child) }
    else this.children.push(new FakeText(String(child), this.ownerDocument))
  }
  appendChild(child) { this.append(child); return child }
  get firstChild() { return this.children[0] ?? null }
  get lastChild() { return this.children[this.children.length - 1] ?? null }
  get childNodes() { return this.children }
  get nextSibling() { const p = this.parentNode; return p ? p.children[p.children.indexOf(this) + 1] ?? null : null }
  insertBefore(child, ref) {
    const at = ref === null || ref === undefined ? -1 : this.children.indexOf(ref)
    if (at < 0) { this.append(child); return child }
    child.parentNode = this
    this.children.splice(at, 0, child)
    return child
  }
  replaceChildren() { this.children.length = 0; this._text = "" }
  removeChild(node) { const at = this.children.indexOf(node); if (at >= 0) this.children.splice(at, 1); node.parentNode = null; return node }
  remove() { if (this.parentNode) this.parentNode.removeChild(this) }
  replaceWith(next) { const p = this.parentNode; if (!p) return; const at = p.children.indexOf(this); if (at >= 0) p.children.splice(at, 1, next); next.parentNode = p; this.parentNode = null }
  matches(selector) {
    const raw = String(selector).trim()
    if (raw.startsWith(".")) return String(this.getAttribute("class") ?? "").split(/\s+/).includes(raw.slice(1))
    const hit = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(raw)
    if (!hit) return false
    const value = this.getAttribute(hit[1])
    return hit[2] === undefined ? value !== null : value === hit[2]
  }
  querySelectorAll(selector) {
    const out = []
    const walk = (node) => { for (const child of node.children) { if (!child.matches) continue; if (child.matches(selector)) out.push(child); walk(child) } }
    walk(this)
    return out
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }
}

/** 迷你 HTML 解析（画件 ∕ 挂载两面的 `innerHTML` 面 —— 标签 ∕ 属性 ∕ 相邻文本合并）。 */
function parseHtml(html, doc) {
  const root = new FakeNode("#root", doc)
  const stack = [root]
  let i = 0
  const pushText = (raw) => {
    if (raw === "") return
    const siblings = stack[stack.length - 1].children
    const last = siblings[siblings.length - 1]
    if (last instanceof FakeText) { last.textContent += raw; return }
    const node = new FakeText(raw, doc)
    node.parentNode = stack[stack.length - 1]
    siblings.push(node)
  }
  while (i < html.length) {
    const lt = html.indexOf("<", i)
    if (lt < 0) { pushText(html.slice(i)); break }
    if (lt > i) pushText(html.slice(i, lt))
    const gt = html.indexOf(">", lt)
    if (gt < 0) { pushText(html.slice(lt)); break }
    const raw = html.slice(lt + 1, gt)
    i = gt + 1
    if (raw.startsWith("/")) {
      const name = raw.slice(1).trim().toUpperCase()
      for (let k = stack.length - 1; k > 0; k -= 1) if (stack[k].tagName === name) { stack.length = k; break }
      continue
    }
    const head = /^([a-zA-Z][\w-]*)([\s\S]*)$/.exec(raw)
    if (!head) continue
    const tag = head[1].toUpperCase()
    if (P_CLOSERS.has(head[1].toLowerCase()) && stack[stack.length - 1].tagName === "P") stack.pop()
    const node = new FakeNode(tag, doc)
    const attrRe = /([a-zA-Z-]+)(?:="([^"]*)")?/g
    let attr = attrRe.exec(head[2])
    while (attr) { node.attrs.set(attr[1].toLowerCase(), attr[2] ?? ""); attr = attrRe.exec(head[2]) }
    node.parentNode = stack[stack.length - 1]
    stack[stack.length - 1].children.push(node)
    if (!VOID_TAGS.has(head[1].toLowerCase())) stack.push(node)
  }
  return root.children
}

function fakeDoc() { return { createElement: (tag) => new FakeNode(tag, null), createTextNode: (t) => new FakeText(t, null) } }

// ─── 夹具 ─────────────────────────────────────────────────────────────────────

/** 假 DOM 置位（`build` 取 `document`；`fill` 走 `instanceof Node` —— 两处单点）→ 跑 fn → 复位。 */
async function withFakeDom(fn) {
  const doc = fakeDoc()
  const prevDoc = globalThis.document
  const prevNode = globalThis.Node
  globalThis.document = doc
  globalThis.Node = FakeNode
  try { return await fn(doc) } finally {
    globalThis.document = prevDoc
    globalThis.Node = prevNode
  }
}

/** 属性节点（锚单元面 —— 只标锚，不建子件）。 */
function anchorNode(doc, name, value = "") {
  const node = new FakeNode("div", doc)
  node.setAttribute(name, value)
  return node
}

/** 帧状态（键形与 `chat-model.mjs` 取数面一致：`compress[session]` ∕ `digest[session]` ∕ `pool.approvals`）。 */
function stateOf(blocks, extra = {}) {
  return { activeSession: "s1", locale: "zh-CN", blocks, following: true, hidden: 0, ...extra }
}

const A = { id: "a", kind: "user", text: "A" }
const B = { id: "b", kind: "assistant", text: "B" }
const C = { id: "c", kind: "assistant", text: "C" }
const D = { id: "d", kind: "assistant", text: "D" }
const START = { status: "start", messages: 3 }

/** 无动作帧计划（块面不变 —— `ev:compress` 等尾组事件帧同形）。 */
const NO_MOVE = { evict: 0, prepend: 0, tail: [], ok: true }

/** 追加帧计划（尾段一枚 —— append 真径）。 */
function appendPlan(block) { return { evict: 0, prepend: 0, tail: [block], ok: true } }

/** 子序记号（断言读数 —— 块 ⇒ `block`；尾组 ∕ 卡 ∕ 药丸 ⇒ 锚名）。 */
function seqOf(root) {
  return root.children.map((child) => {
    if (typeof child.getAttribute !== "function") return "text"
    if (child.getAttribute("data-block-kind") !== null) return "block"
    const anchors = [["data-compress", "compress"], ["data-digest", "digest"], ["data-timer", "timer"], ["data-stopped", "stopped"], ["data-ledger", "ledger"], ["data-card", "card"], ["data-pill", "pill"]]
    for (const [attr, name] of anchors) if (child.getAttribute(attr) !== null) return name
    return "other"
  })
}

// ─── A 面：`blockAnchor` 单元（链面 —— 压缩行去首）───────────────────────────

test("A1 仅行在场 ⇒ 锚 ≠ 行（null）—— 压缩行不在链上", () => {
  const doc = fakeDoc()
  const root = new FakeNode("div", doc)
  root.append(anchorNode(doc, "data-compress"))
  assert.equal(blockAnchor(root), null, "行不在链上（无他族员 ⇒ 末位 null）")
})

test("A2 行 + 消化行组 ⇒ 锚 = 消化行组（新块居行后）", () => {
  const doc = fakeDoc()
  const root = new FakeNode("div", doc)
  root.append(anchorNode(doc, "data-compress"))
  const digest = anchorNode(doc, "data-digest")
  root.append(digest)
  assert.equal(blockAnchor(root), digest, "锚 = 消化行组（链不收行）")
})

test("A3 行 + 停止痕 ∕ 卡 ∕ 药丸 ⇒ 锚 = 各后者", () => {
  const doc = fakeDoc()
  const cases = [
    [anchorNode(doc, "data-stopped"), "停止痕"],
    [anchorNode(doc, "data-card", "approval"), "卡节点"],
    [anchorNode(doc, "data-pill"), "药丸"],
  ]
  for (const [tail, name] of cases) {
    const root = new FakeNode("div", doc)
    root.append(anchorNode(doc, "data-compress"))
    root.append(tail)
    assert.equal(blockAnchor(root), tail, `行 + ${name} ⇒ 锚 = ${name}`)
  }
})

test("A4 无行 ⇒ 链面同旧（首族员）—— 回归", () => {
  const doc = fakeDoc()
  assert.equal(blockAnchor(new FakeNode("div", doc)), null, "零族员 ⇒ null（末位）")
  const root = new FakeNode("div", doc)
  const digest = anchorNode(doc, "data-digest")
  const timer = anchorNode(doc, "data-timer")
  root.append(digest)
  root.append(timer)
  assert.equal(blockAnchor(root), digest, "组面首员 = 消化行组（旧链序）")
  const root2 = new FakeNode("div", doc)
  const ledger = anchorNode(doc, "data-ledger")
  const pill = anchorNode(doc, "data-pill")
  root2.append(ledger)
  root2.append(pill)
  assert.equal(blockAnchor(root2), ledger, "台账行组先于药丸（旧链序）")
})

// ─── B 面：`settleFrame` 帧径（插入点实体 —— 行创建点冻结）───────────────────

test("B1 append 真径：[A,B,行] + C ⇒ [A,B,行,C]（新块居行下）", async () => {
  await withFakeDom((doc) => {
    initDict({})
    const root = new FakeNode("div", doc)
    const first = mountChat(root, stateOf([A, B], { compress: { s1: START } }), {})
    assert.deepEqual(seqOf(root), ["block", "block", "compress"], "初树 = [A,B,行]")
    const mounted = settleFrame(root, chatModel(stateOf([A, B, C], { compress: { s1: START } })), null, appendPlan(C), "append", {}, first.mounted)
    assert.deepEqual(seqOf(root), ["block", "block", "compress", "block"], "C 居行下（不插行前）")
    assert.equal(root.children.indexOf(root.querySelector("[data-compress]")), 2, "行停创建点（第 2 位）")
    assert.equal(root.children.indexOf(mounted[mounted.length - 1].node), 3, "C 落行后")
  })
})

test("B2 续帧：再 + D ⇒ [A,B,行,C,D]（行不逐帧漂尾）", async () => {
  await withFakeDom((doc) => {
    initDict({})
    const root = new FakeNode("div", doc)
    const first = mountChat(root, stateOf([A, B], { compress: { s1: START } }), {})
    const m1 = settleFrame(root, chatModel(stateOf([A, B, C], { compress: { s1: START } })), null, appendPlan(C), "append", {}, first.mounted)
    const m2 = settleFrame(root, chatModel(stateOf([A, B, C, D], { compress: { s1: START } })), null, appendPlan(D), "append", {}, m1)
    assert.deepEqual(seqOf(root), ["block", "block", "compress", "block", "block"], "两帧后 = [A,B,行,C,D]")
    assert.equal(root.children.indexOf(root.querySelector("[data-compress]")), 2, "行仍停创建点")
    assert.equal(root.children.indexOf(m2[m2.length - 1].node), 4, "D 落 C 下")
  })
})

test("B3 尾组在场：[A,B,行,digest] + C ⇒ [A,B,行,C,digest]", async () => {
  await withFakeDom((doc) => {
    initDict({})
    const digest = { s1: { status: "start", n: 1 } }
    const root = new FakeNode("div", doc)
    const first = mountChat(root, stateOf([A, B], { compress: { s1: START }, digest }), {})
    assert.deepEqual(seqOf(root), ["block", "block", "compress", "digest"], "初树 = [A,B,行,digest]")
    const m1 = settleFrame(root, chatModel(stateOf([A, B, C], { compress: { s1: START }, digest })), null, appendPlan(C), "append", {}, first.mounted)
    assert.deepEqual(seqOf(root), ["block", "block", "compress", "block", "digest"], "C 落行后、组前")
    assert.equal(root.children.indexOf(m1[m1.length - 1].node), 3, "C 位 = 行下第一位")
  })
})

test("B4 换代原位：start→done ⇒ 序不变 ∕ 同址换（冻结点不动）", async () => {
  await withFakeDom((doc) => {
    initDict({})
    const root = new FakeNode("div", doc)
    const first = mountChat(root, stateOf([A, B], { compress: { s1: START } }), {})
    const row = root.querySelector("[data-compress]")
    const index = root.children.indexOf(row)
    const done = { s1: { status: "done", tokensFreed: 1200, elapsedMs: 3400 } }
    settleFrame(root, chatModel(stateOf([A, B], { compress: done })), null, NO_MOVE, "none", {}, first.mounted)
    const after = root.querySelector("[data-compress]")
    assert.deepEqual(seqOf(root), ["block", "block", "compress"], "序不变（换代不离位）")
    assert.notEqual(after, row, "同址换（换代 ⇒ 原位换新节点）")
    assert.equal(root.children.indexOf(after), index, "位置不动（零序跳）")
    assert.ok(String(after.getAttribute("class")).includes("compress-done"), "四态词面随动（done 类）")
  })
})

test("B5 随后创建落点：[A,B,行] + digest ∕ 卡 ∕ 药丸 ⇒ 皆落行后", async () => {
  await withFakeDom((doc) => {
    initDict({})
    const s1 = stateOf([A, B], { compress: { s1: START } })
    const s2 = { ...s1, digest: { s1: { status: "start", n: 1 } } }
    const s3 = { ...s2, pool: { approvals: [{ promptId: "p1", tool: "bash", argsSummary: "echo hi" }] } }
    const s4 = { ...s3, following: false }
    const root = new FakeNode("div", doc)
    let mounted = mountChat(root, s1, {}).mounted
    const rowIndex = () => root.children.indexOf(root.querySelector("[data-compress]"))
    mounted = settleFrame(root, chatModel(s2), null, NO_MOVE, "none", {}, mounted)
    const digest = root.querySelector("[data-digest]")
    assert.ok(digest !== null && root.children.indexOf(digest) > rowIndex(), "消化行组落行后")
    mounted = settleFrame(root, chatModel(s3), null, NO_MOVE, "none", {}, mounted)
    const card = root.querySelector('[data-card="approval"]')
    assert.ok(card !== null && root.children.indexOf(card) > rowIndex(), "审批卡落行后")
    mounted = settleFrame(root, chatModel(s4), null, NO_MOVE, "none", {}, mounted)
    const pill = root.querySelector("[data-pill]")
    assert.ok(pill !== null && root.children.indexOf(pill) > rowIndex(), "药丸落行后")
    assert.deepEqual(seqOf(root), ["block", "block", "compress", "digest", "card", "pill"], "总序 = [A,B,行,digest,卡,药丸]")
  })
})
