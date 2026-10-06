/**
 * config.mjs — 配置加载与校验（ops/OPS.md §1）：读档 ∥ `env:` 前缀解析 ∥ 预设形展开（presets.mjs） ∥ 缺省值
 * （`autoUpdate` 档位 §5.4(b) ∥ `trustProxy` ∥ `usageRetentionDays`） ∥ 启动校验（fail-closed）。
 *
 * 校验不过 ⇒ 抛（入口转非零退出 + 明确报错）；告警（如 host = 0.0.0.0）逐条返回，入口打印。
 * 归一出参：`{ config, warnings, baseDir, configPath }`——`config.db` 已按配置档所在目录解析为绝对路径。
 * provider 条目校验单源 = `validateProviderEntry`/`validateProviderEntries`（三径：配置载入 ∥ 启动构建/种子 ∥
 * 控制台保存——gateway/API.md §2.2）；例外：`providers[].apiKey` 载入不解析（引用保形——注册表构建期解析）。
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
  const warnings = config.host === "0.0.0.0"
    ? ["host = 0.0.0.0：监听全部接口（仅单接口机可接受——ops/OPS.md §1）"]
    : []
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
 *  `providers[]` 可缺/可空——**零 provider = 允许态**（服务照常起 + 警告——控制台/种子为两条配置路径）。 */
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
  // providers[] = 首启种子（可缺/可空——零 provider 允许态；控制台 = 常态管理面——ops/OPS.md §1）
  const providers = raw.providers === undefined ? [] : validateProviderEntries(raw.providers)

  const embedding = raw.embedding
  if (embedding === null || typeof embedding !== "object" || Array.isArray(embedding)) {
    throw new Error("配置缺 embedding 段（baseURL ∥ model——必填）")
  }
  const normalizedEmbedding = {
    baseURL: requireHttpURL(embedding.baseURL, "embedding.baseURL"),
    model: requireString(embedding.model, "embedding.model"),
    apiKey: optionalString(embedding.apiKey, "embedding.apiKey"),
  }

  let bootstrap = null
  if (raw.bootstrap !== undefined) {
    const b = raw.bootstrap
    if (b === null || typeof b !== "object" || Array.isArray(b)) throw new Error("bootstrap 须为对象（username ∥ password）")
    const username = requireString(b.username, "bootstrap.username")
    const password = requireString(b.password, "bootstrap.password")
    if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`bootstrap.password 少于 ${MIN_PASSWORD_LENGTH} 字符（拒启）`)
    bootstrap = { username, password }
  }

  return { host: host.trim(), port, db, autoUpdate, trustProxy, usageRetentionDays, bootstrap, providers, embedding: normalizedEmbedding }
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
  return { name, baseURL, apiKey: optionalString(expanded.apiKey, `${where}.apiKey`), models }
}

/** provider 条目批量校验（providers 间重名判据 = 批内单源——逐条归 `validateProviderEntry`）：出 = 归一条目数组。 */
export function validateProviderEntries(entries, { where = "providers" } = {}) {
  if (!Array.isArray(entries)) throw new Error("providers 须为数组（首启种子——缺省/空 = 零 provider 允许态）")
  const seenProviderNames = new Set() // provider 名重名（providers 间）⇒ 拒（派发歧义——ops/OPS.md §1 补条）
  return entries.map((entry, i) => validateProviderEntry(entry, { where: `${where}[${i}]`, seenNames: seenProviderNames }))
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
