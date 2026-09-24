/**
 * test/judge.test.mjs — 判官 / 复核机制面用例（§5.13 `judge.1–12` / `review.1–3`）。
 *
 * 测试策略（§5.13 冻结）：**不依赖真网络**——一切判官 / 复核调用走桩传输（`fixtureSlotTransport`，逐位脚本回放；
 * 与 `--dry-run` 夹具同一机制）；夹具内联；复核三态（uphold 维持 / overturn 改判 / error 维持）与题面入档为必测项。手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI —— AC-8）。
 */

import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { CASES } from "../cases/index.mjs"
import { judgeResult } from "../lib/grade.mjs"
import { reviewRun, callSlot, judgeQuestion, judgeWithPair, loadJudgeConfig, resolveJudgeSlots, shouldReview, turnMaterial } from "../lib/judge.mjs"
import { fixtureSlotTransport } from "../lib/client.mjs"
import { applyJudgeCosts } from "../lib/prices.mjs"
import { FIXTURES, assert, findFile, readJson, runCli, test } from "./fixtures.mjs"

const v = (verdict, reason = "夹具理由") => JSON.stringify({ verdict, reason })
const sel = (...verdicts) => verdicts.map((verdict) => ({ text: v(verdict) }))
const slotOf = (id, model, provider = "p") => ({ id, provider, model, maxTokens: 2048, timeoutSec: 30, host: null, sameVendorAsTested: false })
const SLOTS = [slotOf("A", "m-a"), slotOf("B", "m-b"), slotOf("C", "m-c")]
const DECL = { turn: 0, rubric: "夹具判据条文。" }

const pair = (scripts, slots = SLOTS) => judgeWithPair({
  decl: DECL,
  material: "夹具模型回答",
  slots,
  transport: fixtureSlotTransport(scripts),
  providers: [],
})

test("judge.1：桩传输 A / B 同向 ⇒ 合成分该向 + `runs[].judge` 记录齐（verdict / reason / turn / attempts / calls）", async () => {
  const r = await pair({ A: sel("pass"), B: sel("pass") })
  assert.equal(r.verdict, "pass")
  assert.equal(r.resolution, "unanimous")
  assert.equal(r.turn, 0)
  assert.equal(r.reason, "夹具理由", "一致 ⇒ 定判位理由 = A 位理由")
  assert.deepEqual(r.judges.map((j) => j.id), ["A", "B"])
  for (const j of r.judges) {
    assert.equal(j.verdict, "pass")
    assert.equal(j.attempts, 1)
    assert.equal(typeof j.calls[0].at, "string", "逐调用时点（§2.2-8）")
    assert.equal(j.calls[0].attempt, 1)
    assert.equal(j.calls[0].maxTokens, 2048)
    assert.equal(j.calls[0].costCny, null, "成本由 prices.mjs 后置填充")
  }
})

test("judge.2：首次空输出 ⇒ 放大预算重试一次（×2 · 上限 8192）；两次均入账；判定取二次", async () => {
  const r = await pair({ A: [{ text: "" }, { text: v("fail", "二次成功") }], B: sel("pass") })
  assert.equal(r.verdict, "error", "A fail / B pass 相异须仲裁——此处无 C 脚本 ⇒ C 位失败")
  const a = r.judges.find((j) => j.id === "A")
  assert.equal(a.attempts, 2)
  assert.equal(a.calls[0].maxTokens, 2048)
  assert.equal(a.calls[1].maxTokens, 4096, "放大预算 = 配置值 ×2")
  assert.equal(a.verdict, "fail", "判定取二次裁决")
  const capped = await callSlot({ slot: slotOf("A", "m-a", "p"), messages: [], transport: fixtureSlotTransport({ A: [{ text: "" }, { text: v("pass") }] }), providers: [] })
  assert.equal(capped.verdict, "pass")
  const big = await callSlot({ slot: { ...slotOf("A", "m-a", "p"), maxTokens: 8192 }, messages: [], transport: fixtureSlotTransport({ A: [{ text: "" }, { text: v("pass") }] }), providers: [] })
  assert.equal(big.calls[1].maxTokens, 8192, "放大预算上限 = 8192")
  assert.equal(big.verdict, "pass")
  // `finishReason=length`（截断）视同不可解析 ⇒ 同样放大预算重试
  const truncated = await pair({ A: [{ text: "{\"verdict\"", finishReason: "length" }, { text: v("pass", "重试成功") }], B: sel("pass") })
  assert.equal(truncated.verdict, "pass")
  assert.equal(truncated.judges.find((j) => j.id === "A").attempts, 2)
  // 严格解析：围栏 / 多余键外的散文 / 枚举外取值均不可过
  for (const badText of ["```json\n{\"verdict\":\"pass\"}\n```", "结论：pass", JSON.stringify({ verdict: "ok" }), JSON.stringify({ verdict: "pass" }) + "（补充说明）"]) {
    const r = await callSlot({ slot: slotOf("A", "m-a", "p"), messages: [], transport: fixtureSlotTransport({ A: [{ text: badText }, { text: badText }] }), providers: [] })
    assert.equal(r.verdict, "error", `严格解析须拒：${badText}`)
  }
  const extraKeys = await callSlot({ slot: slotOf("A", "m-a", "p"), messages: [], transport: fixtureSlotTransport({ A: [{ text: JSON.stringify({ verdict: "pass", reason: "x", confidence: 0.9 }) }] }), providers: [] })
  assert.equal(extraKeys.verdict, "pass", "多余键忽略（§2.10.1）")
})

test("judge.3：两次均不可解析 ⇒ 该位 error ⇒ run error（detail 前缀「判官不可用」；不得回落词表判）", async () => {
  const r = await pair({ A: [{ text: "" }, { text: "说不清" }], B: sel("pass") })
  assert.equal(r.verdict, "error")
  assert.equal(r.resolution, "none")
  assert.match(r.reason, /^判官不可用（有效判不足）：/)
  const a = r.judges.find((j) => j.id === "A")
  assert.equal(a.verdict, "error")
  assert.equal(a.attempts, 2, "失败位逐位留证")
  const g = judgeResult(r)
  assert.equal(typeof g.error, "string", "合成分 error ⇒ 用例返回 `{ error }`（run 判 error，不猜 fail/pass）")
  assert.match(g.detail, /^判官不可用/)
  assert.equal("pass" in g, false)
})

test("judge.4：`frozenAtSuiteVersion` ≠ SUITE_VERSION ⇒ 拒跑（退出码 1）+ 明示提示", async () => {
  const p = join(FIXTURES, "judge-stale.json")
  writeFileSync(p, JSON.stringify({ version: 1, frozenAtSuiteVersion: 2, judges: [{ provider: "deepseek", model: "m1", maxTokens: 2048, timeoutSec: 30 }, { provider: "deepseek", model: "m2", maxTokens: 2048, timeoutSec: 30 }], arbiter: { provider: "deepseek", model: "m3", maxTokens: 2048, timeoutSec: 30 } }), "utf8")
  process.env.BENCH_JUDGE = p
  try {
    const { code, out } = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "reasoning", "--label", `fj4-${process.pid}`])
    assert.equal(code, 1)
    assert.match(out, /判官配置已换代：judge.json.frozenAtSuiteVersion = 2 ≠ SUITE_VERSION = 6/)
  } finally { delete process.env.BENCH_JUDGE }
})

test("judge.5：判官键 ∈ 被测集合 ⇒ 正常跑（不拒跑 · 自判）+ 该位标注与 warnings；同 provider 异 model ⇒ 允许 + sameVendorAsTested 明示", async () => {
  const mk = (judges, name) => {
    const p = join(FIXTURES, name)
    writeFileSync(p, JSON.stringify({ version: 1, frozenAtSuiteVersion: 6, judges, arbiter: { provider: "kimi", model: "kimi-k3", maxTokens: 2048, timeoutSec: 30 } }), "utf8")
    return p
  }
  const runWith = async (cfgPath, label) => {
    process.env.BENCH_JUDGE = cfgPath
    try { return await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "reasoning", "--label", label]) } finally { delete process.env.BENCH_JUDGE }
  }
  // 同位（自判）：判官 A 位键 = 被测条目 ⇒ 正常启动 + 跑完（退出码 0——判官不干预被测选择）
  const labelSelf = `fj5a-${process.pid}`
  const selfJudge = mk([{ provider: "mimo", model: "mimo-v2.6-flash", maxTokens: 2048, timeoutSec: 30 }, { provider: "deepseek", model: "deepseek-flash", maxTokens: 2048, timeoutSec: 30 }], "judge-selfjudge.json")
  const selfRun = await runWith(selfJudge, labelSelf)
  assert.equal(selfRun.code, 0, selfRun.out)
  assert.ok(selfRun.out.includes("通过"), "正常运行（不因同位阻断）")
  const selfData = readJson(findFile(`${labelSelf}.json`))
  assert.equal(selfData.judge.judges[0].sameVendorAsTested, true, "同位态 ⇒ 渠道级重合旗标置 true")
  assert.equal(selfData.judge.judges[1].sameVendorAsTested, false, "无重合位不置旗标")
  const overlapWarns = selfData.warnings.filter((w) => /判官 [ABC] 位（/.test(w))
  assert.equal(overlapWarns.length, 1, `逐重合位各一条（B / C 位无重合 ⇒ 零条）：${selfData.warnings.join("；")}`)
  assert.match(overlapWarns[0], /判官 A 位（mimo:mimo-v2\.6-flash）∈ 本次被测集合（自判 · 重合级别：同位）/)
  assert.ok(readFileSync(findFile(`${labelSelf}.md`), "utf8").includes("该位 ∈ 被测（自判）"), "报告判官行该位标注（同位）")
  // 同渠道异 model：允许（不拒跑），但该位必须明示 sameVendorAsTested + warnings 一条 + 报告判官行标注
  const label = `fj5b-${process.pid}`
  const sameVendor = mk([{ provider: "mimo", model: "mimo-v2.6-pro", maxTokens: 2048, timeoutSec: 30 }, { provider: "deepseek", model: "deepseek-flash", maxTokens: 2048, timeoutSec: 30 }], "judge-samevendor.json")
  const r = await runWith(sameVendor, label)
  assert.equal(r.code, 0, r.out)
  assert.ok(r.out.includes("通过"), "正常运行（不因同渠道阻断）")
  const data = readJson(findFile(`${label}.json`))
  assert.equal(data.judge.judges[0].sameVendorAsTested, true, "同渠道位明示")
  assert.equal(data.judge.judges[1].sameVendorAsTested, false, "跨渠道位不置旗标")
  assert.ok(data.warnings.some((w) => w.includes("sameVendorAsTested")), "warnings 一条")
  assert.ok(readFileSync(findFile(`${label}.md`), "utf8").includes("与被测同渠道（明示 sameVendorAsTested）"), "报告判官行该位标注")
  // provider 不在用户 config（live 路径）⇒ 拒跑（resolveJudgeSlots 直测）
  const cfg = loadJudgeConfig(sameVendor)
  assert.throws(() => resolveJudgeSlots(cfg, { providers: [{ name: "other", baseURL: "https://x.example" }], tested: [] }), /判官 A 位的 provider 不在用户 config/)
})

test("judge.6：judge.json schema 不合（maxTokens / timeoutSec / provider / judges 长度 / arbiter 缺）⇒ 装载即拒", () => {
  const bad = (obj, re) => {
    const p = join(FIXTURES, `judge-bad-${Math.abs(JSON.stringify(obj).length + obj.judges?.length)}.json`)
    writeFileSync(p, typeof obj === "string" ? obj : JSON.stringify(obj), "utf8")
    assert.throws(() => loadJudgeConfig(p), re)
  }
  const base = () => ({
    version: 1, frozenAtSuiteVersion: 6,
    judges: [{ provider: "p", model: "m1", maxTokens: 2048, timeoutSec: 30 }, { provider: "p", model: "m2", maxTokens: 2048, timeoutSec: 30 }],
    arbiter: { provider: "p", model: "m3", maxTokens: 2048, timeoutSec: 30 },
  })
  bad("{ not json", /不可读或非 JSON/)
  const c1 = base(); c1.judges[0].maxTokens = 400; bad(c1, /maxTokens 越界（须 1024–8192 的整数，得 400）/)
  const c2 = base(); c2.judges[1].timeoutSec = 999; bad(c2, /timeoutSec 越界/)
  const c3 = base(); delete c3.judges[0].provider; bad(c3, /judges\[0\]（A 位）缺 provider/)
  const c4 = base(); c4.judges = [c4.judges[0]]; bad(c4, /judges 须为长度恰 2 的数组/)
  const c5 = base(); delete c5.arbiter; bad(c5, /缺 arbiter/)
  const c6 = base(); delete c6.frozenAtSuiteVersion; bad(c6, /缺 frozenAtSuiteVersion/)
})

test("judge.7：复核触发面（fail ∧ 非判官裁决 ∧ 用例有机械面；error / skipped 不触发；判官 fail 不叠加）", async () => {
  const mech = { mechRubric: "夹具机械条文" }
  const judgeCase = { mechRubric: "夹具机械条文", judge: DECL }
  assert.equal(shouldReview({ verdict: "fail" }, mech), true, "机械 fail ⇒ 触发")
  assert.equal(shouldReview({ verdict: "fail", judge: { verdict: "pass" } }, judgeCase), true, "机械 fail（判官判 pass 的混合面）⇒ 触发")
  assert.equal(shouldReview({ verdict: "fail", judge: { verdict: "fail" } }, judgeCase), false, "判官裁决的 fail 不叠加")
  assert.equal(shouldReview({ verdict: "fail" }, { mechRubric: "" }), false, "无机械面不触发")
  assert.equal(shouldReview({ verdict: "error" }, mech), false, "error 不触发")
  assert.equal(shouldReview({ verdict: "skipped" }, mech), false, "skipped 不触发")
  // 端到端（dry-run 夹具）：机械 fail ⇒ 有 review 记录；error / 判官 fail ⇒ 无
  const label = `fj7-${process.pid}`
  const { code, out } = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--label", label])
  assert.equal(code, 0, out)
  const data = readJson(findFile(`${label}.json`))
  const runOf = (id) => data.models[0].cases.find((c) => c.caseId === id).runs[0]
  assert.equal(runOf("longctx.2").verdict, "fail")
  assert.equal(runOf("longctx.2").review.verdict, "uphold", "机械 fail ⇒ 复核（uphold 维持）")
  assert.equal(runOf("longctx.3").verdict, "error")
  assert.equal("review" in runOf("longctx.3"), false, "error 不触发复核")
  assert.equal("review" in runOf("multiturn.3"), false, "判官裁决的 run 不带复核记录")
  assert.equal("judge" in runOf("reasoning.1"), false, "未调判官的 run 不写 judge 字段（§2.2-7）")
})

test("judge.8：A / B 一致 ⇒ unanimous；仅两次调用（不触发仲裁）", async () => {
  const r = await pair({ A: sel("fail"), B: sel("fail") })
  assert.equal(r.verdict, "fail")
  assert.equal(r.resolution, "unanimous")
  assert.equal(r.judges.length, 2, "C 位未被调用（未触发）")
  assert.equal(r.judges.every((j) => j.calls.length === 1), true)
})

test("judge.9：A / B 相异 + 仲裁 C ⇒ 多数决（arbitrated）+ 三位逐位记账 + 分歧 / 仲裁计数", async () => {
  const r = await pair({ A: sel("pass"), B: sel("fail"), C: sel("pass") })
  assert.equal(r.verdict, "pass")
  assert.equal(r.resolution, "arbitrated")
  assert.equal(r.reason, "夹具理由", "仲裁 ⇒ 定判位理由 = C 位理由")
  assert.deepEqual(r.judges.map((j) => j.id), ["A", "B", "C"])
  assert.equal(r.judges.every((j) => j.calls.length === 1), true, "三次调用逐位记账")
  const data = { judge: { judges: [{ provider: "p", model: "m-a" }, { provider: "p", model: "m-b" }], arbiter: { provider: "p", model: "m-c" } }, review: {}, models: [{ cases: [{ runs: [{ judge: r }] }] }] }
  applyJudgeCosts(data, { asOf: "2026-01-01", currency: "CNY", entries: [] }, [])
  assert.equal(data.judge.agreements, 0)
  assert.equal(data.judge.disagreements, 1)
  assert.equal(data.judge.arbitrations, 1)
  assert.equal(data.judge.judgeCalls, 3)
})

test("judge.10：单判官失败 ⇒ 有效判 < 2 ⇒ run error（不单判回退）+ 成因「有效判不足」+ 位级留证", async () => {
  const r = await pair({ A: [{ text: "" }, { text: "" }], B: sel("pass") })
  assert.equal(r.verdict, "error")
  assert.equal(r.resolution, "none")
  assert.match(r.reason, /判官不可用（有效判不足）/)
  assert.equal(r.judges.length, 2, "不补位（仲裁员不替失败位）")
  assert.equal(r.judges[0].verdict, "error")
  assert.equal(r.judges[0].attempts, 2)
  assert.equal(r.judges[1].verdict, "pass")
})

test("judge.11：A / B 分歧 + 仲裁 C 两次不可解析 ⇒ error（无多数）+ 成因「分歧未决」+ 三方留证", async () => {
  const r = await pair({ A: sel("pass"), B: sel("fail"), C: [{ text: "" }, { text: "{}" }] })
  assert.equal(r.verdict, "error")
  assert.equal(r.resolution, "none")
  assert.match(r.reason, /判官不可用（分歧未决）/)
  assert.deepEqual(r.judges.map((j) => j.id), ["A", "B", "C"])
  assert.equal(r.judges[2].attempts, 2)
})

test("judge.12：判官对身份违约（A=B / 仲裁员 ∈ {A, B}）⇒ 装载即拒 + 明示违约位次", () => {
  const mk = (judges, arbiter) => {
    const p = join(FIXTURES, `judge-id-${judges.map((j) => j.model).join("-")}-${arbiter.model}.json`)
    writeFileSync(p, JSON.stringify({ version: 1, frozenAtSuiteVersion: 6, judges, arbiter }), "utf8")
    return p
  }
  const ab = mk([{ provider: "p", model: "same", maxTokens: 2048, timeoutSec: 30 }, { provider: "q", model: "same", maxTokens: 2048, timeoutSec: 30 }], { provider: "r", model: "other", maxTokens: 2048, timeoutSec: 30 })
  assert.throws(() => loadJudgeConfig(ab), /判官对身份违约——A 与 B 同模型「same」/)
  const ac = mk([{ provider: "p", model: "m1", maxTokens: 2048, timeoutSec: 30 }, { provider: "q", model: "m2", maxTokens: 2048, timeoutSec: 30 }], { provider: "r", model: "m2", maxTokens: 2048, timeoutSec: 30 })
  assert.throws(() => loadJudgeConfig(ac), /仲裁员身份违约——arbiter 模型「m2」∈ \{A, B\}/)
})

test("review.1 / review.2：复核 uphold ⇒ fail 维持；overturn ⇒ 翻案记录（改判落点 = 编排面——case 级只断记录形状）", async () => {
  const mk = (scripts) => reviewRun({
    caseObj: { prompt: "夹具题面", mechRubric: "夹具机械条文", judge: DECL },
    turns: [{ text: "夹具回答", steps: [{ toolCalls: [{ name: "send_email", arguments: '{"to":"x"}' }] }] }],
    mechDetail: "机械断言未过",
    slots: SLOTS,
    transport: fixtureSlotTransport({ review: scripts }),
    providers: [],
  })
  const up = await mk(sel("uphold"))
  assert.equal(up.verdict, "uphold")
  assert.equal(up.mechDetail, "机械断言未过")
  assert.equal(up.calls.length, 1)
  assert.equal(typeof up.calls[0].at, "string")
  const ov = await mk([{ text: v("overturn", "机械判据过严") }])
  assert.equal(ov.verdict, "overturn")
  assert.equal(ov.reason, "机械判据过严")
  // 改判落点 = 编排面（`pipeline.mjs`）：本档只产 `runs[].review` 记录（形状零改——本断言即其机检）；全链路腿 = `report-render` 的 dry-run
  assert.deepEqual(Object.keys(ov).sort(), ["attempts", "calls", "mechDetail", "reason", "verdict"], "复核记录形状零改（不因改判新增字段）")
})

test("review.3：复核调用失败 ⇒ `review.verdict = \"error\"`（fail 维持，不降 error）", async () => {
  const r = await reviewRun({
    caseObj: { prompt: "夹具题面", mechRubric: "夹具机械条文" },
    turns: [{ text: "夹具回答", steps: [] }],
    mechDetail: "机械断言未过",
    slots: SLOTS,
    transport: fixtureSlotTransport({ review: [{ fail: "throw", message: "夹具：网络失败" }] }),
    providers: [],
  })
  assert.equal(r.verdict, "error")
  assert.match(r.reason, /位级失败/)
  assert.equal(r.attempts, 1, "传输面失败不重试")
})

test("§2.6/§2.10.1 三段素材：题面段 = `judge.question` ?? 用例 `prompt`（单源解析 + 逐字入消息）+ 工具事实面", async () => {
  const mt1 = CASES.find((c) => c.id === "multiturn.1")
  assert.equal(judgeQuestion(mt1), mt1.judge.question, "显式 question 优先（多轮 = 声明式拼接）")
  const r3 = CASES.find((c) => c.id === "reasoning.3")
  assert.equal(r3.judge.question, undefined, "该例无显式 question（回退面）")
  assert.equal(judgeQuestion(r3), r3.prompt, "缺省 = 用例 prompt——判官素材不得缺题面段")
  const captured = []
  const transport = {
    async call({ messages }) {
      captured.push(...messages.map((m) => String(m.content)))
      return { response: { content: v("pass"), usage: null, finishReason: "stop" }, totalMs: 1 }
    },
  }
  const r = await judgeWithPair({ decl: r3.judge, question: judgeQuestion(r3), material: "夹具回答", slots: SLOTS, transport, providers: [] })
  assert.equal(r.verdict, "pass")
  const flat = captured.join("\n")
  assert.ok(flat.includes("## 题面") && flat.includes(r3.prompt), "题面逐字入消息（无显式 question 的 8 例依赖此回退）")
  assert.ok(flat.includes("## 判据条文") && flat.includes("题干前提「9 是质数」为假"), "判据条文逐字入消息")
  assert.ok(flat.includes("## 模型回答") && flat.includes("夹具回答"), "回合素材入消息")
  // turnMaterial = 该回合文本 + 该回合工具事实（父侧裁定 2026-09-24）；缺回合 ⇒ fail-closed
  const material = turnMaterial({ text: "已发送。", steps: [{ toolCalls: [{ name: "send_email", arguments: '{"to":"a@x"}' }] }] })
  assert.ok(material.includes("已发送。") && material.includes('send_email({"to":"a@x"})'), "工具调用事实入素材（正文类判据的取材面）")
  assert.equal(turnMaterial(null), null)
  const missing = await judgeWithPair({ decl: DECL, material: null, slots: SLOTS, transport: fixtureSlotTransport({}), providers: [] })
  assert.equal(missing.verdict, "error")
  assert.match(missing.reason, /素材缺失/)
})
