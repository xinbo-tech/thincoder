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
import { mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, existsSync, statSync } from "node:fs"
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

export function slotPath(cwd, n) { return sessionPath(cwd) + "." + n }
export function manifestPath(cwd) { return sessionPath(cwd) + ".manifest" }

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

  // 2026-08-31 会诊 F4：顺手清理死主条目——owner 进程已死的 slot 标记不再占用
  // （原实现死项永不清理，空闲 slot 越来越少 → 新号滥发；且每次 save 对每 slot 跑
  // tasklist，延迟随 slot 数增长）。
  // advisor round2 #10：不能加 "文件缺失即删" 的短路——活进程在"认领 → 首次保存"窗口
  // （新项目首跑：启动认领 slot、回合末才落盘）文件暂缺，误删其条目会被另一进程当
  // 空闲认领 → 双进程永久写同一槽（F2 轮转互旋）。死主判定必须跑 tasklist；
  // ensureActive 因 F1 粘性每次进程只跑几次，全量 tasklist 成本可接受。
  let cleaned = false
  const deadSlots = []
  for (const [slot, owner] of Object.entries(m.slotSessions)) {
    if (owner && owner !== mySessionId) {
      const pid = parseInt(owner.split("-")[0])
      if (!pid || !isProcessAlive(pid)) {
        delete m.slotSessions[slot]
        deadSlots.push(slot)
        cleaned = true
      }
    }
  }

  // 2026-09-01 会诊三家：deadSlots 里可能含分支 1/2 刚重新认领的槽（m.slotSessions[s]
  // 已被覆盖为 mySessionId）——deletions 若删除它会把自己的认领抹掉（下次 ensureActive
  // 重新认领，但窗口内属主真空）。过滤在每次调用时按当前 m 状态计算。
  const deadParam = () => (cleaned ? { slotSessions: deadSlots.filter((s) => m.slotSessions[s] !== mySessionId) } : null)

  // Already own the active slot — nothing to do.
  // 2026-08-31 advisor round2 🔵：清理结果此时落盘（否则死项清理只在内存生效，早退
  // 路径永不持久化——死条目一直滞留到其他路径保存才消失）。
  // advisor round3 N1 + 2026-09-01 会诊 deepseek/kimi 🔴：必须传 deletions——saveManifest
  // 的条目级合并（{...fresh, ...m}）会把磁盘上仍存在的死条目从 fresh 复活回写，仅传 m
  // 等于没删。N1 当时只修了早退路径，分支 1/2/3 漏了（认领主路径上死项清理是死代码）。
  if (m.active && m.slotSessions[m.active] === mySessionId) {
    if (cleaned) saveManifest(cwd, m, deadParam())
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
    saveManifest(cwd, m, deadParam(), { setActive: true })
    return
  }

  // 2. Reclaim a slot whose FILE does not exist (never held a session). 2026-08-31 会诊 F4：
  //    原实现认领"编号最小的空闲 slot"——死主的旧 slot 文件仍在，新进程会 resume 进
  //    陌生会话（"会话乱了"实锤）且退出时覆盖它。只有文件缺失的空 slot 才允许回收。
  const allSlots = Object.keys(m.slots).filter(n => /^\d+$/.test(n)).map(Number).sort((a, b) => a - b)
  for (const slot of allSlots) {
    if (isFree(slot) && !existsSync(slotPath(cwd, slot))) {
      m.active = slot
      m.slotSessions[slot] = mySessionId
      saveManifest(cwd, m, deadParam(), { setActive: true })
      return
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
  saveManifest(cwd, m, deadParam(), { setActive: true })
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
  return true
}

/** Rename a slot: update the slot file's title + the manifest metadata (shared with VS Code).
 *  2026-09-01 会诊 glm 🟡：写回前按 mtime 门控重读——原实现读全量→改 title→整文件写回，
 *  窗口内并发方的最新保存会被旧数据覆盖（丢消息）；mtime 变了即放弃本次重命名。 */
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
  const t0 = statSync(p).mtimeMs
  data.title = title
  // 读与写之间文件被并发方改过 → 放弃（保留并发内容，重命名下次重试）
  if (statSync(p).mtimeMs !== t0) return false
  writeSessionFile(p, data)
  const m = loadManifest(cwd)
  if (m.slots[n]) {
    m.slots[n] = slotDigest(data)
    saveManifest(cwd, m)
  }
  return true
}
