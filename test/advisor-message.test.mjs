/**
 * advisor-message.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): advisor.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { execSync } from "node:child_process"
import { tmpdir } from "node:os"
import { slow } from "./slow.mjs"
import {
  extractAgentResponseTable,
  buildAdvisorSystemPrompt,
  buildAdvisorUserMessage,
  extractConversationBackground,
  buildAdvisorFollowUp,
  prepareAdvisorMessages,
  buildObjectDeclarationBlock,
} from "../src/advisor.mjs"
import { appendCitationReport } from "../src/advisor/run.mjs"

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
  // 2026-09-04 §18.10：铁律块按评审类型指引句合法含 "code review" 词——
  // 防误路由断言改为 round1 身份句（code review advisor 身份 = 代码评审提示词）
  assert.ok(!result.includes("You are a code review advisor."), "不应误路由到代码评审提示词（round1 身份句）")
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



slow("buildAdvisorUserMessage: design review with documents reviews ONLY the listed docs", () => {
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



// ─── §18.8 评审对象锚（AGENT-LOOP.md §18.8——T-OA1..5）──────────────

const OA_OBJECT = { type: "design", target: "§18.7", status: "待评审", reason: "用户发起", exclude: "已批准项" }


test("buildObjectDeclarationBlock: 声明块格式（§18.8 D-OA2 英文锚）", () => {
  const block = buildObjectDeclarationBlock(OA_OBJECT)
  assert.ok(block.startsWith("## Review-object declaration (mechanical — do not infer)"), "块头在")
  assert.ok(block.includes("Review type: design | Target: §18.7 | Object state: 待评审 | Trigger: 用户发起"), "类型/目标/状态/原因行在")
  assert.ok(block.includes("Excluded (not in this review): 已批准项"), "排除清单行在")
  assert.ok(block.includes("Follow this declaration — do not infer the review target from the documents."), "按声明执行句在")
  assert.equal(buildObjectDeclarationBlock(null), "", "无 object → 空串")
  assert.equal(buildObjectDeclarationBlock("bad"), "", "非对象 → 空串")
  assert.equal(buildObjectDeclarationBlock(["a", "b"]), "", "数组 → 空串（与 agent-tools 侧防护一致）")
  // exclude 为列表时 join 逗号
  const listBlock = buildObjectDeclarationBlock({ type: "code", target: "t", exclude: ["已批准 A", "已实现 B"] })
  assert.ok(listBlock.includes("Excluded (not in this review): 已批准 A, 已实现 B"), "exclude 列表 join")
})



test("buildAdvisorUserMessage: object 注入声明块——位于评审内容之前（§18.8 T-OA1/T-OA4/T-OA5）", () => {
  const agent = { history: [{ role: "user", content: "design a feature" }], _advisorRound: 0, cwd: tmpdir(), config: {} }
  const msg = buildAdvisorUserMessage(agent, null, "design", null, null, null, OA_OBJECT)
  assert.ok(msg.includes("## Review-object declaration"), "声明块注入")
  assert.ok(msg.includes("Excluded (not in this review): 已批准项"), "排除项在声明块中（T-OA4）")
  const declIdx = msg.indexOf("## Review-object declaration")
  const contentIdx = msg.indexOf("## Design Review")
  assert.ok(declIdx !== -1 && contentIdx !== -1 && declIdx < contentIdx, "声明块位于评审内容之前（T-OA5）")
  assert.ok(msg.includes("## Design Review"), "既有评审内容保留（T-OA5——不破坏）")
})



test("buildAdvisorUserMessage: 无 object 参数——不注入、不崩（§18.8 T-OA3 旧调用兼容）", () => {
  const agent = { history: [], _advisorRound: 0, cwd: tmpdir(), config: {} }
  const msg = buildAdvisorUserMessage(agent, null, "design")
  assert.ok(!msg.includes("## Review-object declaration"), "无声明块")
  assert.ok(msg.includes("## Design Review"), "消息本体正常构建（降级现状）")
})



test("buildAdvisorFollowUp: object 声明块前置——round 2+ 每轮锚定（§18.8 T-OA2）", () => {
  const priorTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | a.mjs | 🔴 | bug | fix |"
  const agent = {
    _advisorRound: 1, cwd: tmpdir(), _touchedFiles: [],
    _lastAdvisorOutput: priorTable,
    history: [{ role: "tool", tool_call_id: "tc1", content: priorTable }],
  }
  const msg = buildAdvisorFollowUp(agent, null, null, OA_OBJECT)
  assert.ok(msg.startsWith("## Review-object declaration"), "声明块位于复评消息开头（T-OA2）")
  assert.ok(msg.includes("## Prior Review Output"), "复评正文保留")
  const msg2 = buildAdvisorFollowUp(agent)
  assert.ok(!msg2.includes("## Review-object declaration"), "无 object 不注入（降级兼容）")
})



test("prepareAdvisorMessages: round 2+ 复评——对象声明仍注入（§18.8 T-OA2 每轮锚定）", () => {
  const priorTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | a.js | 🔴 | bug | fix |"
  const agent = {
    history: [{ role: "tool", tool_call_id: "a1", content: priorTable }],
    _advisorRound: 1, _advisorSession: null, cwd: tmpdir(), _touchedFiles: [],
    _lastAdvisorOutput: priorTable,
  }
  const object = { type: "code", target: "src/a.js", status: "已实现", reason: "交付核销", exclude: "" }
  const msgs = prepareAdvisorMessages(agent, "code", null, null, null, null, object)
  assert.ok(msgs[1].content.includes("## Review-object declaration"), "round 2 复评消息含声明块")
  assert.ok(msgs[1].content.includes("Target: src/a.js"), "声明块目标在")
  assert.ok(msgs[1].content.includes("## Prior Review Output"), "复评正文保留")
})



test("buildAdvisorUserMessage: legacy round 2 路径——对象声明仍在（每轮锚定——T-OA2）", () => {
  const priorTable = "| # | File | Severity | Issue | Suggestion |\n| 1 | a.js | 🔴 | bug | fix |"
  const agent = {
    _touchedFiles: [], cwd: tmpdir(), history: [], _advisorRound: 1,
    _lastAdvisorOutput: priorTable, config: {}, provider: { model: "m" },
  }
  const msg = buildAdvisorUserMessage(agent, null, "code", null, null, null, OA_OBJECT)
  assert.ok(msg.includes("## Review-object declaration"), "legacy 收敛路径同样注入（T-OA2）")
})



test("advisorTool: schema 声明 object 参数（§18.8 D-OA3）", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const object = advisorTool.parameters.properties.object
  assert.ok(object, "object 参数在 schema")
  assert.equal(object.type, "object", "object 为对象形态（与 N-OA1 一致）")
  for (const k of ["type", "target", "status", "reason", "exclude"]) {
    assert.ok(object.properties[k], `object.properties.${k} 在`)
  }
})



test("advisorTool.execute: object 非法形态（字符串/数组）降级——不崩（T-OA3）", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const agent = { config: { agent: { engineering: true } }, _engDesignToken: "standing", _advisorRound: 0, _advisorSession: null, cwd: process.cwd(), _touchedFiles: [] }
  // 早错路径（documents 非 doc 文件）——object 解析在任何崩溃点之前；两种非法形态都不崩
  const out = await advisorTool.execute({ type: "design", documents: ["src/not-a-doc.mjs"], object: "bad-string" }, { agent })
  assert.match(out, /must be in docs/, "字符串形态降级——不破坏早错路径")
  const out2 = await advisorTool.execute({ type: "design", documents: ["src/not-a-doc.mjs"], object: ["a", "b"] }, { agent })
  assert.match(out2, /must be in docs/, "数组形态同样降级")
})


