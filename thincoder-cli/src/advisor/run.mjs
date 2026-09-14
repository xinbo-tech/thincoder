/**
 * advisor/run.mjs — advisor execution: provider resolution and the review entry
 * point. Message building lives in advisor.mjs; the tool loop lives in loop.mjs
 * and the context/limit/tail guards in compaction.mjs（第 11 批硬帽拆分——
 * run.mjs 原 498/500；既有 import 面经 re-export 保持不变）。
 */
import { findProvider } from "../config.mjs"
import { prepareAdvisorMessages } from "../advisor.mjs"
import { buildObjectDeclarationBlock, buildDesignApprovalBlock } from "./messages.mjs"
import { appendCitationReport } from "./citations.mjs"
import { runAdvisorToolLoop } from "./loop.mjs"
import { advisorIncompleteMarker, estimateTokens } from "./compaction.mjs"
import { batchDocForReview } from "@thincoder/core/agent-tools/batch-segment.mjs"
// 第 33 批（§17.5 模块图）：护栏常量 / doc-set 键 / 记录读取——单向导入（review-streak 无回指）。
import {
  MAX_DESIGN_REVIEW_STREAK, docSetKey, designReviewStreakRecord, designReviewStreakStopped,
} from "../agent-tools/review-streak.mjs"

// 拆分后 import 面（既有导出名逐一保面——re-export；谓词为本批新增）。
export { ADVISOR_THINKING_PLACEHOLDER, MAX_RESULT_CHARS, renderTimeline as _renderTimeline } from "./compaction.mjs"
export { advisorToolsFor, advisorToolsFor as _advisorToolsFor } from "./loop.mjs"
export { runAdvisorToolLoop as _runAdvisorToolLoop } from "./loop.mjs"
export { advisorIncompleteMarker } from "./compaction.mjs"

// Mechanical convergence cap: up to 5 rounds suffice; a 6th call means the model
// is looping — refuse it instead of burning tokens. §11.2 D-24b (2026-09-06): PER
// REVIEW INSTANCE (agent._advisorRuns); CODE REVIEWS ONLY (2026-09-07 §8 ruling)
// — design reviews are EXEMPT: their rounds keep advancing, the cap never refuses.
export const MAX_ADVISOR_ROUNDS = 5

/** B 启动拒绝前缀（§14.4 #2）——稳定契约单源（三消费点同串）：run.mjs 生成；同步工具面
 *  据此登记 `_advisorRefusals`；异步结算面据此不置 `_calledAdvisorThisRun`。 */
export const ADVISOR_LAUNCH_REFUSAL_PREFIX = "Advisor: design review launch refused"

/** 评审失败护栏稳定前缀（第 33 批 §17.4——与 `ADVISOR_LAUNCH_REFUSAL_PREFIX` 同族；
 *  实现 grep / 用例断言锚）。凭证卫生：串内零 token / designId 值。 */
export const ADVISOR_DESIGN_STREAK_STOP_PREFIX = "Advisor: design review stopped"

/** kind → 人读说明（第 33 批 §17.4 逐字——结论表第三列；八类 = 五 kind + stale +
 *  no_credential + no_report，与 review-streak.mjs 分类输出同集）。 */
const DESIGN_REVIEW_OUTCOME_MEANINGS = {
  timeout: "review exceeded the wall-clock budget (agent.advisor.timeoutMs)",
  context_limit: "review exceeded the model context budget",
  turn_cap: "review exceeded the tool-round limit",
  empty: "the provider returned an empty response",
  review_failed: "provider / transport error",
  stale: "the reviewed documents changed while the review was in flight",
  no_credential: "the token could not be written to the session ledger",
  no_report: "the review settled without a report",
}

/**
 * 停止结论串（第 33 批 §17.4 逐字；F29）：稳定前缀 + 停止的 doc-set 清单 + 失败尝试表
 * （记录逐条——kind + 人读说明）+ 三选项（接受现状 / 改变或缩小范围后重跑 / /new 重置）。
 * 全文零凭证值；不自动执行任何恢复动作（发起权在父代理 / 用户）。
 * @param {{count: number, log: string[]}|null} record — 护栏记录（`designReviewStreakRecord`）
 * @param {string[]|null} documents — 被停的文档集（结论清单数据源）
 */
export function buildDesignReviewGuardMessage(record, documents) {
  const log = Array.isArray(record?.log) ? record.log : []
  const docList = Array.isArray(documents) ? documents.filter((d) => typeof d === "string" && d.trim()) : []
  return [
    `${ADVISOR_DESIGN_STREAK_STOP_PREFIX} — ${MAX_DESIGN_REVIEW_STREAK} consecutive attempts on this document set produced no design token (repeated failed settlements; no further reviews will start for this set in this session).`,
    "Document set (1 design instance — no token issued):",
    ...docList.map((d) => `- ${d}`),
    "Attempts (most recent last):",
    "| # | outcome | meaning |",
    "|---|---|---|",
    ...log.map((kind, i) => `| ${i + 1} | ${kind} | ${DESIGN_REVIEW_OUTCOME_MEANINGS[kind] ?? kind} |`),
    "Options:",
    "1. Accept the current state and proceed — implementation for this document set stays gated (no design token).",
    "2. Narrow or change the scope: a different document set starts a fresh budget — fix the cause first (agent.advisor.timeoutMs / advisor model / provider).",
    "3. Start a new session (/new) to reset the guard.",
  ].join("\n")
}

const MAX_UNFIXED_DISPLAY = 10 // unfixed issues shown in the cap message

/** Resolve the advisor's provider: cfg.provider/model when set, otherwise the main agent's provider */
export function resolveAdvisorProvider(agent) {
  const cfg = agent.config?.advisor
  if (cfg?.provider) {
    try {
      // F-1 (ISSUE-FIX-BATCH): children carry no agent.providers (spawn childConfig copies the
      // parent config) — fall back to config.providersList (.length: [] must not skip the list).
      const provider = findProvider(agent.providers?.length ? agent.providers : agent.config?.providersList ?? [agent.provider], cfg.provider)
      // F-2a (MODEL-400-FIX)：无 cfg.model 时渠道克隆须重派生 model——渠道裸克隆会丢 model 键
      // → 无 model 请求 → serde 400。
      // MODEL-SELECTION v2（M3④）：无 cfg.model → 命中渠道自己的默认模型（`provider.model`
      // 单值）；渠道无默认模型 → 父 provider 兜底（与 subagent F-2c 同构）——绝不产出静默
      // undefined-model 请求（最极端两者皆无 → chat 前 assertProviderModel fail-fast）。
      const result = cfg.model ? { ...provider, model: cfg.model } : { ...provider, model: provider.model ?? agent.provider?.model }
      if (cfg.thinking === null || cfg.thinking === false) result.thinking = undefined  // explicitly off
      else if (cfg.thinking !== undefined) result.thinking = cfg.thinking
      if (cfg.reasoningEffort !== undefined) result.reasoningEffort = cfg.reasoningEffort
      return result
    } catch (e) {
      // Provider not found or lookup failed — fall back to main provider, but surface the reason
      console.warn(`[advisor] resolveAdvisorProvider: ${e.message}`)
    }
  }
  const provider = { ...agent.provider }
  if (cfg?.model) provider.model = cfg.model
  // thinking off: null AND false both mean "explicitly off" — a raw `false`
  // value is invalid for providers that expect undefined or an object.
  if (cfg?.thinking === null || cfg?.thinking === false) provider.thinking = undefined
  else if (cfg?.thinking !== undefined) provider.thinking = cfg.thinking
  if (cfg?.reasoningEffort !== undefined) provider.reasoningEffort = cfg.reasoningEffort
  return provider
}

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
/** Review-looking guard (async settle parity): a markdown table row or ≥200 chars of prose counts as a prior. */
export function looksLikeReviewOutput(text) {
  const trimmed = String(text ?? "").trim()
  return /\|.*\|.*\|/.test(trimmed) || trimmed.length >= 200
}
/** Cap message (shared by runAdvisorReview and the async pre-check — per-review refusal). */
export function buildCapMessage(agent) {
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
 * 压缩定锚简报（F13/§14.4 #3）——**由评审参数构建**（非模型输出）：对象声明 / 文档清单 /
 * Approval Signal 三锚；重内容（项目指南 / 方法论 / 文档地图）不入 pin（压缩的意义所在）。
 * 形态逐字见设计 §14.4 #3（首行为机械化重挂说明）。
 */
function buildPinnedBrief(reviewType, documents, object, designToken, designId) {
  const docList = Array.isArray(documents) ? documents.filter((d) => typeof d === "string" && d.trim()) : []
  const parts = ["[review brief — re-attached after context compaction; the original review request is no longer in the context]"]
  const declaration = buildObjectDeclarationBlock(object)
  if (declaration) parts.push(declaration.trimEnd())
  if (docList.length > 0) {
    parts.push("## Documents to Review")
    parts.push(docList.map((d) => `- ${d} — Read this file in full`).join("\n"))
  }
  if (reviewType === "design" && designToken) parts.push(buildDesignApprovalBlock(designToken, designId))
  return parts.join("\n\n")
}

/**
 * Run an advisor review. reviewType: "code" (default) or "design". Returns review text or null when skipped.
 * @param {string|null} [designToken] — injected into the design-review prompt; the advisor echoes it only on approval.
 * @param {string[]|null} [documents] — design review only: explicit list of doc paths to review; passed through to the message builder.
 * @param {string[]|null} [paths] — code review only: explicit list of file/dir paths to review.
 * @param {Object|null} [object] — review-object declaration (§18.8 D-OA1/D-OA3): { type, target, status, reason, exclude }; absent → legacy behavior (no injection).
 * @param {string|null} [designId] — §29.1 F2a: injected next to the design token in
 *   the Approval Signal (passed through to the message builders).
 */
export async function runAdvisorReview(agent, reviewType, callbacks, designToken = null, documents = null, paths = null, object = null, designId = null) {
  const onOutput = callbacks?.onOutput
  const signal = callbacks?.signal
  const startTime = Date.now()

  // Advisor reviews are ALWAYS available (2026-08-21 semantic refactor): the
  // former advisor.enabled gate is removed — review capability has no off
  // switch; only the guard (completion pushback) is opt-in via advisor.guard.

  // Mechanical convergence cap — CODE REVIEWS ONLY (2026-09-07 §8 ruling: design
  // reviews are exempt). _advisorRound is scoped to the current review instance
  // (§11.2 D-24b ③), so >= MAX_ADVISOR_ROUNDS blocks the next call of THIS instance.
  // 5 rounds max; after that the review is never pushed back.
  if (reviewType !== "design" && (agent._advisorRound || 0) >= MAX_ADVISOR_ROUNDS) {
    return buildCapMessage(agent)
  }

  // 第 33 批（§17.5 检查点 2——内防线）：同一 doc-set 连续未产出可用结算达阈值 ⇒ 直接拒绝
  // （不建消息、不发起、零 LLM）——防直接调用方绕过工具层预检（正常工具链在预检已拒）。
  if (reviewType === "design" && Array.isArray(documents) && documents.length > 0) {
    const streakKey = docSetKey(documents, agent.cwd)
    if (designReviewStreakStopped(agent, streakKey)) {
      return buildDesignReviewGuardMessage(designReviewStreakRecord(agent, streakKey), documents)
    }
  }

  const provider = resolveAdvisorProvider(agent)
  // Advisor always works in the agent's cwd — scope is defined by paths/documents.
  const advisorCwd = agent.cwd

  const messages = prepareAdvisorMessages(agent, reviewType, designToken, documents, paths, null, object, designId)

  // B 启动断言（fail-closed——§14.4 #2）：设计评审请求内**必须**携带与本次签发 token 精确
  // 对应的 Approval Signal——构建面补不上就拒绝启动（不发"请回显一个不存在的 token"的请求）。
  // 拒绝报告前缀 `Advisor: design review launch refused` = 稳定契约（同步工具面据此登记
  // _advisorRefusals；异步结算面据此不置 _calledAdvisorThisRun）。工具路径恒签发 token ⇒
  // 该拒绝为直接调用方兜底（防御纵深——正常链不可达，如实注）。
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

  // §2.20.3 批次档写通道的绑定（仅设计评审）：同步路径 = 调用方（advisor 工具）传入的
  // callbacks.batchDoc（即 resolved.run 的实例绑定）；异步路径 = 本实例在跑池条目的
  // run.batchDoc（同文档集实例键——各评审各取各档，不用单值会话态）。
  const boundBatchDoc = reviewType === "design" ? batchDocForReview(agent, documents, callbacks) : null
  // F13/§14.4 #3：压缩定锚简报（评审参数构建——压缩触发时由 compaction 重挂）。
  const pinned = buildPinnedBrief(reviewType, documents, object, designToken, designId)

  try {
    const result = await runAdvisorToolLoop(provider, messages, onOutput, signal, agent, advisorCwd, null, reviewType, boundBatchDoc, pinned)

    // Host-verified citations (decision d698434): mechanically check every
    // `file:line: content` reference in the review against the CURRENT file
    // state. LLMs cannot self-enforce the evidence rule — the model may quote
    // the prior table instead of re-reading (three consecutive false reports
    // cited pre-fix line content). Unverified citations must not support a
    // push-back; the parent agent sees the verification report.
    // F14/§14.5：解析候选 = cwd + 评审对象声明范围派生根（scope = documents + paths）。
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
      const looksLikeReview = looksLikeReviewOutput(final)
      if (looksLikeReview) {
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
