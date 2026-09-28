/**
 * mode-buttons.js — 模式位 ∕ AUTO 面接线（逻辑单源 = 核 `composer/controls.mjs`；本档原 131 行搬核）。
 *
 * 四写路（`setAutoApprove` ∕ `setAdvisorGuard` ∕ `setEngineeringEnabled` ∕ `setPlanMode`）由接线层
 * 注入的 `post` 桥出；两态类 ∕ ENG×PLAN 互斥 ∕ AUTO 内联确认（两出口 + Esc）全在核内。跨面状态同步经
 * `composerHooks.syncModeState` 回落 `S` 三位（`status-bar.js:23` 同面读 `S._planActive`）。
 * 本档保留三类推送 handler（`chat-messages.js` 消费面零改）——皆转推核件。
 */
import { pushComposer } from "./input.js"

/** `autoApprove` 推送（AUTO 两态）。 */
export const handleAutoApprove = (m) => pushComposer(m)

/** `agentSettings` 推送（ADVISOR ∕ ENG 两态；设置面板刷新经核 `hooks.onAgentSettings`——第二形参随核化退场）。 */
export const handleAgentSettings = (m) => pushComposer(m)

/** `planMode` 推送（PLAN 两态 + `#input-row.plan-active` + 状态行刷新）。 */
export const handlePlanMode = (m) => pushComposer(m)
