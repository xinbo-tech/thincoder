/**
 * lib/report-time.mjs — 报告的用时表分段（设计 §2.3-7 用时聚合 · KD-28；`report-tables.mjs` 超 300 行 ⇒ 拆分）。
 *
 * 冻结口径：累计耗时 = Σ 该模型面内**实际执行**的 run 的 `runs[].metrics.totalMs`（`skipped` 不入 ·
 * **error run 已记录耗时照计** · `null` = **未记录** ⇒ 不计入（不按 0 计）· 部分 call 未记录 ⇒ 按已记录之和
 * （下界）入累计 + 脚注）；相对倍率 = 累计耗时 ÷ **全表最低正值**（1.0× · 同成本表体例 · 算式单源 = `report-tables.mjs`）；
 * 排名 = 升序 · 同值并列顺延（1 · 1 · 3）；采样 run 数 = 参与累计的 run 数。
 * 交叉列两列（#276 · §2.3-10④）：合计通过数 = 能力矩阵「合计」格同源 · 相对成本 = 成本表算式同源（缺数据 `—`；不参与本表排序）。
 * 射程 = **被测模型**的执行耗时——不含判官 / 复核调用（评估机制开销）；与速度表「总耗时（中位）」口径不同、并存。
 */

import { allRuns, costRelOf, fmtMs, timeRelOf } from "./report-tables.mjs"

/** 排名：累计耗时升序 + 同值并列顺延（1 · 1 · 3——密集名次 1 · 1 · 2 被否，KD-28）；缺数据（null）⇒ null。 */
function ranksOf(sums) {
  return sums.map((v) => (v == null ? null : sums.filter((x) => x != null && x < v).length + 1))
}

export function timeSection(stats) {
  stats = [...stats].sort((a, b) => (a.totalMsSum ?? Infinity) - (b.totalMsSum ?? Infinity) || a.label.localeCompare(b.label))
  const sums = stats.map((s) => s.totalMsSum)
  const ranks = ranksOf(sums)
  const relTime = timeRelOf(stats)
  const relCost = costRelOf(stats)
  const footnotes = []
  for (const s of stats) {
    const runs = allRuns(s.model)
    const miss = runs.filter((r) => r.verdict !== "skipped").length - s.sampledRuns
    if (miss > 0) {
      footnotes.push(`- ${s.label}：${miss} 个 run 无 totalMs（**未记录**——未参与累计，不按 0 计${s.totalMsSum == null ? "；样本全缺 ⇒ 累计 / 倍率 / 排名记 —（居末）" : ""}）。`)
    }
    // 部分未记录分支（§2.3-7）：run 级总耗时为数值 ∧ 存在未记录的 call ⇒ 按已记录之和（下界）入累计 + 入脚注
    // `skipped` run 不入本分支（未执行 ⇒ 无「部分未记录」可言——谓词排除 · KD-47③）
    const partial = runs.filter((r) => r.verdict !== "skipped" && typeof r?.metrics?.totalMs === "number" && (r.calls ?? []).some((c) => typeof c?.totalMs !== "number")).length
    if (partial > 0) footnotes.push(`- ${s.label}：${partial} 个 run 部分 call 未记录（按已记录之和（下界）入累计——未记录部分不按 0 计）。`)
  }
  return [
    "### 用时表",
    "",
    "累计耗时 = Σ 该模型面内**实际执行**的 run 的 `runs[].metrics.totalMs`（`skipped` 不入 · **error run 已记录耗时照计** · **`null` = 未记录** ⇒ 不计入累计、不按 0 计 + 脚注 · 部分 call 未记录 ⇒ 按已记录之和（下界）入累计 + 脚注）；**相对倍率 = 累计耗时 ÷ 全表最低正值（最低 = 1.0×）**；**排名 = 累计耗时升序（同值并列 · 后续名次顺延）**；采样 run 数 = 参与累计的 run 数；**按累计耗时升序（缺数据者居末）**；**交叉列两列 = 同源照搬**（合计通过数 = 能力矩阵「合计」格 · 相对成本 = 成本表「相对成本」；缺数据 `—`；不参与本表排序）。",
    "射程 = **被测模型**的执行耗时——**不含判官 / 复核调用**；与速度表「总耗时（中位）」（单次响应中位 · 仅 pass/fail run）口径不同、并存。",
    "",
    "| 模型 | 累计耗时 | 相对倍率 | 排名 | 采样 run 数 | 合计通过数 | 相对成本 |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...stats.map((s, i) => `| ${s.label} | ${fmtMs(s.totalMsSum)} | ${relTime(s.totalMsSum)} | ${ranks[i] ?? "—"} | ${s.sampledRuns} | ${s.passed}/${s.total} | ${relCost(s.costPerPass)} |`),
    ...(footnotes.length > 0 ? ["", "脚注：", ...footnotes] : []),
    "",
  ]
}
