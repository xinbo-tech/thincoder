/**
 * advisor/loop.mjs — advisor tool loop: chat → execute tools → repeat, plus the
 * review timeline (split out of advisor/run.mjs, 第 11 批 — run.mjs was 498/500
 * 硬帽；拆分保持既有 import 面：run.mjs 继续 re-export 本文件导出）。
 *
 * 第 11 批（F15/§14.6）：每次 chat 调用携带硬墙信号（`AbortSignal.any([signal,
 * AbortSignal.timeout(remaining)])`；墙判定绑信号状态——抛错 / partial 两形态同判），
 * 并按 0.75 一次性预算提示 + 结构化超时尾收尾；守卫与限额函数在 compaction.mjs。
 */
import { chat } from "../provider/core.mjs"
import { providerSpec } from "../config.mjs"
import { toOpenAISchema } from "../tools/index.mjs"
import { describeToolArgs } from "../tui/tool-args.mjs"
import { truncateAdvisorResult } from "@thincoder/core/advisor/truncate.mjs"
import { batchSegmentTool } from "../agent-tools/batch-segment.mjs"
import {
  estimateTokens, compactMessages, shouldBudgetNudge, budgetNudgeText, timeoutTail, renderTimeline,
  MAX_ADVISOR_TURNS, advisorContextBudget, TOOL_TIMEOUT_MS, REVIEW_TIMEOUT_MS, MAX_RESULT_CHARS,
  ADVISOR_THINKING_PLACEHOLDER,
} from "./compaction.mjs"

const { readTool, globTool, grepTool, lsTool } = await import("../tools/index.mjs")
const { lspTool } = await import("../tools/lsp.mjs")
const { codeSearchTool } = await import("@thincoder/core/memory/code-sync.mjs")

/**
 * Advisor tool set — ZERO git, read-only ONLY, every round. The change surface
 * comes from the review scope (paths / _touchedFiles injected by the caller),
 * never from git: git output misled reviews (committed fixes never show in
 * `git diff HEAD`, so "no changes" was read as "not fixed") and the user
 * mandate is full decoupling (7d49a52 + d3be613). The reviewer reads files
 * and searches code; it never touches git and never writes.
 * No round parameter — the set is constant across all rounds.
 * @param {Object} agent — only used for the code index (agent.memory); the
 *   semantic code_search tool needs it. Without a memory, the set is 5 tools.
 */
function advisorToolsFor(agent, reviewType = "code", batchDoc = null) {
  const search = agent?.memory ? codeSearchTool(agent.memory) : null
  const tools = search
    ? [readTool, globTool, grepTool, lsTool, lspTool, search]
    : [readTool, globTool, grepTool, lsTool, lspTool]
  // §2.20.3（第 4 批）：**只有绑定了批次档的设计评审**额外拿到写通道——代码评审工具集
  // 逐字节不变（零 git + 只读不变量，§2.20.8 #1）；未绑定 → 不挂载（fail-closed）。
  if (reviewType === "design" && batchDoc) tools.push(batchSegmentTool(batchDoc, { review: true }))
  return { schemas: tools.map(toOpenAISchema), byName: new Map(tools.map((t) => [t.name, t])) }
}
// Test seam: the tool set is pure (agent.memory → code_search inclusion).
export { advisorToolsFor, advisorToolsFor as _advisorToolsFor }

/**
 * Run the advisor's tool loop: chat → execute tools → repeat.
 * Stops when the model produces text without tool calls.
 *
 * Progress lines (→ tool args) are emitted via onOutput between model bursts so
 * the panel keeps moving while the advisor explores — otherwise the panel sits
 * frozen through every tool-call phase and the review appears to have stalled.
 *
 * @param {string|null} [pinned] — 第 11 批：压缩定锚简报（评审参数构建——F13/§14.4 #3）。
 * @param {{now?: Function, chat?: Function}} [seams] — 测试缝（默认 Date.now / chat——
 *   生产调用不传，默认回退零行为变）。
 */
async function runAdvisorToolLoop(provider, messages, onOutput, signal, agent, cwd, toolsOverride = null, reviewType = "code", batchDoc = null, pinned = null, seams = {}) {
  const now = seams.now ?? Date.now
  const chatCall = seams.chat ?? chat
  // 第 11 批硬墙 / 预算 / 尾：实现注解见下方各点；守卫函数与 renderTimeline 在 compaction.mjs。
  // Kind-tagged wrappers: the TUI panel colors reasoning / answer / tool progress differently.
  // Every chunk is ALSO recorded into an ordered timeline — the persisted record
  // must show the review process (thinking ↔ tool progress ↔ final text) at its
  // real positions, not a summary appended at the end. Same-kind consecutive
  // chunks merge (token streams); kind flips start a new entry.
  const timeline = []
  const record = (kind, text) => {
    const last = timeline.at(-1)
    if (last && last.kind === kind) last.text += text
    else timeline.push({ kind, text })
  }
  const emit = (kind) => (text) => { record(kind, text); onOutput?.({ kind, text }) }
  const onThink = emit("think")
  const onText = emit("text")
  const onTool = emit("tool")
  // toolsOverride = test seam (T-TS8/9): the real advisor tool set, or a mock
  // set with controllable timing/errors.
  const { schemas: toolSchemas, byName: toolByName } = toolsOverride ?? advisorToolsFor(agent, reviewType, batchDoc)
  let turns = 0
  let toolCallCount = 0
  let reviewTextProduced = false
  let budgetNudged = false
  const startTime = now()
  // 第 25 批（§16.3）：上下文预算跟随评审模型窗口——`providerSpec`（模型规格表 × provider 级
  // context 覆盖）派生；函数体内、while 轮次外一次性（provider 全场不变），两档消费见下守卫。
  const budget = advisorContextBudget(provider)

  while (true) {
    // Interrupted (Ctrl+I) — stop immediately instead of spinning a fresh uncancellable signal
    if (signal?.aborted) return renderTimeline(timeline, "Advisor: interrupted.")
    
    // Check review timeout (10 minutes by default; agent.advisor.timeoutMs overrides)
    // 运行时校验（设计评审 #1，2026-08-24）：手写 config.json 的非法值（0/负数/字符串）
    // 不得静默禁用或立即触发超时——非法一律回退默认。
    const cfg = agent.config?.advisor?.timeoutMs
    const timeoutMs = (Number.isFinite(cfg) && cfg > 0) ? cfg : REVIEW_TIMEOUT_MS
    const elapsed = now() - startTime
    const remaining = timeoutMs - elapsed
    // 硬墙（§14.6 #1）：预算用尽 → 结构化超时尾（首行 = 判定族 timeout 前缀）。
    if (remaining <= 0) {
      return renderTimeline(timeline, timeoutTail(timeoutMs, turns, toolCallCount, reviewTextProduced))
    }
    // 0.75 一次性预算提示（§14.6 #2——同一检查点、每场评审至多一次）：注入一条 user 消息
    // 促模型在墙前收敛产出（不改语义判据、不碰提示词面）。
    if (shouldBudgetNudge(elapsed, timeoutMs, budgetNudged)) {
      budgetNudged = true
      messages.push({ role: "user", content: budgetNudgeText(elapsed, timeoutMs) })
    }
    
    if (++turns > MAX_ADVISOR_TURNS) {
      return renderTimeline(timeline, "Advisor: stopped after " + MAX_ADVISOR_TURNS + " tool rounds — the review appears to be looping. You may retry with a narrower scope.")
    }
    
    // Check context window and compact if needed
    const currentTokens = estimateTokens(messages)
    if (currentTokens > budget.compactAt) {
      onText(`\n[Context compacted: ${currentTokens} tokens → reducing to fit window]\n`)
      compactMessages(messages, pinned)
      if (estimateTokens(messages) > budget.limit) {
        // Report the POST-compaction count — the pre-compaction currentTokens
        // is stale by the time compaction has run.
        return renderTimeline(timeline, `Advisor: context window limit reached (${estimateTokens(messages)} tokens). Review incomplete — too many tool calls. Try a narrower scope.`)
      }
    }
    
    // LLM generation silence: the reasoning phase produces no SSE bytes for
    // seconds to tens of seconds (server-side prefill on large contexts, per
    // tool-round LLM return). A placeholder keeps the panel visibly working.
    // kind "think" (NOT "text"): the placeholder must land in the SAME buffer
    // and position as the upcoming reasoning — a "text"-kind placeholder
    // rendered BELOW the think block, and the reasoning stream appeared ABOVE
    // it ("the stream runs back to the front"). Same buffer = same spot; the
    // reasoning continues right where the placeholder sits.
    onOutput?.({ kind: "think", text: ADVISOR_THINKING_PLACEHOLDER })

    // 硬墙（§14.6 #1）：单次请求信号 = 用户信号 × 本调用 deadline（remaining）。复合信号
    // 无条件传入（上层检查与本调用之间的中止仍必须取消请求——已 aborted 的 composite 使请求
    // 立即失败）；此处改正了原指向 provider/core.mjs 组合 AbortSignal 的陈旧注释（§14.10 #3）。
    const callSignal = signal
      ? AbortSignal.any([signal, AbortSignal.timeout(remaining)])
      : AbortSignal.timeout(remaining)
    let response
    try {
      response = await chatCall(provider, {
        messages,
        tools: toolSchemas,
        signal: callSignal,
        onToken: (t) => { if (String(t ?? "").trim()) reviewTextProduced = true; onText(t) },
        onReasoning: onThink,
        // LOGGING（vscode advisor/run.mjs parity——按 stage 可 grep）
        // §18.6 D-TR4：轨迹元数据增补——kind=advisor（评审独立于子代理——T-TR2）；role
        // 透出调用方角色（eng-coder 内嵌评审时为 "eng-coder"）；session/cwd 供轨迹对回；
        // traces 开关沿 agent.config（D-TR6）。
        logCtx: {
          stage: "advisor",
          role: agent?._role ?? null,
          kind: "advisor",
          session: agent?._sessionStart ?? null,
          cwd,
          traces: agent?.config?.traces?.enabled !== false,
        },
      })
    } catch (e) {
      // 墙判定绑信号状态（§14.6 #1——非异常名）：① 用户信号已中止 ⇒ 原样上抛（中断语义
      // 零变）；② 复合信号已中止（墙触发）而用户信号未中止 ⇒ 结构化超时尾（形态①：抛错；
      // AbortError / TimeoutError 两名兜底——AbortSignal.timeout 的 reason 是 TimeoutError
      // DOMException）；③ 其余错误原样上抛（runAdvisorReview 的失败分类不变）。
      if (signal?.aborted) throw e
      if (callSignal.aborted || e?.name === "AbortError" || e?.name === "TimeoutError") {
        return renderTimeline(timeline, timeoutTail(timeoutMs, turns, toolCallCount, reviewTextProduced))
      }
      throw e
    }
    if (signal?.aborted) return renderTimeline(timeline, "Advisor: interrupted.")
    // 形态②（§14.6 #1）：不抛错而返回 partial（流已有内容时中断以 partial:true 透传）——
    // 不得按普通结果收尾：墙触发（复合信号已中止）同判。
    if (callSignal.aborted && response?.partial) {
      return renderTimeline(timeline, timeoutTail(timeoutMs, turns, toolCallCount, reviewTextProduced))
    }

    // No tool calls — this is the final review text. The final answer was
    // already streamed into the timeline via onText; fall back to
    // response.content only if nothing was recorded.
    if (!response.toolCalls?.length) {
      if (!response.content?.trim()) return renderTimeline(timeline) || "Advisor: empty response — review was inconclusive"
      return renderTimeline(timeline) || response.content.trim()
    }

    // Push assistant message with tool calls. reasoning_content ECHO is
    // mandatory for reasoningEcho:"required" providers (deepseek/kimi): the
    // server stops returning reasoning_content on later rounds when the
    // tool-call assistant history lacks it — the observed "reasoning stops
    // after the first tool call, returns only at the final answer" symptom.
    // Mirrors the main agent's push (agent.mjs).
    messages.push({
      role: "assistant",
      content: response.content || null,
      tool_calls: response.toolCalls.map((tc) => ({
        id: tc.id, type: "function",
        function: { name: tc.name, arguments: tc.arguments },
      })),
      ...(response.reasoning && providerSpec(provider).reasoningEcho === "required"
        ? { reasoning_content: response.reasoning }
        : {}),
    })

    // B1 (AGENT-LOOP.md §18.7 D-TS7): the SAME LLM reply's multiple read-only
    // tool calls run in PARALLEL (Promise.all) — results are backfilled in
    // toolCalls order (Promise.all preserves the input order → tool_call_id
    // never mismatches); each tool's timeout/error is captured independently
    // (the existing TOOL_TIMEOUT stays — one failing tool does not block the
    // others); progress lines are emitted in toolCalls order. The read-only
    // tool set has no side effects — no sequencing/serialization needed.
    // Scope note (round1 review #10): B1 is ONLY in-loop tool parallelism — it
    // does NOT solve the TODO "platform execution: advisor parallel calls are
    // actually serial" mystery (docs/TODO.md — LOGGING evidence item), which
    // concerns multiple advisor CALLS observed as serial, not one reply's
    // tool calls.
    const parsed = response.toolCalls.map((tc) => {
      const tool = toolByName.get(tc.name)
      let args = {}
      let parseError = null
      try {
        args = JSON.parse(tc.arguments || "{}")
      } catch (e) {
        parseError = `Error: invalid JSON in tool arguments: ${e.message}\nRaw arguments: ${(tc.arguments || "").slice(0, 200)}`
      }
      return { tc, tool, args, parseError }
    })
    toolCallCount += parsed.length
    // Progress lines first, in toolCalls order (emitted before the parallel
    // run — display order is independent of completion order).
    for (const p of parsed) {
      if (p.parseError) continue // parse-error tools get no progress line (legacy behavior)
      const argsLine = describeToolArgs(p.tc.name, p.args)
      onTool(`\n→ ${p.tc.name}${argsLine ? " " + argsLine : ""}\n`)
    }
    // Every tool runs CONCURRENTLY; each result/error lands in its own slot —
    // Promise.all preserves input order, so index i always matches parsed[i].
    const executed = await Promise.all(parsed.map(async (p) => {
      // Parse failure → error to model immediately (no execution)
      if (p.parseError) return p.parseError
      if (!p.tool) return `Error: unknown tool "${p.tc.name}". Available: ${[...toolByName.keys()].join(", ")}`
      // Execute with timeout (clear the timer when the tool wins the race —
      // otherwise up to MAX_ADVISOR_TURNS dangling timers accumulate)
      try {
        let timeoutId
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`tool timeout after ${TOOL_TIMEOUT_MS}ms`)), TOOL_TIMEOUT_MS)
        })
        let toolPromise
        try {
          toolPromise = p.tool.execute(p.args, { cwd, agent, onOutput, signal })
          return await Promise.race([toolPromise, timeoutPromise])
        } finally {
          clearTimeout(timeoutId)
          // Timeout won → toolPromise is still pending; a later rejection
          // would surface as an unhandled rejection. The race already
          // consumed the result/error in the normal path, so this no-op
          // catch only fires for the abandoned-tool case.
          toolPromise?.catch(() => {})
        }
      } catch (e) {
        const errorType = e.message.includes("timeout") ? "timeout"
          : e.message.includes("ENOENT") ? "file_not_found"
          : e.message.includes("permission") ? "permission_denied"
          : "execution_error"
        return `Error (${errorType}): ${e.message}`
      }
    }))

    // Backfill in toolCalls order (executed[i] ↔ parsed[i]); per-result
    // non-string serialization + dual-end line-aware truncation stay per-tool
    // (DUAL-END-TRUNCATION F-2 — truncate.mjs: head ≈60% + tail ≈40% — keep the
    // tail verdicts; ≤ MAX_RESULT_CHARS results pass through untouched).
    for (let i = 0; i < parsed.length; i++) {
      let result = executed[i]
      if (typeof result !== "string") result = JSON.stringify(result)

      result = truncateAdvisorResult(result, MAX_RESULT_CHARS)

      messages.push({ role: "tool", tool_call_id: parsed[i].tc.id, content: result })
    }
  }
}
// Test seam (T-TS8/9): the tool loop itself — toolsOverride injects a mock tool
// set with controllable timing/errors (the real set comes from advisorToolsFor).
export { runAdvisorToolLoop, runAdvisorToolLoop as _runAdvisorToolLoop }
