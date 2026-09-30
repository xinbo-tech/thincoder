/**
 * provider/responses.mjs — OpenAI Responses API transport（2026-08-31，PROVIDER.md §13）
 *
 * format: "responses"。双轨设计：
 *  - 本地消息历史仍由 agent 层全量提供（事实源不变）；本 transport 只决定"怎么发"。
 *  - 链模式（stateful）：同一 turn 内工具往返使用 previous_response_id 增量发送，
 *    跨 turn / 压缩 / 换模型自动重置（chainKey 不匹配即全量）——正确性不依赖服务端状态。
 *  - host 白名单：只有已实证支持 previous_response_id 的端点才开链（DeepSeek 官方明说
 *    不支持参数被静默忽略——链发出去被忽略 = 只剩增量 input = 无声丢上下文，必须防）。
 *
 * 事件流规范：流以 response.completed / response.incomplete / response.failed 结束，
 * 没有 "data: [DONE]"。
 */
import { effectiveFetchTimeoutMs } from "./core.mjs"
import { proxyFetch } from "../proxy.mjs"
import { requestWithRetry } from "./retry.mjs"
import { rateGate, recordRate, estimateRequestTokens } from "./rate.mjs"
import { buildBody, normalizeUsage } from "./responses-request.mjs"
// 同名 re-export（2026-09-29 structure-split-2 · 台账 #620——缝 = 同名再出口）：请求构造面出档 `provider/responses-request.mjs`；
// `buildBody` / `isStoreRequiredHost` / `builtinToolsFor` 三名既有导出经本档转口——消费者 import 面零改。
export { buildBody, isStoreRequiredHost, builtinToolsFor } from "./responses-request.mjs"

// 2026-09-01：FETCH_TIMEOUT_MS 常量退役（绝对墙钟废除）——经 core.mjs effectiveFetchTimeoutMs 共用

/** 链失效回退：404/无效 id → 返回 null 表示"应全量重发"；其他失败抛错。 */
export function isChainInvalidError(status) {
  return status === 404 || status === 400
}

/**
 * Responses 事件流解析（事件状态机）。输出与 chat completions 同形：
 * { content, reasoning, toolCalls, usage, finishReason, interrupted? }
 */
export async function parseStream(response, { onToken, onReasoning, signal }) {
  const result = { content: "", reasoning: "", toolCalls: [], usage: null, finishReason: null }
  const slots = new Map() // call_id → { id, name, arguments }
  const itemToCall = new Map() // item_id → call_id（delta 事件用 item_id 定位）
  const order = [] // 槽顺序（output_index 稳定输出）
  result.builtinToolResults = [] // 内置工具（web_search_call）结果 —— agent 层本地化为 tool 消息

  const seal = (finalResponse) => {
    result.toolCalls = order.map((callId) => slots.get(callId)).filter(Boolean)
    if (finalResponse?.usage) result.usage = normalizeUsage(finalResponse.usage)
    if (finalResponse?.id) result.responseId = finalResponse.id
    return result
  }

  try {
    await readResponseStream(response, {
      onToken: (t) => { result.content += t; onToken?.(t) },
    onReasoning: (t) => { result.reasoning += t; onReasoning?.(t) },
    onBuiltinWebSearch: (r) => { result.builtinToolResults.push(r) },
    onFunctionCall: (callId, name, itemId) => {
      if (!slots.has(callId)) {
        slots.set(callId, { id: callId, name, arguments: "" })
        order.push(callId)
      }
      if (itemId) itemToCall.set(itemId, callId)
    },
    onFunctionArgsDelta: (itemId, delta) => {
      const callId = itemToCall.get(itemId)
      const slot = callId ? slots.get(callId) : null
      if (slot) slot.arguments += delta
    },
    onFunctionDone: (callId, fullArgs) => {
      const slot = slots.get(callId)
      if (!slot) return
      if (fullArgs && fullArgs !== slot.arguments) slot.arguments = fullArgs
    },
    onCompleted: seal,
    onIncomplete: (resp) => {
      seal(resp)
      // 非长度原因（content_filter 等）不能报成 "length"——agent 层按原因给用户提示（`agent/run-stages.mjs:43`）
      result.finishReason = resp?.incomplete_details?.reason === "content_filter" ? "content_filter" : "length"
    },
    onFailed: (resp) => {
      const err = resp?.error
      const msg = err?.message ?? JSON.stringify(err ?? {}).slice(0, 500)
      const e = new Error(`responses API failed: ${msg}`)
      e.status = resp?.error?.code
      throw e
    },
  })
  } catch (e) {
    // 用户 Ctrl+I 中断：与 core 同构——提交已生成部分（agent 层 interrupted 分支消费）——
    // 不丢已流出的 token；超时/网络错误仍照常抛（不应伪装成 interrupted）
    if (e?.name === "AbortError" && signal?.aborted && signal?.reason?.interrupt) {
      seal(null)
      return { ...result, interrupted: true, interruptMessage: signal.reason.message }
    }
    throw e
  }

  // 无显式 finished 事件（流异常结束）时也收尾
  if (result.toolCalls.length === 0 && order.length === 0) seal(null)
  return result
}

/** 事件流核心循环（SSE data: 帧，event 序列由 data 内 type 字段标识）。 */
async function readResponseStream(response, handlers) {
  const decoder = new TextDecoder()
  let buffer = ""
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true })
    let idx
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      // 2026-08-31 真机冒烟：①百炼 SSE 帧为 `data:{…}` 无空格（OpenAI/DeepSeek 带空格）——
      // slice(5).trim() 兼容；②帧 event: 头行（百炼 `event:error` 形态：data 无 type 字段，
      // HTTP 200 内嵌业务 400——原实现静默吞掉 = 空内容当回复，必须识别后抛错）。
      const eventHeader = frame.split("\n").find((l) => l.startsWith("event:"))?.slice(6).trim() ?? ""
      const data = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")
      if (!data) continue
      let ev
      try { ev = JSON.parse(data) } catch {
        if (eventHeader === "error") throw new Error(`responses API error frame: ${data.slice(0, 300)}`)
        continue
      }
      if (eventHeader === "error" && !ev.type) {
        const e = new Error(`responses API error ${ev.code ?? ev.status ?? ""}: ${ev.message ?? JSON.stringify(ev).slice(0, 300)}`)
        e.status = 400
        throw e
      }
      handleEvent(ev, handlers)
    }
  }
  buffer += decoder.decode()
  const data = buffer.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")
  if (data) {
    let ev
    try { ev = JSON.parse(data) } catch { return }
    // 残余帧（无 \n\n 定界）同样走完整事件语义：error/failed 帧的错误必须传播——
    // 静默吞 = 空内容当回复（2026-08-31 真机冒烟同类别缺陷，尾部边界版本）
    handleEvent(ev, handlers)
  }
}

function handleEvent(ev, h) {
  switch (ev.type) {
    case "response.output_item.added": {
      const item = ev.item ?? {}
      if (item.type === "function_call") h.onFunctionCall(item.call_id ?? item.id ?? "", item.name ?? "", item.id ?? "")
      break
    }
    case "response.output_text.delta":
      h.onToken?.(ev.delta ?? "")
      break
    case "response.content_part.delta": {
      // OpenRouter 变体（2026-08-31 官方文档核实）：事件名 content_part.delta，part.type 区分
      // output_text / reasoning_text；另以 response.done + data:[DONE] 收尾
      const part = ev.part ?? {}
      if (part.type === "reasoning_text") h.onReasoning?.(ev.delta ?? "")
      else h.onToken?.(ev.delta ?? "")
      break
    }
    case "response.done":
      h.onCompleted?.(ev.response)
      break
    case "response.reasoning_text.delta":
      h.onReasoning?.(ev.delta ?? "")
      break
    case "response.function_call_arguments.delta":
      h.onFunctionArgsDelta?.(ev.item_id ?? "", ev.delta ?? "")
      break
    case "response.output_item.done": {
      const item = ev.item ?? {}
      if (item.type === "function_call") h.onFunctionDone?.(item.call_id ?? item.id ?? "", item.arguments ?? "")
      else if (item.type === "web_search_call") {
        h.onBuiltinWebSearch?.({
          id: item.id ?? "",
          query: item.action?.query ?? "",
          status: item.status ?? "completed",
          sources: item.action?.sources ?? [],
        })
      }
      break
    }
    case "response.completed":
      h.onCompleted?.(ev.response)
      break
    case "response.incomplete":
      h.onIncomplete?.(ev.response)
      break
    case "response.failed":
      h.onFailed?.(ev.response)
      break
    default:
      break
  }
}

/** 主入口：请求 + 链状态推进（与 core.mjs 的 chat 同形返回）。 */
export async function chat(provider, { messages, tools, onToken, onReasoning, onWait, signal, toolChoice, stateful }) {
  const { body: reqBody, previousResponseId, warnings, newChain } = buildBody(provider, messages, tools, { toolChoice, stateful })
  const body = { ...reqBody, ...(previousResponseId ? { previous_response_id: previousResponseId } : {}) }

  // rateGate/recordRate 对齐 core（responses body 无 messages 键——按本地全量 messages 估算）
  const estimated = estimateRequestTokens({ messages })
  await rateGate(provider, estimated, onWait, signal)
  // 定制头展开（PROVIDER.md §21）：provider.headers 在前、内置头在后——同名内置头胜出（三处 fetch 共用）
  const headers = { ...(provider.headers ?? {}), "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` }

  // round2 复验 #1（2026-08-31）：retry 层对 4xx 非可重试是 throw 而非返回——
  // requestWithRetry 从不返回 400/404 响应 → 下方 isChainInvalidError 分支原来不可达（D6 死代码）。
  // 修复：catch 出错（e.status 已由 retry.mjs 挂上）→ 链失效时清链全量重发一次（仅一次，防死循环）。
  let response
  try {
    response = await requestWithRetry(
      () => proxyFetch(`${provider.baseURL}/responses`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
          _headerTimeoutMs: effectiveFetchTimeoutMs(provider),
        _bodyIdleMs: 120_000,
      }, provider.proxyUri),
      { signal, onWait, buildMessage: (status, text) => `Responses API error ${status}: ${text}` },
    )
  } catch (chainErr) {
    if (!isChainInvalidError(chainErr?.status)) throw chainErr
    // 链失效（404/400）：先清残留链再重建——D6 语义是真·全量重发（body.input=items）。
    // 不清链会走 buildBody 的增量分支（`responses-request.mjs:220-227`）：body.input = 裸 function_call_output 且
    // previousResponseId 未随 fullBody 带走 → 服务端 call_id 无归属 → 二次 400（2026-08-31 评审 #1）
    provider._responsesChain = null
    const fresh = buildBody(provider, messages, tools, { toolChoice, stateful, forceStateful: true })
    const fullBody = { ...fresh.body }
    response = await requestWithRetry(
      () => proxyFetch(`${provider.baseURL}/responses`, {
        method: "POST",
        headers,
        body: JSON.stringify(fullBody),
        signal,
          _headerTimeoutMs: effectiveFetchTimeoutMs(provider),
        _bodyIdleMs: 120_000,
      }, provider.proxyUri),
      { signal, onWait, buildMessage: (status, text) => `Responses API error ${status}: ${text}` },
    )
  }
  if (response.ok === false && isChainInvalidError(response.status)) {
    // 2026-08-31 round3 #1：requestWithRetry 唯一返回路径是 response.ok（非 2xx 全部 throw）
    // ——本分支不可达（retry 语义回归时才会走到）。仅作防御：与 catch 分支同处置——
    // 清链后重发 body 仍带旧 previous_response_id（412 注入）是错的——重建全量。
    provider._responsesChain = null
    const fresh2 = buildBody(provider, messages, tools, { toolChoice, stateful, forceStateful: true })
    response = await requestWithRetry(
      () => proxyFetch(`${provider.baseURL}/responses`, {
        method: "POST",
        headers,
        body: JSON.stringify(fresh2.body),
        signal,
          _headerTimeoutMs: effectiveFetchTimeoutMs(provider),
        _bodyIdleMs: 120_000,
      }, provider.proxyUri),
      { signal, onWait, buildMessage: (status, text) => `Responses API error ${status}: ${text}` },
    )
  }
  return finish(provider, response, { onToken, onReasoning, signal, newChain, warnings, estimated })
}

async function finish(provider, response, { onToken, onReasoning, signal, newChain, warnings, estimated }) {
  const result = await parseStream(response, { onToken, onReasoning, signal })
  recordRate(provider, estimated, result.usage)
  // 链状态推进：completed 事件里 response.id 供同一 turn 后续增量；
  // 截断/失败/无 id（部分端点不回传）→ 链作废（后续全量，正确性优先）。
  if (newChain && result.finishReason !== "length" && result.responseId) {
    provider._responsesChain = { ...newChain, id: result.responseId }
  } else {
    provider._responsesChain = null
  }
  result._warnings = warnings
  return result
}
