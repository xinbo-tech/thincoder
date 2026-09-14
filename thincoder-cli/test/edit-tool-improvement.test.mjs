/**
 * edit-tool-improvement.test.mjs — edit 工具改进（EDIT.md——2026-09-08 D1/D2/D3 已并入 §2-§5）：
 * D1 按行号改（line/startLine/endLine）/ D2 模糊匹配（normalize + ≥90% 行相等）/
 * D3 替换即删（零重叠→旧行删除）/ AC4 向后兼容。
 * 阶段 2（EDIT.md §8——2026-09-08）：删行形态（省略 new_string——8.1 空串 vs 省略矩阵）/ 
 * normalize 统一（弯引号/反引号 → 直双引号单遍映射——8.2）/
 * 防误匹配（无行内 \s+ 折叠——结构不同文字相似行不命中）。
 *
 * 条目级用例走 computeEditEntry / applyPatchLines / validateEditEntry（纯内存——快层）；
 * 落盘端到端（runSingleEdit / applyEditBatch 写 tmp 文件）为 fs 重活——slow() 门控。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { computeEditEntry, applyPatchLines, runSingleEdit } from "@thincoder/core/tools/edit-diff.mjs"
import { applyEditBatch, FUZZY_MATCH_NOTE, normalizeEditLine } from "@thincoder/core/tools/edit-batch.mjs"
import { slow } from "./slow.mjs"

const OPTS = { path: "f.txt" }

// ---- AC1 按行号改（D1） ----------------------------------------------------

test("AC1 line: 单行替换（不用 old_string）", () => {
  const content = Array.from({ length: 20 }, (_, i) => `line${i + 1}`).join("\n") + "\n"
  const out = computeEditEntry(content, { line: 10, new_string: "新内容" }, OPTS)
  const lines = out.updated.split("\n")
  assert.equal(lines[9], "新内容")
  assert.equal(lines[8], "line9") // 前后行不动
  assert.equal(lines[10], "line11")
  assert.equal(out.editStartLine, 10)
  assert.equal(out.lineShift, 0)
  assert.ok(out.updated.endsWith("\n")) // 尾随换行保持
})

test("AC1 startLine/endLine: 行范围替换（闭区间）", () => {
  const content = Array.from({ length: 20 }, (_, i) => `line${i + 1}`).join("\n") + "\n"
  const out = computeEditEntry(content, { startLine: 5, endLine: 8, new_string: "A\nB\nC" }, OPTS)
  const lines = out.updated.split("\n")
  assert.deepEqual(lines.slice(3, 8), ["line4", "A", "B", "C", "line9"])
  assert.equal(out.lineShift, 3 - 4) // 4 行 → 3 行
  assert.equal(out.editStartLine, 5)
})

test("AC1 边界互斥: line 与 old_string 同给 → 明确错误", () => {
  assert.throws(
    () => computeEditEntry("a\nb\n", { line: 1, old_string: "a", new_string: "x" }, OPTS),
    /mutually exclusive with old_string/
  )
})

test("AC1 边界互斥: line 与 startLine 同给 → 明确错误", () => {
  assert.throws(
    () => computeEditEntry("a\nb\n", { line: 1, startLine: 1, endLine: 2, new_string: "x" }, OPTS),
    /mutually exclusive with startLine\/endLine/
  )
})

test("AC1 边界: startLine/endLine 须成对", () => {
  assert.throws(
    () => computeEditEntry("a\nb\n", { startLine: 1, new_string: "x" }, OPTS),
    /must be given together/
  )
})

test("AC1 边界行号越界: line 999 → 明确错误", () => {
  const content = Array.from({ length: 100 }, (_, i) => `l${i + 1}`).join("\n") + "\n"
  assert.throws(
    () => computeEditEntry(content, { line: 999, new_string: "x" }, OPTS),
    /line 999 out of range — f\.txt has 100 line\(s\)/
  )
})

test("AC1 边界: endLine 越界 / endLine < startLine / 非正整数 / replace_all / 空 new", () => {
  assert.throws(() => computeEditEntry("a\nb\n", { startLine: 1, endLine: 99, new_string: "x" }, OPTS), /out of range/)
  assert.throws(() => computeEditEntry("a\nb\n", { startLine: 2, endLine: 1, new_string: "x" }, OPTS), /before startLine/)
  assert.throws(() => computeEditEntry("a\nb\n", { line: 0, new_string: "x" }, OPTS), /positive integer/)
  assert.throws(() => computeEditEntry("a\nb\n", { line: 1.5, new_string: "x" }, OPTS), /positive integer/)
  assert.throws(() => computeEditEntry("a\nb\n", { line: 1, new_string: "x", replace_all: true }, OPTS), /does not apply/)
  assert.throws(() => computeEditEntry("a\nb\n", { line: 1, new_string: "" }, OPTS), /empty new_string/)
})

// ---- AC2 模糊匹配（D2） ----------------------------------------------------

test("AC2 模糊匹配: 引号差异（单↔双）单行命中", () => {
  const out = computeEditEntry('const x = "a"\n', { old_string: "const x = 'a'", new_string: "const y = 1" }, OPTS)
  assert.equal(out.updated, "const y = 1\n")
  assert.equal(out.note, FUZZY_MATCH_NOTE) // 落点明示
})

test("AC2 模糊匹配: 缩进 tab vs space + 行尾空格 + 引号差异命中", () => {
  // 引号差异使 trim() 不等价（P15.11 空白档不命中）→ 落到 fuzzy 档
  const content = "function f() {\n\treturn 'a'  \n}\n"
  const out = computeEditEntry(
    content,
    { old_string: "function f() {\n  return \"a\"\n}", new_string: "function g() {\n  return 2\n}" },
    OPTS
  )
  assert.equal(out.updated, "function g() {\n  return 2\n}\n")
  assert.equal(out.note, FUZZY_MATCH_NOTE)
})

test("AC2 模糊匹配: 10 行 9 行相等（≥90%）命中", () => {
  const fileLines = Array.from({ length: 10 }, (_, i) => `row${i + 1} = data${i + 1}`)
  const oldLines = [...fileLines]
  oldLines[4] = "row5 = WRONG" // 1/10 行内容差异（非 trim 等价——P15.11 不命中，走 fuzzy）
  const out = computeEditEntry(fileLines.join("\n") + "\n", { old_string: oldLines.join("\n"), new_string: "replaced" }, OPTS)
  assert.equal(out.updated, "replaced\n")
  assert.equal(out.note, FUZZY_MATCH_NOTE)
})

test("AC2 错误: 差异太大（<90% 行相等）→ not found 明确错误", () => {
  const fileLines = Array.from({ length: 10 }, (_, i) => `row${i + 1} = data${i + 1}`)
  const oldLines = [...fileLines]
  oldLines[1] = "x1"; oldLines[4] = "x5"; oldLines[7] = "x8" // 3/10 不同 → 0.7 < 0.9
  assert.throws(
    () => computeEditEntry(fileLines.join("\n") + "\n", { old_string: oldLines.join("\n"), new_string: "y" }, OPTS),
    /old_string not found in f\.txt/
  )
})

test("AC2 边界: 多个模糊窗口达标 → 歧义不猜（not found）", () => {
  // 两处窗口 normalize 后都与 old 相等 → 歧义 → not-found 报错引导（不猜）
  const content = "const a = 'x'\nconst b = 2\nconst a = 'x'\n"
  assert.throws(
    () => computeEditEntry(content, { old_string: 'const a = "x"', new_string: "z" }, OPTS),
    /old_string not found/
  )
})

// ---- AC3 替换即删（D3） ----------------------------------------------------

test("AC3 applyPatchLines: 零重叠 → 替换即删（旧行消失）", () => {
  const r = applyPatchLines("a\nb", "c\nd")
  assert.equal(r.ok, true)
  assert.equal(r.resultText, "c\nd") // 旧行 a/b 不保留（原语义为 "a\nb\nc\nd" 插入）
})

test("AC3 computeEditEntry: 多行零重叠替换后旧行从文件消失", () => {
  const content = "head\nold1\nold2\ntail\n"
  const out = computeEditEntry(content, { old_string: "old1\nold2", new_string: "new1\nnew2" }, OPTS)
  assert.equal(out.updated, "head\nnew1\nnew2\ntail\n")
  assert.ok(!out.updated.includes("old1"))
  assert.equal(out.lineShift, 0)
})

// ---- AC4 向后兼容 ----------------------------------------------------------

test("AC4 精确单行替换（分支 0）保持可用", () => {
  const out = computeEditEntry("a\nb\nc\n", { old_string: "b", new_string: "B" }, OPTS)
  assert.equal(out.updated, "a\nB\nc\n")
  assert.equal(out.lineShift, 0)
})

test("AC4 LCS 有公共行：公共行保留、old 独有删、new 独有插", () => {
  const out = computeEditEntry("a\nb\nc\n", { old_string: "a\nb\nc", new_string: "a\nB\nc" }, OPTS)
  assert.equal(out.updated, "a\nB\nc\n")
})

test("AC4 not-found 引导保持（含 searched/similar lines 段形态）", () => {
  assert.throws(
    () => computeEditEntry("totally different\n", { old_string: "zzz nothing alike", new_string: "y" }, OPTS),
    /old_string not found in f\.txt/
  )
})

test("AC4 edits 数组与顶层 line 参数互斥", async () => {
  const dir = await mkdtemp(join(tmpdir(), "thincoder-edit-"))
  try {
    const p = join(dir, "a.txt")
    await writeFile(p, "a\nb\n", "utf8")
    await assert.rejects(
      applyEditBatch({ path: p, line: 1, edits: [{ old_string: "a", new_string: "A" }] }, { cwd: dir }),
      /mutually exclusive/
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

// ---- 阶段2 删行形态（EDIT.md §8.1——省略 new_string = 删行/范围） -------------

test("阶段2 删行: line 省略 new_string = 删单行", () => {
  const content = Array.from({ length: 5 }, (_, i) => `l${i + 1}`).join("\n") + "\n"
  const out = computeEditEntry(content, { line: 3 }, OPTS)
  assert.equal(out.deleted, true)
  assert.equal(out.updated, "l1\nl2\nl4\nl5\n")
  assert.equal(out.lineShift, -1)
  assert.equal(out.editStartLine, 3)
  assert.equal(out.occurrences, 1)
  assert.equal(out.note, null)
})

test("阶段2 删行: startLine/endLine 省略 new_string = 删范围（闭区间）", () => {
  const content = Array.from({ length: 6 }, (_, i) => `l${i + 1}`).join("\n") + "\n"
  const out = computeEditEntry(content, { startLine: 2, endLine: 4 }, OPTS)
  assert.equal(out.deleted, true)
  assert.equal(out.updated, "l1\nl5\nl6\n")
  assert.equal(out.lineShift, -3)
  assert.equal(out.editStartLine, 2)
})

test("阶段2 删行: 首行/末行 + 尾随换行语义（含无尾换行文件）", () => {
  const c = "l1\nl2\nl3\n"
  assert.equal(computeEditEntry(c, { line: 1 }, OPTS).updated, "l2\nl3\n")
  assert.equal(computeEditEntry(c, { line: 3 }, OPTS).updated, "l1\nl2\n") // 末行删——前行终止符保留
  assert.equal(computeEditEntry("l1\nl2", { line: 2 }, OPTS).updated, "l1") // 无尾换行不引入
  assert.equal(computeEditEntry("l1\nl2", { line: 1 }, OPTS).updated, "l2")
})

test("阶段2 删行边界: 删全部行 → 空文件（无剩余行即无终止符）", () => {
  const out = computeEditEntry("l1\nl2\nl3\n", { startLine: 1, endLine: 3 }, OPTS)
  assert.equal(out.deleted, true)
  assert.equal(out.updated, "")
  assert.equal(out.lineShift, -3)
})

test("阶段2 空串矩阵: 行号形态显式空串 = 显式错（提示省略 new_string 删行）", () => {
  assert.throws(
    () => computeEditEntry("a\nb\n", { line: 1, new_string: "" }, OPTS),
    /OMIT new_string to delete the line\/range/
  )
  assert.throws(
    () => computeEditEntry("a\nb\n", { startLine: 1, endLine: 2, new_string: "" }, OPTS),
    /empty new_string/
  )
})

test("阶段2 空串矩阵: 内容形态空串仍拒 / 省略 new_string 仍拒（无界意图——非删行）", () => {
  assert.throws(() => computeEditEntry("a\nb\n", { old_string: "a", new_string: "" }, OPTS), /empty new_string/)
  assert.throws(() => computeEditEntry("a\nb\n", { old_string: "a" }, OPTS), /new_string must be a string \(missing\)/)
  // replace_all 不得绕过空串保护（否则静默删除全部 occurrences——防损坏路径）
  assert.throws(() => computeEditEntry("a\nb\na\n", { old_string: "a", new_string: "", replace_all: true }, OPTS), /empty new_string/)
})

test("阶段2 删行边界: 越界行号删行 → 明确错误", () => {
  const c = Array.from({ length: 100 }, (_, i) => `l${i + 1}`).join("\n") + "\n"
  assert.throws(() => computeEditEntry(c, { line: 999 }, OPTS), /line 999 out of range — f\.txt has 100 line\(s\)/)
  assert.throws(() => computeEditEntry(c, { startLine: 1, endLine: 999 }, OPTS), /out of range/)
})

test("阶段2 校验: 行号形态非字符串 new_string → 明确错误", () => {
  assert.throws(() => computeEditEntry("a\nb\n", { line: 1, new_string: 5 }, OPTS), /new_string must be a string \(got number\)/)
  assert.throws(() => computeEditEntry("a\nb\n", { startLine: 1, endLine: 2, new_string: null }, OPTS), /new_string must be a string \(got object\)/)
})

// ---- 阶段2 normalize 统一（EDIT.md §8.2——弯引号/反引号 → 直双引号单遍映射） ----

test("阶段2 normalize: 弯引号/反引号差异单行命中（目标字符 = 直双引号）", () => {
  const content = 'const x = "a"\n'
  const variants = ["const x = \u2018a\u2019", "const x = \u201ca\u201d", "const x = `a`", "const x = 'a'"]
  for (const variant of variants) {
    const out = computeEditEntry(content, { old_string: variant, new_string: "const y = 1" }, OPTS)
    assert.equal(out.updated, "const y = 1\n", `variant: ${variant}`)
    assert.equal(out.note, FUZZY_MATCH_NOTE, `variant: ${variant}`)
  }
})

test("阶段2 normalize: 单遍字符映射（tab/引号/行尾空白/trim 同遍）", () => {
  assert.equal(normalizeEditLine("\tx = 'a\u2019"), 'x = "a"')
  assert.equal(normalizeEditLine("\u201cx\u201d  "), '"x"')
  assert.equal(normalizeEditLine("  a\tb  "), "a  b") // tab→2 空格；行内多空格保留（无折叠）
})

test("阶段2 防误匹配: 行内多空格结构差异（文字相同）不命中——无行内 \\s+ 折叠", () => {
  // 与文件仅 1 行不同：内部空格布局不同（对齐结构）——trim 不等价 → P15.11 不命中；
  // normalize 无折叠 → fuzzy 不等 → not-found（结构是信息——不因文字相似误匹配）
  const content = "def f():\n    a = 1\n    b = 2\n    c = 3\n    return\n"
  const old = "def f():\n    a = 1\n    b  =  2\n    c = 3\n    return"
  assert.throws(
    () => computeEditEntry(content, { old_string: old, new_string: "x" }, OPTS),
    /old_string not found/
  )
})

// ---- 端到端（fs 落盘——slow 层） -------------------------------------------

slow("AC1 端到端: runSingleEdit 按行号改写盘（含尾随换行保持）", async () => {
  const dir = await mkdtemp(join(tmpdir(), "thincoder-edit-"))
  try {
    const p = join(dir, "e2e.txt")
    await writeFile(p, "l1\nl2\nl3\n", "utf8")
    const res = await runSingleEdit({ path: p, line: 2, new_string: "L2" }, { cwd: dir })
    assert.equal(await readFile(p, "utf8"), "l1\nL2\nl3\n")
    assert.match(res, /Edited .* replaced 1 occurrence\(s\)/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

slow("AC1+AC2 端到端: 批量 edits 混用行号条目与模糊条目（串行累积、原子）", async () => {
  const dir = await mkdtemp(join(tmpdir(), "thincoder-edit-"))
  try {
    const p = join(dir, "batch.txt")
    await writeFile(p, 'one\ntwo\nconst x = "a"\n', "utf8")
    const res = await applyEditBatch(
      {
        path: p,
        edits: [
          { line: 1, new_string: "ONE" },
          { old_string: "const x = 'a'", new_string: "const y = 1" }, // 模糊命中
        ],
      },
      { cwd: dir }
    )
    assert.equal(await readFile(p, "utf8"), "ONE\ntwo\nconst y = 1\n")
    assert.match(res, /fuzzy match/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

slow("阶段2 端到端: runSingleEdit 删行落盘（返回 Deleted line N / Deleted lines N-M）", async () => {
  const dir = await mkdtemp(join(tmpdir(), "thincoder-edit-"))
  try {
    const p = join(dir, "del.txt")
    await writeFile(p, "l1\nl2\nl3\nl4\n", "utf8")
    const res = await runSingleEdit({ path: p, line: 2 }, { cwd: dir })
    assert.equal(await readFile(p, "utf8"), "l1\nl3\nl4\n")
    assert.match(res, /Deleted line 2 of .*del\.txt/)
    const res2 = await runSingleEdit({ path: p, startLine: 2, endLine: 3 }, { cwd: dir })
    assert.equal(await readFile(p, "utf8"), "l1\n")
    assert.match(res2, /Deleted lines 2-3 of .*del\.txt/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

slow("阶段2 端到端: 批量 edits 删行条目 + 模糊替换条目（混合、原子、返回格式）", async () => {
  const dir = await mkdtemp(join(tmpdir(), "thincoder-edit-"))
  try {
    const p = join(dir, "batch.txt")
    await writeFile(p, 'one\ntwo\nthree\nconst x = "a"\n', "utf8")
    const res = await applyEditBatch(
      {
        path: p,
        edits: [
          { line: 2 }, // 删行条目（省略 new_string）
          { old_string: "const x = 'a'", new_string: "const y = 1" }, // 模糊命中条目
        ],
      },
      { cwd: dir }
    )
    assert.equal(await readFile(p, "utf8"), "one\nthree\nconst y = 1\n")
    assert.match(res, /Deleted line 2 of .*batch\.txt/)
    assert.match(res, /fuzzy match/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
