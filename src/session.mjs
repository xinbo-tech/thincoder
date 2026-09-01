/**
 * session.mjs — session persistence (slot-based model)
 * Each project (keyed by cwd hash) keeps unlimited session slots.
 * Every session lives in a numbered slot; the manifest tracks which slot is active.
 * There is no separate "current" file — the active slot IS the current session.
 *
 * File layout: {hash}.json.N (slots), {hash}.json.manifest (slot metadata + active pointer).
 * Legacy {hash}.json is migrated to a slot on first access.
 *
 * 2026-08-31 advisor round1 🔴：slot/清单管理拆至 session-slots.mjs（本文件曾超 500 行
 * 硬限）；本文件只保留核心读写 + re-export 全部 slot 导出（既有 import 路径不变）。
 */

import { readFileSync, renameSync, existsSync, statSync } from "node:fs"
import { basename } from "node:path"
import {
  slotPath, writeSessionFile, loadManifest, saveManifest, slotDigest,
  activeSlot, sessionPath, getSessionId, isProcessAlive,
} from "./session-slots.mjs"

// re-export slot 管理（保持既有 import session.mjs 的调用点不变）
export {
  getSessionId, normalizeCwd, sessionPath, slotPath, manifestPath, activePath,
  writeSessionFile, slotDigest, loadManifest, saveManifest, activeSlot, listSlots,
  deleteSlot, renameSlot, isProcessAlive,
} from "./session-slots.mjs"

// ========== legacy transient prefix cleanup ==========

const LEGACY_TRANSIENT_PREFIXES = [
  "[System reminder: working directory snapshot:",
  "[Relevant memories from previous sessions",
]

function isLegacyTransient(m) {
  return (
    m.role === "user" &&
    typeof m.content === "string" &&
    LEGACY_TRANSIENT_PREFIXES.some((p) => m.content.startsWith(p))
  )
}

export { isLegacyTransient }

// ========== core read/write ==========

/** Slim the HUMAN line (history) for storage — the machine line (contextHistory)
 *  keeps everything byte-identical for the provider. Deepseek-consult design
 *  (2026-08-30): the human line is never compacted and carries the bulk of
 *  session-file size (tool args JSON / full tool results / base64 images), while
 *  nothing consumes its verbatim fidelity. Rules (copy-on-write ONLY — the two
 *  lines share object references via pushReal; mutating in place would corrupt
 *  the machine line and provider prefix cache):
 *   - assistant.tool_calls[].function.arguments → trimmed to 300 chars (head + …)
 *   - tool messages content → 500 chars (head + …)
 *   - multimodal user content array → keep text parts, DROP image_url base64 parts
 *   - plain string messages → untouched (not the size driver)
 */
function slimForDisplay(m) {
  if (m && Array.isArray(m.content)) {
    // Multimodal user message: keep text parts, drop image parts.
    const textParts = m.content.filter((p) => p?.type !== "image_url")
    if (textParts.length === m.content.length) return m
    return { ...m, content: textParts }
  }
  if (m && m.role === "assistant" && Array.isArray(m.tool_calls)) {
    let changed = false
    const tool_calls = m.tool_calls.map((tc) => {
      const args = tc.function?.arguments
      if (typeof args === "string" && args.length > 300) {
        changed = true
        return { ...tc, function: { ...tc.function, arguments: args.slice(0, 300) + "…" } }
      }
      return tc
    })
    return changed ? { ...m, tool_calls } : m
  }
  if (m && m.role === "tool" && typeof m.content === "string" && m.content.length > 500) {
    return { ...m, content: m.content.slice(0, 500) + "\n… (truncated for storage)" }
  }
  return m
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
  const history = (agent._fullHistory ?? agent.history)
    .filter((m) => !m.transient && !isLegacyTransient(m))
    .map(slimForDisplay)
  // Machine line (contextHistory): KEEP transient messages — resume must rebuild the
  // machine line byte-identical to what the provider cache saw. Dropping them made every
  // process restart diverge at the first injection position (git/OS/time reminders are
  // re-injected with FRESH content) → whole-prefix cache miss on the CLI's very first
  // request of each session (2026-08-16 cache-hit report; Kimi review).
  const contextHistory = agent.history.filter((m) => !isLegacyTransient(m))
  const data = {
    version: 2,
    cwd: agent.cwd,
    title: agent.title ?? "",
    activeProvider: agent.activeProvider ?? agent.provider?.name,
    activeModel: agent.activeModel ?? null,
    updatedAt: Date.now(),
    history,
    contextHistory,
    tasks: agent.tasks ?? [],
    planMode: agent.planMode ?? false,
    autoApprove: agent.autoApprove ?? false,
    engineering: agent.config?.agent?.engineering ?? false,
    engDesignToken: agent._engDesignToken ?? null,
    // Multi-design slots ride the same round-trip (2026-09-01 audit #1): Map → {designId: token}
    // (JSON-safe). Empty/absent Map → undefined → the key is dropped by JSON.stringify, so a
    // cleared session writes NO field instead of resurrecting slots from the previous save.
    engDesignTokens: agent._engDesignTokens instanceof Map && agent._engDesignTokens.size > 0
      ? Object.fromEntries(agent._engDesignTokens)
      : undefined,
    goal: agent.goal ?? null,
    advisor: agent.config?.advisor ?? null,
    pendingReminders: agent._pendingReminders ?? [],
    sessionStart: agent._sessionStart ?? null,
  }
  const slot = agent._slot ??= activeSlot(agent.cwd)
  const p = slotPath(agent.cwd, slot)
  // 2026-08-31 会诊 F2 🔴：写前校验磁盘文件的 sessionStart——与本进程会话不符（另一
  // 进程/会话的现场）→ 先轮转 .bak 保留再写（11311 条历史被新进程覆盖的实锤场景）。
  // 检查按 mtime 缓存（_slotMtime）：文件自上次检查/自写未变就跳过全量解析——
  // 每次保存都 readFileSync+JSON.parse 多 MB 会话 → O(n²) 退化。
  let rotated = null
  try {
    if (existsSync(p)) {
      const st = statSync(p)
      let disk = null
      if (st.mtimeMs !== (agent._slotMtime ?? -1)) {
        disk = JSON.parse(readFileSync(p, "utf8"))
        // 2026-08-31 会诊 deepseek 🟡：version>2 的新版文件无论 sessionStart 一律轮转
        // （loadSlotFile 对 v3 返回 null 不动文件——若其 sessionStart 为 null，旧版首次
        // 保存会静默覆盖；轮转 .bak 保证新版文件保留）。
        // 2026-09-01 advisor 🔵：磁盘文件 cwd 不匹配（异项目文件误落本路径）同样轮转——
        // 与 loadSlotFile/legacy 读的"别人的文件不动"原则对齐（否则 sessionStart null +
        // version≤2 的异项目文件被静默覆盖且无 .bak）。
        const diskIsNewer = typeof disk?.version === "number" && disk.version > 2
        const diskStart = disk?.sessionStart ?? null
        const myStart = agent._sessionStart ?? null
        const diskForeign = typeof disk?.cwd === "string" && disk.cwd.toLowerCase() !== agent.cwd.toLowerCase()
        if (diskIsNewer || diskForeign || (diskStart && diskStart !== myStart)) {
          const bak = `${p}.bak-${Date.now()}`
          renameSync(p, bak)
          rotated = bak
          console.error(`[session] slot ${slot} holds ${diskIsNewer ? `a newer-version file (v${disk.version})` : diskForeign ? `a foreign-cwd file (${disk.cwd})` : `another session (start ${diskStart}, ours ${myStart})`} — preserved as ${basename(bak)}`)
        }
        agent._slotMtime = st.mtimeMs
      }
    }
  } catch {
    // 文件存在但不可读（损坏/半写）：改名 .corrupted 保留现场（2026-09-01 advisor 🔵——
    // 与自身 loadSlotFile 的 .corrupted 约定 + VS Code saveSessionToSlot 对齐；.bak 保留
    // 给 F2 轮转路径，损坏现场不再混入轮转后缀，恢复/清理工具按后缀分类不误判）
    if (existsSync(p)) {
      try {
        renameSync(p, `${p}.corrupted`)
      } catch {}
    }
  }
  writeSessionFile(p, data)
  // 记录我们刚写的 mtime——下次保存跳过重复解析
  try { agent._slotMtime = statSync(p).mtimeMs } catch {}
  // Update slot metadata in manifest
  try {
    const m = loadManifest(agent.cwd)
    m.slots[slot] = slotDigest(data)
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
    // 恢复并提升为正主（SESSION.md §4 的 .tmp 回退语义应覆盖此场景）。
    const orphan = tryLoad(`${p}.tmp`)
    if (orphan && !orphan._error) {
      console.error(`[session] slot ${slot} main file missing — recovered orphan .tmp`)
      try { renameSync(`${p}.tmp`, p) } catch {}
      return orphan
    }
  }
  return null
}

/** Load session data from the active slot; returns null if missing, corrupted, or version mismatch */
export function loadSession(cwd) {
  // Try the active slot first (post-migration, legacy file may be stale)
  const slot = activeSlot(cwd)
  let result = loadSlotFile(cwd, slot)
  if (result) return result

  // Fallback: try the legacy current file (pre-migration, or migration failed to clean up)
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

/** slimForDisplay 截断的 arguments 以 U+2026（…）结尾——不是合法 JSON 的完整值。
 *  v1 老文件回退播种机器线时置为 {}（合法空参数），防止半截 \\uXXXX 毒化发送载荷（会诊 F6）。 */
function stripTruncatedToolArgs(m) {
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

/** Apply loaded session data onto an agent object; returns true if provider was switched.
 *  2026-08-31 会诊 F1：清空 _slot/_slotMtime 缓存——切换后下次保存重新认领（F1b 回归：
 *  switchToSlot 后保存必须落新槽而非旧槽）。 */
export function applySession(agent, data) {
  // data.history is the FULL never-compacted record (human line); data.contextHistory is the
  // (possibly compacted) machine line. Restore each line from its own source — the machine
  // context keeps its compaction savings across resume. Legacy files without contextHistory
  // fall back to seeding the machine line from the full history (it re-compacts when needed).
  // 2026-08-31 会诊 deepseek 🟡：机读线必须从 contextHistory 恢复而非从完整 history 重建——
  // 后者会把已压缩的中间过程塞回上下文（实测 prompt 膨胀到 283%）。compactThresholdAuto 时
  // 按恢复后的模型重新推导阈值（bin/thincoder.mjs）。v1 老文件（无 contextHistory）回退
  // 播种时剥离被 slimForDisplay 截断的 tool_calls.arguments（以 … 结尾 → 置 {}；会诊 F6——
  // 截断可劈断 \\uXXXX 产生 400 毒载荷）。2026-09-01 会诊三家：length > 0 才当机读线
  // （contextHistory: [] 是"无机读线"而非空机器线——空机器线会静默丢全部上下文）。
  agent.config ??= {} // ACP test mocks may omit config; be defensive like the ??= below
  const full = Array.isArray(data.history) ? data.history : []
  const ch = data.contextHistory
  const machine = (Array.isArray(ch) && ch.length > 0) ? ch : full.map(stripTruncatedToolArgs)
  agent._fullHistory = [...full]
  agent.history = [...machine]
  agent.title = data.title ?? ""
  agent.tasks = data.tasks ?? []
  agent.planMode = data.planMode ?? false
  agent.autoApprove = data.autoApprove ?? false
  agent.goal = data.goal ?? null
  agent._pendingReminders = data.pendingReminders ?? []
  agent._sessionStart = data.sessionStart ?? null
  agent._engDesignToken = data.engDesignToken ?? null
  // Multi-design slots restore from the {designId: token} object (2026-09-01 audit #1). A legacy
  // slot without the field restores NO Map (fresh state) — never resurrect slots the writer did
  // not have. Expired tokens are rejected downstream by validateDesignToken (fail-closed, TTL).
  if (data.engDesignTokens && typeof data.engDesignTokens === "object" && !Array.isArray(data.engDesignTokens)) {
    agent._engDesignTokens = new Map(Object.entries(data.engDesignTokens))
  } else {
    delete agent._engDesignTokens
  }
  // engineering is session-level (2026-08-29): the slot value is the CLI session's authority
  // — config.json is only the initial default / cross-end mirror. A legacy slot without the
  // field keeps whatever config.json seeded (unchanged behavior).
  if (data.engineering !== undefined) {
    agent.config.agent ??= {}
    agent.config.agent.engineering = data.engineering === true
  }
  if (data.advisor) {
    agent.config.advisor = { ...data.advisor }
  }
  // Reset stall/compaction state on session switch
  agent._compressFailures = 0
  agent._verifyRetries = 0
  agent._verifyPassed = false
  agent._slot = null // 粘性缓存清空——切换后重新认领（F1b）
  agent._slotMtime = null
  if (data.activeProvider && data.activeProvider !== agent.activeProvider) {
    const p = agent.providers?.find((pr) => pr.name === data.activeProvider)
    if (p) {
      agent.provider = { ...p }
      agent.activeProvider = p.name
      agent.activeModel = data.activeModel ?? null
      if (agent.activeModel) agent.provider.model = agent.activeModel
      return true
    }
  } else if (data.activeModel != null) {
    // Same provider, different model
    agent.activeModel = data.activeModel
    if (agent.activeModel && agent.provider) agent.provider.model = agent.activeModel
  } else if (data.activeProvider && data.activeProvider === agent.activeProvider) {
    // Same provider, session has no activeModel → clear stale override
    agent.activeModel = null
    if (agent.provider) {
      const p = agent.providers?.find((pr) => pr.name === agent.activeProvider)
      if (p) agent.provider.model = p.model
    }
  }
  return false
}

/**
 * Create a new session slot: allocate a free slot number,
 * write an empty session, and mark it as the active slot.
 * No limit on the number of sessions.
 */
export function newSession(cwd) {
  const m = loadManifest(cwd)

  // 2026-09-01 advisor 🔵：先清理死主条目（与 ensureActive 分支2 语义一致）——否则
  // "死主 + 文件缺失"的空槽（m.slots 有条目、无文件、属主已死）永不复用，槽号持续
  // 增长。死主且无文件 = 该会话从未落盘（进程死了没保存），条目可安全删除回收。
  // 2026-09-01 会诊 deepseek/glm 🟡：清理必须经 deletions 显式落盘——saveManifest 条目级
  // 合并会把磁盘死条目从 fresh 复活回写，仅传 m 等于没删（VS Code newSlot 已修，CLI 对称）。
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

  // Find next available slot number — 2026-08-31 会诊 deepseek 🟡：不能只看 manifest
  // 条目（丢失更新可能让条目消失而文件仍在）——复用该号会直接覆写真实会话
  // （F2 防护不覆盖 newSession 的空数据直写）。
  // 2026-08-31 advisor round2 🟡：同时跳过"已被另一活进程认领但尚未落盘"的号
  // （slotSessions 有条目、slots 无条目、文件不存在）——否则双进程会认领同一号。
  const liveClaimed = (n) => {
    const owner = m.slotSessions?.[n]
    return !!(owner && owner !== mySessionId && isProcessAlive(parseInt(owner.split("-")[0])))
  }
  let slot = 1
  while (m.slots[slot] || existsSync(slotPath(cwd, slot)) || liveClaimed(slot)) slot++

  // Write empty session — 2026-09-01 advisor 🔵：补 contextHistory/planMode 字段与
  // VS Code newSlot 对齐（SESSION.md §3 v2 格式双端一致；两端读侧均有兜底，功能等价）
  const data = { version: 2, cwd, title: "", updatedAt: Date.now(), history: [], contextHistory: [], tasks: [], planMode: false, goal: null, autoApprove: false, advisor: null, pendingReminders: [], sessionStart: null }
  writeSessionFile(slotPath(cwd, slot), data)
  m.slots[slot] = slotDigest(data)
  m.active = slot
  // 2026-08-31 advisor round1 🟡：与 ensureActive 认领模型一致——立即记录新 slot 所有权，
  // 否则 /new 后到首次保存之间并发方（VS Code/另一 CLI）会把新 active 槽当"空闲可恢复"
  // 认领 → 双进程写同一槽（F2 轮转互旋）。
  m.slotSessions ??= {}
  m.slotSessions[slot] = mySessionId
  // 2026-09-01 会诊三家 🟡：显式翻 active 的调用点传 setActive（saveManifest 默认保留
  // 磁盘 fresh.active，避免把并发方刚翻的指针回滚）
  // 2026-09-01 会诊 deepseek/glm 🟡：deletions 过滤掉本调用刚重新认领的槽（防删掉自己的
  // 新属主）——与 ensureActive deadParam / VS Code newSlot 同型。
  const deletions = deadSlots.length
    ? {
        slotSessions: deadSlots.filter((s) => m.slotSessions[s] !== mySessionId),
        slots: deadSlots.filter((s) => !m.slots[s]),
      }
    : null
  saveManifest(cwd, m, deletions, { setActive: true })
  return slot
}

/** 清空会话运行态（/new 用，2026-08-31 会诊 F3）：_fullHistory/title/_sessionStart 等
 *  全部会话级状态 + 一次性注入标志必须全清——否则新会话首次落盘把旧会话完整人类线 +
 *  旧标题写进新槽（实锤 .19/.3 双副本）；注入标志不清则 /new 后新会话永不注入
 *  OS/cwd reminder（2026-09-01 会诊 glm 🟡）。autoApprove 是用户偏好，跨会话保留（有意）。 */
export function resetSessionState(agent) {
  agent._fullHistory = []
  agent.history = []
  agent.title = ""
  agent.tasks = []
  agent._sessionStart = null
  agent._engDesignToken = null
  agent._engDesignTokens = new Map() // multi-design slots die with the session (2026-09-01 fix #2)
  agent._compressFailures = 0
  agent._verifyRetries = 0
  agent._verifyPassed = undefined
  agent._runStartHistoryLen = 0
  agent._lastPromptTokens = null
  agent._usageAtLen = null
  agent.planMode = false
  agent.goal = null
  agent._pendingReminders = []
  agent._slot = null
  agent._slotMtime = null
  agent._osReminderInjected = false
  agent._restartReminderInjected = false
  agent._lastEngState = false
}

/** Switch the manifest active pointer to a slot. Returns the slot's session data
 *  (null if the slot doesn't exist / can't be read). 2026-08-31 会诊 deepseek 🔴：
 *  原实现经 loadSession → activeSlot 有认领副作用——目标槽被活进程占用时 ensureActive
 *  分支 3 会把 active 拨到新空槽并读回 null + 劫持对方指针。现改为 loadSlotFile 直接读
 *  （无认领副作用）；目标槽空闲则一并认领、被另一活进程占用则不认领（slotOccupancy——
 *  下次保存经 activeSlot 自然 fork 到新槽）；只改 manifest 指针（setActive 意图）。
 *  2026-09-01 会诊三家 🟡：saveManifest 条目级合并 + setActive（不把并发方刚翻的指针回滚）。 */
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
  return data
}

/** 目标槽是否被另一活进程占用（2026-09-01 会诊/advisor 🟡）：排除本进程属主——
 *  /session 重选当前槽不误报；同进程双会话防护由 ACP sameProcessPinned 承担。 */
export function slotOccupancy(cwd, slot) {
  const m = loadManifest(cwd)
  const owner = m.slotSessions?.[slot]
  if (!owner) return { occupied: false }
  if (owner === getSessionId()) return { occupied: false }
  const pid = parseInt(owner.split("-")[0])
  if (!pid || !isProcessAlive(pid)) return { occupied: false }
  return { occupied: true, owner }
}
