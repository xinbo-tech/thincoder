/**
 * app.mjs — 控制台前端入口（webui/WEBUI.md §1–§3）：哈希路由（`#/<组>/<页>`）∥ fetch 封装 ∥ 会话态 ∥ 渲染助手 ∥
 * 视图装配（一页一职责）∥ 系统信息（`/api/system`——装配取一次；失败静默留空——§2.1）∥ 健康轮询（§2.3⑤：
 * 登录后启动——立即一次 + 30s；登出停止；灯/系统页块/总览卡三落点共用）∥ 多语言接线（`initLang` ∥ 错误映射 ∥
 * 格式化本地化 ∥ `Retry-After` 捕捉 ∥ `rerender` 口 ∥ title——§2.2）。
 *
 * 判权全在后端：只做显隐与表单——`user` 直打管理端点由服务端 403（页面不是判据）；401 ⇒ 回 #/login；路由解析
 * （别名重定向 ∥ 角色默认 ∥ admin 面 denied）= nav.mjs 纯函数；旧链 `#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒
 * `#/admin/overview`。渲染一律 textContent；写请求一律 JSON 头 + JSON 体（型门）；零外部资源（内网自洽）；文案一律经 `t()` 取值。
 */
import { t, mapError, initLang, setLang, langTag, applyDocument } from "./i18n.mjs"
import { defaultPath, renderSidebar, resolveRoute } from "./nav.mjs"
import { renderLogin } from "./views-auth.mjs"
import { renderMeAccount, renderMeKeys, renderMeUsage } from "./views-me.mjs"
import { renderMembers } from "./views-admin.mjs"
import { renderProviders } from "./views-providers.mjs"
import { renderSystem } from "./views-system.mjs"
import { renderAdminUsage } from "./views-usage.mjs"
import { renderOverview } from "./views-overview.mjs"
import { renderAudit } from "./views-audit.mjs"
import { renderModels } from "./views-models.mjs"

const appEl = document.getElementById("app")
const navEl = document.getElementById("nav")
const flashEl = document.getElementById("flash")

/** 会话态（member = `GET /api/me` 形；null = 未登录）；system = `GET /api/system` 形（装配取一次——失败留空）。 */
export const state = { member: null, system: null }

/** 系统信息（版本/更新）——会话就绪后取一次（§2.1）；失败静默留空（meta 槽/系统页同面）。 */
let systemLoaded = false
async function loadSystem() { try { state.system = await api("/api/system") } catch { state.system = null } }

// ── 渲染助手 ────────────────────────────────────────────────────────────────

/** 建元素：props（class ∥ text ∥ value ∥ on* 事件 ∥ 其余属性）+ 子节点（字符串 ⇒ 文本节点——天然转义）。 */
export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue
    if (key === "class") node.className = value
    else if (key === "text") node.textContent = String(value)
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value)
    else if (["value", "checked", "disabled", "hidden"].includes(key)) node[key] = value
    else node.setAttribute(key, value)
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue
    node.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
  return node
}

/** 表格（宽表横滚 = CSS `.table-wrap`）；cell = 值 ∥ 节点 ∥ 节点数组。 */
export function table(headers, rows) {
  return h("div", { class: "table-wrap" },
    h("table", {},
      h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))),
      h("tbody", {}, ...rows.map((cells) => h("tr", {}, ...cells.map((cell) => h("td", {}, ...(Array.isArray(cell) ? cell : [cell]))))))))
}

export const fmtTs = (ts) => new Date(ts).toLocaleString(langTag()) // 语言随 locale（zh-CN ∥ en——§2.2）
export const fmtValue = (value) => (value === null || value === undefined ? "—" : String(value)) // 「—」语言中性（保留）
export const fmtQuota = (value) => (value === null || value === undefined ? t("common.quotaUnlimited") : String(value))

/** 一次性秘密回显区（key 明文 ∥ 临时密码——「仅此一次」提示 + 可全选文本）。 */
export function showSecret(box, label, value) {
  box.replaceChildren(
    h("p", { class: "secret-label", text: t("common.secretNote", { label }) }),
    h("code", { class: "secret-value", text: value }),
  )
  box.hidden = false
}

/** 用量表（本人 ∥ 全队同构；全队加成员 + key 列）。 */
export function usageTable(rows, { withMember = false } = {}) {
  if (rows.length === 0) return h("p", { class: "hint", text: t("usage.empty") })
  const headers = [
    t("usage.col.time"), ...(withMember ? [t("usage.col.member"), t("usage.col.key")] : []), t("usage.col.endpoint"),
    t("usage.col.model"), t("usage.col.status"), t("usage.col.prompt"), t("usage.col.completion"), t("usage.col.total"), t("usage.col.duration"),
  ]
  const body = rows.map((row) => [
    fmtTs(row.ts),
    ...(withMember ? [row.member, h("code", { text: row.keyHint ?? "—" })] : []),
    row.endpoint, row.model, row.status,
    fmtValue(row.promptTokens), fmtValue(row.completionTokens), fmtValue(row.totalTokens),
    String(row.durationMs),
  ])
  return table(headers, body)
}

// ── 健康轮询（§2.3⑤——灯 ∥ 系统页块 ∥ 总览卡三落点共用）──────────────────────

/** 轮询周期（30s——§2.3⑤；登录后启动，登出停止）。 */
export const HEALTH_POLL_MS = 30000
/** 状态 ⇒ 文案键（三态——绿/黄/红）。 */
const HEALTH_LABEL_KEYS = { ok: "health.ok", degraded: "health.degraded", down: "health.down" }

let healthTimer = null, healthListeners = []
let healthState = { status: null, body: null, checkedAt: null }

/** 健康快照（视图渲染取用——文案按当前语言即时计算；未知态 = 「—」中性保留）。 */
export function healthSnapshot() {
  const { status, body, checkedAt } = healthState
  return { status, body, checkedAt, label: status === null ? "—" : t(HEALTH_LABEL_KEYS[status]) }
}

/** 视图订阅（路由切换清空——route() 重渲前重置）：每次轮询回调一次（视图用 `ctx.health()` 取快照重渲）。 */
function onHealth(listener) { healthListeners.push(listener) }

/** 侧栏灯直更（元素 id = `nav-health`——无整页重渲；侧栏重渲后由 route() 回填最近状态）。 */
function renderHealthLight() {
  const el = document.getElementById("nav-health")
  if (!el) return
  el.className = healthState.status === null ? "health" : `health ${healthState.status}`
  el.textContent = healthState.status === null ? "" : healthSnapshot().label
}

/** 轮询一次：`/healthz` 直读（公开端点——503 也携状态体；不经 `api()` 封装）；失败 ⇒ 红（服务不可达）。 */
async function pollHealth() {
  let body = null
  try {
    const response = await fetch("/healthz")
    try { body = await response.json() } catch { body = null }
  } catch { /* 请求失败 ⇒ down（灯变红——失败静默不 flash 刷屏） */ }
  const status = body?.status === "ok" ? "ok" : body?.status === "degraded" ? "degraded" : "down"
  healthState = { status, body, checkedAt: Date.now() }
  renderHealthLight()
  for (const listener of healthListeners) listener()
}

function startHealthPolling() {
  if (healthTimer !== null) return
  pollHealth() // 立即一次
  healthTimer = setInterval(() => pollHealth(), HEALTH_POLL_MS)
}

function stopHealthPolling() {
  if (healthTimer !== null) { clearInterval(healthTimer); healthTimer = null }
}

// ── fetch 封装 ∥ 会话态 ────────────────────────────────────────────────────

/** 请求封装：写请求（含无体写）一律 JSON 头 + JSON 体；非 2xx ⇒ 抛（带 status/code/retryAfter——fail 收口）。 */
export async function api(path, { method = "GET", body } = {}) {
  const init = { method }
  if (method !== "GET" && method !== "HEAD") {
    init.headers = { "content-type": "application/json" }
    init.body = JSON.stringify(body ?? {})
  }
  const response = await fetch(path, init)
  let payload = null
  try { payload = await response.json() } catch { /* 无 JSON 体：以状态判 */ }
  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? t("app.httpFailed", { status: response.status }))
    error.status = response.status
    error.code = payload?.error?.code ?? null
    const retryAfter = response.headers.get("retry-after") // 429 ⇒ 秒数注入文案（§2.2）
    if (retryAfter !== null) error.retryAfter = Number.isFinite(Number(retryAfter)) ? Number(retryAfter) : retryAfter
    throw error
  }
  return payload
}

/** 刷新会话态（`/api/me` = 会话探针）：401 ⇒ 清空后照抛（调用方 fail 收口）。 */
export async function refresh() {
  try {
    state.member = await api("/api/me")
  } catch (error) {
    if (error.status === 401) state.member = null
    throw error
  }
  return state.member
}

export function navigate(path) {
  const target = `#${path}`
  if (location.hash === target) route().catch(fail)
  else location.hash = target
}

let flashTimer = null
export function flash(message) {
  flashEl.textContent = message
  flashEl.hidden = false
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flashEl.hidden = true }, 8000)
}

/** 错误收口（视图统一走此）：会话失效（401 且非凭据类）⇒ 回登录；
 *  凭据类 401（`invalid_credentials`——登录失败 ∥ 旧密错）⇒ 住原视图展示映射文案（不误报会话过期）。 */
export function fail(error) {
  if (error?.status === 401 && error?.code !== "invalid_credentials") {
    state.member = null
    stopHealthPolling() // 会话失效 ⇒ 轮询同停
    flash(mapError(error))
    navigate("/login")
    return
  }
  flash(mapError(error))
}

// ── 路由 ───────────────────────────────────────────────────────────────────

/** 页 hash ⇒ 渲染函数（一页一职责——admin 面可达性 = nav.resolveRoute 收口）。 */
const PAGES = {
  "/me/keys": renderMeKeys,
  "/me/usage": renderMeUsage,
  "/me/account": renderMeAccount,
  "/admin/overview": renderOverview,
  "/admin/members": renderMembers,
  "/admin/providers": renderProviders,
  "/admin/models": renderModels,
  "/admin/usage": renderAdminUsage,
  "/admin/audit": renderAudit,
  "/admin/system": renderSystem,
}

function currentPath() {
  const raw = String(location.hash || "")
  if (!raw.startsWith("#/")) return "/"
  return raw.slice(1).replace(/\/+$/, "") || "/"
}

/** 视图上下文（各页共用面——showSecret/usageTable = 跨页共用助手，单源住本档；onChange = 语言切换回调）。 */
function viewCtx() {
  return { h, table, api, state, fail, flash, refresh, navigate, fmtTs, fmtValue, fmtQuota, showSecret, usageTable, onChange: switchLang, onHealth, health: healthSnapshot }
}

/** 重渲口（语言切换——侧栏 ∥ 视图同拍；§2.2）。 */
function rerender() {
  route().catch(fail)
}

/** 切换动作：写记忆 ⇒ 重渲当前界面 + `documentElement.lang`/title 随动（表单草稿不保——在案）。 */
function switchLang(lang) {
  setLang(lang)
  applyDocument()
  rerender()
}

async function route() {
  const path = currentPath()

  // 登录门：无会话 ⇒ 登录页（无侧栏）；已登录访问登录页 ⇒ 角色默认页。
  if (!state.member) {
    if (path !== "/login") { navigate("/login"); return }
    const mount = h("section")
    appEl.replaceChildren(mount)
    navEl.hidden = true
    renderLogin(viewCtx(), mount)
    return
  }
  if (path === "/login") { navigate(defaultPath(state.member.role)); return }

  const resolved = resolveRoute(path, state.member.role)
  if (resolved.redirect) { navigate(resolved.path); return } // 别名/根/未知 ⇒ 替换 hash（URL 与视图对齐）

  const mount = h("section")
  appEl.replaceChildren(mount)
  if (!systemLoaded) { systemLoaded = true; await loadSystem() } // 装配取一次（登录晚于启动时兜底）
  renderSidebar({ h, member: state.member, path: resolved.path, onLogout: logout, version: state.system?.version, onChange: switchLang }, navEl)
  navEl.hidden = false
  renderHealthLight() // 侧栏重渲 ⇒ 灯回填最近状态（无整页重渲语义不变）
  startHealthPolling() // 登录后启动（幂等——立即一次 + 30s；登出/会话失效停）
  healthListeners = [] // 视图注册面：路由切换清空（旧页面订阅退场）

  if (resolved.denied) { // admin 面非 admin——页面级块（判权仍在服务端——WEBUI §3）
    mount.append(h("h2", { text: t("denied.title") }), h("p", { class: "hint", text: t("denied.hint") }))
    return
  }
  await PAGES[resolved.path](viewCtx(), mount)
}

async function logout() {
  stopHealthPolling() // 登出停止轮询（§2.3⑤）
  try {
    await api("/api/logout", { method: "POST" }) // 无体写：空 JSON 体 + JSON 头（型门）
  } catch (error) {
    if (error.status !== 401) { fail(error); return }
  }
  state.member = null
  state.system = null // 会话级缓存随会话清（下一个会话重新取一次）
  systemLoaded = false
  healthListeners = []
  flash(t("app.loggedOut"))
  navigate("/login")
}

// ── 启动 ───────────────────────────────────────────────────────────────────

async function boot() {
  initLang() // 语言检测（记忆 → 浏览器语言 → 缺省 zh——首屏前定）
  applyDocument() // `documentElement.lang` + 标签页 title（运行期覆盖 index.html 静态缺省）
  try { state.member = await api("/api/me") } catch { state.member = null }
  window.addEventListener("hashchange", () => { route().catch(fail) }) // 装配异常不静默（走 fail 提示）
  await route().catch(fail)
}

boot()
