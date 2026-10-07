/**
 * views-me.mjs — 我的三页（webui/WEBUI.md §2）：`#/me/keys`（API Key 表六列——多把并存 ∥ 签发/逐把吊销双弹窗 ∥
 * 页级一次性秘密区 ∥ 接入指南卡（`accessCard` 成员变体——同源复用）——§2.3⑥）∥
 * `#/me/usage`（分模型配额摘要/本月已用 + 本人用量明细（端点过滤）+ 向量服务提示条）∥ `#/me/account`（基本信息 + 自助改密）；
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

// ── 页：我的用量 ────────────────────────────────────────────────────────────

export async function renderMeUsage(ctx, mount) {
  const { h } = ctx
  const member = ctx.state.member
  const filterEndpoint = h("select", { title: t("usageReport.endpoint") },
    h("option", { value: "", text: t("usageReport.endpointAll") }),
    h("option", { value: "chat", text: "chat" }),
    h("option", { value: "embeddings", text: "embeddings" }))
  const usageBox = h("div", { class: "table-slot" }, h("p", { class: "hint", text: t("common.loading") }))
  const loadUsage = async () => {
    const params = new URLSearchParams()
    if (filterEndpoint.value) params.set("endpoint", filterEndpoint.value) // 端点过滤（与全队用量同参数——§2.3①）
    params.set("limit", "100")
    try {
      const data = await ctx.api(`/api/me/usage?${params.toString()}`)
      const rows = data.rows ?? []
      usageBox.replaceChildren(ctx.usageTable(rows, { withMember: false, foot: true }))
    } catch (error) {
      ctx.fail(error)
      usageBox.replaceChildren(h("p", { class: "hint error", text: t("usage.loadFailed") }))
    }
  }
  filterEndpoint.addEventListener("change", () => { loadUsage() }) // 单控件即选即查（多字段面走提交钮——管理页）
  ctx.dataShell(mount, { // 视口高壳（§2.6②——页题/提示条/摘要卡固定 ∥ 表槽吃剩高；表尾计数 = 表内 tfoot）
    head: [
      h("h2", { text: t("me.usage.title") }),
      vectorTip(ctx), // 向量服务提示条（模型名 + snippet + 用法一句——地址/探活/试跑 = admin 面）
      h("section", { class: "card" }, h("h3", { text: t("me.usage.summary") }),
        ctx.table([t("col.name"), t("col.username"), t("col.quota"), t("col.used")], [[
          member.name, member.username, ctx.fmtModelQuotas(member.modelQuotas), ctx.fmtValue(member.usedTokens),
        ]])),
    ],
    area: h("section", { class: "card" }, h("h3", { text: t("me.usage.detail") }),
      h("div", { class: "row-form" }, h("label", {}, t("usageReport.endpoint"), filterEndpoint)), usageBox),
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
