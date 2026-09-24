/**
 * test/graders.test.mjs — 判分器族正常 + 反例（AC-5：含「硬编码公开例」反例）+ 判官合成分件（§2.6）。
 * 手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI —— AC-8）。
 */

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import {
  argValue, extractCode, firstJsonObject, jsonFields, judgeAfterMech, judgeResult, numEquals, ok, parseToolArgs, strictJson, textRules, toolShape, vmRun,
} from "../lib/grade.mjs"
import { CODE_ASSERTS, cases as codeCases } from "../cases/code.mjs"
import { cases as reasoningCases } from "../cases/reasoning.mjs"
import { cases as jsonCases } from "../cases/json.mjs"
import { cases as instructionsCases } from "../cases/instructions.mjs"
import { cases as multiturnCases } from "../cases/multiturn.mjs"
import { cases as visionCases } from "../cases/vision.mjs"
import { findFile, readJson, runCli } from "./fixtures.mjs"
import { FIXTURE } from "../run.mjs"

const BENCH_DIR = dirname(dirname(fileURLToPath(import.meta.url)))
const gradeOf = (cases, id) => cases.find((c) => c.id === id).grade

test("numEquals：数字独立成词（前后不得再连数字）", () => {
  assert.equal(numEquals("3", 3), true)
  assert.equal(numEquals("答案是 3。", 3), true)
  assert.equal(numEquals("13", 3), false, "13 里没有独立的 3")
  assert.equal(numEquals("49152", 49152), true)
  assert.equal(numEquals("491520", 49152), false, "不得匹配更长数字的前缀")
  assert.equal(numEquals("x=-2", -2), true)
  assert.equal(numEquals("3-2", -2), false)
})

test("extractCode：末个围栏内容优先，无围栏取整段", () => {
  assert.equal(extractCode("解释\n```js\nconst a = 1\n```\n"), "const a = 1")
  assert.equal(extractCode("```js\nfirst\n```\n中间\n```js\nsecond\n```"), "second")
  assert.equal(extractCode("  function f(){ return 1 }  "), "function f(){ return 1 }")
})

test("vmRun：正确实现通过；边界错误实现失败；超时被杀", () => {
  const good = "function chunkEven(arr, size){ if (size < 1) throw new RangeError('x'); const out=[]; for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out }"
  assert.equal(vmRun(good, CODE_ASSERTS["code.1"]).pass, true)

  // 边界反例：size<1 不抛错
  const noThrow = "function chunkEven(arr, size){ const out=[]; for (let i=0;i<arr.length;i+=Math.max(1,size)) out.push(arr.slice(i,i+size)); return out }"
  const r1 = vmRun(noThrow, CODE_ASSERTS["code.1"])
  assert.equal(r1.pass, false)
  assert.match(r1.detail, /RangeError/)

  // 超时：死循环被杀（短超时保持测试快）
  const loop = "function chunkEven(){ while (true) {} }"
  const r2 = vmRun(loop, CODE_ASSERTS["code.1"], { timeoutMs: 300 })
  assert.equal(r2.pass, false)
  assert.match(r2.detail, /执行失败|超时|timed out/i)

  // 语法错误同样 fail（不抛到调用方）
  assert.equal(vmRun("function chunkEven( {", CODE_ASSERTS["code.1"]).pass, false)
})

test("AC-5 反例：硬编码公开例的实现必须 FAIL（隐藏断言生效）", () => {
  // 只满足题面公开例 chunkEven([1,2,3,4,5],2) → [[1,2],[3,4],[5]]，其余输入摆烂
  const hardcoded = "function chunkEven(arr, size){ return (arr.length===5 && size===2) ? [[1,2],[3,4],[5]] : [] }"
  const r = vmRun(hardcoded, CODE_ASSERTS["code.1"])
  assert.equal(r.pass, false, "读题面即知判据的硬编码实现不得通过")
  // 正控：同样输入形态下正确实现仍 pass（防恒红）
  const good = "function chunkEven(arr, size){ if (size < 1) throw new RangeError('x'); const out=[]; for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out }"
  assert.equal(vmRun(good, CODE_ASSERTS["code.1"]).pass, true)
})

test("strictJson：整串 parse；围栏/散文即 FAIL", () => {
  assert.equal(strictJson('{"a":1}').ok, true)
  assert.equal(strictJson('  {"a":1}  ').ok, true)
  assert.equal(strictJson('```json\n{"a":1}\n```').ok, false)
  assert.equal(strictJson('{"a":1} 解释').ok, false)
  assert.equal(strictJson("[1,2]").ok, false, "非对象整串亦不合判据（须以 { 开头）")
})

test("jsonFields：类型/值断言逐条报告", () => {
  const pass = jsonFields({ count: 0, name: "小明" }, {
    count: (v) => (typeof v === "number" && v === 0 ? null : "须数字 0"),
    name: (v) => (v === "小明" ? null : "须小明"),
  })
  assert.equal(pass.pass, true)
  const bad = jsonFields({ count: "0" }, { count: (v) => (typeof v === "number" ? null : "须数字 0") })
  assert.equal(bad.pass, false)
  assert.match(bad.detail, /count/)
})

test("toolShape / parseToolArgs：结构断言与 arguments 解析", () => {
  const okCalls = [{ name: "get_time", arguments: "{}" }, { name: "get_time", arguments: '{"city":"北京"}' }]
  assert.equal(toolShape(okCalls, { count: 2, everyName: "get_time", argsParse: true }).pass, true)
  assert.equal(toolShape(okCalls, { count: 1 }).pass, false)
  assert.equal(toolShape([{ name: "read_file", arguments: "{}" }], { everyName: "get_time" }).pass, false)
  assert.equal(toolShape([{ name: "x", arguments: "{bad" }], { argsParse: true }).pass, false)
  assert.equal(parseToolArgs({ arguments: "" }).value.city, undefined)
  assert.deepEqual(parseToolArgs({ arguments: "" }).value, {}, "空 arguments 视作 {}（§2.6）")
})

test("text.1：三解释类 kind 已删（未知 kind fail-closed）+ 无解析件；字面 / 计数面行为不变", () => {
  const text = "夜里的城市换上另一副面孔\n\n霓虹在雨里显得固执\n\n霓虹又亮了一次"
  const r = textRules(text, [
    { kind: "startsWith", char: "夜" },
    { kind: "tokenCount", token: "霓虹", min: 2 },
    { kind: "notContains", tokens: ["，"] },
    { kind: "hanziMin", min: 15 },
  ])
  assert.equal(r.pass, true, r.detail)

  const bad = textRules("夜里，城市。", [
    { kind: "notContains", tokens: ["，"] },
    { kind: "hanziMin", min: 10 },
  ])
  assert.equal(bad.pass, false)
  assert.match(bad.detail, /禁用/)
  assert.equal(textRules("含截止", [{ kind: "contains", tokens: ["截止"] }]).pass, true)
  assert.equal(textRules("句子含1个数字。", [{ kind: "noArabicDigits" }]).pass, false)
  // 解释类 kind（段落 / 句结构）已随判据分层重划删除（移判官面，§2.10.2）——零调用者 ⇒ 删即归零，不留快通道
  for (const kind of ["paragraphCount", "sentenceCount", "hanziPerSentenceMax"]) {
    const g = textRules("甲\n乙\n丙", [{ kind }])
    assert.equal(g.pass, false, `${kind} 已删除——未知 kind 须 fail-closed`)
    assert.match(g.detail, /未知规则/)
  }
  // 解析件（paragraphs / sentences）已随件删除——模块内不得留解析快通道
  const src = readFileSync(join(BENCH_DIR, "lib", "grade.mjs"), "utf8")
  assert.equal(src.includes("function paragraphs"), false, "解析件 paragraphs 已删")
  assert.equal(src.includes("function sentences"), false, "解析件 sentences 已删")
})

test("judgeResult / judgeAfterMech：判官合成分 → 用例返回形状（error ⇒ error；pass / fail ⇒ 判官定判）", async () => {
  const err = judgeResult({ verdict: "error", reason: "判官不可用（有效判不足）：夹具" })
  assert.equal(typeof err.error, "string")
  assert.match(err.detail, /^判官不可用/)
  const p = judgeResult({ verdict: "pass", resolution: "unanimous", reason: "夹具理由" }, "机械断言全过")
  assert.equal(p.pass, true)
  assert.match(p.detail, /机械断言全过；判官裁决（unanimous）：夹具理由/)
  assert.equal(judgeResult({ verdict: "fail", resolution: "arbitrated", reason: "夹具" }, "机械断言全过").pass, false)
  assert.equal(judgeResult(null).error.length > 0, true, "无合成分 ⇒ fail-closed")
  // 短路顺序（§2.6）：机械面已 FAIL ⇒ 不调判官
  let called = 0
  const ctx = { judge: async () => { called++; return { verdict: "pass", resolution: "unanimous", reason: "夹具" } } }
  const failed = await judgeAfterMech(ok(false, "机械断言未过"), ctx)
  assert.equal(failed.pass, false)
  assert.equal(called, 0, "机械面已 FAIL ⇒ 不调判官")
  const passed = await judgeAfterMech(ok(true, "机械断言全过"), ctx)
  assert.equal(called, 1)
  assert.equal(passed.pass, true)
})

test("判官面用例咬合 + 判官 rubric 齐（§2.6 / §5.11 正本存在性）", async () => {
  const judgeCases = [...reasoningCases, ...jsonCases, ...codeCases, ...visionCases].filter((c) => c.judge)
  for (const c of judgeCases) {
    assert.equal(Number.isInteger(c.judge.turn), true, `${c.id} judge.turn 必填（回合精确）`)
    assert.equal(typeof c.judge.rubric, "string")
    assert.ok(c.judge.rubric.length > 0, `${c.id} 缺 rubric`)
  }
  // 纯判官面用例：无 ctx.judge 时必须抛错（fail-closed——不得静默判 pass）
  for (const id of ["reasoning.3", "vision.1", "vision.2", "vision.3"]) {
    const c = reasoningCases.concat(visionCases).find((x) => x.id === id)
    await assert.rejects(async () => c.grade({ text: "夹具回答" }, {}), `${id} 缺 ctx.judge 须抛错`)
  }
  // 合成分驱动判定（纯判官面）：pass / fail / error 三态
  const v1 = visionCases.find((c) => c.id === "vision.1")
  assert.equal((await v1.grade({ text: "红色" }, { judge: async () => ({ verdict: "pass", resolution: "unanimous", reason: "夹具" }) })).pass, true)
  assert.equal((await v1.grade({ text: "蓝色" }, { judge: async () => ({ verdict: "fail", resolution: "unanimous", reason: "夹具" }) })).pass, false)
  assert.equal(typeof (await v1.grade({ text: "红色" }, { judge: async () => ({ verdict: "error", resolution: "none", reason: "判官不可用（有效判不足）：夹具" }) })).error, "string")
})

test("题集判分（端到端用夹具结果）：机械面各例正反", () => {
  assert.equal(gradeOf(reasoningCases, "reasoning.1")({ text: "3" }).pass, true)
  assert.equal(gradeOf(reasoningCases, "reasoning.1")({ text: "13" }).pass, false)
  const j1 = gradeOf(jsonCases, "json.1")({ text: '{"name":"小明","age":9,"tags":["a","b"]}' })
  assert.equal(j1.pass, true)
  assert.equal(gradeOf(jsonCases, "json.1")({ text: '```json\n{"name":"小明","age":9,"tags":["a","b"]}\n```' }).pass, false)
  const code1 = gradeOf(codeCases, "code.1")({ text: "function chunkEven(arr, size){ if (size<1) throw new RangeError('x'); const o=[]; for(let i=0;i<arr.length;i+=size) o.push(arr.slice(i,i+size)); return o }" })
  assert.equal(code1.pass, true)
})

test("judge.13：混合面重划 · 定点复现（缺陷形态串 + 桩判官两态 + 短路 + dry-run 全链路）", async () => {
  const byId = (id) => instructionsCases.find((c) => c.id === id)
  // 缺陷形态串 = dry-run 夹具响应串（单源）：「正文 3 段（.1）/ 2 句（.2）+ `---` + 自检块」——机械条全过、
  // 旧机械面读数（段落 / 句数）误判 fail ⇒ 该形态的 pass 腿 = 修复后判据的定点复现（§2.12-3① 关闭证据）
  const DEFECT = { "instructions.1": FIXTURE["instructions.1"][0].text, "instructions.2": FIXTURE["instructions.2"][0].text }
  let calls = 0
  const ctxOf = (verdict) => ({ judge: async () => { calls++; return { verdict, resolution: "unanimous", reason: "夹具裁决" } } })
  // ① 缺陷形态串 ∧ 桩判官 pass ⇒ run pass 且判官被调（机械面未拦下——修复后 pass 腿）
  for (const id of ["instructions.1", "instructions.2"]) {
    calls = 0
    const g = await byId(id).grade({ text: DEFECT[id] }, ctxOf("pass"))
    assert.equal(g.pass, true, `${id} 缺陷形态串须 pass（实得：${g.detail}）`)
    assert.equal(calls, 1, `${id} 机械面全过 ⇒ 判官被调`)
  }
  // ② 桩判官 fail ⇒ run fail（判官定判）
  const gFail = await byId("instructions.1").grade({ text: DEFECT["instructions.1"] }, ctxOf("fail"))
  assert.equal(gFail.pass, false)
  assert.match(gFail.detail, /判官裁决（unanimous）/)
  // ③ 机械违例 ⇒ fail 且不调判官（短路——桩零调用 ⇒ 记录面无 runs[].judge）
  for (const [id, violated] of [["instructions.1", DEFECT["instructions.1"].replace("。", "，")], ["instructions.2", `${DEFECT["instructions.2"]}2`]]) {
    calls = 0
    const g = await byId(id).grade({ text: violated }, ctxOf("pass"))
    assert.equal(g.pass, false, `${id} 机械违例 ⇒ fail`)
    assert.equal(calls, 0, `${id} 机械面已 FAIL ⇒ 不调判官（短路）`)
  }
  // ④ dry-run 全链路（--dims instructions）：缺陷形态串全链路 pass + 判官记录在场
  const label = `judge13-${process.pid}`
  const { code, out } = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "instructions", "--label", label])
  assert.equal(code, 0, out)
  const data = readJson(findFile(`${label}.json`))
  const runOf = (id) => data.models[0].cases.find((c) => c.caseId === id).runs[0]
  for (const id of ["instructions.1", "instructions.2"]) {
    assert.equal(runOf(id).verdict, "pass", `${id} 缺陷形态串全链路 pass（机械面未拦下）`)
    assert.equal(runOf(id).judge.resolution, "unanimous", `${id} 判官被调（判官记录在场）`)
    assert.equal("review" in runOf(id), false, "机械面全过 ⇒ 无复核记录")
  }
  assert.equal(runOf("instructions.3").verdict, "pass", "同维纯判官面用例不受影响")
})

// ── mech.1 / mech.2：承接修复定点复现（#273 / #274 · KD-37 · §5.13；不调模型——合成 `result.turns`） ──────────
const mtCase = (id) => multiturnCases.find((c) => c.id === id)
const tc = (name, args, id = "c1") => ({ id, name, arguments: typeof args === "string" ? args : JSON.stringify(args) })
const stepOf = (text, toolCalls = []) => ({ text, reasoning: "", toolCalls, call: null })
const retrieve = () => stepOf("", [tc("get_time", {})])
const SEND = (to = "team@example.com") => stepOf("", [tc("send_email", { to })])
const turnOf = (...steps) => ({ text: "", reasoning: "", toolCalls: [], steps })

/** 单腿：跑该用例 `grade` 并按期望核判定 + **判官调用数**（机械面 FAIL ⇒ 不调判官——短路，§2.6）。 */
async function mechLeg(caseId, turns, wantPass, why) {
  const box = { calls: 0 }
  const ctx = { judge: async () => { box.calls++; return { verdict: "pass", resolution: "unanimous", reason: "夹具裁决" } } }
  const g = await mtCase(caseId).grade({ turns }, ctx)
  assert.equal(g.pass, wantPass, `${why} ⇒ 须 ${wantPass ? "pass" : "fail"}（实得：${g.detail}）`)
  assert.equal(box.calls, wantPass ? 1 : 0, `${why} ⇒ 判官调用 ${wantPass ? 1 : 0} 次（${wantPass ? "机械面全过" : "短路"}）`)
  return g
}

test("mech.1：`multiturn.1` 判据修复定点复现（检索步 + 存在语义 + 原语三态 + 旧判据串负断言 + dry-run 全链路）", async () => {
  // ①② 修复形态（检索步 + 追问 / 实录形态：回合 2 多条 `send_email` ∧ `arguments` = 同一 JSON 对象重复拼接）
  await mechLeg("multiturn.1", [turnOf(retrieve(), stepOf("请问收件人是谁？主题和会议时间也请给一下？")), turnOf(SEND())], true, "① 修复形态（修复前 fail「回合 1 信息不全却调用了工具：get_time」）")
  const dup = '{"to":"team@example.com","subject":"周会"}{"to":"team@example.com","subject":"周会"}'
  await mechLeg("multiturn.1", [turnOf(retrieve(), stepOf("请补充收件人与时间")), turnOf(stepOf("", [tc("send_email", dup, "c2"), tc("send_email", dup, "c3")]))], true, "② 实录形态（重复拼接——修复前严格解析失败 ⇒ to 读空 ⇒ fail「send_email.to=（需 team@example.com）」）")
  // ③ 反例三条：`to` 为他值 / 回合 1 出 `send_email` / 回合 2 无 `send_email` ⇒ 各 fail 且不调判官（不放松真违规支）
  for (const turns of [
    [turnOf(retrieve(), stepOf("请补充")), turnOf(SEND("other@example.com"))],
    [turnOf(SEND()), turnOf(SEND())],
    [turnOf(retrieve(), stepOf("请补充")), turnOf(stepOf("好的，邮件稍后发出"))],
  ]) await mechLeg("multiturn.1", turns, false, "③ 反例")
  // ④ 原语三态（`firstJsonObject` / `argValue`）：严格过 / 拼接取首件 / 不闭合 ⇒ null
  assert.equal(firstJsonObject('{"a":1}'), '{"a":1}', "严格形态取整串")
  assert.equal(firstJsonObject('{"a":1}{"a":1}'), '{"a":1}', "重复拼接取首件")
  assert.equal(firstJsonObject('{"a":1'), null, "不闭合 ⇒ null")
  assert.equal(argValue({ arguments: '{"to":"x"}{"to":"x"}' }, "to"), "x", "argValue 拼接形态取首件（`.1` 判别形态）")
  // ⑤ dry-run 全链路（`.1` 夹具 = 检索步形态）+ 旧判据串负断言（循 `text.1` 先例）
  const label = `mech1-${process.pid}`
  const { code, out } = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "multiturn", "--label", label])
  assert.equal(code, 0, out)
  const run1 = readJson(findFile(`${label}.json`)).models[0].cases.find((c) => c.caseId === "multiturn.1").runs[0]
  assert.equal(run1.verdict, "pass", "⑤ dry-run 全链路：修复形态 run pass")
  assert.ok(run1.judge, "⑤ 判官记录在场")
  assert.equal("review" in run1, false, "⑤ 机械面全过 ⇒ 无复核记录")
  const src = readFileSync(join(BENCH_DIR, "cases", "multiturn.mjs"), "utf8")
  for (const gone of ["回合 1 信息不全却调用了工具", "回合 1 未调用 send_email"]) assert.equal(src.includes(gone), false, `旧判据串已删：${gone}（修复前 fail 凭证 = v5 报告《复核翻案》承接表实录）`)
})

test("mech.2：`multiturn.3` 判据修复定点复现（全序列存在语义 + 跨回合跟进 + 反例 + dry-run 全链路）", async () => {
  // ①② 修复形态（回合 1 = 检索步 → 跟进 `send_email`）/ 跨回合跟进形态（修复判别形态：回合 1 检索步、回合 2 发信）
  await mechLeg("multiturn.3", [turnOf(retrieve(), SEND())], true, "① 修复形态")
  await mechLeg("multiturn.3", [turnOf(retrieve()), turnOf(SEND())], true, "② 跨回合跟进（修复前 = 只查回合 1 ⇒ fail「回合 1 未调用 send_email（实际：get_time）」）")
  // ③ 反例：仅检索步无跟进 / 无任何调用（追问推脱形态）⇒ 各 fail（信息足够仍不得追问 / 仍须发信）
  for (const turns of [[turnOf(retrieve())], [turnOf(stepOf("时间可以定在明天上午十点——你看行吗？"))]]) await mechLeg("multiturn.3", turns, false, "③ 反例")
  // ④ dry-run 全链路（`.3` 夹具）run pass ∧ 判官记录在场
  const label = `mech2-${process.pid}`
  const { code, out } = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "multiturn", "--label", label])
  assert.equal(code, 0, out)
  const run3 = readJson(findFile(`${label}.json`)).models[0].cases.find((c) => c.caseId === "multiturn.3").runs[0]
  assert.equal(run3.verdict, "pass", "④ dry-run 全链路：`.3` 夹具 run pass")
  assert.ok(run3.judge, "④ 判官记录在场")
})
