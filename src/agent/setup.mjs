/**
 * agent/setup.mjs — pre-loop setup for runAgent: tool table, config, system prompt,
 * dual-line history, and startup context injection.
 * Extracted from agent.mjs (file-size split).
 * AGENT-LOOP.md §11（2026-09-08——agent 生命周期对齐 CLI）：setupAgentRun 拆出
 * buildTopLevelAgent（agent 对象工厂——首轮/destroy 重建-only）+ hydrateRun（每轮
 * reconcile——顶层单例复用路径）。纯函数层 resetRunState / reconcileEngDesignTokens /
 * applySlotSessionState 已拆 agent-state.mjs（§11.2 A 复位清单与 §11.2.1 槽↔hydrate
 * 映射——500 行硬限——test/agent-lifecycle-singleton.test.mjs 单测锚点）。
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import * as os from "node:os"
import { builtinTools, toOpenAISchema, readImageTool } from "../tools.mjs"
import {
  taskTool, recentChangesTool, subagentTool,
  planTool, goalTool, skillTool, verifyTool, timerTool,
  advisorTool, engTool, readHistoryTool, consultStartTool, consultStopTool, // §25 R17: consult_check 退役
} from "../agent-tools.mjs"
import { settingsTool } from "../agent-tools/settings.mjs"
import { resetRunState, reconcileEngDesignTokens, applySlotSessionState } from "./agent-state.mjs"
import { setSlotEngDesignTokens } from "../extension/session-slot-write.mjs"
import { loadSlot } from "../extension/session-io.mjs"
import { specForModel } from "../specs.mjs"
import { modeRoleField } from "../agent-tools/subagent.mjs"
import { injectContext } from "../context.mjs"
import { loadRaw, normalizeProxy, resolveProviders, TRACES_DEFAULTS } from "../config-io.mjs"
import { loadEngineeringPrompt, pushReal } from "./run-helpers.mjs"
import { pushModeReminders, pushTimeReminder, pushInjections, appendImagePointer, pushEnvStateReminder, pushPeerReminder, pushGitContext, detectRestoredSession } from "./setup-reminders.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT = readFileSync(join(__dirname, "..", "prompts", "system.md"), "utf8")
const DISCIPLINE_RULES = readFileSync(join(__dirname, "..", "prompts", "discipline.md"), "utf8")
const MAIN_OVERLAY = readFileSync(join(__dirname, "..", "prompts", "main.md"), "utf8")
let _EXPLORE, _CODER, _PLAN, _ENG_CODER, _ENG_MAIN, _ENG_SUB, _CONSULT_BASE
try { _EXPLORE = readFileSync(join(__dirname, "..", "prompts", "explore.md"), "utf8") } catch { _EXPLORE = "" }
try { _CODER = readFileSync(join(__dirname, "..", "prompts", "coder.md"), "utf8") } catch { _CODER = "" }
try { _PLAN = readFileSync(join(__dirname, "..", "prompts", "plan.md"), "utf8") } catch { _PLAN = "" }
try { _ENG_CODER = readFileSync(join(__dirname, "..", "prompts", "eng-coder.md"), "utf8") } catch { _ENG_CODER = "" }
try { _ENG_MAIN = readFileSync(join(__dirname, "..", "prompts", "engineering.md"), "utf8") } catch { _ENG_MAIN = "" }
try { _CONSULT_BASE = readFileSync(join(__dirname, "..", "prompts", "consult-base.md"), "utf8") } catch { _CONSULT_BASE = "" }
try { _ENG_SUB = readFileSync(join(__dirname, "..", "prompts", "engineering-sub.md"), "utf8") } catch { _ENG_SUB = "" }

/** AUTO mode reminder lives in setup-reminders.mjs (single source of truth — its
 *  pushModeReminders pushes it; agent.mjs imports it from there for the dedupe check). */

/**
 * Decorate a consult-related tool's description with the CURRENT configured candidate
 * pool (provider:model list). Without this the model cannot know which models a consult
 * start / subagent action:'escalate' call can pick from — it would hallucinate
 * provider:model names or never pass `model`. The tool table is assembled per-run from
 * loadRaw(), so the list stays fresh. Description-only: the tool object is cloned
 * shallowly, execute untouched. §19 (2026-09-03): applied to the depth-0 subagentTool
 * too — its escalate action picks from the same pool (the standalone escalate tool was
 * merged in as action:"escalate").
 */
function withPool(tool) {
  const models = loadRaw().agent?.consultModels ?? []
  const list = models.map((m) => `${m.provider}:${m.model}${m.effort ? ` (${m.effort})` : ""}`).join(", ")
  if (!list) return tool
  return {
    ...tool,
    description: tool.description + `\nCurrently configured consultants (pool for consult_start / subagent action:'escalate'): ${list}`,
  }
}

/**
 * §18 D-E3 (AGENT-LOOP.md): the eng-coder child's restricted subagent channel —
 * built when an eng-coder child (depth>0) toolset is assembled. Schema level:
 * role enum is explore-only, the async parameter is REMOVED (sync only), and the
 * action parameter is REMOVED (spawn-only — §19 round2 #3: escalate/status are
 * refused in-child; §19.8 check 已删) — the model-facing filters; the mechanical enforcement
 * lives in subagent.mjs execute → gateEngCoderSpawn (role/async) + the §19
 * restricted-variant action gate (schema enums are advisory, providers don't
 * enforce them).
 */
function engAuditSubagentTool() {
  const props = { ...subagentTool.parameters.properties }
  delete props.async // sync only — the eng-coder blocks on the audit report
  delete props.action // spawn-only — the audit channel has no status/escalate（§19.8 check 已删）
  props.role = {
    type: "string",
    enum: ["explore"],
    description: "explore only — the eng-coder's internal spawn channel is reserved for read-only divergence audits (AGENT-LOOP.md §18 D-E3).",
  }
  return {
    ...subagentTool,
    name: "subagent",
    description:
      "Spawn a read-only `explore` sub-agent to AUDIT your delivery against the design (AGENT-LOOP.md §18 D-E2 ③): it compares the delivered code with the design for divergence — partially implemented acceptance criteria, silent simplifications, doc drift, changes outside the approved file list. BLOCKING ONLY — spawn-only (no action:'status'/'escalate', no async): the audit report decides your next protocol step. The audit task book is appended MECHANICALLY — your own spawn task (docs involved / acceptance criteria / file list) plus the files you actually touched; never hand the audit a self-written file list (a self-report could omit exactly the out-of-scope file it must catch).",
    parameters: { ...subagentTool.parameters, properties: props },
  }
}

/**
 * §11.2 agent 对象工厂——首轮-only（hydrateRun 每轮 reconcile）。归类：A = 回合级预算/守卫
 * （resetRunState 每 runAgent 清零——AC6）；C = 会话级保留（_tasks/_goal/_engDesignTokens
 * 不复位，hydrate 槽 reconcile）；_pendingReminders = A 复位 + restore 槽回填（A/C 双列注）；
 * B = run 绑定（每轮重指 _role/_provider/_planMode/cwd/history/_fullHistory/config 等）。
 * 池载体（_asyncSubagents/…）不在此——挂共享 history 数组（§11.2 D）。
 */
export function buildTopLevelAgent() {
  return {
    // C — 会话级状态（单例收益本体——hydrate 槽 reconcile / destroy 重建回填）
    _tasks: [], _goal: null,
    _engDesignTokens: null, // 惰性建 Map（spawn-gate/advisor.mjs ??= 既有）
    _pendingReminders: [], // A 复位 + restore 槽回填（resetRunState / applySlotSessionState——agent-state.mjs）
    // A — 回合级预算/守卫/计数器（resetRunState 每 runAgent 调用清零）
    _touchedFiles: [], _verifiedThisRun: false, _verifyPassed: undefined, _verifyRetries: 0,
    _honestReminderInjected: false, _pendingTimers: [],
    _lastPromptTokens: null, _usageAtLen: null, _compressFailures: 0, _emptyRetries: 0,
    _taskPushbacks: 0, _advisorRound: 0, _advisorSession: null, _lastAdvisorOutput: null,
    _calledAdvisorThisRun: false, _mutatedThisRun: false,
    _inAutoTurn: false, _sessionSignal: null, _runStartHistoryLen: 0, _lastCompressInfo: null,
    _lastEngState: false, // seeded false: a resumed engineering session re-notifies on turn 1 (CLI parity)
    // B — run 绑定（hydrateRun 每轮覆盖）
    _role: null, _provider: null, _planMode: false,
    _engPersist: null, _engDesignReviewed: false, _engTaskInput: null,
    cwd: null, history: null, _fullHistory: null,
    config: {
      advisor: { guard: false },
      agent: { engineering: false },
      proxy: undefined, shell: null, providersList: [], websearch: { provider: "tavily", apiKey: "" },
    },
  }
}

/**
 * hydrateRun —— 顶层 agent 每轮 reconcile（§11.1②）：复位（A）→ config/tools/MCP 重建
 * （AC7）→ 槽水合（11.2.1）→ systemPrompt → history 重指 → 上下文注入。复用（opts.agent
 * ——面板回合/续跑）与新建（factory + restore:true）同路径；子代理 depth>0 经 setupAgentRun
 * （opts.agent 仅 depth-0 honored——AC5）。
 * @returns {{ agent, history, fullHistory, toolByName, toolSchemas, cfgVerifyGuard, cfgCompactThreshold, systemPrompt }}
 */
export async function hydrateRun(agent, { provider, cwd, input, opts, depth, role, getAuto, restore = false }) {
  const { mcpServers, skills, engState, engDesignReviewed, resume = false, autoTurn = false } = opts

  // §11.2 A —— per-run 复位先于一切 reconcile（含 inheritedGuard 的 agent.mjs 侧应用）
  resetRunState(agent)

  const agentTools = depth === 0
    ? [taskTool, recentChangesTool, readHistoryTool, settingsTool, // SETTINGS-TOOL.md（2026-09-05）：settings list/get 只读动作（isReadonlyAction）——depth-0 主 agent 面（与 memory 同分类）
      // SESSION.md §9 D-S2: read_history is depth-0 ONLY — a subagent querying "the session" would mix its throwaway lines with the parent record (semantic confusion); readonly → planMode pass / no permission ask (T-S9)
      // §19 (2026-09-03): the subagent family is ONE resident tool — subagent_check and
      // the standalone escalate tool retired (status/escalate are action params;
      // §19.8 check 已删——四动作).
      // The escalate action errors when the pool is empty (existing error semantics);
      // with a pool configured the tool description lists the current candidates
      // (withPool — escalate picks 'provider:model' from it), same as consult_start.
      ...(loadRaw().agent?.consultModels?.length ? [withPool(subagentTool)] : [subagentTool]),
      planTool, goalTool, skillTool, verifyTool, timerTool, advisorTool, engTool,
      // consult tools registered only when configured — an unconfigured model would otherwise
      // see the tool, call it, and eat an error turn (prompt-system review 2026-08-15).
      ...(loadRaw().agent?.consultModels?.length
        ? [withPool(consultStartTool), consultStopTool] // §25 R17: consult_check 退役——结果经自动 digest 通道
        : [])]
    : role === "eng-coder"
      ? [taskTool, recentChangesTool, planTool, timerTool, advisorTool, verifyTool,
         engAuditSubagentTool()] // §18 D-E3: the audit-only restricted subagent channel (explore + sync + spawn-only — schema level; the mechanical gates are subagent.mjs gateEngCoderSpawn + the §19 restricted-variant action gate)
    // Write-permission coder sub-agents: their system prompt names verify (system.md)
    // and advisor (discipline.md) — without them the escalate/coder hit "unknown tool"
    // and fell back to bash node --check / npm test to self-verify (2026-08-16 deepseek
    // escalate diagnosis). eng-coder already had both; plain coder was the missed branch.
    : role === "coder"
      ? [taskTool, recentChangesTool, verifyTool, advisorTool]
      : [taskTool, recentChangesTool] // read-only subagents get fewer meta-tools

  // MCP tools: idempotent connect + expand into NATIVE tools (CLI parity, MCP.md D1/D2).
  // Top level only; failures never block — each warning is injected as a reminder.
  let mcpTools = []
  const mcpWarnings = []
  if (depth === 0 && Array.isArray(mcpServers) && mcpServers.length > 0) {
    try {
      const { connectMcpServersExpanded } = await import("../mcp.mjs")
      const r = await connectMcpServersExpanded(mcpServers)
      mcpTools = r.tools
      mcpWarnings.push(...r.warnings)
    } catch { /* expansion failure is non-fatal — the model just lacks MCP tools this turn */ }
  }

  // Subagent role-based tool filtering: explore/plan/consult get read-only tools only.
  // `question` is excluded from ALL subagents (depth > 0) — it's an interactive main-agent
  // tool; a background subagent (parallel consultants especially) must never prompt the user.
  const isReadOnlyRole = depth > 0 && (role === "explore" || role === "plan" || role === "consult")
  const baseTools = (isReadOnlyRole ? builtinTools.filter((t) => t.readonly) : builtinTools)
    .filter((t) => depth === 0 || t.name !== "question")
  const tools = [
    ...baseTools,
    ...(specForModel(provider.model).multimodal ? [readImageTool] : []),
    ...agentTools,
    ...mcpTools,
    ...(opts.extraTools ?? []), // caller-injected tools (e.g. consult's main_history)
  ]
  // toolSchemas is built further down, after `engineering` is computed — the subagent
  // role enum is mode-dependent (see modeRoleField).
  const toolByName = new Map(tools.map((t) => [t.name, t]))

  // Runtime config: advisor settings live in the shared config.json (CLI agent.advisor),
  // engineering state is per-session (slot authority — see applySlotSessionState).
  let advisorCfg = { guard: false }
  let cfgEngineering = false
  let cfgVerifyGuard = false
  let cfgCompactThreshold = null
  let cfgProxy = undefined
  let cfgShell = null
  let cfgSubagentModel = null
  let cfgSubagentModels = null
  let cfgSubagentTurns = 100
  let cfgMaxTurns = 200
  let cfgConsultModels = []
  let cfgConsultTurns = 40
  let cfgConsultTimeoutMs = 600_000
  let cfgPoolLimits = null // §24 D-24a（R14）：async 池角色域容量——每次入池判定时读（effectivePoolLimits 校验）
  let cfgWaitForTimeoutMs = undefined // wait_for default override (TOOLS.md §16 — CLI parity); undefined → tool default 30s
  let cfgProviders = []
  let cfgWebsearch = { provider: "tavily", apiKey: "" } // structured search; empty key → Bing fallback
  // TRACE-STORE-VSC（D-TR6 镜像——CLI config.mjs DEFAULTS.traces 合并同语义）：traces 段
  // 默认 OFF（2026-09-05 发布隐私裁定）——agent.config.traces 由此整建——每轮拾取外部变更
  let cfgTraces = { ...TRACES_DEFAULTS }
  try {
    const raw = loadRaw()
    advisorCfg = raw.agent?.advisor ?? { guard: false }
    cfgEngineering = raw.agent?.engineering ?? false
    cfgVerifyGuard = raw.agent?.verifyGuard === true // opt-in, CLI parity
    cfgCompactThreshold = raw.agent?.compactThreshold ?? null // null = auto from model context
    cfgProxy = normalizeProxy(raw.proxy) // web tools consult agent.config.proxy (resolveWebProxy)
    cfgShell = typeof raw.shell === "string" && raw.shell ? raw.shell : null // bash tool shell override (CLI parity)
    cfgSubagentModel = raw.agent?.subagentModel ?? null // default subagent model override (CLI parity)
    cfgSubagentModels = raw.agent?.subagentModels ?? {} // per-type subagent model overrides (CLI parity)
    cfgSubagentTurns = raw.agent?.subagentTurns ?? 100 // subagent turn cap (CLI parity)
    cfgMaxTurns = raw.agent?.maxTurns ?? 200
    cfgConsultModels = raw.agent?.consultModels ?? [] // consultation model list (CONSULTATION.md)
    cfgConsultTurns = raw.agent?.consultTurns ?? 40 // consultation turn budget (panel-exposed)
    cfgConsultTimeoutMs = raw.agent?.consultTimeoutMs ?? 600_000 // consultation wall-clock watchdog (panel-exposed)
    cfgPoolLimits = raw.agent?.poolLimits ?? null // §24 D-24a: async pool per-domain limits（校验在 scheduler 读点）
    cfgWaitForTimeoutMs = raw.agent?.waitForTimeoutMs ?? undefined // wait_for timeout override — tool applies its own default/cap when absent
    cfgProviders = resolveProviders().providers // for subagent model overrides
    cfgWebsearch = raw.websearch ?? { provider: "tavily", apiKey: "" }
    cfgTraces = { ...TRACES_DEFAULTS, ...(raw.traces ?? {}) }
  } catch { /* config unreadable — defaults */ }

  // §11.2.1 槽 reconcile：顶层会话绑定（opts.engPersist = {cwd, slot}）每轮读权威槽（settle
  // 落盘在 run 外——hydrate 是唯一 reconcile 点——digest/续跑可见刚落盘的 token）；子代理无
  // 槽绑定 → 回退 opts.engState（父模式镜像）→ cfg。restore（agent 刚由 factory 新建——
  // 首轮/destroy 重建）→ tasks/goal/pendingReminders 从槽回填（11.2.1 映射表）。
  const bind = opts.engPersist
  const sessionData = (depth === 0 && bind?.cwd && bind?.slot)
    ? (() => { try { return loadSlot(bind.cwd, bind.slot) } catch { return null } })()
    : null
  const cfgBag = {
    engineering: cfgEngineering,
    advisor: advisorCfg,
    agentFields: {
      subagentModel: cfgSubagentModel, subagentModels: cfgSubagentModels, subagentTurns: cfgSubagentTurns,
      maxTurns: cfgMaxTurns, verifyGuard: cfgVerifyGuard, compactThreshold: cfgCompactThreshold,
      consultModels: cfgConsultModels, consultTurns: cfgConsultTurns, consultTimeoutMs: cfgConsultTimeoutMs,
      waitForTimeoutMs: cfgWaitForTimeoutMs, poolLimits: cfgPoolLimits,
    },
    proxy: cfgProxy, shell: cfgShell, providersList: cfgProviders, websearch: cfgWebsearch,
    traces: cfgTraces,
  }
  const { engineering, droppedExpired } = applySlotSessionState(agent, {
    slot: sessionData,
    engState,
    planModeOverride: opts.planMode,
  }, { cfg: cfgBag, restore })
  // D2 触发③：restore/水合发现槽内过期项 → 回写权威台账清 expired（幂等；map 可能已含内存项）
  if (droppedExpired && bind?.cwd && bind?.slot) {
    try {
      setSlotEngDesignTokens(bind.cwd, bind.slot, agent._engDesignTokens instanceof Map && agent._engDesignTokens.size > 0 ? Object.fromEntries(agent._engDesignTokens) : null)
    } catch { /* 槽清理非致命——expired 从不授权 */ }
  }

  // Tool schemas are built AFTER `engineering` is known: the subagent role enum is
  // mode-dependent (CLI setup.mjs parity) — normal mode must not advertise 'eng-coder'
  // as a legal role. Schema filtering is the first line of defense; the runtime
  // mutual-exclusion throws in subagentTool.execute stay as the hard gate.
  const toolSchemas = tools.map((t) => {
    if (depth === 0 && t.name === "subagent") {
      const { role: roleField, suffix } = modeRoleField(engineering)
      const schema = toOpenAISchema(t)
      schema.function.description = t.description + (suffix ? "\n" + suffix : "")
      schema.function.parameters = {
        ...t.parameters,
        properties: { ...t.parameters.properties, role: roleField },
      }
      return schema
    }
    return toOpenAISchema(t)
  })

  // B 类 run 绑定（每轮重指——复用 agent 不残留上轮引用）+ opts 派生字段
  agent._role = role
  agent._depth = depth // TRACE-STORE-VSC（D-TR4）：compress/distill 等内嵌 chat 调用点的 depth 归属
  agent._provider = provider
  agent._engTaskInput = opts.engTaskInput ?? null
  agent._engDesignReviewed = engDesignReviewed === true // eng-coder children arrive pre-authorized
  if (opts.engPersist) agent._engPersist = opts.engPersist
  else if (depth === 0 && agent._engPersist) agent._engPersist = null // 直连/非面板顶层 run —— 不残留旧槽绑定
  const platform = { win32: "Windows", darwin: "macOS", linux: "Linux" }[os.platform()] ?? os.platform()

  // Live state channel for the parent (eng-coder mutation merge) — the caller gets a
  // reference to the same array, so it stays current as the child touches files.
  // §19.5.6 D-SF1 (AGENT-LOOP.md): the agent OBJECT reference (not the array) — the
  // pool entry's status summary re-reads childAgent._touchedFiles live; a bare array
  // reference goes stale when a resume re-runs setup (new per-run agent). Each
  // runAgent re-assigns it, so entry.childAgent always points at the CURRENT run.
  if (opts.stateSink) {
    opts.stateSink.touchedFiles = agent._touchedFiles
    opts.stateSink.agent = agent
  }
  // System prompt — engineering mode replaces the standard discipline block with
  // engineering.md (or engineering-sub.md for eng-coder) + project METHODOLOGY.md (CLI parity).
  const engPromptActive = engineering && (depth === 0 || role === "eng-coder")
  const engResult = engPromptActive ? loadEngineeringPrompt(cwd, role) : null
  // consult children: a lean, purpose-built base prompt (consult-base.md) — NOT the full
  // main-agent system.md (whose coding-agent persona, checklist/task/verify workflows, and
  // tool references conflict with a read-only diagnosis and cost tokens every turn).
  let base = role === "consult"
    ? _CONSULT_BASE
    : engPromptActive
      ? (engResult.prompt ? `${SYSTEM_PROMPT}\n\n${engResult.prompt}` : SYSTEM_PROMPT)
      : `${SYSTEM_PROMPT}\n\n${DISCIPLINE_RULES}`
  if (depth > 0 && role) {
    const overlay = { explore: _EXPLORE, coder: _CODER, plan: _PLAN, "eng-coder": _ENG_CODER }[role] || ""
    base = overlay ? `${overlay}\n\n${base}` : base
  }
  // Time injection deliberately does NOT live here: system prompts must be byte-identical
  // across runs (provider prefix caches). The time rides a transient user reminder pushed
  // at each turn start (below) — variable content belongs in the history, not the cached prefix.
  const systemPrompt = `${base}${depth === 0 && !engPromptActive ? `\n\n${MAIN_OVERLAY}` : ""}\n\nOS: ${platform}. Working directory: ${cwd}.`

  // Dual-line history. Top-level runs use PERSISTENT lines passed in via opts (survive across calls,
  // written to the session file by chat-panel): history = machine context (compaction shrinks it),
  // fullHistory = never-compacted human-readable record. Subagents always use throwaway local lines.
  // Old sessions / first turn: seed the machine line from the human line (correctness over tokens).
  const fullHistory = depth === 0 ? (opts.fullHistory ?? (opts.fullHistory = [])) : []
  const history = depth === 0
    ? (opts.history ?? (opts.history = [...fullHistory]))
    // Subagents default to throwaway local history, but a caller that wants to
    // CONTINUE a turn-cap-limited child (escalate resume) passes the previous run's
    // history back in — the conversation survives across runAgent calls.
    : (opts.history ?? [])

  // The advisor helpers (ported from the CLI) reach for agent.cwd and agent.history —
  // keep those aliases live so the ported modules work unchanged.
  agent.cwd = cwd
  agent.history = history
  // TRACE-STORE-VSC（D-TR4 镜像——CLI agent/setup.mjs `_sessionStart ??=` 同语义）：顶层
  // 会话身份 = 槽 sessionStart（跨端同身份——F2 打点同源）优先，无槽/未保存则首建打点；
  // 复用 agent 不重打（??=——同会话跨回合恒等）；子代理（depth>0）不设——轨迹 session
  // 字段 null（CLI parity——children 无 _sessionStart——回靠 role+depth 归属）。
  if (depth === 0 && agent._sessionStart == null) {
    agent._sessionStart = sessionData?.sessionStart ?? new Date().toISOString()
  }
  // read_history (SESSION.md §9 D-S2): the tool reads the HUMAN line via agent._fullHistory —
  // attach at depth 0 only (subagent throwaway lines are never reachable, the tool is not
  // registered for them anyway).
  if (depth === 0) agent._fullHistory = fullHistory
  // SESSION.md §11.2（2026-09-08——F2 评审 #7 修复版）：resumed 按会话跟踪——agent 级
  // _resumedPending 只在 agent 新建（restore:true factory 路径——首轮/destroy 换槽重建
  // 同路径）且 fullHistory 载入非空时武装——每次槽恢复进新 agent 天然得一次 resumed:yes；
  // 同绑定复用（restore=false）不武装（下方注入点消费即清——复用路径恒 no）。
  if (restore && fullHistory.length > 0) agent._resumedPending = true
  // process restarted 句（N6——评审 🔴 修复）：进程级信号——模块级 restartDetectionDone
  // 一次性闸（现语义保留不迁：extension host 重启后模块级重置；进程内切槽不重置——真
  // 重启语义）。判据 = 载入（进场）历史非空（N5）——检测必须在用户输入落线（下方
  // pushReal）之前求值：否则全新会话首回合输入使 fullHistory 变非空而伪触发（F3 同族
  // 修正——本仓注释"进场即非空"即此语义）。发句位在输入前——CLI prepareRun 同序。
  // 跨端异名互指（结构债批 5 N7——双端同语义各自独立实现、命名不统一是刻意——thincoder
  // SESSION.md §11.2）：CLI 端同机制载体异名 = agent._envResumed（session.mjs
  // applySession——载入历史非空即武装——每次恢复一次）+ agent._processRestartPending
  // （bin/thincoder.mjs 启动 resume 路径设——prepareRun 发句清——进程级句）。
  const processRestarted = detectRestoredSession({ depth, resume, autoTurn, fullHistory })
  if (processRestarted) {
    history.push({ role: "user", content: `[System reminder: process restarted at ${new Date().toISOString()}.]`, transient: true })
  }

  // Live history reference for the parent: same array the loop appends to — a caller
  // that catches ContinueError can hand it back via opts.history to resume the child
  // conversation (escalate turn-cap continue).
  if (opts.stateSink) opts.stateSink.history = history

  // ─── Context injection (top-level only, fresh machine line only) ────
  // These machine-only injections are transient context; a persistent machine line already carries
  // them from prior turns, so only inject when starting a brand-new (empty) machine line.
  const freshMachineLine = history.length === 0
  pushModeReminders(history, { depth, freshMachineLine, getAuto, role, engPromptActive, engResult })

  // Git context (SESSION.md §11.1 T-E6——CLI setup.mjs 富注入同款补齐：branch/
  // commits/uncommitted，非 clean|dirty 摘要）：顶层用户回合每回合注入当前状态。
  if (depth === 0 && !resume && !autoTurn) pushGitContext(history, cwd)

  // resume (interrupt continuation): the input is already in history — pushing it
  // again would duplicate the user message (CLI setup.mjs resume parity).
  // §17 D-S6 autoTurn (digest): system-driven turn with NO user input — same
  // no-push semantic, but as a fresh run (per-run state resets like a normal turn;
  // resume additionally preserves guard state for ContinueError continuations).
  // The pushed object is captured BY REFERENCE: the paste-image pointer below
  // appends to THIS message (never history.at(-1) — the transient time reminder
  // pushed afterwards is last, and mutating it re-sent the image pointer every run).
  let userMsg = null
  if (!resume && !autoTurn) {
    userMsg = { role: "user", content: input }
    pushReal(history, fullHistory, userMsg)
  }

  // SESSION.md §11.1/§11.2：统一 env-state reminder（每回合、depth-0）——注入句解耦
  // （N6——评审 🔴 修复、双信号独立消费）：resumed:yes = agent 级 _resumedPending（上方
  // restore 路径武装——读即清，每次会话恢复一次；切槽恢复只发 resumed:yes、不误报进程
  // 重启）。process restarted 句已在输入前按进场历史求值（上方 detectRestoredSession）。
  if (depth === 0) {
    const resumed = agent._resumedPending === true
    agent._resumedPending = false
    pushEnvStateReminder(history, { engineering, provider, slot: bind?.slot ?? null, resumed })
  }

  // R10 L1（MULTI-INSTANCE-COLLAB.md D-L1a——决策④ 每回合）：同伴实例提醒——env-state
  // 之后、time reminder 之前（transient；有同伴才注入——peerInstances 惰性 mtime 缓存）。
  if (depth === 0) pushPeerReminder(history, cwd)

  pushTimeReminder(history)

  pushInjections(history, opts.injections)

  // Pasted images (GitHub thincoder#3, Plan B): pointer appended to the REAL user
  // message by reference — see setup-reminders.mjs for the full contract.
  appendImagePointer(userMsg, opts.images, provider.model, { depth })

  return { agent, history, fullHistory, toolByName, toolSchemas, cfgVerifyGuard, cfgCompactThreshold, systemPrompt }
}

/** setupAgentRun —— 既有装配入口（子代理/首轮/直连）：factory 新建 → hydrateRun（restore:true
 *  ——首轮与 destroy 后重建同路径，槽回填）。顶层复用走 agent.mjs 的 hydrateRun(existing, …)。 */
export function setupAgentRun(ctx) {
  return hydrateRun(buildTopLevelAgent(), { ...ctx, restore: true })
}
