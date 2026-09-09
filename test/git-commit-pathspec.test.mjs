/**
 * git-commit-pathspec.test.mjs — QUICKFIX-BATCH-2 F-3（docs/design/QUICKFIX-BATCH-2.md）：
 * git 工具 commit 的 path 参数 → git commit --only <paths>——从工作树取列文件提交（忽略索引
 * 他批——原子——并行批不混扫——不再先 add）。用例：path + 索引他批 pre-staged → 只提交列文件；
 * 多文件空格分隔；空/空白 path → 明确错误；无 path → add -A 全量（保留行为——单代理语义）。
 * 真 git 子进程 —— slow 归册（npm test 快层 skip；test:full / THINCODER_TEST_FULL=1 放行）。
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
  assert.equal(git(repo, "log", "-1", "--format=%s"), "only a")
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

slow("F-3 空/空白 path → 明确错误——不回落 add -A（无提交、无暂存）", async () => {
  writeFileSync(join(repo, "a.txt"), "a3\n")
  const head = git(repo, "log", "-1", "--format=%s")
  const out = await gitTool.execute({ action: "commit", path: "   ", message: "should not land" }, { cwd: repo })
  assert.equal(out, "Error: commit path is empty/whitespace — give at least one file path (space-separated)")
  assert.equal(git(repo, "log", "-1", "--format=%s"), head, "无提交产生")
  assert.deepEqual(git(repo, "diff", "--name-only").split("\n"), ["a.txt"], "改动仍 unstaged——未 add -A")
})

slow("F-3 无 path → add -A 全量提交（保留行为——含 untracked 与残留 staged）", async () => {
  writeFileSync(join(repo, "d.txt"), "d0\n") // untracked
  writeFileSync(join(repo, "a.txt"), "a4\n")
  const out = await gitTool.execute({ action: "commit", message: "all changes" }, { cwd: repo })
  assert.ok(!out.includes("failed"), out)
  assert.equal(git(repo, "log", "-1", "--format=%s"), "all changes")
  assert.deepEqual(git(repo, "diff", "HEAD^", "HEAD", "--name-only").split("\n").sort(), ["a.txt", "b.txt", "d.txt"], "全量（含他批残留 staged + untracked）")
})
