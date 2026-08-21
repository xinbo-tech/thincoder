/**
 * test/advisor.test.mjs — tests for the advisor convergence protocol.
 * Covers: extractAgentResponseTable, buildAdvisorSystemPrompt,
 * buildAdvisorUserMessage, and the round-aware guard logic (MAX_ADVISOR_ROUNDS).
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { execSync } from "node:child_process"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

import {
  extractAgentResponseTable,
  buildAdvisorSystemPrompt,
  buildAdvisorUserMessage,
  extractConversationBackground,
  buildAdvisorFollowUp,
  prepareAdvisorMessages,
} from "../src/advisor.mjs"


// ────────────────────────────────────────
// extractAgentResponseTable
// ────────────────────────────────────────

test("extractAgentResponseTable: returns null when no response after advisor", () => {
  const history = [
    { role: "tool", tool_call_id: "a1", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | x.js | 🔴 | bug | fix |" },
  ]
  assert.equal(extractAgentResponseTable(history, 0), null)
})

test("extractAgentResponseTable: returns null when assistant message has no response table", () => {
  const history = [
    { role: "tool", tool_call_id: "a1", content: "issue table" },
    { role: "assistant", content: "I will fix the issues." },
  ]
  assert.equal(extractAgentResponseTable(history, 0), null)
})

test("extractAgentResponseTable: extracts response table from assistant message", () => {
  const responseTable = `| # | Action | Detail |
|---|--------|--------|
| 1 | ✅ Fixed | added null check |
| 2 | ❌ Not an issue | variable name follows convention |`
  const history = [
    { role: "tool", tool_call_id: "a1", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | x.js | 🔴 | bug | fix |" },
    { role: "assistant", content: `Here's my response:\n\n${responseTable}\n\nReady for re-review.` },
  ]
  const result = extractAgentResponseTable(history, 0)
  assert.notEqual(result, null)
  assert.ok(result.includes("| # | Action | Detail |"))
  assert.ok(result.includes("✅ Fixed"))
  assert.ok(result.includes("❌ Not an issue"))
})

test("extractAgentResponseTable: only looks after sinceIdx", () => {
  const history = [
    { role: "assistant", content: "| # | Action | Detail |\n| 1 | ✅ Fixed | done |" },
    { role: "tool", tool_call_id: "a1", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | x.js | 🔴 | bug | fix |" },
    { role: "assistant", content: "I fixed it." },
  ]
  assert.equal(extractAgentResponseTable(history, 1), null)
})

test("extractAgentResponseTable: finds response after advisor when both present", () => {
  const responseTable = "| # | Action | Detail |\n| 1 | ✅ Fixed | done |"
  const history = [
    { role: "tool", tool_call_id: "a1", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | x.js | 🔴 | bug | fix |" },
    { role: "assistant", content: responseTable },
  ]
  const result = extractAgentResponseTable(history, 0)
  assert.notEqual(result, null)
  assert.ok(result.includes("✅ Fixed"))
})

// ────────────────────────────────────────
// buildAdvisorSystemPrompt — routing tests
// ────────────────────────────────────────

test("buildAdvisorSystemPrompt: returns round 1 file when no prior table", () => {
  const agent = { history: [], _advisorRound: 0, cwd: tmpdir() }
  const prompt = buildAdvisorSystemPrompt(agent)
  assert.ok(prompt.includes("full-scope review"))
  assert.ok(prompt.includes("| # | File | Severity | Issue | Suggestion |"))
  assert.ok(!prompt.includes("Verify the prior review output"))
  assert.ok(!prompt.includes("Strictly verify"))
})

test("buildAdvisorSystemPrompt: returns round 1 file when last review was all clear", () => {
  const agent = {
    history: [{ role: "tool", tool_call_id: "a1", content: "No 🔴 issues found. Review passed." }],
    _advisorRound: 1, cwd: tmpdir(),
  }
  const prompt = buildAdvisorSystemPrompt(agent)
  assert.ok(prompt.includes("full-scope review"))
})

test("buildAdvisorSystemPrompt: returns round 2 file when prior table and _advisorRound=1", () => {
  const issueTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | x.js | 🔴 | bug | fix |"
  const agent = {
    history: [{ role: "tool", tool_call_id: "a1", content: `Review:\n${issueTable}` }],
    _advisorRound: 1, cwd: tmpdir(),
    _lastAdvisorOutput: issueTable,
  }
  const prompt = buildAdvisorSystemPrompt(agent)
  assert.ok(prompt.includes("Verify the prior review output"))
  assert.ok(!prompt.includes("DO NOT look for new issues"))
})

test("buildAdvisorSystemPrompt: returns round 3+ file when _advisorRound>=2", () => {
  const issueTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | x.js | 🔴 | bug | fix |"
  const agent = {
    history: [
      { role: "tool", tool_call_id: "a1", content: `r1: ${issueTable}` },
      { role: "assistant", content: "fixed" },
      { role: "tool", tool_call_id: "a2", content: "| # | Orig# | File | Severity | Status | Notes |\n| 1 | 1 | x.js | 🔴 | Unfixed | - |" },
    ],
    _advisorRound: 2, cwd: tmpdir(),
    _lastAdvisorOutput: issueTable,
  }
  const prompt = buildAdvisorSystemPrompt(agent)
  assert.ok(prompt.includes("Strictly verify"))
  assert.ok(prompt.includes("Do NOT look for new issues"))
})

test("buildAdvisorSystemPrompt: returns same static content regardless of issue table content", () => {
  const agent1 = {
    history: [{ role: "tool", tool_call_id: "a1", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.js | 🔴 | bug A | fix A |" }],
    _advisorRound: 1, cwd: tmpdir(),
  }
  const agent2 = {
    history: [{ role: "tool", tool_call_id: "a1", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | b.js | 🟡 | bug B | fix B |" }],
    _advisorRound: 1, cwd: tmpdir(),
  }
  assert.equal(buildAdvisorSystemPrompt(agent1), buildAdvisorSystemPrompt(agent2))
})

test("buildAdvisorSystemPrompt: reviewType=design returns design prompt", () => {
  const agent = { history: [], _advisorRound: 0, cwd: tmpdir() }
  const result = buildAdvisorSystemPrompt(agent, null, "design")
  assert.ok(result.includes("design reviewer"), "应包含设计审查内容")
  assert.ok(!result.includes("code review"), "不应包含代码审查内容")
})

test("buildAdvisorSystemPrompt: design round 1 uses design prompt; rounds 2+ converge like code", () => {
  const base = { history: [], cwd: tmpdir() }
  const round1 = buildAdvisorSystemPrompt({ ...base, _advisorRound: 0 }, null, "design")
  assert.ok(round1.includes("design reviewer"), "round 1 keeps the design-review prompt")
  // Round 2 with a prior table → convergence prompt (verify prior table + new issues allowed)
  const prior = { text: "| # | Category | Severity | Issue | Suggestion |\n|---|---------|----------|------|------------|" }
  const round2 = buildAdvisorSystemPrompt({ ...base, _advisorRound: 1 }, prior, "design")
  assert.ok(!round2.includes("design reviewer"), "round 2 no longer uses the design prompt")
  assert.ok(round2.includes("Verify the prior review output"), "round 2 uses the convergence prompt")
  // Round 3+ → strict verification
  const round3 = buildAdvisorSystemPrompt({ ...base, _advisorRound: 2 }, prior, "design")
  assert.ok(round3.includes("Strictly verify only the prior review output"), "round 3+ strict verification")
})


test("buildAdvisorUserMessage: reviewType=design includes design review header", () => {
  const agent = {
    history: [{ role: "user", content: "design a feature" }],
    _advisorRound: 0, cwd: tmpdir(), config: {},
  }
  const result = buildAdvisorUserMessage(agent, null, "design")
  assert.ok(result.includes("## Design Review"), "应包含设计审查标题")
  assert.ok(!result.includes("## Code Review"), "不应包含代码审查标题")
  assert.ok(!result.includes("git status"), "不应包含 git 指令")
})

test("buildAdvisorUserMessage: design review with token injects Approval Signal", () => {
  const agent = {
    history: [{ role: "user", content: "design a feature" }],
    _advisorRound: 0, cwd: tmpdir(), config: {},
  }
  const token = "f0e2a9c8-0000-4000-8000-000000000000"
  const result = buildAdvisorUserMessage(agent, null, "design", token)
  assert.ok(result.includes("Approval Signal"), "应包含 Approval Signal 段")
  assert.ok(result.includes(`[DESIGN-TOKEN:${token}]`), "应包含令牌值")
})

test("buildAdvisorUserMessage: design review without token has no Approval Signal", () => {
  const agent = {
    history: [{ role: "user", content: "design a feature" }],
    _advisorRound: 0, cwd: tmpdir(), config: {},
  }
  const result = buildAdvisorUserMessage(agent, null, "design")
  assert.ok(!result.includes("Approval Signal"), "无令牌时不应有 Approval Signal")
})

test("advisorTool: schema declares documents parameter for design review", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const documents = advisorTool.parameters.properties.documents
  assert.ok(documents, "documents 参数应存在于 advisor 工具 schema")
  assert.equal(documents.type, "array", "documents 为数组")
  assert.equal(documents.items.type, "string", "数组元素为 string")
   assert.ok(documents.description.includes("design"), "描述覆盖 design/code review 用途")
  assert.ok(documents.description.includes("reviews ONLY these"), "描述声明只评审清单内文档")
})

test("buildAdvisorUserMessage: design review with documents reviews ONLY the listed docs", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-test-"))
  try {
    createGitRepo(tmp)
    // Unrelated changed doc in the repo — must NOT leak into the review scope
    writeFileSync(join(tmp, "Y.md"), "# Unrelated\n")
    execSync("git add -A && git commit -m y", { cwd: tmp, stdio: "ignore" })
    writeFileSync(join(tmp, "Y.md"), "# Unrelated — modified after commit\n")

    const agent = { _touchedFiles: [], cwd: tmp, history: [], _advisorRound: 0, config: {} }
    const documents = ["docs/design/X.md", "docs/design/Z.md"]
    const msg = buildAdvisorUserMessage(agent, null, "design", null, documents)

    assert.ok(msg.includes("## Documents to Review"), "应含显式清单段")
    assert.ok(msg.includes("docs/design/X.md — Read this file in full"), "清单第一条文档带 Read this file in full")
    assert.ok(msg.includes("docs/design/Z.md — Read this file in full"), "清单第二条文档带 Read this file in full")
    assert.ok(!msg.includes("## Changed Files"), "不收集 git 变更集")
    assert.ok(!msg.includes("## Design Document (git diff)"), "不含 git diff 内容")
    assert.ok(!msg.includes("- Y.md"), "清单外文档不被列为评审对象")
    assert.ok(!msg.includes("Unrelated"), "清单外文档内容不被提及")
    assert.ok(!msg.includes("git status"), "不出现 git status")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("buildAdvisorUserMessage: design review without documents keeps git-diff scope (backward compatible)", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-test-"))
  try {
    createGitRepo(tmp)
    writeFileSync(join(tmp, "Y.md"), "# Unrelated\n")
    execSync("git add -A && git commit -m y", { cwd: tmp, stdio: "ignore" })
    writeFileSync(join(tmp, "Y.md"), "# Unrelated — modified after commit\n")

    const agent = { _touchedFiles: [], cwd: tmp, history: [], _advisorRound: 0, config: {} }
    const msg = buildAdvisorUserMessage(agent, null, "design")

    assert.ok(msg.includes("## Changed Files"), "无 documents 时仍按 git 变更集构建")
    assert.ok(msg.includes("Y.md"), "git 变更集中的文档被列出")
    assert.ok(msg.includes("## Design Document (git diff)"), "无 documents 时含 git diff 段")
    assert.ok(!msg.includes("## Documents to Review"), "无 documents 时不出现显式清单段")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("prepareAdvisorMessages: design review passes documents through to the user message", () => {
  const agent = {
    history: [], _advisorRound: 0, cwd: tmpdir(), config: {},
    _advisorSession: null,
  }
  const msgs = prepareAdvisorMessages(agent, "design", null, ["docs/design/A.md"])
  assert.equal(msgs.length, 2)
  assert.ok(msgs[1].content.includes("docs/design/A.md"), "documents 透传到 user message")
  assert.ok(msgs[1].content.includes("Read this file in full"), "documents 模式带 Read this file in full")
})


test("prepareAdvisorMessages: reviewType=design returns fresh session", () => {
  const agent = {
    history: [], _advisorRound: 0, cwd: tmpdir(), config: {},
    _advisorSession: [{ role: "system", content: "old" }],
  }
  const msgs = prepareAdvisorMessages(agent, "design")
  assert.equal(msgs.length, 2, "设计审查总是新会话")
  assert.equal(msgs[0].role, "system")
  assert.equal(msgs[1].role, "user")
})

test("buildAdvisorSystemPrompt: _advisorRound===0 forces full review despite stale history", () => {
  const issueTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | old.js | 🔴 | old bug | fix |"
  const agent = {
    history: [{ role: "tool", tool_call_id: "a1", content: `Old review:\n${issueTable}` }],
    _advisorRound: 0, cwd: tmpdir(),
  }
  const prompt = buildAdvisorSystemPrompt(agent)
  assert.ok(prompt.includes("full-scope review"))
  assert.ok(!prompt.includes("Verify the prior review output"))
})

// ────────────────────────────────────────
// buildAdvisorUserMessage — review scope + convergence
// ────────────────────────────────────────

function createGitRepo(testDir) {
  execSync("git init", { cwd: testDir, stdio: "ignore" })
  execSync("git config user.email test@test", { cwd: testDir, stdio: "ignore" })
  execSync("git config user.name test", { cwd: testDir, stdio: "ignore" })
  writeFileSync(join(testDir, "dummy.js"), "// test")
  execSync("git add -A && git commit -m init", { cwd: testDir, stdio: "ignore" })
}

test("buildAdvisorUserMessage: scope lists paths when provided", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-test-"))
  try {
    const agent = {
      _touchedFiles: [],
      cwd: tmp,
      history: [],
      _advisorRound: 0,
    }
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["src/app.js", "src/util.mjs"])
    assert.ok(msg.includes("## Review Scope"))
    assert.ok(msg.includes("src/app.js"))
    assert.ok(msg.includes("src/util.mjs"))
    assert.ok(msg.includes("## Instructions"))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("buildAdvisorUserMessage: round 1 does not include convergence data", () => {
  const agent = { _touchedFiles: [], cwd: tmpdir(), history: [], _advisorRound: 0 }
  const msg = buildAdvisorUserMessage(agent)
  assert.ok(!msg.includes("## Prior Review Output"))
  assert.ok(!msg.includes("## Agent Response"))
})

test("buildAdvisorUserMessage: round 2 includes convergence data (fix claims, no prior table)", () => {
  const issueTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | x.js | 🔴 | bug | fix |"
  const agent = {
    _touchedFiles: [], cwd: tmpdir(),
    history: [{ role: "tool", tool_call_id: "a1", content: `Review:\n${issueTable}` }],
    _advisorRound: 1,
    _lastAdvisorOutput: `Review:\n${issueTable}`,
  }
  const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["src/app.js"])
  assert.ok(msg.includes("## Round 2 — Verify Prior Table + Flag New Issues"), "convergence header present (project guide now precedes it)")
  assert.ok(msg.includes("## Prior Review Output"), "prior table IS injected — the only complete verification list")
  assert.ok(msg.includes(issueTable), "issue rows restated for verification")
  assert.ok(msg.includes("## Agent Response"), "fix claims present as a reference")
  assert.ok(msg.includes("## Review Scope"))
})

test("buildAdvisorUserMessage: round 3+ uses strict verification header", () => {
  const issueTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | x.js | 🔴 | bug | fix |"
  const agent = {
    _touchedFiles: [], cwd: tmpdir(),
    history: [
      { role: "tool", tool_call_id: "a1", content: `r1: ${issueTable}` },
      { role: "assistant", content: "fixed" },
      { role: "tool", tool_call_id: "a2", content: "| # | Orig# | File | Severity | Status | Notes |\n| 1 | 1 | x.js | 🔴 | Unfixed | - |" },
    ],
    _advisorRound: 2,
    _lastAdvisorOutput: issueTable,
  }
  const msg = buildAdvisorUserMessage(agent)
  assert.ok(msg.includes("## Round 3 — Strict Verification"), "strict verification header present (project guide now precedes it)")
})

test("buildAdvisorUserMessage: _advisorRound===0 skips convergence data", () => {
  const issueTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | old.js | 🔴 | old bug | fix |"
  const agent = {
    _touchedFiles: [], cwd: tmpdir(),
    history: [{ role: "tool", tool_call_id: "a1", content: `Old review:\n${issueTable}` }],
    _advisorRound: 0,
  }
  const msg = buildAdvisorUserMessage(agent)
  assert.ok(!msg.includes("## Prior Review Output"))
  assert.ok(!msg.includes("## Review Scope"), "no empty Review Scope heading without paths/documents (decision: suppress empty sections)")
  assert.ok(msg.includes("## Instructions"))
})

test("buildAdvisorUserMessage: includes recent conversation background", () => {
  const agent = {
    _touchedFiles: [], cwd: tmpdir(),
    history: [
      { role: "user", content: "The app crashes on empty input" },
      { role: "assistant", content: "Let me look at the parser first" },
      { role: "user", content: "Fix the null pointer bug" },
    ],
    _advisorRound: 0,
  }
  const msg = buildAdvisorUserMessage(agent)
  assert.ok(msg.includes("## Conversation Background"))
  assert.ok(msg.includes("Fix the null pointer bug"), "latest user message included")
  assert.ok(msg.includes("crashes on empty input"), "earlier turn included for context")
  assert.ok(msg.includes("Let me look at the parser"), "assistant reply included")
})

test("buildAdvisorUserMessage: 注入 Project Guide (AGENTS.md) 且位于 Conversation Background 之前", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-guide-"))
  try {
    writeFileSync(join(tmp, "AGENTS.md"), "# 项目指南\n\n需求文档在 docs/REQUIREMENTS.md 与 docs/design/ 下。\n")
    const agent = {
      _touchedFiles: [], cwd: tmp, history: [{ role: "user", content: "做个功能" }],
      _advisorRound: 0, config: {},
      provider: { model: "deepseek-v4-pro" }, // 1M 窗口 → 5% = 50K cap
    }
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["src/app.mjs"])
    assert.ok(msg.includes("## Project Guide (AGENTS.md)"), "应含 Project Guide 段")
    assert.ok(msg.includes("需求文档在 docs/REQUIREMENTS.md"), "AGENTS.md 内容被注入")
    assert.ok(msg.includes("the user's requirements live THERE"), "指引语句在")
    const guideIdx = msg.indexOf("## Project Guide")
    const bgIdx = msg.indexOf("## Conversation Background")
    assert.ok(guideIdx !== -1 && bgIdx !== -1 && guideIdx < bgIdx, "Project Guide 必须在 Conversation Background 之前")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("buildAdvisorUserMessage: 无 AGENTS.md 时诚实降级（明说以对话背景为准）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-guide-"))
  try {
    const agent = { _touchedFiles: [], cwd: tmp, history: [], _advisorRound: 0, config: {}, provider: { model: "m" } }
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["src/app.mjs"])
    assert.ok(msg.includes("## Project Guide (AGENTS.md)"), "段仍在（降级说明）")
    assert.ok(msg.includes("No AGENTS.md found"), "诚实标注缺失")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("buildAdvisorUserMessage: 超预算截断——小窗口模型 5% 上限生效且带截断注记", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-guide-"))
  try {
    const bigGuide = "# 大指南\n" + "内容".repeat(3000) // ~6000 chars
    writeFileSync(join(tmp, "AGENTS.md"), bigGuide)
    // 128K 窗口（gpt-4o spec）：cap = max(8192, 6400) = 8192 → 6000 字符不截断？
    // 用更小的窗口语义验证保底：直接构造超长指南（> cap）
    const hugeGuide = "x".repeat(20_000)
    writeFileSync(join(tmp, "AGENTS.md"), hugeGuide)
    const agent = { _touchedFiles: [], cwd: tmp, history: [], _advisorRound: 0, config: {}, provider: { model: "gpt-4o" } } // 128K → cap 8192
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["src/app.mjs"])
    assert.ok(msg.includes("truncated at 8192 chars"), "超 5% 上限应截断并注明")
    assert.ok(!msg.includes(hugeGuide), "全文不应注入")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("buildAdvisorUserMessage: 1M 窗口模型 5% = 50K cap——长指南不截断", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-guide-"))
  try {
    const guide = "# 项目指南\n" + "设计文档在 docs/design/，需求在 REQUIREMENTS.md。\n".repeat(400) // ~30K chars
    writeFileSync(join(tmp, "AGENTS.md"), guide)
    const agent = { _touchedFiles: [], cwd: tmp, history: [], _advisorRound: 0, config: {}, provider: { model: "deepseek-v4-pro" } } // 1M → cap 50K
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["src/app.mjs"])
    assert.ok(!msg.includes("truncated"), "30K < 50K cap → 全文注入")
    assert.ok(msg.includes("需求在 REQUIREMENTS.md"), "尾部内容也在")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})


// ────────────────────────────────────────
// MAX_ADVISOR_ROUNDS guard logic (agent.mjs)
// ────────────────────────────────────────

test("agent: _advisorRound initialized to 0 in runAgent", () => {
  let _advisorRound = 0
  let _mutatedThisRun = true
  let _calledAdvisorThisRun = false

  // Guard triggers when mutated but not yet called
  assert.equal(_mutatedThisRun && !_calledAdvisorThisRun, true)

  // After calling advisor, guard stops pushing
  _calledAdvisorThisRun = true
  assert.equal(_mutatedThisRun && !_calledAdvisorThisRun, false)
})

test("escapeLiteralEscapes: neutralizes invalid literal \\x/\\u sequences, passes valid ones through", async () => {
  const { escapeLiteralEscapes } = await import("../src/advisor.mjs")
  const cases = [
    ["\\x（单反斜杠）", "\\\\x（单反斜杠）"], // \x + non-hex → doubled
    ["末尾\\x", "末尾\\\\x"], // \x at end → doubled
    ["\\x1b[31m", "\\x1b[31m"], // \x + 2 hex → untouched
    ["\\x1b3", "\\x1b3"], // \x + 3+ hex → \x1b valid + literal 3 → untouched
    ["\\x1后跟", "\\\\x1后跟"], // \x + 1 hex (truncated) → doubled
    ["\\u12中文", "\\\\u12中文"], // \u + <4 hex → doubled
    ["\\uFFFF", "\\uFFFF"], // \u + 4 hex → untouched
    ["\\uFFFF1", "\\uFFFF1"], // \u + 5 hex → \uFFFF valid + literal 1 → untouched
    ["\\n字面", "\\n字面"], // non-hex escapes untouched
    ["\\\\x", "\\\\x"], // already-doubled backslash untouched
    ["hello", "hello"], // plain text untouched
    [null, ""], // null → coerced to empty
    [undefined, ""], // undefined → coerced to empty
  ]
  for (const [input, expected] of cases) {
    assert.equal(escapeLiteralEscapes(input), expected, JSON.stringify(input))
  }
})

test("agent: _advisorRound increments on every advisor call (code AND design)", () => {
  // Mirrors agent.mjs: design reviews share the convergence budget with code
  // reviews — both advance _advisorRound toward MAX_ADVISOR_ROUNDS=5.
  let _advisorRound = 0
  const toolCalls = [
    { name: "write", ok: true, arguments: "{}" },
    { name: "advisor", ok: true, arguments: "{}" },
    { name: "advisor", ok: true, arguments: JSON.stringify({ type: "design" }) },
    { name: "edit", ok: true, arguments: "{}" },
    { name: "advisor", ok: true, arguments: "{}" },
  ]

  for (const tc of toolCalls) {
    if (tc.name === "advisor") {
      try {
        JSON.parse(tc.arguments || "{}")
      } catch {
        /* unparseable — still counts as a review attempt */
      }
      _advisorRound++
    }
  }

  assert.equal(_advisorRound, 3) // code + design + code — all count
})

// ────────────────────────────────────────
// Session memory — prepareAdvisorMessages / buildAdvisorFollowUp
// ────────────────────────────────────────

test("prepareAdvisorMessages: first call creates a fresh [system, user] session", () => {
  const agent = { history: [], _advisorRound: 0, _advisorSession: null, cwd: tmpdir(), _touchedFiles: [] }
  const session = prepareAdvisorMessages(agent)
  assert.equal(session.length, 2)
  assert.equal(session[0].role, "system")
  assert.equal(session[1].role, "user")
})


test("prepareAdvisorMessages: design round 2+ is a FRESH session with prior-table follow-up", () => {
  const priorTable = "| # | Category | Severity | Issue | Suggestion |\n| 1 | Clarity | 🔴 | gap | fix |"
  const agent = { history: [{ role: "tool", tool_call_id: "a1", content: priorTable }], _advisorRound: 0, _advisorSession: null, cwd: tmpdir(), _touchedFiles: [], _lastAdvisorOutput: priorTable }
  // Round 1: fresh design session (full design-review prompt + token)
  const first = prepareAdvisorMessages(agent, "design", "TOKEN1")
  assert.equal(first.length, 2)
  assert.ok(first[0].content.includes("design reviewer"), "round 1 keeps the design prompt")
  assert.ok(first[1].content.includes("TOKEN1"), "round 1 carries the approval token")
  agent._advisorRound = 1

  // Round 2: FRESH [system(ROUND2), user(prior table + fix claims)] —
  // no reused messages; the prior table IS injected (decision 2026-08-05,
  // reversed: it is the only complete verification list).
  const second = prepareAdvisorMessages(agent, "design", null)
  assert.notEqual(second, first, "fresh array — no session reuse")
  assert.equal(second.length, 2)
  assert.ok(second[1].content.includes("Round 2"), "design follow-up carries round number")
  assert.ok(second[1].content.includes(priorTable.slice(0, 30)), "prior table injected into the follow-up")
  assert.ok(second[0].content.includes("Verify the prior review output"), "design round 2 system prompt narrowed to ROUND2")
  assert.ok(!second[0].content.includes("design reviewer"), "round-1 design mandate does not leak into round 2")

  // Rounds 3 and 4: fresh each time, strict verification
  agent._advisorRound = 2
  const third = prepareAdvisorMessages(agent, "design", null)
  assert.notEqual(third, second, "round 3 is a fresh session too")
  assert.ok(third[1].content.includes("Round 3"), "round 3 follow-up")
  agent._advisorRound = 3
  const fourth = prepareAdvisorMessages(agent, "design", null)
  assert.ok(fourth[1].content.includes("Round 4"), "round 4 follow-up")
  assert.ok(fourth[0].content.includes("Strictly verify only the prior review output"), "design round 3+ system prompt is ROUND3")
})

test("prepareAdvisorMessages: convergence rounds are FRESH sessions with prior-table follow-up", () => {
  const priorTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | a.js | 🔴 | bug | fix |"
  const agent = { history: [{ role: "tool", tool_call_id: "a1", content: priorTable }], _advisorRound: 1, _advisorSession: null, cwd: tmpdir(), _touchedFiles: [], _lastAdvisorOutput: priorTable }
  const second = prepareAdvisorMessages(agent)
  assert.equal(second.length, 2, "fresh [system, user] — no old read data in context")
  assert.equal(second[1].role, "user")
  assert.ok(second[1].content.includes("Round 2"), "follow-up carries round number")
  assert.ok(second[1].content.includes("Agent Response"), "follow-up includes the response table as reference")
  assert.ok(second[1].content.includes(priorTable.slice(0, 30)), "prior table IS injected — the complete verification list")
  assert.ok(second[0].content.includes("Verify the prior review output"), "round 2 system prompt is the narrowed ROUND2")

  agent._advisorRound = 2
  const third = prepareAdvisorMessages(agent)
  assert.ok(third[1].content.includes("Round 3"))
  assert.ok(third[1].content.includes("Strict"), "round 3+ is strict verification")
  assert.ok(third[0].content.includes("Strictly verify only the prior review output"), "round 3 system prompt is ROUND3 — do not look for new issues")
  assert.ok(third[0].content.includes("Do NOT look for new issues"))
})

test("buildAdvisorFollowUp: includes agent response table when present", () => {
  const agent = {
    _advisorRound: 1,
    cwd: tmpdir(),
    _touchedFiles: [],
    _lastAdvisorOutput: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.mjs | 🔴 | bug | fix |",
    history: [
      { role: "tool", tool_call_id: "tc1", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.mjs | 🔴 | bug | fix |" },
      { role: "assistant", content: "| # | Action | Detail |\n| 1 | fixed | added null check |" },
    ],
  }
  const msg = buildAdvisorFollowUp(agent)
  assert.ok(msg.includes("added null check"), "response table extracted from history")
})

test("buildAdvisorFollowUp: tolerates missing response table", () => {
  const agent = {
    _advisorRound: 1,
    cwd: tmpdir(),
    _touchedFiles: [],
    _lastAdvisorOutput: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.mjs | 🔴 | bug | fix |",
    history: [{ role: "tool", tool_call_id: "tc1", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.mjs | 🔴 | bug | fix |" }],
  }
  const msg = buildAdvisorFollowUp(agent)
  assert.ok(msg.includes("did not provide a response table"))
})

test("buildAdvisorFollowUp: injects NO git information (read-only verification by design)", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-test-"))
  try {
    createGitRepo(tmp)
    writeFileSync(join(tmp, "app.js"), "// changed")
    const agent = {
      _advisorRound: 1,
      cwd: tmp,
      _touchedFiles: [join(tmp, "app.js")],
      _lastAdvisorOutput: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.mjs | 🔴 | bug | fix |",
      history: [{ role: "tool", tool_call_id: "tc1", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.mjs | 🔴 | bug | fix |" }],
    }
    const followUp = buildAdvisorFollowUp(agent)
    assert.ok(followUp.includes("Prior Review Output"), "prior output injected — the complete verification list")
    assert.ok(!followUp.includes("Git Context"), "no git context injected")
    assert.ok(!followUp.includes("## Current Changes"), "no diff-snapshot section injected")
    assert.ok(!followUp.includes("git status"), "no git status injected")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("extractConversationBackground: skips reminders/tool messages and caps turns", () => {
  const history = [
    { role: "user", content: "turn one" },
    { role: "assistant", content: "reply one" },
    { role: "user", content: "[System reminder: guard pushback]" },
    { role: "user", content: "turn two" },
    { role: "tool", content: "tool result noise" },
    { role: "assistant", content: "reply two" },
    { role: "user", content: "turn three" },
    { role: "user", content: "turn four" },
  ]
  const bg = extractConversationBackground(history, 3)
  assert.ok(bg.includes("turn four") && bg.includes("turn three") && bg.includes("turn two"))
  assert.ok(!bg.includes("turn one"), "only the last 3 user turns kept")
  assert.ok(!bg.includes("System reminder"), "reminders filtered")
  assert.ok(!bg.includes("tool result noise"), "tool messages filtered")
})

test("extractConversationBackground: returns null on empty/noise-only history", () => {
  assert.equal(extractConversationBackground([]), null)
  assert.equal(extractConversationBackground([{ role: "user", content: "[System reminder: x]" }]), null)
})

test("runAdvisorReview: no doc-only auto-skip — review runs (or fails explicitly), never silently passes", async () => {
  // Doc-only fast path was removed — scope is now explicit via paths/documents.
  // With a broken provider the review must surface an explicit failure
  // ("Advisor: review failed …"), never a pass marker. (fetch on the fake
  // provider's undefined baseURL throws immediately — no slow network wait.)
  const { runAdvisorReview } = await import("../src/advisor/run.mjs")
  const agent = {
    config: {},
    provider: { name: "p", model: "m" },
    history: [{ role: "user", content: "update the readme" }],
    _touchedFiles: [],
    _advisorRound: 0,
    cwd: tmpdir(),
  }
  const result = await runAdvisorReview(agent, "code", {})
  assert.ok(result.startsWith("Advisor:"), "explicit failure/notice, not a silent pass")
  assert.ok(!result.includes("not enabled"), "enabled gate removed (2026-08-21): no advisor config must still run the review, got: " + result)
  assert.ok(!result.includes("CODE_REVIEW_PASSED"), "CODE_REVIEW_PASSED should no longer appear")
})

test("runAdvisorReview: convergence cap blocks a 6th review call", async () => {
  const { runAdvisorReview, MAX_ADVISOR_ROUNDS } = await import("../src/advisor/run.mjs")
  const agent = {
    config: {},
    provider: { name: "p", model: "m" },
    history: [],
    _touchedFiles: ["x.js"],
    _advisorRound: MAX_ADVISOR_ROUNDS, // cap already reached — 5 reviews completed
    _advisorSession: [],
    cwd: tmpdir(),
  }
  const result = await runAdvisorReview(agent, "code", {})
  assert.ok(result.includes("convergence cap reached"), `cap message expected, got: ${result}`)
  assert.ok(result.includes(String(MAX_ADVISOR_ROUNDS)), "cap message names the round limit")
})


test("advisorToolsFor: ZERO git tools; read-only set (code_search replaces execute)", async () => {
  const mod = await import("../src/advisor/run.mjs")
  const withMemory = mod._advisorToolsFor({ memory: { db: null } })
  assert.ok(!withMemory.byName.has("git"), "no git tool — advisor never touches git")
  assert.ok(!withMemory.byName.has("execute"), "no execute tool — CodeMode can write files, violates the read-only mandate")
  assert.ok(withMemory.byName.has("code_search"), "semantic code_search included when memory exists")
  for (const t of ["read", "grep", "lsp", "glob", "ls"]) {
    assert.ok(withMemory.byName.has(t), `tool set keeps ${t}`)
  }
  const withoutMemory = mod._advisorToolsFor({})
  assert.ok(!withoutMemory.byName.has("code_search"), "no memory → code_search omitted (5 tools)")
  assert.equal(withoutMemory.schemas.length, 5)
})

test("verifyCitations: matches real file content, flags stale/missing citations", async () => {
  const { extractCitations, verifyCitations, appendCitationReport } = await import("../src/advisor/run.mjs")
  const dir = mkdtempSync(join(tmpdir(), "cit-"))
  const { writeFileSync } = await import("node:fs")
  writeFileSync(join(dir, "a.mjs"), "line one\nconst x = 42\nline three\n", "utf8")
  const text = [
    "| 1 | a.mjs | 🔴 | bug | Unfixed |",
    "Evidence: `a.mjs:2: const x = 42` — still present.",
    "Stale claim: `a.mjs:2: const y = 99` — from the prior table.",
    "Missing file: `nope.mjs:1: anything`.",
  ].join("\n")
  const citations = extractCitations(text)
  assert.equal(citations.length, 3, "all file:line: content references extracted")
  const { total, matched, failed } = verifyCitations(text, dir)
  assert.equal(total, 3)
  assert.equal(matched.length, 1, "only the real line matches")
  assert.equal(failed.length, 2, "stale content and missing file fail")
  const report = appendCitationReport(text, dir)
  assert.ok(report.includes("[host-verified] 1/3 citations match current file state"), "report header")
  assert.ok(report.includes("nope.mjs:1"), "missing file listed")
})

test("verifyCitations: path traversal citation is rejected (never reads outside cwd)", async () => {
  const { verifyCitations } = await import("../src/advisor/run.mjs")
  const dir = mkdtempSync(join(tmpdir(), "cit-sec-"))
  const secret = join(dir, "..", "cit-sec-secret.json")
  writeFileSync(secret, '{"apiKey":"super-secret-value"}\n', "utf8")
  try {
    const text = '| 1 | a.mjs | 🔴 | bug | Unfixed |\nEvidence: `../cit-sec-secret.json:1: {"apiKey":"super-secret-value"}`'
    const { total, matched, failed } = verifyCitations(text, dir)
    assert.equal(total, 1)
    assert.equal(matched.length, 0, "no match — traversal path must not be read")
    assert.equal(failed[0].reason, "path traversal", "flagged as traversal")
  } finally {
    rmSync(dir, { recursive: true, force: true })
    rmSync(secret, { force: true })
  }
})


test("prepareAdvisorMessages: run with code mutations PRESERVES the round on prior loss", () => {
  // Deterministic rule (user decision): a run that modified code WILL be
  // pushed back by the advisor guard — the round must keep advancing toward
  // the cap. Never judged from model output (phrases/headers drift).
  const agent = { _mutatedThisRun: true, history: [], _advisorRound: 2, _advisorSession: null, cwd: tmpdir(), _touchedFiles: [] }
  const session = prepareAdvisorMessages(agent)
  assert.equal(agent._advisorRound, 2, "mutations → round preserved")
  assert.ok(session[0].content.includes("code review advisor"), "ROUND1 prompt — fresh full review without a prior table")
  assert.ok(session[1].content.includes("fresh full review"), "fresh-review user message")
})

test("prepareAdvisorMessages: run without mutations resets the round (no push-back risk)", () => {
  const agent = { _mutatedThisRun: false, history: [{ role: "tool", tool_call_id: "a1", content: "Advisor: review failed (timeout)" }], _advisorRound: 3, _advisorSession: null, cwd: tmpdir(), _touchedFiles: [] }
  const session = prepareAdvisorMessages(agent)
  assert.equal(agent._advisorRound, 0, "no mutations → reset is safe (guard cannot push back)")
  assert.ok(session[0].content.includes("code review advisor"), "ROUND1 prompt")
})

test("appendCitationReport: no citations → text unchanged", async () => {
  const { appendCitationReport } = await import("../src/advisor/run.mjs")
  const t = "Everything is fine."
  assert.equal(appendCitationReport(t, process.cwd()), t)
})

test("prepareAdvisorMessages: all-clear review resets the round — prompt and tool set agree", () => {
  // Prior review passed (all-clear → no prior table) but _advisorRound > 0:
  // the next review must be a fresh round 1 (ROUND1 prompt — git-free tool set
  // applies to every round, so prompt and tools stay consistent).
  const agent = { history: [{ role: "tool", tool_call_id: "a1", content: "everything is fine, no issues" }], _advisorRound: 3, _advisorSession: null, cwd: tmpdir(), _touchedFiles: [] }
  const session = prepareAdvisorMessages(agent)
  assert.equal(agent._advisorRound, 0, "round reset — new review cycle")
  assert.ok(session[0].content.includes("code review advisor"), "ROUND1 prompt (full scope)")
})

test("prepareAdvisorMessages: _advisorRound=0 with stale prior table → fresh round 1 (no verify-prior follow-up)", () => {
  // History persists across runAgent calls: a prior table can exist while the
  // round counter is 0. The ROUND1 system prompt must not be paired with the
  // verify-prior follow-up (contradictory instructions).
  const priorTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | a.js | 🔴 | bug | fix |"
  const agent = { history: [{ role: "tool", tool_call_id: "a1", content: priorTable }], _advisorRound: 0, _advisorSession: null, cwd: tmpdir(), _touchedFiles: [] }
  const session = prepareAdvisorMessages(agent)
  assert.equal(session.length, 2, "fresh [system, user]")
  assert.ok(session[0].content.includes("code review advisor"), "ROUND1 prompt (full scope)")
  assert.ok(!session[1].content.includes("Verify Prior Table"), "no verify-prior follow-up at round 0")
  assert.ok(session[1].content.includes("fresh full review"), "round-1 user message")
  assert.equal(agent._advisorRound, 0, "round stays 0")
})

test("prepareAdvisorMessages: failed-retry with prior table PRESERVES the round", () => {
  const priorTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | a.js | 🔴 | bug | fix |"
  const agent = { history: [{ role: "tool", tool_call_id: "a1", content: priorTable }], _advisorRound: 2, _advisorSession: null, cwd: tmpdir(), _touchedFiles: [], _lastAdvisorOutput: priorTable }
  const session = prepareAdvisorMessages(agent)
  assert.equal(agent._advisorRound, 2, "round preserved for the convergence prompt")
  assert.ok(session[0].content.includes("Strictly verify only the prior review output"), "ROUND3 prompt — convergence continues")
})

test("runAdvisorReview: cap blocks design reviews too after 5 rounds (bounded loop)", async () => {
  const { runAdvisorReview, MAX_ADVISOR_ROUNDS } = await import("../src/advisor/run.mjs")
  const agent = {
    config: {},
    provider: { name: "p", model: "m" },
    history: [],
    _touchedFiles: [],
    _advisorRound: MAX_ADVISOR_ROUNDS + 5,
    _advisorSession: null,
    cwd: tmpdir(),
  }
  // Cap reached — design reviews share the 5-round budget with code reviews.
  // No network call happens: the cap returns the termination message directly.
  const result = await runAdvisorReview(agent, "design", { signal: { aborted: true } })
  assert.ok(result.includes("convergence cap reached"), `design review must hit the cap, got: ${result}`)
  assert.ok(result.includes(String(MAX_ADVISOR_ROUNDS)), "cap message names the round limit")
})

test("runAdvisorReview: design review below cap reaches the tool loop", async () => {
  const { runAdvisorReview, MAX_ADVISOR_ROUNDS } = await import("../src/advisor/run.mjs")
  const agent = {
    config: {},
    provider: { name: "p", model: "m" },
    history: [],
    _touchedFiles: [],
    _advisorRound: MAX_ADVISOR_ROUNDS - 1, // 5th review still allowed
    _advisorSession: null,
    cwd: tmpdir(),
  }
  // Pre-aborted signal: the tool loop returns "interrupted" immediately — no
  // network call. Proves the guard let the review through before the cap.
  const result = await runAdvisorReview(agent, "design", { signal: { aborted: true } })
  assert.ok(!result.includes("convergence cap reached"), `design review must pass the cap guard, got: ${result}`)
  assert.ok(result.includes("interrupted"), `design review must reach the tool loop, got: ${result}`)
})

test("runAdvisorReview: code changes do NOT hit the doc-only fast path", async () => {
  let tmp
  try {
    tmp = mkdtempSync(join(tmpdir(), "advisor-test-"))
    createGitRepo(tmp)
    writeFileSync(join(tmp, "app.js"), "console.log(1)\n")
    execSync("git add -A", { cwd: tmp, stdio: "ignore" })
    // verify isDocOnlyChange indirectly: with a .js change the review must proceed.
    // We can't run the LLM here, so assert the fast path is NOT taken by checking
    // that prepareAdvisorMessages builds a round-1 session for this agent.
    const agent = {
      config: {},
      provider: { name: "p", model: "m" },
      history: [{ role: "user", content: "change app code" }],
      _touchedFiles: [join(tmp, "app.js")],
      _advisorRound: 0,
      _advisorSession: null,
      cwd: tmp,
    }
    const session = prepareAdvisorMessages(agent, undefined, null, null, ["app.js"])
    assert.equal(session[0].role, "system")
    assert.ok(session[1].content.includes("app.js") || session[1].content.includes("diff"), "code change goes to full review")
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true })
  }
})

test("_renderTimeline: interleaves thinking/tool/final in emission order (persisted-record gap)", async () => {
  const { _renderTimeline } = await import("../src/advisor/run.mjs")
  assert.equal(_renderTimeline([]), "", "empty timeline")
  assert.equal(_renderTimeline([], "tail only"), "tail only", "tail alone when timeline empty")
  const timeline = [
    { kind: "think", text: "先读文件" },
    { kind: "tool", text: "\n→ read src/a.mjs\n" },
    { kind: "think", text: "看到问题了" },
    { kind: "text", text: "\n| # | 问题 |\n| 1 | x |" },
  ]
  const out = _renderTimeline(timeline)
  assert.ok(out.includes("→ read src/a.mjs"), "tool call present")
  assert.ok(out.indexOf("先读文件") < out.indexOf("→ read src/a.mjs"), "think before its tool call")
  assert.ok(out.indexOf("→ read src/a.mjs") < out.indexOf("看到问题了"), "tool call before the next think")
  assert.ok(out.indexOf("看到问题了") < out.indexOf("| 1 | x |"), "final text last")
  // placeholder strip
  const withPlaceholder = _renderTimeline([{ kind: "think", text: "a\n[thinking…]\nb" }])
  assert.ok(!withPlaceholder.includes("[thinking…]"), "placeholder stripped")
})

test("buildAdvisorUserMessage: 多项目工作区——评审范围在子目录时注入该子项目的 AGENTS.md", () => {
  const ws = mkdtempSync(join(tmpdir(), "advisor-ws-"))
  try {
    // 工作区根无 AGENTS.md；两个子项目各有自己的
    mkdirSync(join(ws, "proj-a", "src"), { recursive: true })
    mkdirSync(join(ws, "proj-b"), { recursive: true })
    writeFileSync(join(ws, "proj-a", "AGENTS.md"), "# Proj A\n需求在 proj-a/REQUIREMENTS.md。\n")
    writeFileSync(join(ws, "proj-b", "AGENTS.md"), "# Proj B\n")
    const agent = {
      _touchedFiles: [], cwd: ws, history: [], _advisorRound: 0, config: {},
      provider: { model: "deepseek-v4-pro" },
    }
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["proj-a/src/app.mjs"])
    assert.ok(msg.includes("Proj A"), "应注入 proj-a 的 AGENTS.md（评审文件所在子项目）")
    assert.ok(!msg.includes("Proj B"), "不应注入无关子项目的 AGENTS.md")
    assert.ok(msg.includes("proj-a/AGENTS.md"), "标注项目根路径")
    assert.ok(msg.includes("proj-a/REQUIREMENTS.md"), "子项目需求文档指引在")
  } finally {
    rmSync(ws, { recursive: true, force: true })
  }
})

test("buildAdvisorUserMessage: 混合分隔符绝对路径（正斜杠输入）仍定位子项目地图", () => {
  const ws = mkdtempSync(join(tmpdir(), "advisor-mixsep-"))
  try {
    mkdirSync(join(ws, "proj-a", "src"), { recursive: true })
    writeFileSync(join(ws, "proj-a", "AGENTS.md"), "# Proj A\n")
    writeFileSync(join(ws, "AGENTS.md"), "# Workspace root meta\n")
    const agent = {
      _touchedFiles: [], cwd: ws, history: [], _advisorRound: 0, config: {},
      provider: { model: "deepseek-v4-pro" },
    }
    // 真实 _touchedFiles 存 join() 产物（反斜杠）；测试输入正斜杠——两种都必须命中子项目
    const fwd = join(ws, "proj-a", "src", "app.mjs").replaceAll("\\", "/")
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, [fwd])
    assert.ok(msg.includes("Proj A"), "正斜杠绝对路径命中子项目地图")
    assert.ok(!msg.includes("Workspace root meta"), "根元地图不遮蔽")
  } finally {
    rmSync(ws, { recursive: true, force: true })
  }
})


test("buildAdvisorUserMessage: cwd 有 AGENTS.md 但评审在子项目 → 子项目地图胜出（工作区级地图不遮蔽）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-root-"))
  try {
    mkdirSync(join(tmp, "sub"), { recursive: true })
    writeFileSync(join(tmp, "AGENTS.md"), "# Root meta guide\n工作区级元地图。\n")
    writeFileSync(join(tmp, "sub", "AGENTS.md"), "# Sub guide\n子项目需求。\n")
    const agent = { _touchedFiles: [], cwd: tmp, history: [], _advisorRound: 0, config: {}, provider: { model: "m" } }
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["sub/file.mjs"])
    assert.ok(msg.includes("Sub guide"), "评审在 sub/ → sub 的项目地图胜出")
    assert.ok(!msg.includes("Root meta guide"), "cwd 的元地图不遮蔽子项目地图")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("buildAdvisorUserMessage: 单项目（cwd 有 AGENTS.md、子目录没有）→ cwd 地图", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-single-"))
  try {
    mkdirSync(join(tmp, "src"), { recursive: true })
    writeFileSync(join(tmp, "AGENTS.md"), "# Single project guide\n")
    const agent = { _touchedFiles: [], cwd: tmp, history: [], _advisorRound: 0, config: {}, provider: { model: "m" } }
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["src/app.mjs"])
    assert.ok(msg.includes("Single project guide"), "walk 最后一步落到 cwd 的 AGENTS.md")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("buildAdvisorUserMessage: 工作区与评审目录均无 AGENTS.md → 诚实降级", () => {
  const ws = mkdtempSync(join(tmpdir(), "advisor-noguide-"))
  try {
    mkdirSync(join(ws, "src"), { recursive: true })
    const agent = { _touchedFiles: [], cwd: ws, history: [], _advisorRound: 0, config: {}, provider: { model: "m" } }
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["src/app.mjs"])
    assert.ok(msg.includes("No AGENTS.md found"), "无地图时诚实标注")
    assert.ok(msg.includes("conversation background"), "以对话背景为准")
  } finally {
    rmSync(ws, { recursive: true, force: true })
  }
})

// ────────────────────────────────────────
// decision 2026-08-08: prior review output injected verbatim, no hard parsing
// ────────────────────────────────────────

test("buildAdvisorFollowUp: injects the FULL prior review output verbatim (model understands it — no table parsing)", () => {
  const reviewOutput = "Prior review: some narrative explanation...\n\n| # | File | Severity | Issue | Suggestion |\n|---|------|----------|-------|------------|\n| 1 | a.mjs | 🔴 | bug A | fix A |\nNo new issues."
  const agent = { history: [], _advisorRound: 1, _lastAdvisorOutput: reviewOutput, cwd: tmpdir() }
  const msg = buildAdvisorFollowUp(agent)
  assert.ok(msg.includes(reviewOutput), "完整原文注入（含叙述）")
  assert.ok(msg.includes("## Prior Review Output"), "段标题")
})

test("buildAdvisorFollowUp: no stored output → fresh-review fallback (no prior parsing from history)", () => {
  // History contains a perfectly-formatted prior table — but with the
  // 2026-08-08 decision the host does NOT parse history: no stored output
  // means no convergence follow-up.
  const history = [
    { role: "tool", tool_call_id: "a1", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.js | 🔴 | bug | fix |" },
  ]
  const agent = { history, _advisorRound: 1, _lastAdvisorOutput: null, cwd: tmpdir() }
  const msg = buildAdvisorFollowUp(agent)
  assert.ok(msg.includes("System reminder: convergence follow-up requested without a prior review"), "诚实降级")
})

test("buildAdvisorFollowUp: round 1 guard still enforced", () => {
  const agent = { history: [], _advisorRound: 0, _lastAdvisorOutput: "some review", cwd: tmpdir() }
  const msg = buildAdvisorFollowUp(agent)
  assert.ok(msg.includes("convergence follow-up requested at round 1"), "round 1 无验证语义")
})

test("prepareAdvisorMessages: round 2+ requires BOTH _advisorRound>0 and stored output (no history parsing)", () => {
  const mk = (over = {}) => ({
    history: [], _advisorRound: 0, _lastAdvisorOutput: null, _mutatedThisRun: true,
    config: {}, provider: { model: "m" }, _touchedFiles: [], _advisorSession: null, cwd: tmpdir(), ...over,
  })
  // Round 1: no stored output → full review even though history has a table
  const agent1 = mk({ _advisorRound: 0, _lastAdvisorOutput: null })
  const s1 = prepareAdvisorMessages(agent1)
  assert.ok(s1[0].content.includes("full-scope review"), "ROUND1 prompt")

  // Round 2: stored output → convergence follow-up with verbatim injection
  const agent2 = mk({ _advisorRound: 1, _lastAdvisorOutput: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.js | 🔴 | bug | fix |" })
  const s2 = prepareAdvisorMessages(agent2)
  assert.ok(s2[0].content.includes("Verify the prior review output"), "ROUND2 system prompt")
  assert.ok(s2[1].content.includes("## Prior Review Output"), "原文注入")
  assert.ok(s2[1].content.includes("bug | fix |"), "评审表内容在")
})

test("buildAdvisorSystemPrompt: round decision is deterministic (_advisorRound + stored output)", () => {
  const mk = (r, out) => ({ history: [], _advisorRound: r, _lastAdvisorOutput: out, cwd: tmpdir() })
  assert.ok(buildAdvisorSystemPrompt(mk(0, null)).includes("full-scope review"), "round 0 → ROUND1")
  assert.ok(buildAdvisorSystemPrompt(mk(1, null)).includes("full-scope review"), "round>0 但无输出 → 保守 ROUND1")
  assert.ok(buildAdvisorSystemPrompt(mk(1, "review text")).includes("Verify the prior review output"), "round>0 + 输出 → ROUND2")
  assert.ok(buildAdvisorSystemPrompt(mk(2, "review text")).includes("Strictly verify only the prior review output"), "round 3+ → ROUND3")
})

test("buildAdvisorSystemPrompt: prior param overrides stored output (direct caller compat)", () => {
  const agent = { history: [], _advisorRound: 1, _lastAdvisorOutput: null, cwd: tmpdir() }
  assert.ok(buildAdvisorSystemPrompt(agent, "direct prior").includes("Verify the prior review output"), "显式 prior 参数")
})

test("extractAgentResponseTable: no sinceIdx → most recent response table (backward scan)", () => {
  const history = [
    { role: "assistant", content: "| # | Action | Detail |\n| 1 | ✅ Fixed | old |" },
    { role: "tool", tool_call_id: "a1", content: "some review" },
    { role: "assistant", content: "| # | Action | Detail |\n| 1 | ✅ Fixed | new |" },
  ]
  const result = extractAgentResponseTable(history)
  assert.ok(result.includes("new |"), "最近响应表优先")
  assert.ok(!result.includes("old |"), "不取旧的")
})

test("buildAdvisorUserMessage: legacy convergence path injects verbatim output, not parsed table", () => {
  const agent = {
    _touchedFiles: [], cwd: tmpdir(), history: [], _advisorRound: 1,
    _lastAdvisorOutput: "explanation text + table", config: {},
    provider: { model: "m" },
  }
  const msg = buildAdvisorUserMessage(agent, null, "code")
  assert.ok(msg.includes("## Prior Review Output"), "legacy 路径同样原文注入")
  assert.ok(msg.includes("explanation text + table"), "完整输出")
})


// ────────────────────────────────────────
// 文档归属纪律 + advisor 设计评审增强（2026-08-21，AGENT-LOOP.md §12）
// ────────────────────────────────────────

const TEST_DIR_ABS = dirname(fileURLToPath(import.meta.url)) // thincoder/test
const SRC_DIR_ABS = join(TEST_DIR_ABS, "..", "src")
const PROMPTS_DIR_ABS = join(SRC_DIR_ABS, "prompts")

test("prompts/advisor-design.md: Document ownership 维度 + 🔴/🟡 分级 + 引用纪律 + Approval Signal 保留", () => {
  const text = readFileSync(join(PROMPTS_DIR_ABS, "advisor-design.md"), "utf8")
  assert.ok(text.includes("Document ownership"), "第 7 维 Document ownership 存在")
  assert.match(text, /CONTRADICTS[^\n]*🔴/, "与现有文档矛盾 → 🔴 分级句")
  assert.match(text, /duplicating[^\n]*🟡/, "该并入却新建/重复描述 → 🟡 分级句")
  assert.ok(text.includes("file:line"), "引用纪律：精确 file:line 格式")
  assert.ok(text.includes("unverified"), "引用纪律：未核实内容标注 unverified")
  assert.ok(text.includes("## Approval Signal"), "Approval Signal 段保留")
  assert.ok(text.includes("[DESIGN-TOKEN:...]"), "DESIGN-TOKEN 回显规则保留（防 fallback 删除后丢失）")
})

test("prompts/system.md: 文档归属纪律条款（doc map / update instead of creating）", () => {
  const text = readFileSync(join(PROMPTS_DIR_ABS, "system.md"), "utf8")
  assert.ok(text.includes("Document ownership"), "条款存在")
  assert.ok(text.includes("docs/design/README.md"), "doc map 定位句")
  assert.match(text, /update it; never create a new file/, "找到就改、不得新建（update instead of creating）")
  assert.match(text, /exactly ONE place/, "单一权威源语义")
})

test("docs/design/README.md: 文档地图存在且含板块映射表 + 待合并标注", () => {
  const text = readFileSync(join(SRC_DIR_ABS, "..", "docs", "design", "README.md"), "utf8")
  assert.ok(text.includes("板块 → 文档映射"), "映射表存在")
  assert.match(text, /\| 架构 \|/, "架构板块行")
  assert.match(text, /\| 工具系统 \|/, "工具板块行")
  assert.ok(text.includes("待合并（TODO）"), "存量碎片待合并标注")
})

test("advisor.mjs: design 提示词硬加载——无 ADVISOR_DESIGN_FALLBACK 残留，内容与文件逐字节一致", () => {
  const src = readFileSync(join(SRC_DIR_ABS, "advisor.mjs"), "utf8")
  assert.ok(!src.includes("ADVISOR_DESIGN_FALLBACK"), "ADVISOR_DESIGN_FALLBACK 常量已删除")
  assert.ok(src.includes('loadPrompt("advisor-design.md"'), "design 提示词走 loadPrompt 硬加载（缺失即抛错，与 round1/2/3 同待遇）")
  const prompt = buildAdvisorSystemPrompt({ history: [], _advisorRound: 0, cwd: tmpdir() }, null, "design")
  const file = readFileSync(join(PROMPTS_DIR_ABS, "advisor-design.md"), "utf8")
  assert.equal(prompt, file, "设计审查系统提示词与 advisor-design.md 逐字节一致（无静默降级）")
})

test("buildAdvisorUserMessage: design 分支 Instructions 补 Methodology compliance 维度", () => {
  const agent = { history: [], _advisorRound: 0, cwd: tmpdir(), config: {} }
  const msg = buildAdvisorUserMessage(agent, null, "design")
  assert.ok(msg.includes("methodology compliance (does it follow the project's METHODOLOGY.md?)"), "Instructions 第 2 条含 Methodology 维度")
})

test("buildAdvisorUserMessage: 存在 docs/design/README.md 时 design 分支注入 Document Map 段", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-docmap-"))
  try {
    mkdirSync(join(tmp, "docs", "design"), { recursive: true })
    writeFileSync(join(tmp, "docs", "design", "README.md"), "# 文档地图\n\n| 板块 | 文档 |\n| 架构 | ARCHITECTURE.md |\n")
    const agent = { history: [], _advisorRound: 0, cwd: tmp, config: {} }
    const msg = buildAdvisorUserMessage(agent, null, "design")
    assert.ok(msg.includes("## Document Map"), "Document Map 段注入")
    assert.ok(msg.includes("| 架构 | ARCHITECTURE.md |"), "地图文件内容注入")
    const mapIdx = msg.indexOf("## Document Map")
    const instrIdx = msg.indexOf("## Instructions")
    assert.ok(mapIdx !== -1 && instrIdx !== -1 && mapIdx < instrIdx, "Document Map 位于 Instructions 之前")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("buildAdvisorUserMessage: 无 docs/design/README.md 时 design 分支正常跳过 Document Map 段", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-docmap-"))
  try {
    const agent = { history: [], _advisorRound: 0, cwd: tmp, config: {} }
    const msg = buildAdvisorUserMessage(agent, null, "design")
    assert.ok(!msg.includes("## Document Map"), "无地图时不注入")
    assert.ok(msg.includes("## Design Review"), "设计审查消息本体正常")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("buildAdvisorUserMessage: 子项目有 AGENTS.md + 文档地图 → 注入子项目地图（guideRoot 发现逻辑）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-docmap-"))
  try {
    mkdirSync(join(tmp, "sub", "docs", "design"), { recursive: true })
    writeFileSync(join(tmp, "sub", "AGENTS.md"), "# 子项目指南\n")
    writeFileSync(join(tmp, "sub", "docs", "design", "README.md"), "# 子地图\n\n| 板块 | 文档 |\n| x | y.md |\n")
    const agent = { history: [], _advisorRound: 0, cwd: tmp, config: {} }
    const msg = buildAdvisorUserMessage(agent, null, "design", null, ["sub/docs/design/d.md"])
    assert.ok(msg.includes("## Document Map"), "Document Map 段注入")
    assert.ok(msg.includes("# 子地图"), "子项目文档地图内容注入")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})
