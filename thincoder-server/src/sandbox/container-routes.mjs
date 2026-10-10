/**
 * container-routes.mjs — 容器面路由（sandbox/SANDBOX.md §3 ∥ gateway/API.md §2.5 四行；runner-admin-console 批——台账 #1251）。
 * 拆分缘由（SANDBOX §13 拆分预案①）：`routes.mjs` 越 500 软线 ⇒ 容器面（列表 ∥ 创建 ∥ 启/停 ∥ 删）独立成档——端点路径零变。
 *
 * 语义（§3）：容器不落库（Docker 引擎即真源——KD-SV-79）；列表 = 读时读（`containers/json?all=1`）；创建 = 三件（名/镜像/卷）；
 * 启动 ∥ 停止（**304 = 已启/已停 ⇒ 幂等成功**；`t` 不带 = 引擎缺省 10s）；删除 = `?force=1`（运行中强停强删；**卷不随删**）。
 * 错误映射（§2.5 前括注）：不可达/超时 ⇒ 502 `upstream_error`；创建面引擎 404（无镜像）/409（名占用）⇒ 400（含引擎原文）；
 * 动作面引擎 404（容器不存在——被外部删了）⇒ 404 `not_found`；余 ⇒ 502。动作各落审计行（`container_*`）。
 */
import { recordAudit } from "../accounts/audit.mjs"
import { requireAdmin } from "../accounts/session.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { DockerError, clientForRunner } from "./docker.mjs"
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

/** 引擎失败 → HTTP 错误（§2.5；`containerAction` = 动作面（404 ⇒ not_found）∥ 创建面（404/409 ⇒ 400 含引擎原文））。 */
export function dockerFailure(e, { containerAction = false } = {}) {
  if (e instanceof DockerError && e.kind === "api") {
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

/**
 * 注册容器四路由（§3）：`fetchImpl` = Docker 传输注入口（批内件假件；缺省 = 全局 fetch——生产行为不变）。
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
}
