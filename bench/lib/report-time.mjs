/**
 * lib/report-time.mjs — 报告的用时表分段（设计 §2.3-7 用时聚合 · KD-28；`report-tables.mjs` 超 300 行 ⇒ 拆分）。
 *
 * 冻结口径：累计耗时 = Σ 该模型面内**实际执行**的 run 的 `runs[].metrics.totalMs`（`skipped` 不入 ·
 * **error run 已记录耗时照计** · `null` 不计入——不按 0 计）；相对倍率 = ÷ 表内最低者（1.0× · 同成本表体例）；
 * 排名 = 升序 · 同值并列顺延（1 · 1 · 3）；采样 run 数 = 参与累计的 run 数。
 * 射程 = **被测模型**的执行耗时——不含判官 / 复核调用（评估机制开销）；与速度表「总耗时（中位）」口径不同、并存。
 */

import { allRuns, fmtMs } from "./report-tables.mjs"

/** 排名：累计耗时升序 + 同值并列顺延（1 · 1 · 3——密集名次 1 · 1 · 2 被否，KD-28）；缺数据（null）⇒ null。 */
function ranksOf(sums) {
  return sums.map((v) => (v == null ? null : sums.filter((x) => x != null && x < v).length + 1))
}

export function timeSection(stats) {
  stats = [...stats].sort((a, b) => (a.totalMsSum ?? Infinity) - (b.totalMsSum ?? Infinity) || a.label.localeCompare(b.label))
  const sums = stats.map((s) => s.totalMsSum)
  const ranks = ranksOf(sums)
  const bases = sums.filter((v) => typeof v === "number" && v > 0)
  const base = bases.length > 0 ? Math.min(...bases) : null
  const relOf = (v) => (base == null || typeof v !== "number" ? "—" : `${(v / base).toFixed(1)}×`)
  const footnotes = []
  for (const s of stats) {
    const miss = allRuns(s.model).filter((r) => r.verdict !== "skipped").length - s.sampledRuns
    if (miss > 0) {
      footnotes.push(`- ${s.label}：${miss} 个 run 无 totalMs（未参与累计——不按 0 计${s.totalMsSum == null ? "；样本全缺 ⇒ 累计 / 倍率 / 排名记 —（居末）" : ""}）。`)
    }
  }
  return [
    "### 用时表",
    "",
    "累计耗时 = Σ 该模型面内**实际执行**的 run 的 `runs[].metrics.totalMs`（`skipped` 不入 · **error run 已记录耗时照计** · `null` 不计入）；**相对倍率 = 累计耗时 ÷ 表内最低者（最低 = 1.0×）**；**排名 = 累计耗时升序（同值并列 · 后续名次顺延）**；采样 run 数 = 参与累计的 run 数；**按累计耗时升序（缺数据者居末）**。",
    "射程 = **被测模型**的执行耗时——**不含判官 / 复核调用**；与速度表「总耗时（中位）」（单次响应中位 · 仅 pass/fail run）口径不同、并存。",
    "",
    "| 模型 | 累计耗时 | 相对倍率 | 排名 | 采样 run 数 |",
    "| --- | --- | --- | --- | --- |",
    ...stats.map((s, i) => `| ${s.label} | ${fmtMs(s.totalMsSum)} | ${relOf(s.totalMsSum)} | ${ranks[i] ?? "—"} | ${s.sampledRuns} |`),
    ...(footnotes.length > 0 ? ["", "脚注：", ...footnotes] : []),
    "",
  ]
}
