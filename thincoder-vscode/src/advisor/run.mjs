/**
 * advisor/run.mjs — advisor execution: provider resolution and the review entry point.
 * VS Code port of thincoder CLI src/advisor/run.mjs (kept in sync with the CLI).
 * 2026-09-08 结构债批 6（511 > 500 硬限拆分）：read-only 工具集 + 测试覆写 seam →
 * ./tools.mjs；resolveAdvisorProvider → ./provider.mjs。
 * 2026-09-11 第 12 批（468 + 本批新增守卫必越 500）：工具循环 + 墙/提示接线 →
 * ./loop.mjs；限额 / 压缩定锚 / 谓词族 / 文案 / 结构化尾 → ./compaction.mjs。
 * 本档 = 组装入口 + 压缩定锚简报构建 + 引文 scope 传参 + **re-export 面**
 *（既有 import 面零改——消费方与测试 import 兼容，模块拆分先例 citations.mjs）。
 */
import { prepareAdvisorMessages } from "./main.mjs"
import { injectObjectDeclaration, buildReviewObjectDeclaration, buildDesignApprovalBlock } from "./messages.mjs"
import { appendCitationReport } from "./citations.mjs"
import { runAdvisorToolLoop } from "./loop.mjs"
import { estimateTokens } from "./compaction.mjs"
import { resolveAdvisorProvider } from "./provider.mjs"

// 拆分后 re-export 面（既有导出名逐一保面——见本档头注）。
export { ADVISOR_THINKING_PLACEHOLDER, MAX_RESULT_CHARS, renderTimeline as _renderTimeline, advisorIncompleteMarker } from "./compaction.mjs"
export { runAdvisorToolLoop as _runAdvisorToolLoop } from "./loop.mjs"
// _advisorToolsFor / _setAdvisorToolSetForTest — moved to tools.mjs (2026-09-08
// 结构债批 6——run.mjs 511 > 500 硬限拆分——模块拆分先例 citations.mjs——测试覆写 seam
// 状态随迁 tools.mjs；run.mjs 经 _resolvedAdvisorToolsFor 消费）。kept re-exported
// here for import compatibility (CLI-parity test import paths).
export { advisorToolsFor as _advisorToolsFor, _setAdvisorToolSetForTest } from "./tools.mjs"
// resolveAdvisorProvider — moved to provider.mjs (2026-09-08 结构债批 6——run.mjs 511
// > 500 硬限拆分——config-io import 随迁）。kept re-exported here for import
// compatibility (advisor.mjs / advisor-async.mjs import it from run.mjs).
export { resolveAdvisorProvider } from "./provider.mjs"

// Mechanical convergence cap: the protocol assumes up to 5 rounds suffice
// (full review, verify+fix cycles, strict verification). A 6th call means the
// model is looping — refuse it instead of burning tokens on a review that cannot
// converge. CODE REVIEWS ONLY (2026-09-07 §8 ruling): design reviews are EXEMPT
// — their rounds keep advancing (convergence prompts + displays), but a 6th
// design call is never refused by the cap.
export const MAX_ADVISOR_ROUNDS = 5
const MAX_UNFIXED_DISPLAY = 10 // unfixed issues shown in the cap message

/**
 * 启动拒绝报告前缀（F24/§14.3——稳定契约）：异步结算面（advisor-async 消费点）据此不置
 * `_calledAdvisorThisRun`——未发起 = 无评审产出。工具路径恒签发 token ⇒ 本拒绝 =
 * 直接调用方兜底（防御纵深；CLI §14.4 #2 同款口径——同文字面）。
 */
export const ADVISOR_LAUNCH_REFUSAL_PREFIX = "Advisor: design review launch refused"

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
 * 压缩定锚简报（F20/§13.4 契约三）——**由评审参数构建**（非模型输出）：对象声明 /
 * 文档清单 / Approval Signal 三锚；重内容（项目指南 / 方法论 / 文档地图）不入 pin
 * （压缩的意义所在）。首行为机械化重挂说明（逐字）。
 */
function buildPinnedBrief(reviewType, documents, object, designToken, designId) {
  const docList = Array.isArray(documents) ? documents.filter((d) => typeof d === "string" && d.trim()) : []
  const parts = ["[review brief — re-attached after context compaction; the original review request is no longer in the context]"]
  const declaration = buildReviewObjectDeclaration(object)
  if (declaration) parts.push(declaration.trimEnd())
  if (docList.length > 0) {
    parts.push("## Documents to Review")
    parts.push(docList.map((d) => `- ${d} — Read this file in full`).join("\n"))
  }
  if (reviewType === "design" && designToken) parts.push(buildDesignApprovalBlock(designToken, designId))
  return parts.join("\n\n")
}

/**
 * 收敛 cap 拒绝文案（单源——群 A 批 A6：runner 内部拒与本文件工具层预检同用一份 builder，
 * 输出逐字零变；双源消解）。
 */
export function buildCapMessage(agent) {
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

/**
 * Run an advisor review. reviewType: "code" (default) or "design". Returns review text or null when skipped.
 * @param {string|null} [designToken] — injected into the design-review prompt; the advisor echoes it only on approval.
 * @param {string[]|null} [documents] — design review only: explicit list of doc paths to review; passed through to the message builder.
 * @param {string[]|null} [paths] — code review only: explicit list of file/dir paths to review; passed through to the message builder.
 * @param {Object|null} [object] — review-object declaration {type, target, status, reason, exclude}
 *   (AGENT-LOOP.md §18.8 D-OA3): injected at the head of the review user message, every round.
 *   Legacy callers omit it — no declaration injected, behavior unchanged (AC-OA2).
 * @param {Object|null} [rv] — §9 D-24b per-review instance context { round, priorOutput }
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
  // §9 D-24b：async 实例（rv 给定）的 cap 在 runner launch 时按实例判定（每评审 ≤5 轮——
  // 修正 #4——code-only——design 豁免）——此处只拦 sync 全局轮次。
  if (!rv && reviewType !== "design" && (agent._advisorRound || 0) >= MAX_ADVISOR_ROUNDS) {
    return buildCapMessage(agent)
  }

  const provider = resolveAdvisorProvider(agent)
  // Advisor always works in the agent's cwd — scope is defined by paths/documents.
  const advisorCwd = agent.cwd

  const messages = prepareAdvisorMessages(agent, reviewType, designToken, documents, paths, null, rv, designId)

  // F24/§14.3 启动断言（fail-closed——CLI §14.4 #2 语义同源）：设计评审请求内**必须**携带与
  // 本次签发 token 精确对应的 Approval Signal——构建面补不上就拒绝启动（不发"请回显一个
  // 不存在的 token"的请求）。工具路径恒签发 token ⇒ 直接调用方兜底（正常链不可达＝防御纵深，如实注）。
  if (reviewType === "design") {
    const missing = !designToken
      ? "no design token was minted"
      : (messages.some((m) => m.role === "user" && String(m.content ?? "").includes(`[DESIGN-TOKEN:${designToken}`))
        ? null
        : "the request does not carry the approval signal")
    if (missing) {
      return `${ADVISOR_LAUNCH_REFUSAL_PREFIX} — ${missing}. Nothing was sent: a request that asks the reviewer to echo a token it cannot see would break the credential chain. Re-run advisor(type='design') to mint a fresh token.`
    }
  }

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

  // §2.20.2/§2.22.5 评审侧批次档实例绑定（第 5 批 VSC 适配点②）：只有**设计评审**才可能带写
  // 通道。异步路 = `rv.batchDoc`（本评审实例键——与 round/priorOutput 同族：并发各绑各档，
  // 不用单值会话态）；同步路 = 调用点 `callbacks.batchDoc`（该路径无 rv 实例——传入非空 rv 会
  // 改变 round/prior 解析，故沿用 per-call 通道，同样不是会话态）。
  // 判别行为：未传 → 工具不挂载、评审照常（零回归）；不可读在调用点已 throw。
  const boundBatchDoc = reviewType === "design"
    ? (rv && "batchDoc" in rv ? rv.batchDoc ?? null : (callbacks && "batchDoc" in callbacks ? callbacks.batchDoc ?? null : null))
    : null

  // F20/§13.4 契约三：压缩定锚简报（评审参数构建——压缩触发时由 compaction 重挂）。
  const pinned = buildPinnedBrief(reviewType, documents, object, designToken, designId)

  try {
    const result = await runAdvisorToolLoop(provider, messages, onOutput, signal, agent, advisorCwd, reviewType, boundBatchDoc, pinned)

    // Host-verified citations (decision d698434): mechanically check every
    // `file:line: content` reference in the review against the CURRENT file
    // state. LLMs cannot self-enforce the evidence rule — the model may quote
    // the prior table instead of re-reading (three consecutive false reports
    // cited pre-fix file content). Unverified citations must not support a
    // push-back; the parent agent sees the verification report.
    // F21/§13.4 契约一：解析候选 = cwd + 评审对象声明范围派生根（scope = documents + paths）。
    let final = result
    if (!result.trimStart().startsWith("Advisor:")) {
      final = appendCitationReport(result, advisorCwd, { scope: [...(documents ?? []), ...(paths ?? [])] })
      // Success path: keep the FULL review output for convergence rounds —
      // round 2+ injects this verbatim and the model understands it (decision
      // 2026-08-08: prior-table hard parsing removed; no phrase/header matching).
      // Guard: only store outputs that actually carry a review — a markdown
      // table row (`| a | b | c |`) or substantial prose (>200 chars). An
      // empty or tool-progress-only reply must not become the "prior review"
      // of round 2+.
      const trimmed = final.trim()
      const looksLikeReview = /\|.*\|.*\|/.test(trimmed) || trimmed.length >= 200
      // §9 D-24b：async 实例完成不写全局 _lastAdvisorOutput（并发隔离——实例 prior
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
