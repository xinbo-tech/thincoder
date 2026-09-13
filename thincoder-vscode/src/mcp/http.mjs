/**
 * mcp/http.mjs — Streamable HTTP + SSE transport for MCP
 *
 * Implements the MCP Streamable HTTP transport: opens a GET SSE stream
 * for server→client messages, sends POST requests for client→server
 * JSON-RPC calls, and falls back to pure POST mode when GET SSE is
 * unavailable.
 */

import { rpcId, withTimeout, CALL_TIMEOUT_MS, ENDPOINT_WAIT_MS, INIT_TIMEOUT_MS } from "./utils.mjs"

/** AbortSignal.any fallback（vscode 引擎 Node 18 无 any——2026-08-31 MCP 会诊 P4）。
 *  fetch 的 signal 只认单一 signal：包装一个 AbortController，任一输入 abort 即触发。 */
function anySignal(signals) {
  const ctrl = new AbortController()
  for (const s of signals) {
    if (!s) continue
    if (s.aborted) { ctrl.abort(s.reason); return ctrl.signal }
    s.addEventListener("abort", () => ctrl.abort(s.reason), { once: true })
  }
  return ctrl.signal
}

export function httpTransport(baseURL, extraHeaders = {}) {
  const url = baseURL.replace(/\/+$/, "")
  let sessionId = null
  let closed = false
  let eventSource = null
  // 2026-09-01 MCP.md §4 D-1（CLI parity）：GET SSE 不可用（405/不支持）降级后的纯
  // POST 模式标记。POST-only server（如 glm-websearch）无流可断：isAlive 不得因
  // eventSource == null 判死。
  let postOnly = false
  let postUrl = url
  let legacySSE = false
  let abortController = null
  let deadFired = false
  let deadListeners = new Set()

  /** 2026-08-31 MCP 会诊 P5：意外死亡通知（SSE 流断/error，非主动 close——CLI parity）。 */
  const fireDead = (msg) => {
    if (deadFired) return
    deadFired = true
    for (const cb of deadListeners) { try { cb(msg) } catch { /* listener error */ } }
  }
  const onDead = (cb) => { deadListeners.add(cb); return () => deadListeners.delete(cb) }

  const headers = () => {
    const h = { "Content-Type": "application/json", Accept: "text/event-stream, application/json", ...extraHeaders }
    if (sessionId) h["Mcp-Session-Id"] = sessionId
    return h
  }

  const pending = new Map()

  async function* parseSSE(response) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buf = ""
    let current = { data: "", event: "message" }
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop() ?? ""
        for (const raw of lines) {
          const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw
          if (line === "") {
            if (current.data) {
              yield { event: current.event, data: current.data.trimEnd() }
              current = { data: "", event: "message" }
            }
          } else if (line.startsWith("data:")) {
            current.data += (current.data ? "\n" : "") + line.slice(5).replace(/^ /, "")
          } else if (line.startsWith("event:")) {
            current.event = line.slice(6).trim()
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async function openSSE() {
    if (closed) return
    abortController?.abort()
    abortController = new AbortController()
    // 2026-08-31 MCP 会诊 P4：GET SSE 无超时（vscode-only）——服务器接受 TCP 但永不
    // 响应头时 await fetch 永久挂起。CLI 端已有 AbortSignal.any 超时，此处用 polyfill 对齐。
    const resp = await fetch(url, {
      method: "GET",
      headers: { Accept: "text/event-stream", ...extraHeaders },
      signal: anySignal([abortController.signal, AbortSignal.timeout(INIT_TIMEOUT_MS)]),
    })
    if (!resp.ok) throw new Error(`SSE connect failed: HTTP ${resp.status}`)
    eventSource = parseSSE(resp)
    let endpointReady
    const gotEndpoint = new Promise((resolve) => { endpointReady = resolve })

    ;(async () => {
      try {
        for await (const { event, data } of eventSource) {
          if (closed) break
          if (event === "endpoint") {
            postUrl = new URL(data.trim(), url).href
            legacySSE = true
            endpointReady()
            continue
          }
          try {
            const msg = JSON.parse(data)
            const resolver = pending.get(msg.id)
            if (resolver) {
              pending.delete(msg.id)
              resolver(msg)
            }
          } catch { /* not JSON, ignore */ }
        }
        // 正常走完 = server 关闭了流（网络/对端退出）→ 非主动关闭视为死亡
        if (!closed) fireDead("SSE stream ended")
      } catch (error) {
        const wasClosed = closed
        if (!wasClosed) {
          for (const [, resolve] of pending) resolve({ id: null, error: { code: -32000, message: `SSE error: ${error.message}` } })
          pending.clear()
          fireDead(`SSE error: ${error.message}`)
        }
      }
    })()

    const wait = new Promise((resolve) => {
      const t = setTimeout(resolve, ENDPOINT_WAIT_MS)
      t.unref?.()
    })
    await Promise.race([gotEndpoint, wait])
  }

  async function postRequest(method, params) {
    const id = rpcId()
    const body = JSON.stringify({ jsonrpc: "2.0", id, method, params })

    if (legacySSE) {
      // 2026-08-31 MCP 会诊 #10：legacy 模式下 POST 若直接带回 JSON-RPC body（违规 server），
      // 原实现对 resp.ok 什么都不做 → pending 挂满 120s。空 body = 规范行为（等 SSE 流）。
      return new Promise((resolve) => {
        pending.set(id, resolve)
        fetch(postUrl, { method: "POST", headers: headers(), body, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) })
          .then(async (resp) => {
            if (!resp.ok) {
              pending.delete(id)
              resolve({ id, error: { code: -32000, message: `POST failed: HTTP ${resp.status}` } })
              return
            }
            const raw = await resp.text().catch(() => "")
            if (raw.trim()) {
              try {
                const msg = JSON.parse(raw)
                if (msg.id === id) { pending.delete(id); resolve(msg); return }
              } catch { /* ignore — pending 交给 SSE 流 */ }
            }
            // 空体或非本次 id 的 JSON：保持 pending 等 GET SSE 流回包
          })
          .catch((e) => {
            pending.delete(id)
            resolve({ id, error: { code: -32000, message: `POST failed: ${e.message}` } })
          })
      }).finally(() => pending.delete(id))
    }

    // 2026-08-31 MCP 会诊 P4：Streamable HTTP 规范路径（POST→202→GET SSE 回包）。
    // 原实现非 legacy 分支从不注册 pending：202 空 body → resp.json() 抛 SyntaxError，
    // SSE 流里 pending.get(id) 永远 miss——每次调用挂满 120s。
    // 统一：先注册 pending，POST 直接 body / SSE / 202 等待三通道均经 pending resolve。
    return new Promise((resolve) => {
      pending.set(id, resolve)
      fetch(postUrl, { method: "POST", headers: headers(), body, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) })
        .then(async (resp) => {
          const ct = resp.headers.get("content-type") ?? ""
          const newSessionId = resp.headers.get("Mcp-Session-Id")
          if (newSessionId) sessionId = newSessionId
          if (resp.status === 202) return // 已接受——响应经 GET SSE 流回，pending 保持
          if (!resp.ok) {
            pending.delete(id)
            resolve({ id, error: { code: -32000, message: `HTTP ${resp.status}` } })
            return
          }
          if (ct.includes("text/event-stream")) {
            try {
              for await (const { data } of parseSSE(resp)) {
                try {
                  const msg = JSON.parse(data)
                  if (msg.id === id) { pending.delete(id); resolve(msg); return }
                } catch { /* skip */ }
              }
              pending.delete(id)
              resolve({ id, error: { code: -32000, message: "No JSON-RPC response in SSE stream" } })
            } catch (e) {
              pending.delete(id)
              resolve({ id, error: { code: -32000, message: `SSE response failed: ${e.message}` } })
            }
            return
          }
          pending.delete(id)
          try {
            resolve(await resp.json())
          } catch (e) {
            resolve({ id, error: { code: -32000, message: `invalid JSON body: ${e.message}` } })
          }
        })
        .catch((e) => {
          if (pending.delete(id)) {
            resolve({ id, error: { code: -32000, message: `POST failed: ${e.message}` } })
          }
        })
    }).finally(() => pending.delete(id))
  }

  const send = async (method, params) => withTimeout(postRequest(method, params), CALL_TIMEOUT_MS)

  const notify = (method, params) => {
    fetch(postUrl, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ jsonrpc: "2.0", method, params }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {})
  }

  const close = () => {
    closed = true
    abortController?.abort()
    if (sessionId) {
      fetch(postUrl, {
        method: "DELETE",
        headers: { "Mcp-Session-Id": sessionId, ...extraHeaders },
        signal: AbortSignal.timeout(5_000),
      }).catch(() => {})
      sessionId = null
    }
    for (const [, resolve] of pending) resolve({ id: null, error: { code: -32000, message: "Connection closed" } })
    pending.clear()
  }

  /** D-1（CLI parity）：openSSE 降级（GET 405/不支持）后由 connect 链调用——标记纯 Streamable POST 模式 */
  const markPostOnly = () => { postOnly = true }

  return {
    send, notify, close, openSSE, url, headers: extraHeaders,
    // F5：POST-only 降级（postOnly）与 legacy SSE 流（eventSource）都算活连接——
    // 不得因 eventSource == null 误判死（与 CLI 语义同构，NF3）。
    isAlive: () => !closed && (eventSource != null || postOnly),
    onDead, markPostOnly,
  }
}
