/**
 * session-gc.mjs — 会话目录残留 GC + 冷 cwd 报告/删除（SESSION.md §12，2026-09-06）。
 *
 * F1 残留 GC（自动）：进程启动时对当前 cwd hash 前缀做一次轻量清理——.corrupted /
 * .unreadable / .manifest.corrupted / .bak-* 保留 30 天，孤儿 .tmp 保留 7 天
 *（mtime < now − retention 才删，等于保留期保留——older-than 边界语义）。
 * 安全（N1）：活跃槽（主文件在 + manifest slotSessions[N] 属主活）的现场一律保留；
 * manifest 主文件 / end marker / 数据主文件永不进入候选（后缀预过滤只匹配残留后缀）。
 *
 * F2 冷 cwd（手动——12.2.4 三步，v1 不自动删 manifest）：
 *   判定：manifest mtime 距今 > 90 天 且 无任何活跃数据文件（.json.N 不存在或全部属死主）；
 *   报告：thincoder session gc --dry-run（跨 cwd 枚举，不删除）；
 *   删除：thincoder session gc --confirm <hash|--all>（整前缀清空——manifest+marker+
 *         .json.N 死主数据+裸 v1 {hash}.json（§12.7 D-V1）+残留；删除前重校验冷态——
 *         TOCTOU 防护 T12）。
 *
 * 拆分理由（§12.3 review #1）：session-slots.mjs 已在 500 行硬限零余量，GC 是独立决策
 * （"何时清何种残留"），独立成模块；原语（sessionPath/isProcessAlive）自 session-slots
 * import，启动钩子（session.mjs resumeSlot 包装）只一行调用。
 */

import { readdirSync, readFileSync, statSync, unlinkSync, existsSync, rmSync } from "node:fs"
import { join, dirname, basename } from "node:path"
import { configDir } from "./config.mjs"
import { sessionPath, isProcessAlive } from "./session-slots.mjs"

/** 保留期（§12.2.2）：损坏现场（.corrupted/.unreadable/.manifest.corrupted）与并发轮转
 *  备份（.bak-*）30 天；孤儿 .tmp 7 天（崩溃现场恢复窗口）。 */
export const RESIDUE_RETENTION_MS = 30 * 24 * 3600 * 1000
export const ORPHAN_TMP_RETENTION_MS = 7 * 24 * 3600 * 1000
/** 冷 cwd 阈值（§12.2.4）：manifest mtime 距今 > 90 天（保守——正常开发会频繁触碰）。 */
export const COLD_CWD_RETENTION_MS = 90 * 24 * 3600 * 1000

function sessionsDir() { return join(configDir, "sessions") }

/** 残留分类（§12.2.2 后缀表）：name 须以 `${prefix}.` 开头（prefix = `${hash}.json`）。
 *  返回 { retention, slot, tmp } 或 null（主文件/end marker/他前缀——不动）。
 *  slot = 关联槽号（`.N.` 段），无则 null（如 .manifest.corrupted）。 */
function classifyResidue(name, prefix) {
  if (!name.startsWith(prefix + ".")) return null
  const slotMatch = name.slice(prefix.length).match(/^\.(\d+)\./)
  const slot = slotMatch ? Number(slotMatch[1]) : null
  if (name.endsWith(".corrupted") || name.endsWith(".unreadable")) return { retention: RESIDUE_RETENTION_MS, slot, tmp: false }
  if (/\.bak-\d+$/.test(name)) return { retention: RESIDUE_RETENTION_MS, slot, tmp: false }
  if (name.endsWith(".tmp")) return { retention: ORPHAN_TMP_RETENTION_MS, slot, tmp: true }
  return null
}

/** 活跃槽集合（§12.4 T3/T12 操作定义）：.json.N 主文件存在 且 manifest slotSessions[N]
 *  属主进程存活。manifest 缺失/损坏 → 空集（无活跃槽——不阻碍残留清理）。 */
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
 * 残留 GC（§12.2.3——单 cwd 前缀，不跨 cwd 扫描）：返回 { candidates, deleted }
 * （dryRun 时 candidates 照列、deleted 为空——只列不删，N2 可预览）。
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

/** 启动钩子（§12 review #8——N4）：GC 延后到进程启动完成后空闲执行（setImmediate），
 *  不阻塞启动路径；每进程每前缀一次（Set 去重——resumeSlot 可多次进入）。 */
export function scheduleSessionGC(cwd) {
  let base
  try { base = sessionPath(cwd) } catch { return }
  if (scheduledPrefixes.has(base)) return
  scheduledPrefixes.add(base)
  setImmediate(() => {
    try { gcResidue({ dir: dirname(base), prefix: basename(base) }) } catch { /* 清理失败静默——不影响主流程 */ }
  })
}

/**
 * 冷 cwd 枚举（§12.2.4 步骤 1/2——跨 cwd 报告面，仅手动命令调用）：候选 =
 * manifest mtime 距今 > 90 天 且 无活跃数据文件（.json.N 主文件不存在或全部属死主进程）。
 * 返回 [{ hash, prefix, manifestMtime, dataFiles, files }]（files = 整前缀全部文件——
 * 含裸 v1 `{hash}.json`，§12.7 D-V1——dataFiles 仅 .json.N，v1 不参与冷态判定）。
 */
export function listColdCwds({ dir = sessionsDir(), now = Date.now(), aliveFn = isProcessAlive } = {}) {
  let entries
  try { entries = readdirSync(dir) } catch { return [] }
  const cold = []
  for (const name of entries) {
    if (!name.endsWith(".json.manifest")) continue // end marker（.manifest.cli/.vscode）与 .manifest.corrupted 天然排除
    const prefix = name.slice(0, -".manifest".length) // `${hash}.json`
    let st
    try { st = statSync(join(dir, name)) } catch { continue }
    if (st.mtimeMs >= now - COLD_CWD_RETENTION_MS) continue // 近期活跃（<90 天阈值——T10）
    let m
    try { m = JSON.parse(readFileSync(join(dir, name), "utf8")) } catch { continue } // 损坏 manifest 不判冷（.corrupted 归残留 GC）
    const dataFiles = entries.filter((e) => e.startsWith(prefix + ".") && /^\d+$/.test(e.slice(prefix.length + 1)))
    const hasLive = dataFiles.some((e) => {
      const owner = m.slotSessions?.[e.slice(prefix.length + 1)]
      const pid = parseInt(String(owner ?? "").split("-")[0])
      return !!(pid && aliveFn(pid))
    })
    if (hasLive) continue // 有活跃数据文件 → 非冷（T12）
    cold.push({
      hash: prefix.slice(0, -".json".length),
      prefix,
      manifestMtime: st.mtimeMs,
      dataFiles: dataFiles.length,
      files: entries.filter((e) => e.startsWith(prefix + ".") || e === prefix), // 整前缀清空含裸 v1 {hash}.json（§12.7 D-V1）
    })
  }
  return cold
}

/**
 * 删除指定冷 cwd 的整个前缀（§12.2.4 步骤 3——manifest+end marker+.json.N 死主数据+
 * 裸 v1 {hash}.json（§12.7 D-V1）+残留；只删 manifest 留数据文件会制造孤儿数据，整前缀清空才真正释放）。
 * 删除前重跑冷 cwd 判定（TOCTOU 防护，T12——期间变活跃则拒绝）。
 */
export function deleteColdCwd(hash, { dir = sessionsDir(), now = Date.now(), aliveFn = isProcessAlive } = {}) {
  const target = listColdCwds({ dir, now, aliveFn }).find((c) => c.hash === hash)
  if (!target) return { ok: false, reason: "not-cold", deleted: [] }
  const deleted = []
  for (const name of target.files) {
    const p = join(dir, name)
    try {
      // §14.3.8（TUI-OOM-ROOTCAUSE）：目录项（记录存储 sidecar `{prefix}.N.d`）递归删——
      // 现 unlinkSync 对目录静默跳过（旧实现漏删 sidecar）；数据文件维持 unlink。
      if (statSync(p).isDirectory()) rmSync(p, { recursive: true, force: true })
      else unlinkSync(p)
      deleted.push(name)
    } catch { /* 占用/竞态——跳过 */ }
  }
  return { ok: true, deleted }
}

/**
 * ④ 端差段 · 手动执行面（§12.2.4）——仅命令行壳提供（另一形态无 shell 子命令通道）；
 * 本段**核内零消费方**（结构机检③）：核内保存实现（取一侧），命令接线属壳侧（S2）。
 *
 * `thincoder session gc` 子命令分发（§12.2.3/12.2.4 手动面——F2 执行入口仅命令行壳，
 * 另一形态无 shell 子命令通道，review #7）：
 *   --dry-run          报告当前 cwd 残留候选 + 跨 cwd 冷候选（只列不删，N2 预览）
 *   --confirm <hash>   删除指定冷 cwd 整前缀（警告 + 文件清单 + TOCTOU 重校验）
 *   --confirm --all    逐冷 cwd 同型警告删除
 * 返回进程退出码（0/1）。dir/prefix/now/out/err/aliveFn 为测试注入缝（默认生产行为）。
 */
export function runSessionGc(args, { dir = sessionsDir(), prefix = null, cwd = process.cwd(), now = Date.now(), out = console.log, err = console.error, aliveFn = isProcessAlive } = {}) {
  const dryRun = args.includes("--dry-run")
  const confirmIdx = args.indexOf("--confirm")
  const hasConfirm = confirmIdx >= 0
  const confirmTarget = hasConfirm ? args[confirmIdx + 1] : null
  // --dry-run 与 --confirm 互斥（review 🔵#4——同给时不得静默忽略 confirm；无值 --confirm 同为用法错误）
  if (args[0] !== "gc" || (!dryRun && !hasConfirm) || (dryRun && hasConfirm) || (hasConfirm && !confirmTarget)) {
    err("Usage: thincoder session gc --dry-run | --confirm <hash> | --confirm --all")
    return 1
  }

  if (dryRun) {
    out("Session GC dry-run — no files will be deleted.")
    // 当前 cwd 残留（§12.2.3 删除面——自动 GC 的预览）
    let p = prefix
    if (!p) { try { p = basename(sessionPath(cwd)) } catch { p = null } }
    const residue = p ? gcResidue({ dir, prefix: p, now, dryRun: true, aliveFn }) : { candidates: [] }
    out(`Residue candidates for current project (${p ?? "unknown"}): ${residue.candidates.length}`)
    for (const name of residue.candidates) out(`  ${name}`)
  }

  const cold = listColdCwds({ dir, now, aliveFn })
  if (dryRun) {
    out(`Cold project candidates (manifest idle > 90 days, no live data files): ${cold.length}`)
    for (const c of cold) {
      out(`  ${c.hash}  manifest mtime ${new Date(c.manifestMtime).toISOString()}  data files ${c.dataFiles}  total files ${c.files.length}`)
    }
    if (cold.length) out('Run "thincoder session gc --confirm <hash>" (or --confirm --all) to permanently delete a cold project prefix.')
    return 0
  }

  // --confirm：删除前警告（N2 可逆——文件清单 + 永久删除提示）；deleteColdCwd 内部重校验冷态（TOCTOU）
  const targets = confirmTarget === "--all" ? cold : cold.filter((c) => c.hash === confirmTarget)
  if (!targets.length) {
    err(`Refused: ${confirmTarget} is not a cold project (active, recent, or unknown) — nothing deleted.`)
    return 1
  }
  for (const t of targets) {
    out(`WARNING: 此操作永久删除该 cwd 的全部会话历史 (hash ${t.hash}, ${t.files.length} files):`)
    for (const name of t.files) out(`  ${name}`)
    const r = deleteColdCwd(t.hash, { dir, now, aliveFn })
    if (!r.ok) { err(`Refused: ${t.hash} is no longer cold (became active) — skipped.`) ; continue }
    out(`Deleted ${r.deleted.length} files for ${t.hash}.`)
  }
  return 0
}
