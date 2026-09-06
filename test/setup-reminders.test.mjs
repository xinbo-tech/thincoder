/**
 * setup-reminders.test.mjs — SESSION.md §11.1 统一 env-state transient reminder
 * （2026-09-06 需求池 R5/R8/R9/R11 合并——VS Code 侧，CLI 同构镜像）。
 *
 * 用例映射：T-E1 字段完整 / T-E2 env=vscode（§10 D-1 END 常量）/ T-E3 mode /
 * T-E4/T-E12 model 回退 / T-E5 resumed 一次性 + process restarted 补齐（CLI setup.mjs
 * L116 同款）/ T-E6 git 富注入（branch/commits/uncommitted——CLI 同款补齐）/
 * T-E11 git 不可用降级 / T-E13 缺字段不崩。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(TEST_DIR, "..") // thincoder-vscode git 仓库（T-E6 富注入断言用）

test("T-E1/T-E2: envStateLine 字段完整且 env=vscode（END 常量——非 cmdline 判别）", async () => {
  const { envStateLine } = await import("../src/agent/setup-reminders.mjs")
  const line = envStateLine({ mode: "normal", model: "glm-5.3", resumed: false })
  assert.ok(line.startsWith("[System reminder: env: vscode, "), "env=vscode（VS Code 仓 END 常量）")
  assert.ok(line.includes("mode: normal") && line.includes("model: glm-5.3") && line.includes("resumed: no"), "mode/model/resumed 字段齐")
  assert.ok(line.endsWith(".]"), "reminder 收尾")
})

test("T-E3/T-E4/T-E12/T-E13: pushEnvStateReminder——mode/model/resumed 映射 + transient 标记 + 降级不崩", async () => {
  const { pushEnvStateReminder } = await import("../src/agent/setup-reminders.mjs")
  const h1 = []
  pushEnvStateReminder(h1, { engineering: true, provider: { model: "m-eng" }, resumed: false })
  assert.ok(h1[0].content.includes("mode: eng"), "工程模式开 → mode: eng")
  assert.ok(h1[0].content.includes("model: m-eng"), "model = provider.model")
  assert.equal(h1[0].transient, true, "transient 标记")
  const h2 = []
  pushEnvStateReminder(h2, { engineering: false, provider: { model: "m2" }, resumed: true })
  assert.ok(h2[0].content.includes("mode: normal") && h2[0].content.includes("resumed: yes"), "normal + resumed: yes")
  const h3 = []
  pushEnvStateReminder(h3, { engineering: undefined, provider: undefined, resumed: false }) // T-E13 全缺
  assert.ok(h3[0].content.includes("model: unknown"), "provider 缺失 → unknown 降级（不崩）")
})

test("T-E5: detectRestoredSession——恢复会话首回合 true 一次性；新会话/后续回合/resume/autoTurn/depth>0 均 false", async () => {
  const { detectRestoredSession, _resetRestartDetectionForTests } = await import("../src/agent/setup-reminders.mjs")
  // 恢复会话：首个顶层用户回合 fullHistory 非空 → true；随后关闸
  _resetRestartDetectionForTests()
  assert.equal(detectRestoredSession({ depth: 0, resume: false, autoTurn: false, fullHistory: [{ role: "user", content: "old" }] }), true, "恢复会话首回合 → resumed")
  assert.equal(detectRestoredSession({ depth: 0, resume: false, autoTurn: false, fullHistory: [{ role: "user", content: "x" }] }), false, "一次性——次回合 false")
  // 新会话：首回合 fullHistory 空 → false，且检测关闸（次回合 history 已非空不误判）
  _resetRestartDetectionForTests()
  assert.equal(detectRestoredSession({ depth: 0, resume: false, autoTurn: false, fullHistory: [] }), false, "新会话首回合 → 非 resumed")
  assert.equal(detectRestoredSession({ depth: 0, resume: false, autoTurn: false, fullHistory: [{ role: "user", content: "x" }] }), false, "新会话次回合不误判")
  // resume/autoTurn/depth>0 不消费检测闸
  _resetRestartDetectionForTests()
  assert.equal(detectRestoredSession({ depth: 0, resume: true, autoTurn: false, fullHistory: [{}] }), false, "中断续跑不判 resumed")
  assert.equal(detectRestoredSession({ depth: 0, resume: false, autoTurn: true, fullHistory: [{}] }), false, "digest 回合不判 resumed")
  assert.equal(detectRestoredSession({ depth: 1, resume: false, autoTurn: false, fullHistory: [{}] }), false, "子代理不判 resumed")
  assert.equal(detectRestoredSession({ depth: 0, resume: false, autoTurn: false, fullHistory: [{}] }), true, "闸未被前述调用消费——首个真实用户回合仍判定")
  _resetRestartDetectionForTests()
})

test("T-E5 接线面: setupAgentRun——恢复会话首回合注入 process restarted + env-state resumed: yes；次回合 resumed: no；mode 取自 engState", async () => {
  const { setupAgentRun } = await import("../src/agent/setup.mjs")
  const { _resetRestartDetectionForTests } = await import("../src/agent/setup-reminders.mjs")
  _resetRestartDetectionForTests()
  const cwd = mkdtempSync(join(tmpdir(), "tc-envstate-"))
  try {
    const provider = { name: "t", baseURL: "http://127.0.0.1:1", apiKey: "k", model: "deepseek-v4-pro" }
    const mk = (restored) => {
      const fullHistory = restored ? [{ role: "user", content: "旧会话消息" }] : []
      return { mcpServers: [], skills: [], engState: { enabled: true }, history: [...fullHistory], fullHistory }
    }
    const envLines = (h) => h.filter((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: env:"))
    // 恢复会话首回合
    const opts1 = mk(true)
    await setupAgentRun({ provider, cwd, input: "hi", opts: opts1, depth: 0, role: undefined, getAuto: () => false })
    assert.ok(opts1.history.some((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: process restarted at ")), "process restarted 注入（CLI 同款补齐——R5）")
    const e1 = envLines(opts1.history)
    assert.equal(e1.length, 1, "每回合恰好一条 env-state")
    assert.ok(e1[0].content.includes("env: vscode") && e1[0].content.includes("resumed: yes"), "首回合 env=vscode + resumed: yes")
    assert.ok(e1[0].content.includes("mode: eng"), "engState.enabled → mode: eng")
    // 次回合（同会话继续）：resumed 消费尽
    const opts2 = mk(true)
    await setupAgentRun({ provider, cwd, input: "again", opts: opts2, depth: 0, role: undefined, getAuto: () => false })
    const e2 = envLines(opts2.history)
    assert.ok(e2[0].content.includes("resumed: no"), "次回合 resumed: no")
    assert.ok(!opts2.history.some((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: process restarted at ")), "process restarted 不重复")
  } finally {
    _resetRestartDetectionForTests()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-E6: collectGitContext 富注入（branch/commits/uncommitted——CLI 同款）；pushGitContext transient 入机读线", async () => {
  const { collectGitContext, pushGitContext } = await import("../src/agent/setup-reminders.mjs")
  const ctx = collectGitContext(REPO_ROOT)
  if (!ctx) return // 非 git checkout 运行环境（tarball 分发）——环境依赖跳过
  assert.ok(ctx.includes("Git context: on branch"), "富注入：branch")
  assert.ok(ctx.includes("Recent commits:"), "富注入：commits（非 clean|dirty 摘要）")
  const h = []
  pushGitContext(h, REPO_ROOT)
  assert.equal(h.length, 1, "git 仓库 → 一条注入")
  assert.ok(h[0].content.startsWith("[System reminder: git context:"), "CLI 同款前缀")
  assert.equal(h[0].transient, true, "transient 标记")
})

test("T-E11: 非 git 仓库 cwd —— collectGitContext 返回空、pushGitContext 不注入（安全降级不崩）", async () => {
  const { collectGitContext, pushGitContext } = await import("../src/agent/setup-reminders.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-nogit-"))
  try {
    assert.equal(collectGitContext(cwd), "", "非 git 仓库 → 空串")
    const h = []
    pushGitContext(h, cwd)
    assert.equal(h.length, 0, "无注入（静默跳过）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
