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

import { mkdtempSync, rmSync } from "node:fs"
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
// and started failing that day; TTL'd tokens must never be baked into test files)
const realToken = await import("node:crypto").then(({ createHmac }) => {
  const exp = Date.now() + 24 * 3600 * 1000
  const sig = createHmac("sha256", "thincoder-default-secret").update(`c8721152-df45-4f7b-96f2-db877500f9ba:${exp}`).digest("hex").slice(0, 16)
  return `c8721152-df45-4f7b-96f2-db877500f9ba:${exp}:${sig}`
})

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
    const r = String(await subagentTool.execute({ task: "child", role: "eng-coder", designToken: realToken }, ctx))
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
    const rA = String(await subagentTool.execute({ task: "child", role: "eng-coder", designId: "id-a", designToken: tokenA }, makeCtx()))
    assert.ok(rA.includes("Subagent (eng-coder) completed"), "A 通过（按 designId 定位槽，不受镜像=tokenB 影响）")
    assert.ok(rA.includes("designId: id-a"), "A 交付报告回传 designId A（修正轮复用）")
    const rB = String(await subagentTool.execute({ task: "child", role: "eng-coder", designId: "id-b", designToken: tokenB }, makeCtx()))
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
    const r = await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx)
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
    const again = await subagentTool.execute({ task: "slow task 2", role: "coder", async: true }, ctx)
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
    const { subagentTool, subagentCheckTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const fast = await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx)
    const slow = await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx)
    assert.equal(fast.status, "running")
    assert.equal(slow.status, "running")
    // 无 id 检查：先完成先返回（快）
    const first = JSON.parse(await subagentCheckTool.execute({ n: 1 }, ctx))
    assert.equal(first.id, fast.id, "先返回快的")
    assert.equal(first.status, "done")
    assert.match(first.report, /fast result/)
    // 第二次：慢的
    const second = JSON.parse(await subagentCheckTool.execute({ n: 2 }, ctx))
    assert.equal(second.id, slow.id, "第二次返回慢的")
    assert.match(second.report, /slow result/)
    // 全消费 → done:true
    const done = JSON.parse(await subagentCheckTool.execute({ n: 3 }, ctx))
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
    const { subagentTool, subagentCheckTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx)
    await subagentTool.execute({ task: "slow task 2", role: "coder", async: true }, ctx)
    const r = JSON.parse(await subagentCheckTool.execute({ id: 2, n: 1 }, ctx))
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
      const r = await subagentTool.execute({ task: `queued task ${i}`, role: "coder", async: true }, ctx)
      spawned.push(r)
      assert.equal(r.status, "running", `第 ${i} 个 running`)
    }
    const fifth = await subagentTool.execute({ task: "queued task 5", role: "coder", async: true }, ctx)
    assert.equal(fifth.status, "queued", "第 5 个入队（不拒绝）")
    assert.equal(fifth.position, 1, "position=1")
    const sixth = await subagentTool.execute({ task: "queued task 6", role: "coder", async: true }, ctx)
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
    const { subagentTool, subagentCheckTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    // T12：未知 id
    const unknown = JSON.parse(await subagentCheckTool.execute({ id: 999, n: 1 }, ctx))
    assert.equal(unknown.status, "error")
    assert.match(unknown.error, /unknown async subagent id: 999/)
    // T14：乱序/重复 n——先消费一个，再传 n=1（非 lastN+1）
    await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx)
    await subagentTool.execute({ task: "fast task 2", role: "coder", async: true }, ctx)
    const first = JSON.parse(await subagentCheckTool.execute({ n: 1 }, ctx))
    assert.equal(first.status, "done")
    const dup = JSON.parse(await subagentCheckTool.execute({ n: 1 }, ctx))
    assert.equal(dup.status, "error")
    assert.equal(dup.error, "invalid read counter — pass n = lastN+1")
    const skip = JSON.parse(await subagentCheckTool.execute({ n: 3 }, ctx))
    assert.equal(skip.status, "error", "跳号 n=3（lastN=1）→ 拒绝")
    // T13：n 超限（> MAX_ASYNC_CHECKS=3）
    const over = JSON.parse(await subagentCheckTool.execute({ n: 4 }, ctx))
    assert.equal(over.status, "error")
    assert.equal(over.error, "check limit exceeded — use turn-end auto-wait for the rest")
    // 已消费 id → unknown（T12 补）
    const consumed = JSON.parse(await subagentCheckTool.execute({ id: first.id, n: 2 }, ctx))
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
    const r = await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx)
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
