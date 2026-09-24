/**
 * peer-claims.mjs — R10 多实例协作 L3 **意图认领面**（claims · TTL 租约——MULTI-INSTANCE-COLLAB
 * §4.4 / D-MI17–D-MI21）。
 *
 * 语义（§4.4.1–§4.4.3）：结构化写工具执行成功 ⇒ 本实例登记认领——同 `peers/{sessionId}.json`
 * 加 `claims` / `claimsUpdatedAt` 两字段，与足迹面 `domains` / `updatedAt` **分字段分存**
 * （落盘 = 字段级合并写，互不改写，未知字段逐字保留）；租约 `CLAIM_TTL_MS`，同域再写续约
 * （`claimedAt` 保持首次；覆盖去冗 = 方向性 `covers` 三分支，集内无被覆盖项）；落盘 = 新目标
 * 即刻 + 续约节流 `CLAIM_RENEW_FLUSH_MS`（届内零 IO）；原子写经 `writeSessionFile`
 * （.tmp + rename——rename 翻 peers 目录 mtime ⇒ 对端聚合缓存失效，认领回合内可见）。
 * 释放 = 租约到期 / 属主进程死亡 / 记录被死清理——**无显式释放面**（D-MI19）。
 *
 * 读面（§4.4.4）：按 `expiresAt > now` 过滤 + 本实例落盘时剪除（不 unlink——过期不是崩溃
 * 残留）；属主死亡 ⇒ 整条记录不可见并随既有死清理删除。命中 = 目标 ∩ 他实例未过期认领
 * （`claimHits`——调用面 = 既有写前预检同点、同一聚合扫描）；软提示文案 `claimNoteText`
 * （双端逐字一致；`age` / `left` / `who` 规则同 §4.4.4）；去重集 `agent._peerNoted`
 * （每（目标 × 认领属主）每 run 至多一行——`markClaimNoted` 在提示真正附加时落标记）。
 *
 * 本档另归口 peers 目录路径与路径谓词（`pathsOverlap` / `covers`——`peer-domains.mjs`
 * re-export 保既有 import 面）。测试缝：`_setPeersDirForTest` / `_resetPeersDirForTest`
 * （沙箱）+ `_setPeerClaimsTestImpl({ nowFn })`（时钟——续约 / 过期两侧零真实等待）。
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { configDir } from "./config.mjs"
import { normalizeCwd, getSessionId, END, manifestPath, writeSessionFile } from "./session-slots.mjs"

/** 认领租约（§4.4.2）：30 min——同目标再写 / 目标被已有认领覆盖 ⇒ `expiresAt = now + 本值`。 */
export const CLAIM_TTL_MS = 30 * 60 * 1000

/** 续约落盘节流（§4.4.3）：新目标即刻落盘；纯续约距上次落盘 ≥ 本窗才落盘，其余零 IO。 */
export const CLAIM_RENEW_FLUSH_MS = 60 * 1000

// ─── peers 目录（测试注入缝——形态先例 = 端侧同名缝）────────────────────────
let peersDirOverride = null
export function _setPeersDirForTest(dir) { peersDirOverride = dir }
export function _resetPeersDirForTest() { peersDirOverride = null }

export function peersDir() {
  return peersDirOverride ?? join(configDir, "peers")
}

export function peerFilePath(sessionId) {
  return join(peersDir(), `${sessionId}.json`)
}

// ─── 时钟缝（续约 / 过期两侧确定性断言——零真实等待）──────────────────────
let _testNowFn = null

export function _setPeerClaimsTestImpl({ nowFn = undefined } = {}) {
  const prev = _testNowFn
  _testNowFn = nowFn ?? null
  return prev
}

export function _resetPeerClaimsTestImpl() {
  _testNowFn = null
}

/** 认领面时钟（读面命中判据与落盘同一时钟——时钟缝注入时两侧确定一致；缺省 `Date.now`）。 */
export function claimsNow() {
  return _testNowFn ? _testNowFn() : Date.now()
}

// ─── 路径谓词（自 peer-domains.mjs 归口——单源）────────────────────────────

function normPath(p) {
  const n = process.platform === "win32" ? String(p).toLowerCase() : String(p)
  return (process.platform === "win32" ? n.replace(/\//g, "\\") : n.replace(/\\/g, "/")).replace(/[\\/]+$/, "")
}

/** 路径重叠：a 与 b 相等或互为目录包含（file_ops 目录级操作 / delete 整目录语义——既有
 *  语义原样：区分大小写按平台；分隔符归一）。本地规范式 = `normPath` 单源。 */
export function pathsOverlap(a, b) {
  const pa = normPath(a)
  const pb = normPath(b)
  if (pa === pb) return true
  const sepN = process.platform === "win32" ? "\\" : "/"
  const prefix = (p, q) => p === q || p.startsWith(q + sepN)
  return prefix(pa, pb) || prefix(pb, pa)
}

/** 方向性包含（覆盖去冗判据 §4.4.1）：`coarse` 覆盖 `fine` = 相等或 coarse 为 fine 的目录
 *  **前缀**（单方向——对称谓词 `pathsOverlap` 不作包含判据）。归一 / 大小写同款。 */
export function covers(coarse, fine) {
  const pc = normPath(coarse)
  const pf = normPath(fine)
  if (pc === pf) return true
  return pf.startsWith(pc + (process.platform === "win32" ? "\\" : "/"))
}

// ─── 认领登记 / 落盘（写成功钩子——§4.4.3）────────────────────────────────

/** 认领状态载体 = `agent._peerClaims`（Map<target, {target, claimedAt, expiresAt}>，与足迹面
 *  `agent._peerWritten` 同型）；落盘账 = `agent._peerClaimsFlushed`（Set<target>）+
 *  `agent._peerClaimsFlushedAt`（上次落盘时刻——续约节流锚）。 */

function pendingClaims(agent) {
  return agent._peerClaims ?? (agent._peerClaims = new Map())
}

/** 过期剪除（§4.4.2——读面过滤之外的落盘面剪除）：租约已结束的认领不参与覆盖判定，
 *  也不占据续约对象；剪除同时清落盘账（该目标在盘上已失效 ⇒ 再认领视同新目标）。 */
function pruneClaims(agent, now) {
  const set = pendingClaims(agent)
  const flushed = agent._peerClaimsFlushed
  for (const [target, claim] of [...set]) {
    if (claim.expiresAt > now) continue
    set.delete(target)
    flushed?.delete(target)
  }
}

/**
 * 认领登记 + 落盘决策（§4.4.3——写工具成功钩子调用；零新手工动作）。三分支（§4.4.1）：
 * 已有认领 `covers` 新目标 ⇒ 只续约；新目标 `covers` 已有认领项 ⇒ 替换（被覆盖项出集）；
 * 无包含关系 ⇒ 新目标入集。落盘：含未落盘目标 ⇒ 即刻整写；否则距上次落盘 ≥
 * `CLAIM_RENEW_FLUSH_MS` ⇒ 续约落盘；其余零 IO。失败容忍（NF2——下次写重试）。
 */
export function recordPeerClaims(agent, targets) {
  try {
    const now = claimsNow()
    pruneClaims(agent, now)
    const set = pendingClaims(agent)
    for (const target of targets) {
      const covering = [...set.values()].find((c) => covers(c.target, target))
      if (covering) {
        covering.expiresAt = now + CLAIM_TTL_MS // 续约（claimedAt 保持首次）
        continue
      }
      for (const [t, c] of [...set]) {
        if (covers(target, c.target)) {
          set.delete(t)
          agent._peerClaimsFlushed?.delete(t)
        }
      }
      set.set(target, { target, claimedAt: now, expiresAt: now + CLAIM_TTL_MS })
    }
    if (set.size === 0) return
    const flushed = agent._peerClaimsFlushed ?? (agent._peerClaimsFlushed = new Set())
    const hasUnflushed = [...set.keys()].some((t) => !flushed.has(t))
    const due = now - (agent._peerClaimsFlushedAt ?? 0) >= CLAIM_RENEW_FLUSH_MS
    if (hasUnflushed || due) flushPeerClaims(agent, now)
  } catch {
    /* 登记失败不影响工具结果（工具主流程永不受认领面影响） */
  }
}

/** 读既有实例文件（字段级合并写基线）：缺失 / 损坏 / 结构非法 ⇒ `{}`（按缺失降级——
 *  损坏件不删，本次落盘覆盖）。 */
export function readPeerRecord(file) {
  try {
    const rec = JSON.parse(readFileSync(file, "utf8"))
    return rec && typeof rec === "object" && !Array.isArray(rec) ? rec : {}
  } catch {
    return {}
  }
}

/** 认领落盘（§4.4.1 字段级合并写）：只改 `claims` / `claimsUpdatedAt`——其余字段（含足迹面
 *  `domains` / `updatedAt`、身份字段、未知字段）逐字保留；身份字段仅在缺失时补齐（本面
 *  不写他面字段）。原子写 = `writeSessionFile`（.tmp + rename）。落盘门控 = 本 cwd 会话
 *  manifest 在场（测试卫生——无头 / 未绑定会话不向真实 peers 目录写任何东西；端侧既有
 *  L3 门同法）。过期条目在落盘时剪除。 */
export function flushPeerClaims(agent, now = claimsNow()) {
  try {
    const cwd = agent?.cwd
    if (!cwd || !existsSync(manifestPath(cwd))) return
    const sessionId = getSessionId()
    const base = readPeerRecord(peerFilePath(sessionId))
    const claims = [...pendingClaims(agent).values()]
      .filter((c) => c.expiresAt > now)
      .map((c) => ({ target: c.target, claimedAt: c.claimedAt, expiresAt: c.expiresAt }))
      .sort((a, b) => (a.target < b.target ? -1 : a.target > b.target ? 1 : 0))
    const payload = { ...base }
    if (payload.sessionId === undefined) payload.sessionId = sessionId
    if (payload.pid === undefined) payload.pid = process.pid
    if (payload.end === undefined) payload.end = END
    if (payload.cwd === undefined) payload.cwd = normalizeCwd(cwd)
    payload.claims = claims
    payload.claimsUpdatedAt = now
    writeSessionFile(peerFilePath(sessionId), payload)
    agent._peerClaimsFlushed = new Set(claims.map((c) => c.target))
    agent._peerClaimsFlushedAt = now
  } catch {
    /* NF2：失败容忍——下次写重试（落盘账不推进） */
  }
}

// ─── 命中判据 / 文案 / 去重（§4.4.4）──────────────────────────────────────

/** 聚合载荷中解析出的认领项形态（`scanPeersDir` 消费——结构非法按缺失）。 */
export function parseClaims(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const c of raw) {
    if (!c || typeof c !== "object") continue
    if (typeof c.target !== "string" || c.target.length === 0) continue
    const claimedAt = Number(c.claimedAt) || 0
    const expiresAt = Number(c.expiresAt) || 0
    if (expiresAt <= 0) continue
    out.push({ target: c.target, claimedAt, expiresAt })
  }
  return out
}

/** 命中判据（§4.4.4）：`peers`（聚合载荷——同 cwd / self 已排除 / 属主已判活）中各实例的
 *  **未过期**认领 ∩ `target` ⇒ `[{end, pid, sessionId, claimedAt, expiresAt}]`（同属主同
 *  目标至多一条）。纯只读、不抛。 */
export function claimHits(peers, target, now) {
  const out = []
  for (const p of peers ?? []) {
    const hit = (p.claims ?? []).find((c) => c.expiresAt > now && pathsOverlap(target, c.target))
    if (hit) out.push({ end: p.end, pid: p.pid, sessionId: p.sessionId, claimedAt: hit.claimedAt, expiresAt: hit.expiresAt })
  }
  return out
}

/** 认领时长（§4.4.4）：`just now`（< 1 min）/ `${n} min ago`。 */
export function claimAge(claimedAt, now) {
  const min = Math.floor((now - claimedAt) / 60000)
  return min < 1 ? "just now" : `${min} min ago`
}

/** 剩余租约（§4.4.4）：`max(1, ceil((expiresAt − now) / 60000))`（分钟）。 */
export function claimLeft(expiresAt, now) {
  return Math.max(1, Math.ceil((expiresAt - now) / 60000))
}

/** `who` 串（§4.4.4 逐字规则）：认领属主 `${end} pid=${pid}`（无 end 则 `pid=${pid}`）；
 *  仅足迹命中的属主追加 ` (recent write)`；以 ", " 连接。 */
export function claimWho(owners) {
  return owners
    .map((o) => `${o.end ? `${o.end} ` : ""}pid=${o.pid}${o.recentWrite ? " (recent write)" : ""}`)
    .join(", ")
}

/** 认领软提示文案（逐字契约 §4.4.4——双端一致；禁自行解释）。 */
export function claimNoteText(target, who, age, left) {
  return `[peer-collab] ${target} — another live instance (${who}) holds a live intent claim on it (claimed ${age}, lease ${left} min left); concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`
}

/** 去重键（§4.4.4）：同一（目标 × 认领属主）每 run 至多一行——键 = `${target}\\u0000${sessionId}`。
 *  `||`（非 `??`）兜底：缺 `sessionId` 的载荷不得与空串共键（端侧聚合允许空串）。 */
export function claimNoteKey(target, owner) {
  return `${target}\u0000${owner.sessionId || owner.pid}`
}

export function claimNoted(agent, key) {
  return agent?._peerNoted instanceof Set && agent._peerNoted.has(key)
}

/** 落去重标记（调用方**在提示真正附加时**调用——写失败路径不消耗额度）。 */
export function markClaimNoted(agent, keys) {
  if (!agent || !Array.isArray(keys) || keys.length === 0) return
  const set = agent._peerNoted instanceof Set ? agent._peerNoted : (agent._peerNoted = new Set())
  for (const k of keys) set.add(k)
}

/** 去重集清空（§4.4.4——落点 = `flushPeerDomains` 首步：先于「无写入即返回」早退）。 */
export function clearClaimNoted(agent) {
  if (agent?._peerNoted instanceof Set) agent._peerNoted.clear()
}
