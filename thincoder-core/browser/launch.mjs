/**
 * browser/launch.mjs — 浏览器发现 ∥ profile 锁 ∥ 启动 ∥ 杀树（BROWSER-TOOL.md §4）。
 *
 * 候选表与启动参数沿 `scripts/console-walkthrough.mjs:33-44`（Edge 先于 Chrome）∥ `:123`
 * （`--headless=new` ∥ `--remote-debugging-port=0` ∥ `stdio:"ignore"` ∥ POSIX `detached`）——
 * 本档不 import 该脚本，只内化其形。
 * profile = `~/.thincoder/browser/profile`（`configDir` 同源——`config-io.mjs:32`）= **持久**
 * （F-BT6：有头登录一次 ⇒ 后续含无头复用登录态）。
 *
 * 注入缝（N-BT6）：`resolveBrowser({platform, env, pathExists, which})` 与 `acquireProfileLock`
 * 的 `io`——缺省回落真实现，单测零真实文件系统。
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
export const START_TIMEOUT_MS = 12_000

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

/**
 * 启动浏览器（spawn + `DevToolsActivePort` 轮询 ≤12s）。
 * 持久 profile ⇒ 启动前清陈旧端口文件（否则旧值被当本次读数——发现即失效）。
 * @returns {Promise<{child: import("node:child_process").ChildProcess, port: number, profile: string}>}
 */
export async function launchBrowser({ exe, headless = true, profile, timeoutMs = START_TIMEOUT_MS, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const args = [
    ...(headless ? ["--headless=new"] : []),
    "--disable-gpu", "--no-first-run", "--hide-scrollbars",
    `--user-data-dir=${profile}`, "--remote-debugging-port=0",
    "--window-size=1440,900", "about:blank",
  ]
  mkdirSync(profile, { recursive: true })
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

/** 杀整棵进程树（win32 `taskkill /T /F`；POSIX 组杀 + 单杀兜底——walkthrough `:192-193` 同式）。 */
export function killBrowser(child, { platform = process.platform, exec = execFileSync } = {}) {
  if (!child || typeof child.pid !== "number") return
  if (platform === "win32") {
    try { exec("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }) } catch { /* 已退出 */ }
    return
  }
  try { process.kill(-child.pid, "SIGKILL") }
  catch { try { child.kill("SIGKILL") } catch { /* 已退出 */ } }
}
