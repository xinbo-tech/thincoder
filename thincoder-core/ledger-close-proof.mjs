/**
 * ledger-close-proof.mjs — 台账核销机检单源（F-LX4 · 2026-10-26 批 §2；台账 #1807）。
 *
 * 判据（需求档 §② 功能点 11 / AC-M2-34）：凡写 `已核销` 的语句，写库前判三件——① 行的 `task_book`
 * 所指批档在盘 ② 该档 §1 状态行 = `已收口` ③ 该批档的 `§3` 状态行 = `评审通过`；缺一即拒、
 * **一次报全缺项**、行零改。**判据只有目标值一条**——闸挂在写这个值的两处逐行共函数
 * （`ledger-cmd.mjs` 的 `applyRowUpdate` / `applyRowClose`）之前，不判来源态。
 *
 * ③ 为什么能去运行态（2026-10-27 三链统一批 · R6）：`§3` 只能由**绑在该档上的评审实例**写
 * （`batch` 工具的 review 绑定），所以「§3 有 pass」本身就证明了「有一次绑本档的评审跑过并给了 pass」，
 * 与 token 槽归属同义，而且换会话、重启进程、隔天补账都成立。旧判据（槽内有归属）在需要「换会话核销」
 * 时给出假拒——它判的是**谁在跑**，不是**评审过没过**。
 * 代价：评审自报 pass 的信任面不变（今天也是评审自己写 §3）。
 *
 * 住本档的理由（拆分件——先例 = `ledger-tools.mjs` 自 `ledger-cmd.mjs` 拆出）：`ledger-cmd.mjs` 收尾
 * 446 行，机检本体 + 三形拒因入册即越单档 500 顾问线（设计 §五「实落超 500 ⇒ 主动拆分」）。两枚指针
 * 值谓词（`filePartOf`——设计档 §6.1 口径 1 单源 ∥ `namesPointer`）随迁本档，`ledger-cmd` 反向 import
 * 取用——方向单向、无静态环。
 *
 * 只读：三件都只读档面与行值，不读任何 token 槽状态（`_engDesignTokens` / `unionBatches` 不入本档）。
 */
import { readFileSync } from "node:fs"

import { resolveDeclaredRef } from "./declaration.mjs"
import { isBatchRecord, readBatchStatusLine, readSectionStatusWord, STATUS_WORDS } from "./agent-tools/batch-skeleton.mjs"

/** 指针 ∥ 批档值 → 文件部分（首个 `§` 前子串，trim——设计档 §6.1 口径 1 单源；`task_book` 与
 *  `batch` 同形同口径）。 */
export const filePartOf = (v) => (v == null ? "" : String(v).split("§")[0].trim())

/** 本笔指名谓词（设计档 §6.1 口径 3）：显式空值（`null` / 空串 / 全空白） ≡ **未指名**——臂② 不触。 */
export const namesPointer = (v) => v != null && String(v).trim() !== ""

/** 核销机检（F-LX4 · 需求档 §② 功能点 11 / AC-M2-34）：写 `已核销` 前判三件——① `task_book` 所指档在盘
 *  ② 该档 §1 = `已收口` ③ 该档 §3 = `评审通过`；**判据只有目标值一条**（两处写这个值的 SQL 之前同挂），
 *  三件各判、**一次报全缺项**、行零改（只判不写；2026-10-27 起 ③ = 档面事实，零运行态）。 */
export function assertCloseOutProof(fnName, { base, row }) {
  const missing = [] // 每项 = 一条拒因行（首字 = 缺项号）
  let abs = null
  if (!namesPointer(row?.task_book)) {
    missing.push("  ① 行无 task_book 指针：核销须先挂批档（update 写 task_book），再跑全链")
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
        else {
          const s3 = readSectionStatusWord(src, 3)
          if (s3 !== STATUS_WORDS[3].done) {
            missing.push(`  ③ 批档 §3 未通过评审（§3 状态行 = ${s3 ?? "（无状态行）"}，须 = 评审通过）：重开该档补评审结论，或另起批次`)
          }
        }
      }
    }
  }
  if (missing.length > 0) throw new Error(`${fnName}：核销机检未过（行 ${row?.id} 零改）——缺：${missing.map((t) => t.trim()[0]).join(" ")}\n${missing.join("\n")}`)
}
