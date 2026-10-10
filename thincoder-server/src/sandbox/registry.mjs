/**
 * registry.mjs — 沙盒编排核心（sandbox/SANDBOX.md §2/§3/§5/§8）：节点登记/读数/可用性（**Docker API 节点**——runner-admin-console 批重写）∥
 * 放置（本批 = 静态判据）∥ 任务队列（悬挂回收）∥ 全局设置与每工作区资源覆写 ∥ 盒读数与载荷。
 *
 * 节点面（KD-SV-79/80/81）：登记 = 连通自检读数落 `runtime_json`（`address` ∥ `status` active/disabled）；读数 = 读时探活
 * （`docker.mjs` 现打 `/info`——无心跳 ∥ 无后台定时器）；可用性 = 静态判据（存在 active 节点——实时门随重做批）；容器不落库。
 * **心跳/队列死件**（`applyHeartbeat` ∥ `applyBoxReport` ∥ `claimTasks` ∥ `reportTask` ⋯）：执行面通道已随 2026-10-10 守护进程清除，
 * 无调用方——本批不动（收正随执行面重做批）；`runnerHealth` 已删（心跳面退场——设计明文）。
 *
 * 指令生命周期（§3——死件同注）：enqueue（queued）⇒ claim（poll 领取 ⇒ claimed）⇒ report（done/failed/unsupported）；
 * 悬挂回收 = `claimed` 逾期（5 分钟——常量）⇒ 幂等 kind 回 `queued`（重派）∥ 非幂等 ⇒ `failed`（不自动重跑；心跳判据已去）。
 * 资源取值序（§2）：全局默认（`sandbox_settings`）⇒ 逐键叠加工作区覆写（覆写优先）——解析结果随 create/重建载荷下发。
 * 本档导出协议常量（kind 全集 ∥ 幂等集）——enqueue 只校 kind 形不封集（KD-SV-72 可扩）。
 */
import { HttpError } from "../gateway/errors.mjs"
import { recordAudit } from "../accounts/audit.mjs"

/** 指令悬挂回收界（§3「缺省 5 分钟——常量」）。 */
export const CLAIM_TIMEOUT_MS = 5 * 60 * 1000

/** 本批指令 kind（`sandbox.*`；`ci.*` 预留——KD-SV-72 可扩，故 enqueue 只校形不封集）。 */
export const TASK_KINDS = Object.freeze([
  "sandbox.create", "sandbox.start", "sandbox.stop", "sandbox.destroy",
  "sandbox.exec", "sandbox.checkpoint", "sandbox.restore",
])

/** 幂等 kind（悬挂回收 ⇒ 回 queued 重派；`exec` = 非幂等 ⇒ failed——§3）。 */
export const IDEMPOTENT_TASK_KINDS = Object.freeze([
  "sandbox.create", "sandbox.start", "sandbox.stop", "sandbox.destroy", "sandbox.checkpoint", "sandbox.restore",
])

/** 盒状态取值（心跳上报——`stopReason` 词表 = gateway/API.md §2.7）。 */
export const BOX_STATES = Object.freeze(["running", "stopped"])
export const STOP_REASONS = Object.freeze(["idle_ttl", "wallclock_ttl", "manual"])

/** 每工作区覆写键集（SANDBOX §2——资源 + TTL）。 */
export const LIMIT_KEYS = Object.freeze(["cpus", "memMb", "pids", "diskMb", "idleTtlMinutes", "wallclockTtlHours"])

/** 工作区名上限（`sandbox:<名>` 须入 key 名（≤ 40 字符）——`sandbox:` 前缀 8 字符）∥ 节点名上限（§3）。 */
export const WORKSPACE_NAME_MAX = 30
export const RUNNER_NAME_MAX = 40

/** 全局默认设置（键全集与值形 = gateway/API.md §2.5；缺省值 = 实现定值——控制台可改）。 */
export const DEFAULT_SETTINGS = Object.freeze({
  cpus: 2,                       // 数（可小数）
  memMb: 4096,                   // 正整数
  pids: 512,
  diskMb: 4096,
  idleTtlMinutes: 30,            // 空闲超时（§3）
  wallclockTtlHours: 24,         // 墙钟 TTL（§3）
  checkpointEveryMinutes: 15,    // WIP 快照周期（U5）
  checkpointKeep: 5,             // 快照保留份数（§5）
  pendingTimeoutSeconds: 60,     // 待批挂起窗（§6）
  joinTtlMinutes: 30,            // 加入令牌有效期（§3）——死件键：join 面已随守护进程清除（保留随重做批收正）
  tmpfsMb: 256,                  // tmpfs /tmp 容积（披露 D1）
  image: "thincoder-sandbox:1",  // 盒镜像（§3「镜像 = 控制台预填设置」缺省值）
})

export const SETTING_KEYS = Object.freeze(Object.keys(DEFAULT_SETTINGS))

// ── 小助手 ───────────────────────────────────────────────────────────────────

function parseJson(text, fallback) {
  try {
    const value = JSON.parse(text)
    return value === null || typeof value !== "object" ? fallback : value
  } catch {
    return fallback
  }
}

function trimText(value, max, { field = "值", allowEmpty = false } = {}) {
  const text = typeof value === "string" ? value.trim() : ""
  if (!allowEmpty && text === "") throw new Error(`${field}不可为空`)
  if (text.length > max) throw new Error(`${field}超长（≤ ${max} 字符；实长 ${text.length}）`)
  return text
}

// ── 设置（全局默认——§8「资源与 TTL」）───────────────────────────────────────

/** 有效设置 = 默认 ∪ 表内值（表只存被设置过的键）。 */
export function getSettings(db) {
  const stored = new Map(db.prepare("SELECT k, v FROM sandbox_settings").all().map((row) => [row.k, row.v]))
  const out = {}
  for (const key of SETTING_KEYS) {
    if (!stored.has(key)) {
      out[key] = DEFAULT_SETTINGS[key]
      continue
    }
    try {
      out[key] = JSON.parse(stored.get(key))
    } catch {
      out[key] = DEFAULT_SETTINGS[key]
    }
  }
  return out
}

/** 单键值校验（API §2.5「值形逐键」）：cpus = 正数；余 = 正整数；image = 非空字符串。 */
export function validateSettingValue(key, value) {
  if (key === "image") return trimText(value, 200, { field: "镜像名" })
  const num = Number(value)
  if (!Number.isFinite(num)) throw new Error(`${key} 须为数值：${JSON.stringify(value)}`)
  if (key === "cpus") {
    if (num <= 0) throw new Error(`cpus 须为正数：${num}`)
    return num
  }
  if (!Number.isInteger(num) || num <= 0) throw new Error(`${key} 须为正整数：${JSON.stringify(value)}`)
  return num
}

/** 设置写（键级合并——值 = 整键替换；`null` = 删键回落默认）；未知键 ∥ 形非法 ⇒ 抛（库零变）。 */
export function patchSettings(db, patch) {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) throw new Error("设置写面须为对象（{ <键>: 值 }）")
  const keys = Object.keys(patch)
  if (keys.length === 0) throw new Error("设置写面为空（至少一键）")
  const ops = keys.map((key) => {
    if (!SETTING_KEYS.includes(key)) throw new Error(`未知设置键：${key}（键集 = ${SETTING_KEYS.join(" ∥ ")}）`)
    return [key, patch[key] === null ? null : validateSettingValue(key, patch[key])]
  })
  for (const [key, value] of ops) {
    if (value === null) db.prepare("DELETE FROM sandbox_settings WHERE k = ?").run(key)
    else db.prepare("INSERT INTO sandbox_settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").run(key, JSON.stringify(value))
  }
  return getSettings(db)
}

// ── 每工作区覆写（§2「资源 + TTL」）──────────────────────────────────────────

/** 覆写校验：键集 ⊆ `LIMIT_KEYS`；cpus = 正数；余 = 正整数；`null` = 删键（回落全局默认）。 */
export function validateLimitsPatch(patch) {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) throw new Error("limits 须为对象（{ <键>: 值 }；值 null = 删键）")
  const out = {}
  for (const [key, value] of Object.entries(patch)) {
    if (!LIMIT_KEYS.includes(key)) throw new Error(`未知覆写键：${key}（键集 = ${LIMIT_KEYS.join(" ∥ ")}）`)
    out[key] = value === null ? null : validateSettingValue(key, value)
  }
  return out
}

/** 键级合并（出现键 = 应用；值 null = 删键）——返回新覆写对象（库零变 ⇒ 抛在写前）。 */
export function mergeLimits(existingJson, patch) {
  const merged = { ...parseJson(existingJson, {}) }
  for (const [key, value] of Object.entries(validateLimitsPatch(patch))) {
    if (value === null) delete merged[key]
    else merged[key] = value
  }
  return merged
}

/** 取值序（§2）：全局默认 ⇒ 逐键叠加工作区覆写（覆写优先）——create/重建载荷逐值。 */
export function resolveLimits(db, workspace, settings = getSettings(db)) {
  const overrides = parseJson(workspace.limits_json, {})
  const out = {}
  for (const key of LIMIT_KEYS) out[key] = overrides[key] ?? settings[key]
  return out
}

// ── 节点（登记/读数/可用性——§3；Docker API 节点）────────────────────────────

/** 节点名归一（≤ 40 字符——§3；空 ⇒ 抛）。 */
export function normalizeRunnerName(raw) {
  return trimText(raw, RUNNER_NAME_MAX, { field: "节点名" })
}

/** 节点读数（§3 `overview` 基础行——`online`/`version`/`containers` 三值由路由面读时探活并上）。 */
export function runnerView(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    status: row.status,
    selfCheck: parseJson(row.runtime_json, {}),
    createdAt: row.created_at,
  }
}

/** 节点行（id 序——登记/探活/删除面共用）。 */
export function runnerRows(db) {
  return db.prepare("SELECT * FROM sandbox_runners ORDER BY id").all()
}

export function listRunners(db) {
  return runnerRows(db).map(runnerView)
}

/** 节点行 or 404（`not_found`）。 */
export function runnerRowOr404(db, id) {
  const row = db.prepare("SELECT * FROM sandbox_runners WHERE id = ?").get(Number(id))
  if (!row) throw new HttpError("not_found", `节点不存在：${id}`)
  return row
}

/** 登记一行（连通自检通过后落库——§3；`runtime` = 自检读数逐值）。重名 ⇒ 抛（调用方 400——零落库）。 */
export function insertRunner(db, { name, address, runtime = {}, now = Date.now() } = {}) {
  const resolved = normalizeRunnerName(name)
  if (typeof address !== "string" || address.trim() === "") throw new Error("登记缺节点地址（address）")
  try {
    const info = db
      .prepare("INSERT INTO sandbox_runners (name, address, status, runtime_json, created_at) VALUES (?, ?, 'active', ?, ?)")
      .run(resolved, address.trim(), JSON.stringify(runtime ?? {}), new Date(now).toISOString())
    return db.prepare("SELECT * FROM sandbox_runners WHERE id = ?").get(Number(info.lastInsertRowid))
  } catch (e) {
    if (/UNIQUE constraint failed: sandbox_runners\.name/.test(String(e?.message))) {
      throw new Error(`节点名已存在：${resolved}（换一个名字，或先清理旧登记）`)
    }
    throw e
  }
}

/** 可用节点（静态判据——§3：`status = 'active'`；实时探活归运行面读数——KD-SV-80）。 */
export function usableRunners(db) {
  return runnerRows(db).filter((row) => row.status === "active")
}

/** 可用性门（KD-SV-71 语义保持；本批 = 静态判据：存在 `active` 节点——实时门随重做批；仅沙盒功能面不可用）。 */
export function sandboxAvailability(db) {
  const rows = runnerRows(db)
  if (rows.length === 0) return { status: "unavailable", reason: "无节点注册" }
  if (!rows.some((row) => row.status === "active")) return { status: "unavailable", reason: "无可用节点（节点均非 active）" }
  return { status: "available" }
}

/** 写门（需要节点的写动作——B35：写动作 ⇒ 503 `sandbox_unavailable`，不降级）。 */
export function requireSandboxAvailable(db, { detail = null } = {}) {
  const availability = sandboxAvailability(db)
  if (availability.status === "unavailable") {
    throw new HttpError("sandbox_unavailable", detail ? `${detail}（${availability.reason}）` : `沙盒不可用：${availability.reason}`)
  }
}

// ── 心跳/队列死件（执行面通道已清除——本批不动；收正随执行面重做批）────────────

/** 心跳块读取（死件读取面——`boxStateOf` 仍读 `boxes`；写入面已无调用方）。 */
function heartbeatBlock(row) {
  const block = parseJson(row.runtime_json, {})
  return {
    version: typeof block.version === "string" ? block.version : null,
    runtime: block.runtime ?? null,
    runtimeAvailable: block.runtimeAvailable !== false,
    diskFreeMb: Number.isFinite(block.diskFreeMb) ? block.diskFreeMb : null,
    boxes: normalizeBoxes(block.boxes),
  }
}

/** 盒清单归一（上报形：`[{ workspaceId, state, stopReason?, dirty? }]`——非法条目略过）。 */
export function normalizeBoxes(input) {
  if (!Array.isArray(input)) return []
  const out = []
  for (const raw of input.slice(0, 500)) {
    if (raw === null || typeof raw !== "object") continue
    const workspaceId = Number(raw.workspaceId)
    if (!Number.isInteger(workspaceId)) continue
    const state = raw.state === "running" ? "running" : "stopped"
    const stopReason = raw.stopReason === null || raw.stopReason === undefined ? null : String(raw.stopReason)
    out.push({ workspaceId, state, stopReason, dirty: raw.dirty === true })
  }
  return out
}

/** 心跳（死件——通道已清除、无调用方；引 `last_heartbeat_at` 列已随 v12 退场）。 */
export function applyHeartbeat(db, row, payload = {}, { now = Date.now() } = {}) {
  const block = heartbeatBlock(row)
  const next = { ...block }
  if (payload.version !== undefined) next.version = payload.version === null ? null : String(payload.version).slice(0, 64)
  if (payload.runtime !== undefined) next.runtime = payload.runtime ?? null
  if (payload.runtimeAvailable !== undefined) next.runtimeAvailable = payload.runtimeAvailable === true
  if (payload.diskFreeMb !== undefined) {
    const disk = Number(payload.diskFreeMb)
    next.diskFreeMb = Number.isFinite(disk) && disk >= 0 ? disk : null
  }
  let transitions = []
  if (Array.isArray(payload.boxes)) {
    const boxes = normalizeBoxes(payload.boxes)
    transitions = boxTransitions(block.boxes, boxes)
    next.boxes = boxes
  }
  db.prepare("UPDATE sandbox_runners SET runtime_json = ?, last_heartbeat_at = ? WHERE id = ?").run(JSON.stringify(next), now, row.id)
  let status = row.status
  if (payload.drain === true && row.status === "draining") {
    db.prepare("UPDATE sandbox_runners SET status = 'drained' WHERE id = ?").run(row.id)
    status = "drained"
  }
  if (transitions.length > 0) recordBoxTransitions(db, row, transitions, { now })
  return { ...row, status, runtime_json: JSON.stringify(next), last_heartbeat_at: now }
}

/** 盒状态变化登记（死件——同注）。 */
export function applyBoxReport(db, row, boxes, { now = Date.now() } = {}) {
  const block = heartbeatBlock(row)
  const normalized = normalizeBoxes(boxes)
  const transitions = boxTransitions(block.boxes, normalized)
  const next = { ...block, boxes: normalized }
  db.prepare("UPDATE sandbox_runners SET runtime_json = ? WHERE id = ?").run(JSON.stringify(next), row.id)
  if (transitions.length > 0) recordBoxTransitions(db, row, transitions, { now })
  return { ...row, runtime_json: JSON.stringify(next) }
}

/** 变化对比：新盒 ⇒ box_start；running ⇒ stopped ⇒ box_stop；已知盒消失 ⇒ box_destroy。 */
function boxTransitions(prev, next) {
  const previous = new Map(prev.map((box) => [box.workspaceId, box]))
  const seen = new Set()
  const out = []
  for (const box of next) {
    seen.add(box.workspaceId)
    const before = previous.get(box.workspaceId)
    if (!before) {
      if (box.state === "running") out.push({ kind: "box_start", workspaceId: box.workspaceId, stopReason: null })
      continue
    }
    if (before.state === "stopped" && box.state === "running") out.push({ kind: "box_start", workspaceId: box.workspaceId, stopReason: null })
    if (before.state === "running" && box.state === "stopped") out.push({ kind: "box_stop", workspaceId: box.workspaceId, stopReason: box.stopReason })
  }
  for (const before of prev) {
    if (!seen.has(before.workspaceId)) out.push({ kind: "box_destroy", workspaceId: before.workspaceId, stopReason: before.stopReason })
  }
  return out
}

function recordBoxTransitions(db, row, transitions, { now = Date.now() } = {}) {
  for (const transition of transitions) {
    const workspace = db.prepare("SELECT name FROM sandbox_workspaces WHERE id = ?").get(transition.workspaceId)
    recordAudit(db, {
      type: "sandbox_event",
      actor: `runner:${row.name}`,
      target: workspace?.name ?? `#${transition.workspaceId}`,
      detail: { kind: transition.kind, workspaceId: transition.workspaceId, ...(transition.stopReason ? { stopReason: transition.stopReason } : {}) },
      ts: now,
    })
  }
}

// ── 放置（§5）───────────────────────────────────────────────────────────────

/** 放置判据（本批静态——§3：取 id 最小 active 节点；标签/容量/实时探活随执行面重做批）。无 ⇒ null（排队等待）。 */
export function placeWorkspace(db) {
  return usableRunners(db)[0] ?? null
}

/** 未放置工作区补放置（节点登记触达——「无满足者 ⇒ 排队等待」的续跑点）：绑定 + create/start 入队。 */
export function tryPlacePending(db, { now = Date.now(), publicBase = null } = {}) {
  const unbound = db.prepare("SELECT * FROM sandbox_workspaces WHERE runner_id IS NULL ORDER BY id").all()
  const placed = []
  for (const workspace of unbound) {
    const runner = placeWorkspace(db)
    if (!runner) continue
    db.prepare("UPDATE sandbox_workspaces SET runner_id = ? WHERE id = ?").run(runner.id, workspace.id)
    const bound = { ...workspace, runner_id: runner.id }
    const payload = boxPayload(db, bound, runner, { publicBase })
    enqueueTask(db, { runnerId: runner.id, kind: "sandbox.create", workspaceId: workspace.id, payload, now })
    enqueueTask(db, { runnerId: runner.id, kind: "sandbox.start", workspaceId: workspace.id, payload, now })
    placed.push(workspace.id)
  }
  return placed
}

// ── 指令队列（§3——死件同注；悬挂回收面在）──────────────────────────────────

/** 入队（queued）：payload = `{ workspaceId, ...字段 }`（单存——投递时拆出 workspaceId）。返回行 id。 */
export function enqueueTask(db, { runnerId, kind, workspaceId, payload = {}, now = Date.now() } = {}) {
  if (typeof kind !== "string" || !/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/.test(kind)) throw new Error(`指令 kind 形非法：${String(kind)}`)
  if (!Number.isInteger(Number(runnerId))) throw new Error("指令须有目标 runner（runnerId）")
  const info = db
    .prepare("INSERT INTO sandbox_tasks (runner_id, kind, payload_json, status, created_at) VALUES (?, ?, ?, 'queued', ?)")
    .run(Number(runnerId), kind, JSON.stringify({ workspaceId, ...payload }), new Date(now).toISOString())
  return Number(info.lastInsertRowid)
}

/** 领取（poll——queued ⇒ claimed；返回投递形 `{ id, kind, workspaceId, payload }`）。死件（无调用方）。 */
export function claimTasks(db, runnerId, { now = Date.now() } = {}) {
  const rows = db.prepare("SELECT * FROM sandbox_tasks WHERE runner_id = ? AND status = 'queued' ORDER BY id").all(Number(runnerId))
  const out = []
  for (const row of rows) {
    db.prepare("UPDATE sandbox_tasks SET status = 'claimed', claimed_at = ? WHERE id = ?").run(now, row.id)
    const { workspaceId = null, ...payload } = parseJson(row.payload_json, {})
    out.push({ id: row.id, kind: row.kind, workspaceId, payload })
  }
  return out
}

/** 上报指令结果：done ∥ failed ∥ unsupported（须属本 runner）。死件（无调用方）。 */
export function reportTask(db, runnerId, { taskId, status, result = null, now = Date.now() } = {}) {
  const id = Number(taskId)
  const row = db.prepare("SELECT * FROM sandbox_tasks WHERE id = ? AND runner_id = ?").get(id, Number(runnerId))
  if (!row) throw new HttpError("not_found", `指令不存在或不属于本 runner：${String(taskId)}`)
  if (status !== "done" && status !== "failed" && status !== "unsupported") throw new Error(`指令结果状态须为 done ∥ failed ∥ unsupported：${String(status)}`)
  db.prepare("UPDATE sandbox_tasks SET status = ?, finished_at = ?, result_json = ? WHERE id = ?").run(status, now, JSON.stringify(result ?? {}), id)
  return db.prepare("SELECT * FROM sandbox_tasks WHERE id = ?").get(id)
}

/** 悬挂回收（§3）：`claimed` 逾期（5 分钟）⇒ 幂等 kind 回 queued（重派）∥ 非幂等 ⇒ failed + 原因。
 *  心跳判据已去（KD-SV-80——节点存活 = 读时探活；本批零改队列语义）。 */
export function sweepStuckTasks(db, { now = Date.now() } = {}) {
  const rows = db
    .prepare("SELECT * FROM sandbox_tasks WHERE status = 'claimed' AND claimed_at IS NOT NULL AND claimed_at <= ?")
    .all(now - CLAIM_TIMEOUT_MS)
  const reclaimed = []
  for (const row of rows) {
    if (IDEMPOTENT_TASK_KINDS.includes(row.kind)) {
      db.prepare("UPDATE sandbox_tasks SET status = 'queued' WHERE id = ?").run(row.id) // claimed_at 留作「重派中」标记
      reclaimed.push({ id: row.id, kind: row.kind, action: "requeued" })
    } else {
      db.prepare("UPDATE sandbox_tasks SET status = 'failed', finished_at = ?, result_json = ? WHERE id = ?").run(
        now,
        JSON.stringify({ reason: "指令领取逾期（5 分钟）——非幂等指令不自动重跑" }),
        row.id,
      )
      reclaimed.push({ id: row.id, kind: row.kind, action: "failed" })
    }
  }
  return reclaimed
}

/** 工作区行可见面（B41）：最近一条指令（`queued` + 已领取过 = 重派中；`failed` 携原因）。 */
export function lastTaskView(db, workspaceId) {
  const row = db
    .prepare("SELECT * FROM sandbox_tasks WHERE json_extract(payload_json, '$.workspaceId') = ? ORDER BY id DESC LIMIT 1")
    .get(Number(workspaceId))
  if (!row) return null
  const result = parseJson(row.result_json, null)
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    requeued: row.status === "queued" && row.claimed_at !== null,
    reason: row.status === "failed" && result !== null ? (result.reason ?? null) : null,
    createdAt: row.created_at,
    claimedAt: row.claimed_at ?? null,
    finishedAt: row.finished_at ?? null,
  }
}

// ── 盒读数与载荷（§2 取值序 / §7 env）───────────────────────────────────────

/** 工作区盒读数（心跳块派生——死件读取面：新模型下 `boxes` 恒空 ⇒ 「stopped/无 dirty」；
 *  真实盒态随执行面重做批经 Docker API 读）。 */
export function boxStateOf(workspace, runnerRow) {
  if (!runnerRow) return { boxState: "stopped", stopReason: null, dirty: false }
  const box = heartbeatBlock(runnerRow).boxes.find((item) => item.workspaceId === workspace.id)
  if (!box) return { boxState: "stopped", stopReason: null, dirty: false }
  return { boxState: box.state === "running" ? "running" : "stopped", stopReason: box.stopReason, dirty: box.dirty === true }
}

/** box 载荷（create/重建——取值序 = 全局默认 ⇒ 逐键覆写；env = 盒内唯一凭据面）。 */
export function boxPayload(db, workspace, runner, { publicBase = null } = {}) {
  const settings = getSettings(db)
  return {
    image: settings.image,
    tmpfsMb: settings.tmpfsMb,
    limits: resolveLimits(db, workspace, settings),
    checkpoint: { everyMinutes: settings.checkpointEveryMinutes, keep: settings.checkpointKeep },
    network: `tc-ws-${workspace.id}`,
    volume: String(workspace.id),
    env: {
      OPENAI_BASE_URL: publicBase, // http://<server>:<port>/v1——config.host 为通配地址（0.0.0.0）时该值不可直连，执行面侧以其 --server 地址替换（实施注）
      OPENAI_API_KEY: workspace.key_plain, // 工作区 key（盒内零服务器密钥——§7）
    },
  }
}

/** 服务基址（盒内 env `OPENAI_BASE_URL`——config.host/port 组成）。 */
export function sandboxPublicBase(config = {}) {
  const host = typeof config.host === "string" && config.host.trim() !== "" ? config.host.trim() : "127.0.0.1"
  const port = Number(config.port) > 0 ? Number(config.port) : 80
  const hostPart = host.includes(":") && !host.startsWith("[") ? `[${host}]` : host
  return `http://${hostPart}:${port}/v1`
}
