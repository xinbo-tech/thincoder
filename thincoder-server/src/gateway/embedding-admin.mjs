/**
 * embedding-admin.mjs — 向量服务面（控制台——仅 admin；gateway/API.md §2.4 ∥ KD-SV-30）：
 * `GET /api/admin/embedding`（引擎配置真值——零密钥） ∥ `POST /api/admin/embedding/test`（探活/试跑——**服务端代发**）。
 *
 * 探活/试跑 = 服务端 `/embeddings` 最小调用（引擎 key 代持——浏览器零涉）；成败自含形（**不走统一错误信封**——
 * 沿 `/healthz` 先例）：成功 ⇒ 200 `{ ok:true, dimensions, ms }`（`dimensions` = `data[0].embedding.length`）；
 * 失败 ⇒ 200 `{ ok:false, error:{ kind, message }, ms }`——`kind` 四归类：`timeout` ∥ `unreachable` ∥ `http_error` ∥ `bad_response`。
 * 超时 10s（沿发现家族——`EMBEDDING_TEST_TIMEOUT_MS`）；**不落库不计量**（不经 usage 记账路径 ∥ 不查配额）；
 * body `{ text?, baseURL?, model?, apiKey? }`（`text` 缺省 = 内置短探针文本）。
 *
 * 草稿口径（§2.4——KD-SV-54 口径镜像）：**标量三项 = 明传优先**——在场 ⇒ 按明传值探活（未保存亦可先验）∥
 * 缺省 ⇒ 运行配置回落；**掩码回显形（`…`+末 4）不作明传值**（⇒ 回落）；`apiKey: ""` = 清除勾（显式空——不发
 * Authorization）；`env:` 引用按字面值探发（引用解析面 = 保存/载入）。
 * 判权 = `requireAdmin`（`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401）；错误码全沿用（零新码）；写端点 JSON 型门 = 服务层径。
 */
import { requireAdmin } from "../accounts/session.mjs"
import { isMaskEcho } from "./config-admin.mjs"
import { sendJson } from "./errors.mjs"
import { upstreamHeaders, upstreamUrl } from "./forward.mjs"
import { readJsonBody } from "./server.mjs"

/** 探活/试跑超时（§2.4——10s；注入口径 = 注册参数 `timeoutMs`）。 */
export const EMBEDDING_TEST_TIMEOUT_MS = 10000

/** 内置短探针文本（body `{ text? }` 缺省——§2.4）。 */
export const EMBEDDING_PROBE_TEXT = "ping"

/** 探活目标解析（§2.4——标量三项明传优先：非空（trim）字符串 ⇒ 按明传值；缺省 ∥ 空串/空白串 ⇒ 运行配置回落）。
 *  `apiKey` 三态 = 未编辑 ⇒ 不携（回落——含掩码回显形误送回） ∥ 编辑 ⇒ 明传（含 `""` = 清除勾即显式空）∥ 其余（非字符串）⇒ 回落。 */
export function resolveProbeTarget(body, runtime) {
  const pick = (value, fallback) => (typeof value === "string" && value.trim() !== "" ? value : fallback)
  const apiKey = typeof body?.apiKey === "string" && !isMaskEcho(body.apiKey) ? body.apiKey : (runtime.apiKey ?? "")
  return { baseURL: pick(body?.baseURL, runtime.baseURL), model: pick(body?.model, runtime.model), apiKey }
}

/** 失败自含形（不走统一错误信封——UI 直接渲染失败分类；§2.4）。 */
function failureBody(kind, message, ms) {
  return { ok: false, error: { kind, message }, ms }
}

/** 响应文本摘录（`http_error` 诊断消息——截断至 200 字符；读体整段沿同族发现面口径）。 */
async function textExcerpt(response, limit = 200) {
  try {
    return (await response.text()).trim().slice(0, limit)
  } catch {
    return ""
  }
}

/**
 * 注册向量服务面两端点（§2.4）：`db` = openDatabase 产物 ∥ `config` = 校验后配置（`embedding` 段 = 地址/模型/key 真值）。
 * 注入口径（批内件替身）：`fetchImpl` ∥ `timeoutMs` 走可覆盖参数（缺省 = 生产行为不变）。
 */
export function registerEmbeddingAdminRoutes(routes, { db, config, log = null, fetchImpl = fetch, timeoutMs = EMBEDDING_TEST_TIMEOUT_MS } = {}) {
  if (!db || !config) throw new Error("registerEmbeddingAdminRoutes：缺少 db ∥ config（装配面须传全）")

  routes.add("GET", "/api/admin/embedding", (req, res) => {
    requireAdmin(db, req)
    sendJson(res, 200, { baseURL: config.embedding.baseURL, model: config.embedding.model }) // `apiKey` 不出响应（零密钥下发——§2.4）
  })

  routes.add("POST", "/api/admin/embedding/test", async (req, res) => {
    requireAdmin(db, req) // user ⇒ 403 ∥ 无/过期会话 ⇒ 401（同族口径）
    const body = await readJsonBody(req)
    const text = typeof body?.text === "string" && body.text !== "" ? body.text : EMBEDDING_PROBE_TEXT
    const target = resolveProbeTarget(body, config.embedding) // 草稿三项明传优先（未保存亦可先验）；缺省 ⇒ 运行配置回落
    const started = Date.now()
    const signal = AbortSignal.timeout(timeoutMs) // 超时中止（分类判据 = `signal.aborted`——超时时必为 true）
    let upstream
    try {
      upstream = await fetchImpl(upstreamUrl(target.baseURL, "/embeddings"), {
        method: "POST",
        headers: upstreamHeaders(target), // 引擎 key 代持（空 ⇒ 不发 Authorization——同转发口径）
        body: JSON.stringify({ model: target.model, input: text }),
        signal,
      })
    } catch (e) {
      const kind = signal.aborted ? "timeout" : "unreachable" // 连不上 ∥ 超时——四 kind 之二
      const message = kind === "timeout" ? `引擎响应超时（超时 ${timeoutMs}ms）：${e.message}` : `引擎不可达：${e.message}`
      log?.warn("embedding_test_failed", { kind, baseURL: target.baseURL, message: e.message })
      sendJson(res, 200, failureBody(kind, message, Date.now() - started))
      return
    }
    if (!upstream.ok) { // 非 2xx ⇒ `http_error`（诊断消息 = 状态 + 响应摘录）
      const excerpt = await textExcerpt(upstream)
      const message = `引擎返回 HTTP ${upstream.status}${excerpt ? `：${excerpt}` : ""}`
      log?.warn("embedding_test_failed", { kind: "http_error", baseURL: target.baseURL, status: upstream.status })
      sendJson(res, 200, failureBody("http_error", message, Date.now() - started))
      return
    }
    let payload
    try {
      payload = await upstream.json()
    } catch (e) {
      const kind = signal.aborted ? "timeout" : "bad_response" // 读体超时 ⇒ timeout；非 JSON ⇒ bad_response
      const message = kind === "timeout" ? `引擎响应超时（超时 ${timeoutMs}ms）：${e.message}` : `引擎响应非 JSON：${e.message}`
      log?.warn("embedding_test_failed", { kind, baseURL: target.baseURL, message: e.message })
      sendJson(res, 200, failureBody(kind, message, Date.now() - started))
      return
    }
    const embedding = payload?.data?.[0]?.embedding
    if (!Array.isArray(embedding)) { // 形体不符（缺 `data[0].embedding` 数组）⇒ `bad_response`
      const message = "引擎响应形不符：缺 data[0].embedding（数组）"
      log?.warn("embedding_test_failed", { kind: "bad_response", baseURL: target.baseURL, message })
      sendJson(res, 200, failureBody("bad_response", message, Date.now() - started))
      return
    }
    sendJson(res, 200, { ok: true, dimensions: embedding.length, ms: Date.now() - started })
  })
}
