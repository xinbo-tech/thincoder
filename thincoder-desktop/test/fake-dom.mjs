/**
 * fake-dom.mjs — 假 DOM 载体（**非用例档 → 不入 `test/files.mjs`**：档名非 `*.test.mjs` ⇒ `test/run.mjs`
 * 反查面不收集；被 `views-approval` / `views-activity` / `views-chat-frame` 三档 import，供**落点面**判据
 * —— 构树面判据仍走纯描述符，本档只补「描述符 → 节点」那一段的机检）。
 * 面 = `renderer/dom.mjs` 实读消费面 + **核构件面**（R3c：类 / 标签选择器——
 * `attachCopyButtons` 用 `.code-block` / `.code-copy-btn` / `code`；`className` / `appendChild` / `innerHTML`）：
 * `createElement` / `append` / `appendChild` / `insertBefore`（锚缺 ⇒ **抛**，同真 DOM 语义）/ `prepend` /
 * `replaceChildren` / `remove` / `replaceWith` / `textContent` / `innerHTML`（**不解析 HTML** —— 存串供断言；
 * 选择器面零 HTML 结构）/ `className` / `addEventListener` / 属性四件（`set` / `get` / `remove` / `getAttributeNames`）/ `childNodes`。
 * `querySelector(All)` 收四形：`[name]` / `[name="value"]` / `.class` / `<tag>`（本端 + 核件选择器闭集）——表外**显式抛**：
 * 假面不静默给空（否则「选择器改了而断言仍绿」= 静默假绿）。
 * 写计三档（**幂等断言只看 structural / text**）：`structural` = 节点进出（append / insertBefore / prepend /
 * replaceChildren / remove / replaceWith · 按实际移动数计，纯空转 = 0 写）· `text` = `textContent` setter ·
 * `attr` = `setAttribute` / `removeAttribute`（本端每帧恒写根锚 ⇒ attr 不入幂等判）。
 */
import assert from "node:assert/strict"

class FakeNode {}

class FakeText extends FakeNode {
  constructor(data) {
    super()
    this.data = String(data)
    this.parent = null
  }

  get textContent() { return this.data }
  set textContent(value) { this.data = String(value) }
}

class FakeElement extends FakeNode {
  constructor(tag, writes) {
    super()
    this.tag = tag
    this.writes = writes
    this.attrs = new Map()
    this.children = []
    this.listeners = new Map()
    this.parent = null
  }

  get childNodes() { return this.children }

  /** `className` ⇒ `class` 属性（核件 `btn.className = …` 与选择器面同源 —— 真 DOM 同义）。 */
  get className() { return this.attrs.get("class") ?? "" }
  set className(value) { this.setAttribute("class", String(value)) }

  /** `classList` 最小面（核件 `attachCopyButtons` 用 `add` / `remove`；`contains` / `toggle` 同源补齐 ——
   *  与 `class` 属性同源，非独立存储）。 */
  get classList() {
    const owner = this
    const list = () => String(owner.attrs.get("class") ?? "").split(/\s+/).filter(Boolean)
    const write = (names) => owner.setAttribute("class", names.join(" "))
    return {
      contains: (name) => list().includes(String(name)),
      add: (...names) => write([...new Set([...list(), ...names.map(String)])]),
      remove: (...names) => write(list().filter((item) => !names.map(String).includes(item))),
      toggle: (name, force) => {
        const on = force === undefined ? !list().includes(String(name)) : force === true
        if (on) write([...new Set([...list(), String(name)])])
        else write(list().filter((item) => item !== String(name)))
        return on
      },
    }
  }

  /** 核 Markdown 呈现面（`dom.mjs` `html` prop 落点）：假面**不解析 HTML** —— 存串供断言（选择器面零 HTML 结构）。 */
  get innerHTML() { return this._html ?? "" }
  set innerHTML(value) { this._html = String(value) }

  get textContent() { return this.children.map((child) => child.textContent).join("") }
  set textContent(value) {
    this.writes.text += 1
    const node = new FakeText(value)
    node.parent = this
    this.children = [node]
  }

  append(...kids) {
    for (const kid of kids) {
      const node = kid instanceof FakeNode ? kid : new FakeText(kid)
      node.parent = this
      this.children.push(node)
      this.writes.structural += 1
    }
  }

  /** 核件面（`attachCopyButtons` 等用真 DOM 的 `appendChild` —— 与 `append` 同义单枚）。 */
  appendChild(node) { this.append(node); return node }

  /** 锚缺 ⇒ 抛（真 DOM `NotFoundError` 同义）：假面不得把「插点落空」静默降级成末插。 */
  insertBefore(node, anchor) {
    if (anchor !== null && anchor !== undefined && !this.children.includes(anchor)) {
      throw new Error("fake-dom: insertBefore anchor 不在子序（真 DOM 语义 ⇒ 抛）")
    }
    const at = anchor === null || anchor === undefined ? this.children.length : this.children.indexOf(anchor)
    node.parent = this
    this.children.splice(at, 0, node)
    this.writes.structural += 1
  }

  prepend(node) {
    node.parent = this
    this.children.unshift(node)
    this.writes.structural += 1
  }

  replaceChildren(...kids) {
    this.writes.structural += this.children.length
    this.children = []
    this.append(...kids)
  }

  remove() {
    if (this.parent === null) return
    const at = this.parent.children.indexOf(this)
    if (at > -1) this.parent.children.splice(at, 1)
    this.parent = null
    this.writes.structural += 1
  }

  replaceWith(node) {
    if (this.parent === null) return
    const at = this.parent.children.indexOf(this)
    this.parent.children[at] = node
    node.parent = this.parent
    this.parent = null
    this.writes.structural += 1
  }

  setAttribute(name, value) {
    this.attrs.set(String(name), String(value))
    this.writes.attr += 1
  }

  getAttribute(name) { return this.attrs.has(String(name)) ? this.attrs.get(String(name)) : null }
  removeAttribute(name) { this.attrs.delete(String(name)); this.writes.attr += 1 }
  getAttributeNames() { return [...this.attrs.keys()] }
  addEventListener(type, listener) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]) }

  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }

  /** 后代（**不含自身** · DFS 前序 = 文档序）逐点匹配；表外选择器 ⇒ 抛。 */
  querySelectorAll(selector) {
    const match = parseSelector(selector)
    const hit = []
    const visit = (node) => {
      for (const kid of node.children) {
        if (!(kid instanceof FakeElement)) continue
        if (match(kid)) hit.push(kid)
        visit(kid)
      }
    }
    visit(this)
    return hit
  }
}

const CLASS_SELECTOR = /^\.([A-Za-z0-9_-]+)$/
const TAG_SELECTOR = /^[a-z][a-z0-9-]*$/i
const ATTRIBUTE_SELECTOR = /^\[([A-Za-z0-9_:.-]+)(?:="([^"]*)")?\]$/

/** 选择器解析（四形闭集 —— `[name]` / `[name="value"]` / `.class` / `<tag>`）：返回逐点谓词；表外 ⇒ 抛。 */
function parseSelector(selector) {
  const text = String(selector)
  const attr = ATTRIBUTE_SELECTOR.exec(text)
  if (attr !== null) {
    const [, name, value] = attr
    return (node) => node.attrs.has(name) && (value === undefined || node.attrs.get(name) === value)
  }
  const cls = CLASS_SELECTOR.exec(text)
  if (cls !== null) {
    const name = cls[1]
    return (node) => String(node.attrs.get("class") ?? "").split(/\s+/).includes(name)
  }
  if (TAG_SELECTOR.test(text)) {
    const tag = text.toLowerCase()
    return (node) => String(node.tag).toLowerCase() === tag
  }
  throw new Error(`fake-dom: 表外选择器 ${text}（只收 [name] / [name="value"] / .class / <tag> —— 假面不静默给空）`)
}

/** 装表：`globalThis.Node` / `document` 置为假面（`restore()` 复原 —— 用例以 `ctx.after(restore)` 收尾）。 */
export function installFakeDom() {
  const previous = { Node: globalThis.Node, document: globalThis.document }
  const writes = { structural: 0, text: 0, attr: 0 }
  const document = { createElement: (tag) => new FakeElement(tag, writes) }
  globalThis.Node = FakeNode
  globalThis.document = document

  return {
    Node: FakeNode,
    document,
    writes,
    /** 写计读数点（幂等帧 = 前后 `delta` 两档皆 0）。 */
    mark: () => ({ ...writes }),
    delta(mark) {
      return {
        structural: writes.structural - mark.structural,
        text: writes.text - mark.text,
        attr: writes.attr - mark.attr,
      }
    },
    element: (tag = "div") => new FakeElement(tag, writes),
    /** 结构快照（tag + 属性 + 子序递归 · 文本节点降为裸串）—— 子序类断言的可读面。 */
    shape,
    find: (node, selector) => node.querySelector(selector),
    /** 派发监听（真注册面：`dom.mjs el()` 经 `addEventListener` 落点）。 */
    fire(node, type, event = {}) {
      const list = [...(node.listeners.get(type) ?? [])]
      for (const listener of list) listener(event)
      return list.length
    },
    restore() {
      if (previous.Node === undefined) delete globalThis.Node
      else globalThis.Node = previous.Node
      if (previous.document === undefined) delete globalThis.document
      else globalThis.document = previous.document
    },
  }
}

function shape(node) {
  if (node === null || node === undefined) return null
  if (node instanceof FakeText) return node.data
  if (!(node instanceof FakeElement)) return String(node)
  return {
    tag: node.tag,
    attrs: Object.fromEntries(node.attrs),
    children: node.children.map(shape),
  }
}

/** 自检（本档面判据）：装表 → 建树 → 属性 / 类 / 标签选择器 / `className` / `appendChild` / `innerHTML` /
 *  子序 / 写计 / 表外抛 一次走通（假面自身不可静默失效）。
 *  消费点 = 多档各一次（`views-approval` / `views-activity` / `views-chat` / `views-chat-frame` 假面段首行 —— 载体不自证即假绿源）。
 *  返回 `true`（调用点可断言）；内部装表自复原（`finally`），不扰外层假面。 */
export function selfCheck() {
  const fake = installFakeDom()
  try {
    assert.equal(typeof globalThis.Node, "function", "Node 置表")
    assert.equal(typeof globalThis.document.createElement, "function", "document 置表")
    const root = fake.element()
    const kid = document.createElement("span")
    kid.setAttribute("data-x", "1")
    root.append(kid)
    assert.equal(root.querySelector('[data-x="1"]'), kid, "属性选择器命中")
    assert.equal(root.querySelector("[data-x]"), kid, "[name] 形命中")
    assert.equal(root.querySelector("[data-y]"), null, "未命中 ⇒ null")
    assert.throws(() => root.querySelector("#id"), /表外选择器/, "表外选择器 ⇒ 抛（不静默给空）")
    assert.throws(() => root.insertBefore(fake.element(), fake.element()), /anchor/, "锚缺 ⇒ 抛")
    // 核构件面（R3c）：类 / 标签选择器 + `className` / `appendChild` / `innerHTML`
    const pre = document.createElement("pre")
    pre.className = "code-block"
    pre.innerHTML = "<code>x</code>"
    const btn = document.createElement("button")
    btn.className = "code-copy-btn"
    btn.textContent = "copy"
    root.appendChild(pre)
    pre.appendChild(btn)
    assert.equal(root.querySelectorAll(".code-block").length, 1, "类选择器命中")
    assert.equal(root.querySelector(".code-block").querySelector("code"), null, "HTML 不解析 （`innerHTML` 存串）")
    assert.equal(pre.innerHTML, "<code>x</code>", "innerHTML 读回 = 写入串")
    assert.equal(root.querySelector("pre"), pre, "标签选择器命中")
    assert.equal(root.querySelectorAll("button").length, 1, "标签选择器（嵌套）命中")
    assert.equal(btn.className, "code-copy-btn", "className 读回 = 写入值")
    const before = fake.mark()
    root.setAttribute("data-x", "2")
    assert.deepEqual(fake.delta(before), { structural: 0, text: 0, attr: 1 }, "attr 档单计")
    const noop = fake.mark()
    root.replaceChildren()
    assert.deepEqual(fake.delta(noop), { structural: 2, text: 0, attr: 0 }, "摘两枚（kid / pre 子树）⇒ 两写（structural；子树随摘不计）")
    assert.equal(root.textContent, "", "摘空 ⇒ 零文本")
    return true
  } finally {
    fake.restore()
  }
}
