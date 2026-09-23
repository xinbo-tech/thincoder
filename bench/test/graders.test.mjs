/**
 * test/graders.test.mjs — 判分器族正常 + 反例（AC-5：含「硬编码公开例」反例）。
 * 手动跑：`node --test bench/test/*.test.mjs`（不进 CI —— AC-8）。
 */

import assert from "node:assert/strict"
import { test } from "node:test"
import {
  COLOR_FAMILIES, colorMatch, countEnumerations, extractCode, jsonFields, keywordSet,
  numEquals, parseToolArgs, strictJson, textRules, toolShape, vmRun,
} from "../lib/grade.mjs"
import { CODE_ASSERTS, cases as codeCases } from "../cases/code.mjs"
import { cases as reasoningCases } from "../cases/reasoning.mjs"
import { cases as jsonCases } from "../cases/json.mjs"

const gradeOf = (cases, id) => cases.find((c) => c.id === id).grade
const TEXT9 = "9 不是质数。"

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

test("textRules：段落/汉字/句数/次数/否定式/数字禁用", () => {
  const text = "夜里的城市换上另一副面孔。\n\n霓虹在雨里显得固执\n\n霓虹又亮了一次"
  const r = textRules(text, [
    { kind: "paragraphCount", count: 3 },
    { kind: "startsWith", char: "夜" },
    { kind: "tokenCount", token: "霓虹", min: 2 },
    { kind: "notContains", tokens: ["，"] },
  ])
  assert.equal(r.pass, true, r.detail)

  const bad = textRules("夜里，城市。", [
    { kind: "notContains", tokens: ["，"] },
    { kind: "hanziMin", min: 10 },
  ])
  assert.equal(bad.pass, false)
  assert.match(bad.detail, /禁用/)

  assert.equal(textRules("第一句。第二句。", [{ kind: "sentenceCount", count: 2 }]).pass, true)
  assert.equal(textRules("句子含1个数字。", [{ kind: "noArabicDigits" }]).pass, false)
  assert.equal(textRules("短句。", [{ kind: "hanziPerSentenceMax", max: 40 }]).pass, true)
})

test("countEnumerations / enumerateCount：恰 3 项（行内编号或非空行两式任一）", () => {
  assert.equal(countEnumerations("1. 甲 2. 乙 3. 丙").markers, 3)
  assert.equal(textRules("甲\n乙\n丙", [{ kind: "enumerateCount", count: 3 }]).pass, true, "非空行 = 3 亦可")
  assert.equal(textRules("1. 甲 2. 乙 3. 丙 4. 丁", [{ kind: "enumerateCount", count: 3 }]).pass, false, "多于 3 项必 FAIL")
  assert.equal(textRules("①甲②乙③丙", [{ kind: "enumerateCount", count: 3 }]).pass, true, "圈号编号")
  assert.equal(textRules("- 甲\n- 乙\n- 丙", [{ kind: "enumerateCount", count: 3 }]).pass, true, "项目符")
})

test("keywordSet / colorMatch：闭词表与颜色族归一化", () => {
  assert.equal(keywordSet("9 不是质数", ["不是质数", "非质数"]).hit, true)
  assert.equal(keywordSet("3×3", ["3x3"]).hit, false)
  assert.equal(keywordSet("9 = 3*3", ["3*3"]).hit, true)
  assert.equal(keywordSet("22:00", [/22\s*[:：]\s*00/]).hit, true)
  assert.equal(colorMatch("#FF0000", "red").hit, true)
  assert.equal(colorMatch("红色。", "red").matched, "红色")
  assert.equal(colorMatch("蓝色", "red").hit, false)
  assert.ok(COLOR_FAMILIES.green.includes("#00aa00"), "8×8 纯绿图的 HEX 应在绿色族内")
})

test("题集判分（端到端用夹具结果）：reasoning / json 各例正反", () => {
  const r1 = gradeOf(reasoningCases, "reasoning.1")({ text: "3" })
  assert.equal(r1.pass, true)
  assert.equal(gradeOf(reasoningCases, "reasoning.1")({ text: "13" }).pass, false)
  assert.equal(gradeOf(reasoningCases, "reasoning.3")({ text: TEXT9 }).pass, true)
  const j1 = gradeOf(jsonCases, "json.1")({ text: '{"name":"小明","age":9,"tags":["a","b"]}' })
  assert.equal(j1.pass, true)
  assert.equal(gradeOf(jsonCases, "json.1")({ text: '```json\n{"name":"小明","age":9,"tags":["a","b"]}\n```' }).pass, false)
  const code1 = gradeOf(codeCases, "code.1")({ text: "function chunkEven(arr, size){ if (size<1) throw new RangeError('x'); const o=[]; for(let i=0;i<arr.length;i+=size) o.push(arr.slice(i,i+size)); return o }" })
  assert.equal(code1.pass, true)
})
