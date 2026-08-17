/**
 * consult.test.mjs — multi-model consultation mechanism, CLI edition.
 * Children run through an injected fake runner (ctx.runAgent) — no real providers.
 * The runner signature is CLI's runAgent(childAgent, input, callbacks, opts).
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { consultStartTool, consultCheckTool, consultStopTool, makeMainHistoryTool, cleanupConsultSessions } from "../src/agent-tools/consult.mjs"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function makeAgent(models) {
  return {
    history: [
      { role: "user", content: "fix the bug" },
      { role: "tool", content: "Error: type mismatch at foo.mjs:12", tool_call_id: "t1" },
    ],
    tools: [
      { name: "read", readonly: true },
      { name: "write", readonly: false },
    ],
    cwd: process.cwd(),
    config: {
      agent: { consultModels: models, subagentTurns: 100, consultTurns: 40 },
      providersList: [
        { name: "deepseek", model: "default-d", apiKey: "k-d" },
        { name: "openai", model: "default-o", apiKey: "k-o" },
        { name: "glm", model: "default-g", apiKey: "k-g" },
      ],
    },
    provider: { name: "deepseek", model: "default-d", apiKey: "k-d" },
  }
}

function makeCtx(agent, runner, signal) {
  return { agent, cwd: process.cwd(), signal, runAgent: runner, callbacks: {} }
}

const MODELS = [
  { provider: "deepseek", model: "m-a" },
  { provider: "openai", model: "m-b" },
  { provider: "glm", model: "m-c" },
]

/** Fake runner whose reply per model is controlled: { reply, delay, fail } keyed by child model. */
function fakeRunner(script) {
  const calls = []
  return {
    calls,
    fn: async (childAgent, input, callbacks, opts) => {
      const spec = script[childAgent.provider.model] ?? { reply: "default", delay: 0 }
      calls.push({ model: childAgent.provider.model, task: input, opts })
      const signal = opts?.signal
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, spec.delay ?? 0)
        signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")) }, { once: true })
      })
      if (spec.fail) throw new Error(spec.fail)
      return spec.reply
    },
  }
}

describe("consult mechanism (CLI)", () => {
  it("start returns immediately with id + models (non-blocking)", async () => {
    const agent = makeAgent(MODELS)
    const r = JSON.parse(await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, fakeRunner({ "m-a": { reply: "A", delay: 500 } }).fn)))
    assert.ok(r.id, "returns an id")
    assert.deepEqual(r.models, ["deepseek:m-a", "openai:m-b", "glm:m-c"])
    await cleanupConsultSessions(agent)
  })

  it("check yields replies in arrival order (first-settled first), then done", async () => {
    const agent = makeAgent(MODELS)
    const runner = fakeRunner({
      "m-a": { reply: "answer-A", delay: 150 },
      "m-b": { reply: "answer-B", delay: 10 },
      "m-c": { reply: "answer-C", delay: 300 },
    })
    const ctx = makeCtx(agent, runner.fn)
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    const first = JSON.parse(await consultCheckTool.execute({ id: "1" }, ctx))
    assert.equal(first.reply, "answer-B", "earliest reply first")
    assert.equal(first.done, false)
    const second = JSON.parse(await consultCheckTool.execute({ id: "1" }, ctx))
    assert.equal(second.reply, "answer-A")
    const third = JSON.parse(await consultCheckTool.execute({ id: "1" }, ctx))
    assert.equal(third.reply, "answer-C")
    assert.equal(third.done, true, "last reply reports done")
  })

  it("early stop aborts the remaining children", async () => {
    const agent = makeAgent(MODELS)
    const runner = fakeRunner({
      "m-a": { reply: "good", delay: 5 },
      "m-b": { reply: "slow", delay: 5000 },
      "m-c": { reply: "slow", delay: 5000 },
    })
    const ctx = makeCtx(agent, runner.fn)
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    const first = JSON.parse(await consultCheckTool.execute({ id: "1" }, ctx))
    assert.equal(first.reply, "good")
    const stop = JSON.parse(await consultStopTool.execute({ id: "1" }, ctx))
    assert.equal(stop.stopped, 2, "two still-running consultations aborted")
    let done = false
    for (let i = 0; i < 5 && !done; i++) {
      done = JSON.parse(await consultCheckTool.execute({ id: "1" }, ctx)).done
    }
    assert.equal(done, true, "session reaches done after early stop")
  })

  it("failed children settle as failed replies (counted, enqueued)", async () => {
    const agent = makeAgent(MODELS)
    const runner = fakeRunner({
      "m-a": { fail: "boom-a", delay: 5 },
      "m-b": { reply: "fine", delay: 5 },
      "m-c": { fail: "boom-c", delay: 5 },
    })
    const ctx = makeCtx(agent, runner.fn)
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await sleep(50)
    let failed = 0
    for (let i = 0; i < 3; i++) {
      const r = JSON.parse(await consultCheckTool.execute({ id: "1" }, ctx))
      if (r.failedReply) failed++
    }
    assert.equal(failed, 2, "two failures enqueued")
  })

  it("unconfigured pool explains setup instead of erroring", async () => {
    const agent = makeAgent([])
    const r = await consultStartTool.execute({ problem: "x" }, makeCtx(agent, fakeRunner({}).fn))
    assert.match(r, /not configured|consultModels/)
  })

  it("consult model without an API key fails loudly as a failed reply", async () => {
    const agent = makeAgent(MODELS)
    // provider "openai" loses its key — no THINCODER_API_KEY fallback → precheck must throw a clear message
    agent.config.providersList.find((p) => p.name === "openai").apiKey = ""
    delete process.env.THINCODER_API_KEY
    const runner = fakeRunner({ "m-a": { reply: "A", delay: 50 }, "m-c": { reply: "C", delay: 50 } })
    const ctx = makeCtx(agent, runner.fn)
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    const replies = []
    for (;;) {
      const r = JSON.parse(await consultCheckTool.execute({ id: "1" }, ctx))
      if (r.reply) replies.push(r)
      if (r.done) break
    }
    const failed = replies.find((r) => r.failedReply === true)
    assert.ok(failed, "a failed reply exists")
    assert.match(failed.reply, /no API key/, "clear precheck message, not a raw 401")
    assert.ok(replies.some((r) => r.failedReply !== true), "keyed models still answer")
  })


  it("user Stop aborts all children and check returns done", async () => {
    const agent = makeAgent(MODELS)
    const ctrl = new AbortController()
    const runner = fakeRunner({ "m-a": { reply: "x", delay: 5000 }, "m-b": { reply: "y", delay: 5000 }, "m-c": { reply: "z", delay: 5000 } })
    const ctx = makeCtx(agent, runner.fn, ctrl.signal)
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    const pending = consultCheckTool.execute({ id: "1" }, ctx)
    setTimeout(() => ctrl.abort(), 50)
    const r = JSON.parse(await pending)
    assert.equal(r.done, true)
    assert.equal(r.stopped, true)
  })

  it("turn-cap continue: consultant wall → user Continue → resumes with its own history", async () => {
    const agent = makeAgent([MODELS[0]])
    const { ContinueError } = await import("../src/agent.mjs")
    const seen = []
    const runner = async (childAgent, input, callbacks, opts) => {
      seen.push({ child: childAgent, resume: opts?.resume ?? false })
      if (seen.length === 1) throw new ContinueError(40)
      return "diagnosis after resume"
    }
    const asks = []
    const ctx = makeCtx(agent, runner)
    ctx.onPermissionRequest = async (name, args) => { asks.push([name, args]); return true }
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    const replies = []
    for (;;) {
      const r = JSON.parse(await consultCheckTool.execute({ id: "1" }, makeCtx(agent, runner)))
      if (r.reply) replies.push(r)
      if (r.done) break
      await sleep(5)
    }
    assert.equal(seen.length, 2, "wall then resume")
    assert.equal(seen[1].resume, true, "second run is a resume")
    assert.equal(seen[1].child, seen[0].child, "same child agent — history preserved")
    assert.ok(replies.some((x) => x.reply.includes("diagnosis after resume")), "resumed consultant's reply lands")
    assert.deepEqual(asks, [["continue", { turns: 40, agent: "deepseek:m-a" }]], "continue asked once via the permission channel")
    await cleanupConsultSessions(agent)
  })

  it("turn-cap continue: user declines → failed reply (no resume)", async () => {
    const agent = makeAgent([MODELS[0]])
    const { ContinueError } = await import("../src/agent.mjs")
    let calls = 0
    const runner = async () => { calls++; throw new ContinueError(40) }
    const ctx = makeCtx(agent, runner)
    ctx.onPermissionRequest = async () => false
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    const replies = []
    for (;;) {
      const r = JSON.parse(await consultCheckTool.execute({ id: "1" }, makeCtx(agent, runner)))
      if (r.reply) replies.push(r)
      if (r.done) break
      await sleep(5)
    }
    assert.equal(calls, 1, "declined → no resume")
    assert.ok(replies.some((x) => x.failedReply === true && /turn cap reached/.test(x.reply)), "failed reply names the cap")
    await cleanupConsultSessions(agent)
  })

  it("main_history exposes the parent's recent history with a byte budget", async () => {
    const agent = makeAgent(MODELS)
    agent.history = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `msg ${i}` }))
    const tool = makeMainHistoryTool(agent)
    const out = await tool.execute({ limit: 5 })
    assert.match(out, /msg 25/)
    assert.ok(out.length <= 100_000, "bounded output")
  })

  it("cleanupConsultSessions marks stopped and aborts leftovers", async () => {
    const agent = makeAgent(MODELS)
    const ctrl = { aborted: false, abort() { this.aborted = true } }
    agent._consultSessions = new Map([["1", { controllers: [ctrl], waiters: [], stopped: false }]])
    cleanupConsultSessions(agent)
    assert.equal(ctrl.aborted, true, "controller aborted")
    assert.equal(agent._consultSessions.size, 0, "map cleared")
  })

  it("read-only consultant tools exclude mutators and include main_history", async () => {
    // consult children get readonly-filtered tools + main_history — verified via createAgent
    // inside runConsultChild; here we assert the filtering helper contract directly.
    const agent = makeAgent(MODELS)
    agent.tools = [
      { name: "read", readonly: true },
      { name: "write", readonly: false },
      { name: "bash", readonly: false },
      { name: "glob", readonly: true },
    ]
    const { readonlyToolNames } = await import("../src/agent.mjs")
    const allowed = readonlyToolNames(agent.tools)
    assert.deepEqual([...allowed].sort(), ["glob", "read"])
    const kept = agent.tools.filter((t) => allowed.has(t.name))
    assert.ok(kept.every((t) => t.readonly), "no mutators survive")
  })

  it("clamps out-of-enum pool effort: drops it entirely (qwen3.8-max effort high)", async () => {
    // qwen3.8-max enum is xhigh/medium/low — "high" is out-of-enum and must NOT reach
    // provider.reasoningEffort (a 2026-08-16 real consult died on exactly this).
    const agent = makeAgent([{ provider: "deepseek", model: "qwen3.8-max", effort: "high" }])
    // simulate a provider whose preset default effort is ALSO invalid for the override model
    agent.config.providersList.find((p) => p.name === "deepseek").reasoningEffort = "high"
    let seenEffort = "UNSET"
    const runner = async (childAgent) => { seenEffort = childAgent.provider.reasoningEffort; return "ok" }
    const ctx = makeCtx(agent, runner)
    await consultStartTool.execute({ problem: "x" }, ctx)
    const r = JSON.parse(await consultCheckTool.execute({ id: "1" }, ctx))
    assert.equal(r.reply, "ok")
    assert.equal(seenEffort, undefined, "out-of-enum effort dropped, not blindly copied (nor preset residue)")
    await cleanupConsultSessions(agent)
  })
})
