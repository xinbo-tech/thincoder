/**
 * git-ext.mjs — git 工具 F7 扩展 action（clone/init/rebase/remote/clean/switch/apply/worktree/
 * archive/blame/mv）+ 共享 git 辅助函数（validateRef/runGitStrict/filterLines/snapshotBefore，
 * 供 git.mjs 核心 action 复用——500 行硬限拆分）。CLI 与 VS Code 两端同构（镜像，修改须两端同批）。
 */
import { runGit, truncate } from "./shared.mjs"
import { execFileSync } from "node:child_process"

/** Keep only output lines matching a regex (git filter, case-insensitive). */
export function filterLines(output, filter) {
  if (!filter) return output
  try {
    const re = new RegExp(filter, "i")
    const lines = output.split("\n").filter((l) => re.test(l))
    return lines.length ? lines.join("\n") : `(no lines matched filter "${filter}")`
  } catch (e) {
    return `Error: filter regex invalid: ${e.message}`
  }
}

/** Run git and report failure (stderr + exit code) instead of swallowing it.
 *  Used by write ops (commit/push/rm) where a silent "" would masquerade as success. */
export function runGitStrict(cwd, cmdArgs, config = []) {
  try {
    const out = execFileSync("git", [...config, ...cmdArgs], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim().replace(/\r/g, "")
    return { ok: true, out }
  } catch (e) {
    return { ok: false, out: String(e.stdout || "").trim(), err: String(e.stderr || e.message || "").trim() }
  }
}

/** Validate a git ref / branch / tag / remote name (no option injection, no whitespace). */
export function validateRef(ref, what = "git ref") {
  if (!/^[A-Za-z0-9._/~^@][A-Za-z0-9._/~^@{}-]*$/.test(ref)) throw new Error(`Invalid ${what}: ${ref}`)
  return ref
}

/** Normalize args.config into `-c key=value` pairs (git -c overrides, e.g. a proxy).
 *  Values are execFileSync array args (no shell injection) — still reject newlines/empty. */
export function gitConfigArgs(config) {
  if (config == null) return []
  if (!Array.isArray(config)) throw new Error("config must be an array of \"key=value\" strings")
  const out = []
  for (const c of config) {
    if (typeof c !== "string" || !c.trim() || c.includes("\n")) throw new Error(`invalid git -c config entry: ${String(c).slice(0, 60)}`)
    out.push("-c", c)
  }
  return out
}

/** Snapshot the working tree before a destructive op (reset --hard / checkout file / restore /
 *  stash pop / branch|tag delete / clean / rebase). Best-effort — a snapshot failure must not
 *  block the op (the approval/permission layer is the real gate). Returns a note line or "". */
export async function snapshotBefore(ctx, label) {
  try {
    const { createCheckpoint, isGitRepo } = await import("../git/checkpoint.mjs")
    if (!isGitRepo(ctx.cwd)) return ""
    const cp = await createCheckpoint(ctx.cwd)
    return `[snapshot ${cp.id} created before ${label}]\n`
  } catch {
    return ""
  }
}

/** F7 扩展 action 主入口（git 工具 switch 的 fall-through 组委托到这里）。 */
export async function executeExtAction(args, ctx) {
  switch (args.action) {
    case "clone": {
      // Clone a repo into a NEW directory — non-destructive (never touches existing work).
      if (!args.remote) return "Error: clone requires remote (URL or local path)"
      const cmdArgs = ["clone", args.remote]
      if (args.path) cmdArgs.push(args.path)
      const r = runGitStrict(ctx.cwd, cmdArgs, gitConfigArgs(args.config))
      return r.ok ? truncate(r.out || `Cloned ${args.remote}`) : truncate(`git clone failed: ${r.err || r.out}`)
    }
    case "init": {
      const r = runGitStrict(ctx.cwd, ["init"])
      return r.ok ? truncate(r.out || "Initialized empty git repository") : truncate(`git init failed: ${r.err || r.out}`)
    }
    case "rebase": {
      // Belt-and-braces snapshot: bare rebase refuses uncommitted changes (unless
      // --autostash), but --autostash restore-failure / interrupted-rebase scenarios
      // can leave the working tree damaged — the snapshot makes that recoverable.
      // The snapshot line is included on FAILURE too: a rejected rebase (unstaged
      // changes) is exactly when the model must know its work is protected (F1 loop).
      const snap = await snapshotBefore(ctx, "rebase")
      const sub = args.rebaseAction ?? "start"
      const cmdArgs = ["rebase"]
      if (sub === "abort") cmdArgs.push("--abort")
      else if (sub === "continue") cmdArgs.push("--continue")
      else { if (!args.ref) return "Error: rebase requires ref (branch/commit to rebase onto)"; cmdArgs.push(validateRef(args.ref)) }
      const r = runGitStrict(ctx.cwd, cmdArgs)
      return r.ok ? truncate(snap + (r.out || `Rebase ${sub} complete`)) : truncate(snap + `git rebase failed: ${r.err || r.out} — use rebaseAction=abort to abort`)
    }
    case "remote": {
      const sub = args.remoteAction ?? "list"
      if (sub === "list") return truncate(filterLines(runGit(ctx.cwd, ["remote", "-v"]) || "(no remotes)", args.filter))
      if (!args.remote) return `Error: remote ${sub} requires remote (name)`
      validateRef(args.remote, "remote name")
      if (sub === "add" || sub === "set-url") {
        if (!args.remoteUrl) return `Error: remote ${sub} requires remoteUrl`
        const r = runGitStrict(ctx.cwd, ["remote", sub === "add" ? "add" : "set-url", args.remote, args.remoteUrl])
        return r.ok ? `Remote ${args.remote} ${sub === "add" ? "added" : "URL set"}` : truncate(`git remote ${sub} failed: ${r.err || r.out}`)
      }
      if (sub === "remove") {
        const r = runGitStrict(ctx.cwd, ["remote", "remove", args.remote])
        return r.ok ? `Remote ${args.remote} removed` : truncate(`git remote remove failed: ${r.err || r.out}`)
      }
      return "Error: remote requires remoteAction — use: list | add | remove | set-url"
    }
    case "clean": {
      // Destructive: removes untracked files/dirs — snapshot first (guard parity).
      // dryRun (-n) is a preview: no deletion, no snapshot.
      const snap = args.dryRun ? "" : await snapshotBefore(ctx, "clean")
      const cmdArgs = ["clean", args.dryRun ? "-n" : "-f", "-d"]
      const r = runGitStrict(ctx.cwd, cmdArgs)
      return r.ok ? truncate(snap + (r.out || (args.dryRun ? "Nothing to clean (dry run)" : "Clean complete"))) : truncate(snap + `git clean failed: ${r.err || r.out}`)
    }
    case "switch": {
      if (!args.name) return "Error: switch requires name (branch)"
      validateRef(args.name, "branch")
      const cmdArgs = ["switch"]
      if (args.create) cmdArgs.push("-c")
      cmdArgs.push(args.name)
      const r = runGitStrict(ctx.cwd, cmdArgs)
      return r.ok ? truncate(r.out || `Switched to branch ${args.name}`) : truncate(`git switch failed: ${r.err || r.out}`)
    }
    case "apply": {
      // Apply a patch — non-destructive (fails cleanly on conflict, applies nothing).
      if (!args.path) return "Error: apply requires path (patch file)"
      const r = runGitStrict(ctx.cwd, ["apply", "--", args.path])
      return r.ok ? truncate(r.out || `Applied ${args.path}`) : truncate(`git apply failed: ${r.err || r.out}`)
    }
    case "worktree": {
      const sub = args.worktreeAction ?? "list"
      if (sub === "list") return truncate(filterLines(runGit(ctx.cwd, ["worktree", "list"]) || "(no worktrees)", args.filter))
      if (sub === "add") {
        if (!args.path) return "Error: worktree add requires path (new worktree directory)"
        const cmdArgs = ["worktree", "add", args.path]
        if (args.ref) cmdArgs.push(validateRef(args.ref))
        const r = runGitStrict(ctx.cwd, cmdArgs)
        return r.ok ? truncate(r.out || `Worktree added at ${args.path}`) : truncate(`git worktree add failed: ${r.err || r.out}`)
      }
      if (sub === "remove") {
        if (!args.path) return "Error: worktree remove requires path"
        const r = runGitStrict(ctx.cwd, ["worktree", "remove", args.path])
        return r.ok ? truncate(r.out || `Worktree removed: ${args.path}`) : truncate(`git worktree remove failed: ${r.err || r.out}`)
      }
      return "Error: worktree requires worktreeAction — use: list | add | remove"
    }
    case "archive": {
      // Write a tar of a commit/branch — non-destructive (output file only).
      if (!args.path) return "Error: archive requires path (output file)"
      const cmdArgs = ["archive", "--format=tar", "-o", args.path]
      if (args.ref) cmdArgs.push(validateRef(args.ref))
      else cmdArgs.push("HEAD")
      const r = runGitStrict(ctx.cwd, cmdArgs)
      return r.ok ? truncate(r.out || `Archived ${args.ref ?? "HEAD"} to ${args.path}`) : truncate(`git archive failed: ${r.err || r.out}`)
    }
    case "blame": {
      if (!args.path) return "Error: blame requires path (file)"
      const out = runGit(ctx.cwd, ["blame", "--", args.path])
      return truncate(out || `(no blame output for ${args.path})`)
    }
    case "mv": {
      if (!args.path || !args.dest) return "Error: mv requires path (source) and dest (destination)"
      const r = runGitStrict(ctx.cwd, ["mv", "--", args.path, args.dest])
      return r.ok ? truncate(r.out || `Moved ${args.path} → ${args.dest}`) : truncate(`git mv failed: ${r.err || r.out}`)
    }
    default:
      throw new Error(`Unknown ext action: ${args.action}`)
  }
}
