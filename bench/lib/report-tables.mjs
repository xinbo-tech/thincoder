/**
 * lib/report-tables.mjs — 报告的表格分段与聚合件（report.mjs 超 300 行 ⇒ 按设计档 §3 拆分触发条件拆出）。
 *
 * 聚合口径（§2.3-1~4 冻结）：用例判定 N 次全过 = pass；速度只取正常返回的 run（pass/fail）后取中位；
 * 成本 = Σ 成功返回的 call 成本；`—` 一律表示「不在该模型面 / 数据缺失」，绝不编码为 0。
 */

import { DIMENSIONS, DIM_LABELS } from "../cases/index.mjs"
import { aggregateVerdict, speedMedians } from "./metrics.mjs"

const VERDICT_TAG = { pass: "✅ pass", fail: "❌ fail", error: "⚠️ error", skipped: "—" }

export const fmtMs = (n) => (n == null ? "—" : `${Math.round(n)} ms`)
export const fmtRate = (n) => (n == null ? "—" : String(Math.round(n * 10) / 10))

export function fmtMoney(n) {
  if (n == null) return "—"
  if (n === 0) return "¥0"
  return `¥${(n < 0.01 ? n.toFixed(6) : n.toFixed(4)).replace(/0+$/, "").replace(/\.$/, "")}`
}

export const rate = (p, t) => (t > 0 ? `${Math.round((p / t) * 100)}%` : "—")
export const casesOf = (m) => m.cases ?? []
export const allRuns = (m) => casesOf(m).flatMap((c) => c.runs ?? [])
/** 模型的有效维度面 = 结果 JSON 的 `dims` 字段（roster 排除的维不在面内 ⇒ 矩阵显示 `—`，§2.1-2）。 */
export const dimsOf = (m) => (Array.isArray(m.dims) && m.dims.length > 0 ? m.dims : [...new Set(casesOf(m).map((c) => c.dim))])

/** 用例 × 模型的展示单元：判定（k/N）+ 中位指标 + 代表 run（失败优先，便于诊断）。 */
export function caseCell(model, caseId) {
  const c = casesOf(model).find((x) => x.caseId === caseId)
  if (!c) return null
  const runs = c.runs ?? []
  const verdict = aggregateVerdict(runs)
  if (runs.length === 0 || verdict === "skipped") {
    return { verdict: "skipped", label: "—", metrics: null, head: "（不在该模型面）", tokens: null, cost: null }
  }
  const passed = runs.filter((r) => r.verdict === "pass").length
  const rep = runs.find((r) => r.verdict !== "pass") ?? runs[runs.length - 1]
  const med = (pick) => {
    const vals = runs.filter((r) => r.verdict === "pass" || r.verdict === "fail").map(pick).filter((v) => typeof v === "number")
    if (vals.length === 0) return null
    const s = [...vals].sort((a, b) => a - b)
    return s.length % 2 === 1 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
  }
  return {
    verdict,
    label: `${VERDICT_TAG[verdict]} ${passed}/${runs.length}`,
    metrics: {
      ttftMs: med((r) => r.metrics?.ttftMs),
      tokPerSec: med((r) => r.metrics?.tokPerSec),
      totalMs: med((r) => r.metrics?.totalMs),
    },
    head: rep?.summary?.textHead ?? "",
    tokens: rep?.metrics?.tokens ?? null,
    cost: rep?.metrics?.cost ?? null,
  }
}

/** 模型级统计（能力 / 速度 / 成本，供三表与关键发现共用）。 */
export function modelStats(data) {
  return (data.models ?? []).map((m) => {
    const runs = allRuns(m)
    const passedRuns = runs.filter((r) => r.verdict === "pass")
    const caseVerd = casesOf(m).map((c) => aggregateVerdict(c.runs ?? []))
    const passed = caseVerd.filter((v) => v === "pass").length
    const total = caseVerd.filter((v) => v !== "skipped").length
    const costs = runs.map((r) => r.metrics?.cost?.value).filter((v) => typeof v === "number")
    const costCny = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) : null
    return {
      model: m,
      label: m.label,
      passed,
      total,
      passedRuns: passedRuns.length,
      taskRuns: runs.length,
      costCny,
      costPerTask: costCny != null && total > 0 ? costCny / total : null,
      costPerPass: costCny != null && passed > 0 ? costCny / passed : null,
      speed: speedMedians(runs),
      errRuns: runs.filter((r) => r.verdict === "error").length,
    }
  })
}

export function tokensCell(t) {
  if (!t) return "—"
  const part = (v) => (v == null ? "?" : String(v))
  return `${part(t.prompt)}/${part(t.cached)}/${part(t.completion)}`
}

export const money = (c) => (c ? fmtMoney(c.value) : "—")

export function matrixSection(data, stats) {
  const dims = DIMENSIONS.filter((d) => (data.models ?? []).some((m) => dimsOf(m).includes(d)))
  if (dims.length === 0) return ["### 能力矩阵", "", "本轮未选自动维（能力矩阵无列）——人工判读见下节。", ""]
  return [
    "### 能力矩阵",
    "",
    "单元格 = 通过用例数 / 该模型在该维的用例数（用例判定：N 次全过 = pass）；`—` = 不在该模型面。",
    "",
    `| 模型 | ${dims.map((d) => DIM_LABELS[d] ?? d).join(" | ")} | 合计 |`,
    `| --- | ${dims.map(() => "---").join(" | ")} | --- |`,
    ...stats.map((s) => {
      const cells = dims.map((d) => {
        if (!dimsOf(s.model).includes(d)) return "—"
        const verd = casesOf(s.model).filter((c) => c.dim === d).map((c) => aggregateVerdict(c.runs ?? []))
        return `${verd.filter((v) => v === "pass").length}/${verd.filter((v) => v !== "skipped").length}`
      })
      return `| ${s.label} | ${cells.join(" | ")} | ${s.passed}/${s.total} |`
    }),
    "",
  ]
}

export function speedSection(stats) {
  const footnotes = []
  for (const s of stats) {
    const scored = allRuns(s.model).filter((r) => r.verdict === "pass" || r.verdict === "fail")
    const nullTtft = scored.filter((r) => r.metrics?.ttftMs == null).length
    const nullTok = scored.filter((r) => r.metrics?.tokPerSec == null).length
    if (nullTtft > 0 || nullTok > 0) {
      footnotes.push(`- ${s.label}：${nullTtft} 个 run 无 TTFT / ${nullTok} 个 run 无 tok/s（无非空 delta 或无 usage）——未参与中位（报告格「—」= 数据缺失，不按 0 计）。`)
    }
  }
  return [
    "### 速度表",
    "",
    "只取正常返回的 run（pass / fail）；`--n` > 1 时取中位；token 计入 usage 精确值（缺 ⇒ `—`）。",
    "",
    "| 模型 | TTFT 中位 | tok/s 中位 | 总耗时（中位） | 采样 run 数 |",
    "| --- | --- | --- | --- | --- |",
    ...stats.map((s) => `| ${s.label} | ${fmtMs(s.speed.ttftMs)} | ${fmtRate(s.speed.tokPerSec)} | ${fmtMs(s.speed.totalMs)} | ${s.speed.samples} |`),
    ...(footnotes.length > 0 ? ["", "脚注：", ...footnotes] : []),
    "",
  ]
}

export function costSection(data, stats) {
  const footnotes = []
  for (const s of stats) {
    const noCost = allRuns(s.model).filter((r) => r.verdict !== "skipped" && !r.metrics?.cost).length
    const missUsage = allRuns(s.model).filter((r) => (r.calls ?? []).some((c) => !c.tokens)).length
    const notes = []
    if (noCost > 0) notes.push(`${noCost} 个 run 无成本数据（价格未录 / usage 缺失）`)
    if (missUsage > 0) notes.push(`${missUsage} 个 run 存在 usage 缺失的 call`)
    if (notes.length > 0) footnotes.push(`- ${s.label}：${notes.join("；")}。`)
  }
  return [
    "### 成本表",
    "",
    "总成本 = Σ 成功返回的 call 成本；每任务成本 = 总成本 ÷ 任务数（该模型面内的用例数）；每通过任务成本 = 总成本 ÷ 通过任务数（用例判定 N 次全过 = pass）。",
    "",
    "| 模型 | 总成本 | 每任务成本 | 每通过任务成本 |",
    "| --- | --- | --- | --- |",
    ...stats.map((s) => `| ${s.label} | ${fmtMoney(s.costCny)} | ${fmtMoney(s.costPerTask)} | ${fmtMoney(s.costPerPass)} |`),
    ...(footnotes.length > 0 ? ["", "脚注：", ...footnotes] : []),
    "",
    `- 计费口径：单价以 prices.json 为准（asOf ${data.prices?.asOf}；逐条出处以条目级 source 可回溯）。`,
    "",
  ]
}

export function detailSection(data, stats) {
  const dims = DIMENSIONS.filter((d) => (data.models ?? []).some((m) => dimsOf(m).includes(d)))
  const allCases = (data.models ?? []).flatMap((m) => casesOf(m))
  const out = ["### 逐维明细", ""]
  if (dims.length === 0) return [...out, "本轮未选自动维（逐维明细无内容）。", ""]
  for (const d of dims) {
    out.push(`#### ${DIM_LABELS[d] ?? d}（\`${d}\`）`, "")
    const caseIds = [...new Set(allCases.filter((c) => c.dim === d).map((c) => c.caseId))]
    for (const cid of caseIds) {
      const cls = allCases.find((c) => c.caseId === cid)?.class ?? ""
      out.push(`**${cid}** · ${cls}`, "")
      out.push("| 模型 | 判定 | TTFT | tok/s | 总耗时 | tokens 入/缓/出 | 成本 |", "| --- | --- | --- | --- | --- | --- | --- |")
      for (const s of stats) {
        const cell = caseCell(s.model, cid)
        if (!cell) {
          out.push(`| ${s.label} | — | — | — | — | — | — |`)
          continue
        }
        out.push(`| ${s.label} | ${cell.label} | ${fmtMs(cell.metrics?.ttftMs)} | ${fmtRate(cell.metrics?.tokPerSec)} | ${fmtMs(cell.metrics?.totalMs)} | ${tokensCell(cell.tokens)} | ${money(cell.cost)} |`)
      }
      out.push("")
      for (const s of stats) {
        const cell = caseCell(s.model, cid)
        if (cell?.head) out.push(`- 响应摘要 · ${s.label}：\`${cell.head}\``)
      }
      out.push("")
    }
  }
  return out
}

export function manualSection(data) {
  if (!data.manual || data.manual.length === 0) {
    return ["### 人工判读", "", "本节未运行（本轮 `--dims` 未包含 `manual`）。", ""]
  }
  const out = [
    "### 人工判读",
    "",
    "人工 lane 不判分、不入能力矩阵与成本归一化；逐条并列题面 + 响应摘要 + 指标 + 调用成本（按条单项列出）。",
    "",
    "| 模型 | 条目 | 题面 | 响应摘要 | TTFT | tok/s | tokens 入/缓/出 | 调用成本 |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ]
  for (const rec of data.manual) {
    const m = rec.metrics ?? {}
    out.push(`| ${rec.label ?? "—"} | ${rec.promptId} | ${rec.prompt} | ${rec.responseHead || "—"} | ${fmtMs(m.ttftMs)} | ${fmtRate(m.tokPerSec)} | ${tokensCell(m.tokens)} | ${money(m.cost)} |`)
  }
  out.push("", "说明：本 lane 的成本只作单项展示，不进入成本表的成本归一化（AC-6）。", "")
  return out
}
