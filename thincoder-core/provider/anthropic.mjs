/**
 * provider/anthropic.mjs — Anthropic Messages API (Claude)
 * Endpoint: POST https://api.anthropic.com/v1/messages
 * Docs: https://docs.anthropic.com/en/api/messages
 */

import { specForModel, requestBudget } from "../config.mjs"
import { proxyFetch } from "../proxy.mjs"
import { requestWithRetry } from "./retry.mjs"
import { effectiveFetchTimeoutMs, effectiveBodyIdleMs } from "./core.mjs"
import { abortError } from "../abort-provenance.mjs"

const ANTHROPIC_VERSION = "2023-06-01"

/** OpenAI 语义 tool_choice → Anthropic tool_choice（2026-08-31 能力层）。
 *  传入值形态：undefined | "auto" | "required" | "none" | {type:"function",function:{name}} */
function mapToolChoice(choice) {
  if (choice === "auto") return { type: "auto" }
  if (choice === "required") return { type: "any" }
  if (choice === "none") return { type: "none" }
  if (choice && typeof choice === "object" && choice.function?.name) return { type: "tool", name: choice.function.name }
  throw new Error(`Invalid tool_choice for Anthropic format: ${JSON.stringify(choice).slice(0, 120)}`)
}


/** Convert OpenAI-format tools to Anthropic format */
export function normalizeTools(tools) {
  return (tools || []).map((t) => ({
    name: t.function.name,
    description: t.function.description || "",
    input_schema: t.function.parameters || { type: "object", properties: {} },
  }))
}

// PROVIDER.md §6.27 常量：告警码唯一发射点 = R7 分支；占位文案由批内单测逐字锁定。
const TOOL_ARGS_MALFORMED = "anthropic-tool-args-malformed"
const CONTINUED_HISTORY_TEXT = "[conversation continued from the history below]"
const EMPTY_TOOL_RESULT = "(no output)"
const RAW_ARGS_EXCERPT = 80

/** R6 ∥ R7：OpenAI 形 `arguments` → Anthropic `input`。
 *  缺 ∥ 空串 ∥ null ⇒ `{}`（R6，无告警）；非法 JSON ∥ 解析结果非普通对象 ⇒ `{}` + 告警（R7）。
 *  不抛：历史是持久的，抛错会让该会话此后每轮必死；真实结果仍在 tool_result 里（D-PR42）。 */
function toolInputOf(raw, toolName, warnings) {
  if (raw == null || raw === "") return {}
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = undefined
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    warnings.push({
      name: TOOL_ARGS_MALFORMED,
      message: `tool "${toolName}" arguments are not a JSON object — input sent as {} (raw: ${String(raw).slice(0, RAW_ARGS_EXCERPT)})`,
    })
    return {}
  }
  return parsed
}

/** R12：`image_url` part → Anthropic image 块（data URL ⇒ base64 source；其余 ⇒ url source）。 */
function imageBlockOf(part) {
  const url = part.image_url?.url || ""
  const data = url.match(/^data:([^;,]+);base64,(.*)$/s)
  if (data) return { type: "image", source: { type: "base64", media_type: data[1], data: data[2] } }
  return { type: "image", source: { type: "url", url } }
}

/** R2–R5 ∥ R12 ∥ 表外默认：单个 OpenAI part → Anthropic 块。 */
function blockOfPart(part) {
  if (!part || typeof part !== "object") return null
  if (part.type === "text") return { type: "text", text: part.text }
  if (part.type === "image_url") return imageBlockOf(part)
  // 表外默认：未列出的 part 类型原样直通（上游按类型拒收 = 显式失败），本层不静默丢弃
  return { ...part }
}

/** R8：tool 消息的 `content` → tool_result 内容；空 ∥ 缺失 ⇒ 占位（`record-results.mjs:85` 原样推，无 stdout 的成功调用 = ""）。 */
function toolResultText(content) {
  if (typeof content === "string") return content === "" ? EMPTY_TOOL_RESULT : content
  if (content == null) return EMPTY_TOOL_RESULT
  return content // 表外（本仓只产出字符串）：原样透传，由上游显式判收
}

/** R8 ∥ R9 ∥ R10：user 消息内 `tool_result` 恒在其它块之前（官方约束，§6.27 R8）。 */
function toolResultsFirst(blocks) {
  if (!blocks.some((b) => b.type === "tool_result")) return blocks
  return [...blocks.filter((b) => b.type === "tool_result"), ...blocks.filter((b) => b.type !== "tool_result")]
}

/**
 * PROVIDER.md §6.27：OpenAI 形态会话历史 → Anthropic Messages API 形态（纯函数）。
 * 返回 `{ messages, warnings }`（I5 ∥ I6）；入参零写——历史是四条通道共用的持久表示。
 * system 已由 `chat()` 抽到顶层（R1），本函数只处理其余消息。
 */
export function convertMessages(messages) {
  const out = []
  const warnings = []
  const push = (role, blocks) => {
    if (blocks.length === 0) return // R13：空块消息丢弃（上游拒收空 content 数组——I3）
    const ordered = role === "user" ? toolResultsFirst(blocks) : blocks
    const last = out[out.length - 1]
    if (last && last.role === role) {
      // R10：转换后相邻同 role 合并，块按原序拼接（user 侧 tool_result 仍恒在前）
      last.content = role === "user" ? toolResultsFirst([...last.content, ...ordered]) : [...last.content, ...ordered]
      return
    }
    out.push({ role, content: ordered })
  }

  for (const m of messages) {
    if (!m || typeof m !== "object") continue
    if (m.role === "system") continue // R1：system 由 chat() 抽到顶层，永不进 messages
    if (m.role === "tool") {
      // R8 ∥ R9：tool 消息 ⇒ 含 tool_result 块的 user 消息（连续多条经 push 的合并自然并入同一条）
      push("user", [{ type: "tool_result", tool_use_id: m.tool_call_id, content: toolResultText(m.content) }])
      continue
    }
    const blocks = []
    if (typeof m.content === "string") {
      if (m.content !== "") blocks.push({ type: "text", text: m.content }) // R13：空串 ⇒ 零块
    } else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        const block = blockOfPart(part)
        if (block) blocks.push(block)
      }
    }
    if (m.role === "assistant") {
      // R5：tool_calls 追加 tool_use 块；文本块在前、tool_use 块在后
      for (const tc of m.tool_calls ?? []) {
        if (!tc || typeof tc !== "object") continue
        blocks.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function?.name,
          input: toolInputOf(tc.function?.arguments, tc.function?.name, warnings),
        })
      }
    }
    // user ∥ 未列出的 role：按 user 收口（出口 role 只允许 user/assistant——I1）
    push(m.role === "assistant" ? "assistant" : "user", blocks)
  }

  // R11：首条须 user（精简历史可 assistant 开头）；全空输入不造占位消息（I1）
  if (out.length > 0 && out[0].role !== "user") {
    out.unshift({ role: "user", content: [{ type: "text", text: CONTINUED_HISTORY_TEXT }] })
  }
  return { messages: out, warnings }
}

/** Build and send an Anthropic chat request. Returns the same shape as core.mjs chat.
 *  2026-08-31 会诊 #6：接入 rateGate/recordRate + 429 Retry-After 单次重试
 *  （原实现完全绕过 TPM/RPM 闸门与记账——用户配了 tpm 以为受控实际不受控）。
 *  注：5xx/网络退避重试未与 OpenAI 格式对齐（三 transport 共用那步工作量大，见报告）。 */
export async function chat(provider, { messages, tools, onToken, onReasoning, onWait, signal, toolChoice, parallelToolCalls }) {
  // Extract system message(s) — Anthropic uses top-level `system` field
  const systemMessages = []
  const chatMessages = []
  for (const m of messages) {
    if (m.role === "system") {
      systemMessages.push(typeof m.content === "string" ? m.content : JSON.stringify(m.content))
    } else {
      chatMessages.push(m)
    }
  }

  // PROVIDER.md §6.27：OpenAI 形态历史 → Messages API 形态（system 抽离之后、请求体组装之前）
  const { messages: adaptedMessages, warnings } = convertMessages(chatMessages)

  const spec = specForModel(provider.model)
  const body = {
    model: provider.model,
    messages: adaptedMessages,
    stream: true,
    // §6.17 发送面同源：anthropic 恒发 max_tokens（显式 ?? 规格 maxOutput——原第三级兜底不可达已随本批删净，
    // §6.17「装配面不留第二算式」）
    max_tokens: requestBudget(provider).maxTokens,
  }
  if (systemMessages.length > 0) body.system = systemMessages.join("\n\n")
  if (tools?.length) body.tools = tools
  // 2026-08-31：tool_choice 能力层——OpenAI 语义映射到 Anthropic tool_choice
  // （auto→{type:"auto"} / required→{type:"any"} / none→{type:"none"} / 具体函数→{type:"tool",name}）
  if (toolChoice !== undefined) body.tool_choice = mapToolChoice(toolChoice)
  if (provider.temperature != null) {
    let t = provider.temperature
    // Anthropic API hard limit is 0-1; models without a declared tempRange still get clamped
    const [tMin, tMax] = spec.tempRange ?? [0, 1]
    t = Math.min(tMax, Math.max(tMin, t))
    t = Math.round(t * 100) / 100
    body.temperature = t
  }

  // 2026-09-01：FETCH_TIMEOUT_MS 常量退役（绝对墙钟废除）——anthropic/responses 经 core.mjs 的
// effectiveFetchTimeoutMs 共用；响应头阶段 600s 默认，body 阶段 idle 超时。
  const headers = {
    ...(provider.headers ?? {}), // 定制头展开（PROVIDER.md §21）：定制头在前、内置头在后——同名内置头胜出
    "Content-Type": "application/json",
    "x-api-key": provider.apiKey,
    "anthropic-version": ANTHROPIC_VERSION,
  }

  // Active signal check
  if (signal?.aborted) throw abortError(signal, "provider", "transport-anthropic")

  // 会诊 #6：TPM/RPM 闸门 + 记账（rate.mjs 与 OpenAI 格式共用同一窗口）
  const { rateGate, recordRate } = await import("./rate.mjs")
  const estimated = await (async () => {
    const { estimateRequestTokens } = await import("./rate.mjs")
    return estimateRequestTokens(body)
  })()
  await rateGate(provider, estimated, onWait, signal)

  // 2026-08-31：4xx/5xx/网络与 OpenAI 格式统一退避重试链（原仅 429 Retry-After 单次重试，
  // 5xx 直接抛——DeepSeek/Claude 排队 503 时其他格式可自动恢复，这里语义割裂）
  const response = await requestWithRetry(
    () => proxyFetch(`${provider.baseURL}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      // 2026-09-01：同 core.mjs——绝对墙钟废除（长生成被 10min 腰斩），signal 只保留用户取消链；
      // 响应头阶段仍用 fetchTimeoutMs（600s 默认），body 阶段由 parseAnthropicStream 读侧 idle 管
      signal,
      _headerTimeoutMs: effectiveFetchTimeoutMs(provider),
      _bodyIdleMs: effectiveBodyIdleMs(provider),
    }, provider.proxyUri),
    { signal, onWait, buildMessage: (status, text) => `Anthropic API error ${status}: ${text}` },
  )

  const result = await parseAnthropicStream(response, { onToken, onReasoning, signal })
  recordRate(provider, estimated, result.usage)
  const finished = finishAnthropic(result)
  // §6.27 告警投递：R7 的畸形参数告警并入既有 `_warnings` 机读线（消费面 agent/run-stages.mjs:44-45）
  finished._warnings = [...(finished._warnings ?? []), ...warnings]
  return finished
}

/** Anthropic `stop_reason` ⇒ 核统一 `finishReason`（§6.31.7 F-DA5——归一只喂既有分类；
 *  余者原样透传）。缺席 ⇒ null（缺席支 = agent/run-stages.mjs 同面提醒 + 留痕）。 */
function mapAnthropicStopReason(reason) {
  if (reason === "end_turn" || reason === "stop_sequence") return "stop"
  if (reason === "tool_use") return "tool_calls"
  if (reason === "max_tokens") return "length"
  return reason
}

/** Convert the parsed stream to the core.mjs result shape (usage → OpenAI-compatible). */
function finishAnthropic(result) {
  const usage = result.usage
  if (usage) {
    return {
      content: result.content,
      reasoning: result.reasoning,
      finishReason: result.finishReason ?? null, // §6.31.7 F-DA5（原三 transport 恒 null——字段值收正）
      usage: {
        prompt_tokens: usage.input_tokens ?? 0,
        completion_tokens: usage.output_tokens ?? 0,
        total_tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
        prompt_cache_hit_tokens: usage.cache_read_input_tokens ?? 0,
        prompt_cache_miss_tokens: usage.cache_creation_input_tokens ?? 0,
      },
      toolCalls: result.toolCalls,
    }
  }
  return { content: result.content, reasoning: result.reasoning, finishReason: result.finishReason ?? null, toolCalls: result.toolCalls }
}

/**
 * Parse Anthropic SSE stream.
 * Events: message_start, content_block_start, content_block_delta, content_block_stop, message_delta, message_stop
 */
async function parseAnthropicStream(response, { onToken, onReasoning, signal }) {
  const result = { content: "", reasoning: "", toolCalls: [], usage: null, finishReason: null }
  const decoder = new TextDecoder()
  let buffer = ""
  const toolBlocks = new Map()

  const processEvent = (eventType, data) => {
    if (!data) return
    let json
    try { json = JSON.parse(data) } catch { return }

    switch (eventType) {
      case "message_start":
        if (json.message?.usage) result.usage = json.message.usage
        break
      case "content_block_start": {
        const block = json.content_block
        if (block?.type === "tool_use") {
          toolBlocks.set(json.index, { id: block.id, name: block.name, arguments: "" })
        }
        break
      }
      case "content_block_delta": {
        const delta = json.delta
        if (delta?.type === "text_delta" && delta.text) {
          result.content += delta.text
          onToken?.(delta.text)
        } else if (delta?.type === "thinking_delta" && delta.thinking) {
          result.reasoning += delta.thinking
          onReasoning?.(delta.thinking)
        } else if (delta?.type === "input_json_delta" && delta.partial_json) {
          const block = toolBlocks.get(json.index)
          if (block) block.arguments += delta.partial_json
        }
        break
      }
      case "message_delta":
        if (json.usage) result.usage = json.usage
        // §6.31.7 F-DA5（#929 · 批 digest-accounting）：`stop_reason` 捕获——缺席 ⇒ 留 null（窄口）
        if (json.delta?.stop_reason) result.finishReason = mapAnthropicStopReason(json.delta.stop_reason)
        break
      case "message_stop":
        for (const [, block] of toolBlocks) {
          result.toolCalls.push({ id: block.id, name: block.name, arguments: block.arguments })
        }
        break
    }
  }

  if (!response.body) throw new Error("No stream response body")
  let currentEvent = ""
  let currentData = ""

  for await (const chunk of response.body) {
    if (signal?.aborted) {
      throw abortError(signal, "provider", "transport-anthropic")
    }
    buffer += decoder.decode(chunk, { stream: true })
    // BOM 剥除（会诊 #12）：首个 chunk 可能带 \uFEFF，否则 message_start 事件被静默丢失（含 usage）
    if (buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1)
    const lines = buffer.split("\n")
    buffer = lines.pop()

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        if (currentEvent) processEvent(currentEvent, currentData)
        currentEvent = line.slice(7).trim()
        currentData = ""
      } else if (line.startsWith("data: ")) {
        currentData = line.slice(6).trim()
      } else if (line === "" || line === "\r") { // CRLF 空行是 "\r"（会诊 #13）
        if (currentEvent) processEvent(currentEvent, currentData)
        currentEvent = ""
        currentData = ""
      }
    }
  }
  // Flush remaining
  buffer += decoder.decode()
  for (const line of buffer.split("\n")) {
    if (line.startsWith("event: ")) {
      if (currentEvent) processEvent(currentEvent, currentData)
      currentEvent = line.slice(7)
    } else if (line.startsWith("data: ")) {
      currentData = line.slice(6)
    }
  }
  if (currentEvent) processEvent(currentEvent, currentData)

  return result
}
