/**
 * agent-tools/batch-closeout.mjs — 收口面的四道判据与回执（从 `batch-lifecycle.mjs` 拆出，2026-10-27）。
 *
 * 权威规格 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6（四道门）∥ §2.11（收口前显式处置）；
 * 链门的原文契约 = `docs/core/design/BATCH-RECORD.md` §4.18-A。
 *
 * 本档承载三件（都不碰 fs 写、只读与判）：
 * ① `assertCloseoutGates` —— 收口两路（`close` ∥ `status` 写 `§1 已收口`）共调的判序：
 *    链完整性门（§2/§3/§4/§6 各有内容 ∥ §1 声明不适用——既有四条零改）→ **`§3` 状态词臂**（= `评审通过`，
 *    或 `§1` 声明 §3 不适用）→ 本批批内单测档门（`TESTING.md` §3.5）→ 文档机检门（`DOC-DISCIPLINE.md` §3.20）。
 * ② `assertSectionFiveGate` —— §5 写入门（段序门）：`§3` = `评审通过` ∥ `§1` 声明 §3 不适用。
 * ③ `reanchorReceiptLine` —— 收口重锚回执三行（§2.11 逐字）。
 *
 * 为什么 §3 内容臂留着（不换成只判状态词）：内容臂守的是「段里真跑过」，状态词臂守的是「跑的结论是
 * pass」——换掉内容臂 = 门被放宽（一段空着但状态词对就过），那正是本批要堵的洞。所以是**加**一条臂。
 *
 * 依赖单向（KD-4）：`skeleton ← closeout ← bind ← reopen ← lifecycle`——本档不 import lifecycle。
 */
import { readFileSync } from "node:fs"

import {
  inapplicableDeclarationError, malformedInapplicableLine, readSectionStatusWord, sectionContentState,
  sectionInapplicable, STATUS_WORDS,
} from "./batch-skeleton.mjs"
import { assertUnitTestFilesCleared } from "./batch-unit-test-gate.mjs"
import { gateRefusalMessage, runBatchGate } from "./batch-gate.mjs"

/** 链判段集（§2/§3/§4/§6——§5 段号豁免恒不判；§1 主 agent 自述段不设前置）。 */
const CHAIN_SEGMENTS = [2, 3, 4, 6]

/** §6 空闸拒句（#422①——空 ⇒ 拒 + 提示先写 §6；防「append 被拒 ⇒ close 照常 ⇒ §6 永久为空」复发）。
 *  **§6 为唯一缺段时**拒串取本函数（§4.18-A J2——「非空门」文案逐字零回归）；判据本体 = 单源谓词
 *  `sectionContentState(src, 6)`。 */
function emptySectionSixError() {
  return "batch: §6 收口段为空（non-empty gate）— close refuses: the closeout section (§6) has no content, and closing would freeze the record with that section permanently empty. Write the section first (append §6: the closeout / verification summary), then call close again. Nothing was written."
}

/** 链门拒绝句（§4.18-A J1——缺段非仅 §6 时；逐字文本 = `TOOLS.md` §6.24 J1。`missing` = 点名串，
 *  形如 `§2 / §3 / §4`——按段号升序列出）。 */
function closeoutChainError(missing) {
  return "batch: 收口链未跑完（closeout chain gate）— close refuses: the record's closeout chain has not run, and closing would freeze it that way. " +
    `Missing: ${missing}. Each named section must carry content (append it) or be declared inapplicable in §1 as ` +
    "`> 不适用：§N —— <reason>` (§2 / §3 / §4 only). §6 must carry its verification (never declarable) and §5 is exempt (a light-channel round has no implementation section). " +
    "Nothing was written."
}

/** `§3` 状态词臂拒句（设计档 §2.6 `R-G1` 逐字形）：链门已过、只剩评审结论没到时出这一条。
 *  `value` = 读到的状态词（缺失 ⇒ `（无状态行）`）。 */
function closeoutS3Error(value) {
  return "batch: 收口链未跑完（closeout chain gate）— close refuses: " +
    `§3 状态行 = ${value}，须 = 评审通过（评审须真跑过并给 pass）；§2 / §4 / §6 各段须有内容或由 §1 声明不适用。Missing: §3. Nothing was written.`
}

/**
 * 链完整性门（§4.18-A——**收口前置**）：判据 = §2 / §3 / §4 / §6 每段须 `sectionContentState(src, seg) !== "empty"`
 * （有内容 ∥ 声明不适用）；不满足 ⇒ throw 并点名缺段（J1；§6 为唯一缺段时 = J2 旧串逐字）。门不判内容质量、
 * 不做自动修复、不判 §1 / §5。声明形不合先行（J3——不静默当作无声明）。
 * @param {string} src — 档全文（写盘前只读）
 */
export function assertCloseoutChainComplete(src) {
  const badDecl = malformedInapplicableLine(src)
  if (badDecl !== null) throw new Error(inapplicableDeclarationError(badDecl))
  const missing = CHAIN_SEGMENTS.filter((n) => sectionContentState(src, n) === "empty")
  if (missing.length === 0) return
  if (missing.length === 1 && missing[0] === 6) throw new Error(emptySectionSixError()) // J2——零回归
  throw new Error(closeoutChainError(missing.map((n) => `§${n}`).join(" / "))) // J1
}

/**
 * 收口两路共调判序（设计档 §2.4–§2.6 · 2026-10-27 四道门）：
 *   ① 链完整性门（既有四条零改）
 *   ② **`§3` 状态词臂**：`§3` 状态行 = `评审通过` ∥ `§1` 声明 `> 不适用：§3 —— <理由>`
 *   ③ 本批批内单测档门（仍在盘 ⇒ 拒——零留存的结构兜底）
 *   ④ 文档机检门（REFUSED ∥ ERROR ⇒ 拒）
 * 位次 = 既有拒因之后、写盘之前（任一被拒 ⇒ 档字节不变）。返回 `④` 的门结果供回执拼行（`null` = 未跑）。
 * @param {{abs:string, cwd:string, agent:object, src:string, action:"close"|"status"}} o
 *   `src` = 调用方已读的写盘前全文（判据与写盘读同一份字节，不二次读盘）。
 * @returns {object|null} 文档机检门结果
 */
export function assertCloseoutGates({ abs, cwd, agent, src, action = "close" }) {
  assertCloseoutChainComplete(src) // ① 链门（含 §3 内容臂）
  // ② §3 状态词臂：word pass 或 §1 声明 §3 不适用（普通模式无设计评审的出路）
  if (!sectionInapplicable(src, 3)) {
    const s3 = readSectionStatusWord(src, 3)
    if (s3 !== STATUS_WORDS[3].done) throw new Error(closeoutS3Error(s3 ?? "（无状态行）"))
  }
  assertUnitTestFilesCleared(abs, action) // ③
  const gate = runBatchGate({ abs, cwd, agent, scope: "close" }) // ④
  if (gate.state === "refused" || gate.state === "error") throw new Error(gateRefusalMessage(gate, action))
  return gate
}

/** 读档（本档只读一面——写盘归 lifecycle 与 bind；读错上抛不伪装）。 */
export function readCloseoutSource(abs) { return readFileSync(abs, "utf8") }

/**
 * §5 写入门（段序门 · 设计档 §2.6 `R-G2`）：实现发生在评审通过之后，序在这里才判得出真假。
 * 判据 = `§3` 状态行 = `评审通过` ∥ `§1` 声明 `> 不适用：§3 —— <理由>`（普通模式无设计评审的批）。
 * 轻通道不受影响：它是父侧直改，**不写 §5**（补全落在 §3 / §6）；修正轮在 §3 已 pass 之后追加 §5，
 * 判据当场成立。
 * @param {string} src — 写盘前的档全文
 */
export function assertSectionFiveGate(src) {
  if (sectionInapplicable(src, 3)) return
  const s3 = readSectionStatusWord(src, 3)
  if (s3 === STATUS_WORDS[3].done) return
  throw new Error("batch: §5 append refused — the implementation section opens only after the design review passed " +
    `(§3 状态行 = ${s3 ?? "（无状态行）"}，须 = 评审通过). Nothing was written.\n` +
    "（仅普通模式的批可在 §1 写 `> 不适用：§3 —— <理由>` 放行 —— 普通模式无设计评审。" +
    "工程模式的批要真跑评审；轻通道的评审是后置，不是免掉：改完补设计与评审，补完再收回口。）")
}

/**
 * 收口重锚回执段（设计档 §2.11 逐字三行；空行不出）：
 *   `[ledger reanchor] 本批在途行 → 待核销 N 行：#12 「…」；#15 「…」`
 *   `[ledger reanchor] 本批未动行 → 条件 M 行：#16 「…」`
 *   `[ledger reanchor] 本批 N+M 行由重锚默认推进，父侧未显式处置：#12, #15, #16 —— 做完的请在收口前
 *    update → 待核销，没做完的 update → 条件 / 已废弃`
 * 第三行只在 N+M > 0 时出现（父侧全处置过 ⇒ 零该行，回执不噪）。失败 ⇒ 只出失败行（台账零写、冻结照常）。
 * @param {{reanchored:Array, failed:string|null}|null} result — `ledgerReanchorBatch` 返回形
 */
export function reanchorReceiptLine(result) {
  if (!result) return ""
  if (result.failed) return `\n[ledger reanchor] 未重锚：${result.failed}——台账零写；记录冻结照常完成`
  const face = (r) => `#${r.id} 「${r.title}」`
  const toSettle = (result.reanchored ?? []).filter((r) => r.to === "待核销")
  const toCondition = (result.reanchored ?? []).filter((r) => r.to === "条件")
  const lines = []
  if (toSettle.length) lines.push(`\n[ledger reanchor] 本批在途行 → 待核销 ${toSettle.length} 行：${toSettle.map(face).join("；")}`)
  if (toCondition.length) lines.push(`\n[ledger reanchor] 本批未动行 → 条件 ${toCondition.length} 行：${toCondition.map(face).join("；")}`)
  const all = result.reanchored ?? []
  if (all.length) {
    lines.push(`\n[ledger reanchor] 本批 ${all.length} 行由重锚默认推进，父侧未显式处置：${all.map((r) => `#${r.id}`).join(", ")} —— 做完的请在收口前 update → 待核销，没做完的 update → 条件 / 已废弃`)
  }
  return lines.join("")
}

/** 新事理由的 `evidence` 前缀（单源 = `docs/core/design/LEDGER.md` §6.3「参数面」；写入侧由
 *  `thincoder-core/ledger-write-ops.mjs` 的 `NEW_DEBT_EVIDENCE_PREFIX` 造，本档按同一字面取文）。 */
const NEW_DEBT_PREFIX = "新事理由："
/** `evidence` 追加相接符（追加形 `旧｜新` 零空格——§6.3「取文」）。 */
const EVIDENCE_JOINER = "｜"

/**
 * 取一行新事理由（设计档 §6.3「取文」）：`evidence` 中 `新事理由：` 之后、至首个 `｜`（追加相接符）
 * 或串尾的一段。无该前缀 ∥ 取到空串 ⇒ `null`（负向锁：不是本机制写的行不引）。**只读**——不改入参。
 * @param {string|null} evidence — 行 `evidence` 原值
 * @returns {string|null} 理由原文 ∥ `null`
 */
export function newDebtReasonOf(evidence) {
  const s = String(evidence ?? "")
  const at = s.indexOf(NEW_DEBT_PREFIX)
  if (at < 0) return null
  const rest = s.slice(at + NEW_DEBT_PREFIX.length)
  const cut = rest.indexOf(EVIDENCE_JOINER)
  const value = (cut < 0 ? rest : rest.slice(0, cut)).trim()
  return value === "" ? null : value
}

/**
 * 收口回执的新事理由引文段（逐字 = 设计档 §6.3「理由的读面与时点」：`  新事理由（#<id>）：<理由原文>`）。
 * 读者 = 本批收口那一笔的主 agent · 时点 = 本批收口。**零新清单、只引不写**：纯格式化、零库访问、
 * 不改入参；一条理由一行。取不到本批行 ⇒ 入参无该键 ⇒ 不出该段（收口不被否决）。
 * @param {{newDebtReasons?:{id:number, reason:string}[]}|null} result — `reanchorOnClose` 返回形
 * @returns {string} 以换行起头；无引文 ⇒ 空串
 */
export function newDebtReasonReceiptLine(result) {
  const rows = result?.newDebtReasons ?? []
  return rows.map((r) => `\n  新事理由（#${r.id}）：${r.reason}`).join("")
}
