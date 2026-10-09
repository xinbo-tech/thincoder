/**
 * proxy.mjs — 上游出口代理传输（gateway/API.md §6 KD-SV-55——自持 std；零第三方）：
 * `proxyFetch(url, opts, proxyUri)` = fetch-like 统一出口：无 uri ⇒ 原生 fetch 直连 ∥ https 目标 ⇒ CONNECT
 * 隧道（node:http 内建解析 + 自建 CONNECT——不自写 HTTP/1.1 解析；chunked ∥ 边界 ∥ 流式由内建承担）∥
 * http 目标 ⇒ 经典转发（请求行发绝对 URI）。
 *
 * 判决与边界（KD-SV-55）：
 * - 判定 = 逐渠旗 ∧ uri 在案（调用方入场——本档只收 `proxyUri`；无全局闸）；
 * - loopback 目标恒直连（NO_PROXY 语义——D-PX9：`localhost` ∥ `*.localhost` ∥ `127.0.0.0/8` ∥ `::1`）；
 * - 超时族 = CONNECT/TLS 15s ∥ 响应头阶段 600s（所沿先例 = 客户端 provider 面 `fetchTimeoutMs`——`docs/core/design/PROVIDER.md:114`）
 *   ∥ body 空闲 120s（看门狗——流式中途停摆断流不挂起）；
 * - TLS 默认全量校验（`rejectUnauthorized: true`——无 `insecureTls` 通道，§8 不做项）；
 * - 每请求独立连接（一次性 agent——无连接池；请求携 `Connection: close`）；
 * - 断连中止 = `opts.signal` abort ⇒ 拆除代理 socket（隧道 ∥ 经典转发两径同）⇒ 上游中止
 *   （§2.1 契约零回归——消费方按 `clientGone` 记 `status='aborted'`）。
 * 零依赖：node:http/tls/net 内建。
 */
import { Agent, request as httpRequest } from "node:http"
import { isIP } from "node:net"
import { connect as tlsConnect } from "node:tls"

export const PROXY_CONNECT_TIMEOUT_MS = 15000     // CONNECT/TLS 建隧阶段（15s——沿客户端 FETCH_TIMEOUT）
export const PROXY_HEADER_TIMEOUT_MS = 600000     // 响应头阶段（600s——沿客户端 provider 面 fetchTimeoutMs）
export const PROXY_BODY_IDLE_TIMEOUT_MS = 120000  // body 空闲看门狗（120s——沿客户端 `_bodyIdleMs`）

/** loopback 目标判定（NO_PROXY 语义——D-PX9；与客户端 `proxy-target.mjs` 同判据、各自实现——零 import，KD-SV-2）：
 *  `localhost` ∥ `*.localhost` ∥ `127.0.0.0/8` ∥ `::1`；解析失败 ⇒ false；尾点先归一。 */
export function isLoopbackTarget(urlStr) {
  let host
  try {
    host = new URL(urlStr).hostname
  } catch {
    return false
  }
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1) // IPv6 带括号（URL.hostname 规范形）
  if (host.endsWith(".")) host = host.slice(0, -1)
  if (host === "localhost" || host.endsWith(".localhost")) return true
  const family = isIP(host)
  if (family === 4) return host.split(".")[0] === "127"
  if (family === 6) return host === "::1"
  return false
}

/** fetch-like 统一出口（见档头）：`proxyUri` 缺省/空 ⇒ 原生 fetch（直连分支零改——行为同既有）。 */
export async function proxyFetch(urlStr, opts = {}, proxyUri = null) {
  if (!proxyUri || isLoopbackTarget(urlStr)) return globalThis.fetch(urlStr, opts) // 直连（无 uri ∥ loopback 旁路）
  const target = new URL(urlStr)
  if (target.protocol === "https:") {
    const socket = await openTunnel(target, proxyUri, opts.signal) // CONNECT + TLS（信号可中断）
    return runRequest(urlStr, opts, () => tunneledRequest(target, opts, socket), socket)
  }
  if (target.protocol === "http:") {
    return runRequest(urlStr, opts, () => classicRequest(urlStr, opts, new URL(proxyUri)))
  }
  throw new Error(`proxyFetch：目标协议须为 http(s)：${urlStr}`)
}

/** 请求公共头（两径共用）：`Connection: close`（每请求独立连接——沿客户端 streamHttpResponse 先例）∥
 *  body 携 `content-length`（避免 chunked 请求体——与原生 fetch 上线形同）。 */
function requestHeaders(opts) {
  const headers = { ...(opts.headers ?? {}), connection: "close" }
  const body = opts.body
  if (body !== undefined && body !== null) headers["content-length"] = Buffer.byteLength(body)
  return headers
}

/** CONNECT 隧道请求（TLS 已建——socket 直用；`Host` 由 options.host 规范生成）。 */
function tunneledRequest(target, opts, socket) {
  return httpRequest({
    agent: new OneShotTunnelAgent(socket), // 一次性 agent：不池化（每请求独立连接）
    host: target.hostname,
    port: Number(target.port) || 443,
    path: `${target.pathname}${target.search}`,
    method: opts.method ?? "GET",
    headers: requestHeaders(opts),
  })
}

/** 经典转发请求（http 目标）：连代理、请求行发绝对 URI（`GET http://host/path HTTP/1.1`——代理语义）；
 *  `Host` 头显式 = 目标（非代理）。 */
function classicRequest(urlStr, opts, proxy) {
  const target = new URL(urlStr)
  return httpRequest({
    host: proxy.hostname,
    port: Number(proxy.port) || 3128,
    path: urlStr, // 绝对 URI 请求行（经典代理转发）
    method: opts.method ?? "GET",
    headers: { ...requestHeaders(opts), host: target.host },
  })
}

/** 共用执行（两径同）：头阶段 600s ∥ body 空闲 120s ∥ abort 拆除（`req.destroy()` 连带代理 socket）∥
 *  响应适配（fetch-like）。`create` = 延迟建请求（abort 先行检查；`pendingSocket` = 隧道径已持 socket——先行中止时拆除）。 */
function runRequest(urlStr, opts, create, pendingSocket = null) {
  return new Promise((resolve, reject) => {
    const signal = opts.signal
    if (signal?.aborted) {
      pendingSocket?.destroy()
      return reject(abortError(signal))
    }
    const req = create()
    let res = null
    let settled = false // false = 头阶段（reject 面）∥ true = 响应已到（断流面）
    let headerTimer = null
    let idleTimer = null

    /** 失败归口：头前 ⇒ 拆请求 + reject；头后 ⇒ 断响应流（消费方 for-await 收原错误）。 */
    function fail(err) {
      if (settled) return destroyStream(err)
      settled = true
      cleanup()
      req.destroy() // 拆除代理 socket（隧道 ∥ 经典转发两径同——断连中止契约）
      reject(err)
    }
    /** 响应流终止（`destroy(err)` 前挂永久兜底 'error'——无监听者瞬间的未处理 'error' 会杀进程；
     *  沿客户端 `stream-destroy.mjs` 单点口径）。 */
    function destroyStream(err) {
      if (res === null || res.destroyed) return
      res.on("error", () => {})
      res.destroy(err)
    }
    function armIdle() {
      clearTimeout(idleTimer)
      if (res !== null && !res.destroyed) {
        idleTimer = setTimeout(() => destroyStream(new Error(`Response body timeout (idle ${PROXY_BODY_IDLE_TIMEOUT_MS / 1000}s)`)), PROXY_BODY_IDLE_TIMEOUT_MS)
      }
    }
    function cleanup() {
      clearTimeout(headerTimer)
      clearTimeout(idleTimer)
      signal?.removeEventListener("abort", onAbort)
    }
    function onAbort() {
      fail(abortError(signal))
    }

    headerTimer = setTimeout(() => fail(new Error(`Response timeout（响应头阶段 ${PROXY_HEADER_TIMEOUT_MS / 1000}s——KD-SV-55 超时族）`)), PROXY_HEADER_TIMEOUT_MS)
    signal?.addEventListener("abort", onAbort, { once: true })
    req.on("response", (response) => {
      res = response
      clearTimeout(headerTimer)
      settled = true
      armIdle()
      res.on("readable", armIdle) // 数据到达即重置空闲看门狗（'readable' 不改流模式——不抢 for-await 消费）
      res.on("close", () => {
        clearTimeout(idleTimer)
        signal?.removeEventListener("abort", onAbort)
      })
      resolve(adaptResponse(res))
    })
    req.on("error", (e) => fail(new Error(`Proxy request failed（${e.code ?? e.message}）`)))
    const body = opts.body
    if (body !== undefined && body !== null) req.end(body)
    else req.end()
  })
}

/** CONNECT 隧道建立（http 内建解析 CONNECT 应答——非 200 亦走 'connect' 事件，实读在案）：
 *  连代理 ⇒ `CONNECT host:port` ⇒ 200 ⇒ 原位 TLS 升档（默认全量校验）⇒ 交回 TLS socket。 */
function openTunnel(target, proxyUri, signal) {
  return new Promise((resolve, reject) => {
    const proxy = new URL(proxyUri)
    const host = target.hostname
    const port = Number(target.port) || 443
    const req = httpRequest({
      host: proxy.hostname,
      port: Number(proxy.port) || 3128,
      method: "CONNECT",
      path: `${host}:${port}`,
      headers: { host: `${host}:${port}` },
    })
    let settled = false
    let connected = false // 'connect' 已达（CONNECT 正常收尾时 req 'close' 随其后——不得误判为建隧失败）
    const timer = setTimeout(() => {
      req.destroy()
      finish(() => reject(new Error(`Proxy CONNECT timeout（${PROXY_CONNECT_TIMEOUT_MS / 1000}s——KD-SV-55 超时族）`)))
    }, PROXY_CONNECT_TIMEOUT_MS)
    const onAbort = () => {
      req.destroy()
      finish(() => reject(abortError(signal)))
    }
    function finish(next) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener("abort", onAbort)
      next()
    }
    if (signal?.aborted) {
      req.destroy()
      return finish(() => reject(abortError(signal)))
    }
    signal?.addEventListener("abort", onAbort, { once: true })
    req.on("connect", (response, socket, head) => {
      connected = true // 本行须先于任何 await——'close' 可能在同 tick 随后到
      if (response.statusCode !== 200) {
        socket.destroy()
        return finish(() => reject(new Error(`Proxy CONNECT rejected: HTTP ${response.statusCode}`)))
      }
      // TLS 默认全量校验（经代理的流量含 API key——不得在未验证链路上传输；§8 无 insecureTls 通道）。
      const tlsSock = tlsConnect({ socket, servername: host, rejectUnauthorized: true })
      if (head && head.length > 0) tlsSock.unshift(head)
      tlsSock.once("error", (e) => {
        socket.destroy()
        finish(() => reject(new Error(`Proxy TLS handshake failed（${e.code ?? e.message}）`)))
      })
      tlsSock.once("secureConnect", () => {
        finish(() => resolve(tlsSock))
      })
    })
    req.on("error", (e) => finish(() => reject(new Error(`Proxy CONNECT failed（${e.code ?? e.message}）`))))
    req.on("close", () => { if (!connected) finish(() => reject(new Error("Proxy connection closed before tunnel established"))) })
    req.end()
  })
}

/** 一次性连接 agent：`createConnection` 恒返已建隧道 socket（keepAlive = false——响应毕即散，不池化）。 */
class OneShotTunnelAgent extends Agent {
  #socket
  constructor(socket) {
    super({ keepAlive: false })
    this.#socket = socket
  }
  createConnection() {
    return this.#socket
  }
}

/** 响应适配（fetch-like）：`{ ok, status, headers: Headers, body, text(), arrayBuffer() }`。
 *  `body` = 异步可迭代（逐块——SSE 流式）+ `cancel()`（中止；沿 fetch ReadableStream 消费形）。 */
function adaptResponse(res) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(res.headers)) {
    if (Array.isArray(value)) for (const item of value) headers.append(key, String(item))
    else if (value !== undefined) headers.append(key, String(value))
  }
  const body = {
    [Symbol.asyncIterator]: () => res[Symbol.asyncIterator](),
    cancel: async () => {
      res.destroy()
    },
  }
  return {
    ok: res.statusCode >= 200 && res.statusCode < 300,
    status: res.statusCode,
    headers,
    body,
    text: async () => (await collectBody(res)).toString("utf8"),
    arrayBuffer: async () => {
      const bytes = await collectBody(res)
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    },
  }
}

async function collectBody(res) {
  const chunks = []
  for await (const chunk of res) chunks.push(chunk)
  return Buffer.concat(chunks)
}

/** 中止错误（fetch-like——消费方按 `clientGone` 记 `aborted`，错误形只作诊断）。 */
function abortError(signal) {
  const reason = signal?.reason
  if (reason instanceof Error) return reason
  return new Error(reason !== undefined ? `请求已中止：${String(reason)}` : "请求已中止（信号触发）")
}
