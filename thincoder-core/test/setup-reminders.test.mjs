/**
 * setup-reminders.test.mjs — 提醒面单点（#113 VSC 侧并入）。
 *
 * 行为面：`pushInjections`（机器行专用注入——单条/数组/非法条目静默跳过/同文去重/
 * transient 标记）· `appendImagePointer`（粘贴图指引——depth>0 no-op / 空图 no-op /
 * 非多模态模型可见报错 / 多模态模型追加指引）· `envStateLine` 形态（回归锚）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { envStateLine, pushInjections, appendImagePointer } from "../agent/setup-reminders.mjs"

test("envStateLine：形态锚（mode / model / slot / resumed 四字段）", () => {
  const line = envStateLine({ mode: "eng", model: "kimi-k3", slot: 3, resumed: true })
  assert.match(line, /^\[System reminder: env: /)
  assert.ok(line.includes("mode: eng"))
  assert.ok(line.includes("model: kimi-k3"))
  assert.ok(line.includes("slot: 3"))
  assert.ok(line.includes("resumed: yes"))
  assert.ok(envStateLine({ mode: "normal", model: "m", slot: null, resumed: false }).includes("resumed: no"))
})

test("#113 pushInjections：单条 / 数组 / 非法条目跳过 / transient 标记", () => {
  const history = []
  pushInjections(history, { content: "one" })
  pushInjections(history, [{ content: "two" }, { content: "three" }])
  pushInjections(history, [null, {}, { content: 42 }, "raw-string"])
  assert.deepEqual(history.map((m) => m.content), ["one", "two", "three"])
  assert.ok(history.every((m) => m.transient === true && m.role === "user"))
  pushInjections(history, null)
  pushInjections(history, undefined)
  assert.equal(history.length, 3, "空输入 no-op")
})

test("#113 pushInjections：同文去重（幂等注入）——已有等文消息则跳过该条", () => {
  const history = [{ role: "user", content: "ctx-A" }]
  pushInjections(history, [{ content: "ctx-A" }, { content: "ctx-B" }])
  assert.deepEqual(history.map((m) => m.content), ["ctx-A", "ctx-B"], "重复 ctx-A 跳过、ctx-B 注入")
  pushInjections(history, { content: "ctx-B" })
  assert.equal(history.length, 2, "再次幂等")
})

test("#113 appendImagePointer：depth>0 / 空图 / 消息缺失 ⇒ no-op；非多模态 ⇒ 抛错；多模态 ⇒ 追加指引", () => {
  // no-op 面
  const m1 = { content: "hi" }
  appendImagePointer(m1, ["a.png"], "kimi-k3", { depth: 1 })
  assert.equal(m1.content, "hi", "depth>0 不追加")
  appendImagePointer(m1, [], "kimi-k3", { depth: 0 })
  assert.equal(m1.content, "hi", "空图不追加")
  appendImagePointer(null, ["a.png"], "kimi-k3", { depth: 0 })
  // 非多模态 ⇒ 可见报错（不静默丢）
  assert.throws(
    () => appendImagePointer({ content: "hi" }, ["a.png"], "deepseek-v4-pro", { depth: 0 }),
    /does not support pasted images/,
  )
  // 多模态 ⇒ 指引追加到真实用户消息尾
  const m2 = { content: "look at this" }
  appendImagePointer(m2, ["C:/tmp/paste-1.png", "C:/tmp/paste-2.png"], "kimi-k3", { depth: 0 })
  assert.match(m2.content, /look at this\n\n\[Attached images: C:\/tmp\/paste-1\.png \| C:\/tmp\/paste-2\.png\] — use the read_image tool to view them before answering\.$/)
  assert.equal(typeof m2.content, "string", "content 保持字符串形态（非 parts 数组）")
})
