/**
 * mcp/utils.mjs — shared utilities and constants for MCP transports
 */

// ─── constants ──────────────────────────────────────────────────

export const INIT_TIMEOUT_MS = 30_000
export const CALL_TIMEOUT_MS = 120_000
export const ENDPOINT_WAIT_MS = 5_000

// ─── utilities ──────────────────────────────────────────────────

let _nextRpcId = 0
export function rpcId() { return String(++_nextRpcId) }

export function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
    timer.unref?.()
  })
  return Promise.race([promise.finally(() => clearTimeout(timer)), timeout])
}

export function quoteArg(s) {
  return /[\s"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function sanitizeToolName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64)
}

/** Convert an Authorization Bearer token into a WebSocket subprotocol.
 *  2026-08-31 MCP 会诊 #10：原实现把 token 塞进 URL query——代理/网关日志会泄露凭证，
 *  且无标准依据。Node 内置 WebSocket（undici）无法自定义请求头，MCP 生态的标准替代
 *  通道是 subprotocol（`bearer.<token>`）。用户 URL 自带的 query token 不动（兼容）。
 *  @returns {{ url: string, protocols: string[] }} — protocols 为空数组表示无认证。 */
export function withAuthToken(wsUrl, authorization) {
  if (!authorization) return { url: wsUrl, protocols: [] }
  const token = authorization.replace(/^Bearer\s+/i, "")
  let u
  try {
    u = new URL(wsUrl)
  } catch {
    throw new Error(`Invalid WebSocket URL: ${String(wsUrl).slice(0, 120)}`)
  }
  // subprotocol 不进入 URL/日志，token 不再注入 query
  return { url: u.href, protocols: [`bearer.${token}`] }
}
