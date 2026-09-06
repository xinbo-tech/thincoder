/**
 * session-slot-write.mjs — session slot metadata flag WRITE path (Parnas boundary: the
 * "session metadata flag write" decision group — autoApprove / planMode / engineering /
 * advisor guard, plus the fresh-slot default and the file-less write helper).
 *
 * Split out of session-io.mjs on 2026-09-06 (AUTO-bug fix) to keep that file under the
 * >500-line hard limit. These functions change session-level flags that clients read back
 * on the next turn. They depend on the core slot file I/O (loadSlot / saveSessionToSlot),
 * which stays in session-io.mjs; callers import them from session-io.mjs (re-exported,
 * import path unchanged).
 */

import { existsSync } from "node:fs"

import { getSessionId, loadManifest, slotPath } from "./session-slots.mjs"
import { loadSlot, saveSessionToSlot } from "./session-io.mjs"

/** Fresh slot data default (2026-09-06 AUTO-bug fix): the canonical empty-slot structure.
 *  Shared by newSlot (creates on panel new-session) and by the setSlot* write path
 *  (loadSlotForWrite) when a setSlot* lands on a genuinely-new slot this process just
 *  claimed via resumeSlot — whose data file does not exist yet ("claim 先行, 首保存落盘").
 *  Without this, setSlotAutoApprove hit `if (!data) return false` and silently dropped
 *  the AUTO flag, so the next turn read `undefined ?? false` and tools still asked. */
export function newSlotData(cwd) {
  return {
    version: 2, cwd, title: "", updatedAt: Date.now(),
    history: [], contextHistory: [], tasks: [],
    planMode: false, goal: null, autoApprove: false, advisor: null, pendingReminders: [], sessionStart: null,
  }
}

/**
 * Load a slot for a setSlot* write. Returns the parsed data, or — when the slot has
 * NO data file yet but THIS process claimed the slot via resumeSlot (a freshly allocated
 * slot whose file is created lazily on first save) — returns a brand-new default record.
 * Returns null for any other failure (version>2 / foreign cwd / corrupt / unknown slot),
 * keeping the "setSlot* returns false for an unrecognized slot" contract.
 * 2026-09-06 AUTO-bug fix: previously setSlotAutoApprove on a freshly-claimed (file-less)
 * slot hit `if (!data) return false` and silently dropped the flag.
 * Boundary: the version>2 case returns null on purpose (the file stays at its path, never
 * clobbered — a newer CLI's file is not ours to overwrite). A v3 slot the panel bound to via
 * resumeSlot would therefore still fail setSlot* (AUTO won't persist) — deliberate safety
 * posture; revisit only with v3-interop work.
 */
function loadSlotForWrite(cwd, slot) {
  const data = loadSlot(cwd, slot)
  if (data || !slot) return data
  // File-less slot: only treat it as writable if this process owns it per the manifest.
  const m = loadManifest(cwd)
  if (m.slotSessions?.[slot] !== getSessionId()) return null
  if (existsSync(slotPath(cwd, slot))) return null // file appeared but unreadable → don't clobber
  return newSlotData(cwd)
}

/**
 * Flip the session's autoApprove flag (CLI parity: session-level slot field, NOT a
 * VS Code setting). Returns false when the slot cannot be loaded.
 */
export function setSlotAutoApprove(cwd, slot, value) {
  const data = loadSlotForWrite(cwd, slot)
  if (!data) return false
  data.autoApprove = value
  saveSessionToSlot(cwd, slot, data)
  return true
}

/** Set the active slot's plan-mode flag (session-level, like autoApprove). */
export function setSlotPlanMode(cwd, slot, value) {
  const data = loadSlotForWrite(cwd, slot)
  if (!data) return false
  data.planMode = value
  saveSessionToSlot(cwd, slot, data)
  return true
}

/**
 * Set the slot's engineering flag — the SLOT is the source of truth for the VS Code
 * session (2026-08-29: engineering was global config.json `agent.engineering`, which the
 * CLI's /eng also writes, so the two ends flipped each other's mode). config.json keeps a
 * CLI-compat mirror; reads fall back to config only when the slot has no field yet.
 */
export function setSlotEngineering(cwd, slot, value) {
  const data = loadSlotForWrite(cwd, slot)
  if (!data) return false
  data.engineering = value
  saveSessionToSlot(cwd, slot, data)
  return true
}

/** Set the slot's advisor guard flag (`advisor: { guard }` — null upgrades to an object). */
export function setSlotAdvisorGuard(cwd, slot, value) {
  const data = loadSlotForWrite(cwd, slot)
  if (!data) return false
  data.advisor = { ...(typeof data.advisor === "object" && data.advisor !== null ? data.advisor : {}), guard: value }
  saveSessionToSlot(cwd, slot, data)
  return true
}

/** §24 D-24b（R13——2026-09-06）：写 slot 的 engDesignTokens 多槽表（{designId: token}
 *  JSON 形态——与 agentState/panel-session 往返同构）。async 设计评审 settle 常发生在挂起期
 *  （无 onComplete agentState 通道）——settle 记账经 _engPersist 直写 slot——下个 run 的
 *  setup 从 slot 恢复（T-24b3：digest 后 token 入槽 + spawn 可用）。空表写 null（清键）。 */
export function setSlotEngDesignTokens(cwd, slot, tokensObj) {
  const data = loadSlotForWrite(cwd, slot)
  if (!data) return false
  const t = tokensObj && typeof tokensObj === "object" && Object.keys(tokensObj).length > 0 ? tokensObj : null
  if (t === null) delete data.engDesignTokens
  else data.engDesignTokens = t
  saveSessionToSlot(cwd, slot, data)
  return true
}
