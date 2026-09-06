/**
 * session-slots.mjs — slot / manifest 管理（2026-08-31 advisor round1 🔴 拆分：
 * session.mjs 曾超 500 行硬限；slot 所有权、认领、清单与核心读写分离，session.mjs
 * re-export 全部导出以保持既有 import 兼容）。
 *
 * 模型：每个项目（cwd hash）拥有无限编号 slot；manifest 记录 active 指针 + 每个
 * slot 的属主进程（slotSessions: slot → "pid-timestamp-random"，CLI ↔ VS Code
 * 共享 manifest 以互斥认领）。属主判定用 PID 存活探测（isProcessAlive）。
 */

import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from "node:fs"
import { join, dirname, basename } from "node:path"
import { execSync } from "node:child_process"
import { configDir } from "./config.mjs"
import { migrateHashLength } from "./session-migrate.mjs"
// §10 D-2（2026-09-05）：resumeSlot 决策归本文件（slot/claim 层）；data 层读（loadSlotFile/
// legacy 过滤）属 session.mjs（500 行内不迁移）——静态环仅此一处：函数声明实例化期已初始化、
// 只函数体内运行时使用（环安全）；VS Code 端 session-slots ↔ session-io 同构镜像。
import { loadSlotFile, isLegacyTransient } from "./session.mjs"

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

export function slotPath(cwd, n) { return sessionPath(cwd) + "." + n }
export function manifestPath(cwd) { return sessionPath(cwd) + ".manifest" }

// ========== end marker（SESSION.md §10 端分离恢复——本端"最后使用槽位"记录）==========

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

// ========== slot management ==========

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
export function slotDigest(data) {
  const meta = extractSlotMeta(data.history ?? [], data.activeProvider, data.updatedAt, data.title ?? "")
  return { ts: Date.now(), ...meta }
}

export function loadManifest(cwd) {
  try {
    const p = manifestPath(cwd)
    if (!existsSync(p)) return { slots: {}, sessionId: null }
    const m = JSON.parse(readFileSync(p, "utf8"))
    if (!m.slots) m.slots = {} // 2026-09-01 会诊 deepseek 🔵：损坏的 {} manifest 不再让调用方抛 TypeError
    if (!m.sessionId) m.sessionId = null
    return m
  } catch { return { slots: {}, sessionId: null } }
}

export function saveManifest(cwd, m, deletions = null, opts = {}) {
  // 2026-08-31 会诊 kimi/deepseek 🟡：写前重读并按"条目级"合并——原实现把"读时快照"
  // 整对象写回，另一进程在窗口内对 slots/slotSessions/active 的变更被覆盖抹除（被抹
  // 认领的槽变"文件在、无属主"→ 第三方可认领 → 双属主 → F2 互旋）。无锁文件无法
  // 完全原子，重读合并把丢失更新窗口缩到最小；删除意图经 deletions 参数显式表达
  // （deleteSlot：{ slots: [n], slotSessions: [n] }）。
  // 2026-09-01 会诊 deepseek/kimi/glm 🟡：active 是单值——只有显式翻指针的调用方
  // （ensureActive 分支、newSession、switchToSlot、deleteSlot 删到 active 时）传
  // opts.setActive；其余调用方（saveSession/ACP 认领/死项清理）默认保留磁盘 fresh 的
  // active，否则毫秒窗口内会把并发方刚翻的 active 回滚（F1 防漂移的反向变体）。
  try {
    const fresh = JSON.parse(readFileSync(manifestPath(cwd), "utf8"))
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
  } catch {
    // 首次创建或 manifest 不可读：用传入对象。2026-09-01 advisor 🟡：解析失败时先改名
    // 保留现场（与 loadSlotFile 对 slot 文件的 .corrupted 原则一致）——否则覆盖后全部
    // 槽位元数据（digest/title/updatedAt）永久丢失，/session 列表变空。文件不存在时
    // rename 抛错被吞，无害。
    try { renameSync(manifestPath(cwd), `${manifestPath(cwd)}.corrupted`) } catch {}
  }
  m.sessionId = getSessionId()
  writeSessionFile(manifestPath(cwd), m)
}

/** 死主条目清理（2026-08-31 会诊 F4 + 2026-09-01 会诊 deepseek/kimi 🔴 语义原样抽取——
 *  ensureActive/resumeSlot 共用）：删除 owner 进程已死的 slotSessions 条目。死主判定必须跑
 *  isProcessAlive——不能以"文件缺失"短路（活进程在"认领 → 首次保存"窗口文件暂缺，误删会
 *  致双进程同槽）。返回 deletions 计算函数（调用时按 m 当前状态过滤刚重新认领的槽——防删
 *  掉自己的新属主），无清理返回 null。删除须经 saveManifest 的 deletions 显式落盘——条目级
 *  合并会把磁盘死条目从 fresh 复活回写（N1 + 会诊 🔴）。 */
function cleanDeadOwners(m) {
  const mySessionId = getSessionId()
  const deadSlots = []
  for (const [slot, owner] of Object.entries(m.slotSessions)) {
    if (owner && owner !== mySessionId) {
      const pid = parseInt(owner.split("-")[0])
      if (!pid || !isProcessAlive(pid)) {
        delete m.slotSessions[slot]
        deadSlots.push(slot)
      }
    }
  }
  return deadSlots.length === 0 ? null : () => ({ slotSessions: deadSlots.filter((s) => m.slotSessions[s] !== mySessionId) })
}

/**
 * Claim a slot for this process and set it as active. Idempotent.
 * Preference order:
 *  1. The current active slot, if it is unowned / ours / its owner is dead — reuse it.
 *  2. Any slot that is unowned or owned by a dead process (reclaim).  → allocateFresh
 *  3. A brand-new slot when all are owned by live processes.          → allocateFresh
 * The owner is recorded in m.slotSessions so other processes (CLI ↔ VS Code) can
 * see which slots are taken and avoid them.
 */
function ensureActive(cwd, m) {
  const mySessionId = getSessionId()
  if (!m.slotSessions) m.slotSessions = {}
  // 顺手清理死主条目（见 cleanDeadOwners）。ensureActive 因 F1 粘性每次进程只跑几次，
  // 全量 tasklist 成本可接受；清理结果必须落盘——早退 + 分支 1/2/3 全部传 deletions。
  const deadParam = cleanDeadOwners(m)

  // Already own the active slot — nothing to do.
  // 2026-08-31 advisor round2 🔵：清理结果此时落盘（否则死项清理只在内存生效，早退
  // 路径永不持久化——死条目一直滞留到其他路径保存才消失）。
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
 * 步骤③"其余一切 → 全新分配"复用；与 newSession 选号语义对齐）：
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

  // 2. Reclaim a slot whose FILE does not exist (never held a session). 2026-08-31 会诊 F4：
  //    原实现认领"编号最小的空闲 slot"——死主的旧 slot 文件仍在，新进程会 resume 进
  //    陌生会话（"会话乱了"实锤）且退出时覆盖它。只有文件缺失的空 slot 才允许回收。
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
  // 2026-08-31 advisor round2 🟡：新号从 max+1 起逐号跳过"已被活进程认领但尚未落盘"
  // 的号（认领→首次保存窗口：slotSessions 有条目、m.slots 无条目、文件不存在——
  // 仅凭 m.slots/existsSync 查不到 → 双进程认领同一号 → 同槽双写/互旋）。
  // 2026-09-01 会诊 kimi 🟡：同时跳过文件仍存在的号（与 newSession 对齐）——manifest
  // 条目丢失/损坏时 max+1 会撞上孤儿槽文件 → F2 把真会话轮转成不可见的 .bak。
  // 另：allSlots 已升序，取 max 用 allSlots[allSlots.length-1]（数万槽位时 Math.max
  // spread 有 RangeError 风险）。
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

/**
 * Check if a process with given PID is still alive.
 * Returns false if process doesn't exist or we can't determine.
 */
export function isProcessAlive(pid) {
  if (!pid || isNaN(pid)) return false
  try {
    // On Windows: tasklist /FI "PID eq <pid>" /NH
    // On Unix: kill(pid, 0) or check /proc/<pid>
    if (process.platform === 'win32') {
      // 2026-08-31 会诊 F4 + advisor round1 🔵：/FI 已按 PID 过滤；用 CSV 格式解析 PID
      // 列（第 2 列），避免旧 includes() 误报活、新行解析在罕见镜像名（含"数字+空格"）
      // 下误报死。
      const output = execSync(`tasklist /FO CSV /FI "PID eq ${pid}" /NH`, { encoding: 'utf8', stdio: 'pipe' })
      return output.split(/\r?\n/).some((line) => {
        const m = line.match(/^"([^"]*)","(\d+)"/)
        return m && m[2] === String(pid)
      })
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
        activeProvider: meta.activeProvider ?? "",
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
  if (m.active === n) delete m.active
  // setActive: true —— 显式表达"删到 active 时 active 置空"的意图（saveManifest 默认
  // 保留 fresh.active，2026-09-01 会诊三家 🟡）
  saveManifest(cwd, m, { slots: [n], slotSessions: [n] }, { setActive: true })
  // 2026-09-05 §10 D-4/F4：删到本端记录槽 → 记录显式置空（文件保留 + slot:null——下次全新起步，不复活——T-M4/T-M8）
  if (readEndMarker(cwd)?.slot === n) writeEndMarker(cwd, null)
  return true
}

// renameSlot 已拆至 session-rename.mjs（2026-09-06 §12.2.5 契约改使本文件超 500 行硬限，
// §12.3 授权拆分）；session.mjs re-export 保持调用点不变。

// ========== resumeSlot（SESSION.md §10 D-2——端分离恢复决策）==========

/** 本端记录槽可用判据（D-2）：slot ∈ m.slots + 槽文件在盘 + 属主 空/死/本进程。 */
function usableSlot(cwd, m, slot) {
  if (!m.slots[slot] || !existsSync(slotPath(cwd, slot))) return false
  const owner = m.slotSessions?.[slot]
  if (!owner || owner === getSessionId()) return true
  const pid = parseInt(owner.split("-")[0])
  return !pid || !isProcessAlive(pid)
}

/** legacy 单文件兜底（v1/v2 单会话 {hash}.json——迁移前残留；仅 data 层——2026-09-05 §10
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
 * 恢复决策（SESSION.md §10 D-2）——TUI 启动的本端恢复入口（VS Code 面板同构镜像）。
 * 返回 { slot, data }（data 可为 null——全新起步或读槽失败）。判据：
 *   ① 本端记录可用（slot ≠ null 且 ∈ m.slots 且槽文件在盘 且属主 空/死/本进程）→ claimSlot；
 *   ② 记录缺失（从未记录 = 升级/首用迁移窗口）：②a active 属主 = 本进程（同进程重入——
 *      ensureActive 早退语义镜像：认领后尚未写 slots 条目/文件的窗口）→ 直接沿用；
 *      ②b 否则一次性继承 manifest.active（同判据；活属主绝不继承——全新槽起步，T-M3）；
 *   ③ 其余一切（slot:null 显式置空 / 槽被删 / 属主为活外人 / 继承失败）→ allocateFresh。
 * 每次落点都写本端记录；claim 后读槽失败（.corrupted/.unreadable——loadSlotFile 既有改名
 * 保全语义）→ 保持已 claim 槽 + data:null——不改 marker——下次保存原地重建（T-M15）。
 */
export function resumeSlot(cwd) {
  const m = loadManifest(cwd)
  m.slotSessions ??= {}
  // 与 ensureActive 同型的死主清理（认领路径持久化——F5a 纪律：仅传 m 等于没删）
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
  // data 层：读已认领槽（loadSlotFile 自 session.mjs——环 import 见文件头）；读失败/槽文件不在 → legacy 单文件兜底（仅 data）
  let data = loadSlotFile(cwd, slot)
  if (!data) data = loadLegacyFile(cwd)
  writeEndMarker(cwd, slot)
  return { slot, data }
}
