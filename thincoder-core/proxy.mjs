/**
 * proxy.mjs — 代理出口：`injectProxy`（逐渠注入）∥ `proxyFetch`（统一出口编排；直连分支 = 断流通道建设点）
 * + 兼容再出口（`proxy-target.mjs` ∥ `proxy-transport.mjs`——消费面 import 零改；2026-10-08 拆档 · #1037）。
 * 零依赖：Node built-ins only（url）。
 */
import { URL } from "node:url"
import { normalizeProxy } from "./config.mjs"
import { IDLE_ABORT } from "./stream-destroy.mjs"
import { isLoopbackTarget, resolveProxyConfig, resolveWebProxy } from "./proxy-target.mjs"
import { FETCH_TIMEOUT, streamHttpResponse, tcpConnectProxy, tunnelHttps } from "./proxy-transport.mjs"

export { isLoopbackTarget, resolveProxyConfig, resolveWebProxy, streamHttpResponse, tunnelHttps }

/**
 * Inject the resolved proxy URI into each provider as provider.proxyUri
 * (consumed by chat() in provider/core.mjs).
 * 逐渠独立：per-provider `proxy: true` ∧ **在案** `proxy.uri` ⇒ 注入（无全局闸——D-PX1，2026-10-08）。
 * env 回落不供模型代理（D-PX4）：盘上 `proxy` 字段缺席 ⇒ 零注入（web 面 env 回落照旧——`resolveWebProxy`）。
 * 判定归一化单源 = `normalizeProxy`（#1082，2026-10-10）：`""` ∥ 空对象 ∥ 非法型 ⇒ 零注入（`!= null` 过闸后
 * 的 env 回供理论口封死——模型代理永不吃 env）。
 */
export function injectProxy(providers, config) {
  const uri = normalizeProxy(config?.proxy)?.uri ?? null
  for (const p of providers ?? []) {
    p.proxyUri = p.proxy && uri ? uri : undefined
  }
}

/**
 * Generic fetch with proxy support.
 * No proxy → native fetch. Proxy + HTTPS → CONNECT tunnel. Proxy + HTTP → 经典代理转发（绝对 URI 请求行）。
 * 直连分支 = 内部 abort 通道建设点（#878 D-PX8）：建 `AbortController` + signal 合成（`AbortSignal.any`，
 * 无 user signal 时单独用）后经 `IDLE_ABORT` 挂 response——web `ReadableStream` 的读侧看门狗
 * （`readSSE` ∥ `parseGeminiStream`）经 `terminateBody` 恢复有效；proxy 两分支不挂（自有 `_bodyIdleMs`）。
 */
export async function proxyFetch(urlStr, opts, proxyUri) {
  // Loopback 目标永不经代理（NO_PROXY 语义——#1026：本地网关被塞进代理 ⇒ 403 假红）：
  if (proxyUri && isLoopbackTarget(urlStr)) proxyUri = null
  if (!proxyUri) {
    const idleAbort = new AbortController()
    const signal = opts?.signal ? AbortSignal.any([opts.signal, idleAbort.signal]) : idleAbort.signal
    const response = await globalThis.fetch(urlStr, { ...opts, signal })
    response[IDLE_ABORT] = idleAbort
    return response
  }
  const target = new URL(urlStr)
  if (target.protocol === "https:") return tunnelHttps(urlStr, opts, proxyUri)
  // http:// 目标：TCP 直连代理，请求行发绝对 URI（GET http://host/path HTTP/1.1）
  const sock = await tcpConnectProxy(proxyUri, opts?.signal, FETCH_TIMEOUT)
  const headerTimeoutMs = Number.isFinite(opts?._headerTimeoutMs) ? opts._headerTimeoutMs : FETCH_TIMEOUT
  const bodyIdleMs = opts?._bodyIdleMs ?? 120_000
  return streamHttpResponse(sock, urlStr, opts, headerTimeoutMs, true, bodyIdleMs)
}
