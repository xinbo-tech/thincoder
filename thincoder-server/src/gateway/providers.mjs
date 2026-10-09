/**
 * providers.mjs — provider 注册与模型派发（KD-SV-4/59：**对外标识**精确匹配——别名（配了）∥ `provider/model`；非策略路由）
 * + 条目两形归一与**别名索引**（正/反查——KD-SV-59；读面回映射单源）
 * + 模型设置（v4 `settings`——解码 ∥ 注册表携设置 ∥ `settingsFor`——KD-SV-34/35）
 * + 上游代理旗（v9 `proxy`——解码 ∥ 注册表 `proxyUri` 注入（逐渠旗 ∧ 顶层 uri）——KD-SV-55）
 * + 运行时箱（保存即热生效：`runtime.get()/set()` 原子换表——gateway/API.md §2.2）
 * + 装配引导（库单源：种子导入矩阵 ∥ 注册表构建（`env:` 解析）——ops/OPS.md §1）。
 *
 * 派发键 = 对外标识（别名 ∥ `provider/model` 前缀形——首斜杠切分：首段 = provider `name` ∥ 余段 = 上游模型名（可含斜杠）；
 * 两段非空）；**配了只认别名**（旧前缀名 ⇒ 404 `model_not_found` 消息含别名——KD-SV-59②）；未命中 ⇒ 404 同族。
 * 同名模型跨 provider 并存且各自可达；条目校验/唯一性单源 = `ops/config.mjs`（同 provider 内重名 ∥ 别名撞 ⇒ 拒）。
 * 端点注册与鉴权 = `routes.mjs`（OpenAI 面统一登记处，勿双主）。
 */
import { validateProviderEntries } from "../ops/config.mjs"
import { errorBody } from "./errors.mjs"

/** 首斜杠切分：`{ provider, model }`（两段均非空）；无斜杠 ∥ 空段 ⇒ null。 */
export function splitModelRef(ref) {
  if (typeof ref !== "string") return null
  const cut = ref.indexOf("/")
  if (cut <= 0 || cut === ref.length - 1) return null
  return { provider: ref.slice(0, cut), model: ref.slice(cut + 1) }
}

/** 对外标识形判据（成员键形校验单源——#1008 收正；KD-SV-59）：非空 ∥ 无首尾空白 ∥ 含斜杠时两段非空
 *  （**裸名 = 别名形合法**）；消费 = `accounts/members.mjs` 键形助手（`model-quotas` ∥ `model-disables` 两 merge 共用）。 */
export function isExternalModelRef(ref) {
  if (typeof ref !== "string" || ref.trim() === "") return false
  if (ref !== ref.trim()) return false // 首尾空白 ⇒ 不合形（#1008）
  if (!ref.includes("/")) return true // 裸名 = 别名形
  return splitModelRef(ref) !== null
}

/** `models` 条目两形归一（KD-SV-59①）：字符串 = 上游模型名（无别名）∥ 对象 `{ name, alias }`（配别名——
 *  `alias` 缺省 ∥ `null` ∥ `""` ⇒ 无别名）。出 = `[{ name, alias }]`（`alias` = 别名 ∥ `null`）——
 *  注册表 ∥ 别名索引 ∥ 读面回映射**同源**；形判/唯一性归 `ops/config.mjs`（校验单源），本助手读侧容坏项（跳过）。 */
export function modelEntriesOf(models) {
  const out = []
  for (const item of models ?? []) {
    if (typeof item === "string") {
      if (item !== "") out.push({ name: item, alias: null })
      continue
    }
    if (item !== null && typeof item === "object" && !Array.isArray(item) && typeof item.name === "string" && item.name !== "") {
      const alias = typeof item.alias === "string" && item.alias !== "" ? item.alias : null // 缺省/空 ⇒ 无别名（归一）
      out.push({ name: item.name, alias })
    }
  }
  return out
}

/** 别名索引（正/反查——KD-SV-59 单源）：入 = 条目数组（`{ name, models }`——库行 ∥ 归一条目两可）。
 *  出 = `{ externalId(provider, model), lookup(externalId) }`——读面回映射 ∥ `model` 过滤反查同源。 */
export function createAliasIndex(entries = []) {
  const byInternal = new Map() // `provider\u0000model` → 外标（别名 ∥ `provider/model`）
  const byExternal = new Map() // 外标 → 真名对 `{ provider, model }`
  for (const entry of entries ?? []) {
    if (entry === null || typeof entry !== "object" || typeof entry.name !== "string") continue
    for (const { name, alias } of modelEntriesOf(entry.models)) {
      const external = alias ?? `${entry.name}/${name}`
      byInternal.set(`${entry.name}\u0000${name}`, external)
      byExternal.set(external, { provider: entry.name, model: name })
    }
  }
  return {
    /** 外标（配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`）；嵌入行（`provider = ''`）⇒ 原样单段（单独命名空间——零涉）。 */
    externalId(provider, model) {
      if (provider === "" || provider === null || provider === undefined) return model
      return byInternal.get(`${provider}\u0000${model}`) ?? `${provider}/${model}`
    },
    /** 反查（`model` 过滤先用——METERING §3）：外标 ⇒ 真名对 ∥ 未命中 ⇒ `null`。 */
    lookup(external) {
      return byExternal.get(external) ?? null
    },
  }
}

/** 别名索引（库单源——读面回映射默认源；KD-SV-59）：读 `providers` 行 ⇒ 索引（保存即换表 ⇒ 下一次读随动）。 */
export function providerAliasIndex(db) {
  return createAliasIndex(listProviderEntries(db))
}

/** 库行 → provider 条目（store/STORE.md §2 v2/v4/v7/v9 段列名映射 + `models_json`/`settings_json`/`model_meta_json` 解码）。 */
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
    proxy: row.proxy === 1, // 上游代理旗（v9——SQLite 无布尔：1/0 ⇒ boolean；缺省 0 = 直连——KD-SV-55）
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
 *  派发表 = **对外标识**（别名 ∥ `provider/model`——KD-SV-59）；别名索引随表构建（读面/过滤共用）。
 *  `proxyUri` = 顶层 `proxy.uri`（装配 ∥ 保存两构建点同源——KD-SV-55）：逐渠旗 `proxy === true` ∧ uri 在案
 *  ⇒ 条目注入 `proxyUri`（chat 转发 ∥ 模型发现同判定）；缺省 ∥ 无 uri ⇒ `undefined`（直连——无全局闸）。
 *  在途口径 = 派发时快照（转发闭包持当时 provider 对象）；换表只影响后续请求（§2.2）。 */
export function createProviderRegistry(entries, { env = process.env, engineModel = null, proxyUri = null } = {}) {
  const providers = (entries ?? []).map((entry) => ({
    ...entry,
    settings: entry.settings ?? {}, // v4 模型设置随行（换表即随动——热生效：KD-SV-35）
    proxyUri: entry.proxy === true && proxyUri ? proxyUri : undefined, // 逐渠判定注入（v9——镜像客户端 injectProxy）
    apiKey: resolveProviderKey(entry.apiKey, { env, where: `provider ${entry.name} 的 apiKey` }),
  }))
  const aliases = createAliasIndex(providers)
  const table = [] // chat 侧外标条目（条目序）：`{ ref（外标）, provider, model（上游真名） }`
  for (const provider of providers) {
    for (const { name, alias } of modelEntriesOf(provider.models)) table.push({ ref: alias ?? `${provider.name}/${name}`, provider, model: name })
  }
  return {
    /** 派发（KD-SV-4/59）：命中 ⇒ `{ provider, model }`（model = 上游真名——随请转上游）；
     *  未命中 ⇒ `{ miss }`（404 `model_not_found`——旧前缀名（该模型已配别名）后消息明示别名）。 */
    dispatch(ref) {
      const hit = aliases.lookup(ref)
      if (hit) {
        const provider = providers.find((item) => item.name === hit.provider)
        if (provider) return { provider, model: hit.model }
      }
      const cut = splitModelRef(ref) // 旧前缀名（该模型已配别名）⇒ 消息明示别名（配了只认别名——KD-SV-59②）
      if (cut) {
        const provider = providers.find((item) => item.name === cut.provider)
        const entry = modelEntriesOf(provider?.models).find((item) => item.name === cut.model && item.alias !== null)
        if (entry) {
          return { miss: { status: 404, body: errorBody("model_not_found", `模型未配置：${ref}（该模型已配别名——配了只认别名：${entry.alias}）`) } }
        }
      }
      return { miss: { status: 404, body: errorBody("model_not_found", `模型未配置：${String(ref)}（对外标识 = 别名 ∥ provider/model 前缀形）`) } }
    },
    /** chat 侧清单条目（条目序——`{ ref（外标）, provider, model }`）。 */
    entries: () => table,
    /** provider 条目（归一条目序——诊断/管理面用）。 */
    providers: () => providers,
    /** 别名索引（读面回映射 ∥ `model` 过滤反查——KD-SV-59；保存换表 ⇒ 随之原子切换）。 */
    aliasIndex: () => aliases,
    /** 模型设置（v4）：命中 ⇒ 该模型设置对象 ∥ 未设 ∥ 未知 provider ⇒ `null`（空 = 不限——KD-SV-35）。
     *  `providerOrName` = 注册表 provider 对象（派发快照——推荐）∥ provider 名；`model` = 上游真名（设置键空间）。 */
    settingsFor(providerOrName, model) {
      const provider = typeof providerOrName === "string" ? providers.find((item) => item.name === providerOrName) : providerOrName
      const settings = provider?.settings
      if (settings === null || typeof settings !== "object") return null
      return settings[model] ?? null
    },
    /** 嵌入引擎模型（`embedding.model`——非 provider 面，原样；装配期注入；缺段 ⇒ `null`）。
     *  消费面 = 嵌入派发（`routes.mjs`——单独命名空间）；清单（`modelList`）零涉——KD-SV-58。 */
    engineModel: () => engineModel,
  }
}

/** `/v1/models` 清单（注册表派生：chat = **对外标识**（别名 ∥ `provider/model`）——**引擎模型不入本清单**
 *  （单独命名空间——KD-SV-58；2026-10-09 embed 解耦批；引擎模型仍走 `engineModel()`——派发面单独命名空间，清单零涉）。 */
export function modelList(registry) {
  return { object: "list", data: registry.entries().map(({ ref, provider }) => ({ id: ref, object: "model", created: 0, owned_by: provider.name })) }
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
 *  库非空 + 段缺 ⇒ 正常（`kept`）。返回 `{ action, count? }` 读数（装配日志用）。
 *  注（#967）：导入 = 一次性（库行留存——无回滚；要撤 = 控制台手删）；`env:` 引用解析 = 注册表构建期
 *  ⇒ 先修好环境变量再入库（否则入库即拒启——修复 = 补变量后重启）。 */
export function importProviderSeed(db, config, { now = () => new Date().toISOString() } = {}) {
  const existing = Number(db.prepare("SELECT COUNT(*) AS n FROM providers").get().n)
  const seed = Array.isArray(config?.providers) ? config.providers : []
  if (existing > 0) return seed.length > 0 ? { action: "ignored", count: seed.length } : { action: "kept" }
  if (seed.length === 0) return { action: "empty" }
  const insert = db.prepare("INSERT INTO providers (name, base_url, api_key, models_json, proxy, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
  const ts = now()
  db.exec("BEGIN")
  try {
    for (const entry of seed) {
      insert.run(entry.name, entry.baseURL, entry.apiKey ?? "", JSON.stringify(entry.models ?? []), entry.proxy === true ? 1 : 0, ts, ts)
    }
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
  const registry = createProviderRegistry(entries, { env, engineModel: config.embedding?.model ?? null, proxyUri: config.proxy?.uri ?? null })
  return createProviderRuntime(registry)
}
