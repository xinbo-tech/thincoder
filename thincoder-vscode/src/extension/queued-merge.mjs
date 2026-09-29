/**
 * queued-merge.mjs — busy 排队消息的合并消费纯函数族（VSC 半——R15 攒批恢复 · queue-visible 批 2026-09-24）。
 *
 * 机制单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则⑦（消费成形）+ `docs/vsc/design/
 * WEBVIEW-PROTOCOL.md` §3.2 行 17（快照字段）；跨端同源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`
 * §6.8「合并消费」。**核单源（转口）**：五名（`MAX_MERGE_ITEMS` / `MAX_MERGE_CHARS` /
 * `QUEUED_MAX_ITEMS` / `formatMergedMessages` / `planQueuedInput`）自 `@thincoder/core/queued.mjs`
 * 转口（同一绑定）；对拍锁 = `docs/batches/2026-09-29-parity-b2-queued.test.mjs`（批次本地件）。
 * 恢复依据 = R15 旧形态逐字（常量名 / 值 / 形态文案 / 批语义——CLI 侧同源档头注）。
 */

export { MAX_MERGE_ITEMS, MAX_MERGE_CHARS, QUEUED_MAX_ITEMS, formatMergedMessages, planQueuedInput } from "@thincoder/core/queued.mjs"

/**
 * 取批可消费判据（#429 裁定 ·「取批面放行」——备选落定）：本端**无斜杠命令面**（VSC 全树零
 * `/` 命令执行面 ⇒ `/` 开头文本 = 普通消息）⇒ `slash` 首动作与 `turn` 同判**可消费**——以文本
 * 单条取批（保序 · 不合并；`count` 恒 1）。先例 = 桌面 KD-40 取项边缘 D-2（2026-09-28 父侧裁
 * 「无斜杠面 ⇒ 逐条直发 · 同文本即普通消息 · 零静默丢」）。**分类面 ∕ 对拍面零改**：放行 = 取批
 * 判据，`planQueuedInput` 的 `slash` 分类与 CLI 对拍族（常量 ∕ `formatMergedMessages` ∕
 * `planQueuedInput`）逐字不动。
 * 修前形态（滞留实锤）：`planQueuedInput(["/x","y"])` 首动作 `slash` ⇒ 两取批面（载具取项 ∕ 步
 * 边界）双双零消费 ⇒ `/x` 滞留队首且**堵住其后全部条目**（复现读数 = 批档 §5 轮 8）。
 */
export function consumableAction(action) {
  return action?.kind === "turn" || action?.kind === "slash"
}
