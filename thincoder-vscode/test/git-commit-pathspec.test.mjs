/**
 * git-commit-pathspec.test.mjs — 群 A 批 A9（VSC-MIRROR-SWEEP）。
 * 设计权威：`docs/design/TOOLS.md` §11（契约 1–5 / 用例 T-MA9-1–5 / AC-MA9-1–3）。
 *
 * 覆盖：commit `--only` 镜像（列文件提交——索引他批不混入）+ 空/空白 path 明确错误（零回落
 * 全量、零副作用）+ 无 path 全量零回归 + untracked path 错误形态。
 * 真 git 子进程（本档用例 = slow 归册——快层 skip，`npm run test:full` 跑）。
 */
import { after } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { gitTool } from "@thincoder/core/tools/git.mjs" // W14：核面单源（本端镜像已删）

const dirs = []
after(() => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* Windows 句柄滞后——tmp 自回收 */ } } })

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
const write = (cwd, rel, body) => writeFileSync(join(cwd, rel), body, "utf8")

/** 真 git 仓：初始提交 a.txt / b.txt。 */
function repo(prefix) {
  const cwd = mkdtempSync(join(tmpdir(), prefix))
  dirs.push(cwd)
  git(cwd, "init", "-q")
  git(cwd, "config", "user.email", "a9@test.invalid")
  git(cwd, "config", "user.name", "a9")
  write(cwd, "a.txt", "a1\n")
  write(cwd, "b.txt", "b1\n")
  git(cwd, "add", "-A")
  git(cwd, "commit", "-qm", "init")
  return cwd
}
const head = (cwd) => git(cwd, "rev-parse", "HEAD")
const namesOf = (cwd, ref) => git(cwd, "diff", "--name-only", ...ref.split(" ")).split("\n").filter(Boolean)

// ─── T-MA9-1 正常：path → 只提交列文件（他批 staged 不混入不丢失）─────────────────

slow("T-MA9-1 path 提交：只含列文件；他批 pre-staged 仍留在索引（不混入）", async () => {
  const cwd = repo("a9-t1-")
  write(cwd, "a.txt", "a2\n")
  write(cwd, "b.txt", "b2\n")
  git(cwd, "add", "b.txt") // 他批 pre-staged
  const out = await gitTool.execute({ action: "commit", message: "A9 only a", path: "a.txt" }, { cwd })
  assert.ok(!String(out).startsWith("Error"), `提交成功（out: ${out}）`)
  assert.deepEqual(namesOf(cwd, "HEAD^ HEAD"), ["a.txt"], "HEAD 提交只含 a.txt")
  assert.equal(git(cwd, "log", "-1", "--format=%s"), "A9 only a")
  assert.deepEqual(namesOf(cwd, "HEAD"), ["b.txt"], "b.txt 仍 staged（不混入不丢失）")
})

// ─── T-MA9-2 正常：多文件空格分隔 ─────────────────────────────────────────────

slow("T-MA9-2 多路径：`path:'a.txt c.txt'` 一次 --only 两路径（他批 staged 仍不混入）", async () => {
  const cwd = repo("a9-t2-")
  write(cwd, "c.txt", "c1\n")
  git(cwd, "add", "c.txt")
  git(cwd, "commit", "-qm", "add c")
  write(cwd, "a.txt", "a3\n")
  write(cwd, "c.txt", "c2\n")
  write(cwd, "b.txt", "b3\n")
  git(cwd, "add", "b.txt") // 他批 pre-staged
  await gitTool.execute({ action: "commit", message: "A9 two", path: "a.txt c.txt" }, { cwd })
  assert.deepEqual(namesOf(cwd, "HEAD^ HEAD").sort(), ["a.txt", "c.txt"], "两路径同批提交")
  assert.deepEqual(namesOf(cwd, "HEAD"), ["b.txt"], "他批 staged 不入本次提交")
})

// ─── T-MA9-3 边界：空/纯空白 path → 逐字错误 + 零副作用 ────────────────────────

slow("T-MA9-3 空/空白 path：逐字错误串 + 无提交产生 + 零 add -A 副作用", async () => {
  const cwd = repo("a9-t3-")
  write(cwd, "a.txt", "a4\n")
  const before = head(cwd)
  const expected = "Error: commit path is empty/whitespace — give at least one file path (space-separated)"
  assert.equal(await gitTool.execute({ action: "commit", message: "x", path: "" }, { cwd }), expected, "空串 → 逐字错误")
  assert.equal(await gitTool.execute({ action: "commit", message: "x", path: "   " }, { cwd }), expected, "纯空白 → 逐字错误")
  assert.equal(head(cwd), before, "无提交产生")
  assert.deepEqual(git(cwd, "diff", "--name-only", "--cached").split("\n").filter(Boolean), [], "索引零新增（零 add -A 副作用）")
  assert.deepEqual(namesOf(cwd, "HEAD"), ["a.txt"], "改动仍留在工作树（未 stage）")
})

// ─── T-MA9-4 错误：untracked + path → pathspec 错误（add 后可提）────────────────

slow("T-MA9-4 untracked + path：git commit failed 报错；add 后可提（零偶发副作用）", async () => {
  const cwd = repo("a9-t4-")
  write(cwd, "n.txt", "n1\n")
  const before = head(cwd)
  const out = await gitTool.execute({ action: "commit", message: "n", path: "n.txt" }, { cwd })
  assert.match(String(out), /^git commit failed:/, "--only 不识未跟踪（pathspec）→ 明确失败")
  assert.equal(head(cwd), before, "失败零提交")
  git(cwd, "add", "n.txt")
  const ok = await gitTool.execute({ action: "commit", message: "n2", path: "n.txt" }, { cwd })
  assert.ok(!String(ok).startsWith("Error"), "add 后可提（错误可恢复）")
  assert.deepEqual(namesOf(cwd, "HEAD^ HEAD"), ["n.txt"])
})

// ─── T-MA9-5 边界（回归）：无 path → add -A 全量（含 untracked 与他批 staged）────

slow("T-MA9-5 无 path：全量语义零回归（untracked + 他批 staged 同入）", async () => {
  const cwd = repo("a9-t5-")
  write(cwd, "a.txt", "a5\n")
  write(cwd, "new.txt", "new\n") // untracked
  write(cwd, "b.txt", "b5\n")
  git(cwd, "add", "b.txt") // 他批 staged
  await gitTool.execute({ action: "commit", message: "A9 full" }, { cwd })
  assert.deepEqual(namesOf(cwd, "HEAD^ HEAD").sort(), ["a.txt", "b.txt", "new.txt"], "全量提交（零回归）")
  assert.equal(git(cwd, "status", "--porcelain"), "", "工作树与索引齐净")
})
