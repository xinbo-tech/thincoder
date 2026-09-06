/**
 * setup-reminders.test.mjs — SESSION.md §11.1 统一 env-state transient reminder
 * （2026-09-06 需求池 R5/R8/R9/R11 合并——CLI 侧）。
 *
 * 用例映射：T-E1 字段完整 / T-E2 env=cli（§10 D-1 END 常量）/ T-E3 mode eng|normal /
 * T-E4 model = activeModel ?? provider.model / T-E5 resumed=yes 仅恢复首回合 /
 * T-E6 git 富注入（branch/commits/uncommitted——复用 setup.mjs 既有 collectGitContext
 * 接线，T-AG7 已守回归，此处守 env-state 与 git 注入共存）/ T-E8/E9 变更下回合反映 /
 * T-E11 git 不可用安全降级 / T-E12 activeModel null 回退 / T-E13 缺 config 不崩。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(TEST_DIR, "..") // git 仓库（T-E6 富注入断言用）

const envStateOf = (agent) =>
  agent.history.filter((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: env:"))

test("T-E1/T-E2: envStateLine 字段完整（env/mode/model/resumed）且 env=cli（END 常量——非 cmdline 判别）", async () => {
  const { envStateLine } = await import("../src/agent/setup-reminders.mjs")
  const line = envStateLine({ mode: "normal", model: "glm-5.3", resumed: false })
  assert.ok(line.startsWith("[System reminder: env: cli, "), "env=cli（CLI 仓 END 常量）")
  assert.ok(line.includes("mode: normal"), "mode 字段")
  assert.ok(line.includes("model: glm-5.3"), "model 字段")
  assert.ok(line.includes("resumed: no"), "resumed 字段")
  assert.ok(line.endsWith(".]"), "reminder 收尾")
  const yes = envStateLine({ mode: "eng", model: "m", resumed: true })
  assert.ok(yes.includes("mode: eng") && yes.includes("resumed: yes"), "eng/yes 形态")
})

test("T-E3/T-E4/T-E12/T-E13: pushEnvStateReminder——mode 取自 config；model = activeModel ?? provider.model ?? unknown；transient 标记；缺字段不崩", async () => {
  const { pushEnvStateReminder } = await import("../src/agent/setup-reminders.mjs")
  // eng 模式 + activeModel 优先
  const a1 = { config: { agent: { engineering: true } }, activeModel: "override-model", provider: { model: "base-model" }, history: [] }
  pushEnvStateReminder(a1)
  assert.ok(a1.history[0].content.includes("mode: eng"), "工程模式开 → mode: eng")
  assert.ok(a1.history[0].content.includes("model: override-model"), "activeModel 优先于 provider.model（T-E4）")
  assert.equal(a1.history[0].transient, true, "transient 标记（人读线落盘过滤）")
  // normal 模式 + activeModel null → provider.model 回退（T-E12）
  const a2 = { config: { agent: { engineering: false } }, activeModel: null, provider: { model: "base-model" }, history: [] }
  pushEnvStateReminder(a2)
  assert.ok(a2.history[0].content.includes("mode: normal"), "工程模式关 → mode: normal")
  assert.ok(a2.history[0].content.includes("model: base-model"), "activeModel null → provider.model 回退")
  // 全缺（无 config/provider——T-E13 降级路径）→ unknown，不抛
  const a3 = { history: [] }
  pushEnvStateReminder(a3)
  assert.ok(a3.history[0].content.includes("model: unknown"), "provider 缺失 → unknown 降级（不崩）")
  assert.ok(a3.history[0].content.includes("mode: normal"), "config 缺失 → normal 降级（不崩）")
})

test("T-E5 单元面: resumed=yes 仅消费一次——_envResumed 置位后首 push yes、随后 no", async () => {
  const { pushEnvStateReminder } = await import("../src/agent/setup-reminders.mjs")
  const agent = { config: { agent: {} }, provider: { model: "m" }, history: [], _envResumed: true }
  pushEnvStateReminder(agent)
  assert.ok(agent.history[0].content.includes("resumed: yes"), "置位后首回合 resumed: yes")
  pushEnvStateReminder(agent)
  assert.ok(agent.history[1].content.includes("resumed: no"), "标记已消费——后续回合 resumed: no")
})

test("T-E5/T-E8/T-E9/T-E1 接线面: prepareRun 每回合注入 env-state——恢复首回合 resumed=yes + process restarted；次回合 resumed=no；mode/model 变更下回合反映；env-state 在时间 reminder 之前", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { prepareRun } = await import("../src/agent/setup.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-envstate-"))
  try {
    // 模拟恢复会话：_sessionStart 随 applySession 落 agent（session.mjs L315）
    const agent = createAgent({
      provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" },
      tools: [], config: { agent: {} }, cwd,
      sessionStart: "2026-01-01T00:00:00.000Z",
    })
    await prepareRun(agent, "hi", {})
    const first = envStateOf(agent)
    assert.equal(first.length, 1, "首回合恰好一条 env-state")
    assert.ok(first[0].content.includes("resumed: yes"), "恢复会话首回合 resumed: yes（R5）")
    assert.ok(agent.history.some((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: process restarted at ")), "process restarted 注入同款保留")
    const timeIdx = agent.history.findIndex((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: current time is "))
    assert.ok(agent.history.indexOf(first[0]) < timeIdx, "env-state 在时间 reminder 之前（时间尾位契约不动）")
    // 第二回合：resumed 消费尽；mode/model 变更自然反映（无专门变更注入）
    agent.config.agent.engineering = true
    agent.activeModel = "glm-switched"
    await prepareRun(agent, "again", {})
    const second = envStateOf(agent)
    assert.equal(second.length, 2, "每回合一条（累计两条）")
    assert.ok(second[1].content.includes("resumed: no"), "次回合 resumed: no（仅首回合 yes）")
    assert.ok(second[1].content.includes("mode: eng"), "T-E8: 模式切换下回合反映")
    assert.ok(second[1].content.includes("model: glm-switched"), "T-E9: 模型切换下回合反映")
    assert.equal(
      agent.history.filter((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: process restarted at ")).length,
      1, "process restarted 仅首回合一次（不重复）",
    )
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-E6: git 富注入在 git 仓库 cwd 下含 branch/commits（与 env-state 共存——env-state 不重复 clean|dirty 摘要）", async () => {
  const { collectGitContext } = await import("../src/agent/helpers.mjs")
  if (!collectGitContext(REPO_ROOT)) return // 非 git checkout 运行环境（tarball 分发）——环境依赖跳过
  const { createAgent } = await import("../src/agent.mjs")
  const { prepareRun } = await import("../src/agent/setup.mjs")
  const agent = createAgent({
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" },
    tools: [], config: { agent: {} }, cwd: REPO_ROOT,
  })
  await prepareRun(agent, "hi", {})
  const git = agent.history.find((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: git context:"))
  assert.ok(git, "git context 注入存在（REPO_ROOT 是 git 仓库）")
  assert.ok(git.content.includes("Git context: on branch"), "富注入：branch")
  assert.ok(git.content.includes("Recent commits:"), "富注入：commits")
  const env = envStateOf(agent)[0]
  assert.ok(env && !env.content.includes("git:"), "env-state 行不带 git 字段（§11.1：不重复 clean|dirty 摘要）")
})

test("T-E11: 非 git 仓库 cwd —— prepareRun 不崩、无 git 注入（安全降级）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { prepareRun } = await import("../src/agent/setup.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-nogit-"))
  try {
    const agent = createAgent({
      provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" },
      tools: [], config: { agent: {} }, cwd,
    })
    await prepareRun(agent, "hi", {}) // git 不可用/非仓库——不得抛
    assert.ok(!agent.history.some((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: git context:")), "非 git 仓库无 git 注入（静默跳过）")
    assert.equal(envStateOf(agent).length, 1, "env-state 仍正常注入（降级不影响家族其余字段）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
