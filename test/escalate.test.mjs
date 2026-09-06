/**
 * escalate.test.mjs — 飞刀 (ESCALATE.md §3 test table, AGENT-LOOP.md §19 T-M14..M16)
 * The standalone escalate tool retired 2026-09-03 — the execution is subagent
 * action:"escalate" (constraints/relay prefix/post-op report all unchanged).
 * Covers: pool gating, delegation contract, model pick, depth guard, action errors,
 * activity stream.
 */
import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { subagentTool } from "../src/agent-tools/subagent.mjs"
import { saveAgentSettingsFromPanel, loadAgentSettings } from "../src/config-io.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"

// Every consult model is an escalate candidate (hook removed 2026-08-16 — fewer knobs).
const CONSULTS = [
  { provider: "kimi", model: "kimi-k3", effort: "max" },
  { provider: "zhipu-plan", model: "glm-5.2", effort: "high" },
]

function makeAgent(models) {
  return { config: { agent: { consultModels: models } }, _touchedFiles: [], _subIdCounter: 0 }
}

function makeCtx(agent, runner, depth = 0) {
  return {
    agent, cwd: process.cwd(), depth, runAgent: runner, callbacks: {},
    buildProvider: async (name) => ({ baseURL: "https://test/v1", apiKey: "sk-test", model: "x", name }),
  }
}

describe("escalate (飞刀)", () => {
  let tmp
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "escalate-"))
    _setConfigPathForTest(join(tmp, "config.json"))
  })
  // restore per-test path via afterEach-equivalent: node:test describe teardown
  describe("tool contract", () => {
    it("no consult models → error explaining the prerequisite", async () => {
      const r = await subagentTool.execute({ action: "escalate", task: "x", async: false }, makeCtx(makeAgent([])))
      assert.ok(String(r).includes("no escalate candidates"))
      assert.ok(String(r).includes("agent.consultModels"), "points at the right config")
    })

    it("delegates to the first consult model with configured effort, coder role, depth 1", async () => {
      const seen = []
      const runner = async (provider, cwd, task, callbacks, signal, auto, opts) => { seen.push({ provider, opts }); return "post-op report" }
      const r = await subagentTool.execute({ action: "escalate", task: "hard refactor", async: false }, makeCtx(makeAgent(CONSULTS), runner))
      assert.equal(seen.length, 1)
      assert.equal(seen[0].provider.name, "kimi", "default = first consult model")
      assert.equal(seen[0].provider.reasoningEffort, "max", "configured effort injected")
      assert.equal(seen[0].provider.model, "kimi-k3")
      assert.equal(seen[0].opts.role, "coder", "full write path")
      assert.equal(seen[0].opts.depth, 1)
      assert.ok(String(r).includes("post-op report"))
    })

    it("model pick: explicit candidate used; unknown candidate rejected with the pool listed", async () => {
      const seen = []
      const runner = async (provider) => { seen.push(provider.name); return "ok" }
      const ctx = makeCtx(makeAgent(CONSULTS), runner)
      await subagentTool.execute({ action: "escalate", task: "x", async: false, model: "zhipu-plan:glm-5.2" }, ctx)
      assert.equal(seen[0], "zhipu-plan")
      const bad = await subagentTool.execute({ action: "escalate", task: "x", async: false, model: "deepseek:deepseek-v4-pro" }, makeCtx(makeAgent(CONSULTS), runner))
      assert.ok(String(bad).includes("not a consult candidate"))
      assert.ok(String(bad).includes("kimi:kimi-k3"), "pool listed in the error")
    })

    it("depth guard: an escalate cannot fly in another escalate", async () => {
      const r = await subagentTool.execute({ action: "escalate", task: "x", async: false }, makeCtx(makeAgent(CONSULTS), async () => "never", 1))
      assert.ok(String(r).includes("only available at depth 0"))
    })

    it("activity stream flows under sub:escalate <label> with a unique #id per invocation", async () => {
      const panels = []
      const runner = async (provider, cwd, task, callbacks) => {
        callbacks.onToolCall?.("read", { path: "src/a.mjs" })
        callbacks.onToolResult?.("read", "contents")
        return "report"
      }
      const ctx = makeCtx(makeAgent(CONSULTS), runner)
      ctx.callbacks = { onToolPanel: (name, chunk) => panels.push({ name, chunk }) }
      await subagentTool.execute({ action: "escalate", task: "x", async: false }, ctx)
      assert.ok(panels.every((p) => p.name.startsWith("sub:escalate kimi:kimi-k3 #")))
      assert.ok(panels.some((p) => p.chunk.text.includes("read")))

      // A second invocation must open its OWN stream name — not reuse the first's block.
      const panels2 = []
      ctx.callbacks = { onToolPanel: (name, chunk) => panels2.push({ name, chunk }) }
      await subagentTool.execute({ action: "escalate", task: "y", async: false }, ctx)
      assert.ok(panels2[0]?.name.startsWith("sub:escalate kimi:kimi-k3 #"))
      assert.notEqual(panels2[0]?.name, panels[0]?.name, "distinct stream name per escalate invocation")
    })

    it("a single consult model is enough — no hook needed", async () => {
      const r = await subagentTool.execute({ action: "escalate", task: "x", async: false }, makeCtx(makeAgent([CONSULTS[0]]), async () => "ok"))
      assert.ok(String(r).includes("post-op") || String(r).includes("ok"), "ran with one consult model")
    })

    it("escalate without a task → explicit error (old schema required:['task'] semantics kept at runtime)", async () => {
      const called = []
      const r = await subagentTool.execute({ action: "escalate" }, makeCtx(makeAgent(CONSULTS), async () => { called.push(1); return "never" }))
      assert.ok(String(r).includes("requires a task"), "names the missing parameter")
      assert.equal(called.length, 0, "no child spawned without a task")
    })

    it("T-M16: onSubagent events keep role 'escalate' + model tag (UI 区块/活动流路由零改动)", async () => {
      const events = []
      const ctx = makeCtx(makeAgent(CONSULTS), async () => "post-op report")
      ctx.callbacks = { onSubagent: (ev) => events.push(ev), onToolPanel: () => {} }
      const r = await subagentTool.execute({ action: "escalate", task: "x", async: false }, ctx)
      assert.ok(String(r).includes("post-op report"))
      assert.deepEqual(events.map((e) => e.role), ["escalate", "escalate"], "role 仍为 escalate（webview 按 role 渲染区块）")
      assert.deepEqual(events.map((e) => e.status), ["started", "done"])
      assert.equal(events[0].model, "kimi:kimi-k3", "started 带 model tag")
      assert.equal(events[1].model, "kimi:kimi-k3", "done 带 model tag")
    })
  })

  // Three-way review fixes (2026-08-16): security/mechanism/UX gaps found by the panel.
  describe("review fixes", () => {
    it("(a) escalate mutations reset the parent's verify/advisor convergence budget", async () => {
      const agent = makeAgent(CONSULTS)
      agent._verifiedThisRun = true
      agent._verifyPassed = true
      agent._calledAdvisorThisRun = true
      agent._advisorRound = 2
      agent._advisorSession = "sess-1"
      const runner = async (provider, cwd, task, callbacks, signal, auto, opts) => {
        opts.stateSink.touchedFiles = [join(process.cwd(), "src", "x.mjs")] // fresh code lands mid-run
        return "post-op report"
      }
      const r = await subagentTool.execute({ action: "escalate", task: "x", async: false }, makeCtx(agent, runner))
      assert.equal(agent._verifiedThisRun, false, "fresh code invalidates the parent's prior verify — the surgery must not bypass the parent's gates")
      assert.equal(agent._verifyPassed, undefined)
      assert.equal(agent._calledAdvisorThisRun, false)
      assert.equal(agent._advisorRound, 0)
      assert.equal(agent._advisorSession, null)
      assert.equal(agent._mutatedThisRun, true)
      assert.equal(agent._touchedFiles.length, 1, "child's touched files merged into the parent")
      assert.ok(String(r).includes("Touched files:"), "post-op report lists touched files")
    })

    it("(b) user Stop propagates — AbortError is rethrown, not swallowed into a report", async () => {
      const runner = async () => { throw new DOMException("Aborted", "AbortError") }
      await assert.rejects(
        subagentTool.execute({ action: "escalate", task: "x", async: false }, makeCtx(makeAgent(CONSULTS), runner)),
        (e) => e?.name === "AbortError",
      )
    })

    it("(c) turn cap (ContinueError) reads as partial work with touched files, not a crash", async () => {
      const { ContinueError } = await import("../src/agent.mjs")
      const runner = async (provider, cwd, task, callbacks, signal, auto, opts) => {
        opts.stateSink.touchedFiles = [join(process.cwd(), "src", "partial.mjs")]
        throw new ContinueError(100)
      }
      const r = String(await subagentTool.execute({ action: "escalate", task: "x", async: false }, makeCtx(makeAgent(CONSULTS), runner)))
      assert.ok(r.includes("turn cap"), "turn-cap wording")
      assert.ok(r.includes("recent_changes"), "points at recent_changes review")
      assert.ok(r.includes("Touched files:") && r.includes("partial.mjs"), "touched files listed")
      assert.ok(!r.includes("error:"), "not framed as a crash")
    })

    it("engineering mode: escalate fails closed and points at eng-coder (subagent parity)", async () => {
      const agent = makeAgent(CONSULTS)
      agent.config.agent.engineering = true
      let called = false
      const r = String(await subagentTool.execute({ action: "escalate", task: "x", async: false }, makeCtx(agent, async () => { called = true; return "never" })))
      assert.ok(r.includes("engineering mode"), "names the mode")
      assert.ok(r.includes("eng-coder"), "points at the engineering implementation path")
      assert.equal(called, false, "escalate never spawned")
    })

    it("model pick tolerates the effort suffix copied from the pool listing", async () => {
      const seen = []
      const runner = async (provider) => { seen.push(provider.name); return "ok" }
      await subagentTool.execute({ action: "escalate", task: "x", async: false, model: "zhipu-plan:glm-5.2 (high)" }, makeCtx(makeAgent(CONSULTS), runner))
      assert.equal(seen[0], "zhipu-plan", "stripped the ' (high)' suffix and matched")
    })

    it("key precheck: a provider without an API key fails before the child spawns", async () => {
      const ctx = makeCtx(makeAgent(CONSULTS), async () => "never")
      ctx.buildProvider = async (name) => ({ name, model: "x" }) // no apiKey
      const r = String(await subagentTool.execute({ action: "escalate", task: "x", async: false }, ctx))
      assert.ok(r.includes("no API key"), "names the problem")
      assert.ok(r.includes("kimi"), "names the provider")
    })

    it("no wall-clock watchdog: parent signal passes through directly (CLI parity)", async () => {
      const agent = makeAgent(CONSULTS)
      const ctrl = new AbortController()
      let seenSignal = null
      const runner = (provider, cwd, task, callbacks, signal) => new Promise((_, reject) => {
        seenSignal = signal
        signal?.addEventListener?.("abort", () => reject(new DOMException("Aborted", "AbortError")))
      })
      const ctx = { ...makeCtx(agent, runner), signal: ctrl.signal }
      const pending = subagentTool.execute({ action: "escalate", task: "x", async: false }, ctx)
      await new Promise((r) => setTimeout(r, 20))
      assert.equal(seenSignal, ctrl.signal, "child receives the parent signal directly (no intermediate controller)")
      ctrl.abort()
      await assert.rejects(pending, (e) => e.name === "AbortError", "user Stop propagates as AbortError")
    })

    it("turn-cap continue: user picks Continue → child resumes with its own history", async () => {
      const agent = makeAgent(CONSULTS)
      const { ContinueError } = await import("../src/agent.mjs")
      let calls = 0
      let asked = null
      let firstHistory = null
      const runner = async (provider, cwd, task, callbacks, signal, autoApprove, opts) => {
        calls++
        // Fake runAgent parity: runAgent sets opts.stateSink.history to the live child
        // history array (agent.mjs) — the fake must do the same or resume has nothing.
        opts.stateSink.history = [{ role: "user", content: "task was pushed here" }]
        if (calls === 1) { firstHistory = opts.stateSink.history; throw new ContinueError(100) }
        assert.ok(opts?.resume, "second run is a resume")
        assert.equal(opts?.history, firstHistory, "the SAME child history array is handed back")
        return "done after resume"
      }
      const ctx = makeCtx(agent, runner)
      ctx.callbacks = { onQuestion: async (q, options) => { asked = { q, options }; return "Continue" } }
      const r = String(await subagentTool.execute({ action: "escalate", task: "x", async: false }, ctx))
      assert.equal(calls, 2, "two runs")
      assert.ok(asked.q.includes("100 turns"), "question names the turn count")
      assert.deepEqual(asked.options, ["Continue", "Stop"], "y/n options")
      assert.ok(r.includes("done after resume"), "post-op report after resume")
    })

    it("turn-cap continue: user picks Stop (or no onQuestion) → partial work return", async () => {
      const agent = makeAgent(CONSULTS)
      const { ContinueError } = await import("../src/agent.mjs")
      let calls = 0
      const runner = async () => { calls++; throw new ContinueError(100) }
      // Stop:
      const ctxStop = makeCtx(agent, runner)
      ctxStop.callbacks = { onQuestion: async () => "Stop" }
      const r1 = String(await subagentTool.execute({ action: "escalate", task: "x", async: false }, ctxStop))
      assert.ok(r1.includes("stopped: turn cap reached"), "Stop → partial work")
      assert.equal(calls, 1, "no resume after Stop")
      // Headless (no onQuestion):
      const ctxHeadless = makeCtx(agent, runner)
      const r2 = String(await subagentTool.execute({ action: "escalate", task: "x", async: false }, ctxHeadless))
      assert.ok(r2.includes("stopped: turn cap reached"), "headless → partial work")
      assert.equal(calls, 2, "no resume without a question channel")
    })

    it("turn-cap continue: UNLIMITED — every wall prompts; the user's Stop ends it", async () => {
      const agent = makeAgent(CONSULTS)
      const { ContinueError } = await import("../src/agent.mjs")
      let calls = 0
      let asks = 0
      const runner = async () => { calls++; throw new ContinueError(100) }
      const ctx = makeCtx(agent, runner)
      // Never-ending walls: the user keeps choosing Continue — resumes are unlimited.
      // The 4th prompt answers Stop (the user's escape hatch), so the test terminates.
      ctx.callbacks = { onQuestion: async () => { asks++; return asks >= 4 ? "Stop" : "Continue" } }
      const r = String(await subagentTool.execute({ action: "escalate", task: "x", async: false }, ctx))
      assert.equal(calls, 4, "three resumes — no MAX_RESUMES cap")
      assert.equal(asks, 4, "prompted on every wall")
      assert.ok(r.includes("stopped: turn cap reached"), "Stop at the prompt → partial work")
    })

    it("escalate reasoning + output text stream into the panel (consult-UI parity)", async () => {
      const panels = []
      const runner = async (provider, cwd, task, callbacks) => {
        callbacks.onReasoning?.("thinking hard")
        callbacks.onToken?.("final answer")
        return "report"
      }
      const ctx = makeCtx(makeAgent(CONSULTS), runner)
      ctx.callbacks = { onToolPanel: (name, chunk) => panels.push({ name, chunk }) }
      await subagentTool.execute({ action: "escalate", task: "x", async: false }, ctx)
      assert.ok(panels.some((p) => p.chunk.kind === "think" && p.chunk.text.includes("thinking")), "reasoning streams as think chunks")
      assert.ok(panels.some((p) => p.chunk.kind === "text" && p.chunk.text.includes("final answer")), "output streams as text chunks")
    })
  })

  describe("config round-trip", () => {
    it("plain consult rows persist unchanged (no surgeon key involved (removed))", () => {
      saveAgentSettingsFromPanel({ consultModels: [
        { provider: "kimi", model: "kimi-k3", effort: "max" },
        { provider: "deepseek", model: "deepseek-v4-pro", effort: "high" },
      ] })
      const s = loadAgentSettings()
      assert.equal(s.consultModels.length, 2)
      assert.equal(s.consultModels[0].provider, "kimi")
      assert.equal(s.consultModels[0].effort, "max")
      assert.equal(s.consultModels[0].surgeon, undefined, "the removed surgeon config key never returns")
      rmSync(tmp, { recursive: true, force: true })
    })
  })

  // ─── §25 R17: 飞刀 async（AGENT-LOOP.md §25 D-R17b——缺省 async——入 other 池——
  // settle 三分类 + merge 决策 + digest 注入）───
  describe("R17 async escalate (飞刀后台化)", () => {
    const A = (models) => ({
      config: { agent: { consultModels: models } },
      _touchedFiles: [], _subIdCounter: 0, _mutatedThisRun: false,
    })
    const ctxOf = (agent, runner, extra = {}) => ({
      agent, cwd: process.cwd(), depth: 0, runAgent: runner,
      callbacks: { onSubagent: () => {}, onToolPanel: () => {}, onAsyncSettled: () => {} },
      buildProvider: async (name) => ({ baseURL: "https://test/v1", apiKey: "sk-test", model: "x", name }),
      ...extra,
    })
    const waitFor = async (fn, timeoutMs = 4000) => {
      const t0 = Date.now()
      while (!fn()) {
        if (Date.now() - t0 > timeoutMs) throw new Error("waitFor timeout")
        await new Promise((r) => setTimeout(r, 10))
      }
    }
    /** await 池条目的 settled（真实引擎完成/取消后 resolve）。 */
    const entryById = (agent, id) => {
      const map = agent.history?._asyncSubagents ?? agent._asyncSubagents
      const key = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id
      return map?.get(key)
    }
    const settleFile = (p) => join(process.cwd(), p)

    it("T-R17d: escalate 缺省 async——ack 返回 + 后台跑完 + settle park 进 digest 流", async () => {
      const agent = A(CONSULTS)
      let wakes = 0
      const runner = async (p, c, t, cb, sig, auto, opts) => {
        await new Promise((r) => setTimeout(r, 30))
        return "post-op report"
      }
      const ctx = ctxOf(agent, runner)
      ctx.callbacks.onAsyncSettled = () => wakes++
      const ack = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "hard refactor" }, ctx)))
      assert.equal(ack.role, "escalate")
      assert.ok(ack.status === "running" || ack.status === "queued", `ack immediate, got ${ack.status}`)
      const entry = entryById(agent, ack.id)
      assert.ok(entry, "pool entry created")
      await entry.settled
      assert.equal(entry.done, true)
      await waitFor(() => (agent._pendingEscalateResults?.length ?? 0) === 1, 2000)
      assert.equal(wakes, 1, "settle notify fires")
      const parked = agent._pendingEscalateResults[0]
      assert.equal(parked.outcome, "done")
      assert.ok(parked.injectBody.includes("post-op report"), "report body carried")
      assert.equal(agent._asyncSubagents?.has(ack.id), false, "settled entry left the pool (park = consumed into digest stream)")
      // 注入文案（done——已 merge 报告）
      const hist = []
      const { injectEscalateResult } = await import("../src/agent-tools/subagent-escalate-async.mjs")
      await injectEscalateResult(parked, { history: hist, fullHistory: [], cwd: process.cwd() })
      assert.match(hist[0].content, /async escalate #\d+ \(kimi:kimi-k3\) finished — its changes were merged into your session/)
    })

    it("T-R17e: settle merge——飞刀改文件 → mutations merge 回父（guard 记账）+ digest", async () => {
      const agent = A(CONSULTS)
      agent._verifiedThisRun = true
      agent._calledAdvisorThisRun = true
      const file = settleFile("src/delegated.mjs")
      const runner = async (p, c, t, cb, sig, auto, opts) => {
        opts.stateSink.touchedFiles = [file]
        return "surgery done"
      }
      const ctx = ctxOf(agent, runner)
      const ack = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, ctx)))
      const entry = entryById(agent, ack.id)
      await entry.settled
      await waitFor(() => (agent._pendingEscalateResults?.length ?? 0) === 1, 2000)
      assert.ok(agent._touchedFiles.includes(file), "done → merge-all 回父")
      assert.equal(agent._mutatedThisRun, true)
      assert.equal(agent._verifiedThisRun, false, "fresh code invalidates the parent's prior verify")
      assert.equal(agent._calledAdvisorThisRun, false)
      const hist = []
      const { injectEscalateResult } = await import("../src/agent-tools/subagent-escalate-async.mjs")
      await injectEscalateResult(agent._pendingEscalateResults[0], { history: hist, fullHistory: [], cwd: process.cwd() })
      assert.ok(hist[0].content.includes("surgery done"), "digest report injected")
      assert.ok(hist[0].content.includes("Touched files:"), "touched list rides the digest")
    })

    it("T-R17f: async:false 同步保留——既有语义零回归（报告内联返回）", async () => {
      const agent = A(CONSULTS)
      let ran = 0
      const runner = async () => { ran++; return "sync report" }
      const r = String(await subagentTool.execute({ action: "escalate", task: "x", async: false }, ctxOf(agent, runner)))
      assert.equal(ran, 1)
      assert.ok(r.includes("sync report"), "blocking return preserved")
      assert.equal(agent._pendingEscalateResults?.length ?? 0, 0, "sync path never parks")
    })

    it("T-R17g: 容量/排队——other 池满时 escalate 排队（与 explore 公平同池）——腾槽自动补位", async () => {
      const agent = A(CONSULTS)
      agent._asyncSubagents = new Map()
      // other 池 4 槽占满（role explore running——域 other）
      for (let i = 1; i <= 4; i++) {
        const f = { id: i, role: "explore", status: "running", done: false, report: null, error: null }
        f.settled = new Promise((res) => { f._resolve = res })
        agent._asyncSubagents.set(i, f)
      }
      const runner = async () => "escalate ok"
      const ack = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, ctxOf(agent, runner))))
      assert.equal(ack.status, "queued", "other 池满 → 排队（非拒）")
      assert.equal(ack.position, 1, "排队位置 1")
      // 一个 explore settle → refillPool 自动补位启动 escalate
      const { refillPool } = await import("../src/agent-tools/subagent-scheduler.mjs")
      agent._asyncSubagents.delete(2)
      refillPool(agent, () => false)
      const esc = [...agent._asyncSubagents.values()].find((e) => e.role === "escalate")
      assert.ok(esc && esc.status === "running", "腾槽后 escalate 自动启动（公平排队）")
      await esc.settled
      await waitFor(() => (agent._pendingEscalateResults?.length ?? 0) === 1, 2000)
      assert.equal(agent._pendingEscalateResults[0].outcome, "done")
      // 清理残留 explore 条目
      for (const e of [...agent._asyncSubagents.values()]) { e._resolve?.(e) }
    })

    it("T-R17h: eng 模式拒保持（async 缺省同样拒——文案不变）", async () => {
      const agent = A(CONSULTS)
      agent.config.agent.engineering = true
      let called = false
      const r = String(await subagentTool.execute({ action: "escalate", task: "x" }, ctxOf(agent, async () => { called = true; return "never" })))
      assert.ok(r.includes("engineering mode"), "names the mode")
      assert.equal(called, false)
    })

    it("T-R17i: cancel running escalate → cancelled settle（D-M6——不入 pending——停止通知 + 墓碑）", async () => {
      const agent = A(CONSULTS)
      const events = []
      const hang = (p, c, t, cb, signal) => new Promise((_, reject) => {
        signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })
      })
      const ctx = ctxOf(agent, hang)
      ctx.callbacks.onSubagent = (ev) => events.push(ev)
      const ack = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, ctx)))
      const entry = entryById(agent, ack.id)
      await new Promise((r) => setTimeout(r, 30)) // 引擎进入挂起
      const canc = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: ack.id }, ctx)))
      assert.equal(canc.status, "cancelled")
      await entry.settled
      assert.equal(entry.done, true)
      await waitFor(() => !entryById(agent, ack.id), 2000)
      assert.equal(agent._pendingEscalateResults?.length ?? 0, 0, "cancelled → 不入 pending")
      assert.equal(agent._touchedFiles.length, 0, "取消路径不 merge")
      assert.ok(events.some((e) => e.status === "cancelled" && e.role === "escalate"), "停止冻结通知发出")
    })

    it("T-R17m: 撞 turn cap → error-class——无重叠 partial merge + 错误报告注入", async () => {
      const agent = A(CONSULTS)
      const { ContinueError } = await import("../src/agent.mjs")
      const file = settleFile("src/partial.mjs")
      const runner = async (p, c, t, cb, sig, auto, opts) => {
        opts.stateSink.touchedFiles = [file]
        throw new ContinueError(100)
      }
      const ctx = ctxOf(agent, runner)
      let asked = 0
      ctx.callbacks.onQuestion = async () => { asked++; return "Continue" }
      const ack = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, ctx)))
      const entry = entryById(agent, ack.id)
      await entry.settled
      await waitFor(() => (agent._pendingEscalateResults?.length ?? 0) === 1, 2000)
      assert.equal(asked, 0, "async 永不弹继续卡")
      const parked = agent._pendingEscalateResults[0]
      assert.equal(parked.outcome, "error", "撞 cap → error-class")
      assert.ok(parked.injectBody.includes("turn cap reached"), "cap wording in the report")
      assert.ok(agent._touchedFiles.includes(file), "无父侧重叠 → partial merge 回父")
      const hist = []
      const { injectEscalateResult } = await import("../src/agent-tools/subagent-escalate-async.mjs")
      await injectEscalateResult(parked, { history: hist, fullHistory: [], cwd: process.cwd() })
      assert.match(hist[0].content, /FAILED — error report below; partial changes were merged \(no overlap/)
    })

    it("T-R17m2: error + 父侧并发写重叠 → 不 merge + 报告列差异（round2 #4 决策钉死）", async () => {
      const agent = A(CONSULTS)
      const { ContinueError } = await import("../src/agent.mjs")
      const file = settleFile("src/partial.mjs")
      // 父侧在飞刀飞行中改了同一文件（file-mut 事件在 launch 之后到达）
      const runner = async (p, c, t, cb, sig, auto, opts) => {
        const holder = agent.history ?? agent
        ;(holder._fileMutEvents ??= []).push(file) // 父并发写
        opts.stateSink.touchedFiles = [file]
        throw new ContinueError(100)
      }
      const ctx = ctxOf(agent, runner)
      const ack = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, ctx)))
      const entry = entryById(agent, ack.id)
      await entry.settled
      await waitFor(() => (agent._pendingEscalateResults?.length ?? 0) === 1, 2000)
      const parked = agent._pendingEscalateResults[0]
      assert.equal(parked.outcome, "error")
      assert.ok(parked.mergeSkipped?.includes(file), "重叠文件标注（不 merge）")
      assert.ok(!agent._touchedFiles.includes(file), "有重叠 → 不 merge（半成品不入父 guard 记账）")
      const hist = []
      const { injectEscalateResult } = await import("../src/agent-tools/subagent-escalate-async.mjs")
      await injectEscalateResult(parked, { history: hist, fullHistory: [], cwd: process.cwd() })
      assert.ok(hist[0].content.includes("NOT merged (overlap:"), "报告级差异提示")
    })

    it("T-R17n: 双族隔离——会诊 pending 与飞刀 park 各注各流（互不污染）", async () => {
      const agent = A(CONSULTS)
      // 会诊族：预置一个已 settle 的会诊会话（等效 consult settle 的 park 形态）
      const consultSession = { id: "1", replies: [{ model: "openai:m-b", reply: "consult opinion" }], failed: 0, received: 1, total: 1 }
      agent._pendingConsultResults = [consultSession]
      // 飞刀族：async escalate settle
      const runner = async () => "escalate report"
      const ack = JSON.parse(String(await subagentTool.execute({ action: "escalate", task: "x" }, ctxOf(agent, runner))))
      const entry = entryById(agent, ack.id)
      await entry.settled
      await waitFor(() => (agent._pendingEscalateResults?.length ?? 0) === 1, 2000)
      assert.equal(agent._pendingConsultResults.length, 1, "consult 流不动")
      assert.equal(agent._pendingEscalateResults.length, 1, "escalate 流独立")
      const hist = []
      const { injectEscalateResult } = await import("../src/agent-tools/subagent-escalate-async.mjs")
      await injectEscalateResult(agent._pendingEscalateResults[0], { history: hist, fullHistory: [], cwd: process.cwd() })
      assert.ok(!hist[0].content.includes("consult opinion"), "escalate 注入不含 consult 内容")
      const { injectConsultResult } = await import("../src/agent-tools/consult.mjs")
      const hist2 = []
      injectConsultResult(consultSession, { history: hist2, fullHistory: [], cwd: process.cwd() })
      assert.ok(!hist2[0].content.includes("escalate report"), "consult 注入不含 escalate 内容")
      assert.match(hist2[0].content, /consultation #1 finished — 1 replies received/)
    })
  })
})
