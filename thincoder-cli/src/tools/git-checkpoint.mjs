/**
 * git-checkpoint.mjs — git 工具 checkpoint action 子系统（CHECKPOINT.md F2/F6）。
 * git.mjs 的 checkpoint case 委托到这里：list/create/rewind/cat/versions + F6 懒清理 +
 * F2/D7 提示行 + 文件树格式化。CLI 与 VS Code 两端同构（镜像，修改须两端同批）。
 */
import { runGit } from "./shared.mjs"
import { escapeXml } from "../agent/helpers.mjs"
import {
  createCheckpoint,
  listCheckpoints,
  rewind,
  listFileVersions,
  catFile,
  isGitRepo,
  deleteCheckpointsForCwd,
} from "../git/checkpoint.mjs"

/** F6 lazy fallback (CHECKPOINT.md D3): an EXTERNAL git commit (via bash / IDE — not the git
 *  tool) leaves this cwd's checkpoints as pre-commit state. Compare HEAD commit time
 *  (epoch SECONDS from %ct) against the newest snapshot's meta.time (ms): `%ct × 1000` aligns
 *  both to ms. HEAD newer → every snapshot predates the commit → clear all. All-or-nothing:
 *  any snapshot NEWER than HEAD (e.g. a manual create after the external commit) skips the
 *  whole clear. Best-effort — never blocks the checkpoint op. */
export async function lazyClearIfCommitted(cwd) {
  try {
    const cps = await listCheckpoints(cwd)
    if (cps.length === 0) return
    const headSec = runGit(cwd, ["log", "-1", "--format=%ct"])
    const headMs = Number.parseInt(headSec, 10) * 1000
    if (!Number.isFinite(headMs) || headMs <= 0) return
    const newest = cps[0] // listCheckpoints returns newest → oldest
    if (headMs > newest.time) await deleteCheckpointsForCwd(cwd)
  } catch {
    // best-effort (NF7 philosophy) — a lazy-clear failure must not break list/create
  }
}

/** checkpoint case 主入口（git 工具 checkpoint action 的全部子动作）。 */
export async function executeCheckpointAction(args, ctx) {
  const { checkpointAction: sub, checkpointId: id, path } = args
  if (!isGitRepo(ctx.cwd)) throw new Error("Not a git repository — checkpoints unavailable")

  if (!sub) return "checkpoint: missing checkpointAction — use: list | create | rewind | cat | versions"

  // F6 lazy fallback (list/create entry): an EXTERNAL git commit (HEAD time newer
  // than the newest snapshot) means every snapshot predates a safety baseline —
  // clear them. All-or-nothing: if any snapshot is newer than HEAD, skip entirely.
  if (sub === "list" || sub === "create") await lazyClearIfCommitted(ctx.cwd)

  if (sub === "create") {
    const cp = await createCheckpoint(ctx.cwd)
    return `Checkpoint ${cp.id} created (${cp.files} file(s): ${cp.tracked.length} tracked, ${cp.untracked.length} untracked)`
  }
  if (sub === "versions") {
    if (!path) throw new Error("path is required for versions — the file whose history you want")
    const versions = await listFileVersions(ctx.cwd, path)
    if (versions.length === 0) return `No snapshot copies of "${path}" found (it was never part of an auto/protection snapshot).`
    return (
      `Historical versions of "${path}" (${versions.length}, newest first):\n` +
      versions.map((v) =>
        `  ${v.snapshotId}  ${new Date(v.time).toISOString()}  ${v.size}B  sha:${v.sha}  (${v.source})` +
        (v.sha === versions[versions.indexOf(v) - 1]?.sha ? "  ← same content as previous" : "")
      ).join("\n") +
      `\nRestore a version: checkpointAction=rewind checkpointId=<snapshotId> path="${path}"`
    )
  }
  if (sub === "rewind") {
    if (!id) throw new Error("checkpointId is required for rewind — use checkpointAction=list to see snapshot ids")
    if (!path) throw new Error("path is required for rewind — full restore is disabled (as dangerous as `git checkout -- .`). Restore files individually. Use checkpointAction=versions path=<file> to list a file's historical versions.")
    const s = await rewind(ctx.cwd, id, { path })
    return `Restored "${path}" (${s.type}) from checkpoint ${id}.\n(The pre-restore state was snapshotted first — you can restore again to go back.)`
  }
  if (sub === "cat") {
    if (!id) throw new Error("checkpointId is required for cat — use checkpointAction=list to see snapshot ids")
    if (!path) throw new Error("path is required for cat — specify which file to read")
    return await catFile(ctx.cwd, id, path)
  }
  if (sub === "list") {
    const cps = await listCheckpoints(ctx.cwd)
    if (cps.length === 0) return "(no checkpoints yet)"

    // Specific id: show the file tree within that snapshot
    if (id) {
      const cp = cps.find((c) => c.id === id)
      if (!cp) throw new Error(`checkpoint ${id} not found`)
      return formatFileTree(cp)
    }

    // Overview: list of all snapshots (file names are XML-escaped: they are
    // untrusted input that flows back into the model's context). F2/D7: fixed
    // hint line at the tail — the recovery entry for a snapshot after an accident.
    return cps.map((c) => {
      const parts = [`${c.id}  ${new Date(c.time).toISOString()}`]
      if (c.tracked.length) parts.push(`${c.tracked.length} tracked: ${c.tracked.map(escapeXml).join(", ")}`)
      if (c.untracked.length) parts.push(`${c.untracked.length} untracked: ${c.untracked.map(escapeXml).join(", ")}`)
      return parts.join("  ")
    }).join("\n") + "\n(意外丢弃改动？checkpointAction=rewind 可恢复操作前状态)"
  }
  throw new Error(`Unknown checkpoint action: ${sub}. Use: list | create | rewind | cat | versions`)
}

/** Format a checkpoint's file list as a directory tree (directories first, indented display) */
function formatFileTree(cp) {
  // File names are XML-escaped: untrusted input that flows back into the model's context
  const all = [
    ...(cp.tracked ?? []).map((f) => ({ path: escapeXml(f), type: "" })),
    ...(cp.untracked ?? []).map((f) => ({ path: escapeXml(f), type: " (untracked)" })),
  ]
  if (all.length === 0) return "(empty checkpoint)"

  all.sort((a, b) => a.path.localeCompare(b.path))

  const tree = new Map()
  for (const { path, type } of all) {
    const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "."
    if (!tree.has(dir)) tree.set(dir, [])
    tree.get(dir).push({ name: path.slice(dir === "." ? 0 : dir.length + 1), type })
  }

  const lines = []
  const dirs = [...tree.keys()].sort()
  for (const dir of dirs) {
    if (dir !== "." && !lines.includes(dir + "/")) {
      const parts = dir.split("/")
      for (let i = 1; i <= parts.length; i++) {
        const prefix = parts.slice(0, i).join("/") + "/"
        if (!lines.includes(prefix)) lines.push(prefix)
      }
    }
  }
  for (const dir of dirs) {
    if (dir !== ".") {
      for (const { name, type } of tree.get(dir)) {
        lines.push(`  ${dir}/${name}${type}`)
      }
    }
  }
  for (const { name, type } of tree.get(".") ?? []) {
    lines.push(name + type)
  }

  return lines.join("\n")
}
