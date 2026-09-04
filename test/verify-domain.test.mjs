/**
 * verify-domain.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs, tools.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, relative, resolve } from "node:path"
import { execSync } from "node:child_process"
import { slow } from "./slow.mjs"
import { planTool, goalTool, verifyTool } from "../src/agent-tools.mjs"


// ---------------------------------------------------------------- goal 自主任务机制


test("goal: set 必须有可验证的完成条件", async () => {
  const { goalTool } = await import("../src/agent-tools.mjs")
  const agent = {}
  const err = await goalTool.execute({ action: "set", objective: "做个东西" }, { agent })
  assert.match(err, /criteria.*required|required.*criteria/)
  assert.equal(agent.goal, undefined) // 没建成
  const ok = await goalTool.execute({ action: "set", objective: "做个东西", criteria: "npm test 全绿" }, { agent })
  assert.match(ok, /Goal set/)
  assert.equal(agent.goal.status, "active")
  assert.equal(agent.goal.turnsUsed, 0)
})



test("goal: complete 的 verify 证据门槛", async () => {
  const { goalTool } = await import("../src/agent-tools.mjs")
  const agent = { goal: { objective: "o", criteria: "c", status: "active" }, _mutatedThisRun: true, _verifiedThisRun: false }
  const err = await goalTool.execute({ action: "complete" }, { agent })
  assert.match(err, /verify has not run/)
  assert.equal(agent.goal.status, "active") // 没让完成
  agent._verifiedThisRun = true
  const ok = await goalTool.execute({ action: "complete" }, { agent })
  assert.match(ok, /verified complete/)
  assert.equal(agent.goal.status, "complete")
})



test("goal: blocked 需同一条件连续 3 次，换条件重新计数", async () => {
  const { goalTool } = await import("../src/agent-tools.mjs")
  const agent = { goal: { objective: "o", criteria: "c", status: "active", _blockTally: null } }
  const r1 = await goalTool.execute({ action: "blocked", reason: "API 限流" }, { agent })
  assert.match(r1, /1\/3/)
  const r2 = await goalTool.execute({ action: "blocked", reason: "另一个原因" }, { agent })
  assert.match(r2, /1\/3/) // 换条件重新计数
  await goalTool.execute({ action: "blocked", reason: "API 限流" }, { agent })
  assert.equal(agent.goal.status, "active") // 不连续，仍 active
  await goalTool.execute({ action: "blocked", reason: "API 限流" }, { agent })
  await goalTool.execute({ action: "blocked", reason: "API 限流" }, { agent })
  assert.equal(agent.goal.status, "blocked") // 连续 3 次才受理
})


// ---------------------------------------------------------------- 内建工具


test("plan: enter/exit toggles agent state", async () => {
  const agent = {}
  await planTool.execute({ action: "enter" }, { agent })
  assert.equal(agent.planMode, true)
  await planTool.execute({ action: "exit" }, { agent })
  assert.equal(agent.planMode, false)
})



test("goal: set / cancel", async () => {
  const agent = {}
  const r1 = await goalTool.execute({ action: "set", objective: "完成 MCP", criteria: "全部测试通过" }, { agent })
  assert.ok(r1.includes("完成 MCP"))
  assert.equal(agent.goal.objective, "完成 MCP")
  assert.equal(agent.goal.criteria, "全部测试通过")

  const r2 = await goalTool.execute({ action: "cancel" }, { agent })
  assert.equal(agent.goal, null)
  assert.ok(r2.includes("cancelled"))
})



slow("verify: git diff stat in mock repo", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-"))
  const { execSync } = await import("node:child_process")
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "x.js"), "1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    writeFileSync(join(dir, "x.js"), "2\n")

    const agent = { cwd: dir, tasks: [{ title: "改好了", status: "done" }] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(result.includes("x.js"))
    assert.ok(result.includes("1/1 done"))
    assert.ok(result.includes("Self-review checklist"))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("verify: quick 模式下语法失败不能算通过（_verifyPassed=false）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-syn-"))
  const { execSync } = await import("node:child_process")
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "x.js"), "1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 改出一个语法错误文件 → quick verify 必须标记失败（完成守卫靠这个推回修复）
    writeFileSync(join(dir, "x.js"), "const = 1\n")
    const agent = { cwd: dir, tasks: [] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(result.includes("syntax error"))
    assert.strictEqual(agent._verifyPassed, false)

    // 修好后 quick verify 通过
    writeFileSync(join(dir, "x.js"), "const v = 1\n")
    await verifyTool.execute({}, { agent })
    assert.strictEqual(agent._verifyPassed, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("verify: doc-only 改动走快路径（不跑语法检查/测试/任务列表/自检清单）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-doc-"))
  const { execSync } = await import("node:child_process")
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    mkdirSync(join(dir, "docs", "design"), { recursive: true })
    writeFileSync(join(dir, "README.md"), "# readme\n")
    writeFileSync(join(dir, "docs/design/PLAN.md"), "# plan\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 纯文档改动（.md）→ 快路径
    writeFileSync(join(dir, "README.md"), "# readme v2\n")
    writeFileSync(join(dir, "docs/design/PLAN.md"), "# plan v2\n")
    const agent = { cwd: dir, tasks: [{ title: "未完成", status: "pending" }] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(result.includes("Documentation-only changes"), result)
    assert.strictEqual(agent._verifyPassed, true)
    assert.ok(!result.includes("Syntax check"), "no syntax checks on doc-only")
    assert.ok(!result.includes("Related tests"), "no tests on doc-only")
    assert.ok(!result.includes("Task list"), "no task list on doc-only")
    assert.ok(!result.includes("Self-review checklist"), "no checklist on doc-only")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("verify: mixed 改动（文档+代码）不走快路径，语法检查照常", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-mixed-"))
  const { execSync } = await import("node:child_process")
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    mkdirSync(join(dir, "src"), { recursive: true })
    writeFileSync(join(dir, "README.md"), "# readme\n")
    writeFileSync(join(dir, "src/app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 文档 + 代码混合改动 → 全量路径
    writeFileSync(join(dir, "README.md"), "# readme v2\n")
    writeFileSync(join(dir, "src/app.js"), "const v = 2\n")
    const agent = { cwd: dir, tasks: [] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(!result.includes("Documentation-only changes"), result)
    assert.ok(result.includes("Syntax check"), "syntax checks still run on mixed changes")
    assert.ok(result.includes("Self-review checklist"), "full path still shows the checklist")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- verify 定位（§18.12 T-VR —— _touchedFiles ∪ git diff）


test("§18.12 T-VR1: cwd 非 git 根（workspace 根）——_touchedFiles 定向 + 相关测试按项目根解析（F-VR1 真实形态）", async () => {
  const ws = mkdtempSync(join(tmpdir(), "thincoder-verify-vr1-"))
  try {
    const proj = join(ws, "proj")
    mkdirSync(join(ws, ".git")) // 空 .git 目录——git 在此确定性失败（防 tmpdir 恰在父仓库内）
    mkdirSync(join(proj, "src", "agent-tools"), { recursive: true })
    mkdirSync(join(proj, "test"), { recursive: true })
    writeFileSync(join(proj, "src", "agent-tools", "x.mjs"), "export const v = 1\n")
    for (const tf of ["subagent-core.test.mjs", "subagent-async.test.mjs", "subagent-tool.test.mjs", "subagent-panel.test.mjs", "subagent-scheduler.test.mjs", "verify-domain.test.mjs"]) writeFileSync(join(proj, "test", tf), 'import { test } from "node:test"\nimport assert from "node:assert/strict"\ntest("ok", () => assert.equal(1, 1))\n')
    writeFileSync(join(proj, "package.json"), '{ "name": "proj" }\n') // 项目根锚
    // 子代理场景：cwd = 非 git 根 workspace——git 链必失败；定位只靠 _touchedFiles；
    // 相关测试文件在 <projectRoot>/test/ 下——按项目根解析才能真跑（F-VR1）
    const agent = { cwd: ws, tasks: [], _touchedFiles: [join(proj, "src", "agent-tools", "x.mjs")] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(result.includes("not a git repo"), "git 回退路径信息仍在")
    assert.ok(result.includes("src/agent-tools/x.mjs"), "touched 文件进入定位（绝对路径归一化后）")
    assert.ok(result.includes("Syntax check"), "语法检查运行")
    assert.ok(result.includes("Related tests"), "相关测试识别——定向而非全量")
    assert.ok(!result.includes("Tests (full suite)"), "不跑全量")
    assert.ok(result.includes("test/subagent-core.test.mjs"), "相关测试文件被运行（按项目根解析）")
    assert.ok(result.includes("All related tests passed"), result)
    assert.strictEqual(agent._verifyPassed, true)
  } finally {
    rmSync(ws, { recursive: true, force: true })
  }
})



slow("§18.12 T-VR2: 正常 cwd（git 根）——git diff 仍生效，_touchedFiles ∪ git diff", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-vr2-"))
  const { execSync } = await import("node:child_process")
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    mkdirSync(join(dir, "src", "agent-tools"), { recursive: true })
    mkdirSync(join(dir, "test"), { recursive: true })
    writeFileSync(join(dir, "src", "agent-tools", "a.mjs"), "export const a = 1\n")
    for (const tf of ["subagent-core.test.mjs", "subagent-async.test.mjs", "subagent-tool.test.mjs", "subagent-panel.test.mjs", "subagent-scheduler.test.mjs", "verify-domain.test.mjs"]) writeFileSync(join(dir, "test", tf), 'import { test } from "node:test"\nimport assert from "node:assert/strict"\ntest("ok", () => assert.equal(1, 1))\n')
    git("add", ".")
    git("commit", "-qm", "init")

    // git 链可见的改动（modified tracked）
    writeFileSync(join(dir, "src", "agent-tools", "a.mjs"), "export const a = 2\n")
    // _touchedFiles 覆盖而 git diff --name-only 不可见的改动（untracked）——并集
    writeFileSync(join(dir, "src", "agent-tools", "b.mjs"), "export const b = 1\n")
    const agent = { cwd: dir, tasks: [], _touchedFiles: [join(dir, "src", "agent-tools", "b.mjs")] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(result.includes("Changed files (git diff --stat)"), "git diff 链仍生效")
    assert.ok(result.includes("src/agent-tools/a.mjs"), "git diff 文件进入定位")
    assert.ok(result.includes("src/agent-tools/b.mjs"), "_touchedFiles 并集进入定位")
    assert.ok(result.includes("Syntax check"), "语法检查运行")
    assert.ok(result.includes("All related tests passed"), "相关测试真实运行（test/subagent-core.test.mjs 存在）")
    assert.strictEqual(agent._verifyPassed, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("§18.12 T-VR2b（审计 #1 修正——git 在仓库子目录调用）：相对路径按 git 根 resolve，不产生 <subdir>/src/ junk", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-vr2b-"))
  const { execSync } = await import("node:child_process")
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    mkdirSync(join(dir, "src", "agent-tools"), { recursive: true })
    mkdirSync(join(dir, "test"), { recursive: true })
    writeFileSync(join(dir, "src", "agent-tools", "a.mjs"), "export const a = 1\n")
    for (const tf of ["subagent-core.test.mjs", "subagent-async.test.mjs", "subagent-tool.test.mjs", "subagent-panel.test.mjs", "subagent-scheduler.test.mjs", "verify-domain.test.mjs"]) writeFileSync(join(dir, "test", tf), 'import { test } from "node:test"\nimport assert from "node:assert/strict"\ntest("ok", () => assert.equal(1, 1))\n')
    git("add", ".")
    git("commit", "-qm", "init")
    writeFileSync(join(dir, "src", "agent-tools", "a.mjs"), "export const a = 2\n")

    // workdir 指向仓库子目录 → git 首次尝试在子目录（成功）——输出为根相对路径
    const agent = { cwd: dir, tasks: [] }
    const result = await verifyTool.execute({ workdir: "src" }, { agent })
    const norm = join(dir, "src", "agent-tools", "a.mjs").replace(/\\/g, "/")
    assert.ok(result.includes(`✓ ${norm}`), `子目录调用定位到根绝对路径（含语法检查行）——got: ${result.slice(0, 400)}`)
    assert.ok(!result.includes("src/src/"), "无 <subdir>/src/ 拼接 junk")
    assert.ok(result.includes("Syntax check"), "语法检查运行")
    assert.strictEqual(agent._verifyPassed, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})




test("§18.12 T-VR3: _touchedFiles 空 + git diff 全失败——回退现有行为（空列表→正常路径，不崩）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-vr3-"))
  try {
    const agent = { cwd: dir, tasks: [], _touchedFiles: [] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(result.includes("not a git repo"), "git 失败路径信息在")
    assert.ok(result.includes("no source .mjs files changed"), "空列表→正常路径（nothing to test）")
    assert.ok(result.includes("Self-review checklist"), "正常报告路径完整")
    assert.strictEqual(agent._verifyPassed, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("§18.12 T-VR2c（advisor 🟡1 ② 修正——相关测试文件缺失）：警告 + 不判过（防 'All related tests passed' 假 pass）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-vr2c-"))
  try {
    mkdirSync(join(dir, ".git")) // 空 .git 目录——git 确定性失败
    mkdirSync(join(dir, "src", "agent-tools"), { recursive: true })
    writeFileSync(join(dir, "src", "agent-tools", "x.mjs"), "export const v = 1\n")
    // 模块有映射（agent-tools → subagent-* 域文件——§18.14 拆分后）但测试文件不存在
    const agent = { cwd: dir, tasks: [], _touchedFiles: [join(dir, "src", "agent-tools", "x.mjs")] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(result.includes("did NOT certify"), "缺失时明确警告——不输出假 pass")
    assert.strictEqual(agent._verifyPassed, false)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
