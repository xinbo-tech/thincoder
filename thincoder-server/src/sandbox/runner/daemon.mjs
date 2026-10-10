/**
 * daemon.mjs — runner 守护进程（sandbox/RUNNER.md §2；KD-SV-64 载体）：装配（运行时探测 ∥ 盒采纳 ∥ 出站闸代理 ∥
 * 链路自检）⇒ 主循环（心跳 15s ∥ 长轮询 ≤25s 领指令 ⇒ 执行 ⇒ 上报）∥ 指令分派（`sandbox.*`——未知 kind ⇒ `unsupported`）
 * ∥ TTL sweeper（30s）∥ WIP 检查点触发（周期 ∥ 拆盒前 ∥ 排空前）∥ 离线行为（server 不可达 ⇒ 盒照跑（沿最后规则）；
 * 待批一律超时拒；上报有界缓冲——超界丢最旧 + 日志；复通 ⇒ 重放）。
 * 链路自检（doctor 核心项）失败 ⇒ **拒跑**（进程退出 + 原因——E32）；读数随心跳上报（控制台可见）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

import { createRunnerClient, HEARTBEAT_INTERVAL_MS, nextBackoffMs } from "./client.mjs"
import { createBoxesManager } from "./boxes.mjs"
import { createEgressProxy } from "./egress.mjs"
import { packCheckpoint, restoreCheckpoint } from "./checkpoint.mjs"
import { applyNetfilter, detectNetfilter, selfCheck, serverAllowEntries } from "./netfilter.mjs"
import { detectQuota } from "./quota.mjs"
import { detectRuntime, diskFreeMb, doctorChecks, makeRuntimeAdapter, runCommand } from "./runtime.mjs"

export const SWEEPER_INTERVAL_MS = 30000
export const CHECKPOINT_CHECK_INTERVAL_MS = 60000
export const OUTBOX_LIMIT = 100

/** 有界上报缓冲（离线：超界丢最旧 + 日志——§2）。 */
export function createOutbox({ limit = OUTBOX_LIMIT, log = null } = {}) {
  const items = []
  return {
    push: (payload) => {
      items.push(payload)
      while (items.length > limit) {
        items.shift()
        log?.warn("outbox_overflow", { limit })
      }
    },
    size: () => items.length,
    /** 重放（复通面）：逐条送出；途中失败 ⇒ 剩余留队。 */
    flush: async (send) => {
      while (items.length > 0) {
        try {
          await send(items[0])
          items.shift()
        } catch {
          return false
        }
      }
      return true
    },
    peek: () => [...items],
  }
}

/** 链路自检读数装配（doctor 八项 + 运行时探测——心跳 `runtime` 块；`deps` 注入口径）。 */
export async function collectReadings({ config = {}, exec = runCommand, runtime = null, netfilter = null, quota = null } = {}) {
  const detected = runtime ?? (await detectRuntime({ exec, prefer: config.runtime ?? null }))
  const nf = netfilter ?? (await detectNetfilter({ exec }))
  const detectedRuntime = detected?.engine ? makeRuntimeAdapter({ engine: detected.engine, exec }) : null
  const qt = quota ?? (await detectQuota({ exec, workspaceRoot: config.workspaceRoot ?? "." }))
  const doctor = await doctorChecks({
    exec,
    config: { ...config, image: config.image ?? "thincoder-sandbox:1" },
    runtime: detectedRuntime ? { engine: detected.engine, version: detected.version, ok: detected.ok } : null,
    netfilter: nf,
    quota: qt,
  })
  return {
    engine: detected?.engine ?? null,
    version: detected?.version ?? null,
    runtimeAdapter: detectedRuntime,
    netfilter: nf,
    quota: qt,
    ok: doctor.ok,
    diskFreeMb: await diskFreeMb(config.workspaceRoot ?? "."),
    items: doctor.items,
    block: {
      engine: detected?.engine ?? null,
      version: detected?.version ?? null,
      checks: Object.fromEntries(doctor.items.map((item) => [item.name, { level: item.level, pass: item.pass, detail: item.detail }])),
      ok: doctor.ok,
    },
  }
}

/**
 * 建守护（`deps` 注入口径 = 批内件替身）：`exec` ∥ `now` ∥ `client` ∥ `runtime`（适配器）∥ `egress` ∥ `readings`
 * （跳过自检——替身）∥ `sleep` ∥ `heartbeatIntervalMs`/`sweeperIntervalMs`/`checkpointCheckIntervalMs`。
 */
export function createDaemon({ config = {}, log = null, deps = {} } = {}) {
  const now = deps.now ?? Date.now
  const exec = deps.exec ?? runCommand
  const sleep = deps.sleep ?? ((ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms)))
  const heartbeatIntervalMs = deps.heartbeatIntervalMs ?? HEARTBEAT_INTERVAL_MS
  const sweeperIntervalMs = deps.sweeperIntervalMs ?? SWEEPER_INTERVAL_MS
  const checkpointCheckIntervalMs = deps.checkpointCheckIntervalMs ?? CHECKPOINT_CHECK_INTERVAL_MS
  const stateDir = resolve(config.stateDir ?? "./runner-state")
  const workspaceRoot = resolve(config.workspaceRoot ?? "./workspaces")
  const proxyPort = Number(config.proxyPort) > 0 ? Number(config.proxyPort) : 3128
  const outbox = deps.outbox ?? createOutbox({ log })
  let runtime = deps.runtime ?? null
  const client = deps.client ?? createRunnerClient({ server: config.server, token: config.token, fetchImpl: deps.fetchImpl })
  let readings = deps.readings ?? null
  let egress = deps.egress ?? null
  let boxes = null
  const timers = []
  let running = false
  let drainMode = false
  let rulesRev = 0
  let rules = []
  let hasRules = false
  let loopPromise = null
  const stats = { tasksDone: 0, tasksFailed: 0, tasksUnsupported: 0, checkpoints: 0, checkpointSkips: 0, netfilterApplies: 0, netfilterSelfCheckFailed: 0 }

  // ── 本地状态（`<stateDir>`）：规则缓存（离线沿最后规则——§2）──────────────────
  function loadRulesCache() {
    try {
      const raw = JSON.parse(readFileSync(join(stateDir, "rules.json"), "utf8"))
      rules = Array.isArray(raw?.rules) ? raw.rules : []
      rulesRev = Number.isFinite(Number(raw?.rulesRev)) ? Number(raw.rulesRev) : 0
      hasRules = raw?.hasRules === true
    } catch {
      rules = []
      rulesRev = 0
      hasRules = false
    }
  }

  function saveRulesCache() {
    try {
      mkdirSync(stateDir, { recursive: true })
      writeFileSync(join(stateDir, "rules.json"), JSON.stringify({ rulesRev, rules, hasRules, savedAt: new Date(now()).toISOString() }))
    } catch (e) {
      log?.warn("rules_cache_write_failed", { message: e.message })
    }
  }

  // ── 网络层（CIDR ⇒ 链全量重算——规则/盒集合变更点）────────────────────────────
  async function recomputeNetfilter() {
    if (!readings?.netfilter?.tool || !boxes) return { ok: false, detail: "网络工具不可用" }
    const serverAllow = await serverAllowEntries(config.server ?? "")
    const workspaces = boxes
      .list()
      .filter((box) => box.subnet)
      .map((box) => ({ id: box.workspaceId, subnet: box.subnet, gateway: box.gateway, rules }))
    const result = await applyNetfilter({ exec, tool: readings.netfilter.tool, workspaces, proxyPort, serverAllow })
    stats.netfilterApplies += 1
    log?.[result.ok ? "info" : "warn"]("netfilter_applied", { ok: result.ok, detail: result.detail })
    if (result.ok) {
      // §4.1「自检：`nft list ruleset` 可达 ∥ 链计数在场」——应用即验（免静默失败）
      const check = await selfCheck({ exec, tool: readings.netfilter.tool }).catch(() => ({ ok: false, detail: "自检异常", chains: 0 }))
      if (!check.ok) {
        stats.netfilterSelfCheckFailed += 1
        log?.error("netfilter_selfcheck_failed", { tool: readings.netfilter.tool, chains: check.chains ?? 0, detail: check.detail ?? "" })
      }
    }
    return result
  }

  // ── WIP 检查点（§6）────────────────────────────────────────────────────────
  async function checkpointOnce(workspaceId, { note = "periodic" } = {}) {
    const dir = boxes.volumePath(workspaceId)
    const pack = await packCheckpoint(dir, { exec, maxBytes: Number(config.checkpointMaxBytes) > 0 ? Number(config.checkpointMaxBytes) : undefined })
    if (pack.skipped) {
      stats.checkpointSkips += 1
      // 跳过上报口径：任务面 = result 携 reason；周期面 = runner 日志 + 盒 dirty 读数（控制面按 dirty ∧ 零新快照呈现「无保护」）
      return { skipped: true, reason: pack.reason, size: pack.size ?? null }
    }
    const uploaded = await client.uploadCheckpoint({ workspaceId, note, bytes: pack.bytes })
    const box = boxes.get(workspaceId)
    if (box) box.lastCheckpointAt = now()
    stats.checkpoints += 1
    log?.info("checkpoint_uploaded", { workspaceId, size: pack.size, note, checkpointId: uploaded?.checkpoint?.id ?? null })
    return { skipped: false, size: pack.size, checkpointId: uploaded?.checkpoint?.id ?? null, keep: uploaded?.checkpoint?.keep ?? null, dropped: uploaded?.checkpoint?.dropped ?? null }
  }

  /** 周期触发（缺省 15 分钟——dirty 才发；`checkpoint.everyMinutes` = create 载荷）。 */
  async function checkpointCycle() {
    for (const box of boxes.list()) {
      if (box.state !== "running") continue
      const everyMinutes = Number(box.checkpointEveryMinutes) > 0 ? Number(box.checkpointEveryMinutes) : 15
      if (now() - (box.lastCheckpointAt ?? box.createdAt) < everyMinutes * 60 * 1000) continue
      if (!(await boxes.isDirty(box.workspaceId, { refresh: true }))) continue
      try {
        await checkpointOnce(box.workspaceId, { note: "periodic" })
      } catch (e) {
        log?.warn("checkpoint_failed", { workspaceId: box.workspaceId, message: e.message })
      }
    }
  }

  async function restoreOnce(workspaceId, checkpointId) {
    const fetched = await client.fetchCheckpoint(checkpointId)
    const result = await restoreCheckpoint(boxes.volumePath(workspaceId), fetched.bytes, { exec })
    log?.info("checkpoint_restored", { workspaceId, checkpointId, files: result.restoredFiles })
    return result
  }

  // ── 指令分派（§2：按 kind；未知 ⇒ unsupported——向前兼容）───────────────────
  async function executeTask(task) {
    const workspaceId = task.workspaceId !== null && task.workspaceId !== undefined ? Number(task.workspaceId) : null
    // 投递形：`{ id, kind, workspaceId, payload }`（payload = 载荷减去 workspaceId——registry.claimTasks）⇒ 回补
    const payload = { ...(task.payload ?? {}), ...(workspaceId !== null ? { workspaceId } : {}) }
    switch (task.kind) {
      case "sandbox.create": {
        const box = await boxes.create(payload)
        await recomputeNetfilter() // 新盒网段入链（不重算 ⇒ 该盒出站不经沙箱表——§4.1）
        return { status: "done", result: summarizeBox(box) }
      }
      case "sandbox.start": {
        const box = await boxes.start(payload)
        await recomputeNetfilter() // 重建面（容器换 ⇒ 网段可能新分配）
        return { status: "done", result: summarizeBox(box) }
      }
      case "sandbox.stop": {
        const stopped = await boxes.stop(workspaceId, { reason: "manual" })
        return { status: stopped.ok ? "done" : "failed", result: stopped }
      }
      case "sandbox.destroy": {
        const result = await boxes.destroy(workspaceId, { deleteVolume: payload.deleteVolume === true })
        await recomputeNetfilter() // 网段退场（链/跳转行随之清）
        return { status: "done", result }
      }
      case "sandbox.exec":
        return { status: "done", result: await boxes.exec(workspaceId, payload) }
      case "sandbox.checkpoint":
        return { status: "done", result: await checkpointOnce(workspaceId, { note: payload.note ?? "task" }) }
      case "sandbox.restore":
        return { status: "done", result: await restoreOnce(workspaceId, payload.checkpointId) }
      default:
        return { status: "unsupported", result: { reason: `未知指令 kind：${task.kind}` } }
    }
  }

  async function reportTask(task, outcome) {
    const payload = { taskId: task.id, status: outcome.status, result: outcome.result ?? null, boxes: await boxes.boxReport() }
    try {
      await client.report(payload)
    } catch (e) {
      outbox.push(payload)
      log?.warn("report_buffered", { taskId: task.id, message: e.message })
    }
    if (outcome.status === "done") stats.tasksDone += 1
    else if (outcome.status === "failed") stats.tasksFailed += 1
    else stats.tasksUnsupported += 1
  }

  function summarizeBox(box) {
    return { workspaceId: box.workspaceId, state: box.state, stopReason: box.stopReason, network: box.network }
  }

  // ── 心跳（15s——版本 ∥ 自检读数 ∥ 盒清单/状态 ∥ 磁盘余量 ∥ 排空旗）────────────
  async function heartbeatOnce() {
    const boxList = await boxes.boxReport()
    const payload = {
      version: config.version ?? null,
      runtime: readings?.block ?? null,
      runtimeAvailable: readings?.ok === true,
      diskFreeMb: readings?.diskFreeMb ?? null,
      boxes: boxList,
      drain: drainMode && boxList.every((box) => box.state !== "running"),
    }
    try {
      await client.heartbeat(payload)
      return true
    } catch (e) {
      log?.warn("heartbeat_failed", { message: e.message })
      return false
    }
  }

  // ── 排空（收旗 ⇒ 停盒（拆前快照）⇒ 心跳携 drain ⇒ drained）──────────────────
  async function handleDrain() {
    if (drainMode) return
    drainMode = true
    log?.info("drain_received", { boxes: boxes.list().length })
    for (const box of boxes.list()) {
      if (box.state !== "running") continue
      try {
        await boxes.stop(box.workspaceId, { reason: "manual" })
      } catch (e) {
        log?.warn("drain_stop_failed", { workspaceId: box.workspaceId, message: e.message })
      }
    }
    await heartbeatOnce() // 携 drain: true ⇒ 控制面置 drained
  }

  // ── poll 结果落地：规则（下发即生效——不重建盒）∥ 待批裁定 ∥ 指令 ∥ 排空旗 ────
  async function applyPoll(result = {}) {
    if (Array.isArray(result.rules)) {
      rules = result.rules
      rulesRev = Number.isFinite(Number(result.rulesRev)) ? Number(result.rulesRev) : rulesRev
      hasRules = true
      saveRulesCache()
      egress?.updateRules(rules) // 域名面热换（不重建盒——P11）
      await recomputeNetfilter() // CIDR 面链全量重算
    }
    for (const resolution of result.pendingResolutions ?? []) egress?.resolvePending(resolution)
    for (const task of result.tasks ?? []) {
      const outcome = await executeTask(task).catch((e) => ({ status: "failed", result: { reason: e.message } }))
      await reportTask(task, outcome)
    }
    if (result.drain === true) await handleDrain()
  }

  // ── 主循环（长轮询 ≤25s；断连退避 1s→30s 指数 + 抖动——§2）──────────────────
  async function pollLoop() {
    let backoff = 0
    while (running) {
      try {
        await outbox.flush((payload) => client.report(payload))
        const result = await client.poll(hasRules ? { rulesRev } : {})
        backoff = 0
        await applyPoll(result)
      } catch (e) {
        backoff = nextBackoffMs(backoff, { random: deps.random ?? Math.random })
        log?.warn("poll_failed", { message: e.message, backoff })
        await sleep(backoff)
      }
    }
  }

  /** 启动：自检（核心项任一 FAIL ⇒ 拒跑——E32）⇒ 盒采纳 ⇒ 代理/网络/定时器 ⇒ 心跳 + poll。 */
  async function start() {
    if (running) return daemon
    if (!readings) readings = await collectReadings({ config, exec, ...(deps.readingsInput ?? {}) })
    if (!runtime) runtime = readings.runtimeAdapter ?? null
    if (!runtime) throw new Error("daemon.start：缺 runtime 适配器（未探测到 docker ∥ podman——拒跑）")
    if (!readings.ok) {
      const failed = readings.items.filter((item) => item.level === "core" && !item.pass).map((item) => `#${item.no} ${item.name}：${item.detail}`)
      const message = `链路自检核心项失败——拒跑：${failed.join(" ∥ ")}`
      log?.error("doctor_refused", { failed })
      throw new Error(message)
    }
    readings.diskFreeMb = readings.diskFreeMb ?? null
    boxes = deps.boxes ?? createBoxesManager({
      runtime, config: { ...config, runnerId: config.runnerId, quota: readings.quota }, log, exec, now,
      checkpointBeforeStop: (workspaceId) => checkpointOnce(workspaceId, { note: "before_stop" }).catch((e) => { log?.warn("checkpoint_before_stop_failed", { workspaceId, message: e.message }) }),
    })
    loadRulesCache()
    await boxes.adopt()
    if (!egress) {
      egress = createEgressProxy({
        proxyPort,
        rules,
        log,
        now,
        resolveWorkspace: (ip) => boxes.workspaceByIp(ip),
        registerPending: (workspaceId, host) => client.pending({ workspaceId, host }),
        onActivity: (workspaceId) => boxes.touch(workspaceId),
        pendingTimeoutSeconds: Number(deps.pendingTimeoutSeconds) > 0 ? Number(deps.pendingTimeoutSeconds) : 60,
      })
      await egress.listen()
    } else {
      egress.updateRules(rules)
    }
    running = true
    await recomputeNetfilter()
    await heartbeatOnce()
    timers.push(setInterval(() => { heartbeatOnce().catch(() => {}) }, heartbeatIntervalMs))
    timers.push(setInterval(() => { boxes.sweep().catch((e) => log?.warn("sweep_failed", { message: e.message })) }, sweeperIntervalMs))
    timers.push(setInterval(() => { checkpointCycle().catch((e) => log?.warn("checkpoint_cycle_failed", { message: e.message })) }, checkpointCheckIntervalMs))
    for (const timer of timers) timer.unref?.()
    loopPromise = pollLoop()
    log?.info("runner_started", { server: config.server, engine: readings.engine, boxes: boxes.list().length, rulesRev })
    return daemon
  }

  const daemon = {
    stats,
    boxes: () => boxes,
    egress: () => egress,
    readings: () => readings,
    rulesState: () => ({ rulesRev, rules }),
    outbox,
    start,
    /** 停机：清定时器 + 关代理（**盒不重启**——容器照跑，重启后按 label 采纳）。 */
    async stop() {
      running = false
      for (const timer of timers.splice(0)) clearInterval(timer)
      if (egress && deps.egress === undefined) await egress.close().catch(() => {})
      if (loopPromise) await loopPromise.catch(() => {})
      log?.info("runner_stopped", { tasks: stats.tasksDone })
    },
    /** 测试/诊断：跑一轮 poll 落地面。 */
    tick: async () => {
      const result = await client.poll({ rulesRev })
      await applyPoll(result)
      return result
    },
  }
  return daemon
}

/**
 * 装配入口（bin `run` 用）：探测 ⇒ 守护 ⇒ 起。核心项失败 ⇒ 抛（进程非零退出 + 原因——E32）。
 */
export async function startDaemon({ config = {}, log = null, deps = {} } = {}) {
  const exec = deps.exec ?? runCommand
  const client = deps.client ?? createRunnerClient({ server: config.server, token: config.token, fetchImpl: deps.fetchImpl ?? fetch })
  const readings = deps.readings ?? (await collectReadings({ config, exec }))
  const runtime = deps.runtime ?? readings.runtimeAdapter
  if (!runtime) throw new Error("未探测到容器运行时（docker ∥ podman）——拒跑")
  const daemon = createDaemon({ config, log, deps: { ...deps, readings, runtime, client } })
  await daemon.start()
  return daemon
}

/** 状态目录缺省判据（诊断面——`--config` 同目录）。 */
export function defaultStateDir(configPath) {
  try {
    const dir = resolve(configPath, "..")
    return existsSync(dir) ? join(dir, "runner-state") : "./runner-state"
  } catch {
    return "./runner-state"
  }
}
