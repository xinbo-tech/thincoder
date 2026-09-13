/**
 * peer-domains.mjs — R10 L3 文件写域登记 + 冲突检测（MULTI-INSTANCE-COLLAB.md D-L3a/b——
 * VS Code 镜像）。
 *
 * 登记存储：`~/.thincoder/peers/{sessionId}.json`——每实例单文件（end marker 单写者模式）：
 * 内容 { sessionId, pid, end, cwd, domains: [绝对路径], updatedAt }。写点 = 回合级
 * （registerDomains 累积 + flushDomains 回合末整写一次——tmp+rename 原子写——rename 翻
 * 目录 mtime → 目录 mtime 惰性缓存生效）；无写入回合不 flush（hot 窗口自然老化）。
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

import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync, renameSync, unlinkSync } from "node:fs"
import { homedir } from "node:os"
import { join, dirname } from "node:path"
import { sessionsDir, getSessionId, END } from "./session-slots.mjs"
import { batchAlive } from "./peer-instances.mjs"

/** hot 窗口（决策⑤ A——写后登记 + 5 分钟视为 hot） */
export const PEER_DOMAIN_HOT_MS = 5 * 60 * 1000

// ─── peers 目录（测试注入缝）──────────────────────────────
let peersDirOverride = null
export function _setPeersDirForTest(dir) { peersDirOverride = dir }
export function _resetPeersDirForTest() { peersDirOverride = null }

/** 默认 = sessions 目录同根下的 peers：生产 = ~/.thincoder/peers；测试注入了 sessions
 *  沙箱（_setSessionsDirForTest）时自动跟随（join(dirname(tmp/sessions), "peers")——
 *  防真实目录污染——与既有"测试不碰真实 ~/.thincoder"纪律一致）。 */
export function peersDir() {
  return peersDirOverride ?? join(dirname(sessionsDir()), "peers")
}

// ─── 回合累积（写工具钩子记录——execute-tools.mjs 接线）────────
const pendingDomains = new Set() // 本实例本回合实际写过的绝对路径

export function _resetPeerDomainsForTest() {
  pendingDomains.clear()
  aggCache = { dm: null, peers: [] }
}

/** 记录本回合写过的文件（D-L3a 累积机制——模块内存集合；回合末 flush 整写一次） */
export function registerDomains(absPaths) {
  for (const p of absPaths) {
    if (typeof p === "string" && p) pendingDomains.add(p)
  }
}

/** 回合末整写本实例登记文件（tmp+rename 原子——rename 翻目录 mtime → 缓存失效）。
 *  无写入回合跳过（文件不刷新——5 分钟 hot 窗口自然老化——registration 反映真实写足迹）。
 *  NF2：写失败容忍（不影响回合主流程）。 */
export function flushDomains(cwd) {
  if (pendingDomains.size === 0) return
  const payload = {
    sessionId: getSessionId(),
    pid: process.pid,
    end: END,
    cwd,
    domains: [...pendingDomains].sort(),
    updatedAt: Date.now(),
  }
  try {
    const dir = peersDir()
    mkdirSync(dir, { recursive: true })
    const file = join(dir, `${getSessionId()}.json`)
    const tmp = `${file}.tmp`
    writeFileSync(tmp, JSON.stringify(payload), "utf8")
    try { renameSync(tmp, file) } catch { unlinkSync(file) /* 旧文件占位——再试一次 */; renameSync(tmp, file) }
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
      if (!e || typeof e !== "object" || !Array.isArray(e.domains)) continue
      const pid = Number.isInteger(e.pid) ? e.pid : parseInt(String(e.sessionId ?? "").split("-")[0])
      if (!Number.isInteger(pid) || pid <= 0) continue
      parsed.push(e)
    }
    if (parsed.length > 0) {
      const alive = batchAlive(parsed.map((p) => p.pid)) // 一次批量判活
      for (const e of parsed) {
        if (alive.has(e.pid)) {
          peers.push({ sessionId: e.sessionId ?? "", pid: e.pid, end: typeof e.end === "string" ? e.end : null, domains: e.domains, updatedAt: Number(e.updatedAt) || 0 })
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
 * peerDomains(cwd) → { conflicts(targets) }——cwd 仅作 parity 签名占位（peers 目录与
 * 登记均全局：域是绝对路径，冲突判定 = 绝对路径归一化比对——跨 cwd 登记天然覆盖）。
 * conflicts(targets)：targets 命中他活实例 5 分钟 hot 登记域 → 返回
 * [{ file, pid, end, sessionId }]（无命中 = []）。纯读（N3——不写任何东西）。
 */
export function peerDomains(cwd) {
  return {
    conflicts(targets) {
      const list = (Array.isArray(targets) ? targets : []).filter((t) => typeof t === "string" && t)
      if (list.length === 0) return []
      try {
        const now = Date.now()
        const hits = []
        for (const p of aggregate()) {
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
  }
}
