/**
 * git.mjs — Git tool (CLI parity: single `git` tool with action subcommands).
 * diff / status / log follow the CLI implementation byte-for-byte;
 * checkpoint uses the full-copy snapshot mechanism MIRRORED from the CLI
 * (thincoder src/git/checkpoint.mjs → 本仓库 src/tools/checkpoint.mjs，CHECKPOINT.md F5
 * 存储统一：同一目录同一格式，快照跨端互通)。F7 扩展 action 与 checkpoint 子系统分别拆在
 * git-ext.mjs / git-checkpoint.mjs（500 行硬限）。
 */
import { runGit, truncate } from "./shared.mjs"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { runGitStrict, validateRef, gitConfigArgs, snapshotBefore, executeExtAction } from "./git-ext.mjs"
import { executeCheckpointAction } from "./git-checkpoint.mjs"

/** Run git PRESERVING per-line leading whitespace — porcelain " M"/"M " staged/unstaged markers
 *  are significant (runGit trims the whole output's leading space, corrupting an unstaged-first-line). */
function runGitRaw(cwd, cmdArgs, config = []) {
  try {
    return execFileSync("git", [...config, ...cmdArgs], { cwd, encoding: "utf8", maxBuffer: 10 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }).replace(/\r/g, "").replace(/\n$/, "")
  } catch (e) {
    return String(e.stdout || "").replace(/\r/g, "")
  }
}

/** Resolve workdir relative to cwd (no workspace boundary assertion — bash parity,
 *  TOOLS.md §10.1 D-W1: git itself is not directory-restricted). */
function resolveBaseDir(cwd, workdir) {
  if (!workdir || typeof workdir !== "string") return cwd
  return resolve(cwd, workdir)
}

export const gitTool = {
  name: "git",
  readonly: false,
  description:
    "Run a git command. Only works inside a git repository.\n" +
    "- action='diff': unified diff (staged=true for staged-only, ref=<ref>, path=<dir> to scope). - 'status': staged/unstaged/untracked/conflicts. - 'log': recent commits (count, oneline, path). - 'show': a commit's details (ref).\n" +
    "- 'add': stage files (path, or -A all). - 'commit': stage + commit (message, path for granular). - 'rm': untrack a file (path, kept on disk).\n" +
    "- 'push'/'fetch'/'pull': sync with remote (remote, ref=branch/tag, tags=true for --tags).\n" +
    "- 'tag'/'branch'/'stash': manage them (tagAction/branchAction/stashAction: list/create/delete/switch, push/pop/list).\n" +
    "- 'checkout'/'restore': switch to ref, or restore a file (path). - 'reset': soft/mixed/hard (hard snapshots first). - 'revert'/'merge'/'cherry-pick': ref.\n" +
    "- 'checkpoint': snapshots (checkpointAction: list/create/rewind/cat/versions).\n" +
    "- 'ls-remote': light remote-ref check — which refs a remote has (read-only, network). remote=<origin>, ref=<branch/tag> optional; config for a proxy.\n" +
    "- 'clone': clone a repo (remote, path optional). - 'init': init a repo. - 'rebase': rebase onto ref (rebaseAction: start/abort/continue). - 'remote': manage remotes (remoteAction: list/add/remove/set-url, remoteUrl).\n" +
    "- 'clean': remove untracked files (dryRun for -n preview). - 'switch': switch branch (create for -c). - 'apply': apply a patch (path). - 'worktree': manage worktrees (worktreeAction: list/add/remove). - 'archive': write a tar (path, ref). - 'blame': file blame (path). - 'mv': rename (path, dest).\n" +
    "- Destructive ops (checkout -- path / restore / reset --hard / stash pop / branch|tag delete / clean / rebase) auto-snapshot first — restore via checkpointAction=rewind.\n\n" +
    "**Route to git instead of bash:** `git status`→status, `git log`→log, `git diff`→diff, `git show`→show, `git add`→add, `git rm`→rm, `git commit -m`→commit, `git push <remote> <branch> <tag>`→push, `git tag`→tag, `git branch`→branch, `git checkout`→checkout, `git restore`→restore, `git stash`→stash, `git fetch/pull`→fetch/pull, `git reset`→reset, `git revert`→revert, `git merge`→merge, `git cherry-pick`→cherry-pick, `git ls-remote`→ls-remote, `git clone`→clone, `git rebase`→rebase, `git remote`→remote, `git clean`→clean, `git switch`→switch, `git apply`→apply, `git worktree`→worktree, `git archive`→archive, `git blame`→blame, `git mv`→mv.\n\n" +
    "Parameters:\n" +
    "- action (required): diff / status / log / show / checkpoint / add / rm / commit / push / tag / branch / checkout / restore / stash / fetch / pull / reset / revert / merge / cherry-pick / ls-remote / clone / init / rebase / remote / clean / switch / apply / worktree / archive / blame / mv\n" +
    "- path: (diff/log/add/commit/checkout/restore/rm/apply/archive/blame/mv/worktree) file/dir to scope/stage/restore\n" +
    "- ref: (show/diff/checkout/reset/revert/merge/cherry-pick/rebase/worktree:add/archive) commit/branch/ref; (push/pull/fetch) branch or tag (space-separated for multiple)\n" +
    "- name: (branch/tag/switch) the branch or tag name — remote: (push/fetch/pull/remote) remote name — tags: (push) push all tags\n" +
    "- workdir: run git in this workspace subdirectory (monorepo / multi-repo). No directory restrictions — paths are resolved, not restricted (TOOLS.md §10.1). Default: cwd\n" +
    "- config: (network actions push/fetch/pull/ls-remote/clone) git -c overrides, e.g. [\"http.proxy=http://10.2.2.112:3128\"] for blocked remotes\n" +
    "- staged: (diff/restore) staged copy — count/oneline: (log) — message: (commit/stash) — filter: (read-only) output-line regex\n" +
    "- mode: (reset) soft/mixed/hard — tagAction/branchAction/stashAction: the sub-action\n" +
    "- remoteAction/remoteUrl: (remote) sub-action / URL — rebaseAction: start/abort/continue — dryRun: (clean) -n preview — create: (switch) -c — dest: (mv) destination — worktreeAction: list/add/remove\n" +
    "- checkpointAction / checkpointId: (checkpoint) sub-action / snapshot id",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["diff", "status", "log", "show", "checkpoint", "add", "rm", "commit", "push", "tag", "branch", "checkout", "restore", "stash", "fetch", "pull", "reset", "revert", "merge", "cherry-pick", "ls-remote", "clone", "init", "rebase", "remote", "clean", "switch", "apply", "worktree", "archive", "blame", "mv"], description: "diff / status / log / show / checkpoint / add / rm / commit / push / tag / branch / checkout / restore / stash / fetch / pull / reset / revert / merge / cherry-pick / ls-remote / clone / init / rebase / remote / clean / switch / apply / worktree / archive / blame / mv — clean/rebase 操作前自动快照，checkpointAction=rewind 恢复" },
      staged: { type: "boolean", description: "(diff) Show staged changes instead of working tree; (restore) restore the staged copy" },
      path: { type: "string", description: "(diff/log/add/commit/checkout/restore/checkpoint:cat/versions/rewind/rm/apply/archive/blame/mv) File or directory to scope to / stage / restore（checkout/restore 操作前自动快照，checkpointAction=rewind 恢复）— add/rm/commit: space-separated for multiple（git add a b c——2026-09-05 CLI parity）" },
      ref: { type: "string", description: "(diff/show/checkout/reset/revert/merge/cherry-pick/tag:create/branch:create/rebase/worktree:add/archive) Commit/branch/ref; (push/pull/fetch) the branch or tag (space-separated for multiple)" },
      count: { type: "number", description: "(log) Number of commits (default 10)" },
      oneline: { type: "boolean", description: "(log) One-line-per-commit format" },
      message: { type: "string", description: "(commit) Commit message — required for commit; (stash:push) stash message" },
      filter: { type: "string", description: "(read-only actions) Regex to filter output lines by (case-insensitive)" },
      name: { type: "string", description: "(branch/tag/switch) The branch or tag name (create/delete/switch)" },
      remote: { type: "string", description: "(push/fetch/pull/remote/clone) Remote name (e.g. origin) or URL. Default: current upstream" },
      workdir: { type: "string", description: "Run git in this workspace subdirectory (monorepo / multi-repo). No directory restrictions. Default: cwd" },
      config: { type: "array", items: { type: "string" }, description: "(network actions: push/fetch/pull/ls-remote/clone) git -c overrides, e.g. [\"http.proxy=http://10.2.2.112:3128\"] for blocked remotes" },
      tags: { type: "boolean", description: "(push) Also push all tags (--tags)" },
      mode: { type: "string", enum: ["soft", "mixed", "hard"], description: "(reset) reset mode — hard snapshots the tree first + needs confirmation（操作前自动快照，checkpointAction=rewind 恢复）" },
      tagAction: { type: "string", enum: ["list", "create", "delete"], description: "(tag) list tags / create one / delete one（delete 操作前自动快照，checkpointAction=rewind 恢复）" },
      branchAction: { type: "string", enum: ["list", "create", "delete", "switch"], description: "(branch) list branches / create / delete / switch to one（delete 操作前自动快照，checkpointAction=rewind 恢复）" },
      stashAction: { type: "string", enum: ["push", "pop", "list"], description: "(stash) push (stash now) / pop (apply+drop) / list（pop 操作前自动快照，checkpointAction=rewind 恢复）" },
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
  async execute(args, ctx) {
    // workdir: run git in a workspace subdirectory (monorepo / multi-repo) — shadow ctx.cwd so
    // every action + snapshotBefore + checkpoint resolves against it (no boundary assertion).
    if (args.workdir) ctx = { ...ctx, cwd: resolveBaseDir(ctx.cwd, args.workdir) }
    const out = await this._execute(args, ctx)
    return out
  },

  /**
   * 判断某次 git 调用是否只读（供 execute-tools 审批过滤用）。
   * 只读 action 不弹审批：diff/status/log/show + checkpoint 的 list/cat + 只读子动作。
   */
  isReadonlyAction(args) {
    if (!args || typeof args.action !== "string") return false
    if (["diff", "status", "log", "show", "ls-remote", "blame"].includes(args.action)) return true
    // checkpoint list 有 F6 清理副作用（lazyClearIfCommitted 可能删除整个 checkpoint 目录），
    // 但清的是 commit 后已失去意义的过期快照——保留只读分类免审批（CHECKPOINT.md F6/D3 设计意图）
    if (args.action === "checkpoint") return ["list", "cat"].includes(args.checkpointAction)
    if (args.action === "tag") return args.tagAction === "list"
    if (args.action === "branch") return args.branchAction === "list"
    if (args.action === "stash") return args.stashAction === "list"
    if (args.action === "remote") return args.remoteAction === "list"
    if (args.action === "worktree") return args.worktreeAction === "list"
    return false // add/rm/commit/push/fetch/pull/reset/revert/merge/cherry-pick/checkout/restore + tag/branch/stash 写操作
  },

  /** 内部实现：执行各 action。 */
  async _execute(args, ctx) {
    // 判断是否只读（供审批过滤用）——ls-remote 是只读网络检查
    // filter 只在只读 action 上生效
    const applyFilter = (text) => {
      if (!args.filter) return text
      try {
        const re = new RegExp(args.filter, "i")
        const lines = text.split("\n").filter((l) => re.test(l))
        return lines.length ? lines.join("\n") : "(no matching lines)"
      } catch (e) {
        return `filter error: ${e.message}`
      }
    }
    const cfgArgs = gitConfigArgs(args.config)

    switch (args.action) {
      case "diff": {
        const ref = args.ref ?? "HEAD"
        if (!/^[A-Za-z0-9._/~^@][A-Za-z0-9._/~^@{}-]*$/.test(ref)) throw new Error(`Invalid git ref: ${ref}`)
        const flags = args.staged ? ["--staged"] : []
        const paths = args.path ? [args.path] : []
        const out = runGit(ctx.cwd, ["diff", ...flags, ref, "--", ...paths])
        return truncate(applyFilter(out || "(no changes)"))
      }
      case "status": {
        // Preserve per-line leading whitespace — porcelain " M"/"M " staged/unstaged markers are significant.
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
        return truncate(applyFilter(parts.join("\n\n")))
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
        return truncate(applyFilter(out || "(no commits)"))
      }
      case "show": {
        const ref = args.ref ?? "HEAD"
        if (!/^[A-Za-z0-9._/~^@][A-Za-z0-9._/~^@{}-]*$/.test(ref)) throw new Error(`Invalid git ref: ${ref}`)
        const out = runGit(ctx.cwd, ["show", "--stat", ref])
        return truncate(applyFilter(out || "(no such commit)"))
      }
      case "rm": {
        if (!args.path) return "Error: rm requires path (file to remove from tracking)"
        const paths = args.path.split(/\s+/).filter(Boolean)
        const r = runGitStrict(ctx.cwd, ["rm", "--cached", "-r", "--", ...paths])
        return r.ok ? `Removed from tracking: ${paths.join(" ")} (file kept on disk)` : `git rm failed: ${r.err || r.out}`
      }
      case "commit": {
        if (!args.message) return "Error: commit requires message"
        // Granular staging when path given (only stage these); otherwise stage all (add -A).
        // 多路径：空格分隔（ref 先例——2026-09-05 CLI parity）
        const staged = args.path ? args.path.split(/\s+/).filter(Boolean) : null
        const add = runGitStrict(ctx.cwd, staged?.length ? ["add", "--", ...staged] : ["add", "-A"])
        if (!add.ok) return `git add failed: ${add.err || add.out || "(no output)"}`
        const commit = runGitStrict(ctx.cwd, ["commit", "-m", args.message])
        if (!commit.ok) return `git commit failed: ${commit.err || "(no output)"}`
        let out = commit.out || "(commit done)"
        // F6: commit = new safety baseline — clear this project's checkpoints
        // (best-effort per NF7: a failed cleanup never blocks the commit result).
        try {
          const { deleteCheckpointsForCwd } = await import("./checkpoint.mjs")
          await deleteCheckpointsForCwd(ctx.cwd)
          out += "\n(checkpoints cleared — commit is a new safety baseline)"
        } catch (e) {
          out += `\n(checkpoint cleanup skipped: ${e.message})`
        }
        return out
      }
      case "push": {
        const cmdArgs = ["push"]
        if (args.remote) cmdArgs.push(validateRef(args.remote, "remote"))
        if (args.ref) for (const r of args.ref.split(/\s+/).filter(Boolean)) cmdArgs.push(validateRef(r, "ref"))
        if (args.tags) cmdArgs.push("--tags")
        const r = runGitStrict(ctx.cwd, cmdArgs, cfgArgs)
        return r.ok ? (r.out || "(push done)") : `git push failed: ${r.err || r.out || "(no output)"}`
      }
      case "ls-remote": {
        // Lightweight remote-ref check — read-only network action, config for proxy.
        const cmdArgs = ["ls-remote"]
        if (args.remote) cmdArgs.push(validateRef(args.remote, "remote"))
        if (args.ref) for (const r of args.ref.split(/\s+/).filter(Boolean)) cmdArgs.push(validateRef(r, "ref"))
        const out = runGit(ctx.cwd, cmdArgs, cfgArgs)
        if (!out) return "(no refs / remote unreachable)"
        return truncate(applyFilter(out))
      }
      case "add": {
        // Granular staging: stage `path` when given, else all changes (add -A).
        // 多路径：空格分隔（ref 先例——2026-09-05 CLI parity——git add 单路径被迫 N 次调用）
        const paths = args.path ? args.path.split(/\s+/).filter(Boolean) : null
        const cmdArgs = paths?.length ? ["add", "--", ...paths] : ["add", "-A"]
        const r = runGitStrict(ctx.cwd, cmdArgs)
        return r.ok ? (r.out || `Staged ${paths?.join(" ") || "all changes"}`) : `git add failed: ${r.err || r.out}`
      }
      case "tag": {
        const sub = args.tagAction
        if (sub === "list") return truncate(applyFilter(runGit(ctx.cwd, ["tag", "-l"]) || "(no tags)"))
        if (sub === "create") {
          if (!args.name) return "Error: tag create requires name"
          validateRef(args.name, "tag")
          const cmdArgs = ["tag", args.name]
          if (args.ref) cmdArgs.push(validateRef(args.ref))
          const r = runGitStrict(ctx.cwd, cmdArgs)
          return r.ok ? `Tag ${args.name} created` : `git tag failed: ${r.err || r.out}`
        }
        if (sub === "delete") {
          if (!args.name) return "Error: tag delete requires name"
          validateRef(args.name, "tag")
          const snap = await snapshotBefore(ctx, `tag delete ${args.name}`)
          const r = runGitStrict(ctx.cwd, ["tag", "-d", args.name])
          return r.ok ? snap + `Tag ${args.name} deleted` : `git tag -d failed: ${r.err || r.out}`
        }
        return "Error: tag requires tagAction — use: list | create | delete"
      }
      case "branch": {
        const sub = args.branchAction
        if (sub === "list") return truncate(applyFilter(runGit(ctx.cwd, ["branch", "--all", "-vv"]) || "(no branches)"))
        if (sub === "create") {
          if (!args.name) return "Error: branch create requires name"
          validateRef(args.name, "branch")
          const cmdArgs = ["branch", args.name]
          if (args.ref) cmdArgs.push(validateRef(args.ref))
          const r = runGitStrict(ctx.cwd, cmdArgs)
          return r.ok ? `Branch ${args.name} created` : `git branch failed: ${r.err || r.out}`
        }
        if (sub === "switch") {
          if (!args.name) return "Error: branch switch requires name"
          validateRef(args.name, "branch")
          const r = runGitStrict(ctx.cwd, ["checkout", args.name])
          return r.ok ? `Switched to branch ${args.name}` : `git checkout ${args.name} failed: ${r.err || r.out}`
        }
        if (sub === "delete") {
          if (!args.name) return "Error: branch delete requires name"
          validateRef(args.name, "branch")
          const snap = await snapshotBefore(ctx, `branch delete ${args.name}`)
          const r = runGitStrict(ctx.cwd, ["branch", "-d", args.name])
          return r.ok ? snap + `Branch ${args.name} deleted` : `git branch -d failed: ${r.err || r.out}`
        }
        return "Error: branch requires branchAction — use: list | create | delete | switch"
      }
      case "checkout": {
        if (args.path) {
          // Restore file from index (discards working-tree changes to it) — destructive: snapshot first.
          const snap = await snapshotBefore(ctx, `checkout -- ${args.path}`)
          const r = runGitStrict(ctx.cwd, ["checkout", "--", args.path])
          return r.ok ? snap + `Restored ${args.path}` : `git checkout -- ${args.path} failed: ${r.err || r.out}`
        }
        if (args.ref) {
          validateRef(args.ref, "ref")
          const r = runGitStrict(ctx.cwd, ["checkout", args.ref])
          return r.ok ? (r.out || `Checked out ${args.ref}`) : `git checkout ${args.ref} failed: ${r.err || r.out}`
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
        return r.ok ? snap + `Restored ${args.path}` : `git restore failed: ${r.err || r.out}`
      }
      case "stash": {
        const sub = args.stashAction
        if (sub === "list") return truncate(applyFilter(runGit(ctx.cwd, ["stash", "list"]) || "(no stashes)"))
        if (sub === "push") {
          const cmdArgs = ["stash", "push"]
          if (args.message) cmdArgs.push("-m", args.message)
          const r = runGitStrict(ctx.cwd, cmdArgs)
          return r.ok ? (r.out || "Stashed") : `git stash push failed: ${r.err || r.out}`
        }
        if (sub === "pop") {
          const snap = await snapshotBefore(ctx, "stash pop")
          const r = runGitStrict(ctx.cwd, ["stash", "pop"])
          return r.ok ? snap + (r.out || "Popped") : `git stash pop failed: ${r.err || r.out}`
        }
        return "Error: stash requires stashAction — use: push | pop | list"
      }
      case "fetch": {
        const cmdArgs = ["fetch"]
        if (args.remote) cmdArgs.push(validateRef(args.remote, "remote"))
        if (args.ref) cmdArgs.push(validateRef(args.ref))
        const r = runGitStrict(ctx.cwd, cmdArgs, cfgArgs)
        return r.ok ? (r.out || "(fetch complete — no output)") : `git fetch failed: ${r.err || r.out}`
      }
      case "pull": {
        const cmdArgs = ["pull"]
        if (args.remote) cmdArgs.push(validateRef(args.remote, "remote"))
        if (args.ref) cmdArgs.push(validateRef(args.ref))
        const r = runGitStrict(ctx.cwd, cmdArgs, cfgArgs)
        return r.ok ? (r.out || "(pull complete — no output)") : `git pull failed: ${r.err || r.out}`
      }
      case "reset": {
        const mode = args.mode ?? "mixed"
        if (!["soft", "mixed", "hard"].includes(mode)) return "Error: reset mode must be soft | mixed | hard"
        let snap = ""
        if (mode === "hard") snap = await snapshotBefore(ctx, "reset --hard") // destructive: drops working-tree changes
        const cmdArgs = ["reset", `--${mode}`]
        if (args.ref) cmdArgs.push(validateRef(args.ref))
        const r = runGitStrict(ctx.cwd, cmdArgs)
        return r.ok ? snap + (r.out || `Reset (${mode}) complete`) : `git reset failed: ${r.err || r.out}`
      }
      case "revert": {
        const ref = validateRef(args.ref ?? "HEAD")
        const r = runGitStrict(ctx.cwd, ["revert", "--no-edit", ref])
        return r.ok ? (r.out || `Reverted ${ref}`) : `git revert failed: ${r.err || r.out}`
      }
      case "merge": {
        if (!args.ref) return "Error: merge requires ref (branch/commit to merge)"
        validateRef(args.ref, "ref")
        const r = runGitStrict(ctx.cwd, ["merge", "--no-edit", args.ref])
        return r.ok ? (r.out || `Merged ${args.ref}`) : `git merge failed: ${r.err || r.out} — resolve conflicts, then commit`
      }
      case "cherry-pick": {
        if (!args.ref) return "Error: cherry-pick requires ref (commit)"
        validateRef(args.ref, "ref")
        const r = runGitStrict(ctx.cwd, ["cherry-pick", args.ref])
        return r.ok ? (r.out || `Cherry-picked ${args.ref}`) : `git cherry-pick failed: ${r.err || r.out}`
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
