/**
 * session-io.mjs — 端壳：会话文件 I/O + 高阶会话操作（VS Code 端）。
 *
 * W11（CORE-UNIFICATION · VSC 接线 · 2026-09-15）：自持会话实现退场——读槽 / 写槽 / 列表 /
 * 标题 / 双线瘦身 / 旧格式工具**单源 = 核会话面**（`@thincoder/core/session.mjs` 族 +
 * `session-slots` / `session-slot-write` / `session-gc`）；存储契约 version 1/2 不变
 * （同一 `~/.thincoder/sessions/<sha1(cwd)>.json.{N,manifest}`，与 CLI 共文件——
 * A14 存储契约以 CLI 为准）。
 * 本档保留 = 真端差面（`docs/core/design/SESSION.md` §6.10 D-4「VSC 镜像」——**本端**记录
 * `{manifest}.vscode` 的四个维护落点）：`resumeSlot` / `newSlot` / `switchToSlot` /
 * `deleteSlotAndUpdate`。核对应件（`resumeSlot`/`newSession`/`switchToSlot`/`deleteSlot`）
 * 把核端 marker（`.cli`）写死 ⇒ 直接消费 = 跨端互写（D-SE9/D-SE10 反例）⇒ 端壳按本端 marker
 * 自持该四个落点（认领 / 选号 / 落盘序列 = 核同源步骤 + 核原语复用）。
 * 另两件端侧自有：`loadModelPrefs`/`saveModelPrefs`（workspaceState，非会话文件）·
 * `stripTruncatedToolArgs`（核内私有件、未导出——`applySession` 机读线播种同规则）。
 */
import { existsSync, unlinkSync } from "node:fs"
// 本档体内使用（其余名面 = 纯转口，见下 `export … from`）。
import { loadSlotFile } from "@thincoder/core/session.mjs"
import { newSlotData } from "@thincoder/core/session-slot-write.mjs"
import { unlinkRecordStore } from "@thincoder/core/session-store.mjs"
import {
  getSessionId, slotPath, loadManifest, saveManifest, writeSessionFile,
  isProcessAlive, slotDigest, slotOccupancy, readEndMarker, writeEndMarker,
} from "./session-slots.mjs"
import { scheduleSessionGC } from "./session-gc.mjs"
import { resumeSlot as slotsResumeSlot } from "./session-slots.mjs"

// ─── 单源转口（既有 import 路径与名面不变）────────────────────────────────

// slot / manifest / 路径 / 属主 / 沙箱缝（源 = 核 `session-slots.mjs`，经端壳 session-slots）
export {
  getSessionId, normalizeCwd, slotPath, manifestPath, loadManifest, saveManifest,
  activeSlot, slotOccupancy, sessionsDir, _setSessionsDirForTest, _resetSessionsDirForTest,
  END, endMarkerPath, readEndMarker, writeEndMarker, claimSlot, allocateFresh,
} from "./session-slots.mjs"

// 核会话面（读槽 / 列表 / 标题 / 双线瘦身 / 旧格式判定）——`saveSessionToSlot` 名面 = 核
// `saveSlotData`（读-改-写 + F2 轮转 + manifest 摘要单点）。
export { loadSlotFile as loadSlot, listSlots, renameSlot as setSlotTitle, slimForDisplay, isLegacyTransient } from "@thincoder/core/session.mjs"
export { saveSlotData as saveSessionToSlot } from "@thincoder/core/session-slot-write.mjs"

// 人读线惰性窗口面（`history-window.mjs`——W6 起即核面转口）
import { historyWindow, HISTORY_PAGE_SIZE, isRealUserMsg } from "./history-window.mjs"
export { historyWindow, HISTORY_PAGE_SIZE, isRealUserMsg } from "./history-window.mjs"

// 槽开关写面（源 = 核 `session-slot-write.mjs`，经端壳 session-slot-write）
export {
  newSlotData, setSlotAutoApprove, setSlotPlanMode, setSlotEngineering, setSlotAdvisorGuard,
  setSlotEngDesignTokens,
} from "./session-slot-write.mjs"

/** 恢复决策包装（SESSION.md §12 启动钩子，2026-09-06）：面板恢复入口触发一次残留 GC——
 *  scheduleSessionGC 内部 setImmediate 空闲执行 + 每进程每前缀去重，不阻塞激活路径（N4）。 */
export function resumeSlot(cwd) {
  scheduleSessionGC(cwd)
  return slotsResumeSlot(cwd)
}

/** slimForDisplay 截断的 arguments 以 U+2026（…）结尾——不是合法 JSON 的完整值。
 *  v1 老文件回退播种机器线时置为 {}（合法空参数），防止半截 \\uXXXX 毒化发送载荷
 *  （核 `applySession` 同规则；核内该函数为私有件——端侧保留同形件）。 */
export function stripTruncatedToolArgs(m) {
  if (m?.role !== "assistant" || !Array.isArray(m.tool_calls)) return m
  let changed = false
  const tool_calls = m.tool_calls.map((tc) => {
    const args = tc?.function?.arguments
    if (typeof args === "string" && args.endsWith("…")) {
      changed = true
      return { ...tc, function: { ...tc.function, arguments: "{}" } }
    }
    return tc
  })
  return changed ? { ...m, tool_calls } : m
}

// ─── 端壳落点（D-4「VSC 镜像」——本端 marker 维护；核同源步骤 + 核原语）────────────

/** 新建会话槽：选号（最小空闲号——跳过 manifest 条目 / 现存文件 / 活进程认领号）+ 写空槽 +
 *  记所有权 + 翻 active + 写本端记录（D-4：newSlot 成功后）。
 *  2026-09-01 CLI 同步：开头清理死主条目（死主且文件缺失的槽号回收复用，与核 ensureActive
 *  分支 2 语义对齐）；立即记录所有权（F3——否则并发方会把新 active 槽当空闲认领）；deletions
 *  经显式落盘（条目级合并会把磁盘死条目从 fresh 复活回写）。 */
export function newSlot(cwd) {
  const m = loadManifest(cwd)
  const mySessionId = getSessionId()
  const deadSlots = []
  for (const [s, owner] of Object.entries(m.slotSessions ?? {})) {
    if (owner && owner !== mySessionId) {
      const pid = parseInt(owner.split("-")[0])
      if (!pid || !isProcessAlive(pid)) {
        delete m.slotSessions[s]
        if (!existsSync(slotPath(cwd, Number(s)))) delete m.slots[s]
        deadSlots.push(s)
      }
    }
  }
  const liveClaimed = (n) => {
    const owner = m.slotSessions?.[n]
    return !!(owner && owner !== mySessionId && isProcessAlive(parseInt(owner.split("-")[0])))
  }
  let slot = 1
  while (m.slots[slot] || existsSync(slotPath(cwd, slot)) || liveClaimed(slot)) slot++
  const data = newSlotData(cwd)
  writeSessionFile(slotPath(cwd, slot), data)
  m.slotSessions ??= {}
  m.slotSessions[slot] = mySessionId
  m.slots[slot] = slotDigest(data)
  m.active = slot
  const deletions = deadSlots.length
    ? {
        slotSessions: deadSlots.filter((s) => m.slotSessions[s] !== mySessionId),
        slots: deadSlots.filter((s) => !m.slots[s]),
      }
    : null
  saveManifest(cwd, m, deletions, { setActive: true })
  writeEndMarker(cwd, slot) // D-4：newSlot 成功后
  return slot
}

/** Switch active slot. Returns the loaded session data (null if slot doesn't exist). Same as CLI switchToSlot.
 *  D-4：成功后写本端记录（「打开历史会话」落点）。
 *  先 loadSlot 成功才翻 active 指针（文件缺失/损坏时返回 null 且不产生幻影 active，与核
 *  「切换不得有认领副作用」对齐）；目标槽被另一活进程占用则不认领（防双属主——占用方
 *  `_slot` 粘性不受影响）——占用判定单源 = 核 `slotOccupancy`。 */
export function switchToSlot(cwd, slot) {
  const m = loadManifest(cwd)
  if (!m.slots[slot]) return null
  const data = loadSlotFile(cwd, slot)
  if (!data) return null
  m.active = slot
  if (!slotOccupancy(cwd, slot).occupied) {
    m.slotSessions ??= {}
    m.slotSessions[slot] = getSessionId()
  }
  saveManifest(cwd, m, null, { setActive: true })
  writeEndMarker(cwd, slot) // D-4：switchToSlot 成功后
  return data
}

/** Delete a slot + remove from manifest. Returns the new active slot (or null if none left).
 *  deletions 显式删除（防 saveManifest 合并复活）+ 删到 active 时置空指针（不替面板选「最小
 *  剩余号」——可能指向另一活进程的槽）；删到本端记录槽 → 记录显式置空（文件保留 + slot:null
 *  ——下次启动全新起步：不继承他人遗留、不复活被删会话——T-M4/T-M8）。
 *  核同源步：核 `deleteSlot` 的 `unlinkRecordStore`（§14.3.8——记录存储 sidecar `{槽文件}.d/`
 *  随槽删除；CLI 绑定态会产生该目录，VSC 自身不建——共享会话目录的卫生语义单源）。 */
export function deleteSlotAndUpdate(cwd, slot) {
  try { unlinkSync(slotPath(cwd, slot)) } catch { /* 缺文件即幂等 */ }
  unlinkRecordStore(slotPath(cwd, slot)) // §14.3.8 删槽联动（核 `deleteSlot` 同源步）
  const m = loadManifest(cwd)
  delete m.slots[slot]
  if (m.slotSessions) delete m.slotSessions[slot]
  if (m.active === slot) delete m.active
  saveManifest(cwd, m, { slots: [slot], slotSessions: [slot] }, { setActive: true })
  if (readEndMarker(cwd)?.slot === slot) writeEndMarker(cwd, null)
  return m.active ?? null
}

// ─── Model prefs (workspaceState, unrelated to session files) ──

/** Load model prefs from workspaceState */
export function loadModelPrefs(workspaceState) {
  try { return workspaceState.get("thincoder.modelPrefs") || {} } catch { return {} }
}

/** Save model prefs to workspaceState */
export function saveModelPrefs(workspaceState, prefs) {
  try { workspaceState.update("thincoder.modelPrefs", prefs) } catch {}
}
