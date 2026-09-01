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

import { mkdtempSync, rmSync } from "node:fs"
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
    const { subagentCheckTool } = await import("../src/agent-tools/subagent-check.mjs")
    const ctx = { agent: parent }
    const c1 = JSON.parse(await subagentCheckTool.execute({ n: 1 }, ctx))
    assert.equal(c1.id, fast.id, "第一次 check 返回先完成的快子代理")
    assert.equal(c1.status, "done")
    assert.ok(c1.report.includes("fast report"), "快子代理报告")
    const c2 = JSON.parse(await subagentCheckTool.execute({ n: 2 }, ctx))
    assert.equal(c2.id, slow.id, "第二次 check 返回慢子代理")
    assert.ok(c2.report.includes("slow report"))
    const c3 = JSON.parse(await subagentCheckTool.execute({ n: 3 }, ctx))
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
    const { subagentCheckTool } = await import("../src/agent-tools/subagent-check.mjs")
    const t0 = Date.now()
    const r = JSON.parse(await subagentCheckTool.execute({ id: b.id, n: 1 }, { agent: parent }))
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

test("§15 T5: 回合收尾——未 check 的 async 自动等待 + 报告注入 + 清空", async () => {
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
        frames =
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "主会话收尾" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
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
    // TUI done 事件（区块冻结信号）随收尾发出
    assert.ok(tokens.some((t) => t.includes("coder#1/⟦ev⟧done")), "⟦ev⟧done 事件发出")
    // n 计数器 turn-end 清空 → 下轮首调重置 1
    assert.equal(parent._asyncCheckLastN, 0)
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
    const { subagentCheckTool } = await import("../src/agent-tools/subagent-check.mjs")
    const ctx = { agent: parent }
    const unknown = JSON.parse(await subagentCheckTool.execute({ id: "999", n: 1 }, ctx))
    assert.equal(unknown.status, "error")
    assert.equal(unknown.error, "unknown async subagent id: 999")
    // 已消费 id
    const one = await spawnAsync(parent, cwd, "活1")
    const c1 = JSON.parse(await subagentCheckTool.execute({ n: 2 }, ctx))
    assert.equal(c1.id, one.id)
    const consumed = JSON.parse(await subagentCheckTool.execute({ id: one.id, n: 3 }, ctx))
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
    const { subagentCheckTool } = await import("../src/agent-tools/subagent-check.mjs")
    const ctx = { agent: parent }
    const one = await spawnAsync(parent, cwd, "活1")
    const c1 = JSON.parse(await subagentCheckTool.execute({ n: 1 }, ctx))
    assert.equal(c1.id, one.id)
    assert.deepEqual(JSON.parse(await subagentCheckTool.execute({ n: 2 }, ctx)), { done: true })
    assert.deepEqual(JSON.parse(await subagentCheckTool.execute({ n: 3 }, ctx)), { done: true })
    const over = JSON.parse(await subagentCheckTool.execute({ n: 4 }, ctx))
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
    const { subagentCheckTool } = await import("../src/agent-tools/subagent-check.mjs")
    const ctx = { agent: parent }
    const a = await spawnAsync(parent, cwd, "活A")
    await spawnAsync(parent, cwd, "活B")
    const c1 = JSON.parse(await subagentCheckTool.execute({ n: 1 }, ctx))
    assert.equal(c1.id, a.id, "第一次 n=1 正常消费")
    const dup = JSON.parse(await subagentCheckTool.execute({ n: 1 }, ctx))
    assert.equal(dup.status, "error")
    assert.equal(dup.error, "invalid read counter — pass n = lastN+1")
    assert.equal(parent._asyncSubagents.size, 1, "T14: 错误调用不消费结果")
    // 正确续读仍可用（n=2 取第二个）
    const c2 = JSON.parse(await subagentCheckTool.execute({ n: 2 }, ctx))
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

