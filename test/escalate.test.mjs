/**
 * escalate.test.mjs — 飞刀 (ESCALATE.md), CLI edition.
 * The child runner signature is CLI's runAgent(childAgent, input, callbacks, opts).
 * Mutations merge via the child AGENT object (not a state sink).
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { join } from "node:path"
import { escalateTool } from "../src/agent-tools/escalate.mjs"

const CONSULTS = [
  { provider: "kimi", model: "kimi-k3", effort: "max" },
  { provider: "zhipu-plan", model: "glm-5.2", effort: "high" },
]

function makeAgent(models) {
  return {
    config: {
      agent: { consultModels: models, subagentTurns: 100, consultTimeoutMs: 600000 },
      providersList: [
        { name: "kimi", model: "default", apiKey: "k-kimi" },
        { name: "zhipu-plan", model: "default", apiKey: "k-glm" },
      ],
    },
    provider: { name: "kimi", model: "default", apiKey: "k-kimi" },
    tools: [{ name: "read", readonly: true }, { name: "write", readonly: false }],
    cwd: process.cwd(),
    _touchedFiles: [],
    _subIdCounter: 0,
  }
}

function makeCtx(agent, runner, depth = 0) {
  return { agent, cwd: process.cwd(), depth, runAgent: runner, callbacks: {} }
}

describe("escalate (飞刀, CLI)", () => {
  it("no consult models → error explaining the prerequisite", async () => {
    const r = await escalateTool.execute({ task: "x" }, makeCtx(makeAgent([])))
    assert.ok(String(r).includes("no escalate candidates"))
    assert.ok(String(r).includes("agent.consultModels"), "points at the right config")
  })

  it("delegates to the first consult model with configured effort, coder role, depth 1", async () => {
    const seen = []
    const runner = async (childAgent, input, callbacks, opts) => { seen.push({ child: childAgent, opts }); return "post-op report" }
    const r = await escalateTool.execute({ task: "hard refactor" }, makeCtx(makeAgent(CONSULTS), runner))
    assert.equal(seen.length, 1)
    assert.equal(seen[0].child.provider.name, "kimi", "default = first consult model")
    assert.equal(seen[0].child.provider.reasoningEffort, "max", "configured effort injected")
    assert.equal(seen[0].child.provider.model, "kimi-k3")
    assert.equal(seen[0].child._role, "coder", "full write path")
    assert.equal(seen[0].opts.depth, 1)
    assert.ok(String(r).includes("post-op report"))
  })

  it("model pick: explicit candidate used; unknown candidate rejected with the pool listed", async () => {
    const seen = []
    const runner = async (childAgent) => { seen.push(childAgent.provider.name); return "ok" }
    const ctx = makeCtx(makeAgent(CONSULTS), runner)
    await escalateTool.execute({ task: "x", model: "zhipu-plan:glm-5.2" }, ctx)
    assert.equal(seen[0], "zhipu-plan")
    const bad = await escalateTool.execute({ task: "x", model: "deepseek:deepseek-v4-pro" }, makeCtx(makeAgent(CONSULTS), runner))
    assert.ok(String(bad).includes("not a consult candidate"))
    assert.ok(String(bad).includes("kimi:kimi-k3"), "pool listed in the error")
  })

  it("depth guard: an escalate cannot fly in another escalate", async () => {
    const r = await escalateTool.execute({ task: "x" }, makeCtx(makeAgent(CONSULTS), async () => "never", 1))
    assert.ok(String(r).includes("only available at depth 0"))
  })

  it("engineering mode is a fail-closed backdoor guard", async () => {
    const agent = makeAgent(CONSULTS)
    agent.config.agent.engineering = true
    const r = await escalateTool.execute({ task: "x" }, makeCtx(agent, async () => "never"))
    assert.ok(String(r).includes("engineering mode is ON"))
  })

  it("activity relays to the parent under the escalate#<id>/ prefix", async () => {
    const relayed = []
    const runner = async (childAgent, input, callbacks) => {
      callbacks.onToken?.("writing...")
      callbacks.onToolCall?.("read", { path: "src/a.mjs" })
      return "report"
    }
    const ctx = makeCtx(makeAgent(CONSULTS), runner)
    ctx.callbacks = {
      onToken: (t) => relayed.push(["token", t]),
      onToolCall: (name, args) => relayed.push(["tool", name, args]),
    }
    const r = await escalateTool.execute({ task: "x" }, ctx)
    assert.ok(String(r).includes("report"))
    assert.ok(relayed.every(([kind, nameOrText]) => kind === "tool" ? nameOrText.startsWith("escalate#") : nameOrText.startsWith("escalate#")), "all relay entries carry the escalate# prefix")
    assert.ok(relayed.some(([kind, v]) => kind === "tool" && v.endsWith("/read")), "tool call relayed")
  })

  it("(a) escalate mutations reset the parent's verify/advisor convergence budget", async () => {
    const agent = makeAgent(CONSULTS)
    agent._verifiedThisRun = true
    agent._verifyPassed = true
    agent._calledAdvisorThisRun = true
    agent._advisorRound = 2
    agent._advisorSession = "sess-1"
    const runner = async (childAgent) => {
      childAgent._mutatedThisRun = true
      childAgent._touchedFiles = [join(process.cwd(), "src", "x.mjs")]
      return "post-op report"
    }
    const r = await escalateTool.execute({ task: "x" }, makeCtx(agent, runner))
    assert.ok(String(r).includes("post-op"))
    assert.equal(agent._verifiedThisRun, false, "fresh code invalidates the parent's prior verify — the surgery must not bypass the parent's gates")
    assert.equal(agent._verifyPassed, undefined)
    assert.equal(agent._calledAdvisorThisRun, false)
    assert.ok(agent._touchedFiles.some((f) => f.endsWith("x.mjs")), "touched files merged")
    assert.equal(agent._advisorRound, 2, "round counter survives (convergence cycle continues)")
  })

  it("(b) a failed surgery still merges whatever the child touched", async () => {
    const agent = makeAgent(CONSULTS)
    const runner = async (childAgent) => {
      childAgent._mutatedThisRun = true
      childAgent._touchedFiles = [join(process.cwd(), "src", "y.mjs")]
      throw new Error("mid-surgery crash")
    }
    const r = await escalateTool.execute({ task: "x" }, makeCtx(agent, runner))
    assert.ok(String(r).includes("error"))
    assert.ok(agent._touchedFiles.some((f) => f.endsWith("y.mjs")), "partial writes still merged")
  })

  it("user Stop propagates (AbortError rethrown, not swallowed)", async () => {
    const agent = makeAgent(CONSULTS)
    const runner = async (childAgent, input, callbacks, opts) => {
      await new Promise((resolve, reject) => {
        opts.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })
      })
      return "never"
    }
    const ctrl = new AbortController()
    const ctx = makeCtx(agent, runner)
    ctx.signal = ctrl.signal
    const p = escalateTool.execute({ task: "x" }, ctx)
    setTimeout(() => ctrl.abort(), 30)
    await assert.rejects(p, (e) => e.name === "AbortError", "user Stop propagates to the parent loop")
  })

  it("turn-cap exhaustion without a permission handler (headless) falls back to partial work", async () => {
    const agent = makeAgent(CONSULTS)
    const { ContinueError } = await import("../src/agent.mjs")
    let calls = 0
    const runner = async () => { calls++; throw new ContinueError(100) }
    const r = await escalateTool.execute({ task: "x" }, makeCtx(agent, runner))
    assert.equal(calls, 1, "no continue prompt possible → no resume attempted")
    assert.ok(String(r).includes("stopped: turn cap reached"))
    assert.ok(String(r).includes("(100 turns)"), "ContinueError.turn surfaced")
    assert.ok(String(r).includes("Partial output"))
  })

  it("user picks continue → child resumes from the wall (resume:true, task not re-injected, fresh budget)", async () => {
    const agent = makeAgent(CONSULTS)
    const { ContinueError } = await import("../src/agent.mjs")
    const seen = []
    const runner = async (childAgent, input, callbacks, opts) => {
      seen.push({ child: childAgent, input, resume: opts?.resume ?? false, maxTurns: opts?.maxTurns })
      if (seen.length === 1) throw new ContinueError(100)
      return "post-op report"
    }
    const asks = []
    const ctx = makeCtx(agent, runner)
    ctx.onPermissionRequest = async (name, args) => { asks.push([name, args]); return true }
    const r = await escalateTool.execute({ task: "hard refactor" }, ctx)
    assert.equal(seen.length, 2, "first run hit the wall, second run finished")
    assert.equal(seen[0].resume, false)
    assert.equal(seen[1].resume, true, "resumed run — runAgent does NOT re-inject the task text")
    assert.equal(seen[1].input, "hard refactor", "same input object passed; injection is skipped by resume:true")
    assert.equal(seen[1].child, seen[0].child, "same child agent — history preserved across the wall")
    assert.equal(seen[1].maxTurns, seen[0].maxTurns, "fresh full maxTurns budget per run")
    assert.deepEqual(asks, [["continue", { turns: 100, agent: "kimi:kimi-k3" }]], "continue asked once via the permission channel")
    assert.ok(String(r).includes("post-op report"))
    assert.ok(!String(r).includes("stopped"), "completed run is a normal post-op report")
  })

  it("user declines continue → partial work return, no resume", async () => {
    const agent = makeAgent(CONSULTS)
    const { ContinueError } = await import("../src/agent.mjs")
    let calls = 0
    const runner = async () => { calls++; throw new ContinueError(100) }
    const ctx = makeCtx(agent, runner)
    ctx.onPermissionRequest = async () => false
    const r = await escalateTool.execute({ task: "x" }, ctx)
    assert.equal(calls, 1, "declined → no resume run")
    assert.ok(String(r).includes("stopped: turn cap reached"))
    assert.ok(String(r).includes("Partial output"))
  })

  it("UNLIMITED continues: every wall prompts; the user's Stop ends it", async () => {
    const agent = makeAgent(CONSULTS)
    const { ContinueError } = await import("../src/agent.mjs")
    const resumes = []
    const runner = async (childAgent, input, callbacks, opts) => {
      resumes.push(opts?.resume ?? false)
      throw new ContinueError(100)
    }
    let asks = 0
    const ctx = makeCtx(agent, runner)
    // Never-ending walls: the user keeps choosing Continue — resumes are unlimited.
    // The 4th prompt answers Stop (the user's escape hatch), so the test terminates.
    ctx.onPermissionRequest = async () => { asks++; return asks < 4 }
    const r = await escalateTool.execute({ task: "x" }, ctx)
    assert.deepEqual(resumes, [false, true, true, true], "initial run + 3 resumed runs — no MAX_RESUMES cap")
    assert.equal(asks, 4, "every wall prompts (4 asks)")
    assert.ok(String(r).includes("stopped: turn cap reached"))
  })

  it("no wall-clock watchdog: parent signal passes through directly; turn cap is the only budget", async () => {
    const agent = makeAgent(CONSULTS)
    const ctrl = new AbortController()
    let seenSignal = null
    const runner = async (childAgent, input, callbacks, opts) => {
      seenSignal = opts?.signal ?? null
      await new Promise((resolve, reject) => {
        opts.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })
      })
      return "never"
    }
    const ctx = { ...makeCtx(agent, runner), signal: ctrl.signal }
    // Parent aborts mid-run → child run rejects with AbortError → escalate rethrows (user Stop)
    const pending = escalateTool.execute({ task: "x" }, ctx)
    // Wait until the child runner has captured the signal, then abort the parent
    await new Promise((r) => setTimeout(r, 30))
    assert.equal(seenSignal, ctrl.signal, "child receives the parent signal directly (no intermediate controller)")
    ctrl.abort()
    await assert.rejects(pending, (e) => e.name === "AbortError", "user Stop propagates as AbortError")
  })

  it("effort clamp: an out-of-enum pool effort is dropped instead of dying on takeoff", async () => {
    // kimi-k3's reasoningEffortEnum includes max — fine. A model whose enum lacks the
    // configured effort must NOT get it copied into provider.reasoningEffort (chat would throw).
    const agent = makeAgent([{ provider: "kimi", model: "qwen3.8-max", effort: "max" }])
    // qwen3.8-max enum = ["xhigh","high"] → "max" is out-of-enum
    let seenProvider = null
    const runner = async (childAgent) => { seenProvider = childAgent.provider; return "done" }
    const r = await escalateTool.execute({ task: "x" }, makeCtx(agent, runner))
    assert.ok(seenProvider, "child spawned")
    assert.equal(seenProvider.reasoningEffort, undefined, "out-of-enum effort NOT copied (would throw in chat)")
    assert.ok(String(r).includes("unsupported"), "result notes the fallback")
  })

  it("AUTO parity: parent.autoApprove reaches the child without onPermissionRequest (headless embed)", async () => {
    const agent = makeAgent(CONSULTS)
    agent.autoApprove = true
    let seenPermission = null
    const runner = async (childAgent, input, callbacks) => {
      seenPermission = callbacks?.onPermissionRequest ?? null
      return "done"
    }
    await escalateTool.execute({ task: "x" }, makeCtx(agent, runner))
    assert.equal(typeof seenPermission, "function", "permission resolver injected")
    assert.equal(await seenPermission("write", {}), true, "AUTO approves child writes")
  })

})
