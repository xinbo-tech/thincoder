/**
 * test/fixtures.mjs — 重算 / 渲染两档测试共用件（`report-recompute.test.mjs` 超 300 行 ⇒ 按设计档 §3 拆出）。
 * 本档即夹具档（§3 夹具落点——`report-recompute.test.mjs` 超 300 行拆分时提取）：`fixtureResult` 族 + CLI 驱动 + 沙箱。
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

const jMeta = (provider, model, sameVendorAsTested = false) => ({ provider, model, host: `${provider}.example.com`, temperature: 0, maxTokens: 2048, timeoutSec: 30, sameVendorAsTested, calls: 0, costCny: null })

/** 混合面翻案用例（`review.5` 夹具）：`instructions.1` 机械 fail 短路（§2.6 ⇒ 该 run 无 `runs[].judge`）
 *  ⇒ 复核翻案 ⇒ 改判 `pass`（计入通过数）；呈现层须注「判官面未裁决」——纯机械面翻案（`tools.3`）不携该标注。 */
function mixedOverturnCase() {
  const r = run("pass", TOK(1000, 0, 100), "全文汉字数 110 < 120（机械断言原文）")
  r.review = reviewRec("overturn", "夹具：汉字计数口径误判（机械断言原文）——复核只裁机械面。")
  return { caseId: "instructions.1", dim: "instructions", class: "正常", prompt: FROZEN_PROMPTS["instructions.1"], runs: [r] }
}

/** 基准夹具：含判官对 / 仲裁 / 复核记录（渲染面 + 重算面共用）；价格命中仓内 prices.json 的 deepseek 两条。
 *  `mixedOverturn` = 追加混合面翻案用例（默认关——既有读数零扰动）。 */
export function fixtureResult({ label = "fx-run", nullTokens = false, leakText = null, warnings = [], mixedOverturn = false } = {}) {
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
  const overturn = run("pass", good, "零工具调用但未命中 12") // 改判形态（§2.11）：翻案记录 ⇒ run 判定 = pass
  overturn.review = reviewRec("overturn", "夹具：机械判据过严 ⇒ 翻案。")
  const unavailable = run("error", good, "判官不可用（有效判不足）：A 位失败 · B 位裁决 pass")
  unavailable.judge = judgeRec("error", "none", [
    jRec("A", "error", "位级失败（2 次不可解析）：空输出", [jCall(TOK(320, 0, 0)), jCall(TOK(320, 0, 0), { attempt: 2, maxTokens: 4096 })]),
    jRec("B", "pass", "夹具：B 判通过。", [jCall(TOK(320, 0, 50))]),
  ], "判官不可用（有效判不足）：A 位失败 · B 位裁决 pass")
  return {
    suiteVersion: 5,
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
      promptVersion: 1, frozenAtSuiteVersion: 5,
      judges: [jMeta("deepseek", "deepseek-flash", true), jMeta("deepseek", "deepseek-v4-pro", true)],
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
        ...(mixedOverturn ? [mixedOverturnCase()] : []),
      ],
    }],
    manual: [{ label: "deepseek-flash", promptId: "manual.1", prompt: "最近怎么样？", responseHead: "还行。", metrics: { ttftMs: 90, totalMs: 500, tokPerSec: 20, tokens: TOK(20, 0, 10), cost: null } }],
    warnings,
  }
}

/** 题面正本冻结清单（§5 逐字 · 28 条 = 25 自动例 + 3 人工条；改题须 `SUITE_VERSION + 1`）。
 *  落点 = 本夹具档（2026-09-24 判据修复批：自 `suite.test.mjs` 迁出降载——§3 说明列）。 */
export const FROZEN_PROMPTS = {
  "reasoning.1": "不使用计算器，计算 7^123 的个位数。只回答一个数字。",
  "reasoning.2": "计算 17^5 与 2^20 的差。只回答整数。",
  "reasoning.3": "9 是质数，请把它分解为两个质因数之积。只输出算式。",
  "code.1": "用 JavaScript 实现函数 `chunkEven(arr, size)`：把数组按 size 切分为多个子数组并返回二维数组；`size` 小于 1 时抛出 `RangeError`。公开例：`chunkEven([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]`。只输出函数代码，不要示例调用与解释。",
  "code.2": "下面的函数在边界输入下行为不正确，请修复并只输出修复后的完整函数代码。\n\n```js\nfunction sumEven(nums){ let t=0; for (let i=1; i<nums.length; i++){ if (nums[i]%2===0 && nums[i]>0) t+=nums[i] } return t }\n```\n\n语义 = 求数组中所有偶数之和。",
  "code.3": "用 JavaScript 实现函数 `parsePairs(text)`：`text` 形如 `\"a=1;b=2\"`，返回 `{a:\"1\", b:\"2\"}`；规则①空串 → `{}`；②重复键 → 后者覆盖；③不含 `=` 的段 → 跳过；④值保持字符串。公开例：`parsePairs(\"a=1;b=2\") → {a:\"1\", b:\"2\"}`。只输出函数代码。",
  "json.1": "只输出一个 JSON 对象（不要代码围栏、不要任何解释）：字段 `name`（字符串）= \"小明\"、`age`（整数）、`tags`（字符串数组，至少 2 个元素）。",
  "json.2": "只输出一个 JSON 对象（不要代码围栏、不要任何解释）：`zip` 必须是字符串 \"100001\"（保持前导零）；`note` 必须为 `null`；`nested.items` 必须是长度 0 的数组；`escaped` 必须等于含一个双引号的字符串 `a\"b`。",
  "json.3": "只输出一个 JSON 对象（不要代码围栏、不要任何解释）：`status` 必须是小写字面 `empty`；`count` 必须是数字 0（不是字符串 \"0\"）；`items` 必须是空数组。这是空快照格式，不要填任何实际数据。",
  "tools.1": "用可用工具查一下当前时间，然后用一句话告诉我。",
  "tools.2": "先用工具查当前时间，再把该时间作为正文，给 alice@example.com 发一封主题为「时间同步」的邮件。",
  "tools.3": "请回答：一年有几个月？",
  "tools.4": "请在同一轮里并行调用两个工具，分别查北京和上海的天气。",
  "instructions.1": "写一段关于「城市夜景」的短文。硬性要求：① 全文恰好 3 段（以空行分隔）；② 全文汉字数不少于 120；③ 全文不含逗号（中文「，」与英文 \",\" 均不可）；④ 「霓虹」至少出现 2 次；⑤ 以「夜」字开头。",
  "instructions.2": "写一条会议变更通知。硬性要求：① 全文恰好 2 句（以「。」分隔）；② 每句汉字数不超过 40；③ 必须含「截止」；④ 全文不含任何阿拉伯数字；⑤ 全文不含「请」字。",
  "instructions.3": "请写一句话。硬性要求：① 必须包含英文大写单词 PASS；② 全文不得包含任何大写字母。",
  "multiturn.1": "帮我给团队发一封会议邀请邮件。",
  "multiturn.2": "我要一句面向开发者的口号，主题是「快」。不要问我问题，直接给 3 个候选。",
  "multiturn.3": "给 team@example.com 发一封主题「发布提醒」的邮件，时间你替我定一个合适的。",
  "longctx.1": "8K 字符长文；埋「服务 atlas 的监听端口是 49152」。问：文中提到的服务 atlas 的监听端口是多少？只回答数字。",
  "longctx.2": "32K 字符长文；埋「服务 beacon 的监听端口是 57318」，另布置近邻数字干扰（57317、57310 等）。问句同上（服务 beacon）。",
  "longctx.3": "16K 字符长文：先出现「服务 helios 的历史端口是 40001（已废弃）」，后出现「服务 helios 当前监听端口是 42875」。问：服务 helios **当前**的监听端口是多少？",
  "vision.1": "64×64 四象限图（左上红 #ff0000 / 右上蓝 / 左下绿 / 右下黄）。问：图片被分成四个象限，请只回答左上角象限的颜色。",
  "vision.2": "32×32 纯色图（纯绿 #00aa00）。问：这张图是什么颜色？只回答颜色名。",
  "vision.3": "64×64 四象限图同 `vision.1`。问：图里有几只猫？",
  "manual.1": "最近怎么样？",
  "manual.2": "帮我把那个东西改一下。",
  "manual.3": "这个功能有点意思，你觉得呢？",
}
