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

test("§19 T-M11: subagent_check/escalate 工具名消失——depth-0 schema 无此二工具；subagent 带 action 五动作参数 + 池装饰", async () => {
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
    assert.deepEqual(actionProp.enum, ["spawn", "check", "status", "escalate", "cancel"], "T-M11: action 参数五动作（§19.5）")
    assert.ok(actionProp.description.includes("BLOCKS until the target finishes"), "T-M11: action 描述引导 check 阻塞")
    assert.ok(actionProp.description.includes("kimi:kimi-k3"), "T-M11: escalate 候选池装饰（原 withPool 同款）")
    assert.ok(sub.description.includes("action:'status'") && sub.description.includes("action:'check'"), "T-M11: 工具描述含动作面")
    assert.ok(sub.description.includes("action:'cancel'"), "T-M11: 工具描述含 cancel 动作（§19.5）")
    assert.ok(sub.description.includes("FIVE actions"), "T-M11: 单工具五动作")
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
  const actionDesc = subagentTool.parameters.properties.action.description
  assert.ok(actionDesc.includes("BLOCKS until the target finishes"), "action 参数描述含 check 阻塞警告")
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

test("§19 受限变体 action 门控——eng-coder 子代理内 escalate/check/status 工具层拒绝（T-E4/E5 的 action 维度镜像）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = { agent: { _role: "eng-coder", config: { agent: {} } }, depth: 1 }
  for (const action of ["escalate", "check", "status", "cancel"]) {
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
