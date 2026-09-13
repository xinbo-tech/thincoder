/**
 * agent-tools/batch-segment.mjs — 批次档段写入工具（ENGINEERING-MODE.md §2.20 · FR22 F1-F7
 * ——第 5 批 VSC 镜像，§2.22.5）。契约与 CLI 同名档同源（工具本体逐步移植）：
 *  - 无 `path` 参数——目标档由「spawn 绑定（`child._batchDoc`）/ 评审实例键」提供；
 *  - 段白名单按调用者身份：eng-designer → §2 · 设计评审实例 → §3 · eng-coder → §5；
 *  - append-only（在段尾插入，既有行字节不变）；
 *  - 来源戳 `### 轮次 N（评审子代理）` **仅 §3**：N = §3 内该形态行计数 + 1，调用方自带的
 *    同名标题行被丢弃（否则伪造戳会污染 N 计数）；
 *  - 凭证剥除用**本档自有正则**（`[DESIGN-TOKEN:…]` 与 `designId: …` 冒号态——不复用 §2.7
 *    巡检正则：后者要求参数名后接空白，匹配不到冒号形态）；剥后为空则整行丢弃；
 *  - fail-closed 六条：无写权身份 / 未知或越段 / 未绑定 / 绑定档不可读 / text 非字符串或
 *    >20000 / text 含 `^## §N`（骨架保护）。
 *
 * 与 CLI 的差异（§2.22.5 适配点②）：评审实例绑定**不在本文件解析**——VSC 的 runAdvisorReview
 * 多一个 `rv` 实例参数，batchDoc 沿 `rv.batchDoc`（异步）/ 调用点 callbacks.batchDoc（同步）
 * 到 `advisorToolsFor(agent, reviewType, batchDoc)`，工具由工厂直接持有路径（无 `batchDocForReview`
 * 池内查找——本地无该消费面）。
 *
 * 导出面：`batchSegmentTool` · `resolveBatchDocPath` · `MAX_TEXT_CHARS` · `SEGMENT_BY_ROLE`。
 */
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

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

/** 可读文件判据（存在且为文件——目录/缺失同判不可读）。 */
function readableFile(abs) {
  try { return existsSync(abs) && statSync(abs).isFile() } catch { return false }
}

/**
 * 批次档路径门禁（评审侧 §2.20.2 口径 = **「若传则须可读」**）：空/非字符串/不可读 → throw。
 * 非空且可读 → 返回绝对路径（`\` 归一——照 `files`/`batchDoc` spawn 门先例）。
 */
export function resolveBatchDocPath(cwd, given) {
  const raw = typeof given === "string" ? given.trim() : ""
  if (!raw) {
    throw new Error("batchDoc must be a non-empty path to the batch record (ENGINEERING-MODE.md §2.20.2) — pass the batch record currently in flight, or omit the parameter entirely when no batch record is in flight.")
  }
  const abs = resolve(cwd ?? process.cwd(), raw.replace(/\\/g, "/"))
  if (!readableFile(abs)) {
    throw new Error(`batchDoc is not a readable file: ${raw} — pass the path of the batch record currently in flight (a path that resolves to an existing file), or omit the parameter when no batch record is in flight.`)
  }
  return abs
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
    throw new Error(`batch_segment: the bound batch record has no "## §${seg}" section header — the six-section skeleton is written by the record's creator before any segment write (§1.12). Fix: ask the parent/creator to add the "## §${seg} …" heading (with the template's sub-headings) first, then call batch_segment again. Nothing was written.`)
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
      "Append your own section of the batch record (ENGINEERING-MODE.md §2.20 — 一段一作者). " +
      "There is NO path parameter: the target record is bound to you (at spawn for eng-designer/eng-coder, per review instance for a design review) and your identity fixes the section you may write " +
      "(eng-designer → §2, design review → §3, eng-coder → §5) — a write outside your own section is refused. " +
      "Append-only: the text lands at the end of your section; existing lines are never rewritten or deleted. " +
      "Credential values are stripped mechanically before writing (never write a token or designId value — §2.7). " +
      "A design review's append is stamped by the tool with a `### 轮次 N（评审子代理）` heading — N is tool-counted; do not write your own heading (it would be dropped). " +
      "Failures are hard and visible (no silent fallback): if the write is refused or fails, say so in your report — “§× 未写入”.",
    parameters: {
      type: "object",
      properties: {
        segment: {
          type: "string",
          description: `The batch-record section you are writing${own ? ` — yours is ${own}` : ""}. Declares the section number only; your identity decides what is actually writable (§2.20.1).`,
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
        throw new Error("batch_segment: no segment is writable by this caller — the channel exists for eng-designer (§2), eng-coder (§5) and design reviews bound to a batch record (§3); the parent agent writes §1/§4/§6 through ordinary document writes (ENGINEERING-MODE.md §2.20.1/§2.20.3).")
      }
      const n = segmentNumber(args?.segment)
      if (n === null) {
        throw new Error(`batch_segment: unknown segment ${JSON.stringify(args?.segment ?? null)} — pass the section number you write (e.g. "§${seg}").`)
      }
      if (n !== seg) {
        throw new Error(`batch_segment: §${n} is not yours to write — this caller writes §${seg} only (一段一作者: eng-designer → §2, design review → §3, eng-coder → §5; ENGINEERING-MODE.md §2.20.1).`)
      }
      if (!batchDoc) {
        throw new Error("batch_segment: no batch record is bound to this caller — there is no path parameter by design (the target arrives via the spawn binding / the review instance key, ENGINEERING-MODE.md §2.20.2). Report the section as not written.")
      }
      const abs = resolve(agent.cwd ?? process.cwd(), String(batchDoc).replace(/\\/g, "/"))
      if (!readableFile(abs)) {
        throw new Error(`batch_segment: the bound batch record is not a readable file: ${abs} — nothing was written (§2.20.1 fail-closed). Check the record still exists, then report the section as not written.`)
      }
      if (typeof args?.text !== "string") {
        throw new Error("batch_segment: text must be a string (the markdown to append).")
      }
      if (args.text.length > MAX_TEXT_CHARS) {
        throw new Error(`batch_segment: text is ${args.text.length} characters — the limit is ${MAX_TEXT_CHARS} per call. Split it into multiple calls: each call becomes its own section and the round number N continues (分段追加——每次调用各成节、N 顺延; ENGINEERING-MODE.md §2.20.1).`)
      }
      if (/^## §\d/m.test(args.text)) {
        throw new Error("batch_segment: the text contains a section header line matching `^## §N` — that would break section location and the append-only guarantee. Rewrite it (escape the heading, or drop the leading `## §N`), then call again (§2.20.1 骨架保护). Nothing was written.")
      }
      const body = sanitizeText(args.text, seg === 3).replace(/^\n+/, "").replace(/\s+$/, "")
      if (!body.trim()) {
        throw new Error("batch_segment: nothing to append — the text is empty after credential stripping (credential values never reach the record; ENGINEERING-MODE.md §2.7/§2.20.1).")
      }
      const src = readFileSync(abs, "utf8")
      const { written, roundN } = insertIntoSection(src, seg, body)
      writeFileSync(abs, written)
      // B3 契约 3（群 B 批 §17.2 E-扩 3——F31(c)）：写入成功即把绑定档记入调用者写域——
      // 子代理完成点经 mergeChildMutations 合入父侧变更事件（在途设计评审的 stale 判定
      // 覆盖批次档面）；Array.isArray 守卫（评审实例面 agent 可能未挂 _touchedFiles）。
      if (Array.isArray(agent._touchedFiles) && !agent._touchedFiles.includes(abs)) agent._touchedFiles.push(abs)
      return `batch_segment: appended ${body.length} characters to §${seg} of the batch record${roundN ? ` (### 轮次 ${roundN}（评审子代理）)` : ""}.`
    },
  }
}
