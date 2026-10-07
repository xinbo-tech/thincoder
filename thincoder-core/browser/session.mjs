/**
 * browser/session.mjs — 会话单例：惰性开启 ∥ 串行队列 ∥ 生命周期 ∥ 页原语 ∥ 安全助手 ∥ 分发表 ∥ 会话句柄。
 * 设计权威 = `docs/core/design/BROWSER-TOOL.md` §2.4（会话模型）∥ §2.5（数据流）∥ §3（安全面）∥ §5（拆分决定）。
 *
 * 单会话/进程（KD-5）：同进程所有 agent 共一份浏览器；动作串行（promise 链——批并行调用天然排队）。
 * `headless` = 会话开启参数（KD-4：异值报错，不热切）；空闲 15 分钟自动关（KD-8）+ 进程退出杀树兜底。
 * 动作实施层 = `actions.mjs`（基线八）+ `input-actions.mjs`（新七）+ `clipboard.mjs`——经会话句柄取能力，
 * 不 import 本档（DAG 单向：`session → {actions, input-actions, clipboard} → {input, snapshot, cdp}`，§5）。
 *
 * 注入缝（N-BT6）：`_deps.openBrowser` ∥ `_deps.killBrowser` ∥ `_deps.saveShot`——缺省 null ⇒
 * 回落真实现（`??`）；用例注入后 `finally` 还原。
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { ACTIONS } from "./actions.mjs"
import { CLIPBOARD_ACTIONS } from "./clipboard.mjs"
import { INPUT_ACTIONS } from "./input-actions.mjs"
import { connectCdp, newTabWebSocketUrl } from "./cdp.mjs"
import { acquireProfileLock, browserPaths, killBrowser, launchBrowser, releaseProfileLock, resolveBrowser } from "./launch.mjs"
import {
  COMPACT_ROWS, DEFAULT_MAX, MAX_ELEMENTS, assignRefs, createRefTable, focusExpression, normalizeSnapshot,
  pageInfoExpression, renderSnapshot, snapshotExpression,
} from "./snapshot.mjs"

export const IDLE_MS = 15 * 60 * 1000
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

function headlessOf(args) {
  return typeof args?.headless === "boolean" ? args.headless : undefined
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

// ── 页原语 ──────────────────────────────────────────────────────────────────

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

/** ref → 引用表条目（未在表 ⇒ 同 stale 句式——§2.3 失效口径）。 */
function resolveRef(ref) {
  const entry = state.table.byRef.get(String(ref))
  if (!entry) throw pageError(`ref ${ref} is stale (was "unknown") — run snapshot again`)
  return entry
}

/** ref → 聚焦（§2.7）：表查 + `focusExpression`；不可聚焦 ⇒ 明示拒（不静默错投）。 */
async function focusRef(ref) {
  const entry = resolveRef(ref)
  const f = await evalRaw(focusExpression(entry.selector, entry.tag))
  if (!f?.found || f.tag) throw pageError(`ref ${ref} is stale (was "${entry.name}") — run snapshot again`)
  if (f.focused === false) throw pageError(`ref ${ref} "${entry.name}" is not focusable — keys would go to another element`)
  return { ref, name: entry.name, label: `${ref} "${entry.name}"` }
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

/** 真落盘（screenshot 缝的缺省实现）：`~/.thincoder/browser/shots/shot-<ISO>.png`。 */
async function saveShotToDisk(buffer) {
  const dir = browserPaths().shots
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `shot-${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}.png`)
  writeFileSync(path, buffer)
  return { path, bytes: buffer.length }
}

// ── 会话句柄（动作模块的能力面——§5：动作模块不 import 本档）──────────────────

/** 等一条 CDP 事件（一次性；超时 ⇒ 拒——html5 拖拽拦截链用）。 */
function once(method, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    if (!state.cdp) { reject(new Error("no browser session")); return }
    let timer = null
    const off = state.cdp.on(method, (params) => {
      if (timer) clearTimeout(timer)
      off()
      resolve(params)
    })
    timer = setTimeout(() => { off(); reject(new Error(`timed out waiting for ${method}`)) }, timeoutMs)
    timer.unref?.()
  })
}

const sessionHandle = {
  ensureSession: (args) => ensureSession(headlessOf(args)),
  closeSession,
  connection: () => state.cdp,
  call: (method, params) => {
    if (!state.cdp) throw new Error("no browser session — run navigate first")
    return state.cdp.call(method, params)
  },
  once,
  evalRaw,
  pageInfo,
  waitForReady: (maxMs) => waitForReady(maxMs),
  waitForUrlChange: (before, maxMs) => waitForUrlChange(before, maxMs),
  takeSnapshot,
  resolveRef,
  focusRef,
  assertHostAllowed,
  failureReceipt,
  pageError,
  saveShot: (buffer) => (_deps.saveShot ?? saveShotToDisk)(buffer),
  networkState: () => state.net,
}

// ── 分发表 ∥ 入口 ────────────────────────────────────────────────────────────

const ACTION_TABLE = { ...ACTIONS, ...INPUT_ACTIONS, ...CLIPBOARD_ACTIONS }

async function dispatchAction(action, args, ctx) {
  const handler = ACTION_TABLE[action]
  if (typeof handler !== "function") throw new Error(`unknown browser action "${action}"`)
  return handler(args, ctx, sessionHandle)
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
