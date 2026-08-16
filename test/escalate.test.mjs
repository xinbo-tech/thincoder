/**
 * escalate.test.mjs — 飞刀 (ESCALATE.md), CLI edition.
 * The child runner signature is CLI's runAgent(childAgent, input, callbacks, opts).
 * Mutations merge via the child AGENT object (not a state sink).
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
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

  it("turn-cap exhaustion reads as partial work (ContinueError), not an error", async () => {
    const agent = makeAgent(CONSULTS)
    const { ContinueError } = await import("../src/agent.mjs")
    const runner = async () => { throw new ContinueError(100) }
    const r = await escalateTool.execute({ task: "x" }, makeCtx(agent, runner))
    assert.ok(String(r).includes("stopped: turn cap reached"))
    assert.ok(String(r).includes("Partial output"))
  })

  it("wall-clock watchdog: a stuck escalate settles as a timeout, not a hang", async () => {
    const agent = makeAgent(CONSULTS)
    agent.config.agent.consultTimeoutMs = 100
    const runner = async (childAgent, input, callbacks, opts) => {
      await new Promise((resolve, reject) => {
        opts.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })
      })
      return "never"
    }
    const r = await escalateTool.execute({ task: "x" }, makeCtx(agent, runner))
    assert.ok(String(r).includes("timed out after"), "reads as timeout")
  })
})
