/**
 * memory-embed-utf16.test.mjs — 嵌入输入截断的 UTF-16 安全面（缺陷修复 · 2026-09-15）。
 *
 * 缺陷：送 embed 文本按 UTF-16 码元截断（`content.slice(0, EMBED_TEXT_MAX_LEN)`），emoji
 * （代理对）恰跨截点 ⇒ 孤立代理进请求体（`JSON.stringify` 转义为 `\ud83d` 文本——合法 JSON、
 * 非法 Unicode 标量）⇒ 严格 UTF-16 解析端（硅基流动）400 / 20015。
 *
 * T1–T4：四路（entries · files · doc_chunks · code_chunks）跨界截断 ⇒ 送文本 0 孤立代理 ∧
 *        文本 = 前缀 + content 安全截断（截点落高代理 ⇒ 整对丢弃）——修复前红。
 * T5–T8：非跨界 / emoji 全内 / 短文本 ⇒ 与裸 slice 逐字相等（零行为变化）——修复前绿。
 *
 * 机判口径：扫 `JSON.parse(body).input[]`（解析回值）——对请求体原串扫恒不命中
 * （`JSON.stringify` 已把孤立代理转义为 `\ud83d` 六字符文本）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createMemory } from "../memory/schema.mjs"
import { createEmbedder } from "../embedding.mjs"
import { put, ensureEmbeddings, EMBED_TEXT_MAX_LEN } from "../memory/core.mjs"
import { ensureDocEmbeddings } from "../memory/docs.mjs"
import { ensureCodeEmbeddings } from "../memory/code-sync.mjs"

const MAX = EMBED_TEXT_MAX_LEN
/** 孤立代理（合法 JSON 文本、非法 Unicode 标量）——送 embed 请求体不得出现。 */
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/gu
/** 跨界夹具：高代理恰在 `max - 1` 索引（裸截断会切出孤立高代理）。 */
const CROSS = "a".repeat(MAX - 1) + "😀" + "b".repeat(10)

/** 命中 = 送文本里的孤立代理码点（空 = 干净）。 */
function loneSurrogates(text) {
  return (text.match(LONE_SURROGATE) ?? []).map((s) => `U+${s.codePointAt(0).toString(16).toUpperCase()}`)
}

/** 送文本断言：0 孤立代理；失败信息直给命中的代理码点。 */
function assertClean(text, label) {
  assert.deepEqual(loneSurrogates(text), [], `${label}: 送 embed 文本含孤立代理（严格 UTF-16 解析端 ⇒ 400）`)
}

/** fetch 桩：原样收 body；按解析回值 `input.length` 回等长向量（先例：provider-merge.test.mjs）。 */
function stubFetch() {
  const bodies = []
  const saved = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    bodies.push(opts.body)
    const n = JSON.parse(opts.body).input.length
    return { ok: true, json: async () => ({ data: Array.from({ length: n }, (_, index) => ({ index, embedding: [1, 0, 0, 0] })) }) }
  }
  return { bodies, restore: () => { globalThis.fetch = saved } }
}

/** 每用例独立 fresh `:memory:` 库 + 桩 embedder。 */
function freshMemory() {
  const mem = createMemory({ dbPath: ":memory:" })
  mem.embedder = createEmbedder({ baseURL: "http://stub.invalid/v1", apiKey: "k", model: "m" })
  return mem
}

/** 送文本（解析回值）——机判扫的就是它。 */
const sentTexts = (bodies) => bodies.flatMap((b) => JSON.parse(b).input)

// ─── T1–T4：跨界截断 ⇒ 送文本无孤立代理（修复前红） ─────────────────────────

test("T1 entries：跨界 emoji 截断 ⇒ 送文本 0 孤立代理，前缀 + 安全截断", async () => {
  const stub = stubFetch()
  try {
    const mem = freshMemory()
    await put(mem, { type: "rule", title: "t1", content: CROSS })
    await ensureEmbeddings(mem)
    assert.equal(stub.bodies.length, 1, "entries 路径单请求")
    const [text] = sentTexts(stub.bodies)
    assertClean(text, "T1")
    assert.equal(text, `t1\n${CROSS.slice(0, MAX - 1)}`, "送文本 = title + \\n + 安全截断内容（整对丢弃）")
  } finally { stub.restore() }
})

test("T2 files：跨界 emoji 截断 ⇒ 送文本 0 孤立代理，前缀 + 安全截断", async () => {
  const stub = stubFetch()
  try {
    const mem = freshMemory()
    mem.db.prepare(`INSERT INTO files (layer, path, type, title, content, updated_at) VALUES ('project', 'x.md', 'rule', ?, ?, 0)`).run("t2", CROSS)
    await ensureEmbeddings(mem)
    assert.equal(stub.bodies.length, 1, "files 路径单请求")
    const [text] = sentTexts(stub.bodies)
    assertClean(text, "T2")
    assert.equal(text, `t2\n${CROSS.slice(0, MAX - 1)}`, "送文本 = title + \\n + 安全截断内容")
  } finally { stub.restore() }
})

test("T3 doc_chunks：跨界 emoji 截断 ⇒ 送文本 0 孤立代理，heading 前缀 + 安全截断", async () => {
  const stub = stubFetch()
  try {
    const mem = freshMemory()
    mem.db.prepare(`INSERT INTO doc_chunks (path, heading, content, line_start, line_end) VALUES ('docs/x.md', ?, ?, 0, 1)`).run("t3-heading", CROSS)
    await ensureDocEmbeddings(mem)
    assert.equal(stub.bodies.length, 1, "doc_chunks 路径单请求")
    const [text] = sentTexts(stub.bodies)
    assertClean(text, "T3")
    assert.equal(text, `t3-heading\n${CROSS.slice(0, MAX - 1)}`, "送文本 = heading + \\n + 安全截断内容")
  } finally { stub.restore() }
})

test("T4 code_chunks：跨界 emoji 截断 ⇒ 送文本 0 孤立代理，path :: symbol 前缀 + 安全截断", async () => {
  const stub = stubFetch()
  try {
    const mem = freshMemory()
    mem.db.prepare(`INSERT INTO code_chunks (path, language, chunk_type, symbol_name, content, line_start, line_end) VALUES ('src/x.mjs', 'javascript', 'file', ?, ?, 0, 1)`).run("fn", CROSS)
    await ensureCodeEmbeddings(mem)
    assert.equal(stub.bodies.length, 1, "code_chunks 路径单请求")
    const [text] = sentTexts(stub.bodies)
    assertClean(text, "T4")
    assert.equal(text, `src/x.mjs :: fn\n${CROSS.slice(0, MAX - 1)}`, "送文本 = path :: symbol + \\n + 安全截断内容")
  } finally { stub.restore() }
})

// ─── T5–T8：非跨界 / emoji 全内 / 短文本 ⇒ 与裸 slice 逐字相等（零行为变化） ──

test("T5 entries：ASCII 跨界 ⇒ 与裸 slice 逐字相等，0 孤立代理", async () => {
  const stub = stubFetch()
  try {
    const mem = freshMemory()
    const content = "a".repeat(MAX) + "b"
    await put(mem, { type: "rule", title: "t5", content })
    await ensureEmbeddings(mem)
    const [text] = sentTexts(stub.bodies)
    assertClean(text, "T5")
    assert.equal(text, `t5\n${content.slice(0, MAX)}`, "裸 slice 逐字相等")
  } finally { stub.restore() }
})

test("T6 entries：BMP 字符跨界 ⇒ 与裸 slice 逐字相等，0 孤立代理", async () => {
  const stub = stubFetch()
  try {
    const mem = freshMemory()
    const content = "a".repeat(MAX - 1) + "中" + "b"
    await put(mem, { type: "rule", title: "t6", content })
    await ensureEmbeddings(mem)
    const [text] = sentTexts(stub.bodies)
    assertClean(text, "T6")
    assert.equal(text, `t6\n${content.slice(0, MAX)}`, "裸 slice 逐字相等（BMP 单码元完整保留）")
  } finally { stub.restore() }
})

test("T7 entries：emoji 全内 ⇒ 代理对完整保留，与裸 slice 等值", async () => {
  const stub = stubFetch()
  try {
    const mem = freshMemory()
    const content = "a".repeat(MAX - 2) + "😀" + "b"
    await put(mem, { type: "rule", title: "t7", content })
    await ensureEmbeddings(mem)
    const [text] = sentTexts(stub.bodies)
    assertClean(text, "T7")
    assert.equal(text, `t7\n${content.slice(0, MAX)}`, "裸 slice 逐字相等")
    assert.ok(text.includes("😀"), "emoji 代理对完整保留")
  } finally { stub.restore() }
})

test("T8 entries：短文本 ⇒ 全文原样，0 孤立代理", async () => {
  const stub = stubFetch()
  try {
    const mem = freshMemory()
    const content = "x".repeat(100) + "😀"
    await put(mem, { type: "rule", title: "t8", content })
    await ensureEmbeddings(mem)
    const [text] = sentTexts(stub.bodies)
    assertClean(text, "T8")
    assert.equal(text, `t8\n${content}`, "≤max ⇒ 全文原样")
  } finally { stub.restore() }
})
