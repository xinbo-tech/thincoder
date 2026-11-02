/**
 * agent-tools/batch-ledger-link.mjs — 账链门判据（设计单源 = `docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条）：
 * 一本已解析成绝对路径的批档，台账里还有没有**至少一行未决行**的 `task_book` 指着它。
 *
 * 为什么另立本档（设计档同条「三问（新档）」）：
 *  - `resolveBatchRows`（`thincoder-core/ledger-write-ops.mjs`）= 选行判据**单源**，直接复用（判同址、不判串等值
 *    ——同一批档的三种指针写法并存，串等值会漏行）；「未决」= `PENDING_STATUSES`（`thincoder-core/ledger-db.mjs`）
 *    ——产品的未决定义已存在一处，另立词表 = 第二份词表（漂移源）；
 *  - `ledgerBindBatch`（`thincoder-core/agent-tools/batch-ledger-bind.mjs`）是**写面绑定**（入参 = 行号 + 批档，
 *    出参 = 写入结果），把读判据塞进去会让「建档绑行」与「点火读账」两件事共用一个出口；
 *  - 读面包装 `ledgerBatchRows` 不能直接复用：无根即抛、库不在即返回空集——本门要在同一个出口把
 *    「无根 ∥ 库不在盘 ∥ 坏档 ∥ 零行」四形分开报（`reason` 三值 + `db` 读数），且**四形全落「拒」**、
 *    零路径落「放行」（`if (!db) 放行` 把「账读不到」判成「账不必看」，与本档用途相反）。
 *
 * 台账链一律**动态 import**（`thincoder-core/ledger-db.mjs` 静态引 `node:sqlite` ⇒ 消费侧静态 import 破 W8 契约②；
 * 手法同 `thincoder-core/agent-tools/batch-ledger-bind.mjs`）：本档零静态仓内依赖，可被工具层静态引用。
 *
 * 读面零写：只读开库（`readOnly: true` ⇒ 零 DDL / 零 ALTER / 零 `markSchemaVersion`）——门读账不建库、不改库。
 * 零模式位：本档不读模式位、无模式分支、无豁免分支（判据是「做没做评审」，不是「什么模式」）。
 */
import { existsSync } from "node:fs"

/**
 * 账链判据（**纯读**——一次根解析 → 只读开库 → 选行 → 未决过滤 → 关库；不抛业务异常）。
 *
 * 读序单源 = 设计档 §2 第 7 条「读序」五步：`resolveLedgerRoot(batchDocAbs, anchor)` →
 * `openLedger(root, { readOnly: true, boundary: anchor })` → `resolveBatchRows(db, root, batchDocAbs)` →
 * `PENDING_STATUSES` 过滤 → `db.close()`（finally）。
 *
 * @param {{batchDocAbs: string, anchor: string}} o `batchDocAbs` = 批档绝对路径（已由 `resolveBatchDocPath` 解析）；
 *   `anchor` = 会话锚（`agent.cwd`——与 `openLedger` 同一枚上界：同一笔动作的判据不设两界）
 * @returns {Promise<{ok: boolean, reason: string|null, root: string|null, dbFile: string|null,
 *   db: "open"|"not-on-disk"|"unreadable"|null, rows: number, unsettled: number}>}
 *   `ok` = 放行；`reason` = 三值之一（`ok` 时 null）；`root` / `dbFile` / `db` / `rows` / `unsettled` = 拒文
 *   `Record:` 行的读数——`db` 一项决定修复路径能不能选（`not on disk` 时库里没有可改的行）
 */
export async function resolveBatchLedgerLink({ batchDocAbs, anchor }) {
  // 台账族导出面（`thincoder-core/ledger.mjs` = 公共面单源）+ 选行单源（`resolveBatchRows` 只从拆分件导出——
  // 族面只 re-export 了它的包装 `ledgerBatchRows`，那个包装把「无根 ∥ 库不在」两种成因并成抛 / 空集）
  const { ledgerDbPath, openLedger, PENDING_STATUSES, resolveLedgerRoot } = await import("../ledger.mjs")
  const { resolveBatchRows } = await import("../ledger-write-ops.mjs")

  const derived = resolveLedgerRoot(batchDocAbs, anchor)
  const root = derived?.root ?? null
  let dbFile = null
  if (root) { try { dbFile = ledgerDbPath(root, anchor) } catch { dbFile = null } }
  /** 拒形（四形共用一处形状——读数缺省值集中在这里，不在每个 return 各写一遍）。
   *  `reason` 三值 = `no-pending-row` / `no-ledger-root` / `ledger-unreadable`（同一拒发口靠 reason 分叉，
   * 不另立 criterion——单源 = 设计档 §2 第 7 条「失败路径全落拒」表）。 */
  const refuse = (reason, extra = {}) => ({ ok: false, reason, root, dbFile, db: null, rows: 0, unsettled: 0, ...extra })

  if (!root) return refuse("no-ledger-root") // 批档不在任何已注册项目内 ∥ 会话锚外 ⇒ 零行可判

  let db = null
  try {
    db = openLedger(root, { readOnly: true, boundary: anchor })
  } catch {
    return refuse("ledger-unreadable", { db: "unreadable" }) // 坏档 ∥ 目录不在 ⇒ 门内 catch（不 throw 外逸）
  }
  // 库不在盘（`not on disk`）∥ 非台账库（档在盘、无 items 表 ⇒ 读不成台账 ⇒ `unreadable`）：
  // 两形同为 `no-pending-row`（零行可判 = 这条账不存在），`db` 读数把成因分开
  if (!db) return refuse("no-pending-row", { db: dbFile && existsSync(dbFile) ? "unreadable" : "not-on-disk" })

  try {
    const rows = resolveBatchRows(db, root, batchDocAbs)
    const unsettled = rows.filter((r) => PENDING_STATUSES.includes(r.status)).length
    return { ok: unsettled > 0, reason: unsettled > 0 ? null : "no-pending-row", root, dbFile, db: "open", rows: rows.length, unsettled }
  } catch {
    return refuse("ledger-unreadable", { db: "unreadable" }) // 选行读失败同判：读不到账 ⇒ 拒
  } finally {
    try { db.close() } catch { /* 已关 / 未开 */ }
  }
}
