/**
 * providers.mjs — provider 注册与模型派发（KD-SV-4：`provider/model` 复合键精确匹配——非别名 ∥ 非策略路由）
 * + 模型设置（v4 `settings`——解码 ∥ 注册表携设置 ∥ `settingsFor`——KD-SV-34/35）
 * + 运行时箱（保存即热生效：`runtime.get()/set()` 原子换表——gateway/API.md §2.2）
 * + 装配引导（库单源：种子导入矩阵 ∥ 注册表构建（`env:` 解析）——ops/OPS.md §1）。
 *
 * 派发键 = `provider/model`（首斜杠切分：首段 = provider `name` ∥ 余段 = 上游模型名（可含斜杠）；
 * 两段非空；裸名不解析）；未命中 ∥ 裸名 ⇒ 404 `model_not_found`（提示带前缀形）。
 * 同名模型跨 provider 并存且各自可达；条目校验单源 = `ops/config.mjs`（同 provider 内重名 ⇒ 拒）。
 * 端点注册与鉴权 = `routes.mjs`（OpenAI 面统一登记处，勿双主）。
 */
import { validateProviderEntries } from "../ops/config.mjs"
import { errorBody } from "./errors.mjs"

/** 首斜杠切分：`{ provider, model }`（两段均非空）；无斜杠 ∥ 空段 ⇒ null（裸名不解析）。 */
export function splitModelRef(ref) {
  if (typeof ref !== "string") return null
  const cut = ref.indexOf("/")
  if (cut <= 0 || cut === ref.length - 1) return null
  return { provider: ref.slice(0, cut), model: ref.slice(cut + 1) }
}

/** 库行 → provider 条目（store/STORE.md §2 v2/v4/v7 段列名映射 + `models_json`/`settings_json`/`model_meta_json` 解码）。 */
export function rowToEntry(row) {
  let models
  try {
    models = JSON.parse(row.models_json ?? "[]")
  } catch (e) {
    throw new Error(`providers 行数据损坏（id=${row.id}——models_json 非 JSON：${e.message}）`)
  }
  let settings
  try {
    settings = JSON.parse(row.settings_json ?? "{}")
  } catch (e) {
    throw new Error(`providers 行数据损坏（id=${row.id}——settings_json 非 JSON：${e.message}）`)
  }
  if (settings === null || typeof settings !== "object" || Array.isArray(settings)) {
    throw new Error(`providers 行数据损坏（id=${row.id}——settings_json 非对象）`)
  }
  let modelMeta
  try {
    modelMeta = JSON.parse(row.model_meta_json ?? "{}")
  } catch (e) {
    throw new Error(`providers 行数据损坏（id=${row.id}——model_meta_json 非 JSON：${e.message}）`)
  }
  if (modelMeta === null || typeof modelMeta !== "object" || Array.isArray(modelMeta)) {
    throw new Error(`providers 行数据损坏（id=${row.id}——model_meta_json 非对象）`)
  }
  return {
    id: row.id,
    name: row.name,
    baseURL: row.base_url,
    apiKey: row.api_key,
    models,
    settings, // 模型设置映射（v4——`{}` = 未设；判据单源 = ops/config.mjs）
    modelMeta, // 上游模型元数据留存图（v7——`{}` = 未存；纯展示数据——§2.2「模型元数据」条）
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** 读库 ⇒ 条目数组（行序 = id 序；管理面回显与装配构建共用）。 */
export function listProviderEntries(db) {
  return db.prepare("SELECT * FROM providers ORDER BY id").all().map(rowToEntry)
}

/** `env:NAME` 引用解析（`providers[].apiKey` 例外——注册表构建期解析；ops/OPS.md §1）：
 *  非引用 ⇒ 原样；缺位 ⇒ 抛（启动拒启 ∥ 保存 400——报文只带变量名，密钥值永不入日志）。 */
export function resolveProviderKey(apiKey, { env = process.env, where = "apiKey" } = {}) {
  const value = typeof apiKey === "string" ? apiKey : apiKey == null ? "" : String(apiKey)
  if (!value.startsWith("env:")) return value
  const name = value.slice(4)
  if (env[name] === undefined) {
    throw new Error(`环境变量缺位：${name}（${where}——注册表构建期解析；启动拒启 ∥ 保存 400）`)
  }
  return env[name]
}

/** provider 注册表（条目 → 派发表；构建期解析 `env:` 引用——缺位 ⇒ 抛，调用方转拒启/400）。
 *  在途口径 = 派发时快照（转发闭包持当时 provider 对象）；换表只影响后续请求（§2.2）。 */
export function createProviderRegistry(entries, { env = process.env, engineModel = null } = {}) {
  const providers = (entries ?? []).map((entry) => ({
    ...entry,
    settings: entry.settings ?? {}, // v4 模型设置随行（换表即随动——热生效：KD-SV-35）
    apiKey: resolveProviderKey(entry.apiKey, { env, where: `provider ${entry.name} 的 apiKey` }),
  }))
  const table = [] // chat 侧外部标识条目（条目序）：`{ ref, provider, model }`
  for (const provider of providers) {
    for (const model of provider.models) table.push({ ref: `${provider.name}/${model}`, provider, model })
  }
  return {
    /** 派发（KD-SV-4）：命中 ⇒ `{ provider, model }`（model = 上游模型名——首斜杠余段，随请转上游）；
     *  未命中 ∥ 裸名 ⇒ `{ miss }`（404 `model_not_found` 形——message 提示带前缀形）。 */
    dispatch(ref) {
      const cut = splitModelRef(ref)
      if (!cut) {
        return { miss: { status: 404, body: errorBody("model_not_found", `模型标识须为 provider/model 前缀形（裸名不解析）：${String(ref)}`) } }
      }
      const provider = providers.find((item) => item.name === cut.provider)
      if (!provider || !provider.models.includes(cut.model)) {
        return { miss: { status: 404, body: errorBody("model_not_found", `模型未配置：${ref}（对外标识 = provider/model 前缀形）`) } }
      }
      return { provider, model: cut.model }
    },
    /** chat 侧清单条目（条目序——`{ ref, provider, model }`）。 */
    entries: () => table,
    /** provider 条目（归一条目序——诊断/管理面用）。 */
    providers: () => providers,
    /** 模型设置（v4）：命中 ⇒ 该模型设置对象 ∥ 未设 ∥ 未知 provider ⇒ `null`（空 = 不限——KD-SV-35）。
     *  `providerOrName` = 注册表 provider 对象（派发快照——推荐）∥ provider 名。 */
    settingsFor(providerOrName, model) {
      const provider = typeof providerOrName === "string" ? providers.find((item) => item.name === providerOrName) : providerOrName
      const settings = provider?.settings
      if (settings === null || typeof settings !== "object") return null
      return settings[model] ?? null
    },
    /** 嵌入引擎模型（`embedding.model`——非 provider 面，原样；装配期注入）。 */
    engineModel: () => engineModel,
  }
}

/** `/v1/models` 清单（注册表派生：chat = 带前缀名 ∥ 引擎模型原样——N4）。 */
export function modelList(registry) {
  const data = registry.entries().map(({ ref, provider }) => ({ id: ref, object: "model", created: 0, owned_by: provider.name }))
  const engine = registry.engineModel()
  if (engine) data.push({ id: engine, object: "model", created: 0, owned_by: "embedding" })
  return { object: "list", data }
}

/** 运行时箱（保存即热生效——§2.2）：装配期建一次；保存路径 `set(候选)` 原子换表；HTTP 面 `get()` 读当时表。 */
export function createProviderRuntime(registry) {
  let current = registry
  return {
    get: () => current,
    set: (next) => { current = next },
  }
}

/** 种子导入矩阵（ops/OPS.md §1——库单源）：库空 + 段在场 ⇒ 导入（`env:` 引用**保形**入库——种子不物化秘密；
 *  `settings` 不入列——种子零 settings 字段（载入缺省 `{}`；模型设置 = 控制台单一面——KD-SV-34）；
 *  库空 + 段缺/空 ⇒ 不导（`empty`——调用方警告）；库非空 + 段在场 ⇒ 忽略（`ignored`——调用方警告）；
 *  库非空 + 段缺 ⇒ 正常（`kept`）。返回 `{ action, count? }` 读数（装配日志用）。 */
export function importProviderSeed(db, config, { now = () => new Date().toISOString() } = {}) {
  const existing = Number(db.prepare("SELECT COUNT(*) AS n FROM providers").get().n)
  const seed = Array.isArray(config?.providers) ? config.providers : []
  if (existing > 0) return seed.length > 0 ? { action: "ignored", count: seed.length } : { action: "kept" }
  if (seed.length === 0) return { action: "empty" }
  const insert = db.prepare("INSERT INTO providers (name, base_url, api_key, models_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
  const ts = now()
  db.exec("BEGIN")
  try {
    for (const entry of seed) insert.run(entry.name, entry.baseURL, entry.apiKey ?? "", JSON.stringify(entry.models ?? []), ts, ts)
    db.exec("COMMIT")
  } catch (e) {
    db.exec("ROLLBACK")
    throw e
  }
  return { action: "imported", count: seed.length }
}

/** 装配引导（OPS §4 启动链：开库/迁移之后、监听之前）：种子导入（矩阵 + 日志 `providers_imported` ∥
 *  `providers_config_ignored`）→ 库条目校验（单源）→ 注册表构建（`env:` 解析——缺位 ⇒ 抛 ⇒ 启动拒启）
 *  → 运行时箱。返回 runtime（HTTP 面与 provider 管理面共实例——换表两族同见）。 */
export function bootstrapProviderRuntime({ db, config, log = null, env = process.env } = {}) {
  if (!db || !config) throw new Error("bootstrapProviderRuntime：缺少 db ∥ config（装配面须传全）")
  const seed = importProviderSeed(db, config)
  if (seed.action === "imported") {
    log?.info("providers_imported", { count: seed.count })
  } else if (seed.action === "ignored") {
    log?.warn("providers_config_ignored", { count: seed.count, message: "库已有 provider——config.json providers[] 段被忽略（库为准；不再需要请移除该段）" })
  } else if (seed.action === "empty") {
    log?.warn("providers_empty", { message: "零 provider——服务照常起；控制台添加（或留配置种子）" })
  }
  const entries = validateProviderEntries(listProviderEntries(db)) // 启动构建径（单源校验——坏行 ⇒ 拒启）
  const registry = createProviderRegistry(entries, { env, engineModel: config.embedding?.model ?? null })
  return createProviderRuntime(registry)
}
