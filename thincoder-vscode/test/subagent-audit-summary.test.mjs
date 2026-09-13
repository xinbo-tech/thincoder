/**
 * subagent-audit-summary.test.mjs — A2-SUMMARY-PARITY (docs/design/A2-SUMMARY-PARITY.md,
 * 2026-09-09): VSC summarizeEngTaskInput is verbatim-isomorphic with the CLI's
 * summarizeEngTaskBook (thincoder-cli/src/agent-tools/subagent-spawn.mjs) — the A2 mechanical
 * summary keeps only the three audit-relevant sections VERBATIM (design docs involved /
 * affected-file list / acceptance criteria), dropping verbose context. Locks the
 * alignment surface via the auditTaskBook seam (summarizeEngTaskInput is module-private —
 * driven through agent._engTaskInput fixtures):
 *  - structured "## " task books → the marker sections verbatim, verbose sections dropped;
 *  - flat task books without "## " headers → the summary still triggers via the
 *    inline-marker fallback (CLI shape: a section runs from its marker line to the next
 *    header — with no headers present it runs to the book end, so sections overlap);
 *  - markers missing → "(not found in the parent task book)" (never fabricated);
 *  - "## " present but only one keepable section → that section is emitted — the deleted
 *    <2-sections whole-book verbatim guard must NOT come back.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { auditTaskBook } from "../src/agent-tools/subagent-async.mjs"

const A2_ANCHOR = "Parent spawn task book — mechanical summary (docs involved / file list / acceptance criteria, verbatim):\n"
const A2_END = "\nFiles actually touched by the eng-coder"

/** Run auditTaskBook over an _engTaskInput fixture and return the embedded A2 summary. */
function summaryOf(book) {
  const out = auditTaskBook("audit a delivery", { _engTaskInput: book, _touchedFiles: [] }, 1)
  const start = out.indexOf(A2_ANCHOR)
  assert.notEqual(start, -1, "A2 summary block must be appended for an audit spawn")
  const end = out.indexOf(A2_END, start)
  return out.slice(start + A2_ANCHOR.length, end)
}

test("A2 structured book: marker sections verbatim, verbose sections dropped", () => {
  const summary = summaryOf(`## 涉及文档
docs/design/A2-SUMMARY-PARITY.md

## 文件清单
- src/agent-tools/subagent-async.mjs
- test/subagent-audit-summary.test.mjs

## 验收标准
- AC-1 绿

## 变更记录
2026-09-09 落档（长背景——不应被带出）
一些其他说明`)
  assert.equal(summary, `## 涉及文档
docs/design/A2-SUMMARY-PARITY.md

## 文件清单
- src/agent-tools/subagent-async.mjs
- test/subagent-audit-summary.test.mjs

## 验收标准
- AC-1 绿`)
  assert.ok(!summary.includes("变更记录"), "verbose trailing section must be dropped")
})

test("A2 flat book (no ## headers): summary triggers via the inline-marker fallback", () => {
  const book = `涉及文档: docs/design/A2-SUMMARY-PARITY.md
文件清单: src/agent-tools/subagent-async.mjs
验收标准: AC-1 绿（测试锁）`
  const summary = summaryOf(book)
  // CLI inline semantics: each section runs from its marker line to the next header —
  // none exist in a flat book, so each section runs to the book end (docs ⊇ files ⊇
  // acceptance). Old VSC behavior returned the whole book once — the overlap proves the
  // CLI-parity summary triggered.
  assert.notEqual(summary, book, "flat book must NOT come back whole-book verbatim")
  assert.equal(summary, `涉及文档: docs/design/A2-SUMMARY-PARITY.md
文件清单: src/agent-tools/subagent-async.mjs
验收标准: AC-1 绿（测试锁）

文件清单: src/agent-tools/subagent-async.mjs
验收标准: AC-1 绿（测试锁）

验收标准: AC-1 绿（测试锁）`)
})

test("A2 ## present but only one keepable section: emitted, missing markers (not found)", () => {
  const summary = summaryOf(`## 文件清单
- src/agent-tools/subagent-async.mjs

## 背景
长背景内容——不属于三个审计节——若整书回退仍存在这里会被带出`)
  assert.equal(summary, `Design docs involved: (not found in the parent task book)

## 文件清单
- src/agent-tools/subagent-async.mjs

Acceptance criteria: (not found in the parent task book)`)
  assert.ok(!summary.includes("## 背景"), "no whole-book verbatim fallback for <2 keepable sections")
})

test("A2 book with no marker at all: three (not found) rows, never fabricated, no verbatim", () => {
  const book = `## 背景
一段没有任何审计 marker 的整书内容——旧守卫会整书 verbatim 带回`
  const summary = summaryOf(book)
  assert.equal(summary, `Design docs involved: (not found in the parent task book)

Affected-file list: (not found in the parent task book)

Acceptance criteria: (not found in the parent task book)`)
  assert.ok(!summary.includes("旧守卫会整书 verbatim 带回"), "marker-less book must not be echoed back")
})
