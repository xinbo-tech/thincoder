#!/usr/bin/env node
/**
 * bench/preflight.mjs — 跑前参数预检（设计 §2.13 · KD-34 · 台账 #266）。
 *
 * 两面：
 * - **枚举面**（缺省跑 · 零网络 · fail-closed）= 逐档 + 判官三槽 + **替代池逐项**做「config × spec」兼容判定（六项逐项裁定）
 *   ——有阻断（①②③）⇒ 逐条点名 + 退出码 1；判定实现单源 = `lib/params.mjs`（与 `run.mjs` 启动门同函数）。
 * - **实弹面**（`--live` · 需密钥 · 1 发/档 · 单轮无工具 · 与运行面同构参数）= 全档参数受理探针（透传档为
 *   必测面——无枚举行时核守卫不把关）；读数 = 受理 / 400 / 抛错 + 时延，逐档打印。
 *   实弹面**不入 run 自动路径**（花钱 + 需网络 ⇒ 跑批前由用户 / 父侧点名执行）；全档受理 ⇒ 退出码 0，任一异常 ⇒ 1。
 *
 * **零落库**（§2.13）：不写 `bench/results/`、不写台账、不改用户 config——读数入控制台 + 批次档 §5。
 */

import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { head } from "./lib/output.mjs"
import { buildProviderEntry } from "./lib/params.mjs"

const BENCH_DIR = dirname(fileURLToPath(import.meta.url))

const USAGE = `用法：
  node bench/preflight.mjs            # 枚举面（零网络 · 缺省跑）
  node bench/preflight.mjs --live     # + 实弹面（1 发/档 · 需密钥 · 与运行面同构参数；花费真实费用）

  枚举面 = 「config × spec」兼容判定（① provider 在 config · ② spec 命中 · ③ effort ∈ 枚举【①②③ = 阻断】·
  ④ 温度裁剪对账【报警】· ⑤ 路由 / format 豁免 · ⑥ thinking 面不设判定）；有阻断 ⇒ 逐条点名 + 退出码 1。
  实弹面 = 全档参数受理探针（单轮无工具）——实弹不在 run 自动路径内（跑批前点名执行）。
  零落库：不写 bench/results/、不写台账、不改用户 config。`

/** 实弹面单档探针（1 发 · 单轮无工具 · 与运行面同构参数：档位 temperature / reasoningEffort + 4096 输出上限）。 */
async function liveProbe(entry, user) {
  const { liveTransport } = await import("./lib/client.mjs")
  const providerEntry = buildProviderEntry(user, {
    model: entry.model,
    maxTokens: 4096,
    temperature: entry.temperature ?? 0,
    reasoningEffort: entry.reasoningEffort ?? null,
  })
  const t0 = Date.now()
  try {
    const res = await liveTransport.call({
      provider: providerEntry,
      messages: [{ role: "user", content: "只回答：ok" }],
      signal: AbortSignal.timeout(120 * 1000),
    })
    const ms = Date.now() - t0
    const text = String(res?.response?.content ?? "").trim()
    return { ok: true, detail: `受理 · ${ms} ms · 首个非空 delta ${res?.ttftMs == null ? "—" : `${res.ttftMs} ms`} · 输出 ${text.length} 字符` }
  } catch (e) {
    return { ok: false, detail: `拒绝 / 抛错 · ${Date.now() - t0} ms · ${e?.name ?? "Error"}: ${head(e?.message ?? String(e), 160)}` }
  }
}

/** 入口（返回退出码，不自行 exit——体例同 `run.mjs` 便于进程内测试）。 */
export async function main(argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE)
    return 0
  }
  const unknown = argv.filter((a) => a !== "--live")
  if (unknown.length > 0) {
    console.error(`[preflight] 未知参数 ${unknown.join(", ")}（--help 看用法）`)
    return 1
  }
  const live = argv.includes("--live")
  try {
    const { loadRoster, selectEntries } = await import("./lib/roster.mjs")
    const { judgeConfigPath, loadJudgeConfig, resolveJudgeSlots } = await import("./lib/judge.mjs")
    const { enumerationPreflight } = await import("./lib/params.mjs")
    const { loadConfig } = await import("../thincoder-core/config.mjs")
    const entries = selectEntries(loadRoster(join(BENCH_DIR, "models.json")), null)
    const providers = loadConfig().providers ?? []
    const blockers = []
    let slots = []
    let pool = []
    try {
      const r = resolveJudgeSlots(loadJudgeConfig(judgeConfigPath()), { providers, tested: entries })
      slots = r.slots
      pool = r.pool
      for (const w of r.warnings) console.log(`信息 判官槽位：${w}`)
    } catch (e) {
      blockers.push(`判官配置：${e.message}`)
    }
    const pre = enumerationPreflight({ entries, slots, pool, providers })
    console.log(`跑前参数预检 · 枚举面（零网络）——受测 ${entries.length} 档 + 判官 ${slots.length} 槽 + 替代池 ${pool.length} 项`)
    for (const line of pre.lines) console.log(line)
    const all = [...blockers, ...pre.blockers]
    if (all.length > 0) {
      console.log(`\n枚举面阻断 ${all.length} 条 —— 拒跑（修法后重跑本命令）：`)
      for (const b of all) console.log(`  - ${b}`)
      return 1
    }
    console.log(`\n枚举面零阻断${pre.warnings.length > 0 ? `（报警 ${pre.warnings.length} 条——不入阻断集）` : ""}。`)
    if (!live) {
      console.log("（实弹面未跑——`--live` = 全档参数受理探针：1 发/档 · 需密钥 · 花费真实费用 · 跑批前点名执行）")
      return 0
    }
    console.log("\n跑前参数预检 · 实弹面（1 发/档 · 单轮无工具 · 与运行面同构参数）——花费真实费用")
    let failed = 0
    for (const entry of entries) {
      const user = providers.find((p) => p.name === entry.provider)
      const r = await liveProbe(entry, user)
      if (!r.ok) failed++
      console.log(`${r.ok ? "受理" : "异常"} 模型 ${entry.label}（${entry.provider}:${entry.model}）—— ${r.detail}`)
    }
    console.log(`\n实弹面读数：受理 ${entries.length - failed} / ${entries.length}${failed > 0 ? ` · 异常 ${failed}` : ""}。`)
    return failed === 0 ? 0 : 1
  } catch (e) {
    console.error(`[preflight] ${e.message}`)
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => { process.exitCode = code }).catch((e) => {
    console.error(`[preflight] ${e?.stack ?? e}`)
    process.exitCode = 1
  })
}
