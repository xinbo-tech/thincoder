/**
 * test/judge-fallback.test.mjs — 替代判级联 / 终局 / 补判面用例（§5.13 `judge.14–18` / `rejudge.1`）。
 *
 * 测试策略（§5.13 冻结）：**不依赖真网络**——级联面走桩传输（`fixtureSlotTransport` 逐位脚本回放；**级内单发**
 * ⇒ 逐发对应一级：脚本第 n 发 = 该位第 n 级）；补判面走注入传输（定点重取素材）+ 桩判官；夹具内联。
 * 手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI —— AC-8）。
 */

import { readFileSync } from "node:fs"
import { applyJudgeCosts } from "../lib/prices.mjs"
import { judgeWithPair } from "../lib/judge-fallback.mjs"
import { fixtureSlotTransport, fixtureTransport } from "../lib/client.mjs"
import { rejudgeMain } from "../lib/rejudge.mjs"
import {
  FIXTURES, FROZEN_PROMPTS, TOK, assert, files, findFile, jCall, jMeta, jRec, readJson, run, test, writeFixture,
} from "./fixtures.mjs"

const v = (verdict, reason = "夹具理由") => JSON.stringify({ verdict, reason })
const sel = (...verdicts) => verdicts.map((verdict) => ({ text: v(verdict) }))
const slotOf = (id, model, provider = "p") => ({ id, provider, model, maxTokens: 2048, timeoutSec: 30, host: null, sameVendorAsTested: false })
const SLOTS = [slotOf("A", "m-a"), slotOf("B", "m-b"), slotOf("C", "m-c")]
const POOL = [slotOf("替代级 1", "m-f1"), slotOf("替代级 2", "m-f2"), slotOf("替代级 3", "m-f3")]
const DECL = { turn: 0, rubric: "夹具判据条文。" }

/** 级联面对（桩传输 + 池）；`fallbacks` 可覆写（跳过规则 / 穷尽面用）。 */
const pair = (scripts, { slots = SLOTS, fallbacks = POOL } = {}) => judgeWithPair({
  decl: DECL, material: "夹具模型回答", slots, fallbacks, transport: fixtureSlotTransport(scripts), providers: [],
})
const judgeOf = (r, id) => r.judges.find((j) => j.id === id)
/** 级联面账目（§2.2-16）：以 `applyJudgeCosts` 生产同源聚合两计数与池内逐项启用次数。 */
const accountsOf = (r, fallbacks = POOL) => {
  const data = {
    judge: { judges: [{ provider: "p", model: "m-a" }, { provider: "p", model: "m-b" }], arbiter: { provider: "p", model: "m-c" }, fallbacks: fallbacks.map((s) => ({ provider: s.provider, model: s.model })) },
    review: {},
    models: [{ cases: [{ runs: [{ judge: r }] }] }],
  }
  applyJudgeCosts(data, { asOf: "2026-01-01", currency: "CNY", entries: [] }, [])
  return data.judge
}

test("judge.14：位级失败 ⇒ 替代级 1 补判（B 原位超时）⇒ 双判合成 unanimous + substitutes 在档 + calls[].level", async () => {
  const r = await pair({ A: sel("pass"), B: [{ fail: "throw", name: "TimeoutError", message: "夹具：判官超时" }, sel("pass")[0]] })
  assert.equal(r.verdict, "pass")
  assert.equal(r.resolution, "unanimous", "B 位替代补判成功 ⇒ 双判同向合成分")
  assert.equal(r.reason, "夹具理由", "一致 ⇒ 定判位理由 = A 位理由")
  const b = judgeOf(r, "B")
  assert.deepEqual(b.substitutes.map((s) => [s.level, s.provider, s.model]), [[2, "p", "m-f1"]], "替代级 1（池序第 1 项）⇒ 记档 level 2（级链基址）")
  assert.match(b.substitutes[0].cause, /位级失败：TimeoutError/, "cause = 上一级失败摘要")
  assert.equal(b.attempts, 2, "attempts = calls[] 条数 = 实际发起级数")
  assert.deepEqual(b.calls.map((c) => c.level), [undefined, 2], "level 1（原位）不写 · 替代级携 2（缺省语义）")
  assert.equal(typeof b.calls[0].totalMs, "number", "失败级 calls[0].totalMs 为数字（失败尝试照记——KD-47① / timing.2 ②）")
  assert.equal(b.calls.every((c) => c.attempt === 1), true, "级内单发 ⇒ attempt 恒 1")
  assert.equal(b.calls[0].maxTokens, 2048, "预算 = 该级配置值（无放大分支——§2.10.1）")
  const models = [judgeOf(r, "A").substitutes, b.substitutes].flatMap((x) => x ?? []).map((s) => s.model)
  assert.equal(models.every((m) => ![SLOTS[0].model, SLOTS[1].model, SLOTS[2].model].includes(m)), true, "替代 ≠ 原位三槽身份（运行期占用）")
  const acc = accountsOf(r)
  assert.equal(acc.substitutions, 1, "substitutions = 替代级启用次数")
  assert.deepEqual(acc.fallbacks.map((f) => f.calls), [1, 0, 0], "池内逐项启用次数（实际身份键记账）")
  assert.deepEqual(acc.judges.map((j) => j.calls), [1, 1], "原位槽 calls = 原位级调用数（替代级计池内项）")
  assert.equal(acc.judgeCalls, 3, "judgeCalls = Σ（原位三槽 + 池内逐项）")
})

test("judge.15：逐级迭代 + 身份跳过（A 位两级皆败 ⇒ 替代级 2 成功；池内他占用项不入记录 ⇒ 稀疏级号）", async () => {
  // A：原位不可解析（单发即败）⇒ 替代级 1 空输出（再败）⇒ 替代级 2 成功；B：原位成功
  const r = await pair({ A: [{ text: "" }, { text: "" }, sel("pass")[0]], B: sel("pass") })
  assert.equal(r.verdict, "pass")
  assert.equal(r.resolution, "unanimous")
  const a = judgeOf(r, "A")
  assert.deepEqual(a.substitutes.map((s) => [s.level, s.model]), [[2, "m-f1"], [3, "m-f2"]], "替代级 1 / 2 ⇒ level 2 / 3；cause 逐级")
  assert.match(a.substitutes[1].cause, /位级失败/, "逐级 cause 在档")
  assert.deepEqual(a.calls.map((c) => c.level), [undefined, 2, 3])
  assert.equal(a.attempts, 3)
  assert.equal(accountsOf(r).substitutions, 2)
  // 身份跳过（§2.10.1 运行期占用）：池首项 = 原位 C 的模型 ⇒ 跳过、不入记录（级号仍是池项固有 ⇒ 稀疏）
  const skipped = await pair({ A: [{ text: "" }, sel("pass")[0]], B: sel("pass") }, { fallbacks: [slotOf("替代级 1", "m-c"), ...POOL] })
  assert.deepEqual(judgeOf(skipped, "A").substitutes.map((s) => [s.level, s.model]), [[3, "m-f1"]], "被占用项跳过：无 level 2 条目（不入 substitutes / calls）")
  assert.deepEqual(judgeOf(skipped, "A").calls.map((c) => c.level), [undefined, 3])
})

test("judge.16：恰一位有效 ⇒ 单判定判（resolution = single）+ 失败位逐级留证 + singleJudged 计数", async () => {
  const dead = [{ text: "" }, { text: "" }, { text: "" }, { text: "" }] // 原位 + 池 3 项：级链穷尽
  const r = await pair({ A: dead, B: sel("fail") })
  assert.equal(r.verdict, "fail", "run 判定 = 该有效判（B 位）")
  assert.equal(r.resolution, "single", "单判定判：恰一位有效 ⇒ `resolution = single`")
  assert.equal(r.reason, "夹具理由", "单判 ⇒ 定判位理由 = 该有效位理由")
  const a = judgeOf(r, "A")
  assert.equal(a.verdict, "error")
  assert.match(a.reason, /（级链穷尽）/, "穷尽成因在档（逐级留证）")
  assert.deepEqual(a.substitutes.map((s) => s.level), [2, 3, 4], "全池调用留证（池长 3 ⇒ 级 2 / 3 / 4）")
  const acc = accountsOf(r)
  assert.equal(acc.singleJudged, 1, "singleJudged = 单判定判 run 数")
  assert.equal(acc.substitutions, 3)
})

test("judge.17：零有效判（A / B 两位级链皆穷尽）⇒ 物理边界 error（有效判不足）+ 全池留证 + 不可用计数", async () => {
  const dead = [{ text: "" }, { text: "" }, { text: "" }, { text: "" }]
  const r = await pair({ A: dead, B: dead })
  assert.equal(r.verdict, "error")
  assert.equal(r.resolution, "none")
  assert.match(r.reason, /^判官不可用（有效判不足）：/, "detail 前缀（成因括注）")
  const subs = r.judges.flatMap((j) => j.substitutes ?? [])
  assert.equal(subs.length, 3, "全池调用留证（逐位 substitutes 尽列——池 3 项无重复）")
  assert.equal(new Set(subs.map((s) => s.model)).size, 3, "替代 ≠ 彼此（池内逐项各归一位）")
  assert.equal(r.judges.every((j) => j.verdict === "error" && j.reason.endsWith("（级链穷尽）")), true)
  const acc = accountsOf(r)
  assert.equal(acc.unavailable, 1)
  assert.equal(acc.substitutions, 3)
})

test("judge.18：A / B 相异 + 仲裁 C 级链穷尽 ⇒ error（分歧未决）+ 三方（含替代级）留证 + 分歧计数", async () => {
  const r = await pair({ A: sel("pass"), B: sel("fail"), C: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }] })
  assert.equal(r.verdict, "error")
  assert.equal(r.resolution, "none")
  assert.match(r.reason, /^判官不可用（分歧未决）：/)
  assert.deepEqual(r.judges.map((j) => j.id), ["A", "B", "C"], "三方留证")
  assert.deepEqual(judgeOf(r, "C").substitutes.map((s) => s.level), [2, 3, 4], "C 位替代级尽列")
  const acc = accountsOf(r)
  assert.equal(acc.disagreements, 1)
  assert.equal(acc.arbitrations, 0, "无多数 ⇒ 不入 arbitrated 计数")
  assert.equal(acc.unavailable, 1)
})

// ── rejudge.1（§2.14 补判通道）：判官面 error run 定点收正——零网络（注入传输 + 桩判官） ──────────────
const JUDGE_STUB = {
  version: 1,
  frozenAtSuiteVersion: 7,
  judges: [
    { provider: "deepseek", model: "deepseek-flash", maxTokens: 8192, timeoutSec: 30 },
    { provider: "glm", model: "glm-5.3-flashx", maxTokens: 8192, timeoutSec: 30 },
  ],
  arbiter: { provider: "deepseek", model: "deepseek-v4-pro", maxTokens: 8192, timeoutSec: 30 },
  fallbacks: [{ provider: "mimo", model: "mimo-v2.6-pro", maxTokens: 8192, timeoutSec: 30 }],
}
/** 桩 provider（judge.json 五个渠道名齐备——预检枚举面单源；真 spec 表命中）。 */
const STUB_PROVIDERS = ["deepseek", "glm", "mimo", "qwen", "ark"].map((name) => ({ name, baseURL: `https://${name}.example.com`, apiKey: "stub" }))
const answer = (text, completion = 12) => ({ text, tokens: { prompt: 30, cached: 0, completion }, ttftMs: 100, totalMs: 400 })

/** 结果档夹具（§2.14）：`reasoning.3` = 判官面 error run（补判对象）· `tools.1` = 被测侧 error run（不入列——裁点 ⑥）。 */
function archiveOf(label) {
  const judgeErr = {
    verdict: "error", resolution: "none", turn: 0, reason: "判官不可用（有效判不足）：A 位失败 · B 位失败",
    judges: [
      jRec("A", "error", "位级失败：空输出（级链穷尽）", [jCall(TOK(320, 0, 0), { finishReason: null })]),
      jRec("B", "error", "位级失败：空输出（级链穷尽）", [jCall(TOK(320, 0, 0), { finishReason: null })]),
    ],
  }
  const judgeErrRun = { ...run("error", TOK(60, 0, 10), "判官不可用（有效判不足）：…"), judge: judgeErr }
  return {
    suiteVersion: 6,
    label,
    startedAt: "2026-09-24T10:00:00+08:00",
    finishedAt: "2026-09-24T10:05:00+08:00",
    run: { dims: ["capability"], repeats: 1, maxTokens: 4096, timeoutSec: 120, temperature: 0, node: "v24.9.0", command: `node bench/run.mjs --label ${label}`, axes: [] },
    prices: { asOf: "2026-09-23", currency: "CNY", unit: "元 / 百万 token", source: "fixture" },
    recomputed: null,
    judge: {
      promptVersion: 1, frozenAtSuiteVersion: 6,
      judges: [jMeta("deepseek", "deepseek-flash"), jMeta("glm", "glm-5.3-flashx")], arbiter: jMeta("deepseek", "deepseek-v4-pro"),
      judgeCalls: 2, costCny: null, agreements: 0, disagreements: 0, arbitrations: 0, unavailable: 1,
    },
    review: { promptVersion: 1, calls: 0, uphold: 0, overturn: 0, costCny: null },
    models: [{
      label: "deepseek-flash", provider: "deepseek", model: "deepseek-flash", host: "api.deepseek.com",
      temperature: 0, reasoningEffort: "high", reasoningEffortFrom: "models.json", dims: ["reasoning", "tools"], note: "",
      cases: [
        { caseId: "reasoning.3", dim: "reasoning", class: "错误", prompt: FROZEN_PROMPTS["reasoning.3"], runs: [judgeErrRun] },
        { caseId: "tools.1", dim: "tools", class: "正常", prompt: FROZEN_PROMPTS["tools.1"], runs: [run("error", null, "接口错误：TimeoutError: 夹具超时")] },
      ],
    }],
    manual: [],
    warnings: [],
  }
}

test("rejudge.1：补判通道（① 判定替换 ② 被测侧 error 不入列 ③ 原档零改 ④ 缺省标签 ⑤ 零对象 ⑥ 重取后仍失败）", async () => {
  process.env.BENCH_JUDGE = writeFixture(`judge-rejudge-${process.pid}.json`, JUDGE_STUB)
  try {
    // ① ③ ④：判官面 error run ⇒ 定点重取素材 + 级联补判 ⇒ 新对（原档逐字节零改）
    const label = `rj-a-${process.pid}`
    const src = writeFixture(`${label}.json`, archiveOf(label))
    const before = readFileSync(src, "utf8")
    const mechBefore = JSON.stringify(JSON.parse(before).models[0].cases[1].runs[0])
    const code = await rejudgeMain({ from: src }, {
      providers: STUB_PROVIDERS,
      transport: fixtureTransport([answer("9 不是质数，不能分解为两个质因数之积。")]),
      judgeTransport: fixtureSlotTransport({ A: sel("pass"), B: sel("pass") }),
    })
    assert.equal(code, 0)
    const out = readJson(findFile(`${label}-rejudged.json`)) // ④ 缺省标签 = <原标签>-rejudged
    assert.equal(out.suiteVersion, 7, "补判对 = 补判时代际（原档仍标 6——不改写）")
    assert.deepEqual(out.rejudged.runs.map((r) => [r.caseId, r.was, r.now]), [["reasoning.3", "error", "pass"]], "溯源块逐 run was → now")
    assert.equal(out.rejudged.from, `${label}.json`)
    const fresh = out.models[0].cases[0].runs[0]
    assert.equal(fresh.verdict, "pass", "① 判定替换（新素材 + 级联判分）")
    assert.equal(fresh.judge.resolution, "unanimous")
    assert.equal(fresh.detail.includes("判官不可用"), false, "新素材 + 级联补判 ⇒ detail 随判定同源替换")
    assert.equal(out.judge.fallbacks.length, 1, "代际自述面随补判时现行配置（池快照）")
    assert.equal(out.models[0].cases[1].runs[0].verdict, "error", "② 被测侧 error run 不入列（如实保留）")
    assert.equal(JSON.stringify(out.models[0].cases[1].runs[0]), mechBefore, "② 反例控制：该 run 记录逐字节未改")
    assert.equal(out.rejudged.runs.some((r) => r.caseId === "tools.1"), false, "② 不入补判列")
    assert.equal(readFileSync(src, "utf8"), before, "③ 原档逐字节零改（留档不可变 · KD-10）")
    // ⑤ 零对象腿：无判官面 error run ⇒ 明示 + 不落档 + 0
    const zeroLabel = `rj-zero-${process.pid}`
    const zero = archiveOf(zeroLabel)
    zero.models[0].cases[0].runs = [run("pass", TOK(60, 0, 10), "命中 3")]
    const count = files().length
    const zeroCode = await rejudgeMain({ from: writeFixture(`${zeroLabel}.json`, zero) }, { providers: STUB_PROVIDERS, transport: fixtureTransport([]), judgeTransport: fixtureSlotTransport({}) })
    assert.equal(zeroCode, 0, "⑤ 零对象 ⇒ 退出码 0")
    assert.equal(files().length, count, "⑤ 零对象 ⇒ 不落档")
    // ⑥ 重取后仍失败（全池不可达）⇒ 如实保留 error（不承诺突破物理边界）
    const label2 = `rj-b-${process.pid}`
    const code2 = await rejudgeMain({ from: writeFixture(`${label2}.json`, archiveOf(label2)) }, {
      providers: STUB_PROVIDERS,
      transport: fixtureTransport([answer("9 不是质数。", 8)]),
      judgeTransport: fixtureSlotTransport({ A: [{ text: "" }, { text: "" }], B: [{ text: "" }, { text: "" }] }), // 原位 + 池 1 项皆不可解析
    })
    assert.equal(code2, 0, "⑥ 全灭仍取 0（补判 = 定点收正——§2.1-8）")
    const out2 = readJson(findFile(`${label2}-rejudged.json`))
    assert.equal(out2.models[0].cases[0].runs[0].verdict, "error", "⑥ 重取后仍失败 ⇒ 如实保留 error")
    assert.equal(out2.rejudged.runs[0].now, "error")
    // 基建闸（§2.14 退出码 1 · 不落档）：档形不符 schema / provider 缺 ⇒ 抛错
    const alien = archiveOf(`rj-alien-${process.pid}`)
    alien.models[0].provider = "tenant-x"
    await assert.rejects(() => rejudgeMain({ from: writeFixture(`rj-bad-${process.pid}.json`, { models: "nope" }) }, { providers: STUB_PROVIDERS }), /结果 JSON 缺 models/, "档形闸：不符 schema ⇒ 1")
    await assert.rejects(() => rejudgeMain({ from: writeFixture(`rj-alien-${process.pid}.json`, alien) }, { providers: STUB_PROVIDERS }), /补判对象的 provider 不在用户 config.*tenant-x/, "被测 provider 缺 ⇒ 1")
  } finally {
    delete process.env.BENCH_JUDGE
  }
})
