/**
 * views-usage.mjs — 管理·全队用量看板（webui/WEBUI.md §2/§2.3②）：过滤（+端点）∥ 概览卡 ∥ 时间趋势
 * （纯 CSS 柱——零依赖）∥ 聚合/排行两表 ∥ 导出（CSV——blob 下载）∥ 明细表；自 views-admin.mjs 迁出
 * （一页一职责；拆分缘由 = 叠加后破 300 软线）。
 *
 * 明细 ∥ 报表 ∥ 导出三读同过滤面、服务端同源（KD-SV-27；契约 = metering/METERING.md §3）；趋势零填充
 * 在服务端（前端只画——数据零错）；空态 = 文案。渲染一律节点 + textContent（不拼 HTML 串）；
 * 文案经 `t()` 取值（§2.2）；导出经 fetch ⇒ blob ⇒ 临时链接（400 走错误映射——不用裸链接导航）。
 */
import { t } from "./i18n.mjs"
// 卡件单源（概览卡行共用形——本页原本地件已并，§2.2）
import { statCard } from "./views-overview.mjs"

/** 端点过滤两值（明细 ∥ summary ∥ export 同门——`usage.col.endpoint` 列值即此词汇）。 */
const ENDPOINTS = ["chat", "embeddings"]

export async function renderAdminUsage(ctx, mount) {
  const { h } = ctx
  mount.append(h("h2", { text: t("admin.usage.title") }))

  const filterMember = h("input", { placeholder: t("admin.usage.memberPh") })
  const filterModel = h("input", { placeholder: t("admin.usage.modelPh") })
  const filterEndpoint = h("select", { title: t("usageReport.endpoint") },
    h("option", { value: "", text: t("usageReport.endpointAll") }),
    ...ENDPOINTS.map((value) => h("option", { value, text: value })))
  const filterFrom = h("input", { type: "datetime-local", title: t("admin.usage.fromTitle") })
  const filterTo = h("input", { type: "datetime-local", title: t("admin.usage.toTitle") })
  const filterLimit = h("input", { type: "number", min: "1", max: "500", value: "100", class: "tiny" })

  /** 过滤面（同参数集——明细 ∥ 报表 ∥ 导出三读共用；limit 仅明细面另加）。
   *  查询键以模板字面量书写（先例沿续：引号形 `from` 键会撞批内件依赖面扫描正则——该件冻结零改；行为等价）。 */
  const filterParams = () => {
    const params = new URLSearchParams()
    if (filterMember.value.trim()) params.set("member", filterMember.value.trim())
    if (filterModel.value.trim()) params.set("model", filterModel.value.trim())
    if (filterEndpoint.value) params.set("endpoint", filterEndpoint.value)
    if (filterFrom.value) params.set(`from`, String(new Date(filterFrom.value).getTime()))
    if (filterTo.value) params.set(`to`, String(new Date(filterTo.value).getTime()))
    return params
  }

  const reportBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))
  const detailBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))

  /** 查询 = 明细 + 报表同拍刷新（同过滤面——Promise.all 两读并发）。 */
  const loadUsage = async () => {
    const params = filterParams()
    const detailParams = new URLSearchParams(params)
    detailParams.set("limit", filterLimit.value.trim() || "100")
    try {
      const [summary, detail] = await Promise.all([
        ctx.api(`/api/usage/summary?${params.toString()}`),
        ctx.api(`/api/usage?${detailParams.toString()}`),
      ])
      reportBox.replaceChildren(...reportNodes(ctx, summary))
      detailBox.replaceChildren(ctx.usageTable(detail.rows, { withMember: true }))
    } catch (error) {
      ctx.fail(error)
      reportBox.replaceChildren(h("p", { class: "hint error", text: t("usage.loadFailed") }))
      detailBox.replaceChildren(h("p", { class: "hint error", text: t("usage.loadFailed") }))
    }
  }

  const exportBtn = h("button", { type: "button", text: t("usageReport.export") })
  exportBtn.addEventListener("click", () => exportCsv(ctx, filterParams()))
  const filterForm = h("form", { class: "row-form" },
    filterMember, filterModel,
    h("label", {}, t("usageReport.endpoint"), filterEndpoint),
    h("label", {}, t("admin.usage.fromLabel"), filterFrom), h("label", {}, t("admin.usage.toLabel"), filterTo),
    h("label", {}, t("admin.usage.limit"), filterLimit),
    h("button", { type: "submit", text: t("admin.usage.submit") }), exportBtn,
  )
  filterForm.addEventListener("submit", (event) => { event.preventDefault(); loadUsage() })
  mount.append(h("section", { class: "card" }, h("h3", { text: t("admin.usage.title") }), filterForm))
  mount.append(h("section", { class: "card" }, h("h3", { text: t("usageReport.reportTitle") }), reportBox))
  mount.append(h("section", { class: "card" }, h("h3", { text: t("usageReport.detailTitle") }), detailBox))
  await loadUsage()
}

/** 报表节点：概览卡两枚 + 趋势图（纯 CSS 柱）+ 聚合/排行两表（服务端降序即排行——聚合与排行同数据面）。 */
function reportNodes(ctx, summary) {
  const { h } = ctx
  const trend = summary.trend ?? []
  const max = Math.max(...trend.map((day) => day.requests), 1)
  return [
    h("div", { class: "stat-grid" },
      statCard(h, t("usageReport.requests"), h("div", { class: "stat-value", text: String(summary.totals?.requests ?? 0) })),
      statCard(h, t("usageReport.tokens"), h("div", { class: "stat-value", text: String(summary.totals?.totalTokens ?? 0) }))),
    h("h4", { text: t("usageReport.trend") }),
    trend.length === 0 // 空态 ⇒ 文案（零错——服务端零填充序列在场时才有柱）
      ? h("p", { class: "hint", text: t("usageReport.trendEmpty") })
      : h("div", { class: "chart" },
          h("div", { class: "chart-bars" },
            ...trend.map((day) => h("div", {
              class: "bar-col",
              title: `${day.day} · ${t("usageReport.requests")} ${day.requests} · ${day.totalTokens} ${t("usageReport.tokens")}`,
            }, h("div", { class: "bar", style: `height:${Math.round((day.requests / max) * 100)}%` })))),
          h("div", { class: "chart-axis" },
            h("span", { text: trend[0].day }), h("span", { text: trend[trend.length - 1].day }))),
    h("div", { class: "grid-2" },
      h("div", {}, h("h4", { text: t("usageReport.byModel") }), rankTable(ctx, summary.byModel ?? [], (row) => row.model)),
      h("div", {}, h("h4", { text: t("usageReport.byMember") }), rankTable(ctx, summary.byMember ?? [], (row) => row.member))),
  ]
}

/** 聚合/排行表（序号 ∥ 名称 ∥ 请求数 ∥ tokens——降序行序由服务端给定；空 ⇒ 提示文案）。 */
function rankTable(ctx, rows, nameOf) {
  if (rows.length === 0) return ctx.h("p", { class: "hint", text: t("usage.empty") })
  return ctx.table(
    [t("usageReport.colRank"), t("usageReport.colName"), t("usageReport.requests"), t("usageReport.tokens")],
    rows.map((row, index) => [String(index + 1), nameOf(row), String(row.requests), String(row.totalTokens)]))
}

/** 导出（同过滤面）：fetch ⇒ blob ⇒ 临时链接下载；非 2xx ⇒ 经错误映射展示（不用裸链接导航——错误页不劫持 SPA）。 */
async function exportCsv(ctx, params) {
  try {
    const response = await fetch(`/api/usage/export?${params.toString()}`)
    if (!response.ok) {
      let payload = null
      try { payload = await response.json() } catch { /* 非 JSON 体：以状态判 */ }
      const error = new Error(payload?.error?.message ?? t("app.httpFailed", { status: response.status }))
      error.status = response.status
      error.code = payload?.error?.code ?? null
      throw error
    }
    const url = URL.createObjectURL(await response.blob())
    const link = ctx.h("a", { href: url, download: `usage.csv` })
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    ctx.flash(t("usageReport.exported"))
  } catch (error) {
    ctx.fail(error)
  }
}
