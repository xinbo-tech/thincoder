/**
 * escalate.test.mjs — 飞刀 (ESCALATE.md), CLI edition — §19 merged surface:
 * the escalate tool is retired; its semantics run as subagent action:"escalate"
 * (AGENT-LOOP.md §19 D-M4 — T-M14..M16 migration regression).
 * §25 D-R17b (R17): escalate is DEFAULT-ASYNC at depth 0 — the sync surface is
 * covered via explicit async:false (决策点 ③ 同步保留); the async family surface
 * (ack/池/排队/settle 三分类/digest) has its own block below.
 * The child runner signature is CLI's runAgent(childAgent, input, callbacks, opts).
 * Mutations merge via the child AGENT object (not a state sink).
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { join } from "node:path"
import { subagentTool } from "../src/agent-tools/subagent.mjs"

const CONSULTS = [
  { provider: "kimi", model: "kimi-k3", effort: "max" },
  { provider: "zhipu-plan", model: "glm-5.2", effort: "high" },
]

/** §19: escalate 语义经 subagent action:"escalate" 调用（既有 escalate 直接调用
 *  用例迁移——约束/前缀/术后报告全保留）。R17: 同步语义显式 async:false（缺省 async）。 */
function escalateExecute(args, ctx) {
  return subagentTool.execute({ action: "escalate", async: false, ...args }, ctx)
}

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
    history: [], // R17 async settle reminders pushReal into history
    _touchedFiles: [],
    _subIdCounter: 0,
  }
}

function makeCtx(agent, runner, depth = 0) {
  return { agent, cwd: process.cwd(), depth, runAgent: runner, callbacks: {} }
}

describe("escalate (飞刀, CLI)", () => {
  it("no consult models → error explaining the prerequisite", async () => {
    const r = await escalateExecute({ task: "x" }, makeCtx(makeAgent([])))
    assert.ok(String(r).includes("no escalate candidates"))
    assert.ok(String(r).includes("agent.consultModels"), "points at the right config")
  })

  it("delegates to the first consult model with configured effort, coder role, depth 1", async () => {
    const seen = []
    const runner = async (childAgent, input, callbacks, opts) => { seen.push({ child: childAgent, opts }); return "post-op report" }
    const r = await escalateExecute({ task: "hard refactor" }, makeCtx(makeAgent(CONSULTS), runner))
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
    await escalateExecute({ task: "x", model: "zhipu-plan:glm-5.2" }, ctx)
    assert.equal(seen[0], "zhipu-plan")
    const bad = await escalateExecute({ task: "x", model: "deepseek:deepseek-v4-pro" }, makeCtx(makeAgent(CONSULTS), runner))
    assert.ok(String(bad).includes("not a consult candidate"))
    assert.ok(String(bad).includes("kimi:kimi-k3"), "pool listed in the error")
  })

  it("depth guard: an escalate cannot fly in another escalate", async () => {
    const r = await escalateExecute({ task: "x" }, makeCtx(makeAgent(CONSULTS), async () => "never", 1))
    assert.ok(String(r).includes("only available at depth 0"))
  })

  it("engineering mode is a fail-closed backdoor guard", async () => {
    const agent = makeAgent(CONSULTS)
    agent.config.agent.engineering = true
    const r = await escalateExecute({ task: "x" }, makeCtx(agent, async () => "never"))
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
    const r = await escalateExecute({ task: "x" }, ctx)
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
    const r = await escalateExecute({ task: "x" }, makeCtx(agent, runner))
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
    const r = await escalateExecute({ task: "x" }, makeCtx(agent, runner))
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
    const p = escalateExecute({ task: "x" }, ctx)
    setTimeout(() => ctrl.abort(), 30)
    await assert.rejects(p, (e) => e.name === "AbortError", "user Stop propagates to the parent loop")
  })

  it("turn-cap exhaustion without a permission handler (headless) falls back to partial work", async () => {
    const agent = makeAgent(CONSULTS)
    const { ContinueError } = await import("../src/agent.mjs")
    let calls = 0
    const runner = async () => { calls++; throw new ContinueError(100) }
    const r = await escalateExecute({ task: "x" }, makeCtx(agent, runner))
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
    const r = await escalateExecute({ task: "hard refactor" }, ctx)
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
    const r = await escalateExecute({ task: "x" }, ctx)
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
    const r = await escalateExecute({ task: "x" }, ctx)
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
    const pending = escalateExecute({ task: "x" }, ctx)
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
    const r = await escalateExecute({ task: "x" }, makeCtx(agent, runner))
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
    await escalateExecute({ task: "x" }, makeCtx(agent, runner))
    assert.equal(typeof seenPermission, "function", "permission resolver injected")
    assert.equal(await seenPermission("write", {}), true, "AUTO approves child writes")
  })

  it("manual auto-turn digest refuses escalate (spawns a write child — §17 N3 机械拒绝；AUTO 放行)", async () => {
    const agent = makeAgent(CONSULTS)
    agent._inAutoTurn = true
    const runner = async () => { throw new Error("must not spawn") }
    const r = await escalateExecute({ task: "x" }, makeCtx(agent, runner))
    assert.ok(String(r).includes("cannot spawn subagents from a manual auto-turn"), "手动档 digest 拒 escalate（同 spawn 语义——不烧一轮专家）")
    agent.autoApprove = true
    const seen = []
    const runnerAuto = async (childAgent) => { seen.push(childAgent); return "done" }
    await escalateExecute({ task: "x" }, makeCtx(agent, runnerAuto))
    assert.equal(seen.length, 1, "AUTO 档 digest 放行 escalate（推进链授权）")
  })

})

// ═══════════════════════════════════════════════════════════════════════════
// §25 D-R17b (R17) — async 飞刀面：缺省 async ack / other 池共享槽位排队 /
// settle 三分类（done=merge-all+重叠警告 / error=partial merge 决策 / cancelled 不入
// pending）/ _pendingEscalateResults 独立流移交 / digest 注入形态
// ═══════════════════════════════════════════════════════════════════════════

function makeAsyncAgent(models, extra = {}) {
  const agent = makeAgent(models)
  return Object.assign(agent, {
    _asyncSubagents: new Map(),
    _asyncQueue: [],
    _asyncWaiters: [],
    _asyncTombstones: new Map(),
    _mutationSeq: 0,
    _mutLog: [],
    ...extra,
  })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function settleEntry(agent, id, timeoutMs = 3000) {
  const entry = agent._asyncSubagents.get(String(id))
  if (!entry) throw new Error(`no async entry #${id}`)
  const t0 = Date.now()
  while (!entry.done) {
    if (Date.now() - t0 > timeoutMs) throw new Error(`entry #${id} did not settle`)
    await sleep(5)
  }
  return entry
}

const absFile = (rel) => join(process.cwd(), rel)

describe("escalate async (§25 D-R17b)", () => {
  it("T-R17d default async: ack {id, role, running} — turn ends without the report", async () => {
    const agent = makeAsyncAgent(CONSULTS)
    const runner = async () => { await sleep(200); return "post-op report" }
    const r = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "hard refactor" }, makeCtx(agent, runner))))
    assert.equal(r.role, "escalate")
    assert.equal(r.status, "running")
    assert.ok(r.id, "ack carries the id")
    assert.ok(agent._asyncSubagents.has(String(r.id)), "entry pooled (other domain)")
    assert.equal(agent._asyncSubagents.get(String(r.id))._pool, "other", "escalate shares the other domain")
    await settleEntry(agent, r.id)
  })

  it("T-R17f explicit sync retained (async:false) — regression covered by the sync block above", async () => {
    const agent = makeAgent(CONSULTS)
    const runner = async () => "post-op report"
    const r = String(await subagentTool.execute({ action: "escalate", task: "x", async: false }, makeCtx(agent, runner)))
    assert.ok(r.includes("post-op report"), "async:false → synchronous post-op report")
  })

  it("T-R17e suspended settle: mutations merged at settle + entry moves to _pendingEscalateResults + digest body composed", async () => {
    const agent = makeAsyncAgent(CONSULTS)
    agent._suspended = true
    const runner = async (childAgent) => {
      childAgent._mutatedThisRun = true
      childAgent._touchedFiles = [absFile("src/x.mjs")]
      return "post-op body"
    }
    const r = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, makeCtx(agent, runner))))
    const entry = await settleEntry(agent, r.id)
    assert.equal(agent._asyncSubagents.has(String(r.id)), false, "settled entry left the pool")
    assert.equal(agent._pendingEscalateResults.length, 1, "independent family stream")
    assert.equal(agent._pendingEscalateResults[0], entry, "same entry object")
    assert.ok(agent._touchedFiles.some((f) => f.endsWith("x.mjs")), "mutations merged at settle (done = merge-all)")
    assert.ok(String(entry.report).includes("escalate (kimi:kimi-k3) post-op report"), "post-op body")
  })

  it("T-R17e (round2 #4): done settle with parent-side overlap — merge-all STILL happens + report-level warning", async () => {
    const agent = makeAsyncAgent(CONSULTS)
    agent._suspended = true
    const runner = async (childAgent) => {
      childAgent._mutatedThisRun = true
      childAgent._touchedFiles = [absFile("src/ov.mjs")]
      return "post-op body"
    }
    const r = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, makeCtx(agent, runner))))
    // parent mutates the same file while the flight runs (mutation log after the launch seq)
    agent._mutationSeq = 1
    agent._mutLog.push({ seq: 1, paths: [absFile("src/ov.mjs")] })
    const entry = await settleEntry(agent, r.id)
    assert.ok(agent._touchedFiles.some((f) => f.endsWith("ov.mjs")), "done branch merges ALL mutations regardless of overlap")
    assert.ok(String(entry.report).includes("Overlapping writes"), "overlap warning rides the report (report-level — not a gate)")
  })

  it("T-R17m error settle (child crash): partial mutations merged without parent overlap + error digest body", async () => {
    const agent = makeAsyncAgent(CONSULTS)
    agent._suspended = true
    const runner = async (childAgent) => {
      childAgent._mutatedThisRun = true
      childAgent._touchedFiles = [absFile("src/y.mjs")]
      throw new Error("mid-surgery crash")
    }
    const r = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, makeCtx(agent, runner))))
    const entry = await settleEntry(agent, r.id)
    assert.equal(agent._pendingEscalateResults.length, 1)
    assert.ok(agent._touchedFiles.some((f) => f.endsWith("y.mjs")), "error without overlap → partial merge")
    assert.ok(String(entry.error).includes("mid-surgery crash"), "error text composed")
    assert.ok(String(entry.error).includes("Partial changes merged into the parent's bookkeeping"), "merge decision noted")
  })

  it("T-R17m error settle WITH parent overlap: no merge + differences listed (decision stays with the model)", async () => {
    const agent = makeAsyncAgent(CONSULTS)
    agent._suspended = true
    const runner = async (childAgent) => {
      childAgent._mutatedThisRun = true
      childAgent._touchedFiles = [absFile("src/z.mjs")]
      throw new Error("mid-surgery crash")
    }
    const r = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, makeCtx(agent, runner))))
    agent._mutationSeq = 1
    agent._mutLog.push({ seq: 1, paths: [absFile("src/z.mjs")] })
    const entry = await settleEntry(agent, r.id)
    assert.ok(!agent._touchedFiles.some((f) => f.endsWith("z.mjs")), "overlap → NO merge")
    assert.ok(String(entry.error).includes("Partial changes NOT merged"), "decision noted")
    assert.ok(String(entry.error).includes("z.mjs"), "differences listed (relative display)")
  })

  it("T-R17i cancel: running escalate → cancelled settle — not in pending, stopped reminder, entry removed", async () => {
    const agent = makeAsyncAgent(CONSULTS)
    agent._suspended = true
    const tokens = []
    const runner = async (childAgent, input, callbacks, opts) => {
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, 60000)
        opts.signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")) }, { once: true })
      })
      return "never"
    }
    const ctx = makeCtx(agent, runner)
    ctx.callbacks = { onToken: (t) => tokens.push(String(t)) }
    const r = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, ctx)))
    const { cancelAsyncSubagent } = await import("../src/agent-tools/subagent-async.mjs")
    const c = cancelAsyncSubagent(agent, r.id)
    assert.equal(c.status, "cancelled")
    const entry = await settleEntry(agent, r.id)
    assert.equal(entry.cancelled, true)
    assert.equal(agent._pendingEscalateResults?.length ?? 0, 0, "cancelled → 不入 pending (D-M6)")
    assert.equal(agent._asyncSubagents.has(String(r.id)), false, "entry removed")
    assert.ok(agent.history.some((m) => String(m.content).includes("cancelled by user")), "stopped reminder in history")
    assert.ok(tokens.some((t) => t.includes("⟦ev⟧stopped")), "⟦ev⟧stopped freeze event")
  })

  it("T-R17g pool capacity: other-domain full → queued with position; explore and escalate queue fairly; slot free → FIFO start", async () => {
    const agent = makeAsyncAgent(CONSULTS)
    // occupy all 4 other-domain slots with fake running entries
    for (let i = 1; i <= 4; i++) {
      const fake = {
        id: `f${i}`, role: "explore", relayPrefix: `explore#f${i}/`, _pool: "other",
        status: "running", report: null, error: null, done: false, cancelled: false,
        promise: new Promise(() => {}), controller: null, _files: [], _dependsOn: [],
        start() {},
      }
      agent._asyncSubagents.set(`f${i}`, fake)
    }
    const runner = async () => "post-op report"
    const escAck = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, makeCtx(agent, runner))))
    assert.equal(escAck.status, "queued", "other pool full → escalate queues (not refused)")
    assert.equal(escAck.position, 1)
    // explore spawn queues behind it (same domain — fair FIFO)
    const { executeAsyncSpawn } = await import("../src/agent-tools/subagent-run.mjs")
    // free one slot → refill starts the QUEUED ESCALATE first
    const freed = agent._asyncSubagents.get("f1")
    freed.done = true
    agent._asyncSubagents.delete("f1")
    const { maybeRefillAsync } = await import("../src/agent-tools/subagent-scheduler.mjs")
    maybeRefillAsync(agent)
    const esc = agent._asyncSubagents.get(escAck.id)
    assert.ok(esc && esc.status === "running", "slot free → queued escalate auto-starts")
    await settleEntry(agent, escAck.id)
    void executeAsyncSpawn
  })

  it("T-R17n family isolation: an escalate settle does not pollute the consult pending stream (and vice versa)", async () => {
    const agent = makeAsyncAgent(CONSULTS)
    agent._suspended = true
    agent._pendingConsultResults = [{ id: "c9", role: "consult", report: "consult digest body" }]
    const runner = async () => "post-op body"
    const r = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, makeCtx(agent, runner))))
    const entry = await settleEntry(agent, r.id)
    assert.equal(agent._pendingEscalateResults.length, 1, "escalate entry in its own stream")
    assert.equal(agent._pendingConsultResults.length, 1, "consult entry untouched")
    assert.equal(agent._pendingConsultResults[0].report, "consult digest body")
    assert.ok(String(entry.report).startsWith("escalate ("), "escalate body composed independently")
  })

  it("turn-cap partial classifies as the ERROR branch (auto-declined — no continue panel in background)", async () => {
    const agent = makeAsyncAgent(CONSULTS)
    agent._suspended = true
    const { ContinueError } = await import("../src/agent.mjs")
    let calls = 0
    const runner = async () => { calls++; throw new ContinueError(100) }
    const r = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, makeCtx(agent, runner))))
    const entry = await settleEntry(agent, r.id)
    assert.equal(calls, 1, "no continue prompt in background → no resume")
    assert.ok(entry.error.includes("stopped: turn cap reached"), "cap partial rides the error body")
    assert.equal(agent._pendingEscalateResults.length, 1, "error entry still digests")
  })

})
