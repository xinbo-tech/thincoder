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
  extractCode, jsonFields, judgeAfterMech, judgeResult, numEquals, ok, parseToolArgs, strictJson, textRules, toolShape, vmRun,
} from "../lib/grade.mjs"
import { CODE_ASSERTS, cases as codeCases } from "../cases/code.mjs"
import { cases as reasoningCases } from "../cases/reasoning.mjs"
import { cases as jsonCases } from "../cases/json.mjs"
import { cases as instructionsCases } from "../cases/instructions.mjs"
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
