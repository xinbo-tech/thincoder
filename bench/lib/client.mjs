/**
 * lib/client.mjs — 调模型（复用核 provider 路径，KD-1）+ 工具环 + per-call 计时（设计 §2.9）。
 *
 * provider 条目构造面（冻结）：调用方**克隆用户 config 条目 + 覆写 `maxTokens` / `temperature` / `.model`**
 * ——核从条目读这两个字段（provider/core.mjs:184-192）且请求体模型名取条目（:178），`chat` 的 opts（:117）
 * 无这两位 ⇒ 不落条目会静默失效。
 *
 * 计时口径（§1.3-3）：TTFT = 首个**非空** delta（onToken / onReasoning 先到者）− 调用发起——核的流读面
 * 只在非空 delta 时回调（provider/sse.mjs:142-149）。工具回合的 assistant 消息按 `assistantToolCallMessage`
 * 构造（reasoning 回显策略随核规格）。
 *
 * 传输面参数化：`liveTransport` = 核 chat（真实运行）；`fixtureTransport` = dry-run / 测试的固定响应表
 * （`bench/run.mjs` 内联夹具经此消费——不触网）。
 */

import { assistantToolCallMessage, specForModel } from "../../thincoder-core/config.mjs"
import { chat } from "../../thincoder-core/provider/index.mjs"
import { usageTokens } from "./metrics.mjs"
import { executeToolCall } from "./tools.mjs"

/** 单回合工具环上限（防模型无限调用；超限即按已得数据判分）。 */
export const MAX_TOOL_ROUNDS = 5

/** 真实传输：核 provider 路径（请求构造 / 重试 / 续写 / 限流门全随核）。 */
export const liveTransport = {
  async call({ provider, messages, tools, parallelToolCalls, signal }) {
    let firstDeltaAt = null
    let throttled = false
    const t0 = Date.now()
    const opts = {
      messages,
      ...(tools?.length ? { tools } : {}),
      onToken: () => { if (firstDeltaAt == null) firstDeltaAt = Date.now() },
      onReasoning: () => { if (firstDeltaAt == null) firstDeltaAt = Date.now() },
      onWait: (w) => { if (w?.phase && w.phase !== "warn") throttled = true }, // 实际暂停（gate/retry/overloaded）才记；“warn” 相位不等待 ⇒ 不记（§2.9-4）
      signal,
      ...(parallelToolCalls ? { parallelToolCalls: true } : {}),
    }
    const response = await chat(provider, opts)
    const totalMs = Date.now() - t0
    return { response, ttftMs: firstDeltaAt == null ? null : firstDeltaAt - t0, totalMs, throttled }
  },
}

/** 夹具传输：按脚本顺序回放固定响应（dry-run 用；零网络、指标取自夹具 ⇒ 完全确定）。 */
export function fixtureTransport(script) {
  let i = 0
  return {
    async call() {
      const entry = script[i++]
      if (!entry) throw new Error("dry-run 夹具响应耗尽（脚本长度 < 实际调用数）")
      return {
        response: {
          content: entry.text ?? "",
          reasoning: entry.reasoning ?? "",
          toolCalls: entry.toolCalls ?? [],
          usage: entry.tokens
            ? {
              prompt_tokens: entry.tokens.prompt,
              completion_tokens: entry.tokens.completion,
              prompt_cache_hit_tokens: entry.tokens.cached,
            }
            : null,
          finishReason: entry.finishReason ?? "stop",
        },
        ttftMs: typeof entry.ttftMs === "number" ? entry.ttftMs : null,
        totalMs: typeof entry.totalMs === "number" ? entry.totalMs : null,
        throttled: entry.throttled === true,
      }
    },
  }
}

/** 判官 / 复核夹具传输（§5.13 测试策略①：不触网）：按位次（`slot` = A / B / C / review）回放固定裁决脚本。
 *  脚本条目 = `{ text, tokens?, finishReason?, totalMs?, fail?: "throw" }`；逐位独立游标（同一位可多次调用）。
 *  dry-run 夹具与 `bench/test/judge.test.mjs` 桩传输共用本函数。 */
export function fixtureSlotTransport(scripts) {
  const cursors = {}
  return {
    async call({ slot }) {
      const list = scripts?.[slot] ?? []
      const i = cursors[slot] ?? 0
      cursors[slot] = i + 1
      const entry = list[i]
      if (!entry) throw new Error(`判官夹具脚本耗尽（位 ${slot}，第 ${i + 1} 次调用）`)
      if (entry.fail === "throw") throw Object.assign(new Error(entry.message ?? "夹具：调用失败"), { name: entry.name ?? "Error" })
      return {
        response: {
          content: entry.text ?? "",
          reasoning: "",
          toolCalls: [],
          usage: entry.tokens
            ? { prompt_tokens: entry.tokens.prompt, completion_tokens: entry.tokens.completion, prompt_cache_hit_tokens: entry.tokens.cached }
            : null,
          finishReason: entry.finishReason ?? "stop",
        },
        ttftMs: null,
        totalMs: typeof entry.totalMs === "number" ? entry.totalMs : 500,
        throttled: false,
      }
    },
  }
}

/** 单 call → 账目记录（§2.2 calls[]；token 只认 usage，缺即 null——映射单源 = metrics.usageTokens）。 */
function toCallRecord(round, call) {
  const tokens = usageTokens(call.response?.usage)
  return {
    round,
    ttftMs: typeof call.ttftMs === "number" ? call.ttftMs : null,
    totalMs: typeof call.totalMs === "number" ? call.totalMs : null,
    tokens,
    toolNames: (call.response?.toolCalls ?? []).map((t) => t?.name).filter(Boolean),
    finishReason: call.response?.finishReason ?? null,
    throttled: call.throttled === true,
  }
}

/**
 * 跑一个用例（或一条人工 lane 记录）：逐用户轮 → 工具环 → per-call 计时。
 * `timeoutMs` = **单次调用**墙钟上限（§2.1）——每次 transport.call 各自取一份预算，不跨调用累计。
 * 返回 { error, turns, calls }：`error` 非 null = 基建/接口错误（该 run 判 error，§2.2-3）。
 */
export async function runCase({ caseObj, providerEntry, transport, signal, timeoutMs = null, maxRounds = MAX_TOOL_ROUNDS }) {
  const spec = specForModel(providerEntry?.model ?? "")
  const built = typeof caseObj.build === "function"
    ? caseObj.build()
    : { messages: [{ role: "user", content: caseObj.prompt }] }
  const messages = [...(built.messages ?? [])]
  const followUps = built.followUps ?? []
  const tools = caseObj.callOpts?.tools ?? null
  const parallelToolCalls = caseObj.callOpts?.parallelToolCalls === true
  const turns = []
  const calls = []
  let error = null

  for (let ti = 0; ti <= followUps.length; ti++) {
    const turn = { text: "", reasoning: "", toolCalls: [], steps: [], calls: [] }
    for (let round = 1; round <= maxRounds; round++) {
      const callSignal = timeoutMs == null
        ? signal
        : AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(timeoutMs)])
      let call
      try {
        call = await transport.call({ provider: providerEntry, messages, tools, parallelToolCalls, signal: callSignal })
      } catch (e) {
        const rec = {
          round, ttftMs: null, totalMs: null, tokens: null, toolNames: [], finishReason: null, throttled: false,
        }
        calls.push(rec)
        turn.calls.push(rec)
        turn.steps.push({ text: "", reasoning: "", toolCalls: [], call: rec })
        error = `${e?.name ?? "Error"}: ${e?.message ?? String(e)}`
        break
      }
      const rec = toCallRecord(round, call)
      calls.push(rec)
      turn.calls.push(rec)
      const resp = call.response
      turn.text = String(resp?.content ?? "")
      turn.reasoning = String(resp?.reasoning ?? "")
      turn.toolCalls = resp?.toolCalls ?? []
      turn.steps.push({ text: turn.text, reasoning: turn.reasoning, toolCalls: turn.toolCalls, call: rec })
      if (turn.toolCalls.length === 0) break
      messages.push(assistantToolCallMessage(resp, spec))
      for (const tc of turn.toolCalls) {
        const ex = executeToolCall(tc)
        messages.push({ role: "tool", tool_call_id: tc.id, name: tc.name, content: ex.result })
      }
    }
    turns.push(turn)
    if (error) break
    if (ti < followUps.length) messages.push({ role: "user", content: followUps[ti] })
  }
  return { error, turns, calls }
}

/** 判分视角的用例结果视图（`grade(result, ctx)` 的 result 参数）。
 *  `turns[i]` = 第 i 个用户轮；`turns[i].steps[j]` = 该轮第 j 次模型调用（工具环一步，含其 toolCalls）。 */
export function caseResultView(turns) {
  const last = turns[turns.length - 1] ?? { text: "", reasoning: "", toolCalls: [] }
  return {
    text: last.text ?? "",
    reasoning: last.reasoning ?? "",
    toolCalls: last.toolCalls ?? [],
    turns,
    allToolCalls: turns.flatMap((t) => (t.steps ?? []).flatMap((s) => s.toolCalls ?? [])),
  }
}
