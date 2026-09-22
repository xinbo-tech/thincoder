/**
 * agent-session-fields-roundtrip.test.mjs — 会话级三字段 round-trip 面（2026-09-22 structure-debt §2.3 · #169B）：
 * 自 agent-lifecycle-singleton.test.mjs 迁出 §11.7 会话级三字段（tasks / goal / pendingReminders）
 * 回写槽与落盘闭环用例组——D-2 拆分（迁出用例逐字搬移 / 新档头部自持 / 零跨档 import / 用例数守恒）。
 * 装置面（sessionsDir 隔离 / 真仓根 manifest 副产物守卫 / 目录清理重试）自原档逐字副本。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"
import { _clearGitFailureCooldownForTests } from "../src/agent/setup-reminders.mjs"
import { buildTopLevelAgent } from "../src/agent/setup.mjs"
import { applySlotSessionState } from "../src/agent/agent-state.mjs"
import { _cwd } from "../src/extension/panel-messages.mjs"
import { agentState } from "../src/agent/run-helpers.mjs"
import { saveLines } from "../src/extension/panel-session.mjs"
import { loadSlot } from "../src/extension/session-io.mjs"

let sessionsDir
// M1-manifest 钩子副产物守卫：slow hydrateRun 用例 cwd = _cwd()（真仓根）——缺档初始化会写
// PROJECT-MANIFEST.json；afterEach 只清「本用例新建」者（预先存在 = 不删——不代管真实档）。
let manifestPreexisted = false

const liveTok = () => `${randomUUID()}:${Date.now() + 3600e3}`

/** Minimal resolved-config bag (the shape hydrateRun builds from loadRaw). */
const cfgBag = (over = {}) => ({
  engineering: false,
  advisor: { guard: false },
  agentFields: { subagentModel: null, subagentModels: {}, subagentTurns: 100, maxTurns: 200, verifyGuard: false, compactThreshold: null, consultModels: [], consultTurns: 40, consultTimeoutMs: 600000, waitForTimeoutMs: undefined, poolLimits: null, autoThink: false },
  proxy: undefined, shell: null, providersList: [], websearch: { apiKey: "" },
  ...over,
})

beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "agentlc-sess-"))
  _setSessionsDirForTest(sessionsDir)
  manifestPreexisted = existsSync(join(_cwd(), "PROJECT-MANIFEST.json"))
})
// Windows 实测：git 子进程退出后其 cwd 目录句柄释放滞后 close 事件 ~300ms——rmSync 偶发
// EPERM（rmSync maxRetries 不覆盖此窗）——短重试兜底（同 setup-reminders.test.mjs rmGitCwdDir）。
async function rmDirRetry(dir) {
  for (let attempt = 0; ; attempt++) {
    try {
      rmSync(dir, { recursive: true, force: true })
      return
    } catch {
      if (attempt >= 10) throw new Error(`rmDirRetry: dir still locked after retries: ${dir}`)
      await new Promise((r) => setTimeout(r, 250))
    }
  }
}
afterEach(async () => {
  _resetSessionsDirForTest()
  // 清理 git 冷却预填条目（每用例路径独立）
  _clearGitFailureCooldownForTests(join(sessionsDir, "project"))
  _clearGitFailureCooldownForTests(join(sessionsDir, "project-175"))
  await rmDirRetry(sessionsDir)
  // M1 副产物守卫：真仓根 manifest 仅清本用例新建者（预先存在 = 真实档——不代删）
  const manifestPath = join(_cwd(), "PROJECT-MANIFEST.json")
  if (!manifestPreexisted && existsSync(manifestPath)) rmSync(manifestPath, { force: true })
})

test("agentState §11.7: 6 fields — tasks/goal/pendingReminders ride the slot round-trip", () => {
  const a = buildTopLevelAgent()
  a.config.agent.engineering = true
  a.config.advisor = { guard: true }
  const tok = liveTok()
  a._engDesignTokens = new Map([["d1", tok]])
  const tasks = [{ title: "t1", status: "in_progress" }]
  const goal = { objective: "g", status: "active", turnsUsed: 2 }
  a._tasks = tasks
  a._goal = goal
  a._pendingReminders = ["[System reminder: engineering mode is now ON]"]
  const s = agentState(a)
  // 3 mode/token fields + §11.7 三会话级字段
  assert.equal(Object.keys(s).length, 6)
  assert.equal(s.engineering, true)
  assert.equal(s.advisorGuard, true)
  assert.deepEqual(s.engDesignTokens, { d1: tok })
  assert.deepEqual(s.tasks, tasks)
  assert.deepEqual(s.goal, goal)
  assert.deepEqual(s.pendingReminders, a._pendingReminders)
  // 快照拷贝（非引用）——onComplete 后内存继续变更不泄漏进已捕获的保存态
  assert.notEqual(s.tasks, tasks)
  assert.notEqual(s.goal, goal)
  assert.notEqual(s.pendingReminders, a._pendingReminders)
  // 空态如实反映内存：fresh agent → []/null（干净完成回合内存即权威）
  const f = buildTopLevelAgent()
  const sf = agentState(f)
  assert.deepEqual(sf.tasks, [])
  assert.equal(sf.goal, null)
  assert.deepEqual(sf.pendingReminders, [])
  assert.equal(sf.engDesignTokens, null) // 空 Map → null（D2: 是否清槽由 saveLines 合并决定）
})

test("§11.7 closed loop: agentState → saveLines 落盘三字段 → destroy 重建 hydrate 回填（F4）", () => {
  const cwd = _cwd() // vscode mock 默认单根 = process.cwd() ⇒ _cwd() 恒 process.cwd()；sessions dir 已隔离
  const slot = 1
  const agent = buildTopLevelAgent()
  agent._tasks = [{ title: "rt", status: "pending" }]
  agent._goal = { objective: "rg", status: "active", turnsUsed: 3 }
  agent._pendingReminders = ["[System reminder: restored]"]
  const fullHistory = [{ role: "user", content: "hi" }]
  // onComplete 路径同款 extra：{ activeProvider, ...agentState }（panel-callbacks 透传）
  saveLines({}, fullHistory, [...fullHistory], { activeProvider: "test-provider", ...agentState(agent) }, slot)
  const data = loadSlot(cwd, slot)
  assert.ok(data, "slot written by saveLines")
  assert.deepEqual(data.tasks, agent._tasks)
  assert.deepEqual(data.goal, agent._goal)
  assert.deepEqual(data.pendingReminders, agent._pendingReminders)
  // destroy（loadSession 切走）→ 切回同槽 → 重建 hydrate restore 回填（11.2.1「destroy
  // 后重建回填」用例表行——经真实 saveLines 落盘闭环，非合成槽）
  const rebuilt = buildTopLevelAgent()
  applySlotSessionState(rebuilt, { slot: data, engState: null, planModeOverride: undefined }, { cfg: cfgBag(), restore: true })
  assert.deepEqual(rebuilt._tasks, agent._tasks)
  assert.deepEqual(rebuilt._goal, agent._goal)
  assert.deepEqual(rebuilt._pendingReminders, agent._pendingReminders)
})

test("saveLines: abort/finally 保存（键缺席）保留既有 tasks/goal/pendingReminders——undefined 语义", () => {
  const cwd = _cwd()
  const slot = 1
  const agent = buildTopLevelAgent()
  agent._tasks = [{ title: "keep", status: "in_progress" }]
  agent._goal = { objective: "keep-goal", status: "active", turnsUsed: 1 }
  agent._pendingReminders = ["[System reminder: keep]"]
  saveLines({}, [], [], { activeProvider: "p", ...agentState(agent) }, slot)
  // panel-chat finally/abort 路径：extra 只带 activeProvider——三字段键缺席 → 槽值原样保留
  saveLines({}, [], [], { activeProvider: "p" }, slot)
  const data = loadSlot(cwd, slot)
  assert.deepEqual(data.tasks, agent._tasks)
  assert.deepEqual(data.goal, agent._goal)
  assert.deepEqual(data.pendingReminders, agent._pendingReminders)
})

test("saveLines: 干净完成空态即权威——无任务/无目标写 []/null，stale 提醒不跨重建复活", () => {
  const cwd = _cwd()
  const slot = 1
  // 槽先有 stale 会话级状态（CLI 旧写/上一会话残留）
  const prior = buildTopLevelAgent()
  prior._tasks = [{ title: "stale", status: "pending" }]
  prior._goal = { objective: "stale-goal", status: "active", turnsUsed: 9 }
  prior._pendingReminders = ["[System reminder: stale]"]
  saveLines({}, [], [], { activeProvider: "p", ...agentState(prior) }, slot)
  // 干净完成回合：fresh agent（内存空）→ 空态如实落盘——提醒已 flush 进历史，重建不得复活
  saveLines({}, [], [], { activeProvider: "p", ...agentState(buildTopLevelAgent()) }, slot)
  const data = loadSlot(cwd, slot)
  assert.deepEqual(data.tasks, [])
  assert.equal(data.goal, null)
  assert.deepEqual(data.pendingReminders, [])
})
