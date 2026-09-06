/**
 * consult.test.mjs — multi-model consultation mechanism, CLI edition (R17 —
 * AGENT-LOOP.md §25 D-R17a: consult_check RETIRED, full-session settle routes to
 * the _pendingConsultResults family stream → digest injection).
 * Children run through an injected fake runner (ctx.runAgent) — no real providers.
 * The runner signature is CLI's runAgent(childAgent, input, callbacks, opts).
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { consultStartTool, consultStopTool, makeMainHistoryTool, cleanupConsultSessions, composeConsultDigest, injectConsultResult } from "../src/agent-tools/consult.mjs"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Poll until pred holds (consult settles are async fire-and-forget). */
async function until(pred, what, timeoutMs = 3000) {
  const t0 = Date.now()
  for (;;) {
    if (pred()) return
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout waiting for: ${what}`)
    await sleep(5)
  }
}

function makeAgent(models, extra = {}) {
  return {
    history: [
      { role: "user", content: "fix the bug" },
      { role: "tool", content: "Error: type mismatch at foo.mjs:12", tool_call_id: "t1" },
    ],
    tools: [
      { name: "read", readonly: true },
      { name: "write", readonly: false },
    ],
    cwd: mkdtempSync(join(tmpdir(), "consult-test-")),
    config: {
      agent: { consultModels: models, subagentTurns: 100, consultTurns: 40 },
      providersList: [
        { name: "deepseek", model: "default-d", apiKey: "k-d" },
        { name: "openai", model: "default-o", apiKey: "k-o" },
        { name: "glm", model: "default-g", apiKey: "k-g" },
      ],
    },
    provider: { name: "deepseek", model: "default-d", apiKey: "k-d" },
    ...extra,
  }
}

function makeCtx(agent, runner, signal, callbacks = {}) {
  return { agent, cwd: agent.cwd, signal, runAgent: runner, callbacks }
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

const pendingConsult = (agent) => agent._pendingConsultResults ?? []
const sess = (agent, id) => agent._consultSessions?.get(String(id))

describe("consult mechanism (CLI) — R17 digest model", () => {
  it("start returns immediately with id + models (non-blocking) and registers a session", async () => {
    const agent = makeAgent(MODELS)
    const r = JSON.parse(await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, fakeRunner({ "m-a": { reply: "A", delay: 500 } }).fn)))
    assert.ok(r.id, "returns an id")
    assert.deepEqual(r.models, ["deepseek:m-a", "openai:m-b", "glm:m-c"])
    assert.ok(sess(agent, r.id), "session registered (cross-turn background)")
    assert.equal(sess(agent, r.id).pending, 3, "one runner per model")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("models param runs a subset (provider:model / provider / model) and errors on unknown selectors", async () => {
    const noop = async () => "ok"
    const start = (models) => consultStartTool.execute({ problem: "p", models }, makeCtx(makeAgent(MODELS), noop, undefined))

    assert.deepEqual(JSON.parse(await start(["openai:m-b"])).models, ["openai:m-b"], "provider:model selector")
    assert.deepEqual(JSON.parse(await start(["glm"])).models, ["glm:m-c"], "bare provider selector")
    assert.deepEqual(JSON.parse(await start(["m-a"])).models, ["deepseek:m-a"], "bare model selector")
    assert.deepEqual(JSON.parse(await start(["m-a", "glm"])).models, ["deepseek:m-a", "glm:m-c"], "multi-selector, pool order preserved")
    assert.deepEqual(JSON.parse(await start("glm")).models, ["glm:m-c"], "bare string coerced to [string]")

    const err = await start(["does-not-exist"])
    assert.match(err, /unknown consult model selector/, "unknown selector errors out")
    assert.match(err, /openai:m-b/, "lists valid choices")

    assert.deepEqual(
      JSON.parse(await consultStartTool.execute({ problem: "p" }, makeCtx(makeAgent(MODELS), noop, undefined))).models,
      ["deepseek:m-a", "openai:m-b", "glm:m-c"],
      "omitted models → full pool",
    )
  })

  it("T-R17a full settle routes the session to _pendingConsultResults with the digest text (N replies, per-model)", async () => {
    const agent = makeAgent(MODELS)
    const runner = fakeRunner({
      "m-a": { reply: "answer-A", delay: 40 },
      "m-b": { reply: "answer-B", delay: 10 },
      "m-c": { reply: "answer-C", delay: 80 },
    })
    const ctx = makeCtx(agent, runner.fn)
    const ack = JSON.parse(await consultStartTool.execute({ problem: "stuck" }, ctx))
    // partial settle: only the fast model has replied — nothing pending yet (T-R17k)
    await until(() => pendingConsult(agent).length === 0 && (sess(agent, ack.id)?.pending ?? 0) === 2, "two still pending")
    assert.equal(pendingConsult(agent).length, 0, "T-R17k partial settle → no pending entry")
    // full settle → moved to the family stream, session deregistered
    await until(() => pendingConsult(agent).length === 1, "full settle moves to pending")
    assert.equal(sess(agent, ack.id), undefined, "settled session leaves _consultSessions")
    const entry = pendingConsult(agent)[0]
    assert.equal(entry.role, "consult")
    assert.match(entry.report, /\[System reminder: consultation #1 finished — 3 of 3 models replied \(0 failed\)\]/, "digest title counts replies")
    assert.match(entry.report, /- \[deepseek:m-a\]: answer-A/, "reply A verbatim")
    assert.match(entry.report, /- \[openai:m-b\]: answer-B/, "reply B verbatim")
    assert.match(entry.report, /- \[glm:m-c\]: answer-C/, "reply C verbatim")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("round2 #7: partial/full failures annotated per model in the digest text", async () => {
    const agent = makeAgent([MODELS[0], MODELS[1]])
    const runner = fakeRunner({
      "m-a": { reply: "answer-A", delay: 5 },
      "m-b": { fail: "boom-b", delay: 15 },
    })
    await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, runner.fn))
    await until(() => pendingConsult(agent).length === 1, "full settle")
    const entry = pendingConsult(agent)[0]
    assert.match(entry.report, /2 of 2 models replied \(1 failed\)/, "title counts the failure")
    assert.match(entry.report, /- \[deepseek:m-a\]: answer-A/, "ok reply unmarked")
    assert.match(entry.report, /- \[openai:m-b\] \(failed\): \(consultation failed: boom-b\)/, "failed reply marked per model")
    // all-failed session still digests (the model must know nothing usable came back)
    const agent2 = makeAgent([MODELS[0], MODELS[1]])
    const runner2 = fakeRunner({ "m-a": { fail: "boom-a", delay: 5 }, "m-b": { fail: "boom-b", delay: 5 } })
    await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent2, runner2.fn))
    await until(() => pendingConsult(agent2).length === 1, "all-failed full settle")
    assert.match(pendingConsult(agent2)[0].report, /2 of 2 models replied \(2 failed\)/, "all-failed digest still delivered")
    await cleanupConsultSessions(agent)
    await cleanupConsultSessions(agent2)
    rmSync(agent.cwd, { recursive: true, force: true })
    rmSync(agent2.cwd, { recursive: true, force: true })
  })

  it("T-R17c consult_stop mid-run cancels: no pending entry, 'cancelled' ack, session deregisters at settle", async () => {
    const agent = makeAgent([MODELS[0], MODELS[1], MODELS[2]])
    const runner = fakeRunner({
      "m-a": { reply: "good", delay: 5 },
      "m-b": { reply: "slow", delay: 5000 },
      "m-c": { reply: "slow", delay: 5000 },
    })
    const ctx = makeCtx(agent, runner.fn)
    const ack = JSON.parse(await consultStartTool.execute({ problem: "stuck" }, ctx))
    await until(() => (sess(agent, ack.id)?.pending ?? 3) === 2, "fast model settled")
    const stop = JSON.parse(await consultStopTool.execute({ id: ack.id }, ctx))
    assert.equal(stop.abandoned, 2, "two still-running consultations aborted")
    assert.equal(stop.cancelled, true, "stop = cancel semantic")
    await until(() => pendingConsult(agent).length === 0 && sess(agent, ack.id) === undefined, "cancelled session never reaches pending")
    assert.equal(pendingConsult(agent).length, 0, "T-R17c cancelled → 不入 pending")
    assert.equal(agent.history.some((m) => String(m.content).includes("consultation #1 finished")), false, "no digest for a cancelled session")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("stop on an already-finished session errors (session left the map at settle)", async () => {
    const agent = makeAgent([MODELS[0]])
    const runner = fakeRunner({ "m-a": { reply: "A", delay: 5 } })
    const ctx = makeCtx(agent, runner.fn)
    const ack = JSON.parse(await consultStartTool.execute({ problem: "stuck" }, ctx))
    await until(() => pendingConsult(agent).length === 1, "full settle")
    const r = JSON.parse(await consultStopTool.execute({ id: ack.id }, ctx))
    assert.equal(r.error, "unknown consult id")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("settle wakes the suspension driver waiters (agent._asyncWaiters)", async () => {
    const agent = makeAgent([MODELS[0], MODELS[1]])
    let woke = 0
    agent._asyncWaiters = [() => { woke++ }]
    const runner = fakeRunner({ "m-a": { reply: "A", delay: 5 }, "m-b": { reply: "B", delay: 5 } })
    await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, runner.fn))
    await until(() => woke === 1, "full settle wakes the driver")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("per-child settle emits a ⟦ev⟧done block-freeze token under its relay key", async () => {
    const agent = makeAgent([MODELS[0], MODELS[1]])
    const tokens = []
    const runner = fakeRunner({ "m-a": { reply: "A", delay: 5 }, "m-b": { reply: "B", delay: 20 } })
    const ctx = makeCtx(agent, runner.fn, undefined, { onToken: (t) => tokens.push(t) })
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await until(() => pendingConsult(agent).length === 1, "full settle")
    const doneEvs = tokens.filter((t) => String(t).includes("⟦ev⟧done"))
    assert.equal(doneEvs.length, 2, "one freeze event per settled child")
    assert.ok(doneEvs.every((t) => /^consult#\d+\/⟦ev⟧done/.test(t)), "events carry the child relay key")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("T-R17a digest injection: run-start consume pushes the full reminder into history (XML-escaped)", async () => {
    const agent = makeAgent([MODELS[0], MODELS[1]])
    const runner = fakeRunner({ "m-a": { reply: "A <raw> & text", delay: 5 }, "m-b": { fail: "boom", delay: 5 } })
    await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, runner.fn))
    await until(() => pendingConsult(agent).length === 1, "settle")
    const entry = pendingConsult(agent)[0]
    await injectConsultResult(agent, entry)
    pendingConsult(agent).splice(0, 1) // consumed = caller splices (agent.mjs run start)
    const injected = agent.history.find((m) => String(m.content ?? "").includes("consultation #1 finished"))
    assert.ok(injected, "digest reminder injected into history")
    assert.ok(!String(injected.content).includes("A <raw>"), "XML-escaped (no raw markup injection)")
    assert.match(String(injected.content), /A &lt;raw&gt; &amp; text/, "escaped reply content")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("T-R17l oversized verdicts offload with a preview + path (N1 guard), not a raw dump", async () => {
    const agent = makeAgent([MODELS[0]])
    const big = "B ".repeat(80_000)
    const runner = fakeRunner({ "m-a": { reply: big, delay: 5 } })
    await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, runner.fn))
    await until(() => pendingConsult(agent).length === 1, "settle")
    const entry = pendingConsult(agent)[0]
    await injectConsultResult(agent, entry)
    pendingConsult(agent).splice(0, 1)
    const injected = agent.history.find((m) => String(m.content ?? "").includes("consultation #1 finished"))
    assert.ok(injected, "digest injected")
    assert.ok(String(injected.content).length < big.length, "preview is not the raw dump")
    assert.match(String(injected.content), /full content saved to:/, "offload path surfaced")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("composeConsultDigest is a pure text builder (title + one annotated line per reply)", () => {
    const text = composeConsultDigest({
      id: "7", total: 2, failed: 1, terminated: 0, received: 1,
      replies: [
        { model: "deepseek:m-a", reply: "try X" },
        { model: "openai:m-b", reply: "(consultation failed: boom)", failed: true },
      ],
    })
    assert.match(text, /consultation #7 finished — 2 of 2 models replied \(1 failed\)/)
    assert.match(text, /- \[deepseek:m-a\]: try X/)
    assert.match(text, /- \[openai:m-b\] \(failed\): \(consultation failed: boom\)/)
  })

  it("T-R17b check retired: no consult_check export and zero description residue", async () => {
    const mod = await import("../src/agent-tools/consult.mjs")
    assert.equal(mod.consultCheckTool, undefined, "consult_check tool deleted")
    for (const t of [consultStartTool, consultStopTool]) {
      assert.ok(!JSON.stringify(t.description).includes("consult_check"), `no consult_check residue in ${t.name} description`)
    }
    // 描述面（main.md/discipline.md）零残留
    const mainMd = readFileSync(join(process.cwd(), "src", "prompts", "main.md"), "utf8")
    const discMd = readFileSync(join(process.cwd(), "src", "prompts", "discipline.md"), "utf8")
    assert.ok(!mainMd.includes("consult_check"), "main.md zero residue")
    assert.ok(!discMd.includes("consult_check"), "discipline.md zero residue")
  })

  it("failed children settle as failed replies (counted, annotated — no check loop needed)", async () => {
    const agent = makeAgent(MODELS)
    const runner = fakeRunner({
      "m-a": { fail: "boom-a", delay: 5 },
      "m-b": { reply: "fine", delay: 5 },
      "m-c": { fail: "boom-c", delay: 5 },
    })
    await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, runner.fn))
    await until(() => pendingConsult(agent).length === 1, "full settle")
    assert.match(pendingConsult(agent)[0].report, /3 of 3 models replied \(2 failed\)/, "2 failures counted")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("unconfigured pool explains setup instead of erroring", async () => {
    const agent = makeAgent([])
    const r = await consultStartTool.execute({ problem: "x" }, makeCtx(agent, fakeRunner({}).fn))
    assert.match(r, /not configured|consultModels/)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("consult model without an API key fails loudly as a failed reply (annotated in the digest)", async () => {
    const agent = makeAgent(MODELS)
    // provider "openai" loses its key — no THINCODER_API_KEY fallback → precheck must throw a clear message
    agent.config.providersList.find((p) => p.name === "openai").apiKey = ""
    delete process.env.THINCODER_API_KEY
    const runner = fakeRunner({ "m-a": { reply: "A", delay: 50 }, "m-c": { reply: "C", delay: 50 } })
    await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, runner.fn))
    await until(() => pendingConsult(agent).length === 1, "full settle")
    const report = pendingConsult(agent)[0].report
    assert.match(report, /no API key/, "clear precheck message, not a raw 401")
    assert.match(report, /- \[deepseek:m-a\]: A/, "keyed models still answer")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("user Stop (parent abort) cancels sessions — cleanup marks stopped, settles never digest", async () => {
    const agent = makeAgent(MODELS)
    const ctrl = new AbortController()
    const runner = fakeRunner({ "m-a": { reply: "x", delay: 5000 }, "m-b": { reply: "y", delay: 5000 }, "m-c": { reply: "z", delay: 5000 } })
    const ctx = makeCtx(agent, runner.fn, ctrl.signal)
    const ack = JSON.parse(await consultStartTool.execute({ problem: "stuck" }, ctx))
    assert.ok(sess(agent, ack.id), "session live")
    cleanupConsultSessions(agent)
    assert.equal(sess(agent, ack.id), undefined, "map cleared")
    await until(() => pendingConsult(agent).length === 0, "no digest from aborted children")
    assert.equal(pendingConsult(agent).length, 0, "abort → no digest")
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("turn-cap decline settles a failed reply — the digest annotates it (no resume without permission)", async () => {
    const agent = makeAgent([MODELS[0]])
    const { ContinueError } = await import("../src/agent.mjs")
    let calls = 0
    const runner = async () => { calls++; throw new ContinueError(40) }
    const ctx = makeCtx(agent, runner)
    ctx.onPermissionRequest = async () => false
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await until(() => pendingConsult(agent).length === 1, "full settle")
    assert.equal(calls, 1, "declined → no resume")
    assert.match(pendingConsult(agent)[0].report, /\(failed\): \(consultation failed: turn cap reached \(40 turns\)/, "failed reply names the cap")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
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
    await until(() => pendingConsult(agent).length === 1, "full settle")
    assert.equal(seen.length, 2, "wall then resume")
    assert.equal(seen[1].resume, true, "second run is a resume")
    assert.equal(seen[1].child, seen[0].child, "same child agent — history preserved")
    assert.match(pendingConsult(agent)[0].report, /diagnosis after resume/, "resumed consultant's answer lands in the digest")
    assert.deepEqual(asks, [["continue", { turns: 40, agent: "deepseek:m-a" }]], "continue asked once via the permission channel")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("main_history exposes the parent's recent history with a byte budget", async () => {
    const agent = makeAgent(MODELS)
    agent.history = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `msg ${i}` }))
    const tool = makeMainHistoryTool(agent)
    const out = await tool.execute({ limit: 5 })
    assert.match(out, /msg 25/)
    assert.ok(out.length <= 100_000, "bounded output")
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("cleanupConsultSessions marks stopped and aborts leftovers", async () => {
    const agent = makeAgent(MODELS)
    const ctrl = { aborted: false, abort() { this.aborted = true } }
    agent._consultSessions = new Map([["1", { controllers: [ctrl], stopped: false }]])
    cleanupConsultSessions(agent)
    assert.equal(ctrl.aborted, true, "controller aborted")
    assert.equal(agent._consultSessions.size, 0, "map cleared")
    rmSync(agent.cwd, { recursive: true, force: true })
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
    rmSync(agent.cwd, { recursive: true, force: true })
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
    await until(() => pendingConsult(agent).length === 1, "full settle")
    assert.equal(seenEffort, undefined, "out-of-enum effort dropped, not blindly copied (nor preset residue)")
    await cleanupConsultSessions(agent)
    rmSync(agent.cwd, { recursive: true, force: true })
  })

  it("T-R17a run-start wiring: real runAgent auto-turn consumes the consult family stream (injection at run 首行)", async () => {
    // localhost SSE fake provider（suspension-digest 同型）——runAgent auto-turn 开跑即注入
    const { createServer } = await import("node:http")
    const server = createServer((req, res) => {
      let body = ""
      req.on("data", (c) => (body += c))
      req.on("end", () => {
        const frames = `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "digested: 采纳甲建议" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(frames)
      })
    })
    await new Promise((r) => server.listen(0, "127.0.0.1", r))
    const port = server.address().port
    const cwd = mkdtempSync(join(tmpdir(), "consult-run-"))
    try {
      const { createAgent, runAgent } = await import("../src/agent.mjs")
      const agent = createAgent({
        provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
        tools: [], config: { agent: {} }, cwd, history: [],
      })
      // 会话已在挂起期 settle（settle 回调已移交独立族流——真实记账点）
      agent._pendingConsultResults = [{
        id: "c1", role: "consult",
        report: "[System reminder: consultation #c1 finished — 2 of 2 models replied (0 failed)]\n- [deepseek:m-a]: 甲建议\n- [openai:m-b]: 乙建议",
      }]
      const out = await runAgent(agent, "", {}, { autoTurn: true })
      assert.equal(out, "digested: 采纳甲建议")
      const injected = agent.history.find((m) => String(m.content ?? "").includes("consultation #c1 finished"))
      assert.ok(injected, "consult digest 在 auto-turn 开跑前注入")
      assert.match(String(injected.content), /- \[deepseek:m-a\]: 甲建议/, "全文注入")
      assert.equal(agent._pendingConsultResults.length, 0, "注入即消费")
      // 手动档动作域模板同注入（digest 整理禁写——无族例外——T-R17p 的 agent 级面）
      const domain = agent.history.find((m) => String(m.content ?? "").includes("auto-turn — background async subagents finished"))
      assert.ok(domain, "手动档消化动作域模板注入（同 advisor/subagent 族规则）")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})
