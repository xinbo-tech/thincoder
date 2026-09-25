/**
 * design-token.mjs — design-token utilities（2026-09-08 自 advisor-async.mjs 提取——
 * advisor-async 随 DESIGN-TOKEN-SETTLEMENT D1 落盘块再越 500 行硬限；本工具组 verbatim
 * 迁入，零语义变）。
 *
 * 沿革：初由 agent-tools/advisor.mjs 迁至 advisor-async.mjs（sync wrapper 与 async
 * settle 共享一套实现——无 wrapper↔runner 环），再由 advisor-async.mjs 迁入本文件。
 * 既有 import 面不变：advisor-async.mjs re-export 全部 7 个导出（advisor.mjs 与测试
 * 的 import 路径原样保留——advisor.mjs 再转发 validateDesignToken 给 spawn 门禁）。
 */

import { randomUUID } from "node:crypto"
import { tokenExpiryMs } from "../token-ttl.mjs"

/**
 * F2c/F2e (§29.1 2026-09-07): the engine-generated Approved suffix — ONE builder
 * shared by the sync settle and the async settle (and the prior stores, which
 * strip it with stripApprovedSuffix — exact-suffix truncation, never a regex
 * guess, zero collateral). The slot count is a point-in-time snapshot taken at
 * settle time — the situation at spawn time may differ (F2d backs that up).
 */
export function buildApprovedSuffix(designToken, designId, slotCount) {
  return `Approved. Pass this exact token to eng-coder (designToken parameter): ${designToken}\ndesignId: ${designId} (pass as the designId parameter when spawning eng-coder — optional while this session holds a single design; ${slotCount} approved design slot(s) held as of this approval, and the count may have changed since — with several designs the spawn gate refuses a missing designId and lists the held ids)`
}

/** F2e: strip the engine-generated Approved suffix from a report before
 *  it becomes a prior — the suffix is deterministic (buildApprovedSuffix), so the
 *  truncation is exact; a text not ending in it passes through untouched. */
export function stripApprovedSuffix(text, suffix) {
  if (typeof text !== "string" || !suffix) return text
  return text.endsWith(suffix) ? text.slice(0, text.length - suffix.length).trim() : text
}

const TOKEN_TTL_DEFAULT_MS = 7 * 24 * 3600 * 1000 // 7-day ceiling (v2 2026-08-25)

/** Effective token TTL: config override with runtime validation (timeoutMs precedent). */
export function effectiveTokenTtlMs(agent) {
  const cfg = agent?.config?.agent?.engTokenTtlMs
  return (Number.isFinite(cfg) && cfg > 0) ? cfg : TOKEN_TTL_DEFAULT_MS
}

/** Mint an unsigned design token with expiration (2026-09-06: HMAC layer removed —
 *  the token is a FLOW credential: uuid:expiresAt, exact slot match + TTL only). */
export function generateDesignToken(agent) {
  const uuid = randomUUID()
  const expiresAt = Math.floor(Date.now() + effectiveTokenTtlMs(agent))
  return `${uuid}:${expiresAt}`
}

/** Validate a design token: format + expiration — ALL fail-closed (v2 2026-08-25).
 *  R16: format/expiry semantics live in token-ttl.mjs (tokenExpiryMs — single source
 *  shared with restore filtering / enter cleanup / spawn-gate slot deletion — D-R16b). */
export function validateDesignToken(token) {
  const expiry = tokenExpiryMs(token)
  return expiry !== null && expiry >= Date.now()
}

/** Build a [DESIGN-TOKEN:...] regex matching the FULL token (uuid:expiresAt). */
export function makeDesignTokenRegex(token, flags = "") {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(
    `(?:^|\\s|\`|\\*)\\[DESIGN-TOKEN:\\s*${escaped}\\s*\\](?:\\s|$|\`|\\*)`,
    flags + "ms"
  )
}

/**
 * Shared design-review settlement (sync wrapper + async settle): the token echo
 * IS the verdict — the advisor echoes it only on approval. On echo: slot the
 * token under designId (+ eng-coder gate flag; single-value mirror retired per
 * DESIGN-TOKEN-SETTLEMENT D3) and return
 * the clean output with the Approved suffix; the review instance CLOSES (a
 * later review of the same doc-set starts a fresh full review). On non-echo:
 * strip every dead token occurrence and return the findings text — slots stay
 * untouched (方案 ②: a failed re-review revokes nothing).
 * @param {Object} [opts] — 第 11 批（A/F11）：`opts.incomplete` = 宿主尾族判定 kind
 *   （单谓词 `advisorIncompleteMarker`——结算方透传）。非空 ⇒ **一律不签发**（无论评审文本
 *   是否回显 token）：剥除全部 token 回显 + 追加未签发提示（原因 + 恢复指引），不写槽、
 *   不关实例（可重评）。
 * @returns {{passed: boolean, output: string}}
 */
export function settleDesignReview(agent, run, designToken, rawResult, opts = {}) {
  if (!designToken || typeof rawResult !== "string") {
    return { passed: false, output: rawResult ?? "" }
  }
  // A（F11/ADVISOR-GUARDS.md §1 消费点 1）：未完成即不签发——判据与 code 完成守卫同源（单谓词）。
  const incomplete = opts?.incomplete ?? null
  if (incomplete) {
    const stripped = rawResult.replace(makeDesignTokenRegex(designToken, "g"), "").trim()
    return {
      passed: false,
      output: `${stripped}\n\n评审未完成——token 未签发 (review incomplete — no design token issued; reason: ${incomplete})\n以更小范围重跑设计评审（逐档 / 逐节拆分，或拆到两次评审），或调大 agent.advisor.timeoutMs 后重试；补充检查未完成的部分不得按已核处理。`.trim(),
    }
  }
  const tokenPattern = makeDesignTokenRegex(designToken)
  if (!tokenPattern.test(rawResult)) {
    const stripped = rawResult.replace(makeDesignTokenRegex(designToken, "g"), "").trim()
    return { passed: false, output: stripped || "Advisor: design review did not pass." }
  }
  // Echoed the token → review passed. Issue it to the parent for eng-coder.
  agent._engDesignTokens ??= new Map()
  agent._engDesignTokens.set(run.designId, designToken)
  // DESIGN-TOKEN-SETTLEMENT D3（2026-09-08）：单值镜像 `_engDesignToken` 退役——
  // 只写多槽 Map（AC3 零镜像写）；settle 落盘由调用方（settleAdvisorRun）当场做。
  // Unlock the dispatch design gate for eng-coder SELF-review (defense-in-depth —
  // see the sync wrapper's note: unreachable today, kept for parity).
  if (agent._role === "eng-coder") agent._engDesignReviewed = true
  run.open = false // approval closes this doc-set instance — next review is fresh
  const clean = rawResult.replace(makeDesignTokenRegex(designToken, "g"), "").trim()
  // F2c: id echo + omission guidance + point-in-time slot snapshot — the
  // same suffix the F2e prior stores strip with (stored for the exact truncation).
  run.approvedSuffix = buildApprovedSuffix(designToken, run.designId, agent._engDesignTokens.size)
  return {
    passed: true,
    output: `${clean}\n\n${run.approvedSuffix}`,
  }
}
