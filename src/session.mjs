/**
 * session.mjs — session persistence (slot-based model)
 * Each project (keyed by cwd hash) keeps unlimited session slots.
 * Every session lives in a numbered slot; the manifest tracks which slot is active.
 * There is no separate "current" file — the active slot IS the current session.
 *
 * File layout: {hash}.json.N (slots), {hash}.json.manifest (slot metadata + active pointer).
 * Legacy {hash}.json is migrated to a slot on first access.
 */

import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { execSync } from "node:child_process"
import { configDir } from "./config.mjs"
import { migrateHashLength } from "./session-migrate.mjs"

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

/** Derive base session path from cwd hash. Migrates legacy short-hash files on first access. */
export function sessionPath(cwd) {
  const hash = cwdHash(cwd)
  migrateHashLength(cwd, hash)
  return join(configDir, "sessions", `${hash}.json`)
}

function slotPath(cwd, n) { return sessionPath(cwd) + "." + n }
export { slotPath }
function manifestPath(cwd) { return sessionPath(cwd) + ".manifest" }

/** Path to the active slot's file */
export function activePath(cwd) {
  return slotPath(cwd, activeSlot(cwd))
}

/** Atomic write: write to temp file then rename to replace, preventing truncated JSON from mid-write crash. */
function writeSessionFile(p, data) {
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

// ========== slot management ==========

/** Normalize slot metadata: old format is a raw timestamp number; new format is { ts, ... } object */
function slotMetaTs(v) { return typeof v === "number" ? v : (v?.ts ?? 0) }

function slotCmp(a, b) { return slotMetaTs(a[1]) - slotMetaTs(b[1]) }

/** Detect a genuine user message (excludes system-reminder injected messages) */
function isRealUserMsg(m) {
  return m.role === "user" && typeof m.content === "string" && !m.content.startsWith("[System reminder:")
}

/** Extract slot metadata from history (shared by slotDigest and loadSlotMeta) */
function extractSlotMeta(history, activeProvider, updatedAt, title = "") {
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

/** Extract preview summary from session data for manifest storage (with current timestamp) */
function slotDigest(data) {
  const meta = extractSlotMeta(data.history ?? [], data.activeProvider, data.updatedAt, data.title ?? "")
  return { ts: Date.now(), ...meta }
}

function loadManifest(cwd) {
  try {
    const p = manifestPath(cwd)
    if (!existsSync(p)) return { slots: {}, sessionId: null }
    const m = JSON.parse(readFileSync(p, "utf8"))
    if (!m.sessionId) m.sessionId = null
    return m
  } catch { return { slots: {}, sessionId: null } }
}

function saveManifest(cwd, m) {
  m.sessionId = getSessionId()
  writeSessionFile(manifestPath(cwd), m)
}

/**
 * Claim a slot for this process and set it as active. Idempotent.
 * Preference order:
 *  1. The current active slot, if it is unowned / ours / its owner is dead — reuse it.
 *  2. Any slot that is unowned or owned by a dead process (reclaim).
 *  3. A brand-new slot when all are owned by live processes.
 * The owner is recorded in m.slotSessions so other processes (CLI ↔ VS Code) can
 * see which slots are taken and avoid them.
 */
function ensureActive(cwd, m) {
  const mySessionId = getSessionId()
  if (!m.slotSessions) m.slotSessions = {}

  // Already own the active slot — nothing to do.
  if (m.active && m.slotSessions[m.active] === mySessionId) return

  const isFree = (slot) => {
    const owner = m.slotSessions[slot]
    if (!owner || owner === mySessionId) return true
    return !isProcessAlive(parseInt(owner.split('-')[0]))
  }

  // 1. Prefer the current active slot if we can take it (preserves "resume where you left off").
  if (m.active && m.slots[m.active] && isFree(m.active)) {
    m.slotSessions[m.active] = mySessionId
    saveManifest(cwd, m)
    return
  }

  // 2. Otherwise claim the first slot that is free.
  const allSlots = Object.keys(m.slots).filter(n => /^\d+$/.test(n)).map(Number).sort((a, b) => a - b)
  for (const slot of allSlots) {
    if (isFree(slot)) {
      m.active = slot
      m.slotSessions[slot] = mySessionId
      saveManifest(cwd, m)
      return
    }
  }

  // 3. All slots owned by live processes — allocate a new one (no limit).
  const newSlot = allSlots.length > 0 ? Math.max(...allSlots) + 1 : 1
  m.active = newSlot
  m.slotSessions[newSlot] = mySessionId
  saveManifest(cwd, m)
}

/**
 * Check if a process with given PID is still alive.
 * Returns false if process doesn't exist or we can't determine.
 */
function isProcessAlive(pid) {
  if (!pid || isNaN(pid)) return false
  try {
    // On Windows: tasklist /FI "PID eq <pid>" /NH
    // On Unix: kill(pid, 0) or check /proc/<pid>
    if (process.platform === 'win32') {
      const output = execSync(`tasklist /FI "PID eq ${pid}" /NH`, { encoding: 'utf8', stdio: 'pipe' })
      return output.includes(String(pid))
    } else {
      // Unix: try to send signal 0 (doesn't kill, just checks)
      process.kill(pid, 0)
      return true
    }
  } catch {
    return false
  }
}

/** Return the active slot number for this process, claiming one if necessary */
export function activeSlot(cwd) {
  const m = loadManifest(cwd)
  ensureActive(cwd, m)
  return m.active
}

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
    return { ts, ...meta }
  } catch {
    return { ts }
  }
}

/** List all slots, newest first. Includes isActive flag. */
export function listSlots(cwd) {
  const m = loadManifest(cwd)
  const active = m.active ?? activeSlot(cwd)
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
        activeProvider: meta.activeProvider ?? "",
        updatedAt: meta.updatedAt ?? meta.ts,
        updatedDate: new Date(meta.updatedAt ?? meta.ts).toLocaleString(),
        title: meta.title ?? "",
      }
    })
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Switch active slot. No file copying — just change the pointer in the manifest.
 * Returns the loaded session data (null if slot doesn't exist).
 */
export function switchToSlot(cwd, slot) {
  const m = loadManifest(cwd)
  if (!m.slots[slot]) return null
  m.active = slot
  saveManifest(cwd, m)
  return loadSession(cwd)
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
  if (m.active === n) delete m.active
  saveManifest(cwd, m)
  return true
}

/** Rename a slot: update the slot file's title + the manifest metadata (shared with VS Code). */
export function renameSlot(cwd, slot, title) {
  const n = Number(slot)
  if (!Number.isInteger(n) || n < 1) return false
  const p = slotPath(cwd, n)
  if (!existsSync(p)) return false
  let data
  try {
    data = JSON.parse(readFileSync(p, "utf8"))
  } catch {
    return false
  }
  data.title = title
  writeSessionFile(p, data)
  const m = loadManifest(cwd)
  if (m.slots[n]) {
    m.slots[n] = slotDigest(data)
    saveManifest(cwd, m)
  }
  return true
}


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

/** Save agent state to the active slot file (atomic write). `display` (the old
 *  WYSIWYG render snapshot) is DEPRECATED — it drifted out of sync with history
 *  whenever VS Code wrote the slot, and the TUI resumed from a stale snapshot.
 *  Restore now always rebuilds from history (lazy, see startup.mjs). */
export function saveSession(agent) {
  // _fullHistory is written at the source via pushReal — no flush needed here.
  // history        = FULL, never-compacted (human-readable; VS Code panel & CLI resume read this)
  // contextHistory = machine context (possibly compacted) so CLI resume keeps the token savings
  // Human line: transient machine injections never enter the readable record.
  const history = (agent._fullHistory ?? agent.history).filter((m) => !m.transient && !isLegacyTransient(m))
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
    goal: agent.goal ?? null,
    advisor: agent.config?.advisor ?? null,
    pendingReminders: agent._pendingReminders ?? [],
    sessionStart: agent._sessionStart ?? null,
  }
  const slot = activeSlot(agent.cwd)
  writeSessionFile(slotPath(agent.cwd, slot), data)
  // Update slot metadata in manifest
  try {
    const m = loadManifest(agent.cwd)
    m.slots[slot] = slotDigest(data)
    saveManifest(agent.cwd, m)
  } catch (e) {
    // Manifest update failure is non-fatal — data is safe, metadata will lazy-recover on next listSlots
    console.error(`[session] manifest metadata update failed for slot ${slot}: ${e.message}`)
  }
}

/** Load session data from the active slot; returns null if missing, corrupted, or version mismatch */
export function loadSession(cwd) {
  const tryLoad = (p) => {
    try {
      if (!existsSync(p)) return null
      const data = JSON.parse(readFileSync(p, "utf8"))
      if (data?.version !== 1 && data?.version !== 2) return null
      if (!Array.isArray(data.history)) return null
      if (data.cwd && data.cwd.toLowerCase() !== cwd.toLowerCase()) return null
      data.history = data.history.filter((m) => !isLegacyTransient(m))
      data._recovered = false
      return data
    } catch (e) {
      return { _error: e }
    }
  }

  // Try the active slot first (post-migration, legacy file may be stale)
  const slot = activeSlot(cwd)
  const p = slotPath(cwd, slot)
  let result = tryLoad(p)
  if (result && !result._error) return result
  if (result?._error) {
    console.error(`[session] failed to load slot ${slot}: ${result._error.message}. Trying .tmp fallback...`)
    const tmpResult = tryLoad(`${p}.tmp`)
    if (tmpResult && !tmpResult._error) {
      console.error(`[session] recovered from .tmp fallback`)
      tmpResult._recovered = true
      return tmpResult
    }
    console.error(`[session] .tmp fallback also failed — session lost.`)
    try { renameSync(p, `${p}.corrupted`) } catch {}
  }

  // Fallback: try the legacy current file (pre-migration, or migration failed to clean up)
  const legacy = sessionPath(cwd)
  result = tryLoad(legacy)
  if (result && !result._error) {
    return result
  }
  if (result?._error) {
    console.error(`[session] failed to load legacy ${legacy}: ${result._error.message}`)
    try { renameSync(legacy, `${legacy}.corrupted`) } catch {}
  }

  return null
}

/** Apply loaded session data onto an agent object; returns true if provider was switched */
export function applySession(agent, data) {
  // data.history is the FULL never-compacted record (human line); data.contextHistory is the
  // (possibly compacted) machine line. Restore each line from its own source — the machine
  // context keeps its compaction savings across resume. Legacy files without contextHistory
  // fall back to seeding the machine line from the full history (it re-compacts when needed).
  agent.config ??= {} // ACP test mocks may omit config; be defensive like the ??= below
  const full = Array.isArray(data.history) ? data.history : []
  const machine = Array.isArray(data.contextHistory) ? data.contextHistory : full
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
  // Ensure active is set (migrate if needed)
  if (!m.active) ensureActive(cwd, m)

  // Find next available slot number
  let slot = 1
  while (m.slots[slot]) slot++

  // Write empty session
  const data = { version: 2, cwd, title: "", updatedAt: Date.now(), history: [], tasks: [], goal: null, autoApprove: false, advisor: null, pendingReminders: [], sessionStart: null }
  writeSessionFile(slotPath(cwd, slot), data)
  m.slots[slot] = slotDigest(data)
  m.active = slot
  saveManifest(cwd, m)
  return slot
}
