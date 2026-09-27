/**
 * panel.test.mjs — 核纯函数层：任务 / 目标面板显隐判据（`cards/panel.mjs`——`panels.js:18-26` /
 * `:41` 逐条对拍）。
 *
 * 注：面板**体**（图标字面 / 转义 / 空白文本节点）属 DOM 构件面——用例宿主 = 消费端套件
 * （设计 §6「DOM 构件层用例宿主 = 消费端套件」；核包零 DOM 依赖）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { taskPanelVisible, goalPanelVisible } from "../cards/panel.mjs"

test("任务面板显隐：无 items ⇒ 不显示", () => {
  assert.equal(taskPanelVisible(null), false)
  assert.equal(taskPanelVisible({}), false)
  assert.equal(taskPanelVisible({ items: [] }), false)
})

test("任务面板显隐：全 done 且未显示 ⇒ 不新示；全 done 且已显示 ⇒ 照常重渲", () => {
  const allDone = { items: [{ title: "a", status: "done" }] }
  assert.equal(taskPanelVisible(allDone), false)
  assert.equal(taskPanelVisible(allDone, false), false)
  assert.equal(taskPanelVisible(allDone, true), true)
  const mixed = { items: [{ title: "a", status: "done" }, { title: "b", status: "pending" }] }
  assert.equal(taskPanelVisible(mixed), true, "未全 done ⇒ 恒显示")
  assert.equal(taskPanelVisible(mixed, false), true)
  assert.equal(taskPanelVisible({ items: [] }, true), false, "空 items 优先于 shown 位")
})

test("目标面板显隐：goal 空 ⇒ 不显示；在场 ⇒ 显示", () => {
  assert.equal(goalPanelVisible(null), false)
  assert.equal(goalPanelVisible(undefined), false)
  assert.equal(goalPanelVisible({ status: "active" }), true)
})
