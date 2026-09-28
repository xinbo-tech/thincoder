/**
 * send.js — 提交面接线（提交逻辑单源 = 核 `composer/panel.mjs`；本档原 89 行整体搬核）。
 *
 * 核内提交面已内生发送钮绑定（`panel.mjs` 两钮点击段），Enter 由核键位面直调同一函数 —— 两入口同门
 * （守卫 ∕ 满队 ∕ 排队受理 ∕ 清框判据全在核内）。本档保留端侧提交入口（外部触发点 = 装配 ∕ 测试）。
 */
import { composer } from "./input.js"

/** 提交入口：转发到发送钮内生路径（`#send-btn` = 结构单源 id；查询域 = 面板子树内，防同 id 双存干扰）。 */
export function send() {
  composer.inputEl.parentElement.querySelector("#send-btn").click()
}
