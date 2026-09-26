/**
 * sessions.mjs — 会话族读面（`docs/desktop/design/IPC.md` §2 会话族注 · `docs/desktop/design/PROJECT.md` §4.1 本档行）：
 * `sessions:list` 载荷投影 —— 核 `listSlots` 条目 → 左列行（字段闭集 = `docs/desktop/design/IPC.md`:47）。
 * **零新增算法**（会话族注项 3）：不落新存储、不重算摘要、不扫目录名——读数全走端壳转口 `./session-slots.mjs`
 * 的 `listSlots`（端壳零算法副本判据照旧）。
 * 未打开项目（`cwd` 空）⇒ `{ cwd: null, rows: [] }` = **正常载荷**（非错误——渲染面读作启动态）；
 * 读取失败（核抛）⇒ 本档不吞：**抛出 ⇒ `invoke` 拒绝**（失败面口径 = `src/main/ipc.mjs:23-25` 头注同形）。
 * 本批**不认领活动槽**：`isActive` 只读（不写 manifest、不发端壳认领）。
 */
import { listSlots } from "./session-slots.mjs"

/** 载荷行字段集（闭集 · 单源 = IPC 会话族注项 1）：`date` / `updatedDate` 是核本地化显示串、
 *  `firstMessage` 非左列所需 ⇒ **不载**（关键决策 D-4）。 */
export const ROW_FIELDS = Object.freeze([
  "slot", "title", "createdBy", "updatedAt", "messageCount", "isActive",
])

/** 核条目 → 载荷行：**只挑字段、不改写**（字段名与核投影同源 —— 零改名、零重算、零缺省回填）。 */
function toRow(entry) {
  return {
    slot: entry.slot,
    title: entry.title,
    createdBy: entry.createdBy,
    updatedAt: entry.updatedAt,
    messageCount: entry.messageCount,
    isActive: entry.isActive,
  }
}

/** `sessions:list` 读面：`cwd` 空 ⇒ 空载荷（未打开项目）；否则核投影逐行挑字段（行序 = 核序 = `updatedAt` 降序）。 */
export function listSessions(cwd) {
  if (typeof cwd !== "string" || cwd === "") return { cwd: null, rows: [] }
  return { cwd, rows: listSlots(cwd).map(toRow) }
}
