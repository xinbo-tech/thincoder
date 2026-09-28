/**
 * model-picker.js — 模型 ∕ 推理面接线（逻辑单源 = 核 `composer/model-menu.mjs`；本档原 152 行搬核）。
 *
 * 消费核件两注入面：① **候选面**（`ctx._models` = 端侧读面：设置面板 `getModels`（`chat.js` 装配）
 * 与会话载荷共用；核读面初值同源，本档在 `models` 推送处镜像写入）；② **写路**（两钮点击 ∕ 忙态零回写 ∕
 * footer 三出口 = 核内判据，经接线层注入的 `post` 桥出——端侧零判据副本）。
 */
import { ctx } from "./state.js"
import { pushComposer } from "./input.js"

/** `models` 推送：候选面镜像（端侧读面单源）+ 转推核件（现值标记 ∕ 忙态零回写 ∕ 空列表隐藏两钮）。 */
export function handleModelsMessage(m) {
  ctx._models = m.models || []
  pushComposer(m)
}
