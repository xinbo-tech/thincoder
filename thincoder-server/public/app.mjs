/**
 * app.mjs — 控制台前端入口（webui/WEBUI.md §1–§3）：哈希路由（#/login ∥ #/me ∥ #/admin）∥ fetch 封装 ∥
 * 会话态 ∥ 渲染助手。
 *
 * 判权全在后端：本档只做显隐与表单——`user` 直打管理端点由服务端 403（页面不是判据）；401 ⇒ 回 #/login。
 * 渲染一律 textContent（不拼 HTML 串）；写请求（含无体写）一律带 JSON 头 + JSON 体（服务端型门——非 JSON ⇒ 400）。
 * 零外部资源（内网自洽）：无 CDN ∥ 无外链字体。
 */
import { renderAdmin, renderLogin, renderMe } from "./views.mjs"

const appEl = document.getElementById("app")
const navEl = document.getElementById("nav")
const flashEl = document.getElementById("flash")

/** 会话态（member = `GET /api/me` 形；null = 未登录）。 */
export const state = { member: null }

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

export const fmtTs = (ts) => new Date(ts).toLocaleString()
export const fmtValue = (value) => (value === null || value === undefined ? "—" : String(value))
export const fmtQuota = (value) => (value === null || value === undefined ? "不限" : String(value))

// ── fetch 封装 ∥ 会话态 ────────────────────────────────────────────────────

/** 请求封装：写请求（含无体写）一律 JSON 头 + JSON 体；非 2xx ⇒ 抛（带 status/code——fail 收口）。 */
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
    const error = new Error(payload?.error?.message ?? `请求失败（HTTP ${response.status}）`)
    error.status = response.status
    error.code = payload?.error?.code ?? null
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
 *  凭据类 401（`invalid_credentials`——登录失败 ∥ 旧密错）⇒ 住原视图展示服务端文案（不误报会话过期）。 */
export function fail(error) {
  if (error?.status === 401 && error?.code !== "invalid_credentials") {
    state.member = null
    flash("会话无效或已过期，请重新登录")
    navigate("/login")
    return
  }
  flash(error?.message ?? `请求失败：${String(error)}`)
}

// ── 路由 ───────────────────────────────────────────────────────────────────

function currentPath() {
  const raw = String(location.hash || "")
  if (!raw.startsWith("#/")) return "/"
  return raw.slice(1).replace(/\/+$/, "") || "/"
}

async function route() {
  let path = currentPath()
  if (path === "/") { navigate(state.member ? "/me" : "/login"); return } // 根 ∥ 未知 hash ⇒ 落到三视图之一（URL 与视图对齐）
  if (!state.member && path !== "/login") { navigate("/login"); return }
  if (state.member && path === "/login") { navigate("/me"); return }
  if (!["/login", "/me", "/admin"].includes(path)) { navigate("/"); return }

  const mount = h("section", { class: "view" })
  appEl.replaceChildren(mount)
  renderNav()
  const ctx = { h, table, api, state, fail, flash, refresh, navigate, fmtTs, fmtValue, fmtQuota }
  if (path === "/login") renderLogin(ctx, mount)
  else if (path === "/admin") {
    if (state.member.role !== "admin") {
      mount.append(h("h2", { text: "无权限" }), h("p", { class: "hint", text: "管理视图仅限 admin（判权在服务端）" }))
      return
    }
    await renderAdmin(ctx, mount)
  } else await renderMe(ctx, mount)
}

function renderNav() {
  const member = state.member
  const items = []
  if (member) {
    items.push(h("a", { href: "#/me", text: "我的" }))
    if (member.role === "admin") items.push(h("a", { href: "#/admin", text: "管理" }))
    items.push(h("button", { type: "button", class: "link", text: "退出登录", onclick: logout }))
  }
  navEl.replaceChildren(...items)
}

async function logout() {
  try {
    await api("/api/logout", { method: "POST" }) // 无体写：空 JSON 体 + JSON 头（型门）
  } catch (error) {
    if (error.status !== 401) { fail(error); return }
  }
  state.member = null
  flash("已退出登录")
  navigate("/login")
}

// ── 启动 ───────────────────────────────────────────────────────────────────

async function boot() {
  try { state.member = await api("/api/me") } catch { state.member = null }
  window.addEventListener("hashchange", () => { route().catch(fail) }) // 装配异常不静默（走 fail 提示）
  await route().catch(fail)
}

boot()
