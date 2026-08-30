/**
 * mcp/transport-ws.mjs — MCP WebSocket transport
 */
import { rpcId, INIT_TIMEOUT_MS, CALL_TIMEOUT_MS, withTimeout, withAuthToken } from "./helpers.mjs"

/** Create an MCP WebSocket transport */
export function wsTransport(wsUrl, extraHeaders = {}) {
  const pending = new Map()
  let closed = false
  let ws = null

  const failAll = (message) => {
    for (const [, resolve] of pending) resolve({ id: null, error: { code: -32000, message } })
    pending.clear()
  }

  const connect = () => {
    if (closed) throw new Error("MCP WebSocket connection closed")
    ws = new WebSocket(withAuthToken(wsUrl, extraHeaders.Authorization))

    return new Promise((resolve, reject) => {
      let settled = false
      const settleErr = (err) => { if (!settled) { settled = true; reject(err) } }
      const timeout = setTimeout(() => {
        settleErr(new Error(`WebSocket connect timeout: ${wsUrl}`))
        try { ws.close() } catch { /* ignore */ }
      }, INIT_TIMEOUT_MS)

      ws.addEventListener("open", () => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        resolve()
      })

      ws.addEventListener("message", (event) => {
        try {
          const msg = JSON.parse(event.data.toString())
          const resolver = pending.get(msg.id)
          if (resolver) {
            pending.delete(msg.id)
            resolver(msg)
          }
        } catch { /* not JSON, ignore */ }
      })

      ws.addEventListener("error", (event) => {
        clearTimeout(timeout)
        closed = true
        const errMsg = event.message || event.error?.message || "WebSocket error"
        settleErr(new Error(errMsg))
        failAll(errMsg)
      })

      ws.addEventListener("close", () => {
        clearTimeout(timeout)
        closed = true
        // 2026-08-31 MCP 会诊 P1：握手期间 disconnect（close 先于 open 且无 error）——
        // 原实现 close 只 clearTimeout + failAll，connect promise 永不 settle（启动挂死）。
        // settled 标志保证 close 未开成必 reject。
        settleErr(new Error("WebSocket closed before connection established"))
        failAll("WebSocket closed")
      })
    })
  }

  const send = (method, params, signal) => {
    if (closed) return Promise.reject(new Error("MCP WebSocket connection closed"))
    const id = rpcId()
    let resolveFn
    const promise = new Promise((resolve) => { resolveFn = resolve; pending.set(id, resolve) })
    // 2026-08-31 MCP 会诊 P7：abort 即刻作废 pending + 发 cancelled（原等满 120s）
    if (signal) {
      if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"))
      const onAbort = () => {
        pending.delete(id)
        try { notify("notifications/cancelled", { requestId: id }) } catch { /* ignore */ }
        resolveFn({ id, error: { code: -32000, message: "Request cancelled by user" } })
      }
      signal.addEventListener("abort", onAbort, { once: true })
      promise.finally(() => signal.removeEventListener("abort", onAbort)).catch?.(() => {})
    }
    try {
      ws.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }))
    } catch (error) {
      pending.delete(id)
      return Promise.resolve({ id: null, error: { code: -32000, message: `ws send failed: ${error.message}` } })
    }
    return withTimeout(promise, CALL_TIMEOUT_MS).finally(() => pending.delete(id))
  }

  const notify = (method, params) => {
    if (!closed && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ jsonrpc: "2.0", method, params }))
    }
  }

  const close = () => {
    closed = true
    failAll("Connection closed")
    try { ws?.close() } catch { /* ignore */ }
  }

  return { send, notify, close, connect, isAlive: () => !closed && ws?.readyState === WebSocket.OPEN }
}
