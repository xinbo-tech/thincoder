/**
 * peer-domains.mjs — R10 L3 文件写域登记 + 冲突检测（MULTI-INSTANCE-COLLAB.md D-L3a/b——
 * VS Code 镜像）。
 *
 * 登记存储：`~/.thincoder/peers/{sessionId}.json`——每实例单文件（end marker 单写者模式）：
 * 内容 { sessionId, pid, end, cwd, domains: [绝对路径], updatedAt } + 意图认领面
 * `claims` / `claimsUpdatedAt`（§4.4.1）；两面**字段级合并写**（各写各的字段，未知字段与
 * 另一面字段逐字保留）。写点 = 回合级（registerDomains 累积 + flushDomains 回合末整写一次
 * ——落盘原语 = 核 `writeSessionFile`（经端壳 `./session-slots.mjs` 单源转口），rename 翻目录
 * mtime → 目录 mtime 惰性缓存生效）；无写入回合不 flush（hot 窗口自然老化）。
 *
 * 意图认领面（§4.4 / D-MI17–D-MI21——端侧自持复本）：认领 = 结构化写成功即登记（新目标
 * 即刻落盘 / 续约节流 CLAIM_RENEW_FLUSH_MS；租约 CLAIM_TTL_MS，同域再写续约）；命中 =
 * 写前预检（与足迹面同点同聚合）目标 ∩ 他实例未过期认领 ⇒ 认领级软提示（逐字锚，与核
 * `peer-claims.mjs` 同串——跨端对拍）；去重集 = `agent._peerNoted`（每（目标 × 属主）每
 * run 一行——`markPeerNoted` 在提示附加时落标记；清空落点 = `run-stages.mjs` depth-0 收尾）；
 * 混合命中合成 = 认领行逐 target + 足迹行逐 target（过滤已覆盖 target——零双报）。
 *
 * 聚合（peerDomains(cwd).conflicts(targets)）：扫描目录中他活实例文件 → 聚合按 peers
 * 目录 mtime 惰性缓存（评审修正 #2——缓存命中零扫描）；崩溃残留惰性清理（读到死 pid
 * 文件 → 删——batchAlive 一次批量）；损坏文件按缺失降级不删（end marker NF2 同型）；
 * 5 分钟 hot 窗口（决策⑤ A：写后登记 + hot——updatedAt 在窗口内的登记才算活域）。
 *
 * 冲突 = 软提示不阻止（决策⑥ A——D-L3b 工具结果附注，接线在 execute-tools.mjs 钩子）。
 *
 * 测试缝：_setPeersDirForTest/_resetPeersDirForTest + _resetPeerDomainsForTest（清缓存）。
 * 默认目录跟随 sessionsDir() 的沙箱注入（同根——生产 = ~/.thincoder/peers；会话测试
 * 注入 sessions 时 peers 自动进沙箱，防真实目录污染）。判活/端探测共享
 * peer-instances.mjs 的探针缝（batchAlive）。
 */

import { readdirSync, readFileSync, statSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import { getSessionId, END, normalizeCwd, writeSessionFile } from "./session-slots.mjs"
import { batchAlive } from "./peer-instances.mjs"
// 认领面（§4.4）归口 `peer-claims.mjs`（越 300 软线外提——设计档 §4.4.6 落点）；本档 re-export
// 路径缝与认领 API，保既有 import 名面（消费方零改）；落盘原语 = 核 `writeSessionFile`（经端壳
// `./session-slots.mjs` 转口——端档零本地原子写实现，§4.4.1 单一实现）。
import {
  peersDir, peerFilePath, readRecord, parseClaims, claimsNow, claimsOverlap,
  claimNoted, claimWho, claimAge, claimLeft, claimNoteText, claimNoteKey, _resetPeerClaimsForTest,
} from "./peer-claims.mjs"

export {
  peersDir, peerFilePath, _setPeersDirForTest, _resetPeersDirForTest, CLAIM_TTL_MS, CLAIM_RENEW_FLUSH_MS,
  claimAge, claimLeft, claimWho, claimNoteText, claimNoteKey, markPeerNoted, clearPeerNoted, registerClaims, claimsOverlap,
} from "./peer-claims.mjs"

/** hot 窗口（决策⑤ A——写后登记 + 5 分钟视为 hot） */
export const PEER_DOMAIN_HOT_MS = 5 * 60 * 1000

// ─── 回合累积（写工具钩子记录——execute-tools.mjs 接线）────────
const pendingDomains = new Set() // 本实例本回合实际写过的绝对路径

export function _resetPeerDomainsForTest() {
  pendingDomains.clear()
  _resetPeerClaimsForTest() // 认领状态随复位（用例间不串）
  aggCache = { dm: null, peers: [] }
}

/** 记录本回合写过的文件（D-L3a 累积机制——模块内存集合；回合末 flush 整写一次） */
export function registerDomains(absPaths) {
  for (const p of absPaths) {
    if (typeof p === "string" && p) pendingDomains.add(p)
  }
}

/** 回合末整写本实例登记文件（合并写——认领字段与未知字段逐字保留）。
 *  无写入回合跳过（文件不刷新——5 分钟 hot 窗口自然老化——registration 反映真实写足迹）。
 *  落盘原语 = 核 `writeSessionFile`（经端壳转口——含末级兜底支）。
 *  NF2：写失败容忍（不影响回合主流程）。 */
export function flushDomains(cwd) {
  if (pendingDomains.size === 0) return
  const file = peerFilePath(getSessionId())
  const payload = {
    ...readRecord(file),
    sessionId: getSessionId(),
    pid: process.pid,
    end: END,
    cwd,
    domains: [...pendingDomains].sort(),
    updatedAt: Date.now(),
  }
  try {
    writeSessionFile(file, payload)
    pendingDomains.clear()
  } catch { /* NF2：登记失败不影响回合 */ }
}

// ─── 聚合（目录 mtime+size 惰性缓存 + 惰性死清理）────────────────

let aggCache = { dm: null, peers: [] } // { dm: {mtimeMs,size}|null, peers: 活实例登记 }

/** 目录 stat 元组（mtimeMs + size 双键——同 tick 快写 mtime 实测可同（本仓
 *  config/checklist 同批实证）——size 兜底建/删/清理；同名单 rename 覆盖净条目数不变——
 *  该残留窗口为回合末 flush 人类时间尺度，可接受）。 */
function dirStat(dir) {
  try {
    const s = statSync(dir)
    return { mtimeMs: s.mtimeMs, size: s.size }
  } catch { return null }
}

function normalizeForCompare(p) {
  return process.platform === "win32" ? p.toLowerCase() : p
}

/** 扫描 + 聚合其他活实例的登记（含惰性死清理）。返回
 *  [{ sessionId, pid, end, domains, updatedAt }]——不含本实例、不含死 pid、损坏按缺失降级。 */
function aggregate() {
  const dir = peersDir()
  const dm = dirStat(dir)
  if (aggCache.dm !== null && dm !== null && aggCache.dm.mtimeMs === dm.mtimeMs && aggCache.dm.size === dm.size) return aggCache.peers
  let peers = []
  if (dm !== null) {
    const selfSid = getSessionId()
    let files = []
    try { files = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== ".tmp") } catch { files = [] }
    const parsed = []
    for (const f of files) {
      const sid = f.slice(0, -5)
      if (!sid || sid === selfSid) continue // 本实例登记不参与冲突（self 排除）
      let e
      try { e = JSON.parse(readFileSync(join(dir, f), "utf8")) } catch { continue } // 损坏按缺失降级（不删——NF2）
      // 认领面先落盘的记录（尚无 domains）同样可解析；两字段皆无 ⇒ 结构非法按缺失
      if (!e || typeof e !== "object" || (!Array.isArray(e.domains) && !Array.isArray(e.claims))) continue
      const pid = Number.isInteger(e.pid) ? e.pid : parseInt(String(e.sessionId ?? "").split("-")[0])
      if (!Number.isInteger(pid) || pid <= 0) continue
      parsed.push(e)
    }
    if (parsed.length > 0) {
      const alive = batchAlive(parsed.map((p) => p.pid)) // 一次批量判活
      for (const e of parsed) {
        if (alive.has(e.pid)) {
          peers.push({
            sessionId: e.sessionId ?? "", pid: e.pid, end: typeof e.end === "string" ? e.end : null,
            cwd: typeof e.cwd === "string" ? e.cwd : "",
            domains: Array.isArray(e.domains) ? e.domains : [], updatedAt: Number(e.updatedAt) || 0,
            claims: parseClaims(e.claims), // 认领面（§4.4.4——同一聚合供两面；旧记录无 claims 按缺失）
          })
        } else {
          try { unlinkSync(join(dir, `${e.sessionId}.json`)) } catch { /* 清理失败容忍 */ } // 崩溃残留惰性清理
        }
      }
    }
  }
  aggCache = { dm, peers }
  return peers
}

// ─── 冲突查询（D-L3b——软提示数据源）────────────────────────

/**
 * peerDomains(cwd) → { conflicts(targets), claimConflicts(targets) }——**一次聚合**（同一扫描供两面
 * ——§4.4.4 零二次扫描；每次调用目录 stat 一次）。
 * conflicts(targets)：targets 命中他活实例 5 分钟 hot 登记域 → 返回 [{ file, pid, end, sessionId }]
 * （足迹面保持端侧既有 cwd 无关形态——D-MI5 零改）。
 * claimConflicts(targets)：targets ∩ 他实例（**同 cwd** · self 排除——§4.4.4 判据）**未过期认领**
 * （`claimsOverlap` 同核判据）→ 返回 [{ file, pid, end, sessionId, claimedAt, expiresAt }]。
 * 纯读（N3——不写任何东西）。
 */
export function peerDomains(cwd) {
  let peers = null // 一次聚合快照（两查共用——stat / 扫描各一次）
  const snapshot = () => (peers ??= aggregate())
  return {
    conflicts(targets) {
      const list = (Array.isArray(targets) ? targets : []).filter((t) => typeof t === "string" && t)
      if (list.length === 0) return []
      try {
        const now = Date.now()
        const hits = []
        for (const p of snapshot()) {
          if (now - p.updatedAt > PEER_DOMAIN_HOT_MS) continue // 冷登记不提示（hot 窗口）
          const set = new Set(p.domains.map(normalizeForCompare))
          for (const t of list) {
            if (set.has(normalizeForCompare(t))) hits.push({ file: t, pid: p.pid, end: p.end, sessionId: p.sessionId })
          }
        }
        return hits
      } catch {
        return [] // 扫描失败按无冲突降级——写工具主流程永不因 L3 阻塞
      }
    },
    claimConflicts(targets) {
      const list = (Array.isArray(targets) ? targets : []).filter((t) => typeof t === "string" && t)
      if (list.length === 0) return []
      try {
        const now = claimsNow()
        const hits = []
        for (const p of snapshot()) {
          if (typeof cwd === "string" && cwd && !sameCwd(p.cwd, cwd)) continue // 同 cwd 判据（§4.4.4）
          const live = (p.claims ?? []).filter((c) => c.expiresAt > now) // 未过期判据（§4.4.2）
          if (live.length === 0) continue
          for (const t of list) {
            const hit = live.find((c) => claimsOverlap(t, c.target))
            if (hit) hits.push({ file: t, pid: p.pid, end: p.end, sessionId: p.sessionId, claimedAt: hit.claimedAt, expiresAt: hit.expiresAt })
          }
        }
        return hits
      } catch {
        return [] // 降级：零提示零抛错（工具主流程永不受认领面影响）
      }
    },
  }
}

/** 同 cwd 判据（§4.4.4——核 `peerDomains` 同款：`normalizeCwd` 比较，盘符大小写归一）。 */
function sameCwd(a, b) {
  return typeof a === "string" && typeof b === "string" && normalizeCwd(a) === normalizeCwd(b)
}

/** 足迹软提示单行（§4.3 字面规范面——逐 target 出行；与核 `peerCollabNote` 同串）。
 *  `who` = 该 target 命中属主集：`${end} pid=${pid}`（无 end 则 `pid=${pid}`），以 ", " 连接
 *  （与核同构——不去重：聚合 hit 集按属主天然唯一，逐项照列）。 */
function footNoteLine(target, hits) {
  const who = hits.map((h) => (h.end ? `${h.end} pid=${h.pid}` : `pid=${h.pid}`))
  return `[peer-collab] ${target} — another live instance (${who.join(", ")}) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`
}

/**
 * 认领 / 足迹软提示合成（§4.4.4——端侧混合命中定形）：认领命中目标各出认领行（逐字锚 · 逐
 * target；`who` = 新提示的认领属主 + 该目标仅足迹命中的属主带 ` (recent write)`）；足迹行 = 逐
 * target 一行（§4.3 字面规范面——与核同形），已被认领行覆盖的 target 不出足迹行（零双报）。
 * 去重 = 同一（目标 × 认领属主）每 run 至多一行。返回 `{ text, keys }`（`keys` = 本次新提示
 * 的去重键——调用方在**提示真正附加**时落标记）；无提示 / 降级 ⇒ null。
 * 块内多行以空行分隔（端侧既有附加形态 `\n\n`——与核逐行 `\n` 不同；单行文案逐字锚不受影响）。
 */
export function peerNotes(agent, { claimHits = [], footHits = [] } = {}) {
  try {
    const now = claimsNow()
    const lines = []
    const keys = []
    const covered = new Set()
    const byTarget = new Map()
    for (const h of claimHits) {
      covered.add(h.file)
      const list = byTarget.get(h.file) ?? []
      list.push(h)
      byTarget.set(h.file, list)
    }
    for (const [target, hits] of byTarget) {
      const fresh = hits.filter((h) => !claimNoted(agent, claimNoteKey(target, h)))
      if (fresh.length === 0) continue // 该目标本轮已提示 ⇒ 不出行（并抑制足迹行——covered 已记）
      const footOnly = footHits.filter((f) => f.file === target && !hits.some((h) => h.sessionId === f.sessionId))
      const who = claimWho([
        ...fresh.map((h) => ({ end: h.end, pid: h.pid })),
        ...footOnly.map((f) => ({ end: f.end, pid: f.pid, recentWrite: true })),
      ])
      const rep = fresh.reduce((a, b) => (a.claimedAt <= b.claimedAt ? a : b)) // 代表 = 集内最早认领
      lines.push(claimNoteText(target, who, claimAge(rep.claimedAt, now), claimLeft(rep.expiresAt, now)))
      for (const h of fresh) keys.push(claimNoteKey(target, h))
    }
    const rest = footHits.filter((f) => !covered.has(f.file))
    if (rest.length > 0) {
      const byFootTarget = new Map() // 逐 target 出行（§4.3 字面规范面——对齐核形态）
      for (const f of rest) {
        const list = byFootTarget.get(f.file) ?? []
        list.push(f)
        byFootTarget.set(f.file, list)
      }
      for (const [target, hits] of byFootTarget) lines.push(footNoteLine(target, hits))
    }
    if (lines.length === 0) return null
    return { text: lines.join("\n\n"), keys }
  } catch {
    return null // 感知失败绝不打扰工具执行
  }
}
