/**
 * consult.test.mjs — multi-model consultation mechanism (AGENT-LOOP.md §25 R17;
 * docs/design/CONSULTATION.md 为历史机制文档). Children run through an injected fake
 * runner (ctx.runAgent) — no real providers.
 *
 * R17 semantics under test: consult_check 退役（结果只经自动 digest 通道）——会话全 settle
 * 后 park 进 _pendingConsultResults（部分 settle 不提前——T-R17k）→ 下回合 run-start
 * 单点注入（全文逐条 + per-model 状态标注）——stop/abort 弃（不入 pending——T-R17c）。
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { consultStartTool, consultStopTool, makeMainHistoryTool, cleanupConsultSessions, injectConsultResult } from "../src/agent-tools/consult.mjs"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function makeAgent(models) {
  return {
    history: [
      { role: "user", content: "fix the bug" },
      { role: "tool", content: "Error: type mismatch at foo.mjs:12", tool_call_id: "t1" },
    ],
    config: { agent: { consultModels: models, subagentTurns: 100 } },
  }
}

function makeCtx(agent, runner, signal) {
  return {
    agent, cwd: process.cwd(), signal, runAgent: runner, callbacks: {},
    buildProvider: async (name) => ({ baseURL: "https://test/v1", apiKey: "sk-test", model: "x", name }),
  }
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
    fn: async (provider, cwd, task, callbacks, signal) => {
      const spec = script[provider.model] ?? { reply: "default", delay: 0 }
      calls.push({ model: provider.model, task, opts: arguments?.[5] })
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

const waitFor = async (fn, timeoutMs = 4000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > timeoutMs) throw new Error("waitFor timeout")
    await new Promise((r) => setTimeout(r, 10))
  }
}

/** pending consult results container of an agent（history 载体优先——与 settle park 同读）。 */
function pendingOf(agent) {
  return agent.history?._pendingConsultResults ?? agent._pendingConsultResults
}

describe("consult mechanism (R17 async digest)", () => {
  it("start returns immediately with id + models (non-blocking)", async () => {
    const agent = makeAgent(MODELS)
    const r = JSON.parse(await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, fakeRunner({ "m-a": { reply: "A", delay: 500 } }).fn)))
    assert.ok(r.id, "returns an id")
    assert.deepEqual(r.models, ["deepseek:m-a", "openai:m-b", "glm:m-c"])
    // 会话注册在共享容器（history 载体优先——跨 run 存活）
    assert.ok(agent.history._consultSessions?.has(r.id), "session registered on the cross-run carrier")
    await cleanupConsultSessions(agent)
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

  it("T-R17a: full settle parks the session once — 2-model digest with per-model marks + wake", async () => {
    const agent = makeAgent(MODELS.slice(0, 2))
    let wakes = 0
    const ctx = makeCtx(agent, fakeRunner({
      "m-a": { reply: "answer-A", delay: 20 },
      "m-b": { reply: "answer-B", delay: 30 },
    }).fn)
    ctx.callbacks = { onAsyncSettled: () => wakes++ }
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 2000)
    assert.equal(wakes, 1, "session settle wakes the driver (idle settle → digest — T-R17j)")
    const sess = pendingOf(agent)[0]
    assert.equal(sess.received, 2, "both replies collected")
    assert.equal(sess.replies.length, 2)
    assert.equal(sess.failed, 0)
    assert.equal(agent.history._consultSessions?.size ?? 0, 0, "settled session left the live map")
    // digest 注入器：全文逐条 + per-model 标注
    const hist = []
    const full = []
    injectConsultResult(sess, { history: hist, fullHistory: full, cwd: process.cwd() })
    const text = hist[0].content
    assert.match(text, /consultation #1 finished — 2 replies received \(0 failed \/ 2 models\)/)
    assert.ok(text.includes("--- deepseek:m-a ---"), "per-model block 1")
    assert.ok(text.includes("answer-A"), "reply 1 verbatim")
    assert.ok(text.includes("--- openai:m-b ---"), "per-model block 2")
    assert.ok(text.includes("answer-B"), "reply 2 verbatim")
    await cleanupConsultSessions(agent)
  })

  it("T-R17b: consult_check 退役——工具导出/注册/描述零残留", async () => {
    const mod = await import("../src/agent-tools/consult.mjs")
    assert.equal(mod.consultCheckTool, undefined, "consultCheckTool export gone")
    // 描述面零残留（工具自身 + prompts 表）
    for (const probe of [consultStartTool, consultStopTool]) {
      assert.ok(!probe.description.includes("consult_check"), `${probe.name} description clean`)
    }
    const { readFileSync } = await import("node:fs")
    const main = readFileSync(join(process.cwd(), "src/prompts/main.md"), "utf8")
    const disc = readFileSync(join(process.cwd(), "src/prompts/discipline.md"), "utf8")
    assert.ok(!main.includes("consult_check"), "main.md consult_check zero-residue")
    assert.ok(!disc.includes("consult_check"), "discipline.md consult_check zero-residue")
    // 工具注册面（index.mjs 导出 = setup.mjs 注册同源）
    const idx = await import("../src/agent-tools/index.mjs")
    assert.equal(idx.consultCheckTool, undefined, "index.mjs export gone")
    assert.ok(idx.consultStartTool && idx.consultStopTool, "two-tool family kept")
  })

  it("T-R17k: partial settle parks nothing — full settle injects once (all-or-nothing)", async () => {
    const agent = makeAgent(MODELS.slice(0, 2))
    const runner = fakeRunner({
      "m-a": { reply: "A", delay: 15 },
      "m-b": { reply: "B", delay: 200 }, // 慢——先只 settle 1/2
    })
    await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, runner.fn))
    await sleep(60)
    assert.equal(pendingOf(agent)?.length ?? 0, 0, "1/2 settle → 不 park（等全 settle——部分意见不提前注入）")
    assert.equal(agent.history._consultSessions?.size, 1, "session still live (1 pending)")
    await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 2000)
    const sess = pendingOf(agent)[0]
    assert.equal(sess.replies.length, 2, "full settle parks the complete set")
    await cleanupConsultSessions(agent)
  })

  it("a failed model settles as a marked reply; all-fail still parks with failure notes", async () => {
    const agent = makeAgent(MODELS.slice(0, 2))
    const runner = fakeRunner({
      "m-a": { fail: "boom", delay: 10 },
      "m-b": { fail: "boom", delay: 20 },
    })
    await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, runner.fn))
    await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 2000)
    const sess = pendingOf(agent)[0]
    assert.equal(sess.failed, 2, "failures counted")
    const hist = []
    injectConsultResult(sess, { history: hist, fullHistory: [], cwd: process.cwd() })
    assert.match(hist[0].content, /2 failed \/ 2 models/)
    assert.ok(hist[0].content.includes("(failed)"), "per-model failure marks")
    assert.ok(hist[0].content.includes("consultation failed: boom"), "failure note verbatim")
    await cleanupConsultSessions(agent)
  })

  it("T-R17c: stop mid-flight → cancelled — nothing parks, replies discarded", async () => {
    const agent = makeAgent(MODELS.slice(0, 3))
    const runner = fakeRunner({
      "m-a": { reply: "good", delay: 5 },
      "m-b": { reply: "slow", delay: 5000 },
      "m-c": { reply: "slow", delay: 5000 },
    })
    const ctx = makeCtx(agent, runner.fn)
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await sleep(40) // m-a settles；b/c 仍在跑
    const stop = JSON.parse(await consultStopTool.execute({ id: "1" }, ctx))
    assert.equal(stop.stopped, 2, "two still-running consultations aborted")
    assert.equal(stop.cancelled, true, "cancelled mark")
    await waitFor(() => (agent.history._consultSessions?.size ?? 0) === 0, 2000)
    assert.equal(pendingOf(agent)?.length ?? 0, 0, "stop → 不入 pending（回复弃——无 digest）")
    await cleanupConsultSessions(agent)
  })

  it("unknown id returns an error, never hangs", async () => {
    const agent = makeAgent(MODELS)
    const s = JSON.parse(await consultStopTool.execute({ id: "999" }, makeCtx(agent, fakeRunner({}).fn)))
    assert.equal(s.error, "unknown consult id")
  })

  it("user Stop aborts all children and nothing parks (abort = discard)", async () => {
    const agent = makeAgent(MODELS.slice(0, 3))
    const ctrl = new AbortController()
    const runner = fakeRunner({ "m-a": { reply: "x", delay: 5000 }, "m-b": { reply: "y", delay: 5000 }, "m-c": { reply: "z", delay: 5000 } })
    const ctx = makeCtx(agent, runner.fn, ctrl.signal)
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    // turn-level abort（cleanup 语义 = 标记 stopped + abort 子代理）
    cleanupConsultSessions(agent)
    await waitFor(() => (agent.history._consultSessions?.size ?? 0) === 0, 2000)
    assert.equal(pendingOf(agent)?.length ?? 0, 0, "aborted session never parks")
    assert.equal(ctrl.signal.aborted, false, "ctx signal untouched by cleanup (session controllers own the abort)")
  })

  it("config validation: empty list explains setup, >5 models rejected", async () => {
    const empty = await consultStartTool.execute({ problem: "x" }, makeCtx(makeAgent([]), fakeRunner({}).fn))
    assert.match(empty, /consultModels/, "plain-text guidance when unconfigured")
    const tooMany = makeAgent(Array.from({ length: 6 }, (_, i) => ({ provider: "p" + i, model: "m" + i })))
    const r = await consultStartTool.execute({ problem: "x" }, makeCtx(tooMany, fakeRunner({}).fn))
    assert.match(r, /at most 5/)
  })

  it("turn-cap continue: consultant wall → user Continue → resumes with its own history", async () => {
    const agent = makeAgent([MODELS[0]])
    const { ContinueError } = await import("../src/agent.mjs")
    let calls = 0
    const asks = []
    const runner = async (provider, cwd, task, callbacks, signal, autoApprove, opts) => {
      calls++
      // Fake runAgent parity: the live child history is exposed via opts.stateSink.
      opts.stateSink.history = [{ role: "user", content: "consult problem was pushed here" }]
      if (calls === 1) throw new ContinueError(40)
      assert.ok(opts?.resume, "second run is a resume")
      assert.equal(opts?.history?.[0]?.content, "consult problem was pushed here", "child history handed back")
      return "diagnosis after resume"
    }
    const ctx = makeCtx(agent, runner)
    ctx.callbacks = { onQuestion: async (q, options) => { asks.push({ q, options }); return "Continue" } }
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 3000)
    assert.equal(calls, 2, "two runs: wall then resume")
    const sess = pendingOf(agent)[0]
    assert.ok(sess.replies.some((x) => x.reply.includes("diagnosis after resume")), "resumed consultant's reply lands")
    assert.ok(asks[0].q.includes("40 turns"), "question names the turn count")
    assert.deepEqual(asks[0].options, ["Continue", "Stop"], "y/n options")
    await cleanupConsultSessions(agent)
  })

  it("turn-cap continue: user Stop → failed reply (no resume)", async () => {
    const agent = makeAgent([MODELS[0]])
    const { ContinueError } = await import("../src/agent.mjs")
    let calls = 0
    const runner = async (provider, cwd, task, callbacks, signal, autoApprove, opts) => {
      calls++
      opts.stateSink.history = []
      throw new ContinueError(40)
    }
    const ctx = makeCtx(agent, runner)
    ctx.callbacks = { onQuestion: async () => "Stop" }
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 3000)
    assert.equal(calls, 1, "no resume after Stop")
    const sess = pendingOf(agent)[0]
    assert.ok(sess.replies.some((x) => x.failed === true && /turn cap reached/.test(x.reply)), "stopped → failed reply naming the cap")
    await cleanupConsultSessions(agent)
  })

  it("turn-cap continue declined while suspended → partial settle without a question card (R17 background)", async () => {
    const agent = makeAgent([MODELS[0]])
    agent.history._suspended = true // 挂起期（后台）——不弹卡
    const { ContinueError } = await import("../src/agent.mjs")
    let asked = 0
    const runner = async () => { throw new ContinueError(40) }
    const ctx = makeCtx(agent, runner)
    ctx.callbacks = { onQuestion: async () => { asked++; return "Continue" } }
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 3000)
    assert.equal(asked, 0, "no continue card while suspended")
    const sess = pendingOf(agent)[0]
    assert.ok(sess.replies[0].reply.includes("turn cap reached"), "partial note settles")
    agent.history._suspended = false
    await cleanupConsultSessions(agent)
  })

  it("main_history returns the parent's recent history, read-only", async () => {
    const agent = makeAgent(MODELS)
    const tool = makeMainHistoryTool(agent)
    const out = await tool.execute({ limit: 10 }, {})
    assert.match(out, /fix the bug/)
    assert.match(out, /type mismatch at foo\.mjs:12/, "failure trail visible verbatim")
    assert.equal(tool.readonly, true)
  })

  it("consultation children run read-only with main_history injected", async () => {
    const agent = makeAgent(MODELS)
    const seen = []
    const runner = async (provider, cwd, task, callbacks, signal, auto, opts) => {
      seen.push(opts)
      return "ok"
    }
    const ctx = makeCtx(agent, runner)
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await sleep(50)
    assert.equal(seen.length, 3)
    for (const o of seen) {
      assert.equal(o.role, "consult", "consult role (own overlay, read-only tools, small turn budget)")
      assert.equal(o.depth, 1)
      assert.equal(o.maxTurns, 40, "consult turn budget")
      assert.ok(o.extraTools?.some((t) => t.name === "main_history"), "main_history injected")
    }
    await cleanupConsultSessions(agent)
  })

  it("consultant tool activity streams to the panel under sub:consult <label>", async () => {
    const agent = makeAgent(MODELS)
    const panels = []
    const runner = async (provider, cwd, task, callbacks) => {
      // simulate the child doing tool work
      callbacks.onToolCall?.("read", { path: "src/a.mjs" })
      callbacks.onToolResult?.("read", "file contents")
      return "diagnosis"
    }
    const ctx = makeCtx(agent, runner)
    ctx.callbacks = { onToolPanel: (name, chunk) => panels.push({ name, chunk }) }
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await sleep(50)
    const names = [...new Set(panels.map((p) => p.name))]
    assert.equal(names.length, 3, "one stream per consultant")
    for (const n of names) assert.ok(/^sub:consult .+ #\d+$/.test(n), `stream name, got ${n}`)
    assert.ok(panels.some((p) => p.chunk.text.includes("read")), "tool calls streamed")
    assert.ok(panels.some((p) => p.chunk.text.startsWith("→ ")), "tool results streamed")
    await cleanupConsultSessions(agent)
  })

  it("two consult sessions with the same model open distinct stream blocks", async () => {
    const agent = makeAgent(MODELS)
    const panels = []
    const ctx = makeCtx(agent, async (p, c, t, cb) => { cb.onToolCall?.("read", { path: "a" }); return "x" })
    ctx.callbacks = { onToolPanel: (name) => panels.push(name) }
    await consultStartTool.execute({ problem: "one" }, ctx)
    await sleep(60)
    await consultStartTool.execute({ problem: "two" }, ctx)
    await sleep(60)
    const deepseekNames = panels.filter((n) => n.startsWith("sub:consult deepseek:m-a "))
    assert.equal(deepseekNames.length, 2, `deepseek streamed in both sessions: ${deepseekNames}`)
    assert.notEqual(deepseekNames[0], deepseekNames[1], "distinct stream name across sessions")
    await cleanupConsultSessions(agent)
  })

  it("consultant reasoning + output text stream into the panel (consult-UI review)", async () => {
    const agent = makeAgent(MODELS)
    const panels = []
    const runner = async (provider, cwd, task, callbacks) => {
      callbacks.onReasoning?.("deep thinking...") // onReasoning: no depth gate, must flow
      callbacks.onToken?.("final answer text")    // onToken: consult exempted in agent.mjs
      return "diagnosis"
    }
    const ctx = makeCtx(agent, runner)
    ctx.callbacks = { onToolPanel: (name, chunk) => panels.push({ name, chunk }) }
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await sleep(50)
    assert.ok(panels.some((p) => p.chunk.kind === "think" && p.chunk.text === "deep thinking..."), "reasoning streams as think chunk")
    assert.ok(panels.some((p) => p.chunk.kind === "text" && p.chunk.text === "final answer text"), "output streams as text chunk")
    await cleanupConsultSessions(agent)
  })

  it("watchdog timeout settles as 'timed out', not 'aborted' (a timeout is not a provider crash)", async () => {
    const agent = makeAgent([MODELS[0]])
    agent.config.agent.consultTimeoutMs = 50
    // runner that never resolves on its own — only the watchdog abort can end it
    const hang = (provider, cwd, task, callbacks, signal) => new Promise((resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })
    })
    const ctx = makeCtx(agent, hang)
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 2000)
    const sess = pendingOf(agent)[0]
    assert.ok(sess.replies[0].reply.includes("timed out"), `timeout note, got: ${sess.replies[0].reply}`)
    assert.ok(!sess.replies[0].reply.includes("Aborted"), "must not read as an abort/provider crash")
    await cleanupConsultSessions(agent)
  })

  it("consultTurns/consultTimeoutMs config values flow through to children (not just defaults)", async () => {
    const agent = makeAgent(MODELS)
    agent.config.agent.consultTurns = 7
    agent.config.agent.consultTimeoutMs = 12345
    const seen = []
    const runner = async (provider, cwd, task, callbacks, signal, auto, opts) => {
      seen.push(opts)
      return "ok"
    }
    const ctx = makeCtx(agent, runner)
    await consultStartTool.execute({ problem: "stuck" }, ctx)
    await sleep(50)
    assert.equal(seen.length, 3)
    for (const o of seen) {
      assert.equal(o.maxTurns, 7, "configured consultTurns reaches the child")
    }
    await cleanupConsultSessions(agent)
  })

  it("T-R17l: overlong digest is offloaded (N1 护栏——>64K 落盘 + 预览)", async () => {
    const agent = makeAgent([MODELS[0]])
    const big = "x".repeat(70_000)
    const runner = async () => big
    const cwd = mkdtempSync(join(tmpdir(), "tc-consult-l-"))
    try {
      const ctx = makeCtx(agent, runner)
      ctx.cwd = cwd
      await consultStartTool.execute({ problem: "stuck" }, ctx)
      await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 2000)
      const sess = pendingOf(agent)[0]
      const hist = []
      injectConsultResult(sess, { history: hist, fullHistory: [], cwd })
      const text = hist[0].content
      assert.ok(text.includes("consultation #1 finished"), "header intact")
      assert.ok(text.includes("[Large output saved"), "overlong body offloaded with path preview")
      assert.ok(text.length < 66_000, "injected preview stays bounded (head+tail preview ≤ MAX_TOOL_RESULT)")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("sessions settle into the digest stream once — subsequent settles do not double-park", async () => {
    const agent = makeAgent([MODELS[0]])
    const runner = fakeRunner({ "m-a": { reply: "A", delay: 10 } })
    await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent, runner.fn))
    await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 2000)
    await sleep(50)
    assert.equal(pendingOf(agent).length, 1, "park once")
    await cleanupConsultSessions(agent)
  })

  // ── review 修复轮（advisor #1——两条 🟡 机制一致性）──
  it("T-R17q: 手动档 digest consult_start 机械拒（spawn 闸同型——digest 动作域零例外）", async () => {
    const agent = makeAgent(MODELS)
    const ctx = makeCtx(agent, async () => "never")
    ctx.getAuto = undefined // 手动档（无 AUTO）
    agent._inAutoTurn = true
    const r = JSON.parse(String(await consultStartTool.execute({ problem: "stuck" }, ctx)))
    assert.equal(r.status, "error")
    assert.match(r.error, /cannot start consultations from a manual auto-turn/)
    assert.equal(agent.history._consultSessions?.size ?? 0, 0, "拒后无会话（机械拒绝先于一切变更）")
    // AUTO tier 豁免（推进型——用户授权的无人值守续跑可启会诊）
    agent._inAutoTurn = true
    const ctx2 = makeCtx(agent, async () => "AUTO consult reply")
    ctx2.getAuto = () => true
    const ok = JSON.parse(String(await consultStartTool.execute({ problem: "stuck" }, ctx2)))
    assert.ok(ok.id, "AUTO tier 放行")
    await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 2000)
    const parked = pendingOf(agent)[0]
    assert.equal(parked.failed, 0, "回复照常入 digest")
    await cleanupConsultSessions(agent)
  })

  it("T-R17r: Ctrl+I 中断豁免——在飞会诊子代理不误杀（F2 同型——仅全停沿链传播）", async () => {
    const agent = makeAgent([MODELS[0]])
    // 挂起 runner：监听自身 controller signal（runConsultChild 传入）——被 abort 时记录
    const aborted = { n: 0 }
    let release
    const hang = async (p, c, t, cb, sig) => new Promise((res) => {
      sig?.addEventListener?.("abort", () => { aborted.n++; res("aborted reply") }, { once: true })
      release = res
    })
    const turnCtl = new AbortController()
    const ctx = makeCtx(agent, hang, turnCtl.signal)
    const r = JSON.parse(String(await consultStartTool.execute({ problem: "stuck" }, ctx)))
    assert.ok(r.id, "会诊已启动")
    const map = agent.history._consultSessions
    const session = map.get(r.id)
    await sleep(30) // 子代理进入挂起
    // Ctrl+I：turn 信号带 interrupt reason 中止（panel-messages 同型 abort({interrupt:true})）
    turnCtl.abort({ interrupt: true, message: "user interrupt" })
    await sleep(50)
    assert.equal(aborted.n, 0, "interrupt 不逐链中止子代理（意见不丢）")
    assert.equal(map.has(r.id), true, "会话仍在飞（pending 未归零——无误 park）")
    // 子代理正常完成 → 照常 settle → digest
    release("final reply")
    await waitFor(() => (pendingOf(agent)?.length ?? 0) === 1, 2000)
    const parked = pendingOf(agent)[0]
    assert.equal(parked.failed, 0, "回复完整（无失败注记噪音）")
    assert.ok(parked.replies.some((x) => x.reply === "final reply"), "意见在 digest 内")
    // 对照：全停（无 interrupt reason）仍逐链中止
    const agent2 = makeAgent([MODELS[0]])
    let aborted2 = 0
    const hang2 = async (p, c, t, cb, sig) => new Promise((res) => {
      sig?.addEventListener?.("abort", () => { aborted2++; res("aborted reply") }, { once: true })
      release = res
    })
    const ctl2 = new AbortController()
    const r2 = JSON.parse(String(await consultStartTool.execute({ problem: "stuck" }, makeCtx(agent2, hang2, ctl2.signal))))
    await sleep(30)
    ctl2.abort() // Stop——无 reason
    await sleep(50)
    assert.equal(aborted2, 1, "全停沿链中止（既有语义保持）")
    // 真实循环 plain-abort 分支同型收尾（run-stages 同点：清 pending 容器 + cleanup 标记
    // stopped）→ 迟到 settle 弃——不入 digest 流（T-R17c）
    agent2.history._pendingConsultResults = []
    await cleanupConsultSessions(agent2)
    await sleep(50)
    assert.equal(pendingOf(agent2)?.length ?? 0, 0, "全停中止不入 digest 流")
    await cleanupConsultSessions(agent)
    await cleanupConsultSessions(agent2)
  })
})
