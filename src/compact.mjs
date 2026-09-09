/**
 * compact.mjs — context compaction (CLI CONTEXT-COMPACTION.md parity)
 * Split out of the former context.mjs (GIT-ASYNC L21 整文件删除——原文件已不存；
 * 本文件独立守 500 行硬限)。
 * The unified compaction spec lives in thincoder/docs/design/CONTEXT-COMPACTION.md.
 */
import { chat } from "./provider.mjs"
import { providerSpec } from "./config.mjs"
import { safeSliceUTF16 } from "./agent/run-helpers.mjs"
import { performance } from "node:perf_hooks"

// ─── Model-aware compaction thresholds ──────────────────────────

/** Fraction of context window to use as the compaction trigger point.
 *  60% leaves headroom for injected context (git/dir/outline/memory/doc, 30-50K/turn)
 *  AND the model's response (output + reasoning — some models maxOutput 384K).
 *  CLI parity (CONTEXT-COMPACTION.md D2). */
const THRESHOLD_FRACTION = 0.60

/** Estimated token cost of one image part (CLI parity: legacy 256 underestimated real image costs). */
const IMAGE_TOKEN_ESTIMATE = 2000

/** No dedicated head (CLI parity): in multi-task sessions the earliest messages are
 *  typically a COMPLETED earlier task — preserving them verbatim anchored the model's
 *  attention on stale work after compaction. Everything before the tail goes into the
 *  summary (which distinguishes completed vs in-progress work). The tool_calls-extension
 *  below is defensive for a future KEEP_HEAD > 0. */
const KEEP_HEAD = 0

/** After this many consecutive summary failures, degrade to deterministic truncation (CLI parity D6). */
export const COMPRESS_FAILURE_LIMIT = 3

/** Truncation fallback note (used when the summary LLM fails repeatedly; no LLM call). */
const FALLBACK_NOTE =
  "[Context was truncated after repeated summarization failures. " +
  "The middle portion of earlier work was dropped WITHOUT a summary. " +
  "Re-verify any state you need with tools before relying on it.]\n\n"

/** Rough token estimate for a text string — ASCII/4 + non-ASCII/1 (CLI rate.mjs formula). */
function estimateText(s) {
  let nonAscii = 0
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0x7f) nonAscii++
  return Math.ceil((s.length - nonAscii) / 4) + nonAscii
}

/**
 * Calculate the compaction threshold for a given provider.
 * Uses 60% of the provider-aware context window (providers[].context override,
 * PROVIDER.md §15 D-C3) — no arbitrary caps.
 */
function compactionThreshold(provider) {
  const ctxWindow = providerSpec(provider).context
  return Math.floor(ctxWindow * THRESHOLD_FRACTION)
}

/**
 * Calculate how many messages to keep after compaction.
 * Scales with the provider-aware context window: ~30 per 100K tokens, capped at 40%
 * of history (CLI parity D4 — replaces the old fixed tail).
 */
function keepTailSize(provider, historyLen) {
  const ctxWindow = providerSpec(provider).context
  return Math.min(Math.max(10, Math.floor((ctxWindow / 100_000) * 30)), Math.floor(historyLen * 0.4))
}

/** §9 D-T1: 摘要段（压缩 note + 占位 + ~1K 目标摘要）固定估算——tail 预算从 15% 窗口扣除它。 */
const SUMMARY_SEGMENT_ESTIMATE = 1_100

/**
 * REVERSE 配对判据（2026-08-16 400 类别）：assistant 位 q 声明的 tool_calls 是否有缺口——ids 未被
 * q 后**连续** tool 块全盖住（倒序配对 [tool…, assistant] 的 results 被切/不连续时停在此即悬空 400）。
 * 非 assistant / 无 tool_calls → 无缺口；tailStartByBudget 与 REVERSE 保护共用（T-DT8）。
 */
function callsGapAfter(history, q) {
  const m = history[q]
  if (m?.role !== "assistant" || !m.tool_calls?.length) return false
  const needIds = new Set(m.tool_calls.map((tc) => tc.id))
  const haveIds = new Set()
  for (let i = q + 1; i < history.length && history[i].role === "tool"; i++) haveIds.add(history[i].tool_call_id)
  return needIds.size > 0 && [...needIds].some((id) => !haveIds.has(id))
}

/**
 * REVERSE 保护（2026-08-16）：tail 以声明 tool_calls 的 assistant 开头、其 tool 结果被切在 tailStart
 * 前（倒序配对，结果块与 owner 相邻）→ tailStart 拉回覆盖——发送历史不得含悬空 tool_calls。
 */
function reverseProtectTail(history, tailStart, headEnd) {
  if (!callsGapAfter(history, tailStart)) return tailStart
  let back = tailStart - 1
  while (back >= headEnd && history[back]?.role === "tool") back--
  return back + 1 // include the missing tool results (they sit contiguously before the assistant)
}

/** §9 D-T1/D-T2 (CLI parity + T-DT8 增强): 预算裁剪 tailStart——count 公式候选尾 + 配对保护后，
 *  估算尾超预算（context×0.15 − SUMMARY_SEGMENT_ESTIMATE）→ 前移（旧消息入摘要段），pair-safe
 *  边界（tool 位 / 缺口 assistant 位都不停——整对同切，切中间会 orphan 且预算重新超支）；
 *  保底 10 条（floor = len−10，超支接受；短历史候选 <10 → floor = tailStart no-op）。 */
function tailStartByBudget(history, provider, tailStart) {
  const tailBudget = Math.floor(providerSpec(provider).context * 0.15) - SUMMARY_SEGMENT_ESTIMATE
  const floor = Math.max(tailStart, history.length - 10)
  if (tailStart >= floor) return tailStart // 短历史：预算逻辑不触发（保底上限 = 候选条数）
  const tailEst = estimateTokens(history.slice(tailStart))
  if (tailEst <= tailBudget) return tailStart // F2：普通会话预算未超 → 零变化
  let cut = 0
  for (let q = tailStart + 1; q <= floor; q++) {
    cut += estimateMessage(history[q - 1])
    if (history[q]?.role === "tool" || callsGapAfter(history, q)) continue // pair-safe：tool 位 / 倒序 assistant 位都不停
    if (tailEst - cut <= tailBudget) return q
  }
  let q = floor // 保底 10 条（D-T2）：超支接受；边界仍须 pair-safe（tool 位 / 缺口 assistant 位继续回退）
  while (q > tailStart && (history[q]?.role === "tool" || callsGapAfter(history, q))) q--
  return q
}

export const SUMMARIZE_PROMPT = `You are a conversation compressor. Summarize the following agent work log. Write in first person ("I") — these are handover notes to your future self.

Requirements:
- Preserve the user's original request and what task you're working on
- Distinguish COMPLETED vs IN-PROGRESS work: completed tasks get a ONE-LINE recap each (what was done, key outcome); spend the detail budget on unresolved issues, next steps, and the CURRENT task
- The user's most recent request defines the current task — anchor on it. Earlier requests are likely already completed and only need the one-line recap; do NOT preserve them at full fidelity
- Explicitly list FILES CHANGED: every modified file path plus a one-line "why" — so post-compaction work can re-locate what was edited and where
- Preserve design decisions: architecture choices, API contracts, naming conventions, trade-off reasoning
- Explicitly list UNRESOLVED ISSUES / TODOs: anything still open plus the next steps — so post-compaction recovery knows where to resume
- Drop: pleasantries, repetition, fine-grained tool output
- Be honest: mark uncertain items as "unverified"; don't present guesses as facts
- Output as bullet points. Stay under ~1K tokens (≈1000 Chinese chars / 4000 ASCII chars) — a hard target. An oversized summary wastes window and dilutes the tail; the old unbounded-length guidance is deprecated.
- When over budget, trim in this order: completed recaps to one line; FILES CHANGED why-notes to bare paths; in-progress prose tightened. NEVER cut design anchors or UNRESOLVED ISSUES/TODOs — recovery depends on them.

Work log:
`

/** Token cost of a single message (CLI parity: reasoning_content + tool_calls + images counted). */
function estimateMessage(m) {
  let tokens = 0
  if (typeof m.content === "string") tokens += estimateText(m.content)
  else if (Array.isArray(m.content)) {
    for (const part of m.content) {
      if (part.type === "text") tokens += estimateText(part.text)
      else if (part.type === "image_url") tokens += IMAGE_TOKEN_ESTIMATE
    }
  }
  if (typeof m.reasoning_content === "string") tokens += estimateText(m.reasoning_content)
  for (const tc of m.tool_calls ?? []) {
    tokens += estimateText(tc.function?.name ?? "") + estimateText(tc.function?.arguments ?? "")
  }
  return tokens
}

/**
 * Estimate token count from message array (CLI parity: reasoning_content + tool_calls + images counted).
 */
function estimateTokens(messages) {
  let total = 0
  for (const m of messages) total += estimateMessage(m)
  return total
}

/**
 * Compact history with LLM summarization for old messages.
 * Returns a new history array or null if no compaction needed.
 * @param {object} provider - provider config for the summarization LLM call
 * @param {number|null} [explicitThreshold] - config agent.compactThreshold override (null = auto from model)
 * @param {object|null} [baseline] - { lastPromptTokens, usageAtLen } measured prompt-token baseline
 *   from the previous response (CLI parity D3). When present, the trigger check is
 *   baseline + estimation of messages appended since; otherwise pure estimation of system+history.
 * @param {Array|null} [tools] - tool schemas for the pure-estimation overhead (CLI parity):
 *   system prompt AND tools schema are part of every request but not in history — without
 *   them the first-turn/restored estimate under-counts and may never trigger compaction.
 * @param {AbortSignal|null} [signal] - user interrupt (CLI parity). The summary LLM call can
 *   take minutes on slow reasoning models — without the signal, Stop waits for the summary
 *   to finish (or the 10-minute fetch ceiling) before the loop notices the abort.
 * @param {object|null} [callbacks] - { onCompressStart } — fires RIGHT BEFORE the summary LLM
 *   call with { messages: N } (CONTEXT-COMPACTION §7 D-C1: compression lifecycle visibility —
 *   the webview status line; never the summary body). No-op when absent (F4).
 * @param {object|null} [agent] - carrier for completion info (CLI parity): sets
 *   agent._lastCompressInfo = { mode:"summary", tokensFreed, elapsedMs } so the caller's
 *   onCompress renders "Compressed: N tokens freed (Xs)".
 * @throws when the summarization LLM fails — the CALLER counts consecutive failures and
 *   degrades to truncateFallback (CLI parity D6; the heuristic summary is deprecated).
 */
export async function compactHistory(history, systemPrompt, provider, explicitThreshold = null, baseline = null, tools = null, signal = null, callbacks = null, agent = null) {
  const threshold = explicitThreshold != null ? explicitThreshold : compactionThreshold(provider)
  const overhead = estimateText(systemPrompt) + (tools ? estimateText(JSON.stringify(tools)) : 0)
  const total = baseline?.lastPromptTokens != null
    ? baseline.lastPromptTokens + estimateTokens(history.slice(baseline.usageAtLen ?? history.length))
    : overhead + estimateTokens(history)
  if (total < threshold) return null

  // Keep a model-aware number of recent messages — keepTailSize already caps at 40% of history
  const keepCount = keepTailSize(provider, history.length)
  if (history.length - keepCount <= 1) {
    // No middle section to summarize (history too short, typically one giant message) —
    // degrade to deterministic per-message shrinking (CLI parity D6). Shrink keeps the array
    // LENGTH unchanged (same indices, no note inserted) — the caller uses that to distinguish
    // it from a rebuild and must NOT reset the end-of-run distillation boundary.
    return shrinkOversized(history)
  }

  // Head protection: the head must not end with dangling tool_calls — when an assistant
  // message declares tool_calls, all its tool responses stay in head (CLI parity D5).
  let headEnd = KEEP_HEAD
  if (history[headEnd - 1]?.role === "assistant" && history[headEnd - 1].tool_calls?.length) {
    while (headEnd < history.length && history[headEnd].role === "tool") headEnd++
  }

  // Tail protection: ensure the cut point doesn't split tool_calls from their tool responses.
  // If a message in the tail is a tool message whose assistant was in oldMessages,
  // pull that assistant into the tail (avoids protocol 400: orphan tool messages).
  let tailStart = history.length - keepCount
  const tailToolIds = new Set()
  for (let i = tailStart; i < history.length; i++) {
    if (history[i].role === "tool") tailToolIds.add(history[i].tool_call_id)
  }
  for (let i = tailStart - 1; i >= headEnd; i--) {
    const m = history[i]
    if (m.role === "assistant" && m.tool_calls?.some((tc) => tailToolIds.has(tc.id))) {
      tailStart = i
      break
    }
  }
  // Skip orphan tool messages at the new tail boundary (tool whose assistant was pulled in above)
  while (tailStart > headEnd && history[tailStart].role === "tool") {
    tailStart++
  }
  // REVERSE protection (2026-08-16): tail 以声明 tool_calls 的 assistant 开头、其 results 已切到
  // tailStart 前（倒序配对）→ 拉回覆盖——发送历史不得含悬空 tool_calls（callsGapAfter 判据）
  tailStart = reverseProtectTail(history, tailStart, headEnd)
  // §9 D-T1: tail token 预算——count 公式候选尾超 15% 预算时 pair-safe 前移 tailStart
  tailStart = tailStartByBudget(history, provider, tailStart)
  
  if (tailStart <= headEnd) return null

  const oldMessages = history.slice(headEnd, tailStart)
  const recentMessages = history.slice(tailStart)

  // Serialize old messages for the summary LLM
  const serialized = oldMessages
    .map((m) => {
      let prefix = `[${m.role}]`
      if (m.tool_calls) prefix += ` [called tools: ${m.tool_calls.map((tc) => tc.function?.name ?? tc.name).join(", ")}]`
      const cap = m.role === "user" ? 8000 : 2000
      // Multimodal messages (array content): extract the TEXT parts — the image itself
      // can't be summarized, but accompanying text must not be silently lost (CLI parity).
      let text = ""
      if (typeof m.content === "string") text = m.content
      else if (Array.isArray(m.content)) text = m.content.filter((p) => p?.type === "text").map((p) => p.text ?? "").join(" ")
      return `${prefix} ${safeSliceUTF16(text, cap)}`
    })
    .join("\n")

  if (!provider) {
    throw new Error("compaction: no provider available for summarization")
  }
  // Silent by design (D11): no streaming callbacks — the compaction process must not reach the frontend.
  // The signal rides along (CLI parity): Stop cancels the in-flight summary instead of
  // waiting for it to finish.
  // Compression visibility (CONTEXT-COMPACTION §7 D-C1/D-C3): the frontend learns the
  // compression STARTED right before the LLM call ("Compressing context… / summarizing
  // N messages" status line) — only the lifecycle is surfaced, never the summary body.
  // N = the number of history messages being summarized.
  callbacks?.onCompressStart?.({ messages: oldMessages.length })
  const startedAt = performance.now()
  const resp = await chat({ ...provider, thinking: null, reasoningEffort: null }, {
    messages: [{ role: "user", content: SUMMARIZE_PROMPT + serialized }],
    signal: signal ?? null,
    // LOGGING：vscode agent 对象 per-run 重建、从不 stamp _logId——只带 stage 归属
    //（2026-09-03 code review #7：去掉死引用 child: agent?._logId——CLI 专属字段）
    // TRACE-STORE-VSC（§18.6 D-TR4 镜像——CLI context.mjs compress logCtx 同款）：kind=
    // compress + agent 元数据透出（role/depth 经 agent 绑定——hydrate 打点 _role/_depth）；
    // session/cwd 供轨迹对回；traces 开关沿 agent.config（D-TR6——agent-state 每轮整建
    // agent.config.traces——缺省 OFF——与 CLI 同语义）。cwd 恒为 agent.cwd——本调用点不依赖
    // recordChatTrace 的 process.cwd() 兜底（该兜底仅覆盖无 agent 作用域的未来新增调用点；
    // VSC extension host cwd ≠ 工作区——轨迹归属错误）；agent 恒由 checkAndCompact 传入。
    logCtx: {
      stage: "compress", kind: "compress",
      role: agent?._role ?? null,
      depth: agent?._depth ?? null,
      session: agent?._sessionStart ?? null,
      cwd: agent?.cwd ?? null,
      traces: agent?.config?.traces?.enabled !== false,
    },
  })
  const summary = resp.content || ""
  const now = Date.now() // SESSION.md §9 D-S1 (CLI parity): compaction injections carry the compaction moment

  const result = [
    ...history.slice(0, headEnd), // head (empty by default — KEEP_HEAD=0, CLI parity)
    {
      role: "user",
      ts: now,
      content:
        "[Context was automatically compacted. Below is a summary of earlier work. " +
        "Treat it as notes, not proof — trust its conclusions (don't redo what it reports as done) " +
        "but re-verify transient state with tools. Check memory search for any missing decisions.]\n\n" +
        `<handoff_notes>\n${summary}\n</handoff_notes>`,
    },
    {
      role: "assistant",
      ts: now,
      content: "Understood. I'll continue from these notes, re-verifying anything transient.",
    },
    ...recentMessages,
  ]

  // Completion info for the compression status line (D-C2/D-C3): tokens freed = the
  // pre-compression prompt estimate (`total` — the value that tripped the threshold,
  // incl. system/tools overhead) minus the post-compression estimate on the same basis.
  // Elapsed = the summary call + splice duration. agent.mjs forwards this to onCompress.
  if (agent) {
    agent._lastCompressInfo = {
      mode: "summary",
      tokensFreed: Math.max(0, Math.round(total - (estimateTokens(result) + overhead))),
      elapsedMs: performance.now() - startedAt,
    }
  }
  return result
}

/**
 * Deterministic truncation fallback (CLI compressFallback parity): drops the middle
 * WITHOUT an LLM call, keeping head + a blunt note + tail. Returns a new array or null.
 */
export function truncateFallback(history, provider) {
  const keepCount = keepTailSize(provider, history.length)
  let headEnd = KEEP_HEAD
  if (history[headEnd - 1]?.role === "assistant" && history[headEnd - 1].tool_calls?.length) {
    while (headEnd < history.length && history[headEnd].role === "tool") headEnd++
  }
  let tailStart = history.length - keepCount
  const tailToolIds = new Set()
  for (let i = tailStart; i < history.length; i++) {
    if (history[i].role === "tool") tailToolIds.add(history[i].tool_call_id)
  }
  for (let i = tailStart - 1; i >= headEnd; i--) {
    const m = history[i]
    if (m.role === "assistant" && m.tool_calls?.some((tc) => tailToolIds.has(tc.id))) {
      tailStart = i
      break
    }
  }
  while (tailStart > headEnd && history[tailStart].role === "tool") tailStart++
  // REVERSE protection (2026-08-16): tail 以声明 tool_calls 的 assistant 开头、其 results 已切到
  // tailStart 前（倒序配对）→ 拉回覆盖——发送历史不得含悬空 tool_calls（callsGapAfter 判据）
  tailStart = reverseProtectTail(history, tailStart, headEnd)
  // §9 D-T1: 降级路径保持同一形状契约——tail 同样受 15% token 预算约束
  tailStart = tailStartByBudget(history, provider, tailStart)
  
  if (tailStart <= headEnd) return null
  const now = Date.now() // SESSION.md §9 D-S1 (CLI parity): fallback injections carry ts too
  return [
    ...history.slice(0, headEnd),
    { role: "user", content: FALLBACK_NOTE, ts: now },
    { role: "assistant", content: "Understood. I'll continue from these notes, re-verifying anything transient.", ts: now },
    ...history.slice(tailStart),
  ]
}

/** Hard truncation limit for a single message body (CLI shrinkOversized parity). */
const OVERSIZE_CONTENT_LIMIT = 8_000

/**
 * Deterministic shrinking: last resort when there is no middle section to summarize
 * (history too short) but the threshold is exceeded. Truncates user/tool message bodies
 * exceeding OVERSIZE_CONTENT_LIMIT to a stub — keeps reasoning_content and tool_calls
 * structure intact (no protocol 400 risk). Returns a new array or null if nothing shrank.
 */
export function shrinkOversized(history, limit = OVERSIZE_CONTENT_LIMIT) {
  let shrunk = false
  const out = history.map((m) => ({ ...m }))
  for (const m of out) {
    if ((m.role !== "user" && m.role !== "tool") || typeof m.content !== "string") continue
    if (m.content.length <= limit) continue
    const keepHead = Math.min(Math.floor(limit * 0.5), 4000)
    const keepTail = Math.min(Math.floor(limit * 0.25), 2000)
    m.content =
      m.content.slice(0, keepHead) +
      `\n[... ${m.content.length - keepHead - keepTail} chars truncated — single message too large for context window ...]\n` +
      m.content.slice(-keepTail)
    shrunk = true
  }
  return shrunk ? out : null
}

// ─── End-of-run exploration distillation（2026-09-05 module-split：503 > 500 硬限——verbatim
// 迁至 explore-distill.mjs，语义零变——CLI context.mjs 同款联动；cross-repo parity 锚改指
// explore-distill.mjs——消费方 import 面不变（re-export））───────────────────────

export { summarizeRunExplorations, EXPLORE_TOOLS, EXPLORE_SUMMARY_PROMPT } from "./explore-distill.mjs"
