/**
 * runtime.mjs — 容器运行时适配与宿主自检（sandbox/RUNNER.md §3/§7；KD-SV-73 载体）：
 * ① 执行助手 `runCommand`（node:child_process——stdin 可送 Buffer ∥ stdout/stderr 收 Buffer——二进制面；**全链可注入**，
 *   批内件以假件替身跑——真机不可用）；
 * ② 运行时探测（探测序 docker ⇒ podman——已裁 U1；版本门 docker ≥ 20 ∥ podman ≥ 4）；
 * ③ 适配器 `makeRuntimeAdapter`（盒生命周期 CLI 薄封装——boxes/netfilter/quota 共用；`buildCreateArgs` 为纯函数，
 *   盒参数集 = RUNNER §3 表逐项）；
 * ④ doctor 八项（§7——核心项任一 FAIL ⇒ 拒跑；读数随心跳上报 `runtime_json`）。
 */
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { statfs } from "node:fs/promises"
import { hostname } from "node:os"

/** 默认命令执行（注入面 = 批内件假件替身）：stdin 可送 Buffer；stdout/stderr 收 Buffer（二进制面——pack-objects）。
 *  返回 `{ code, stdout, stderr, timedOut, truncated }`（spawn 失败 ⇒ `code = null` + 错误文本入 stderr）。 */
export function runCommand(command, args = [], { cwd = null, input = null, timeoutMs = 120000, maxBytes = 8 * 1024 * 1024, env = null } = {}) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(command, args, { cwd: cwd ?? undefined, env: env ?? undefined, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] })
    } catch (e) {
      resolve({ code: null, stdout: Buffer.alloc(0), stderr: Buffer.from(String(e.message)), timedOut: false, truncated: false })
      return
    }
    const outChunks = []
    const errChunks = []
    let outLen = 0
    let errLen = 0
    let truncated = false
    let timedOut = false
    let settled = false
    const timer = timeoutMs > 0 ? setTimeout(() => { timedOut = true; child.kill("SIGKILL") }, timeoutMs) : null
    const finish = (code) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve({ code, stdout: Buffer.concat(outChunks), stderr: Buffer.concat(errChunks), timedOut, truncated })
    }
    const collect = (chunks, chunk, len) => {
      if (len >= maxBytes) { truncated = true; return len }
      const room = maxBytes - len
      const part = chunk.length > room ? chunk.subarray(0, room) : chunk
      chunks.push(part)
      if (chunk.length > room) truncated = true
      return len + part.length
    }
    child.stdout.on("data", (chunk) => { outLen = collect(outChunks, chunk, outLen) })
    child.stderr.on("data", (chunk) => { errLen = collect(errChunks, chunk, errLen) })
    child.stdin.on("error", () => { /* 子进程早退 ⇒ EPIPE——原结果优先 */ })
    child.on("error", (e) => { errChunks.push(Buffer.from(String(e.message))); finish(null) })
    child.on("close", (code) => finish(code))
    if (input !== null && input !== undefined) child.stdin.end(input)
    else child.stdin.end()
  })
}

/** 结果文本形（stdout 解码 + trim）。 */
export function textOf(result) {
  return result?.stdout ? result.stdout.toString("utf8").trim() : ""
}

/** 版本号解析：`Docker version 24.0.7, build …` ∥ `podman version 4.9.3` ⇒ `[主, 次]`（缺 ⇒ `[null, null]`）。 */
export function parseVersion(text) {
  const match = /(\d+)\.(\d+)/.exec(String(text ?? ""))
  return match ? [Number(match[1]), Number(match[2])] : [null, null]
}

/** 探测序与版本门（已裁 U1 ∥ §7 第 2 项）。 */
export const RUNTIME_CANDIDATES = Object.freeze(["docker", "podman"])
export const RUNTIME_MIN_MAJOR = Object.freeze({ docker: 20, podman: 4 })

/** 运行时探测：依序试 `--version`；首个「可执行 ∧ 版本达标」者胜；否则返首个可执行者（`ok: false`——诊断面）；全无 ⇒ null。 */
export async function detectRuntime({ exec = runCommand, prefer = null } = {}) {
  const order = prefer && RUNTIME_CANDIDATES.includes(prefer) ? [prefer] : RUNTIME_CANDIDATES
  let firstFound = null
  for (const engine of order) {
    const res = await exec(engine, ["--version"], { timeoutMs: 15000 })
    if (res.code !== 0) continue
    const version = textOf(res)
    const [major] = parseVersion(version)
    const found = { engine, version, ok: major !== null && major >= RUNTIME_MIN_MAJOR[engine] }
    if (found.ok) return found
    if (firstFound === null) firstFound = found
  }
  return firstFound
}

/** 盒创建参数（RUNNER §3 表逐项——纯函数，批内件直断）。 */
export function buildCreateArgs(spec) {
  const { engine = "docker", name, image, containerLabels = {}, volumeSrc, tmpfsMb, user, cpus, memMb, pids, network, env = {}, workdir = "/workspace", command = ["sleep", "infinity"] } = spec
  const args = [
    "create", "--name", name,
    "--read-only",
    "--mount", `type=bind,src=${volumeSrc},dst=/workspace`,
    "--tmpfs", `/tmp:rw,size=${tmpfsMb}m`,
    "--user", user,
    "--cap-drop=ALL",
    "--security-opt", "no-new-privileges",
    "--cpus", String(cpus),
    "--memory", `${memMb}m`,
    "--memory-swap", `${memMb}m`,
    "--pids-limit", String(pids),
    "--network", network,
    "--workdir", workdir,
  ]
  for (const [key, value] of Object.entries(containerLabels)) args.push("--label", `${key}=${value}`)
  for (const [key, value] of Object.entries(env)) args.push("-e", `${key}=${value}`)
  args.push(image, ...command)
  if (engine === "podman") {
    // podman 兼容面：--security-opt 值同形；create 语义一致——零额外旗（置此分支留痕：探测序 compat 点）
  }
  return args
}

/**
 * 运行时适配器（盒生命周期 CLI 薄封装）。批内件 = 假件替身（同接口——零 CLI）。
 * 方法：listBoxes ∥ createBox ∥ startBox ∥ stopBox ∥ removeBox ∥ execBox ∥ networkCreate ∥ networkRemove ∥
 * networkInspect ∥ containerIp ∥ containerCreatedAt ∥ imagePresent ∥ imageEnsure ∥ version。
 */
export function makeRuntimeAdapter({ engine, exec = runCommand, timeoutMs = 120000 } = {}) {
  if (!engine) throw new Error("makeRuntimeAdapter：缺 engine（docker ∥ podman）")
  const call = (args, opts = {}) => exec(engine, args, { timeoutMs, ...opts })
  const LIST_FORMAT = "{{.ID}}\t{{.Names}}\t{{.State}}\t{{.Labels}}"
  const imagePresent = async (image) => (await call(["image", "inspect", image])).code === 0

  return {
    engine,
    /** `ps -a` 按 label 筛（盒登记 = 容器 label 快照——§2）。 */
    async listBoxes() {
      const res = await call(["ps", "-a", "--filter", "label=tc.sandbox=1", "--format", LIST_FORMAT])
      if (res.code !== 0) return []
      const out = []
      for (const line of textOf(res).split("\n")) {
        if (line.trim() === "") continue
        const [id, name, state, labels = ""] = line.split("\t")
        const map = Object.fromEntries(labels.split(",").map((pair) => pair.split("=")).filter((pair) => pair.length === 2))
        out.push({ id, name, state, workspaceId: Number(map["tc.ws"]) || null, runnerId: Number(map["tc.runner"]) || null, labels: map })
      }
      return out
    },
    createBox: (spec) => call(buildCreateArgs({ engine, ...spec })),
    startBox: (id) => call(["start", id]),
    stopBox: (id, { timeSeconds = 10 } = {}) => call(["stop", "--time", String(timeSeconds), id]),
    removeBox: (id, { force = true } = {}) => call(["rm", ...(force ? ["--force"] : []), id]),
    /** 盒内执行（非 root——`--user` 已在 create 落形；超时/截断由调用方定值）。 */
    execBox: async (id, { command, cwd = null, env = null, timeoutMs: execTimeout = 600000, maxBytes = 1024 * 1024 } = {}) => {
      const args = ["exec"]
      if (cwd) args.push("-w", cwd)
      for (const [key, value] of Object.entries(env ?? {})) args.push("-e", `${key}=${value}`)
      args.push(id, ...(Array.isArray(command) ? command : ["sh", "-lc", String(command)]))
      const res = await call(args, { timeoutMs: execTimeout, maxBytes })
      return { exitCode: res.timedOut ? null : res.code, stdout: res.stdout, stderr: res.stderr, truncated: res.truncated, timedOut: res.timedOut }
    },
    networkCreate: (name) => call(["network", "create", name]),
    networkRemove: (name) => call(["network", "rm", name]),
    /** 网络读数（子网/网关——盒源 IP 白名单与链生成两处消费；缺 ⇒ null）。 */
    async networkInspect(name) {
      const res = await call(["network", "inspect", name, "--format", "{{json .IPAM.Config}}"])
      if (res.code !== 0) return null
      try {
        const configs = JSON.parse(textOf(res))
        const first = Array.isArray(configs) ? configs[0] : null
        if (!first) return null
        return { subnet: first.Subnet ?? null, gateway: first.Gateway ?? null }
      } catch {
        return null
      }
    },
    imagePresent,
    /** 容器网络地址（探针 P9 盒间不可达核对；读数不可得 ⇒ null——探针成 SKIP，不假报）。 */
    async containerIp(id) {
      const res = await call(["inspect", "-f", "{{range .NetworkSettings.Networks}}{{.IPAddress}}\n{{end}}", id], { timeoutMs: 30000 })
      if (res.code !== 0) return null
      const first = textOf(res).split("\n").map((line) => line.trim()).find((line) => line !== "")
      return first ?? null
    },
    /** 容器创建时刻（ms——墙钟 TTL 基准；`.Created` = RFC3339 ⇒ 解析失败/读数不可得 ⇒ null）。 */
    async containerCreatedAt(id) {
      const res = await call(["inspect", "-f", "{{.Created}}", id], { timeoutMs: 30000 })
      if (res.code !== 0) return null
      const ms = Date.parse(textOf(res).trim())
      return Number.isFinite(ms) ? ms : null
    },
    /** 镜像确保（§3「缺 ⇒ 指令期构建/pull」）：在场 ⇒ 不动；缺 ⇒ 有 Dockerfile ⇒ build，否则 pull。 */
    async imageEnsure(image, { dockerfileDir = null } = {}) {
      if (await imagePresent(image)) return { ok: true, how: "present" }
      if (dockerfileDir && existsSync(`${dockerfileDir}/Dockerfile`)) {
        const res = await call(["build", "-t", image, dockerfileDir], { timeoutMs: 30 * 60 * 1000 })
        return { ok: res.code === 0, how: "build" }
      }
      const res = await call(["pull", image], { timeoutMs: 30 * 60 * 1000 })
      return { ok: res.code === 0, how: "pull" }
    },
    version: () => call(["--version"]),
  }
}

/** 磁盘余量读数（MB；statfs 失败 ⇒ null）。 */
export async function diskFreeMb(path) {
  try {
    const stats = await statfs(path)
    return Math.floor((Number(stats.bavail) * Number(stats.bsize)) / (1024 * 1024))
  } catch {
    return null
  }
}

/** 本机名（runner 缺省名——登记名以本值为先）。
 *  注意：服务端只在**空名**时兜接随机名（`registry.mjs` 的 `registerRunner`）；同名（同机重跑 join ∥
 *  同主机名的机器）撞 `sandbox_runners.name` UNIQUE ⇒ join 被拒（换机/重装先删旧 runner 行，或显式 `--name`）。 */
export function defaultRunnerName() {
  try {
    return hostname()
  } catch {
    return "runner"
  }
}

/**
 * doctor 八项（§7 表逐项）：核心项任一 FAIL ⇒ `ok: false`（拒跑——E32）。子面读数（netfilter/quota）由调用方先算好注入
 * （bin/daemon 装配）——本函数只做判定与汇总，批内件直测。
 */
export async function doctorChecks({ exec = runCommand, config = {}, runtime = null, netfilter = null, quota = null } = {}) {
  const items = []
  const linux = process.platform === "linux"
  const cgroupV2 = linux && existsSync("/sys/fs/cgroup/cgroup.controllers")
  items.push({
    no: 1, name: "OS（Linux + cgroup v2）", level: "core", pass: cgroupV2,
    detail: linux ? (cgroupV2 ? "Linux + cgroup v2 在场" : "cgroup v2 不在场（/sys/fs/cgroup/cgroup.controllers 缺）") : `非 Linux（platform = ${process.platform}）`,
  })
  items.push({
    no: 2, name: "容器运行时（docker ≥ 20 ∥ podman ≥ 4）", level: "core", pass: runtime?.ok === true,
    detail: runtime ? `${runtime.engine}：${runtime.version}` : "docker/podman 均不可执行",
  })
  items.push({
    no: 3, name: "网络工具（nft 优先 ∥ iptables 备；FORWARD/INPUT 可写）", level: "core", pass: netfilter?.ok === true,
    detail: netfilter?.detail ?? "未探测",
  })
  items.push({
    no: 4, name: "磁盘配额机制（项目配额 ∥ loopback 备选）", level: "core", pass: quota?.mechanism === "project" || quota?.mechanism === "loopback",
    detail: quota?.detail ?? "未探测",
  })
  const ipv6 = await exec("ip", ["-6", "route", "show", "default"], { timeoutMs: 15000 })
  const ipv6Output = textOf(ipv6)
  const ipv6Ok = ipv6.code === 0 && ipv6Output === ""
  items.push({
    no: 5, name: "IPv6（盒网络无 IPv6 路由）", level: "core", pass: ipv6Ok,
    detail: ipv6.code === 0 ? (ipv6Output === "" ? "IPv6 缺省路由不在场" : `IPv6 缺省路由在场（${ipv6Output.split("\n").length} 条）`) : "ip 命令不可用（无法判定——fail-closed）",
  })
  const freeMb = await diskFreeMb(config.workspaceRoot ?? ".")
  const diskWarnMb = Number(config.diskWarnMb) > 0 ? Number(config.diskWarnMb) : 10 * 1024
  items.push({
    no: 6, name: "磁盘余量（workspaceRoot）", level: "warn", pass: freeMb !== null && freeMb >= diskWarnMb,
    detail: freeMb === null ? "读数失败" : `${freeMb} MB（建议 ≥ ${diskWarnMb} MB）`,
  })
  const timeSync = await exec("timedatectl", ["show", "-p", "NTPSynchronized", "--value"], { timeoutMs: 15000 })
  const syncText = textOf(timeSync)
  items.push({
    no: 7, name: "时间同步", level: "warn", pass: timeSync.code === 0 && syncText === "yes",
    detail: timeSync.code === 0 ? `NTPSynchronized=${syncText}` : "timedatectl 不可用（无法判定）",
  })
  const image = config.image ?? "thincoder-sandbox:1"
  const imagePresent = runtime ? await Promise.resolve((await exec(runtime.engine, ["image", "inspect", image], { timeoutMs: 30000 })).code === 0) : false
  items.push({
    no: 8, name: "盒镜像在场", level: "warn", pass: imagePresent,
    detail: imagePresent ? `${image} 在场` : `${image} 缺（指令期构建/pull）`,
  })
  return { ok: items.every((item) => item.level !== "core" || item.pass), items }
}
