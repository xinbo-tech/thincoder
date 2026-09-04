/**
 * stream-rules.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"


// ---------------------------------------------------------------- stream rules


test("provider: compileStreamRules 编译并过滤非法正则", async () => {
  const { compileStreamRules } = await import("../src/provider/core.mjs")

  // Valid rules
  const rules = compileStreamRules([
    { pattern: "hello", message: "no hello", action: "abort" },
    { pattern: "world", message: "no world", action: "warn", flags: "i" },
  ])
  assert.equal(rules.length, 2)
  assert.ok(rules[0]._regex instanceof RegExp)
  assert.equal(rules[0].message, "no hello")
  assert.equal(rules[0].action, "abort")
  assert.equal(rules[1].flags, "i")

  // Empty/null input
  assert.equal(compileStreamRules([]), null)
  assert.equal(compileStreamRules(null), null)
  assert.equal(compileStreamRules(undefined), null)

  // Invalid regex is silently skipped
  const withBad = compileStreamRules([
    { pattern: "valid", message: "ok", action: "abort" },
    { pattern: "[invalid", message: "bad", action: "abort" },
  ])
  assert.equal(withBad.length, 1)
  assert.equal(withBad[0].message, "ok")
})



test("provider: readSSE — stream rule abort mid-generation", async () => {
  const { readSSE, compileStreamRules } = await import("../src/provider/core.mjs")

  const rules = compileStreamRules([
    { pattern: "FORBIDDEN", message: "Do not use the word FORBIDDEN", action: "abort" },
  ])

  // Build a ReadableStream that emits SSE events in separate chunks
  const body = new ReadableStream({
    async start(controller) {
      const enc = (s) => new TextEncoder().encode(s)
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "safe " } }] })}\n\n`))
      // Small delay to encourage separate chunk delivery
      await new Promise(r => setTimeout(r, 1))
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "text FORBIDDEN more" } }] })}\n\n`))
      await new Promise(r => setTimeout(r, 1))
      // This should NOT be received if abort works (but may arrive if chunks merged)
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: " after" } }] })}\n\n`))
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`))
      controller.enqueue(enc(`data: [DONE]\n\n`))
      controller.close()
    }
  })

  const response = { body, headers: { get: () => "text/event-stream" } }
  const result = await readSSE(response, { onToken: () => {}, onReasoning: () => {}, rules })

  assert.equal(result.ruleTriggered, true)
  assert.equal(result.ruleMessage, "Do not use the word FORBIDDEN")
  assert.ok(result.content.includes("FORBIDDEN"), "partial content before abort is preserved")
})



test("provider: readSSE — no rules means no trigger", async () => {
  const { readSSE } = await import("../src/provider/core.mjs")

  const body = new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "FORBIDDEN text" } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        `data: [DONE]\n\n`
      ))
      controller.close()
    }
  })

  const response = { body, headers: { get: () => "text/event-stream" } }
  const result = await readSSE(response, { onToken: () => {}, onReasoning: () => {}, rules: null })

  assert.equal(result.ruleTriggered, undefined)
  assert.ok(result.content.includes("FORBIDDEN"))
  assert.equal(result.finishReason, "stop")
})



test("runAgent: stream rules — rule triggers abort and reminder is injected", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")

  // Multi-turn mock: first response triggers the rule, second is clean
  let callCount = 0
  const { createServer } = await import("node:http")
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", () => {
      callCount++
      const content = callCount === 1
        ? "This contains FORBIDDEN_WORD and should abort"
        : "OK here is a clean response"
      const frames =
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        `data: [DONE]\n\n`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames)
    })
  })
  await new Promise(r => server.listen(0, "127.0.0.1", r))
  const port = server.address().port

  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const config = {
      agent: {
        streamRules: [
          { pattern: "FORBIDDEN_WORD", message: "Reminder: do not use FORBIDDEN_WORD. Re-generate your response without it.", action: "abort" },
        ],
        maxTurns: 100,
        subagentTurns: 100,
        compactThreshold: 100000,
        verifyGuard: false,
      },
    }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-stream-rules-"))
    const agent = createAgent({ provider, tools: [], config, cwd })

    const out = await runAgent(agent, "do it", {})
    // Second turn succeeded with clean response
    assert.ok(out.includes("clean response"), `expected clean response, got: ${out}`)
    // History contains the reminder injection
    assert.ok(agent.history.some(m => m.content?.includes("FORBIDDEN_WORD")), "reminder about FORBIDDEN_WORD was injected")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})


// ---------------------------------------------------------------- stream rules — warn + repeat


test("provider: readSSE — warn mode does not abort, accumulates warnings", async () => {
  const { readSSE, compileStreamRules } = await import("../src/provider/core.mjs")

  const rules = compileStreamRules([
    { pattern: "WARN_ME", message: "Please avoid WARN_ME", action: "warn" },
  ])

  const body = new ReadableStream({
    async start(controller) {
      const enc = (s) => new TextEncoder().encode(s)
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "safe " } }] })}\n\n`))
      await new Promise(r => setTimeout(r, 1))
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "text WARN_ME more" } }] })}\n\n`))
      await new Promise(r => setTimeout(r, 1))
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: " after" } }] })}\n\n`))
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`))
      controller.enqueue(enc(`data: [DONE]\n\n`))
      controller.close()
    }
  })

  const response = { body, headers: { get: () => "text/event-stream" } }
  const result = await readSSE(response, { onToken: () => {}, onReasoning: () => {}, rules })

  // warn does NOT set ruleTriggered — stream completes normally
  assert.equal(result.ruleTriggered, undefined)
  assert.equal(result.finishReason, "stop")
  // Full content is received (not truncated at match point)
  assert.ok(result.content.includes("safe"), "content before match is preserved")
  assert.ok(result.content.includes("after"), "content after match is preserved")
  // Warning is accumulated
  assert.equal(result._warnings.length, 1)
  assert.equal(result._warnings[0].message, "Please avoid WARN_ME")
})



test("provider: readSSE — repeat: once deduplicates within same stream", async () => {
  const { readSSE, compileStreamRules } = await import("../src/provider/core.mjs")

  const rules = compileStreamRules([
    { pattern: "DUP", message: "DUP warning", action: "warn", repeat: "once" },
  ])

  const body = new ReadableStream({
    async start(controller) {
      const enc = (s) => new TextEncoder().encode(s)
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "first DUP" } }] })}\n\n`))
      await new Promise(r => setTimeout(r, 1))
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: " second DUP end" } }] })}\n\n`))
      controller.enqueue(enc(`data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`))
      controller.enqueue(enc(`data: [DONE]\n\n`))
      controller.close()
    }
  })

  const response = { body, headers: { get: () => "text/event-stream" } }
  const result = await readSSE(response, { onToken: () => {}, onReasoning: () => {}, rules })

  assert.equal(result._warnings.length, 1, "repeat:once should only record warning once")
  assert.equal(result._warnings[0].message, "DUP warning")
  assert.ok(result.content.includes("second"), "stream completes after repeated match")
})



test("provider: readSSE — repeat: once 跨 chat 调用不重复触发（共享 firedPatterns）", async () => {
  const { readSSE, compileStreamRules } = await import("../src/provider/core.mjs")
  const rules = compileStreamRules([
    { pattern: "FORBIDDEN", message: "Do not use FORBIDDEN", action: "abort", repeat: "once" },
  ])
  // agent.mjs 在 runAgent 的 turn 循环外创建这个 Set，跨多次 chat() 调用共享
  const fired = new Set()
  const mkResponse = () => ({
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "text FORBIDDEN end" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
        ))
        controller.close()
      }
    }),
    headers: { get: () => "text/event-stream" },
  })

  // 第一次 chat：规则命中，abort
  const r1 = await readSSE(mkResponse(), { onToken: () => {}, rules, firedPatterns: fired })
  assert.equal(r1.ruleTriggered, true)

  // abort-retry 后的第二次 chat（同一 turn 内）：规则已 fired，不再打断，流完整读完
  const r2 = await readSSE(mkResponse(), { onToken: () => {}, rules, firedPatterns: fired })
  assert.equal(r2.ruleTriggered, undefined)
  assert.equal(r2.content, "text FORBIDDEN end")
})



test("provider: readSSE — non-SSE JSON chunk with tool_calls parsed as valid completion", async () => {
  const { readSSE } = await import("../src/provider/core.mjs")
  // API returned HTTP 200 with JSON instead of SSE (proxy stripped SSE framing)
  const jsonBody = JSON.stringify({
    id: "chatcmpl-test",
    object: "chat.completion.chunk",
    model: "kimi/kimi-k3",
    choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
    usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
  })
  const encoder = new TextEncoder()
  const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(jsonBody)); c.close() } })
  const response = new Response(stream, { status: 200, headers: { "content-type": "application/json" } })
  const result = await readSSE(response, { onToken: () => {}, onReasoning: () => {} })
  assert.equal(result.finishReason, "tool_calls", "finish_reason parsed from JSON")
  assert.equal(result.usage.total_tokens, 150, "usage parsed from JSON")
})



test("provider: readSSE — non-SSE error response includes HTTP status and body", async () => {
  const { readSSE } = await import("../src/provider/core.mjs")
  const errorBody = JSON.stringify({ error: { message: "rate limit exceeded" } })
  const encoder = new TextEncoder()
  const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(errorBody)); c.close() } })
  const response = new Response(stream, { status: 429, headers: { "content-type": "application/json" } })
  await assert.rejects(() => readSSE(response, { onToken: () => {} }),
    (err) => { assert.ok(err.message.includes("HTTP 429"), "includes HTTP status"); assert.ok(err.message.includes("rate limit"), "includes error message"); return true })
})


// ---------------------------------------------------------------- 2026-08-31 会诊鲁棒性修复测试


test("provider: readSSE — non-SSE 完整 chat.completion（message 形态，网关降级流）读到内容（会诊 #3）", async () => {
  const { readSSE } = await import("../src/provider/core.mjs")
  // 网关无视 stream:true 返回完整 completion：内容在 choice.message 而非 delta ——
  // 原实现只读 choice.delta 返回空内容且不报错（静默空响应）。
  const jsonBody = JSON.stringify({
    id: "chatcmpl-x", object: "chat.completion", model: "m",
    choices: [{ index: 0, message: { role: "assistant", content: "完整回复" }, finish_reason: "stop" }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  })
  const tokens = []
  const body = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(jsonBody)); c.close() } })
  const result = await readSSE(new Response(body, { status: 200, headers: { "content-type": "application/json" } }), {
    onToken: (t) => tokens.push(t), onReasoning: () => {},
  })
  assert.equal(result.content, "完整回复", "message 形态的 content 必须读出")
  assert.deepEqual(tokens, ["完整回复"], "onToken 正常回调")
  assert.equal(result.finishReason, "stop")
})



test("provider: readSSE — BOM 前缀不吞首事件 + 多行 data 拼接（会诊 #12/#14）", async () => {
  const { readSSE } = await import("../src/provider/core.mjs")
  // 首 chunk 带 UTF-8 BOM；同一事件两条 data 行（SSE 规范允许，原逐行 parse 会丢）
  const enc = new TextEncoder()
  const bomChunk = "\uFEFFdata: " + JSON.stringify({ choices: [{ index: 0, delta: { content: "先" } }] }) + "\n"
  const restChunk = `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "后" } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`
  const body = new ReadableStream({
    start(c) {
      c.enqueue(enc.encode(bomChunk))       // BOM + 半个事件（无空行）
      c.enqueue(enc.encode(restChunk))      // 后半 + 完成事件
      c.close()
    },
  })
  const tokens = []
  const result = await readSSE(new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } }), {
    onToken: (t) => tokens.push(t), onReasoning: () => {},
  })
  assert.equal(result.content, "先后", "BOM 剥除 + 跨 chunk 事件完整")
  assert.equal(result.finishReason, "stop")
})



test("provider: readSSE — 网络中断返回 partial 而非丢全部已收内容（会诊 #2）", async () => {
  const { readSSE } = await import("../src/provider/core.mjs")
  // 模拟流中途连接被毁：已收一段内容后 body 报错（ECONNRESET 语义）
  const enc = new TextEncoder()
  const body = new ReadableStream({
    start(c) {
      c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "已收内容" } }] })}\n\n`))
      // error() 会立即清空队列——延迟到消费方已读走首段后触发（模拟流中途断连）
      setTimeout(() => c.error(new Error("fetch failed")), 0)
    },
  })
  const tokens = []
  const result = await readSSE(new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } }), {
    onToken: (t) => tokens.push(t), onReasoning: () => {},
  })
  assert.equal(result.partial, true, "应有 partial 标记")
  assert.equal(result.content, "已收内容", "已收内容不丢")
  assert.match(result.networkError, /fetch failed/)
  assert.ok(result._warnings.some((w) => w.name === "network-partial"), "累计 warning")
})



test("provider: readSSE — reasoning 方言兼容（delta.reasoning 而非 reasoning_content，会诊 #9）", async () => {
  const { readSSE } = await import("../src/provider/core.mjs")
  const chunk = JSON.stringify({ choices: [{ index: 0, delta: { reasoning: "思考中", content: "正文" } }] })
  const ok = JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })
  const body = new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode(`data: ${chunk}\n\ndata: ${ok}\n\ndata: [DONE]\n\n`))
      c.close()
    },
  })
  let reasoningSeen = ""
  const result = await readSSE(new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } }), {
    onToken: () => {}, onReasoning: (r) => { reasoningSeen += r },
  })
  assert.equal(result.reasoning, "思考中", "reasoning 字段必须被识别")
  assert.equal(reasoningSeen, "思考中")
  assert.equal(result.content, "正文")
})



test("provider: readSSE — network partial 警告注入独立于 _warnings 已有项（会诊 #2 防重复）", async () => {
  const { readSSE } = await import("../src/provider/core.mjs")
  const enc = new TextEncoder()
  const body = new ReadableStream({
    start(c) {
      c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "x" } }] })}\n\n`))
      setTimeout(() => c.error(new Error("boom")), 0)
    },
  })
  const result = await readSSE(new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } }), {
    onToken: () => {}, onReasoning: () => {},
  })
  assert.equal(result._warnings.filter((w) => w.name === "network-partial").length, 1)
})
