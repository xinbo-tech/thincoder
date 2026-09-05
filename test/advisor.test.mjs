/**
 * advisor.test.mjs — advisor convergence protocol + design-token tests (VS Code port).
 * Ported from the CLI test suite; covers the pure helpers that don't need a live LLM or git repo.
 * Run: node --test test/advisor.test.mjs
 */
import { describe, it, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs"
import { createServer } from "node:http"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

import { extractAgentResponseTable, extractConversationBackground } from "../src/advisor/history.mjs"
import { buildAdvisorSystemPrompt, prepareAdvisorMessages, escapeLiteralEscapes } from "../src/advisor/main.mjs"
import { verifyCitations, appendCitationReport, extractCitations } from "../src/advisor/citations.mjs"
import { buildAdvisorUserMessage, buildReviewObjectDeclaration, injectObjectDeclaration } from "../src/advisor/messages.mjs"
import { isDocFile } from "../src/advisor/repos.mjs"
import { validateDesignToken, extractTokenUUID } from "../src/agent-tools/advisor.mjs"
import { resolveAdvisorProvider, MAX_RESULT_CHARS } from "../src/advisor/run.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"

let tmpDir
let cfgPath

before(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "thincoder-advisor-"))
  cfgPath = join(tmpDir, "config.json")
  _setConfigPathForTest(cfgPath)
})

after(() => {
  rmSync(tmpDir, { recursive: true, force: true })
  _setConfigPathForTest(null)
})

// ─── extractAgentResponseTable ──────────────────────────────────

describe("extractAgentResponseTable", () => {
  it("finds the response table after the advisor call", () => {
    const history = [
      { role: "tool", tool_call_id: "a1", content: "| # | File | Severity | Issue | Suggestion |" },
      { role: "assistant", content: "Here is my response:\n| # | Action | Detail |\n|---|--------|--------|\n| 1 | fixed | added the guard |" },
    ]
    const result = extractAgentResponseTable(history, 0)
    assert(result)
    assert(result.includes("added the guard"))
  })

  it("returns null when no assistant response table exists", () => {
    const history = [
      { role: "tool", tool_call_id: "a1", content: "| # | File | Severity | Issue | Suggestion |" },
      { role: "assistant", content: "no table here" },
    ]
    assert.equal(extractAgentResponseTable(history, 0), null)
  })
})

// ─── extractConversationBackground ──────────────────────────────

describe("extractConversationBackground", () => {
  it("collects recent user/assistant exchanges", () => {
    const history = [
      { role: "user", content: "fix the bug" },
      { role: "assistant", content: "I will fix it" },
      { role: "tool", tool_call_id: "t1", content: "tool output" },
      { role: "user", content: "thanks" },
    ]
    const bg = extractConversationBackground(history)
    assert(bg.includes("fix the bug"))
    assert(bg.includes("I will fix it"))
    assert(!bg.includes("tool output"))
  })

  it("skips system reminders", () => {
    const history = [
      { role: "user", content: "[System reminder: AUTO mode is active]" },
      { role: "user", content: "real question" },
    ]
    const bg = extractConversationBackground(history)
    assert(!bg.includes("AUTO mode"))
    assert(bg.includes("real question"))
  })
})

// ─── buildAdvisorSystemPrompt (round selection) ─────────────────

describe("buildAdvisorSystemPrompt", () => {
  it("returns design prompt for design review", () => {
    const agent = { history: [], _advisorRound: 0 }
    const prompt = buildAdvisorSystemPrompt(agent, null, "design")
    assert(prompt.includes("design reviewer"))
  })

  it("returns round-1 prompt for fresh code review", () => {
    const agent = { history: [], _advisorRound: 0 }
    const prompt = buildAdvisorSystemPrompt(agent, null, "code")
    assert(prompt.includes("full-scope review"))
  })

  it("returns round-2 prompt after one prior round", () => {
    const prior = "| # | File | Severity | Issue | Suggestion |"
    const agent = { history: [], _advisorRound: 1 }
    const prompt = buildAdvisorSystemPrompt(agent, prior, "code")
    assert(prompt.includes("Verify the prior review output"))
  })

  it("returns round-3 prompt after two prior rounds", () => {
    const prior = "| # | File | Severity | Issue | Suggestion |"
    const agent = { history: [], _advisorRound: 2 }
    const prompt = buildAdvisorSystemPrompt(agent, prior, "code")
    assert(prompt.includes("Strictly verify"))
  })
})

// ─── design token validation ────────────────────────────────────

describe("design token", () => {
  it("validateDesignToken REJECTS a legacy non-signed token (v2 fail-closed — the old accept-asis branch was a pass-through backdoor)", () => {
    assert.equal(validateDesignToken("some-simple-token"), false)
  })

  it("validateDesignToken rejects null/empty", () => {
    assert.equal(validateDesignToken(null), false)
    assert.equal(validateDesignToken(""), false)
    assert.equal(validateDesignToken(42), false)
  })

  it("extractTokenUUID returns the first segment", () => {
    assert.equal(extractTokenUUID("abc-def:1234:sig"), "abc-def")
    assert.equal(extractTokenUUID("plain"), "plain")
  })

  it("a freshly minted 2-part token (uuid:expiresAt) validates — 无签名流程凭证（2026-09-06 设计 B）", async () => {
    // 设计 B: token 无 HMAC——2 段格式 + TTL fail-closed（签名路径已删）
    const { randomUUID } = await import("node:crypto")
    const uuid = randomUUID()
    const expiresAt = Date.now() + 3600000
    assert.equal(validateDesignToken(`${uuid}:${expiresAt}`), true)
  })

  it("a legacy 3-part signed token (uuid:expiresAt:HMAC — TTL 内) is a FORMAT error — 存量 token 一次性失效（2026-09-06 设计 B, 评审 🟡5）", async () => {
    const { randomUUID } = await import("node:crypto")
    const uuid = randomUUID()
    const expiresAt = Date.now() + 3600000 // TTL 内——格式错而不因过期拒绝
    const legacy = `${uuid}:${expiresAt}:aabbccdd00112233`
    assert.equal(validateDesignToken(legacy), false, "3 段（旧签名格式）→ 格式错拒绝（不因 TTL 内而放行）")
  })

  it("an expired token is rejected (TTL fail-closed 保留)", () => {
    const uuid = "11111111-2222-3333-4444-555555555555"
    const expiresAt = Date.now() - 1000 // already expired
    assert.equal(validateDesignToken(`${uuid}:${expiresAt}`), false)
  })

  it("the advisor-echo regex matches the FULL token (uuid:expiresAt), not just the uuid", async () => {
    // Regression 2026-08-14: the regex was built from the uuid segment only, but the
    // advisor echoes the full token — approval never registered and the
    // eng-coder gate rejected valid tokens. (2026-09-06 设计 B: token = 2 段无签名段)
    const { randomUUID } = await import("node:crypto")
    const uuid = randomUUID()
    const expiresAt = Date.now() + 3600000
    const token = `${uuid}:${expiresAt}`
    const echoed = `Review complete. No critical issues.\n\n[DESIGN-TOKEN:${token}]`
    const escaped = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const re = new RegExp(`(?:^|\\s|\`|\\*)\\[DESIGN-TOKEN:\\s*${escaped}\\s*\\](?:\\s|$|\`|\\*)`, "ms")
    assert.equal(re.test(echoed), true, "full token echo matches")
    // and the uuid-only variant must NOT match (that's the bug shape)
    const escUuid = uuid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const reUuid = new RegExp(`(?:^|\\s|\`|\\*)\\[DESIGN-TOKEN:\\s*${escUuid}\\s*\\](?:\\s|$|\`|\\*)`, "ms")
    assert.equal(reUuid.test(echoed), false, "uuid-only echo must not match (the old bug)")
  })
})

// ─── resolveAdvisorProvider ─────────────────────────────────────

describe("resolveAdvisorProvider", () => {
  beforeEach(() => { if (existsSync(cfgPath)) rmSync(cfgPath) })

  it("falls back to the main agent provider when advisor has no provider", () => {
    const agent = {
      config: { advisor: {} },
      _provider: { baseURL: "https://api.test/v1", model: "test-model", apiKey: "sk" },
    }
    const p = resolveAdvisorProvider(agent)
    assert.equal(p.model, "test-model")
    assert.equal(p.baseURL, "https://api.test/v1")
  })

  it("advisor.model overrides the main model", () => {
    const agent = {
      config: { advisor: { model: "advisor-model" } },
      _provider: { baseURL: "https://api.test/v1", model: "test-model", apiKey: "sk" },
    }
    const p = resolveAdvisorProvider(agent)
    assert.equal(p.model, "advisor-model")
  })

  it("advisor.thinking=null explicitly disables thinking", () => {
    const agent = {
      config: { advisor: { thinking: null } },
      _provider: { baseURL: "https://api.test/v1", model: "test-model", apiKey: "sk", thinking: { type: "enabled" } },
    }
    const p = resolveAdvisorProvider(agent)
    assert.equal(p.thinking, undefined)
  })

  it("resolves a named advisor provider from shared config", () => {
    writeFileSync(cfgPath, JSON.stringify({
      providers: [{ name: "reviewer", baseURL: "https://review.test/v1", model: "review-model", apiKey: "rk" }],
      activeProvider: "deepseek",
    }))
    const agent = {
      config: { advisor: { provider: "reviewer" } },
      _provider: { baseURL: "https://api.test/v1", model: "test-model", apiKey: "sk" },
    }
    const p = resolveAdvisorProvider(agent)
    assert.equal(p.baseURL, "https://review.test/v1")
    assert.equal(p.model, "review-model")
  })

  it("falls back to main provider when named provider missing", () => {
    writeFileSync(cfgPath, JSON.stringify({
      providers: [{ name: "only", baseURL: "https://api.test/v1", model: "m", apiKey: "k" }],
      activeProvider: "only",
    }))
    const agent = {
      config: { advisor: { provider: "nonexistent" } },
      _provider: { baseURL: "https://main.test/v1", model: "main-model", apiKey: "mk" },
    }
    const p = resolveAdvisorProvider(agent)
    assert.equal(p.baseURL, "https://main.test/v1")
  })
})

// ─── runAdvisorReview — always available (2026-08-21) ────────────

describe("runAdvisorReview", () => {
  it("runs with NO advisor config — the former enabled gate is gone", async () => {
    const { runAdvisorReview } = await import("../src/advisor/run.mjs")
    const agent = {
      config: { agent: {} }, // no advisor key at all — the old gate would refuse "not enabled"
      _provider: { name: "p", model: "m" },
      history: [{ role: "user", content: "update the readme" }],
      _touchedFiles: [],
      _advisorRound: 0,
      cwd: tmpDir,
    }
    // Pre-aborted signal: the tool loop returns "interrupted" immediately —
    // no network call. Reaching the loop at all proves the gate is removed.
    const result = await runAdvisorReview(agent, "code", { signal: { aborted: true } })
    assert.ok(!result.includes("not enabled"), `enabled gate removed, got: ${result}`)
    assert.ok(result.startsWith("Advisor:"), "explicit outcome, not a silent pass")
  })

  it("legacy enabled:true config does not gate the review either", async () => {
    const { runAdvisorReview } = await import("../src/advisor/run.mjs")
    const agent = {
      config: { advisor: { enabled: true } }, // deprecated field — must be ignored
      _provider: { name: "p", model: "m" },
      history: [{ role: "user", content: "update the readme" }],
      _touchedFiles: [],
      _advisorRound: 0,
      cwd: tmpDir,
    }
    const result = await runAdvisorReview(agent, "code", { signal: { aborted: true } })
    assert.ok(!result.includes("not enabled"), `deprecated enabled must not be read, got: ${result}`)
  })
})

// ─── prepareAdvisorMessages ─────────────────────────────────────

describe("prepareAdvisorMessages", () => {
  it("design review always returns a fresh two-message session", () => {
    const agent = { history: [], cwd: tmpDir, _advisorRound: 3, _advisorSession: null }
    const msgs = prepareAdvisorMessages(agent, "design", "tok", ["docs/design.md"], null)
    assert.equal(msgs.length, 2)
    assert.equal(msgs[0].role, "system")
    assert.equal(msgs[1].role, "user")
    assert(msgs[1].content.includes("docs/design.md"))
    assert(msgs[1].content.includes("tok")) // design token injected
  })

  it("code review with no prior table starts fresh round-1", () => {
    const agent = { history: [], cwd: tmpDir, _advisorRound: 0, _advisorSession: null, _touchedFiles: [] }
    const msgs = prepareAdvisorMessages(agent, "code", null, null, ["src/x.mjs"])
    assert.equal(msgs.length, 2)
    assert(msgs[1].content.includes("src/x.mjs"))
  })

  it("buildAdvisorUserMessage includes review scope paths", () => {
    const agent = { history: [], cwd: tmpDir, _advisorRound: 0 }
    const msg = buildAdvisorUserMessage(agent, null, "code", null, null, ["src/a.mjs", "src/b.mjs"])
    assert(msg.includes("src/a.mjs"))
    assert(msg.includes("src/b.mjs"))
  })

  it("design review with documents scopes to docs only", () => {
    const agent = { history: [], cwd: tmpDir, _advisorRound: 0, config: { agent: {} } }
    const msg = buildAdvisorUserMessage(agent, null, "design", null, ["docs/d.md"], null)
    assert(msg.includes("docs/d.md"))
    assert(msg.includes("Review ONLY these files"))
  })
})

// ─── isDocFile ──────────────────────────────────────────────────

describe("isDocFile", () => {
  it("recognizes markdown and doc files", () => {
    assert.equal(isDocFile("docs/design.md"), true)
    assert.equal(isDocFile("README.md"), true)
    assert.equal(isDocFile("LICENSE"), true)
    assert.equal(isDocFile("notes.txt"), true)
  })

  it("rejects source files", () => {
    assert.equal(isDocFile("src/main.mjs"), false)
    // isDocFile matches by extension only — src/prompts/*.md IS a doc file by
    // extension; the src/ exclusion is the CALLER's job (isDocOnlyChange adds it).
    assert.equal(isDocFile("src/prompts/system.md"), true)
    assert.equal(isDocFile("package.json"), false)
  })
})


// ────────────────────────────────────────
// CLI parity additions (2026-08-06): escapeLiteralEscapes, citations, fresh-session
// ────────────────────────────────────────

describe("escapeLiteralEscapes (CLI parity — hex-escape 400 defense)", () => {
  const cases = [
    ["\\x（单反斜杠）", "\\\\x（单反斜杠）"], // \x + non-hex → doubled
    ["末尾\\x", "末尾\\\\x"], // \x at end → doubled
    ["\\x1b[31m", "\\x1b[31m"], // \x + 2 hex → untouched
    ["\\x1b3", "\\x1b3"], // \x + 3+ hex → \x1b valid + literal 3 → untouched
    ["\\x1后跟", "\\\\x1后跟"], // \x + 1 hex (truncated) → doubled
    ["\\u12中文", "\\\\u12中文"], // \u + <4 hex → doubled
    ["\\uFFFF", "\\uFFFF"], // \u + 4 hex → untouched
    ["\\uFFFF1", "\\uFFFF1"], // \u + 5 hex → untouched
    ["\\n字面", "\\n字面"], // non-hex escapes untouched
    ["\\\\x", "\\\\x"], // already-doubled backslash untouched
    [null, ""], // null → coerced
    [undefined, ""], // undefined → coerced
  ]
  it("doubles invalid literal \\x/\\u, passes valid ones through", () => {
    for (const [input, expected] of cases) {
      assert.equal(escapeLiteralEscapes(input), expected, JSON.stringify(input))
    }
  })
})

describe("citations (CLI parity — host-verified evidence)", () => {
  it("extractCitations pulls file:line: content references", () => {
    const out = extractCitations("see run.mjs:12: import { chat }")
    assert.equal(out.length, 1)
    assert.equal(out[0].file, "run.mjs")
    assert.equal(out[0].line, 12)
  })
  it("verifyCitations matches real file content, flags stale/missing citations", () => {
    const res = verifyCitations("run.mjs:2: * advisor/run.mjs — advisor execution", "src/advisor")
    assert.equal(res.total, 1)
    assert.equal(res.matched.length, 1, "real line content matches")
    const stale = verifyCitations("run.mjs:99999: this line does not exist anywhere in the file", "src/advisor")
    assert.equal(stale.total, 1)
    assert.equal(stale.matched.length, 0)
    assert.equal(stale.failed.length, 1, "stale line flagged")
  })
  it("verifyCitations rejects path traversal (never reads outside cwd)", () => {
    const res = verifyCitations("../../package.json:1: some content that is long enough", "src/advisor")
    assert.equal(res.total, 1)
    assert.equal(res.failed.length, 1)
    assert.equal(res.failed[0].reason, "path traversal")
  })
  it("appendCitationReport appends N/M report only when citations exist", () => {
    const withReport = appendCitationReport("x\nrun.mjs:2: * advisor/run.mjs — advisor execution", "src/advisor")
    assert.ok(withReport.includes("[host-verified]"), "report appended")
    const plain = appendCitationReport("no citations here", "src/advisor")
    assert.equal(plain, "no citations here", "no citations → unchanged")
  })
})

describe("prepareAdvisorMessages: fresh session every round (CLI parity — d698434)", () => {
  it("ignores a stale _advisorSession — every call builds fresh [system, user]", () => {
    const agent = {
      history: [{ role: "tool", content: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.mjs | 🔴 | bug | x |" }],
      _advisorRound: 1,
      _lastAdvisorOutput: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.mjs | 🔴 | bug | x |",
      _mutatedThisRun: true,
      _advisorSession: [{ role: "system", content: "STALE_SESSION_MARKER" }, { role: "user", content: "STALE_SESSION_MARKER" }], // legacy field — must NOT be reused
      config: { agent: {}, advisor: {} },
      cwd: process.cwd(),
    }
    const messages = prepareAdvisorMessages(agent, "code", null, null, ["src/a.mjs"])
    assert.equal(messages.length, 2, "fresh two-message session")
    assert.ok(!JSON.stringify(messages).includes("STALE_SESSION_MARKER"), "stale session content never surfaces")
    // Convergence follow-up messages START with "## Round N" — bracket reminders
    // only appear mid-content (server-side '['-probing concerns only the LEADING char).
    assert.ok(!messages[1].content.startsWith("["), "message does not START with a bracket")
  })
  it("no-prior round-1 user message starts with a PLAIN 'System reminder:' (not '[')", () => {
    const agent = {
      history: [],
      _advisorRound: 0,
      _mutatedThisRun: false,
      config: { agent: {}, advisor: {} },
      cwd: process.cwd(),
    }
    const messages = prepareAdvisorMessages(agent, "code", null, null, ["src/a.mjs"])
    assert.ok(messages[1].content.startsWith("System reminder:"), messages[1].content.slice(0, 60))
  })
})


describe("_renderTimeline (CLI parity — review process at its real positions)", () => {
  it("interleaves thinking/tool/final in emission order", async () => {
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
    const withPlaceholder = _renderTimeline([{ kind: "think", text: "a\n[thinking…]\nb" }])
    assert.ok(!withPlaceholder.includes("[thinking…]"), "placeholder stripped")
  })
})

// ─── advisor review timeout (AGENT-PARAMS-TUNING 2026-08-24): agent.advisor.timeoutMs ───

/** Mock LLM server that always demands a read tool call (loop); beforeRespond runs
 *  before each response — used to advance the mocked clock past the review timeout
 *  between rounds (deterministic, no real waiting). */
function toolLoopServer(beforeRespond) {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    req.on("data", () => {}) // drain the request body — a response racing an unread body stalls the connection
    req.on("end", () => {
      calls.n++
      beforeRespond?.(calls.n)
      const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "x" }) } }] } }] }
      res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
    })
  })
  return { server, calls }
}

async function runToolLoop(advisorCfg, beforeRespond) {
  const { server, calls } = toolLoopServer(beforeRespond)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const { _runAdvisorToolLoop } = await import("../src/advisor/run.mjs")
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "sk-test", model: "deepseek-v4-pro" }
    const agent = { config: { advisor: advisorCfg } }
    const result = await _runAdvisorToolLoop(provider, [{ role: "user", content: "review" }], null, null, agent, tmpDir)
    return { result, calls }
  } finally {
    server.close()
  }
}

describe("advisor review timeout (AGENT-PARAMS-TUNING)", () => {
  it("configured agent.advisor.timeoutMs truncates the review (~100ms) — AC1", async (t) => {
    t.mock.timers.enable({ apis: ["Date"] })
    try {
      const { result, calls } = await runToolLoop({ timeoutMs: 100 }, () => t.mock.timers.tick(150))
      assert.match(result, /review timeout after/, "timeout message names the truncation")
      assert.equal(calls.n, 1, "truncated after the first tool round — no second LLM call")
    } finally {
      t.mock.timers.reset()
    }
  })

  it("no timeoutMs config falls back to the 600s default — AC2", async (t) => {
    t.mock.timers.enable({ apis: ["Date"] })
    try {
      const { result } = await runToolLoop(undefined, () => t.mock.timers.tick(600_001))
      assert.match(result, /review timeout after 600s/, "default message shows 600s")
    } finally {
      t.mock.timers.reset()
    }
  })

  it("invalid timeoutMs values (0 / -100 / 'abc') fall back to the default — AC9", async (t) => {
    t.mock.timers.enable({ apis: ["Date"] })
    try {
      for (const bad of [0, -100, "abc"]) {
        const { result, calls } = await runToolLoop({ timeoutMs: bad }, () => t.mock.timers.tick(600_001))
        assert.equal(calls.n, 1, `first round ran — no immediate timeout for ${JSON.stringify(bad)}`)
        assert.match(result, /review timeout after 600s/, `default timeout still enforced for ${JSON.stringify(bad)}`)
      }
    } finally {
      t.mock.timers.reset()
    }
  })
})

// ─── B1 工具执行批并行（AGENT-LOOP.md §18.7 D-TS7 — T-TS8/T-TS9） ───

describe("B1: 工具执行批并行（T-TS8/T-TS9）", () => {
  const delay = (ms) => new Promise((r) => setTimeout(r, ms))

  /** Mock LLM server: first request → the tool_calls frame; second → final review text. */
  function b1Server(toolCallFrame, finalText = "review done") {
    const server = createServer((req, res) => {
      req.on("data", () => {}) // drain the request body
      req.on("end", () => {
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        if (toolCallFrame) {
          const frame = JSON.stringify({ choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: toolCallFrame } }] })
          res.end(`data: ${frame}\n\ndata: [DONE]\n\n`)
          toolCallFrame = null
        } else {
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: finalText } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            "data: [DONE]\n\n",
          )
        }
      })
    })
    return server
  }

  /** Mock read-only tool: records start/end into `events` (parallel witness). */
  function mockTool(name, events, { delayMs = 0, error = null } = {}) {
    return {
      name,
      description: `mock tool ${name}`,
      parameters: { type: "object", properties: {} },
      execute: async () => {
        events.push(`start:${name}`)
        if (delayMs) await delay(delayMs)
        if (error) throw new Error(error)
        events.push(`end:${name}`)
        return `result:${name}`
      },
    }
  }

  async function runB1(toolSet, toolCallFrame, events) {
    const server = b1Server(toolCallFrame)
    await new Promise((r) => server.listen(0, "127.0.0.1", r))
    const port = server.address().port
    try {
      const { _runAdvisorToolLoop, _setAdvisorToolSetForTest } = await import("../src/advisor/run.mjs")
      _setAdvisorToolSetForTest(toolSet)
      try {
        const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }
        const messages = [{ role: "user", content: "review" }]
        const result = await _runAdvisorToolLoop(provider, messages, null, null, { config: {} }, tmpDir)
        return { result, messages, events }
      } finally {
        _setAdvisorToolSetForTest(null)
      }
    } finally {
      server.close()
    }
  }

  it("T-TS8: 同批两慢工具并行执行——两工具都在任一完成前启动（start 顺序并行确定性断言；墙钟免疫）", async () => {
    const events = []
    const toolSet = [mockTool("slowA", events, { delayMs: 100 }), mockTool("slowB", events, { delayMs: 100 })]
    const frame = [
      { index: 0, id: "c1", type: "function", function: { name: "slowA", arguments: "{}" } },
      { index: 1, id: "c2", type: "function", function: { name: "slowB", arguments: "{}" } },
    ]
    const { result, messages, events: ev } = await runB1(toolSet, frame, events)
    assert.ok(result.includes("review done"), "循环正常终态")
    // onTool 进度行按 toolCalls 顺序发射（显示顺序无关紧要——仍按 toolCalls 顺序）
    assert.ok(result.indexOf("→ slowA") < result.indexOf("→ slowB"), "onTool 进度行按 toolCalls 顺序")
    // 并行确定性断言：两工具都在任一完成前启动——串行实现（for...of await）下
    // start:slowB 必然位于 end:slowA 之后（先完成 A 再启动 B）；并行实现下两个
    // start 都在任一 end 之前。不依赖墙钟（CI 抖动免疫）。
    assert.ok(ev.includes("start:slowA") && ev.includes("start:slowB"), "两工具均已启动")
    assert.ok(ev.indexOf("start:slowB") < ev.indexOf("end:slowA"), "工具B在工具A完成前已启动（并行）")
    assert.ok(ev.indexOf("start:slowA") < ev.indexOf("end:slowB"), "工具A在工具B完成前已启动（并行）")
    // Promise.all 核验：结果按 toolCalls 顺序回填——tool_call_id 不错配
    const toolMsgs = messages.filter((m) => m.role === "tool")
    assert.equal(toolMsgs.length, 2, "两条工具结果均回填")
    assert.equal(toolMsgs[0].tool_call_id, "c1", "保序：第一结果对应第一个 tool_call")
    assert.equal(toolMsgs[0].content, "result:slowA")
    assert.equal(toolMsgs[1].tool_call_id, "c2", "保序：第二结果对应第二个 tool_call")
    assert.equal(toolMsgs[1].content, "result:slowB")
  })

  it("T-TS9: 一工具抛错（ENOENT）另一成功——错误独立捕获、两结果均回填、顺序保序、无未处理拒绝", async () => {
    const events = []
    const toolSet = [
      mockTool("boom", events, { error: "ENOENT: no such file" }),
      mockTool("okTool", events, { delayMs: 100 }),
    ]
    const frame = [
      { index: 0, id: "c1", type: "function", function: { name: "boom", arguments: "{}" } },
      { index: 1, id: "c2", type: "function", function: { name: "okTool", arguments: "{}" } },
    ]
    const { result, messages, events: ev } = await runB1(toolSet, frame, events)
    assert.ok(result.includes("review done"), "抛错工具不中断整条循环（无未处理拒绝——测试进程正常完成）")
    assert.equal(ev[0], "start:boom", "抛错工具已启动")
    // 错误独立捕获：boom 的 ENOENT 不阻止 okTool 启动/完成
    assert.ok(ev.includes("start:okTool") && ev.includes("end:okTool"), "成功工具完整执行")
    const toolMsgs = messages.filter((m) => m.role === "tool")
    assert.equal(toolMsgs.length, 2, "两结果均回填（错误工具也回填 error 结果）")
    assert.equal(toolMsgs[0].tool_call_id, "c1")
    assert.equal(toolMsgs[0].content, "Error (file_not_found): ENOENT: no such file", "ENOENT → file_not_found 类型化错误（既有语义保留）")
    assert.equal(toolMsgs[1].tool_call_id, "c2")
    assert.equal(toolMsgs[1].content, "result:okTool", "成功工具结果正常回填")
  })
})

// ─── 文档归属纪律 + advisor 设计评审增强（2026-08-21，规格见 CLI AGENT-LOOP.md §12） ───

const VSCODE_SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src")
const VSCODE_PROMPTS_DIR = join(VSCODE_SRC_DIR, "prompts")

describe("document ownership + design-review enhancement (2026-08-21)", () => {
  it("advisor-design.md: Document ownership 维度 + 🔴/🟡 分级 + 引用纪律 + Approval Signal 保留", () => {
    const text = readFileSync(join(VSCODE_PROMPTS_DIR, "advisor-design.md"), "utf8")
    assert.ok(text.includes("Document ownership"), "第 7 维 Document ownership 存在")
    assert.match(text, /CONTRADICTS[^\n]*🔴/, "与现有文档矛盾 → 🔴 分级句")
    assert.match(text, /duplicating[^\n]*🟡/, "该并入却新建/重复描述 → 🟡 分级句")
    assert.ok(text.includes("file:line"), "引用纪律：精确 file:line 格式")
    assert.ok(text.includes("unverified"), "引用纪律：未核实内容标注 unverified")
    assert.ok(text.includes("## Approval Signal"), "Approval Signal 段保留")
    assert.ok(text.includes("[DESIGN-TOKEN:...]"), "DESIGN-TOKEN 回显规则保留（防 fallback 删除后丢失）")
  })

  it("system.md: 文档归属纪律条款（doc map / update instead of creating）", () => {
    const text = readFileSync(join(VSCODE_PROMPTS_DIR, "system.md"), "utf8")
    assert.ok(text.includes("Document ownership"), "条款存在")
    assert.ok(text.includes("docs/design/README.md"), "doc map 定位句")
    assert.match(text, /update it; never create a new file/, "找到就改、不得新建（update instead of creating）")
    assert.match(text, /exactly ONE place/, "单一权威源语义")
  })

  it("docs/design/README.md: 文档地图存在且含板块映射表 + Settings 收口后指向 SETTINGS.md 权威源（2026-08-25）", () => {
    const text = readFileSync(join(VSCODE_SRC_DIR, "..", "docs", "design", "README.md"), "utf8")
    assert.ok(text.includes("板块 → 文档映射"), "映射表存在")
    assert.match(text, /\| 架构 \|/, "架构板块行")
    assert.match(text, /\| 配置面板（Settings） \|/, "Settings 板块行")
    assert.match(text, /\`SETTINGS\.md\`/, "Settings 指向现行权威源 SETTINGS.md")
    assert.ok(text.includes("2026-08-25 合并"), "合并收口说明登记")
  })

  it("advisor/main.mjs: design 提示词硬加载——无 ADVISOR_DESIGN_FALLBACK 残留，内容与文件逐字节一致", () => {
    const src = readFileSync(join(VSCODE_SRC_DIR, "advisor", "main.mjs"), "utf8")
    assert.ok(!src.includes("ADVISOR_DESIGN_FALLBACK"), "ADVISOR_DESIGN_FALLBACK 常量已删除")
    assert.ok(src.includes('loadPrompt("advisor-design.md"'), "design 提示词走 loadPrompt 硬加载（缺失即抛错，与 round1/2/3 同待遇）")
    const prompt = buildAdvisorSystemPrompt({ history: [], _advisorRound: 0 }, null, "design")
    const file = readFileSync(join(VSCODE_PROMPTS_DIR, "advisor-design.md"), "utf8")
    assert.equal(prompt, file, "设计审查系统提示词与 advisor-design.md 逐字节一致（无静默降级）")
  })

  it("design 分支 Instructions 补 Methodology compliance 维度", () => {
    const agent = { history: [], _advisorRound: 0, cwd: tmpDir, config: { agent: {} } }
    const msg = buildAdvisorUserMessage(agent, null, "design")
    assert.ok(msg.includes("methodology compliance (does it follow the project's METHODOLOGY.md?)"), "Instructions 第 2 条含 Methodology 维度")
  })

  it("design 分支：存在 docs/design/README.md 时注入 Document Map 段", () => {
    const tmp = mkdtempSync(join(tmpdir(), "advisor-docmap-"))
    try {
      mkdirSync(join(tmp, "docs", "design"), { recursive: true })
      writeFileSync(join(tmp, "docs", "design", "README.md"), "# 文档地图\n\n| 板块 | 文档 |\n| 架构 | ARCHITECTURE.md |\n")
      const agent = { history: [], _advisorRound: 0, cwd: tmp, config: { agent: {} } }
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

  it("design 分支：无 docs/design/README.md 时正常跳过 Document Map 段", () => {
    const tmp = mkdtempSync(join(tmpdir(), "advisor-docmap-"))
    try {
      const agent = { history: [], _advisorRound: 0, cwd: tmp, config: { agent: {} } }
      const msg = buildAdvisorUserMessage(agent, null, "design")
      assert.ok(!msg.includes("## Document Map"), "无地图时不注入")
      assert.ok(msg.includes("## Design Review"), "设计审查消息本体正常")
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })
})

// ─── MAX_RESULT_CHARS ────────────────────────────────────────────

describe("MAX_RESULT_CHARS — advisor 工具结果截断上限（TOOL-OUTPUT-LIMITS-TUNING §2.2 / AC4）", () => {
  it("equals 64 * 1024 = 65536，与主链路落盘阈值对齐", () => {
    assert.equal(MAX_RESULT_CHARS, 64 * 1024)
  })
})


// ─── v2 token hardening (2026-08-25) — vscode parity ───
describe("v2 token hardening (2026-08-25)", () => {
it("validateDesignToken: fail-closed on malformed strings (two legacy backdoors gone)", async () => {
  const { validateDesignToken } = await import("../src/agent-tools/advisor.mjs")
  assert.equal(validateDesignToken("abc:notanumber:x"), false, "NaN expiry rejected (was fail-open)")
  assert.equal(validateDesignToken("a:b:c:d"), false, "4-part rejected")
  assert.equal(validateDesignToken("uuid:abc:sig"), false)
})

it("validateDesignToken: 7d TTL window (AC1/AC2 —— 2026-09-06 设计 B: 2 段无签名构造)", async () => {
  const { validateDesignToken } = await import("../src/agent-tools/advisor.mjs")
  const mk = (expiresAt) => "11111111-2222-3333-4444-555555555555" + ":" + expiresAt
  assert.equal(validateDesignToken(mk(Date.now() + 3 * 24 * 3600 * 1000)), true, "3d in → valid")
  assert.equal(validateDesignToken(mk(Date.now() - 1000)), false, "expired → rejected")
})

it("revoke narrowing: error reply must not revoke a standing token (AC5)", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const agent = { config: { agent: { engineering: true } }, _engDesignToken: "standing", _advisorRound: 0, _advisorSession: null, cwd: process.cwd(), _touchedFiles: [] }
  const out = await advisorTool.execute({ type: "design", documents: ["src/definitely-not-a-doc.mjs"] }, { agent })
  assert.match(out, /must be in docs/)
  assert.equal(agent._engDesignToken, "standing", "error reply must NOT revoke")
})

it("eng(enter) idempotent: already-on keeps the token (AC6)", async () => {
  const { engTool } = await import("../src/agent-tools/eng.mjs")
  const agent = { config: { agent: { engineering: true } }, _engDesignToken: "keepme", _pendingReminders: [] }
  const out = await engTool.execute({ action: "enter" }, { agent })
  assert.match(out, /already active/)
  assert.equal(agent._engDesignToken, "keepme")
})

// ─── designId multi-slot tokens (ENGINEERING-MODE.md 2026-09-01: AC8/T15/T17, CLI parity) ───

/** Mock advisor LLM: pass=true echoes the injected [DESIGN-TOKEN:…] (review passes);
 *  pass=false returns a findings table without any token (COMPLETED review, not passed). */
function mockDesignReviewServer(pass) {
  return import("node:http").then(({ createServer }) => {
    const server = createServer((req, res) => {
      let text = ""
      req.on("data", (c) => (text += c))
      req.on("end", () => {
        const body = JSON.parse(text)
        const m = JSON.stringify(body.messages).match(/([0-9a-f-]{36}:\d{13})/)
        const token = m ? m[1] : "no-token-found"
        const content = pass
          ? `## Review\n\n设计通过，未发现问题。\n\n[DESIGN-TOKEN:${token}]`
          : "## Review\n\n| # | Category | Severity | Issue | Suggestion |\n|---|---------|----------|------|------------|\n| 1 | correctness | 🔴 | spec gap | fix the spec |"
        const frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(frames)
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }))
    })
  })
}

it("designId multi-slot: pass → designId echoed + token stored in _engDesignTokens + single mirror kept (review #1)", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port } = await mockDesignReviewServer(true)
  try {
    const agent = {
      config: { agent: { engineering: true } },
      _provider: { name: "p", model: "m", baseURL: `http://127.0.0.1:${port}`, apiKey: "x" },
      history: [], _touchedFiles: [], _advisorRound: 0, _advisorSession: null, cwd: tmpdir(),
    }
    const out1 = await advisorTool.execute({ type: "design", documents: ["docs/design/A.md"] }, { agent })
    assert.match(out1, /Approved\. Pass this exact token/, "first review passes")
    assert.match(out1, /designId: [0-9a-f-]{36}/, "approved result echoes designId (review #1)")
    const out2 = await advisorTool.execute({ type: "design", documents: ["docs/design/B.md"] }, { agent })
    assert.match(out2, /Approved\. Pass this exact token/, "second review passes")
    const map = agent._engDesignTokens
    assert.ok(map instanceof Map && map.size === 2, "two slots coexist — later issue does not overwrite the earlier one (AC8)")
    const idOf = (out) => out.match(/designId: ([0-9a-f-]{36})/)[1]
    assert.notEqual(map.get(idOf(out1)), map.get(idOf(out2)), "each designId holds its own token")
    assert.equal(agent._engDesignToken, map.get(idOf(out2)), "single-slot mirror = most recently issued token (legacy boolean gates)")
    assert.ok(map.has(idOf(out1)) && map.has(idOf(out2)), "echoed designId ↔ slot one-to-one")
  } finally {
    server.close()
  }
})

it("designId isolation: completed review that does not pass → its designId not stored, every existing slot intact (方案 ②)", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port } = await mockDesignReviewServer(false)
  try {
    const agent = {
      config: { agent: { engineering: true } },
      _provider: { name: "p", model: "m", baseURL: `http://127.0.0.1:${port}`, apiKey: "x" },
      history: [], _touchedFiles: [], _advisorRound: 0, _advisorSession: null, cwd: tmpdir(),
      _engDesignTokens: new Map([["slot-a", "tok-a"], ["slot-b", "tok-b"]]),
      _engDesignToken: "tok-a",
    }
    const out = await advisorTool.execute({ type: "design", documents: ["docs/design/B.md"] }, { agent })
    assert.doesNotMatch(out, /Approved\./, "re-review did not pass (no token echo)")
    assert.equal(agent._engDesignTokens.size, 2, "failure clears NO existing slot (isolation extended to the multi-slot Map)")
    assert.equal(agent._engDesignTokens.get("slot-a"), "tok-a", "slot a untouched (T17)")
    assert.equal(agent._engDesignTokens.get("slot-b"), "tok-b", "slot b untouched (T17)")
    assert.equal(agent._engDesignToken, "tok-a", "single mirror not cleared either — old token survives to TTL (review #2, plan ②)")
  } finally {
    server.close()
  }
})

it("错槽 token 拒绝：designId 槽存在但 token 不匹配 → spawn 门禁拒绝（AC-TO3——2026-09-06 设计 B 新增）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = `aaaaaaaa-1111-4111-8111-00000000000a:${exp}`
  const tokenB = `bbbbbbbb-2222-4222-8222-00000000000b:${exp}`
  const parent = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["id-a", tokenA]]),
    _engDesignToken: tokenA,
    _touchedFiles: [],
  }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "eng-coder", designId: "id-a", designToken: tokenB }, { agent: parent, cwd: process.cwd(), callbacks: {} }),
    /Invalid or missing design token/,
    "错槽 token（槽 id-a 持 tokenA，却传 tokenB）→ 拒绝——槽位匹配不变" ,
  )
})

it("subagent schema declares the optional designId parameter (CLI parity)", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const designId = subagentTool.parameters.properties.designId
  assert.ok(designId, "designId 参数应存在于 subagent 工具 schema")
  assert.equal(designId.type, "string")
  assert.ok(designId.description.includes("Required to pick between designs"), "描述声明多设计必须指定")
})

})

// ─── Review-object declaration（AGENT-LOOP.md §18.8 — T-OA1..5 / AC-OA1..3） ───

/** Mock advisor LLM server: captures the review messages, replies with a
 *  content-only frame (no tool calls → the review ends immediately). */
function capturingReviewServer(captured, content = "Review complete. No critical issues.") {
  return import("node:http").then(({ createServer }) => {
    const server = createServer((req, res) => {
      let text = ""
      req.on("data", (c) => (text += c))
      req.on("end", () => {
        const body = JSON.parse(text)
        captured.messages = body.messages
        const frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(frames)
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }))
    })
  })
}

describe("review-object declaration (§18.8 — T-OA1..5)", () => {
  // ─── 单元：机械构造与注入 ───
  it("T-OA1 unit: buildReviewObjectDeclaration emits the mechanical ANCHOR-4 block (type/target/status/reason/exclude)", () => {
    const block = buildReviewObjectDeclaration({
      type: "design",
      target: "docs/design/AGENT-LOOP.md §18.7",
      status: "pending review",
      reason: "user-initiated",
      exclude: ["§18.5", "§18.6"],
    })
    assert.ok(block.startsWith("## Review-object declaration (mechanical — do not infer)"), "块头")
    assert.ok(block.includes("Review type: design | Target: docs/design/AGENT-LOOP.md §18.7 | Object state: pending review | Trigger: user-initiated"), "type|target|status|reason 行")
    assert.ok(block.includes("Excluded (not in this review): §18.5, §18.6"), "排除清单行（T-OA4：数组连接）")
    assert.ok(block.includes("Follow this declaration — do not infer the review target from the documents."), "收尾句")
  })

  it("T-OA3 unit: 无 object / 非对象 → 内容原样（降级现状不注入），有 object → 声明块先于评审内容", () => {
    const content = "## Design Review\n\nThe documents below are the review scope."
    const out = injectObjectDeclaration(content, { type: "design", target: "T", status: "S", reason: "R", exclude: [] })
    assert.ok(out.startsWith("## Review-object declaration"), "声明块在开头")
    assert.ok(out.indexOf("## Review-object declaration") < out.indexOf("## Design Review"), "声明先于评审内容（顺序：声明 → 评审内容）")
    assert.equal(injectObjectDeclaration(content, null), content, "null → 原样")
    assert.equal(injectObjectDeclaration(content, undefined), content, "undefined → 原样")
    assert.equal(injectObjectDeclaration(content, "garbage"), content, "非对象字符串 → 原样")
    assert.equal(injectObjectDeclaration(content, ["not-an-object"]), content, "数组 → 原样")
  })

  // ─── 集成：advisorTool → runAdvisorReview → 消息注入（真实接线） ───
  async function runToolWithObject(args, agent) {
    const captured = {}
    const { server, port } = await capturingReviewServer(captured)
    try {
      const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
      const out = await advisorTool.execute(args, {
        agent: { ...agent, _provider: { name: "p", model: "m", baseURL: `http://127.0.0.1:${port}`, apiKey: "x" } },
      })
      return { out, captured }
    } finally {
      server.close()
    }
  }

  it("T-OA1/T-OA4/T-OA5 integration: design r1 评审 user 消息含对象声明块（对象/状态/排除），既有评审内容保留在后", async () => {
    const agent = {
      config: { agent: { engineering: true } },
      history: [], _touchedFiles: [], _advisorRound: 0, _advisorSession: null, cwd: tmpDir,
    }
    const object = { type: "design", target: "docs/design/AGENT-LOOP.md §18.7", status: "pending review", reason: "user-initiated", exclude: ["§18.5", "§18.6"] }
    const { captured } = await runToolWithObject({ type: "design", documents: ["docs/design/AGENT-LOOP.md"], object }, agent)
    const user = captured.messages.find((m) => m.role === "user")?.content || ""
    assert.ok(user.startsWith("## Review-object declaration"), "声明块位于 user 消息开头")
    assert.ok(user.includes("Review type: design | Target: docs/design/AGENT-LOOP.md §18.7 | Object state: pending review | Trigger: user-initiated"), "评审对象/状态/原因注入（T-OA1）")
    assert.ok(user.includes("Excluded (not in this review): §18.5, §18.6"), "排除清单注入（T-OA4）")
    // T-OA5：对象声明后仍接既有评审内容——不破坏
    assert.ok(user.includes("## Design Review"), "设计评审内容仍在")
    assert.ok(user.includes("docs/design/AGENT-LOOP.md — Read this file in full"), "documents 清单仍在")
    assert.ok(user.indexOf("## Review-object declaration") < user.indexOf("## Design Review"), "声明先于评审内容")
  })

  it("T-OA2: round 2+ 复评同样注入对象声明（每轮锚定——防复评又考古）", async () => {
    const agent = {
      config: { agent: {} },
      history: [],
      _touchedFiles: [],
      _advisorRound: 1,
      _lastAdvisorOutput: "| # | File | Severity | Issue | Suggestion |\n| 1 | a.mjs | 🔴 | bug | fix |",
      _mutatedThisRun: true,
      _advisorSession: null,
      cwd: tmpDir,
    }
    const object = { type: "code", target: "src/a.mjs", status: "implemented", reason: "delivery verification", exclude: [] }
    const { captured } = await runToolWithObject({ type: "code", paths: ["src/a.mjs"], object }, agent)
    const user = captured.messages.find((m) => m.role === "user")?.content || ""
    assert.ok(user.startsWith("## Review-object declaration"), "round2+ 声明块仍在开头")
    assert.ok(user.includes("Review type: code | Target: src/a.mjs | Object state: implemented | Trigger: delivery verification"), "round2+ 对象数据注入")
    assert.ok(user.includes("## Round 2"), "round 2 收敛内容保留在其后")
    assert.ok(user.indexOf("## Review-object declaration") < user.indexOf("## Round 2"), "声明先于收敛内容")
  })

  it("T-OA3: 无 object 参数 → 不注入声明块、不崩溃（旧调用兼容）", async () => {
    const agent = {
      config: { agent: { engineering: true } },
      history: [], _touchedFiles: [], _advisorRound: 0, _advisorSession: null, cwd: tmpDir,
    }
    const { captured, out } = await runToolWithObject({ type: "design", documents: ["docs/design/AGENT-LOOP.md"] }, agent)
    const user = captured.messages.find((m) => m.role === "user")?.content || ""
    assert.ok(!user.includes("## Review-object declaration"), "无 object → 无声明块")
    assert.ok(user.startsWith("## Design Review"), "既有 message 形态不变（降级现状）")
    assert.ok(out.includes("Review complete"), "评审流程不受影响")
  })

  it("object schema: advisor 工具 schema 声明 object 参数（N-OA1 — 调用参数传入）", async () => {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const object = advisorTool.parameters.properties.object
    assert.ok(object, "object 参数存在于 advisor 工具 schema")
    assert.equal(object.type, "object")
    assert.ok(object.properties?.target, "含 target 子字段")
    assert.ok(object.properties?.exclude, "含 exclude 子字段")
    assert.ok(object.properties?.type?.enum?.includes("design"), "type 子字段带 code/design 枚举")
  })
})

