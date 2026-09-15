/**
 * edit-tool-improvement.test.mjs — edit 工具语义（EDIT.md——2026-09-08 D1/D2/D3 已并入 §2-§5）：
 * D1 按行号改（line/startLine/endLine）/ D2 模糊匹配（normalize + ≥90% 行相等）/
 * D3 替换即删（零重叠→旧行删除）/ AC4 向后兼容。
 * 阶段 2（EDIT.md §8——2026-09-08）：删行形态（省略 new_string——8.1 空串 vs 省略矩阵：
 * 显式空串 = 显式错、仅省略才删；批量条目行号——8.4）/
 * normalize 统一（弯引号/反引号/ASCII 单引号 → 直双引号单遍映射、无行内折叠——8.2）/
 * 批量混用行号 + 内容条目端到端。
 *
 * W14（2026-09-15 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W14）：本档改指**核面**
 * ——`editTool` / `applyPatchLines` / `normalizeEditLine` 全数引 `@thincoder/core/tools/*`
 * （端自持镜像档 `file-edit.mjs` / `edit-diff.mjs` / `edit-fuzzy-match.mjs` 已随单元删除）。
 * 断言形态按核实现收正：成功消息 = `Edited <path>: replaced N occurrence(s)` / `Deleted … of …`；
 * 参数错误 = **throw**（端侧 agent 循环转 "Error: …" 结果）⇒ 用 `assert.rejects` 断言。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
// W13（2026-09-15 · 快层 slow 门 D-T6 收口）：AC2/stage2 变体例 = 真 fs fixture × 4 变体——
// 并行快层负载下实测 >500ms（独立跑 ~360ms）⇒ 按「重 IO 用例归册」入慢层（快层 skip；
// test:full 照跑——不删用例）。
import { slow } from "./slow.mjs"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { editTool } from "@thincoder/core/tools/file.mjs"
import { applyPatchLines } from "@thincoder/core/tools/edit-diff.mjs"
import { normalizeEditLine } from "@thincoder/core/tools/edit-batch.mjs"

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
  assert.match(r, /^Edited a\.txt: replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "one\nTWO\nthree\n")
})

// AC1 — 正常行范围改：startLine/endLine 闭区间替换
test("AC1: edit by line range replaces the inclusive range", async () => {
  fixture("a.txt", "one\ntwo\nthree\nfour\nfive\n")
  const r = await editTool.execute({ path: "a.txt", startLine: 2, endLine: 4, new_string: "X\nY" }, ctx)
  assert.match(r, /^Edited a\.txt: replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "one\nX\nY\nfive\n")
})

// 阶段2 删行形态（EDIT.md §8.1）——省略 new_string = 删单行（有界意图；8.1 空串 vs 省略矩阵）
test("AC1/stage2: omitted new_string with line deletes the line", async () => {
  fixture("a.txt", "one\ntwo\nthree\n")
  const r = await editTool.execute({ path: "a.txt", line: 2 }, ctx)
  assert.match(r, /^Deleted line 2 of a\.txt/)
  assert.equal(read("a.txt"), "one\nthree\n")
})

// 阶段2 — 省略 new_string + startLine/endLine = 删范围（闭区间）
test("AC1/stage2: omitted new_string with line range deletes the range", async () => {
  fixture("a.txt", "one\ntwo\nthree\nfour\n")
  const r = await editTool.execute({ path: "a.txt", startLine: 2, endLine: 3 }, ctx)
  assert.match(r, /^Deleted lines 2-3 of a\.txt/)
  assert.equal(read("a.txt"), "one\nfour\n")
})

// 阶段2 空串矩阵（EDIT.md §8.1）——行号形态显式空串 = 显式错误（防误删；提示省略以删行）
test("AC1/stage2: explicit empty new_string with line is an explicit error", async () => {
  fixture("a.txt", "one\ntwo\nthree\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.txt", line: 2, new_string: "" }, ctx),
    /empty new_string with line-based targeting is an explicit error — OMIT new_string to delete the line\/range/,
  )
  assert.equal(read("a.txt"), "one\ntwo\nthree\n") // 原子——错误不写
})

// AC1 — 边界互斥：同时给 line 和 old_string → 明确错误（二选一）
test("AC1: line + old_string is an explicit mutex error", async () => {
  fixture("a.txt", "one\ntwo\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.txt", line: 1, old_string: "one", new_string: "1" }, ctx),
    /line\/startLine\/endLine are mutually exclusive with old_string/,
  )
  assert.equal(read("a.txt"), "one\ntwo\n") // 原子——错误不写
})

// 修正轮（评审 #2 🟡）：replace_all 守卫真值化——true + line 仍拒；false/缺省 + line 放行（与批量/CLI 对齐）
test("AC1: replace_all:true with line is rejected, false/omitted is allowed", async () => {
  fixture("a.txt", "one\ntwo\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.txt", line: 1, new_string: "ONE", replace_all: true }, ctx),
    /replace_all does not apply to line-based edits/,
  )
  assert.equal(read("a.txt"), "one\ntwo\n") // 原子——错误不写
  fixture("a.txt", "one\ntwo\n")
  const ok = await editTool.execute({ path: "a.txt", line: 1, new_string: "ONE", replace_all: false }, ctx)
  assert.match(ok, /^Edited a\.txt: replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "ONE\ntwo\n")
})

// AC1 — 边界行号越界：line: 999 → 明确错误
test("AC1: out-of-range line number is an explicit error", async () => {
  fixture("a.txt", "one\ntwo\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.txt", line: 999, new_string: "X" }, ctx),
    /line 999 out of range/,
  )
  assert.equal(read("a.txt"), "one\ntwo\n")
})

// 阶段2 — 越界删行（省略 new_string）同样明确报错、不写文件
test("AC1/stage2: out-of-range delete is an explicit error", async () => {
  fixture("a.txt", "one\ntwo\n")
  await assert.rejects(() => editTool.execute({ path: "a.txt", line: 999 }, ctx), /line 999 out of range/)
  assert.equal(read("a.txt"), "one\ntwo\n")
})

// AC2 — 正常模糊匹配：old_string 与文件有细微差异（缩进/引号/行尾空格）→ 匹配成功
test("AC2: fuzzy match tolerates whitespace/quote differences", async () => {
  fixture("a.js", 'const a = 1\n\tconst x = “hello”   \nconst b = 2\n')
  const r = await editTool.execute({ path: "a.js", old_string: 'const x = "hello"', new_string: 'const x = "world"' }, ctx)
  assert.match(r, /replaced 1 occurrence\(s\).*fuzzy match/)
  assert.equal(read("a.js"), 'const a = 1\nconst x = "world"\nconst b = 2\n')
})

// AC2/stage2 — normalize 统一（EDIT.md §8.2）：弯引号/反引号/ASCII 单引号差异 → 直双引号单遍命中
slow("AC2/stage2: curly/backtick/single-quote variants all fuzzy-match", async () => {
  const content = 'const x = "a"\n'
  const variants = ["const x = \u2018a\u2019", "const x = \u201ca\u201d", "const x = `a`", "const x = 'a'"]
  for (const variant of variants) {
    fixture("a.js", content)
    const r = await editTool.execute({ path: "a.js", old_string: variant, new_string: "const y = 1" }, ctx)
    assert.match(r, /fuzzy match/, `variant: ${variant}`)
    assert.equal(read("a.js"), "const y = 1\n", `variant: ${variant}`)
  }
})

// AC2/stage2 — normalize 单遍逐字符映射（tab→2 空格；无行内折叠；trim + 去行尾）
test("AC2/stage2: normalizeEditLine single-pass mapping (CLI parity)", () => {
  assert.equal(normalizeEditLine("\tx = 'a\u2019"), 'x = "a"')
  assert.equal(normalizeEditLine("\u201cx\u201d  "), '"x"')
  assert.equal(normalizeEditLine("  a\tb  "), "a  b") // tab→2 空格；行内多空格保留（无折叠）
})

// AC2/stage2 — 防误匹配：无行内 \s+ 折叠——结构不同（对齐）行不因文字相似被吞
test("AC2/stage2: structurally-different spacing does not fuzzy-match", async () => {
  fixture("a.js", "def f():\n    a = 1\n    b  =  2\n    c = 3\n    return\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.js", old_string: "def f():\n    a = 1\n    b = 2\n    c = 3\n    return", new_string: "x" }, ctx),
    /old_string not found/,
  )
  assert.equal(read("a.js"), "def f():\n    a = 1\n    b  =  2\n    c = 3\n    return\n")
})

// AC2 — 歧义规则（评审 #2）：多模糊命中 → 不猜——走 not-found 报错（核 `findFuzzyWindow` 多窗口
// 达标返回 null ⇒ not-found 路径——候选行随报错附上），文件原样
test("AC2: multiple fuzzy matches do not guess (not-found error, file untouched)", async () => {
  fixture("a.js", 'const x = “a”\nfoo()\n  const x = “a”  \n')
  await assert.rejects(
    () => editTool.execute({ path: "a.js", old_string: 'const x = "a"', new_string: 'const x = "b"' }, ctx),
    /old_string not found/,
  )
  assert.equal(read("a.js"), 'const x = “a”\nfoo()\n  const x = “a”  \n') // 原子——错误不写
})

// AC2 — 错误模糊匹配失败：差异太大 → not found（含 searched/similar lines 诊断）
test("AC2: too-different old_string stays a not-found error", async () => {
  fixture("a.js", "const a = 1\nconst b = 2\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.js", old_string: "completely different content", new_string: "X" }, ctx),
    /old_string not found in a\.js[\s\S]*searched:/,
  )
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
  assert.match(r, /replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "head\nnew-one\ntail\n")
})

// AC4 — 向后兼容：现有精确匹配保持可用（单行就地替换）
test("AC4: exact single-line replace keeps working", async () => {
  fixture("a.txt", "one\ntwo\nthree\n")
  const r = await editTool.execute({ path: "a.txt", old_string: "two", new_string: "TWO" }, ctx)
  assert.match(r, /replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "one\nTWO\nthree\n")
})

// AC4 — 向后兼容：带共享上下文行的多行 LCS 替换保持可用
test("AC4: multi-line edit with shared context keeps LCS semantics", async () => {
  fixture("a.txt", "start\nmiddle\nend\n")
  const r = await editTool.execute({ path: "a.txt", old_string: "start\nmiddle", new_string: "start\nMIDDLE\nextra" }, ctx)
  assert.match(r, /replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "start\nMIDDLE\nextra\nend\n")
})

// AC4 — 向后兼容：replace_all 字面替换保持可用
test("AC4: replace_all literal swap keeps working", async () => {
  fixture("a.txt", "foo x\nbar\nfoo y\n")
  const r = await editTool.execute({ path: "a.txt", old_string: "foo", new_string: "baz", replace_all: true }, ctx)
  assert.match(r, /replaced 2 occurrence\(s\)/)
  assert.equal(read("a.txt"), "baz x\nbar\nbaz y\n")
})

// ---- 阶段2 批量行号补（EDIT.md §8.4——批量条目级行号 + 删行形态） --------------

// 批量条目行号替换：edits 条目带 line（内容条目混用）——串行累积、原子、回显按条
test("stage2 batch: line-numbered entry replaces via edits array", async () => {
  fixture("a.txt", "one\ntwo\nthree\nfour\n")
  const r = await editTool.execute({ path: "a.txt", edits: [
    { line: 2, new_string: "TWO" },
    { old_string: "four", new_string: "FOUR" },
  ] }, ctx)
  assert.match(r, /replaced 1 occurrence\(s\)/)
  assert.match(r, /replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "one\nTWO\nthree\nFOUR\n")
})

// 批量条目删行（EDIT.md §8.1 + 8.4）：条目含行号 + 省略 new_string = 删行（与顶层同语义）
test("stage2 batch: line entry without new_string deletes the line", async () => {
  fixture("a.txt", "one\ntwo\nthree\n")
  const r = await editTool.execute({ path: "a.txt", edits: [
    { line: 2 },
    { old_string: "one", new_string: "ONE" },
  ] }, ctx)
  assert.match(r, /Deleted line 2 of a\.txt/)
  assert.match(r, /replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "ONE\nthree\n")
})

// 批量条目删范围：startLine/endLine + 省略 new_string = 删范围
test("stage2 batch: range entry without new_string deletes the range", async () => {
  fixture("a.txt", "one\ntwo\nthree\nfour\nfive\n")
  const r = await editTool.execute({ path: "a.txt", edits: [{ startLine: 2, endLine: 4 }] }, ctx)
  assert.match(r, /Deleted lines 2-4 of a\.txt/)
  assert.equal(read("a.txt"), "one\nfive\n")
})

// 批量条目显式空串：行号条目 new_string: "" → 显式错误（矩阵——省略才删）
test("stage2 batch: explicit empty new_string on a line entry errors", async () => {
  fixture("a.txt", "one\ntwo\nthree\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.txt", edits: [{ line: 2, new_string: "" }] }, ctx),
    /empty new_string with line-based targeting is an explicit error — OMIT new_string to delete the line\/range/,
  )
  assert.equal(read("a.txt"), "one\ntwo\nthree\n") // 原子——错误不写
})

// 批量条目越界删行：行号超文件行数 → 明确错误（原子——全不写）
test("stage2 batch: out-of-range delete entry errors atomically", async () => {
  fixture("a.txt", "one\ntwo\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.txt", edits: [{ line: 99 }, { old_string: "one", new_string: "ONE" }] }, ctx),
    /edit aborted \(atomic — no files written\): line 99 out of range/,
  )
  assert.equal(read("a.txt"), "one\ntwo\n") // 原子——错误不写
})

// 批量混用行号 + 内容条目端到端（串行累积 + 模糊命中条目——8.4 与 CLI 对齐）
test("stage2 batch: line entries + fuzzy content entry end-to-end", async () => {
  fixture("a.txt", "one\ntwo\nconst x = “a”\n")
  const r = await editTool.execute({ path: "a.txt", edits: [
    { line: 1, new_string: "ONE" },
    { old_string: 'const x = "a"', new_string: "const y = 1" }, // 弯引号差异 → 模糊命中
    { line: 2 }, // 删行
  ] }, ctx)
  assert.match(r, /replaced 1 occurrence\(s\)/)
  assert.match(r, /fuzzy match/)
  assert.match(r, /Deleted line 2 of a\.txt/) // 删行条目行号 = 应用前累积行号（前两条已改：L1 改、L3 改 → 删 L2）
  assert.equal(read("a.txt"), "ONE\nconst y = 1\n")
})

// 批量内容形态空串仍拒（内容形态删行无命名形态——显式错；省略 old_string 无批语义）
test("stage2 batch: content entry empty new_string stays an error", async () => {
  fixture("a.txt", "one\ntwo\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.txt", edits: [{ old_string: "one", new_string: "" }] }, ctx),
    /empty new_string —/,
  )
  assert.equal(read("a.txt"), "one\ntwo\n")
})

// 顶层 path + 批量：条目缺 path 时默认顶层 path（互斥语义不变——edits 与顶层形态互斥）
test("AC4: edits array still works with a top-level path default", async () => {
  fixture("a.txt", "one\ntwo\n")
  const r = await editTool.execute({ path: "a.txt", edits: [
    { old_string: "one", new_string: "ONE" },
    { old_string: "two", new_string: "TWO" },
  ] }, ctx)
  assert.match(r, /replaced 1 occurrence\(s\)/)
  assert.equal(read("a.txt"), "ONE\nTWO\n")
})

// 顶层形态 + edits 互斥（顶层 old_string 与 edits 同给 → 显式错误）
test("AC4: top-level old_string with edits array is a mutex error", async () => {
  fixture("a.txt", "one\ntwo\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.txt", old_string: "one", new_string: "1", edits: [{ old_string: "two", new_string: "2" }] }, ctx),
    /edits array is mutually exclusive with top-level old_string/,
  )
  assert.equal(read("a.txt"), "one\ntwo\n")
})

// 顶层行号 + edits 互斥（阶段 2——顶层 line 与 edits 数组同给 → 显式错误）
test("stage2: top-level line with edits array is a mutex error", async () => {
  fixture("a.txt", "one\ntwo\n")
  await assert.rejects(
    () => editTool.execute({ path: "a.txt", line: 1, edits: [{ old_string: "two", new_string: "2" }] }, ctx),
    /edits array is mutually exclusive with top-level old_string\/new_string\/line\/startLine\/endLine/,
  )
  assert.equal(read("a.txt"), "one\ntwo\n")
})
