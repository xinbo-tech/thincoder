/**
 * config.mjs — configuration loading and saving
 * Model-merge schema v2 (2026-09-10 MODEL-SELECTION; 2026-10-09 清除批：渠道单值模型退场):
 * providers[] carry NO channel default model (`providers[].model` retired — 渠道不是模型选择
 * 单位); the candidates list field models[] is gone — the available-model list is fetched from
 * the provider at runtime (`GET /models`, PROVIDER.md §16). config.defaultModel (top level,
 * "provider:model" composite) is the new-session starting point; activeProvider/activeModel
 * are gone from config (session slots keep their own double fields). Legacy fields migrate
 * on load (write-back failure never blocks startup).
 * Config file: ~/.thincoder/config.json
 * API key comes from providers[].apiKey only — environment variables are not a key source.
 */

import { existsSync, readFileSync } from "node:fs"
import { parseModelRef, resolveChannelModel, resolveProviderPlan, resolveRuntimeProvider, defaultModelReason } from "./model-ref.mjs"
// 老形态迁移核（M7 v2——纯函数零依赖——本文件超 500 行硬限拆分，VSC 同构文件）
import { migrateLegacyModelFields } from "./config-migrate.mjs"
import { expandHome } from "./expand-home.mjs"
// 核内单一读写面 + 预设表（§2.5 #129 / #131——拆档以容纳 500 行硬限）
import {
  PROVIDER_PRESETS, presetToEntry, configDir, configPath, _setConfigPathForTest, _resetConfigPathForTest,
  _configPath, writeConfigAtomic,
} from "./config-io.mjs"

export { parseModelRef, resolveChannelModel, resolveProviderPlan, resolveRuntimeProvider, defaultModelReason, migrateLegacyModelFields }
export { PROVIDER_PRESETS, presetToEntry, configDir, configPath, _setConfigPathForTest, _resetConfigPathForTest }
// 核内单一写盘执行体（已迁 `config-io.mjs`）——本档 re-export 保持既有导入面（§2.5 #131）。
export { writeConfigAtomic }

function cfgPath() { return _configPath() }

// 配置默认值表本体已迁 `config-defaults.mjs`（CONTEXT-COMPACTION.md §6.16.9 —— C1：默认值数据 /
// 加载期归一逻辑 / 请求预算算式三件分家）；本档 re-export 保持既有导入面（34 档零改）。
import { DEFAULTS } from "./config-defaults.mjs"
export { DEFAULTS }

// Model capability table + spec lookup live in model-specs.mjs (2026-08-31
// extract — config.mjs had grown past the 300-line advisory). Re-exported here
// so the 23 existing importers keep their import paths.
import { specForModel, providerSpec, providerSpecResolution, specMatch, formatContextK, assistantToolCallMessage } from "./model-specs.mjs"
export { specForModel, providerSpec, providerSpecResolution, specMatch, formatContextK, assistantToolCallMessage }
// 上下文解析链的取值校验单点（PROVIDER.md §6.15）：装载归一与读面共用一个谓词。
import { positiveInt, warnContextOnce } from "./model-context.mjs"


// Window utilization ratio (CONTEXT-COMPACTION.md §6.2 / D-CC30 / §6.17 / D-CC32): auto threshold =
// min(usableWindow(window, reserve), ⌊window × COMPACT_RATIO⌋) — reserve is the output budget
// ACTUALLY sent as max_tokens (uncapped; §6.17 requestBudget is the single source). Rows with
// reserve ≤ 20% of the window land on the ratio term; larger reservations pull the line down to
// window − reserve — overflow-free outranks the 75–80% band (mathematically exclusive there, §6.2).
// Headroom above the line absorbs injected context (directory tree, git context, outline, project
// instructions, memory/doc search results — 30–50K tokens per turn).
const COMPACT_RATIO = 0.8

/** Output reservation counted against the window: the value ACTUALLY sent as max_tokens —
 *  explicit `provider.maxTokens` when set (the transport faces send it verbatim), else the spec
 *  `maxOutput`, else 0. NOT capped: the old 25% cap reopened a residual band between the counted
 *  reservation and the real output budget — messages could cross the true window while still below
 *  the compaction line (2026-10-18 overflow 400: budget counted 250_000, 393_216 actually sent).
 *  Single source = §6.17 requestBudget; this is its reserve face (advisor budget reuses it). */
export function outputReserve(provider, spec) {
  const explicit = provider?.maxTokens
  return Number.isFinite(explicit) && explicit > 0 ? explicit : spec?.maxOutput ?? 0
}

/** Usable input window = window − output reservation. Degenerate guard: a reservation
 *  ≥ the window is non-physical (no input could ever fit — e.g. the doubao spec
 *  `maxOutput` 524_288 > `context` 256_000 ∥ the test harness&apos;s 1K window vs the default
 *  spec); collapsing the budget to 0 would be instant `context_limit` death — the very
 *  failure the reservation fold exists to prevent. Fall back to half the window.
 *  (2026-10-06——收口核验捕获：advisor-loop-split B5a 红。） */
export function usableWindow(context, reserve) {
  const ctx = context ?? 0
  const usable = ctx - reserve
  return usable > 0 ? usable : Math.floor(ctx / 2)
}

/** Request budget — single source for window ∥ actually-sent max_tokens ∥ compaction threshold ∥
 *  overflow guard (CONTEXT-COMPACTION.md §6.17 / D-CC32). One formula, four consumer faces:
 *  threshold (resolveCompactThreshold / per-run setup), the four transport faces (read ONLY
 *  maxTokens), the stats budget line (agent-tools/context.mjs), the pre-send guard
 *  (agent/run-stages.mjs). transport derives from provider.format ("anthropic" | "google" |
 *  "responses" | default = OpenAI-compatible). Fields:
 *  - window / windowSource: spec.context (the §6.15 chain — modelContext / legacy context /
 *    /models self-report / static table / default — already resolved by providerSpec);
 *    source = providerSpecResolution(provider).source — closed set { modelContext |
 *    provider-override | list | spec | default }, passed through verbatim (no class merging).
 *  - maxTokens / maxTokensSource: the value THIS transport writes into the request body —
 *    anthropic always sends it (explicit ?? spec.maxOutput); the other three faces send only an
 *    explicit provider.maxTokens, absent ⇒ undefined / "absent". Never a guard criterion
 *    (undefined ⇒ NaN — §6.17 guard); the guard reads limit instead.
 *  - reserve: maxTokens ?? spec.maxOutput — uncapped, always a number.
 *  - usable: usableWindow(window, reserve) (degenerate half-window guard).
 *  - threshold: min(usable, ⌊window × COMPACT_RATIO⌋) — the compaction trigger line.
 *  - limit: window − reserve — hard prompt ceiling; the guard's ONLY numeric criterion field
 *    (always a number; negative = any prompt overflows). */
export function requestBudget(provider, spec) {
  // windowSource = 五级链的同一次遍历出口（§6.15）——L1 / L3 命中也会如实报来源，不再二值猜。
  // 调用方传 spec（core.mjs 已算过 providerSpec）时窗口值用它，来源仍读 resolution（恒等映射，不并类）。
  const resolution = providerSpecResolution(provider)
  const resolved = spec ?? resolution.spec
  const window = resolved?.context ?? 0
  const windowSource = resolution.source
  const explicitRaw = Number(provider?.maxTokens)
  const explicit = Number.isFinite(explicitRaw) && explicitRaw > 0 ? explicitRaw : undefined
  const anthropicAlwaysSends = provider?.format === "anthropic"
  const maxTokens = explicit ?? (anthropicAlwaysSends ? resolved?.maxOutput ?? 0 : undefined)
  const maxTokensSource = explicit != null ? "explicit" : anthropicAlwaysSends ? "spec" : "absent"
  const reserve = maxTokens ?? resolved?.maxOutput ?? 0
  const usable = usableWindow(window, reserve)
  return {
    window, windowSource, maxTokens, maxTokensSource, reserve, usable,
    threshold: Math.min(usable, Math.floor(window * COMPACT_RATIO)),
    limit: window - reserve,
  }
}

/** Derive compaction threshold; explicit is the value explicitly set in config file (takes priority),
 *  otherwise auto = requestBudget().threshold (§6.17 single source — min(usable, ⌊window × 0.8⌋),
 *  reserve uncapped). Second param accepts EITHER a model name string (pure spec lookup — compat shape,
 *  no caller passes a string today) OR a provider object (providerSpec — the providers[].context
 *  override in K units is honored, PROVIDER.md §15 T-C2). */
export function resolveCompactThreshold(explicit, modelOrProvider) {
  if (explicit != null) return { value: explicit, auto: false }
  const provider = typeof modelOrProvider === "string" ? { model: modelOrProvider } : (modelOrProvider ?? {})
  return { value: requestBudget(provider).threshold, auto: true }
}

/**
 * Bailian (阿里云百炼) host check — enable_thinking is a Bailian-only extension parameter;
 * sending it to other endpoints (kimi/glm/custom proxies) would pollute the request.
 */
export function isBailianHost(baseURL) {
  return typeof baseURL === "string"
    && (baseURL.includes("dashscope.aliyuncs.com") || baseURL.includes(".maas.aliyuncs.com"))
}

/**
 * Resolve the Bailian `enable_thinking` switch for qwen hybrid-thinking models (PROVIDER.md §12).
 * qwen3.x on Bailian defaults to thinking ON, so an explicit off must send enable_thinking:false
 * or the server silently keeps thinking. Whitelist: model name starts with "qwen" (excluding the
 * non-thinking qwen3-coder line) AND the provider points at a Bailian host.
 *   provider.thinking === null → false     (explicit off: /think off, panel off — NF1 convention)
 *   provider.reasoningEffort   → true      (effort tier implies thinking on; rides with reasoning_effort)
 *   otherwise                  → undefined (field omitted — server default stays, no behavior change)
 * NOTE: spec carries no model field today — the name comes from provider.model (spec?.model is
 * a forward-compatible fallback). 非串 model（脏载 / 手工档）归一等价空串（未登记 ⇒ undefined）——
 * 本函数恒 total、不因类型脏载抛（#638 查表族同归一）。
 */
export function resolveEnableThinking(provider, spec) {
  const raw = provider?.model ?? spec?.model ?? ""
  const model = (typeof raw === "string" ? raw : "").toLowerCase()
  if (!model.startsWith("qwen") || model.startsWith("qwen3-coder")) return undefined
  if (!isBailianHost(provider?.baseURL)) return undefined
  // 一致性分支（#1659）：effort 档位有值且非 "none" ⇒ effort 赢（thinking on）。
  // 百炼约束：enable_thinking:false 时 reasoning_effort 必须为 "none"，互斥即 400。
  // 压缩下行（context.mjs:203）显式 thinking:null 但继承 effort（v3 同源裁定）——
  // 无此分支则发出 {enable_thinking:false, reasoning_effort:"medium"} ⇒ 400 ⇒ 压缩三连败。
  if (provider.reasoningEffort && provider.reasoningEffort !== "none") return true
  if (provider.thinking === null) return false
  if (provider.reasoningEffort) return true
  return undefined
}

// 加载期归一 / 清洗纯函数族已迁 `config-normalize.mjs`（§6.16.9 —— C1）——四个公共函数经本档
// re-export 保持既有导入面；其余四个（sanitizeProviderHeaders ∥ sanitizeConsultModels ∥ 两枚
// 一次性警告旗）只由 loadConfig 消费。
import {
  sanitizeConsultModels, warnConsultModelsFiltered, sanitizeSubagentModel, sanitizeSubagentModels,
  warnSubagentModelsFiltered, sanitizeProviderHeaders, normalizeProxy, normalizeTeamSection,
} from "./config-normalize.mjs"
export { sanitizeSubagentModel, sanitizeSubagentModels, normalizeProxy, normalizeTeamSection }

/** Module-level one-time warn dedupe for invalid providers[].context (PROVIDER.md §15 D-C1). */
const warnedContextProviders = new Set()

/**
 * Find provider by name in providers[].
 * Throws if name is non-empty but not found — a typo in the caller-supplied name (e.g. `defaultModel`) silently falling to the first provider would use the wrong key on the wrong endpoint.
 * Returns the first provider when name is empty.
 */
export function findProvider(providers, name) {
  if (name) {
    const found = providers.find((p) => p.name === name)
    if (found) return found
    const available = providers.map((p) => p.name).join(", ") || "(empty)"
    throw new Error(`provider "${name}" not in providers list (available: ${available}); check for a typo in: ${configPath}`)
  }
  return providers[0] ?? { name: "default", baseURL: "" }
}

/**
 * Promote `agent.advisor` into the runtime view `config.advisor`（decoupled copy——`{ ...config.advisor,
 * ...config.agent.advisor }`）。单一规则：`loadConfig` 装载期与 `settings set` 写面共用（`SETTINGS-TOOL.md` §2.3）。
 * 只住运行面的会话级键（如 `advisor.guard`——`cmd-advisor.mjs` 只写 promoted）在合并中保留；
 * promoted 是副本而不自动跟随 nested，所以每个写点都得同步（`AGENT-PARAMS.md` §2 写面不变式）。
 */
export function promoteAgentViews(config) {
  const nested = config.agent?.advisor
  // 非对象段（手写 config.json 的畸形值）不展开——字符串 spread 会产出 0/1/2 垃圾键；
  // 读面本身对非法值「一律回退默认」（AGENT-PARAMS.md §2 / D-P3）
  config.advisor = { ...config.advisor, ...(nested !== null && typeof nested === "object" && !Array.isArray(nested) ? nested : {}) }
  return config
}

/**
 * Load configuration.
 * No env-var overrides — config.json is the single source of truth
 * (API keys, baseURL, defaultModel all come from the file).
 * loadConfig 内联迁移核已迁 config-migrate.mjs（500 行硬限拆分——VSC 同构）——
 * migrateLegacyModelFields 纯函数 + 本文件 import/写回编排（折中 C 见其头注释）。
 */
export function loadConfig() {
  let config = {}
  const path = cfgPath()
  if (existsSync(path)) {
    try {
      config = JSON.parse(readFileSync(path, "utf8"))
    } catch (error) {
      throw new Error(`Config file is not valid JSON, check or delete it: ${path}\n  ${error.message}`, { cause: error })
    }
  }

  // ── 迁移（M7 v2）：检测老字段（models[] / active* / 垃圾值）→ 内存迁移态先行；写回失败绝不阻断（下次 load 重试——幂等）──
  if (migrateLegacyModelFields(config)) {
    try {
      const r = writeConfigAtomic(path, migrateLegacyModelFields) // 磁盘 fresh raw 同变换
      if (r.ok === false) console.warn(`[config] migration write-back skipped (${r.reason}) — memory state continues, retried on next load`)
    } catch (e) {
      console.warn(`[config] migration write-back failed — memory state continues, retried on next load: ${e.message}`)
    }
  }

  const merged = {
    ...DEFAULTS,
    ...config,
    defaultModel: typeof config.defaultModel === "string" && config.defaultModel.trim() ? config.defaultModel : null,
    providers: Array.isArray(config.providers)
      ? config.providers.map((p) => sanitizeProviderHeaders({ ...p }))
      : [],
    agent: { ...DEFAULTS.agent, ...config.agent },
    memory: { ...DEFAULTS.memory, ...config.memory },
    embedding: { ...DEFAULTS.embedding, ...config.embedding },
    browser: { ...DEFAULTS.browser, ...config.browser },
    traces: { ...DEFAULTS.traces, ...config.traces },
    diagnostics: { ...DEFAULTS.diagnostics },
  }

  // 家目录展开（第 29 批）：config 路径字段单一规范化点——只读归一（磁盘原文保留）
  merged.memory.dbPath = expandHome(merged.memory.dbPath)
  merged.memory.projectDir = expandHome(merged.memory.projectDir)
  const team = merged.memory.team
  if (team && typeof team === "object" && !Array.isArray(team) && team.dir !== undefined) {
    merged.memory.team = { ...team, dir: expandHome(team.dir) }   // 无 dir 键不注入（零键面变化）
  }
  merged.shell = expandHome(merged.shell)

  // diagnostics（① 配置键，CONFIG.md §6.2 名录）：两键只认布尔值——非法 / 缺失回退默认（不 throw）
  const _diagRaw = config.diagnostics && typeof config.diagnostics === "object" && !Array.isArray(config.diagnostics) ? config.diagnostics : {}
  for (const key of ["heapWatch", "heapSnapshot"]) if (typeof _diagRaw[key] === "boolean") merged.diagnostics[key] = _diagRaw[key]

  // providers[].model 一律删除（2026-10-09 清除批——渠道单值模型退场：渠道不携模型，不落任何
  // 回退；模型身份唯二 = 顶层 defaultModel 复合串 ∥ 会话槽选定——PROVIDER.md §6.16 M3）。
  for (const p of merged.providers) {
    if (p.model !== undefined) delete p.model
  }

  // providers[].context (K units, PROVIDER.md §15 D-C1): positive integer only — invalid
  // values (0/negative/non-numeric) are IGNORED (spec value applies) with a ONE-TIME warn
  // per provider name (module-level dedupe, same precedent as warnedModels in model-specs.mjs).
  for (const p of merged.providers) {
    if (p.context === undefined) continue
    if (Number.isInteger(Number(p.context)) && Number(p.context) > 0) { p.context = Number(p.context); continue } // 数字字符串（"128"）归一为数字——两端语义统一（code review #1）
    if (!warnedContextProviders.has(p.name ?? "(unnamed)")) {
      warnedContextProviders.add(p.name ?? "(unnamed)")
      console.warn(`[config] provider "${p.name}" context must be a positive integer in K units (e.g. 128 = 128K) — got ${JSON.stringify(p.context)} — ignored, using the model spec value`)
    }
    delete p.context
  }

  // providers[].modelContext（按模型的人工声明，K 单位——PROVIDER.md §6.15）：值只收正整数，
  // 非法（0 / 负 / 非数 / 非整 / 布尔 / 数字字符串）⇒ 该键视为未声明（落 L2）+ 装载期告警一次
  // （P-13）。数字字符串**不归一**（不同于旧键 context）：写面先 parse 再落盘，文件里的字符串是
  // 手改/笔误，静默转数会把「想写哪个单位」藏起来（旧键两起 ×1024 事故的根因）。
  // 读面（manualContextK）仍逐次防御——装载归一不产新键，只清内存镜像（磁盘原文零变）。
  for (const p of merged.providers) {
    if (p.modelContext === undefined) continue
    const rawMC = p.modelContext
    if (!rawMC || typeof rawMC !== "object" || Array.isArray(rawMC)) {
      warnContextOnce(`modelContext-shape\0${p.name ?? ""}`,
        `[config] provider "${p.name}" modelContext must be an object of model ID → positive integer K (e.g. 128 = 128K) — got ${JSON.stringify(rawMC)} — ignored`)
      delete p.modelContext
      continue
    }
    p.modelContext = { ...rawMC }
    for (const [key, value] of Object.entries(p.modelContext)) {
      if (positiveInt(value) !== null) continue
      warnContextOnce(`modelContext-invalid\0${p.name ?? ""}\0${key}`,
        `[config] provider "${p.name}" modelContext["${key}"] must be a positive integer in K units (e.g. 128 = 128K) — got ${JSON.stringify(value)} — ignored, falling through to the provider context / list / model spec value`)
      delete p.modelContext[key]
    }
    if (Object.keys(p.modelContext).length === 0) delete p.modelContext // 不留空对象
  }

  // F-4 (IKCDMR) consultModels 软失败化——D-S1 范式（defaultModel 无效同族）：非法条目
  // 过滤不 throw（去 startup brick——无修复入口的硬崩消）；一次性启动警告内嵌修复指引
  // （引导清条目载体——保留 discoverability）；过滤记录挂 merged.agent.consultModelsFiltered
  // （数据层——consumer-ready——首帧 UI 消费点同 D-S1 promptProviderIfInvalid 属后续批）。
  // VSC loadAgentSettings 同规则（共享 config——双端锁步）。
  const cmClean = sanitizeConsultModels(merged.agent.consultModels, merged.providers.map((p) => p.name))
  warnConsultModelsFiltered(cmClean.dropped, path)
  merged.agent.consultModels = cmClean.keep
  if (cmClean.dropped.length) merged.agent.consultModelsFiltered = cmClean.dropped

  const smClean = sanitizeSubagentModel(merged.agent.subagentModel), smsClean = sanitizeSubagentModels(merged.agent.subagentModels) // #861（§6.7.1）：加载期清洗——非法形态不采纳 + 一次性警告（不 throw——同 F-4 范式）
  warnSubagentModelsFiltered([...smClean.dropped, ...smsClean.dropped], path)
  merged.agent.subagentModel = smClean.value
  merged.agent.subagentModels = smsClean.value

  // Backward compatibility: promote root-level config fields to agent sub-object
  if (config.verifyGuard !== undefined) {
    merged.agent.verifyGuard = config.verifyGuard
  }

  // Normalize baseURL trailing slash (prevents //chat/completions)
  for (const p of merged.providers) {
    if (p.baseURL) p.baseURL = p.baseURL.replace(/\/+$/, "")
  }

  // Normalize proxy: string → { uri, web:true }; object 补默认值；非法类型丢弃。
  // 保证 agent.config.proxy 永远是规范形态或 undefined
  merged.proxy = normalizeProxy(merged.proxy)

  // 团队登录段（B1 批——TEAM.md §2.1）：加载归一（形不符 ⇒ null——软失败不阻启动）；不入 DEFAULTS
  merged.team = normalizeTeamSection(merged.team)

  // Runtime provider = 统一解析（#841——resolveProviderPlan 单源：回退序 + 三态；PROVIDER.md §6.22）。
  // 不可运行（渠表空 ∥ 全表无 key）⇒ {} + providerInvalidReason（D-S1 处置不 throw——make-agent 打
  // _providerInvalid 标记 → TUI 首帧弹选择 / headless 报可读错误；同 2026-09-02 Q1 语义——不复用
  // findProvider throw 契约——findProvider 保留给 advisor/run.mjs 等直接调用方）。
  const plan = resolveProviderPlan({ providers: merged.providers, defaultModel: merged.defaultModel })
  merged.provider = plan.provider
  merged.providerState = plan.state // ok ∥ fallback ∥ invalid（三值闭集——KD-841-3 config 级）
  merged.providerStateReason = plan.reason // state≠ok 时非空（语义源；消费者按 state 出词——禁串嗅探）
  // providerInvalidReason 语义不变（provider 不完整时非空——装配校验 validateProvider 消费面照旧）
  merged.providerInvalidReason = merged.provider.name
    ? null
    : plan.reason ?? defaultModelReason(merged.providers, merged.defaultModel)

  // Compaction threshold 三档落值（CONTEXT-COMPACTION.md §6.17）：数值在场 = 显式（原样，不猜来源）；
  // 不在场 = auto——派生值只进 compactThresholdResolved，永不写 agent.compactThreshold、不落盘。
  const explicitThreshold = config.agent?.compactThreshold
  if (explicitThreshold != null) {
    merged.agent.compactThreshold = explicitThreshold
    merged.agent.compactThresholdResolved = explicitThreshold
    merged.agent.compactThresholdAuto = false
  } else {
    merged.agent.compactThreshold = undefined
    merged.agent.compactThresholdResolved = resolveCompactThreshold(null, merged.provider).value
    merged.agent.compactThresholdAuto = true
  }

  // Write back to merged for convenient access by upper layers
  // fetch 超时可配置（2026-09-01：agent.fetchTimeoutMs——provider/core.mjs effectiveFetchTimeoutMs 消费）
  merged.provider.fetchTimeoutMs = Number.isFinite(merged.agent?.fetchTimeoutMs) && merged.agent.fetchTimeoutMs > 0
    ? merged.agent.fetchTimeoutMs : undefined
  // body 阶段空闲超时同形提升（TIMEOUT-DIGEST.md §2.1 —— provider/core.mjs effectiveBodyIdleMs 消费）：
  // 非法 ∥ 缺省 ⇒ undefined ⇒ 回退 DEFAULT_BODY_IDLE_MS（不静默禁用保护）
  merged.provider.bodyIdleTimeoutMs = Number.isFinite(merged.agent?.bodyIdleTimeoutMs) && merged.agent.bodyIdleTimeoutMs > 0
    ? merged.agent.bodyIdleTimeoutMs : undefined
  merged.providersList = merged.providers
  promoteAgentViews(merged)  // agent.advisor → advisor promote for consistent access (decoupled copy)

  return merged
}

/**
 * MCP.md §5 D-3 (2026-09-01): re-read config.json and replace ONLY the agent's mcp section
 * — the agent 代配 closed loop (agent edits config.json with its edit tool, /mcp picks it
 * up). Never touches other config sections (providers/defaultModel stay as loaded).
 *
 * Malformed disk config → memory state kept, { ok:false, error } returned (the /mcp menu
 * shows "⚠ disk config unreadable"). Never throws.
 *
 * 对账 (reconciliation, MCP.md §5 D-3 / T23): returns which disk servers CHANGED
 * (fingerprint differs) or are DELETED from disk while still connected — fingerprint =
 * endpoint + token + headers/env key order. Existing connections are NOT torn down (an
 * in-use server must not be dropped): a deleted-but-connected server KEEPS its memory
 * entry (appended after the disk list) so the /mcp list can still show the row with the
 * "⚠ disk changed" mark. A server that is merely NEW on disk is not drift. persistRaw
 * write + reload is idempotent (fingerprints equal → no drift mark).
 *
 * @param path optional config path override (tests inject a tmp file; default configPath)
 */
export function reloadMcpFromDisk(agent, path) {
  const memoryServers = Array.isArray(agent.config?.mcp?.servers) ? agent.config.mcp.servers : []
  const fileExists = existsSync(path ?? configPath)
  const diskMcp = readMcpSection(path)
  if (!diskMcp.ok) return { ok: false, error: diskMcp.error, changedNames: [] }
  // Missing/deleted config file → keep whichever mcp servers the session had (never
  // silently drop user servers because the file vanished — same memory-keeps policy
  // as the malformed-disk fallback).
  let diskServers = diskMcp.servers
  if (diskServers.length === 0 && !fileExists) diskServers = memoryServers
  // Drift vs the RAW disk list: fingerprint-changed or deleted-from-disk (T23 ⚠ 标记依据)
  const diskNames = new Set(diskServers.filter((s) => s?.name).map((s) => s.name))
  const changedNames = diffMcpServers(memoryServers, diskServers)
  // Connected servers deleted from disk stay in the list (memory copy) — T23: the row
  // must remain visible (marked ⚠) and its live connection untouched. They are already
  // in changedNames (absent from disk), and stay flagged on every reload until the user
  // reconnects (re-persists them) or removes them — real drift, honestly reported.
  const connectedNames = new Set((agent.tools ?? []).filter((t) => t?._mcpName).map((t) => t._mcpName))
  const keptConnected = memoryServers.filter((s) => s?.name && connectedNames.has(s.name) && !diskNames.has(s.name))
  const finalServers = [...diskServers, ...keptConnected]
  agent.config ??= {}
  agent.config.mcp = { ...agent.config.mcp, servers: finalServers }
  return { ok: true, servers: finalServers, changedNames }
}

/** Disk read behind reloadMcpFromDisk — bounded, never throws. */
function readMcpSection(path = configPath) {
  try {
    if (!existsSync(path)) return { ok: true, servers: [] }
    const raw = JSON.parse(readFileSync(path, "utf8"))
    const servers = raw?.mcp?.servers
    // 非数组 = 畸形磁盘配置（2.3 代码正确性批）——ok:false 走调用方既有畸形回退（reloadMcpFromDisk 早退）
    if (servers !== undefined && !Array.isArray(servers)) return { ok: false, error: "mcp.servers must be an array" }
    return { ok: true, servers: Array.isArray(servers) ? servers : [] }
  } catch (error) {
    return { ok: false, error: error?.message ?? String(error) }
  }
}

/** Fingerprint = endpoint + token + headers/env entries in key order (JSON.stringify
 *  of a normalized subset — key order included, matching connectMcpServer's
 *  configFingerprint semantics: any change the connect layer would see counts).
 *  Drift = CHANGED (fingerprint differs) or DELETED (missing from disk) — a server
 *  that is new on disk is not drift (no live connection to protect). */
function diffMcpServers(memoryServers, diskServers) {
  const memFp = new Map(memoryServers.filter((s) => s?.name).map((s) => [s.name, mcpFingerprint(s)]))
  const diskFp = new Map(diskServers.filter((s) => s?.name).map((s) => [s.name, mcpFingerprint(s)]))
  const changed = []
  for (const [name, fp] of diskFp) if (memFp.has(name) && memFp.get(name) !== fp) changed.push(name)
  for (const name of memFp.keys()) if (!diskFp.has(name)) changed.push(name)
  return changed
}

function mcpFingerprint(s) {
  return JSON.stringify([
    s.wsUrl ?? s.url ?? s.command ?? null,
    s.args ?? null,
    s.token ?? null,
    s.headers ?? null,
    s.env ?? null,
  ])
}
