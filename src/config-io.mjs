/**
 * config-io.mjs — shared config file I/O (VS Code side)
 * Same file, same structure, same semantics as the CLI (`thincoder/src/config.mjs`):
 * providers[] + activeProvider (+ optional activeModel runtime override), apiKey per
 * provider with env-var fallback.
 *
 * Pure Node — no `vscode` import — so unit tests can run outside the extension host.
 * Split for the 500-line limit: preset table → config-presets.mjs (zero deps),
 * legacy migration core → config-migrate.mjs, MCP servers → config-mcp.mjs.
 * All three are re-exported here so existing `from "../config-io.mjs"` import sites
 * keep working.
 * The VS Code-specific one-time migration glue lives in extension/migrate-settings.mjs.
 */

import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { PROVIDER_PRESETS, presetToEntry } from "./config-presets.mjs"
import { migrateCore } from "./config-migrate.mjs"

export { PROVIDER_PRESETS, presetToEntry, migrateCore }

export const configDir = join(homedir(), ".thincoder")
export const configPath = join(configDir, "config.json")

/** Test seam: override the config file location (used by unit tests to sandbox I/O). */
let _pathOverride = null
export function _setConfigPathForTest(p) { _pathOverride = p }
export function _configPath() { return _pathOverride ?? configPath }

// ─── Raw read / write (CLI persistRaw / saveConfig semantics) ───
// R10 F5b（MULTI-INSTANCE-COLLAB.md D-F5b）：loadRaw 读盘时按路径记 stat 元组
// （mtimeMs + size 双键——同 tick 快写 mtime 实测可同，size 兜底）作链基线；saveRaw
// 写前重 stat 不符 → 放弃 {ok:false, reason:"mtime-conflict"} + .bak-{ts} 轮转保现场
// （副本——磁盘保留他端内容；调用方提示重试——决策① A 不自动合并）。
const readMtimes = new Map() // path → { mtimeMs, size } | null（缺失）

/** F5b 冲突提示文案（D-F5b 同型——调用方展示/抛出） */
export const CONFIG_CONFLICT_HINT = "config changed on disk concurrently — retry"

function statTupleOf(path) {
  try {
    const s = statSync(path)
    return { mtimeMs: s.mtimeMs, size: s.size }
  } catch { return null }
}

/** Read the raw config object ({} when missing). Throws on invalid JSON — same as CLI loadConfig. */
export function loadRaw() {
  const path = _configPath()
  if (!existsSync(path)) { readMtimes.set(path, null); return {} }
  readMtimes.set(path, statTupleOf(path)) // stat-then-read 记基线（失败方向安全——防漏判）
  let raw
  try {
    raw = JSON.parse(readFileSync(path, "utf8"))
  } catch (error) {
    throw new Error(`Config file is not valid JSON, check or delete it: ${path}\n  ${error.message}`, { cause: error })
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return raw
}

/** Write the raw config object ($schema + 0600 + trailing newline). F5b 门控：磁盘与本链
 *  读盘基线不符（他端改过/读时缺失现已存在）→ 放弃 + 冲突枚举 + .bak 轮转；读时在→现已
 *  缺失 = 他端显式删除 → 写回重建不算覆盖。无并发照常写（undefined——调用方零变化）。 */
export function saveRaw(raw) {
  const path = _configPath()
  mkdirSync(dirname(path), { recursive: true })
  if (readMtimes.has(path)) {
    const t0 = readMtimes.get(path)
    const now = statTupleOf(path)
    const same = (t0 === null && now === null) || (t0 !== null && now !== null && t0.mtimeMs === now.mtimeMs && t0.size === now.size)
    if (!same && !(t0 !== null && now === null)) {
      try { if (now !== null) copyFileSync(path, `${path}.bak-${Date.now()}`) } catch { /* best-effort 轮转 */ }
      return { ok: false, reason: "mtime-conflict" }
    }
  }
  raw.$schema = "https://thincoder.dev/schemas/config.json"
  writeFileSync(path, JSON.stringify(raw, null, 2) + "\n", { encoding: "utf8", mode: 0o600 })
  try { chmodSync(path, 0o600) } catch { /* best-effort on Windows */ }
  readMtimes.set(path, statTupleOf(path)) // 自写后刷新基线（防自写误判）
}

/** Read → mutate → write（CLI tui persistRaw 镜像）。saveRaw 结果透传（冲突 → 提示）。 */
export function persistRaw(mutate) {
  const raw = loadRaw()
  mutate(raw)
  return saveRaw(raw)
}

/** 冲突判定收口：persistRaw 结果 → CONFIG_CONFLICT_HINT（同型提示串）或 null。 */
export function conflictError(result) {
  return result?.reason === "mtime-conflict" ? CONFIG_CONFLICT_HINT : null
}

// ─── Providers resolution (CLI loadConfig subset) ───

/**
 * Find provider by name. Throws when the name is set but missing — a typo in activeProvider
 * silently falling to the first provider would use the wrong key on the wrong endpoint (CLI parity).
 */
export function findProvider(providers, name) {
  if (name) {
    const found = providers.find((p) => p.name === name)
    if (found) return found
    const available = providers.map((p) => p.name).join(", ") || "(empty)"
    throw new Error(`activeProvider "${name}" not in providers list (available: ${available}); check ${configPath}`)
  }
  return providers[0]
}

/** Normalize proxy config to { uri, web, model } or undefined — same as CLI normalizeProxy. */
export function normalizeProxy(proxy) {
  if (typeof proxy === "string") return proxy ? { uri: proxy, web: true, model: false } : undefined
  if (!proxy || typeof proxy !== "object" || Array.isArray(proxy)) return undefined
  const uri = proxy.uri || proxy.url || ""
  if (typeof uri !== "string" || !uri) return undefined
  return { uri, web: proxy.web !== false, model: proxy.model === true }
}

/** Warn once per provider name on an invalid providers[].context (PROVIDER.md §15 D-C1). */
const warnedContext = new Set()

/**
 * Resolve providers list + active name from disk. BaseURL trailing slashes normalized.
 * Returns { providers, activeProvider }. No env-var overrides — config.json is the
 * single source of truth. An empty/missing providers[] resolves to an EMPTY list
 * (no synthetic preset entries): the onboarding UI (welcome panel) is the path from
 * "nothing configured" to a setup.
 */
export function resolveProviders() {
  const raw = loadRaw()
  const providers = Array.isArray(raw.providers)
    ? raw.providers.filter((p) => p && typeof p === "object" && p.name)
    : []
  for (const p of providers) {
    if (typeof p.baseURL === "string") p.baseURL = p.baseURL.replace(/\/+$/, "")
    // PROVIDER.md §15 D-C1: providers[].context must be a positive integer (K units).
    // Invalid (0/negative/non-integer/non-numeric) → ignored (spec value used) +
    // warned ONCE per provider name (loadConfig-equivalent validation).
    if (p.context != null) {
      const n = Number(p.context)
      if (!Number.isInteger(n) || n <= 0) {
        if (!warnedContext.has(p.name)) {
          warnedContext.add(p.name)
          console.warn(`[config] provider "${p.name}" has invalid context ${JSON.stringify(p.context)} — ignored (expected a positive integer in K units, e.g. 128 = 128K); using the model spec value.`)
        }
        delete p.context
      }
    }
  }
  const activeProvider = raw.activeProvider || providers[0]?.name
  return { providers, activeProvider }
}

/**
 * API key for a provider entry — config.json only. Env vars are NOT a key source
 * (users configure keys in the settings panel / config file, never in the environment).
 */
export function resolveKey(entry) {
  return entry?.apiKey?.trim() || null
}

/**
 * Runtime model — config only: config.activeModel overrides provider.model.
 * (No env-var overrides — configuration comes exclusively from config.json.)
 */
export function resolveModel(entry, rawActiveModel) {
  return rawActiveModel || entry.model
}

/**
 * Build the runtime provider object for LLM calls from config.json.
 * null when the provider has no resolvable API key. Throws on unknown name (findProvider parity).
 */
export function providerFromConfig(name) {
  const { providers, activeProvider } = resolveProviders()
  const target = name ? findProvider(providers, name) : findProvider(providers, activeProvider)
  if (!target) return null
  const apiKey = resolveKey(target)
  if (!apiKey) return null
  const raw = loadRaw()
  const provider = {
    ...target,
    apiKey,
    model: resolveModel(target, raw.activeModel),
  }
  if (provider.baseURL) provider.baseURL = provider.baseURL.replace(/\/+$/, "")

  // Proxy: per-provider `proxy: true` AND global config.proxy.model === true (CLI injectProxy parity).
  // Default model requests go direct — proxy.model is opt-in.
  const proxyCfg = normalizeProxy(raw.proxy)
  if (target.proxy === true && proxyCfg?.uri && proxyCfg.model === true) {
    provider.proxyUri = proxyCfg.uri
  }
  return provider
}

/** Set a provider's key in config.json (CLI setProviderKey semantics — whole providers[] rewritten).
 *  F5b：冲突时返回 CONFIG_CONFLICT_HINT（调用方提示重试）；成功 null。 */
export function setProviderKey(name, key) {
  const r = persistRaw((raw) => {
    raw.providers = Array.isArray(raw.providers) ? raw.providers : []
    const entry = raw.providers.find((p) => p?.name === name)
    if (entry) entry.apiKey = key
  })
  return conflictError(r)
}

/** Remove a provider's key (keep the provider entry). F5b 冲突提示同 setProviderKey。 */
export function removeProviderKeyFromConfig(name) {
  const r = persistRaw((raw) => {
    const entry = Array.isArray(raw.providers) ? raw.providers.find((p) => p?.name === name) : null
    if (entry) delete entry.apiKey
  })
  return conflictError(r)
}

/** Persist a model selection (CLI selectModel semantics): provider.model becomes the selected
 *  model; activeModel records the override only when it differs from the provider default
 *  (null → omit, so the CLI resume sees the same pointer). F5b 冲突提示同 setProviderKey。 */
export function selectProviderModel(name, model) {
  const r = persistRaw((raw) => {
    raw.providers = Array.isArray(raw.providers) ? raw.providers : []
    const entry = raw.providers.find((p) => p?.name === name)
    if (!entry) return
    // CLI selectModel: activeModel records the override only when it differs from the
    // provider default. Compare BEFORE overwriting entry.model.
    raw.activeModel = model !== entry.model ? model : null
    if (raw.activeModel == null) delete raw.activeModel
    entry.model = model
    raw.activeProvider = name
  })
  return conflictError(r)
}

/** List provider names present in config.json ([] when none). */
export function providerNamesInConfig() {
  try {
    return resolveProviders().providers.map((p) => p.name)
  } catch {
    return []
  }
}

/**
 * Agent runtime settings defaults — SINGLE source for VS Code (2026-09-05 — SETTINGS-TOOL
 * 方案 A：收拢内联默认——对齐 CLI config.mjs DEFAULTS.agent 键集/类型——防双端漂移
 * （settings 工具类型校验表从此自动派生；加键 = CLI DEFAULTS + 本对象各一处）。
 * compactThreshold null = auto（panel 空串清除键 → 读取侧 null → 消费方 auto 推断——
 * 与 CLI 的 compactThresholdAuto 标志等价语义）；autoThink CLI parity（VS Code 面板不管理——
 * settings 工具可跨端调）；engineering VS Code 侧工程模式标志。
 */
export const AGENT_DEFAULTS = {
  maxTurns: 200,
  subagentTurns: 100,
  subagentModel: null, // string | null（默认子代理模型 override——CLI parity）
  subagentModels: {}, // per-role overrides: explore/plan/coder/eng-coder（CLI parity）
  compactThreshold: null, // null = auto（从 model context）
  verifyGuard: false,
  autoThink: false, // CLI parity（CLI DEFAULTS.agent.autoThink——回合自动思考开关）
  engineering: false, // engineering mode flag（VS Code: config-level；eng tool 持久化于此）
  consultTurns: 40,
  consultTimeoutMs: 600000,
  advisor: { guard: false }, // timeoutMs 面板直传；运行默认 600_000（advisor/run.mjs）
  consultModels: [], // {provider, model, effort?}[]——≤5
  // §11.1/§11.2（R14/R13——2026-09-06 + POOL-CONFIG-UNIFIED 2026-09-09）：async 池按
  // 角色域容量——agent.poolLimits = { engCoder, other, advisor }——默认 4/4/4（eng-coder
  // 四路/其他四路 + advisor 评审池并入同一可配体系——三池统一默认）；subagent 两键每次
  // 入池判定时读（scheduler.effectivePoolLimits——非法回退默认 4）；advisor 键由
  // advisor-async 独立读取器消费（与 ADVISOR_POOL_LIMIT 同值——耦合锁 config-pool.test.mjs）。
  poolLimits: { engCoder: 4, other: 4, advisor: 4 },
}

/** Trace 段默认（对齐 CLI DEFAULTS.traces——2026-09-05 隐私裁定 enabled:false——
 *  发布默认关——新用户零采集——本地调试可显式开）——类型派生用（settings 工具类型表
 *  自 TRACES_DEFAULTS 派生）+ 运行读取默认（loadTracesSettings——trace-store 门/清理）
 *  ——VSC 端消费键与 CLI 相同（共享 config.json 不双端漂移） */
export const TRACES_DEFAULTS = {
  enabled: false,
  retentionHours: 24,
}

/** Trace 段运行读取（TRACE-STORE-VSC——config.traces 可配点）：raw.traces 合并
 *  TRACES_DEFAULTS（config 缺失/不可读 → 默认 enabled=false/retentionHours=24——
 *  CLI loadConfig 的 DEFAULTS 合并同语义）。供 chat 调用点算 logCtx.traces 开关与
 *  trace-store per-write prune 的保留期。 */
export function loadTracesSettings() {
  let t = null
  try { t = loadRaw().traces } catch { /* config 不可读 → 默认 */ }
  return {
    enabled: t?.enabled ?? TRACES_DEFAULTS.enabled,
    retentionHours: t?.retentionHours ?? TRACES_DEFAULTS.retentionHours,
  }
}

/** Agent runtime settings from config.json（默认值单一来源 AGENT_DEFAULTS——2026-09-05） */
export function loadAgentSettings() {
  const a = loadRaw().agent
  const d = AGENT_DEFAULTS
  return {
    maxTurns: a?.maxTurns ?? d.maxTurns,
    subagentTurns: a?.subagentTurns ?? d.subagentTurns,
    subagentModel: a?.subagentModel ?? d.subagentModel, // default subagent model override (CLI parity)
    subagentModels: a?.subagentModels ?? d.subagentModels, // per-type overrides: explore/plan/coder/eng-coder (CLI parity)
    compactThreshold: a?.compactThreshold ?? d.compactThreshold, // null = auto (from model context)
    verifyGuard: a?.verifyGuard ?? d.verifyGuard,
    autoThink: a?.autoThink ?? d.autoThink, // CLI parity（VS Code 面板不管理——CLI 回合读取）
    engineering: a?.engineering ?? d.engineering, // engineering mode flag (VS Code: config-level; the eng tool persists here)
    consultTurns: a?.consultTurns ?? d.consultTurns, // consultation turn budget (was 100, then 15 was too tight)
    consultTimeoutMs: a?.consultTimeoutMs ?? d.consultTimeoutMs, // wall-clock watchdog per consultant (10 min)
    advisor: a?.advisor ?? d.advisor, // timeoutMs passes through panel saves; runtime default 600_000 (advisor/run.mjs)
    consultModels: Array.isArray(a?.consultModels) ? a.consultModels : d.consultModels,
    poolLimits: a?.poolLimits ?? d.poolLimits, // §11.1/§11.2: async pool limits per role domain（校验在运行期读点——advisor 键面板显示/回退）
  }
}

/** Persist agent.* settings (merge; undefined/empty deletes the key — compactThreshold '' = auto).
 *  Empty subagentModels object deletes the whole key. F5b 冲突提示同 setProviderKey。 */
export function saveAgentSettings(patch) {
  const r = persistRaw((raw) => {
    raw.agent = raw.agent && typeof raw.agent === "object" ? raw.agent : {}
    for (const [k, v] of Object.entries(patch ?? {})) {
      if (v === undefined || v === null || v === "") delete raw.agent[k]
      else if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) delete raw.agent[k]
      else raw.agent[k] = v
    }
  })
  return conflictError(r)
}

/** Panel persistence: build the agent.* patch from a webview payload (CLI-parity field names).
 *  Single write channel — all fields (incl. advisor) go through one saveAgentSettings(patch);
 *  an early return for advisor would silently discard non-advisor fields (reported bug).
 *  Pure function of payload + current config; lives here (no vscode dependency) so it is testable. */
export function saveAgentSettingsFromPanel(payload) {
  const patch = {}
  if (payload.maxTurns != null) patch.maxTurns = Number(payload.maxTurns) || undefined
  if (payload.subagentTurns != null) patch.subagentTurns = Number(payload.subagentTurns) || undefined
  // "in payload" guards let explicit undefined (cleared field) flow through as deletion
  if ("subagentModel" in payload) patch.subagentModel = payload.subagentModel || undefined
  if ("subagentModels" in payload) {
    // Per-type overrides: only non-empty values kept; empty object deletes the whole key
    const m = {}
    for (const [role, v] of Object.entries(payload.subagentModels ?? {})) {
      if (v && typeof v === "string" && v.trim()) m[role] = v.trim()
    }
    patch.subagentModels = Object.keys(m).length > 0 ? m : undefined
  }
  if (payload.compactThreshold !== undefined) patch.compactThreshold = payload.compactThreshold === "" ? undefined : (Number(payload.compactThreshold) || undefined)
  if (payload.verifyGuard !== undefined) patch.verifyGuard = !!payload.verifyGuard
  if (payload.engineering !== undefined) patch.engineering = !!payload.engineering
  if (payload.consultTurns != null) patch.consultTurns = Number(payload.consultTurns) || undefined
  if (payload.consultTimeoutMs != null) patch.consultTimeoutMs = Number(payload.consultTimeoutMs) || undefined
  // Consultation models (CONSULTATION.md): array of {provider, model}, ≤5, validated.
  if (payload.consultModels !== undefined) {
    const arr = Array.isArray(payload.consultModels) ? payload.consultModels : []
    const clean = arr
      .filter((m) => m && typeof m.provider === "string" && m.provider.trim() && typeof m.model === "string" && m.model.trim())
      .slice(0, 5)
      .map((m) => ({
        provider: m.provider.trim(),
        model: m.model.trim(),
        ...(typeof m.effort === "string" && m.effort.trim() ? { effort: m.effort.trim() } : { effort: null }),
      }))
    patch.consultModels = clean.length > 0 ? clean : undefined
  }
  // §11.1/§11.2（R14/R13——POOL-CONFIG-UNIFIED 2026-09-09）：并发池三域容量（面板写
  // 同一键）。逐键正整数 ≥1；非法键丢弃（空对象/全非法 → 删整键——运行期回退默认
  // 4/4/4 + 文案）。
  if ("poolLimits" in payload) {
    const pl = {}
    for (const key of ["engCoder", "other", "advisor"]) {
      const v = payload.poolLimits?.[key]
      if (Number.isInteger(v) && v >= 1) pl[key] = v
    }
    patch.poolLimits = Object.keys(pl).length > 0 ? pl : undefined
  }
  if (payload.advisor !== undefined) {
    // Merge semantics (GitHub #3, 2026-08-29): the panel payload only carries the fields
    // the panel owns. A MISSING key backfills from config.json — the CLI may have written
    // advisor.provider/model/thinking/reasoningEffort that must survive a panel save
    // (the old "in"-guard merge treated a missing key as "don't merge", so
    // saveAgentSettings replaced the whole object and silently wiped them). An explicit
    // null / '' / undefined in the payload is a CLEARED field and deletes the key
    // (the webview sends null because postMessage JSON serialization drops undefined
    // keys — "slot missing" and "explicitly cleared" must stay distinguishable on the wire).
    // advisor.enabled is deprecated (2026-08-21) — never written; guard defaults OFF.
    const adv = payload.advisor ?? {}
    const current = loadAgentSettings().advisor ?? {}
    // Seed from disk: every scalar/plain-object advisor key survives the merge.
    // Arrays (and functions, which JSON files can't have) are never written by either
    // side — don't resurrect them.
    const merged = {}
    for (const [k, v] of Object.entries(current)) {
      if (v === null || Array.isArray(v)) continue
      merged[k] = v
    }
    // Payload wins where it speaks (guard / timeoutMs / effort / provider / model).
    merged.guard = adv.guard !== undefined ? !!adv.guard : (merged.guard ?? false)
    // timeoutMs passthrough (AGENT-PARAMS-TUNING, P4): the panel has no timeoutMs
    // input — an explicit valid payload value wins, otherwise the hand-written
    // config.json value survives a panel save (never silently dropped, never stored invalid).
    if (typeof adv.timeoutMs === "number" && adv.timeoutMs > 0) merged.timeoutMs = adv.timeoutMs
    if (!Number.isFinite(merged.timeoutMs) || merged.timeoutMs <= 0) delete merged.timeoutMs
    if ("effort" in adv) {
      if (typeof adv.effort === "string" && adv.effort.trim()) merged.effort = adv.effort.trim()
      else delete merged.effort
    }
    for (const key of ["provider", "model"]) {
      if (key in adv) {
        if (typeof adv[key] === "string" && adv[key].trim()) merged[key] = adv[key].trim()
        else delete merged[key] // explicit null / '' / undefined = CLEARED slot
      }
    }
    delete merged.enabled // deprecated 2026-08-21 — never resurrect a stale key
    patch.advisor = merged
  }
  saveAgentSettings(patch)
}

// ─── Shell candidates (platform-aware, cached once per session — CLI /shell parity) ───

let _shellCandidatesCache = null

/** Detect available shells for this platform. Cached: shell availability does not
 *  change during a session, and spawnSync on every panel open would freeze the UI. */
export function shellCandidates() {
  if (_shellCandidatesCache !== null) return _shellCandidatesCache
  const win = process.platform === "win32"
  const commandExists = (cmd) => {
    try {
      // 'command -v' is a POSIX shell builtin; sh -c runs it (Windows uses `where`)
      const r = spawnSync(win ? "where" : "sh", win ? [cmd] : ["-c", `command -v ${cmd}`], { encoding: "utf8", timeout: 3000 })
      return r.status === 0 && r.stdout.trim().length > 0
    } catch { return false }
  }
  const GIT_BASH_PATHS = [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
    `${process.env.LOCALAPPDATA ?? ""}\\Programs\\Git\\bin\\bash.exe`,
  ]
  const candidates = []
  // System default always first
  candidates.push({ name: "System default", value: null, detect: () => true })
  if (win) {
    candidates.push({ name: "PowerShell (pwsh)", value: "pwsh", detect: () => commandExists("pwsh") })
    candidates.push({ name: "Windows PowerShell (powershell)", value: "powershell", detect: () => commandExists("powershell") })
    const gb = GIT_BASH_PATHS.find((p) => existsSync(p))
    if (gb) candidates.push({ name: `Git Bash (${gb})`, value: gb, detect: () => true })
    candidates.push({ name: "WSL bash (wsl)", value: "wsl", detect: () => commandExists("wsl") })
  } else {
    for (const sh of ["bash", "zsh", "fish"]) {
      candidates.push({ name: sh, value: sh, detect: () => commandExists(sh) })
    }
  }
  _shellCandidatesCache = candidates.filter((c) => c.detect())
  return _shellCandidatesCache
}

/** Persist shell setting from the panel. value: string path/command, '' or null = system default.
 *  F5b 冲突提示同 setProviderKey。 */
export function saveShellSettingsFromPanel(value) {
  const v = typeof value === "string" ? value.trim() : ""
  const r = persistRaw((raw) => {
    if (!v) delete raw.shell
    else raw.shell = v
  })
  return conflictError(r)
}

// ─── MCP servers (shared config.json mcp.servers[] — CLI parity) ───
// 2026-09-06 500 行硬限拆分：MCP 段迁 config-mcp.mjs（config-presets/config-migrate 同款
// hub 模式——import 面不变）；F5b 冲突提示经 conflictError 透传（调用方同型提示）。
export { loadMcpServers, addMcpServer, updateMcpServer, removeMcpServer } from "./config-mcp.mjs"

/** Embedding config from config.json (CLI: config.embedding { baseURL, model, apiKey }). */
export function loadEmbeddingConfig() {
  const emb = loadRaw().embedding
  return emb && typeof emb === "object" ? emb : null
}

/** Persist embedding fields into config.json (merge, drop empties). F5b 冲突提示同 setProviderKey。 */
export function saveEmbeddingConfig(patch) {
  const r = persistRaw((raw) => {
    const emb = raw.embedding && typeof raw.embedding === "object" ? raw.embedding : {}
    for (const [k, v] of Object.entries(patch || {})) {
      if (v == null || v === "") delete emb[k]
      else emb[k] = v
    }
    if (Object.keys(emb).length) raw.embedding = emb
    else delete raw.embedding
  })
  return conflictError(r)
}
