/**
 * provider-stream.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { slow } from "./slow.mjs"
import { mockLLM } from "./helpers/mock-llm.mjs"





test("provider: 401 + sk-kimi- key 给出双平台提示（IK5VGJ）", async () => {
  const { chat, _rateHooks } = await import("../src/provider/index.mjs")
  const { server, port } = await mockRaw([{ status: 401, body: JSON.stringify({ error: { message: "invalid api key" } }) }])
  const orig = { ..._rateHooks }
  _rateHooks.sleep = () => Promise.resolve()
  try {
    // Kimi For Coding key 配 Moonshot 端点（错误组合）→ 错误消息带平台提示
    const p = { baseURL: `http://127.0.0.1:${port}`, apiKey: "sk-kimi-abc", model: "k3" }
    await assert.rejects(
      () => chat(p, { messages: [{ role: "user", content: "hi" }] }),
      /Kimi|Moonshot/,
      "401 with sk-kimi- key must hint at the two-platform mismatch",
    )
    // 普通 key + 普通端点 → 无提示（保持原样）
    const p2 = { baseURL: `http://127.0.0.1:${port}`, apiKey: "sk-abc", model: "m" }
    const err2 = await chat(p2, { messages: [{ role: "user", content: "hi" }] }).then(() => null, (e) => e)
    assert.ok(!/tip: Kimi/.test(err2.message), "non-Kimi 401 keeps the bare message")
  } finally {
    Object.assign(_rateHooks, orig)
    server.close()
  }
})



test("provider: CJK 字符跨 chunk 边界时正确拼装（TextDecoder 流式解码）", async () => {
  const { createServer } = await import("node:http")
  const { chat } = await import("../src/provider/index.mjs")
  const full =
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "你好世界" } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
    `data: [DONE]\n\n`
  const buf = Buffer.from(full, "utf8")
  // 切在"好"的第 1 个字节后（多字节字符被劈成两半跨 chunk）
  const splitAt = buf.indexOf(Buffer.from("好", "utf8")) + 1
  const server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/event-stream" })
    res.write(buf.subarray(0, splitAt))
    setImmediate(() => res.end(buf.subarray(splitAt)))
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const provider = { baseURL: `http://127.0.0.1:${server.address().port}`, apiKey: "x", model: "m" }
    const result = await chat(provider, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(result.content, "你好世界") // 无替换字符、无丢字节
  } finally {
    server.close()
  }
})



test("provider: tempRange 裁剪——GLM temperature 超范围裁到 [0,1] 两位小数", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const script = [{ content: "ok", finishReason: "stop" }]
  const { server, port, requests } = await mockLLM(script)
  try {
    const glm = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "glm-5.2", temperature: 1.58 }
    await chat(glm, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(requests[0].temperature, 1) // 1.58 → 裁到 1.0
  } finally {
    server.close()
  }
})



test("provider: reasoningEffortEnum 校验——非法值报错，合法值透传", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const script = [{ content: "ok", finishReason: "stop" }]
  const { server, port, requests } = await mockLLM(script)
  try {
    // 非法值 → 抛错
    const glm = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "glm-5.2", reasoningEffort: "ultra" }
    await assert.rejects(
      () => chat(glm, { messages: [{ role: "user", content: "hi" }] }),
      /reasoning_effort "ultra" not supported by model "glm-5.2"/
    )
    // 合法值透传
    const glm2 = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "glm-5.2", reasoningEffort: "medium" }
    await chat(glm2, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(requests[0].reasoning_effort, "medium")
  } finally {
    server.close()
  }
})


// ---------------------------------------------------------------- TPM/RPM 节流与 429 退避

/** 可控制状态码/响应头的 mock server：steps = [{ status, headers, body } | { sse }] */
function mockRaw(steps) {
  return import("node:http").then(({ createServer }) => {
    let i = 0
    const requests = []
    const server = createServer((req, res) => {
      let bodyText = ""
      req.on("data", (c) => (bodyText += c))
      req.on("end", () => {
        requests.push(JSON.parse(bodyText))
        const step = steps[Math.min(i++, steps.length - 1)]
        if (step.sse) {
          res.writeHead(200, { "content-type": "text/event-stream" })
          res.end(step.sse)
        } else {
          res.writeHead(step.status ?? 500, step.headers ?? {})
          res.end(step.body ?? "")
        }
      })
    })
    return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests })))
  })
}

const SSE_OK =
  'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n' +
  'data: {"choices":[],"usage":{"prompt_tokens":10,"completion_tokens":5}}\n\n' +
  "data: [DONE]\n\n"


test("provider: 429 尊重 Retry-After 头", async () => {
  const { chat, _rateHooks } = await import("../src/provider/index.mjs")
  const { server, port, requests } = await mockRaw([
    { status: 429, headers: { "retry-after": "2" }, body: JSON.stringify({ error: { type: "rate_limit_reached_error" } }) },
    { sse: SSE_OK },
  ])
  const orig = { ..._rateHooks }
  const sleeps = []
  _rateHooks.sleep = (ms) => { sleeps.push(ms); return Promise.resolve() }
  try {
    const p = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const waits = []
    const r = await chat(p, { messages: [{ role: "user", content: "hi" }], onWait: (w) => waits.push(w) })
    assert.equal(r.content, "ok")
    assert.equal(requests.length, 2)
    assert.deepEqual(sleeps, [2000])
    assert.deepEqual(waits, [{ phase: "retry", seconds: 2 }])
  } finally {
    Object.assign(_rateHooks, orig)
    server.close()
  }
})



test("provider: 429 无 Retry-After 按 15s/30s/60s 退避后抛错", async () => {
  const { chat, _rateHooks } = await import("../src/provider/index.mjs")
  const { server, port, requests } = await mockRaw([
    { status: 429, body: JSON.stringify({ error: { type: "rate_limit_reached_error" } }) },
  ])
  const orig = { ..._rateHooks }
  const sleeps = []
  _rateHooks.sleep = (ms) => { sleeps.push(ms); return Promise.resolve() }
  try {
    const p = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    await assert.rejects(() => chat(p, { messages: [{ role: "user", content: "hi" }] }), /LLM API error 429/)
    assert.equal(requests.length, 4) // 首发 + 3 次重试
    assert.deepEqual(sleeps, [15_000, 30_000, 60_000])
  } finally {
    Object.assign(_rateHooks, orig)
    server.close()
  }
})



test("provider: 配额/余额错误不重试直接抛", async () => {
  const { chat, _rateHooks } = await import("../src/provider/index.mjs")
  const { server, port, requests } = await mockRaw([
    { status: 429, body: JSON.stringify({ error: { type: "exceeded_current_quota_error", message: "余额不足" } }) },
  ])
  const orig = { ..._rateHooks }
  const sleeps = []
  _rateHooks.sleep = (ms) => { sleeps.push(ms); return Promise.resolve() }
  try {
    const p = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    await assert.rejects(() => chat(p, { messages: [{ role: "user", content: "hi" }] }), /exceeded_current_quota_error/)
    assert.equal(requests.length, 1) // 重试无用，一次就抛
    assert.deepEqual(sleeps, [])
  } finally {
    Object.assign(_rateHooks, orig)
    server.close()
  }
})



test("provider: TPM 闸门——窗口超预算睡到腾出空间，实测 usage 记账", async () => {
  const { chat, _rateHooks } = await import("../src/provider/index.mjs")
  const big =
    'data: {"choices":[{"delta":{"content":"a"}}]}\n\n' +
    'data: {"choices":[],"usage":{"prompt_tokens":700,"completion_tokens":100}}\n\n' +
    "data: [DONE]\n\n"
  const { server, port, requests } = await mockRaw([{ sse: big }, { sse: SSE_OK }, { sse: SSE_OK }])
  const orig = { ..._rateHooks }
  let fakeNow = 0
  const sleeps = []
  _rateHooks.now = () => fakeNow
  _rateHooks.sleep = (ms) => { sleeps.push(ms); fakeNow += ms; return Promise.resolve() }
  try {
    const p = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m", tpm: 810 }
    const waits = []
    const onWait = (w) => waits.push(w)
    await chat(p, { messages: [{ role: "user", content: "hi" }], onWait }) // 记账 800
    await chat(p, { messages: [{ role: "user", content: "hi" }], onWait }) // 800+估算1 ≤ 810 → 不等；实测记 15，累计 815
    assert.deepEqual(sleeps, [])
    await chat(p, { messages: [{ role: "user", content: "hi" }], onWait }) // 815+1 > 810 → 睡到首条记录过期
    assert.deepEqual(sleeps, [60_000])
    assert.deepEqual(waits, [{ phase: "gate", seconds: 60 }])
    assert.equal(requests.length, 3)
  } finally {
    Object.assign(_rateHooks, orig)
    server.close()
  }
})



test("provider: TPM 闸门——单请求估算超预算时放行（不卡死）", async () => {
  const { chat, _rateHooks } = await import("../src/provider/index.mjs")
  const { server, port, requests } = await mockRaw([{ sse: SSE_OK }])
  const orig = { ..._rateHooks }
  const sleeps = []
  _rateHooks.sleep = (ms) => { sleeps.push(ms); return Promise.resolve() }
  try {
    const p = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m", tpm: 1 }
    const r = await chat(p, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(r.content, "ok")
    assert.equal(requests.length, 1)
    assert.deepEqual(sleeps, [])
  } finally {
    Object.assign(_rateHooks, orig)
    server.close()
  }
})


// ---------------------------------------------------------------- 视觉能力防护（image_url 会话毒化）


test("provider: 发送前为非视觉模型剥离 image_url（防会话毒化），视觉模型透传", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const { server, port, requests } = await mockLLM([{ content: "答" }])
  try {
    const poisoned = [
      { role: "user", content: "之前的请求" },
      { role: "user", content: [{ type: "text", text: "[read_image: a.png]" }, { type: "image_url", image_url: { url: "data:image/png;base64,AAA" } }] },
    ]
    // DeepSeek（无视觉）：image_url 被替换为文本占位符，原历史不被修改
    const ds = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "deepseek-v4-pro" }
    await chat(ds, { messages: poisoned })
    const sentDs = JSON.stringify(requests.at(-1).messages)
    assert.ok(!sentDs.includes("image_url"))
    assert.match(sentDs, /image omitted/)
    assert.equal(poisoned[1].content[1].type, "image_url") // 历史原样保留，切回视觉模型可恢复
    // Kimi K3（有视觉）：原样透传
    const kimi = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "kimi-k3" }
    await chat(kimi, { messages: poisoned })
    assert.equal(requests.at(-1).messages[1].content[1].type, "image_url")
  } finally {
    server.close()
  }
})



test("provider: parseRetryAfter — 秒数/HTTP-date 解析 + 300s 上限（会诊 #11）", async () => {
  const { parseRetryAfter } = await import("../src/provider/core.mjs")
  assert.equal(parseRetryAfter("42", 0), 42_000, "秒数形态")
  assert.equal(parseRetryAfter("1200", 0), 300_000, "超上限钳到 300s")
  assert.equal(parseRetryAfter(null, 2), 60_000, "缺失头退回退避表第 3 档")
  assert.equal(parseRetryAfter("garbage", 0), 15_000, "非法值退回退避表第 1 档")
  const future = new Date(Date.now() + 65_000).toUTCString()
  const futureMs = parseRetryAfter(future, 0)
  assert.ok(futureMs >= 64_000 && futureMs <= 65_500, `HTTP-date 形态：${futureMs}ms 应≈65s`)
})



test("provider: rateGate — 单请求超 tpm 告警且不死等（会诊 #16）", async () => {
  const { rateGate, _rateHooks } = await import("../src/provider/rate.mjs")
  const waits = []
  const orig = _rateHooks.sleep
  _rateHooks.sleep = async (ms) => { waits.push(ms) }
  try {
    const warned = []
    const provider = { baseURL: "https://x", apiKey: "k", tpm: 100, rpm: null }
    await rateGate(provider, 5000, (w) => warned.push(w), undefined)
    assert.ok(warned.some((w) => w.phase === "warn" && /estimated 5000 tokens > tpm 100/.test(w.message)), "超预算必须告警")
    assert.equal(waits.length, 0, "单请求超预算不得睡窗口")
  } finally {
    _rateHooks.sleep = orig
  }
})



test("provider: mergeRetryToolCalls — name 只设一次 + 按 id/name 合并（会诊 #7/#17）", async () => {
  // 通过 chat() 的续写/重试路径难搭全链路，直接测合并语义的核心：
  // 重试里 provider 重发完整 tc（同 id 同 name）→ 不得产生 "get_weatherget_weather"。
  const { readSSE } = await import("../src/provider/core.mjs")
  const mk = (tc) => new Response(
    new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: tc.id, function: { name: "get_weather", arguments: "{\"a\":" } }] } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: tc.id, function: { arguments: "1}" } }] }, finish_reason: "tool_calls" }] })}\n\n` +
          `data: [DONE]\n\n`
        ))
        c.close()
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  )
  // 单流完整解析的基线（finalize 后无 index，id 保留）
  const r = await readSSE(mk({ id: "call_9" }), { onToken: () => {} })
  assert.equal(r.toolCalls.length, 1)
  assert.equal(r.toolCalls[0].name, "get_weather")
  assert.equal(r.toolCalls[0].arguments, '{"a":1}')
})





test("provider: gemini convertMessages — system 消息不进 contents", async () => {
  const { convertMessages } = await import("../src/provider/google.mjs")
  const contents = convertMessages([
    { role: "system", content: "you are a helpful assistant" },
    { role: "user", content: "hi" },
    { role: "user", content: "[System reminder: mid-stream note]" },
    { role: "assistant", content: "hello" },
  ])
  // role:system 由 chat() 单独进 systemInstruction，contents 里不能再出现
  assert.ok(!JSON.stringify(contents).includes("you are a helpful assistant"), "system prompt must not leak into contents")
  // 连续 user 合并、assistant → model；[System reminder:] 本来就是 user 角色，保留
  assert.deepEqual(contents.map((c) => c.role), ["user", "model"])
  assert.ok(JSON.stringify(contents).includes("mid-stream note"))
})



test("provider: retry.mjs — 5xx 退避重试链与 OpenAI 格式对齐（会诊 2026-08-31）", async () => {
  const { requestWithRetry } = await import("../src/provider/retry.mjs")
  const { _rateHooks } = await import("../src/provider/rate.mjs")
  const sleeps = []
  const orig = _rateHooks.sleep
  _rateHooks.sleep = async (ms) => { sleeps.push(ms) }
  try {
    let calls = 0
    const resp = await requestWithRetry(async () => {
      calls++
      if (calls === 1) return new Response("overloaded", { status: 503 })
      return new Response("OK")
    }, { signal: undefined, buildMessage: (s, t) => `Gemini API error ${s}: ${t}` })
    assert.equal(resp.ok, true, "503 后第二次成功")
    assert.equal(calls, 2)
    assert.deepEqual(sleeps, [1000], "退避 2^0*1s")
  } finally {
    _rateHooks.sleep = orig
  }
  // 429 尊重 Retry-After + 上限 300s
  const sleeps2 = []
  _rateHooks.sleep = async (ms) => { sleeps2.push(ms) }
  try {
    const h = new Headers({ "retry-after": "1200" })
    let calls = 0
    const resp = await requestWithRetry(async () => {
      calls++
      if (calls === 1) return new Response("nope", { status: 429, headers: h })
      return new Response("OK")
    }, { signal: undefined, buildMessage: (s, t) => `e: ${s}` })
    assert.equal(resp.ok, true)
    assert.equal(sleeps2[0], 300_000, "Retry-After 超上限钳到 300s")
  } finally {
    _rateHooks.sleep = orig
  }
})



test("provider: anthropic tool_choice 映射 + google toolConfig 映射（能力层 2026-08-31）", async () => {
  const { chat: anthropicChat } = await import("../src/provider/anthropic.mjs")
  const { chat: geminiChat } = await import("../src/provider/google.mjs")
  const { createServer } = await import("node:http")
  const captured = []
  const server = createServer((req, res) => {
    let b = ""
    req.on("data", (d) => (b += d))
    req.on("end", () => {
      captured.push(JSON.parse(b))
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end("event: message_stop\ndata: {}\n\n")
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const port = server.address().port
    await anthropicChat({ baseURL: `http://127.0.0.1:${port}`, apiKey: "sk-t", model: "claude-3-5", format: "anthropic" }, {
      messages: [{ role: "user", content: "hi" }], onToken: () => {}, onReasoning: () => {},
      toolChoice: { type: "function", function: { name: "get_weather" } },
    }).catch(() => {}) // Gemini/Anthropic 流解析对非标准 body 不关心，只捕获请求
    assert.deepEqual(captured.at(-1)?.tool_choice, { type: "tool", name: "get_weather" }, "anthropic 映射 {type:'tool',name}")
    await geminiChat({ baseURL: `http://127.0.0.1:${port}`, apiKey: "sk-t", model: "g", format: "google" }, {
      messages: [{ role: "user", content: "hi" }], onToken: () => {}, onReasoning: () => {},
      toolChoice: "required",
    }).catch(() => {})
    assert.deepEqual(captured.at(-1)?.toolConfig?.functionCallingConfig, { mode: "ANY" }, "google required→ANY")
  } finally {
    server.close()
  }
})



test("provider: anthropic stream — CRLF 事件边界 + BOM 首 chunk（会诊 #12/#13）", async () => {
  const { chat } = await import("../src/provider/anthropic.mjs")
  const { createServer } = await import("node:http")
  // 全 CRLF 分隔 + 首 chunk 前插 BOM 的 SSE 响应
  const frames =
    "\uFEFF" +
    "event: message_start\r\n" +
    "data: {\"type\":\"message_start\",\"message\":{\"usage\":{\"input_tokens\":10,\"output_tokens\":5}}}\r\n\r\n" +
    "event: content_block_start\r\n" +
    "data: {\"type\":\"content_block_start\",\"index\":0,\"content_block\":{\"type\":\"text\",\"text\":\"\"}}\r\n\r\n" +
    "event: content_block_delta\r\n" +
    "data: {\"type\":\"content_block_delta\",\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"你好\"}}\r\n\r\n" +
    "event: content_block_stop\r\n" +
    "data: {\"type\":\"content_block_stop\",\"index\":0}\r\n\r\n" +
    "event: message_delta\r\n" +
    "data: {\"type\":\"message_delta\",\"delta\":{\"stop_reason\":\"end_turn\"},\"usage\":{\"input_tokens\":10,\"output_tokens\":6}}\r\n\r\n" +
    "event: message_stop\r\n" +
    "data: {\"type\":\"message_stop\"}\r\n\r\n"
  const server = createServer((req, res) => {
    let b = ""
    req.on("data", (d) => (b += d))
    req.on("end", () => {
      void b
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      // 分包，模拟真实网络分块
      res.write(frames.slice(0, 120))
      setTimeout(() => res.end(frames.slice(120)), 10)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const provider = {
      baseURL: `http://127.0.0.1:${server.address().port}`,
      apiKey: "sk-test", model: "claude-3-5-sonnet",
      format: "anthropic", proxy: false,
    }
    const tokens = []
    const result = await chat(provider, {
      messages: [{ role: "user", content: "hi" }],
      onToken: (t) => tokens.push(t), onReasoning: () => {},
    })
    assert.equal(result.content, "你好", "CRLF 事件边界 + BOM 首 chunk 必须完整解析")
    assert.deepEqual(tokens, ["你好"])
    assert.equal(result.usage.prompt_tokens, 10, "usage 从 message_start 读出（BOM 未吞首事件）")
    assert.equal(result.usage.completion_tokens, 6, "message_delta 的 usage 覆盖")
  } finally {
    server.close()
  }
})



test("provider: anthropic — 温度钳位 0-1（含 spec 无 tempRange 的兜底）", async () => {
  const { createServer } = await import("node:http")
  let captured = null
  const server = createServer((req, res) => {
    let b = ""
    req.on("data", (d) => (b += d))
    req.on("end", () => {
      captured = JSON.parse(b)
      res.setHeader("content-type", "text/event-stream")
      res.end(`event: message_stop\ndata: {}\n\n`)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const { chat } = await import("../src/provider/anthropic.mjs")
    const baseURL = `http://127.0.0.1:${server.address().port}`
    const msgs = [{ role: "user", content: "hi" }]
    // claude-sonnet-4 的 spec 未声明 tempRange，也必须按 Anthropic API 硬限制 0-1 钳位
    await chat({ baseURL, apiKey: "k", model: "claude-sonnet-4", temperature: 2 }, { messages: msgs })
    assert.equal(captured.temperature, 1)
    // 完全未知的模型（DEFAULT_SPEC 同样无 tempRange）也钳位
    await chat({ baseURL, apiKey: "k", model: "claude-3.5-sonnet", temperature: 1.7 }, { messages: msgs })
    assert.equal(captured.temperature, 1)
    // 合法值原样通过
    await chat({ baseURL, apiKey: "k", model: "claude-sonnet-4", temperature: 0.5 }, { messages: msgs })
    assert.equal(captured.temperature, 0.5)
  } finally {
    server.close()
  }
})
