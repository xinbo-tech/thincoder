/**
 * turn-model.mjs — MODEL-MERGE-SESSION 模型/stamp 决策纯函数（panel-chat.mjs 500 行硬限
 * 拆分产物——评审修复导出——runPanelChatImpl 调用 + chat-panel.test 单测锚）。
 * 语义：
 * - 会话模型 = 槽复合（F-4——providerName 缺席时调用侧以槽渠道优先解析；keyless 槽不入参）。
 * - webview userMessage 恒带 dropdown 复合（echo——dropdown = 会话级选择，selectModel 消息已写
 *   槽）：echo == 槽复合 ≠ per-message override（裁定④只约束真·与槽不符的单回合试运行）。
 * - 落槽值（修正轮 3/5——评审行 3/4）：有槽复合 → **槽复合权威**——任何 echo/override 不覆写
 *   会话记录（会话模型只经 selectModel 消息变更；与槽不符的显式模型 = 试运行——跑而不落，含
 *   异渠道 echo——stampProvider 恒为槽渠道——陈旧下拉/协议边缘不破坏槽）；无槽复合（新会话/空
 *   槽）→ 首回合实际运行复合播种（恒非空——CLI saveSession 对拍——空槽 echo 非试运行）。
 * @param {string} providerName 本回合 provider
 * @param {string|null|undefined} modelOverride 显式 per-message 模型（webview echo / 试运行）
 * @param {{provider: string, model: string|null}|null} slotRef 可运行槽复合（面板回合入口恒读）
  * @param {string|null} baseModel 该渠道默认解析值（defaultModel 属该渠道或渠道默认单值；无 → null）
 * @returns {{ runModel: string|null, trialOverride: boolean, stampProvider: string,
 *            sessionStampModel: string|null }}
 */
export function resolveTurnModelAndStamp({ providerName, modelOverride, slotRef, baseModel }) {
  const isSlotChannel = slotRef?.provider === providerName
  const slotModel = isSlotChannel ? slotRef.model : null
  const trialOverride = !!(modelOverride && slotRef && !(isSlotChannel && slotModel && modelOverride === slotModel))
  const runModel = modelOverride || slotModel || baseModel
  const stampProvider = slotRef ? slotRef.provider : providerName
  const sessionStampModel = slotRef ? slotRef.model : runModel
  return { runModel, trialOverride, stampProvider, sessionStampModel }
}
