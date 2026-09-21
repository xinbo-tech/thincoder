/**
 * agent-tools/batch-lifecycle.mjs — 批次档生命周期 action 面（KD-4 拆分中段）。
 *
 * create（建档，§4.11）/ status（段属主状态行流转，§4.12）/ close（收口冻结，§4.13）+
 * depth-0 在飞批定位（findInFlightBatch——D-BR21）。判定字面全部单源自 batch-skeleton.mjs
 * （SEGMENT_BY_ROLE / STATUS_WORDS / STATUS_LINE_RE / readBatchStatusLine / sectionHeaderRe /
 * batchSkeleton）；路径解析单源（resolveBatchDocPath / batchDocBases）与 #84 记账缝住 batch.mjs
 * 主档——**依赖单向（KD-4）：skeleton ← lifecycle ← 主档**，主档把解析后的 cwd/bases/目标闭包
 * 传进来，本档不回 import 主档（防环）。
 *
 * 身份判据（D-BR17/D-BR18/D-BR21）：主 agent 的工具调用 ctx 带 `depth === 0`（dispatch 装配）；
 * eng 子代理 `ctx.depth > 0`；评审实例 ctx 无 depth 但工具以 `review: true` 绑定。create/close
 * 仅 depth-0 放行（BR-19/BR-24「… is main-agent-only」）；status 写域 = 调用者自己段
 * （eng-designer → §2 · 评审 → §3 · eng-coder → §5 · 主 agent → §1——轮 2 #3 裁定②，§4/§6
 * 状态面走普通文档写）；depth-0 的 status/path 面按 D-BR21（可选 path，缺省 = 在飞批唯一时取）。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, resolve, sep } from "node:path"

import {
  SEGMENT_BY_ROLE, STATUS_WORDS, STATUS_LINE_RE, readBatchStatusLine, sectionHeaderRe, batchSkeleton,
} from "./batch-skeleton.mjs"

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

/** main-agent-only 门（BR-19/BR-24）：create/close 仅 depth-0 放行（eng 子代理 / 评审皆拒）。 */
function assertMainAgentOnly(ctx, action, review) {
  if (review || !isDepthZero(ctx)) {
    throw new Error(`batch: ${action} is main-agent-only — ${action} manages the record lifecycle and is depth-0 only (eng sub-agents and design reviews are refused).`)
  }
}

/**
 * depth-0 目标定位（D-BR21）：扫描全部基底根下 `*.md`，逐档读 §1 状态行判定 open
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
    let entries = []
    try { entries = readdirSync(root) } catch { continue }
    for (const name of entries) {
      if (!name.endsWith(".md")) continue
      const abs = resolve(root, name)
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

/** create 路径越界判据（fix 轮 #12）：解析后须落在某一基底根之内；win32 大小写不敏感比较。 */
function assertInsideBases(abs, bases, raw) {
  const norm = (p) => (process.platform === "win32" ? p.toLowerCase() : p)
  const target = norm(abs)
  for (const b of bases) {
    const root = norm(b)
    if (target === root || target.startsWith(root.endsWith(sep) ? root : root + sep)) return
  }
  throw new Error(`batch: create path resolves outside the batch-record base roots — a batch record must live under the declared docRoot.batches base (fail-closed). Path: ${raw}`)
}

/**
 * create——建档（§4.11，仅 depth-0）。六段骨架一次预齐（骨架模板单源 = batchSkeleton），
 * 建档即过 gate（§1 占位状态行含「进行中」）；fail-closed：非 .md / 越基底 / 目标已存在 ⇒ throw
 * （不覆盖既有批档，BR-20）；目录缺失 ⇒ mkdir -p 后落位（BR-25）。不代建台账条目。
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
  const abs = isAbsolute(raw) ? resolve(raw) : resolve(primary, raw.replace(/\\/g, "/"))
  assertInsideBases(abs, bases, raw)
  if (readableFile(abs)) {
    throw new Error(`batch: create target already exists — refusing to overwrite an existing batch record (fail-closed, BR-20): ${raw}`)
  }
  const topic = typeof args?.topic === "string" && args.topic.trim() ? args.topic.trim() : null
  if (!topic) {
    throw new Error("batch: create requires topic — the batch subject word shared by the record header (档名与档头共用——keep the file name aligned with it). Nothing was written.")
  }
  const date = typeof args?.date === "string" && args.date.trim() ? args.date.trim() : todayLocal()
  const prev = typeof args?.prev === "string" && args.prev.trim() ? args.prev.trim() : "无（独立批）"
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, batchSkeleton({ date, topic, prev }))
  onWritten?.(ctx?.agent ?? {}, abs)
  return `batch: created ${abs} — six-section skeleton written (§1 status line carries the gate-legal 「进行中」 placeholder; register the ledger entry yourself — create does not).`
}

/**
 * 段内状态行单行改写（status/close 共用——append-only 的唯一豁免，域限状态行）：
 * 定位 `## §N` 段（sectionHeaderRe 单源），段内找 STATUS_LINE_RE 行整行替换为
 * `**状态行**：<value>`；缺失则段首（标题行后）插状态行 + 空行。段界外字节零变；
 * EOL 形态（\r\n | \n）随档保持。段标题缺失 ⇒ throw（create 是骨架唯一权威入口）。
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
  const eol = src.includes("\r\n") ? "\r\n" : "\n"
  const lines = src.slice(hdr.index, endIdx).split(eol)
  const line = `**状态行**：${value}`
  const idx = lines.findIndex((l) => STATUS_LINE_RE.test(l))
  if (idx >= 0) lines[idx] = line
  else lines.splice(1, 0, line, "", "")
  return src.slice(0, hdr.index) + lines.join(eol) + src.slice(endIdx)
}

/** 冻结门（§4.9——append/status 同门；close 视为写同样过门）：closed/unknown 的错误串与
 *  append 面同字面（「已收口档不回改」/「状态行不可解析或缺失」）。 */
function assertGateOpen(src) {
  const gate = readBatchStatusLine(src)
  if (gate === "closed") {
    throw new Error("batch: 已收口档不回改 — the record's §1 status line contains 「已收口」, so the record is frozen: its body is never written to again (整档冻结；改 = 新批新档). Nothing was written.")
  }
  if (gate === "unknown") {
    throw new Error("batch: 状态行不可解析或缺失 — the record has no §1 `**状态行**：` line whose value contains 已收口 or 进行中 (fail-closed: the write is refused as if frozen). Nothing was written.")
  }
}

/** status 值域校验（fix 轮 #1 + 词面纪律）：值在**全词表 union**（各段项去重并集——含他段
 *  生命周期词与 §1 gate 词对）中必须恰命中一个关键字，且该关键字属于本段词表项——0 个 ⇒ 词表外
 *  拒；≥2 个 ⇒ 混词拒；唯一命中不属本段 ⇒ 词表外拒（该段值域不含）。「进行中…已收口」双词无论
 *  写哪段皆拒（最小词面：已收口优先误冻结防线——2026-09-20 词面纪律）。 */
function assertStatusValue(seg, value) {
  const words = Object.values(STATUS_WORDS[seg] ?? {})
  if (!words.length) {
    throw new Error(`batch: §${seg} has no status word list — status is undefined for this section (STATUS_WORDS 分段词表无该项). Nothing was written.`)
  }
  const vocabulary = [...new Set(Object.values(STATUS_WORDS).flatMap((w) => Object.values(w)))]
  const hits = vocabulary.filter((w) => value.includes(w))
  if (hits.length === 0 || (hits.length === 1 && !words.includes(hits[0]))) {
    throw new Error(`batch: status value ${JSON.stringify(value)} is not in the legal keyword set for §${seg} (${words.join(" / ")}) — STATUS_WORDS 分段词表是唯一值域（D-BR19）. Nothing was written.`)
  }
  if (hits.length > 1) {
    throw new Error(`batch: status value contains multiple keywords (${hits.join(" + ")}) — one status line carries exactly ONE keyword (词面纪律: mixed values mis-freeze via 已收口-priority). Nothing was written.`)
  }
}

/**
 * status——状态行流转（§4.12，段属主）。写域 = 调用者自己段内 `**状态行**：` 行（eng-designer →
 * §2 · 评审 → §3 · eng-coder → §5 · 主 agent → §1——轮 2 #3 裁定②）；值域 = STATUS_WORDS 该段项
 * 恰一词；冻结真值不变（gate 只读 §1）。path 参数 = 仅 depth-0（D-BR21）——子代理/评审传 path
 * ⇒ 拒（目标 = spawn/实例注入，语法上写不到别处）。
 * @returns {string} 成功消息
 */
export function statusBatchRecord({ args, ctx, review, pickTarget, onWritten }) {
  const depth0 = isDepthZero(ctx)
  const seg = review ? 3 : depth0 ? 1 : SEGMENT_BY_ROLE[ctx?.agent?._role] ?? null
  if (seg === null) {
    throw new Error("batch: no segment is writable by this caller — status writes the caller's OWN section (eng-designer → §2, design review → §3, eng-coder → §5, main agent → §1).")
  }
  // 声明段核对（BR-22「eng-designer 对 §1 调 status ⇒ 段白名单拒绝」——镜像 append 面：
  // segment 可声明，但声明段 ≠ 身份写域段 ⇒ 拒；身份写域段可省略——身份即写域）。
  const declared = args?.segment === undefined || args?.segment === null ? null : segmentNumber(args.segment)
  if (declared !== null && declared !== seg) {
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
  assertStatusValue(seg, value)
  const abs = pickTarget(args?.path)
  const src = readFileSync(abs, "utf8")
  assertGateOpen(src)
  const written = updateSectionStatusLine(src, seg, value)
  writeFileSync(abs, written)
  onWritten?.(ctx?.agent ?? {}, abs)
  return `batch: §${seg} status line updated to ${JSON.stringify(value)} — the freeze gate (§1) is a read-only domain for non-§1 writes (frozen truth stays = the §1 line).`
}

/**
 * close——收口冻结（§4.13，仅 depth-0）。§1 状态行 →「已收口 <YYYY-MM-DD>」；此后该档
 * append/status 全拒（冻结判据唯一真值 = §1 行——§4.9 零语义变）。对已收口档再 close ⇒ 拒
 * （close 本身是对冻结档的写）。不代写 §6 内容、不替代台账核销事务。
 * @returns {string} 成功消息
 */
export function closeBatchRecord({ args, ctx, review, pickTarget, onWritten }) {
  assertMainAgentOnly(ctx, "close", review)
  const abs = pickTarget(args?.path)
  const src = readFileSync(abs, "utf8")
  assertGateOpen(src)
  const date = todayLocal()
  const written = updateSectionStatusLine(src, 1, `已收口 ${date}`)
  writeFileSync(abs, written)
  onWritten?.(ctx?.agent ?? {}, abs)
  return `batch: §1 status line → 「已收口 ${date}」 — the record is frozen: append/status are refused from now on (整档冻结；改 = 新批新档; §6 内容与台账核销仍走既有通道).`
}
