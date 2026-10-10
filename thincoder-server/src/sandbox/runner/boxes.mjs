/**
 * boxes.mjs — 盒生命周期与参数（sandbox/RUNNER.md §3；KD-SV-73 载体）：create（幂等——已存在则采纳）∥ start
 * （重建式——容器旗不可热改 ⇒ 停后重启 = 重建，新载荷生效）∥ stop（容器停；**卷留**）∥ destroy（删容器 + 删网络；
 * 卷删 = 仅控制面显式 `deleteVolume`）∥ 采纳（启动按 label 快照——盒不重启）∥ TTL 双计时（sweeper 30s）∥ exec。
 * 参数集 = §3 表逐项（read-only 根 ∥ 唯一卷 ∥ tmpfs 例外 ∥ cap-drop ∥ 非 root ∥ 每工作区网络 ∥ env 白名单）。
 * 全部运行时面经 `runtime` 适配器（批内件 = 假件替身；真机 = docker/podman 适配器——runtime.mjs）。
 */
import { chownSync, mkdirSync, rmSync } from "node:fs"
import { join, resolve } from "node:path"

import { cidrMatch } from "../rules.mjs"
import { gitDirty } from "./checkpoint.mjs"
import { applyQuota, releaseQuota, volumeInfo } from "./quota.mjs"
import { runCommand } from "./runtime.mjs"

/** 容器名/网络名（每工作区一套——§3「每工作区一个专用 bridge 网络（tc-ws-<id>）」）。 */
export function boxContainerName(workspaceId) {
  return `tc-ws-${workspaceId}`
}

/** 采纳面 TTL 缺省（runner 重启后载荷不可得——§3 缺省值；create 面零回落，缺键即抛）。 */
export const ADOPT_TTL_FALLBACK = Object.freeze({ idleMinutes: 30, wallclockHours: 24 })

/** 盒内基址归一：控制面 `OPENAI_BASE_URL` 的 host 为通配地址（0.0.0.0 ∥ ::）⇒ 以 runner `--server` 地址替换（实施注）。 */
export function normalizeOpenAiBase(base, serverUrl) {
  if (typeof base !== "string" || base.trim() === "") return base
  let parsed
  try {
    parsed = new URL(base)
  } catch {
    return base
  }
  if (parsed.hostname !== "0.0.0.0" && parsed.hostname !== "::") return base
  try {
    const server = new URL(serverUrl)
    parsed.hostname = server.hostname
    return parsed.toString()
  } catch {
    return base
  }
}

/** 盒 env（§3 表 env 行 + P8 白名单面）：HOME ∥ OPENAI_BASE_URL ∥ OPENAI_API_KEY ∥ HTTP(S)_PROXY ∥ NO_PROXY
 *  （服务器网关直连 = 生命线——不经闸）∥ TC_* 别名。**零服务器密钥**。 */
export function buildBoxEnv({ payload = {}, proxyUrl = null, serverUrl = null } = {}) {
  const env = {
    HOME: "/workspace/home",
    // 零回落（§3:43 同口径）：OPENAI_* 缺键/非法 ⇒ 拒（不得拼出字面量 `undefined` 注入盒）
    OPENAI_BASE_URL: requiredText(normalizeOpenAiBase(payload?.env?.OPENAI_BASE_URL, serverUrl), "env.OPENAI_BASE_URL"),
    OPENAI_API_KEY: requiredText(payload?.env?.OPENAI_API_KEY, "env.OPENAI_API_KEY"),
  }
  if (proxyUrl) {
    env.HTTP_PROXY = proxyUrl
    env.HTTPS_PROXY = proxyUrl
    env.http_proxy = proxyUrl
    env.https_proxy = proxyUrl
  }
  try {
    const server = new URL(serverUrl)
    const hostPort = server.port ? `${server.hostname}:${server.port}` : server.hostname
    env.NO_PROXY = `${hostPort},localhost,127.0.0.1`
    env.no_proxy = env.NO_PROXY
  } catch {
    /* server 地址不可解析 ⇒ 不设 NO_PROXY（内置允许仍在网络层） */
  }
  env.TC_WORKSPACE_ID = String(payload.workspaceId ?? "")
  env.TC_BASE_URL = env.OPENAI_BASE_URL
  if (proxyUrl) env.TC_GATE_PROXY = proxyUrl
  env.TC_SANDBOX = "1"
  return env
}

/** 盒参数指纹（start 判「重建 ∥ 直启」——载荷变 ⇒ 重建（容器旗不可热改）；未变且未曾起过 ⇒ 直启）。 */
export function specKeyOf(payload = {}) {
  return JSON.stringify({
    image: payload.image ?? null,
    tmpfsMb: Number(payload.tmpfsMb) || null,
    limits: payload.limits ?? {},
    network: payload.network ?? null,
    env: payload.env ?? {},
  })
}

/**
 * 载荷取值（§3:43「资源/TTL 相关旗值 = create 指令 payload（控制面已解析）；**runner 侧零回落逻辑**」）：
 * 缺键 ∥ 非正数 ⇒ 抛（= 控制面解析面缺陷 ⇒ 建盒拒 + 指令上报 failed——不静默回落、不掩蔽）。
 */
function requiredNumber(value, label) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) throw new Error(`create 载荷缺 ${label}（控制面应解析下发——runner 侧零回落）`)
  return num
}
function requiredText(value, label) {
  const text = typeof value === "string" ? value.trim() : ""
  if (text === "") throw new Error(`create 载荷缺 ${label}（控制面应解析下发——runner 侧零回落）`)
  return text
}

/**
 * 盒管理器。
 * 注入面：`runtime`（适配器——假件替身）∥ `exec`（git/quota 子面）∥ `now`（时钟）∥ `config`
 * （`workspaceRoot` ∥ `server` ∥ `proxyPort` ∥ `boxUid`/`boxGid` ∥ `quota`（探测结果）∥ `dockerfileDir`）
 * ∥ `checkpointBeforeStop`（停盒前 WIP 快照钩子——§6；缺省 no-op）。
 */
export function createBoxesManager({ runtime, config = {}, log = null, exec = runCommand, now = Date.now, checkpointBeforeStop = null } = {}) {
  if (!runtime) throw new Error("createBoxesManager：缺 runtime 适配器")
  const workspaceRoot = resolve(config.workspaceRoot ?? "./workspaces")
  const proxyPort = Number(config.proxyPort) > 0 ? Number(config.proxyPort) : 3128
  const boxUid = Number.isInteger(config.boxUid) ? config.boxUid : 1000
  const boxGid = Number.isInteger(config.boxGid) ? config.boxGid : 1000
  const boxes = new Map() // workspaceId → box 登记（容器 label 快照的内存镜像）

  const volumePath = (workspaceId) => join(workspaceRoot, String(workspaceId))

  function ensureVolume(workspaceId) {
    const path = volumePath(workspaceId)
    mkdirSync(path, { recursive: true })
    if (typeof process.getuid === "function" && process.getuid() === 0) {
      try {
        chownSync(path, boxUid, boxGid)
      } catch (e) {
        log?.warn("volume_chown_failed", { workspaceId, message: e.message })
      }
    }
    return path
  }

  function registryBox(record) {
    return {
      workspaceId: record.workspaceId,
      containerId: record.containerId,
      name: record.name,
      network: record.network,
      subnet: record.subnet ?? null,
      gateway: record.gateway ?? null,
      state: record.state === "running" ? "running" : "stopped",
      stopReason: record.stopReason ?? null,
      dirty: record.dirty === true,
      dirtyCheckedAt: record.dirtyCheckedAt ?? null,
      createdAt: record.createdAt ?? now(),
      lastActivityAt: record.lastActivityAt ?? now(),
      execActive: 0,
      limits: record.limits ?? {},
      image: record.image ?? null,
      checkpointEveryMinutes: Number(record.checkpointEveryMinutes) > 0 ? Number(record.checkpointEveryMinutes) : null,
      lastCheckpointAt: record.lastCheckpointAt ?? null,
      specKey: record.specKey ?? null,
      everStarted: record.everStarted === true,
    }
  }

  /** 采纳（启动时按 label 快照——盒不重启；网络缺 ⇒ 补建——幂等）。 */
  async function adopt(containers = null) {
    const list = containers ?? (await runtime.listBoxes())
    for (const item of list) {
      if (item.workspaceId === null) continue
      if (config.runnerId != null && item.runnerId !== null && item.runnerId !== Number(config.runnerId)) continue
      const network = `tc-ws-${item.workspaceId}`
      let net = await runtime.networkInspect(network)
      if (!net) {
        await runtime.networkCreate(network)
        net = await runtime.networkInspect(network)
      }
      // 墙钟基准 = 容器真实创建时刻（`inspect .Created`——runner 重启不顺延盒龄；读数不可得 ⇒ now() 回退，仅此一处）
      const createdMs = runtime.containerCreatedAt ? await runtime.containerCreatedAt(item.id).catch(() => null) : null
      boxes.set(item.workspaceId, registryBox({ workspaceId: item.workspaceId, containerId: item.id, name: item.name, network, subnet: net?.subnet ?? null, gateway: net?.gateway ?? null, state: item.state === "running" ? "running" : "stopped", createdAt: createdMs ?? now() }))
    }
    return boxes.size
  }

  async function ensureNetwork(network) {
    let net = await runtime.networkInspect(network)
    if (!net) {
      await runtime.networkCreate(network)
      net = await runtime.networkInspect(network)
    }
    return net ?? { subnet: null, gateway: null }
  }

  /** 建容器（参数集 = §3；`--user` 对齐卷属主；资源旗值 = 载荷（零回落——缺键即抛））。 */
  async function createContainer(workspaceId, payload, net) {
    const image = requiredText(payload.image, "image")
    await runtime.imageEnsure(image, { dockerfileDir: config.dockerfileDir ?? null })
    const proxyUrl = net.gateway ? `http://${net.gateway}:${proxyPort}` : null
    const limits = payload.limits ?? {}
    const res = await runtime.createBox({
      name: boxContainerName(workspaceId),
      image,
      containerLabels: { "tc.sandbox": "1", "tc.ws": String(workspaceId), "tc.runner": String(config.runnerId ?? "") },
      volumeSrc: volumePath(workspaceId),
      tmpfsMb: requiredNumber(payload.tmpfsMb, "tmpfsMb"),
      user: `${boxUid}:${boxGid}`,
      cpus: requiredNumber(limits.cpus, "limits.cpus"),
      memMb: requiredNumber(limits.memMb, "limits.memMb"),
      pids: requiredNumber(limits.pids, "limits.pids"),
      network: requiredText(payload.network, "network"),
      env: buildBoxEnv({ payload, proxyUrl, serverUrl: config.server }),
    })
    if (res.code !== 0) throw new Error(`盒创建失败（${(res.stderr ?? "").toString("utf8").trim() || `code=${res.code}`}）`)
    return res.stdout.toString("utf8").trim() || boxContainerName(workspaceId)
  }

  /** create（幂等——已存在则采纳；停态 ⇒ 重建（容器旗不可热改——新载荷生效））。 */
  async function create(payload = {}) {
    const workspaceId = Number(payload.workspaceId)
    if (!Number.isInteger(workspaceId)) throw new Error(`create 缺 workspaceId：${JSON.stringify(payload.workspaceId)}`)
    const network = requiredText(payload.network, "network")
    const diskMb = requiredNumber(payload.limits?.diskMb, "limits.diskMb")
    requiredNumber(payload.limits?.idleTtlMinutes, "limits.idleTtlMinutes") // TTL 旗值同守（缺 ⇒ 早抛——不静默取缺省）
    requiredNumber(payload.limits?.wallclockTtlHours, "limits.wallclockTtlHours")
    const net = await ensureNetwork(network)
    ensureVolume(workspaceId)
    const mounted = await volumeInfo(volumePath(workspaceId), { exec }).catch(() => null)
    if (config.quota?.mechanism && !(config.quota.mechanism === "loopback" && mounted?.mountPoint === volumePath(workspaceId))) {
      const quota = await applyQuota({
        mechanism: config.quota.mechanism, workspaceId, volumePath: volumePath(workspaceId), diskMb,
        fsType: config.quota.fsType ?? "ext4", mountPoint: config.quota.mountPoint ?? null, exec,
      })
      if (!quota.ok) throw new Error(`磁盘配额应用失败：${quota.reason}`)
    }
    const existing = boxes.get(workspaceId)
    if (existing?.state === "running") return existing // 幂等：在跑 ⇒ 采纳零触
    if (existing) await removeContainer(existing) // 停态 ⇒ 重建（新载荷生效）
    const containerId = await createContainer(workspaceId, payload, net)
    const box = registryBox({ workspaceId, containerId, name: boxContainerName(workspaceId), network, subnet: net.subnet, gateway: net.gateway, state: "stopped", limits: payload.limits ?? {}, image: payload.image ?? null, checkpointEveryMinutes: payload.checkpoint?.everyMinutes ?? null, specKey: specKeyOf(payload), createdAt: now() })
    boxes.set(workspaceId, box)
    log?.info("box_created", { workspaceId, containerId, network })
    return box
  }

  async function start(payload = {}) {
    const workspaceId = Number(payload.workspaceId)
    const key = specKeyOf(payload)
    let box = boxes.get(workspaceId)
    if (box?.state === "running" && box.specKey === key) return box // 幂等：同载荷在跑 ⇒ 零触
    if (!box || box.specKey !== key || box.everStarted === true) {
      // 缺 ∥ 载荷变（limits 等——§2「生效 = 下次建盒/重建」）∥ 曾起过（B39「下次使用重建」）⇒ 重建
      box = await create(payload)
    }
    if (box.state !== "running") {
      const res = await runtime.startBox(box.containerId)
      if (res.code !== 0) throw new Error(`盒启动失败（${(res.stderr ?? "").toString("utf8").trim() || `code=${res.code}`}）`)
      box.state = "running"
    }
    box.stopReason = null
    box.everStarted = true
    box.lastActivityAt = now()
    log?.info("box_started", { workspaceId })
    return box
  }

  async function removeContainer(box) {
    const res = await runtime.removeBox(box.containerId)
    if (res.code !== 0) log?.warn("box_remove_failed", { workspaceId: box.workspaceId, message: (res.stderr ?? "").toString("utf8").trim() })
    boxes.delete(box.workspaceId)
  }

  /** stop（容器停；卷留；拆前 WIP 快照——§6）。`reason` ∈ idle_ttl ∥ wallclock_ttl ∥ manual。 */
  async function stop(workspaceId, { reason = "manual", checkpoint = true } = {}) {
    const box = boxes.get(Number(workspaceId))
    if (!box) return { ok: false, reason: "box_missing" }
    if (checkpoint && checkpointBeforeStop) await checkpointBeforeStop(box.workspaceId, reason)
    if (box.state === "running") {
      const res = await runtime.stopBox(box.containerId)
      if (res.code !== 0) log?.warn("box_stop_failed", { workspaceId: box.workspaceId, message: (res.stderr ?? "").toString("utf8").trim() })
    }
    box.state = "stopped"
    box.stopReason = reason
    log?.info("box_stopped", { workspaceId: box.workspaceId, reason })
    return { ok: true, workspaceId: box.workspaceId, reason }
  }

  /** destroy（删容器 + 删网络；卷删 = 仅 `deleteVolume` —— 三层保护第一层）。 */
  async function destroy(workspaceId, { deleteVolume = false } = {}) {
    const id = Number(workspaceId)
    const box = boxes.get(id)
    if (box) {
      await removeContainer(box)
    }
    await runtime.networkRemove(box?.network ?? `tc-ws-${id}`)
    if (deleteVolume) {
      if (config.quota?.mechanism) {
        await releaseQuota({ mechanism: config.quota.mechanism, workspaceId: id, volumePath: volumePath(id), mountPoint: config.quota.mountPoint ?? null, exec })
      }
      rmSync(volumePath(id), { recursive: true, force: true })
      rmSync(`${volumePath(id)}.img`, { force: true })
    }
    log?.info("box_destroyed", { workspaceId: id, deleteVolume })
    return { ok: true, deleteVolume }
  }

  /** exec（非 root——create 期 `--user` 落形；超时/截断上限缺省 10 分钟 ∥ 1 MiB/流）。 */
  async function exec_(workspaceId, payload = {}) {
    const box = boxes.get(Number(workspaceId))
    if (!box) throw new Error(`盒不存在：${workspaceId}`)
    if (box.state !== "running") throw new Error(`盒未在跑：${workspaceId}（state = ${box.state}）`)
    box.execActive += 1
    box.lastActivityAt = now()
    const started = now()
    try {
      const res = await runtime.execBox(box.containerId, {
        command: payload.command ?? ["true"],
        cwd: payload.cwd ?? null,
        env: payload.env ?? null,
        timeoutMs: Number(payload.timeoutMs) > 0 ? Number(payload.timeoutMs) : Number(config.execTimeoutMs) > 0 ? Number(config.execTimeoutMs) : 600000,
        maxBytes: Number(payload.maxOutputBytes) > 0 ? Number(payload.maxOutputBytes) : 1024 * 1024,
      })
      return {
        exitCode: res.exitCode,
        stdout: (res.stdout ?? Buffer.alloc(0)).toString("utf8"),
        stderr: (res.stderr ?? Buffer.alloc(0)).toString("utf8"),
        truncated: res.truncated === true,
        timedOut: res.timedOut === true,
        durationMs: now() - started,
      }
    } finally {
      box.execActive -= 1
      box.lastActivityAt = now()
      await isDirty(box.workspaceId, { refresh: true }).catch(() => {})
    }
  }

  /** 活跃触达（代理流量——空闲 TTL 判据之二）。 */
  function touch(workspaceId) {
    const box = boxes.get(Number(workspaceId))
    if (box) box.lastActivityAt = now()
  }

  /** dirty 读数（git 未提交/未跟踪——带 TTL 缓存；心跳盒报告消费）。 */
  async function isDirty(workspaceId, { refresh = false } = {}) {
    const box = boxes.get(Number(workspaceId))
    if (!box) return false
    const ttl = Number(config.dirtyCacheMs) > 0 ? Number(config.dirtyCacheMs) : 30000
    if (refresh || box.dirtyCheckedAt === null || now() - box.dirtyCheckedAt > ttl) {
      box.dirty = await gitDirty(volumePath(workspaceId), { exec })
      box.dirtyCheckedAt = now()
    }
    return box.dirty
  }

  /** TTL sweeper（30s 周期——空闲超时 ∥ 墙钟 TTL；到点停盒（拆前快照））。 */
  async function sweep() {
    const actions = []
    for (const box of boxes.values()) {
      if (box.state !== "running" || box.execActive > 0) continue
      // 采纳面（runner 重启）载荷不可得 ⇒ 本档缺省；create 面零回落（缺键在 create 已抛）
      const idleMinutes = Number(box.limits?.idleTtlMinutes) > 0 ? Number(box.limits.idleTtlMinutes) : ADOPT_TTL_FALLBACK.idleMinutes
      const wallclockHours = Number(box.limits?.wallclockTtlHours) > 0 ? Number(box.limits.wallclockTtlHours) : ADOPT_TTL_FALLBACK.wallclockHours
      if (now() - box.createdAt >= wallclockHours * 3600 * 1000) {
        await stop(box.workspaceId, { reason: "wallclock_ttl" })
        actions.push({ workspaceId: box.workspaceId, reason: "wallclock_ttl" })
      } else if (now() - box.lastActivityAt >= idleMinutes * 60 * 1000) {
        await stop(box.workspaceId, { reason: "idle_ttl" })
        actions.push({ workspaceId: box.workspaceId, reason: "idle_ttl" })
      }
    }
    return actions
  }

  /** 心跳盒清单（控制面 `normalizeBoxes` 形）。 */
  async function boxReport() {
    const out = []
    for (const box of boxes.values()) {
      out.push({ workspaceId: box.workspaceId, state: box.state, stopReason: box.stopReason, dirty: await isDirty(box.workspaceId) })
    }
    return out
  }

  /** 盒源 IP 归属（代理层准入——子网 → 工作区；匹配单源 = `rules.mjs` 的 `cidrMatch`）。 */
  function workspaceByIp(ip) {
    for (const box of boxes.values()) {
      if (!box.subnet) continue
      if (cidrMatch(box.subnet, ip)) return box.workspaceId
    }
    return null
  }

  return {
    workspaceRoot, volumePath, boxes,
    adopt, create, start, stop, destroy, exec: exec_, touch, isDirty, sweep, boxReport, workspaceByIp,
    get: (workspaceId) => boxes.get(Number(workspaceId)) ?? null,
    list: () => [...boxes.values()],
  }
}
