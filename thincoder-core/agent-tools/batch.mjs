/**
 * agent-tools/batch.mjs — 批次档生命周期工具（KD-4 拆分主档：action 分发 + append 迁移面 +
 * 路径解析单源 + #84 记账缝）。
 *
 * 单工具 `batch`，action = create（建档，§4.11）/ append（段写入——原 batch-segment.mjs 语义
 * 逐字迁移，§4.1 全表）/ status（段属主状态行流转，§4.12）/ close（收口冻结，§4.13）。
 * 权威规格 = `docs/core/design/BATCH-RECORD.md` §4（契约/挂载/用例 BR-1–26/骨架 §4.10/
 * 参数面 §4.11–§4.13/别名 §4.14）；骨架与判定字面单源 = `batch-skeleton.mjs`；lifecycle 面 =
 * `batch-lifecycle.mjs`。**依赖单向（KD-4）：skeleton ← lifecycle ← 主档**。
 *
 * 身份判据（D-BR17/D-BR18/D-BR21）：主 agent 调用 ctx 带 `depth === 0`（dispatch 装配）；
 * eng 子代理 `depth > 0`（`agent._role` 定段）；评审实例 ctx 无 depth 但工具以 `review: true`
 * 绑定。create/close 仅 depth-0 放行；depth-0 的 append/status/close 可选 `path`（D-BR21：
 * 缺省 = findInFlightBatch 取唯一在飞批，0/复数 ⇒ throw）；子代理/评审传 path ⇒ 拒（目标 =
 * spawn/实例注入，语法上写不到别处——运行期门拒）。append 段白名单：depth-0 → §1/§4/§6 ·
 * eng-designer → §2 · 评审 → §3 · eng-coder → §5；status 写域 = 调用者自己段（主 agent 仅 §1
 * ——轮 2 #3 裁定②）。append 迁移面错误串**逐字保持 "batch_segment:" 前缀**（§4.1 全表锚断言）；
 * "batch:" 前缀 = 本批新增错误面（create/close/status/findInFlight/path 门/dispatch）。
 *
 * 导出面：`batchTool`（主名）· `batchSegmentTool`（**过渡别名**——name 仍 "batch_segment"，
 * schema 仅 {segment,text}、描述逐字，execute ⇒ append 同一执行体；撤除判据 = BATCH-RECORD
 * §4.14）· `resolveBatchDocPath` · `batchDocBases` · `batchDocForReview` ·
 * `configureBatchSegment` / `resetBatchSegment`（#84 记账缝——契约名不变，AC-11 零改）·
 * `MAX_TEXT_CHARS` · `SEGMENT_BY_ROLE`（re-export——shim 导出全超集需要）。
 *
 * #84 记账面（CORE-UNIFICATION §2.13.4）：写入成功后的记账**按端注入**——核内缺省 no-op = CLI
 * 语义零行为变；端装配经 `configureBatchSegment({ onWrite })` 覆盖（VSC 侧现形 = `_touchedFiles`
 * 记账）。核内零端名分支（契约 5——只认 `onWrite` 函数名）。
 */
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { docRootBase, docRootPaths, readManifest } from "../manifest.mjs"
import { SEGMENT_BY_ROLE, readBatchStatusLine, sectionHeaderRe, findPlaceholderResidue, placeholderResidueError } from "./batch-skeleton.mjs"
import { closeBatchRecord, createBatchRecord, findInFlightBatch, statusBatchRecord } from "./batch-lifecycle.mjs"

export { SEGMENT_BY_ROLE }

/** text 单次上限（BATCH-RECORD.md §4.1——超出引导分段追加，不承诺"不新盖戳"）。append 迁移域私有区常量
 *  （随执行体自 batch-segment.mjs 迁入——骨架档只住骨架/状态行单源，lifecycle 档头枚举口径）；
 *  export = shim 导出全超集（旧 `batch-segment.mjs` 导出面等价保持）。 */
export const MAX_TEXT_CHARS = 20000
/** 工具写入的轮次节标题形态（N 计数口径 = 该形态行；`### 轮次与发现（…）` 骨架行不匹配）。 */
const ROUND_HEADING_RE = /^### 轮次 \d+（评审子代理）/
/** 凭证形态（§2.7 冒号态）：`[DESIGN-TOKEN:…]` 与 `designId: …`——本节自有正则。 */
const CRED_RE = /\[DESIGN-TOKEN:[^\]]*\]|designId\s*:\s*\S+/g
const CRED_TEST_RE = /\[DESIGN-TOKEN:[^\]]*\]|designId\s*:\s*\S+/

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

/** 可读文件判据（存在且为文件——目录/缺失同判不可读；与 lifecycle 档同名 helper 同型——
 *  KD-4 单向依赖下各自持有，三行谓词不构成第二权威源）。 */
function readableFile(abs) {
  try { return existsSync(abs) && statSync(abs).isFile() } catch { return false }
}

/**
 * 批次档路径门禁（评审侧 BATCH-RECORD.md §4.2 口径 = **「若传则须可读」**）：空/非字符串/不可读 → throw。
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
 * 批次档基底根数组（**声明面单源**——轮 2 裁定：create 相对基底 / depth-0 在飞扫描共用，
 * 不写死 `docs/batches`）：manifest `docRoot.batches`（串 | 多根数组）→ `docRootPaths`
 * 归一去重（相对基底按项目根解析）；manifest 缺失/非法/读错 → 回退默认基底 `"docs/batches"`
 * （v1 单基底语义零变）。恒返回非空数组（create 的 bases[0] / findInFlightBatch 扫描面消费）。
 * @param {string} cwd
 * @returns {string[]}
 */
export function batchDocBases(cwd) {
  const base = cwd ?? process.cwd()
  let man = { ok: false }
  try { man = readManifest(base) } catch { /* 读错 → 按无 manifest 处理（回退默认基底） */ }
  const roots = man.ok ? docRootPaths(man.manifest?.docRoot?.batches, base) : []
  return roots.length ? roots : [resolve(docRootBase(base), "docs/batches")]
}

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
 *  depth-0 的段白名单（append = §1/§4/§6）由 appendBatchRecord 分支，不经本表。 */
function allowedSegment(agent, review) {
  if (review) return 3
  return SEGMENT_BY_ROLE[agent?._role] ?? null
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
 * append 执行体（action=append——原 batch_segment execute 迁移 + depth-0 分支）：
 *  - 段白名单：depth-0 → §1/§4/§6（新错误面，"batch:" 前缀）；eng-designer → §2 · 评审 → §3 ·
 *    eng-coder → §5（迁移错误面，"batch_segment:" 前缀**逐字保持**）；
 *  - 目标定位（D-BR21）：depth-0 path 可选（缺省 = findInFlightBatch 唯一在飞批）；子代理/评审
 *    传 path ⇒ 拒，目标 = spawn/实例绑定；
 *  - 其余（gate / text 校验 / 剥凭证 / 骨架保护 / **死占位机检（F11-C）** / 插入 / 记账 / 回执）逐字保持原语义。
 */
function appendBatchRecord({ args, ctx, review, batchDoc, onWritten }) {
  const agent = ctx?.agent ?? {}
  const cwd = agent.cwd ?? process.cwd()
  const depth0 = ctx?.depth === 0
  const seg = allowedSegment(agent, review)
  if (!depth0 && seg === null) {
    throw new Error("batch_segment: no segment is writable by this caller — the channel exists for eng-designer (§2), eng-coder (§5) and design reviews bound to a batch record (§3); the parent agent writes §1/§4/§6 through ordinary document writes.")
  }
  const n = segmentNumber(args?.segment)
  if (n === null) {
    if (depth0) {
      throw new Error(`batch: unknown segment ${JSON.stringify(args?.segment ?? null)} — depth-0 append writes §1/§4/§6 of the in-flight record (pass the section number you write, e.g. "§4").`)
    }
    throw new Error(`batch_segment: unknown segment ${JSON.stringify(args?.segment ?? null)} — pass the section number you write (e.g. "§${seg}").`)
  }
  if (depth0) {
    if (n !== 1 && n !== 4 && n !== 6) {
      throw new Error(`batch: §${n} is not yours to write — depth-0 append writes §1/§4/§6 only (一段一作者: §2 = eng-designer, §3 = design review, §5 = eng-coder).`)
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
    abs = findInFlightBatch(cwd, batchDocBases(cwd))
  } else {
    if (!batchDoc) {
      throw new Error("batch_segment: no batch record is bound to this caller — there is no path parameter by design (the target arrives via the spawn binding / the review instance key). Report the section as not written.")
    }
    abs = resolveBatchDocPath(cwd, batchDoc)
  }
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
  const body = sanitizeText(args.text, n === 3).replace(/^\n+/, "").replace(/\s+$/, "")
  if (!body.trim()) {
    throw new Error("batch_segment: nothing to append — the text is empty after credential stripping (credential values never reach the record).")
  }
  // F11-C（挂点：gate / text 校验后 · insertIntoSection 前）：档头 + 目标段死占位残留 ⇒ 拒
  // （他段占位不拦——一段一作者；骨架枚举单源 = skeleton 档 TEMPLATE_PLACEHOLDERS）。
  const residues = findPlaceholderResidue(src, n)
  if (residues.length) throw new Error(placeholderResidueError(residues))
  const { written, roundN } = insertIntoSection(src, n, body)
  writeFileSync(abs, written)
  // #84：记账面按端注入（缺省 no-op = CLI 语义零行为变——端装配经 configureBatchSegment 覆盖）。
  onWritten?.(agent, abs)
  return `batch_segment: appended ${body.length} characters to §${n} of the batch record${roundN ? ` (### 轮次 ${roundN}（评审子代理）)` : ""}.`
}

/**
 * 批次档生命周期工具工厂（主名 `batch`——单工具四 action）。
 * @param {string|null} batchDoc — 绑定的目标档（spawn：`child._batchDoc`；评审：实例键；
 *   depth-0 主 agent 挂载时 = null——目标走 D-BR21 可选 path / 在飞扫描）
 * @param {{review?: boolean}} [opts] — review=true 表示"设计评审实例"形态（写 §3 + 工具盖戳）
 */
export function batchTool(batchDoc = null, { review = false } = {}) {
  return {
    name: "batch",
    description:
      "Batch-record lifecycle tool (一段一作者 — six append-only sections, one author each). " +
      "actions: create (depth-0 only — write a new six-section skeleton record; pass path + topic + source) · " +
      "append (add text to the END of YOUR section — existing lines are never rewritten or deleted) · " +
      "status (update YOUR section's `**状态行**：` line — the value must carry exactly ONE legal keyword of your section's STATUS_WORDS entry, decorated only by surrounding symbols / a trailing ISO date / whitespace; prose goes to the separate `note` field, which lands as a parenthetical) · " +
      "close (depth-0 only — freeze the record: §1 → 「已收口 <date>」, every further write is refused). " +
      "Identity fixes what you may write (段白名单): main agent (depth 0) — append §1/§4/§6, status §1 only, create/close; eng-designer — §2; eng-coder — §5; design review (review binding) — §3. A write outside your own section is refused. " +
      "Skeleton placeholders (dead literals — `#<编号>` / `<板块>` and the older `<BATCH-ID>` / `<讨论来源>`) in the record header or in your target section block append/status: fill them first (the main agent fills the header right after create); `<§N 模板占位：…>` template lines are legal and never blocked. " +
      "Target record: sub-agents and design reviews have NO path parameter in practice — the record arrives via the spawn binding / the review instance key (passing path is refused); depth-0 MAY pass path (若传则须可读), omitting it picks the unique in-flight record (0 or ≥2 in flight ⇒ refuse — pass path). " +
      "A design review's append is stamped by the tool with a `### 轮次 N（评审子代理）` heading — N is tool-counted; do not write your own heading (it would be dropped). " +
      "Credential values are stripped mechanically before writing (never write a token or designId value). " +
      "Failures are hard and visible (no silent fallback): if a write is refused or fails, say so in your report — “§× 未写入”.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create", "append", "status", "close"],
          description: "Which lifecycle step to run: create (new record) / append (your section) / status (your section's status line) / close (freeze the record).",
        },
        path: {
          type: "string",
          description: "depth-0 only (D-BR21) — the batch record to operate on (若传则须可读). Omit it to target the unique in-flight record (0 or ≥2 in flight ⇒ refuse). Sub-agents and design reviews: do NOT pass path — your target record arrives via the spawn binding / the review instance key.",
        },
        segment: {
          type: "string",
          description: "append/status only — the batch-record section you are writing (e.g. \"§4\"). Declares the section number only; your identity decides what is actually writable (main agent: append §1/§4/§6 · status §1; eng-designer §2; design review §3; eng-coder §5).",
        },
        text: {
          type: "string",
          description: "append only — the markdown to append (verbatim — findings table + VERDICT + counts for a design review §3). Limit 20000 characters per call; longer content is refused — split it into multiple calls (each call becomes its own section, N continues).",
        },
        value: {
          type: "string",
          description: "status only — the new status-line value (single line; exactly one legal keyword of your section's STATUS_WORDS entry: §1 进行中/已收口 · §2 设计完成 · §3 评审完成 · §5 实施完成 — plus decoration only: surrounding symbols / a trailing ISO date / whitespace; prose goes to `note`).",
        },
        note: {
          type: "string",
          description: "status only — prose that lands as a parenthetical on the status line (`**状态行**：进行中（note）`). Single line; must carry no STATUS_WORDS keyword (those go in `value`) and no skeleton placeholders. Omit for a plain value.",
        },
        topic: {
          type: "string",
          description: "create only — the batch subject word shared by the record header (keep the file name aligned with it).",
        },
        source: {
          type: "string",
          description: "create only — REQUIRED: the record's origin line (来源 = …; single line). It fills the header's 编制 line; without it the skeleton's placeholder would block the record's first append/status (topic-style fail-closed). Nothing is written when it is missing.",
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
      const cwd = agent.cwd ?? process.cwd()
      const bases = batchDocBases(cwd)
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
        case "status":
          return statusBatchRecord({ args, ctx, review, pickTarget, onWritten })
        case "close":
          return closeBatchRecord({ args, ctx, review, pickTarget, onWritten })
        default:
          throw new Error(`batch: unknown action ${JSON.stringify(args?.action ?? null)} — pass one of create / append / status / close.`)
      }
    },
  }
}

/**
 * 过渡别名（BATCH-RECORD §4.14——撤除判据见该节）：name 仍 "batch_segment"、schema 仅
 * {segment, text}、描述**逐字**保持原 batch-segment.mjs 基准；execute ⇒ append（同一执行体，
 * 行为等价——AC-2/AC-9）。生产挂载面已全切主名 `batch`（BATCH-RECORD §4.3）；本工厂仅供
 * 过渡 shim 导出面（旧测试 / VSC 侧 import 消费）与撤除判据实跑使用。
 * @param {string|null} batchDoc — 绑定的目标档（spawn：`child._batchDoc`；评审：实例键）
 * @param {{review?: boolean}} [opts] — review=true 表示"设计评审实例"形态（写 §3 + 工具盖戳）
 */
export function batchSegmentTool(batchDoc = null, { review = false } = {}) {
  const tool = batchTool(batchDoc, { review })
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
      return tool.execute({ action: "append", segment: args?.segment, text: args?.text }, ctx)
    },
  }
}
