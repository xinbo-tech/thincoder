/**
 * errors.mjs — 错误形与发送助手（全码单源 = gateway/API.md §3）。
 *
 * 统一形：`{ error: { message, type, code } }`。本表 = 本服务自产错误（含账号面码）；
 * 上游已到达的错误（4xx/5xx）不包不改、原样透传（转发面行为——forward.mjs；API.md §3）。
 * `type` 未由设计钉死处沿 OpenAI 惯例填；代码面判据 = `code`。
 */

/** 全码表：code → { status, type }（gateway/API.md §3 逐行——含账号面码）。 */
export const ERROR_CODES = {
  invalid_api_key: { status: 401, type: "invalid_request_error" },   // 无 key ∥ 未知 ∥ 吊销（不区分——防信息泄露）
  unauthorized: { status: 401, type: "invalid_request_error" },      // 无 ∥ 过期会话
  invalid_credentials: { status: 401, type: "invalid_request_error" }, // 登录失败 ∥ 旧密错误（同措辞同日径）
  forbidden: { status: 403, type: "invalid_request_error" },         // 角色不足
  not_found: { status: 404, type: "invalid_request_error" },         // 成员 ∥ key ∥ 路由不存在
  model_not_found: { status: 404, type: "invalid_request_error" },   // 未配置模型（KD-SV-4 派发未命中）
  invalid_request_error: { status: 400, type: "invalid_request_error" }, // body 非 JSON ∥ 缺 model
  payload_too_large: { status: 413, type: "invalid_request_error" }, // 请求体超上限（32 MiB）
  quota_exceeded: { status: 429, type: "insufficient_quota" },       // 超额（message 含已用/额度）
  rate_limited: { status: 429, type: "rate_limit_error" },           // per-model 限流（message 含模型/限值；`Retry-After` 秒——KD-SV-35）
  too_many_attempts: { status: 429, type: "rate_limit_error" },      // 登录锁定期（`Retry-After` 秒；两维同文案——ACCOUNTS §2）
  upstream_error: { status: 502, type: "upstream_error" },           // 上游不可达
  internal_error: { status: 500, type: "server_error" },             // 500 兜底（处理函数自身异常——API.md §3 表行）
}

/** 带 HTTP 语义的错误（body 读限等地方抛——分派层转统一错误形）。
 *  `headers` = 可选取值（附加响应头——如 `Retry-After`；`failRequest` 转交 `sendError`）。 */
export class HttpError extends Error {
  constructor(code, message, { headers = null } = {}) {
    super(message)
    this.name = "HttpError"
    this.code = ERROR_CODES[code] ? code : "internal_error"
    this.status = ERROR_CODES[this.code].status
    this.headers = headers
  }
}

/** 错误体（统一形——code 决定 type）。 */
export function errorBody(code, message) {
  const entry = ERROR_CODES[code] ?? ERROR_CODES.internal_error
  const finalCode = ERROR_CODES[code] ? code : "internal_error"
  return { error: { message, type: entry.type, code: finalCode } }
}

/** 发 JSON 响应（headers 已发出 ⇒ 不动——返回 false）；`headers` = 附加响应头（如 `Retry-After`）。 */
export function sendJson(res, status, payload, { headers = null } = {}) {
  if (res.headersSent) return false
  const text = JSON.stringify(payload)
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    ...(headers ?? {}),
  })
  res.end(text)
  return true
}

/** 发错误响应（状态/类型取自全码表；`headers` = 附加响应头——`HttpError.headers` 直通）。 */
export function sendError(res, code, message, { headers = null } = {}) {
  const entry = ERROR_CODES[code] ?? ERROR_CODES.internal_error
  const finalCode = ERROR_CODES[code] ? code : "internal_error"
  return sendJson(res, entry.status, errorBody(finalCode, message), { headers })
}
