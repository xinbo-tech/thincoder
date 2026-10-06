/**
 * provider-admin.mjs — provider 管理面（控制台——仅 admin；gateway/API.md §2.2）：
 * 列表 ∥ 新增 ∥ 修改 ∥ 删除 ∥ 模型发现 ∥ 预设清单（六端点）。
 *
 * 保存即热生效（四步——§2.2）：① 校验（单源 = `ops/config.mjs` 导出——与配置种子同规）→
 * ② 建候选注册表（`env:` 解析——缺位 ⇒ 400 不落库）→ ③ 落库 → ④ `runtime.set(候选)`（原子换表）；
 * 失败 ⇒ 库与运行时零变。密钥回显掩码（空 ⇒ "" ∥ `env:` 原文 ∥ 明文 ⇒ `…` + 末 4）；
 * 密钥值永不入日志（日志只带 provider 名/id 与动作）。模型发现 = `GET {baseURL}/models`（Authorization 同转发——
 * 空不发；超时 10s 可覆盖；失败 ⇒ 502 `upstream_error`——手填降级照常；草稿键不落库）。
 * 判权 = `requireAdmin`（`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401）；错误码全沿用（零新码）；写端点 JSON 型门 = 服务层径。
 */
import { requireAdmin } from "../accounts/session.mjs"
import { validateProviderEntry } from "../ops/config.mjs"
import { SERVER_PRESETS, expandProviderEntry } from "../ops/presets.mjs"
import { HttpError, sendJson } from "./errors.mjs"
import { upstreamUrl } from "./forward.mjs"
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

/** 入参归一：非对象（含 null/数组）⇒ `{}`——字段判据归单源校验（缺 ⇒ 报对应错误）。 */
function bodyFields(body) {
  return body !== null && typeof body === "object" && !Array.isArray(body) ? body : {}
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
 * 注入口径（批内件替身）：`env` ∥ `fetchImpl` ∥ `discoverTimeoutMs` 走可覆盖参数（缺省 = 生产行为不变）。
 */
export function registerProviderAdminRoutes(routes, { db, config, runtime, log = null, env = process.env, fetchImpl = fetch, discoverTimeoutMs = PROVIDER_DISCOVER_TIMEOUT_MS } = {}) {
  if (!db || !config || !runtime) throw new Error("registerProviderAdminRoutes：缺少 db ∥ config ∥ runtime（同一实例——装配面接线）")

  /** 候选注册表（保存路径②——`env:` 解析；抛出归调用方转 400/拒启）。 */
  const buildCandidate = (entries) => createProviderRegistry(entries, { env, engineModel: config.embedding?.model ?? null })

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
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }))
    sendJson(res, 200, { providers })
  })

  routes.add("POST", "/api/admin/providers", async (req, res) => {
    requireAdmin(db, req)
    const body = bodyFields(await readJsonBody(req))
    const entry = asInvalidRequest(() => validateProviderEntry(
      { name: body.name, baseURL: body.baseURL, apiKey: body.apiKey ?? "", models: body.models ?? [] },
      { where: "provider" },
    ))
    assertNameFree(entry.name)
    const candidate = asInvalidRequest(() => buildCandidate([...listProviderEntries(db), entry])) // ②
    const now = new Date().toISOString()
    const info = db.prepare("INSERT INTO providers (name, base_url, api_key, models_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(entry.name, entry.baseURL, entry.apiKey, JSON.stringify(entry.models), now, now) // ③
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
    const entry = asInvalidRequest(() => validateProviderEntry({
      name: body.name !== undefined ? body.name : current.name,
      baseURL: body.baseURL !== undefined ? body.baseURL : current.baseURL,
      apiKey: body.apiKey !== undefined ? body.apiKey : current.apiKey, // `apiKey: ""` = 清除（§2.2）
      models: body.models !== undefined ? body.models : current.models,
    }, { where: "provider" }))
    if (entry.name !== current.name) assertNameFree(entry.name, { exceptId: current.id })
    const candidate = asInvalidRequest(() => buildCandidate(
      listProviderEntries(db).map((item) => (item.id === current.id ? { ...entry, id: current.id } : item)),
    ))
    db.prepare("UPDATE providers SET name = ?, base_url = ?, api_key = ?, models_json = ?, updated_at = ? WHERE id = ?")
      .run(entry.name, entry.baseURL, entry.apiKey, JSON.stringify(entry.models), new Date().toISOString(), current.id)
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
    let apiKey = ""
    if (body.apiKey !== undefined && body.apiKey !== null) {
      apiKey = body.apiKey
    } else if (body.providerId !== undefined && body.providerId !== null) {
      const stored = findRow(body.providerId)
      if (!stored) throw new HttpError("not_found", `provider 不存在：${body.providerId}`)
      apiKey = stored.api_key
    }
    const resolvedKey = asInvalidRequest(() => resolveProviderKey(apiKey, { env, where: "discover.apiKey" })) // `env:` 引用服务端解析
    let upstream
    try {
      upstream = await fetchImpl(upstreamUrl(draft.baseURL, "/models"), {
        method: "GET",
        headers: resolvedKey ? { authorization: `Bearer ${resolvedKey}` } : {}, // Authorization 同转发口径——key 空不发
        signal: AbortSignal.timeout(discoverTimeoutMs),
      })
    } catch (e) {
      log?.warn("provider_discover_failed", { baseURL: draft.baseURL, message: e.message })
      throw new HttpError("upstream_error", `模型发现失败（上游不可达或超时）：${e.message}——可手填模型清单降级`)
    }
    let text
    try {
      text = await upstream.text()
    } catch (e) {
      log?.warn("provider_discover_failed", { baseURL: draft.baseURL, message: e.message })
      throw new HttpError("upstream_error", `模型发现失败（响应读取失败）：${e.message}——可手填模型清单降级`)
    }
    let payload
    try {
      payload = JSON.parse(text)
    } catch {
      log?.warn("provider_discover_failed", { baseURL: draft.baseURL, message: `非 JSON（HTTP ${upstream.status}）` })
      throw new HttpError("upstream_error", `模型发现失败：上游响应非 JSON（HTTP ${upstream.status}）——可手填模型清单降级`)
    }
    if (payload === null || typeof payload !== "object" || !Array.isArray(payload.data)) {
      log?.warn("provider_discover_failed", { baseURL: draft.baseURL, message: `无 data 清单（HTTP ${upstream.status}）` })
      throw new HttpError("upstream_error", `模型发现失败：上游响应无 data 清单（HTTP ${upstream.status}）——可手填模型清单降级`)
    }
    const models = [...new Set(payload.data.map((item) => item?.id).filter((id) => typeof id === "string" && id !== ""))]
    sendJson(res, 200, { models }) // 草稿键经 body 传入不落库（§2.2）
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
