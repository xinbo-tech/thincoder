#!/usr/bin/env node
/**
 * converge.mjs — 壳引导收敛（ops/OPS.md §5.4(d)）：按 `TC_SERVER_VERSION` × 已装，收敛到目标版本 ⇒ 可运行。
 * 自足（零 App 依赖——仅 node 内建；镜像内 = `deploy/` 引导层，App 由 npm 取装——§5.1）。
 *
 * 判定表（逐行——§5.4(d)）：
 *   空 + 有 ⇒ 直接运行（零网络）∥ 空 + 无 ⇒ 拒启（未装 App 且未给 TC_SERVER_VERSION）
 *   x.y.z + = ⇒ 直接运行 ∥ x.y.z + ≠ ⇒ 装 x.y.z（超时 120s）⇒ 复读校验 ⇒ 运行；装不上 ⇒ 拒启（三选修复——不漂移）
 *   latest + 有 ⇒ 查 registry（超时 30s）：已最新 ⇒ 运行；有新 ⇒ 装 ⇒ 运行（装失败/超时 ⇒ 回退已装 + 警告）；
 *                 不可达 ⇒ 回退已装 + 警告
 *   latest + 无 ⇒ 可达 ⇒ 装 ⇒ 运行（装失败/超时 ⇒ 拒启——无已装可跑）；不可达 ⇒ 拒启
 *
 * 输出行（docker logs 直读）：`converge: version=<v> source=<installed|installed-now|fallback>` ∥ `converge: warning …` ∥
 * `converge: refused …`（拒启含修复选项）。退出码：0 = 可运行（已收敛）∥ 1 = 拒启（重起循环使其可见——不静默漂移）。
 * 注入口径（批内件替身）：`npmCommand` ∥ `print` ∥ `readInstalled` 走可覆盖参数 + `??` 缺省（缺省 = 生产行为不变）。
 */
import { spawn } from "node:child_process"
import { existsSync, readFileSync, realpathSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const PACKAGE = "@thincoder/server"
const DEFAULT_REGISTRY = "https://registry.npmjs.org"
const DEFAULT_PREFIX = "/home/node/.npm-global" // 镜像前缀（§5.1——node 账号自有）
const CHECK_TIMEOUT_MS = 30 * 1000 // latest 查 registry 超时（§5.4(d)）
const INSTALL_TIMEOUT_MS = 120 * 1000 // 装版子进程超时（§5.4(d)）

/** 版本比较（逐段——与 `src/ops/update.mjs` 同语义；壳自足故自带一份）。返回 -1/0/1。 */
function compareVersions(a, b) {
  const pa = String(a).split(".")
  const pb = String(b).split(".")
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const xa = pa[i] ?? "0"
    const xb = pb[i] ?? "0"
    const na = Number(xa)
    const nb = Number(xb)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      if (na !== nb) return na < nb ? -1 : 1
    } else if (xa !== xb) {
      return xa < xb ? -1 : 1
    }
  }
  return 0
}

/** 版号形状校验（进 spawn 参数前把关）。 */
function isVersionSpec(value) {
  return typeof value === "string" && /^[0-9A-Za-z][0-9A-Za-z.+-]*$/.test(value)
}

/** 前缀内已装版本（npm 全局布局：POSIX `<prefix>/lib/node_modules` ∥ Windows `<prefix>/node_modules`）。 */
function readInstalledVersion(prefix) {
  for (const rel of [join("lib", "node_modules"), "node_modules"]) {
    const file = join(prefix, rel, "@thincoder", "server", "package.json")
    if (!existsSync(file)) continue
    try {
      return JSON.parse(readFileSync(file, "utf8")).version ?? null
    } catch {
      return null
    }
  }
  return null
}

/** registry 自检（latest——超时 `timeoutMs`；失败/404/形状不合 ⇒ null）。 */
async function checkLatest({ registry, timeoutMs = CHECK_TIMEOUT_MS, fetchImpl = fetch }) {
  try {
    const base = String(registry).replace(/\/+$/, "")
    const res = await fetchImpl(`${base}/@thincoder%2fserver/latest`, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return null
    const data = await res.json()
    return isVersionSpec(data?.version) ? data.version : null
  } catch {
    return null
  }
}

/** 装版（`npm i -g @thincoder/server@<target>`——前缀 = `NPM_CONFIG_PREFIX`）⇒ 复读校验（前缀内版本 = target）。 */
function installVersion(target, { npmCommand, prefix, env, timeoutMs = INSTALL_TIMEOUT_MS }) {
  return new Promise((resolve) => {
    if (!isVersionSpec(target)) {
      resolve({ ok: false, reason: "argument", message: `版号形状非法：${JSON.stringify(target)}` })
      return
    }
    const spec = Array.isArray(npmCommand) ? npmCommand : [npmCommand]
    const [command, ...prefixArgs] = spec
    const args = [...prefixArgs, "i", "-g", `${PACKAGE}@${target}`, "--no-audit", "--no-fund"]
    let child
    try {
      child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], env: { ...env, NPM_CONFIG_PREFIX: prefix } })
    } catch (e) {
      resolve({ ok: false, reason: "spawn", message: `npm 子进程未起：${e.message}` })
      return
    }
    let tail = ""
    let settled = false
    let timer = null
    const finish = (result) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve(result)
    }
    const collect = (chunk) => {
      tail = (tail + String(chunk)).slice(-2000)
    }
    child.stdout?.on("data", collect)
    child.stderr?.on("data", collect)
    child.on("error", (e) => finish({ ok: false, reason: "spawn", message: `npm 子进程未起：${e.message}` }))
    child.on("close", (code) => {
      if (settled) return
      if (code !== 0) {
        const last = tail.trim().split("\n").at(-1)
        finish({ ok: false, reason: "exit", message: `npm 装版退出码 ${code}${last ? `（末行：${last}）` : ""}` })
        return
      }
      const installed = readInstalledVersion(prefix)
      finish(installed === target
        ? { ok: true, message: `已装 ${target}` }
        : { ok: false, reason: "verify", message: `复读校验未过：已装 ${installed ?? "（缺）"} ≠ 目标 ${target}` })
    })
    timer = setTimeout(() => {
      try {
        child.kill()
      } catch {
        /* 已退 */
      }
      finish({ ok: false, reason: "timeout", message: `npm 装版超时（${timeoutMs}ms——子进程已终止）` })
    }, timeoutMs)
    timer.unref?.()
  })
}

/**
 * 收敛主链（判定表逐行——见档头）。返回 `{ ok, version, source, reason, message, lines }`；
 * 输出经 `print`（缺省 stdout）——`converge: version=…` 成功行 ∥ warning ∥ refused（拒启含修复选项）。
 */
export async function converge({
  env = process.env,
  npmCommand = "npm",
  print = (line) => console.log(line),
  fetchImpl = fetch,
  readInstalled = readInstalledVersion,
} = {}) {
  const lines = []
  const say = (line) => {
    lines.push(line)
    print(line)
  }
  const prefix = env.NPM_CONFIG_PREFIX || DEFAULT_PREFIX
  const target = String(env.TC_SERVER_VERSION ?? "").trim()
  const installed = readInstalled(prefix)
  const run = (version, source) => {
    say(`converge: version=${version} source=${source}`)
    return { ok: true, version, source, reason: null, message: null, lines }
  }
  const warn = (message) => say(`converge: warning ${message}`)
  const refuse = (message) => {
    say(`converge: refused ${message}`)
    return { ok: false, version: null, source: null, reason: "refused", message, lines }
  }

  if (target === "") { // 空 ⇒ 按已装（零网络）；无已装 ⇒ 拒启
    if (installed) return run(installed, "installed")
    return refuse("未装 App 且未给 TC_SERVER_VERSION（修复：① 钉一个可用版本 ② 设 latest 联网装 ③ 使用含预装版的镜像）")
  }
  if (target !== "latest") { // 钉版（x.y.z）：= 即用；≠ 装 ⇒ 复读 ⇒ 用；装不上 ⇒ 拒启（不漂移）
    if (installed === target) return run(installed, "installed")
    const result = await installVersion(target, { npmCommand, prefix, env })
    if (result.ok) return run(target, "installed-now")
    return refuse(`钉版 ${target} 不可得（${result.message}）；三选修复：① 联网后重试（docker compose up -d） ∥ ② 改钉值 TC_SERVER_VERSION=<可用版> ∥ ③ 回滚旧值（钉回镜像预装版）`)
  }
  // latest ⇒ 追新（查 registry——超时 30s）
  const latest = await checkLatest({ registry: env.NPM_CONFIG_REGISTRY ?? DEFAULT_REGISTRY, fetchImpl })
  if (installed) {
    if (latest === null) {
      warn(`registry 不可达（latest 查询失败）——回退已装版本 ${installed}`)
      return run(installed, "fallback")
    }
    if (compareVersions(installed, latest) >= 0) return run(installed, "installed")
    const result = await installVersion(latest, { npmCommand, prefix, env })
    if (result.ok) return run(latest, "installed-now")
    warn(`装 latest（${latest}）失败：${result.message}——回退已装版本 ${installed}`)
    return run(installed, "fallback")
  }
  if (latest === null) {
    return refuse("registry 不可达且无已装版本（修复：① 联网后重试 ∥ ② 钉一个可用版本 TC_SERVER_VERSION=x.y.z ∥ ③ 使用含预装版的镜像）")
  }
  const result = await installVersion(latest, { npmCommand, prefix, env })
  if (result.ok) return run(latest, "installed-now")
  return refuse(`装 latest（${latest}）失败且无已装版本可跑：${result.message}（修复：① 联网后重试 ∥ ② 钉一个可用版本 ∥ ③ 使用含预装版的镜像）`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const result = await converge()
  if (!result.ok) process.exitCode = 1
}
