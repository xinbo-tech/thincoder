/**
 * agent/live-batch.mjs — 活批档判定单源（写锁的判据）。
 *
 * 权威规格 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.2。**活批档** = 三条同时成立，全部是盘面事实：
 *   ① 某批档 `§1` 状态行 = `进行中`；
 *   ② 项目台账里有一行 `status = 在途`；
 *   ③ 该行 `task_book` 的文件部分（首个 `§` 前子串）解析出的档 = **该批档本身**——
 *      **推导方向是行 → 档，不是档头 → 行**：实现从不读档头 `> 台账 = #N` 的那个 N，
 *      档头是给人读的，行才是判据源；两者不一致时以行为准。
 * 多条同时为活 = 合法（用户 2026-10-27 裁定「当然是允许多个（活批档）」），锁只问「是否存在至少一条」。
 *
 * 查找面与上界**逐字沿用** `agent/light-round.mjs` 的读法（既有件三问的答案：同形谓词不许两份）：
 * 候选 = 会话锚 + 直接子目录一层（`ledgerChildren` 单源）；workspace 候选跳过；行先按 `status = 在途`
 * 过滤；再以各候选为根解析 `task_book` 的 `§` 前子串；`readBatchStatusLine` 判 `open`。
 *
 * 轻通道轮在盘 ⇒ 活批档成立（轮次行本就是 `在途` ∧ 指针指回轮档 ∧ 轮档 `§1` 进行中）——所以写锁**不必**
 * 为轻通道留口子，也不会把它拦下。`lightRoundOpen` 因此改为薄壳：多一个「行 `title` 携轮型标记」的过滤。
 *
 * **读错 / 不可判 ⇒ `open: false`（fail-closed，照拦）**——锁是业务门，读不到不等于放行。`error` 字段把
 * 原始错误带出去给写锁的拒文用（「读不到台账 ⇒ 拒，拒文点名台账的原始错误」）；查找面逐候选读错不否决
 * 其余候选（开路凭据 = 三合取全过），只有全部候选都读不到才把第一条错误报出去。
 *
 * 只读：台账 = `ledgerQuery` **动态 import**（`ledger-db.mjs` 静态 import node:sqlite ⇒ 消费侧静态 import
 * 破 W8 契约②）；批档 = 一次 `readFileSync`。
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { projectRootView, resolveProjectRoot } from "../manifest.mjs"
import { resolveDeclaredRef } from "../declaration.mjs"
import { readBatchStatusLine } from "../agent-tools/batch-skeleton.mjs"

/**
 * 活批档判定（异步 · 只读 · fail-closed）。
 * @param {object} agent — 会话 agent（读 `cwd`）
 * @param {{roundMarker?: string|null}} [opts] — `roundMarker` 非空 ⇒ 只认 `title` 携该标记的行（轻通道轮）
 * @returns {Promise<{open: boolean, error: string|null}>} `open` = 存在至少一条活批档；
 *   `error` = 一个候选都没读成时的第一条错误原文（`open: true` 或零错误 ⇒ null）
 */
export async function liveBatchOpen(agent, { roundMarker = null } = {}) {
  try {
    const cwd = agent?.cwd
    if (typeof cwd !== "string" || cwd.trim() === "") return { open: false, error: null }
    // W8 契约②：node:sqlite 链只经动态 import 进入（勿升静态）——候选枚举与逐候选查行同取 ledger 公共面。
    const { ledgerChildren, ledgerQuery } = await import("../ledger.mjs")
    const anchor = resolve(cwd)
    // 候选面 = 锚自身 + 直接子目录一层（纯向下；子项枚举单源 = `ledgerChildren`）。
    const candidates = [anchor, ...ledgerChildren(anchor).map((p) => p.root)]
    let firstError = null
    let readAny = false
    for (const cand of candidates) {
      // 工作区候选（下辖 ≥2 项目——`projectRootView`）⇒ 跳过、照查其余（工作区锚不充当项目 = AC-M2-19 同判）。
      if (projectRootView(cand).state === "workspace") continue
      let rows
      // `boundary` = 会话锚（本查找面的根上界——与台账工具面同一枚界；缺则当场失败——
      // 进程锚不是项目锚时逐候选都推不出根 ⇒ 误判「无活批档」）。界内候选不受影响，语义零放宽。
      try { rows = ledgerQuery({ cwd: cand, boundary: anchor, status: "在途" }); readAny = true } catch (e) { firstError ??= String(e?.message ?? e); continue }
      if (!Array.isArray(rows) || rows.length === 0) continue
      // 指针基准 = 台账写门同式（`ledger-write-ops.mjs` assertTaskBookGate 同一子表达式）——以各候选为基。
      const base = resolveProjectRoot(cand) ?? resolve(cand ?? ".")
      for (const row of rows) {
        if (roundMarker && !String(row?.title ?? "").includes(roundMarker)) continue // 无标记 ⇒ 非本轮（轻通道面的过滤）
        const taskBook = row?.task_book
        if (typeof taskBook !== "string" || taskBook.trim() === "") continue // 缺指针 ⇒ 单件不放行
        const part = taskBook.split("§")[0].trim() // 台账写门同式：首个 § 前子串
        if (part === "") continue
        const hit = resolveDeclaredRef(base, part)
        if (!hit.ok) continue // 指针失据 ⇒ 不放行
        let src
        try { src = readFileSync(hit.abs, "utf8") } catch { continue } // 档读不到 ⇒ 不放行
        if (readBatchStatusLine(src) === "open") return { open: true, error: null } // 三合取 ⇒ 活批档
      }
    }
    // 一个候选都没读成（库不可开 / 根不可推导的候选全灭）⇒ 把第一条错误带出去（写锁拒文点名它）
    return { open: false, error: readAny ? null : firstError }
  } catch (e) {
    return { open: false, error: String(e?.message ?? e) } // 读错 ∥ 不可判 ⇒ fail-closed（照拦）
  }
}
