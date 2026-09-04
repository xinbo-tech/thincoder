/**
 * subagent-core.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs, subagent.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { createServer } from "node:http"
import { execSync, spawn } from "node:child_process"
import { slow } from "./slow.mjs"
import { mockLLM } from "./helpers/mock-llm.mjs"





// §18.5（2026-09-04 用户裁定——子代理零 git，AGENT-LOOP.md §18.5 D-AG1）：反向断言
// ——explore 子代理 childInput 不得含 git 上下文注入（真 git 仓库 cwd 下——旧实现
// 会命中注入分支）。顶层主 agent 的 git 注入保留（setup.mjs depth===0——§3——D-AG7）。

slow("T-AG1: runAgent —— explore 子 agent 零 git（真 git 仓库 cwd 下无注入）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const { execSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-gitctx-"))
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  git("init", "-q")
  git("config", "user.name", "t")
  git("config", "user.email", "t@t.dev")
  writeFileSync(join(dir, "x.js"), "1\n")
  git("add", ".")
  git("commit", "-qm", "初始提交abc")

  const script = [
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "看看仓库结构", role: "explore" }) } },
    { content: "探索报告。".repeat(40) },
    { content: "完成" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const agent = createAgent({ provider, tools: [], config: {}, cwd: dir })
    await runAgent(agent, "探索一下", { onPermissionRequest: async () => true })
    const childText = JSON.stringify(requests[1].messages)
    assert.ok(!childText.includes("<untrusted_git_context>"), "T-AG1: 子代理输入不含 git context 注入块")
    assert.ok(!childText.includes("Git context") && !childText.includes("git context"), "T-AG1: 子代理输入无 Git context 声明（注入句子已删）")
    assert.ok(!childText.includes("git log") && !childText.includes("git diff"), "T-AG1: explore 提示词无 git 命令承诺")
    assert.ok(!childText.includes("初始提交abc"), "T-AG1: 注入的 git 提交快照不存在——零 git（真仓库 cwd 下）")
    // 顶层主 agent git 注入保留（第 0 请求——§3 prepareRun depth===0——D-AG7 回归）
    const parentText = JSON.stringify(requests[0].messages)
    assert.ok(parentText.includes("git context") && parentText.includes("初始提交abc"), "T-AG7 回归: 顶层主 agent 仍注入 git context（setup.mjs depth===0——范围边界 D-AG7）")
    rmSync(dir, { recursive: true, force: true })
  } finally {
    server.close()
  }
})

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
    "No git context injected",
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


// ─── §18.5 子代理零 git（AGENT-LOOP.md §18.5——T-AG1/2/5/6/9）─────────────────
// 用户裁定（2026-09-04）：审计与普通探索均不注入 git 上下文——"注入了又会误导"。
// 子代理证据链 = 任务书 ∪ 磁盘当前状态（read/glob/grep）∪（审计时）_touchedFiles。


test("§18.5 T-AG5: 工具描述零 git——旧 Receives-git-context 措辞删除 + 零 git 语义", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.description
  assert.ok(!d.includes("Receives git context auto-injected"), "T-AG5: git-injection promise 措辞删除（描述与实现一致）")
  assert.ok(!d.includes("receives git context"), "T-AG5: git-injection promise 残留（大小写）清空")
  assert.ok(d.includes("No git context injected—evidence from read/glob/grep and the task book"), "T-AG5: 零 git 语义措辞（镜像锚——VS Code 同款逐字）")
  const roleDesc = subagentTool.parameters.properties.role.description
  assert.ok(!roleDesc.includes("git"), "T-AG5: role 参数描述无 git 残留")
})



test("§18.5 T-AG9: collectGitContext 死进口清理（escapeXml 保留——取消系统提醒路径仍在用）", async () => {
  const src = readFileSync(new URL("../src/agent-tools/subagent.mjs", import.meta.url), "utf8")
  assert.ok(!src.includes("collectGitContext"), "T-AG9: subagent.mjs 不再 import/引用 collectGitContext")
  assert.ok(src.includes("escapeXml"), "T-AG9: escapeXml 保留（cancelled 系统提醒注入路径在用）")
})


/** 单响应 capture server：记录每次请求体（子代理 input 检查用）。 */
function captureServer(reportText) {
  const requests = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      requests.push(JSON.parse(body))
      const frames =
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: reportText } }] })}\n\n` +
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

// 真 git 仓库 cwd：若注入分支仍在（旧实现），explore/plan spawn 会命中并把
// <untrusted_git_context> 前置进 childInput——零 git 后必须完全消失。

slow("§18.5 T-AG1/T-AG2/T-AG6: 子代理零 git——explore/plan 无注入；审计任务书含零 git 范围权威声明", async () => {
  const { execSync } = await import("node:child_process")
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-zerogit-"))
  const { server, port, requests } = await captureServer("explore report " + "x".repeat(220))
  try {
    const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd, stdio: "ignore" })
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(cwd, "x.js"), "1\n")
    git("add", ".")
    git("commit", "-qm", "初始提交abc")
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [noopRead],
      config: { agent: {} },
      cwd,
    })
    // T-AG1: explore spawn —— childInput（子代理首个 LLM 请求）不含 git context
    const r1 = String(await subagentTool.execute({ task: "看看仓库结构", role: "explore" }, { agent: parent, cwd, callbacks: {}, depth: 0 }))
    assert.ok(r1.includes("explore report"), "explore 子代理正常完成")
    const child1 = JSON.stringify(requests[0].messages)
    assert.ok(!child1.includes("<untrusted_git_context>"), "T-AG1: explore childInput 无 git context 注入")
    assert.ok(!child1.includes("Git context") && !child1.includes("git context"), "T-AG1: explore childInput 无 Git context 声明")
    assert.ok(!child1.includes("git log") && !child1.includes("git diff"), "T-AG1: explore 提示词无 git 命令承诺")
    assert.ok(!child1.includes("初始提交abc"), "T-AG1: 注入的提交快照不存在（真 git 仓库 cwd 下）")
    // T-AG2: plan spawn
    const r2 = String(await subagentTool.execute({ task: "设计缓存层", role: "plan" }, { agent: parent, cwd, callbacks: {}, depth: 0 }))
    assert.ok(r2.includes("explore report"), "plan 子代理正常完成")
    const child2 = JSON.stringify(requests[1].messages)
    assert.ok(!child2.includes("<untrusted_git_context>"), "T-AG2: plan childInput 无 git context 注入")
    assert.ok(!child2.includes("git log") && !child2.includes("git diff"), "T-AG2: plan 提示词无 git 命令承诺")
    // T-AG6: eng-coder 审计 spawn（depth>0 + _role=eng-coder）——任务书含零 git 范围权威声明
    const engParent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [noopRead],
      config: { agent: { engineering: true } },
      cwd,
    })
    engParent._role = "eng-coder"
    engParent._engTaskInput = "Docs involved: docs/design/X.md / File list: a.mjs / Acceptance: AC1"
    engParent._touchedFiles = ["src/a.mjs", "src/b.mjs"]
    const r3 = String(await subagentTool.execute({ task: "偏差审计", role: "explore" }, { agent: engParent, cwd, callbacks: {}, depth: 1 }))
    assert.ok(r3.includes("explore report"), "审计 explore 正常完成")
    const audit = JSON.stringify(requests[2].messages)
    assert.ok(audit.includes("[Audit scope"), "T-AG6: 审计任务书含 Audit scope 块（D-AG3 拼装保留）")
    assert.ok(audit.includes("Zero-git scope authority"), "T-AG6: 审计任务书含零 git 范围权威声明")
    assert.ok(audit.includes("_touchedFiles is the audit scope") || audit.includes("_touchedFiles"), "T-AG6: _touchedFiles 入审计任务书")
    assert.ok(audit.includes("src/a.mjs") && audit.includes("src/b.mjs"), "T-AG6: _touchedFiles 机械并集列出")
    assert.ok(!audit.includes("<untrusted_git_context>"), "T-AG6: 审计输入无 git 上下文注入")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})
