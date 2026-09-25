/**
 * config-presets.test.mjs — 渠道预设表并入面用例（设计 `docs/core/design/MODEL-SPECS.md` §9.7 / §9.9
 * 用例 P-1…P-4；批 2026-09-20-channel-onboarding。§14.7/§14.8 用例 C-7/C-8；批 2026-09-25-model-specs-cleanup。
 * §15.3 / §15.6-§15.7 用例 P-5…P-7；批 2026-09-25-spec-effort——六对 `maxTokens` 逐对对齐）。
 *
 * 断言面 = 行为面：预设计数 / 条目形状 / 预设默认模型命中规格行 / 预置取值随模型上限同变（D-13「不设 = 不发」的预设面 +
 * D-14 判据面的模型侧前提）。白名单两处、面不同：`NO_SPEC_ROW` = 尚未登记规格行的预设（行补上 ⇒ 删名）；
 * `OVER_LIMIT` = 预置 `maxTokens` 超规格行 `maxOutput` 的预设——本批六对逐对对齐后为**空名单**（绊网保留，§15.3）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { PROVIDER_PRESETS, presetToEntry } from "../config-presets.mjs"
import { specForModel, specMatch } from "../model-specs.mjs"

/** §9.9 P-3 白名单：未登记规格行的预置（本批 volcengine 改值后出名单）。 */
const NO_SPEC_ROW = ["hunyuan", "siliconflow", "groq"]

test("P-1 预设面计数 21：tokenhub 入列（新增渠道 = 计数同变面）", () => {
  assert.equal(Object.keys(PROVIDER_PRESETS).length, 21)
  assert.ok("tokenhub" in PROVIDER_PRESETS, "tokenhub 在列")
})

test("P-2 tokenhub 条目：baseURL + hy3（命中规格行）+ thinking / reasoningEffort / maxTokens 一律不设", () => {
  const p = PROVIDER_PRESETS.tokenhub
  assert.equal(p.baseURL, "https://tokenhub.tencentmaas.com/v1")
  assert.equal(p.model, "hy3")
  assert.equal(specMatch(p.model).matched, true, "默认模型命中规格行（非 128K 兜底面）")
  for (const k of ["thinking", "reasoningEffort", "maxTokens"]) {
    assert.equal(k in p, false, `tokenhub 不设 ${k}（D-13：未测载荷面 = 不发）`)
  }
  const entry = presetToEntry("tokenhub")
  assert.equal(entry.desc, undefined, "构建器剥 desc（存储条目不带展示字段）")
  assert.equal(entry.baseURL, p.baseURL, "构建器保留渠道字段")
  assert.equal(entry.model, "hy3", "构建器保留单值 model（新装启动种子）")
})

test("P-3 预设默认模型零落面：除白名单外全部命中规格行（白名单只减不增）", () => {
  const misses = []
  const orig = console.warn
  console.warn = () => {} // 白名单成员必然告警（未登记名）——本用例只断落面集
  try {
    for (const [name, p] of Object.entries(PROVIDER_PRESETS)) {
      if (!specMatch(p.model).matched) misses.push(name)
    }
  } finally { console.warn = orig }
  assert.deepEqual(misses.toSorted(), [...NO_SPEC_ROW].toSorted(), `落面集恒等于白名单：${JSON.stringify(misses)}`)
  assert.equal(misses.includes("volcengine"), false, "volcengine 出名单（改值后命中方舟新行）")
  assert.ok(misses.length <= 3, "白名单只减不增")
})

test("P-4 volcengine 预置 maxTokens 随改指模型同变（seed-code 实测上限 131072 · 批 DR-5）", () => {
  assert.equal(PROVIDER_PRESETS.volcengine.maxTokens, 131072, "预置 maxTokens 随改指模型同变（= seed-code 实测输出上限）")
})

/** §15.3 / §15.6-AC-4 超限白名单——本批六对逐对对齐后 = **空名单**（超限集 ∅；绊网保留：任一预设再超限即红）。
 *  与 `NO_SPEC_ROW` 不同源：本名单 = 超限集，非「无规格行」集（兜底三名的覆盖缺口由后者持续可见——两轴解耦）。 */
const OVER_LIMIT = []

test("C-7 deepseek 预置 maxTokens 384_000 ∧ ≤ 规格行 maxOutput（#19 · §14.2 #13）", () => {
  const p = PROVIDER_PRESETS.deepseek
  assert.equal(p.maxTokens, 384_000, "预置 maxTokens 降值（393216 → 384_000）")
  assert.ok(p.maxTokens <= specForModel(p.model).maxOutput, `预置 ≤ 规格行（${p.model} 行 = 384_000）`)
})

test("P-5 六对逐对：预置 maxTokens ≤ 生效基准；真行三对另断 = 行值（§15.3）", () => {
  // 真行三对（`row: true`）= 降**行值**；兜底三对 = 降**生效基准**（`DEFAULT_SPEC` 32_000 占位，非该三名真实上限被证）。
  const PAIRS = [
    { name: "grok",        model: "grok-4.5",                        value: 64_000, row: true },
    { name: "mistral",     model: "mistral-large",                   value: 32_000, row: true },
    { name: "openrouter",  model: "anthropic/claude-sonnet-4",       value: 32_000, row: true },
    { name: "hunyuan",     model: "hunyuan-pro",                     value: 32_000, row: false },
    { name: "siliconflow", model: "deepseek-ai/DeepSeek-V3",         value: 32_000, row: false },
    { name: "groq",        model: "llama-3.3-70b-versatile",         value: 32_000, row: false },
  ]
  const orig = console.warn
  console.warn = () => {} // 兜底三对（无规格行）查表必然告警——本用例只断取值面
  try {
    for (const { name, model, value, row } of PAIRS) {
      const p = PROVIDER_PRESETS[name]
      assert.equal(p.model, model, `${name} 预置默认模型未漂移`)
      assert.equal(p.maxTokens, value, `${name} 预置 maxTokens = ${value}`)
      assert.ok(p.maxTokens <= specForModel(p.model).maxOutput, `${name} ≤ 生效基准（不变式）`)
      if (!row) continue
      assert.equal(specMatch(p.model).matched, true, `${name} 命中真行`)
      assert.equal(p.maxTokens, specForModel(p.model).maxOutput, `${name} 真行对 = 行值（另断）`)
    }
  } finally { console.warn = orig }
})

test("P-6 全预设逐条不变式：超限集 = 空名单（绊网——僵尸名单红 / 新增超限红，双向）", () => {
  const orig = console.warn
  console.warn = () => {} // 无规格行的预置（hunyuan / siliconflow / groq）必然告警——本用例只断超限集
  let over = []
  try {
    for (const [name, p] of Object.entries(PROVIDER_PRESETS)) {
      if (!("maxTokens" in p)) continue // 不设 = 不发（D-13 同则）
      if (p.maxTokens > specForModel(p.model).maxOutput) over.push(name)
    }
  } finally { console.warn = orig }
  over = over.toSorted()
  assert.deepEqual(over, [...OVER_LIMIT].toSorted(), `超限集 ≠ 白名单：${JSON.stringify(over)}（任一新超限即红）`)
  assert.deepEqual(over, [], "超限集 ∅——六对逐对对齐后零存量（§15.3）")
})

test("P-7 兜底三对：无规格行（matched false）∧ 生效基准 = DEFAULT_SPEC 32_000（对齐可复算）", () => {
  const orig = console.warn
  console.warn = () => {}
  try {
    for (const name of ["hunyuan", "siliconflow", "groq"]) {
      const p = PROVIDER_PRESETS[name]
      assert.equal(specMatch(p.model).matched, false, `${name} 无规格行（覆盖缺口持续可见——挂 #11，不本批建行）`)
      assert.equal(specForModel(p.model).maxOutput, 32_000, `${name} 生效基准 = DEFAULT_SPEC 兜底值`)
      assert.equal(p.maxTokens, 32_000, `${name} 对齐至生效基准（不等同真实上限已证）`)
    }
  } finally { console.warn = orig }
})
