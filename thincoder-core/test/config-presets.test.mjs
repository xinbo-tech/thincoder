/**
 * config-presets.test.mjs — 渠道预设表并入面用例（设计 `docs/core/design/MODEL-SPECS.md` §9.7 / §9.9
 * 用例 P-1…P-4；批 2026-09-20-channel-onboarding）。
 *
 * 断言面 = 行为面：预设计数 / 条目形状 / 预设默认模型命中规格行 / 预置取值随模型上限同变（D-13「不设 = 不发」的预设面 +
 * D-14 判据面的模型侧前提）。白名单 = 尚未登记规格行的预设——**只减不增**（行补上 ⇒ 从名单删名）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { PROVIDER_PRESETS, presetToEntry } from "../config-presets.mjs"
import { specMatch } from "../model-specs.mjs"

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
