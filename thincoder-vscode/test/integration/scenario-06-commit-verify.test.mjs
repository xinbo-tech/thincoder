/**
 * scenario-06-commit-verify.test.mjs — 集成场景 ⑥「commit / 验证关口」VSC 实例。
 *
 * 设计权威：`docs/design/TESTING.md` §4 场景表（本端驱动面 = 本端 git 工具面 + verify 镜像面；
 * **commit 镜像缺口在案（TODO）——本场景不覆盖缺口修复**）；共享语义源 = CLI 侧
 * `docs/design/TESTING.md` §5.6（三态：正常 / 边界 / 错误）。
 *
 * 三态：
 *   正常 —— 真 git 临时仓：commit 带 path 只纳入列出的文件改动，他批未暂存改动不入 HEAD
 *           且不丢失（**注**：CLI 侧 `--only` pathspec 不混入「他批 pre-staged」的分支属
 *           VSC commit 镜像缺口（技术待办）——本场景不覆盖，断言只钉本端已支持的语义）；
 *   边界 —— verify{skipped} 带理由放行 / 不带理由拒绝（两分支输出）；
 *   错误 —— verify{failed} 拒绝（判定旗位 false + 引导串）。
 */
import { test, before, after, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { gitTool } from "../../src/tools/git.mjs"
import { verifyTool } from "@thincoder/core/agent-tools/verify.mjs"

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim()

let repo
let plain

before(() => {
  repo = mkdtempSync(join(tmpdir(), "tc-integ-git-"))
  git(repo, "init", "-q")
  git(repo, "config", "user.email", "integration@test.local")
  git(repo, "config", "user.name", "integration")
  git(repo, "config", "commit.gpgsign", "false")
})
after(() => rmSync(repo, { recursive: true, force: true }))

beforeEach(() => { plain = mkdtempSync(join(tmpdir(), "tc-integ-verify-")) })
afterEach(() => rmSync(plain, { recursive: true, force: true }))

test("⑥ 正常：commit 带 path——列出的改动入 HEAD，他批未暂存改动不入且不丢失", async () => {
  writeFileSync(join(repo, "readme.txt"), "第一版\n", "utf8")
  git(repo, "add", "readme.txt")
  git(repo, "commit", "-q", "-m", "初始提交")
  // 本任务改动 + 他批并行改动（未暂存——他批工作现场）
  writeFileSync(join(repo, "readme.txt"), "第二版\n", "utf8")
  writeFileSync(join(repo, "left.txt"), "他批现场\n", "utf8")

  const out = await gitTool.execute({ action: "commit", message: "改 readme", path: "readme.txt" }, { cwd: repo, agent: {} })
  assert.ok(/master|main|\[/.test(out) || out.includes("readme"), `commit 正常返回（实到：${out.slice(0, 120)}）`)

  assert.equal(git(repo, "show", "HEAD:readme.txt"), "第二版", "列出的文件改动已入 HEAD")
  const headFiles = git(repo, "show", "--name-only", "--format=", "HEAD").split("\n").filter(Boolean)
  assert.deepEqual(headFiles, ["readme.txt"], "HEAD 只含列出的文件（他批文件不混入）")
  assert.equal(existsSync(join(repo, "left.txt")), true, "他批文件仍在盘上（不丢失）")
  assert.equal(readFileSync(join(repo, "left.txt"), "utf8"), "他批现场\n", "他批内容原样保留")
  const status = git(repo, "status", "--porcelain")
  assert.match(status, /^\?\? left\.txt$/m, "他批改动仍留在工作区（未被他批 commit 吞掉）")
})

test("⑥ 边界：verify skipped 带理由 → 放行（标记理由）；不带理由 → 拒绝（空跳过不允许）", async () => {
  const file = join(plain, "app.js")
  writeFileSync(file, "export const x = 1\n", "utf8")
  // W9：核 verify 载体面 = `ctx.agent.cwd` + `agent.tasks`（原端面 ctx.cwd/_tasks）；文案随核实现（W9 单源）
  const agent = { cwd: plain, _touchedFiles: [file], tasks: [] }

  const released = await verifyTool.execute(
    { verification: { status: "skipped", summary: "本项目无自动化检查——已人工通读改动" } },
    { agent, cwd: plain },
  )
  assert.match(released, /Verification skipped with reason: 本项目无自动化检查/, "带理由放行并标记理由")
  assert.equal(agent._verifyPassed, true, "放行旗位")

  const rejected = await verifyTool.execute(
    { verification: { status: "skipped" } },
    { agent: { cwd: plain, _touchedFiles: [file], tasks: [] }, cwd: plain },
  )
  assert.match(rejected, /VERIFY BLOCKED/, "空跳过拒绝")
  assert.match(rejected, /empty skip is not allowed/, "拒绝理由可读（引导补 summary）")
})

test("⑥ 错误：verify failed → 拒绝（不得声称完成：旗位 false + 修复引导）", async () => {
  const file = join(plain, "app.js")
  writeFileSync(file, "export const x = 1\n", "utf8")
  const agent = { cwd: plain, _touchedFiles: [file], tasks: [] }

  const rejected = await verifyTool.execute(
    { verification: { status: "failed", summary: "语法检查未过" } },
    { agent, cwd: plain },
  )
  assert.match(rejected, /VERIFY BLOCKED: you declared verification failed/, "打回报告（模型可见）")
  assert.match(rejected, /app\.js/, "列出改动文件（模型据此修）")
  assert.equal(agent._verifyPassed, false, "判定旗位 false（验收面机械信号）")
  // W9：「被拒也是本轮已验动作（守卫不重复推）」的 `_verifiedThisRun` 置位随端镜像退役 ⇒ 壳侧记账
  // （`src/agent/execute-tools.mjs:318` toolName==="verify"；核 record-results 同款）；本场景直驱工具、不经壳，
  // 故此处不断言该旗位（真实链路由 agent 主循环集成面覆盖）。
})

test("⑥ 正常：代码声明 passed → 放行（同一关口的正控分支）", async () => {
  const file = join(plain, "ok.js")
  writeFileSync(file, "export const ok = true\n", "utf8")
  const agent = { cwd: plain, _touchedFiles: [file], tasks: [] }
  const released = await verifyTool.execute(
    { verification: { status: "passed", command: "node --check ok.js" } },
    { agent, cwd: plain },
  )
  assert.match(released, /Verification declared passed/, "放行输出")
  assert.equal(agent._verifyPassed, true, "旗位 true")
})
