/**
 * 2026-09-29-perf-residuals.test.mjs — #619 增量 md 机制（KD-RC-10）+ 桌面组合档（KD-50）+ VSC 复证（批内件 · 平 node）。
 *
 * 判据表 = 批档 §2.7 A 表 AC-1..AC-7（单源：`docs/render-core/design/RENDER-CORE.md` §2 KD-RC-10 ∕ §5 ∕ §7 C12–C13；
 * `docs/desktop/design/RENDERER.md` §1.2 ∕ §2 ∕ §3；`docs/desktop/design/PROJECT.md` §2 KD-50）。
 * 本件不入党仓套件（全清令）；跑法：`node --test .thincoder/tmp/2026-09-29-perf-residuals.test.mjs`（父侧 copy 入
 * `docs/batches/` 后同跑；本件相对取径按两层深对齐 —— 与 `docs/batches/` 一致）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const { md } = await import("../../thincoder-render-core/md.mjs")
const { liveCut, tailHeadEnd } = await import("../../thincoder-render-core/flow/live-scan.mjs")
const { paintLiveMd, liveInline } = await import("../../thincoder-render-core/flow/live-md.mjs")
const { appendToolOutput, paintStreamTarget, createStreamRenderer } = await import("../../thincoder-render-core/flow/stream.mjs")
const { capText, MAX_TOOL_OUTPUT } = await import("../../thincoder-render-core/lib.mjs")
const { streamDelta, alignPlan, paintPlan } = await import("../../thincoder-desktop/renderer/views/chat-stream.mjs")

// ─── 假 DOM（迷你解析 ∕ 属性 ∕ 选择器；画件与桌面挂载两面共用）────────────────────

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
    const hit = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(selector)
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

/** 结构归一：标签 ∕ class 序列 + 相邻文本合并（R-9 比对面 —— 空文本节点不出面）。 */
function norm(node) {
  const out = []
  const walk = (n) => {
    if (n instanceof FakeText) {
      if (n.textContent === "") return
      const last = out[out.length - 1]
      if (last && last.startsWith("t:")) out[out.length - 1] = last + n.textContent
      else out.push("t:" + n.textContent)
      return
    }
    const cls = n.getAttribute("class")
    out.push("<" + n.tagName.toLowerCase() + (cls ? "." + cls : "") + ">")
    for (const child of n.children) walk(child)
    out.push("</" + n.tagName.toLowerCase() + ">")
  }
  for (const child of node.children) walk(child)
  return out.join("")
}

function fakeDoc() { return { createElement: (tag) => new FakeNode(tag, null), createTextNode: (t) => new FakeText(t, null) } }

/** 参照面解析：`md(text)` 的 DOM 归一（全量参照 —— 增量面须 ≡）。 */
function referenceNorm(text, doc) {
  const box = new FakeNode("div", doc)
  box.innerHTML = md(text)
  return norm(box)
}

// ─── 语料（八类：纯段 ∕ 空行分段 ∕ 密文行内 ∕ 悬空尾 ∕ 围栏 ∕ 列表 ∕ 混合 CJK ∕ 转义）──

const PARA = "这是一段正文内容，含 **粗体** 与 `code` 行内码，用来逼近真实 markdown 重渲成本。"
const CORPUS = [
  ["纯段", "abcd efgh 连续文本无空行"],
  ["纯段", PARA],
  ["空行分段", "第一段\n\n第二段有 **加粗**。\n\n第三段收尾。"],
  ["密文行内", "密：**粗**与`码`与*斜*与~~删~~与 [链接](https://x.y) 反复：" + "**粗**`码`".repeat(6)],
  ["悬空尾", "悬空：`code 未闭"],
  ["悬空尾", "悬空2：**粗体 未闭"],
  ["悬空尾", "悬空3：尾反引`"],
  ["围栏", "围栏：\n\n```js\nconst a = 1\n```\n\n后文"],
  ["围栏", "未闭围栏：\n\n```js\nconst a = 1\nx"],
  ["列表", "列表：\n\n- 甲\n- 乙\n\n完"],
  ["列表", "编号：\n\n1. 一\n2. 二\n\n尾"],
  ["混合 CJK", "混合 CJK 与 English 与数字 123\n换行续写 `x` 与 **y**"],
  ["转义", "转义：\\*不是星\\* 与 \\`不是码\\` 文本。"],
  ["转义", "尾转义：abc\\"],
  ["表格", "| a |\n|---|\n| b |\n\nxyz"],
  ["引用", "> quote\n\nxyz"],
  ["题头", "## 标题\n\n正文 **粗**"],
]

// ─── AC-1 `liveCut` 冻结切点（保守律：可证才放行）────────────────────────────

test("AC-1 T1 段内封闭推进：纯文本 ∕ 已闭行内构造处可切，未闭者退至其前", () => {
  const plain = "abcd efgh"
  assert.deepEqual(liveCut(plain, 0), { cut: plain.length, blockStart: 0, inline: true }, "纯段全冻结（无未证构造）")
  const bold = "abc **b** def"
  assert.equal(liveCut(bold, 0).cut, bold.length, "已闭粗体在冻结区内 ⇒ 全冻结")
  const dangling = "abc **b def"
  assert.equal(liveCut(dangling, 0).cut, 4, "未闭 `**` 退至其前（悬空构造退点 = 构造起点）")
  const tick = "abc `x def"
  assert.equal(liveCut(tick, 0).cut, 4, "未闭反引退至其前")
  const pair = "a `b` c"
  assert.equal(liveCut(pair, 0).cut, pair.length, "闭合代码段可整体越过")
})

test("AC-1 T2 尾换行串留热：单换行未成段界 ⇒ 冻结停在其前；双换行完证 ⇒ 块界切", () => {
  const one = "abc\n"
  const r1 = liveCut(one, 0)
  assert.equal(r1.cut, 3, "尾单换行可续成 `\\n\\n` ⇒ 留热")
  assert.equal(r1.inline, true, "仍在段内语境")
  const bare = "abc\n\n"
  assert.equal(liveCut(bare, 0).cut, 3, "段界串抵文末（后随未定）⇒ 不可提交")
  const done = "abc\n\nxyz"
  const r3 = liveCut(done, 0)
  assert.equal(r3.cut, 5, "段界串完证 ⇒ 切在串尾")
  assert.equal(r3.blockStart, 5, "块界切 ⇒ 无开段（blockStart = cut）")
})

test("AC-1 T3 行首块标记未定型 ∕ 已定块行留热（块级单元起点为界）", () => {
  const list = "text\n- item\n- item2"
  assert.equal(liveCut(list, 0).cut, 5, "`- ` 行首块标记 ⇒ 段内切点至多其起点（行首 = 换行后一位）")
  const head = "# h"
  assert.equal(liveCut(head, 0).cut, 0, "行首 `#` 未定型 ⇒ 零推进")
  const quote = "> quote\n\nxyz"
  assert.equal(liveCut(quote, 0).cut, 0, "行首引用未定 ⇒ 零推进")
  const table = "| a |\n|---|\n| b |\n\nxyz"
  assert.equal(liveCut(table, 0).cut, 0, "行首表格未定 ⇒ 零推进")
})

test("AC-1 T4 围栏：闭栏整体属块级热区（无后随段界不冻）；段界在栏后 ⇒ 整体越栏冻结", () => {
  const after = "x\n\n```js\na\n```\n\n尾"
  assert.ok(liveCut(after, 0).cut >= 12, "栏闭 + 后随段界 ⇒ 整体越栏冻结（块级单元）")
  const noBreak = "x\n\n```js\na\n```\n"
  assert.equal(liveCut(noBreak, 0).cut, 3, "栏闭但无后随段界 ⇒ 冻结停于栏前段界（栏入块级热区）")
  const open = "x\n\n```js\na\n"
  assert.equal(liveCut(open, 0).cut, 3, "未闭围栏 ⇒ 冻结停在其串前")
  const later = "abc```js\nx\n```\n\nmore"
  assert.ok(liveCut(later, 0).cut > 0, "行内位置围栏亦为块级构造（可证处放行）")
})

test("AC-1 T5 边界禁列：尾转义 ∕ 尾反引 ∕ 星 ∕ 波浪邻接不可切", () => {
  assert.equal(liveCut("abc\\", 0).cut, 3, "尾转义留热（可续成转义序列）")
  const star = "abc *"
  assert.ok(liveCut(star, 0).cut <= 4, "尾星串留热")
  const tilde = "abc ~"
  assert.ok(liveCut(tilde, 0).cut <= 4, "尾波浪留热")
  const tick = "abc`"
  assert.ok(liveCut(tick, 0).cut <= 3, "尾反引留热")
})

test("AC-1 T7 消费换行行 ≥3 规则：列表 ∕ 引用 ∕ 表格后 2 串段界不可提交（3 串可）", () => {
  const list2 = "- 甲\n- 乙\n\n完"
  assert.notEqual(liveCut(list2, 0).cut, 9, "列表后 2 串段界不得作块界切点")
  const list3 = "- 甲\n- 乙\n\n\n完"
  assert.equal(liveCut(list3, 0).cut, 10, "3 串段界（列表后）可提交 —— 切在串尾")
  const plain2 = "甲\n\n完"
  assert.equal(liveCut(plain2, 0).cut, 3, "非消费行后 2 串段界可提交（切在串尾）")
})

test("AC-1 T6 幂等 ∕ 向前性：`liveCut(t, c).cut ≥ c` 且同参两次同值", () => {
  for (const [, text] of CORPUS) {
    let cut = 0
    for (let round = 0; round < text.length + 2 && cut < text.length; round += 1) {
      const next = liveCut(text, cut)
      assert.ok(next.cut >= cut, "切点单调不减")
      assert.ok(next.cut <= text.length, "切点不出界")
      assert.deepEqual(liveCut(text, cut), next, "同参幂等")
      if (next.cut === cut) break
      cut = next.cut
    }
  }
})

// ─── AC-2 分片恒等式（段内 inline 复合 ∥ 块级 md 复合 ≡ 整体）────────────────

test("AC-2 T1 块级复合：可提交段界处 `md(A) + md(B)` ≡ `md(A+B)`（消费换行行 2 串不在可提交集内）", () => {
  const doc = fakeDoc()
  const isConsumer = (line) => /^\s*(?:[-*+]|\d+[.)]|>|\|)/.test(line)
  let checked = 0
  for (const [name, text] of CORPUS) {
    for (let at = 0; at < text.length; at += 1) {
      if (text.slice(at, at + 2) !== "\n\n") continue
      let run = 0
      while (text[at + run] === "\n") run += 1
      const lineStart = text.lastIndexOf("\n", at - 1) + 1
      if (isConsumer(text.slice(lineStart, at)) && run < 3) continue // 非可提交段界（≥3 规则）
      const a = text.slice(0, at)
      const b = text.slice(at)
      const split = new FakeNode("div", doc)
      split.innerHTML = md(a)
      const tail = new FakeNode("div", doc)
      tail.innerHTML = md(b)
      for (const child of [...tail.children]) split.appendChild(child)
      assert.equal(norm(split), referenceNorm(a + b, doc), `${name} @${at}: 段界分片复合须 ≡ 整体`)
      checked += 1
    }
  }
  assert.ok(checked > 6, `语料覆盖面足够（实检 ${checked} 处段界）`)
})

test("AC-2 T2 段内复合：开段前缀 + 热区（含单换行 `<br>` 语境）≡ 整体", () => {
  const doc = fakeDoc()
  for (const [name, text] of CORPUS) {
    const res = liveCut(text, 0)
    const open = text.slice(res.blockStart, res.cut)
    const boundary = res.inline ? tailHeadEnd(text, res.cut) : res.cut
    const pre = text.slice(res.cut, boundary)
    const post = text.slice(boundary)
    const box = new FakeNode("div", doc)
    box.innerHTML = md(text.slice(0, res.blockStart))
    if (res.cut > res.blockStart || res.inline) {
      const para = new FakeNode("p", doc)
      para.innerHTML = liveInline(open + pre)
      box.appendChild(para)
    }
    if (post !== "") {
      const tail = new FakeNode("div", doc)
      tail.innerHTML = md(post) // 自段界 ∕ 块构造起 ⇒ 块级复合位（无首段壳吸收）
      for (const child of [...tail.children]) box.appendChild(child)
    }
    assert.equal(norm(box), referenceNorm(text, doc), `${name}: 三段分片复合须 ≡ 整体（cut=${res.cut}）`)
  }
})

// ─── AC-3 `paintLiveMd` 协议（首绘分片 ∕ 增帧增量 ∕ 幂等零写 ∕ 复位 ∕ 异常兜底）──

test("AC-3 T1 首绘 = 分片全绘且 ≡ `md(raw)`（无整面 innerHTML=md(raw) 径）", () => {
  const doc = fakeDoc()
  for (const [name, text] of CORPUS) {
    const el = new FakeNode("div", doc)
    let innerHtmlWrites = 0
    let textWrites = 0
    Object.defineProperty(el, "innerHTML", { set() { innerHtmlWrites += 1 }, get() { return "" }, configurable: true })
    Object.defineProperty(el, "textContent", { set() { textWrites += 1 }, get() { return "" }, configurable: true })
    paintLiveMd(el, text)
    assert.equal(norm(el), referenceNorm(text, doc), `${name}: 首绘 ≡ 全量参照`)
    assert.equal(innerHtmlWrites, 0, `${name}: 根面零 innerHTML 写（分片全绘）`)
    assert.equal(textWrites, 0, `${name}: 正常径零 textContent 写`)
  }
})

test("AC-3 T2b 跨段界增帧：帧粒度 >1 字符亦 ≡ 全量参照（段内续段 → 段闭 + 新段）", () => {
  const doc = fakeDoc()
  const steps = ["abc def", "abc def ghi", "abc def ghi\n", "abc def ghi\n\n", "abc def ghi\n\nnext", "abc def ghi\n\nnext\n\n尾"]
  const el = new FakeNode("div", doc)
  for (const step of steps) {
    paintLiveMd(el, step)
    assert.equal(norm(el), referenceNorm(step, doc), `帧步 ${JSON.stringify(step)}: 增量面 ≡ 全量参照`)
  }
  const frozen = el.children[0]
  paintLiveMd(el, steps[steps.length - 1] + "段")
  assert.equal(el.children[0], frozen, "冻结节点跨帧身份存续")
  assert.equal(norm(el), referenceNorm(steps[steps.length - 1] + "段", doc), "跨段界后仍 ≡ 全量参照")
  // 块级构造越帧（列表 ∕ 围栏）
  const el2 = new FakeNode("div", doc)
  for (const step of ["text", "text\n- 甲", "text\n- 甲\n- 乙", "text\n- 甲\n- 乙\n\n完", "text\n- 甲\n- 乙\n\n完\n"] ) {
    paintLiveMd(el2, step)
    assert.equal(norm(el2), referenceNorm(step, doc), `列表帧步 ${JSON.stringify(step)}: ≡ 全量参照`)
  }
})

test("AC-3 T2 增帧 = 冻结节点零触碰（身份存续）+ 热区换代；幂等帧零写", () => {
  const doc = fakeDoc()
  const text = PARA + " " + PARA
  const el = new FakeNode("div", doc)
  paintLiveMd(el, text.slice(0, 10))
  paintLiveMd(el, text.slice(0, 40))
  const frozen = el.children.slice()
  const before = el.children.length
  paintLiveMd(el, text)
  const kept = frozen.every((node, index) => el.children[index] === node)
  assert.ok(kept, "既有节点对象逐位存续（冻结区零写）")
  assert.ok(el.children.length >= before, "增帧只追加")
  assert.equal(norm(el), referenceNorm(text, doc), "增帧终态 ≡ 全量参照")
  const snapshot = el.children.slice()
  paintLiveMd(el, text)
  assert.deepEqual(el.children.map((n) => n), snapshot.map((n) => n), "幂等帧零写（节点集与顺序不变）")
})

test("AC-3 T3 非前缀扩展 ⇒ 复位全绘；异常 ⇒ `textContent = raw` 并复位（下一帧重走分片全绘）", () => {
  const doc = fakeDoc()
  const el = new FakeNode("div", doc)
  paintLiveMd(el, "第一段\n\n第二段")
  paintLiveMd(el, "另一文本")
  assert.equal(norm(el), referenceNorm("另一文本", doc), "非前缀 ⇒ 复位全绘（≡ 全量参照）")
  const boom = new FakeNode("div", doc)
  let broken = true
  const original = boom.appendChild.bind(boom)
  boom.appendChild = (child) => { if (broken) throw new Error("boom"); return original(child) }
  paintLiveMd(boom, "abc")
  assert.equal(boom.textContent, "abc", "异常 ⇒ textContent = raw（现状语义）")
  assert.equal(boom._liveMd, null, "异常 ⇒ 冻结态复位")
  broken = false
  paintLiveMd(boom, "abc def")
  assert.equal(norm(boom), referenceNorm("abc def", doc), "复位后下一帧 = 分片全绘径")
})

test("AC-3 T4 热区失连（外部覆写）⇒ 复位全绘（不叠影）", () => {
  const doc = fakeDoc()
  const el = new FakeNode("div", doc)
  paintLiveMd(el, "abc def")
  for (const child of [...el.children]) { child.parentNode = null } // 外部覆写（真 DOM 同步断链）
  el.children.length = 0
  paintLiveMd(el, "abc def ghi")
  assert.equal(norm(el), referenceNorm("abc def ghi", doc), "外部覆写后复位全绘")
})

test("AC-3 T5 `paintStreamTarget` 委托：同签名 ∕ 同兜底（流式面调用点零改）", () => {
  const doc = fakeDoc()
  const el = new FakeNode("div", doc)
  paintStreamTarget(el, "文本 **粗**")
  assert.equal(norm(el), referenceNorm("文本 **粗**", doc), "核流式面走画件（≡ 全量参照）")
  const blank = new FakeNode("div", doc)
  paintStreamTarget(blank, "")
  assert.equal(norm(blank), referenceNorm("", doc))
})

test("AC-3 T6 密文负载帧成本 ∝ 热区（非 ∝ 累计文本）——80KB 单段逐 chunk 帧成本平坦", () => {
  const doc = fakeDoc()
  const el = new FakeNode("div", doc)
  const chunk = PARA.slice(0, 64)
  let text = ""
  const times = []
  while (text.length < 80000) {
    text += chunk
    const t0 = performance.now()
    paintLiveMd(el, text)
    times.push(performance.now() - t0)
  }
  const sorted = times.slice().sort((a, b) => a - b)
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  assert.ok(p95 < 8, `帧 p95 ≤ 8ms（实测 ${p95.toFixed(3)}ms）`)
  assert.equal(norm(el), referenceNorm(text, doc), "长流终态 ≡ 全量参照")
  const first = times.slice(0, 20).reduce((a, b) => a + b, 0) / 20
  const last = times.slice(-20).reduce((a, b) => a + b, 0) / 20
  assert.ok(last <= first * 8 + 0.5, `帧成本不随累计文本增长（首 ${first.toFixed(3)}ms ⇒ 末 ${last.toFixed(3)}ms）`)
})

// ─── AC-4 `streamDelta` 五档（判定次序 ∕ 出口形逐字）──────────────────────────

test("AC-4 T1 出口形 deepEqual 逐字：append 恰 `{kind,index}` ∕ patch-append `{kind,index,appended}`", () => {
  const a = { id: "a", kind: "assistant", text: "a" }
  const b = { id: "b", kind: "assistant", text: "b" }
  const c = { id: "c", kind: "assistant", text: "c" }
  assert.deepEqual(streamDelta([a], [a, b]), { kind: "append", index: 1 }, "单枚追加（既有用例逐字等）")
  assert.deepEqual(streamDelta([], [a]), { kind: "append", index: 0 }, "n=0 首块档 ⇒ index:0 恰两键")
  assert.deepEqual(streamDelta([a, b], [a, b, c]), { kind: "append", index: 2 }, "尾位引用未变 ⇒ append（先判者胜）")
  assert.deepEqual(streamDelta([], [a, b]), { kind: "append", index: 0 }, "n=0 且 k≥2 ⇒ 首枚追加位 0")
  const a2 = { id: "a", kind: "assistant", text: "a·续" }
  assert.deepEqual(streamDelta([a], [a2, b]), { kind: "patch-append", index: 0, appended: 1 }, "尾位同键但引用变 ⇒ patch-append")
  const b2 = { id: "b", kind: "assistant", text: "b·续" }
  assert.deepEqual(streamDelta([a, b], [a, b2, c]), { kind: "patch-append", index: 1, appended: 1 }, "index = length−1 钉死")
  assert.deepEqual(streamDelta([a], [a2, b, c]), { kind: "patch-append", index: 0, appended: 2 }, "k≥2：appended = 增枚数")
  assert.deepEqual(streamDelta([a], [b, a]), { kind: "reset", index: -1 }, "尾位键不等 ⇒ reset")
  assert.deepEqual(streamDelta([a, b], [a, c, c]), { kind: "reset", index: -1 }, "更早断 ⇒ reset")
  assert.deepEqual(streamDelta([a], [a2]), { kind: "patch", index: 0 }, "等长尾位键等 ⇒ patch")
  assert.deepEqual(streamDelta([a], [a]), { kind: "none", index: -1 }, "逐位全等 ⇒ none")
})

test("AC-4 T2 `paintPlan` 携 `appended`（组合档非零；他档 0）", () => {
  const a = { id: "a", kind: "assistant", text: "a" }
  const a2 = { id: "a", kind: "assistant", text: "a·续" }
  const plan = paintPlan({ prev: { blocks: [a] }, next: { blocks: [a2, a] }, changedKeys: ["blocks"] })
  assert.deepEqual(plan, { tier: "patch-append", index: 0, remount: false, refresh: true, appended: 1 })
  const plain = paintPlan({ prev: { blocks: [a] }, next: { blocks: [a] }, changedKeys: [] })
  assert.equal(plain.appended, 0, "非组合档 appended = 0")
})

// ─── AC-5 `alignPlan` combo 档（守卫 ∕ patchAt 出口 ∕ 纯 patch 回归）─────────

test("AC-5 T1 combo 无滑 ∕ 滑窗给枚：`{evict, prepend, patchAt, tail, ok}` 逐键断言", () => {
  const a = { id: "a" }, b = { id: "b" }, c = { id: "c" }, d = { id: "d" }
  const mounted = [{ node: {}, block: a }, { node: {}, block: b }]
  const plan = alignPlan(mounted, [a, b, c], "patch-append", 1)
  assert.deepEqual({ ...plan, tail: plan.tail.length }, { evict: 0, prepend: 0, patchAt: 1, tail: 1, ok: true }, "无滑：尾位就地 + 追加段")
  const slid = alignPlan([{ node: {}, block: a }, { node: {}, block: b }, { node: {}, block: c }], [b, c, d], "patch-append", 1)
  assert.deepEqual({ ...slid, tail: slid.tail.length }, { evict: 1, prepend: 0, patchAt: 1, tail: 1, ok: true }, "滑窗：evict 头枚 + 尾块就地")
})

test("AC-5 T2 combo 守卫：goals 未被重合覆盖 ⇒ `ok:false`；尾块独挂（goals 空）⇒ 合法组合帧", () => {
  const a = { id: "a" }, b = { id: "b" }, c = { id: "c" }, x = { id: "x" }
  const mounted = [{ node: {}, block: a }, { node: {}, block: b }]
  const bad = alignPlan(mounted, [x, { ...b }, c], "patch-append", 1)
  assert.equal(bad.ok, false, "mounted=[a,b] + next=[x,b′,c] ⇒ goals=[x] 未覆盖 ⇒ 守卫不达（回落重挂）")
  const solo = alignPlan([{ node: {}, block: a }], [{ ...a }, b], "patch-append", 1)
  assert.deepEqual({ evict: solo.evict, prepend: solo.prepend, patchAt: solo.patchAt, tail: solo.tail.length, ok: solo.ok }, { evict: 0, prepend: 0, patchAt: 0, tail: 1, ok: true }, "尾块独挂（prev=[a] ⇒ next=[a′,b]）⇒ 合法组合帧")
  const degenerate = alignPlan([{ node: {}, block: a }], [a], "patch-append", 5)
  assert.equal(degenerate.ok, false, "appended ≥ visible.length（就地位负）⇒ 守卫不达（不回退不变式）")
})

test("AC-5 T3 纯 patch 回归（既有调用 ∕ 用例零改）：真值第 3 参仍为尾位豁免", () => {
  const a = { id: "a" }, b = { id: "b" }, c = { id: "c" }
  const mounted = [{ node: {}, block: a }, { node: {}, block: b }]
  const byTrue = alignPlan(mounted, [a, b], true)
  const byMode = alignPlan(mounted, [a, b], "patch")
  assert.equal(byTrue.evict, 0, "既有用例 `alignPlan(mounted,[a,b],true)` 语义不变")
  assert.equal(byMode.evict, 0, "\"patch\" 串同义")
  assert.equal(byTrue.patchAt, 1, "纯 patch ⇒ patchAt = 尾位 visible.length−1")
  assert.deepEqual(byTrue, byMode, "真值 ∥ mode 串同出口")
  const plain = alignPlan(mounted, [a, b, c])
  assert.deepEqual({ evict: plain.evict, prepend: plain.prepend, tail: plain.tail.length, ok: plain.ok }, { evict: 0, prepend: 0, tail: 1, ok: true }, "非豁免档既有例回归")
})

// ─── AC-6 `settleFrame` combo（假 DOM：同帧两动作）────────────────────────────

test("AC-6 T1 组合帧：尾节点同引用 + 内容更新 + 追加段挂载 + 非 evict 老节点零摘离", async () => {
  const { initDict } = await import("../../thincoder-desktop/renderer/i18n.mjs")
  const { chatModel } = await import("../../thincoder-desktop/renderer/views/chat-model.mjs")
  const { mountChat, settleFrame } = await import("../../thincoder-desktop/renderer/views/chat.mjs")
  const doc = fakeDoc()
  const prevDoc = globalThis.document
  const prevNode = globalThis.Node
  globalThis.document = doc
  globalThis.Node = FakeNode
  try {
    initDict({})
    const state = {
      activeSession: "s1",
      locale: "zh-CN",
      blocks: [{ id: "b0", kind: "user", text: "hi" }, { id: "b1", kind: "assistant", text: "长回复", streaming: true }],
      following: true,
      hidden: 0,
    }
    const root = new FakeNode("div", doc)
    const first = mountChat(root, state, {})
    const tailNode = first.mounted[first.mounted.length - 1].node
    const headNode = first.mounted[0].node
    assert.equal(first.mounted.length, 2)
    const nextState = {
      ...state,
      blocks: [state.blocks[0], { id: "b1", kind: "assistant", text: "长回复·终稿", streaming: false }, { id: "b2", kind: "assistant", text: "新块" }],
    }
    const plan = paintPlan({ prev: { blocks: state.blocks }, next: { blocks: nextState.blocks }, changedKeys: ["blocks"] })
    assert.equal(plan.tier, "patch-append")
    const model = chatModel(nextState)
    const align = alignPlan(first.mounted, model.blocks, plan.tier, plan.appended)
    assert.equal(align.ok, true)
    const before = tailNode.textContent
    const mounted = settleFrame(root, model, null, align, plan.tier, {}, first.mounted)
    assert.equal(mounted.length, 3, "追加段挂载 ⇒ 记账 +1")
    assert.equal(mounted[1].node, tailNode, "尾块节点同引用（就地更新 —— 零重挂）")
    assert.notEqual(tailNode.textContent, before, "尾块内容已更新")
    assert.equal(mounted[0].node, headNode, "非 evict 老节点零摘离（身份存续）")
    assert.ok(root.querySelectorAll("[data-block-kind]").includes(tailNode), "节点仍在树上")
  } finally {
    globalThis.document = prevDoc
    globalThis.Node = prevNode
  }
})

// ─── AC-7 VSC 复证对拍（git 修前副本逐字参照 + 非串差异锁 + 清点）─────────────

/** 修前 toolOutput 支逐字（`git cf48ba12~1:thincoder-vscode/webview/chat-messages.js` 提取）。 */
function referenceToolOutput(el, text, initial) {
  if (el.textContent === initial) el.textContent = ""
  if (!el._capped) {
    el.textContent += text
    if (el.textContent.length > MAX_TOOL_OUTPUT) {
      el.textContent = el.textContent.slice(0, MAX_TOOL_OUTPUT) + "…(输出过长已截断)"
      el._capped = true
    }
  }
}

function countingEl(initial = "") {
  let writes = 0
  const el = { _text: initial, _capped: false }
  Object.defineProperty(el, "textContent", {
    get() { return el._text },
    set(value) { writes += 1; el._text = String(value) },
  })
  return { el, writes: () => writes }
}

test("AC-7 T1 驱动表对拍：占位清 ∕ 跨 64K 截断 ∕ 空串 ∕ 停收 ∕ 幂等（文本面 + `_capped` 逐字；写数不增）", () => {
  const initial = "工具输出占位"
  const steps = [
    ["占位清 + 首 chunk", "abc"],
    ["纯追加", "def"],
    ["空串", ""],
    ["停收后重发", "def"],
    ["跨 64K 截断", "x".repeat(MAX_TOOL_OUTPUT)],
    ["截断后停收", "后续内容"],
  ]
  const mine = countingEl(initial)
  const refs = countingEl(initial)
  for (const [label, chunk] of steps) {
    appendToolOutput(mine.el, chunk, { initial })
    referenceToolOutput(refs.el, chunk, initial)
    assert.equal(mine.el.textContent, refs.el.textContent, `${label}: 文本面逐字相等`)
    assert.equal(mine.el._capped === true, refs.el._capped === true, `${label}: \`_capped\` 态相等`)
    assert.ok(mine.writes() <= refs.writes(), `${label}: 写数不增（核件契约 = 空串 ∕ 已截断零写）`)
  }
  assert.ok(mine.writes() < refs.writes(), "实测：空串 ∕ 停收步核件零写（旧形 `+= \"\"` 必写 —— 有意加固）")
  assert.ok(mine.el.textContent.endsWith("…(输出过长已截断)"), "截断注字面单源")
})

test("AC-7 T2 非串差异锁：核件「非串视空零写」（有意加固 · 旧形强转拼接为缺陷形）", () => {
  const mine = countingEl("seed")
  appendToolOutput(mine.el, undefined)
  appendToolOutput(mine.el, null)
  appendToolOutput(mine.el, 123)
  assert.equal(mine.el.textContent, "seed", "非串 ⇒ 零写（契约域外 —— 登记不回退）")
  assert.equal(mine.writes(), 0)
})

test("AC-7 T3 清点：现盘 `markOutput` 调用点八枚（7+1 归因）+ 核件进口在位", () => {
  const source = readFileSync(new URL("../../thincoder-vscode/webview/chat-messages.js", import.meta.url), "utf8")
  const calls = source.match(/markOutput\(\)/g) ?? []
  assert.equal(calls.length, 8, "非 toolOutput 支七枚 + toolOutput 支内一枚（7+1）")
  assert.equal((source.match(/const markOutput/g) ?? []).length, 1, "定义单点")
  assert.ok(source.includes("appendToolOutput"), "toolOutput 支改指核件")
})

test("AC-7 T4 `createStreamRenderer` 同面：帧降频（minMs）∥ flush 尾帧 ≡ 全量参照", () => {
  const doc = fakeDoc()
  const el = new FakeNode("div", doc)
  const clock = { t: 1000 }
  let target = { el, raw: "a" }
  let frames = 0
  const renderer = createStreamRenderer({
    raf: (cb) => { frames += 1; cb() },
    now: () => clock.t,
    minMs: 50,
    token: () => target,
    reasoning: () => null,
  })
  renderer.markToken()
  clock.t += 100
  target = { el, raw: "ab" }
  renderer.markToken()
  assert.ok(frames >= 1, "至少一帧落定")
  renderer.flush()
  assert.equal(norm(el), referenceNorm("ab", doc), "flush 同步尾帧 ≡ 全量参照")
})

// ─── 回归：reset 档仍走全量挂载（组合档为纯增路径）────────────────────────────

test("回归 T1 reset 档全量挂载不受组合档影响", async () => {
  const { initDict } = await import("../../thincoder-desktop/renderer/i18n.mjs")
  const { chatModel } = await import("../../thincoder-desktop/renderer/views/chat-model.mjs")
  const { mountChat, settleFrame } = await import("../../thincoder-desktop/renderer/views/chat.mjs")
  const doc = fakeDoc()
  const prevDoc = globalThis.document
  const prevNode = globalThis.Node
  globalThis.document = doc
  globalThis.Node = FakeNode
  try {
    initDict({})
    const state = { activeSession: "s1", locale: "zh-CN", blocks: [{ id: "b0", kind: "assistant", text: "x" }], following: true, hidden: 0 }
    const root = new FakeNode("div", doc)
    const first = mountChat(root, state, {})
    const next = { ...state, blocks: [{ id: "z0", kind: "assistant", text: "重来" }] }
    const plan = paintPlan({ prev: { blocks: state.blocks }, next: { blocks: next.blocks }, changedKeys: ["blocks"] })
    assert.equal(plan.tier, "reset")
    const model = chatModel(next)
    const align = alignPlan(first.mounted, model.blocks, false, plan.appended ?? 0)
    const mounted = settleFrame(root, model, null, align, plan.tier, {}, first.mounted)
    assert.equal(mounted.length, 1)
    assert.equal(root.textContent.includes("重来"), true, "reset 档重挂后内容在场")
  } finally {
    globalThis.document = prevDoc
    globalThis.Node = prevNode
  }
})
