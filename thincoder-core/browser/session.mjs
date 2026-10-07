/**
 * browser/session.mjs — 会话单例：惰性开启 ∥ 串行队列 ∥ 生命周期 ∥ 页原语 ∥ 安全助手 ∥ 分发表 ∥ 会话句柄。
 * 设计权威 = `docs/core/design/BROWSER-TOOL.md` §2.4（会话模型）∥ §2.5（数据流）∥ §2.9–§2.10（动作预算 /
 * 会话健康）∥ §3（安全面）∥ §5（拆分决定）。
 *
 * 单会话/进程（KD-5）：同进程所有 agent 共一份浏览器；动作串行（同一队列——批并行调用天然排队）。
 * 硬超时（§2.9）：每动作入队即记预算 deadline（队列等待计入——有意），到点由 `queue.mjs` 动作控制器中止
 * （错误句携卡点步名）；一切 CDP 命令经本档 `cdpCall` 单点接线（步名 = 方法名 ∥ 中止守卫 ∥ abort 后快速失败）。
 * 会话健康（§2.10）：进程事件 ∥ 连接事件 ∥ 入口探针三源；外部关闭 ⇒ `failSession` 单点（拒在飞 ⇒ 态复位
 * ⇒ 释放 profile 锁 ⇒ 置重开注记），下一次动作自愈重开（首回执尾行注记——置位一次，发出即清）。
 * `headless` = 会话开启参数（KD-4：异值报错，不热切）；空闲 15 分钟自动关（KD-8）+ 进程退出杀树兜底。
 * 动作实施层 = `actions.mjs`（基线八）+ `input-actions.mjs`（新七）+ `clipboard.mjs`——经会话句柄取能力，
 * 不 import 本档（DAG 单向：`session → {actions, input-actions, clipboard} → {input, snapshot, cdp}`；`session → queue`，§5）。
 *
 * 注入缝（N-BT6）：`_deps.openBrowser` ∥ `_deps.killBrowser` ∥ `_deps.saveShot`——缺省 null ⇒
 * 回落真实现（`??`）；用例注入后 `finally` 还原。
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { ACTIONS } from "./actions.mjs"
import { CLIPBOARD_ACTIONS } from "./clipboard.mjs"
import { INPUT_ACTIONS } from "./input-actions.mjs"
import { DEFAULT_CALL_TIMEOUT_MS, connectCdp, newTabWebSocketUrl } from "./cdp.mjs"
import { acquireProfileLock, browserPaths, killBrowser, launchBrowser, releaseProfileLock, resolveBrowser } from "./launch.mjs"
import { createActionQueue } from "./queue.mjs"
import {
  COMPACT_ROWS, DEFAULT_MAX, MAX_ELEMENTS, assignRefs, createRefTable, focusExpression, normalizeSnapshot,
  pageInfoExpression, renderSnapshot, snapshotExpression,
} from "./snapshot.mjs"

export const IDLE_MS = 15 * 60 * 1000
const READY_TIMEOUT_MS = 10_000
const NAV_SETTLE_MS = 1_000
const GRACEFUL_CLOSE_MS = 3_000
const CLOSE_CALL_MS = 3_000 // `Browser.close` 显式帽（§2.9 层二）
const ENABLE_CALL_MS = 10_000 // `Page/Runtime/Network.enable` 显式帽（§2.9 层二）
const PROBE_TIMEOUT_MS = 2_000 // 健康探针心跳帽（§2.9 层二 / §2.10 源③）
const PROBE_FRESH_MS = 5_000 // 距上次成功 CDP 活动 >5s 才做心跳（§2.10 源③）
const CALL_CAP_SLACK_MS = 1_000 // 动作内调用兜底帽对剩余预算的余量（预算先行：控制器先于兜底帽裁决）
const REOPEN_NOTE = "[note: the previous browser session was closed externally — a fresh session was opened (page state lost; profile/login kept)]"

/** 测试替身缝（缺省 null ⇒ 回落真实现）。 */
export const _deps = { openBrowser: null, killBrowser: null, saveShot: null }

/** 在飞动作的控制器（§2.9——单动作单控制器；串行队列 ⇒ 同刻至多一个）。 */
let currentController = null

const queue = createActionQueue()

const sleep = (ms) => (currentController ? currentController.sleep(ms) : new Promise((r) => setTimeout(r, ms)))

/** 控制器接线（无控制器 ⇒ 直通）：步名帧 + 中止守卫（§2.9）。 */
function runFrame(name, work) {
  return currentController ? currentController.run(name, work) : work()
}

const state = {
  cdp: null,
  child: null,
  lockPath: null,
  headless: null,
  table: createRefTable(),
  lastUrl: null,
  lastTitle: null,
  lastActivityAt: 0,
  idleTimer: null,
  reopenNote: false,
  net: { inflight: new Set(), lastEventAt: 0 },
}

// ── 生命周期 ────────────────────────────────────────────────────────────────

/** 真实现：发现 → profile 锁 → spawn → `/json/new` → WebSocket → 三域 enable（§2.4 开启序）。
 *  开启段中途中止 ⇒ 连接复位 + 杀树兜底（含「launch 未返回」窗口：结算即补杀）+ 释放 profile 锁；置重开注记在 ensureSession。 */
async function openBrowserReal({ headless }) {
  const exe = resolveBrowser()
  const paths = browserPaths()
  acquireProfileLock(paths.lock)
  let child = null, conn = null, launching = null
  try {
    const launched = await runFrame("launch browser", () => (launching = launchBrowser({ exe, headless, profile: paths.profile })))
    child = launched.child
    const wsUrl = await runFrame("connect CDP", () => newTabWebSocketUrl(launched.port))
    conn = await runFrame("connect CDP", () => connectCdp(wsUrl))
    for (const domain of ["Page.enable", "Runtime.enable", "Network.enable"]) {
      await runFrame(domain, () => conn.call(domain, {}, { timeoutMs: ENABLE_CALL_MS }))
    }
    return { cdp: conn, child, headless, lock: paths.lock }
  } catch (e) {
    try { conn?.close() } catch { /* 已断 */ }
    // 中止落在「launch 未返回」窗口 ⇒ child 未赋值：自启仍会结算 ⇒ 结算即补杀（§2.9 开启段中止——防孤儿）
    if (child) { try { (_deps.killBrowser ?? killBrowser)(child) } catch { /* 已退出 */ } }
    else if (launching) launching.then((l) => { try { (_deps.killBrowser ?? killBrowser)(l.child) } catch { /* 已退出 */ } }, () => { /* 自启自败（其内已杀树） */ })
    releaseProfileLock(paths.lock)
    throw e
  }
}

/** 会话态复位（关闭 ∥ 外部关闭共用单点）。 */
function resetState() {
  disarmIdle()
  state.cdp = null
  state.child = null
  state.lockPath = null
  state.headless = null
  state.lastUrl = null
  state.lastTitle = null
  state.lastActivityAt = 0
  state.table = createRefTable()
  state.net = { inflight: new Set(), lastEventAt: 0 }
}

function armIdle() {
  if (state.idleTimer) clearTimeout(state.idleTimer)
  state.idleTimer = setTimeout(() => {
    // 走串行队列：空闲关不与在途动作交错（下一动作排在关后——同 profile 不会双开）
    queue.chain(() => closeSession()).catch(() => { /* 空闲关失败不逸出 */ })
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

// ── 会话健康（§2.10——外部关闭可感知 + 自愈）────────────────────────────────

/** 外部关闭显式失败句（§2.10）：在飞动作与入口探针同一句式。 */
function externalCloseError(cause) {
  const error = new Error(`the browser session was closed externally (${cause}) — run the action again to reopen a fresh session`)
  error.sessionLost = true
  return error
}

/** 处置单点（§2.10）：拒在飞（同一因由实例）⇒ 态复位 ⇒ 释放 profile 锁（子进程仍活 ⇒ 杀树兜底）⇒ 置重开注记。
 *  不调 `Browser.close`、不等自退（连接 / 进程已死）。 */
function failSession(cause) {
  const error = externalCloseError(cause)
  currentController?.abort("session-lost", error)
  const { cdp, child, lockPath } = state
  resetState()
  if (cdp) { try { cdp.close() } catch { /* 已断 */ } }
  if (child) { try { (_deps.killBrowser ?? killBrowser)(child) } catch { /* 已退出 */ } }
  if (lockPath) releaseProfileLock(lockPath)
  state.reopenNote = true
  return error
}

/** 健康接线（§2.10 源①②）：子进程 exit/error ∥ WS 断连 ⇒ 即时失败化。 */
function attachSessionHealth(cdp) {
  const child = state.child
  if (child && typeof child.on === "function") {
    const gone = () => { if (state.child === child) failSession("the browser process exited") }
    child.on("exit", gone)
    child.on("error", gone)
  }
  cdp.onDisconnect?.(() => { if (state.cdp === cdp) failSession("the connection to the browser dropped") })
}

/** 入口探针（§2.10 源③）：子进程存活 ∧ 连接未关（恒检——零成本）；距上次成功活动 >5s ⇒ 心跳 `Browser.getVersion`（2s 帽）。 */
async function probeSession() {
  const child = state.child
  // 非真实子进程（无事件面的替身）⇒ 存活不可判——跳过该检（真实现恒有 ChildProcess 事件面）
  if (child && typeof child.on === "function" && (child.exitCode !== null || child.signalCode != null)) {
    throw failSession("the browser process exited")
  }
  if (state.cdp?.closed) throw failSession("the connection to the browser dropped")
  if (Date.now() - state.lastActivityAt < PROBE_FRESH_MS) return
  try {
    await cdpCall("Browser.getVersion", {}, { timeoutMs: PROBE_TIMEOUT_MS })
  } catch (e) {
    if (e?.browserAbort || e?.sessionLost) throw e // 预算中止 / 会话已失 ⇒ 原样上报（fresh 判据已由它裁决）
    throw failSession("the browser is not responding")
  }
}

/** 会话开启（惰性 + headless 一致性判据 + 入口探针）；开启段中止 ⇒ 置重开注记（半开态已由
 *  `openBrowserReal` 复位）——下一次动作干净重开，不中毒（§2.9 开启段中止）。 */
async function ensureSession(wanted) {
  if (state.cdp) {
    if (wanted !== undefined && wanted !== state.headless) {
      throw new Error(`session is already running (headless=${state.headless}) — close it first to switch mode`)
    }
    await probeSession()
    return
  }
  let opened
  try {
    opened = await runFrame("launch browser", () => (_deps.openBrowser ?? openBrowserReal)({ headless: wanted === undefined ? true : wanted }))
  } catch (e) {
    if (e?.browserAbort) state.reopenNote = true
    throw e
  }
  state.cdp = opened.cdp
  state.child = opened.child ?? null
  state.lockPath = opened.lock ?? null
  state.headless = opened.headless === undefined ? (wanted ?? true) : opened.headless
  state.table = createRefTable()
  state.net = { inflight: new Set(), lastEventAt: Date.now() }
  state.lastActivityAt = Date.now()
  const net = state.net
  opened.cdp.on("Network.requestWillBeSent", (p) => { net.inflight.add(p.requestId); net.lastEventAt = Date.now() })
  opened.cdp.on("Network.loadingFinished", (p) => { net.inflight.delete(p.requestId); net.lastEventAt = Date.now() })
  opened.cdp.on("Network.loadingFailed", (p) => { net.inflight.delete(p.requestId); net.lastEventAt = Date.now() })
  attachSessionHealth(opened.cdp)
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
 *  实测：直杀树不落盘 ⇒ 二段会话拿不到 Cookie），再等自退，未退才走杀树兜底。
 *  中止（预算 / 取消）⇒ 跳过优雅等待、直接杀树兜底，清理完成后以中止因由上报（§2.9 abort 语义）。 */
export async function closeSession() {
  const { cdp, child, lockPath } = state
  resetState()
  let aborted = null
  if (cdp) {
    try { await runFrame("Browser.close", () => cdp.call("Browser.close", {}, { timeoutMs: CLOSE_CALL_MS })) }
    catch (e) { if (e?.browserAbort) aborted = e /* 已断 ∥ 不支持 ∥ 中止 ⇒ 转杀树兜底 */ }
    try { cdp.close() } catch { /* 已断 */ }
  }
  if (child) {
    if (!aborted) {
      try { await runFrame("Browser.close", () => waitForExit(child, GRACEFUL_CLOSE_MS)) }
      catch (e) { if (e?.browserAbort) aborted = e }
    }
    if (aborted || child.exitCode == null) {
      try { (_deps.killBrowser ?? killBrowser)(child) } catch { /* 已退出 */ }
    }
  }
  if (lockPath) releaseProfileLock(lockPath)
  if (aborted) throw aborted
  return Boolean(cdp)
}

/** 审批请示面用的「最近页 URL」（§3.1 文案；无会话 ⇒ null）。 */
export function lastPageUrl() {
  return state.lastUrl
}

// ── 页原语 ──────────────────────────────────────────────────────────────────

/** 一切 CDP 命令的单点（§2.9 层一）：步名帧（方法名）∥ 中止守卫 ∥ abort 后快速失败；成功 ⇒ 记活动时刻。
 *  缺省帽（层三 15s）在动作预算内让位于控制器（预算先行——层一优先：兜底帽 = 剩余预算 + 1s 余量）；
 *  动作外路径按缺省帽兜底。 */
function cdpCall(method, params = {}, { timeoutMs } = {}) {
  const cdp = state.cdp
  if (!cdp) throw new Error("no browser session — run navigate first")
  const ctl = currentController
  ctl?.failIfAborted()
  const cap = timeoutMs ?? (ctl ? Math.max(DEFAULT_CALL_TIMEOUT_MS, ctl.remaining() + CALL_CAP_SLACK_MS) : DEFAULT_CALL_TIMEOUT_MS)
  const work = ctl ? ctl.run(method, () => cdp.call(method, params, { timeoutMs: cap })) : cdp.call(method, params, { timeoutMs: cap })
  return Promise.resolve(work).then(
    (result) => { state.lastActivityAt = Date.now(); return result },
    (e) => { if (ctl?.aborted) throw ctl.error; throw e },
  )
}

async function evalRaw(expression) {
  // CDP 形：`call()` 解到命令的 result（`{result: RemoteObject}`）——页面值在 `result.result.value`
  const r = await cdpCall("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
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
  return runFrame("waitForReady", async () => {
    const deadline = Date.now() + maxMs
    for (;;) {
      const info = await pageInfo()
      if (info.readyState === "complete" || Date.now() >= deadline) return info
      await sleep(100)
    }
  })
}

async function waitForUrlChange(before, maxMs = NAV_SETTLE_MS) {
  return runFrame("wait poll", async () => {
    const deadline = Date.now() + maxMs
    for (;;) {
      const info = await pageInfo()
      if (info.url !== before) return info.url
      if (Date.now() >= deadline) return null
      await sleep(100)
    }
  })
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

/** 等一条 CDP 事件（一次性；超时 / 中止 ⇒ 拒——html5 拖拽拦截链用）。 */
function once(method, timeoutMs = 10_000) {
  const ctl = currentController
  ctl?.failIfAborted()
  return new Promise((resolve, reject) => {
    if (!state.cdp) { reject(new Error("no browser session")); return }
    let timer = null
    let off = null
    let offAbort = null
    let done = false
    const finish = (fn, value) => {
      if (done) return
      done = true
      if (timer) clearTimeout(timer)
      off?.()
      offAbort?.()
      fn(value)
    }
    off = state.cdp.on(method, (params) => finish(resolve, params))
    offAbort = ctl?.onAbort(() => finish(reject, ctl.error))
    timer = setTimeout(() => finish(reject, new Error(`timed out waiting for ${method}`)), timeoutMs)
    timer.unref?.()
  })
}

const sessionHandle = {
  ensureSession: (args) => ensureSession(headlessOf(args)),
  closeSession,
  connection: () => state.cdp,
  call: (method, params) => cdpCall(method, params),
  once: (method, timeoutMs) => runFrame(method, () => once(method, timeoutMs)),
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
  step: (name, fn) => runFrame(name, fn),
  sleep,
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

/** 自愈重开注记（§2.10）：重开后第一条回执尾行注记——置位一次，发出即清。 */
function sealNote(receipt) {
  if (!state.reopenNote || !state.cdp) return receipt
  state.reopenNote = false
  return `${receipt}\n${REOPEN_NOTE}`
}

async function runSerial(action, args, ctx, ctl) {
  ctl.failIfAborted() // 排队期已到点 ⇒ 动作从未起执行（无展开）
  try {
    return sealNote(await dispatchAction(action, args, ctx))
  } catch (e) {
    if (e?.pageReceipt) return sealNote(await failureReceipt(e.message))
    throw e
  } finally {
    if (state.cdp) armIdle() // 任何动作重置空闲计时（KD-8）
  }
}

/** 动作入口：串行队列 + 单时钟动作预算（§2.9——deadline 自入队起算；批并行调用按调用序排队）。 */
export function runAction(action, args, ctx) {
  return queue.enqueue(action, args, (ctl) => {
    currentController = ctl
    return runSerial(action, args, ctx, ctl).finally(() => { currentController = null })
  })
}
