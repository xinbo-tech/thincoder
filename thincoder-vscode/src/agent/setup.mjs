/**
 * agent/setup.mjs — runAgent 前置 **host 装配**（2026-09-29 parity-b1 · 批档 §2.3 件 1 逐段对位表）。
 *
 * 本档保留 = 端壳装配面：agent 对象 · config 读 ∕ 槽 reconcile（`agent-state.mjs` 纯函数层）·
 * 工具表**基础集**（`agent.tools` = baseSet；家族段核追加）· run 绑定与前向镜像 · 双线历史 ·
 * manifest 附着 ∕ 会话身份 ∕ `_fullHistory` · 端 adapter 面（A3 域文本 ∕ R5 重启闸 ∕
 * 贴图指引 ∕ 记忆句柄）。归核（同批 —— 核 `runAgent` → `prepareRun`）= 上下文注入组 ∕ 提示词装配 ∕
 * skills 清单 ∕ 输入推入 ∕ env ∕ peer ∕ time ∕ editor 注入 ∕ 主循环本体。
 * 核增补消费键（§2.5 A ∕ B + 裁定①）由调用方把本档写回的 `opts`（或摘取键）传核 `runAgent`：
 * `opts.injections` ∕ `opts.turnDomainText` ∕ `opts.distillSignal` ∕ `opts.toolDecorate`
 * （B7 3b：规则尾块键已退役——尾块由核 `prepareRun` 自持）。
 */
import { builtinTools } from "../tools.mjs"
import { settingsTool as coreSettingsTool } from "@thincoder/core/agent-tools/settings.mjs"
import { resetRunState, applySlotSessionState } from "./agent-state.mjs"
import { wireAgentToolSeams, buildToolTable } from "./setup-tooltable.mjs" // 缝（KD-6）：迁出面同档再导出
import { loadSlot } from "../extension/session-io.mjs"
import { expandHome } from "@thincoder/core/expand-home.mjs"
import { resolveEngineeringManifest, projectView } from "@thincoder/core/manifest.mjs"
import { loadRaw, resolveProviders } from "@thincoder/core/config-io.mjs"
import { DEFAULTS, normalizeProxy, sanitizeSubagentModel, sanitizeSubagentModels } from "@thincoder/core/config.mjs"
import { loadConsultPool } from "../extension/presets.mjs"
import { setSlotEngDesignTokens, setSlotPlanMode } from "../extension/session-slot-write.mjs"
import { appendImagePointer, detectRestoredSession, applyMcpWarnings } from "./setup-reminders.mjs"
import { memoryFor } from "../embed-config.mjs" // §2.6 表注处置（裁定①）：记忆 ∕ 索引句柄（W8 经动态 import——静态闭包零 sqlite）
import { mergeFileRules } from "@thincoder/core/rules.mjs" // B7 3a：规则面全档核单源（端壳判据档退役）
import { composeTurnDomain } from "./turn-domains.mjs" // §2.5-A3：回合域文本组合单点（端 overlay）
export { vscSubagentFace } from "./setup-tooltable.mjs" // 既有导出名零改（批 7 VSC-DEBT §3.3 缝）

// W16：settings 工具 = 核工厂单源（`settingsTool(opts)`）；#45 参数腿（WEBVIEW-PROTOCOL.md §3.3 判据②）：
// 端侧**包装实例**——`execute` **返回后**置位 `ctx.agent._settingsTouched`（不做「成功」判定；读后复位）。
export function vscSettingsFace(tool) {
  return {
    ...tool,
    async execute(args, ctx) {
      const out = await tool.execute(args, ctx)
      if (ctx?.agent) ctx.agent._settingsTouched = true
      return out
    },
  }
}
const settingsTool = vscSettingsFace(coreSettingsTool())

/**
 * agent 对象工厂——首轮-only（hydrateRun 每轮 reconcile）。归类：A = 回合级预算/守卫
 * （resetRunState 每 runAgent 清零——AC6）；C = 会话级保留（_tasks/_goal/_engDesignTokens 不复位）；
 * B = run 绑定（每轮重指）；池载体（_asyncSubagents/…）不在此——挂共享 history 数组。
 */
export function buildTopLevelAgent() {
  return {
    // C — 会话级状态（单例收益本体——hydrate 槽 reconcile / destroy 重建回填）
    _tasks: [], _goal: null,
    _engDesignTokens: null, // 惰性建 Map（spawn-gate/advisor.mjs ??= 既有）
    _pendingReminders: [], // A 复位 + restore 槽回填（resetRunState / applySlotSessionState——agent-state.mjs）
    // A — 回合级预算/守卫/计数器（resetRunState 每 runAgent 调用清零）
    _touchedFiles: [], _verifiedThisRun: false, _verifyPassed: undefined, _verifyRetries: 0,
    _honestReminderInjected: false, _pendingTimers: [], // _pendingTimers 例外：跨 run 存活（D-TW3——不再随 resetRunState 清）
    _lastPromptTokens: null, _usageAtLen: null, _compressFailures: 0, _emptyRetries: 0,
    _taskPushbacks: 0, _advisorRound: 0, _advisorSession: null, _lastAdvisorOutput: null,
    _calledAdvisorThisRun: false, _mutatedThisRun: false,
    _inAutoTurn: false, _sessionSignal: null, _runStartHistoryLen: 0, _lastCompressInfo: null,
    _lastEngState: false, // seeded false: a resumed engineering session re-notifies on turn 1 (CLI parity)
    // B — run 绑定（hydrateRun 每轮覆盖）
    _role: null, _provider: null, _planMode: false,
    _engPersist: null, _engDesignReviewed: false, _engTaskInput: null, _batchDoc: null,
    cwd: null, history: null, _fullHistory: null,
    config: {
      advisor: { guard: false },
      agent: { engineering: false },
      proxy: undefined, shell: null, providersList: [], websearch: { apiKey: "" },
    },
  }
}

let warnedSubagentModelCfg = false // #861：raw 读点清洗警告——进程级一次性（hydrateRun 每轮重读；同 presets.mjs 先例）
function warnSubagentModelCfgDropped(dropped) {
  if (warnedSubagentModelCfg || dropped.length === 0) return
  warnedSubagentModelCfg = true
  console.warn(`[config] agent.subagentModel/subagentModels: ${dropped.length} invalid entr${dropped.length === 1 ? "y ignored" : "ies ignored"} (filtered — no crash):\n  - ${dropped.join("\n  - ")}`)
}

/**
 * hydrateRun —— host 装配（顶层复用与新建（`setupAgentRun`）同路径）：复位（A）→ W14 三缝接线 →
 * config 读（AC7）→ 槽水合（槽↔hydrate 映射表）→ 工具表基础集 → run 绑定 + 前向镜像 →
 * 双线历史重指 → manifest 附着 ∕ 会话身份 → 端 adapter 键写回（A2 ∕ A3 ∕ R5 闸）→ MCP 失败提醒（#823）。
 * 回合级装配（注入组 ∕ 提示词 ∕ 输入推入 ∕ env ∕ peer ∕ time）归核 `prepareRun`（§2.3 件 1）。
 * @returns {{ agent, history, fullHistory, input }}（`agent.tools` = baseSet；核 `runAgent` 追加
 *  家族段；`input` = 贴图指引施用后的最终用户输入串——调用方传核 `runAgent`）
 */
export async function hydrateRun(agent, { provider, cwd, input, opts, depth, role, getAuto, restore = false }) {
  const { mcpServers, engState, engDesignReviewed, resume = false, autoTurn = false, batchDoc = null } = opts

  // per-run 复位先于一切 reconcile（含核 runAgent 侧 inheritedGuard 应用）
  resetRunState(agent)

  // W14（2026-09-15）：agent-tools 三缝（skill loader / eng mirror / verify 诊断段）接线——
  // 幂等一次；先于工具装配（skill / eng / verify 工具本轮即可用上端侧形态）。
  await wireAgentToolSeams()

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
  let cfgPoolLimits = null // §5 D-24a（R14）：async 池角色域容量——每次入池判定时读（effectivePoolLimits 校验）
  let cfgWaitForTimeoutMs = undefined // wait_for default override (TOOLS.md §6.7 — CLI parity); undefined → tool default 30s
  let cfgGoalTurns = null // 表注：核 `post-turn.mjs` 读 `agent.config.agent.goalTurns ?? 200`（缺省 null ⇒ 核默认）
  let cfgProviders = []
  let cfgWebsearch = { apiKey: "" } // structured search; empty key → Bing fallback
  let cfgHooks = null // P2 批 §2.16：hooks 段随 config 读入（`runHooks` 消费面）
  // TRACE-STORE-VSC（D-TR6 镜像——核 config.mjs DEFAULTS.traces 合并同语义）：traces 段
  // 默认 OFF（2026-09-05 发布隐私裁定）——agent.config.traces 由此整建——每轮拾取外部变更
  let cfgTraces = { ...DEFAULTS.traces }
  // #175（W15 · a 半）：autoThink 键随 config 归一（默认 false——核 DEFAULTS）；timer-wake 阶段 2：
  // `agent.timerWake` 键随 config 归一（默认 true；消费 = 核 `timers.mjs` `timerWakeEnabled` 活读——VSC 端经 `extension/timer-watch.mjs` 闩装配，B3 收编）——
  // 两者皆「显式键优先、缺省 = 核 DEFAULTS」。
  let cfgAutoThink = DEFAULTS.agent?.autoThink === true
  let cfgTimerWake = DEFAULTS.agent?.timerWake !== false
  let cfgStreamRules = [] // #130 A-1/A-2：stream 规则（`.thincoder/rules` 文件规则并入 config 规则）
  try {
    const raw = loadRaw()
    advisorCfg = raw.agent?.advisor ?? { guard: false }
    cfgEngineering = raw.agent?.engineering ?? false
    cfgVerifyGuard = raw.agent?.verifyGuard === true // opt-in, CLI parity
    cfgCompactThreshold = raw.agent?.compactThreshold ?? null // null = auto from model context
    cfgProxy = normalizeProxy(raw.proxy) // web tools consult agent.config.proxy (resolveWebProxy)
    cfgShell = typeof raw.shell === "string" && raw.shell ? expandHome(raw.shell) : null // bash tool shell override (CLI parity)——群 A 批 A2：`~` 单点归一（只读——不写回）
    const smCfg = sanitizeSubagentModel(raw.agent?.subagentModel), smsCfg = sanitizeSubagentModels(raw.agent?.subagentModels) // #861（§6.7.1）：核内单源清洗（与 CLI loadConfig 同判）
    cfgSubagentModel = smCfg.value
    cfgSubagentModels = smsCfg.value
    warnSubagentModelCfgDropped([...smCfg.dropped, ...smsCfg.dropped])
    cfgSubagentTurns = raw.agent?.subagentTurns ?? 100 // subagent turn cap (CLI parity)
    cfgMaxTurns = raw.agent?.maxTurns ?? 200
    cfgConsultModels = loadConsultPool() // consultation model list (CONSULTATION.md——F-4 清洗后合法池)
    cfgConsultTurns = raw.agent?.consultTurns ?? 40 // consultation turn budget (panel-exposed)
    cfgConsultTimeoutMs = raw.agent?.consultTimeoutMs ?? 600_000 // consultation wall-clock watchdog (panel-exposed)
    cfgPoolLimits = raw.agent?.poolLimits ?? null // §5 D-24a: async pool per-domain limits（校验在 scheduler 读点）
    cfgWaitForTimeoutMs = raw.agent?.waitForTimeoutMs ?? undefined // wait_for timeout override — tool applies its own default/cap when absent
    cfgGoalTurns = raw.agent?.goalTurns ?? null // 表注：goal 轮预算（核缺省 200——null ⇒ 核默认）
    cfgProviders = resolveProviders().providers // for subagent model overrides
    cfgWebsearch = raw.websearch ?? { apiKey: "" }
    cfgHooks = raw.hooks ?? null
    cfgTraces = { ...DEFAULTS.traces, ...(raw.traces ?? {}) }
    cfgAutoThink = raw.agent?.autoThink ?? cfgAutoThink // #175a：显式键优先（缺省 = 核 DEFAULTS）
    cfgTimerWake = raw.agent?.timerWake ?? cfgTimerWake // 显式键优先（缺省 = 核 DEFAULTS——默认开；判据 `!== false`）
    cfgStreamRules = mergeFileRules(raw.agent?.streamRules ?? [], cwd) // #130 A-1：与 CLI make-agent.mjs:44-48 同语义
  } catch { /* config unreadable — defaults */ }

  // 槽 reconcile：顶层会话绑定（opts.engPersist）每轮读权威槽（hydrate = 唯一 reconcile 点）；
  // 子代理无槽绑定 → 回退 opts.engState → cfg。restore（factory 新建）→ tasks/goal/pendingReminders 回填。
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
      waitForTimeoutMs: cfgWaitForTimeoutMs, poolLimits: cfgPoolLimits, autoThink: cfgAutoThink, timerWake: cfgTimerWake,
      goalTurns: cfgGoalTurns,
      streamRules: cfgStreamRules, // #130 A-2：经 agentFields → agent.config.agent.streamRules（消费 = 核 chat）
    },
    proxy: cfgProxy, shell: cfgShell, providersList: cfgProviders, websearch: cfgWebsearch,
    hooks: cfgHooks,
    traces: cfgTraces,
  }
  const { engineering, droppedExpired } = applySlotSessionState(agent, {
    slot: sessionData,
    engState,
    planModeOverride: opts.planMode,
  }, { cfg: cfgBag, restore })
  // #45（WEBVIEW-PROTOCOL.md §3.3 判据①）：`_engShown` = 已展示基线（槽应用之后取值）；
  // 工具驱动翻转的比对起点（写入面 = agent-state 同步 cell）。
  agent._engShown = agent.config?.agent?.engineering === true
  // D2 触发③：restore/水合发现槽内过期项 → 回写权威台账清 expired（幂等；map 可能已含内存项）
  if (droppedExpired && bind?.cwd && bind?.slot) {
    try {
      setSlotEngDesignTokens(bind.cwd, bind.slot, agent._engDesignTokens instanceof Map && agent._engDesignTokens.size > 0 ? Object.fromEntries(agent._engDesignTokens) : null)
    } catch { /* 槽清理非致命——expired 从不授权 */ }
  }

  // FR31 ③ / AC14 槽值收正（先例 = 上方 droppedExpired 回写）：槽内 `planMode:true` 为过期项 ⇒ 回写清掉。
  if (engineering && sessionData?.planMode === true && bind?.cwd && bind?.slot) {
    try { setSlotPlanMode(bind.cwd, bind.slot, false) } catch { /* 槽写失败非致命——生效值已是 false */ }
  }

  // ── 工具表基础集（§2.3 件 1「工具表」行）：`agent.tools` = baseSet——家族段由核 `prepareRun`
  // 追加（`assembleFamilyTools` 单源）；端装饰体经 `opts.toolDecorate` 写回（裁定①）。
  const { baseSet, mcpWarnings } = await buildToolTable({
    depth, role, engineering, provider, mcpServers, builtinTools, opts, batchDoc, settingsTool,
  })

  // B 类 run 绑定（每轮重指——复用 agent 不残留上轮引用）+ opts 派生字段
  agent._role = role
  // autoApprove 字段接线（2026-09-16 缺陷修复——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md`
  // §2 A′）：核读点 = **父对象字段** `parent.autoApprove`（spawn 门 `subagent.mjs:271` ∕ escalate 门
  // `:194` ∕ 子代权限继承 `subagent-spawn.mjs:304` · 读点族 `subagent-async.mjs:291` 等）；
  // 形态 = **访问器**（每轮重定义——取值恒 live；无 setter ⇒ 面板 flag 为唯一来源，fail-loud）。
  const autoProbe = typeof getAuto === "function" ? getAuto : () => false // 归一（同核 `agent.mjs:69`）
  Object.defineProperty(agent, "autoApprove", { configurable: true, enumerable: true, get: () => autoProbe() === true })
  agent._depth = depth // TRACE-STORE-VSC（D-TR4）：compress/distill 等内嵌 chat 调用点的 depth 归属
  agent._provider = provider
  // 核 spawn 父对象读点（parent.tools——角色过滤/直传 + 子代装配展开）：每轮重指**基础集**
  // （`baseSet`——不含端侧 meta 工具族 `agentTools`；家族段由核 `assembleFamilyTools` 追加
  // ——不相交式 = 追加家族 ∥ 绑定值；VSC-TOOL-TABLE-DUP §2.1A），不拷贝。
  agent.tools = baseSet
  agent._engTaskInput = opts.engTaskInput ?? null
  // VSC 端镜像批（2026-09-11 · 第 5 批）：spawn 侧批次档绑定上车（batch 工具的唯一路径来源，现行权威 = BATCH-RECORD.md §4.2；无 path 参数——
  // 目标档由 spawn 绑定 / 评审实例键提供）。顶层/非工程角色恒 null（不挂载工具）。
  agent._batchDoc = batchDoc
  agent._engDesignReviewed = engDesignReviewed === true // eng-coder children arrive pre-authorized
  if (opts.engPersist) agent._engPersist = opts.engPersist
  else if (depth === 0 && agent._engPersist) agent._engPersist = null // 直连/非面板顶层 run —— 不残留旧槽绑定
  // W9 端差适配——**前向镜像**（§2.3 件 1「面板推送腿」行：前向镜像落 host 装配段，每 run 一次；
  // 回填 ∕ 比对块随主循环退役迁往 `callbacks.onTurnEnd`——核 `post-turn.mjs` 每工具执行轮末恰一次）：
  // 核工具族读 CLI 载体名（agent.provider / agent.tasks / agent.planMode / agent.goal）——本端载体 =
  // 语义同值的入参 / _tasks / _planMode / _goal；task 腿走核 `_onTaskUpdate` 缝（核 `prepareRun` 装配）。
  agent.provider = provider
  agent.tasks = agent._tasks ?? []
  agent.planMode = agent._planMode === true
  if (agent._goal) agent.goal = agent._goal

  // Live state channel（D-SF1 状态汇）：agent **对象**引用（非数组）——池条目状态摘要 live 重读。
  if (opts.stateSink) {
    opts.stateSink.touchedFiles = agent._touchedFiles
    opts.stateSink.agent = agent
  }

  // 双线历史（SESSION.md §6.9）：顶层 = 持久双线（opts 传入）；子代理 = 丢即弃本地线（escalate 续跑回传）；老会话/首轮：机读线由人读线播种。
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
  // M1-manifest（MANIFEST.md §2.2 两端装配钩子——VSC 端）：模式门 = `agent.config.agent.engineering`
  // （已由 `applySlotSessionState` 槽优先订正）：普通会话 ⇒ 零 manifest I/O + `agent.manifest = null`；
  // 工程模式 ⇒ 核单源 `resolveEngineeringManifest` 决策树（KD-M1-20），**非 fatal**（KD-M1-25/29——
  // 启动零拒绝）：歧义 ∕ 档非法 ∕ 建档失败 ⇒ 不抛——`manifest = null` + 记 `agent._projectView`；
  // `depth > 0` ⇒ `init:false`（写门缺省拒已机械兜底）。
  if (agent.config?.agent?.engineering !== true) {
    agent.manifest = null
  } else {
    const r = resolveEngineeringManifest(cwd, { writer: "main", init: depth === 0 })
    agent._projectView = { ...projectView(cwd), created: r.ok && r.created === true }
    agent.manifest = r.ok ? r.manifest : null
  }
  // TRACE-STORE-VSC（D-TR4 镜像）：顶层会话身份 = 槽 sessionStart 优先，无槽首建打点（`??=`——
  // 复用 agent 不重打）；子代理不设（轨迹 session null——CLI parity）。
  if (depth === 0 && agent._sessionStart == null) {
    agent._sessionStart = sessionData?.sessionStart ?? new Date().toISOString()
  }
  // read_history（SESSION.md §6.9）：人读线经 `agent._fullHistory` 读——仅 depth 0 挂（子代理丢即弃）。
  if (depth === 0) agent._fullHistory = fullHistory

  // §2.6 表注处置（裁定①）：记忆 ∕ 索引句柄随 host 装配补齐——核注入组读点 = `agent.memory`
  // （依赖大纲 ∕ 文档召回 ∕ 记忆召回三块——核 `agent/setup.mjs:91/:103`）；端句柄 = `memoryFor(cwd)`
  // （形兼容 `createMemory({dbPath})` + `.db`；停用 ∕ 未建 ⇒ null ⇒ 核静默跳过 = 旧端同形，同 I/O）。
  if (depth === 0) {
    try { agent.memory = await memoryFor(cwd) } catch { agent.memory = null /* 记忆面不可用 ⇒ 三块静默跳过（核同形） */ }
  }

  // ── 端 adapter 键（写回调用方 opts——先例 = opts.agent ∕ opts.history 写回）──────────────
  // SESSION.md §6.11：resumed 载体 = 核字段 `agent._envResumed`（同条件——restore + 载入历史非空；
  // 读即清 = 核 `pushEnvStateReminder`）；槽绑定 = 核字段 `agent._slot`（env 行 slot ∕ `read_history` 解析读点）。
  if (restore && fullHistory.length > 0) agent._envResumed = true
  agent._slot = bind?.slot ?? null
  // R5 重启闸（端独有——extension-host 重载语义）：判真 ⇒ 置核消费位 `agent._processRestartPending`
  // ——核 `prepareRun`（!resume 段）发句（句文本与序位 git → OS → restarted → outline 随核零变）。
  if (detectRestoredSession({ depth, resume, autoTurn, fullHistory })) agent._processRestartPending = true
  // §2.5-A3：回合域文本 = 核基座 + 端 overlay（组合单点 = `./turn-domains.mjs`）——核推送点消费。
  opts.turnDomainText = composeTurnDomain(opts.upstreamTurn === true, agent.config?.agent?.engineering === true, opts.timerTurn === true)
  // 贴图指引（§2.3 件 1「贴图指针」行——adapter：核 `runAgent` 调用前对 input 串施用；非多模态 + 带图 ⇒ 抛错）。
  if (!resume && !autoTurn && Array.isArray(opts.images) && opts.images.length > 0) {
    const userMsg = { role: "user", content: input }
    appendImagePointer(userMsg, opts.images, provider.model, { depth })
    input = userMsg.content
  }

  // #823 装配尾（晚于 resetRunState 清队 ∥ 槽回填）：MCP 失败提醒入队——指纹去重、零警告零写。
  applyMcpWarnings(agent, mcpWarnings)

  return { agent, history, fullHistory, input }
}

/** setupAgentRun —— 既有装配入口（子代理/首轮/直连）：factory 新建 → hydrateRun（restore:true
 *  ——首轮与 destroy 后重建同路径，槽回填）。顶层复用走 hydrateRun(existing, …)。 */
export function setupAgentRun(ctx) {
  return hydrateRun(buildTopLevelAgent(), { ...ctx, restore: true })
}
