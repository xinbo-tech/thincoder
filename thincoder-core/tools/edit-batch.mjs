/**
 * edit-batch.mjs — edit 工具的数组形态（edits: [...]）：一次多文件原子替换。
 * （2026-08-31 工具顺手度 §9 ②；2026-09-01 缺陷修复"同文件多条串行累积"；
 * 2026-09-04 EDIT.md §6——条目级判定+应用迁至 edit-diff.mjs——批量调共用。）
 *
 * 语义：同一 path 的多条编辑按序**串行累积应用**——第 n 条基于前 n-1 条已应用后的
 * 累积内容做匹配与替换；跨 path 条目互不影响（并行原子语义）；任一条失败 →
 * 全不写（原子性保留）。每条目独立按判定序（EDIT.md §4——分支 0 单行替换 / 零重叠→替换即删 /
 * LCS / 空 new 显式报错；EDIT.md §5（约束——删行形态）：省略 new_string = 删行。顶层 path
 * （args.path）为无自带 path 条目的默认（2026-09-05 用户裁定——条目自带 path 优先——见
 * EDIT.md §5 修订注）。
 */
import { readFile } from "node:fs/promises"
import { resolveInCwd, normalizeEOL, joinWithEol, gitDiffOne, autoSyntaxCheck } from "./shared.mjs"
// edit-batch ↔ edit-diff 循环引用（#69 后同型）：两侧导入的都是函数声明（提升初始化），
// 仅在调用期使用——ESM 循环下安全（无模块求值期取值）。
// 写盘经单一写路径点（§2.13.5）——本档不再直调 fs；回执组装迁 composeEditReceipt（#69）。
import { writeThroughPath } from "./write-path.mjs"
// EDIT.md §6：批量条目判定+应用共用 edit-diff（EDIT.md §4 分支 0 单行替换 + 行级 LCS——零重叠→替换即删）；
// EDIT.md §5：edits 互斥错误文本随前置校验分支迁出至 edit-diff.mjs。
// #69：回执组装共用 edit-diff 的 composeEditReceipt（回执形态按端注入——缺省 = CLI 形态）。
import { assertEditArgsExclusive, assertEditsContainer, assertEditEntries, validateEditEntry, computeEditEntry, splitLines, EMPTY_NEW_STRING_LINE, EDIT_ENTRY_NO_PATH, EDIT_ABORT_PREFIX, editEntryLabel, deleteTarget, composeEditReceipt } from "./edit-diff.mjs"

/**
 * Apply the `edits` array form: multi-file atomic replacement. Throws on any
 * failure (atomic — nothing written). Returns the per-entry result text (joined).
 */
export async function applyEditBatch(args, ctx) {
  assertEditsContainer(args.edits)
  assertEditArgsExclusive(args)
  assertEditEntries(args.edits) // #325 条目预扫（非对象条目 ⇒ 含下标成形错误；不读盘）
  // 原子：先全量检查（所有文件的替换都可执行）——任一失败全不写。
  // 2026-09-01 缺陷修复（TOOLS.md §9 ②"同文件多条规则"）：同一 path 的多条编辑
  // 按序**串行累积应用**——第 n 条基于前 n-1 条已应用后的累积内容做匹配与替换
  // （原实现每条都基于盘上原始内容计算、写盘循环后置，同文件后者覆盖前者 →
  // 除最后一条外全部静默丢失）；跨 path 条目互不影响（并行原子语义不变）。
  const groups = new Map() // abs → 每文件一条流水线
  for (const e of args.edits) {
    // 2026-09-05 用户裁定：顶层 path + edits 并存合法化——`e.path || args.path`（条目优先；
    // 缺省入口仅在此兜底）；两者皆无 → 原错误文本（措辞补顶层选项）。
    const p = e.path || args.path
    if (!p) throw new Error(EDIT_ENTRY_NO_PATH)
    // 前置校验（空 old / 非字符串 new——文本同 edit-diff 批量形态；读盘前校验）
    validateEditEntry(e, { label: editEntryLabel(p), rich: false })
    const abs = resolveInCwd(ctx, p)
    let g = groups.get(abs)
    if (!g) {
      const raw = await readFile(abs, "utf8")
      g = { abs, path: p, raw, content: normalizeEOL(raw), edits: [] }
      groups.set(abs, g)
    }
    g.edits.push(e)
  }
  const prepared = [] // 每条目一条回显；同文件内按 args 序，跨文件按首次出现分组序（应用/回显语义均正确）
  for (const g of groups.values()) {
    g.netShift = 0 // 组内行数差累积（合并快照的 shift = 全组净漂移）
    for (const e of g.edits) {
      // 条目级判定+应用（edit-diff——EDIT.md §4 分支 0 单行替换 + 判定序 1/2/3 + 空 new 显式报错 +
      // >1000 行报错（diff 形态——D1 行号条目走 applyLineEdit，不经 LCS，无此上限））
      const out = computeEditEntry(g.content, e, {
        path: g.path,
        absPath: g.abs,
        abortPrefix: EDIT_ABORT_PREFIX,
      })
      prepared.push({
        g,
        editStartLine: out.editStartLine, // 基于累积内容计算——已天然计入前面条目的行偏移，不再累加
        lineShift: out.lineShift,
        occurrences: out.occurrences,
        note: out.note ?? null, // P15.11——空白差异自动落点标记（成功消息追加）
        deleted: out.deleted ?? false, // 删行形态（EDIT.md §5）——结果文本用 Deleted 前缀
      })
      g.content = out.updated // 串行累积：下一条基于本条应用后的内容
      g.netShift += out.lineShift
    }
  }
  // 全部检查通过——每文件一次写盘（同文件多条：写入串行累积后的最终内容）；
  // recordWrite 每组一条合并快照：startLine = 组内**所有**编辑受影响行的最小值
  // （#2，2026-09-01 交付评审尾巴——原实现取首条 = 调用序第一条，逆序条目时
  // 护栏下界过高、受影响区内的 insert_after 被放行），shift = 全组行数差累积
  // ——受影响区护栏覆盖组内所有编辑
  for (const g of groups.values()) {
    const startLine = Math.min(...prepared.filter((p) => p.g === g).map((p) => p.editStartLine))
    // 单一写路径点：默认 = writeFile + 记账；端侧注入 ⇒ 编辑器径（§2.13.5）。
    await writeThroughPath(g.abs, joinWithEol(normalizeEOL(g.content).split("\n"), g.raw), {
      op: "write",
      record: { type: "edit", startLine, shift: g.netShift },
    })
  }
  const results = []
  for (const p of prepared) {
    // #4（2026-09-01 交付评审尾巴）：与单文件路径对齐——每条结果附 git diff +
    // autoSyntaxCheck（同文件多条会重复 diff/检查，换取格式一致、实现零分支）
    const diff = gitDiffOne(ctx.cwd, p.g.abs)
    const base = p.deleted
      ? `Deleted ${deleteTarget(p)} of ${p.g.path}${diff ? "\n" + diff : ""}${await autoSyntaxCheck(p.g.abs)}`
      : `Edited ${p.g.path}: replaced ${p.occurrences} occurrence(s)${p.note ? ` — ${p.note}` : ""}${diff ? "\n" + diff : ""}${await autoSyntaxCheck(p.g.abs)}`
    results.push(await composeEditReceipt({
      abs: p.g.abs,
      path: p.g.path,
      writeLine: p.editStartLine,
      base,
      deleted: p.deleted === true,
      occurrences: p.occurrences,
      note: p.note,
    }))
  }
  return results.join("\n")
}

// ---------------------------------------------------------------------------
// 2026-09-08 edit 语义升级（EDIT.md §2/§3——D1 按行号改 / D2 模糊匹配，落点定死本模块；
// 条目判定接线在 edit-diff.mjs computeEditEntry——单形态/批量/ACP 桥三通道自动继承；
// 阶段 2 删行形态见 EDIT.md §5（约束）。以下均为纯函数（无 IO）——edit-diff.mjs 调用期导入
// （ESM 循环引用安全：两侧仅函数声明，提升初始化——同 file.mjs ↔ edit-diff.mjs 先例）。

/**
 * D2 行级 normalize（EDIT.md §3——匹配档位；阶段 2 normalize 统一基准——双端同算法）：
 * ① 去首尾空白 + 去行尾空格；② tab → 2 空格；③ 引号**单遍逐字符映射**——ASCII 单引号 /
 * 弯引号 ‘ ’ “ ” / 反引号 → 直双引号 "（评审 #2 定稿目标字符 = "——与 ASCII 单引号规则
 * 合并为单遍映射，无顺序依赖——防两端分叉）。**不做行内 \s+ 折叠**——缩进/对齐是结构信息，
 * 折叠会误匹配文字相似但结构不同的行（统一基准 5——CLI 从未折叠，防误配回归）。仅用于匹配
 * 比较——替换永远用文件原文窗口。
 */
const QUOTE_TO_DOUBLE = {
  "'": '"', "\u2018": '"', "\u2019": '"', "\u201c": '"', "\u201d": '"', "`": '"',
}
export function normalizeEditLine(line) {
  let out = ""
  for (const ch of line) {
    if (ch === "\t") out += "  "
    else out += QUOTE_TO_DOUBLE[ch] ?? ch
  }
  return out.replace(/\s+$/g, "").trim()
}

/** D2 模糊匹配阈值：行级 normalize 后逐行相等比例 ≥0.9 即匹配（评审 #4 定稿）。 */
export const FUZZY_MATCH_THRESHOLD = 0.9
/** D2 成功消息追加 note（双端同句——同 WHITESPACE_VARIANT_NOTE 机制）。 */
export const FUZZY_MATCH_NOTE = "applied via fuzzy match (≥90% of lines identical after whitespace/indent/quote normalization)"

/**
 * D2 模糊匹配（P15.11 空白自动落点的推广——逐字/trim 等价都失败后的最后一档）：
 * 找文件中**唯一**窗口——行数与 old 相同、normalizeEditLine 后逐行相等比例 ≥90% →
 * 返回 { actual }（actual = 文件窗口原文）；多窗口达标 → null（歧义不猜——走 not-found
 * 报错引导）；old 含尾换行 → null（终止符语义边界——同 P15.11）。比例向上取整行数：
 * 需要相等行数 = ceil(m × 0.9)（m=1 即 normalize 后全等——单行细微差异由此命中）。
 */
export function findFuzzyWindow(content, old) {
  if (old.endsWith("\n")) return null
  const oldLines = old.split("\n")
  const m = oldLines.length
  const fileLines = content.split("\n")
  if (m === 0 || fileLines.length < m) return null
  const norm = oldLines.map(normalizeEditLine)
  const need = Math.ceil(m * FUZZY_MATCH_THRESHOLD)
  let hit = null
  for (let i = 0; i + m <= fileLines.length; i++) {
    let eq = 0
    for (let j = 0; j < m; j++) {
      if (normalizeEditLine(fileLines[i + j]) === norm[j]) eq++
    }
    if (eq < need) continue
    const actual = fileLines.slice(i, i + m).join("\n")
    if (actual === old) continue // 逐字已匹配——occurrences=0 前提下不会发生
    if (hit) return null // 多窗口达标 → 歧义 → 不猜
    hit = { actual }
  }
  return hit
}

/**
 * D1 按行号改（EDIT.md §2/§5——F1）：entry 带 line（单行）或 startLine/endLine（1-based
 * 闭区间）→ 直接按行号替换该行/行范围为 new_string（无需 old_string——互斥校验在
 * validateEditEntry）。阶段 2 删行形态（EDIT.md §5——裁定 A）：**省略 new_string =
 * 删除该行/范围**（意图有界——删哪行是显式声明）；显式空串 `new_string: ""` →
 * EMPTY_NEW_STRING_LINE 显式报错（模板生成 new_string 但落空 ≠ 删行意图——防误删）。
 * 内容域 = normalizeEOL 后 LF（与 computeEditEntry 同域）；尾随换行随原文件保持（删到
 * 文件为空 → ""——无剩余行即无终止符）。行号越界 → 明确报错。原子性由调用方保证
 * （本函数纯计算）。
 * 返回 { updated, editStartLine, lineShift, occurrences, note, deleted? }（同 computeEditEntry 形态）。
 */
export function applyLineEdit(content, entry, opts = {}) {
  const prefix = opts.abortPrefix ?? ""
  if (entry.new_string === "") throw new Error(prefix + EMPTY_NEW_STRING_LINE)
  const lines = splitLines(content)
  const start = entry.line ?? entry.startLine
  const end = entry.line ?? entry.endLine
  if (start > lines.length || end > lines.length) {
    throw new Error(prefix + `line ${end > lines.length ? end : start} out of range — ${opts.path ?? "file"} has ${lines.length} line(s)`)
  }
  const removed = end - start + 1
  if (entry.new_string === undefined) {
    // 删行/删范围（EDIT.md §5）——省略 new_string：受影响行整体移除
    const remaining = [...lines.slice(0, start - 1), ...lines.slice(end)]
    const updated = remaining.join("\n") + (remaining.length > 0 && content.endsWith("\n") ? "\n" : "")
    return { updated, editStartLine: start, lineShift: -removed, occurrences: 1, note: null, deleted: true }
  }
  const newLines = splitLines(entry.new_string)
  const updated = [...lines.slice(0, start - 1), ...newLines, ...lines.slice(end)].join("\n") +
    (content.endsWith("\n") ? "\n" : "")
  return { updated, editStartLine: start, lineShift: newLines.length - removed, occurrences: 1, note: null }
}
