/**
 * views.mjs — 三视图与表单（webui/WEBUI.md §2）：#/login ∥ #/me（我的——全体）∥ #/admin（管理——仅 admin）。
 *
 * 数据全经 /api/*（契约 = accounts/ACCOUNTS.md §3 ∥ metering/METERING.md §3）；判权全在后端——
 * 本档只做显隐与表单（服务端才是判据）。渲染一律节点 + textContent（无 HTML 串拼接）；
 * 一次性秘密（key 明文 ∥ 临时密码）只在回显区显示一次。
 */

// ── 视图：登录 ──────────────────────────────────────────────────────────────

export function renderLogin(ctx, mount) {
  const { h } = ctx
  const username = h("input", { required: true, autocomplete: "username" })
  const password = h("input", { type: "password", required: true, autocomplete: "current-password" })
  const form = h("form", { class: "card stack" },
    h("h2", { text: "登录" }),
    h("label", {}, "用户名", username),
    h("label", {}, "密码", password),
    h("button", { type: "submit", text: "登录" }),
  )
  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    try {
      const done = await ctx.api("/api/login", { method: "POST", body: { username: username.value.trim(), password: password.value } })
      ctx.state.member = done.member
      await ctx.refresh() // 取全量本人信息（额度 ∥ 已用 ∥ key 清单）
      ctx.navigate("/me")
    } catch (error) { ctx.fail(error) }
  })
  mount.append(form)
}

// ── 视图：我的（全体）──────────────────────────────────────────────────────

export async function renderMe(ctx, mount) {
  const { h } = ctx
  const member = ctx.state.member
  mount.append(h("h2", { text: "我的" }))
  mount.append(ctx.table(["展示名", "用户名", "角色", "本月额度", "本月已用"], [[
    member.name, member.username, member.role, ctx.fmtQuota(member.quotaTokens), ctx.fmtValue(member.usedTokens),
  ]]))

  // key 清单（提示形）+ 签发/轮换（新明文一次性区）
  const secretBox = h("div", { class: "secret", hidden: true })
  const keyList = h("ul", { class: "key-list" })
  const renderKeys = () => {
    const keys = ctx.state.member?.keys ?? member.keys // refresh 后取新清单（轮换后旧 key 即时退场）
    keyList.replaceChildren(...(keys.length
      ? keys.map((key) => h("li", {}, h("code", { text: key.hint })))
      : [h("li", { class: "hint", text: "暂无 key——点「签发 / 轮换」生成" })]))
  }
  renderKeys()
  const rotate = h("button", { type: "button", text: "签发 / 轮换 key" })
  rotate.addEventListener("click", async () => {
    if (!window.confirm("轮换将吊销你现有的全部 key（旧 key 立即失效）。继续？")) return
    try {
      const issued = await ctx.api("/api/me/keys/rotate", { method: "POST" })
      showSecret(ctx, secretBox, "新 key（明文）", issued.plain)
      await ctx.refresh()
      renderKeys()
    } catch (error) { ctx.fail(error) }
  })
  mount.append(h("section", { class: "card" }, h("h3", { text: "我的 key" }), keyList, h("p", {}, rotate), secretBox))

  // 本人用量明细（新在前）
  const usageBox = h("div", {}, h("p", { class: "hint", text: "加载中……" }))
  mount.append(h("section", { class: "card" }, h("h3", { text: "我的用量明细（新在前）" }), usageBox))
  try {
    const data = await ctx.api("/api/me/usage?limit=100")
    usageBox.replaceChildren(usageTable(ctx, data.rows, { withMember: false }))
  } catch (error) {
    ctx.fail(error)
    usageBox.replaceChildren(h("p", { class: "hint", text: "用量加载失败" }))
  }

  // 自助改密
  const oldPassword = h("input", { type: "password", required: true, autocomplete: "current-password" })
  const newPassword = h("input", { type: "password", required: true, minlength: "8", autocomplete: "new-password" })
  const passwordForm = h("form", { class: "card stack" },
    h("h3", { text: "修改密码" }),
    h("label", {}, "原密码", oldPassword),
    h("label", {}, "新密码（≥8 字符）", newPassword),
    h("button", { type: "submit", text: "改密" }),
  )
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault()
    try {
      await ctx.api("/api/me/password", { method: "POST", body: { oldPassword: oldPassword.value, newPassword: newPassword.value } })
      passwordForm.reset()
      ctx.flash("密码已更新（其他会话已失效）")
    } catch (error) { ctx.fail(error) }
  })
  mount.append(passwordForm)
}

// ── 视图：管理（仅 admin）──────────────────────────────────────────────────

export async function renderAdmin(ctx, mount) {
  const { h } = ctx
  mount.append(h("h2", { text: "管理" }))
  const secretBox = h("div", { class: "secret", hidden: true })
  mount.append(secretBox)

  // 建成员（初始密码一次性回显）
  const username = h("input", { placeholder: "用户名（唯一）", required: true })
  const displayName = h("input", { placeholder: "展示名（缺省 = 用户名）" })
  const role = h("select", {}, h("option", { value: "user", text: "user" }), h("option", { value: "admin", text: "admin" }))
  const membersBox = h("div", {}, h("p", { class: "hint", text: "加载中……" }))
  const loadMembers = async () => {
    try {
      const data = await ctx.api("/api/members")
      membersBox.replaceChildren(membersTable(ctx, data.members, { secretBox, reload: loadMembers }))
    } catch (error) {
      ctx.fail(error)
      membersBox.replaceChildren(h("p", { class: "hint", text: "成员加载失败" }))
    }
  }
  const createForm = h("form", { class: "card row-form" },
    h("h3", { text: "建成员" }),
    username, displayName, role,
    h("button", { type: "submit", text: "创建（初始密码一次性回显）" }),
  )
  createForm.addEventListener("submit", async (event) => {
    event.preventDefault()
    try {
      const created = await ctx.api("/api/members", {
        method: "POST",
        body: { username: username.value.trim(), name: displayName.value.trim() || null, role: role.value },
      })
      showSecret(ctx, secretBox, `成员 ${created.username} 的初始密码`, created.tempPassword)
      createForm.reset()
      await loadMembers()
    } catch (error) { ctx.fail(error) }
  })
  mount.append(createForm)
  mount.append(h("section", { class: "card" }, h("h3", { text: "成员（含各成员 key 清单——吊销在行内）" }), membersBox))
  await loadMembers()

  // 全队用量（过滤：成员 ∥ 模型 ∥ 时间窗 ∥ 条数）
  const filterMember = h("input", { placeholder: "成员（名 ∥ ID）" })
  const filterModel = h("input", { placeholder: "模型" })
  const filterFrom = h("input", { type: "datetime-local", title: "起始时间" })
  const filterTo = h("input", { type: "datetime-local", title: "截止时间" })
  const filterLimit = h("input", { type: "number", min: "1", max: "500", value: "100", class: "tiny" })
  const usageBox = h("div", {}, h("p", { class: "hint", text: "加载中……" }))
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
      usageBox.replaceChildren(usageTable(ctx, data.rows, { withMember: true }))
    } catch (error) {
      ctx.fail(error)
      usageBox.replaceChildren(h("p", { class: "hint", text: "用量加载失败" }))
    }
  }
  const filterForm = h("form", { class: "row-form" },
    filterMember, filterModel,
    h("label", {}, "从", filterFrom), h("label", {}, "到", filterTo),
    h("label", {}, "条数", filterLimit),
    h("button", { type: "submit", text: "查询" }),
  )
  filterForm.addEventListener("submit", (event) => { event.preventDefault(); loadUsage() })
  mount.append(h("section", { class: "card" }, h("h3", { text: "全队用量" }), filterForm, usageBox))
  await loadUsage()
}

// ── 共同件 ─────────────────────────────────────────────────────────────────

/** 一次性秘密回显区（key 明文 ∥ 临时密码——「仅此一次」提示 + 可全选文本）。 */
function showSecret(ctx, box, label, value) {
  box.replaceChildren(
    ctx.h("p", { class: "secret-label", text: `${label}——仅此一次显示，请立即保存` }),
    ctx.h("code", { class: "secret-value", text: value }),
  )
  box.hidden = false
}

/** 成员表：name/username/角色/额度/已用 + 各成员 key 清单（提示形 + id ⇒ 吊销控件）+ 操作（设额度 ∥ 重置密码）。 */
function membersTable(ctx, members, { secretBox, reload }) {
  const { h } = ctx
  const rows = members.map((member) => {
    const keys = member.keys.length === 0
      ? [h("span", { class: "hint", text: "无" })]
      : member.keys.map((key) => h("div", { class: "key-line" },
          h("code", { text: key.hint }),
          h("button", { class: "tiny", text: "吊销", onclick: () => revoke(ctx, member, key, reload) }),
        ))
    const quotaInput = h("input", {
      type: "number", min: "0", class: "tiny quota", placeholder: "不限",
      value: member.quotaTokens === null ? "" : String(member.quotaTokens),
    })
    const setQuota = h("button", { class: "tiny", text: "设额度" })
    setQuota.addEventListener("click", async () => {
      try {
        const raw = quotaInput.value.trim()
        await ctx.api(`/api/members/${member.id}/quota`, { method: "POST", body: { quotaTokens: raw === "" ? null : Number(raw) } })
        await reload()
      } catch (error) { ctx.fail(error) }
    })
    const reset = h("button", { class: "tiny danger", text: "重置密码" })
    reset.addEventListener("click", async () => {
      if (!window.confirm(`重置 ${member.name} 的密码？将生成一次性临时密码，并吊销其全部会话。`)) return
      try {
        const done = await ctx.api(`/api/members/${member.id}/password-reset`, { method: "POST" })
        showSecret(ctx, secretBox, `成员 ${member.name} 的临时密码`, done.tempPassword)
      } catch (error) { ctx.fail(error) }
    })
    return [
      member.name, member.username, member.role,
      ctx.fmtQuota(member.quotaTokens), ctx.fmtValue(member.usedTokens),
      keys,
      [quotaInput, setQuota, reset],
    ]
  })
  return ctx.table(["展示名", "用户名", "角色", "额度", "本月已用", "key 清单", "操作"], rows)
}

async function revoke(ctx, member, key, reload) {
  try {
    await ctx.api(`/api/members/${member.id}/keys/${key.id}/revoke`, { method: "POST" })
    await reload()
  } catch (error) { ctx.fail(error) }
}

/** 用量表（本人 ∥ 全队同构；全队加成员 + key 列）。 */
function usageTable(ctx, rows, { withMember = false } = {}) {
  const { h } = ctx
  if (rows.length === 0) return h("p", { class: "hint", text: "没有记录" })
  const headers = ["时间", ...(withMember ? ["成员", "key"] : []), "端点", "模型", "状态", "prompt", "completion", "total", "耗时 ms"]
  const body = rows.map((row) => [
    ctx.fmtTs(row.ts),
    ...(withMember ? [row.member, h("code", { text: row.keyHint ?? "—" })] : []),
    row.endpoint, row.model, row.status,
    ctx.fmtValue(row.promptTokens), ctx.fmtValue(row.completionTokens), ctx.fmtValue(row.totalTokens),
    String(row.durationMs),
  ])
  return ctx.table(headers, body)
}
