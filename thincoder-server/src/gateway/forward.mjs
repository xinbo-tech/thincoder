/**
 * forward.mjs — 上游转发与中继（gateway/API.md §2.1）：fetch ∥ 流式/非流式透传 ∥ tap 接线 ∥
 * 断连中止 ∥ 记账落库（KD-SV-5/8/10）。
 *
 * 行为契约：
 * - 转发 = provider.baseURL + 端点路径；真 key 代持（provider.apiKey——空则不发 Authorization 头）；
 *   请求体 model = 上游模型名（chat 面 = 首斜杠余段——KD-SV-4）。
 * - 流式（客户端 `stream === true`）⇒ 逐块原样转发（字节零改）+ 旁路 tap 只读扫描（【6】）；
 *   客户端断连 ⇒ `AbortController` 中止上游 + 记 `status='aborted'`（B3）。
 * - 上游已到达（含 4xx/5xx）⇒ 状态码与 body 原样透传（不包不改）；≥400 记 `error` 行（token NULL——E5）。
 * - 响应头最小面 = `content-type`（+ 非流式 `content-length` 重算）；中继体 = fetch **解码后**字节——
 *   探针实证（Node v24.19.0）：gzip 上游经 fetch 到手即明文 JSON，故本档不回 `content-encoding`
 *   （压缩上游到达客户端为解压形、自洽）；其余上游头（`retry-after` 等）不透传。
 * - 上游不可达（连不上 ∥ fetch 内建超时 ∥ 代理不可达）⇒ 502 `upstream_error` + `error` 行（E6）。
 * - 上游出口 = `proxyFetch`（gateway/proxy.mjs——KD-SV-55）：`opts.proxyUri` 在场（逐渠旗 ∧ uri 在案——派发时快照）
 *   ⇒ 经代理（CONNECT 隧道 ∥ 经典转发）；缺省 ⇒ 直连；嵌入面不传。断连中止 = `opts.signal` ⇒ 拆除代理 socket
 *   ⇒ 上游中止（§2.1 契约零回归——本档按 `clientGone` 记 `aborted`）。
 * - 记账时点 = 请求终结（响应完 ∥ 流终结 ∥ 断连——KD-SV-8 **同事务三写**：usage 行 + 派生两表 upsert）；
 *   仅「已进入转发」的请求落行（准入前拒打不落用量：401 ∥ 429 ∥ 400 ∥ 404 ∥ 413 均无行）。
 *   模型标识 = `providerName`/`model` 拆列两字段（嵌入面 `providerName = ''`——STORE §2 v5 段）。
 * - `onUsage`（可选钩子）= 用量到达即回调（限流窗计数——KD-SV-35：失败/断开无 tokens ⇒ 不调；钩子异常不反噬）。
 */
import { once } from "node:events"

import { recordUsage } from "../metering/usage.mjs"
import { sendError } from "./errors.mjs"
import { proxyFetch } from "./proxy.mjs"
import { createUsageTap, pickUsage } from "./sse-tap.mjs"

/** KD-SV-5 注入：`stream === true` 且 `include_usage !== true` ⇒ 置 true（显式 false 亦覆盖）；非流式不动。 */
export function injectIncludeUsage(body) {
  if (!body || body.stream !== true) return body
  const options = body.stream_options
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    return { ...body, stream_options: { include_usage: true } }
  }
  if (options.include_usage === true) return body // B1：已带 ⇒ 不重复注入 ∥ 不改写其它字段
  return { ...body, stream_options: { ...options, include_usage: true } }
}

/** 上游 URL 拼接（baseURL 尾斜杠容错；`path` 自带前导斜杠）。 */
export function upstreamUrl(baseURL, path) {
  return `${String(baseURL).replace(/\/+$/, "")}${path}`
}

/** 上游请求头（最小面）：content-type + provider 真 key（空 ⇒ 不发 Authorization——ops/OPS.md §1）。 */
export function upstreamHeaders(provider) {
  const headers = { "content-type": "application/json" }
  if (provider.apiKey) headers.authorization = `Bearer ${provider.apiKey}`
  return headers
}

/**
 * 转发并中继 + 记账（三面共用——embeddings 同径：传 `endpoint:'embeddings'` ∥ `providerName: ""` ∥ url ∥ payload 即接入）。
 * opts = `{ db, log, member, keyId, endpoint, providerName, model, ts, url, headers, payload, streaming, proxyUri }`。
 * `providerName`/`model` = 记账拆列两字段（chat = provider 名 + 上游模型名；嵌入 = `''` + 引擎模型名）。
 * `proxyUri` = 上游代理串（KD-SV-55——chat 面由 `forwardChat` 自 provider 快照携；缺省/嵌入面 ⇒ null（直连））。
 */
export async function forwardRequest(req, res, opts) {
  const { db, log, member, keyId, endpoint, providerName = "", model, ts, url, headers, payload, streaming, proxyUri = null, onUsage = null } = opts
  const started = Date.now()
  const controller = new AbortController()
  let clientGone = false
  let resolveClosed
  const closed = new Promise((resolve) => { resolveClosed = resolve })
  const onClose = () => {
    if (!res.writableEnded) {
      clientGone = true
      controller.abort() // 断连 ⇒ 中止上游（B3）
    }
    resolveClosed()
  }
  res.on("close", onClose)

  let recorded = false
  const finish = (status, tokens = null) => {
    if (recorded) return
    recorded = true
    // 用量到达即计入限流窗（KD-SV-35——失败/断开 tokens = null ⇒ 不调；钩子自身异常不反噬请求）
    if (tokens !== null && onUsage) {
      try {
        onUsage(tokens)
      } catch (e) {
        log?.warn("on_usage_failed", { message: e.message, endpoint, model })
      }
    }
    try {
      recordUsage(db, {
        ts,
        memberId: member.id,
        keyId,
        endpoint,
        provider: providerName, // 拆列两字段（KD-SV-40）：provider 名 ∥ 嵌入行 = ''
        model,
        status,
        stream: streaming === true,
        promptTokens: tokens?.promptTokens ?? null,
        completionTokens: tokens?.completionTokens ?? null,
        totalTokens: tokens?.totalTokens ?? null,
        durationMs: Date.now() - started,
      })
    } catch (e) {
      log?.error("usage_record_failed", { message: e.message, endpoint, provider: providerName, model })
    }
  }

  try {
    let upstream
    try {
      upstream = await proxyFetch(url, { method: "POST", headers, body: JSON.stringify(payload), signal: controller.signal }, proxyUri)
    } catch (e) {
      if (clientGone) {
        finish("aborted")
        return
      }
      log?.warn("upstream_unreachable", { url, message: e.message })
      finish("error")
      sendError(res, "upstream_error", `上游不可达：${e.message}`)
      return
    }

    if (clientGone) {
      if (upstream.body) await upstream.body.cancel().catch(() => {})
      finish("aborted")
      return
    }

    const ok = upstream.status < 400
    const contentType = upstream.headers.get("content-type") ?? (streaming ? "text/event-stream" : "application/json")
    try {
      if (!upstream.body) {
        res.writeHead(upstream.status, { "content-type": contentType })
        res.end()
        finish(ok ? "ok" : "error")
        return
      }
      if (streaming) {
        res.writeHead(upstream.status, { "content-type": contentType })
        const tap = createUsageTap()
        for await (const chunk of upstream.body) {
          if (clientGone) break
          tap.feed(chunk)
          if (!res.write(chunk)) await Promise.race([once(res, "drain").catch(() => {}), closed])
        }
        if (clientGone) {
          finish("aborted")
          return
        }
        res.end()
        finish(ok ? "ok" : "error", ok ? tap.usage() : null)
      } else {
        const bytes = Buffer.from(await upstream.arrayBuffer())
        if (clientGone) {
          finish("aborted")
          return
        }
        res.writeHead(upstream.status, { "content-type": contentType, "content-length": bytes.length })
        res.end(bytes)
        finish(ok ? "ok" : "error", ok ? usageFromJson(bytes) : null)
      }
    } catch (e) {
      if (clientGone) {
        finish("aborted")
        if (!res.writableEnded) res.destroy()
        return
      }
      log?.error("relay_failed", { url, message: e.message })
      finish("error")
      if (res.headersSent) res.destroy()
      else sendError(res, "upstream_error", `上游中继失败：${e.message}`)
    }
  } finally {
    res.off("close", onClose)
  }
}

/** 非流式响应体 usage 拾取（JSON 体 ⇒ 提取；非 JSON ∥ 解析失败 ⇒ null——B2 形）。 */
function usageFromJson(bytes) {
  try {
    return pickUsage(JSON.parse(bytes.toString("utf8")))
  } catch {
    return null
  }
}

/** 聊天面转发（`/v1/chat/completions`）：注入（KD-SV-5）+ 真 key 代持 + 账务字段装配。
 *  `provider` = 派发快照（baseURL/密钥/代理串——真 key 代持；`proxyUri` = 注册表构建期注入——逐渠旗 ∧ uri 在案，
 *  KD-SV-55）；`model` = 上游模型名（首斜杠余段——API.md §2.1）
 *  —— 上游请求体 model 与记账 `model` 列同值，记账 `provider` 列 = `provider.name`；
 *  `onUsage` = 用量到达钩子（限流窗计入——KD-SV-35）。 */
export async function forwardChat(req, res, { db, log, member, keyId, provider, model, body, ts, onUsage = null }) {
  return forwardRequest(req, res, {
    db,
    log,
    member,
    keyId,
    endpoint: "chat",
    providerName: provider.name, // 记账 provider 列（无 `/` 前缀名）
    model,
    ts,
    streaming: body.stream === true,
    url: upstreamUrl(provider.baseURL, "/chat/completions"),
    headers: upstreamHeaders(provider),
    payload: injectIncludeUsage({ ...body, model }),
    proxyUri: provider.proxyUri ?? null, // 派发时快照（逐渠旗 ∧ uri 在案 ⇒ 经代理；缺省 ⇒ 直连——KD-SV-55）
    onUsage,
  })
}
