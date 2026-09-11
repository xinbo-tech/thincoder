/**
 * config-io.mjs — shared config file I/O (VS Code side)
 * MODEL-SELECTION schema（2026-09-10——mirrors CLI `thincoder/src/config.mjs`）：providers[]
 * with a single `model` default per channel + config.defaultModel top-level composite；
 * `providers[].models[]` 候选清单字段已退场（清单权威 = provider 运行期 `/models` 拉取——
 * `provider/list-models.mjs`）；legacy shapes migrate on loadRaw (config-migrate.mjs
 * migrateLegacyModelFields — same rule both ends).
 *
 * Pure Node — no `vscode` import — so unit tests can run outside the extension host.
 * Split for the 500-line limit: preset table → config-presets.mjs (zero deps),
 * legacy migration core → config-migrate.mjs, MCP servers → config-mcp.mjs,
 * panel write surface → extension/settings-panel-write.mjs, consultModels soft-fail
 * + cascade removal → config-consult.mjs (2026-09-09 BATCH-3-STRUCTURE F-1 预拆).
 * All are re-exported here so existing `from "../config-io.mjs"` import sites keep working.
 * The VS Code-specific one-time migration glue lives in extension/migrate-settings.mjs.
 */

import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { PROVIDER_PRESETS, presetToEntry } from "./config-presets.mjs"
import { migrateCore, migrateLegacyModelFields } from "./config-migrate.mjs"
import { sanitizeConsultModels, warnConsultModelsFiltered, loadConsultPool, cascadeRemoveProvider } from "./config-consult.mjs"
// 面板写面（MODEL-MERGE-SESSION 拆分——config-io 需容纳 schema/迁移/解析增长）
export { saveAgentSettingsFromPanel, saveShellSettingsFromPanel } from "./extension/settings-panel-write.mjs"

export { PROVIDER_PRESETS, presetToEntry, migrateCore, migrateLegacyModelFields }

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

// ─── Self-write notifications（第 21 批 B5——SETTINGS（VSC 仓）§2.6 基线回填订阅面）───
// saveRaw = 本进程写盘唯一通道（persistRaw/面板写面/工具面/迁移写回全经此）；写成功后的
// 同步回调让外部写感知面（config-watch）把 watcher 基线刷到当前元组——扩展自写 ⇒ 事件到达时
// 元组已等于基线 ⇒ 零推送（不抖动面板）；冲突放弃路径（无写）不回调。
const selfWriteFns = new Set()

/** 订阅 saveRaw 写成功后的同步回调；返回退订函数（config-watch 的 dispose 随退）。 */
export function onConfigSelfWrite(fn) {
  if (typeof fn !== "function") return () => {}
  selfWriteFns.add(fn)
  return () => { selfWriteFns.delete(fn) }
}

/** F5b 冲突提示文案（D-F5b 同型——调用方展示/抛出） */
export const CONFIG_CONFLICT_HINT = "config changed on disk concurrently — retry"

function statTupleOf(path) {
  try {
    const s = statSync(path)
    return { mtimeMs: s.mtimeMs, size: s.size }
  } catch { return null }
}

/** Read the raw config object ({} when missing). Throws on invalid JSON — same as CLI loadConfig.
 *  MODEL-MERGE-SESSION §3：老形态检测 → 内存迁移态先行；写回（saveRaw——F5b 门控）失败绝不
 *  阻断（冲突 → 下次 loadRaw 重试——幂等——saveRaw 不递归 loadRaw 无环）。 */
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
  if (migrateLegacyModelFields(raw)) {
    try {
      const r = saveRaw(raw) // 磁盘 fresh 读 → 已迁移 raw 写回（mtime 门控——基线见上）
      if (r && r.ok === false) console.warn(`[config] model-merge migration write-back skipped (${r.reason}) — memory state continues, retried on next loadRaw`)
    } catch (e) {
      console.warn(`[config] model-merge migration write-back failed — memory state continues, retried on next loadRaw: ${e.message}`)
    }
  }
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
  for (const fn of [...selfWriteFns]) {
    try { fn() } catch (e) { console.warn(`[config] self-write subscriber failed: ${e.message}`) }
  }
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
 * MODEL-SELECTION：activeProvider 语义 = config.defaultModel 的渠道（解析后成员——
 * 严格双段）；defaultModel 缺失/失效 → 回退首 provider（design——去 raw.activeProvider
 * 读——老字段已随 loadRaw 迁移删除）。渠道单值 `model` 归一：非字符串/空串删除（M3）。
 */
export function resolveProviders() {
  const raw = loadRaw()
  const providers = Array.isArray(raw.providers)
    ? raw.providers.filter((p) => p && typeof p === "object" && p.name)
    : []
  for (const p of providers) {
    if (typeof p.baseURL === "string") p.baseURL = p.baseURL.replace(/\/+$/, "")
    // 单值 `model` 内存归一（非字符串/空串删除——M3：非空字符串 | 缺失）
    if (typeof p.model === "string" && p.model.trim()) p.model = p.model.trim()
    else delete p.model
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
  let activeProvider = ""
  if (typeof raw.defaultModel === "string" && raw.defaultModel.includes(":")) {
    const dmProvider = raw.defaultModel.slice(0, raw.defaultModel.indexOf(":"))
    if (providers.some((p) => p.name === dmProvider)) activeProvider = dmProvider
  }
  if (!activeProvider) activeProvider = providers[0]?.name ?? ""
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
 * Runtime model for an entry——MODEL-SELECTION 回退链（R6）：
 * ① raw.defaultModel 复合属本渠道 → 用之；② 渠道默认单值 `entry.model`；③ null。
 *（不再静默回退 models[0]——候选清单字段已退场；空值合法——准入/候选经 /models 拉取）。
 */
export function resolveDefaultModel(entry, raw) {
  const dm = typeof raw?.defaultModel === "string" ? raw.defaultModel : ""
  if (dm && entry) {
    const sep = dm.indexOf(":")
    if (sep > 0 && dm.slice(0, sep) === entry.name) {
      const m = dm.slice(sep + 1)
      if (m) return m
    }
  }
  return typeof entry?.model === "string" && entry.model ? entry.model : null
}

/**
 * M9 探针目标：渠道条目 → `listModels` 可消费的 provider 形状（探针走模型请求的
 * 代理链——与 providerFromConfig 同规则：per-provider `proxy: true` 且全局 `proxy.model === true`）。
 * apiKey 缺失 → 空串（探针会如实失败 → 渠道标「不可用」——准入判据 M8）。
 */
export function probeTargetFromEntry(entry) {
  const raw = loadRaw()
  const proxyCfg = normalizeProxy(raw.proxy)
  const proxyUri = entry?.proxy === true && proxyCfg?.uri && proxyCfg.model === true ? proxyCfg.uri : undefined
  return {
    name: entry?.name,
    baseURL: entry?.baseURL,
    apiKey: resolveKey(entry) ?? "",
    format: entry?.format,
    proxyUri,
  }
}

/**
 * Build the runtime provider object for LLM calls from config.json.
 * null when the provider has no resolvable API key. Throws on unknown name (findProvider parity).
 * MODEL-SELECTION：provider.model = resolveDefaultModel（defaultModel 复合属该渠道
 *  则用之——否则渠道默认单值）——API/spec 消费点零改（provider.model = 解析后具体值）。
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
    model: resolveDefaultModel(target, raw),
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

// selectProviderModel 已退役（MODEL-MERGE-SESSION——selectModel 消息不再写 config 全局：
// 会话模型落会话槽——VSC 面板写面见 panel-messages.mjs selectModel case）

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
  const raw = loadRaw()
  const a = raw.agent
  const d = AGENT_DEFAULTS
  // F-4 (IKCDMR——CLI loadConfig 同规则——双端锁步)：consultModels 软失败清洗（形状/未知渠道/非数组
  // 过滤 + 一次性警告——读面不崩；面板经此读 = 显过滤态）。undefined → 默认 []（sanitize 内）。
  const { keep, dropped } = sanitizeConsultModels(
    a?.consultModels,
    (Array.isArray(raw.providers) ? raw.providers : []).map((p) => p?.name).filter(Boolean))
  warnConsultModelsFiltered(dropped)
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
    consultModels: keep, // F-4：过滤后合法池（未知渠道条目不进面板/运行态）
    poolLimits: a?.poolLimits ?? d.poolLimits, // §11.1/§11.2: async pool limits per role domain（校验在运行期读点——advisor 键面板显示/回退）
  }
}

// F-4 (IKCDMR) consultModels 软失败 + 级联清理已迁 config-consult.mjs（BATCH-3-STRUCTURE
// F-1 预拆——config-presets/config-migrate/config-mcp 同款 hub 模式——import 面不变）
export { sanitizeConsultModels, warnConsultModelsFiltered, loadConsultPool, cascadeRemoveProvider }

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

// ─── Panel persistence write surface ───
// saveAgentSettingsFromPanel / saveShellSettingsFromPanel 迁 extension/settings-panel-write.mjs
// （MODEL-MERGE-SESSION 拆分——config-io 500 行硬限头寸）——本文件顶部 hub re-export（import 面不变）

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
 *  F5b 冲突提示同 setProviderKey。 —— 已迁 settings-panel-write.mjs（hub re-export） */

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
