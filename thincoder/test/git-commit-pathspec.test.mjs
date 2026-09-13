/**
 * git-commit-pathspec.test.mjs — QUICKFIX-BATCH-2 F-3：git commit path → commit --only
 * <paths>（工作树列文件——忽略索引他批——原子）。用例：他批 pre-staged 不混入 / 多文件 /
 * 空与空白 path 错误 / untracked 须先 add / 无 path 回归。真 git 子进程——slow 归册。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { slow } from "./slow.mjs"
import { gitTool } from "../src/tools/git.mjs"

function git(repo, ...args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
}

let repo
before(() => {
  repo = mkdtempSync(join(tmpdir(), "tc-git-pc-"))
  git(repo, "init", "-q")
  git(repo, "config", "user.email", "t@t")
  git(repo, "config", "user.name", "t")
  for (const f of ["a.txt", "b.txt", "c.txt"]) writeFileSync(join(repo, f), f[0] + "0\n")
  git(repo, "add", "-A")
  git(repo, "commit", "-q", "-m", "base")
})
after(() => { try { rmSync(repo, { recursive: true, force: true }) } catch { /* ignore */ } })

slow("F-3 path 给定 + 索引他批 pre-staged → 只提交列文件（commit --only 原子——他批不混入不丢失）", async () => {
  writeFileSync(join(repo, "a.txt"), "a1\n")
  writeFileSync(join(repo, "b.txt"), "b1\n")
  git(repo, "add", "b.txt") // 他批 pre-staged——不得混入本次提交
  const out = await gitTool.execute({ action: "commit", path: "a.txt", message: "only a" }, { cwd: repo })
  assert.ok(!out.startsWith("git commit failed") && !out.startsWith("git add failed"), out)
  assert.deepEqual(git(repo, "diff", "HEAD^", "HEAD", "--name-only").split("\n"), ["a.txt"], "提交只含列文件")
  assert.deepEqual(git(repo, "diff", "--cached", "--name-only").split("\n"), ["b.txt"], "a.txt 索引已随 commit 刷新为提交内容；他批 b.txt 仍 staged（不混入不丢失）")
})

slow("F-3 多文件空格分隔 → 一次 commit --only 两个路径（他批仍不混入）", async () => {
  writeFileSync(join(repo, "a.txt"), "a2\n")
  writeFileSync(join(repo, "c.txt"), "c2\n")
  const out = await gitTool.execute({ action: "commit", path: "a.txt c.txt", message: "a and c" }, { cwd: repo })
  assert.ok(!out.includes("failed"), out)
  assert.equal(git(repo, "log", "-1", "--format=%s"), "a and c")
  assert.deepEqual(git(repo, "diff", "HEAD^", "HEAD", "--name-only").split("\n").sort(), ["a.txt", "c.txt"])
  assert.deepEqual(git(repo, "diff", "--cached", "--name-only").split("\n"), ["b.txt"], "b.txt 仍 staged——未混入")
})

slow("F-3 空/空白 path（\"\" 与 \"   \"）→ 明确错误——不回落 add -A（无提交、无暂存）", async () => {
  writeFileSync(join(repo, "a.txt"), "a3\n")
  const head = git(repo, "log", "-1", "--format=%s")
  for (const bad of ["", "   "]) {
    const out = await gitTool.execute({ action: "commit", path: bad, message: "should not land" }, { cwd: repo })
    assert.equal(out, "Error: commit path is empty/whitespace — give at least one file path (space-separated)", `path=${JSON.stringify(bad)}`)
    assert.equal(git(repo, "log", "-1", "--format=%s"), head, "无提交产生")
  }
  assert.deepEqual(git(repo, "diff", "--name-only").split("\n"), ["a.txt"], "改动仍 unstaged——未 add -A")
})

slow("F-3 untracked 新文件 + path → 明确失败（pathspec 不识未跟踪路径）；add 本批后 --only 原子可提", async () => {
  writeFileSync(join(repo, "new.txt"), "n1\n")
  const fail = await gitTool.execute({ action: "commit", path: "new.txt", message: "should not land" }, { cwd: repo })
  assert.ok(fail.startsWith("git commit failed:"), fail) // pathspec 失败 → 零副作用（无提交）
  git(repo, "add", "new.txt")
  const ok = await gitTool.execute({ action: "commit", path: "new.txt", message: "new file" }, { cwd: repo })
  assert.ok(!ok.includes("failed"), ok)
  assert.deepEqual(git(repo, "diff", "HEAD^", "HEAD", "--name-only").split("\n"), ["new.txt"], "只提交本批新文件")
})

slow("F-3 无 path → add -A 全量提交（保留行为——含 untracked 与残留 staged）", async () => {
  writeFileSync(join(repo, "d.txt"), "d0\n") // untracked
  writeFileSync(join(repo, "a.txt"), "a4\n")
  const out = await gitTool.execute({ action: "commit", message: "all changes" }, { cwd: repo })
  assert.ok(!out.includes("failed"), out)
  assert.equal(git(repo, "log", "-1", "--format=%s"), "all changes")
  assert.deepEqual(git(repo, "diff", "HEAD^", "HEAD", "--name-only").split("\n").sort(), ["a.txt", "b.txt", "d.txt"], "全量（含他批残留 staged + untracked）")
})
