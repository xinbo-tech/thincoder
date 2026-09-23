/**
 * lib/pipeline.mjs — 运行编排（run.mjs 超 300 行 ⇒ 拆出；2026-09-24 判官面增量再次拆分：
 * 落档面 → `lib/output.mjs` · 离线重算面 → `lib/recompute.mjs`——设计档 §3 拆分触发条件）。
 *
 * `runMain`：真实运行 / dry-run 自检（夹具表由 run.mjs 传入——夹具落点仍住 run.mjs）。
 *   **动态** `import("./client.mjs")` 只发生在本函数内 ⇒ `--recompute` 分支构造性零网络（AC-10）。
 * 判官面（§2.10 / §2.11）：槽位解析（冻结绑定 + provider 校验 + 与被测重合明示）→ 用例 `ctx.judge()`（判官对 + 分歧仲裁）→ 逐 run 记录；
 *   机械 fail ⇒ 复核（辅判信号，不改判）；成本由 `prices.mjs` 后置逐位记账（不进被测成本面）。
 *
 * 产物落盘唯一面 = `output.writePair`（写档前脱敏断言 fail-closed，§2.8）；同名拒写（KD-10）。
 */

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { CASES, CLASS_LABELS, MANUAL, SUITE_VERSION } from "../cases/index.mjs"
import { effectiveDims, loadRoster, selectEntries } from "./roster.mjs"
import { applyPricesToResult, loadPrices, pricesPath } from "./prices.mjs"
import { runMetrics } from "./metrics.mjs"
import { renderReport } from "./report.mjs"
import {
  judgeConfigPath, judgeQuestion, judgeSnapshot, judgeWithPair, loadJudgeConfig, resolveJudgeSlots, reviewRun, reviewSnapshot, shouldReview, turnMaterial,
} from "./judge.mjs"
import { head, isoLocal, refuseIfExists, writePair } from "./output.mjs"

export { recomputeMain } from "./recompute.mjs"

const BENCH_DIR = dirname(dirname(fileURLToPath(import.meta.url)))
const emptyMetrics = () => ({ ttftMs: null, totalMs: null, tokPerSec: null, tokens: { prompt: null, cached: null, completion: null }, cost: null })

function commandFor(opts) {
  const parts = ["node bench/run.mjs"]
  if (opts.models) parts.push(`--models ${opts.models}`)
  if (opts.dims) parts.push(`--dims ${opts.dims}`)
  parts.push(`--label ${opts.label}`)
  if (opts.repeats !== 1) parts.push(`--n ${opts.repeats}`)
  if (opts.maxTokens !== 4096) parts.push(`--max-tokens ${opts.maxTokens}`)
  if (opts.timeoutSec !== 120) parts.push(`--timeout ${opts.timeoutSec}`)
  if (opts.dryRun) parts.push("--dry-run")
  return parts.join(" ")
}

/** 题面正本（§2.2-11）：静态用例 = `prompt` 逐字；多轮用例 = `prompt` + `build().followUps` 逐字拼接；
 *  构造型用例（longctx / vision）= 声明 `prompt` 逐字（含载荷括注——载荷入 `build()`、不入档）。 */
function casePromptText(c) {
  const built = typeof c.build === "function" ? c.build() : null
  const followUps = built?.followUps ?? []
  return followUps.length > 0 ? [c.prompt, ...followUps].join("\n") : c.prompt
}

/** 单次用例执行（含判分 / 判官 / 复核；模型用例失败 = 数据，不影响退出码）。 */
async function executeRun({ client, caseObj, providerEntry, transport, signal, timeoutMs, n, judgeEnv }) {
  const res = await client.runCase({ caseObj, providerEntry, transport, signal, timeoutMs })
  const metrics = runMetrics(res.calls)
  let verdict = "error"
  let detail = `接口错误：${head(res.error, 180)}`
  let judgeRec = null
  let reviewRec = null
  if (!res.error) {
    const ctx = judgeEnv ? judgeEnv.ctxFor(caseObj, res) : {}
    const g = await caseObj.grade(client.caseResultView(res.turns), ctx)
    judgeRec = ctx.result ?? null
    if (g?.error) {
      verdict = "error"
      detail = head(g.detail ?? g.error, 200)
    } else {
      verdict = g?.pass ? "pass" : "fail"
      detail = head(g?.detail, 200)
    }
    // 机械 fail 复核（§2.11 触发判据 = judge.shouldReview 单源；error / skipped 不触发）
    if (shouldReview({ verdict, judge: judgeRec }, caseObj)) {
      reviewRec = await reviewRun({
        caseObj,
        turns: res.turns,
        mechDetail: detail,
        slots: judgeEnv.slots,
        transport: judgeEnv.reviewTransportFor(caseObj),
        providers: judgeEnv.providers,
        signal,
      })
    }
  }
  const last = res.turns[res.turns.length - 1] ?? { text: "", reasoning: "" }
  const toolNames = [...new Set(res.calls.flatMap((c) => c.toolNames))]
  return {
    n,
    verdict,
    detail,
    metrics,
    calls: res.calls,
    ...(judgeRec ? { judge: judgeRec } : {}), // §2.2-7：未发生不写字段（不写 null 占位）
    ...(reviewRec ? { review: reviewRec } : {}),
    summary: {
      textHead: head(last.text, 300),
      textLen: String(last.text ?? "").length,
      reasoningLen: String(last.reasoning ?? "").length,
      toolNames,
    },
  }
}

/** 判官会话装配（§2.10/§2.11）：槽位 → `ctx.judge()`（本用例声明 + 单取值点素材）+ 复核传输面。 */
function makeJudgeEnv({ client, slots, providers, fixture, signal, dryRun }) {
  return {
    slots,
    providers,
    ctxFor: (caseObj, res) => {
      const ctx = {
        judge: async () => {
          const decl = caseObj.judge
          const material = decl ? turnMaterial(res.turns?.[decl.turn]) : null
          const transport = dryRun
            ? client.fixtureSlotTransport(fixture?.judge?.[caseObj.id] ?? {})
            : client.liveTransport
          const r = await judgeWithPair({ decl, question: judgeQuestion(caseObj), material, slots, transport, providers, signal })
          ctx.result = r
          return r
        },
      }
      return ctx
    },
    reviewTransportFor: (caseObj) => (dryRun
      ? client.fixtureSlotTransport({ review: fixture?.review?.[caseObj.id] ?? [] })
      : client.liveTransport),
  }
}

/** 真实运行 / dry-run 自检（fixture = run.mjs 内联固定响应表；dry-run 不读用户 config）。 */
export async function runMain(opts, sel, fixture) {
  const roster = loadRoster(join(BENCH_DIR, "models.json"))
  const entries = selectEntries(roster, opts.models)
  const prices = loadPrices(pricesPath())
  const judgeCfg = loadJudgeConfig(judgeConfigPath()) // 判官必备（§2.10.3）：缺文件 / 不合 schema ⇒ 拒跑
  const startedAt = isoLocal()
  const fileBase = `${startedAt.slice(0, 10)}-${opts.label}`
  refuseIfExists(fileBase)

  const client = await import("./client.mjs")
  const transportFor = opts.dryRun
    ? (caseObj) => client.fixtureTransport(fixture[caseObj.id] ?? fixture.manual?.[caseObj.promptId] ?? [])
    : () => client.liveTransport
  let providers = null
  if (!opts.dryRun) {
    const { loadConfig } = await import("../../thincoder-core/config.mjs")
    providers = loadConfig().providers ?? []
    const missing = entries.filter((e) => !providers.some((p) => p.name === e.provider)).map((e) => e.label)
    if (missing.length > 0) throw new Error(`以下条目的 provider 不在用户 config（~/.thincoder/config.json）：${missing.join(", ")}`)
  }
  // 判官槽位解析（冻结绑定 + provider 校验 + 与被测重合明示——无拒跑闸；dry-run 用夹具身份 ⇒ 跳过 config 检查）
  const { slots, warnings: judgeWarnings } = resolveJudgeSlots(judgeCfg, { providers: opts.dryRun ? null : providers, tested: entries })

  const ac = new AbortController()
  const onSigint = () => ac.abort(new Error("SIGINT"))
  process.once("SIGINT", onSigint)
  const warnings = [...judgeWarnings]
  const modelsOut = []
  const manualOut = []
  let allDead = false
  try {
    // 分母按各条目的**有效维度面**计（roster 排除的用例不入分母——它们 push skipped，不 step++）
    const totalSteps = entries.reduce((sum, e) => {
      const eff = effectiveDims(e, sel.runDims)
      return sum + opts.repeats * CASES.filter((c) => sel.runDims.has(c.dim) && eff.has(c.dim)).length + (sel.runManual ? MANUAL.length : 0)
    }, 0)
    let step = 0
    for (const entry of entries) {
      const user = providers ? providers.find((p) => p.name === entry.provider) : null
      const providerEntry = opts.dryRun
        ? { name: entry.provider, model: entry.model, baseURL: "", apiKey: "", maxTokens: opts.maxTokens, temperature: 0 }
        : { ...user, model: entry.model, maxTokens: opts.maxTokens, temperature: 0 }
      const host = providerEntry.baseURL ? new URL(providerEntry.baseURL).host : null
      const dims = effectiveDims(entry, sel.runDims)
      const judgeEnv = makeJudgeEnv({
        client,
        slots,
        providers: opts.dryRun ? [] : providers,
        fixture,
        signal: ac.signal,
        dryRun: opts.dryRun,
      })
      const casesOut = []
      for (const c of CASES) {
        if (!sel.runDims.has(c.dim)) continue
        const prompt = casePromptText(c)
        if (!dims.has(c.dim)) {
          casesOut.push({
            caseId: c.id, dim: c.dim, class: CLASS_LABELS[c.class], prompt,
            runs: [{ n: 1, verdict: "skipped", detail: "不在该模型面", metrics: emptyMetrics(), calls: [], summary: { textHead: "", textLen: 0, reasoningLen: 0, toolNames: [] } }],
          })
          continue
        }
        const runs = []
        for (let n = 1; n <= opts.repeats; n++) {
          const run = await executeRun({ client, caseObj: c, providerEntry, transport: transportFor(c), signal: ac.signal, timeoutMs: opts.timeoutSec * 1000, n, judgeEnv })
          step++
          const m = run.metrics
          console.log(`[${step}/${totalSteps}] ${entry.label} ${c.id} → ${run.verdict}${m.ttftMs != null ? ` | ttft ${m.ttftMs}ms` : ""}${m.tokPerSec != null ? ` ${m.tokPerSec} tok/s` : ""}`)
          if (run.judge?.verdict === "error") console.error(`[bench] 判官不可用：${entry.label} ${c.id} —— ${run.detail}`)
          runs.push(run)
          if (ac.signal.aborted) throw new Error("SIGINT")
        }
        casesOut.push({ caseId: c.id, dim: c.dim, class: CLASS_LABELS[c.class], prompt, runs })
      }
      modelsOut.push({ label: entry.label, provider: entry.provider, model: entry.model, host, dims: [...dims], cases: casesOut, note: entry.note ?? "" })
      if (sel.runManual) {
        for (const mp of MANUAL) {
          const manualCase = { id: mp.promptId, promptId: mp.promptId, prompt: mp.prompt, callOpts: {} }
          const res = await client.runCase({ caseObj: manualCase, providerEntry, transport: transportFor(manualCase), signal: ac.signal, timeoutMs: opts.timeoutSec * 1000 })
          step++
          const metrics = runMetrics(res.calls)
          const last = res.turns[res.turns.length - 1] ?? { text: "" }
          console.log(`[${step}/${totalSteps}] ${entry.label} ${mp.promptId} → 记录（人工 lane，不判分）`)
          manualOut.push({ label: entry.label, promptId: mp.promptId, prompt: mp.prompt, responseHead: head(last.text, 300), metrics })
          if (ac.signal.aborted) throw new Error("SIGINT") // 人工 lane 同样不得把半程结果带进留档（§2.1-5）
        }
      }
    }
    if (ac.signal.aborted) throw new Error("SIGINT")
    // 运行面全灭（§2.10.4）：进入判官面的 run 全部合成无定判 ⇒ 落档 + 退出码 1（基建故障信号）
    const judged = modelsOut.flatMap((m) => m.cases).flatMap((c) => c.runs).filter((r) => r.judge)
    allDead = judged.length > 0 && judged.every((r) => r.judge.verdict === "error")
  } catch (e) {
    if (ac.signal.aborted) {
      console.error("[bench] SIGINT —— 已中止在飞调用，本轮不落档（退出码 130）")
      return 130
    }
    throw e
  } finally {
    process.removeListener("SIGINT", onSigint)
  }

  const data = {
    suiteVersion: SUITE_VERSION,
    label: opts.label,
    startedAt,
    finishedAt: isoLocal(),
    run: {
      dims: sel.declared, repeats: opts.repeats, maxTokens: opts.maxTokens, timeoutSec: opts.timeoutSec,
      temperature: 0, node: process.version, command: commandFor(opts), axes: sel.axes,
    },
    prices: { asOf: prices.asOf, currency: prices.currency, unit: prices.unit, source: prices.source },
    recomputed: null,
    judge: judgeSnapshot(slots, judgeCfg),
    review: reviewSnapshot(),
    models: modelsOut,
    manual: manualOut,
    warnings,
  }
  applyPricesToResult(data, prices, warnings)
  const md = renderReport(data, { fileBase })
  const where = writePair(fileBase, data, md)
  console.log(`\n=== 摘要（控制台版；留档 = ${where}） ===`)
  for (const m of modelsOut) {
    const agg = m.aggregate
    console.log(`${m.label.padEnd(28)} 通过 ${agg.passed}/${agg.total}  成本 ${agg.costCny == null ? "—" : `¥${agg.costCny}`}`)
  }
  const j = data.judge
  if (j.judgeCalls > 0) {
    console.log(`判官 ${j.judgeCalls} 次调用（A ${j.judges[0].calls} · B ${j.judges[1].calls} · C ${j.arbiter.calls}）· 分歧 ${j.disagreements} 次 · 仲裁 ${j.arbitrations} 次 · 不可用 ${j.unavailable} 次`)
  }
  if (allDead) console.error("[bench] 判官面全灭：进入判官面的 run 全部合成无定判（退出码 1——基建故障信号；本档已落）")
  if (warnings.length > 0) console.log(`告警 ${warnings.length} 条：${warnings.join("；")}`)
  return allDead ? 1 : 0
}
