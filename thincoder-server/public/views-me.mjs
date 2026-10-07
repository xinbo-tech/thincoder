/**
 * views-me.mjs — 我的三页（webui/WEBUI.md §2）：`#/me/keys`（API Key 表六列——多把并存 ∥ 签发/逐把吊销双弹窗 ∥
 * 页级一次性秘密区 ∥ 接入指南卡（`accessCard` 成员变体——同源复用）——§2.3⑥）∥
 * `#/me/usage`（图表化——概览卡行 ∥ 筛选行四控件 ∥ KPI 行 ∥ 按日堆叠柱主图（维度切换 端点/模型）∥ 分模型区 ∥ 明细表——§2.3⑦）
 * ∥ `#/me/account`（基本信息 + 自助改密）；
 * 自 views.mjs 拆档（一页一职责）。
 *
 * 数据全经 /api/*（契约 = accounts/ACCOUNTS.md §3 ∥ metering/METERING.md §3；key 行形 = `memberView`——名称/`hint`/
 * 签发时间/最后使用/近 30 天）；一次性秘密（key 明文）只回显一次（ctx.showSecret——复制钮三路回退住 app.mjs）；
 * 轮换（全换）按钮下架（多把并存下与逐把模型相抵——端点保留，WEBUI §2.3⑥）；提示条模型名经 `/api/system` 的
 * `embedding.model` 下发（零地址——§2.3①）；渲染一律节点 + textContent；文案经 `t()` 取值（§2.2）。
 */
import { mapError, t } from "./i18n.mjs"
import { openModal } from "./modal.mjs"
import { accessCard } from "./views-system.mjs"
import { statCard } from "./views-overview.mjs"

// ── 页：key 与签发 ──────────────────────────────────────────────────────────

export function renderMeKeys(ctx, mount) {
  const { h } = ctx
  const secretBox = h("div", { class: "secret", hidden: true })
  const tableBox = h("div")

  /** 表重渲（签发/吊销成功后——数据 = `memberView` key 行：名称 ∥ `hint` ∥ 签发时间 ∥ 最后使用 ∥ 近 30 天 ∥ 吊销）。 */
  const renderTable = () => {
    const keys = ctx.state.member?.keys ?? []
    tableBox.replaceChildren(keys.length === 0
      ? h("p", { class: "hint", text: t("me.keys.empty") })
      : ctx.table(
          [t("me.keys.colName"), t("me.keys.colKey"), t("me.keys.colCreated"), t("me.keys.colLastUsed"), t("me.keys.colWindow"), t("me.keys.colActions")],
          keys.map((key) => [
            key.name,
            h("code", { text: key.hint }),
            ctx.fmtTs(key.createdAt),
            key.lastUsedAt === null || key.lastUsedAt === undefined ? t("me.keys.neverUsed") : t("me.keys.lastUsed", { time: ctx.fmtTs(key.lastUsedAt) }),
            t("me.keys.windowTokens", { tokens: key.windowTokens ?? 0 }),
            h("button", { class: "tiny danger", text: t("admin.members.revoke"), onclick: () => openRevokeModal(ctx, { key, reload }) }),
          ])))
  }
  /** 刷新会话态（`/api/me`——签发/吊销后取新清单）+ 表重渲；失败 ⇒ 错误收口。 */
  const reload = async () => {
    try { await ctx.refresh() } catch (error) { ctx.fail(error); return }
    renderTable()
  }
  renderTable()

  mount.append(h("h2", { text: t("me.keys.title") }))
  mount.append(h("div", { class: "row-form" }, h("button", { type: "button", text: t("me.keys.issue"), onclick: () => openIssueModal(ctx, { reload, secretBox }) })))
  mount.append(secretBox) // 页级一次性回显（签发成功后明文落此——仅一次）
  mount.append(h("section", { class: "card" }, h("h3", { text: t("me.keys.listTitle") }), tableBox))
  mount.append(accessCard(ctx, "member")) // 接入指南（成员面——与 admin 接入卡同源复用，§2.3⑥）
}

/** 签发流（弹窗——§2.3⑥）：名称可空（留空 ⇒ 服务端默认名 `key-N`——落库）∥ 明文仅一次说明 ∥ 上限提示；
 *  成功 ⇒ 关窗 + 页级秘密区回显明文 + 表刷新；失败 ⇒ 窗内状态行（弹窗定则——反馈落窗内）。 */
function openIssueModal(ctx, { reload, secretBox }) {
  const { h } = ctx
  const nameInput = h("input", { placeholder: t("me.keys.namePh") })
  const status = h("p", { class: "hint error", hidden: true })
  const submit = async () => {
    status.hidden = true
    try {
      const issued = await ctx.api("/api/me/keys/issue", { method: "POST", body: { name: nameInput.value.trim() || null } })
      ctx.showSecret(secretBox, t("me.keys.secretLabel"), issued.plain) // 明文一次性回显（关窗 + 页级）
      modal.close()
      await reload()
    } catch (error) {
      if (error?.status === 401 && error?.code !== "invalid_credentials") { ctx.fail(error); return } // 会话失效 ⇒ 照常踢登录
      status.textContent = mapError(error)
      status.hidden = false
    }
  }
  const modal = openModal({
    title: t("me.keys.issueTitle"),
    body: h("div", { class: "stack" },
      h("label", {}, t("me.keys.nameLabel"), nameInput),
      h("p", { class: "hint", text: t("me.keys.nameHint") }),
      h("p", { class: "hint", text: t("me.keys.issueHint") }),
      h("p", { class: "hint", text: t("me.keys.capHint") }),
      status),
    footer: h("div", { class: "row-form" },
      h("button", { type: "button", text: t("me.keys.issueSubmit"), onclick: submit }),
      h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() })),
  })
  nameInput.focus() // 焦点入窗首选（平台缺省 = 首可聚焦元素——显式定首）
  return modal
}

/** 吊销流（弹窗——§2.3⑥）：名 + `hint` + 后果文案（即断/不可撤销）；成功 ⇒ 关窗 + 表刷新（行离列）+ flash「已吊销」；
 *  失败 ⇒ 窗内状态行。零原生 confirm（页面零调用——机检扫描面）。 */
function openRevokeModal(ctx, { key, reload }) {
  const { h } = ctx
  const status = h("p", { class: "hint error", hidden: true })
  const revoke = async () => {
    status.hidden = true
    try {
      await ctx.api(`/api/me/keys/${key.id}/revoke`, { method: "POST" })
      modal.close()
      await reload()
      ctx.flash(t("me.keys.revoked"))
    } catch (error) {
      if (error?.status === 401 && error?.code !== "invalid_credentials") { ctx.fail(error); return } // 会话失效 ⇒ 照常踢登录
      status.textContent = mapError(error)
      status.hidden = false
    }
  }
  const modal = openModal({
    title: t("me.keys.revokeTitle"),
    body: h("div", { class: "stack" },
      h("p", {}, key.name, " ", h("code", { text: key.hint })),
      h("p", { class: "hint", text: t("me.keys.revokeConsequence") }),
      status),
    footer: h("div", { class: "row-form" },
      h("button", { type: "button", class: "danger", text: t("me.keys.revokeSubmit"), onclick: revoke }),
      h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() })),
  })
  return modal
}

// ── 页：我的用量（图表化——§2.3⑦）────────────────────────────────────────────

/** 段色阶梯（`--accent` 透明度——§2.3⑦；第 5 段起 0.3；零新颜色变量）。 */
const BAR_ALPHA = [1, 0.7, 0.45, 0.3]

export async function renderMeUsage(ctx, mount) {
  const { h } = ctx
  const member = ctx.state.member

  // 筛选行四控件（时间维度三档 ∥ 端点 ∥ 模型 ∥ 清除——即选即查；缺省 30 = 服务端缺省窗同构）
  const filterRange = h("select", { title: t("me.usage.range") }, h("option", { value: "7", text: t("me.usage.range7") }), h("option", { value: "30", text: t("me.usage.range30") }), h("option", { value: "month", text: t("me.usage.rangeMonth") }))
  filterRange.value = "30"
  const filterEndpoint = h("select", { title: t("usageReport.endpoint") }, h("option", { value: "", text: t("usageReport.endpointAll") }), h("option", { value: "chat", text: "chat" }), h("option", { value: "embeddings", text: "embeddings" }))
  const filterModel = h("input", { placeholder: t("me.usage.modelPh") })
  const clearBtn = h("button", { type: "button", class: "tiny", text: t("me.usage.clear") })

  const kpiBox = h("div", { class: "stat-grid" })
  const chartBox = h("div")
  const modelBox = h("div")
  const reportBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))
  const detailBox = h("div", { class: "table-slot" }, h("p", { class: "hint", text: t("common.loading") }))

  let summary = null
  let dim = "endpoint" // 主图维度（端点 ∥ 模型——本地切换零重取）

  /** 窗换算（三档 ⇒ `from` ms；正午锚防时区跳变——admin 先例同构）。 */
  const windowFrom = () => {
    const d = new Date()
    if (filterRange.value === "month") return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() - (filterRange.value === "7" ? 6 : 29))
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  /** 单过滤面（四区同参——两读同拍；`from` 键以模板字面量书写——沿 views-usage 先例）。 */
  const filterParams = () => {
    const params = new URLSearchParams()
    if (filterEndpoint.value) params.set("endpoint", filterEndpoint.value)
    if (filterModel.value.trim()) params.set("model", filterModel.value.trim())
    params.set(`from`, String(windowFrom()))
    return params
  }

  /** 主图（纯 CSS 堆叠柱——维度切换 = 本地重画）：柱高 = 当日 tokens/峰值；段 = 维值（色 = 阶梯——按维值总量降序）。 */
  const renderChart = () => {
    const trend = summary?.trend ?? []
    const series = (dim === "endpoint" ? summary?.trendByEndpoint : summary?.trendByModel) ?? []
    const byDay = new Map()
    const dimTotals = new Map()
    for (const seg of series) {
      const value = seg[dim]
      if (!byDay.has(seg.day)) byDay.set(seg.day, new Map())
      byDay.get(seg.day).set(value, seg)
      dimTotals.set(value, (dimTotals.get(value) ?? 0) + seg.totalTokens)
    }
    const dims = [...dimTotals.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([value]) => value)
    const max = Math.max(...trend.map((day) => day.totalTokens), 1)
    const alphaOf = (index) => BAR_ALPHA[Math.min(index, BAR_ALPHA.length - 1)]
    const toggle = (value) => h("button", { type: "button", class: value === dim ? "tiny active" : "tiny", text: t(value === "endpoint" ? "usageReport.endpoint" : "usage.col.model"), onclick: () => { dim = value; renderChart() } })
    const empty = trend.length === 0 || (summary?.totals?.requests ?? 0) === 0
    chartBox.replaceChildren(
      h("h4", { text: t("usageReport.trend") }),
      h("div", { class: "chart" },
        h("div", { class: "chart-toggle" }, toggle("endpoint"), toggle("model")),
        ...(empty ? [h("p", { class: "hint", text: t("usageReport.trendEmpty") })] : [
          h("div", { class: "bar-legend" }, ...dims.map((value, index) => h("span", {}, h("span", { class: "bar-swatch", style: `opacity:${alphaOf(index)}` }), value))),
          h("div", { class: "chart-bars" }, ...trend.map((day) => h("div", { class: "bar-col" },
            h("div", { class: "bar-stacked", style: `height:${Math.round((day.totalTokens / max) * 100)}%` },
              ...dims.map((value, index) => {
                const seg = byDay.get(day.day)?.get(value)
                if (!seg || seg.totalTokens <= 0) return null // 零段不画（柱高 = tokens）
                return h("div", { class: "bar-seg", style: `height:${Math.round((seg.totalTokens / day.totalTokens) * 100)}%;opacity:${alphaOf(index)}`, title: `${day.day} · ${value} · ${t("usageReport.requests")} ${seg.requests} · ${seg.totalTokens} ${t("usageReport.tokens")}` })
              }))))),
          h("div", { class: "chart-axis" }, h("span", { text: trend[0].day }), h("span", { text: trend[trend.length - 1].day })),
        ]),
      ))
  }

  /** 报表区（KPI ∥ 主图 ∥ 分模型——随两读同拍刷新；概览卡行 = 月语境不随筛选）。 */
  const renderReport = () => {
    const totals = summary?.totals ?? {}
    const days = summary?.byModel ?? []
    const month = member?.modelUsage ?? {}
    const seen = new Set(days.map((row) => row.model))
    // 殿后行：范围无行而本月有量者（月窗含嵌入；端过滤只裁窗表——§2.3⑦）
    const tail = Object.entries(month).filter(([value, tokens]) => tokens > 0 && !seen.has(value)).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    kpiBox.replaceChildren(
      statCard(h, t("usageReport.requests"), h("div", { class: "stat-value", text: String(totals.requests ?? 0) })),
      statCard(h, t("usageReport.tokens"), h("div", { class: "stat-value", text: String(totals.totalTokens ?? 0) }),
        h("p", { class: "hint", text: t("me.usage.kpiSplit", { prompt: totals.promptTokens ?? 0, completion: totals.completionTokens ?? 0 }) })))
    renderChart()
    const rows = [...days.map((row) => [row.model, String(row.requests), String(row.totalTokens), String(month[row.model] ?? 0)]), ...tail.map(([value, tokens]) => [value, "0", "0", String(tokens)])]
    modelBox.replaceChildren(h("h4", { text: t("usageReport.byModel") }),
      rows.length === 0
        ? h("p", { class: "hint", text: t("usage.empty") })
        : ctx.table([t("usageReport.colRank"), t("usage.col.model"), t("usageReport.requests"), t("usageReport.tokens"), t("me.usage.used")], rows.map((cells, index) => [String(index + 1), ...cells])))
  }

  /** 四区同拍（`Promise.all` 两读同参——summary + 明细）；失败 ⇒ 两区各 `.hint error`（`ctx.fail` 收口）。 */
  const loadUsage = async () => {
    const params = filterParams()
    const detailParams = new URLSearchParams(params)
    detailParams.set("limit", "100")
    try {
      const [report, detail] = await Promise.all([ctx.api(`/api/me/usage/summary?${params.toString()}`), ctx.api(`/api/me/usage?${detailParams.toString()}`)])
      summary = report
      reportBox.replaceChildren(kpiBox, chartBox, modelBox)
      renderReport()
      detailBox.replaceChildren(ctx.usageTable(detail.rows ?? [], { withMember: false, foot: true }))
    } catch (error) {
      ctx.fail(error)
      reportBox.replaceChildren(h("p", { class: "hint error", text: t("usage.loadFailed") }))
      detailBox.replaceChildren(h("p", { class: "hint error", text: t("usage.loadFailed") }))
    }
  }
  filterRange.addEventListener("change", () => { loadUsage() })
  filterEndpoint.addEventListener("change", () => { loadUsage() })
  filterModel.addEventListener("change", () => { loadUsage() })
  clearBtn.addEventListener("click", () => { filterRange.value = "30"; filterEndpoint.value = ""; filterModel.value = ""; loadUsage() })

  ctx.dataShell(mount, { // 视口高壳（§2.6②——页头固定；报表卡上限自滚 + 明细卡承缩）
    head: [
      h("h2", { text: t("me.usage.title") }),
      vectorTip(ctx), // 向量服务提示条（模型名 + snippet + 用法一句——地址/探活/试跑 = admin 面）
      h("div", { class: "stat-grid" },
        statCard(h, t("me.usage.used"), h("div", { class: "stat-value", text: ctx.fmtValue(member.usedTokens) })),
        statCard(h, t("col.quota"), h("div", { class: "stat-value", text: ctx.fmtModelQuotas(member.modelQuotas) }))),
      h("div", { class: "row-form" }, h("label", {}, t("me.usage.range"), filterRange), h("label", {}, t("usageReport.endpoint"), filterEndpoint), filterModel, clearBtn),
    ],
    area: [
      h("section", { class: "card report-card" }, reportBox),
      h("section", { class: "card" }, h("h3", { text: t("me.usage.detail") }), detailBox),
    ],
  })
  await loadUsage()
}

/** 向量服务提示条（用户面——模型名 + snippet + 用法一句；地址/探活/试跑 = admin 面；§2.3①）。 */
function vectorTip(ctx) {
  const { h } = ctx
  const model = ctx.state.system?.embedding?.model ?? null
  return h("section", { class: "card tip-bar" },
    h("h3", { text: t("vector.meTitle") }),
    h("p", { class: "hint", text: t("vector.usage", { model: model ?? "—" }) }),
    h("pre", { class: "snippet" }, h("code", { text: `curl -H "Authorization: Bearer sk-tc-…" ${location.origin}/v1/embeddings -d '{"model": "${model ?? "<model>"}", "input": "hello"}'` })))
}

// ── 页：账户设置 ────────────────────────────────────────────────────────────

export function renderMeAccount(ctx, mount) {
  const { h } = ctx
  const member = ctx.state.member
  mount.append(h("h2", { text: t("me.account.title") }))
  mount.append(h("section", { class: "card" }, h("h3", { text: t("me.account.basic") }),
    ctx.table([t("col.name"), t("col.username"), t("col.role")], [[member.name, member.username, member.role]])))

  const oldPassword = h("input", { type: "password", required: true, autocomplete: "current-password" })
  const newPassword = h("input", { type: "password", required: true, minlength: "8", autocomplete: "new-password" })
  const passwordForm = h("form", { class: "card stack" },
    h("h3", { text: t("me.account.pwdTitle") }),
    h("label", {}, t("me.account.oldPwd"), oldPassword),
    h("label", {}, t("me.account.newPwd"), newPassword),
    h("button", { type: "submit", text: t("me.account.pwdSubmit") }),
  )
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault()
    try {
      await ctx.api("/api/me/password", { method: "POST", body: { oldPassword: oldPassword.value, newPassword: newPassword.value } })
      passwordForm.reset()
      ctx.flash(t("me.account.pwdDone"))
    } catch (error) { ctx.fail(error) }
  })
  mount.append(passwordForm)
}
