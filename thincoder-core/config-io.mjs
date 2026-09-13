/**
 * config-io.mjs — 核内 config.json 的**单一读写面** + provider 持久化面 + 监视钩子
 * （CORE-UNIFICATION §2.5 CONFIG 组：#131「融合：核内单一读写 + 面板写面按端注入」·
 * #132 监视面按端注入 · #177「纯持久化函数取一侧 + UI 壳按端注入」）。
 *
 * 组成与来源（逐条可追）：
 *  - `configDir` / `configPath` / `_setConfigPathForTest` / `_resetConfigPathForTest` /
 *    `_configPath` —— CLI `config.mjs` 的路径与测试缝（逐字随迁；拆档以容纳 500 行硬限）。
 *  - `writeConfigAtomic` —— CLI `config.mjs`（R10 F5b mtime 门控：stat→read 序 + 冲突放弃
 *    + `.bak` 留现场 + 0600）。**核内唯一写盘执行体**。
 *  - `$schema` 写盘 —— VSC `config-io.mjs` 的 `saveRaw` 会写 `$schema` 指针、CLI 不写
 *    （§2.5 #80 端差）⇒ 以 `opts.schema` **按端注入**，默认不写（= CLI 语义，零行为变）。
 *  - `loadRaw` / `resolveProviders` —— VSC `config-io.mjs`（老形态迁移先行；providers 归一 +
 *    默认渠道派生）。迁移写回经核内唯一写盘执行体（与 CLI `loadConfig` 同一条链路）。
 *  - `persistRaw` / `conflictError` / `CONFIG_CONFLICT_HINT` —— VSC `config-io.mjs`（读-改-写
 *    链 + 冲突提示串；执行体 = `writeConfigAtomic`）。
 *  - `onConfigSelfWrite` —— VSC `config-io.mjs` 的自写通知（监视面属端侧，订阅挂在核内写面）。
 *  - `cascadeRemoveProvider` —— VSC `config-consult.mjs`（删渠道的悬挂引用级联清理，逐字随迁）。
 *  - `setProviderKey` / `removeProviderKeyFromConfig` / `addProviderEntry` / `removeProviderEntry`
 *    —— VSC `config-io.mjs` + `extension/provider-flows.mjs` 的**纯持久化函数**（无 UI；UI 壳
 *    QuickPick / TUI picker 留端侧）。
 */

import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { migrateLegacyModelFields } from "./config-migrate.mjs"
import { PROVIDER_PRESETS, presetToEntry } from "./config-presets.mjs"

export { PROVIDER_PRESETS, presetToEntry }

export const configDir = join(homedir(), ".thincoder")
export const configPath = join(configDir, "config.json")

/** Test seam: override the config file location (mirrors the CLI / VSC seams). */
let _pathOverride = null
export function _setConfigPathForTest(p) { _pathOverride = p }
export function _resetConfigPathForTest() { _pathOverride = null }
export function _configPath() { return _pathOverride ?? configPath }

/** F5b 冲突提示文案（D-F5b 同型——调用方展示 / 抛出）。 */
export const CONFIG_CONFLICT_HINT = "config changed on disk concurrently — retry"

/**
 * Read → mutate → write（CLI `writeConfigAtomic`）——**核内唯一写盘执行体**。
 *
 * - t0 = 写前重 stat 的比对基线，取在**新鲜读之前**（stat→read 序）：若对端在本端 stat 与
 *   read 之间的微窗口写入，只会造成假冲突（放弃重试），绝不会带着旧内容覆盖对端新值——
 *   read→stat 序存在漏检窗口（stat 已反映对端新 mtime → 门控放行旧内容）。
 * - 写前重 stat ≠ t0 → **放弃**本次写；先 copy `.bak-{ts}` 留现场（仅冲突时）。
 * - 返回 { ok:false, reason:"mtime-conflict" }，调用方提示 CONFIG_CONFLICT_HINT——不自动合并。
 * - 文件缺失（首写）→ t0 = null；对端在本端读后创建 → null ≠ 新 mtime → 冲突放弃。
 * - 畸形文件拒写（throw，绝不静默覆盖）；写后 chmod 0600 尽力而为。
 *
 * @param path config.json 路径（生产默认 configPath；测试注入 tmp 路径）
 * @param mutate 在磁盘新鲜 raw 上执行单操作的同步回调
 * @param {{schema?: string}} [opts] schema = 端注入的 `$schema` 指针（未给不写——§2.5 #80）
 */
export function writeConfigAtomic(path, mutate, opts = {}) {
  const mtimeOf = (p) => {
    try { return statSync(p).mtimeMs } catch { return null } // 缺失 → null（t0 比对基线）
  }
  const t0 = mtimeOf(path) // stat 先于 read（安全方向——见上）
  const text = existsSync(path) ? readFileSync(path, "utf8") : null
  let raw = {}
  if (text !== null) {
    try {
      raw = JSON.parse(text)
    } catch (error) {
      throw new Error(`config file not parseable — refusing to overwrite: ${path} — ${error.message}`, { cause: error })
    }
  }
  mutate(raw)
  // §2.5 #80：`$schema` 写盘按端差注入（VSC 写 schema 指针、CLI 不写）——默认关闭（CLI 语义）。
  if (opts.schema) raw.$schema = opts.schema
  const t1 = mtimeOf(path)
  if (t0 !== t1) {
    try { if (existsSync(path)) copyFileSync(path, `${path}.bak-${Date.now()}`) } catch { /* 现场保留失败不阻断冲突报告 */ }
    return { ok: false, reason: "mtime-conflict" }
  }
  mkdirSync(dirname(path), { recursive: true })
  // 0600: config.json contains API keys, must not be world-readable (POSIX; chmod is best-effort on Windows)
  writeFileSync(path, JSON.stringify(raw, null, 2) + "\n", { encoding: "utf8", mode: 0o600 })
  try { chmodSync(path, 0o600) } catch { /* may fail on Windows, ignore */ }
  for (const fn of [...selfWriteFns]) {
    try { fn() } catch (e) { console.warn(`[config] self-write subscriber failed: ${e.message}`) }
  }
  return { ok: true }
}

/** 读 → 改写 → 写（VSC `persistRaw` / CLI `tui persistRaw` / `cli setup-wizard` 同一链）。 */
export function persistRaw(mutate, opts = {}) {
  return writeConfigAtomic(opts.path ?? _configPath(), mutate, opts)
}

/** 冲突判定收口：写结果 → CONFIG_CONFLICT_HINT 或 null。 */
export function conflictError(result) {
  return result?.reason === "mtime-conflict" ? CONFIG_CONFLICT_HINT : null
}

// ─── Self-write notifications（§2.5 #131 / #132：监视面按端注入，订阅挂在核内写面）───
// 写成功后的同步回调让外部写感知面（配置监视）把基线刷到当前元组——自写 ⇒ 事件到达时
// 元组已等于基线 ⇒ 零推送（不抖动消费者）；冲突放弃路径（无写）不回调。
const selfWriteFns = new Set()

/** 订阅写盘成功后的同步回调；返回退订函数（监视面的 dispose 随退）。 */
export function onConfigSelfWrite(fn) {
  if (typeof fn !== "function") return () => {}
  selfWriteFns.add(fn)
  return () => { selfWriteFns.delete(fn) }
}

/**
 * Read the raw config object ({} when missing). Throws on invalid JSON — same as CLI loadConfig.
 * 老形态检测 → 内存迁移态先行；写回失败绝不阻断（冲突 → 下次读重试——幂等）。
 */
export function loadRaw() {
  const path = _configPath()
  if (!existsSync(path)) return {}
  let raw
  try {
    raw = JSON.parse(readFileSync(path, "utf8"))
  } catch (error) {
    throw new Error(`Config file is not valid JSON, check or delete it: ${path}\n  ${error.message}`, { cause: error })
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  if (migrateLegacyModelFields(raw)) {
    try {
      const r = writeConfigAtomic(path, migrateLegacyModelFields)
      if (r && r.ok === false) console.warn(`[config] model-merge migration write-back skipped (${r.reason}) — memory state continues, retried on next load`)
    } catch (e) {
      console.warn(`[config] model-merge migration write-back failed — memory state continues, retried on next load: ${e.message}`)
    }
  }
  return raw
}

/** Module-level one-time warn dedupe for invalid providers[].context (PROVIDER.md §15 D-C1). */
const warnedContext = new Set()

/**
 * Resolve providers list + active name from disk（VSC `config-io.mjs` 逐字随迁）。BaseURL
 * trailing slashes normalized. `activeProvider` 语义 = config.defaultModel 的渠道；缺失/失效
 * → 回退首 provider。渠道单值 `model` 归一：非字符串/空串删除。
 */
export function resolveProviders() {
  const raw = loadRaw()
  const providers = Array.isArray(raw.providers)
    ? raw.providers.filter((p) => p && typeof p === "object" && p.name)
    : []
  for (const p of providers) {
    if (typeof p.baseURL === "string") p.baseURL = p.baseURL.replace(/\/+$/, "")
    if (typeof p.model === "string" && p.model.trim()) p.model = p.model.trim()
    else delete p.model
    // PROVIDER.md §15 D-C1: providers[].context must be a positive integer (K units).
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

/** 级联清理（删渠道的共享写点）：raw 移除 name 渠道后清悬挂——
 *  consultModels 条目 / subagentModels 角色值（=== name 或 "name:…"）/ advisor.provider。纯 mutate。 */
export function cascadeRemoveProvider(raw, name) {
  const a = raw?.agent
  if (!a || typeof a !== "object" || Array.isArray(a)) return
  if (Array.isArray(a.consultModels)) {
    const keep = a.consultModels.filter((m) => m?.provider !== name)
    if (keep.length) a.consultModels = keep
    else delete a.consultModels
  }
  if (a.subagentModels && typeof a.subagentModels === "object" && !Array.isArray(a.subagentModels)) {
    for (const role of Object.keys(a.subagentModels)) {
      const v = a.subagentModels[role]
      if (typeof v === "string" && (v === name || v.startsWith(`${name}:`))) delete a.subagentModels[role]
    }
    if (!Object.keys(a.subagentModels).length) delete a.subagentModels
  }
  if (a.advisor && typeof a.advisor === "object" && !Array.isArray(a.advisor) && a.advisor.provider === name) {
    delete a.advisor.provider
  }
}

// ─── Provider 持久化面（§2.5 #177「纯持久化函数取一侧 + UI 壳按端注入」）───

/** 写一个渠道的 key（整 providers[] 重写）。冲突 → CONFIG_CONFLICT_HINT；成功 null。 */
export function setProviderKey(name, key) {
  const r = persistRaw((raw) => {
    raw.providers = Array.isArray(raw.providers) ? raw.providers : []
    const entry = raw.providers.find((p) => p?.name === name)
    if (entry) entry.apiKey = key
  })
  return conflictError(r)
}

/** 移除一个渠道的 key（保留渠道条目）。冲突提示同 setProviderKey。 */
export function removeProviderKeyFromConfig(name) {
  const r = persistRaw((raw) => {
    const entry = Array.isArray(raw.providers) ? raw.providers.find((p) => p?.name === name) : null
    if (entry) delete entry.apiKey
  })
  return conflictError(r)
}

const FORMATS = ["openai", "anthropic", "google"]

/** 新增渠道。payload: { preset?: name, custom?: { name, baseURL, model, format }, key? }
 *  返回错误串或 null。 */
export function addProviderEntry({ preset, custom, key } = {}) {
  let providers
  try {
    ({ providers } = resolveProviders())
  } catch (e) {
    return e.message
  }
  const existing = new Set(providers.map((p) => p.name))

  let entry
  if (preset) {
    if (!PROVIDER_PRESETS[preset]) return `Unknown preset: ${preset}`
    if (existing.has(preset)) return `Provider "${preset}" already exists`
    entry = presetToEntry(preset)
  } else if (custom) {
    const name = (custom.name || "").trim()
    if (!name) return "Provider name is required"
    if (existing.has(name) || PROVIDER_PRESETS[name]) return `Name "${name}" is already in use`
    const baseURL = (custom.baseURL || "").trim().replace(/\/+$/, "")
    if (!baseURL) return "Base URL is required"
    const model = (custom.model || "").trim()
    if (!model) return "Model is required"
    const format = (custom.format || "openai").trim()
    if (!FORMATS.includes(format)) return `Unknown API format: ${format} (expected ${FORMATS.join("/")})`
    entry = { name, baseURL, model } // MODEL-SELECTION：渠道单值默认模型（候选清单字段已退场）
    if (format !== "openai") entry.format = format
  } else {
    return "Add provider needs a preset or a custom config"
  }

  const r = persistRaw((raw) => { (raw.providers ??= []).push(entry) })
  const err = conflictError(r)
  if (err) return err // F5b：config 被并发方改过——放弃 + 提示重试（决策① A）
  const k = (key || "").trim()
  if (k) setProviderKey(entry.name, k)
  return null
}

/** 移除渠道。激活渠道受保护（CLI parity）。返回错误串或 null。 */
export function removeProviderEntry(name) {
  let providers, activeProvider
  try {
    ({ providers, activeProvider } = resolveProviders())
  } catch (e) {
    return e.message
  }
  if (!providers.some((p) => p.name === name)) return `No provider named "${name}"`
  if (name === activeProvider) return "The active provider cannot be removed — switch active first"
  const r = persistRaw((raw) => {
    raw.providers = (raw.providers ?? []).filter((p) => p?.name !== name)
    // F-4 (IKCDMR——AC-4 级联)：删渠道同步清 consultModels/subagentModels/advisor.provider 悬挂引用
    cascadeRemoveProvider(raw, name)
  })
  return conflictError(r) // F5b：冲突 → 错误串提示（调用方 providerError 通道展示）
}
