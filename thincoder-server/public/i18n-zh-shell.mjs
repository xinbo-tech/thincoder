/**
 * i18n-zh-shell.mjs — 控制台文案表·中文·壳族（webui/WEBUI.md §2.2——KD-SV-51 拆表）：域界 = 键首段前缀（`app.*` ∥
 * `common.*` ∥ `col.*` ∥ `denied.*` ∥ `nav.*` ∥ `lang.*` ∥ `login.*` ∥ `err.*`——`.one` 变体随基键）；门面 = `i18n-zh.mjs`
 * （四部件展开合体 + `Object.freeze`——`ZH` 导出名不变）。键序 = 原档相对序（逐字搬移——零语义；段注释同移）。
 * 本档 = zh 族（唯一 CJK 载体——零 CJK 机检口径 §6 AC-14：扫描面按前缀排除 `i18n-zh*` ∥ `i18n-en*`）。
 */
export const ZH_SHELL = Object.freeze({
  // ── 应用壳 ∥ 通用 ──────────────────────────────────────────────────────────
  "app.title": "Thincoder Server 控制台",
  "app.httpFailed": "请求失败（HTTP {status}）",
  "app.requestFailed": "请求失败：{reason}",
  "app.loggedOut": "已退出登录",
  "common.loading": "加载中……",
  "common.quotaUnlimited": "不限",
  "common.modelQuotaCount": "{count} 个模型",
  "common.quotaByPlatform": "按平台",
  "common.rowCount": "共 {count} 项",
  "common.secretNote": "{label}——仅此一次显示，请立即保存",
  "common.save": "保存",
  "common.cancel": "取消",
  "common.close": "关闭",
  "common.copy": "复制",
  "common.copied": "已复制",
  "common.copyManual": "自动复制失败——请手动复制明文",
  "denied.title": "无权限",
  "denied.hint": "该页面仅限 admin（判权在服务端）",

  // ── 表头（跨页共用） ───────────────────────────────────────────────────────
  "col.name": "展示名",
  "col.username": "用户名",
  "col.role": "角色",
  "col.quota": "分模型配额",
  "col.used": "本月已用",
  "col.item": "项",
  "col.value": "值",

  // ── 侧栏（导航单源——nav.mjs `labelKey`） ──────────────────────────────────
  "nav.brand": "Thincoder Server",
  "nav.group.me": "我的",
  "nav.group.admin": "管理",
  "nav.page.me.keys": "key 与签发",
  "nav.page.me.usage": "我的用量",
  "nav.page.me.account": "账户设置",
  "nav.page.admin.overview": "总览",
  "nav.page.admin.members": "成员",
  "nav.page.admin.providers": "Provider",
  "nav.page.admin.models": "服务模型",
  "nav.page.admin.usage": "全队用量",
  "nav.page.admin.audit": "审计",
  "nav.page.admin.system": "系统",
  "nav.logout": "退出登录",

  // ── 语言切换器（自称名——固定取本档渲染，不自译） ───────────────────────────
  "lang.zh": "中文",
  "lang.en": "English",

  // ── 登录 ───────────────────────────────────────────────────────────────────
  "login.title": "登录",
  "login.username": "用户名",
  "login.password": "密码",
  "login.submit": "登录",

  // ── 错误码映射（服务端零改——按 code 前端映射；可达码 + 预留：`rate_limited` 仅 /v1 面产生） ──
  "err.unauthorized": "会话无效或已过期，请重新登录",
  "err.invalid_credentials": "用户名或密码错误",
  "err.forbidden": "无权限——该操作需要 admin 角色",
  "err.not_found": "未找到目标（{detail}）",
  "err.invalid_request_error": "请求无效（{detail}）",
  "err.upstream_error": "上游服务出错，请稍后再试",
  "err.internal_error": "服务器内部错误，请稍后再试",
  "err.too_many_attempts": "登录尝试过多，请 {seconds} 秒后再试",
  "err.rate_limited": "模型限流：请 {seconds} 秒后再试",
})
