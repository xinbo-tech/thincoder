#!/usr/bin/env node
/**
 * bench/toolcall.mjs — 工具面调用准确率探针入口（设计 §11.9 CLI 契约；独立 runner——不并入 `run.mjs`
 * 的 `--dims` / `--n` 合同，也不并入 §10 的 `probe.mjs`）。三条路径：真实跑批（触网 / 花钱——随批自动跑，
 * 受成本三闸）/ `--dry-run` 零网络自检（夹具传输 + 真载荷构造 ⇒ 三轴 / 报告 / 落档全链）/ `--help`。
 * 退出码：0 = 跑完（未命中 / 无调用是数据不是错误）· 1 = 基建错误（参数 / 未知档 / provider 缺配置 /
 * 载荷构造失败 / 同名拒写）· 130 = SIGINT（不落档）。
 */

import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { fixtureTransport, liveTransport, runCase } from "./lib/client.mjs"
import { isoLocal } from "./lib/output.mjs"
import { buildProviderEntry, effortFace } from "./lib/params.mjs"
import { costOf, loadPrices, matchPrice, pricesPath } from "./lib/prices.mjs"
import { loadRoster, selectEntries } from "./lib/roster.mjs"
import { CASES, casesDigest, validateCases } from "./toolcall/cases.mjs"
import { SYSTEM_BASE, TOOL_PROBE_VERSION, dryRunResponse } from "./toolcall/fixture.mjs"
import { gradeRun, pickObserved, skippedRun } from "./toolcall/grade.mjs"
import { assertToolcallLabel, buildResult, costTotal, promptTokensMedian, writeToolcallReport } from "./toolcall/report.mjs"
import { VARIANT_IDS, buildVariants, payloadDigest } from "./toolcall/variants.mjs"

const BENCH_DIR = dirname(fileURLToPath(import.meta.url))

const USAGE = `用法：
  node bench/toolcall.mjs --models <列表> [--variants V0,V1,V2] [--cases <id 列表>] [--n 3] [--max-tokens 4096] [--timeout 120] [--max-cost <CNY>] [--label toolcall-baseline] [--dry-run]

  --models      参测档（逗号分隔；label 或 provider:model——名单源 = bench/models.json）；必填
  --variants    变体选择（V0 / V1 / V2）；缺省 = 全 3 变体
  --cases       用例选择（tool.1…tool.14）；缺省 = 全 14 例
  --n           每（模型 × 变体 × 用例）重复次数（需求面 ≥3）；缺省 3
  --max-tokens  单次调用输出上限；缺省 4096
  --timeout     单次调用墙钟上限（秒）；缺省 120
  --max-cost    累计成本闸（CNY；闸射程 = 已录成本；到顶 ⇒ 余面记 skipped（入 runs[] · 聚合分母排除）+ warning，退出码 0）
  --label       报告名标签（须 toolcall- 起）；缺省 toolcall-baseline
  --dry-run     零网络自检：夹具传输（bench/lib/client.mjs 的 fixtureTransport）+ 真载荷构造 ⇒ 三轴 / 报告 / 落档全链（不读用户 config）

  本面 = 测量面 · 非门控（不按模型设岗 / 不改配置默认）；报告只出读数。成本上界：单 run = 1 次调用
  ⇒ ≤（prompt + completion tokens）× 该档单价；全局 ≤ --max-cost（设时）。`

function intArg(raw, flag, min, max) {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < min || (max != null && n > max)) {
    throw new Error(`${flag} 需要 ${min}${max != null ? `–${max}` : " 以上"} 的整数（得到：${raw}）`)
  }
  return n
}

export function parseArgs(argv) {
  const opts = {
    models: null, variants: [...VARIANT_IDS], cases: CASES.map((c) => c.id), repeats: 3,
    maxTokens: 4096, timeoutSec: 120, maxCost: null, label: "toolcall-baseline", dryRun: false, help: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const need = () => {
      const v = argv[++i]
      if (v === undefined) throw new Error(`参数 ${a} 缺值`)
      return v
    }
    if (a === "--models") opts.models = need()
    else if (a === "--variants") opts.variants = need().split(",").map((s) => s.trim()).filter(Boolean)
    else if (a === "--cases") opts.cases = need().split(",").map((s) => s.trim()).filter(Boolean)
    else if (a === "--n") opts.repeats = intArg(need(), a, 1)
    else if (a === "--max-tokens") opts.maxTokens = intArg(need(), a, 1)
    else if (a === "--timeout") opts.timeoutSec = intArg(need(), a, 1)
    else if (a === "--max-cost") opts.maxCost = Number(need())
    else if (a === "--label") opts.label = need()
    else if (a === "--dry-run") opts.dryRun = true
    else if (a === "--help" || a === "-h") opts.help = true
    else throw new Error(`未知参数 ${a}（--help 看用法）`)
  }
  if (!opts.help && !opts.models) {
    let names = "见 bench/models.json"
    try { names = loadRoster(join(BENCH_DIR, "models.json")).models.map((m) => m.label).join(", ") } catch { /* 名单不可读 ⇒ 降级为指针（不掩盖主错误） */ }
    throw new Error(`--models 必填——在册：${names}（亦可用 provider:model 复合引用）`)
  }
  const badVariant = opts.variants.filter((v) => !VARIANT_IDS.includes(v))
  if (opts.variants.length === 0 || badVariant.length > 0) throw new Error(`--variants 只接受 ${VARIANT_IDS.join(" / ")}（得到：${opts.variants.join(", ")}）`)
  const badCase = opts.cases.filter((id) => !CASES.some((c) => c.id === id))
  if (opts.cases.length === 0 || badCase.length > 0) throw new Error(`--cases 含未知用例「${badCase.join(", ")}」（在册：${CASES.map((c) => c.id).join(", ")}）`)
  if (opts.maxCost != null && (!Number.isFinite(opts.maxCost) || opts.maxCost < 0)) throw new Error(`--max-cost 需要非负数字（得到：${opts.maxCost}）`)
  assertToolcallLabel(opts.label) // 标签前缀强制（§11.8：非 `toolcall-` 起 ⇒ 报错退出码 1）
  return opts
}

/** 请求用例对象（§11.3-1：`{prompt, callOpts:{tools}}` + system 行——system 经 `build()` 前置为 messages[0]，
 *  全变体全例一致；调用面 = `runCase` 的 `caseObj` 参数）。 */
export function caseObjOf(caseObj, tools) {
  return {
    prompt: caseObj.prompt,
    callOpts: { tools },
    build: () => ({ messages: [{ role: "system", content: SYSTEM_BASE }, { role: "user", content: caseObj.prompt }] }),
  }
}

/** provider 条目（§11.3-2：`params.mjs` `buildProviderEntry` 单点）+ 实发 effort 面（§2.2-13 语义）。 */
function providerEntryOf({ entry, user, maxTokens }) {
  const base = user ?? { name: entry.provider, model: entry.model, baseURL: "", apiKey: "" }
  const providerEntry = buildProviderEntry(base, {
    model: entry.model,
    maxTokens,
    temperature: entry.temperature ?? 0,
    reasoningEffort: entry.reasoningEffort ?? null, // 档位覆写优先；缺省 ⇒ 沿 base 原值（KD-32）
  })
  return { providerEntry, effort: effortFace(entry, user) }
}

/** 单 run（§11.3-1 调用面）：一次调用 ⇒ 判定 ⇒ 成本回填（`prices.mjs` `costOf` 单点——缺价 / 缺 usage ⇒ `null`）。
 *  `caseObj` = 声明式用例（含 `expect`——判定面输入）；`payload` = 变体载荷 `tools`。 */
export async function runOne({ caseObj, payload, providerEntry, transport, timeoutMs, prices, priceEntry, n, signal = null }) {
  const result = await runCase({ caseObj: caseObjOf(caseObj, payload), providerEntry, transport, signal, maxRounds: 1, timeoutMs })
  const run = gradeRun({ caseObj, payload, observed: pickObserved(result), n })
  const rec = costOf(priceEntry, run.metrics.tokens, prices)
  run.metrics.cost = rec ? { value: rec.value, currency: rec.currency, pricesAsOf: rec.pricesAsOf } : null
  return { run, cachedUnknown: rec?.cachedUnknown === true }
}

const mark = (x) => (x === true ? "hit" : x === false ? "miss" : "—")

/** 网格执行（真实 / dry-run 共用；`transport` 逐 run 取——dry-run 按（用例 × 重复序号 × 变体）投递单条夹具脚本）。 */
async function executeGrid({ opts, entries, cases, prices, ac, providers }) {
  const dryRun = opts.dryRun
  const startedAt = isoLocal()
  const warnings = []
  const usageMissing = new Set()
  const cachedUnknown = new Set()
  const modelsIn = []
  const v0DigestEntries = [] // payloadDigest 锚（§11.8）= 逐参测档 V0 载荷——**独立于 `--variants` 选集**（V0 未选时亦须反映真实载荷）
  const total = entries.length * opts.variants.length * cases.length * opts.repeats
  let step = 0
  let spent = 0
  let truncated = false
  for (const entry of entries) {
    const user = dryRun ? null : (providers ?? []).find((p) => p.name === entry.provider) ?? null
    const { providerEntry, effort } = providerEntryOf({ entry, user, maxTokens: opts.maxTokens })
    const priceEntry = matchPrice(prices, entry.provider, entry.model)
    if (!priceEntry) warnings.push(`价格未录：${entry.label}（cost=null）`)
    const allVariants = buildVariants({ model: entry.model })
    v0DigestEntries.push({ key: `${entry.provider}:${entry.model}`, variant: allVariants.find((v) => v.id === "V0") })
    const variants = allVariants.filter((v) => opts.variants.includes(v.id))
    const variantsIn = []
    for (const variant of variants) {
      const casesIn = []
      for (const caseObj of cases) {
        const runs = []
        for (let i = 1; i <= opts.repeats; i++) {
          step++
          if (opts.maxCost != null && spent >= opts.maxCost) {
            if (!truncated) {
              warnings.push(`成本闸到顶（--max-cost ${opts.maxCost}）——余面 skipped（不入聚合分母）`)
              truncated = true
            }
            runs.push(skippedRun(i))
            console.log(`[${step}/${total}] ${entry.label} ${variant.id} ${caseObj.id} → skipped | 成本闸截断`)
            continue
          }
          const transport = dryRun
            ? fixtureTransport([dryRunResponse({ caseId: caseObj.id, i, variant: variant.id })])
            : liveTransport
          const { run, cachedUnknown: cu } = await runOne({
            caseObj, payload: variant.tools, providerEntry, transport,
            timeoutMs: opts.timeoutSec * 1000, prices, priceEntry, n: i, signal: ac.signal,
          })
          spent += run.metrics.cost?.value ?? 0
          if (!run.metrics.tokens) usageMissing.add(entry.label)
          if (cu) cachedUnknown.add(entry.label)
          runs.push(run)
          console.log(`[${step}/${total}] ${entry.label} ${variant.id} ${caseObj.id} → ${run.firstTool ?? "—"} | hit/legal/sem = ${mark(run.hit)}/${mark(run.legal)}/${mark(run.semOk)}`)
          if (ac.signal.aborted) throw new Error("SIGINT")
        }
        casesIn.push({ caseId: caseObj.id, runs })
      }
      variantsIn.push({ ...variant, cases: casesIn })
    }
    modelsIn.push({
      label: entry.label, provider: entry.provider, model: entry.model,
      host: providerEntry.baseURL ? new URL(providerEntry.baseURL).host : null,
      temperature: providerEntry.temperature, reasoningEffort: effort?.value, reasoningEffortFrom: effort?.from,
      variants: variantsIn,
    })
  }
  for (const l of usageMissing) warnings.push(`usage 缺失：${l}（tokens/cost=null）`)
  for (const l of cachedUnknown) warnings.push(`缓存命中字段缺失：${l}（cached 按 0 计）`)
  if (dryRun) warnings.push("dry-run 自检：读数为脚本化夹具，非真实模型测量")
  const result = buildResult({
    opts: { ...opts, n: opts.repeats, toolProbeVersion: TOOL_PROBE_VERSION, systemBase: SYSTEM_BASE },
    startedAt, finishedAt: isoLocal(), modelsIn,
    casesDigest: casesDigest(),
    payloadDigest: payloadDigest(v0DigestEntries),
    warnings,
  })
  return result
}

/** 控制台摘要（表——报告对才是留档；§11.9：逐模型 × 变体三轴率 + 成本）。 */
function printSummary(result) {
  console.log("[toolcall] 摘要（未命中 / 无调用是数据不是错误）")
  console.log("| 模型 | 变体 | run | 轴①命中 | 轴②合法 | 轴③语义 | 完全正确 | 无调用 | error | skipped | 成本 | prompt tokens 中位 |")
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|")
  for (const m of result.models) {
    for (const v of m.variants) {
      const runs = v.cases.flatMap((c) => c.runs)
      const live = runs.filter((r) => r.terminal !== "error" && r.terminal !== "skipped")
      const d23 = live.filter((r) => r.legal !== null).length
      const r = (part, denom) => (denom > 0 ? `${part}/${denom}` : "—")
      console.log(`| ${m.label} | ${v.id} | ${live.length} | ${r(v.axis.hit, live.length)} | ${r(v.axis.legal, d23)} | ${r(v.axis.semOk, d23)} | ${r(v.axis.perfect, d23)} | ${v.axis.noCall} | ${v.axis.error} | ${v.axis.skipped} | ${costTotal(runs) ?? "—"} | ${promptTokensMedian(runs) ?? "—"} |`)
    }
  }
}

/** 入口（导出供测试进程内调用；返回退出码，不自行 exit）。 */
export async function main(argv = process.argv.slice(2)) {
  let opts
  try { opts = parseArgs(argv) } catch (e) {
    console.error(`[toolcall] ${e.message}`)
    return 1
  }
  if (opts.help) { console.log(USAGE); return 0 }
  const ac = new AbortController()
  const onSigint = () => ac.abort(new Error("SIGINT"))
  process.once("SIGINT", onSigint)
  try {
    validateCases()
    const roster = loadRoster(join(BENCH_DIR, "models.json"))
    const entries = selectEntries(roster, opts.models)
    const prices = loadPrices(pricesPath())
    const cases = CASES.filter((c) => opts.cases.includes(c.id))
    let providers = null
    if (!opts.dryRun) {
      const { loadConfig } = await import("../thincoder-core/config.mjs")
      providers = loadConfig().providers ?? []
      const missing = entries.filter((e) => !providers.some((p) => p.name === e.provider)).map((e) => e.label)
      if (missing.length > 0) throw new Error(`以下条目的 provider 不在用户 config（~/.thincoder/config.json）：${missing.join(", ")}`)
    }
    const result = await executeGrid({ opts, entries, cases, prices, ac, providers })
    if (ac.signal.aborted) throw new Error("SIGINT")
    const path = writeToolcallReport(result)
    console.log(`[toolcall] 报告对已落档：${path}`)
    printSummary(result)
    return 0
  } catch (e) {
    if (String(e?.message).includes("SIGINT")) { console.error("[toolcall] SIGINT —— 不落档（退出码 130）"); return 130 }
    console.error(`[toolcall] ${e.message}`)
    return 1
  } finally {
    process.removeListener("SIGINT", onSigint)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => { process.exitCode = code }).catch((e) => { console.error(`[toolcall] ${e?.stack ?? e}`); process.exitCode = 1 })
}
