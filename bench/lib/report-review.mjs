/**
 * lib/report-review.mjs — 报告面判官 / 复核渲染（设计 §2.3；`report-tables.mjs` 超 300 行 ⇒ 按设计档 §3 拆分）。
 *
 * 本档 = 叶子件：只吃结果对象做纯字符串 / 数字拼接（不 import 报告层其它档 ⇒ 无环）；
 * 判官面成员资格直接 import 题集单源 `cases/index.mjs` 的 `JUDGE_FACE`（不重建派生谓词——§2.6 导出落点）。
 * 内容 = 判定标记（`⇄` 分歧 / `⟲` 翻案）+ 分歧面计数 + 《判官分歧》/《复核翻案》两小节。
 */

import { JUDGE_FACE } from "../cases/index.mjs"

/** 判官面用例集（题集代际声明单源——渲染面 import，不自行重建）。 */
const JUDGE_FACE_IDS = new Set(JUDGE_FACE)

/** 分歧面计数（§2.3 概览分歧率 = 分歧 ÷ A/B 双有效样本）：账目主位 = 顶层 `judge` / `review`（prices.mjs 聚合）。 */
export function divergenceOf(data) {
  const j = data.judge
  const r = data.review
  const agree = j?.agreements ?? 0
  const disagree = j?.disagreements ?? 0
  const doubleValid = agree + disagree
  // 判官不可用成因分列（§2.3 告警行口径：有效判不足 / 分歧未决）+ 复核失败计数（AC-12 告警面）——从逐 run 记录现算
  const causes = { insufficient: 0, unresolved: 0, missing: 0, reviewErrors: 0 }
  for (const m of data.models ?? []) {
    for (const c of m.cases ?? []) {
      for (const run of c.runs ?? []) {
        if (run.review?.verdict === "error") causes.reviewErrors++
        const jr = run.judge
        if (!jr || jr.verdict !== "error") continue
        const why = String(jr.reason ?? "")
        if (why.includes("有效判不足")) causes.insufficient++
        else if (why.includes("分歧未决")) causes.unresolved++
        else causes.missing++
      }
    }
  }
  return {
    agree,
    disagree,
    doubleValid,
    rate: doubleValid > 0 ? disagree / doubleValid : null,
    arbitrations: j?.arbitrations ?? 0,
    unavailable: j?.unavailable ?? 0,
    ...causes,
    reviews: r?.calls ?? 0,
    reviewErrors: causes.reviewErrors,
    uphold: r?.uphold ?? 0,
    overturns: r?.overturn ?? 0,
  }
}

/** 分歧样本判定（§2.10.1）：A / B 双有效且相异，或第三判已触发（仲裁）/ 分歧未决。
 *  单一位级失败（有效判不足）= 判官异常而非分歧 ⇒ 不入分歧面（它在判定格与告警行里显影）。 */
export function isDivergent(run) {
  const j = run?.judge
  if (!j) return false
  const js = j.judges ?? []
  const valid = (x) => x && (x.verdict === "pass" || x.verdict === "fail")
  const A = js.find((x) => x.id === "A")
  const B = js.find((x) => x.id === "B")
  if (valid(A) && valid(B) && A.verdict !== B.verdict) return true
  return j.resolution === "arbitrated" || String(j.reason ?? "").includes("分歧未决")
}

/** 判定标记（§2.3 逐维明细）：`⇄` = 该用例 × 模型存在判官分歧样本；`⟲` = 存在复核翻案（经复核纠正 · 原机械 fail）。 */
export function judgeMark(runs) {
  return (runs ?? []).some(isDivergent) ? " ⇄" : ""
}

export function reviewMark(runs) {
  return (runs ?? []).some((r) => r?.review?.verdict === "overturn") ? " ⟲" : ""
}

/** 「判官面未裁决」标注谓词（§2.11 · 混合面翻案）：用例判官面声明（`JUDGE_FACE` 单源）× 该 run 翻案记录
 *  ——原机械 fail 短路未调判官（§2.6）⇒ 复核只裁机械面；纯机械面翻案不携本标注（反例控制）。 */
export const MIXED_NOTE = "判官面未裁决"
export const isMixedOverturn = (caseId, review) => review?.verdict === "overturn" && JUDGE_FACE_IDS.has(caseId)

const cellText = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim() || "—"

/** 《判官分歧》小节（§2.3）：逐条 = 用例 · 模型 · A 裁决 + 理由 · B 裁决 + 理由 · 仲裁（触发时）· 合成分。 */
export function judgeDivergenceSection(data) {
  const rows = []
  for (const m of data.models ?? []) {
    for (const c of m.cases ?? []) {
      for (const run of c.runs ?? []) {
        if (!isDivergent(run)) continue
        const j = run.judge
        const js = j.judges ?? []
        rows.push({
          caseId: c.caseId,
          model: m.label,
          a: js.find((x) => x.id === "A"),
          b: js.find((x) => x.id === "B"),
          c: js.find((x) => x.id === "C"),
          verdict: j.verdict,
          resolution: j.resolution,
        })
      }
    }
  }
  const out = [
    "### 判官分歧",
    "",
    "判官对（A / B）按同一冻结 rubric 独立裁决；**分歧样本经第三判（仲裁 C）多数决**——本节 = 判官质量仪表 + 审计线索（分歧标记只落逐维明细与本小节；能力矩阵只表达通过数）。",
    "",
  ]
  if (rows.length === 0) return [...out, "本轮无判官分歧。", ""]
  out.push(
    "| 用例 | 模型 | A 裁决 | A 理由 | B 裁决 | B 理由 | 仲裁 C | C 理由 | 合成分 |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  )
  for (const r of rows) {
    const a = r.a ?? {}, b = r.b ?? {}, c = r.c
    out.push(`| ${r.caseId} | ${r.model} | ${a.verdict ?? "—"} | ${cellText(a.reason)} | ${b.verdict ?? "—"} | ${cellText(b.reason)} | ${c ? c.verdict : "未触发"} | ${c ? cellText(c.reason) : "—"} | ${r.verdict}（${r.resolution}） |`)
  }
  out.push("")
  return out
}

/** 《复核翻案》小节（§2.3 / §2.12）：逐条 = 用例 · 模型 · 机械失败断言 · 复核 · 复核理由；
 *  **含翻案 ⇒ 尾部「承接清单」**（§2.12 产出面）：从 `runs[].review.verdict === "overturn"` 派生、
 *  **按 `caseId` 归一**、不新增 JSON 字段（单源同 §2.10.3）——承接与销账 = 人工确认。 */
export function reviewOverturnSection(data) {
  const rows = []
  const overturnCases = []
  for (const m of data.models ?? []) {
    for (const c of m.cases ?? []) {
      for (const run of c.runs ?? []) {
        if (run.review) rows.push({ caseId: c.caseId, model: m.label, review: run.review, mixed: isMixedOverturn(c.caseId, run.review) })
        if (run.review?.verdict === "overturn" && !overturnCases.includes(c.caseId)) overturnCases.push(c.caseId)
      }
    }
  }
  const out = [
    "### 复核翻案",
    "",
    "机械 fail 的 run 追加 LLM 复核（单判 · 沿 A 位）；`overturn` = **复核翻案**——**改判 `pass`**（计入通过数；原机械失败断言与复核理由留档——判定与 `detail` 正交），同时 = **判据修复必修**：修题面 / 判据（`SUITE_VERSION + 1`）+ **承接（§2.12：产出机器化 · 落台账 · 修毕销账）**——**改判不免修**。",
    "两形态：纯机械面翻案 = 判定完整纠正；**混合面翻案**（原机械 fail 短路 ⇒ 未调判官 · 复核只裁机械面）⇒ 逐条注「判官面未裁决」。",
    "",
  ]
  if (rows.length === 0) return [...out, "本轮无复核翻案（机械 fail 复核记录 0 条）。", ""]
  out.push(
    "| 用例 | 模型 | 机械失败断言 | 复核 | 复核理由 |",
    "| --- | --- | --- | --- | --- |",
  )
  for (const r of rows) {
    const tail = r.review.verdict === "overturn" ? `（翻案${r.mixed ? ` · ${MIXED_NOTE}` : ""}）` : ""
    out.push(`| ${r.caseId} | ${r.model} | ${cellText(r.review.mechDetail)} | ${r.review.verdict}${tail} | ${cellText(r.review.reason)} |`)
  }
  out.push("")
  if (overturnCases.length > 0) {
    out.push(
      "**承接清单（判据修复必修 · 按用例归一 · §2.12）**",
      "",
      "| 用例 | 承接落点 | 处置 | 销账 |",
      "| --- | --- | --- | --- |",
      ...overturnCases.map((id) => `| ${id} | 台账（\`kind=tech_todo\` · \`board=MODEL-BENCH\` · \`status=待设计\`） | 判据修复 ⇒ \`SUITE_VERSION + 1\` + 重跑；题面 / 判据 / rubric 变更同步设计档 | 定点复现用例在册（修复前 fail / 修复后 pass）+ 版本递增已落 + 条目 evidence 记修复批档坐标 ⇒ 主 agent 确认核销 |`),
      "",
      "证据指针 = 本小节逐条记录 + 同名 `.json` 的 `runs[].review`（`verdict = \"overturn\"`；渲染面派生——不新增字段）；承接与销账 = 人工确认（产出侧机器化）。",
      "",
    )
  }
  return out
}
