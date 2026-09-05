/**
 * session-slots.mjs — manifest / slot claiming / slot-number management (VS Code side).
 * Split out of session-io.mjs (2026-09-01: 606 lines > 500 hard limit, CLI did the same
 * split — session.mjs → session-slots.mjs). session-io.mjs keeps the session-file
 * business logic and re-exports everything from here, so callers' import paths are
 * unchanged.
 *
 * Storage contract parity with the CLI (docs/design/SESSION.md): same files
 * (~/.thincoder/sessions/<sha1(cwd)>.json.{N,manifest}), same claiming rules, same
 * manifest merge semantics.
 */

import { readFileSync, writeFileSync, mkdirSync, unlinkSync, renameSync, existsSync } from "node:fs"
import { createHash } from "node:crypto"
import { homedir } from "node:os"
import { join, dirname } from "node:path"
import { execSync } from "node:child_process"
// §10 D-2（2026-09-05）：resumeSlot 的恢复决策归本文件（slot/manifest/claim 层），其 data
// 层读（loadSlot 校验/保现场）按模块职责属 session-io.mjs（hub——500 行硬限内不迁移）。
// 静态环仅此一处：导出为函数声明（实例化期已初始化），且只在函数体内运行时使用——
// 环安全；CLI 端 session-slots ↔ session.mjs 同构镜像。
import { loadSlot } from "./session-io.mjs"

let currentSessionId = null
let sessionsDirOverride = null

/** Test seam (2026-09-01 advisor 🔵): migration tests must not touch the real
 *  ~/.thincoder/sessions — call _setSessionsDirForTest(tmp) before use, and
 *  _resetSessionsDirForTest() in afterEach to restore the real dir (process-level
 *  global; node:test isolates per file, but reset keeps future in-process runners safe). */
export function _setSessionsDirForTest(dir) {
  sessionsDirOverride = dir
}

export function _resetSessionsDirForTest() {
  sessionsDirOverride = null
}

/** Unique session ID for this extension-host process (same format as CLI: pid-ts-rand). */
export function getSessionId() {
  if (!currentSessionId) {
    currentSessionId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
  return currentSessionId
}

export function sessionsDir() {
  return sessionsDirOverride ?? join(homedir(), ".thincoder", "sessions")
}

/** Normalize cwd for hashing: uppercase Windows drive letter so the extension's
 *  uri.fsPath (lowercased) matches the CLI's process.cwd() hash. */
export function normalizeCwd(cwd) {
  return cwd.replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")
}

/** Full sha1 hex (40 chars), not truncated. Shared contract with the CLI. */
function cwdHash(cwd) {
  return createHash("sha1").update(normalizeCwd(cwd)).digest("hex")
}

/** One-time migration: rename legacy short-hash session files to the full 40-char hash.
 *  Idempotent; runs on first access per cwd (2026-09-01 advisor round2 🔵：已迁移/确认无
 *  legacy 的 hash 记录在 Set 中短路——否则每次 slotPath/manifestPath 都重跑 5 候选 × 3
 *  existsSync 的系统调用）。
 *  Historical hash algorithms (all sha1, none normalized the drive letter):
 *    - CLI:      sha1(cwd).slice(0, 12)      — cwd comes from process.cwd() (uppercase drive on Windows)
 *    - VS Code:  sha1(cwd).slice(0, 16)      — cwd comes from uri.fsPath (LOWERCASE drive on Windows)
 *  Plus the previous migration attempt's assumption (normalized 12 = first 12 of the full hash).
 *  Every combination is tried — a migration that only checks one candidate misses real
 *  legacy files (drive-letter case differs between CLI and VS Code historical paths). */
const migratedHashes = new Set() // full 40-char hash → migration already attempted (found none or done)
function migrateHashLength(cwd, fullHash) {
  if (migratedHashes.has(fullHash)) return false
  const dir = sessionsDir()
  const lower = cwd.replace(/^([A-Z]):/, (_, d) => d.toLowerCase() + ":")
  const candidates = [
    createHash("sha1").update(cwd).digest("hex").slice(0, 12),
    createHash("sha1").update(cwd).digest("hex").slice(0, 16),
    createHash("sha1").update(lower).digest("hex").slice(0, 12),
    createHash("sha1").update(lower).digest("hex").slice(0, 16),
    fullHash.slice(0, 12),
  ]
  const newBase = join(dir, `${fullHash}.json`)
  let migrated = false
  for (const short of new Set(candidates)) {
    const legacyBase = join(dir, `${short}.json`)
    if (!existsSync(legacyBase) && !existsSync(`${legacyBase}.manifest`) && !existsSync(`${legacyBase}.1`)) continue
    migrated = true
    try {
      for (const suffix of ["", ".manifest", ...Array.from({ length: 64 }, (_, i) => `.${i + 1}`)]) {
        const from = legacyBase + suffix
        if (existsSync(from) && !existsSync(newBase + suffix)) renameSync(from, newBase + suffix)
      }
    } catch { /* best-effort */ }
  }
  migratedHashes.add(fullHash)
  return migrated
}

function basePath(cwd) {
  const hash = cwdHash(cwd)
  migrateHashLength(cwd, hash)
  return join(sessionsDir(), `${hash}.json`)
}

export function slotPath(cwd, n) { return `${basePath(cwd)}.${n}` }
export function manifestPath(cwd) { return `${basePath(cwd)}.manifest` }

// ─── End marker（SESSION.md §10 端分离恢复——本端"最后使用槽位"记录）──────

/** 端常量：本端记录文件后缀——VS Code 写 .vscode、CLI 写 .cli，互不触碰（NF1：本端
 *  记录是本端单写者文件——不新增跨端共享可变字段）。 */
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

/** 写本端记录（原子 .tmp+rename，复用 writeFile）：slot = 目标槽号或 null（显式置空）。
 *  失败容忍（NF2）：写失败按无记录路径降级——不抛错，不影响会话数据。 */
export function writeEndMarker(cwd, slot) {
  try {
    writeFile(endMarkerPath(cwd), { slot, updatedAt: Date.now() })
  } catch { /* NF2：失败容忍 */ }
}


/** Atomic write: write to temp file then rename (same as CLI writeSessionFile). */
export function writeFile(p, data) {
  mkdirSync(dirname(p), { recursive: true })
  const tmp = `${p}.tmp`
  writeFileSync(tmp, JSON.stringify(data), "utf8")
  try {
    renameSync(tmp, p)
  } catch {
    try { unlinkSync(p) } catch {}
    try { renameSync(tmp, p) } catch { writeFileSync(p, readFileSync(tmp, "utf8"), "utf8") }
  }
}

// ─── Manifest ───────────────────────────────────────────────

export function loadManifest(cwd) {
  try {
    const p = manifestPath(cwd)
    if (!existsSync(p)) return { slots: {}, active: null, sessionId: null }
    const m = JSON.parse(readFileSync(p, "utf8"))
    if (!m.slots) m.slots = {}
    if (!m.sessionId) m.sessionId = null
    return m
  } catch { return { slots: {}, active: null, sessionId: null } }
}

export function saveManifest(cwd, m, deletions = null, opts = {}) {
  // 2026-09-01 CLI 同步（会诊 kimi/deepseek 🟡）：写前重读按"条目级"合并——原实现把
  // 读时快照整对象写回，CLI/扩展双进程并发时窗口内对方的 slots/slotSessions/active
  // 变更被覆盖抹除（被抹认领的槽变"文件在、无属主"→ 第三方可认领 → 双属主）。
  // 删除意图经 deletions 显式表达（deleteSlotAndUpdate）；active 是单值——只有显式
  // 翻指针的调用点（ensureActive 分支、newSlot、switchToSlot、删除 active 时）传
  // setActive，其余默认保留磁盘 fresh.active。
  try {
    const p = manifestPath(cwd)
    if (existsSync(p)) {
      const fresh = JSON.parse(readFileSync(p, "utf8"))
      if (fresh && typeof fresh === "object" && fresh.slots && typeof fresh.slots === "object") {
        const merged = { ...fresh }
        if (opts.setActive) merged.active = m.active
        merged.slots = { ...fresh.slots, ...(m.slots ?? {}) }
        merged.slotSessions = { ...(fresh.slotSessions ?? {}), ...(m.slotSessions ?? {}) }
        if (m.sessionId) merged.sessionId = m.sessionId
        if (deletions) {
          for (const [section, keys] of Object.entries(deletions)) {
            for (const k of keys) delete merged[section]?.[k]
          }
        }
        m = merged
      }
    }
  } catch {
    // 首次创建或 manifest 不可读：用传入对象。解析失败先改名保留现场（与 CLI 对齐——
    // 否则覆盖后全部槽位元数据丢失）；文件不存在时 rename 抛错被吞，无害。
    try { renameSync(manifestPath(cwd), `${manifestPath(cwd)}.corrupted`) } catch {}
  }
  m.sessionId = getSessionId()
  writeFile(manifestPath(cwd), m)
}

// ─── Process liveness & slot claiming ───────────────────────

/** Check if a process with given PID is still alive (same as CLI session.mjs).
 *  Returns false if process doesn't exist or we can't determine. */
export function isProcessAlive(pid) {
  if (!pid || isNaN(pid)) return false
  try {
    if (process.platform === "win32") {
      // 2026-09-01 CLI 同步：/FI 已按 PID 过滤；用 CSV 格式解析 PID 列（第 2 列），
      // 避免旧 includes() 对镜像名含"数字+空格"（如 "app 123.exe"）的贪婪误判。
      const output = execSync(`tasklist /FO CSV /FI "PID eq ${pid}" /NH`, { encoding: "utf8", stdio: "pipe" })
      return output.split(/\r?\n/).some((line) => {
        const m = line.match(/^"([^"]*)","(\d+)"/)
        return m && m[2] === String(pid)
      })
    }
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** 死主条目清理（2026-09-01 CLI 同步 会诊 F4 语义原样抽取——ensureActive/resumeSlot 共用）：
 *  删除 owner 进程已死的 slotSessions 条目。活进程在"认领→首次保存"窗口文件暂缺——
 *  不能以"文件缺失"短路删除活主条目。返回 deletions 计算函数（调用时按 m 当前状态过滤
 *  刚重新认领的槽——防删掉自己的新属主），无清理返回 null。删除须经 saveManifest 的
 *  deletions 显式落盘（条目级合并会把磁盘死条目从 fresh 复活回写，仅传 m 等于没删）。 */
function cleanDeadOwners(m) {
  const mySessionId = getSessionId()
  const deadSlots = []
  for (const [s, owner] of Object.entries(m.slotSessions)) {
    if (owner && owner !== mySessionId) {
      const pid = parseInt(owner.split("-")[0])
      if (!pid || !isProcessAlive(pid)) {
        delete m.slotSessions[s]
        deadSlots.push(s)
      }
    }
  }
  return deadSlots.length === 0 ? null : () => ({ slotSessions: deadSlots.filter((s) => m.slotSessions[s] !== mySessionId) })
}

/**
 * Claim a slot for this process and set it as active. Idempotent. Mirrors CLI ensureActive.
 * Preference order:
 *  1. The current active slot, if it is unowned / ours / its owner is dead — reuse it.
 *  2. A slot whose FILE does not exist (2026-09-01 CLI 同步 会诊 F4 🔴——原实现认领
 *     "首个空闲 slot"，死主的旧槽文件仍在时会 resume 进陌生会话且保存覆盖它).
 *  3. A brand-new slot when all are owned by live processes (skip live-claimed /
 *     file-existing numbers; max from allSlots[last] — no Math.max spread). → allocateFresh
 * The owner is recorded in m.slotSessions so other processes (CLI ↔ VS Code) can
 * see which slots are taken and avoid them.
 */
function ensureActive(cwd, m) {
  const mySessionId = getSessionId()
  if (!m.slotSessions) m.slotSessions = {}
  // 死项清理（见 cleanDeadOwners）；删除经 deadParam 显式落盘（早退 + 分支 1/2/3 全传）。
  const deadParam = cleanDeadOwners(m)

  if (m.active && m.slotSessions[m.active] === mySessionId) {
    if (deadParam) saveManifest(cwd, m, deadParam())
    return
  }

  const isFree = (slot) => {
    const owner = m.slotSessions[slot]
    if (!owner || owner === mySessionId) return true
    return !isProcessAlive(parseInt(owner.split("-")[0]))
  }

  // 1. Prefer the current active slot if we can take it (preserves "resume where you left off").
  if (m.active && m.slots[m.active] && isFree(m.active)) {
    m.slotSessions[m.active] = mySessionId
    saveManifest(cwd, m, deadParam?.() ?? null, { setActive: true })
    return
  }

  // 2/3. 分支 2/3 已抽取为 allocateFresh（2026-09-05 §10 D-2——resumeSlot 全新分配复用）。
  allocateFresh(cwd, m, deadParam)
}

/**
 * Allocate a slot with ensureActive 分支 2/3 语义（2026-09-05 §10 D-2 抽取——resumeSlot
 * 步骤③"其余一切 → 全新分配"复用；与 newSlot 选号语义对齐）：
 *  2. Reclaim a manifest slot whose FILE does not exist (never held a session)；
 *  3. A brand-new slot when none is free / all numbers are taken.
 * 记录所有权 + active 指针（setActive）并落盘。返回分配的槽号。
 */
export function allocateFresh(cwd, m, deadParam = null) {
  const mySessionId = getSessionId()
  if (!m.slotSessions) m.slotSessions = {}
  const isFree = (slot) => {
    const owner = m.slotSessions[slot]
    if (!owner || owner === mySessionId) return true
    return !isProcessAlive(parseInt(owner.split("-")[0]))
  }

  // 2. Reclaim a slot whose FILE does not exist (never held a session).
  // 2026-09-01 CLI 同步 会诊 F4 🔴——原实现认领"首个空闲 slot"，死主的旧槽文件仍在时
  // 会 resume 进陌生会话且保存覆盖它。只有文件缺失的空 slot 才允许回收。
  const allSlots = Object.keys(m.slots).filter((n) => /^\d+$/.test(n)).map(Number).sort((a, b) => a - b)
  for (const slot of allSlots) {
    if (isFree(slot) && !existsSync(slotPath(cwd, slot))) {
      m.active = slot
      m.slotSessions[slot] = mySessionId
      saveManifest(cwd, m, deadParam?.() ?? null, { setActive: true })
      return slot
    }
  }

  // 3. All slots owned by live processes — allocate a new one (no limit).
  // 2026-09-01 CLI 同步（会诊 kimi 🟡）：新号从 max+1 起跳过"活进程已认领但尚未落盘"
  // 的号与现存文件号；max 取 allSlots[last]（数万槽位时 Math.max spread 有 RangeError 风险）。
  const liveClaimed = (n) => {
    const owner = m.slotSessions?.[n]
    return !!(owner && owner !== mySessionId && isProcessAlive(parseInt(owner.split("-")[0])))
  }
  let newSlot = allSlots.length > 0 ? allSlots[allSlots.length - 1] + 1 : 1
  while (liveClaimed(newSlot) || existsSync(slotPath(cwd, newSlot))) newSlot++
  m.active = newSlot
  m.slotSessions[newSlot] = mySessionId
  saveManifest(cwd, m, deadParam?.() ?? null, { setActive: true })
  return newSlot
}

/** 认领指定槽为本进程所有并置为 active（2026-09-05 §10 D-2 resumeSlot 认领路径——调用方
 *  已按"属主 空/死/本进程"判据校验可用性；幂等）。manifest active 保留为共享指针（D-6：
 *  旧版端/ACP 恢复依据 + 无记录端一次性继承源 + 列表回退高亮——不再作本端恢复第一依据）。
 *  deadParam 在写入所有权之后求值（防 deletions 删掉本调用刚认领的槽——ensureActive
 *  deadParam 同型过滤）。 */
export function claimSlot(cwd, slot, m = loadManifest(cwd), deadParam = null) {
  m.slotSessions ??= {}
  m.slotSessions[slot] = getSessionId()
  m.active = slot // 认领即翻共享指针（setActive 写 m.active——不更新则落快照旧值）
  saveManifest(cwd, m, deadParam?.() ?? null, { setActive: true })
}

/** 本端记录槽可用判据（D-2）：slot ∈ m.slots + 槽文件在盘 + 属主 空/死/本进程。 */
function usableSlot(cwd, m, slot) {
  if (!m.slots[slot] || !existsSync(slotPath(cwd, slot))) return false
  const owner = m.slotSessions?.[slot]
  if (!owner || owner === getSessionId()) return true
  const pid = parseInt(owner.split("-")[0])
  return !pid || !isProcessAlive(pid)
}

/**
 * 恢复决策（SESSION.md §10 D-2）——面板 resolve 的本端恢复入口（CLI resumeSlot 同构镜像）。
 * 返回 { slot, data }（data 可为 null——全新起步或读槽失败）。判据：
 *   ① 本端记录可用（slot ≠ null 且 ∈ m.slots 且槽文件在盘 且属主 空/死/本进程）→ claimSlot；
 *   ② 记录缺失（文件不存在 = 从未记录——升级/首用迁移窗口）：
 *      ②a active 属主 = 本进程（同进程重入——ensureActive 早退语义镜像：认领后
 *         尚未写 slots 条目/文件的窗口）→ 直接沿用；
 *      ②b 否则一次性继承 manifest.active（同判据；活属主绝不继承——全新槽起步，T-M3）；
 *   ③ 其余一切（slot:null 显式置空 / 槽被删 / 属主为活外人 / 继承失败）→ allocateFresh。
 * 每次落点都写本端记录；claim 后读槽失败（.corrupted/.unreadable——loadSlot 既有改名
 * 保全语义）→ 保持已 claim 槽 + data:null——不回滚认领、不改 marker——下次保存原地重建（T-M15）。
 */
export function resumeSlot(cwd) {
  const m = loadManifest(cwd)
  m.slotSessions ??= {}
  // 与 ensureActive 同型的死主清理（认领路径持久化——仅传 m 等于没删）
  const deadParam = cleanDeadOwners(m)
  const rec = readEndMarker(cwd) // null = 缺失/损坏；{slot:null|N} = 文件在（D-1）
  let slot = null
  if (rec?.slot != null && usableSlot(cwd, m, rec.slot)) slot = rec.slot // ① 本端记录可用
  else if (rec === null) {
    if (m.active && m.slotSessions?.[m.active] === getSessionId()) slot = m.active // ②a 同进程重入
    else if (m.active && usableSlot(cwd, m, m.active)) slot = m.active // ②b 一次性继承
  }
  if (slot !== null) claimSlot(cwd, slot, m, deadParam)
  else slot = allocateFresh(cwd, m, deadParam) // ③ 全新分配（slot:null 绝不继承——T-M4）
  // data 层：读已认领槽（loadSlot 自 session-io.mjs——环 import 见文件头注释）
  const data = loadSlot(cwd, slot)
  writeEndMarker(cwd, slot)
  return { slot, data }
}

/** Get this process's active slot number, claiming one if needed (same as CLI activeSlot). */
export function activeSlot(cwd) {
  const m = loadManifest(cwd)
  ensureActive(cwd, m)
  return m.active
}

/** Is the target slot owned by ANOTHER LIVE process? (CLI parity slotOccupancy —
 *  same-process owner excluded; used by the panel before binding a switched slot.) */
export function slotOccupancy(cwd, slot) {
  const m = loadManifest(cwd)
  const owner = m.slotSessions?.[slot]
  if (!owner) return { occupied: false }
  if (owner === getSessionId()) return { occupied: false }
  const pid = parseInt(owner.split("-")[0])
  if (!pid || !isProcessAlive(pid)) return { occupied: false }
  return { occupied: true, owner }
}
