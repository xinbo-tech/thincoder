/**
 * peer-domains.mjs — R10 多实例协作 L3 文件写域登记 + 冲突检测（MULTI-INSTANCE-COLLAB
 * §2a.5——评审修正 #8：独立文件，防 300 行超限）。
 *
 * 登记存储（D-L3a）：~/.thincoder/peers/{sessionId}.json——每实例单文件、单写者（本
 * 进程——end marker 同型模式）；内容 {sessionId, pid, end, cwd, domains[绝对路径],
 * updatedAt}。写点 = 回合级：写工具钩子累积"本回合实际写过的文件"（D-L3b 同一钩子——
 * 检测+记录一次完成）→ 回合结束 flush 整写一次（finalizeAgentTurn）；本回合无写入则
 * 不写（文件按自身 updatedAt 自然过期——hot 5 分钟窗口语义不被空回合提前清掉）。
 *
 * 冲突检测（D-L3b）：结构化写工具（PEER_WRITE_TOOLS）执行前查 conflicts——命中他实例
 * hot 域 → 工具结果附软提示（决策⑥ A：不阻止）。缓存（评审修正 #2）：聚合结果按 peers
 * 目录 mtime 惰性缓存——目录未变零扫描；单次写工具调用新增开销上限 = 目录 stat 一次
 * （N3 度量）。崩溃残留：聚合时惰性清理（死 pid 文件删除——batchAlive 一次批量）；
 * 损坏文件按缺失降级（end marker NF2 同型——不删不炸，属主下次 flush 覆盖）。
 */

import { statSync, readdirSync, readFileSync, unlinkSync } from "node:fs"
import { join, resolve, sep } from "node:path"
import { configDir } from "./config.mjs"
import { normalizeCwd, getSessionId, END, writeSessionFile } from "./session-slots.mjs"
import { batchAlive } from "./peer-instances.mjs"
import { FILE_MUTATORS } from "./agent/helpers.mjs"

/** hot 窗口：登记（回合足迹 flush）后 5 分钟内视为 hot（决策⑤ A——"刚写过"语义） */
export const HOT_WINDOW_MS = 5 * 60 * 1000

/** L3 覆盖的结构化写工具（D-L3b 清单）——既有 FILE_MUTATORS（write/edit/insert_after/
 *  hashline_edit/apply_patch/delete）∪ file_ops。insert_after/hashline_edit 亦为结构化
 *  写工具（同一文件写入面），file_ops 在 FILE_MUTATORS 之外故显式并入。 */
export const PEER_WRITE_TOOLS = new Set([...FILE_MUTATORS, "file_ops"])

export function peersDir() {
  return join(configDir, "peers")
}

export function peerFilePath(sessionId) {
  return join(peersDir(), `${sessionId}.json`)
}

// 模块级测试注入缝（default null = 生产实现；测试注入 + finally 恢复）
let _testAliveFn = null

/** 注入聚合判活实现（批量判活计数/去真实 exec——T-L3b 死清理用例可用真死 pid 亦可注入）。 */
export function _setPeerDomainsTestImpl({ aliveFn = undefined } = {}) {
  const prev = _testAliveFn
  _testAliveFn = aliveFn ?? null
  peersDirCache = null // 注入即环境变更——目录缓存失效（测试间不串）
  return prev
}

export function _resetPeerDomainsTestImpl() {
  _testAliveFn = null
  peersDirCache = null
}

// peers 目录 mtime 惰性缓存（评审修正 #2）——单全局项（peers 目录全局唯一）
let peersDirCache = null // { mtimeMs, peers: [...] }

function statDirMtimeMs(dir) {
  try {
    return statSync(dir).mtimeMs
  } catch {
    return null // 目录缺失
  }
}

/** 目标路径解析（工具 touchedPaths 优先——apply_patch/edit-batch 多文件；file_ops 无
 *  touchedPaths——source/dest 双算；其余 path 单参兜底）。相对路径按 cwd 解析为绝对
 *  路径（resolve：绝对入参原样保留）。解析失败/畸形入参跳过（零目标 = 无检测无登记）。 */
export function peerWriteTargets(tool, args, cwd) {
  const raw = tool?.touchedPaths
    ? tool.touchedPaths(args ?? {})
    : tool?.name === "file_ops"
      ? [args?.source, args?.dest]
      : [args?.path]
  const out = []
  for (const p of raw) {
    if (typeof p !== "string" || p.length === 0) continue
    try {
      out.push(resolve(cwd, p))
    } catch {
      /* 畸形路径跳过——检测/登记尽力而为 */
    }
  }
  return out
}

/** 路径重叠：a 与 b 相等或互为目录包含（file_ops 目录级操作/delete 整目录语义——
 *  区分大小写按平台（Windows 文件系统不区分）；分隔符归一（resolve 产物为原生分隔符，
 *  入参可能混用 / 与 \）。 */
export function pathsOverlap(a, b) {
  const norm = (p) => {
    const n = process.platform === "win32" ? p.toLowerCase() : p
    return (process.platform === "win32" ? n.replace(/\//g, "\\") : n.replace(/\\/g, "/")).replace(/[\\/]+$/, "")
  }
  const pa = norm(a)
  const pb = norm(b)
  if (pa === pb) return true
  const sepN = process.platform === "win32" ? "\\" : "/"
  const prefix = (p, q) => p === q || p.startsWith(q + sepN)
  return prefix(pa, pb) || prefix(pb, pa)
}

/** 扫描 peers 目录：解析每文件 + 一次批量判活全部 pid + 死登记惰性清理（unlink——
 *  崩溃残留）；损坏文件按缺失降级（不删——属主下次 flush 覆盖）。返回活登记
 *  [{ sessionId, pid, end, cwd, domains, updatedAt }]。目录缺失/不可读 → []。 */
function scanPeersDir() {
  let files = []
  try {
    files = readdirSync(peersDir(), { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".json"))
      .map((e) => join(peersDir(), e.name))
  } catch {
    return [] // 目录缺失（从未 flush）→ 无登记
  }
  const parsed = []
  for (const file of files) {
    try {
      const rec = JSON.parse(readFileSync(file, "utf8"))
      if (rec && typeof rec === "object" && typeof rec.sessionId === "string" && rec.sessionId.length > 0
        && Number.isInteger(Number(rec.pid)) && Number(rec.pid) > 0
        && typeof rec.cwd === "string" && Array.isArray(rec.domains)) {
        parsed.push({ file, rec })
      }
      // 结构非法 = 损坏 → 按缺失降级（不删——NF2 同型）
    } catch {
      /* 解析失败同损坏 */
    }
  }
  if (parsed.length === 0) return []
  const aliveFn = _testAliveFn ?? batchAlive
  const alive = aliveFn([...new Set(parsed.map((p) => Number(p.rec.pid)))])
  // 判活探测失败（batchAlive → null）≠ 死：不得据此执行死清理（unlink 是破坏性副作用）
  // ——返回 null 信号：调用方不缓存空聚合（下轮调用重试探测）
  if (!(alive instanceof Set)) return null
  const live = []
  for (const { file, rec } of parsed) {
    if (!alive.has(Number(rec.pid))) {
      try {
        // 死登记惰性清理（崩溃残留——聚合时一次批量判活顺带删除）
        unlinkSync(file)
      } catch { /* unlink 失败不影响聚合（下次再试） */ }
      continue
    }
    live.push({
      sessionId: rec.sessionId,
      pid: Number(rec.pid),
      end: typeof rec.end === "string" ? rec.end : undefined,
      cwd: rec.cwd,
      domains: rec.domains.filter((d) => typeof d === "string"),
      updatedAt: Number(rec.updatedAt) || 0,
    })
  }
  return live
}

/** peers 目录 mtime 惰性缓存聚合（评审修正 #2——目录未变不重扫）。返回当前目录下全部
 *  活登记（含他 cwd 实例——死清理跨 cwd 一次批量；cwd 过滤在 peerDomains）。 */
function cachedScan() {
  const dir = peersDir()
  const mtime = statDirMtimeMs(dir)
  if (mtime == null) {
    peersDirCache = null
    return []
  }
  if (peersDirCache && peersDirCache.mtimeMs === mtime) return peersDirCache.peers
  const peers = scanPeersDir()
  if (peers === null) {
    peersDirCache = null // 探测失败——不缓存空聚合（下轮调用重试探测——失败 ≠ 无登记）
    return []
  }
  // 死清理删文件会改目录 mtime——以清理后的 mtime 缓存（下次 stat 命中即不重扫）
  peersDirCache = { mtimeMs: statDirMtimeMs(dir) ?? mtime, peers }
  return peers
}

/**
 * 聚合（D-L3a）：本 cwd（normalizeCwd 同构比较）的其他活实例登记（self 排除——
 *  sessionId === getSessionId()）。返回 [{ sessionId, pid, end, cwd, domains, updatedAt }]。
 * 纯只读；缓存命中 = 目录 stat 一次（N3）。
 */
export function peerDomains(cwd) {
  const normCwd = normalizeCwd(cwd)
  const myId = getSessionId()
  return cachedScan().filter((p) => p.sessionId !== myId && normalizeCwd(p.cwd) === normCwd)
}

/**
 * 冲突检测（D-L3b——写前查询）：targets（绝对路径）命中他实例 hot 域（updatedAt 在
 * HOT_WINDOW_MS 内且域含 target/互为包含）→ 返回 [{ target, by: [{end, pid, sessionId}] }]。
 * 无冲突/无目标 → []。纯只读、不抛（内部全降级——失败按零冲突）。
 */
export function conflicts(cwd, targets, { now = Date.now() } = {}) {
  if (!Array.isArray(targets) || targets.length === 0) return []
  let peers = []
  try {
    peers = peerDomains(cwd)
  } catch {
    return []
  }
  const hot = peers.filter((p) => p.domains.length > 0 && now - p.updatedAt <= HOT_WINDOW_MS)
  if (hot.length === 0) return []
  const hits = []
  for (const target of targets) {
    const by = hot.filter((p) => p.domains.some((d) => pathsOverlap(target, d)))
    if (by.length > 0) hits.push({ target, by: by.map((p) => ({ end: p.end, pid: p.pid, sessionId: p.sessionId })) })
  }
  return hits
}

/** dispatch 写工具钩子预检：命中他实例 hot 域 → 软提示文案（null = 无冲突/无目标/
 *  降级——调用方零附加）。一次目录 stat（缓存命中零扫描——N3 度量）。 */
export function peerCollabNote(cwd, tool, args) {
  try {
    const targets = peerWriteTargets(tool, args, cwd)
    if (targets.length === 0) return null
    const hits = conflicts(cwd, targets)
    if (hits.length === 0) return null
    return hits.map((h) => {
      const who = h.by.map((p) => (p.end ? `${p.end} pid=${p.pid}` : `pid=${p.pid}`)).join(", ")
      return `[peer-collab] ${h.target} — another live instance (${who}) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`
    }).join("\n")
  } catch {
    return null // 感知失败绝不打扰工具执行
  }
}

/** 记录本回合写足迹（D-L3a 累积——D-L3b 同一钩子执行后调用；仅成功写计入"实际写过"）。
 *  agent._peerWritten: Set<绝对路径>（回合级——finalizeAgentTurn flush 时整写并清空）。 */
export function recordPeerWrites(agent, tool, args) {
  try {
    const targets = peerWriteTargets(tool, args, agent.cwd)
    if (targets.length === 0) return
    agent._peerWritten ??= new Set()
    for (const t of targets) agent._peerWritten.add(t)
  } catch {
    /* 记录失败不影响工具结果 */
  }
}

/**
 * 回合末登记 flush（D-L3a——finalizeAgentTurn 调用）：本回合足迹整写一次本实例文件
 * （单写者；.tmp+rename 原子——writeSessionFile）。本回合无写入 → 不写（文件按自身
 * updatedAt 自然过期——hot 窗口不被空回合提前清掉；低频 N3）。写失败容忍（NF2——end
 * marker 同型）；成功 flush 后清空回合集合。不抛（调用方回合收尾零风险）。
 */
export function flushPeerDomains(agent) {
  try {
    const set = agent._peerWritten
    if (!set || set.size === 0) return
    const sessionId = getSessionId()
    writeSessionFile(peerFilePath(sessionId), {
      sessionId,
      pid: process.pid,
      end: END,
      cwd: normalizeCwd(agent.cwd),
      domains: [...set],
      updatedAt: Date.now(),
    })
    set.clear()
  } catch {
    /* NF2：失败容忍——下次 flush 重写 */
  }
}
