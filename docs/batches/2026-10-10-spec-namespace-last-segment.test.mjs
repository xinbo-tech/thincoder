/**
 * 2026-10-10-spec-namespace-last-segment.test.mjs — 批内件（spec-namespace-last-segment · 台账 #1167）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根（thincoder/）：
 *   node --test docs/batches/2026-10-10-spec-namespace-last-segment.test.mjs
 *
 * 用例 = 设计档 `docs/core/design/MODEL-SPECS.md` §17.6 表 12 条逐条对应（U-1..U-9 ∥ [vsc] V-1..V-3）：
 *   U-1..U-4 双段外标命中 / 长前缀先命中 / 大小写变体同判 / 既有面零回归（R22①–④）
 *   U-5 未知名兜底 + 告警一次（R22⑤）· U-6 只取末段、不回扫中间段（认账的行为变更——N13）
 *   U-7 尾斜杠直扫即中 · U-8 首位斜杠守卫不动 · U-9 前导斜杠 + 多段取末段
 *   V-1..V-3 VSC 同判（effort 默认档随末段重试 / 单段零回归 / 未知名零档）
 * 断言面 = 业务可观察结果（`matched` / spec 字段值 / `reasoningEffortDefault`）；「命中行 = 哪一行」
 * 以同名裸名直扫（单段、无兜底）命中行的对象同一性为对照。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const { specMatch } = await import(pathToFileURL(join(ROOT, "thincoder-core/model-specs.mjs")).href)
const { specForModel: vscSpecForModel } = await import(pathToFileURL(join(ROOT, "thincoder-vscode/src/specs.mjs")).href)

const DEFAULT = { context: 128_000, maxOutput: 32_000 } // 核 DEFAULT_SPEC（未知名回落立面）

/** 对照面：同名裸名走完整名直扫（单段、无兜底）——命中行 = 同一表行对象。 */
function rowOf(bare) {
  const r = specMatch(bare)
  assert.equal(r.matched, true, `对照：裸名 ${bare} 直扫在册`)
  return r.spec
}

test("U-1 正常：qwen/ZHIPU/GLM-5.3 ⇒ matched:true ∧ spec = glm-5.3 行（R22①）", () => {
  const r = specMatch("qwen/ZHIPU/GLM-5.3")
  assert.equal(r.matched, true)
  assert.equal(r.spec, rowOf("glm-5.3"), "命中行 = glm-5.3 表行（对象同一）")
  assert.equal(r.spec.context, 1_000_000)
  assert.equal(r.spec.maxOutput, 128_000)
})

test("U-2 正常：qwen/ZHIPU/GLM-5.3-FlashX ⇒ 长前缀先命中 glm-5.3-flashx 行（R22②）", () => {
  const r = specMatch("qwen/ZHIPU/GLM-5.3-FlashX")
  assert.equal(r.matched, true)
  assert.equal(r.spec, rowOf("glm-5.3-flashx"), "命中行 = glm-5.3-flashx 表行")
  assert.equal(r.spec.context, 1_000_000)
  assert.equal(r.spec.maxOutput, 131_072)
})

test("U-3 边界：Qwen/ZHIPU/GLM-5.3 与 U-1 同判（大小写不敏感）（R22③）", () => {
  const r = specMatch("Qwen/ZHIPU/GLM-5.3")
  assert.equal(r.matched, true)
  assert.equal(r.spec, rowOf("glm-5.3"))
  assert.deepEqual(r, specMatch("qwen/ZHIPU/GLM-5.3"), "与小写变体逐字段同判")
})

test("U-4 回归：单段 / 裸名 / 单段对照 逐名与批前同判（单段名两法等价）（R22④）", () => {
  const rows = [
    ["ZHIPU/GLM-5.3", "glm-5.3"],
    ["glm-5.3-flash", "glm-5.3-flash"],
    ["qwen/qwen3.7-max", "qwen3.7-max"],
    ["deepseek/deepseek-flash", "deepseek-flash"],
  ]
  for (const [input, bare] of rows) {
    const r = specMatch(input)
    assert.equal(r.matched, true, `${input} 命中`)
    assert.equal(r.spec, rowOf(bare), `${input} ⇒ 与裸名 ${bare} 同一表行`)
  }
})

test("U-5 错误：zzz/unknown-x ⇒ matched:false ∧ DEFAULT_SPEC ∧ 告警一次（R22⑤）", () => {
  const warns = []
  const origWarn = console.warn
  console.warn = (...args) => { warns.push(args.join(" ")) }
  let first, second
  try {
    first = specMatch("zzz/unknown-x")
    second = specMatch("zzz/unknown-x") // 二次调用 = dedupe 面
  } finally {
    console.warn = origWarn
  }
  assert.equal(first.matched, false)
  assert.equal(first.spec.context, DEFAULT.context)
  assert.equal(first.spec.maxOutput, DEFAULT.maxOutput)
  assert.equal(second.spec, first.spec, "两次均 = 同一 DEFAULT_SPEC 对象")
  assert.equal(warns.filter((w) => w.includes("zzz/unknown-x")).length, 1, "告警一次（dedupe 面零变）")
})

test("U-6 边界：qwen/glm-5.3/zzz ⇒ matched:false（只取末段、不回扫中间段）（N13）", () => {
  const r = specMatch("qwen/glm-5.3/zzz")
  assert.equal(r.matched, false, "末段 zzz 无行——不得回扫中间段 glm-5.3")
  assert.equal(r.spec.context, DEFAULT.context)
  assert.equal(r.spec.maxOutput, DEFAULT.maxOutput)
})

test("U-7 边界：glm-5.3/（尾斜杠）⇒ 直扫即中 glm-5.3 行（兜底支不可达）", () => {
  const r = specMatch("glm-5.3/")
  assert.equal(r.matched, true)
  assert.equal(r.spec, rowOf("glm-5.3"))
  assert.equal(r.spec.context, 1_000_000)
  assert.equal(r.spec.maxOutput, 128_000)
})

test("U-8 边界：/glm-5.3 ⇒ 兜底不触发（slash > 0 门保持）⇒ matched:false（与批前同判）", () => {
  const r = specMatch("/glm-5.3")
  assert.equal(r.matched, false)
  assert.equal(r.spec.context, DEFAULT.context)
  assert.equal(r.spec.maxOutput, DEFAULT.maxOutput)
})

test("U-9 边界：/qwen/glm-5.3（前导斜杠 + 多段）⇒ 取末段命中 glm-5.3 行", () => {
  const r = specMatch("/qwen/glm-5.3")
  assert.equal(r.matched, true)
  assert.equal(r.spec, rowOf("glm-5.3"))
})

test("V-1 [vsc] 正常：specForModel(qwen/ZHIPU/GLM-5.3) ⇒ reasoningEffortDefault === \"max\"（R22 同判）", () => {
  const s = vscSpecForModel("qwen/ZHIPU/GLM-5.3")
  assert.equal(s.reasoningEffortDefault, "max", "glm-5 前缀条目命中（末段重试）")
  assert.equal(s.context, 1_000_000, "核规格行同拍命中（glm-5.3 行）")
  assert.equal(s.maxOutput, 128_000)
})

test("V-2 [vsc] 回归：specForModel(ZHIPU/GLM-5.3) ⇒ reasoningEffortDefault === \"max\"（单段零回归）", () => {
  assert.equal(vscSpecForModel("ZHIPU/GLM-5.3").reasoningEffortDefault, "max")
})

test("V-3 [vsc] 边界：specForModel(zzz/unknown-x) ⇒ reasoningEffortDefault === undefined ∧ spec = 核 DEFAULT_SPEC 立面", () => {
  const s = vscSpecForModel("zzz/unknown-x")
  assert.equal(s.reasoningEffortDefault, undefined, "未知名不过匹配")
  assert.equal(s.context, DEFAULT.context)
  assert.equal(s.maxOutput, DEFAULT.maxOutput)
})
