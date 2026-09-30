/**
 * 2026-09-30-desktop-heap-freeze-e2.test.mjs — E2 命中分支（render-core 续写支文本节点合并）单元腿 ·
 * 假 DOM 直测（批内件；首落 `.thincoder/tmp/` ⇒ 父侧收位 `docs/batches/` 同名件——两层深相对路径与终位一致）。
 * 覆盖（验收单源 = 批档 `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.13）：
 *   ① 文本续写支：N chunk ⇒ 目标行文本节点 = 1（≤1 上界）+ 行合并判据（kind ∕ sub 分界）不变
 *   ② 推理续写支：think 同径 + kind ∕ sub 变 ⇒ 新行（每行 ≤1）
 *   ③ toolOutput 续行支：同 tool ∧ sub ⇒ 并写；异 tool ∕ sub ⇒ 恒新行（每行 ≤1）
 *   ④ 末子非文本兜底：行内末子为元素 ⇒ 维持新建文本节点（两处支各测；元素自身零改写）
 *   ⑤ 首行不动：首 chunk 恒为 `textContent = str`（单文本节点 · 零 appendData 调用）
 *   ⑥ 逐字等价对拍（两态）：逐节点 append 串 ≡ 合并串 ≡ 源串（文本支 ∥ tool 支各测；含多行配额上界）
 * 跑法：`node --test .thincoder/tmp/2026-09-30-desktop-heap-freeze-e2.test.mjs`。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

// ─── 假 DOM（`flow/block.mjs` 所需最小面：元素 ∕ 文本节点 ∕ classList ∕ dataset ∕ lastChild 族）──────

const factory = { textCreated: 0, appendData: 0 }

class FakeText {
  constructor(data) {
    this.nodeType = 3
    this.data = String(data)
  }
  get textContent() { return this.data }
  set textContent(value) { this.data = String(value) }
  appendData(str) { factory.appendData += 1; this.data += String(str) }
}

class FakeElement {
  constructor(tag) {
    this.nodeType = 1
    this.tagName = String(tag).toUpperCase()
    this.children = []
    this.parentNode = null
    this.className = ""
    this.dataset = {}
  }
  get classList() {
    const classes = () => this.className.split(/\s+/).filter(Boolean)
    return {
      contains: (cls) => classes().includes(cls),
      add: (...items) => { this.className = [...new Set([...classes(), ...items])].join(" ") },
      remove: (...items) => { this.className = classes().filter((cls) => !items.includes(cls)).join(" ") },
    }
  }
  appendChild(node) { node.parentNode = this; this.children.push(node); return node }
  get childNodes() { return [...this.children] }
  get lastChild() { return this.children[this.children.length - 1] ?? null }
  get lastElementChild() {
    for (let i = this.children.length - 1; i >= 0; i -= 1) if (this.children[i].nodeType === 1) return this.children[i]
    return null
  }
  get textContent() { return this.children.map((child) => child.textContent).join("") }
  /** 真 DOM `textContent` 写语义：空串 ⇒ 清空；非空 ⇒ 替换为单一文本节点。 */
  set textContent(value) {
    this.children = []
    const str = String(value)
    if (str !== "") this.appendChild(new FakeText(str))
  }
  querySelector(selector) {
    const hit = (node) => {
      if (node.nodeType !== 1) return null
      if (selector.startsWith(".") && node.classList.contains(selector.slice(1))) return node
      for (const child of node.children) { const found = hit(child); if (found !== null) return found }
      return null
    }
    for (const child of this.children) { const found = hit(child); if (found !== null) return found }
    return null
  }
}

globalThis.document = {
  createElement: (tag) => new FakeElement(tag),
  createTextNode: (value) => { factory.textCreated += 1; return new FakeText(value) },
}

const { appendAdvisorChunk, buildAdvisorBlock } = await import(pathToFileURL(join(REPO, "thincoder-render-core", "flow", "block.mjs")).href)

// ─── 夹具 ∕ 助手 ────────────────────────────────────────────────────────────

const makeBlock = () => ({ block: buildAdvisorBlock("coder#1") })
const contentOf = (block) => block.querySelector(".advisor-content")
const elementChildren = (el) => el.childNodes.filter((child) => child.nodeType === 1)
const textChildren = (el) => el.childNodes.filter((child) => child.nodeType === 3)

/** 确定性 chunk 串（非 ASCII ∕ 换行 ∕ 尖括号 ∕ 引号 ∕ 尾空格——RAW 拼接语义面）。 */
const chunkText = (index) => `片段 ${index}: <b>&amp;</b> "引号" \n 换行 ∕ 尾随空格 ${index % 7} `
const chunksOf = (count, offset = 0) => Array.from({ length: count }, (_, i) => chunkText(offset + i))
const joined = (chunks) => chunks.join("")

/** 修前形（逐 chunk 新建文本节点——KD-RC-11 修法前逐字复刻）：同串参照行。 */
function legacyRow(chunks) {
  const row = new FakeElement("div")
  row.textContent = chunks[0]
  for (const chunk of chunks.slice(1)) row.appendChild(document.createTextNode(chunk))
  return row
}

// ─── ① 文本续写支 ───────────────────────────────────────────────────────────

test("① 文本续写支：N chunk ⇒ 1 行 · 文本节点 1 · 逐字等价", () => {
  const chunks = chunksOf(300)
  const { block } = makeBlock()
  const content = contentOf(block)
  for (const chunk of chunks) appendAdvisorChunk(block, "text", chunk)
  const rows = elementChildren(content)
  assert.equal(rows.length, 1, "同 kind ∕ sub ⇒ 单行（行合并判据不变）")
  assert.equal(rows[0].classList.contains("advisor-text"), true)
  assert.equal(rows[0].dataset.kind, "text")
  assert.equal(textChildren(rows[0]).length, 1, "文本节点 ∕ 行 = 1（≤1 上界）")
  assert.equal(rows[0].textContent, joined(chunks), "逐字等价（源串）")
  const legacy = legacyRow(chunks)
  assert.equal(legacy.textContent, rows[0].textContent, "两态读出串逐字相等")
  assert.equal(legacy.childNodes.length, chunks.length, "参照行 = 逐节点（N 节点）")
})

// ─── ② 推理续写支 + 行分界 ──────────────────────────────────────────────────

test("② 推理续写支 + 行分界：kind ∕ sub 变 ⇒ 新行；每行文本节点 ≤1", () => {
  const a = chunksOf(200, 0)
  const b = chunksOf(120, 1000)
  const c = chunksOf(80, 2000)
  const { block } = makeBlock()
  const content = contentOf(block)
  for (const chunk of a) appendAdvisorChunk(block, "think", chunk)
  for (const chunk of b) appendAdvisorChunk(block, "think", chunk, "agent-2")
  for (const chunk of c) appendAdvisorChunk(block, "think", chunk)
  const rows = elementChildren(content)
  assert.equal(rows.length, 3, "sub 变 ⇒ 新行；回旧 sub 时末子已非同 sub 行 ⇒ 新行")
  assert.deepEqual(rows.map((row) => textChildren(row).length), [1, 1, 1], "每行 ≤1")
  assert.equal(rows[0].classList.contains("advisor-think"), true, "think 行带 advisor-think")
  assert.equal(rows[0].dataset.kind, "think")
  assert.equal(rows[0].textContent, joined(a))
  assert.equal(rows[1].dataset.sub, "agent-2")
  assert.equal(rows[1].textContent, joined(b))
  assert.equal(rows[2].textContent, joined(c))
})

// ─── ③ toolOutput 续行支 ────────────────────────────────────────────────────

test("③ toolOutput 续行支：同 tool ∧ sub ⇒ 并写（≤1）；异 tool ∕ sub ⇒ 恒新行", () => {
  const chunks = chunksOf(250)
  const { block } = makeBlock()
  const content = contentOf(block)
  for (const chunk of chunks) appendAdvisorChunk(block, "tool", chunk, "coder#1", { face: "toolOutput", tool: "read" })
  const first = content.lastElementChild
  assert.equal(first.classList.contains("advisor-tool-line"), true)
  assert.equal(first.dataset.face, "toolOutput")
  assert.equal(first.dataset.tool, "read")
  assert.equal(textChildren(first).length, 1, "文本节点 ∕ 行 = 1（≤1 上界）")
  assert.equal(first.textContent, joined(chunks))
  appendAdvisorChunk(block, "tool", "异 tool 输出", "coder#1", { face: "toolOutput", tool: "write" })
  appendAdvisorChunk(block, "tool", "异 sub 输出", "coder#2", { face: "toolOutput", tool: "read" })
  const rows = elementChildren(content)
  assert.equal(rows.length, 3, "异 tool ∕ 异 sub ⇒ 恒新行")
  assert.deepEqual(rows.map((row) => textChildren(row).length), [1, 1, 1])
  const legacy = legacyRow(chunks)
  assert.equal(legacy.textContent, first.textContent, "两态读出串逐字相等（tool 支）")
  assert.equal(legacy.childNodes.length, chunks.length)
})

// ─── ④ 末子非文本兜底 ───────────────────────────────────────────────────────

test("④ 末子非文本兜底：末子为元素 ⇒ 维持新建文本节点（两处支各测）", () => {
  // 文本支
  const { block } = makeBlock()
  const content = contentOf(block)
  appendAdvisorChunk(block, "text", "前缀")
  const row = content.lastElementChild
  const mark = document.createElement("span")
  mark.textContent = "·"
  row.appendChild(mark) // 行内出现非文本末子（兜底面）
  appendAdvisorChunk(block, "text", "后缀")
  assert.equal(elementChildren(content).length, 1, "兜底不建新行")
  assert.deepEqual(row.childNodes.map((child) => child.nodeType), [3, 1, 3], "兜底 = 恒新文本节点（不改写元素）")
  assert.equal(row.lastChild.textContent, "后缀")
  assert.equal(mark.children.length, 1, "元素自身零改写")
  assert.equal(row.textContent, "前缀·后缀", "读出串仍为拼接结果")

  // tool 支
  const second = makeBlock()
  const secondContent = contentOf(second.block)
  appendAdvisorChunk(second.block, "tool", "输出前缀", "coder#1", { face: "toolOutput", tool: "read" })
  const line = secondContent.lastElementChild
  const mark2 = document.createElement("span")
  mark2.textContent = "·"
  line.appendChild(mark2)
  appendAdvisorChunk(second.block, "tool", "输出后缀", "coder#1", { face: "toolOutput", tool: "read" })
  assert.equal(elementChildren(secondContent).length, 1, "兜底不建新行（tool 支）")
  assert.deepEqual(line.childNodes.map((child) => child.nodeType), [3, 1, 3])
  assert.equal(line.lastChild.textContent, "输出后缀")
  assert.equal(mark2.children.length, 1)
})

// ─── ⑤ 首行不动 ─────────────────────────────────────────────────────────────

test("⑤ 首行不动：首 chunk 恒为 `textContent = str`（单文本节点 · 零 appendData）", () => {
  const before = factory.appendData
  const { block } = makeBlock()
  const content = contentOf(block)
  appendAdvisorChunk(block, "text", "首行串")
  const row = content.lastElementChild
  assert.equal(row.childNodes.length, 1, "首行 = 单文本节点（textContent 写径）")
  assert.equal(row.childNodes[0].nodeType, 3)
  assert.equal(row.textContent, "首行串")
  assert.equal(factory.appendData, before, "首行零 appendData（不动）")

  const second = makeBlock()
  const secondContent = contentOf(second.block)
  appendAdvisorChunk(second.block, "tool", "工具行首串", "coder#1", { face: "toolOutput", tool: "read" })
  const line = secondContent.lastElementChild
  assert.equal(line.childNodes.length, 1, "tool 支首行同径")
  assert.equal(line.textContent, "工具行首串")
  assert.equal(factory.appendData, before, "tool 支首行零 appendData")

  appendAdvisorChunk(block, "text", "")
  appendAdvisorChunk(block, "tool", "", "coder#1", { face: "toolOutput", tool: "read" })
  assert.equal(elementChildren(content).length, 1, "空串 ⇒ 零写（既有守卫）")
})

// ─── ⑥ 逐字等价对拍（两态）· 多行配额上界 ───────────────────────────────────

test("⑥ 多行配额上界：4 行 × 250 chunk ⇒ 文本节点总数 = 4（逐节点参照 = 1000）", () => {
  const groups = [
    { kind: "text", chunks: chunksOf(250, 0) },
    { kind: "think", chunks: chunksOf(250, 5000) },
    { kind: "tool", chunks: chunksOf(250, 9000), sub: "coder#1", meta: { face: "toolOutput", tool: "bash" } },
    { kind: "text", chunks: chunksOf(250, 12000) },
  ]
  const { block } = makeBlock()
  const content = contentOf(block)
  for (const group of groups) for (const chunk of group.chunks) appendAdvisorChunk(block, group.kind, chunk, group.sub, group.meta)
  const rows = elementChildren(content)
  assert.equal(rows.length, 4, "四行（kind ∕ tool 面分界）")
  assert.deepEqual(rows.map((row) => textChildren(row).length), [1, 1, 1, 1], "每行 ≤1")
  const total = rows.reduce((sum, row) => sum + textChildren(row).length, 0)
  assert.equal(total, 4, "文本节点总数 = 行数（O(行) 上界）")
  const legacyTotal = groups.reduce((sum, group) => sum + legacyRow(group.chunks).childNodes.length, 0)
  assert.equal(legacyTotal, 1000, "逐节点参照 = chunk 总数（修前形 O(chunk)）")
  rows.forEach((row, index) => assert.equal(row.textContent, groups[index].chunks.join(""), `行 ${index} 逐字等价`))
})
