/**
 * nav.mjs — 控制台导航单源（webui/WEBUI.md §2 ∥ KD-SV-20）：组/项数据（我的 3 ∥ 管理 7）∥ `resolveRoute` 纯函数
 * （无 DOM——批内件直测：别名重定向 ∥ 角色默认 ∥ admin 面 `denied`）∥ 侧栏渲染（品牌 ∥ 组标题/项/活动态 ∥
 * 底部 meta 槽（健康状态灯 + 版本行 + 语言切换器）+ 退出登录）。
 *
 * 文案单源 = 文案表（`i18n-zh.mjs` ∥ `i18n-en.mjs`）——本档数据持 `labelKey`（键——非字面量），渲染经 `t()` 取值
 * （§2.2）；判权全在后端——`denied` 仅页面级「无权限」块（服务端才是判据——§3）。零外部资源（内网自洽）。
 * 健康状态灯（§2.3⑤）= meta 槽 `#nav-health` 占位元素（点 + 文案）——app.mjs 轮询回调直更，无整页重渲。
 */
import { t, langSwitch } from "./i18n.mjs"

/** 侧栏组/项（数据单源——path = hash 路径；labelKey = 文案表键；adminOnly = 仅 admin 渲染且可过 `denied` 判）。 */
export const NAV_GROUPS = [
  { key: "me", labelKey: "nav.group.me", items: [
    { key: "keys", labelKey: "nav.page.me.keys", path: "/me/keys" },
    { key: "usage", labelKey: "nav.page.me.usage", path: "/me/usage" },
    { key: "account", labelKey: "nav.page.me.account", path: "/me/account" },
  ] },
  { key: "admin", labelKey: "nav.group.admin", adminOnly: true, items: [
    { key: "overview", labelKey: "nav.page.admin.overview", path: "/admin/overview" },
    { key: "members", labelKey: "nav.page.admin.members", path: "/admin/members" },
    { key: "providers", labelKey: "nav.page.admin.providers", path: "/admin/providers" },
    { key: "models", labelKey: "nav.page.admin.models", path: "/admin/models" },
    { key: "usage", labelKey: "nav.page.admin.usage", path: "/admin/usage" },
    { key: "audit", labelKey: "nav.page.admin.audit", path: "/admin/audit" },
    { key: "system", labelKey: "nav.page.admin.system", path: "/admin/system" },
  ] },
]

export const LOGIN_PATH = "/login"

/** 旧链别名（重定向——旧书签可达）：`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/overview`（§2）。 */
export const ROUTE_ALIASES = { "/me": "/me/keys", "/admin": "/admin/overview" }

const KNOWN_PAGES = new Set([...NAV_GROUPS.flatMap((group) => group.items.map((item) => item.path)), LOGIN_PATH])
const ADMIN_PREFIX = "/admin/"

/** 角色默认页（`#/` ∥ 未知 hash ⇒ 此）：admin ⇒ `#/admin/overview`（总览——落地页）∥ user ⇒ `#/me/keys`。 */
export function defaultPath(role) {
  return role === "admin" ? "/admin/overview" : "/me/keys"
}

/** hash 路径归一：补前导 `/` ∥ 去尾斜杠（`/me/keys/` ⇒ `/me/keys`；根保 `/`）。 */
export function normalizePath(path) {
  let value = String(path ?? "").trim()
  if (!value.startsWith("/")) value = `/${value}`
  if (value.length > 1) value = value.replace(/\/+$/, "")
  return value
}

/**
 * 路由解析（纯函数——无 DOM）：
 * 返回 `{ path }` ＋ 可选 `redirect: true`（别名/未知 ⇒ 调用方替换 hash）∥ `denied: true`（admin 面非 admin——页面级块）。
 */
export function resolveRoute(path, role) {
  const clean = normalizePath(path)
  if (clean === LOGIN_PATH) return { path: LOGIN_PATH }
  const canonical = ROUTE_ALIASES[clean] ?? clean
  if (!KNOWN_PAGES.has(canonical)) return { path: defaultPath(role), redirect: true }
  const resolved = { path: canonical }
  if (canonical !== clean) resolved.redirect = true
  if (canonical.startsWith(ADMIN_PREFIX) && role !== "admin") resolved.denied = true
  return resolved
}

/** 侧栏渲染（DOM 面——`ctx.h` 注入）：品牌 ∥ 组（admin 组仅 admin）∥ 项（活动态）∥ 底部 meta 槽（健康状态灯
 *  `#nav-health`（§2.3⑤——轮询回调直更） + 版本行（`version` 缺省/空 ⇒ 留空静默，`GET /api/system` 失败同面））
 *  + 语言切换器 + 退出登录。 */
export function renderSidebar(ctx, el) {
  const { h, member, path, onLogout, version, onChange } = ctx
  const nodes = [h("div", { class: "brand", text: t("nav.brand") })]
  for (const group of NAV_GROUPS) {
    if (group.adminOnly && member.role !== "admin") continue
    nodes.push(h("div", { class: "nav-group" },
      h("div", { class: "nav-group-title", text: t(group.labelKey) }),
      ...group.items.map((item) => h("a", {
        class: item.path === path ? "nav-item active" : "nav-item",
        href: `#${item.path}`,
        text: t(item.labelKey),
      }))))
  }
  nodes.push(h("div", { class: "nav-bottom" },
    h("div", { class: "health", id: "nav-health" }), // 健康状态灯（点 + 文案——三态 §2.3⑤；轮询回调直更）
    h("div", { class: "meta", id: "nav-meta", text: version ? `v${version}` : "" }), // meta 槽：版本行（全角色）
    langSwitch(h, onChange), // 语言切换器（meta 槽同区——登录后十页全达；窄屏随顶条）
    h("button", { type: "button", class: "link", text: t("nav.logout"), onclick: onLogout })))
  el.replaceChildren(...nodes)
}
