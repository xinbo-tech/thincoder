/**
 * probe/report.mjs — 报告对（与 §2.3 家族同形；§10.7 冻结）：md 骨架 + JSON 顶层 + 成本聚合 + 路径占位规范化。
 *
 * 落档 = 复用既有落档面（`bench/lib/output.mjs`：`refuseIfExists` / `writePair`——同名拒写 + 写档前脱敏
 * fail-closed）；`<标签>` 必以 `probe-` 起（缺省 `probe-conflict`）。自产文本字段写前**前置规范化**
 * （§10.7 路径口径）：沙箱根前缀 ⇒ `<sandbox>`、其余绝对路径 ⇒ `<abs>`（保数据）；凭据 / 身份类 ⇒ 照旧拒写。
 */

import { costOf } from "../lib/prices.mjs"
import { refuseIfExists, writePair } from "../lib/output.mjs"
import { median } from "../lib/metrics.mjs"
import { attemptedButNoLanding } from "./classify.mjs"

/** 标签前缀强制（§10.7 / KD-46）：非 `probe-` 起 ⇒ 报错（退出码 1）。 */
export function assertProbeLabel(label) {
  const s = String(label ?? "")
  if (!/^probe-[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s)) {
    throw new Error(`--label 非法：「${s}」——探针报告标签必以 probe- 起（例：probe-conflict；§10.7 前缀强制）`)
  }
  return s
}

/** 绝对路径字面（自产文本规范化用；与 §2.8 断言面同族：盘符路径 / 用户目录路径）。 */
const ABS_PATTERNS = [/(^|[^A-Za-z0-9])[A-Za-z]:[\\/][^\s"'`<]*/g, /\/(?:Users|home)\/[^\s"'`]*/g]

/**
 * 自产文本前置规范化（§10.7）：沙箱根前缀 ⇒ `<sandbox>`；其余绝对路径 ⇒ `<abs>`（**保数据**——
 * 已付费 run 不因路径拒写）。返回 `{ text, absCount }`（`absCount` 供 warning 计数）。
 */
export function normalizeSelfText(text, sandboxRoot) {
  let flat = String(text ?? "")
  const rootFwd = String(sandboxRoot ?? "").replaceAll("\\", "/")
  if (rootFwd && flat.replaceAll("\\", "/").includes(rootFwd)) {
    // 根前缀逐形态替换（原样 / 正斜杠两形态）
    const re = new RegExp(escapeRe(String(sandboxRoot)) + "|" + escapeRe(rootFwd), "g")
    flat = flat.replace(re, "<sandbox>")
  }
  let absCount = 0
  const out = flat.replace(ABS_PATTERNS[0], (m, lead) => { absCount++; return `${lead}<abs>` })
    .replace(ABS_PATTERNS[1], () => { absCount++; return "<abs>" })
  return { text: out, absCount }
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** 单 run 成本（元）：单价 × token 三元组（缺价 / 缺 usage ⇒ null——不估算）。 */
export function runCostCny(priceEntry, tokens, prices) {
  if (!priceEntry) return null
  const rec = costOf(priceEntry, tokens, prices)
  return rec ? rec.value : null
}

const round8 = (n) => Math.round(n * 1e8) / 1e8

/** `aggregate` 口径（冻结 · §10.7）：`n` = 实跑 run 数（`terminal ≠ "skipped"`）；上抛率分母排除 `skipped`。 */
export function aggregateRuns(runs) {
  const live = runs.filter((r) => r.terminal !== "skipped")
  const costs = live.map((r) => r.metrics?.cost).filter((v) => typeof v === "number")
  return {
    asked: runs.filter((r) => r.behaviorClass === "escalated").length,
    n: live.length,
    skipped: runs.length - live.length,
    firstAskTurnMedian: median(runs.map((r) => r.firstAskTurn)),
    spun: runs.filter((r) => r.behaviorClass === "spun").length,
    landed: runs.filter((r) => (r.landedFiles ?? []).some((x) => x.target === true)).length,
    costCny: costs.length > 0 ? round8(costs.reduce((a, b) => a + b, 0)) : null,
  }
}

/**
 * 结果 JSON 装配（顶层 = §10.7 冻结形态）。`modelsIn` 逐档 = `{ label, provider, model, host, temperature,
 * reasoningEffort, reasoningEffortFrom, priceEntry, runs }`；`judgeIn` = `{ slot, model, priceEntry, calls, verdicts }`。
 */
export function buildProbeResult({ opts, startedAt, finishedAt, digest, sandboxDir, modelsIn, judgeIn, warnings, prices }) {
  const models = modelsIn.map((m) => {
    const runs = m.runs.map((r) => ({ ...r, metrics: { ...r.metrics, cost: runCostCny(m.priceEntry, r.metrics?.tokens, prices) } }))
    return {
      label: m.label, provider: m.provider, model: m.model, host: m.host ?? null,
      temperature: m.temperature, reasoningEffort: m.reasoningEffort ?? null, reasoningEffortFrom: m.reasoningEffortFrom ?? null,
      runs,
      aggregate: aggregateRuns(runs),
    }
  })
  const jc = (judgeIn.calls ?? []).map((c) => runCostCny(judgeIn.priceEntry, c.tokens, prices)).filter((v) => typeof v === "number")
  return {
    kind: "conflict-probe",
    probeVersion: opts.probeVersion,
    label: opts.label,
    startedAt, finishedAt,
    run: {
      models: opts.models, fixtures: opts.fixtures, n: opts.n, maxTurns: opts.maxTurns,
      timeoutSec: opts.timeoutSec, maxTokens: opts.maxTokens, sandboxDir, promptsDigest: digest,
    },
    models,
    judge: {
      slot: judgeIn.slot, model: judgeIn.model, calls: (judgeIn.calls ?? []).length,
      costCny: jc.length > 0 ? round8(jc.reduce((a, b) => a + b, 0)) : null,
      verdicts: judgeIn.verdicts,
    },
    warnings,
  }
}

const cell = (v, dash = "—") => (v == null || v === "" ? dash : String(v))

/** 结果表逐 run 行（列集 = §10.7 md 骨架：上抛 / 首次上抛回合 / 落盘（目标件/总）/ 终止形态 / 回合数 / 报告面 / 成本）。 */
function resultRows(runs) {
  return runs.map((r, i) => {
    const escalation = r.firstAskTurn !== null ? `t${r.firstAskTurn}` : (r.continuation?.asked ? `续 t${r.continuation.turnsUsed}` : "—")
    const landed = r.terminal === "skipped" ? "—" : `${(r.landedFiles ?? []).filter((x) => x.target).length}/${(r.landedFiles ?? []).length}`
    const cost = r.metrics?.cost
    const name = r.__reps > 1 ? `${r.__label} #${i + 1}` : r.__label
    return `| ${name} | ${r.behaviorClass === "escalated" ? "✔" : "—"} | ${escalation} | ${landed} | ${cell(r.terminal)} | ${cell(r.turnsUsed)} | ${cell(r.reportFace)} | ${cost == null ? "—" : cost} |`
  }).join("\n")
}

/** md 渲染（骨架 = §10.7；**完全由结果 JSON 渲染**——两档恒一致）。 */
export function renderProbeMd(result) {
  const { run, models } = result
  // 自检产物自识别（体例同 QA 面：命令串里看得到 `--dry-run`——防自检对被测成真实测量）
  const isDry = (result.warnings ?? []).some((w) => String(w).includes("dry-run 自检"))
  const out = []
  out.push(`# 矛盾上抛探针报告（${result.label}）`, "")
  out.push("## 概览", "")
  out.push(`- 版本：probeVersion ${result.probeVersion} · 起止 ${result.startedAt} → ${result.finishedAt} · 来源：${isDry ? "dry-run 自检（读数 = 脚本化夹具，**非真实测量**）" : "真实跑批"}`)
  out.push(`- 参测档：${run.models ?? "—"} · 夹具 ${run.fixtures.join(", ")} · n=${run.n} · maxTurns=${run.maxTurns} · timeoutSec=${run.timeoutSec} · maxTokens=${run.maxTokens}`)
  out.push(`- 提示词摘要（三槽）：${run.promptsDigest ?? "—"}`)
  out.push(`- 沙箱：${run.sandboxDir} · 判官位 ${result.judge.slot}（${result.judge.model}）· 判官调用 ${result.judge.calls} 次`)
  out.push("")
  const params = models.map((m) => `| ${m.label} | ${m.provider}:${m.model} | ${m.host ?? "—"} | ${m.temperature} | ${m.reasoningEffort ?? "—"}${m.reasoningEffortFrom ? `（${m.reasoningEffortFrom}）` : ""} | ${run.maxTokens} |`)
  out.push("| 模型 | 路由 | host | temperature | 思考强度 | maxTokens |", "|---|---|---|---|---|---|", ...params, "")
  out.push("## 方法", "")
  out.push("- 驱动路径：进程内核心 spawn API（`buildSpawnChild` + `runChildPipeline`）——父面零 LLM（provider 抛错桩），child = eng-designer / depth 1 / 同真实 spawn 管道。")
  out.push("- 停止条件（冻结）：首次 `ask` **入队** ⇒ 该 run 终止（`asked`）；无 ask ⇒ `completed` / `cap`（撞 `--max-turns`）/ `timeout`（墙钟）；运行异常 ⇒ `error`；成本闸截断 ⇒ `skipped`（未执行——不入聚合分母）。")
  out.push("- 判据：机械读数（`firstAskTurn` / `landedFiles`（沙箱 diff 实测）等）+ 行为类表；上抛判据 = 父队列 `kind=\"ask\"` 条目。")
  out.push("- judge 兜底：无 ask run 的终报（前 2000 字符）经 `judge.json` A 位单判（`surfaced` / `buried` / `unclear`）；失败 ⇒ `reportFace = null` + warning（不阻断、不级联）。")
  out.push(`- 版本轴：本面自带 \`PROBE_VERSION\`（= ${result.probeVersion}）；与 QA 套件 \`SUITE_VERSION\` 无关轴。`)
  out.push("")
  out.push("## 结果", "")
  for (const fid of run.fixtures) {
    out.push(`### ${fid}`, "")
    out.push("| 模型 | 上抛 | 首次上抛回合 | 落盘（目标件/总） | 终止形态 | 回合数 | 报告面 | 成本 |", "|---|---|---|---|---|---|---|---|")
    const rows = models.flatMap((m) => resultRows(m.runs.filter((r) => r.fixtureId === fid).map((r) => ({ ...r, __label: m.label, __reps: run.n }))))
    out.push(...(rows.length > 0 ? rows : ["| — | — | — | — | — | — | — | — |"]), "")
  }
  const all = models.flatMap((m) => m.runs)
  const count = (cls) => all.filter((r) => r.behaviorClass === cls).length
  out.push("## 关键发现", "")
  out.push(`- 实跑 run 数：${all.filter((r) => r.terminal !== "skipped").length}（成本闸截断 ${all.filter((r) => r.terminal === "skipped").length} 起）`)
  out.push(`- 上抛（escalated）：${count("escalated")} 起 · 静默落盘（silent-landed）：${count("silent-landed")} 起 · 静默报告（silent-reported）：${count("silent-reported")} 起`)
  out.push(`- 绕圈（spun）：${count("spun")} 起 · timeout：${count("timeout")} 起 · error：${count("error")} 起`)
  const noLanding = all.filter(attemptedButNoLanding).length
  out.push(`- 写尝试但沙箱零落盘：${noLanding} 起（尝试列 vs 实测列的面差计数）`)
  const med = models.map((m) => `${m.label}：n=${m.aggregate.n} · 上抛 ${m.aggregate.asked} · 上抛率 ${m.aggregate.n > 0 ? round8(m.aggregate.asked / m.aggregate.n) : "—"} · 首次上抛回合中位 ${cell(m.aggregate.firstAskTurnMedian)} · 成本 ${cell(m.aggregate.costCny)}`).join(" ； ")
  out.push(`- 逐档：${med}`)
  out.push("")
  out.push("## 局限声明", "")
  out.push("- ① memory 绑定工具族不装（`code_search` / `doc_search` / memory / `repo_outline` / `settings` / `peer_instances` / 台账查询——沙箱无索引且须与真实仓隔离）。")
  out.push("- ② 沙箱**仓外**（系统临时根下）+ **非 git 仓**（物化前自检向上无 `.git`）；git 工具调用失败如实记录。")
  out.push("- ③ 父面不经 LLM ⇒ 无人答复 ask，ask 后轨迹不入读数。")
  out.push("- ④ 每族单夹具（形态族覆盖 = 3 族各 1）；⑤ 不采速度面（TTFT / tok/s）；⑥ 子代理内嵌 spawn（explore）照实开放——发生即入调用序列；⑦ 未测提示词内容本身。")
  out.push("- 本面 = **测量面 · 非门控**（不按模型设岗 / 不改配置默认）；不进 CI / 发布门。")
  out.push("")
  out.push("## 附录", "")
  out.push(`- 复跑命令：\`node bench/probe.mjs --models ${run.models} --fixtures ${run.fixtures.join(",")} --n ${run.n} --max-turns ${run.maxTurns} --timeout ${run.timeoutSec} --label ${result.label}${isDry ? " --dry-run" : ""}\``)
  out.push(`- 结果指针：\`bench/results/${fileBaseOf(result)}\`（同名 .md / .json 成对）`)
  out.push("")
  return out.join("\n")
}

/** 产物 basename（`<日期>-<标签>`——日期取 startedAt 前 10 位）。 */
export function fileBaseOf(result) {
  return `${String(result.startedAt).slice(0, 10)}-${result.label}`
}

/** 写法（§10.7 路径口径）：自产文本字段（askMessage / reportHead / warnings）前置规范化——
 *  沙箱根前缀 ⇒ `<sandbox>`、其余绝对路径 ⇒ `<abs>` + warning 计数（保数据）。返回 `{ result, absCount }`。 */
export function normalizeResultText(result, sandboxRoot) {
  const clone = structuredClone(result)
  let absCount = 0
  const fix = (s) => {
    const r = normalizeSelfText(s, sandboxRoot)
    absCount += r.absCount
    return r.text
  }
  for (const m of clone.models ?? []) {
    for (const r of m.runs ?? []) {
      if (r.askMessage != null) r.askMessage = fix(r.askMessage)
      if (r.reportHead != null) r.reportHead = fix(r.reportHead)
      // 写工具入参可能携绝对路径（模型行为面）⇒ 同规范（保数据——不因路径拒写整份报告）。
      // 沙箱内路径 ⇒ `<sandbox>/…`（仍可读）；沙箱外 ⇒ `<abs>` + 计数（§10.7 路径口径）。
      for (const c of r.mutatorCalls ?? []) {
        if (typeof c.path === "string") c.path = fix(c.path)
      }
    }
  }
  clone.warnings = (clone.warnings ?? []).map(fix)
  if (absCount > 0) clone.warnings.push(`自产文本含沙箱外绝对路径 ${absCount} 处 —— 已记 <abs> 占位（§10.7 路径口径）`)
  return clone
}

/** 落档（同名拒写 + 路径占位规范化 + 脱敏断言 + 落盘失败可见——既有落档面单点）。 */
export function writeProbeReport(result, { sandboxRoot } = {}) {
  const base = fileBaseOf(result)
  refuseIfExists(base)
  const normalized = sandboxRoot ? normalizeResultText(result, sandboxRoot) : result
  return writePair(base, normalized, renderProbeMd(normalized))
}
