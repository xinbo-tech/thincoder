/**
 * 2026-10-10-gemini-model-specs.test.mjs — 批内件（gemini-model-specs · 台账 #1198）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根（thincoder/）：
 *   node --test docs/batches/2026-10-10-gemini-model-specs.test.mjs
 *
 * 用例 = 设计档 `docs/core/design/MODEL-SPECS.md` §18.7 表 G-1..G-7 逐条对应：
 *   G-1 / G-2 两新行逐字段在场（deepEqual 全 5 键）+ specMatch matched:true（AC-1）
 *   G-3 大小写变体同判 ∥ `-preview` 同族名经前缀继承命中本行（有意继承）
 *   G-4 `gemini-3.9-flash` ∥ 裸段 `gemini-3.8` ⇒ matched:false + DEFAULT_SPEC + 告警一次（dedupe 面零变）（AC-2）
 *   G-5 存量 gemini 四行回归（取值逐字段不变；`gemini-3.1-pro` 尺寸行零改）（AC-2）
 *   G-6 thinkOffPath === false + 机制位五键全 undefined（不声明面）（AC-3）
 *   G-7 outputReserve 65_536 ∥ resolveCompactThreshold 两态（589_824 / 624_230）（AC-4）
 * 断言面 = 业务可观察结果（spec 字段值 / matched / 告警次数 / 阈值读数）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const { specForModel, specMatch } = await import(pathToFileURL(join(ROOT, "thincoder-core/model-specs.mjs")).href)
const { outputReserve, resolveCompactThreshold } = await import(pathToFileURL(join(ROOT, "thincoder-core/config.mjs")).href)
const { thinkOffPath } = await import(pathToFileURL(join(ROOT, "thincoder-core/think-off.mjs")).href)

const DEFAULT = { context: 128_000, maxOutput: 32_000 } // 核 DEFAULT_SPEC（未知名回落立面）
const NEW_ROW = { context: 1_048_576, maxOutput: 65_536, thinking: true, thinkAlwaysOn: true, multimodal: true } // §18.2 两行同形

test("G-1 正常：specForModel(gemini-3.8-flash) deepEqual 全 5 键 ∧ specMatch matched:true（AC-1）", () => {
  assert.deepEqual(specForModel("gemini-3.8-flash"), NEW_ROW)
  const r = specMatch("gemini-3.8-flash")
  assert.equal(r.matched, true)
  assert.deepEqual(r.spec, NEW_ROW)
})

test("G-2 正常：gemini-3.7-flash 同 G-1（两行同形、各自独立行）", () => {
  assert.deepEqual(specForModel("gemini-3.7-flash"), NEW_ROW)
  const r = specMatch("gemini-3.7-flash")
  assert.equal(r.matched, true)
  assert.deepEqual(r.spec, NEW_ROW)
  assert.notEqual(r.spec, specMatch("gemini-3.8-flash").spec, "两行各自独立（非同一对象）")
})

test("G-3 边界：GEMINI-3.8-FLASH 大小写同判 ∥ gemini-3.8-flash-preview 前缀继承命中本行", () => {
  const lower = specMatch("gemini-3.8-flash")
  assert.equal(specMatch("GEMINI-3.8-FLASH").matched, true, "大小写不敏感")
  assert.deepEqual(specMatch("GEMINI-3.8-FLASH"), lower, "与小写变体逐字段同判")
  const preview = specMatch("gemini-3.8-flash-preview")
  assert.equal(preview.matched, true, "-preview 同族名经前缀继承命中（有意继承）")
  assert.equal(preview.spec, lower.spec, "命中本行同对象")
})

test("G-4 错误：gemini-3.9-flash ∥ 裸段 gemini-3.8 ⇒ matched:false + DEFAULT_SPEC + 告警一次（AC-2）", () => {
  const warns = []
  const origWarn = console.warn
  console.warn = (...args) => { warns.push(args.join(" ")) }
  let a1, a2, b1
  try {
    a1 = specMatch("gemini-3.9-flash")
    a2 = specMatch("gemini-3.9-flash") // 二次调用 = dedupe 面
    b1 = specMatch("gemini-3.8") // 裸段（无行）
  } finally {
    console.warn = origWarn
  }
  for (const r of [a1, a2, b1]) {
    assert.equal(r.matched, false)
    assert.equal(r.spec.context, DEFAULT.context)
    assert.equal(r.spec.maxOutput, DEFAULT.maxOutput)
  }
  assert.equal(a2.spec, a1.spec, "两次均 = 同一 DEFAULT_SPEC 对象")
  assert.equal(warns.filter((w) => w.includes("gemini-3.9-flash")).length, 1, "gemini-3.9-flash 告警一次")
  assert.equal(warns.filter((w) => w.includes("gemini-3.8")).length, 1, "裸段 gemini-3.8 告警一次")
})

test("G-5 回归：存量 gemini 四行逐名与批前同判（取值逐字段不变）（AC-2）", () => {
  const rows = [
    ["gemini-3-pro",     { context: 1_000_000, maxOutput: 64_000, thinking: false, multimodal: true, format: "google", noUsageStream: true }],
    ["gemini-2.5-pro",   { context: 2_000_000, maxOutput: 64_000, thinking: false, multimodal: true, format: "google", noUsageStream: true }],
    ["gemini-2.5-flash", { context: 1_000_000, maxOutput: 64_000, thinking: false, multimodal: true, format: "google", noUsageStream: true }],
    ["gemini-3.1-pro",   { context: 1_048_576, maxOutput: 65_536 }],
  ]
  for (const [name, expected] of rows) {
    const r = specMatch(name)
    assert.equal(r.matched, true, `${name} 命中`)
    assert.deepEqual(r.spec, expected, `${name} 取值逐字段不变`)
  }
})

test("G-6 边界：thinkOffPath === false ∧ 机制位五键全 undefined（AC-3）", () => {
  for (const name of ["gemini-3.8-flash", "gemini-3.7-flash"]) {
    const spec = specForModel(name)
    assert.equal(thinkOffPath(spec), false, `${name} 恒思考族（无有效 off 路径）`)
    for (const key of ["thinkApi", "reasoningEffortEnum", "tempRange", "noUsageStream", "format"]) {
      assert.equal(spec[key], undefined, `${name}.${key} 不声明`)
    }
  }
})

test("G-7 正常：outputReserve 65_536 ∥ resolveCompactThreshold 两态读数（AC-4）", () => {
  const spec = specForModel("gemini-3.8-flash")
  assert.equal(outputReserve({ model: "gemini-3.8-flash" }, spec), 65_536, "无显式 maxTokens ⇒ 预留 = spec maxOutput")
  assert.deepEqual(resolveCompactThreshold(null, { model: "gemini-3.8-flash" }), { value: 589_824, auto: true })
  assert.deepEqual(resolveCompactThreshold(null, { model: "gemini-3.8-flash", maxTokens: 8192 }), { value: 624_230, auto: true })
})
