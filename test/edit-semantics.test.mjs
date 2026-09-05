/**
 * edit-semantics.test.mjs — TOOLS.md §15 acceptance tests (D15.1–D15.6).
 *
 * Coverage mapping:
 *   T15.1–T15.9   LCS edit semantics — applyPatchLines unit + editTool.execute
 *                 integration (T15.6/T15.9 are covered by the batch/replace_all
 *                 suites in edit-eol.test.mjs / file-tools.test.mjs — the exits
 *                 at the diff layer are asserted here).
 *   T15.33–T15.36 §15.2 分支 0 mirror — tool-level in-place single-line replace /
 *                 multi-match untouched / multi-line zero-overlap insert /
 *                 multi-line LCS regressions (the applyPatchLines-direct unit
 *                 stays at pure-diff semantics: bare single×single direct calls
 *                 still insert — D15.9.1 lives in the entry layer only).
 *   T15.10b       verbatim description anchors (fail-when-unchanged — VS Code
 *                 embedded descriptions; the CLI .md side lives in the CLI repo).
 *   T15.11–T15.14 timer/verify/read/task parity batch (D15.3).
 *   T15.16        six-element walkthrough — scripted inventory: every description
 *                 point present + tool-name references ∈ §1 registry
 *                 (heuristic artifacts documented in IGNORE_TOKENS).
 *   T15.17–T15.20 apply_patch coordless-hunk tolerance (D15.6).
 *   T15.38–T15.44 apply_patch 零上下文 - 锚放宽（§15.3 D15.10.1/NF15.8c——2026-09-04）。
 *
 * §15.2 migration record (2026-09-04): the T15.2 tool-level single×single
 * insert assertions below flipped to branch-0 in-place replacement — inputs
 * migrated to multi-line form where the zero-overlap-insert regression had to
 * survive (batch newApplied write path).
 * §15.3 migration record (2026-09-04): ①T15.18 夹具（0/1 上下文行 + - 锚——原
 * 「报错」期望）按 D15.10.1 放宽为锚序列唯一即应用——夹具换为仍拒形态纯 +（无 - 锚——
 * NF15.8c）；②PATCH_COORDLESS_ANCHOR 断言目标句迁移至 NF15.8c 逐字新锚（AC15.15）。
 */
import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src")

import { applyPatchLines, EMPTY_NEW_REASON, REGION_TOO_LARGE_REASON, MAX_REGION_LINES } from "../src/tools/edit-diff.mjs"

let tmp, cwd
const ctx = () => ({ cwd })
function setup() {
  tmp = mkdtempSync(join(tmpdir(), "thincoder-vscode-edit-sem-"))
  cwd = tmp
}
function cleanup() { rmSync(tmp, { recursive: true, force: true }) }
beforeEach(setup)
afterEach(cleanup)

// ------------------------------------------------------------------ T15.1–T15.9

describe("applyPatchLines — LCS edit semantics (T15.1–T15.3a, T15.4, T15.5, T15.8)", () => {
  it("T15.1: old 两行含公共行 → 公共行保留、新行插入", () => {
    const r = applyPatchLines("A\nB\n", "A\nX\nB\n")
    assert.deepEqual(r, { ok: true, resultText: "A\nX\nB\n" })
  })

  it("T15.1a: new-only 行在首个公共行前 → LCS 序插入（X 在 A 前）", () => {
    const r = applyPatchLines("A\nB\n", "X\nA\nB\n")
    assert.deepEqual(r, { ok: true, resultText: "X\nA\nB\n" })
  })

  it("T15.2: 单行零重叠 → 按插入——old 保留、new 插其后", () => {
    const r = applyPatchLines("old\n", "new\n")
    assert.deepEqual(r, { ok: true, resultText: "old\nnew\n" })
  })

  it("T15.3: 多行 new 与 old 无重叠 → old 全保留、new 整体插后", () => {
    const r = applyPatchLines("A\nB\nC\n", "X\nY\n")
    assert.deepEqual(r, { ok: true, resultText: "A\nB\nC\nX\nY\n" })
  })

  it("T15.3a: 空 new_string（纯删除意图）→ 显式错误，不写", () => {
    const r = applyPatchLines("A\n", "")
    assert.deepEqual(r, { ok: false, reason: EMPTY_NEW_REASON })
    assert.equal(
      EMPTY_NEW_REASON,
      "empty new_string — for deletion, keep the context lines you want to preserve in both old_string and new_string",
      "T15.3a 错误文本逐字（D15.1）",
    )
  })

  it("T15.4: 单行带公共上下文改词 → diff 应用", () => {
    const r = applyPatchLines("prefix\nword\nsuffix\n", "prefix\nWORD\nsuffix\n")
    assert.deepEqual(r, { ok: true, resultText: "prefix\nWORD\nsuffix\n" })
  })

  it("T15.4 变体: 共享行间插入（多段插入按 LCS 序）", () => {
    const r = applyPatchLines("A\nB\nC\n", "A\nX\nB\nY\nC\n")
    assert.deepEqual(r, { ok: true, resultText: "A\nX\nB\nY\nC\n" })
  })

  it("T15.5: old=旧段, new=旧段删一行 → 删除生效", () => {
    const r = applyPatchLines("A\nB\nC\n", "A\nC\n")
    assert.deepEqual(r, { ok: true, resultText: "A\nC\n" })
  })

  it("判定 3: new 与 old 行级一致 → 原样（no-op 成功）", () => {
    const r = applyPatchLines("A\nB\n", "A\nB\n")
    assert.deepEqual(r, { ok: true, resultText: "A\nB\n" })
  })

  it("T15.8: old 超 1000 行 → region too large", () => {
    const big = Array.from({ length: MAX_REGION_LINES + 1 }, (_, i) => `L${i}`).join("\n")
    const r = applyPatchLines(big + "\n", "x\n")
    assert.deepEqual(r, { ok: false, reason: REGION_TOO_LARGE_REASON })
    assert.equal(REGION_TOO_LARGE_REASON, "edit region too large — narrow the change", "T15.8 错误文本逐字（D15.1）")
  })

  it("T15.8: new 超 1000 行 → region too large", () => {
    const big = Array.from({ length: MAX_REGION_LINES + 1 }, (_, i) => `L${i}`).join("\n")
    const r = applyPatchLines("x\n", big + "\n")
    assert.deepEqual(r, { ok: false, reason: REGION_TOO_LARGE_REASON })
  })

  it("EOL: 输入 CRLF 在 LF 域判定；resultText 为 LF（调用方还原原文件 EOL）", () => {
    const r = applyPatchLines("a\r\nb\r\n", "a\nB\n")
    assert.deepEqual(r, { ok: true, resultText: "a\nB\n" })
  })

  it("终止符镜像: old 无尾换行 → result 无尾换行；old 有 → 有", () => {
    assert.equal(applyPatchLines("A\nB", "A\nX\nB").resultText, "A\nX\nB")
    assert.equal(applyPatchLines("A\nB\n", "A\nX\nB\n").resultText, "A\nX\nB\n")
  })
})

describe("editTool.execute — LCS semantics via the tool shell (open doc + disk)", () => {
  it("T15.33 经工具 (§15.2 分支 0): 单行 old 唯一 + 单行 new → 就地替换（旧语义插入——本批翻转）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.txt"), "one\ntwo\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "two", new_string: "THREE" }, ctx())
    assert.match(r, /Replaced 1 occurrence/)
    assert.equal(
      readFileSync(join(cwd, "f.txt"), "utf8"),
      "one\nTHREE\n",
      "分支 0: A 消失 X 在位——行数不变（迁移前此断言期待插入 one\ntwo\nTHREE\n——T15.2 tool 级随 §15.2 翻转）",
    )
  })

  it("T15.34 经工具: 单行 old 多出现（A 两处）→ 仍报既有 occurrences 错误（分支 0 不吞）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.txt"), "A\nA\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "A", new_string: "X" }, ctx())
    assert.match(r, /old_string matches 2 times in f\.txt/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "A\nA\n", "不写")
  })

  it("T15.35 经工具: 多行零重叠（old=[A,B] new=[X,Y]）→ 仍插入（回归——旧语义不动）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.txt"), "A\nB\nC\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "A\nB", new_string: "X\nY" }, ctx())
    assert.match(r, /Replaced 1 occurrence/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "A\nB\nX\nY\nC\n", "零重叠多行插入保留")
  })

  it("T15.36 经工具: 多行 LCS（old=[A,B] new=[A,X]）→ 仍 LCS（回归——公共行保留）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.txt"), "A\nB\nC\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "A\nB", new_string: "A\nX" }, ctx())
    assert.match(r, /Replaced 1 occurrence/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "A\nX\nC\n", "公共行 A 保留——非零重叠插入")
  })

  it("T15.33 经工具 CRLF 变体 (§15.2 分支 0): 单行替换 EOL 保留——CRLF 文件不翻 LF、行数不变", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "crlf.txt"), "one\r\ntwo\r\n")
    const r = await editTool.execute({ path: "crlf.txt", old_string: "two", new_string: "THREE" }, ctx())
    assert.match(r, /Replaced 1 occurrence/)
    assert.equal(readFileSync(join(cwd, "crlf.txt"), "utf8"), "one\r\nTHREE\r\n", "A 消失 X 在位——CRLF 原样保留")
  })


  it("T15.2 经工具 batch: 两条零重叠插入各自生效（多行 new 形态保留——D15.1 newApplied 写入路径回归）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "batch-insert.txt"), "one\n")
    const r = await editTool.execute({
      edits: [
        { path: "batch-insert.txt", old_string: "one", new_string: "TWO\nTHREE" },
        { path: "batch-insert.txt", old_string: "TWO", new_string: "FOUR\nFIVE" },
      ],
    }, ctx())
    assert.match(r, /Replaced 1 occurrence\(s\) in batch-insert\.txt[\s\S]*Replaced 1 occurrence\(s\) in batch-insert\.txt/)
    assert.equal(
      readFileSync(join(cwd, "batch-insert.txt"), "utf8"),
      "one\nTWO\nFOUR\nFIVE\nTHREE\n",
      "两条零重叠插入（old 单行 × new 多行——不落分支 0）串行生效——newApplied 写入路径回归" +
      "（§15.2 迁移：原单行×单行输入已翻转，插入回归以多行形态保留）",
    )
  })

  it("T15.33 经工具 batch (§15.2 分支 0): 单行×单行串行——第二条基于第一条替换结果（batch 接线回归）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "batch-replace.txt"), "one\ntwo\n")
    const r = await editTool.execute({
      edits: [
        { path: "batch-replace.txt", old_string: "one", new_string: "ONE" },
        { path: "batch-replace.txt", old_string: "two", new_string: "TWO" },
      ],
    }, ctx())
    assert.match(r, /Replaced 1 occurrence\(s\) in batch-replace\.txt[\s\S]*Replaced 1 occurrence\(s\) in batch-replace\.txt/)
    assert.equal(readFileSync(join(cwd, "batch-replace.txt"), "utf8"), "ONE\nTWO\n", "两条就地替换均生效——行数不变")
  })

  it("T15.4 经工具: 带公共上下文改词 → 替换（旧行消失）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.txt"), "one\ntwo\nthree\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "two\nthree", new_string: "two\nTHREE" }, ctx())
    assert.match(r, /Replaced 1 occurrence/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "one\ntwo\nTHREE\n")
  })

  it("T15.3a 经工具: 空 new_string → 显式错误，文件不动", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.txt"), "only line\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "only line", new_string: "" }, ctx())
    assert.match(r, /empty new_string — for deletion/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "only line\n")
  })

  it("T15.8 经工具: 超限区域 → 报错不写", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const big = Array.from({ length: MAX_REGION_LINES + 1 }, (_, i) => `L${i}`).join("\n")
    writeFileSync(join(cwd, "f.txt"), "x\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "x", new_string: big + "\n" }, ctx())
    assert.match(r, /region too large/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "x\n")
  })

  it("T15.9: replace_all 保留字面逐处替换（插入规则不适用）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.txt"), "a\na\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "a", new_string: "b", replace_all: true }, ctx())
    assert.match(r, /Replaced 2 occurrence/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "b\nb\n")
  })
})

// ------------------------------------------------------------------ T15.10b

const EDIT_DESC_ANCHOR =
  "Edit a file as a patch. old_string is the current content of the region to change (must match exactly once); new_string is the desired result of that region. Lines shared by both are kept; lines only in new_string take their position relative to the shared lines (LCS order) — when no line overlaps, new_string is inserted after old_string (old content stays) — except a unique single-line old_string paired with a single-line new_string: that exact line is replaced in place (line count unchanged); for a multi-line replacement, include a shared context line — for adding a new line use insert_after: a unique single-line old/new pair replaces the line in place; multi-line zero-overlap pairs still insert per the diff rules above. replace_all keeps literal replacement of every occurrence — the insert rule does not apply."
// §15.2 NF15.7c — 两段镜像锚（设计引号内逐字——fail-when-unchanged——T15.10 系断言目标句迁移）
const EDIT_BRANCH0_ANCHOR =
  "when no line overlaps, new_string is inserted after old_string (old content stays) — except a unique single-line old_string paired with a single-line new_string: that exact line is replaced in place (line count unchanged)"
const EDIT_MULTILINE_ANCHOR =
  "for a multi-line replacement, include a shared context line — for adding a new line use insert_after: a unique single-line old/new pair replaces the line in place; multi-line zero-overlap pairs still insert per the diff rules above"
const EDIT_ROUTE_ANCHOR = "Add a line/entry after a known line → insert_after — includes checklist items and doc lines."
const INSERT_AFTER_ANCHOR =
  "Use this instead of edit when you're adding a new line — a checklist item, a doc heading, a line of prose, a function, an import, or a block — no need to fabricate surrounding context for exact matching."
const HASHLINE_ANCHOR =
  "Replacement text replaces the lines identified by the hashes — content not present in new_content is deleted. For a new line after a known line, use insert_after. For a single simple string swap, use edit."
const WRITE_ANCHOR =
  "write replaces the WHOLE file — read it first and confirm you intend to rewrite it entirely; for a small change use edit / insert_after."
// §15.3 NF15.8c —— 描述锚（评审 #3 逐字定稿——fail-when-unchanged——T15.10 系断言目标句随本批迁移——两端照抄）
const APPLY_PATCH_NF158C_ANCHOR =
  'Hunk header "@@" without coordinates is accepted. Coordinate-less hunks are located by their anchor lines: context lines plus the removed (-) lines, matched as a contiguous sequence — a unique match applies. The anchor-free forms require context: a hunk with no removed (-) lines (pure additions) needs at least 2 context lines for a unique match; a zero/one-context hunk with at least one removed (-) line is located by its anchor sequence (context + removed lines, in order) and applies on a unique match.'
const MUTEX_HINT_ANCHOR = "a top-level path is allowed (default for entries without their own path)"
const HASHLINE_FRESH_HINT = "for fresh hashes, re-read the file with hashes=true"
const TASK_CHECKLIST_ROUTE = "For cross-session / project-level tracking, use checklist"
const LSP_ROUTE_ANCHOR = "Find files with glob / repo_outline — use lsp for definition / references / diagnostics"

describe("T15.10b / D15.6.3 — 描述逐字锚（VS Code 内嵌——fail-when-unchanged）", () => {
  it("edit 描述: 首句 + replace_all 句逐字（D15.1——两端照抄）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    assert.ok(editTool.description.includes(EDIT_DESC_ANCHOR), "D15.1 edit 描述锚逐字（T15.10b）")
  })
  it("edit 描述: §15.2 NF15.7c 两段新锚逐字（分支 0 + 多行引导——fail-when-unchanged——两端照抄）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    assert.ok(editTool.description.includes(EDIT_BRANCH0_ANCHOR), "NF15.7c 锚①——单行替换例外段（分支 0）")
    assert.ok(editTool.description.includes(EDIT_MULTILINE_ANCHOR), "NF15.7c 锚②——多行引导 + insert_after 段")
  })
  it("edit 描述: 路由句逐字（D15.1）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
  })
  it("insert_after 描述: 用例句逐字（D15.2）", async () => {
    const { insertAfterTool } = await import("../src/tools/more-file.mjs")
    assert.ok(insertAfterTool.description.includes(INSERT_AFTER_ANCHOR), "D15.2 insert_after 锚")
  })
  it("hashline_edit 描述: 两句逐字（D15.2）", async () => {
    const { hashlineEditTool } = await import("../src/tools/file.mjs")
    assert.ok(hashlineEditTool.description.includes(HASHLINE_ANCHOR), "D15.2 hashline 锚")
  })
  it("write 描述: 一句逐字（D15.2）", async () => {
    const { writeTool } = await import("../src/tools/file.mjs")
    assert.ok(writeTool.description.includes(WRITE_ANCHOR), "D15.2 write 锚")
  })
  it("apply_patch 描述: NF15.8c 无坐标 hunk 句逐字（§15.3——评审 #3 定稿——两端照抄）", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    assert.ok(applyPatchTool.description.includes(APPLY_PATCH_NF158C_ANCHOR), "§15.3 NF15.8c apply_patch 锚（运行时 .description——源码 \" 转义不影响运行时文本）")
  })
  it("D15.3#9 修订（2026-09-05 用户裁定）: edits 只与顶层 old/new 互斥——顶层 path 合法化锚逐字", () => {
    // 2026-09-05 module-split：edit 语义族迁 file-edit.mjs——源锚随之改指
    const fileSrc = readFileSync(join(SRC_DIR, "tools", "file-edit.mjs"), "utf8")
    assert.ok(fileSrc.includes(MUTEX_HINT_ANCHOR), "D15.3#9 互斥引导锚")
  })
  it("D15.3#10: hashline 新鲜哈希引导逐字", () => {
    const fileSrc = readFileSync(join(SRC_DIR, "tools", "file-edit.mjs"), "utf8")
    assert.ok(fileSrc.includes(HASHLINE_FRESH_HINT), "D15.3#10 新鲜 hash 引导锚")
  })
  it("D15.3#5: task→checklist 路由逐字", async () => {
    const { taskTool } = await import("../src/agent-tools/task.mjs")
    assert.ok(taskTool.description.includes(TASK_CHECKLIST_ROUTE), "D15.3#5 task 路由锚")
  })
  it("D15.3#6: lsp 路由句逐字", async () => {
    const { lspTool } = await import("../src/tools/lsp.mjs")
    assert.ok(lspTool.description.includes(LSP_ROUTE_ANCHOR), "D15.3#6 lsp 路由锚")
  })
})

// ------------------------------------------------------------------ T15.11–T15.14

describe("T15.11–T15.14 — 顺手批（D15.3）", () => {
  it("T15.11: timer seconds 可选 —— schema required 为空、描述 default 180", async () => {
    const { timerTool } = await import("../src/agent-tools/timer.mjs")
    assert.deepEqual(timerTool.parameters.required, [], "T15.11: seconds 可选")
    assert.ok(timerTool.parameters.properties.seconds.description.includes("default 180"), "T15.11: schema 描述 default 180")
    assert.ok(timerTool.description.includes("default 180"), "T15.11: 工具描述 default 180")
    const agent = {}
    const r = timerTool.execute({}, { agent })
    assert.match(r, /Timer set for 180 seconds/, "T15.11: 缺省 180 生效")
  })

  it("T15.12: verify 参数 testNamePattern——filter 明确拒绝（旧名不再接受）", async () => {
    const { verifyTool } = await import("../src/agent-tools/verify.mjs")
    assert.ok(verifyTool.parameters.properties.testNamePattern, "T15.12: 新参数存在")
    assert.ok(!verifyTool.parameters.properties.filter, "T15.12: 旧参数已移除")
    assert.ok(verifyTool.description.includes("renamed from filter"), "T15.12: 描述注明改名")
    const r = await verifyTool.execute({ filter: "x" }, { cwd, agent: {} })
    assert.match(r, /"filter" was renamed to "testNamePattern"/, "T15.12: filter 明确拒绝")
  })

  it("T15.13: read 接受 filePath 别名（VS Code 已有——两端一致）", async () => {
    const { readTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "alias.txt"), "via filePath alias\n")
    const r = await readTool.execute({ filePath: "alias.txt" }, ctx())
    assert.match(r, /via filePath alias/, "T15.13: filePath 别名读取成功")
  })

  it("T15.14: task 状态别名归一（CLI STATUS_ALIASES 镜像——completed→done + warning）", async () => {
    const { taskTool } = await import("../src/agent-tools/task.mjs")
    const agent = {}
    const r = await taskTool.execute(
      { items: [{ title: "T1", status: "completed" }, { title: "T2", status: "finished" }, { title: "T3", status: "in_progress" }] },
      { agent, callbacks: { onTaskUpdate() {} } },
    )
    assert.match(r, /"completed" normalized to "done"/, "T15.14: completed 归一 warning")
    assert.equal(agent._tasks[0].status, "done")
    assert.equal(agent._tasks[1].status, "done")
    assert.equal(agent._tasks[2].status, "in_progress")
    const bad = await taskTool.execute({ items: [{ title: "T", status: "bogus" }] }, { agent: {}, callbacks: {} })
    assert.match(bad, /not valid/, "T15.14: 非别名非法状态仍警告")
  })
})

// ------------------------------------------------------------------ T15.16

const REGISTRY = new Set([
  "read", "write", "edit", "insert_after", "apply_patch", "hashline_edit",
  "lint", "checklist", "ls", "delete", "glob", "grep", "bash", "git",
  "websearch", "fetch", "question", "repo_outline", "code_search", "doc_search",
  "lsp", "execute", "memory", "context", "focus", "file_ops", "process",
  "get_current_time", "tree",
  "task", "recent_changes", "subagent", "plan", "goal", "skill", "verify",
  "timer", "advisor", "eng", "read_history",
  "consult_start", "consult_check", "consult_stop",
])

/**
 * Heuristic artifacts (D15.4 audit findings — documented, NOT registry misses):
 * backtick-quoted shell/param identifiers inside descriptions:
 * - "tool"   — the phrase "Route to a dedicated tool instead of bash" (backticked word in shell.mjs)
 * - "this"   — "Route to this instead of bash" (ops.mjs get_current_time)
 * - "code"   — execute's `code` parameter name
 * - "await" / "import" — JavaScript keywords inside execute's `await import()` route
 */
const IGNORE_TOKENS = new Set(["tool", "this", "code", "await", "import"])

// Shell commands / param names quoted in descriptions are NOT tool references
// (route hints like `cat file` → read). Same set as the D15.4 probe.
const SHELL_COMMANDS = new Set([
  "cat", "type", "node", "findstr", "dir", "del", "rm", "mv", "cp", "ren",
  "ps", "tasklist", "taskkill", "kill", "date", "time", "find", "npm",
  "vsce", "patch", "edits",
])

const POINTS = [
  ["../src/tools/file.mjs", ["readTool", "writeTool", "editTool", "hashlineEditTool"]],
  ["../src/tools/search.mjs", ["globTool", "grepTool"]],
  ["../src/tools/shell.mjs", ["bashTool"]],
  ["../src/tools/git.mjs", ["gitTool"]],
  ["../src/tools/web.mjs", ["websearchTool", "fetchTool"]],
  ["../src/tools/more-file.mjs", ["insertAfterTool", "applyPatchTool", "lsTool", "deleteTool"]],
  ["../src/tools/linter.mjs", ["lintTool"]],
  ["../src/tools/checklist.mjs", ["checklistTool"]],
  ["../src/tools/lsp.mjs", ["lspTool"]],
  ["../src/tools/execute.mjs", ["executeTool"]],
  ["../src/tools/question.mjs", ["questionTool"]],
  ["../src/tools/read_image.mjs", ["readImageTool"]],
  ["../src/tools/code.mjs", ["codeSearchTool", "docSearchTool"]],
  ["../src/repomap.mjs", ["repoOutlineTool"]],
  ["../src/memory-tool.mjs", ["memoryTool"]],
  ["../src/tools/context.mjs", ["contextTool"]],
  ["../src/tools/focus.mjs", ["focusTool"]],
  ["../src/tools/ops.mjs", ["fileOpsTool", "processTool", "getCurrentTimeTool"]],
  ["../src/tools/tree.mjs", ["treeTool"]],
  ["../src/agent-tools/task.mjs", ["taskTool"]],
  ["../src/agent-tools/recent_changes.mjs", ["recentChangesTool"]],
  ["../src/agent-tools/subagent.mjs", ["subagentTool"]],
  ["../src/agent-tools/plan.mjs", ["planTool"]],
  ["../src/agent-tools/goal.mjs", ["goalTool"]],
  ["../src/agent-tools/skill.mjs", ["skillTool"]],
  ["../src/agent-tools/verify.mjs", ["verifyTool"]],
  ["../src/agent-tools/timer.mjs", ["timerTool"]],
  ["../src/agent-tools/advisor.mjs", ["advisorTool"]],
  ["../src/agent-tools/eng.mjs", ["engTool"]],
  ["../src/agent-tools/read-history.mjs", ["readHistoryTool"]],
  ["../src/agent-tools/consult.mjs", ["consultStartTool", "consultCheckTool", "consultStopTool"]],
]

describe("T15.16 — 六要素走查（VS Code 44 点全量脚本化：清单 + 注册表一致性 + 逐点要素矩阵）", () => {
  it("全部描述点存在且非空", async () => {
    const missing = []
    for (const [path, names] of POINTS) {
      let m
      try { m = await import(path) } catch (e) { missing.push(`${path}: import 失败 ${e.message}`); continue }
      for (const n of names) {
        const t = m[n]
        if (!t) missing.push(`${path}::${n} 缺失`)
        else if (!t.description || t.description.length === 0) missing.push(`${path}::${n} 描述为空`)
      }
    }
    assert.deepEqual(missing, [], "描述点清单缺口:\n" + missing.join("\n"))
  })

  it("描述引用的工具名 ∈ §1 注册表（已知启发式伪影白名单除外）", async () => {
    const unknown = []
    for (const [path, names] of POINTS) {
      const m = await import(path)
      for (const n of names) {
        const t = m[n]
        if (!t?.description) continue
        for (const mm of t.description.matchAll(/`([a-z][a-z0-9_]*)(?:\s[^`]*)?`/g)) {
          const ref = mm[1]
          if (!REGISTRY.has(ref) && !IGNORE_TOKENS.has(ref) && !SHELL_COMMANDS.has(ref)) unknown.push(`${path}::${n}: \`${ref}\``)
        }
        // bash 路由句的 "X instead of bash"（shell.mjs 描述自身）
        for (const mm of t.description.matchAll(/\b([a-z][a-z0-9_]*) instead of bash\b/g)) {
          const ref = mm[1]
          if (!REGISTRY.has(ref) && !IGNORE_TOKENS.has(ref) && !SHELL_COMMANDS.has(ref)) unknown.push(`${path}::${n}: "${ref} instead of bash"`)
        }
      }
    }
    assert.deepEqual(unknown, [], "描述引用未知工具名:\n" + unknown.join("\n"))
  })

  // ── 六要素逐点矩阵（D15.4 条款）：①一句话语义 ②参数关系 ③路由 ④破坏性明示 ⑤阻塞性 ⑥结果形态
  // N/A = 该要素对此工具不适用；③/④ 的 N/A 在矩阵行内附理由，②（无显式参数约束）与⑤（同步工具）为默认 N/A。
  // ② 参数约束：仅当参数间存在显式约束规则（相互/联动）才要求；独立参数不构成 ②。
  const PARAM_CONSTRAINT = [
    ["edit", /Lines shared by both are kept/],
    ["hashline_edit", /not present in new_content is deleted/],
    ["write", /replaces the WHOLE file/],
    ["delete", /Refuses to delete git-tracked/],
    ["apply_patch", /atomically: if any hunk fails to apply, nothing is written/],
    ["question", /MUST be plain strings/],
    ["memory", /confirm:true is refused|without confirm/],
    ["checklist", /requires all its children already done/],
    ["task", /replaces the entire list/],
    ["goal", /How completion is PROVEN/],
    ["consult_check", /Call it ALONE in a turn|do NOT batch it/i],
    ["subagent", /async:true|n = 1 on the first check/],
    ["process", /to kill a process use bash/i],
    ["git", /auto-snapshot first/],
    ["execute", /Eval-like flags.*rejected|rejected/i],
    ["timer", /default 180/],
    ["verify", /_touchedFiles/],
  ]
  // ③ 路由 N/A（无同族替代——逐点理由）
  const ROUTE_NA = new Map([
    ["timer", "无同行——唯一计时工具"],
    ["plan", "无同行——模式开关"],
    ["advisor", "无同行——独立评审"],
    ["eng", "无同行——模式开关"],
    ["read_history", "无同行——会话历史唯一入口"],
    ["consult_start", "无同行——会诊发起"],
    ["consult_check", "无同行——会诊读取"],
    ["consult_stop", "无同行——会诊终止"],
    ["subagent", "无同行——子代理通道"],
    ["lint", "被 verify 路由指向——自身无出口同行（execute 手跑即替代）"],
    ["question", "唯一人工询问入口——无同行（直接向用户说明即为替代）"],
  ])
  const ROUTE_RE = /instead of|use [a-z][a-z0-9_]* (instead of|for|to)|Route to|Prefer this over|use .* is simpler|→ [a-z][a-z0-9_]*|use doc_search|use checklist|use task|use memory|use verify|use lint|use code_search or lsp|use the task tool instead|use glob when|use edit \/ insert_after|is the fallback|Use after websearch|Configure a search MCP tool/i
  // ④ 破坏性 N/A（只读/纯插入/模式开关——逐点理由）
  const DESTRUCT_NA = new Map([
    ["insert_after", "纯插入——无覆盖/删除语义"],
    ["process", "只读列表"],
    ["read", "只读"], ["glob", "只读"], ["grep", "只读"],
    ["ls", "只读"], ["tree", "只读"], ["lint", "只读检查——无文件写入"],
    ["lsp", "只读"],
    ["execute", "执行器无文件写入——文件读写归专用工具"],
    ["question", "无数据写入"], ["read_image", "只读"], ["websearch", "只读"], ["fetch", "只读"],
    ["code_search", "只读"], ["doc_search", "只读"], ["repo_outline", "只读"],
    ["context", "只读"], ["focus", "编辑器视图操作——无文件数据变更"],
    ["get_current_time", "只读"], ["timer", "无数据写入"], ["verify", "无数据写入"],
    ["recent_changes", "只读"], ["read_history", "只读"], ["advisor", "只读子代理"],
    ["plan", "模式开关——无数据变更"], ["eng", "模式开关——无数据变更"],
    ["skill", "加载只读指令"], ["consult_start", "会诊发起——无文件变更"], ["consult_check", "会诊读取"], ["consult_stop", "会诊终止"],
    ["subagent", "只读 spawn"],
  ])
  const DESTRUCT_RE = /replaces the WHOLE file|content not present in new_content is deleted|dest is overwritten|Refuses to delete git-tracked|nothing is written|auto-archived|replaces the entire list|auto-snapshot first|confirm:true is refused|Do NOT run destructive|action=cancel: abandon|changes files|old content stays|of the region to change/i
  // ⑤ 阻塞性：显式等待/守卫语义才要求；同步工具（返回即完成）N/A。
  const WAIT_FAMILY = new Map([
    ["question", /wait for their response/],
    ["bash", /Timeout in milliseconds|Timeout in ms/],
    ["fetch", /Timeout: 20 seconds/],
    ["execute", /Timeout in milliseconds/],
    ["timer", /When the timer fires/],
    ["consult_check", /Blocks until a reply arrives/],
    ["subagent", /BLOCKS until the target finishes/],
    ["plan", /the user approves first/],
  ])
  // ⑥ 结果形态：描述须说明返回/展示内容或失败分支（自然措辞——含锚句工具的语义承诺）。
  // 每点专用模式（名字 → 正则）覆盖通用模式；anchor 定稿句的语义承诺 = ⑥（edit）。
  const RESULT_PERPOINT = new Map([
    ["edit", /Lines shared by both are kept|is inserted after old_string/],
    ["write", /replaces the WHOLE file|atomically|Wrote/],
    ["hashline_edit", /Replacement text replaces the lines identified by the hashes/],
    ["git", /a commit's details|recent commits|unified diff|snapshots \(checkpointAction/],
    ["ls", /with type and size/],
    ["tree", /Returns the directory tree/],
    ["task", /replaces the entire list|Statuses:/],
    ["recent_changes", /Show files modified/],
    ["plan", /plan mode|exit plan mode/],
    ["goal", /mark achieved|abandon/],
    ["skill", /show available|activate one by name/],
    ["advisor", /response table/],
    ["consult_check", /When done is true|reply arrives/],
    ["consult_stop", /Already-answered replies stay available/],
    ["repo_outline", /file dependency outline|which files import\/export/],
    ["question", /answer is injected|wait for their response/],
    ["subagent", /returns only its final report|returns \{id, role, status\}/],
    ["insert_after", /Returns `Inserted after line N/],
    ["apply_patch", /Returns `Patched/],
    ["process", /Returns name \/ PID \/ memory/],
    ["lsp", /definitions|diagnostics|LSP code intelligence/],
    ["eng", /engineering mode|design-before-code/],
    ["lint", /node --check|cascade|syntax check/],
  ])
  const RESULT_RE = /Returns|return|返回|列出|显示|shows|displays|listed|reveal|refuses|失败|报错|error|fail|diagnostics|atomic|is applied|removes|wipes|deletes|get_current|the current date, time|matching document sections|Copied\|Moved\|Renamed|Spawn|Enumerates|items are auto|snapshot|列出|Numbered lines|matching lines|matching paths|as base64|visible to the model|injected|reminder will be|conversation|status|id, role|settled|confirm|响应/i

  const elements = (t) => {
    const d = t.description
    const firstSentence = d.split(/(?<=\.)\s/)[0]
    const e1 = firstSentence.length >= 8 && !/^Parameters:|^Notes:|^Returns/i.test(firstSentence)
    const entry2 = PARAM_CONSTRAINT.find(([n]) => n === t.name)
    const e2 = entry2 ? entry2[1].test(d) : "na"
    const e3 = ROUTE_NA.has(t.name) ? "na" : ROUTE_RE.test(d)
    const e4 = DESTRUCT_NA.has(t.name) ? "na" : DESTRUCT_RE.test(d)
    const e5 = WAIT_FAMILY.has(t.name) ? WAIT_FAMILY.get(t.name).test(d) : "na"
    const e6 = RESULT_PERPOINT.has(t.name) ? RESULT_PERPOINT.get(t.name).test(d) : RESULT_RE.test(d)
    return { e1, e2, e3, e4, e5, e6 }
  }

  it("六要素逐点矩阵——每点输出达标/缺项（缺项=断言失败——逐点补句）", async () => {
    const failures = []
    const lines = []
    for (const [path, names] of POINTS) {
      const m = await import(path)
      for (const n of names) {
        const t = m[n]
        const v = elements(t)
        const mark = { e1: ["①", v.e1], e2: ["②", v.e2], e3: ["③", v.e3], e4: ["④", v.e4], e5: ["⑤", v.e5], e6: ["⑥", v.e6] }
        const cell = []
        let pointFailures = 0
        for (const [k, [label, val]] of Object.entries(mark)) {
          if (val === "na") {
            const naReason = k === "e3" ? ROUTE_NA.get(t.name) : k === "e4" ? DESTRUCT_NA.get(t.name) : ""
            cell.push(`${label}N/A${naReason ? `(${naReason})` : ""}`)
          } else if (val) cell.push(`${label}✓`)
          else {
            cell.push(`${label}✗`)
            pointFailures++
            const reason = k === "e3" ? ROUTE_NA.get(t.name) : k === "e4" ? DESTRUCT_NA.get(t.name) : ""
            failures.push(`${t.name}: 缺 ${label}${reason ? `（${reason}）` : ""}`)
          }
        }
        lines.push(`${t.name.padEnd(20)} ${cell.join(" ")} — ${pointFailures ? "缺项" : "达标"}${t.name === "edit" ? "（锚句定稿——语义承诺即⑥）" : ""}`)
      }
    }
    console.log("── 六要素矩阵（44 点）──\n" + lines.join("\n"))
    assert.deepEqual(failures, [], "六要素缺项（逐点补句）:\n" + failures.join("\n"))
  })
})

// ------------------------------------------------------------------ T15.17–T15.20

describe("apply_patch 无坐标 hunk（D15.6——T15.17–T15.20）", () => {
  it("T15.17: 裸 @@ 头 + 2 上下文行 → 上下文唯一定位、应用成功", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "f.txt"), "line one\nline two\nline three\n")
    const patch = `--- a/f.txt
+++ b/f.txt
@@
 line one
-line two
+LINE TWO
 line three
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched f\.txt/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "line one\nLINE TWO\nline three\n")
  })

  it("T15.18: 裸 @@ + 纯 + 插入（无 - 锚）→ 仍报错 add more context lines（不写）", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "f.txt"), "a\nb\nc\n")
    // §15.3 迁移（AC15.15①——2026-09-04）：原夹具（1 上下文行 + -line two/+LINE TWO、0 上下文
    // -line two/+LINE TWO——均含 - 锚）按 D15.10.1 放宽为「锚序列唯一即应用」——该形态现由
    // T15.38/T15.42 覆盖。本夹具换为仍拒形态：纯 + 无 - 锚（插入位置不可判——锚自由形态需 ≥2
    // 上下文——NF15.8c）。
    const oneCtx = `--- a/f.txt
+++ b/f.txt
@@
 b
+bb
`
    const r1 = await applyPatchTool.execute({ patch: oneCtx }, ctx())
    assert.match(r1, /add more context lines|more context lines/i, "1 行上下文纯 + 无 - 锚拒绝: " + r1)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "a\nb\nc\n", "不写")
    const zeroCtx = `--- a/f.txt
+++ b/f.txt
@@
+bb
`
    const r2 = await applyPatchTool.execute({ patch: zeroCtx }, ctx())
    assert.match(r2, /add more context lines|more context lines/i, "0 行上下文纯 + 无 - 锚拒绝: " + r2)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "a\nb\nc\n", "不写")
  })

  it("T15.19: 裸 @@ 头锚多匹配 → 报错（含锚片段）——不写", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "f.txt"), "a\nb\nx\na\nb\nx\n")
    const patch = `--- a/f.txt
+++ b/f.txt
@@
 a
 b
-x
+X
`
    await assert.rejects(
      () => applyPatchTool.execute({ patch }, ctx()),
      (e) => {
        assert.match(e.message, /matches 2 locations|not unique|ambiguous/i, "多匹配报错: " + e.message)
        assert.match(e.message, /add more context lines/, "错误含去歧义引导")
        assert.match(e.message, /anchor: "a\nb\nx"/, "错误含锚片段（D15.6.1）")
        return true
      },
    )
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "a\nb\nx\na\nb\nx\n", "不写")
  })

  it("T15.20: 两个无坐标 hunk 串行——第二个基于第一个应用后的内容定位", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "f.txt"), "A\nB\nC\nD\n")
    const patch = `--- a/f.txt
+++ b/f.txt
@@
 A
-B
+BB
 C
@@
 BB
-C
+CC
 D
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched f\.txt/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "A\nBB\nCC\nD\n")
  })
})

// ------------------------------------------------------------------ §15.3 T15.38–T15.44

describe("apply_patch 零上下文 - 锚放宽（§15.3 D15.10.1/NF15.8c——T15.38–T15.44）", () => {
  it("T15.38: 零上下文裸 @@ 头 + 唯一 - 锚 → 替换应用（行数不变）", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "f.txt"), "one\ntwo\nthree\n")
    const patch = `--- a/f.txt
+++ b/f.txt
@@
-two
+TWO
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched f\.txt/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "one\nTWO\nthree\n", "- 行全文唯一——替换——行数不变")
  })

  it("T15.39: 零上下文多行 - 锚（唯一连续序列）→ 块替换", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "f.txt"), "a\nb\nc\nd\n")
    const patch = `--- a/f.txt
+++ b/f.txt
@@
-b
-c
+BC
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched f\.txt/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "a\nBC\nd\n", "b、c 消失——新块在位（多行 - 锚支持）")
  })

  it("T15.40: ① - 锚序列多匹配 → 报错 ② 纯 + 零上下文 → 仍拒（均不写）", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "f.txt"), "x\nb\ny\nb\nz\n")
    const ambiguous = `--- a/f.txt
+++ b/f.txt
@@
-b
+B
`
    await assert.rejects(
      () => applyPatchTool.execute({ patch: ambiguous }, ctx()),
      (e) => {
        assert.match(e.message, /matches 2 locations/, "零上下文 - 锚两处匹配——报错引导调整锚（不静默选一）: " + e.message)
        assert.match(e.message, /add more context lines/, "错误含去歧义引导")
        return true
      },
    )
    const purePlus = `--- a/f.txt
+++ b/f.txt
@@
+nope
`
    const r = await applyPatchTool.execute({ patch: purePlus }, ctx())
    assert.match(r, /add more context lines|more context lines/i, "纯 + 零上下文无锚——位置不明——仍拒（报错加锚）: " + r)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "x\nb\ny\nb\nz\n", "不写")
  })

  it("T15.41: 带上下文 hunk（≥2——T15.17/T15.20 形态）回归——既有路径零改动", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    // 内容带同前缀歧义（alpha/beta 重复）——≥2 上下文序列（alpha,beta,gamma）唯一定位——
    // 证明带上下文路径仍按既有上下文匹配工作（T15.17/T15.19/T15.20 同形态断言继续全绿）
    writeFileSync(join(cwd, "f.txt"), "alpha\nbeta\ngamma\nalpha\nbeta\nzeta\n")
    const patch = `--- a/f.txt
+++ b/f.txt
@@
 alpha
 beta
-gamma
+GAMMA
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched f\.txt/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "alpha\nbeta\nGAMMA\nalpha\nbeta\nzeta\n", "≥2 上下文既有路径零改动")
  })

  it("T15.42: 恰 1 上下文行 + - 行 → 锚序列唯一即应用（评审 #4a——非单调消除）", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "f.txt"), "a\nb\nc\n")
    const patch = `--- a/f.txt
+++ b/f.txt
@@
 a
-b
+B
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched f\.txt/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "a\nB\nc\n", "上下文行保留、旧行→新行——不再被 ≥2 规则拒")
  })

  it("T15.43: - 锚序列零匹配 → not-found（不写——报错）", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "f.txt"), "a\nb\nc\n")
    const patch = `--- a/f.txt
+++ b/f.txt
@@
-zzz
+Z
`
    await assert.rejects(
      () => applyPatchTool.execute({ patch }, ctx()),
      (e) => {
        assert.match(e.message, /does not apply/, "锚序列全文不存在——既有 not-found 语义: " + e.message)
        return true
      },
    )
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "a\nb\nc\n", "不写")
  })

  it("T15.44: 两个零上下文 - 锚 hunk 串行——后 hunk 锚 = 前 hunk 应用后新内容", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "f.txt"), "a\nb\nc\n")
    const patch = `--- a/f.txt
+++ b/f.txt
@@
-b
+B
@@
-B
+C
`
    // 第二个 hunk 的锚（B）只有第一个 hunk 应用后才存在——串行逐 hunk 定位（T15.20 同款语义——零上下文形态）
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched f\.txt/)
    assert.equal(readFileSync(join(cwd, "f.txt"), "utf8"), "a\nC\nc\n", "两 hunk 依次生效")
  })

  // ─── §15.3a 文件头 +++ 容缺（TOOLS.md §15.3a——P15.10——2026-09-05 用户裁定「符合模型直觉」——CLI parity）───

  it("P15.10a: 容缺头——`--- a/` 后直接跟 hunk → 同路径应用（单文件自然形态）", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "a.txt"), "one\ntwo\n", "utf8")
    const patch = `--- a/a.txt
@@
-one
+ONE
 two
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched a\.txt/, r)
    assert.equal(readFileSync(join(cwd, "a.txt"), "utf8"), "ONE\ntwo\n", "同路径应用")
  })

  it("P15.10b: 多文件混合——完整头（+++ 配对）+ 容缺头同补丁", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "a.txt"), "one\n", "utf8")
    writeFileSync(join(cwd, "b.txt"), "two\n", "utf8")
    const patch = `--- a/a.txt
+++ b/a.txt
@@
-one
+ONE
--- b/b.txt
@@
-two
+TWO
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched a\.txt/, r)
    assert.match(r, /Patched b\.txt/, r)
    assert.equal(readFileSync(join(cwd, "a.txt"), "utf8"), "ONE\n", "完整头文件已改")
    assert.equal(readFileSync(join(cwd, "b.txt"), "utf8"), "TWO\n", "容缺头文件已改")
  })

  it("P15.10c: `--- /dev/null` 缺 +++ → 特报（新文件名不可推导——信息真缺失仍拒）", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    const r = await applyPatchTool.execute({ patch: "--- /dev/null\n@@\n+hello\n" }, ctx())
    assert.match(r, /Error: "--- \/dev\/null" needs a "\+\+\+ b\/<path>" line naming the new file/, r)
    assert.ok(!existsSync(join(cwd, "hello")), "未创建任何文件")
  })

  it("P15.10d: 删行内容 `-- x`（patch 文本 `--- x`）不误断为文件头——裸 @@ 内正常消费（边界锁）", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "b.txt"), "A\n-- tgt\nC\n", "utf8")
    const patch = `--- b/b.txt
@@
 A
--- tgt
 C
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched b\.txt/, r)
    assert.equal(readFileSync(join(cwd, "b.txt"), "utf8"), "A\nC\n", "-- tgt 行被删除（而非被当文件头）")
  })

  it("P15.10e: 空段头（头后无 hunk）过滤——不虚报、不触发无谓读；纯空段 → No file changes", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "a.txt"), "one\n", "utf8")
    const patch = `--- a/a.txt
+++ b/a.txt
@@
-one
+ONE
--- b/b.txt
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched a\.txt/, r)
    assert.equal(readFileSync(join(cwd, "a.txt"), "utf8"), "ONE\n", "真实 hunk 已应用")
    assert.ok(!existsSync(join(cwd, "b.txt")), "空段文件未创建（不被无谓读取）")
    const r2 = await applyPatchTool.execute({ patch: "--- a/ghost.txt\n" }, ctx())
    assert.match(r2, /Error: No file changes found/, r2)
  })
})
