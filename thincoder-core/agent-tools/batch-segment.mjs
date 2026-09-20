/**
 * agent-tools/batch-segment.mjs — 批次档段写入工具（ENGINEERING-MODE.md §2.20 · FR22 F1-F7）。
 *
 * 规则、守卫与 fail-closed 清单的**权威正文在 §2.20.1**（本文件不重述——D2 单一权威源）；
 * 实现要点（正文未定死、由代码承载）：
 *  - 身份判据 = 评审实例绑定（`review` 形态）/ `agent._role`；
 *  - append-only：在段尾（下一条 `## §N` 或 EOF）插入，既有行字节不变；
 *  - 来源戳 `### 轮次 N（评审子代理）`（仅 §3）——N = §3 内该形态行计数 + 1，**调用方自带**
 *    的同名标题行被丢弃（否则伪造戳会污染 N 计数——§2.20.8 #5）；
 *  - 凭证剥除：含凭证形态的行剥掉该子串，剥后为空则整行丢弃（「零命中」+「其余逐字保留」）；
 *  - 路径门禁：`resolveBatchDocPath`（评审侧「若传则须可读」）；工具内再查一次可读性。
 *  - v2 增量（ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md §2.1）：§1 状态行解析
 *    （`readBatchStatusLine`——「已收口」→ 冻结拒写、「进行中」→ 放行、缺失/不可解析 →
 *    fail-closed 拒）；`resolveBatchDocPath` 加 manifest `docRoot.batches` 双基底
 *    （值形态 = 串 | 多根数组——逐基底按序复判；manifest 缺失/非法/读错 → v1 单基底
 *    语义零变）；冻结只覆盖 `batch_segment` 通道（§2.5）。
 *
 * 导出面：`batchSegmentTool` · `resolveBatchDocPath` · `batchDocForReview`（异步评审实例键取绑定）·
 * `configureBatchSegment` / `resetBatchSegment`（#84 记账面注入缝——缺省 no-op，见下）。
 *
 * #84 记账面（CORE-UNIFICATION §2.13.4）：写入成功后的记账（把绑定档记入调用者写域）
 * **按端注入**（形态参 §2.13.5 注入缝）——核内缺省 no-op = CLI 语义零行为变；端装配
 * 经 `configureBatchSegment({ onWrite })` 覆盖（VSC 侧现形 = `_touchedFiles` 记账）。
 */
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { docRootPaths, readManifest } from "../manifest.mjs"

/** text 单次上限（§2.20.1——超出引导分段追加，不承诺"不新盖戳"）。 */
export const MAX_TEXT_CHARS = 20000
/** 身份 → 可写段号（§2.20.1 段白名单）。 */
export const SEGMENT_BY_ROLE = { "eng-designer": 2, "eng-coder": 5 }
/** 工具写入的轮次节标题形态（N 计数口径 = 该形态行；`### 轮次与发现（…）` 骨架行不匹配）。 */
const ROUND_HEADING_RE = /^### 轮次 \d+（评审子代理）/
/** 段标题定位（`## §N` 独立标题——`## §20` 不误命中 §2）。 */
const sectionHeaderRe = (seg) => new RegExp(`^## §${seg}(?=\\s|$)`, "m")
/** 凭证形态（§2.7 冒号态）：`[DESIGN-TOKEN:…]` 与 `designId: …`——本节自有正则。 */
const CRED_RE = /\[DESIGN-TOKEN:[^\]]*\]|designId\s*:\s*\S+/g
const CRED_TEST_RE = /\[DESIGN-TOKEN:[^\]]*\]|designId\s*:\s*\S+/
/** §1 状态行前缀（`**状态行**：` 独立行——表格行 / 块引用行不命中；判定只认关键字）。 */
const STATUS_LINE_RE = /^\s*\*\*状态行\*\*[：:]\s*(.*)$/

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

/** 可读文件判据（存在且为文件——目录/缺失同判不可读）。 */
function readableFile(abs) {
  try { return existsSync(abs) && statSync(abs).isFile() } catch { return false }
}

/**
 * 批次档路径门禁（评审侧 §2.20.2 口径 = **「若传则须可读」**）：空/非字符串/不可读 → throw。
 * 非空且可读 → 返回绝对路径（`\` 归一——照 `files`/`batchDoc` spawn 门先例）。
 * v2：cwd 不可读 → manifest `docRoot.batches` 复判（M3 模块设计 §2.1#4——N3 可迁移；
 * 值形态 = 串 | 多根数组——逐基底按序复判，首个可读者胜）。
 */
export function resolveBatchDocPath(cwd, given) {
  const base = cwd ?? process.cwd()
  const raw = typeof given === "string" ? given.trim() : ""
  if (!raw) {
    throw new Error("batchDoc must be a non-empty path to the batch record — pass the batch record currently in flight, or omit the parameter entirely when no batch record is in flight.")
  }
  const abs = resolve(base, raw.replace(/\\/g, "/"))
  if (readableFile(abs)) return abs
  // 双基底（M3 模块设计 §2.1#4）：cwd 不可读 → manifest docRoot.batches 复判（逐基底按序，
  // 首个可读者胜）；manifest 缺失 / 非法 / 读错 → 无第二基底（v1 单基底语义零变），
  // 全不可读 → throw。
  let man = { ok: false }
  try { man = readManifest(base) } catch { /* 权限等读错——按无 manifest 处理（v1 语义） */ }
  if (man.ok) {
    for (const root of docRootPaths(man.manifest?.docRoot?.batches, base)) {
      const alt = resolve(root, raw.replace(/\\/g, "/"))
      if (readableFile(alt)) return alt
    }
  }
  throw new Error(`batchDoc is not a readable file: ${raw} — pass the path of the batch record currently in flight (a path that resolves to an existing file), or omit the parameter when no batch record is in flight.`)
}

/**
 * §1 状态行解析（内部——M3 模块设计 §2.1#1）：解析对象 = §1 段内 `**状态行**：` 前缀行
 * （§1 边界 = `## §1` 标题到下一 `## §` 标题；其他段内「状态行」字样不参与判定）。
 * 判定只认关键字（emoji / 括号装饰 / 日期后缀容忍）：含「已收口」→ "closed"（冻结优先）、
 * 含「进行中」→ "open"；无 §1 / 无该行 / 两关键字皆不命中 → "unknown"（fail-closed 视为冻结）。
 */
function readBatchStatusLine(src) {
  const s1 = /^## §1(?=\s|$)/m.exec(src)
  if (!s1) return "unknown"
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = s1.index + s1[0].length
  const next = nextRe.exec(src)
  const body = src.slice(s1.index + s1[0].length, next ? next.index : src.length)
  const m = body.split("\n").map((line) => STATUS_LINE_RE.exec(line)).find(Boolean)
  if (!m) return "unknown"
  const value = m[1].trim()
  if (value.includes("已收口")) return "closed"
  if (value.includes("进行中")) return "open"
  return "unknown"
}

/**
 * 设计评审的实例绑定解析（§2.20.2/§2.20.3——batch_segment 的唯一路径来源）：
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

/** 段号解析：`§2` / `2` / `§2 批次任务` 均可；无法解析 → null。 */
function segmentNumber(raw) {
  const m = /^§?\s*(\d+)/.exec(String(raw ?? "").trim())
  return m ? Number(m[1]) : null
}

/** 身份 → 可写段号；无写权身份 → null。评审实例绑定优先（评审者的身份即"设计评审"。） */
function allowedSegment(agent, review) {
  if (review) return 3
  return SEGMENT_BY_ROLE[agent?._role] ?? null
}

/**
 * 凭证剥除 + 伪造轮次标题丢弃（§2.20.1 F6/AC30/AC34）。
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

/** §3 内工具写入的轮次行计数（N = 计数 + 1；收窄口径——只数工具戳形态）。 */
function roundCount(src, headerMatch, endIdx) {
  const body = src.slice(headerMatch.index + headerMatch[0].length, endIdx)
  return body.split("\n").filter((l) => ROUND_HEADING_RE.test(l)).length
}

/** 段尾定位 + 插入（append-only：只在段尾插入，既有字节不变；返回新全文 + 本轮 N）。 */
function insertIntoSection(src, seg, text) {
  const hdr = sectionHeaderRe(seg).exec(src)
  if (!hdr) {
    throw new Error(`batch_segment: the bound batch record has no "## §${seg}" section header — the six-section skeleton is written by the record's creator before any segment write. Fix: ask the parent/creator to add the "## §${seg} …" heading (with the template's sub-headings) first, then call batch_segment again. Nothing was written.`)
  }
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = hdr.index + hdr[0].length
  const next = nextRe.exec(src)
  const endIdx = next ? next.index : src.length
  // 来源戳（仅 §3）：工具生成标题 + N——调用方写不进自己的标题（sanitize 已丢弃同名行）。
  const roundN = seg === 3 ? roundCount(src, hdr, endIdx) + 1 : 0
  const payload = (seg === 3 ? `### 轮次 ${roundN}（评审子代理）\n\n` : "") + text
  const before = src.slice(0, endIdx)
  const after = src.slice(endIdx)
  const eol = src.includes("\r\n") ? "\r\n" : "\n"
  const lead = before === "" ? "" : before.endsWith(eol + eol) ? "" : before.endsWith(eol) ? eol : eol + eol
  // 尾随 eol 恒加（块自成行）；后面还有段标题时再补一个空行（保持模板的空行分隔）。
  const written = before + lead + payload.replaceAll("\n", eol) + eol + (after === "" ? "" : eol) + after
  return { written, roundN }
}

/**
 * 批次档段写入工具工厂。
 * @param {string|null} batchDoc — 绑定的目标档（spawn：`child._batchDoc`；评审：实例键）
 * @param {{review?: boolean}} [opts] — review=true 表示"设计评审实例"形态（写 §3 + 工具盖戳）
 */
export function batchSegmentTool(batchDoc = null, { review = false } = {}) {
  const own = review ? "§3" : null
  return {
    name: "batch_segment",
    description:
      "Append your own section of the batch record (一段一作者). " +
      "There is NO path parameter: the target record is bound to you (at spawn for eng-designer/eng-coder, per review instance for a design review) and your identity fixes the section you may write " +
      "(eng-designer → §2, design review → §3, eng-coder → §5) — a write outside your own section is refused. " +
      "Append-only: the text lands at the end of your section; existing lines are never rewritten or deleted. " +
      "Credential values are stripped mechanically before writing (never write a token or designId value). " +
      "A design review's append is stamped by the tool with a `### 轮次 N（评审子代理）` heading — N is tool-counted; do not write your own heading (it would be dropped). " +
      "Failures are hard and visible (no silent fallback): if the write is refused or fails, say so in your report — “§× 未写入”.",
    parameters: {
      type: "object",
      properties: {
        segment: {
          type: "string",
          description: `The batch-record section you are writing${own ? ` — yours is ${own}` : ""}. Declares the section number only; your identity decides what is actually writable.`,
        },
        text: {
          type: "string",
          description: "The markdown to append (verbatim — findings table + VERDICT + counts for a design review §3). Limit 20000 characters per call; longer content is refused — split it into multiple calls (each call becomes its own section, N continues).",
        },
      },
      required: ["segment", "text"],
    },
    async execute(args, ctx) {
      const agent = ctx?.agent ?? {}
      const seg = allowedSegment(agent, review)
      if (seg === null) {
        throw new Error("batch_segment: no segment is writable by this caller — the channel exists for eng-designer (§2), eng-coder (§5) and design reviews bound to a batch record (§3); the parent agent writes §1/§4/§6 through ordinary document writes.")
      }
      const n = segmentNumber(args?.segment)
      if (n === null) {
        throw new Error(`batch_segment: unknown segment ${JSON.stringify(args?.segment ?? null)} — pass the section number you write (e.g. "§${seg}").`)
      }
      if (n !== seg) {
        throw new Error(`batch_segment: §${n} is not yours to write — this caller writes §${seg} only (一段一作者: eng-designer → §2, design review → §3, eng-coder → §5).`)
      }
      if (!batchDoc) {
        throw new Error("batch_segment: no batch record is bound to this caller — there is no path parameter by design (the target arrives via the spawn binding / the review instance key). Report the section as not written.")
      }
      const abs = resolveBatchDocPath(agent.cwd ?? process.cwd(), batchDoc)
      const src = readFileSync(abs, "utf8")
      const status = readBatchStatusLine(src)
      if (status === "closed") {
        throw new Error("batch_segment: 已收口档不回改 — the bound batch record's §1 status line contains 「已收口」, so the record is frozen: its body is never written to again (整档冻结；改 = 新批新档). Nothing was written. Report the section as not written.")
      }
      if (status === "unknown") {
        throw new Error("batch_segment: 状态行不可解析或缺失 — the bound batch record has no §1 `**状态行**：` line whose value contains 已收口 or 进行中 (fail-closed: the write is refused as if frozen). Ask the record's creator to set the §1 status line, then call again. Nothing was written.")
      }
      if (typeof args?.text !== "string") {
        throw new Error("batch_segment: text must be a string (the markdown to append).")
      }
      if (args.text.length > MAX_TEXT_CHARS) {
        throw new Error(`batch_segment: text is ${args.text.length} characters — the limit is ${MAX_TEXT_CHARS} per call. Split it into multiple calls: each call becomes its own section and the round number N continues (分段追加——每次调用各成节、N 顺延).`)
      }
      if (/^## §\d/m.test(args.text)) {
        throw new Error("batch_segment: the text contains a section header line matching `^## §N` — that would break section location and the append-only guarantee. Rewrite it (escape the heading, or drop the leading `## §N`), then call again (骨架保护). Nothing was written.")
      }
      const body = sanitizeText(args.text, seg === 3).replace(/^\n+/, "").replace(/\s+$/, "")
      if (!body.trim()) {
        throw new Error("batch_segment: nothing to append — the text is empty after credential stripping (credential values never reach the record).")
      }
      const { written, roundN } = insertIntoSection(src, seg, body)
      writeFileSync(abs, written)
      // #84（S1 续轮第二批——VSC 侧并入 ④）：记账面**按端注入**（缺省 no-op = CLI 语义
      // 零行为变——端装配经 configureBatchSegment 覆盖；VSC 侧现形 = 把绑定档记入调用者
      // 写域 `_touchedFiles`）。核内不内建记账（设计裁定形态——CORE-UNIFICATION §2.13.4 #84
      // 「记账面按端注入」）。
      injectedOnWrite?.(agent, abs)
      return `batch_segment: appended ${body.length} characters to §${seg} of the batch record${roundN ? ` (### 轮次 ${roundN}（评审子代理）)` : ""}.`
    },
  }
}
