/**
 * advisor/notice.mjs — advisor 拒回 / 失败结论文案 + 对象标识行（单源；2026-09-18 顾问面治理批）。
 *
 * 三族文案共用本档（设计权威 = `docs/core/design/ADVISOR-GUARDS.md` §2.4 / §2.5 / §7）：
 *  1. **类型门拒回**（F30——顶层 `type` 缺 / 非法 / 与 `object` 声明冲突 ⇒ 拒发）；
 *  2. **范围拒回标识行**（F31——三处范围拒绝的既有稳定前缀逐字 + 标识块尾随）；
 *  3. **失败结算结论块**（F28/F29——code / design 两轨共用；判据名纯函数 + 人读说明表）。
 * 本档为叶子模块（零仓内导入——纯函数、零状态、零 LLM 输出解析 = N20）；文案逐字 = 设计档，
 * 改动须同轮同步该档（D2 单一权威源）。
 */

/** 对象标识行（F31 单源）：`[type=… · scope=… · round=… · criterion=…]`。 */
export function identityLine({ type, scope, round, criterion }) {
  return `[type=${type} · scope=${scope} · round=${round} · criterion=${criterion}]`
}

/** 范围摘要（首路径 + `+N more`；无范围 ⇒ `none`）。 */
export function scopeSummary(list) {
  const items = (Array.isArray(list) ? list : []).filter((p) => typeof p === "string" && p.trim())
  if (items.length === 0) return "none"
  return items.length === 1 ? items[0] : `${items[0]} +${items.length - 1} more`
}

/** 拒回族统一形态（F31）：既有稳定前缀逐字（行首）+ 标识块尾随——两句同时满足。 */
export function withIdentityLine(text, fields) {
  return `${text} ${identityLine(fields)}`
}

// ─── ① 类型门（F30——ADVISOR-GUARDS.md §2.4）───────────────────────────────────

const isLegalTrack = (v) => v === "code" || v === "design"

/** 实收值原样回显（非字符串经 JSON 化——不推断、不近似）。 */
function receivedText(rawType) {
  if (typeof rawType === "string") return rawType
  try {
    return JSON.stringify(rawType) ?? String(rawType)
  } catch {
    return String(rawType)
  }
}

/**
 * 类型门判据名（纯函数——判定枚举闭合三值；`null` = 放行）。
 * `type-missing` = 缺失 / `null` / 空串 / 纯空白串；`type-invalid` = 非空非法值 / 非字符串；
 * `type-object-conflict` = 顶层显式合法值 ∧ `object.type` 声明为**另一**合法值（窄读法：非法
 * 声明值不构成轨矛盾——`object` 只描述评审对象、不选轨）。
 */
export function typeGateCriterion(rawType, declaredType) {
  if (rawType === undefined || rawType === null || (typeof rawType === "string" && rawType.trim() === "")) {
    return "type-missing"
  }
  if (!isLegalTrack(rawType)) return "type-invalid"
  return isLegalTrack(declaredType) && declaredType !== rawType ? "type-object-conflict" : null
}

/** 类型门拒发串（逐字——§2.4：前缀行 + `Why` 三形态 + 对象声明追加行 + 两个合法值行）。 */
export function buildTypeGateRefusal({ criterion, received = null, declared = null, scope = "none" }) {
  const line = identityLine({
    // 冲突拒回记顶层实收值（未定轨）；未定轨两分支记 absent / invalid。
    type: criterion === "type-object-conflict" ? String(received) : (criterion === "type-missing" ? "absent" : "invalid"),
    scope,
    round: "—", // 判定先于实例解析——本次发起无轮次（§2.5 字段行）
    criterion,
  })
  const why = criterion === "type-missing"
    ? "Why: the call carried no type at the top level — an omitted type must not silently fall back to the code track (that is how a design review becomes a code review without anyone noticing)."
    : criterion === "type-invalid"
      ? `Why: "${receivedText(received)}" is not one of the two legal values — there is no closest-match guessing and no silent fallback.`
      : `Why: the top-level type="${received}" disagrees with the object declaration object.type="${declared}" — align them: set the top-level type to "${declared}", or change the object.type declaration to "${received}".`
  const parts = [
    `Advisor: launch refused — the tool call must carry an explicit type at the top level, one of the two legal values below. ${line}`,
    why,
  ]
  // 对象声明追加行（归位——附于未定轨两分支，仅当 object.type === "design" 声明在位）。
  if (declared === "design" && criterion !== "type-object-conflict") {
    parts.push('The object declaration says type="design"; the declaration describes the review target, it does not select the review track.')
  }
  parts.push(
    '  • type="code"   — code review: reviews the code you changed; pass paths=[...] to scope files/directories (documents=[...] adds acceptance-criteria context).',
    '  • type="design" — design review: reviews design / requirement documents; pass documents=[...] (the explicit list) — plus batchDoc when a batch record is in flight.',
    "Nothing was sent: no review instance, no round consumed, no design token minted, no LLM call.",
  )
  return parts.join("\n")
}

// ─── ② 失败结算（F28 / F29——ADVISOR-GUARDS.md §7）─────────────────────────────

/**
 * 失败结算判据名（纯函数单源、零状态——§7 契约一优先级，自上而下首个命中）。
 * @returns {string|null} 判据名；`null` = 可用判决 / 无尝试发生（不产结论块）。
 */
export function settlementCriterion(input) {
  const { launchRefused = false, stale = false, hasResult = true, incomplete = null, persistFailed = false } = input ?? {}
  if (launchRefused) return null // 1. 未发起请求（无尝试发生）
  if (stale) return "stale" // 2. 陈旧结算（未产出可用凭证）
  if (!hasResult) return "no_report" // 3. 无报告（fail-closed）
  if (incomplete && incomplete !== "interrupted") return String(incomplete) // 4. 宿主截断尾五 kind
  if (incomplete === "interrupted") return null // 5. 用户 / 系统中断——被丢弃的尝试
  if (persistFailed) return "no_credential" // 6. pass 但槽落盘失败（设计专属面）
  return null // 7. 可用判决（pass 且落盘成功 / changes-required）
}

/** 判据名 → 人读说明（逐字——§7 表第三列；`no_credential` 设计专属、`stale` 两轨）。 */
const CRITERION_MEANINGS = {
  timeout: "review exceeded the wall-clock budget (agent.advisor.timeoutMs)",
  context_limit: "review exceeded the model context budget",
  turn_cap: "review exceeded the tool-round limit",
  empty: "the provider returned an empty response",
  review_failed: "provider / transport error",
  stale: "the reviewed target changed while the review was in flight",
  no_credential: "the token could not be written to the session ledger",
  no_report: "the review settled without a report",
}

export function criterionMeaning(name) {
  return CRITERION_MEANINGS[name] ?? String(name ?? "")
}

/**
 * 失败结论块（逐字——§7 契约二；**两轨共用**）：块首行 = 对象标识行，既有结算正文逐字下沉为
 * 块体，尝试表 = **本次尝试单行**（`#` = 实例尝试序号；零跨次载体），选项三值不自动执行。
 * @param {{type: string, scope: string, round: number, criterion: string, body: string|null}} p
 */
export function buildSettlementConclusion({ type, scope, round, criterion, body }) {
  const lines = [
    `Advisor: review failure — 本轮未产出可用结论 (no usable settlement) ${identityLine({
      type, scope, round: `${round}/uncapped`, criterion,
    })}`,
  ]
  const text = String(body ?? "").trim()
  if (text) lines.push(text)
  lines.push(
    "Failed attempts in this review instance (most recent last):",
    "| # | outcome | meaning |",
    "|---|---|---|",
    `| ${round} | ${criterion} | ${criterionMeaning(criterion)} |`,
    "Options: 1. proceed as-is (no usable conclusion — design: no token, implementation stays gated; code: the code face stays unapproved) · 2. narrow or change the scope and re-run · 3. stop and report to the user",
  )
  return lines.join("\n")
}
