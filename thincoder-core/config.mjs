/**
 * config.mjs — configuration loading and saving
 * Model-merge schema v2 (2026-09-10 MODEL-SELECTION): providers[] carry ONE default model
 * per channel (`providers[].model` — the new-install seed / empty-slot fallback); the
 * candidates list field models[] is gone — the available-model list is fetched from the
 * provider at runtime (`GET /models`, PROVIDER.md §16). config.defaultModel (top level,
 * "provider:model" composite) is the new-session starting point; activeProvider/activeModel
 * are gone from config (session slots keep their own double fields). Legacy fields migrate
 * on load (write-back failure never blocks startup).
 * Config file: ~/.thincoder/config.json
 * API key comes from providers[].apiKey only — environment variables are not a key source.
 */

import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { parseModelRef, resolveRuntimeProvider, defaultModelReason } from "./model-ref.mjs"
// 老形态迁移核（M7 v2——纯函数零依赖——本文件超 500 行硬限拆分，VSC 同构文件）
import { migrateLegacyModelFields } from "./config-migrate.mjs"
import { expandHome } from "./expand-home.mjs"
// 核内单一读写面 + 预设表（§2.5 #129 / #131——拆档以容纳 500 行硬限）
import {
  PROVIDER_PRESETS, presetToEntry, configDir, configPath, _setConfigPathForTest, _resetConfigPathForTest,
  _configPath, writeConfigAtomic,
} from "./config-io.mjs"

export { parseModelRef, resolveRuntimeProvider, defaultModelReason, migrateLegacyModelFields }
export { PROVIDER_PRESETS, presetToEntry, configDir, configPath, _setConfigPathForTest, _resetConfigPathForTest }
// 核内单一写盘执行体（已迁 `config-io.mjs`）——本档 re-export 保持既有导入面（§2.5 #131）。
export { writeConfigAtomic }

function cfgPath() { return _configPath() }

export const DEFAULTS = {
  defaultModel: null, // top-level "provider:model" composite — new-session starting point (F-1)
  agent: {
    maxTurns: 200,
    subagentTurns: 100,
    subagentModel: null,  // default subagent model: "provider:model" | provider name | model name (parent provider); null = inherit parent provider
    subagentModels: {},   // per-type override: { explore, plan, coder, "eng-coder" } — priority: subagent tool model arg > this[role] > subagentModel > parent provider
    goalTurns: 200,
    compactThreshold: 100000,
    verifyGuard: false,  // push model back to verify when files were mutated but verify not run (opt-in)
    // Multi-model consultation ("会诊") + escalate ("飞刀") — CLI parity with the VS Code plugin.
    // consultModels: candidate pool for BOTH consult and escalate ({ provider, model, effort? }, up to 5).
    consultModels: [],
    consultTurns: 40,      // per-consultant tool-turn budget (diagnosis tasks)
    consultTimeoutMs: 600000, // wall-clock ceiling per consultant (10min)
    streamRules: [],      // time-traveling stream rules: [{ pattern: "regex", message: "reminder", action: "abort"|"warn", repeat: "always"|"once" }]
    advisor: { guard: false },  // code review is always available; guard: true pushes completion back until reviewed (opt-in). Also accepts provider/model/thinking/reasoningEffort/timeoutMs overrides. Deprecated: enabled (2026-08-21)
    autoThink: false,     // auto-classify task difficulty and set reasoning effort per-turn
    engineering: false,   // strict methodology enforcement — design-before-code (design review + user approval before code)
    // Async pool limits (AGENT-LOOP-ASYNC-POOL.md §6.10 D-24a/R14 + R13 — POOL-CONFIG-
    // UNIFIED 2026-09-09): { engCoder, other, advisor } — eng-coder pool / other-role
    // pool / advisor-review pool, defaults 4/4/4 (user ruling "eng-coder 四路，其他
    // 4 路" + advisor 评审池并入同一可配体系——三池统一默认 4)。engCoder/other
    // runtime-validated at every subagent pool admission (subagent-async
    // resolvePoolLimits); advisor runtime-validated at every advisor launch
    // (advisor-async advisorPoolLimitFor——F-2——两域读取器独立不共享)——非法/缺省
    // 回退 4——settings tool 与 /config 并发池菜单写此键——变更下个 spawn/launch 生效。
    // ⚠ 与 subagent-async.mjs ASYNC_POOL_LIMITS（两键）/advisor-async.mjs
    // ADVISOR_POOL_LIMIT 逐键同值（运行时回退常量）——耦合锚 T-24a4 断言锁住——
    // 勿单侧改默认。
    poolLimits: { engCoder: 4, other: 4, advisor: 4 },
  },
  memory: {
    dbPath: join(configDir, "memory.db"),
    projectDir: ".thincoder/memory",
    team: null,
  },
  shell: null,            // bash tool shell executable (e.g. "C:\\Program Files\\Git\\bin\\bash.exe" or "pwsh"); null = system default (cmd on Windows, /bin/sh elsewhere)
  embedding: {
    baseURL: "https://api.siliconflow.cn/v1",
    model: "BAAI/bge-m3",
  },
  mcp: {
    servers: [],
  },
  websearch: {
    // Structured search via Tavily when a key is set — empty apiKey → Bing RSS/HTML fallback (zero-config).
    apiKey: "",          // Tavily key (tvly-...) — optional
  },
  traces: {
    enabled: false,  // §18.6 D-TR6 修订（2026-09-05 用户裁定——发布隐私："不希望用户那边也采集"）：轨迹存档默认 OFF——新用户零采集；本地调试分析可显式开（~/.thincoder/config.json traces.enabled:true）
    retentionHours: 24, // D-TR10：轨迹文件保留小时数——CLI 启动时删除超过该时长的文件（默认 24h）
  },
}

// Model capability table + spec lookup live in model-specs.mjs (2026-08-31
// extract — config.mjs had grown past the 300-line advisory). Re-exported here
// so the 23 existing importers keep their import paths.
import { specForModel, providerSpec, specMatch, assistantToolCallMessage } from "./model-specs.mjs"
export { specForModel, providerSpec, specMatch, assistantToolCallMessage }


// Window utilization threshold: compacts at 60% context, reserving 40% headroom
// for injected context (directory tree, git context, outline, project instructions,
// memory/doc search results) which can consume 30-50K tokens each turn.
const COMPACT_RATIO = 0.6

/** Derive compaction threshold; explicit is the value explicitly set in config file (takes priority), otherwise auto-computed from model.
 *  Second param accepts EITHER a model name string (pure spec lookup — legacy caller:
 *  first-run wizard) OR a provider object (providerSpec — the providers[].context
 *  override in K units is honored, PROVIDER.md §15 T-C2). */
export function resolveCompactThreshold(explicit, modelOrProvider) {
  if (explicit != null) return { value: explicit, auto: false }
  const provider = typeof modelOrProvider === "string" ? { model: modelOrProvider } : (modelOrProvider ?? {})
  const spec = providerSpec(provider)
  const value = Math.floor(spec.context * COMPACT_RATIO)
  return { value, auto: true }
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
 * a forward-compatible fallback). Keep the body byte-aligned with thincoder-vscode config.mjs
 * (cross-repo parity test compares them).
 */
export function resolveEnableThinking(provider, spec) {
  const model = (provider?.model ?? spec?.model ?? "").toLowerCase()
  if (!model.startsWith("qwen") || model.startsWith("qwen3-coder")) return undefined
  if (!isBailianHost(provider?.baseURL)) return undefined
  if (provider.thinking === null) return false
  if (provider.reasoningEffort) return true
  return undefined
}

/** Module-level one-time warn dedupe for invalid providers[].context (PROVIDER.md §15 D-C1). */
const warnedContextProviders = new Set()

/** F-4 (IKCDMR) 软失败清洗（D-S1 范式——loadConfig 是 CLI 启动砖点）：consultModels 非法
 *  条目过滤不 throw——非数组 → []、形状非法/未知渠道丢弃、超 5 截断（keep 前 5）。
 *  返回 { keep, dropped }——dropped 供一次性警告；merged.agent.consultModelsFiltered 挂载
 *  供后续首帧引导消费（数据层——本批文件面无消费方——同 providerInvalidReason 载体先例）。 */
function sanitizeConsultModels(cm, providerNames) {
  if (cm === undefined || cm === null) return { keep: [], dropped: [] }
  if (!Array.isArray(cm)) {
    return { keep: [], dropped: [`agent.consultModels must be an array of { provider, model } entries (got ${typeof cm})`] }
  }
  const names = new Set(providerNames)
  const keep = []
  const dropped = []
  for (const entry of cm) {
    if (keep.length >= 5) { dropped.push(`over the 5-entry cap — dropped ${JSON.stringify(entry)}`); continue }
    if (!entry || typeof entry !== "object" || typeof entry.provider !== "string" || !entry.provider.trim()
        || typeof entry.model !== "string" || !entry.model.trim()) {
      dropped.push(`invalid entry (expected { provider: string, model: string }) — got ${JSON.stringify(entry)}`)
      continue
    }
    if (!names.has(entry.provider)) {
      dropped.push(`entry "${entry.provider}:${entry.model}" references unknown provider "${entry.provider}" (available: ${[...names].join(", ") || "none"})`)
      continue
    }
    keep.push(entry)
  }
  return { keep, dropped }
}

/** F-4：过滤警告——进程级一次性（loadConfig 同进程可多次调用：TUI 启动 + reloadConfig）。 */
let warnedConsultModels = false
function warnConsultModelsFiltered(dropped, path) {
  if (warnedConsultModels || dropped.length === 0) return
  warnedConsultModels = true
  console.warn(`[config] agent.consultModels: ${dropped.length} invalid entr${dropped.length === 1 ? "y ignored" : "ies ignored"} (filtered — startup continues; no crash):\n` +
    dropped.map((d) => `  - ${d}`).join("\n") +
    `\n  Fix: clean agent.consultModels in ${path} or use /config → consult/escalate pool menu.`)
}

/**
 * Find provider by name in providers[].
 * Throws if name is non-empty but not found — a typo in activeProvider silently falling to the first provider would use the wrong key on the wrong endpoint.
 * Returns the first provider when name is empty.
 */
export function findProvider(providers, name) {
  if (name) {
    const found = providers.find((p) => p.name === name)
    if (found) return found
    const available = providers.map((p) => p.name).join(", ") || "(empty)"
    throw new Error(`activeProvider "${name}" not in providers list (available: ${available}); check for a typo in: ${configPath}`)
  }
  return providers[0] ?? { name: "default", baseURL: "", model: "" }
}

/** Normalize proxy config to { uri, web, model } or undefined (uri/url both accepted; invalid types dropped) */
export function normalizeProxy(proxy) {
  if (typeof proxy === "string") return proxy ? { uri: proxy, web: true, model: false } : undefined
  if (!proxy || typeof proxy !== "object" || Array.isArray(proxy)) return undefined
  const uri = proxy.uri || proxy.url || ""
  if (typeof uri !== "string" || !uri) return undefined
  return { uri, web: proxy.web !== false, model: proxy.model === true }
}

/**
 * Load configuration.
 * No env-var overrides — config.json is the single source of truth
 * (API keys, baseURL, model, activeProvider all come from the file).
 */
/** Keep only { header: "string value" } pairs from a provider's headers field — anything
 *  else (null, arrays, nested objects) is dropped so it can never reach a fetch call.
 *  Authorization is built-in and cannot be overridden from headers (core.mjs spreads first). */
function sanitizeProviderHeaders(p) {
  if (p.headers == null || typeof p.headers !== "object" || Array.isArray(p.headers)) { delete p.headers; return p }
  const clean = {}
  for (const [k, v] of Object.entries(p.headers)) {
    if (typeof v === "string" && k.toLowerCase() !== "authorization") clean[k] = v
  }
  if (Object.keys(clean).length > 0) p.headers = clean
  else delete p.headers
  return p
}

/** loadConfig 内联迁移核已迁 config-migrate.mjs（500 行硬限拆分——VSC 同构）——
 *  migrateLegacyModelFields 纯函数 + 本文件 import/写回编排（折中 C 见其头注释）。 */
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
    traces: { ...DEFAULTS.traces, ...config.traces },
  }

  // 家目录展开（第 29 批）：config 路径字段单一规范化点——只读归一（磁盘原文保留）
  merged.memory.dbPath = expandHome(merged.memory.dbPath)
  merged.memory.projectDir = expandHome(merged.memory.projectDir)
  const team = merged.memory.team
  if (team && typeof team === "object" && !Array.isArray(team) && team.dir !== undefined) {
    merged.memory.team = { ...team, dir: expandHome(team.dir) }   // 无 dir 键不注入（零键面变化）
  }
  merged.shell = expandHome(merged.shell)

  // providers[].model 内存归一（v2 M3：非空字符串保留；非字符串/空串归一删除）——渠道默认模型
  // 单值；无默认模型合法（模型选择经 /models 拉取候选——准入判据见 M8/M9）。
  for (const p of merged.providers) {
    if (typeof p.model === "string" && p.model.trim()) continue
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

  // F-4 (IKCDMR) consultModels 软失败化——D-S1 范式（defaultModel 无效同族）：非法条目
  // 过滤不 throw（去 startup brick——无修复入口的硬崩消）；一次性启动警告内嵌修复指引
  // （引导清条目载体——保留 discoverability）；过滤记录挂 merged.agent.consultModelsFiltered
  // （数据层——consumer-ready——首帧 UI 消费点同 D-S1 promptProviderIfInvalid 属后续批）。
  // VSC loadAgentSettings 同规则（共享 config——双端锁步）。
  const cmClean = sanitizeConsultModels(merged.agent.consultModels, merged.providers.map((p) => p.name))
  warnConsultModelsFiltered(cmClean.dropped, path)
  merged.agent.consultModels = cmClean.keep
  if (cmClean.dropped.length) merged.agent.consultModelsFiltered = cmClean.dropped

  // Backward compatibility: promote root-level config fields to agent sub-object
  if (config.verifyGuard !== undefined) {
    merged.agent.verifyGuard = config.verifyGuard
  }

  // Normalize baseURL trailing slash (prevents //chat/completions)
  for (const p of merged.providers) {
    if (p.baseURL) p.baseURL = p.baseURL.replace(/\/+$/, "")
  }

  // Normalize proxy: string → { uri, web:true, model:false }; object 补默认值；非法类型丢弃。
  // 保证 agent.config.proxy 永远是规范形态或 undefined
  merged.proxy = normalizeProxy(merged.proxy)

  // Runtime provider = config.defaultModel 复合解析（F-2——resolveRuntimeProvider）。
  // 无效/未设 → {} + providerInvalidReason（D-S1 处置不 throw——make-agent 打 _providerInvalid
  // 标记 → TUI 首帧弹选择 / headless 报可读错误；同 2026-09-02 Q1 语义——不复用 findProvider
  // throw 契约——findProvider 保留给 advisor/run.mjs 等直接调用方）。
  merged.provider = resolveRuntimeProvider(merged.providers, merged.defaultModel)
  merged.providerInvalidReason = merged.provider.name
    ? null
    : defaultModelReason(merged.providers, merged.defaultModel)

  // Compaction threshold follows the model (provider-level context override honored — providerSpec)
  const explicitThreshold = config.agent?.compactThreshold
  const { value, auto } = resolveCompactThreshold(explicitThreshold, merged.provider)
  merged.agent.compactThreshold = value
  merged.agent.compactThresholdAuto = auto

  // Write back to merged for convenient access by upper layers
  // fetch 超时可配置（2026-09-01：agent.fetchTimeoutMs——provider/core.mjs effectiveFetchTimeoutMs 消费）
  merged.provider.fetchTimeoutMs = Number.isFinite(merged.agent?.fetchTimeoutMs) && merged.agent.fetchTimeoutMs > 0
    ? merged.agent.fetchTimeoutMs : undefined
  merged.providersList = merged.providers
  merged.advisor = { ...merged.agent.advisor }  // promote for consistent access (decoupled copy)

  return merged
}

/**
 * MCP.md §5 D-3 (2026-09-01): re-read config.json and replace ONLY the agent's mcp section
 * — the agent 代配 closed loop (agent edits config.json with its edit tool, /mcp picks it
 * up). Never touches other config sections (providers/activeProvider stay as loaded).
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
