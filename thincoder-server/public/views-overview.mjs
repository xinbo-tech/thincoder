/**
 * views-overview.mjs — 管理·总览（webui/WEBUI.md §2/§2.3③——admin 落地页 `#/admin/overview`）：卡集六枚——
 * 今日请求 ∥ 今日 token ∥ 成员数（`GET /api/overview`——与用量报表同源）∥ 服务健康（共享态——§2.3⑤，
 * `ctx.onHealth` 订阅）∥ 更新状态（`state.system.update.latest`；在场 ⇒ 高亮提示 + 导流系统页）∥ 快捷入口五链。
 *
 * 健康/更新两卡不走本页端点（前端共享态——零新请求；数据来源 = `/healthz` 轮询 ∥ `/api/system` 装配取一次）。
 * user 面不可达 = nav 层 `denied` + 服务端 403 双层（判权服务端为准）；渲染一律节点 + textContent；文案经 `t()`。
 */
import { t } from "./i18n.mjs"

export async function renderOverview(ctx, mount) {
  const { h } = ctx
  mount.append(h("h2", { text: t("overview.title") }))

  const requestsValue = h("div", { class: "stat-value", text: t("common.loading") })
  const tokensValue = h("div", { class: "stat-value", text: t("common.loading") })
  const membersValue = h("div", { class: "stat-value", text: t("common.loading") })

  // 健康卡（共享态订阅——路由切换清空；语言切换时随整页重渲即取新文案）
  const healthValue = h("div", { class: "stat-value" })
  const renderHealth = () => {
    const health = ctx.health()
    healthValue.className = `stat-value ${health.status ?? ""}`.trim()
    healthValue.textContent = health.label
  }
  renderHealth()
  ctx.onHealth(renderHealth)

  mount.append(h("div", { class: "stat-grid" },
    statCard(h, t("overview.todayRequests"), requestsValue),
    statCard(h, t("overview.todayTokens"), tokensValue),
    statCard(h, t("overview.members"), membersValue),
    statCard(h, t("overview.healthCard"), healthValue),
    updateCard(ctx),
    linksCard(ctx)))

  try {
    const data = await ctx.api("/api/overview")
    requestsValue.textContent = String(data.today?.requests ?? 0)
    tokensValue.textContent = String(data.today?.totalTokens ?? 0)
    membersValue.textContent = String(data.members?.count ?? 0)
  } catch (error) {
    ctx.fail(error)
    for (const node of [requestsValue, tokensValue, membersValue]) node.textContent = "—"
  }
}

/** 卡（标签 + 内容——内容可为节点）。 */
function statCard(h, label, ...content) {
  return h("section", { class: "card" }, h("div", { class: "stat-label", text: label }), ...content)
}

/** 更新卡：`latest` 在场 ⇒ 高亮提示 + 导流系统页；不在场 ⇒ 「未发现新版本」（自检失败同面——静默口径）。 */
function updateCard(ctx) {
  const { h } = ctx
  const latest = ctx.state.system?.update?.latest ?? null
  return statCard(h, t("overview.updateCard"),
    h("div", { class: latest ? "stat-value update-tip" : "stat-value", text: latest ? t("system.latestTip", { version: latest }) : t("system.latestNone") }),
    latest ? h("a", { class: "stat-link", href: "#/admin/system", text: t("overview.toSystem") }) : null)
}

/** 快捷入口（五链：成员/provider/用量/审计/系统——标签 = nav 单源 `labelKey`，零重复文案）。 */
function linksCard(ctx) {
  const { h } = ctx
  const links = [
    ["/admin/members", "nav.page.admin.members"],
    ["/admin/providers", "nav.page.admin.providers"],
    ["/admin/usage", "nav.page.admin.usage"],
    ["/admin/audit", "nav.page.admin.audit"],
    ["/admin/system", "nav.page.admin.system"],
  ]
  return statCard(h, t("overview.quickLinks"),
    h("div", { class: "stat-links" }, ...links.map(([path, key]) => h("a", { href: `#${path}`, text: t(key) }))))
}
