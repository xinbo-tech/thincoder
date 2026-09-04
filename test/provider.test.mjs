/**
 * provider.test.mjs — chat() 截断续写（PROVIDER.md §14）
 * T1-T4：prefix 续写精简（§14.2）/ reasoning 回传 / partial 不受影响 / 续写 400 失败可见性（§14.3）
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { mockLLM as runAgentMockLLM } from "./helpers/mock-llm.mjs"

/** 本地 mock LLM server：按脚本依次返回 SSE 响应（content/finishReason/reasoning）；requests 捕获请求体（含 _url） */
function mockLLM(script) {
  return import("node:http").then(({ createServer }) => {
    let i = 0
    const requests = []
    const server = createServer((req, res) => {
      let bodyText = ""
      req.on("data", (c) => (bodyText += c))
      req.on("end", () => {
        requests.push({ ...JSON.parse(bodyText), _url: req.url })
        const step = script[Math.min(i++, script.length - 1)]
        const reasoningFrame = step.reasoning
          ? `data: ${JSON.stringify({ choices: [{ index: 0, delta: { reasoning_content: step.reasoning } }] })}\n\n`
          : ""
        const frames =
          reasoningFrame +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: step.content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: step.finishReason ?? "stop" }] })}\n\n` +
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

/** §14 T1-T3 共用场景：system + 3 组 tool_calls/tool 链 + 10 条 user/assistant 文本 */
function toolHistory() {
  const chains = [1, 2, 3].map((n) => [
    { role: "assistant", content: null, tool_calls: [{ id: `call_${n}`, type: "function", function: { name: "ls", arguments: "{}" } }] },
    { role: "tool", tool_call_id: `call_${n}`, content: `结果${n}` },
  ]).flat()
  const texts = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: `文本${i}` }))
  return [{ role: "system", content: "你是助手" }, ...chains, ...texts]
}

test("T1: prefix 续写精简——工具链全过滤、文本保留 ≤8、末条 prefix:true（§14.2）", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const script = [
    { content: "前半段", finishReason: "length" },
    { content: "后半段" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const ds = { baseURL: `http://127.0.0.1:${port}/v1`, apiKey: "x", model: "deepseek-v4-pro" }
    const result = await chat(ds, { messages: toolHistory() })
    assert.equal(result.content, "前半段后半段")
    assert.equal(result.finishReason, "stop")
    assert.equal(requests.length, 2)
    assert.equal(requests[1]._url, "/beta/chat/completions")
    const cont = requests[1].messages
    // 续写请求 messages 无任何 tool / assistant(tool_calls) 消息
    assert.ok(!cont.some((m) => m.role === "tool"), "tool 消息必须被过滤")
    assert.ok(!cont.some((m) => m.role === "assistant" && m.tool_calls), "assistant(tool_calls) 必须被过滤")
    // 文本保留 ≤8 条（system 与续写尾条除外），最近语境在列
    const textCount = cont.filter((m) => m.role !== "system").length - 1
    assert.ok(textCount <= 8, `文本保留 ${textCount} 条（≤8）`)
    assert.ok(cont.some((m) => m.content === "文本9"), "最近文本消息保留")
    // 末条 = prefix 续写消息（无 partial）
    const tail = cont.at(-1)
    assert.equal(tail.role, "assistant")
    assert.equal(tail.prefix, true)
    assert.equal(tail.partial, undefined)
    assert.equal(tail.content, "前半段")
  } finally {
    server.close()
  }
})

test("T2: prefix 续写 reasoning 回传——末条带 reasoning_content（§14.2）", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const script = [
    { content: "截断了", finishReason: "length", reasoning: "思考链" },
    { content: "续写内容" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const ds = { baseURL: `http://127.0.0.1:${port}/v1`, apiKey: "x", model: "deepseek-v4-pro" }
    const result = await chat(ds, { messages: toolHistory() })
    assert.equal(result.content, "截断了续写内容")
    assert.equal(result.reasoning, "思考链")
    const tail = requests[1].messages.at(-1)
    assert.equal(tail.prefix, true)
    assert.equal(tail.reasoning_content, "思考链")
    assert.equal(tail.partial, undefined)
  } finally {
    server.close()
  }
})

test("T3: partial 续写不受影响——同场景不精简、全量历史 + partial 尾条（§14.2）", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const script = [
    { content: "前半段", finishReason: "length" },
    { content: "后半段" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const kimi = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "kimi-k3" }
    const history = toolHistory()
    const result = await chat(kimi, { messages: history })
    assert.equal(result.content, "前半段后半段")
    const cont = requests[1].messages
    // 形态不变：全量历史原样 + partial 尾条（工具链消息保留）
    assert.equal(cont.length, history.length + 1)
    assert.ok(cont.some((m) => m.role === "tool"), "tool 消息保留")
    assert.ok(cont.some((m) => m.role === "assistant" && m.tool_calls), "assistant(tool_calls) 保留")
    const tail = cont.at(-1)
    assert.equal(tail.role, "assistant")
    assert.equal(tail.partial, true)
    assert.equal(tail.prefix, undefined)
    assert.equal(tail.content, "前半段")
  } finally {
    server.close()
  }
})

test("T4: 续写 400 失败可见性——_warnings 含错误文本，不静默飞出（§14.3）", async () => {
  const { createServer } = await import("node:http")
  const { chat } = await import("../src/provider/index.mjs")
  const requests = []
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", () => {
      requests.push({ ...JSON.parse(bodyText), _url: req.url })
      if (requests.length === 1) {
        // 首轮：截断响应（content + finish_reason=length）
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "前半段" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "length" }] })}\n\n` +
          `data: [DONE]\n\n`
        )
      } else {
        // 续写：deepseek 网关 400
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: { message: "Function call should not be used with prefix" } }))
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const ds = { baseURL: `http://127.0.0.1:${server.address().port}/v1`, apiKey: "x", model: "deepseek-v4-pro" }
    const result = await chat(ds, { messages: toolHistory() })
    assert.equal(requests.length, 2, "续写请求确已发出")
    assert.equal(requests[1]._url, "/beta/chat/completions")
    // 不抛出：已收内容保留 + _warnings 注入错误文本
    assert.equal(result.content, "前半段")
    assert.ok(Array.isArray(result._warnings) && result._warnings.length >= 1, "结果必须带 _warnings")
    assert.match(result._warnings[0].message, /Function call should not be used with prefix/)
  } finally {
    server.close()
  }
})





test("provider: Partial Mode 截断续写——length 且有正文时自动续写（仅声明 partialMode 的模型）", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  // 第一轮截断在正文中间，第二轮（续写）正常结束
  const script = [
    { content: "前半段内容", finishReason: "length", reasoning: "思考链" },
    { content: "后半段内容" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const kimi = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "kimi-k3" }
    const result = await chat(kimi, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(result.content, "前半段内容后半段内容")
    assert.equal(result.finishReason, "stop")
    // 续写请求：尾部追加了 partial assistant 消息，带原文与 reasoning_content
    assert.equal(requests.length, 2)
    const tail = requests[1].messages.at(-1)
    assert.equal(tail.role, "assistant")
    assert.equal(tail.partial, true)
    assert.equal(tail.content, "前半段内容")
    assert.equal(tail.reasoning_content, "思考链")

    // 未声明续写协议的模型：不续写，原样返回截断结果
    const script2 = [{ content: "截断了", finishReason: "length" }]
    const { server: s2, port: p2, requests: r2 } = await mockLLM(script2)
    try {
      const gpt = { baseURL: `http://127.0.0.1:${p2}`, apiKey: "x", model: "gpt-4o" }
      const r = await chat(gpt, { messages: [{ role: "user", content: "hi" }] })
      assert.equal(r.content, "截断了")
      assert.equal(r.finishReason, "length")
      assert.equal(r2.length, 1) // 没有第二次请求
    } finally {
      s2.close()
    }
  } finally {
    server.close()
  }
})



test("provider: DeepSeek Prefix Completion——length 时走 /beta 端点 prefix 续写", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const script = [
    { content: "前半段", finishReason: "length" },
    { content: "后半段" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const ds = { baseURL: `http://127.0.0.1:${port}/v1`, apiKey: "x", model: "deepseek-v4-pro" }
    const result = await chat(ds, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(result.content, "前半段后半段")
    assert.equal(result.finishReason, "stop")
    assert.equal(requests.length, 2)
    // 续写请求走 /beta 端点，尾部 assistant 消息带 prefix:true（此用例无 reasoning 故不含 reasoning_content）
    assert.equal(requests[0]._url, "/v1/chat/completions")
    assert.equal(requests[1]._url, "/beta/chat/completions")
    const tail = requests[1].messages.at(-1)
    assert.equal(tail.role, "assistant")
    assert.equal(tail.prefix, true)
    assert.equal(tail.partial, undefined)
    assert.equal(tail.reasoning_content, undefined)
    assert.equal(tail.content, "前半段")
  } finally {
    server.close()
  }
})



test("provider: DeepSeek Prefix 续写支持思考模式——reasoning_content 回传 /beta 端点续写", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const script = [
    { content: "截断了", finishReason: "length", reasoning: "思考链" },
    { content: "续写内容" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const ds = { baseURL: `http://127.0.0.1:${port}/v1`, apiKey: "x", model: "deepseek-v4-pro" }
    const result = await chat(ds, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(result.content, "截断了续写内容")
    assert.equal(result.reasoning, "思考链")
    assert.equal(result.finishReason, "stop")
    assert.equal(requests.length, 2) // 续写请求已发出
    // 续写请求的 prefix 消息应携带 reasoning_content
    const tail = requests[1].messages.at(-1)
    assert.equal(tail.role, "assistant")
    assert.equal(tail.prefix, true)
    assert.equal(tail.partial, undefined)
    assert.equal(tail.reasoning_content, "思考链")
    assert.equal(tail.content, "截断了")
  } finally {
    server.close()
  }
})



test("provider: Partial Mode 续写不处理思考阶段截断（content 为空直接返回）", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const script = [{ content: "", finishReason: "length", reasoning: "想了一半" }]
  const { server, port, requests } = await mockLLM(script)
  try {
    const kimi = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "kimi-k3" }
    const result = await chat(kimi, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(result.content, "")
    assert.equal(result.finishReason, "length")
    assert.equal(requests.length, 1) // 无续写请求
  } finally {
    server.close()
  }
})


// ----------------------------------------------------------------


/** Agent-style mockLLM (step.toolCall singular — the runAgent-level continuation tests). */


test("runAgent: thinking 模式下 reasoning_content 跨请求回传（DeepSeek 要求）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const noop = {
    name: "noop",
    description: "noop",
    parameters: { type: "object", properties: {} },
    readonly: true,
    execute: async () => "ok",
  }
  const script = [
    { toolCall: { name: "noop" }, reasoning: "思考链A" },
    { content: "最终回复", reasoning: "思考链B" },
  ]
  const { server, port, requests } = await runAgentMockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "deepseek-v4-pro" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-reasoning-test-"))
    const agent = createAgent({ provider, tools: [noop], config: {}, cwd })
    const out = await runAgent(agent, "测试")
    assert.equal(out, "最终回复")

    // 带 tool_calls 的 assistant 消息必须携带 reasoning_content 入 history（DeepSeek reasoningEcho: "required"）
    const assistantWithTools = agent.history.find((m) => m.role === "assistant" && m.tool_calls?.length)
    assert.equal(assistantWithTools.reasoning_content, "思考链A")

    // 第二个请求发出的 messages 里必须原样回传（DeepSeek 缺失会 400）
    const sentAssistant = requests[1].messages.find((m) => m.role === "assistant" && m.tool_calls?.length)
    assert.equal(sentAssistant.reasoning_content, "思考链A")

    // 最终回复（无 tool_calls 的轮次）不附加该字段——DeepSeek 只要求 tool-call 轮回传
    assert.ok(!("reasoning_content" in agent.history.at(-1)))
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("runAgent: GLM reasoning_content 不回传（clear_thinking 默认清除历史 reasoning）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const noop = {
    name: "noop",
    description: "noop",
    parameters: { type: "object", properties: {} },
    readonly: true,
    execute: async () => "ok",
  }
  const script = [
    { toolCall: { name: "noop" }, reasoning: "思考链A" },
    { content: "最终回复", reasoning: "思考链B" },
  ]
  const { server, port, requests } = await runAgentMockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "glm-5.2" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-glm-reasoning-test-"))
    const agent = createAgent({ provider, tools: [noop], config: {}, cwd })
    const out = await runAgent(agent, "测试")
    assert.equal(out, "最终回复")

    // GLM reasoningEcho: "optional" → history 里的 assistant 消息不携带 reasoning_content
    const assistantWithTools = agent.history.find((m) => m.role === "assistant" && m.tool_calls?.length)
    assert.ok(!assistantWithTools.reasoning_content, "GLM 不应回传 reasoning_content")

    // 第二个请求发出的 messages 里也不含 reasoning_content
    const sentAssistant = requests[1].messages.find((m) => m.role === "assistant" && m.tool_calls?.length)
    assert.ok(!sentAssistant.reasoning_content, "GLM 请求体不应含 reasoning_content")

    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})

