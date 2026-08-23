import {
  DESC,
  truncate,
  runGit
} from "./shared.mjs";
import { escapeXml } from "../agent/helpers.mjs";
import { execFileSync } from "node:child_process";
import { join, resolve, relative, isAbsolute, sep } from "node:path";

/** Keep only output lines matching a regex (git filter, case-insensitive). */
function filterLines(output, filter) {
  if (!filter) return output
  try {
    const re = new RegExp(filter, "i")
    const lines = output.split("\n").filter((l) => re.test(l))
    return lines.length ? lines.join("\n") : `(no lines matched filter "${filter}")`
  } catch (e) {
    return `Error: filter regex invalid: ${e.message}`
  }
}

/** Run git PRESERVING per-line leading whitespace. runGit trims the WHOLE output, which
 *  strips a porcelain line's leading " " (the unstaged marker) and misclassifies an
 *  unstaged-only first line as staged. status uses this so the staged/unstaged column survives. */
function runGitRaw(cwd, cmdArgs) {
  try {
    return execFileSync("git", cmdArgs, { cwd, encoding: "utf8", maxBuffer: 10 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }).replace(/\r/g, "").replace(/\n$/, "")
  } catch (e) {
    return String(e.stdout || "").replace(/\r/g, "")
  }
}

/** Run git and report failure (stderr + exit code) instead of swallowing it.
 *  Used by write ops (commit/push/rm) where a silent "" would masquerade as success. */
function runGitStrict(cwd, cmdArgs) {
  try {
    const out = execFileSync("git", cmdArgs, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim().replace(/\r/g, "")
    return { ok: true, out }
  } catch (e) {
    return { ok: false, out: String(e.stdout || "").trim(), err: String(e.stderr || e.message || "").trim() }
  }
}

/** Validate a git ref / branch / tag / remote name (no option injection, no whitespace). */
function validateRef(ref, what = "git ref") {
  if (!/^[A-Za-z0-9._\/~^@][A-Za-z0-9._\/~^@{}\-]*$/.test(ref)) throw new Error(`Invalid ${what}: ${ref}`)
  return ref
}

/** True when `abs` is inside `root` (handles `..` and cross-drive, which relative()
 *  returns as an absolute path on Windows). */
function isInside(root, abs) {
  const rel = relative(root, abs)
  if (isAbsolute(rel)) return false
  return rel !== ".." && !rel.startsWith(".." + sep)
}

/** Resolve workdir relative to cwd, asserting it stays within the workspace. */
function resolveBaseDir(cwd, workdir) {
  if (!workdir || typeof workdir !== "string") return cwd
  const abs = resolve(cwd, workdir)
  if (!isInside(cwd, abs)) throw new Error(`workdir escapes the workspace: ${workdir}`)
  return abs
}

/** Snapshot the working tree before a destructive op (reset --hard / checkout file / restore /
 *  stash pop / branch|tag delete). Best-effort — a snapshot failure must not block the op
 *  (the approval/permission layer is the real gate). Returns a note line or "". */
async function snapshotBefore(ctx, label) {
  try {
    const { createCheckpoint, isGitRepo } = await import("../git/checkpoint.mjs")
    if (!isGitRepo(ctx.cwd)) return ""
    const cp = await createCheckpoint(ctx.cwd)
    return `[snapshot ${cp.id} created before ${label}]\n`
  } catch {
    return ""
  }
}

export const gitTool = {
  name: "git",
  description: DESC("git"),
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["diff", "status", "log", "show", "checkpoint", "add", "rm", "commit", "push", "tag", "branch", "checkout", "restore", "stash", "fetch", "pull", "reset", "revert", "merge", "cherry-pick"], description: "diff / status / log / show / checkpoint / add / rm / commit / push / tag / branch / checkout / restore / stash / fetch / pull / reset / revert / merge / cherry-pick" },
      // diff/log params
      staged: { type: "boolean", description: "(diff) Show staged changes instead of working tree" },
      path: { type: "string", description: "(diff/log/add/commit/checkout/restore/checkpoint:cat/versions/rewind/rm) File or directory to scope to / stage / restore" },
      ref: { type: "string", description: "(show/diff/checkout/reset/revert/merge/cherry-pick/tag:create/branch:create) Commit/branch/ref; (push/pull/fetch) the branch or tag to push/pull/fetch (space-separated for multiple)" },
      count: { type: "number", description: "(log) Number of commits (default 10)" },
      oneline: { type: "boolean", description: "(log) One-line-per-commit format" },
      message: { type: "string", description: "(commit) Commit message — required for commit; (stash:push) stash message" },
      filter: { type: "string", description: "Optional: keep only status/diff/log output lines matching this regex (case-insensitive)" },
      // write-op params
      name: { type: "string", description: "(branch/tag) The branch or tag name (create/delete/switch)" },
      remote: { type: "string", description: "(push/fetch/pull) Remote name (e.g. origin). Default: current upstream" },
      workdir: { type: "string", description: "Run git in this workspace subdirectory (monorepo / multi-repo). Confined to the workspace. Default: cwd" },
      tags: { type: "boolean", description: "(push) Also push all tags (--tags)" },
      mode: { type: "string", enum: ["soft", "mixed", "hard"], description: "(reset) reset mode — hard snapshots the tree first + needs confirmation" },
      tagAction: { type: "string", enum: ["list", "create", "delete"], description: "(tag) list tags / create one / delete one" },
      branchAction: { type: "string", enum: ["list", "create", "delete", "switch"], description: "(branch) list branches / create / delete / switch to one" },
      stashAction: { type: "string", enum: ["push", "pop", "list"], description: "(stash) push (stash now) / pop (apply+drop) / list" },
      // checkpoint params
      checkpointAction: { type: "string", enum: ["list", "create", "rewind", "cat", "versions"], description: "(checkpoint) list snapshots / create one / restore by id / read file from snapshot / list a file's historical versions" },
      checkpointId: { type: "string", description: "(checkpoint) Snapshot id — required for rewind and cat; optional for list (shows file tree)" },
    },
    required: ["action"],
  },
  readonly: false,
  async execute(args, ctx) {
    // workdir: run git in a workspace subdirectory (monorepo / multi-repo). Shadow ctx.cwd so
    // every action + snapshotBefore + checkpoint resolves against the workdir, confined to the workspace.
    if (args.workdir) ctx = { ...ctx, cwd: resolveBaseDir(ctx.cwd, args.workdir) }
    switch (args.action) {
      case "diff": {
        const ref = args.ref ?? "HEAD"
        if (!/^[A-Za-z0-9._\/~^@][A-Za-z0-9._\/~^@{}\-]*$/.test(ref)) throw new Error(`Invalid git ref: ${ref}`)
        const flags = args.staged ? ["--staged"] : []
        const paths = args.path ? [args.path] : []
        const out = runGit(ctx.cwd, ["diff", ...flags, ref, "--", ...paths])
        return truncate(filterLines(out || "(no changes)", args.filter))
      }
      case "status": {
        // Preserve per-line leading whitespace — porcelain " M"/"M " staged/unstaged markers are
        // significant (runGit trims the whole output's leading space, corrupting an unstaged-first-line).
        const porcelain = runGitRaw(ctx.cwd, ["status", "--porcelain"])
        if (!porcelain) return "(clean — no changes)"

        const staged = []
        const unstaged = []
        const untracked = []
        const conflicts = []
        for (const line of porcelain.split("\n")) {
          if (!line) continue
          const clean = line.replace(/\r/g, "")
          const m = clean.match(/^(..?)\s+(.+)$/)
          if (!m) continue
          const [, status, rawFile] = m
          const file = status.includes("R") && rawFile.includes(" -> ") ? rawFile.replace(" -> ", " → ") : rawFile
          const idx = status[0] ?? " "
          const wt = status[1] ?? " "
          if (idx === "U" || wt === "U" || (idx === "A" && wt === "A")) {
            conflicts.push(file)
          } else if (idx === "?" && wt === "?") {
            untracked.push(file)
          } else {
            if (idx !== " " && idx !== "?") staged.push(idx + " " + file)
            if (wt !== " " && wt !== "?") unstaged.push(wt + " " + file)
          }
        }
        const parts = []
        if (staged.length) parts.push("Staged (" + staged.length + "):\n" + staged.join("\n"))
        if (unstaged.length) parts.push("Unstaged (" + unstaged.length + "):\n" + unstaged.join("\n"))
        if (untracked.length) parts.push("Untracked (" + untracked.length + "):\n" + untracked.join("\n"))
        if (conflicts.length) parts.push("Conflicts (" + conflicts.length + "):\n" + conflicts.join("\n"))
        return truncate(filterLines(parts.join("\n\n"), args.filter))
      }
      case "log": {
        const parsed = Number.parseInt(args.count, 10)
        const n = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : 10
        const isOneline = args.oneline
        const cmdArgs = isOneline
          ? ["log", "-" + n, "--oneline"]
          : ["log", "-" + n, "--format=%h %ad %an %s", "--date=short"]
        if (args.path) cmdArgs.push("--", args.path)
        const out = runGit(ctx.cwd, cmdArgs)
        return truncate(filterLines(out || "(no commits)", args.filter))
      }
      case "show": {
        const ref = args.ref ?? "HEAD"
        if (!/^[A-Za-z0-9._\/~^@][A-Za-z0-9._\/~^@{}\-]*$/.test(ref)) throw new Error(`Invalid git ref: ${ref}`)
        const out = runGit(ctx.cwd, ["show", "--stat", ref])
        return truncate(out || "(no such commit)")
      }
      case "rm": {
        if (!args.path) return "Error: rm requires path (the file/directory to untrack, relative to repo root)"
        const r = runGitStrict(ctx.cwd, ["rm", "--cached", "-r", "--", args.path])
        return r.ok ? truncate(r.out || `Untracked ${args.path} (kept on disk)`) : truncate(`git rm failed: ${r.err || r.out}`)
      }
      case "commit": {
        if (!args.message) return "Error: commit requires message"
        // Granular staging when path given (only stage these); otherwise stage all (add -A).
        const add = runGitStrict(ctx.cwd, args.path ? ["add", "--", args.path] : ["add", "-A"])
        if (!add.ok) return truncate(`git add failed: ${add.err || add.out || "(no output)"}`)
        const commit = runGitStrict(ctx.cwd, ["commit", "-m", args.message])
        const parts = []
        if (add.out) parts.push(add.out)
        if (commit.ok) { if (commit.out) parts.push(commit.out) }
        else parts.push(`git commit failed: ${commit.err || "(no output)"}`)
        return truncate(parts.join("\n") || "(commit produced no output)")
      }
      case "push": {
        const cmdArgs = ["push"]
        if (args.remote) cmdArgs.push(validateRef(args.remote, "remote"))
        if (args.ref) for (const r of args.ref.split(/\s+/).filter(Boolean)) cmdArgs.push(validateRef(r, "ref"))
        if (args.tags) cmdArgs.push("--tags")
        const r = runGitStrict(ctx.cwd, cmdArgs)
        return r.ok ? truncate(r.out || "(push complete — no output)") : truncate(`git push failed: ${r.err || r.out || "(no output)"}`)
      }
      case "add": {
        // Granular staging: stage `path` when given, else all changes (add -A).
        const cmdArgs = args.path ? ["add", "--", args.path] : ["add", "-A"]
        const r = runGitStrict(ctx.cwd, cmdArgs)
        return r.ok ? truncate(r.out || `Staged ${args.path || "all changes"}`) : truncate(`git add failed: ${r.err || r.out}`)
      }
      case "tag": {
        const sub = args.tagAction
        if (sub === "list") return truncate(filterLines(runGit(ctx.cwd, ["tag", "-l"]) || "(no tags)", args.filter))
        if (sub === "create") {
          if (!args.name) return "Error: tag create requires name"
          validateRef(args.name, "tag")
          const cmdArgs = ["tag", args.name]
          if (args.ref) cmdArgs.push(validateRef(args.ref))
          const r = runGitStrict(ctx.cwd, cmdArgs)
          return r.ok ? `Tag ${args.name} created` : truncate(`git tag failed: ${r.err || r.out}`)
        }
        if (sub === "delete") {
          if (!args.name) return "Error: tag delete requires name"
          validateRef(args.name, "tag")
          const snap = await snapshotBefore(ctx, `tag delete ${args.name}`)
          const r = runGitStrict(ctx.cwd, ["tag", "-d", args.name])
          return r.ok ? truncate(snap + `Tag ${args.name} deleted`) : truncate(`git tag -d failed: ${r.err || r.out}`)
        }
        return "Error: tag requires tagAction — use: list | create | delete"
      }
      case "branch": {
        const sub = args.branchAction
        if (sub === "list") return truncate(filterLines(runGit(ctx.cwd, ["branch", "--all", "-vv"]) || "(no branches)", args.filter))
        if (sub === "create") {
          if (!args.name) return "Error: branch create requires name"
          validateRef(args.name, "branch")
          const cmdArgs = ["branch", args.name]
          if (args.ref) cmdArgs.push(validateRef(args.ref))
          const r = runGitStrict(ctx.cwd, cmdArgs)
          return r.ok ? `Branch ${args.name} created` : truncate(`git branch failed: ${r.err || r.out}`)
        }
        if (sub === "switch") {
          if (!args.name) return "Error: branch switch requires name"
          validateRef(args.name, "branch")
          const r = runGitStrict(ctx.cwd, ["checkout", args.name])
          return r.ok ? `Switched to branch ${args.name}` : truncate(`git checkout ${args.name} failed: ${r.err || r.out}`)
        }
        if (sub === "delete") {
          if (!args.name) return "Error: branch delete requires name"
          validateRef(args.name, "branch")
          const snap = await snapshotBefore(ctx, `branch delete ${args.name}`)
          const r = runGitStrict(ctx.cwd, ["branch", "-d", args.name])
          return r.ok ? truncate(snap + `Branch ${args.name} deleted`) : truncate(`git branch -d failed: ${r.err || r.out}`)
        }
        return "Error: branch requires branchAction — use: list | create | delete | switch"
      }
      case "checkout": {
        if (args.path) {
          // Restore file from index (discards working-tree changes to it) — destructive: snapshot first.
          const snap = await snapshotBefore(ctx, `checkout -- ${args.path}`)
          const r = runGitStrict(ctx.cwd, ["checkout", "--", args.path])
          return r.ok ? truncate(snap + `Restored ${args.path}`) : truncate(`git checkout -- ${args.path} failed: ${r.err || r.out}`)
        }
        if (args.ref) {
          validateRef(args.ref, "ref")
          const r = runGitStrict(ctx.cwd, ["checkout", args.ref])
          return r.ok ? truncate(r.out || `Checked out ${args.ref}`) : truncate(`git checkout ${args.ref} failed: ${r.err || r.out}`)
        }
        return "Error: checkout requires ref (branch/commit) or path (file to restore)"
      }
      case "restore": {
        if (!args.path) return "Error: restore requires path"
        const snap = await snapshotBefore(ctx, `restore ${args.path}`)
        const cmdArgs = ["restore"]
        if (args.staged) cmdArgs.push("--staged")
        cmdArgs.push("--", args.path)
        const r = runGitStrict(ctx.cwd, cmdArgs)
        return r.ok ? truncate(snap + `Restored ${args.path}`) : truncate(`git restore failed: ${r.err || r.out}`)
      }
      case "stash": {
        const sub = args.stashAction
        if (sub === "list") return truncate(filterLines(runGit(ctx.cwd, ["stash", "list"]) || "(no stashes)", args.filter))
        if (sub === "push") {
          const cmdArgs = ["stash", "push"]
          if (args.message) cmdArgs.push("-m", args.message)
          const r = runGitStrict(ctx.cwd, cmdArgs)
          return r.ok ? truncate(r.out || "Stashed") : truncate(`git stash push failed: ${r.err || r.out}`)
        }
        if (sub === "pop") {
          const snap = await snapshotBefore(ctx, "stash pop")
          const r = runGitStrict(ctx.cwd, ["stash", "pop"])
          return r.ok ? truncate(snap + (r.out || "Popped")) : truncate(`git stash pop failed: ${r.err || r.out}`)
        }
        return "Error: stash requires stashAction — use: push | pop | list"
      }
      case "fetch": {
        const cmdArgs = ["fetch"]
        if (args.remote) cmdArgs.push(validateRef(args.remote, "remote"))
        if (args.ref) cmdArgs.push(validateRef(args.ref, "ref"))
        const r = runGitStrict(ctx.cwd, cmdArgs)
        return r.ok ? truncate(r.out || "(fetch complete — no output)") : truncate(`git fetch failed: ${r.err || r.out}`)
      }
      case "pull": {
        const cmdArgs = ["pull"]
        if (args.remote) cmdArgs.push(validateRef(args.remote, "remote"))
        if (args.ref) cmdArgs.push(validateRef(args.ref, "ref"))
        const r = runGitStrict(ctx.cwd, cmdArgs)
        return r.ok ? truncate(r.out || "(pull complete — no output)") : truncate(`git pull failed: ${r.err || r.out}`)
      }
      case "reset": {
        const mode = args.mode ?? "mixed"
        if (!["soft", "mixed", "hard"].includes(mode)) return "Error: reset mode must be soft | mixed | hard"
        let snap = ""
        if (mode === "hard") snap = await snapshotBefore(ctx, "reset --hard") // destructive: drops working-tree changes
        const cmdArgs = ["reset", `--${mode}`]
        if (args.ref) cmdArgs.push(validateRef(args.ref))
        const r = runGitStrict(ctx.cwd, cmdArgs)
        return r.ok ? truncate(snap + (r.out || `Reset (${mode}) complete`)) : truncate(`git reset failed: ${r.err || r.out}`)
      }
      case "revert": {
        const ref = validateRef(args.ref ?? "HEAD")
        const r = runGitStrict(ctx.cwd, ["revert", "--no-edit", ref])
        return r.ok ? truncate(r.out || `Reverted ${ref}`) : truncate(`git revert failed: ${r.err || r.out}`)
      }
      case "merge": {
        if (!args.ref) return "Error: merge requires ref (branch/commit to merge)"
        validateRef(args.ref, "ref")
        const r = runGitStrict(ctx.cwd, ["merge", "--no-edit", args.ref])
        return r.ok ? truncate(r.out || `Merged ${args.ref}`) : truncate(`git merge failed: ${r.err || r.out} — resolve conflicts, then commit`)
      }
      case "cherry-pick": {
        if (!args.ref) return "Error: cherry-pick requires ref (commit)"
        validateRef(args.ref, "ref")
        const r = runGitStrict(ctx.cwd, ["cherry-pick", args.ref])
        return r.ok ? truncate(r.out || `Cherry-picked ${args.ref}`) : truncate(`git cherry-pick failed: ${r.err || r.out}`)
      }
      case "checkpoint": {
        const { createCheckpoint, listCheckpoints, rewind, listFileVersions, isGitRepo } = await import("../git/checkpoint.mjs")
        if (!isGitRepo(ctx.cwd)) throw new Error("Not a git repository — checkpoints unavailable")

        const sub = args.checkpointAction
        if (!sub) return "checkpoint: missing checkpointAction — use: list | create | rewind | cat | versions"

        if (sub === "create") {
          const cp = await createCheckpoint(ctx.cwd)
          return `Checkpoint ${cp.id} created (${cp.files} file(s): ${cp.tracked.length} tracked, ${cp.untracked.length} untracked)`
        }
        if (sub === "versions") {
          if (!args.path) throw new Error("path is required for versions — the file whose history you want")
          const versions = await listFileVersions(ctx.cwd, args.path)
          if (versions.length === 0) return `No snapshot copies of "${args.path}" found (it was never part of an auto/protection snapshot).`
          return (
            `Historical versions of "${args.path}" (${versions.length}, newest first):\n` +
            versions.map((v) =>
              `  ${v.snapshotId}  ${new Date(v.time).toISOString()}  ${v.size}B  sha:${v.sha}  (${v.source})` +
              (v.sha === versions[versions.indexOf(v) - 1]?.sha ? "  ← same content as previous" : "")
            ).join("\n") +
            `\nRestore a version: checkpointAction=rewind checkpointId=<snapshotId> path="${args.path}"`
          )
        }
        if (sub === "rewind") {
          if (!args.checkpointId) throw new Error("checkpointId is required for rewind — use checkpointAction=list to see snapshot ids")
          if (!args.path) throw new Error("path is required for rewind — full restore is disabled (as dangerous as `git checkout -- .`). Restore files individually. Use checkpointAction=versions path=<file> to list a file's historical versions.")
          const s = await rewind(ctx.cwd, args.checkpointId, { path: args.path })
          return `Restored "${args.path}" (${s.type}) from checkpoint ${args.checkpointId}.\n(The pre-restore state was snapshotted first — you can restore again to go back.)`
        }
        if (sub === "cat") {
          if (!args.checkpointId) throw new Error("checkpointId is required for cat — use checkpointAction=list to see snapshot ids")
          if (!args.path) throw new Error("path is required for cat — specify which file to read")
          const { catFile } = await import("../git/checkpoint.mjs")
          return await catFile(ctx.cwd, args.checkpointId, args.path)
        }
        if (sub === "list") {
          const cps = await listCheckpoints(ctx.cwd)
          if (cps.length === 0) return "(no checkpoints yet)"

          // Specific id: show the file tree within that snapshot
          if (args.checkpointId) {
            const cp = cps.find((c) => c.id === args.checkpointId)
            if (!cp) throw new Error(`checkpoint ${args.checkpointId} not found`)
            return formatFileTree(cp)
          }

          // Overview: list of all snapshots (file names are XML-escaped: they are
          // untrusted input that flows back into the model's context)
          return cps.map((c) => {
            const parts = [`${c.id}  ${new Date(c.time).toISOString()}`]
            if (c.tracked.length) parts.push(`${c.tracked.length} tracked: ${c.tracked.map(escapeXml).join(", ")}`)
            if (c.untracked.length) parts.push(`${c.untracked.length} untracked: ${c.untracked.map(escapeXml).join(", ")}`)
            return parts.join("  ")
          }).join("\n")
        }
        throw new Error(`Unknown checkpoint action: ${sub}. Use: list | create | rewind | cat | versions`)
      }
      default:
        return `Unknown action '${args.action}'. Use: diff | status | log | show | checkpoint | add | rm | commit | push | tag | branch | checkout | restore | stash | fetch | pull | reset | revert | merge | cherry-pick`
    }
  },
}

// ---------------------------------------------------------------- question

export const questionTool = {
  name: "question",
  description: DESC("question"),
  parameters: {
    type: "object",
    properties: {
      question: { type: "string", description: "The question to ask the user" },
      options: {
        type: "array",
        items: { type: "string" },
        description: "Single-choice options for the user to pick from (optional)",
      },
    },
    required: ["question"],
  },
  readonly: true,
  async execute(args, ctx) {
    if (!ctx.onQuestion) throw new Error("question tool not supported in this context (no UI to ask)")
    return ctx.onQuestion(args.question, args.options ?? [])
  },
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
