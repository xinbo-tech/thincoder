/**
 * loading.js — 忙态派生接线（派生面 ∕ 忙态门单源 = 核 `composer/panel.mjs`；本档原 96 行整体搬核）。
 *
 * 端侧保留两导出面（调用面零改：`panels.js:95,114` ∕ `streaming.js:157` ∕ `chat-messages.js:94,99`）：
 *  `setLoading(ctx, on)` ⇒ 核 `setLoading(on)`（`ctx` 形参保留 = 调用签名不变；`on` 缺省 = 核内现刻标记，
 *  `panels.js` 的 `setLoading(ctx, ctx.isRunning)` 惯用式经 `ctx.isRunning` 活代理同源）；
 *  `applyBusyLock()` ⇒ 核同名面。回写门谓词（`writebackBlocked`）随核内单点派生 —— 经核 model-menu
 *  的 `blocked()` 注入，端侧不再另立副本（钮面门随 2026-10-04 解锁批退场；回写门消费者 = 核 `applyModels`）。
 */
import { composer } from "./input.js"

/** 忙态重派生（宿主忙态 ∕ 挂起 ∕ 守卫三推送后的重派生点——占位符三态 + 两钮显隐 + 回写门）。 */
export function applyBusyLock() { composer.applyBusyLock() }

/** loading 推送（`on` 缺省 ⇒ 核内现刻标记——重派生惯用式；`_ctx` = 旧签名保位，核内元素引用自持）。 */
export function setLoading(_ctx, on) { composer.setLoading(on) }
