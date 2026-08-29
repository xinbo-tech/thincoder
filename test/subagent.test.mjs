/**
 * subagent.test.mjs — subagent provider override (model arg) resolution.
 */
import { test } from "node:test"
import assert from "node:assert/strict"

test("resolveChildProvider: provider:model / provider name / model name / null", async () => {
  const { resolveChildProvider } = await import("../src/agent-tools/subagent.mjs")
  const parent = {
    provider: { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "glm-key" },
    config: {
      providersList: [
        { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "glm-key" },
        { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "ds-key" },
      ],
    },
  }
  // null → inherit parent
  assert.deepEqual(resolveChildProvider(parent, null), parent.provider)
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
  assert.equal(mn.baseURL, parent.provider.baseURL)
  assert.equal(mn.apiKey, "glm-key")
  // unknown provider name in provider:model → throw
  assert.throws(() => resolveChildProvider(parent, "nope:model"), /unknown provider/)
})

test("resolveChildProvider: env keys are NOT picked up (config-only)", async () => {
  const { resolveChildProvider } = await import("../src/agent-tools/subagent.mjs")
  const parent = {
    provider: { name: "glm", baseURL: "x", model: "glm-5.2", apiKey: "k" },
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
  assert.equal(effectiveSubagentModel(parent, "explore", undefined), "global-model")
  const bare = { config: { agent: {} } }
  assert.equal(effectiveSubagentModel(bare, "coder", null), null, "null = inherit parent")
})

test("buildChildRunOpts: propagates the parent abort signal to the child", async () => {
  const { buildChildRunOpts } = await import("../src/agent-tools/subagent.mjs")
  const ctrl = new AbortController()
  const opts = buildChildRunOpts({
    depth: 2,
    signal: ctrl.signal,
    agent: { config: { agent: { subagentTurns: 42 } } },
  })
  assert.equal(opts.depth, 3, "depth increments")
  assert.equal(opts.maxTurns, 42, "subagentTurns from config")
  assert.equal(opts.signal, ctrl.signal, "parent signal passed to the child — Ctrl+C must abort the child's LLM calls")
})

test("buildChildRunOpts: no parent signal → null (child runs unbounded by interrupt)", async () => {
  const { buildChildRunOpts } = await import("../src/agent-tools/subagent.mjs")
  const opts = buildChildRunOpts({ depth: 0, agent: { config: { agent: {} } } })
  assert.equal(opts.signal, null)
})

// ─── turn-cap continue (TURN-CAP-CONTINUE.md): every wall prompts, unlimited ───

import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"

const noopRead = { name: "read", description: "read a file", parameters: { type: "object", properties: {} }, readonly: true, execute: async () => "ok" }

/** Fake SSE LLM: the first `walls` calls demand the read tool (loop), then it answers. */
function wallServer(walls) {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const toolFrame = { choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: "t1", function: { name: "read", arguments: JSON.stringify({ path: "x" }) } }] } }] }
      const finishToolFrame = { choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] }
      const stopFrame = { choices: [{ index: 0, delta: { content: "child done " + "x".repeat(220) } }] }
      const finishStopFrame = { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] }
      const frames = calls.n <= walls
        ? `data: ${JSON.stringify(toolFrame)}\n\ndata: ${JSON.stringify(finishToolFrame)}\n\n`
        : `data: ${JSON.stringify(stopFrame)}\n\ndata: ${JSON.stringify(finishStopFrame)}\n\n`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames + "data: [DONE]\n\n")
    })
  })
  return { server, calls }
}

test("subagent tool: turn-cap walls prompt Continue — resume completes with fresh budget", async () => {
  const { server, calls } = wallServer(3)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-sub-"))
  try {
    const { createAgent } = await import("../src/agent.mjs")
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "deepseek-v4-pro" },
      tools: [noopRead],
      config: { agent: { subagentTurns: 3 } },
      cwd,
    })
    const asks = []
    const r = String(await subagentTool.execute({ task: "loop until the cap", role: "coder" }, {
      agent: parent, cwd, callbacks: {},
      onPermissionRequest: async (name, args) => { asks.push([name, args]); return true },
    }))
    assert.equal(calls.n, 4, "3 loop calls hit the cap, the resumed run finished on the 4th")
    assert.deepEqual(asks, [["continue", { turns: 3, agent: "coder#1" }]], "continue asked via the permission channel")
    assert.ok(r.includes("child done"), `resume completes normally — got: ${JSON.stringify(r.slice(0, 300))}`)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("subagent tool: user declines at the wall → partial-work return, no resume", async () => {
  const { server, calls } = wallServer(999)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-sub-"))
  try {
    const { createAgent } = await import("../src/agent.mjs")
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "deepseek-v4-pro" },
      tools: [noopRead],
      config: { agent: { subagentTurns: 3 } },
      cwd,
    })
    const r = String(await subagentTool.execute({ task: "loop until the cap", role: "coder" }, {
      agent: parent, cwd, callbacks: {},
      onPermissionRequest: async () => false,
    }))
    assert.equal(calls.n, 3, "hit the cap and stopped — no resumed run")
    assert.ok(r.includes("stopped: turn cap reached"), "partial-work message names the cap")
    assert.ok(r.includes("Partial output"), "partial output included")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})


// ─── variant roles fail closed (coder-leak fix, 2026-08-25) ─────────────────────
// Exact-string mode gates let "Coder"/" coder" slip through BOTH gates into a full-write
// child. Unknown roles now throw before any mode check. (CLI parity with the plugin.)
test("variant roles fail closed — coder leak fix (2026-08-25)", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const makeCtx = (engineering) => ({
    agent: { config: { agent: { engineering } }, _touchedFiles: [], history: [], cwd: process.cwd() },
    cwd: process.cwd(), callbacks: {}, depth: 0,
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
  // Exact roles keep their mode-gate semantics
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
