/**
 * image-routes.mjs — 镜像族路由（sandbox/SANDBOX.md §3 镜像族三件 ∥ gateway/API.md §2.5 三行；sandbox-docker-admin 批——台账 #1265）。
 * 分族成档缘由（SANDBOX §13）：容器面/镜像族按族拆（卷/网络族可循此例，不预建）。
 *
 * 语义（§3）：引擎即真源（KD-SV-79）——列表 = 读时读（`images/json`；`RepoTags` 缺/null ⇒ `[]`——UI 呈「无标签」）；
 * 拉取 = 同步 + 10 分钟专用超时 + 失败两形皆收（引擎非 2xx ∥ 200 流内 `error`/`errorDetail` ⇒ 400 携原文——KD-SV-94）；
 * 删除 = `ref` 走请求体（字符集含 `/`/`:`——路径段不兼容）+ `force` 缺省 false（KD-SV-95）。
 * 错误映射（§2.5 前括注）：不可达/超时 ⇒ 502 `upstream_error`；列表引擎失败 ⇒ 502；拉取引擎失败（两形）⇒ 400；
 * 删除引擎 404（无此镜像）⇒ 404 `not_found`、409（被容器引用/多标签）⇒ 400 人话 + 处置句；余 ⇒ 502。
 * 审计（键集单源 = `accounts/ACCOUNTS.md` §2.1）：拉取/删除各一行（`image_pull` ∥ `image_delete`）；列表零审计（读动作）。
 */
import { recordAudit } from "../accounts/audit.mjs"
import { requireAdmin } from "../accounts/session.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { DockerError, clientForRunner, normalizeImageRef, parseImageRef } from "./docker.mjs"
import { runnerRowOr404 } from "./registry.mjs"
import { dockerFailure } from "./container-routes.mjs"

/** 镜像列表行（engine `images/json` 形 ⇒ §3 读形；`RepoTags` 缺/null ⇒ `[]`）。 */
export function imageView(item = {}) {
  return {
    id: item.Id ?? null,
    tags: Array.isArray(item.RepoTags) ? item.RepoTags : [],
    size: typeof item.Size === "number" ? item.Size : null,
    created: typeof item.Created === "number" ? item.Created : null,
  }
}

/** 拉取失败映射（§3 KD-SV-94）：引擎非 2xx ∥ 200 流内 error ⇒ 400 携引擎原文；不可达/超时 ⇒ 502。 */
export function pullFailure(e) {
  if (e instanceof DockerError && e.kind === "api") {
    return new HttpError("invalid_request_error", `引擎拒绝：${e.apiMessage || e.message}`)
  }
  return dockerFailure(e)
}

/** 删除失败映射（§3）：404 ⇒ 404；409（被引用/多标签）⇒ 400 人话 + 处置句；余 ⇒ 502。 */
export function imageDeleteFailure(e) {
  if (e instanceof DockerError && e.kind === "api") {
    if (e.status === 409) {
      return new HttpError(
        "invalid_request_error",
        `镜像被引用或多标签（引擎 409：${e.apiMessage || e.message}）——先删引用它的容器，或勾「强制删除」再试`,
      )
    }
    if (e.status === 404) return new HttpError("not_found", `镜像不存在（引擎 404）：${e.apiMessage || "no such image"}`)
    return new HttpError("upstream_error", `引擎错误：${e.message}`)
  }
  return dockerFailure(e)
}

/** 注册镜像族三路由（§3）：`fetchImpl` = Docker 传输注入口（批内件假件；缺省 = 全局 fetch——生产行为不变）。 */
export function registerImageRoutes(routes, { db, fetchImpl = fetch, now = Date.now, readTimeoutMs, actionTimeoutMs, pullTimeoutMs } = {}) {
  if (!db) throw new Error("registerImageRoutes：缺少 db")

  const clientOf = (runner) =>
    clientForRunner(runner, {
      fetchImpl,
      ...(readTimeoutMs ? { readTimeoutMs } : {}),
      ...(actionTimeoutMs ? { actionTimeoutMs } : {}),
      ...(pullTimeoutMs ? { pullTimeoutMs } : {}),
    })

  // 列表（读时读——KD-SV-79；零审计）
  routes.add("GET", "/api/admin/sandbox/runners/:id/images", async (req, res, ctx) => {
    requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    let payload
    try {
      payload = await clientOf(runner).images()
    } catch (e) {
      throw dockerFailure(e)
    }
    sendJson(res, 200, { images: (Array.isArray(payload.json) ? payload.json : []).map(imageView) })
  })

  // 拉取（同步 + 专用超时；失败两形 ⇒ 400 携引擎原文；审计 image_pull）
  routes.add("POST", "/api/admin/sandbox/runners/:id/images/pull", async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    const body = await readJsonBody(req)
    let parsed
    try {
      parsed = parseImageRef(body?.image)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message)
    }
    try {
      await clientOf(runner).pullImage(parsed.image, parsed.tag)
    } catch (e) {
      throw pullFailure(e)
    }
    recordAudit(db, {
      type: "sandbox_event",
      actor: admin.name,
      actorId: admin.id,
      target: runner.name,
      detail: { kind: "image_pull", runnerId: runner.id, image: `${parsed.image}:${parsed.tag}` },
      ts: now(),
    })
    sendJson(res, 200, { ok: true, image: parsed.image, tag: parsed.tag })
  })

  // 删除（ref 走体——KD-SV-95；force 缺省 false；审计 image_delete——detail 携 ref/force）
  routes.add("DELETE", "/api/admin/sandbox/runners/:id/images", async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    const body = await readJsonBody(req)
    let ref
    try {
      ref = normalizeImageRef(body?.ref)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message)
    }
    const force = body?.force === true
    try {
      await clientOf(runner).removeImage(ref, { force })
    } catch (e) {
      throw imageDeleteFailure(e)
    }
    recordAudit(db, {
      type: "sandbox_event",
      actor: admin.name,
      actorId: admin.id,
      target: runner.name,
      detail: { kind: "image_delete", runnerId: runner.id, ref, force },
      ts: now(),
    })
    sendJson(res, 200, { ok: true, ref })
  })
}
