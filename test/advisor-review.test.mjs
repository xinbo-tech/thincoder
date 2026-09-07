/**
 * advisor-review.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs, advisor.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execSync } from "node:child_process"
import { slow } from "./slow.mjs"

function createGitRepo(testDir) {
  execSync("git init", { cwd: testDir, stdio: "ignore" })
  execSync("git config user.email test@test", { cwd: testDir, stdio: "ignore" })
  execSync("git config user.name test", { cwd: testDir, stdio: "ignore" })
  writeFileSync(join(testDir, "dummy.js"), "// test")
  execSync("git add -A && git commit -m init", { cwd: testDir, stdio: "ignore" })
}



slow("runAdvisorReview: no doc-only auto-skip — review runs (or fails explicitly), never silently passes", async () => {
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



test("runAdvisorReview: design reviews are EXEMPT from the convergence cap — round ≥5 still reaches the LLM (cap is code-only)", async () => {
  const { runAdvisorReview, MAX_ADVISOR_ROUNDS } = await import("../src/advisor/run.mjs")
  const { createServer } = await import("node:http")
  // LLM probe: the mock counts every chat request it receives. If the cap
  // wrongly refused the design review, the probe would never be touched.
  const hits = { count: 0 }
  const server = createServer((req, res) => {
    req.on("data", () => {})
    req.on("end", () => {
      hits.count++
      const frames =
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "Design review completed — no critical issues." } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        `data: [DONE]\n\n`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames)
    })
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const port = server.address().port
  try {
    const agent = {
      config: {},
      provider: { name: "p", model: "m", baseURL: `http://127.0.0.1:${port}`, apiKey: "x" },
      history: [],
      _touchedFiles: [],
      _advisorRound: MAX_ADVISOR_ROUNDS + 5, // design rounds ≥ cap — the old shared budget refused here
      _advisorSession: null,
      cwd: tmpdir(),
    }
    // 2026-09-07 §8: design reviews bypass the cap (code-only cap) — the review
    // runs for real (LLM probe touched) and never returns the cap message.
    const result = await runAdvisorReview(agent, "design", {}, null, ["docs/design/A.md"])
    assert.ok(!result.includes("convergence cap reached"), `design review must bypass the cap, got: ${result}`)
    assert.ok(hits.count >= 1, `LLM probe must be touched — the design review actually ran (hits=${hits.count})`)
  } finally {
    server.close()
  }
})



test("runAdvisorReview: design review below cap reaches the tool loop", async () => {
  const { runAdvisorReview, MAX_ADVISOR_ROUNDS } = await import("../src/advisor/run.mjs")
  const agent = {
    config: {},
    provider: { name: "p", model: "m" },
    history: [],
    _touchedFiles: [],
    _advisorRound: MAX_ADVISOR_ROUNDS - 1, // design rounds are never refused by the cap (§8) — below-cap probe stays as the baseline
    _advisorSession: null,
    cwd: tmpdir(),
  }
  // Pre-aborted signal: the tool loop returns "interrupted" immediately — no
  // network call. Proves the guard let the review through (any round — design
  // is cap-exempt; the ≥cap case is covered by the positive LLM-probe test above).
  const result = await runAdvisorReview(agent, "design", { signal: { aborted: true } })
  assert.ok(!result.includes("convergence cap reached"), `design review must pass the cap guard, got: ${result}`)
  assert.ok(result.includes("interrupted"), `design review must reach the tool loop, got: ${result}`)
})



slow("runAdvisorReview: code changes do NOT hit the doc-only fast path", async () => {
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
    const { prepareAdvisorMessages } = await import("../src/advisor.mjs")
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
