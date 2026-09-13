/**
 * edit-fuzzy-match.mjs — edit 工具 old_string 模糊匹配子模块
 * （EDIT-TOOL-IMPROVEMENT.md D2/F2 + 评审 #2 歧义规则，2026-09-08）。
 *
 * 拆分缘由：file-edit.mjs 500 行硬帽（与 edit-line-params.mjs 同批拆分——评审 #4
 * 拆分边界只定了按行号改子模块；D2 模糊匹配落地后 file-edit.mjs 仍超帽，模糊匹配
 * 逻辑独立成此模块——2026-09-08 实现期补充，交付报告列明）。
 *
 * 语义契约：
 *   - 行级 normalize（EDIT.md §8.2 统一基准——与 CLI normalizeEditLine 逐字同算法）：
 *     ① 去首尾空白 + 去行尾空格；② tab → 2 空格；③ 引号**单遍逐字符映射**——ASCII 单
 *     引号 / 弯引号 ‘ ’ “ ” / 反引号 → 直双引号 "。**不做行内 \s+ 折叠**（折叠吞缩进/
 *     对齐可能误匹配结构不同行——缩进/对齐是结构信息）。仅用于匹配比较——替换永远用原文窗口。
 *   - 滑动窗口（行数 = old 行数，尾换行是终结符）逐行 normalize 比较，相等行比例
 *     ≥90% 即模糊命中。
 *   - 歧义规则（评审 #2）：唯一模糊命中才应用；多命中由调用方报错并附候选
 *     （fuzzyAmbiguousBlock——沿用 similarLinesBlock 机制风格），不猜。
 */

/** 引号归一目标字符（8.2 评审 #2 定稿——直双引号；ASCII 单引号同映射——单遍无顺序依赖） */
const QUOTE_TO_DOUBLE = {
  "'": '"', "\u2018": '"', "\u2019": '"', "\u201c": '"', "\u201d": '"', "`": '"',
}

/**
 * old_string 模糊匹配的行级 normalize（契约见头注释——与 CLI normalizeEditLine 同算法：
 * tab→2 空格 / 引号单遍映射 / trim + 去行尾空格；无行内折叠）。
 */
export function normalizeLineFuzzy(l) {
  let out = ""
  for (const ch of l) {
    if (ch === "\t") out += "  "
    else out += QUOTE_TO_DOUBLE[ch] ?? ch
  }
  return out.replace(/\s+$/g, "").trim()
}

/** D2 模糊命中成功消息追加文案 */
export const FUZZY_MATCH_NOTE = "applied to the unique fuzzy match (≥90% of lines equal after whitespace/quote normalization)"

/**
 * old_string 模糊匹配（契约见头注释）。返回：
 *   { hit: { actual, index } }   —— 唯一模糊命中（actual = 文件窗口原文，LF 域）
 *   { ambiguous: [i, ...] }      —— 多命中（调用方报错并附候选，不猜）
 *   null                         —— 无命中（或逐字可命中——精确匹配域优先）
 */
export function findFuzzyMatch(text, old) {
  const oldLines = old.split("\n")
  if (old.endsWith("\n")) oldLines.pop()
  const m = oldLines.length
  if (m === 0) return null
  const norm = oldLines.map(normalizeLineFuzzy)
  const fileLines = text.split("\n")
  if (fileLines.length < m) return null
  // 全文件行一次性 normalize——滑窗内不重复计算（O(n) 而非 O(n·m)）
  const normFile = fileLines.map(normalizeLineFuzzy)
  const hits = []
  for (let i = 0; i + m <= fileLines.length; i++) {
    let eq = 0
    for (let j = 0; j < m; j++) {
      if (normFile[i + j] === norm[j]) eq++
    }
    if (eq / m >= 0.9) hits.push(i)
  }
  if (hits.length === 0) return null
  if (hits.length > 1) return { ambiguous: hits }
  const i = hits[0]
  const actual = fileLines.slice(i, i + m).join("\n")
  if (actual === old) return null // 逐字命中走精确匹配域，不算模糊
  return { hit: { actual, index: i } }
}

/** D2 歧义报错候选块（沿用 similarLinesBlock 机制风格——行号 + 预览） */
export function fuzzyAmbiguousBlock(text, hits) {
  const fileLines = text.split("\n")
  return "\n  fuzzy-match candidates:\n" +
    hits.map((i) => `    L${i + 1}: ${fileLines[i].trim().slice(0, 80)}`).join("\n")
}
