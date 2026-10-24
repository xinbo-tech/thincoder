/**
 * browser/launch.mjs — 浏览器发现 ∥ profile 锁 ∥ 启动 ∥ 杀树（BROWSER-TOOL.md §4）。
 *
 * 候选表与启动参数沿 `scripts/console-walkthrough.mjs`（Edge 先于 Chrome）∥ 同档启动参数段
 * （`--headless=new` ∥ `--remote-debugging-port=0` ∥ `stdio:"ignore"` ∥ POSIX `detached`）——
 * 本档不 import 该脚本，只内化其形。
 * profile = `~/.thincoder/browser/profile`（`configDir` 同源——`config-io.mjs`）= **持久**
 * （F-BT6：有头登录一次 ⇒ 后续含无头复用登录态）。
 *
 * 注入缝（N-BT6）：`resolveBrowser({platform, env, pathExists, which})` 与 `acquireProfileLock`
 * 的 `io`——缺省回落真实现，单元测试零真实文件系统。
 */
import { execFileSync, spawn } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { configDir } from "../config-io.mjs"

/** 平台候选表（edge 先于 chrome——walkthrough 实证表）。 */
export const CANDIDATES = {
  edge: {
    win32: ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"],
    darwin: ["/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"],
    linux: ["microsoft-edge", "microsoft-edge-stable"],
  },
  chrome: {
    win32: ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"],
    darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
    linux: ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"],
  },
}

/** 全候选落空（N-BT5）——装配期不剔除工具，首用显式报此句（§2.6）。 */
export const BROWSER_NOT_FOUND = "no Chromium-based browser found (Edge/Chrome) — install one or set BROWSER_PATH"
export const START_TIMEOUT_MS = 25_000 // 缺省启动窗（重负载 Windows 实测 13–17s，留 ≈8s 余量）
const START_TIMEOUT_MIN_MS = 2_000 // 下限：防「瞬间判失败」
const START_TIMEOUT_MAX_MS = 30_000 // 上限：首动作总墙钟 = 启动窗 + 动作预算（§2.9 两段各自有帽——KD-25）

/** env 覆盖 `BROWSER_START_TIMEOUT_MS`（§2.4 取值口径 · KD-25）：`Number.isFinite(v) && v > 0` 才采纳，
 *  随后夹进 `[2_000, 30_000]`（`"1500"` ⇒ 2000、`"40000"` ⇒ 30000）；非数值 ∥ 空串 ∥ `0` ∥ 负值 ⇒ 回落缺省 25s。 */
export function browserStartTimeoutMs(env = process.env) {
  const wanted = Number(env?.BROWSER_START_TIMEOUT_MS)
  if (!Number.isFinite(wanted) || wanted <= 0) return START_TIMEOUT_MS
  return Math.min(START_TIMEOUT_MAX_MS, Math.max(START_TIMEOUT_MIN_MS, wanted))
}

const defaultPathExists = (p) => existsSync(p)
function defaultWhich(name) {
  try { return execFileSync("which", [name], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || null }
  catch { return null }
}

/** 浏览器可执行文件解析：`BROWSER_PATH`（exe 路径 ∥ 名字）→ 候选表 edge → chrome；全空 ⇒ 抛钉死句。 */
export function resolveBrowser({ platform = process.platform, env = process.env, pathExists = defaultPathExists, which = defaultWhich } = {}) {
  const lookup = (candidate) => (candidate.includes("/") || candidate.includes("\\")
    ? (pathExists(candidate) ? candidate : null)
    : which(candidate))
  const override = String(env?.BROWSER_PATH ?? "").trim()
  if (override) {
    const byName = CANDIDATES[override.toLowerCase()]
    for (const candidate of byName ? byName[platform] ?? [] : [override]) {
      const found = lookup(candidate)
      if (found) return found
    }
    // 覆盖值不可用 ⇒ 落回候选表（不静默吞：表亦空时抛钉死句——「设置 BROWSER_PATH」指引仍成立）
  }
  for (const family of Object.values(CANDIDATES)) {
    for (const candidate of family[platform] ?? []) {
      const found = lookup(candidate)
      if (found) return found
    }
  }
  throw new Error(BROWSER_NOT_FOUND)
}

/** 本工具的持久化面（profile ∥ 锁 ∥ 截图目录）。 */
export function browserPaths(base = configDir) {
  const root = join(base, "browser")
  return { root, profile: join(root, "profile"), lock: join(root, "session.lock"), shots: join(root, "shots") }
}

function defaultPidAlive(pid) {
  try { process.kill(pid, 0); return true }
  catch (e) { return e?.code === "EPERM" } // 存在但无权限 ⇒ 视为活着（保守）
}

/**
 * profile 锁（单会话/进程——KD-5）：他进程持有 ⇒ 抛 `browser profile in use by another
 * ThinCoder instance (pid <N>)`；陈旧锁（pid 死）⇒ 接管。
 * `io` = 注入缝（readText ∥ writeText ∥ isAlive ∥ pid）——缺省真文件系统。
 */
export function acquireProfileLock(lockPath, io = {}) {
  const readText = io.readText ?? ((p) => { try { return readFileSync(p, "utf8") } catch { return "" } })
  const writeText = io.writeText ?? ((p, text) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text, "utf8") })
  const isAlive = io.isAlive ?? defaultPidAlive
  const pid = io.pid ?? process.pid
  const held = Number(String(readText(lockPath) ?? "").trim())
  if (Number.isInteger(held) && held > 0 && held !== pid && isAlive(held)) {
    throw new Error(`browser profile in use by another ThinCoder instance (pid ${held})`)
  }
  writeText(lockPath, String(pid))
  return { pid }
}

export function releaseProfileLock(lockPath, io = {}) {
  const removeText = io.removeText ?? ((p) => { try { rmSync(p, { force: true }) } catch { /* 已被接管/清除 */ } })
  removeText(lockPath)
}

/** 同 profile 残留进程列表（平台分支——一次 exec 取全表；失败 ⇒ []——尽力面零抛）：win32 = 一次
 *  Get-CimInstance（PowerShell——wmic 已从新系统移除）；POSIX = 一次 ps（自持列表面：既有
 *  `process-probe-exec.mjs` 那条链按已知 pid 查 cmdline，本面是反查——零第三方依赖）。 */
function defaultListProfileProcs(platform = process.platform) {
  try {
    if (platform === "win32") {
      const out = execFileSync("powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command",
          "Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"],
        { encoding: "utf8", timeout: 15_000, stdio: ["ignore", "pipe", "ignore"] })
      const rows = JSON.parse(out.trim() || "[]")
      return (Array.isArray(rows) ? rows : [rows]).filter((r) => r && Number.isInteger(r.ProcessId)).map((r) => ({ pid: Number(r.ProcessId), cmdline: r.CommandLine ?? "" }))
    }
    const out = execFileSync("ps", ["-eo", "pid=,args="], { encoding: "utf8", timeout: 15_000, stdio: ["ignore", "pipe", "ignore"] })
    return out.split(/\r?\n/).map((l) => l.match(/^\s*(\d+)\s+(.*)$/)).filter(Boolean).map((m) => ({ pid: Number(m[1]), cmdline: m[2] }))
  } catch { return [] }
}

/** 同 `--user-data-dir` 残留浏览器进程树回收（#1304——启动序在 spawn 前调用）：陈旧实例占住
 *  profile ⇒ 新实例自退 + `DevToolsActivePort` 永不落盘 = 起不动；回收后再 spawn。
 *  锁空闲判据同 `acquireProfileLock`（活 pid 持•非本进程 ⇒ 不回收——既有错由 acquire 支照抛）；
 *  `io` = 注入缝（`platform` ∥ `readText`/`isAlive`/`pid` ∥ `list` ⇒ [{pid, cmdline}] ∥ `kill(pid)`）；
 *  平台分支 + 尽力面零抛（列表 ∥ 单杀失败均不阻断启动）；`close` 路径既有杀树（`killBrowser`）零改
 *  ——默认杀器即复用它（pid 形）。 */
export function reclaimProfileOrphans(profile, io = {}) {
  try {
    const platform = io.platform ?? process.platform
    const readText = io.readText ?? ((p) => { try { return readFileSync(p, "utf8") } catch { return "" } })
    const isAlive = io.isAlive ?? defaultPidAlive
    const pid = io.pid ?? process.pid
    const held = Number(String(readText(join(dirname(profile), "session.lock")) ?? "").trim())
    if (Number.isInteger(held) && held > 0 && held !== pid && isAlive(held)) return // 锁被活 pid 持 ⇒ 不回收
    const list = io.list ?? (() => defaultListProfileProcs(platform))
    const kill = io.kill ?? ((target) => killBrowser({ pid: target, kill: (signal) => process.kill(target, signal) }, { platform }))
    const marker = `--user-data-dir=${profile}`
    for (const row of list() ?? []) {
      const target = Number(row?.pid)
      if (!Number.isInteger(target) || target <= 0 || target === pid) continue
      if (!String(row?.cmdline ?? "").replace(/"/g, "").includes(marker)) continue
      try { kill(target) } catch { /* 单条失败不阻断其余 */ }
    }
  } catch { /* 回收失败不阻断启动（尽力面零抛） */ }
}

/**
 * 启动浏览器（spawn + `DevToolsActivePort` 轮询 ≤ 启动窗）。
 * 启动窗 = `timeoutMs` 显式入参 ＞ env `BROWSER_START_TIMEOUT_MS` ＞ 缺省 25s（`browserStartTimeoutMs`）。
 * 持久 profile ⇒ 启动前清陈旧端口文件（否则旧值被当本次读数——发现即失效）。
 * @returns {Promise<{child: import("node:child_process").ChildProcess, port: number, profile: string}>}
 */
export async function launchBrowser({ exe, headless = true, profile, timeoutMs = browserStartTimeoutMs(), sleep = (ms) => new Promise((r) => setTimeout(r, ms)), reclaimIo = undefined } = {}) {
  const args = [
    ...(headless ? ["--headless=new"] : []),
    "--disable-gpu", "--no-first-run", "--hide-scrollbars",
    `--user-data-dir=${profile}`, "--remote-debugging-port=0",
    "--window-size=1440,900", "about:blank",
  ]
  mkdirSync(profile, { recursive: true })
  // #1304：锁空闲（调用序保证——`acquireProfileLock` 在前）⇒ 先回收同 profile 残留进程树，再 spawn。
  reclaimProfileOrphans(profile, reclaimIo)
  const portFile = join(profile, "DevToolsActivePort")
  rmSync(portFile, { force: true })
  const child = spawn(exe, args, { stdio: "ignore", detached: process.platform !== "win32" })
  let spawnError = null
  child.on("error", (e) => { spawnError = e }) // 捕获（否则 unhandled 'error' 事件崩进程）；下面显式上报
  const deadline = Date.now() + timeoutMs
  while (!existsSync(portFile)) {
    if (spawnError) { killBrowser(child); throw new Error(`browser failed to start: ${spawnError.message} (${exe})`) }
    if (child.exitCode !== null || Date.now() >= deadline) {
      killBrowser(child)
      throw new Error(`browser failed to start: DevToolsActivePort not written within ${Math.round(timeoutMs / 1000)}s (${exe})`)
    }
    await sleep(50)
  }
  const port = Number(String(readFileSync(portFile, "utf8")).split("\n")[0])
  if (!Number.isInteger(port) || port <= 0) {
    killBrowser(child)
    throw new Error(`browser failed to start: DevToolsActivePort is malformed (${exe})`)
  }
  return { child, port, profile }
}

/** 杀整棵进程树（win32 `taskkill /T /F`；POSIX 组杀 + 单杀兜底——walkthrough 同式）。 */
export function killBrowser(child, { platform = process.platform, exec = execFileSync } = {}) {
  if (!child || typeof child.pid !== "number") return
  if (platform === "win32") {
    try { exec("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }) } catch { /* 已退出 */ }
    return
  }
  try { process.kill(-child.pid, "SIGKILL") }
  catch { try { child.kill("SIGKILL") } catch { /* 已退出 */ } }
}
