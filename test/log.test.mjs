/**
 * log.test.mjs（VS Code 镜像）— 诊断事件日志（docs/design/LOGGING.md）T-L1..L10 镜像用例。
 *
 * AC-L4：两端同事件面——本文件与 thincoder/test/log.test.mjs 镜像（同 log 模块语义 +
 * 本端事件点：provider.mjs chat / agent.mjs / execute-tools / subagent 族 / suspension）。
 * 隔离纪律同 CLI：THINCODER_LOG_DIR 指向临时目录（NODE_TEST_CONTEXT 门 + override 放行）。
 *
 * 覆盖：单元（T-L5/5b/6/7/8——模块语义与 CLI 完全同构）、runAgent 级（T-L1 llm 回合事件、
 * T-L3 超时错误、T-L4 子代理骨架）、驱动级（T-L9 挂起/digest 事件镜像——suspensionSession +
 * mock runTurn——suspension.test.mjs 同款 harness）。
 */
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"

process.env.THINCODER_LOG_DIR = mkdtempSync(join(tmpdir(), "tc-vsc-log-"))

import { test } from "node:test"
import assert from "node:assert/strict"
import {
  logEvent, logsDir, cleanupOldLogs,
  sanitizeString, errText, classifyErr, headText,
} from "../src/log.mjs"

const cleanups = []
test.after(() => { for (const d of cleanups) rmSync(d, { recursive: true, force: true }) })

function freshLogDir() {
  const dir = mkdtempSync(join(tmpdir(), "tc-vsc-log-dir-"))
  cleanups.push(dir)
  process.env.THINCODER_LOG_DIR = dir
  return dir
}

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

// ─── 单元（log 模块与 CLI 同构——语义复锁）────────────────────────────────

test("T-L5 敏感字段零落盘：字段名黑名单丢弃 + 内容密钥形态截断（负断言）", () => {
  const dir = freshLogDir()
  logEvent("tool:done", { tool: "x", apiKey: "sk-abc123def456", password: "p@ss", token: "tok123" })
  logEvent("llm:done", { head: "ok sk-abc123def456 tail", model: "m" })
  logEvent("llm:error", { err: 'LLM API error 400: {"error":"invalid apiKey=sk-xyz78901234"}' })
  const lines = readLines(dir)
  assert.ok(!("apiKey" in lines[0]) && !("password" in lines[0]) && !("token" in lines[0]), "黑名单字段名零落盘")
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
  const lines = readLines(dir)
  assert.equal(lines[0].head, "")
  assert.equal(lines[0].len, 0)
  assert.equal(lines[1].head, "hi")
})

test("T-L6 行截断：超长字段 → 行 <512 且仍可 JSON.parse", () => {
  const dir = freshLogDir()
  const boom = "boom-".repeat(5000)
  logEvent("llm:error", { provider: "p", model: "m", ms: 1, err: boom, head: boom })
  logEvent("tool:done", { tool: "t", head: boom, extra: boom, extra2: boom })
  for (const l of readLines(dir)) {
    assert.ok(JSON.stringify(l).length < 512)
    if (l.err !== undefined) assert.ok(l.err.length <= 200)
    if (l.head !== undefined) assert.ok(l.head.length <= 300)
  }
})

test("T-L7 轮转清理：>1 天旧日志删除、昨天+当日保留（cleanupOldLogs + 每日首次写触发）", () => {
  const dir = freshLogDir()
  const d = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
  writeFileSync(join(dir, `agent-${d(5)}.log`), "old1\n")
  writeFileSync(join(dir, `agent-${d(1)}.log`), "yesterday\n")
  writeFileSync(join(dir, "other-file.log"), "keep\n")
  cleanupOldLogs()
  assert.ok(!readdirSync(dir).includes(`agent-${d(5)}.log`), ">1 天旧文件删除")
  assert.ok(readdirSync(dir).includes(`agent-${d(1)}.log`), "昨天文件保留（保留窗口 ≥24h）")
  assert.ok(readdirSync(dir).includes("other-file.log"), "非 agent-* 不删")
  logEvent("turn:start", { kind: "user" })
  const today = new Date().toISOString().slice(0, 10)
  const names = readdirSync(dir)
  assert.ok(names.includes(`agent-${today}.log`), "当日文件存在")
  assert.equal(names.filter((n) => n.startsWith("agent-")).length, 2, "清理后剩 当日+昨天 两个文件")
})

test("seq 单调 + ts/ev/seq 齐全", () => {
  const dir = freshLogDir()
  logEvent("a", { x: 1 })
  logEvent("b", {})
  const lines = readLines(dir)
  assert.equal(lines[0].seq, lines[1].seq - 1)
  assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(lines[0].ts))
})

test("sanitizeString/errText/classifyErr 单测", () => {
  assert.equal(sanitizeString("err", "e".repeat(500)).length, 200)
  assert.equal(sanitizeString("head", "x".repeat(500)).length, 300)
  assert.equal(sanitizeString("note", "before sk-abc123456789 after"), "before ")
  assert.equal(classifyErr(new Error("request timed out after 100ms")), "timeout")
  const abort = new DOMException("aborted", "AbortError")
  assert.equal(classifyErr(abort, { aborted: true, reason: { name: "TimeoutError" } }), "timeout")
  assert.equal(classifyErr(abort, { aborted: true, reason: { interrupt: true } }), "abort")
})

// ─── 集成：真实 runAgent + mock SSE（suspension.test.mjs 同款 harness）────────

const LONG_REPORT = (tag) => `${tag} report ` + "x".repeat(200)

function textFrames(content) {
  return (
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
    "data: [DONE]\n\n"
  )
}

function toolCallFrames(name, args) {
  return (
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name, arguments: JSON.stringify(args) } }] } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
    "data: [DONE]\n\n"
  )
}

async function routeServer(routes) {
  const calls = []
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", () => {
      calls.push(bodyText)
      const route = routes.find((r) => r.when(bodyText, calls))
      const frames = route?.frames ?? textFrames("fallback reply")
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      if (route?.delayMs) setTimeout(() => res.end(frames), route.delayMs)
      else res.end(frames)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return { server, port: server.address().port, calls }
}

const waitFor = async (fn, timeoutMs = 5000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > timeoutMs) throw new Error("waitFor timeout")
    await new Promise((r) => setTimeout(r, 10))
  }
}

test("T-L1 llm 回合事件：runAgent 主循环 → llm:start(stage=turn)/llm:done 带头摘要（auto digest 轮 auto=true）", async () => {
  const dir = freshLogDir()
  const cwd = mkdtempSync(join(tmpdir(), "tc-vsc-log-l1-"))
  cleanups.push(cwd)
  const { server, port } = await routeServer([
    { when: (b) => b.includes("digest marker"), frames: textFrames("digest ok") },
  ])
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const provider = { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }
    const history = []
    const fullHistory = []
    const out1 = await runAgent(provider, cwd, "第一个问题", {}, undefined, true, { history, fullHistory })
    assert.ok(String(out1).length > 0)
    // auto-turn（消化轮——D-S6 语义：pending 预置 + autoTurn 标志）
    history._pendingAsyncResults = [{ id: "1", role: "coder", report: LONG_REPORT("消化物") }]
    await runAgent(provider, cwd, "", {}, undefined, true, { history, fullHistory, autoTurn: true })
    const lines = readLines(dir)
    const start = lines.find((l) => l.ev === "llm:start" && l.turn === 1)
    assert.ok(start, "llm:start 存在（stage=turn）")
    assert.equal(start.stage, "turn")
    assert.equal(start.provider, "t")
    const done = lines.find((l) => l.ev === "llm:done" && l.head && l.ms >= 0)
    assert.ok(done, "llm:done 带头摘要 + ms")
    const autoLlm = lines.find((l) => l.ev === "llm:start" && l.auto === true)
    assert.ok(autoLlm, "auto-turn（消化轮）llm 事件 auto=true")
    assert.ok(!lines.some((l) => l.ev === "llm:error"), "无错误事件")
  } finally {
    server.close()
  }
})

test("T-L3 llm:error：kind=timeout + err ≤200（AbortSignal.timeout）", async () => {
  const dir = freshLogDir()
  const { chat } = await import("../src/provider.mjs")
  const server = createServer(() => { /* 永不响应 */ })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const provider = { name: "t", baseURL: `http://127.0.0.1:${server.address().port}`, apiKey: "k", model: "deepseek-v4-pro" }
    await assert.rejects(
      () => chat(provider, { messages: [{ role: "user", content: "hi" }], signal: AbortSignal.timeout(300) }),
      (e) => e?.name === "AbortError",
    )
    const lines = readLines(dir)
    const err = lines.find((l) => l.ev === "llm:error")
    assert.ok(err, "llm:error 存在")
    assert.equal(err.kind, "timeout")
    assert.ok(err.err.length <= 200)
  } finally {
    server.close()
  }
})

test("T-L4 子代理骨架：runAgent 内阻塞 spawn → child:spawn/child:done + childId", async () => {
  const dir = freshLogDir()
  const cwd = mkdtempSync(join(tmpdir(), "tc-vsc-log-l4-"))
  cleanups.push(cwd)
  let parentCalls = 0
  const { server, port } = await routeServer([
    {
      when: (b, calls) => {
        const isParent = !b.includes("探索一下")
        if (isParent) parentCalls++
        return isParent && parentCalls === 1
      },
      frames: toolCallFrames("subagent", { task: "探索一下", role: "explore", async: false }),
    },
    { when: (b) => b.includes("探索一下"), frames: textFrames(LONG_REPORT("explore 报告")) },
  ])
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const provider = { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }
    const history = []
    const fullHistory = []
    const out = await runAgent(provider, cwd, "派个 explore", {}, undefined, true, { history, fullHistory })
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
    // 子代理内部 llm 事件带 role 归属（vscode agent 对象 per-run——role/depth 归属）
    const childLlm = lines.find((l) => l.ev === "llm:done" && l.role === "explore")
    assert.ok(childLlm, "子内 llm:done 带 role=explore（子代理归属）")
    const toolCall = lines.find((l) => l.ev === "tool:call")
    assert.ok(toolCall && toolCall.tool === "subagent", "tool:call（subagent）存在")
  } finally {
    server.close()
  }
})

test("T-L9 挂起会话 + digest 事件（驱动级镜像——suspensionSession + mock runTurn）", async () => {
  const dir = freshLogDir()
  const cwd = mkdtempSync(join(tmpdir(), "tc-vsc-log-l9-"))
  cleanups.push(cwd)
  const { suspensionSession } = await import("../src/extension/suspension.mjs")
  const history = []
  const fullHistory = []
  const calls = []
  const consumed = { n: 0 }
  const posts = []
  const panel = {
    _panel: { webview: { postMessage: (m) => posts.push(m) } },
    _abortController: new AbortController(),
    _susp: null,
    _suspWake: null,
    _saveLines: () => {},
    _refreshStatus: () => {},
  }
  const entry = {
    turnSlot: 1,
    distillSlot: 1,
    lines: { history, fullHistory },
    engState: {},
    cwd,
    runTurn: async ({ text = "", autoTurn = false } = {}) => {
      calls.push({ text, autoTurn, suspended: history._suspended })
      history._pendingAsyncResults = [] // digest 消费（run-start 注入镜像）
    },
  }
  history._asyncSubagents = new Map()
  const child = { id: 7, role: "coder", status: "running", report: null, error: null, done: false }
  history._asyncSubagents.set(7, child)
  const sessionP = suspensionSession(panel, entry)
  await waitFor(() => panel._suspWake != null, 5000)
  // settle → pending 移交（挂起中）+ 唤醒 driver
  child.report = "后台报告完成"
  child.status = "done"
  child.done = true
  history._suspended = true
  const pend = (history._pendingAsyncResults = [])
  pend.push(child)
  history._asyncSubagents.delete(7)
  panel._suspWake()
  await sessionP
  const lines = readLines(dir)
  const ev = evs(lines)
  const enter = ev.indexOf("susp:enter")
  const exit = ev.lastIndexOf("susp:exit")
  const dStart = ev.indexOf("digest:start")
  const dEnd = ev.indexOf("digest:end")
  assert.ok(enter >= 0 && exit > enter, "susp:enter/susp:exit")
  assert.ok(dStart > enter && dEnd > dStart && exit > dEnd, "susp:enter < digest:start < digest:end < susp:exit")
  assert.ok(calls.some((r) => r.autoTurn), "digest 以 autoTurn 执行")
  assert.equal(lines[enter].pendingN, 0)
})

test("T-L8 写失败静默（NF-L1）：目录不可创建 → 事件静默（置尾——latch）", () => {
  const parent = mkdtempSync(join(tmpdir(), "tc-vsc-log-ro-"))
  cleanups.push(parent)
  const blocker = join(parent, "blocker")
  writeFileSync(blocker, "I am a file, not a dir")
  process.env.THINCODER_LOG_DIR = join(blocker, "logs")
  let threw = null
  try {
    logEvent("turn:start", { kind: "user" })
  } catch (e) {
    threw = e
  }
  assert.equal(threw, null, "logEvent 不抛（失败静默）")
  assert.ok(!existsSync(join(blocker, "logs")), "无日志产生")
})
