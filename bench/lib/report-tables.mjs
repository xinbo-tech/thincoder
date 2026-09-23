/**
 * lib/report-tables.mjs — 报告的表格分段与聚合件（report.mjs 超 300 行 ⇒ 按设计档 §3 拆分触发条件拆出）。
 *
 * 聚合口径（§2.3-1~4 冻结）：用例判定 N 次全过 = pass；速度只取正常返回的 run（pass/fail）后取中位；
 * 成本 = Σ 成功返回的 call 成本；`—` 一律表示「不在该模型面 / 数据缺失」，绝不编码为 0。
 */

import { DIMENSIONS, DIM_LABELS } from "../cases/index.mjs"
import { aggregateVerdict, speedMedians } from "./metrics.mjs"
import { head } from "./output.mjs"
import { judgeMark, reviewMark } from "./report-review.mjs"

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
    judgeCostCny: m.aggregate?.judgeCostCny ?? null,
    reviewCostCny: m.aggregate?.reviewCostCny ?? null,
    overturns: runs.filter((r) => r.review?.verdict === "overturn").length,
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

/** 摘要的 code-span 安全包裹：动态反引号（内容围栏不截断显示）+ 换行可视（⏎）——保真可审计。 */
export function codeSpan(s) {
  const t = String(s ?? "").replace(/\r?\n/g, "⏎")
  const longest = (t.match(/`+/g) ?? []).reduce((m, r) => Math.max(m, r.length), 0)
  const fence = "`".repeat(longest + 1)
  return `${fence}${t}${fence}`
}

export function matrixSection(data, stats) {
  stats = [...stats].sort((a, b) => b.passed - a.passed || a.label.localeCompare(b.label))
  const dims = DIMENSIONS.filter((d) => (data.models ?? []).some((m) => dimsOf(m).includes(d)))
  if (dims.length === 0) return ["### 能力矩阵", "", "本轮未选自动维（能力矩阵无列）——人工判读见下节。", ""]
  return [
    "### 能力矩阵",
    "",
    "单元格 = 通过用例数 / 该模型在该维的用例数（用例判定：N 次全过 = pass）；`—` = 不在该模型面；**按合计通过数降序**。",
    "",
    `| 模型 | ${dims.map((d) => DIM_LABELS[d] ?? d).join(" | ")} | 合计 |`,
    `| --- | ${dims.map(() => "---").join(" | ")} | --- |`,
    ...stats.map((s) => {
      const cells = dims.map((d) => {
        if (!dimsOf(s.model).includes(d)) return "—"
        const inDim = casesOf(s.model).filter((c) => c.dim === d)
        const verd = inDim.map((c) => aggregateVerdict(c.runs ?? []))
        const overturns = inDim.some((c) => (c.runs ?? []).some((r) => r.review?.verdict === "overturn"))
        return `${verd.filter((v) => v === "pass").length}/${verd.filter((v) => v !== "skipped").length}${overturns ? " ⟲" : ""}`
      })
      return `| ${s.label} | ${cells.join(" | ")} | ${s.passed}/${s.total} |`
    }),
    ...(stats.some((s) => s.overturns > 0)
      ? ["", "脚注：`⟲` = 该模型 × 维存在**复核翻案**（机械 fail 被复核判为可能误判）——**不自动改判**，通过数不变（处置见《复核翻案》小节）。"]
      : []),
    "",
  ]
}

export function speedSection(stats) {
  stats = [...stats].sort((a, b) => (a.speed.ttftMs ?? Infinity) - (b.speed.ttftMs ?? Infinity) || a.label.localeCompare(b.label))
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
    "只取正常返回的 run（pass / fail）；`--n` > 1 时取中位；token 计入 usage 精确值（缺 ⇒ `—`）；**按 TTFT 中位升序（缺数据者居末）**。",
    "",
    "| 模型 | TTFT 中位 | tok/s 中位 | 总耗时（中位） | 采样 run 数 |",
    "| --- | --- | --- | --- | --- |",
    ...stats.map((s) => `| ${s.label} | ${fmtMs(s.speed.ttftMs)} | ${fmtRate(s.speed.tokPerSec)} | ${fmtMs(s.speed.totalMs)} | ${s.speed.samples} |`),
    ...(footnotes.length > 0 ? ["", "脚注：", ...footnotes] : []),
    "",
  ]
}

export function costSection(data, stats) {
  stats = [...stats].sort((a, b) => (a.costPerPass ?? Infinity) - (b.costPerPass ?? Infinity) || a.label.localeCompare(b.label))
  const footnotes = []
  for (const s of stats) {
    const noCost = allRuns(s.model).filter((r) => r.verdict !== "skipped" && !r.metrics?.cost).length
    const missUsage = allRuns(s.model).filter((r) => (r.calls ?? []).some((c) => !c.tokens)).length
    const notes = []
    if (noCost > 0) notes.push(`${noCost} 个 run 无成本数据（价格未录 / usage 缺失）`)
    if (missUsage > 0) notes.push(`${missUsage} 个 run 存在 usage 缺失的 call`)
    if (notes.length > 0) footnotes.push(`- ${s.label}：${notes.join("；")}。`)
  }
  const bases = stats.map((s) => s.costPerPass).filter((v) => typeof v === "number" && v > 0)
  const base = bases.length > 0 ? Math.min(...bases) : null
  const relOf = (v) => (base == null || typeof v !== "number" ? "—" : `${(v / base).toFixed(1)}×`)
  return [
    "### 成本表",
    "",
    "总成本 = Σ 成功返回的 call 成本；每任务成本 = 总成本 ÷ 任务数（该模型面内的用例数）；每通过任务成本 = 总成本 ÷ 通过任务数（用例判定 N 次全过 = pass）；**相对成本 = 每通过任务成本 ÷ 表内最低者（最低 = 1×，直接读倍数）**；**按每通过任务成本升序（最便宜居首 = 1.0×）**。",
    "**判官成本 = A / B / 仲裁 C 三位合计**；判官与复核两列单列展示——**不参与相对成本归一化，也不进被测成本**（AC-4 成本分账）。",
    "",
    "| 模型 | 总成本 | 每任务成本 | 每通过任务成本 | 相对成本 | 判官成本 | 复核成本 |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...stats.map((s) => `| ${s.label} | ${fmtMoney(s.costCny)} | ${fmtMoney(s.costPerTask)} | ${fmtMoney(s.costPerPass)} | ${relOf(s.costPerPass)} | ${fmtMoney(s.judgeCostCny)} | ${fmtMoney(s.reviewCostCny)} |`),
    ...(footnotes.length > 0 ? ["", "脚注：", ...footnotes] : []),
    "",
    ...judgeCostNotes(data),
    `- 计费口径：单价以 prices.json 为准（asOf ${data.prices?.asOf}；逐条出处以条目级 source 可回溯）。`,
    "",
  ]
}

/** 判官 / 复核成本列的缺价口径句（§2.10.5：缺价 ⇒ 位级 null + 警告；合计 = 已录价位之和——不得当全量读）。 */
function judgeCostNotes(data) {
  const j = data.judge
  if (!j) return []
  const unpriced = [j.judges?.[0], j.judges?.[1], j.arbiter]
    .filter((s) => s && (s.calls ?? 0) > 0 && s.costCny == null)
    .map((s) => `${s.provider}:${s.model}`)
  if (unpriced.length === 0) return []
  return [`- 判官成本口径：以下判官位未录价（成本列 = **已录价位之和**，不含它们；位级成本 null + 告警）：${unpriced.join("、")}。`, ""]
}

export function detailSection(data, stats) {
  const dims = DIMENSIONS.filter((d) => (data.models ?? []).some((m) => dimsOf(m).includes(d)))
  const allCases = (data.models ?? []).flatMap((m) => casesOf(m))
  const out = [
    "### 逐维明细",
    "",
    "每用例先列**题面**（`cases[].prompt` 正本逐字，渲染 ≤300 字符、超限截断 `…`；JSON 存全额）；成本列为该用例代表 run 的调用成本；**相对成本 = 该用例内最低者 = 1×**；判定标记：`⇄` = 判官分歧样本（经第三判仲裁）、`⟲` = 复核翻案（不自动改判）。",
    "",
  ]
  if (dims.length === 0) return [...out, "本轮未选自动维（逐维明细无内容）。", ""]
  const caseOf = (model, cid) => casesOf(model).find((c) => c.caseId === cid)
  for (const d of dims) {
    out.push(`#### ${DIM_LABELS[d] ?? d}（\`${d}\`）`, "")
    const caseIds = [...new Set(allCases.filter((c) => c.dim === d).map((c) => c.caseId))]
    for (const cid of caseIds) {
      const cls = allCases.find((c) => c.caseId === cid)?.class ?? ""
      const prompt = allCases.find((c) => c.caseId === cid)?.prompt
      out.push(`**${cid}** · ${cls}`, "")
      if (prompt) out.push(`> 题面：${head(prompt, 300, true)}`, "")
      const cells = stats.map((s) => ({ s, cell: caseCell(s.model, cid) }))
      const bases = cells.map((x) => x.cell?.cost?.value).filter((v) => typeof v === "number" && v > 0)
      const base = bases.length > 0 ? Math.min(...bases) : null
      const relOf = (v) => (base == null || typeof v !== "number" ? "—" : `${(v / base).toFixed(1)}×`)
      out.push("| 模型 | 判定 | TTFT | tok/s | 总耗时 | tokens 入/缓/出 | 成本 | 相对成本 |", "| --- | --- | --- | --- | --- | --- | --- | --- |")
      for (const { s, cell } of cells) {
        if (!cell) {
          out.push(`| ${s.label} | — | — | — | — | — | — | — |`)
          continue
        }
        const runs = caseOf(s.model, cid)?.runs ?? []
        out.push(`| ${s.label} | ${cell.label}${judgeMark(runs)}${reviewMark(runs)} | ${fmtMs(cell.metrics?.ttftMs)} | ${fmtRate(cell.metrics?.tokPerSec)} | ${fmtMs(cell.metrics?.totalMs)} | ${tokensCell(cell.tokens)} | ${money(cell.cost)} | ${relOf(cell.cost?.value)} |`)
      }
      out.push("")
      for (const s of stats) {
        const cell = caseCell(s.model, cid)
        if (cell?.head) out.push(`- 响应摘要 · ${s.label}：${codeSpan(cell.head)}`)
      }
      // 判官理由行（判官裁决的 run：逐位 A / B（分歧时 +C）裁决 + 定判位理由）
      for (const s of stats) {
        for (const run of caseOf(s.model, cid)?.runs ?? []) {
          if (!run.judge) continue
          const parts = (run.judge.judges ?? []).map((j) => `${j.id}=${j.verdict}${j.verdict === "error" ? "（位级失败）" : ""}`)
          out.push(`- 判官 · ${s.label}：${parts.join(" / ")} → 合成分 ${run.judge.verdict}（${run.judge.resolution}）· ${run.judge.reason}`)
        }
      }
      // 复核行（该单元格有复核记录时：复核次数 / uphold / 翻案 + 理由）
      for (const s of stats) {
        const revs = (caseOf(s.model, cid)?.runs ?? []).filter((r) => r.review)
        if (revs.length === 0) continue
        const of = (v) => revs.filter((r) => r.review.verdict === v).length
        const tail = revs.map((r) => `${r.review.verdict}：${r.review.reason}`).join("；")
        out.push(`- 复核 · ${s.label}：${revs.length} 次（uphold ${of("uphold")} · 翻案 ${of("overturn")}${of("error") > 0 ? ` · 复核失败 ${of("error")}` : ""}）· ${tail}`)
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
  const byPrompt = new Map()
  for (const rec of data.manual) {
    const v = rec.metrics?.cost?.value
    if (typeof v === "number" && v > 0) byPrompt.set(rec.promptId, Math.min(byPrompt.get(rec.promptId) ?? Infinity, v))
  }
  const relOf = (pid, v) => {
    const b = byPrompt.get(pid)
    return b == null || typeof v !== "number" ? "—" : `${(v / b).toFixed(1)}×`
  }
  const out = [
    "### 人工判读",
    "",
    "人工 lane 不判分、不入能力矩阵与成本归一化；逐条并列题面 + 响应摘要 + 指标 + 调用成本（按条单项列出；**相对成本 = 同条内最低者 = 1×**）。",
    "",
    "| 模型 | 条目 | 题面 | 响应摘要 | TTFT | tok/s | tokens 入/缓/出 | 调用成本 | 相对成本 |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ]
  for (const rec of data.manual) {
    const m = rec.metrics ?? {}
    out.push(`| ${rec.label ?? "—"} | ${rec.promptId} | ${rec.prompt} | ${rec.responseHead ? codeSpan(rec.responseHead) : "—"} | ${fmtMs(m.ttftMs)} | ${fmtRate(m.tokPerSec)} | ${tokensCell(m.tokens)} | ${money(m.cost)} | ${relOf(rec.promptId, m.cost?.value)} |`)
  }
  out.push("", "说明：本 lane 的成本只作单项展示，不进入成本表的成本归一化（AC-6）。", "")
  return out
}
