/**
 * sessions.mjs — 会话族读面（`docs/desktop/design/IPC.md` §2 会话族注 · `docs/desktop/design/PROJECT.md` §4.1 本档行）：
 * `sessions:list` 载荷投影 —— 核 `listSlots` 条目 → 会话控制条目（字段闭集 = `docs/desktop/design/IPC.md`:47）。
 * **零新增算法**（会话族注项 3）：不落新存储、不重算摘要、不扫目录名——读数全走端壳转口 `./session-slots.mjs`
 * 的 `listSlots`（端壳零算法副本判据照旧）。
 * 未打开项目（`cwd` 空）⇒ `{ cwd: null, rows: [] }` = **正常载荷**（非错误——渲染面读作启动态）；
 * 读取失败（核抛）⇒ 本档不吞：**抛出 ⇒ `invoke` 拒绝**（失败面口径 = `src/main/ipc.mjs:23-25` 头注同形）。
 * 本批**不认领活动槽**：`isActive` 只读（不写 manifest、不发端壳认领）。
 */
import { ledgerHealth, listSlots } from "./session-slots.mjs"

/** 载荷行字段集（闭集 · 单源 = IPC 会话族注项 1）：`date` / `updatedDate` 是核本地化显示串、
 *  `firstMessage` 非会话控制条目所需 ⇒ **不载**（关键决策 D-4）；**R3c 增** `provider`（= 核条目 `activeProvider`
 *  —— D18 元数据族首值；核 `listSlots` 投影口径：`provider:model` 复合串（无活动模型 ⇒ 裸渠道名）· 老槽 ⇒ `""`）。 */
export const ROW_FIELDS = Object.freeze([
  "slot", "title", "createdBy", "updatedAt", "messageCount", "isActive", "provider",
])

/** 核条目 → 载荷行：**只挑字段、不改写**（字段名与核投影同源 —— 零改名、零重算、零缺省回填；
 *  `provider` = 核 `activeProvider` 逐字（老槽缺键 ⇒ 核已归 `""` —— 渲染面不标注）。 */
function toRow(entry) {
  return {
    slot: entry.slot,
    title: entry.title,
    createdBy: entry.createdBy,
    updatedAt: entry.updatedAt,
    messageCount: entry.messageCount,
    isActive: entry.isActive,
    provider: entry.activeProvider,
  }
}

/** `sessions:list` 读面：`cwd` 空 ⇒ 空载荷（未打开项目）；否则核投影逐行挑字段（行序 = 核序 = `updatedAt` 降序）。
 *  **账本异常注记**（账本可靠批 · 桌面微轮 —— 单源 = `docs/desktop/design/IPC.md` §2「会话族注」项 6）：`ledger` = 回执增字段 ·
 *  **异常才携**（缺席 = 正常——负断言）；触发 = `refused > 0 ∨ scene`（与 CLI / VSC 同口径，脱离会话计数条件）；判据单源 = 核
 *  `ledgerHealth(cwd)`（经端壳转口引核出口——零算法副本）；`reason` = `lastReason` 逐字 ∥ `"scene"`（仅损坏现场时；`refused > 0` ⇒ `lastReason` 恒非空——核同拍写，`?? "scene"` 兜底不可达）；`cwd` 空 ⇒ 不携。 */
export function listSessions(cwd) {
  if (typeof cwd !== "string" || cwd === "") return { cwd: null, rows: [] }
  const receipt = { cwd, rows: listSlots(cwd).map(toRow) }
  const health = ledgerHealth(cwd)
  if (health.refused > 0 || health.scene) {
    receipt.ledger = { refused: health.refused, reason: health.lastReason ?? "scene", scene: health.scene }
  }
  return receipt
}
