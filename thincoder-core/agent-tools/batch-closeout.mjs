/**
 * agent-tools/batch-closeout.mjs — 收口面的四道判据与回执（从 `batch-lifecycle.mjs` 拆出，2026-10-27）。
 *
 * 权威规格 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6（四道门）∥ §2.11（收口前显式处置）；
 * 链门的原文契约 = `docs/core/design/BATCH-RECORD.md` §4.18-A。
 *
 * 本档承载三件（都不碰 fs 写、只读与判）：
 * ① `assertCloseoutGates` —— 收口两路（`close` ∥ `status` 写 `§1 已收口`）共调的判序：
 *    链完整性门（§2/§3/§4/§6 各段须有内容——`不适用` 声明机制已退役）→ **`§3` 状态词臂**（无条件 = `评审通过`）
 *    → 本批批内单测档门（`TESTING.md` §3.5）→ 文档机检门（`DOC-DISCIPLINE.md` §3.20）。
 * ② `assertSectionFiveGate` —— §5 写入门（段序门）：两条合取——① `§3` 状态行 = `评审通过`；② `§3` 最近一轮
 *    轮次块自己携 pass 裁定行（块 = `lastRoundBlock`；裁定读数 = 骨架档 `verdictGapOf`，`append §3` 写入闸与
 *    签发面读同一个函数）。旧的第一条旁路（`§1` 声明 §3 不适用）已随本批删除：实现只发生在评审之后，没有例外段。
 * ③ `reanchorReceiptLine` —— 收口重锚回执三行（§2.11 逐字）。
 *
 * 为什么 §3 内容臂留着（不换成只判状态词）：内容臂守的是「段里真跑过」，状态词臂守的是「跑的结论是
 * pass」——换掉内容臂 = 门被放宽（一段空着但状态词对就过），那正是本批要堵的洞。所以是**加**一条臂。
 *
 * 依赖单向（KD-4）：`skeleton ← closeout ← bind ← reopen ← lifecycle`——本档不 import lifecycle。
 */
import { readFileSync } from "node:fs"

import {
  countRoundBlocks, inapplicableDeclarationError, lastRoundBlock, malformedInapplicableLine, readSectionStatusWord,
  sectionContentState, STATUS_WORDS, verdictGapOf,
} from "./batch-skeleton.mjs"
// 裁定读数 = 骨架档 `verdictGapOf` 一个函数（设计档 §2.6.1「判据单源」）：`§5` 门判据 2 与签发面判的是同一份
// 回执文本，组合序各写一遍必然一处变一处不变。本档不再 import 两条裁定锚——锚与序都在那个函数里。
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

/** 链门拒绝句（§4.18-A J1——缺段非仅 §6 时；`missing` = 点名串，
 *  形如 `§2 / §3 / §4`——按段号升序列出）。不再提声明路：机制已退役，提它就等于又给一条可照抄的路。 */
function closeoutChainError(missing) {
  return "batch: 收口链未跑完（closeout chain gate）— close refuses: the record's closeout chain has not run, and closing would freeze it that way. " +
    `Missing: ${missing}. Each named section must carry its own content — the \`不适用\` declaration is retired (every batch needs its design, its review and its approval). ` +
    "§6 must carry its verification. Nothing was written."
}

/** `§3` 状态词臂拒句（设计档 §2.6 `R-G1` 逐字形）：链门已过、只剩评审结论没到时出这一条。
 *  `value` = 读到的状态词（缺失 ⇒ `（无状态行）`）。本臂无条件——没有「声明不适用」这条旁路。 */
function closeoutS3Error(value) {
  return "batch: 收口链未跑完（closeout chain gate）— close refuses: " +
    `§3 状态行 = ${value}，须 = 评审通过（评审须真跑过并给 pass）。Missing: §3. Nothing was written.`
}

/**
 * 链完整性门（§4.18-A——**收口前置**）：判据 = §2 / §3 / §4 / §6 每段须 `sectionContentState(src, seg) !== "empty"`
 * （有内容）；不满足 ⇒ throw 并点名缺段（J1；§6 为唯一缺段时 = J2 旧串逐字）。门不判内容质量、
 * 不做自动修复、不判 §1 / §5。声明行扫描先行（J3——那类行现在一律拒，不静默当作无声明）。
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
 *   ① 链完整性门（§2 / §3 / §4 / §6 各段须有内容）
 *   ② **`§3` 状态词臂**：`§3` 状态行 = `评审通过`（无条件）
 *   ③ 本批批内单测档门（仍在盘 ⇒ 拒——零留存的结构兜底）
 *   ④ 文档机检门（REFUSED ∥ ERROR ⇒ 拒）
 * 位次 = 既有拒因之后、写盘之前（任一被拒 ⇒ 档字节不变）。返回 `④` 的门结果供回执拼行（`null` = 未跑）。
 * @param {{abs:string, cwd:string, agent:object, src:string, action:"close"|"status"}} o
 *   `src` = 调用方已读的写盘前全文（判据与写盘读同一份字节，不二次读盘）。
 * @returns {object|null} 文档机检门结果
 */
export function assertCloseoutGates({ abs, cwd, agent, src, action = "close" }) {
  assertCloseoutChainComplete(src) // ① 链门（§2 / §3 / §4 / §6 各段须有内容）
  // ② §3 状态词臂（无条件）：评审须真跑过并给 pass。旧旁路「§1 声明 §3 不适用」已随声明机制退役删除。
  const s3 = readSectionStatusWord(src, 3)
  if (s3 !== STATUS_WORDS[3].done) throw new Error(closeoutS3Error(s3 ?? "（无状态行）"))
  assertUnitTestFilesCleared(abs, action) // ③
  const gate = runBatchGate({ abs, cwd, agent, scope: "close" }) // ④
  if (gate.state === "refused" || gate.state === "error") throw new Error(gateRefusalMessage(gate, action))
  return gate
}

/** 读档（本档只读一面——写盘归 lifecycle 与 bind；读错上抛不伪装）。 */
export function readCloseoutSource(abs) { return readFileSync(abs, "utf8") }

/**
 * 判据 2 的块内裁定读数（设计档 §2.6「pass 谓词」）：`null` = pass；否则 = 拒文括注里的那一格。
 * 组合序不在本档——一律取骨架档 `verdictGapOf`（判据单源，设计档 §2.6.1）：写面、`§5` 门与签发面三处同读
 * 一个函数，锚与顺序都只有那一份。本函数只留名字：拒文（`R-G2b`）与设计档用的就是这个符号，读者按它对账。
 * 块 = `null`（段内无块）⇒ `verdictGapOf(null)` = 「无裁定行」，与改前同值。
 * @param {string|null} block — `lastRoundBlock(src, 3)` 的返回形
 * @returns {string|null} 拒文括注值 ∥ `null`（块自己说了 pass）
 */
function lastRoundVerdictGap(block) {
  return verdictGapOf(block)
}

/** 判据 2 拒文（设计档 §2.6 `R-G2b` 逐字；`blocks` = 段内轮次块数——无块时取 0）。
 *  `gap` = `lastRoundVerdictGap` 的非空返回形，落进括注的裁定格。 */
function sectionFiveVerdictBlockError(src, gap) {
  const blocks = countRoundBlocks(src, 3)
  return "batch: §5 append refused — the last §3 round block carries no pass verdict " +
    `(§3 最近一轮轮次块 = 第 ${blocks} 轮，块内裁定 = ${gap}). A pass means that block carries a \`VERDICT: pass\` line and no changes-required line — ` +
    "a round that does not state a pass is not a pass: append the verdict line to that block (`VERDICT: pass`)，或按裁定行重跑评审。Nothing was written."
}

/**
 * §5 写入门（段序门 · 设计档 §2.6）：实现发生在评审通过之后，序在这里才判得出真假。
 * 判据 = 两条合取（**没有第一条的旁路**：`§1` 声明 §3 不适用已随声明机制退役——实现只发生在评审之后），
 * 先判状态词、过了再判块（状态词不过时拒文已足以说明，不必再报块）：
 *   ① `§3` 状态行 = `评审通过`（拒文 `R-G2`）；
 *   ② `§3` **最近一轮轮次块自己携 pass 裁定行**（拒文 `R-G2b`）——评审写了一笔 `§3` 却不带任何裁定行时，
 *      上一轮的 `评审通过` 仍是字面字，只判 ① 就会放行。② 只问一个可读的事实「门所依赖的块自己有没有
 *      说结论」，不猜意图（补记 ∥ 隐性打回的处置是同一条）；`§3` 无任何轮次块 ⇒ ② 不成立、照拒——
 *      真跑过的 pass 必落本轮块，无块即无 pass 可依。
 * 修正轮在 §3 已 pass 之后追加 §5，末块携 pass 裁定 ⇒ 两判据当场成立。`status` 单写不再足以开 `§5`（只置状态词、不落一块携 pass 裁定的
 * 轮次块 ⇒ 照拒）。
 * @param {string} src — 写盘前的档全文
 */
export function assertSectionFiveGate(src) {
  const s3 = readSectionStatusWord(src, 3)
  if (s3 !== STATUS_WORDS[3].done) {
    throw new Error("batch: §5 append refused — the implementation section opens only after the design review passed " +
      `(§3 状态行 = ${s3 ?? "（无状态行）"}，须 = 评审通过). Nothing was written.`)
  }
  const gap = lastRoundVerdictGap(lastRoundBlock(src, 3))
  if (gap !== null) throw new Error(sectionFiveVerdictBlockError(src, gap))
}

/**
 * 收口重锚回执段（设计档 §2.11 逐字三行；空行不出）：
 *   `[ledger reanchor] 本批在途行 → 待核销 N 行：#12 「…」；#15 「…」 —— 认领行只有两种终局：…`
 *   `[ledger reanchor] 本批未动行 → 条件 M 行：#16 「…」 —— 这些行不是本批的活（未认领却被绑在本档 = 点火违规）…`
 *   `[ledger reanchor] 本批 N+M 行由重锚默认推进，父侧未显式处置：#12, #15, #16`
 * **建议句贴在自己那一类行上**：第一行只装 `在途` 行、第二行只装 `待讨论` / `待设计` 行——两类的出路相反
 * （认领行只有两种终局；未认领行本来就不该在本批），一句管两类正是要收的病句；汇总行因此只点名、不给建议。
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
  // 建议句各贴其行（§2.11）：第一行只装认领行、第二行只装未认领行，第三行只点名。
  if (toSettle.length) {
    lines.push(`\n[ledger reanchor] 本批在途行 → 待核销 ${toSettle.length} 行：${toSettle.map(face).join("；")}` +
      " —— 认领行只有两种终局：做完的 close 勾销（待核销 → 已核销），判定不做的 update → 已废弃 并写判据（认领即承诺，没有第三种）")
  }
  if (toCondition.length) {
    lines.push(`\n[ledger reanchor] 本批未动行 → 条件 ${toCondition.length} 行：${toCondition.map(face).join("；")}` +
      " —— 这些行不是本批的活（未认领却被绑在本档 = 点火违规）；已落 trigger = 条件 + 复启句，由下一批接手，本批不再处置")
  }
  const all = result.reanchored ?? []
  if (all.length) {
    lines.push(`\n[ledger reanchor] 本批 ${all.length} 行由重锚默认推进，父侧未显式处置：${all.map((r) => `#${r.id}`).join(", ")}`)
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
