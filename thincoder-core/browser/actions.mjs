/**
 * browser/actions.mjs — 基线八动作实现（navigate / snapshot / click / type / evaluate / wait / screenshot / close）
 * （BROWSER-TOOL.md §2.2 ∥ §2.4；KD-10：click / type 内部选型**不迁** Input 域——对外语义零回归）。
 *
 * 会话能力一律经句柄取（`h.call` / `h.evalRaw` / `h.takeSnapshot` / `h.ensureSession` / `h.pageError` …）——
 * 本档不 import `session.mjs`（DAG 单向，§5 拆分决定）。
 */
import { DEFAULT_MAX, clickExpression, typeExpression, truncateText, waitExpression } from "./snapshot.mjs"

export const WAIT_TIMEOUT_DEFAULT = 30_000
export const WAIT_TIMEOUT_MAX = 120_000
export const WAIT_POLL_MS = 150
export const NETWORK_QUIET_MS = 500
export const MAX_EVAL_CHARS = 8_000

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function normalizeHttpUrl(value) {
  const raw = String(value ?? "")
  let url
  try { url = new URL(raw) } catch { url = null }
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) {
    throw new Error(`navigate requires an http/https url — got "${raw}"`)
  }
  return url.toString()
}

function jsonOf(value) {
  if (value === undefined) return "undefined"
  try { return JSON.stringify(value) ?? String(value) }
  catch { return String(value) }
}

/** navigate（§2.2）：http/https 限；回执 = `[navigate] <final-url>` + 内联新页快照（省一轮 snapshot）。 */
async function actNavigate(args, ctx, h) {
  const url = normalizeHttpUrl(args.url)
  h.assertHostAllowed(url, ctx) // 静态参数面先检——被拦的 host 不得起浏览器（§3.2「不执行」）
  await h.ensureSession(args)
  await h.call("Page.navigate", { url })
  await h.waitForReady()
  const snap = await h.takeSnapshot({ max: DEFAULT_MAX })
  return `[navigate] ${snap.url}\n${snap.text}`
}

/** snapshot（§2.2）：引用清单（生成 / 复用 / 标记——§2.3）。 */
async function actSnapshot(args, ctx, h) {
  await h.ensureSession(args)
  const snap = await h.takeSnapshot({ selector: args.selector ?? null, max: args.max ?? DEFAULT_MAX })
  return snap.text
}

/** click（§2.2）：DOM 级语义激活（`el.click()`——KD-10）；导航判据 = URL 变化 ⇒ `[navigated]` / `[no navigation]`。 */
async function actClick(args, ctx, h) {
  await h.ensureSession(args)
  const info = await h.pageInfo()
  h.assertHostAllowed(info.url, ctx)
  const entry = h.resolveRef(args.ref)
  const res = await h.evalRaw(clickExpression(entry.selector, entry.tag))
  if (!res?.found || res.tag) throw h.pageError(`ref ${args.ref} is stale (was "${entry.name}") — run snapshot again`)
  if (res.disabled) throw h.pageError(`ref ${args.ref} is disabled ("${entry.name}")`)
  const out = [`[click] ${args.ref} "${entry.name}"`]
  const landed = await h.waitForUrlChange(info.url)
  if (landed) {
    await h.waitForReady()
    const snap = await h.takeSnapshot({ max: DEFAULT_MAX })
    out.push(`[navigated] ${snap.url}`, snap.text)
  } else {
    out.push("[no navigation]")
  }
  return out.join("\n")
}

/** type（§2.2）：写值（原生 value setter + input/change）；password 目标 ⇒ 值不回显（N-BT4）。 */
async function actType(args, ctx, h) {
  await h.ensureSession(args)
  const info = await h.pageInfo()
  h.assertHostAllowed(info.url, ctx)
  const entry = h.resolveRef(args.ref)
  const text = String(args.text)
  const res = await h.evalRaw(typeExpression(entry.selector, entry.tag, text, args.clear === true))
  if (!res?.found || res.tag) throw h.pageError(`ref ${args.ref} is stale (was "${entry.name}") — run snapshot again`)
  if (res.fillable === false) {
    throw h.pageError(`ref ${args.ref} is not a fillable field ("${entry.name}", <${entry.tag}>) — use snapshot to pick an input/textarea`)
  }
  if (res.disabled) throw h.pageError(`ref ${args.ref} is disabled ("${entry.name}")`)
  return `[type] ${args.ref} "${entry.name}" ← ${text.length} chars${res.password ? " (hidden)" : ""}`
}

/** evaluate（§2.2）：页面上下文 JS；异常 ⇒ `Error: evaluate failed: <message>`；回执受 8000 字符上限（N-BT3）。 */
async function actEvaluate(args, ctx, h) {
  await h.ensureSession(args)
  const info = await h.pageInfo()
  h.assertHostAllowed(info.url, ctx)
  let value
  try {
    value = await h.evalRaw(String(args.expression))
  } catch (e) {
    throw h.pageError(`evaluate failed: ${e?.message ?? e}`)
  }
  return `[evaluate @ ${info.url}] ${truncateText(jsonOf(value), MAX_EVAL_CHARS, "narrow the expression")}`
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

/** wait（§2.2）：四选一谓词 + 150ms 轮询；networkIdle = 事件在飞归零后静默 500ms。 */
async function actWait(args, ctx, h) {
  await h.ensureSession(args)
  const pred = waitPredicate(args)
  const wanted = Number(args.timeoutMs)
  const timeoutMs = Math.max(1, Math.min(Number.isFinite(wanted) && wanted > 0 ? wanted : WAIT_TIMEOUT_DEFAULT, WAIT_TIMEOUT_MAX))
  const started = Date.now()
  for (;;) {
    if (pred.kind === "networkIdle") {
      const net = h.networkState()
      if (net.inflight.size === 0 && Date.now() - net.lastEventAt >= NETWORK_QUIET_MS) break
    } else if (await h.evalRaw(waitExpression(pred.kind, pred.value)) === true) break
    if (Date.now() - started >= timeoutMs) throw h.pageError(`wait timed out after ${timeoutMs}ms (${pred.label})`)
    await sleep(WAIT_POLL_MS)
  }
  return `[wait] ${pred.label} — ok after ${Date.now() - started}ms`
}

/** screenshot（§2.2）：PNG 落盘返路径（KD-6——模型经 read_image 查看）。 */
async function actScreenshot(args, ctx, h) {
  await h.ensureSession(args)
  const shot = await h.call("Page.captureScreenshot", {
    format: "png",
    ...(args.fullPage === true ? { captureBeyondViewport: true } : {}),
  })
  if (typeof shot?.data !== "string") throw new Error("screenshot failed: the browser returned no image data")
  const saved = await h.saveShot(Buffer.from(shot.data, "base64"))
  return `[screenshot] ${saved.path} (${saved.bytes} bytes)`
}

/** close（§2.2）：幂等——无会话 ⇒ `[close] no browser session`（成功态）。 */
async function actClose(args, ctx, h) {
  if (!h.connection()) return "[close] no browser session"
  await h.closeSession()
  return "[close] browser session closed"
}

/** 基线八动作分发表（会话档并入总表——§5）。 */
export const ACTIONS = {
  navigate: actNavigate,
  snapshot: actSnapshot,
  click: actClick,
  type: actType,
  evaluate: actEvaluate,
  wait: actWait,
  screenshot: actScreenshot,
  close: actClose,
}
