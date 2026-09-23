/**
 * lib/pipeline.mjs — 运行 / 重算编排（run.mjs 超 300 行 ⇒ 按设计档 §3 拆分触发条件拆出）。
 *
 * 两条编排：
 * - `runMain`：真实运行 / dry-run 自检（夹具表由 run.mjs 传入——夹具落点仍住 run.mjs）。
 *   **动态** `import("./client.mjs")` 只发生在本函数内 ⇒ `--recompute` 分支构造性零网络（AC-10）。
 * - `recomputeMain`：读入结果 JSON → 以当前 prices.json 重算成本 → 落新报告对；不调模型、不触网。
 *
 * 产物落盘唯一面 = `writePair`（写档前脱敏断言 fail-closed，§2.8）；同名拒写（KD-10）。
 */

import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { CASES, CLASS_LABELS, MANUAL, SUITE_VERSION } from "../cases/index.mjs"
import { effectiveDims, loadRoster, selectEntries } from "./roster.mjs"
import { applyPricesToResult, loadPrices } from "./prices.mjs"
import { runMetrics } from "./metrics.mjs"
import { renderReport } from "./report.mjs"
import { assertClean, writeGuarded } from "./sanitize.mjs"

const BENCH_DIR = dirname(dirname(fileURLToPath(import.meta.url)))
/** 结果目录：默认 `bench/results/`（相对 bench/ 解析，任意 cwd 可跑）；BENCH_RESULTS_DIR = 测试沙箱缝。 */
const RESULTS_DIR = process.env.BENCH_RESULTS_DIR ? resolve(process.env.BENCH_RESULTS_DIR) : join(BENCH_DIR, "results")
/** 价格表路径：默认 `bench/prices.json`；BENCH_PRICES = 改价重算的测试夹具缝（每次读，可运行中切换）。 */
const pricesPath = () => (process.env.BENCH_PRICES ? resolve(process.env.BENCH_PRICES) : join(BENCH_DIR, "prices.json"))

function isoLocal(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0")
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? "+" : "-"
  const body = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  return `${body}${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
}

const head = (s, max) => {
  const flat = String(s ?? "").replace(/\s+/g, " ").trim()
  return flat.length > max ? flat.slice(0, max) : flat
}

function emptyMetrics() {
  return { ttftMs: null, totalMs: null, tokPerSec: null, tokens: { prompt: null, cached: null, completion: null }, cost: null }
}

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

function refuseIfExists(fileBase) {
  const jsonPath = join(RESULTS_DIR, `${fileBase}.json`)
  const mdPath = join(RESULTS_DIR, `${fileBase}.md`)
  if (existsSync(jsonPath) || existsSync(mdPath)) {
    throw new Error(`同名产物已存在：bench/results/${fileBase}.{md,json} —— 请换 --label（留档不可被静默覆盖）`)
  }
  return { jsonPath, mdPath }
}

function writePair(fileBase, data, md) {
  const jsonPath = join(RESULTS_DIR, `${fileBase}.json`)
  const mdPath = join(RESULTS_DIR, `${fileBase}.md`)
  const jsonText = `${JSON.stringify(data, null, 2)}\n`
  assertClean(jsonText, "结果 JSON")
  assertClean(md, "报告 md")
  mkdirSync(RESULTS_DIR, { recursive: true })
  writeGuarded(jsonPath, jsonText, "结果 JSON")
  writeGuarded(mdPath, md, "报告 md")
  return displayPath(mdPath)
}

/** 控制台回显路径：能相对化就相对化（默认形态 = `bench/results/<文件>`；不向控制台吐绝对路径）。 */
function displayPath(p) {
  const rel = relative(process.cwd(), p)
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel.replaceAll("\\", "/") : p
}

/** 单次用例执行（含判分；模型用例失败 = 数据，不影响退出码）。 */
async function executeRun({ client, caseObj, providerEntry, transport, signal, timeoutMs, n }) {
  const res = await client.runCase({ caseObj, providerEntry, transport, signal, timeoutMs })
  const metrics = runMetrics(res.calls)
  let verdict = "error"
  let detail = `接口错误：${head(res.error, 180)}`
  if (!res.error) {
    const g = caseObj.grade(client.caseResultView(res.turns), {})
    verdict = g.pass ? "pass" : "fail"
    detail = head(g.detail, 200)
  }
  const last = res.turns[res.turns.length - 1] ?? { text: "", reasoning: "" }
  const toolNames = [...new Set(res.calls.flatMap((c) => c.toolNames))]
  return {
    n,
    verdict,
    detail,
    metrics,
    calls: res.calls,
    summary: {
      textHead: head(last.text, 300),
      textLen: String(last.text ?? "").length,
      reasoningLen: String(last.reasoning ?? "").length,
      toolNames,
    },
  }
}

/** 真实运行 / dry-run 自检（fixture = run.mjs 内联固定响应表；dry-run 不读用户 config）。 */
export async function runMain(opts, sel, fixture) {
  const roster = loadRoster(join(BENCH_DIR, "models.json"))
  const entries = selectEntries(roster, opts.models)
  const prices = loadPrices(pricesPath())
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

  const ac = new AbortController()
  const onSigint = () => ac.abort(new Error("SIGINT"))
  process.once("SIGINT", onSigint)
  const warnings = []
  const modelsOut = []
  const manualOut = []
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
      const casesOut = []
      for (const c of CASES) {
        if (!sel.runDims.has(c.dim)) continue
        if (!dims.has(c.dim)) {
          casesOut.push({
            caseId: c.id, dim: c.dim, class: CLASS_LABELS[c.class],
            runs: [{ n: 1, verdict: "skipped", detail: "不在该模型面", metrics: emptyMetrics(), calls: [], summary: { textHead: "", textLen: 0, reasoningLen: 0, toolNames: [] } }],
          })
          continue
        }
        const runs = []
        for (let n = 1; n <= opts.repeats; n++) {
          const run = await executeRun({ client, caseObj: c, providerEntry, transport: transportFor(c), signal: ac.signal, timeoutMs: opts.timeoutSec * 1000, n })
          step++
          const m = run.metrics
          console.log(`[${step}/${totalSteps}] ${entry.label} ${c.id} → ${run.verdict}${m.ttftMs != null ? ` | ttft ${m.ttftMs}ms` : ""}${m.tokPerSec != null ? ` ${m.tokPerSec} tok/s` : ""}`)
          runs.push(run)
          if (ac.signal.aborted) throw new Error("SIGINT")
        }
        casesOut.push({ caseId: c.id, dim: c.dim, class: CLASS_LABELS[c.class], runs })
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
  if (warnings.length > 0) console.log(`告警 ${warnings.length} 条：${warnings.join("；")}`)
  return 0
}

/** 结果 JSON 形状校验（recompute.3：损坏 JSON / 缺 calls[].tokens → 退出码 1 且不落任何档）。 */
function validateResultShape(data) {
  if (!data || typeof data !== "object") throw new Error("结果 JSON 顶层不是对象")
  if (!Array.isArray(data.models)) throw new Error("结果 JSON 缺 models[]")
  for (const [mi, m] of data.models.entries()) {
    if (!Array.isArray(m.cases)) throw new Error(`models[${mi}] 缺 cases[]`)
    for (const [ci, c] of m.cases.entries()) {
      if (!Array.isArray(c.runs)) throw new Error(`models[${mi}].cases[${ci}] 缺 runs[]`)
      for (const [ri, r] of c.runs.entries()) {
        if (!Array.isArray(r.calls)) throw new Error(`models[${mi}].cases[${ci}].runs[${ri}] 缺 calls[]`)
        for (const [ii, call] of r.calls.entries()) {
          if (!("tokens" in call)) throw new Error(`models[${mi}].cases[${ci}].runs[${ri}].calls[${ii}] 缺 tokens 字段（原子账目不可用）`)
        }
      }
    }
  }
}

/** 离线重算（§2.7 / AC-10）：只读结果 JSON + 当前 prices.json；不调模型、不重判分、不触网。 */
export async function recomputeMain(opts) {
  const fromPath = resolve(process.cwd(), opts.from)
  if (!existsSync(fromPath)) throw new Error(`--from 文件不存在：${basename(fromPath)}`)
  let data
  try {
    data = JSON.parse(readFileSync(fromPath, "utf8"))
  } catch (e) {
    throw new Error(`--from 结果 JSON 解析失败：${e.message}`)
  }
  validateResultShape(data)
  const prices = loadPrices(pricesPath())
  const warnings = Array.isArray(data.warnings) ? [...data.warnings] : []
  applyPricesToResult(data, prices, warnings)
  data.warnings = warnings
  data.prices = { asOf: prices.asOf, currency: prices.currency, unit: prices.unit, source: prices.source }
  data.label = opts.label ?? `${data.label}-recalc`
  data.recomputed = {
    from: fromPath.startsWith(RESULTS_DIR) ? `bench/results/${basename(fromPath)}` : basename(fromPath),
    at: isoLocal(),
  }
  // 归档日期**同源**：文件名 = 报告标题日期 = 附录指针日期（取原档运行日；缺失/畸形则退当日）
  const srcDate = String(data.startedAt ?? "").slice(0, 10)
  const fileBase = `${/^\d{4}-\d{2}-\d{2}$/.test(srcDate) ? srcDate : isoLocal().slice(0, 10)}-${data.label}`
  refuseIfExists(fileBase)
  const md = renderReport(data, { fileBase })
  const where = writePair(fileBase, data, md)
  console.log("=== 离线重算完成（零 API 调用）===")
  console.log(`源：${data.recomputed.from} → 新报告对：${where}`)
  for (const m of data.models) {
    console.log(`${m.label.padEnd(28)} 通过 ${m.aggregate.passed}/${m.aggregate.total}  成本 ${m.aggregate.costCny == null ? "—" : `¥${m.aggregate.costCny}`}`)
  }
  if (warnings.length > 0) console.log(`告警 ${warnings.length} 条：${warnings.join("；")}`)
  return 0
}
