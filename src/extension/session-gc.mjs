/**
 * session-gc.mjs — 会话目录残留 GC + 冷 cwd 报告/删除原语（SESSION.md §12，2026-09-06，
 * 与 CLI src/session-gc.mjs 同源移植——清理语义双端一致 N3；F2 冷 cwd 的手动执行面
 * （shell 子命令）仅 CLI 提供（review #7——扩展无 shell 通道），本模块只接线自动残留
 * GC（F1）启动钩子，冷 cwd 原语与 CLI 保持同构供测试镜像）。
 *
 * F1 残留 GC（自动）：激活时对当前 cwd hash 前缀做一次轻量清理——.corrupted /
 * .unreadable / .manifest.corrupted / .bak-* 保留 30 天，孤儿 .tmp 保留 7 天
 *（mtime < now − retention 才删，等于保留期保留——older-than 边界语义）。
 * 安全（N1）：活跃槽（主文件在 + manifest slotSessions[N] 属主活）的现场一律保留；
 * manifest 主文件 / end marker / 数据主文件永不进入候选（后缀预过滤只匹配残留后缀）。
 */

import { readdirSync, readFileSync, statSync, unlinkSync, existsSync } from "node:fs"
import { join, basename } from "node:path"
import { sessionsDir, manifestPath, isProcessAlive } from "./session-slots.mjs"

/** 保留期（§12.2.2——与 CLI 同值）：损坏现场/并发轮转备份 30 天；孤儿 .tmp 7 天。 */
export const RESIDUE_RETENTION_MS = 30 * 24 * 3600 * 1000
export const ORPHAN_TMP_RETENTION_MS = 7 * 24 * 3600 * 1000
/** 冷 cwd 阈值（§12.2.4——与 CLI 同值）：manifest mtime 距今 > 90 天。 */
export const COLD_CWD_RETENTION_MS = 90 * 24 * 3600 * 1000

/** 残留分类（§12.2.2 后缀表——CLI classifyResidue 同构）：返回 { retention, slot, tmp } 或 null。 */
function classifyResidue(name, prefix) {
  if (!name.startsWith(prefix + ".")) return null
  const slotMatch = name.slice(prefix.length).match(/^\.(\d+)\./)
  const slot = slotMatch ? Number(slotMatch[1]) : null
  if (name.endsWith(".corrupted") || name.endsWith(".unreadable")) return { retention: RESIDUE_RETENTION_MS, slot, tmp: false }
  if (/\.bak-\d+$/.test(name)) return { retention: RESIDUE_RETENTION_MS, slot, tmp: false }
  if (name.endsWith(".tmp")) return { retention: ORPHAN_TMP_RETENTION_MS, slot, tmp: true }
  return null
}

/** 活跃槽集合（§12.4 T3/T12 操作定义——CLI liveSlots 同构）：主文件在 + 属主进程活。 */
function liveSlots(dir, prefix, aliveFn) {
  const active = new Set()
  try {
    const m = JSON.parse(readFileSync(join(dir, `${prefix}.manifest`), "utf8"))
    for (const [n, owner] of Object.entries(m.slotSessions ?? {})) {
      if (!/^\d+$/.test(n) || !owner) continue
      if (!existsSync(join(dir, `${prefix}.${n}`))) continue
      const pid = parseInt(String(owner).split("-")[0])
      if (pid && aliveFn(pid)) active.add(Number(n))
    }
  } catch { /* manifest 不可读 → 无活跃槽 */ }
  return active
}

/**
 * 残留 GC（§12.2.3——单 cwd 前缀，不跨 cwd 扫描；CLI gcResidue 同构）：
 * 返回 { candidates, deleted }（dryRun 时 candidates 照列、deleted 为空——只列不删）。
 * 扫描先按后缀预过滤（N4——只 stat 残留候选），再对候选做活跃槽/孤儿/保留期判定。
 */
export function gcResidue({ dir = sessionsDir(), prefix, now = Date.now(), dryRun = false, aliveFn = isProcessAlive } = {}) {
  const result = { candidates: [], deleted: [] }
  let entries
  try { entries = readdirSync(dir) } catch { return result }
  const candidates = []
  for (const name of entries) {
    const c = classifyResidue(name, prefix)
    if (c) candidates.push({ name, ...c })
  }
  if (!candidates.length) return result
  const active = liveSlots(dir, prefix, aliveFn)
  for (const c of candidates) {
    if (c.slot !== null && active.has(c.slot)) continue // N1：活跃槽现场一律保留（T3）
    const p = join(dir, c.name)
    if (c.tmp && existsSync(p.slice(0, -".tmp".length))) continue // 非孤儿 .tmp（主文件在——写中/回退候选）
    let st
    try { st = statSync(p) } catch { continue }
    if (st.mtimeMs >= now - c.retention) continue // 边界：older-than 才删，等于保留期保留（§12.4）
    result.candidates.push(c.name)
    if (!dryRun) {
      try { unlinkSync(p); result.deleted.push(c.name) } catch { /* 占用/竞态——跳过 */ }
    }
  }
  return result
}

const scheduledPrefixes = new Set()

/** 启动钩子（§12 review #8——N4）：GC 延后到扩展激活完成后空闲执行（setImmediate），
 *  不阻塞激活路径；每进程每前缀一次（Set 去重——resumeSlot 可多次进入）。
 *  前缀由 manifestPath(cwd) 导出（`${hash}.json.manifest` → `${hash}.json`）。 */
export function scheduleSessionGC(cwd) {
  let prefix
  try { prefix = basename(manifestPath(cwd)).slice(0, -".manifest".length) } catch { return }
  const key = join(sessionsDir(), prefix)
  if (scheduledPrefixes.has(key)) return
  scheduledPrefixes.add(key)
  setImmediate(() => {
    try { gcResidue({ dir: sessionsDir(), prefix }) } catch { /* 清理失败静默——不影响主流程 */ }
  })
}

/**
 * 冷 cwd 枚举原语（§12.2.4 步骤 1/2——CLI listColdCwds 同构；执行面仅 CLI `session gc`，
 *  本端保持语义同源供测试镜像）：manifest mtime > 90 天 且 无活跃数据文件。
 */
export function listColdCwds({ dir = sessionsDir(), now = Date.now(), aliveFn = isProcessAlive } = {}) {
  let entries
  try { entries = readdirSync(dir) } catch { return [] }
  const cold = []
  for (const name of entries) {
    if (!name.endsWith(".json.manifest")) continue
    const prefix = name.slice(0, -".manifest".length)
    let st
    try { st = statSync(join(dir, name)) } catch { continue }
    if (st.mtimeMs >= now - COLD_CWD_RETENTION_MS) continue
    let m
    try { m = JSON.parse(readFileSync(join(dir, name), "utf8")) } catch { continue }
    const dataFiles = entries.filter((e) => e.startsWith(prefix + ".") && /^\d+$/.test(e.slice(prefix.length + 1)))
    const hasLive = dataFiles.some((e) => {
      const owner = m.slotSessions?.[e.slice(prefix.length + 1)]
      const pid = parseInt(String(owner ?? "").split("-")[0])
      return !!(pid && aliveFn(pid))
    })
    if (hasLive) continue
    cold.push({
      hash: prefix.slice(0, -".json".length),
      prefix,
      manifestMtime: st.mtimeMs,
      dataFiles: dataFiles.length,
      files: entries.filter((e) => e.startsWith(prefix + ".")),
    })
  }
  return cold
}

/**
 * 删除指定冷 cwd 的整个前缀（§12.2.4 步骤 3——CLI deleteColdCwd 同构；TOCTOU 重校验冷态）。
 */
export function deleteColdCwd(hash, { dir = sessionsDir(), now = Date.now(), aliveFn = isProcessAlive } = {}) {
  const target = listColdCwds({ dir, now, aliveFn }).find((c) => c.hash === hash)
  if (!target) return { ok: false, reason: "not-cold", deleted: [] }
  const deleted = []
  for (const name of target.files) {
    try { unlinkSync(join(dir, name)); deleted.push(name) } catch { /* 占用/竞态——跳过 */ }
  }
  return { ok: true, deleted }
}
