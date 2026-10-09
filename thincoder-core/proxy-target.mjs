/**
 * proxy-target.mjs — 代理目标 ∥ 配置解析面（2026-10-08 拆档——原 `proxy.mjs` 迁出；#1037）。
 * 逐渠判定 = 渠道旗 `providers[].proxy` ∧ `proxy.uri` 在案（无全局闸——D-PX1，2026-10-08 批落）。
 * 零依赖：Node built-ins only（net, url）。
 */
import { isIP } from "node:net"
import { URL } from "node:url"

/**
 * Resolve proxy URI.
 * New format: { proxy: { uri: "http://host:port", web: true } }
 * Old format: { proxy: "http://host:port" } — backwards compatible, web=true
 * Env vars: HTTPS_PROXY, HTTP_PROXY, ALL_PROXY
 *
 * @returns {{ uri: string|null, web: boolean }}
 */
export function resolveProxyConfig(ctx) {
  const cfgProxy = ctx?.agent?.config?.proxy
  if (!cfgProxy) {
    const uri = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || null
    return { uri, web: !!uri }
  }
  if (typeof cfgProxy === "string") {
    // Backward compat: bare string → web only
    return { uri: cfgProxy, web: true }
  }
  return {
    uri: cfgProxy.uri || cfgProxy.url || null,
    web: cfgProxy.web !== false,
  }
}

/** Convenience: resolve proxy URI for web tools (websearch/fetch) */
export function resolveWebProxy(ctx) {
  const cfg = resolveProxyConfig(ctx)
  return (cfg.uri && cfg.web) ? cfg.uri : null
}

/**
 * Loopback 目标判定（NO_PROXY 语义——#1026，2026-10-07 用户案）：
 * `localhost` ∥ `*.localhost`（RFC 6761）∥ `127.0.0.0/8` ∥ `::1` —— 此类目标永不经代理。
 * 解析失败 ⇒ false（未知串不宣称 loopback）；尾点（`localhost.`）先归一。
 */
export function isLoopbackTarget(urlStr) {
  let host
  try { host = new URL(urlStr).hostname } catch { return false }
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1) // IPv6 带括号（URL.hostname 规范形）
  if (host.endsWith(".")) host = host.slice(0, -1)
  if (host === "localhost" || host.endsWith(".localhost")) return true
  const v = isIP(host)
  if (v === 4) return host.split(".")[0] === "127"
  if (v === 6) return host === "::1"
  return false
}
