/**
 * advisor-async.test.mjs — AGENT-LOOP.md §24 T-24b1..12 (R13 — async advisor reviews).
 * Covers: ack launch / settle+digest injection / token settle issuance / guard
 * timing / multi-review isolation / fix-round continuation / cancel / pool
 * capacity / stale reviews / depth gate / per-review cap / async code-review form.
 *
 * Harness shape (§24 test references): the reviewer LLM is a controllable local
 * mock (per-request script + DESIGN-TOKEN echo); launches drive the real
 * advisorTool.execute at depth 0 with the pool/settle machinery; digest turns
 * reuse runAgent autoTurn (suspension-drive driverCtx semantics).
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"
import { slow } from "./slow.mjs"

/** Controllable advisor-LLM mock: one response per request (scripted), scanning
 *  the request for the injected [DESIGN-TOKEN:…] to echo on pass steps.
 *  step: { text } plain review output · { pass:true } echo the token ·
 *         { delay } hold the response (in-flight windows). */
function reviewServer(steps = []) {
  let i = 0
  const requests = []
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", async () => {
      const body = JSON.parse(bodyText)
      requests.push(body)
      const step = steps[Math.min(i++, steps.length - 1)] ?? { text: "review ok" }
      if (step.delay) await new Promise((r) => setTimeout(r, step.delay))
      const m = JSON.stringify(body.messages ?? []).match(/\[DESIGN-TOKEN:([0-9a-f-]+:\d+)\]/)
      const content = step.pass
        ? `${step.text ?? "review ok"}\n\n[DESIGN-TOKEN:${m ? m[1] : "no-token-found"}]`
        : (step.text ?? "review findings")
      const frames =
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        `data: [DONE]\n\n`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames)
    })
  })
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests }))
  })
}

/** Scripted main-agent LLM (mockLLM shape — toolCall/toolCalls/content/delay steps).
 *  §29 (2026-09-07): step.toolCalls (array) emits MULTIPLE tool calls in ONE response —
 *  the same-message batch shape the §29 T-A tests need (single toolCall = one per
 *  message, which cannot exercise the same-batch launch ordering). */
function mainServer(script) {
  let i = 0
  const requests = []
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", async () => {
      requests.push({ ...JSON.parse(bodyText) })
      const step = script[Math.min(i++, script.length - 1)] ?? { content: "done" }
      if (step.delay) await new Promise((r) => setTimeout(r, step.delay))
      let frames
      if (step.toolCalls) {
        // 多工具同消息：逐 delta 发（每 delta 一个 index——标准 SSE 流式拼装）
        frames = step.toolCalls.map((tc, k) =>
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: k, id: `call_${i}_${k}`, type: "function", function: { name: tc.name, arguments: tc.arguments ?? "{}" } }] } }] })}\n\n`
        ).join("") +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
          `data: [DONE]\n\n`
      } else if (step.toolCall) {
        frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: `call_${i}`, function: { name: step.toolCall.name, arguments: step.toolCall.arguments ?? "{}" } }] } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
          `data: [DONE]\n\n`
      } else {
        frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: step.content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
      }
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames)
    })
  })
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests }))
  })
}

/** §29：轮询等待池条目出现（launch 在 runAgent 内异步发生——settle 后的回合尾收集
 *  会消费条目——先捕获 entry 引用再断言，避免消费时序依赖）。 */
async function waitPoolEntry(agent, timeoutMs = 3000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const entry = [...(agent._asyncAdvisors?.values() ?? [])][0]
    if (entry) return entry
    await new Promise((r) => setTimeout(r, 15))
  }
  throw new Error("waitPoolEntry: no async advisor pool entry appeared")
}

const FINDINGS = "| # | Category | Severity | Issue | Suggestion |\n|---|---------|----------|------|------------|\n| 1 | correctness | 🔴 | spec gap | fix the spec |"

function makeMutationTool() {
  return {
    name: "write",
    description: "test mutation",
    parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } },
    readonly: false,
    touchedPaths: (args) => [args.path],
    execute: async () => "Wrote 5 chars",
  }
}

async function makeAgent(port, { advisor = {}, engineering = false } = {}) {
  const { createAgent } = await import("../src/agent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-advasync-"))
  mkdirSync(join(cwd, "docs", "design"), { recursive: true })
  const agent = createAgent({
    provider: { name: "main", baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
    tools: [],
    config: { agent: { engineering }, advisor: { guard: false, ...advisor } },
    cwd,
  })
  agent.providers = [{ name: "main", baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }]
  if (advisor.provider) {
    agent.providers.push({ name: advisor.provider, baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" })
  }
  return { agent, cwd }
}

const execCtx = (agent, { depth = 0, toolCallId = "t1", callbacks = {} } = {}) => ({
  agent, cwd: agent.cwd, depth, callbacks, _toolCallId: toolCallId,
})

/** Await the async-review entry's settle (entry.promise resolves at settle). */
function awaitSettle(agent, id) {
  const entry = agent._asyncAdvisors?.get(String(id))
  assert.ok(entry, "pool entry registered")
  return entry.promise
}

// ─── T-24b1: async launch ack + natural turn end + suspension input available ─

test("T-24b1: advisor async 发起——工具返回 ack + 不阻塞 + 池条目 running（挂起输入可用性由 poolLive 覆盖）", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port, requests } = await reviewServer([{ text: FINDINGS, delay: 300 }])
  const { agent, cwd } = await makeAgent(port)
  try {
    const t0 = Date.now()
    const out = JSON.parse(String(await advisorTool.execute(
      { type: "code", paths: ["src/a.mjs"] },
      execCtx(agent, { toolCallId: "b1" }),
    )))
    const elapsed = Date.now() - t0
    assert.equal(out.status, "running", "T-24b1: 缺省 async（depth-0）→ 立即返回 running ack")
    assert.equal(out.kind, "advisor", "T-24b1: ack 带 kind advisor")
    assert.ok(out.id, "T-24b1: ack 带池 id")
    assert.ok(elapsed < 200, `T-24b1: 不等待评审完成（elapsed=${elapsed}ms，评审 300ms）`)
    const entry = agent._asyncAdvisors.get(String(out.id))
    assert.ok(entry && entry.status === "running", "T-24b1: _asyncAdvisors 登记 running")
    assert.equal(agent._calledAdvisorThisRun, false, "T-24b1: ack 时刻不置 called（settle 记账）")
    assert.equal(entry.run.round, 0, "T-24b1: ack 时刻轮次不消耗")
    await entry.promise
    assert.equal(entry.done, true, "T-24b1: 后台评审 settle")
    assert.equal(requests.length, 1, "T-24b1: 评审请求已后台发出并完成")
    assert.equal(entry.run.round, 1, "T-24b1: settle 记账 round=1（attempt 计数）")
    assert.equal(entry.run.priorOutput, FINDINGS, "T-24b1: settle 存 prior（评审形态输出）")
    assert.equal(agent._calledAdvisorThisRun, true, "T-24b1: 非陈旧 settle 置 called")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b2: settle → pending → digest 轮注入报告 ────────────────

test("T-24b2: settle 分流 _pendingAsyncResults → digest 轮注入报告 + 模型处置呈递", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { runAgent } = await import("../src/agent.mjs")
  // 步骤 1 = 评审报告；步骤 2 = digest 轮的模型处置文本（同一 server——请求序确定）
  const { server, port, requests } = await reviewServer([{ text: FINDINGS }, { text: "digest 处置：呈现发现与修复建议" }])
  const { agent, cwd } = await makeAgent(port)
  try {
    const out = JSON.parse(String(await advisorTool.execute(
      { type: "code", paths: ["src/a.mjs"] },
      execCtx(agent, { toolCallId: "b2" }),
    )))
    agent._suspended = true // 挂起态（digest 会话）——settle 走挂起分流
    await awaitSettle(agent, out.id)
    const pending = agent._pendingAsyncResults ?? []
    assert.equal(pending.length, 1, "T-24b2: settle → _pendingAsyncResults（挂起分流）")
    assert.equal(pending[0].id, Number(out.id), "T-24b2: pending 条目 = 该评审")
    assert.equal(agent._asyncAdvisors?.size ?? 0, 0, "T-24b2: 评审已出池")
    // digest 轮（auto-turn runAgent——run 首行注入 pending）
    const digestOut = await runAgent(agent, "", { onPermissionRequest: async () => true }, { autoTurn: true, suspDriven: true })
    assert.ok(digestOut.includes("digest 处置"), "T-24b2: digest 轮正常收尾")
    const digestReq = requests.find((r) => (r.messages ?? []).some((m) => m.role === "user" && String(m.content).includes("[System reminder: async advisor review #")))
    assert.ok(digestReq, "T-24b2: digest 轮请求到达")
    const reportVisible = (digestReq.messages ?? []).some((m) => m.role === "user" && String(m.content).includes(FINDINGS.slice(0, 40)))
    assert.ok(reportVisible, "T-24b2: 评审报告注入 digest 上下文（模型处置呈递）")
    assert.equal(agent._pendingAsyncResults?.length ?? 0, 0, "T-24b2: 注入即消费")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b3: token settle 签发（designId 匹配 + spawn 可用） ───────

test("T-24b3: 后台 design 评审通过 → settle 签发 token 入槽（designId 匹配）+ 镜像", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port, requests } = await reviewServer([{ pass: true, text: "设计评审通过" }])
  const { agent, cwd } = await makeAgent(port, { engineering: true })
  try {
    const out = JSON.parse(String(await advisorTool.execute(
      { type: "design", documents: ["docs/design/A.md"] },
      execCtx(agent, { toolCallId: "b3" }),
    )))
    assert.ok(out.reviewId, "T-24b3: ack 带 reviewId（= designId）")
    agent._suspended = true
    await awaitSettle(agent, out.id)
    assert.equal(requests.length, 1, "T-24b3: 评审请求完成")
    const echoed = (JSON.stringify(requests[0].messages).match(/\[DESIGN-TOKEN:([0-9a-f-]+:\d+)\]/)?.[1])
    assert.ok(echoed, "T-24b3: 评审请求收到注入 token")
    assert.equal(agent._engDesignTokens?.get(out.reviewId), echoed, "T-24b3: digest 后 token 入槽——designId 匹配")
    assert.equal(agent._engDesignToken, echoed, "T-24b3: 单槽镜像同步")
    const { resolveDesignSlot } = await import("../src/agent-tools/subagent-spawn.mjs")
    const slot = resolveDesignSlot(agent, out.reviewId)
    assert.equal(slot.token, echoed, "T-24b3: spawn 端 designId 取回 token 可用")
    const run = agent._advisorRuns.get(out.reviewId)
    assert.equal(run.open, false, "T-24b3: 通过后实例关闭（下次同文档 = 全新 full review）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b4: guard 时点 — 未决不推回；settle 非陈旧 → called；陈旧 → 仍推回 ──

test("T-24b4: guard 时点——async 评审未决不推回；非陈旧 settle 放行；陈旧 settle 后仍推回", async () => {
  const { handleCompletion } = await import("../src/agent/completion.mjs")
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port } = await reviewServer([{ text: FINDINGS }, { text: FINDINGS }])
  const { agent, cwd } = await makeAgent(port, { advisor: { guard: true } })
  const respond = () => handleCompletion(agent, { content: "完成" }, 0, 1, 0, false, 0, {})
  const codeAbs = join(cwd, "src", "a.mjs")
  try {
    // ① 有代码修改 + 未评审 → 推回（round 1）
    agent._mutatedThisRun = true
    agent._calledAdvisorThisRun = false
    agent._touchedFiles.push(codeAbs)
    let cr = respond()
    assert.equal(cr.action, "continue", "T-24b4: 修改未评审 → 推回")
    assert.equal(cr.advisorPushbacks, 1, "T-24b4: advisor 推回计数 +1")
    // ② 发起 async 评审（未决）→ 不再推回（未决不算未评审）
    const out = JSON.parse(String(await advisorTool.execute(
      { type: "code", paths: ["src/a.mjs"] },
      execCtx(agent, { toolCallId: "b4a" }),
    )))
    cr = respond()
    assert.equal(cr.action, "done", "T-24b4: 评审未决 → 不推回（guard 放行等 settle）")
    // ③ 非陈旧 settle → called → 放行
    await awaitSettle(agent, out.id)
    assert.equal(agent._calledAdvisorThisRun, true, "T-24b4: 非陈旧 settle 置 called")
    cr = respond()
    assert.equal(cr.action, "done", "T-24b4: called 后完成放行")
    // ④ 陈旧路径：settle 后再改码 + 新评审飞行中再改码 → settle 陈旧 → called 不置 → 仍推回
    agent._calledAdvisorThisRun = false
    agent._mutatedThisRun = true
    const { noteMutations } = await import("../src/agent-tools/advisor-async.mjs")
    const out2 = JSON.parse(String(await advisorTool.execute(
      { type: "code", paths: ["src/a.mjs"] },
      execCtx(agent, { toolCallId: "b4b" }),
    )))
    noteMutations(agent, [codeAbs]) // 评审飞行中 FILE_MUTATORS
    await awaitSettle(agent, out2.id)
    assert.equal(agent._calledAdvisorThisRun, false, "T-24b4: 陈旧 settle 不置 called（T-24b9 语义同源）")
    cr = respond()
    assert.equal(cr.action, "continue", "T-24b4: 陈旧 settle 后 guard 仍推回（防静默漏审）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b5: 多评审并行隔离（round/prior 各归各 reviewId） ────────

test("T-24b5: 两 design 评审并发——round/prior 各归各 reviewId（_advisorRuns 隔离）", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port } = await reviewServer([
    { text: "A 评审发现\n" + FINDINGS, delay: 120 },
    { text: "B 评审发现\n" + FINDINGS, delay: 120 },
  ])
  const { agent, cwd } = await makeAgent(port, { engineering: true })
  try {
    const outA = JSON.parse(String(await advisorTool.execute(
      { type: "design", documents: ["docs/design/A.md"] },
      execCtx(agent, { toolCallId: "b5a" }),
    )))
    const outB = JSON.parse(String(await advisorTool.execute(
      { type: "design", documents: ["docs/design/B.md"] },
      execCtx(agent, { toolCallId: "b5b" }),
    )))
    assert.notEqual(outA.reviewId, outB.reviewId, "T-24b5: 两评审各带独立 reviewId")
    assert.equal(agent._asyncAdvisors.size, 2, "T-24b5: 两评审并行在池")
    agent._suspended = true
    await Promise.all([awaitSettle(agent, outA.id), awaitSettle(agent, outB.id)])
    const runA = agent._advisorRuns.get(outA.reviewId)
    const runB = agent._advisorRuns.get(outB.reviewId)
    assert.ok(runA && runB, "T-24b5: 两实例各自注册")
    assert.equal(runA.round, 1, "T-24b5: A round 自计")
    assert.equal(runB.round, 1, "T-24b5: B round 自计")
    assert.ok(runA.priorOutput.includes("A 评审发现"), "T-24b5: A prior = A 输出")
    assert.ok(runB.priorOutput.includes("B 评审发现"), "T-24b5: B prior = B 输出——互不污染")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b6: 修正轮续跑——round2 prior = 该 reviewId 前轮输出 ──────

test("T-24b6: 处置后发起 round2——prior = 该 reviewId 前轮输出 + 新 token 注入 + 同 designId", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port, requests } = await reviewServer([
    { text: "R1 发现\n" + FINDINGS },
    { text: "R2 复核通过", pass: true },
  ])
  const { agent, cwd } = await makeAgent(port, { engineering: true })
  try {
    const out1 = JSON.parse(String(await advisorTool.execute(
      { type: "design", documents: ["docs/design/A.md"] },
      execCtx(agent, { toolCallId: "b6a" }),
    )))
    agent._suspended = true
    await awaitSettle(agent, out1.id)
    // 处置后（文档修复——不算陈旧语义细节）发起 round2：同文档集 → 续同一实例
    const out2 = JSON.parse(String(await advisorTool.execute(
      { type: "design", documents: ["docs/design/A.md"] },
      execCtx(agent, { toolCallId: "b6b" }),
    )))
    assert.equal(out2.reviewId, out1.reviewId, "T-24b6: round2 续同一 reviewId")
    assert.equal(agent._advisorRuns.size, 1, "T-24b6: 未新建实例")
    assert.equal(agent._advisorRuns.get(out2.reviewId).round, 1, "T-24b6: 前轮已 settle（round=1）")
    await awaitSettle(agent, out2.id) // round2 settle（请求必已完成）
    assert.equal(requests.length, 2, "T-24b6: 两轮评审请求均完成")
    const req2 = requests[1]
    const joined = JSON.stringify(req2.messages)
    assert.ok(joined.includes("R1 发现"), "T-24b6: round2 注入该实例 prior（前轮输出——非其他评审）")
    const tokens = joined.match(/\[DESIGN-TOKEN:[0-9a-f-]+:\d+\]/g)
    assert.ok(tokens && tokens.length >= 1, "T-24b6: round2 仍注入新 token（可再批准）")
    assert.ok(joined.includes("## Documents to Review") && joined.includes("docs/design/A.md"), "T-24b6: round2 重锚文档范围")
    // round2 通过 → token 入原 designId 槽
    const echoed2 = JSON.stringify(req2.messages).match(/\[DESIGN-TOKEN:([0-9a-f-]+:\d+)\]/)?.[1]
    assert.equal(agent._engDesignTokens.get(out2.reviewId), echoed2, "T-24b6: round2 通过 → 原 designId 槽签发")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b7: 取消语义（②-6b）──────────────────────────────

test("T-24b7: ⏹/cancel 定向中止——cancelled settle 不入 pending/不入 token 槽 + 提示文案", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { cancelAsyncAdvisor } = await import("../src/agent-tools/advisor-async.mjs")
  const { server, port } = await reviewServer([{ text: FINDINGS, delay: 400 }])
  const { agent, cwd } = await makeAgent(port, { engineering: true })
  try {
    const out = JSON.parse(String(await advisorTool.execute(
      { type: "design", documents: ["docs/design/A.md"] },
      execCtx(agent, { toolCallId: "b7" }),
    )))
    agent._suspended = true
    const r = cancelAsyncAdvisor(agent, out.id)
    assert.equal(r.status, "cancelled", "T-24b7: cancel 返回 cancelled")
    await awaitSettle(agent, out.id) // cancelled settle
    assert.equal(agent._asyncAdvisors?.size ?? 0, 0, "T-24b7: cancelled 评审出池")
    assert.equal(agent._pendingAsyncResults?.length ?? 0, 0, "T-24b7: 不入 pending（无 digest 报告）")
    assert.equal(agent._engDesignTokens?.size ?? 0, 0, "T-24b7: 不入 token 槽")
    const run = [...agent._advisorRuns.values()][0]
    assert.equal(run.round, 0, "T-24b7: 取消不消耗轮次预算")
    const last = agent.history.at(-1)
    assert.ok(String(last.content).includes("评审已取消——token 未签发"), "T-24b7: digest 提示'评审已取消——token 未签发'")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b8: 池容量（②-6a——超限拒，不排队）──────────────────

test("T-24b8: 第 3 个评审发起（2 在跑）→ 返回错误文案'另有一评审在跑——逐个发起'", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port } = await reviewServer([{ text: FINDINGS, delay: 300 }, { text: FINDINGS, delay: 300 }])
  const { agent, cwd } = await makeAgent(port)
  try {
    const a = JSON.parse(String(await advisorTool.execute({ type: "code", paths: ["a.mjs"] }, execCtx(agent, { toolCallId: "b8a" }))))
    const b = JSON.parse(String(await advisorTool.execute({ type: "code", paths: ["b.mjs"] }, execCtx(agent, { toolCallId: "b8b" }))))
    assert.equal(agent._asyncAdvisors.size, 2, "T-24b8: 两评审在跑")
    const third = String(await advisorTool.execute({ type: "code", paths: ["c.mjs"] }, execCtx(agent, { toolCallId: "b8c" })))
    assert.ok(third.includes("另有一评审在跑——逐个发起"), "T-24b8: 超限错误文案（不排队）")
    assert.equal(agent._asyncAdvisors.size, 2, "T-24b8: 无第三条目入池")
    agent._suspended = true
    await Promise.all([awaitSettle(agent, a.id), awaitSettle(agent, b.id)])
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b9: 陈旧评审（评审飞行中 FILE_MUTATORS）────────────────

test("T-24b9: 评审飞行中目标文档变更 → settle 不签发 token（设计评审面）", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port } = await reviewServer([{ pass: true, text: "设计通过", delay: 200 }])
  const { agent, cwd } = await makeAgent(port, { engineering: true })
  try {
    const out = JSON.parse(String(await advisorTool.execute(
      { type: "design", documents: ["docs/design/A.md"] },
      execCtx(agent, { toolCallId: "b9" }),
    )))
    const { noteMutations } = await import("../src/agent-tools/advisor-async.mjs")
    noteMutations(agent, [join(cwd, "docs", "design", "A.md")]) // 评审飞行中目标文档变更
    agent._suspended = true
    await awaitSettle(agent, out.id)
    assert.equal(agent._engDesignTokens?.size ?? 0, 0, "T-24b9: 陈旧评审不签发 token（即使回显）")
    assert.equal(agent._engDesignToken, null, "T-24b9: 镜像同样不置")
    assert.equal(agent._calledAdvisorThisRun, false, "T-24b9: 不置 called（guard 仍推回——T-24b4 ④ 已证）")
    const run = agent._advisorRuns.get(out.reviewId)
    assert.equal(run.stale, true, "T-24b9: 实例 stale 标记")
    assert.equal(run.open, true, "T-24b9: 未通过未关闭——修正轮可续")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b10: depth 门控（②-3 A——depth>0 显式拒/缺省恒同步）──────

test("T-24b10: depth>0——显式 async 拒；缺省恒同步（eng-coder 内部自审不翻转）", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { server, port } = await reviewServer([{ text: FINDINGS }])
  const { agent, cwd } = await makeAgent(port)
  try {
    const rejected = String(await advisorTool.execute(
      { type: "code", paths: ["a.mjs"], async: true },
      execCtx(agent, { depth: 1, toolCallId: "b10a" }),
    ))
    assert.ok(rejected.includes("only available at depth 0"), "T-24b10: depth>0 显式 async → 拒")
    assert.equal(agent._asyncAdvisors?.size ?? 0, 0, "T-24b10: 无池条目")
    // 缺省（无 async 参数）→ 同步阻塞返回完整评审
    const t0 = Date.now()
    const sync = String(await advisorTool.execute(
      { type: "code", paths: ["a.mjs"] },
      execCtx(agent, { depth: 1, toolCallId: "b10b" }),
    ))
    assert.ok(sync.includes(FINDINGS), "T-24b10: depth>0 缺省同步返回评审结果")
    assert.equal(agent._asyncAdvisors?.size ?? 0, 0, "T-24b10: 同步路径无池条目")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b11: cap 随实例（每评审 ≤5 轮；他实例不受影响）──────────

test("T-24b11: 单 review 第 6 次发起拒（该实例 ≤5 轮）——他实例不受影响", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const steps = Array.from({ length: 6 }, () => ({ text: FINDINGS }))
  const { server, port } = await reviewServer(steps)
  const { agent, cwd } = await makeAgent(port)
  try {
    agent._suspended = true // settle 即移交 pending（不碍轮次记账）
    let lastId = null
    for (let n = 1; n <= 5; n++) {
      const out = JSON.parse(String(await advisorTool.execute(
        { type: "code", paths: ["a.mjs"] },
        execCtx(agent, { toolCallId: `b11-${n}` }),
      )))
      lastId = out.id
      await awaitSettle(agent, out.id)
    }
    const run = [...agent._advisorRuns.values()].find((r) => r.reviewType === "code")
    assert.equal(run.round, 5, "T-24b11: 5 轮完成")
    // 第 6 次启动 → 同步拒（cap 消息）
    const sixth = String(await advisorTool.execute(
      { type: "code", paths: ["a.mjs"] },
      execCtx(agent, { toolCallId: "b11-6" }),
    ))
    assert.ok(sixth.includes("convergence cap reached"), "T-24b11: 第 6 次启动拒（该实例 ≤5 轮）")
    assert.equal(agent._asyncAdvisors?.size ?? 0, 0, "T-24b11: 拒绝未入池")
    // 他实例（design 新文档集）不受影响
    const d = JSON.parse(String(await advisorTool.execute(
      { type: "design", documents: ["docs/design/D.md"] },
      execCtx(agent, { toolCallId: "b11-d" }),
    )))
    assert.equal(d.status, "running", "T-24b11: 他实例照常发起")
    await awaitSettle(agent, d.id)
    assert.equal(agent._advisorRuns.get(d.reviewId).round, 1, "T-24b11: 他实例轮次独立")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-24b12: 父侧 code 复核 async 形态（guard 推回 → async → digest → 修复 → round2 prior 正确）──

slow("T-24b12: code 复核 async——guard 推回发起（reviewId 随机无 token 面）→ settle → 修复 → round2 prior 正确", async () => {
  const { runAgent, createAgent } = await import("../src/agent.mjs")
  // 主 agent server + 独立 advisor server（config advisor.provider）
  const mainScript = [
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "src/a.mjs", content: "v1" }) } },
    { content: "实现完成" },                                  // → guard 推回（round 1）
    { toolCall: { name: "advisor", arguments: JSON.stringify({ type: "code", paths: ["src/a.mjs"] }) } }, // async 发起
    { content: "评审已后台启动，先收尾" },                       // pending 评审 → 放行 → run 结束
    // digest 轮（注入报告——模型处置呈递）
    { content: "评审报告已消化——发现待修复项，呈递" },
    // run2（修复轮）
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "src/a.mjs", content: "v2" }) } },
    { content: "修复完成" },                                  // → guard 推回（round 2）
    { toolCall: { name: "advisor", arguments: JSON.stringify({ type: "code", paths: ["src/a.mjs"] }) } }, // round2 发起
    { content: "复核完成收尾" },                                // pending 复核 → 放行 → run 结束
  ]
  const main = await mainServer(mainScript)
  const reviewSteps = [
    { text: "R1 code 发现\n" + FINDINGS },   // review 请求 #1（round 1）
    { text: "R2 code 全部修复" },             // review 请求 #2（round 2）
  ]
  const adv = await reviewServer(reviewSteps)
  const cwd = mkdtempSync(join(tmpdir(), "tc-b12-"))
  try {
    const agent = createAgent({
      provider: { name: "main", baseURL: `http://127.0.0.1:${main.port}`, apiKey: "x", model: "m" },
      tools: [makeMutationTool()],
      config: { agent: { engineering: false }, advisor: { guard: true, provider: "adv" } },
      cwd,
    })
    agent.providers = [
      { name: "main", baseURL: `http://127.0.0.1:${main.port}`, apiKey: "x", model: "m" },
      { name: "adv", baseURL: `http://127.0.0.1:${adv.port}`, apiKey: "x", model: "m" },
    ]
    // run1：改码 → guard 推回（round 1）→ async code review 发起 → 完成
    const out1 = await runAgent(agent, "实现任务", { onPermissionRequest: async () => true }, { suspDriven: true })
    assert.equal(out1, "评审已后台启动，先收尾")
    const reviewReq1 = adv.requests[0]
    assert.ok(reviewReq1, "T-24b12: round1 评审请求到达")
    assert.ok(!JSON.stringify(reviewReq1.messages).includes("DESIGN-TOKEN"), "T-24b12: code 复核无 token 面")
    const guardText1 = agent.history.filter((m) => String(m.content).includes("MUST get an advisor review"))
    assert.ok(guardText1.length >= 1 && guardText1[0].content.includes("(round 1)"), "T-24b12: guard 推回 round 1 文案")
    // round1 评审在 run1 内 settle（非挂起——留池）→ 模拟挂起会话 sweep → digest 消化
    const entry1 = [...agent._asyncAdvisors.values()][0]
    await entry1.promise
    assert.equal(agent._calledAdvisorThisRun, true, "T-24b12: round1 非陈旧 settle 置 called")
    assert.equal([...agent._advisorRuns.values()][0].priorOutput, "R1 code 发现\n" + FINDINGS, "T-24b12: 实例 prior = round1 输出")
    agent._pendingAsyncResults ??= []
    agent._pendingAsyncResults.push(entry1)
    agent._asyncAdvisors.delete(String(entry1.id))
    await runAgent(agent, "", { onPermissionRequest: async () => true }, { autoTurn: true, suspDriven: true })
    const fixDigestReq = main.requests.find((r) => (r.messages ?? []).some((m) => m.role === "user" && String(m.content).includes("async advisor review")))
    assert.ok(fixDigestReq, "T-24b12: digest 轮注入评审报告")
    // run2：修复（写 → called 失效）→ guard 推回 round 2 → async 再启 → 续同实例（prior 正确）
    const out2 = await runAgent(agent, "按评审修复", { onPermissionRequest: async () => true }, { suspDriven: true })
    assert.ok(out2.includes("复核完成收尾"), `T-24b12: run2 完成（${out2.slice(0, 40)}）`)
    const reviewReq2 = adv.requests[1]
    assert.ok(reviewReq2, "T-24b12: round2 评审请求到达")
    const joined2 = JSON.stringify(reviewReq2.messages)
    assert.ok(joined2.includes("R1 code 发现"), "T-24b12: round2 prior = round1 评审输出（prior 正确）")
    const runs = [...agent._advisorRuns.values()]
    assert.equal(runs.length, 1, "T-24b12: round2 续同一 code 实例（reviewId 随机但实例延续）")
    assert.ok(runs[0].reviewId, "T-24b12: 实例带随机 reviewId")
    const guardText2 = agent.history.filter((m) => String(m.content).includes("MUST get an advisor review"))
    assert.ok(guardText2.length >= 2 && guardText2.at(-1).content.includes("(round 2)"), "T-24b12: guard 推回 round 2 文案（round/prior 从 _advisorRuns 取）")
  } finally {
    main.server.close()
    adv.server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── 修正轮（advisor 复评 #1）: 机械失败 settle 不静默满足 guard ───────────

test("T-24b13: 机械失败 settle（provider 故障文本）→ 不置 called——guard 仍推回（轮次照耗——cap 有界）", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { handleCompletion } = await import("../src/agent/completion.mjs")
  const FAIL = "Advisor: review failed (rate limit) — 429 ... Wait a moment and retry."
  const { server, port } = await reviewServer([{ text: FAIL }])
  const { agent, cwd } = await makeAgent(port, { advisor: { guard: true } })
  const respond = () => handleCompletion(agent, { content: "完成" }, 0, 1, 0, false, 0, {})
  const codeAbs = join(cwd, "src", "a.mjs")
  try {
    agent._mutatedThisRun = true
    agent._calledAdvisorThisRun = false
    agent._touchedFiles.push(codeAbs)
    assert.equal(respond().action, "continue", "T-24b13: 修改未评审 → 推回")
    const out = JSON.parse(String(await advisorTool.execute(
      { type: "code", paths: ["src/a.mjs"] },
      execCtx(agent, { toolCallId: "b13" }),
    )))
    agent._suspended = true
    await awaitSettle(agent, out.id)
    assert.equal(agent._calledAdvisorThisRun, false, "T-24b13: 机械失败文本 settle 不置 called（guard 不静默放行）")
    assert.equal([...agent._advisorRuns.values()][0].round, 1, "T-24b13: 尝试仍耗轮次（cap 有界）")
    assert.equal(respond().action, "continue", "T-24b13: 失败 settle 后 guard 仍推回（重试）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── 修正轮（advisor 复评 #2）: headless（suspDriven=false）注入边界不截断修正轮 ──

slow("T-24b14: 非挂起回合尾注入报告后 close 短路——下轮修复评审续同实例（round 2 prior 正确）", async () => {
  const { runAgent, createAgent } = await import("../src/agent.mjs")
  // 主 agent：最后一步带 delay——保证评审（无 delay）先 settle（回合内结算）
  const mainScript = [
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "src/a.mjs", content: "v1" }) } },
    { content: "实现完成" },                                  // → guard 推回（round 1）
    { toolCall: { name: "advisor", arguments: JSON.stringify({ type: "code", paths: ["src/a.mjs"] }) } },
    { content: "评审已后台启动，先收尾", delay: 200 },          // 评审回合内 settle → 完成
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "src/a.mjs", content: "v2" }) } },
    { content: "修复完成" },                                  // → guard 推回（round 2——续同实例）
    { toolCall: { name: "advisor", arguments: JSON.stringify({ type: "code", paths: ["src/a.mjs"] }) } },
    { content: "复核收尾" },
  ]
  const main = await mainServer(mainScript)
  const adv = await reviewServer([{ text: "R1 发现\n" + FINDINGS }, { text: "R2 全部修复" }])
  const cwd = mkdtempSync(join(tmpdir(), "tc-b14-"))
  try {
    const agent = createAgent({
      provider: { name: "main", baseURL: `http://127.0.0.1:${main.port}`, apiKey: "x", model: "m" },
      tools: [makeMutationTool()],
      config: { agent: { engineering: false }, advisor: { guard: true, provider: "adv" } },
      cwd,
    })
    agent.providers = [
      { name: "main", baseURL: `http://127.0.0.1:${main.port}`, apiKey: "x", model: "m" },
      { name: "adv", baseURL: `http://127.0.0.1:${adv.port}`, apiKey: "x", model: "m" },
    ]
    // run1：改码 → guard 推回 → async 发起 → 评审回合内 settle → 回合尾注入
    // （collectSettledAsync 直注入——headless suspDriven=false）→ close 必须被短路
    const out1 = await runAgent(agent, "实现任务", { onPermissionRequest: async () => true })
    assert.equal(out1, "评审已后台启动，先收尾")
    assert.equal(agent._asyncAdvisors?.size ?? 0, 0, "T-24b14: 回合尾注入后条目已消费")
    const runs1 = [...agent._advisorRuns.values()]
    assert.equal(runs1.length, 1, "T-24b14: 单实例")
    assert.equal(runs1[0].round, 1, "T-24b14: round 1 已结算")
    assert.equal(runs1[0].open, true, "T-24b14: 注入后实例未被 close（headless 修复轮可续）")
    assert.ok(agent.history.some((m) => String(m.content).includes("async advisor review #")), "T-24b14: 报告已注入历史")
    // run2：修复 → guard 推回 round 2 → 续同一实例（prior 正确——非新建全量）
    const out2 = await runAgent(agent, "按评审修复", { onPermissionRequest: async () => true })
    assert.ok(out2.includes("复核收尾"), `T-24b14: run2 完成（${out2.slice(0, 40)}）`)
    const runs2 = [...agent._advisorRuns.values()]
    assert.equal(runs2.length, 1, "T-24b14: round2 续同一实例（未新建）")
    assert.equal(runs2[0].round, 2, "T-24b14: round 2 结算")
    const req2 = adv.requests[1]
    assert.ok(req2, "T-24b14: round2 评审请求到达")
    assert.ok(JSON.stringify(req2.messages).includes("R1 发现"), "T-24b14: round2 prior = round1 输出（续跑而非全量重审）")
  } finally {
    main.server.close()
    adv.server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// §29（2026-09-07——async advisor stale 误判修复——AGENT-LOOP.md §29）：
// 修复 A —— FILE_MUTATORS 记账移到 dispatch runOne 执行成功即刻（唯一记账点——
// 取代 record-results 批后段 + agent.mjs 中断分支——不双计）——同消息 [写 + launch]
// 不再误判 stale（T-A1）；中断 + 同批 launch seq 单计（T-A1i）；launch 后写仍保守
// stale（T-A2——T-24b9 语义回归）。修复 B —— settle 分支输出写回 entry.report：
// digest 永不展示未注册 token（通过 = 清洗 + Approved/designId 后缀——T-B1；
// stale = 剥回显 + "未签发" 提示——T-B2）。
// ─────────────────────────────────────────────────────────────────────────────

slow("T-A1: 同批 [写文档 + async advisor launch] settle → 槽位在——不误判 stale（执行期记账先于 launchSeq 捕获）", async () => {
  const { runAgent, createAgent } = await import("../src/agent.mjs")
  const mainScript = [
    // 同消息批——write 先于 advisor（dispatch Phase-2 保序）——§29 症状现场
    { toolCalls: [
      { name: "write", arguments: JSON.stringify({ path: "docs/design/A.md", content: "v1" }) },
      { name: "advisor", arguments: JSON.stringify({ type: "design", documents: ["docs/design/A.md"] }) },
    ] },
    { content: "评审已后台启动，先收尾" },
  ]
  const main = await mainServer(mainScript)
  const adv = await reviewServer([{ pass: true, text: "设计评审通过", delay: 150 }])
  const cwd = mkdtempSync(join(tmpdir(), "tc-a1-"))
  try {
    mkdirSync(join(cwd, "docs", "design"), { recursive: true })
    const agent = createAgent({
      provider: { name: "main", baseURL: `http://127.0.0.1:${main.port}`, apiKey: "x", model: "m" },
      tools: [makeMutationTool()],
      config: { agent: { engineering: true }, advisor: { guard: false, provider: "adv" } },
      cwd,
    })
    agent.providers = [
      { name: "main", baseURL: `http://127.0.0.1:${main.port}`, apiKey: "x", model: "m" },
      { name: "adv", baseURL: `http://127.0.0.1:${adv.port}`, apiKey: "x", model: "m" },
    ]
    const runP = runAgent(agent, "同消息写文档并发 async 设计评审", { onPermissionRequest: async () => true })
    runP.catch(() => {}) // 断言先于 run 收尾——提前捕获拒绝防 unhandled
    // autoApprove（自动档/eng 授权语境——§29 症状现场）：Phase-1 只读短路按序入列——
    // write 先于 advisor 执行（手动档权限批会把待批工具排到只读后——执行序反转——
    // launch 先于写执行是真实先写后审被反转——保守 stale 属既有语义，非本修复面）
    agent.autoApprove = true
    const entry = await waitPoolEntry(agent)
    // 执行期记账先于 launch——launchSeq 已含同批写（pre-fix：批后记账 → launchSeq=0）
    assert.equal(entry.launchSeq, 1, "T-A1: launchSeq 已含同批写（修复 A——pre-fix 此值为 0）")
    assert.equal(agent._mutLog.length, 1, "T-A1: 写记账恰一条（seq 单计）")
    assert.deepEqual(agent._mutLog[0].paths, [join(cwd, "docs", "design", "A.md")], "T-A1: 记账路径 = 该文档 abs")
    await entry.promise
    assert.equal(entry.done, true, "T-A1: 评审 settle")
    assert.equal(agent._calledAdvisorThisRun, true, "T-A1: 非陈旧 settle 置 called")
    const echoed = agent._engDesignTokens?.get(entry.reviewId)
    assert.ok(echoed, "T-A1: token 入槽——settleDesignReview 被调（pre-fix：批后记账 seq 后于 launch → 误判 stale → 无槽）")
    assert.equal(agent._advisorRuns.get(entry.reviewId).stale, false, "T-A1: 实例非 stale")
    const out = await runP
    assert.equal(out, "评审已后台启动，先收尾")
  } finally {
    main.server.close()
    adv.server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-A1i: 中断 + 同批 launch——seq 单计不 stale——槽位在（中断后无任何双计路径）", async () => {
  const { runAgent, createAgent } = await import("../src/agent.mjs")
  const mainScript = [
    // 同消息批 [写 + launch]
    { toolCalls: [
      { name: "write", arguments: JSON.stringify({ path: "docs/design/A.md", content: "v1" }) },
      { name: "advisor", arguments: JSON.stringify({ type: "design", documents: ["docs/design/A.md"] }) },
    ] },
    { content: "在途", delay: 500 }, // 长流窗口——评审 settle（~100ms）后中断在途回合
  ]
  const main = await mainServer(mainScript)
  const adv = await reviewServer([{ pass: true, text: "设计评审通过", delay: 100 }])
  const cwd = mkdtempSync(join(tmpdir(), "tc-a1i-"))
  const ac = new AbortController()
  try {
    mkdirSync(join(cwd, "docs", "design"), { recursive: true })
    const agent = createAgent({
      provider: { name: "main", baseURL: `http://127.0.0.1:${main.port}`, apiKey: "x", model: "m" },
      tools: [makeMutationTool()],
      config: { agent: { engineering: true }, advisor: { guard: false, provider: "adv" } },
      cwd,
    })
    agent.providers = [
      { name: "main", baseURL: `http://127.0.0.1:${main.port}`, apiKey: "x", model: "m" },
      { name: "adv", baseURL: `http://127.0.0.1:${adv.port}`, apiKey: "x", model: "m" },
    ]
    const runP = runAgent(agent, "同消息写文档并发 async 设计评审", { onPermissionRequest: async () => true }, { signal: ac.signal })
    runP.catch(() => {})
    agent.autoApprove = true // 同上——保序执行（手动档权限批反转执行序——非本修复面）
    const entry = await waitPoolEntry(agent)
    assert.equal(entry.launchSeq, 1, "T-A1i: launchSeq 已含同批写")
    assert.equal(agent._mutLog.length, 1, "T-A1i: 写记账恰一条——seq 单计（唯一记账点）")
    await entry.promise // settle 先行（run 信号干净——~100ms）
    assert.equal(agent._calledAdvisorThisRun, true, "T-A1i: settle 非 stale 置 called")
    assert.ok(agent._engDesignTokens?.get(entry.reviewId), "T-A1i: 槽位在（不误判 stale——pre-fix：批后记账 seq 后于 launch → stale → 无槽）")
    assert.equal(agent._advisorRuns.get(entry.reviewId).stale, false, "T-A1i: 实例非 stale")
    // 中断：settle 后 Ctrl+I——中止在途回合（AbortError 透传）——记账不被双计/回滚
    ac.abort({ interrupt: true, message: "停" })
    await assert.rejects(runP, (e) => e?.name === "AbortError", "T-A1i: 中断中止在途回合（AbortError 透传）")
    assert.equal(agent._mutLog.length, 1, "T-A1i: 中断路径后仍单条——中断分支不再 noteMutations（§29 唯一记账点——不双计）")
  } finally {
    main.server.close()
    adv.server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-A2: launch 后写仍保守 stale——不注册（T-24b9 语义保持）", async () => {
  const { runAgent, createAgent } = await import("../src/agent.mjs")
  const mainScript = [
    { toolCall: { name: "advisor", arguments: JSON.stringify({ type: "design", documents: ["docs/design/A.md"] }) } },
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "docs/design/A.md", content: "v2" }) } }, // 消息 2——launch 后写
    { content: "完成" },
  ]
  const main = await mainServer(mainScript)
  const adv = await reviewServer([{ pass: true, text: "设计评审通过", delay: 600 }])
  const cwd = mkdtempSync(join(tmpdir(), "tc-a2-"))
  try {
    mkdirSync(join(cwd, "docs", "design"), { recursive: true })
    const agent = createAgent({
      provider: { name: "main", baseURL: `http://127.0.0.1:${main.port}`, apiKey: "x", model: "m" },
      tools: [makeMutationTool()],
      config: { agent: { engineering: true }, advisor: { guard: false, provider: "adv" } },
      cwd,
    })
    agent.providers = [
      { name: "main", baseURL: `http://127.0.0.1:${main.port}`, apiKey: "x", model: "m" },
      { name: "adv", baseURL: `http://127.0.0.1:${adv.port}`, apiKey: "x", model: "m" },
    ]
    const runP = runAgent(agent, "先评审后写文档", { onPermissionRequest: async () => true })
    runP.catch(() => {})
    const entry = await waitPoolEntry(agent)
    assert.equal(entry.launchSeq, 0, "T-A2: launch 时无前序写（seq 0）")
    // 确定性时序（评审 #2 建议——R4）：先等消息 2 的写落地（轮询 _mutLog——评审 delay
    // 600ms 覆盖写到达窗口——不依赖墙钟竞态），再等 settle 断言 stale
    const t0 = Date.now()
    while ((agent._mutLog?.length ?? 0) === 0 && Date.now() - t0 < 30000) {
      await new Promise((r) => setTimeout(r, 15))
    }
    assert.equal(agent._mutLog.length, 1, "T-A2: launch 后的写已落地（消息 2 执行）")
    await entry.promise // 写先落 → settle 判定 stale
    assert.equal(agent._mutLog.length, 1, "T-A2: launch 后的写记账一条")
    assert.deepEqual(agent._mutLog[0].paths, [join(cwd, "docs", "design", "A.md")], "T-A2: 记账路径 = 该文档 abs")
    assert.equal(agent._engDesignTokens?.size ?? 0, 0, "T-A2: launch 后写 → stale → 不签发 token（T-24b9 语义保持）")
    assert.equal(agent._calledAdvisorThisRun, false, "T-A2: 不置 called")
    assert.equal(agent._advisorRuns.get(entry.reviewId).stale, true, "T-A2: 实例 stale 标记")
    const out = await runP
    assert.equal(out, "完成")
  } finally {
    main.server.close()
    adv.server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-B1: 通过 settle digest 清洗——全文无方括号 token——designId/reminder id 在", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { runAgent } = await import("../src/agent.mjs")
  const { server, port } = await reviewServer([{ pass: true, text: "设计评审通过" }, { text: "digest 处置" }])
  const { agent, cwd } = await makeAgent(port, { engineering: true })
  try {
    const out = JSON.parse(String(await advisorTool.execute(
      { type: "design", documents: ["docs/design/A.md"] },
      execCtx(agent, { toolCallId: "b1" }),
    )))
    agent._suspended = true
    await awaitSettle(agent, out.id)
    // 修复 B：settle 分支输出（清洗 + Approved/designId 后缀——sync 参照形态）已写回 entry.report
    const entry = agent._pendingAsyncResults[0]
    assert.ok(!String(entry.report).includes("[DESIGN-TOKEN:"), "T-B1: entry.report 无方括号 token 原文")
    assert.ok(String(entry.report).includes("Approved. Pass this exact token to eng-coder"), "T-B1: Approved 指引形态（sync 参照同构——token 明文携带供 spawn）")
    assert.ok(String(entry.report).includes("designId:"), "T-B1: designId 后缀在")
    // digest 轮注入形态——全文无方括号 token
    await runAgent(agent, "", { onPermissionRequest: async () => true }, { autoTurn: true, suspDriven: true })
    const injected = agent.history.find((m) => String(m.content ?? "").includes("async advisor review #"))
    assert.ok(injected, "T-B1: digest 注入在")
    const text = String(injected.content)
    assert.ok(!text.includes("[DESIGN-TOKEN:"), "T-B1: digest 全文无方括号 token（清洗输出——pre-fix 为原始回显）")
    assert.ok(text.includes("designId:"), "T-B1: digest 载体仍含 designId（spawn 指引不丢）")
    assert.ok(text.includes("async advisor review #"), "T-B1: reminder id 在")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-B2: stale settle digest 形态——无方括号 token + '未签发'提示在", async () => {
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  const { runAgent } = await import("../src/agent.mjs")
  const { server, port } = await reviewServer([{ pass: true, text: "设计评审通过", delay: 150 }, { text: "digest 处置" }])
  const { agent, cwd } = await makeAgent(port, { engineering: true })
  try {
    const out = JSON.parse(String(await advisorTool.execute(
      { type: "design", documents: ["docs/design/A.md"] },
      execCtx(agent, { toolCallId: "b2" }),
    )))
    const { noteMutations } = await import("../src/agent-tools/advisor-async.mjs")
    noteMutations(agent, [join(cwd, "docs", "design", "A.md")]) // 评审飞行中目标文档变更 → stale
    agent._suspended = true
    await awaitSettle(agent, out.id)
    assert.equal(agent._engDesignTokens?.size ?? 0, 0, "T-B2: stale 不签发 token")
    const entry = agent._pendingAsyncResults[0]
    assert.ok(!String(entry.report).includes("[DESIGN-TOKEN:"), "T-B2: entry.report 无方括号 token（评审员回显已剥）")
    assert.ok(String(entry.report).includes("评审目标已变更——token 未签发"), "T-B2: 未签发提示前置")
    // digest 注入形态——同样无 token + 提示在
    await runAgent(agent, "", { onPermissionRequest: async () => true }, { autoTurn: true, suspDriven: true })
    const injected = agent.history.find((m) => String(m.content ?? "").includes("async advisor review #"))
    assert.ok(injected, "T-B2: digest 注入在")
    const text = String(injected.content)
    assert.ok(!text.includes("[DESIGN-TOKEN:"), "T-B2: digest 全文无方括号 token（不变式：永不展示未注册 token）")
    assert.ok(text.includes("评审目标已变更——token 未签发"), "T-B2: 未签发提示在 digest")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})


