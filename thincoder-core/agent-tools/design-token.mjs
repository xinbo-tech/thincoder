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
import { readFileSync } from "node:fs"
import { tokenExpiryMs } from "../token-ttl.mjs"
// 段面读判据单源（骨架档）：轮次块计数 ∥ 段级状态行 ∥ §3 完成词——§3 落地门与写入面读同一形态。
// 裁定行锚（`_V_PRE` / `_V_SUF` / `VERDICT_CHANGES_LINE`）同住骨架档锚块，组合序也只在那一档（`verdictGapOf`）：
// 本档的裁定闸判据、写入面（`append §3` 的打回重置 `statusResetPlan`）与 `§5` 写入门读同一个函数——
// 锚与序都只此一份，三处不各写一遍。
import { countRoundBlocks, readSectionStatusWord, STATUS_WORDS, VERDICT_PASS_LINE, verdictGapOf } from "./batch-skeleton.mjs"
// 批归属派生（DESIGN-TOKEN-SETTLEMENT §10）——两源定序 `batchAbsPathOfRun`：`run.batchDoc` 优先、
// `docSetKey` 的批档兜底（判据与清点面同源）。
// 本档 ⇄ `design-slots.mjs` 为**静态环**（对方取 `effectiveTokenTtlMs`）：两侧绑定只在函数体内
// 运行时使用，求值期零顶层调用 ⇒ 环安全（与 token-ttl ⇄ session 同构）。
import { batchAbsPathOfRun } from "./design-slots.mjs"

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

/** §5.2 verdict gate (#940): the echo alone is NOT the verdict — the receipt must
 *  carry a `VERDICT: pass` line and no `VERDICT: changes-required` line (fail-closed). */
// 裁定行接受本地化等价形（GitHub #32 / #14）：评审席用中文回执很常见，
// 只认英文会让 pass 落成 no-pass-line、凭证永不签发；判据仍只认整行逐字面，
// 不做「句中含『通过』」这类模糊匹配——那样会把「未通过」也放过。
// 四条锚与两条裁定正则全住骨架档锚块（`batch-skeleton.mjs`），裁定读数单源 = 同档 `verdictGapOf`：
// 本档、`§5` 写入门与 `append §3` 的通过置位读同一个函数（判定单源，零复制）。
// pass 锚经本档**原样再导出**——`batch-closeout.mjs` 的 import 面零改。
export { VERDICT_PASS_LINE }
/** 裁定闸的拒因（§5.2 #940）：对外只两个词，`changes-required` ∥ `no-pass-line`——本批改的是判据来源，
 *  不是这两个词。四格映射（`verdictGapOf` 值域 → 拒因）：
 *  - `null`（说了 pass）⇒ `null`（签发）；
 *  - `「VERDICT: changes-required」` ∥ `「两者同携」` ⇒ `changes-required`——同携今天就走这一格
 *    （改前打回锚先命中即判打回），组合序挪进函数后这张表照旧；
 *  - `「无裁定行」` ⇒ `no-pass-line`。 */
export function verdictGateFailure(rawResult) {
  if (typeof rawResult !== "string") return "no-pass-line"
  const gap = verdictGapOf(rawResult)
  if (gap === null) return null
  return gap === "无裁定行" ? "no-pass-line" : "changes-required"
}

/** §5.2 rejection mark (verbatim — machine-greppable; reason = no-pass-line | changes-required). */
const VERDICT_GATE_MARK = (reason) => `裁定非通过——token 未签发 (review verdict is not pass — no design token was issued; reason: ${reason}; the echoed token was stripped)`

/** §3 落地门拒因（ADVISOR-GUARDS.md §1.1——三值：判据 1 无条件的两个拒形落裁定闸之前 ⇒
 *  changes-required 轮也会拿到；判据 2 的拒形只在签发路径上）。 */
const RECORD_NO_BLOCK = "no-section3-block"
const RECORD_STATUS_NOT_PASSED = "status-not-passed"
const RECORD_BATCH_UNREADABLE = "batch-unreadable"

/** §3 落地门 rejection mark (verbatim — machine-greppable; reason = 上三值之一)。与裁定闸同形：
 * 槽零写、实例不翻 open——标记即回执，不进 `settlementCriterion`（§7 不新增判据值）。
 * **恒定位 = 上方两行逐字不动**；`evidence`（可执行证据 = 当前状态行 ∥ 轮次块数 ∥ 写面通道）
 * 另起一行落在其后——指名当前值，但不把证据塞进那个机器可 grep 的括号里。 */
const REVIEW_RECORD_MARK = (reason, evidence) => `评审记录不合格——token 未签发 (review record incomplete — no design token was issued; reason: ${reason})\n补写该批档 §3（发现 + VERDICT —— 状态行由工具随块落）后重跑设计评审；未补写不得按已核处理。${evidence ? `\n证据：${evidence}` : ""}`

/**
 * Shared design-review settlement (sync wrapper + async settle): the token echo
 * IS the verdict — the advisor echoes it only on approval. On echo (full string
 * OR truncated — uuid present; §5.1①): slot the token under designId (always the
 * FULL token; + eng-coder gate flag; single-value mirror retired per
 * DESIGN-TOKEN-SETTLEMENT D3), record its batch attribution (`_engDesignTokenBatches`
 * — `batchAbsPathOfRun(run)`: the instance's bound `batchDoc`, else the reviewed doc-set's
 * `batches/` file, §10; neither ⇒ no attribution) and return the clean output with the
 * Approved suffix (truncated echo: the M2 marker sits before the suffix); the review
 * instance CLOSES (a later review of the same doc-set starts a fresh full
 * review). On non-echo: strip every echo form (single source §5.1③) and return
 * the findings text + the constant M1 marker — slots stay untouched
 * (方案 ②: a failed re-review revokes nothing).
 * @param {Object} [opts] — 第 11 批（A/F11）：`opts.incomplete` = 宿主尾族判定 kind
 *   （单谓词 `advisorIncompleteMarker`——结算方透传）。非空 ⇒ **一律不签发**（无论评审文本
 *   是否回显 token）：剥除全部 token 回显 + 追加未签发提示（原因 + 恢复指引），不写槽、
 *   不关实例（可重评）。
 * @remarks §3 落地门（ADVISOR-GUARDS.md §1.1——同族：未完成即不签发）：**前置 = 绑了批档**（`run.batchDoc`
 *   非空）——设计评审必携 `batchDoc`（准入门，判据 = 同档 §2 第 6 条）⇒ 到结算面仍为空只是接线故障，
 *   在 `boundBatch` 判定处断言并 throw（程序不变量，早于写槽；不设对外拒因值，不返回判决）；已过回显闸 ⇒ 两次判：① 轮次块数 > 点火基线
 *   `run.section3BlocksAtStart`（**无条件**——changes-required 轮同判；嵌在裁定闸之前）② 段级状态行 = `评审通过`
 *   （只在签发路径上判）。不满足 ⇒ `{passed:false}` + 恒定标记，槽零写、实例不翻 open（补写后同实例可重评）。
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
  // §3 落地门判据 1（**无条件**——pass 与 changes-required 都判）—— 嵌在回显闸之后、裁定闸之前。
  // 设计单源 = `docs/core/design/ADVISOR-GUARDS.md` §1.1；**一次读档、两次判**（判据 2 复用同一 src）。
  // 未回显 ⇒ 已走上面的 M1，记录面零判（连凭据都没有，报「记录不合格」会把真因盖掉）。
  //
  // 前置 = 绑了批档，**程序不变量、不是拒发分支**：设计评审必携 `batchDoc`（准入门，判据 = 同档 §2 第 6 条）
  // ⇒ 到结算面仍为空只能是「绑定没传到实例」的接线故障 ⇒ 断言并 throw（串点名设计评审实例 + designId），
  // 零槽写、不返回判决、不设对外拒因值。给没发生过的情形配文案就是没有场景的分支；接线 bug 该炸得响，
  // 不该伪装成一条给用户看的拒因（本批 🔴1 裁定）。
  // 位置 = 写槽（`agent._engDesignTokens.set(...)`）之前：落在其后 = 没拦，token 已在槽里、授权照发。
  // 调用点不得补 catch 后继续——控制流会落回 `set(...)` ⇒ token 照签、零报错、只留一条日志（同档 §1.1）。
  const boundBatch = typeof run?.batchDoc === "string" && run.batchDoc.trim() ? run.batchDoc : null
  if (!boundBatch) {
    throw new Error(`design review settled with no batch-record binding (designId: ${run?.designId ?? "(none)"}) — a design review is launched with \`batchDoc\` required, so settling without it is a wiring fault, not an input to report.`)
  }
  let batchSrc = null
  let reason = null
  let detail = ""
  try {
    batchSrc = readFileSync(boundBatch, "utf8")
  } catch (e) {
    reason = RECORD_BATCH_UNREADABLE
    detail = `批档读不到: ${e?.code ?? e?.message ?? "unknown"}`
  }
  if (reason === null && !Number.isInteger(run.section3BlocksAtStart)) {
    // 点火基线 = 评审实例绑定批档时读该档记下的块数（`advisor.mjs`）；null / 缺失 = 点火时读不到。
    // 判据方向 =「绑了批档却验不了记录」不得当「没有记录要验」。
    reason = RECORD_BATCH_UNREADABLE
    detail = "点火基线缺失（批档在点火时不可读）"
  }
  if (reason === null) {
    const blocks = countRoundBlocks(batchSrc, 3)
    if (blocks <= run.section3BlocksAtStart) {
      reason = RECORD_NO_BLOCK
      detail = `§3 轮次块 ${blocks} 块、点火基线 ${run.section3BlocksAtStart} 块——本轮未写进 §3`
    }
  }
  if (reason !== null) {
    // 槽零写、`run.open` 不翻 ⇒ 补写 §3 后同一实例可重评（与裁定闸同形）。
    const stripped = stripDesignTokenEcho(rawResult, designToken).trim()
    return { passed: false, output: [stripped, REVIEW_RECORD_MARK(reason, detail)].filter(Boolean).join("\n\n") }
  }
  // §5.2 裁定闸（#940）：签发 = 回显 ∧ 裁定行——缺 `VERDICT: pass` 行或含 `VERDICT: changes-required` 行
  // ⇒ 拒签（与 M1 径同形：剥净回显 + 恒定标记；槽零写 ∥ 实例保持——修后重评）。
  const gateFailure = verdictGateFailure(rawResult)
  if (gateFailure !== null) {
    const stripped = stripDesignTokenEcho(rawResult, designToken).trim()
    return { passed: false, output: [stripped, VERDICT_GATE_MARK(gateFailure)].filter(Boolean).join("\n\n") }
  }
  // 判据 2（**只在签发路径上判**）——裁定行已判 pass、批档已读到（读不到已在上述判据 1 退场）。
  // 段级 = 唯一状态行写面（`batch-skeleton.mjs` `updateSectionStatusLine`）的同一处——写它的是工具：
  // `append §3` 那一笔随裁定行置位 ∥ 重置（`statusPassPlan` ∥ `statusResetPlan`），`status` 是同面上的
  // 可选手写口——也是下游 `§5` 写入门读的那一处；轮次块只由工具戳标题、块内无状态行落点 ⇒
  // 读块内状态行是读一行没人写的字。旧字面 `评审完成` 由 `readSectionStatusWord` 读侧等义。
  const word = readSectionStatusWord(batchSrc, 3)
  if (word !== STATUS_WORDS[3].done) {
    const stripped = stripDesignTokenEcho(rawResult, designToken).trim()
    const detail = `§3 状态行 = ${word ?? "（缺）"}；须 = ${STATUS_WORDS[3].done}（块落盘时由工具置位）`
    return { passed: false, output: [stripped, REVIEW_RECORD_MARK(RECORD_STATUS_NOT_PASSED, detail)].filter(Boolean).join("\n\n") }
  }
  // Echoed the token → review passed. Issue it to the parent for eng-coder.
  agent._engDesignTokens ??= new Map()
  agent._engDesignTokens.set(run.designId, designToken)
  // §10 E1（DESIGN-TOKEN-SETTLEMENT）：批归属旁列同拍写——派生 = `batchAbsPathOfRun(run)`（两源定序：
  // `run.batchDoc` 优先、文档集里的批档兜底；零新输入）。派生为无 ⇒ 归属 = 无（不猜）：**删**该 designId
  // 的旧行——否则一次改了范围的复评会让新槽继承上一轮的归属，收口时消费掉本不该消费的授权。
  const batchAbs = batchAbsPathOfRun(run)
  if (batchAbs) {
    agent._engDesignTokenBatches ??= new Map()
    agent._engDesignTokenBatches.set(run.designId, batchAbs)
  } else if (agent._engDesignTokenBatches instanceof Map) {
    agent._engDesignTokenBatches.delete(run.designId)
  }
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
