/**
 * advisor/loop.mjs — advisor 工具循环（chat → 执行工具 → 复） + 墙/提示接线
 * （2026-09-11 第 12 批拆分：run.mjs 468 行，本批新增守卫必越 500 硬帽——拆线 =
 * 本档 + ./compaction.mjs（限额 / 压缩定锚 / 谓词族 / 文案 / 结构化尾）；镜像 CLI 同名
 * 拆线，本端原文自持）。既有 import 面经 run.mjs re-export 保持不变。
 *
 * 第 12 批（F22/§13.4 契约五）：每次 chat 调用携带**硬墙**信号
 * （`用户信号 × AbortSignal.timeout(remaining)`——组合经 `combineSignals`：`.any` 特征
 * 检测 + 本地兜底，见下）；墙判定**绑信号状态**
 * （非异常名）：抛错路径（用户信号已中止 ⇒ 原样上抛 / 复合信号已中止或 AbortError·
 * TimeoutError 名 ⇒ 结构化超时尾 / 其余上抛）+ 不抛错返回路径（用户信号 ⇒ 中断尾 /
 * 复合信号已中止且 `response.interrupted` ⇒ 结构化超时尾——本端传输层中止返回形态 =
 * `interrupted` 字段，非 interrupt 中止抛错），并按 0.75 一次性预算提示 + 结构化超时尾
 * 收尾（守卫函数与文案在 compaction.mjs）。
 */
import { chat } from "@thincoder/core/provider/core.mjs"
import { specForModel } from "../specs.mjs"
import { truncateAdvisorResult } from "./truncate.mjs"
import { _resolvedAdvisorToolsFor } from "./tools.mjs"
import {
  estimateTokens, compactMessages, shouldBudgetNudge, budgetNudgeText, timeoutTail, renderTimeline,
  advisorContextBudget, MAX_ADVISOR_TURNS, TOOL_TIMEOUT_MS, REVIEW_TIMEOUT_MS, MAX_RESULT_CHARS,
  ADVISOR_THINKING_PLACEHOLDER,
} from "./compaction.mjs"

/** 硬墙信号组合（用户信号 × 本调用 deadline）：`AbortSignal.any` 在 VS Code 引擎的 Node 18
 *  上缺席（本仓 `src/mcp/http.mjs` 同款 fallback 先例）——特征检测 + 本地组合兜底，语义
 *  一致（任一输入 abort 即触发；已 aborted 的输入立即生效、reason 透传）。 */
function combineSignals(signals) {
  if (typeof AbortSignal.any === "function") return AbortSignal.any(signals)
  const ctrl = new AbortController()
  for (const s of signals) {
    if (!s) continue
    if (s.aborted) { ctrl.abort(s.reason); return ctrl.signal }
    s.addEventListener("abort", () => ctrl.abort(s.reason), { once: true })
  }
  return ctrl.signal
}

/** Compact one-line summary of tool args for panel progress lines.
 *  Picks the most identifying field; falls back to truncated JSON. */
function summarizeToolArgs(args) {
  // e.g. "read src/x.mjs", "grep foo src/", "ls docs" — action first when present
  const parts = [args.action, args.path ?? args.pattern ?? args.command].filter((v) => v != null)
  let s = parts.length > 0 ? parts.map(String).join(" ") : JSON.stringify(args)
  s = s.replace(/\s+/g, " ").trim()
  return s.length > 80 ? s.slice(0, 79) + "…" : s
}

/**
 * Run the advisor's tool loop: chat → execute tools → repeat.
 * Stops when the model produces text without tool calls.
 *
 * Progress lines (→ tool args) are emitted via onOutput between model bursts so
 * the panel keeps moving while the advisor explores — otherwise the panel sits
 * frozen through every tool-call phase and the review appears to have stalled.
 *
 * @param {string|null} [pinned] — 压缩定锚简报（评审参数构建——F20/§13.4 契约三）。
 * @param {{now?: Function, chat?: Function}} [seams] — 测试缝（默认 Date.now / chat——
 *   生产调用不传，`??` 默认回退零行为变）。
 */
async function runAdvisorToolLoop(provider, messages, onOutput, signal, agent, cwd, reviewType = "code", batchDoc = null, pinned = null, seams = {}) {
  const now = seams.now ?? Date.now
  const chatCall = seams.chat ?? chat
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
  const { schemas: toolSchemas, byName: toolByName } = _resolvedAdvisorToolsFor(agent, reviewType, batchDoc)
  let turns = 0
  let toolCallCount = 0
  let reviewTextProduced = false
  let budgetNudged = false
  const startTime = now()
  // 评审上下文预算（第 26 批——§15.5 契约二）：循环体外一次性派生，provider 全场不变。
  const budget = advisorContextBudget(provider)

  while (true) {
    // Interrupted (Ctrl+I) — stop immediately instead of spinning a fresh uncancellable signal
    if (signal?.aborted) return renderTimeline(timeline, "Advisor: interrupted.")

    // Check review timeout (default 10 minutes; agent.advisor.timeoutMs overrides).
    // Runtime validation (design review #1, 2026-08-24): hand-written config.json
    // invalid values (0/negative/string) must not silently disable or immediately
    // trigger the timeout — invalid values fall back to the default.
    const cfg = agent.config?.advisor?.timeoutMs
    const timeoutMs = (Number.isFinite(cfg) && cfg > 0) ? cfg : REVIEW_TIMEOUT_MS
    const elapsed = now() - startTime
    const remaining = timeoutMs - elapsed
    // 硬墙（§13.4 契约五）：预算用尽 → 结构化超时尾（首行 = 判定族 timeout 前缀）。
    if (remaining <= 0) {
      return renderTimeline(timeline, timeoutTail(timeoutMs, turns, toolCallCount, reviewTextProduced))
    }
    // 0.75 一次性预算提示（§13.4 契约五——同一检查点、每场评审至多一次）：注入一条 user
    // 消息促模型在墙前收敛产出（不改语义判据、不碰提示词面）。
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
      // F20：pinned（评审参数构建）在压缩动作内重挂——对象声明 / 文档清单 / Approval
      // Signal 三锚压缩后仍在（§13.4 契约三）。
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

    // 硬墙（§13.4 契约五）：单次请求信号 = 用户信号 × 本调用 deadline（remaining）。复合
    // 信号无条件传入（上层检查与本调用之间的中止仍必须取消请求——已 aborted 的 composite
    // 使请求立即失败）。
    const callSignal = signal
      ? combineSignals([signal, AbortSignal.timeout(remaining)])
      : AbortSignal.timeout(remaining)
    let response
    try {
      response = await chatCall(provider, {
        messages,
        tools: toolSchemas,
        signal: callSignal,
        onToken: (t) => { if (String(t ?? "").trim()) reviewTextProduced = true; onText(t) },
        onReasoning: onThink,
        // LOGGING（LOGGING.md——CLI parity）：advisor 评审独立于子代理——按 stage 可 grep
        // TRACE-STORE-VSC（§18.6 D-TR4 镜像——CLI advisor/run.mjs logCtx 同款）：kind=advisor
        //（评审独立于子代理）；role 透出调用方角色（eng-coder 内嵌评审时为 "eng-coder"）；
        // session/cwd 供轨迹对回；traces 开关沿 agent.config（D-TR6——缺省 OFF）。
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
      // 墙判定绑信号状态（§13.4 契约五——非异常名）：① 用户信号已中止 ⇒ 原样上抛（中断
      // 语义零变）；② 复合信号已中止（墙触发）而用户信号未中止 ⇒ 结构化超时尾（形态①：
      // 抛错；AbortError / TimeoutError 两名兜底——AbortSignal.timeout 的 reason 是
      // TimeoutError DOMException）；③ 其余错误原样上抛（runAdvisorReview 分类不变）。
      if (signal?.aborted) throw e
      if (callSignal.aborted || e?.name === "AbortError" || e?.name === "TimeoutError") {
        return renderTimeline(timeline, timeoutTail(timeoutMs, turns, toolCallCount, reviewTextProduced))
      }
      throw e
    }
    if (signal?.aborted) return renderTimeline(timeline, "Advisor: interrupted.")
    // 形态②（§13.4 契约五）：不抛错而返回中止结果——不得按普通结果收尾：墙触发（复合
    // 信号已中止）且传输层报 `interrupted`（本端中止返回形态）同判结构化超时尾。
    if (callSignal.aborted && response?.interrupted) {
      return renderTimeline(timeline, timeoutTail(timeoutMs, turns, toolCallCount, reviewTextProduced))
    }

    // No tool calls — this is the final review text
    if (!response.toolCalls?.length) {
      if (!response.content?.trim()) return renderTimeline(timeline) || "Advisor: (empty response — review was inconclusive)"
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
      ...(response.reasoning && specForModel(provider.model).reasoningEcho === "required"
        ? { reasoning_content: response.reasoning }
        : {}),
    })

    // Execute each tool call — B1 batch parallelism (AGENT-LOOP.md §18.7 D-TS7):
    // the read-only tool calls of ONE LLM reply run CONCURRENTLY (Promise.all —
    // same semantics as the main loop's read-only batch dispatch). Results are
    // filled back in toolCalls order (Promise.all preserves order — tool_call_id
    // can never mismatch); every tool's error/timeout is caught independently
    // (the TOOL_TIMEOUT race stays per-tool — one failure never affects the
    // others); `onTool` progress lines are emitted in toolCalls order (the
    // display order is irrelevant — they are produced before any tool settles).
    // Scope note: this is IN-TURN tool parallelism only — it does NOT address
    // the "multiple advisor calls arrive serial" observation (docs/TODO.md
    // LOGGING evidence item; D-TS7 isolation statement).
    const toolResults = await Promise.all(response.toolCalls.map(async (tc) => {
      const tool = toolByName.get(tc.name)
      let args = {}
      try {
        args = JSON.parse(tc.arguments || "{}")
      } catch (e) {
        return `Error: invalid JSON in tool arguments: ${e.message}\nRaw arguments: ${(tc.arguments || "").slice(0, 200)}`
      }
      toolCallCount += 1

      onTool(`\n→ ${tc.name} ${summarizeToolArgs(args)}\n`)
      let result
      if (!tool) {
        result = `Error: unknown tool "${tc.name}". Available: ${[...toolByName.keys()].join(", ")}`
      } else {
        // Execute with timeout (clear the timer when the tool wins the race —
        // otherwise up to MAX_ADVISOR_TURNS dangling timers accumulate)
        try {
          let timeoutId
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`tool timeout after ${TOOL_TIMEOUT_MS}ms`)), TOOL_TIMEOUT_MS)
          })
          let toolPromise
          try {
            toolPromise = tool.execute(args, { cwd, agent, onOutput, signal })
            result = await Promise.race([toolPromise, timeoutPromise])
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
          result = `Error (${errorType}): ${e.message}`
        }
      }
      if (typeof result !== "string") result = JSON.stringify(result)

      // DUAL-END-TRUNCATION F-2 (CLI parity — truncate.mjs, 2026-09-09): 头尾双保
      //（头 ~60% + 中段省略注 + 尾 ~40%——评审尾结论不被切）——≤ MAX_RESULT_CHARS 原样透传。
      result = truncateAdvisorResult(result, MAX_RESULT_CHARS)

      return result
    }))
    // Backfill in toolCalls order — one message per call, each carrying the id
    // the model issued for it (the batch order is never swapped).
    response.toolCalls.forEach((tc, i) => {
      messages.push({ role: "tool", tool_call_id: tc.id, content: toolResults[i] })
    })
  }
}
// Test seam (mirrors the CLI's _renderTimeline pattern): the timeout/truncation
// tests drive the loop against a local mock LLM server.
export { runAdvisorToolLoop, runAdvisorToolLoop as _runAdvisorToolLoop }
