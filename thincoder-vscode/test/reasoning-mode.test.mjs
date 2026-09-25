/**
 * reasoning-mode.test.mjs — VSC 主模型面 off 取形（批 2026-09-25-off-family-closeout · 设计
 * `docs/core/design/MODEL-SPECS.md` §16.2 生产者表第 3 行 / §15.4-2 · 用例 R-1..R-3 / AC-3；
 * 该面首测——原无既有测试档）。
 *
 * 断言面 = 行为面：`resolveReasoningMode` 三支返回对象的族别字面量（纯函数直驱，扩展宿主外可跑）。
 * R-1 = 台账 #335 本体（type 族 off 旧式全族落 `null` ⇒ 不发字段 = 未达载荷层）；
 * R-2 = 族别形（effort 族 / 自定义开值族）；R-3 = 既有 `enabled` / 档位两支逐字零变。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveReasoningMode } from "../src/extension/reasoning-mode.mjs"
import { specForModel } from "../src/specs.mjs"
import { thinkOffPath } from "@thincoder/core/think-off.mjs"

/** 产线调用形（`panel-turn-stages.mjs:98` 同式：`specForModel` 由调用方注入）。 */
const call = (reasoning, model) => resolveReasoningMode(reasoning, model, specForModel)

test("R-1 正常：`off` / `none`（type 族默认）⇒ `{type:\"disabled\"}` 达载荷层（#335 本体）", () => {
  for (const model of ["deepseek-v4-flash", "mimo-v2.5"]) {
    assert.equal(specForModel(model).thinkApi, "type", `${model}：前提——type 族（形 = {type:"disabled"}）`)
    assert.deepEqual(call("off", model), { thinking: { type: "disabled" }, reasoningEffort: null }, `${model}：off ⇒ off 形达载荷层`)
    assert.deepEqual(call("none", model), { thinking: { type: "disabled" }, reasoningEffort: null }, `${model}：\`none\` 档同径`)
  }
})

test("R-2 边界：族别形（effort 族 ⇒ `null`；自定义开值族 ⇒ `{type:\"disabled\"}`）", () => {
  assert.deepEqual(call("off", "hy3"), { thinking: null, reasoningEffort: null },
    "effort 族 = `null`（载荷层 off 门首款要求——`{type:\"disabled\"}` 不开门）")
  assert.deepEqual(call("off", "minimax-m3"), { thinking: { type: "disabled" }, reasoningEffort: null },
    "自定义开值族随 §15.4-2 表改判（实测 off 路径 = thinking:{type:\"disabled\"}）")
  assert.deepEqual(call("off", "glm-5.3-flashx"), { thinking: { type: "disabled" }, reasoningEffort: null },
    "强制族取形照旧（该族本不渲染 off 入口——判据面 = §16.4）")
  assert.equal(thinkOffPath(specForModel("glm-5.3-flashx")), false,
    "强制族：取形照旧（写面形 ≠ 判据面），但无有效 off 路径 ⇒ 入口面不提供（§16.4）")
  assert.equal(thinkOffPath(specForModel("deepseek-v4-flash")), true,
    "对照：type 族默认 ⇒ 有效 off 路径（取形与可宣称性两函数不得混为一谈）")
})

test("R-3 回归：`enabled` / 档位两支逐字零变（+ 中性档零 patch）", () => {
  assert.deepEqual(call("enabled", "deepseek-v4-flash"), { thinking: { type: "enabled" } },
    "type 族：enable 形；无 reasoningEffort 键")
  assert.deepEqual(call("enabled", "minimax-m3"), { thinking: { type: "adaptive" } },
    "自定义开值族：`thinkEnabledValue` 生效")
  assert.deepEqual(call("enabled", "hy3"), { thinking: { type: "enabled" }, reasoningEffort: null },
    "effort 族：enable 形 + 清档（基线字面）")
  assert.deepEqual(call("high", "deepseek-v4-flash"), { reasoningEffort: "high", thinking: undefined },
    "档位支：写档 + `undefined` 覆盖 merge（清 prior off 标记）")
  assert.deepEqual(call("", "deepseek-v4-flash"), {}, "中性档 `\"\"` ⇒ 空 patch（回合侧零 patch 前提）")
})
