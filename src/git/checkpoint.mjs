/**
 * checkpoint.mjs — workspace snapshot and rollback (v2: full-file copies)
 * Snapshot = full copies of changed tracked files + untracked file copies (respects .gitignore).
 * v1 stored only a git diff patch — rewind depended on HEAD being unchanged (a commit after the
 * snapshot made `git apply` fail and the failure recovery chain collapse). v2 copies files, so
 * rewind works regardless of later commits.
 * Only available inside git repos. Rewind creates a new snapshot first (rewind is reversible).
 * rewind supports a path parameter for per-file restore.
 */
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { configDir } from "../config.mjs"

const CWD_HASH_LEN = 12

const MAX_CHECKPOINTS = 100

/** Files larger than this are NOT copied (sqlite db, bundles…) — they are recorded as skipped. */
const MAX_FILE_BYTES = 5 * 1024 * 1024

/** meta.version 2 = full-copy snapshots; 1 = legacy patch-only snapshots */
const META_VERSION = 2

function git(cwd, args, { allowFail = false } = {}) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
  } catch (error) {
    if (allowFail) return null
    throw new Error(`git ${args.join(" ")} failed: ${error.stderr?.toString().trim() || error.message}`, { cause: error })
  }
}

/** Normalize cwd for hashing: uppercase the Windows drive letter so the VS Code
 *  extension's uri.fsPath (lowercased) produces the SAME cwdHash12 as the CLI's
 *  process.cwd() — cross-end snapshot sharing (CHECKPOINT.md F5/T7) depends on this
 *  contract. Same normalization as session storage (session-slots.mjs normalizeCwd). */
function normalizeCwd(cwd) {
  return cwd.replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")
}

function checkpointRoot(cwd) {
  const hash = createHash("sha1").update(normalizeCwd(cwd)).digest("hex").slice(0, CWD_HASH_LEN)
  return join(configDir, "checkpoints", hash)
}

/** Extract the list of tracked files changed from a unified diff */
function trackedFilesFromPatch(patch) {
  if (!patch.trim()) return []
  const files = new Set()
  for (const m of patch.matchAll(/^--- a\/(.+)$/gm)) files.add(m[1])
  return [...files].sort()
}

/** Extract a single file's patch hunks from a unified diff */
function extractFileHunks(patch, filePath) {
  // Split by file: each file block starts with "diff --git"
  const sections = patch.split(/(?=^diff --git )/m)
  for (const sec of sections) {
    if (!sec.trim()) continue
    const m = sec.match(/^diff --git a\/(.+) b\/(.+)/m)
    if (!m) continue
    if (m[1] === filePath || m[2] === filePath) return sec.trim()
  }
  return ""
}

/** Whether the current directory is a git repo */
export function isGitRepo(cwd) {
  return git(cwd, ["rev-parse", "--is-inside-work-tree"], { allowFail: true }) === "true"
}

/**
 * Copy a file into a snapshot directory, skipping oversized files.
 * Returns { size, sha } (sha = SHA256 hex, 12 chars) or null when skipped/failed.
 */
async function copyInto(dir, rel, src, skipped) {
  let size
  try { size = statSync(src).size } catch { return null }
  if (size > MAX_FILE_BYTES) {
    skipped.push(rel)
    return null
  }
  const buf = await readFile(src).catch((e) => { console.error(`[checkpoint] skipping ${rel}: ${e.message}`); return null })
  if (!buf) return null
  const dst = join(dir, rel)
  await mkdir(dirname(dst), { recursive: true })
  await writeFile(dst, buf)
  return { size: buf.length, sha: createHash("sha256").update(buf).digest("hex").slice(0, 12) }
}

/**
 * Create a snapshot. Returns { id, time, files, tracked, untracked, skipped } or null (non-git repo).
 * Per-file metadata ({ size, sha } per copied file) is stored in meta.json — this powers
 * listFileVersions (per-file history across snapshots) without rescanning copies.
 */
/** Full-directory snapshot for NON-git cwds (desktop proposal ②: createCheckpoint used to
 *  return null here, silently disabling checkpoints for non-git projects). Every file is
 *  copied under files/ (v2 layout, same rewind code path); meta carries nongit:true so
 *  rewind knows to skip git plumbing. Respects .gitignore-like skips via SKIP set only. */
async function createNonGitCheckpoint(cwd) {
  const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6)
  const dir = join(checkpointRoot(cwd), id)
  await mkdir(join(dir, "files"), { recursive: true })
  await mkdir(join(dir, "untracked"), { recursive: true })

  const skipped = []
  const fileMeta = {}
  const all = await collectFiles(cwd)
  for (const rel of all) {
    const m = await copyInto(join(dir, "files"), rel, join(cwd, rel), skipped)
    if (m) fileMeta[rel] = m
  }
  await writeFile(join(dir, "patch.diff"), "", "utf8") // no patch in nongit mode (layout compat)
  await writeFile(join(dir, "meta.json"), JSON.stringify({
    version: META_VERSION, id, time: Date.now(), nongit: true,
    untracked: [], tracked: all, trackedAll: all, skipped, head: "", fileMeta, untrackedMeta: {},
  }, null, 2), "utf8")
  await pruneCheckpoints(cwd)
  return { id, time: Date.now(), files: all.length, tracked: all, untracked: [], skipped }
}

/** Walk a non-git cwd collecting every file (relative paths), skipping heavy/irrelevant dirs. */
async function collectFiles(cwd) {
  const SKIP = new Set(["node_modules", ".git", "dist", "build", ".turbo", "coverage", ".next", "target", "__pycache__", ".venv"])
  const out = []
  async function walk(rel) {
    const abs = rel ? join(cwd, rel) : cwd
    let entries
    try { entries = await readdir(abs, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.name.startsWith(".thincoder")) continue
      const child = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) { if (!SKIP.has(e.name)) await walk(child) }
      else out.push(child)
    }
  }
  await walk("")
  return out
}

export async function createCheckpoint(cwd) {
  if (!isGitRepo(cwd)) return createNonGitCheckpoint(cwd)

  // Random suffix: prevents id collisions for two snapshots in the same millisecond (sorting stays ordered by timestamp prefix)
  const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6)
  const dir = join(checkpointRoot(cwd), id)
  await mkdir(join(dir, "files"), { recursive: true })
  await mkdir(join(dir, "untracked"), { recursive: true })

  // v2: full copies of changed tracked files (git apply of a stale patch is the v1 failure mode).
  // The patch is still written for legacy tooling/debugging, but rewind uses the copies.
  const head = git(cwd, ["rev-parse", "HEAD"], { allowFail: true }) ?? ""
  const changedRaw = git(cwd, ["diff", "HEAD", "--name-only", "-z"], { allowFail: true }) ?? ""
  const changed = changedRaw ? changedRaw.split("\0").filter(Boolean) : []
  const trackedAllRaw = git(cwd, ["ls-files", "-z"], { allowFail: true }) ?? ""
  const trackedAll = trackedAllRaw ? trackedAllRaw.split("\0").filter(Boolean) : []
  const patch = git(cwd, ["diff", "HEAD", "--binary"], { allowFail: true }) ?? ""
  await writeFile(join(dir, "patch.diff"), patch, "utf8")

  const skipped = []
  const fileMeta = {}
  for (const rel of changed) {
    const m = await copyInto(join(dir, "files"), rel, join(cwd, rel), skipped)
    if (m) fileMeta[rel] = m
  }

  // Untracked files (respects .gitignore) → copy as-is
  const untrackedRaw = git(cwd, ["ls-files", "--others", "--exclude-standard"], { allowFail: true }) ?? ""
  const untracked = untrackedRaw ? untrackedRaw.split("\n").filter(Boolean) : []
  const untrackedMeta = {}
  for (const rel of untracked) {
    const m = await copyInto(join(dir, "untracked"), rel, join(cwd, rel), skipped)
    if (m) untrackedMeta[rel] = m
  }

  await writeFile(join(dir, "meta.json"), JSON.stringify({
    version: META_VERSION, id, time: Date.now(), untracked, tracked: changed, skipped,
    head, trackedAll, fileMeta, untrackedMeta,
  }, null, 2), "utf8")

  await pruneCheckpoints(cwd)
  return { id, time: Date.now(), files: changed.length + untracked.length, tracked: changed, untracked, skipped }
}

/** List checkpoints (newest→oldest), with file change summary */
export async function listCheckpoints(cwd) {
  const root = checkpointRoot(cwd)
  if (!existsSync(root)) return []
  const ids = (await readdir(root)).sort().reverse()
  const out = []
  for (const id of ids) {
    try {
      const meta = JSON.parse(await readFile(join(root, id, "meta.json"), "utf8"))
      // Compat with old checkpoints (no tracked field): extract from patch file
      const tracked = meta.tracked ?? (() => {
        try {
          return trackedFilesFromPatch(readFileSync(join(root, id, "patch.diff"), "utf8"))
        } catch { return [] }
      })()
      out.push({
        id, time: meta.time,
        untracked: meta.untracked ?? [],
        skipped: meta.skipped ?? [],
        tracked,
      })
    } catch {
      // Corrupted checkpoint — skip
    }
  }
  return out
}

// ---- restore core ----

/** v1 legacy fallback: reset file to HEAD then apply its patch hunks. */
async function partialRestoreTrackedViaPatch(cwd, root, patchContent, filePath) {
  git(cwd, ["checkout", "HEAD", "--", filePath], { allowFail: true })
  const hunks = extractFileHunks(patchContent, filePath)
  if (!hunks) return false
  const tmpFile = join(root, ".tmp_partial.patch")
  await writeFile(tmpFile, hunks, "utf8")
  try {
    git(cwd, ["apply", "--whitespace=nowarn", tmpFile])
    return true
  } finally {
    await rm(tmpFile, { force: true })
  }
}

/** Restore a single file from a snapshot copy. Returns true when the copy existed. */
async function restoreFromCopy(snapshotDir, rel, cwd) {
  const src = join(snapshotDir, rel)
  if (!existsSync(src)) return false
  await mkdir(dirname(join(cwd, rel)), { recursive: true })
  await cp(src, join(cwd, rel), { force: true })
  return true
}

// ---- restore (single-file only) ----

/**
 * Restore ONE file from a specific snapshot (saves current state as a new snapshot first,
 * making the restore reversible).
 *
 * FULL restore is deliberately DISABLED: rolling the whole working tree back to a snapshot
 * is exactly as dangerous as `git checkout -- .` — it silently discards every change made
 * after the snapshot. Restore files individually (rewind with path / restoreFile).
 *
 * Returns { path, type, restored }.
 */
export async function rewind(cwd, id, { path } = {}) {
  if (!path) {
    throw new Error(
      "Full rewind is disabled — it is as dangerous as `git checkout -- .` (silently discards all work after the snapshot). " +
      "Restore files individually: rewind(cwd, id, { path }) or restoreFile(cwd, path, id)."
    )
  }

  const root = checkpointRoot(cwd)
  const dir = join(root, id)
  if (!existsSync(join(dir, "meta.json"))) throw new Error(`checkpoint ${id} not found`)
  const meta = JSON.parse(await readFile(join(dir, "meta.json"), "utf8"))
  const isV2 = meta.version === META_VERSION
  const patchContent = await readFile(join(dir, "patch.diff"), "utf8")

  // Restore is reversible: snapshot current state first
  await createCheckpoint(cwd)

  const tracked = meta.tracked ?? []
  const trackedAll = meta.trackedAll ?? []
  const isTracked = tracked.includes(path) || trackedAll.includes(path) || extractFileHunks(patchContent, path) !== ""
  const inUntracked = (meta.untracked ?? []).includes(path)

  // Oversized files were never copied — nothing to restore, say so explicitly.
  if ((meta.skipped ?? []).includes(path)) {
    throw new Error(`file "${path}" was NOT snapshotted in checkpoint ${id} (oversized, >5MB) — no copy exists to restore`)
  }

  if (!isTracked && !inUntracked) {
    throw new Error(`file "${path}" not found in checkpoint ${id} (tracked: ${tracked.join(", ") || "none"}, untracked: ${(meta.untracked ?? []).join(", ") || "none"})`)
  }

  let ok = false
  if (inUntracked) {
    ok = await restoreFromCopy(join(dir, "untracked"), path, cwd) || ok
  }
  if (isTracked) {
    if (isV2 && existsSync(join(dir, "files", path))) {
      ok = await restoreFromCopy(join(dir, "files"), path, cwd) || ok
    } else if (isV2 && meta.head) {
      // Untouched at snapshot time (content = snapshot HEAD) → checkout that commit's version.
      // Works even if HEAD moved since — the commit object is immutable.
      git(cwd, ["checkout", meta.head, "--", path], { allowFail: true })
      ok = true
    } else {
      // v1 snapshot → patch fallback
      ok = await partialRestoreTrackedViaPatch(cwd, root, patchContent, path) || ok
    }
  }

  return { path, type: isTracked ? "tracked" : "untracked", restored: ok }
}

// ---- per-file history ----

/**
 * List every historical version of a file across all snapshots (newest first).
 * Distinguishing copies: each entry carries its snapshot id, time, byte size and
 * content sha — the same file in different snapshots is a different version.
 * @param {string} cwd
 * @param {string} filePath — relative path as stored in snapshots
 * @returns {Promise<Array<{snapshotId: string, time: number, size: number, sha: string, source: "tracked"|"untracked"}>>}
 */
export async function listFileVersions(cwd, filePath) {
  const root = checkpointRoot(cwd)
  if (!existsSync(root)) return []
  const ids = (await readdir(root)).sort().reverse() // newest → oldest
  const out = []
  for (const id of ids) {
    let meta
    try { meta = JSON.parse(await readFile(join(root, id, "meta.json"), "utf8")) } catch { continue }
    const trackedMeta = meta.fileMeta ?? {}
    const untrackedMeta = meta.untrackedMeta ?? {}
    let entry = null
    if (trackedMeta[filePath]) {
      entry = { snapshotId: id, time: meta.time, ...trackedMeta[filePath], source: "tracked" }
    } else if (untrackedMeta[filePath]) {
      entry = { snapshotId: id, time: meta.time, ...untrackedMeta[filePath], source: "untracked" }
    } else if ((meta.tracked ?? []).includes(filePath) || (meta.untracked ?? []).includes(filePath)) {
      // Legacy snapshot (no per-file meta): fall back to stat-ing the copy
      const src = join((meta.tracked ?? []).includes(filePath) ? join(root, id, "files") : join(root, id, "untracked"), filePath)
      let size, sha
      try {
        const buf = await readFile(src)
        size = buf.length
        sha = createHash("sha256").update(buf).digest("hex").slice(0, 12)
      } catch { continue }
      entry = { snapshotId: id, time: meta.time, size, sha, source: (meta.tracked ?? []).includes(filePath) ? "tracked" : "untracked" }
    }
    if (entry) out.push(entry)
  }
  return out
}

/**
 * Restore a single file's content from a specific snapshot (per-file restore —
 * other files are left untouched). Thin wrapper over rewind path mode with clearer intent.
 * @returns {Promise<{path: string, type: "tracked"|"untracked", restored: boolean}>}
 */
export async function restoreFile(cwd, filePath, snapshotId) {
  return rewind(cwd, snapshotId, { path: filePath })
}


// ---- view ----

/**
 * View a file's content from a checkpoint (does not modify the working tree).
 * v2: read the snapshot copy directly. Legacy snapshots fall back to the temporary-restore path.
 * Returns the file content string.
 */
export async function catFile(cwd, id, filePath) {
  const root = checkpointRoot(cwd)
  const dir = join(root, id)
  if (!existsSync(join(dir, "meta.json"))) throw new Error(`checkpoint ${id} not found`)
  const meta = JSON.parse(await readFile(join(dir, "meta.json"), "utf8"))
  const isV2 = meta.version === META_VERSION
  const patchContent = await readFile(join(dir, "patch.diff"), "utf8")

  const tracked = meta.tracked ?? []
  const isTracked = tracked.includes(filePath) || extractFileHunks(patchContent, filePath) !== ""
  const inUntracked = (meta.untracked ?? []).includes(filePath)

  if (!isTracked && !inUntracked) {
    throw new Error(`file "${filePath}" not in checkpoint ${id}`)
  }

  // v2: read the snapshot copy directly
  const copy = join(inUntracked ? join(dir, "untracked") : join(dir, "files"), filePath)
  if (isV2 && existsSync(copy)) {
    return await readFile(copy, "utf8")
  }

  // Untracked legacy: read the copy if present
  if (inUntracked && !isTracked) {
    const src = join(dir, "untracked", filePath)
    if (!existsSync(src)) throw new Error(`untracked file "${filePath}" copy missing in checkpoint`)
    return await readFile(src, "utf8")
  }

  // Tracked legacy: temporarily restore → read → restore working tree
  const abs = join(cwd, filePath)
  const existed = existsSync(abs)
  let saved = null
  if (existed) saved = await readFile(abs, "utf8")

  try {
    git(cwd, ["checkout", "HEAD", "--", filePath])
    const hunks = extractFileHunks(patchContent, filePath)
    if (hunks) {
      const tmpPatch = join(root, ".tmp_cat.patch")
      await writeFile(tmpPatch, hunks, "utf8")
      try {
        git(cwd, ["apply", "--whitespace=nowarn", tmpPatch])
      } finally {
        await rm(tmpPatch, { force: true })
      }
    }
    return await readFile(abs, "utf8")
  } finally {
    // Restore original working tree state
    if (existed) {
      await writeFile(abs, saved, "utf8")
    } else {
      await rm(abs, { force: true })
    }
  }
}

/** F6: delete ALL checkpoints for a cwd — commit = new safety baseline. Best-effort:
 *  a missing dir is a no-op; deletion failures propagate so the git tool's commit case
 *  can report "(checkpoint cleanup skipped: …)" without blocking the commit result. */
export async function deleteCheckpointsForCwd(cwd) {
  await rm(checkpointRoot(cwd), { recursive: true, force: true })
}

/** NF6: keep only the most recent `count` snapshots — oldest removed first (id sort =
 *  timestamp prefix, so ascending order IS oldest-first). Returns how many were deleted
 *  (0 when the cwd has no checkpoint dir). */
export async function deleteCheckpointsOlderThan(cwd, count) {
  const root = checkpointRoot(cwd)
  let ids
  try { ids = (await readdir(root)).sort() } catch { return 0 }
  let removed = 0
  while (ids.length > count) {
    await rm(join(root, ids.shift()), { recursive: true, force: true })
    removed++
  }
  return removed
}

/** Keep only the most recent MAX_CHECKPOINTS (NF6 cap — runs at the end of every create) */
async function pruneCheckpoints(cwd) {
  await deleteCheckpointsOlderThan(cwd, MAX_CHECKPOINTS)
}
