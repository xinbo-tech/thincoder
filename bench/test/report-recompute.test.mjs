/**
 * test/report-recompute.test.mjs — §5.10 六条用例（recompute.1–4 / report.1 / report.2）全承载 + dry-run 产物断言
 * （AC-2）+ 报告骨架 + 脱敏断言 + 离线重算零网络（AC-10）。夹具内联于本档（§3 冻结落点；文件名形态的输入落
 * 临时档，不入仓）；结果目录经 `BENCH_RESULTS_DIR` 指向本进程专属沙箱 ⇒ 不触 `bench/results/` 留档；`BENCH_PRICES`
 * 为本档「改价后重算」夹具缝。手动跑：`node --test bench/test/*.test.mjs`（不进 CI —— AC-8）。
 */

import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import { after, test } from "node:test"
import { renderReport } from "../lib/report.mjs"
import { scanLeaks } from "../lib/sanitize.mjs"

const SANDBOX = mkdtempSync(join(tmpdir(), "bench-sandbox-"))
const FIXTURES = mkdtempSync(join(tmpdir(), "bench-fixtures-"))
process.env.BENCH_RESULTS_DIR = SANDBOX // 必须在 import run.mjs 之前（结果目录在模块装载时解析）
const { main } = await import("../run.mjs")

after(() => {
  rmSync(SANDBOX, { recursive: true, force: true })
  rmSync(FIXTURES, { recursive: true, force: true })
})

// ── 夹具（内联） ───────────────────────────────────────────────────────────────
const TOK = (prompt, cached, completion) => ({ prompt, cached, completion })
const call = (tokens, over = {}) => ({ round: 1, ttftMs: 100, totalMs: 1100, tokens, costCny: null, toolNames: [], finishReason: "stop", throttled: false, ...over })
/** run：一次用例执行的记录形状（verdict / metrics / calls / summary）。 */
const run = (verdict, tokens, detail = "") => ({ n: 1, verdict, detail, metrics: { ttftMs: 100, totalMs: 1100, tokPerSec: 100, tokens, cost: null }, calls: [call(tokens)], summary: { textHead: String(detail ?? "").slice(0, 40), textLen: 1, reasoningLen: 0, toolNames: [] } })

/** 基准夹具（provider:model = deepseek:deepseek-flash —— 与仓内 prices.json 命中）。 */
function fixtureResult({ label = "fx-run", nullTokens = false, leakText = null, warnings = [] } = {}) {
  const good = TOK(1000, 0, 100)
  const pass = run("pass", good, leakText ?? "命中 3")
  const fail = nullTokens ? run("fail", null, "未命中 371281") : run("fail", good, "未命中 371281")
  if (nullTokens) { fail.calls = [call(null, { ttftMs: null, totalMs: null, finishReason: null })]; fail.metrics.tokens = null }
  return {
    suiteVersion: 1,
    label,
    startedAt: "2026-09-23T22:00:00+08:00",
    finishedAt: "2026-09-23T22:01:00+08:00",
    run: {
      dims: ["capability", "manual", "speed", "cost"], repeats: 1, maxTokens: 4096, timeoutSec: 120, temperature: 0, node: "v24.9.0",
      command: `node bench/run.mjs --label ${label} --dry-run`, axes: ["speed", "cost"],
    },
    prices: { asOf: "2026-09-23", currency: "CNY", unit: "元 / 百万 token", source: "fixture" },
    recomputed: null,
    models: [{
      label: "deepseek-flash", provider: "deepseek", model: "deepseek-flash", host: "api.deepseek.com", dims: ["reasoning"], note: "",
      cases: [
        { caseId: "reasoning.1", dim: "reasoning", class: "正常", runs: [pass] },
        { caseId: "reasoning.2", dim: "reasoning", class: "边界", runs: [fail] },
      ],
    }],
    manual: [{ label: "deepseek-flash", promptId: "manual.1", prompt: "最近怎么样？", responseHead: "还行。", metrics: { ttftMs: 90, totalMs: 500, tokPerSec: 20, tokens: TOK(20, 0, 10), cost: null } }],
    warnings,
  }
}

const writeFixture = (name, obj) => { const p = join(FIXTURES, name); writeFileSync(p, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2), "utf8"); return p }

/** 进程内跑 CLI（捕获 stdout/stderr；返回退出码与输出）。 */
async function runCli(args) {
  const lines = []
  const [log, err] = [console.log, console.error]
  console.log = (...a) => lines.push(a.map(String).join(" "))
  console.error = (...a) => lines.push(a.map(String).join(" "))
  try {
    return { code: await main(args), out: lines.join("\n") }
  } finally { console.log = log; console.error = err }
}

const files = () => readdirSync(SANDBOX).filter((f) => f.endsWith(".json") || f.endsWith(".md"))

/** 归档文件名 = <日期>-<标签>.{md,json}；日期随运行日变 ⇒ 按后缀定位（不硬编码日期）。 */
const findFile = (suffix) => {
  const hit = files().filter((f) => f.endsWith(suffix))
  assert.equal(hit.length, 1, `期待唯一产物 *${suffix}，实际：${files().join(", ")}`)
  return join(SANDBOX, hit[0])
}

test("recompute.1：夹具 JSON + 当前价格重算 → 新报告对（<原标签>-recalc）；原档字节不变", async () => {
  const from = writeFixture("fx-base.json", fixtureResult({ label: "fx-base" }))
  const before = readFileSync(from, "utf8")
  const beforeFiles = files()
  const { code, out } = await runCli(["--recompute", "--from", from])
  assert.equal(code, 0, out)
  const pair = files().filter((f) => f.includes("fx-base-recalc"))
  assert.equal(pair.length, 2, `应落 md + json 两份：${files().join(",")}`)
  const json = JSON.parse(readFileSync(findFile("fx-base-recalc.json"), "utf8"))
  assert.equal(json.label, "fx-base-recalc")
  assert.equal(json.recomputed.from, "fx-base.json", "重算产物记录来源（相对形态；不得含本地路径）")
  assert.equal(json.recomputed.from.includes(SANDBOX), false)
  assert.match(json.recomputed.at, /^\d{4}-\d{2}-\d{2}T/)
  // deepseek:deepseek-flash 高峰档 = 输入 2 / 输出 8（元/百万 token）⇒ 1000×2 + 100×8 = 2800 ⇒ ¥0.0028
  assert.equal(json.models[0].cases[0].runs[0].calls[0].costCny, 0.0028)
  assert.equal(json.models[0].cases[0].runs[0].metrics.cost.value, 0.0028)
  assert.equal(json.models[0].aggregate.costCny, 0.0056, "两条 run 合计")
  assert.equal(json.manual[0].metrics.cost.value, 0.00012, "人工 lane 成本按条单项列出")
  assert.equal(readFileSync(from, "utf8"), before, "原档不动（留档不可变）")
  assert.ok(beforeFiles.every((f) => files().includes(f)), "新产物不覆盖任何旧档")
  // 跨日重算：产物文件名 / 报告标题日期 / 附录指针必须同源（指针须指向实际产物）
  const old = fixtureResult({ label: "fx-oldday" })
  old.startedAt = "2026-09-20T10:00:00+08:00"
  old.finishedAt = "2026-09-20T10:05:00+08:00"
  const oldFrom = writeFixture("fx-oldday.json", old)
  const oldRun = await runCli(["--recompute", "--from", oldFrom])
  assert.equal(oldRun.code, 0, oldRun.out)
  const oldJson = findFile("fx-oldday-recalc.json")
  assert.ok(basename(oldJson).startsWith("2026-09-20-"), `重算产物沿用原档运行日（实得：${basename(oldJson)}）`)
  const oldMd = readFileSync(findFile("fx-oldday-recalc.md"), "utf8")
  assert.match(oldMd.split("\n")[0], /· 2026-09-20$/, "标题日期 = 原档运行日")
  const pointer = oldMd.match(/^- `bench\/results\/(\S+\.json)`/m)?.[1]
  assert.ok(pointer && existsSync(join(SANDBOX, pointer)), `附录指针须指向实际产物（指针：${pointer}）`)
})

test("recompute.2：夹具含 tokens:null 的 call → 该 run 成本 —、重算成功、warnings 保留", async () => {
  const warn = "usage 缺失：deepseek-flash（tokens/cost=null）"
  const from = writeFixture("fx-null.json", fixtureResult({ label: "fx-null", nullTokens: true, warnings: [warn] }))
  const { code, out } = await runCli(["--recompute", "--from", from])
  assert.equal(code, 0, out)
  const json = JSON.parse(readFileSync(findFile("fx-null-recalc.json"), "utf8"))
  assert.equal(json.models[0].cases[1].runs[0].metrics.cost, null, "无 usage ⇒ 成本 null（不按 0 计）")
  assert.equal(json.models[0].cases[1].runs[0].calls[0].costCny, null)
  assert.equal(json.models[0].cases[0].runs[0].metrics.cost.value, 0.0028, "同档其余 run 照常记账")
  assert.ok(json.warnings.includes(warn), "原 warnings 保留")
  const md = readFileSync(findFile("fx-null-recalc.md"), "utf8")
  assert.ok(md.includes("—"), "缺失项以 `—` 呈现（不编码为 0）")
})

test("recompute.3：损坏 JSON / 缺 calls[].tokens → 退出码 1 + 明确报错 + 不落任何档", async () => {
  const broken = writeFixture("fx-broken.json", "{ not json ")
  const missingTokens = fixtureResult({ label: "fx-missing" })
  delete missingTokens.models[0].cases[0].runs[0].calls[0].tokens
  const p2 = writeFixture("fx-missing.json", missingTokens)
  const before = files()
  const r1 = await runCli(["--recompute", "--from", broken])
  assert.equal(r1.code, 1)
  assert.match(r1.out, /解析失败/)
  assert.deepEqual(files(), before, "损坏输入不得落档")
  const r2 = await runCli(["--recompute", "--from", p2])
  assert.equal(r2.code, 1)
  assert.match(r2.out, /缺 tokens 字段/)
  assert.deepEqual(files(), before, "形状不合 ⇒ 不得落档")
})

test("recompute.1b（§3 夹具落点）：改价后的 prices.json 夹具 ⇒ 成本列随新价变化（零调模型）", async () => {
  const from = writeFixture("fx-price.json", fixtureResult({ label: "fx-price" }))
  const r1 = await runCli(["--recompute", "--from", from])
  assert.equal(r1.code, 0, r1.out)
  const baseText = readFileSync(findFile("fx-price-recalc.json"), "utf8")
  const base = JSON.parse(baseText)
  assert.equal(base.models[0].cases[0].runs[0].calls[0].costCny, 0.0028, "仓内当前价表：输入 2 / 输出 8")
  // 改价后的 prices.json（峰值 2 倍：输入 4 / 输出 16 / 缓存 0.08）
  const changed = writeFixture("prices.changed.json", {
    asOf: "2026-09-24", currency: "CNY", unit: "元 / 百万 token", source: "fixture（改价）",
    entries: [{ match: "deepseek:deepseek-flash", cachedInput: 0.08, input: 4, output: 16 }],
  })
  process.env.BENCH_PRICES = changed
  let r2
  try { r2 = await runCli(["--recompute", "--from", from, "--label", "fx-price-newprices"]) } finally { delete process.env.BENCH_PRICES }
  assert.equal(r2.code, 0, r2.out)
  const updated = JSON.parse(readFileSync(findFile("fx-price-newprices.json"), "utf8"))
  assert.equal(updated.models[0].cases[0].runs[0].calls[0].costCny, 0.0056, "成本列随新价变化（2×）")
  assert.equal(updated.models[0].aggregate.costCny, 0.0112)
  assert.equal(updated.prices.asOf, "2026-09-24", "重算产物记录新价表 asOf")
  assert.equal(updated.manual[0].metrics.cost.value, 0.00024, "人工 lane 单项成本同步新价")
  assert.equal(readFileSync(findFile("fx-price-recalc.json"), "utf8"), baseText, "改价重算不动原产物（留档不可变）")
})

test("D1：roster 排除的维在矩阵显示 `—`（不是 0/0）；概览维度面不含排除维", () => {
  const base = fixtureResult()
  const skippedRun = { n: 1, verdict: "skipped", detail: "不在该模型面", metrics: { ttftMs: null, totalMs: null, tokPerSec: null, tokens: { prompt: null, cached: null, completion: null }, cost: null }, calls: [], summary: { textHead: "", textLen: 0, reasoningLen: 0, toolNames: [] } }
  const visionCase = { caseId: "vision.1", dim: "vision", class: "正常", runs: [run("pass", TOK(400, 0, 2), "红色")] }
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
  // 数据告警不得把 skipped 计入成本缺失（§2.3-5④）
  const md2 = renderReport({ ...base, models: [{ ...skipModel, cases: skipModel.cases.filter((c) => c.caseId === "vision.1") }] })
  const warnLine = md2.split("\n").find((l) => l.startsWith("- 数据告警："))
  assert.ok(warnLine.includes("成本缺失 run 0 个") && warnLine.includes("usage 缺失 run 0 个"), `skipped 不入缺失统计（实得：${warnLine}）`)
  assert.equal(md2.includes("- fx-skip："), false, "skipped run 不得计入成本表脚注")
})

test("F3 回归：sanitize 只认盘符路径——URL 是正控（不得命中）", () => {
  assert.deepEqual(scanLeaks("参考 https://example.com/a?x=1 与 http://localhost:3000/"), [], "URL 不得被误判为盘符路径")
  assert.deepEqual(scanLeaks("file:///etc/passwd 与 ftp://host/x"), [], "其他 scheme 同判")
  assert.equal(scanLeaks("路径:C:\\Users\\me\\a.txt").some((h) => h.id === "win-disk-path"), true, "紧邻 ':' 的盘符亦须命中")
  assert.equal(scanLeaks("盘符 D:/data/x").some((h) => h.id === "win-disk-path"), true, "正斜杠盘符仍须命中")
})

test("report.1：夹具渲染 → 七段骨架齐 + 三表 + 逐维明细 + 人工判读在位；轴-only ⇒ 只出速度/成本表", () => {
  const md = renderReport(fixtureResult())
  for (const section of ["## 概览", "## 方法", "## 结果", "### 能力矩阵", "### 速度表", "### 成本表", "### 逐维明细", "### 人工判读", "## 关键发现", "## 局限声明", "## 附录", "### 复跑命令", "### 结果指针"]) {
    assert.ok(md.includes(section), `缺段：${section}`)
  }
  assert.match(md, /^# 模型基准报告 · fx-run · 2026-09-23/m)
  assert.ok(md.includes("| deepseek-flash | 1/2 |"), "能力矩阵 = 通过用例数/该维用例数")
  assert.ok(md.includes("manual.1"), "人工判读逐条并列题面")
  assert.ok(md.includes("node bench/run.mjs --recompute --from bench/results/2026-09-23-fx-run.json"), "附录给复跑命令（相对路径形态）")
  // 轴选择（§2.1-1）：`--dims speed,cost` = 只出速度/成本表
  const base = fixtureResult()
  const axesOnly = renderReport({ ...base, run: { ...base.run, dims: ["speed", "cost"], axes: ["speed", "cost"] } })
  assert.ok(axesOnly.includes("### 速度表") && axesOnly.includes("### 成本表"), "已选轴必须在位")
  for (const absent of ["### 能力矩阵", "### 逐维明细", "### 人工判读", "- 能力通过率："]) {
    assert.equal(axesOnly.includes(absent), false, `未选能力轴 ⇒ 不得出现：${absent}`)
  }
  assert.ok(axesOnly.includes("## 概览") && axesOnly.includes("## 局限声明"), "骨架段仍齐")
})

test("report.2：夹具含 `C:\\\\Users\\\\someone\\\\…` 与 `sk-…` 字面 → sanitize 拒写（退出码 1）+ 指出命中位置", async () => {
  const leak = "路径 C:\\Users\\someone\\notes.txt 与密钥 sk-ABCDEFGH12345678"
  const from = writeFixture("fx-leak.json", fixtureResult({ label: "fx-leak", leakText: leak }))
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

test("recompute.4（AC-10）：毒化 globalThis.fetch 后重算全流程成功 ⇒ 零网络调用的机检判据", async () => {
  const from = writeFixture("fx-net.json", fixtureResult({ label: "fx-net" }))
  let code
  let out
  const orig = globalThis.fetch
  let calls = 0
  globalThis.fetch = () => { calls++; throw new Error("network disabled by test") }
  try { ({ code, out } = await runCli(["--recompute", "--from", from])) } finally { globalThis.fetch = orig }
  assert.equal(code, 0, out)
  assert.equal(calls, 0, "零 API 调用（fetch 一次都不得发生）")
  assert.ok(files().some((f) => f.endsWith("fx-net-recalc.json")))
})

test("AC-2：`--dry-run` 全链路产物断言（JSON 字段齐 + md 成对 + 无泄漏 + 同名拒写 KD-10）", async () => {
  const label = `dryrun-${process.pid}`
  const { code, out } = await runCli(["--dry-run", "--models", "deepseek-flash", "--dims", "reasoning", "--label", label])
  assert.equal(code, 0, out)
  const jsonPath = findFile(`${label}.json`)
  const mdPath = findFile(`${label}.md`)
  const data = JSON.parse(readFileSync(jsonPath, "utf8"))
  for (const [k, t] of Object.entries({ suiteVersion: "number", label: "string", startedAt: "string", prices: "object", warnings: "object" })) {
    assert.equal(typeof data[k], t, `顶层字段 ${k} 类型不符`)
  }
  assert.equal(data.label, label)
  assert.match(data.startedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(data.recomputed, null)
  assert.equal(`${data.run.maxTokens}|${data.run.temperature}|${typeof data.run.node}`, "4096|0|string")
  assert.equal(data.prices.asOf.length, 10)
  const m = data.models[0]
  assert.equal(`${m.label}|${m.provider}`, "deepseek-flash|deepseek")
  assert.equal(m.dims.length, 1, "--dims reasoning ⇒ 该模型面只有推理维")
  assert.equal(m.cases.length, 3, "推理维 3 例")
  for (const c of m.cases) {
    const r = c.runs[0]
    assert.ok(typeof c.caseId === "string" && typeof c.dim === "string" && typeof c.class === "string" && c.runs.length === 1)
    assert.ok(["pass", "fail", "error", "skipped"].includes(r.verdict) && typeof r.detail === "string")
    assert.ok(r.metrics.tokens.prompt > 0, "token 消耗须入档")
    assert.equal(typeof r.metrics.cost.value, "number", "成本须入档（价格已录）")
    assert.equal(r.calls[0].round, 1)
    assert.equal(typeof r.calls[0].ttftMs, "number")
    assert.equal(r.calls[0].costCny, r.metrics.cost.value)
    assert.equal(r.summary.textHead.length <= 300, true)
  }
  assert.equal(`${m.aggregate.total}|${typeof m.aggregate.costPerPassCny}`, "3|number")
  assert.deepEqual(data.manual, [], "`--dims reasoning` 不含 manual（§2.1-3）")
  assert.ok(Array.isArray(data.warnings))
  const md = readFileSync(mdPath, "utf8")
  assert.ok(md.includes("## 方法") && md.includes("## 结果") && md.includes("## 局限声明"), "AC-9：三段必备")
  assert.deepEqual(scanLeaks(md), [], "报告全文无本地绝对路径与凭据字面")
  assert.deepEqual(scanLeaks(readFileSync(jsonPath, "utf8")), [], "结果 JSON 无本地绝对路径与凭据字面")
  assert.equal(md.includes(SANDBOX), false)
  const again = await runCli(["--dry-run", "--models", "deepseek-flash", "--dims", "reasoning", "--label", label])
  assert.equal(again.code, 1, "同名产物必须拒写（KD-10）")
  assert.match(again.out, /同名产物已存在/)
  // 轴-only（§2.1-1 / §2.1-3）：只跑 8 自动维，不跑人工 lane；报告只出速度/成本表
  const axesLabel = `axes-${process.pid}`
  const axesRun = await runCli(["--dry-run", "--models", "deepseek-flash", "--dims", "speed,cost", "--label", axesLabel])
  assert.equal(axesRun.code, 0, axesRun.out)
  const axesData = JSON.parse(readFileSync(findFile(`${axesLabel}.json`), "utf8"))
  assert.deepEqual(axesData.manual, [], "轴-only 不跑人工 lane（manual 需显式点名或缺省全跑）")
  assert.equal(axesData.models[0].cases.length, 25, "8 自动维 25 例全跑")
  const axesMd = readFileSync(findFile(`${axesLabel}.md`), "utf8")
  assert.equal(axesMd.includes("### 人工判读"), false)
  assert.ok(axesMd.includes("### 速度表") && axesMd.includes("### 成本表"))
})
