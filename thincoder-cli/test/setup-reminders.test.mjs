/**
 * setup-reminders.test.mjs — SESSION.md §6.11（2026-09-08——F1 env-state slot 字段 +
 * F2 resumed 按会话跟踪 + F3 CLI 伪触发修复 + N6 注入句解耦）CLI 端单测（双端镜像：
 * VSC 仓同文件名的同套用例——模板同构、载体异名）。
 *
 * 覆盖（§6.11 测试段）：
 *  - envStateLine 模板：slot 字段存在/位置（model 后 resumed 前）/null 降级/resumed yes-no；
 *  - pushEnvStateReminder：agent._envResumed 消费即清（每次恢复一次）+ slot 透传（粘性
 *    agent._slot——无绑定显式 null——N3）+ model 降级族（activeModel → provider → unknown）；
 *  - applySession 恢复事件：载入历史非空 → 武装（下回合 yes 一次）→ 再切槽 → 再武装再
 *    yes；无恢复事件恒 no（空历史槽切换 / sessionStart 单值——旧 _sessionStart != null
 *    推断的两条伪触发向量——均不武装——F3 回归锚）；
 *  - prepareRun 注入句解耦（AC4）：_processRestartPending（bin 启动 resume 路径设）→
 *    发 process restarted 句一次 + 清；随后切槽（applySession 再武装 _envResumed、不设
 *    _processRestartPending）→ resumed:yes 无句；进程内多次切槽句不再发；全新会话
 *    turn 2（_sessionStart 已播种）不发句、恒 resumed:no。
 *  - GIT-ASYNC L21（2026-09-09）：composeGitContext 三形态单测（AC-4 字节 parity——
 *    detached/dirty>20 截断/clean——纯函数不需真 git）+ collectGitContext 失败冷却单测
 *    （AC-3 必做锁——非 git 目录 ms 级真失败 → catch 记 ts → 30s 内二次调用跳过——
 *    不触发真 5s 超时；Map 预填 ts 正向锁 skip 路径 + >30s 旧条目访问时惰性清）。
 * 归册（2026-09-12 收尾轮 9）：prepareRun ×3 + collectGitContext ×2 走真 git 子进程——
 * slow() 门控（快层 skip、test:full 照跑）。
 */
import { test, beforeEach, afterEach } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { envStateLine, pushEnvStateReminder } from "@thincoder/core/agent/setup-reminders.mjs"
import { composeGitContext, collectGitContext, _gitFailureCooldownForTests, _clearGitFailureCooldownForTests } from "@thincoder/core/agent/helpers.mjs"
import { applySession } from "@thincoder/core/session.mjs"
// prepareRun 测试走静态导入——模块求值在 leaf 用例计时之外（node --test 文件级并行，
// 导入链（agent-tools/agent.mjs 等）只在首用例的 await import 内再付一次动态成本）
import { prepareRun } from "@thincoder/core/agent/setup.mjs"

/** 取 history 中最后一条 env-state 行（prepareRun 每 depth-0 回合注入一条）。 */
function envOf(agent) {
  for (let i = agent.history.length - 1; i >= 0; i--) {
    const c = agent.history[i]?.content
    if (typeof c === "string" && c.startsWith("[System reminder: env: cli,")) return c
  }
  return null
}

/** history 中 process restarted 句计数（transient 机器行——进程内累计可见）。 */
function restartCount(agent) {
  return agent.history.filter((m) =>
    typeof m.content === "string" && m.content.startsWith("[System reminder: process restarted at ")
  ).length
}

/** Windows 实测：git 子进程退出后其 cwd 目录句柄释放滞后 close 事件 ~300ms——rmSync 偶发
 *  EPERM（rmSync maxRetries 不覆盖此窗）——短重试兜底（GIT-ASYNC 冷却测试专用）。 */
async function rmGitCwdDir(dir) {
  for (let attempt = 0; ; attempt++) {
    try {
      rmSync(dir, { recursive: true, force: true })
      return
    } catch {
      if (attempt >= 10) throw new Error(`rmGitCwdDir: dir still locked after retries: ${dir}`)
      await new Promise((r) => setTimeout(r, 250))
    }
  }
}

/** applySession/pushEnvStateReminder 级最小 mock agent（不走 prepareRun）。 */
function mockAgent(over = {}) {
  return { config: {}, history: [], ...over }
}

/** prepareRun 级 agent（§6.11 注入句消费路径的完整 run 形态）。 */
function runAgentMock(cwd, over = {}) {
  return {
    config: { agent: {} },
    history: [],
    tools: [],
    cwd,
    _pendingReminders: [],
    autoApprove: false,
    memory: undefined,
    overlay: undefined,
    ...over,
  }
}

const sessionData = (history, over = {}) => ({
  history,
  contextHistory: [...history],
  title: "",
  tasks: [],
  planMode: false,
  goal: null,
  autoApprove: false,
  pendingReminders: [],
  ...over,
})

let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "setup-rem-")) })
// GIT-ASYNC L21：prepareRun 现以 tmp 为 git cwd（async 子进程）——句柄释放滞后 → afterEach
// rmSync 偶发 EPERM——走短重试（既有用例零语义改）
afterEach(async () => { await rmGitCwdDir(tmp) })

// ─── envStateLine 模板（§6.11 测试段——slot 字段存在/位置/null 降级/resumed yes-no）───

test("envStateLine: slot 字段存在且位置在 model 后 resumed 前（双端同构模板——END=cli）", () => {
  assert.equal(
    envStateLine({ mode: "normal", model: "m1", slot: 3, resumed: false }),
    "[System reminder: env: cli, mode: normal, model: m1, slot: 3, resumed: no.]",
  )
  assert.equal(
    envStateLine({ mode: "eng", model: "m1", slot: 3, resumed: true }),
    "[System reminder: env: cli, mode: eng, model: m1, slot: 3, resumed: yes.]",
  )
  // 位置纪律：slot 在 model 后、resumed 前（模板逐字对齐——行位错 = 双端漂移）
  const line = envStateLine({ mode: "normal", model: "m1", slot: 3, resumed: true })
  assert.ok(line.indexOf("model: m1") < line.indexOf("slot: 3"), "slot after model")
  assert.ok(line.indexOf("slot: 3") < line.indexOf("resumed: yes"), "slot before resumed")
})

test("envStateLine: slot 无绑定 → 显式 slot: null（N3——不读 manifest active 共享指针）", () => {
  assert.equal(
    envStateLine({ mode: "normal", model: "m1", slot: null, resumed: false }),
    "[System reminder: env: cli, mode: normal, model: m1, slot: null, resumed: no.]",
  )
})

// ─── pushEnvStateReminder：_envResumed 消费即清 + slot 透传（F2——每次恢复一次）───

test("pushEnvStateReminder: 消费 agent._envResumed 即清——armed 后首推 resumed:yes、次推 no", () => {
  const agent = mockAgent({
    config: { agent: { engineering: true } },
    activeModel: "dm",
    _slot: 2,
    _envResumed: true,
  })
  pushEnvStateReminder(agent)
  assert.equal(agent.history.length, 1)
  const line1 = agent.history[0].content
  assert.ok(line1.startsWith("[System reminder: env: cli,"), line1)
  assert.match(line1, /mode: eng/)
  assert.match(line1, /model: dm/)
  assert.match(line1, /slot: 2/)
  assert.match(line1, /resumed: yes\./)
  assert.equal(agent._envResumed, false, "armed 标志读即清——后续回合 no")
  pushEnvStateReminder(agent)
  assert.match(envOf(agent), /resumed: no\./)
})

test("pushEnvStateReminder: slot 降级族——_slot 无绑定显式 null + model 回退（activeModel → provider.model → unknown）", () => {
  // 无 _slot、无 activeModel、无 provider → slot: null / model: unknown / mode: normal
  const a1 = mockAgent()
  pushEnvStateReminder(a1)
  assert.equal(envOf(a1), "[System reminder: env: cli, mode: normal, model: unknown, slot: null, resumed: no.]")
  // provider.model 回退（activeModel null——T-E12 既有降级族）
  const a2 = mockAgent({ provider: { model: "pm" } })
  pushEnvStateReminder(a2)
  assert.match(envOf(a2), /model: pm/)
})

// ─── applySession 恢复事件（F2/F3——§6.11 测试段）───

test("applySession: 载入历史非空 → 武装 _envResumed——下回合 resumed:yes 一次、再切槽再武装再 yes", () => {
  const agent = mockAgent()
  // 启动/切换恢复：有历史槽 → 恢复事件
  applySession(agent, sessionData([{ role: "user", content: "u1" }, { role: "user", content: "u2" }]))
  assert.equal(agent._envResumed, true, "恢复事件武装（每次恢复一次）")
  pushEnvStateReminder(agent)
  assert.match(envOf(agent), /resumed: yes\./)
  assert.equal(agent._envResumed, false, "消费即清")
  // 同会话续跑（无新恢复事件）→ 恒 no
  pushEnvStateReminder(agent)
  assert.match(envOf(agent), /resumed: no\./)
  // 再切槽（另一有历史槽）→ 再武装 → 再 yes（AC2）
  applySession(agent, sessionData([{ role: "user", content: "u3" }]))
  assert.equal(agent._envResumed, true)
  pushEnvStateReminder(agent)
  assert.match(envOf(agent), /resumed: yes\./)
})

test("applySession: 无恢复事件恒 no——空历史槽切换与 sessionStart 单值两条 F3 向量均不武装", () => {
  // 向量 1：全新会话从未 applySession（无恢复事件）→ 恒 no
  const a1 = mockAgent()
  pushEnvStateReminder(a1)
  assert.match(envOf(a1), /resumed: no\./)
  pushEnvStateReminder(a1)
  assert.match(envOf(a1), /resumed: no\./)
  // 向量 2：空历史槽切换（/new 或空会话 applySession——history 为空）→ 不武装
  const a2 = mockAgent()
  applySession(a2, sessionData([]))
  assert.equal(a2._envResumed, false, "空历史显式清 false（恢复事件按当前 data 重定——评审 round2 🟡）")
  pushEnvStateReminder(a2)
  assert.match(envOf(a2), /resumed: no\./)
  // 向量 3：sessionStart 单值（旧 _sessionStart != null 推断的唯一依据）——空历史 +
  // sessionStart 在场仍不武装（伪触发根因——旧 prepareRun 会在 turn 2 依 _sessionStart
  // 已播种而误报；现恢复事件只认 history 非空）
  const a3 = mockAgent()
  applySession(a3, sessionData([], { sessionStart: "2026-01-01T00:00:00.000Z" }))
  assert.equal(a3._sessionStart, "2026-01-01T00:00:00.000Z")
  assert.equal(a3._envResumed, false)
  pushEnvStateReminder(a3)
  assert.match(envOf(a3), /resumed: no\./)
  // 向量 4（评审 round2 🟡 回归锚）：已武装 agent（启动恢复过有历史槽）→ 首个回合前切到
  // 空历史槽 → 残留武装必须被清——新会话首回合恒 no（无恢复事件不误报）
  const a4 = mockAgent()
  applySession(a4, sessionData([{ role: "user", content: "restored" }]))
  assert.equal(a4._envResumed, true, "恢复事件武装")
  applySession(a4, sessionData([], { sessionStart: "2026-01-01T00:00:00.000Z" }))
  assert.equal(a4._envResumed, false, "空历史 applySession 清除残留武装（F3 家族——切槽到空槽不误报）")
  pushEnvStateReminder(a4)
  assert.match(envOf(a4), /resumed: no\./)
})

// ─── prepareRun 注入句消费（N6/AC4——双信号独立）───

slow("prepareRun: 启动恢复（_processRestartPending）→ process restarted 句一次 + 清；同回合 env resumed:yes", async () => {
  const agent = runAgentMock(tmp)
  // bin/thincoder.mjs 启动 resume 路径同款序列：resumeSlot → applySession（武装 _envResumed）
  // → 设 _processRestartPending（仅启动路径）
  applySession(agent, sessionData([{ role: "user", content: "old-session" }], { sessionStart: "2026-01-01T00:00:00.000Z" }))
  agent._processRestartPending = true
  await prepareRun(agent, "hi", { onTaskUpdate() {} }, { depth: 0, systemPrompt: "sys", disciplineRules: "d", mainOverlay: "m" })
  assert.equal(restartCount(agent), 1, "启动恢复发句一次")
  assert.equal(agent._processRestartPending, false, "发句即清——进程内只一次")
  assert.match(envOf(agent), /resumed: yes\./, "恢复回合 env-state resumed:yes（AC2）")
  assert.match(envOf(agent), /slot: null,/, "本轮未钉槽（测试 agent 无 _slot）→ 显式 null")
})

slow("prepareRun: 切槽 resumed:yes 无 process restarted 句——进程内多次切槽句不再发（AC4/N6）", async () => {
  const agent = runAgentMock(tmp)
  const runOpts = { depth: 0, systemPrompt: "sys", disciplineRules: "d", mainOverlay: "m" }
  // 启动恢复（一次）
  applySession(agent, sessionData([{ role: "user", content: "s0" }], { sessionStart: "2026-01-01T00:00:00.000Z" }))
  agent._processRestartPending = true
  await prepareRun(agent, "hi", { onTaskUpdate() {} }, runOpts)
  assert.equal(restartCount(agent), 1)
  // 进程内切槽 ×2（/session 语义——applySession 再武装 _envResumed、不设 _processRestartPending）。
  // 切槽把 history 重指为目标槽盘上机读线——上一会话行的句随线替换消失（不跨会话携带）；
  // 判据 = 本回合不发新句（每会话行内句计数 0）+ 启动标志不再现。
  applySession(agent, sessionData([{ role: "user", content: "s1" }], { sessionStart: "2026-02-01T00:00:00.000Z" }))
  assert.equal(agent._processRestartPending, false, "applySession 不设启动标志（bin 仅启动路径设）")
  await prepareRun(agent, "hi", { onTaskUpdate() {} }, runOpts)
  assert.equal(restartCount(agent), 0, "切槽不发 process restarted 句（N6——切槽不误报进程重启）")
  assert.match(envOf(agent), /resumed: yes\./, "切槽恢复 → resumed:yes（F2/AC2）")
  applySession(agent, sessionData([{ role: "user", content: "s2" }], { sessionStart: "2026-03-01T00:00:00.000Z" }))
  await prepareRun(agent, "hi", { onTaskUpdate() {} }, runOpts)
  assert.equal(restartCount(agent), 0, "进程内多次切槽句不再发")
  assert.match(envOf(agent), /resumed: yes\./)
})

slow("prepareRun: 全新会话 turn 2 不再伪触发——_sessionStart 已播种仍无句、恒 resumed:no（F3）", async () => {
  const agent = runAgentMock(tmp)
  const runOpts = { depth: 0, systemPrompt: "sys", disciplineRules: "d", mainOverlay: "m" }
  // turn 1：全新会话（无恢复事件）——prepareRun 内部 ??= 播种 _sessionStart
  await prepareRun(agent, "hi", { onTaskUpdate() {} }, runOpts)
  assert.ok(agent._sessionStart, "首跑播种 sessionStart（OS reminder 缓存键）")
  assert.equal(restartCount(agent), 0, "无恢复事件不发句")
  assert.match(envOf(agent), /resumed: no\./)
  // turn 2：旧实现 wasRestored = _sessionStart != null 在此必误报——现无标记可消费
  await prepareRun(agent, "hi again", { onTaskUpdate() {} }, runOpts)
  assert.equal(restartCount(agent), 0, "F3：turn 2 无 process restarted 伪触发")


  assert.match(envOf(agent), /resumed: no\./, "F3：turn 2 恒 resumed:no（AC3）")
})


// ─── GIT-ASYNC L21：composeGitContext 三形态（AC-4 字节 parity 锁——纯函数不需真 git）───

test("composeGitContext: 富形态——branch + commits + uncommitted（逐字节 parity——现拼装保留）", () => {
  assert.equal(
    composeGitContext({ branch: "main", log: "abc123 first commit\ndef456 second", status: " M src/x.mjs\n?? new.mjs" }),
    "Git context: on branch `main`, 2 uncommitted change(s).\n" +
      "Recent commits:\nabc123 first commit\ndef456 second\n" +
      "Uncommitted:\n M src/x.mjs\n?? new.mjs",
  )
})

test("composeGitContext: detached（branch 空 → (detached)）+ dirty>20 截断（头 20 + 省略注差）", () => {
  const lines = Array.from({ length: 25 }, (_, i) => ` M f${String(i).padStart(2, "0")}.mjs`)
  assert.equal(
    composeGitContext({ branch: "", log: "only one", status: lines.join("\n") }),
    "Git context: on branch `(detached)`, 25 uncommitted change(s).\n" +
      "Recent commits:\nonly one\n" +
      "Uncommitted:\n" + lines.slice(0, 20).join("\n") + "\n… (5 more)",
  )
})

test("composeGitContext: clean 形态（空 status/log——等价 git 无输出）+ log-only 变体", () => {
  assert.equal(
    composeGitContext({ branch: "main", log: "", status: "" }),
    "Git context: on branch `main`, working tree clean.",
  )
  assert.equal(
    composeGitContext({ branch: "main", log: "abc one", status: "" }),
    "Git context: on branch `main`, working tree clean.\nRecent commits:\nabc one",
  )
})

// ─── GIT-ASYNC L21：失败冷却（AC-3 必做锁——确定性 seam = 非 git 目录 ms 级快失败 +
//      Map 预填正向锁——评审 #3：真 git 5s 超时永不触发）───

slow("collectGitContext: 非 git 目录真失败 → all-or-nothing '' + 记冷却 ts + 30s 内二次调用跳过", async () => {
  const dir = mkdtempSync(join(tmpdir(), "gitctx-fail-"))
  try {
    assert.equal(await collectGitContext(dir), "", "非 git 仓——git ms 级失败 → ''（AC-2 同路径）")
    const ts = _gitFailureCooldownForTests(dir)
    assert.ok(typeof ts === "number" && Date.now() - ts < 2000, "catch 已记冷却 ts（Map 读回）")
    assert.equal(await collectGitContext(dir), "", "冷却期内（<30s）二次调用直接跳过 → ''")
  } finally {
    _clearGitFailureCooldownForTests(dir) // 清理 Map 条目
    await rmGitCwdDir(dir) // Windows: git 子进程 cwd 句柄释放滞后 → EPERM 短重试
  }
})

slow("collectGitContext: Map 预填——健康 git 仓也跳过；>30s 旧条目访问时惰性清后恢复收集（评审 #2）", async () => {
  // 探针 = 本仓根（test 文件上级——健康 git 仓：无冷却时 collect 必非空——compose 首行恒非空）
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
  try {
    _gitFailureCooldownForTests(repoRoot, Date.now())
    assert.equal(await collectGitContext(repoRoot), "", "预填 ts=now → 冷却期内跳过（健康仓也跳过——正向锁 skip 路径）")
    _gitFailureCooldownForTests(repoRoot, Date.now() - (30_000 + 1000))
    const out = await collectGitContext(repoRoot)
    assert.notEqual(out, "", ">30s 旧条目 → 访问时惰性清 → 恢复收集（健康仓输出非空）")
    assert.equal(_gitFailureCooldownForTests(repoRoot), undefined, "惰性清后条目已删")
  } finally {
    _clearGitFailureCooldownForTests(repoRoot)
  }
})
