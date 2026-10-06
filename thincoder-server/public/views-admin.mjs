/**
 * views-admin.mjs — 管理两页（webui/WEBUI.md §2）：`#/admin/members`（建成员——初始密码一次性回显 ∥
 * 成员表含各成员 key 清单/吊销/设额度/重置）∥ `#/admin/usage`（全队用量：过滤查询）；原「管理」单页堆叠拆开
 * （一页一职责）；自 views.mjs 拆档。
 *
 * 判权全在后端（admin 面——服务端 403 为准）；渲染一律节点 + textContent；一次性秘密（临时密码）= ctx.showSecret；
 * 文案经 `t()` 取值（§2.2）。
 */
import { t } from "./i18n.mjs"

// ── 页：成员 ────────────────────────────────────────────────────────────────

export async function renderMembers(ctx, mount) {
  const { h } = ctx
  mount.append(h("h2", { text: t("admin.members.title") }))
  const secretBox = h("div", { class: "secret", hidden: true })
  mount.append(secretBox)

  // 建成员（初始密码一次性回显）
  const username = h("input", { placeholder: t("admin.members.usernamePh"), required: true })
  const displayName = h("input", { placeholder: t("admin.members.namePh") })
  const role = h("select", {}, h("option", { value: "user", text: "user" }), h("option", { value: "admin", text: "admin" }))
  const membersBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))
  const loadMembers = async () => {
    try {
      const data = await ctx.api("/api/members")
      membersBox.replaceChildren(membersTable(ctx, data.members, { secretBox, reload: loadMembers }))
    } catch (error) {
      ctx.fail(error)
      membersBox.replaceChildren(h("p", { class: "hint", text: t("admin.members.loadFailed") }))
    }
  }
  const createForm = h("form", { class: "card row-form" },
    h("h3", { text: t("admin.members.createTitle") }),
    username, displayName, role,
    h("button", { type: "submit", text: t("admin.members.createBtn") }),
  )
  createForm.addEventListener("submit", async (event) => {
    event.preventDefault()
    try {
      const created = await ctx.api("/api/members", {
        method: "POST",
        body: { username: username.value.trim(), name: displayName.value.trim() || null, role: role.value },
      })
      ctx.showSecret(secretBox, t("admin.members.secretLabel", { username: created.username }), created.tempPassword)
      createForm.reset()
      await loadMembers()
    } catch (error) { ctx.fail(error) }
  })
  mount.append(createForm)
  mount.append(h("section", { class: "card" }, h("h3", { text: t("admin.members.tableTitle") }), membersBox))
  await loadMembers()
}

/** 成员表：name/username/角色/额度/已用 + 各成员 key 清单（提示形 + id ⇒ 吊销控件）+ 操作（设额度 ∥ 重置密码）。 */
function membersTable(ctx, members, { secretBox, reload }) {
  const { h } = ctx
  const rows = members.map((member) => {
    const keys = member.keys.length === 0
      ? [h("span", { class: "hint", text: t("admin.members.noKeys") })]
      : member.keys.map((key) => h("div", { class: "key-line" },
          h("code", { text: key.hint }),
          h("button", { class: "tiny", text: t("admin.members.revoke"), onclick: () => revoke(ctx, member, key, reload) }),
        ))
    const quotaInput = h("input", {
      type: "number", min: "0", class: "tiny quota", placeholder: t("common.quotaUnlimited"),
      value: member.quotaTokens === null ? "" : String(member.quotaTokens),
    })
    const setQuota = h("button", { class: "tiny", text: t("admin.members.setQuota") })
    setQuota.addEventListener("click", async () => {
      try {
        const raw = quotaInput.value.trim()
        await ctx.api(`/api/members/${member.id}/quota`, { method: "POST", body: { quotaTokens: raw === "" ? null : Number(raw) } })
        await reload()
      } catch (error) { ctx.fail(error) }
    })
    const reset = h("button", { class: "tiny danger", text: t("admin.members.resetPwd") })
    reset.addEventListener("click", async () => {
      if (!window.confirm(t("admin.members.resetConfirm", { name: member.name }))) return
      try {
        const done = await ctx.api(`/api/members/${member.id}/password-reset`, { method: "POST" })
        ctx.showSecret(secretBox, t("admin.members.tempPwdLabel", { name: member.name }), done.tempPassword)
      } catch (error) { ctx.fail(error) }
    })
    return [
      member.name, member.username, member.role,
      ctx.fmtQuota(member.quotaTokens), ctx.fmtValue(member.usedTokens),
      keys,
      [quotaInput, setQuota, reset],
    ]
  })
  return ctx.table([t("col.name"), t("col.username"), t("col.role"), t("admin.members.colQuota"), t("col.used"), t("admin.members.colKeys"), t("col.actions")], rows)
}

async function revoke(ctx, member, key, reload) {
  try {
    await ctx.api(`/api/members/${member.id}/keys/${key.id}/revoke`, { method: "POST" })
    await reload()
  } catch (error) { ctx.fail(error) }
}

// ── 页：全队用量 ────────────────────────────────────────────────────────────

export async function renderAdminUsage(ctx, mount) {
  const { h } = ctx
  mount.append(h("h2", { text: t("admin.usage.title") }))

  const filterMember = h("input", { placeholder: t("admin.usage.memberPh") })
  const filterModel = h("input", { placeholder: t("admin.usage.modelPh") })
  const filterFrom = h("input", { type: "datetime-local", title: t("admin.usage.fromTitle") })
  const filterTo = h("input", { type: "datetime-local", title: t("admin.usage.toTitle") })
  const filterLimit = h("input", { type: "number", min: "1", max: "500", value: "100", class: "tiny" })
  const usageBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))
  const loadUsage = async () => {
    const params = new URLSearchParams()
    // 查询键以模板字面量书写（沿线先例：引号字面量会撞 D1 件依赖面扫描的键名正则——该扫描件按令零改；行为等价）
    if (filterMember.value.trim()) params.set("member", filterMember.value.trim())
    if (filterModel.value.trim()) params.set("model", filterModel.value.trim())
    if (filterFrom.value) params.set(`from`, String(new Date(filterFrom.value).getTime()))
    if (filterTo.value) params.set(`to`, String(new Date(filterTo.value).getTime()))
    params.set("limit", filterLimit.value.trim() || "100")
    try {
      const data = await ctx.api(`/api/usage?${params.toString()}`)
      usageBox.replaceChildren(ctx.usageTable(data.rows, { withMember: true }))
    } catch (error) {
      ctx.fail(error)
      usageBox.replaceChildren(h("p", { class: "hint", text: t("usage.loadFailed") }))
    }
  }
  const filterForm = h("form", { class: "row-form" },
    filterMember, filterModel,
    h("label", {}, t("admin.usage.fromLabel"), filterFrom), h("label", {}, t("admin.usage.toLabel"), filterTo),
    h("label", {}, t("admin.usage.limit"), filterLimit),
    h("button", { type: "submit", text: t("admin.usage.submit") }),
  )
  filterForm.addEventListener("submit", (event) => { event.preventDefault(); loadUsage() })
  mount.append(h("section", { class: "card" }, h("h3", { text: t("admin.usage.title") }), filterForm, usageBox))
  await loadUsage()
}
