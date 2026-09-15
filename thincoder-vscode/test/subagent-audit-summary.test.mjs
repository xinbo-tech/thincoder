/**
 * subagent-audit-summary.test.mjs — A2-SUMMARY-PARITY (docs/design/A2-SUMMARY-PARITY.md,
 * 2026-09-09): the A2 mechanical summary keeps only the three audit-relevant sections
 * VERBATIM (design docs involved / affected-file list / acceptance criteria), dropping
 * verbose context.
 *
 * W13（2026-09-15）：摘要实现 = 核单源（`@thincoder/core/agent-tools/subagent-spawn.mjs`
 * `summarizeEngTaskBook`——原端侧 `summarizeEngTaskInput` / `auditTaskBook` 镜像删旧）。
 * 对齐面由「双实现同构」事实收为「单实现」（比较对象不复存在）；本档改以**核真装配面**
 * `buildSpawnChild`（审计 spawn 任务书注入点——depth-1 eng-coder 父 + role='explore' 同步 +
 * 审计尝试序号非 null）驱动同一批断言：
 *  - structured "## " task books → the marker sections verbatim, verbose sections dropped;
 *  - flat task books without "## " headers → the summary still triggers via the
 *    inline-marker fallback (a section runs from its marker line to the next header —
 *    with no headers present it runs to the book end, so sections overlap);
 *  - markers missing → "(not found in the parent task book)" (never fabricated);
 *  - "## " present but only one keepable section → that section is emitted — no
 *    whole-book verbatim fallback.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { gateEngCoderSpawn } from "@thincoder/core/agent/spawn-child.mjs"

/** A2 摘要块前导锚（核逐字文本——`[^\\n]*` 容措辞微调，块的起点/终点形态不变）。 */
const A2_MARK_RE = /\[Parent spawn task book — mechanical summary[^\n]*\]\n/
const A2_END = "\nFiles actually touched by the eng-coder"

/** Run the real audit-spawn assembly over an _engTaskInput fixture and return the embedded A2 summary. */
function summaryOf(book) {
  const parent = {
    cwd: "/proj", _role: "eng-coder", _engTaskInput: book, _touchedFiles: [],
    tools: [], provider: { name: "p", baseURL: "https://x", model: "m", apiKey: "k" },
    config: { agent: {} },
  }
  const ctx = { agent: parent, depth: 1, callbacks: {}, cwd: "/proj" }
  const attempt = gateEngCoderSpawn(parent, 1, "explore", false) // 审计尝试序号（非 null ⇒ 任务书摘要注入开关）
  assert.equal(attempt, 1, "eng-coder 父审计 spawn 通过机械门")
  const { input } = buildSpawnChild(parent, ctx, { task: "audit a delivery" }, "explore", false, [], [], attempt)
  const m = A2_MARK_RE.exec(input)
  assert.ok(m, "A2 summary block must be appended for an audit spawn")
  const start = m.index + m[0].length
  const end = input.indexOf(A2_END, start)
  assert.notEqual(end, -1, "A2 块以 touched-files 段收尾")
  return input.slice(start, end)
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
  // inline semantics: each section runs from its marker line to the next header —
  // none exist in a flat book, so each section runs to the book end (docs ⊇ files ⊇
  // acceptance). The overlap proves the inline fallback triggered.
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
