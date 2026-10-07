/**
 * browser/cdp.mjs — CDP 传输客户端（零第三方——N-BT1：Node ≥ 24 原生 WebSocket）。
 *
 * 形沿 `scripts/console-walkthrough.mjs:133-141` 的实证客户端（id 派发 ∥ 事件派发）——本文档把它
 * 拆成类以承载多动作会话（connect / call / on / close），并加 HTTP 面 `/json/new` 取标签页。
 * `WebSocketImpl` = 注入缝（缺省 `globalThis.WebSocket`；单测注假传输——缺省回落真实现，`??`）。
 *
 * 错误语义：CDP 回 `{ error: { message } }` ⇒ 拒以 `Error(message)`（BROWSER-TOOL.md §5）。
 * 帽（§2.9 三层帽——层二 / 层三）：`call` 缺省帽 15s（任何未显式配帽的调用也不悬挂）；`connectCdp` open 帽
 * 10s；`/json/new` fetch 帽 5s——动作内调用另随动作控制器（session 侧接线，预算先行）。
 * 断连面：WS `onclose` / `onerror` ⇒ 拒在飞命令**并通知订阅者**（session 据此复位会话态——§2.10 源②）。
 */

/** `call` 缺省兜底帽（§2.9 层三——未显式配帽的调用同样有界）。 */
export const DEFAULT_CALL_TIMEOUT_MS = 15_000
/** `connectCdp` open 帽（§2.9 层二）。 */
export const CONNECT_TIMEOUT_MS = 10_000
/** `/json/new` fetch 帽（§2.9 层二）。 */
export const NEWTAB_TIMEOUT_MS = 5_000

/** 与浏览器标签页的一条 CDP 连接。 */
export class CdpClient {
  constructor(ws) {
    this._ws = ws
    this._nextId = 0
    this._pending = new Map()
    this._listeners = new Map()
    this._disconnects = []
    this.closed = false
    ws.onmessage = (ev) => this._onMessage(ev)
    ws.onclose = () => this._die(new Error("CDP connection closed"))
    ws.onerror = () => this._die(new Error("CDP connection error"))
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

  /** 连接断（WS close/error）单点：通知订阅者（先）⇒ 拒在飞命令（同一因由实例——§2.10）。 */
  _die(error) {
    if (this.closed) return
    this.closed = true
    for (const handler of this._disconnects) {
      try { handler(error) } catch { /* 订阅者自担 */ }
    }
    this._abortAll(error)
  }

  _abortAll(error) {
    for (const pending of this._pending.values()) pending.reject(error)
    this._pending.clear()
  }

  /** 订阅断连（会话健康接线——§2.10 源②）；返回退订函数。 */
  onDisconnect(handler) {
    this._disconnects.push(handler)
    return () => { this._disconnects = this._disconnects.filter((h) => h !== handler) }
  }

  /** 发一条 CDP 命令，解析其 result（失败拒以 `Error`）；缺省帽 15s（§2.9 层三）。 */
  call(method, params = {}, { timeoutMs = DEFAULT_CALL_TIMEOUT_MS } = {}) {
    if (this.closed) return Promise.reject(new Error("CDP client is closed"))
    const id = ++this._nextId
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pending.delete(id)
        const error = new Error(`${method} did not respond within ${timeoutMs}ms`)
        error.cdpTimeout = true
        reject(error)
      }, timeoutMs)
      timer.unref?.() // 挂死型调用不吊住宿主进程（命令真返回时在 settle 里清钟）
      const settle = (fn, value) => { clearTimeout(timer); this._pending.delete(id); fn(value) }
      this._pending.set(id, { resolve: (v) => settle(resolve, v), reject: (e) => settle(reject, e) })
      try { this._ws.send(JSON.stringify({ id, method, params })) }
      catch (e) { settle(reject, e) }
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
 * 连标签页调试地址（open 帽 10s——§2.9 层二）。
 * @param {string} wsUrl `webSocketDebuggerUrl`
 * @param {{WebSocketImpl?: Function, openTimeoutMs?: number}} [opts] 注入缝 ∥ open 帽
 */
export async function connectCdp(wsUrl, { WebSocketImpl, openTimeoutMs = CONNECT_TIMEOUT_MS } = {}) {
  const Impl = WebSocketImpl ?? globalThis.WebSocket
  if (typeof Impl !== "function") {
    throw new Error("no WebSocket implementation available — Node >= 24 required (CDP transport is stdlib-only)")
  }
  const ws = new Impl(wsUrl)
  await new Promise((resolve, reject) => {
    let settled = false
    const finish = (fn, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      fn(value)
    }
    const timer = setTimeout(
      () => finish(reject, new Error(`failed to connect to CDP at ${wsUrl} (no response within ${openTimeoutMs}ms)`)),
      openTimeoutMs,
    )
    timer.unref?.()
    ws.onopen = () => finish(resolve)
    ws.onerror = () => finish(reject, new Error(`failed to connect to CDP at ${wsUrl}`))
  })
  return new CdpClient(ws)
}

/** 开一张标签页并取其调试地址（`PUT /json/new`，GET 兜底——walkthrough `:131-132` 同式；fetch 帽 5s）。 */
export async function newTabWebSocketUrl(port, { host = "127.0.0.1", fetchImpl = globalThis.fetch, timeoutMs = NEWTAB_TIMEOUT_MS } = {}) {
  const url = `http://${host}:${port}/json/new?about:blank`
  let timer = null
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`browser did not answer /json/new within ${timeoutMs}ms (port ${port})`)),
      timeoutMs,
    )
    timer.unref?.()
  })
  const fetchTab = async (init) => (await fetchImpl(url, init)).json()
  try {
    let tab
    try { tab = await Promise.race([fetchTab({ method: "PUT" }), deadline]) }
    catch { tab = await Promise.race([fetchTab(), deadline]) } // GET 兜底（同帽——到点即拒，不悬挂）
    if (!tab?.webSocketDebuggerUrl) {
      throw new Error(`browser did not return a debuggable tab from /json/new (port ${port})`)
    }
    return tab.webSocketDebuggerUrl
  } finally {
    if (timer) clearTimeout(timer)
  }
}
