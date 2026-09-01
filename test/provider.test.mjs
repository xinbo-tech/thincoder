/**
 * provider.test.mjs — chat() 截断续写（PROVIDER.md §14）
 * T1-T4：prefix 续写精简（§14.2）/ reasoning 回传 / partial 不受影响 / 续写 400 失败可见性（§14.3）
 */
import { test } from "node:test"
import assert from "node:assert/strict"

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
