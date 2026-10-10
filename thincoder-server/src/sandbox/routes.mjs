/**
 * routes.mjs — 沙盒控制台面与成员面（sandbox/SANDBOX.md §3/§8/§9；端点表 = gateway/API.md §2.5/§2.7；runner-admin-console 批——
 * 节点增/删 + 运行面读数 + 托管接入转注册；容器四路由与托管接入四端点已拆 `container-routes.mjs` ∥ `onboarding-routes.mjs`——§13 预案①）。
 * `/api/admin/sandbox/*`（判权 `requireAdmin`）∥ `/api/me/sandbox/*`（成员面——会话 + 恒本人过滤）。
 *
 * 节点面（§3）：添加 = 连通自检（引导步 → 协商 → 复读——`docker.mjs`）⇒ 落行 + 审计；删除 = 二选一（保留 ∥ 连删）；
 * 运行面读数 = 读时探活（`GET <base>/v<ver>/info`——3s ∥ 并发；无心跳/无后台定时器——KD-SV-80）；节点面恒可用。
 * 可用性门（KD-SV-71）：`overview` 常回应（`status: unavailable` + 原因）；需要节点的写动作（工作区创建 ∥ 动作）⇒ 503（不降级）；
 * 规则 ∥ 设置 ∥ 待批裁定 = 不设门；成员面读 = 契约明文（API §2.7）——不可用 ⇒ 503。
 */
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { findMemberById } from "../accounts/members.mjs"
import { getKeyById } from "../accounts/keys.mjs"
import { recordAudit } from "../accounts/audit.mjs"
import { requireAdmin, requireSession } from "../accounts/session.mjs"
import {
  WORKSPACE_NAME_MAX, boxPayload, boxStateOf, enqueueTask, getSettings, insertRunner, lastTaskView, mergeLimits, normalizeRunnerName,
  patchSettings, placeWorkspace, requireSandboxAvailable, resolveLimits, runnerRowOr404, runnerRows, runnerView, sandboxAvailability,
  sandboxPublicBase, sweepStuckTasks, tryPlacePending,
} from "./registry.mjs"
import { clientForRunner, normalizeDockerAddress, selfCheckDocker } from "./docker.mjs"
import { registerContainerRoutes } from "./container-routes.mjs"
import { registerOnboardingRoutes } from "./onboarding-routes.mjs"
import { bumpRulesRev, createRule, deleteRule, getRulesRev, listPending, listRules, openPendingOf, resolvePending, updateRule } from "./rules.mjs"
import { issueWorkspaceKey, rotateWorkspaceKey, revokeWorkspaceKey } from "./credentials.mjs"

export const WORKSPACE_ACTIONS = Object.freeze(["start", "stop", "destroy", "rotate-key", "restore"])

/** 快照读数（`sandbox_checkpoints`——登记行由 checkpoint 上送面写入；本档 = 读取面）。 */
function checkpointCount(db, workspaceId) {
  return Number(db.prepare("SELECT COUNT(*) AS n FROM sandbox_checkpoints WHERE workspace_id = ?").get(Number(workspaceId)).n)
}

function latestCheckpoint(db, workspaceId) {
  return db.prepare("SELECT * FROM sandbox_checkpoints WHERE workspace_id = ? ORDER BY id DESC LIMIT 1").get(Number(workspaceId)) ?? null
}

/** 工作区名校验（trim）；唯一性在写前由 SQLite UNIQUE 兜（400 报文）。 */
function normalizeWorkspaceName(raw) {
  const name = typeof raw === "string" ? raw.trim() : ""
  if (name === "") throw new Error("工作区名不可为空")
  if (name.length > WORKSPACE_NAME_MAX) throw new Error(`工作区名超长（≤ ${WORKSPACE_NAME_MAX} 字符；实长 ${name.length}）`)
  return name
}

/** 标签对象校验（键/值字符串；≤ 20 条）。 */
function normalizeLabels(raw, { field = "requiredLabels" } = {}) {
  if (raw === null || raw === undefined) return {}
  if (typeof raw !== "object" || Array.isArray(raw)) throw new Error(`${field} 须为对象（{ <键>: <值> }）`)
  const entries = Object.entries(raw)
  if (entries.length > 20) throw new Error(`${field} 超上限（≤ 20 条）`)
  const out = {}
  for (const [key, value] of entries) {
    const k = String(key).trim()
    if (k === "") throw new Error(`${field} 含空键`)
    out[k] = String(value)
  }
  return out
}

function workspaceRowOr404(db, id) {
  const row = db.prepare("SELECT * FROM sandbox_workspaces WHERE id = ?").get(Number(id))
  if (!row) throw new HttpError("not_found", `工作区不存在：${id}`)
  return row
}

/** 工作区读数（控制台列表行——§2.5；密钥面零下发：只给提示形）。 */
function workspaceView(db, workspace, { now = Date.now() } = {}) {
  const runner = workspace.runner_id === null ? null : db.prepare("SELECT * FROM sandbox_runners WHERE id = ?").get(workspace.runner_id)
  const owner = findMemberById(db, workspace.owner_member_id)
  const box = boxStateOf(workspace, runner)
  const key = getKeyById(db, workspace.key_id)
  let requiredLabels = {}
  try {
    requiredLabels = JSON.parse(workspace.required_labels_json) ?? {}
  } catch {
    requiredLabels = {}
  }
  let limits = {}
  try {
    limits = JSON.parse(workspace.limits_json) ?? {}
  } catch {
    limits = {}
  }
  return {
    id: workspace.id,
    name: workspace.name,
    ownerMemberId: workspace.owner_member_id,
    ownerName: owner?.name ?? null,
    runnerId: workspace.runner_id,
    runnerName: runner?.name ?? null,
    runnerStatus: runner?.status ?? null,
    boxState: box.boxState,
    stopReason: box.stopReason,
    dirty: box.dirty,
    checkpointCount: checkpointCount(db, workspace.id),
    pending: openPendingOf(db, workspace.id, { now }),
    keyHint: key?.key_hint ?? null,
    keyStatus: key?.status ?? null,
    requiredLabels,
    limits,
    limitsResolved: resolveLimits(db, workspace),
    lastTask: lastTaskView(db, workspace.id),
    createdAt: workspace.created_at,
  }
}

function enqueueForWorkspace(db, workspace, kind, payload = {}, { now = Date.now() } = {}) {
  const id = enqueueTask(db, { runnerId: workspace.runner_id, kind, workspaceId: workspace.id, payload, now })
  return id
}

/**
 * 注册沙盒控制台面 + 成员面 + 容器面 + 托管接入面。
 * 注入口径（批内件替身）：`now`（时钟——生产行为不变）∥ `fetchImpl`（Docker 传输——节点/容器面 ∥ 探活）∥ `deps`（托管接入面替身——见 `onboarding.mjs`）。
 */
export function registerSandboxRoutes(routes, { db, config = {}, log = null, now = Date.now, fetchImpl = fetch, deps = {} } = {}) {
  if (!db) throw new Error("registerSandboxRoutes：缺少 db（openDatabase 产物）")
  const publicBase = sandboxPublicBase(config)

  // ── ① 运行面（读时探活——KD-SV-80：每节点现打 `/info`，3s ∥ 并发）────────────────
  routes.add("GET", "/api/admin/sandbox/overview", async (req, res) => {
    requireAdmin(db, req)
    const rows = runnerRows(db)
    const probed = await Promise.all(
      rows.map(async (row) => {
        const base = runnerView(row)
        try {
          const info = await clientForRunner(row, { fetchImpl }).info()
          return {
            ...base,
            online: true,
            version: info.json?.ServerVersion ?? null,
            containers: { total: Number(info.json?.Containers ?? 0), running: Number(info.json?.ContainersRunning ?? 0) },
          }
        } catch (e) {
          log?.warn("sandbox_runner_probe_failed", { runnerId: row.id, message: e?.message ?? String(e) })
          return { ...base, online: false, version: null, containers: null } // 离线读数不外推（§3）
        }
      }),
    )
    const available = probed.some((item) => item.online)
    const reason = available ? null : rows.length === 0 ? "无节点注册" : "节点全部不可达"
    sendJson(res, 200, { status: available ? "available" : "unavailable", ...(reason ? { reason } : {}), runners: probed })
  })

  // 添加节点（§3——连通自检：引导步 → 协商 → 复读；失败 ⇒ 502 + 零落库 + 审计行）
  routes.add("POST", "/api/admin/sandbox/runners", async (req, res) => {
    const { member: admin } = requireAdmin(db, req)
    const body = await readJsonBody(req)
    let name, address
    try {
      name = normalizeRunnerName(body?.name)
      address = normalizeDockerAddress(body?.address)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 重名/形非法 ⇒ 400（先库查后自检——网面零触）
    }
    if (db.prepare("SELECT id FROM sandbox_runners WHERE name = ?").get(name)) {
      throw new HttpError("invalid_request_error", `节点名已存在：${name}`)
    }
    let check
    try {
      check = await selfCheckDocker({ address, fetchImpl })
    } catch (e) {
      recordAudit(db, {
        type: "sandbox_event",
        actor: admin.name,
        actorId: admin.id,
        target: name,
        detail: { kind: "runner_selfcheck_failed", address, reason: e?.message ?? String(e) },
        ts: now(),
      })
      throw new HttpError("upstream_error", `连通自检失败：${e?.message ?? e}`) // 502 + 逐句人话 + 零落库
    }
    let row
    try {
      row = insertRunner(db, { name, address: check.baseUrl, runtime: check.readings, now: now() })
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message)
    }
    recordAudit(db, { type: "sandbox_event", actor: admin.name, actorId: admin.id, target: name, detail: { kind: "runner_add", runnerId: row.id, address: row.address }, ts: now() })
    sendJson(res, 200, { runner: { id: row.id, name: row.name, address: row.address, status: row.status, selfCheck: check.readings, createdAt: row.created_at } })
  })

  // 删除节点（§3——二选一「保留 ∥ 连删」；连删任一失败 ⇒ 502 + 登记行保留；不可达 ⇒ 仅 keep 可过）
  routes.add("DELETE", "/api/admin/sandbox/runners/:id", async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const runner = runnerRowOr404(db, ctx.params.id)
    const body = await readJsonBody(req).catch(() => ({}))
    const bound = db.prepare("SELECT id, name FROM sandbox_workspaces WHERE runner_id = ? ORDER BY id").all(runner.id)
    if (bound.length > 0 && body?.confirm !== true) {
      throw new HttpError(
        "invalid_request_error",
        `节点上仍有 ${bound.length} 个工作区（${bound.map((item) => item.name).join(" ∥ ")}）——先重建到新机，或确认丢弃 ⇒ confirm: true`,
      )
    }
    const disposition = body?.containers
    if (disposition !== undefined && disposition !== "keep" && disposition !== "remove") {
      throw new HttpError("invalid_request_error", `containers 仅收 keep ∥ remove：${String(disposition)}`)
    }
    let containers = []
    let reachable = true
    try {
      const listed = await clientForRunner(runner, { fetchImpl }).containers()
      containers = Array.isArray(listed.json) ? listed.json : []
    } catch {
      reachable = false
    }
    if (!reachable && disposition !== "keep") {
      throw new HttpError("upstream_error", `节点不可达——仅「保留」处置可过（连删需节点可达）：${runner.name}`)
    }
    if (reachable && containers.length > 0 && disposition === undefined) {
      throw new HttpError("invalid_request_error", `节点上承载 ${containers.length} 个容器——请选处置：containers: "keep"（容器原样留机）∥ "remove"（逐个强删）`)
    }
    let kept = 0
    let removed = 0
    if (disposition === "remove") {
      const failed = []
      for (const item of containers) {
        const id = item.Id
        const name = String(item.Names?.[0] ?? id).replace(/^\//, "")
        try {
          await clientForRunner(runner, { fetchImpl }).deleteContainer(id, { force: true })
          removed += 1
        } catch (e) {
          failed.push(`${name}（${e?.message ?? e}）`)
        }
      }
      if (failed.length > 0) {
        throw new HttpError(
          "upstream_error",
          `连删未净：已删 ${removed}/${containers.length}——失败清单：${failed.join(" ∥ ")}（登记行保留；修好后重试）`,
        )
      }
      kept = 0
    } else {
      kept = containers.length
    }
    db.prepare("UPDATE sandbox_tasks SET status = 'failed', finished_at = ?, result_json = ? WHERE runner_id = ? AND status IN ('queued','claimed')").run(
      now(),
      JSON.stringify({ reason: "节点已退役——指令作废" }),
      runner.id,
    )
    db.prepare("UPDATE sandbox_workspaces SET runner_id = NULL WHERE runner_id = ?").run(runner.id)
    db.prepare("DELETE FROM sandbox_runners WHERE id = ?").run(runner.id)
    recordAudit(db, {
      type: "sandbox_event",
      actor: admin.name,
      actorId: admin.id,
      target: runner.name,
      detail: { kind: "runner_delete", kept, removed },
      ts: now(),
    })
    tryPlacePending(db, { now: now(), publicBase }) // 弃置工作区续跑（有 active 节点即重放置）
    sendJson(res, 200, { ok: true, id: runner.id, kept, removed })
  })

  // ── ② 工作区 ──────────────────────────────────────────────────────────────
  routes.add("GET", "/api/admin/sandbox/workspaces", (req, res) => {
    requireAdmin(db, req)
    sweepStuckTasks(db, { now: now() }) // 悬挂回收的展示面续跑（B41）
    const workspaces = db.prepare("SELECT * FROM sandbox_workspaces ORDER BY id").all().map((row) => workspaceView(db, row, { now: now() }))
    sendJson(res, 200, { workspaces })
  })

  routes.add("POST", "/api/admin/sandbox/workspaces", async (req, res) => {
    const { member: admin } = requireAdmin(db, req)
    requireSandboxAvailable(db) // 写动作（B35）——无节点不降级
    const body = await readJsonBody(req)
    let name, owner, requiredLabels, initialLimits
    try {
      name = normalizeWorkspaceName(body?.name)
      owner = findMemberById(db, Number(body?.ownerMemberId))
      if (!owner) throw new Error(`负责人不存在：${String(body?.ownerMemberId)}`)
      requiredLabels = normalizeLabels(body?.requiredLabels)
      initialLimits = body?.limits === null || body?.limits === undefined ? {} : body.limits
      for (const [key, value] of Object.entries(initialLimits)) {
        if (value === null) throw new Error(`初始覆写值不可为 null（删键仅 PATCH 面）：${key}`)
      }
      initialLimits = mergeLimits("{}", initialLimits)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message)
    }
    if (db.prepare("SELECT id FROM sandbox_workspaces WHERE name = ?").get(name)) {
      throw new HttpError("invalid_request_error", `工作区名已存在：${name}`)
    }
    const key = issueWorkspaceKey(db, { ownerMemberId: owner.id, workspaceName: name, now: now() }) // 先签发（行内 key_id NOT NULL 引用）
    const info = db
      .prepare(
        `INSERT INTO sandbox_workspaces (name, owner_member_id, key_id, key_plain, runner_id, required_labels_json, limits_json, created_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`,
      )
      .run(name, owner.id, key.id, key.plain, JSON.stringify(requiredLabels), JSON.stringify(initialLimits), new Date(now()).toISOString())
    let workspace = db.prepare("SELECT * FROM sandbox_workspaces WHERE id = ?").get(Number(info.lastInsertRowid))
    recordAudit(db, { type: "sandbox_event", actor: admin.name, actorId: admin.id, target: workspace.name, detail: { kind: "workspace_create", workspaceId: workspace.id, owner: owner.name, requiredLabels }, ts: now() })
    // 放置（§5）：命中 ⇒ 绑定 + create/start 入队；无满足者 ⇒ 排队等待（控制台明示；续跑触发点 = 节点删除面 ∥ 工作区动作面——旧心跳/注册面已退场，重做批补面）
    const runner = placeWorkspace(db)
    if (runner) {
      db.prepare("UPDATE sandbox_workspaces SET runner_id = ? WHERE id = ?").run(runner.id, workspace.id)
      workspace = db.prepare("SELECT * FROM sandbox_workspaces WHERE id = ?").get(workspace.id)
      enqueueForWorkspace(db, workspace, "sandbox.create", boxPayload(db, workspace, runner, { publicBase }), { now: now() })
      enqueueForWorkspace(db, workspace, "sandbox.start", boxPayload(db, workspace, runner, { publicBase }), { now: now() })
    }
    sendJson(res, 200, { workspace: workspaceView(db, workspace, { now: now() }) })
  })

  routes.add("PATCH", "/api/admin/sandbox/workspaces/:id", async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const workspace = workspaceRowOr404(db, ctx.params.id)
    const body = await readJsonBody(req)
    const patch = body?.limits
    if (patch === null || patch === undefined || typeof patch !== "object" || Array.isArray(patch)) {
      throw new HttpError("invalid_request_error", "缺 limits（{ <键>: 值 }；值 null = 删键回落全局默认）")
    }
    let merged
    try {
      merged = mergeLimits(workspace.limits_json, patch)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 校验不过 ⇒ 400 库零变
    }
    db.prepare("UPDATE sandbox_workspaces SET limits_json = ? WHERE id = ?").run(JSON.stringify(merged), workspace.id)
    recordAudit(db, { type: "sandbox_event", actor: admin.name, actorId: admin.id, target: workspace.name, detail: { kind: "workspace_limits", workspaceId: workspace.id, limits: merged }, ts: now() })
    const updated = db.prepare("SELECT * FROM sandbox_workspaces WHERE id = ?").get(workspace.id)
    sendJson(res, 200, { workspace: workspaceView(db, updated, { now: now() }) }) // 生效 = 下次建盒/重建（运行中盒零触——不回队指令）
  })

  routes.add("POST", "/api/admin/sandbox/workspaces/:id/:action", async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const action = String(ctx.params.action)
    if (!WORKSPACE_ACTIONS.includes(action)) throw new HttpError("invalid_request_error", `未知动作：${action}（${WORKSPACE_ACTIONS.join(" ∥ ")}）`)
    const workspace = workspaceRowOr404(db, ctx.params.id)
    requireSandboxAvailable(db, { detail: `工作区动作 ${action} 需要可用节点` })
    if (workspace.runner_id === null) throw new HttpError("sandbox_unavailable", `工作区尚未放置（无满足标签的 runner——排队等待中）：${workspace.name}`)
    const body = await readJsonBody(req).catch(() => ({}))
    const tasks = []

    if (action === "start") {
      tasks.push(enqueueForWorkspace(db, workspace, "sandbox.start", boxPayload(db, workspace, db.prepare("SELECT * FROM sandbox_runners WHERE id = ?").get(workspace.runner_id), { publicBase }), { now: now() }))
    } else if (action === "stop") {
      tasks.push(enqueueForWorkspace(db, workspace, "sandbox.stop", {}, { now: now() }))
    } else if (action === "destroy") {
      const runner = db.prepare("SELECT * FROM sandbox_runners WHERE id = ?").get(workspace.runner_id)
      const box = boxStateOf(workspace, runner)
      if (body?.confirm !== true) {
        throw new HttpError(
          "invalid_request_error",
          box.dirty
            ? `工作区有未提交改动（dirty）——销毁需二次确认（confirm: true；快照数 = ${checkpointCount(db, workspace.id)}）`
            : "销毁需二次确认（confirm: true）",
        )
      }
      revokeWorkspaceKey(db, workspace, { now: now() }) // §7：工作区销毁 ⇒ 吊销旧 key
      recordAudit(db, { type: "key_revoke", actor: admin.name, actorId: admin.id, target: workspace.name, detail: { keyHint: getKeyById(db, workspace.key_id)?.key_hint ?? null, workspaceId: workspace.id }, ts: now() })
      tasks.push(enqueueForWorkspace(db, workspace, "sandbox.destroy", { deleteVolume: true }, { now: now() }))
    } else if (action === "rotate-key") {
      const issued = rotateWorkspaceKey(db, workspace, { now: now() }) // 吊销旧 + 签发新（旧 key 重建前即失效 ⇒ 401）
      db.prepare("UPDATE sandbox_workspaces SET key_id = ?, key_plain = ? WHERE id = ?").run(issued.id, issued.plain, workspace.id)
      const updated = db.prepare("SELECT * FROM sandbox_workspaces WHERE id = ?").get(workspace.id)
      const runner = db.prepare("SELECT * FROM sandbox_runners WHERE id = ?").get(updated.runner_id)
      recordAudit(db, { type: "key_rotate", actor: admin.name, actorId: admin.id, target: updated.name, detail: { keyHint: issued.hint, workspaceId: updated.id }, ts: now() })
      const payload = boxPayload(db, updated, runner, { publicBase })
      tasks.push(enqueueForWorkspace(db, updated, "sandbox.destroy", { deleteVolume: false }, { now: now() })) // 拆容器（卷保留）
      tasks.push(enqueueForWorkspace(db, updated, "sandbox.create", payload, { now: now() }))                 // 重建（新 key 注入 env）
      tasks.push(enqueueForWorkspace(db, updated, "sandbox.start", payload, { now: now() }))
      sendJson(res, 200, { ok: true, action, tasks, keyHint: issued.hint })
      return
    } else if (action === "restore") {
      const checkpointId = body?.checkpointId === undefined || body?.checkpointId === null ? null : Number(body.checkpointId)
      const checkpoint = checkpointId === null
        ? latestCheckpoint(db, workspace.id)
        : db.prepare("SELECT * FROM sandbox_checkpoints WHERE id = ? AND workspace_id = ?").get(checkpointId, workspace.id)
      if (!checkpoint) throw new HttpError("invalid_request_error", `无快照可恢复（workspace = ${workspace.name}）`)
      tasks.push(enqueueForWorkspace(db, workspace, "sandbox.restore", { checkpointId: checkpoint.id }, { now: now() }))
    }
    sendJson(res, 200, { ok: true, action, tasks })
  })

  // ── ③ 出站规则 ────────────────────────────────────────────────────────────
  routes.add("GET", "/api/admin/sandbox/rules", (req, res) => {
    requireAdmin(db, req)
    sendJson(res, 200, { rules: listRules(db), rulesRev: getRulesRev() })
  })

  routes.add("POST", "/api/admin/sandbox/rules", async (req, res) => {
    const { member: admin } = requireAdmin(db, req)
    const body = await readJsonBody(req)
    let created
    try {
      created = createRule(db, body, { actor: admin.name, actorId: admin.id, now: now() }) // source ∈ {admin, default}（default = 采纳建议入默认单）
    } catch (e) {
      if (e instanceof HttpError) throw e
      throw new HttpError("invalid_request_error", e.message)
    }
    sendJson(res, 200, { rule: created.rule, rulesRev: created.rulesRev })
  })

  routes.add("PATCH", "/api/admin/sandbox/rules/:id", async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const body = await readJsonBody(req)
    let updated
    try {
      updated = updateRule(db, ctx.params.id, body, { actor: admin.name, actorId: admin.id, now: now() })
    } catch (e) {
      if (e instanceof HttpError) throw e
      throw new HttpError("invalid_request_error", e.message)
    }
    sendJson(res, 200, { rule: updated.rule, rulesRev: updated.rulesRev })
  })

  routes.add("DELETE", "/api/admin/sandbox/rules/:id", (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const removed = deleteRule(db, ctx.params.id, { actor: admin.name, actorId: admin.id })
    sendJson(res, 200, { rule: removed.rule, rulesRev: removed.rulesRev })
  })

  // ── ④ 待批队列 ────────────────────────────────────────────────────────────
  routes.add("GET", "/api/admin/sandbox/pending", (req, res) => {
    requireAdmin(db, req)
    sendJson(res, 200, listPending(db, { now: now() }))
  })

  routes.add("POST", "/api/admin/sandbox/pending/:id/resolve", async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const body = await readJsonBody(req)
    const row = db.prepare("SELECT * FROM sandbox_pending WHERE id = ?").get(Number(ctx.params.id))
    if (!row) throw new HttpError("not_found", `待批不存在：${ctx.params.id}`)
    let resolved
    try {
      resolved = resolvePending(db, row.id, body?.decision, { actor: admin.name, actorId: admin.id, now: now() })
    } catch (e) {
      if (e instanceof HttpError) throw e
      throw new HttpError("invalid_request_error", e.message)
    }
    sendJson(res, 200, { ok: true, pending: resolved.pending, rule: resolved.rule, rulesRev: resolved.rulesRev })
  })

  // ── ⑤ 资源与 TTL（设置面）────────────────────────────────────────────────
  routes.add("GET", "/api/admin/sandbox/settings", (req, res) => {
    requireAdmin(db, req)
    sendJson(res, 200, { settings: getSettings(db) })
  })

  routes.add("PATCH", "/api/admin/sandbox/settings", async (req, res) => {
    const { member: admin } = requireAdmin(db, req)
    const body = await readJsonBody(req)
    const before = getSettings(db)
    let after
    try {
      after = patchSettings(db, body)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 形/范围不过 ⇒ 400 库零变
    }
    const changed = JSON.stringify(before) !== JSON.stringify(after)
    if (changed) {
      bumpRulesRev() // §2.5：设置变更 ⇒ rulesRev +1（下发即生效）
      recordAudit(db, { type: "config_update", actor: admin.name, actorId: admin.id, target: "sandbox_settings", detail: { keys: Object.keys(body ?? {}) }, ts: now() }) // 沿配置控制台先例（键名清单——值永不入；SANDBOX §2 审计型面未列设置 ⇒ 用既有 config_update，见批档 §5）
    }
    sendJson(res, 200, { settings: after, rulesRev: getRulesRev() })
  })

  // ── 成员面（本人——§2.7；恒本人过滤）──────────────────────────────────────
  routes.add("GET", "/api/me/sandbox/workspaces", (req, res) => {
    const { member } = requireSession(db, req)
    const availability = sandboxAvailability(db)
    if (availability.status === "unavailable") throw new HttpError("sandbox_unavailable", `沙盒不可用：${availability.reason}`)
    sweepStuckTasks(db, { now: now() })
    const workspaces = db
      .prepare("SELECT * FROM sandbox_workspaces WHERE owner_member_id = ? ORDER BY id")
      .all(member.id)
      .map((workspace) => {
        const runner = workspace.runner_id === null ? null : db.prepare("SELECT * FROM sandbox_runners WHERE id = ?").get(workspace.runner_id)
        const box = boxStateOf(workspace, runner)
        return {
          id: workspace.id,
          name: workspace.name,
          boxState: box.boxState,
          stopReason: box.stopReason,
          dirty: box.dirty,
          checkpointCount: checkpointCount(db, workspace.id),
          pending: openPendingOf(db, workspace.id, { now: now() }),
        }
      })
    sendJson(res, 200, { workspaces })
  })

  // ── 容器面（拆分档——SANDBOX §13 预案①）────────────────────────────────────
  registerContainerRoutes(routes, { db, fetchImpl, now })

  // ── 托管接入面（四端点转注册——`bin` ±0；起跑后立即交回，进度经读时轮询）────
  const onboarding = registerOnboardingRoutes(routes, { db, config, log, now, deps })
  onboarding.resumeInterrupted() // 重启恢复（KD-SV-86）：在途 `running` ⇒ `interrupted`（如实收尾 + 凭据按模式处置）
}
