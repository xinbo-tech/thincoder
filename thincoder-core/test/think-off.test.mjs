/**
 * think-off.test.mjs — off 形族单源叶档（`think-off.mjs`）行为面（批 2026-09-25-off-family-closeout ·
 * 设计 `docs/core/design/MODEL-SPECS.md` §16.2 / §16.4 · 用例 T-1..T-4 / AC-1）。
 *
 * 断言面 = 行为面：两函数对 `specForModel` 真行的返回值（不扫源码文本、不做散文锚）；
 * 采样名单 = §16.8 AC-1 逐名（true 组 / false 组——三分同源）。
 * `thinkOffShape` = 写面取形（四处生产者共用的形），`thinkOffPath` = 「何时可宣称 OFF」判据。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { specForModel } from "../model-specs.mjs"
import { thinkOffShape, thinkOffPath } from "../think-off.mjs"

/** AC-1 false 组：effort 族枚举无 `none` / 无枚举 + 服务端强制族（`thinkAlwaysOn`）。 */
const NO_PATH = ["kimi-k3", "k3-256k", "qwen3.8-max", "qwen3.7-plus", "glm-5.3", "glm-5.3-flash", "glm-5.3-flashx"]

test("T-1 正常：有有效 off 路径的族 ⇒ thinkOffPath true（含 `{type:\"disabled\"}` 达载荷层两例）", () => {
  for (const model of ["hy3", "qwen3.7-flash", "deepseek-v4-flash", "mimo-v2.5"]) {
    assert.equal(thinkOffPath(specForModel(model)), true, `${model}：有效 off 路径`)
  }
  assert.equal(thinkOffShape(specForModel("hy3")), null, "effort 族取形 = `null`（载荷层 off 门首款要求）")
  assert.deepEqual(thinkOffShape(specForModel("deepseek-v4-flash")), { type: "disabled" },
    "type 族默认取形 = `{type:\"disabled\"}`（达载荷层）")
})

test("T-2 边界：effort 族枚举不含 `none` / 无枚举 ⇒ false（形不发任何字段）", () => {
  for (const model of ["kimi-k3", "k3-256k", "qwen3.8-max", "qwen3.7-plus"]) {
    assert.equal(specForModel(model).thinkApi, "effort", `${model}：前提——effort 族`)
    assert.equal(thinkOffPath(specForModel(model)), false, `${model}：无有效 off 路径（枚举无 none / 无枚举）`)
    assert.equal(thinkOffShape(specForModel(model)), null, `${model}：写面取形仍 = \`null\`（形 ≠ 判据）`)
  }
})

test("T-3 边界：服务端强制族（glm-5.3 三行）⇒ false ∧ 三行 `thinkAlwaysOn` 在场（防空扫）", () => {
  for (const model of ["glm-5.3", "glm-5.3-flash", "glm-5.3-flashx"]) {
    assert.equal(specForModel(model).thinkAlwaysOn, true, `${model}：机制位在场且为 true（本用例判据前提）`)
    assert.equal(specForModel(model).thinkApi, "type", `${model}：前提——type 族（形 = {type:"disabled"}）`)
    assert.equal(thinkOffPath(specForModel(model)), false, `${model}：服务端强制族 ⇒ 无有效 off 路径`)
  }
  assert.equal(specForModel("glm-5.2").thinkAlwaysOn, undefined, "未取证行不声明（D-11）⇒ 判据落默认侧")
  assert.equal(thinkOffPath(specForModel("glm-5.2")), true, "glm-5.2 默认侧 = true（type 形 + 未标 thinkAlwaysOn）")
})

test("T-4 边界：自定义开值族（MiniMax-M3 / minimax-m3）⇒ true（`{type:\"disabled\"}` 达载荷层）", () => {
  for (const model of ["MiniMax-M3", "minimax-m3"]) {
    assert.equal(specForModel(model).thinkEnabledValue, "adaptive", `${model}：前提——自定义开值族`)
    assert.deepEqual(thinkOffShape(specForModel(model)), { type: "disabled" },
      `${model}：off 形 = {type:"disabled"}（§15.4-2 表改判后——off 可达）`)
    assert.equal(thinkOffPath(specForModel(model)), true, `${model}：有效 off 路径`)
  }
})
