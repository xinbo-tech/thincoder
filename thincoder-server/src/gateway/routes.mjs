/**
 * routes.mjs — OpenAI 面处理（gateway/API.md §2）：chat ∥ models ∥ embeddings 三面。
 *
 * 七步链（PROJECT.md §2）：[2] 鉴权（团队 key——sha256 查库）→ [3] 配额准入 → [4] `provider/model` 复合键派发
 * （首斜杠切分——上游请求体 model = 余段；记账 model = 对外标识）→ [5] 转发（真 key 代持）→ [6] 透传 + tap
 * → [7] 记账；[5]–[7] 归 forward.mjs。
 * provider 表 = 运行时箱（装配期引导——种子导入 → 构建）；`/v1/models` 与派发读 `runtime.get()`——保存即换表
 * （零重启；在途 = 派发时快照——gateway/API.md §2.2）。
 * 鉴权三态不区分（无 key ∥ 未知 ∥ 吊销 ⇒ 401 `invalid_api_key`——防信息泄露）；准入前拒打不落用量。
 * embeddings = 内网引擎转发（地址配置面——OPS §1 `embedding` 段；响应透传 + 同形记账）。
 */
import { verifyKey } from "../accounts/keys.mjs"
import { assertQuota } from "../metering/quota.mjs"
import { HttpError, sendJson } from "./errors.mjs"
import { forwardChat, forwardRequest, upstreamHeaders, upstreamUrl } from "./forward.mjs"
import { bootstrapProviderRuntime, modelList } from "./providers.mjs"
import { readJsonBody } from "./server.mjs"

/** 团队 key 鉴权：`Authorization: Bearer <key>`（唯一接受形——API.md §1）；三态不区分 ⇒ 401。 */
export function requireApiKey(db, req) {
  const match = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization ?? ""))
  const auth = match ? verifyKey(db, match[1].trim()) : null
  if (!auth) throw new HttpError("invalid_api_key", "无效的 API key（Authorization: Bearer <团队 key>）")
  return auth
}

/** 注册 OpenAI 三面（G1 注册行制）：`db` = openDatabase 产物 ∥ `config` = 校验后配置。
 *  provider 运行时（装配期引导：种子导入 → 构建）未传 ⇒ 本行引导并返回；provider 管理面接收**同一实例**
 *  （换表两族同见——gateway/API.md §2.2）。`env` = 构建期 `env:` 解析注入面（缺省 process.env）。 */
export function registerGatewayRoutes(routes, { db, config, runtime = null, log = null, env = process.env } = {}) {
  if (!db || !config) throw new Error("registerGatewayRoutes：缺少 db ∥ config（装配面须传全）")
  const providerRuntime = runtime ?? bootstrapProviderRuntime({ db, config, log, env })

  routes.add("POST", "/v1/chat/completions", async (req, res, ctx) => {
    const ts = Date.now() // 账务行 ts = 请求开始
    const { keyId, member } = requireApiKey(db, req) // [2]
    assertQuota(db, member) // [3] 超额 ⇒ 429 quota_exceeded（含已用/额度）
    const body = await readJsonBody(req) // 413（读限）∥ 400（非 JSON）
    if (typeof body?.model !== "string" || body.model === "") {
      throw new HttpError("invalid_request_error", "请求体缺 model 字段")
    }
    const dispatch = providerRuntime.get().dispatch(body.model) // [4] 复合键派发（裸名 ∥ 未命中 ⇒ 404 model_not_found；派发时快照）
    if (dispatch.miss) throw new HttpError(dispatch.miss.body.error.code, dispatch.miss.body.error.message)
    await forwardChat(req, res, {
      db, log: ctx.log, member, keyId,
      model: body.model, // 记账 model = 对外标识（provider/model——与 /v1/models 清单同形）
      upstreamModel: dispatch.model, // 上游请求体 model = 首斜杠余段（上游模型名——API.md §2.1）
      provider: dispatch.provider, body, ts,
    })
  })

  routes.add("GET", "/v1/models", (req, res) => {
    requireApiKey(db, req) // 团队 key（API.md §1——AC-1 三态门）
    sendJson(res, 200, modelList(providerRuntime.get())) // 运行时派生（保存即换表——§2.2）
  })

  // 嵌入面 = 内网引擎转发（引擎模型 = `embedding.model`——非 provider 面 ∥ 无前缀；其余 ⇒ 404）：
  // 响应透传（非流式 JSON——usage 从响应体拾取）∥ 记账 `endpoint='embeddings'`（AC-6 ∥ N3）。
  routes.add("POST", "/v1/embeddings", async (req, res, ctx) => {
    const ts = Date.now() // 账务行 ts = 请求开始
    const { keyId, member } = requireApiKey(db, req) // [2]
    assertQuota(db, member) // [3]
    const body = await readJsonBody(req) // 413（读限）∥ 400（非 JSON）
    if (typeof body?.model !== "string" || body.model === "") {
      throw new HttpError("invalid_request_error", "请求体缺 model 字段")
    }
    if (body.model !== providerRuntime.get().engineModel()) { // [4] 引擎模型外 ⇒ 404 model_not_found（引擎面 = 单独命名空间）
      throw new HttpError("model_not_found", `模型未配置：${body.model}`)
    }
    await forwardRequest(req, res, {
      db,
      log: ctx.log,
      member,
      keyId,
      endpoint: "embeddings",
      model: body.model,
      ts,
      streaming: false, // 嵌入面 = 非流式（响应 JSON 透传；无 KD-SV-5 注入——只属 chat 流式）
      url: upstreamUrl(config.embedding.baseURL, "/embeddings"),
      headers: upstreamHeaders(config.embedding), // 引擎 key 代持（空 ⇒ 不发 Authorization）
      payload: body, // 原样转发（不注入不改写）
    })
  })

  return providerRuntime
}
