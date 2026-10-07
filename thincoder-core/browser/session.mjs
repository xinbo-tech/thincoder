/**
 * browser/session.mjs — 会话单例：惰性开启 ∥ 串行队列 ∥ 八动作 ∥ 引用寻址 ∥ 空闲自动关 ∥ 关闭清场。
 * 设计权威 = `docs/core/design/BROWSER-TOOL.md` §2.2（动作契约）∥ §2.4（会话模型）∥ §3（安全面）。
 *
 * 单会话/进程（KD-5）：同进程所有 agent 共一份浏览器；动作串行（promise 链——批并行调用天然排队）。
 * `headless` = 会话开启参数（KD-4：异值报错，不热切）；空闲 15 分钟自动关（KD-8）+ 进程退出杀树兜底。
 *
 * 注入缝（N-BT6）：`_deps.openBrowser` ∥ `_deps.killBrowser` ∥ `_deps.saveShot`——缺省 null ⇒
 * 回落真实现（`??`）；用例注入后 `finally` 还原。
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { connectCdp, newTabWebSocketUrl } from "./cdp.mjs"
import { acquireProfileLock, browserPaths, killBrowser, launchBrowser, releaseProfileLock, resolveBrowser } from "./launch.mjs"
import {
  COMPACT_ROWS, DEFAULT_MAX, MAX_ELEMENTS, assignRefs, clickExpression, createRefTable, normalizeSnapshot,
  pageInfoExpression, renderSnapshot, snapshotExpression, truncateText, typeExpression, waitExpression,
} from "./snapshot.mjs"

export const IDLE_MS = 15 * 60 * 1000
export const WAIT_TIMEOUT_DEFAULT = 30_000
export const WAIT_TIMEOUT_MAX = 120_000
export const WAIT_POLL_MS = 150
export const NETWORK_QUIET_MS = 500
export const MAX_EVAL_CHARS = 8_000
const READY_TIMEOUT_MS = 10_000
const NAV_SETTLE_MS = 1_000
const GRACEFUL_CLOSE_MS = 3_000

/** 测试替身缝（缺省 null ⇒ 回落真实现）。 */
export const _deps = { openBrowser: null, killBrowser: null, saveShot: null }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const state = {
  cdp: null,
  child: null,
  lockPath: null,
  headless: null,
  table: createRefTable(),
  lastUrl: null,
  lastTitle: null,
  queue: Promise.resolve(),
  idleTimer: null,
  net: { inflight: new Set(), lastEventAt: 0 },
}

// ── 生命周期 ────────────────────────────────────────────────────────────────

/** 真实现：发现 → profile 锁 → spawn → `/json/new` → WebSocket → 三域 enable（§2.4 开启序）。 */
async function openBrowserReal({ headless }) {
  const exe = resolveBrowser()
  const paths = browserPaths()
  acquireProfileLock(paths.lock)
  let child = null
  try {
    const launched = await launchBrowser({ exe, headless, profile: paths.profile })
    child = launched.child
    const wsUrl = await newTabWebSocketUrl(launched.port)
    const cdp = await connectCdp(wsUrl)
    await cdp.call("Page.enable")
    await cdp.call("Runtime.enable")
    await cdp.call("Network.enable")
    return { cdp, child, headless, lock: paths.lock }
  } catch (e) {
    if (child) killBrowser(child)
    releaseProfileLock(paths.lock)
    throw e
  }
}

function armIdle() {
  if (state.idleTimer) clearTimeout(state.idleTimer)
  state.idleTimer = setTimeout(() => {
    // 走串行队列：空闲关不与在途动作交错（下一动作排在关后——同 profile 不会双开）
    state.queue = state.queue.then(() => closeSession()).catch(() => { /* 空闲关失败不逸出 */ })
  }, IDLE_MS)
  state.idleTimer.unref?.() // 不为一台浏览器吊住宿主进程
}

function disarmIdle() {
  if (state.idleTimer) { clearTimeout(state.idleTimer); state.idleTimer = null }
}

let exitHooked = false
function registerExitHook() {
  if (exitHooked) return
  exitHooked = true
  process.once("exit", () => { if (state.child) (_deps.killBrowser ?? killBrowser)(state.child) })
}

/** 会话开启（惰性 + headless 一致性判据）。 */
async function ensureSession(wanted) {
  if (state.cdp) {
    if (wanted !== undefined && wanted !== state.headless) {
      throw new Error(`session is already running (headless=${state.headless}) — close it first to switch mode`)
    }
    return
  }
  const opened = await (_deps.openBrowser ?? openBrowserReal)({ headless: wanted === undefined ? true : wanted })
  state.cdp = opened.cdp
  state.child = opened.child ?? null
  state.lockPath = opened.lock ?? null
  state.headless = opened.headless === undefined ? (wanted ?? true) : opened.headless
  state.table = createRefTable()
  state.net = { inflight: new Set(), lastEventAt: Date.now() }
  const net = state.net
  opened.cdp.on("Network.requestWillBeSent", (p) => { net.inflight.add(p.requestId); net.lastEventAt = Date.now() })
  opened.cdp.on("Network.loadingFinished", (p) => { net.inflight.delete(p.requestId); net.lastEventAt = Date.now() })
  opened.cdp.on("Network.loadingFailed", (p) => { net.inflight.delete(p.requestId); net.lastEventAt = Date.now() })
  registerExitHook()
  armIdle()
}

/** 等子进程自退（优雅关后）。 */
async function waitForExit(child, maxMs) {
  const deadline = Date.now() + maxMs
  while (child.exitCode == null && Date.now() < deadline) await sleep(100)
}

/** 关闭会话（幂等）；返回是否有会话被关。
 *  先 `Browser.close` 优雅关（浏览器自行落盘 profile——Cookie/localStorage 持久化是 F-BT6 的落盘前提；
 *  实测：直杀树不落盘 ⇒ 二段会话拿不到 Cookie），再等自退，未退才走杀树兜底。 */
export async function closeSession() {
  disarmIdle()
  const { cdp, child, lockPath } = state
  state.cdp = null
  state.child = null
  state.lockPath = null
  state.headless = null
  state.lastUrl = null
  state.lastTitle = null
  state.table = createRefTable()
  state.net = { inflight: new Set(), lastEventAt: 0 }
  if (cdp) {
    try { await cdp.call("Browser.close") } catch { /* 已断 ∥ 不支持 ⇒ 直接转杀树兜底 */ }
    try { cdp.close() } catch { /* 已断 */ }
  }
  if (child) {
    await waitForExit(child, GRACEFUL_CLOSE_MS)
    if (child.exitCode == null) {
      try { (_deps.killBrowser ?? killBrowser)(child) } catch { /* 已退出 */ }
    }
  }
  if (lockPath) releaseProfileLock(lockPath)
  return Boolean(cdp)
}

/** 审批请示面用的「最近页 URL」（§3.1 文案；无会话 ⇒ null）。 */
export function lastPageUrl() {
  return state.lastUrl
}

// ── 页面侧原语 ──────────────────────────────────────────────────────────────

async function evalRaw(expression) {
  // CDP 形：`call()` 解到命令的 result（`{result: RemoteObject}`）——页面值在 `result.result.value`
  const r = await state.cdp.call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
  if (r?.exceptionDetails) throw pageError(exceptionText(r.exceptionDetails)) // 页面侧异常 ⇒ 同失败回执面（带页摘）
  return r?.result?.value
}

function exceptionText(details) {
  const raw = details?.exception?.description ?? details?.text ?? "unknown page exception"
  return String(raw).split("\n")[0]
}

async function pageInfo() {
  const v = await evalRaw(pageInfoExpression())
  const info = { url: String(v?.url ?? ""), title: String(v?.title ?? ""), readyState: String(v?.readyState ?? "") }
  state.lastUrl = info.url
  state.lastTitle = info.title
  return info
}

async function waitForReady(maxMs = READY_TIMEOUT_MS) {
  const deadline = Date.now() + maxMs
  for (;;) {
    const info = await pageInfo()
    if (info.readyState === "complete" || Date.now() >= deadline) return info
    await sleep(100)
  }
}

async function waitForUrlChange(before, maxMs = NAV_SETTLE_MS) {
  const deadline = Date.now() + maxMs
  for (;;) {
    const info = await pageInfo()
    if (info.url !== before) return info.url
    if (Date.now() >= deadline) return null
    await sleep(100)
  }
}

/** 取快照 + 分配引用 + 渲染（会话内单一快照点）。 */
async function takeSnapshot({ selector = null, max = DEFAULT_MAX } = {}) {
  const wanted = Number(max)
  const capped = Math.max(1, Math.min(Number.isFinite(wanted) ? Math.floor(wanted) : DEFAULT_MAX, MAX_ELEMENTS))
  const snap = normalizeSnapshot(await evalRaw(snapshotExpression({ selector, max: capped })))
  if (snap.missing) {
    throw pageError(`snapshot selector "${selector}" matched nothing — pass a CSS selector present on the page`)
  }
  const rows = assignRefs(state.table, snap.elements)
  state.lastUrl = snap.url
  state.lastTitle = snap.title
  return {
    url: snap.url,
    title: snap.title,
    total: snap.total,
    rows,
    text: renderSnapshot({ url: snap.url, title: snap.title, rows, total: snap.total }),
  }
}

// ── 安全面 ──────────────────────────────────────────────────────────────────

/** 域允许清单匹配（§3.2）：全等（大小写不敏感）∥ `*.` 前缀 = 子域通配。 */
export function hostAllowed(host, list) {
  const h = String(host).toLowerCase()
  return list.some((entry) => {
    const pattern = String(entry ?? "").trim().toLowerCase()
    if (!pattern) return false
    if (pattern.startsWith("*.")) return h.endsWith(`.${pattern.slice(2)}`)
    return h === pattern
  })
}

function allowDomainsOf(ctx) {
  const list = ctx?.agent?.config?.browser?.allowDomains
  return Array.isArray(list) ? list : []
}

/** 域强检（navigate 目标 ∥ click/evaluate/type 当前页——§3.2 两点）。 */
function assertHostAllowed(url, ctx) {
  const list = allowDomainsOf(ctx)
  if (list.length === 0) return
  let host = ""
  try { host = new URL(url).hostname } catch { return }
  if (!hostAllowed(host, list)) {
    throw new Error(`blocked by browser.allowDomains — host "${host}" not allowed`)
  }
}

/** 失败回执（§2.2）：`Error: <因由>` + 页摘 + 紧凑清单（≤30 行——页不可读时仅错误行）。 */
async function failureReceipt(message) {
  const parts = [`Error: ${message}`]
  if (state.cdp) {
    try { parts.push((await takeSnapshot({ max: COMPACT_ROWS })).text) } catch { /* 页不可读 ⇒ 仅错误行 */ }
  }
  return parts.join("\n")
}

function pageError(message) {
  const err = new Error(message)
  err.pageReceipt = true
  return err
}

// ── 八动作 ──────────────────────────────────────────────────────────────────

function headlessOf(args) {
  return typeof args?.headless === "boolean" ? args.headless : undefined
}

function normalizeHttpUrl(value) {
  const raw = String(value ?? "")
  let url
  try { url = new URL(raw) } catch { url = null }
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) {
    throw new Error(`navigate requires an http/https url — got "${raw}"`)
  }
  return url.toString()
}

function resolveRef(ref) {
  const entry = state.table.byRef.get(String(ref))
  if (!entry) throw pageError(`ref ${ref} is stale (was "unknown") — run snapshot again`)
  return entry
}

async function actNavigate(args, ctx) {
  const url = normalizeHttpUrl(args.url)
  assertHostAllowed(url, ctx) // 静态参数面先检——被拦的 host 不得起浏览器（§3.2「不执行」）
  await ensureSession(headlessOf(args))
  await state.cdp.call("Page.navigate", { url })
  await waitForReady()
  const snap = await takeSnapshot({ max: DEFAULT_MAX })
  return `[navigate] ${snap.url}\n${snap.text}`
}

async function actSnapshot(args) {
  await ensureSession(headlessOf(args))
  const snap = await takeSnapshot({ selector: args.selector ?? null, max: args.max ?? DEFAULT_MAX })
  return snap.text
}

async function actClick(args, ctx) {
  await ensureSession(headlessOf(args))
  const info = await pageInfo()
  assertHostAllowed(info.url, ctx)
  const entry = resolveRef(args.ref)
  const res = await evalRaw(clickExpression(entry.selector, entry.tag))
  if (!res?.found || res.tag) throw pageError(`ref ${args.ref} is stale (was "${entry.name}") — run snapshot again`)
  if (res.disabled) throw pageError(`ref ${args.ref} is disabled ("${entry.name}")`)
  const out = [`[click] ${args.ref} "${entry.name}"`]
  const landed = await waitForUrlChange(info.url)
  if (landed) {
    await waitForReady()
    const snap = await takeSnapshot({ max: DEFAULT_MAX })
    out.push(`[navigated] ${snap.url}`, snap.text)
  } else {
    out.push("[no navigation]")
  }
  return out.join("\n")
}

async function actType(args, ctx) {
  await ensureSession(headlessOf(args))
  const info = await pageInfo()
  assertHostAllowed(info.url, ctx)
  const entry = resolveRef(args.ref)
  const text = String(args.text)
  const res = await evalRaw(typeExpression(entry.selector, entry.tag, text, args.clear === true))
  if (!res?.found || res.tag) throw pageError(`ref ${args.ref} is stale (was "${entry.name}") — run snapshot again`)
  if (res.fillable === false) {
    throw pageError(`ref ${args.ref} is not a fillable field ("${entry.name}", <${entry.tag}>) — use snapshot to pick an input/textarea`)
  }
  if (res.disabled) throw pageError(`ref ${args.ref} is disabled ("${entry.name}")`)
  return `[type] ${args.ref} "${entry.name}" ← ${text.length} chars${res.password ? " (hidden)" : ""}`
}

async function actEvaluate(args, ctx) {
  await ensureSession(headlessOf(args))
  const info = await pageInfo()
  assertHostAllowed(info.url, ctx)
  const r = await state.cdp.call("Runtime.evaluate", {
    expression: String(args.expression),
    awaitPromise: true,
    returnByValue: true,
  })
  if (r?.exceptionDetails) throw pageError(`evaluate failed: ${exceptionText(r.exceptionDetails)}`)
  return `[evaluate @ ${info.url}] ${truncateText(jsonOf(r?.result?.value), MAX_EVAL_CHARS, "narrow the expression")}`
}

function jsonOf(value) {
  if (value === undefined) return "undefined"
  try { return JSON.stringify(value) ?? String(value) }
  catch { return String(value) }
}

function waitPredicate(args) {
  if (args.networkIdle === true) return { kind: "networkIdle", value: null, label: "networkIdle" }
  for (const kind of ["selector", "text", "url"]) {
    const value = args[kind]
    if (typeof value === "string" && value !== "") return { kind, value, label: `${kind} ${JSON.stringify(value)}` }
  }
  // 工具层已校验互斥（§2.2）——此处兜底（直调会话面时同样不悬挂）
  throw new Error("wait requires exactly one of selector|text|url|networkIdle")
}

async function actWait(args) {
  await ensureSession(headlessOf(args))
  const pred = waitPredicate(args)
  const wanted = Number(args.timeoutMs)
  const timeoutMs = Math.max(1, Math.min(Number.isFinite(wanted) && wanted > 0 ? wanted : WAIT_TIMEOUT_DEFAULT, WAIT_TIMEOUT_MAX))
  const started = Date.now()
  for (;;) {
    if (pred.kind === "networkIdle") {
      if (state.net.inflight.size === 0 && Date.now() - state.net.lastEventAt >= NETWORK_QUIET_MS) break
    } else if (await evalRaw(waitExpression(pred.kind, pred.value)) === true) break
    if (Date.now() - started >= timeoutMs) throw pageError(`wait timed out after ${timeoutMs}ms (${pred.label})`)
    await sleep(WAIT_POLL_MS)
  }
  return `[wait] ${pred.label} — ok after ${Date.now() - started}ms`
}

/** 真落盘（screenshot 缝的缺省实现）：`~/.thincoder/browser/shots/shot-<ISO>.png`。 */
async function saveShotToDisk(buffer) {
  const dir = browserPaths().shots
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `shot-${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}.png`)
  writeFileSync(path, buffer)
  return { path, bytes: buffer.length }
}

async function actScreenshot(args) {
  await ensureSession(headlessOf(args))
  const shot = await state.cdp.call("Page.captureScreenshot", {
    format: "png",
    ...(args.fullPage === true ? { captureBeyondViewport: true } : {}),
  })
  if (typeof shot?.data !== "string") throw new Error("screenshot failed: the browser returned no image data")
  const saved = await (_deps.saveShot ?? saveShotToDisk)(Buffer.from(shot.data, "base64"))
  return `[screenshot] ${saved.path} (${saved.bytes} bytes)`
}

async function actClose() {
  if (!state.cdp) return "[close] no browser session"
  await closeSession()
  return "[close] browser session closed"
}

// ── 入口 ────────────────────────────────────────────────────────────────────

async function dispatchAction(action, args, ctx) {
  switch (action) {
    case "navigate": return actNavigate(args, ctx)
    case "snapshot": return actSnapshot(args)
    case "click": return actClick(args, ctx)
    case "type": return actType(args, ctx)
    case "evaluate": return actEvaluate(args, ctx)
    case "wait": return actWait(args)
    case "screenshot": return actScreenshot(args)
    case "close": return actClose()
    default: throw new Error(`unknown browser action "${action}"`)
  }
}

async function runSerial(action, args, ctx) {
  try {
    return await dispatchAction(action, args, ctx)
  } catch (e) {
    if (e?.pageReceipt) return failureReceipt(e.message)
    throw e
  } finally {
    if (state.cdp) armIdle() // 任何动作重置空闲计时（KD-8）
  }
}

/** 动作入口：串行队列（批并行工具调用按调用序排队——§2.4）。 */
export function runAction(action, args, ctx) {
  const next = state.queue.then(() => runSerial(action, args, ctx))
  state.queue = next.then(() => { /* 保持链活 */ }, () => { /* 失败不断链 */ })
  return next
}
