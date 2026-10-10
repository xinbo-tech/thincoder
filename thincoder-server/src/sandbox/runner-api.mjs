/**
 * runner-api.mjs — runner 通道（sandbox/SANDBOX.md §3；端点表 = gateway/API.md §2.6；最小权限——`/api/runner/*` 专用守卫）：
 * 加入令牌（进程内存——重启作废；一次性 ∥ 缺省 30 分钟）⇒ `join` 兑换 runner 令牌 ∥ 心跳 ∥ 长轮询（≤25s——携 rulesRev，
 * 变则全量规则；裁定随下发）∥ 上报（指令结果 ∥ 盒状态变化）∥ 待批登记 ∥ 快照（上送 = octet-stream 流式落盘（路由级 200 MiB——
 * `gateway/server.mjs` 豁免件）+ 取回）。
 *
 * 软状态族（本档进程内存）：① 加入令牌（`{ expiresAt, consumed }`——E30 三态人话：过期 ∥ 已用过 ∥ 令牌不对）；
 * ② 待批「已下发」簿记（重启 ⇒ 至多重发一次；裁定按 id 匹配——重发幂等）；③ 长轮询唤醒器（同进程事件面）。
 * 令牌形：join = `tc-join-<base64url>` ∥ runner = `tc-runner-<base64url>`（服务器只存 sha256——N40）。
 * 动态网段 deny（§4「服务器网段 ∥ runner 自身网段——注册时自动带入」）：join 时按对端/本端地址取 /24 带入（回环豁免）。
 */
import { createHash, randomBytes } from "node:crypto"
import { createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

import { requireRunner } from "../accounts/session.mjs"
import { recordAudit } from "../accounts/audit.mjs"
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { MAX_CHECKPOINT_BYTES, readJsonBody, readStreamBody } from "../gateway/server.mjs"
import { ensureSegmentDeny, getRulesRev, listRules, markPending, parseIpv4, pendingResolutions, sortRules, sweepPendingTimeouts } from "./rules.mjs"
import {
  applyBoxReport,
  applyHeartbeat,
  claimTasks,
  getSettings,
  registerRunner,
  reportTask,
  sandboxPublicBase,
  sweepStuckTasks,
  tryPlacePending,
} from "./registry.mjs"

/** 长轮询等待上限（§3「≤25s」——注册参数可覆盖：批内件用短等待）。 */
export const POLL_WAIT_MS = 25000

/** 快照落盘根（缺省 = 库档旁 `checkpoints/`——单一数据目录口径）。 */
export function checkpointDirFor(config = {}) {
  const dbPath = typeof config.db === "string" && config.db.trim() !== "" && config.db !== ":memory:" ? config.db : "data/gateway.db"
  return join(dirname(resolve(dbPath)), "checkpoints")
}

/** 加入令牌前缀 / runner 令牌前缀（服务器只存 sha256——明文仅兑换时一次性回显）。 */
export const JOIN_TOKEN_PREFIX = "tc-join-"
export const RUNNER_TOKEN_PREFIX = "tc-runner-"

const hashToken = (token) => createHash("sha256").update(token).digest("hex")

// ── 软状态：加入令牌 ∥ 已下发簿记 ∥ 长轮询唤醒器 ─────────────────────────────

const joinTokens = new Map() // tokenHash → { expiresAt, consumed }
const deliveredResolutions = new Map() // runnerId → Set<pendingId>
const pollWaiters = new Map() // runnerId → Set<wake>

/** 生成加入令牌（一次性——`{ token, expiresAt }`；落点 = 进程内存，重启作废）。 */
export function createJoinToken(db, { ttlMinutes = null, now = Date.now() } = {}) {
  cleanupJoinTokens(now)
  const ttl = Number.isInteger(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes : getSettings(db).joinTtlMinutes
  const token = JOIN_TOKEN_PREFIX + randomBytes(24).toString("base64url")
  const expiresAt = now + ttl * 60 * 1000
  joinTokens.set(hashToken(token), { expiresAt, consumed: false })
  return { token, expiresAt }
}

/** 兑换判（一次性）：三态区分（不存在 ∥ 已用过 ∥ 过期）——消息逐句人话（E30）。 */
export function consumeJoinToken(token, { now = Date.now() } = {}) {
  const raw = typeof token === "string" ? token.trim() : ""
  const entry = raw === "" ? undefined : joinTokens.get(hashToken(raw))
  if (!entry) return { ok: false, code: "not_found", message: "加入令牌不对（不是本服务器签发的令牌——请从控制台重新生成）" }
  if (entry.consumed) return { ok: false, code: "consumed", message: "加入令牌已用过（一次性——请从控制台重新生成）" }
  if (entry.expiresAt <= now) return { ok: false, code: "expired", message: "加入令牌已过期（有效期已过——请从控制台重新生成）" }
  entry.consumed = true
  return { ok: true }
}

/** 清理：过期/作废超 24h 的条目出表（近窗保留——过期态消息仍可判）。 */
export function cleanupJoinTokens(now = Date.now()) {
  for (const [hash, entry] of joinTokens) {
    if (entry.expiresAt <= now - 24 * 60 * 60 * 1000) joinTokens.delete(hash)
  }
  return joinTokens.size
}

/** 唤醒登记（poll 长等待——先登记后取数，丢唤醒为零）。 */
function createWaiter(runnerId) {
  let resolve = () => {}
  const promise = new Promise((r) => { resolve = r })
  let done = false
  const wake = () => {
    if (done) return
    done = true
    resolve()
  }
  const set = pollWaiters.get(runnerId) ?? new Set()
  set.add(wake)
  pollWaiters.set(runnerId, set)
  return {
    promise,
    dispose() {
      done = true
      resolve() // 拆分（客户端断连等）也收敛等待——写出前有 destroyed 判
      set.delete(wake)
      if (set.size === 0) pollWaiters.delete(runnerId)
    },
  }
}

/** 唤醒某 runner 的在飞长轮询（任务入队 ∥ 排空旗置位后调——routes 侧）。 */
export function signalRunner(runnerId) {
  for (const wake of pollWaiters.get(Number(runnerId)) ?? []) wake()
}

/** 唤醒全部在飞长轮询（规则/设置变更——全局面）。 */
export function signalAll() {
  for (const set of pollWaiters.values()) for (const wake of set) wake()
}

// ── 注册（join——唯一免令牌开口）────────────────────────────────────────────

function clientIp(req) {
  const address = req.socket?.remoteAddress ?? null
  return typeof address === "string" ? address.replace(/^::ffff:/, "") : null
}

/** 网段（/24）提取：IPv4 且非回环/未指定 ⇒ `a.b.c.0/24`；否则 null（回环豁免——恒拒面已覆盖，不污染规则表）。 */
export function segmentOf(address) {
  const ip = typeof address === "string" ? address.replace(/^::ffff:/, "").trim() : ""
  if (ip === "" || ip === "0.0.0.0" || ip === "::" || ip === "::1") return null
  if (parseIpv4(ip) === null) return null
  if (ip.startsWith("127.")) return null
  const octets = ip.split(".")
  return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`
}

/**
 * 注册 runner 通道路由（`/api/runner/*`——§3/API §2.6）。
 * 注入口径（批内件替身）：`pollWaitMs`（缺省 25000——长轮询上限）∥ `now`（时钟）∥ `maxCheckpointBytes`（缺省 200 MiB——
 * 路由级体限）∥ `checkpointDir`（缺省 = `checkpointDirFor(config)`），缺省 = 生产行为不变。
 */
export function registerRunnerApiRoutes(routes, { db, config = {}, log = null, pollWaitMs = POLL_WAIT_MS, now = Date.now, maxCheckpointBytes = MAX_CHECKPOINT_BYTES, checkpointDir = null } = {}) {
  if (!db) throw new Error("registerRunnerApiRoutes：缺少 db（openDatabase 产物）")
  const publicBase = sandboxPublicBase(config)
  const checkpointRoot = checkpointDir ?? checkpointDirFor(config)

  routes.add("POST", "/api/runner/join", async (req, res) => {
    const body = await readJsonBody(req)
    const verdict = consumeJoinToken(body?.token, { now: now() })
    if (!verdict.ok) {
      recordAudit(db, {
        type: "sandbox_event",
        actor: "runner",
        target: typeof body?.name === "string" ? body.name : "",
        detail: { kind: "runner_join_failed", reason: verdict.code, name: body?.name ?? null, ip: clientIp(req) },
      })
      throw new HttpError("invalid_request_error", verdict.message)
    }
    const token = RUNNER_TOKEN_PREFIX + randomBytes(32).toString("base64url")
    let runner
    try {
      runner = registerRunner(db, {
        name: body?.name ?? null,
        tokenHash: hashToken(token),
        labels: body?.labels ?? {},
        maxBoxes: body?.maxBoxes ?? null,
        version: body?.version ?? null,
        runtime: body?.runtime ?? null,
        runtimeAvailable: body?.runtimeAvailable ?? null,
        now: now(),
      })
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 名重复 ∥ 标签/容量形非法（库零变）
    }
    recordAudit(db, {
      type: "sandbox_event",
      actor: `runner:${runner.name}`,
      target: runner.name,
      detail: { kind: "runner_join", ip: clientIp(req), version: typeof body?.version === "string" ? body.version : null },
      ts: now(),
    })
    // 动态网段 deny（§4）：runner 自身网段 + 服务器网段（经本连接的对端/本端地址；回环豁免）
    ensureSegmentDeny(db, segmentOf(clientIp(req)), { now: now(), note: "注册动态项：runner 自身网段" })
    ensureSegmentDeny(db, segmentOf(req.socket?.localAddress), { now: now(), note: "注册动态项：服务器网段" })
    tryPlacePending(db, { now: now(), publicBase }) // 排队工作区续跑
    sendJson(res, 200, { runnerId: runner.id, token })
  })

  routes.add("POST", "/api/runner/heartbeat", async (req, res) => {
    const { runner } = requireRunner(db, req)
    const body = await readJsonBody(req)
    applyHeartbeat(db, runner, body, { now: now() })
    tryPlacePending(db, { now: now(), publicBase }) // 放置续跑（心跳触达——「排队等待」的续跑点）
    sendJson(res, 200, { ok: true, rulesRev: getRulesRev() })
  })

  routes.add("POST", "/api/runner/poll", async (req, res) => {
    const { runner } = requireRunner(db, req)
    const body = await readJsonBody(req)
    res.on("error", () => {}) // 长等待期间客户端拆连不炸进程（写失败静默）
    const waiter = createWaiter(runner.id)
    try {
      let payload = collectPoll(db, runner, body, { publicBase, now: now() })
      if (isIdlePoll(payload)) {
        let timer = null
        try {
          await Promise.race([waiter.promise, new Promise((resolve) => { timer = setTimeout(resolve, pollWaitMs); timer.unref?.() })])
        } finally {
          if (timer) clearTimeout(timer) // 被唤醒的那次不留定时器（不拖停机）
        }
        payload = collectPoll(db, runner, body, { publicBase, now: now() })
      }
      if (res.destroyed || res.writableEnded) return
      sendJson(res, 200, payload)
    } finally {
      waiter.dispose()
    }
  })

  routes.add("POST", "/api/runner/report", async (req, res) => {
    const { runner } = requireRunner(db, req)
    const body = await readJsonBody(req)
    let task = null
    if (body?.taskId !== undefined && body?.taskId !== null) {
      try {
        task = reportTask(db, runner.id, { taskId: body.taskId, status: body.status, result: body.result ?? null, now: now() })
      } catch (e) {
        if (e instanceof HttpError) throw e
        throw new HttpError("invalid_request_error", e.message)
      }
    }
    if (Array.isArray(body?.boxes)) applyBoxReport(db, runner, body.boxes, { now: now() })
    sweepStuckTasks(db, { now: now() })
    sendJson(res, 200, { ok: true, task: task ? { id: task.id, status: task.status } : null })
  })

  routes.add("POST", "/api/runner/pending", async (req, res) => {
    const { runner } = requireRunner(db, req)
    const body = await readJsonBody(req)
    const workspaceId = Number(body?.workspaceId)
    const workspace = Number.isInteger(workspaceId) ? db.prepare("SELECT * FROM sandbox_workspaces WHERE id = ?").get(workspaceId) : null
    if (!workspace) throw new HttpError("not_found", `工作区不存在：${String(body?.workspaceId)}`)
    if (workspace.runner_id !== null && workspace.runner_id !== runner.id) {
      throw new HttpError("invalid_request_error", `工作区不属于本 runner（绑定 runner = ${workspace.runner_id}）`)
    }
    let registered
    try {
      registered = markPending(db, { runnerId: runner.id, workspaceId, host: body?.host, now: now() })
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message)
    }
    sendJson(res, 200, registered)
  })

  routes.add("POST", "/api/runner/checkpoint", async (req, res) => {
    const { runner } = requireRunner(db, req)
    const query = new URL(req.url, "http://localhost").searchParams
    const workspaceId = Number(query.get("workspaceId"))
    const workspace = Number.isInteger(workspaceId) ? db.prepare("SELECT * FROM sandbox_workspaces WHERE id = ?").get(workspaceId) : null
    if (!workspace) throw new HttpError("invalid_request_error", `快照上送须携 workspaceId（query——工作区不存在：${String(query.get("workspaceId"))}）`)
    if (workspace.runner_id !== null && workspace.runner_id !== runner.id) {
      throw new HttpError("forbidden", `工作区不属于本 runner（绑定 runner = ${workspace.runner_id}）`)
    }
    // 未绑定（`runner_id = NULL`——删机解绑/换机窗口）不拦：换机取回面须可达（口径 = 批档 §5）
    const stamp = now()
    const note = typeof query.get("note") === "string" ? query.get("note").trim().slice(0, 200) : ""
    mkdirSync(checkpointRoot, { recursive: true })
    const blobPath = join(checkpointRoot, `ws${workspaceId}-${stamp}-${randomBytes(4).toString("hex")}.blob`)
    const partPath = `${blobPath}.part`
    const out = createWriteStream(partPath)
    let outError = null
    out.on("error", (e) => {
      outError = e // 早挂：写失败后听任（不炸进程——终判据 = 收口后一条）
      req.resume() // 写失败即放行余体（读体侧必收敛——不悬停在背压等待上）
    })
    let bytes = 0
    try {
      // 流式落盘（不整块缓冲——KD-SV-77）：逐块写盘；写缓冲满 ⇒ 暂停输入（背压），drain 后继续
      const result = await readStreamBody(req, {
        limit: maxCheckpointBytes,
        onChunk: (chunk) => {
          if (outError || out.destroyed) return // 写失败/流已毁 ⇒ 不再写、不再暂停（余体直接丢弃——读体侧必收敛）
          if (!out.write(chunk)) {
            req.pause()
            out.once("drain", () => req.resume())
          }
        },
      })
      bytes = result.bytes
      // 完整性核对（声明长 ≠ 实收 ∥ 报文未完整）⇒ 不入位（半截档不得成快照）
      const declared = Number(req.headers["content-length"])
      if (Number.isFinite(declared) && declared !== bytes) {
        throw new HttpError("invalid_request_error", `上送不完整（声明 ${declared} 字节，实收 ${bytes} 字节）`)
      }
      if (req.complete === false) throw new HttpError("invalid_request_error", `上送不完整（连接中断——实收 ${bytes} 字节）`)
      if (!out.closed) {
        await new Promise((resolveDone) => {
          // 收口：close（fd 已放）后定论——已 close（早发 error+close 形）则跳过等待
          out.once("close", resolveDone)
          out.end()
        })
      }
      if (outError) throw outError // 写失败（含写入错过早发 error+close 的形态）⇒ 不入位
      renameSync(partPath, blobPath) // 完整落盘后才入位（半截档 = `.part`——取回面看不见）
    } catch (e) {
      out.destroy()
      await new Promise((resolve) => (out.closed ? resolve() : out.once("close", resolve))) // fd 释放后再删（Windows 删开着的档会 EBUSY）
      try {
        rmSync(partPath, { force: true }) // 超限 ∥ 不完整 ∥ 写失败 ⇒ 不落盘（B27）；清理失败不反噬原错
      } catch {
        /* 清残档失败——原错优先 */
      }
      throw e instanceof HttpError ? e : new HttpError("internal_error", `快照落盘失败：${e.message}`)
    }
    const info = db
      .prepare("INSERT INTO sandbox_checkpoints (workspace_id, created_at, size, blob_path, note) VALUES (?, ?, ?, ?, ?)")
      .run(workspaceId, new Date(stamp).toISOString(), bytes, blobPath, note)
    const checkpointId = Number(info.lastInsertRowid)
    // 保留份数（§5：缺省每工作区最近 5 份——超出即删行 + 删档）
    const keep = getSettings(db).checkpointKeep
    const stale = db
      .prepare("SELECT id, blob_path FROM sandbox_checkpoints WHERE workspace_id = ? ORDER BY id DESC LIMIT -1 OFFSET ?")
      .all(workspaceId, keep)
    for (const row of stale) {
      db.prepare("DELETE FROM sandbox_checkpoints WHERE id = ?").run(row.id)
      try {
        rmSync(row.blob_path, { force: true })
      } catch {
        /* 删档失败——行已删（盘面残留不反噬） */
      }
    }
    recordAudit(db, {
      type: "sandbox_event",
      actor: `runner:${runner.name}`,
      target: workspace.name,
      detail: { kind: "checkpoint", workspaceId, checkpointId, size: bytes, keep, dropped: stale.length },
      ts: stamp,
    })
    log?.info("checkpoint_stored", { workspaceId, checkpointId, size: bytes, keep, dropped: stale.length })
    sendJson(res, 200, { checkpoint: { id: checkpointId, workspaceId, size: bytes, note, createdAt: new Date(stamp).toISOString(), keep, dropped: stale.length } })
  })

  routes.add("GET", "/api/runner/checkpoint/:id", (req, res, ctx) => {
    const { runner } = requireRunner(db, req)
    const row = db.prepare("SELECT * FROM sandbox_checkpoints WHERE id = ?").get(Number(ctx.params.id))
    if (!row) throw new HttpError("not_found", `快照不存在：${ctx.params.id}`)
    const workspace = db.prepare("SELECT * FROM sandbox_workspaces WHERE id = ?").get(row.workspace_id)
    if (workspace && workspace.runner_id !== null && workspace.runner_id !== runner.id) {
      throw new HttpError("forbidden", `快照不属于本 runner 的工作区（绑定 runner = ${workspace.runner_id}）`)
    }
    // 未绑定（`runner_id = NULL`——删机解绑/换机窗口）不拦：换机取回面须可达（口径 = 批档 §5）
    if (!existsSync(row.blob_path)) throw new HttpError("not_found", `快照已不在盘（blob 缺失）：${ctx.params.id}`)
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Length": row.size,
      "X-Checkpoint-Id": String(row.id),
      "X-Checkpoint-Workspace": String(row.workspace_id),
      "Cache-Control": "no-store",
    })
    createReadStream(row.blob_path).on("error", () => res.destroy()).pipe(res)
  })
}

/** 单次 poll 取数（领取 + 规则 + 裁定 + 排空旗）：空集判据 = 无指令 ∧ 规则未变 ∧ 无新裁定。 */
function collectPoll(db, runner, body, { publicBase = null, now = Date.now() } = {}) {
  sweepStuckTasks(db, { now })
  sweepPendingTimeouts(db, { now })
  const tasks = claimTasks(db, runner.id, { now })
  if (tasks.length > 0) tryPlacePending(db, { now, publicBase })
  const currentRev = getRulesRev()
  const runnerRev = Number.isFinite(Number(body?.rulesRev)) ? Number(body.rulesRev) : null
  const rulesChanged = runnerRev !== currentRev
  const delivered = deliveredResolutions.get(runner.id) ?? new Set()
  const resolutions = pendingResolutions(db, runner.id, { now }).filter((item) => !delivered.has(item.id))
  for (const item of resolutions) delivered.add(item.id)
  deliveredResolutions.set(runner.id, delivered)
  return {
    tasks,
    rulesRev: currentRev,
    ...(rulesChanged ? { rules: sortRules(listRules(db)) } : {}),
    pendingResolutions: resolutions,
    drain: runner.status === "draining" || runner.status === "drained",
  }
}

function isIdlePoll(payload) {
  return payload.tasks.length === 0 && payload.rules === undefined && payload.pendingResolutions.length === 0
}
