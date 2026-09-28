/**
 * memory-status.mjs — 记忆 / 索引状态**只读出口**（R2 · 桌面功能对位批 · 台账 #412 正解）：三表计数一处出。
 *
 * 判据（父侧裁 —— 端侧不直读核内表；`docs/desktop/design/PROJECT.md` §10 N 行）：
 * - **只读**：本档零写面（无 DDL ∕ DML ∕ 迁移）+ 零动作面（无 sync ∕ reindex ∕ 建库）；
 *   句柄装配归调用面（`memory` 首参 = 已开句柄）。
 * - **零端名**：键名 = 表名 ∕ 通用计数词，无端侧语汇 —— 各端同面同形（第二消费面即本出口本身）。
 * - **origin 归一**：`origin` 给定 ⇒ 三表皆按**归一键**限定（核写缝一律归一 —— `memory/origin.mjs`；
 *   读面不归一 ⇒ 读不到本项目行）；缺 ∕ 非串 ∕ 空串 ⇒ 全库计数（回执 `origin: null`）。
 *
 * 回执：
 * ```
 * { origin, tables: { files, code: { files, chunks }, doc: { files, chunks } },
 *   totals: { files, chunks }, indexed }
 * ```
 * `tables.files` = 记忆层（`files` 表：project ∕ team 两层 markdown 记忆）行数；`code` ∕ `doc` 各 =
 * 去重文件数（`COUNT(DISTINCT path)`）与分块数（`COUNT(*)`）；`totals` = code + doc 合计（端侧既有
 * 索引读数同口径）；`indexed` = 合计文件数 > 0（「本项目已建索引」读数 —— 读数非承诺）。
 */
import { normalizeOrigin } from "./memory/origin.mjs"

/** 单表计数：`key` 非 null ⇒ 追加 `WHERE origin = ?`（三表皆有 origin 列 —— v5 ∕ v8 起）。 */
function countOf(memory, base, key) {
  const sql = key === null ? base : `${base} WHERE origin = ?`
  return key === null ? memory.db.prepare(sql).get() : memory.db.prepare(sql).get(key)
}

/** 三表计数只读出口（形见档头；`memory` = `createMemory()` 回执句柄）。 */
export function memoryStatus(memory, { origin } = {}) {
  const normalized = normalizeOrigin(origin)
  const scope = typeof normalized === "string" && normalized.length > 0 ? normalized : null

  const files = countOf(memory, "SELECT COUNT(*) AS n FROM files", scope)?.n ?? 0
  const codeRow = countOf(memory, "SELECT COUNT(DISTINCT path) AS files, COUNT(*) AS chunks FROM code_chunks", scope) ?? {}
  const docRow = countOf(memory, "SELECT COUNT(DISTINCT path) AS files, COUNT(*) AS chunks FROM doc_chunks", scope) ?? {}
  const code = { files: codeRow.files ?? 0, chunks: codeRow.chunks ?? 0 }
  const doc = { files: docRow.files ?? 0, chunks: docRow.chunks ?? 0 }
  const totalFiles = code.files + doc.files

  return {
    origin: scope,
    tables: { files, code, doc },
    totals: { files: totalFiles, chunks: code.chunks + doc.chunks },
    indexed: totalFiles > 0,
  }
}
