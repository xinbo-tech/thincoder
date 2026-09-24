/**
 * test/report-present.test.mjs — 报告呈现面用例（§5.13 `render.3` / `render.4` / `render.5`；`report-render.test.mjs` 超 300 行 ⇒ 拆分）。
 * `render.3` = 成本表列集收正（五列 · 定域反例）+ 报告零金额（md）与账目面反控（JSON 零改）；
 * `render.4` = 用时表（Σ 定域 / 相对倍率 / 排名并列顺延 / 采样 run 数 / 轴门控 + ⑦ 口径行两短语与已记录 `error` run 照计 / ⑧ 部分未记录腿——2026-09-24 error-duration 批）；
 * `render.5` = 温度例外披露句（例外档在位 / 全 0 不在位 / 旧档缺字段 ≡ 全 0——2026-09-24 roster-expand 批）；
 * `render.6` = 逐档参数表（列集 / 来源两态 / 旧档缺键 `—` / 温度例外注 / note 披露腿——2026-09-24 params-judge 批 · #269）；
 * `render.7` = 速度表双排序（A 升 / B 降 / 列集正控 / 脚注一份 / 轴门控——#271）；`render.8` = 能力矩阵两列（同源照搬 / 反例控制——#272）。
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

test("render.4：用时表（Σ 定域 / 相对倍率 / 排名并列顺延 / 采样 run 数 / 轴门控 + ⑦/⑧ 口径行与部分未记录腿）", () => {
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
  assert.ok(md.indexOf("### 速度表 A") < md.indexOf("### 速度表 B") && md.indexOf("### 速度表 B") < md.indexOf("### 用时表") && md.indexOf("### 用时表") < md.indexOf("### 成本表"), "① 落位 = 速度表 A / B 后（用时表 / 成本表前）")
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
  // ⑦ 口径行（本批收正）+ 全部 call 已记录的 error run 照计且不入脚注（子腿 = 单 error run 模型；反例控制 = null 腿仍入脚注）
  assert.ok(block.includes("error run 已记录耗时照计") && block.includes("`null` = 未记录"), "⑦ 口径行两短语（逐字 = §2.3 骨架冻结子串）")
  const cellsIn = (b, l) => b.split("\n").find((x) => x.startsWith(`| ${l} |`)).split("|").map((s) => s.trim())
  const recCall = (ms) => ({ round: 1, ttftMs: null, totalMs: ms, tokens: null, toolNames: [], finishReason: null, throttled: false })
  const errBlock = renderReport({ ...data, models: [
    mkModel("fx-err", [mkRun(700, { verdict: "error", detail: "超时（夹具）", calls: [recCall(700)] })]),
    mkModel("fx-null2", [mkRun(null, { verdict: "error", detail: "无耗时记录" })]),
  ] }).split("### 用时表")[1].split("### 成本表")[0]
  assert.deepEqual([cellsIn(errBlock, "fx-err")[2], cellsIn(errBlock, "fx-err")[3], cellsIn(errBlock, "fx-err")[4], cellsIn(errBlock, "fx-err")[5]], ["700 ms", "1.0×", "1", "1"], "⑦ 已记录 error run：累计 / 倍率 / 排名 / 采样全含")
  assert.equal(errBlock.includes("- fx-err："), false, "⑦ 全部 call 已记录的 error run 不入脚注")
  assert.ok(errBlock.includes("- fx-null2：1 个 run 无 totalMs"), "⑦ 反例控制：null 腿仍入脚注")
  // ⑧ 部分未记录腿（run 级 = 已记录之和 ∧ 存在未记录 call ⇒ 按和入累计 + 入脚注；判定类型不受限——fail / error 同规则）
  const partCalls = (ms) => [recCall(ms), { ...recCall(null), round: 2 }]
  const partBlock = renderReport({ ...data, models: [
    mkModel("fx-part", [mkRun(300, { verdict: "fail", detail: "部分未记录（夹具）", calls: partCalls(300) })]),
    mkModel("fx-part-err", [mkRun(500, { verdict: "error", detail: "部分未记录（夹具）", calls: partCalls(500) })]),
  ] }).split("### 用时表")[1].split("### 成本表")[0]
  assert.deepEqual([cellsIn(partBlock, "fx-part")[2], cellsIn(partBlock, "fx-part-err")[2]], ["300 ms", "500 ms"], "⑧ 部分未记录 ⇒ 按已记录之和（下界）入累计")
  assert.ok(partBlock.includes("- fx-part：1 个 run 部分 call 未记录") && partBlock.includes("- fx-part-err：1 个 run 部分 call 未记录"), "⑧ 该 run 入脚注（含「部分 call 未记录」字面）")
})

test("render.5：温度例外披露句（例外档在位 / 全 0 不在位 / 旧档缺字段 ≡ 全 0）", () => {
  const overviewOf = (md) => md.split("## 概览")[1].split("## 方法")[0]
  // ① 例外档（kimi-k3 = 1）+ 缺省档（deepseek-flash = 0）⇒ 概览含披露句（逐档列 label 与取值）
  const ovExc = overviewOf(renderReport(fixtureResult({ modelTemperatures: [0, 1] })))
  assert.ok(ovExc.includes("温度例外"), "① 存在例外档 ⇒ 概览含披露句")
  assert.ok(ovExc.includes("kimi-k3 = 1"), "① 逐档列出 label 与取值")
  assert.equal(ovExc.includes("deepseek-flash = "), false, "① 非例外档不入披露句（取值 = 运行参数温度）")
  // ② 全 0（无例外）⇒ 该句不出现（反例控制）
  const ovZero = overviewOf(renderReport(fixtureResult({ modelTemperatures: [0, 0] })))
  assert.equal(ovZero.includes("温度例外"), false, "② 无例外档 ⇒ 披露句不出现")
  // ③ 旧档缺字段（在档 v4 实态——§2.2-12：缺字段 ≡ 全 0，由 `??` 缺省语义保证）⇒ 同 ②
  const ovLegacy = overviewOf(renderReport(fixtureResult({ modelTemperatures: [null, null] })))
  assert.equal(ovLegacy.includes("温度例外"), false, "③ 旧档缺 `models[].temperature` ⇒ 等价缺省（句不出现）")
})

// ── render.6 / render.7 / render.8（呈现面增补面 · §2.3-9 逐档参数表 / §2.3-10 双表与两列） ────────────
/** 参数表块切片（概览内：`**逐档参数表**` → 判官行前）+ 逐行定位。 */
const paramsBlock = (md) => md.split("**逐档参数表**")[1].split("- 判官 A：")[0]
const paramsRow = (md, label) => paramsBlock(md).split("\n").find((l) => l.startsWith(`| ${label} |`))
const PARAMS_HEAD = "| 模型 | 路由 | temperature | 思考强度（值 + 来源） | maxTokens |"

/** 逐 run 速度读值（显式给 ttft / tok/s / totalMs——速度面与耗时面解耦）。 */
const spRun = ({ ttftMs = null, tokPerSec = null, totalMs = null } = {}) => ({
  n: 1, verdict: "pass", detail: "",
  metrics: { ttftMs, totalMs, tokPerSec, tokens: TOK(10, 0, 5), cost: null },
  calls: [], summary: { textHead: "夹具", textLen: 2, reasoningLen: 0, toolNames: [] },
})
const spModel = (label, runs) => ({
  label, provider: "deepseek", model: "deepseek-flash", host: "api.deepseek.com", dims: ["reasoning"], note: "", aggregate: {},
  cases: [{ caseId: "reasoning.1", dim: "reasoning", class: "正常", prompt: "夹具题面", runs }],
})

/** 表格行单元格（block 内首行匹配；`i` = `split("|")` 下标——1 起为首列）。 */
const cellOf = (block, label, i) => block.split("\n").find((l) => l.startsWith(`| ${label} |`)).split("|")[i].trim()
const orderOf = (block) => block.split("\n").filter((l) => /^\| (fx|sp)-/.test(l)).map((l) => l.split("|")[1].trim())

test("render.6：逐档参数表（列集 / 来源两态 / 旧档缺键 `—` / 温度例外注 / note 披露腿 + 零金额反控）", () => {
  const md = renderReport(fixtureResult({ modelTemperatures: [0, 1] }))
  assert.ok(paramsBlock(md).includes(PARAMS_HEAD), "① 列集逐字 = 模型 · 路由 · temperature · 思考强度（值 + 来源）· maxTokens")
  const base = paramsRow(md, "deepseek-flash")
  assert.ok(base.includes("deepseek:deepseek-flash@api.deepseek.com"), "① 路由 = provider:model@host")
  assert.ok(base.includes("medium（档位覆写：models.json）"), "① 档位覆写档：值 + 来源逐行对读")
  assert.ok(base.includes("4096"), "① maxTokens 取自 run.maxTokens")
  assert.ok(paramsRow(md, "kimi-k3").includes("high（配置原值：config）"), "② 配置原值档：值 + 来源 = config")
  // ③ 旧档缺两键（未采集）⇒ 该格 `—`（缺省语义——不追改，非历史兼容分支）
  const legacy = fixtureResult({ modelTemperatures: [0, 1] })
  delete legacy.models[0].reasoningEffort
  delete legacy.models[0].reasoningEffortFrom
  assert.equal(cellOf(paramsBlock(renderReport(legacy)), "deepseek-flash", 4), "—", "③ 旧档缺两键 ⇒ 思考强度格 `—`")
  // ④ 温度例外档（kimi = 1 ≠ 运行参数温度 0）⇒ 该格注「档位例外」（与披露句同源派生）
  assert.equal(cellOf(paramsBlock(md), "kimi-k3", 3), "1（档位例外）", "④ 温度例外格注「档位例外」")
  // ⑤ 生效性事实随 `models[].note` 披露（不另设列）+ 反控 = 全 md 零评估开销金额（KD-29 不回归）
  const ignored = fixtureResult()
  ignored.models[0].note = "服务端忽略 effort（实弹 2026-09-24）"
  const mdIgnored = renderReport(ignored)
  assert.ok(mdIgnored.split("\n").find((l) => l.startsWith("| deepseek-flash | deepseek |")).includes("服务端忽略 effort"), "⑤ 概览模型表「备注」格含生效性事实")
  assert.ok(paramsBlock(mdIgnored).includes(PARAMS_HEAD), "⑤ note 披露不改变参数表列集（生效性不另设列——§2.3-9）")
  assert.equal(/判官成本|复核成本/.test(mdIgnored), false, "反控：全 md 零评估开销金额")
})

test("render.7：速度表双排序（A 升 / B 降 / 缺数据居末 / 列集正控 / 注文区分 / 脚注一份 / 轴门控）", () => {
  const data = fixtureResult()
  const models = [
    spModel("fx-a", [spRun({ ttftMs: 300, tokPerSec: 30, totalMs: 900 })]),
    spModel("fx-b", [spRun({ ttftMs: 100, tokPerSec: 10, totalMs: 700 })]),
    spModel("fx-c", [spRun({})]), // 缺数据腿（TTFT / tok/s 均 null ⇒ 两表居末 + 脚注源）
  ]
  const md = renderReport({ ...data, models })
  const A = "### 速度表 A（按 TTFT 中位升序）"
  const B = "### 速度表 B（按 tok/s 中位降序）"
  assert.ok(md.indexOf(A) >= 0 && md.indexOf(A) < md.indexOf(B) && md.indexOf(B) < md.indexOf("### 用时表"), "① 两表在位 + 落位（A 在 B 前 · B 在用时表前，标题逐字）")
  const blockA = md.split(A)[1].split("### 速度表 B")[0]
  const blockB = md.split(B)[1].split("### 用时表")[0]
  assert.deepEqual(orderOf(blockA), ["fx-b", "fx-a", "fx-c"], "② 表 A 行序 = TTFT 中位升序（缺数据居末）")
  assert.deepEqual(orderOf(blockB), ["fx-a", "fx-b", "fx-c"], "③ 表 B 行序 = tok/s 中位降序（快者在前 · 缺数据居末）")
  const HEAD = "| 模型 | TTFT 中位 | tok/s 中位 | 总耗时（中位） | 采样 run 数 |"
  assert.ok(blockA.includes(HEAD) && blockB.includes(HEAD), "④ 列集逐字相同正控（两表表头）")
  assert.ok(blockA.includes("按 TTFT 中位升序") && blockB.includes("按 tok/s 中位降序"), "⑤ 注文区分（各自排序子句）")
  const slice = md.split(A)[1].split("### 用时表")[0]
  assert.equal((slice.match(/脚注：/g) ?? []).length, 1, "⑥ 脚注一份")
  assert.ok(slice.indexOf("脚注：") > slice.indexOf(HEAD, slice.indexOf(HEAD) + 1), "⑥ 脚注列于表 B 之后（两表共用）")
  const costOnly = renderReport({ ...data, models, run: { ...data.run, dims: ["speed", "cost"], axes: ["cost"] } })
  assert.equal(costOnly.includes(A) || costOnly.includes(B), false, "⑦ 轴门控：无 speed 轴 ⇒ 两表同隐")
})

test("render.8：能力矩阵两列（同源照搬 / 反例控制 / 缺数据 `—` / 行序不变 / 注文区分）", () => {
  const data = fixtureResult()
  const caseOf = (cid, runs) => ({ caseId: cid, dim: "reasoning", class: "正常", prompt: "夹具题面", runs })
  const modelOf = (label, cases) => ({ label, provider: "deepseek", model: "deepseek-flash", host: "api.deepseek.com", dims: ["reasoning"], note: "", aggregate: {}, cases })
  const pricedRun = (ms, cost) => ({
    ...spRun({ ttftMs: 100, tokPerSec: 10, totalMs: ms }),
    metrics: { ttftMs: 100, totalMs: ms, tokPerSec: 10, tokens: TOK(10, 0, 5), cost: cost == null ? null : { value: cost, currency: "CNY", pricesAsOf: "2026-09-23" } },
  })
  const models = [
    // fx-m1：两例各 1 run（合计 2000 · 中位 1000 · 每通过任务 0.002）；fx-z9 / fx-m2 各一例（行序腿：标签字典序 ≠ 排名序）
    modelOf("fx-m1", [caseOf("reasoning.1", [pricedRun(1000, 0.002)]), caseOf("reasoning.2", [pricedRun(1000, 0.002)])]),
    modelOf("fx-z9", [caseOf("reasoning.1", [pricedRun(3000, 0.002)])]),
    modelOf("fx-m2", [caseOf("reasoning.1", [pricedRun(3000, 0.001)])]),
    modelOf("fx-m3", [caseOf("reasoning.1", [{ ...spRun({}), verdict: "error", metrics: { ttftMs: null, totalMs: null, tokPerSec: null, tokens: null, cost: null } }])]),
  ]
  const md = renderReport({ ...data, models })
  const matrixBlock = md.split("### 能力矩阵")[1].split("### 速度表 A")[0]
  const speedBlock = md.split("### 速度表 A（按 TTFT 中位升序）")[1].split("### 速度表 B")[0]
  const timeBlock = md.split("### 用时表")[1].split("### 成本表")[0]
  const costBlock = md.split("### 成本表")[1].split("### 逐维明细")[0]
  assert.equal(matrixBlock.split("\n").find((l) => l.startsWith("| 模型 |")), "| 模型 | 推理 | 合计 | 总耗时 | 相对成本 |", "① 矩阵表头 = 既有列 + 合计 + 总耗时 + 相对成本（两列接合计后）")
  assert.equal(cellOf(matrixBlock, "fx-m1", 4), cellOf(speedBlock, "fx-m1", 4), "② 总耗时 = 速度表「总耗时（中位）」同源格值")
  assert.equal(cellOf(matrixBlock, "fx-m2", 5), "1.0×", "③ 相对成本最低者 = 1.0×")
  assert.equal(cellOf(matrixBlock, "fx-m2", 5), cellOf(costBlock, "fx-m2", 5), "③ 与成本表「相对成本」同源对读")
  assert.equal(cellOf(matrixBlock, "fx-m1", 4), "1000 ms", "② 中位（非累计）——夹具定域读数")
  assert.notEqual(cellOf(matrixBlock, "fx-m1", 4), cellOf(timeBlock, "fx-m1", 2), "④ 反例控制：≠ 用时表「累计耗时」（累计 2000 ms）")
  assert.equal(cellOf(timeBlock, "fx-m1", 2), "2000 ms", "④ 该档累计耗时为大值（反例已生效）")
  assert.deepEqual([cellOf(matrixBlock, "fx-m3", 4), cellOf(matrixBlock, "fx-m3", 5)], ["—", "—"], "⑤ 缺数据（无 pass/fail 样本 / 无价）⇒ `—`")
  assert.deepEqual(orderOf(matrixBlock), ["fx-m1", "fx-m2", "fx-z9", "fx-m3"], "⑥ 行序不变（合计通过数降序 · 同值字典序——fx-z9（1 通过）在 fx-m3（0 通过）前，非标签字典序）")
  assert.ok(matrixBlock.includes("与用时表「累计耗时」不同源"), "⑦ 注文区分（矩阵注文含区分句）")
})
