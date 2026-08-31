/**
 * responses.test.mjs — Responses API transport（PROVIDER.md §13）
 *  - 消息→items 双向转换 / 工具扁平化
 *  - 链状态机：turn 内增量 / 跨 turn 重置 / 白名单 / 灰名单全量+warning
 *  - 事件流解析：output_text / reasoning_text / function_call（added→delta→done）/ completed usage
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildBody, parseStream, isChainInvalidError } from "../src/provider/responses.mjs"

const provider = (over = {}) => ({
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: "sk-t",
  model: "qwen3.8-max",
  stateful: true,
  ...over,
})

test("buildBody: 消息→items + system→instructions + 工具扁平化", () => {
  const { body } = buildBody(provider(), [
    { role: "system", content: "你是有帮助的助手" },
    { role: "user", content: "今天的日期？" },
  ], [{ type: "function", function: { name: "get_date", description: "获取日期", parameters: { type: "object", properties: {} } } }])
  assert.deepEqual(body.instructions, "你是有帮助的助手", "system → instructions")
  assert.equal(body.input[0].role, "user")
  assert.equal(body.stream, true)
  assert.equal(body.store, false, "本地有全量，不托管服务端")
  assert.equal(body.tools[0].name, "get_date")
  assert.equal(body.tools[0].type, "function")
})

test("buildBody: 白名单（百炼）默认开链——turn 内增量只发 function_call_output", () => {
  const p = provider()
  // 首轮：建立链（stateful host → newChain id 由 parseStream 后推进）
  const first = buildBody(p, [{ role: "user", content: "查天气" }], null)
  assert.equal(first.previousResponseId, null)
  assert.ok(first.newChain, "白名单 host 建立链")
  p._responsesChain = { ...first.newChain, id: "resp_1" }
  // 第二轮（turn 内）：新消息 = assistant(tc) + tool 结果——增量只发 function_call_output
  const messages = [
    { role: "user", content: "查天气" },
    { role: "assistant", content: "", tool_calls: [{ id: "call_1", function: { name: "get_weather", arguments: "{}" } }] },
    { role: "tool", tool_call_id: "call_1", content: "晴" },
  ]
  const second = buildBody(p, messages, null)
  assert.equal(second.previousResponseId, "resp_1", "链有效 → 发 previous_response_id")
  assert.equal(second.body.input.length, 1, "增量只有工具结果")
  assert.equal(second.body.input[0].type, "function_call_output")
  assert.equal(second.body.input[0].call_id, "call_1")
  assert.equal("assistant" in second.body.input[0], false)
})

test("buildBody: 跨 turn（新 user 消息）chainKey 变化 → 全量重建", () => {
  const p = provider()
  const first = buildBody(p, [{ role: "user", content: "查天气" }], null)
  p._responsesChain = { ...first.newChain, id: "resp_1" }
  const second = buildBody(p, [
    { role: "user", content: "查天气" },
    { role: "assistant", content: "", tool_calls: [{ id: "call_1", function: { name: "get_weather", arguments: "{}" } }] },
    { role: "tool", tool_call_id: "call_1", content: "晴" },
    { role: "user", content: "那明天呢？" }, // 跨 turn
  ], null)
  assert.equal(second.previousResponseId, null, "chainKey 变化 → 全量")
  assert.ok(second.body.input.length > 1)
})

test("buildBody: 灰名单（DeepSeek）自动全量 + 一次性 warning", () => {
  const p = provider({ baseURL: "https://api.deepseek.com" })
  const { body, previousResponseId, warnings } = buildBody(p, [{ role: "user", content: "hi" }], null)
  assert.equal(previousResponseId, null)
  assert.ok(warnings.some((w) => w.name === "responses-stateful-unsupported"), "灰名单警告存在")
  assert.equal(body.input.length, 1)
})

test("buildBody: stateful:false 显式全量（逃生舱）", () => {
  const p = provider({ stateful: false })
  const { newChain } = buildBody(p, [{ role: "user", content: "hi" }], null)
  assert.equal(newChain, null, "stateful:false → 永不全量以外的模式")
})

test("parseStream: 文本流 + reasoning 流 + completed usage", async () => {
  const events = [
    { type: "response.created", response: { id: "resp_x", status: "in_progress" } },
    { type: "response.reasoning_text.delta", delta: "思考中" },
    { type: "response.output_text.delta", delta: "你好" },
    { type: "response.output_text.delta", delta: "世界" },
    { type: "response.completed", response: { id: "resp_x", usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15, input_tokens_details: { cached_tokens: 3 } } } },
  ]
  const tokens = []
  let reasoning = ""
  const result = await parseStream(mockSSE(events), { onToken: (t) => tokens.push(t), onReasoning: (r) => (reasoning += r) })
  assert.equal(result.content, "你好世界")
  assert.equal(reasoning, "思考中")
  assert.equal(tokens.join(""), "你好世界")
  assert.equal(result.usage.completion_tokens, 5)
  assert.equal(result.usage.prompt_cache_hit_tokens, 3)
  assert.equal(result.responseId, "resp_x")
})

test("parseStream: 工具调用 added→delta→done 三段组装（多工具）", async () => {
  const events = [
    { type: "response.output_item.added", item: { id: "fc_1", call_id: "call_a", type: "function_call", name: "read" } },
    { type: "response.function_call_arguments.delta", item_id: "fc_1", delta: '{"path":' },
    { type: "response.function_call_arguments.delta", item_id: "fc_1", delta: '"x"}' },
    { type: "response.output_item.done", item: { id: "fc_1", call_id: "call_a", type: "function_call", name: "read", arguments: '{"path":"x"}' } },
    { type: "response.output_item.added", item: { id: "fc_2", call_id: "call_b", type: "function_call", name: "write" } },
    { type: "response.output_item.done", item: { id: "fc_2", call_id: "call_b", type: "function_call", name: "write", arguments: "{}" } },
    { type: "response.completed", response: { id: "resp_1", usage: { input_tokens: 1, output_tokens: 2 } } },
  ]
  const result = await parseStream(mockSSE(events), { onToken: () => {}, onReasoning: () => {} })
  assert.equal(result.toolCalls.length, 2, "多工具并行")
  assert.equal(result.toolCalls[0].name, "read")
  assert.equal(result.toolCalls[0].arguments, '{"path":"x"}')
  assert.equal(result.toolCalls[1].name, "write")
})

test("parseStream: incomplete → finishReason length（截断续写信号）", async () => {
  const events = [
    { type: "response.output_text.delta", delta: "截" },
    { type: "response.incomplete", response: { id: "resp_1", usage: null, incomplete_details: { reason: "max_output_tokens" } } },
  ]
  const result = await parseStream(mockSSE(events), { onToken: () => {}, onReasoning: () => {} })
  assert.equal(result.finishReason, "length")
  assert.equal(result.content, "截")
})

test("isChainInvalidError: 404/400 → 回退；其他失败重试", () => {
  assert.equal(isChainInvalidError(404), true)
  assert.equal(isChainInvalidError(400), true)
  assert.equal(isChainInvalidError(500), false)
  assert.equal(isChainInvalidError(429), false)
})

function mockSSE(events) {
  const payload = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("")
  return {
    body: new ReadableStream({
      start(c) { c.enqueue(new TextEncoder().encode(payload)); c.close() },
    }),
  }
}
