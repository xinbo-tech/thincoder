/**
 * abort-e2e.test.mjs — end-to-end Stop tests against a REAL HTTP server.
 * User report: "点 Stop 后还有多段思考输出和多次工具调用，都没停".
 * Root cause found: the SSE read loops never watched the abort signal (CLI
 * sse.mjs does, VS Code transports did not) — a Stop mid-stream did nothing.
 */
import test from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { createServer } from "node:http"

/** Real server streaming one SSE chunk every intervalMs, totalChunks total. */
function slowSSEServer(totalChunks, intervalMs) {
  const server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/event-stream" })
    let sent = 0
    const timer = setInterval(() => {
      sent++
      if (sent > totalChunks) {
        clearInterval(timer)
        res.write("data: [DONE]\n\n")
        res.end()
        return
      }
      res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "token-" + sent + " " } }] })}\n\n`)
    }, intervalMs)
    req.on("close", () => clearInterval(timer))
  })
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }))
  })
}

slow("mid-stream Stop halts the agent fast (real server, real fetch)", async () => {
  const { server, port } = await slowSSEServer(100, 150)
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const ctrl = new AbortController()
    const tokens = []
    const t0 = Date.now()
    const p = runAgent(
      { baseURL: `http://127.0.0.1:${port}/v1`, apiKey: "k", model: "deepseek-v4-pro" },
      "D:/x", "hi",
      { onToken: (t) => tokens.push(t), onReasoning: () => {} },
      ctrl.signal, true,
      { history: [], fullHistory: [], mcpServers: [], skills: [], injections: [] },
    )
    setTimeout(() => ctrl.abort(), 500)
    await assert.rejects(p, (e) => e.name === "AbortError", "must reject with AbortError")
    const elapsed = Date.now() - t0
    assert.ok(elapsed < 2000, `Stop must halt within ~2s, took ${elapsed}ms`)
    assert.ok(tokens.length < 100, `must NOT drain the whole stream (got ${tokens.length} chunks)`)
  } finally {
    server.close()
  }
})

slow("Stop interrupts a SILENT stream (no chunks — undici may not reject the body)", async () => {
  // A server that responds with headers but never sends data — the read loop
  // hangs in for-await. The abort race must break it out.
  const server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/event-stream" })
    // never write anything, never end
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const ctrl = new AbortController()
    const t0 = Date.now()
    const p = runAgent(
      { baseURL: `http://127.0.0.1:${server.address().port}/v1`, apiKey: "k", model: "deepseek-v4-pro" },
      "D:/x", "hi",
      { onToken: () => {}, onReasoning: () => {} },
      ctrl.signal, true,
      { history: [], fullHistory: [], mcpServers: [], skills: [], injections: [] },
    )
    setTimeout(() => ctrl.abort(), 500)
    await assert.rejects(p, (e) => e.name === "AbortError")
    assert.ok(Date.now() - t0 < 2000, `silent stream must break on Stop, took ${Date.now() - t0}ms`)
  } finally {
    server.close()
  }
})

test("abort during tool execution stops before the next LLM round", async () => {
  const orig = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls++
    if (calls === 1) {
      const tc = { index: 0, id: "t1", function: { name: "bash", arguments: JSON.stringify({ command: "echo hi" }) } }
      const body = new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [tc] } }] })}\n\n`))
          c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n`))
          c.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
          c.close()
        },
      })
      return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } })
    }
    throw new Error("second LLM call happened — abort was not honored")
  }
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const ctrl = new AbortController()
    const { bashTool } = await import("../src/tools/shell.mjs")
    const origExec = bashTool.execute
    bashTool.execute = async () => {
      ctrl.abort()  // user clicks Stop during tool execution
      await new Promise((r) => setTimeout(r, 50))
      return "done"
    }
    try {
      const p = runAgent(
        { baseURL: "https://api.test/v1", apiKey: "k", model: "deepseek-v4-pro" },
        "D:/x", "hi",
        { onToken: () => {}, onReasoning: () => {}, onToolCall: () => {}, onToolResult: () => {} },
        ctrl.signal, true,
        { history: [], fullHistory: [], mcpServers: [], skills: [], injections: [] },
      )
      await assert.rejects(p, (e) => e.name === "AbortError")
      await new Promise((r) => setTimeout(r, 100))
      assert.equal(calls, 1, "no second LLM call after abort during tool execution")
    } finally {
      bashTool.execute = origExec
    }
  } finally {
    globalThis.fetch = orig
  }
})

test("bash: abort kills a long-running command (Stop works mid-command)", async () => {
  const { bashTool } = await import("../src/tools/shell.mjs")
  const ctrl = new AbortController()
  const start = Date.now()
  setTimeout(() => ctrl.abort(), 150)
  const r = await bashTool.execute(
    { command: "node -e \"setTimeout(()=>{},60000)\"", timeout: 90000 },
    { cwd: process.cwd(), signal: ctrl.signal },
  )
  const elapsed = Date.now() - start
  assert.match(r, /stopped|killed/, "aborted command: " + r.slice(0, 120))
  assert.ok(elapsed < 10000, `aborted fast, did not wait 60s (${elapsed}ms)`)
})

test("executeToolBatches rethrows AbortError from a tool (Stop propagates, not swallowed as a tool error)", async () => {
  const { executeToolBatches } = await import("../src/agent/execute-tools.mjs")
  const ctrl = new AbortController()
  // A tool whose execute throws AbortError mid-run (e.g. fetch/websearch on abort).
  const throwingTool = {
    name: "fetch", readonly: true,
    async execute() { ctrl.abort(); throw new DOMException("The operation was aborted", "AbortError") },
  }
  const toolByName = new Map([["fetch", throwingTool]])
  const agent = { _planMode: false, config: { agent: {} } }
  const response = { toolCalls: [{ id: "t1", name: "fetch", arguments: "{}" }] }
  await assert.rejects(
    () => executeToolBatches(agent, { response, history: [], fullHistory: [], toolByName, getAuto: () => true, callbacks: {}, signal: ctrl.signal, cwd: process.cwd(), depth: 0 }),
    (e) => e.name === "AbortError",
  )
})
