/**
 * test/report-render.test.mjs — 报告渲染面用例（§5.10 `report.1/2` + §5.13 `render.1/2` / `review.1/2`）
 * + `--dry-run` 全链路产物断言（AC-2 / AC-14）+ 矩阵与脱敏回归（D1 / F3）。
 * 夹具与 CLI 驱动在 `test/fixtures.mjs`。手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI —— AC-8）。
 */

import { readFileSync } from "node:fs"
import { DIMENSIONS } from "../cases/index.mjs"
import { applyPricesToResult, loadPrices, pricesPath } from "../lib/prices.mjs"
import { renderReport } from "../lib/report.mjs"
import { scanLeaks } from "../lib/sanitize.mjs"
import { findFile, fixtureResult, files, readJson, runCli, SANDBOX, test, assert, writeFixture } from "./fixtures.mjs"

/** 夹具 → 完整结果对象（成本字段 / 判官聚合 = 生产同源 `applyPricesToResult`）。 */
function priced(over = {}) {
  const data = fixtureResult(over)
  applyPricesToResult(data, loadPrices(pricesPath()), data.warnings)
  return data
}

test("render.1：概览判官三行 + 分歧率 + 方法判分条 + 成本表两列 + ⇄ 标记 + 《判官分歧》 + 告警计数", () => {
  const data = priced()
  const md = renderReport(data)
  for (const needle of [
    "- 判官 A：`deepseek:deepseek-flash`",
    "- 判官 B：`deepseek:deepseek-v4-pro`",
    "- 仲裁 C：`mimo:mimo-v2.6-pro`",
    "（仅分歧样本）",
    "- 判官分歧率：50%（分歧 1 ÷ A/B 双有效样本 2）",
    "- 判官成本合计 ¥0.0171 · 复核成本 ¥0.00216",
    "判官对（A / B 双判 · 同一冻结 rubric）",
    "- 判分模板：判官 promptVersion = 1 · 复核 promptVersion = 1 · 判官配置冻结于 suiteVersion 4",
    "| 模型 | 总成本 | 每任务成本 | 每通过任务成本 | 相对成本 | 判官成本 | 复核成本 |",
    "### 判官分歧",
    "### 复核翻案",
    "判官不可用 1 次（有效判不足 1 · 分歧未决 0）· 判官分歧 1 次（仲裁 1）· 机械 fail 复核 2 次（翻案 1 次）",
  ]) {
    assert.ok(md.includes(needle), `缺渲染件：${needle}`)
  }
  // 判官行 = 与被测重合三级标注（**渲染面派生**：判官块不另存字段）：夹具 A 位同键（自判）/ B 位同渠道 / C 位无重合
  const judgeRow = (name) => md.split("\n").find((l) => l.startsWith(`- ${name}：`))
  assert.ok(judgeRow("判官 A").includes("该位 ∈ 被测（自判）"), `同位位标注（实得：${judgeRow("判官 A")}）`)
  assert.ok(judgeRow("判官 B").includes("与被测同渠道（明示 sameVendorAsTested）"), `同渠道位标注（实得：${judgeRow("判官 B")}）`)
  assert.ok(judgeRow("仲裁 C").includes("与被测无重合"), `无重合位标注（实得：${judgeRow("仲裁 C")}）`)
  // ⇄ / ⟲ 标记与两小节条目
  assert.ok(md.includes("❌ fail 0/1 ⇄"), "分歧样本加 ⇄")
  assert.ok(md.includes("❌ fail 0/1 ⟲"), "复核翻案加 ⟲")
  assert.ok(md.includes("| multiturn.2 | deepseek-flash | pass |"), "《判官分歧》逐条列 A / B / C")
  assert.ok(md.includes("| tools.3 | deepseek-flash |"), "《复核翻案》逐条列机械失败断言与复核理由")
  assert.ok(md.includes("overturn（翻案）"), "翻案单列")
  // 相对成本基准 = 每通过任务成本（判官 / 复核成本不参与归一化）
  const costBlock = md.split("### 成本表")[1].split("### 逐维明细")[0]
  assert.ok(costBlock.includes("不参与相对成本归一化"), "成本表注明两列口径")
  assert.equal(costBlock.includes("判官成本 = Σ"), false, "判官成本不并入总成本口径句")
  // 判官理由行 / 复核行（逐维明细）
  assert.ok(md.includes("- 判官 · deepseek-flash：A=pass / B=pass → 合成分 pass（unanimous）"), "判官理由行")
  assert.ok(md.includes("- 复核 · deepseek-flash：1 次（uphold 1 · 翻案 0）"), "复核行")
  // 缺价位口径句（§2.10.5）：B 位换成未录价键 ⇒ 合计标注「不含未录价位」+ 成本表说明（不得当全量读）
  const unpricedData = priced()
  unpricedData.judge.judges[1] = { ...unpricedData.judge.judges[1], provider: "tokenhub", model: "hy3" }
  unpricedData.warnings = []
  applyPricesToResult(unpricedData, loadPrices(pricesPath()), unpricedData.warnings)
  assert.equal(unpricedData.judge.judges[1].costCny, null, "缺价 ⇒ 位级成本 null")
  assert.ok(unpricedData.warnings.some((w) => w.includes("价格未录：判官 B（tokenhub:hy3）")), "缺价警告在位")
  const mdUnpriced = renderReport(unpricedData)
  assert.ok(mdUnpriced.includes("不含未录价位：tokenhub:hy3"), "合计口径句（缺价位不明示 ⇒ 部分和冒充合计）")
  assert.ok(mdUnpriced.includes("- 判官成本口径：以下判官位未录价"), "成本表缺价说明句")
  // 复核失败（AC-12 告警面）：运行记录挂一条 review error ⇒ 概览复核行与关键发现告警行均显影
  const withRevErr = priced()
  withRevErr.models[0].cases.find((c) => c.caseId === "tools.3").runs[0].review.verdict = "error"
  applyPricesToResult(withRevErr, loadPrices(pricesPath()), []) // 账目主位按生产同源重算（uphold / 翻案 / 失败计数）
  const mdErr = renderReport(withRevErr)
  assert.ok(mdErr.includes("复核 2 次 · uphold 1 · 翻案 0 · 复核失败 1"), "概览复核行含复核失败计数")
  assert.ok(mdErr.includes("机械 fail 复核 2 次（翻案 0 次 · 复核失败 1 次）"), "告警行含复核失败计数（成因分列口径）")
})

test("render.2：逐维明细题面行 = 题面正本（>300 字符 ⇒ 渲染截断 `…`；JSON 存全额）", async () => {
  const data = priced()
  const md = renderReport(data)
  assert.ok(md.includes("> 题面：请回答：一年有几个月？"), "静态题面逐字入行")
  // 构造型 / 多轮题面：JSON 里存全额（含载荷括注 / 逐回合拼接）
  const label = `promptrow-${process.pid}`
  const dry = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "multiturn,longctx,vision", "--label", label])
  assert.equal(dry.code, 0, dry.out)
  const json = readJson(findFile(`${label}.json`))
  const caseOf = (id) => json.models[0].cases.find((c) => c.caseId === id)
  const mt1 = caseOf("multiturn.1").prompt
  assert.ok(mt1.includes("帮我给团队发一封会议邀请邮件。") && mt1.includes("收件人 team@example.com，主题「周会」，时间明天 15:00。"), "多轮题面 = prompt + followUps 逐字拼接")
  assert.ok(caseOf("longctx.1").prompt.includes("8K 字符长文"), "构造型题面含载荷括注")
  const md2 = readFileSync(findFile(`${label}.md`), "utf8")
  assert.ok(md2.includes("> 题面：16K 字符长文"), "构造型题面照渲染")
  // 截断腿（§5.13 render.2）：夹具显式构造 >300 字符题面 ⇒ 渲染面截断 `…`（JSON 存全额；`head(prompt, 300, true)` = 299 + `…`）
  const longPrompt = `${"长题面填充。".repeat(60)}尾`
  assert.ok(longPrompt.length > 300, "夹具题面 >300 字符")
  const longData = priced()
  longData.models[0].cases[0].prompt = longPrompt
  const truncRow = renderReport(longData).split("\n").find((l) => l.startsWith("> 题面：") && l.includes("长题面填充。"))
  assert.ok(truncRow, "长题面行在场（截断腿不得空转）")
  const shown = truncRow.replace("> 题面：", "")
  assert.ok(shown.length <= 300, `题面行须 ≤300 字符（实得 ${shown.length}）`)
  assert.ok(shown.endsWith("…"), "超限截断以 `…` 标注")
})

test("report.1：夹具渲染 → 七段骨架齐 + 三表 + 逐维明细 + 人工判读在位；轴-only ⇒ 只出速度/成本表", () => {
  const md = renderReport(fixtureResult())
  for (const section of ["## 概览", "## 方法", "## 结果", "### 能力矩阵", "### 速度表", "### 成本表", "### 逐维明细", "### 人工判读", "### 判官分歧", "### 复核翻案", "## 关键发现", "## 局限声明", "## 附录", "### 复跑命令", "### 结果指针"]) {
    assert.ok(md.includes(section), `缺段：${section}`)
  }
  assert.match(md, /^# 模型基准报告 · fx-run · 2026-09-23/m)
  assert.ok(md.includes("| 2/6 |"), "能力矩阵 = 通过用例数/该维用例数（合计列）")
  assert.ok(md.includes("manual.1"), "人工判读逐条并列题面")
  assert.ok(md.includes("node bench/run.mjs --recompute --from bench/results/2026-09-23-fx-run.json"), "附录给复跑命令（相对路径形态）")
  // 轴选择（§2.1-1）：`--dims speed,cost` = 只出速度/成本表
  const base = fixtureResult()
  const axesOnly = renderReport({ ...base, run: { ...base.run, dims: ["speed", "cost"], axes: ["speed", "cost"] } })
  assert.ok(axesOnly.includes("### 速度表") && axesOnly.includes("### 成本表"), "已选轴必须在位")
  for (const absent of ["### 能力矩阵", "### 逐维明细", "### 人工判读", "### 判官分歧", "### 复核翻案", "- 能力通过率："]) {
    assert.equal(axesOnly.includes(absent), false, `未选能力轴 ⇒ 不得出现：${absent}`)
  }
  assert.ok(axesOnly.includes("## 概览") && axesOnly.includes("## 局限声明"), "骨架段仍齐")
})

test("report.2：夹具含 `C:\\\\Users\\\\someone\\\\…` 与 `sk-…` 字面 → sanitize 拒写（退出码 1）+ 指出命中位置", async () => {
  const leak = "路径 C:\\Users\\someone\\notes.txt 与密钥 sk-ABCDEFGH12345678"
  const from = writeFixture(`fx-leak-${process.pid}.json`, fixtureResult({ label: `fx-leak-${process.pid}`, leakText: leak }))
  const before = files()
  const { code, out } = await runCli(["--recompute", "--from", from])
  assert.equal(code, 1, out)
  assert.match(out, /脱敏断言拒绝写入/)
  assert.match(out, /第 \d+ 行/, "错误须指出命中位置")
  assert.deepEqual(files(), before, "带病产物不得落档（fail-closed）")
  const leaks = scanLeaks(leak)
  assert.ok(leaks.some((h) => h.id === "win-disk-path"))
  assert.ok(leaks.some((h) => h.id === "sk-key"))
})

test("F3 回归：sanitize 只认盘符路径——URL 是正控（不得命中）；JSON 转义引号是负控", () => {
  assert.deepEqual(scanLeaks("参考 https://example.com/a?x=1 与 http://localhost:3000/"), [], "URL 不得被误判为盘符路径")
  assert.deepEqual(scanLeaks("file:///etc/passwd 与 ftp://host/x"), [], "其他 scheme 同判")
  assert.deepEqual(scanLeaks('{a:"1", b:"2"}'), [], "JSON 转义引号（`b:\\\"`）不得误判为盘符路径")
  assert.equal(scanLeaks("路径:C:\\Users\\me\\a.txt").some((h) => h.id === "win-disk-path"), true, "紧邻 ':' 的盘符亦须命中")
  assert.equal(scanLeaks("盘符 D:/data/x").some((h) => h.id === "win-disk-path"), true, "正斜杠盘符仍须命中")
  assert.equal(scanLeaks('"p":"C:\\\\Users\\\\me\\\\a.txt"').some((h) => h.id === "win-disk-path"), true, "JSON 转义的真实路径仍须命中")
})

test("D1：roster 排除的维在矩阵显示 `—`（不是 0/0）；概览维度面不含排除维；skipped 不入缺失统计", () => {
  const base = fixtureResult()
  const skippedRun = { n: 1, verdict: "skipped", detail: "不在该模型面", metrics: { ttftMs: null, totalMs: null, tokPerSec: null, tokens: { prompt: null, cached: null, completion: null }, cost: null }, calls: [], summary: { textHead: "", textLen: 0, reasoningLen: 0, toolNames: [] } }
  const visionCase = { caseId: "vision.1", dim: "vision", class: "正常", runs: [{ ...skippedRun, verdict: "pass", metrics: { ttftMs: 100, totalMs: 200, tokPerSec: 10, tokens: { prompt: 10, cached: 0, completion: 2 }, cost: null } }] }
  const skipModel = { ...base.models[0], label: "fx-skip", dims: ["reasoning"], cases: [...base.models[0].cases, { ...visionCase, runs: [skippedRun] }] }
  const fullModel = { ...base.models[0], label: "fx-full", dims: ["reasoning", "vision"], cases: [...base.models[0].cases, visionCase] }
  const md = renderReport({ ...base, models: [skipModel, fullModel] })
  const matrixBlock = md.split("### 能力矩阵")[1].split("### 速度表")[0]
  assert.ok(matrixBlock.split("\n").find((l) => l.startsWith("| fx-full |")).includes("1/1"), "在面模型照常计分")
  const cells = matrixBlock.split("\n").filter((l) => l.startsWith("| fx-")).flatMap((l) => l.split("|").slice(2, -2).map((s) => s.trim()))
  assert.equal(cells.includes("0/0"), false, "矩阵单元格不得出现 0/0（应为 —）")
  const skipRow = matrixBlock.split("\n").find((l) => l.startsWith("| fx-skip |"))
  assert.equal(skipRow.split("|").map((s) => s.trim()).filter((s) => s === "—").length, 1, `排除维格应为 —（实得：${skipRow}）`)
  const overviewLine = md.split("\n").find((l) => l.startsWith("| fx-skip | deepseek |"))
  assert.ok(overviewLine.includes("推理") && !overviewLine.includes("视觉"), "概览维度面 = 有效面（不含排除维）")
  assert.equal(md.includes("#### 视觉（`vision`）"), true, "有模型在面 ⇒ 该维小节仍在")
  const md2 = renderReport({ ...base, models: [{ ...skipModel, cases: skipModel.cases.filter((c) => c.caseId === "vision.1") }] })
  const warnLine = md2.split("\n").find((l) => l.startsWith("- 数据告警："))
  assert.ok(warnLine.includes("成本缺失 run 0 个") && warnLine.includes("usage 缺失 run 0 个"), `skipped 不入缺失统计（实得：${warnLine}）`)
  assert.equal(md2.includes("- fx-skip："), false, "skipped run 不得计入成本表脚注")
})

test("AC-2 / AC-14：`--dry-run` 全链路产物断言（判官 / 复核块 + 题面入档 + 同名拒写 KD-10）", async () => {
  const label = `dryrun-${process.pid}`
  const { code, out } = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "reasoning", "--label", label])
  assert.equal(code, 0, out)
  const jsonPath = findFile(`${label}.json`)
  const mdPath = findFile(`${label}.md`)
  const data = readJson(jsonPath)
  for (const [k, t] of Object.entries({ suiteVersion: "number", label: "string", startedAt: "string", prices: "object", warnings: "object" })) {
    assert.equal(typeof data[k], t, `顶层字段 ${k} 类型不符`)
  }
  assert.equal(data.suiteVersion, 4, "SUITE_VERSION 3 → 4")
  assert.equal(data.label, label)
  assert.match(data.startedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(data.recomputed, null)
  assert.equal(`${data.run.maxTokens}|${data.run.temperature}|${typeof data.run.node}`, "4096|0|string")
  assert.equal(data.prices.asOf.length, 10)
  // 判官块（三槽元数据入档 · AC-5）：A / B / 仲裁 C 逐位 provider / model / maxTokens / 超时 / 调用 / 成本
  assert.equal(data.judge.promptVersion, 1)
  assert.equal(data.judge.frozenAtSuiteVersion, 4)
  assert.equal(data.judge.judges.length, 2)
  assert.deepEqual(Object.keys(data.judge.judges[0]).sort(), ["calls", "costCny", "host", "maxTokens", "model", "provider", "sameVendorAsTested", "temperature", "timeoutSec"])
  assert.ok(data.judge.arbiter.provider && data.judge.arbiter.model)
  assert.equal(data.judge.judges[0].model !== data.judge.judges[1].model, true, "A ≠ B（AC-13 机检）")
  assert.notEqual(data.judge.arbiter.model, data.judge.judges[0].model)
  assert.notEqual(data.judge.arbiter.model, data.judge.judges[1].model)
  assert.equal(typeof data.review.promptVersion, "number")
  const m = data.models[0]
  assert.equal(`${m.label}|${m.provider}`, "mimo-v2.6-flash|mimo")
  assert.equal(m.dims.length, 1, "--dims reasoning ⇒ 该模型面只有推理维")
  assert.equal(m.cases.length, 3, "推理维 3 例")
  for (const c of m.cases) {
    const r = c.runs[0]
    assert.ok(typeof c.caseId === "string" && typeof c.dim === "string" && typeof c.class === "string" && c.runs.length === 1)
    assert.ok(typeof c.prompt === "string" && c.prompt.length > 0, "题面入档（AC-14）")
    assert.ok(["pass", "fail", "error", "skipped"].includes(r.verdict) && typeof r.detail === "string")
    assert.ok(r.metrics.tokens.prompt > 0, "token 消耗须入档")
    assert.equal(typeof r.metrics.cost.value, "number", "成本须入档（价格已录）")
    assert.equal(r.calls[0].round, 1)
    assert.equal(typeof r.calls[0].ttftMs, "number")
    assert.equal(r.calls[0].costCny, r.metrics.cost.value)
    assert.equal(r.summary.textHead.length <= 300, true)
  }
  const judged = m.cases.find((c) => c.caseId === "reasoning.3").runs[0]
  assert.equal(judged.judge.resolution, "unanimous")
  assert.deepEqual(judged.judge.judges.map((j) => j.id), ["A", "B"], "一致 ⇒ 仅 A / B 两判（不触发仲裁）")
  assert.equal(judged.judge.judges[0].calls[0].attempt, 1)
  assert.equal(typeof judged.judge.judges[0].calls[0].at, "string", "逐调用时点入档")
  assert.equal(`${m.aggregate.total}|${typeof m.aggregate.costPerPassCny}`, "3|number")
  assert.deepEqual(data.manual, [], "`--dims reasoning` 不含 manual（§2.1-3）")
  assert.ok(Array.isArray(data.warnings))
  const md = readFileSync(mdPath, "utf8")
  assert.ok(md.includes("## 方法") && md.includes("## 结果") && md.includes("## 局限声明"), "AC-9：三段必备")
  assert.ok(md.includes("> 题面：不使用计算器"), "逐维明细题面行（AC-14）")
  assert.deepEqual(scanLeaks(md), [], "报告全文无本地绝对路径与凭据字面")
  assert.deepEqual(scanLeaks(readFileSync(jsonPath, "utf8")), [], "结果 JSON 无本地绝对路径与凭据字面")
  assert.equal(md.includes(SANDBOX), false)
  const again = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "reasoning", "--label", label])
  assert.equal(again.code, 1, "同名产物必须拒写（KD-10）")
  assert.match(again.out, /同名产物已存在/)
})

test("review.2 / §5.13 渲染面：全量 dry-run 产物含 ⟲ 标记 + 《复核翻案》 + 分歧率与仲裁计数", async () => {
  const label = `dryfull-${process.pid}`
  const { code, out } = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--label", label])
  assert.equal(code, 0, out)
  const data = readJson(findFile(`${label}.json`))
  const md = readFileSync(findFile(`${label}.md`), "utf8")
  assert.ok(data.models[0].aggregate.overturns >= 1, "夹具含翻案样本（aggregate.overturns）")
  assert.ok(data.judge.disagreements >= 1 && data.judge.arbitrations >= 1, "夹具含分歧 / 仲裁样本")
  assert.equal(data.judge.judges[0].calls > data.judge.judges[1].calls, true, "A 位含放大预算重试 ⇒ 调用数多于 B（逐位记账）")
  assert.ok(md.includes("⟲"), "矩阵 / 判定格含 ⟲ 标记")
  assert.ok(md.includes("### 复核翻案"))
  assert.ok(md.includes("不自动改判"), "翻案口径在档")
  assert.ok(md.includes("### 判官分歧"))
  assert.ok(md.includes("判官不可用"), "判官不可用成因入告警行")
  const tools3 = data.models[0].cases.find((c) => c.caseId === "tools.3").runs[0]
  assert.equal(tools3.verdict, "fail", "复核翻案不自动改判（仍 fail）")
  assert.equal(tools3.review.verdict, "overturn")
  assert.equal(data.models[0].aggregate.passed + 3 <= data.models[0].aggregate.total, true, "翻案不计入 pass 计数")
  assert.equal(DIMENSIONS.length, 8)
})

test("review.4：承接清单（§2.12 产出面）——按 caseId 归一 + 三要点 + 控制台提示；0 翻案 ⇒ 无承接段", async () => {
  const md = renderReport(priced())
  const sec = md.split("### 复核翻案")[1].split("## 关键发现")[0]
  assert.ok(sec.includes("承接清单"), "含翻案 ⇒ 尾部承接清单段")
  assert.ok(sec.includes("tools.3"), "按用例（caseId）归一")
  assert.ok(sec.includes("台账") && sec.includes("tech_todo") && sec.includes("MODEL-BENCH"), "承接落点 = 台账（tech_todo · MODEL-BENCH）")
  assert.ok(sec.includes("`SUITE_VERSION + 1`"), "处置 = 判据修复（版本 +1）")
  assert.ok(sec.includes("销账") && sec.includes("证据指针"), "销账要点与证据指针在场")
  // 0 翻案 ⇒ 无承接段（有复核记录但无翻案 / 全无复核记录两形态）
  const noOverturn = priced()
  for (const c of noOverturn.models[0].cases) for (const r of c.runs) if (r.review?.verdict === "overturn") r.review.verdict = "uphold"
  assert.equal(renderReport(noOverturn).split("### 复核翻案")[1].split("## 关键发现")[0].includes("承接清单"), false, "有复核记录但 0 翻案 ⇒ 无承接段")
  const noReview = priced()
  for (const c of noReview.models[0].cases) for (const r of c.runs) delete r.review
  const secNone = renderReport(noReview).split("### 复核翻案")[1].split("## 关键发现")[0]
  assert.ok(secNone.includes("本轮无复核翻案"), "0 记录 ⇒ 「本轮无复核翻案」保持")
  assert.equal(secNone.includes("承接清单"), false, "0 记录 ⇒ 无承接段")
  // 控制台提示（§2.11 运行提示）：dry-run 全链路（夹具 tools.3 = 翻案样本）
  const label = `review4-${process.pid}`
  const { code, out } = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--label", label])
  assert.equal(code, 0, out)
  assert.match(out, /复核 \d+ 次（uphold \d+ · 翻案 1）/, "控制台复核计数行")
  assert.ok(out.includes("翻案 ⇒ 判据修复必修，承接清单见报告《复核翻案》小节"), "控制台承接提示行")
  assert.ok(readFileSync(findFile(`${label}.md`), "utf8").includes("承接清单"), "落档报告含承接清单")
})
