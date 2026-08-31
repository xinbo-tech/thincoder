import {
  DESC,
  truncate,
  runGit
} from "./shared.mjs";
import { execFileSync } from "node:child_process";
import { resolve, relative, isAbsolute, sep } from "node:path";
import { filterLines, runGitStrict, validateRef, gitConfigArgs, snapshotBefore, executeExtAction } from "./git-ext.mjs";
import { executeCheckpointAction } from "./git-checkpoint.mjs";


/** Run git PRESERVING per-line leading whitespace. runGit trims the WHOLE output, which
 *  strips a porcelain line's leading " " (the unstaged marker) and misclassifies an
 *  unstaged-only first line as staged. status uses this so the staged/unstaged column survives. */
function runGitRaw(cwd, cmdArgs, config = []) {
  try {
    return execFileSync("git", [...config, ...cmdArgs], { cwd, encoding: "utf8", maxBuffer: 10 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }).replace(/\r/g, "").replace(/\n$/, "")
  } catch (e) {
    return String(e.stdout || "").replace(/\r/g, "")
  }
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



export const gitTool = {
  name: "git",
  description: DESC("git"),
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["diff", "status", "log", "show", "checkpoint", "add", "rm", "commit", "push", "tag", "branch", "checkout", "restore", "stash", "fetch", "pull", "reset", "revert", "merge", "cherry-pick", "ls-remote", "clone", "init", "rebase", "remote", "clean", "switch", "apply", "worktree", "archive", "blame", "mv"], description: "diff / status / log / show / checkpoint / add / rm / commit / push / tag / branch / checkout / restore / stash / fetch / pull / reset / revert / merge / cherry-pick / ls-remote / clone / init / rebase / remote / clean / switch / apply / worktree / archive / blame / mv — clean/rebase 操作前自动快照，checkpointAction=rewind 恢复" },
      // diff/log params
      staged: { type: "boolean", description: "(diff) Show staged changes instead of working tree" },
      path: { type: "string", description: "(diff/log/add/commit/checkout/restore/checkpoint:cat/versions/rewind/rm/apply/archive/blame/mv/worktree) File or directory to scope to / stage / restore（checkout/restore 操作前自动快照，checkpointAction=rewind 恢复）" },
      ref: { type: "string", description: "(diff/show/checkout/reset/revert/merge/cherry-pick/tag:create/branch:create/rebase/worktree:add/archive) Commit/branch/ref; (push/pull/fetch) the branch or tag (space-separated for multiple)" },
      count: { type: "number", description: "(log) Number of commits (default 10)" },
      oneline: { type: "boolean", description: "(log) One-line-per-commit format" },
      message: { type: "string", description: "(commit) Commit message — required for commit; (stash:push) stash message" },
      filter: { type: "string", description: "Optional: keep only status/diff/log output lines matching this regex (case-insensitive)" },
      // write-op params
      name: { type: "string", description: "(branch/tag) The branch or tag name (create/delete/switch)" },
      remote: { type: "string", description: "(push/fetch/pull) Remote name (e.g. origin). Default: current upstream" },
      workdir: { type: "string", description: "Run git in this workspace subdirectory (monorepo / multi-repo). Confined to the workspace. Default: cwd" },
      config: { type: "array", items: { type: "string" }, description: "(network actions: push/fetch/pull/ls-remote) git -c overrides, e.g. [\"http.proxy=http://10.2.2.112:3128\"] for blocked remotes" },
      tags: { type: "boolean", description: "(push) Also push all tags (--tags)" },
      mode: { type: "string", enum: ["soft", "mixed", "hard"], description: "(reset) reset mode — hard snapshots the tree first + needs confirmation（操作前自动快照，checkpointAction=rewind 恢复）" },
      tagAction: { type: "string", enum: ["list", "create", "delete"], description: "(tag) list tags / create one / delete one（delete 操作前自动快照，checkpointAction=rewind 恢复）" },
      branchAction: { type: "string", enum: ["list", "create", "delete", "switch"], description: "(branch) list branches / create / delete / switch to one（delete 操作前自动快照，checkpointAction=rewind 恢复）" },
      stashAction: { type: "string", enum: ["push", "pop", "list"], description: "(stash) push (stash now) / pop (apply+drop) / list（pop 操作前自动快照，checkpointAction=rewind 恢复）" },
      // checkpoint params
      checkpointAction: { type: "string", enum: ["list", "create", "rewind", "cat", "versions"], description: "(checkpoint) list snapshots / create one / restore by id / read file from snapshot / list a file's historical versions（rewind 可恢复操作前状态，恢复前自动快照可逆）" },
      checkpointId: { type: "string", description: "(checkpoint) Snapshot id — required for rewind and cat; optional for list (shows file tree)" },
      // F7 new-action params
      remoteAction: { type: "string", enum: ["list", "add", "remove", "set-url"], description: "(remote) list remotes / add / remove / set-url" },
      remoteUrl: { type: "string", description: "(remote add/set-url) Remote URL (https/git/ssh or local path)" },
      rebaseAction: { type: "string", enum: ["start", "abort", "continue"], description: "(rebase) start (ref required) / abort / continue（操作前自动快照，checkpointAction=rewind 恢复）" },
      dryRun: { type: "boolean", description: "(clean) preview only (-n) — no deletion, no snapshot; real clean 操作前自动快照，checkpointAction=rewind 恢复" },
      create: { type: "boolean", description: "(switch) create the branch then switch (-c)" },
      dest: { type: "string", description: "(mv) destination path (file or directory)" },
      worktreeAction: { type: "string", enum: ["list", "add", "remove"], description: "(worktree) list / add (path, ref) / remove (path)" },
    },
    required: ["action"],
  },
  readonly: false,
  async execute(args, ctx) {
    // workdir: run git in a workspace subdirectory (monorepo / multi-repo). Shadow ctx.cwd so
    // every action + snapshotBefore + checkpoint resolves against the workdir, confined to the workspace.
    if (args.workdir) ctx = { ...ctx, cwd: resolveBaseDir(ctx.cwd, args.workdir) }
    // git -c overrides (proxy etc.) — only network actions need them; passing to every
    // action would be harmless but noisy. cfgArgs stays [] for local ops.
    const cfgArgs = gitConfigArgs(args.config)
    switch (args.action) {
      case "diff": {
        const ref = args.ref ?? "HEAD"
        if (!/^[A-Za-z0-9._/~^@][A-Za-z0-9._/~^@{}-]*$/.test(ref)) throw new Error(`Invalid git ref: ${ref}`)
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
        if (!/^[A-Za-z0-9._/~^@][A-Za-z0-9._/~^@{}-]*$/.test(ref)) throw new Error(`Invalid git ref: ${ref}`)
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
        if (commit.ok) {
          if (commit.out) parts.push(commit.out)
          // F6: commit = new safety baseline — clear this project's checkpoints
          // (best-effort per NF7: a failed cleanup never blocks the commit result).
          try {
            const { deleteCheckpointsForCwd } = await import("../git/checkpoint.mjs")
            await deleteCheckpointsForCwd(ctx.cwd)
            parts.push("(checkpoints cleared — commit is a new safety baseline)")
          } catch (e) {
            parts.push(`(checkpoint cleanup skipped: ${e.message})`)
          }
        }
        else parts.push(`git commit failed: ${commit.err || "(no output)"}`)
        return truncate(parts.join("\n") || "(commit produced no output)")
      }
      case "push": {
        const cmdArgs = ["push"]
        if (args.remote) cmdArgs.push(validateRef(args.remote, "remote"))
        if (args.ref) for (const r of args.ref.split(/\s+/).filter(Boolean)) cmdArgs.push(validateRef(r, "ref"))
        if (args.tags) cmdArgs.push("--tags")
        const r = runGitStrict(ctx.cwd, cmdArgs, cfgArgs)
        return r.ok ? truncate(r.out || "(push complete — no output)") : truncate(`git push failed: ${r.err || r.out || "(no output)"}`)
      }
      case "ls-remote": {
        // Lightweight remote-ref check (which refs a remote has) — network action,
        // read-only, no snapshot. Config plumbing for blocked/gated remotes.
        const cmdArgs = ["ls-remote"]
        if (args.remote) cmdArgs.push(validateRef(args.remote, "remote"))
        if (args.ref) for (const r of args.ref.split(/\s+/).filter(Boolean)) cmdArgs.push(validateRef(r, "ref"))
        const out = runGit(ctx.cwd, cmdArgs, cfgArgs)
        if (!out) return "(no refs / remote unreachable)"
        return truncate(filterLines(out, args.filter))
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
        const r = runGitStrict(ctx.cwd, cmdArgs, cfgArgs)
        return r.ok ? truncate(r.out || "(fetch complete — no output)") : truncate(`git fetch failed: ${r.err || r.out}`)
      }
      case "pull": {
        const cmdArgs = ["pull"]
        if (args.remote) cmdArgs.push(validateRef(args.remote, "remote"))
        if (args.ref) cmdArgs.push(validateRef(args.ref, "ref"))
        const r = runGitStrict(ctx.cwd, cmdArgs, cfgArgs)
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
      // F7 扩展 action + checkpoint：实现拆在 git-ext.mjs / git-checkpoint.mjs（500 行硬限）
      case "clone":
      case "init":
      case "rebase":
      case "remote":
      case "clean":
      case "switch":
      case "apply":
      case "worktree":
      case "archive":
      case "blame":
      case "mv":
        return executeExtAction(args, ctx)
      case "checkpoint":
        return executeCheckpointAction(args, ctx)

      default:
        return `Unknown action '${args.action}'. Use: diff | status | log | show | checkpoint | add | rm | commit | push | tag | branch | checkout | restore | stash | fetch | pull | reset | revert | merge | cherry-pick | ls-remote | clone | init | rebase | remote | clean | switch | apply | worktree | archive | blame | mv`
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

