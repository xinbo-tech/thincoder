/**
 * views-me.mjs — 我的三页（webui/WEBUI.md §2）：`#/me/keys`（key 清单——含最后使用/近 30 天用量 ∥ 签发/轮换）∥
 * `#/me/usage`（分模型配额摘要/本月已用 + 本人用量明细（端点过滤）+ 向量服务提示条）∥ `#/me/account`（基本信息 + 自助改密）；
 * 自 views.mjs 拆档（一页一职责）。
 *
 * 数据全经 /api/*（契约 = accounts/ACCOUNTS.md §3 ∥ metering/METERING.md §3）；一次性秘密（key 明文）
 * 只回显一次（ctx.showSecret）；提示条模型名经 `/api/system` 的 `embedding.model` 下发（零地址——§2.3①）；
 * 渲染一律节点 + textContent；文案经 `t()` 取值（§2.2）。
 */
import { t } from "./i18n.mjs"

// ── 页：key 与签发 ──────────────────────────────────────────────────────────

export function renderMeKeys(ctx, mount) {
  const { h } = ctx
  const member = ctx.state.member
  mount.append(h("h2", { text: t("me.keys.title") }))

  const secretBox = h("div", { class: "secret", hidden: true })
  const keyList = h("ul", { class: "key-list" })
  const renderKeys = () => {
    const keys = ctx.state.member?.keys ?? member.keys // refresh 后取新清单（轮换后旧 key 即时退场）
    keyList.replaceChildren(...(keys.length
      ? keys.map((key) => h("li", { class: "key-item" },
          h("code", { text: key.hint }),
          h("div", { class: "key-meta", text: key.lastUsedAt === null || key.lastUsedAt === undefined
            ? t("me.keys.neverUsed")
            : t("me.keys.lastUsed", { time: ctx.fmtTs(key.lastUsedAt) }) }),
          h("div", { class: "key-meta", text: t("me.keys.windowTokens", { tokens: key.windowTokens ?? 0 }) })))
      : [h("li", { class: "hint", text: t("me.keys.empty") })]))
  }
  renderKeys()

  const rotate = h("button", { type: "button", text: t("me.keys.rotate") })
  rotate.addEventListener("click", async () => {
    if (!window.confirm(t("me.keys.rotateConfirm"))) return
    try {
      const issued = await ctx.api("/api/me/keys/rotate", { method: "POST" })
      ctx.showSecret(secretBox, t("me.keys.secretLabel"), issued.plain)
      await ctx.refresh()
      renderKeys()
    } catch (error) { ctx.fail(error) }
  })
  mount.append(h("section", { class: "card" }, h("h3", { text: t("me.keys.listTitle") }), keyList, h("p", {}, rotate), secretBox))
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
