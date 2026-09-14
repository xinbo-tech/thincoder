/**
 * model-specs.test.mjs — MODEL_SPECS 查表层核内行为面（DEEPSEEK-QWENPLAN 批：qwen-plan 渠道名
 * `deepseek-v4.1-flash` 接入——R21 / N10 / N11 · 批次档 §2 AC A-1..A-4 / 用例 T-1..T-5）。
 *
 * 断言面 = 行为面：specForModel / specMatch 返回形状 + 显式字段值——无逐字子串散文锚。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { specForModel, specMatch } from "../model-specs.mjs"

// qwen-plan 渠道名（token-plan GET /models 2026-09-15 实测）——字段逐字对齐 deepseek-flash 行
const CHANNEL = "deepseek-v4.1-flash"
const FLASH = "deepseek-flash"

/** Unknown-model lookup warns once (warnUnknownModel) — silence it so the fallback call keeps output clean. */
function silent(fn) {
  const orig = console.warn
  console.warn = () => {}
  try { return fn() } finally { console.warn = orig }
}

test("T-1/A-1 deepseek-v4.1-flash resolves per-field identical to deepseek-flash (1M ctx — no 128K fallback)", () => {
  const spec = specForModel(CHANNEL)
  assert.deepEqual(spec, specForModel(FLASH), "per-field deepEqual against the deepseek-flash row")
  assert.equal(spec.context, 1_000_000)
  assert.equal(spec.maxOutput, 384_000)
  assert.equal(spec.thinking, true)
  assert.equal(spec.prefixMode, true)
  assert.equal(spec.cacheMode, "auto")
  assert.equal(spec.multimodal, true, "multimodal true — user ruling 04:01")
})

test("T-2/A-2 specMatch(channel) reports matched:true — unknown-model fallback not entered", () => {
  const r = specMatch(CHANNEL)
  assert.equal(r.matched, true)
  assert.deepEqual(r.spec, specForModel(FLASH))
})

test("T-3/A-3 the new row shadows nothing — retired names still hit their own rows", () => {
  for (const retired of ["deepseek-v4-flash", "deepseek-v4-flash-0731"]) {
    const spec = specForModel(retired)
    assert.equal(spec.context, 1_000_000, `${retired} keeps the retired row (1M)`)
    assert.equal(spec.multimodal, true, `${retired} keeps the retired row (multimodal)`)
  }
})

test("T-4/A-3 deepseek-v4-pro stays the conservative row (no multimodal)", () => {
  const pro = specForModel("deepseek-v4-pro")
  assert.equal(pro.context, 1_000_000)
  assert.equal(pro.multimodal, undefined)
})

test("T-5 unknown model still falls back to DEFAULT_SPEC with matched:false", () => {
  const model = "deepseek-no-such-model-x"
  const r = silent(() => specMatch(model))
  assert.equal(r.matched, false)
  assert.equal(r.spec.context, 128_000, "128K fallback unchanged")
  assert.equal(r.spec.maxOutput, 32_000)
  assert.equal(specForModel(model), r.spec, "specForModel shares the same fallback spec")
})