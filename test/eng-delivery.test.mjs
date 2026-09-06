/**
 * eng-delivery.test.mjs — §18 eng-coder delivery protocol — default async / audit spawn / task book template / authorization / closure wiring (T-E1..E18, T-TS4-6, T-A1).
 *
 * Split from test/subagent.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { createServer } from "node:http"

/** Fake SSE LLM: the first `walls` calls demand a read tool (loop), then it answers. */
function wallServer(walls) {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const frame = calls.n <= walls
        ? { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "x" }) } }] } }] }
        : { choices: [{ index: 0, finish_reason: "stop", delta: { content: "child done" } }] }
      res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
    })
  })
  return { server, calls }
}

async function runChild(parent, walls, onQuestion) {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  const ctx = { agent: parent, cwd, callbacks: { onQuestion } }
  const r = String(await subagentTool.execute({ task: "loop until the cap", role: "coder", async: false }, ctx)) // R12 (§18 D-E1a): depth-0 缺省 async——阻塞流钉 async:false
  rmSync(cwd, { recursive: true, force: true })
  return r
}

/** Real unsigned token with a fixed uuid+expiry (2026-09-06 设计 B — token = 无签名流程凭证
 *  uuid:expiresAt; HMAC 防伪层已删——测试辅助随签名路径一并退役), minted at runtime —
 *  TTL'd tokens must never be baked into test files (expired-fixture lesson 2026-08-31). */
async function unsignedToken(uuid, expiresAt) {
  return `${uuid}:${expiresAt}`
}

function asyncParent(port, extra = {}) {
  const base = {
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: false },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _asyncSubagents: new Map(),
  }
  return { ...base, ...extra }
}

function asyncCtx(parent, cwd, extra = {}) {
  return { agent: parent, cwd, callbacks: {}, ...extra }
}

/** Async spawn results are JSON STRINGS (tool-result contract — §18 code review #1);
 *  parse for shape assertions. */
const spawnJson = (raw) => JSON.parse(String(raw))

/** 单发 SSE server：每个 LLM 请求一律立即以 `text` 完成（无工具调用）。 */
function oneShotServer(text) {
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        "data: [DONE]\n\n",
      )
    })
  })
  return { server }
}

/** 工程模式父会话 fake（eng-coder spawn 需槽位 + 无签名 token——2026-09-06 设计 B：uuid:expiresAt；async 池字段齐备）。 */
function engParent(port, token, extra = {}) {
  return {
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: true },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _engDesignTokens: new Map([["eng", token]]),
    _engDesignToken: token,
    _asyncSubagents: new Map(),
    ...extra,
  }
}

/** eng-coder 子代理上下文 fake（depth>0、_role="eng-coder"——内部 spawn 门作用对象）。 */
function engChildCtx(port, cwd, extra = {}) {
  const agent = {
    _role: "eng-coder",
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: true },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _asyncSubagents: new Map(),
    ...extra,
  }
  return { agent, cwd, callbacks: {}, depth: 1 }
}

slow("T-E1: eng-coder 缺省 async（§18 D-E1）——spawn 立即返回 running、交付后台 settle 带 designId；explore async:false 显式同步（阻塞回归——R12 后缺省已翻 async）", async () => {
  const { server } = oneShotServer("eng-coder delivery done")
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e1-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await unsignedToken("e1e1e1e1-1111-4111-8111-0000000000e1", Date.now() + 24 * 3600 * 1000)
    const parent = engParent(port, token)
    const ctx = { agent: parent, cwd, callbacks: {} }
    // 不带 async 参数 → eng-coder 角色级缺省 async
    const r = spawnJson(await subagentTool.execute({ task: "implement per design", role: "eng-coder", designId: "eng", designToken: token }, ctx))
    assert.equal(r.status, "running", "eng-coder 缺省 async → 立即返回 running（不阻塞）")
    assert.equal(r.role, "eng-coder")
    assert.equal(r.id, 1)
    const entry = parent._asyncSubagents.get(1)
    assert.ok(entry && entry.status === "running", "async 池有该项")
    await entry.settled
    assert.ok(entry.done, "后台 settle 落报告")
    assert.ok(entry.report.includes("Subagent (eng-coder) completed"), "交付报告成型")
    assert.ok(entry.report.includes("designId: eng"), "报告回传 designId（父侧可选修正轮复用同槽）")
    // R12 (§18 D-E1a) supersede：explore 缺省已翻 async——原"explore 缺省阻塞（回归）"
    // 断言同批修订为 async:false 显式同步（阻塞路径回归保留）
    const parent2 = asyncParent(port)
    const r2 = String(await subagentTool.execute({ task: "explore job", role: "explore", async: false }, asyncCtx(parent2, cwd)))
    assert.ok(r2.includes("Subagent (explore) completed"), "explore async:false → 阻塞返回报告字符串")
    assert.equal(parent2._asyncSubagents.size, 0, "explore 同步 spawn 未进 async 池")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-E2: async:false 显式覆盖——eng-coder 同步阻塞返回（不进 async 池）", async () => {
  const { server } = oneShotServer("eng-coder delivery done")
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e2-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await unsignedToken("e2e2e2e2-2222-4222-8222-0000000000e2", Date.now() + 24 * 3600 * 1000)
    const parent = engParent(port, token)
    const ctx = { agent: parent, cwd, callbacks: {} }
    const r = String(await subagentTool.execute({ task: "implement per design", role: "eng-coder", designId: "eng", designToken: token, async: false }, ctx))
    assert.ok(r.includes("Subagent (eng-coder) completed"), "async:false → 同步阻塞返回报告")
    assert.equal(parent._asyncSubagents.size, 0, "同步 spawn 不进 async 池")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-E17 (vscode mirror): AUTO+工程 async eng-coder 撞 turn-cap → 自动续跑完整交付、无 partial 截断标记（§15 D-A3 例外——§18 默认 async 交付的 cap 兜底）", async () => {
  // 子代理 turn 上限 = 3（parent.config.agent.subagentTurns）：3 个 read 工具回合后撞
  // cap。手动档 = auto-decline（反例锁 = 下方 T-E17-manual）；AUTO+工程 = 自动 resume（2026-09-02 统一
  // 规则——CLI askContinue: Promise.resolve(Boolean(engineering && autoApprove))；VS Code
  // live AUTO 载体 = ctx.getAuto）。§18 D-E2：协议不调高 100-turn 上限，AUTO 续跑兜底。
  const DELIVERY = "E17 AUTO 续跑交付 —— 完整交付内容：" + "审计 0 偏差 / advisor 全清 / 修正轮 0 轮，终态 clean。".repeat(30)
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const frame = calls.n <= 3
        ? { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "x" }) } }] } }] }
        : { choices: [{ index: 0, finish_reason: "stop", delta: { content: DELIVERY } }] }
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e17-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await unsignedToken("e1e7e1e7-1717-4171-8171-0000000000e7", Date.now() + 24 * 3600 * 1000)
    const parent = {
      _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      config: {
        providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
        agent: { subagentTurns: 3, engineering: true },
      },
      _subIdCounter: 0,
      _touchedFiles: [],
      _engDesignTokens: new Map([["eng", token]]),
      _engDesignToken: token,
      _asyncSubagents: new Map(),
    }
    // AUTO 档（无人值守授权——2026-09-02 统一规则前提）：ctx.getAuto = live AUTO 读法
    // （execute-tools 把 runAgent 的 autoApprove getter 注入每个工具 ctx）
    const ctx = { agent: parent, cwd, callbacks: {}, getAuto: () => true }
    const out = spawnJson(await subagentTool.execute(
      { task: "实现 E17（会撞 cap）", role: "eng-coder", designId: "eng", designToken: token }, // 缺省 async
      ctx,
    ))
    assert.equal(out.status, "running", "T-E17: eng-coder 缺省 async（§18 D-E1/F1）")
    const entry = parent._asyncSubagents.get(1)
    assert.ok(entry && entry.status === "running", "T-E17: async 条目登记")
    await entry.settled
    assert.equal(entry.done, true, "T-E17: 后台交付 settle")
    assert.ok(entry.report.includes("E17 AUTO 续跑交付"), "T-E17: AUTO 档撞 cap 自动续跑 → 完整交付（非 partial）")
    assert.ok(!entry.report.includes("stopped: turn cap reached"), "T-E17: 无 partial 截断标记")
    assert.ok(entry.report.includes("designId: eng"), "T-E17: 交付报告回传 designId（修正轮复用）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-E17-manual (vscode mirror): 工程开 + AUTO 关 async eng-coder 撞 turn-cap → auto-decline partial、零续跑零面板（§15 D-A3 基线——T-E17 AUTO 例外的反例锁）", async () => {
  // 与 T-E17 同构的对照用例：同一 role/token/cap 配置，仅 AUTO 关（getAuto → false）。
  // wallServer(3) 前 3 个请求是 read 墙、第 4 个才应答——若 AUTO 例外误触发续跑，
  // 会发出第 4 个请求（calls.n = 4）；auto-decline 则停在 3（partial 报告）。
  const { server, calls } = wallServer(3)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e17m-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await unsignedToken("e17m0000-1717-4171-8171-0000000000e7", Date.now() + 24 * 3600 * 1000)
    const parent = {
      _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      config: {
        providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
        agent: { subagentTurns: 3, engineering: true },
      },
      _subIdCounter: 0,
      _touchedFiles: [],
      _engDesignTokens: new Map([["eng", token]]),
      _engDesignToken: token,
      _asyncSubagents: new Map(),
    }
    let asks = 0
    // 手动档：AUTO 关。异步子代理绝不弹面板（onQuestion 不得被调）、不续跑、直接 partial
    const ctx = {
      agent: parent, cwd,
      callbacks: { onQuestion: async () => { asks++; return "Continue" } },
      getAuto: () => false,
    }
    const out = spawnJson(await subagentTool.execute(
      { task: "实现 E17m（会撞 cap，手动档）", role: "eng-coder", designId: "eng", designToken: token }, // 缺省 async
      ctx,
    ))
    assert.equal(out.status, "running", "T-E17-manual: eng-coder 缺省 async（§18 D-E1/F1）")
    const entry = parent._asyncSubagents.get(1)
    assert.ok(entry && entry.status === "running", "T-E17-manual: async 条目登记")
    await entry.settled
    assert.equal(entry.done, true, "T-E17-manual: 后台 settle 落报告")
    assert.ok(String(entry.report).includes("stopped: turn cap reached"), "T-E17-manual: 手动档 auto-decline partial 标记")
    assert.equal(calls.n, 3, "T-E17-manual: 零续跑请求（第 4 请求未发出——AUTO 例外未误触发）")
    assert.equal(asks, 0, "T-E17-manual: 异步子代理零面板询问（onQuestion 从未被调）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-E1-loop (§18 code review #1/#3): 真实 agent 循环中 eng-coder 缺省 async 的 spawn 工具结果 = JSON 字符串（模型可见 {id,role,status}——非 [object Object]）", async () => {
  const token = await unsignedToken("e1loop-1111-4111-8111-0000000000e1", Date.now() + 24 * 3600 * 1000)
  const bodies = []
  const parentCalls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      bodies.push(body)
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      // 路由：eng-coder 子代理自己的请求（系统提示词含 engineering-sub 的协议段）→ 直接完成；
      // 父回合 1 → spawn；父回合 2+ → 最终回复。
      if (body.includes("Internal Delivery Protocol")) {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, finish_reason: "stop", delta: { content: "child delivery done" } }] })}\n\n` +
          "data: [DONE]\n\n",
        )
        return
      }
      parentCalls.n++
      if (parentCalls.n === 1) {
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "subagent", arguments: JSON.stringify({ task: "implement per design", role: "eng-coder", designId: "eng", designToken: token }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, finish_reason: "stop", delta: { content: "final" } }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e1loop-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const history = []
    const out = await runAgent(
      { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      cwd, "spawn eng-coder", {}, undefined, true,
      {
        history, fullHistory: [],
        engState: { enabled: true, engDesignToken: token, engDesignTokens: { eng: token } },
      },
    )
    assert.equal(out, "final")
    const toolMsg = history.find((m) => m.role === "tool" && String(m.content ?? "").includes('"role":"eng-coder"'))
    assert.ok(toolMsg, "spawn 工具结果进入历史（agent 循环路径）")
    assert.ok(String(toolMsg.content).includes('"status":"running"'), "模型可见 JSON {id,role,status:running}（非 [object Object]）")
    assert.ok(String(toolMsg.content).includes('"id":1'), "id 可读（status 动作按 id 寻址依赖它——§19）")
    assert.ok(!String(toolMsg.content).includes("[object Object]"), "String(raw) 序列化契约成立")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-E7-resume (§18 code review #2): 审计预算跨 runAgent 段存活（history 载体——同次交付不因 ContinueError 续跑重置机械后备）", async () => {
  const { subagentTool, ENG_AUDIT_SPAWN_LIMIT } = await import("../src/agent-tools/subagent.mjs")
  // 模拟已续跑过一次的 eng-coder 上下文：agent.history 数组承载预算（sink.history 跨 resume 复用）
  const history = []
  history._engAuditSpawns = ENG_AUDIT_SPAWN_LIMIT
  const ctx = engChildCtx(1, process.cwd(), { history })
  await assert.rejects(
    subagentTool.execute({ task: "audit after resume", role: "explore" }, ctx),
    /correction-round limit exceeded — deliver a stalled report/,
    "续跑段继承预算——第 7 次审计 spawn 仍被拒绝（每交付一次预算，非每 runAgent 段）",
  )
})

slow("T-E3: eng-coder 内部 spawn explore 成功——审计节点同步返回报告；任务书机械追加（父任务书 ∪ 实际触碰文件）", async () => {
  const bodies = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      bodies.push(body)
      const audit = body.includes("[Audit scope — mechanical context")
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: audit ? "AUDIT REPORT: clean — no divergence" : "child done" } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        "data: [DONE]\n\n",
      )
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e3-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const touched = join(cwd, "impl-x.mjs")
    const brief = "Docs involved: [docs/design/X.md] acceptance: [AC1, AC2] files: [impl-x.mjs]"
    const ctx = engChildCtx(port, cwd, { _touchedFiles: [touched], _engTaskInput: brief })
    const r = String(await subagentTool.execute({ task: "AUDIT: run the divergence audit", role: "explore" }, ctx))
    assert.ok(r.includes("Subagent (explore) completed"), "内部 explore 审计 spawn 同步返回")
    assert.ok(r.includes("AUDIT REPORT: clean"), "审计报告回传")
    assert.equal(ctx.agent._engAuditSpawns, 1, "审计尝试计数 = 1")
    // 机械任务书：父 spawn 任务书原文 + 实际触碰文件都进了审计子代理的输入（非自述清单）
    const auditBody = bodies.find((b) => b.includes("[Audit scope — mechanical context"))
    assert.ok(auditBody, "审计子代理请求携带机械任务书块")
    assert.ok(auditBody.includes(brief), "父 spawn 任务书 verbatim 注入")
    assert.ok(auditBody.includes(touched.replace(/\\/g, "\\\\")), "实际触碰文件（机械并集）注入")
    // §18.5 T-AG6 (2026-09-04): 审计任务书零 git 范围权威声明——_touchedFiles 为审计范围；
    // 本任务零 git（无 git 上下文注入）；工作区未列于 _touchedFiles 的改动与本任务无关，
    // 不作超清单依据（D-AG3）。
    assert.ok(auditBody.includes("Zero-git scope authority"), "审计任务书含零 git 范围权威声明（D-AG3）")
    assert.ok(auditBody.includes("NOT listed in _touchedFiles"), "非 _touchedFiles 改动不作超清单依据")
    assert.ok(!auditBody.includes("untrusted_git_context"), "审计输入无 git 上下文注入")
    // §18.7 R2 (T-TS4/T-TS6): A1 审计指令模板 + A3 报告格式模板已注入 spawn 输入
    assert.ok(auditBody.includes("AUDIT INSTRUCTIONS (AGENT-LOOP.md §18.7 D-TS4)"), "审计 spawn 输入含 A1 指令模板（T-TS4）")
    assert.ok(auditBody.includes("AUDIT REPORT FORMAT (AGENT-LOOP.md §18.7 D-TS6)"), "审计 spawn 输入含 A3 报告格式模板（T-TS6）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-TS4/5/6: 审计任务书模板三件（A1 指令 / A2 机械摘要 / A3 报告格式）——§18.7 D-TS4/5/6 直接单测", async () => {
  const { auditTaskBook } = await import("../src/agent-tools/subagent-async.mjs")
  const taskInput = [
    "## 涉及文档(先通读再动手——设计为权威规格)",
    "1. docs/design/X.md §1",
    "2. docs/design/Y.md",
    "",
    "## 任务背景",
    "这是一段很长的背景上下文——审计者按需 read 设计文档即可，不应进入审计任务书……",
    "",
    "## 文件清单(唯一授权范围——清单外零触碰)",
    "### 修改",
    "1. src/a.mjs",
    "2. src/b.mjs",
    "",
    "## 验收标准(从设计逐字引用——自验通过再交付)",
    "AC-TS5-1 = 协议句",
    "AC-TS5-2 = 模板句",
    "",
    "## 交付要求",
    "按新协议执行——这是冗长交付指引，与审计对照无关……",
  ].join("\n")
  const agent = { _touchedFiles: ["src/touched.mjs"], _engTaskInput: taskInput }
  const out = auditTaskBook("AUDIT: run the divergence audit", agent, 1)
  // A1（D-TS4）：审计指令模板——四类偏差 + 范围限制 + 校验清单格式
  assert.ok(out.includes("AUDIT INSTRUCTIONS (AGENT-LOOP.md §18.7 D-TS4)"), "A1 指令模板头在")
  for (const cat of ["Partial implementation", "Silent simplification", "Doc drift", "Out-of-file-list changes"]) {
    assert.ok(out.includes(cat), `A1 四类偏差含 ${cat}`)
  }
  assert.ok(out.includes("SCOPE RESTRICTION"), "A1 范围限制段在")
  assert.ok(out.includes("NOT grounds for an out-of-file-list finding"), "A1 范围限制：未列改动不作超清单依据（与 D-AG3 同源）")
  assert.ok(out.includes("file:line + design reference + severity + evidence"), "A1 校验清单格式：文件:行+设计引用+严重级+证据")
  // A2（D-TS5）：机械摘要块——三要素逐字 + 冗长上下文排除
  assert.ok(out.includes("Parent spawn task book — mechanical summary"), "A2 摘要块头在")
  assert.ok(out.includes("## 涉及文档(先通读再动手——设计为权威规格)"), "A2 设计文档路径列表逐字")
  assert.ok(out.includes("docs/design/X.md §1"), "A2 设计文档路径逐字")
  assert.ok(out.includes("## 文件清单(唯一授权范围——清单外零触碰)"), "A2 受影响文件清单逐字")
  assert.ok(out.includes("src/a.mjs") && out.includes("src/b.mjs"), "A2 文件清单逐字（审计范围依据）")
  assert.ok(out.includes("## 验收标准(从设计逐字引用——自验通过再交付)"), "A2 验收标准逐字（审计对照依据）")
  assert.ok(out.includes("AC-TS5-1 = 协议句"), "A2 验收标准逐字")
  assert.ok(!out.includes("## 任务背景") && !out.includes("很长的背景上下文"), "A2 排除冗长背景")
  assert.ok(!out.includes("## 交付要求") && !out.includes("冗长交付指引"), "A2 排除交付指引等上下文")
  // A3（D-TS6）：报告格式模板——三态字段化 + 无偏差语句
  assert.ok(out.includes("AUDIT REPORT FORMAT (AGENT-LOOP.md §18.7 D-TS6)"), "A3 报告格式模板头在")
  assert.ok(out.includes("四类偏差均未发现"), "A3 无偏差语句（CLEAN 态 verbatim）")
  assert.ok(out.includes("| 类别 | 文件:行 | 设计引用 | 严重级 | 证据 |"), "A3 每行字段化格式")
  assert.ok(out.includes("CLEAN") && out.includes("DIVERGENT") && out.includes("QUESTION"), "A3 正常/偏差/问题三态")
  // 独立性不变：_touchedFiles 机械并集仍在
  assert.ok(out.includes("src/touched.mjs"), "_touchedFiles 机械并集保留（D-TS5 独立性）")
  // 无 section 标记的任务书 → 回退全量 verbatim（不丢信息——D-TS5 保守回退）
  const flat = auditTaskBook("AUDIT: run the divergence audit", { _touchedFiles: [], _engTaskInput: "Docs involved: [docs/design/X.md] files: [src/a.mjs] acceptance: [AC1]" }, 1)
  assert.ok(flat.includes("Docs involved: [docs/design/X.md] files: [src/a.mjs] acceptance: [AC1]"), "无标记任务书回退 verbatim（不丢信息）")
  // 非审计 spawn（attempt === null）——任务书原样，无模板注入
  const plain = auditTaskBook("plain explore task", { _touchedFiles: [], _engTaskInput: "x" }, null)
  assert.equal(plain, "plain explore task", "非审计 spawn 不注入审计模板")
})

test("T-A1.2/T-A1.4: 审计预算句（§18.13 D-A1.2——A1/A2 后 A3 前追加 + 零破坏）", async () => {
  const { auditTaskBook } = await import("../src/agent-tools/subagent-async.mjs")
  const out = auditTaskBook("AUDIT: run the divergence audit", { _touchedFiles: ["src/touched.mjs"], _engTaskInput: "x" }, 1)
  // D-A1.2 预算句锚（fail-when-unchanged）
  assert.ok(out.includes("[Audit budget — mechanical]"), "预算句头在")
  assert.ok(out.includes("read ONLY the touched files listed above"), "只读 _touchedFiles 列出的文件")
  assert.ok(out.includes("the design-doc sections the parent task book names"), "只读任务书点名的设计文档节")
  assert.ok(out.includes("Do NOT read whole documents"), "不整读文档")
  assert.ok(out.includes("10 tool rounds max"), "预算 = 10 工具轮上限")
  assert.ok(out.includes("report PROBLEM"), "超预算 → report PROBLEM")
  assert.ok(out.includes("(inconclusive) rather than continuing to explore"), "超预算不继续探索")
  // D-A1.2 定序：A1/A2 之后、A3 之前
  assert.ok(out.indexOf("[Audit budget — mechanical]") > out.indexOf("Zero-git scope authority"), "预算句在 A2（zero-git 范围权威）之后")
  assert.ok(out.indexOf("[Audit budget — mechanical]") < out.indexOf("AUDIT REPORT FORMAT (AGENT-LOOP.md §18.7 D-TS6)"), "预算句在 A3 报告模板之前")
  // D-A1.3 零破坏：既有范围句保留（追加非替换——T-A1.3 回归）
  assert.ok(out.includes("SCOPE RESTRICTION"), "既有范围句保留")
  assert.ok(out.includes("NOT grounds for an out-of-file-list finding"), "既有范围句保留（D-AG3 同源）")
})

slow("T-E4: eng-coder 内部 spawn 非 explore role（plan/eng-coder）→ 工具层拒绝", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = engChildCtx(1, process.cwd())
  for (const role of ["plan", "eng-coder", "coder"]) {
    await assert.rejects(
      subagentTool.execute({ task: "x", role }, ctx),
      /may only spawn role='explore'/,
      `eng-coder 内部 spawn role=${role} 必须拒绝（受限通道仅审计）`,
    )
  }
  // 非 eng-coder 上下文（depth>0 但角色不同）不受限——受限门只对 eng-coder 生效
  const coderChild = { _role: "coder", config: { agent: { engineering: false } } }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "bogus" }, { agent: coderChild, cwd: process.cwd(), depth: 1, callbacks: {} }),
    /Unknown subagent role/,
    "coder 上下文仍走既有角色白名单",
  )
})

slow("T-E5: eng-coder 内部 spawn explore 带 async:true → 拒绝（同步强制——回合等审计报告再决策）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = engChildCtx(1, process.cwd())
  await assert.rejects(
    subagentTool.execute({ task: "audit", role: "explore", async: true }, ctx),
    /sync-only/,
    "eng-coder 内部 explore spawn 强制同步",
  )
  assert.equal(ctx.agent._engAuditSpawns, undefined, "拒绝的 spawn 不计入审计尝试数")
})

slow("T-E7: 收敛上限机械后备——第 7 次审计 spawn 拒绝（5 轮纪律失效时不静默——错误即 stalled 信号）", async () => {
  const { subagentTool, ENG_AUDIT_SPAWN_LIMIT } = await import("../src/agent-tools/subagent.mjs")
  assert.equal(ENG_AUDIT_SPAWN_LIMIT, 6, "预算 = 首审 1 + 修正轮 ≤5 的再审")
  const ctx = engChildCtx(1, process.cwd(), { _engAuditSpawns: ENG_AUDIT_SPAWN_LIMIT })
  await assert.rejects(
    subagentTool.execute({ task: "audit again", role: "explore" }, ctx),
    /correction-round limit exceeded — deliver a stalled report/,
    "第 7 次审计 spawn 被机械拒绝（不静默）",
  )
})

slow("T-E12: 域内写授权——autoApprove=false 会话 spawn eng-coder → 任务域写文件成功、零权限询问（spawn 即授权）", async () => {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      if (calls.n === 1) {
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "write", arguments: JSON.stringify({ path: "impl-x.mjs", content: "v1" }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, finish_reason: "stop", delta: { content: "delivery done" } }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e12-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const token = await unsignedToken("e12e12e1-1111-4111-8111-000000000012", Date.now() + 24 * 3600 * 1000)
    const parent = engParent(port, token)
    let asked = 0
    const ctx = { agent: parent, cwd, callbacks: { onPermissionRequired: async () => { asked++; return true } }, getAuto: () => false }
    const r = String(await subagentTool.execute({ task: "implement per design", role: "eng-coder", designId: "eng", designToken: token, async: false }, ctx))
    assert.ok(r.includes("Subagent (eng-coder) completed"), "交付完成")
    assert.equal(asked, 0, "手动档会话中 eng-coder 写文件零面板（spawn 即授权——任务域内）")
    const written = join(cwd, "impl-x.mjs")
    assert.equal(readFileSync(written, "utf8"), "v1", "任务域内文件写入成功")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-E14: 授权粒度——design-token / planMode 前置门在授权后仍生效（豁免仅限 onPermissionRequest 阶段）", async () => {
  const { executeToolBatches } = await import("../src/agent/execute-tools.mjs")
  const executed = []
  const writeTool = { name: "write", readonly: false, execute: async () => { executed.push(true); return "ok" } }
  const base = {
    _role: "eng-coder", _planMode: false,
    config: { agent: { engineering: true } },
    _touchedFiles: [], _mutatedThisRun: false, _calledAdvisorThisRun: false,
    _verifiedThisRun: false, _verifyPassed: undefined, _advisorRound: 0,
  }
  const history = []
  const run = (agent) => executeToolBatches(agent, {
    response: { toolCalls: [{ id: "1", name: "write", arguments: JSON.stringify({ path: "x.mjs", content: "x" }) }] },
    history, fullHistory: [],
    toolByName: new Map([["write", writeTool]]),
    getAuto: () => true, // AUTO——也不得越过前置门（粒度：非 onPermissionRequest 阶段照常生效）
    callbacks: {}, signal: undefined, cwd: process.cwd(), recentSigs: [], depth: 1,
  })
  const toolContents = () => history.filter((m) => m.role === "tool").map((m) => m.content)
  // design-token 门：评审未过（无授权）→ AUTO 下写仍被拒
  await run({ ...base, _engDesignReviewed: false })
  assert.ok(toolContents().some((c) => c.includes("engineering design gate")), "design-token 门在 AUTO 下仍生效")
  assert.equal(executed.length, 0, "写未执行")
  // planMode 门：授权后 planMode 仍拒写
  await run({ ...base, _engDesignReviewed: true, _planMode: true })
  assert.ok(toolContents().some((c) => c.includes("plan mode active")), "planMode 门照常生效")
  assert.equal(executed.length, 0)
  // 对照：评审通过 + 非 planMode → 写放行（授权语义本身）
  await run({ ...base, _engDesignReviewed: true })
  assert.equal(executed.length, 1, "评审通过后写放行（仅 onPermissionRequest 阶段被豁免）")
})

slow("T-E6: 内部协议闭环 wiring——脚本化 eng-coder runAgent：audit dirty → 自修 → re-audit clean → advisor clean → 报告含轮次与终态", async () => {
  const script = [
    { name: "subagent", arguments: { task: "AUDIT-TASK run the divergence audit", role: "explore" } },
    { name: "write", arguments: { path: "impl-x.mjs", content: "v2 fixed" } },
    { name: "subagent", arguments: { task: "RE-AUDIT-TASK re-audit after the fix", role: "explore" } },
    { name: "advisor", arguments: { type: "code", documents: ["docs/design/X.md"], paths: ["impl-x.mjs"] } },
  ]
  const finalText = "Delivery report: implemented (transparency table) — audit 2 rounds (dirty -> clean) / advisor 1 round clean — terminal state: clean."
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      const step = script[calls.n - 1]
      if (step) {
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: `t${calls.n}`, type: "function", function: { name: step.name, arguments: JSON.stringify(step.arguments) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, finish_reason: "stop", delta: { content: finalText } }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-e6-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const subCalls = []
    const advisorCalls = []
    // 受限审计通道与 advisor 以 stub 替身驱动确定性协议流（真实执行路径已在 T-E3 覆盖）
    const subStub = {
      name: "subagent", readonly: false,
      execute: async (args) => {
        subCalls.push({ role: args.role, task: args.task })
        return args.task.includes("RE-AUDIT")
          ? "AUDIT REPORT: clean — no divergence found."
          : "AUDIT REPORT: dirty — impl-x.mjs misses AC2 (partial implementation)."
      },
    }
    const advisorStub = {
      name: "advisor", readonly: true,
      execute: async (args) => { advisorCalls.push(args); return "Advisor code review: all clear — no findings." },
    }
    const sink = {}
    const out = await runAgent(
      { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      cwd, "IMPLEMENT the design", {}, undefined, true,
      {
        history: [], fullHistory: [], mcpServers: [], skills: [],
        engState: { enabled: true },
        engDesignReviewed: true, // 父 spawn 已验 token——子代理到达即授权（§18 D-E3）
        depth: 1, role: "eng-coder", maxTurns: 20,
        extraTools: [subStub, advisorStub],
        stateSink: sink,
      },
    )
    assert.equal(out, finalText, "协议流程走完 → 收敛交付报告")
    assert.equal(subCalls.length, 2, "两次审计 spawn（初审 + 复审）")
    assert.ok(subCalls.every((c) => c.role === "explore"), "审计 spawn 全部 explore")
    assert.ok(subCalls[0].task.includes("AUDIT-TASK") && subCalls[1].task.includes("RE-AUDIT-TASK"), "dirty 自修后 re-audit")
    assert.equal(advisorCalls.length, 1, "advisor code review 一次（clean 后收敛）")
    assert.equal(advisorCalls[0].type, "code", "内部复评 = type=code")
    assert.ok(advisorCalls[0].paths?.includes("impl-x.mjs"), "复评以实际交付文件为对象")
    const file = join(cwd, "impl-x.mjs")
    assert.equal(readFileSync(file, "utf8"), "v2 fixed", "自修写入落地")
    assert.ok(sink.touchedFiles?.includes(file), "改动并入父侧簿记（mergeChildMutations 数据源）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-E18 (可见性补齐 2026-09-03): eng-coder 子代理内 advisor 长文流转发——runChild onToolPanel 接线 → 顶层 sub:eng-coder#N 频道（kind 原样、无逐 chunk 换行）", async () => {
  // 真实 run wiring 测试：eng-coder 子代理执行**真实** code review——advisor.mjs 经
  // ctx.callbacks.onToolPanel("advisor", chunk) 发射（该 callbacks = runChild 传给
  // runAgent 的参数对象——修复前无 onToolPanel 键 → 静默丢弃）。评审尾部标记
  // VERDICT-MARKER-x7k2 故意跨两个 SSE delta 拆开发送——转发若注入任何分隔符
  // （CLI 式逐 chunk 换行即违禁形态）重组即失败。配置沙箱：子代理 + advisor 的
  // provider 解析全落沙箱 config——真实 ~/.thincoder/config.json 的 provider/advisor
  // 段不得泄漏进 mock server 的回合预算（任何机器上确定性）。
  const { _configPath, _setConfigPathForTest } = await import("../src/config-io.mjs")
  const prevConfigPath = _configPath()
  const cwd = mkdtempSync(join(tmpdir(), "tc-e18-"))
  const cfgPath = join(cwd, "config.json")
  const reviewText = [
    "ADVISOR REVIEW round 1 — full long-form review. The implementation covers every ",
    "acceptance criterion of the design doc. Files under review match the approved ",
    "design; no divergence found in the protocol trace. Final verdict: all clear — VERDICT-MAR",
    "KER-x7k2 complete.",
  ]
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      if (calls.n === 1) {
        // 子代理 turn 1：真实 advisor code review 调用
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "advisor", arguments: JSON.stringify({ type: "code", paths: ["impl-x.mjs"] }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else if (calls.n === 2) {
        // advisor 自身的单发评审（chat-panel T1 形态）：content 分 4 个 delta 流式
        res.end(
          reviewText.map((t) => `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: t } }] })}\n\n`).join("") +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      } else {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "eng-coder delivery done" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  writeFileSync(cfgPath, JSON.stringify({
    providers: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
    activeProvider: "t",
  }), "utf8")
  _setConfigPathForTest(cfgPath)
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    writeFileSync(join(cwd, "impl-x.mjs"), "export const x = 1\n")
    const token = await unsignedToken("e18e18e1-1111-4111-8111-0000000000e1", Date.now() + 24 * 3600 * 1000)
    const parent = engParent(port, token)
    const panels = []
    const ctx = { agent: parent, cwd, callbacks: { onToolPanel: (name, chunk) => panels.push({ name, chunk }) } }
    const r = String(await subagentTool.execute({ task: "implement per design X", role: "eng-coder", designId: "eng", designToken: token, async: false }, ctx))
    assert.ok(r.includes("Subagent (eng-coder) completed"), "子代理回合完成")
    assert.ok(calls.n >= 3, "子代理 2 turn + advisor 1 发 = ≥3 次 LLM 请求")
    const child = panels.filter((p) => p.name === "sub:eng-coder#1")
    assert.ok(child.length > 0, "子代理活动流到达顶层频道")
    assert.equal(child.length, panels.length, "本次 spawn 全部 chunk 同频道（单块不串扰）")
    const textJoin = child.filter((p) => p.chunk.kind === "text").map((p) => p.chunk.text).join("")
    // 修复前红：advisor 评审流在 child ctx 静默丢弃——text 频道只有子代理自己的输出
    assert.ok(textJoin.includes("VERDICT-MARKER-x7k2"),
      "子代理内 advisor 长文（尾部标记跨 delta 拆分）完整进入子代理块频道——原样透传、无注入分隔符")
    assert.ok(textJoin.includes("ADVISOR REVIEW round 1"), "advisor 评审开头同样可见")
    assert.ok(child.some((p) => p.chunk.kind === "think"), "advisor think 占位块透传（kind=think）")
    assert.ok(child.some((p) => p.chunk.kind === "tool"), "工具行照旧（kind=tool）")
    for (const p of child) {
      assert.ok(["text", "think", "tool", "start"].includes(p.chunk.kind), `转发不发明新 kind: ${p.chunk.kind}`)
    }
  } finally {
    _setConfigPathForTest(prevConfigPath)
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})
