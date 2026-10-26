/**
 * agent-tools/batch-lifecycle.mjs — 批次档生命周期 action 面（KD-4 拆分中段）。
 *
 * create（建档，§4.11）/ status（段属主状态行流转，§4.12）/ close（收口冻结，§4.13）+
 * depth-0 在飞批定位（findInFlightBatch——D-BR21）。判定字面全部单源自 batch-skeleton.mjs
 * （SEGMENT_BY_ROLE / STATUS_WORDS / STATUS_LINE_RE / readBatchStatusLine / sectionHeaderRe /
 * batchSkeleton / TEMPLATE_PLACEHOLDERS / findPlaceholderResidue / placeholderResidueError）；
 * 路径解析单源（`resolveBatchDocPath` / `batchDocBases` / `resolveBatchCreatePath`——住 `batch-paths.mjs`，
 * 本档 import 取用）与 #84 记账缝住 batch.mjs 主档——**依赖单向（KD-4）：paths ← skeleton ← lifecycle
 * ← 主档**，主档把解析后的 cwd/bases/目标闭包传进来，本档不回 import 主档（防环）。
 *
 * 身份判据（D-BR17/D-BR18/D-BR21）：主 agent 的工具调用 ctx 带 `depth === 0`（dispatch 装配）；
 * eng 子代理 `ctx.depth > 0`；评审实例 ctx 无 depth 但工具以 `review: true` 绑定。create/close
 * 仅 depth-0 放行（BR-19/BR-24「… is main-agent-only」）；status 写域 = 调用者自己段
 * （eng-designer → §2 · 评审 → §3 · eng-coder → §5 · coder → §5【普通模式分支增表】· 主 agent →
 * 工程 §1 ∥ 普通 §1/§2/§5【取段——§4.16】——§4/§6 状态面走普通文档写）；depth-0 的 status/path 面
 * 按 D-BR21（可选 path，缺省 = 在飞批唯一时取）。
 *
 * 文档机检门（§3.20「结构兜底」②）：`close` 与 `status` 值余核「已收口」两路写盘前跑
 * `runBatchGate({ scope: "close" })`——`REFUSED`（K ≥ 1）∥ `ERROR` ⇒ throw（§1 状态行字节不变）；
 * `PASS` / 未跑（无声明面）⇒ 落盘 + 回执明示。门单源住 `batch-gate.mjs`（判据零改）。
 *
 * 链完整性门（§4.18-A）：`close` ∥ `status` 写「已收口」两路在写盘前同过 `assertCloseoutChainComplete`
 * ——§2/§3/§4/§6 各段有内容 ∥ §1 声明不适用（仅 §2/§3/§4 可声明；§6 不可声明 · §5 段号豁免）；
 * 缺段 ⇒ 点名拒（门位 = 冻结拒写之后、文档机检门之前）。重开径（§4.18-B）：已收口档
 * `status` §1 → 进行中 + `note` 非空 ⇒ 状态行改写 + §1 段尾追记行（只追加，其余行字节不变）。
 *
 * 收口重锚（§6.2 · C · AC-M2-30）：收口有两条通路——`close` ∥ `status` 写 §1「已收口」——两路都冻结档、
 * 都让批「收口了」，故**两路同调**单源 `reanchorOnClose`（本档下方），调点均在状态行写盘之后。
 * 一次收口只出一份 `[ledger reanchor]` 回执段（判据 = 前态未冻结：已冻结档在两路都被冻结门早拒）。
 *
 * 收口自动消费本批设计凭证（DESIGN-TOKEN-SETTLEMENT §10 · 2026-10-26）：同一两路在**写状态行之前**
 * 调 `consumeBatchDesignTokens`（判据 = 槽的批次归属旁列；口径单源见该档 §10）。消费失败 ⇒ 原样上抛、
 * close 被拒、档零字节变——位次与重锚（写盘之后）相反，这是机制本体（KD-BG3）。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, relative, resolve } from "node:path"

import {
  SEGMENT_BY_ROLE, SEGMENT_BY_ROLE_NORMAL, DEPTH0_SEGMENTS, STATUS_WORDS, STATUS_LINE_RE, readBatchStatusLine, sectionHasStatusLine, sectionHeaderRe, batchSkeleton,
  TEMPLATE_PLACEHOLDERS, findPlaceholderResidue, placeholderResidueError,
  sectionContentState, malformedInapplicableLine, inapplicableDeclarationError,
} from "./batch-skeleton.mjs"
import { resolveBatchCreatePath } from "./batch-paths.mjs"
import { gateReceiptLine, gateRefusalMessage, runBatchGate } from "./batch-gate.mjs"
import { batchPathKey, executeConsumeDesignAction, unionBatches, unionSlots } from "./design-slots.mjs"

/** 可读文件判据（存在且为文件——目录/缺失同判不可读；与主档同名 helper 同型——KD-4 单向
 *  依赖下各自持有，三行谓词不构成第二权威源）。 */
function readableFile(abs) {
  try { return existsSync(abs) && statSync(abs).isFile() } catch { return false }
}

/** 本地今天（YYYY-MM-DD）——close 收口日期戳。 */
function todayLocal() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** depth-0 身份判据。 */
function isDepthZero(ctx) {
  return ctx?.depth === 0
}

/** 段号解析（`§2` / `2` / `§2 批次任务` 均可；无法解析 → null——与主档 append 面同型三行
 *  谓词，KD-4 单向依赖下各自持有，不构成第二权威源）。 */
function segmentNumber(raw) {
  const m = /^§?\s*(\d+)/.exec(String(raw ?? "").trim())
  return m ? Number(m[1]) : null
}

/** 档头两可选参归一（`BATCH-RECORD.md` §4.11 契约——逐字文本面 = `TOOLS.md` §6.20）：trim ∥
 *  单行（拒句逐字）∥ 空串 ≡ 未给（null）；`ledger` 前导 `#` 补齐（board 无补齐）。给参 ⇒ 建即填
 *  台账行（batchSkeleton 实参面）；未给（任一）⇒ 占位留存 + 回执填法句。 */
function normalizeHeaderParam(name, raw) {
  const v = typeof raw === "string" ? raw.trim() : ""
  if (!v) return null
  if (/\r?\n/.test(v)) {
    throw new Error("batch: create ledger / board must be single lines — a multi-line value would break the header's 台账 line. Nothing was written.")
  }
  return name === "ledger" && !v.startsWith("#") ? `#${v}` : v
}

/** main-agent-only 门（BR-19/BR-24）：create/close 仅 depth-0 放行（eng 子代理 / 评审皆拒）。 */
function assertMainAgentOnly(ctx, action, review) {
  if (review || !isDepthZero(ctx)) {
    throw new Error(`batch: ${action} is main-agent-only — ${action} manages the record lifecycle and is depth-0 only (eng sub-agents and design reviews are refused).`)
  }
}

/** 递归收集目录下全部 `*.md`（#369 · KD-4：显式嵌套路径为合法 create 面 ⇒ 顶层平扫会欠计
 *  ⇒ 复数情形漏判、默认定位可落非预期档）。只认真目录（`dirent.isDirectory()`——symlink 不入，
 *  防环）；单目录读错按无候选处理（尽力面，同旧平扫）。**转导出**（read-data-interface 批——
 *  `batch/list` 读面文件集同源复用；零行为变）。 */
export function collectMarkdownFiles(dir, out = []) {
  let entries = []
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    const abs = resolve(dir, e.name)
    if (e.isDirectory()) collectMarkdownFiles(abs, out)
    else if (e.isFile() && e.name.endsWith(".md")) out.push(abs)
  }
  return out
}

/**
 * depth-0 目标定位（D-BR21）：扫描全部基底根下 `*.md`（**递归**——#369），逐档读 §1 状态行判定 open
 * （readBatchStatusLine === "open"）。0 个 ⇒ throw（无在飞批）；恰 1 个 ⇒ 返回该档绝对路径；
 * ≥2 ⇒ throw（复数在飞批——必传 path，错误消息列出候选）。
 * 基底根数组由主档传入（batchDocBases——声明面单源，恒非空）；单根目录读错按无候选处理。
 * @param {string} cwd
 * @param {string[]} bases — 已解析的批次档基底根数组
 * @returns {string} 唯一在飞批绝对路径
 */
export function findInFlightBatch(cwd, bases) {
  void cwd
  const candidates = []
  for (const root of bases ?? []) {
    for (const abs of collectMarkdownFiles(root)) {
      let src
      try { src = readFileSync(abs, "utf8") } catch { continue }
      if (readBatchStatusLine(src) === "open") candidates.push(abs)
    }
  }
  if (candidates.length === 0) {
    throw new Error("batch: no batch record in flight — no *.md under the batch base roots has a §1 status line of 「进行中」. Pass path explicitly, or create a record first (action create).")
  }
  if (candidates.length > 1) {
    throw new Error(`batch: ${candidates.length} batch records are in flight — pass path to pick the target (D-BR21: default resolution requires a unique in-flight record). In flight:\n${candidates.join("\n")}`)
  }
  return candidates[0]
}

/** create 路径越界判据已迁 `batch-paths.mjs`（`resolveBatchCreatePath` 内含——§4.15 单源）。 */

/**
 * create——建档（§4.11，仅 depth-0）。六段骨架一次预齐（骨架模板单源 = batchSkeleton），
 * 建档即过 gate（§1 占位状态行含「进行中」）；fail-closed：非 .md / 越基底 / 目标已存在 ⇒ throw
 * （不覆盖既有批档，BR-20）；目录缺失 ⇒ mkdir -p 后落位（BR-25）。不代建台账条目。
 * 路径解析 = `resolveBatchCreatePath`（§4.15 单源：候选序首个落基底内者 / 锚定串只解析项目根形）。
 * F11-B：`source` **必填**（topic 同款空拒——骨架编制行实参化；不传 = 死占位残留必被 F11-C 拒
 * ⇒ create 即拒，不留死锁）；`prev` 传入值**幂等剥**「前情 = 」前缀（值规范化；默认值零变）。
 * 2026-10-05（A-2）：`ledger` / `board` 可选参**建即填**台账行（归一契约 = §4.11；回执两态 =
 * 两参皆给 ⇒ 标注已填 ∥ 未给（任一）⇒ 填法句）。
 * 2026-10-09（§4.16）：骨架**按模式位取形**（`batchSkeleton({…, mode})`——执行期实读；普通面
 * 作者标签四处替换，工程面骨架产出逐字不变）。
 * @returns {string} 成功消息（含落盘绝对路径）
 */
export function createBatchRecord({ args, ctx, review, cwd, bases, onWritten }) {
  assertMainAgentOnly(ctx, "create", review)
  const raw = typeof args?.path === "string" ? args.path.trim() : ""
  if (!raw) {
    throw new Error("batch: create requires path — the new batch record's location (a .md path under the batch base roots, relative or absolute). Nothing was written.")
  }
  if (!/\.md$/.test(raw)) {
    throw new Error(`batch: create path must end in .md — got ${JSON.stringify(raw)} (fail-closed: non-markdown targets are refused). Nothing was written.`)
  }
  const primary = bases?.[0]
  if (!primary) {
    throw new Error("batch: no batch-record base root is available — fix PROJECT-MANIFEST.json docRoot.batches (or its default) before creating a record. Nothing was written.")
  }
  const abs = resolveBatchCreatePath(cwd, raw, bases)
  if (readableFile(abs)) {
    throw new Error(`batch: create target already exists — refusing to overwrite an existing batch record (fail-closed, BR-20): ${raw}`)
  }
  const topic = typeof args?.topic === "string" && args.topic.trim() ? args.topic.trim() : null
  if (!topic) {
    throw new Error("batch: create requires topic — the batch subject word shared by the record header (档名与档头共用——keep the file name aligned with it). Nothing was written.")
  }
  const source = typeof args?.source === "string" ? args.source.trim() : ""
  if (!source) {
    throw new Error("batch: create requires source — the record's origin line (来源 = …). Pass where this batch came from (the request / discussion that started it); it lands in the header's 编制 line. Nothing was written.")
  }
  if (/\r?\n/.test(source)) {
    throw new Error("batch: create source must be a single line — a multi-line source would break the header's 编制 line. Nothing was written.")
  }
  // 档头两可选参（§4.11 契约——给则建即填台账行；未给任一 ⇒ 占位留存 + 回执填法句）
  const ledger = normalizeHeaderParam("ledger", args?.ledger)
  const board = normalizeHeaderParam("board", args?.board)
  const date = typeof args?.date === "string" && args.date.trim() ? args.date.trim() : todayLocal()
  // F11-B：prev 幂等 strip——调用方自带「前情 = 」前缀（单或重复）一并剥净（`+` 量词；归一化目的
  // = 值规范化，无前缀值原样通过）。默认值形态「无（独立批）」零变。
  const prevRaw = typeof args?.prev === "string" ? args.prev.trim() : ""
  const prev = prevRaw ? (prevRaw.replace(/^(?:前情\s*[=：:]\s*)+/g, "").trim() || "无（独立批）") : "无（独立批）"
  mkdirSync(dirname(abs), { recursive: true })
  // 模式位执行期实读（§4.16——骨架取形时点 = 建档即固；翻转不回写既有骨架）
  const mode = ctx?.agent?.config?.agent?.engineering ? "engineering" : "normal"
  writeFileSync(abs, batchSkeleton({ date, topic, source, prev, ledger, board, mode }))
  onWritten?.(ctx?.agent ?? {}, abs)
  // 回执两态（`TOOLS.md` §6.20 逐字）：两参皆给 ⇒ 标注已填；未给（任一）⇒ 填法句（填法 = 文件编辑）
  const headerNote = ledger !== null && board !== null
    ? `header 台账 line filled (${ledger} · ${board})`
    : "header 台账 placeholder(s) remain — fill them by file edit before the record's first append/status opens"
  return `batch: created ${abs} — six-section skeleton written (§1 status line carries the gate-legal 「进行中」 placeholder; register the ledger entry yourself — create does not). ${headerNote}`
}

/**
 * 段内状态行单行改写（status/close 共用——append-only 的唯一豁免，域限状态行）：
 * 定位 `## §N` 段（sectionHeaderRe 单源），段内逐行扫描 STATUS_LINE_RE 首命中行原位替换
 * （行尾随命中行自身）；缺失则标题行后偏移插入状态行 + 空行（插入块行尾 = 标题行自身
 * 行尾——锚行后首二字节判读）。段界外字节零变（行切分 = /\r?\n/：EOL 形态无关）。
 * 段标题缺失 ⇒ throw（create 是骨架唯一权威入口）。
 */
function updateSectionStatusLine(src, seg, value) {
  const hdr = sectionHeaderRe(seg).exec(src)
  if (!hdr) {
    throw new Error(`batch: the batch record has no "## §${seg}" section header — cannot update its status line (create is the skeleton's only authoritative entry; append/status never add one). Nothing was written.`)
  }
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = hdr.index + hdr[0].length
  const next = nextRe.exec(src)
  const endIdx = next ? next.index : src.length
  const line = `**状态行**：${value}`
  const parts = src.slice(hdr.index, endIdx).split(/(\r?\n)/) // 保留分隔符（奇数下标 = 行尾）——替换只动命中行
  const idx = parts.findIndex((p) => STATUS_LINE_RE.test(p))
  if (idx >= 0) { parts[idx] = line } else {
    const eol = parts[1] === "\r\n" ? "\r\n" : "\n" // 缺行插入块行尾 = 标题行自身行尾
    if (parts.length === 1) parts.splice(1, 0, eol, line, eol, "", eol, "")
    else parts.splice(2, 0, line, eol, "", eol, "", eol)
  }
  return src.slice(0, hdr.index) + parts.join("") + src.slice(endIdx)
}

/** §6 空闸拒句（#422①——空 ⇒ 拒 + 提示先写 §6；防「append 被拒 ⇒ close 照常 ⇒ §6 永久为空」
 *  复发——2026-09-26 dispatch-sizing 批实证）：**§6 为唯一缺段时**拒串取本函数（§4.18-A J2——
 *  「非空门」文案逐字零回归）；判据本体 = 单源谓词 `sectionContentState(src, 6)`（`batch-skeleton.mjs`），
 *  旧谓词函数已随判据单源退场（不留第二套）。 */
function emptySectionSixError() {
  return "batch: §6 收口段为空（non-empty gate）— close refuses: the closeout section (§6) has no content, and closing would freeze the record with that section permanently empty. Write the section first (append §6: the closeout / verification summary), then call close again. Nothing was written."
}

/** 冻结门（§4.9——append/status 同门；close 视为写同样过门）：closed/unknown 的错误串与
 *  append 面同字面（「已收口档不回改」/「状态行不可解析或缺失」）。 */
function assertGateOpen(src) {
  const gate = readBatchStatusLine(src)
  if (gate === "closed") {
    throw new Error("batch: 已收口档不回改 — the record's §1 status line contains 「已收口」, so the record is frozen: its body is never written to again (整档冻结；改 = 新批新档). Nothing was written.")
  }
  if (gate === "unknown") {
    throw new Error("batch: 状态行不可解析或缺失 — the record has no §1 `**状态行**：` line whose value contains 已收口 or 进行中 (fail-closed: the write is refused as if frozen). Nothing was written. Do NOT close the record after a refused append — nothing landed, and closing freezes the missing section for good (失败 ⇒ 勿 close).")
  }
}

// ─── 链完整性门（§4.18-A——close ∥ status 写「已收口」两路收口前置；D-BR30）──────────

/** 链判段集（§2/§3/§4/§6——§5 段号豁免恒不判；§1 主 agent 自述段不设前置）。 */
const CHAIN_SEGMENTS = [2, 3, 4, 6]

/** 链门拒绝句（§4.18-A J1——缺段非仅 §6 时；逐字文本 = `TOOLS.md` §6.24 J1。`missing` = 点名串，
 *  形如 `§2 / §3 / §4`——按段号升序列出）。 */
function closeoutChainError(missing) {
  return "batch: 收口链未跑完（closeout chain gate）— close refuses: the record's closeout chain has not run, and closing would freeze it that way. " +
    `Missing: ${missing}. Each named section must carry content (append it) or be declared inapplicable in §1 as ` +
    "`> 不适用：§N —— <reason>` (§2 / §3 / §4 only). §6 must carry its verification (never declarable) and §5 is exempt (a light-channel round has no implementation section). " +
    "Nothing was written."
}

/**
 * 链完整性门（§4.18-A——**收口前置**）：`close` ∥ `status` 写「已收口」两路在写盘前同过本门。
 * 判据：§2 / §3 / §4 / §6 每段须 `sectionContentState(src, seg) !== "empty"`（有内容 ∥ 声明不适用）；
 * 不满足 ⇒ throw 并点名缺段（拒串 = J1——点名串按段号升序 `§2 / §3 / §4` 形）。**§6 为唯一缺段时
 * 拒串 = 旧串逐字**（`emptySectionSixError()`——J2，零回归）。门位 = 既有拒因之后、文档机检门之前
 * （§4.9 门清单第 ③ 道）；门不判内容质量、不做自动修复、不判 §1 / §5。
 * @param {string} src — 档全文（写盘前只读）
 */
function assertCloseoutChainComplete(src) {
  // 声明形不合先行（J3——不静默当作无声明）：§1 内「不适用」打头而完整形不合 ⇒ 拒
  const badDecl = malformedInapplicableLine(src)
  if (badDecl !== null) throw new Error(inapplicableDeclarationError(badDecl))
  const missing = CHAIN_SEGMENTS.filter((n) => sectionContentState(src, n) === "empty")
  if (missing.length === 0) return
  if (missing.length === 1 && missing[0] === 6) throw new Error(emptySectionSixError()) // J2——零回归
  throw new Error(closeoutChainError(missing.map((n) => `§${n}`).join(" / "))) // J1
}

// ─── 重开路径（§4.18-B——已收口档带审计的逆向流转；D-BR31）─────────────────────────

/** 重开缺理由拒绝句（§4.18-B J4——触发合取缺 note；逐字文本 = `TOOLS.md` §6.24 J4）。 */
function reopenReasonError() {
  return "batch: 重开需理由（reopen requires a reason）— reopening a frozen record reverses a recorded decision, so the reason must be stated: pass it as `note` (it lands verbatim in the §1 reopen record). Nothing was written."
}

/**
 * 重开（§4.18-B——已收口档 status(进行中, note 非空)）：一次写盘、两处落笔——
 * ① §1 状态行 → `进行中（重开 <YYYY-MM-DD>）`（updateSectionStatusLine 既有单行豁免）；
 * ② §1 **段尾追加**追记行 `**重开记录**：<日期> · 原收口 <旧日期> · 理由 = <note> · 操作者 = 主 agent`
 *    （appendLineToSection——只追加；原收口 = 改写前状态行的收口日期字面，无日期字面 ⇒ `未标日期`）。
 * 只追加判据：行数 +1、仅状态行原位替换、余行逐字节不变。EOL = §1 段头行自身行尾（CRLF 档 ⇒ CRLF）。
 * @param {string} src — 档全文（closed 态）
 * @param {string} note — 重开理由（调用面已验非空单行）
 * @returns {string} 写盘用新全文
 */
function rewriteAsReopen(src, note) {
  // 原收口 = 改写前 §1 状态行的收口日期字面（先取后改——重开后该行不再携带它）
  const prevLine = (readBatchStatusLineRaw(src) ?? "").trim()
  const prevDate = /已收口\s*(\d{4}-\d{2}-\d{2})/.exec(prevLine)?.[1] ?? "未标日期"
  const date = todayLocal()
  const withStatus = updateSectionStatusLine(src, 1, `进行中（重开 ${date}）`)
  return appendLineToSection(withStatus, 1, `**重开记录**：${date} · 原收口 ${prevDate} · 理由 = ${note} · 操作者 = 主 agent`)
}

/** §1 状态行值原文（改写前的读取面——readBatchStatusLine 只给三态，日期字面须自己读）。 */
function readBatchStatusLineRaw(src) {
  const s1 = /^## §1(?=\s|$)/m.exec(src)
  if (!s1) return null
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = s1.index + s1[0].length
  const next = nextRe.exec(src)
  const body = src.slice(s1.index + s1[0].length, next ? next.index : src.length)
  return body.split(/\r?\n/).map((line) => STATUS_LINE_RE.exec(line)).find(Boolean)?.[1] ?? null
}

/**
 * §N 段尾追加一行（§4.18-B——重开追记行载体；append-only：只追加，既有行字节零变）。
 * 位置 = 段体尾部（下一 `## §` 段头之前 ∥ 文末）；追加行 EOL = §1 段头行自身行尾
 * （`\r\n` ⇒ CRLF ∥ 其余 ⇒ `\n`——探测窗 = 段头行整体〔含行尾〕，`/^## §N[^\r\n]*\r?\n/` 一次取形）。
 * 段标题缺失 ⇒ throw（create 是骨架唯一权威入口——同 append 面 fail-closed）。
 */
function appendLineToSection(src, seg, line) {
  const hdr = sectionHeaderRe(seg).exec(src)
  if (!hdr) {
    throw new Error(`batch: the batch record has no "## §${seg}" section header — cannot append to its tail (create is the skeleton's only authoritative entry). Nothing was written.`)
  }
  const headerLine = /^## §\d[^\r\n]*\r?\n/m.exec(src.slice(hdr.index))
  const eol = headerLine?.[0].endsWith("\r\n") ? "\r\n" : "\n"
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = hdr.index + hdr[0].length
  const next = nextRe.exec(src)
  const endIdx = next ? next.index : src.length
  let before = src.slice(0, endIdx)
  const after = src.slice(endIdx)
  // 只保证「行自成行」：段尾无换行 ⇒ 补一个段头行行尾；已有换行零补（不插空行——只追加判据 = 行数 +1）
  if (!before.endsWith(eol)) before += eol
  return before + line + eol + after
}

/** 全词表去重并集（各段项——value 命中判据与 note 零命判据共用同一口径）。 */
function statusVocabulary() {
  return [...new Set(Object.values(STATUS_WORDS).flatMap((w) => Object.values(w)))]
}

/** 状态行值装饰白名单（F11-A 谓词收紧）：首尾非字母数字符号（emoji / 标点 / 空白）+ 尾部
 *  ISO 日期（YYYY-MM-DD）+ 首尾空白。剥白名单后**余核必须逐字等于**该关键词——余核 ≠ 关键词
 *  （散文内嵌）⇒ 拒（散文说明走独立 `note` 字段落括注）。
 *  读侧（gate）零变：`readBatchStatusLine` / `assertGateOpen` 仍子串包含——冻结门语义不动；
 *  收紧只在写入面 value。 */
const LEAD_DECOR_RE = /^[^\p{L}\p{N}]+/u
const TAIL_DECOR_RE = /[^\p{L}\p{N}]+$/u
const ISO_TAIL_RE = /\d{4}-\d{2}-\d{2}\s*$/
function stripDecorations(value) {
  return value.replace(LEAD_DECOR_RE, "").replace(ISO_TAIL_RE, "").replace(TAIL_DECOR_RE, "")
}

/** status 值域校验（fix 轮 #1 + 词面纪律 + 本批 F11-A 谓词收紧）：值在**全词表 union**中必须恰
 *  命中一个关键字（判读序不动：≥2 命中 ⇒ 混词拒在前；0 命中 / 唯一命中不属本段 ⇒ 词表外拒），
 *  且剥装饰白名单后**余核逐字 = 该关键词**（余核 ≠ 关键词 = 散文内嵌 ⇒ 词表外拒同串）。
 *  「进行中…已收口」双词无论写哪段皆拒（最小词面：已收口优先误冻结防线——2026-09-20 词面纪律）。 */
function assertStatusValue(seg, value) {
  const words = Object.values(STATUS_WORDS[seg] ?? {})
  if (!words.length) {
    throw new Error(`batch: §${seg} has no status word list — status is undefined for this section (STATUS_WORDS 分段词表无该项). Nothing was written.`)
  }
  const hits = statusVocabulary().filter((w) => value.includes(w))
  if (hits.length > 1) {
    throw new Error(`batch: status value contains multiple keywords (${hits.join(" + ")}) — one status line carries exactly ONE keyword (词面纪律: mixed values mis-freeze via 已收口-priority). Nothing was written.`)
  }
  if (hits.length === 0 || !words.includes(hits[0]) || stripDecorations(value) !== hits[0]) {
    throw new Error(`batch: status value ${JSON.stringify(value)} is not in the legal keyword set for §${seg} (${words.join(" / ")}) — STATUS_WORDS 分段词表是唯一值域（D-BR19；合法值 = 恰一关键词 + 装饰白名单〔首尾符号 / 尾部 ISO 日期 / 空白〕，散文说明走 note 字段落括注）. Nothing was written.`)
  }
}

/** note 单行判据（两径共用——非重开径落状态行括注、重开径落 §1 追记行，两者都是一行；
 *  重开径不取 `assertStatusNote` 的另两条判据〔词表零命中 / 死占位〕——理由允许携词表关键字，
 *  而追记行不是状态行形态、不参与 gate 判读（§4.18-B 理由校验）。 */
function assertSingleLineNote(note) {
  if (/\r?\n/.test(note)) {
    throw new Error("batch: status note must be a single line — a multi-line note would break the one-line status-line form. Nothing was written.")
  }
}

/** status `note` 字段校验（F11-A——落盘形态 = 状态行行内括注）：单行 + **全词表零命中**
 *  （括注永不误触冻结门——§1 判定是子串包含；已收口优先误冻结防线的第二道）+ 死占位判据零命中
 *  （括注不得成为骨架占位的新驻留面）。 */
function assertStatusNote(note) {
  assertSingleLineNote(note)
  const hits = statusVocabulary().filter((w) => note.includes(w))
  if (hits.length) {
    throw new Error(`batch: status note must not contain any STATUS_WORDS keyword (${hits.join(" + ")}) — a parenthetical carrying a keyword would be read as gate truth (§1 substring predicate). Put the keyword in value, the prose in note. Nothing was written.`)
  }
  const residues = TEMPLATE_PLACEHOLDERS.filter((ph) => note.includes(ph))
  if (residues.length) {
    throw new Error(`batch: status note must not carry skeleton placeholders (${residues.join(" · ")}) — fill them in the record header instead of parking them in the status line. Nothing was written.`)
  }
}

/**
 * status——状态行流转（§4.12，段属主；§4.16 模式感知）。写域 = 调用者自己段内 `**状态行**：`
 * 行（评审 → §3 · eng-designer → §2 · eng-coder / coder → §5 · 主 agent：工程 §1 ∥ 普通
 * §1/§2/§5 取段——缺省 §1）；值域 = STATUS_WORDS 该段项恰一词（**余核 = 关键词**——F11-A
 * 谓词收紧），散文说明走独立 `note` 字段（落状态行括注）；冻结真值不变（gate 只读 §1）。
 * path 参数 = 仅 depth-0（D-BR21）——子代理/评审传 path ⇒ 拒（目标 = spawn/实例注入，语法上
 * 写不到别处）。F11-C 挂点 = 写盘前（assertStatusValue 后）：档头结构行含骨架死占位 ⇒ 拒
 * （段体引用豁免；close 不拦——收口是主 agent 终态动作）。
 * **收口第二通路**：值余核 = §1「已收口」时本 action 同样收口（链门 + 机检门 + 冻结与 close 同序）⇒
 * 状态行写盘后同调 `reanchorOnClose`（单源——不复制 close 径逻辑），回执携同一 `[ledger reanchor]` 段。
 * @returns {Promise<string>} 成功消息
 */
export async function statusBatchRecord({ args, ctx, review, pickTarget, onWritten }) {
  const depth0 = isDepthZero(ctx)
  // 模式位执行期实读（§4.16——同款先例 = task.mjs execute 门；翻转即时生效——D-BR26）。
  // 写域：评审 → §3 · 子代理 → 身份段（普通模式分支合并 coder 增表——工程模式分支不查）·
  // depth-0 工程 → §1 ∥ 普通 → §1/§2/§5（取段——缺省 §1）。
  const engineering = !!ctx?.agent?.config?.agent?.engineering
  let seg = review ? 3 : depth0 ? 1 : SEGMENT_BY_ROLE[ctx?.agent?._role] ?? (engineering ? null : SEGMENT_BY_ROLE_NORMAL[ctx?.agent?._role] ?? null)
  if (seg === null) {
    throw new Error("batch: no segment is writable by this caller — status writes the caller's OWN section (eng-designer → §2, design review → §3, eng-coder → §5, main agent → §1).")
  }
  // 段域判据（BR-22「eng-designer 对 §1 调 status ⇒ 段白名单拒」——镜像 append 面）：
  // depth-0 普通面（§4.16）= **取段**——写域集 §1/§2/§5、缺省 §1、越出集合 ⇒ 拒（模式化新串）；
  // depth-0 工程面 ∥ 子代理 ∥ 评审 = **声明段核对**（声明段 ≠ 身份写域段 ⇒ 拒；身份写域段可省略）。
  const declared = args?.segment === undefined || args?.segment === null ? null : segmentNumber(args.segment)
  // 传值而解析不可得 ⇒ 显式拒（#1116——镜像 append 面「unknown segment」串形；未传 = 缺省语义零变）。
  if (declared === null && args?.segment !== undefined && args?.segment !== null) {
    throw new Error(`batch: unknown segment ${JSON.stringify(args?.segment ?? null)} — pass the section number you write (e.g. "§${seg}"), or omit it. Nothing was written.`)
  }
  if (depth0 && !review && !engineering) {
    const target = declared ?? 1
    if (!DEPTH0_SEGMENTS.status.normal.includes(target)) {
      throw new Error(`batch: §${declared} is not yours to write — in normal mode status writes §1/§2/§5 only (一段一作者: §3 = design review; §4/§6 carry no status word list). Nothing was written.`)
    }
    seg = target
  } else if (declared !== null && declared !== seg) {
    throw new Error(`batch: §${declared} is not yours to write — status writes YOUR OWN section §${seg} only (一段一作者: eng-designer → §2, design review → §3, eng-coder → §5, main agent → §1). Nothing was written.`)
  }
  if (args?.path !== undefined && args?.path !== null && !depth0) {
    throw new Error("batch: path is a depth-0-only parameter (D-BR21) — your target record arrives via the spawn binding / the review instance key. Nothing was written.")
  }
  const value = typeof args?.value === "string" ? args.value.trim() : ""
  if (!value) {
    throw new Error("batch: status requires value — the new status-line value (must contain exactly one legal keyword of your section's STATUS_WORDS entry). Nothing was written.")
  }
  if (/\r?\n/.test(value)) {
    throw new Error("batch: status value must be a single line — a multi-line value would break the one-line status-line form. Nothing was written.")
  }
  // note（可选）：散文说明的承载面——落状态行行内括注（value 内散文不再容忍）；缺省 / 空串 = 无括注。
  // **重开径例外（§4.18-B）**：值关键词 = 进行中 ∧ §1 门态 = closed ⇒ note = 重开理由（J4 缺则拒），
  // 不进状态行括注（落 §1 追记行）；`assertStatusNote` 不取——理由允许携词表关键字（常写「误标已收口」）。
  const note = typeof args?.note === "string" ? args.note.trim() : ""
  assertStatusValue(seg, value)
  const abs = pickTarget(args?.path)
  const src = readFileSync(abs, "utf8")
  // 重开合取（§4.18-B）：段 = §1 · depth-0（非评审）· 值关键词 = 进行中 · 门态 = closed——
  // 先于冻结拒写判定（门②的唯一例外）；note = 重开理由（J4 缺则拒）。
  const reopen = seg === 1 && depth0 && !review && stripDecorations(value) === STATUS_WORDS[1].open && readBatchStatusLine(src) === "closed"
  if (reopen && !note) throw new Error(reopenReasonError()) // J4——重开必须带理由
  // 重开径理由校验（§4.18-B）：单行 + 非空（非空已由 J4 判）；**不取 `assertStatusNote`**——理由
  // 允许携状态词表关键字（常写「误标已收口」：追记行不是状态行形态、不参与 gate 判读）。
  if (reopen) assertSingleLineNote(note)
  else if (note) assertStatusNote(note)
  const lineValue = note && !reopen ? `${value}（${note}）` : value
  if (!reopen) assertGateOpen(src) // 冻结拒写——重开合取是唯一越过点（§4.9 门②例外；其余逐字零变）
  // F11-C（写盘前）：档头结构行死占位残留 ⇒ 拒（段体引用豁免——判据可辨性收正，`TOOLS.md` §6.20）
  const residues = findPlaceholderResidue(src)
  if (residues.length) throw new Error(placeholderResidueError(residues))
  if (reopen) {
    // 重开（§4.18-B）：一次写盘、两处落笔（状态行改写 + §1 段尾追记行）——不跑链门 / 机检门
    //（值非「已收口」；写后门态 = open，后续 append/status 恢复放行）。
    writeFileSync(abs, rewriteAsReopen(src, note))
    onWritten?.(ctx?.agent ?? {}, abs)
    return `batch: §1 reopened — status line → 「进行中（重开 ${todayLocal()}）」 + reopen record appended to §1 (reason lands verbatim in the record line). Append/status are writable again (BR-64); the closeout chain gate still applies at the next close.`
  }
  // ③ 链完整性门（§4.18-A——门位 = 冻结拒写之后、文档机检门之前）：链未跑完先报结构缺口，不先跑机检
  // 收口判据（本笔把 §1 写成「已收口」）单点——链门 ∥ 机检门 ∥ 重锚合取三处共消费，段号守卫只写这一次
  // （`STATUS_WORDS[1].closed` 只属 §1 项，`assertStatusValue` 亦拒他段该值；显式 `seg === 1` 让不变量不靠巧合）。
  const closingValue = seg === 1 && stripDecorations(value) === STATUS_WORDS[1].closed
  if (closingValue) assertCloseoutChainComplete(src)
  // ④ 文档机检门（§3.20「结构兜底」②——门位 = 链门之后、状态行改写之前）：值余核 =「已收口」时同门；
  // REFUSED（K ≥ 1）∥ ERROR ⇒ throw（§1 状态行字节不变）；其余值零挂（回执逐字旧形）。
  const gate = closingValue ? runBatchGate({ abs, cwd: ctx?.agent?.cwd ?? process.cwd(), agent: ctx?.agent ?? {}, scope: "close" }) : null
  if (gate && (gate.state === "refused" || gate.state === "error")) throw new Error(gateRefusalMessage(gate, "status"))
  // 收口自动消费（§10——第二通路与 close 同效：位次 = 上两道门之后、状态行写盘之前）
  const designTokens = closingValue ? consumeBatchDesignTokens(ctx?.agent ?? {}, abs) : null
  const written = updateSectionStatusLine(src, seg, lineValue)
  writeFileSync(abs, written)
  onWritten?.(ctx?.agent ?? {}, abs)
  // 收口重锚（§6.2 · C · AC-M2-30）：值余核 = §1「已收口」⇒ 本 action 就是收口（上两道门与 close 同序、
  // 同样冻结档）⇒ 同调单源 `reanchorOnClose`（不复制 close 径逻辑）；次序位 = 状态行写盘之后（与 close 径一致）
  // ——本笔被任一拒因拒 ⇒ 上面各门早 throw，台账零写（被拒的收口没有收口）。
  // **一次收口只出一份清单**：触发 = `closingValue` ∧ 前态未冻结；`batch` 一次调用只分派一个 action
  // （close ∥ status 不会同拍）⇒ 同一拍至多一次重锚、至多一份 `[ledger reanchor]`。前一合取项 =
  // **defensive-only**：前态 closed 已被冻结门（`assertGateOpen`，本函数上方）早拒，正常路径跑不到这里。
  const reanchor = closingValue && readBatchStatusLine(src) !== "closed" ? await reanchorOnClose(abs, ctx?.agent?.cwd ?? process.cwd()) : null
  return `batch: §${seg} status line updated to ${JSON.stringify(lineValue)} — the freeze gate (§1) is a read-only domain for non-§1 writes (frozen truth stays = the §1 line).${gateReceiptLine(gate)}${designTokensReceiptLine(designTokens)}${reanchorReceiptLine(reanchor)}`
}

/**
 * close——收口冻结（§4.13，仅 depth-0）。§1 状态行 →「已收口 <YYYY-MM-DD>」；此后该档
 * append/status 全拒（冻结判据唯一真值 = §1 行——§4.9 零语义变；唯一例外 = 重开合取 §4.18-B）。
 * 对已收口档再 close ⇒ 拒（close 本身是对冻结档的写）。不代写 §6 内容、不替代台账核销事务。
 * 前提规则（#422 + 本批 A 链门 §4.18-A）：① 链完整性门（收口前置——§2/§3/§4/§6 各段有内容 ∥ 声明
 * 不适用；§6 唯一缺段时拒串 = 旧 §6 串逐字零回归）；② 拒句含「失败 ⇒ 勿 close」（append/status 面
 * ——见 batch.mjs 与上方 assertGateOpen）；③ 无状态行档 ⇒ 自建机读位（updateSectionStatusLine
 * 缺失即插——同路收口；「有行但不可解析」仍 fail-closed）。
 * @returns {Promise<string>} 成功消息
 */
export async function closeBatchRecord({ args, ctx, review, pickTarget, onWritten }) {
  assertMainAgentOnly(ctx, "close", review)
  const abs = pickTarget(args?.path)
  const src = readFileSync(abs, "utf8")
  // #422③：§1 无状态行档 ⇒ 自建机读位（下行走 updateSectionStatusLine 缺失即插——同路收口）；
  // 「有行但不可解析」维持 fail-closed（assertGateOpen 拒——防误冻结）。
  if (readBatchStatusLine(src) !== "open" && sectionHasStatusLine(src, 1)) assertGateOpen(src)
  // 链完整性门（§4.18-A——门位 = 既有拒因之后、文档机检门之前）：§2/§3/§4/§6 各段有内容 ∥ 声明
  // 不适用；缺段 ⇒ 拒并点名（§6 唯一缺段 = J2 旧串逐字）。含声明形不合判（J3——不静默当作无声明）。
  assertCloseoutChainComplete(src)
  // 文档机检门（§3.20「结构兜底」②——门位 = 链门之后、状态行改写之前）：REFUSED（K ≥ 1）∥ ERROR
  // ⇒ throw（fail-closed，不落「已收口」）；PASS / 未跑（无声明面）⇒ 落盘 + 回执明示。
  const gate = runBatchGate({ abs, cwd: ctx?.agent?.cwd ?? process.cwd(), agent: ctx?.agent ?? {}, scope: "close" })
  if (gate.state === "refused" || gate.state === "error") throw new Error(gateRefusalMessage(gate, "close"))
  // 收口自动消费本批设计凭证（§10——位次 = 全部拒因之后、写盘之前；失败 ⇒ 原样上抛、本函数拒）
  const designTokens = consumeBatchDesignTokens(ctx?.agent ?? {}, abs)
  const date = todayLocal()
  const written = updateSectionStatusLine(src, 1, `已收口 ${date}`)
  writeFileSync(abs, written)
  onWritten?.(ctx?.agent ?? {}, abs)
  // 收口重锚（§6.2 · C · AC-M2-30）：顺序位 = 全部拒因通过、§1 状态行写盘**之后**（上两行）——close 被拒
  //（身份 ∥ 冻结 ∥ 链完整性门 ∥ 文档机检门）⇒ 台账零写（被拒的 close 没有收口，「原批已收口」那时是假事实）。
  const reanchor = await reanchorOnClose(abs, ctx?.agent?.cwd ?? process.cwd())
  return `batch: §1 status line → 「已收口 ${date}」 — the record is frozen: append is refused from now on, and status is refused except the reopen conjunction (§1 → 进行中 with a note) (整档冻结；改 = 新批新档; §6 内容与台账核销仍走既有通道).${gateReceiptLine(gate)}${designTokensReceiptLine(designTokens)}${reanchorReceiptLine(reanchor)}`
}

// ─── 收口自动消费本批设计凭证（DESIGN-TOKEN-SETTLEMENT §10——单源，close ∥ status 两通路同调）──

/** 「留槽无归属」枚数（§10 观测量）：并集视图里在旁列**无归属行**的槽数——含过期项（清点面
 *  照列；过期槽同样撑开写门，正是敞口本身）。只认旁列：注册表反查是显示面兜底、不是消费判据
 *  （旧槽不猜归属——KD-BG4）。 */
function unattributedSlotCount(agent, batches) {
  let n = 0
  for (const id of unionSlots(agent).keys()) if (!batches.has(id)) n++
  return n
}

/**
 * 收口自动消费（DESIGN-TOKEN-SETTLEMENT §10——两通路共调本函数，不复制逻辑）。四步：
 * ①非工程模式 ⇒ no-op（普通模式批无设计槽——槽只在工程模式评审 settle 时铸，`executeConsumeDesignAction` 同门）；
 * ②反查 = 内存 Map ∪ 槽文件旁列（`unionBatches`，**严格读** `{strict:true}`——旁列读不到即抛 ⇒ close 被拒，
 * §10「读形」；「没有」= 空集，不抛）取该 `abs` 名下的 designId 集；
 * ③空集 ⇒ no-op（重开后再 close 走这条——该批槽已被上一轮消费）；
 * ④调既有 `executeConsumeDesignAction({ designIds })`——单次落盘 + 内存整体回滚 + 逐枚回执全复用
 * （KD-BG6：不新写落盘 / 回滚逻辑，否则同一份语义写第二遍、两处必漂）。
 * **失败语义**：④抛 ⇒ **原样上抛**（消费核已把内存槽整体回滚）⇒ 调用方被拒、档零字节变、可重试——
 * 「已收口而凭证仍在」正是本节要消掉的窗口，不把它降级成一句回执。
 * @param {object} agent — 含 `config.agent.engineering` 与槽状态图
 * @param {string} abs — 本批批档绝对路径（收口目标，`pickTarget` 解析所得）
 * @returns {{consumed: number, unattributed: number}|null} 消费枚数 ∥ 留槽无归属枚数；`null` = no-op（非工程模式）
 */
export function consumeBatchDesignTokens(agent, abs) {
  if (!agent?.config?.agent?.engineering) return null
  const target = batchPathKey(abs)
  const batches = unionBatches(agent, { strict: true })
  const ids = [...batches]
    .filter(([, b]) => typeof b === "string" && batchPathKey(b) === target)
    .map(([id]) => id)
  if (ids.length === 0) return { consumed: 0, unattributed: unattributedSlotCount(agent, batches) }
  const held = unionSlots(agent) // 消费前态：与消费核同一并集视图（消费枚数 = 交集大小）
  const consumed = ids.filter((id) => held.has(id)).length
  executeConsumeDesignAction({ designIds: ids }, { agent })
  return { consumed, unattributed: unattributedSlotCount(agent, batches) }
}

/** 收口回执的凭证段（§10 回执形：单列 `[design tokens]` 一行——消费枚数 ∥ 留槽无归属枚数）；
 *  标签形与 `[ledger reanchor]` ∥ `[doc-check gate]` 一致（换行 + 方括号前缀）。`null`（普通模式
 *  no-op）⇒ 无该段——回执逐字旧形。 */
function designTokensReceiptLine(result) {
  if (!result) return ""
  return `\n[design tokens] 消费 ${result.consumed} 枚 · 留槽无归属 ${result.unattributed} 枚`
}

/** 收口重锚（设计档 §6.2 · C）——收口两条通路（`close` ∥ `status` 写 §1「已收口」）共调本函数（同一单源，
 *  不复制逻辑）；写入单源 = `ledgerReanchorBatch`（本档只供 `cwd` 基准与回执形；工具层零 SQL）。
 *  `cwd` = **批档所属项目根** = `resolveLedgerRoot(dirname(<batchDoc>), boundary)?.root`（§6.1 口径 2 同一子表达式）——
 *  **不用会话锚**：会话锚为多根工作区时可能收到别的项目根 ⇒ 选行零命中 ⇒ 唯一的机器写静默失效。
 *  `boundary` = 上溯上界 = **会话锚**（设计档 §3.8「界（单源）」——台账面同一枚界；缺则落进程 cwd）。
 *  无根 ⇒ 传 `null`（核心不取行、不重锚，`failed` 点名——不落兜底基准）。
 *  `batch` = 项目根相对路径（复启句的 `<批名>` 即其文件部分；绝对路径同样可解析，但句内会带整条绝对路径）。
 *  失败**不抛**（台账忙 ∥ 无根均不否决收口——档面写与台账库分属两存储，不做分布式事务）。 */
async function reanchorOnClose(abs, boundary) {
  try {
    const { ledgerReanchorBatch, resolveLedgerRoot } = await import("../ledger.mjs") // 动态 import：ledger-db 静态引 node:sqlite（W8 契约②）
    const root = resolveLedgerRoot(dirname(abs), boundary)?.root ?? null
    // 句内路径统一正斜杠（与 `task_book` 列值同形——`<批名>` 是给人读的事实句，不是平台路径）
    return ledgerReanchorBatch({ cwd: root, batch: root ? relative(root, abs).replace(/\\/g, "/") : abs, boundary })
  } catch (e) {
    // 非预期异常（模块加载失败 ∥ 根推导内读声明抛）同样不得否决收口——降为同一返回形（台账零写）
    return { batch: abs, reanchored: [], alreadyAnchored: [], failed: String(e?.message ?? e) }
  }
}

/** 重锚回执段（回执单源 = `ledgerReanchorBatch` 返回形——本档不另调选行再拼一次）：无未落行 ⇒ 无该段；
 *  失败 ⇒ 点名失败因（台账零写、冻结照常）；非空不覆盖形（复启句入 `evidence`）逐行点名。 */
function reanchorReceiptLine(result) {
  if (!result) return ""
  if (result.failed) return `\n[ledger reanchor] 未重锚：${result.failed}——台账零写；记录冻结照常完成`
  const line = (r) => `#${r.id} ${r.status} 「${r.title}」`
  const anchored = result.reanchored.map((r) => `${line(r)}→ 条件${r.sentenceTo === "evidence" ? "（resume_when 现值非空——原值保留，复启句追加 evidence）" : ""}`)
  const skipped = result.alreadyAnchored.map((r) => line(r))
  return [
    anchored.length ? `\n[ledger reanchor] 本批未落行 → 条件 ${anchored.length} 行：${anchored.join("；")}` : "",
    skipped.length ? `\n[ledger reanchor] 已是 条件（幂等跳过，零写）${skipped.length} 行：${skipped.join("；")}` : "",
  ].join("")
}
