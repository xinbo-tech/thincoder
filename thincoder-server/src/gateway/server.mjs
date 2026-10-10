/**
 * server.mjs — http 服务 ∥ 路由注册表 ∥ 静态面兜底 ∥ 写端点 JSON 型门 ∥ body 读限（32 MiB；快照路由 200 MiB——§2.6） ∥ 逐请求日志（含断连行）
 * （gateway/API.md §1 ∥ §4；型门口径 = accounts/ACCOUNTS.md §3 ∥ metering/METERING.md §3 前言）。
 *
 * 分派 = 「method + path → 处理函数」注册行制（扩展点 G1）：新端点 = 注册一行 + 新处理模块，
 * 不塞主干 if-else。处理函数签名 `(req, res, ctx)`，ctx = `{ config, log, routes, params }`。
 * 静态面（webui——`public/` 直发） = 注册路由之后的 GET/HEAD 兜底：`/v1/*` ∥ `/api/*` 不走（优先级 = API.md §1）。
 *
 * 路由级豁免（KD-SV-77——`POST /api/runner/checkpoint` 快照上送）：型门豁免（收 `application/octet-stream`——`/api/*` 写端点中唯一）
 * ∥ 体限抬高（200 MiB——其余写端点照旧 32 MiB + JSON 门）；豁免落在 `requiresJsonWrite`/`exceedsBodyLimit` 两处路由化分支（仅此路径）。
 */
import { createServer } from "node:http"

import { HttpError, sendError } from "./errors.mjs"

/** 请求体上限（gateway/API.md §3——413 `payload_too_large`；超限不转发）。 */
export const MAX_BODY_BYTES = 32 * 1024 * 1024

/** 快照上送体上限（路由级——`POST /api/runner/checkpoint`，KD-SV-77；与 runner 侧本地跳过阈值同值）。 */
export const MAX_CHECKPOINT_BYTES = 200 * 1024 * 1024

/** 快照上送路径（型门豁免 + 体限抬高的唯一路由——KD-SV-77）。 */
export const CHECKPOINT_UPLOAD_PATH = "/api/runner/checkpoint"

export function isCheckpointUpload(method, pathname) {
  return String(method).toUpperCase() === "POST" && pathname === CHECKPOINT_UPLOAD_PATH
}

/** 路由级体限（缺省 32 MiB；快照上送 200 MiB）——预检面 = 本函数（常量单源）；流内面 = 路由自身限（缺省同源），生产两层同值。 */
export function bodyLimitFor(method, pathname) {
  return isCheckpointUpload(method, pathname) ? MAX_CHECKPOINT_BYTES : MAX_BODY_BYTES
}

/**
 * 路由注册表（G1）：`add(method, path, handler)` 注册一行；`/段/:名` 段 = 路径参数（捕获进 `params`；
 * accounts/metering 端点表用）。resolve = 注册顺序首个匹配胜出；方法/路径未命中 ⇒ null（调用方回 404）。
 */
export function createRouteTable() {
  const entries = []
  return {
    add(method, path, handler) {
      const upper = String(method).toUpperCase()
      const key = `${upper} ${path}`
      if (entries.some((entry) => entry.key === key)) throw new Error(`路由重复注册：${key}`)
      entries.push({ key, method: upper, segments: splitPath(path), handler })
      return handler
    },
    resolve(method, pathname) {
      const segments = splitPath(pathname)
      for (const entry of entries) {
        if (entry.method !== method || entry.segments.length !== segments.length) continue
        const params = {}
        let matched = true
        for (let i = 0; i < segments.length; i++) {
          const spec = entry.segments[i]
          if (spec.startsWith(":")) params[spec.slice(1)] = segments[i]
          else if (spec !== segments[i]) { matched = false; break }
        }
        if (matched) return { handler: entry.handler, params }
      }
      return null
    },
    get size() { return entries.length },
  }
}

/** 建 http 服务（未 listen——监听归入口）。逐请求一行日志（method ∥ path ∥ status ∥ ms）。
 *  `staticSite` = `createStaticSite()` 产物（webui/static.mjs）——缺省 null（纯 API 面，测试面友好）。 */
export function createGatewayServer({ config = {}, routes, log = null, staticSite = null } = {}) {
  if (!routes) throw new Error("createGatewayServer：缺少路由表（routes = createRouteTable()）")
  return createServer((req, res) => {
    const started = Date.now()
    const pathname = safePathname(req.url)
    // 逐请求一行（D3 接线补断连面）：正常 = `finish`；中途断连 = `close`（`aborted: true`——未发响应头时
    // status 记 null；`finish` 对断连不触发，不补则该请求无行）。
    let logged = false
    const logRequest = (aborted = false) => {
      if (logged) return
      logged = true
      log?.info("request", {
        method: req.method,
        path: pathname,
        status: res.headersSent ? res.statusCode : null,
        ms: Date.now() - started,
        ...(aborted ? { aborted: true } : {}),
      })
    }
    res.on("finish", () => logRequest())
    res.on("close", () => logRequest(!res.writableEnded))
    const route = routes.resolve(req.method, pathname)
    if (!route) {
      if (servesStatic(staticSite, req, pathname) && staticSite.serve(req, res, pathname)) return
      sendError(res, "not_found", `无此路由：${req.method} ${pathname}`)
      return
    }
    if (requiresJsonWrite(req.method, pathname) && !isJsonContentType(req.headers["content-type"])) {
      sendError(res, "invalid_request_error", "写端点仅收 application/json（Content-Type 须为 application/json）")
      return
    }
    const bodyLimit = bodyLimitFor(req.method, pathname)
    if (exceedsBodyLimit(req, bodyLimit)) {
      sendError(res, "payload_too_large", `请求体超过上限（${bodyLimit} 字节）`)
      return
    }
    Promise.resolve()
      .then(() => route.handler(req, res, { config, log, routes, params: route.params }))
      .catch((err) => failRequest(res, err, log))
  })
}

/** 读请求体并按 JSON 解析：超限 ⇒ `payload_too_large`（413）；非法 JSON ⇒ `invalid_request_error`（400）。
 *  边界：settle 后保留 `error` 监听（后续套接字错误不抛——空转）；同一 req 仅可调用一次。 */
export function readJsonBody(req, { limit = MAX_BODY_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    if (req.readableEnded) {
      reject(new HttpError("internal_error", "请求体已耗尽（readJsonBody 仅可调用一次）"))
      return
    }
    const chunks = []
    let size = 0
    let settled = false
    const settle = (fn, value) => {
      if (settled) return
      settled = true
      req.off("data", onData)
      req.off("end", onEnd)
      fn(value)
    }
    const onData = (chunk) => {
      size += chunk.length
      if (size > limit) {
        req.resume() // 余下体丢弃（连接不悬停）——响应由分派层发
        settle(reject, new HttpError("payload_too_large", `请求体超过上限（${limit} 字节）`))
        return
      }
      chunks.push(chunk)
    }
    const onEnd = () => {
      try {
        settle(resolve, JSON.parse(Buffer.concat(chunks).toString("utf8")))
      } catch (e) {
        settle(reject, new HttpError("invalid_request_error", `body 非合法 JSON：${e.message}`))
      }
    }
    const onError = (e) => settle(reject, e)
    req.on("data", onData)
    req.on("end", onEnd)
    req.on("error", onError)
  })
}

/** 流式读请求体（不整块缓冲——快照上送用，KD-SV-77）：逐块交 `onChunk`（调用方边收边写）；超限 ⇒
 *  `payload_too_large`（413——余体丢弃、已写部分由调用方清理）；端到端字节数 ⇒ `{ bytes }`。
 *  背压 = `onChunk` 内可 `req.pause()`（本函数不代管；调用方在 drain 后 `req.resume()`）。
 *  边界同 `readJsonBody`：同一 req 仅可调用一次；settle 后 `data`/`end` 摘下（`error` 留守——套接字晚错不抛），
 *  且 `onChunk` 不再被调（settle 后的残余块直接丢弃——调用方已收手）。 */
export function readStreamBody(req, { limit = MAX_BODY_BYTES, onChunk } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof onChunk !== "function") {
      reject(new HttpError("internal_error", "readStreamBody 缺 onChunk（流式落盘的写入口）"))
      return
    }
    if (req.readableEnded) {
      reject(new HttpError("internal_error", "请求体已耗尽（readStreamBody 仅可调用一次）"))
      return
    }
    let size = 0
    let settled = false
    const settle = (fn, value) => {
      if (settled) return
      settled = true
      req.off("data", onData)
      req.off("end", onEnd)
      fn(value)
    }
    const onData = (chunk) => {
      if (settled) return // 残余块不再交调用方（其写流可能已销毁——否则 = 给已销毁流写）
      size += chunk.length
      if (size > limit) {
        req.resume() // 余下体丢弃（连接不悬停）——响应由调用方发
        settle(reject, new HttpError("payload_too_large", `请求体超过上限（${limit} 字节）`))
        return
      }
      try {
        onChunk(chunk)
      } catch (e) {
        req.resume()
        settle(reject, e)
      }
    }
    const onEnd = () => settle(resolve, { bytes: size })
    const onError = (e) => settle(reject, e)
    req.on("data", onData)
    req.on("end", onEnd)
    req.on("error", onError)
  })
}

/** 处理函数异常收口：HttpError ⇒ 表内错误形（附加头随 `HttpError.headers`——`Retry-After`）；其余 ⇒ 500 `internal_error`（记日志）。 */
function failRequest(res, err, log) {
  if (res.headersSent || res.writableEnded) {
    res.destroy()
    return
  }
  if (err instanceof HttpError) {
    sendError(res, err.code, err.message, { headers: err.headers }) // 如 429 限流的 `Retry-After`（KD-SV-35）
    return
  }
  log?.error("handler_error", { message: err?.message ?? String(err) })
  sendError(res, "internal_error", "服务内部错误")
}

/** `Content-Length` 预检（流式体由 `readJsonBody`/`readStreamBody` 兜底；限值 = 路由级——`bodyLimitFor`）。 */
function exceedsBodyLimit(req, limit) {
  const length = Number(req.headers["content-length"])
  return Number.isFinite(length) && length > limit
}

/** 静态面候选：GET/HEAD 且非服务面路径（`/v1/*` ∥ `/api/*` 永不走静态面——gateway/API.md §1 优先级）。 */
function servesStatic(staticSite, req, pathname) {
  if (!staticSite) return false
  if (req.method !== "GET" && req.method !== "HEAD") return false
  return !isServicePath(pathname)
}

/** 服务面路径判据（OpenAI 面 ∥ 账号/计量面——静态面互斥）。 */
function isServicePath(pathname) {
  return pathname === "/v1" || pathname.startsWith("/v1/") || pathname === "/api" || pathname.startsWith("/api/")
}

/** `/api/*` 写端点（非 GET/HEAD）仅收 `application/json`（accounts/ACCOUNTS.md §3 ∥ metering/METERING.md §3）——
 *  跨站防护第二道（配合 `SameSite=Strict`）：非 JSON 体属跨站可直发形，一律 400。
 *  唯一豁免 = `POST /api/runner/checkpoint`（快照上送收 `application/octet-stream`——KD-SV-77）。 */
function requiresJsonWrite(method, pathname) {
  if (isCheckpointUpload(method, pathname)) return false
  return pathname.startsWith("/api/") && method !== "GET" && method !== "HEAD"
}

/** Content-Type 判据：`application/json`（允许 `; charset=…` 参数）。 */
function isJsonContentType(value) {
  if (typeof value !== "string") return false
  return value.split(";")[0].trim().toLowerCase() === "application/json"
}

function normalizePath(pathname) {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

/** 请求 URL → 路径名（畸形 URL 不炸进程——按根路径走 404）。 */
function safePathname(url) {
  try {
    return normalizePath(new URL(url, "http://localhost").pathname)
  } catch {
    return "/"
  }
}

function splitPath(path) {
  return String(path).split("/").filter((segment) => segment !== "")
}
