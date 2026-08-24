/**
 * gitmem.mjs — Team-layer memory git sync
 * All through child_process calling system git, zero dependencies.
 * Conflict strategy (decided): different entries are naturally conflict-free;
 * on real conflicts abort rebase to keep the repo clean,
 * report an error with manual resolution guidance — no auto-merge.
 */

import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

/** Run git in dir, throw with stderr on failure */
async function git(dir, args) {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd: dir, encoding: "utf8" })
    return stdout.trim()
  } catch (error) {
    const detail = error.stderr?.trim() || error.message
    const err = new Error(`git ${args.join(" ")} failed: ${detail}`)
    err.gitError = true
    err.stderr = detail
    throw err
  }
}

/** Clone team repo if it doesn't exist. Returns whether a clone happened */
export async function ensureClone({ repo, dir }) {
  if (existsSync(join(dir, ".git"))) return false
  await mkdir(dirname(dir), { recursive: true })
  await git(dirname(dir), ["clone", repo, dir])
  return true
}

/**
 * Sync: pull --rebase. Skip if remote is still empty (first-time use).
 * On conflict, abort rebase (keep repo clean) and throw a guided error.
 * Returns true = pull succeeded (caller should then syncDir to rebuild index)
 */
export async function pullTeam(dir) {
  // Empty remote repo: no branch to pull (ls-remote has no output)
  const refs = await git(dir, ["ls-remote", "--heads", "origin"])
  if (!refs) return false

  try {
    await git(dir, ["pull", "--rebase"])
    return true
  } catch (error) {
    if (await hasConflict(dir)) {
      let abortFailed = false
      try { await git(dir, ["rebase", "--abort"]) } catch {
        abortFailed = true
      }
      const conflictError = new Error(
        `Team memory sync conflict: local and remote modified the same entry.\n` +
        `Please resolve manually in ${dir} with \`git pull\`, then re-run \`thincoder sync\`.\n` +
        (abortFailed
          ? `(WARNING: git rebase --abort also failed — the repo may be in a conflicted state. ` +
            `Run \`cd ${dir} && git rebase --abort\` manually to clean up.)`
          : `(The local repo has been restored to its pre-sync state — nothing was lost.)`),
        { cause: error },
      )
      throw conflictError
    }
    throw error
  }
}

/**
 * Commit and push an entry file. On push rejection (remote has new commits),
 * pull --rebase then retry once; rebase conflicts also abort and error out.
 */
export async function commitAndPush(dir, filename, message) {
  await git(dir, ["add", filename])
  // Nothing to commit (content unchanged) — this is normal idempotent behavior, not an error
  const dirty = await git(dir, ["status", "--porcelain", "--", filename])
  if (dirty) await git(dir, ["commit", "-m", message])
  try {
    await git(dir, ["push"])
  } catch {
    await pullTeam(dir) // Conflicts will throw a guided error here
    await git(dir, ["push"])
  }
}

/** Whether currently in a rebase conflict state (unmerged paths exist) */
async function hasConflict(dir) {
  try {
    const out = await git(dir, ["status", "--porcelain"])
    // There are 7 unmerged states: DD AU UD UA DU AA UU — only checking UU/AA/DD misses 4 states with U,
    // which means the rebase is left mid-conflict (violating the "keep repo clean" promise)
    return out.split("\n").some((l) => l[0] === "U" || l[1] === "U" || l.startsWith("AA") || l.startsWith("DD"))
  } catch {
    return false
  }
}
