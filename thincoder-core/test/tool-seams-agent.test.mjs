/**
 * tool-seams-agent.test.mjs — C 类余量注入缝机检（agent 面）：#88 / #91 / #96
 * （CORE-UNIFICATION §2.13.4；形态纪律承 §2.13.5 写路径缝）。
 *
 * 双夹具口径同 tool-seams.test.mjs（工具面档）：夹具一 = 注入接管；夹具二 = 缺省现行为。
 * 另：#88 附「同步 loader 面（按核内结构归一）」与异步面的**等值断言**；
 * #41 段（T37–T40）锁工程模式翻转准入（docs/core/design/MANIFEST.md §2.8 / AC-20）；
 * 2026-09-21（#188 · 父侧授权表外收正）：T39 / T40 夹具由「根不可解析」（梯⑤——现建档 + 放行）
 * 改**歧义**（容器 + ≥2 带档子仓）；拒翻文案锚改 `/项目不可解析/`；T38 补梯④ / 梯⑤ 两格。
 * 2026-09-21（plan-approval-texts 批 · #154 修法①）：plan 工具批准语义文本收正（① ② ⑤ ⑥）——新增 PT-7 / PT-8。
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { skillTool, configureSkillLoader, resetSkillLoader } from "../agent-tools/skill.mjs"
import { loadSkills, loadSkillsSync, readSkill, readSkillSync } from "../skills.mjs"
import { engTool, configureEngMirror, resetEngMirror } from "../agent-tools/eng.mjs"
import { planTool } from "../agent-tools/plan.mjs"
import { DEFAULT_MANIFEST, MANIFEST_REL, resolveEngineeringManifest } from "../manifest.mjs"
import { verifyTool, configureVerifyDiagnostics, resetVerifyDiagnostics } from "../agent-tools/verify.mjs"
import { configureExecRun, resetExecRun } from "../tools/exec-run.mjs"

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "core-tool-seams-agent-"))
  try { return await fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

/** 合法档逐字 = `initManifest` 落盘形态（writeManifest: JSON.stringify(…, 2) + "\n"）。 */
const LEGAL_JSON = JSON.stringify(DEFAULT_MANIFEST, null, 2) + "\n"
const manifestPathOf = (dir) => join(dir, MANIFEST_REL)
/** tmp 仓（.git 判据——resolveProjectRoot 锚自身仓）；非仓格 = withTempDir 裸目录。 */
const mkRepo = (dir) => { mkdirSync(join(dir, ".git"), { recursive: true }); return dir }

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
  // #41 起 enter = 「先判后翻」（判据树单源）：夹具须给锚（仓根 + 合法档）——无锚 cwd 下
  // enter 现为拒翻（T39），镜像缝不会被触发（模式未翻）。
  await withTempDir(async (dir) => {
    mkRepo(dir)
    writeFileSync(manifestPathOf(dir), LEGAL_JSON)
    const mkAgent = () => ({ cwd: dir, config: { agent: { engineering: false } }, _pendingReminders: [] })
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
})

// ─── ENG-PLAN-EXCLUSION 批（FR31 ③ / AC14 = T12）：核 `eng` 工具 enter 清 plan 残留 ────

test("T12 翻转点①（核 eng 工具）：enter ⇒ planMode + 未注入 plan 提示语清零；exit 方向零改", async () => {
  await withTempDir(async (dir) => {
    mkRepo(dir)
    writeFileSync(manifestPathOf(dir), LEGAL_JSON)
    const agent = { cwd: dir, config: { agent: {} }, _pendingReminders: [], planMode: false }
    const ctx = { agent }
    // 真产出排队提示语（产出面 = plan 工具本体）后模拟「中途已入 plan 模式」
    await planTool.execute({ action: "exit" }, ctx)
    await planTool.execute({ action: "enter" }, ctx)
    agent._planTurnsSinceReminder = 3
    agent._planTurnsSinceSparse = 1
    agent._pendingReminders.push("[System reminder: unrelated]")
    assert.equal(agent.planMode, true, "前置：已入 plan 模式（残留半状态）")
    assert.ok((await engTool.execute({ action: "enter" }, ctx)).startsWith("Engineering mode activated. "), "enter 照常准翻")
    assert.equal(agent.planMode, false, "进工程模式 ⇒ planMode 清零（FR31 ③）")
    assert.equal(agent._planTurnsSinceReminder, 0, "reminder 计数清零")
    assert.equal(agent._planTurnsSinceSparse, 0)
    assert.deepEqual(agent._pendingReminders.filter((r) => /plan mode/.test(r)), [], "未注入 plan 提示语摘除")
    assert.ok(agent._pendingReminders.some((r) => r.includes("unrelated")), "非 plan 项保留")
    // OFF 方向零改（FR31 边界：普通模式零改——离开工程模式不回头动 plan）
    agent.planMode = true
    await engTool.execute({ action: "exit" }, ctx)
    assert.equal(agent.planMode, true, "OFF 不碰 planMode")
  })
})

// ─── plan-approval-texts 批（#154 修法①）：plan 工具批准语义文本收正——描述面 / 源文注释面 ───

test("PT-7 正常：plan 工具描述面 = 新句在场 ∧ 旧句零残留（模型面文本）", () => {
  assert.ok(planTool.description.includes("Exit plan mode to present the plan for the user's approval; implement only after they approve."), "描述含新句")
  assert.ok(!planTool.description.includes("When the user approves, exit plan mode and implement"), "描述不含旧句")
})

test("PT-8 正常：plan.mjs 源文面 = 档头句 / 注释引文收正 ∧ 旧句零残留（防回流）", () => {
  const src = readFileSync(new URL("../agent-tools/plan.mjs", import.meta.url), "utf8")
  const lines = src.split("\n")
  assert.ok(!src.includes("After the user approves the plan, exit plan mode and start implementing"), "档头旧句零残留")
  assert.ok(!src.includes("Start implementing your plan"), "注释引文 / 旧②面零残留")
  assert.ok(lines.some((l) => l.startsWith(" * ") && l.includes("Exit plan mode to present the plan for the user's approval; implement only after they approve.")), "档头注行含 ⑤ 新句")
  assert.ok(lines.some((l) => l.startsWith(" * ") && l.includes("Present your plan")), "注释块含新②引文片段（防删而不换）")
})

// ─── #96 verify：执行方式（exec 缝）+ 信息段（诊断段缝）──────────────────────────

slow("#96 verify：git / node --check 经执行器缝；诊断段缝缺省 = 报告不变", async () => {
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

// ─── #41 工程模式翻转准入（MANIFEST.md §2.8 F2/F3 · AC-20 · T37–T40）────────────
// 判据单源 = resolveEngineeringManifest（KD-M1-20）；核序 = 先判后翻、拒翻零副作用（KD-M1-21）。

/** eng 工具 ctx 夹具：cwd = 判据锚（生产面 = agent.cwd）。 */
const engCtx = (dir, over = {}) => ({
  agent: { cwd: dir, config: { agent: { engineering: false } }, _pendingReminders: [], _advisorRuns: new Map(), ...over },
  cwd: dir,
})

test("T37 正常：翻转准入（合法档）→ 放行 + 附着 + 既有成功文案", async () => {
  await withTempDir(async (dir) => {
    mkRepo(dir)
    writeFileSync(manifestPathOf(dir), LEGAL_JSON)
    const ctx = engCtx(dir)
    const msg = await engTool.execute({ action: "enter" }, ctx)
    assert.equal(ctx.agent.config.agent.engineering, true, "模式已翻")
    assert.ok(ctx.agent.manifest, "agent.manifest ← 判据结果（非 null）")
    assert.equal(ctx.agent.manifest.phase, DEFAULT_MANIFEST.phase, "附着内容 = 档内容")
    assert.match(msg, /^Engineering mode activated\./, "既有成功文案零改")
  })
})

test("T38 正常：缺档 + 梯②④⑤ → 建档放行；反证格：缺省 writer ⇒ init-failed 拒翻", async () => {
  await withTempDir(async (dir) => {
    mkRepo(dir) // 梯②：锚 = 裸仓（缺档）
    const ctx = engCtx(dir)
    const msg = await engTool.execute({ action: "enter" }, ctx)
    assert.equal(ctx.agent.config.agent.engineering, true, "放行")
    assert.equal(readFileSync(manifestPathOf(dir), "utf8"), LEGAL_JSON, "就地建档 = DEFAULT_MANIFEST（writer:'main'）")
    assert.ok(ctx.agent.manifest, "附着")
    assert.match(msg, /^Engineering mode activated\./)
  })
  await withTempDir(async (dir) => { // 梯④：容器 + 恰一裸仓 ⇒ 档落裸仓
    mkRepo(join(dir, "bare"))
    const ctx = engCtx(dir)
    await engTool.execute({ action: "enter" }, ctx)
    assert.equal(readFileSync(manifestPathOf(join(dir, "bare")), "utf8"), LEGAL_JSON, "梯④ 档落裸仓根")
    assert.equal(existsSync(manifestPathOf(dir)), false, "容器处零建档")
    assert.ok(ctx.agent.manifest, "附着")
  })
  await withTempDir(async (dir) => { // 梯⑤：空目录 ⇒ 档落会话锚（本批可拒面收窄）
    const ctx = engCtx(dir)
    const msg = await engTool.execute({ action: "enter" }, ctx)
    assert.equal(ctx.agent.config.agent.engineering, true, "梯⑤ 不再拒翻")
    assert.equal(readFileSync(manifestPathOf(dir), "utf8"), LEGAL_JSON, "档落会话锚")
    assert.ok(ctx.agent.manifest, "附着")
    assert.match(msg, /^Engineering mode activated\./)
  })
  await withTempDir(async (dir) => {
    mkRepo(dir)
    const r = resolveEngineeringManifest(dir) // 缺省 writer = 'subagent'（写门缺省拒）
    assert.equal(r.ok, false, "反证格：调用点漏传 writer:'main' 即可机判")
    assert.equal(r.code, "init-failed")
    assert.equal(existsSync(manifestPathOf(dir)), false, "档未生成")
  })
})

test("T39 错误：拒翻两格（歧义 / 档非法）——模式仍 OFF · manifest 仍 null · 原因句在场", async () => {
  // ① 歧义（容器 + ≥2 带档子仓——#188 可拒面收窄后的拒翻格）
  await withTempDir(async (dir) => {
    for (const n of ["alpha", "zed"]) {
      const d = join(dir, n)
      mkdirSync(join(d, ".git"), { recursive: true })
      writeFileSync(manifestPathOf(d), LEGAL_JSON)
    }
    const ctx = engCtx(dir)
    const msg = await engTool.execute({ action: "enter" }, ctx)
    assert.equal(ctx.agent.config.agent.engineering, false, "模式保持 OFF")
    assert.equal(ctx.agent.manifest ?? null, null, "agent.manifest 仍 null")
    assert.equal(ctx.agent._pendingReminders.length, 0, "_pendingReminders 零新增")
    assert.match(msg, /^Error: cannot enter engineering mode — /, "明示面（F3 工具行）")
    assert.match(msg, /项目不可解析/, "原因句 = 决策树文案族（KD-M1-28）")
    assert.match(msg, /\(mode unchanged\)$/)
    assert.equal(existsSync(manifestPathOf(dir)), false, "锚处零建档（不建 / 不猜）")
  })
  // ② 档非法（JSON 非法）
  await withTempDir(async (dir) => {
    mkRepo(dir)
    writeFileSync(manifestPathOf(dir), "{ this is not valid json")
    const ctx = engCtx(dir)
    const msg = await engTool.execute({ action: "enter" }, ctx)
    assert.equal(ctx.agent.config.agent.engineering, false, "模式保持 OFF")
    assert.equal(ctx.agent.manifest ?? null, null, "agent.manifest 仍 null")
    assert.match(msg, /^Error: cannot enter engineering mode — /)
    assert.match(msg, /项目不可解析/, "原因句 = 文案族")
    assert.match(msg, /fail-closed/)
    assert.match(msg, /\(mode unchanged\)$/)
  })
})

test("T40 边界：先判后翻零副作用（拒翻后内态逐项不变——实现前必红）", async () => {
  await withTempDir(async (dir) => {
    for (const n of ["alpha", "zed"]) {
      const d = join(dir, n)
      mkdirSync(join(d, ".git"), { recursive: true })
      writeFileSync(manifestPathOf(d), LEGAL_JSON)
    }
    const ctx = engCtx(dir, { _advisorRuns: new Map([["x", { round: 3 }]]), _lastEngState: false })
    const probes = []
    try {
      configureEngMirror({ onToggle: async (enabled) => { probes.push(enabled); return "mirror wrote" } })
      const msg = await engTool.execute({ action: "enter" }, ctx)
      assert.match(msg, /mode unchanged/, "拒翻返回原因句")
    } finally { resetEngMirror() }
    assert.equal(ctx.agent._advisorRuns.size, 1, "_advisorRuns 未被重置（D-24b 清空不可撤回）")
    assert.equal(ctx.agent._lastEngState, false, "_lastEngState 未改")
    assert.deepEqual(probes, [], "镜像缝零调用（槽 / config.json 未被写）")
    assert.equal(ctx.agent.config.agent.engineering, false, "模式未翻")
  })
})
