/**
 * advisor/run.mjs — advisor execution: tool loop, provider resolution, and the review entry point.
 * VS Code port of thincoder CLI src/advisor/run.mjs (kept in sync with the CLI).
 * 2026-09-08 结构债批 6（511 > 500 硬限拆分）：read-only 工具集 + 测试覆写 seam →
 * ./tools.mjs；resolveAdvisorProvider → ./provider.mjs——run.mjs 保留 re-export shim
 *（_advisorToolsFor/_setAdvisorToolSetForTest/resolveAdvisorProvider——消费面与测试
 * import 兼容——模块拆分先例 citations.mjs）。
 */
import { chat } from "../provider.mjs"
import { specForModel } from "../specs.mjs"
import { prepareAdvisorMessages } from "./main.mjs"
import { injectObjectDeclaration } from "./messages.mjs"
import { appendCitationReport } from "./citations.mjs"
import { _resolvedAdvisorToolsFor } from "./tools.mjs"
import { resolveAdvisorProvider } from "./provider.mjs"
import { truncateAdvisorResult } from "./truncate.mjs"

const MAX_ADVISOR_TURNS = 100
// Mechanical convergence cap: the protocol assumes up to 5 rounds suffice
// (full review, verify+fix cycles, strict verification). A 6th call means the
// model is looping — refuse it instead of burning tokens on a review that cannot
// converge. CODE REVIEWS ONLY (2026-09-07 §8 ruling): design reviews are EXEMPT
// — their rounds keep advancing (convergence prompts + displays), but a 6th
// design call is never refused by the cap.
export const MAX_ADVISOR_ROUNDS = 5

// NOTE: prompts/advisor-round{1,2,3}.md encourage the model to finish within
// ~30 tool turns — a prompt-level efficiency target, DISTINCT from the
// 100-turn mechanical hard cap (MAX_ADVISOR_TURNS above; pure runaway-loop
// guard). They serve different purposes; do NOT synchronize them.

// The live "[thinking…]" wait indicator shares its exact text with the TUI
// cleanup regex (agent-turn.mjs strips it before flushing to history) — keep
// them in lockstep.
export const ADVISOR_THINKING_PLACEHOLDER = "\n[thinking…]\n"

// Context window limits
const MAX_CONTEXT_TOKENS = 120_000 // Reserve headroom to avoid OOM
const TOOL_TIMEOUT_MS = 30_000 // single tool timeout
const REVIEW_TIMEOUT_MS = 600_000 // whole review timeout (10 minutes; agent.advisor.timeoutMs overrides)
export const MAX_RESULT_CHARS = 64 * 1024 // tool result truncation (line-aware; 64K, aligned with main offload limit)
const MAX_UNFIXED_DISPLAY = 10 // unfixed issues shown in the cap message
const MAX_KEY_FILES_IN_COMPACTION = 5 // files named in the compaction summary

/** Estimate token count from messages (rough: 1 token ≈ 4 chars) */
function estimateTokens(messages) {
  return messages.reduce((sum, msg) => {
    const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content || "")
    const toolCalls = msg.tool_calls ? JSON.stringify(msg.tool_calls) : ""
    return sum + Math.ceil((content.length + toolCalls.length) / 4)
  }, 0)
}

/** Compact early messages when context grows too large — LOCAL trimming only
 *  (no LLM summarization). MUTATES in place (splice) so the caller's array
 *  reference stays valid — a reassignment would leave the caller's logging
 *  (tool-call count, token estimate) reading a stale array. */
function compactMessages(messages) {
  // Keep: system prompt, last 20 messages (≈ 10 assistant+tool exchanges),
  // user message — the rest is summarized.
  if (messages.length <= 20) return

  const system = messages[0]
  const recent = messages.slice(-20)
  const old = messages.slice(1, -20)

  // Count actual tool messages (old.length counts user/assistant rows too)
  const toolCount = old.filter((m) => m.role === "tool").length
  const keyFiles = old
    .filter((m) => m.role === "tool")
    .map((m) => m.content?.split("\n")[0]?.slice(0, 50)) // first line of tool results typically names the file that was read/grepped
    .filter(Boolean)
    .slice(0, MAX_KEY_FILES_IN_COMPACTION)
  const filesPart = keyFiles.length > 0 ? ` Key files examined: ${keyFiles.join(", ")}` : ""
  const summary = `Earlier exploration: ${toolCount} tool calls completed.${filesPart}`

  messages.splice(0, messages.length,
    system,
    { role: "user", content: `[Context compacted] ${summary}` },
    ...recent)
}

// _advisorToolsFor / _setAdvisorToolSetForTest — moved to tools.mjs (2026-09-08
// 结构债批 6——run.mjs 511 > 500 硬限拆分——模块拆分先例 citations.mjs——测试覆写 seam
// 状态随迁 tools.mjs；run.mjs 经 _resolvedAdvisorToolsFor 消费）。kept re-exported
// here for import compatibility (CLI-parity test import paths).
export { advisorToolsFor as _advisorToolsFor, _setAdvisorToolSetForTest } from "./tools.mjs"

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
 * Render the ordered review timeline — thinking / tool progress / final text
 * interleaved EXACTLY as emitted, so the persisted record shows the review
 * process at its real positions. A summary appended at the end would lose the
 * order (the user-visible "no tool calls in the advisor record" gap). The
 * live "[thinking…]" placeholder is stripped (wait indicator, not content).
 */
function renderTimeline(timeline, tail = "") {
  const body = timeline
    .map((b) => b.text.replaceAll(ADVISOR_THINKING_PLACEHOLDER, "").trim())
    .filter(Boolean)
    .join("\n\n")
  return [body, tail].filter(Boolean).join("\n\n")
}
// Test seam (mirrors the CLI's _renderTimeline).
export { renderTimeline as _renderTimeline }

/**
 * Run the advisor's tool loop: chat → execute tools → repeat.
 * Stops when the model produces text without tool calls.
 *
 * Progress lines (→ tool args) are emitted via onOutput between model bursts so
 * the panel keeps moving while the advisor explores — otherwise the panel sits
 * frozen through every tool-call phase and the review appears to have stalled.
 */
async function runAdvisorToolLoop(provider, messages, onOutput, signal, agent, cwd) {
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
  const { schemas: toolSchemas, byName: toolByName } = _resolvedAdvisorToolsFor(agent)
  let turns = 0
  const startTime = Date.now()
  
  while (true) {
    // Interrupted (Ctrl+I) — stop immediately instead of spinning a fresh uncancellable signal
    if (signal?.aborted) return renderTimeline(timeline, "Advisor: interrupted.")
    
    // Check review timeout (default 10 minutes; agent.advisor.timeoutMs overrides).
    // Runtime validation (design review #1, 2026-08-24): hand-written config.json
    // invalid values (0/negative/string) must not silently disable or immediately
    // trigger the timeout — invalid values fall back to the default.
    const cfg = agent.config?.advisor?.timeoutMs
    const timeoutMs = (Number.isFinite(cfg) && cfg > 0) ? cfg : REVIEW_TIMEOUT_MS
    if (Date.now() - startTime > timeoutMs) {
      return renderTimeline(timeline, `Advisor: review timeout after ${Math.round(timeoutMs / 1000)}s. Partial results may be available. Try again with a narrower scope.`)
    }
    
    if (++turns > MAX_ADVISOR_TURNS) {
      return renderTimeline(timeline, "Advisor: stopped after " + MAX_ADVISOR_TURNS + " tool rounds — the review appears to be looping. You may retry with a narrower scope.")
    }
    
    // Check context window and compact if needed
    const currentTokens = estimateTokens(messages)
    if (currentTokens > MAX_CONTEXT_TOKENS * 0.8) {
      onText(`\n[Context compacted: ${currentTokens} tokens → reducing to fit window]\n`)
      compactMessages(messages)
      if (estimateTokens(messages) > MAX_CONTEXT_TOKENS) {
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

    const response = await chat(provider, {
      messages,
      tools: toolSchemas,
      // Pass the signal UNCONDITIONALLY: a signal aborted between the check
      // above and here must still cancel the fetch. core.mjs composes
      // AbortSignal.any([signal, timeout]) — an already-aborted signal makes
      // the request fail immediately instead of ignoring the interrupt.
      signal: signal ?? null,
      onToken: onText,
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
export { runAdvisorToolLoop as _runAdvisorToolLoop }

// resolveAdvisorProvider — moved to provider.mjs (2026-09-08 结构债批 6——run.mjs 511
// > 500 硬限拆分——config-io import 随迁）。kept re-exported here for import
// compatibility (advisor.mjs / advisor-async.mjs import it from run.mjs).
export { resolveAdvisorProvider } from "./provider.mjs"

/**
 * Extract unfixed issues from prior review text (for the cap message).
 * Input: an advisor review markdown table (`| # | … |` rows). A row counts as
 * unfixed unless its line carries a resolved-status word (fixed/resolved/done/
 * addressed/corrected, ✓/✔). Returns at most MAX_UNFIXED_DISPLAY plain
 * (pipe-stripped) row strings.
 */
function extractUnfixedIssues(priorText) {
  if (!priorText) return []
  const lines = priorText.split("\n")
  // Resolved-status words: fixed/resolved/done/addressed/corrected (+ ✓/✔).
  // \b prevents "unfixed"/"prefixed" from matching "fixed".
  const resolvedRe = /\b(?:fixed|resolved|done|addressed|corrected)\b|✓|✔/i
  return lines
    .filter((line) => /\|\s*\d+\s*\|/.test(line)) // 匹配表格行
    .filter((line) => !resolvedRe.test(line))
    // Strip only the leading/trailing table pipes — inner pipes (escaped or
    // in-cell content) stay intact instead of garbling the cap message.
    .map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").trim())
    .filter(Boolean)
    .slice(0, MAX_UNFIXED_DISPLAY)
}

/**
 * Run an advisor review. reviewType: "code" (default) or "design". Returns review text or null when skipped.
 * @param {string|null} [designToken] — injected into the design-review prompt; the advisor echoes it only on approval.
 * @param {string[]|null} [documents] — design review only: explicit list of doc paths to review; passed through to the message builder.
 * @param {string[]|null} [paths] — code review only: explicit list of file/dir paths to review; passed through to the message builder.
 * @param {Object|null} [object] — review-object declaration {type, target, status, reason, exclude}
 *   (AGENT-LOOP.md §18.8 D-OA3): injected at the head of the review user message, every round.
 *   Legacy callers omit it — no declaration injected, behavior unchanged (AC-OA2).
 * @param {Object|null} [rv] — §24 D-24b per-review instance context { round, priorOutput }
 *   （async advisor——2026-09-06）：给定 → 轮次/prior 从实例解析、cap 判定在 runner
 *   （launch 时按实例 ≤5 轮拒）、完成不写全局 _lastAdvisorOutput（并发隔离）。
 * @param {string|null} [designId] — §29.1 F2a: injected next to the design token in
 *   the Approval Signal (passed through to the message builders).
 */
export async function runAdvisorReview(agent, reviewType, callbacks, designToken = null, documents = null, paths = null, object = null, rv = null, designId = null) {
  const onOutput = callbacks?.onOutput
  const signal = callbacks?.signal
  const startTime = Date.now()

  // Advisor reviews are ALWAYS available (2026-08-21 semantic refactor): the
  // former advisor.enabled gate is removed — review capability has no off
  // switch; only the guard (completion pushback) is opt-in via advisor.guard.

  // Mechanical convergence cap — CODE REVIEWS ONLY (2026-09-07 §8 ruling: design
  // reviews are exempt — their rounds keep advancing for the convergence prompts,
  // the cap never refuses them). For code reviews: refuse once the protocol has
  // run its rounds. _advisorRound counts completed advisor calls (incremented by
  // the agent after each sync code review), so >= MAX_ADVISOR_ROUNDS blocks the
  // next call. 5 rounds max; after that the review is never pushed back
  // (the caller decides: accept, manual re-check, or /new to reset).
  // §24 D-24b：async 实例（rv 给定）的 cap 在 runner launch 时按实例判定（每评审 ≤5 轮——
  // 修正 #4——code-only——design 豁免）——此处只拦 sync 全局轮次。
  if (!rv && reviewType !== "design" && (agent._advisorRound || 0) >= MAX_ADVISOR_ROUNDS) {
    // Summarize unresolved items from the last review output for guidance
    // (line-level status-word scan — no table-header parsing, decision 2026-08-08).
    const prior = agent._lastAdvisorOutput
    const unfixed = prior ? extractUnfixedIssues(prior) : []
    
    let message = `Advisor: convergence cap reached after ${MAX_ADVISOR_ROUNDS} rounds.\n`
    if (unfixed.length > 0) {
      message += `\nUnresolved issues from prior rounds:\n${unfixed.map((i) => `- ${i}`).join("\n")}\n`
    } else {
      message += "\nAll prior issues appear resolved.\n"
    }
    message += "\nOptions:\n1. Accept current state and proceed\n2. Manually review specific concerns with read/grep\n3. Start a new session (/new) to reset the advisor"
    
    return message
  }

  const provider = resolveAdvisorProvider(agent)
  // Advisor always works in the agent's cwd — scope is defined by paths/documents.
  const advisorCwd = agent.cwd

  const messages = prepareAdvisorMessages(agent, reviewType, designToken, documents, paths, null, rv, designId)

  // Review-object declaration (AGENT-LOOP.md §18.8 D-OA1): injected AFTER the
  // message build so ONE mechanical point covers all rounds — design r1
  // (buildAdvisorUserMessage design branch) AND code r1 AND convergence
  // rounds 2+ (buildAdvisorFollowUp) — the re-review stays anchored to the
  // same object (F-OA2, T-OA2). The declaration lands at the head of the
  // user message, before the Document Map / review content (D-OA1 order).
  const userIdx = messages.findIndex((m) => m.role === "user")
  if (userIdx !== -1) {
    messages[userIdx] = { ...messages[userIdx], content: injectObjectDeclaration(messages[userIdx].content, object) }
  }

  try {
    const result = await runAdvisorToolLoop(provider, messages, onOutput, signal, agent, advisorCwd)

    // Host-verified citations (decision d698434): mechanically check every
    // `file:line: content` reference in the review against the CURRENT file
    // state. LLMs cannot self-enforce the evidence rule — the model may quote
    // the prior table instead of re-reading (three consecutive false reports
    // cited pre-fix line content). Unverified citations must not support a
    // push-back; the parent agent sees the verification report.
    let final = result
    if (!result.trimStart().startsWith("Advisor:")) {
      final = appendCitationReport(result, advisorCwd)
      // Success path: keep the FULL review output for convergence rounds —
      // round 2+ injects this verbatim and the model understands it (decision
      // 2026-08-08: prior-table hard parsing removed; no phrase/header matching).
      // Guard: only store outputs that actually carry a review — a markdown
      // table row (`| a | b | c |`) or substantial prose (>200 chars). An
      // empty or tool-progress-only reply must not become the "prior review"
      // of round 2+.
      const trimmed = final.trim()
      const looksLikeReview = /\|.*\|.*\|/.test(trimmed) || trimmed.length >= 200
      // §24 D-24b：async 实例完成不写全局 _lastAdvisorOutput（并发隔离——实例 prior
      // 由 runner 记入 _advisorRuns 记录——多评审并行互不污染）。
      if (looksLikeReview && !rv) {
        agent._lastAdvisorOutput = final
      }
    }

    // Log review statistics for observability
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    const toolCallCount = messages.filter((m) => m.role === "tool").length
    const tokensUsed = estimateTokens(messages)
    onOutput?.({
      kind: "text",
      text: `\n[advisor] Review completed: ${elapsed}s, ${toolCallCount} tool calls, ~${Math.round(tokensUsed / 1000)}k tokens\n`,
    })
    return final
  } catch (e) {
    if (e.name === "AbortError" && signal?.reason?.interrupt) throw e
    
    // 细化错误类型
    const errorType = e.message.includes("rate limit") || e.message.includes("429") ? "rate limit"
      : e.message.includes("timeout") ? "timeout"
      : e.message.includes("network") || e.message.includes("ECONNREFUSED") ? "network"
      : e.message.includes("context length") ? "context_too_long"
      : "unknown"
    
    const retryAdvice = errorType === "rate limit"
      ? "Wait a moment and retry. Consider using a cheaper model for advisor."
      : errorType === "timeout"
        ? "The model took too long. Try with a narrower scope."
        : errorType === "context_too_long"
          ? "Reduce the scope (fewer files/paths) or use a model with larger context window."
          : "You may retry or proceed to verify manually."
    
    return `Advisor: review failed (${errorType}) — ${e.message || "unknown error"}. ${retryAdvice}`
  }
}
// Host-verified citations — moved to citations.mjs (kept re-exported here for
// import compatibility: tests and callers import from run.mjs).
export { extractCitations, verifyCitations, appendCitationReport } from "./citations.mjs"
