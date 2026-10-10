/**
 * proxy-admin.mjs — 代理连通测试面（控制台——仅 admin；gateway/API.md §2.4 ∥ KD-SV-60 · 台账 #1158）：
 * `POST /api/admin/proxy/test`（**真打**——`webui/WEBUI.md` §2.7 系统页「服务配置」卡内）。
 *
 * body `{ uri, target }`（**双必传**——trim 非空）；`uri` 须 `http:` URL（口径沿 `validateProxyConfig`——`ops/OPS.md` §1
 * 单源复用）∥ `target` 须 http(s) URL；缺 ∥ 非法 ⇒ 400 `invalid_request_error`（零副作用——无网络触面）。
 * 服务端经 `proxyFetch(target, { method:"GET", signal }, uri)` 发真实 GET（**同传输 ∥ 同 loopback 旁路判定**——读数 =
 * 生产链行为如实镜像）；成功（收到任一 HTTP 响应——**含非 2xx**）⇒ 200 `{ ok:true, status, ms }`；传输层失败 ⇒
 * 200 `{ ok:false, error:{ kind, message }, ms }`——`kind` 二分类：`timeout`（超预算）∥ `unreachable`（连不上 ∥ CONNECT 拒
 * ∥ TLS 败——message 携底层诊断）。
 *
 * 自含形（**不走统一错误信封**——沿 `/healthz`/向量探活先例）；超时 10s（`PROXY_TEST_TIMEOUT_MS`——注册参数可覆盖）；
 * **零落库零计费零审计**（不经 usage/配额/审计路径——失败仅 `log.warn` 一行）；判权 = `requireAdmin`（user ⇒ 403 ∥
 * 无/过期会话 ⇒ 401）；错误码全沿用（零新码）；写端点 JSON 型门 = 服务层径。零第三方（KD-SV-55 传输面零触）。
 */
import { requireAdmin } from "../accounts/session.mjs"
import { validateProxyConfig } from "../ops/config.mjs"
import { HttpError, sendJson } from "./errors.mjs"
import { proxyFetch } from "./proxy.mjs"
import { readJsonBody } from "./server.mjs"

/** 连通测试超时（§2.4——10s；沿探活/发现家族；注入口径 = 注册参数 `timeoutMs`）。 */
export const PROXY_TEST_TIMEOUT_MS = 10000

/** 入参判（§2.4——双必传 trim 非空 ∥ `uri` 仅 `http:` ∥ `target` 仅 http(s)）：出 = `{ uri, target }`；不合 ⇒ 抛（调用面转 400）。 */
export function parseProxyTestBody(body) {
  const uri = typeof body?.uri === "string" ? body.uri.trim() : ""
  const target = typeof body?.target === "string" ? body.target.trim() : ""
  if (uri === "" || target === "") throw new Error("uri ∥ target 双必传（trim 非空——空 = 就地拒，不回落已存配置）")
  const normalized = validateProxyConfig({ uri }) // 校验单源复用（非空 ∥ 合法 URL ∥ scheme 仅 http:）
  let parsed
  try {
    parsed = new URL(target)
  } catch {
    throw new Error(`target 非法 URL：${target}（须 http(s) URL）`)
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`target 仅收 http(s) URL：${target}（现 scheme = ${parsed.protocol}）`)
  }
  return { uri: normalized.uri, target }
}

/** 响应体释放（诊断只读状态码——体不消费；拆流释放连接，零挂起；释放失败无面）。 */
function releaseBody(response) {
  try {
    Promise.resolve(response?.body?.cancel?.()).catch(() => {})
  } catch { /* 释放尽力而为——读数（status/ms）已得 */ }
}

/**
 * 注册代理连通测试端点（§2.4）：`db` = openDatabase 产物。
 * 注入口径（批内件替身）：`fetchImpl`（缺省 = `proxyFetch`——真打同链）∥ `timeoutMs` 走可覆盖参数（缺省 = 生产行为不变）。
 */
export function registerProxyAdminRoutes(routes, { db, log = null, fetchImpl = proxyFetch, timeoutMs = PROXY_TEST_TIMEOUT_MS } = {}) {
  if (!db) throw new Error("registerProxyAdminRoutes：缺少 db（装配面须传全）")

  routes.add("POST", "/api/admin/proxy/test", async (req, res) => {
    requireAdmin(db, req) // user ⇒ 403 ∥ 无/过期会话 ⇒ 401（同族口径）
    const body = await readJsonBody(req)
    let input
    try {
      input = parseProxyTestBody(body)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 400 原报文（文件与运行态零变）
    }
    const started = Date.now()
    const signal = AbortSignal.timeout(timeoutMs) // 超时中止（分类判据 = `signal.aborted`——超时时必为 true）
    let upstream
    try {
      upstream = await fetchImpl(input.target, { method: "GET", signal }, input.uri)
    } catch (e) {
      const kind = signal.aborted ? "timeout" : "unreachable" // 超预算 ∥ 连不上/CONNECT 拒/TLS 败（二分类）
      const message = kind === "timeout" ? `代理连通超时（超时 ${timeoutMs}ms）：${e.message}` : `代理不可达：${e.message}`
      log?.warn("proxy_test_failed", { kind, uri: input.uri, target: input.target, message: e.message })
      sendJson(res, 200, { ok: false, error: { kind, message }, ms: Date.now() - started })
      return
    }
    releaseBody(upstream) // 只取状态码（读数）——响应体不消费
    sendJson(res, 200, { ok: true, status: upstream.status, ms: Date.now() - started })
  })
}
