/**
 * tools-ide-changes.test.mjs — VSC `ide` 工具 changes 路径（A27 的 VSC 半 · TOOLS.md §6.14 · 台账 #207）。
 * 核 `runGit` 转异步薄壳 ⇒ 本端唯一消费方 `changesSection` 同批转 async + 1 处 `await`（`:70`
 * `collectSection` 已 async ⇒ 扇出受控；`:48` 调用面零改）。
 * 三格（经 `ideTool.execute({what:"changes"}, {cwd})` **真工具面**）：① 未提交变更 ⇒ 出段 ② 洁净 ⇒
 * 不出该段 ③ 非仓 ⇒ 不出该段、零抛错（catch 路）。夹具 = temp `git init` 仓（真 git 子进程）。
 * 中间态红（防漏改的判据）：核已 async ∧ 本端未转 ⇒ `porcelain` = Promise、`split` 在 try 之外抛 ⇒
 * 输出变 `(error: …)`（本档 ① 的 `doesNotMatch /\(error:/` 即该位）。
 */
import { after } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { ideTool } from "../src/tools/ide.mjs"

const dirs = []
after(() => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* Windows 句柄滞后——tmp 自回收 */ } } })

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()

/** 真 git 仓：tracked.txt 一枚初始提交。 */
function repo(prefix) {
  const cwd = mkdtempSync(join(tmpdir(), prefix))
  dirs.push(cwd)
  git(cwd, "init", "-q", "-b", "main")
  git(cwd, "config", "user.email", "ide@test.invalid")
  git(cwd, "config", "user.name", "ide")
  git(cwd, "config", "commit.gpgsign", "false")
  writeFileSync(join(cwd, "tracked.txt"), "one\n")
  git(cwd, "add", "-A"); git(cwd, "commit", "-qm", "init")
  return cwd
}

slow("T-IDE1 未提交变更 ⇒ `## 未提交变更 (N)` + 文件名行（零 error 段 = 中间态红位）", async () => {
  const cwd = repo("vsc-ide-")
  writeFileSync(join(cwd, "tracked.txt"), "two\n")
  writeFileSync(join(cwd, "new.txt"), "n\n")
  const out = await ideTool.execute({ what: "changes" }, { cwd })
  assert.doesNotMatch(String(out), /\(error:/, `零 error 段（out: ${String(out).slice(0, 160)}）`)
  assert.match(String(out), /^## 未提交变更 \(2\)$/m, "段头 + 计数")
  assert.match(String(out), /^M tracked\.txt$/m, "已跟踪改动行（首行 porcelain 列空位被 `runGit` 整体 trim 吞——批前同形，非本批改动）")
  assert.match(String(out), /^\?\? new\.txt$/m, "未跟踪行")
})

slow("T-IDE2 洁净仓 ⇒ 不出该段（changesSection 返回 null ⇒ 会话兜底串）", async () => {
  const cwd = repo("vsc-ide-clean-")
  const out = await ideTool.execute({ what: "changes" }, { cwd })
  assert.doesNotMatch(String(out), /未提交变更/, `洁净不出段（out: ${String(out).slice(0, 120)}）`)
})

slow("T-IDE3 非仓 cwd ⇒ 不出该段、零抛错（catch 路）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "vsc-ide-norepo-"))
  dirs.push(cwd)
  const out = await ideTool.execute({ what: "changes" }, { cwd })
  assert.doesNotMatch(String(out), /未提交变更/)
  assert.doesNotMatch(String(out), /\(error:/, "非仓零抛错（catch 返回 null）")
})
