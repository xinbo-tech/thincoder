/**
 * session.mjs — session persistence (slot-based model)
 * Each project (keyed by cwd hash) keeps unlimited session slots.
 * Every session lives in a numbered slot; the manifest tracks the SHARED active pointer
 * (2026-09-05 §6.10 D-6 修订：active = 旧版端/ACP 的恢复依据 + 无记录端的一次性继承源 +
 * 列表回退高亮——本端恢复依据 = end marker `{manifest}.cli`，见 session-slots.mjs
 * resumeSlot/readEndMarker，SESSION.md §6.1/§6.10）。
 *
 * File layout: {hash}.json.N (slots), {hash}.json.manifest (slot metadata + active pointer).
 * Legacy {hash}.json is migrated to a slot on first access.
 *
 * 2026-08-31 advisor round1 🔴：slot/清单管理拆至 session-slots.mjs（本文件曾超 500 行
 * 硬限）；本文件只保留核心读写 + re-export 全部 slot 导出（既有 import 路径不变）。
 * init-block 批 · F-MI7：会话生命周期面（resumeSlot 包装/applySession/newSession/
 * resetSessionState/switchToSlot/slotOccupancy）拆至 session-lifecycle.mjs（再越 500 行）——
 * 同样 re-export 保面。
 */

import { readFileSync, renameSync, existsSync, statSync } from "node:fs"
import { basename } from "node:path"
import {
  slotPath, writeSessionFile, loadManifest, saveManifest, slotDigest,
  activeSlot, writeEndMarker,
} from "./session-slots.mjs"
// F2 轮转守卫自 2026-09-08 迁至 session-guard.mjs（session-slots 再越 500 行硬限拆分）
import { guardForeignSlotFile } from "./session-guard.mjs"
import { engTokenSlotFields } from "./token-ttl.mjs"
// TUI-OOM-ROOTCAUSE 批（SESSION.md §6.14）：人读线记录存储（磁盘为准 + 内存窗口）。
// slimForDisplay/isLegacyTransient 迁入 store 模块（§6.14 记录存储）——本文件 re-export 保持
// 既有 import 面（session-slots.mjs 引 isLegacyTransient）。依赖方向单向：store 零项目内依赖。
import {
  bindRecordStore, unbindRecordStore, saveProjectedSlot, isLegacyTransient, slimForDisplay,
  RECORD_WINDOW_MESSAGES,
} from "./session-store.mjs"
export { isLegacyTransient, slimForDisplay, bindRecordStore, unbindRecordStore }

// re-export slot 管理（保持既有 import session.mjs 的调用点不变；resumeSlot 见生命周期 re-export）
export {
  getSessionId, normalizeCwd, sessionPath, slotPath, manifestPath, activePath,
  writeSessionFile, slotDigest, loadManifest, saveManifest, activeSlot, listSlots,
  deleteSlot, isProcessAlive, END, endMarkerPath,
  readEndMarker, writeEndMarker, claimSlot, allocateFresh,
} from "./session-slots.mjs"
// §6.12 标题写契约使 session-slots.mjs 超 500 行硬限 → renameSlot 拆至 session-rename.mjs（§6.12 模块与实现约束）
export { renameSlot } from "./session-rename.mjs"
// 人读线惰性窗口面（`history-window.mjs`）——re-export 保调用方单一路径。
export { historyWindow, HISTORY_PAGE_SIZE, isRealUserMsg } from "./history-window.mjs"
// 会话生命周期面（init-block 批 · F-MI7 拆分——语义原样外提）：本端恢复入口包装（含残留 GC
// 钩子）/ 槽数据应用 / 新建 / 运行态清空 / 槽切换 / 占用查询。**resumeSlot/newSession 为 async**
// （入口一次异步探测束——调用面必须 await）。
export {
  resumeSlot, applySession, newSession, resetSessionState, switchToSlot, slotOccupancy,
} from "./session-lifecycle.mjs"
import { resumeSlot as lifecycleResumeSlot } from "./session-lifecycle.mjs"

// ========== core read/write ==========
// （legacy transient 判定 + slimForDisplay 自本区迁至 session-store.mjs——§6.14；
//  上方 re-export 保持既有 import 面。）

/** 未绑定路径的人读线全量物化（模式 F——既有语义逐字保留）。 */
function legacyHistory(agent) {
  return (agent._fullHistory ?? agent.history)
    .filter((m) => !m.transient && !isLegacyTransient(m))
    .map(slimForDisplay)
}

/** 恢复描述符（§6.14 TUI 分页契约——两调用点统一形态）：`{ history, total, base }`。
 *  绑定态：history = 尾窗 + ±1 页沿头一条（跨页回合标签判定用——不渲染）、total = 绝对
 *  总条数（「N messages」标签口径）、base = history[0] 的绝对序号；未绑定（模式 F）：
 *  回退全量数组（total = 数组长）。 */
export function sessionDescriptor(agent, data) {
  const store = agent?._recordStore
  if (store) {
    const total = store.total()
    const win = store.page(Math.max(0, total - RECORD_WINDOW_MESSAGES), total, { margin: 1 })
    return { history: win.messages, total, base: win.base }
  }
  const full = Array.isArray(data?.history) ? data.history : []
  return { history: full, total: full.length, base: 0 }
}

/** 槽摘要（记录存储绑定路径——history 不物化）：与 slotDigest(extractSlotMeta) 同形。 */
function digestFromStore(fields, counters) {
  const meta = {
    messageCount: counters.total,
    turnCount: counters.userReal,
    firstMessage: counters.firstMessage,
    activeProvider: fields.activeProvider ?? "",
    updatedAt: fields.updatedAt ?? Date.now(),
    title: fields.title ?? "",
  }
  if (fields.activeModel) meta.activeModel = fields.activeModel
  return { ts: Date.now(), ...meta }
}

/** Save agent state to the active slot file (atomic write). `display` (the old
 *  WYSIWYG render snapshot) is DEPRECATED — it drifted out of sync with history
 *  whenever VS Code wrote the slot, and the TUI resumed from a stale snapshot.
 *  Restore now always rebuilds from history (lazy, see startup.mjs).
 *  2026-08-31 会诊 F1：slot 粘性——首次认领后缓存 agent._slot，永不重跑 ensureActive
 *  （原实现每次保存重推，manifest active 被并发方翻动时会话静默迁移）。
 *  返回轮转的 .bak 路径或 null。 */
export function saveSession(agent) {
  // _fullHistory is written at the source via pushReal — no flush needed here.
  // history        = FULL, never-compacted (human-readable; VS Code panel & CLI resume read this)
  // contextHistory = machine context (possibly compacted) so CLI resume keeps the token savings
  // Human line: transient machine injections never enter the readable record.
  // TUI-OOM-ROOTCAUSE 批（SESSION.md §6.14 追加时点）：绑定记录存储后 `history` 字段由
  // saveProjectedSlot 流式拼接段原文生成（磁盘为准——不物化全量数组）；未绑定
  // （模式 F：thincoder chat/测试/未覆盖路径）→ 既有全量物化路径逐字保留（D-SE26 模式 F 零回归）。
  // Machine line (contextHistory): KEEP transient messages — resume must rebuild the
  // machine line byte-identical to what the provider cache saw. Dropping them made every
  // process restart diverge at the first injection position (git/OS/time reminders are
  // re-injected with FRESH content) → whole-prefix cache miss on the CLI's very first
  // request of each session (2026-08-16 cache-hit report; Kimi review).
  const contextHistory = agent.history.filter((m) => !isLegacyTransient(m))
  // fields = 槽 JSON 数据面（history 由投影插入——键序与既有 data 形态同序，history/contextHistory 居后）
  const fields = {
    version: 2,
    cwd: agent.cwd,
    title: agent.title ?? "",
    // MODEL-MERGE-SESSION 槽双字段恒非空（裁定 a）：有 provider 即携带具体复合值——
    // 恢复不看 config（F-4）——无渠道默认可回落 ""/null（全新未配态——读侧容忍）
    activeProvider: agent.activeProvider ?? agent.provider?.name ?? "",
    activeModel: agent.activeModel ?? agent.provider?.model ?? null,
    updatedAt: Date.now(),
    tasks: agent.tasks ?? [],
    planMode: agent.planMode ?? false,
    autoApprove: agent.autoApprove ?? false,
    engineering: agent.config?.agent?.engineering ?? false,
    ...engTokenSlotFields(agent),
    goal: agent.goal ?? null,
    advisor: agent.config?.advisor ?? null,
    pendingReminders: agent._pendingReminders ?? [],
    sessionStart: agent._sessionStart ?? null,
  }
  // 2026-09-05 §6.10 D-4：首认领（_slot 为 null——如 /session 切换后首保存、“查看对方活槽 →
  // 保存 fork 新槽”的落盘槽跟随）写本端记录——marker = 端内最后认领者；粘性 _slot 期间
  // 的日常保存不写（F1：保存永不参与竞争）
  const claimedNow = agent._slot == null
  const slot = agent._slot ??= activeSlot(agent.cwd)
  if (claimedNow) writeEndMarker(agent.cwd, slot)
  const p = slotPath(agent.cwd, slot)
  // 首保存补绑（§6.14 绑定与对账——兜底所有未覆盖路径）：未绑定且有槽 → 绑定记录存储
  // （baseHistory = 当前 _fullHistory 全量；identity = 当前 _sessionStart）
  if (!agent._recordStore) {
    bindRecordStore(agent, { slotFile: p, identity: agent._sessionStart ?? null, baseHistory: agent._fullHistory ?? [] })
  }
  // 2026-08-31 会诊 F2 🔴：写前校验磁盘文件的 sessionStart——与本进程会话不符（另一
  // 进程/会话的现场）→ 先轮转 .bak 保留再写（11311 条历史被新进程覆盖的实锤场景）。
  // 守卫自 2026-09-08 提取为 guardForeignSlotFile（session-guard.mjs——DESIGN-TOKEN-
  // SETTLEMENT D1 二次拆分：先入 session-slots、再因 500 行硬限迁 session-guard）——
  // saveSession 与 token-ttl persistEngTokens（settle 当场落盘）共用同一份（检查按
  // mtime 缓存 _slotMtime：自写未变跳过全量解析）。
  const rotated = guardForeignSlotFile(agent, p, slot)
  // 绑定态 → 流式投影（段原文拼接——VSC 兼容面逐字同形）；未绑定 → 既有全量物化写
  if (agent._recordStore) saveProjectedSlot(agent, p, fields, contextHistory)
  else writeSessionFile(p, { ...fields, history: legacyHistory(agent), contextHistory })
  // 记录我们刚写的 mtime——下次保存跳过重复解析
  try { agent._slotMtime = statSync(p).mtimeMs } catch {}
  // Update slot metadata in manifest
  try {
    const m = loadManifest(agent.cwd)
    m.slots[slot] = agent._recordStore
      ? digestFromStore(fields, agent._recordStore.counters())
      : slotDigest({ ...fields, history: legacyHistory(agent) })
    saveManifest(agent.cwd, m)
  } catch (e) {
    // Manifest update failure is non-fatal — data is safe, metadata will lazy-recover on next listSlots
    console.error(`[session] manifest metadata update failed for slot ${slot}: ${e.message}`)
  }
  return rotated
}

/** Load slot file with shared validation — 2026-08-31 会诊 deepseek 🟡 抽取：
 *  loadSession（active 槽）/switchToSlot/ACP session/load 共享。无认领副作用。
 *  version 1/2 + history 数组 + cwd 匹配（2026-09-01 会诊 kimi 🔵：cwd 先行——"别人的
 *  文件不动"优先于结构校验，异 cwd + 坏 version 不得改名）；结构不符改名 .unreadable、
 *  解析失败 .tmp 回退成功后提升为正主（损坏主文件改名 .corrupted 保留）、主文件缺失
 *  时恢复孤儿 .tmp（rename 前崩溃现场）。 */
export function loadSlotFile(cwd, slot) {
  const p = slotPath(cwd, slot)
  const tryLoad = (path) => {
    try {
      if (!existsSync(path)) return null
      const data = JSON.parse(readFileSync(path, "utf8"))
      if (data.cwd && data.cwd.toLowerCase() !== cwd.toLowerCase()) return null // 别人的文件，不动
      if (data?.version !== 1 && data?.version !== 2) {
        if (typeof data?.version === "number" && data.version > 2) return null // 新版 CLI 的文件，不动（F2 轮转兜底）
        try { renameSync(path, `${path}.unreadable`) } catch {}
        console.error(`[session] unsupported version ${data?.version} at ${path} — preserved as ${basename(path)}.unreadable`)
        return null
      }
      if (!Array.isArray(data.history)) {
        try { renameSync(path, `${path}.unreadable`) } catch {}
        console.error(`[session] slot file ${path}: history is not an array — preserved as ${basename(path)}.unreadable`)
        return null
      }
      data.history = data.history.filter((m) => !isLegacyTransient(m))
      return data
    } catch (e) {
      return { _error: e }
    }
  }

  let result = tryLoad(p)
  if (result && !result._error) return result
  if (result?._error) {
    console.error(`[session] failed to load slot ${slot}: ${result._error.message}. Trying .tmp fallback...`)
    const tmpResult = tryLoad(`${p}.tmp`)
    if (tmpResult && !tmpResult._error) {
      console.error(`[session] recovered from .tmp fallback`)
      // 2026-09-01 会诊 🟢：.tmp 提升为正主（损坏主文件改名 .corrupted 保留现场）——
      // 否则主文件留在原地，每次加载都重复"恢复"，且保存侧 F2 会持续轮转它。
      try {
        renameSync(p, `${p}.corrupted`)
        renameSync(`${p}.tmp`, p)
      } catch {}
      return tmpResult
    }
    console.error(`[session] .tmp fallback also failed — session lost.`)
    try { renameSync(p, `${p}.corrupted`) } catch {}
  } else if (!result) {
    // 2026-09-01 advisor 🔵：主文件缺失但孤儿 .tmp 存在（原子写 rename 前崩溃）——
    // 恢复并提升为正主（SESSION.md §6.4 的 .tmp 回退语义应覆盖此场景）。
    const orphan = tryLoad(`${p}.tmp`)
    if (orphan && !orphan._error) {
      console.error(`[session] slot ${slot} main file missing — recovered orphan .tmp`)
      try { renameSync(`${p}.tmp`, p) } catch {}
      return orphan
    }
  }
  return null
}

/** Load session data for this cwd — 2026-09-05 §6.10 D-2：平移为 resumeSlot 的数据包装
 *  （签名不变——测试兼容；读槽校验/.tmp 回退/legacy 兜底语义原样保留在 resumeSlot 的
 *  data 层）。恢复目标选择按本端记录（end marker）——manifest active 仅作无记录端的
 *  一次性继承源（D-6），不再作本端恢复第一依据。
 *  **async**（init-block 批 · F-MI7：resumeSlot 整链异步——入口一次异步探测束；调用面
 *  必须 await）。 */
export async function loadSession(cwd) {
  return (await lifecycleResumeSlot(cwd)).data
}
