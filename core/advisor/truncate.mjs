/**
 * truncate.mjs — advisor 工具结果的行感知双端截断（DUAL-END-TRUNCATION F-2，
 * thincoder/docs/design/_archive/DUAL-END-TRUNCATION.md，2026-09-09）。
 *
 * 原 run.mjs 内联截断为纯头向（line-aware 从首行累加至 64K break）——评审尾部
 * 结论/裁决被切。现改头尾双保：头行累加至预算 ~60% → 中段省略注 → 尾行累加至
 * 剩余 ~40%（保尾结论——与 read 工具 C 方案 / offload 双端预览同构的
 * "头+尾保留、中段截断"策略——共享设计语言、分别实现）。
 *
 * 纯函数无导入：maxChars 由调用方传入（run.mjs 传 MAX_RESULT_CHARS）。
 */

/** advisor 截断头占比——头行累加至此份额后切中段，尾自动取剩余预算（设计 §4 ≈0.6）。 */
export const ADVISOR_HEAD_RATIO = 0.6

/** 尾部预算预留（字符）：中段省略注 + offset 续读提示的保守预留——注的位数只减不增
 *  （middle ≤ totalChars——超大结果位数可达 ~10 位——200 字符仍宽松覆盖注+提示 ≤ ~140；
 *  差额留给尾行）。 */
const NOTE_RESERVE_CHARS = 200

/**
 * 行感知双端截断：result > maxChars → 头 + `… (truncated: K more lines, TOTAL chars
 * total)` + 尾 + offset 续读提示；≤ maxChars 原样返回（无假截断注）。K = 头尾之间
 * 的中段行数——头(≤60%) + 尾(≤余预算) 均行级累加、绝不半行切开；中段存在时 K ≥ 1
 * （防御：K ≤ 0 时静默返回头尾拼合——不谎报截断）。
 */
export function truncateAdvisorResult(result, maxChars) {
  if (result.length <= maxChars) return result
  const totalChars = result.length
  const lines = result.split("\n")
  const headBudget = Math.floor(maxChars * ADVISOR_HEAD_RATIO)
  let head = ""
  let headLines = 0
  let chars = 0
  while (headLines < lines.length && chars + lines[headLines].length + 1 <= headBudget) {
    chars += lines[headLines].length + 1
    head += lines[headLines] + "\n"
    headLines++
  }
  const tailBudget = Math.max(0, maxChars - chars - NOTE_RESERVE_CHARS)
  let tail = ""
  let tailChars = 0
  let tailStart = lines.length
  while (tailStart > headLines && tailChars + lines[tailStart - 1].length + 1 <= tailBudget) {
    tailChars += lines[tailStart - 1].length + 1
    tailStart--
    tail = lines[tailStart] + "\n" + tail
  }
  const middle = tailStart - headLines
  if (middle <= 0) return head + tail // 头尾已覆盖全部行——绝不产生假截断注
  return (
    head +
    `\n… (truncated: ${middle} more lines, ${totalChars} chars total)\n` +
    tail +
    `To see more content, use: read(path, offset=${headLines + 1}, limit=200)`
  )
}
