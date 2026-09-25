/**
 * peer-claims.mjs — R10 多实例协作 L3 **意图认领面**（claims · TTL 租约——VS Code 镜像 ·
 * `MULTI-INSTANCE-COLLAB.md` §4.4 / D-MI17–D-MI21）。自 `peer-domains.mjs` 外提（越 300 软线
 * ——设计档 §4.4.6 落点）。
 *
 * 语义（§4.4.1–§4.4.3）：结构化写成功 ⇒ `registerClaims` 登记——同 `peers/{sessionId}.json`
 * 的 `claims` / `claimsUpdatedAt` 两字段，与足迹面 `domains` / `updatedAt` **分字段分存**
 * （落盘 = 字段级合并写、互不改写、未知字段与身份字段逐字保留）；租约 `CLAIM_TTL_MS`，同域
 * 再写续约（`claimedAt` 保持首次；覆盖去冗 = 方向性 `coversClaim` 三分支，集内无被覆盖项）；
 * 落盘 = 新目标即刻 + 续约节流 `CLAIM_RENEW_FLUSH_MS`（届内零 IO）；落盘原语 = 核 `writeSessionFile`
 * （经端壳 `./session-slots.mjs` 单源转口——.tmp + rename，rename 翻目录 mtime ⇒ 对端聚合缓存
 * 失效；含末级兜底支（§4.4.1 单一实现）；端档零本地原子写实现）；落盘门控 = 本 cwd 会话
 * manifest 在场（测试卫生——端侧既有 L3 门同法）；失败容忍 NF2（下次写重试）。释放 = 租约
 * 到期 / 属主进程死亡 / 记录被死清理——无显式释放面（D-MI19）。
 *
 * 命中 / 文案（§4.4.4）：读面按 `expiresAt > now` 过滤；命中查询由 `peer-domains.mjs` 的
 * `peerDomains(cwd).claimConflicts(targets)` 供（同一聚合扫描）；`claimAge` / `claimLeft` /
 * `claimWho` / `claimNoteText` 与核 `peer-claims.mjs` **逐字同串**（AC-IC11 跨端对拍）；
 * 去重集 `agent._peerNoted`（每（目标 × 认领属主）每 run 至多一行——`markPeerNoted` 在提示
 * 真正附加时落标记；清空落点 = `run-stages.mjs` depth-0 收尾）。
 *
 * 测试缝：`_setPeersDirForTest` / `_resetPeersDirForTest`（沙箱目录——本档归口，`peer-domains.mjs`
 * re-export）+ `_setPeerClaimsTestImpl({ nowFn })`（时钟——续约 / 过期两侧零真实等待）+
 * `_resetPeerClaimsForTest`（状态复位）。
 */
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { sessionsDir, getSessionId, END, manifestPath, writeSessionFile } from "./session-slots.mjs"

/** 认领租约 / 续约节流（§4.4.2 / §4.4.3——双端等值：与核 `peer-claims.mjs` 同值，AC-IC11 对拍）。 */
export const CLAIM_TTL_MS = 30 * 60 * 1000
export const CLAIM_RENEW_FLUSH_MS = 60 * 1000

// ─── peers 目录（测试注入缝——随认领面归口本档；`peer-domains.mjs` re-export 保既有名面）──

let peersDirOverride = null
export function _setPeersDirForTest(dir) { peersDirOverride = dir }
export function _resetPeersDirForTest() { peersDirOverride = null }

/** 默认 = sessions 目录同根下的 peers：生产 = ~/.thincoder/peers；测试注入了 sessions
 *  沙箱（_setSessionsDirForTest）时自动跟随（join(dirname(tmp/sessions), "peers")——
 *  防真实目录污染——与既有"测试不碰真实 ~/.thincoder"纪律一致）。 */
export function peersDir() {
  return peersDirOverride ?? join(dirname(sessionsDir()), "peers")
}

export function peerFilePath(sessionId) {
  return join(peersDir(), `${sessionId}.json`)
}

// ─── 时钟缝（续约 / 过期两侧确定性断言——零真实等待）──────────────────────
let claimsNowFn = null

export function _setPeerClaimsTestImpl({ nowFn = undefined } = {}) {
  const prev = claimsNowFn
  claimsNowFn = nowFn ?? null
  return prev
}

export function _resetPeerClaimsTestImpl() { claimsNowFn = null }

/** 认领面时钟（命中判据与落盘同一时钟——时钟缝注入时两侧确定一致）。 */
export function claimsNow() { return claimsNowFn ? claimsNowFn() : Date.now() }

// ─── 认领状态（模块级——与足迹面 `pendingDomains` 同款载体）──────────────
const pendingClaims = new Map() // target → { target, claimedAt, expiresAt }
let flushedClaims = new Set() // 已落盘目标（新目标即刻落盘的判据面）
let claimsFlushedAt = 0 // 上次认领落盘时刻（续约节流锚）

export function _resetPeerClaimsForTest() {
  pendingClaims.clear()
  flushedClaims = new Set()
  claimsFlushedAt = 0
}

// ─── 记录读写（单文件两面共用：合并写基线）──────────────────────

/** 读既有实例登记（字段级合并写基线）：缺失 / 损坏 / 结构非法 ⇒ `{}`（按缺失降级——损坏件
 *  不删，本次落盘覆盖）。 */
export function readRecord(file) {
  try {
    const rec = JSON.parse(readFileSync(file, "utf8"))
    return rec && typeof rec === "object" && !Array.isArray(rec) ? rec : {}
  } catch {
    return {}
  }
}

/** 聚合载荷中的认领项（结构非法 / 缺时间戳 ⇒ 按缺失降级）。 */
export function parseClaims(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const c of raw) {
    if (!c || typeof c !== "object") continue
    if (typeof c.target !== "string" || c.target.length === 0) continue
    const expiresAt = Number(c.expiresAt) || 0
    if (expiresAt <= 0) continue
    out.push({ target: c.target, claimedAt: Number(c.claimedAt) || 0, expiresAt })
  }
  return out
}

// ─── 路径谓词（覆盖去冗 / 命中判据）──────────────────────────────────────

function normPath(p) {
  const n = process.platform === "win32" ? String(p).toLowerCase() : String(p)
  return (process.platform === "win32" ? n.replace(/\//g, "\\") : n.replace(/\\/g, "/")).replace(/[\\/]+$/, "")
}

/** 方向性包含（覆盖去冗判据 §4.4.1——单方向：相等或 coarse 为 fine 的目录前缀）。 */
function coversClaim(coarse, fine) {
  const pc = normPath(coarse)
  const pf = normPath(fine)
  if (pc === pf) return true
  return pf.startsWith(pc + (process.platform === "win32" ? "\\" : "/"))
}

/** 路径重叠（§4.4.4 命中判据——与核 `pathsOverlap` 同判据：相等或互为目录包含；分隔符归一）。 */
export function claimsOverlap(a, b) {
  const pa = normPath(a)
  const pb = normPath(b)
  if (pa === pb) return true
  const sepN = process.platform === "win32" ? "\\" : "/"
  const prefix = (p, q) => p === q || p.startsWith(q + sepN)
  return prefix(pa, pb) || prefix(pb, pa)
}

// ─── 认领登记 / 落盘（§4.4.3——写成功钩子调用）──────────────────────────

/** 认领登记 + 落盘决策：三分支（覆盖 ⇒ 续约 / 被覆盖 ⇒ 替换 / 无关系 ⇒ 入集）；新目标 ⇒ 即刻
 *  整写；纯续约 ≥ CLAIM_RENEW_FLUSH_MS ⇒ 续约落盘；其余零 IO。失败容忍（工具主流程零影响）。 */
export function registerClaims(absPaths, cwd) {
  try {
    const now = claimsNow()
    for (const [t, c] of [...pendingClaims]) {
      if (c.expiresAt <= now) { pendingClaims.delete(t); flushedClaims.delete(t) } // 过期剪除（再认领视同新目标）
    }
    for (const target of absPaths ?? []) {
      if (typeof target !== "string" || !target) continue
      const covering = [...pendingClaims.values()].find((c) => coversClaim(c.target, target))
      if (covering) { covering.expiresAt = now + CLAIM_TTL_MS; continue } // 续约（claimedAt 保持首次）
      for (const [t, c] of [...pendingClaims]) {
        if (coversClaim(target, c.target)) { pendingClaims.delete(t); flushedClaims.delete(t) }
      }
      pendingClaims.set(target, { target, claimedAt: now, expiresAt: now + CLAIM_TTL_MS })
    }
    if (pendingClaims.size === 0) return
    const fresh = [...pendingClaims.keys()].some((t) => !flushedClaims.has(t))
    const due = now - claimsFlushedAt >= CLAIM_RENEW_FLUSH_MS
    if (fresh || due) flushClaims(cwd, now)
  } catch { /* NF2：登记失败不影响工具主流程 */ }
}

/** 认领落盘（字段级合并写——只改 claims / claimsUpdatedAt；落盘原语 = 核 `writeSessionFile`
 *  （经端壳转口——含末级兜底支）；过期条目剪除；门控 = 本 cwd 会话 manifest 在场）。 */
function flushClaims(cwd, now = claimsNow()) {
  try {
    if (!cwd || !existsSync(manifestPath(cwd))) return // 落盘门控（§4.4.3 测试卫生）
    const file = peerFilePath(getSessionId())
    const claims = [...pendingClaims.values()]
      .filter((c) => c.expiresAt > now)
      .map((c) => ({ target: c.target, claimedAt: c.claimedAt, expiresAt: c.expiresAt }))
      .sort((a, b) => (a.target < b.target ? -1 : a.target > b.target ? 1 : 0))
    const payload = { ...readRecord(file) }
    if (payload.sessionId === undefined) payload.sessionId = getSessionId()
    if (payload.pid === undefined) payload.pid = process.pid
    if (payload.end === undefined) payload.end = END
    if (payload.cwd === undefined) payload.cwd = cwd
    payload.claims = claims
    payload.claimsUpdatedAt = now
    writeSessionFile(file, payload)
    flushedClaims = new Set(claims.map((c) => c.target))
    claimsFlushedAt = now
  } catch { /* NF2：失败容忍——下次写重试 */ }
}

// ─── 文案 / 时长 / who（§4.4.4——与核逐字同串）────────────────────────────

/** 认领时长：`just now`（< 1 min）/ `${n} min ago`。 */
export function claimAge(claimedAt, now) {
  const min = Math.floor((now - claimedAt) / 60000)
  return min < 1 ? "just now" : `${min} min ago`
}

/** 剩余租约：`max(1, ceil((expiresAt − now) / 60000))`（分钟）。 */
export function claimLeft(expiresAt, now) {
  return Math.max(1, Math.ceil((expiresAt - now) / 60000))
}

/** `who` 串：认领属主 `${end} pid=${pid}`（无 end 则 `pid=${pid}`）；仅足迹命中的属主追加
 *  ` (recent write)`；以 ", " 连接。 */
export function claimWho(owners) {
  return owners
    .map((o) => `${o.end ? `${o.end} ` : ""}pid=${o.pid}${o.recentWrite ? " (recent write)" : ""}`)
    .join(", ")
}

/** 认领软提示文案（逐字契约 §4.4.4——与核 `peer-claims.mjs` 同串，AC-IC11 对拍）。 */
export function claimNoteText(target, who, age, left) {
  return `[peer-collab] ${target} — another live instance (${who}) holds a live intent claim on it (claimed ${age}, lease ${left} min left); concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`
}

// ─── 去重集（§4.4.4——`agent._peerNoted`；每（目标 × 认领属主）每 run 至多一行）──────────

/** 去重键（与核 `claimNoteKey` 同形）：`||`（非 `??`）兜底——端侧聚合允许空串 `sessionId`，
 *  空串不得与缺值共键（否则第二个属主被误判「已提示」）。 */
export function claimNoteKey(target, owner) {
  return `${target}\u0000${owner.sessionId || owner.pid}`
}

export function claimNoted(agent, key) {
  return agent?._peerNoted instanceof Set && agent._peerNoted.has(key)
}

export function markPeerNoted(agent, keys) {
  if (!agent || !Array.isArray(keys) || keys.length === 0) return
  const set = agent._peerNoted instanceof Set ? agent._peerNoted : (agent._peerNoted = new Set())
  for (const k of keys) set.add(k)
}

/** 去重集清空（落点 = `run-stages.mjs` depth-0 收尾）。 */
export function clearPeerNoted(agent) {
  if (agent?._peerNoted instanceof Set) agent._peerNoted.clear()
}
