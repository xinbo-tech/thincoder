/**
 * views-admin.mjs — 管理·成员页（webui/WEBUI.md §2/§2.4②）：`#/admin/members`——成员表（行点击 ⇒ 三态弹窗：
 * 查看 ∥ 编辑 ∥ 新建）；现行操作（设额度 ∥ 重置密码 ∥ 逐 key 吊销）全迁入弹窗；表 = 概览 + 入口（key 数）。
 * 一次性秘密（新建初始密码 ∥ 重置临时密码）= `ctx.showSecret`（关窗 + 页级回显——仅一次，语义不变）。
 * 原「管理」单页堆叠拆开（一页一职责）；全队用量看板 = views-usage.mjs（二轮迁出——§2.3②）。
 *
 * 判权全在后端（admin 面——服务端 403 为准）；弹窗 = 公共组件 `modal.mjs`（单例 ∥ 遮罩/关闭/焦点）；渲染一律
 * 节点 + textContent；文案经 `t()` 取值（§2.2）。`openMemberModal` 导出 = 批内件直测（三态驱动）。
 */
import { t } from "./i18n.mjs"
import { openModal } from "./modal.mjs"

/** 详情栅格（标签/值两列——弹窗细节面；值可为节点）。 */
function detailGrid(h, pairs) {
  return h("dl", { class: "detail-grid" }, ...pairs.flatMap(([label, value]) => [h("dt", { text: label }), h("dd", {}, value)]))
}

// ── 页：成员 ────────────────────────────────────────────────────────────────

export async function renderMembers(ctx, mount) {
  const { h } = ctx
  mount.append(h("h2", { text: t("admin.members.title") }))
  const secretBox = h("div", { class: "secret", hidden: true })
  mount.append(secretBox)

  const membersBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))
  /** 取成员集（表渲染 + 弹窗刷新共用）：失败 ⇒ null（降级面 = 页内文案；调用方按需处置）。 */
  const reload = async () => {
    try {
      const data = await ctx.api("/api/members")
      membersBox.replaceChildren(data.members.length === 0
        ? h("p", { class: "hint", text: t("admin.members.empty") })
        : membersTable(ctx, data.members, (member) => openMemberModal(ctx, { member, reload, secretBox })))
      return data.members
    } catch (error) {
      ctx.fail(error)
      membersBox.replaceChildren(h("p", { class: "hint error", text: t("admin.members.loadFailed") }))
      return null
    }
  }
  mount.append(h("div", { class: "row-form" },
    h("button", { type: "button", text: t("admin.members.newBtn"), onclick: () => openMemberModal(ctx, { member: null, reload, secretBox }) })))
  mount.append(h("section", { class: "card" }, membersBox))
  await reload()
}

/** 成员表（表 = 概览 + 入口）：展示名 ∥ 用户名 ∥ 角色 ∥ 额度 ∥ 已用 ∥ key 数；行点击（Enter/Space 同开）⇒ 弹窗。 */
function membersTable(ctx, members, open) {
  const { h } = ctx
  const headers = [t("col.name"), t("col.username"), t("col.role"), t("admin.members.colQuota"), t("col.used"), t("admin.members.colKeyCount")]
  const body = members.map((member) => {
    const tr = h("tr", { class: "row-clickable", tabindex: "0" },
      h("td", { text: member.name }),
      h("td", { text: member.username }),
      h("td", { text: member.role }),
      h("td", { text: ctx.fmtQuota(member.quotaTokens) }),
      h("td", { text: ctx.fmtValue(member.usedTokens) }),
      h("td", { text: String(member.keys.length) }))
    const show = () => open(member)
    tr.addEventListener("click", show)
    tr.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show() } }) // 键盘可达
    return tr
  })
  return h("div", { class: "table-wrap" },
    h("table", {}, h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))), h("tbody", {}, ...body)))
}

/** 成员弹窗（三态：查看 ∥ 编辑 ∥ 新建——§2.4②；`member = null` ⇒ 新建态）。幂等操作（额度 ∥ 吊销）成功 ⇒
 *  弹窗留驻 + 就地重渲（连续操作不丢上下文）；秘密面动作（新建 ∥ 重置）成功 ⇒ 关窗 + 页级一次性回显。 */
export function openMemberModal(ctx, { member, reload, secretBox }) {
  const { h } = ctx
  const bodyBox = h("div")
  const footBox = h("div", { class: "row-form" })
  let current = member // 查看 ∥ 编辑 = 当前成员行（reload 后就地换新）；新建 = null
  let mode = member === null ? "new" : "view"
  const modal = openModal({
    title: member === null ? t("admin.members.createTitle") : member.name,
    body: bodyBox,
    footer: footBox,
  })

  /** 表 + 弹窗就地刷新（幂等操作成功后）：成员行换新 ⇒ 重渲当前态。 */
  const refresh = async () => {
    const members = await reload()
    const fresh = members?.find((item) => item.id === current.id)
    if (fresh) current = fresh
    render()
  }
  const revoke = async (key) => {
    try {
      await ctx.api(`/api/members/${current.id}/keys/${key.id}/revoke`, { method: "POST" })
      await refresh() // 留驻 + 就地重渲
    } catch (error) { ctx.fail(error) }
  }
  const resetPassword = async () => {
    if (!window.confirm(t("admin.members.resetConfirm", { name: current.name }))) return
    try {
      const done = await ctx.api(`/api/members/${current.id}/password-reset`, { method: "POST" })
      ctx.showSecret(secretBox, t("admin.members.tempPwdLabel", { name: current.name }), done.tempPassword) // 关窗 + 页级回显（仅一次）
      modal.close()
    } catch (error) { ctx.fail(error) }
  }

  const renderView = () => {
    const keyList = current.keys.length === 0
      ? h("p", { class: "hint", text: t("admin.members.noKeys") })
      : h("ul", { class: "key-list" }, ...current.keys.map((key) => h("li", { class: "key-item" },
          h("code", { text: key.hint }),
          h("div", { class: "key-meta", text: key.lastUsedAt === null || key.lastUsedAt === undefined
            ? t("me.keys.neverUsed")
            : t("me.keys.lastUsed", { time: ctx.fmtTs(key.lastUsedAt) }) }),
          h("div", { class: "key-meta", text: t("me.keys.windowTokens", { tokens: key.windowTokens ?? 0 }) }),
          h("button", { class: "tiny danger", text: t("admin.members.revoke"), onclick: () => revoke(key) }))))
    bodyBox.replaceChildren(detailGrid(h, [
      [t("col.name"), current.name],
      [t("col.username"), current.username],
      [t("col.role"), current.role],
      [t("col.quota"), ctx.fmtQuota(current.quotaTokens)],
      [t("col.used"), ctx.fmtValue(current.usedTokens)],
    ]), h("h4", { text: t("admin.members.colKeys") }), keyList)
    footBox.replaceChildren(
      h("button", { type: "button", text: t("admin.members.setQuota"), onclick: () => { mode = "edit"; render() } }),
      h("button", { type: "button", class: "danger", text: t("admin.members.resetPwd"), onclick: resetPassword }),
      h("button", { type: "button", class: "tiny", text: t("common.close"), onclick: () => modal.close() }))
  }

  const renderEdit = () => {
    const quotaInput = h("input", { type: "number", min: "0", class: "quota", placeholder: t("common.quotaUnlimited"), value: current.quotaTokens === null ? "" : String(current.quotaTokens) })
    bodyBox.replaceChildren(h("label", {}, t("col.quota"), quotaInput)) // 空 = 不限
    footBox.replaceChildren(
      h("button", { type: "button", text: t("common.save"), onclick: async () => {
        const raw = quotaInput.value.trim()
        try {
          const saved = await ctx.api(`/api/members/${current.id}/quota`, { method: "POST", body: { quotaTokens: raw === "" ? null : Number(raw) } })
          current = { ...current, quotaTokens: saved.quotaTokens }
          mode = "view"
          await refresh() // 回查看态 + 弹窗与表同刷新
        } catch (error) { ctx.fail(error) }
      } }),
      h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => { mode = "view"; render() } })) // 取消 = 丢弃输入
    quotaInput.focus() // 调用方定首选（平台焦点语义）
  }

  const renderNew = () => {
    const username = h("input", { placeholder: t("admin.members.usernamePh"), required: true })
    const displayName = h("input", { placeholder: t("admin.members.namePh") })
    const role = h("select", {}, h("option", { value: "user", text: "user" }), h("option", { value: "admin", text: "admin" }))
    bodyBox.replaceChildren(h("div", { class: "stack" }, username, displayName, role))
    footBox.replaceChildren(
      h("button", { type: "button", text: t("admin.members.createBtn"), onclick: async () => {
        try {
          const created = await ctx.api("/api/members", { method: "POST", body: { username: username.value.trim(), name: displayName.value.trim() || null, role: role.value } })
          ctx.showSecret(secretBox, t("admin.members.secretLabel", { username: created.username }), created.tempPassword) // 关窗 + 页级回显（仅一次）
          modal.close()
          await reload()
        } catch (error) { ctx.fail(error) } // 失败 ⇒ flash（弹窗留驻）
      } }),
      h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() }))
    username.focus()
  }

  const render = () => {
    if (mode === "new") renderNew()
    else if (mode === "edit") renderEdit()
    else renderView()
  }
  render()
  return modal
}
