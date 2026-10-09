/**
 * config.mjs — 配置加载与校验（ops/OPS.md §1）：读档 ∥ `env:` 前缀解析 ∥ 预设形展开（presets.mjs） ∥ 缺省值
 * （`autoUpdate` 档位 §5.4(b) ∥ `trustProxy` ∥ `usageRetentionDays`） ∥ 启动校验（fail-closed）。
 *
 * 校验不过 ⇒ 抛（入口转非零退出 + 明确报错）；告警（如 host = 0.0.0.0 ∥ 代理两条 ∥ 嵌入未配置）逐条返回，入口打印。
 * 归一出参：`{ config, warnings, baseDir, configPath }`——`config.db` 已按配置档所在目录解析为绝对路径。
 * provider 条目校验单源 = `validateProviderEntry`/`validateProviderEntries`（三径：配置载入 ∥ 启动构建/种子 ∥
 * 控制台保存——gateway/API.md §2.2）；模型设置同源 = `validateProviderSettings`（v4 `settings`——未知子字段 ∥
 * 非法值 ⇒ 拒／400）；上游代理同源 = `validateProxyConfig`（顶层 `proxy` 段——KD-SV-55：非对象 ∥ uri 非法 ∥
 * scheme 非 `http:` ⇒ 拒启）+ 条目 `proxy` 布尔判据（`validateProviderEntry` 内）；例外：`providers[].apiKey` 载入不解析（引用保形——注册表构建期解析）。
 */
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { expandProviderEntry } from "./presets.mjs"

export const DEFAULT_PORT = 8787
export const DEFAULT_DB = "data/gateway.db"
export const MIN_PASSWORD_LENGTH = 8
export const DEFAULT_AUTO_UPDATE = "notify" // 更新档位缺省（可见不越权——§5.4(b)）
export const UPDATE_MODES = Object.freeze([false, "notify", "auto"])
export const DEFAULT_USAGE_RETENTION_DAYS = 90 // 用量保留窗缺省（天——KD-SV-22：`null` = 不限）
export const SETTINGS_SUB_FIELDS = Object.freeze(["rpm", "tpm", "costIn", "costOut", "note", "quotaTokens"]) // 模型设置子字段（v4 + 配额批 quotaTokens——gateway/API.md §2.2）
export const SETTINGS_NOTE_MAX = 200 // 「说明」字符上限（≤200 字——§2.2 D 组手填）

/** 读配置档 → env 解析 → 校验 → 返回归一出参（任何一步不过 ⇒ 抛）。 */
export function loadConfig(configPath, { env = process.env } = {}) {
  if (typeof configPath !== "string" || configPath.trim() === "") {
    throw new Error("缺少配置档路径（--config <配置档>）")
  }
  const configPathAbs = resolve(configPath)
  let text
  try {
    text = readFileSync(configPathAbs, "utf8")
  } catch (e) {
    throw new Error(`配置档不可读：${configPathAbs}（${e.message}）`)
  }
  let raw
  try {
    raw = JSON.parse(text)
  } catch (e) {
    throw new Error(`配置档非合法 JSON：${configPathAbs}（${e.message}）`)
  }
  const baseDir = dirname(configPathAbs)
  const config = validateConfig(resolveEnvRefs(raw, env))
  config.db = resolveDatabasePath(config.db, baseDir)
  const warnings = []
  if (config.host === "0.0.0.0") warnings.push("host = 0.0.0.0：监听全部接口（仅单接口机可接受——ops/OPS.md §1）")
  // 零 embedding = 允许态（§8 KD-SV-57——2026-10-09 embed 解耦批）：嵌入面禁用 + 警告一条；服务照常起。
  if (config.embedding === null) warnings.push("嵌入引擎未配置（config.json 缺 embedding 段）——/v1/embeddings 禁用；配置后重启生效")
  // 启动 warn 两条（载入期触发；文案 = gateway/API.md §6 KD-SV-55——中文单行）
  if (config.proxy !== null) {
    warnings.push("proxy.uri 为明文 http——上游密钥经代理外发（确认代理可信）") // uri 射程 = http: 仅（见 validateProxyConfig）
  }
  if (config.proxy === null && config.providers.some((entry) => entry.proxy === true)) {
    warnings.push("条目 proxy: true 而顶层 uri 缺位——该渠直连（旗未生效）")
  }
  return { config, warnings, baseDir, configPath: configPathAbs }
}

/** 字符串值支持 `env:变量名` 前缀（递归全树解析；变量缺位 ⇒ 抛——真实 key 可只住环境变量）。
 *  例外 = `providers[].apiKey`：载入不解析（引用保形——解析 = 注册表构建期；缺位 ⇒ 启动拒启 ∥ 保存 400——ops/OPS.md §1）。 */
export function resolveEnvRefs(value, env = process.env, path = "") {
  if (typeof value === "string") {
    if (!value.startsWith("env:")) return value
    if (/^providers\[\d+\]\.apiKey$/.test(path)) return value // 种子密钥引用保形（构建期解析）
    const name = value.slice(4)
    const resolved = env[name]
    if (resolved === undefined) throw new Error(`环境变量缺位：${name}（配置项 ${path || "（根）"}）`)
    return resolved
  }
  if (Array.isArray(value)) return value.map((item, i) => resolveEnvRefs(item, env, `${path}[${i}]`))
  if (value !== null && typeof value === "object") {
    const out = {}
    for (const [key, item] of Object.entries(value)) out[key] = resolveEnvRefs(item, env, path ? `${path}.${key}` : key)
    return out
  }
  return value
}

/** 启动校验（fail-closed——ops/OPS.md §1）：host 必填 ∥ 条目判据归 `validateProviderEntries`（单源）∥
 *  bootstrap 在场时 password ≥8 字符（跨 provider 模型同名 = 合法——各自可达）。
 *  `providers[]` 可缺/可空——**零 provider = 允许态**（服务照常起 + 警告——控制台/种子为两条配置路径）。
 *  `embedding` 可缺/`null`——**禁用态**（服务照常起 + 警告；在场严格校验保持——§8 KD-SV-57）。 */
export function validateConfig(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw new Error("配置根须为 JSON 对象")
  const host = raw.host
  if (typeof host !== "string" || host.trim() === "") throw new Error("配置缺 host（内网接口地址——必填）")
  const port = raw.port ?? DEFAULT_PORT
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`port 非法：${JSON.stringify(raw.port)}（须为 1–65535 的整数）`)
  const db = raw.db ?? DEFAULT_DB
  if (typeof db !== "string" || db.trim() === "") throw new Error("db 须为非空字符串路径（相对 = 配置档所在目录）")
  const autoUpdate = raw.autoUpdate ?? DEFAULT_AUTO_UPDATE // 更新档位：false（关） ∥ "notify"（检查 + 日志） ∥ "auto"（检查 + 自装）
  if (!UPDATE_MODES.includes(autoUpdate)) {
    throw new Error(`autoUpdate 非法：${JSON.stringify(raw.autoUpdate)}（合法值：false ∥ "notify" ∥ "auto"——拒启）`)
  }
  const trustProxy = raw.trustProxy === undefined ? false : raw.trustProxy // 反代客户端 IP 口径（缺省 false——登录防爆破 IP 维消费：ACCOUNTS §2；非布尔一律拒启）
  if (typeof trustProxy !== "boolean") {
    throw new Error(`trustProxy 非法：${JSON.stringify(raw.trustProxy)}（布尔值 false ∥ true——拒启）`)
  }
  const usageRetentionDays = raw.usageRetentionDays === undefined ? DEFAULT_USAGE_RETENTION_DAYS : raw.usageRetentionDays // `null` = 不限（显式值——不被缺省吞）
  if (usageRetentionDays !== null && (!Number.isInteger(usageRetentionDays) || usageRetentionDays < 1)) {
    throw new Error(`usageRetentionDays 非法：${JSON.stringify(raw.usageRetentionDays)}（正整数 ∥ null（不限）——拒启）`)
  }
  // 顶层 proxy 段（KD-SV-55——上游出口代理；配置面 = ops/OPS.md §1）：缺省/缺位 ⇒ null（零代理）；
  // 在场 ⇒ 严格校验（fail-closed——与客户端「非对象一律丢弃」差异在案）；生效 = 重启（文件不热载）。
  const proxy = raw.proxy === undefined ? null : validateProxyConfig(raw.proxy)
  // providers[] = 首启种子（可缺/可空——零 provider 允许态；控制台 = 常态管理面——ops/OPS.md §1）
  const providers = raw.providers === undefined ? [] : validateProviderEntries(raw.providers)

  // 嵌入配置可选（§8 KD-SV-57——2026-10-09 embed 解耦批）：缺位 ∥ null ⇒ null（禁用态——服务照常起 + 启动警告一条）；
  // 在场 ⇒ 严格校验保持（fail-closed——「未配置」与「配错」两义分离）；非对象非 null（字符串 ∥ 数组 ∥ 数字 ∥ 布尔）⇒ 拒启。
  const embedding = raw.embedding === undefined || raw.embedding === null ? null : normalizeEmbedding(raw.embedding)

  let bootstrap = null
  if (raw.bootstrap !== undefined) {
    const b = raw.bootstrap
    if (b === null || typeof b !== "object" || Array.isArray(b)) throw new Error("bootstrap 须为对象（username ∥ password）")
    const username = requireString(b.username, "bootstrap.username")
    const password = requireString(b.password, "bootstrap.password")
    if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`bootstrap.password 少于 ${MIN_PASSWORD_LENGTH} 字符（拒启）`)
    bootstrap = { username, password }
  }

  return { host: host.trim(), port, db, autoUpdate, trustProxy, usageRetentionDays, proxy, bootstrap, providers, embedding }
}

/** `embedding` 段归一（**校验单源**——配置载入 ∥ PATCH 门两径；§8 KD-SV-57）：在场须为对象——`baseURL` http(s) ∥
 *  `model` 非空串 ∥ `apiKey` 可空；非对象（字符串 ∥ 数组 ∥ 数字 ∥ 布尔）⇒ 抛（拒启 ∥ 保存 400——报错明示「对象 ∥ null」两形）。 */
function normalizeEmbedding(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`embedding 段须为对象 ∥ null（缺位 ∥ null = 禁用态——可选段；在场须给 baseURL ∥ model）——现 ${JSON.stringify(value)}；拒`)
  }
  return {
    baseURL: requireHttpURL(value.baseURL, "embedding.baseURL"),
    model: requireString(value.model, "embedding.model"),
    apiKey: optionalString(value.apiKey, "embedding.apiKey"),
  }
}

/** 顶层 `proxy` 段校验（**校验单源**——配置载入径；gateway/API.md §6 KD-SV-55 ∥ ops/OPS.md §1）：
 *  形 = `{ "uri": "http://host:port" }`（代理目标本体——非门槛）；uri 射程 = `http:` 仅（https: 代理串 ⇒
 *  拒启——传输为裸 TCP 连代理免「校验通过、传输不支持」边角）；非对象（数组 ∥ 数字 ∥ null）∥ uri 非字符串 ∥
 *  空串 ∥ 非 URL ∥ 裸串形 ∥ scheme 非 http: ⇒ 抛（拒启——fail-closed）。 */
export function validateProxyConfig(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`顶层 proxy 须为对象（形 = { "uri": "http://host:port" }——拒启）`)
  }
  const uri = value.uri
  if (typeof uri !== "string" || uri.trim() === "") {
    throw new Error(`proxy.uri 须为非空字符串（形 = "http://host:port"——拒启）`)
  }
  let parsed
  try {
    parsed = new URL(uri)
  } catch {
    throw new Error(`proxy.uri 非法 URL：${uri}（形 = "http://host:port"——拒启）`)
  }
  if (parsed.protocol !== "http:") {
    throw new Error(`proxy.uri 仅收 http: 代理串：${uri}（现 scheme = ${parsed.protocol}——拒启）`)
  }
  return { uri }
}

/** provider 条目校验（**校验单源**——三径：配置载入 ∥ 启动构建/种子 ∥ 控制台保存——ops/OPS.md §1）：
 *  入 = 条目（可含 `preset`——预设形先展开；手写形原样）；出 = 归一条目 `{ name, baseURL, apiKey, models }`
 *  （`apiKey` 可空——`env:` 引用原样保留，解析 = 注册表构建期）。判据（fail-closed——抛）：name 缺/空 ∥ 含 `/`；
 *  baseURL 非 http(s)；models 非字符串数组 ∥ 同 provider 内重名；preset 未知（展开期——报错列可用名）。
 *  `seenNames` 在场时兼判 providers 间重名（批量径）。 */
export function validateProviderEntry(entry, { where = "providers[i]", seenNames = null } = {}) {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) throw new Error(`${where} 须为对象`)
  const expanded = expandProviderEntry(entry, where) // 预设形 ⇒ 展开（未知名 ⇒ 抛——列可用名）；手写形原样
  const name = requireProviderName(expanded.name, where)
  if (seenNames) {
    if (seenNames.has(name)) throw new Error(`provider 名重名：${name}（${where}.name 与先前 provider 同名——派发歧义；拒启）`)
    seenNames.add(name)
  }
  const baseURL = requireHttpURL(expanded.baseURL, `${where}.baseURL`)
  if (!Array.isArray(expanded.models)) throw new Error(`${where}.models 须为字符串数组（本 provider 上游模型名清单——对外标识 = provider/model）`)
  const seenInProvider = new Set() // 同 provider 内重名 ⇒ 拒（跨 provider 同名 = 合法——并存且各自可达）
  const models = expanded.models.map((model, j) => {
    const value = requireString(model, `${where}.models[${j}]`)
    if (seenInProvider.has(value)) throw new Error(`模型重名：${value}（${where}.models 内重复——拒启防笔误）`)
    seenInProvider.add(value)
    return value
  })
  // 逐渠上游代理旗（KD-SV-55——v9）：布尔（缺省 false = 直连）；非布尔 ⇒ 拒启（配置径）∥ 400（保存径）。
  // 生效条件 = 旗 ∧ 顶层 `proxy.uri` 在案（判定 = gateway/proxy.mjs 消费面——无全局闸）。
  const proxy = expanded.proxy === undefined ? false : expanded.proxy
  if (typeof proxy !== "boolean") {
    throw new Error(`${where}.proxy 须为布尔（true = 该渠上游请求经代理 ∥ 缺省 false = 直连——现 ${JSON.stringify(expanded.proxy)}；拒）`)
  }
  return {
    name,
    baseURL,
    apiKey: optionalString(expanded.apiKey, `${where}.apiKey`),
    models,
    proxy,
    settings: validateProviderSettings(expanded.settings, { where: `${where}.settings` }), // v4 模型设置（缺省 = {}）
  }
}

/** provider 条目批量校验（providers 间重名判据 = 批内单源——逐条归 `validateProviderEntry`）：出 = 归一条目数组。 */
export function validateProviderEntries(entries, { where = "providers" } = {}) {
  if (!Array.isArray(entries)) throw new Error("providers 须为数组（首启种子——缺省/空 = 零 provider 允许态）")
  const seenProviderNames = new Set() // provider 名重名（providers 间）⇒ 拒（派发歧义——ops/OPS.md §1 补条）
  return entries.map((entry, i) => validateProviderEntry(entry, { where: `${where}[${i}]`, seenNames: seenProviderNames }))
}

/** 模型设置映射校验（**校验单源**——三径同 `validateProviderEntry`；形 = store/STORE.md §2 v4 段 ∥
 *  gateway/API.md §2.2）：入 = `{ "<上游模型名>": { rpm ∥ tpm ∥ costIn ∥ costOut ∥ note ∥ quotaTokens } }`（缺省 ⇒ `{}`）；
 *  出 = 归一形（逐键全子字段在册——未设 ⇒ 显式 `null`）。判据（fail-closed——抛）：值为 null／非对象 ∥
 *  未知子字段 ∥ rpm／tpm 非正整数 ∥ costIn／costOut 非 ≥0 数 ∥ note 非字符串或超 200 字符 ∥ quotaTokens 非 ≥0 整数。
 *  注：模型级 `null`（删键语义）= PATCH 请求的合并口径（`provider-admin.mjs` 合并层先处理——本函数不见后照抛）。 */
export function validateProviderSettings(settings, { where = "settings" } = {}) {
  if (settings === undefined || settings === null) return {}
  if (typeof settings !== "object" || Array.isArray(settings)) {
    throw new Error(`${where} 须为对象（模型设置映射：键 = 上游模型名）`)
  }
  const out = {}
  for (const [model, value] of Object.entries(settings)) {
    const at = `${where}["${model}"]`
    if (model === "") throw new Error(`${at} 键须为非空字符串（上游模型名——与 models 同空间）`)
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`${at} 须为对象（rpm ∥ tpm ∥ costIn ∥ costOut ∥ note——未设子字段显式 null）`)
    }
    for (const field of Object.keys(value)) {
      if (!SETTINGS_SUB_FIELDS.includes(field)) {
        throw new Error(`${at} 未知子字段：${field}（合法：${SETTINGS_SUB_FIELDS.join(" ∥ ")}）`)
      }
    }
    out[model] = {
      rpm: optionalPositiveInt(value.rpm, `${at}.rpm`),
      tpm: optionalPositiveInt(value.tpm, `${at}.tpm`),
      costIn: optionalNonNegativeNumber(value.costIn, `${at}.costIn`),
      costOut: optionalNonNegativeNumber(value.costOut, `${at}.costOut`),
      note: optionalNote(value.note, `${at}.note`),
      quotaTokens: optionalNonNegativeInt(value.quotaTokens, `${at}.quotaTokens`), // 配额平台层默认（每人每月 token——KD-SV-38）
    }
  }
  return out
}

/** 库路径归一：`:memory:` 原样（测试面）；其余相对 = 配置档所在目录 ⇒ 绝对。 */
export function resolveDatabasePath(db, baseDir) {
  if (db === ":memory:") return db
  return resolve(baseDir, db)
}

function requireString(value, where) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${where} 须为非空字符串`)
  return value
}

/** provider 名（ops/OPS.md §1 补条）：缺/空 ∥ 含 `/` ⇒ 拒——对外标识 `provider/model` 首斜杠切分，前缀形不可解析。 */
function requireProviderName(value, where) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${where}.name 缺/空（provider 名须为非空字符串——对外标识 provider/model 的前缀形不可解析；拒启）`)
  }
  if (value.includes("/")) {
    throw new Error(`provider 名含 "/"：${value}（${where}.name——对外标识 provider/model 的前缀形不可解析；拒启）`)
  }
  return value
}

function optionalPositiveInt(value, where) {
  if (value === undefined || value === null) return null
  if (!Number.isInteger(value) || value < 1) throw new Error(`${where} 须为正整数 ∥ null（空 = 未设——拒）`)
  return value
}

/** ≥0 整数 ∥ null（`quotaTokens`——每人每月默认用量；0 = 立即用尽，合法）。 */
function optionalNonNegativeInt(value, where) {
  if (value === undefined || value === null) return null
  if (!Number.isInteger(value) || value < 0) throw new Error(`${where} 须为 ≥0 整数 ∥ null（空 = 未设——拒）`)
  return value
}

function optionalNonNegativeNumber(value, where) {
  if (value === undefined || value === null) return null
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${where} 须为 ≥0 的数 ∥ null（空 = 未设——拒）`)
  }
  return value
}

function optionalNote(value, where) {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") throw new Error(`${where} 须为字符串（≤${SETTINGS_NOTE_MAX} 字符）∥ null`)
  if (value.length > SETTINGS_NOTE_MAX) throw new Error(`${where} 超过 ${SETTINGS_NOTE_MAX} 字符（现 ${value.length} 字符——拒）`)
  return value
}

function optionalString(value, where) {
  if (value === undefined || value === null) return ""
  if (typeof value !== "string") throw new Error(`${where} 须为字符串（可空——空则不发 Authorization 头）`)
  return value
}

function requireHttpURL(value, where) {
  const text = requireString(value, where)
  let parsed
  try {
    parsed = new URL(text)
  } catch {
    throw new Error(`${where} 非法 URL：${text}`)
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${where} 须为 http(s) URL：${text}`)
  }
  return text
}
