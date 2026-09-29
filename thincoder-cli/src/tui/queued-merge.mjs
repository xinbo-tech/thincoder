/**
 * queued-merge.mjs — busy 排队消息的合并消费纯函数族（R15 攒批恢复——queue-visible 批 2026-09-24）。
 *
 * 机制单源 = `docs/cli/design/TUI.md` §7.5「合并消费」+ `docs/cli/design/TUI-INPUT-BOX.md` §4.1「送达链路」。
 * **核单源（转口）**：五名（常量 ∕ 形态 ∕ 计划）自 `@thincoder/core/queued.mjs` 转口（同一绑定——
 * 对拍锁 = `docs/batches/2026-09-29-parity-b2-queued.test.mjs`（批次本地件））。
 * 取批四支共用同一事实源（`planQueuedInput`；队列容器仍归会话层 `state.pendingInput`——核只给缝）：
 *   ① 步边界 pickup（`queued-pickup.mjs`）· ② 回合尾兜底（`agent-turn.mjs`）
 *   · ③ driver 输入优先（`suspension-drive.mjs`）· ④ 中止残余转 queue（`suspension-drive.mjs`）。
 */

export { MAX_MERGE_ITEMS, MAX_MERGE_CHARS, QUEUED_MAX_ITEMS, formatMergedMessages, planQueuedInput } from "@thincoder/core/queued.mjs"
