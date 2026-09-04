/**
 * provider/core.mjs — LLM call core
 * chat / listModels / createProvider / requestWithRetry
 * SSE parsing → provider/sse.mjs
 */

import { providerSpec, resolveEnableThinking } from "../config.mjs"
import { proxyFetch } from "../proxy.mjs"
import { escapeMessages, stripLocalMessageFields } from "../escape.mjs"
import { logEvent, errText, classifyErr, headText } from "../log.mjs"
import { recordChatTrace } from "../traces/trace-store.mjs"
import { readSSE } from "./sse.mjs"
export { readSSE } from "./sse.mjs"
import {
  RETRYABLE_STATUS, MAX_RETRIES, MAX_CONTINUATIONS,
  RATE_LIMIT_BACKOFF_MS, _rateHooks,
  estimateRequestTokens, rateGate, recordRate,
} from "./rate.mjs"

// 2026-09-01：FETCH_TIMEOUT_MS 常量退役（绝对墙钟语义废除）——fetchTimeoutMs 现为每调用从 provider 读（config 归一化），见 effectiveFetchTimeoutMs。

/** 可中断 sleep（会诊 #5）：退避/Retry-After/overload 等待期 Ctrl+C 立即生效；内部走 _rateHooks.sleep（测试替换点） */
function abortDOM(signal) {
  const e = new DOMException("The operation was aborted", "AbortError")
  e.reason = signal.reason
  return e
}

async function sleepInterruptible(ms, signal) {
  if (!signal) return _rateHooks.sleep(ms)
  if (signal.aborted) throw abortDOM(signal)
  return new Promise((resolve, reject) => {
    const onAbort = () => { signal.removeEventListener("abort", onAbort); reject(abortDOM(signal)) }
    signal.addEventListener("abort", onAbort, { once: true })
    _rateHooks.sleep(ms).then(
      () => { signal.removeEventListener("abort", onAbort); resolve() },
      (e) => { signal.removeEventListener("abort", onAbort); reject(e) },
    )
  })
}

/** Create a validated provider config object from raw config */
export function createProvider(config) {
  if (!config?.baseURL) throw new Error("provider config: baseURL is required — configure providers in ~/.thincoder/config.json")
  if (!config?.apiKey) throw new Error("provider config: apiKey is required — configure it in ~/.thincoder/config.json")
  if (!config?.model) throw new Error("provider config: model is required — configure in ~/.thincoder/config.json")
  return {
    baseURL: config.baseURL.replace(/\/+$/, ""),
    apiKey: config.apiKey,
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    thinking: config.thinking,
    reasoningEffort: config.reasoningEffort,
    tpm: config.tpm,
    rpm: config.rpm,
    format: config.format,
    chatPath: config.chatPath,
    proxy: config.proxy,
    proxyUri: config.proxyUri,
  }
}

/** Send a streaming chat completion request with automatic continuation on truncation */
// 2026-09-01 根因修复：600s 绝对墙钟曾腰斩长上下文子代理（eng-coder TTFB>10min 即死）——TTFB 阶段改用
// fetchTimeoutMs（默认 600s，agent.fetchTimeoutMs 可配），body 阶段 idle 超时（FETCH_BODY_IDLE_MS，无新数据才断）。
const FETCH_BODY_IDLE_MS = 120_000
/** §14.2 设计值：prefix 续写只保留最近 8 条非工具文本（截断点语境足够，N 以测试锁定） */
const PREFIX_CONTINUATION_KEEP = 8

/** 2026-09-01：响应头阶段超时（默认 600s，agent.fetchTimeoutMs 可配）——anthropic/responses transport 共用 */
export function effectiveFetchTimeoutMs(provider) {
  return Number.isFinite(provider?.fetchTimeoutMs) && provider.fetchTimeoutMs > 0 ? provider.fetchTimeoutMs : 600_000
}

export async function chat(provider, opts = {}) {
  // LOGGING（docs/design/LOGGING.md）：llm:* 事件统一在此落点——所有 chat 调用
  // （主回合/消化轮/compress/distill/advisor/子代理/auto-think/consult）都经本函数，
  // 格式分派（anthropic/google/responses）在内部——单点覆盖即 llm:* 全覆盖。
  // 续写/重试各自为独立 HTTP 请求——续写递归（下方 chatImpl 内）会再包一层（嵌套
  // llm:start/done 对——每请求一事件）；重试在 requestWithRetry 内部不可见。
  // §18.6 完整轨迹存档（AGENT-LOOP.md §18.6 N-TR2——权威句 D-TR1）：采集点唯一=
  // 本函数出口——所有 chat 调用（主回合/消化轮/compress/distill/advisor/子代理/
  // auto-think/consult）都经本函数；续写/重试在出口已合并——reasoning 全量才完整。
  const logCtx = opts.logCtx ?? {}
  const t0 = Date.now()
  const pname = provider?.name ?? provider?.model ?? "unknown"
  logEvent("llm:start", { provider: pname, model: provider?.model ?? "", stage: logCtx.stage, turn: logCtx.turn, auto: logCtx.auto === true, child: logCtx.child })
  try {
    const result = await chatImpl(provider, opts)
    logEvent("llm:done", {
      provider: pname, model: provider?.model ?? "",
      ms: Date.now() - t0,
      stage: logCtx.stage, turn: logCtx.turn, auto: logCtx.auto === true, child: logCtx.child,
      head: headText(result?.content ?? "", 300, { paragraph: true }),
      len: String(result?.content ?? "").length,
      finish: result?.finishReason ?? null,
      tools: Array.isArray(result?.toolCalls) ? result.toolCalls.length : 0,
    })
    // §18.6 D-TR1/D-TR5：出口收集——成功路径轨迹（含 content/reasoning 全文/toolCalls）
    recordChatTrace(provider, opts, result, null)
    return result
  } catch (e) {
    logEvent("llm:error", {
      provider: pname, model: provider?.model ?? "",
      ms: Date.now() - t0,
      stage: logCtx.stage, turn: logCtx.turn, auto: logCtx.auto === true, child: logCtx.child,
      err: errText(e, 200),
      kind: classifyErr(e, opts.signal),
    })
    // §18.6 D-TR5：失败路径也落盘——error（errText 截断 + 类别）+ finishReason:null
    recordChatTrace(provider, opts, null, e)
    throw e
  }
}

/** chat 本体（LOG(LLM) 事件包装之外——见上方 chat 包装器）。 */
async function chatImpl(provider, { messages, tools, onToken, onReasoning, onWait, signal, streamRules, firedPatterns, toolChoice, parallelToolCalls, logCtx }) {
  // Sanitize BEFORE format dispatch — image poisoning bricks anthropic/google sessions
  // the same way it bricks OpenAI-format ones (all raster-only).
  // providerSpec: spec with the provider-level context override (PROVIDER.md §15) — the
  // window/clamping logic below reads the overridden value where it matters.
  const spec = providerSpec(provider)
  messages = stripImagesForTextModel(messages, spec)
  // SESSION.md §9 T-S3: local-only message fields (ts/transient) never reach the wire.
  // Stripped BEFORE format dispatch — anthropic/responses transports pass whole message
  // objects through verbatim (only the OpenAI path ran escapeMessages). Copy-on-write:
  // history keeps the fields, the request never sees them.
  messages = stripLocalMessageFields(messages)
  const _debugBeforeLen = process.env.THIN_DEBUG_BODY ? JSON.stringify(messages).length : 0

  // Format dispatch: delegate to non-OpenAI transports
  if (provider.format === "anthropic") {
    const { chat: anthropicChat } = await import("./anthropic.mjs")
    const { normalizeTools } = await import("./anthropic.mjs")
    const result = await anthropicChat(provider, {
      messages,
      tools: tools?.length ? normalizeTools(tools) : null,
      onToken, onReasoning, onWait, signal, toolChoice,
    })
    return result
  }
  if (provider.format === "google") {
    const { chat: geminiChat } = await import("./google.mjs")
    const { normalizeTools } = await import("./google.mjs")
    const result = await geminiChat(provider, {
      messages,
      tools: tools?.length ? normalizeTools(tools) : null,
      onToken, onReasoning, onWait, signal, toolChoice,
    })
    return result
  }
  if (provider.format === "responses") {
    // 2026-08-31：Responses API transport（PROVIDER.md §13）——双轨链在 transport 内部
    // 自行管理（provider._responsesChain），agent 层零改动。
    // round3 #3：配对归一化必须在此分派前（压缩/中断遗留的孤儿 tool 消息发向严格服务端会 400）
    messages = normalizeToolPairing(messages)
    const { chat: responsesChat } = await import("./responses.mjs")
    return responsesChat(provider, {
      messages,
      tools,
      onToken, onReasoning, onWait, signal, toolChoice,
    })
  }

  messages = normalizeToolPairing(messages)
  // 中和服务端的非标二次转义：会话里若出现字面 "\x"/"\u"（如讨论转义、grep 到含
  // 转义的代码），Kimi 等会把它们当 hex escape 再解析 → "unexpected end of hex escape" 400。
  // 发送前统一 double 掉会形成非法转义的序列（合法 \xNN/\uNNNN 不受影响）。
  messages = escapeMessages(messages)
  if (process.env.THIN_DEBUG_BODY) {
    console.error(`[debug-body] escape: ${_debugBeforeLen} -> ${JSON.stringify(messages).length} chars, ${messages.length} msgs (provider=${provider.name}, model=${provider.model})`)
  }
  // Compile string-pattern rules to RegExp at call time
  const rules = compileStreamRules(streamRules)
  const body = {
    model: provider.model,
    messages,
    stream: true,
  }
  // Skip usage stream for models that don't support it (GLM, MiniMax, Gemini)
  if (!spec.noUsageStream) body.stream_options = { include_usage: true }
  if (provider.maxTokens) body.max_tokens = provider.maxTokens
  if (provider.temperature != null) {
    let t = provider.temperature
    if (spec.tempRange) {
      t = Math.min(spec.tempRange[1], Math.max(spec.tempRange[0], t))
      t = Math.round(t * 100) / 100
    }
    body.temperature = t
  }
  if (provider.thinking) body.thinking = provider.thinking
  // reasoning_effort is a provider-native parameter — routers/proxies (model ID with "/"
  // prefix like kimi/kimi-k3) may misinterpret it, causing empty responses or 400s.
  const isRouter = provider.model.includes("/")
  if (provider.reasoningEffort && !isRouter && provider.format !== "anthropic" && provider.format !== "google") {
    if (spec.reasoningEffortEnum && !spec.reasoningEffortEnum.includes(provider.reasoningEffort)) {
      throw new Error(
        `reasoning_effort "${provider.reasoningEffort}" not supported by model "${provider.model}"; ` +
        `valid values: ${spec.reasoningEffortEnum.join(", ")}`
      )
    }
    body.reasoning_effort = provider.reasoningEffort
  }
  // enable_thinking — Bailian hybrid-thinking switch (PROVIDER.md §12): qwen3.x defaults to
  // thinking ON, so an explicit off must send enable_thinking:false or the server keeps thinking.
  // NOT gated by isRouter: the whitelist keys on model prefix + Bailian host, not the model-ID slash.
  const enableThinking = resolveEnableThinking(provider, spec)
  if (enableThinking !== undefined) body.enable_thinking = enableThinking
  if (tools?.length) body.tools = tools
  // 2026-08-31：tool_choice 能力层（透传 OpenAI 语义）；
  // parallel_tool_calls 仅显式 true 时发送（默认不发=不改变现有行为）
  if (toolChoice !== undefined) body.tool_choice = toolChoice
  if (parallelToolCalls === true) body.parallel_tool_calls = true

  const estimated = estimateRequestTokens(body)
  await rateGate(provider, estimated, onWait, signal)

  const response = await requestWithRetry(provider, body, signal, onWait)
  const result = await readSSE(response, { onToken, onReasoning, rules, signal, firedPatterns })
  recordRate(provider, estimated, result.usage)

  // Stream rule triggered, user interrupted, or network partial — return immediately.
  // 2026-08-31 会诊 #2：partial（网络错误中断但已有内容）与 interrupted 同级透传，
  // 不再让上层把已收内容当整轮失败重试（重试从零开始浪费已流出的成本）。
  if (result.ruleTriggered) return result
  if (result.interrupted) return result
  if (result.partial) return result

  // Retry on transient server overload (DeepSeek: insufficient_system_resource)
  const MAX_OVERLOAD_RETRIES = 1
  for (let r = 0; result.finishReason === "insufficient_system_resource" && r <= MAX_OVERLOAD_RETRIES; r++) {
    if (r > 0) {
      onWait?.({ phase: "overloaded", seconds: 3 })
      await sleepInterruptible(3000, signal)
    }
    const retryResponse = await requestWithRetry(provider, body, signal, onWait)
    const retryResult = await readSSE(retryResponse, { onToken, onReasoning })
    recordRate(provider, estimated, retryResult.usage)
    if (retryResult.finishReason !== "insufficient_system_resource") {
      // Merge any partial content from the failed attempt (streaming already showed it)
      result.content += retryResult.content
      result.reasoning += retryResult.reasoning ?? ""
      mergeRetryToolCalls(result, retryResult.toolCalls)
      result.finishReason = retryResult.finishReason
      if (retryResult.usage) result.usage = retryResult.usage
      break
    }
    // Retry exhausted — keep the partial result with insufficient_system_resource finish_reason
  }

  if (!spec.partialMode && !spec.prefixMode) return result
  for (let n = 0; result.finishReason === "length" && result.content && n < MAX_CONTINUATIONS; n++) {
    let continued
    try {
      continued = await chat(spec.prefixMode ? { ...provider, baseURL: betaBaseURL(provider.baseURL) } : provider, {
        messages: buildContinuationMessages(messages, result, spec),
        tools,
        onToken,
        onReasoning,
        onWait,
        signal,
        // §18.6：续写是同一逻辑调用的子请求——logCtx 原样透传（元数据与门控
        // traces.enabled 对续写调用同样生效，不在出口静默越过开关）
        // fix round1（D-TR1）：续写子请求标记 isContinuation:true（T-TR14——true =
        // 该调用是续写链的一环；外层新调用 false）——分析"纠结"时区分续写/重试链。
        logCtx: { ...logCtx, isContinuation: true },
      })
    } catch (error) {
      // §14.3 失败可见性：续写失败注入 _warnings（agent 机读线可见）不整轮飞出；AbortError 用户中断透传
      if (error?.name === "AbortError") throw error
      result._warnings ??= []
      result._warnings.push({ name: "continuation-failed", message: `output continuation failed: ${error.message}` })
      break
    }
    result.content += continued.content
    result.reasoning += continued.reasoning ?? ""
    mergeRetryToolCalls(result, continued.toolCalls)
    result.finishReason = continued.finishReason
    if (continued.usage) {
      const sum = (k) => (result.usage?.[k] ?? 0) + (continued.usage[k] ?? 0)
      result.usage = {
        prompt_tokens: sum("prompt_tokens"),
        completion_tokens: sum("completion_tokens"),
        total_tokens: sum("total_tokens"),
        prompt_cache_hit_tokens: sum("prompt_cache_hit_tokens"),
        prompt_cache_miss_tokens: sum("prompt_cache_miss_tokens"),
      }
    }
  }
  return result
}

/** 续写消息构造（§14.3）：prefix 精简历史（§14.2——deepseek /beta 网关对含工具链历史必 400，真机矩阵）；partial 保持现状 */
export function buildContinuationMessages(messages, result, spec) {
  const tail = (extra) => ({ role: "assistant", content: result.content, ...extra, ...(result.reasoning ? { reasoning_content: result.reasoning } : {}) })
  if (!spec.prefixMode) return [...messages, tail({ partial: true })]
  const slim = messages.filter((m) => m.role !== "tool" && !(m.role === "assistant" && m.tool_calls?.length))
  return [...slim.filter((m) => m.role === "system"), ...slim.filter((m) => m.role !== "system").slice(-PREFIX_CONTINUATION_KEEP), tail({ prefix: true })]
}

/**
 * Replace image parts with text placeholders when they would 400 the request:
 * - the model has no vision support at all (history may carry image_url parts from a
 *   session resumed after switching from a vision model — text-only APIs like DeepSeek
 *   reject the ENTIRE request, bricking the conversation);
 * - the model IS vision-capable but the data URL is not a raster format it can ingest
 *   (Kimi/Anthropic/OpenAI/Gemini are all raster-only — Kimi 400s "unsupported image
 *   format" on EVERY subsequent request once an svg/bmp part sits in history).
 * Sanitize at send time — history itself is left untouched, so switching back to a
 * capable model/format restores the images. Non-data-URL image refs (http) pass through.
 */
// Pre-send payload normalization lives in normalize.mjs (2026-08-31 extract,
// TODO #2); re-exported so provider/index.mjs and tool-pairing.test.mjs keep
// their import paths.
import { stripImagesForTextModel, normalizeToolPairing } from "./normalize.mjs"
export { stripImagesForTextModel, normalizeToolPairing }
/** Merge tool calls from a retry/continuation into the accumulated result.
 *  2026-08-31 会诊 #7/#17：readSSE 输出的 tc 已 finalize（无 index 字段），
 *  原实现恒 append（重试里 provider 重发完整 tc → tool 名 "get_weatherget_weather"、
 *  arguments 重复）。改按 id 定位已有槽位、无 id 才追加；name 只设一次。 */
function mergeRetryToolCalls(result, toolCalls) {
  for (const tc of toolCalls ?? []) {
    if (!tc) continue
    let s
    if (tc.id) {
      s = result.toolCalls.find((x) => x && x.id === tc.id)
    }
    if (!s) {
      // 无 id（synthetic call_N 在重试间不稳定）或未命中：按 name 找同 slot（重试语义
      // 是"同一批工具调用重新执行"，同名合并最稳）；仍找不到才追加。
      s = tc.name ? result.toolCalls.find((x) => x && x.name === tc.name) : undefined
    }
    if (!s) {
      s = { id: "", name: "", arguments: "" }
      result.toolCalls.push(s)
    }
    if (tc.id && !s.id) s.id = tc.id
    if (tc.name && !s.name) s.name = tc.name
    s.arguments += tc.arguments ?? ""
  }
}

/** List available model IDs from the provider's /models endpoint */
export async function listModels(provider, { signal } = {}) {
  // 2026-08-31 会诊 #10：与 chat 路径对齐——走 proxyUri、加 15s 超时、JSON 解析兜底
  // （原实现直连 fetch 无超时无代理，慢/被墙域名的 /models 会挂死 UI）
  const url = `${provider.baseURL}/models`
  const opts = {
    headers: { ...(provider.headers ?? {}), Authorization: `Bearer ${provider.apiKey}` },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
    _headerTimeoutMs: 15_000,
    _bodyIdleMs: 15_000,
  }
  const response = await (provider.proxyUri ? proxyFetch(url, opts, provider.proxyUri) : fetch(url, opts))
  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`GET /models failed ${response.status}: ${text}`)
  }
  const data = await response.json().catch(() => null)
  return (data?.data ?? []).map((m) => m.id).filter(Boolean).sort()
}

async function requestWithRetry(provider, body, signal, onWait) {
  // THIN_DEBUG_BODY=1：发送前诊断——复现网关侧 "unexpected end of hex escape" 400 时
  // 定位真实载荷里的毒序列（2026-08-31 slot 3 deepseek-v4-flash）。模拟网关最宽松的
  // 爆炸条件：任何字面 "\u"/"\x" 后不足位（不看前置反斜杠）。
  if (process.env.THIN_DEBUG_BODY) {
    try {
      const msgs = body?.messages ?? []
      const raw = JSON.stringify(body)
      const hits = []
      for (let i = 0; i < msgs.length; i++) {
        const m = msgs[i] ?? {}
        const fields = []
        if (typeof m.content === "string") fields.push(["content", m.content])
        else if (Array.isArray(m.content)) m.content.forEach((p, pi) => { if (p && typeof p.text === "string") fields.push([`content[${pi}]`, p.text]) })
        if (typeof m.reasoning_content === "string") fields.push(["reasoning_content", m.reasoning_content])
        if (Array.isArray(m.tool_calls)) m.tool_calls.forEach((tc, ti) => { if (tc && typeof tc.arguments === "string") fields.push([`tool_calls[${ti}].arguments`, tc.arguments]) })
        if (typeof m.name === "string") fields.push(["name", m.name])
        for (const [f, t] of fields) {
          const re = /\\[xu]/g
          let mm
          while ((mm = re.exec(t))) {
            const c = t[mm.index + 1]
            const need = c === "u" ? 4 : 2
            const after = t.slice(mm.index + 2, mm.index + 2 + need)
            if (!new RegExp(`^[0-9a-fA-F]{${need}}$`).test(after)) {
              hits.push({ i, role: m.role, field: f, ctx: t.slice(Math.max(0, mm.index - 40), mm.index + 12) })
            }
          }
        }
      }
      console.error(`[debug-body] messages=${msgs.length} bodyLen=${raw.length} suspicious=${hits.length}`)
      for (const h of hits.slice(0, 20)) console.error("[debug-body] hit", JSON.stringify(h))
      if (!hits.length && msgs[1151]) {
        console.error("[debug-body] no suspicious hit; messages[1151] =", JSON.stringify({ role: msgs[1151].role, contentLen: msgs[1151].content?.length, contentHead: String(msgs[1151].content).slice(0, 150) }))
      }
    } catch (e) {
      console.error("[debug-body] diag failed:", e.message)
    }
  }
  let lastError
  let lastStatus = 0
  let lastWas429 = false
  let rateLimitHits = 0
  const totalAttempts = MAX_RETRIES + 1
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0 && !lastWas429) await sleepInterruptible(2 ** (attempt - 1) * 1000, signal)
    lastWas429 = false

    let response
    try {
      const url = `${provider.baseURL}${provider.chatPath ?? "/chat/completions"}`
      const opts = {
        method: "POST",
        headers: {
          ...(provider.headers ?? {}), // custom per-provider headers (desktop proposal ④: X-Device-Id etc.)
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(body),
        // 2026-09-01 根因修复：原 600s 绝对墙钟会腰斩长上下文子代理（TTFB/首 token >10min 即死）。
        // 拆分语义：响应头阶段仍用 fetchTimeoutMs（600s，覆盖网关排队）；body 阶段由读侧 idle 超时管
        // （sse.mjs readIdleMs——无新数据才断）。signal 只保留用户取消链，不再叠加绝对墙钟。
        signal,
        // 2026-08-31 会诊 #4：代理路径响应头超时对齐直连语义（原 15s 与直连 600s 割裂，
        // DeepSeek 排队 TTFB>15s 即误报）— 仅 _ 前缀内部字段，proxyFetch 消费
        _headerTimeoutMs: effectiveFetchTimeoutMs(provider),
        _bodyIdleMs: FETCH_BODY_IDLE_MS,
      }
      response = provider.proxyUri
        ? await proxyFetch(url, opts, provider.proxyUri)
        : await fetch(url, opts)
    } catch (error) {
      if (error.name === "AbortError") throw error
      lastError = error
      continue
    }

    if (response.ok) return response

    const text = await response.text().catch(() => "")
    let message = `LLM API error ${response.status}: ${text}`
    // 401 双平台提示 + 诊断回显（2026-08-31 会诊 #15）：
    // Kimi 双平台 key 不互通的提示保留；通用加 baseURL host + key 前 6 位掩码，
    // 帮用户快速分辨"配错平台还是配错账号"。
    if (response.status === 401 || response.status === 403) {
      const key = String(provider.apiKey ?? "").trim()
      const base = String(provider.baseURL ?? "").toLowerCase()
      const kimiCodeKey = /^sk-kimi-/i.test(key)
      const kimiCodeUrl = base.includes("api.kimi.com")
      if (kimiCodeKey || kimiCodeUrl) {
        message += " — tip: Kimi has two separate platforms with NON-interchangeable API keys: Moonshot (api.moonshot.cn/v1, sk-...) and Kimi For Coding (api.kimi.com/coding/v1, sk-kimi-...). Your key or baseURL looks mismatched — check which platform issued it."
      }
      const host = (() => { try { return new URL(provider.baseURL).host } catch { return provider.baseURL ?? "(unknown)" } })()
      const masked = key.length > 8 ? key.slice(0, 6) + "…" + key.slice(-4) : (key ? key.slice(0, 4) + "…" : "(empty)")
      message += ` [auth diag: baseURL=${host} key=${masked} status=${response.status}]`
    }
    lastStatus = response.status
    if (isNonRetryableError(response.status, text)) throw new Error(message)
    if (response.status === 429) {
      const waitMs = parseRetryAfter(response.headers.get("retry-after"), rateLimitHits)
      rateLimitHits++
      lastError = new Error(message)
      lastWas429 = true
      if (attempt < MAX_RETRIES) {
        onWait?.({ phase: "retry", seconds: Math.ceil(waitMs / 1000) })
        await sleepInterruptible(waitMs, signal)
      }
      continue
    }
    if (RETRYABLE_STATUS.has(response.status)) {
      lastError = new Error(message)
      continue
    }
    throw new Error(message)
  }
  // All retries exhausted — build a descriptive error
  const verb = lastWas429 ? "Rate limit not resolved"
    : lastStatus >= 500 ? "Server error persisted"
    : lastStatus > 0 ? "Request failed"
    : "Network error"
  // 会诊 #8：undici "fetch failed" 真因（ENOTFOUND/TLS/DNS/代理）藏在 error.cause —
  // 拼进去，全链路同一文案不再掩盖根因
  const causeText = lastError?.cause
    ? ` (${lastError.cause.code ?? lastError.cause.message ?? String(lastError.cause)})`
    : ""
  throw new Error(`${verb} after ${totalAttempts} attempts${lastStatus ? ` (${lastStatus})` : ""}: ${lastError?.message ?? "unknown"}${causeText}`)
}

/** Parse Retry-After: 秒数 or HTTP-date；上限 300s（会诊 #11）— 异常头不得让 CLI 睡数小时。
 *  header 缺失/非法时退回指数退避表（rateLimitHits 计数取档）。 */
export function parseRetryAfter(header, rateLimitHits = 0) {
  const fallback = RATE_LIMIT_BACKOFF_MS[Math.min(rateLimitHits, RATE_LIMIT_BACKOFF_MS.length - 1)]
  if (header == null) return fallback
  let waitMs = 0
  const numeric = Number(header.trim())
  if (Number.isFinite(numeric) && numeric >= 0) waitMs = numeric * 1000
  else {
    const date = Date.parse(header.trim())
    if (Number.isFinite(date)) waitMs = Math.max(0, date - Date.now())
  }
  if (waitMs <= 0) return fallback
  return Math.min(waitMs, 300_000)
}

/**
 * Detect errors that should NOT be retried — quota, billing, auth, invalid params.
 * Different providers use wildly different error formats. Check body text for known patterns.
 */
function isNonRetryableError(status, text) {
  // Auth errors: never retry
  if (status === 401 || status === 403) return true
  // 400-level non-429: usually invalid params
  if (status >= 400 && status < 500 && status !== 429 && !RETRYABLE_STATUS.has(status)) return true
  // For 429, check if it's actually a billing/quota error (not rate limit)
  if (status === 429) {
    const lower = text.toLowerCase()
    // Chinese providers often return 429 for billing issues
    if (lower.includes("余额不足") || lower.includes("余额") || lower.includes("充值")) return true
    if (lower.includes("insufficient") && (lower.includes("balance") || lower.includes("quota") || lower.includes("credit"))) return true
    if (lower.includes("quota") && (lower.includes("exceeded") || lower.includes("insufficient"))) return true
    // Standard OpenAI billing error (error.type === "insufficient_quota" or similar)
    try {
      const j = JSON.parse(text)
      const errType = j?.error?.type || ""
      if (typeof errType === "string" && (errType.includes("quota") || errType.includes("billing") || errType.includes("insufficient") || errType.includes("balance"))) return true
      const errCode = j?.error?.code || ""
      if (typeof errCode === "string" && (errCode === "1113" || errCode === "1114")) return true // GLM billing codes
    } catch {}
  }
  return false
}

function betaBaseURL(baseURL) {
  // DeepSeek prefix continuation uses /beta endpoint; only handle /v1 suffix, append /beta when /v1 is missing
  if (/\/v1$/.test(baseURL)) return baseURL.replace(/\/v1$/, "/beta")
  return baseURL.endsWith("/") ? baseURL + "beta" : baseURL + "/beta"
}

/**
 * Compile stream rules from config format (string patterns) to executable RegExp objects.
 * Rules format: { pattern: "regex source", message: "reminder text", action: "abort"|"warn" }
 */
export function compileStreamRules(rules) {
  if (!rules?.length) return null
  return rules.map((r) => {
    try {
      return { ...r, _regex: new RegExp(r.pattern, r.flags ?? "") }
    } catch {
      // Invalid regex — skip silently so one bad rule doesn't break the whole pipeline
      return null
    }
  }).filter(Boolean)
}
