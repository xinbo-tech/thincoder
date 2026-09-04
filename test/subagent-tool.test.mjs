/**
 * subagent-tool.test.mjs — subagent tool surface — provider resolution / turn-cap / role modes / schema / description / design-token slots / action gating.
 *
 * Split from test/subagent.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { createServer } from "node:http"

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

test("subagent model `default` alias: ≡ omitted / empty string at every priority-chain level (case-insensitive)", async () => {
  const { resolveChildProvider, effectiveSubagentModel } = await import("../src/agent-tools/subagent.mjs")
  const parent = {
    _provider: { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "glm-key" },
    config: {
      providersList: [
        { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "glm-key" },
        { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "ds-key" },
      ],
      agent: { subagentModel: "global-model", subagentModels: { coder: "type-model" } },
    },
  }
  const bare = { _provider: parent._provider, config: { agent: {} } }
  for (const v of ["default", "DEFAULT", "Default"]) {
    // alias = "parameter-level not specified" → the chain still applies (type-level > global)
    assert.equal(effectiveSubagentModel(parent, "coder", v), "type-model", `type-level wins for "${v}"`)
    assert.equal(effectiveSubagentModel(parent, "explore", v), "global-model", `global fallback for "${v}"`)
    assert.equal(effectiveSubagentModel(bare, "coder", v), null, `no config → inherit parent for "${v}"`)
    assert.equal(effectiveSubagentModel(parent, "coder", v), effectiveSubagentModel(parent, "coder", null), `alias ≡ omitted at arg level for "${v}"`)
    // empty string ≡ omitted (locked — pre-existing falsy semantics)
    assert.equal(effectiveSubagentModel(parent, "coder", ""), effectiveSubagentModel(parent, "coder", null), '"" ≡ omitted')
    // resolver endpoint: alias ≡ null → parent provider, never a literal model name
    assert.deepEqual(resolveChildProvider(parent, v), parent._provider, `"${v}" → parent provider`)
    assert.deepEqual(resolveChildProvider(parent, v), resolveChildProvider(parent, null), `"${v}" ≡ null at the resolver`)
    assert.deepEqual(resolveChildProvider(parent, ""), resolveChildProvider(parent, null), '"" ≡ null at the resolver')
    assert.notEqual(resolveChildProvider(parent, v).model, "default", `no literal reaches the model field (specForModel guard)`)
    // composition (the spawn path): tool arg "default" ≡ omitted → identical resolved provider
    assert.deepEqual(
      resolveChildProvider(parent, effectiveSubagentModel(parent, "coder", v)),
      resolveChildProvider(parent, effectiveSubagentModel(parent, "coder", null)),
      `composition "${v}" ≡ omitted`,
    )
  }
  // a config chain value holding the literal resolves to the parent too (chain's last level)
  const cfgDefault = { _provider: parent._provider, config: { agent: { subagentModel: "default" } } }
  assert.equal(effectiveSubagentModel(cfgDefault, "coder", null), "default", "chain value passes through effectiveSubagentModel")
  assert.deepEqual(resolveChildProvider(cfgDefault, effectiveSubagentModel(cfgDefault, "coder", null)), parent._provider, "config literal default → parent provider (no specForModel hit)")
  // corner locked (advisor 🔵): TYPE-level literal + real global → parent provider —
  // the literal ends the chain, no fall-through to the global level
  const typeLit = { _provider: parent._provider, config: { agent: { subagentModel: "global-model", subagentModels: { coder: "default" } } } }
  assert.equal(effectiveSubagentModel(typeLit, "coder", null), "default", "type-level literal returned as-is by the chain")
  assert.deepEqual(resolveChildProvider(typeLit, effectiveSubagentModel(typeLit, "coder", null)), parent._provider, "type-level literal + real global → parent provider (no fall-through)")
  const typeLitUpper = { _provider: parent._provider, config: { agent: { subagentModel: "global-model", subagentModels: { coder: "DEFAULT" } } } }
  assert.deepEqual(resolveChildProvider(typeLitUpper, effectiveSubagentModel(typeLitUpper, "coder", null)), parent._provider, "uppercase type-level literal also → parent provider (case-insensitive)")
})

test("subagent model `default` alias: non-default values keep the existing semantics (negative)", async () => {
  const { resolveChildProvider, effectiveSubagentModel } = await import("../src/agent-tools/subagent.mjs")
  const parent = {
    _provider: { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "glm-key" },
    config: { providersList: [], agent: {} },
  }
  // non-default unknown single-segment → parent provider with the model swapped (unchanged)
  const mn = resolveChildProvider(parent, "deepseek-v4-flash")
  assert.equal(mn.name, "glm", "unknown single-segment keeps the parent provider")
  assert.equal(mn.model, "deepseek-v4-flash", "...with the model swapped — existing semantics untouched")
  assert.equal(effectiveSubagentModel(parent, "coder", "deepseek-v4-flash"), "deepseek-v4-flash", "non-default arg passes through unchanged")
  // provider:model / provider-name paths untouched
  assert.throws(() => resolveChildProvider(parent, "nope:model"), /unknown provider/)
  // only the literal "default" (post-toLowerCase) is aliased — near-misses stay swap-model values
  for (const near of [" default", "default ", "default-model", "defaulted"]) {
    assert.equal(resolveChildProvider(parent, near).model, near, `"${near}" is not aliased — swap-model semantics`)
  }
})


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
    "No git context injected",
    "delivery transparency table",
    "Mode filtering",
  ]) {
    assert.ok(d.includes(probe), `description missing "${probe}"`)
  }
  assert.ok(!d.includes("OVERRIDDEN"), "dev-comment leak: OVERRIDDEN in description")
  assert.ok(!d.includes("SETUP.MJS"), "internal impl path leaked into description")
  // §18.5 T-AG5 (2026-09-04): zero-git promise — the old "Receives git context
  // auto-injected" wording is DESCRIBING a capability the implementation never
  // had (the explore toolset has no git tool and no git context is injected) —
  // the description must not promise it.
  assert.ok(!d.includes("Receives git context auto-injected"), "stale git-context-injection promise must be gone")
  assert.ok(!d.includes("receives git context"), "git-injection promise residues must be gone")
  const roleDesc = subagentTool.parameters.properties.role.description
  assert.ok(!roleDesc.includes("OVERRIDDEN"), "role description leaks dev comment")
})

test("§18.5 T-AG3: plain explore/plan spawn input carries NO git context (lock the maintained no-injection)", async () => {
  // 现状维持 + 断言锁定：VS Code 的 childInput = task 原样（subagent.mjs runAgent
  // 传递点），无 collectGitContext/untrusted_git_context——本测试把"无注入"钉死，
  // 未来任何"补实现"都必须显式修改本断言（与设计 T-AG3 对应）。
  const bodies = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      bodies.push(body)
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "child done" } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        "data: [DONE]\n\n",
      )
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-ag3-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = {
      _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      config: {
        providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
        agent: { engineering: false },
      },
      _subIdCounter: 0,
    }
    for (const role of ["explore", "plan"]) {
      const r = String(await subagentTool.execute({ task: "inspect the module for issues", role }, { agent: parent, cwd, callbacks: {} }))
      assert.ok(r.includes(`Subagent (${role}) completed`), `${role} spawn completed`)
    }
    assert.equal(bodies.length, 2, "both child requests captured")
    for (const b of bodies) {
      const req = JSON.parse(b)
      const userText = (req.messages ?? [])
        .filter((m) => m.role === "user")
        .map((m) => (typeof m.content === "string" ? m.content : Array.isArray(m.content) ? m.content.map((p) => p?.text ?? "").join(" ") : ""))
        .join("\n")
      assert.ok(userText.includes("inspect the module for issues"), "child input is the task verbatim (no augmentation)")
      assert.ok(!userText.includes("untrusted_git_context"), "no CLI-style git context wrapper in child input")
      assert.ok(!userText.includes("Git context") && !userText.includes("git context"), "no git context text in child input")
      assert.ok(!userText.includes("git log") && !userText.includes("git diff"), "no git command promise in child input")
    }
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
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

test("T-M11: subagent_check / escalate 工具名消失——单工具 subagent 五动作 schema（T-M11 + §19.5）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const mod = await import("../src/agent-tools/subagent.mjs")
  assert.equal(mod.subagentCheckTool, undefined, "subagentCheckTool 导出消失")
  assert.equal((await import("../src/agent-tools/index.mjs")).escalateTool, undefined, "escalateTool 导出消失")
  const actionProp = subagentTool.parameters.properties.action
  assert.ok(actionProp, "schema 含 action 参数")
  assert.deepEqual(actionProp.enum, ["spawn", "check", "status", "cancel", "escalate"], "五动作枚举（§19.5 cancel 并入）")
  assert.equal(subagentTool.parameters.required, undefined, "required 移出 schema——按动作在 execute 内校验（spawn 需 task+role / check 需 n / escalate 需 task / cancel 需 id）")
  assert.ok(subagentTool.parameters.properties.n.description.includes("(check — required)"), "n 的专属语义在参数描述中（check 必填）")
  assert.ok(subagentTool.parameters.properties.id.description.includes("(check/status/cancel)"), "id 的 check/status/cancel 语义在参数描述中")
  assert.equal(typeof subagentTool.isReadonlyAction, "function", "action 级只读分类钩子存在")
  assert.equal(subagentTool.isReadonlyAction({ action: "check" }), true)
  assert.equal(subagentTool.isReadonlyAction({ action: "status" }), true)
  assert.equal(subagentTool.isReadonlyAction({ action: "spawn" }), false, "spawn 非只读")
  assert.equal(subagentTool.isReadonlyAction({ action: "escalate" }), false, "escalate 非只读")
  assert.equal(subagentTool.isReadonlyAction({ action: "cancel" }), false, "cancel 非只读（控制类——isControlAction）")
  assert.equal(subagentTool.isReadonlyAction({}), false, "缺省（spawn）非只读")
  assert.equal(typeof subagentTool.isControlAction, "function", "action 级控制类分类钩子存在（§19.5 round2 #4）")
  assert.equal(subagentTool.isControlAction({ action: "cancel" }), true)
  assert.equal(subagentTool.isControlAction({ action: "status" }), false)
  assert.equal(subagentTool.isControlAction({ action: "check" }), false)
  assert.equal(subagentTool.isControlAction({ action: "spawn" }), false)
  assert.equal(subagentTool.isControlAction({}), false)
})

test("T-M12: 描述引导——五动作 + 查进度用 status（check 会阻塞）防误用 + cancel 定位", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.description
  assert.ok(d.includes("FIVE actions"), "五动作总述（§19.5——cancel 并入）")
  assert.ok(/action parameter picks/.test(d), "action 参数引导")
  assert.ok(d.includes("check BLOCKS until the target finishes"), "check 阻塞显式警告（防 §19 触发场景重演）")
  assert.ok(d.includes("NON-BLOCKING progress query"), "status 非阻塞定位")
  assert.ok(d.includes("action:'check' blocks until the target finishes"), "async 段重复阻塞警告（查进度用 status）")
  assert.ok(d.includes("cancel — STOP one background async subagent"), "cancel 动作定位（定向中止——不经模型也可从 UI ⏹）")
  assert.ok(d.includes("id REQUIRED"), "cancel id 必填警告（防误全停）")
  assert.ok(d.includes("action:'cancel' (its id)"), "async 段 cancel 引导（停失控子代理）")
  assert.ok(d.includes("飞刀"), "escalate 中文别名在描述中（触发词条款）")
  assert.ok(d.includes("action:'escalate' directly"), "触发词 → 直接调 action:'escalate'")
  assert.ok(d.includes("Not available in engineering mode"), "escalate 工程模式禁用提示保留")
})

test("T-CL1: cancel description carries the cancel-verification anchor (last resort + verify alarming signals — fail-when-unchanged)", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.description
  assert.ok(d.includes("Cancel is a last resort: verify alarming signals with reliable checks (git/node — not guesses) first"), "T-CL1: last-resort + verify-first (reliable checks, not guesses)")
  assert.ok(d.includes("prefer scoped recovery (restore a single affected file) over killing the child"), "T-CL1: scoped recovery over killing the child")
  assert.ok(d.includes("a running child's in-flight work dies with it, partial changes stay unmerged and unaudited"), "T-CL1: in-flight dies with the child (§18 partial-never-merged)")
})

test("T-M17a: action 级门控——planMode 下 status/check/cancel 放行（readonly/控制类）vs spawn/escalate 拒绝", async () => {
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
    { id: "3", name: "subagent", arguments: JSON.stringify({ action: "cancel", id: 9 }) }, // 放行（控制类豁免——§19.5 round2 #4——planMode 允许取消既有子代理）
    { id: "4", name: "subagent", arguments: JSON.stringify({ action: "spawn", task: "x", role: "explore" }) }, // 拒绝
    { id: "5", name: "subagent", arguments: JSON.stringify({ action: "escalate", task: "x" }) }, // 拒绝
    { id: "6", name: "write", arguments: JSON.stringify({ path: "x" }) }, // 拒绝（对照）
  ]
  await executeToolBatches(agent, {
    response: { toolCalls: calls }, history, fullHistory: [],
    toolByName, getAuto: () => false, callbacks: {}, signal: undefined, cwd: process.cwd(), recentSigs: [], depth: 0,
  })
  const contents = history.filter((m) => m.role === "tool").map((m) => m.content)
  const blocked = contents.filter((c) => c.includes("plan mode active"))
  assert.equal(blocked.length, 3, "spawn/escalate/write 被 planMode 拦（status/check/cancel 不计入）")
  assert.ok(contents.some((c) => c.includes('"overview"')), "status 放行并返回概览")
  assert.ok(contents.some((c) => c.includes('"done":true')), "check（空池）放行并返回 done:true")
  assert.ok(contents.some((c) => c.includes("unknown async subagent id: 9")), "cancel 放行（控制类豁免——空池未知 id error 而非 planMode 拒绝）")
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

test("受限变体 action 门（round2 #3 + §19.5）：eng-coder 子代理内 escalate/check/status/cancel 动作工具层拒绝（镜像 T-E4/E5 的 action 维度）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = engChildCtx(1, process.cwd())
  for (const args of [
    { action: "escalate", task: "x" },
    { action: "check", n: 1 },
    { action: "status" },
    { action: "cancel", id: 1 }, // §19.5: cancel 同属 spawn-only 受限通道外动作——子代理上下文无 cancel 意义
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

test("T-M25-engine（审计 F4）: runChild forward 引擎级——eng-coder 内同步 explore spawn 的 chunk 带 sub 子标到达主会话；eng-coder 自身 chunk 不带", async () => {
  // 真实链路：主会话 spawn eng-coder（sync）→ eng-coder runAgent 内部 spawn explore
  // （受限审计变体）→ 内层 explore 文本经双层转发到主会话 onToolPanel：
  // 频道 sub:eng-coder#1 + chunk.sub === "explore#1"（D-M8 webview 子标渲染输入）。
  const token = await signedToken("f4f4f4f4-1111-4111-8111-0000000000f4", Date.now() + 24 * 3600 * 1000)
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      if (body.includes("Subagent (explore) completed")) {
        // eng-coder 第 2 回合（内层审计已回）→ 收尾
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "eng delivery done" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      } else if (body.includes("audit child task")) {
        // 内层 explore 审计子代理 → 文本报告（经双层转发）
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "AUDIT REPORT: clean" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      } else {
        // eng-coder 第 1 回合 → 调受限 subagent（explore 审计 spawn）
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "subagent", arguments: JSON.stringify({ task: "audit child task", role: "explore" }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m25e-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = engParent(port, token)
    const panels = []
    const ctx = { agent: parent, cwd, callbacks: { onToolPanel: (name, chunk) => panels.push({ name, chunk }) } }
    const r = String(await subagentTool.execute({ task: "child eng task", role: "eng-coder", designId: "eng", designToken: token, async: false }, ctx))
    assert.ok(r.includes("Subagent (eng-coder) completed"), "eng-coder 同步完成")
    const innerChunks = panels.filter((p) => p.chunk?.sub === "explore#1")
    assert.ok(innerChunks.length > 0, "内层 explore 活动经双层转发到达主会话且带子标")
    assert.ok(innerChunks.some((p) => p.chunk.text.includes("AUDIT REPORT")), "内层文本带 explore#1 子标（webview 渲染输入）")
    assert.ok(innerChunks.every((p) => p.name === "sub:eng-coder#1"), "外层频道 = eng-coder 块（首段路由不变——D-M8）")
    const ownChunks = panels.filter((p) => p.name === "sub:eng-coder#1" && (p.chunk?.sub ?? null) === null)
    assert.ok(ownChunks.some((p) => p.chunk.text.includes("eng delivery done")), "eng-coder 自身文本不带子标（own activity 不误标）")
    // 审计预算计数载体 = eng-coder 子代理自身 history（T-E7 覆盖）——此处不断言主会话
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M27c（advisor round 2 #5）: spawn 缺 task → 干净工具错误（required 移出 schema 的 execute 级校验补齐）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const parent = asyncParent(1)
  const ctx = asyncCtx(parent, process.cwd())
  await assert.rejects(
    subagentTool.execute({ role: "explore" }, ctx),
    /requires a task description/,
    "缺 task → 干净错误（不再带 undefined 输入跑子代理）",
  )
  await assert.rejects(
    subagentTool.execute({ task: "   ", role: "explore" }, ctx),
    /requires a task description/,
    "空白 task 同样拒绝",
  )
  assert.equal(parent._asyncSubagents.size, 0)
  assert.equal(parent._subIdCounter, 0, "拒绝不消耗 id")
})

test("T-M17c（§19.5.2b）: 手动档 auto-turn（digest）动作域——spawn 拒、cancel 放行（控制类豁免）", async () => {
  const { executeToolBatches } = await import("../src/agent/execute-tools.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const asks = []
  const pool = new Map([
    [7, { id: 7, role: "eng-coder", status: "running", done: false, cancelled: false,
         controller: { abort: () => { pool.get(7).aborted = true }, signal: { aborted: false } },
         _onCancelled: () => {}, _resolve: () => {} }],
  ])
  const history = []
  history._asyncSubagents = pool
  const agent = {
    _role: null, _planMode: false, _inAutoTurn: true, // 手动档 digest（§17 D-S7——deny-stub 阶段）
    config: { agent: { engineering: false } },
    _asyncSubagents: pool,
    history,
    _touchedFiles: [], _mutatedThisRun: false, _calledAdvisorThisRun: false,
    _verifiedThisRun: false, _verifyPassed: undefined, _advisorRound: 0,
  }
  const toolByName = new Map([["subagent", subagentTool]])
  const calls = [
    { id: "1", name: "subagent", arguments: JSON.stringify({ task: "digest spawn", role: "explore" }) }, // digest 禁 spawn（既有门）
    { id: "2", name: "subagent", arguments: JSON.stringify({ action: "cancel", id: 7 }) }, // 控制类放行——digest 内可中止失控子代理
  ]
  await executeToolBatches(agent, {
    response: { toolCalls: calls }, history, fullHistory: [],
    toolByName, getAuto: () => false, depth: 0,
    callbacks: {
      // §17 D-S7 手动档 digest：写权限/询问全部 deny-stub（panel-chat 装配）——cancel 不经过它
      onPermissionRequired: async () => { asks.push("permission"); return false },
      onBatchPermissionRequest: async () => { asks.push("batch"); return "deny" },
    },
    signal: undefined, cwd: process.cwd(), recentSigs: [],
  })
  const contents = history.filter((m) => m.role === "tool").map((m) => m.content)
  // §17 D-S7 手动档 digest：写/启类工具被 deny-stub 权限阶段拦下（panel-chat 装配——
  // spawn 逐项询问返回 false）——cancel 因控制类豁免跳过权限阶段照常执行
  assert.ok(contents.some((c) => c.includes("Denied by user (permission mode)")), "digest 禁 spawn（deny-stub 权限阶段——不含 cancel）")
  assert.ok(contents.some((c) => c.includes('"cancelled"')), "digest 内 cancel 执行（控制类豁免——可中止失控子代理）")
  assert.equal(pool.get(7).cancelled, true, "digest cancel 定向 abort 生效")
  assert.equal(pool.get(7).aborted, true)
  // 两个非只读调用只产生一次逐项询问（spawn 的 deny-stub）——cancel 零询问（控制类豁免）
  assert.deepEqual(asks, ["permission"], "cancel 不入询问（唯一 ask = spawn 的 deny-stub）")
})

test("§20.8 T-F1.5 (vscode): subagent files 参数描述含文件级锚句（fail-when-unchanged——目录声明不支持——不绕过冲突检测）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.parameters.properties.files.description
  assert.ok(
    d.includes("files must be file-level paths (one per file you will modify). Directory declarations are NOT supported — they bypass the conflict detector and are rejected with an error."),
    `T-F1.5: files 描述缺 §20.8 锚句——actual: ${d.slice(0, 160)}`
  )
})
