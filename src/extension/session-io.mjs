/**
 * session-io.mjs — session file I/O, shared format with the CLI.
 * Reads/writes ~/.thincoder/sessions/<sha1(cwd)>.json.{N,manifest} — same files the CLI uses,
 * so sessions are interoperable between the CLI and the VS Code extension.
 *
 * 2026-09-01: manifest / slot-claiming / slot-number management split into
 * session-slots.mjs (this file was 606 lines > 500 hard limit; CLI did the same split).
 * Everything from there is re-exported below so callers' import paths are unchanged.
 */

import { readFileSync, unlinkSync, renameSync, existsSync, statSync } from "node:fs"

import {
  slotPath, manifestPath, loadManifest, saveManifest, writeFile,
  isProcessAlive, getSessionId, activeSlot, slotOccupancy, sessionsDir,
  readEndMarker, writeEndMarker, resumeSlot as slotsResumeSlot,
} from "./session-slots.mjs"
import { scheduleSessionGC } from "./session-gc.mjs"

// ─── Lazy-history window (SESSION-RESTORE-PARITY split, 2026-09-09) ──────────
// historyWindow/pairing/isRealUserMsg 逻辑在 history-window.mjs（本文件曾跨 500 行
// 硬限——拆分布局）——重导出保调用方 import 路径不变（panel-session.mjs 照旧）。
import { historyWindow, HISTORY_PAGE_SIZE, isRealUserMsg } from "./history-window.mjs"
export { historyWindow, HISTORY_PAGE_SIZE, isRealUserMsg } from "./history-window.mjs"

export {
  getSessionId, normalizeCwd, slotPath, manifestPath, loadManifest, saveManifest,
  activeSlot, slotOccupancy, sessionsDir, _setSessionsDirForTest, _resetSessionsDirForTest,
  END, endMarkerPath, readEndMarker, writeEndMarker, claimSlot, allocateFresh,
} from "./session-slots.mjs"

/** 恢复决策包装（SESSION.md §12 启动钩子，2026-09-06）：面板恢复入口触发一次残留 GC——
 *  scheduleSessionGC 内部 setImmediate 空闲执行 + 每进程每前缀去重，不阻塞激活路径（N4）。 */
export function resumeSlot(cwd) {
  scheduleSessionGC(cwd)
  return slotsResumeSlot(cwd)
}

// Session metadata flag write path (Parnas boundary — split out of this file on 2026-09-06 to
// keep it under the >500-line hard limit). Re-exported so callers keep the "./session-io.mjs"
// import path; newSlotData is also used locally below (newSlot).
import {
  newSlotData, setSlotAutoApprove, setSlotPlanMode, setSlotEngineering, setSlotAdvisorGuard, setSlotEngDesignTokens,
} from "./session-slot-write.mjs"
export {
  newSlotData, setSlotAutoApprove, setSlotPlanMode, setSlotEngineering, setSlotAdvisorGuard, setSlotEngDesignTokens,
} from "./session-slot-write.mjs"

// ─── Slot read/write ────────────────────────────────────────

/** Read a slot file. Returns parsed session data or null.
 *  2026-09-01 CLI 同步（会诊 F2）：结构校验失败不再静默 null——改名 .unreadable 保留
 *  现场（否则面板绑槽后下次保存直接覆写）；解析失败 .tmp 回退成功后提升为正主（损坏
 *  主文件改名 .corrupted 保留）；主文件缺失时恢复孤儿 .tmp（rename 前崩溃现场）。
 *  cwd 不匹配是别人的文件也不动（与 CLI loadSlotFile 一致，advisor 🔵）。 */

// ─── Legacy transient prefix cleanup (CLI parity, 2026-09-01 会诊 glm/kimi 🔴) ──

/** 老 CLI 写入的机器注入前缀消息（人工线残留）——CLI loadSlotFile/saveSession 双点过滤
 *  （CLI saveSession 人读线过滤 + loadSlotFile 读时过滤——符号锚），VS Code 此前不过滤 → 旧注入在 VS Code 端进 UI、进播种
 *  机器线、且保存时永久回写（CLI 的清污被 VS Code 重新污染）。 */
const LEGACY_TRANSIENT_PREFIXES = [
  "[System reminder: working directory snapshot:",
  "[Relevant memories from previous sessions",
]

export function isLegacyTransient(m) {
  return (
    m.role === "user" &&
    typeof m.content === "string" &&
    LEGACY_TRANSIENT_PREFIXES.some((p) => m.content.startsWith(p))
  )
}

/** slimForDisplay 截断的 arguments 以 U+2026（…）结尾——不是合法 JSON 的完整值。
 *  v1 老文件回退播种机器线时置为 {}（合法空参数），防止半截 \\uXXXX 毒化发送载荷
 *  （CLI 会诊 F6 镜像，2026-09-01 会诊 deepseek/kimi/qwen）。 */
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

export function loadSlot(cwd, n) {
  const p = slotPath(cwd, n)
  const tryLoad = (path) => {
    try {
      if (!existsSync(path)) return null
      const data = JSON.parse(readFileSync(path, "utf8"))
      if (data.cwd && data.cwd.toLowerCase() !== cwd.toLowerCase()) return null // 别人的文件，不动
      if (data?.version !== 1 && data?.version !== 2) {
        if (typeof data?.version === "number" && data.version > 2) return null // 新版 CLI 的文件，不动
        try { renameSync(path, `${path}.unreadable`) } catch {}
        return null
      }
      if (!Array.isArray(data.history)) {
        try { renameSync(path, `${path}.unreadable`) } catch {}
        return null
      }
      // 2026-09-01 会诊 glm/kimi 🔴：读时过滤 legacy transient 注入（CLI loadSlotFile
      // CLI loadSlotFile 读时过滤同款——符号锚）——旧 CLI 写入的机器注入残留不得进面板/播种机器线。
      if (data.history.some(isLegacyTransient)) {
        data.history = data.history.filter((m) => !isLegacyTransient(m))
      }
      return data
    } catch (e) {
      return { _error: e }
    }
  }
  let result = tryLoad(p)
  if (result && !result._error) return result
  if (result?._error) {
    const tmpResult = tryLoad(`${p}.tmp`)
    if (tmpResult && !tmpResult._error) {
      try {
        renameSync(p, `${p}.corrupted`)
        renameSync(`${p}.tmp`, p)
      } catch {}
      return tmpResult
    }
    try { renameSync(p, `${p}.corrupted`) } catch {}
  } else if (!result) {
    const orphan = tryLoad(`${p}.tmp`)
    if (orphan && !orphan._error) {
      try { renameSync(`${p}.tmp`, p) } catch {}
      return orphan
    }
  }
  return null
}

/** Write a slot file (session data). */
export function saveSlot(cwd, n, data) {
  writeFile(slotPath(cwd, n), data)
}

/** Slim the HUMAN line (history) for storage — CLI parity (CLI session.mjs
 *  slimForDisplay, 2026-08-30 deepseek-consult design). The machine line
 *  (contextHistory) must stay byte-identical for the provider prefix cache.
 *  Copy-on-write ONLY — the two lines share object references via pushReal;
 *  mutating in place would corrupt the machine line. Rules:
 *   - assistant.tool_calls[].function.arguments → 300 chars (head + …)
 *   - tool messages content → 500 chars (head + …)
 *   - multimodal user content array → keep text parts, DROP image_url base64
 *   - plain string messages → untouched
 *  historyWindow renders string contents and never parses tool arguments, so the
 *  trimmed shapes are display-safe on the webview side too (SESSION-RESTORE-PARITY:
 *  tool args/results travel raw — JSON.parse happens in the card builder only). */
export function slimForDisplay(m) {
  if (m && Array.isArray(m.content)) {
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

/** Delete a slot file. */
export function deleteSlot(cwd, n) {
  try { unlinkSync(slotPath(cwd, n)) } catch {}
}

// ─── Slot metadata (same shape as CLI extractSlotMeta) ─────

// isRealUserMsg 定义已随 historyWindow 迁 history-window.mjs（本文件 import + 重导出——
// extractSlotMeta 调用不变）

export function extractSlotMeta(history, activeProvider, updatedAt, title = "") {
  const userMsgs = history.filter(isRealUserMsg)
  const first = userMsgs[0]?.content ?? ""
  return {
    messageCount: history.length,
    turnCount: userMsgs.length,
    firstMessage: first.slice(0, 80),
    activeProvider: activeProvider ?? "",
    updatedAt: updatedAt ?? Date.now(),
    title,
  }
}

// ─── High-level operations (mirror CLI session.mjs) ────────

/** List all slots, newest first (updatedAt desc). Same shape as CLI listSlots.
 *  Read-only — no claiming side effect (2026-09-01 CLI 同步 会诊 🟢). */
/** Lazy-load slot metadata from slot file (CLI loadSlotMeta parity, 2026-09-01 advisor 🔵——
 *  旧格式 manifest 条目（裸数字 ts）在面板会话列表显示空 title/count；懒读槽文件补全）。 */
function loadSlotMeta(cwd, slot, v) {
  if (typeof v === "object" && v !== null && "ts" in v) return v
  const ts = typeof v === "number" ? v : 0
  try {
    const p = slotPath(cwd, slot)
    if (!existsSync(p)) return { ts }
    const data = JSON.parse(readFileSync(p, "utf8"))
    const history = data.history ?? []
    return { ts, ...extractSlotMeta(history, data.activeProvider, data.updatedAt ?? ts, data.title ?? "") }
  } catch {
    return { ts }
  }
}

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
        title: meta.title ?? "",
        turnCount: meta.turnCount ?? 0,
        messageCount: meta.messageCount ?? 0,
        firstMessage: meta.firstMessage ?? "",
        activeProvider: meta.activeProvider ?? "",
        timestamp: meta.ts,
        date: new Date(meta.ts).toLocaleString(),
        updatedAt: meta.updatedAt ?? meta.ts,
        updatedDate: new Date(meta.updatedAt ?? meta.ts).toLocaleString(),
      }
    })
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Switch active slot. Returns the loaded session data (null if slot doesn't exist). Same as CLI switchToSlot.
 *  2026-09-01 CLI 同步：
 *   - 目标槽被另一活进程占用时不认领（防双属主）——占用方 _slot 粘性（面板绑槽固定）不受影响；
 *   - 先 loadSlot 成功才翻 active 指针（advisor round2 🟡——文件缺失/损坏时返回 null 且
 *     不产生幻影 active，与 CLI"切换不得有认领副作用"对齐）。 */
export function switchToSlot(cwd, slot) {
  const m = loadManifest(cwd)
  if (!m.slots[slot]) return null
  const data = loadSlot(cwd, slot)
  if (!data) return null
  const owner = m.slotSessions?.[slot]
  const occupied = !!(owner && owner !== getSessionId() && isProcessAlive(parseInt(owner.split("-")[0])))
  m.active = slot
  if (!occupied) {
    m.slotSessions ??= {}
    m.slotSessions[slot] = getSessionId()
  }
  saveManifest(cwd, m, null, { setActive: true })
  // 2026-09-05 §10 D-4：面板"打开历史会话"（pick）跟随"最后查看的槽"（成功才写）
  writeEndMarker(cwd, slot)
  return data
}

/** Create a new session slot: allocate next free number, write empty session, mark active.
 *  2026-09-01 CLI 同步：选号跳过 manifest 条目 / 现存文件 / 活认领号（丢失更新可能让
 *  条目消失而文件仍在——复用该号会直接覆写真实会话）；开头清理死主条目（死主且文件
 *  缺失的槽号回收复用，与 ensureActive 语义对齐）；立即记录所有权（F3——否则并发方
 *  会把新 active 槽当空闲认领）。 */
export function newSlot(cwd) {
  const m = loadManifest(cwd)
  // 2026-09-01 advisor round2 🟡：死主清理必须经 deletions 显式落盘——saveManifest 条目级
  // 合并会把磁盘死条目从 fresh 复活回写，仅传 m 等于没删（与 ensureActive deadParam 同型）。
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
  saveSlot(cwd, slot, data)
  m.slotSessions ??= {}
  m.slotSessions[slot] = mySessionId
  m.slots[slot] = { ts: Date.now(), ...extractSlotMeta([], "", data.updatedAt, "") }
  m.active = slot
  // deletions 过滤掉本调用刚重新认领的槽（防删掉自己的新属主）——与 ensureActive deadParam 同型
  const deletions = deadSlots.length
    ? {
        slotSessions: deadSlots.filter((s) => m.slotSessions[s] !== mySessionId),
        slots: deadSlots.filter((s) => !m.slots[s]),
      }
    : null
  saveManifest(cwd, m, deletions, { setActive: true })
  // 2026-09-05 §10 D-4：newSlot（面板新建）落点写本端记录
  writeEndMarker(cwd, slot)
  return slot
}

// mtime cache for the F2 rotation check (CLI _slotMtime parity, 2026-09-01 advisor 🟡):
// the panel saves at turn end and on every setSlot* — re-reading + JSON.parsing a
// multi-MB slot file on EVERY save is O(n²). Gate on the file's mtime: unchanged
// since our last check/write → skip the parse.
const slotMtimeCache = new Map() // key: slot file path → last seen mtimeMs

/** Save session data to a slot + update manifest metadata.
 *  2026-09-01 CLI 同步（会诊 F2 🔴）：写前校验磁盘文件的 sessionStart——与本进程会话
 *  不符（另一进程/会话的现场）→ 先轮转 .bak 保留再写（CLI 11311 条历史被覆盖的实锤
 *  场景；扩展端此前直接覆盖，双进程并发时会话静默丢失）。**version > 2 的文件无论
 *  sessionStart 一律轮转**（loadSlot 对 v3 返回 null 不动，若其 sessionStart 为 null
 *  首次保存会静默覆盖——CLI 2026-08-31 会诊 deepseek 🟡 同款）。**返回轮转的 .bak
 *  路径或 null**（对齐 CLI saveSession 返回值透出）。 */
export function saveSessionToSlot(cwd, slot, data) {
  data.updatedAt = Date.now()
  let rotated = null
  const p = slotPath(cwd, slot)
  try {
    if (existsSync(p)) {
      const st = statSync(p)
      const cached = slotMtimeCache.get(p)
      let disk = null
      if (st.mtimeMs !== cached) {
        disk = JSON.parse(readFileSync(p, "utf8"))
        slotMtimeCache.set(p, st.mtimeMs)
      }
      if (disk) {
        const diskStart = disk?.sessionStart ?? null
        const myStart = data.sessionStart ?? null
        const diskIsNewer = typeof disk?.version === "number" && disk.version > 2
        // 2026-09-01 会诊 qwen 🔴：同会话"旧快照回滚"检测——turn 启动读槽快照、回合末
        // 写回，期间另一进程（CLI）追加了消息：sessionStart 相同 → F2 放行 → 旧快照
        // 整体覆盖对方最新消息（静默丢失）。磁盘 history 比待写快照长 = 外部写入 →
        // 轮转 .bak 保留对方现场，不静默覆盖。
        const diskLonger = Array.isArray(disk?.history) && Array.isArray(data?.history) && disk.history.length > data.history.length
        if (diskIsNewer || (diskStart && diskStart !== myStart) || diskLonger) {
          const bak = `${p}.bak-${Date.now()}`
          renameSync(p, bak)
          rotated = bak
          console.error(`[session] slot ${slot} ${diskIsNewer ? `holds a newer-version file (v${disk.version})` : diskLonger ? `grew on disk (${disk.history.length} > ${data.history.length} msgs — concurrent append)` : `holds another session (start ${diskStart}, ours ${myStart})`} — preserved as ${bak}`)
        }
      }
    }
  } catch {
    // 解析失败也轮转（损坏现场不覆盖）
    try { renameSync(p, `${p}.corrupted`) } catch {}
  }
  saveSlot(cwd, slot, data)
  try {
    const m = loadManifest(cwd)
    m.slots[slot] = { ts: Date.now(), ...extractSlotMeta(data.history ?? [], data.activeProvider, data.updatedAt, data.title ?? "") }
    saveManifest(cwd, m)
  } catch { /* non-fatal */ }
  slotMtimeCache.set(p, statSync(p).mtimeMs)
  return rotated
}

/** Delete a slot + remove from manifest. Returns the new active slot (or null if none left).
 *  2026-09-01 CLI 同步：deletions 显式删除（防 saveManifest 合并复活）+ 删到 active 时
 *  置空指针（对齐 CLI deleteSlot——active 指向"最小剩余号"可能是另一活进程的槽，
 *  面板随后会经 ensureSlot 重新认领，不必在删除时替它决定）。 */
export function deleteSlotAndUpdate(cwd, slot) {
  deleteSlot(cwd, slot)
  const m = loadManifest(cwd)
  delete m.slots[slot]
  if (m.slotSessions) delete m.slotSessions[slot]
  if (m.active === slot) delete m.active
  saveManifest(cwd, m, { slots: [slot], slotSessions: [slot] }, { setActive: true })
  // 2026-09-05 §10 D-4/F4：删到本端记录槽 → 记录显式置空（文件保留 + slot:null——下次
  // 启动全新起步：不继承他人遗留、不复活被删会话——T-M4/T-M8）
  if (readEndMarker(cwd)?.slot === slot) writeEndMarker(cwd, null)
  return m.active ?? null
}

/** Update the title of a slot (in both the slot file and the manifest).
 *  2026-09-01 CLI 同步（advisor 🟡）：写回前按 mtime 门控——读→改→整文件写回窗口内
 *  并发方的最新保存会被旧数据覆盖（丢消息）；mtime 变了即放弃本次重命名（下次重试）。
 *  2026-09-06 §12.2.5：契约 undefined → { ok, reason? }（file-missing/parse-failure/
 *  mtime-conflict/invalid-slot——与 CLI renameSlot 同枚举，F3 失败可见）；_stat =
 *  mtime-conflict 测试缝（默认 statSync，生产行为不变）。 */
export function setSlotTitle(cwd, slot, title, _stat = statSync) {
  const n = Number(slot)
  if (!Number.isInteger(n) || n < 1) return { ok: false, reason: "invalid-slot" }
  const p = slotPath(cwd, n)
  if (!existsSync(p)) return { ok: false, reason: "file-missing" }
  let data
  try {
    data = JSON.parse(readFileSync(p, "utf8"))
  } catch {
    return { ok: false, reason: "parse-failure" }
  }
  const t0 = _stat(p).mtimeMs
  data.title = title
  if (_stat(p).mtimeMs !== t0) return { ok: false, reason: "mtime-conflict" } // 读与写之间被并发方改过 → 放弃
  saveSlot(cwd, n, data)
  const m = loadManifest(cwd)
  if (m.slots[n]) {
    const meta = typeof m.slots[n] === "object" ? m.slots[n] : { ts: 0 }
    meta.title = title
    m.slots[n] = meta
    saveManifest(cwd, m)
  }
  return { ok: true }
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
