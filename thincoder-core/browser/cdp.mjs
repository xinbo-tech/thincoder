/**
 * browser/cdp.mjs — CDP 传输客户端（零第三方——N-BT1：Node ≥ 24 原生 WebSocket）。
 *
 * 形沿 `scripts/console-walkthrough.mjs:133-141` 的实证客户端（id 派发 ∥ 事件派发）——本文档把它
 * 拆成类以承载多动作会话（connect / call / on / close），并加 HTTP 面 `/json/new` 取标签页。
 * `WebSocketImpl` = 注入缝（缺省 `globalThis.WebSocket`；单测注假传输——缺省回落真实现，`??`）。
 *
 * 错误语义：CDP 回 `{ error: { message } }` ⇒ 拒以 `Error(message)`（BROWSER-TOOL.md §5）。
 */

/** 与浏览器标签页的一条 CDP 连接。 */
export class CdpClient {
  constructor(ws) {
    this._ws = ws
    this._nextId = 0
    this._pending = new Map()
    this._listeners = new Map()
    this.closed = false
    ws.onmessage = (ev) => this._onMessage(ev)
    ws.onclose = () => this._abortAll(new Error("CDP connection closed"))
    ws.onerror = () => this._abortAll(new Error("CDP connection error"))
  }

  _onMessage(ev) {
    let msg
    try { msg = JSON.parse(ev.data) } catch { return } // 非 JSON 帧（调试器噪声）忽略
    if (msg.id !== undefined && this._pending.has(msg.id)) {
      const p = this._pending.get(msg.id)
      this._pending.delete(msg.id)
      if (msg.error) p.reject(new Error(msg.error.message ?? JSON.stringify(msg.error)))
      else p.resolve(msg.result ?? {})
      return
    }
    const handlers = msg.method ? this._listeners.get(msg.method) : null
    if (!handlers) return
    for (const handler of handlers) {
      try { handler(msg.params ?? {}, msg.method) } catch { /* 订阅者自担——一条订阅抛错不打断派发 */ }
    }
  }

  _abortAll(error) {
    for (const pending of this._pending.values()) pending.reject(error)
    this._pending.clear()
  }

  /** 发一条 CDP 命令，解析其 result（失败拒以 `Error`）。 */
  call(method, params = {}) {
    if (this.closed) return Promise.reject(new Error("CDP client is closed"))
    const id = ++this._nextId
    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject })
      try { this._ws.send(JSON.stringify({ id, method, params })) }
      catch (e) { this._pending.delete(id); reject(e) }
    })
  }

  /** 订阅 CDP 事件（无 id 帧）；返回退订函数。 */
  on(method, handler) {
    const list = this._listeners.get(method) ?? []
    list.push(handler)
    this._listeners.set(method, list)
    return () => this._listeners.set(method, (this._listeners.get(method) ?? []).filter((h) => h !== handler))
  }

  close() {
    if (this.closed) return
    this.closed = true
    this._abortAll(new Error("CDP client closed"))
    try { this._ws.close() } catch { /* 已断开 */ }
  }
}

/**
 * 连标签页调试地址。
 * @param {string} wsUrl `webSocketDebuggerUrl`
 * @param {{WebSocketImpl?: Function}} [opts] 注入缝（缺省 = 原生 `WebSocket`）
 */
export async function connectCdp(wsUrl, { WebSocketImpl } = {}) {
  const Impl = WebSocketImpl ?? globalThis.WebSocket
  if (typeof Impl !== "function") {
    throw new Error("no WebSocket implementation available — Node >= 24 required (CDP transport is stdlib-only)")
  }
  const ws = new Impl(wsUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = () => resolve()
    ws.onerror = () => reject(new Error(`failed to connect to CDP at ${wsUrl}`))
  })
  return new CdpClient(ws)
}

/** 开一张标签页并取其调试地址（`PUT /json/new`，GET 兜底——walkthrough `:131-132` 同式）。 */
export async function newTabWebSocketUrl(port, { host = "127.0.0.1", fetchImpl = globalThis.fetch } = {}) {
  const url = `http://${host}:${port}/json/new?about:blank`
  let tab
  try { tab = await (await fetchImpl(url, { method: "PUT" })).json() }
  catch { tab = await (await fetchImpl(url)).json() }
  if (!tab?.webSocketDebuggerUrl) {
    throw new Error(`browser did not return a debuggable tab from /json/new (port ${port})`)
  }
  return tab.webSocketDebuggerUrl
}
