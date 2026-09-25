/**
 * toolcall/report.mjs — 报告对（设计 §11.8 冻结形态）：JSON 顶层 + md 骨架 + 混淆矩阵 + 成本聚合。
 *
 * 落档 = 复用既有落档面（`bench/lib/output.mjs`：`refuseIfExists` / `writePair`——同名拒写 + 写档前脱敏
 * fail-closed）；`<标签>` 必以 `toolcall-` 起（缺省 `toolcall-baseline`）。报告 = **读数**——「要不要结构
 * 补强 / 怎么补」不在报告内（KD-56：归批次档收口）。
 */

import { median } from "../lib/metrics.mjs"
import { refuseIfExists, writePair } from "../lib/output.mjs"
import { CASES } from "./cases.mjs"
import { aggregateBlock, denominators } from "./grade.mjs"

/** 标签前缀强制（§11.8）：非 `toolcall-` 起 ⇒ 报错（退出码 1）。 */
export function assertToolcallLabel(label) {
  const s = String(label ?? "")
  if (!/^toolcall-[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s)) {
    throw new Error(`--label 非法：「${s}」——本面报告标签必以 toolcall- 起（例：toolcall-baseline；§11.8 前缀强制）`)
  }
  return s
}

const round8 = (n) => Math.round(n * 1e8) / 1e8
const round3 = (n) => Math.round(n * 1000) / 1000
const cell = (v, dash = "—") => (v == null || v === "" ? dash : String(v))

/** 逐变体成本合计（元）= Σ 已录 run 成本（缺 usage / 缺价记 `null` 不入和；全 null ⇒ null）。 */
export function costTotal(runs) {
  const vals = runs.map((r) => r.metrics?.cost?.value).filter((v) => typeof v === "number")
  return vals.length > 0 ? round8(vals.reduce((a, b) => a + b, 0)) : null
}

/** 实测腿（§11.7）：逐（模型 × 变体）`promptTokensMedian`（缺 usage 的 run 不计——中位剔除 null）。 */
export function promptTokensMedian(runs) {
  return median(runs.map((r) => r.metrics?.tokens?.prompt ?? null))
}

/** 混淆矩阵（逐变体：期望 × 实际首调用——**只计有效 run**（`error` / `skipped` 无首调用，见变体总览））。 */
export function confusionOf(variantCases) {
  const counts = new Map()
  for (const c of variantCases) {
    const expectName = CASES.find((x) => x.id === c.caseId)?.expect.name ?? null
    for (const r of c.runs) {
      if (r.terminal === "error" || r.terminal === "skipped") continue
      const key = `${expectName ?? "\u0000"}\u0001${r.firstTool ?? "\u0000"}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  const name = (s) => (s === "\u0000" ? null : s)
  return [...counts.entries()]
    .map(([key, count]) => {
      const [expected, actual] = key.split("\u0001")
      return { expected: name(expected), actual: name(actual), count }
    })
    .sort((a, b) => String(a.expected ?? "").localeCompare(String(b.expected ?? "")) || String(a.actual ?? "").localeCompare(String(b.actual ?? "")))
}

const axisOf = (v) => ({
  id: v.id,
  payload: { tools: v.tools, chars: v.chars, bytes: v.bytes, descriptionChars: v.descriptionChars },
  cases: v.cases.map((c) => ({ caseId: c.caseId, runs: c.runs, axis: aggregateBlock(c.runs) })),
  axis: aggregateBlock(v.cases.flatMap((c) => c.runs)),
  confusion: confusionOf(v.cases),
})

/** 结果 JSON 装配（顶层 = §11.8 冻结形态）。`modelsIn` 逐档 = `{label, provider, model, host, temperature,
 *  reasoningEffort, reasoningEffortFrom, variants:[{id, tools, chars, bytes, descriptionChars, cases:[{caseId, runs}]}]}`。 */
export function buildResult({ opts, startedAt, finishedAt, modelsIn, casesDigest, payloadDigest, warnings }) {
  return {
    kind: "toolcall-probe",
    toolProbeVersion: opts.toolProbeVersion,
    label: opts.label,
    startedAt,
    finishedAt,
    run: {
      models: opts.models,
      cases: [...opts.cases],
      variants: [...opts.variants],
      n: opts.n,
      maxTokens: opts.maxTokens,
      timeoutSec: opts.timeoutSec,
      systemBase: opts.systemBase,
      casesDigest,
      payloadDigest,
    },
    models: modelsIn.map((m) => ({
      label: m.label, provider: m.provider, model: m.model, host: m.host ?? null,
      temperature: m.temperature, reasoningEffort: m.reasoningEffort ?? null, reasoningEffortFrom: m.reasoningEffortFrom ?? null,
      variants: m.variants.map(axisOf),
    })),
    warnings,
  }
}

/** 产物 basename（`<日期>-<标签>`——日期取 startedAt 前 10 位）。 */
export function fileBaseOf(result) {
  return `${String(result.startedAt).slice(0, 10)}-${result.label}`
}

const rate = (part, denom) => (denom > 0 ? `${part}/${denom}（${round3(part / denom)}）` : `—/${denom}`)

/** 轴率格（计数 / 分母 + 比率；分母 0 或 null ⇒ `—`）。 */
function axisCells(block, runs) {
  const d = denominators(runs)
  return {
    hit: rate(block.hit, d.axis1),
    legal: rate(block.legal, d.axis23),
    semOk: rate(block.semOk, d.axis23),
    perfect: rate(block.perfect, d.axis23),
  }
}

/** md 渲染（骨架 = §11.8；**完全由结果 JSON 渲染**——两档恒一致）。 */
export function renderMd(result) {
  const { run, models } = result
  const isDry = (result.warnings ?? []).some((w) => String(w).includes("dry-run 自检"))
  const out = []
  out.push(`# 工具面调用准确率探针报告（${result.label}）`, "")
  out.push("## 概览", "")
  out.push(`- 版本：toolProbeVersion ${result.toolProbeVersion} · 起止 ${result.startedAt} → ${result.finishedAt} · 来源：${isDry ? "dry-run 自检（读数 = 脚本化夹具，**非真实测量**）" : "真实跑批"}`)
  out.push(`- 参测档：${run.models} · 变体 ${run.variants.join(", ")} · 用例 ${run.cases.length} 例 · n=${run.n} · maxTokens=${run.maxTokens} · timeoutSec=${run.timeoutSec}`)
  out.push(`- 系统行（SYSTEM_BASE · 全变体全例一致）：${run.systemBase}`)
  out.push(`- 夹具摘要：casesDigest ${run.casesDigest} · V0 载荷摘要：payloadDigest ${run.payloadDigest}`)
  out.push("")
  out.push("| 模型 | 变体 | tools | chars | bytes | descriptionChars |", "|---|---|---|---|---|---|")
  for (const m of models) {
    for (const v of m.variants) out.push(`| ${m.label} | ${v.id} | ${v.payload.tools.length} | ${v.payload.chars} | ${v.payload.bytes} | ${v.payload.descriptionChars} |`)
  }
  out.push("")
  out.push("## 方法", "")
  out.push("- 形态：API 级直测 · 单发单轮（`maxRounds = 1`）——用例提示 + 变体载荷（`tools`）→ 核 provider 路径 `chat` → 首个响应；判定面 = **首个工具调用** `{name, arguments}`。工具不真执行、题面路径为假想路径（无文件系统——判定只看参数成形）。")
  out.push("- 变体构造法：V0 = 产品面实面逐字（`builtinTools` × `toOpenAISchema`，含能力位 `read_image`）· V1 = 5 档枚举块（`read` / `grep` / `bash` / `git` / `edit`）+ V0 文本逐字 + `edit.edits[].*` 7 项参数描述 · V2 = 路由句（首行 → 首个句末符 → 120 字符硬截 `…`）+ 实面 schema 逐字。产品描述文本零改（变体只在探针载荷内构造）。")
  out.push("- 三轴判据：① 选择命中 = 首调 == 期望（期望无调用 ⇒ 无调用为命中）；② schema 合法 = `called` ∧ 全部调用可解析为 JSON 对象 ∧ 合该工具 `parameters`（射程 `type` / `required` / `enum` / `items` / `minimum` / `maximum`；载荷外工具名 ⇒ 否 + `offPayload` 单列）；③ 参数语义正确 = 轴① ∧ 逐例谓词。")
  out.push("- 分母：`n` = 有效 run（`terminal ∉ {error, skipped}`）；轴① 分母 = `n`；轴② / 轴③ 分母 = `n −` 期望无调用 run 数（其轴值为 `null`——不入分子与分母，`perfect` 同）；无调用 run 逐轴按轴表判并单列 `noCall`；接口错 / 空响应 run（`error`）无判定素材 ⇒ 三轴记 `null`（不入分母）。")
  out.push("- 成本式：（prompt − cached）× input + cached × cachedInput + completion × output（单价 = `bench/prices.json` 单源；缺价 / 缺 usage ⇒ `null`——**不按字符估 token**）。")
  out.push("- 已知偏差指针：逐条见《局限声明》（§11.10 ①–⑥）。")
  out.push("- 版本轴：本面自带 `TOOL_PROBE_VERSION`（= " + result.toolProbeVersion + "）；V0 载荷（产品面实面）不入本轴，由 `payloadDigest` 锚记；与 QA 套件 `SUITE_VERSION` / `PROBE_VERSION` 无关轴。")
  out.push("")
  out.push("## 结果", "")
  for (const m of models) {
    out.push("### 变体总览 · " + m.label, "")
    out.push("**分母列于表头行**（轴① = 有效 run 数；轴② / 轴③ / 完全正确 = 有效 run − 期望无调用 run 数）；格 = `计数（比率）`。", "")
    out.push("| 变体 | 轴①命中（分母 = 有效 run） | 轴②合法（分母 = n − 期望无调用 run） | 轴③语义（分母同轴②） | 完全正确（分母同轴②） | 无调用 | error | skipped | 成本 | prompt tokens 中位 | Δ vs V0 |", "|---|---|---|---|---|---|---|---|---|---|---|")
    const base = promptTokensMedian(m.variants.find((v) => v.id === "V0")?.cases.flatMap((c) => c.runs) ?? [])
    for (const v of m.variants) {
      const runs = v.cases.flatMap((c) => c.runs)
      const cells = axisCells(v.axis, runs)
      const med = promptTokensMedian(runs)
      const delta = med == null || base == null ? "—" : String(round8(med - base))
      out.push(`| ${v.id} | ${cells.hit} | ${cells.legal} | ${cells.semOk} | ${cells.perfect} | ${v.axis.noCall} | ${v.axis.error} | ${v.axis.skipped} | ${cell(costTotal(runs))} | ${cell(med)} | ${delta} |`)
    }
    out.push("")
    out.push(`### 逐例 × 变体 · ${m.label}`, "")
    out.push("逐格 = 该（用例 × 变体）格内 `n` 次重复的**同口径**读数：首调用 = 各次首调用去重（多值以 `/` 连）；命中 / 轴② / 轴③ = 真值计数 / 该轴分母；成本 = Σ。", "")
    out.push("| 用例 | 变体 | 首调用 | 命中 | 轴② | 轴③ | 成本 |", "|---|---|---|---|---|---|---|")
    for (const v of m.variants) {
      for (const c of v.cases) {
        const cruns = c.runs
        const d = denominators(cruns)
        const count = (f) => cruns.filter(f).length
        const names = [...new Set(cruns.map((r) => r.firstTool).filter(Boolean))]
        const tally = (part, denom) => (denom > 0 ? `${part}/${denom}` : "—")
        out.push(`| ${c.caseId} | ${v.id} | ${names.length > 0 ? names.join("/") : "—"} | ${tally(count((r) => r.hit === true), d.axis1)} | ${tally(count((r) => r.legal === true), d.axis23)} | ${tally(count((r) => r.semOk === true), d.axis23)} | ${cell(costTotal(cruns))} |`)
      }
    }
    out.push("")
    out.push(`### 混淆矩阵 · ${m.label}`, "")
    out.push("**只计有效 run**（`error` / `skipped` 无首调用——见变体总览）；格 = 计数。", "")
    for (const v of m.variants) {
      const actuals = [...new Set(v.confusion.map((x) => x.actual))].sort((a, b) => String(a ?? "").localeCompare(String(b ?? "")))
      const expecteds = [...new Set(v.confusion.map((x) => x.expected))].sort((a, b) => String(a ?? "").localeCompare(String(b ?? "")))
      out.push(`**${v.id}**`, "")
      out.push(`| 期望 \\ 实际 | ${actuals.map((a) => cell(a, "（无调用）")).join(" | ")} |`, `|---|${actuals.map(() => "---").join("|")}|`)
      for (const e of expecteds) {
        const row = actuals.map((a) => v.confusion.find((x) => x.expected === e && x.actual === a)?.count ?? 0)
        out.push(`| ${cell(e, "（无调用）")} | ${row.join(" | ")} |`)
      }
      out.push("")
    }
    out.push(`### 成本读数 · ${m.label}`, "")
    out.push("静态腿（载荷 chars / bytes / descriptionChars）见《概览》；**实测腿** = 逐（变体）`prompt tokens` 中位与 Δ vs V0（同案同模型差分——跨模型绝对值不可比）：", "")
    out.push("| 变体 | prompt tokens 中位 | Δ vs V0 | 成本合计 |", "|---|---|---|---|")
    for (const v of m.variants) {
      const runs = v.cases.flatMap((c) => c.runs)
      const med = promptTokensMedian(runs)
      out.push(`| ${v.id} | ${cell(med)} | ${med == null || base == null ? "—" : String(round8(med - base))} | ${cell(costTotal(runs))} |`)
    }
    out.push("")
  }
  const allRuns = models.flatMap((m) => m.variants.flatMap((v) => v.cases.flatMap((c) => c.runs)))
  const grid = models.flatMap((m) => m.variants.map((v) => ({ m, v })))
  const hitRate = ({ m, v }) => { const d = denominators(v.cases.flatMap((c) => c.runs)); return d.axis1 > 0 ? v.axis.hit / d.axis1 : null }
  const perfRate = ({ m, v }) => { const d = denominators(v.cases.flatMap((c) => c.runs)); return d.axis23 > 0 ? v.axis.perfect / d.axis23 : null }
  const extremes = (fn) => {
    const vals = grid.map((g) => ({ g, r: fn(g) })).filter((x) => x.r != null).sort((a, b) => b.r - a.r)
    return vals.length === 0 ? "—" : `最高 ${vals[0].g.m.label} ${vals[0].g.v.id}（${round3(vals[0].r)}）· 最低 ${vals[vals.length - 1].g.m.label} ${vals[vals.length - 1].g.v.id}（${round3(vals[vals.length - 1].r)}）`
  }
  out.push("## 关键发现", "")
  out.push(`- 有效 run 数：${allRuns.filter((r) => r.terminal !== "error" && r.terminal !== "skipped").length}（` + `error ${allRuns.filter((r) => r.terminal === "error").length} 起 · 成本闸截断 ${allRuns.filter((r) => r.terminal === "skipped").length} 起）`)
  out.push(`- 轴① 命中率（逐模型 × 变体）：${extremes(hitRate)}`)
  out.push(`- 完全正确率（` + "`legal ∧ semOk`" + `）：${extremes(perfRate)}`)
  const sum = (f) => allRuns.filter(f).length
  out.push(`- 辅助计数：无调用 ${sum((r) => r.called === false)} · 多调用 ${sum((r) => (r.toolNames?.length ?? 0) > 1)} · 非 JSON ${sum((r) => r.parseOk === false)} · 载荷外工具名 ${sum((r) => (r.schemaErrors ?? []).some((e) => String(e).startsWith("载荷外工具名")))}`)
  const statics = models.flatMap((m) => m.variants.map((v) => ({ m, v })))
  const byChars = [...statics].sort((a, b) => a.v.payload.chars - b.v.payload.chars)
  out.push(`- 载荷静态读数（chars 极小 / 极大）：${byChars[0].v.id} ${byChars[0].v.payload.chars} / ${byChars[byChars.length - 1].v.id} ${byChars[byChars.length - 1].v.payload.chars}`)
  out.push("- 逐档：`TOOL_PROBE_VERSION` + `casesDigest` / `payloadDigest` 相同 = 严格可比；`payloadDigest` 变动 ⇒ 产品面工具载荷已变（V0 变体）。")
  out.push("")
  out.push("## 局限声明", "")
  out.push("- ① system 面 = 仅 `SYSTEM_BASE` 一行（真实会话另有人格 / 纪律槽 + 项目 AGENTS.md）——**绝对值不可外推**；变体间可比性不受影响。")
  out.push("- ② 载荷面 = `builtinTools` 静态表 + 能力位 `read_image`；**不含**实例绑定族（memory / `code_search` / `doc_search` / `repo_outline` / `settings` / `peer_instances` / 台账查询）与 depth 绑定族（`subagent` / `advisor` / …）——那些工具参与的选择面不在本面。")
  out.push("- ③ 单发单轮（`maxRounds = 1`）⇒ 无「读过工具结果后修正选择」面、无跨步序面。")
  out.push("- ④ 工具不真执行、题面中的路径为假想路径（无文件系统）——判定只看参数成形。")
  out.push("- ⑤ 每档样本量 = n（缺省 3）⇒ 不构成统计显著性检验（不做区间估计）。")
  out.push("- ⑥ 提示词面不参与；本面只动**工具载荷**这一自变量。")
  out.push("- 本面 = **测量面 · 非门控**（不按模型设岗 / 不改配置默认）；不进 CI / 发布门；报告只出读数（建议面归批次档收口）。")
  out.push("")
  out.push("## 附录", "")
  out.push(`- 复跑命令：\`node bench/toolcall.mjs --models ${run.models} --variants ${run.variants.join(",")} --cases ${run.cases.join(",")} --n ${run.n} --max-tokens ${run.maxTokens} --timeout ${run.timeoutSec} --label ${result.label}${isDry ? " --dry-run" : ""}\``)
  out.push(`- 结果指针：\`bench/results/${fileBaseOf(result)}\`（同名 .md / .json 成对）`)
  out.push("- 用例清单（题面逐字 = 实际发送串）：", "")
  out.push("| 用例 | 期望工具 | 题面 |", "|---|---|---|")
  for (const c of CASES) out.push(`| ${c.id} | ${cell(c.expect.name, "（期望无调用）")} | ${c.prompt} |`)
  out.push("")
  return out.join("\n")
}

/** 落档（同名拒写 + 脱敏断言 —— 既有落档面单点）。 */
export function writeToolcallReport(result) {
  const base = fileBaseOf(result)
  refuseIfExists(base)
  return writePair(base, result, renderMd(result))
}
