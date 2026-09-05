/**
 * edit-diff.mjs — edit 工具的行级 diff 内核（TOOLS.md §15 D15.1，2026-09-04）。
 *
 * edit 新语义（用户裁定——breaking——不承诺旧行为兼容）：old_string = 变化区**当前内容**
 * （必须精确存在、单次匹配——不变）；new_string = 该区的**期望结果**。判定序：
 *   0. 分支 0（TOOLS.md §15.2——单行精确替换）：old 单行 && new 单行 && old 全文唯一 &&
 *      new 非空 → **就地替换该行**（行数不变——EOL 由调用方 joinWithEol 恢复）；
 *   1. 零重叠（old 每一行都不出现在 new 行集中）→ 按**插入**——new 整体插入在 old
 *      最后一行之后（旧内容保留——数据零丢失）；
 *   2. 有公共行（≥1）→ 行级 LCS——公共行保留、差异行增删；
 *   3. new 与 old 行级完全一致 → 原样替换（no-op 语义——仍报成功）。
 * 空 new_string（纯删除意图）→ 显式报错（不静默——先于分支 0——单行替换永不成删除）；
 * 分支 0 只在 computeEditEntry 条目判定层（壳/桥/批量自动继承）——applyPatchLines
 * （纯 diff 层）语义不动。old/new 行数各上限 1000（超限报错）。
 *
 * 行尾权威 = EDIT-TOOL-EOL-DESIGN.md：判定/应用在 normalizeEOL 后的 LF 域计算，
 * 写回由调用方 joinWithEol(原文) 恢复原行尾。
 * 模块拆分（file.mjs ≤500 硬限）：file.mjs 只留工具壳与转发——单形态执行体与前置校验
 * 分支整段迁出至本模块（模块拆分写优先纪律：先迁后删、逻辑体不变、wiring 导入）。
 */
import { readFile, writeFile } from "node:fs/promises"
import {
  resolveInCwd, normalizeEOL, joinWithEol, gitDiffOne, autoSyntaxCheck, findCandidates,
} from "./shared.mjs"
// file.mjs ↔ edit-diff.mjs 循环引用：两侧导入的都是函数声明（提升初始化），
// 仅在调用期使用——ESM 循环下安全（无模块求值期取值）。
import { recordWrite, appendWriteContext, lastWriteOf, isDirty } from "./file.mjs"

export const MAX_DIFF_LINES = 1000
export const REGION_TOO_LARGE = "edit region too large — narrow the change"
export const EMPTY_NEW_STRING = "empty new_string — for deletion, keep the context lines you want to preserve in both old_string and new_string"
export const EDIT_ARGS_MUTEX = "edits array is mutually exclusive with top-level old_string/new_string — a top-level path is allowed (default for entries without their own path); provide each change's old_string/new_string inside its edits entry"

/** 行切分（尾随换行终止最后一行——非额外空行）："a\nb\n" → ["a","b"]。 */
function splitLines(text) {
  const lines = text.split("\n")
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop()
  return lines
}

/**
 * 行级 LCS（整行相等判定）合并：公共行保留（LCS 序）、old 独有行删除、new 独有行按其在
 * new 中相对公共行的位置插入。结果在 LF 域；区域尾随换行随 oldText（区域边界保持）。
 * 返回 { ok: true, resultText } 或 { ok: false, reason }。
 */
export function applyPatchLines(oldText, newText) {
  if (newText === "") return { ok: false, reason: EMPTY_NEW_STRING }
  const oldLines = splitLines(oldText)
  const newLines = splitLines(newText)
  if (oldLines.length > MAX_DIFF_LINES || newLines.length > MAX_DIFF_LINES) {
    return { ok: false, reason: REGION_TOO_LARGE }
  }
  // 判定 1（F15.2）：零重叠 → 插入——new 整体插在 old 最后一行之后（旧内容保留）
  const newSet = new Set(newLines)
  const merged = oldLines.some((l) => newSet.has(l))
    ? lcsMerge(oldLines, newLines) // 判定 2/3——公共行保留、差异行增删
    : [...oldLines, ...newLines]
  return { ok: true, resultText: merged.join("\n") + (oldText.endsWith("\n") ? "\n" : "") }
}

/** LCS 推导（DP + 回溯）——整行相等判定；结果 = 公共行 + 差异行增删的合并序列。 */
function lcsMerge(a, b) {
  const n = a.length
  const m = b.length
  const width = m + 1
  const dp = new Uint16Array((n + 1) * width)
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i * width + j] = a[i - 1] === b[j - 1]
        ? dp[(i - 1) * width + (j - 1)] + 1
        : Math.max(dp[(i - 1) * width + j], dp[i * width + (j - 1)])
    }
  }
  const merged = []
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      merged.push(a[i - 1])
      i--
      j--
    } else if (dp[(i - 1) * width + j] >= dp[i * width + (j - 1)]) {
      i-- // old 独有行——删除
    } else {
      merged.push(b[j - 1]) // new 独有行——按 LCS 相对位置插入
      j--
    }
  }
  while (j > 0) { merged.push(b[j - 1]); j-- }
  return merged.reverse()
}

/**
 * D15.3#9 修订（2026-09-05 用户裁定——顶层 path + edits 并存合法化：顶层 path = 无自带
 * path 条目的默认——模型直觉形态「顶层 path + 数组条目」不再拒绝；条目自带 path 优先）。
 * 互斥收窄为只对顶层 old_string/new_string——edits 下它们无批语义可解释——顶层 path 不再触发。
 */
export function assertEditArgsExclusive(args) {
  if (args.old_string !== undefined || args.new_string !== undefined) {
    throw new Error(EDIT_ARGS_MUTEX)
  }
}

/**
 * 前置校验（空 old / 非字符串 new）——error 文本按调用形态（单形态 rich / 批量 label）。
 * opts: { label = ""（批量前缀 "edit for <path>: "）, rich = true（单形态完整文本） }
 */
export function validateEditEntry(entry, opts = {}) {
  const label = opts.label ?? ""
  if (!entry.old_string) {
    throw new Error(
      label + "old_string must not be empty" + (opts.rich === false ? "" : " (empty string matches everywhere and would corrupt the file)")
    )
  }
  if (typeof entry.new_string !== "string") {
    throw new Error(
      label + `new_string must be a string${entry.new_string === undefined ? " (missing)" : ` (got ${typeof entry.new_string})`}` +
      (opts.rich === false ? "" : " — nothing written")
    )
  }
}

/**
 * 分支 0 形态判定（TOOLS.md §15.2 D15.9.1）：old/new 各为单行——无内部换行（splitLines
 * 语义：尾随单个换行符是行终止而非新行——old/new 行内容均不含 \n）——且 new 非空
 * （"" 经 splitLines 切分为 []——由下方 !== "" 守卫先拦截——空 new 不落本分支——落
 * applyPatchLines 的空 new 显式错误——单行替换永不成删除）。多匹配与 replace_all 不落
 * 本分支（occurrences 错误 / 字面全部先行）。
 */
function isSingleLineReplace(entry) {
  return (
    entry.new_string !== "" &&
    splitLines(entry.old_string).length === 1 &&
    splitLines(entry.new_string).length === 1
  )
}

/**
 * 条目级判定+应用（单形态与批量共用——D15.1"批量条目判定+应用调用 edit-diff"）：
 * 匹配校验（精确存在——非 replace_all 单次）→ 按判定序应用（分支 0 单行替换 / 零重叠插入 /
 * LCS 替换 / replace_all 字面）→
 * 元数据（受影响区首行/行数差/次数——recordWrite 与结果回显用）。
 * 返回 { updated, editStartLine, lineShift, occurrences }；失败抛错（含路径/引导）。
 * opts: { path, abortPrefix（批量 "edit aborted (atomic — no files written): "） }
 */
/**
 * P15.11（2026-09-05 用户裁定——edit 连续失败分析）：old_string 逐字 not-found 时——
 * 若文件中存在**唯一**窗口：行数与 old 相同、逐行 trim() 相等（内容零差异——差异仅前导/
 * 尾随空白——EOL 已在 normalize 域消除）→ 返回 { actual }（actual = 文件窗口原文）；
 * 多窗口（两处 trim 同内容不同空白）→ null（歧义不猜——报错引导）；old 含尾换行 → null
 * （终止符语义边界——不做窗口猜测）。模型从 read 记忆拷贝 old_string 时丢/加前导空格是
 * 纯机械损耗（本轮 12 次 edit 失败中 8 次空白差异）——内容零差异时自动落点 + 结果明示。
 */
function findWhitespaceVariant(content, old) {
  if (old.endsWith("\n")) return null
  const oldLines = old.split("\n")
  const fileLines = content.split("\n")
  const m = oldLines.length
  if (m === 0 || fileLines.length < m) return null
  const trimmed = oldLines.map((l) => l.trim())
  let hit = null
  for (let i = 0; i + m <= fileLines.length; i++) {
    let same = true
    for (let j = 0; j < m; j++) {
      if (fileLines[i + j].trim() !== trimmed[j]) { same = false; break }
    }
    if (!same) continue
    const actual = fileLines.slice(i, i + m).join("\n")
    if (actual === old) continue // 逐字已匹配——occurrences=0 前提下不会发生
    if (hit) return null // 多窗口空白差异 → 歧义 → 不猜
    hit = { actual }
  }
  return hit
}

/**
 * P15.11 note 文案（各端成功消息追加——双端同句）
 */
export const WHITESPACE_VARIANT_NOTE = "applied to the unique whitespace-only match (content identical, leading/trailing whitespace differs from your old_string)"

export function computeEditEntry(content, entry, opts = {}) {
  validateEditEntry(entry, { ...opts, rich: !opts.abortPrefix })
  // P15.11：not-found 时先查唯一空白差异窗口——命中则以其原文为实际 old 继续（内容零差异
  // ——自动落点 + note 明示）；实质差异/歧义仍走下方 not-found 报错（不猜内容）。
  let old = entry.old_string
  let occurrences = content.split(old).length - 1
  let note = null
  if (occurrences === 0) {
    const variant = findWhitespaceVariant(content, old)
    if (variant) { old = variant.actual; occurrences = 1; note = WHITESPACE_VARIANT_NOTE }
  }
  if (occurrences === 0) {
    const preview = entry.old_string.slice(0, 100).split("\n")[0]
    const cands = findCandidates(content.split("\n"), entry.old_string)
    let candText = ""
    if (cands.length > 0) {
      const header = entry.old_string.includes("\n")
        ? `  similar lines (old_string line 1: "${entry.old_string.split("\n")[0].slice(0, 80)}"):`
        : "  similar lines:"
      candText = "\n" + header + "\n" + cands.map((c) => `    L${c.line}: ${c.preview} (${Math.round(c.score * 100)}%)`).join("\n")
    }
    throw new Error(
      `${opts.abortPrefix ?? ""}old_string not found in ${opts.path ?? "file"}\n` +
      `  searched: "${preview}${entry.old_string.length > 100 ? "…" : ""}" — use grep to locate the actual content\n` +
      (opts.absPath && lastWriteOf(opts.absPath)?.type === "write"
        ? `  hints: this file was modified since your last read (write 全文重写后内容全变) — re-read it to refresh your copy of the content, then retry\n`
        : opts.absPath && isDirty(opts.absPath)
          ? `  hints: this file was modified since your last read (a prior write marked it dirty) — re-read it to refresh your copy of the content, then retry\n`
          : `  hints: whitespace mismatch? file already changed? try reading the file first\n`) +
      candText
    )
  }
  if (occurrences > 1 && !entry.replace_all) {
    throw new Error(
      `${opts.abortPrefix ?? ""}old_string matches ${occurrences} times in ${opts.path ?? "file"}; provide more context or set replace_all`
    )
  }
  const matchIdx = content.indexOf(old)
  const editStartLine = matchIdx >= 0 ? content.slice(0, matchIdx).split("\n").length : 1
  let updated
  let resultForShift
  if (entry.replace_all) {
    // 字面替换——不做插入规则（old 多处时"插到哪处"无定义）——不落分支 0（§15.2 D15.9.2）
    updated = content.split(old).join(entry.new_string)
    resultForShift = entry.new_string
  } else if (isSingleLineReplace(entry)) {
    // 分支 0（§15.2 D15.9.1——单行精确替换）：old 单行 && new 单行 && old 唯一匹配
    // （occ==1 既有校验保证）&& new 非空（空 new 显式错误先于本分支——防删除）→ **就地
    // 替换该行**——不再零重叠插入（P15.8——行尾段编辑反复踩的插入坑）。只替换行内容段：
    // old/new 的尾随换行符属文件结构而非行内容——留在原位——行数不变——EOL 由调用方
    // joinWithEol 恢复（normalizeEOL 后本域为 LF）。边界声明（评审 2026-09-04）：new 为
    // 行内容空串（如 new="\n"——置空行意图）时，常规带终止换行的行变空行（行数不变）；
    // 唯一例外是**无终止换行的末行**被置空——该行随文件结束自然消失（行数 −1——文件格式
    // 固有边界——空行无法表达）——不落 EMPTY_NEW_STRING 错误路径（new 本身非空串）。
    const oldLine = splitLines(old)[0]
    const newLine = splitLines(entry.new_string)[0]
    updated = content.slice(0, matchIdx) + newLine + content.slice(matchIdx + oldLine.length)
    resultForShift = newLine
  } else {
    const r = applyPatchLines(old, entry.new_string)
    if (!r.ok) throw new Error(r.reason)
    updated = content.slice(0, matchIdx) + r.resultText + content.slice(matchIdx + old.length)
    resultForShift = r.resultText
  }
  // 行数差 = 应用后区域行数 − 旧区域行数（分支 0 单行替换：0；插入：new 行数；LCS：new−old）
  const lineShift = splitLines(resultForShift).length - splitLines(old).length
  return { updated, editStartLine, lineShift, occurrences: entry.replace_all ? occurrences : 1, note }
}

/**
 * 单形态 edit 执行体（自 file.mjs 整段迁出——模块拆分写优先纪律：逻辑体不变）——
 * file.mjs 只留工具壳与转发。
 */
export async function runSingleEdit(args, ctx) {
  const abs = resolveInCwd(ctx, args.path)
  const raw = await readFile(abs, "utf8")
  const content = normalizeEOL(raw)
  const out = computeEditEntry(content, args, { path: args.path, absPath: abs })
  // 写回按原文行尾（joinWithEol）——normalizeEOL 先行避免 \r\n 污染 split/join
  await writeFile(abs, joinWithEol(normalizeEOL(out.updated).split("\n"), raw), "utf8")
  recordWrite(abs, { type: "edit", startLine: out.editStartLine, shift: out.lineShift })
  const diff = gitDiffOne(ctx.cwd, abs)
  const baseResult = `Edited ${args.path}: replaced ${out.occurrences} occurrence(s)${out.note ? ` — ${out.note}` : ""}${diff ? "\n" + diff : ""}${await autoSyntaxCheck(abs)}`
  return await appendWriteContext(abs, out.editStartLine, baseResult)
}
