/**
 * proxy-transport.mjs — 传输面（2026-10-08 拆档——原 `proxy.mjs` 迁出；#1037）：
 * CONNECT 隧道 ∥ 经典转发 ∥ 流式响应。`FETCH_TIMEOUT` = CONNECT/TLS 与经典转发建连超时（15s；
 * 响应头阶段另有 `opts._headerTimeoutMs`）。
 * 响应体 `Transfer-Encoding: chunked` ⇒ 解码器剥帧（`proxy-chunked.mjs`；#1065）；单 token 已知
 * `content-encoding`（gzip ∥ x-gzip ∥ deflate ∥ br）⇒ 剥帧后接解压器（#1067）。chunked 径背压：
 * body 前最后一级可写流拒收 ⇒ 暂停上游源，排空 ⇒ 恢复（#1087）。
 * 零依赖：Node built-ins only（net, tls, stream, url, zlib）。
 */
import { connect } from "node:net"
import { connect as tlsConnect } from "node:tls"
import { PassThrough } from "node:stream"
import { URL } from "node:url"
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib"
import { abortError, timeoutError } from "./abort-provenance.mjs"
import { createChunkedDecoder } from "./proxy-chunked.mjs"
import { destroyBody } from "./stream-destroy.mjs"

export const FETCH_TIMEOUT = 15_000

/** 响应头终止序列（头阶段按字节累积——#1065 K5：chunked 首段须以字节交接）。 */
const HEADER_END = Buffer.from("\r\n\r\n")

/** content-encoding 解压器族（#1067——单 token 且已列 ⇒ 解压；identity ∥ 未知 ∥ 多 token 列表透传）。 */
const CE_DECODERS = { gzip: createGunzip, "x-gzip": createGunzip, deflate: createInflate, br: createBrotliDecompress }

/**
 * 在已建立的 socket 上发 HTTP 请求，响应头到齐即 resolve（流式）。
 * 返回 Response-like: { ok, status, headers: Headers, body: PassThrough(异步迭代), text(): Promise<string> }
 * body 边收边吐（SSE 流式消费方可逐 chunk 读取）；text() 消费流到底（非流式调用方用）。
 * 响应头 `Transfer-Encoding: chunked` ⇒ 体经 `proxy-chunked.mjs` 解码器剥帧后入 body（#1065；
 * 流式保形、畸形帧回退透传、`0` 块 ⇒ body 结束）；单 token 已知 `content-encoding` ⇒ 剥帧后接
 * 解压器（#1067）；chunked 径背压 ⇒ 暂停上游源 / 排空恢复（#1087）；非 chunked 无 CE 径零动。
 * opts.signal 全程有效：abort 即 destroy socket 并 reject/终止流。
 * absoluteForm: 请求行发绝对 URI（http:// 目标的经典代理转发用），默认发 origin-form。
 * 2026-08-31 会诊 #4：timeout 只覆盖"响应头阶段"；settle 后 body 空闲 > bodyIdleMs 即
 * 断流（原实现头部 timer 到齐即清，流式中途停摆会无限挂起直到用户 Ctrl+C）。
 * bodyIdleMs 默认 120s（provider 长生成用 0 即禁用，由调用方决定）。
 * 导出供测试（裸 socket，无需 TLS/CONNECT）；生产路径走 tunnelHttps / proxyFetch。
 */
export function streamHttpResponse(sock, urlStr, opts = {}, timeout = FETCH_TIMEOUT, absoluteForm = false, bodyIdleMs = 120_000) {
  return new Promise((resolve, reject) => {
    const target = new URL(urlStr)
    const method = opts.method ?? "GET"
    const headers = opts.headers ?? {}
    const signal = opts.signal

    if (signal?.aborted) { sock.destroy(); return reject(abortError(signal, "provider", "proxy")) }

    const body = new PassThrough()
    let settled = false
    let headerBuf = Buffer.alloc(0) // 头阶段按字节累积（#1065 K5——替代 utf8 往返）
    let idleTimer = null
    let sink = null            // body 前解压器（单 token 已知 content-encoding 时建立——#1067；无则 null）
    let sawInput = false       // 解压器输入门（#1067）：零输入（空体）+ CE 在场 ⇒ 不解压（零误报）
    let pausedUpstream = false // 背压旗（#1087）：sock.pause() 在场，幂等守卫

    const timer = setTimeout(() => fail(timeoutError("Response timeout", "provider", "proxy-header")), timeout)
    const onAbort = () => { sock.destroy(); fail(abortError(signal, "provider", "proxy")) }
    signal?.addEventListener("abort", onAbort, { once: true })

    function cleanup() {
      clearTimeout(timer)
      clearTimeout(idleTimer)
      signal?.removeEventListener("abort", onAbort)
    }
    /** 头部阶段失败 reject；resolve 后失败则终止 body 流（for-await 抛出，不挂起） */
    function fail(err) {
      cleanup()
      if (!settled) { settled = true; reject(err) }
      else destroyBody(body, err)
    }
    /** 背压暂停上游源（#1087——幂等：排空前只暂停一次） */
    function pauseUpstream() {
      if (!pausedUpstream) { pausedUpstream = true; sock.pause() }
    }
    /** 排空恢复上游源（#1087——暂停态对偶臂，幂等） */
    function resumeUpstream() {
      if (pausedUpstream) { pausedUpstream = false; sock.resume() }
    }
    /** body 结束（幂等——`0` 块 ∥ 对端 close 两径都会到达；#1065）：带 CE 且已收输入 ⇒ 先结解压器
     *  （flush 后经 pipe 结 body）；零输入（空体 + CE 在场）⇒ 直结 body（sawInput 门——#1067，零误报）。 */
    function endBody() {
      if (sink && sawInput) {
        if (!sink.destroyed && !sink.writableEnded) sink.end()
        return
      }
      if (!body.destroyed && !body.writableEnded) body.end()
    }
    /** 推入 body 前最后一级可写流（带 CE = 解压器 ∥ 无 CE = body——#1087 暂停触发级）；
     *  `write()` 返 false ⇒ 暂停上游源（排空后 'drain' 恢复）；终止后不再写（watchdog ∥ abort ∥
     *  `0` 块后余包，与非 chunked 径 pipe 自摘语义齐）。 */
    function pushDownstream(chunk) {
      const target = sink ?? body
      if (target.destroyed || target.writableEnded) return
      if (sink) sawInput = true
      if (target.write(chunk) === false) pauseUpstream()
    }
    /** body 阶段空闲看门狗：每次数据到达重置；无数据超时 → 断流（流式消费方抛错） */
    function armIdle() {
      clearTimeout(idleTimer)
      if (bodyIdleMs > 0) idleTimer = setTimeout(() => destroyBody(body, timeoutError("Response body timeout (idle)", "provider", "proxy-body-idle")), bodyIdleMs)
    }

    sock.on("data", (d) => {
      if (settled) return // 理论上不会发生（settle 后摘掉本监听器），防御
      headerBuf = headerBuf.length > 0 ? Buffer.concat([headerBuf, d]) : d
      const idx = headerBuf.indexOf(HEADER_END)
      if (idx < 0) return

      const headerText = headerBuf.subarray(0, idx).toString("utf8")
      const statusMatch = headerText.match(/^HTTP\/\d\.\d (\d+)/)
      const status = statusMatch ? Number(statusMatch[1]) : 502
      const respHeaders = {}
      for (const line of headerText.split("\r\n").slice(1)) {
        const ci = line.indexOf(":")
        if (ci > 0) respHeaders[line.slice(0, ci).trim().toLowerCase()] = line.slice(ci + 1).trim()
      }

      // 头到齐：摘掉头阶段监听；剩余字节（字节副本）按 TE 分径交接
      sock.removeAllListeners("data")
      settled = true
      cleanup()
      armIdle()
      const remaining = Buffer.from(headerBuf.subarray(idx + 4))
      // 判定按 Transfer-Encoding 末段 token（大小写不敏感）；头缺席而帧在场（协议违规）不解码
      const chunked = (respHeaders["transfer-encoding"] ?? "").split(",").pop().trim().toLowerCase() === "chunked"
      // 内容编码解压阶段（#1067——TE 剥帧后接，chunked ∥ 非 chunked 两径同点）：单 token 且已列编码
      // 建解压器；identity ∥ 头缺席 ∥ 未知编码 ∥ 多 token 列表 ⇒ 透传零动。请求头零改（不发
      // Accept-Encoding——上游自发压缩才走本阶段）。
      const ceTokens = (respHeaders["content-encoding"] ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      const ceFactory = ceTokens.length === 1 ? CE_DECODERS[ceTokens[0]] : undefined
      if (ceFactory) {
        sink = ceFactory()
        // 解压失败 ⇒ body 以明错误终止（部分解码已发生——无「原字节」可回退）；解压器 ⇒ body 走 pipe
        // （自带背压：body 慢 ⇒ 解压器停 ⇒ 其可写侧涨满 ⇒ 推送臂暂停源）。
        sink.on("error", (e) => fail(new Error(`Response body decompression failed (content-encoding: ${ceTokens[0]}): ${e.message}`)))
        sink.pipe(body)
      }
      if (chunked) {
        // chunked 径：解码器剥帧 ⇒ 逐段推入 body 前最后一级（带 CE = 解压器；函数式改写——body 本体零替换）；
        // 不再 pipe——body 由解码器 onData/onEnd 驱动
        const decoder = createChunkedDecoder({ onData: pushDownstream, onEnd: endBody })
        sock.on("data", (c) => decoder.push(c)) // 推送臂 = 背压暂停点（#1087：write() 返 false ⇒ sock.pause()）
        decoder.push(remaining)
      } else if (sink) {
        // 非 chunked 径 · 带 CE：源 ⇒ 解压器（推送臂同形——背压暂停点同判）
        if (remaining.length > 0) pushDownstream(remaining)
        sock.on("data", pushDownstream)
      } else {
        // 非 chunked 径 · 无 CE：原样直写 + pipe（现状语义，零动）
        if (remaining.length > 0) body.write(remaining)
        sock.pipe(body)
      }
      // 空闲看门狗随数据到达重置。注意必须用 'readable' 而非 'data'：
      // 'data' 监听把流切成 flowing 模式，会抢走 readSSE/for-await 未来得及认领的
      // 已写缓冲（2026-08-31 实测：分包响应头的 remaining 首段被吞，readSSE 等不到 ack）。
      // 'readable' 不改变流模式，数据仍由消费方按需拉取。
      body.on("readable", armIdle)
      // 背压排空 = 消费进度信号（#1087——防「暂停期无数据到达」把慢而健康的消费者误杀）。
      body.on("drain", armIdle)
      // 背压对偶臂：排空 ⇒ 恢复上游源。带 CE 时恢复信号在解压器（body 经 pipe 先恢复解压器——链传导）；
      // 无 CE 时 body 即最后一级 ⇒ 其 drain 即恢复点。
      if (sink) sink.on("drain", resumeUpstream)
      else body.on("drain", resumeUpstream)
      // body 结束后才移除 abort 监听（流式中途 abort 要能终止流）；空闲看门狗一并清
      body.on("close", () => {
        clearTimeout(idleTimer)
        signal?.removeEventListener("abort", onAbort)
        // 停止门（#1087 评审 F3）：body 终止时上游仍在背压暂停态 ⇒ 先恢复再销毁源——
        // 被暂停的 sock 不因 body 消亡自行关闭（悬挂口）。
        if (pausedUpstream) { pausedUpstream = false; sock.resume(); sock.destroy() }
      })
      signal?.addEventListener("abort", onAbort, { once: true })

      resolve({
        ok: status >= 200 && status < 400,
        status,
        headers: new Headers(respHeaders),
        body,
        text: async () => {
          const chunks = []
          for await (const c of body) chunks.push(c)
          return Buffer.concat(chunks).toString("utf8")
        },
      })
    })
    sock.on("close", () => {
      if (!settled) fail(new Error("Connection closed before response"))
      else endBody()
    })
    // 头部阶段的传输错误统一包装为稳定契约（对端 RST 会抛原生 ECONNRESET，调用方难判别）；
    // resolve 后的 body 阶段保留原始错误终止流
    sock.on("error", (e) => {
      if (!settled) fail(new Error(`Connection closed before response (${e.code ?? e.message})`))
      else fail(e)
    })

    // 写请求（absoluteForm：代理转发时请求行为绝对 URI）
    const requestTarget = absoluteForm ? urlStr : `${target.pathname}${target.search}`
    const lines = [`${method} ${requestTarget} HTTP/1.1`]
    for (const [k, v] of Object.entries({ ...headers, Host: target.hostname })) lines.push(`${k}: ${v}`)
    lines.push("Connection: close", "", "")
    sock.write(lines.join("\r\n"))
    if (opts.body) sock.write(opts.body)
  })
}

/**
 * HTTPS request through HTTP CONNECT proxy tunnel.
 * CONNECT + TLS 建立后交给 streamHttpResponse — 响应头到齐即 resolve，body 为流式。
 * 2026-08-31 会诊 #1/#4：
 *  - TLS 默认全量证书校验（rejectUnauthorized: true）——走代理的流量（含 API key）
 *    不得在未验证链路上传输；确需自签/内网代理时 opts.insecureTls=true 显式放行。
 *  - CONNECT/TLS 阶段用 timeout（默认 15s，建隧道快）；**响应头超时**用
 *    opts._headerTimeoutMs（默认 60s）——原实现共用 15s，DeepSeek 排队 TTFB>15s
 *    即误报 "Response timeout"，与直连 600s 语义割裂。
 */
export function tunnelHttps(urlStr, opts, proxyUri, timeout = FETCH_TIMEOUT) {
  return new Promise((resolve, reject) => {
    let target, proxy
    try {
      target = new URL(urlStr)
      proxy = new URL(proxyUri)
    } catch {
      // 融合（§2.5 #74——取双侧并集）：VSC 侧的**坏代理串友好报错**并入核内——
      // 原生 `Invalid URL` 不解释期望形态，调用方拿到的可观测文案退化。
      return reject(new Error(`Invalid proxy URI: "${proxyUri}" — expected http://host:port`))
    }
    const signal = opts?.signal
    const headerTimeoutMs = Number.isFinite(opts?._headerTimeoutMs) ? opts._headerTimeoutMs : 60_000
    const bodyIdleMs = opts?._bodyIdleMs ?? 120_000

    if (signal?.aborted) return reject(abortError(signal, "provider", "proxy"))

    const sock = connect({ host: proxy.hostname, port: Number(proxy.port) || 3128 })
    const timer = setTimeout(() => { sock.destroy(); reject(new Error("Proxy CONNECT timeout")) }, timeout)
    const onAbort = () => { sock.destroy(); reject(abortError(signal, "provider", "proxy")) }
    signal?.addEventListener("abort", onAbort, { once: true })
    sock.on("connect", () => sock.write(`CONNECT ${target.hostname}:${target.port || 443} HTTP/1.1\r\nHost: ${target.hostname}\r\n\r\n`))

    let buf = ""
    sock.on("data", d => {
      buf += d.toString()
      const end = buf.indexOf("\r\n\r\n")
      if (end < 0) return
      const statusLine = buf.slice(0, end).split("\r\n")[0]
      buf = buf.slice(end + 4)
      if (!statusLine.includes("200")) { sock.destroy(); clearTimeout(timer); return reject(new Error(`Proxy CONNECT: ${statusLine}`)) }
      sock.removeAllListeners("data"); clearTimeout(timer)

      // 安全默认：TLS 全量校验。企业中间人代理场景显式 opts.insecureTls=true 才放行。
      const tlsSock = tlsConnect({ socket: sock, servername: target.hostname, rejectUnauthorized: opts?.insecureTls !== true })
      if (buf) tlsSock.unshift(Buffer.from(buf))
      tlsSock.on("secureConnect", () => {
        // TLS 之后的请求/响应阶段：abort 交由 streamHttpResponse 接管
        signal?.removeEventListener("abort", onAbort)
        streamHttpResponse(tlsSock, urlStr, opts, headerTimeoutMs, false, bodyIdleMs).then(resolve, reject)
      })
      tlsSock.on("error", e => { sock.destroy(); reject(e) })
    })
    sock.on("error", e => { clearTimeout(timer); reject(new Error(`Proxy CONNECT failed (${e.code ?? e.message})`)) })
    // 代理干净 FIN 关闭（无 error）时也要 reject，不能卡满超时
    sock.on("close", () => { clearTimeout(timer); reject(new Error("Proxy connection closed before tunnel established")) })
  })
}

/** TCP 直连代理（http:// 目标的经典转发用）：超时/abort/对端关闭都有稳定 reject */
export function tcpConnectProxy(proxyUri, signal, timeout) {
  return new Promise((resolve, reject) => {
    let proxy
    try {
      proxy = new URL(proxyUri)
    } catch {
      // 融合（§2.5 #74）：同 tunnelHttps——坏代理串友好报错。
      return reject(new Error(`Invalid proxy URI: "${proxyUri}" — expected http://host:port`))
    }
    const sock = connect({ host: proxy.hostname, port: Number(proxy.port) || 3128 })
    if (signal?.aborted) { sock.destroy(); return reject(abortError(signal, "provider", "proxy")) }
    const onAbort = () => sock.destroy()
    signal?.addEventListener("abort", onAbort, { once: true })
    const timer = setTimeout(() => { sock.destroy(); reject(new Error("Proxy CONNECT timeout")) }, timeout)
    const onError = (e) => { clearTimeout(timer); reject(new Error(`Proxy CONNECT failed (${e.code ?? e.message})`)) }
    const onClose = () => {
      clearTimeout(timer)
      reject(signal?.aborted ? abortError(signal, "provider", "proxy") : new Error("Proxy connection closed before tunnel established"))
    }
    sock.once("connect", () => {
      clearTimeout(timer)
      signal?.removeEventListener("abort", onAbort)
      sock.removeListener("error", onError)
      sock.removeListener("close", onClose)
      resolve(sock)
    })
    sock.once("error", onError)
    sock.once("close", onClose)
  })
}
