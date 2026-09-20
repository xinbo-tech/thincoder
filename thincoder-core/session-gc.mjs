/**
 * session-gc.mjs — 会话目录残留 GC + 冷 cwd 报告/删除（SESSION.md §6.12，2026-09-06）。
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
 *         .json.N 死主数据+裸 v1 {hash}.json（§6.12 D-V1）+残留；删除前重校验冷态——
 *         TOCTOU 防护 T12）。
 *
 * 拆分理由（§6.12 review #1）：session-slots.mjs 已在 500 行硬限零余量，GC 是独立决策
 * （"何时清何种残留"），独立成模块；原语（sessionPath / ownerPid）自 session-slots
 * import，启动钩子（session.mjs resumeSlot 包装）只一行调用。
 *
 * F-MI7（2026-09-18）：判活 = **核探测束**（`process-probe.mjs` `probeOwnersAsync`）+ `ownerState`
 * 三态查表——本档**零逐 pid 探测**；**未知 ⇒ 保留 / 不判冷**（D-MI10 同向）；入口面异步（启动钩子
 * 延后执行，不阻塞启动路径）。死主数据文件 / 活跃槽判定与认领面同源判据。
 */

import { readdirSync, readFileSync, statSync, unlinkSync, existsSync, rmSync } from "node:fs"
import { join, dirname, basename } from "node:path"
import { configDir } from "./config.mjs"
import { sessionPath, ownerPid } from "./session-slots.mjs"
import { probeOwnersAsync, ownerState } from "./process-probe.mjs"

/** 保留期（§6.12）：损坏现场（.corrupted/.unreadable/.manifest.corrupted）与并发轮转
 *  备份（.bak-*）30 天；孤儿 .tmp 7 天（崩溃现场恢复窗口）。 */
export const RESIDUE_RETENTION_MS = 30 * 24 * 3600 * 1000
export const ORPHAN_TMP_RETENTION_MS = 7 * 24 * 3600 * 1000
/** 冷 cwd 阈值（§6.12）：manifest mtime 距今 > 90 天（保守——正常开发会频繁触碰）。 */
export const COLD_CWD_RETENTION_MS = 90 * 24 * 3600 * 1000

function sessionsDir() { return join(configDir, "sessions") }

/** 残留分类（§6.12 后缀表）：name 须以 `${prefix}.` 开头（prefix = `${hash}.json`）。
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

/** 活跃槽集合（§6.12 T3/T12 操作定义）：.json.N 主文件存在 且 manifest slotSessions[N]
 *  属主进程存活。manifest 缺失/损坏 → 空集（无活跃槽——不阻碍残留清理）。
 *  探测 = **入口一次异步束**（零逐 pid exec）；三态消费：活 ⇒ 活跃；死 ⇒ 非活跃；
 *  **未知（探测失败 / 缺行）⇒ 计为活跃**（现场保留——D-MI10 同向）。 */
async function liveSlots(dir, prefix, probeFn) {
  const active = new Set()
  let m
  try { m = JSON.parse(readFileSync(join(dir, `${prefix}.manifest`), "utf8")) } catch { return active }
  const entries = []
  for (const [n, owner] of Object.entries(m.slotSessions ?? {})) {
    if (!/^\d+$/.test(n) || !owner) continue
    if (!existsSync(join(dir, `${prefix}.${n}`))) continue
    const pid = ownerPid(owner)
    if (pid) entries.push([Number(n), pid])
  }
  if (!entries.length) return active
  const bundle = await probeFn([...new Set(entries.map(([, pid]) => pid))])
  for (const [n, pid] of entries) {
    if (ownerState(pid, bundle) !== "dead") active.add(n)
  }
  return active
}

/**
 * 残留 GC（§6.12——单 cwd 前缀，不跨 cwd 扫描）：返回 { candidates, deleted }
 * （dryRun 时 candidates 照列、deleted 为空——只列不删，N2 可预览）。
 * 扫描先按后缀预过滤（N4——只 stat 残留候选），再对候选做活跃槽/孤儿/保留期判定；
 * 无残留候选 ⇒ **零探测早退**（不发起探测束）。probeFn = 测试注入缝（缺省核异步束）。
 */
export async function gcResidue({ dir = sessionsDir(), prefix, now = Date.now(), dryRun = false, probeFn = probeOwnersAsync } = {}) {
  const result = { candidates: [], deleted: [] }
  let entries
  try { entries = readdirSync(dir) } catch { return result }
  const candidates = []
  for (const name of entries) {
    const c = classifyResidue(name, prefix)
    if (c) candidates.push({ name, ...c })
  }
  if (!candidates.length) return result
  const active = await liveSlots(dir, prefix, probeFn)
  for (const c of candidates) {
    if (c.slot !== null && active.has(c.slot)) continue // N1：活跃槽现场一律保留（T3）
    const p = join(dir, c.name)
    if (c.tmp && existsSync(p.slice(0, -".tmp".length))) continue // 非孤儿 .tmp（主文件在——写中/回退候选）
    let st
    try { st = statSync(p) } catch { continue }
    if (st.mtimeMs >= now - c.retention) continue // 边界：older-than 才删，等于保留期保留（§6.12）
    result.candidates.push(c.name)
    if (!dryRun) {
      try { unlinkSync(p); result.deleted.push(c.name) } catch { /* 占用/竞态——跳过 */ }
    }
  }
  return result
}

const scheduledPrefixes = new Set()

/** 启动钩子（§6.12 review #8——N4）：GC 延后到进程启动完成后空闲执行（setImmediate），
 *  不阻塞启动路径；每进程每前缀一次（Set 去重——resumeSlot 可多次进入）。 */
export function scheduleSessionGC(cwd) {
  let base
  try { base = sessionPath(cwd) } catch { return }
  if (scheduledPrefixes.has(base)) return
  scheduledPrefixes.add(base)
  setImmediate(() => {
    gcResidue({ dir: dirname(base), prefix: basename(base) }).catch(() => { /* 清理失败静默——不影响主流程 */ })
  })
}

/**
 * 冷 cwd 枚举（§6.12 步骤 1/2——跨 cwd 报告面，仅手动命令调用）：候选 =
 * manifest mtime 距今 > 90 天 且 无活跃数据文件（.json.N 主文件不存在或全部属死主进程）。
 * 返回 [{ hash, prefix, manifestMtime, dataFiles, files }]（files = 整前缀全部文件——
 * 含裸 v1 `{hash}.json`，§6.12 D-V1——dataFiles 仅 .json.N，v1 不参与冷态判定）。
 * 探测 = **全部候选前缀一次异步束**（两遍：先筛候选并收 pid，再一次判活 + 三态）；
 * **未知 ⇒ 非冷（保留）**——探测失败不得判冷（D-MI10 同向）。
 */
export async function listColdCwds({ dir = sessionsDir(), now = Date.now(), probeFn = probeOwnersAsync } = {}) {
  let entries
  try { entries = readdirSync(dir) } catch { return [] }
  const cands = []
  for (const name of entries) {
    if (!name.endsWith(".json.manifest")) continue // end marker（.manifest.cli/.vscode）与 .manifest.corrupted 天然排除
    const prefix = name.slice(0, -".manifest".length) // `${hash}.json`
    let st
    try { st = statSync(join(dir, name)) } catch { continue }
    if (st.mtimeMs >= now - COLD_CWD_RETENTION_MS) continue // 近期活跃（<90 天阈值——T10）
    let m
    try { m = JSON.parse(readFileSync(join(dir, name), "utf8")) } catch { continue } // 损坏 manifest 不判冷（.corrupted 归残留 GC）
    const dataFiles = entries.filter((e) => e.startsWith(prefix + ".") && /^\d+$/.test(e.slice(prefix.length + 1)))
    const owners = dataFiles.map((e) => {
      const slotName = e.slice(prefix.length + 1)
      const pid = ownerPid(m.slotSessions?.[slotName] ?? "")
      return pid || 0
    })
    cands.push({ prefix, manifestMtime: st.mtimeMs, dataFilesLen: dataFiles.length, owners })
  }
  if (!cands.length) return []
  const pids = [...new Set(cands.flatMap((c) => c.owners).filter(Boolean))]
  const bundle = await probeFn(pids) // 空清单 ⇒ 探测面零 exec 早退
  const cold = []
  for (const c of cands) {
    // 死主数据文件判定：三态——活 / 未知 ⇒ 非冷（保守保留）；无非自身属主 ⇒ 无活跃数据文件
    const hasLive = c.owners.some((pid) => pid && ownerState(pid, bundle) !== "dead")
    if (hasLive) continue // 有活跃数据文件 → 非冷（T12）；探测失败 ⇒ 未知 ⇒ 同向保留
    cold.push({
      hash: c.prefix.slice(0, -".json".length),
      prefix: c.prefix,
      manifestMtime: c.manifestMtime,
      dataFiles: c.dataFilesLen,
      files: entries.filter((e) => e.startsWith(c.prefix + ".") || e === c.prefix), // 整前缀清空含裸 v1 {hash}.json（§6.12 D-V1）
    })
  }
  return cold
}

/**
 * 删除指定冷 cwd 的整个前缀（§6.12 步骤 3——manifest+end marker+.json.N 死主数据+
 * 裸 v1 {hash}.json（§6.12 D-V1）+残留；只删 manifest 留数据文件会制造孤儿数据，整前缀清空才真正释放）。
 * 删除前重跑冷 cwd 判定（TOCTOU 防护，T12——期间变活跃则拒绝）。
 */
export async function deleteColdCwd(hash, { dir = sessionsDir(), now = Date.now(), probeFn = probeOwnersAsync } = {}) {
  const target = (await listColdCwds({ dir, now, probeFn })).find((c) => c.hash === hash)
  if (!target) return { ok: false, reason: "not-cold", deleted: [] }
  const deleted = []
  for (const name of target.files) {
    const p = join(dir, name)
    try {
      // §6.14（TUI-OOM-ROOTCAUSE）：目录项（记录存储 sidecar `{prefix}.N.d`）递归删——
      // 现 unlinkSync 对目录静默跳过（旧实现漏删 sidecar）；数据文件维持 unlink。
      if (statSync(p).isDirectory()) rmSync(p, { recursive: true, force: true })
      else unlinkSync(p)
      deleted.push(name)
    } catch { /* 占用/竞态——跳过 */ }
  }
  return { ok: true, deleted }
}

/**
 * ④ 端差段 · 手动执行面（§6.12）——仅命令行壳提供（另一形态无 shell 子命令通道）；
 * 本段**核内零消费方**（结构机检③）：核内保存实现（取一侧），命令接线属壳侧（S2）。
 *
 * `thincoder session gc` 子命令分发（§6.12 手动面——F2 执行入口仅命令行壳，
 * 另一形态无 shell 子命令通道，review #7）：
 *   --dry-run          报告当前 cwd 残留候选 + 跨 cwd 冷候选（只列不删，N2 预览）
 *   --confirm <hash>   删除指定冷 cwd 整前缀（警告 + 文件清单 + TOCTOU 重校验）
 *   --confirm --all    逐冷 cwd 同型警告删除
 * 返回进程退出码（0/1）。dir/prefix/now/out/err/probeFn 为测试注入缝（默认生产行为）。
 */
export async function runSessionGc(args, { dir = sessionsDir(), prefix = null, cwd = process.cwd(), now = Date.now(), out = console.log, err = console.error, probeFn = probeOwnersAsync } = {}) {
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
    // 当前 cwd 残留（§6.12 删除面——自动 GC 的预览）
    let p = prefix
    if (!p) { try { p = basename(sessionPath(cwd)) } catch { p = null } }
    const residue = p ? await gcResidue({ dir, prefix: p, now, dryRun: true, probeFn }) : { candidates: [] }
    out(`Residue candidates for current project (${p ?? "unknown"}): ${residue.candidates.length}`)
    for (const name of residue.candidates) out(`  ${name}`)
  }

  const cold = await listColdCwds({ dir, now, probeFn })
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
    const r = await deleteColdCwd(t.hash, { dir, now, probeFn })
    if (!r.ok) { err(`Refused: ${t.hash} is no longer cold (became active) — skipped.`) ; continue }
    out(`Deleted ${r.deleted.length} files for ${t.hash}.`)
  }
  return 0
}
