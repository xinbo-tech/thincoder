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
 *
 * F-MI7（2026-09-18 · MULTI-INSTANCE-COLLAB §3.1——端侧探测收口）：
 *   ① 端壳落点**零自有探测**——`newSlot` 入口一次 `probeOwnersAsync(ownerPids(m))` 拿判据束，
 *      死主清理 / 空闲选号 / 活认领跳过全部查表（三态 D-MI10/D-MI11：unknown ⇒ 保留 + 跳过，
 *      绝不判死、绝不抢"可能活着"属主的号）；
 *   ② `resumeSlot` 包装器 → **async**（核同名件同形）；本档新增 `cachedSlot(cwd)`，见下。
 */
import { existsSync, unlinkSync } from "node:fs"
// 本档体内使用（其余名面 = 纯转口，见下 `export … from`）。
import { loadSlotFile } from "@thincoder/core/session.mjs"
import { newSlotData } from "@thincoder/core/session-slot-write.mjs"
import { unlinkRecordStore } from "@thincoder/core/session-store.mjs"
// F-MI7 判据面（单源 = 核）：探测束 + 属主三态 / pid 清单。
import { probeOwnersAsync } from "@thincoder/core/process-probe.mjs"
import { ownerPids, ownerStateOf } from "@thincoder/core/session-slots-manifest.mjs"
import {
  getSessionId, slotPath, loadManifest, saveManifest, writeSessionFile,
  slotDigest, slotOccupancy, readEndMarker, writeEndMarker,
} from "./session-slots.mjs"
import { scheduleSessionGC } from "./session-gc.mjs"
import { resumeSlot as slotsResumeSlot } from "./session-slots.mjs"
import {
  _setSessionsDirForTest as slotsSetSessionsDirForTest,
  _resetSessionsDirForTest as slotsResetSessionsDirForTest,
} from "./session-slots.mjs"

// ─── 单源转口（既有 import 路径与名面不变）────────────────────────────────

// slot / manifest / 路径 / 属主 / 沙箱缝（源 = 核 `session-slots.mjs`，经端壳 session-slots；
// 沙箱两缝在本档**包装**后再导出——见下「沙箱缝 + 解析缓存」）
export {
  getSessionId, normalizeCwd, slotPath, manifestPath, loadManifest, saveManifest,
  activeSlot, slotOccupancy, sessionsDir,
  END, endMarkerPath, readEndMarker, writeEndMarker, claimSlot, allocateFresh,
} from "./session-slots.mjs"

// 核会话面（读槽 / 列表 / 标题 / 双线瘦身 / 旧格式判定）——`saveSessionToSlot` 名面 = 核
// `saveSlotData`（读-改-写 + F2 轮转 + manifest 摘要单点）。
export { loadSlotFile as loadSlot, listSlots, renameSlot as setSlotTitle, slimForDisplay, isLegacyTransient } from "@thincoder/core/session.mjs"
export { saveSlotData as saveSessionToSlot } from "@thincoder/core/session-slot-write.mjs"

// 人读线惰性窗口面（`history-window.mjs`——W6 起即核面转口）
export { historyWindow, HISTORY_PAGE_SIZE, isRealUserMsg } from "./history-window.mjs"

// 槽开关写面（源 = 核 `session-slot-write.mjs`，经端壳 session-slot-write）
export {
  newSlotData, setSlotAutoApprove, setSlotPlanMode, setSlotEngineering, setSlotAdvisorGuard,
  setSlotEngDesignTokens,
} from "./session-slot-write.mjs"

// ─── 沙箱缝 + 解析缓存（F-MI7）──────────────────────────────────────────

/** cwd → 本进程**已解析绑定**的槽号（`resumeSlot` / `newSlot` / `switchToSlot` /
 *  `deleteSlotAndUpdate` 四个落点写穿）。用途 = `panel-session.ensureSlot` 的**零探测冷路径**
 *  直读源：命中即返（零 exec、零 manifest 读），未命中则后台收敛（N-MI2）。
 *  条目 = 纯值快照（陈旧只影响新鲜度——真值仍以 manifest / 本端记录为准）；环境变更
 *  （沙箱缝）即整体失效。 */
const slotCache = new Map()

/** 沙箱缝包装：目录切换 ⇒ 解析缓存失效（缓存不得跨沙箱 / 跨目录根存活）。 */
export function _setSessionsDirForTest(...args) { slotCache.clear(); return slotsSetSessionsDirForTest(...args) }
export function _resetSessionsDirForTest(...args) { slotCache.clear(); return slotsResetSessionsDirForTest(...args) }

/** 冷路径读源：本 cwd 已解析的槽号（无 ⇒ null）。纯内存读——**零探测零 IO**。 */
export function cachedSlot(cwd) {
  const s = slotCache.get(cwd)
  return s == null ? null : s
}

/** 恢复决策包装（SESSION.md §6.12 启动钩子，2026-09-06）：面板恢复入口触发一次残留 GC——
 *  scheduleSessionGC 内部 setImmediate 空闲执行 + 每进程每前缀去重，不阻塞激活路径（N4）。
 *  F-MI7：转 async（核同名件同形）+ 解析结果写穿缓存（冷路径直读源）。 */
export async function resumeSlot(cwd) {
  scheduleSessionGC(cwd)
  const r = await slotsResumeSlot(cwd)
  if (r?.slot != null) slotCache.set(cwd, r.slot)
  return r
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
 *  经显式落盘（条目级合并会把磁盘死条目从 fresh 复活回写）。
 *  F-MI7：**async** + 入口一次判据束（零逐 pid exec——旧实现 `isProcessAlive` 逐 pid 一次），
 *  三态判定（D-MI10/D-MI11）：死主判定 = `ownerStateOf === "dead"`（unknown ⇒ **保留**——
 *  旧实现把 undefined（探测失败）当死 ⇒ 误删"可能活着"属主条目，本批收正）；活认领跳过 =
 *  `!== "dead"`（unknown 一并跳过——保守）。 */
export async function newSlot(cwd) {
  const m = loadManifest(cwd)
  const mySessionId = getSessionId()
  const bundle = await probeOwnersAsync(ownerPids(m)) // F-MI7：入口一次异步束（空清单 ⇒ 零 exec）
  const deadSlots = []
  for (const [s, owner] of Object.entries(m.slotSessions ?? {})) {
    if (owner && owner !== mySessionId && ownerStateOf(owner, bundle) === "dead") {
      delete m.slotSessions[s]
      if (!existsSync(slotPath(cwd, Number(s)))) delete m.slots[s]
      deadSlots.push(s)
    }
  }
  const liveClaimed = (n) => {
    const owner = m.slotSessions?.[n]
    return !!(owner && owner !== mySessionId && ownerStateOf(owner, bundle) !== "dead")
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
  slotCache.set(cwd, slot)
  return slot
}

/** Switch active slot. Returns the loaded session data (null if slot doesn't exist). Same as CLI switchToSlot.
 *  D-4：成功后写本端记录（「打开历史会话」落点）。
 *  先 loadSlot 成功才翻 active 指针（文件缺失/损坏时返回 null 且不产生幻影 active，与核
 *  「切换不得有认领副作用」对齐）；目标槽被另一活进程占用则不认领（防双属主）——
 *  占用判定单源 = 核 `slotOccupancy`（F-MI7 有界同步例外：槽内单次有界探测、不在
 *  每回合面上——§3.1 判据条③）。
 *  F-MI7 收敛（SESSION.md §6.15 P3/P4）：占用时本端记录面（`{manifest}.vscode` marker +
 *  解析缓存）**保持原值不动**——被占槽是占用方的事，本端不得把它记成「最后使用槽」
 *  （否则面板 `_slot` 经缓存钉到别人的槽上 = 双写同槽）；共享 active 指针仍翻（D-6——
 *  CLI 互操作面，非本端记录面）。 */
export function switchToSlot(cwd, slot) {
  const m = loadManifest(cwd)
  if (!m.slots[slot]) return null
  const data = loadSlotFile(cwd, slot)
  if (!data) return null
  m.active = slot
  const occ = slotOccupancy(cwd, slot)
  if (!occ.occupied) {
    m.slotSessions ??= {}
    m.slotSessions[slot] = getSessionId()
  }
  saveManifest(cwd, m, null, { setActive: true })
  // 本端记录面（marker + 解析缓存）只在未占时写穿（P3/P4）——被占 ⇒ 保持原值不动。
  if (!occ.occupied) {
    writeEndMarker(cwd, slot) // D-4：switchToSlot 成功后
    slotCache.set(cwd, slot) // 绑定事实写穿（与面板 _slot 同落点）
  }
  return data
}

/** Delete a slot + remove from manifest. Returns the new active slot (or null if none left).
 *  deletions 显式删除（防 saveManifest 合并复活）+ 删到 active 时置空指针（不替面板选「最小
 *  剩余号」——可能指向另一活进程的槽）；删到本端记录槽 → 记录显式置空（文件保留 + slot:null
 *  ——下次启动全新起步：不继承他人遗留、不复活被删会话——T-M4/T-M8）。
 *  核同源步：核 `deleteSlot` 的 `unlinkRecordStore`（§6.14——记录存储 sidecar `{槽文件}.d/`
 *  随槽删除；CLI 绑定态会产生该目录，VSC 自身不建——共享会话目录的卫生语义单源）。 */
export function deleteSlotAndUpdate(cwd, slot) {
  try { unlinkSync(slotPath(cwd, slot)) } catch { /* 缺文件即幂等 */ }
  unlinkRecordStore(slotPath(cwd, slot)) // §6.14 删槽联动（核 `deleteSlot` 同源步）
  const m = loadManifest(cwd)
  delete m.slots[slot]
  if (m.slotSessions) delete m.slotSessions[slot]
  if (m.active === slot) delete m.active
  saveManifest(cwd, m, { slots: [slot], slotSessions: [slot] }, { setActive: true })
  if (readEndMarker(cwd)?.slot === slot) writeEndMarker(cwd, null)
  // 解析缓存随删槽收敛：删的是已解析槽 ⇒ 清空（下次 ensureSlot 经 resumeSlot 重新认领，
  // F4「null 时保持置空」）。**不得改随幸存 active**——那可能是他端活槽（收养 ⇒ 面板
  // `_slot` 钉到别人槽上 + 本端记录写别人槽 = P3/P4 违约；幸存槽由认领束另择新号）。
  if (slotCache.get(cwd) === slot) slotCache.delete(cwd)
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
