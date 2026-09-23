/**
 * lib/recompute.mjs — 离线重算分支（设计 §2.7 / AC-10）：读结果 JSON → 以**当前** prices.json 重算成本 → 落新报告对。
 *
 * 与 `lib/output.mjs` 一并从 `pipeline.mjs` 拆出（设计档 §3 拆分触发条件）。**结构保证**：本档不 import
 * `lib/client.mjs`（构造性零网络）；判定用例 = 毒化 `globalThis.fetch` 后全流程仍成功（§5.13 `recompute.4`）。
 * 判官 / 复核成本随当前价表一并重算（档内逐位逐尝试 tokens = 原子账目，§2.10.5）。
 */

import { existsSync, readFileSync } from "node:fs"
import { basename, resolve } from "node:path"
import { applyPricesToResult, loadPrices, pricesPath } from "./prices.mjs"
import { renderReport } from "./report.mjs"
import { isoLocal, refuseIfExists, resultsDir, writePair } from "./output.mjs"

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
  data.warnings = [...new Set(warnings)] // 重算会把原档已有的「价格未录 / usage 缺失」警告再算一遍 ⇒ 去重（诊断列表不去噪声）
  data.prices = { asOf: prices.asOf, currency: prices.currency, unit: prices.unit, source: prices.source }
  data.label = opts.label ?? `${data.label}-recalc`
  data.recomputed = {
    from: fromPath.startsWith(resultsDir()) ? `bench/results/${basename(fromPath)}` : basename(fromPath),
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
