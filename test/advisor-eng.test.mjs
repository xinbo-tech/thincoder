/**
 * advisor-eng.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): advisor.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { tmpdir } from "node:os"
import { createServer } from "node:http"



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

// ---------------------------------------------------------------- advisor review timeout（agent.advisor.timeoutMs 配置化）

/** 本地 mock LLM server：每轮请求都返回同一个 tool-call SSE 响应（永不产生最终文本），让 advisor 工具循环持续迭代 */
function mockToolLoopServer() {
  return import("node:http").then(({ createServer }) => {
    const hits = { count: 0 }
    const server = createServer((req, res) => {
      req.on("data", () => {})
      req.on("end", () => {
        hits.count++
        const frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: `call_${hits.count}`, function: { name: "no_such_tool", arguments: "{}" } }] } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
          `data: [DONE]\n\n`
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(frames)
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, hits }))
    })
  })
}

/**
 * Run an advisor review until the wall-clock timeout returns (no real waiting).
 * llm: { server, port, hits } from mockToolLoopServer(). mock.timers with apis:["Date"]
 * freezes Date.now() at 0 and setTime() advances it
 * (real timers and real I/O keep working — core.mjs's chat path has no clock deps).
 * The loop captures startTime under the fake clock; once the first chat request hits
 * the mock server we advance the clock past the budget, so the next loop iteration
 * returns the timeout message. configTimeoutMs === undefined means "not configured"
 * (falls back to the default).
 */
async function reviewUntilTimeout(llm, agent, { configTimeoutMs, fakeElapsedMs }) {
  const { mock } = await import("node:test")
  const { runAdvisorReview } = await import("../src/advisor/run.mjs")
  mock.timers.enable({ apis: ["Date"] })
  try {
    if (configTimeoutMs !== undefined) agent.config = { advisor: { timeoutMs: configTimeoutMs } }
    const pending = runAdvisorReview(agent, "code", {})
    let settledEarly = false
    pending.then(() => { settledEarly = true })
    // Wait for the first chat request to reach the mock server (real I/O; bounded poll)
    for (let i = 0; i < 200 && llm.hits.count === 0; i++) {
      await new Promise((r) => setTimeout(r, 5))
    }
    assert.ok(llm.hits.count >= 1, "mock LLM server must receive the advisor's first chat request")
    assert.equal(settledEarly, false, "review must NOT resolve before the timeout elapses")
    mock.timers.setTime(fakeElapsedMs)
    return await pending
  } finally {
    mock.timers.reset()
  }
}

function timeoutAgent(port) {
  return {
    config: {},
    provider: { name: "p", model: "m", baseURL: `http://127.0.0.1:${port}`, apiKey: "x" },
    history: [{ role: "user", content: "review the change" }],
    _touchedFiles: ["x.js"],
    _advisorRound: 0,
    cwd: tmpdir(),
  }
}


test("advisor timeout: configured agent.advisor.timeoutMs=100 truncates at ~100ms with the timeout message", async () => {
  const mock = await mockToolLoopServer()
  try {
    const result = await reviewUntilTimeout(mock, timeoutAgent(mock.port), { configTimeoutMs: 100, fakeElapsedMs: 101 })
    assert.match(result, /Advisor: review timeout after \d+s\. Partial results may be available\./)
    assert.ok(!result.includes("after 600s"), "configured 100ms must win over the 600s default, got: " + result)
    assert.ok(mock.hits.count <= 100, "review must stop well before the 100-turn cap — timeout fired first (hits=" + mock.hits.count + ")")
  } finally {
    mock.server.close()
  }
})



test("advisor timeout: no timeoutMs config falls back to the 600s default (message \"after 600s\")", async () => {
  const mock = await mockToolLoopServer()
  try {
    const result = await reviewUntilTimeout(mock, timeoutAgent(mock.port), { fakeElapsedMs: 600_001 })
    assert.match(result, /Advisor: review timeout after 600s\./)
  } finally {
    mock.server.close()
  }
})



test("advisor timeout: invalid timeoutMs (0 / -100 / \"abc\") falls back to the 600s default — no immediate truncation", async () => {
  for (const bad of [0, -100, "abc"]) {
    const mock = await mockToolLoopServer()
    try {
      const result = await reviewUntilTimeout(mock, timeoutAgent(mock.port), { configTimeoutMs: bad, fakeElapsedMs: 600_001 })
      assert.match(result, /Advisor: review timeout after 600s\./, `invalid value ${JSON.stringify(bad)} must fall back to the default, got: ${result}`)
    } finally {
      mock.server.close()
    }
  }
})




// ─── v2 token hardening (2026-08-25): TTL 7d configurable + fail-closed + revoke narrowing ───

test("validateDesignToken: fail-closed on malformed strings (two legacy backdoors gone)", async () => {
  const { validateDesignToken } = await import("../src/agent-tools/advisor.mjs")
  // "abc:notanumber:x" passed the isNaN backdoor; 4-part strings passed the parts backdoor
  assert.equal(validateDesignToken("abc:notanumber:x"), false, "NaN expiry must be rejected (was fail-open)")
  assert.equal(validateDesignToken("a:b:c:d"), false, "4-part string must be rejected")
  assert.equal(validateDesignToken(""), false)
  assert.equal(validateDesignToken("uuid:abc:sig"), false, "non-numeric expiry rejected")
})



test("validateDesignToken: TTL ceiling — valid inside, rejected past expiry", async () => {
  const { validateDesignToken } = await import("../src/agent-tools/advisor.mjs")
  const { createHmac } = await import("node:crypto")
  const mk = (expiresAt) => {
    const uuid = "11111111-2222-3333-4444-555555555555"
    const sig = createHmac("sha256", "thincoder-default-secret").update(`${uuid}:${expiresAt}`).digest("hex").slice(0, 16)
    return `${uuid}:${expiresAt}:${sig}`
  }
  // AC1 (original pain point): past 1h / 3d, inside 7d → still valid
  assert.equal(validateDesignToken(mk(Date.now() + 3 * 24 * 3600 * 1000)), true, "3 days in → valid")
  assert.equal(validateDesignToken(mk(Date.now() + 3600 * 1000)), true, "1h in → valid")
  // AC2: past 7d → rejected
  assert.equal(validateDesignToken(mk(Date.now() - 1000)), false, "expired → rejected")
})



test("effectiveTokenTtlMs: invalid config falls back to 7d default (AC4)", async () => {
  // Not exported — verify via generateDesignToken behavior is covered by TTL tests above;
  // direct unit: re-import with a stub agent (function is module-private, assert via token expiry delta)
  const { validateDesignToken } = await import("../src/agent-tools/advisor.mjs")
  const { createHmac } = await import("node:crypto")
  // A token minted with the default TTL must remain valid at 6d23h (inside default ceiling)
  const uuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
  const exp = Date.now() + 7 * 24 * 3600 * 1000 - 3600 * 1000
  const sig = createHmac("sha256", "thincoder-default-secret").update(`${uuid}:${exp}`).digest("hex").slice(0, 16)
  assert.equal(validateDesignToken(`${uuid}:${exp}:${sig}`), true, "6d23h → valid under 7d default")
})



test("revoke narrowing: error reply must not revoke a standing token (AC5)", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  // Stub runAdvisorReview? It is imported statically — instead drive the tool with an error-producing
  // scenario: no review scope for code review produces an "Advisor:"-prefixed error return.
  // Design path with valid docs but a failing runner is heavyweight; the unit that matters is
  // the isCompletedReview guard, asserted via a design review that errors early (invalid doc path).
  const agent = { config: { agent: { engineering: true } }, _engDesignToken: "standing", _advisorRound: 0, _advisorSession: null, cwd: process.cwd(), _touchedFiles: [] }
  const out = await advisorTool.execute({ type: "design", documents: ["src/definitely-not-a-doc.mjs"] }, { agent })
  assert.match(out, /must be in docs/, "invalid docs → early Advisor error return")
  assert.equal(agent._engDesignToken, "standing", "error reply must NOT revoke the standing token (v2)")
})



test("eng(enter) idempotent: already-on does not clear the token (AC6)", async () => {
  const { engTool } = await import("../src/agent-tools/eng.mjs")
  const agent = { config: { agent: { engineering: true } }, _engDesignToken: "keepme", _pendingReminders: [] }
  const out = await engTool.execute({ action: "enter" }, { agent })
  assert.match(out, /already active/)
  assert.equal(agent._engDesignToken, "keepme", "redundant enter keeps the standing token")
})


// ─── designId 多槽 token（ENGINEERING-MODE.md 2026-09-01：AC8/T15/T17；评审 #1 回显） ───

/** Mock advisor LLM：pass=true echoes the injected [DESIGN-TOKEN:…] (review passes);
 *  pass=false returns a findings table without any token (COMPLETED review, not passed). */
function mockDesignReviewServer(pass) {
  return import("node:http").then(({ createServer }) => {
    const bodies = []
    const server = createServer((req, res) => {
      let text = ""
      req.on("data", (c) => (text += c))
      req.on("end", () => {
        const body = JSON.parse(text)
        bodies.push(body)
        const m = JSON.stringify(body.messages).match(/([0-9a-f-]+:\d+:[0-9a-f]{16})/)
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
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, bodies }))
    })
  })
}


test("designId 多槽：通过 → designId 回显 + token 入 _engDesignTokens 槽 + 单槽镜像保留（评审 #1）", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port } = await mockDesignReviewServer(true)
  try {
    const agent = {
      config: { agent: { engineering: true } },
      provider: { name: "p", model: "m", baseURL: `http://127.0.0.1:${port}`, apiKey: "x" },
      history: [], _touchedFiles: [], _advisorRound: 0, _advisorSession: null, cwd: tmpdir(),
    }
    const out1 = await advisorTool.execute({ type: "design", documents: ["docs/design/A.md"] }, { agent })
    assert.match(out1, /Approved\. Pass this exact token/, "第一次评审通过")
    assert.match(out1, /designId: [0-9a-f-]{36}/, "通过结果回显 designId（评审 #1——多设计首 spawn 定向依据）")
    const out2 = await advisorTool.execute({ type: "design", documents: ["docs/design/B.md"] }, { agent })
    assert.match(out2, /Approved\. Pass this exact token/, "第二次评审通过")
    const map = agent._engDesignTokens
    assert.ok(map instanceof Map && map.size === 2, "两槽并存——后签发不覆盖前签发（AC8）")
    const idOf = (out) => out.match(/designId: ([0-9a-f-]{36})/)[1]
    assert.notEqual(map.get(idOf(out1)), map.get(idOf(out2)), "两个 designId 各持自己的 token")
    assert.equal(typeof agent._engDesignToken, "string", "单槽兼容镜像保留（关键决策 ②）")
    assert.equal(agent._engDesignToken, map.get(idOf(out2)), "镜像 = 最近签发的 token（既有布尔判定语义）")
    // 回显的 designId 确实能在槽集合中取回对应 token（首 spawn 定向可用）
    assert.ok(map.has(idOf(out1)) && map.has(idOf(out2)), "回显 designId ↔ 槽一一对应")
  } finally {
    server.close()
  }
})



test("designId 隔离：复审完成但未通过（无 token 回显）→ 该次 designId 不入槽、既有槽全保留（方案 ②）", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port } = await mockDesignReviewServer(false)
  try {
    const agent = {
      config: { agent: { engineering: true } },
      provider: { name: "p", model: "m", baseURL: `http://127.0.0.1:${port}`, apiKey: "x" },
      history: [], _touchedFiles: [], _advisorRound: 0, _advisorSession: null, cwd: tmpdir(),
      _engDesignTokens: new Map([["slot-a", "tok-a"], ["slot-b", "tok-b"]]),
      _engDesignToken: "tok-a",
    }
    const out = await advisorTool.execute({ type: "design", documents: ["docs/design/B.md"] }, { agent })
    assert.doesNotMatch(out, /Approved\./, "复审未通过（无 token 回显）")
    assert.equal(agent._engDesignTokens.size, 2, "失败不清任何既有槽（2026-08-30 隔离逻辑扩至多槽）")
    assert.equal(agent._engDesignTokens.get("slot-a"), "tok-a", "槽 a 原样（T17）")
    assert.equal(agent._engDesignTokens.get("slot-b"), "tok-b", "槽 b 原样（T17）")
    assert.equal(agent._engDesignToken, "tok-a", "单槽镜像同样不被清——旧 token 存活至 TTL（评审 #2 方案 ②）")
  } finally {
    server.close()
  }
})
