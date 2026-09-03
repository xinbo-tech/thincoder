/**
 * subagent.test.mjs — subagent provider override (model arg) resolution.
 */
import { test } from "node:test"
import assert from "node:assert/strict"

test("resolveChildProvider: provider:model / provider name / model name / null", async () => {
  const { resolveChildProvider } = await import("../src/agent-tools/subagent.mjs")
  const parent = {
    provider: { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "glm-key" },
    config: {
      providersList: [
        { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "glm-key" },
        { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "ds-key" },
      ],
    },
  }
  // null → inherit parent
  assert.deepEqual(resolveChildProvider(parent, null), parent.provider)
  // provider:model → named provider + named model
  const pm = resolveChildProvider(parent, "deepseek:deepseek-v4-flash")
  assert.equal(pm.name, "deepseek")
  assert.equal(pm.model, "deepseek-v4-flash")
  assert.equal(pm.baseURL, "https://api.deepseek.com")
  assert.equal(pm.apiKey, "ds-key")
  // provider name → configured model
  const pn = resolveChildProvider(parent, "deepseek")
  assert.equal(pn.model, "deepseek-v4-pro")
  // model name → same provider, different model
  const mn = resolveChildProvider(parent, "deepseek-v4-flash")
  assert.equal(mn.name, "glm")
  assert.equal(mn.model, "deepseek-v4-flash")
  assert.equal(mn.baseURL, parent.provider.baseURL)
  assert.equal(mn.apiKey, "glm-key")
  // unknown provider name in provider:model → throw
  assert.throws(() => resolveChildProvider(parent, "nope:model"), /unknown provider/)
})

test("resolveChildProvider: env keys are NOT picked up (config-only)", async () => {
  const { resolveChildProvider } = await import("../src/agent-tools/subagent.mjs")
  const parent = {
    provider: { name: "glm", baseURL: "x", model: "glm-5.2", apiKey: "k" },
    config: {
      providersList: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro" }],
    },
  }
  const prev = process.env.DEEPSEEK_API_KEY
  process.env.DEEPSEEK_API_KEY = "env-key"
  try {
    const p = resolveChildProvider(parent, "deepseek")
    assert.equal(p.apiKey, undefined, "env key must not leak into the child provider")
  } finally {
    if (prev === undefined) delete process.env.DEEPSEEK_API_KEY
    else process.env.DEEPSEEK_API_KEY = prev
  }
})

test("effectiveSubagentModel: tool arg > type-level > global > null", async () => {
  const { effectiveSubagentModel } = await import("../src/agent-tools/subagent.mjs")
  const parent = {
    config: {
      agent: { subagentModel: "global-model", subagentModels: { coder: "type-model" } },
    },
  }
  assert.equal(effectiveSubagentModel(parent, "coder", "arg-model"), "arg-model", "tool arg wins")
  assert.equal(effectiveSubagentModel(parent, "coder", null), "type-model", "type-level wins over global")
  assert.equal(effectiveSubagentModel(parent, "explore", null), "global-model", "global fallback")
  assert.equal(effectiveSubagentModel(parent, "explore", undefined), "global-model")
  const bare = { config: { agent: {} } }
  assert.equal(effectiveSubagentModel(bare, "coder", null), null, "null = inherit parent")
})

test("buildChildRunOpts: propagates the parent abort signal to the child", async () => {
  const { buildChildRunOpts } = await import("../src/agent-tools/subagent.mjs")
  const ctrl = new AbortController()
  const opts = buildChildRunOpts({
    depth: 2,
    signal: ctrl.signal,
    agent: { config: { agent: { subagentTurns: 42 } } },
  })
  assert.equal(opts.depth, 3, "depth increments")
  assert.equal(opts.maxTurns, 42, "subagentTurns from config")
  assert.equal(opts.signal, ctrl.signal, "parent signal passed to the child — Ctrl+C must abort the child's LLM calls")
})

test("buildChildRunOpts: no parent signal → null (child runs unbounded by interrupt)", async () => {
  const { buildChildRunOpts } = await import("../src/agent-tools/subagent.mjs")
  const opts = buildChildRunOpts({ depth: 0, agent: { config: { agent: {} } } })
  assert.equal(opts.signal, null)
})

// ─── turn-cap continue (TURN-CAP-CONTINUE.md): every wall prompts, unlimited ───

import { mkdtempSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"

const noopRead = { name: "read", description: "read a file", parameters: { type: "object", properties: {} }, readonly: true, execute: async () => "ok" }

/** Fake SSE LLM: the first `walls` calls demand the read tool (loop), then it answers. */
function wallServer(walls) {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const toolFrame = { choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: "t1", function: { name: "read", arguments: JSON.stringify({ path: "x" }) } }] } }] }
      const finishToolFrame = { choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] }
      const stopFrame = { choices: [{ index: 0, delta: { content: "child done " + "x".repeat(220) } }] }
      const finishStopFrame = { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] }
      const frames = calls.n <= walls
        ? `data: ${JSON.stringify(toolFrame)}\n\ndata: ${JSON.stringify(finishToolFrame)}\n\n`
        : `data: ${JSON.stringify(stopFrame)}\n\ndata: ${JSON.stringify(finishStopFrame)}\n\n`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames + "data: [DONE]\n\n")
    })
  })
  return { server, calls }
}

test("subagent tool: turn-cap walls prompt Continue — resume completes with fresh budget", async () => {
  const { server, calls } = wallServer(3)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-sub-"))
  try {
    const { createAgent } = await import("../src/agent.mjs")
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "deepseek-v4-pro" },
      tools: [noopRead],
      config: { agent: { subagentTurns: 3 } },
      cwd,
    })
    const asks = []
    const r = String(await subagentTool.execute({ task: "loop until the cap", role: "coder" }, {
      agent: parent, cwd, callbacks: {},
      onPermissionRequest: async (name, args) => { asks.push([name, args]); return true },
    }))
    assert.equal(calls.n, 4, "3 loop calls hit the cap, the resumed run finished on the 4th")
    assert.deepEqual(asks, [["continue", { turns: 3, agent: "coder#1" }]], "continue asked via the permission channel")
    assert.ok(r.includes("child done"), `resume completes normally — got: ${JSON.stringify(r.slice(0, 300))}`)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("subagent tool: user declines at the wall → partial-work return, no resume", async () => {
  const { server, calls } = wallServer(999)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-sub-"))
  try {
    const { createAgent } = await import("../src/agent.mjs")
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "deepseek-v4-pro" },
      tools: [noopRead],
      config: { agent: { subagentTurns: 3 } },
      cwd,
    })
    const r = String(await subagentTool.execute({ task: "loop until the cap", role: "coder" }, {
      agent: parent, cwd, callbacks: {},
      onPermissionRequest: async () => false,
    }))
    assert.equal(calls.n, 3, "hit the cap and stopped — no resumed run")
    assert.ok(r.includes("stopped: turn cap reached"), "partial-work message names the cap")
    assert.ok(r.includes("Partial output"), "partial output included")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── §7.2.3 sync spawn 完成精确冻结——工具层 ctx._subagentKey（方案 e，T-F1..F5 之一环）───

test("§7.2.3: sync spawn 成功返回前 ctx 留 _subagentKey（relayPrefix 去尾）；async 分支不设（round2 #2）", async () => {
  const { server, calls } = wallServer(0) // 0 wall：首请求即出报告（单轮完成）
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-fz-"))
  try {
    const { createAgent } = await import("../src/agent.mjs")
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    // sync（阻塞）spawn：成功后 execute 的 ctx 上留 key = relayPrefix 去尾
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "deepseek-v4-pro" },
      tools: [noopRead],
      config: { agent: {} },
      cwd,
    })
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    const r = String(await subagentTool.execute({ task: "quick job", role: "coder" }, ctx))
    assert.ok(r.includes("child done"), "sync spawn 正常完成")
    assert.equal(calls.n, 1, "单轮完成")
    assert.equal(ctx._subagentKey, "coder#1", "ctx._subagentKey = relayPrefix 去尾（role#N）")
    // async spawn：ack 立即返回——ctx._subagentKey 明确不设（async ack 由 isAsyncSpawnResult 跳过冻结）
    const parent2 = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "deepseek-v4-pro" },
      tools: [noopRead],
      config: { agent: {} },
      cwd,
    })
    const actx = { agent: parent2, cwd, callbacks: {}, depth: 0 }
    const ack = JSON.parse(String(await subagentTool.execute({ task: "bg job", role: "coder", async: true }, actx)))
    assert.equal(ack.status, "running", "async ack 立即返回")
    assert.equal(actx._subagentKey, undefined, "async 分支不设 ctx._subagentKey（round2 #2）")
    const entry = parent2._asyncSubagents.get(String(ack.id))
    await entry.promise // 收尾等后台完成（清理不悬挂）
    assert.ok(String(entry.report ?? "").includes("child done"))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§7.2.3: sync spawn 失败/被拒路径 ctx._subagentKey 不设（错误路径不触发冻结——T-F5 工具层）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = process.cwd()
  // ① 拒绝（manual auto-turn spawn 门——错误字符串返回，早于 relay）
  const gateParent = {
    config: { agent: {} }, _inAutoTurn: true, autoApprove: false,
    _touchedFiles: [], history: [], _subAgentCounter: 0,
  }
  const gctx = { agent: gateParent, cwd, callbacks: {}, depth: 0 }
  const gateOut = String(await subagentTool.execute({ task: "x", role: "explore" }, gctx))
  assert.ok(gateOut.includes("cannot spawn subagents from a manual auto-turn"), "门拒错误文本返回")
  assert.equal(gctx._subagentKey, undefined, "拒绝路径 ctx 未设 key")
  // ② execute 抛错（未知 role——早于 makeRelay）
  const errCtx = { agent: { config: { agent: {} } }, cwd, callbacks: {}, depth: 0 }
  await assert.rejects(subagentTool.execute({ task: "x", role: "bogus" }, errCtx), /Unknown subagent role/)
  assert.equal(errCtx._subagentKey, undefined, "抛错路径 ctx 未设 key")
  // ③ 非 spawn 动作（status/check/cancel 面）不经 spawn 成功路径——不设 key（escalate
  //    例外：成功路径同享设 key——见下方 escalate 用例）
  const sc = { agent: { config: { agent: {} } }, cwd, callbacks: {}, depth: 0 }
  const st = String(await subagentTool.execute({ action: "status" }, sc))
  assert.ok(st.includes("running"), "status 返回池概览")
  assert.equal(sc._subagentKey, undefined)
})

test("§7.2.3（round1 #2）: escalate 成功路径 ctx 留 _subagentKey（escalate#N）；escErr 中途失败不设", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-esc-"))
  try {
    const pool = [{ provider: "kimi", model: "kimi-k3" }]
    // 成功路径（注入假 runAgent——不触网）：execute 返回前 ctx 留 key = relayPrefix 去尾
    const parent = {
      tools: [],
      config: {
        agent: { consultModels: pool },
        providersList: [{ name: "kimi", baseURL: "http://127.0.0.1:1", model: "kimi-k3", apiKey: "k" }],
      },
      cwd,
    }
    const ectx = {
      agent: parent, cwd, callbacks: {}, depth: 0,
      runAgent: async () => "post-op body " + "x".repeat(300),
    }
    const out = String(await subagentTool.execute({ action: "escalate", task: "复杂重构" }, ectx))
    assert.ok(out.includes("post-op report"), "escalate 成功返回术后报告")
    assert.equal(ectx._subagentKey, "escalate#1", "escalate 成功 → ctx._subagentKey = relayPrefix 去尾（escalate#N）")
    // escErr（运行中途失败——runAgent 抛错）：软返回错误文本——不设 key——TUI 回落角色启发式
    const fctx = {
      agent: { ...parent, _subAgentCounter: 1 }, cwd, callbacks: {}, depth: 0,
      runAgent: async () => { throw new Error("escalate child boom") },
    }
    const fout = String(await subagentTool.execute({ action: "escalate", task: "会失败的活" }, fctx))
    assert.ok(fout.includes("escalate (kimi:kimi-k3) error: escalate child boom"), "失败返回错误文本（软返回——escErr）")
    assert.equal(fctx._subagentKey, undefined, "escErr 中途失败不设 key（错误路径不触发冻结——round1 #1）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})


// ─── variant roles fail closed (coder-leak fix, 2026-08-25) ─────────────────────
// Exact-string mode gates let "Coder"/" coder" slip through BOTH gates into a full-write
// child. Unknown roles now throw before any mode check. (CLI parity with the plugin.)
test("variant roles fail closed — coder leak fix (2026-08-25)", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const makeCtx = (engineering) => ({
    agent: { config: { agent: { engineering } }, _touchedFiles: [], history: [], cwd: process.cwd() },
    cwd: process.cwd(), callbacks: {}, depth: 0,
  })
  for (const role of ["Coder", "CODER", " coder", "eng-coder ", "Explore", "bogus", ""]) {
    for (const eng of [true, false]) {
      await assert.rejects(
        subagentTool.execute({ task: "x", role }, makeCtx(eng)),
        /Unknown subagent role/,
        `role=${JSON.stringify(role)} engineering=${eng} must fail closed`,
      )
    }
  }
  // Exact roles keep their mode-gate semantics
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder" }, makeCtx(true)),
    /use role='eng-coder'/,
  )
})

test("spawn 缺 task → 快速失败（schema required 已移出多动作 schema——机械校验在 execute 内）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = { agent: { config: { agent: {} } }, cwd: process.cwd(), callbacks: {}, depth: 0 }
  for (const bad of [undefined, "", "   "]) {
    await assert.rejects(
      subagentTool.execute({ role: "coder", ...(bad === undefined ? {} : { task: bad }) }, ctx),
      /requires a task/,
      `task=${JSON.stringify(bad)} 必须快速失败（不下游 content:undefined）`,
    )
  }
  // escalate 动作同款校验在 executeEscalateAction（返回 Error 文本——escalate 语义）
  const noTask = await subagentTool.execute({ action: "escalate" }, {
    agent: { config: { agent: { consultModels: [{ provider: "k", model: "m" }] } } },
    cwd: process.cwd(), callbacks: {}, depth: 0,
  })
  assert.ok(String(noTask).includes("escalate requires a task"), "escalate 缺 task → 清晰 Error 文本")
})

test("subagent tool description exposes the role capability matrix (no dev-comment leaks)", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.description
  for (const probe of [
    "Available roles",
    "Why delegate?",
    "already verified",
    "- explore",
    "- plan",
    "- coder",
    "- eng-coder",
    "git context auto-injected",
    "delivery transparency table",
    "Mode filtering",
  ]) {
    assert.ok(d.includes(probe), `description missing "${probe}"`)
  }
  assert.ok(!d.includes("OVERRIDDEN"), "dev-comment leak: OVERRIDDEN in description")
  assert.ok(!d.includes("SETUP.MJS"), "internal impl path leaked into description")
  const roleDesc = subagentTool.parameters.properties.role.description
  assert.ok(!roleDesc.includes("OVERRIDDEN"), "role description leaks dev comment")
})

// ─── §15 async subagent（AGENT-LOOP.md §15，T1-T14）────────────────────────

/** Local mock LLM server with per-step delay (slow children), modeled on
 *  agent.test.mjs's mockLLM. Script steps: { content } / { content, delay } /
 *  { toolCall: {name, arguments} } — the first request gets step 0, and so on
 *  (parent and children share the server, exactly like the real provider). */
function asyncServer(script) {
  return import("node:http").then(({ createServer }) => {
    let i = 0
    const requests = []
    const server = createServer((req, res) => {
      let bodyText = ""
      req.on("data", (c) => (bodyText += c))
      req.on("end", async () => {
        requests.push(JSON.parse(bodyText))
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
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests }))
    })
  })
}

const LONG_REPORT = (tag) => `${tag} report ` + "x".repeat(220) // > MIN_REPORT_CHARS

/** Spawn an async child against the given parent (task text names the script step). */
async function spawnAsync(parent, cwd, task) {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const r = String(await subagentTool.execute({ task, role: "coder", async: true }, {
    agent: parent, cwd, callbacks: {}, depth: 0,
  }))
  return JSON.parse(r)
}

const waitFor = async (fn, timeoutMs = 5000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > timeoutMs) throw new Error("waitFor timeout")
    await new Promise((r) => setTimeout(r, 10))
  }
}

function asyncParent(provider, cwd) {
  return import("../src/agent.mjs").then(({ createAgent }) =>
    createAgent({ provider, tools: [noopRead], config: { agent: {} }, cwd }))
}

test("§15 T1/T2: async spawn 立即返回、主会话可继续（不被阻塞）", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("slow"), delay: 400 }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const t0 = Date.now()
    const out = await spawnAsync(parent, cwd, "慢活")
    const elapsed = Date.now() - t0
    assert.equal(out.status, "running", "T1: spawn 返回 running 而非等待报告")
    assert.ok(elapsed < 300, `T1: spawn 早于子代理完成（elapsed=${elapsed}ms，子代理 400ms）`)
    const entry = parent._asyncSubagents.get(String(out.id))
    assert.ok(entry, "T1: _asyncSubagents 登记该项")
    assert.equal(entry.status, "running")
    // T2: 同一回合再调只读工具——正常执行不被 spawn 阻塞
    const readResult = await noopRead.execute({ path: "x" }, { cwd })
    assert.equal(readResult, "ok", "T2: spawn 后主会话工具照常执行")
    await entry.promise // 收尾：等子代理完成，避免挂起连接
    assert.equal(entry.done, true)
    assert.ok(String(entry.report).includes("slow report"), "子代理报告落 entry")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§15 T3: 多 async 按完成顺序消费（先完成先返回，arrival order）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("fast") },
    { content: LONG_REPORT("slow"), delay: 300 },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const fast = await spawnAsync(parent, cwd, "快活")
    const slow = await spawnAsync(parent, cwd, "慢活")
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = { agent: parent }
    const c1 = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(c1.id, fast.id, "第一次 check 返回先完成的快子代理")
    assert.equal(c1.status, "done")
    assert.ok(c1.report.includes("fast report"), "快子代理报告")
    const c2 = JSON.parse(await subagentTool.execute({ action: "check", n: 2 }, ctx))
    assert.equal(c2.id, slow.id, "第二次 check 返回慢子代理")
    assert.ok(c2.report.includes("slow report"))
    const c3 = JSON.parse(await subagentTool.execute({ action: "check", n: 3 }, ctx))
    assert.deepEqual(c3, { done: true }, "全部消费后 done:true")
    assert.equal(parent._asyncSubagents.size, 0, "消费后从 Map 删除")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§15 T4: 带 id check 阻塞到该子代理完成", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("B"), delay: 400 },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const b = await spawnAsync(parent, cwd, "任务B")
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const t0 = Date.now()
    const r = JSON.parse(await subagentTool.execute({ action: "check", id: b.id, n: 1 }, { agent: parent }))
    const elapsed = Date.now() - t0
    assert.equal(r.id, b.id, "带 id 等特定子代理")
    assert.ok(r.report.includes("B report"), "返回其报告")
    assert.ok(elapsed >= 350, `阻塞到其完成（elapsed=${elapsed}ms）`)
    // 消费后从 Map 删除（与 T3 同语义——本测试只 spawn 一个 b）
    assert.equal(parent._asyncSubagents.size, 0)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§15 T5 (§17 D-S1 superseded): 回合收尾——回合内已 settle 的 async 收已完成直注入 + 清空（collectSettledAsync 语义）", async () => {
  // §17 D-S1：回合尾不再 allSettled 等待——collectSettledAsync 只注入"回合内已 settle"
  // 项（① 直注入，形态同 §15）并移出池；未完成项移交挂起会话（agent-turn.mjs
  // suspensionSession——见 test/suspension.test.mjs T-S1）。本用例子代理在回合内完成
  // （快子代理），收尾注入路径与旧语义观察一致（已 settle → 注入 + 清空）。
  // Content-aware server: the child's requests carry its task text ("后台干活"),
  // the parent's carry "派活". Parent calls: #1 → subagent(async) tool call,
  // #2 → final answer. (A plain script index races: the child's async prepareRun
  // can land its request AFTER the parent's next turn's request.)
  const { createServer } = await import("node:http")
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", () => {
      let frames
      // Discriminator: the CHILD's request carries the task as its first user
      // message content ("content":"后台干活"); the PARENT's turn-1 request only
      // has the task inside the escaped tool-call arguments (\"task\":\"后台干活\"
      // — note the backslashes — so the bare-text check must come after).
      if (bodyText.includes('"content":"后台干活"')) {
        frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: LONG_REPORT("后台完成") } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
      } else if (bodyText.includes("后台干活")) {
        // 父回合 2（最终回复）延迟 400ms：无论子代理请求是否晚于本请求到达
        // （prepareRun 竞态），子代理 settle（即刻响应）都先于收尾 token——
        // done-先于-结论 的顺序断言确定（旧实现 done 在收尾统一发，必在结论后）。
        setTimeout(() => {
          res.writeHead(200, { "Content-Type": "text/event-stream" })
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "主会话收尾" } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            `data: [DONE]\n\n`,
          )
        }, 400)
        return
      } else {
        const subCall = { tool_calls: [{ index: 0, id: "call_1", function: { name: "subagent", arguments: JSON.stringify({ task: "后台干活", role: "coder", async: true }) } }] }
        frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: subCall }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
          `data: [DONE]\n\n`
      }
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const tokens = []
    const out = await runAgent(parent, "派活", {
      onToken: (t) => tokens.push(t),
      onPermissionRequest: async () => true,
    })
    assert.equal(out, "主会话收尾")
    // 报告注入（user 角色 reminder + 报告）
    const injected = parent.history.find((m) => typeof m.content === "string" && m.content.includes("async subagent #1 (coder) finished"))
    assert.ok(injected, "注入 [System reminder: async subagent #id (role) finished]")
    assert.equal(injected.role, "user")
    assert.ok(injected.content.includes("后台完成 report"), "报告文本注入")
    // _asyncSubagents 清空
    assert.equal(parent._asyncSubagents.size, 0, "收尾后清空")
    assert.equal(parent._asyncQueue.length, 0)
    // TUI done 事件（区块冻结信号）：settle 即发（D-A3 2026-09-02 修复）——
    // 回合中完成的子代理在收尾前就收到 done；收尾不再补发（恰好一个），
    // 且位置先于结论（完成即冻结——旧实现 done 在收尾统一发，必在结论后）。
    const doneTokens = tokens.filter((t) => t.includes("coder#1/⟦ev⟧done"))
    assert.equal(doneTokens.length, 1, "⟦ev⟧done 恰好一次（settle 即发，收尾不补发）")
    const doneIdx = tokens.findIndex((t) => t.includes("coder#1/⟦ev⟧done"))
    const conclusionIdx = tokens.findIndex((t) => t.includes("主会话收尾"))
    assert.ok(doneIdx >= 0 && conclusionIdx > doneIdx,
      `done 先于结论（done@${doneIdx} < conclusion@${conclusionIdx}）——完成即冻结，块不在结论之后`)
    // n 计数器 turn-end 清空 → 下轮首调重置 1
    assert.equal(parent._asyncCheckLastN, 0)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§17.5 T5b（agent 级——collectSettledAsync suspDriven 驱动分支）: 驱动回合尾不再直注入——settled 留池 → sweep → 消化轮 run 首行注入（round1 #2：无驱动兜底 = T5 直注入——本用例显式传 suspDriven 验驱动分支）", async () => {
  // 17.5.2/17.5.4 #2：suspDriven=true（agent-turn 驱动层传）→ collectSettledAsync 回合尾
  // 不直注入排空——done 条目留池（settled not consumed）→ 挂起会话首轮 sweep → 消化轮
  // （auto-turn）run 首行统一注入（D-S3 单注入点）。T5（无 suspDriven）= 兜底直注入对照。
  const { createServer } = await import("node:http")
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", () => {
      let frames
      if (bodyText.includes('"content":"后台干活"')) {
        // 子代理请求：即刻完成（先于父回合 2 的收尾——done 先于结论）
        frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: LONG_REPORT("后台完成") } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
      } else if (bodyText.includes("async subagent #1 (coder) finished")) {
        // 消化轮（auto-turn）：pending 已在其 run 首行注入——返回消化总结
        frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "消化轮总结" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
      } else if (bodyText.includes("后台干活")) {
        setTimeout(() => {
          res.writeHead(200, { "Content-Type": "text/event-stream" })
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "主会话收尾" } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            `data: [DONE]\n\n`,
          )
        }, 400)
        return
      } else {
        const subCall = { tool_calls: [{ index: 0, id: "call_1", function: { name: "subagent", arguments: JSON.stringify({ task: "后台干活", role: "coder", async: true }) } }] }
        frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: subCall }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
          `data: [DONE]\n\n`
      }
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    // 回合 1（驱动）：子代理回合中 settle——collectSettledAsync 跳过直注入
    const out = await runAgent(parent, "派活", { onPermissionRequest: async () => true }, { suspDriven: true })
    assert.equal(out, "主会话收尾")
    assert.ok(!parent.history.some((m) => String(m.content ?? "").includes("async subagent #1 (coder) finished")),
      "驱动回合尾不直注入（settled 留池——等待挂起消化轮）")
    assert.equal(parent._asyncSubagents.size, 1, "settled 条目留池（settled not consumed）")
    const entry = [...parent._asyncSubagents.values()][0]
    assert.equal(entry.done, true, "条目已 settle 未消费")
    // 挂起会话首轮 sweep（suspensionSession loop top 同语义）→ pending
    parent._pendingAsyncResults ??= []
    for (const e of [...parent._asyncSubagents.values()]) {
      if (e.done && !e._inPending) {
        e._inPending = true
        parent._pendingAsyncResults.push(e)
        parent._asyncSubagents.delete(String(e.id))
      }
    }
    // 消化轮（auto-turn）：run 首行统一注入 pending
    const digestOut = await runAgent(parent, "", { onPermissionRequest: async () => true }, { autoTurn: true, suspDriven: true })
    assert.equal(digestOut, "消化轮总结")
    const injected = parent.history.find((m) => typeof m.content === "string" && m.content.includes("async subagent #1 (coder) finished"))
    assert.ok(injected, "消化轮 run 首行注入 [System reminder: async subagent #id (role) finished]")
    assert.equal(injected.role, "user")
    assert.ok(injected.content.includes("后台完成 report"), "报告文本注入")
    assert.equal(parent._pendingAsyncResults.length, 0, "pending 消费清空")
    assert.equal(parent._asyncSubagents.size, 0, "池空（消化轮收尾无残留）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})


test("§15 D-A3 修复: 回合中先完成的 async 子代理——settle 即发 ⟦ev⟧done，冻结位置在结论之前", async () => {
  // Content-aware server（同 T5）：父回合 1 → subagent(async) 工具调用；
  // 子代理 300ms 后完成；父回合 2 的"结论"500ms 后才到——done 事件（settle 即发）
  // 必先于结论 token（完成即冻结：块冻结在完成时刻的流位置，不在结论之后）。
  // 子代理延迟 < 结论延迟：无论子代理请求是否晚于父回合 2 请求到达（prepareRun
  // 竞态），done 都先于结论——顺序断言确定。
  const { createServer } = await import("node:http")
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", () => {
      const send = (frames, delay) => {
        const go = () => {
          res.writeHead(200, { "Content-Type": "text/event-stream" })
          res.end(frames)
        }
        if (delay) setTimeout(go, delay)
        else go()
      }
      if (bodyText.includes('"content":"快活"')) {
        // 子代理：300ms 后完成
        send(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: LONG_REPORT("快完成") } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`,
          300,
        )
      } else if (bodyText.includes("快活")) {
        // 父回合 2（主会话继续）：500ms 后才出结论
        send(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "主会话结论" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`,
          500,
        )
      } else {
        const subCall = { tool_calls: [{ index: 0, id: "call_1", function: { name: "subagent", arguments: JSON.stringify({ task: "快活", role: "coder", async: true }) } }] }
        send(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: subCall }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
          `data: [DONE]\n\n`,
        )
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const tokens = []
    const out = await runAgent(parent, "派活", {
      onToken: (t) => tokens.push(t),
      onPermissionRequest: async () => true,
    })
    assert.equal(out, "主会话结论")
    // done 事件：settle 即发（300ms），且先于主会话后续输出（结论 500ms）
    const doneIdx = tokens.findIndex((t) => t.includes("coder#1/⟦ev⟧done"))
    const conclusionIdx = tokens.findIndex((t) => t.includes("主会话结论"))
    assert.ok(doneIdx >= 0, "⟦ev⟧done 事件发出")
    assert.ok(conclusionIdx > doneIdx,
      `done 先于结论（done@${doneIdx} < conclusion@${conclusionIdx}）——完成即冻结，冻结块在结论之前`)
    assert.equal(tokens.filter((t) => t.includes("coder#1/⟦ev⟧done")).length, 1, "恰好一次（收尾不补发）")
    // 收尾注入仍正常（collect 只注入 + 清空）
    const injected = parent.history.find((m) => typeof m.content === "string" && m.content.includes("async subagent #1 (coder) finished"))
    assert.ok(injected, "收尾注入 reminder 仍在")
    assert.equal(parent._asyncSubagents.size, 0, "收尾后清空")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§15 T8: 中断——async 运行中 Ctrl+C → abort 传播、_asyncSubagents 立即清空、不注入", async () => {
  // Content-aware server（同 T5）：父 turn-0 → subagent(async) 工具调用；
  // 子代理与父 turn-1 请求都长延迟（5000ms）——abort 时两者都在途。
  const { createServer } = await import("node:http")
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", async () => {
      const delayed = async (content) => {
        await new Promise((r) => setTimeout(r, 5000))
        const frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(frames)
      }
      if (bodyText.includes('"content":"后台干活"')) return delayed(LONG_REPORT("后台完成")) // 子代理
      if (bodyText.includes("后台干活")) return delayed("主会话收尾") // 父 turn-1（历史含转义工具参数）
      const subCall = { tool_calls: [{ index: 0, id: "call_1", function: { name: "subagent", arguments: JSON.stringify({ task: "后台干活", role: "coder", async: true }) } }] }
      const frames =
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: subCall }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
        `data: [DONE]\n\n`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const ctrl = new AbortController()
    const runP = runAgent(parent, "派活", { onPermissionRequest: async () => true }, { signal: ctrl.signal })
    await waitFor(() => parent._asyncSubagents?.size === 1, 4000)
    assert.equal(parent._asyncSubagents.get("1").status, "running", "async 子代理运行中")
    ctrl.abort()
    await assert.rejects(runP, (e) => e?.name === "AbortError" || /abort/i.test(String(e)), "abort 传播")
    assert.equal(parent._asyncSubagents?.size ?? 0, 0, "中断后 _asyncSubagents 立即清空")
    assert.equal(parent._asyncQueue?.length ?? 0, 0)
    assert.ok(
      !parent.history.some((m) => typeof m.content === "string" && m.content.includes("async subagent")),
      "不注入陈旧错误",
    )
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})


test("§15 T6/T10/T11: 槽位队列——超限入队不拒绝 + 腾槽自动补位 + 位置递增", async () => {
  // s1 快（触发第一次腾槽补位）；s2/s3/s4 慢（保持 4 槽占满）；s5 也慢（补位后
  // 短暂窗口内 s6/s7 必须观察到 running=4 而入队）；s6/s7 快（补位后跑完收尾）。
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("child1") },
    { content: LONG_REPORT("slow2"), delay: 600 },
    { content: LONG_REPORT("slow3"), delay: 600 },
    { content: LONG_REPORT("slow4"), delay: 600 },
    { content: LONG_REPORT("slow5"), delay: 600 },
    { content: LONG_REPORT("child6") },
    { content: LONG_REPORT("child7") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const s1 = await spawnAsync(parent, cwd, "t1")
    const s2 = await spawnAsync(parent, cwd, "t2")
    const s3 = await spawnAsync(parent, cwd, "t3")
    const s4 = await spawnAsync(parent, cwd, "t4")
    for (const s of [s1, s2, s3, s4]) assert.equal(s.status, "running", "前 4 个立即启动")
    const s5 = await spawnAsync(parent, cwd, "t5")
    assert.equal(s5.status, "queued", "T6: 第 5 个入队不拒绝")
    assert.equal(s5.position, 1, "T6: position=1")
    // T10: s1 settle → 队头 s5 自动启动（无需模型再 spawn）
    await waitFor(() => parent._asyncSubagents.get(String(s5.id)).status === "running", 4000)
    assert.ok(true, "T10: 腾槽补位自动启动")
    // T11: 补位后（5 在跑/队）第 6、7 个 position 递增 1、2
    const s6 = await spawnAsync(parent, cwd, "t6")
    const s7 = await spawnAsync(parent, cwd, "t7")
    assert.equal(s6.status, "queued")
    assert.equal(s6.position, 1, "T11: 第 6 个 position=1")
    assert.equal(s7.status, "queued")
    assert.equal(s7.position, 2, "T11: 第 7 个 position=2")
    // 全部收尾（等所有 entry settle，避免挂起连接）
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
    assert.ok([...parent._asyncSubagents.values()].every((e) => e.done), "全部完成")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§15 T12: check 错误路径——未知/已消费 id", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("one") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = { agent: parent }
    const unknown = JSON.parse(await subagentTool.execute({ action: "check", id: "999", n: 1 }, ctx))
    assert.equal(unknown.status, "error")
    assert.equal(unknown.error, "unknown async subagent id: 999")
    // 已消费 id
    const one = await spawnAsync(parent, cwd, "活1")
    const c1 = JSON.parse(await subagentTool.execute({ action: "check", n: 2 }, ctx))
    assert.equal(c1.id, one.id)
    const consumed = JSON.parse(await subagentTool.execute({ action: "check", id: one.id, n: 3 }, ctx))
    assert.equal(consumed.status, "error")
    assert.ok(consumed.error.includes("unknown async subagent id"), "已消费 id 与未知 id 同款错误")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§15 T13: n 超限（第 4 次 check > MAX_ASYNC_CHECKS=3）", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("one") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = { agent: parent }
    const one = await spawnAsync(parent, cwd, "活1")
    const c1 = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(c1.id, one.id)
    assert.deepEqual(JSON.parse(await subagentTool.execute({ action: "check", n: 2 }, ctx)), { done: true })
    assert.deepEqual(JSON.parse(await subagentTool.execute({ action: "check", n: 3 }, ctx)), { done: true })
    const over = JSON.parse(await subagentTool.execute({ action: "check", n: 4 }, ctx))
    assert.equal(over.status, "error")
    assert.equal(over.error, "check limit exceeded — use turn-end auto-wait for the rest")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§15 T14: 乱序/重复 n → invalid read counter，不消费结果", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("A") }, { content: LONG_REPORT("B") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = { agent: parent }
    const a = await spawnAsync(parent, cwd, "活A")
    await spawnAsync(parent, cwd, "活B")
    const c1 = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(c1.id, a.id, "第一次 n=1 正常消费")
    const dup = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(dup.status, "error")
    assert.equal(dup.error, "invalid read counter — pass n = lastN+1")
    assert.equal(parent._asyncSubagents.size, 1, "T14: 错误调用不消费结果")
    // 正确续读仍可用（n=2 取第二个）
    const c2 = JSON.parse(await subagentTool.execute({ action: "check", n: 2 }, ctx))
    assert.ok(c2.report.includes("B report"), "续读正常")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§15: async 仅 depth-0 有效（depth>0 报错拒绝）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const parent = await asyncParent({ baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" }, process.cwd())
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder", async: true }, { agent: parent, cwd: process.cwd(), callbacks: {}, depth: 1 }),
    /async spawn only available at the top level/,
  )
  assert.equal((parent._asyncSubagents?.size ?? 0), 0, "未登记")
})

test("§15: 后台子代理撞 turn-cap 自动拒绝继续（不弹 continue 面板）", async () => {
  const { server } = wallServer(999)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const { createAgent } = await import("../src/agent.mjs")
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "deepseek-v4-pro" },
      tools: [noopRead],
      config: { agent: { subagentTurns: 3 } },
      cwd,
    })
    const asks = []
    const out = JSON.parse(await subagentTool.execute({ task: "loop until the cap", role: "coder", async: true }, {
      agent: parent, cwd, callbacks: {},
      onPermissionRequest: async (name, args) => { asks.push([name, args]); return true },
    }))
    const entry = parent._asyncSubagents.get(String(out.id))
    await entry.promise
    assert.ok(String(entry.report).includes("stopped: turn cap reached"), "报告带 turn-cap 原因")
    assert.deepEqual(asks, [], "后台子代理不弹 continue 面板")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── §19 subagent 工具面合并（AGENT-LOOP.md §19，T-M1..M17）─────────────────
// T-M2..M4 = 上方既有 §15 用例经 action:"check" 迁移（arrival order / 指定 id 阻塞 /
// n 计数与超限 / 消费删除——21 用例零改断言全绿，见 §19 验收 AC-M1）。

test("§19 T-M1: action 缺省 = spawn——显式 action:'spawn' 与缺省零差异（async 立即返回）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("缺省完成") },
    { content: LONG_REPORT("显式完成") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-m1-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const def = JSON.parse(String(await subagentTool.execute({ task: "缺省", role: "coder", async: true }, { agent: parent, cwd, callbacks: {}, depth: 0 })))
    const exp = JSON.parse(String(await subagentTool.execute({ action: "spawn", task: "显式", role: "coder", async: true }, { agent: parent, cwd, callbacks: {}, depth: 0 })))
    assert.equal(def.status, "running", "T-M1: 缺省 action → spawn 立即返回 running")
    assert.equal(exp.status, "running", "T-M1: 显式 action:'spawn' 同款返回")
    assert.ok(exp.id !== def.id, "T-M1: 各自独立 id（同一 counter 序列）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19 T-M5: status 指定 running id → 立即返回（不阻塞——§19 触发场景：查状态不挂主回合）", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("慢完成"), delay: 500 }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-m5-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    const s = JSON.parse(String(await subagentTool.execute({ task: "慢活", role: "coder", async: true }, ctx)))
    const t0 = Date.now()
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: s.id }, ctx)))
    const elapsed = Date.now() - t0
    assert.equal(st.status, "running", "T-M5: status 返回 running")
    assert.equal(st.role, "coder")
    assert.ok(elapsed < 300, `T-M5: 不阻塞——立即返回（elapsed=${elapsed}ms，子代理 500ms）`)
    const entry = parent._asyncSubagents.get(String(s.id))
    await entry.promise
    assert.equal(entry.done, true, "收尾：子代理正常完成")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19 T-M6: status 指定 queued id → 返回 position（槽位满时）", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 5 }, () => ({ content: LONG_REPORT("占槽"), delay: 500 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-m6-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      assert.equal(s.status, "running", `前置：第 ${n} 个立即启动`)
    }
    const s5 = JSON.parse(String(await subagentTool.execute({ task: "第5", role: "coder", async: true }, ctx)))
    assert.equal(s5.status, "queued", "前置：4 槽占满 → 第 5 个入队")
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: s5.id }, ctx)))
    assert.equal(st.status, "queued", "T-M6: status 返回 queued")
    assert.equal(st.position, 1, "T-M6: position = 队列位置")
    assert.equal(st.role, "coder")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19 T-M7: status 指定 done 未取 id → done + 未取注记，不消费（随后 check 仍可取回）", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("快完成") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-m7-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    const s = JSON.parse(String(await subagentTool.execute({ task: "快活", role: "coder", async: true }, ctx)))
    const entry = parent._asyncSubagents.get(String(s.id))
    await entry.promise // 回合内 settle（非挂起态——条目留在池，status 可查）
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: s.id }, ctx)))
    assert.equal(st.status, "done", "T-M7: status 返回 done")
    assert.equal(st.done, true)
    assert.ok(String(st.note ?? "").includes("not yet consumed"), "T-M7: 未取注记（回合内 settle 未取——check 取回或回合尾注入）")
    assert.ok(parent._asyncSubagents.has(String(s.id)), "T-M7: 不消费——条目仍在池")
    // 挂起期 settle 项已移 _pendingAsyncResults（D-M2 范围）——不在池 → 与未知 id 同语义
    parent._suspended = true
    const s2 = JSON.parse(String(await subagentTool.execute({ task: "挂起活", role: "coder", async: true }, ctx)))
    const e2 = parent._asyncSubagents.get(String(s2.id))
    await e2.promise
    assert.ok(!parent._asyncSubagents.has(String(s2.id)), "挂起态 settle → 条目移出池（转 pending 注入）")
    const st2 = JSON.parse(String(await subagentTool.execute({ action: "status", id: s2.id }, ctx)))
    assert.equal(st2.status, "error", "挂起期项已移 pending——不计入 done 待取（事实源 = 池）")
    assert.ok(st2.error.includes("unknown async subagent id"), "与 check 同款错误语义")
    parent._suspended = false
    parent._pendingAsyncResults = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19 T-M8: status 省略 id → 全部概览（running/queued/done 三类，不消费）", async () => {
  const parent = await asyncParent({ baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" }, process.cwd())
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const mk = (id, role, status) => ({ id, role, status, done: status === "done", report: null, error: null, startedAt: Date.now(), model: "m", turn: 2, maxTurns: 10 })
  parent._asyncSubagents = new Map([
    ["1", mk(1, "coder", "running")],
    ["2", mk(2, "explore", "queued")],
    ["3", mk(3, "coder", "done")],
  ])
  parent._asyncQueue = [parent._asyncSubagents.get("2")]
  const st = JSON.parse(String(await subagentTool.execute({ action: "status" }, { agent: parent, callbacks: {}, depth: 0 })))
  // §19.5 D-M5：概览条目从 id 数组改结构化对象数组（running 带可决策字段）
  assert.ok(Array.isArray(st.overview.running) && st.overview.running.length === 1, "T-M8: running 类")
  assert.equal(st.overview.running[0].id, "1")
  assert.equal(st.overview.running[0].role, "coder")
  assert.equal(st.overview.running[0].model, "m", "T-M8: running 条目带 model")
  assert.equal(typeof st.overview.running[0].elapsedSec, "number", "T-M8: running 条目带 elapsedSec")
  assert.equal(st.overview.running[0].turn, 2, "T-M8: running 条目带 turn")
  assert.equal(st.overview.running[0].maxTurns, 10, "T-M8: running 条目带 maxTurns")
  assert.deepEqual(st.overview.queued, [{ id: "2", role: "explore", position: 1 }], "T-M8: queued 类（含 role + 队列 position）")
  assert.deepEqual(st.overview.done, [{ id: "3", role: "coder" }], "T-M8: done 待取类")
  assert.equal(parent._asyncSubagents.size, 3, "T-M8: status 不消费——池原样")
})

test("§19 T-M9: status 未知 id → error（不消费）", async () => {
  const parent = await asyncParent({ baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" }, process.cwd())
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: "999" }, { agent: parent, callbacks: {}, depth: 0 })))
  assert.equal(st.status, "error")
  assert.equal(st.error, "unknown async subagent id: 999")
})

test("§19 T-M10: status 后接 check——n 计数不受 status 影响（动作间零串扰）", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("活") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-m10-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    const s = JSON.parse(String(await subagentTool.execute({ task: "活", role: "coder", async: true }, ctx)))
    const entry = parent._asyncSubagents.get(String(s.id))
    await entry.promise
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: s.id }, ctx)))
    assert.equal(st.status, "done")
    assert.equal(parent._asyncCheckLastN ?? 0, 0, "T-M10: status 不推进 check 读数")
    const c1 = JSON.parse(String(await subagentTool.execute({ action: "check", id: s.id, n: 1 }, ctx)))
    assert.ok(c1.report.includes("活 report"), "T-M10: status 后 check 从 n=1 正常取回")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19 T-M11: subagent_check/escalate 工具名消失——depth-0 schema 无此二工具；subagent 带 action 六动作参数 + 池装饰", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { prepareRun } = await import("../src/agent/setup.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-m11-"))
  try {
    const agent = createAgent({
      provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" },
      tools: [],
      config: { agent: { consultModels: [{ provider: "kimi", model: "kimi-k3", effort: "max" }] } },
      cwd,
    })
    const { toolSchemas } = await prepareRun(agent, "派活", {})
    const fns = toolSchemas.map((s) => s.function.name)
    assert.ok(!fns.includes("subagent_check"), "T-M11: subagent_check 工具名消失（schema 无此工具）")
    assert.ok(!fns.includes("escalate"), "T-M11: escalate 工具名消失（并入 action）")
    const sub = toolSchemas.find((s) => s.function.name === "subagent").function
    const actionProp = sub.parameters.properties.action
    assert.deepEqual(actionProp.enum, ["spawn", "check", "status", "escalate", "cancel", "panel"], "T-M11: action 参数六动作（§19.5 + §19.6 panel）")
    assert.ok(actionProp.description.includes("BLOCKS until the target finishes"), "T-M11: action 描述引导 check 阻塞")
    assert.ok(actionProp.description.includes("kimi:kimi-k3"), "T-M11: escalate 候选池装饰（原 withPool 同款）")
    assert.ok(sub.description.includes("action:'status'") && sub.description.includes("action:'check'"), "T-M11: 工具描述含动作面")
    assert.ok(sub.description.includes("action:'cancel'"), "T-M11: 工具描述含 cancel 动作（§19.5）")
    assert.ok(sub.description.includes("action:'panel'"), "T-M11: 工具描述含 panel 动作（§19.6）")
    assert.ok(sub.parameters.properties.view, "T-M11: panel view 参数在 schema")
    assert.ok(sub.parameters.properties.freeze, "T-M11: panel freeze 参数在 schema")
    assert.ok(sub.description.includes("SIX actions"), "T-M11: 单工具六动作")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19 T-M12: 描述/提示词内容引导——action/status/check 阻塞（两端 byte-identical 由既有 15 文件比对覆盖）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.description
  for (const probe of ["action:'check'", "action:'status'", "action:'escalate'", "BLOCKS until the target finishes", "NON-BLOCKING", "consumes nothing"]) {
    assert.ok(d.includes(probe), `subagent 描述缺 "${probe}"`)
  }
  // §19.6 NF-P（round1 #8）：六动作描述预算——panel 面引导（view 视图 + freeze 门控 + 降级注）
  for (const probe of ["action:'panel'", "digested:true", "awaitingDigest", "digestion order", "no panel"]) {
    assert.ok(d.includes(probe), `§19.6 subagent 描述缺 "${probe}"（六动作预算）`)
  }
  const actionDesc = subagentTool.parameters.properties.action.description
  assert.ok(actionDesc.includes("BLOCKS until the target finishes"), "action 参数描述含 check 阻塞警告")
  assert.ok(actionDesc.includes("panel"), "action 参数描述含 panel（§19.6）")
  // 提示词同步面（main.md/engineering.md/discipline.md——退役工具名已换 action 语义）
  const PROMPTS = new URL("../src/prompts/", import.meta.url)
  const mainMd = readFileSync(new URL("main.md", PROMPTS), "utf8")
  const engMd = readFileSync(new URL("engineering.md", PROMPTS), "utf8")
  const discMd = readFileSync(new URL("discipline.md", PROMPTS), "utf8")
  assert.ok(mainMd.includes("action:'check'") && mainMd.includes("action:'status'") && mainMd.includes("action:'escalate'"), "T-M12: main.md 动作面引用（check/status/escalate）")
  assert.ok(mainMd.includes("peek at progress without blocking via `action:'status'`"), "T-M12: main.md 引导查进度用 status")
  assert.ok(engMd.includes("`escalate` is unavailable in engineering mode") && engMd.includes("action:'escalate'"), "T-M12: engineering.md escalate 不可用 + 动作名")
  assert.ok(discMd.includes("action: spawn / check / status / escalate"), "T-M12: discipline.md 工具表四动作")
  assert.ok(!mainMd.includes("subagent_check"), "T-M12: main.md 无 subagent_check 名残留")
  assert.ok(!discMd.includes("| `escalate` |"), "T-M12: discipline.md 无独立 escalate 工具行")
})

test("§19.5.5 T-CL1: cancel 动作描述含核实纪律锚——last resort + verify alarming signals（fail-when-unchanged——AGENT-LOOP §19.5.5 D-CL1）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.description
  assert.ok(d.includes("Cancel is a last resort: verify alarming signals with reliable checks (git/node — not guesses) first"), "T-CL1: 最后手段 + 核实优先（可靠检查——非猜测）")
  assert.ok(d.includes("prefer scoped recovery (restore a single affected file) over killing the child"), "T-CL1: 最小干预——scoped recovery 优先于杀子代理")
  assert.ok(d.includes("a running child's in-flight work dies with it, partial changes stay unmerged and unaudited"), "T-CL1: §18 交付代价——in-flight 随杀而逝、partial 永不合并")
})

test("§19 T-M17: action 门控——planMode status/check/cancel 放行 vs spawn/escalate 拒绝；混合批次批审批按 action 分组", async () => {
  const { executeToolCalls } = await import("../src/agent/dispatch.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const noopWrite = { name: "write", readonly: false, execute: async () => "wrote" }
  const tools = new Map([["subagent", subagentTool], ["write", noopWrite]])
  const cwd = mkdtempSync(join(tmpdir(), "cli-m17-"))
  const mkAgent = (planMode) => ({ cwd, config: { agent: {} }, planMode, autoApprove: false, _touchedFiles: [], _mutatedThisRun: false })
  try {
    // planMode：status/check/cancel（控制类）放行；spawn/escalate 非只读拒绝
    const res = await executeToolCalls(mkAgent(true), tools, [
      { name: "subagent", arguments: JSON.stringify({ action: "status" }) },
      { name: "subagent", arguments: JSON.stringify({ action: "check", n: 1 }) },
      { name: "subagent", arguments: JSON.stringify({ action: "cancel", id: "999" }) },
      { name: "subagent", arguments: JSON.stringify({ task: "x", role: "coder" }) }, // spawn（缺省 action）
      { name: "subagent", arguments: JSON.stringify({ action: "escalate", task: "x" }) },
    ], {}, 0)
    assert.equal(res[0].ok, true, "T-M17: planMode 下 status 放行")
    assert.ok(res[0].result.includes('"overview"'), "T-M17: status 返回概览")
    assert.equal(res[1].ok, true, "T-M17: planMode 下 check 放行")
    assert.ok(res[1].result.includes('"done"'), "T-M17: 空池 check 返回 done:true")
    assert.equal(res[2].ok, true, "T-M17: planMode 下 cancel 放行（控制类豁免——只停不启）")
    assert.ok(res[2].result.includes('"error"'), "T-M17: cancel 已执行（unknown id——证明未被 planMode 门拒）")
    assert.equal(res[3].ok, false)
    assert.ok(res[3].result.includes("plan mode"), "T-M17: planMode 下 spawn（缺省 action）拒绝")
    assert.equal(res[4].ok, false)
    assert.ok(res[4].result.includes("plan mode"), "T-M17: planMode 下 escalate 拒绝")
    // 混合 action 批次：check/status/cancel 不入审批组——批询问只含 write（§19 D-M1 + §19.5）
    const asks = []
    const res2 = await executeToolCalls(mkAgent(false), tools, [
      { name: "subagent", arguments: JSON.stringify({ action: "status" }) },
      { name: "subagent", arguments: JSON.stringify({ action: "cancel", id: "999" }) },
      { name: "write", arguments: JSON.stringify({ path: "a.mjs", content: "1" }) },
      { name: "write", arguments: JSON.stringify({ path: "b.mjs", content: "2" }) },
    ], {
      onBatchPermissionRequest: async (req) => { asks.push(req); return "approveAll" },
    }, 0)
    assert.equal(asks.length, 1, "T-M17: 同批一次合并询问")
    assert.deepEqual(asks[0].tools.map((t) => t.name), ["write", "write"], "T-M17: status/cancel 不入审批组（按 action 分组）")
    assert.equal(asks[0].count, 2)
    assert.equal(res2.every((r) => r.ok), true, "T-M17: approveAll 后全批执行（cancel 无 handler 也执行——控制类豁免）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19 受限变体 action 门控——eng-coder 子代理内 escalate/check/status/cancel/panel 工具层拒绝（T-E4/E5 的 action 维度镜像）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = { agent: { _role: "eng-coder", config: { agent: {} } }, depth: 1 }
  for (const action of ["escalate", "check", "status", "cancel", "panel"]) {
    await assert.rejects(
      subagentTool.execute({ action, task: "x" }, ctx),
      /only action:'spawn'/,
      `eng-coder 受限变体内 action=${action} 必须工具层拒绝`,
    )
  }
  // spawn 路径仍走既有 role 门（gateEngCoderSpawn——explore-only）
  await assert.rejects(
    subagentTool.execute({ action: "spawn", task: "x", role: "coder" }, ctx),
    /may only spawn role='explore'/,
    "受限变体内 spawn 非 explore role 仍拒绝",
  )
})



// ═══════════════════════════════════════════════════════════════════════════
// §19.5 控制面扩展（AGENT-LOOP.md §19.5——T-M18..M27）
// ═══════════════════════════════════════════════════════════════════════════

/** 带 onToken 捕获的 ctx（turn 事件镜像需要子代理事件流存在——T-M18）。 */
function tokenCtx(parent, cwd, tokens) {
  return { agent: parent, cwd, depth: 0, callbacks: { onToken: (t) => tokens.push(t) } }
}

test("§19.5 T-M18: status 全览含 role/model/elapsedSec/turn/maxTurns（可决策字段——正确性断言非仅存在性）", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("慢活"), delay: 1500 }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-m18-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "glm-child" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    const s = JSON.parse(String(await subagentTool.execute({ task: "慢活", role: "coder", async: true }, ctx)))
    const entry = parent._asyncSubagents.get(String(s.id))
    assert.ok(entry, "池条目在")
    assert.equal(entry.model, "glm-child", "spawn 时记录 childProvider.model")
    assert.ok(entry.startedAt > 0, "startedAt 于实际启动记录")
    // 子代理 ⟦ev⟧turn 事件经 onToken 拦截层镜像到条目（D-M5 装配锚点）
    await waitFor(() => (entry.turn ?? 0) > 0, 6000)
    assert.ok(tokens.some((t) => t.includes("⟦ev⟧turn")), "子代理 turn 事件在流上（镜像源）")
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: s.id }, ctx)))
    assert.equal(st.status, "running")
    assert.equal(st.role, "coder")
    assert.equal(st.model, "glm-child", "T-M18: model 实值")
    assert.equal(typeof st.elapsedSec, "number")
    assert.ok(st.elapsedSec >= 0, "T-M18: elapsedSec 计算于 status 调用时（≥0）")
    assert.ok(st.turn >= 1, `T-M18: turn 实值（子代理真实 turn ≥1，实际 ${st.turn}）`)
    assert.equal(st.maxTurns, 100, "T-M18: maxTurns = 子代理 turn 预算（DEFAULT_SUBAGENT_TURNS=100）")
    // 概览条目同带可决策字段
    const ov = JSON.parse(String(await subagentTool.execute({ action: "status" }, ctx)))
    const ovRun = ov.overview.running.find((e) => String(e.id) === String(s.id))
    assert.ok(ovRun, "概览 running 含目标")
    assert.equal(ovRun.model, "glm-child")
    assert.equal(ovRun.role, "coder")
    assert.equal(typeof ovRun.elapsedSec, "number")
    assert.ok(ovRun.turn >= 1 && ovRun.maxTurns === 100)
    await entry.promise // 收尾：等自然完成（避免悬挂连接）
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19.5 D-M7b ①: async spawn 发 ⟦ev⟧async 标记（实际启动——先于 [model]）；sync spawn 不发", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("异步活"), delay: 250 },
    { content: LONG_REPORT("同步活") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-m7b-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "glm-child" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    // async 分支：spawn 同步 emit 标记 + [model]（execute 返回前已发出——无需 waitFor）
    const aTokens = []
    const aCtx = tokenCtx(parent, cwd, aTokens)
    const a = JSON.parse(String(await subagentTool.execute({ task: "异步活", role: "coder", async: true }, aCtx)))
    assert.equal(a.status, "running")
    const marker = `${a.role}#${a.id}/⟦ev⟧async\x1e`
    const markerIdx = aTokens.indexOf(marker)
    assert.ok(markerIdx >= 0, `async spawn 流含 ⟦ev⟧async 标记（前 4 token: ${JSON.stringify(aTokens.slice(0, 4))}）`)
    assert.equal(aTokens.filter((t) => t === marker).length, 1, "标记恰好一次")
    const modelIdx = aTokens.findIndex((t) => t.includes(`${a.role}#${a.id}/[model]`))
    assert.ok(modelIdx > markerIdx, "标记先于 [model] 发出（区块创建即知 async——时序安全）")
    // sync 分支：同一 parent（counter 续号）——阻塞完成，零 async 标记
    const sTokens = []
    const sCtx = tokenCtx(parent, cwd, sTokens)
    const s = String(await subagentTool.execute({ task: "同步活", role: "coder" }, sCtx))
    assert.ok(s.includes("同步活 report"), "sync spawn 阻塞返回报告")
    assert.ok(!sTokens.some((t) => t.includes("⟦ev⟧async")), "sync spawn 不发 async 标记（sync 区块 = 无标记 = sync 头标）")
    assert.ok(sTokens.some((t) => t.includes("/[model]")), "sync spawn [model] token 照常（makeRelay——区块仍建）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19.5 T-M19: cancel 定向中止——cancelled settle（⟦ev⟧stopped 冻结 + 模型提醒注入 + 无陈旧注入），其余子代理不受影响", async () => {
  // 内容感知服务器：target 子代理请求长延迟（不自然完成——须由 cancel 中止）；
  // other 子代理 250ms 自然完成（证明 cancel 不波及其余）。
  const { createServer } = await import("node:http")
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", async () => {
      const respond = async (content, delay) => {
        await new Promise((r) => setTimeout(r, delay))
        const frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(frames)
      }
      if (bodyText.includes("TARGET-任务")) return respond(LONG_REPORT("TARGET-报告"), 8000)
      return respond(LONG_REPORT("OTHER-报告"), 250)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "cli-m19-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    const target = JSON.parse(String(await subagentTool.execute({ task: "TARGET-任务", role: "coder", async: true }, ctx)))
    const other = JSON.parse(String(await subagentTool.execute({ task: "OTHER-任务", role: "coder", async: true }, ctx)))
    const otherEntry = parent._asyncSubagents.get(String(other.id))
    assert.equal(target.status, "running")
    await waitFor(() => parent._asyncSubagents.get(String(target.id))?.status === "running")
    // cancel 定向中止 target（id 必填——定向；返回确认）
    const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: target.id }, ctx)))
    assert.equal(c.status, "cancelled", "T-M19: cancel 返回确认")
    assert.equal(c.id, String(target.id))
    // cancelled settle：条目移除（只清该条目）；⟦ev⟧stopped 冻结事件；模型提醒注入
    await waitFor(() => !parent._asyncSubagents.has(String(target.id)), 6000)
    assert.ok(
      tokens.some((t) => t.includes(`${target.role}#${target.id}/⟦ev⟧stopped`)),
      "T-M19: ⟦ev⟧stopped 冻结事件（区块 interrupted 语义冻结）",
    )
    assert.ok(
      parent.history.some((m) => typeof m.content === "string" && m.content.includes(`subagent coder#${target.id} cancelled by user — partial changes not merged/audited`)),
      "T-M19: 模型可见提醒注入（取消事实 + 半成品警示——XML 转义形态仿 injectAsyncResult）",
    )
    assert.ok(
      !parent.history.some((m) => typeof m.content === "string" && m.content.includes("TARGET-报告")),
      "T-M19: 无陈旧注入——被取消条目不入 pending、不直注入（报告文本零进入）",
    )
    assert.equal(parent._pendingAsyncResults?.length ?? 0, 0, "T-M19: cancelled 不入 _pendingAsyncResults")
    // 其余子代理不受影响——自然跑完（done 事件照发）
    await otherEntry.promise
    assert.equal(otherEntry.done, true, "T-M19: 其余子代理继续跑完")
    assert.ok(tokens.some((t) => t.includes(`${other.role}#${other.id}/⟦ev⟧done`)), "T-M19: 其余子代理照发 ⟦ev⟧done")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19.5 T-M20: cancel 错误路径——未知 id / 已完成 id / 省略 id（防误全停）", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("快活") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-m20-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    // 未知 id
    const unknown = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: "999" }, ctx)))
    assert.equal(unknown.status, "error")
    assert.equal(unknown.error, "unknown async subagent id: 999")
    // 已完成 id（自然 settle 未取——仍在池）→ 无可取消
    const s = JSON.parse(String(await subagentTool.execute({ task: "快活", role: "coder", async: true }, ctx)))
    const entry = parent._asyncSubagents.get(String(s.id))
    await entry.promise
    assert.equal(entry.done, true, "前置：子代理自然完成")
    const done = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: s.id }, ctx)))
    assert.equal(done.status, "error")
    assert.ok(String(done.error).includes("already finished"), "T-M20: 已完成 id → error")
    assert.ok(parent._asyncSubagents.has(String(s.id)), "T-M20: 错误调用不消费条目")
    // 省略 id → error（防误全停——全停走 Ctrl+C）
    const omitted = JSON.parse(String(await subagentTool.execute({ action: "cancel" }, ctx)))
    assert.equal(omitted.status, "error")
    assert.ok(String(omitted.error).includes("requires the id"), "T-M20: 省略 id → error")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19.5 T-M21: cancel 后槽位补位——running 槽腾出 → queued 队首自动启动（maybeRefillAsync 回归）+ D-M7b 标记时序（入队不发、实际启动才发）", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 5 }, () => ({ content: LONG_REPORT("占槽"), delay: 6000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-m21-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    const spawned = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      assert.equal(s.status, "running", `前置：第 ${n} 个立即启动`)
      spawned.push(s)
    }
    assert.equal(
      tokens.filter((t) => /^coder#\d+\/⟦ev⟧async\x1e$/.test(t)).length, 4,
      "D-M7b: 4 个 running spawn 各自发 async 标记（区块创建即知）",
    )
    const q1 = JSON.parse(String(await subagentTool.execute({ task: "排队1", role: "coder", async: true }, ctx)))
    assert.equal(q1.status, "queued", "前置：4 槽占满 → 入队")
    const q1Marker = `coder#${q1.id}/⟦ev⟧async\x1e`
    assert.ok(!tokens.includes(q1Marker), "D-M7b: queued 入队不发 async 标记（区块不 paint——实际启动才发）")
    // cancel 第一个 running → 其 settle（abort）腾出槽位 → 队首自动补位启动
    const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: spawned[0].id }, ctx)))
    assert.equal(c.status, "cancelled")
    await waitFor(() => parent._asyncSubagents.get(String(q1.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(q1.id))?.status === "running", "T-M21: 取消后槽位腾出——queued 自动启动")
    assert.ok(tokens.includes(q1Marker), "D-M7b: 补位启动时 async 标记随 [model] 一起发出")
    // 收尾：清池退出（其余 running 长延迟——不悬挂）
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19.5 T-M27: queued 取消——出队移除 + position 前移 + 无 abort（running 槽不受影响）", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 6 }, () => ({ content: LONG_REPORT("占槽"), delay: 6000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-m27-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const running = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      running.push(s)
    }
    const q1 = JSON.parse(String(await subagentTool.execute({ task: "排队1", role: "coder", async: true }, ctx)))
    const q2 = JSON.parse(String(await subagentTool.execute({ task: "排队2", role: "coder", async: true }, ctx)))
    assert.equal(q1.position, 1)
    assert.equal(q2.position, 2)
    // 取消队首 queued：出队 + 后续项 position 前移；返回 was:"queued"；无 abort
    const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: q1.id }, ctx)))
    assert.deepEqual(c, { id: String(q1.id), status: "cancelled", was: "queued" }, "T-M27: queued 取消确认形态")
    assert.ok(!parent._asyncSubagents.has(String(q1.id)), "T-M27: 条目出队移除")
    assert.equal(parent._asyncQueue.length, 1, "T-M27: 队列剩 1 项")
    assert.equal(parent._asyncQueue[0].position, 1, "T-M27: 后续项 position 前移（2 → 1）")
    const q2entry = parent._asyncSubagents.get(String(q2.id))
    assert.equal(q2entry?.status, "queued", "T-M27: running 槽不受影响——后续项仍在队（不启动）")
    assert.equal(parent._asyncQueue[0].id, q2entry?.id)
    assert.equal(
      [...parent._asyncSubagents.values()].filter((e) => e.status === "running").length,
      4,
      "T-M27: 4 个 running 槽原样（无 abort 无补位）",
    )
    assert.ok(!q2entry?.controller?.signal.aborted, "T-M27: 无 abort 发生")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§19.5 19.5.2b: digest（手动档）内 cancel 放行——控制类动作域（D-S7 分类）", async () => {
  const parent = { config: { agent: {} }, _inAutoTurn: true, autoApprove: false, _asyncSubagents: new Map() }
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const r = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: "7" }, { agent: parent, depth: 0, callbacks: {} })))
  assert.equal(r.status, "error", "执行到动作本身（空池 unknown id）——未被 digest 门拒绝")
  assert.equal(r.error, "unknown async subagent id: 7")
  // 对照：同 ctx 下 spawn 仍机械拒绝（digest 禁 spawn 不受影响）
  const sp = String(await subagentTool.execute({ task: "x", role: "coder", async: true }, { agent: parent, depth: 0, callbacks: {} }))
  assert.ok(sp.includes("cannot spawn subagents from a manual auto-turn"), "digest 内 spawn 仍拒绝（控制类 vs 推进类分界）")
})

// ═══════════════════════════════════════════════════════════════════════════
// §19.6 subagent panel 检查工具（AGENT-LOOP.md §19.6——T-P1..P5 + N/E/A 展开）
// ═══════════════════════════════════════════════════════════════════════════

const noopRender = () => {}
const panelToolCtx = (agent, tokens) => ({
  agent, depth: 0,
  callbacks: tokens ? { onToken: (t) => tokens.push(t) } : {},
})

test("§19.6 T-P1: panel view 返回镜像——1 running + 1 awaitingDigest 已消化（状态准确 + digested 标注）", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  const agent = { _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  // 两面板块：explore#1 running（文本流中）+ eng-coder#9 settled（报告已被 digest 消费）
  routeSubToken(state, "explore#1/搜索中...", noopRender)
  routeSubToken(state, "eng-coder#9/hello", noopRender)
  routeSubToken(state, "eng-coder#9/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  assert.equal(agent._panelSnapshot.length, 2, "镜像 2 块")
  const view = JSON.parse(String(await subagentTool.execute({ action: "panel" }, panelToolCtx(agent))))
  assert.ok(!view.degraded, "有镜像 → 非降级")
  const runB = view.panel.find((b) => b.key === "explore#1")
  const digB = view.panel.find((b) => b.key === "eng-coder#9")
  assert.equal(runB.status, "running", "running 块状态准确")
  assert.equal(runB.role, "explore")
  assert.equal(typeof runB.elapsedSec, "number", "elapsedSec 读时算（round1 #4——不暴露 startedAt）")
  assert.equal(runB.startedAt, undefined, "startedAt 不出现在视图（读时算 elapsed）")
  assert.equal(digB.status, "awaitingDigest", "settled 驻留 → awaitingDigest 状态")
  assert.equal(digB.digested, true, "pending/池均无对应（报告已消化）→ digested:true——异常驻留标注（round1 #3）")
  // 对照（N 路径）：awaitingDigest 但 pending 仍有对应（报告未达模型）→ digested:false
  const agent2 = { _pendingAsyncResults: [{ id: 7, role: "explore", report: "r" }], _asyncSubagents: new Map() }
  const state2 = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent2 }
  routeSubToken(state2, "explore#7/hello", noopRender)
  routeSubToken(state2, "explore#7/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const view2 = JSON.parse(String(await subagentTool.execute({ action: "panel", view: true }, panelToolCtx(agent2))))
  const pendB = view2.panel.find((b) => b.key === "explore#7")
  assert.equal(pendB.status, "awaitingDigest")
  assert.equal(pendB.digested, false, "pending 有对应 → 非 digested（正常驻留——下轮 digest 自动回收）")
})

test("§19.6 T-P2: freeze 已消化驻留块 → done 冻结 token 发出 → mock TUI 回收（块冻结进流 + 镜像刷新）", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  const agent = { _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  // 面板 1 驻留块（已消化——pending/池均空）；settle 锚点后另有流内容（digest 文本已在其后——
  // 补发冻结应 splice 落 settle 锚点——digest 总览之前——§17.5.5 同口径）
  routeSubToken(state, "eng-coder#9/hello", noopRender)
  routeSubToken(state, "eng-coder#9/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const anchor = state.subTasks["eng-coder#9"]._freezeAt
  state.lines.push({ text: "digest 总览: 要点", color: undefined })
  assert.ok(state.subTasks["eng-coder#9"], "驻留块在面板（用户仍见）")
  // freeze 门控通过 → done 哨兵字面 token 发出（settle 同机制格式）
  const tokens = []
  const r = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "eng-coder#9" }, panelToolCtx(agent, tokens))))
  assert.equal(r.status, "frozen", "freeze 成功返回")
  assert.equal(r.key, "eng-coder#9")
  assert.deepEqual(tokens, ["eng-coder#9/⟦ev⟧done\x1e0\x1e0\x1edone\x1e"], "发出 key + '/' + done 哨兵字面 token（onToken——TUI routeSubToken 冻结回收）")
  // mock TUI 消费该 token → 块冻结回收（splice 落 settle 锚点——digest 总览之前）+ 镜像刷新
  assert.equal(routeSubToken(state, tokens[0], noopRender), true, "TUI routeSubToken 消费 done 冻结事件")
  assert.equal(state.subTasks["eng-coder#9"], undefined, "块从驻留面板移除")
  assert.ok(state._frozenSubKeys.has("eng-coder#9"), "tombstone 登记（晚到 token 不复活）")
  const carrierIdx = state.lines.findIndex((l) => l._frozenSubTask?.key === "eng-coder#9")
  const digestIdx = state.lines.findIndex((l) => String(l.text).includes("digest 总览"))
  assert.ok(carrierIdx >= 0 && carrierIdx < digestIdx, "冻结载体 splice 落 settle 锚点——digest 总览之前（round1 #2 落位规则）")
  assert.deepEqual(agent._panelSnapshot, [], "镜像刷新——块移出")
})

test("§19.6 T-P3: freeze pending 有对应的块 → 拒绝（不破坏消化顺序——报告未达模型）", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  // pending 有对应（explore#7——报告未达模型）：拒绝——提前回收破坏消化顺序
  const agent = { _pendingAsyncResults: [{ id: 7, role: "explore", report: "r" }], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  routeSubToken(state, "explore#7/hello", noopRender)
  routeSubToken(state, "explore#7/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const tokens = []
  const r = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#7" }, panelToolCtx(agent, tokens))))
  assert.equal(r.status, "error", "门控拒绝")
  assert.ok(r.error.includes("still genuinely awaiting digestion"), `拒绝原因明确——got: ${r.error}`)
  assert.ok(r.error.includes("digestion order"), "错误含消化顺序语义")
  assert.deepEqual(tokens, [], "拒绝不发 token——块未动")
  assert.ok(state.subTasks["explore#7"], "块仍驻留（未破坏消化顺序）")
})

test("§19.6 T-P4: freeze running 块 / 不存在的 key / done 块 → 拒绝（错误信息明确）", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  const agent = { _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  // running 块 → 拒绝（settle 时自冻——不误冻）
  routeSubToken(state, "explore#1/搜索中...", noopRender)
  let r = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#1" }, panelToolCtx(agent))))
  assert.equal(r.status, "error")
  assert.ok(r.error.includes("running"), `running 拒绝原因——got: ${r.error}`)
  // 池有对应运行条目 → 拒绝（防御——非已消化驻留块）
  const agent2 = { _pendingAsyncResults: [], _asyncSubagents: new Map([[9, { id: 9, role: "eng-coder", status: "running" }]]) }
  const state2 = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent2 }
  routeSubToken(state2, "eng-coder#9/hello", noopRender)
  routeSubToken(state2, "eng-coder#9/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const r2 = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "eng-coder#9" }, panelToolCtx(agent2))))
  assert.equal(r2.status, "error")
  assert.ok(r2.error.includes("live pool entry"), "池有对应 → 拒绝")
  // 不存在的 key → 拒绝（错误列出现有块——模型可自助修正）
  r = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#99" }, panelToolCtx(agent))))
  assert.equal(r.status, "error")
  assert.ok(r.error.includes("unknown panel block key"), `未知 key 拒绝——got: ${r.error}`)
  assert.ok(r.error.includes("explore#1(running)"), "错误含现有块清单")
  // done 块（done 但未冻结的瞬时态）→ 拒绝（非 awaitingDigest）
  const agent3 = { _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state3 = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent3 }
  routeSubToken(state3, "coder#1/hello", noopRender)
  const { finishSubTaskKey } = mods
  finishSubTaskKey(state3, "coder#1", null)
  const r3 = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "coder#1" }, panelToolCtx(agent3))))
  assert.equal(r3.status, "error")
  assert.ok(r3.error.includes("done"), `done 拒绝原因——got: ${r3.error}`)
})

test("§19.6 T-P5: headless（无镜像）→ view 降级池视图 + no panel 注——freeze 报不可用", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  // view：无 _panelSnapshot（headless/VS Code/子代理上下文）→ 降级池视图（池 + pending 合成）
  const agent = {
    _asyncSubagents: new Map([
      ["1", { id: 1, role: "eng-coder", status: "running", startedAt: Date.now() - 5000 }],
      ["2", { id: 2, role: "explore", status: "queued", position: 1 }],
    ]),
    _asyncQueue: [{ id: 2, role: "explore", status: "queued", position: 1 }],
    _pendingAsyncResults: [{ id: 3, role: "coder", report: "r" }],
  }
  const view = JSON.parse(String(await subagentTool.execute({ action: "panel" }, panelToolCtx(agent))))
  assert.equal(view.degraded, true, "降级标注")
  assert.ok(view.note.includes("no panel"), "no panel 注（CLI-only 完整能力——AC-P4 声明面）")
  const runB = view.panel.find((b) => b.key === "eng-coder#1")
  assert.equal(runB.status, "running", "降级视图含池运行条目")
  assert.ok(runB.elapsedSec >= 4 && runB.elapsedSec <= 6, "池条目 elapsedSec 合成")
  const qB = view.panel.find((b) => b.key === "explore#2")
  assert.equal(qB.status, "queued", "排队条目含 position 信息")
  assert.equal(qB.position, 1)
  const pB = view.panel.find((b) => b.key === "coder#3")
  assert.equal(pB.status, "awaitingDigest", "pending 条目合成 awaitingDigest")
  // freeze：无镜像 → 不可用（明确报错）
  const fr = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "eng-coder#1" }, panelToolCtx(agent))))
  assert.equal(fr.status, "error")
  assert.ok(fr.error.includes("no CLI TUI panel mirror"), `freeze 不可用原因——got: ${fr.error}`)
  // 无镜像 + 空池 → 空降级视图（非 undefined——JSON 形状稳定）
  const empty = JSON.parse(String(await subagentTool.execute({ action: "panel" }, panelToolCtx({ _asyncSubagents: new Map(), _pendingAsyncResults: [] }))))
  assert.equal(empty.degraded, true)
  assert.deepEqual(empty.panel, [])
})

test("§19.6 N/E 展开: freeze depth>0 拒绝 / view:false 无 freeze 报错 / 空面板镜像返回空数组 / 未知 action 报错列 panel", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  // depth>0 freeze：子代理上下文无面板（同 cancel 深度门控）
  const agent = { _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  routeSubToken(state, "explore#1/hello", noopRender)
  routeSubToken(state, "explore#1/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const d = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#1" }, { agent, depth: 1, callbacks: {} })))
  assert.equal(d.status, "error")
  assert.ok(d.error.includes("depth 0"), "freeze 仅 depth-0")
  // view:false 且无 freeze → 双参互斥语义：无请求可执行——明确报错（不静默返回视图）
  const vf = JSON.parse(String(await subagentTool.execute({ action: "panel", view: false }, panelToolCtx(agent))))
  assert.equal(vf.status, "error")
  assert.ok(vf.error.includes("nothing to do"), `view:false 无 freeze 报错——got: ${vf.error}`)
  // 挂载但空面板 → 返回 []（区分"空面板"与"无镜像"——非降级）
  const agent2 = { _panelSnapshot: [], _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const v2 = JSON.parse(String(await subagentTool.execute({ action: "panel" }, panelToolCtx(agent2))))
  assert.equal(v2.degraded, undefined, "空面板镜像非降级")
  assert.deepEqual(v2.panel, [])
  // freeze 门控通过但 ctx 无 token relay → 错误（镜像在但到不了 TUI）
  const nt = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#1" }, { agent, depth: 0, callbacks: {} })))
  assert.equal(nt.status, "error")
  assert.ok(nt.error.includes("token relay"), "无 relay → freeze 无法送达——报错")
  // 未知 action 错误信息列 panel
  await assert.rejects(subagentTool.execute({ action: "bogus" }, panelToolCtx(agent)), /panel/, "未知 action 错误列全部六动作")
})

test("§19.6 动作域: digest（手动档）内 panel view 放行（只读面）——freeze 按控制类放行（同 cancel）", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  const agent = { config: { agent: {} }, _inAutoTurn: true, autoApprove: false, _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  routeSubToken(state, "explore#1/hello", noopRender)
  // view（自省类——readonly）digest 内放行
  const view = JSON.parse(String(await subagentTool.execute({ action: "panel" }, { agent, depth: 0, callbacks: {} })))
  assert.equal(view.degraded, undefined, "view 执行到动作本身——未被 digest 门拒绝")
  assert.equal(view.panel[0].status, "running")
  // freeze（控制类——同 cancel 域）digest 内放行：门控拒绝到达动作本身（running——非 digest 门）
  routeSubToken(state, "explore#1/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const tokens = []
  const fr = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#1" }, { agent, depth: 0, callbacks: { onToken: (t) => tokens.push(t) } })))
  assert.equal(fr.status, "frozen", "freeze 在 digest 内执行成功——控制类放行（19.5.3 动作域——D-S7 分类扩展）")
  assert.deepEqual(tokens, ["explore#1/⟦ev⟧done\x1e0\x1e0\x1edone\x1e"], "冻结 token 照常发出")
  // 对照：同 ctx 下 spawn 仍机械拒绝
  const sp = String(await subagentTool.execute({ task: "x", role: "coder", async: true }, { agent, depth: 0, callbacks: {} }))
  assert.ok(sp.includes("cannot spawn subagents from a manual auto-turn"), "digest 内 spawn 仍拒绝")
})

test("§19.6 门禁分类（round1 #5）: planMode 下 panel view（只读类）/freeze（控制类）放行；混合批审批 freeze/view 不入组", async () => {
  const { executeToolCalls } = await import("../src/agent/dispatch.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const noopWrite = { name: "write", readonly: false, execute: async () => "wrote" }
  const tools = new Map([["subagent", subagentTool], ["write", noopWrite]])
  const cwd = mkdtempSync(join(tmpdir(), "cli-panel-gate-"))
  const mkAgent = (planMode) => ({
    cwd, config: { agent: {} }, planMode, autoApprove: false,
    _touchedFiles: [], _mutatedThisRun: false,
    _panelSnapshot: [{ key: "eng-coder#9", role: "eng-coder", status: "awaitingDigest", startedAt: Date.now() - 4000 }],
    _pendingAsyncResults: [], _asyncSubagents: new Map(),
  })
  try {
    // 批内 freeze 需要 token relay（dispatch callbacks.onToken——真实 TUI 恒有）
    const tokens = []
    const cbs = { onToken: (t) => tokens.push(t) }
    // planMode：panel view + panel freeze 均放行（view 只读——freeze 控制类豁免）
    const res = await executeToolCalls(mkAgent(true), tools, [
      { name: "subagent", arguments: JSON.stringify({ action: "panel" }) },
      { name: "subagent", arguments: JSON.stringify({ action: "panel", freeze: "eng-coder#9" }) },
      { name: "subagent", arguments: JSON.stringify({ action: "spawn", task: "x", role: "coder" }) },
    ], cbs, 0)
    assert.equal(res[0].ok, true, "planMode 下 panel view 放行（readonly 分类）")
    assert.ok(res[0].result.includes('"panel"'), "view 返回面板")
    assert.ok(res[0].result.includes("awaitingDigest"), "view 状态含 awaitingDigest")
    assert.equal(res[1].ok, true, "planMode 下 panel freeze 放行（控制类豁免）")
    assert.ok(res[1].result.includes('"frozen"'), "freeze 门控通过执行成功")
    assert.deepEqual(tokens, ["eng-coder#9/⟦ev⟧done\x1e0\x1e0\x1edone\x1e"], "freeze token 经 dispatch relay 发出")
    assert.equal(res[2].ok, false, "planMode 下 spawn 仍拒绝（对照）")
    assert.ok(res[2].result.includes("plan mode"))
    // 混合批次：panel view/freeze 不入审批组——批询问只含两个 write
    const asks = []
    const res2 = await executeToolCalls(mkAgent(false), tools, [
      { name: "subagent", arguments: JSON.stringify({ action: "panel" }) },
      { name: "subagent", arguments: JSON.stringify({ action: "panel", freeze: "eng-coder#9" }) },
      { name: "write", arguments: JSON.stringify({ path: "a.mjs", content: "1" }) },
      { name: "write", arguments: JSON.stringify({ path: "b.mjs", content: "2" }) },
    ], {
      onBatchPermissionRequest: async (req) => { asks.push(req); return "approveAll" },
      onToken: (t) => tokens.push(t),
    }, 0)
    assert.equal(asks.length, 1, "同批一次合并询问")
    assert.deepEqual(asks[0].tools.map((t) => t.name), ["write", "write"], "panel view/freeze 不入审批组（只读 + 控制类——按 action 分组）")
    assert.equal(res2.every((r) => r.ok), true, "approveAll 后全批执行")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})


// ═══════════════════════════════════════════════════════════════════════════
// §20 子 agent 任务调度器（AGENT-LOOP.md §20——T-SD1..14 池层 N/E/A 展开）
// ═══════════════════════════════════════════════════════════════════════════

test("§20 T-SD1/T-SD8: 无调度参数 spawn → 立即启动（既有语义回归——零 queued 事件）；文件域不相交 → 并行（不误排）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("占槽"), delay: 1500 },
    { content: LONG_REPORT("a 域"), delay: 1500 },
    { content: LONG_REPORT("b 域") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd1-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    // T-SD1: 无调度参数 → 立即启动（legacy——零改动）
    const p = JSON.parse(String(await subagentTool.execute({ task: "占槽", role: "coder", async: true }, ctx)))
    assert.equal(p.status, "running", "T-SD1: 无参数 async spawn 立即启动（既有语义回归）")
    // T-SD8: 文件域不相交 + 无依赖 → 并行（第二个不因第一个在跑而排队）
    const a = JSON.parse(String(await subagentTool.execute({ task: "a 域", role: "coder", async: true, files: ["a/one.mjs"] }, ctx)))
    const b = JSON.parse(String(await subagentTool.execute({ task: "b 域", role: "coder", async: true, files: ["b/two.mjs"] }, ctx)))
    assert.equal(a.status, "running")
    assert.equal(b.status, "running", "T-SD8: 不相交文件域并行启动（不误排）")
    assert.equal(
      [...parent._asyncSubagents.values()].filter((e) => e.status === "running").length,
      3,
      "三个条目并行 running",
    )
    assert.ok(!tokens.some((t) => t.includes("⟦ev⟧queued")), "立即启动路径零 queued 事件（块由 async/[model] 建）")
    // 收尾：等全部 settle（快者先——b 无 delay）
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD2/T-SD7: 同文件域冲突 spawn → waiting-deps（不入 running——status 显示原因——路径归一化）→ 域持有者 settle 自动补位启动", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("持域"), delay: 1200 },
    { content: LONG_REPORT("冲突者"), delay: 1200 },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd2-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    // 形态一：相对路径；形态二：绝对路径——归一化后判定同文件（round1 #5）
    const a = JSON.parse(String(await subagentTool.execute({ task: "持域任务", role: "coder", async: true, files: ["src/x.mjs"] }, ctx)))
    assert.equal(a.status, "running")
    const entryA = parent._asyncSubagents.get(String(a.id))
    assert.ok(entryA._files.length === 1 && entryA._files[0].endsWith(join("src", "x.mjs")), "D-SD2: _files 归一化为绝对路径")
    const b = JSON.parse(String(await subagentTool.execute({ task: "冲突任务", role: "coder", async: true, files: [join(cwd, "src", "x.mjs")] }, ctx)))
    assert.equal(b.status, "queued", "T-SD2: 同文件域冲突 → waiting-deps（不入 running）")
    assert.equal(b.waiting, "waiting-deps")
    assert.ok(b.reason.includes(`coder#${a.id}`) && b.reason.includes("x.mjs"), `reason 含冲突对象与文件（实际: ${b.reason}）`)
    const eb = parent._asyncSubagents.get(String(b.id))
    assert.equal(eb.status, "queued", "池状态 queued（不占槽）")
    assert.ok(!eb.startedAt, "未启动（无 startedAt）")
    // T-SD7: status 显示 waiting-deps + 原因（模型可见——F-SD4）
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: b.id }, ctx)))
    assert.equal(st.status, "queued")
    assert.equal(st.waiting, "waiting-deps")
    assert.ok(st.reason.includes(`coder#${a.id}`), `status reason 含冲突对象（实际: ${st.reason}）`)
    const ov = JSON.parse(String(await subagentTool.execute({ action: "status" }, ctx)))
    const ovRow = ov.overview.queued.find((e) => String(e.id) === String(b.id))
    assert.equal(ovRow.waiting, "waiting-deps", "概览 queued 条目同带 waiting 标注")
    assert.ok(tokens.some((t) => t.startsWith(`coder#${b.id}/⟦ev⟧queued\x1ewait\x1e1\x1e`)), "D-SD3b: queued 事件随 spawn 返回（waiting 块通道——wait kind）")
    // 域持有者 settle（1200ms）→ 冲突解除 → 自动补位启动（槽空即启——D-SD4）
    await waitFor(() => parent._asyncSubagents.get(String(b.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(b.id))?.status === "running", "冲突解除自动启动（waiting 块转 running）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD3: dependsOn 未满足 → queued（依赖原因）；依赖 settle → 自动补位启动", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("依赖目标"), delay: 1200 },
    { content: LONG_REPORT("依赖者"), delay: 900 },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd3-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const dep = JSON.parse(String(await subagentTool.execute({ task: "依赖目标", role: "coder", async: true }, ctx)))
    assert.equal(dep.status, "running")
    const child = JSON.parse(String(await subagentTool.execute({ task: "依赖者", role: "coder", async: true, dependsOn: [String(dep.id)] }, ctx)))
    assert.equal(child.status, "queued", "T-SD3: 依赖未完成 → 排队（waiting-deps）")
    assert.equal(child.waiting, "waiting-deps")
    assert.ok(child.reason.includes(`coder#${dep.id}`) && child.reason.includes("依赖未完成"), `reason 含依赖对象与原因（实际: ${child.reason}）`)
    assert.equal(parent._asyncSubagents.get(String(child.id)).status, "queued", "不入 running（不占槽）")
    await waitFor(() => parent._asyncSubagents.get(String(child.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(child.id))?.status === "running", "依赖 settle → 自动补位启动（槽空即启）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD4: 多任务同依赖 → 释放后逐个启动到槽满（上限 4——D-SD4）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("被依赖"), delay: 1500 },
    { content: LONG_REPORT("依赖者1"), delay: 900 },
    { content: LONG_REPORT("依赖者2"), delay: 900 },
    { content: LONG_REPORT("依赖者3"), delay: 900 },
    { content: LONG_REPORT("依赖者4"), delay: 900 },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd4-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const dep = JSON.parse(String(await subagentTool.execute({ task: "被依赖", role: "coder", async: true }, ctx)))
    const kids = []
    for (let i = 1; i <= 4; i++) {
      const k = JSON.parse(String(await subagentTool.execute({ task: `依赖者${i}`, role: "coder", async: true, dependsOn: [String(dep.id)] }, ctx)))
      assert.equal(k.status, "queued", `第 ${i} 个依赖者排队`)
      kids.push(k)
    }
    assert.equal((parent._asyncSubagents.get(String(dep.id))).status, "running", "依赖目标仍在跑")
    await waitFor(() => kids.every((k) => parent._asyncSubagents.get(String(k.id))?.status === "running"), 8000)
    assert.equal(
      [...parent._asyncSubagents.values()].filter((e) => e.status === "running").length,
      4,
      "T-SD4: 一批依赖者同时解除 → 逐个启动到槽满（≤4）",
    )
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD4b: 混合队列（waiting-deps 在前 + slot-queued 在后）——槽释放时 earliest-runnable 启动（waiting 越行不阻塞槽位）", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 7 }, (_, i) => ({ content: LONG_REPORT(`槽${i}`), delay: i === 0 ? 3000 : 2000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd4b-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      fillers.push(s)
    }
    // 队首 Z：依赖占槽 2（waiting-deps——长期等）；队后 W：无阻塞（slot 等位）
    const z = JSON.parse(String(await subagentTool.execute({ task: "等依赖", role: "coder", async: true, dependsOn: [String(fillers[1].id)] }, ctx)))
    const w = JSON.parse(String(await subagentTool.execute({ task: "纯等位", role: "coder", async: true }, ctx)))
    assert.equal(z.status, "queued")
    assert.equal(z.waiting, "waiting-deps", "Z 依赖未满足——waiting")
    assert.equal(w.status, "queued")
    assert.equal(w.position, 2, "W slot 等位（position 2——Z 在前）")
    // cancel 占槽 1 → 腾 1 槽 → 补位扫描：Z 不可启动（依赖占槽2 未 settle）→ W 越行启动
    const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: fillers[0].id }, ctx)))
    assert.equal(c.status, "cancelled")
    await waitFor(() => parent._asyncSubagents.get(String(w.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(w.id))?.status === "running", "T-SD4b: 槽释放 → earliest runnable（W）越行启动")
    assert.equal(parent._asyncSubagents.get(String(z.id))?.status, "queued", "Z（waiting-deps 在前）仍排队（不阻塞槽位——也不被跳过误启动）")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD5/T-SD10: dependsOn 成环 → spawn 拒绝（人工注入构造——防御断言）；unknown id → 明确错误", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = process.cwd()
  // T-SD10: unknown id（非 consumed——从未存在）→ 明确错误
  const empty = { config: { agent: {} }, _asyncSubagents: new Map(), cwd }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder", async: true, dependsOn: ["42"] }, { agent: empty, cwd, callbacks: {}, depth: 0 }),
    /unknown async subagent id: 42/,
    "T-SD10: unknown id 拒绝（错误明确）",
  )
  // T-SD5: 人工向池注入成环条目（1→2→1——自然流程不可达）——spawn 依赖 1 → 拒绝
  const mk = (id, deps) => ({
    id, role: "coder", relayPrefix: `coder#${id}/`, status: "queued", position: id,
    _files: [], _dependsOn: deps, report: null, error: null, done: false, cancelled: false,
  })
  const cyc = { config: { agent: {} }, _asyncSubagents: new Map([["1", mk(1, ["2"])], ["2", mk(2, ["1"])]]), cwd }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder", async: true, dependsOn: ["1"] }, { agent: cyc, cwd, callbacks: {}, depth: 0 }),
    /cycle detected: 1 → 2 → 1/,
    "T-SD5: 可达环拒绝（错误列路径）",
  )
})

test("§20 T-SD6: cancel waiting-deps 任务 → 出队移除 + 后续 position 前移 + cancelled 块移除事件", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 5 }, () => ({ content: LONG_REPORT("占槽"), delay: 3000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd6-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      // 占槽 1 声明文件域 only.mjs（running 域持有者）——B 与之冲突排队
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true, ...(n === 1 ? { files: ["only.mjs"] } : {}) }, ctx)))
      fillers.push(s)
    }
    // B：与 running 占槽 1 同文件域 → waiting-deps；C：纯 slot 等位
    const b = JSON.parse(String(await subagentTool.execute({ task: "冲突等位", role: "coder", async: true, files: ["only.mjs"] }, ctx)))
    assert.equal(b.waiting, "waiting-deps")
    assert.ok(b.reason.includes(`coder#${fillers[0].id}`), `B 冲突对象 = running 占槽 1（实际: ${b.reason}）`)
    const c = JSON.parse(String(await subagentTool.execute({ task: "纯等位", role: "coder", async: true }, ctx)))
    assert.equal(c.position, 2, "C 在 B 之后（position 2）")
    // cancel waiting-deps 任务 B → 出队（was:"queued"——无依赖者故无 note）+ C position 前移 + 块移除事件
    const cb = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: b.id }, ctx)))
    assert.equal(cb.id, String(b.id))
    assert.equal(cb.status, "cancelled")
    assert.equal(cb.was, "queued", "queued 取消确认形态")
    assert.equal(cb.dependents, undefined, "无依赖者 → 无 note 字段（干净确认形态）")
    assert.ok(!parent._asyncSubagents.has(String(b.id)), "T-SD6: waiting-deps 条目出队移除")
    assert.equal(parent._asyncQueue.length, 1)
    assert.equal(parent._asyncQueue[0].id, Number(c.id), "剩余队项 = C")
    assert.equal(parent._asyncQueue[0].position, 1, "T-SD6: 后续项 position 前移（2 → 1）")
    assert.ok(tokens.includes(`coder#${b.id}/⟦ev⟧cancelled\x1e`), "D-SD3b: cancelled 事件发出（waiting 块移除通道）")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD9: cancel queued 依赖 → 依赖者留 queued 标 dependency cancelled（round2 #3 锁——手动档腾槽也不自动启动——工具结果内注记）——父显式 cancel 释放", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 8 }, () => ({ content: LONG_REPORT("槽"), delay: 4000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd9-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      fillers.push(s)
    }
    const x = JSON.parse(String(await subagentTool.execute({ task: "排队依赖", role: "coder", async: true }, ctx))) // queued（slot）
    const y = JSON.parse(String(await subagentTool.execute({ task: "依赖者", role: "coder", async: true, dependsOn: [String(x.id)] }, ctx)))
    assert.equal(y.status, "queued")
    // cancel queued 依赖 X（无 settle 事件——round1 #4：cancel 返回即处置）→ 依赖者 Y 留
    // queued 标 dependency cancelled——工具结果内注记（模型可见通道）
    const cx = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: x.id }, ctx)))
    assert.equal(cx.status, "cancelled")
    assert.equal(cx.was, "queued")
    assert.deepEqual(cx.dependents, [`coder#${y.id}`], "依赖者列表随 cancel 返回（工具结果内）")
    assert.ok(cx.note.includes("dependency cancelled"), `注记说明处置选项（实际: ${cx.note?.slice(0, 120)}）`)
    assert.ok(parent._asyncSubagents.has(String(y.id)), "依赖者未出队")
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: y.id }, ctx)))
    assert.equal(st.status, "queued")
    assert.equal(st.waiting, "dependency-cancelled", "T-SD9: 依赖者留 queued 标 dependency cancelled（模型可见）")
    assert.ok(st.reason.includes("dependency cancelled"), `reason 标注取消事实（实际: ${st.reason}）`)
    // 腾槽也不自动启动（round2 #3 锁——仅父显式处置或 AUTO）：cancel 占槽 1 → 槽空 →
    // 补位扫描：Y depc 锁 → 留 queued（稍候断言——防迟发补位竞态）
    const c1 = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: fillers[0].id }, ctx)))
    assert.equal(c1.status, "cancelled")
    await new Promise((r) => setTimeout(r, 250))
    assert.equal(parent._asyncSubagents.get(String(y.id))?.status, "queued", "手动档：槽空也不自动启动（depc 锁——滞留有意——显式可清）")
    // 父显式处置（cancel 该依赖者）→ 出队释放（评审 #6：显式可清——不静默）
    const cy = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: y.id }, ctx)))
    assert.equal(cy.status, "cancelled")
    assert.equal(cy.was, "queued")
    assert.ok(!parent._asyncSubagents.has(String(y.id)), "显式 cancel 释放 depc 滞留条目")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD9b: AUTO 档——依赖取消后依赖者自动启动（round2 #3——仅 AUTO/父显式才启动）", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 8 }, () => ({ content: LONG_REPORT("槽"), delay: 4000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd9b-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    parent.autoApprove = true // AUTO 档（无人值守——digest 决策）
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      fillers.push(s)
    }
    const x = JSON.parse(String(await subagentTool.execute({ task: "排队依赖", role: "coder", async: true }, ctx)))
    const y = JSON.parse(String(await subagentTool.execute({ task: "依赖者", role: "coder", async: true, dependsOn: [String(x.id)] }, ctx)))
    assert.equal(y.status, "queued")
    // AUTO：cancel queued 依赖 X → 依赖者 Y 仍留 queued（槽满）……
    const cx = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: x.id }, ctx)))
    assert.equal(cx.status, "cancelled")
    assert.equal(parent._asyncSubagents.get(String(y.id))?.status, "queued", "AUTO：槽满时 Y 仍排队（depc 视为可启动——等槽）")
    // ……腾槽 → 自动启动（不须父显式处置）
    const c1 = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: fillers[0].id }, ctx)))
    assert.equal(c1.status, "cancelled")
    await waitFor(() => parent._asyncSubagents.get(String(y.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(y.id))?.status === "running", "T-SD9b: AUTO——依赖取消后腾槽即自动启动（round2 #3）")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD9c: cancel running 依赖 → settle cancelled 分支（终态释放点）——依赖者标 dependency cancelled + 提醒含依赖者注记", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 6 }, () => ({ content: LONG_REPORT("槽"), delay: 20000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd9c-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    const dep = JSON.parse(String(await subagentTool.execute({ task: "running 依赖", role: "coder", async: true }, ctx)))
    assert.equal(dep.status, "running")
    const y = JSON.parse(String(await subagentTool.execute({ task: "依赖者", role: "coder", async: true, dependsOn: [String(dep.id)] }, ctx)))
    assert.equal(y.waiting, "waiting-deps")
    // cancel running 依赖 → abort → settle cancelled 分支：墓碑 + 依赖者 depc 标注 + 提醒
    const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: dep.id }, ctx)))
    assert.equal(c.status, "cancelled")
    await waitFor(() => !parent._asyncSubagents.has(String(dep.id)), 6000)
    assert.equal(parent._asyncTombstones.get(String(dep.id))?.status, "cancelled", "running 取消 settle → 终态墓碑（cancelled）")
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: y.id }, ctx)))
    assert.equal(st.status, "queued")
    assert.equal(st.waiting, "dependency-cancelled", "settle 终态释放：依赖者留 queued 标 dependency cancelled")
    assert.ok(st.reason.includes("dependency cancelled"), `reason 标注（实际: ${st.reason}）`)
    assert.ok(
      parent.history.some((m) => String(m.content ?? "").includes("queued dependents") && String(m.content ?? "").includes(`coder#${y.id}`)),
      "settle 提醒含依赖者注记（模型可见——供决策）",
    )
    assert.ok(tokens.some((t) => t.startsWith(`coder#${y.id}/⟦ev⟧queued\x1edepc\x1e`)), "depc 块头刷新 token（面板恒标滞留原因）")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})


test("§20 T-SD13: sync spawn 带调度参数命中冲突 → 明确错误（不队列化 sync）；无冲突 → 正常阻塞跑（sync 语义零变更）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd13-"))
  try {
    // ① 冲突（域冲突——池内 running 持域）→ sync spawn 明确错误
    const holder = {
      id: 1, role: "eng-coder", relayPrefix: "eng-coder#1/", status: "running",
      _files: [join(cwd, "src", "shared.mjs")], _dependsOn: [],
      report: null, error: null, done: false, cancelled: false, controller: null,
    }
    const conflictParent = { config: { agent: {} }, _asyncSubagents: new Map([["1", holder]]), _asyncQueue: [], cwd }
    await assert.rejects(
      subagentTool.execute({ task: "x", role: "coder", files: ["src/shared.mjs"] }, { agent: conflictParent, cwd, callbacks: {}, depth: 0 }),
      /sync spawn \(async:false\) cannot queue/,
      "T-SD13: sync 冲突 → 明确错误（错误文本含处置建议）",
    )
    // ② 依赖未满足同拒（sync 不队列化）
    const depParent = { config: { agent: {} }, _asyncSubagents: new Map(), _asyncQueue: [], _asyncTombstones: new Map([["7", { status: "cancelled", role: "eng-coder" }]]), cwd }
    await assert.rejects(
      subagentTool.execute({ task: "x", role: "coder", dependsOn: ["7"] }, { agent: depParent, cwd, callbacks: {}, depth: 0 }),
      /sync spawn \(async:false\) cannot queue/,
      "T-SD13b: sync dependsOn 已取消依赖 → 同拒（不队列化）",
    )
    // ③ 无冲突（域空/无依赖）→ 正常阻塞执行（sync 语义零变更——真实子代理跑完）
    const { server, port } = await asyncServer([{ content: LONG_REPORT("sync 无冲突") }])
    try {
      const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
      const r = String(await subagentTool.execute({ task: "x", role: "coder", files: ["unrelated.mjs"] }, {
        agent: parent, cwd, callbacks: {}, depth: 0,
      }))
      assert.ok(r.includes("sync 无冲突 report"), "sync spawn（带 files 无冲突）正常阻塞返回报告——语义零变更")
    } finally {
      server.close()
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD14: check 消费条目（终态墓碑）——dependsOn 引用视为已满足（非 consumed unknown 才拒）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("先完成") },
    { content: LONG_REPORT("依赖者") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd14-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const first = JSON.parse(String(await subagentTool.execute({ task: "先完成", role: "coder", async: true }, ctx)))
    assert.equal(first.status, "running")
    // check 消费（n=1）→ 条目删除 + 终态墓碑（consumed）
    const c1 = JSON.parse(await subagentTool.execute({ action: "check", n: 1, id: first.id }, ctx))
    assert.equal(c1.status, "done")
    assert.ok(!parent._asyncSubagents.has(String(first.id)), "check 消费删除")
    assert.equal(parent._asyncTombstones.get(String(first.id)).status, "consumed", "终态墓碑记录（consumed——T-SD14）")
    // dependsOn 引用 consumed id → 视为满足 → 无阻塞 → 立即启动（而非 unknown 错误）
    const kid = JSON.parse(String(await subagentTool.execute({ task: "依赖者", role: "coder", async: true, dependsOn: [String(first.id)] }, ctx)))
    assert.equal(kid.status, "running", "T-SD14: consumed 墓碑 id 视为已满足（dependsOn 语义完成——不拒不排）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 advisor 处置（code review 🟡）: check 对 depc 锁定条目不无界阻塞——指定 id 返回 queued+原因；arrival-order 池全锁定返回明确错误", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = process.cwd()
  // ① 指定 id：queued + depc 锁定（依赖取消墓碑）→ 立即返回（不等待——无悬挂）
  const mkLocked = (id) => ({
    id, role: "coder", relayPrefix: `coder#${id}/`, status: "queued", position: 1,
    _files: [], _dependsOn: ["99"], report: null, error: null, done: false, cancelled: false,
    startedAt: null, turn: 0, maxTurns: 0, controller: null, promise: null, _settle: null, _settleSeq: 0,
  })
  const locked = mkLocked(1)
  const agent = {
    config: { agent: {} }, cwd, autoApprove: false,
    _asyncSubagents: new Map([["1", locked]]),
    _asyncQueue: [locked],
    _asyncTombstones: new Map([["99", { status: "cancelled", role: "eng-coder" }]]),
    _asyncCheckLastN: 0,
  }
  const r1 = JSON.parse(String(await subagentTool.execute({ action: "check", n: 1, id: "1" }, { agent, depth: 0, callbacks: {} })))
  assert.equal(r1.status, "queued", "depc 锁定目标不阻塞——立即返回 queued")
  assert.equal(r1.waiting, "dependency-cancelled")
  assert.ok(r1.reason.includes("dependency cancelled"), `reason 标注锁定原因（实际: ${r1.reason}）`)
  assert.ok(r1.note.includes("cancel"), "note 引导处置（cancel/AUTO）")
  assert.ok(agent._asyncSubagents.has("1"), "未消费（条目仍在池——check 不删除）")
  // ② arrival-order：池内无 running/done、全 depc 锁定 → 明确错误（无界等待守卫）
  const agent2 = {
    config: { agent: {} }, cwd, autoApprove: false,
    _asyncSubagents: new Map([["1", mkLocked(1)], ["2", mkLocked(2)]]),
    _asyncQueue: [mkLocked(1), mkLocked(2)],
    _asyncTombstones: new Map([["99", { status: "cancelled", role: "eng-coder" }]]),
    _asyncCheckLastN: 0,
  }
  const r2 = JSON.parse(String(await subagentTool.execute({ action: "check", n: 1 }, { agent: agent2, depth: 0, callbacks: {} })))
  assert.equal(r2.status, "error", "arrival-order 全锁定池 → 明确错误（不悬挂）")
  assert.ok(r2.error.includes("dependency-cancelled"), `错误列原因（实际: ${r2.error?.slice(0, 120)}）`)
  // ③ 残留守卫（round2 #7——advisor 复审发现）：wait-kind 条目被 queued-depc 条目阻塞
  // （文件域链）——池无 running → 同样立即返回（不悬挂）——specific-id + arrival-order
  const mkFileBlocked = (id, files) => ({
    id, role: "coder", relayPrefix: `coder#${id}/`, status: "queued", position: 1,
    _files: files, _dependsOn: [], report: null, error: null, done: false, cancelled: false,
    startedAt: null, turn: 0, maxTurns: 0, controller: null, promise: null, _settle: null, _settleSeq: 0,
  })
  const fx = [join(cwd, "src", "x.mjs")] // 归一化同文件域——B(#4) 与 C(#5) 冲突
  const bStuck = mkFileBlocked(4, fx) // depc（依赖 99 已取消）+ 持域
  bStuck._dependsOn = ["99"]
  const cStuck = mkFileBlocked(5, fx) // wait-on-B（无自身依赖）
  const agent4 = {
    config: { agent: {} }, cwd, autoApprove: false,
    _asyncSubagents: new Map([["4", bStuck], ["5", cStuck]]),
    _asyncQueue: [bStuck, cStuck],
    _asyncTombstones: new Map([["99", { status: "cancelled", role: "eng-coder" }]]),
    _asyncCheckLastN: 0,
  }
  // specific-id check(C#5——wait-kind）→ 立即返回 queued（池无 running——不悬挂）
  const r4 = JSON.parse(String(await subagentTool.execute({ action: "check", n: 1, id: "5" }, { agent: agent4, depth: 0, callbacks: {} })))
  assert.equal(r4.status, "queued", "wait-kind 目标 + 无 running 池 → 立即返回（#7 残留闭合）")
  assert.equal(r4.position, 2, "返回带实时位置")
  // arrival-order 同池 → 明确错误（不再要求全 depc——结构性守卫）
  agent4._asyncCheckLastN = 1
  const r5 = JSON.parse(String(await subagentTool.execute({ action: "check", n: 2 }, { agent: agent4, depth: 0, callbacks: {} })))
  assert.equal(r5.status, "error", "arrival-order：全 queued 无 running → 明确错误（含混合锁池）")
  assert.ok(r5.error.includes("coder#4") && r5.error.includes("coder#5"), `错误列出 stuck 条目（实际: ${r5.error?.slice(0, 160)}）`)
  // ④ 对照：池有 running 条目时守卫放行（正常等待语义——不误伤）
  const runningEntry = {
    id: 8, role: "coder", relayPrefix: "coder#8/", status: "running",
    _files: [], _dependsOn: [], report: null, error: null, done: false, cancelled: false,
    startedAt: Date.now(), turn: 0, maxTurns: 0, controller: null, promise: null, _settle: null, _settleSeq: 0,
  }
  const agent5 = {
    config: { agent: {} }, cwd, autoApprove: false,
    _asyncSubagents: new Map([["4", bStuck], ["5", cStuck], ["8", runningEntry]]),
    _asyncQueue: [bStuck, cStuck],
    _asyncTombstones: new Map([["99", { status: "cancelled", role: "eng-coder" }]]),
    _asyncCheckLastN: 0,
  }
  const p5 = subagentTool.execute({ action: "check", n: 1, id: "5" }, { agent: agent5, depth: 0, callbacks: {} })
  const stillWait = await Promise.race([
    p5.then(() => "returned"),
    new Promise((r) => setTimeout(() => r("still-waiting"), 120)),
  ])
  assert.equal(stillWait, "still-waiting", "有 running 条目 → 守卫放行（等待语义保留——running settle 会唤醒）")
  // ⑤ 对照：AUTO 档 depc 非锁定——但池无 running 同样不可启动 → 立即返回 queued
  // （语义修订——原③"等待放行"改为"立即返回"：refill 由 settle 驱动——无 running 时
  // AUTO 也无法触发启动——带 AUTO 引导注记返回比悬挂正确）
  const agent3 = {
    config: { agent: {} }, cwd, autoApprove: true,
    _asyncSubagents: new Map([["1", mkLocked(1)]]),
    _asyncQueue: [mkLocked(1)],
    _asyncTombstones: new Map([["99", { status: "cancelled", role: "eng-coder" }]]),
    _asyncCheckLastN: 0,
  }
  const r6 = JSON.parse(String(await subagentTool.execute({ action: "check", n: 1, id: "1" }, { agent: agent3, depth: 0, callbacks: {} })))
  assert.equal(r6.status, "queued", "AUTO 池无 running → 立即返回 queued（含 AUTO 引导注记——不悬挂）")
  assert.ok(r6.note.includes("AUTO session"), "注记含 AUTO 引导（下个 settle/refill 启动）")
})

test("§20 advisor 处置（code review 🟡）: check 消费 × 挂起移交竞态——消费时反向清除 pending（双送达守卫）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = process.cwd()
  // 构造竞态：check 在途等待条目 X（池内 running）→ 期间 X 经挂起分支 settle（done +
  // 移交 pending + 出池）→ 唤醒 check waiter → check 消费：pending 必须被反向清除
  // （否则下轮 prepareRun 重复注入——同一报告双送达——D-S3 只注入一次不变式）。
  const entry = {
    id: 7, role: "coder", relayPrefix: "coder#7/", status: "running",
    _files: [], _dependsOn: [], report: "race report", error: null, done: false, cancelled: false,
    startedAt: Date.now(), turn: 0, maxTurns: 0, controller: null,
    _settleSeq: 0, _lastQueuedSig: null,
  }
  const agent = {
    config: { agent: {} }, cwd, autoApprove: false,
    _asyncSubagents: new Map([["7", entry]]),
    _asyncQueue: [],
    _pendingAsyncResults: [],
    _asyncWaiters: [],
    _asyncCheckLastN: 0,
  }
  const p = subagentTool.execute({ action: "check", n: 1, id: "7" }, { agent, depth: 0, callbacks: {} })
  // 等 check 进入等待（waiter 注册）后模拟挂起 settle：done + 移交 pending + 出池 + 唤醒
  await new Promise((r) => setTimeout(r, 20))
  entry.done = true
  entry.status = "done"
  agent._pendingAsyncResults.push(entry)
  agent._asyncSubagents.delete("7")
  for (const w of agent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
  const r = JSON.parse(String(await p))
  assert.equal(r.status, "done", "check 取回报告")
  assert.equal(r.report, "race report")
  assert.equal(agent._pendingAsyncResults.length, 0, "消费时反向清除 pending——防下轮重复注入（双送达守卫）")
  assert.equal(agent._asyncTombstones.get("7")?.status, "consumed", "墓碑照记 consumed")
})



