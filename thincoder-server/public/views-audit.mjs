/**
 * views-audit.mjs — 管理·审计（webui/WEBUI.md §2/§2.3④——`#/admin/audit`）：过滤三轴（类型/成员/时段）∥
 * 事件表（时间 ∥ 类型 ∥ 操作者 ∥ 对象 ∥ 详情——按型模板渲染）∥ 空态；`GET /api/audit` 取数（倒序，新在前）。
 *
 * 十型枚举与 detail 形 = accounts/ACCOUNTS.md §2.1；详情字段（IP ∥ 维度 ∥ key 提示形 ∥ 角色 ∥ keys（配置变更
 * 键名清单——“十型”））按在场渲染；对象与操作者同名 ⇒「—」（名快照口径——改/删后记录自足）。渲染一律节点 + textContent；文案经 `t()` 取值。
 */
import { t } from "./i18n.mjs"

/** 审计十型（类型值 ∥ 文案键——accounts/ACCOUNTS.md §2.1 类型枚举；未知型 ⇒ 原值兜底）。 */
const AUDIT_TYPES = [
  ["login_success", "audit.type.login_success"],
  ["login_failure", "audit.type.login_failure"],
  ["login_locked", "audit.type.login_locked"],
  ["key_rotate", "audit.type.key_rotate"],
  ["key_issue", "audit.type.key_issue"],
  ["key_revoke", "audit.type.key_revoke"],
  ["password_change", "audit.type.password_change"],
  ["password_reset", "audit.type.password_reset"],
  ["member_create", "audit.type.member_create"],
  ["config_update", "audit.type.config_update"],
]

export async function renderAudit(ctx, mount) {
  const { h } = ctx

  const filterType = h("select", { title: t("audit.typeLabel") },
    h("option", { value: "", text: t("audit.typeAll") }),
    ...AUDIT_TYPES.map(([type, key]) => h("option", { value: type, text: t(key) })))
  const filterMember = h("input", { placeholder: t("audit.memberPh") })
  const filterFrom = h("input", { type: "datetime-local", title: t("admin.usage.fromTitle") })
  const filterTo = h("input", { type: "datetime-local", title: t("admin.usage.toTitle") })

  const eventsBox = h("div", { class: "table-slot" }, h("p", { class: "hint", text: t("common.loading") }))
  const loadEvents = async () => {
    const params = new URLSearchParams()
    if (filterType.value) params.set("type", filterType.value)
    if (filterMember.value.trim()) params.set("member", filterMember.value.trim())
    if (filterFrom.value) params.set(`from`, String(new Date(filterFrom.value).getTime()))
    if (filterTo.value) params.set(`to`, String(new Date(filterTo.value).getTime()))
    try {
      const data = await ctx.api(`/api/audit?${params.toString()}`)
      const events = data.events ?? []
      eventsBox.replaceChildren(eventsTable(ctx, events))
    } catch (error) {
      ctx.fail(error)
      eventsBox.replaceChildren(h("p", { class: "hint error", text: t("audit.loadFailed") }))
    }
  }
  const filterForm = h("form", { class: "row-form" },
    h("label", {}, t("audit.typeLabel"), filterType),
    filterMember,
    h("label", {}, t("audit.fromLabel"), filterFrom), h("label", {}, t("audit.toLabel"), filterTo),
    h("button", { type: "submit", text: t("audit.submit") }),
  )
  filterForm.addEventListener("submit", (event) => { event.preventDefault(); loadEvents() })
  ctx.dataShell(mount, { // 视口高壳（§2.6②——页题固定 ∥ 卡内过滤行 ∥ 表槽吃剩高；表尾计数 = 表内 tfoot）
    head: h("h2", { text: t("audit.title") }), // 单标题（head 的 h2；卡内 h3 已删——#995）
    area: h("section", { class: "card" }, filterForm, eventsBox),
  })
  await loadEvents()
}

/** 事件表：时间 ∥ 类型 ∥ 操作者 ∥ 对象（与操作者同名 ⇒ 「—」）∥ 详情（按型模板：IP/维度/key/角色）。 */
function eventsTable(ctx, events) {
  const { h } = ctx
  if (events.length === 0) return h("p", { class: "hint", text: t("audit.empty") })
  const rows = events.map((event) => [
    ctx.fmtTs(event.ts),
    typeLabel(event.type),
    event.actor,
    event.target && event.target !== event.actor ? event.target : "—",
    detailText(event.detail),
  ])
  return ctx.table([t("audit.col.time"), t("audit.col.type"), t("audit.col.actor"), t("audit.col.target"), t("audit.col.detail")], rows, { foot: true })
}

/** 类型文案（十型枚举内 ⇒ 表键；枚举外 ⇒ 原值兜底——未来新型零遗漏）。 */
function typeLabel(type) {
  const hit = AUDIT_TYPES.find(([value]) => value === type)
  return hit ? t(hit[1]) : String(type)
}

/** 详情按型模板（在场字段渲染）：IP ∥ 维度 ∥ key 提示形 ∥ 角色 ∥ 配置变更键名清单；无字段 ⇒ 「—」。 */
function detailText(detail) {
  const parts = []
  if (detail?.ip) parts.push(`${t("audit.ip")}: ${detail.ip}`)
  if (detail?.dimension) parts.push(`${t("audit.dimension")}: ${detail.dimension}`)
  if (detail?.keyHint) parts.push(`${t("audit.keyHint")}: ${detail.keyHint}`)
  if (detail?.role) parts.push(`${t("audit.role")}: ${detail.role}`)
  if (Array.isArray(detail?.keys) && detail.keys.length > 0) parts.push(`${t("audit.keys")}: ${detail.keys.join(", ")}`)
  return parts.length === 0 ? "—" : parts.join(" · ")
}
