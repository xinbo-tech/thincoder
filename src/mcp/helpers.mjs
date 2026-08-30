/**
 * mcp/helpers.mjs — MCP shared utility functions and constants
 */

export const INIT_TIMEOUT_MS = 30_000
export const CALL_TIMEOUT_MS = 120_000
export const ENDPOINT_WAIT_MS = 5_000

let nextRpcId = 0
/** Generate a unique incrementing RPC ID string */
export function rpcId() {
  return String(++nextRpcId)
}

/** Race a promise against a timeout, rejecting after ms milliseconds */
export function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
    timer.unref?.()
  })
  return Promise.race([promise.finally(() => clearTimeout(timer)), timeout])
}

/** Quote a shell argument: wrap in double-quotes if it contains whitespace or quotes */
export function quoteArg(s) {
  return /[\s"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Append a Bearer token as a query parameter to a WebSocket URL.
 *  2026-08-31 MCP 会诊 #10：畸形 wsUrl 原抛裸 TypeError，改友好消息。 */
export function withAuthToken(wsUrl, authorization) {
  if (!authorization) return wsUrl
  const token = authorization.replace(/^Bearer\s+/i, "")
  let u
  try {
    u = new URL(wsUrl)
  } catch {
    throw new Error(`Invalid WebSocket URL: ${String(wsUrl).slice(0, 120)}`)
  }
  u.searchParams.set("token", token)
  return u.href
}

/** Sanitize a tool name: replace non-alphanumeric chars with underscores, cap at 64 chars */
export function sanitizeToolName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64)
}
