/**
 * i18n-en-shell.mjs — 控制台文案表·English·壳族（webui/WEBUI.md §2.2——KD-SV-51 拆表）：域界 = 键首段前缀（`app.*` ∥
 * `common.*` ∥ `col.*` ∥ `denied.*` ∥ `nav.*` ∥ `lang.*` ∥ `login.*` ∥ `err.*`——`.one` 变体随基键）；门面 = `i18n-en.mjs`
 * （四部件展开合体 + `Object.freeze`——`EN` 导出名不变）。键序 = 原档相对序（逐字搬移——零语义；段注释同移）。
 * 本档 = en 族（零 CJK——零 CJK 机检口径 §6 AC-14：扫描面按前缀排除 `i18n-zh*` ∥ `i18n-en*`）。
 */
export const EN_SHELL = Object.freeze({
  // ── 应用壳 ∥ 通用 ──────────────────────────────────────────────────────────
  "app.title": "Thincoder Server Console",
  "app.httpFailed": "Request failed (HTTP {status})",
  "app.requestFailed": "Request failed: {reason}",
  "app.loggedOut": "Signed out",
  "common.loading": "Loading…",
  "common.quotaUnlimited": "Unlimited",
  "common.modelQuotaCount": "{count} models",
  "common.modelQuotaCount.one": "{count} model",
  "common.quotaByPlatform": "By platform",
  "common.rowCount": "{count} items",
  "common.rowCount.one": "{count} item",
  "common.secretNote": "{label} — shown only once; save it now.",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.copy": "Copy",
  "common.copied": "Copied",
  "common.copyManual": "Automatic copy failed — please copy the text manually",
  "denied.title": "Permission denied",
  "denied.hint": "This page is for admins only (enforced server-side).",

  // ── 表头（跨页共用） ───────────────────────────────────────────────────────
  "col.name": "Display name",
  "col.username": "Username",
  "col.role": "Role",
  "col.quota": "Model quotas",
  "col.used": "Used this month",
  "col.item": "Item",
  "col.value": "Value",

  // ── 侧栏（导航单源——nav.mjs `labelKey`） ──────────────────────────────────
  "nav.brand": "Thincoder Server",
  "nav.group.me": "My",
  "nav.group.admin": "Admin",
  "nav.page.me.keys": "Keys & issuing",
  "nav.page.me.usage": "My usage",
  "nav.page.me.account": "Account settings",
  "nav.page.admin.overview": "Overview",
  "nav.page.admin.members": "Members",
  "nav.page.admin.providers": "Provider",
  "nav.page.admin.models": "Served models",
  "nav.page.admin.usage": "Team usage",
  "nav.page.admin.audit": "Audit",
  "nav.page.admin.system": "System",
  "nav.page.admin.proxy": "Proxy",
  "nav.logout": "Sign out",

  // ── 登录 ───────────────────────────────────────────────────────────────────
  "login.title": "Sign in",
  "login.username": "Username",
  "login.password": "Password",
  "login.submit": "Sign in",

  // ── 错误码映射（服务端零改——按 code 前端映射；可达码 + 预留：`rate_limited` 仅 /v1 面产生） ──
  "err.unauthorized": "Your session is invalid or has expired — please sign in again",
  "err.invalid_credentials": "Incorrect username or password",
  "err.forbidden": "Permission denied — this action requires the admin role",
  "err.not_found": "Not found ({detail})",
  "err.invalid_request_error": "Invalid request ({detail})",
  "err.upstream_error": "The upstream service failed — please try again later",
  "err.internal_error": "Internal server error — please try again later",
  "err.too_many_attempts": "Too many sign-in attempts — try again in {seconds} seconds",
  "err.rate_limited": "Rate limited — try again in {seconds} seconds",
})
