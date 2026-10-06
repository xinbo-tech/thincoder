/**
 * update.mjs — 自动更新（ops/OPS.md §5.4(a)(b)(c)）：自检（启动即检一次 + 每 6h——实现常量）∥ 版本比较 ∥
 * 档位语义（`false` ∥ `"notify"` ∥ `"auto"`；容器钉版 ⇒ 自装抑制）∥ 自升执行器（npm 子进程 ⇒ 复读校验 ⇒ 回调停机）。
 *
 * 零第三方依赖：自检 = node 内建 `fetch`（scheme 随 `NPM_CONFIG_REGISTRY`——http(s) 皆可）；自升 = npm CLI 子进程
 * （自检与自装同源——§5.3）。检查失败/404 静默（与「无新版」同面）；自装失败/超时恒保留旧版运行（绝不 brick——§5.4(f)）。
 * 注入口径（批内件替身——§5.4(c)）：npm 命令 ∥ 读装版本 ∥ 周期/超时常量走可覆盖参数 + `??` 缺省
 * （缺省 = 生产行为不变；测试内 finally 复原）。
 */
import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

export const PACKAGE_NAME = "@thincoder/server"
export const DEFAULT_REGISTRY = "https://registry.npmjs.org"
export const UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1000 // 自检周期（6h——实现常量；§5.4(a)）
export const CHECK_TIMEOUT_MS = 5000 // registry 查询超时（沿 CLI 先例——§5.4(a)）
export const INSTALL_TIMEOUT_MS = 120 * 1000 // 自升子进程超时（§5.4(c)）

/** 版本比较（逐段——两段皆可转数值时数值比，否则字典序；沿 CLI `upgrade.mjs` 先例语义）。返回 -1/0/1。 */
export function compareVersions(a, b) {
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

/** 版号形状校验（进 spawn 参数前把关——registry 回值与钉值均不过此不入命令）。 */
export function isVersionSpec(value) {
  return typeof value === "string" && /^[0-9A-Za-z][0-9A-Za-z.+-]*$/.test(value)
}

/** 运行树版本（包根 `package.json` = 本模块 `../../package.json`——仓内 ∥ 装机树同形）。 */
export function readPackageVersion(root = fileURLToPath(new URL("../..", import.meta.url))) {
  return JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version
}

/**
 * registry 自检：`GET <registry>/@thincoder%2fserver/latest`（超时 `timeoutMs`；`%2f` 编码形）。
 * 失败 ∥ 非 2xx（发布前恒 404） ∥ 形状不合 ⇒ null（静默——与「无新版」同面，不打扰）。
 */
export async function checkLatest({
  registry = process.env.NPM_CONFIG_REGISTRY ?? DEFAULT_REGISTRY,
  timeoutMs = CHECK_TIMEOUT_MS,
  fetchImpl = fetch,
} = {}) {
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

/**
 * 子进程收尾：退出（`close`——stdio 已关，尾部输出送达） ∥ 超时（kill 后按超时收场，防 kill 无效挂死）。stdout/stderr 留尾供回显。
 * 返回 `{ code, signal, tail, timedOut, error }`。
 */
function runChild(command, args, { spawnImpl, env, timeoutMs }) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawnImpl(command, args, { stdio: ["ignore", "pipe", "pipe"], env })
    } catch (e) {
      resolve({ code: null, signal: null, tail: "", timedOut: false, error: e })
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
    child.on("error", (e) => finish({ code: null, signal: null, tail, timedOut: false, error: e }))
    child.on("close", (code, signal) => finish({ code, signal, tail, timedOut: false, error: null }))
    timer = setTimeout(() => {
      try {
        child.kill()
      } catch {
        /* 已退 */
      }
      finish({ code: null, signal: null, tail, timedOut: true, error: null })
    }, timeoutMs)
    timer.unref?.()
  })
}

/**
 * 自升执行器（§5.4(c)）：`npm i -g @thincoder/server@<target> --no-audit --no-fund` 子进程（超时 `timeoutMs`）。
 * 成功判据 = 退出码 0 ∧ 复读版本 = target（复读 = `readInstalled()`——缺省 = 运行树 package.json，即 npm i -g
 * 的改写对象——前缀式装机 §5.1）。`npmCommand` = 命令 + 前导参数形（字符串 ∥ 数组——批内件替身）。
 * 返回 `{ ok, reason, installed, message }`（失败恒不动进程——调用方保留旧版）。
 */
export async function installPackage(target, {
  npmCommand = "npm",
  timeoutMs = INSTALL_TIMEOUT_MS,
  spawnImpl = spawn,
  env = process.env,
  readInstalled = () => readPackageVersion(),
} = {}) {
  if (!isVersionSpec(target)) {
    return { ok: false, reason: "argument", installed: null, message: `版号形状非法：${JSON.stringify(target)}` }
  }
  const spec = Array.isArray(npmCommand) ? npmCommand : [npmCommand]
  const [command, ...prefixArgs] = spec
  const args = [...prefixArgs, "i", "-g", `${PACKAGE_NAME}@${target}`, "--no-audit", "--no-fund"]
  const child = await runChild(command, args, { spawnImpl, env, timeoutMs })
  if (child.timedOut) return { ok: false, reason: "timeout", installed: null, message: `npm 装版超时（${timeoutMs}ms——子进程已终止）` }
  if (child.error) return { ok: false, reason: "spawn", installed: null, message: `npm 子进程未起：${child.error.message}` }
  if (child.code !== 0) {
    const last = child.tail.trim().split("\n").at(-1)
    return { ok: false, reason: "exit", installed: null, message: `npm 装版退出码 ${child.code}${last ? `（末行：${last}）` : ""}` }
  }
  let installed = null
  try {
    installed = readInstalled() ?? null
  } catch (e) {
    return { ok: false, reason: "verify", installed, message: `复读版本失败：${e.message}` }
  }
  if (installed !== target) {
    return { ok: false, reason: "verify", installed, message: `复读校验未过：已装 ${installed ?? "（缺）"} ≠ 目标 ${target}` }
  }
  return { ok: true, reason: null, installed, message: `已装 ${target}` }
}

/**
 * 建更新器（入口接线——§5.4(a)(b)(c)）：`start()` = 启动即检一次 + 每 `intervalMs` 一轮（定时器 unref——不阻停机）；
 * `stop()` = 清循环（停机 ∥ 自升后停机）。档位 = `config.autoUpdate`（`false` ⇒ 零检查）；
 * 容器钉版（`env.TC_SERVER_VERSION` 非空且非 `latest`）⇒ 自装抑制（生效 = notify + 启动一条说明——升级 = 改钉值；§5.4(b)）。
 * `onSelfUpdate` = 自升成功回调（入口接优雅停机——`signal: "self-update"`）。
 */
export function createUpdater({
  config = {},
  log = null,
  version = readPackageVersion(),
  intervalMs = UPDATE_INTERVAL_MS,
  checkTimeoutMs = CHECK_TIMEOUT_MS,
  installTimeoutMs = INSTALL_TIMEOUT_MS,
  registry = process.env.NPM_CONFIG_REGISTRY ?? DEFAULT_REGISTRY,
  env = process.env,
  npmCommand = "npm",
  spawnImpl = spawn,
  fetchImpl = fetch,
  readInstalled = () => readPackageVersion(),
  onSelfUpdate = null,
} = {}) {
  const configured = config.autoUpdate ?? "notify"
  const pin = String(env.TC_SERVER_VERSION ?? "").trim() // 去空白（与 converge 目标解析同源）
  const pinned = pin !== "" && pin !== "latest"
  const mode = configured === "auto" && pinned ? "notify" : configured // 钉版 ⇒ 自装抑制（生效 = notify）
  let timer = null
  let checking = false

  /** 一轮自检（+ 自装）：失败/404/无新 ⇒ 静默；有新版 ⇒ `update_available`；自装成功 ⇒ `update_installed` + 回调停机。 */
  async function checkNow() {
    if (mode === false || checking) return null
    checking = true
    try {
      const latest = await checkLatest({ registry, timeoutMs: checkTimeoutMs, fetchImpl })
      if (latest === null || compareVersions(version, latest) >= 0) return null // 静默（失败/404/无新——同面）
      log?.warn("update_available", { current: version, latest, mode })
      if (mode !== "auto") return { latest, installed: false }
      const result = await installPackage(latest, { npmCommand, timeoutMs: installTimeoutMs, spawnImpl, env, readInstalled })
      if (!result.ok) {
        log?.warn("update_install_failed", {
          latest,
          reason: result.reason,
          message: `${result.message}；旧版 ${version} 续跑（复装：npm i -g ${PACKAGE_NAME}@${latest}）`,
        })
        return { latest, installed: false }
      }
      log?.info("update_installed", { from: version, to: latest })
      onSelfUpdate?.(latest)
      return { latest, installed: true }
    } catch {
      return null // 自检面异常——静默（与「无新版」同面）
    } finally {
      checking = false
    }
  }

  /** 启动即检一次 + 周期巡逻（`false` 档零检查；钉版 + auto ⇒ 启动一条抑制说明）。 */
  function start() {
    if (mode === false || timer) return
    if (configured === "auto" && pinned) {
      log?.info("update_suppressed", {
        pinned: pin,
        effective: "notify",
        message: "容器钉版（TC_SERVER_VERSION）——自装抑制（升级 = 改钉值）",
      })
    }
    void checkNow()
    timer = setInterval(() => void checkNow(), intervalMs)
    timer.unref?.()
  }

  /** 清循环（停机；幂等）。 */
  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return { start, stop, checkNow, version, configured, pinned, pin, mode }
}
