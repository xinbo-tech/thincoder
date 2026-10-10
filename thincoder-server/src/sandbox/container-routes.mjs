/**
 * container-routes.mjs — 容器面路由（sandbox/SANDBOX.md §3 ∥ gateway/API.md §2.5 九行；runner-admin-console 批——台账 #1251；sandbox-docker-admin 批续扩五件）。
 * 拆分缘由（SANDBOX §13 拆分预案①）：`routes.mjs` 越 500 软线 ⇒ 容器面独立成档——端点路径零变。
 *
 * 语义（§3）：容器不落库（Docker 引擎即真源——KD-SV-79）；列表 = 读时读（`containers/json?all=1`）；创建 = 三件（名/镜像/卷）；
 * 启动 ∥ 停止（**304 = 已启/已停 ⇒ 幂等成功**；`t` 不带 = 引擎缺省 10s）；删除 = `?force=1`（运行中强停强删；**卷不随删**）；
 * 本批五件 = 详情（挂载/端口/环境/命令逐值）∥ 日志（tail 有界 + 解复用 + 截断 256 KiB——KD-SV-93）∥ 重启 ∥ 强杀（**引擎 409 ⇒ 400 人话**——非幂等成功）∥ 用量（两读并发 + 一次采样口径——KD-SV-92）；读三件零审计。
 * 错误映射（§2.5 前括注）：不可达/超时 ⇒ 502 `upstream_error`；创建面引擎 404（无镜像）/409（名占用）⇒ 400（含引擎原文）；
 * 动作/读面引擎 404（容器不存在——被外部删了）⇒ 404 `not_found`；余 ⇒ 502。写动作各落审计行（`container_*`——键集单源 = `accounts/ACCOUNTS.md` §2.1）。
 */
import { recordAudit } from "../accounts/audit.mjs"
import { requireAdmin } from "../accounts/session.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { DockerError, LOG_TAIL_DEFAULT, LOG_TAIL_MAX, clientForRunner } from "./docker.mjs"
import { runnerRowOr404 } from "./registry.mjs"

/** 容器名形（Docker 容器名口径：字母/数字起头；字母/数字/_/./- 续）。 */
export function normalizeContainerName(raw) {
  const name = typeof raw === "string" ? raw.trim() : ""
  if (name === "") throw new Error("容器名不可为空")
  if (name.length > 128) throw new Error(`容器名超长（≤ 128 字符；实长 ${name.length}）`)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)) throw new Error(`容器名形非法（Docker 名形：字母/数字起头）：${name}`)
  return name
}

/** 镜像名（trim 非空——引擎自判存在性；预填值 = 设置 `image`）。 */
export function normalizeImageName(raw) {
  const image = typeof raw === "string" ? raw.trim() : ""
  if (image === "") throw new Error("镜像名不可为空")
  if (image.length > 200) throw new Error(`镜像名超长（≤ 200 字符；实长 ${image.length}）`)
  return image
}

/** 卷名（可空 = 不挂；挂 = `Binds ["<卷>:/workspace"]`——禁 `:`/`/`/空白，免拆坏 bind 串）。 */
export function normalizeVolumeName(raw) {
  if (raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === "")) return null
  const volume = typeof raw === "string" ? raw.trim() : ""
  if (volume === "" || /[:/\s]/.test(volume)) throw new Error(`卷名形非法（禁 : / 与空白）：${String(raw)}`)
  if (volume.length > 200) throw new Error(`卷名超长（≤ 200 字符；实长 ${volume.length}）`)
  return volume
}

/** 引擎失败 → HTTP 错误（§2.5；`containerAction` = 动作/读面（404 ⇒ not_found）∥ 创建面（404/409 ⇒ 400 含引擎原文）∥ `kill` = 强杀面（409 ⇒ 400 人话——非幂等成功））。 */
export function dockerFailure(e, { containerAction = false, kill = false } = {}) {
  if (e instanceof DockerError && e.kind === "api") {
    if (kill && e.status === 409) {
      return new HttpError("invalid_request_error", `容器未在运行——无需强杀（引擎 409：${e.apiMessage || "container is not running"}）`)
    }
    if (containerAction && e.status === 404) {
      return new HttpError("not_found", `容器不存在（引擎 404）：${e.apiMessage || "no such container"}`)
    }
    // 创建面：引擎 404（无镜像）/409（名占用）⇒ 400 携引擎原文；动作面余项 ⇒ 502（§2.5）
    if (!containerAction && (e.status === 404 || e.status === 409)) {
      return new HttpError("invalid_request_error", `引擎拒绝：${e.apiMessage || e.message}`)
    }
    return new HttpError("upstream_error", `引擎错误：${e.message}`)
  }
  return new HttpError("upstream_error", e.message)
}

/** 容器列表行（engine `containers/json` 形 ⇒ §3 读形；名去前导 `/`）。 */
export function containerView(item = {}) {
  return {
    id: item.Id ?? null,
    name: String(item.Names?.[0] ?? "").replace(/^\//, ""),
    image: item.Image ?? null,
    state: item.State ?? null,
    status: item.Status ?? null,
  }
}

/** 详情读数（engine inspect ⇒ §3 读形——挂载/端口/环境/命令逐值；读不到 ⇒ null/空，不假装）。 */
export function containerDetailView(json = {}) {
  const config = json.Config ?? {}
  const state = json.State ?? {}
  const ports = []
  for (const [key, bindings] of Object.entries(json.NetworkSettings?.Ports ?? {})) {
    const port = String(key).split("/")[0]
    const list = Array.isArray(bindings) ? bindings : []
    if (list.length === 0) ports.push({ port, hostIp: null, hostPort: null }) // 未映射 ⇒ null（如实）
    for (const binding of list) ports.push({ port, hostIp: binding?.HostIp ?? null, hostPort: binding?.HostPort ?? null })
  }
  return {
    id: json.Id ?? null,
    name: String(json.Name ?? "").replace(/^\//, ""),
    image: config.Image ?? null,
    state: state.Status ?? null, // 机器态（running/exited/created）
    status: state.Status ?? null, // 同源读数——inspect 只给一态（逐值，不造第二语义）
    created: json.Created ?? null,
    startedAt: state.StartedAt ?? null,
    finishedAt: state.FinishedAt ?? null,
    restartCount: state.RestartCount ?? null,
    command: { entrypoint: config.Entrypoint ?? null, cmd: config.Cmd ?? null },
    env: Array.isArray(config.Env) ? config.Env : [],
    mounts: (Array.isArray(json.Mounts) ? json.Mounts : []).map((mount) => ({
      type: mount?.Type ?? null,
      source: mount?.Source ?? null,
      destination: mount?.Destination ?? null,
      mode: mount?.Mode ?? null,
      rw: mount?.RW === true,
    })),
    ports,
  }
}

/** 数值读数（非数 ⇒ null——不假装）。 */
const numOrNull = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null)

/**
 * 用量读数（§3 KD-SV-92：`stats?one-shot=true` + `json?size=1` 两读）——`cpuPercent` = cpuΔ/systemΔ × 在线 CPU 数 × 100；
 * **一次采样基线不足 ⇒ `null`（如实）**：pre 样本缺（首采）∥ 差值非正 ∥ 核数不可得。
 */
export function usageView(statsJson = {}, inspectJson = {}, { now = Date.now } = {}) {
  const cpu = statsJson?.cpu_stats ?? {}
  const pre = statsJson?.precpu_stats ?? {}
  const cpuDelta = (numOrNull(cpu?.cpu_usage?.total_usage) ?? 0) - (numOrNull(pre?.cpu_usage?.total_usage) ?? 0)
  const systemDelta = (numOrNull(cpu?.system_cpu_usage) ?? 0) - (numOrNull(pre?.system_cpu_usage) ?? 0)
  const cpus = numOrNull(cpu?.online_cpus) ?? (Array.isArray(cpu?.cpu_usage?.percpu_usage) ? cpu.cpu_usage.percpu_usage.length : 0)
  const baseline = (numOrNull(pre?.cpu_usage?.total_usage) ?? 0) > 0 && (numOrNull(pre?.system_cpu_usage) ?? 0) > 0
  const cpuPercent = baseline && cpuDelta > 0 && systemDelta > 0 && cpus > 0 ? Math.round((cpuDelta / systemDelta) * cpus * 100 * 100) / 100 : null
  const memory = statsJson?.memory_stats ?? {}
  return {
    cpuPercent,
    memUsed: numOrNull(memory.usage),
    memLimit: numOrNull(memory.limit),
    diskRw: numOrNull(inspectJson?.SizeRw),
    diskRoot: numOrNull(inspectJson?.SizeRootFs),
    sampledAt: now(),
  }
}

/** 日志 tail 解析（§3：缺省 200 ∥ 范围 1–2000；越界/非数 ⇒ 400 人话）。 */
export function parseLogTail(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === "") return LOG_TAIL_DEFAULT
  const text = String(raw).trim()
  if (!/^\d+$/.test(text)) throw new HttpError("invalid_request_error", `tail 须为正整数（1–${LOG_TAIL_MAX}）：${raw}`)
  const value = Number(text)
  if (value < 1 || value > LOG_TAIL_MAX) throw new HttpError("invalid_request_error", `tail 越界（1–${LOG_TAIL_MAX}；给定 ${value}）`)
  return value
}

/**
 * 注册容器面十路由（§3）：列表 ∥ 建 ∥ 启/停 ∥ 删 ∥ 详情/日志/重启/强杀/用量；`fetchImpl` = Docker 传输注入口（批内件假件；缺省 = 全局 fetch——生产行为不变）。
 */
export function registerContainerRoutes(routes, { db, fetchImpl = fetch, now = Date.now, readTimeoutMs, actionTimeoutMs } = {}) {
  if (!db) throw new Error("registerContainerRoutes：缺少 db")

  const clientOf = (runner) => clientForRunner(runner, { fetchImpl, ...(readTimeoutMs ? { readTimeoutMs } : {}), ...(actionTimeoutMs ? { actionTimeoutMs } : {}) })

  // 列表（读时读——KD-SV-79）
  routes.add("GET", "/api/admin/sandbox/runners/:id/containers", async (req, res, ctx) => {
    requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    let payload
    try {
      payload = await clientOf(runner).containers()
    } catch (e) {
      throw dockerFailure(e)
    }
    const containers = (Array.isArray(payload.json) ? payload.json : []).map(containerView)
    sendJson(res, 200, { containers })
  })

  // 创建（三件：名/镜像/卷；创建 ≠ 启动——两动作分列）
  routes.add("POST", "/api/admin/sandbox/runners/:id/containers", async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    const body = await readJsonBody(req)
    let name, image, volume
    try {
      name = normalizeContainerName(body?.name)
      image = normalizeImageName(body?.image)
      volume = normalizeVolumeName(body?.volume)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message)
    }
    const createBody = { Image: image, ...(volume ? { HostConfig: { Binds: [`${volume}:/workspace`] } } : {}) }
    let response
    try {
      response = await clientOf(runner).createContainer(name, createBody)
    } catch (e) {
      throw dockerFailure(e)
    }
    const created = response.json ?? {}
    recordAudit(db, {
      type: "sandbox_event",
      actor: admin.name,
      actorId: admin.id,
      target: runner.name,
      detail: { kind: "container_create", runnerId: runner.id, containerId: created.Id ?? null, name },
      ts: now(),
    })
    sendJson(res, 200, { container: { id: created.Id ?? null, name, image, state: "created" } })
  })

  // 启动 ∥ 停止（204 ⇒ 200；304 = 已启/已停 ⇒ 幂等成功；404 ⇒ not_found；余 ⇒ 502）
  const actionRoute = (action) => async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    const containerId = String(ctx.params.containerId)
    const client = clientOf(runner)
    let response
    try {
      response = action === "start" ? await client.startContainer(containerId) : await client.stopContainer(containerId)
    } catch (e) {
      throw dockerFailure(e, { containerAction: true })
    }
    recordAudit(db, {
      type: "sandbox_event",
      actor: admin.name,
      actorId: admin.id,
      target: runner.name,
      detail: { kind: `container_${action}`, runnerId: runner.id, containerId, engineStatus: response.status },
      ts: now(),
    })
    sendJson(res, 200, { ok: true, id: containerId })
  }
  routes.add("POST", "/api/admin/sandbox/runners/:id/containers/:containerId/start", actionRoute("start"))
  routes.add("POST", "/api/admin/sandbox/runners/:id/containers/:containerId/stop", actionRoute("stop"))

  // 删除（?force=1——运行中强停强删；卷不随删）
  routes.add("DELETE", "/api/admin/sandbox/runners/:id/containers/:containerId", async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    const containerId = String(ctx.params.containerId)
    try {
      await clientOf(runner).deleteContainer(containerId, { force: true })
    } catch (e) {
      throw dockerFailure(e, { containerAction: true })
    }
    recordAudit(db, {
      type: "sandbox_event",
      actor: admin.name,
      actorId: admin.id,
      target: runner.name,
      detail: { kind: "container_delete", runnerId: runner.id, containerId },
      ts: now(),
    })
    sendJson(res, 200, { ok: true, id: containerId })
  })

  // ── 本批五件（容器面补齐——sandbox-docker-admin 批；§3 ∥ KD-SV-92/93）─────────────────────

  // 详情（读时读 inspect——挂载/端口/环境/命令逐值；零审计）
  routes.add("GET", "/api/admin/sandbox/runners/:id/containers/:containerId", async (req, res, ctx) => {
    requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    const containerId = String(ctx.params.containerId)
    let payload
    try {
      payload = await clientOf(runner).containerDetail(containerId)
    } catch (e) {
      throw dockerFailure(e, { containerAction: true })
    }
    sendJson(res, 200, { container: containerDetailView(payload.json ?? {}) })
  })

  // 日志（tail 有界 + 非 TTY 解复用 + 截断 256 KiB——KD-SV-93；零审计）
  routes.add("GET", "/api/admin/sandbox/runners/:id/containers/:containerId/logs", async (req, res, ctx) => {
    requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    const containerId = String(ctx.params.containerId)
    const tail = parseLogTail(new URL(req.url, "http://localhost").searchParams.get("tail"))
    let payload
    try {
      payload = await clientOf(runner).containerLogs(containerId, tail)
    } catch (e) {
      throw dockerFailure(e, { containerAction: true })
    }
    sendJson(res, 200, { logs: payload.logs, truncated: payload.truncated, tail })
  })

  // 写动作两件（重启 ∥ 强杀——204 ⇒ 200；审计各一行，键集 = ACCOUNTS §2.1）
  const wroteAction = (kind, run) => async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    const containerId = String(ctx.params.containerId)
    try {
      await run(clientOf(runner), containerId)
    } catch (e) {
      throw dockerFailure(e, { containerAction: true, kill: kind === "container_kill" })
    }
    recordAudit(db, {
      type: "sandbox_event",
      actor: admin.name,
      actorId: admin.id,
      target: runner.name,
      detail: { kind, runnerId: runner.id, containerId },
      ts: now(),
    })
    sendJson(res, 200, { ok: true, id: containerId })
  }
  routes.add("POST", "/api/admin/sandbox/runners/:id/containers/:containerId/restart", wroteAction("container_restart", (client, id) => client.containerRestart(id)))
  routes.add("POST", "/api/admin/sandbox/runners/:id/containers/:containerId/kill", wroteAction("container_kill", (client, id) => client.containerKill(id)))

  // 用量（读时读两并发：stats 一次采样 + inspect size=1 磁盘；零审计）
  routes.add("GET", "/api/admin/sandbox/runners/:id/containers/:containerId/stats", async (req, res, ctx) => {
    requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    const containerId = String(ctx.params.containerId)
    const client = clientOf(runner)
    let stats, inspect
    try {
      ;[stats, inspect] = await Promise.all([client.containerStats(containerId), client.containerDetail(containerId, { size: true })])
    } catch (e) {
      throw dockerFailure(e, { containerAction: true })
    }
    sendJson(res, 200, { usage: usageView(stats.json ?? {}, inspect.json ?? {}, { now }) })
  })
}
