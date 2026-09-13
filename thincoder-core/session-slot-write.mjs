/**
 * session-slot-write.mjs — 会话槽「元数据开关」写面（Parnas 边界：开关写决策组——
 * autoApprove / planMode / engineering / advisor guard，外加全新槽默认记录与落盘单点）。
 *
 * 归属：会话数据面（同上位 `session.mjs` / `session-slots.mjs` / `session-store.mjs`）。
 * 本档 = **（cwd, slot）形态**的槽写入面（读-改-写）；另一形态 = `session.mjs` 的
 * `saveSession(agent)` 全量面。两者共用同一批原语（`loadSlotFile` / `writeSessionFile` /
 * `slotDigest`）与同一 F2 轮转判据（见下），差别只在入参来源。
 *
 * 轮转判据（与 `session-guard.mjs` 的 agent 面守卫**同判据集**）：磁盘槽文件
 * version>2 / 异 cwd / 会话不符（sessionStart 不一致）→ 先轮转 `.bak` 保留现场再写；
 * 解析失败（损坏 / 半写）→ 改名 `.corrupted` 保留。本面额外收**同会话并发追加**
 * （磁盘 history 比本次待写长 = 窗口内有外部写入 ⇒ 对方现场先轮转 `.bak` 保下，
 * **本快照随后落位**——不静默覆盖，但档位以本次快照为准，较新内容只在 `.bak` 里）。
 * 检查按 mtime 缓存：
 * 文件自上次检查/自写未变就跳过全量解析。
 *
 * token 台账字段（`engDesignTokens`）的**槽 I/O 面**不在本档——单源 = `token-ttl.mjs`
 * （settle 落盘 / 门禁回读 / 链终清理三面齐备）；本档只承载其**保存面合并规则**
 * （`mergeEngTokensForSave`——空态保留 + 并集 + 新铸者胜，纯函数）。槽标题写面同样不在
 * 本档——单源 = `session-rename.mjs` 的 `renameSlot`（同 `{ok, reason}` 契约 + mtime 门控）。
 */

import { existsSync, readFileSync, renameSync, statSync } from "node:fs"

import { getSessionId, loadManifest, saveManifest, slotDigest, slotPath, writeSessionFile } from "./session-slots.mjs"
import { loadSlotFile } from "./session.mjs"
// token 形态单源（格式校验 + 到期时刻）——本档的保存面合并规则复用同一判定。
import { tokenExpiryMs } from "./token-ttl.mjs"

/** mtime 缓存（键 = 槽文件路径 → 上次所见 mtimeMs）：同一槽连写时跳过重复解析。
 *  测试复位缝（与 `_setSessionsDirForTest` 同款）：缓存为进程级单例，用例间需可复位
 *  ——否则同一路径在同一 mtime tick 内被直接重写时，轮转判定会因「mtime 未变」早退。 */
const slotMtimeCache = new Map()
export function _resetSlotMtimeCacheForTest() { slotMtimeCache.clear() }

/** Fresh slot data default：全新空槽的规范结构（`newSession` 写盘面同形）。 */
export function newSlotData(cwd) {
  return {
    version: 2, cwd, title: "", updatedAt: Date.now(),
    history: [], contextHistory: [], tasks: [],
    planMode: false, goal: null, autoApprove: false, advisor: null,
    pendingReminders: [], sessionStart: null,
  }
}

/**
 * 轮转判定（写前）：命中即把现场改名 `.bak-<ts>` 保留，返回该路径或 null。
 * 判据四项——version>2（新版文件，非本版可写）/ 异 cwd（别的项目文件误落本路径）/
 * sessionStart 不符（另一会话现场）/ 磁盘 history 更长（同会话并发追加——对方现场先轮转保下，
 * 本快照随后落位）。
 */
function rotateIfForeign(p, slot, data) {
  try {
    if (!existsSync(p)) return null
    const st = statSync(p)
    if (st.mtimeMs === slotMtimeCache.get(p)) return null // 自上次检查/自写未变——磁盘态已知
    const disk = JSON.parse(readFileSync(p, "utf8"))
    slotMtimeCache.set(p, st.mtimeMs)
    const diskIsNewer = typeof disk?.version === "number" && disk.version > 2
    const diskForeign = typeof disk?.cwd === "string" && typeof data?.cwd === "string" &&
      disk.cwd.toLowerCase() !== data.cwd.toLowerCase()
    const diskStart = disk?.sessionStart ?? null
    const myStart = data?.sessionStart ?? null
    const diskLonger = Array.isArray(disk?.history) && Array.isArray(data?.history) &&
      disk.history.length > data.history.length
    if (!(diskIsNewer || diskForeign || (diskStart && diskStart !== myStart) || diskLonger)) return null
    const bak = `${p}.bak-${Date.now()}`
    renameSync(p, bak)
    console.error(`[session] slot ${slot} holds ${diskIsNewer ? `a newer-version file (v${disk.version})` : diskForeign ? `a foreign-cwd file (${disk.cwd})` : diskLonger ? `a longer record (${disk.history.length} > ${data.history.length} messages — concurrent append)` : `another session (start ${diskStart}, ours ${myStart})`} — preserved as ${bak}`)
    return bak
  } catch (e) {
    // 文件存在但不可读（损坏 / 半写）：改名保留现场，不覆盖
    let preserved = false
    if (existsSync(p)) {
      try { renameSync(p, `${p}.corrupted`); preserved = true } catch {}
    }
    // 排障面：区分「现场不可读」与「轮转失败」——静默会让半写/占用现场无从定位。
    console.error(`[session] slot ${slot}: pre-write rotation check failed (${e?.message ?? e}) —${preserved ? " preserved as .corrupted" : " the scene could NOT be preserved"}`)
    return null
  }
}

/**
 * 槽落盘单点（读-改-写面共用）：轮转判定 → 写槽文件 → 回写 manifest 摘要。
 * 返回轮转出的 `.bak` 路径或 null（调用方按需透出）。
 */
export function saveSlotData(cwd, slot, data) {
  data.updatedAt = Date.now()
  const p = slotPath(cwd, slot)
  const rotated = rotateIfForeign(p, slot, data)
  writeSessionFile(p, data)
  slotMtimeCache.set(p, (() => { try { return statSync(p).mtimeMs } catch { return 0 } })())
  try {
    const m = loadManifest(cwd)
    m.slots[slot] = slotDigest(data)
    saveManifest(cwd, m)
  } catch { /* 摘要失败非致命——数据已安全，元数据下次 listSlots 惰性恢复 */ }
  return rotated
}

/**
 * 读槽供开关写入。返回已解析槽数据；当槽**尚无数据文件**但本进程已认领该槽
 * （认领先行、首保存落盘前）→ 返回全新默认记录。其余失败（version>2 / 异 cwd /
 * 损坏 / 未知槽）返回 null——保持「未识别的槽 ⇒ 开关写返回 false」的契约。
 */
function loadSlotForWrite(cwd, slot) {
  const data = loadSlotFile(cwd, slot)
  if (data || !slot) return data
  const m = loadManifest(cwd)
  if (m.slotSessions?.[slot] !== getSessionId()) return null
  if (existsSync(slotPath(cwd, slot))) return null // 文件已在但不可读 → 不覆盖
  return newSlotData(cwd)
}

/** 开关写单点：读 → 改一枚开关 → 落盘；槽不可读 ⇒ false（写未发生）。 */
function writeFlag(cwd, slot, mutate) {
  const data = loadSlotForWrite(cwd, slot)
  if (!data) return false
  mutate(data)
  saveSlotData(cwd, slot, data)
  return true
}

/** 会话级 autoApprove 开关（槽字段，非配置文件）。槽不可读 ⇒ false。 */
export function setSlotAutoApprove(cwd, slot, value) {
  return writeFlag(cwd, slot, (d) => { d.autoApprove = value })
}

/** 会话级 planMode 开关（与 autoApprove 同层）。 */
export function setSlotPlanMode(cwd, slot, value) {
  return writeFlag(cwd, slot, (d) => { d.planMode = value })
}

/** 会话级 engineering 开关——槽是会话真值来源（配置文件只作初始默认 / 跨端镜像）。 */
export function setSlotEngineering(cwd, slot, value) {
  return writeFlag(cwd, slot, (d) => { d.engineering = value })
}

/** advisor 守卫开关（`advisor: { guard }`——空值升格为对象）。 */
export function setSlotAdvisorGuard(cwd, slot, value) {
  return writeFlag(cwd, slot, (d) => {
    d.advisor = { ...(typeof d.advisor === "object" && d.advisor !== null ? d.advisor : {}), guard: value }
  })
}

/**
 * 保存面 token 台账合并规则（纯函数——槽 = 权威台账，保存时不得把内存快照的缺席
 * 当成删除）：
 *  - `incoming === undefined`（调用方未携带该字段）⇒ 保留槽值（空态不触发清理）；
 *  - incoming 空值 ⇒ 槽有值则保留槽、槽也空 ⇒ null（写 null = 清字段）；
 *  - 两端都有 ⇒ 并集：槽独有项保留（consume 已对称删盘，不复活）；同 key 以**新铸者胜**
 *    （token 尾 `:expiresAt` 大者 = 后铸）；平手 / 无法解析 ⇒ 保留槽值（fail-safe）。
 * 槽 I/O 面（读/写/清）在 `token-ttl.mjs`——本函数只产出「应写什么」。
 */
export function mergeEngTokensForSave(incoming, existing) {
  if (incoming === undefined) return existing ?? null
  const hasNew = incoming && typeof incoming === "object" && !Array.isArray(incoming) && Object.keys(incoming).length > 0
  const slotHas = existing && typeof existing === "object" && !Array.isArray(existing) && Object.keys(existing).length > 0
  if (!hasNew) return slotHas ? existing : null
  if (!slotHas) return incoming
  const expiry = (t) => tokenExpiryMs(t) ?? -Infinity
  const out = { ...existing }
  for (const [key, tok] of Object.entries(incoming)) {
    if (!(key in out) || expiry(tok) > expiry(out[key])) out[key] = tok
  }
  return out
}
