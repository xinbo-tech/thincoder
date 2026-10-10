#!/usr/bin/env node
/**
 * thincoder-runner.mjs — 沙盒执行面入口（sandbox/RUNNER.md §2/§7/§8/§10；同包第二入口——KD-SV-64）：
 * `join`（一次性 join token ⇒ runner 令牌；写 config 0600）∥ `run`（守护——daemon.mjs）∥ `doctor`（§7 自检——
 * 核心项任一 FAIL ⇒ 非零退出 = 拒跑）∥ `probe`（§10 探针 P1–P14）∥ `image`（盒镜像构建/检查）。
 * 配置文件（缺省 `runner.json`——机本地，不入包）：`{ server, token, runnerId, name, stateDir, workspaceRoot,
 * proxyPort, labels, maxBoxes, runtime, boxUid, boxGid }`——`join` 写 `server/token/runnerId`，其余手配（缺省值见下）。
 */
import { readFileSync, realpathSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { createLogger } from "../src/ops/log.mjs"
import { readPackageVersion } from "../src/ops/update.mjs"
import { createBoxesManager } from "../src/sandbox/runner/boxes.mjs"
import { joinServer } from "../src/sandbox/runner/client.mjs"
import { collectReadings, defaultStateDir, startDaemon } from "../src/sandbox/runner/daemon.mjs"
import { formatProbeLine, runProbes } from "../src/sandbox/runner/probe.mjs"
import { defaultRunnerName, runCommand } from "../src/sandbox/runner/runtime.mjs"

export const USAGE = `用法：thincoder-runner <命令> [选项]

命令：
  join   --server <url> --join-token <t> [--name <名>] [--labels k=v,k=v] [--max-boxes <n>]
  run    [--config <档>]
  doctor [--config <档>]
  probe  --workspace <id> [--probe Pn] [--host <域>] [--target <host:port>] [--expect <值>] [--repo <url>] [--wait <秒>]
  image  [--build] [--dockerfile <目录>]

通用：[--config <档>]（缺省 runner.json）`

/** argv 解析（`--键 值` 与 `--键=值` 两形；旗形 `--build`）。未知参数 ⇒ 抛（用法面）。 */
export function parseArgs(argv) {
  const args = { command: null, flags: {} }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--help" || arg === "-h") { args.flags.help = true; continue }
    if (!arg.startsWith("--")) {
      if (args.command === null) args.command = arg
      else throw new Error(`未知参数：${arg}\n${USAGE}`)
      continue
    }
    const body = arg.slice(2)
    const eq = body.indexOf("=")
    if (eq >= 0) args.flags[body.slice(0, eq)] = body.slice(eq + 1)
    else if (["build", "force"].includes(body)) args.flags[body] = true
    else args.flags[body] = argv[++i] ?? ""
  }
  return args
}

function loadConfigFile(configPath) {
  const path = resolve(configPath)
  let file = {}
  try {
    file = JSON.parse(readFileSync(path, "utf8"))
  } catch (e) {
    if (e.code !== "ENOENT") throw new Error(`配置档读取失败（${path}）：${e.message}`)
  }
  return { path, file }
}

/** 有效配置（缺省值回填——`join` 写、其余命令读）。 */
export function resolveConfig(file, configPath) {
  const baseDir = resolve(configPath, "..")
  return {
    server: file.server ?? null,
    token: file.token ?? null,
    runnerId: file.runnerId ?? null,
    name: file.name ?? null,
    stateDir: resolve(file.stateDir ?? defaultStateDir(configPath)),
    workspaceRoot: resolve(file.workspaceRoot ?? baseDir + "/workspaces"),
    proxyPort: Number(file.proxyPort) > 0 ? Number(file.proxyPort) : 3128,
    labels: file.labels ?? {},
    maxBoxes: file.maxBoxes ?? null,
    runtime: file.runtime ?? null,
    boxUid: Number.isInteger(file.boxUid) ? file.boxUid : 1000,
    boxGid: Number.isInteger(file.boxGid) ? file.boxGid : 1000,
    image: file.image ?? null,
    dockerfileDir: file.dockerfileDir ?? null,
    execTimeoutMs: Number(file.execTimeoutMs) > 0 ? Number(file.execTimeoutMs) : 600000,
    version: readPackageVersion(),
  }
}

async function cmdJoin(args, configPath) {
  const server = args.flags.server
  const joinToken = args.flags["join-token"]
  if (!server || !joinToken) throw new Error(`join 缺 --server ∥ --join-token\n${USAGE}`)
  const { file } = loadConfigFile(configPath)
  const readings = await collectReadings({ config: { ...file, workspaceRoot: file.workspaceRoot ?? resolve(configPath, "..", "workspaces") }, exec: runCommand })
  const labels = {}
  if (typeof args.flags.labels === "string" && args.flags.labels.trim() !== "") {
    for (const pair of args.flags.labels.split(",")) {
      const eq = pair.indexOf("=")
      if (eq > 0) labels[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
    }
  }
  const result = await joinServer({
    server,
    joinToken,
    name: args.flags.name ?? file.name ?? defaultRunnerName(),
    labels: Object.keys(labels).length > 0 ? labels : (file.labels ?? {}),
    maxBoxes: args.flags["max-boxes"] !== undefined ? Number(args.flags["max-boxes"]) : (file.maxBoxes ?? null),
    version: readPackageVersion(),
    runtime: readings.block,
    runtimeAvailable: readings.ok,
  })
  const next = { ...file, server, token: result.token, runnerId: result.runnerId }
  if (args.flags.name) next.name = args.flags.name
  if (Object.keys(labels).length > 0) next.labels = labels
  if (args.flags["max-boxes"] !== undefined) next.maxBoxes = Number(args.flags["max-boxes"])
  writeFileSync(configPath, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 }) // 令牌面 0600（§1——持久态之一）
  process.stdout.write(`已注册：runnerId = ${result.runnerId}（令牌写 ${resolve(configPath)}——0600）\n下一步：thincoder-runner doctor --config ${configPath} ⇒ systemctl enable --now thincoder-runner\n`)
  return 0
}

async function cmdDoctor(args, configPath) {
  const { file } = loadConfigFile(configPath)
  const config = resolveConfig(file, configPath)
  const readings = await collectReadings({ config, exec: runCommand })
  for (const item of readings.items) {
    const tag = item.pass ? "PASS" : `FAIL[${item.level}]`
    process.stdout.write(`#${item.no} ${tag} ${item.name}——${item.detail}\n`)
  }
  if (!readings.ok) {
    process.stdout.write(`核心项失败——拒跑（修好后再 run）\n`)
    return 1
  }
  process.stdout.write(`自检通过（核心项全 PASS）\n`)
  return 0
}

async function cmdImage(args, configPath) {
  const { file } = loadConfigFile(configPath)
  const config = resolveConfig(file, configPath)
  const readings = await collectReadings({ config, exec: runCommand })
  if (!readings.runtimeAdapter) throw new Error("未探测到容器运行时（docker ∥ podman）")
  const image = config.image ?? "thincoder-sandbox:1"
  const dockerfileDir = args.flags.dockerfile ?? config.dockerfileDir ?? null
  if (args.flags.build === true || !(await readings.runtimeAdapter.imagePresent(image))) {
    const result = await readings.runtimeAdapter.imageEnsure(image, { dockerfileDir: dockerfileDir ?? resolve(configPath, "..", "deploy", "sandbox") })
    process.stdout.write(result.ok ? `镜像 ${image} 就绪（${result.how}）\n` : `镜像 ${image} 未就绪（${result.how} 失败）\n`)
    return result.ok ? 0 : 1
  }
  process.stdout.write(`镜像 ${image} 在场\n`)
  return 0
}

async function cmdProbe(args, configPath) {
  const { file } = loadConfigFile(configPath)
  const config = resolveConfig(file, configPath)
  const workspaceId = Number(args.flags.workspace)
  if (!Number.isInteger(workspaceId)) throw new Error(`probe 缺 --workspace <id>\n${USAGE}`)
  const readings = await collectReadings({ config, exec: runCommand })
  if (!readings.runtimeAdapter) throw new Error("未探测到容器运行时（docker ∥ podman）")
  const boxes = createBoxesManager({ runtime: readings.runtimeAdapter, config: { ...config, quota: readings.quota }, exec: runCommand })
  await boxes.adopt()
  const box = boxes.get(workspaceId)
  if (!box) throw new Error(`盒不存在（workspace = ${workspaceId}——先建盒）`)
  const ctx = {
    runtime: readings.runtimeAdapter,
    box,
    workspaceId,
    volumePath: boxes.volumePath(workspaceId),
    gateway: box.gateway,
    args: args.flags,
    pendingTimeoutSeconds: 60,
    execBox: (command, opts = {}) => readings.runtimeAdapter.execBox(box.containerId, { command, ...opts }),
    // P9 两面读数：他盒容器 IP（runtime.inspect）∥ 他盒卷路径（runner 本地路径）
    ipOf: async (item) => readings.runtimeAdapter.containerIp?.(item.id) ?? null,
    volumePathOf: (otherWorkspaceId) => boxes.volumePath(otherWorkspaceId),
  }
  const ids = args.flags.probe ? [String(args.flags.probe).toUpperCase()] : null
  const results = await runProbes(ctx, ids)
  for (const result of results) process.stdout.write(`${formatProbeLine(result)}\n`)
  return results.some((result) => result.state === "fail") ? 1 : 0
}

async function cmdRun(args, configPath) {
  const { file } = loadConfigFile(configPath)
  const config = resolveConfig(file, configPath)
  if (!config.server || !config.token) throw new Error(`未注册（缺 server/token）——先 thincoder-runner join\n${USAGE}`)
  const log = createLogger()
  const daemon = await startDaemon({ config, log })
  process.stdout.write(`runner 已起（server = ${config.server}；核心自检 = ${daemon.readings()?.ok ? "PASS" : "FAIL"}）\n`)
  await new Promise((resolveStop) => {
    const stop = () => { daemon.stop().then(() => resolveStop()) }
    process.on("SIGINT", stop)
    process.on("SIGTERM", stop)
  })
  return 0
}

/** 入口主流程（argv ⇒ 命令派发；未知命令/装配失败 ⇒ 非零退出 + 明确报错——fail-closed）。 */
export async function run(argv = process.argv.slice(2)) {
  let args
  try {
    args = parseArgs(argv)
  } catch (e) {
    process.stderr.write(`${e.message}\n`)
    return 1
  }
  if (args.flags.help || args.command === null) {
    process.stdout.write(`${USAGE}\n`)
    return args.flags.help ? 0 : 1
  }
  const configPath = resolve(args.flags.config ?? "runner.json")
  try {
    switch (args.command) {
      case "join": return await cmdJoin(args, configPath)
      case "run": return await cmdRun(args, configPath)
      case "doctor": return await cmdDoctor(args, configPath)
      case "probe": return await cmdProbe(args, configPath)
      case "image": return await cmdImage(args, configPath)
      default:
        process.stderr.write(`未知命令：${args.command}\n${USAGE}\n`)
        return 1
    }
  } catch (e) {
    process.stderr.write(`${e.message}\n`)
    return 1
  }
}

// 入口判据（同 server 面先例——argv[1] 先经 realpath 解析再比；npm 全局装（POSIX）bin = 符号链接形）。
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  run().then((code) => { process.exitCode = code })
}
