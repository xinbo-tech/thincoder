/**
 * lib/report-speed.mjs — 报告速度表分段（设计 §2.3 骨架 + §2.3-10① · 增补轮 #271；
 * `report-tables.mjs` 超 300 行 ⇒ 拆分——体例同 `report-review.mjs` / `report-time.mjs`）。
 *
 * 双表冻结（#271）：表 A = 按 **TTFT 中位升序**（现状口径）；表 B = 按 **tok/s 中位降序**（快者在前）。
 * 两表**列集逐字相同**；缺数据居末（`null` 键 A `?? Infinity` / B `?? -Infinity`）；同键并列 = label 字典序；
 * 脚注（逐档缺数据句）**一份 · 列于表 B 之后**（两表共用 · 派生零改）；轴门控 = `speed`（两表同出同隐——装配面 gate）。
 * 呈现面变化 ⇒ **不 bump**（KD-27）。
 */

import { allRuns, fmtMs, fmtRate } from "./report-tables.mjs"

const HEAD = "| 模型 | TTFT 中位 | tok/s 中位 | 总耗时（中位） | 采样 run 数 |"
const SEP = "| --- | --- | --- | --- | --- |"
const NOTE = "只取正常返回的 run（pass / fail）；`--n` > 1 时取中位；token 计入 usage 精确值（缺 ⇒ `—`）"

const rowOf = (s) => `| ${s.label} | ${fmtMs(s.speed.ttftMs)} | ${fmtRate(s.speed.tokPerSec)} | ${fmtMs(s.speed.totalMs)} | ${s.speed.samples} |`

/** 单表块：标题 + 共享口径句与各自排序子句 + 表头（两表逐字相同）+ 行。 */
const table = (title, order, sortWord) => [title, "", `${NOTE}；**${sortWord}**。`, "", HEAD, SEP, ...order.map(rowOf), ""]

export function speedSection(stats) {
  const byTtft = [...stats].sort((a, b) => (a.speed.ttftMs ?? Infinity) - (b.speed.ttftMs ?? Infinity) || a.label.localeCompare(b.label))
  const byTok = [...stats].sort((a, b) => (b.speed.tokPerSec ?? -Infinity) - (a.speed.tokPerSec ?? -Infinity) || a.label.localeCompare(b.label))
  const footnotes = []
  for (const s of byTtft) {
    const scored = allRuns(s.model).filter((r) => r.verdict === "pass" || r.verdict === "fail")
    const nullTtft = scored.filter((r) => r.metrics?.ttftMs == null).length
    const nullTok = scored.filter((r) => r.metrics?.tokPerSec == null).length
    if (nullTtft > 0 || nullTok > 0) {
      footnotes.push(`- ${s.label}：${nullTtft} 个 run 无 TTFT / ${nullTok} 个 run 无 tok/s（无非空 delta 或无 usage）——未参与中位（报告格「—」= 数据缺失，不按 0 计）。`)
    }
  }
  return [
    ...table("### 速度表 A（按 TTFT 中位升序）", byTtft, "按 TTFT 中位升序（缺数据者居末）"),
    ...table("### 速度表 B（按 tok/s 中位降序）", byTok, "按 tok/s 中位降序——快者在前（缺数据者居末）"),
    ...(footnotes.length > 0 ? ["脚注：", ...footnotes, ""] : []),
  ]
}
