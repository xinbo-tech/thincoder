/**
 * design-token.mjs — design-token utilities（2026-09-08 自 advisor-async.mjs 提取——
 * advisor-async 随 DESIGN-TOKEN-SETTLEMENT D1 落盘块再越 500 行硬限；本工具组 verbatim
 * 迁入，零语义变）。
 *
 * 沿革：初由 agent-tools/advisor.mjs 迁至 advisor-async.mjs（sync wrapper 与 async
 * settle 共享一套实现——无 wrapper↔runner 环），再由 advisor-async.mjs 迁入本文件。
 * 既有 import 面不变：advisor-async.mjs re-export 原 7 个导出（advisor.mjs 与测试
 * 的 import 路径原样保留——advisor.mjs 再转发 validateDesignToken 给 spawn 门禁）；
 * 本批 §5.1 新助手（stripDesignTokenEcho / makeDesignTokenPrefixRegex）为新增直连面
 * （设计档 ENG-TOKEN-BINDING.md §5.1——不经 advisor-async re-export）。
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

/** Build a [DESIGN-TOKEN:...] regex matching the token's uuid PREFIX form — the
 *  truncated echo (tail missing/inexact, §5.1③; same boundary discipline as the full regex). */
export function makeDesignTokenPrefixRegex(token, flags = "") {
  const uuid = String(token).split(":")[0]
  const escaped = uuid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(
    `(?:^|\\s|\`|\\*)\\[DESIGN-TOKEN:\\s*${escaped}[^\\]\\s]*\\s*\\](?:\\s|$|\`|\\*)`,
    flags + "ms"
  )
}

/** §5.1③ stripping single source: strip every echo form of THIS token — the full
 *  [DESIGN-TOKEN:uuid:expiresAt] form, the truncated prefix form, and the bare
 *  uuid value (token-unique random ⇒ zero collateral; empty uuid → bare pass
 *  skipped — defensive). Other tokens / other uuids pass through untouched. */
export function stripDesignTokenEcho(text, designToken) {
  if (typeof text !== "string" || !designToken) return text
  const uuid = String(designToken).split(":")[0]
  let out = text.replace(makeDesignTokenRegex(designToken, "g"), "")
  out = out.replace(makeDesignTokenPrefixRegex(designToken, "g"), "")
  if (uuid) out = out.split(uuid).join("")
  return out
}

/** §5.1② constant settlement markers (verbatim — machine-greppable; M1 is
 *  emitted even when the review body is empty). */
const NO_VALID_ECHO_MARK = "未回显有效 token——未签发 (no valid token echo — no design token was issued)"
const TRUNCATED_ECHO_MARK = "注：回显被截断（uuid 之后缺失或不符）——已按批准结算；全串 token 已签发 (note: truncated echo — the part after the uuid was missing or inexact; settled as approved; the full token was issued)"

/**
 * Shared design-review settlement (sync wrapper + async settle): the token echo
 * IS the verdict — the advisor echoes it only on approval. On echo (full string
 * OR truncated — uuid present; §5.1①): slot the token under designId (always the
 * FULL token; + eng-coder gate flag; single-value mirror retired per
 * DESIGN-TOKEN-SETTLEMENT D3) and return the clean output with the Approved
 * suffix (truncated echo: the M2 marker sits before the suffix); the review
 * instance CLOSES (a later review of the same doc-set starts a fresh full
 * review). On non-echo: strip every echo form (single source §5.1③) and return
 * the findings text + the constant M1 marker — slots stay untouched
 * (方案 ②: a failed re-review revokes nothing).
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
    const stripped = stripDesignTokenEcho(rawResult, designToken).trim()
    return {
      passed: false,
      output: `${stripped}\n\n评审未完成——token 未签发 (review incomplete — no design token issued; reason: ${incomplete})\n以更小范围重跑设计评审（逐档 / 逐节拆分，或拆到两次评审），或调大 agent.advisor.timeoutMs 后重试；补充检查未完成的部分不得按已核处理。`.trim(),
    }
  }
  // §5.1① 截断容忍：全串匹配 ∨ 截断形（本 token 的 uuid 值出现——空 uuid 不构成「值」）
  // ⇒ 认 pass；两者皆无 ⇒ fail + 恒定 M1（含正文为空——N7 零静默）。
  const uuid = String(designToken).split(":")[0]
  const fullEcho = makeDesignTokenRegex(designToken).test(rawResult)
  const truncatedEcho = !fullEcho && uuid.length > 0 && rawResult.includes(uuid)
  if (!fullEcho && !truncatedEcho) {
    const stripped = stripDesignTokenEcho(rawResult, designToken).trim()
    return { passed: false, output: [stripped, NO_VALID_ECHO_MARK].filter(Boolean).join("\n\n") }
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
  run.priorOutput = null // #863 关闭点轻量化：审批关同拍释放（closed 实例零消费面——续跑仅取 open）
  const clean = stripDesignTokenEcho(rawResult, designToken).trim()
  // F2c: id echo + omission guidance + point-in-time slot snapshot — the
  // same suffix the F2e prior stores strip with (stored for the exact truncation).
  run.approvedSuffix = buildApprovedSuffix(designToken, run.designId, agent._engDesignTokens.size)
  return {
    passed: true,
    // §5.1② 标记位置不变式：M2 恒居 approvedSuffix 之前、suffix 恒居文末
    // （stripApprovedSuffix 的精确截断依赖此形——尾部追加改动不得破坏）。
    output: [clean, truncatedEcho ? TRUNCATED_ECHO_MARK : null, run.approvedSuffix].filter(Boolean).join("\n\n"),
  }
}
