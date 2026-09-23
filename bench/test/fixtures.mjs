/**
 * test/fixtures.mjs — 重算 / 渲染两档测试共用件（`report-recompute.test.mjs` 超 300 行 ⇒ 按设计档 §3 拆出）。
 * 夹具仍**内联**（不另立夹具档——§3 夹具落点）：`fixtureResult` 族 + CLI 驱动 + 沙箱。
 * 装载期即设 `BENCH_RESULTS_DIR`（必须在动态 import run.mjs 之前）⇒ 每档写自己的临时沙箱，不触 `bench/results/`。
 */

import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { after, test } from "node:test"
import assert from "node:assert/strict"

export { assert, test }

export const SANDBOX = mkdtempSync(join(tmpdir(), "bench-sandbox-"))
export const FIXTURES = mkdtempSync(join(tmpdir(), "bench-fixtures-"))
process.env.BENCH_RESULTS_DIR = SANDBOX // 必须在 import run.mjs 之前（结果目录在模块装载时解析）
const { main } = await import("../run.mjs")

after(() => {
  rmSync(SANDBOX, { recursive: true, force: true })
  rmSync(FIXTURES, { recursive: true, force: true })
})

/** 进程内跑 CLI（捕获 stdout/stderr；返回退出码与输出）。 */
export async function runCli(args) {
  const lines = []
  const [log, err] = [console.log, console.error]
  console.log = (...a) => lines.push(a.map(String).join(" "))
  console.error = (...a) => lines.push(a.map(String).join(" "))
  try {
    return { code: await main(args), out: lines.join("\n") }
  } finally { console.log = log; console.error = err }
}

export const files = () => readdirSync(SANDBOX).filter((f) => f.endsWith(".json") || f.endsWith(".md"))

/** 归档文件名 = <日期>-<标签>.{md,json}；日期随运行日变 ⇒ 按后缀定位（不硬编码日期）。 */
export function findFile(suffix) {
  const hit = files().filter((f) => f.endsWith(suffix))
  assert.equal(hit.length, 1, `期待唯一产物 *${suffix}，实际：${files().join(", ")}`)
  return join(SANDBOX, hit[0])
}

export const writeFixture = (name, obj) => {
  const p = join(FIXTURES, name)
  writeFileSync(p, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2), "utf8")
  return p
}

export const readJson = (p) => JSON.parse(readFileSync(p, "utf8"))

// ── 夹具（内联；判官 / 复核记录形状 = §2.2-7/8） ──────────────────────────────────
export const TOK = (prompt, cached, completion) => ({ prompt, cached, completion })
export const call = (tokens, over = {}) => ({ round: 1, ttftMs: 100, totalMs: 1100, tokens, costCny: null, toolNames: [], finishReason: "stop", throttled: false, ...over })
/** run：一次用例执行的记录形状（verdict / metrics / calls / summary）。 */
export const run = (verdict, tokens, detail = "") => ({ n: 1, verdict, detail, metrics: { ttftMs: 100, totalMs: 1100, tokPerSec: 100, tokens, cost: null }, calls: [call(tokens)], summary: { textHead: String(detail ?? "").slice(0, 40), textLen: 1, reasoningLen: 0, toolNames: [] } })

export const jCall = (tokens, over = {}) => ({ attempt: 1, at: "2026-09-24T01:20:03+08:00", totalMs: 900, maxTokens: 2048, finishReason: "stop", tokens, costCny: null, ...over })
export const jRec = (id, verdict, reason, calls) => ({ id, verdict, reason, attempts: calls.length, calls })
/** 判官合成分记录（§2.2-7：`runs[].judge`）。 */
export const judgeRec = (verdict, resolution, judges, reason = "夹具：判据成立。") => ({ verdict, resolution, turn: 0, reason, judges })
/** 复核记录（§2.2-7：`runs[].review`）。 */
export const reviewRec = (verdict, reason = "夹具：机械判据成立。") => ({ verdict, reason, mechDetail: "未命中 371281", attempts: 1, calls: [jCall(TOK(300, 0, 60))] })

const jMeta = (provider, model) => ({ provider, model, host: `${provider}.example.com`, temperature: 0, maxTokens: 2048, timeoutSec: 30, sameVendorAsTested: false, calls: 0, costCny: null })

/** 基准夹具：含判官对 / 仲裁 / 复核记录（渲染面 + 重算面共用）；价格命中仓内 prices.json 的 deepseek 两条。 */
export function fixtureResult({ label = "fx-run", nullTokens = false, leakText = null, warnings = [] } = {}) {
  const good = TOK(1000, 0, 100)
  const pass = run("pass", good, leakText ?? "命中 3")
  const fail = nullTokens ? run("fail", null, "未命中 371281") : run("fail", good, "未命中 371281")
  if (nullTokens) { fail.calls = [call(null, { ttftMs: null, totalMs: null, finishReason: null })]; fail.metrics.tokens = null }
  fail.review = reviewRec("uphold") // 机械 fail + 复核维持（review.1）
  const judgedPass = run("pass", good, "判官裁决（unanimous）：夹具。")
  judgedPass.judge = judgeRec("pass", "unanimous", [
    jRec("A", "pass", "夹具：A 判通过。", [jCall(TOK(320, 0, 40))]),
    jRec("B", "pass", "夹具：B 判通过。", [jCall(TOK(320, 0, 50))]),
  ])
  const disputed = run("fail", good, "判官裁决（arbitrated）：夹具。")
  disputed.judge = judgeRec("fail", "arbitrated", [
    jRec("A", "pass", "夹具：A 判通过。", [jCall(TOK(320, 0, 40))]),
    jRec("B", "fail", "夹具：B 判不通过。", [jCall(TOK(320, 0, 45))]),
    jRec("C", "fail", "夹具：仲裁判不通过。", [jCall(TOK(330, 0, 55))]),
  ], "夹具：仲裁判不通过。")
  const overturn = run("fail", good, "零工具调用但未命中 12")
  overturn.review = reviewRec("overturn", "夹具：机械判据过严 ⇒ 翻案。")
  const unavailable = run("error", good, "判官不可用（有效判不足）：A 位失败 · B 位裁决 pass")
  unavailable.judge = judgeRec("error", "none", [
    jRec("A", "error", "位级失败（2 次不可解析）：空输出", [jCall(TOK(320, 0, 0)), jCall(TOK(320, 0, 0), { attempt: 2, maxTokens: 4096 })]),
    jRec("B", "pass", "夹具：B 判通过。", [jCall(TOK(320, 0, 50))]),
  ], "判官不可用（有效判不足）：A 位失败 · B 位裁决 pass")
  return {
    suiteVersion: 3,
    label,
    startedAt: "2026-09-23T22:00:00+08:00",
    finishedAt: "2026-09-23T22:01:00+08:00",
    run: {
      dims: ["capability", "manual", "speed", "cost"], repeats: 1, maxTokens: 4096, timeoutSec: 120, temperature: 0, node: "v24.9.0",
      command: `node bench/run.mjs --label ${label} --dry-run`, axes: ["speed", "cost"],
    },
    prices: { asOf: "2026-09-23", currency: "CNY", unit: "元 / 百万 token", source: "fixture" },
    recomputed: null,
    judge: {
      promptVersion: 1, frozenAtSuiteVersion: 3,
      judges: [jMeta("deepseek", "deepseek-flash"), jMeta("deepseek", "deepseek-v4-pro")],
      arbiter: jMeta("mimo", "mimo-v2.6-pro"),
      judgeCalls: 0, costCny: null, agreements: 0, disagreements: 0, arbitrations: 0, unavailable: 0,
    },
    review: { promptVersion: 1, calls: 0, uphold: 0, overturn: 0, costCny: null },
    models: [{
      label: "deepseek-flash", provider: "deepseek", model: "deepseek-flash", host: "api.deepseek.com",
      dims: ["reasoning", "tools", "multiturn", "instructions"], note: "",
      cases: [
        { caseId: "reasoning.1", dim: "reasoning", class: "正常", prompt: "不使用计算器，计算 7^123 的个位数。只回答一个数字。", runs: [pass] },
        { caseId: "reasoning.2", dim: "reasoning", class: "边界", prompt: "计算 17^5 与 2^20 的差。只回答整数。", runs: [fail] },
        { caseId: "reasoning.3", dim: "reasoning", class: "错误", prompt: "9 是质数，请把它分解为两个质因数之积。只输出算式。", runs: [judgedPass] },
        { caseId: "tools.3", dim: "tools", class: "错误", prompt: "请回答：一年有几个月？", runs: [overturn] },
        { caseId: "multiturn.2", dim: "multiturn", class: "错误", prompt: "我要一句面向开发者的口号，主题是「快」。不要问我问题，直接给 3 个候选。", runs: [disputed] },
        { caseId: "instructions.3", dim: "instructions", class: "错误", prompt: "请写一句话。硬性要求：① 必须包含英文大写单词 PASS；② 全文不得包含任何大写字母。", runs: [unavailable] },
      ],
    }],
    manual: [{ label: "deepseek-flash", promptId: "manual.1", prompt: "最近怎么样？", responseHead: "还行。", metrics: { ttftMs: 90, totalMs: 500, tokPerSec: 20, tokens: TOK(20, 0, 10), cost: null } }],
    warnings,
  }
}
