/**
 * config.mjs — 配置加载与校验（ops/OPS.md §1）：读档 ∥ `env:` 前缀解析 ∥ 预设形展开（presets.mjs） ∥ 缺省值
 * （含 `autoUpdate` 档位——§5.4(b)） ∥ 启动校验（fail-closed）。
 *
 * 校验不过 ⇒ 抛（入口转非零退出 + 明确报错）；告警（如 host = 0.0.0.0）逐条返回，入口打印。
 * 归一出参：`{ config, warnings, baseDir, configPath }`——`config.db` 已按配置档所在目录解析为绝对路径。
 */
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { expandProviderEntry } from "./presets.mjs"

export const DEFAULT_PORT = 8787
export const DEFAULT_DB = "data/gateway.db"
export const MIN_PASSWORD_LENGTH = 8
export const DEFAULT_AUTO_UPDATE = "notify" // 更新档位缺省（可见不越权——§5.4(b)）
export const UPDATE_MODES = Object.freeze([false, "notify", "auto"])

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

/** 字符串值支持 `env:变量名` 前缀（递归全树解析；变量缺位 ⇒ 抛——真实 key 可只住环境变量）。 */
export function resolveEnvRefs(value, env = process.env, path = "") {
  if (typeof value === "string") {
    if (!value.startsWith("env:")) return value
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

/** 启动校验（fail-closed——ops/OPS.md §1）：host 必填 ∥ providers ≥1 ∥ provider 名缺/空 ∥ 含 `/` ∥
 *  providers 间重名 拒（对外标识 `provider/model` 前缀形——§1 补条）∥ 同 provider 内模型重名拒 ∥
 *  baseURL 非 http(s) 拒 ∥ 未知预设名 拒（预设形条目展开期——报错列可用名）∥ bootstrap 在场时 password ≥8 字符
 *  （跨 provider 模型同名 = 合法——各自可达）。 */
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
  if (!Array.isArray(raw.providers) || raw.providers.length === 0) throw new Error("providers 须为非空数组（至少一个 provider）")

  const seenProviderNames = new Set() // provider 名重名（providers 间）⇒ 拒（派发歧义——ops/OPS.md §1 补条）
  const providers = raw.providers.map((provider, i) => {
    const where = `providers[${i}]`
    if (provider === null || typeof provider !== "object" || Array.isArray(provider)) throw new Error(`${where} 须为对象`)
    const entry = expandProviderEntry(provider, where) // 预设形 ⇒ 先展开（未知名 ⇒ 抛——列可用名）；手写形原样
    const name = requireProviderName(entry.name, where)
    if (seenProviderNames.has(name)) throw new Error(`provider 名重名：${name}（${where}.name 与先前 provider 同名——派发歧义；拒启）`)
    seenProviderNames.add(name)
    const baseURL = requireHttpURL(entry.baseURL, `${where}.baseURL`)
    if (!Array.isArray(entry.models)) throw new Error(`${where}.models 须为字符串数组（本 provider 上游模型名清单——对外标识 = provider/model）`)
    const seenInProvider = new Set() // 同 provider 内重名 ⇒ 拒（跨 provider 同名 = 合法——并存且各自可达）
    const models = entry.models.map((model, j) => {
      const value = requireString(model, `${where}.models[${j}]`)
      if (seenInProvider.has(value)) throw new Error(`模型重名：${value}（${where}.models 内重复——拒启防笔误）`)
      seenInProvider.add(value)
      return value
    })
    return { name, baseURL, apiKey: optionalString(entry.apiKey, `${where}.apiKey`), models }
  })

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

  return { host: host.trim(), port, db, autoUpdate, bootstrap, providers, embedding: normalizedEmbedding }
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
