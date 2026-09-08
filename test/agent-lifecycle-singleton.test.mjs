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
 *  - agentSlotMatches / ensurePanelAgent 绑定判定（cwd×slot 匹配复用/不匹配销毁——AC1/AC4）。
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
