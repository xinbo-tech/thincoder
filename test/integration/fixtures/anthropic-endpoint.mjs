/**
 * fixtures/anthropic-endpoint.mjs — 本地脚本化假 Anthropic 端点（Messages API · SSE · 零外网 · 零付费端点）。
 *
 * 消费面：`test/integration/anthropic-tool-roundtrip.test.mjs`（集成场景 1-1 / 1-2 / 1-3）与批次探针
 * （判定「夹具按请求内容认摘要请求」这一条规则本身）。夹具本体与场景分居两档，因为识别规则要能被
 * 单独核对：它与场景同住时不可 import，而本套件的固定开销吃掉压缩线 ⇒ 压缩支在三个场景里从不触发，
 * 识别规则**从不走真支**，直接读不到（`#1833` 的失真红就出在这条规则上）。
 *
 * 回**三态**：`tool_use` 回合 · 文本回合 · 摘要回合（按请求内容认，不按请求序号）。
 * 本档只做逐字搬迁（语义零变）：场景档的三例断言一字未动，读数前后一致。
 */
import { createServer } from "node:http"

// ---------- 假 Anthropic 端点（Messages API · SSE · 零外网）----------

const jsonReply = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(payload))
}

const sseReply = (res, events) => {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" })
  for (const [name, data] of events) res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
  res.end()
}

const blocksOf = (message) => (Array.isArray(message?.content) ? message.content : [])

/** 请求体里出现过的全部 tool_result 文本（模型上一回合拿到的工具结果）。 */
const toolResultTexts = (messages) => messages.flatMap((m) => blocksOf(m)
  .filter((b) => b?.type === "tool_result")
  .map((b) => String(b.content)))

/** 客户端最后一句真实发问（跳过 `[System reminder:` 开头的机器注入）。 */
const lastQuestion = (messages) => messages
  .filter((m) => m?.role === "user")
  .flatMap((m) => blocksOf(m).filter((b) => b?.type === "text").map((b) => String(b.text)))
  .filter((t) => !t.startsWith("[System reminder"))
  .at(-1) ?? "(no question)"

const replyText = (messages, results) => `Answer to "${lastQuestion(messages)}": ${results.length > 0 ? results.join(" / ") : "no tool results"}`

const messageStart = { type: "message_start", message: { id: "msg_fake", type: "message", role: "assistant", model: "claude-fake-1", content: [], usage: { input_tokens: 20, output_tokens: 1 } } }

/** 工具回合：一条 assistant 消息、每个调用一个 tool_use 块（≥2 个即 §6.28 G2 的一轮多调用）。 */
const toolUseEvents = (calls) => {
  const events = [["message_start", messageStart]]
  calls.forEach((call, index) => {
    events.push(["content_block_start", { type: "content_block_start", index, content_block: { type: "tool_use", id: call.id, name: call.name, input: {} } }])
    events.push(["content_block_delta", { type: "content_block_delta", index, delta: { type: "input_json_delta", partial_json: JSON.stringify(call.input ?? {}) } }])
    events.push(["content_block_stop", { type: "content_block_stop", index }])
  })
  events.push(["message_delta", { type: "message_delta", delta: { stop_reason: "tool_use" }, usage: { output_tokens: 10 } }])
  events.push(["message_stop", { type: "message_stop" }])
  return events
}

/** 文本回合（正常收尾）。 */
const textEvents = (text) => [
  ["message_start", messageStart],
  ["content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }],
  ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } }],
  ["content_block_stop", { type: "content_block_stop", index: 0 }],
  ["message_delta", { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: text.length } }],
  ["message_stop", { type: "message_stop" }],
]

/**
 * 摘要请求的识别锚 = `SUMMARIZE_PROMPT` 首句（`thincoder-core/context.mjs:20` 起那段指令的唯一开局句）。
 * 压缩摘要在压缩前不存在，只能按**请求内容**认——不用序号：压缩随时可能插在某次对话之前，
 * 「第 1 个请求必是对话」这一序号假设曾把产品的红伪装成夹具的红（`#1833` 失真链）。
 */
export const SUMMARY_SIG = "The conversation above is our work log so far"

/** 末条消息含 `SUMMARIZE_PROMPT` 首句 ⇒ 摘要请求（`content` 可能是字符串，也可能是 Anthropic 的 text 块数组）。 */
export const isSummaryRequest = (messages) => {
  const last = messages.at(-1)
  const text = typeof last?.content === "string"
    ? last.content
    : blocksOf(last).filter((b) => b?.type === "text").map((b) => String(b.text)).join("\n")
  return text.includes(SUMMARY_SIG)
}

/**
 * 起本地假 Anthropic 端点，返回 `{ port, requests, rejections, close }`。
 * `calls` = **首个对话请求**派发的工具调用；其余对话请求一律文本回合（一回合一个请求，不重派），
 * 摘要请求（`summary: true`）一律回一段摘要文本。
 * 对话回合上限是有意为之：若转换层退化成「角色合法、但 assistant 的 tool_use 没了」，这里直接回文本，
 * 回复里没有工具结果，断言当场给出可读失败，而不是反复派工具直到超时。
 */
export function fakeAnthropic({ calls = [] } = {}) {
  const requests = []
  const rejections = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (chunk) => (raw += chunk))
    req.on("end", () => {
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        return jsonReply(res, 400, { type: "error", error: { type: "invalid_request_error", message: "request body is not valid JSON" } })
      }
      const messages = Array.isArray(body.messages) ? body.messages : []
      // 分类先于内容应答：摘要请求 = 压缩链路，不是对话回合（`#1833`：按内容认，不按序号）
      const record = { url: req.url, body, summary: isSummaryRequest(messages) }
      requests.push(record)
      // 上游语义：messages 只收 user / assistant 两种 role（`role:"tool"` 在此被拒）
      const offending = messages.find((m) => m?.role !== "user" && m?.role !== "assistant")
      if (offending) {
        const message = `messages: Unexpected role "${offending.role}". Each message must have a role of "user" or "assistant".`
        rejections.push(message)
        return jsonReply(res, 400, { type: "error", error: { type: "invalid_request_error", message } })
      }
      if (record.summary) return sseReply(res, textEvents("SUMMARY: earlier work compressed."))
      const dialogueRequests = requests.filter((r) => !r.summary).length
      if (calls.length > 0 && dialogueRequests === 1) return sseReply(res, toolUseEvents(calls))
      return sseReply(res, textEvents(replyText(messages, toolResultTexts(messages))))
    })
  })
  const ready = new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)))
  return ready.then((port) => ({
    port,
    requests,
    rejections,
    close: () => new Promise((resolve) => {
      server.closeAllConnections?.()
      server.close(() => resolve())
    }),
  }))
}
