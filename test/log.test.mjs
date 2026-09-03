/**
 * log.test.mjs — 诊断事件日志（docs/design/LOGGING.md）T-L1..L10 用例。
 *
 * 隔离纪律（refinement #6）：本文件开头把 THINCODER_LOG_DIR 指向临时目录——log 模块的
 * 测试门（node --test 进程 NODE_TEST_CONTEXT 下默认跳过）经显式 override 放行，所有事件
 * 只落临时目录，不碰真实 ~/.thincoder/logs。node --test 每文件一进程：env 是文件级的，
 * 其他测试文件不带 override → 事件静默跳过（真实日志零污染）。
 *
 * 用例映射：T-L1 回合骨架 / T-L2 工具事件无参数 / T-L3 llm:error 超时 / T-L4 子代理骨架 /
 * T-L5 敏感零落盘 / T-L5b 响应头摘要 / T-L6 行截断 / T-L7+T-L7b 轮转清理 /
 * T-L8 写失败静默 / T-L9 挂起+digest 事件 / T-L10 今日场景链路（T-L8 置尾——写失败 latch）。
 */
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"

process.env.THINCODER_LOG_DIR = mkdtempSync(join(tmpdir(), "tc-log-"))

import { test } from "node:test"
import assert from "node:assert/strict"
import {
  logEvent, logsDir, cleanupOldLogs,
  sanitizeString, errText, classifyErr, headText,
} from "../src/log.mjs"

const cleanups = []
test.after(() => { for (const d of cleanups) rmSync(d, { recursive: true, force: true }) })

/** 切换 THINCODER_LOG_DIR 到新临时目录并注册清理。 */
function freshLogDir() {
  const dir = mkdtempSync(join(tmpdir(), "tc-log-dir-"))
  cleanups.push(dir)
  process.env.THINCODER_LOG_DIR = dir
  return dir
}

/** 读当前日志目录全部 agent-*.log 行（按文件名+行序 JSON.parse）。 */
function readLines(dir = logsDir()) {
  const out = []
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir).filter((n) => n.startsWith("agent-") && n.endsWith(".log")).sort()) {
    for (const line of readFileSync(join(dir, name), "utf8").split("\n")) {
      if (!line.trim()) continue
      out.push(JSON.parse(line))
    }
  }
  return out
}

const evs = (lines) => lines.map((l) => l.ev)

test("T-L5 敏感字段零落盘：字段名黑名单丢弃 + 内容密钥形态截断（负断言）", () => {
  const dir = freshLogDir()
  logEvent("tool:done", { tool: "x", apiKey: "sk-abc123def456", password: "p@ss", token: "tok123" })
  logEvent("llm:done", { head: "ok sk-abc123def456 tail", model: "m" })
  logEvent("llm:error", { err: 'LLM API error 400: {"error":"invalid apiKey=sk-xyz78901234"}' })
  logEvent("llm:done", { head: "plain text, key = abc12345 more", model: "m" })
  const lines = readLines(dir)
  // ① 字段名精确黑名单 → 字段整体不出现
  assert.ok(!("apiKey" in lines[0]) && !("password" in lines[0]) && !("token" in lines[0]), "黑名单字段名零落盘")
  // ② 内容形态 → 截断到形态前
  const raw = readFileSync(join(dir, readdirSync(dir).find((n) => n.endsWith(".log"))), "utf8")
  assert.ok(!raw.includes("sk-abc123def456") && !raw.includes("sk-xyz78901234"), "sk-xxx 形态零落盘")
  assert.ok(!raw.includes("key=sk-xyz78901234"), "key= 形态截断")
  assert.ok(lines[1].head.startsWith("ok ") && !lines[1].head.includes("sk-"), "head 截断到密钥形态前")
  assert.ok(lines[2].err.startsWith("LLM API error 400") && !lines[2].err.includes("xyz78901234"), "err 截断到密钥前")
})

test("T-L5b 响应头摘要：head 首段 ≤300、len 可见空/超短回复", () => {
  const dir = freshLogDir()
  logEvent("llm:done", { head: headText("", 300, { paragraph: true }), len: 0 })
  logEvent("llm:done", { head: headText("hi", 300, { paragraph: true }), len: 2 })
  const longPar = "lineA ".repeat(60) + "\n\n" + "second paragraph ".repeat(50)
  logEvent("llm:done", { head: headText(longPar, 300, { paragraph: true }), len: longPar.length })
  const lines = readLines(dir)
  assert.equal(lines[0].head, "", "空回复 head 为空串（空回复可见——A 盲区覆盖）")
  assert.equal(lines[0].len, 0)
  assert.equal(lines[1].head, "hi")
  assert.equal(lines[2].len, longPar.length)
  assert.ok(lines[2].head.length <= 300 && lines[2].head.endsWith("…"), "长首段 ≤300 截断带标记")
  assert.ok(!lines[2].head.includes("second paragraph"), "只取首段（空行前）")
})

test("T-L6 行截断：超长字段 → 行 <512 且仍可 JSON.parse", () => {
  const dir = freshLogDir()
  const boom = "boom-".repeat(5000)
  logEvent("llm:error", { provider: "p", model: "m", ms: 1, err: boom, head: boom })
  logEvent("tool:done", { tool: "t", head: boom, extra: boom, extra2: boom })
  const lines = readLines(dir)
  for (const l of lines) {
    assert.ok(JSON.stringify(l).length < 512, `行 <512（实际 ${JSON.stringify(l).length}）`)
    if (l.err !== undefined) assert.ok(l.err.length <= 200)
    if (l.head !== undefined) assert.ok(l.head.length <= 300)
  }
})

test("T-L7 轮转清理：>1 天旧日志删除、昨天+当日保留（cleanupOldLogs + 每日首次写触发）", () => {
  const dir = freshLogDir()
  const d = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
  writeFileSync(join(dir, `agent-${d(5)}.log`), "old\n") // 5 天前 → 删
  writeFileSync(join(dir, `agent-${d(2)}.log`), "old2\n") // 前天 → 删
  writeFileSync(join(dir, `agent-${d(1)}.log`), "yesterday\n") // 昨天 → 保留（code review #1：任何事件至少留存 24h）
  writeFileSync(join(dir, "other-file.log"), "keep\n")
  cleanupOldLogs()
  let names = readdirSync(dir)
  assert.ok(!names.includes(`agent-${d(5)}.log`) && !names.includes(`agent-${d(2)}.log`), ">1 天旧文件删除")
  assert.ok(names.includes(`agent-${d(1)}.log`), "昨天文件保留（保留窗口 ≥24h）")
  assert.ok(names.includes("other-file.log"), "非 agent-* 不删")
  // 每日首次写事件触发机会式清理（refinement #3——非仅启动）
  logEvent("turn:start", { kind: "user" })
  names = readdirSync(dir)
  const today = new Date().toISOString().slice(0, 10)
  assert.ok(names.includes(`agent-${today}.log`), "当日文件存在")
  assert.equal(names.filter((n) => n.startsWith("agent-")).length, 2, "清理后剩 当日+昨天 两个文件")
})

test("seq 单调 + ts/ev/seq 齐全（refinement #8 进程内计数）", () => {
  const dir = freshLogDir()
  logEvent("a", { x: 1 })
  logEvent("b", {})
  const lines = readLines(dir)
  assert.equal(lines[0].seq, lines[1].seq - 1)
  assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(lines[0].ts), "ISO 时间戳")
})

test("sanitizeString/errText/classifyErr 单测（截断/分类/标记）", () => {
  assert.equal(sanitizeString("err", "e".repeat(500)).length, 200)
  assert.ok(sanitizeString("err", "e".repeat(500)).endsWith("…"))
  assert.equal(sanitizeString("head", "x".repeat(500)).length, 300)
  assert.equal(sanitizeString("note", "y".repeat(500)).length, 120)
  assert.equal(sanitizeString("note", "before sk-abc123456789 after"), "before ")
  assert.equal(errText({ message: "m1\nm2", cause: { message: "c" } }), "m1 m2 (c)")
  assert.equal(classifyErr(new Error("request timed out after 100ms")), "timeout")
  const abort = new DOMException("aborted", "AbortError")
  assert.equal(classifyErr(abort, { aborted: true, reason: { name: "TimeoutError" } }), "timeout")
  assert.equal(classifyErr(abort, { aborted: true, reason: { interrupt: true } }), "abort")
  assert.equal(classifyErr(new Error("LLM API error 400: bad")), "error")
})

// ─── 集成：真实 runAgent/runAgentTurn + mock SSE LLM（suspension.test.mjs 同款手法）───

const LONG = (tag) => tag + " " + "x".repeat(220) // > MIN_REPORT_CHARS（防扩写轮）

function toolCallDelta(tc, i) {
  return `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: i, id: "call_" + i, function: { name: tc.name, arguments: JSON.stringify(tc.args) } }] } }] })}\n\n`
}

/** SSE 帧：content 完成 或 多个 tool_call。 */
function frames(step) {
  if (step.toolCalls) {
    let out = ""
    for (let i = 0; i < step.toolCalls.length; i++) out += toolCallDelta(step.toolCalls[i], i)
    out += `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n`
    return out + "data: [DONE]\n\n"
  }
  return `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: step.content } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
    "data: [DONE]\n\n"
}

/** 请求序 script server：第 i 个请求取 script[i]（末项兜底）；step.error → HTTP 400。 */
async function scriptServer(script) {
  let i = 0
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", async () => {
      const step = script[Math.min(i++, script.length - 1)]
      if (step.delay) await new Promise((r) => setTimeout(r, step.delay))
      if (step.error) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: { message: "mock provider failure" } }))
        return
      }
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames(step))
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return { server, port: server.address().port }
}

/** 永不响应的 server（只测 abort/timeout 路径）。 */
async function hangServer() {
  const server = createServer(() => { /* 不响应 */ })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return { server, port: server.address().port }
}

/** driver ctx（agent-turn.test.mjs / suspension.test.mjs 同款字段集）。 */
function turnCtx(agent, overrides = {}) {
  const state = {
    lines: [], streaming: "", reasoning: "",
    subTasks: {}, toolStreams: {}, outputPanels: {},
    tasks: [], queue: [], pendingInput: [],
    processing: false, controller: null, interruptPrompt: null,
    permission: null, currentTool: null, processingStarted: 0,
    status: "Ready", suspended: false, _suspAborted: false,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  }
  const ctx = {
    agent, state,
    calls: { runAgent: [], saved: 0 },
    lines: [],
    pushLine: (text, color, kind) => state.lines.push({ text, color, _kind: kind }),
    pushLabel: (text) => state.lines.push({ kind: "label", text }),
    render: () => {},
    scheduleRender: () => {},
    ensureAssistantLabel: () => {},
    askPermission: async () => true,
    askBatchPermission: async () => "approveAll",
    askQuestion: async () => "",
    handleSlash: async () => {},
    summarize: () => "",
    saveSession: () => { ctx.calls.saved++ },
    ...overrides,
  }
  return ctx
}

async function realAgent(port, cwd) {
  const { createAgent } = await import("../src/agent.mjs")
  return createAgent({
    provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
    tools: [],
    config: {},
    cwd,
    title: "test", // 跳过 ensureSessionTitle（generate-title 直连 fetch，非 chat——不入 llm 事件）
  })
}

test("T-L1 正常回合骨架：turn:start → llm:start → llm:done → turn:end（真实 runAgentTurn）", async () => {
  const dir = freshLogDir()
  const cwd = mkdtempSync(join(tmpdir(), "tc-log-l1-"))
  cleanups.push(cwd)
  const { server, port } = await scriptServer([{ content: "回答完毕" }])
  try {
    const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
    const agent = await realAgent(port, cwd)
    const ctx = turnCtx(agent)
    await runAgentTurn(ctx, "你好")
    const lines = readLines(dir)
    const ev = evs(lines)
    const start = ev.indexOf("turn:start")
    const llmStart = ev.indexOf("llm:start")
    const llmDone = ev.indexOf("llm:done")
    const end = ev.lastIndexOf("turn:end")
    assert.ok(start >= 0 && end > start, "turn:start/turn:end 存在")
    assert.ok(llmStart > start && llmDone > llmStart && end > llmDone, "顺序 turn:start < llm:start < llm:done < turn:end")
    assert.equal(lines[start].kind, "user")
    assert.equal(lines[end].result, "ok")
    assert.ok(lines[end].ms >= 0)
    assert.equal(lines[llmStart].stage, "turn")
    assert.equal(lines[llmStart].turn, 1)
    assert.equal(lines[llmDone].head, "回答完毕", "响应头摘要落盘")
    assert.ok(!lines.some((l) => l.ev === "llm:error"), "无错误事件")
  } finally {
    server.close()
  }
})

test("T-L2 工具事件无参数值：tool:call/tool:done 不带 args/path + 结果头黑名单", async () => {
  const dir = freshLogDir()
  const cwd = mkdtempSync(join(tmpdir(), "tc-log-l2-"))
  cleanups.push(cwd)
  const { server, port } = await scriptServer([
    { toolCalls: [{ name: "read", args: { path: "/secret/config.json", apiKey: "sk-abc123def456" } }] },
    { content: "完成" },
  ])
  try {
    const { createAgent, runAgent } = await import("../src/agent.mjs")
    const sampleTool = {
      name: "read", description: "read a file", readonly: true, parallel: true,
      parameters: { type: "object", properties: {} },
      execute: async () => "content-sk-zzz999888777 tail",
    }
    const agent = await createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [sampleTool], config: {}, cwd, title: "test",
    })
    await runAgent(agent, "读文件", {})
    const lines = readLines(dir)
    const call = lines.filter((l) => l.ev === "tool:call")
    const done = lines.filter((l) => l.ev === "tool:done")
    assert.equal(call.length, 1)
    assert.ok(done.length >= 1)
    const raw = readFileSync(join(dir, readdirSync(dir).find((n) => n.endsWith(".log"))), "utf8")
    assert.ok(!raw.includes('"path"'), "参数值零落盘（无 path 字段）")
    assert.ok(!raw.includes("apiKey"), "参数值零落盘（无 apiKey 字段）")
    assert.ok(!raw.includes("sk-abc123def456") && !raw.includes("sk-zzz999888777"), "结果头密钥形态截断（T-L5 工具侧负断言）")
    assert.equal(call[0].tool, "read")
    assert.equal(call[0].head, undefined)
    assert.ok(done[0].head.startsWith("content-"), "工具结果头 ≤200 落盘")
  } finally {
    server.close()
  }
})

test("T-L3 llm:error：kind=timeout + err ≤200（AbortSignal.timeout 真实中止）", async () => {
  const dir = freshLogDir()
  const { chat } = await import("../src/provider/index.mjs")
  const { server, port } = await hangServer()
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m", name: "mock" }
    await assert.rejects(
      () => chat(provider, { messages: [{ role: "user", content: "hi" }], signal: AbortSignal.timeout(300) }),
      (e) => e?.name === "AbortError",
    )
    const lines = readLines(dir)
    const err = lines.find((l) => l.ev === "llm:error")
    assert.ok(err, "llm:error 存在")
    assert.equal(err.kind, "timeout")
    assert.ok(err.err.length <= 200)
    assert.ok(lines.some((l) => l.ev === "llm:start"), "llm:start 先行")
  } finally {
    server.close()
  }
})

test("T-L4 子代理骨架：阻塞 spawn → child:spawn/child:done + childId（子内 llm 事件归属）", async () => {
  const dir = freshLogDir()
  const cwd = mkdtempSync(join(tmpdir(), "tc-log-l4-"))
  cleanups.push(cwd)
  const { server, port } = await scriptServer([
    { toolCalls: [{ name: "subagent", args: { task: "探索一下", role: "explore", async: false } }] },
    { content: LONG("explore 报告") },
    { content: "父收尾" },
  ])
  try {
    const { createAgent, runAgent } = await import("../src/agent.mjs")
    const agent = await createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: {}, cwd, title: "test",
    })
    const out = await runAgent(agent, "派个 explore", { onPermissionRequest: async () => true })
    assert.ok(String(out).length > 0)
    const lines = readLines(dir)
    const spawn = lines.find((l) => l.ev === "child:spawn")
    const done = lines.find((l) => l.ev === "child:done")
    assert.ok(spawn, "child:spawn 存在")
    assert.equal(spawn.role, "explore")
    assert.ok(/^explore#\d+$/.test(spawn.id ?? ""), `childId 形如 explore#N（${spawn.id}）`)
    assert.equal(spawn.kind, "blocking")
    assert.ok(done && done.id === spawn.id, "child:done 同 id")
    assert.equal(done.kind, "ok")
    assert.ok(done.ms >= 0)
    // 子代理内部 llm 事件带 child 归属（单文件全记、按 childId grep——§2.4）
    const childLlm = lines.find((l) => l.ev === "llm:done" && l.child === spawn.id)
    assert.ok(childLlm, "子内 llm:done 带 child 字段")
  } finally {
    server.close()
  }
})

test("T-L9 挂起会话 + digest 事件（driver 级：mock settle 驱动状态机）", async () => {
  const dir = freshLogDir()
  const cwd = mkdtempSync(join(tmpdir(), "tc-log-l9-"))
  cleanups.push(cwd)
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const agent = {
    cwd, title: "test", history: [], config: {}, tasks: [], tools: [],
    provider: { model: "test-model" },
  }
  const calls = { runAgent: [] }
  const ctx = turnCtx(agent, {
    calls,
    runAgent: async (_a, text, _cbs, opts) => {
      calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) {
          agent.history.push({ role: "user", content: `[System reminder: async subagent #${e.id} finished]\n${e.report ?? e.error ?? ""}` })
        }
      }
      return "ok"
    },
  })
  // 造一个 running 假条目（池 live → 回合尾进挂起会话）
  agent._asyncSubagents = new Map()
  agent._asyncQueue = []
  let settleFn
  const entry = {
    id: "7", role: "coder", relayPrefix: "coder#7/",
    status: "running", report: null, error: null, done: false,
    promise: new Promise((r) => { settleFn = r }),
    _settle: () => settleFn(),
  }
  agent._asyncSubagents.set("7", entry)
  const turnP = runAgentTurn(ctx, "带后台的回合")
  const t0 = Date.now()
  while (!agent._sessionAbort && Date.now() - t0 < 5000) await new Promise((r) => setTimeout(r, 10))
  assert.ok(agent._sessionAbort, "挂起会话已建立")
  // 模拟真实 settle：done + 唤醒 waiters + resolve
  entry.report = "后台报告完成"
  entry.status = "done"
  entry.done = true
  for (const w of (agent._asyncWaiters ?? []).splice(0)) { try { w() } catch { /* noop */ } }
  settleFn()
  await turnP
  const lines = readLines(dir)
  const ev = evs(lines)
  const enter = ev.indexOf("susp:enter")
  const exit = ev.lastIndexOf("susp:exit")
  const dStart = ev.indexOf("digest:start")
  const dEnd = ev.indexOf("digest:end")
  assert.ok(enter >= 0 && exit > enter, "susp:enter/susp:exit")
  assert.equal(lines[enter].pendingN, 0)
  assert.ok(dStart > enter && dEnd > dStart && exit > dEnd, "susp:enter < digest:start < digest:end < susp:exit")
  assert.ok(calls.runAgent.some((r) => r.autoTurn), "digest 以 autoTurn 执行")
})

test("T-L10 今日场景复现链路：4 并行 async spawn → child:done×4 → 消化轮 llm:error（断点定位）", async () => {
  const dir = freshLogDir()
  const cwd = mkdtempSync(join(tmpdir(), "tc-log-l10-"))
  cleanups.push(cwd)
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const { createAgent } = await import("../src/agent.mjs")
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", async () => {
      const b = body
      let step
      // 消化轮先于 后台任务N 路由——digest 请求体含父回合的 spawn tool_call 参数
      //（后台任务N 也在其中）——顺序错会把 digest 误路由成子代理内容请求
      if (b.includes("auto-turn") && b.includes("finished while there was no user")) step = { error: true } // 消化轮 → LLM 400
      else if (b.includes("后台任务1")) step = { content: LONG("子代理1完成"), delay: 500 }
      else if (b.includes("后台任务2")) step = { content: LONG("子代理2完成"), delay: 500 }
      else if (b.includes("后台任务3")) step = { content: LONG("子代理3完成"), delay: 500 }
      else if (b.includes("后台任务4")) step = { content: LONG("子代理4完成"), delay: 500 }
      else if (b.includes("派活")) {
        step = {
          toolCalls: [
            { name: "subagent", args: { task: "后台任务1", role: "explore", async: true } },
            { name: "subagent", args: { task: "后台任务2", role: "explore", async: true } },
            { name: "subagent", args: { task: "后台任务3", role: "explore", async: true } },
            { name: "subagent", args: { task: "后台任务4", role: "explore", async: true } },
          ],
        }
      } else step = { content: "主会话收尾" }
      if (step.error) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: { message: "digest provider failure" } }))
        return
      }
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames(step))
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const agent = await createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: {}, cwd, title: "test",
    })
    const ctx = turnCtx(agent)
    await runAgentTurn(ctx, "派活")
    const lines = readLines(dir)
    const ev = evs(lines)
    const toolCalls = lines.filter((l) => l.ev === "tool:call" && l.tool === "subagent")
    assert.equal(toolCalls.length, 4, "tool:call ×4（并行 spawn）")
    const spawns = lines.filter((l) => l.ev === "child:spawn")
    assert.equal(spawns.length, 4, "child:spawn ×4")
    assert.ok(spawns.every((s) => s.kind === "async"), "async spawn")
    const dones = lines.filter((l) => l.ev === "child:done")
    assert.equal(dones.length, 4, "child:done ×4")
    assert.ok(dones.every((d) => d.kind === "ok"))
    const settled = lines.filter((l) => l.ev === "ev:settled")
    assert.equal(settled.length, 4, "挂起期 settle → ev:settled ×4（awaiting digestion）")
    const dStart = ev.indexOf("digest:start")
    const errI = ev.indexOf("llm:error")
    const dEnd = ev.indexOf("digest:end")
    assert.ok(dStart >= 0 && errI > dStart && dEnd > errI, "digest:start < llm:error < digest:end")
    const suspEnter = ev.indexOf("susp:enter")
    const suspExit = ev.lastIndexOf("susp:exit")
    assert.ok(suspEnter >= 0 && suspExit > suspEnter, "挂起会话进出")
    const lastChildDone = ev.lastIndexOf("child:done")
    assert.ok(errI > lastChildDone, "llm:error 位于全部 child:done 之后——消化轮崩溃断点可定位")
    assert.equal(lines[errI].kind, "error")
    assert.ok(String(lines[errI].err).includes("400"), "错误消息可见（消化轮 LLM 失败实锤）")
    const autoTurns = lines.filter((l) => l.ev === "turn:end" && l.kind === "auto")
    assert.ok(autoTurns.some((t) => t.result === "error"), "消化轮 turn:end result=error")
    for (const s of spawns) assert.ok(dones.some((d) => d.id === s.id), `child:done 与 spawn 同 id（${s.id}）`)
  } finally {
    server.close()
  }
})

test("T-L8 写失败静默（NF-L1）：目录不可创建 → 事件静默、主流程零异常（置尾——latch）", () => {
  const parent = mkdtempSync(join(tmpdir(), "tc-log-ro-"))
  cleanups.push(parent)
  const blocker = join(parent, "blocker")
  writeFileSync(blocker, "I am a file, not a dir")
  // 跨平台注入（refinement #6——Windows 只读属性不阻止创建）：父路径是文件 → mkdir 必败
  process.env.THINCODER_LOG_DIR = join(blocker, "logs")
  let threw = null
  try {
    logEvent("turn:start", { kind: "user" })
    logEvent("llm:done", { provider: "p", ms: 1 })
  } catch (e) {
    threw = e
  }
  assert.equal(threw, null, "logEvent 不抛（失败静默）")
  assert.ok(!existsSync(join(blocker, "logs")), "无日志产生")
})
