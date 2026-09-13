/**
 * tool-seams-agent.test.mjs — C 类余量注入缝机检（agent 面）：#88 / #91 / #96
 * （CORE-UNIFICATION §2.13.4；形态纪律承 §2.13.5 写路径缝）。
 *
 * 双夹具口径同 tool-seams.test.mjs（工具面档）：夹具一 = 注入接管；夹具二 = 缺省现行为。
 * 另：#88 附「同步 loader 面（按核内结构归一）」与异步面的**等值断言**。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { skillTool, configureSkillLoader, resetSkillLoader } from "../agent-tools/skill.mjs"
import { loadSkills, loadSkillsSync, readSkill, readSkillSync } from "../skills.mjs"
import { engTool, configureEngMirror, resetEngMirror } from "../agent-tools/eng.mjs"
import { verifyTool, configureVerifyDiagnostics, resetVerifyDiagnostics } from "../agent-tools/verify.mjs"
import { configureExecRun, resetExecRun } from "../tools/exec-run.mjs"

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "core-tool-seams-agent-"))
  try { return await fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

// ─── #88 skill：loader 缝 + 同步 loader 面（按核内结构归一）──────────────────────

test("#88 skill loader 缝：缺省 = 核内异步 loader（现行为）；注入 ⇒ 端形态接管", async () => {
  await withTempDir(async (dir) => {
    mkdirSync(join(dir, ".thincoder", "skills", "s1"), { recursive: true })
    writeFileSync(join(dir, ".thincoder", "skills", "s1", "SKILL.md"), "# S1\ns1 desc\n")
    writeFileSync(join(dir, ".thincoder", "skills", "flat.md"), "# Flat\nflat desc\n")
    const ctx = { cwd: dir, agent: { cwd: dir, history: [], _pendingReminders: [] } }
    // 夹具二（缺省）：核内 loader（项目层目录 + 扁平均在列）
    const r1 = await skillTool.execute({ action: "list" }, ctx)
    assert.match(r1, /- s1: s1 desc/)
    assert.match(r1, /- flat: flat desc/)
    // 夹具一（注入）：端形态接管（list / load 两径）
    const calls = []
    try {
      configureSkillLoader({
        loadSkills: (cwd) => { calls.push(["list", cwd]); return [{ name: "injected", description: "from end" }] },
        readSkill: (cwd, name) => { calls.push(["read", cwd, name]); return "INJECTED CONTENT" },
      })
      assert.equal(await skillTool.execute({ action: "list" }, ctx), "- injected: from end")
      const r3 = await skillTool.execute({ action: "load", name: "injected" }, ctx)
      assert.match(r3, /Skill "injected" loaded/)
      assert.ok(ctx.agent._pendingReminders.at(-1).includes("INJECTED CONTENT"))
      assert.deepEqual(calls.map((c) => c[0]), ["list", "list", "read"])
    } finally { resetSkillLoader() }
    // 撤销后回核内 loader
    assert.match(await skillTool.execute({ action: "list" }, ctx), /- flat: flat desc/)
  })
})

test("#88 同步 loader 面（按核内结构归一）：与异步面逐项等值", async () => {
  await withTempDir(async (dir) => {
    mkdirSync(join(dir, ".thincoder", "skills", "s1"), { recursive: true })
    writeFileSync(join(dir, ".thincoder", "skills", "s1", "SKILL.md"), "# S1\ns1 desc\n")
    writeFileSync(join(dir, ".thincoder", "skills", "flat.md"), "# Flat\nflat desc\n")
    writeFileSync(join(dir, ".thincoder", "skills", "ignored.txt"), "not a skill\n")
    const asyncSkills = await loadSkills(dir)
    assert.deepEqual(loadSkillsSync(dir), asyncSkills, "同发现规则 / 同排序 / 同层级优先 ⇒ 逐项等值")
    assert.equal(readSkillSync(dir, "flat"), await readSkill(dir, "flat"))
    assert.equal(readSkillSync(dir, "s1"), await readSkill(dir, "s1"))
    assert.equal(readSkillSync(dir, "missing"), await readSkill(dir, "missing"))
    assert.equal(readSkillSync(dir, "bad name!"), await readSkill(dir, "bad name!"))
  })
})

// ─── #91 eng：持久化镜像 / 面板提示 ─────────────────────────────────────────────

test("#91 eng 镜像缝：注入 onToggle ⇒ 通知串追加（enter / exit）；缺省 ⇒ 现行为串", async () => {
  const mkAgent = () => ({ config: { agent: { engineering: false } }, _pendingReminders: [] })
  const ctx = { agent: mkAgent() }
  // 夹具二（缺省）：现状串逐字
  assert.equal(
    await engTool.execute({ action: "exit" }, ctx),
    "Engineering mode exited. Standard discipline now applies. You may edit files directly.",
  )
  assert.ok((await engTool.execute({ action: "enter" }, ctx)).startsWith("Engineering mode activated. "))
  // 夹具一（注入）：onToggle 收新态 + ctx；非空串 ⇒ 追加
  const seen = []
  try {
    configureEngMirror({
      onToggle: async (enabled, c) => { seen.push([enabled, c === ctx]); return enabled ? "Mirror wrote config.json (enter)." : "Mirror cleared (exit)." },
    })
    assert.equal(
      await engTool.execute({ action: "exit" }, ctx),
      "Engineering mode exited. Standard discipline now applies. You may edit files directly. Mirror cleared (exit).",
    )
    assert.ok((await engTool.execute({ action: "enter" }, ctx)).endsWith(" Mirror wrote config.json (enter)."))
    // 返回 null ⇒ 不追加
    configureEngMirror({ onToggle: async () => null })
    assert.equal(
      await engTool.execute({ action: "exit" }, ctx),
      "Engineering mode exited. Standard discipline now applies. You may edit files directly.",
    )
    assert.deepEqual(seen.map((s) => s[0]), [false, true], "状态翻转后调用（观察新态）")
  } finally { resetEngMirror() }
})

// ─── #96 verify：执行方式（exec 缝）+ 信息段（诊断段缝）──────────────────────────

test("#96 verify：git / node --check 经执行器缝；诊断段缝缺省 = 报告不变", async () => {
  await withTempDir(async (dir) => {
    const file = join(dir, "code.mjs")
    writeFileSync(file, "export const a = 1\n")
    const mkCtx = () => ({ cwd: dir, agent: { cwd: dir, _touchedFiles: [file], tasks: [], config: {} } })
    const calls = []
    let report1
    try {
      // 夹具一：注入带委派的执行器（记录调用 + 委托默认语义）——报告应与夹具二逐字同
      configureExecRun({
        run: async (cmd, args, opts) => {
          calls.push({ cmd, args, opts })
          const o = { encoding: "utf8", timeout: opts.timeout, stdio: ["ignore", "pipe", "pipe"] }
          if (opts.cwd !== undefined) o.cwd = opts.cwd
          return execFileSync(cmd, args, o)
        },
      })
      report1 = await verifyTool.execute({ verification: { status: "passed", command: "manual" } }, mkCtx())
    } finally { resetExecRun() }
    assert.ok(calls.some((c) => c.cmd === "git" && c.args[0] === "rev-parse"), "git 探测经执行器缝")
    assert.ok(calls.some((c) => c.cmd === "node" && c.args[0] === "--check"), "node --check 提示经执行器缝")
    // 夹具二（缺省）：同场景报告逐字同（换执行器不换语义）
    const report2 = await verifyTool.execute({ verification: { status: "passed", command: "manual" } }, mkCtx())
    assert.equal(report2, report1)
    assert.ok(!report1.includes("Editor diagnostics"), "缺省 ⇒ 无端注入段")
    // 诊断段缝：注入 ⇒ 段在场（advisory——不进门禁）
    const seen = []
    try {
      configureVerifyDiagnostics({
        section: async (c, files) => {
          seen.push([c, files])
          return ["", "Editor diagnostics (advisory — informational only, not a gate):", "── code.mjs (1 errors, 0 warnings) ──"]
        },
      })
      const report3 = await verifyTool.execute({ verification: { status: "passed", command: "manual" } }, mkCtx())
      assert.ok(report3.includes("Editor diagnostics (advisory"))
      assert.ok(report3.includes("Verification declared passed"), "门禁判定不受注入段影响")
      assert.equal(seen.length, 1)
      assert.ok(seen[0][1].some((f) => f.endsWith("code.mjs")))
    } finally { resetVerifyDiagnostics() }
    const report4 = await verifyTool.execute({ verification: { status: "passed", command: "manual" } }, mkCtx())
    assert.equal(report4, report2, "撤销注入 ⇒ 回缺省报告")
  })
})
