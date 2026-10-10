/**
 * onboarding-routes.mjs — 托管接入端点（gateway/API.md §2.5 四行 ∥ sandbox/SANDBOX.md §3；runner-admin-console 批——台账 #1236）：
 * 起（`POST …/onboarding`——异步起跑，200 先于执行完）∥ 列表 ∥ 详情（步骤读数明细）∥ 撤销凭据。
 *
 * 语义（§2.5）：仅 400/404（零新码）；**响应面零秘密字段**（凭据永不回显）；进度 = 读时轮询（无后台常驻——KD-SV-86）；
 * 判权 `requireAdmin`；无可用模型 ⇒ 400（KD-SV-87）；同主机在途任务 ⇒ 400。独立成档缘由 = `routes.mjs` 越 500 软线（§13）。
 */
import { requireAdmin } from "../accounts/session.mjs"
import { listProviderEntries } from "../gateway/providers.mjs"
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { createOnboardingService } from "./onboarding.mjs"
import { providerModelRefs } from "../agent/run.mjs"

/** 入参轻校验（§2.5 起跑行形；形非法 ⇒ 抛——路由转 400；零落库零动作）。 */
export function parseOnboardingInput(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) throw new Error("body 须为 JSON 对象")
  const host = typeof body.host === "string" ? body.host.trim() : ""
  if (host === "") throw new Error("host 必填（主机地址——IP ∥ 主机名）")
  if (host.length > 200 || /[\s/]/.test(host) || host.includes("://")) throw new Error(`host 形非法：${host}（只给地址，不带协议/路径）`)
  const sshPort = body.sshPort === null || body.sshPort === undefined || body.sshPort === "" ? 22 : Number(body.sshPort)
  if (!Number.isInteger(sshPort) || sshPort < 1 || sshPort > 65535) throw new Error(`sshPort 非法：${String(body.sshPort)}（1–65535）`)
  const sshUser = typeof body.sshUser === "string" ? body.sshUser.trim() : ""
  if (sshUser === "") throw new Error("sshUser 必填")
  if (sshUser.length > 64) throw new Error("sshUser 超长（≤ 64）")
  const auth = body.auth
  if (auth === null || typeof auth !== "object" || Array.isArray(auth)) throw new Error("auth 必填（{ kind, secret }）")
  const authKind = auth.kind
  if (authKind !== "key" && authKind !== "password") throw new Error(`auth.kind 仅收 key ∥ password：${String(authKind)}`)
  const secret = typeof auth.secret === "string" ? auth.secret : ""
  if (secret.trim() === "") throw new Error("auth.secret 必填（密钥内容 ∥ 口令——只入密文，永不回显）")
  if (secret.length > 65536) throw new Error("auth.secret 超长（≤ 64 KiB）")
  const sudoSecret = typeof body.sudoSecret === "string" && body.sudoSecret !== "" ? body.sudoSecret : null
  const name = typeof body.name === "string" && body.name.trim() !== "" ? body.name.trim() : null
  if (name !== null && name.length > 40) throw new Error("name 超长（≤ 40）")
  const model = typeof body.model === "string" ? body.model.trim() : ""
  if (model === "") throw new Error("model 必填（提交时选择的模型——注册表对外标识）")
  const credentialMode = body.credentialMode === null || body.credentialMode === undefined || body.credentialMode === "" ? "burn" : body.credentialMode
  if (credentialMode !== "burn" && credentialMode !== "keep") throw new Error(`credentialMode 仅收 burn ∥ keep：${String(body.credentialMode)}`)
  return { host, sshPort, sshUser, authKind, secret, sudoSecret, name, model, credentialMode }
}

/** 模型可用性判（KD-SV-87）：无可用模型 ⇒ 拒（400 人话）；不在册 ⇒ 拒。出 = 无（不合 ⇒ 抛）。 */
export function assertModelAvailable(db, model) {
  const refs = new Set(providerModelRefs(listProviderEntries(db)))
  if (refs.size === 0) throw new Error("无可用模型（provider 注册表为空）——先在服务模型页配置 provider")
  if (!refs.has(model)) throw new Error(`模型不可用：${model}（不在注册表——先在服务模型页配置）`)
}

/**
 * 注册托管接入四端点（§2.5）：返回任务面服务（`routes.mjs` 起跑收尾面与重启恢复面共用）。
 * 注入口径（批内件/假件）：`deps`（`chat` ∥ `execImpl` ∥ `fetchImpl` ∥ `hasSshpass` ∥ `budget`——见 `onboarding.mjs`）。
 */
export function registerOnboardingRoutes(routes, { db, config = {}, log = null, now = Date.now, deps = {} } = {}) {
  if (!db) throw new Error("registerOnboardingRoutes：缺少 db")
  const service = createOnboardingService({ db, config, deps, now, log })

  routes.add("POST", "/api/admin/sandbox/onboarding", async (req, res) => {
    const { member: admin } = requireAdmin(db, req)
    const body = await readJsonBody(req)
    let input
    try {
      input = parseOnboardingInput(body)
      assertModelAvailable(db, input.model)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 400——零落库零动作
    }
    let started
    try {
      started = service.startRun({ ...input, createdBy: admin.id, actor: admin.name })
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 在途任务 ⇒ 400 人话
    }
    sendJson(res, 200, { run: started.run })
  })

  routes.add("GET", "/api/admin/sandbox/onboarding", (req, res) => {
    requireAdmin(db, req)
    sendJson(res, 200, service.listRuns())
  })

  routes.add("GET", "/api/admin/sandbox/onboarding/:id", (req, res, ctx) => {
    requireAdmin(db, req)
    const run = service.getRun(ctx.params.id)
    if (!run) throw new HttpError("not_found", `任务不存在：${ctx.params.id}`)
    sendJson(res, 200, { run })
  })

  routes.add("DELETE", "/api/admin/sandbox/onboarding/:id/credential", (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    let run
    try {
      run = service.revokeCredential(ctx.params.id, { actor: admin.name })
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 无凭据在留 ⇒ 400
    }
    if (!run) throw new HttpError("not_found", `任务不存在：${ctx.params.id}`)
    sendJson(res, 200, { run })
  })

  return service
}
