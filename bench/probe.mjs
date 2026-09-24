#!/usr/bin/env node
/**
 * bench/probe.mjs — 矛盾上抛探针入口（设计 §10.8 CLI 契约；独立 runner——不并入 `run.mjs` 的
 * `--dims` / `--n` 合同与 `SUITE_VERSION` 轴）。三条路径：真实跑批（触网 / 花钱——随批自动跑，受成本三闸）/ `--dry-run`
 * 零网络自检（真装配腿 + 脚本化假 child + 夹具判官传输）/ `--help`；退出码 0 = 跑完 ·
 * 1 = 基建错误（参数 / 未知档 / provider 缺配置 / 夹具不合 schema / `judge.json` 不可读或不合 / 同名拒写）·
 * 130 = SIGINT（不落档）。
 */

import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { isoLocal } from "./lib/output.mjs"
import { loadPrices, matchPrice, pricesPath } from "./lib/prices.mjs"
import { loadRoster, selectEntries } from "./lib/roster.mjs"
import { judgeConfigPath, loadJudgeConfig, resolveJudgeSlots } from "./lib/judge.mjs"
import { buildProbeParent, installProbeProvider, probeProviderEntry, promptsDigest, runProbeRun, assemblyLeg } from "./probe/driver.mjs"
import { readoutRun } from "./probe/classify.mjs"
import { classifyReportFace, shouldClassifyReport } from "./probe/judge-report.mjs"
import { assertProbeLabel, buildProbeResult, runCostCny, writeProbeReport } from "./probe/report.mjs"
import { createSandbox, diffSnapshots, materialize, removeSandbox, runSandbox, sandboxDisplay, snapshot } from "./probe/sandbox.mjs"
import { DRY_RUN_FIXTURE, FIXTURES, FIXTURE_IDS, PROBE_VERSION, validateFixtures } from "./probe/fixtures.mjs"

const BENCH_DIR = dirname(fileURLToPath(import.meta.url))

const USAGE = `用法：
  node bench/probe.mjs --models <列表> [--fixtures p1,p2,p3] [--n 次] [--max-turns N] [--timeout 秒] [--max-cost <CNY>] [--label <名>] [--dry-run]

  --models     参测档（逗号分隔；label 或 provider:model——名单源 = bench/models.json）；必填
  --fixtures   夹具选择（p1 / p2 / p3）；缺省 = 全 3 族
  --n          每（模型 × 夹具）重复次数（行为面建议 3）；缺省 1
  --max-turns  子代理回合帽（4–200）；缺省 40
  --timeout    单 run 墙钟上限（秒）；缺省 600
  --max-cost   累计成本闸（CNY；累计 = 被测 run + 判官调用；到顶 ⇒ 余面记 skipped（入 runs[] · 聚合分母排除）+ warning，退出码 0）
  --label      报告名标签（须 probe- 起）；缺省 probe-conflict
  --dry-run    零网络自检：真装配腿（buildSpawnChild 直调——真 child 装配、不驱动）+ 脚本化假 child
               驱动（classify / report / judge 链）+ 夹具判官传输；不实弹（零网络）

  本面 = 测量面 · 非门控（不按模型设岗 / 不改配置默认）；真实跑批随批自动跑（成本受三闸约束）。
  成本上界：单 run ≤ Σ（每 call 的 prompt + completion tokens）× 该档单价——call 数 ≤ 2 × --max-turns
  （主体 run ≤ --max-turns；追问扩写轮为第二个 run、上限同），单 call 输出 ≤ maxTokens；全局 ≤ --max-cost。`

function intArg(raw, flag, min, max) {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < min || (max != null && n > max)) {
    throw new Error(`${flag} 需要 ${min}${max != null ? `–${max}` : " 以上"} 的整数（得到：${raw}）`)
  }
  return n
}

export function parseArgs(argv) {
  const opts = {
    models: null, fixtures: [...FIXTURE_IDS], repeats: 1, maxTurns: 40, timeoutSec: 600,
    maxCost: null, label: "probe-conflict", dryRun: false, maxTokens: 4096, help: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const need = () => {
      const v = argv[++i]
      if (v === undefined) throw new Error(`参数 ${a} 缺值`)
      return v
    }
    if (a === "--models") opts.models = need()
    else if (a === "--fixtures") opts.fixtures = need().split(",").map((s) => s.trim()).filter(Boolean)
    else if (a === "--n") opts.repeats = intArg(need(), a, 1)
    else if (a === "--max-turns") opts.maxTurns = intArg(need(), a, 4, 200)
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
    throw new Error(`--models 必填（agentic run 成本远高于 QA 例，不做全量缺省）——在册：${names}（亦可用 provider:model 复合引用）`)
  }
  if (opts.fixtures.length === 0 || opts.fixtures.some((f) => !FIXTURE_IDS.includes(f))) {
    throw new Error(`--fixtures 只接受 ${FIXTURE_IDS.join(" / ")}（得到：${opts.fixtures.join(", ")}）`)
  }
  if (opts.maxCost != null && (!Number.isFinite(opts.maxCost) || opts.maxCost < 0)) throw new Error(`--max-cost 需要非负数字（得到：${opts.maxCost}）`)
  assertProbeLabel(opts.label)
  return opts
}

const fixtureOf = (id) => FIXTURES.find((f) => f.id === id)

/** 单 run（含沙箱）：物化 → 驱动 → 沙箱 diff → 读数收口（含成本）→ 判官兜底。返回 `{ run, warnings, judge }`。 */
async function executeRun({ base, index, entry, user, config, model, fixture, opts, prices, slots, providers, priceEntry, liveTransport, ac }) {
  const root = runSandbox(base, index)
  materialize(root, fixture.sandboxFiles)
  const before = snapshot(root)
  const parent = buildProbeParent({ cwd: root, config, model: entry.model })
  installProbeProvider(parent, probeProviderEntry({ entry, user, maxTokens: opts.maxTokens }).providerEntry)
  const { observed } = await runProbeRun({
    parent, model, batchDoc: fixture.batchDoc, taskBook: fixture.taskBook,
    fixtureId: fixture.id, timeoutSec: opts.timeoutSec, baseSignal: ac.signal,
  })
  observed.landed = diffSnapshots(before, snapshot(root))
  const run = readoutRun(observed, { targets: fixture.targets })
  run.metrics.cost = runCostCny(priceEntry, run.metrics.tokens, prices) // 成本闸当场可判（写档面同式重算）
  const warnings = [...observed.warnings]
  let judge = null
  if (shouldClassifyReport(run)) {
    const r = await classifyReportFace({ fields: run, taskBook: fixture.taskBook, slot: slots[0], transport: liveTransport, providers, signal: ac.signal })
    run.reportFace = r.face
    judge = { tokens: r.tokens }
    if (r.warning) warnings.push(r.warning)
  }
  return { run, warnings, judge }
}

/** 真实跑批（触网 / 花钱——随批自动跑，受成本三闸约束）。 */
async function runReal(opts, entries, prices, cfg, ac, bases) {
  const { loadConfig } = await import("../thincoder-core/config.mjs")
  const { liveTransport } = await import("./lib/client.mjs")
  const userCfg = loadConfig()
  const providers = userCfg.providers ?? []
  const missing = entries.filter((e) => !providers.some((p) => p.name === e.provider)).map((e) => e.label)
  if (missing.length > 0) throw new Error(`以下条目的 provider 不在用户 config（~/.thincoder/config.json）：${missing.join(", ")}`)
  const { slots } = resolveJudgeSlots(cfg, { providers, tested: entries })
  const config = { ...userCfg, agent: { ...userCfg.agent, subagentTurns: opts.maxTurns } }
  const base = createSandbox()
  bases.current = base // 即使中途抛错，入口 finally 也清运（--dry-run）
  const startedAt = isoLocal()
  const warnings = []
  const judgeCalls = []
  const verdicts = { surfaced: 0, buried: 0, unclear: 0, failed: 0 }
  const modelsIn = []
  const judgePrice = matchPrice(prices, slots[0].provider, slots[0].model)
  let spent = 0
  let step = 0
  const totalSteps = entries.length * opts.fixtures.length * opts.repeats
  let truncated = false
  for (const entry of entries) {
    const user = providers.find((p) => p.name === entry.provider)
    const { providerEntry, effort } = probeProviderEntry({ entry, user, maxTokens: opts.maxTokens })
    const priceEntry = matchPrice(prices, entry.provider, entry.model)
    if (!priceEntry) warnings.push(`价格未录：${entry.label}（cost=null）`)
    const runs = []
    for (const fid of opts.fixtures) {
      const fixture = fixtureOf(fid)
      for (let i = 0; i < opts.repeats; i++) {
        step++
        if (opts.maxCost != null && spent >= opts.maxCost) {
          if (!truncated) { warnings.push(`成本闸到顶（--max-cost ${opts.maxCost}）——余面 skipped（不入聚合分母）`); truncated = true }
          runs.push(readoutRun({ fixtureId: fid, terminal: "skipped" }, { targets: fixture.targets }))
          console.log(`[${step}/${totalSteps}] ${entry.label} ${fid} → skipped | 成本闸截断`)
          continue
        }
        const { run, warnings: w, judge } = await executeRun({
          base, index: step, entry, user, config, model: `${entry.provider}:${entry.model}`,
          fixture, opts, prices, slots, providers, priceEntry, liveTransport, ac,
        })
        spent += run.metrics.cost ?? 0
        runs.push(run)
        warnings.push(...w)
        if (judge) { judgeCalls.push(judge); verdicts[run.reportFace ?? "failed"] += 1; spent += runCostCny(judgePrice, judge.tokens, prices) ?? 0 }
        console.log(`[${step}/${totalSteps}] ${entry.label} ${fid} → ${run.behaviorClass} | 首次上抛 ${run.firstAskTurn != null ? `t${run.firstAskTurn}` : (run.continuation?.asked ? `续 t${run.continuation.turnsUsed}` : "—")} / 回合 ${run.turnsUsed ?? "—"}`)
        if (ac.signal.aborted) throw new Error("SIGINT")
      }
    }
    modelsIn.push({
      label: entry.label, provider: entry.provider, model: entry.model,
      host: providerEntry.baseURL ? new URL(providerEntry.baseURL).host : null,
      temperature: providerEntry.temperature, reasoningEffort: effort?.value, reasoningEffortFrom: effort?.from,
      priceEntry, runs,
    })
  }
  const result = buildProbeResult({
    opts: { ...opts, n: opts.repeats, probeVersion: PROBE_VERSION }, startedAt, finishedAt: isoLocal(),
    digest: promptsDigest(), sandboxDir: sandboxDisplay(base), modelsIn,
    judgeIn: { slot: slots[0].id, model: `${slots[0].provider}:${slots[0].model}`, priceEntry: judgePrice, calls: judgeCalls, verdicts },
    warnings, prices,
  })
  return { result, sandboxRoot: base }
}

/** `--dry-run` 自检（零网络）：真装配腿 + 脚本化假 child 驱动 + 夹具判官传输。 */
async function runDryRun(opts, entries, prices, cfg, ac, bases) {
  const { slots } = resolveJudgeSlots(cfg, { providers: null, tested: entries })
  const { fixtureSlotTransport } = await import("./lib/client.mjs")
  const warnings = []
  const base = createSandbox()
  bases.current = base // 即使中途抛错，入口 finally 也清运（--dry-run 不留）
  // ① 真装配腿（逐族：真 buildSpawnChild + prepareRun——不驱动）
  for (const fid of opts.fixtures) {
    const fixture = fixtureOf(fid)
    const root = runSandbox(base, `assembly-${fid}`)
    materialize(root, fixture.sandboxFiles)
    const parent = buildProbeParent({ cwd: root, config: { agent: { subagentTurns: opts.maxTurns } }, model: entries[0].model })
    installProbeProvider(parent, probeProviderEntry({ entry: entries[0], user: null, maxTokens: opts.maxTokens }).providerEntry)
    const { facts } = await assemblyLeg({ parent, model: `${entries[0].provider}:${entries[0].model}`, batchDoc: fixture.batchDoc, taskBook: fixture.taskBook })
    const bad = Object.entries(facts).filter(([k, v]) => k !== "relayPrefix" && v !== true).map(([k]) => k)
    if (bad.length > 0) throw new Error(`dry-run 装配腿（${fid}）断言失败：${bad.join(", ")}`)
    console.log(`[dry-run] 装配腿 ${fid}：异步形 ✓ · notify_parent ✓ · eng-designer 人格 ✓ · batchDoc 绑定 ✓（${facts.relayPrefix}）`)
  }
  // ② 脚本化假 child 驱动（classify / report / judge 链——不入 runChildPipeline）
  const transport = fixtureSlotTransport(DRY_RUN_FIXTURE.judge)
  const judgeCalls = []
  const verdicts = { surfaced: 0, buried: 0, unclear: 0, failed: 0 }
  const byLabel = new Map(entries.map((e) => [e.label, []]))
  const script = DRY_RUN_FIXTURE.runs.filter((r) => opts.fixtures.includes(r.fixtureId))
  const judgePrice = matchPrice(prices, slots[0].provider, slots[0].model)
  let spent = 0
  let truncated = false
  for (const [i, s] of script.entries()) {
    const entry = entries[i % entries.length]
    const fixture = fixtureOf(s.fixtureId)
    const priceEntry = matchPrice(prices, entry.provider, entry.model)
    if (opts.maxCost != null && spent >= opts.maxCost) {
      if (!truncated) { warnings.push(`成本闸到顶（--max-cost ${opts.maxCost}）——余面 skipped（不入聚合分母）`); truncated = true }
      const skipped = readoutRun({ fixtureId: s.fixtureId, terminal: "skipped" }, { targets: fixture.targets })
      byLabel.get(entry.label).push(skipped)
      console.log(`[dry-run] 脚本化 ${entry.label} ${s.fixtureId} → skipped | 成本闸截断`)
      continue
    }
    const run = readoutRun(s, { targets: fixture.targets })
    if (shouldClassifyReport(run)) {
      const r = await classifyReportFace({ fields: run, taskBook: fixture.taskBook, slot: slots[0], transport, providers: null, signal: ac.signal })
      run.reportFace = r.face
      judgeCalls.push({ tokens: r.tokens })
      verdicts[run.reportFace ?? "failed"] += 1
      spent += runCostCny(judgePrice, r.tokens, prices) ?? 0
      if (r.warning) warnings.push(r.warning)
    }
    spent += runCostCny(priceEntry, run.metrics?.tokens, prices) ?? 0
    byLabel.get(entry.label).push(run)
    console.log(`[dry-run] 脚本化 ${entry.label} ${s.fixtureId} → ${run.behaviorClass} | 报告面 ${run.reportFace ?? "—"}`)
  }
  const modelsIn = entries.map((entry) => {
    const { providerEntry, effort } = probeProviderEntry({ entry, user: null, maxTokens: opts.maxTokens })
    return {
      label: entry.label, provider: entry.provider, model: entry.model, host: null,
      temperature: providerEntry.temperature, reasoningEffort: effort?.value, reasoningEffortFrom: effort?.from,
      priceEntry: matchPrice(prices, entry.provider, entry.model), runs: byLabel.get(entry.label) ?? [],
    }
  })
  const result = buildProbeResult({
    opts: { ...opts, n: opts.repeats, probeVersion: PROBE_VERSION }, startedAt: isoLocal(), finishedAt: isoLocal(),
    digest: promptsDigest(), sandboxDir: sandboxDisplay(base), modelsIn,
    judgeIn: { slot: slots[0].id, model: `${slots[0].provider}:${slots[0].model}`, priceEntry: judgePrice, calls: judgeCalls, verdicts },
    warnings: [...warnings, "dry-run 自检：读数为脚本化夹具，非真实模型测量"], prices,
  })
  return { result, sandboxRoot: base, cleanup: true }
}

/** 控制台摘要（表——报告对才是留档）。 */
function printSummary(result) {
  console.log("[probe] 摘要（行为类是数据不是错误）")
  console.log("| 模型 | run | skipped | 上抛 | 静默落盘 | 静默报告 | 绕圈 | timeout | error | 首抛中位 | 成本 |")
  console.log("|---|---|---|---|---|---|---|---|---|---|---|")
  for (const m of result.models) {
    const a = m.aggregate
    const count = (cls) => m.runs.filter((r) => r.behaviorClass === cls).length
    console.log(`| ${m.label} | ${a.n} | ${a.skipped} | ${a.asked} | ${count("silent-landed")} | ${count("silent-reported")} | ${a.spun} | ${count("timeout")} | ${count("error")} | ${a.firstAskTurnMedian ?? "—"} | ${a.costCny ?? "—"} |`)
  }
}

/** 入口（导出供测试进程内调用；返回退出码，不自行 exit）。 */
export async function main(argv = process.argv.slice(2)) {
  let opts
  try { opts = parseArgs(argv) } catch (e) {
    console.error(`[probe] ${e.message}`)
    return 1
  }
  if (opts.help) { console.log(USAGE); return 0 }
  const ac = new AbortController()
  const onSigint = () => ac.abort(new Error("SIGINT"))
  process.once("SIGINT", onSigint)
  const bases = { current: null }
  try {
    validateFixtures()
    const roster = loadRoster(join(BENCH_DIR, "models.json"))
    const entries = selectEntries(roster, opts.models)
    const prices = loadPrices(pricesPath())
    const cfg = loadJudgeConfig(judgeConfigPath())
    const out = opts.dryRun ? await runDryRun(opts, entries, prices, cfg, ac, bases) : await runReal(opts, entries, prices, cfg, ac, bases)
    if (ac.signal.aborted) throw new Error("SIGINT")
    const path = writeProbeReport(out.result, { sandboxRoot: out.sandboxRoot })
    if (out.cleanup) { removeSandbox(out.sandboxRoot); bases.current = null }
    else { console.log(`[probe] 沙箱留档：${out.sandboxRoot}（清运 = 人工——控制台印真实路径；入档形态 = ${sandboxDisplay(out.sandboxRoot)}）`) }
    console.log(`[probe] 报告对已落档：${path}`)
    printSummary(out.result)
    return 0
  } catch (e) {
    if (String(e?.message).includes("SIGINT")) { console.error("[probe] SIGINT —— 不落档（退出码 130）"); return 130 }
    console.error(`[probe] ${e.message}`)
    return 1
  } finally {
    process.removeListener("SIGINT", onSigint)
    if (opts.dryRun && bases.current) removeSandbox(bases.current)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => { process.exitCode = code }).catch((e) => { console.error(`[probe] ${e?.stack ?? e}`); process.exitCode = 1 })
}
