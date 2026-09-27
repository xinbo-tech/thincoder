/**
 * tool-summary.test.mjs — 核纯函数层：一行式工具摘要（`formatToolSummary` 分派 + 各分支字面）。
 *
 * 来源 = `thincoder-vscode/webview/tool-summary.js` 逐字搬迁（R1）；设计权威 =
 * `docs/render-core/design/RENDER-CORE.md` §3 行 50（核）/ §5（导出面）。
 * 分派字面逐字承 CLI `thincoder-cli/src/tui/tool-summaries.mjs`——**跨端等值对拍留在消费端套房**
 * （VSC `test/tool-summary-parity.test.mjs` 直驱对端）；本档 = 核内契约钉死
 * （约束：核测试只依赖 `node:` 与核内模块）。端差②（成功面不拼 `(exit code 0)`）与 F-W16
 * `(empty)` 处置为**已裁决端差**，本档按现行为显式断言（不静默跳过）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { formatToolSummary } from "../tool-summary.mjs"

const ROWS = (rows) => ["### 评审", "| # | Category | Severity | Issue |", "|---|----------|----------|-------|", ...rows].join("\n")

test("advisor：满载计数 / 零 critical ⇒ passed / 拒因首句 / 无计数 ⇒ falsy", () => {
  assert.equal(formatToolSummary("advisor", ROWS(["| 1 | Scope | 🔴 | 越禁 |", "| 2 | Clarity | 🟡 | 措辞 |", "| 3 | Style | 🔵 | 用词 |"])), "advisor: 1 critical, 1 advisory, 1 style")
  assert.equal(formatToolSummary("advisor", ROWS(["| 1 | Clarity | 🔵 | 用词 |"])), "advisor: passed")
  assert.equal(formatToolSummary("advisor", "Advisor: design review launch refused. Ask the user."), "advisor: design review launch refused")
  assert.equal(formatToolSummary("advisor", "No issues found"), "advisor: passed", "措辞兜底")
  assert.equal(formatToolSummary("advisor", "no table here at all"), null)
})

test("read / write：计数与首行兜底", () => {
  assert.equal(formatToolSummary("read", "Read 120 lines"), "120 lines")
  assert.equal(formatToolSummary("read", "a\nb\nc"), "3 lines")
  assert.equal(formatToolSummary("read", ""), "1 lines", "行数缺失回退（现状：split 段数）")
  assert.equal(formatToolSummary("read_file", "Read 7 lines"), "7 lines")
  assert.equal(formatToolSummary("write", "wrote 2048 bytes to x.mjs"), "wrote 2048 bytes")
  assert.equal(formatToolSummary("write", "created file x.mjs"), "wrote file")
  assert.equal(formatToolSummary("write", "Edited x.mjs:1"), "Edited x.mjs:1")
  assert.equal(formatToolSummary("write_file", ""), "wrote")
})

test("grep / glob：计数三态（含空结果界）", () => {
  assert.equal(formatToolSummary("grep", "a\nb\nc"), "3 matches")
  assert.equal(formatToolSummary("grep", "only"), "1 match")
  assert.equal(formatToolSummary("grep", ""), "no matches")
  assert.equal(formatToolSummary("search", "\n\n"), "no matches")
  assert.equal(formatToolSummary("glob", "a.mjs\nb.mjs"), "2 files")
  assert.equal(formatToolSummary("glob", "a.mjs"), "1 file")
  assert.equal(formatToolSummary("glob", ""), "no files")
})

test("bash：末行提取 + 状态位附加（失败面）", () => {
  assert.equal(formatToolSummary("bash", "[stdout]:\nboom\n\n(exit code 2)"), "bash: boom (exit code 2)")
  assert.equal(formatToolSummary("bash", "[stdout]:\nline1\nline2\n\n(exit code 1)"), "bash: line2 (exit code 1)")
  assert.equal(formatToolSummary("bash", "Command failed: spawn C:\\Windows\\system32\\cmd.exe ENOENT\n[stdout]:\n(empty)\n\n(spawn failed)"), "bash: (spawn failed)")
  assert.equal(formatToolSummary("bash", "[stdout]:\n" + "x".repeat(140) + "\n\n(exit code 1)"), `bash: ${"x".repeat(100)} (exit code 1)`, "末行截 100 字符")
})

test("bash：端差②（成功面不拼 exit 0）/ F-W16（(empty) 不入内容位）/ 空结果界", () => {
  assert.equal(formatToolSummary("bash", "[stdout]:\nok\n\n(exit code 0)"), "bash: ok")
  assert.equal(formatToolSummary("bash", "[stdout]:\n(empty)\n\n(exit code 1)"), "bash: (exit code 1)")
  assert.equal(formatToolSummary("bash", ""), null)
  assert.equal(formatToolSummary("bash", null), null)
})

test("默认分支（未登记工具）：`name: <首个非空行>`，无内容 ⇒ falsy", () => {
  assert.equal(formatToolSummary("mcp__foo", "first line\nsecond"), "mcp__foo: first line")
  assert.equal(formatToolSummary("verify", "Changed files: x.mjs\n  ✗ a.mjs:3 — syntax\n✓ Tests passed."), "verify: Changed files: x.mjs", "verify 未登记 ⇒ 默认分支")
  assert.equal(formatToolSummary("mcp__foo", "  \nreal first\n"), "mcp__foo: real first")
  assert.equal(formatToolSummary("mcp__foo", ""), null)
})
