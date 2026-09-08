/**
 * agent-lifecycle-singleton.test.mjs — AGENT-LOOP.md §11（2026-09-08 agent 生命周期对齐
 * CLI——面板会话级顶层 agent 单例）纯函数单测（对标 eng-settlement.test 模式——快层可测）：
 *  - buildTopLevelAgent 字段默认（A/C/B 归类起点——loop/tools 读面）；
 *  - resetRunState §11.2 A 复位清单：回合级计数器/预算/守卫回合边界清零（AC6——不跨回合
 *    累计），C 类（_tasks/_goal/_engDesignTokens/config engineering）保留；
 *  - reconcileEngDesignTokens §11.2 C：Map 永不复位清空（内存未结算项保留——双载体漂移
 *    根因消除）+ 槽权威合入（TTL 过滤）+ legacy 镜像一次性迁移；
 *  - applySlotSessionState §11.2.1 槽↔hydrate 映射：engineering/advisor.guard/planMode/
 *    engDesignTokens 每轮槽权威；restore（首轮/destroy 重建）回填 tasks/goal/
 *    pendingReminders——复用路径内存权威（不覆盖）；
 *  - agentSlotMatches / ensurePanelAgent 绑定判定（cwd×slot 匹配复用/不匹配销毁——AC1/AC4）；
 *  - §11.7（交付缺口补强）：agentState 6 字段（tasks/goal/pendingReminders 回写槽）+ saveLines
 *    落盘闭环（agentState → saveLines → 槽 → destroy 重建 hydrate 回填——F4）+ abort/finally
 *    键缺席保留槽值 + 干净完成空态即权威（stale 提醒不跨重建复活）。
 * 生命周期语义（回合复用/切换销毁/落盘）由真机 slow 门控兜底。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"
import {
  buildTopLevelAgent, resetRunState, reconcileEngDesignTokens, applySlotSessionState, hydrateRun,
} from "../src/agent/setup.mjs"
import { agentSlotMatches, ensurePanelAgent } from "../src/extension/panel-chat.mjs"
import { _cwd } from "../src/extension/panel-messages.mjs"
import { agentState } from "../src/agent/run-helpers.mjs"
import { saveLines } from "../src/extension/panel-session.mjs"
import { loadSlot } from "../src/extension/session-io.mjs"

let sessionsDir

const liveTok = () => `${randomUUID()}:${Date.now() + 3600e3}`
const expiredTok = () => `${randomUUID()}:${Date.now() - 3600e3}`
/** Minimal resolved-config bag (the shape hydrateRun builds from loadRaw). */
const cfgBag = (over = {}) => ({
  engineering: false,
  advisor: { guard: false },
  agentFields: { subagentModel: null, subagentModels: {}, subagentTurns: 100, maxTurns: 200, verifyGuard: false, compactThreshold: null, consultModels: [], consultTurns: 40, consultTimeoutMs: 600000, waitForTimeoutMs: undefined, poolLimits: null },
  proxy: undefined, shell: null, providersList: [], websearch: { provider: "tavily", apiKey: "" },
  ...over,
})

beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "agentlc-sess-"))
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  rmSync(sessionsDir, { recursive: true, force: true })
})

test("buildTopLevelAgent: A/C/B field defaults for the singleton loop", () => {
  const a = buildTopLevelAgent()
  // C — session-level (never per-run reset)
  assert.deepEqual(a._tasks, [])
  assert.equal(a._goal, null)
  assert.equal(a._engDesignTokens, null)
  assert.deepEqual(a._pendingReminders, [])
  // A — per-run budgets/guards
  assert.deepEqual(a._touchedFiles, [])
  assert.equal(a._verifiedThisRun, false)
  assert.equal(a._verifyPassed, undefined)
  assert.equal(a._verifyRetries, 0)
  assert.equal(a._advisorRound, 0)
  assert.equal(a._lastEngState, false)
  assert.equal(a._runStartHistoryLen, 0)
  // B — run bindings
  assert.equal(a._role, null)
  assert.equal(a._planMode, false)
  assert.equal(a.cwd, null)
  assert.equal(a.config.agent.engineering, false)
  assert.equal(a.config.advisor.guard, false)
})

test("resetRunState: A-class budgets/flags cleared at the run boundary, C-class preserved", () => {
  const a = buildTopLevelAgent()
  // C — session-level state must survive every runAgent call
  const tok = liveTok()
  a._tasks = [{ title: "t1", status: "in_progress" }]
  a._goal = { objective: "g", status: "active", turnsUsed: 2 }
  a._engDesignTokens = new Map([["d1", tok]])
  a.config.agent.engineering = true
  a.config.advisor = { guard: true }
  // A — dirty every per-run field
  a._touchedFiles = ["/proj/x.mjs"]
  a._verifiedThisRun = true
  a._verifyPassed = false
  a._verifyRetries = 2
  a._honestReminderInjected = true
  a._pendingTimers = [{ id: 1, expiresAt: Date.now(), message: "t" }]
  a._lastPromptTokens = 12345
  a._usageAtLen = 9
  a._compressFailures = 1
  a._emptyRetries = 1
  a._taskPushbacks = 1
  a._advisorRound = 3
  a._advisorSession = { id: "sess" }
  a._lastAdvisorOutput = "prior review output"
  a._calledAdvisorThisRun = true
  a._mutatedThisRun = true
  a._inAutoTurn = true
  a._sessionSignal = new AbortController().signal
  a._runStartHistoryLen = 55
  a._lastCompressInfo = { mode: "summary", tokensFreed: 100 }
  a._lastEngState = true
  a._pendingReminders = ["[System reminder: engineering mode is now ON]"]
  resetRunState(a)
  // A cleared — budgets must NOT accumulate across turns (AC6)
  assert.deepEqual(a._touchedFiles, [])
  assert.equal(a._verifiedThisRun, false)
  assert.equal(a._verifyPassed, undefined)
  assert.equal(a._verifyRetries, 0)
  assert.equal(a._honestReminderInjected, false)
  assert.deepEqual(a._pendingTimers, [])
  assert.equal(a._lastPromptTokens, null)
  assert.equal(a._usageAtLen, null)
  assert.equal(a._compressFailures, 0)
  assert.equal(a._emptyRetries, 0)
  assert.equal(a._taskPushbacks, 0)
  assert.equal(a._advisorRound, 0)
  assert.equal(a._advisorSession, null)
  assert.equal(a._lastAdvisorOutput, null)
  assert.equal(a._calledAdvisorThisRun, false)
  assert.equal(a._mutatedThisRun, false)
  assert.equal(a._inAutoTurn, false)
  assert.equal(a._sessionSignal, null)
  assert.equal(a._runStartHistoryLen, 0)
  assert.equal(a._lastCompressInfo, null)
  assert.equal(a._lastEngState, false) // eng 进出重通知语义——每 runAgent 重通知
  assert.deepEqual(a._pendingReminders, [])
  // C preserved — session-level singleton benefit (F1)
  assert.equal(a._tasks[0].title, "t1")
  assert.equal(a._goal.objective, "g")
  assert.equal(a._engDesignTokens.get("d1"), tok)
  assert.equal(a.config.agent.engineering, true)
  assert.equal(a.config.advisor.guard, true)
})

test("reconcileEngDesignTokens: memory kept (C), slot merged with TTL, expired dropped, legacy migrated once", () => {
  const memTok = liveTok()
  const slotTok = liveTok()
  const expSlot = expiredTok()
  const expMem = expiredTok()
  const mem = new Map([["mem", memTok], ["expMem", expMem]])
  const r = reconcileEngDesignTokens(mem, { slot: slotTok, expSlot }, null)
  assert.equal(r.map.get("mem"), memTok) // 内存未结算项保留（pre-settle / slot 写失败安全）
  assert.equal(r.map.get("slot"), slotTok) // 槽权威条目合入
  assert.equal(r.map.has("expSlot"), false)
  assert.equal(r.map.has("expMem"), false)
  assert.equal(r.droppedExpired, true)
  // empty map + valid legacy 单值镜像 → 一次性迁移读（AC3 唯一镜像读点）
  const r2 = reconcileEngDesignTokens(null, null, memTok)
  assert.equal(r2.map.size, 1)
  assert.ok(r2.map.has(memTok.split(":")[0]), "legacy token migrated under its uuid")
  // expired legacy → 不迁移（expired 从不授权）
  const r3 = reconcileEngDesignTokens(null, null, expiredTok())
  assert.equal(r3.map.size, 0)
  assert.equal(r3.droppedExpired, false)
  // null 槽表 → 保留既有内存 Map（永不复位清空）
  const kept = new Map([["k", memTok]])
  assert.equal(reconcileEngDesignTokens(kept, null, null).map.get("k"), memTok)
})

test("applySlotSessionState §11.2.1: slot authority for modes/tokens; restore backfills session fields", () => {
  const cfg = cfgBag({ advisor: { guard: false, provider: "cfg-provider" } })
  const slot = {
    engineering: true,
    advisor: { guard: true },
    planMode: true,
    tasks: [{ title: "restored-task", status: "pending" }],
    goal: { objective: "restored-goal", status: "active", turnsUsed: 3 },
    pendingReminders: ["[System reminder: restored]"],
    engDesignTokens: { d1: liveTok() },
  }
  // restore = factory 新建（首轮/destroy 重建同路径）→ 会话级槽字段回填
  const a = buildTopLevelAgent()
  const out = applySlotSessionState(a, { slot, engState: null, planModeOverride: undefined }, { cfg, restore: true })
  assert.equal(a.config.agent.engineering, true)
  assert.equal(a.config.advisor.guard, true)
  assert.equal(a.config.advisor.provider, "cfg-provider") // 非 guard advisor 字段 config-scoped（SESSION §6——只有 guard 槽权威）
  assert.equal(a._planMode, true)
  assert.equal(a._tasks[0].title, "restored-task")
  assert.equal(a._goal.objective, "restored-goal")
  assert.deepEqual(a._pendingReminders, ["[System reminder: restored]"])
  assert.ok(a._engDesignTokens instanceof Map)
  assert.equal(a._engDesignTokens.size, 1)
  assert.equal(out.engineering, true)
  assert.equal(out.droppedExpired, false)
})

test("applySlotSessionState: reuse path — slot modes refresh per run, memory session fields stay authoritative", () => {
  const cfg = cfgBag()
  const memTok = liveTok()
  const slotTok = liveTok()
  // 单例复用（restore=false）：run N 建的 agent 已持内存 C 态
  const a = buildTopLevelAgent()
  a._tasks = [{ title: "live-task", status: "in_progress" }]
  a._goal = { objective: "live-goal", status: "active", turnsUsed: 5 }
  a._engDesignTokens = new Map([["mem", memTok]])
  a.config.agent.engineering = true
  const slot2 = {
    engineering: false,
    advisor: { guard: false },
    planMode: false,
    tasks: [{ title: "stale-slot-task" }], // 槽 tasks 是 CLI 旧写——不复盖内存
    engDesignTokens: { d2: slotTok },
  }
  applySlotSessionState(a, { slot: slot2, engState: null, planModeOverride: undefined }, { cfg, restore: false })
  // 槽权威字段每轮刷新（AC7 同族——外部/CLI 翻转下轮生效）
  assert.equal(a.config.agent.engineering, false)
  assert.equal(a.config.advisor.guard, false)
  assert.equal(a._planMode, false)
  // C 内存态不因每轮 hydrate 覆盖（F1——tasks/goal 跨回合携带；token Map 永不清空）
  assert.equal(a._tasks[0].title, "live-task")
  assert.equal(a._goal.objective, "live-goal")
  assert.equal(a._engDesignTokens.get("mem"), memTok)
  assert.equal(a._engDesignTokens.get("d2"), slotTok) // 槽条目合入
})

test("applySlotSessionState: field-less slot falls back to engState then cfg (SESSION §6)", () => {
  // legacy slot 无 engineering/advisor 字段 → engState（子代理模式镜像）覆盖
  const a1 = buildTopLevelAgent()
  const out1 = applySlotSessionState(a1, { slot: {}, engState: { enabled: true, advisorGuard: null }, planModeOverride: undefined }, { cfg: cfgBag(), restore: false })
  assert.equal(out1.engineering, true)
  assert.equal(a1.config.agent.engineering, true)
  assert.equal(a1.config.advisor.guard, false)
  // 无槽无 engState → cfg（config.json CLI-compat 镜像）
  const a2 = buildTopLevelAgent()
  const out2 = applySlotSessionState(a2, { slot: null, engState: null, planModeOverride: undefined }, { cfg: cfgBag({ engineering: true, advisor: { guard: true } }), restore: false })
  assert.equal(out2.engineering, true)
  assert.equal(a2.config.advisor.guard, true)
  // 显式 planModeOverride（直连调用方）优先于槽
  const a3 = buildTopLevelAgent()
  applySlotSessionState(a3, { slot: { planMode: true }, engState: null, planModeOverride: false }, { cfg: cfgBag(), restore: false })
  assert.equal(a3._planMode, false)
})

test("agentSlotMatches / ensurePanelAgent: cwd×slot 匹配复用、不匹配销毁（AC1/AC4）", () => {
  const agent = buildTopLevelAgent()
  agent._engPersist = { cwd: "/proj", slot: 2 }
  assert.equal(agentSlotMatches(agent, "/proj", 2), true)
  assert.equal(agentSlotMatches(agent, "/proj", 3), false) // 换 slot
  assert.equal(agentSlotMatches(agent, "/other", 2), false) // 换 cwd
  assert.equal(agentSlotMatches(null, "/proj", 2), false)
  assert.equal(agentSlotMatches({}, "/proj", 2), false) // 无 _engPersist（非面板 run）不匹配
  // ensurePanelAgent：绑定一致 → 复用（同一对象不销毁）；不匹配 → 销毁（= null）
  const cwd = _cwd()
  const bound = buildTopLevelAgent()
  bound._engPersist = { cwd, slot: 1 }
  const panel = { _agent: bound }
  assert.equal(ensurePanelAgent(panel, 1), bound)
  assert.equal(panel._agent, bound)
  assert.equal(ensurePanelAgent(panel, 2), null) // 换槽后销毁——不跨会话复用
  assert.equal(panel._agent, null)
  // 销毁后下一轮 factory 重建路径（panel._agent null → runAgent opts.agent 缺省）
  const panel2 = { _agent: null }
  assert.equal(ensurePanelAgent(panel2, 1), null)
})

test("hydrateRun: 复用同一 agent 对象——A 复位回合边界、B 每轮重指、无 per-run 重建（AC1/AC2/AC6）", async () => {
  // 无 git 的临时 cwd——hydrate 的 git/env/peer 注入零 IO 快速路径（git 失败静默）
  const project = join(sessionsDir, "project")
  const agent = buildTopLevelAgent()
  const provider = { model: "deepseek-v4-pro" }
  const optsFor = (over = {}) => ({ provider, cwd: project, input: "hi", opts: {}, depth: 0, role: null, getAuto: () => false, ...over })
  const r1 = await hydrateRun(agent, optsFor())
  // 首轮：factory 路径同款——history 双线装配、config 整建、B 绑定
  assert.equal(r1.agent, agent)
  assert.equal(agent._role, null)
  assert.equal(agent._provider, provider)
  assert.ok(Array.isArray(agent._tasks))
  assert.equal(typeof r1.systemPrompt, "string")
  assert.ok(r1.toolByName instanceof Map)
  assert.ok(agent._fullHistory === r1.fullHistory)
  // 回合内弄脏 A 类 + 挂 C 类——下轮 hydrateRun 复位 A 而 C 保留
  agent._touchedFiles = ["dirty"]
  agent._advisorRound = 4
  agent._emptyRetries = 2
  agent._lastEngState = true
  agent._tasks = [{ title: "carry", status: "pending" }]
  agent._engDesignTokens = new Map()
  const r2 = await hydrateRun(agent, optsFor())
  assert.equal(r2.agent, agent, "AC1: 复用同一对象——无 per-run 重建")
  assert.deepEqual(agent._touchedFiles, [], "AC6: 回合级计数器回合边界清零")
  assert.equal(agent._advisorRound, 0)
  assert.equal(agent._emptyRetries, 0)
  assert.equal(agent._lastEngState, false)
  assert.equal(agent._tasks[0].title, "carry", "C 类 _tasks 会话级不复位（F1）")
  assert.equal(agent._fullHistory, r2.fullHistory, "history 每轮重指")
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
  const cwd = _cwd() // vscode mock workspaceFolders=[] → process.cwd()；sessions dir 已隔离
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

