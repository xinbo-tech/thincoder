/**
 * agent/setup.mjs — pre-loop setup for runAgent: tool table, config, system prompt,
 * dual-line history, and startup context injection.
 * Extracted from agent.mjs (file-size split).
 * 2026-09-16（批 7 VSC-DEBT §3.3 档一）：工具表装配装饰面迁出 `setup-tooltable.mjs`（batch_segment
 * 记账缝 / W14 三缝接线 / 池装配装饰与子代理面）；本档 re-export 既有导出名（KD-6 缝）；
 * 动态载核登记册面（KD-5）仍在本档。
 * agent 生命周期对齐 CLI（2026-09-08）：setupAgentRun 拆出
 * buildTopLevelAgent（agent 对象工厂——首轮/destroy 重建-only）+ hydrateRun（每轮
 * reconcile——顶层单例复用路径）。纯函数层 resetRunState / reconcileEngDesignTokens /
 * applySlotSessionState 已拆 agent-state.mjs（复位清单与槽↔hydrate
 * 映射——500 行硬限——test/agent-lifecycle-singleton.test.mjs 单测锚点）。
 */
import * as os from "node:os"
import { builtinTools, toOpenAISchema, readImageTool } from "../tools.mjs"
// W9（2026-09-15）：工具集 re-export 面退役——14 名装配面**动态载入核登记册**
// `@thincoder/core/agent-tools.mjs`（登记册单一来源 #83；载入点 = hydrateRun——见下）。
// 形式 = 动态 import()（**非**静态）：核登记册静态图经 consult/subagent 族可达核 agent 栈
// （`core/agent/setup.mjs:9` → `memory.mjs` → `node:sqlite`）——静态引入会破坏 W8 契约②
// （`test/engine-floor-guard.test.mjs:129`：端壳静态链不得到达 node:sqlite，低宿主加载期硬失败）。
// 核侧同款先例 = 核 `agent-tools.mjs` 头注「Loaded from agent.mjs via dynamic import」；
// 动态 import 不入静态闭包（扫描语义同 W8 契约）。
import { settingsTool as coreSettingsTool } from "@thincoder/core/agent-tools/settings.mjs"
import { resetRunState, reconcileEngDesignTokens, applySlotSessionState } from "./agent-state.mjs"
import { vscSubagentFace, modeRoleField, withPool, wireAgentToolSeams } from "./setup-tooltable.mjs" // 缝（KD-6）：迁出面同档再导出
import { loadSlot } from "../extension/session-io.mjs"
import { specForModel } from "../specs.mjs"
import { escapeXml, pushReal } from "./run-helpers.mjs"
import { expandHome } from "@thincoder/core/expand-home.mjs"
import { applyPromptInjections } from "@thincoder/core/prompt-files.mjs"
import { assemblePrompt } from "@thincoder/core/prompt-overlays.mjs"
import { resolveEngineeringManifest } from "@thincoder/core/manifest.mjs"
import { loadSkills, formatSkillListing } from "../extension/skills.mjs"
import { loadRaw, resolveProviders } from "@thincoder/core/config-io.mjs"
import { DEFAULTS, normalizeProxy } from "@thincoder/core/config.mjs"
import { loadConsultPool } from "../extension/presets.mjs"
import { setSlotEngDesignTokens } from "../extension/session-slot-write.mjs"
import { injectRunContext, loadProjectInstructions } from "./context-injections.mjs"
import { pushTimeReminder, pushInjections, appendImagePointer, pushEnvStateReminder, pushPeerReminder } from "./setup-reminders.mjs"
import { mergeFileRules, scopedRulesBlock } from "./rules-face.mjs" // #130 规则面判据单源（批档 §2.1）
export { vscSubagentFace, modeRoleField } // 既有导出名零改（批 7 VSC-DEBT §3.3 缝）

// W16（2026-09-15）：settings 工具 = 核工厂单源（`@thincoder/core/agent-tools/settings.mjs`
// `settingsTool(opts)`——本端实例化一次；写盘 = 核 `writeConfigAtomic`（DEFAULTS 全量类型表
// = A5 已裁「以 CLI 为准」——错类型拒写不再是端侧窄表）。
// #45 参数腿（WEBVIEW-PROTOCOL.md §3.3 判据②）：端侧**包装实例**——`execute` **返回后**置位
// `ctx.agent._settingsTouched`（不做「成功」判定；同步点读后复位、快照重推幂等）。
// 核零改（核内通知缝 = 本批边界外——批档 §2.5）。**导出**（测试直驱面 = settings-tool 用例）。
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

// PROMPT-SYSTEM 施工② G1（2026-09-10）：旧三件（system.md/discipline.md/main.md）退役——
// 六件槽位常量装载收口 prompt-overlays.mjs（mod 为槽位内容新家）；本文件不再各自读取。
// W2（2026-09-15）：槽位装配面 = **核内单点**（`@thincoder/core/prompt-overlays.mjs`）——本端
// 镜像已删（本地路径运算随之为零）。



/** AUTO mode reminder lives in setup-reminders.mjs (single source of truth —
 *  D-CI6: the agent loop head pushes it; agent.mjs imports it from there for the dedupe check). */

/**
 * agent 对象工厂——首轮-only（hydrateRun 每轮 reconcile）。归类：A = 回合级预算/守卫
 * （resetRunState 每 runAgent 清零——AC6）；C = 会话级保留（_tasks/_goal/_engDesignTokens
 * 不复位，hydrate 槽 reconcile）；_pendingReminders = A 复位 + restore 槽回填（A/C 双列注）；
 * B = run 绑定（每轮重指 _role/_provider/_planMode/cwd/history/_fullHistory/config 等）。
 * 池载体（_asyncSubagents/…）不在此——挂共享 history 数组。
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
    _engPersist: null, _engDesignReviewed: false, _engTaskInput: null, _batchDoc: null,
    cwd: null, history: null, _fullHistory: null,
    config: {
      advisor: { guard: false },
      agent: { engineering: false },
      proxy: undefined, shell: null, providersList: [], websearch: { apiKey: "" },
    },
  }
}

/**
 * hydrateRun —— 顶层 agent 每轮 reconcile：复位（A）→ config/tools/MCP 重建
 * （AC7）→ 槽水合（11.2.1）→ systemPrompt → history 重指 → 上下文注入。复用（opts.agent
 * ——面板回合/续跑）与新建（factory + restore:true）同路径；子代理 depth>0 经 setupAgentRun
 * （opts.agent 仅 depth-0 honored——AC5）。
 * @returns {{ agent, history, fullHistory, toolByName, toolSchemas, cfgVerifyGuard, cfgCompactThreshold, systemPrompt }}
 */
export async function hydrateRun(agent, { provider, cwd, input, opts, depth, role, getAuto, restore = false }) {
  const { mcpServers, skills, engState, engDesignReviewed, resume = false, autoTurn = false, batchDoc = null } = opts

  // per-run 复位先于一切 reconcile（含 inheritedGuard 的 agent.mjs 侧应用）
  resetRunState(agent)

  // W14（2026-09-15）：agent-tools 三缝（skill loader / eng mirror / verify 诊断段）接线——
  // 幂等一次；先于工具装配（skill / eng / verify 工具本轮即可用上端侧形态）。
  await wireAgentToolSeams()

  // W9/W13 → 本批（2026-09-15 · VSC-TOOL-TABLE-DUP §2.3C）：装配改调**核家族单源**——
  // 登记册解构面收窄至装饰所需实例（3 名）；角色分支链（原 `:351-385` depth/role 矩阵）
  // 整体退场（两边各一份的矩阵消灭——本批缺陷的类根因）。两档均**动态**载入（静态引入会经
  // consult/subagent 族触达 node:sqlite，破 W8 契约②；模块缓存 ⇒ 每轮零成本）。
  const { subagentTool, consultStartTool, consultStopTool } = await import("@thincoder/core/agent-tools.mjs") // ← 解构面收窄（装饰所需实例）
  const { assembleFamilyTools } = await import("@thincoder/core/agent/family-tools.mjs") // ← 动态（W8 契约②）
  const pool = loadConsultPool()
  // 端差不传 `engineering`：核内该参数唯一消费点 = filteredSubagent（depth-0 角色 enum +
  // escalate 池装饰），而本端恒以 `decorate.subagent`（vscSubagentFace）替换该实例——端侧
  // 同语义由 schema 面 `modeRoleField(engineering)` 承载（下方 `:503` 段）。将来去 decorate
  // 收敛时须随 `:487` 的 engineering 赋值阶段补传（§2.10.1 收敛通道同款残留项）。
  const agentTools = await assembleFamilyTools({
    depth, role,
    consultModels: pool,
    batchDoc,
    decorate: {
      subagent: pool.length ? withPool(vscSubagentFace(subagentTool)) : vscSubagentFace(subagentTool),
      consultStart: pool.length ? withPool(consultStartTool) : consultStartTool,
      consultStop: consultStopTool,
      settings: settingsTool,
    },
  })
  // M2 台账查询两工具（核 `tools/index.mjs:61` 同法——全角色面）：动态 import——ledger 链静态
  // 达 `node:sqlite`（W8 契约②）；写命令族已随核 `assembleFamilyTools` 在端可达（上方装配块）。
  const { ledgerQueryTool, ledgerCountTool } = await import("@thincoder/core/ledger.mjs")

  // MCP tools: idempotent connect + expand into NATIVE tools (CLI parity, MCP.md D1/D2).
  // Top level only; failures never block — D-CI7（F-Q11）：警告可见面 = console
  // （端壳 MCP 面 `panel-mcp.mjs` / cli make-agent.mjs 同前缀）；不是 history 注入（CLI 无此
  // 行为）——mcpWarnings 字段保留为采集面。
  let mcpTools = []
  const mcpWarnings = []
  if (depth === 0 && Array.isArray(mcpServers) && mcpServers.length > 0) {
    try {
      const { connectMcpServersExpanded } = await import("../extension/panel-mcp.mjs")
      const r = await connectMcpServersExpanded(mcpServers)
      mcpTools = r.tools
      mcpWarnings.push(...r.warnings)
    } catch { /* expansion failure is non-fatal — the model just lacks MCP tools this turn */ }
  }

  // Subagent role-based tool filtering: explore/plan/consult get read-only tools only.
  // `question` is excluded from ALL subagents (depth > 0) — it's an interactive main-agent
  // tool; a background subagent (parallel consultants especially) must never prompt the user.
  const isReadOnlyRole = depth > 0 && (role === "explore" || role === "plan" || role === "consult")
  const baseTools = [
    ...(isReadOnlyRole ? builtinTools.filter((t) => t.readonly) : builtinTools),
    ledgerQueryTool, ledgerCountTool, // M2 查询两工具（只读——只读角色同放行；恒入基础集）
  ].filter((t) => depth === 0 || t.name !== "question")
  // L1 契约（VSC-TOOL-TABLE-DUP §2.1A）：`agent.tools` 绑定值 = **基础集**（下方 `baseSet`）
  // ——不含端侧 meta 工具族 `agentTools`（核 `assembleFamilyTools` 追加族与端侧 meta 族实测
  // 重叠 11 名 ⇒ 入绑定值必致子代装配重名）；全表 `tools` 原样保留（端侧 schema `:503` /
  // 执行面 `toolByName`）。多模态项抽 `mm` 局部（§2.1A 认可消重形态——行为等价）。
  const mm = specForModel(provider.model).multimodal ? [readImageTool] : []
  const baseSet = [
    ...baseTools,
    ...mm,
    ...mcpTools,
    // caller-injected tools (e.g. consult's main_history)——注入方承担「与核追加家族不重名」义务（§2.3F）
    ...(opts.extraTools ?? []),
  ]
  const tools = [
    ...baseTools,
    ...mm,
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
  let cfgPoolLimits = null // §5 D-24a（R14）：async 池角色域容量——每次入池判定时读（effectivePoolLimits 校验）
  let cfgWaitForTimeoutMs = undefined // wait_for default override (TOOLS.md §16 — CLI parity); undefined → tool default 30s
  let cfgProviders = []
  let cfgWebsearch = { apiKey: "" } // structured search; empty key → Bing fallback
  let cfgHooks = null // P2 批 §2.16：hooks 段随 config 读入（`runHooks` 消费面）
  // TRACE-STORE-VSC（D-TR6 镜像——核 config.mjs DEFAULTS.traces 合并同语义）：traces 段
  // 默认 OFF（2026-09-05 发布隐私裁定）——agent.config.traces 由此整建——每轮拾取外部变更
  let cfgTraces = { ...DEFAULTS.traces }
  // #175（W15 · a 半）：autoThink 键随 config 归一（默认 false——核 DEFAULTS.agent.autoThink；
  // 消费点 = agent.mjs 循环首轮核分类器调用）——W16 前为死键（全仓零消费）。
  let cfgAutoThink = DEFAULTS.agent?.autoThink === true
  let cfgStreamRules = [] // #130 A-1/A-2：stream 规则（`.thincoder/rules` 文件规则并入 config 规则）
  try {
    const raw = loadRaw()
    advisorCfg = raw.agent?.advisor ?? { guard: false }
    cfgEngineering = raw.agent?.engineering ?? false
    cfgVerifyGuard = raw.agent?.verifyGuard === true // opt-in, CLI parity
    cfgCompactThreshold = raw.agent?.compactThreshold ?? null // null = auto from model context
    cfgProxy = normalizeProxy(raw.proxy) // web tools consult agent.config.proxy (resolveWebProxy)
    cfgShell = typeof raw.shell === "string" && raw.shell ? expandHome(raw.shell) : null // bash tool shell override (CLI parity)——群 A 批 A2：`~` 单点归一（只读——不写回）
    cfgSubagentModel = raw.agent?.subagentModel ?? null // default subagent model override (CLI parity)
    cfgSubagentModels = raw.agent?.subagentModels ?? {} // per-type subagent model overrides (CLI parity)
    cfgSubagentTurns = raw.agent?.subagentTurns ?? 100 // subagent turn cap (CLI parity)
    cfgMaxTurns = raw.agent?.maxTurns ?? 200
    cfgConsultModels = loadConsultPool() // consultation model list (CONSULTATION.md——F-4 清洗后合法池)
    cfgConsultTurns = raw.agent?.consultTurns ?? 40 // consultation turn budget (panel-exposed)
    cfgConsultTimeoutMs = raw.agent?.consultTimeoutMs ?? 600_000 // consultation wall-clock watchdog (panel-exposed)
    cfgPoolLimits = raw.agent?.poolLimits ?? null // §5 D-24a: async pool per-domain limits（校验在 scheduler 读点）
    cfgWaitForTimeoutMs = raw.agent?.waitForTimeoutMs ?? undefined // wait_for timeout override — tool applies its own default/cap when absent
    cfgProviders = resolveProviders().providers // for subagent model overrides
    cfgWebsearch = raw.websearch ?? { apiKey: "" }
    cfgHooks = raw.hooks ?? null
    cfgTraces = { ...DEFAULTS.traces, ...(raw.traces ?? {}) }
    cfgAutoThink = raw.agent?.autoThink ?? cfgAutoThink // #175a：显式键优先（缺省 = 核 DEFAULTS）
    cfgStreamRules = mergeFileRules(raw.agent?.streamRules ?? [], cwd) // #130 A-1：与 CLI make-agent.mjs:44-48 同语义
  } catch { /* config unreadable — defaults */ }

  // 槽 reconcile：顶层会话绑定（opts.engPersist = {cwd, slot}）每轮读权威槽（settle
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
      waitForTimeoutMs: cfgWaitForTimeoutMs, poolLimits: cfgPoolLimits, autoThink: cfgAutoThink,
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
  // #45（WEBVIEW-PROTOCOL.md §3.3 判据①——设计评审轮 1 发现 9 定值）：`_engShown` = **已展示基线**
  // （当前 engineering 布尔——槽应用之后取值）；非 `undefined` / `null`（后者会让每 run 首个工具批
  // 无条件重推一次快照）。工具驱动翻转的比对起点（写入面 = agent-state 同步 cell）。
  agent._engShown = agent.config?.agent?.engineering === true
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
      // 重组后的描述仍经锚替换原语（§2.13.8 面 3 单出口——本行不得以裸描述覆写注入结果）
      schema.function.description = applyPromptInjections(t.description + (suffix ? "\n" + suffix : ""))
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
  // autoApprove 字段接线（2026-09-16 缺陷修复——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md`
  // §2 A′）：核侧读**父对象字段** `parent.autoApprove`（spawn 门 `subagent.mjs:258` · escalate 门
  // `:184` · 子代权限继承 `subagent-spawn.mjs:305` · 读点族 `subagent-async.mjs:272` 等），而本端
  // live AUTO 值只走 `getAuto` 闭包 ⇒ 宿主曾缺该字段、核读点恒判非 AUTO（自动轮 spawn 恒拒 +
  // 子代理写恒拒 + 报告必待用户再发一句）。形态 = **访问器**（每轮重定义——复用单例换轮换闭包）：
  // 取值恒 live（轮中翻转同读——与端面板 mid-turn doctrine `permission-gate.mjs:5-10` 及 CLI
  // 字段翻转语义一致）；**无 setter** ⇒ 面板 flag 为唯一来源、未来写入方失败显性（fail-loud）。
  // 先例 = `agent.mjs:144-150` 载体访问器别名（同文件同形态）。
  const autoProbe = typeof getAuto === "function" ? getAuto : () => false // 归一（同 agent.mjs:64）
  Object.defineProperty(agent, "autoApprove", { configurable: true, enumerable: true, get: () => autoProbe() === true })
  agent._depth = depth // TRACE-STORE-VSC（D-TR4）：compress/distill 等内嵌 chat 调用点的 depth 归属
  agent._provider = provider
  // 核 spawn 父对象读点（parent.tools——角色过滤/直传 + 子代装配展开）：每轮重指**基础集**
  // （`baseSet`——不含端侧 meta 工具族 `agentTools`；家族段由核 `assembleFamilyTools` 追加
  // ——不相交式 = 追加家族 ∥ 绑定值；VSC-TOOL-TABLE-DUP §2.1A），不拷贝。
  agent.tools = baseSet
  agent._engTaskInput = opts.engTaskInput ?? null
  // VSC 端镜像批（2026-09-11 · 第 5 批）：spawn 侧批次档绑定上车（batch_segment 的唯一路径来源，现行权威 = BATCH-RECORD.md §4.2；无 path 参数——
  // 目标档由 spawn 绑定 / 评审实例键提供）。顶层/非工程角色恒 null（不挂载工具）。
  agent._batchDoc = batchDoc
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
  // ── System prompt ── PROMPT-SYSTEM 施工② G2/G3（2026-09-10）：四槽位装配函数
  // assemblePrompt({scenario}) 表驱动（D1 场景表 = 蓝图 §3.2 装配矩阵）——取代旧
  // consult/工程/普通三分支 + overlay 前缀。固定序 人格→common→纪律（§3.1）；
  // 降级链（蓝图 §3.4）：人格/纪律/common 槽文件缺失 → 该槽空缺跳过 + 醒目警告
  // （不 fallback 其他槽——层间隔离）。consult = 特殊模块（§3.3）——CONSULT_BASE
  // 自含基底直接返回，不入主链、无四槽。eng-coder 场景即工程纪律（G6——本端
  // spawn 侧 engineering 镜像语义同 CLI：scenario=eng-coder → discipline-engineering 槽）。
  // [4] 层（项目指令 + skills 清单）= systemPrompt 尾块——D-CI2（cli :341-349 同序）。
  const engPromptActive = engineering && (depth === 0 || role === "eng-coder" || role === "eng-designer")
  const scenario =
    role === "consult"
      ? "consult"
      : engPromptActive
        ? (role === "eng-coder" || role === "eng-designer" ? role : "engineering")
        : (depth === 0 ? "normal" : role ?? "normal")
  const { prompt: base, warnings: slotWarnings } = assemblePrompt(scenario)
  // G3：overlay（人格）随装配改造退役——人格槽由场景表承载，不再前缀叠加。
  // [4] 层（D-CI2——cli setup.mjs:341-349 同序）：项目指令块（不分 depth）+ skills 清单
  // （depth 0）。旧「OS: … Working directory:」尾行退役——载体归 pushOsSnapshot（D-CI1 #2）。
  let systemPrompt = base
  const projectRules = loadProjectInstructions(cwd)
  if (projectRules) {
    systemPrompt += `\n\nProject instructions (follow these as project conventions):\n<untrusted_project_instructions>\n${escapeXml(projectRules)}\n</untrusted_project_instructions>`
  }
  // #130 B-3/B-4：`.cursor/rules` 常驻集 [4] 层尾块 + 作用域集缓存载体（本 run 唯一一次目录读）
  systemPrompt += scopedRulesBlock(agent, cwd)
  if (depth === 0) {
    const skillsList = Array.isArray(skills) ? skills : loadSkills(cwd)
    const listing = formatSkillListing(skillsList)
    if (listing) systemPrompt += `\n\n${listing}`
  }

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

  // ── Q1 审计收敛（蓝图 §3.4 第 4 款）：特殊模块基底缺失 → 该模块不可用报错（不自降级
  // ——空基底绝不可静默上岗）。consult 场景在外部消费点收口：入历史后抛错（面板回合
  // → 错误可见——不静默、不降级）。四槽场景维持跳过+警告降级链（AC-2 三款）。
  // 位置纪律：必须在 history 初始化之后（advisor round1 🔴——此前引用未初始化的
  // history 绑定会 TDZ ReferenceError，守卫/警告在触发时自爆）。
  if (role === "consult" && !base) {
    const msg = "[Consult module unavailable: prompts/consult-base.md missing — the consultation module refuses to degrade (蓝图 §3.4 特殊模块不自降级). Check the installation's prompts directory.]"
    history.push({ role: "user", content: msg })
    throw new Error(`consult-base.md missing — consultation module unavailable (no degraded fallback per PROMPT-SYSTEM §3.4)`)
  }
  // D2 警告通道 = history 注入（CLI 同款深度门——depth 0 才注入）。
  if (depth === 0 && slotWarnings.length > 0) {
    for (const w of slotWarnings) history.push({ role: "user", content: w })
  }

  // The advisor helpers (ported from the CLI) reach for agent.cwd and agent.history —
  // keep those aliases live so the ported modules work unchanged.
  agent.cwd = cwd
  agent.history = history
  // M1-manifest（docs/core/design/MANIFEST.md §2.2 两端装配钩子——VSC 端）：
  // 模式门（KD-M1-12——判据 = `agent.config.agent.engineering`，已由 `applySlotSessionState`
  // 按槽订正：槽优先 + config 回退）：普通会话 → 钩子整体不执行——**零 manifest I/O**
  // （不读 / 不拒 / 不建档）+ `agent.manifest = null`（清残留附着——复用 agent 跨模式防陈旧）。
  // #41 薄包装（KD-M1-20 / AC-19）：工程模式分支的决策树 = 核单源 `resolveEngineeringManifest`
  // （非抛错形态）——本块只把它翻回「抛错」，四条出口（附着 / 缺档建档 / 根不可解析抛 / 档非法抛）
  // 的**结果与文案逐字不变**（原句由决策树构造）。depth > 0（子代理水合同经此钩）⇒ `init:false`
  // （仅不初始化——写门缺省拒已机械兜底；缺档格零动作）。
  if (agent.config?.agent?.engineering !== true) {
    agent.manifest = null
  } else {
    const r = resolveEngineeringManifest(cwd, { writer: "main", init: depth === 0 })
    if (r.ok) agent.manifest = r.manifest
    else if (r.code !== "missing") throw new Error(r.message) // 仅 depth > 0 可达 missing
  }
  // TRACE-STORE-VSC（D-TR4 镜像——CLI agent/setup.mjs `_sessionStart ??=` 同语义）：顶层
  // 会话身份 = 槽 sessionStart（跨端同身份——F2 打点同源）优先，无槽/未保存则首建打点；
  // 复用 agent 不重打（??=——同会话跨回合恒等）；子代理（depth>0）不设——轨迹 session
  // 字段 null（CLI parity——children 无 _sessionStart——回靠 role+depth 归属）。
  if (depth === 0 && agent._sessionStart == null) {
    agent._sessionStart = sessionData?.sessionStart ?? new Date().toISOString()
  }
  // read_history (SESSION.md §6.9): the tool reads the HUMAN line via agent._fullHistory —
  // attach at depth 0 only (subagent throwaway lines are never reachable, the tool is not
  // registered for them anyway).
  if (depth === 0) agent._fullHistory = fullHistory
  // SESSION.md §6.11（2026-09-08——F2 评审 #7 修复版）：resumed 按会话跟踪——agent 级
  // _resumedPending 只在 agent 新建（restore:true factory 路径——首轮/destroy 换槽重建
  // 同路径）且 fullHistory 载入非空时武装——每次槽恢复进新 agent 天然得一次 resumed:yes；
  // 同绑定复用（restore=false）不武装（下方注入点消费即清——复用路径恒 no）。
  if (restore && fullHistory.length > 0) agent._resumedPending = true
  // process restarted 句（N6——评审 🔴 修复）：随 D-CI1 #3 迁入 context-injections
  // （injectRunContext——模块级 restartDetectionDone 一次性闸保留：extension host 重启后
  // 模块级重置、进程内切槽不重置＝真重启语义；判据 = 载入历史非空，且在用户输入落线前
  // 求值——CLI prepareRun 同序）。跨端异名互指（结构债批 5 N7）：thincoder SESSION.md §6.11
  // ——CLI 同机制载体 = agent._envResumed + agent._processRestartPending。

  // Live history reference for the parent: same array the loop appends to — a caller
  // that catches ContinueError can hand it back via opts.history to resume the child
  // conversation (escalate turn-cap continue).
  if (opts.stateSink) opts.stateSink.history = history

  // ─── Context injection（D-CI1/D-CI2——§17.3 契约 / §17.4 序表）────
  // 块 #1–#6（git → OS/cwd/Session start/快照 → restarted → 依赖大纲 → 文档召回 →
  // 记忆召回）由 context-injections 单一编排注入（只追加、只 transient、
  // 失败静默；门 = depth 0 且非 resume/autoTurn）。原 git 行与 restarted 段随编排退役。
  await injectRunContext(agent, { history, cwd, input, depth, resume, autoTurn, platform })

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

  // SESSION.md §6.11：统一 env-state reminder（每回合、depth-0）——注入句解耦
  // （N6——评审 🔴 修复、双信号独立消费）：resumed:yes = agent 级 _resumedPending（上方
  // restore 路径武装——读即清，每次会话恢复一次；切槽恢复只发 resumed:yes、不误报进程
  // 重启）。process restarted 句由 context-injections #3（injectRunContext）在输入落线前按进场历史求值。
  if (depth === 0) {
    const resumed = agent._resumedPending === true
    agent._resumedPending = false
    pushEnvStateReminder(history, { engineering, provider, slot: bind?.slot ?? null, resumed })
  }

  // R10 L1（MULTI-INSTANCE-COLLAB.md D-L1a——决策④ 每回合）：同伴实例提醒——env-state
  // 之后、time reminder 之前（transient；有同伴才注入——peerInstances 惰性 mtime 缓存）。
  if (depth === 0) pushPeerReminder(history, cwd)

  // D-CI2/§17.4 #11/#12：编辑器注入（VSC 独有——D-CI5 同文去重后）在 peer 之后、time 之前；
  // time 保持最后（前缀缓存契约——KD-2：cli setup.mjs:145-146/152-156 同为尾位）。
  pushInjections(history, opts.injections)

  pushTimeReminder(history)

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
