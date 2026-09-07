/**
 * edit-tool-improvement.test.mjs — EDIT-TOOL-IMPROVEMENT.md（VSC 端，2026-09-08）
 * 测试表落码：D1 按行号改 / D2 模糊匹配 / D3 替换即删 / AC4 向后兼容。
 */

import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { editTool } from "../src/tools/file-edit.mjs"
import { applyPatchLines } from "../src/tools/edit-diff.mjs"

let dir
let ctx
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "thincoder-edit-imp-")); ctx = { cwd: dir } })
afterEach(() => rmSync(dir, { recursive: true, force: true }))

function fixture(name, content) {
  writeFileSync(join(dir, name), content, "utf8")
  return name
}
const read = (name) => readFileSync(join(dir, name), "utf8")

// AC1 — 正常按行号改：edit(path, line, new_string) → 该行被替换（不用 old_string）
test("AC1: edit by line number replaces that line", async () => {
  fixture("a.txt", "one\ntwo\nthree\n")
  const r = await editTool.execute({ path: "a.txt", line: 2, new_string: "TWO" }, ctx)
  assert.match(r, /Replaced 1 line\(s\) at L2/)
  assert.equal(read("a.txt"), "one\nTWO\nthree\n")
})

// AC1 — 正常行范围改：startLine/endLine 闭区间替换
test("AC1: edit by line range replaces the inclusive range", async () => {
  fixture("a.txt", "one\ntwo\nthree\nfour\nfive\n")
  const r = await editTool.execute({ path: "a.txt", startLine: 2, endLine: 4, new_string: "X\nY" }, ctx)
  assert.match(r, /Replaced 3 line\(s\) at L2/)
  assert.equal(read("a.txt"), "one\nX\nY\nfive\n")
})

// AC1 — 按行号改 + 空 new_string = 删除该行（替换即删同语义族）
test("AC1: empty new_string with line deletes the line", async () => {
  fixture("a.txt", "one\ntwo\nthree\n")
  const r = await editTool.execute({ path: "a.txt", line: 2, new_string: "" }, ctx)
  assert.match(r, /Replaced 1 line\(s\)/)
  assert.equal(read("a.txt"), "one\nthree\n")
})

// AC1 — 边界互斥：同时给 line 和 old_string → 明确错误（二选一）
test("AC1: line + old_string is an explicit mutex error", async () => {
  fixture("a.txt", "one\ntwo\n")
  const r = await editTool.execute({ path: "a.txt", line: 1, old_string: "one", new_string: "1" }, ctx)
  assert.match(r, /^Error: line\/startLine\/endLine are mutually exclusive with old_string/)
  assert.equal(read("a.txt"), "one\ntwo\n") // 原子——错误不写
})

// AC1 — 边界行号越界：line: 999 → 明确错误
test("AC1: out-of-range line number is an explicit error", async () => {
  fixture("a.txt", "one\ntwo\n")
  const r = await editTool.execute({ path: "a.txt", line: 999, new_string: "X" }, ctx)
  assert.match(r, /^Error: line 999 out of range/)
  assert.equal(read("a.txt"), "one\ntwo\n")
})

// AC2 — 正常模糊匹配：old_string 与文件有细微差异（缩进/引号/行尾空格）→ 匹配成功
test("AC2: fuzzy match tolerates whitespace/quote differences", async () => {
  fixture("a.js", 'const a = 1\n\tconst x = “hello”   \nconst b = 2\n')
  const r = await editTool.execute({ path: "a.js", old_string: 'const x = "hello"', new_string: 'const x = "world"' }, ctx)
  assert.match(r, /Replaced 1 occurrence\(s\).*fuzzy match/)
  assert.equal(read("a.js"), 'const a = 1\nconst x = "world"\nconst b = 2\n')
})

// AC2 — 歧义规则（评审 #2）：多模糊命中 → 报错附候选，不猜
test("AC2: multiple fuzzy matches error with candidates", async () => {
  fixture("a.js", 'const x = “a”\nfoo()\n  const x = “a”  \n')
  const r = await editTool.execute({ path: "a.js", old_string: 'const x = "a"', new_string: 'const x = "b"' }, ctx)
  assert.match(r, /^Error: old_string fuzzy-matches 2 regions.*ambiguous/)
  assert.match(r, /fuzzy-match candidates:/)
  assert.match(r, /L1:/)
  assert.match(r, /L3:/)
  assert.equal(read("a.js"), 'const x = “a”\nfoo()\n  const x = “a”  \n') // 原子——错误不写
})

// AC2 — 错误模糊匹配失败：差异太大 → not found（含 searched/similar lines 诊断）
test("AC2: too-different old_string stays a not-found error", async () => {
  fixture("a.js", "const a = 1\nconst b = 2\n")
  const r = await editTool.execute({ path: "a.js", old_string: "completely different content", new_string: "X" }, ctx)
  assert.match(r, /^Error: old_string not found in a\.js/)
  assert.match(r, /searched:/)
})

// AC3 — 替换即删（diff 层）：零重叠 → 旧行被替换并删除（无残留）
test("AC3: zero-overlap patch replaces and deletes old lines", () => {
  const r = applyPatchLines("alpha\nbeta", "gamma")
  assert.equal(r.ok, true)
  assert.equal(r.resultText, "gamma") // 旧行 alpha/beta 消失——原语义为 "alpha\nbeta\ngamma"
})

// AC3 — 替换即删（工具层）：多行 old_string 零重叠替换后旧行从文件消失
test("AC3: multi-line zero-overlap edit deletes the old lines", async () => {
  fixture("a.txt", "head\nold-one\nold-two\ntail\n")
  const r = await editTool.execute({ path: "a.txt", old_string: "old-one\nold-two", new_string: "new-one" }, ctx)
  assert.match(r, /Replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "head\nnew-one\ntail\n")
})

// AC4 — 向后兼容：现有精确匹配保持可用（单行就地替换）
test("AC4: exact single-line replace keeps working", async () => {
  fixture("a.txt", "one\ntwo\nthree\n")
  const r = await editTool.execute({ path: "a.txt", old_string: "two", new_string: "TWO" }, ctx)
  assert.match(r, /Replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "one\nTWO\nthree\n")
})

// AC4 — 向后兼容：带共享上下文行的多行 LCS 替换保持可用
test("AC4: multi-line edit with shared context keeps LCS semantics", async () => {
  fixture("a.txt", "start\nmiddle\nend\n")
  const r = await editTool.execute({ path: "a.txt", old_string: "start\nmiddle", new_string: "start\nMIDDLE\nextra" }, ctx)
  assert.match(r, /Replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "start\nMIDDLE\nextra\nend\n")
})

// AC4 — 向后兼容：replace_all 字面替换保持可用
test("AC4: replace_all literal swap keeps working", async () => {
  fixture("a.txt", "foo x\nbar\nfoo y\n")
  const r = await editTool.execute({ path: "a.txt", old_string: "foo", new_string: "baz", replace_all: true }, ctx)
  assert.match(r, /Replaced 2 occurrence\(s\)/)
  assert.equal(read("a.txt"), "baz x\nbar\nbaz y\n")
})
