/**
 * advisor-parallel.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): advisor.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { tmpdir } from "node:os"
import { createServer } from "node:http"


// ─── §18.7 B1 批并行（AGENT-LOOP.md §18.7 D-TS7——T-TS8/T-TS9）──────────────

/** B1 mock LLM：请求 1 = 一次回复两个只读工具调用；请求 2 = 最终文本。 */
function b1LoopServer() {
  return import("node:http").then(({ createServer }) => {
    const requests = []
    const server = createServer((req, res) => {
      let bodyText = ""
      req.on("data", (c) => (bodyText += c))
      req.on("end", () => {
        requests.push(JSON.parse(bodyText))
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        if (requests.length === 1) {
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [
              { index: 0, id: "call_tool1", function: { name: "read", arguments: "{}" } },
              { index: 1, id: "call_tool2", function: { name: "grep", arguments: "{}" } },
            ] } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
            `data: [DONE]\n\n`,
          )
        } else {
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "review complete" } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            `data: [DONE]\n\n`,
          )
        }
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests }))
    })
  })
}


test("B1 (T-TS8): 同一回复多个只读工具调用并行执行——两工具都在任一完成前启动（确定性事件序——弃墙钟）", async () => {
  const { _runAdvisorToolLoop } = await import("../src/advisor/run.mjs")
  const log = []
  const mkSlow = (name) => ({
    name,
    execute: async () => {
      log.push(`${name}-start`) // 同步段——Promise.all 启动序确定性
      await new Promise((r) => setTimeout(r, 100))
      log.push(`${name}-end`)
      return `${name}-result`
    },
  })
  const tools = { schemas: [], byName: new Map([["read", mkSlow("read")], ["grep", mkSlow("grep")]]) }
  const { server, port } = await b1LoopServer()
  try {
    const messages = []
    const out = await _runAdvisorToolLoop(
      { name: "mock", baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      messages, null, null, { cwd: tmpdir() }, tmpdir(), tools,
    )
    assert.ok(out.includes("review complete"), "B1: 工具循环正常收敛到最终文本")
    // 并行确定性断言：两工具都先启动、后完成（串行实现会得到 start→end→start→end——必挂）
    assert.equal(log[0], "read-start", "B1: read 先启动（Promise.all 输入序）")
    assert.equal(log[1], "grep-start", "B1: grep 启动于 read 启动后、任一完成前")
    assert.ok(log.indexOf("read-end") >= 2 && log.indexOf("grep-end") >= 2, "B1: 两个 end 都在两个 start 之后（并发——互不等待）")
    // 结果按 toolCalls 顺序回填（tool_call_id 不错配）
    const t1 = messages.find((m) => m.role === "tool" && m.tool_call_id === "call_tool1")
    const t2 = messages.find((m) => m.role === "tool" && m.tool_call_id === "call_tool2")
    assert.equal(t1.content, "read-result", "B1: 工具 1 结果回填（id 匹配）")
    assert.equal(t2.content, "grep-result", "B1: 工具 2 结果回填（id 匹配）")
    assert.ok(messages.indexOf(t1) < messages.indexOf(t2), "B1: 结果按 toolCalls 顺序入列")
  } finally {
    server.close()
  }
})



test("B1 (T-TS9): 错误隔离——一工具抛错另一工具成功——两结果回填 + 顺序保序 + 无未处理拒绝", async () => {
  const { _runAdvisorToolLoop } = await import("../src/advisor/run.mjs")
  const tools = {
    schemas: [],
    byName: new Map([
      ["read", { name: "read", execute: async () => { throw new Error("boom") } }],
      ["grep", { name: "grep", execute: async () => "grep-result" }],
    ]),
  }
  const { server, port } = await b1LoopServer()
  try {
    const messages = []
    const out = await _runAdvisorToolLoop(
      { name: "mock", baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      messages, null, null, { cwd: tmpdir() }, tmpdir(), tools,
    )
    // 抛错的工具独立捕获——不阻断另一工具，也不终止循环；无未处理拒绝（测试完成即证明）
    assert.ok(out.includes("review complete"), "T-TS9: 一工具抛错不终止评审循环")
    const t1 = messages.find((m) => m.role === "tool" && m.tool_call_id === "call_tool1")
    const t2 = messages.find((m) => m.role === "tool" && m.tool_call_id === "call_tool2")
    assert.equal(t1.content, "Error (execution_error): boom", "T-TS9: 抛错工具的结果 = 错误字符串（独立捕获）")
    assert.equal(t2.content, "grep-result", "T-TS9: 另一工具照常成功回填")
    assert.ok(messages.indexOf(t1) < messages.indexOf(t2), "T-TS9: 顺序按 toolCalls 保序")
  } finally {
    server.close()
  }
})
