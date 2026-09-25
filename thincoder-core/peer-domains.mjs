/**
 * peer-domains.mjs — R10 多实例协作 L3 文件写域登记 + 冲突检测（MULTI-INSTANCE-COLLAB
 * §2a.5——评审修正 #8：独立文件，防 300 行超限）。
 *
 * 登记存储（D-L3a）：~/.thincoder/peers/{sessionId}.json——每实例单文件、单写者（本
 * 进程——end marker 同型模式）；内容 {sessionId, pid, end, cwd, domains[绝对路径],
 * updatedAt} + 意图认领面 claims / claimsUpdatedAt（§4.4.1——两字段属 `peer-claims.mjs`，
 * 本档只做字段级合并写）。写点 = 回合级：写工具钩子累积"本回合实际写过的文件"（D-L3b
 * 同一钩子——检测+记录一次完成）→ 回合结束 flush 整写一次（finalizeAgentTurn）；本回合
 * 无写入则不写（文件按自身 updatedAt 自然过期——hot 5 分钟窗口语义不被空回合提前清掉）。
 *
 * 意图认领面接线（§4.4 / D-MI17–D-MI21）：认领登记 / 落盘 / 命中判据 / 文案住 `peer-claims.mjs`
 * ——本档接线 = `recordPeerWrites` 调认领登记 · `peerCollabNote` 组合认领行 · `flushPeerDomains` 首步清空去重集 + 字段级合并写 · 聚合载荷增 `claims`。
 *
 * 冲突检测（D-L3b）：结构化写工具（PEER_WRITE_TOOLS）执行前查 conflicts——命中他实例
 * hot 域 → 工具结果附软提示（决策⑥ A：不阻止）。缓存（评审修正 #2）：聚合结果按 peers
 * 目录 mtime 惰性缓存——目录未变零扫描；单次写工具调用新增开销上限 = 目录 stat 一次
 * （N3 度量）。崩溃残留：聚合时惰性清理（死 pid 文件删除——batchAlive 一次批量）；
 * 损坏文件按缺失降级（end marker NF2 同型——不删不炸，属主下次 flush 覆盖）。
 */

import { statSync, readdirSync, readFileSync, unlinkSync } from "node:fs"
import { join, resolve } from "node:path"
import { normalizeCwd, getSessionId, END, writeSessionFile } from "./session-slots.mjs"
import { batchAlive } from "./peer-instances.mjs"
import { FILE_MUTATORS, toolTouchPaths } from "./agent/helpers.mjs"
// 认领面（§4.4）归口 `peer-claims.mjs`；re-export 路径与谓词保既有 import 面（单源不复制）。
import {
  peersDir, peerFilePath, pathsOverlap, claimHits, claimNoteText, claimAge, claimLeft,
  claimWho, claimNoteKey, claimNoted, markClaimNoted, clearClaimNoted, claimsNow,
  recordPeerClaims, readPeerRecord, parseClaims,
} from "./peer-claims.mjs"

export { peersDir, peerFilePath, pathsOverlap, markClaimNoted }

/** hot 窗口：登记（回合足迹 flush）后 5 分钟内视为 hot（决策⑤ A——"刚写过"语义） */
export const HOT_WINDOW_MS = 5 * 60 * 1000

/** L3 覆盖的结构化写工具（D-L3b 清单）——既有 FILE_MUTATORS（write/edit/insert_after/
 *  hashline_edit/apply_patch/delete）∪ file_ops。insert_after/hashline_edit 亦为结构化
 *  写工具（同一文件写入面），file_ops 在 FILE_MUTATORS 之外故显式并入。 */
export const PEER_WRITE_TOOLS = new Set([...FILE_MUTATORS, "file_ops"])

// 模块级测试注入缝（default null = 生产实现；测试注入 + finally 恢复）
let _testAliveFn = null
let _testStatFn = null

/** 注入聚合判活实现（批量判活计数/去真实 exec——T-L3b 死清理用例可用真死 pid 亦可注入）+
 *  目录 stat 实现（N-MI7 成本断言——「目录 stat ≤ 1 / 缓存命中零扫描」，AC-IC10 计数面）。 */
export function _setPeerDomainsTestImpl({ aliveFn = undefined, statFn = undefined } = {}) {
  const prev = _testAliveFn
  _testAliveFn = aliveFn ?? null
  _testStatFn = statFn ?? null
  peersDirCache = null // 注入即环境变更——目录缓存失效（测试间不串）
  return prev
}

export function _resetPeerDomainsTestImpl() {
  _testAliveFn = null
  _testStatFn = null
  peersDirCache = null
}

// peers 目录 mtime 惰性缓存（评审修正 #2）——单全局项（缓存键含目录路径：沙箱换目录即
// 自然失效，`_setPeersDirForTest` 自足）
let peersDirCache = null // { dir, mtimeMs, peers: [...] }

function statDirMtimeMs(dir) {
  try {
    return (_testStatFn ?? statSync)(dir).mtimeMs
  } catch {
    return null // 目录缺失
  }
}

/** 目标路径解析（#327 单源谓词 `toolTouchPaths`——`docs/core/design/TOOLS.md` §6.17：钩子裁决 /
 *  file_ops 无钩子 ⇒ source/dest 双算；其余单参兜底）。相对路径按 cwd 解析为绝对
 *  路径（resolve：绝对入参原样保留）。解析失败/畸形入参跳过（零目标 = 无检测无登记）。 */
export function peerWriteTargets(tool, args, cwd) {
  const raw = tool?.name === "file_ops" && !tool?.touchedPaths
    ? [args?.source, args?.dest] // file_ops 无钩子：源 + 目标双算
    : toolTouchPaths(tool, args) // 其余：单源谓词（恒数组 · 恒零抛——原裸抛面收口）
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

/** 扫描 peers 目录：解析每文件 + 一次批量判活全部 pid + 死登记惰性清理（unlink——崩溃残留）；
 *  损坏文件按缺失降级（不删——属主下次 flush 覆盖）。返回活登记
 *  [{ sessionId, pid, end, cwd, domains, updatedAt, claims, claimsUpdatedAt }]（认领面同载荷）。 */
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
        && typeof rec.cwd === "string"
        && (Array.isArray(rec.domains) || Array.isArray(rec.claims))) { // 认领面先落盘的记录（尚无 domains）同样可解析
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
      domains: (rec.domains ?? []).filter((d) => typeof d === "string"),
      updatedAt: Number(rec.updatedAt) || 0,
      // 认领面（§4.4.4——同一聚合扫描供两面；旧记录无 claims ⇒ 按缺失降级）
      claims: parseClaims(rec.claims),
      claimsUpdatedAt: Number(rec.claimsUpdatedAt) || 0,
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
  if (peersDirCache && peersDirCache.dir === dir && peersDirCache.mtimeMs === mtime) return peersDirCache.peers
  const peers = scanPeersDir()
  if (peers === null) {
    peersDirCache = null // 探测失败——不缓存空聚合（下轮调用重试探测——失败 ≠ 无登记）
    return []
  }
  // 死清理删文件会改目录 mtime——以清理后的 mtime 缓存（下次 stat 命中即不重扫）
  peersDirCache = { dir, mtimeMs: statDirMtimeMs(dir) ?? mtime, peers }
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
  const hits = []
  for (const target of targets) {
    const by = footHitsFor(peers, target, now)
    if (by.length > 0) hits.push({ target, by: by.map((p) => ({ end: p.end, pid: p.pid, sessionId: p.sessionId })) })
  }
  return hits
}

/** 足迹命中（D-L3b 判据单源——`conflicts` 与认领面同源同载荷，零二次扫描）。 */
function footHitsFor(peers, target, now) {
  return peers.filter((p) => p.domains.length > 0 && now - p.updatedAt <= HOT_WINDOW_MS
    && p.domains.some((d) => pathsOverlap(target, d)))
}

/**
 * dispatch 写工具钩子预检（§4.4.4——一次聚合扫描供两面）：认领命中（未过期）⇒ 出认领行并
 * **抑制该目标足迹行**；仅足迹命中 ⇒ 既有足迹文案逐字零变；去重 = 同一（目标 × 认领属主）
 * 每 run 至多一行。返回 `{ text, keys }`（`keys` = 本次新提示的去重键——调用方在**提示真正
 * 附加**时落标记，写失败路径不消耗额度；无提示 / 降级 ⇒ null）。一次目录 stat。
 */
export function peerCollabNote(agent, tool, args) {
  try {
    const targets = peerWriteTargets(tool, args, agent.cwd)
    if (targets.length === 0) return null
    const peers = peerDomains(agent.cwd)
    if (peers.length === 0) return null
    const now = Date.now() // 足迹面时钟（hot 窗口——D-MI5 语义零变）
    const cnow = claimsNow() // 认领面时钟（与落盘同源——时钟缝注入侧确定一致）
    const lines = []
    const keys = []
    for (const target of targets) {
      const claims = claimHits(peers, target, cnow)
      const foot = footHitsFor(peers, target, now)
      const fresh = claims.filter((o) => !claimNoted(agent, claimNoteKey(target, o)))
      if (fresh.length > 0) {
        // 认领行：`who` = 新提示的认领属主 + 仅足迹命中的属主（` (recent write)` 后缀）
        const footOnly = foot.filter((p) => !claims.some((c) => c.sessionId === p.sessionId))
        const who = claimWho([
          ...fresh.map((o) => ({ end: o.end, pid: o.pid })),
          ...footOnly.map((p) => ({ end: p.end, pid: p.pid, recentWrite: true })),
        ])
        // 代表 = 集内最早认领（multi-owner 时 `age` / `left` 的确定性取样）
        const rep = fresh.reduce((a, b) => (a.claimedAt <= b.claimedAt ? a : b))
        lines.push(claimNoteText(target, who, claimAge(rep.claimedAt, cnow), claimLeft(rep.expiresAt, cnow)))
        for (const o of fresh) keys.push(claimNoteKey(target, o))
      } else if (claims.length === 0 && foot.length > 0) {
        const who = foot.map((p) => (p.end ? `${p.end} pid=${p.pid}` : `pid=${p.pid}`)).join(", ")
        lines.push(`[peer-collab] ${target} — another live instance (${who}) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`)
      }
      // claims.length > 0 && fresh.length === 0 ⇒ 该目标本轮已提示：抑制足迹行、不出行
    }
    if (lines.length === 0) return null
    return { text: lines.join("\n"), keys }
  } catch {
    return null // 感知失败绝不打扰工具执行
  }
}

/** 记录本回合写足迹（D-L3a 累积——D-L3b 同一钩子执行后调用；仅成功写计入"实际写过"）+
 *  意图认领登记（§4.4.3——写成功即登记：新目标即刻落盘 / 续约节流；载体 agent._peerWritten）。 */
export function recordPeerWrites(agent, tool, args) {
  try {
    const targets = peerWriteTargets(tool, args, agent.cwd)
    if (targets.length === 0) return
    agent._peerWritten ??= new Set()
    for (const t of targets) agent._peerWritten.add(t)
    recordPeerClaims(agent, targets) // 认领面：登记 + 落盘决策（§4.4.3——零新手工动作）
  } catch {
    /* 记录失败不影响工具结果 */
  }
}

/**
 * 回合末登记 flush（D-L3a——finalizeAgentTurn 调用）：本回合足迹整写一次本实例文件
 * （单写者；.tmp+rename 原子——writeSessionFile）。**字段级合并写**（§4.4.1）：只改足迹面
 * `domains` / `updatedAt`——认领字段与未知字段逐字保留。首步清空认领去重集（§4.4.4——先于
 * 「无写入即返回」早退：去重集不随无写回合泄漏）。本回合无写入 → 不写（hot 窗口不被空回合
 * 提前清掉）；写失败容忍（NF2）；成功 flush 后清空回合集合。不抛（回合收尾零风险）。
 */
export function flushPeerDomains(agent) {
  clearClaimNoted(agent) // §4.4.4 去重集清空（不抛——纯内存操作）
  try {
    const set = agent._peerWritten
    if (!set || set.size === 0) return
    const sessionId = getSessionId()
    const file = peerFilePath(sessionId)
    const base = readPeerRecord(file) // 认领字段 / 未知字段逐字保留（字段级合并写）
    writeSessionFile(file, {
      ...base,
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
