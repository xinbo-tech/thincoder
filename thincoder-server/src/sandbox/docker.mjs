/**
 * docker.mjs — Docker API 客户端（sandbox/SANDBOX.md §3 ∥ §14 KD-SV-79/80/81；台账 #1251）：
 * 地址归一（缺协议补 `http://`、缺端口补 2375；`https:` 拒）∥ 版本协商（引导步 = 无前缀读数 → `max(1.44, MinAPIVersion)` ≤ `ApiVersion`
 * → 带前缀复读）∥ **调用恒带版本前缀** ∥ 超时（读类 3s ∥ 动作类 15s——常量；测试可注入 `fetchImpl`）∥ 错误映射。
 *
 * 消费面 = 控制台节点/容器面（`routes.mjs` ∥ `container-routes.mjs`）与 agent 工具面（`src/agent/tools.mjs`）——同一套调用（用户 22:25 口径）。
 * 错误映射（`DockerError.kind`）：`unreachable`（连不上/网络败）∥ `timeout`（超预算）∥ `api`（Docker 已到达且非 2xx——携状态码与引擎原文）；
 * 路由侧映射 = §3：不可达/超时 ⇒ 502 `upstream_error`；引擎 404/409 ⇒ 400（创建面）∥ 404（动作面，容器不存在）；余 ⇒ 502。
 */
export const DOCKER_MIN_API_VERSION = "1.44"
export const DEFAULT_DOCKER_PORT = 2375
export const READ_TIMEOUT_MS = 3000    // 读类（version ∥ info ∥ 列表——§3）
export const ACTION_TIMEOUT_MS = 15000 // 动作类（create/start/stop/delete——§3）

/** 上游错误（kind 三分类——路由面按 §3 映射；message 恒为逐句人话）。 */
export class DockerError extends Error {
  constructor(kind, message, { status = null, apiMessage = null } = {}) {
    super(message)
    this.name = "DockerError"
    this.kind = kind // unreachable ∥ timeout ∥ api
    this.status = status // api 类 = 引擎状态码（否则 null）
    this.apiMessage = apiMessage // 引擎原文（无 ⇒ null）
  }
}

/** 版本比较（`1.44` 形——逐段数值；缺失段按 0）。出 = -1 ∥ 0 ∥ 1。 */
export function compareApiVersions(a, b) {
  const left = String(a ?? "").split(".").map((part) => Number(part) || 0)
  const right = String(b ?? "").split(".").map((part) => Number(part) || 0)
  const len = Math.max(left.length, right.length)
  for (let i = 0; i < len; i++) {
    const l = left[i] ?? 0
    const r = right[i] ?? 0
    if (l !== r) return l < r ? -1 : 1
  }
  return 0
}

/** 地址归一（§3）：trim 非空 ∥ `https:` 拒（TLS 不做——提议①）∥ 缺协议补 `http://` ∥ 缺端口补 2375。 */
export function normalizeDockerAddress(raw) {
  const text = typeof raw === "string" ? raw.trim() : ""
  if (text === "") throw new Error("地址不可为空")
  if (/^https:/i.test(text)) throw new Error(`地址不收 https:（TLS 不做——内网明文 2375）：${text}`)
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `http://${text}`
  let url
  try {
    url = new URL(withScheme)
  } catch {
    throw new Error(`地址形非法：${text}`)
  }
  if (url.protocol !== "http:") throw new Error(`地址仅收 http://（缺协议自动补全）：${text}`)
  if (url.hostname === "") throw new Error(`地址缺主机名：${text}`)
  const port = url.port === "" ? DEFAULT_DOCKER_PORT : Number(url.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`地址端口非法：${text}`)
  return `http://${url.hostname}:${port}`
}

/** 协商版本（KD-SV-81）：`ver = max(1.44, MinAPIVersion)`，须 ≤ `ApiVersion`；否则抛（拒登记——零落库）。 */
export function negotiateApiVersion(readings = {}) {
  const apiVersion = typeof readings.ApiVersion === "string" ? readings.ApiVersion.trim() : ""
  const minApiVersion = typeof readings.MinAPIVersion === "string" ? readings.MinAPIVersion.trim() : ""
  if (apiVersion === "") throw new DockerError("api", "非 Docker API 响应（缺 ApiVersion——地址指向的可能不是 Docker 引擎）")
  const ver = minApiVersion !== "" && compareApiVersions(minApiVersion, DOCKER_MIN_API_VERSION) > 0 ? minApiVersion : DOCKER_MIN_API_VERSION
  if (compareApiVersions(ver, apiVersion) > 0) {
    throw new DockerError("api", `Docker API 版本不兼容：节点最低 ${minApiVersion || "?"}（协商 ${ver}）> 节点上限 ${apiVersion}`)
  }
  return ver
}

/** 自检读数归一（落 `sandbox_runners.runtime_json`——§3：Version/ApiVersion/MinAPIVersion/Os/Arch + 协商版本）。 */
function readingsOf(payload = {}, apiVer) {
  return {
    version: typeof payload.Version === "string" ? payload.Version : null,
    apiVersion: typeof payload.ApiVersion === "string" ? payload.ApiVersion : null,
    minApiVersion: typeof payload.MinAPIVersion === "string" ? payload.MinAPIVersion : null,
    apiVer,
    os: typeof payload.Os === "string" ? payload.Os : null,
    arch: typeof payload.Arch === "string" ? payload.Arch : null,
  }
}

/** 响应体文本（尽力而为——错误报文用；体已消费 ⇒ 空串）。 */
async function readText(response) {
  try {
    return typeof response.text === "function" ? await response.text() : ""
  } catch {
    return ""
  }
}

/** 引擎错误原文（Docker 错误报文形 `{ message }`；非 JSON ⇒ 原文截断）。 */
function apiMessageOf(text) {
  try {
    const parsed = JSON.parse(text)
    if (parsed !== null && typeof parsed === "object" && typeof parsed.message === "string") return parsed.message
  } catch {
    /* 非 JSON —— 原文兜底 */
  }
  return typeof text === "string" ? text.trim().slice(0, 300) : ""
}

/**
 * Docker API 客户端（`baseUrl` = 归一地址；`apiVer` = 协商版本——`null` 时仅 `version()` 可调（引导步））。
 * 注入口径（批内件/agent 假件）：`fetchImpl`（缺省 = 全局 fetch）∥ 两超时可覆盖。
 */
export function createDockerClient({ baseUrl, apiVer = null, fetchImpl = fetch, readTimeoutMs = READ_TIMEOUT_MS, actionTimeoutMs = ACTION_TIMEOUT_MS } = {}) {
  if (typeof baseUrl !== "string" || baseUrl === "") throw new Error("createDockerClient：缺 baseUrl")
  const prefix = () => {
    if (apiVer === null || apiVer === undefined || apiVer === "") throw new DockerError("api", "调用缺 API 版本前缀（须先经登记自检协商——KD-SV-81）")
    return `/v${apiVer}`
  }

  /** 单请求（超时 → kind 分类；非 2xx ⇒ `DockerError("api")`——304 属成功面，调用方自判）。 */
  async function request(method, path, { body = null, timeoutMs = READ_TIMEOUT_MS } = {}) {
    const url = `${baseUrl}${path}`
    const signal = AbortSignal.timeout(timeoutMs)
    let response
    try {
      response = await fetchImpl(url, {
        method,
        signal,
        ...(body === null ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
      })
    } catch (e) {
      const kind = signal.aborted ? "timeout" : "unreachable"
      const message = kind === "timeout" ? `节点响应超时（${timeoutMs}ms）：${url}` : `节点不可达：${url}（${e?.message ?? e}）`
      throw new DockerError(kind, message)
    }
    const text = await readText(response)
    let json = null
    try {
      json = text === "" ? null : JSON.parse(text)
    } catch {
      json = null
    }
    if (response.status >= 400) {
      const apiMessage = apiMessageOf(text)
      throw new DockerError("api", `Docker API ${response.status}：${apiMessage || "(无报文)"}`, { status: response.status, apiMessage })
    }
    return { status: response.status, json, text }
  }

  return {
    baseUrl,
    apiVer,
    /** 版本读数（引导步无前缀 ∥ 常规带前缀——KD-SV-81）。 */
    version: () => request("GET", `${apiVer ? `/v${apiVer}` : ""}/version`),
    /** 节点读数（运行面探活——§3）。 */
    info: () => request("GET", `${prefix()}/info`),
    /** 容器列表（读时读——KD-SV-79；`all=1` 含未运行）。 */
    containers: () => request("GET", `${prefix()}/containers/json?all=1`),
    /** 建容器（§3：`POST containers/create?name=<名>`——动作类超时）。 */
    createContainer: (name, body) => request("POST", `${prefix()}/containers/create?name=${encodeURIComponent(name)}`, { body, timeoutMs: actionTimeoutMs }),
    startContainer: (id) => request("POST", `${prefix()}/containers/${encodeURIComponent(id)}/start`, { timeoutMs: actionTimeoutMs }),
    stopContainer: (id) => request("POST", `${prefix()}/containers/${encodeURIComponent(id)}/stop`, { timeoutMs: actionTimeoutMs }),
    deleteContainer: (id, { force = true } = {}) =>
      request("DELETE", `${prefix()}/containers/${encodeURIComponent(id)}${force ? "?force=1" : ""}`, { timeoutMs: actionTimeoutMs }),
    /** 原动词面（agent `docker` 工具——images ∥ pull ∥ logs ⋯；§3 工具表）。 */
    raw: (method, path, { body = null, timeoutMs = ACTION_TIMEOUT_MS } = {}) => request(method, `${prefix()}${path}`, { body, timeoutMs }),
  }
}

/** 节点行 → 客户端（`runtime_json.apiVer` = 登记时协商版本——KD-SV-81）。 */
export function clientForRunner(row, { fetchImpl = fetch, readTimeoutMs = READ_TIMEOUT_MS, actionTimeoutMs = ACTION_TIMEOUT_MS } = {}) {
  let apiVer = null
  try {
    apiVer = JSON.parse(row?.runtime_json ?? "{}")?.apiVer ?? null
  } catch {
    apiVer = null
  }
  return createDockerClient({ baseUrl: row.address, apiVer, fetchImpl, readTimeoutMs, actionTimeoutMs })
}

/**
 * 连通自检（§3 引导步 → 协商 → 复读）：① 无前缀 `GET <base>/version` 取读数 ⇒ ② 协商（不兼容 ⇒ 抛）⇒ ③ 带前缀复读全量。
 * 出 = `{ baseUrl, apiVer, readings }`（readings 逐值落 `runtime_json`）；失败 ⇒ `DockerError`（调用方转 502 + 零落库 + 审计行）。
 */
export async function selfCheckDocker({ address, fetchImpl = fetch, readTimeoutMs = READ_TIMEOUT_MS } = {}) {
  const baseUrl = normalizeDockerAddress(address)
  const guide = createDockerClient({ baseUrl, apiVer: null, fetchImpl, readTimeoutMs })
  const first = await guide.version() // ① 引导步（无前缀）
  const apiVer = negotiateApiVersion(first.json ?? {}) // ② 协商
  const client = createDockerClient({ baseUrl, apiVer, fetchImpl, readTimeoutMs })
  const full = await client.version() // ③ 复读（带前缀）
  return { baseUrl, apiVer, readings: readingsOf(full.json ?? first.json ?? {}, apiVer) }
}
