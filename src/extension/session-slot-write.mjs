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

/**
 * DESIGN-TOKEN-SETTLEMENT（2026-09-08）：slot 文件的 engDesignTokens 多槽表 = 权威结算台账。
 * - 写侧唯一权威写点：settle（advisor-async D1）——同步直写（去 fire-and-forget）——
 *   与 agentState 往返同构（{designId: token} JSON 形态）。空/无参写 null（清键）。
 * - 单值镜像 `engDesignToken`（持久化槽字段）已随 D5 退役——settle/agentState/consume/TTL
 *   一律不再写镜像字段（AC3——运行时零镜像写）；setup 水合处保留唯一一次性迁移读。
 * - 槽清理只经三触发（D2 评审 #3）：consume-design 显式清（clearSlotEngDesignTokens）/
 *   /new 分配全新空槽（天然无账本）/TTL 过期清（setup restore 过滤后回写）。空态
 *   agentState 保存（saveLines）不触发清理（只防误清 settle 刚落盘的 token）。 */
export function setSlotEngDesignTokens(cwd, slot, tokensObj) {
  const data = loadSlotForWrite(cwd, slot)
  if (!data) return false
  const t = tokensObj && typeof tokensObj === "object" && Object.keys(tokensObj).length > 0 ? tokensObj : null
  if (t === null) delete data.engDesignTokens
  else data.engDesignTokens = t
  saveSessionToSlot(cwd, slot, data)
  return true
}

/** 读 slot 权威结算台账（engDesignTokens 多槽表）。返回 { engDesignTokens? }（未过期判定由
 *  读侧 setup/spawn-gate/write-gate 各自负责——I/O 层不过滤）或 null（槽不可读）。
 *  单值镜像 engDesignToken 字段已退役——此处不读（AC3——运行时零镜像读；唯一镜像迁移读在
 *  setup 水合处经 engState，不走本读取面）。D4/D5 门禁与 spawn-gate 的 miss 回读共用。 */
export function readSlotEngDesignTokens(cwd, slot) {
  try {
    const data = loadSlot(cwd, slot)
    if (!data) return null
    const out = {}
    if (data.engDesignTokens !== undefined) out.engDesignTokens = data.engDesignTokens
    return out
  } catch {
    return null
  }
}

/** D2 槽清理触发① consume-design 后清（2026-09-08）：从权威台账移除一个 designId 槽（或
 *  无 designId 时清空整账本——单设计会话链终核销）。只动 engDesignTokens 字段——镜像字段已
 *  退役不清（D5）。返回是否移除（未命中/已清 = false——consume 幂等 no-op）。 */
export function clearSlotEngDesignToken(cwd, slot, designId) {
  const data = loadSlotForWrite(cwd, slot)
  if (!data) return false
  const obj = data.engDesignTokens
  if (!obj || typeof obj !== "object") return false
  if (designId) {
    if (!(designId in obj)) return false // 未命中/已清 = 幂等 no-op
    delete obj[designId]
    if (Object.keys(obj).length === 0) delete data.engDesignTokens
  } else {
    delete data.engDesignTokens // 单设计会话整账本清
  }
  saveSessionToSlot(cwd, slot, data)
  return true
}

/** D6（评审 #3）：解析 token 尾 :expiresAt（uuid:expiresAt 2 段——validateDesignToken 同源）；无效 → -Infinity（无 mint 时间不参胜——退回槽值）。 */
function tokenExpiryMs(token) {
  const p = typeof token === "string" ? token.split(":") : null
  if (!p || p.length !== 2) return -Infinity
  const exp = parseInt(p[1], 10)
  return Number.isNaN(exp) ? -Infinity : exp
}

/** D2 空态 + D6 union 合并（2026-09-08，panel-session saveLines 用——可单测，详见
 *  DESIGN-TOKEN-SETTLEMENT.md D2/D6）：incoming = agentState 携带（undefined = 未携带），
 *  existing = 槽既有值。D2：incoming 空但槽有值 → 保留槽（空态不触发清理）；都空 → null。
 *  D6 union：incoming 非空但不全 → 并集——槽独有项保留（槽 = 权威台账，consume 对称删盘不复活）；
 *  同 key 以新 mint 者胜（token 尾 :expiresAt 大 = 后 mint = 新——非盲目 incoming wins）；平手/无效 → 保留槽值。 */
export function engTokensMergeForSave(incoming, existing) {
  if (incoming === undefined) return existing ?? null
  const hasNew = incoming && typeof incoming === "object" && !Array.isArray(incoming) && Object.keys(incoming).length > 0
  const slotHas = existing && typeof existing === "object" && !Array.isArray(existing) && Object.keys(existing).length > 0
  if (!hasNew) return slotHas ? existing : null
  if (!slotHas) return incoming
  const out = { ...existing }
  for (const [key, tok] of Object.entries(incoming)) {
    if (!(key in out) || tokenExpiryMs(tok) > tokenExpiryMs(out[key])) out[key] = tok
  }
  return out
}

