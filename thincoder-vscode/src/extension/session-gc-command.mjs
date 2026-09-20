/**
 * session-gc-command.mjs — 端侧命令：sessions 冷 / 存量组 GC（VS Code 侧入口）。
 *
 * SESSION.md §6.17 D-SE38（2026-09-21 · STARTUP-LATENCY 批 · 用户 03:36 裁定「端差应消除、
 * 两端共用同一套机制」）：命令 `thincoder.sessionGc` 的处理体——流程 = 候选列举（核数据面：
 * 冷 cwd 90 天面 ∪ 三合取存量组面）→ 计数报告 → 模态警告确认（`showWarningMessage(..., 
 * { modal: true }, "Delete")`）→ 逐组 `deleteColdCwd`（内部重校验 TOCTOU）→ 汇总。
 * **驳回 / undefined ⇒ 零删除**。
 *
 * 纪律：
 *   ① **目录来源 = 端侧派生的 sessions 根**（`session-slots.mjs` `sessionsDir()`——核
 *      `sessionPath` 反推，随核 `configDir` 与核沙箱缝走），不依赖核函缺省 `dir`（缺省 =
 *      核内 configDir 版）；处理体接受显式注入 `dir`（用例沙箱缝 = 装置传 temp 目录）。
 *   ② **不消费 `runSessionGc`**（console 形态属 CLI 壳——核内零消费方结构机检保持）。
 *   ③ 宿主 API 经 `api` 注入（缺省由 `extension.mjs` 传真 `vscode`；用例传 mock——本档
 *      自身零 `vscode` import，纯 Node 可测）。
 */
import { listColdCwds, deleteColdCwd } from "@thincoder/core/session-gc.mjs"
import { listStaleCwds } from "@thincoder/core/session-stale.mjs"
import { readdir } from "node:fs/promises"
import { sessionsDir } from "./session-slots.mjs"

/**
 * 命令处理体（返回结果汇总——用例直读；宿主提示为副作用面）。
 * @param {Object} o
 * @param {string} o.dir  sessions 根（缺省 = 端侧派生）
 * @param {Object} o.api  宿主面（`{ window: { showWarningMessage, showInformationMessage } }`）
 */
export async function runSessionGcCommand({ dir = sessionsDir(), now = Date.now(), probeFn, api } = {}) {
  const opts = probeFn ? { dir, now, probeFn } : { dir, now }
  const cold = await listColdCwds(opts)
  const stale = (await listStaleCwds({ ...opts, limit: Infinity })).candidates
  const coldHashes = new Set(cold.map((c) => c.hash)) // 同一组两判据可达 ⇒ 并集去重（逐组恰回收一次）
  const candidates = [...cold, ...stale.filter((c) => !coldHashes.has(c.hash))]

  if (!candidates.length) {
    await api?.window?.showInformationMessage?.("ThinCoder: no cold session data found — nothing to clean.")
    return { candidates: 0, confirmed: false, deleted: 0, files: 0, skipped: 0 }
  }
  const pick = await api?.window?.showWarningMessage?.(
    `ThinCoder: recycle session data for ${candidates.length} cold project(s)? ` +
      "The files are moved to the sessions-trash recycle bin (recoverable for 7 days).",
    { modal: true },
    "Delete",
  )
  if (pick !== "Delete") return { candidates: candidates.length, confirmed: false, deleted: 0, files: 0, skipped: 0 }

  let deleted = 0
  let files = 0
  let skipped = 0
  let skippedFiles = 0
  // 一次性目录名快照（逐组重校验复用免逐组全目录 readdir；① 面 manifest 读与探测束仍逐组新鲜）
  let entries = null
  try { entries = await readdir(dir) } catch { entries = null }
  for (const c of candidates) {
    const r = await deleteColdCwd(c.hash, { ...opts, entries }) // 内部重校验（TOCTOU）：期间变活 / 出窗 ⇒ 拒绝（零删除）
    if (r.ok) {
      deleted += 1
      files += r.deleted.length
      skippedFiles += r.skipped?.length ?? 0 // 逐文件 rename 失败（占用 / 竞态）——原文件留在原地
    } else skipped += 1 // 拒绝行计入汇总（其余组继续）
  }
  const notes = []
  if (skipped) notes.push(`${skipped} no longer cold`)
  if (skippedFiles) notes.push(`${skippedFiles} file(s) locked/racing`)
  await api?.window?.showInformationMessage?.(
    `ThinCoder: recycled ${deleted} project(s), ${files} file(s)` + (notes.length ? `; skipped ${notes.join(" · ")}.` : "."),
  )
  return { candidates: candidates.length, confirmed: true, deleted, files, skipped }
}
