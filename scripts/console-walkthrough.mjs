#!/usr/bin/env node
/**
 * console-walkthrough.mjs — 控制台真浏览器走查（开发期工具 · 不进产品 · 不进 CI）。
 *
 * 干什么：自起一份进程内真服务（随机口 · 内存库 · 自设凭据 + mock 上游），
 *         用无头 Chromium 系浏览器（Edge 或 Chrome）打开控制台 → 登录 → 逐页截图 + 读回 DOM 文本。
 * 干什么用：控制台面改动的「走查」——人/模型看图核对 UI，机器读回核对文本与结构。
 *
 * 用法：node scripts/console-walkthrough.mjs [--browser=edge|chrome|<exe 路径>]
 *   · 浏览器发现序 = edge → chrome（按平台候选表）；--browser 或环境变量 BROWSER_PATH 可覆盖。
 *   · 平台：Windows / macOS / Linux（零第三方依赖——仅系统浏览器 + Node 原生 WebSocket）。
 *   · 要求：Node ≥ 24（项目口径）、本机装有 Edge 或 Chrome。
 *
 * 产物：<repo>/.thincoder/tmp/console-look-<N>-<page>.png（各页截图）
 *       <repo>/.thincoder/tmp/console-look.json（读回报告——UTF-8）
 *
 * 注：常备工具（非批内件）——用坏再修，不加功能框架。
 *     改装配面时：照 thincoder-server/bin/thincoder-server.mjs 全量注册（漏注册 ⇒ 顶栏「无此路由」黄条 + 总览卡片全「—」）。
 */
import { spawn, execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createServer as createHttpServer } from "node:http"

const ROOT = fileURLToPath(new URL("../", import.meta.url)) // <repo>/（本档 = <repo>/scripts/）
const OUT = join(ROOT, ".thincoder", "tmp")
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── 浏览器发现（edge → chrome；--browser / BROWSER_PATH 覆盖）───────────────
const CANDIDATES = {
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
function resolvePath(name) {
  if (name.includes("/") || name.includes("\\")) return existsSync(name) ? name : null
  try { return execFileSync("which", [name], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || null } catch { return null }
}
function resolveBrowser() {
  const flag = process.argv.find((a) => a.startsWith("--browser="))?.slice("--browser=".length) ?? process.env.BROWSER_PATH ?? ""
  if (flag) {
    const byName = CANDIDATES[flag.toLowerCase()]
    for (const c of byName ? byName[process.platform] ?? [] : [flag]) { const p = resolvePath(c); if (p) return p }
    console.error(`[err] 指定浏览器不可用：${flag}`)
    process.exit(1)
  }
  for (const key of ["edge", "chrome"]) {
    for (const c of CANDIDATES[key][process.platform] ?? []) {
      const p = resolvePath(c)
      if (p) { console.log("[browser]", key, p); return p }
    }
  }
  console.error("[err] 未发现 Edge / Chrome——用 --browser=<exe 路径> 或 BROWSER_PATH 指定")
  process.exit(1)
}
const BROWSER = resolveBrowser()

// ── 真服务（进程内——装配照 bin/thincoder-server.mjs 全量注册）──────────────
const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY = await load("thincoder-server/src/gateway/routes.mjs")
const PROVIDER_ADMIN = await load("thincoder-server/src/gateway/provider-admin.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const ADMIN_ROUTES = await load("thincoder-server/src/accounts/routes-admin.mjs")
const METERING_ROUTES = await load("thincoder-server/src/metering/routes.mjs")
const SYSTEM = await load("thincoder-server/src/gateway/system.mjs")
const OVERVIEW = await load("thincoder-server/src/gateway/overview.mjs")
const EMBEDDING_ADMIN = await load("thincoder-server/src/gateway/embedding-admin.mjs")
const STATIC = await load("thincoder-server/src/webui/static.mjs")

const db = DB.openDatabase(":memory:")
await MEMBERS.createMember(db, { username: "admin", role: "admin", password: "password-123" })
await MEMBERS.createMember(db, { username: "alice", role: "user", password: "password-123" })

// mock 上游（富字段——供 Provider 发现面走查）
const upstreamServer = createHttpServer((req, res) => {
  const chunks = []
  req.on("data", (c) => chunks.push(c))
  req.on("end", () => {
    res.writeHead(200, { "content-type": "application/json" })
    if ((req.url ?? "").endsWith("/models")) {
      res.end(JSON.stringify({ object: "list", data: [
        { id: "mock-chat", name: "Mock Chat", context_window: 128000, max_output_tokens: 8192, input_modalities: ["text", "image"] },
        { id: "mock-reasoner", name: "Mock Reasoner", context_window: 64000, status: "Shutdown" },
      ] }))
      return
    }
    res.end(JSON.stringify({ id: "u1", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "up-ok" } }] }))
  })
})
await new Promise((r) => upstreamServer.listen(0, "127.0.0.1", r))
const upstreamBase = `http://127.0.0.1:${upstreamServer.address().port}`

const config = CONFIG.validateConfig({ host: "127.0.0.1", providers: [], embedding: { baseURL: `${upstreamBase}/v1`, model: "bge-m3" } })
const routes = SERVER.createRouteTable()
const runtime = GATEWAY.registerGatewayRoutes(routes, { db, config })
PROVIDER_ADMIN.registerProviderAdminRoutes(routes, { db, config, runtime })
ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
ADMIN_ROUTES.registerAdminRoutes(routes, { db })
METERING_ROUTES.registerMeteringRoutes(routes, { db })
SYSTEM.registerSystemRoutes(routes, { db, version: "0.0.0-look", getUpdateStatus: () => null, embedding: config.embedding })
OVERVIEW.registerOverviewRoutes(routes, { db })
EMBEDDING_ADMIN.registerEmbeddingAdminRoutes(routes, { db, config })
const server = SERVER.createGatewayServer({ config, routes, staticSite: STATIC.createStaticSite() })
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const BASE = `http://127.0.0.1:${server.address().port}`
console.log("[svc] listening", BASE, "| upstream", upstreamBase)

// ── 无头浏览器 ──────────────────────────────────────────────────────────────
const profile = mkdtempSync(join(tmpdir(), "tc-look-"))
const child = spawn(BROWSER, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank"], { stdio: "ignore", detached: process.platform !== "win32" })
const portFile = join(profile, "DevToolsActivePort")
for (let i = 0; i < 240 && !existsSync(portFile); i++) await sleep(50)
if (!existsSync(portFile)) { console.error("[err] DevToolsActivePort 未出现（浏览器启动失败）"); process.exit(1) }
const port = Number(readFileSync(portFile, "utf8").split("\n")[0])
console.log("[cdp] port", port)

let tab
try { tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json() }
catch { tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`)).json() }
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("ws error")) })
let idc = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result) }
}
const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++idc; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })) })
const eva = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error("eval: " + JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails))
  return r.result?.value
}
const report = { base: BASE, browser: BROWSER, shots: [], readings: {}, errors: [] }
const shot = async (name, note) => {
  const r = await cdp("Page.captureScreenshot", { format: "png" })
  const p = join(OUT, name)
  writeFileSync(p, Buffer.from(r.data, "base64"))
  report.shots.push({ path: p, note })
  console.log("[shot]", name, note)
}

await cdp("Page.enable"); await cdp("Runtime.enable")
await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp("Page.navigate", { url: `${BASE}/` })
await eva(`new Promise((r) => { if (document.readyState === "complete") return r(1); addEventListener("load", () => r(1)) })`)
await sleep(400)
report.readings.title = await eva("document.title")
report.readings.hash0 = await eva("location.hash")
await shot("console-look-1-login.png", "login page")

const logged = await eva(`(async () => {
  const form = document.querySelector("form")
  const inputs = [...form.querySelectorAll("input")]
  inputs[0].value = "admin"; inputs[1].value = "password-123"
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  for (let i = 0; i < 120; i++) { if (location.hash !== "#/login") break; await new Promise((r) => setTimeout(r, 50)) }
  await new Promise((r) => setTimeout(r, 500))
  return { hash: location.hash, links: [...document.querySelectorAll("a[href^='#/']")].map((a) => ({ text: a.textContent.trim(), href: a.getAttribute("href") })).slice(0, 20) }
})()`)
report.readings.afterLogin = logged
console.log("[login]", JSON.stringify({ hash: logged.hash, links: logged.links.length }))

let idx = 2
const ROUTES = ["/admin/overview", "/admin/members", "/admin/providers", "/admin/models", "/admin/usage", "/admin/audit", "/admin/system", "/me/keys", "/me/usage", "/me/account"]
for (const path of ROUTES) {
  const name = path.replace(/[#/]+/g, "-").replace(/^-/, "")
  try {
    await eva(`location.hash = ${JSON.stringify("#" + path)}; 1`)
    await sleep(800)
    const pageInfo = await eva(`(() => { const a = document.getElementById("app"); const txt = a ? String(a.innerText ?? a.textContent ?? "").replace(/\\s+/g, " ").slice(0, 400) : "(no app root)"; const btns = [...document.querySelectorAll("button")].map((b) => String(b.textContent ?? "").trim()).filter(Boolean).slice(0, 15); return { text: txt, buttons: btns, hash: location.hash } })()`)
    report.readings[name] = pageInfo
    await shot(`console-look-${idx}-${name}.png`, path)
    idx++
  } catch (e) { report.errors.push({ path, error: String(e) }) }
}

writeFileSync(join(OUT, "console-look.json"), JSON.stringify(report, null, 2), "utf8")
if (process.platform === "win32") { try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }) } catch {} }
else { try { process.kill(-child.pid, "SIGKILL") } catch { try { child.kill("SIGKILL") } catch {} } }
ws.close()
server.closeAllConnections?.(); server.close()
upstreamServer.closeAllConnections?.(); upstreamServer.close()
db.close()
console.log("[done] report =", join(OUT, "console-look.json"))
process.exit(0)
