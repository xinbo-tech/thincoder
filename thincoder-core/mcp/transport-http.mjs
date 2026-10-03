/**
 * mcp/transport-http.mjs — MCP HTTP + SSE transport (Streamable HTTP)
 */
import { rpcId, CALL_TIMEOUT_MS, ENDPOINT_WAIT_MS, INIT_TIMEOUT_MS, withTimeout } from "./helpers.mjs"

/** Create an MCP HTTP+SSE transport for Streamable HTTP servers */
export function httpTransport(baseURL, extraHeaders = {}) {
  const url = baseURL.replace(/\/+$/, "")
  let sessionId = null
  let closed = false
  let eventSource = null
  // 2026-09-01 MCP.md §4 D-1：GET SSE 不可用（405/不支持）降级后的纯 POST 模式标记。
  // POST-only server（如 glm-websearch）无流可断：isAlive 不得因 eventSource == null 判死。
  let postOnly = false
  let abortController = null
  let postUrl = url
  let legacySSE = false
  let deadFired = false
  let deadListeners = new Set()
  // #850 D-MC18：会话过期（HTTP 404）自愈链状态——重建单飞 promise ∥ initialize 参数单源
  //（建连时 `setInitPayload` 注入）∥ 会话死态标记（未修复 ⇒ isAlive false ⇒ ensureAlive 走重连）。
  let reinitPromise = null
  let initPayload = null
  let sessionDead = false

  /** 2026-08-31 MCP 会诊 P5：意外死亡通知（SSE 流断/error，非主动 close）。 */
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
    const signal = AbortSignal.any([abortController.signal, AbortSignal.timeout(INIT_TIMEOUT_MS)])
    const resp = await fetch(url, {
      method: "GET",
      headers: { Accept: "text/event-stream", ...extraHeaders },
      signal,
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

  async function postOnce(method, params, retried) {
    const id = rpcId()
    const body = JSON.stringify({ jsonrpc: "2.0", id, method, params })

    if (legacySSE) {
      // 2026-08-31 MCP 会诊 #10：legacy 模式下 POST 若直接带回 JSON-RPC body（违规 server，
      // 规范是响应经 GET SSE 流回）——原实现对 resp.ok 什么都不做 → pending 挂满 120s。
      // 空 body = 规范行为（等待 SSE 流）；非空 JSON = 违规 server，直接解析 resolve。
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
    // 而 SSE 流里 pending.get(id) 永远 miss——每次调用挂满 120s。
    // 现在两类通道统一：先注册 pending，POST 得到的结果（直接 body / SSE / 202 等待）
    // 都经 pending resolve；SSE 流由 openSSE() 转发。200+JSON 直接 body 解析。
    return new Promise((resolve) => {
      pending.set(id, resolve)
      fetch(postUrl, { method: "POST", headers: headers(), body, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) })
        .then(async (resp) => {
          const ct = resp.headers.get("content-type") ?? ""
          const newSessionId = resp.headers.get("Mcp-Session-Id")
          if (newSessionId) sessionId = newSessionId
          // 202: 已接受，响应将经 GET SSE 流回——pending 保持，由 openSSE 转发 resolve
          if (resp.status === 202) return
          if (!resp.ok) {
            pending.delete(id)
            const error = { id, error: { code: -32000, message: `HTTP ${resp.status}` } }
            // #850 D-MC18：404（MCP 会话失效语义）⇒ 自愈三步——清会话 ⇒ 重建（单飞）⇒ 重试原请求一次。
            if (resp.status === 404 && !retried) {
              sessionId = null   // ① 清会话（后续请求不再携失效 id）
              const healed = await reinitialize().then(() => true, () => false)
              // ③ 只重试一次（close 竞态：关闭后自愈链随连接生命周期终止——不重试）
              if (healed && !closed) { resolve(postOnce(method, params, true)); return }
            }
            if (resp.status === 404) {
              // 重建失败 / 二次 404：不第三次——原错误透传 + fireDead（既有退避重连链兜底）
              if (!closed) {
                sessionDead = true
                fireDead("session expired")
              }
            }
            resolve(error)
            return
          }
          if (ct.includes("text/event-stream")) {
            // 响应体本身就是一条 SSE（一次性流）：解析匹配该 id
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
          // 直接 JSON body：拿掉 pending 立即解析
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

  /** 原请求入口（每次调用一个 `retried` 份额——自愈重试恒为 true，二次不再重试）。 */
  const postRequest = (method, params) => postOnce(method, params, false)

  const send = async (method, params) => withTimeout(postRequest(method, params), CALL_TIMEOUT_MS)

  const notify = (method, params) => {
    fetch(postUrl, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ jsonrpc: "2.0", method, params }),
      signal: AbortSignal.timeout(10_000),
    }).catch((e) => {
      // notify is fire-and-forget by design, but log network errors for debugging
      if (e.name !== "AbortError") console.error(`[mcp] notify failed: ${e.message}`)
    })
  }

  /** #850 D-MC18：404 自愈重建（单飞）——重新 `initialize`（+ `notifications/initialized`）。
   *  并发 404 共享同一重建；失败抛（调用面归入「不重试」+ fireDead + sessionDead）。
   *  重建请求自身以 retried=true 走 postOnce——重建中再 404 不再触自愈。 */
  const reinitialize = () => {
    if (!reinitPromise) {
      reinitPromise = (async () => {
        // close 竞态：关闭后自愈不再继续（重建 ∥ 通知 ∥ 会话复活全停）
        if (closed) throw new Error("connection closed")
        if (!initPayload) throw new Error("initialize payload not set (setInitPayload)")
        const resp = await postOnce("initialize", initPayload, true)
        if (resp?.error) throw new Error(resp.error.message ?? "initialize failed")
        if (closed) throw new Error("connection closed")
        notify("notifications/initialized", {})
        sessionDead = false
      })().finally(() => { reinitPromise = null })
    }
    return reinitPromise
  }

  /** initialize 参数单源注入（建连方：mcp.mjs——握手与自愈重建共用同一参数）。 */
  const setInitPayload = (payload) => { initPayload = payload }

  const close = () => {
    closed = true
    // 关闭态由 closed 判死；会话死态标记随连接生命周期结束复位（无残留歧义）。
    sessionDead = false
    abortController?.abort()
    if (sessionId) {
      fetch(postUrl, {
        method: "DELETE",
        headers: { "Mcp-Session-Id": sessionId, ...extraHeaders },
        signal: AbortSignal.timeout(5_000),
      }).catch((e) => {
        // close is best-effort cleanup; log but don't throw
        if (e.name !== "AbortError") console.error(`[mcp] close DELETE failed: ${e.message}`)
      })
      sessionId = null
    }
    for (const [, resolve] of pending) resolve({ id: null, error: { code: -32000, message: "Connection closed" } })
    pending.clear()
  }

  /** D-1：openSSE 降级（GET 405/不支持）后由 connect 链调用——标记纯 Streamable POST 模式 */
  const markPostOnly = () => { postOnly = true }

  return {
    send, notify, close, openSSE, url, headers: extraHeaders,
    // F1：POST-only 降级（postOnly）与 legacy SSE 流（eventSource）都算活连接——
    // 不得因 eventSource == null 误判死（glm-websearch "reconnect failed" 根因）。
    // D-MC18：会话过期未修复（sessionDead）⇒ 判死——ensureAlive 据此走重连。
    isAlive: () => !closed && !sessionDead && (eventSource != null || postOnly),
    onDead, markPostOnly, setInitPayload,
  }
}
