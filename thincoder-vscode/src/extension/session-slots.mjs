/**
 * session-slots.mjs — 端壳：本端记录（end marker）+ 恢复决策（VS Code 端）。
 *
 * W11（CORE-UNIFICATION · VSC 接线 · 2026-09-15）：slot / manifest / 路径 / 属主判定 / 认领面
 * **单源 = 核**（`@thincoder/core/session-slots.mjs` · `session-slots-manifest.mjs` ·
 * `session.mjs`——存储契约 version 1/2 不变：同一
 * `~/.thincoder/sessions/<sha1(cwd)>.json.{N,manifest}`，与 CLI 共文件；旧短哈希迁移面随核
 * `session-migrate` 在位）。
 * 本档保留 = 真端差面（`docs/core/design/SESSION.md` §6.10 D-1/D-4「VSC 镜像」）：
 *   ① 本端记录（end marker）后缀 `END = "vscode"`——核 = `"cli"`：两端各写各的文件（NF1
 *      本端记录 = 本端单写者文件；跨端互写正是端分离恢复要消的病——D-SE9/D-SE10）；
 *   ② `resumeSlot` 恢复决策（D-2 ①②③）读**本端**记录——算法与核 `resumeSlot` 同源同步骤，
 *      差异只在 marker（核实现把 `END` 写死）；
 *   ③ `sessionsDir` 访问器（核未导出根目录访问器——由核 `sessionPath` 反推，保持单源：
 *      随核 `configDir` 与核 `_setSessionsDirForTest` 沙箱缝走，本档零副本）。
 *
 * F-MI7（2026-09-18 · MULTI-INSTANCE-COLLAB §3.1——端侧探测收口）：
 *   ① 本档**零自有探测**——死主清理改核 `cleanDeadOwners(m, bundle)`（本档私有副本退场）；
 *      可用判据 `usableSlot` = 核内同名件镜像（核内私有未导出），入参改**判据束**；
 *   ② `resumeSlot` → **async**：入口一次 `probeOwnersAsync(ownerPids(m))` 拿束（清单空 ⇒
 *      探测面零 exec 早退），清理 / 占用 / 分配全部查表——与核 `resumeSlot` 同形。
 *      三态（D-MI10/D-MI11）：属主 unknown（探测失败 / 缺行）⇒ 槽**不可用**——保守回落到
 *      `allocateFresh` 取全新号，绝不与「可能活着」的属主同槽（核 `usableSlot` 同判据）。
 * 核缺口（本档登记 · 见 §5 未决）：核 marker 面为编译期单值（`END = "cli"`）⇒ 端壳无法零行为差
 * 地直接消费核 `resumeSlot`（消费即写核端 marker = 跨端互写）。候选核内笔 =
 * `resumeSlot(cwd, { end })` 形态。
 */
import { existsSync, readFileSync } from "node:fs"
import { dirname } from "node:path"
// 本档体内使用（其余核名 = 纯转口，见下 `export … from`）。
import {
  getSessionId, sessionPath, slotPath, manifestPath, loadManifest,
  writeSessionFile, claimSlot, allocateFresh,
} from "@thincoder/core/session-slots.mjs"
import { loadSlotFile } from "@thincoder/core/session.mjs"
// F-MI7 判据面（单源 = 核）：探测束 + 属主三态 / 死主清理 / pid 清单。
import { probeOwnersAsync } from "@thincoder/core/process-probe.mjs"
import { ownerPids, ownerStateOf, cleanDeadOwners } from "@thincoder/core/session-slots-manifest.mjs"

// 单源转口（核面——调用方 import 路径与名面不变）：路径 / manifest / 属主 / 认领 / 沙箱缝。
// （原端壳导出名 `writeFile` → 核名 `writeSessionFile`——原子写单点；0 外部消费方。）
export {
  getSessionId, normalizeCwd, sessionPath, slotPath, manifestPath, loadManifest, saveManifest,
  writeSessionFile, slotDigest, isProcessAlive, activeSlot, claimSlot, allocateFresh,
  _setSessionsDirForTest, _resetSessionsDirForTest,
} from "@thincoder/core/session-slots.mjs"
export { slotOccupancy } from "@thincoder/core/session.mjs"

/** 本端 sessions 根目录（核未导出根访问器——核 `sessionPath` 去掉 hash 文件名即根）。
 *  单源：核 `configDir` 变更与核 `_setSessionsDirForTest` 沙箱缝自动随动（本档零副本）。
 *  消费方 = `peer-domains.mjs`（peers 根 = 其父目录）。W17 前另列 `read-history-discovery.mjs`（跨 cwd 发现）——该档已退役删旧（孤儿档清退），消费方面随之退场。 */
export function sessionsDir() {
  return dirname(sessionPath(process.cwd()))
}

// ─── 本端记录（end marker——SESSION.md §6.10 D-1/D-4「VSC 镜像」）────────────

/** 端常量：本端记录文件后缀——VS Code 写 .vscode、CLI 写 .cli，互不触碰（NF1：本端记录是
 *  本端单写者文件——不新增跨端共享可变字段）。 */
export const END = "vscode"

/** 本端记录路径：{manifest}.{END}（manifest 旁的独立小文件，非内嵌字段——NF1）。 */
export function endMarkerPath(cwd) { return `${manifestPath(cwd)}.${END}` }

/** 读本端记录：返回 { slot: <number|null>, updatedAt } 或 null。三态语义（D-1）：
 *  文件缺失 = 从未记录（升级/首用迁移窗口——可能触发一次性继承）；
 *  JSON 解析失败/结构非法（损坏）= 按"缺失"降级——不 rename 不 unlink（幂等、不误伤）；
 *  `slot: null` = 显式置空（删过本端记录槽——绝不触发继承，T-M4）。 */
export function readEndMarker(cwd) {
  try {
    const p = endMarkerPath(cwd)
    if (!existsSync(p)) return null
    const m = JSON.parse(readFileSync(p, "utf8"))
    if (m && m.slot === null) return { slot: null, updatedAt: m.updatedAt ?? null }
    if (m && Number.isInteger(m.slot) && m.slot >= 1) return { slot: m.slot, updatedAt: m.updatedAt ?? null }
    return null
  } catch { return null }
}

/** 写本端记录（原子 .tmp+rename——核 `writeSessionFile`）：slot = 目标槽号或 null（显式置空）。
 *  失败容忍（NF2）：写失败按无记录路径降级——不抛错，不影响会话数据。 */
export function writeEndMarker(cwd, slot) {
  try {
    writeSessionFile(endMarkerPath(cwd), { slot, updatedAt: Date.now() })
  } catch { /* NF2：失败容忍 */ }
}

// ─── 恢复决策（D-2——读本端记录；核 `resumeSlot` 同算法 · 异 marker）────────────

/** 本端记录槽可用判据（D-2）：slot ∈ m.slots + 槽文件在盘 + 属主 空/死/本进程。
 *  F-MI7：属主判定查**判据束**（零自有探测——与核内同名件逐字同判据）；属主 unknown
 *  （探测失败 / 缺行）⇒ **不可用**（不认领——保守：回落到 allocateFresh 取全新号）。
 *  注意判据不得以「文件缺失」短路死主判定（活进程在「认领 → 首次保存」窗口文件暂缺——
 *  误删致双进程同槽）：本函数只判**可用性**，不删条目；删除归核 `cleanDeadOwners`。 */
function usableSlot(cwd, m, slot, bundle = null) {
  if (!m.slots[slot] || !existsSync(slotPath(cwd, slot))) return false
  const owner = m.slotSessions?.[slot]
  if (!owner || owner === getSessionId()) return true
  return ownerStateOf(owner, bundle) === "dead"
}

/**
 * 恢复决策（SESSION.md §10 D-2）——面板 resolve 的本端恢复入口（核 `resumeSlot` 同算法、
 * 读**本端**记录）：返回 { slot, data }（data 可为 null——全新起步或读槽失败）。判据：
 *   ① 本端记录可用（slot ≠ null 且 ∈ m.slots 且槽文件在盘 且属主 空/死/本进程）→ claimSlot；
 *   ② 记录缺失（文件不存在 = 从未记录——升级/首用迁移窗口）：
 *      ②a active 属主 = 本进程（同进程重入——ensureActive 早退语义镜像：认领后尚未写 slots
 *         条目/文件的窗口）→ 直接沿用；
 *      ②b 否则一次性继承 manifest.active（同判据；活属主绝不继承——全新槽起步，T-M3）；
 *   ③ 其余一切（slot:null 显式置空 / 槽被删 / 属主为活外人 / 继承失败）→ allocateFresh。
 * 每次落点都写本端记录；claim 后读槽失败（.corrupted/.unreadable——`loadSlotFile` 既有改名
 * 保全语义）→ 保持已 claim 槽 + data:null——不回滚认领、不改 marker——下次保存原地重建（T-M15）。
 * 读槽 = 核 `loadSlotFile`（端侧无裸 v1 单文件兜底——核 `resumeSlot` 有该兜底，见 §5 登记）。
 *
 * F-MI7：**async**——入口一次 `probeOwnersAsync(ownerPids(m))` 拿判据束（死主清理 / 可用
 * 判据 / 空闲分配三面共用一束——零逐 pid exec；ownerPids 清单空 ⇒ 探测面零 exec 早退）。
 */
export async function resumeSlot(cwd) {
  const m = loadManifest(cwd)
  m.slotSessions ??= {}
  const bundle = await probeOwnersAsync(ownerPids(m)) // F-MI7：入口一次异步束
  // 与核 ensureActive 同型的死主清理（认领路径持久化——仅传 m 等于没删）
  const deadParam = cleanDeadOwners(m, bundle)
  const rec = readEndMarker(cwd) // null = 缺失/损坏；{slot:null|N} = 文件在（D-1）
  let slot = null
  if (rec?.slot != null && usableSlot(cwd, m, rec.slot, bundle)) slot = rec.slot // ① 本端记录可用
  else if (rec === null) {
    if (m.active && m.slotSessions?.[m.active] === getSessionId()) slot = m.active // ②a 同进程重入
    else if (m.active && usableSlot(cwd, m, m.active, bundle)) slot = m.active // ②b 一次性继承
  }
  if (slot !== null) claimSlot(cwd, slot, m, deadParam)
  else slot = allocateFresh(cwd, m, deadParam, bundle) // ③ 全新分配（slot:null 绝不继承——T-M4）
  const data = loadSlotFile(cwd, slot)
  writeEndMarker(cwd, slot)
  return { slot, data }
}
