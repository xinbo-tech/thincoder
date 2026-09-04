/**
 * suspension-core.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): suspension.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { LONG_REPORT } from "./helpers/long-report.mjs"
import { waitFor } from "./helpers/wait-for.mjs"

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

test("T-S1 回合尾不阻塞 + T-S2 注入不丢（§17 D-S1/D-S3）", async () => {
  const { createServer } = await import("node:http")
  // 内容分流：子代理请求带任务文本（"后台慢活"）；父回合请求只含工具参数（转义）。
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", () => {
      const frames = bodyText.includes('"content":"后台慢活"')
        ? `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: LONG_REPORT("慢完成") } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
        : bodyText.includes("后台慢活")
          ? `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "主会话快速收尾" } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            `data: [DONE]\n\n`
          : `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: "call_1", function: { name: "subagent", arguments: JSON.stringify({ task: "后台慢活", role: "coder", async: true }) } }] } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
            `data: [DONE]\n\n`
      // 子代理 600ms 后完成；父回合 2 立即响应——回合尾不等子代理（T-S1）
      if (bodyText.includes('"content":"后台慢活"')) setTimeout(() => { res.writeHead(200, { "Content-Type": "text/event-stream" }); res.end(frames) }, 600)
      else { res.writeHead(200, { "Content-Type": "text/event-stream" }); res.end(frames) }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-susp-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    // 回合 1：async spawn 后主会话立即收尾（子代理 600ms 后才完成）
    const t0 = Date.now()
    const out1 = await runAgent(parent, "派活", { onPermissionRequest: async () => true })
    const elapsed1 = Date.now() - t0
    assert.equal(out1, "主会话快速收尾")
    assert.ok(elapsed1 < 500, `T-S1: 回合尾不等子代理（elapsed=${elapsed1}ms < 600ms 子代理）`)
    assert.equal(parent._asyncSubagents.size, 1, "未完成项保留在池（不清空）")
    const entry = [...parent._asyncSubagents.values()][0]
    assert.equal(entry.done, false, "子代理仍在 running——回合不等待")
    assert.ok(!parent.history.some((m) => String(m.content ?? "").includes("async subagent #")), "未注入（子代理未完成）")
    // 子代理完成（普通回合语义：非挂起 settle 留在 map，由下个回合尾 collectSettled 注入）
    await entry.promise
    assert.equal(entry.done, true)
    // 回合 2：结果在收尾注入（① 直注入——用户回合语义），零丢失
    await runAgent(parent, "继续", { onPermissionRequest: async () => true })
    const injected = parent.history.find((m) => String(m.content ?? "").includes("async subagent #1 (coder) finished"))
    assert.ok(injected, "T-S2: 已完成项注入（下回合可见）")
    assert.ok(String(injected.content).includes("慢完成 report"), "报告文本注入")
    assert.equal(parent._asyncSubagents.size, 0, "注入后从池移除")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-S2b 挂起期 settle → pending → 下回合 prepareRun 前注入（D-S3 ② 单注入点）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("挂起完成"), delay: 200 }, // 子代理（第 1 请求，延迟保证 settle 晚于 _suspended 置位）
    { content: "回合2回复" },             // 父回合 2
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-susp-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const out = String(await subagentTool.execute({ task: "后台活", role: "coder", async: true }, {
      agent: parent, cwd, callbacks: {}, depth: 0,
    }))
    const entry = parent._asyncSubagents.get(String(JSON.parse(out).id))
    assert.equal(entry.status, "running")
    // 模拟挂起会话：_suspended = true → settle 回调走挂起分流（延迟冻结 + 入 pending）
    parent._suspended = true
    await entry.promise
await waitFor(() => (parent._pendingAsyncResults?.length ?? 0) === 1)
    assert.equal(parent._asyncSubagents.size, 0, "settle 回调把条目移交 pending（从池移除）")
    parent._suspended = false
    // 下一回合（用户回合）runAgent 首行注入 pending → prepareRun 前
    await runAgent(parent, "下一轮", { onPermissionRequest: async () => true })
    assert.equal(parent._pendingAsyncResults.length, 0, "注入即消费（pending 清空）")
    const injected = parent.history.find((m) => String(m.content ?? "").includes("async subagent #1 (coder) finished"))
    assert.ok(injected, "注入不丢")
    const inputIdx = parent.history.findIndex((m) => m.content === "下一轮")
    const injectIdx = parent.history.indexOf(injected)
    assert.ok(injectIdx >= 0 && inputIdx >= 0 && injectIdx < inputIdx, "注入先于用户输入（prepareRun 前落定）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-S4 叠加并发：跨回合 async 池累积（agent 级，上限 4 全局）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("A") },
    { content: LONG_REPORT("B") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-susp-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    const a = JSON.parse(String(await subagentTool.execute({ task: "活A", role: "coder", async: true }, ctx)))
    const b = JSON.parse(String(await subagentTool.execute({ task: "活B", role: "coder", async: true }, ctx)))
    assert.equal(parent._asyncSubagents.size, 2, "同批叠加")
    assert.equal(a.id !== b.id, true)
    // 等全部 settle 收尾（防挂起连接）；pending 移交只发生在会话态——此处非挂起，
    // 完成留在池——由测试直接清理
    await Promise.all([...parent._asyncSubagents.values()].map((e) => e.promise))
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-S8 禁 spawn 分档：手动档 async+同步均机械拒绝 / AUTO 档放行（推进型）", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("AUTO 子代理") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-susp-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    // 手动档（_inAutoTurn && !autoApprove）：async + 同步都拒绝，且不触网（无 server 依赖）
    parent._inAutoTurn = true
    parent.autoApprove = false
    const refAsync = JSON.parse(String(await subagentTool.execute({ task: "x", role: "coder", async: true }, { agent: parent, cwd, callbacks: {}, depth: 0 })))
    assert.equal(refAsync.status, "error")
    assert.equal(refAsync.error, "cannot spawn subagents from a manual auto-turn — wait for user input")
    const refSync = JSON.parse(String(await subagentTool.execute({ task: "x", role: "coder" }, { agent: parent, cwd, callbacks: {}, depth: 0 })))
    assert.equal(refSync.status, "error", "同步 spawn 同拒")
    assert.equal(parent._asyncSubagents?.size ?? 0, 0, "拒绝不登记")
    // AUTO 档：放行——async spawn 正常启动（推进链）
    parent.autoApprove = true
    const ok = JSON.parse(String(await subagentTool.execute({ task: "AUTO 活", role: "coder", async: true }, { agent: parent, cwd, callbacks: {}, depth: 0 })))
    assert.equal(ok.status, "running", "AUTO 档放行 async")
    const entry = parent._asyncSubagents.get(String(ok.id))
    await entry.promise
    assert.equal(entry.done, true)
    assert.ok(String(entry.report).includes("AUTO 子代理 report"))
    parent._inAutoTurn = false
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-S10 权限拒绝不悬挂：手动档 digest 无 permission handler → write 拒绝且不弹面板", async () => {
  const fakeWrite = {
    name: "write", readonly: false,
    description: "write", parameters: { type: "object", properties: { path: { type: "string" } } },
    execute: async () => { throw new Error("must not execute") },
  }
  const { server, port } = await asyncServer([
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "x.txt", content: "x" }) } },
    { content: "digest 收尾" },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-susp-"))
  try {
    const { runAgent, createAgent } = await import("../src/agent.mjs")
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [fakeWrite], config: { agent: {} }, cwd,
    })
    parent._pendingAsyncResults = [{ id: "1", role: "coder", report: "r" }]
    // 手动档装配契约（D-S7）：不传 onPermissionRequest handler
    const out = await runAgent(parent, "", {}, { autoTurn: true })
    assert.equal(out, "digest 收尾", "拒绝不悬挂——回合正常完成")
    const denial = parent.history.find((m) => String(m.content ?? "").includes("no permission handler"))
    assert.ok(denial, "write 被 no-permission-handler 拒绝（结果入历史，无面板）")
    assert.ok(!existsSync(join(cwd, "x.txt")), "文件未被写")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-S12 AUTO 写一致性：AUTO 档 auto-turn = 普通回合全语义（写自动执行）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "cli-susp-"))
  const target = join(cwd, "auto-out.txt")
  const realWrite = {
    name: "write", readonly: false,
    description: "write", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } },
    execute: async ({ path, content }) => { writeFileSync(join(cwd, path), content); return `wrote ${path}` },
  }
  const { server, port } = await asyncServer([
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "auto-out.txt", content: "auto 写的文件" }) } },
    { content: "auto-turn 完成" },
  ])
  try {
    const { runAgent, createAgent } = await import("../src/agent.mjs")
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [realWrite], config: { agent: {} }, cwd, autoApprove: true,
    })
    parent._pendingAsyncResults = [{ id: "1", role: "coder", report: "r" }]
    const out = await runAgent(parent, "", {}, { autoTurn: true })
    assert.equal(out, "auto-turn 完成")
    assert.ok(existsSync(target), "AUTO 档 write 自动执行（与 async 子代理同级信任）")
    assert.equal(parent._mutatedThisRun, true, "写调用记账（guard 语义 = 普通回合）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-S16 压缩兜底回归（N4）：挂起期多注入后 auto-turn 开跑压缩触发", async () => {
  const { server, port } = await asyncServer([
    { content: "compressed summary" }, // 压缩摘要调用（turn 0 压缩先于主 chat）
    { content: "digest after compress" },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-susp-"))
  try {
    const { runAgent, createAgent } = await import("../src/agent.mjs")
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: { agent: { compactThreshold: 5000 } }, cwd,
    })
    // 多条挂起注入累积（大报告）撑爆阈值——估计路径含 system prompt + tools 开销
    parent._pendingAsyncResults = [1, 2, 3].map((i) => ({ id: String(i), role: "coder", report: LONG_REPORT(String(i)).repeat(20) }))
    let compressed = false
    const out = await runAgent(parent, "", { onCompress: () => { compressed = true } }, { autoTurn: true })
    assert.equal(compressed, true, "下轮开跑压缩兜底触发（compressIfNeeded 轮内安全点）")
    assert.equal(out, "digest after compress", "压缩后消化正常继续")
    assert.equal(parent.history.some((m) => String(m.content ?? "").includes("[Context was automatically compacted")), true, "压缩笔记入历史")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-S3 挂起态输入可用：池非空时用户 Enter → 新回合立即开跑（不打断后台）", async () => {
  const ctx = trackedCtx()
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1)
  setTimeout(() => mockSettle(ctx.agent, A, LONG_REPORT("A 结果")), 250)
  // 挂起等待期（settle 前）用户输入到达
  setTimeout(() => {
    ctx.state.pendingInput.push("挂起中插话")
    ctx.state._suspWake?.()
  }, 80)
  await runAgentTurn(ctx, "首回合")
  const texts = ctx.calls.runAgent.map((c) => c.text)
  assert.deepEqual(texts, ["首回合", "挂起中插话", ""], "挂起中输入 → 普通新回合；A settle → 消化轮")
  assert.equal(ctx.calls.runAgent[1].autoTurn, false, "插话是用户回合")
  assert.equal(ctx.calls.runAgent[1].suspended, false, "用户回合执行期 _suspended=false（普通回合语义）")
  assert.equal(ctx.calls.runAgent[2].suspended, true, "消化轮执行期 _suspended=true（settle 延迟冻结 + pending 移交）")
  assert.equal(ctx.agent._suspended, false, "退出后清除")
  assert.equal(ctx.state.status, "Ready")
})



test("T-S5 Ctrl+C 清池回归：挂起会话中止 → 清池不注入 + 冻结 + idle", async () => {
  const ctx = trackedCtx()
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1) // 永不 settle 的长跑子代理
  setTimeout(() => {
    // 模拟 key-handler 挂起态彻底中止（round2 偏差 #4：武装窗口内二次按下语义 =
    // abort 集合（含 _sessionAbort）+ 标记 _suspAborted + 唤醒——单次按下只武装/停 digest）
    ctx.agent._sessionAbort?.abort()
    ctx.state._suspAborted = true
    ctx.state._suspWake?.()
  }, 60)
  await runAgentTurn(ctx, "首回合")
  assert.equal(ctx.agent._asyncSubagents?.size ?? 0, 0, "清池")
  assert.equal(ctx.agent._pendingAsyncResults?.length ?? 0, 0, "pending 清空")
  assert.ok(!ctx.agent.history.some((m) => String(m.content ?? "").includes("async subagent #")), "不注入（用户显式停——无陈旧错误）")
  assert.equal(ctx.agent._suspended, false)
  assert.equal(ctx.state.suspended, false)
  assert.equal(ctx.state.status, "Ready")
})



test("T-S9 排队续发：digest 运行中 Enter → pendingInput 排队 → 轮末自动开新回合（非打断）", async () => {
  const ctx = trackedCtx({
    runAgent: async (agent, text, _cbs, opts) => {
      ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
      if (opts?.autoTurn) {
        // digest 模拟：消化中（150ms）用户 Enter 入队
        setTimeout(() => { ctx.state.pendingInput.push("消化中排队消息") }, 40)
        await new Promise((r) => setTimeout(r, 150))
      }
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) agent.history.push({ role: "user", content: `[reminder ${e.id}]` })
      }
      return "ok"
    },
  })
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1)
  setTimeout(() => mockSettle(ctx.agent, A, "A 结果"), 50)
  await runAgentTurn(ctx, "首回合")
  const texts = ctx.calls.runAgent.map((c) => c.text)
  assert.deepEqual(texts, ["首回合", "", "消化中排队消息"], "digest 完整跑完 → 排队消息自动续发（D-S5）")
  assert.equal(ctx.calls.runAgent[1].autoTurn, true)
  assert.equal(ctx.calls.runAgent[2].autoTurn, false, "排队消息 = 用户回合")
  assert.equal(ctx.state.pendingInput.length, 0)
})



test("T-S17 settle-during-digest：消化中 B settle → 轮末自动续开合并消化轮，不滞留", async () => {
  const ctx = trackedCtx({
    runAgent: async (agent, text, _cbs, opts) => {
      ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
      if (opts?.autoTurn) {
        // 消化轮 A 运行中，B settle（第 2 个子代理完成）——真实路径 = settle 回调
        // （_suspended=true）移交 pending；此处模拟回调效果
        if (!ctx.bSettled) {
          ctx.bSettled = true
          setTimeout(() => mockSettle(agent, ctx.entryB, "B 结果"), 40)
        }
        await new Promise((r) => setTimeout(r, 120))
      }
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) agent.history.push({ role: "user", content: `[reminder ${e.id}]` })
      }
      return "ok"
    },
  })
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1)
  const B = fakeEntry(ctx.agent, 2)
  ctx.entryB = B
  // A 先 settle → digest D1；B 在 D1 消化中 settle
  setTimeout(() => mockSettle(ctx.agent, A, "A 结果"), 50)
  await runAgentTurn(ctx, "首回合")
  const autos = ctx.calls.runAgent.filter((c) => c.autoTurn)
  assert.equal(autos.length, 2, "D1 消化 A + 合并消化轮 D2 消化 B（round3 #1 不滞留）")
  const consumed = ctx.agent.history.filter((m) => String(m.content ?? "").startsWith("[reminder"))
  assert.deepEqual(consumed.map((m) => m.content), ["[reminder 1]", "[reminder 2]"], "D1 注入 A、D2 注入 B——各只注入一次")
  assert.equal(ctx.agent._suspended, false, "全部消化完自然退出")
  assert.equal(ctx.state.status, "Ready")
})



test("T-H4 滞留期 Ctrl+C：挂起会话中止 → 清 pending 不注入（既有两级中止语义回归——17.5.2 不变面）", async () => {
  const ctx = trackedCtx({
    runAgent: async (agent, text, cbs, opts) => {
      ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
      if (text === "首回合") {
        setTimeout(() => {
          cbs.onToken?.(`${ctx.entryA.relayPrefix}[model]m`)
          cbs.onToken?.(`${ctx.entryA.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
          mockSettle(agent, ctx.entryA, LONG_REPORT("A 结果"))
        }, 30)
        await new Promise((r) => setTimeout(r, 80))
        return "收尾"
      }
      // 消化轮 mock：注入前延迟——模拟中止落在 digest 消费 pending 之前（滞留期）
      await new Promise((r) => setTimeout(r, 150))
      const pend = agent._pendingAsyncResults
      if (pend?.length && !ctx.state._suspAborted && !agent._sessionAbort?.signal.aborted) {
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
  // 消化轮在途（滞留期 pending 未注入）→ 用户彻底中止（武装窗口内二次按下语义 = T-S5 同款）
  setTimeout(() => {
    ctx.agent._sessionAbort?.abort()
    ctx.state._suspAborted = true
    ctx.state._suspWake?.()
  }, 120)
  await runAgentTurn(ctx, "首回合")
  assert.equal(ctx.agent._pendingAsyncResults?.length ?? 0, 0, "pending 清空（中止不注入）")
  assert.equal(ctx.agent._asyncSubagents?.size ?? 0, 0, "清池")
  assert.ok(!ctx.agent.history.some((m) => String(m.content ?? "").includes("finished")), "滞留条目不注入（用户显式停）")
  assert.equal(ctx.agent._suspended, false)
  assert.equal(ctx.state.status, "Ready")
})


// ═══════════════════════════════════════════════════════════════════════════
// 偏差修复轮（2026-09-02 code review findings #1 / #3-CLI）回归测试
// ═══════════════════════════════════════════════════════════════════════════


test("偏差#1 释放窗口竞态：finally await 中 Enter → 入队不并发开回合；挂起会话正常消费", async () => {
  const { createKeyHandler } = await import("../src/tui/key-handler.mjs")
  const ctx = trackedCtx()
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1)
  // 拉长释放窗口：回合 finally 的蒸馏 flush 在途（真实 await）——窗口 = processing=false
  // 且 _suspPending=true 且 suspended 尚未置位（suspensionSession 启动前）
  let releaseDistill
  ctx.agent._pendingDistill = new Promise((r) => { releaseDistill = r })
  ctx.distillFlushTimeoutMs = 1000 // 短超时：race 定时器不随蒸馏落定而清除，过长会拖住套件退出
  const turnP = runAgentTurn(ctx, "首回合")
  await waitFor(() => ctx.state.processing === false && ctx.state._suspPending === true)
  const submitted = []
  const handler = createKeyHandler({
    ...ctx,
    popPicker: () => false, renderPickerLines: () => {}, handleTab: () => {},
    submit: async () => { submitted.push("submit") }, pasteClipboardImage: async () => {},
    wizardChooseProvider: () => {}, wizardSubmitText: () => {}, cancelWizard: () => {},
    wizardProviderItems: () => [], renderWizard: () => {}, cleanup: () => {}, showPicker: () => {}, loadOlder: () => {},
  })
  ctx.state.input = [..."窗口输入"]
  ctx.state.cursor = 4
  ctx.state.history = []
  ctx.state.historyIndex = -1
  ctx.state._draft = null
  handler("\r", { name: "return" })
  assert.deepEqual(ctx.state.pendingInput, ["窗口输入"], "窗口内 Enter → pendingInput（不并发开回合）")
  assert.equal(submitted.length, 0, "不走 submit——无双驱动器")
  assert.equal(ctx.calls.runAgent.length, 1, "仅一个回合在跑（无并发 runAgentTurn）")
  assert.equal(ctx.state.processing, false, "仍在释放窗口（回合 finally 未完）")
  // 释放窗口 → 挂起会话启动 → pendingInput 作为新回合消费；子代理 settle → 消化轮 → 自然退出
  setTimeout(() => mockSettle(ctx.agent, A, LONG_REPORT("A 结果")), 60)
  releaseDistill()
  await turnP
  assert.deepEqual(ctx.calls.runAgent.map((c) => c.text), ["首回合", "窗口输入", ""], "用户回合 + 窗口输入新回合 + 消化轮")
  assert.equal(ctx.calls.runAgent[1].autoTurn, false, "窗口输入 = 普通用户回合")
  assert.equal(ctx.calls.runAgent[2].autoTurn, true, "A settle → auto-turn 消化")
  assert.equal(ctx.state._suspPending, false, "挂起会话启动后清标志（只覆盖释放窗口期）")
  assert.equal(ctx.state.suspended, false, "池空自然退出")
  assert.equal(ctx.state.status, "Ready")
})



test("偏差#3 会话中止覆盖回合链全部 controller：Ctrl+I/ContinueError 重建链下 spawn 的 children 同中止", async () => {
  const ctx = trackedCtx()
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const { ContinueError } = await import("../src/agent.mjs")
  const children = [] // { entry }
  const spawnBound = (sig) => {
    ctx.agent._asyncSubagents ??= new Map()
    const id = String(ctx.agent._subAgentCounter = (ctx.agent._subAgentCounter ?? 0) + 1)
    const entry = { id, role: "coder", relayPrefix: `coder#${id}/`, status: "running", report: null, error: null, done: false, promise: null }
    // 绑定真实 signal 的 runner：信号中止 → 条目终态（真实 runChild 的 abort 语义）
    entry.promise = new Promise((resolve, reject) => {
      sig.addEventListener("abort", () => {
        entry.done = true
        entry.error = "aborted"
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
      }, { once: true })
    })
    entry.promise.catch(() => {}) // 断言走 entry 状态；防 unhandled rejection
    ctx.agent._asyncSubagents.set(id, entry)
    children.push(entry)
    return entry
  }
  const sigs = []
  let callNo = 0
  ctx.runAgent = async (_agent, text, _cbs, opts) => {
    callNo++
    ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
    if (opts?.autoTurn) {
      // 会话内消化轮（mock）：消费 pending（真实路径 = runAgent 首行注入）
      const pend = _agent._pendingAsyncResults
      if (pend?.length) pend.splice(0)
      return "ok"
    }
    sigs.push(opts.signal)
    if (callNo === 1) {
      spawnBound(opts.signal) // Ctrl+I 之前 spawn 的 async child（持 C1.signal）
      ctx.state.controller.abort({ interrupt: true, message: "插话" }) // 模拟 key-handler Ctrl+I
      throw Object.assign(new Error("User interrupted"), { name: "AbortError" })
    }
    if (callNo === 2) {
      spawnBound(opts.signal) // Ctrl+I 之后 spawn 的 async child（持 C2.signal）
      throw new ContinueError(201) // 撞 turn cap → 继续询问 → 重建 C3
    }
    spawnBound(opts.signal) // cap 续跑后 spawn 的 child（持 C3.signal）
    return "ok"
  }
  const turnP = runAgentTurn(ctx, "首回合")
  // ContinueError 询问面板：驱动置 state.permission 后由测试应答（同意续跑）
  await waitFor(() => ctx.state.permission !== null)
  ctx.state.permission.resolve(true)
  // 等挂起会话建立（链条 finally 已置 _sessionAbort + _sessionAbortAll 快照）
  await waitFor(() => ctx.agent._sessionAbort !== null && ctx.state.suspended === true)
  assert.equal(sigs.length, 3, "首回合 + Ctrl+I 续跑 + cap 续跑三个 controller")
  assert.ok((ctx.agent._sessionAbortAll ?? []).length >= 3, "abort 集合覆盖链条内全部 controller（C1/C2/C3）")
  assert.equal(children[0].done, true, "中断前 child（C1）在 Ctrl+I 时已被中止")
  assert.equal(children[0].error, "aborted")
  assert.equal(children[1].done, false, "中断后 child（C2）会话中止前仍在跑（旧 controller 未 abort）")
  assert.equal(children[2].done, false, "cap 续跑 child（C3）会话中止前仍在跑")
  // 模拟 key-handler Ctrl+C 的 abort-all（循环行为本身由 TUI 级偏差#3 测试单测；
  // _sessionAbort 显式 abort = 既有 T-S5 路径，保证 pre-fix 行为是干净失败而非悬挂）
  ctx.agent._sessionAbort?.abort()
  for (const c of ctx.agent._sessionAbortAll ?? []) c.abort()
  ctx.state._suspAborted = true
  ctx.state._suspWake?.()
  await turnP
  for (const e of children) {
    assert.equal(e.done, true, `child ${e.id} 会话中止被中止（不跑完整个预算）`)
    assert.equal(e.error, "aborted", `child ${e.id} 中止错误记录`)
  }
  assert.equal(ctx.agent._asyncSubagents?.size ?? 0, 0, "清池不注入")
  assert.ok(!ctx.agent.history.some((m) => String(m.content ?? "").includes("async subagent #")), "不注入陈旧结果")
  assert.equal(ctx.agent._sessionAbortAll, null, "会话句柄集合释放")
  assert.equal(ctx.agent._sessionAbort, null)
  assert.equal(ctx.state.status, "Ready")
})



test("T-S5b round2 偏差#1（_suspAborted 粘滞）：中止挂起会话后标志复位——再 spawn async → 回合尾重新进入挂起态（释放窗口守卫恢复）", async () => {
  const ctx = trackedCtx()
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1) // 永不 settle 的长跑子代理
  // 第一回合：模拟 key-handler 彻底中止（武装窗口内二次按下语义）
  setTimeout(() => {
    ctx.agent._sessionAbort?.abort()
    ctx.state._suspAborted = true
    ctx.state._suspWake?.()
  }, 60)
  await runAgentTurn(ctx, "首回合")
  assert.equal(ctx.agent._asyncSubagents?.size ?? 0, 0, "中止清池")
  assert.equal(ctx.state._suspAborted, false, "round2 #1：中止 unwind 完成后标志已复位（不粘滞——修复前恒 true，挂起功能永久失效）")
  // 第二回合：再 spawn async → 回合尾池 live → 重新进入挂起态
  const B = fakeEntry(ctx.agent, 2)
  // 拉长释放窗口（蒸馏 flush 在途）：验证 :180 释放窗口守卫恢复（粘滞时守卫恒 false——
  // 释放窗口内 Enter 会并发开第二个 runAgentTurn——双驱动器竞态）
  let releaseDistill
  ctx.agent._pendingDistill = new Promise((r) => { releaseDistill = r })
  ctx.distillFlushTimeoutMs = 1000
  const turn2P = runAgentTurn(ctx, "再派活")
  await waitFor(() => ctx.state.processing === false && ctx.state._suspPending === true)
  assert.equal(ctx.state._suspAborted, false, "释放窗口期标志为 false——守卫置位（_suspPending=true 成立）")
  setTimeout(() => mockSettle(ctx.agent, B, LONG_REPORT("B 结果")), 60)
  releaseDistill()
  await turn2P
  assert.deepEqual(ctx.calls.runAgent.map((c) => c.text), ["首回合", "再派活", ""], "回合 2 + settle 消化轮（挂起会话正常重新启动）")
  assert.equal(ctx.agent._suspended, false, "消化完自然退出")
  assert.equal(ctx.state.status, "Ready")
})



test("round2 偏差 #2-CLI：中止挂起会话时 digest 期间排队的用户消息不静默丢弃（转回 state.queue + 提示行）", async () => {
  const ctx = trackedCtx({
    runAgent: async (agent, text, _cbs, opts) => {
      ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
      if (opts?.autoTurn) {
        // digest 模拟：运行中用户 Enter 入队 pendingInput（key-handler 分流，输入框已清空
        // ——用户视为已发送）；随后用户彻底中止（武装窗口内二次按下语义）
        setTimeout(() => { ctx.state.pendingInput.push("中止时排队消息") }, 40)
        setTimeout(() => {
          ctx.agent._sessionAbort?.abort()
          ctx.state._suspAborted = true
          ctx.state._suspWake?.()
        }, 100)
        await new Promise((r) => setTimeout(r, 200))
      }
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) agent.history.push({ role: "user", content: `[reminder ${e.id}]` })
      }
      return "ok"
    },
  })
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const A = fakeEntry(ctx.agent, 1)
  setTimeout(() => mockSettle(ctx.agent, A, "A 结果"), 50)
  await runAgentTurn(ctx, "首回合")
  // 消息未被静默丢弃：不进历史、不丢——转回 state.queue 由下个普通回合续发
  assert.deepEqual(ctx.calls.runAgent.map((c) => c.text), ["首回合", ""], "中止后排队消息不自动开回合（等下个普通提交的队列循环续发）")
  assert.equal(ctx.state.pendingInput.length, 0, "pendingInput 清空（不静默丢）")
  assert.deepEqual(ctx.state.queue.map((q) => q.text), ["中止时排队消息"], "消息转回 state.queue（{text} 条目）")
  assert.ok(ctx.state.lines.some((l) => String(l.text).includes("will run as a normal turn")), "提示行明示去向（不静默丢）")
  assert.equal(ctx.agent._asyncSubagents?.size ?? 0, 0, "中止清池")
  assert.equal(ctx.agent._pendingAsyncResults?.length ?? 0, 0, "pending 清空")
  assert.equal(ctx.agent._suspended, false)
  assert.equal(ctx.state.status, "Ready")
})



test("T-S15 双模式输入：auto-turn 中 Enter = 排队（pendingInput，非打断）；Ctrl+I = 立即打断；输入框零干扰", async () => {
  const { createKeyHandler } = await import("../src/tui/key-handler.mjs")
  const noop = () => {}
  const submitted = []
  const agent = { autoApprove: false }
  const state = {
    input: [..."插话文本"], cursor: 4,
    history: [], historyIndex: -1, _draft: null,
    processing: true, controller: { signal: { aborted: false }, abort: (o) => { state.abortedWith = o } },
    interruptPrompt: null, permission: null, question: null, picker: null, wizard: null,
    search: null, queue: [], pendingInput: [],
    suspended: true, exitArmed: false, status: "后台 1 子代理运行中",
    lines: [],
  }
  let woke = 0
  state._suspWake = () => { woke++ }
  const handler = createKeyHandler({
    agent, state, render: noop, popPicker: () => false, renderPickerLines: noop,
    handleSlash: noop, handleTab: noop,
    submit: async () => { submitted.push("submit") }, pasteClipboardImage: async () => {},
    wizardChooseProvider: noop, wizardSubmitText: noop, cancelWizard: noop,
    wizardProviderItems: () => [], renderWizard: noop,
    pushLine: noop, cleanup: noop, showPicker: noop, loadOlder: noop,
  })
  // 消化中 Enter（非 slash）→ pendingInput 排队 + 唤醒，不打断（interruptPrompt 不弹）
  handler("\r", { name: "return" })
  assert.deepEqual(state.pendingInput, ["插话文本"], "Enter → pendingInput 单槽队列")
  assert.equal(woke, 1, "唤醒挂起会话")
  assert.equal(state.interruptPrompt, null, "不打断 digest")
  assert.equal(state.input.length, 0, "提交后清框（与 submit 同款）")
  assert.equal(submitted.length, 0, "不走 submit")
  // 输入框文本不受后台影响：settle/渲染事件不触碰 state.input（F3 铁律——直接验证：
  // 后台事件路径只经 routeSubToken/render，均不读写 input——此处模拟一轮事件后不变）
  state.input = [..."新草稿"]
  state._suspWake?.()
  assert.deepEqual(state.input, [..."新草稿"], "后台事件不改输入框文本")
  // Ctrl+I（digest 处理中）→ 立即打断（interruptPrompt 弹出，interrupt 注入通道）
  handler("", { ctrl: true, name: "i" })
  assert.ok(state.interruptPrompt, "Ctrl+I 立即打断（interruptPrompt 激活）")
  // 纯挂起（非处理中）Enter → 同样入队
  state.processing = false
  state.interruptPrompt = null
  state.pendingInput = []
  state.input = [..."纯挂起输入"]
  state.cursor = 5
  handler("\r", { name: "return" })
  assert.deepEqual(state.pendingInput, ["纯挂起输入"], "纯挂起 Enter → pendingInput（会话循环立即调度）")
  // 斜杠命令不误入队——走 submit 正常路径（slash 处理不受挂起分流影响）
  state.pendingInput = []
  state.input = [..."/clear"]
  state.cursor = 6
  handler("\r", { name: "return" })
  assert.equal(state.pendingInput.length, 0, "slash 不入 pendingInput")
  assert.deepEqual(submitted, ["submit"], "slash → submit（本地 slash 处理）")
})



test("偏差#1 TUI：释放窗口（_suspPending，suspended 未置位）Enter → pendingInput 不并发开回合", async () => {
  const { createKeyHandler } = await import("../src/tui/key-handler.mjs")
  const noop = () => {}
  const submitted = []
  const agent = { autoApprove: false }
  const state = {
    input: [..."窗口输入"], cursor: 4, history: [], historyIndex: -1, _draft: null,
    processing: false, controller: null, interruptPrompt: null,
    permission: null, question: null, picker: null, wizard: null,
    search: null, queue: [], pendingInput: [],
    suspended: false, _suspPending: true, exitArmed: false, status: "Ready", lines: [],
  }
  let woke = 0
  state._suspWake = () => { woke++ }
  const handler = createKeyHandler({
    agent, state, render: noop, popPicker: () => false, renderPickerLines: noop,
    handleSlash: noop, handleTab: noop,
    submit: async () => { submitted.push("submit") }, pasteClipboardImage: async () => {},
    wizardChooseProvider: noop, wizardSubmitText: noop, cancelWizard: noop,
    wizardProviderItems: () => [], renderWizard: noop,
    pushLine: noop, cleanup: noop, showPicker: noop, loadOlder: noop,
  })
  handler("\r", { name: "return" })
  assert.deepEqual(state.pendingInput, ["窗口输入"], "窗口内 Enter → pendingInput（挂起会话启动后消费）")
  assert.equal(submitted.length, 0, "不走 submit——无双驱动器")
  assert.equal(state.input.length, 0, "提交后清框")
  // 对照：标志未置位且非挂起 → 正常 submit 路径
  state._suspPending = false
  state.pendingInput = []
  state.input = [..."普通消息"]
  state.cursor = 4
  handler("\r", { name: "return" })
  assert.deepEqual(submitted, ["submit"], "窗口外 Enter 走 submit")
  assert.equal(state.pendingInput.length, 0)
})



// ═══════════════════════════════════════════════════════════════════════════
// §18 工程交付协议（AGENT-LOOP.md §18）——挂起/消化侧用例：
//   T-E9 双通道：eng-coder 缺省 async 运行中用户输入 → 新回合正常（§17/§15 回归）
//   T-E10 消化分档回归：手动档 digest 禁 spawn eng-coder（默认 async 也不放行）；
//         AUTO 档可 spawn（推进链不受 §18 影响）
//   T-E11 交付报告 digest 消化：手动档 digest 总结注入（审计/评审记录可见——D-E4）
// ═══════════════════════════════════════════════════════════════════════════

/** 真签名 token（agent.test.mjs signedToken 同款——TTL 令牌不能烘焙固定过期）。 */
async function signedToken(uuid, expiresAt) {
  const { createHmac } = await import("node:crypto")
  const sig = createHmac("sha256", "thincoder-default-secret").update(`${uuid}:${expiresAt}`).digest("hex").slice(0, 16)
  return `${uuid}:${expiresAt}:${sig}`
}


test("T-E9: eng-coder 缺省 async 双通道——后台运行中用户输入照常开新回合；交付 settle 后下轮注入（§18 F5/§15 回归）", async () => {
  const { createServer } = await import("node:http")
  const token = await signedToken("e9e9e9e9-9999-4999-8999-0000000000e9", Date.now() + 24 * 3600 * 1000)
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", () => {
      const send = (content, delay) => {
        const frames = content.startsWith("TOOL:")
          ? `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: "call_1", function: { name: "subagent", arguments: content.slice(5) } }] } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
            `data: [DONE]\n\n`
          : `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            `data: [DONE]\n\n`
        const respond = () => { res.writeHead(200, { "Content-Type": "text/event-stream" }); res.end(frames) }
        if (delay) setTimeout(respond, delay)
        else respond()
      }
      // 路由（T-S1 同款内容字段匹配——父历史里的 tool_calls arguments 是转义形态，
      // 不会误中 content 字段锚点）：
      //  1. eng-coder 子代理（user content "后台 eng 交付"）→ 600ms 慢交付
      //  2. 父首回合（user content "派后台 eng 活" 且尚无 tool 消息）→ spawn eng-coder（无 async 参数 = 缺省 async）
      //  3. 其余父回合按输入文本回话（后续回合含 "role":"tool" 历史，不再命中 spawn 路由）
      if (bodyText.includes('"content":"后台 eng 交付"')) {
        send(LONG_REPORT("E9 eng 交付"), 600)
      } else if (bodyText.includes('"content":"派后台 eng 活"') && !bodyText.includes('"role":"tool"')) {
        send(`TOOL:${JSON.stringify({ task: "后台 eng 交付", role: "eng-coder", designToken: token })}`)
      } else if (bodyText.includes("插话")) {
        send("回合2回复")
      } else {
        send("回合1收尾")
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-e9-"))
  try {
    const { runAgent, createAgent } = await import("../src/agent.mjs")
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    parent._engDesignTokens = new Map([["e9e9e9e9-9999-4999-8999-0000000000e9", token]])
    parent._engDesignToken = token
    // 回合 1：派 eng-coder（不带 async 参数 = 缺省 async）→ 回合立即收尾（不阻塞 600ms）
    const t0 = Date.now()
    const out1 = await runAgent(parent, "派后台 eng 活", { onPermissionRequest: async () => true })
    const elapsed1 = Date.now() - t0
    assert.equal(out1, "回合1收尾", "T-E9: 主回合收尾（子代理在后台）")
    assert.ok(elapsed1 < 500, `T-E9: 回合尾不等子代理（elapsed=${elapsed1}ms < 600ms）`)
    const entry = [...(parent._asyncSubagents?.values() ?? [])][0]
    assert.ok(entry && entry.role === "eng-coder", "T-E9: eng-coder 子代理在池（缺省 async 生效）")
    assert.equal(entry.done, false, "T-E9: 子代理仍在 running")
    // 双通道：子代理运行中用户输入 → 新回合照常执行（§17 F5/F2）
    const out2 = await runAgent(parent, "插话", { onPermissionRequest: async () => true })
    assert.equal(out2, "回合2回复", "T-E9: 后台运行中用户回合正常")
    // 子代理 settle → 下个回合收尾注入交付报告
    await entry.promise
    assert.equal(entry.done, true)
    await runAgent(parent, "收尾", { onPermissionRequest: async () => true })
    const injected = parent.history.find((m) => String(m.content ?? "").includes("async subagent #1 (eng-coder) finished"))
    assert.ok(injected, "T-E9: 交付报告注入（零丢失）")
    assert.ok(String(injected.content).includes("E9 eng 交付 report"), "T-E9: 报告正文注入")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E10: digest 禁 spawn 分档回归——手动档 digest 连默认 async 的 eng-coder 也机械拒绝；AUTO 档放行（§18 不影响 §17 N3/D-S6）", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("AUTO eng 交付") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-e10-"))
  try {
    const { createAgent } = await import("../src/agent.mjs")
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await signedToken("e1e0e1e0-1010-4101-8101-0000000000e0", Date.now() + 24 * 3600 * 1000)
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    parent._engDesignTokens = new Map([["e1e0e1e0-1010-4101-8101-0000000000e0", token]])
    parent._engDesignToken = token
    // 手动档 digest：eng-coder 缺省 async 也不放行（禁 spawn 机械门先于角色/async 解析）
    parent._inAutoTurn = true
    parent.autoApprove = false
    const ref = JSON.parse(String(await subagentTool.execute(
      { task: "x", role: "eng-coder", designToken: token }, // 无 async 参数——§18 缺省 async
      { agent: parent, cwd, callbacks: {}, depth: 0 },
    )))
    assert.equal(ref.status, "error", "T-E10: 手动档 digest spawn eng-coder 拒绝（默认 async 不例外）")
    assert.equal(ref.error, "cannot spawn subagents from a manual auto-turn — wait for user input")
    // AUTO 档：放行（推进链）——eng-coder 缺省 async spawn 正常启动
    parent.autoApprove = true
    const ok = JSON.parse(String(await subagentTool.execute(
      { task: "AUTO eng 活", role: "eng-coder", designToken: token },
      { agent: parent, cwd, callbacks: {}, depth: 0 },
    )))
    assert.equal(ok.status, "running", "T-E10: AUTO 档 digest 放行 eng-coder（缺省 async）")
    const entry = parent._asyncSubagents.get(String(ok.id))
    await entry.promise
    assert.equal(entry.done, true)
    assert.ok(String(entry.report).includes("AUTO eng 交付 report"))
    parent._inAutoTurn = false
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E11: 交付报告 digest 消化——手动档 auto-turn 注入报告（含审计/评审轮次记录），摘要进会话流（§18 D-E4——既有消化零改动）", async () => {
  const { server, port } = await asyncServer([{ content: "digested: 交付要点总结（audit 2 clean / advisor 1 clean）" }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-e11-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    // eng-coder 交付报告（settle 后挂起移交形态）——自带审计/评审轮次 + 终态
    parent._pendingAsyncResults = [{
      id: "1", role: "eng-coder",
      report: LONG_REPORT("交付完成：审计 2 轮 clean；advisor 复评 1 轮 clean；终态 clean"),
    }]
    const out = await runAgent(parent, "", {}, { autoTurn: true })
    assert.equal(out, "digested: 交付要点总结（audit 2 clean / advisor 1 clean）", "T-E11: digest 正常消化 eng-coder 交付")
    const injected = parent.history.find((m) => String(m.content ?? "").includes("async subagent #1 (eng-coder) finished"))
    assert.ok(injected, "T-E11: 交付报告注入（与 coder 条目同通道——D-E4 零改动）")
    assert.ok(String(injected.content).includes("advisor 复评 1 轮 clean"), "T-E11: 审计/评审轮次记录注入后可见（质量闭环可见）")
    assert.ok(String(injected.content).includes("终态 clean"), "T-E11: 终态标记注入后可见")
    assert.equal(parent._pendingAsyncResults.length, 0, "T-E11: 注入即消费")
    // 手动档消化动作域模板照常注入（digest 只整理不执行）
    assert.ok(parent.history.some((m) => String(m.content ?? "").includes("auto-turn — background async subagents finished")), "T-E11: 手动档动作域注入")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})
