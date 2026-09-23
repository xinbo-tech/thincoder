/**
 * lib/report.mjs — 结果对象 → md 报告（设计 §2.3：骨架固定，缺段即缺陷）。
 *
 * md 完全由结果 JSON 渲染 ⇒ 两档恒一致。表格分段与聚合件在 `lib/report-tables.mjs`（拆分触发条件）；
 * 本档 = 概览 / 方法 / 关键发现 / 局限声明 / 附录 + 骨架装配。关键发现只由数据 + 固定句式生成（禁主观评价词）。
 */

import { AXES, CAPABILITY_SELECTOR, DIMENSIONS, DIM_LABELS, MANUAL_DIM, SUITE_VERSION } from "../cases/index.mjs"
import {
  allRuns, costSection, detailSection, dimsOf, fmtMoney, fmtMs, fmtRate,
  manualSection, matrixSection, modelStats, rate, speedSection,
} from "./report-tables.mjs"

function overviewSection(data, stats) {
  const date = String(data.startedAt ?? "").slice(0, 10)
  return [
    "## 概览",
    "",
    `- 报告标签：\`${data.label}\` ｜ 日期：${date} ｜ 题集版本：suiteVersion = ${data.suiteVersion}`,
    `- 时点：${data.startedAt} ~ ${data.finishedAt}`,
    `- 价格表：asOf ${data.prices?.asOf} · ${data.prices?.currency} · ${data.prices?.unit}`,
    `- 运行参数：重复 --n ${data.run?.repeats} · maxTokens ${data.run?.maxTokens} · timeout ${data.run?.timeoutSec}s · temperature ${data.run?.temperature} · 报告轴 ${(data.run?.axes ?? ["speed", "cost"]).join(" + ")}`,
    "",
    "| 模型 | provider | model | 维度面 | 通过率 | 备注 |",
    "| --- | --- | --- | --- | --- | --- |",
    ...stats.map((s) => `| ${s.label} | ${s.model.provider} | ${s.model.model} | ${dimsOf(s.model).map((d) => DIM_LABELS[d] ?? d).join("、") || "—"} | ${s.passed}/${s.total}（${rate(s.passed, s.total)}） | ${s.model.note || "—"} |`),
    "",
  ]
}

function methodSection(data) {
  return [
    "## 方法",
    "",
    "套件口径冻结（五口径；任一变化 ⇒ suiteVersion +1，跨版本不严格可比）：",
    "",
    "1. 题集：题面与用例逐字冻结（含隐藏用例）；版本标识 = suiteVersion。",
    "2. 判分：机器判分为主；判据 = 冻结断言（数字比对 / vm 实跑 + 隐藏断言 / 整串 JSON / 工具结构 / 文本约束 / 词表）。人工 lane 只记录不判分。",
    "3. 计时：TTFT = 首个非空 delta 到达 − 调用发起；tok/s = Σcompletion ÷ Σ(per-call total − per-call ttft)；token 只认 usage 精确值，缺记 null（不估算）。",
    "4. 报告：报告对（md + json）同 basename，md 完全由结果 JSON 渲染；同骨架跨模型/跨时点可比。",
    "5. 价格：单价只住 prices.json（asOf + source 可回溯）；成本 = 未缓存输入 × input + 缓存命中 × cachedInput + 输出 × output。",
    "",
    `- 复现命令：\`${data.run?.command}\``,
    `- 套件版本：suiteVersion = ${data.suiteVersion ?? SUITE_VERSION}（题集/判据/计时口径任一变化 +1，跨版本不严格可比）`,
    `- 工具链：模型调用经核 provider 路径（thinking / reasoningEffort 等参数取用户配置原值）；temperature = ${data.run?.temperature}；多轮工具链跨轮合计计时。`,
    ...(data.recomputed ? [`- 重算产物：由 \`${data.recomputed.from}\` 于 ${data.recomputed.at} 重出（成本按当前 prices.json 重算；原档不动）。`] : []),
    "",
  ]
}

function findingsSection(data, stats, { showCapability = true, axes = [...AXES] } = {}) {
  const out = ["## 关键发现", ""]
  const rated = showCapability ? stats.filter((s) => s.total > 0) : []
  if (showCapability && rated.length > 0) {
    const sorted = [...rated].sort((a, b) => b.passed / b.total - a.passed / a.total)
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    out.push(`- 能力通过率：首位 ${best.label}（${best.passed}/${best.total}，${rate(best.passed, best.total)}）；末位 ${worst.label}（${worst.passed}/${worst.total}，${rate(worst.passed, worst.total)}）。`)
  } else if (showCapability) {
    out.push("- 能力通过率：（数据不足）")
  }
  if (axes.includes("speed")) {
    const ttfts = stats.filter((s) => s.speed.ttftMs != null)
    if (ttfts.length > 0) {
      const fast = [...ttfts].sort((a, b) => a.speed.ttftMs - b.speed.ttftMs)[0]
      const parts = [`TTFT 中位最小 ${fast.label}（${fmtMs(fast.speed.ttftMs)}）`]
      const toks = stats.filter((s) => s.speed.tokPerSec != null)
      if (toks.length > 0) {
        const tp = [...toks].sort((a, b) => b.speed.tokPerSec - a.speed.tokPerSec)[0]
        parts.push(`tok/s 中位最大 ${tp.label}（${fmtRate(tp.speed.tokPerSec)}）`)
      }
      out.push(`- 速度：${parts.join("；")}。`)
    } else {
      out.push("- 速度：（数据不足）")
    }
  }
  if (axes.includes("cost")) {
    const costed = stats.filter((s) => s.costPerPass != null)
    if (costed.length > 0) {
      const cheap = [...costed].sort((a, b) => a.costPerPass - b.costPerPass)[0]
      out.push(`- 成本：每通过任务成本最低 ${cheap.label}（${fmtMoney(cheap.costPerPass)}）。`)
    } else {
      out.push("- 成本：（数据不足——价格未录或 usage 缺失）")
    }
  }
  let missUsage = 0
  let missCost = 0
  let errors = 0
  let throttled = 0
  for (const s of stats) {
    for (const r of allRuns(s.model)) {
      if (r.verdict === "skipped") continue // 不在该模型面 ⇒ 不算数据缺失（§2.1-2）
      if ((r.calls ?? []).some((c) => !c.tokens)) missUsage++
      if (!r.metrics?.cost) missCost++
      if (r.verdict === "error") errors++
      throttled += (r.calls ?? []).filter((c) => c.throttled).length
    }
  }
  const warnCount = (prefix) => (data.warnings ?? []).filter((w) => String(w).startsWith(prefix)).length
  out.push(`- 数据告警：usage 缺失 run ${missUsage} 个 · 成本缺失 run ${missCost} 个 · 价格未录 ${warnCount("价格未录：")} 条 · error ${errors} 次 · 限流等待（throttled）${throttled} 次。`)
  out.push("")
  return out
}

const LIMITS = [
  "单次采样、无置信区间（`--n` > 1 时取中位，仍不做统计显著性检验）。",
  "闭集判据不覆盖开放式质量（机器判分只表达「是否满足该维度的冻结判据」）。",
  "人工 lane 不判分（中文歧义质量需人工阅读；不进能力矩阵与成本归一化）。",
  "价格手动维护（以 prices.json 的 asOf / source 为准；厂商调价后需人工更新并 `--recompute` 重出报告）。",
  "同模型跨渠道差异（baseURL / 网关不同 ⇒ 结果只对本次运行所用渠道成立）。",
  "速度受服务端负载影响（TTFT / tok/s 为观测值，非服务端承诺）。",
  "V1 未覆盖面：不做广谱知识题 / 容器级任务 / LLM-as-judge 主观打分。",
]

/** 渲染完整 md 报告（七段骨架：标题 / 概览 / 方法 / 结果 / 关键发现 / 局限声明 / 附录）。
 *  轴选择（§2.1-1）：`run.axes` 决定出哪几轴（speed / cost）；无能力项 ⇒ 不出能力矩阵与逐维明细/人工判读。
 *  `fileBase` = 产物文件名主部（`<日期>-<标签>`）；由落档面传入 ⇒ 附录指针与磁盘文件名恒一致（单一来源）。 */
export function renderReport(data, { fileBase } = {}) {
  const stats = modelStats(data)
  const date = fileBase ? fileBase.slice(0, 10) : String(data.startedAt ?? "").slice(0, 10)
  const base = fileBase ?? `${date}-${data.label}`
  const axes = Array.isArray(data.run?.axes) && data.run.axes.length > 0 ? data.run.axes : [...AXES]
  const declared = Array.isArray(data.run?.dims) ? data.run.dims : []
  const showCapability = declared.some((t) => t === CAPABILITY_SELECTOR || t === MANUAL_DIM || DIMENSIONS.includes(t)) || declared.length === 0
  const resultSections = [
    ...(showCapability ? matrixSection(data, stats) : []),
    ...(axes.includes("speed") ? speedSection(stats) : []),
    ...(axes.includes("cost") ? costSection(data, stats) : []),
    ...(showCapability ? [...detailSection(data, stats), ...manualSection(data)] : []),
  ]
  if (resultSections.length === 0) resultSections.push("（本轮未选任何报告轴）", "")
  return [
    `# 模型基准报告 · ${data.label} · ${date}`,
    "",
    "> 本报告由 `bench/run.mjs` 自动生成；数据源 = 同 basename 的结果 JSON（`bench/results/`）。",
    "",
    ...overviewSection(data, stats),
    ...methodSection(data),
    "## 结果",
    "",
    ...resultSections,
    ...findingsSection(data, stats, { showCapability, axes }),
    "## 局限声明",
    "",
    ...LIMITS.map((l) => `- ${l}`),
    "",
    "## 附录",
    "",
    "### 复跑命令",
    "",
    "```bash",
    data.run?.command ?? "",
    `node bench/run.mjs --recompute --from bench/results/${base}.json`,
    "```",
    "",
    "### 结果指针",
    "",
    `- \`bench/results/${base}.json\`（本报告的原始数据；跨时点对比 = 两份报告对并列，suiteVersion 相同 = 严格可比）`,
    "",
  ].join("\n")
}
