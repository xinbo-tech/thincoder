/**
 * lib/rejudge.mjs — 跑后补判通道（设计 §2.14 / §2.7 · KD-39）：判官面 error run 定点收正。
 *
 * 与 `--recompute` **分档互斥**：补判 = **触网分支**（动态 `import("./client.mjs")`——重取素材 + 级联补判）；
 * 零网络结构保证只覆盖 `--recompute` 面（§2.7）。素材面 = **定点重取**（结果档不存响应原文 ⇒ 判官素材不可由
 * 档内重建——§7-5 / KD-33）：档内题面逐字（§2.2-11）+ **当前题集代际的用例声明**（工具面 `callOpts` / 载荷 /
 * `build()`）重构该 run 的被测调用，参数沿原档（`run.maxTokens` / `run.timeoutSec` / `models[].temperature` /
 * `models[].reasoningEffort`）；跨代际重取 ⇒ 新样本按当前代际声明构造（样本替换语义——方法行版本句判读）。
 *
 * 补判对象（§2.14）：`runs[].verdict === "error"` ∧ `runs[].judge.verdict === "error"`（判官面三成因：
 * 有效判不足 / 分歧未决 / 素材缺失）；**被测侧失败不入列**（无素材可判——裁点 ⑥）。
 * 落**新报告对**（缺省标签 = `<原标签>-rejudged`）；**原档逐字节零改**（留档不可变 · KD-10 同名拒写照旧）；
 * 新档 `suiteVersion` = **补判时代际** + `rejudged` 溯源块（§2.2-17 逐 run `was → now`）；收编 = 人工点名。
 * 退出码（§2.1-8）：0 = 完成（含重取后仍如实 `error` 者 · 无对象亦取 0 · 全灭亦取 0）· 1 = 基建错误 · 130 = SIGINT。
 */

import { existsSync, readFileSync } from "node:fs"
import { basename, resolve } from "node:path"
import { CASES, SUITE_VERSION } from "../cases/index.mjs"
import { buildProviderEntry, enumerationPreflight } from "./params.mjs"
import { judgeConfigPath, judgeSnapshot, loadJudgeConfig, resolveJudgeSlots } from "./judge.mjs"
import { applyPricesToResult, loadPrices, pricesPath } from "./prices.mjs"
import { executeRun, makeJudgeEnv, substituteLine } from "./pipeline.mjs"
import { validateResultShape } from "./recompute.mjs"
import { isoLocal, refuseIfExists, resultsDir, writePair } from "./output.mjs"
import { renderReport } from "./report.mjs"

/** 补判对象筛选（§2.14）：只判官面 error run——被测侧失败（无判官面记录）不入列（如实 `error` 维持）。 */
function targetsOf(data) {
  const out = []
  for (const m of data.models ?? []) {
    for (const c of m.cases ?? []) {
      for (const [i, r] of (c.runs ?? []).entries()) {
        if (r?.verdict === "error" && r?.judge?.verdict === "error") out.push({ model: m, caseRec: c, index: i, run: r })
      }
    }
  }
  return out
}

/** 补判主流程（一条命令：读档 → 对象筛选 → 定点重取素材 + 级联补判 → 落新报告对）。
 *  `deps` = 测试注入缝（client / transport / judgeTransport / providers——缺省全走真实面）。 */
export async function rejudgeMain(opts, deps = {}) {
  const fromPath = resolve(process.cwd(), opts.from)
  if (!existsSync(fromPath)) throw new Error(`--from 文件不存在：${basename(fromPath)}`)
  let data
  try {
    data = JSON.parse(readFileSync(fromPath, "utf8"))
  } catch (e) {
    throw new Error(`--from 结果 JSON 解析失败：${e.message}`)
  }
  validateResultShape(data) // 档形闸（§2.14 退出码 1：不符 schema）——与 --recompute 同一校验单源
  const targets = targetsOf(data)
  if (targets.length === 0) {
    console.log("本轮无判官面 error run——补判面零对象（不落档 · 退出码 0）")
    return 0
  }
  const judgeCfg = loadJudgeConfig(judgeConfigPath()) // 判官配置不齐 ⇒ 基建错误（退出码 1——§2.14）
  const providers = deps.providers ?? ((await import("../../thincoder-core/config.mjs")).loadConfig().providers ?? [])
  const client = deps.client ?? (await import("./client.mjs"))
  const { slots, pool } = resolveJudgeSlots(judgeCfg, { providers, tested: (data.models ?? []).map((m) => ({ provider: m.provider, model: m.model })) })
  const { blockers } = enumerationPreflight({ slots: [...slots, ...pool], providers })
  if (blockers.length > 0) throw new Error(`跑前预检：枚举面阻断 ${blockers.length} 条 —— 拒跑（§2.13）：\n  - ${blockers.join("\n  - ")}`)
  const prices = loadPrices(pricesPath())
  const ac = new AbortController()
  const onSigint = () => ac.abort(new Error("SIGINT"))
  process.once("SIGINT", onSigint)
  const source = fromPath.startsWith(resultsDir()) ? `bench/results/${basename(fromPath)}` : basename(fromPath)
  data.label = opts.label ?? `${data.label}-rejudged` // 缺省标签（§2.14）
  const srcDate = String(data.startedAt ?? "").slice(0, 10)
  const fileBase = `${/^\d{4}-\d{2}-\d{2}$/.test(srcDate) ? srcDate : isoLocal().slice(0, 10)}-${data.label}`
  refuseIfExists(fileBase) // 同名拒写前置（先于定点重取——撞名不白付触网成本 · KD-10）
  const trace = []
  try {
    for (const t of targets) {
      if (ac.signal.aborted) throw new Error("SIGINT")
      // 素材构造单源（§2.14）：档内题面逐字 + 当前题集代际的用例声明（工具面 / 载荷 / build）
      const decl = CASES.find((x) => x.id === t.caseRec.caseId)
      if (!decl) throw new Error(`当前题集代际无该用例声明：${t.caseRec.caseId}（跨代际重取不可行——用例已删）`)
      const caseObj = { ...decl, prompt: t.caseRec.prompt ?? decl.prompt }
      const user = providers.find((p) => p.name === t.model.provider)
      if (!user) throw new Error(`补判对象的 provider 不在用户 config（~/.thincoder/config.json）：${t.model.provider}（${t.model.label}）`)
      const providerEntry = buildProviderEntry(user, {
        model: t.model.model,
        maxTokens: data.run?.maxTokens ?? 4096,
        temperature: t.model.temperature ?? 0,
        reasoningEffort: t.model.reasoningEffort ?? null,
      })
      const judgeEnv = makeJudgeEnv({ client, slots, pool, providers, signal: ac.signal, dryRun: false, judgeTransport: deps.judgeTransport ?? null })
      const fresh = await executeRun({
        client,
        caseObj,
        providerEntry,
        transport: deps.transport ?? client.liveTransport,
        signal: ac.signal,
        timeoutMs: (data.run?.timeoutSec ?? 120) * 1000,
        n: t.run.n ?? 1,
        judgeEnv,
      })
      const note = fresh.judge ? `判官（${fresh.judge.resolution}）：${fresh.judge.reason}` : `被测侧：${fresh.detail}`
      trace.push({ label: t.model.label, caseId: t.caseRec.caseId, n: t.run.n ?? 1, was: t.run.verdict, now: fresh.verdict, note: note.slice(0, 160) })
      t.caseRec.runs[t.index] = fresh
      console.log(`[bench] 补判 ${t.model.label} ${t.caseRec.caseId}（n=${t.run.n ?? 1}）：${t.run.verdict} → ${fresh.verdict}`)
      // 替代透明（§8-6 首句为泛化要求）：补判面同样逐级即时一行
      for (const j of fresh.judge?.judges ?? []) {
        for (const s of j.substitutes ?? []) console.log(substituteLine(t.model.label, t.caseRec.caseId, j, s))
      }
    }
  } catch (e) {
    if (ac.signal.aborted) {
      console.error("[bench] SIGINT —— 已中止在飞调用，补判本轮不落档（退出码 130）")
      return 130
    }
    throw e
  } finally {
    process.removeListener("SIGINT", onSigint)
  }
  data.suiteVersion = SUITE_VERSION // 补判时代际（§2.14 版本归属：补判按补判时现行口径执行；原档不改写）
  data.judge = judgeSnapshot(slots, pool, judgeCfg) // 判官配置快照随补判时代际（代际自述面；逐 run 记录零改）
  const warnings = Array.isArray(data.warnings) ? [...data.warnings] : []
  applyPricesToResult(data, prices, warnings)
  data.warnings = [...new Set(warnings)]
  data.prices = { asOf: prices.asOf, currency: prices.currency, unit: prices.unit, source: prices.source }
  data.rejudged = { from: source, at: isoLocal(), runs: trace }
  const where = writePair(fileBase, data, renderReport(data, { fileBase }))
  console.log(`\n=== 补判完成（触网分支）：补判 ${trace.length} 例（was → now 逐条见上）→ 新报告对：${where} ===`)
  console.log(`源档：${source}（原档不动；收编 = 人工点名）`)
  for (const m of data.models ?? []) {
    console.log(`${m.label.padEnd(28)} 通过 ${m.aggregate?.passed}/${m.aggregate?.total}  判官不可用 ${(m.cases ?? []).flatMap((c) => c.runs ?? []).filter((r) => r.judge?.verdict === "error").length} 例`)
  }
  if (warnings.length > 0) console.log(`告警 ${warnings.length} 条：${warnings.join("；")}`)
  return 0
}
