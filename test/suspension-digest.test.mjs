/**
 * suspension-digest.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): suspension.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { LONG_REPORT } from "./helpers/long-report.mjs"
import { createServer } from "node:http"
import { createAgent } from "../src/agent.mjs"

function asyncServer(script) {
  return import("node:http").then(({ createServer }) => {
    let i = 0
    const server = createServer((req, res) => {
      let bodyText = ""
      req.on("data", (c) => (bodyText += c))
      req.on("end", async () => {
        const step = script[Math.min(i++, script.length - 1)]
        if (step.delay) await new Promise((r) => setTimeout(r, step.delay))
        const frames = step.toolCall
          ? `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: `call_${i}`, function: { name: step.toolCall.name, arguments: step.toolCall.arguments ?? "{}" } }] } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
            `data: [DONE]\n\n`
          : `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: step.content } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            `data: [DONE]\n\n`
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(frames)
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }))
    })
  })
}
function asyncParent(provider, cwd, extra = {}) {
  return import("../src/agent.mjs").then(({ createAgent }) =>
    createAgent({ provider, tools: [], config: { agent: {} }, cwd, ...extra }))
}
function trackedCtx(overrides) {
  const ctx = driverCtx(overrides)
  cleanups.push(ctx.agent.cwd)
  return ctx
}
function fakeEntry(agent, id, role = "coder") {
  agent._asyncSubagents ??= new Map()
  agent._asyncQueue ??= []
  let _settle
  const entry = {
    id: String(id), role, relayPrefix: `${role}#${id}/`,
    status: "running", report: null, error: null, done: false,
    promise: new Promise((res) => { _settle = res }),
    _settle: () => _settle(),
  }
  agent._asyncSubagents.set(String(id), entry)
  return entry
}
function mockSettle(agent, entry, report = `report-${entry.id}`) {
  entry.report = report
  entry.status = "done"
  entry.done = true
  for (const w of (agent._asyncWaiters ?? []).splice(0)) { try { w() } catch { /* noop */ } }
  entry._settle()
}
function poolSize(agent) {
  return (agent._asyncSubagents?.size ?? 0) + (agent._pendingAsyncResults?.length ?? 0)
}
function driverCtx(overrides = {}) {
  const agent = {
    cwd: mkdtempSync(join(tmpdir(), "thincoder-susp-")),
    provider: { model: "test-model" },
    history: [],
    config: {},
    tasks: [],
    tools: [],
    title: "test",
  }
  const state = {
    lines: [], streaming: "", reasoning: "",
    subTasks: {}, tasks: [], queue: [], pendingInput: [],
    processing: false, controller: null, interruptPrompt: null,
    permission: null, currentTool: null, processingStarted: 0,
    status: "Ready", suspended: false,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  }
  const calls = { runAgent: [], slash: [], saved: 0, suspendedDuringUser: null }
  const ctx = {
    agent, state, calls,
    pushLine: (text, color, kind) => state.lines.push({ text, color, _kind: kind }),
    pushLabel: (text) => state.lines.push({ kind: "label", text }),
    render: () => {},
    scheduleRender: () => {},
    ensureAssistantLabel: () => {},
    askPermission: async () => true,
    askBatchPermission: async () => "approveAll",
    askQuestion: async () => "",
    handleSlash: async (text) => { calls.slash.push(text) },
    summarize: () => "",
    // 默认 mock：记录调用（含当时 _suspended）+ 模拟 runAgent 首行的 D-S3 pending
    // 注入消费（消化轮开跑即把 pending 注入历史——真实实现 splice 后 pushReal reminder）
    runAgent: async (_agent, text, _cbs, opts) => {
      const rec = { text, autoTurn: opts?.autoTurn ?? false, suspended: agent._suspended }
      calls.runAgent.push(rec)
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) {
          agent.history.push({ role: "user", content: `[System reminder: async subagent #${e.id} finished]\n${e.report ?? e.error ?? ""}` })
        }
      }
      return "ok"
    },
    saveSession: () => { calls.saved++ },
    ...overrides,
  }
  return ctx
}
const cleanups = []


// ═══════════════════════════════════════════════════════════════════════════
// agent 级：auto-turn（T-S7 / T-S10 / T-S11 / T-S12 / T-S16 / T-S8）
// ═══════════════════════════════════════════════════════════════════════════


test("T-S7 手动档消化：autoTurn 注入 pending + 消化动作域模板，模型总结进会话", async () => {
  const { server, port } = await asyncServer([{ content: "digested: 要点A、要点B" }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-susp-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    // 挂起期 settle 记账形态：pending 已就绪（settle 回调已移交）
    parent._pendingAsyncResults = [{ id: "1", role: "coder", report: LONG_REPORT("消化物") }]
    const out = await runAgent(parent, "", {}, { autoTurn: true })
    assert.equal(out, "digested: 要点A、要点B")
    // 注入的 reminder 在历史（消化轮开跑前落定）
    const injected = parent.history.find((m) => String(m.content ?? "").includes("async subagent #1 (coder) finished"))
    assert.ok(injected, "pending 在 auto-turn 开跑前注入")
    assert.equal(parent._pendingAsyncResults.length, 0, "注入即消费")
    // 手动档（无 AUTO）：消化动作域模板注入（D-S6 organize-only）
    const domain = parent.history.find((m) => String(m.content ?? "").includes("auto-turn — background async subagents finished"))
    assert.ok(domain, "手动档注入消化动作域模板")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-S11 合并消化：多 pending 一次注入一轮消化（N1 成本护栏）", async () => {
  const { server, port } = await asyncServer([{ content: "digested: 合并结果" }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-susp-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    parent._pendingAsyncResults = [
      { id: "1", role: "coder", report: LONG_REPORT("甲") },
      { id: "2", role: "coder", report: LONG_REPORT("乙") },
    ]
    const out = await runAgent(parent, "", {}, { autoTurn: true })
    assert.equal(out, "digested: 合并结果")
    const injected = parent.history.filter((m) => String(m.content ?? "").includes("async subagent #"))
    assert.equal(injected.length, 2, "一轮注入全部 pending")
    assert.equal(parent._pendingAsyncResults.length, 0)
    assert.equal(injected[0].content.includes("#1"), true)
    assert.equal(injected[1].content.includes("#2"), true)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})


// ═══════════════════════════════════════════════════════════════════════════
// 驱动级：挂起会话状态机（T-S3 / T-S5 / T-S6 / T-S9 / T-S17）
// ═══════════════════════════════════════════════════════════════════════════


test("T-S6 挂起自然退出：池空（settle → digest 消化完）→ 逐条冻结回收 → idle（冻结块按 settle 锚点落 digest 总览文本之前——round1 #1 裁定）", async () => {
  const ctx = trackedCtx({
    runAgent: async (agent, text, cbs, opts) => {
      const rec = { text, autoTurn: opts?.autoTurn ?? false, suspended: agent._suspended }
      ctx.calls.runAgent.push(rec)
      // 真实 settle 回调序列（subagent.mjs 挂起分流：_suspended 时 [model]/⟦ev⟧settled
      // token + pending 移交 + wake）——从首回合的 callbacks 发射（settle 回调持有
      // spawn 回合的 callbacks），TUI token 在 digest 文本进流之前路由
      if (rec.text === "首回合") {
        setTimeout(() => {
          cbs.onToken?.(`${ctx.entryA.relayPrefix}[model]test-model`)
          cbs.onToken?.(`${ctx.entryA.relayPrefix}⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`)
          mockSettle(agent, ctx.entryA, LONG_REPORT("A 结果"))
        }, 60)
      }
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) {
          agent.history.push({ role: "user", content: `[System reminder: async subagent #${e.id} finished]\n${e.report ?? e.error ?? ""}` })
        }
      }
      // digest 轮的模型总览文本（真实路径 = digest LLM 输出流进会话流——在 settle 之后）
      if (opts?.autoTurn) ctx.pushLine("[digest 总览] A 结果要点…", undefined, undefined)
      return "ok"
    },
  })
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1)
  ctx.entryA = A
  await runAgentTurn(ctx, "首回合")
  // 回合 → 挂起 → settle → 1 次消化 → 池空 → 退出 idle
  assert.deepEqual(ctx.calls.runAgent.map((c) => c.text), ["首回合", ""], "用户回合 + 一个消化轮")
  assert.equal(ctx.calls.runAgent[1].autoTurn, true, "消化轮是 autoTurn")
  assert.equal(ctx.agent._suspended, false, "退出后 _suspended 清除")
  assert.equal(ctx.state.suspended, false, "退出后 state.suspended 清除")
  assert.equal(ctx.state.status, "Ready")
  assert.equal(ctx.agent._sessionAbort, null)
  assert.equal(ctx.agent._sessionSignal, null)
  assert.equal(ctx.state.pendingInput.length, 0)
  assert.equal(poolSize(ctx.agent), 0, "池清空")
  // 冻结块落位（§17.5.5 + round1 #1 裁定——位置 = settle 锚点 splice——digest 总览
  // 文本之前，与 2026-09-03 修复轮/D-S8 锚点语义同口径）：digest 消化完成即逐条冻结
  // 回收（freezeReclaimDigestedBlocks——挂起会话 loop 在 digestTurn 后调用——不等池空）
  const frozen = ctx.state.lines.find((l) => l._frozenSubTask?.key === "coder#1")
  assert.ok(frozen, "消化完成块已冻结进流（逐条回收——不等池空）")
  const carrierIdx = ctx.state.lines.indexOf(frozen)
  const digestIdx = ctx.state.lines.findIndex((l) => String(l.text).includes("digest 总览"))
  assert.ok(digestIdx > carrierIdx && carrierIdx >= 0,
    `冻结块（idx=${carrierIdx}）位于 digest 总览文本（idx=${digestIdx}）之前（settle 锚点——round1 #1）`)
  assert.equal(ctx.state.subTasks["coder#1"], undefined, "冻结后从驻留面板释放")
})


// ═══════════════════════════════════════════════════════════════════════════
// §17.5 硬化轮（AGENT-LOOP.md §17.5——T-H1..H7；collectSettled 语义变更 +
// 17.5.5 digest 完成逐条冻结回收）
// ═══════════════════════════════════════════════════════════════════════════


test("T-H1 回合中 settle → 回合尾消化轮：报告注入模型上下文 + 消化输出进流（AC-H1——不再直注入排空）", async () => {
  const ctx = trackedCtx({
    runAgent: async (agent, text, cbs, opts) => {
      ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
      if (text === "首回合") {
        // 回合中 settle（真实：子代理在父回合 processing 期完成——非挂起分流）
        setTimeout(() => {
          cbs.onToken?.(`${ctx.entryA.relayPrefix}[model]test-model`)
          // 非挂起 settle → 完成即冻结（settle 时刻流位置——不变面）
          cbs.onToken?.(`${ctx.entryA.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
          mockSettle(agent, ctx.entryA, LONG_REPORT("A 结果"))
        }, 30)
        await new Promise((r) => setTimeout(r, 80)) // 回合仍在 processing（消化轮未开）
        return "主会话收尾"
      }
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) {
          agent.history.push({ role: "user", content: `[System reminder: async subagent #${e.id} finished]\n${e.report ?? ""}` })
        }
      }
      return "ok"
    },
  })
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1)
  ctx.entryA = A
  await runAgentTurn(ctx, "首回合")
  // 回合中 settle 条目留池（suspDriven collect 不再直注入）→ 回合尾 willSuspend →
  // 挂起会话首轮 sweep → 消化轮注入（报告必达模型）
  assert.deepEqual(ctx.calls.runAgent.map((c) => c.text), ["首回合", ""], "用户回合 + 一个消化轮")
  assert.equal(ctx.calls.runAgent[1].autoTurn, true, "消化轮是 autoTurn")
  const injected = ctx.agent.history.find((m) => String(m.content ?? "").includes("async subagent #1 finished"))
  assert.ok(injected, "消化轮注入报告（AC-H1——报告必达模型）")
  assert.ok(String(injected.content).includes("A 结果 report"), "报告文本注入")
  assert.ok(ctx.state.lines.some((l) => String(l.text).includes("[auto-turn: digesting finished subagent reports…]")),
    "消化轮触发可见（AC-H1 消化输出进流）")
  // 回合中 done 冻结仍在 settle 时刻（不变面——非挂起 settle 完成即冻结）
  const frozenIdx = ctx.state.lines.findIndex((l) => l._frozenSubTask?.key === "coder#1")
  assert.ok(frozenIdx >= 0 && frozenIdx <= 2, `mid-turn settle 块冻结在 settle 时刻流位置（idx=${frozenIdx}）`)
  assert.equal(poolSize(ctx.agent), 0, "消化完池空")
  assert.equal(ctx.state.suspended, false, "自然退出")
  assert.equal(ctx.state.status, "Ready")
})



test("T-H2 多条目近邻 settle → 合并一轮消化（N1 成本护栏——不逐条烧轮）", async () => {
  const ctx = trackedCtx({
    runAgent: async (agent, text, cbs, opts) => {
      ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
      if (text === "首回合") {
        setTimeout(() => {
          cbs.onToken?.(`${ctx.entryA.relayPrefix}[model]m`)
          cbs.onToken?.(`${ctx.entryA.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
          mockSettle(agent, ctx.entryA, LONG_REPORT("A 结果"))
        }, 30)
        setTimeout(() => {
          cbs.onToken?.(`${ctx.entryB.relayPrefix}[model]m`)
          cbs.onToken?.(`${ctx.entryB.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
          mockSettle(agent, ctx.entryB, LONG_REPORT("B 结果"))
        }, 50)
        await new Promise((r) => setTimeout(r, 100))
        return "收尾"
      }
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) {
          agent.history.push({ role: "user", content: `[System reminder: async subagent #${e.id} finished]\n${e.report ?? ""}` })
        }
      }
      return "ok"
    },
  })
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1)
  const B = fakeEntry(ctx.agent, 2)
  ctx.entryA = A
  ctx.entryB = B
  await runAgentTurn(ctx, "首回合")
  const autos = ctx.calls.runAgent.filter((c) => c.autoTurn)
  assert.equal(autos.length, 1, "近邻 settle 合并一轮消化")
  const injected = ctx.agent.history.filter((m) => String(m.content ?? "").includes("finished"))
  assert.equal(injected.length, 2, "一轮注入两条（A+B）")
  assert.equal(poolSize(ctx.agent), 0)
  assert.equal(ctx.state.status, "Ready")
})



test("T-H3 check 提前消费 → 池空 → 无多余消化轮（AC-H2——不重复烧）", async () => {
  const ctx = trackedCtx({
    runAgent: async (_agent, text, cbs, opts) => {
      ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
      if (text === "首回合") {
        setTimeout(() => {
          cbs.onToken?.(`${ctx.entryA.relayPrefix}[model]m`)
          cbs.onToken?.(`${ctx.entryA.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
          mockSettle(_agent, ctx.entryA, LONG_REPORT("A 结果"))
        }, 30)
        setTimeout(() => {
          // 模型 action:'check' 消费（取走即从池删除——T3 消费语义）
          _agent._asyncSubagents.delete(String(ctx.entryA.id))
        }, 60)
        await new Promise((r) => setTimeout(r, 100))
        return "check 已取回"
      }
      return "ok"
    },
  })
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1)
  ctx.entryA = A
  await runAgentTurn(ctx, "首回合")
  assert.deepEqual(ctx.calls.runAgent.map((c) => c.text), ["首回合"], "check 消费后无消化轮（不重复烧）")
  assert.ok(!ctx.agent.history.some((m) => String(m.content ?? "").includes("finished")), "无收尾注入（check 已消费——结果在工具结果里）")
  assert.equal(poolSize(ctx.agent), 0)
  assert.equal(ctx.state.status, "Ready")
})



test("T-H5 挂起态 settle 路径回归：挂起期 settle → settled 分流驻留 + digest 消化 + 逐条回收（既有好路径不变）", async () => {
  const ctx = trackedCtx({
    runAgent: async (agent, text, cbs, opts) => {
      ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false, suspended: agent._suspended })
      if (text === "首回合") {
        // 挂起期 settle（回合已结束、会话 wait 期——真实 settle 回调挂起分流）
        setTimeout(() => {
          cbs.onToken?.(`${ctx.entryA.relayPrefix}[model]m`)
          cbs.onToken?.(`${ctx.entryA.relayPrefix}⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`)
          mockSettle(agent, ctx.entryA, LONG_REPORT("A 结果"))
        }, 60)
        return "收尾"
      }
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) {
          agent.history.push({ role: "user", content: `[System reminder: async subagent #${e.id} finished]\n${e.report ?? ""}` })
        }
      }
      return "ok"
    },
  })
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1)
  ctx.entryA = A
  await runAgentTurn(ctx, "首回合")
  assert.deepEqual(ctx.calls.runAgent.map((c) => c.text), ["首回合", ""], "settle → 消化轮")
  assert.equal(ctx.calls.runAgent[1].suspended, true, "消化轮执行期 _suspended=true（settle 延迟冻结语义）")
  const injected = ctx.agent.history.find((m) => String(m.content ?? "").includes("async subagent #1 finished"))
  assert.ok(injected, "消化注入")
  // 挂起期 settled 块：digest 完成后逐条冻结回收进流（settle 锚点 splice——digest
  // banner/总览文本之前——round1 #1 裁定；非池空补发——T-H7 同族）
  const carrierIdx = ctx.state.lines.findIndex((l) => l._frozenSubTask?.key === "coder#1")
  const bannerIdx = ctx.state.lines.findIndex((l) => String(l.text).includes("[auto-turn:"))
  assert.ok(carrierIdx >= 0 && bannerIdx > carrierIdx, "消化后回收冻结（块落 settle 锚点——digest banner 之前）")
  assert.equal(ctx.state.subTasks["coder#1"], undefined, "已回收——面板无残留")
  assert.equal(poolSize(ctx.agent), 0)
  assert.equal(ctx.state.status, "Ready")
})



test("T-H7 digest 完成即逐条冻结回收——池内其他子代理运行中（AC-H5——块回收与池空解耦；面板仅剩仍 running；冻结块 splice 落 settle 锚点——digest 总览文本之前）", async () => {
  const ctx = trackedCtx({
    runAgent: async (agent, text, cbs, opts) => {
      ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) {
          agent.history.push({ role: "user", content: `[System reminder: async subagent #${e.id} finished]\n${e.report ?? ""}` })
        }
      }
      if (text === "首回合") {
        // A8 先 spawn 长跑（面板 live）；A9 挂起期 settle（60ms——settled 分流驻留）
        cbs.onToken?.(`${ctx.entry8.relayPrefix}[model]m8`)
        setTimeout(() => {
          cbs.onToken?.(`${ctx.entry9.relayPrefix}[model]m9`)
          cbs.onToken?.(`${ctx.entry9.relayPrefix}⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`)
          mockSettle(agent, ctx.entry9, LONG_REPORT("A9 结果"))
        }, 60)
        // A8 更晚 settle（350ms——A9 消化完成后仍 running）
        setTimeout(() => {
          cbs.onToken?.(`${ctx.entry8.relayPrefix}⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`)
          mockSettle(agent, ctx.entry8, LONG_REPORT("A8 结果"))
        }, 350)
        return "收尾"
      }
      // 每个消化轮开始时快照面板（观察中间态：A9 消化回收后、A8 settle 前）
      ctx.calls.subKeysAtDigest ??= []
      ctx.calls.subKeysAtDigest.push(Object.keys(ctx.state.subTasks).sort())
      ctx.pushLine(`[digest 总览 ${ctx.calls.subKeysAtDigest.length}] 消化文本`, undefined, undefined)
      return "ok"
    },
  })
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A8 = fakeEntry(ctx.agent, 8)
  const A9 = fakeEntry(ctx.agent, 9)
  ctx.entry8 = A8
  ctx.entry9 = A9
  await runAgentTurn(ctx, "首回合")
  const autos = ctx.calls.runAgent.filter((c) => c.autoTurn)
  assert.equal(autos.length, 2, "A9 消化轮 + A8 消化轮")
  assert.equal(ctx.calls.subKeysAtDigest[1].length, 1, "A9 已回收——A8 消化轮开始时面板仅剩 A8（运行中→驻留）")
  assert.deepEqual(ctx.calls.subKeysAtDigest[1], ["coder#8"], "面板仅剩仍 running/待消化的 A8（T-H7）")
  // 流位置：A9 块 splice 落其 settle 锚点（digest1 总览文本之前——round1 #1 裁定），
  // 早于 A8 块（各自 settle 锚点——回收时序解耦但位置不受池空影响）
  const digest1Idx = ctx.state.lines.findIndex((l) => String(l.text).includes("[digest 总览 1]"))
  const carrier9 = ctx.state.lines.find((l) => l._frozenSubTask?.key === "coder#9")
  const carrier8 = ctx.state.lines.find((l) => l._frozenSubTask?.key === "coder#8")
  assert.ok(carrier9 && carrier8, "两条均冻结进流")
  assert.ok(ctx.state.lines.indexOf(carrier9) < digest1Idx, "A9 块落 settle 锚点——digest1 总览文本之前（round1 #1）")
  assert.ok(ctx.state.lines.indexOf(carrier9) < ctx.state.lines.indexOf(carrier8), "A9 先于 A8（各自 settle 锚点）")
  assert.equal(poolSize(ctx.agent), 0)
  assert.equal(ctx.state.suspended, false)
  assert.equal(ctx.state.status, "Ready")
})
