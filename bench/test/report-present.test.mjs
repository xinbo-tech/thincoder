/**
 * test/report-present.test.mjs — 报告呈现面用例（§5.13 `render.3` / `render.4`；`report-render.test.mjs` 超 300 行 ⇒ 拆分）。
 * `render.3` = 成本表列集收正（五列 · 定域反例）+ 报告零金额（md）与账目面反控（JSON 零改）；
 * `render.4` = 用时表（Σ 定域 / 相对倍率 / 排名并列顺延 / 采样 run 数 / 轴门控）。
 * 夹具与 CLI 驱动在 `test/fixtures.mjs`；手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI）。
 */

import { applyPricesToResult, loadPrices, pricesPath } from "../lib/prices.mjs"
import { renderReport } from "../lib/report.mjs"
import { TOK, assert, fixtureResult, jCall, jRec, judgeRec, reviewRec, test } from "./fixtures.mjs"

/** 夹具 → 完整结果对象（成本字段 / 判官聚合 = 生产同源 `applyPricesToResult`）。 */
function priced(over = {}) {
  const data = fixtureResult(over)
  applyPricesToResult(data, loadPrices(pricesPath()), data.warnings)
  return data
}

/** 评估开销分账原则句（§2.3-8 逐字冻结——测试侧硬编码：串一改即红）。 */
const SPLIT_NOTE = "评估开销（判官 / 复核）不进被测成本、不参与相对成本归一化——报告不列评估开销金额；账目见结果 JSON"

test("render.3：成本表五列 + 定域反例 + 脚注逐字 + 报告零金额（md）+ 统计在位 + 账目面反控（JSON 零改）", () => {
  const data = priced()
  const md = renderReport(data)
  const costBlock = md.split("### 成本表")[1].split("### 逐维明细")[0]
  assert.ok(costBlock.includes("| 模型 | 总成本 | 每任务成本 | 每通过任务成本 | 相对成本 |"), "① 成本表表头 = 五列精确串")
  for (const banned of ["判官成本", "复核成本", "两列"]) assert.equal(costBlock.includes(banned), false, `② 成本表块内不得含：${banned}`)
  assert.ok(costBlock.includes(SPLIT_NOTE), "③ 脚注 = 分账原则句（逐字 = §2.3-8 冻结字符串）")
  assert.equal(costBlock.includes("¥0.0171"), false, "③ 块内零判官开销金额")
  assert.equal(costBlock.includes("¥0.00216"), false, "③ 块内零复核开销金额")
  const judgeRows = md.split("\n").filter((l) => /^- (判官 [AB]|仲裁 C)：/.test(l))
  assert.equal(judgeRows.length, 3, "概览判官三行在位")
  assert.equal(judgeRows.some((l) => /成本\s*¥/.test(l)), false, "④ 概览判官行零「成本 ¥」")
  assert.equal(/判官成本|复核成本/.test(md), false, "④ 全 md 零评估开销成本字样（零展示整面）")
  assert.ok(md.split("## 概览")[1].split("## 方法")[0].includes(SPLIT_NOTE), "④ 概览分账句在位（不列金额）")
  assert.ok(judgeRows.every((l) => /调用 \d+ 次/.test(l)), "⑤ 判官行「调用 N 次」在位")
  assert.ok(md.includes("- 判官分歧率：50%（分歧 1 ÷ A/B 双有效样本 2）"), "⑤ 分歧率行在位")
  assert.ok(md.includes("机械 fail 复核 2 次（翻案 1 次）"), "⑤ 告警行复核计数在位")
  assert.deepEqual([data.judge.costCny, data.judge.judges[0].costCny, data.models[0].aggregate.judgeCostCny, data.models[0].aggregate.reviewCostCny].map((v) => typeof v === "number"), [true, true, true, true], "⑥ 账目面反控：JSON 字段照旧（字段零改）")
  assert.deepEqual([data.judge.costCny, data.models[0].aggregate.reviewCostCny], [0.017075, 0.00216], "⑥ 数值照旧（金额只住 JSON）")
})

// ── render.4 夹具：显式 run 耗时（用例一一对应；判定面与耗时面正交） ────────────────
const mkRun = (totalMs, over = {}) => ({
  n: 1, verdict: "pass", detail: "",
  metrics: { ttftMs: 100, totalMs, tokPerSec: 100, tokens: TOK(10, 0, 5), cost: null },
  calls: [], summary: { textHead: "夹具", textLen: 2, reasoningLen: 0, toolNames: [] }, ...over,
})
const mkModel = (label, runs) => ({
  label, provider: "deepseek", model: "deepseek-flash", host: "api.deepseek.com", dims: ["reasoning"], note: "", aggregate: {},
  cases: runs.map((r, i) => ({ caseId: `reasoning.${i + 1}`, dim: "reasoning", class: "正常", prompt: "夹具题面", runs: [r] })),
})

test("render.4：用时表（Σ 定域 / 相对倍率 / 排名并列顺延 / 采样 run 数 / 轴门控）", () => {
  const data = fixtureResult()
  // 定域反例：判官 / 复核调用的 `totalMs` 刻意置大值 ⇒ 不得计入累计（只认 `runs[].metrics.totalMs`）
  const big = { totalMs: 999999 }
  const heavyJudge = judgeRec("pass", "unanimous", [jRec("A", "pass", "夹具。", [jCall(TOK(300, 0, 40), big)]), jRec("B", "pass", "夹具。", [jCall(TOK(300, 0, 45), big)])])
  const heavyReview = { ...reviewRec("overturn", "夹具：翻案。"), calls: [jCall(TOK(300, 0, 40), big)] }
  const models = [
    // fx-fast：6 run（5500）+ error run（500——照计）= 6000；skipped / null 腿不入 ⇒ 采样 7（非 9）
    mkModel("fx-fast", [500, 500, 1000, 1000, 1000, 1500].map((ms) => mkRun(ms))
      .concat([mkRun(500, { verdict: "error", detail: "超时（夹具）" }), mkRun(1100, { verdict: "skipped", detail: "不在该模型面" }), mkRun(null, { verdict: "error", detail: "无耗时记录" })])),
    // fx-tie：同合计 6000（分布不同）⇒ 与 fx-fast 并列第 1；fx-heavy：12000（含 999999 调用）⇒ 第 3
    mkModel("fx-tie", [1000, 1000, 1000, 1000, 1000, 1000].map((ms) => mkRun(ms))),
    mkModel("fx-heavy", [2000, 2000, 2000, 2000].map((ms) => mkRun(ms))
      .concat([mkRun(2000, { judge: heavyJudge }), mkRun(2000, { review: heavyReview })])),
    // fx-nodata：样本全缺 ⇒ 累计 / 倍率 / 排名 `—` · 居末 + 脚注
    mkModel("fx-nodata", [mkRun(null, { verdict: "error", detail: "无耗时记录" }), mkRun(null, { verdict: "error", detail: "无耗时记录" })]),
  ]
  const md = renderReport({ ...data, models })
  const block = md.split("### 用时表")[1].split("### 成本表")[0]
  assert.ok(md.indexOf("### 速度表") < md.indexOf("### 用时表") && md.indexOf("### 用时表") < md.indexOf("### 成本表"), "① 落位 = 速度表后（成本表前）")
  assert.ok(block.includes("| 模型 | 累计耗时 | 相对倍率 | 排名 | 采样 run 数 |"), "① 列集 = {模型 · 累计耗时 · 相对倍率 · 排名 · 采样 run 数}")
  const cellsOf = (label) => block.split("\n").find((l) => l.startsWith(`| ${label} |`)).split("|").map((s) => s.trim())
  assert.deepEqual([cellsOf("fx-fast")[2], cellsOf("fx-heavy")[2]], ["6000 ms", "12000 ms"], "② 累计耗时 = Σ runs[].metrics.totalMs（判官 / 复核调用不计入）")
  assert.equal(block.includes("999999"), false, "② 定域反例：大值调用不入合计")
  assert.deepEqual([cellsOf("fx-fast")[3], cellsOf("fx-heavy")[3]], ["1.0×", "2.0×"], "③ 相对倍率 = ÷ 表内最低者（1.0×）")
  assert.deepEqual(["fx-fast", "fx-tie", "fx-heavy", "fx-nodata"].map((l) => cellsOf(l)[4]), ["1", "1", "3", "—"], "④ 排名升序 + 同值并列顺延")
  const order = block.split("\n").filter((l) => /^\| fx-/.test(l)).map((l) => l.split("|")[1].trim())
  assert.deepEqual(order, ["fx-fast", "fx-tie", "fx-heavy", "fx-nodata"], "④ 用时表行序 = 升序 · 缺数据居末")
  assert.ok(block.includes("- fx-nodata：2 个 run 无 totalMs"), "④ 全缺样本脚注")
  assert.equal(models[0].cases.flatMap((c) => c.runs).length, 9, "⑤ 夹具含 skipped 腿与 null 腿（参与面 ≠ run 总数）")
  assert.deepEqual([cellsOf("fx-fast")[5], cellsOf("fx-heavy")[5], cellsOf("fx-nodata")[5]], ["7", "6", "0"], "⑤ 采样 run 数 = 参与累计的 run 数")
  assert.ok(block.includes("- fx-fast：1 个 run 无 totalMs"), "⑤ null 腿脚注")
  const costOnly = renderReport({ ...data, models, run: { ...data.run, dims: ["speed", "cost"], axes: ["cost"] } })
  assert.equal(costOnly.includes("### 用时表"), false, "⑥ 轴门控 = speed（无 speed ⇒ 用时表不出）")
  assert.ok(costOnly.includes("### 成本表"), "⑥ cost 轴表仍在位")
})
