/**
 * app.mjs — 控制台前端入口（webui/WEBUI.md §1–§3——结构轮拆后）：哈希路由（`#/<组>/<页>`）∥ fetch 封装 ∥ 会话态 ∥
 * 视图装配（一页一职责）∥ 系统信息（`/api/system`——装配取一次；失败静默留空——§2.1）∥ 多语言接线（`initLang` ∥
 * 错误映射 ∥ `Retry-After` 捕捉 ∥ `rerender` 口 ∥ title——§2.2）。渲染助手 + 提示条（`dom.mjs`——§1）∥ 健康轮询
 * （`health.mjs`——§2.3⑤）为结构轮外拆档，本档经单点装配（`viewCtx()`——注入面名不变）。
 *
 * 判权全在后端：只做显隐与表单——`user` 直打管理端点由服务端 403（页面不是判据）；401 ⇒ 回 #/login；路由解析
 * （别名重定向 ∥ 角色默认 ∥ admin 面 denied）= nav.mjs 纯函数；旧链 `#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒
 * `#/admin/overview`。渲染一律 textContent；写请求一律 JSON 头 + JSON 体（型门）；零外部资源（内网自洽）；文案一律经 `t()` 取值。
 */
import { t, mapError, initLang, setLang, applyDocument } from "./i18n.mjs"
import { closeActiveModal } from "./modal.mjs"
import { h, table, flash, fmtTs, fmtValue, fmtModelQuotas, showSecret, usageTable, dataShell } from "./dom.mjs"
import { onHealth, healthSnapshot, renderHealthLight, startHealthPolling, stopHealthPolling, clearHealthListeners } from "./health.mjs"
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

/** 会话态（member = `GET /api/me` 形；null = 未登录）；system = `GET /api/system` 形（装配取一次——失败留空）。 */
export const state = { member: null, system: null }

/** 系统信息（版本/更新）——会话就绪后取一次（§2.1）；失败静默留空（meta 槽/系统页同面）。 */
let systemLoaded = false
async function loadSystem() { try { state.system = await api("/api/system") } catch { state.system = null } }

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

/** 视图上下文（各页共用面——showSecret/usageTable = 跨页共用助手，单源住 `dom.mjs`；onChange = 语言切换回调）。 */
function viewCtx() {
  return { h, table, api, state, fail, flash, refresh, navigate, fmtTs, fmtValue, fmtModelQuotas, showSecret, usageTable, dataShell, onChange: switchLang, onHealth, health: healthSnapshot }
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

/** 壳页表（数据表五页——§2.6① 钉表；`body.data-shell` 标记面——登录/登出径清除）。 */
const SHELL_PAGES = new Set(["/admin/members", "/admin/providers", "/admin/models", "/admin/audit", "/me/usage"])

async function route() {
  closeActiveModal() // 路由切换收口（#979）：原窗随视图卸载——先清（幂等单源；无在场 ⇒ 零动作）
  const path = currentPath()

  // 登录门：无会话 ⇒ 登录页（无侧栏）；已登录访问登录页 ⇒ 角色默认页。
  if (!state.member) {
    if (path !== "/login") { navigate("/login"); return }
    document.body.classList.remove("data-shell") // 登录面 = 非壳（登出/会话失效同径）
    const mount = h("section")
    appEl.replaceChildren(mount)
    navEl.hidden = true
    renderLogin(viewCtx(), mount)
    return
  }
  if (path === "/login") { navigate(defaultPath(state.member.role)); return }

  const resolved = resolveRoute(path, state.member.role)
  if (resolved.redirect) { navigate(resolved.path); return } // 别名/根/未知 ⇒ 替换 hash（URL 与视图对齐）
  document.body.classList.toggle("data-shell", SHELL_PAGES.has(resolved.path)) // 壳页标记（五路径——§2.6②）

  const mount = h("section")
  appEl.replaceChildren(mount)
  if (!systemLoaded) { systemLoaded = true; await loadSystem() } // 装配取一次（登录晚于启动时兜底）
  renderSidebar({ h, member: state.member, path: resolved.path, onLogout: logout, version: state.system?.version, onChange: switchLang }, navEl)
  navEl.hidden = false
  renderHealthLight() // 侧栏重渲 ⇒ 灯回填最近状态（无整页重渲语义不变）
  startHealthPolling() // 登录后启动（幂等——立即一次 + 30s；登出/会话失效停）
  clearHealthListeners() // 视图注册面：路由切换清空（旧页面订阅退场）

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
  clearHealthListeners()
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
