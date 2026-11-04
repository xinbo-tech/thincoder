/**
 * agent-tools/batch.mjs — 批次档生命周期工具（KD-4 拆分主档：action 分发 + append 迁移面 +
 * 路径解析单源 + #84 记账缝）。
 *
 * 单工具 `batch`，action = create（建档，§4.11）/ append（段写入——原 batch-segment.mjs 语义
 * 逐字迁移，§4.1 全表）/ edit（段内就地改——锚定区间替换，§4.19）/ status（段属主状态行流转，
 * §4.12）/ close（收口冻结，§4.13）。写入面**按段分权、不按段分处置**：六段各自只有一个作者，
 * 作者对本段可 append 加内容 ∥ edit 就地改既有行（§4.19）；状态行只有一个写者（status）。
 * 权威规格 = `docs/core/design/BATCH-RECORD.md` §4（契约/挂载/用例 §4.8/骨架 §4.10/
 * 参数面 §4.11–§4.13）；骨架与判定字面单源 = `batch-skeleton.mjs`；lifecycle 面 =
 * `batch-lifecycle.mjs`。**依赖单向（KD-4）：skeleton ← lifecycle ← 主档**。
 *
 * 身份判据（D-BR17/D-BR18/D-BR21）：主 agent 调用 ctx 带 `depth === 0`（dispatch 装配）；
 * eng 子代理 `depth > 0`（`agent._role` 定段）；评审实例 ctx 无 depth 但工具以 `review: true`
 * 绑定。create/close 仅 depth-0 放行；depth-0 的 append/status/close 可选 `path`（D-BR21：
 * 缺省 = findInFlightBatch 取唯一在飞批，0/复数 ⇒ throw）；子代理/评审传 path ⇒ 拒（目标 =
 * spawn/实例注入，语法上写不到别处——运行期门拒）。append 段白名单（**模式感知**——§4.16）：
 * depth-0 → 工程 §1/§4/§6 ∥ 普通 §1/§2/§4/§5/§6 · eng-designer → §2 · 评审 → §3 · eng-coder → §5 ·
 * coder（普通模式分支增表——SEGMENT_BY_ROLE_NORMAL）→ §5；status 写域 = 调用者自己段（模式感知
 * ——见 batch-lifecycle.mjs）。**edit 的段域 = 同模式 append 白名单**（§4.19「段域」行——一张表两
 * 个动作，不另立第二张）：能 append 哪段就 edit 哪段，两动作只差写法（段尾加内容 ∥ 段内改既有字）。
 * append 迁移面错误串**逐字保持
 * "batch_segment:" 前缀**（§4.1 全表锚断言）；"batch:" 前缀 = 新增错误面（create/close/status/
 * edit 锚判据/findInFlight/path 门/dispatch）。
 *
 * 导出面：`batchTool`（主名）· `resolveBatchDocPath` · `batchDocBases` · `batchDocForReview` ·
 * `configureBatchSegment` / `resetBatchSegment`（#84 记账缝——契约名不变，AC-11 零改）·
 * `MAX_TEXT_CHARS` · `SEGMENT_BY_ROLE`。
 *
 * #84 记账面（CORE-UNIFICATION §2.13.4）：写入成功后的记账**按端注入**——核内缺省 no-op = CLI
 * 语义零行为变；端装配经 `configureBatchSegment({ onWrite })` 覆盖（VSC 侧现形 = `_touchedFiles`
 * 记账）。核内零端名分支（契约 5——只认 `onWrite` 函数名）。
 */
import { readFileSync, writeFileSync } from "node:fs"

// 描述面 = `tool-docs/batch.md`（#15 描述外置统一——工厂形描述经 DESC 单一解析面，工厂调用期取值）
import { DESC } from "../tools/shared.mjs"
import { SEGMENT_BY_ROLE, SEGMENT_BY_ROLE_NORMAL, DEPTH0_SEGMENTS, readBatchStatusLine, sectionHeaderRe, STATUS_LINE_RE, findPlaceholderResidue, placeholderResidueError, ROUND_HEADING_RE, nextRoundNumber, statusResetPlan, statusPassPlan, updateSectionStatusLine, verdictGapOf } from "./batch-skeleton.mjs"
import { batchDocBases, resolveBatchDocPath } from "./batch-paths.mjs"
import { gateReceiptLine, gateRefusalMessage, runBatchGate } from "./batch-gate.mjs"
import { assertSectionFiveGate } from "./batch-closeout.mjs"
import { createBatchRecord } from "./batch-ledger-bind.mjs"
import { closeBatchRecord, findInFlightBatch, statusBatchRecord } from "./batch-lifecycle.mjs"
// 日期戳单源（`todayLocal`——重开 §1 状态行与本节留痕行同一枚，日期口径只一处）。
import { todayLocal } from "./batch-reopen.mjs"

export { SEGMENT_BY_ROLE, batchDocBases, resolveBatchDocPath }

/** text 单次上限（BATCH-RECORD.md §4.1——超出引导分段追加，不承诺"不新盖戳"）。append 迁移域私有区常量
 *  （随执行体自 batch-segment.mjs 迁入——骨架档只住骨架/状态行单源，lifecycle 档头枚举口径）。 */
export const MAX_TEXT_CHARS = 20000
/** 凭证形态（`BATCH-RECORD.md` §4.1——三形）：`[DESIGN-TOKEN:…]` 闭括号形 ∥ `designId: …` 键形 ∥ 无标两段
 *  token 值形 `⟨uuid⟩:⟨epoch⟩`（与单源 `design-token.mjs` 判据对表）；裸 uuid 非凭证不剥（KD-7）。两字面勿
 *  合并：`CRED_RE` 走 `.replace()` 须 `/g` ∥ `CRED_TEST_RE` 逐行 `.test()` 须非 `/g`（lastIndex 有状态会漏剥）。 */
const CRED_RE = /\[DESIGN-TOKEN:[^\]]*\]|designId\s*:\s*\S+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:\d{10,16}/g
const CRED_TEST_RE = /\[DESIGN-TOKEN:[^\]]*\]|designId\s*:\s*\S+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:\d{10,16}/

// ─── #84 记账面注入缝（「记账面按端注入」，形态参 §2.13.5 注入缝）───────────────
/**
 * 写入成功后的记账注入面（**缺省 no-op** = CLI 语义零行为变）：端装配层可覆盖——把写成的
 * 批次档记入调用者写域（VSC 侧现形 = `agent._touchedFiles` 记账，供子代理合入 / recent_changes /
 * verify / advisor 默认范围消费）。核内零端名分支（契约 5——本档只认 `onWrite` 函数名）。
 * 形态与 `tools/write-path.mjs` 的 `configureWritePath` 同款：模块级、缺省不覆盖、null 撤销。
 */
let injectedOnWrite = null
export function configureBatchSegment(impl) {
  injectedOnWrite = impl && typeof impl.onWrite === "function" ? impl.onWrite : null
}
/** 撤销注入（测试与端装配生命周期用——缺省态 = 零记账）。 */
export function resetBatchSegment() { injectedOnWrite = null }

/**
 * 批次档路径解析单源（`BATCH-RECORD.md` §4.15 · 台账 #287——实现住 `batch-paths.mjs`，本档 re-export）：
 * 候选序 cwd → 项目根 → 逐基底 · 读面取首个**可读**（口径仍「若传则须可读」，错误文案逐字零变）·
 * create 取首个落基底内 · 锚定防嵌套（按路径段判）。四处调用点（create / 读面 / 评审门 / spawn 门）
 * 均经该叶档——本档不再持第二份解析实现。
 */

/**
 * 设计评审的实例绑定解析（BATCH-RECORD.md §4.2/§4.3——评审实例的唯一路径来源）：
 *  - 同步路径：调用方（advisor 工具）把实例绑定显式放进 callbacks（**带 batchDoc 键**，
 *    未绑定即 null）——以此为准，不再回看池条目（防同步/异步混跑时串档）；
 *  - 异步路径：本评审所在**池条目**的 `run.batchDoc`（文档集 = 实例键，各评审各取各条）。
 */
export function batchDocForReview(agent, documents, callbacks = null) {
  if (callbacks && "batchDoc" in callbacks) return callbacks.batchDoc ?? null
  const key = JSON.stringify([...(documents ?? [])].sort())
  for (const e of agent?._asyncAdvisors?.values?.() ?? []) {
    if (e.status === "running" && e.reviewType === "design" && JSON.stringify([...(e.documents ?? [])].sort()) === key) {
      return e.run?.batchDoc ?? null
    }
  }
  return null
}

// ─── append 迁移面（原 batch-segment.mjs :129-184 私有区——逐字迁移，错误串逐字保序）───

/** 段号解析：`§2` / `2` / `§2 批次任务` 均可；无法解析 → null。 */
function segmentNumber(raw) {
  const m = /^§?\s*(\d+)/.exec(String(raw ?? "").trim())
  return m ? Number(m[1]) : null
}

/** 身份 → 可写段号；无写权身份 → null。评审实例绑定优先（评审者的身份即"设计评审"。）
 *  depth-0 的段白名单（append——模式感知，§4.16）由 appendBatchRecord 分支，不经本表；
 *  普通模式分支额外合并 coder 增表（`SEGMENT_BY_ROLE_NORMAL`——**合并查只在普通模式分支**）。 */
function allowedSegment(agent, review, engineering) {
  if (review) return 3
  const role = agent?._role
  return SEGMENT_BY_ROLE[role] ?? (engineering ? null : SEGMENT_BY_ROLE_NORMAL[role]) ?? null
}

/** 无写权身份拒串（`append` 与 `edit` 共用一条——两动作读同一张段白名单，同一件事不各写一份串）。 */
function noSegmentError(engineering) {
  return engineering
    ? "batch_segment: no segment is writable by this caller — the channel exists for eng-designer (§2), eng-coder (§5) and design reviews bound to a batch record (§3); the parent agent writes §1/§4/§6 through ordinary document writes."
    : "batch_segment: no segment is writable by this caller — the channel exists for eng-designer (§2), eng-coder (§5) and design reviews bound to a batch record (§3); in normal mode the parent agent writes §1/§2/§4/§5/§6 through ordinary document writes."
}

/**
 * 凭证剥除 + 伪造轮次标题丢弃（BATCH-RECORD.md §4.1 F6/AC30/AC34）。
 * 逐行处理：含凭证形态的行 → 剥除该子串，剥后为空则整行丢弃（其余内容逐字保留）。
 * `dropStamp`（仅 §3 目标段）：调用方自带的 `### 轮次 N（评审子代理）` 行被丢弃——
 * 工具生成才是唯一来源戳（否则伪造戳会污染 N 计数）。
 */
function sanitizeText(text, dropStamp) {
  const kept = []
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    if (dropStamp && ROUND_HEADING_RE.test(line)) continue
    if (!CRED_TEST_RE.test(line)) { kept.push(line); continue }
    const cleaned = line.replace(CRED_RE, "").replace(/[ \t]+$/, "")
    if (cleaned.trim()) kept.push(cleaned)
  }
  return kept.join("\n")
}

/** 段尾定位 + 插入（append-only：只在段尾插入，既有字节不变；返回新全文 + 本轮 N）。
 *  `blockLead`（仅 §3——打回重置的留痕行）：落在**工具戳标题之后、评审正文之前**——与
 *  `### 轮次 N（评审子代理）` 同属工具戳面，append-only 不变。
 */
function insertIntoSection(src, seg, text, blockLead = "") {
  const hdr = sectionHeaderRe(seg).exec(src)
  if (!hdr) throw new Error(missingSectionError(seg))
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = hdr.index + hdr[0].length
  const next = nextRe.exec(src)
  const endIdx = next ? next.index : src.length
  // 来源戳（仅 §3）：工具生成标题 + N——调用方写不进自己的标题（sanitize 已丢弃同名行）。
  // N 的单源 = `nextRoundNumber`（= `countRoundBlocks + 1`）——留痕行的「第 N 轮」同取这一枚。
  const roundN = seg === 3 ? nextRoundNumber(src, 3) : 0
  const stamp = seg === 3 ? `### 轮次 ${roundN}（评审子代理）\n\n` + (blockLead ? `${blockLead}\n\n` : "") : ""
  const payload = stamp + text
  const before = src.slice(0, endIdx)
  const after = src.slice(endIdx)
  const eol = src.includes("\r\n") ? "\r\n" : "\n"
  const lead = before === "" ? "" : before.endsWith(eol + eol) ? "" : before.endsWith(eol) ? eol : eol + eol
  // 尾随 eol 恒加（块自成行）；后面还有段标题时再补一个空行（保持模板的空行分隔）。
  const written = before + lead + payload.replaceAll("\n", eol) + eol + (after === "" ? "" : eol) + after
  return { written, roundN }
}

/**
 * append 执行体（action=append——原 batch_segment execute 迁移 + depth-0 分支）：
 *  - 段白名单（**模式感知**——§4.16）：depth-0 工程 → §1/§4/§6（新错误面，"batch:" 前缀）∥
 *    depth-0 普通 → §1/§2/§4/§5/§6（模式化新串）；eng-designer → §2 · 评审 → §3 ·
 *    eng-coder → §5 · coder（普通模式分支增表）→ §5（迁移错误面，"batch_segment:" 前缀**逐字保持**）；
 *  - 目标定位（D-BR21）：depth-0 path 可选（缺省 = findInFlightBatch 唯一在飞批）；子代理/评审
 *    传 path ⇒ 拒，目标 = spawn/实例绑定；
 *  - 其余（gate / text 校验 / 剥凭证 / 骨架保护 / **死占位机检（F11-C）** / **文档机检门（§3.20 结构兜底 ①——
 *    **全部 append 同挂**（含 depth-0 与评审写 §3）：本次写入文本的命中 ⇒ 拒写，ERROR ⇒ 写 + 回执明示；
 *    批档已落段命中只入回执）** / 插入 / 记账 / 回执）逐字保持原语义。
 */
function appendBatchRecord({ args, ctx, review, batchDoc, onWritten }) {
  const agent = ctx?.agent ?? {}
  const cwd = agent.cwd
  const depth0 = ctx?.depth === 0
  // 模式位执行期实读（§4.16——同款先例 = task.mjs execute 门；翻转即时生效——D-BR26）
  const engineering = !!agent?.config?.agent?.engineering
  const seg = allowedSegment(agent, review, engineering)
  if (!depth0 && seg === null) throw new Error(noSegmentError(engineering))
  const n = segmentNumber(args?.segment)
  if (n === null) {
    if (depth0) {
      throw new Error(engineering
        ? `batch: unknown segment ${JSON.stringify(args?.segment ?? null)} — depth-0 append writes §1/§4/§6 of the in-flight record (pass the section number you write, e.g. "§4").`
        : `batch: unknown segment ${JSON.stringify(args?.segment ?? null)} — in normal mode depth-0 append writes §1/§2/§4/§5/§6 of the in-flight record (pass the section number you write, e.g. "§4").`)
    }
    throw new Error(`batch_segment: unknown segment ${JSON.stringify(args?.segment ?? null)} — pass the section number you write (e.g. "§${seg}").`)
  }
  if (depth0) {
    const domain = engineering ? DEPTH0_SEGMENTS.append.engineering : DEPTH0_SEGMENTS.append.normal
    if (!domain.includes(n)) {
      throw new Error(engineering
        ? `batch: §${n} is not yours to write — depth-0 append writes §1/§4/§6 only (一段一作者: §2 = eng-designer, §3 = design review, §5 = eng-coder).`
        : `batch: §${n} is not yours to write — in normal mode depth-0 append writes §1/§2/§4/§5/§6 (一段一作者: §3 = design review only). Nothing was written.`)
    }
  } else if (n !== seg) {
    throw new Error(`batch_segment: §${n} is not yours to write — this caller writes §${seg} only (一段一作者: eng-designer → §2, design review → §3, eng-coder → §5).`)
  }
  // 目标定位（D-BR21）——path 拒面先于绑定解析（与 status 同序：段白名单 → path 门 → 取值）。
  const givenPath = typeof args?.path === "string" && args.path.trim() ? args.path : null
  let abs
  if (givenPath) {
    if (!depth0) {
      throw new Error("batch: path is a depth-0-only parameter (D-BR21) — your target record arrives via the spawn binding / the review instance key. Nothing was written.")
    }
    abs = resolveBatchDocPath(cwd, givenPath)
  } else if (depth0) {
    abs = findInFlightBatch(cwd, batchDocBases(cwd)) // 歧义锚 ⇒ 基底 = 候选并集（#828——唯一在飞批照取 / ≥2 照列）
  } else {
    if (!batchDoc) {
      throw new Error("batch_segment: no batch record is bound to this caller — there is no path parameter by design (the target arrives via the spawn binding / the review instance key). Report the section as not written.")
    }
    abs = resolveBatchDocPath(cwd, batchDoc)
  }
  const src = readFileSync(abs, "utf8")
  const status = readBatchStatusLine(src)
  if (status === "closed") throw new Error(FROZEN_RECORD_ERROR)
  if (status === "unknown") throw new Error(UNRESOLVED_STATUS_ERROR)
  if (typeof args?.text !== "string") {
    throw new Error("batch_segment: text must be a string (the markdown to append).")
  }
  if (args.text.length > MAX_TEXT_CHARS) {
    throw new Error(`batch_segment: text is ${args.text.length} characters — the limit is ${MAX_TEXT_CHARS} per call. Split it into multiple calls: each call becomes its own section and the round number N continues (分段追加——每次调用各成节、N 顺延).`)
  }
  if (/^## §\d/m.test(args.text)) throw new Error(SKELETON_GUARD_ERROR)
  const body = sanitizeText(args.text, n === 3).replace(/^\n+/, "").replace(/\s+$/, "")
  if (!body.trim()) {
    throw new Error("batch_segment: nothing to append — the text is empty after credential stripping (credential values never reach the record).")
  }
  // F11-C（挂点：gate / text 校验后 · insertIntoSection 前）：档头结构行死占位残留 ⇒ 拒
  // （段体引用豁免——判据可辨性收正，`TOOLS.md` §6.20；骨架枚举单源 = skeleton 档 TEMPLATE_PLACEHOLDERS）。
  const residues = findPlaceholderResidue(src)
  if (residues.length) throw new Error(placeholderResidueError(residues))
  // §5 写入门（段序门 · 设计档 §2.6 `R-G2`）：实现发生在评审通过之后，序在这里判得出真假；这一门没有旁路
  // （`§1` 声明 §3 不适用已随声明机制退役）。
  if (n === 5) assertSectionFiveGate(src)
  // §3 写入闸（设计档 `BATCH-LEDGER-REVIEW-UNIFY.md` §2.6.1 `R-G3`——裁定行在写的时刻就要在）：
  // 能写 §3 的只有绑本档的评审实例，它结算后即离场 ⇒ 把错误退回**还有权补那一行的人在场的那一刻**。
  // 判定输入 = 净化后正文 `body`（落档的就是它；每笔 §3 自成一块 ⇒ 「写前正文 ≡ 写后末块」只对 body 成立）；
  // 判据单源 = 骨架档 `verdictGapOf`（与 §5 门判据 2 ∥ 签发面同一个函数）。
  // 放行面 = **只拒两格**（`无裁定行` ∥ `两者同携`）：判打回的一笔（`VERDICT: changes-required` ∥ `结论：不通过`）
  // 照写——§5 门判据 2 与打回重置都靠那一块自带打回裁定；拦它 = 把打回这条业务路堵死。
  // 位次 = 既有拒因之后、文档机检门之前（拒 = 零字节落盘、轮次号不消耗——N 在 insertIntoSection 时才取）。
  if (n === 3) {
    const gap = verdictGapOf(body)
    if (gap === "无裁定行" || gap === "两者同携") throw new Error(SECTION3_VERDICT_GAP_ERROR)
  }
  // 文档机检门（§3.20「结构兜底」①——门位 = 既有拒因全部之后、insertIntoSection / 写盘之前）：
  // **全部 append 同挂**（§1–§6，含 depth-0 与评审写 §3——规则一条，不按身份分支）；
  // 强制集 = 本次写入文本 ∪ 写者触达账，批档已落段命中只入回执（不阻本次写）。
  // `pending` = 本次段号与正文：门据此落同目录片段档判「你手里这段」，判法与批档本体逐字同源。
  // REFUSED ⇒ throw（零字节落盘）；PASS ⇒ 照写；ERROR / 门自身异常 ⇒ 写 + 回执明示。
  const gate = runBatchGate({ abs, cwd, agent, scope: "writer", pending: { section: n, body } })
  if (gate?.state === "refused") throw new Error(gateRefusalMessage(gate, "append"))
  // 裁定行 → 状态行（BLRU §2.5——**工具被动写**，两个方向共用同一处判定与同一条写入路径）：
  // 打回即重置（三合取：本笔写 §3 ∧ 本笔命中打回裁定行 ∧ 写前 §3 状态行 = 评审通过）⇒ 本轮块首留痕行
  // （随 `blockLead` 进插入）+ 状态行重置；通过即置位（本笔写 §3 ∧ 本笔命中 pass 裁定行且不命中打回行 ∧
  // 写前 §3 状态行 ≠ 评审通过）⇒ 状态行置成评审通过，无留痕行（块本身即记录）。
  // 两条靠各自的三合取天然互斥；`??` 的左先右后与签发面 `verdictGateFailure` 同序（先打回、后 pass）。
  // 状态行仍**只经 `updateSectionStatusLine` 这一个写入函数**改写（不新开第二条写路径）；仍是
  // 一次 `writeFileSync`——块与字进的是同一个字符串（无「块已落、字未到」的窗口）。
  // 留痕行不经文档机检门——门位在上面（判集 = 本次评审正文 `pending.body`）。
  const date = todayLocal()
  const plan = statusResetPlan(src, n, body, date) ?? statusPassPlan(src, n, body, date)
  const { written: inserted, roundN } = insertIntoSection(src, n, body, plan?.traceLine ?? "")
  const written = plan ? updateSectionStatusLine(inserted, 3, plan.statusValue) : inserted
  writeFileSync(abs, written)
  // #84：记账面按端注入（缺省 no-op = CLI 语义零行为变——端装配经 configureBatchSegment 覆盖）。
  onWritten?.(agent, abs)
  return `batch_segment: appended ${body.length} characters to §${n} of the batch record${roundN ? ` (### 轮次 ${roundN}（评审子代理）)` : ""}.${gateReceiptLine(gate)}`
}

// ─── 拒串单源（append / edit 共用——两动作只差写法，不差判据）───────────────

/** 拒串：`§3` 写入闸（`R-G3` 逐字 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6.1）——一笔 `§3` 追加读成
 *  「无裁定行」∥「两者同携」⇒ 拒写（零字节落盘、轮次号不消耗）。两个裁定词**内联在同一句里，不各占独立一行**：
 *  各占一行时这段拒文自己就读成「两者同携」，把拒文原样引用并另写一行裁定的一笔仍被拒——想解释这道闸的人恰被
 *  它挡在门外；缩进 ∥ 列表符同样不取（照抄的行不命中整行锚 ⇒ 补的那行永不生效）。混形反例与「不消耗轮次号」照留。 */
const SECTION3_VERDICT_GAP_ERROR = "batch_segment: §3 append refused — this round block states no readable verdict (块内裁定 = 无裁定行 | 两者同携). A §3 block must carry exactly one verdict as a line of its own; put exactly one of `VERDICT: pass` ∥ `VERDICT: changes-required` on such a line in the text you append — copying this refusal verbatim copies the words, not a verdict line.\n(本地化整行形 `结论：通过` / `结论：不通过` 同认，中文形的尾句号可省可带（`结论：通过。` 同认）。不作独立整行的写法不认——例如 `**结论** = VERDICT: pass`。) Nothing was written — no bytes landed and no round number was consumed: append the same text again with the verdict line added."
/** 拒串：已收口档（§4.9 门 ②——append / edit / status 共用一条，串逐字含「已收口档不回改」）。 */
const FROZEN_RECORD_ERROR = "batch_segment: 已收口档不回改 — the bound batch record's §1 status line contains 「已收口」, so the record is frozen: its body is never written to again (整档冻结；改 = 新批新档). Nothing was written. Report the section as not written."
/** 拒串：§1 状态行不可解析或缺失（fail-closed 视为冻结——与冻结门同一条解析器）。 */
const UNRESOLVED_STATUS_ERROR = "batch_segment: 状态行不可解析或缺失 — the bound batch record has no §1 `**状态行**：` line inside the section header zone whose value contains 已收口 or 进行中 (fail-closed: the write is refused as if frozen). If the record does carry such a line further down — in a round block or in the section body — move it up under `## §1`: a status line outside the header zone is never read. Nothing was written. Do NOT close the record after a refused append — nothing landed, and closing freezes the missing section for good (失败 ⇒ 勿 close)."
/** 拒串：段标题缺失（create 是骨架唯一权威入口，append / edit 都不补骨架）。 */
const missingSectionError = (seg) => `batch_segment: the bound batch record has no "## §${seg}" section header — the six-section skeleton is written by the record's creator before any segment write. Fix: ask the parent/creator to add the "## §${seg} …" heading (with the template's sub-headings) first, then call batch_segment again. Nothing was written.`
/** 拒串：骨架保护（写入文本 ∥ 替换文本含 `## §N` 段头形态 ⇒ 段定位失效——append / edit 共用）。
 *  两个动作都不许把段头写进段体：段定位靠 `## §N` 标题，写进去就把定位面改掉（§4.1 fail-closed 行）。 */
const SKELETON_GUARD_ERROR = "batch_segment: the text contains a section header line matching `^## §N` — that would break section location. Rewrite it (escape the heading, or drop the leading `## §N`), then call again (骨架保护). Nothing was written. Do NOT close the record after a refused append — nothing landed, and closing freezes the missing section for good (失败 ⇒ 勿 close)."
/** 拒串：edit 的锚 / 替换触及或引入 `**状态行**：` 行（§4.19 锚判据；逐字 = `TOOLS.md` §6.24 ⑤ E5）。 */
const EDIT_STATUS_LINE_ERROR = "batch: edit would rewrite or introduce a **状态行** line — that line has exactly one writer: status, with a value from the section's word list. Nothing was written."
/** 拒串：edit 空锚（E1——空锚的命中计数不会 ≥2，按「恰一次」会放行并插在段首）。 */
const EDIT_BLANK_ANCHOR_ERROR = "batch: edit needs a non-empty oldText — a blank anchor cannot match exactly once. Nothing was written."
/** 拒串：edit 的 newText 缺参 / 非串（`type: string` 的 fail-closed 面——缺参若当空串处理就是静默删区间）。 */
const EDIT_NO_TEXT_ERROR = "batch: newText must be a string — pass an empty string to delete the anchored range. Nothing was written."

// ─── edit 面（段内就地改：`BATCH-RECORD.md` §4.19 的代码单源）─────────────────────

/** 段体**字符区间**（`## §N` 标题行的行尾之后 → 下一 `## §N` 段头之前；段头缺失 ⇒ null）。
 *  段定位判据与 `batch-skeleton.mjs` 同源（`sectionHeaderRe` + `/^## §\d/gm`）——本档只取**偏移**。
 *  区间函数住这里而不进骨架档：骨架档贴 500 软线，本批不带出助手函数（分批记录 2.4 贴线判）。 */
function sectionBodySpan(src, seg) {
  const hdr = sectionHeaderRe(seg).exec(src)
  if (!hdr) return null
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = hdr.index + hdr[0].length
  const next = nextRe.exec(src)
  const end = next ? next.index : src.length
  const nl = src.indexOf("\n", hdr.index) // 段头行余文（`## §N …` 的标题部分）不入段体
  return { start: nl < 0 || nl + 1 > end ? end : nl + 1, end }
}

/** 段体内每条 `**状态行**：` 行的字符区间（相对段体起点）——「状态行只有一个写者」的判定面（E5）。 */
function statusLineSpans(body) {
  const out = []
  let at = 0
  for (const line of body.split("\n")) {
    if (STATUS_LINE_RE.test(line)) out.push([at, at + line.length])
    at += line.length + 1
  }
  return out
}

/**
 * edit 执行体（action=edit——作者对自己那一段的**受认可通道**，不是唯一通道；判据单源 = `docs/core/design/BATCH-RECORD.md` §4.19）：
 * 锚定区间替换——`oldText` 在**目标段段体**内恰一次命中（逐字节，含行尾）⇒ 换为 `newText`；`newText` 空串 = 删区间。
 * 判定与写盘**全部复用既有面**（零新写盘路径）：段域 = 同模式 append 白名单（§4.1 一处单源，一张表两个动作）· path 门（D-BR21）·
 * 冻结拒写（§4.9 门 ②，串与 append 逐字同）· 剥凭证（同一条 `sanitizeText`；§3 另丢伪造轮次戳——§4.7 不变量 5）· 骨架保护 ·
 * 文档机检门（**判集两类**：段长类判 `newText`、锚类判整档——§4.9 门 ④）· `onWrite` 记账 · 一次 `writeFileSync`。
 * **不跑 §5 段序门**（§4.19「段序门」行：edit 须有既有锚 ⇒ 写不出原本不存在的内容，造不出「先实施」；
 * 反过来在 §3 进行中时拒掉 §5 的旧行，正是本批要消的那种死锁）。
 * **不做整段替换**（段体实测两成超 `MAX_TEXT_CHARS`——重发全文 = 静默丢内容）∥ **不做模糊匹配**（一次近似改写 = 一次
 * 没人看见的错改；匹配 = 逐字节，`\r\n` 档上的 LF 锚零命中 ⇒ 拒，安全方向）。
 * 拒面（全 fail-closed，零字节落盘）：空锚 E1 · 零命中 E2 · ≥2 命中（列命中行号）E3 · 锚越段界 E4 · 锚或替换触及 / 引入
 * `**状态行**：` 行 E5 · 骨架保护 ∥ 冻结 ∥ 段域 ∥ newText 缺参（E6 族）。
 */
function editBatchRecord({ args, ctx, review, batchDoc, onWritten }) {
  const agent = ctx?.agent ?? {}
  const cwd = agent.cwd
  const depth0 = ctx?.depth === 0
  const engineering = !!agent?.config?.agent?.engineering
  // 段域（§4.19「段域」行）：**= 同模式 append 白名单**——能 append 哪段就 edit 哪段，段域一处单源、一张表两个动作。
  // 子代理侧取身份段（§4.1：身份 → 段）；depth-0 侧取同模式 append 白名单（工程 §1/§4/§6 ∥ 普通 §1/§2/§4/§5/§6，§4.16）。
  const own = allowedSegment(agent, review, engineering)
  if (!depth0 && own === null) throw new Error(noSegmentError(engineering))
  const n = segmentNumber(args?.segment)
  if (n === null) {
    throw new Error(depth0
      ? `batch: unknown segment ${JSON.stringify(args?.segment ?? null)} — depth-0 edit rewrites a section of the in-flight record that you author (${engineering ? "§1/§4/§6" : "§1/§2/§4/§5/§6"} — pass the section number you write, e.g. "§4"). Nothing was written.`
      : `batch_segment: unknown segment ${JSON.stringify(args?.segment ?? null)} — pass the section number you write (e.g. "§${own}").`)
  }
  if (depth0) {
    const domain = engineering ? DEPTH0_SEGMENTS.append.engineering : DEPTH0_SEGMENTS.append.normal
    if (!domain.includes(n)) {
      throw new Error(engineering
        ? `batch: §${n} is not yours to write — in engineering mode depth-0 edit rewrites §1/§4/§6 (一段一作者: §2 = eng-designer, §3 = design review, §5 = eng-coder). Nothing was written.`
        : `batch: §${n} is not yours to write — in normal mode depth-0 edit rewrites §1/§2/§4/§5/§6 (一段一作者: §3 = design review only). Nothing was written.`)
    }
  } else if (n !== own) {
    throw new Error(`batch_segment: §${n} is not yours to write — this caller writes §${own} only (一段一作者: eng-designer → §2, design review → §3, eng-coder → §5). Nothing was written.`)
  }
  // 目标定位（D-BR21）——与 append / status 同序：段域 → path 门 → 取值。
  const givenPath = typeof args?.path === "string" && args.path.trim() ? args.path : null
  let abs
  if (givenPath) {
    if (!depth0) {
      throw new Error("batch: path is a depth-0-only parameter (D-BR21) — your target record arrives via the spawn binding / the review instance key. Nothing was written.")
    }
    abs = resolveBatchDocPath(cwd, givenPath)
  } else if (depth0) {
    abs = findInFlightBatch(cwd, batchDocBases(cwd)) // 歧义锚 ⇒ 基底 = 候选并集（#828——唯一在飞批照取 / ≥2 照列）
  } else {
    if (!batchDoc) {
      throw new Error("batch_segment: no batch record is bound to this caller — there is no path parameter by design (the target arrives via the spawn binding / the review instance key). Report the section as not written.")
    }
    abs = resolveBatchDocPath(cwd, batchDoc)
  }
  const src = readFileSync(abs, "utf8")
  const status = readBatchStatusLine(src)
  if (status === "closed") throw new Error(FROZEN_RECORD_ERROR)
  if (status === "unknown") throw new Error(UNRESOLVED_STATUS_ERROR)
  const oldText = args?.oldText
  if (typeof oldText !== "string" || !oldText.trim()) throw new Error(EDIT_BLANK_ANCHOR_ERROR)
  if (typeof args?.newText !== "string") throw new Error(EDIT_NO_TEXT_ERROR)
  if (/^## §\d/m.test(args.newText)) throw new Error(SKELETON_GUARD_ERROR)
  const span = sectionBodySpan(src, n)
  if (!span) throw new Error(missingSectionError(n))
  const body = src.slice(span.start, span.end)
  const hits = []
  for (let at = body.indexOf(oldText); at >= 0; at = body.indexOf(oldText, at + 1)) hits.push(at)
  if (!hits.length) {
    // 零命中 vs 越段界：全档别处有 ⇒ 锚越出目标段段体（E4）；全档无 ⇒ 真零命中（E2）。两者都 fail-closed：
    // 「删那行作废判据」若零命中放行，会报成功而一字未删——比不做更坏。
    throw new Error(src.includes(oldText)
      ? `batch: edit anchor crosses the §${n} section boundary — it starts outside the section body or reaches the next §N header, and rewriting across it would break section location. Nothing was written.`
      : `batch: edit anchor not found — oldText must match the §${n} body exactly once, byte for byte (line endings included). Nothing was written. Re-read the section and pass its current text verbatim.`)
  }
  if (hits.length > 1) {
    const lines = hits.map((at) => src.slice(0, span.start + at).split("\n").length).join(", ")
    throw new Error(`batch: edit anchor is not unique — it matches ${hits.length} places inside §${n} (lines ${lines}). Extend the anchor until it matches once. Nothing was written.`)
  }
  const hit = hits[0]
  // 状态行只有一个写者（status）：锚**触及**该行 ∥ 替换**引入**一条 ⇒ 拒（否则一次 edit 就能伪造 status 的生命周期流转）。
  const spans = statusLineSpans(body)
  if (spans.some(([s, e]) => hit < e && hit + oldText.length > s)) throw new Error(EDIT_STATUS_LINE_ERROR)
  if (args.newText.split(/\r?\n/).some((line) => STATUS_LINE_RE.test(line))) throw new Error(EDIT_STATUS_LINE_ERROR)
  // 替换文本落盘取目标档的 EOL 形（`sanitizeText` 逐行处理后以 LF 相连；同 append 的 `insertIntoSection` 口径）。
  // 来源戳只有工具能盖（§4.7 不变量 5）⇒ `edit §3` 的 `newText` 同 append 丢伪造轮次戳行；其余段无戳可丢。
  const eol = src.includes("\r\n") ? "\r\n" : "\n"
  const replacement = sanitizeText(args.newText, n === 3).replaceAll("\n", eol)
  const newBody = body.slice(0, hit) + replacement + body.slice(hit + oldText.length)
  const postEdit = src.slice(0, span.start) + newBody + src.slice(span.end)
  // 文档机检门（§4.9 门 ④——**判集按命中类分两套**）：**段长类**（段落过长 · 行过长）判本次写入的文本 = `newText`
  // （一条早先就在的超长段不再拦本段的无关改动）；**锚类**（档缺 · 节缺 · 引缺）判**整档**——引用完整性是档级属性。
  // 「整档」= **改写后的**档（`recordView`）：#2021 的现场就是「那条死引文被这一次 edit 换掉」，拿改写前的盘上字节判，
  // 那一行永远过不去（本批要消的就是那个死锁）。REFUSED ⇒ 拒（零字节落盘）∥ ERROR ⇒ 写 + 回执明示。
  const gate = runBatchGate({ abs, cwd, agent, scope: "writer", pending: { section: n, body: replacement, recordView: postEdit } })
  if (gate?.state === "refused") throw new Error(gateRefusalMessage(gate, "edit"))
  writeFileSync(abs, postEdit)
  // #84：记账面按端注入（与 append 同一条缝——缺省 no-op = CLI 语义零行为变）。
  onWritten?.(agent, abs)
  return `batch: edited §${n} of the batch record — replaced ${oldText.length} characters with ${replacement.length}.${gateReceiptLine(gate)}`
}

/**
 * 批次档生命周期工具工厂（主名 `batch`——单工具五 action）。
 * @param {string|null} batchDoc — 绑定的目标档（spawn：`child._batchDoc`；评审：实例键；
 *   depth-0 主 agent 挂载时 = null——目标走 D-BR21 可选 path / 在飞扫描）
 * @param {{review?: boolean}} [opts] — review=true 表示"设计评审实例"形态（写 §3 + 工具盖戳）
 */
export function batchTool(batchDoc = null, { review = false } = {}) {
  return {
    name: "batch",
    description: DESC("batch"), // 模型可见文本 = tool-docs/batch.md
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create", "append", "edit", "status", "close"],
          description: "Which lifecycle step to run: create (new record) / append (add text to the END of your section) / edit — replace one anchored range inside YOUR OWN section (§1–§6 alike; your identity decides which section) / status (your section's status line) / close (freeze the record).",
        },
        path: {
          type: "string",
          description: "depth-0 only (D-BR21) — the batch record to operate on (若传则须可读). Omit it to target the unique in-flight record (0 or ≥2 in flight ⇒ refuse). Sub-agents and design reviews: do NOT pass path — your target record arrives via the spawn binding / the review instance key.",
        },
        segment: {
          type: "string",
          description: "append/edit/status only — the batch-record section you are writing (e.g. \"§4\"). Declares the section number only; your identity decides what is actually writable (main agent: append/edit §1/§4/§6 · status §1 (engineering) / append/edit §1/§2/§4/§5/§6 · status §1/§2/§5 (normal); eng-designer §2; eng-coder §5; normal-mode coder with a batchDoc binding §5; design review §3). edit reads the same whitelist as append — one table, two actions: the section you may append is the section you may rewrite in place.",
        },
        text: {
          type: "string",
          description: "append only — the markdown to append (verbatim — findings table + VERDICT + counts for a design review §3). Limit 20000 characters per call; longer content is refused — split it into multiple calls (each call becomes its own section, N continues).",
        },
        oldText: {
          type: "string",
          description: "edit only — oldText must match exactly once, byte for byte (line endings included), inside the section body; newText replaces that range, and an empty newText deletes it. Refused with nothing written: a blank oldText, zero hits, two or more hits (the matching lines are named), an anchor crossing the section boundary, and any anchor or replacement that touches or introduces a `**状态行**：` line (the status line has one writer: `status`).",
        },
        newText: {
          type: "string",
          description: "edit only — the replacement text for the anchored range; an empty string deletes the range. Credentials are stripped mechanically (same as append); a `## §N` heading line is refused (skeleton protection), and on §3 a `### 轮次 N（评审子代理）` line is dropped (the round stamp is tool-generated only).",
        },
        value: {
          type: "string",
          description: "status only — the new status-line value (single line; exactly one legal keyword of your section's STATUS_WORDS entry: §1 进行中/已收口 · §2 设计完成 · §3 评审通过 · §5 实施完成 — plus decoration only: surrounding symbols / a trailing ISO date / whitespace; prose goes to `note`).",
        },
        note: {
          type: "string",
          description: "status only — prose that lands as a parenthetical on the status line (`**状态行**：进行中（note）`). Single line; must carry no STATUS_WORDS keyword (those go in `value`) and no skeleton placeholders. Omit for a plain value. On the reopen path (a frozen record, §1 → 进行中) `note` is REQUIRED and lands verbatim in the §1 reopen record instead of the status-line parenthetical (it may name the frozen keyword there).",
        },
        topic: {
          type: "string",
          description: "create only — the batch subject word shared by the record header (keep the file name aligned with it).",
        },
        source: {
          type: "string",
          description: "create only — REQUIRED: the record's origin line (来源 = …; single line). It fills the header's 编制 line; without it the skeleton's placeholder would block the record's first append/status (topic-style fail-closed). Nothing is written when it is missing.",
        },
        ledger: {
          type: "string",
          description: "create only — optional: an existing ledger entry number to take over (e.g. \"#1830\"; a leading # is optional). Omit it and create opens a NEW ledger row in the same call (status 在途 · task_book = this record · trigger 归批) — but only when no unsettled row exists on the same face (board); otherwise create is refused and lists the candidates, and you pass either ledger:\"#<id>\" to take one over or newDebt:\"<why this is not one of them>\". Pass an archived / settled / foreign-owned row and create is refused. create and the ledger row are one action — there is no separate registration step.",
        },
        newDebt: {
          type: "string",
          description: "create only — optional: one line saying why this batch is a NEW debt rather than one of the unsettled rows already on the same face (board). Required only when you omit ledger while that face has unsettled rows; the reason lands in the new row's evidence and is quoted in this record's closeout receipt. Omit both ledger and newDebt while unsettled rows exist ⇒ create is refused with the candidate list.",
        },
        board: {
          type: "string",
          description: "create only — optional: the owning board for the header's 台账 line (e.g. \"core\"). Given, the opened/taken-over row is a requirement and carries this board; omitted, the row is a tech_todo and the header 括注 shows 「—」.",
        },
        date: {
          type: "string",
          description: "create only — the record date (YYYY-MM-DD); defaults to today.",
        },
        prev: {
          type: "string",
          description: "create only — the predecessor pointer line (前情); a leading `前情 = ` prefix is stripped automatically (idempotent — repeated prefixes included); defaults to 无（独立批）.",
        },
      },
      required: ["action"],
    },
    async execute(args, ctx) {
      const agent = ctx?.agent ?? {}
      const cwd = agent.cwd
      const bases = batchDocBases(cwd) // 歧义锚 ⇒ 候选项目基底并集（#828——create / 在飞 / 写门基底集同源）
      const onWritten = injectedOnWrite
      /** depth-0 目标定位（D-BR21）：path 传 ⇒ 可读性门；缺省 ⇒ 唯一在飞批（depth-0）/
       *  绑定解析（子代理/评审）。status/close 经此注入 lifecycle；append 自带同款分支。 */
      const pickTarget = (raw) => {
        const given = typeof raw === "string" && raw.trim() ? raw : null
        if (given) {
          if (review || ctx?.depth !== 0) {
            throw new Error("batch: path is a depth-0-only parameter (D-BR21) — your target record arrives via the spawn binding / the review instance key. Nothing was written.")
          }
          return resolveBatchDocPath(cwd, given)
        }
        if (!review && ctx?.depth === 0) return findInFlightBatch(cwd, bases)
        if (batchDoc) return resolveBatchDocPath(cwd, batchDoc)
        throw new Error("batch: no batch record is bound to this caller — the target arrives via the spawn binding / the review instance key / the depth-0 in-flight scan, and none is present. Nothing was written.")
      }
      switch (args?.action) {
        case "create":
          return createBatchRecord({ args, ctx, review, cwd, bases, onWritten })
        case "append":
          return appendBatchRecord({ args, ctx, review, batchDoc, onWritten })
        case "edit":
          return editBatchRecord({ args, ctx, review, batchDoc, onWritten })
        case "status":
          return statusBatchRecord({ args, ctx, review, pickTarget, onWritten })
        case "close":
          return closeBatchRecord({ args, ctx, review, pickTarget, onWritten })
        default:
          throw new Error(`batch: unknown action ${JSON.stringify(args?.action ?? null)} — pass one of create / append / edit / status / close.`)
      }
    },
  }
}
