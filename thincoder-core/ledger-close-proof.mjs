/**
 * ledger-close-proof.mjs — 台账核销机检单源（F-LX4 · 2026-10-26 批 §2；台账 #1807）。
 *
 * 判据（需求档 §② 功能点 11 / AC-M2-34）：凡写 `已核销` 的语句，写库前判三件——① 行的 `task_book`
 * 所指批档在盘 ② 该档 §1 状态行 = `已收口` ③ 该批档在 design token 槽的批次归属里有记录；缺一即拒、
 * **一次报全缺项**、行零改。**判据只有目标值一条**——闸挂在写这个值的两处逐行共函数
 * （`ledger-cmd.mjs` 的 `applyRowUpdate` / `applyRowClose`）之前，不判来源态。
 *
 * 住本档的理由（拆分件——先例 = `ledger-tools.mjs` 自 `ledger-cmd.mjs` 拆出）：`ledger-cmd.mjs` 收尾
 * 446 行，机检本体 + 三形拒因入册即越单档 500 顾问线（设计 §五「实落超 500 ⇒ 主动拆分」）。两枚指针
 * 值谓词（`filePartOf`——设计档 §6.1 口径 1 单源 ∥ `namesPointer`）随迁本档，`ledger-cmd` 反向 import
 * 取用——方向单向、无静态环。
 *
 * 只读：③ 只读归属旁列（designId → 批档路径），**从不读 token 值那一面**（`_engDesignTokens` /
 * `readEngTokensFromSlot` 不入本档）——拒因文案里只有行 id ∥ `task_book` 值 ∥ 批档路径。
 */
import { readFileSync } from "node:fs"

import { resolveDeclaredRef } from "./declaration.mjs"
import { batchPathKey, unionBatches } from "./agent-tools/design-slots.mjs"
import { isBatchRecord, readBatchStatusLine } from "./agent-tools/batch-skeleton.mjs"
import { loadManifest } from "./session-slots.mjs"

/** 指针 ∥ 批档值 → 文件部分（首个 `§` 前子串，trim——设计档 §6.1 口径 1 单源；`task_book` 与
 *  `batch` 同形同口径）。 */
export const filePartOf = (v) => (v == null ? "" : String(v).split("§")[0].trim())

/** 本笔指名谓词（设计档 §6.1 口径 3）：显式空值（`null` / 空串 / 全空白） ≡ **未指名**——臂② 不触。 */
export const namesPointer = (v) => v != null && String(v).trim() !== ""

/** 会话槽号（与 `token-ttl.mjs` `currentSlotNoReadOnly` 同一取值式：`_slot` 优先、未钉槽读 manifest
 *  `active`）——只用于 ③ 拒因分辨两种成因，不读任何 token 值面。 */
function slotNoOf(agent) {
  if (Number.isInteger(agent?._slot)) return agent._slot
  const active = loadManifest(agent?.cwd)?.active
  return Number.isInteger(active) ? active : null
}

/** ③ 归属并集一次读入（严格形）：`fnName` 在场 ⇒ 读失败即抛（必写 `已核销` 的批量径 ⇒ BEGIN 之前整批拒、
 *  不进 skipped）；缺省 ⇒ 返回错误对象（单行径 ∥ 纯字段补丁逐行报 ③）。 */
export function readCloseOutBatches(agent, fnName) {
  try { return unionBatches(agent, { strict: true }) } catch (e) {
    if (!fnName) return e
    throw new Error(`${fnName}：核销机检未过（整批零行改——会话级读失败，与行无关）\n  ③ 读不到 token 槽归属（${e?.message ?? e}）：核销被拒、行零改；修好槽文件或权限后重试`)
  }
}

/** 核销机检（F-LX4 · 需求档 §② 功能点 11 / AC-M2-34）：写 `已核销` 前判三件——① `task_book` 所指档在盘
 *  ② 该档 §1 = `已收口` ③ 该批档在 design token 槽的批次归属里有记录；**判据只有目标值一条**（两处写
 *  这个值的 SQL 之前同挂），三件各判、**一次报全缺项**、行零改（只判不写）。③ = 值扫（`batchPathKey`
 *  归一），只读归属旁列、从不读 token 值面。`batches` = 批量径预读（`Error` = 预读失败）；缺省 ⇒ 此处读。 */
export function assertCloseOutProof(fnName, { agent, base, row, batches }) {
  const missing = [] // 每项 = 一条拒因行（首字 = 缺项号）
  let abs = null
  if (!namesPointer(row?.task_book)) {
    missing.push("  ① 行无 task_book 指针：追认核销须先挂批档（update 写 task_book），再跑全链")
  } else {
    const hit = resolveDeclaredRef(base, filePartOf(row.task_book))
    if (!hit.ok) missing.push(`  ① 批档不在盘（task_book = ${row.task_book}）：先补指针，或恢复该档`)
    else {
      abs = hit.abs
      const src = readFileSync(abs, "utf8")
      if (!isBatchRecord(src)) missing.push(`  ② 指针所指档不是批档（${abs} 无 §1 段）：先把 task_book 改指批档`)
      else {
        const state = readBatchStatusLine(src)
        if (state !== "closed") missing.push(`  ② 批档未收口（${abs} §1 = ${state}）：该批须先跑全链收口`)
      }
    }
  }
  if (abs !== null) {
    let map = batches instanceof Map || batches instanceof Error ? batches : readCloseOutBatches(agent)
    if (map instanceof Error) missing.push(`  ③ 读不到 token 槽归属（${map?.message ?? map}）：核销被拒、行零改；修好槽文件或权限后重试`)
    else if (![...map].some(([, b]) => typeof b === "string" && batchPathKey(b) === batchPathKey(abs))) {
      missing.push(slotNoOf(agent) == null
        ? "  ③ 本会话无槽号（manifest 无 active）：核销须在持有该批归属的会话里跑"
        : "  ③ 本会话槽内无该批档的归属：先确认是否换了会话——在跑该批设计评审的会话里核销；\n     确无归属 ⇒ 那次评审的 documents 未带该批档，须重跑")
    }
  }
  if (missing.length > 0) throw new Error(`${fnName}：核销机检未过（行 ${row?.id} 零改）——缺：${missing.map((t) => t.trim()[0]).join(" ")}\n${missing.join("\n")}`)
}
