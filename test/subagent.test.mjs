/**
 * subagent.test.mjs — subagent provider override (model arg) resolution (CLI parity).
 */
import { test } from "node:test"
import assert from "node:assert/strict"

test("resolveChildProvider: provider:model / provider name / model name / null", async () => {
  const { resolveChildProvider } = await import("../src/agent-tools/subagent.mjs")
  const parent = {
    _provider: { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "glm-key" },
    config: {
      providersList: [
        { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "glm-key" },
        { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "ds-key" },
      ],
    },
  }
  // null → inherit parent (shallow copy)
  assert.deepEqual(resolveChildProvider(parent, null), parent._provider)
  // provider:model → named provider + named model
  const pm = resolveChildProvider(parent, "deepseek:deepseek-v4-flash")
  assert.equal(pm.name, "deepseek")
  assert.equal(pm.model, "deepseek-v4-flash")
  assert.equal(pm.baseURL, "https://api.deepseek.com")
  assert.equal(pm.apiKey, "ds-key")
  // provider name → configured model
  const pn = resolveChildProvider(parent, "deepseek")
  assert.equal(pn.model, "deepseek-v4-pro")
  // model name → same provider, different model
  const mn = resolveChildProvider(parent, "deepseek-v4-flash")
  assert.equal(mn.name, "glm")
  assert.equal(mn.model, "deepseek-v4-flash")
  assert.equal(mn.baseURL, parent._provider.baseURL)
  assert.equal(mn.apiKey, "glm-key")
  // unknown provider name in provider:model → throw
  assert.throws(() => resolveChildProvider(parent, "nope:model"), /unknown provider/)
})


test("resolveChildProvider: env keys are NOT picked up (config-only)", async () => {
  const { resolveChildProvider } = await import("../src/agent-tools/subagent.mjs")
  const parent = {
    _provider: { name: "glm", baseURL: "x", model: "glm-5.2", apiKey: "k" },
    config: {
      providersList: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro" }],
    },
  }
  const prev = process.env.DEEPSEEK_API_KEY
  process.env.DEEPSEEK_API_KEY = "env-key"
  try {
    const p = resolveChildProvider(parent, "deepseek")
    assert.equal(p.apiKey, undefined, "env key must not leak into the child provider")
  } finally {
    if (prev === undefined) delete process.env.DEEPSEEK_API_KEY
    else process.env.DEEPSEEK_API_KEY = prev
  }
})

test("effectiveSubagentModel: tool arg > type-level > global > null", async () => {
  const { effectiveSubagentModel } = await import("../src/agent-tools/subagent.mjs")
  const parent = {
    config: {
      agent: { subagentModel: "global-model", subagentModels: { coder: "type-model" } },
    },
  }
  assert.equal(effectiveSubagentModel(parent, "coder", "arg-model"), "arg-model", "tool arg wins")
  assert.equal(effectiveSubagentModel(parent, "coder", null), "type-model", "type-level wins over global")
  assert.equal(effectiveSubagentModel(parent, "explore", null), "global-model", "global fallback")
  const bare = { config: { agent: {} } }
  assert.equal(effectiveSubagentModel(bare, "coder", null), null, "null = inherit parent")
})

// ─── turn-cap continue (TURN-CAP-CONTINUE.md): every wall prompts, unlimited ───

import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"

/** Fake SSE LLM: the first `walls` calls demand a read tool (loop), then it answers. */
function wallServer(walls) {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const frame = calls.n <= walls
        ? { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "x" }) } }] } }] }
        : { choices: [{ index: 0, finish_reason: "stop", delta: { content: "child done" } }] }
      res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
    })
  })
  return { server, calls }
}

async function runChild(parent, walls, onQuestion) {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  const ctx = { agent: parent, cwd, callbacks: { onQuestion } }
  const r = String(await subagentTool.execute({ task: "loop until the cap", role: "coder" }, ctx))
  rmSync(cwd, { recursive: true, force: true })
  return r
}

test("subagent tool: turn-cap walls prompt Continue — resume completes with fresh budget", async () => {
  const { server, calls } = wallServer(3)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const parent = {
      _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      config: {
        providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
        agent: { subagentTurns: 3, engineering: false },
      },
      _subIdCounter: 0,
    }
    const asks = []
    const r = await runChild(parent, 3, async (q, options) => { asks.push({ q, options }); return "Continue" })
    assert.equal(calls.n, 4, "3 loop calls hit the cap, the resumed run finished on the 4th")
    assert.equal(asks.length, 1, "one wall → one prompt")
    assert.ok(asks[0].q.includes("3 turns"), "question names the turn count")
    assert.deepEqual(asks[0].options, ["Continue", "Stop"])
    assert.ok(r.includes("Subagent (coder) completed"), "resume completes normally")
  } finally {
    server.close()
  }
})

test("subagent tool: user Stop at the wall → partial-work return, no resume", async () => {
  const { server, calls } = wallServer(999)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const parent = {
      _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      config: {
        providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
        agent: { subagentTurns: 3, engineering: false },
      },
      _subIdCounter: 0,
    }
    const r = await runChild(parent, 999, async () => "Stop")
    assert.equal(calls.n, 3, "hit the cap and stopped — no resumed run")
    assert.ok(r.includes("stopped: turn cap reached"), "partial-work message names the cap")
    assert.ok(r.includes("Partial output"), "partial output included")
  } finally {
    server.close()
  }
})


// ─── explore turn budget (AGENT-PARAMS-TUNING 2026-08-24): no Math.min(30, …) hard cap ───

test("explore sub-agent uses the full subagentTurns budget — no 30-round cap (AC3)", async () => {
  const { server, calls } = wallServer(999)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = {
      _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      config: {
        providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
        agent: { subagentTurns: 42, engineering: false },
      },
      _subIdCounter: 0,
    }
    const ctx = { agent: parent, cwd, callbacks: {} }
    const r = String(await subagentTool.execute({ task: "loop", role: "explore" }, ctx))
    assert.equal(calls.n, 42, "explore runs the full 42-turn budget (old Math.min(30, …) would stop at 30)")
    assert.ok(r.includes("turn cap reached (42 turns)"), "cap message names the configured budget")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── mode-dependent subagent role enum (ARCHITECTURE.md: subagent role 枚举按模式覆盖) ───

test("modeRoleField(false): coder shown, eng-coder hidden, suffix empty", async () => {
  const { modeRoleField } = await import("../src/agent-tools/subagent.mjs")
  const { role, suffix } = modeRoleField(false)
  assert.equal(role.type, "string")
  assert.ok(role.enum.includes("coder"), "normal mode advertises coder")
  assert.ok(!role.enum.includes("eng-coder"), "normal mode hides eng-coder")
  assert.match(role.description, /role capability matrix/)
  assert.equal(suffix, "")
})

test("modeRoleField(true): eng-coder shown, coder hidden, suffix names eng-coder", async () => {
  const { modeRoleField } = await import("../src/agent-tools/subagent.mjs")
  const { role, suffix } = modeRoleField(true)
  assert.equal(role.type, "string")
  assert.ok(role.enum.includes("eng-coder"), "engineering mode advertises eng-coder")
  assert.ok(!role.enum.includes("coder"), "engineering mode hides coder")
  assert.match(role.description, /role capability matrix/)
  assert.match(suffix, /role='eng-coder'/)
})

test("runtime gate: non-engineering + role='eng-coder' still throws (unchanged)", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = { agent: { config: { agent: { engineering: false } } }, cwd: process.cwd(), callbacks: {} }
  await assert.rejects(
    subagentTool.execute({ task: "t", role: "eng-coder" }, ctx),
    /Engineering mode is not active/,
  )
})

test("runtime gate: engineering + role='coder' throws mutual exclusion (unchanged)", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = { agent: { config: { agent: { engineering: true } } }, cwd: process.cwd(), callbacks: {} }
  await assert.rejects(
    subagentTool.execute({ task: "t", role: "coder" }, ctx),
    /Engineering mode: use role='eng-coder' for implementation tasks\./,
  )
})

// ④ wiring: capture the actual depth-0 LLM request and inspect the subagent schema it carries.
async function depth0SubagentSchema(engEnabled) {
  const { runAgent } = await import("../src/agent.mjs")
  const bodies = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      bodies.push(JSON.parse(body))
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "ok" } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        "data: [DONE]\n\n",
      )
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-schema-"))
  try {
    const provider = { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }
    const result = await runAgent(provider, cwd, "hi", {}, undefined, true, {
      history: [], fullHistory: [], mcpServers: [], skills: [],
      engState: { enabled: engEnabled }, // pinned — the shared config.json must not leak into this test
    })
    assert.equal(result, "ok")
    const sub = bodies[0].tools.find((t) => t.function.name === "subagent")
    assert.ok(sub, "depth-0 tool table includes subagent")
    return sub
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

test("wiring: depth-0 subagent schema role enum follows the mode", async () => {
  const normal = await depth0SubagentSchema(false)
  assert.ok(normal.function.parameters.properties.role.enum.includes("coder"))
  assert.ok(!normal.function.parameters.properties.role.enum.includes("eng-coder"), "non-engineering schema must not show eng-coder")
  assert.ok(!normal.function.description.includes("In engineering mode"), "no engineering suffix in normal mode")

  const eng = await depth0SubagentSchema(true)
  assert.ok(eng.function.parameters.properties.role.enum.includes("eng-coder"))
  assert.ok(!eng.function.parameters.properties.role.enum.includes("coder"), "engineering schema must not show coder")
  assert.match(eng.function.description, /role='eng-coder'/, "engineering suffix appended to the description")
})

// ─── subagent activity stream (ARCHITECTURE.md: subagent 活动流修复 2026-08-22) ───

/** Fake SSE LLM streaming a reasoning chunk + a content token per call, then either
 *  demands a read tool (loop — the first `walls` calls) or answers and stops. */
function streamServer(walls) {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const frames = calls.n <= walls
        ? [
            { choices: [{ index: 0, delta: { reasoning_content: `think-${calls.n}` } }] },
            { choices: [{ index: 0, delta: { content: `part${calls.n} ` } }] },
            { choices: [{ index: 0, finish_reason: "tool_calls", delta: { tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "x" }) } }] } }] },
          ]
        : [
            { choices: [{ index: 0, delta: { reasoning_content: "final-think" } }] },
            { choices: [{ index: 0, delta: { content: "done" } }] },
            { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
          ]
      res.end(frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join("") + "data: [DONE]\n\n")
    })
  })
  return { server, calls }
}

// v2: real signed token — minted at runtime (the hardcoded fixture expired 2026-08-31
// and started failing that day; TTL'd tokens must never be baked into test files).
// The single minting helper lives below (signedToken, §18 code review #4 dedupe);
// this module-level token serves the eng-coder spawn tests that need a standing slot.
const realToken = await signedToken("c8721152-df45-4f7b-96f2-db877500f9ba", Date.now() + 24 * 3600 * 1000)

test("activity stream: panel channel name carries #subId (one block per invocation)", async () => {
  const { server } = streamServer(0)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const panels = []
    const parent = {
      _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      config: {
        providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
        agent: { subagentTurns: 3, engineering: true },
      },
      _subIdCounter: 0,
      _engDesignToken: realToken, // real signed token (v2 fail-closed killed bare-string pass-through)
    }
    const ctx = { agent: parent, cwd, callbacks: { onToolPanel: (name, chunk) => panels.push({ name, chunk }) } }
    // §18 D-E1: eng-coder defaults to async — this blocking-flow test pins async:false explicitly
    const r = String(await subagentTool.execute({ task: "child", role: "eng-coder", designToken: realToken, async: false }, ctx))
    assert.ok(r.includes("Subagent (eng-coder) completed"), "run completes")
    assert.ok(panels.length > 0, "activity streamed to the panel")
    for (const p of panels) assert.match(p.name, /^sub:eng-coder#\d+$/, `channel name carries #subId: ${p.name}`)
    assert.match(panels[0].name, /^sub:eng-coder#1$/, "first invocation is block #1")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("activity stream: onToken → panel kind=text and accumulates; onReasoning → panel kind=think", async () => {
  const { server, calls } = streamServer(3)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const panels = []
    const parent = {
      _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      config: {
        providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
        agent: { subagentTurns: 3, engineering: false },
      },
      _subIdCounter: 0,
    }
    const ctx = {
      agent: parent, cwd,
      callbacks: {
        onToolPanel: (name, chunk) => panels.push({ name, chunk }),
        onQuestion: async () => "Stop",
      },
    }
    const r = String(await subagentTool.execute({ task: "loop until the cap", role: "coder" }, ctx))
    assert.equal(calls.n, 3, "three looped calls hit the cap — stopped without resume")
    const thinks = panels.filter((p) => p.chunk.kind === "think")
    assert.equal(thinks.length, 3, "every reasoning chunk streams as kind=think")
    assert.deepEqual(thinks.map((p) => p.chunk.text), ["think-1", "think-2", "think-3"])
    const texts = panels.filter((p) => p.chunk.kind === "text")
    assert.equal(texts.length, 3, "every content delta streams as kind=text")
    assert.equal(texts.map((p) => p.chunk.text).join(""), "part1 part2 part3 ")
    assert.ok(r.includes("Partial output: part1 part2 part3 "), "tokens accumulate into output")
    for (const p of panels) assert.match(p.name, /^sub:coder#1$/, "all chunks share the same per-call channel")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── variant roles fail closed (coder-leak fix, 2026-08-25) ─────────────────────
// The mode gates used exact string comparison — "Coder"/" coder" bypassed BOTH gates and
// fell through to full tools / no overlay (a full-write coder without design review).
// Schema enums are advisory; providers don't enforce them. Unknown roles must throw.
test("variant roles fail closed — coder leak fix (2026-08-25)", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const makeCtx = (engineering) => ({
    cwd: process.cwd(),
    agent: { config: { agent: { engineering } }, _engDesignToken: null, _touchedFiles: [] },
    callbacks: {}, depth: 0,
  })
  for (const role of ["Coder", "CODER", " coder", "eng-coder ", "Explore", "bogus", ""]) {
    for (const eng of [true, false]) {
      await assert.rejects(
        subagentTool.execute({ task: "x", role }, makeCtx(eng)),
        /Unknown subagent role/,
        `role=${JSON.stringify(role)} engineering=${eng} must fail closed`,
      )
    }
  }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder" }, makeCtx(true)),
    /use role='eng-coder'/,
  )
})
test("subagent tool description exposes the role capability matrix (no dev-comment leaks)", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.description
  for (const probe of [
    "Available roles",
    "Why delegate?",
    "already verified",
    "- explore",
    "- plan",
    "- coder",
    "- eng-coder",
    "git context auto-injected",
    "delivery transparency table",
    "Mode filtering",
  ]) {
    assert.ok(d.includes(probe), `description missing "${probe}"`)
  }
  assert.ok(!d.includes("OVERRIDDEN"), "dev-comment leak: OVERRIDDEN in description")
  assert.ok(!d.includes("SETUP.MJS"), "internal impl path leaked into description")
  const roleDesc = subagentTool.parameters.properties.role.description
  assert.ok(!roleDesc.includes("OVERRIDDEN"), "role description leaks dev comment")
})
test("modeRoleField role description stays in sync with the matrix-pointer text (both modes)", async () => {
  const { modeRoleField } = await import("../src/agent-tools/subagent.mjs")
  for (const engineering of [false, true]) {
    const f = modeRoleField(engineering)
    assert.match(f.role.description, /role capability matrix/, `eng=${engineering}: role description drifted from matrix pointer`)
    assert.ok(!f.role.description.includes("read-only search/analysis"), "stale one-line role label resurrected")
    assert.equal(f.role.enum.length, 3, "enum must expose exactly 3 roles per mode")
  }
})

// ─── designId multi-slot spawn gate (ENGINEERING-MODE.md 2026-09-01: T15/T16, CLI parity) ───

/** Real signed token with a fixed uuid+expiry (v2 HMAC scheme), minted at runtime —
 *  TTL'd tokens must never be baked into test files (expired-fixture lesson 2026-08-31). */
async function signedToken(uuid, expiresAt) {
  const { createHmac } = await import("node:crypto")
  const sig = createHmac("sha256", "thincoder-default-secret").update(`${uuid}:${expiresAt}`).digest("hex").slice(0, 16)
  return `${uuid}:${expiresAt}:${sig}`
}

test("T15 (vscode mirror): 双设计并行 spawn 各带 designId+token 互不覆盖", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await signedToken("eeeeeeee-1111-4111-8111-00000000000a", exp)
  const tokenB = await signedToken("eeeeeeee-2222-4222-8222-00000000000b", exp)
  const { server } = streamServer(0)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-t15-"))
  try {
    const makeCtx = () => ({
      cwd,
      agent: {
        _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
        config: {
          providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
          agent: { subagentTurns: 3, engineering: true },
        },
        _subIdCounter: 0,
        _engDesignTokens: new Map([["id-a", tokenA], ["id-b", tokenB]]),
        _engDesignToken: tokenB, // 后签发覆盖镜像——spawn 消费端必须按槽定位，不受镜像误导
        _touchedFiles: [],
      },
      callbacks: {},
    })
    // §18 D-E1: eng-coder defaults to async — these blocking-flow tests pin async:false explicitly
    const rA = String(await subagentTool.execute({ task: "child", role: "eng-coder", designId: "id-a", designToken: tokenA, async: false }, makeCtx()))
    assert.ok(rA.includes("Subagent (eng-coder) completed"), "A 通过（按 designId 定位槽，不受镜像=tokenB 影响）")
    assert.ok(rA.includes("designId: id-a"), "A 交付报告回传 designId A（修正轮复用）")
    const rB = String(await subagentTool.execute({ task: "child", role: "eng-coder", designId: "id-b", designToken: tokenB, async: false }, makeCtx()))
    assert.ok(rB.includes("Subagent (eng-coder) completed"), "B 通过")
    assert.ok(rB.includes("designId: id-b"), "B 交付报告回传 designId B")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T16 (vscode mirror): 多设计缺 designId → throw 要求指定；镜像被清 + 槽残留 → 不复活", async () => {
  const { subagentTool, resolveDesignSlot } = await import("../src/agent-tools/subagent.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await signedToken("ffffffff-1111-4111-8111-00000000000a", exp)
  const tokenB = await signedToken("ffffffff-2222-4222-8222-00000000000b", exp)
  const parent = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["id-x", tokenA], ["id-y", tokenB]]),
    _engDesignToken: tokenB,
    _touchedFiles: [],
  }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "eng-coder", designToken: tokenA }, { agent: parent, cwd: process.cwd(), callbacks: {} }),
    /Multiple approved designs[\s\S]*designId/,
    "多槽缺 designId → throw 要求指定（不误取任一槽）",
  )
  assert.throws(() => resolveDesignSlot(parent, undefined), /Multiple approved designs/)
  assert.throws(() => resolveDesignSlot(parent, "no-such-id"), /designId not found/, "给定 designId 无匹配槽 → 明确报错")
  assert.throws(
    () => resolveDesignSlot({ _engDesignTokens: new Map([["k", "v"]]), _engDesignToken: null }, undefined),
    /Design tokens were reset/,
    "镜像被 eng(exit/enter) 清空而 Map 残留 → 不复活过期 token",
  )
  const single = resolveDesignSlot({ _engDesignTokens: new Map([["only", tokenA]]), _engDesignToken: tokenA }, undefined)
  assert.equal(single.token, tokenA, "单槽省略 designId → 取唯一槽")
  const legacy = resolveDesignSlot({ _engDesignToken: tokenA }, undefined)
  assert.equal(legacy.token, tokenA, "无 Map（旧会话）→ 单值镜像兜底")
})



// ─── §15 async 子代理（AGENT-LOOP.md D-A1/D-A2/D-A3/D-A4，VS Code 对齐）───

/** 按任务文本响应的 async 子代理 mock：fast 立即完成；slow/queued-* 延迟完成；其他 "child done"。 */
function asyncChildServer(delayMs = 0) {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const isSlow = /slow|queued/.test(body)
      const send = () => {
        const content = isSlow ? `slow result ${calls.n}` : `fast result ${calls.n}`
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n"
        )
      }
      if (isSlow && delayMs > 0) setTimeout(send, delayMs)
      else send()
    })
  })
  return { server, calls }
}

function asyncParent(port, extra = {}) {
  const base = {
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: false },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _asyncSubagents: new Map(),
    _asyncCheckN: 0,
  }
  return { ...base, ...extra }
}

function asyncCtx(parent, cwd, extra = {}) {
  return { agent: parent, cwd, callbacks: {}, ...extra }
}

/** Async spawn results are JSON STRINGS (tool-result contract — §18 code review #1);
 *  parse for shape assertions. */
const spawnJson = (raw) => JSON.parse(String(raw))

test("T1/T2 (vscode): async spawn 立即返回 {id, status:running}，不等待子代理完成；主会话可继续", async () => {
  const { server } = await asyncChildServer(400)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const t0 = Date.now()
    const r = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    const elapsed = Date.now() - t0
    assert.equal(r.status, "running", "async spawn 立即返回 running（不 await 报告）")
    assert.equal(r.id, 1)
    assert.ok(elapsed < 300, `spawn 返回早于子代理完成（elapsed=${elapsed}ms < 400ms 延迟）`)
    const entry = parent._asyncSubagents.get(1)
    assert.ok(entry && entry.status === "running", "_asyncSubagents 有该项且 running")
    // 子代理后台照常跑完（T1 补：settle 后落 report）
    await entry.settled
    assert.ok(entry.done && entry.report.includes("slow result"), "后台完成并落 report")
    // T2：async spawn 后同一回合再做只读操作不被阻塞（execute 已返回，直接再调一个只读工具）
    const again = spawnJson(await subagentTool.execute({ task: "slow task 2", role: "coder", async: true }, ctx))
    assert.equal(again.status, "running", "同回合第二个 async spawn 照常立即返回")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T3 (vscode): 完成顺序——快先慢后，arrival order 消费；全消费 → {done:true}", async () => {
  const { server } = await asyncChildServer(300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const fast = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    const slow = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    assert.equal(fast.status, "running")
    assert.equal(slow.status, "running")
    // 无 id 检查：先完成先返回（快）
    const first = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(first.id, fast.id, "先返回快的")
    assert.equal(first.status, "done")
    assert.match(first.report, /fast result/)
    // 第二次：慢的
    const second = JSON.parse(await subagentTool.execute({ action: "check", n: 2 }, ctx))
    assert.equal(second.id, slow.id, "第二次返回慢的")
    assert.match(second.report, /slow result/)
    // 全消费 → done:true
    const done = JSON.parse(await subagentTool.execute({ action: "check", n: 3 }, ctx))
    assert.deepEqual(done, { done: true })
    assert.equal(parent._asyncSubagents.size, 0, "消费后注册表清空")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T4 (vscode): 带 id 等待特定子代理——阻塞到该 id 完成返回其报告", async () => {
  const { server } = await asyncChildServer(200)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx)
    await subagentTool.execute({ task: "slow task 2", role: "coder", async: true }, ctx)
    const r = JSON.parse(await subagentTool.execute({ action: "check", id: 2, n: 1 }, ctx))
    assert.equal(r.id, 2, "按 id 取回指定子代理")
    assert.equal(r.status, "done")
    assert.match(r.report, /slow result/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T6/T10/T11 (vscode): 槽位队列——超限入队 + 位置递增 + 腾槽自动补位", async () => {
  const { server } = await asyncChildServer(250)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = []
    for (let i = 1; i <= 4; i++) {
      const r = spawnJson(await subagentTool.execute({ task: `queued task ${i}`, role: "coder", async: true }, ctx))
      spawned.push(r)
      assert.equal(r.status, "running", `第 ${i} 个 running`)
    }
    const fifth = spawnJson(await subagentTool.execute({ task: "queued task 5", role: "coder", async: true }, ctx))
    assert.equal(fifth.status, "queued", "第 5 个入队（不拒绝）")
    assert.equal(fifth.position, 1, "position=1")
    const sixth = spawnJson(await subagentTool.execute({ task: "queued task 6", role: "coder", async: true }, ctx))
    assert.equal(sixth.status, "queued")
    assert.equal(sixth.position, 2, "position 递增（6→2）")
    assert.equal(parent._asyncSubagents.get(fifth.id).status, "queued")
    // T10：任一 running settle → 队列头部自动启动（无需模型再 spawn）
    await parent._asyncSubagents.get(1).settled
    // 等补位逻辑跑完（onSettled 微任务链）
    for (let i = 0; i < 50 && parent._asyncSubagents.get(fifth.id)?.status === "queued"; i++) {
      await new Promise((r) => setTimeout(r, 20))
    }
    assert.notEqual(parent._asyncSubagents.get(fifth.id).status, "queued", "running settle 后队列头部自动启动（status→running）")
    // 全部最终完成
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
    assert.ok([...parent._asyncSubagents.values()].every((e) => e.done), "全部完成")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T12/T13/T14 (vscode): check 错误路径——未知 id / n 超限 / 乱序重复 n", async () => {
  const { server } = await asyncChildServer()
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    // T12：未知 id
    const unknown = JSON.parse(await subagentTool.execute({ action: "check", id: 999, n: 1 }, ctx))
    assert.equal(unknown.status, "error")
    assert.match(unknown.error, /unknown async subagent id: 999/)
    // T14：乱序/重复 n——先消费一个，再传 n=1（非 lastN+1）
    await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx)
    await subagentTool.execute({ task: "fast task 2", role: "coder", async: true }, ctx)
    const first = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(first.status, "done")
    const dup = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(dup.status, "error")
    assert.equal(dup.error, "invalid read counter — pass n = lastN+1")
    const skip = JSON.parse(await subagentTool.execute({ action: "check", n: 3 }, ctx))
    assert.equal(skip.status, "error", "跳号 n=3（lastN=1）→ 拒绝")
    // T13：n 超限（> MAX_ASYNC_CHECKS=3）
    const over = JSON.parse(await subagentTool.execute({ action: "check", n: 4 }, ctx))
    assert.equal(over.status, "error")
    assert.equal(over.error, "check limit exceeded — use turn-end auto-wait for the rest")
    // 已消费 id → unknown（T12 补）
    const consumed = JSON.parse(await subagentTool.execute({ action: "check", id: first.id, n: 2 }, ctx))
    assert.equal(consumed.status, "error", "已消费 id 视为 unknown")
    assert.match(consumed.error, /unknown async subagent id/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("depth>0 传 async → 报错拒绝（§15 D-A3：async 仅顶层可用）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const parent = asyncParent(1)
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder", async: true }, asyncCtx(parent, process.cwd(), { depth: 1 })),
    /async spawn only available at the top level/,
  )
})

test("T5 (vscode, §17 D-S1 superseded): 回合收尾——回合内已 settle 的 async 收已完成直注入 + 注册表清空（collectSettledAsync 语义；不再 allSettled 等待——未完成项移交挂起会话，见 suspension.test.mjs T-S1）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  const { runAgent } = await import("../src/agent.mjs")
  let parentCalls = 0
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      const hasToolCalls = body.includes('"tool_calls"') // 父回合 2 的历史含工具调用；子请求与父回合 1 无
      if (!hasToolCalls && body.includes("child job")) {
        // 子代理请求：直接完成（与父回合 2 到达顺序无关——按体区分）
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "child report" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n"
        )
        return
      }
      parentCalls++
      if (parentCalls === 1) {
        // 父回合 1：spawn async 子代理
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "subagent", arguments: JSON.stringify({ task: "child job", role: "coder", async: true }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else {
        // 父回合 2（最终回复）延迟 400ms：无论子代理请求是否晚于本请求到达
        // （prepareRun 竞态），子代理 settle（即刻响应）都先于父回合收尾——
        // collectSettledAsync 直注入路径的确定断言（CLI T5 同款手法）。
        setTimeout(() => {
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "final" } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            "data: [DONE]\n\n"
          )
        }, 400)
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const history = []
    const fullHistory = []
    const out = await runAgent(
      { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      cwd, "spawn and finish", {}, undefined, true,
      { history, fullHistory },
    )
    assert.equal(out, "final")
    const injected = history.filter((m) => typeof m.content === "string" && m.content.includes("async subagent #1 (coder) finished"))
    assert.equal(injected.length, 1, "收尾注入 reminder")
    assert.ok(injected[0].content.includes("child report"), "报告文本注入（XML 转义后仍在）")
    // pushReal 双线同步：真实消息 + 收尾注入都进人读线（机读线另有 system/time 注入，天然更长）
    assert.equal(fullHistory.filter((m) => typeof m.content === "string" && m.content.includes("async subagent #1")).length, 1, "人读线同步注入")
    assert.equal(history._asyncSubagents, undefined, "收尾后注册表清空（depth-0 载体释放——已注入项移出池）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("D-A3 (vscode): async 子代理 settle 即发 onSubagent done 通知——完成即冻结信号，不等到回合收尾", async () => {
  const { server } = await asyncChildServer(200)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const notes = []
    const ctx = asyncCtx(parent, cwd, { callbacks: { onSubagent: (info) => notes.push(info) } })
    const r = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    assert.equal(r.status, "running")
    assert.ok(!notes.some((n) => n.status === "done"), "spawn 返回时尚无 done 通知")
    const entry = parent._asyncSubagents.get(r.id)
    await entry.settled
    // settle 即发 done（webview 区块完成态信号，runChild 完成路径——无需回合收尾）
    const doneNote = notes.find((n) => n.id === r.id && n.status === "done")
    assert.ok(doneNote, "settle 时收到 onSubagent done 通知（完成即冻结）")
    assert.equal(doneNote.role, "coder")
    // 收尾注入仍在（既有 T5 已断言 reminder 注入 + 注册表清空——本用例只验证通知时机）
    assert.equal(entry.done, true)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T8 (vscode): 中断——signal aborted → 注册表立即清空、不注入陈旧错误", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  const { runAgent } = await import("../src/agent.mjs")
  const server = createServer(() => {})
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const history = []
    // 预置一个未完成的 async 项（模拟上一轮残留）
    const entry = { id: 1, role: "coder", status: "running", report: null, error: null, done: false, settled: new Promise(() => {}) }
    const map = new Map([[1, entry]])
    history._asyncSubagents = map
    const ctrl = new AbortController()
    ctrl.abort()
    await assert.rejects(
      runAgent(
        { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
        cwd, "x", {}, ctrl.signal, true, { history, fullHistory: [] },
      ),
      (e) => e?.name === "AbortError",
      "已 abort 的 signal → runAgent 抛 AbortError",
    )
    assert.equal(map.size, 0, "中断后注册表立即清空（不注入陈旧错误）")
    assert.ok(!history.some((m) => typeof m.content === "string" && m.content.includes("async subagent")), "无注入")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── §18 工程交付协议：eng-coder 默认 async + 内部自审计闭环（AGENT-LOOP.md §18 D-E1..E3，VS Code 对齐）───
// 用例映射：T-E1 缺省 async / T-E2 async:false 覆盖 / T-E3 内部 explore 审计 spawn + 机械任务书
// / T-E4 非 explore role 拒绝 / T-E5 async 强制同步 / T-E7 第 7 次审计 spawn 拒绝（机械后备）
// / T-E12 域内写授权（autoApprove=false 零面板）/ T-E14 授权粒度（前置门仍生效）
// / T-E6 内部协议闭环 wiring / T-E16 schema 角色级默认 + 受限审计变体。
// / T-E18 子代理内 advisor 流可见性（runChild onToolPanel 转发——2026-09-03 可见性补齐）。
// 提示词层断言（engineering-sub.md 协议步骤/修正轮 N/5 / engineering.md async 口径）在 agent.test.mjs。

/** 单发 SSE server：每个 LLM 请求一律立即以 `text` 完成（无工具调用）。 */
function oneShotServer(text) {
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        "data: [DONE]\n\n",
      )
    })
  })
  return { server }
}

/** 工程模式父会话 fake（eng-coder spawn 需槽位 + 真实签名 token；async 池字段齐备）。 */
function engParent(port, token, extra = {}) {
  return {
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: true },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _engDesignTokens: new Map([["eng", token]]),
    _engDesignToken: token,
    _asyncSubagents: new Map(),
    _asyncCheckN: 0,
    ...extra,
  }
}

/** eng-coder 子代理上下文 fake（depth>0、_role="eng-coder"——内部 spawn 门作用对象）。 */
function engChildCtx(port, cwd, extra = {}) {
  const agent = {
    _role: "eng-coder",
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: true },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _asyncSubagents: new Map(),
    _asyncCheckN: 0,
    ...extra,
  }
  return { agent, cwd, callbacks: {}, depth: 1 }
}

test("T-E1: eng-coder 缺省 async（§18 D-E1）——spawn 立即返回 running、交付后台 settle 带 designId；explore 缺省阻塞（回归）", async () => {
  const { server } = oneShotServer("eng-coder delivery done")
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e1-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await signedToken("e1e1e1e1-1111-4111-8111-0000000000e1", Date.now() + 24 * 3600 * 1000)
    const parent = engParent(port, token)
    const ctx = { agent: parent, cwd, callbacks: {} }
    // 不带 async 参数 → eng-coder 角色级缺省 async
    const r = spawnJson(await subagentTool.execute({ task: "implement per design", role: "eng-coder", designId: "eng", designToken: token }, ctx))
    assert.equal(r.status, "running", "eng-coder 缺省 async → 立即返回 running（不阻塞）")
    assert.equal(r.role, "eng-coder")
    assert.equal(r.id, 1)
    const entry = parent._asyncSubagents.get(1)
    assert.ok(entry && entry.status === "running", "async 池有该项")
    await entry.settled
    assert.ok(entry.done, "后台 settle 落报告")
    assert.ok(entry.report.includes("Subagent (eng-coder) completed"), "交付报告成型")
    assert.ok(entry.report.includes("designId: eng"), "报告回传 designId（父侧可选修正轮复用同槽）")
    // 回归：非 eng-coder 角色缺省阻塞（§15 F4 不变——§18 仅 eng-coder 例外）
    const parent2 = asyncParent(port)
    const r2 = String(await subagentTool.execute({ task: "explore job", role: "explore" }, asyncCtx(parent2, cwd)))
    assert.ok(r2.includes("Subagent (explore) completed"), "explore 缺省阻塞返回报告字符串")
    assert.equal(parent2._asyncSubagents.size, 0, "explore 未进 async 池")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-E2: async:false 显式覆盖——eng-coder 同步阻塞返回（不进 async 池）", async () => {
  const { server } = oneShotServer("eng-coder delivery done")
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e2-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await signedToken("e2e2e2e2-2222-4222-8222-0000000000e2", Date.now() + 24 * 3600 * 1000)
    const parent = engParent(port, token)
    const ctx = { agent: parent, cwd, callbacks: {} }
    const r = String(await subagentTool.execute({ task: "implement per design", role: "eng-coder", designId: "eng", designToken: token, async: false }, ctx))
    assert.ok(r.includes("Subagent (eng-coder) completed"), "async:false → 同步阻塞返回报告")
    assert.equal(parent._asyncSubagents.size, 0, "同步 spawn 不进 async 池")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-E17 (vscode mirror): AUTO+工程 async eng-coder 撞 turn-cap → 自动续跑完整交付、无 partial 截断标记（§15 D-A3 例外——§18 默认 async 交付的 cap 兜底）", async () => {
  // 子代理 turn 上限 = 3（parent.config.agent.subagentTurns）：3 个 read 工具回合后撞
  // cap。手动档 = auto-decline（反例锁 = 下方 T-E17-manual）；AUTO+工程 = 自动 resume（2026-09-02 统一
  // 规则——CLI askContinue: Promise.resolve(Boolean(engineering && autoApprove))；VS Code
  // live AUTO 载体 = ctx.getAuto）。§18 D-E2：协议不调高 100-turn 上限，AUTO 续跑兜底。
  const DELIVERY = "E17 AUTO 续跑交付 —— 完整交付内容：" + "审计 0 偏差 / advisor 全清 / 修正轮 0 轮，终态 clean。".repeat(30)
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const frame = calls.n <= 3
        ? { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "x" }) } }] } }] }
        : { choices: [{ index: 0, finish_reason: "stop", delta: { content: DELIVERY } }] }
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e17-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await signedToken("e1e7e1e7-1717-4171-8171-0000000000e7", Date.now() + 24 * 3600 * 1000)
    const parent = {
      _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      config: {
        providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
        agent: { subagentTurns: 3, engineering: true },
      },
      _subIdCounter: 0,
      _touchedFiles: [],
      _engDesignTokens: new Map([["eng", token]]),
      _engDesignToken: token,
      _asyncSubagents: new Map(),
      _asyncCheckN: 0,
    }
    // AUTO 档（无人值守授权——2026-09-02 统一规则前提）：ctx.getAuto = live AUTO 读法
    // （execute-tools 把 runAgent 的 autoApprove getter 注入每个工具 ctx）
    const ctx = { agent: parent, cwd, callbacks: {}, getAuto: () => true }
    const out = spawnJson(await subagentTool.execute(
      { task: "实现 E17（会撞 cap）", role: "eng-coder", designId: "eng", designToken: token }, // 缺省 async
      ctx,
    ))
    assert.equal(out.status, "running", "T-E17: eng-coder 缺省 async（§18 D-E1/F1）")
    const entry = parent._asyncSubagents.get(1)
    assert.ok(entry && entry.status === "running", "T-E17: async 条目登记")
    await entry.settled
    assert.equal(entry.done, true, "T-E17: 后台交付 settle")
    assert.ok(entry.report.includes("E17 AUTO 续跑交付"), "T-E17: AUTO 档撞 cap 自动续跑 → 完整交付（非 partial）")
    assert.ok(!entry.report.includes("stopped: turn cap reached"), "T-E17: 无 partial 截断标记")
    assert.ok(entry.report.includes("designId: eng"), "T-E17: 交付报告回传 designId（修正轮复用）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-E17-manual (vscode mirror): 工程开 + AUTO 关 async eng-coder 撞 turn-cap → auto-decline partial、零续跑零面板（§15 D-A3 基线——T-E17 AUTO 例外的反例锁）", async () => {
  // 与 T-E17 同构的对照用例：同一 role/token/cap 配置，仅 AUTO 关（getAuto → false）。
  // wallServer(3) 前 3 个请求是 read 墙、第 4 个才应答——若 AUTO 例外误触发续跑，
  // 会发出第 4 个请求（calls.n = 4）；auto-decline 则停在 3（partial 报告）。
  const { server, calls } = wallServer(3)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e17m-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await signedToken("e17m0000-1717-4171-8171-0000000000e7", Date.now() + 24 * 3600 * 1000)
    const parent = {
      _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      config: {
        providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
        agent: { subagentTurns: 3, engineering: true },
      },
      _subIdCounter: 0,
      _touchedFiles: [],
      _engDesignTokens: new Map([["eng", token]]),
      _engDesignToken: token,
      _asyncSubagents: new Map(),
      _asyncCheckN: 0,
    }
    let asks = 0
    // 手动档：AUTO 关。异步子代理绝不弹面板（onQuestion 不得被调）、不续跑、直接 partial
    const ctx = {
      agent: parent, cwd,
      callbacks: { onQuestion: async () => { asks++; return "Continue" } },
      getAuto: () => false,
    }
    const out = spawnJson(await subagentTool.execute(
      { task: "实现 E17m（会撞 cap，手动档）", role: "eng-coder", designId: "eng", designToken: token }, // 缺省 async
      ctx,
    ))
    assert.equal(out.status, "running", "T-E17-manual: eng-coder 缺省 async（§18 D-E1/F1）")
    const entry = parent._asyncSubagents.get(1)
    assert.ok(entry && entry.status === "running", "T-E17-manual: async 条目登记")
    await entry.settled
    assert.equal(entry.done, true, "T-E17-manual: 后台 settle 落报告")
    assert.ok(String(entry.report).includes("stopped: turn cap reached"), "T-E17-manual: 手动档 auto-decline partial 标记")
    assert.equal(calls.n, 3, "T-E17-manual: 零续跑请求（第 4 请求未发出——AUTO 例外未误触发）")
    assert.equal(asks, 0, "T-E17-manual: 异步子代理零面板询问（onQuestion 从未被调）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-E1-loop (§18 code review #1/#3): 真实 agent 循环中 eng-coder 缺省 async 的 spawn 工具结果 = JSON 字符串（模型可见 {id,role,status}——非 [object Object]）", async () => {
  const token = await signedToken("e1loop-1111-4111-8111-0000000000e1", Date.now() + 24 * 3600 * 1000)
  const bodies = []
  const parentCalls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      bodies.push(body)
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      // 路由：eng-coder 子代理自己的请求（系统提示词含 engineering-sub 的协议段）→ 直接完成；
      // 父回合 1 → spawn；父回合 2+ → 最终回复。
      if (body.includes("Internal Delivery Protocol")) {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, finish_reason: "stop", delta: { content: "child delivery done" } }] })}\n\n` +
          "data: [DONE]\n\n",
        )
        return
      }
      parentCalls.n++
      if (parentCalls.n === 1) {
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "subagent", arguments: JSON.stringify({ task: "implement per design", role: "eng-coder", designId: "eng", designToken: token }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, finish_reason: "stop", delta: { content: "final" } }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e1loop-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const history = []
    const out = await runAgent(
      { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      cwd, "spawn eng-coder", {}, undefined, true,
      {
        history, fullHistory: [],
        engState: { enabled: true, engDesignToken: token, engDesignTokens: { eng: token } },
      },
    )
    assert.equal(out, "final")
    const toolMsg = history.find((m) => m.role === "tool" && String(m.content ?? "").includes('"role":"eng-coder"'))
    assert.ok(toolMsg, "spawn 工具结果进入历史（agent 循环路径）")
    assert.ok(String(toolMsg.content).includes('"status":"running"'), "模型可见 JSON {id,role,status:running}（非 [object Object]）")
    assert.ok(String(toolMsg.content).includes('"id":1'), "id 可读（check/status 动作按 id 寻址依赖它——§19）")
    assert.ok(!String(toolMsg.content).includes("[object Object]"), "String(raw) 序列化契约成立")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-E7-resume (§18 code review #2): 审计预算跨 runAgent 段存活（history 载体——同次交付不因 ContinueError 续跑重置机械后备）", async () => {
  const { subagentTool, ENG_AUDIT_SPAWN_LIMIT } = await import("../src/agent-tools/subagent.mjs")
  // 模拟已续跑过一次的 eng-coder 上下文：agent.history 数组承载预算（sink.history 跨 resume 复用）
  const history = []
  history._engAuditSpawns = ENG_AUDIT_SPAWN_LIMIT
  const ctx = engChildCtx(1, process.cwd(), { history })
  await assert.rejects(
    subagentTool.execute({ task: "audit after resume", role: "explore" }, ctx),
    /correction-round limit exceeded — deliver a stalled report/,
    "续跑段继承预算——第 7 次审计 spawn 仍被拒绝（每交付一次预算，非每 runAgent 段）",
  )
})

test("T-E3: eng-coder 内部 spawn explore 成功——审计节点同步返回报告；任务书机械追加（父任务书 ∪ 实际触碰文件）", async () => {
  const bodies = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      bodies.push(body)
      const audit = body.includes("[Audit scope — mechanical context")
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: audit ? "AUDIT REPORT: clean — no divergence" : "child done" } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        "data: [DONE]\n\n",
      )
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e3-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const touched = join(cwd, "impl-x.mjs")
    const brief = "Docs involved: [docs/design/X.md] acceptance: [AC1, AC2] files: [impl-x.mjs]"
    const ctx = engChildCtx(port, cwd, { _touchedFiles: [touched], _engTaskInput: brief })
    const r = String(await subagentTool.execute({ task: "AUDIT: run the divergence audit", role: "explore" }, ctx))
    assert.ok(r.includes("Subagent (explore) completed"), "内部 explore 审计 spawn 同步返回")
    assert.ok(r.includes("AUDIT REPORT: clean"), "审计报告回传")
    assert.equal(ctx.agent._engAuditSpawns, 1, "审计尝试计数 = 1")
    // 机械任务书：父 spawn 任务书原文 + 实际触碰文件都进了审计子代理的输入（非自述清单）
    const auditBody = bodies.find((b) => b.includes("[Audit scope — mechanical context"))
    assert.ok(auditBody, "审计子代理请求携带机械任务书块")
    assert.ok(auditBody.includes(brief), "父 spawn 任务书 verbatim 注入")
    assert.ok(auditBody.includes(touched.replace(/\\/g, "\\\\")), "实际触碰文件（机械并集）注入")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-E4: eng-coder 内部 spawn 非 explore role（plan/eng-coder）→ 工具层拒绝", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = engChildCtx(1, process.cwd())
  for (const role of ["plan", "eng-coder", "coder"]) {
    await assert.rejects(
      subagentTool.execute({ task: "x", role }, ctx),
      /may only spawn role='explore'/,
      `eng-coder 内部 spawn role=${role} 必须拒绝（受限通道仅审计）`,
    )
  }
  // 非 eng-coder 上下文（depth>0 但角色不同）不受限——受限门只对 eng-coder 生效
  const coderChild = { _role: "coder", config: { agent: { engineering: false } } }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "bogus" }, { agent: coderChild, cwd: process.cwd(), depth: 1, callbacks: {} }),
    /Unknown subagent role/,
    "coder 上下文仍走既有角色白名单",
  )
})

test("T-E5: eng-coder 内部 spawn explore 带 async:true → 拒绝（同步强制——回合等审计报告再决策）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = engChildCtx(1, process.cwd())
  await assert.rejects(
    subagentTool.execute({ task: "audit", role: "explore", async: true }, ctx),
    /sync-only/,
    "eng-coder 内部 explore spawn 强制同步",
  )
  assert.equal(ctx.agent._engAuditSpawns, undefined, "拒绝的 spawn 不计入审计尝试数")
})

test("T-E7: 收敛上限机械后备——第 7 次审计 spawn 拒绝（5 轮纪律失效时不静默——错误即 stalled 信号）", async () => {
  const { subagentTool, ENG_AUDIT_SPAWN_LIMIT } = await import("../src/agent-tools/subagent.mjs")
  assert.equal(ENG_AUDIT_SPAWN_LIMIT, 6, "预算 = 首审 1 + 修正轮 ≤5 的再审")
  const ctx = engChildCtx(1, process.cwd(), { _engAuditSpawns: ENG_AUDIT_SPAWN_LIMIT })
  await assert.rejects(
    subagentTool.execute({ task: "audit again", role: "explore" }, ctx),
    /correction-round limit exceeded — deliver a stalled report/,
    "第 7 次审计 spawn 被机械拒绝（不静默）",
  )
})

test("T-E12: 域内写授权——autoApprove=false 会话 spawn eng-coder → 任务域写文件成功、零权限询问（spawn 即授权）", async () => {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      if (calls.n === 1) {
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "write", arguments: JSON.stringify({ path: "impl-x.mjs", content: "v1" }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, finish_reason: "stop", delta: { content: "delivery done" } }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e12-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await signedToken("e12e12e1-1111-4111-8111-000000000012", Date.now() + 24 * 3600 * 1000)
    const parent = engParent(port, token)
    let asked = 0
    const ctx = { agent: parent, cwd, callbacks: { onPermissionRequired: async () => { asked++; return true } }, getAuto: () => false }
    const r = String(await subagentTool.execute({ task: "implement per design", role: "eng-coder", designId: "eng", designToken: token, async: false }, ctx))
    assert.ok(r.includes("Subagent (eng-coder) completed"), "交付完成")
    assert.equal(asked, 0, "手动档会话中 eng-coder 写文件零面板（spawn 即授权——任务域内）")
    const written = join(cwd, "impl-x.mjs")
    assert.equal(readFileSync(written, "utf8"), "v1", "任务域内文件写入成功")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-E14: 授权粒度——design-token / planMode 前置门在授权后仍生效（豁免仅限 onPermissionRequest 阶段）", async () => {
  const { executeToolBatches } = await import("../src/agent/execute-tools.mjs")
  const executed = []
  const writeTool = { name: "write", readonly: false, execute: async () => { executed.push(true); return "ok" } }
  const base = {
    _role: "eng-coder", _planMode: false,
    config: { agent: { engineering: true } },
    _touchedFiles: [], _mutatedThisRun: false, _calledAdvisorThisRun: false,
    _verifiedThisRun: false, _verifyPassed: undefined, _advisorRound: 0,
  }
  const history = []
  const run = (agent) => executeToolBatches(agent, {
    response: { toolCalls: [{ id: "1", name: "write", arguments: JSON.stringify({ path: "x.mjs", content: "x" }) }] },
    history, fullHistory: [],
    toolByName: new Map([["write", writeTool]]),
    getAuto: () => true, // AUTO——也不得越过前置门（粒度：非 onPermissionRequest 阶段照常生效）
    callbacks: {}, signal: undefined, cwd: process.cwd(), recentSigs: [], depth: 1,
  })
  const toolContents = () => history.filter((m) => m.role === "tool").map((m) => m.content)
  // design-token 门：评审未过（无授权）→ AUTO 下写仍被拒
  await run({ ...base, _engDesignReviewed: false })
  assert.ok(toolContents().some((c) => c.includes("engineering design gate")), "design-token 门在 AUTO 下仍生效")
  assert.equal(executed.length, 0, "写未执行")
  // planMode 门：授权后 planMode 仍拒写
  await run({ ...base, _engDesignReviewed: true, _planMode: true })
  assert.ok(toolContents().some((c) => c.includes("plan mode active")), "planMode 门照常生效")
  assert.equal(executed.length, 0)
  // 对照：评审通过 + 非 planMode → 写放行（授权语义本身）
  await run({ ...base, _engDesignReviewed: true })
  assert.equal(executed.length, 1, "评审通过后写放行（仅 onPermissionRequest 阶段被豁免）")
})

test("T-E6: 内部协议闭环 wiring——脚本化 eng-coder runAgent：audit dirty → 自修 → re-audit clean → advisor clean → 报告含轮次与终态", async () => {
  const script = [
    { name: "subagent", arguments: { task: "AUDIT-TASK run the divergence audit", role: "explore" } },
    { name: "write", arguments: { path: "impl-x.mjs", content: "v2 fixed" } },
    { name: "subagent", arguments: { task: "RE-AUDIT-TASK re-audit after the fix", role: "explore" } },
    { name: "advisor", arguments: { type: "code", documents: ["docs/design/X.md"], paths: ["impl-x.mjs"] } },
  ]
  const finalText = "Delivery report: implemented (transparency table) — audit 2 rounds (dirty -> clean) / advisor 1 round clean — terminal state: clean."
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      const step = script[calls.n - 1]
      if (step) {
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: `t${calls.n}`, type: "function", function: { name: step.name, arguments: JSON.stringify(step.arguments) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, finish_reason: "stop", delta: { content: finalText } }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e6-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const subCalls = []
    const advisorCalls = []
    // 受限审计通道与 advisor 以 stub 替身驱动确定性协议流（真实执行路径已在 T-E3 覆盖）
    const subStub = {
      name: "subagent", readonly: false,
      execute: async (args) => {
        subCalls.push({ role: args.role, task: args.task })
        return args.task.includes("RE-AUDIT")
          ? "AUDIT REPORT: clean — no divergence found."
          : "AUDIT REPORT: dirty — impl-x.mjs misses AC2 (partial implementation)."
      },
    }
    const advisorStub = {
      name: "advisor", readonly: true,
      execute: async (args) => { advisorCalls.push(args); return "Advisor code review: all clear — no findings." },
    }
    const sink = {}
    const out = await runAgent(
      { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      cwd, "IMPLEMENT the design", {}, undefined, true,
      {
        history: [], fullHistory: [], mcpServers: [], skills: [],
        engState: { enabled: true },
        engDesignReviewed: true, // 父 spawn 已验 token——子代理到达即授权（§18 D-E3）
        depth: 1, role: "eng-coder", maxTurns: 20,
        extraTools: [subStub, advisorStub],
        stateSink: sink,
      },
    )
    assert.equal(out, finalText, "协议流程走完 → 收敛交付报告")
    assert.equal(subCalls.length, 2, "两次审计 spawn（初审 + 复审）")
    assert.ok(subCalls.every((c) => c.role === "explore"), "审计 spawn 全部 explore")
    assert.ok(subCalls[0].task.includes("AUDIT-TASK") && subCalls[1].task.includes("RE-AUDIT-TASK"), "dirty 自修后 re-audit")
    assert.equal(advisorCalls.length, 1, "advisor code review 一次（clean 后收敛）")
    assert.equal(advisorCalls[0].type, "code", "内部复评 = type=code")
    assert.ok(advisorCalls[0].paths?.includes("impl-x.mjs"), "复评以实际交付文件为对象")
    const file = join(cwd, "impl-x.mjs")
    assert.equal(readFileSync(file, "utf8"), "v2 fixed", "自修写入落地")
    assert.ok(sink.touchedFiles?.includes(file), "改动并入父侧簿记（mergeChildMutations 数据源）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-E18 (可见性补齐 2026-09-03): eng-coder 子代理内 advisor 长文流转发——runChild onToolPanel 接线 → 顶层 sub:eng-coder#N 频道（kind 原样、无逐 chunk 换行）", async () => {
  // 真实 run wiring 测试：eng-coder 子代理执行**真实** code review——advisor.mjs 经
  // ctx.callbacks.onToolPanel("advisor", chunk) 发射（该 callbacks = runChild 传给
  // runAgent 的参数对象——修复前无 onToolPanel 键 → 静默丢弃）。评审尾部标记
  // VERDICT-MARKER-x7k2 故意跨两个 SSE delta 拆开发送——转发若注入任何分隔符
  // （CLI 式逐 chunk 换行即违禁形态）重组即失败。配置沙箱：子代理 + advisor 的
  // provider 解析全落沙箱 config——真实 ~/.thincoder/config.json 的 provider/advisor
  // 段不得泄漏进 mock server 的回合预算（任何机器上确定性）。
  const { _configPath, _setConfigPathForTest } = await import("../src/config-io.mjs")
  const prevConfigPath = _configPath()
  const cwd = mkdtempSync(join(tmpdir(), "tc-e18-"))
  const cfgPath = join(cwd, "config.json")
  const reviewText = [
    "ADVISOR REVIEW round 1 — full long-form review. The implementation covers every ",
    "acceptance criterion of the design doc. Files under review match the approved ",
    "design; no divergence found in the protocol trace. Final verdict: all clear — VERDICT-MAR",
    "KER-x7k2 complete.",
  ]
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      if (calls.n === 1) {
        // 子代理 turn 1：真实 advisor code review 调用
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "advisor", arguments: JSON.stringify({ type: "code", paths: ["impl-x.mjs"] }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else if (calls.n === 2) {
        // advisor 自身的单发评审（chat-panel T1 形态）：content 分 4 个 delta 流式
        res.end(
          reviewText.map((t) => `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: t } }] })}\n\n`).join("") +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      } else {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "eng-coder delivery done" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  writeFileSync(cfgPath, JSON.stringify({
    providers: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
    activeProvider: "t",
  }), "utf8")
  _setConfigPathForTest(cfgPath)
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    writeFileSync(join(cwd, "impl-x.mjs"), "export const x = 1\n")
    const token = await signedToken("e18e18e1-1111-4111-8111-0000000000e1", Date.now() + 24 * 3600 * 1000)
    const parent = engParent(port, token)
    const panels = []
    const ctx = { agent: parent, cwd, callbacks: { onToolPanel: (name, chunk) => panels.push({ name, chunk }) } }
    const r = String(await subagentTool.execute({ task: "implement per design X", role: "eng-coder", designId: "eng", designToken: token, async: false }, ctx))
    assert.ok(r.includes("Subagent (eng-coder) completed"), "子代理回合完成")
    assert.ok(calls.n >= 3, "子代理 2 turn + advisor 1 发 = ≥3 次 LLM 请求")
    const child = panels.filter((p) => p.name === "sub:eng-coder#1")
    assert.ok(child.length > 0, "子代理活动流到达顶层频道")
    assert.equal(child.length, panels.length, "本次 spawn 全部 chunk 同频道（单块不串扰）")
    const textJoin = child.filter((p) => p.chunk.kind === "text").map((p) => p.chunk.text).join("")
    // 修复前红：advisor 评审流在 child ctx 静默丢弃——text 频道只有子代理自己的输出
    assert.ok(textJoin.includes("VERDICT-MARKER-x7k2"),
      "子代理内 advisor 长文（尾部标记跨 delta 拆分）完整进入子代理块频道——原样透传、无注入分隔符")
    assert.ok(textJoin.includes("ADVISOR REVIEW round 1"), "advisor 评审开头同样可见")
    assert.ok(child.some((p) => p.chunk.kind === "think"), "advisor think 占位块透传（kind=think）")
    assert.ok(child.some((p) => p.chunk.kind === "tool"), "工具行照旧（kind=tool）")
    for (const p of child) {
      assert.ok(["text", "think", "tool", "start"].includes(p.chunk.kind), `转发不发明新 kind: ${p.chunk.kind}`)
    }
  } finally {
    _setConfigPathForTest(prevConfigPath)
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})


test("T-E16 (schema): subagent async 描述 = 角色级默认措辞；eng-coder 子代理的 subagent schema = 受限审计变体（role 仅 explore、无 async）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.parameters.properties.async.description
  assert.ok(d.includes("Default is role-level"), `async 描述含角色级默认: ${d}`)
  assert.ok(d.includes("role='eng-coder' → true"), `async 描述点名 eng-coder 默认 async: ${d}`)
  assert.ok(d.includes("async:false"), "async:false 显式覆盖路径在描述中")
  assert.ok(subagentTool.description.includes("Role-based default (§18)"), "工具描述 Async mode 段注明角色级默认")

  // 受限审计变体 wiring：depth>0 role=eng-coder 的 LLM 请求 schema（eng-coder 唯一 spawn 通道）
  const bodies = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      bodies.push(JSON.parse(body))
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "ok" } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        "data: [DONE]\n\n",
      )
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e16-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const out = await runAgent(
      { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      cwd, "implement", {}, undefined, true,
      {
        history: [], fullHistory: [], mcpServers: [], skills: [],
        engState: { enabled: true },
        engDesignReviewed: true,
        depth: 1, role: "eng-coder", maxTurns: 5,
      },
    )
    assert.equal(out, "ok")
    const sub = bodies[0].tools.find((t) => t.function.name === "subagent")
    assert.ok(sub, "eng-coder 子代理工具表含 subagent 受限变体")
    assert.deepEqual(sub.function.parameters.properties.role.enum, ["explore"], "role 枚举仅 explore")
    assert.equal(sub.function.parameters.properties.async, undefined, "async 参数已移除（同步强制——schema 层）")
    assert.equal(sub.function.parameters.properties.action, undefined, "§19 round2 #3: action 参数已移除（受限通道仅默认 spawn——schema 层）")
    assert.ok(sub.function.description.includes("AUDIT"), "受限描述点名审计用途")
    assert.ok(sub.function.description.includes("BLOCKING ONLY"), "受限描述声明同步")
    assert.ok(sub.function.description.includes("spawn-only"), "受限描述声明 spawn-only（§19 round2 #3）")
    assert.ok(!sub.function.description.includes("role capability matrix"), "受限变体不复用全量角色矩阵描述")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── §19 subagent 工具面合并：单工具四动作（AGENT-LOOP.md §19，T-M1..M17 VS Code 镜像）───
// 用例映射：T-M1 spawn 缺省零迁移 / T-M2..M4 check 迁移（既有 T3/T4/T12-14 已改 action:"check"
// 全绿） / T-M5..M10 status 非阻塞新用例 / T-M11 工具名消失 / T-M12 描述锚点 / T-M13 全回归
// （既有 §15/§17/§18 用例不改仍全绿）/ T-M14..M16 escalate 迁移（escalate.test.mjs）/ T-M17
// action 级门控（planMode + 批审批分组）/ 受限变体 action 门（round2 #3——镜像 T-E4/E5 的
// action 维度）。

test("T-M1: action 缺省 = spawn——不带 action 的既有 spawn 调用零迁移（阻塞 explore 回归）", async () => {
  const { server } = oneShotServer("explore report")
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m1-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const r = String(await subagentTool.execute({ task: "explore job", role: "explore" }, asyncCtx(parent, cwd)))
    assert.ok(r.includes("Subagent (explore) completed"), "缺省 action 走 spawn——报告返回")
    assert.equal(parent._asyncSubagents.size, 0, "未进 async 池")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M2..M4 (vscode mirror): check 迁移回归——既有 subagent_check 用例以 action:'check' 全绿", async () => {
  // 迁移本身在文件上方 T3/T4/T12-14（改 action:"check" 后原样通过）——此处补一条
  // 显式的"单工具可寻址"断言：spawn 返回的 id 直接喂给同一工具的 check/status。
  const { server } = await asyncChildServer(50)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m2-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    const fetched = JSON.parse(await subagentTool.execute({ action: "check", id: spawned.id, n: 1 }, ctx))
    assert.equal(fetched.id, spawned.id, "同一工具的 check 动作按 spawn id 取回")
    assert.equal(fetched.status, "done")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M5: status 指定 running id → 立即返回 running（不阻塞——主回合查进度不挂）", async () => {
  const { server } = await asyncChildServer(400)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m5-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    const t0 = Date.now()
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: spawned.id }, ctx))
    const elapsed = Date.now() - t0
    assert.equal(st.id, spawned.id)
    assert.equal(st.role, "coder")
    assert.equal(st.status, "running")
    assert.ok(elapsed < 300, `status 不等待子代理完成（elapsed=${elapsed}ms < 400ms 延迟）`)
    // 子代理继续在后台跑完（status 不消费不取消）
    await parent._asyncSubagents.get(spawned.id).settled
    assert.equal(parent._asyncSubagents.get(spawned.id).done, true, "status 后子代理照常 settle")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M6: status 指定 queued id → 返回 position", async () => {
  const { server } = await asyncChildServer(300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m6-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    for (let i = 1; i <= 4; i++) {
      await subagentTool.execute({ task: `slow task ${i}`, role: "coder", async: true }, ctx)
    }
    const fifth = spawnJson(await subagentTool.execute({ task: "slow task 5", role: "coder", async: true }, ctx))
    assert.equal(fifth.status, "queued", "第 5 个入队")
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: fifth.id }, ctx))
    assert.equal(st.status, "queued")
    assert.equal(st.position, 1, "position 随返回")
    // 收尾：等全部 settle，不悬挂 server
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M7: status 指定 done 未取 id（回合内 settle）→ done + 未取注记——不消费（随后 check 仍可取回）", async () => {
  const { server } = await asyncChildServer(0)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m7-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    const entry = parent._asyncSubagents.get(spawned.id)
    await entry.settled
    assert.equal(entry.done, true, "回合内 settle——done 条目仍留池（未取）")
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: spawned.id }, ctx))
    assert.equal(st.status, "done")
    assert.ok(st.note && st.note.includes("unconsumed"), "带未取注记")
    assert.ok(parent._asyncSubagents.has(spawned.id), "status 不消费——条目仍在池")
    const fetched = JSON.parse(await subagentTool.execute({ action: "check", id: spawned.id, n: 1 }, ctx))
    assert.equal(fetched.status, "done", "status 后 check 照常取回（n 从 1 开始——status 不动读数）")
    assert.match(fetched.report, /fast result/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M8: status 省略 id → 全部概览（running/queued/done 三类）", async () => {
  const { server } = await asyncChildServer(200)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m8-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    // done：快任务 settle 留池（未取）；running：慢任务延迟中
    const fast = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    await parent._asyncSubagents.get(fast.id).settled
    const slow = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    assert.equal(slow.status, "running")
    const ov = JSON.parse(await subagentTool.execute({ action: "status" }, ctx)).overview
    assert.ok(Array.isArray(ov.running) && Array.isArray(ov.queued) && Array.isArray(ov.done), "三类数组齐备")
    assert.ok(ov.running.includes(slow.id), "running 列出进行中 id")
    assert.ok(ov.done.includes(fast.id), "done 列出 settle 未取 id")
    assert.equal(ov.queued.length, 0)
    // 空池概览
    const doneAll = JSON.parse(await subagentTool.execute({ action: "check", id: fast.id, n: 1 }, ctx))
    assert.equal(doneAll.status, "done")
    await parent._asyncSubagents.get(slow.id).settled
    const ov2 = JSON.parse(await subagentTool.execute({ action: "status" }, ctx)).overview
    assert.deepEqual(ov2, { running: [], queued: [], done: [slow.id] }, "empty-pool overview 形状")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M9: status 未知 id → error（与 check 同——不消费不悬挂）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const parent = asyncParent(1)
  const ctx = asyncCtx(parent, process.cwd())
  const st = JSON.parse(await subagentTool.execute({ action: "status", id: 999 }, ctx))
  assert.equal(st.status, "error")
  assert.match(st.error, /unknown async subagent id: 999/)
  assert.equal(parent._asyncSubagents.size, 0)
})

test("T-M10: status 后接 check——n 计数不受 status 影响（只读查询零消耗零计数）", async () => {
  const { server } = await asyncChildServer(0)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m10-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const a = spawnJson(await subagentTool.execute({ task: "fast task a", role: "coder", async: true }, ctx))
    const b = spawnJson(await subagentTool.execute({ task: "fast task b", role: "coder", async: true }, ctx))
    const first = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(first.id, a.id)
    await parent._asyncSubagents.get(b.id).settled // 确定性：b 已 settle 留池（未取）
    // 两轮 status（带 id + 概览）夹在两次 check 之间
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: b.id }, ctx))
    assert.equal(st.status, "done")
    await subagentTool.execute({ action: "status" }, ctx)
    const second = JSON.parse(await subagentTool.execute({ action: "check", n: 2 }, ctx))
    assert.equal(second.id, b.id, "status 未消耗第二项、未扰乱 n 计数")
    assert.equal(parent._asyncCheckN, 2)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M11: subagent_check / escalate 工具名消失——单工具 subagent 四动作 schema（T-M11）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const mod = await import("../src/agent-tools/subagent.mjs")
  assert.equal(mod.subagentCheckTool, undefined, "subagentCheckTool 导出消失")
  assert.equal((await import("../src/agent-tools/index.mjs")).escalateTool, undefined, "escalateTool 导出消失")
  const actionProp = subagentTool.parameters.properties.action
  assert.ok(actionProp, "schema 含 action 参数")
  assert.deepEqual(actionProp.enum, ["spawn", "check", "status", "escalate"], "四动作枚举")
  assert.equal(subagentTool.parameters.required, undefined, "required 移出 schema——按动作在 execute 内校验（spawn 需 task+role / check 需 n / escalate 需 task）")
  assert.ok(subagentTool.parameters.properties.n.description.includes("(check — required)"), "n 的专属语义在参数描述中（check 必填）")
  assert.ok(subagentTool.parameters.properties.id.description.includes("(check/status)"), "id 的 check/status 语义在参数描述中")
  assert.equal(typeof subagentTool.isReadonlyAction, "function", "action 级只读分类钩子存在")
  assert.equal(subagentTool.isReadonlyAction({ action: "check" }), true)
  assert.equal(subagentTool.isReadonlyAction({ action: "status" }), true)
  assert.equal(subagentTool.isReadonlyAction({ action: "spawn" }), false, "spawn 非只读")
  assert.equal(subagentTool.isReadonlyAction({ action: "escalate" }), false, "escalate 非只读")
  assert.equal(subagentTool.isReadonlyAction({}), false, "缺省（spawn）非只读")
})

test("T-M12: 描述引导——四动作 + 查进度用 status（check 会阻塞）防误用", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.description
  assert.ok(d.includes("FOUR actions"), "四动作总述")
  assert.ok(/action parameter picks/.test(d), "action 参数引导")
  assert.ok(d.includes("check BLOCKS until the target finishes"), "check 阻塞显式警告（防 §19 触发场景重演）")
  assert.ok(d.includes("NON-BLOCKING progress query"), "status 非阻塞定位")
  assert.ok(d.includes("action:'check' blocks until the target finishes"), "async 段重复阻塞警告（查进度用 status）")
  assert.ok(d.includes("飞刀"), "escalate 中文别名在描述中（触发词条款）")
  assert.ok(d.includes("action:'escalate' directly"), "触发词 → 直接调 action:'escalate'")
  assert.ok(d.includes("Not available in engineering mode"), "escalate 工程模式禁用提示保留")
})

test("T-M17a: action 级门控——planMode 下 status/check 放行（readonly 分类）vs spawn/escalate 拒绝", async () => {
  const { executeToolBatches } = await import("../src/agent/execute-tools.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const executed = []
  const spyTool = (name) => ({ name, readonly: false, execute: async (args) => { executed.push(name + ":" + JSON.stringify(args)); return "ran:" + name } })
  const writeTool = spyTool("write")
  const agent = {
    _role: null, _planMode: true,
    config: { agent: { engineering: false } },
    _touchedFiles: [], _mutatedThisRun: false, _calledAdvisorThisRun: false,
    _verifiedThisRun: false, _verifyPassed: undefined, _advisorRound: 0,
  }
  const history = []
  const toolByName = new Map([["write", writeTool], ["subagent", subagentTool], ["read", { name: "read", readonly: true, execute: async () => { executed.push("read"); return "ok" } }]])
  const calls = [
    { id: "1", name: "subagent", arguments: JSON.stringify({ action: "status" }) }, // 放行（只读）
    { id: "2", name: "subagent", arguments: JSON.stringify({ action: "check", n: 1 }) }, // 放行（只读）
    { id: "3", name: "subagent", arguments: JSON.stringify({ action: "spawn", task: "x", role: "explore" }) }, // 拒绝
    { id: "4", name: "subagent", arguments: JSON.stringify({ action: "escalate", task: "x" }) }, // 拒绝
    { id: "5", name: "write", arguments: JSON.stringify({ path: "x" }) }, // 拒绝（对照）
  ]
  await executeToolBatches(agent, {
    response: { toolCalls: calls }, history, fullHistory: [],
    toolByName, getAuto: () => false, callbacks: {}, signal: undefined, cwd: process.cwd(), recentSigs: [], depth: 0,
  })
  const contents = history.filter((m) => m.role === "tool").map((m) => m.content)
  const blocked = contents.filter((c) => c.includes("plan mode active"))
  assert.equal(blocked.length, 3, "spawn/escalate/write 被 planMode 拦（status/check 不计入）")
  assert.ok(contents.some((c) => c.includes('"overview"')), "status 放行并返回概览")
  assert.ok(contents.some((c) => c.includes('"done":true')), "check（空池）放行并返回 done:true")
})

test("T-M17b: 混合 action 批次批审批按 action 分组——check/status 不入审批组（免询问）", async () => {
  const { executeToolBatches } = await import("../src/agent/execute-tools.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const executed = []
  const writeTool = { name: "write", readonly: false, execute: async () => { executed.push("write"); return "ok" } }
  const agent = {
    _role: null, _planMode: false,
    config: { agent: { engineering: false, consultModels: [{ provider: "kimi", model: "kimi-k3" }] } },
    _touchedFiles: [], _mutatedThisRun: false, _calledAdvisorThisRun: false,
    _verifiedThisRun: false, _verifyPassed: undefined, _advisorRound: 0,
  }
  const history = []
  const batchAsks = []
  const singleAsks = []
  const toolByName = new Map([
    ["write", writeTool],
    ["subagent", subagentTool],
  ])
  const calls = [
    { id: "1", name: "subagent", arguments: JSON.stringify({ action: "status" }) },
    { id: "2", name: "write", arguments: JSON.stringify({ path: "x.mjs", content: "x" }) },
    { id: "3", name: "subagent", arguments: JSON.stringify({ action: "check", n: 1 }) },
  ]
  await executeToolBatches(agent, {
    response: { toolCalls: calls }, history, fullHistory: [],
    toolByName, getAuto: () => false, depth: 0,
    callbacks: {
      onBatchPermissionRequest: async ({ tools }) => { batchAsks.push(tools.map((t) => t.name)); return "approveAll" },
      onPermissionRequired: async () => { singleAsks.push("single"); return true },
    },
    signal: undefined, cwd: process.cwd(), recentSigs: [],
  })
  // 单件 write 到达权限询问阶段 → 批聚合需 ≥2 项，走逐项通道；status/check 只读动作
  // 全程不入任何询问（T-M17 按 action 分组断言）
  assert.deepEqual(batchAsks, [], "不足 2 项不发起批询问")
  assert.deepEqual(singleAsks, ["single"], "仅 write 逐项询问一次——status/check 零询问")
  const contents = history.filter((m) => m.role === "tool").map((m) => m.content)
  assert.ok(contents.some((c) => c.includes('"overview"')), "status 执行")
  assert.ok(contents.some((c) => c.includes('"done":true')), "check 执行")
  assert.equal(executed.join(","), "write", "write 执行")
})

test("advisor#1: id 分配跨 runAgent 单调——遗留 running 池项 + 新 run spawn 不复用旧 id、不覆盖池条目", async () => {
  const { server } = await asyncChildServer(300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-id1-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    // run 1：spawn 慢 child（id 1，跑完后仍在池中未取）
    const parent1 = asyncParent(port)
    const r1 = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, asyncCtx(parent1, cwd)))
    assert.equal(r1.id, 1)
    const entry1 = parent1._asyncSubagents.get(1)
    // run 2：新 agent 对象（per-run 重建——_subIdCounter 清零）但共享同一 history 池
    const parent2 = asyncParent(port, { _asyncSubagents: parent1._asyncSubagents })
    const r2 = spawnJson(await subagentTool.execute({ task: "slow task 2", role: "coder", async: true }, asyncCtx(parent2, cwd)))
    assert.equal(r2.id, 2, "新 run spawn 在池内遗留 id 之上续号（不复用 1）")
    assert.equal(parent1._asyncSubagents.get(1), entry1, "run-1 条目未被覆盖（同对象引用）")
    assert.equal(parent1._asyncSubagents.size, 2, "两条目共存")
    // 两个 child 各按自身 id 取回（无错指）
    await Promise.allSettled([...parent1._asyncSubagents.values()].map((e) => e.settled))
    const ctx2 = asyncCtx(parent2, cwd)
    const a = JSON.parse(await subagentTool.execute({ action: "check", id: 1, n: 1 }, ctx2))
    assert.equal(a.id, 1)
    assert.match(a.report, /slow result/)
    const b = JSON.parse(await subagentTool.execute({ action: "check", id: 2, n: 2 }, ctx2))
    assert.equal(b.id, 2)
    assert.match(b.report, /slow result/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("advisor#1: nextSubagentId 单测——计数器 + 池内 max 双源取上界", async () => {
  const { nextSubagentId } = await import("../src/agent-tools/subagent-async.mjs")
  const parent = { _asyncSubagents: new Map() }
  assert.equal(nextSubagentId(parent), 1, "空池首号")
  assert.equal(nextSubagentId(parent), 2, "计数器续号")
  // 池内出现更高的遗留 id（跨 run 场景）→ 从池取上界
  parent._asyncSubagents.set(7, { status: "running" })
  assert.equal(nextSubagentId(parent), 8, "池内遗留 id 之上续号")
  assert.equal(nextSubagentId(parent), 9)
  // 无池（escalate-only 上下文也安全）
  assert.equal(nextSubagentId({}), 1)
})

test("advisor#3: check/status 容错字符串 id——模型原样回传工具返回的 id 不误报 unknown", async () => {
  const { server } = await asyncChildServer(0)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-idstr-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    await parent._asyncSubagents.get(spawned.id).settled
    // status 以字符串 id 查询 → 命中（done + 未取注记）
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: String(spawned.id) }, ctx))
    assert.equal(st.status, "done", "字符串 id 命中 done 条目")
    // check 以字符串 id 取回 → 命中（响应回显调用方原值——字符串进字符串出）
    const fetched = JSON.parse(await subagentTool.execute({ action: "check", id: String(spawned.id), n: 1 }, ctx))
    assert.equal(fetched.id, String(spawned.id))
    assert.equal(fetched.status, "done")
    // 非数字字符串 → 仍 unknown（不乱归一化）
    const junk = JSON.parse(await subagentTool.execute({ action: "status", id: "abc" }, ctx))
    assert.equal(junk.status, "error")
    assert.match(junk.error, /unknown async subagent id: abc/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("advisor#2: status queued position 实时计算——腾槽补位后不再报陈旧位置", async () => {
  const { server } = await asyncChildServer(150)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-pos-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    for (let i = 1; i <= 4; i++) {
      await subagentTool.execute({ task: `slow task ${i}`, role: "coder", async: true }, ctx)
    }
    const fifth = spawnJson(await subagentTool.execute({ task: "slow task 5", role: "coder", async: true }, ctx))
    const sixth = spawnJson(await subagentTool.execute({ task: "slow task 6", role: "coder", async: true }, ctx))
    assert.equal(sixth.status, "queued")
    let st6 = JSON.parse(await subagentTool.execute({ action: "status", id: sixth.id }, ctx))
    assert.equal(st6.position, 2, "入队时位置 2")
    // 一个 running settle → 队列头部（5th）补位启动 → 6th 位置应实时变 1
    await parent._asyncSubagents.get(1).settled
    for (let i = 0; i < 50 && parent._asyncSubagents.get(fifth.id)?.status === "queued"; i++) {
      await new Promise((r) => setTimeout(r, 20))
    }
    assert.equal(parent._asyncSubagents.get(fifth.id).status, "running", "5th 已补位")
    st6 = JSON.parse(await subagentTool.execute({ action: "status", id: sixth.id }, ctx))
    assert.equal(st6.status, "queued")
    assert.equal(st6.position, 1, "补位后 position 实时更新为 1（非陈旧快照 2）")
    const ov = JSON.parse(await subagentTool.execute({ action: "status" }, ctx)).overview
    assert.deepEqual(ov.queued, [{ id: sixth.id, position: 1 }], "概览 queued 同样实时")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("受限变体 action 门（round2 #3）：eng-coder 子代理内 escalate/check/status 动作工具层拒绝（镜像 T-E4/E5 的 action 维度）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = engChildCtx(1, process.cwd())
  for (const args of [
    { action: "escalate", task: "x" },
    { action: "check", n: 1 },
    { action: "status" },
  ]) {
    await assert.rejects(
      subagentTool.execute(args, ctx),
      /spawn-only/,
      `eng-coder 受限通道内 action:'${args.action}' 必须拒绝（仅 spawn 放行）`,
    )
  }
  assert.equal(ctx.agent._engAuditSpawns, undefined, "拒绝的动作不计入审计尝试数")
  assert.equal(ctx.agent._asyncCheckN, 0, "check 未执行——n 读数保持初始值未被触碰")
  assert.equal(ctx.agent._asyncSubagents.size, 0, "check/status 未消费/查询任何池项")
  // 非 eng-coder 深度上下文不受限：escalate 动作照常到达 handler（既有 depth 守卫错误字符串而非受限门错误）
  const coderChild = { _role: "coder", config: { agent: { engineering: false, consultModels: [] } }, _touchedFiles: [], _subIdCounter: 0 }
  const r = String(await subagentTool.execute({ action: "escalate", task: "x" }, { agent: coderChild, cwd: process.cwd(), depth: 1, callbacks: {} }))
  assert.ok(r.includes("only available at depth 0"), "depth>0 非 eng-coder → escalate 既有 depth 守卫语义（非受限门——消息不同）")
})

