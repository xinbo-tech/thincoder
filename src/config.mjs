/**
 * config.mjs — configuration loading and saving
 * Multi-provider structure: providers[] + activeProvider
 * Config file: ~/.thincoder/config.json
 * API key can fall back to environment variables (when not configured in providers).
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export const configDir = join(homedir(), ".thincoder")
export const configPath = join(configDir, "config.json")

/** Built-in provider presets: shared by /provider add <preset> and first-run wizard */
export const PROVIDER_PRESETS = {
  deepseek: { baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 393216, desc: "DeepSeek" },
  kimi:     { baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi / Moonshot" },
  "kimi-code": { baseURL: "https://api.kimi.com/coding/v1", model: "k3", thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi For Coding (platform.kimi.com — sk-kimi- keys; NOT interchangeable with Moonshot)" },
  glm:      { baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 128000, desc: "Zhipu GLM" },
  "glm-code": { baseURL: "https://open.bigmodel.cn/api/coding/paas/v4", model: "glm-5.2", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 128000, desc: "Zhipu GLM Coding Plan (coding endpoint — same key as GLM; server-forced thinking)" },
  qwen:     { baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen3.7-max", reasoningEffort: "high", maxTokens: 131072, desc: "Qwen / Alibaba" },
  qwenplan: { baseURL: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", model: "qwen3.7-max", reasoningEffort: "high", maxTokens: 131072, desc: "Qwen Token Plan (百炼套餐)" },
  mimo:     { baseURL: "https://api.xiaomimimo.com/v1", model: "mimo-v2.5-pro", thinking: { type: "enabled" }, maxTokens: 131072, desc: "MiMo (Xiaomi)" },
  mimoplan: { baseURL: "https://token-plan-cn.xiaomimimo.com/v1", model: "mimo-v2.5-pro", thinking: { type: "enabled" }, maxTokens: 131072, desc: "MiMo Token Plan (小米套餐 — tp- keys; 与按量付费 sk- 密钥不通用)" },
  minimax:  { baseURL: "https://api.minimaxi.com/v1", model: "MiniMax-M3", thinking: { type: "adaptive" }, maxTokens: 128000, chatPath: "/text/chatcompletion_v2", desc: "MiniMax" },
  openai:   { baseURL: "https://api.openai.com/v1", model: "gpt-4o", desc: "OpenAI" },
  claude:   { baseURL: "https://api.anthropic.com/v1", model: "claude-sonnet-4", format: "anthropic", maxTokens: 8192, desc: "Claude (Anthropic)" },
  gemini:   { baseURL: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.5-flash", format: "google", maxTokens: 8192, desc: "Gemini (Google)" },
  grok:     { baseURL: "https://api.x.ai/v1", model: "grok-4.5", maxTokens: 65536, desc: "Grok (xAI)" },
  mistral:  { baseURL: "https://api.mistral.ai/v1", model: "mistral-large", maxTokens: 32768, desc: "Mistral" },
  volcengine: { baseURL: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-pro-32k", maxTokens: 32768, desc: "Volcengine Ark (豆包)" },
  hunyuan:  { baseURL: "https://api.hunyuan.cloud.tencent.com/v1", model: "hunyuan-pro", maxTokens: 32768, desc: "Hunyuan (腾讯混元)" },
  siliconflow: { baseURL: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3", maxTokens: 32768, desc: "SiliconFlow (硅基流动)" },
  openrouter: { baseURL: "https://openrouter.ai/api/v1", model: "anthropic/claude-sonnet-4", maxTokens: 32768, desc: "OpenRouter" },
  groq:     { baseURL: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", maxTokens: 32768, desc: "Groq" },
}

export const DEFAULTS = {
  activeModel: null,  // optional: override provider.model (set via /model picker or /model provider:model)
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
    engineering: false,   // strict methodology enforcement — read METHODOLOGY.md, design-before-code
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
    provider: "tavily",  // structured search API; empty apiKey → fall back to Bing HTML scraping
    apiKey: "",          // Tavily key (tvly-...) — optional
  },
  traces: {
    enabled: true,  // §18.6 D-TR6：完整轨迹存档开关——默认 on（"现阶段"=随会话生效——AGENT-LOOP.md §18.6）；关 = chat() 出口不落盘
  },
}

// Model capability table + spec lookup live in model-specs.mjs (2026-08-31
// extract — config.mjs had grown past the 300-line advisory). Re-exported here
// so the 23 existing importers keep their import paths.
import { specForModel, providerSpec } from "./model-specs.mjs"
export { specForModel, providerSpec }


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

export function loadConfig() {
  let config = {}
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, "utf8"))
    } catch (error) {
      throw new Error(`Config file is not valid JSON, check or delete it: ${configPath}\n  ${error.message}`, { cause: error })
    }
  }

  const merged = {
    ...DEFAULTS,
    ...config,
    providers: Array.isArray(config.providers)
      ? config.providers.map((p) => sanitizeProviderHeaders({ ...p }))
      : [],
    activeProvider: config.activeProvider ?? "",
    agent: { ...DEFAULTS.agent, ...config.agent },
    memory: { ...DEFAULTS.memory, ...config.memory },
    embedding: { ...DEFAULTS.embedding, ...config.embedding },
    traces: { ...DEFAULTS.traces, ...config.traces },
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

  // Consult/escalate pool validation (CLI parity with the plugin): up to 5 candidates.
  const cm = merged.agent.consultModels
  if (cm !== undefined && !Array.isArray(cm)) {
    throw new Error(`agent.consultModels must be an array of { provider, model } entries (got ${typeof cm})`)
  }
  if (Array.isArray(cm) && cm.length > 5) {
    throw new Error(`agent.consultModels supports at most 5 models (got ${cm.length})`)
  }
  if (Array.isArray(cm)) {
    // Fail fast at load: a pool entry whose provider doesn't exist in providers[] fails
    // every consult/escalate call at runtime with a quiet error string (eats a turn).
    const providerNames = merged.providers.map((p) => p.name)
    for (const entry of cm) {
      if (!entry || typeof entry !== "object" || typeof entry.provider !== "string" || typeof entry.model !== "string") {
        throw new Error(`agent.consultModels entries must be { provider: string, model: string } objects (got ${JSON.stringify(entry)})`)
      }
      if (!providerNames.includes(entry.provider)) {
        throw new Error(`agent.consultModels entry "${entry.provider}:${entry.model}" references unknown provider "${entry.provider}" (available: ${providerNames.join(", ") || "none"})`)
      }
    }
  }

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

  // Get the currently active provider
  // 2026-09-02 Q1（SESSION.md §8）：activeProvider 指向不存在的 provider 不再抛错——runtimeProvider
  // 置空对象，由 make-agent.mjs assembleAgent 后的校验打 `_providerInvalid` 标记 → TUI 引导重选 /
  // headless 报可读错误（原 findProvider throw 直接击穿 loadConfig → uncaughtException 退出）。
  // findProvider 的 throw 契约保留（advisor/run.mjs 等直接调用方仍依赖）。
  let active
  try {
    active = findProvider(merged.providers, merged.activeProvider)
  } catch {
    active = {}
  }

  // Build runtime provider object (for agent.provider usage)
  const runtimeProvider = { ...active }

  // activeModel overrides provider's default model (config only)
  if (merged.activeModel) runtimeProvider.model = merged.activeModel
  merged.activeModel = merged.activeModel || null  // normalize for agent.activeModel

  // Compaction threshold follows the model (provider-level context override honored — providerSpec)
  const explicitThreshold = config.agent?.compactThreshold
  const { value, auto } = resolveCompactThreshold(explicitThreshold, runtimeProvider)
  merged.agent.compactThreshold = value
  merged.agent.compactThresholdAuto = auto

  // Write back to merged for convenient access by upper layers
  merged.provider = runtimeProvider
  // fetch 超时可配置（2026-09-01：agent.fetchTimeoutMs——provider/core.mjs effectiveFetchTimeoutMs 消费）
  runtimeProvider.fetchTimeoutMs = Number.isFinite(merged.agent?.fetchTimeoutMs) && merged.agent.fetchTimeoutMs > 0
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
    if (servers !== undefined && !Array.isArray(servers)) return { ok: true, servers: [] }
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

/**
 * Save configuration. Preserves providers list structure and activeProvider pointer.
 * providers[i].apiKey is only written when explicitly passed in (does not overwrite env-var-fallback keys).
 */
export function saveConfig(config) {
  mkdirSync(configDir, { recursive: true })
  // 0600: config.json contains API keys, must not be world-readable (POSIX; chmod is best-effort on Windows)
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", { encoding: "utf8", mode: 0o600 })
  try { chmodSync(configPath, 0o600) } catch { /* may fail on Windows, ignore */ }
}
