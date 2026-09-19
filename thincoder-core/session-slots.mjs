/**
 * session-slots.mjs — slot / manifest 管理（2026-08-31 advisor round1 🔴 拆分：
 * session.mjs 曾超 500 行硬限；slot 所有权、认领、清单与核心读写分离，session.mjs
 * re-export 全部导出以保持既有 import 兼容）。
 *
 * init-block 批 · F-MI7 二次拆分：探测束接线后本档实读 517 行（破 490 判定线并越 500 硬限）
 * ⇒ 按 `CORE-UNIFICATION.md` §2.8.1 表第 3 行**随批**外提清单 / 认领 / 属主面至
 * `session-slots-manifest.mjs`（语义原样迁移；本档 re-export 该档导出保既有 import 面——
 * 消费档 import 路径与名面不动）。本档保留 = 存储原语（cwd 哈希 / 路径 / 原子写 / 进程
 * sessionId）· 端记录（end marker）· 列表面（listSlots / loadSlotMeta）· 删槽 · 恢复决策面
 * （usableSlot / loadLegacyFile / resumeSlot）。
 *
 * 模型：每个项目（cwd hash）拥有无限编号 slot；manifest 记录 active 指针 + 每个
 * slot 的属主进程（slotSessions: slot → "pid-timestamp-random"，CLI ↔ VS Code
 * 共享 manifest 以互斥认领）。
 *
 * 属主判定（init-block 批 · F-MI7 · SESSION.md §6.2）：**入口一次探测束**
 * （`probeOwnersSync` / `probeOwnersAsync`——≤1 判活 + ≤1 命令行拿全量属主 pid），
 * 清理 / 占用 / 空闲一律**查表**（`ownerState` 三态：dead / alive / unknown）——
 * 本档零自有 exec、零逐 pid 探测。unknown（探测失败 / 缺行）⇒ 不认领 / 不判死 / 不删，
 * 方向不对称见 process-probe.mjs 头注（D-MI10）。
 */

import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from "node:fs"
import { join, dirname, basename } from "node:path"
import { configDir } from "./config.mjs"
import { migrateHashLength } from "./session-migrate.mjs"
// §6.10 D-2（2026-09-05）：resumeSlot 决策归本文件（slot/claim 层）；data 层读（loadSlotFile/
// legacy 过滤）属 session.mjs（500 行内不迁移）——静态环（本档 ↔ session.mjs；init-block 批起
// 另加本档 ↔ session-slots-manifest.mjs，见头注与 L38-47）：函数声明实例化期已初始化、只函数
// 体内运行时使用（环安全）；VS Code 端 session-slots ↔ session-io 同构镜像。
import { loadSlotFile, isLegacyTransient } from "./session.mjs"
// TUI-OOM-ROOTCAUSE 批（SESSION.md §6.14 生命周期联动）：删槽联动记录存储（store 零项目内依赖——无环）。
import { unlinkRecordStore } from "./session-store.mjs"
// 探测束（init-block 批 · F-MI7）：实现 / 判据单源住 process-probe.mjs——本档零自有 exec、
// 零逐 pid 探测（判据面与探测面分离）；单 pid 判活 re-export 见下方「判活兼容面」。
import { probeOwnersAsync, isProcessAlive } from "./process-probe.mjs"
// 清单 / 认领 / 属主面（init-block 批外提——双向静态环见头注）：本档 import 取用 + re-export
// 保既有 import 面（消费档路径与名面不动）。
import {
  extractSlotMeta, loadManifest, saveManifest, ownerPids, ownerStateOf, cleanDeadOwners,
  allocateFresh, claimSlot, activeSlot,
} from "./session-slots-manifest.mjs"
export {
  slotDigest, loadManifest, saveManifest, ownerPid, ownerPids,
  allocateFresh, claimSlot, activeSlot,
} from "./session-slots-manifest.mjs"

let currentSessionId = null

/** Generate unique session ID for this process */
export function getSessionId() {
  if (!currentSessionId) {
    currentSessionId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
  return currentSessionId
}

/** Normalize cwd for hashing: uppercase Windows drive letter so both ends
 *  (CLI's process.cwd() vs VS Code's uri.fsPath, which lowercases it) agree. */
export function normalizeCwd(cwd) {
  return cwd.replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")
}

/** Full sha1 hex (40 chars), not truncated. Shared contract with the VS Code extension. */
function cwdHash(cwd) {
  return createHash("sha1").update(normalizeCwd(cwd)).digest("hex")
}

/** sessions 根目录隔离缝（2026-09-08 DESIGN-TOKEN-SETTLEMENT 测试——VSC 端
 *  _setSessionsDirForTest 同构）：默认 null 走真实 configDir；测试指向临时目录
 *  （beforeEach 设、afterEach 复位）。migrateHashLength 的 legacy 迁移仍查真实
 *  目录（temp 哈希无 legacy 文件——no-op 无害）。 */
let sessionsDirOverride = null
export function _setSessionsDirForTest(dir) { sessionsDirOverride = dir }
export function _resetSessionsDirForTest() { sessionsDirOverride = null }
function sessionsBase() { return sessionsDirOverride ?? join(configDir, "sessions") }

/** Derive base session path from cwd hash. Migrates legacy short-hash files on first access. */
export function sessionPath(cwd) {
  const hash = cwdHash(cwd)
  migrateHashLength(cwd, hash)
  return join(sessionsBase(), `${hash}.json`)
}

export function slotPath(cwd, n) { return sessionPath(cwd) + "." + n }
export function manifestPath(cwd) { return sessionPath(cwd) + ".manifest" }

// ========== end marker（SESSION.md §6.10 端分离恢复——本端"最后使用槽位"记录）==========

/** 端常量：本端记录文件后缀——CLI 写 .cli、VS Code 写 .vscode，互不触碰
 *  （NF1：本端记录是本端单写者文件——不新增跨端共享可变字段）。 */
export const END = "cli"

/** 本端记录路径：{manifest}.{END}（manifest 旁的独立小文件，非内嵌字段——NF1）。 */
export function endMarkerPath(cwd) { return `${manifestPath(cwd)}.${END}` }

/** 读本端记录：返回 { slot: <number|null>, updatedAt } 或 null。三态语义（D-1）：
 *  文件缺失 = 从未记录（升级/首用迁移窗口——可能触发一次性继承）；
 *  JSON 解析失败/结构非法（损坏）= 按"缺失"降级——不 rename 不 unlink（幂等、不误伤，
 *  T-M13）；`slot: null` = 显式置空（删过本端记录槽——绝不触发继承，T-M4）。 */
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

/** 写本端记录（原子 .tmp+rename，复用 writeSessionFile）：slot = 目标槽号或 null（显式置空）。
 *  失败容忍（NF2）：写失败按无记录路径降级——不抛错，不影响会话数据（T-M14）。 */
export function writeEndMarker(cwd, slot) {
  try {
    writeSessionFile(endMarkerPath(cwd), { slot, updatedAt: Date.now() })
  } catch { /* NF2：失败容忍 */ }
}

/** Path to the active slot's file */
export function activePath(cwd) {
  return slotPath(cwd, activeSlot(cwd))
}

/** Atomic write: write to temp file then rename to replace, preventing truncated JSON from mid-write crash. */
export function writeSessionFile(p, data) {
  mkdirSync(dirname(p), { recursive: true })
  const tmp = `${p}.tmp`
  writeFileSync(tmp, JSON.stringify(data), "utf8")
  try {
    renameSync(tmp, p)
  } catch {
    try { unlinkSync(p) } catch {}
    try {
      renameSync(tmp, p)
      try { unlinkSync(tmp) } catch {}
    } catch {
      writeFileSync(p, readFileSync(tmp, "utf8"), "utf8")
    }
  }
}

// ========== 清单 / 认领 / 属主面（init-block 批外提——见头注）==========
// 摘要面（slotDigest）· 清单读写（loadManifest / saveManifest）· 属主面（ownerPid / ownerPids /
// ownerStateOf / cleanDeadOwners）· 认领面（ensureActive / allocateFresh / claimSlot / activeSlot）
// 语义原样迁至 `session-slots-manifest.mjs`；本档上方 import 取用、re-export 保既有 import 面。

/** 单 pid 判活（F-MI7：实现移居 `process-probe.mjs`——判据单源 + 同步有界 2 s + 三态）：
 *  此处 re-export 保既有 import 面（`session.mjs` 再 re-export 同保）。
 *  **三态**：`true` 活 / `false` 死 / `undefined` 未知——未知不作死判据（D-MI10）。 */
export { isProcessAlive }

/** Lazy-load slot metadata from slot file (for old-format manifest entries that lack metadata) */
function loadSlotMeta(cwd, slot, v) {
  if (typeof v === "object" && v !== null && "ts" in v) return v
  const ts = typeof v === "number" ? v : 0
  try {
    const p = slotPath(cwd, slot)
    if (!existsSync(p)) return { ts }
    const data = JSON.parse(readFileSync(p, "utf8"))
    const history = data.history ?? []
    const meta = extractSlotMeta(history, data.activeProvider, data.updatedAt ?? ts, data.title ?? "")
    if (data.activeModel) meta.activeModel = data.activeModel
    return { ts, ...meta }
  } catch {
    return { ts }
  }
}

/** List all slots, newest first. Includes isActive flag.
 *  2026-09-01 会诊 🟢：只读操作不认领——原实现 active 缺失时调 activeSlot（写 manifest
 *  副作用，ACP session/list 可触发）。m.active 缺失时全部 isActive=false，由下一次
 *  activeSlot 正常认领。 */
export function listSlots(cwd) {
  const m = loadManifest(cwd)
  const active = m.active ?? null
  return Object.entries(m.slots)
    .filter(([n]) => /^\d+$/.test(n))
    .map(([n, v]) => {
      const meta = loadSlotMeta(cwd, Number(n), v)
      return {
        slot: Number(n),
        isActive: Number(n) === active,
        timestamp: meta.ts,
        date: new Date(meta.ts).toLocaleString(),
        messageCount: meta.messageCount ?? 0,
        turnCount: meta.turnCount ?? 0,
        firstMessage: meta.firstMessage ?? "",
        // MODEL-MERGE-SESSION 摘要 "p:m"：activeProvider 保持裸渠道名——列表消费面显复合
        // （旧摘要无 activeModel → 回退裸渠道名——新老兼容；cmd-session/VSC sessions 行免改）
        activeProvider: meta.activeProvider ? (meta.activeModel ? `${meta.activeProvider}:${meta.activeModel}` : meta.activeProvider) : "",
        updatedAt: meta.updatedAt ?? meta.ts,
        updatedDate: new Date(meta.updatedAt ?? meta.ts).toLocaleString(),
        title: meta.title ?? "",
      }
    })
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Delete a slot: remove its file and manifest entry. Deleting the active slot
 *  resets the manifest active pointer (the next claim re-creates one). */
export function deleteSlot(cwd, slot) {
  const n = Number(slot)
  if (!Number.isInteger(n) || n < 1) return false
  const m = loadManifest(cwd)
  if (!m.slots[n]) return false
  delete m.slots[n]
  delete m.slotSessions?.[n] // orphan session-id entries bloat the manifest forever
  try { unlinkSync(slotPath(cwd, n)) } catch { /* missing file is fine */ }
  unlinkRecordStore(slotPath(cwd, n)) // §6.14 生命周期联动：删槽连带删除记录存储（sidecar）
  if (m.active === n) delete m.active
  // setActive: true —— 显式表达"删到 active 时 active 置空"的意图（saveManifest 默认
  // 保留 fresh.active，2026-09-01 会诊三家 🟡）
  saveManifest(cwd, m, { slots: [n], slotSessions: [n] }, { setActive: true })
  // 2026-09-05 §6.10 D-4/F4：删到本端记录槽 → 记录显式置空（文件保留 + slot:null——下次全新起步，不复活——T-M4/T-M8）
  if (readEndMarker(cwd)?.slot === n) writeEndMarker(cwd, null)
  return true
}

// renameSlot 已拆至 session-rename.mjs（2026-09-06 §6.12 标题写契约使本文件超 500 行硬限，
// 按 §6.12 模块与实现约束拆分）；session.mjs re-export 保持调用点不变。

// ========== resumeSlot（SESSION.md §6.10 D-2——端分离恢复决策）==========

/** 本端记录槽可用判据（D-2）：slot ∈ m.slots + 槽文件在盘 + 属主 空、死、本进程。
 *  F-MI7：占用判据查调用面束（零自有探测）；属主 unknown（探测失败 / 缺行）⇒ **不可用**
 *  （不认领——保守：回落到 allocateFresh 取全新号，绝不与"可能活着"的属主同槽）。 */
function usableSlot(cwd, m, slot, bundle = null) {
  if (!m.slots[slot] || !existsSync(slotPath(cwd, slot))) return false
  const owner = m.slotSessions?.[slot]
  if (!owner || owner === getSessionId()) return true
  return ownerStateOf(owner, bundle) === "dead"
}

/** legacy 单文件兜底（v1/v2 单会话 {hash}.json——迁移前残留；仅 data 层——2026-09-05 §6.10
 *  D-2：恢复数据兜底不改变 claim 落点，T-M10）。纪律与 loadSlotFile 一致：cwd 不匹配（别人的文件）
 *  直接 null 不改名；坏结构改名 .unreadable 保留（version>2 不动）；解析失败 .corrupted 保留。 */
function loadLegacyFile(cwd) {
  const legacy = sessionPath(cwd)
  try {
    if (existsSync(legacy)) {
      const data = JSON.parse(readFileSync(legacy, "utf8"))
      // cwd 不匹配是别人的文件——与 loadSlotFile 一致直接 return null 不改名
      // （"别人的文件不动"原则，2026-08-31 advisor round2 🟡）
      if (data.cwd && data.cwd.toLowerCase() !== cwd.toLowerCase()) return null
      if ((data?.version === 1 || data?.version === 2) && Array.isArray(data.history)) {
        data.history = data.history.filter((m) => !isLegacyTransient(m))
        return data
      }
      // 结构不匹配：保留现场（version>2 的新版文件不动）
      if (!(typeof data?.version === "number" && data.version > 2)) {
        try { renameSync(legacy, `${legacy}.unreadable`) } catch {}
        console.error(`[session] legacy file ${legacy}: invalid structure — preserved as ${basename(legacy)}.unreadable`)
      }
    }
  } catch (e) {
    console.error(`[session] failed to load legacy ${legacy}: ${e.message}`)
    try { renameSync(legacy, `${legacy}.corrupted`) } catch {}
  }
  return null
}

/**
 * 恢复决策（SESSION.md §6.10 D-2）——TUI 启动的本端恢复入口（VS Code 面板同构镜像）。
 * **async**（F-MI7：入口一次异步束——探测不阻塞事件循环；调用面必须 await）。
 * 返回 { slot, data }（data 可为 null——全新起步或读槽失败）。判据：
 *   ① 本端记录可用（slot ≠ null 且 ∈ m.slots 且槽文件在盘 且属主 空/死/本进程）→ claimSlot；
 *   ② 记录缺失（从未记录 = 升级/首用迁移窗口）：②a active 属主 = 本进程（同进程重入——
 *      ensureActive 早退语义镜像：认领后尚未写 slots 条目/文件的窗口）→ 直接沿用；
 *      ②b 否则一次性继承 manifest.active（同判据；活属主绝不继承——全新槽起步，T-M3）；
 *   ③ 其余一切（slot:null 显式置空 / 槽被删 / 属主为活外人 / 继承失败）→ allocateFresh。
 * 每次落点都写本端记录；claim 后读槽失败（.corrupted/.unreadable——loadSlotFile 既有改名
 * 保全语义）→ 保持已 claim 槽 + data:null——不改 marker——下次保存原地重建（T-M15）。
 */
export async function resumeSlot(cwd) {
  const m = loadManifest(cwd)
  m.slotSessions ??= {}
  // 入口一次**异步束**（F-MI7——整链 async）：清理 / 可用 / 空闲全部查表，零逐 pid 探测。
  const bundle = await probeOwnersAsync(ownerPids(m))
  // 与 ensureActive 同型的死主清理（认领路径持久化——F5a 纪律：仅传 m 等于没删）
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
  // data 层：读已认领槽（loadSlotFile 自 session.mjs——环 import 见文件头）；读失败/槽文件不在 → legacy 单文件兜底（仅 data）
  let data = loadSlotFile(cwd, slot)
  if (!data) data = loadLegacyFile(cwd)
  writeEndMarker(cwd, slot)
  return { slot, data }
}
