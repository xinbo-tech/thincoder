/**
 * provider-admin.mjs — provider 管理面（控制台——仅 admin；gateway/API.md §2.2）：
 * 列表 ∥ 新增 ∥ 修改 ∥ 删除 ∥ 模型发现 ∥ 预设清单（六端点）。
 *
 * 模型设置（v4 `settings`——KD-SV-34）：读面 = GET 行载全图；写面 = PATCH 键级合并
 * （请求出现的键 = 整对象替换——值 `null` ⇒ 删键；未出现键 = 不动；合并后走进单源校验）。
 *
 * 模型元数据留存图（v7 `modelMeta`——功能点 24/KD-SV-45）：保留集 = 白名单四字段（`displayName` ∥
 * `contextWindow` ∥ `vision` ∥ `status`——用途先行；未收录不采、缺就空着）；读面 = GET 行载图（恒在场——
 * 未存 ⇒ `{}`）∥ discover 出图（与 `models` 同集——`extractModelMeta`）；写面 = POST/PATCH `modelMeta`
 * （`filterModelMeta`——白名单 + 形不符即略 + 与提交 `models` 求交；键缺省 = 现存按求交滑动；非对象 ⇒ 400）。
 * 纯展示数据——转发 ∥ 派发 ∥ `/v1/models` 零涉。
 *
 * 上游代理旗（v9 `proxy`——KD-SV-55）：读面 = GET 行载 `proxy`（布尔）；写面 = POST/PATCH `proxy`（布尔——
 * 非布尔 ⇒ 400 库与运行时零变）；候选注册表携顶层 `proxy.uri`（保存即热生效——换表随动）；
 * discover 代理判定 = 明传优先 ∥ `providerId` 条目旗兜底 ∥ 皆无 ⇒ 直连（与 chat 转发同判定；出口 = `proxyFetch`）。
 *
 * 保存即热生效（四步——§2.2）：① 校验（单源 = `ops/config.mjs` 导出——与配置种子同规）→
 * ② 建候选注册表（`env:` 解析——缺位 ⇒ 400 不落库）→ ③ 落库 → ④ `runtime.set(候选)`（原子换表）；
 * 失败 ⇒ 库与运行时零变。密钥回显掩码（空 ⇒ "" ∥ `env:` 原文 ∥ 明文 ⇒ `…` + 末 4）；
 * 密钥值永不入日志（日志只带 provider 名/id 与动作）。模型发现 = `GET {baseURL}/models`（Authorization 同转发——
 * 空不发；超时 10s 可覆盖；失败 ⇒ 502 `upstream_error`（控制面提示 + 重试——**无手填兜底**）；草稿键不落库）。
 * 判权 = `requireAdmin`（`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401）；错误码全沿用（零新码）；写端点 JSON 型门 = 服务层径。
 */
import { requireAdmin } from "../accounts/session.mjs"
import { validateProviderEntry } from "../ops/config.mjs"
import { SERVER_PRESETS, expandProviderEntry } from "../ops/presets.mjs"
import { HttpError, sendJson } from "./errors.mjs"
import { upstreamUrl } from "./forward.mjs"
import { proxyFetch } from "./proxy.mjs"
import { createProviderRegistry, listProviderEntries, resolveProviderKey, rowToEntry } from "./providers.mjs"
import { readJsonBody } from "./server.mjs"

/** 模型发现超时（§2.2——10s；注入口径 = 注册参数 `discoverTimeoutMs`）。 */
export const PROVIDER_DISCOVER_TIMEOUT_MS = 10000

/** 密钥回显形（§2.2——永不回明文）：空 ⇒ ""；`env:` 引用 ⇒ 原文（引用非秘密）；明文 ⇒ `…` + 末 4 字符。 */
export function maskApiKey(apiKey) {
  const value = typeof apiKey === "string" ? apiKey : ""
  if (value === "") return ""
  if (value.startsWith("env:")) return value
  return `…${value.slice(-4)}`
}

/** `settings` 键级合并（PATCH 写面——gateway/API.md §2.2）：请求出现的键 = 整对象替换（值 `null` ⇒ 删键）；
 *  未出现键 = 不动；`patch === undefined` ⇒ 现值原样（PATCH「字段缺省 = 不动」口径）。
 *  值形与判据归单源校验（`ops/config.mjs` 的 settings 段——未知子字段 ∥ 非法值 ⇒ 400，库与运行时零变）。 */
export function mergeProviderSettings(current, patch) {
  if (patch === undefined) return current
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) {
    throw new Error("settings 须为对象（键 = 上游模型名——值 = 该模型完整设置对象 ∥ null（删键））")
  }
  const merged = { ...current }
  for (const [model, value] of Object.entries(patch)) {
    if (value === null) delete merged[model] // 值 null ⇒ 删键（§2.2）
    else merged[model] = value // 出现的键 = 整对象替换
  }
  return merged
}

/** 入参归一：非对象（含 null/数组）⇒ `{}`——字段判据归单源校验（缺 ⇒ 报对应错误）。 */
function bodyFields(body) {
  return body !== null && typeof body === "object" && !Array.isArray(body) ? body : {}
}

/** 退役词表（§2.2——子串匹配·大小写无关；命中才收原文——供退役提示）。 */
const RETIRED_STATUS_WORDS = ["shutdown", "retired", "deprecated"]

/** 元数据四字段清洗（抽取/写面过滤共用——白名单 + 形不符即略；§2.2「模型元数据」条）：
 *  `displayName`（≠ 模型名 ∧ ≤200 字符）∥ `contextWindow`（正整数）∥ `vision`（仅 `true`）∥ `status`（仅命中退役词表）。
 *  出 = 洁净对象（≥1 字段才由调用方入键——零兜底值、零占位）。 */
function cleanModelMeta(meta, model) {
  const out = {}
  if (meta === null || typeof meta !== "object" || Array.isArray(meta)) return out
  const displayName = meta.displayName
  if (typeof displayName === "string" && displayName.trim() !== "" && displayName !== model && displayName.length <= 200) out.displayName = displayName
  if (typeof meta.contextWindow === "number" && Number.isInteger(meta.contextWindow) && meta.contextWindow > 0) out.contextWindow = meta.contextWindow
  if (meta.vision === true) out.vision = true
  const status = meta.status
  if (typeof status === "string" && RETIRED_STATUS_WORDS.some((word) => status.toLowerCase().includes(word))) out.status = status
  return out
}

/** 抽取（discover——上游 `/models` 条目 → 保留集四字段；各源：`display_name` ∥ `name` ∥ `context_window` ∥ `context_length` ∥
 *  `max_model_len` ∥ `supports_image_in` ∥ `input_modalities` ∥ `status`；未收录不采、形不符即略）。 */
export function extractModelMeta(item, id) {
  const raw = item !== null && typeof item === "object" && !Array.isArray(item) ? item : {}
  const displayName = typeof raw.display_name === "string" && raw.display_name.trim() !== "" ? raw.display_name : raw.name
  const contextWindow = [raw.context_window, raw.context_length, raw.max_model_len].find((value) => value !== undefined && value !== null)
  const vision = raw.supports_image_in === true || (Array.isArray(raw.input_modalities) && raw.input_modalities.includes("image"))
  return cleanModelMeta({ displayName, contextWindow, vision: vision === true ? true : undefined, status: raw.status }, id)
}

/** 写面过滤（POST/PATCH `modelMeta`——§2.2）：非对象 ⇒ 抛（调用方转 400）∥ 白名单过滤 + 形不符即略 + 与提交
 *  `models` 求交（只含开放清单——非开放模型不入库）；≥1 字段才入键（零占位）。 */
export function filterModelMeta(raw, models) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("modelMeta 须为对象（键 = 上游模型名——值 = { displayName ∥ contextWindow ∥ vision ∥ status }）")
  }
  const out = {}
  for (const [model, meta] of Object.entries(raw)) {
    if (!models.includes(model)) continue
    const clean = cleanModelMeta(meta, model)
    if (Object.keys(clean).length > 0) out[model] = clean
  }
  return out
}

/** 校验类错误 ⇒ 400 `invalid_request_error`（消息 = 单源原报文；库与运行时零变——§2.2）。 */
function asInvalidRequest(fn) {
  try {
    return fn()
  } catch (e) {
    if (e instanceof HttpError) throw e
    throw new HttpError("invalid_request_error", e.message)
  }
}

/**
 * 注册 provider 管理面六端点（§2.2）：`db` = openDatabase 产物 ∥ `config` = 校验后配置 ∥
 * `runtime` = gateway 注册行装配期引导的**同一实例**（换表两族同见）。
 * 注入口径（批内件替身）：`env` ∥ `fetchImpl` ∥ `discoverTimeoutMs` 走可覆盖参数（缺省 = 生产行为不变）；
 * `fetchImpl` 缺省 = `proxyFetch`（KD-SV-55——discover 出口同转发；无代理串 ⇒ 原生 fetch 直连）。
 */
export function registerProviderAdminRoutes(routes, { db, config, runtime, log = null, env = process.env, fetchImpl = proxyFetch, discoverTimeoutMs = PROVIDER_DISCOVER_TIMEOUT_MS } = {}) {
  if (!db || !config || !runtime) throw new Error("registerProviderAdminRoutes：缺少 db ∥ config ∥ runtime（同一实例——装配面接线）")

  /** 候选注册表（保存路径②——`env:` 解析；顶层代理串同源注入——旗随保存热生效：KD-SV-55）。 */
  const buildCandidate = (entries) => createProviderRegistry(entries, { env, engineModel: config.embedding?.model ?? null, proxyUri: config.proxy?.uri ?? null })

  /** 行定位（id 非法/不存在 ⇒ null——调用方转 404）。 */
  const findRow = (rawId) => {
    const id = Number(rawId)
    if (!Number.isInteger(id)) return null
    return db.prepare("SELECT * FROM providers WHERE id = ?").get(id) ?? null
  }

  /** provider 名冲突检查（重名 ⇒ 400；`exceptId` = 自身改 name 时豁免）。 */
  const assertNameFree = (name, { exceptId = null } = {}) => {
    if (listProviderEntries(db).some((entry) => entry.name === name && entry.id !== exceptId)) {
      throw new HttpError("invalid_request_error", `provider 名已存在：${name}（重名——库与运行时零变）`)
    }
  }

  routes.add("GET", "/api/admin/providers", (req, res) => {
    requireAdmin(db, req)
    const providers = listProviderEntries(db).map((entry) => ({
      id: entry.id,
      name: entry.name,
      baseURL: entry.baseURL,
      apiKey: maskApiKey(entry.apiKey), // 回显形——明文不出库面（§2.2）
      models: entry.models,
      settings: entry.settings, // 模型设置全图（v4——读面；§2.2）
      modelMeta: entry.modelMeta, // 上游模型元数据留存图（v7——恒在场；未存 ⇒ {}；§2.2）
      proxy: entry.proxy, // 上游代理旗（v9——布尔；KD-SV-55）
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }))
    sendJson(res, 200, { providers })
  })

  routes.add("POST", "/api/admin/providers", async (req, res) => {
    requireAdmin(db, req)
    const body = bodyFields(await readJsonBody(req))
    const entry = asInvalidRequest(() => validateProviderEntry(
      { name: body.name, baseURL: body.baseURL, apiKey: body.apiKey ?? "", models: body.models ?? [], proxy: body.proxy },
      { where: "provider" },
    ))
    // `modelMeta` 期望图（白名单 + 形不符即略 + 与提交 `models` 求交；缺省 ⇒ `{}`；非对象 ⇒ 400 库零变）
    const modelMeta = asInvalidRequest(() => filterModelMeta(body.modelMeta === undefined ? {} : body.modelMeta, entry.models))
    assertNameFree(entry.name)
    const candidate = asInvalidRequest(() => buildCandidate([...listProviderEntries(db), entry])) // ②
    const now = new Date().toISOString()
    const info = db.prepare("INSERT INTO providers (name, base_url, api_key, models_json, proxy, model_meta_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(entry.name, entry.baseURL, entry.apiKey, JSON.stringify(entry.models), entry.proxy === true ? 1 : 0, JSON.stringify(modelMeta), now, now) // ③
    runtime.set(candidate) // ④ 原子换表（零重启）
    const id = Number(info.lastInsertRowid)
    log?.info("provider_created", { id, name: entry.name })
    sendJson(res, 200, { ok: true, id })
  })

  routes.add("PATCH", "/api/admin/providers/:id", async (req, res, ctx) => {
    requireAdmin(db, req)
    const row = findRow(ctx.params.id)
    if (!row) throw new HttpError("not_found", `provider 不存在：${ctx.params.id}`)
    const body = bodyFields(await readJsonBody(req))
    const current = rowToEntry(row)
    // `settings` 键级合并（值 null ⇒ 删键；未出现键 = 不动）——合并后与其余字段同走单源校验
    const settings = asInvalidRequest(() => mergeProviderSettings(current.settings, body.settings))
    const entry = asInvalidRequest(() => validateProviderEntry({
      name: body.name !== undefined ? body.name : current.name,
      baseURL: body.baseURL !== undefined ? body.baseURL : current.baseURL,
      apiKey: body.apiKey !== undefined ? body.apiKey : current.apiKey, // `apiKey: ""` = 清除（§2.2）
      models: body.models !== undefined ? body.models : current.models,
      proxy: body.proxy !== undefined ? body.proxy : current.proxy, // 布尔直写；缺省 = 不动（§2.2）
      settings,
    }, { where: "provider" }))
    if (entry.name !== current.name) assertNameFree(entry.name, { exceptId: current.id })
    // `modelMeta` 期望图：键在场 = 提交图（白名单 + 形不符即略 + 求交）；缺省 = 现存图按求交滑动（删项随之滑落——零孤儿）
    const modelMeta = asInvalidRequest(() => filterModelMeta(body.modelMeta === undefined ? current.modelMeta : body.modelMeta, entry.models))
    const candidate = asInvalidRequest(() => buildCandidate(
      listProviderEntries(db).map((item) => (item.id === current.id ? { ...entry, id: current.id } : item)),
    ))
    db.prepare("UPDATE providers SET name = ?, base_url = ?, api_key = ?, models_json = ?, proxy = ?, settings_json = ?, model_meta_json = ?, updated_at = ? WHERE id = ?")
      .run(entry.name, entry.baseURL, entry.apiKey, JSON.stringify(entry.models), entry.proxy === true ? 1 : 0, JSON.stringify(entry.settings), JSON.stringify(modelMeta), new Date().toISOString(), current.id)
    runtime.set(candidate)
    log?.info("provider_updated", { id: current.id, name: entry.name })
    sendJson(res, 200, { ok: true, id: current.id })
  })

  routes.add("DELETE", "/api/admin/providers/:id", (req, res, ctx) => {
    requireAdmin(db, req)
    const row = findRow(ctx.params.id)
    if (!row) throw new HttpError("not_found", `provider 不存在：${ctx.params.id}`)
    const rest = listProviderEntries(db).filter((entry) => entry.id !== row.id)
    const candidate = asInvalidRequest(() => buildCandidate(rest))
    db.prepare("DELETE FROM providers WHERE id = ?").run(row.id) // 硬删——用量行零触（§2.2）
    runtime.set(candidate)
    log?.info("provider_deleted", { id: row.id, name: row.name })
    sendJson(res, 200, { ok: true, id: row.id })
  })

  routes.add("POST", "/api/admin/providers/discover", async (req, res) => {
    requireAdmin(db, req)
    const body = bodyFields(await readJsonBody(req))
    // 草稿 baseURL 过单源校验（`name` 占位 ∥ `models` 空占位——发现只用 `baseURL`）；apiKey 明传优先，否则取库内该 provider 的 key
    const draft = asInvalidRequest(() => validateProviderEntry(
      { name: "discover-draft", baseURL: body.baseURL, apiKey: "", models: [] },
      { where: "body" },
    ))
    // `providerId` 条目（key ∥ 代理旗双兜底面；id 非法/不存在 ⇒ 404——仅 key 兜底径判，沿原行为）
    const storedRow = body.providerId !== undefined && body.providerId !== null ? findRow(body.providerId) : null
    let apiKey = ""
    if (body.apiKey !== undefined && body.apiKey !== null) {
      apiKey = body.apiKey
    } else if (storedRow !== null) {
      apiKey = storedRow.api_key
    } else if (body.providerId !== undefined && body.providerId !== null) {
      throw new HttpError("not_found", `provider 不存在：${body.providerId}`)
    }
    // 代理判定（KD-SV-55——与 chat 转发同判定）：明传优先 → providerId 条目旗兜底 → 皆无 ⇒ 直连
    let proxy = false
    if (body.proxy !== undefined) {
      if (typeof body.proxy !== "boolean") {
        throw new HttpError("invalid_request_error", `discover.proxy 须为布尔（true ∥ false——现 ${JSON.stringify(body.proxy)}）`)
      }
      proxy = body.proxy
    } else if (storedRow !== null) {
      proxy = storedRow.proxy === 1
    }
    const proxyUri = proxy === true ? (config.proxy?.uri ?? null) : null
    const resolvedKey = asInvalidRequest(() => resolveProviderKey(apiKey, { env, where: "discover.apiKey" })) // `env:` 引用服务端解析
    let upstream
    try {
      upstream = await fetchImpl(upstreamUrl(draft.baseURL, "/models"), {
        method: "GET",
        headers: resolvedKey ? { authorization: `Bearer ${resolvedKey}` } : {}, // Authorization 同转发口径——key 空不发
        signal: AbortSignal.timeout(discoverTimeoutMs),
      }, proxyUri)
    } catch (e) {
      log?.warn("provider_discover_failed", { baseURL: draft.baseURL, message: e.message })
      throw new HttpError("upstream_error", `模型发现失败（上游不可达或超时）：${e.message}——请检查上游可达性后重试`)
    }
    let text
    try {
      text = await upstream.text()
    } catch (e) {
      log?.warn("provider_discover_failed", { baseURL: draft.baseURL, message: e.message })
      throw new HttpError("upstream_error", `模型发现失败（响应读取失败）：${e.message}——请检查上游可达性后重试`)
    }
    let payload
    try {
      payload = JSON.parse(text)
    } catch {
      log?.warn("provider_discover_failed", { baseURL: draft.baseURL, message: `非 JSON（HTTP ${upstream.status}）` })
      throw new HttpError("upstream_error", `模型发现失败：上游响应非 JSON（HTTP ${upstream.status}）——请检查上游可达性后重试`)
    }
    if (payload === null || typeof payload !== "object" || !Array.isArray(payload.data)) {
      log?.warn("provider_discover_failed", { baseURL: draft.baseURL, message: `无 data 清单（HTTP ${upstream.status}）` })
      throw new HttpError("upstream_error", `模型发现失败：上游响应无 data 清单（HTTP ${upstream.status}）——请检查上游可达性后重试`)
    }
    const models = []
    const modelMeta = {}
    const seen = new Set()
    for (const item of payload.data) {
      const id = item?.id
      if (typeof id !== "string" || id === "" || seen.has(id)) continue // 去重首见（与 models 同集）
      seen.add(id)
      models.push(id)
      const meta = extractModelMeta(item, id)
      if (Object.keys(meta).length > 0) modelMeta[id] = meta // ≥1 字段才入键（缺就空着——零兜底值、零占位）
    }
    sendJson(res, 200, { models, modelMeta }) // 草稿键经 body 传入不落库（§2.2）
  })

  routes.add("GET", "/api/admin/providers/presets", (req, res) => {
    requireAdmin(db, req)
    // 缺省展开 = `expandProviderEntry`（单源——ops/presets.mjs ∥ KD-SV-17）；表零密钥（响应无 apiKey 字段）
    const presets = Object.keys(SERVER_PRESETS).map((preset) => {
      const entry = expandProviderEntry({ preset })
      return { preset, name: entry.name, baseURL: entry.baseURL, models: entry.models }
    })
    sendJson(res, 200, { presets })
  })
}
