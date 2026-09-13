/**
 * commit-verify-gate.test.mjs — 集成场景 ⑥（TESTING.md §5.6——commit / 验证关口）。
 *
 * 业务语义：两个"不许悄悄混过去"的关口——① 提交只带走本次列明的文件（并行批次/
 * 其他改动留在原地，既不混入也不丢失）；② 验证声明必须是有内容的（跳过要给理由、
 * 失败不许放行）。
 * 驱动 = 真 git 临时仓 + 真 git 工具 + 真 dispatch 调用链（agent 发起 → 工具执行）；
 * 真 verify 工具 + 临时工作区。断言只写业务可观察结果（HEAD 集 / 索引 / 旗位 / 回执串）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { gitTool } from "../../src/tools/git.mjs"
import { verifyTool } from "../../src/agent-tools/verify.mjs"
import { executeToolCalls } from "../../src/agent/dispatch.mjs"

const git = (repo, ...args) =>
  execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()

/** 真 git 临时仓（基线提交照常，便于断言 HEAD 集）。 */
function mkRepo(t) {
  const repo = mkdtempSync(join(tmpdir(), "tc-int-git-"))
  t.after(() => { try { rmSync(repo, { recursive: true, force: true }) } catch { /* ignore */ } })
  git(repo, "init", "-q")
  git(repo, "config", "user.email", "t@t")
  git(repo, "config", "user.name", "t")
  for (const f of ["a.txt", "b.txt"]) writeFileSync(join(repo, f), "base\n")
  git(repo, "add", "-A")
  git(repo, "commit", "-q", "-m", "base")
  return repo
}

/** 真工作区 + agent 上下文（改动文件 = _touchedFiles 声明）。 */
function mkProject(t, files) {
  const dir = mkdtempSync(join(tmpdir(), "tc-int-verify-"))
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ } })
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true })
    writeFileSync(join(dir, rel), content)
  }
  const agent = {
    cwd: dir, _touchedFiles: [], tasks: [], _verifyPassed: undefined,
    planMode: false, autoApprove: false, config: { agent: {} }, _role: undefined,
    _mutLog: [], _mutationSeq: 0, _engDesignTokens: undefined,
  }
  const touch = (rel) => agent._touchedFiles.push(join(dir, rel))
  return { dir, agent, touch }
}

/** 走真 dispatch 调用链跑一个工具调用（= agent 实际发起工具的路径；用户批准）。 */
async function callTool(agent, tool, name, args) {
  const results = await executeToolCalls(agent, new Map([[name, tool]]), [{ name, arguments: JSON.stringify(args), id: "c1" }], { onPermissionRequest: async () => true }, 0, undefined)
  assert.equal(results.length, 1)
  return String(results[0].result)
}

test("⑥ 正常：agent 发起提交只含列明文件——他批 staged 不混入不丢失", async (t) => {
  const repo = mkRepo(t)
  writeFileSync(join(repo, "a.txt"), "this batch\n")
  writeFileSync(join(repo, "b.txt"), "other batch\n")
  git(repo, "add", "b.txt") // 他批先 staged（并行批次/用户自己 staged 的改动）
  const agent = { cwd: repo, planMode: false, autoApprove: false, config: { agent: {} }, _role: undefined, _mutLog: [], _mutationSeq: 0 }

  const out = await callTool(agent, gitTool, "git", { action: "commit", path: "a.txt", message: "only this batch" })
  assert.ok(!out.includes("failed"), out)
  assert.deepEqual(git(repo, "diff", "HEAD^", "HEAD", "--name-only").split("\n"), ["a.txt"], "HEAD 集 = 只含列明文件")
  assert.deepEqual(git(repo, "diff", "--cached", "--name-only").split("\n"), ["b.txt"], "他批 staged 仍在索引里（不丢失）")
  assert.equal(git(repo, "log", "-1", "--format=%s"), "only this batch", "提交信息 = 本次的")
})

test("⑥ 边界：verify 声明 skipped —— 带理由放行、无理由拒绝", async (t) => {
  const { agent, touch } = mkProject(t, { "lib/feature.mjs": "export const x = 1\n" })
  touch("lib/feature.mjs")

  const reason = "project has no automated tests — verified by manual review"
  const allowed = await callTool(agent, verifyTool, "verify", { verification: { status: "skipped", summary: reason } })
  assert.equal(agent._verifyPassed, true, "带理由的跳过 → 放行")
  assert.match(allowed, new RegExp(reason), "回执标记该理由")

  const refused = await callTool(agent, verifyTool, "verify", { verification: { status: "skipped" } })
  assert.equal(agent._verifyPassed, false, "无理由跳过 → 拒绝（空跳过不许过）")
  assert.match(refused, /empty skip is not allowed/, "拒绝串说明原因")
})

test("⑥ 错误：verify 声明 failed —— 拒绝放行", async (t) => {
  const { agent, touch } = mkProject(t, { "lib/feature.mjs": "export const x = 1\n" })
  touch("lib/feature.mjs")

  const out = await callTool(agent, verifyTool, "verify", { verification: { status: "failed", summary: "syntax check failed" } })
  assert.equal(agent._verifyPassed, false, "旗位 = 未通过")
  assert.match(out, /VERIFY BLOCKED/, "回执明确打回")
})
