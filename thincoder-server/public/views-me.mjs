/**
 * views-me.mjs — 我的三页（webui/WEBUI.md §2）：`#/me/keys`（key 清单 ∥ 签发/轮换）∥ `#/me/usage`
 * （本月额度/已用摘要 + 本人用量明细）∥ `#/me/account`（基本信息 + 自助改密）；自 views.mjs 拆档（一页一职责）。
 *
 * 数据全经 /api/*（契约 = accounts/ACCOUNTS.md §3 ∥ metering/METERING.md §3）；一次性秘密（key 明文）
 * 只回显一次（ctx.showSecret）；渲染一律节点 + textContent；文案经 `t()` 取值（§2.2）。
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
      ? keys.map((key) => h("li", {}, h("code", { text: key.hint })))
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
  mount.append(h("h2", { text: t("me.usage.title") }))
  mount.append(h("section", { class: "card" }, h("h3", { text: t("me.usage.summary") }),
    ctx.table([t("col.name"), t("col.username"), t("col.quota"), t("col.used")], [[
      member.name, member.username, ctx.fmtQuota(member.quotaTokens), ctx.fmtValue(member.usedTokens),
    ]])))
  const usageBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))
  mount.append(h("section", { class: "card" }, h("h3", { text: t("me.usage.detail") }), usageBox))
  try {
    const data = await ctx.api("/api/me/usage?limit=100")
    usageBox.replaceChildren(ctx.usageTable(data.rows, { withMember: false }))
  } catch (error) {
    ctx.fail(error)
    usageBox.replaceChildren(h("p", { class: "hint", text: t("usage.loadFailed") }))
  }
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
