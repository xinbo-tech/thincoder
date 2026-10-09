/**
 * agent/light-round.mjs — 轻通道代码笔通路谓词（F-LC5 · 设计 = `docs/core/design/LIGHT-CHANNEL.md` §2.8）。
 *
 * `lightRoundOpen(agent)`：闸读判据——**两件双在盘**才算轻通道轮在盘：
 *   ① 轮次台账行：`status = 在途` ∧ `title` 携「收尾链待跑」（轮型标记 = 闸凭据）∧ `task_book` 非空；
 *   ② 该指针指向的轮次批档：`§1` 状态行 = 「进行中」（判定器单源 = `readBatchStatusLine`）。
 * 语义：开门动作 ≡ 开轮两件落盘（「启动即挂账」本体——无独立于账的开门面）；单件不放行
 * （轮档独在 ∥ 行独在 ∥ 无标记 ∥ 行非在途 ∥ 指针失据 ∥ 档已收口 ⇒ 皆 false）；收口即自闭
 * （信号生命周期 = 账生命周期——零撤销动作 ∥ 零跨轮残留）。
 * 读错 ∥ 不可判 ⇒ `false`（fail-closed——照拦；被拦时文案不因读错而变）。
 * 只读：台账 = `ledgerQuery` **动态 import**（`ledger-db.mjs` 静态 import node:sqlite ⇒
 * 消费侧静态 import 破 W8 契约②）；批档 = 一次 `readFileSync`。
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { resolveProjectRoot } from "../manifest.mjs"
import { resolveDeclaredRef } from "../declaration.mjs"
import { readBatchStatusLine } from "../agent-tools/batch-skeleton.mjs"

/** 轮型标记（§2.3 开轮形升格为闸凭据；全链批行无此标记 ⇒ 不构成信号）。 */
const ROUND_MARKER = "收尾链待跑"

/** 轻通道轮在盘谓词（异步 · 只读 · fail-closed）。契约见头注。
 * @param {object} agent — 会话 agent（读 `cwd`）
 * @returns {Promise<boolean>} true = 放行（在盘轮次）；读错 ∥ 不可判 ⇒ false（照拦）
 */
export async function lightRoundOpen(agent) {
  try {
    const cwd = agent?.cwd
    if (typeof cwd !== "string" || cwd.trim() === "") return false
    // W8 契约②：node:sqlite 链只经动态 import 进入（勿升静态）。
    const { ledgerQuery } = await import("../ledger-cmd.mjs")
    const rows = ledgerQuery({ cwd, status: "在途" })
    if (!Array.isArray(rows) || rows.length === 0) return false
    // 指针基准 = 台账写门同式（`ledger-cmd.mjs` assertTaskBookGate 同一子表达式）。
    const base = resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")
    for (const row of rows) {
      if (!String(row?.title ?? "").includes(ROUND_MARKER)) continue // 无标记 ⇒ 非轻通道轮（全链批行）
      const taskBook = row?.task_book
      if (typeof taskBook !== "string" || taskBook.trim() === "") continue // 缺指针 ⇒ 单件不放行
      const part = taskBook.split("§")[0].trim() // 台账写门同式：首个 § 前子串
      if (part === "") continue
      const hit = resolveDeclaredRef(base, part)
      if (!hit.ok) continue // 指针失据 ⇒ 不放行
      let src
      try { src = readFileSync(hit.abs, "utf8") } catch { continue } // 档读不到 ⇒ 不放行
      if (readBatchStatusLine(src) === "open") return true // 两件双在盘 ⇒ 放行
    }
    return false
  } catch {
    return false // 读错 ∥ 不可判 ⇒ fail-closed（照拦）
  }
}
