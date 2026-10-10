/**
 * client.mjs — runner 通道客户端（sandbox/RUNNER.md §2；端点表 = gateway/API.md §2.6；runner 为调用方）：
 * join 注册（一次性 join token ⇒ runner 令牌）∥ 心跳 ∥ 长轮询（≤25s——携本机 rulesRev）∥ 上报 ∥ 待批登记 ∥
 * 快照上送（octet-stream 流式体——路由级 200 MiB 豁免）/ 取回。
 * 断连退避 = 1s → 30s 指数 + 抖动（`nextBackoffMs`）；错误形 = 统一信封 `{ error: { code, message } }`。
 */
export const HEARTBEAT_INTERVAL_MS = 15000 // 心跳周期（§3——与 registry.mjs 常量同值；runner 侧自持）
export const POLL_WAIT_MS = 25000 // 长轮询等待上限（§3「≤25s」）
export const BACKOFF_BASE_MS = 1000
export const BACKOFF_MAX_MS = 30000

/** 通道错误（携带服务端 `code` —— 三态人话等诊断面）。 */
export class RunnerApiError extends Error {
  constructor(code, message, status = 0) {
    super(message)
    this.name = "RunnerApiError"
    this.code = code
    this.status = status
  }
}

/** 退避：指数 ×2 + 抖动（0.8–1.2），封顶 30s（§2「断连退避 1s→30s」）。 */
export function nextBackoffMs(previousMs = 0, { random = Math.random } = {}) {
  const base = previousMs > 0 ? Math.min(previousMs * 2, BACKOFF_MAX_MS) : BACKOFF_BASE_MS
  const jittered = Math.round(base * (0.8 + random() * 0.4))
  return Math.max(200, Math.min(jittered, BACKOFF_MAX_MS))
}

/**
 * 建通道客户端。`fetchImpl` 注入口径（批内件替身）；`requestTimeoutMs` = 普通请求预算（长轮询另计——`pollTimeoutMs`）。
 * 方法：`join`（静态——免令牌开口）∥ 实例 `heartbeat` ∥ `poll` ∥ `report` ∥ `pending` ∥ `uploadCheckpoint` ∥ `fetchCheckpoint`。
 */
export function createRunnerClient({ server, token = null, fetchImpl = fetch, requestTimeoutMs = 20000, pollTimeoutMs = POLL_WAIT_MS + 10000 } = {}) {
  if (typeof server !== "string" || server.trim() === "") throw new Error("createRunnerClient：缺 server 地址")
  const base = server.replace(/\/+$/, "")

  async function callApi(method, path, { body = null, raw = null, contentType = null, timeoutMs = requestTimeoutMs, tokenOverride = undefined } = {}) {
    const headers = {}
    const bearer = tokenOverride === undefined ? token : tokenOverride
    if (bearer) headers.authorization = `Bearer ${bearer}`
    let payload
    if (raw !== null) {
      payload = raw
      headers["content-type"] = contentType ?? "application/octet-stream"
    } else if (body !== null) {
      payload = JSON.stringify(body)
      headers["content-type"] = "application/json"
    }
    let res
    try {
      res = await fetchImpl(`${base}${path}`, { method, headers, body: payload, signal: AbortSignal.timeout(timeoutMs) })
    } catch (e) {
      throw new RunnerApiError("unreachable", `服务器不可达：${e.message}`, 0)
    }
    const text = await res.text()
    let json = null
    try {
      json = text === "" ? null : JSON.parse(text)
    } catch {
      /* 非 JSON 体（网关兜底形）——按 text 判 */
    }
    if (!res.ok) {
      throw new RunnerApiError(json?.error?.code ?? "http_error", json?.error?.message ?? `HTTP ${res.status}：${text.slice(0, 200)}`, res.status)
    }
    return json
  }

  return {
    base,
    heartbeat: (payload = {}) => callApi("POST", "/api/runner/heartbeat", { body: payload }),
    poll: (payload = {}) => callApi("POST", "/api/runner/poll", { body: payload, timeoutMs: pollTimeoutMs }),
    report: (payload = {}) => callApi("POST", "/api/runner/report", { body: payload }),
    pending: (payload = {}) => callApi("POST", "/api/runner/pending", { body: payload }),
    /** 快照上送：`bytes` = 打包产物（Buffer）；query 携 workspaceId/note（体 = 不透明字节流——元数据仅余通道）。 */
    uploadCheckpoint: ({ workspaceId, note = "", bytes }) => {
      const query = new URLSearchParams({ workspaceId: String(workspaceId) })
      if (note) query.set("note", String(note).slice(0, 200))
      return callApi("POST", `/api/runner/checkpoint?${query.toString()}`, { raw: bytes, contentType: "application/octet-stream", timeoutMs: 10 * 60 * 1000 })
    },
    /** 快照取回（换机重建套用）。 */
    fetchCheckpoint: async (id) => {
      let res
      try {
        res = await fetchImpl(`${base}/api/runner/checkpoint/${encodeURIComponent(id)}`, {
          method: "GET",
          headers: token ? { authorization: `Bearer ${token}` } : {},
          signal: AbortSignal.timeout(10 * 60 * 1000),
        })
      } catch (e) {
        throw new RunnerApiError("unreachable", `快照取回失败：${e.message}`, 0)
      }
      if (!res.ok) throw new RunnerApiError("http_error", `快照取回失败：HTTP ${res.status}`, res.status)
      return { bytes: Buffer.from(await res.arrayBuffer()), headers: res.headers }
    },
  }
}

/** join（免 runner 令牌——唯一开口）：一次性 join token ⇒ `{ runnerId, token }`（服务器侧只存 sha256）。 */
export async function joinServer({ server, joinToken, name = null, labels = {}, maxBoxes = null, version = null, runtime = null, runtimeAvailable = null, fetchImpl = fetch, timeoutMs = 20000 } = {}) {
  const base = String(server).replace(/\/+$/, "")
  let res
  try {
    res = await fetchImpl(`${base}/api/runner/join`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: joinToken, name, labels, maxBoxes, version, runtime, runtimeAvailable }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (e) {
    throw new RunnerApiError("unreachable", `服务器不可达：${e.message}`, 0)
  }
  const text = await res.text()
  let json = null
  try {
    json = text === "" ? null : JSON.parse(text)
  } catch {
    /* 非 JSON 体 */
  }
  if (!res.ok) throw new RunnerApiError(json?.error?.code ?? "http_error", json?.error?.message ?? `HTTP ${res.status}`, res.status)
  return json
}
