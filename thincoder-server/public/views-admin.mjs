/**
 * views-admin.mjs — 管理·成员页（webui/WEBUI.md §2/§2.4②）：`#/admin/members`（视口高壳——§2.6②）——成员表（行点击 ⇒ 三态弹窗：
 * 查看 ∥ 编辑 ∥ 新建）；现行操作（分模型配额覆盖 ∥ 重置密码 ∥ 逐 key 吊销）全迁入弹窗；表 = 概览 + 入口（key 数）；
 * 查看态 = 详情（分模型配额 = 覆盖计数）+ 分模型用量节（覆盖行表）+ key 表（表格形——§2.6⑤）；编辑态 = 分模型覆盖表
 * （全 chat 模型行（`deriveModels` 同源序）：模型 ∥ 每月用量输入（空 = 按平台）∥ 平台默认——惰性拉 providers；失败 ⇒
 * 窗内状态行 +「重试」；保存 = `POST /api/members/:id/model-quotas` 键级合并（空 ⇒ 显式 null 删键）——机制全文 = §2.4②/KD-SV-41）。
 * 一次性秘密（新建初始密码 ∥ 重置临时密码）= `ctx.showSecret`（关窗 + 页级回显——仅一次，语义不变）。
 * 原「管理」单页堆叠拆开（一页一职责）；全队用量看板 = views-usage.mjs（二轮迁出——§2.3②）。
 *
 * 判权全在后端（admin 面——服务端 403 为准）；弹窗 = 公共组件 `modal.mjs`（单例 ∥ 遮罩/关闭/焦点）；渲染一律
 * 节点 + textContent；文案经 `t()` 取值；弹窗开着 ⇒ 一切反馈落窗内（窗内状态行——§2.2/弹窗反馈定则）。
 * `openMemberModal` 导出 = 批内件直测（三态驱动）。
 */
import { mapError, t } from "./i18n.mjs"
import { openModal } from "./modal.mjs"
import { deriveModels } from "./views-models.mjs"

/** 详情栅格（标签/值两列——弹窗细节面；值可为节点）。 */
function detailGrid(h, pairs) {
  return h("dl", { class: "detail-grid" }, ...pairs.flatMap(([label, value]) => [h("dt", { text: label }), h("dd", {}, value)]))
}

// ── 页：成员 ────────────────────────────────────────────────────────────────

export async function renderMembers(ctx, mount) {
  const { h } = ctx
  const secretBox = h("div", { class: "secret", hidden: true })

  const membersBox = h("div", { class: "table-slot" }, h("p", { class: "hint", text: t("common.loading") }))
  ctx.dataShell(mount, { // 视口高壳（§2.6②——页题/秘密区/新建行固定 ∥ 表槽吃剩高；表尾计数 = 表内 tfoot）
    head: [
      h("h2", { text: t("admin.members.title") }),
      secretBox,
      h("div", { class: "row-form" },
        h("button", { type: "button", text: t("admin.members.newBtn"), onclick: () => openMemberModal(ctx, { member: null, reload, secretBox }) })),
    ],
    area: h("section", { class: "card" }, membersBox),
  })
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
  await reload()
}

/** 成员表（表 = 概览 + 入口）：展示名 ∥ 用户名 ∥ 角色 ∥ 分模型配额（覆盖计数——`fmtModelQuotas`）∥ 已用 ∥ key 数；行点击（Enter/Space 同开）⇒ 弹窗。 */
function membersTable(ctx, members, open) {
  const { h } = ctx
  const headers = [t("col.name"), t("col.username"), t("col.role"), t("col.quota"), t("col.used"), t("admin.members.colKeyCount")]
  const body = members.map((member) => {
    const tr = h("tr", { class: "row-clickable", tabindex: "0" },
      h("td", { text: member.name }),
      h("td", { text: member.username }),
      h("td", { text: member.role }),
      h("td", { text: ctx.fmtModelQuotas(member.modelQuotas) }),
      h("td", { text: ctx.fmtValue(member.usedTokens) }),
      h("td", { text: String(member.keys.length) }))
    const show = () => open(member)
    tr.addEventListener("click", show)
    tr.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show() } }) // 键盘可达
    return tr
  })
  return h("div", { class: "table-wrap" },
    h("table", {},
      h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))),
      h("tbody", {}, ...body),
      h("tfoot", {}, h("tr", {}, h("td", { colspan: String(headers.length), text: t("common.rowCount", { count: members.length }) })))))
}

/** 成员弹窗（三态：查看 ∥ 编辑 ∥ 新建——§2.4②；`member = null` ⇒ 新建态）。幂等操作（分模型配额 ∥ 吊销）成功 ⇒
 *  弹窗留驻 + 就地重渲（连续操作不丢上下文）；秘密面动作（新建 ∥ 重置）成功 ⇒ 关窗 + 页级一次性回显。 */
export function openMemberModal(ctx, { member, reload, secretBox }) {
  const { h } = ctx
  const bodyBox = h("div")
  const footBox = h("div", { class: "row-form" })
  let current = member // 查看 ∥ 编辑 = 当前成员行（reload 后就地换新）；新建 = null
  let mode = member === null ? "new" : "view"
  let quotaFace = null // 编辑态配额面：null ∥ { status: "loading" | "error" } ∥ { status: "ready", rows, platforms, inputs, hints }
  const quotaNote = h("p", { class: "hint error", hidden: true }) // 窗内状态行（保存失败——定则「弹窗开着 ⇒ 一切反馈落窗内」）
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

  /** 查看态·分模型用量节（覆盖行表：模型 ∥ 每月用量——数据 = `modelQuotas`（含不在服务清单的键）；空 ⇒ hint「未设覆盖——按平台配置」）。 */
  const quotaSummary = () => {
    const rows = Object.entries(current.modelQuotas ?? {}).sort(([left], [right]) => left.localeCompare(right))
    return rows.length === 0
      ? h("p", { class: "hint", text: t("admin.members.quotaEmptyHint") })
      : h("div", { class: "table-wrap" },
        h("table", {},
          h("thead", {}, h("tr", {}, h("th", { text: t("admin.models.colModel") }), h("th", { text: t("admin.members.colMonthlyQuota") }))),
          h("tbody", {}, ...rows.map(([model, quota]) => h("tr", {}, h("td", {}, h("code", { text: model })), h("td", { text: String(quota) }))))))
  }

  /** key 表（表格形——§2.6⑤：密钥 ∥ 最后使用 ∥ 近 30 天 ∥ 操作（吊销行内）；空态 = `.hint` 不进表）。 */
  const keyTable = () => h("div", { class: "table-wrap" },
    h("table", {},
      h("thead", {}, h("tr", {},
        h("th", { text: t("admin.members.colKey") }),
        h("th", { text: t("admin.members.colLastUsed") }),
        h("th", { text: t("admin.members.colWindowTokens") }),
        h("th", { text: t("admin.members.colActions") }))),
      h("tbody", {}, ...current.keys.map((key) => h("tr", {},
        h("td", {}, h("code", { text: key.hint })),
        h("td", { text: key.lastUsedAt === null || key.lastUsedAt === undefined ? t("me.keys.neverUsed") : ctx.fmtTs(key.lastUsedAt) }),
        h("td", { text: t("admin.members.windowTokensCell", { tokens: key.windowTokens ?? 0 }) }),
        h("td", {}, h("button", { class: "tiny danger", text: t("admin.members.revoke"), onclick: () => revoke(key) })))))))

  const renderView = () => {
    const keyList = current.keys.length === 0
      ? h("p", { class: "hint", text: t("admin.members.noKeys") })
      : keyTable()
    bodyBox.replaceChildren(detailGrid(h, [
      [t("col.name"), current.name],
      [t("col.username"), current.username],
      [t("col.role"), current.role],
      [t("col.quota"), ctx.fmtModelQuotas(current.modelQuotas)], // 覆盖计数（0 ⇒「按平台」∥ N ⇒「N 个模型」——三处同源）
      [t("col.used"), ctx.fmtValue(current.usedTokens)],
    ]), h("h4", { text: t("admin.members.modelQuotaTitle") }), quotaSummary(), h("h4", { text: t("admin.members.colKeys") }), keyList)
    footBox.replaceChildren(
      h("button", { type: "button", text: t("admin.members.setQuota"), onclick: () => { mode = "edit"; quotaFace = null; render(); loadQuotaFace() } }),
      h("button", { type: "button", class: "danger", text: t("admin.members.resetPwd"), onclick: resetPassword }),
      h("button", { type: "button", class: "tiny", text: t("common.close"), onclick: () => modal.close() }))
  }

  /** 编辑态·覆盖表（全 chat 模型行：模型 ∥ 每月用量输入（空 = 按平台——placeholder）∥ 平台默认（只读——未设 ⇒「不限」）；
   *  输入/提示节点留档供保存读值；不在服务清单的覆盖键 ⇒ 注行（恒不触碰）。 */
  const quotaEditTable = (face) => {
    const inputs = new Map(), hints = new Map()
    const body = face.rows.map((row) => {
      const input = h("input", { type: "text", inputmode: "numeric", autocomplete: "off", class: "quota",
        placeholder: t("common.quotaByPlatform"), value: current.modelQuotas?.[row.id] === undefined ? "" : String(current.modelQuotas[row.id]) })
      const hint = h("p", { class: "hint error", hidden: true })
      inputs.set(row.id, input)
      hints.set(row.id, hint)
      const platform = face.platforms.get(row.id)
      return h("tr", {},
        h("td", {}, h("code", { text: row.id })),
        h("td", {}, input, hint),
        h("td", { text: platform === null ? t("common.quotaUnlimited") : String(platform) }))
    })
    face.inputs = inputs
    face.hints = hints
    const offList = Object.keys(current.modelQuotas ?? {}).filter((id) => !face.rows.some((row) => row.id === id))
    return [
      h("div", { class: "table-wrap quota-table" },
        h("table", {},
          h("thead", {}, h("tr", {},
            h("th", { text: t("admin.models.colModel") }),
            h("th", { text: t("admin.members.colMonthlyQuota") }),
            h("th", { text: t("admin.members.colPlatformQuota") }))),
          h("tbody", {}, ...body))),
      ...(offList.length === 0 ? [] : [h("p", { class: "hint", text: t("admin.members.quotaOffListNote", { count: offList.length }) })]),
    ]
  }

  /** 惰性拉 providers（进编辑态首个）：成功 ⇒ 全 chat 模型行（同源序）+ 平台默认；失败 ⇒ 窗内状态行 +「重试」（§2.4②）。 */
  const loadQuotaFace = async () => {
    quotaFace = { status: "loading" }
    quotaNote.hidden = true
    if (mode === "edit") render()
    try {
      const data = await ctx.api("/api/admin/providers")
      const providers = data.providers ?? []
      const rows = deriveModels(providers, null)
      const platformOf = (row) => ((providers.find((item) => item.name === row.provider)?.settings ?? {})[row.upstream] ?? {}).quotaTokens ?? null
      quotaFace = { status: "ready", rows, platforms: new Map(rows.map((row) => [row.id, platformOf(row)])) }
    } catch (error) {
      if (error?.status === 401 && error?.code !== "invalid_credentials") { ctx.fail(error); return } // 会话失效 ⇒ 照常踢登录
      quotaFace = { status: "error" }
    }
    if (mode === "edit") render() // 落定后重渲（期间取消切走 ⇒ 不覆盖查看态）
  }

  const renderEdit = () => {
    const face = quotaFace
    bodyBox.replaceChildren(h("h4", { text: t("admin.members.modelQuotaTitle") }),
      ...(face === null || face.status === "loading" ? [h("p", { class: "hint", text: t("common.loading") })]
        : face.status === "error" ? [h("p", { class: "hint error", text: t("admin.members.quotaLoadFailed") }),
          h("button", { type: "button", class: "tiny", text: t("admin.members.quotaRetry"), onclick: () => loadQuotaFace() })]
          : [...quotaEditTable(face), quotaNote]))
    footBox.replaceChildren(
      h("button", { type: "button", text: t("common.save"), disabled: face?.status !== "ready", onclick: saveQuotas }),
      h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => { mode = "view"; render() } })) // 取消 = 丢弃输入
  }

  /** 保存 = `POST /api/members/:id/model-quotas`（键级合并：每行空 ⇒ 显式 null（删键）；非法 ⇒ 就地提示不提交）⇒ 回查看态 + 弹窗与表同刷新。 */
  const saveQuotas = async () => {
    const { rows, inputs, hints } = quotaFace
    for (const hint of hints.values()) hint.hidden = true
    const quotas = {}
    for (const row of rows) {
      const raw = inputs.get(row.id).value.trim()
      if (raw === "") { quotas[row.id] = null; continue } // 空 = 按平台（显式 null ⇒ 删键）
      const value = Number(raw)
      if (!Number.isInteger(value) || value < 0) { // 非法 ⇒ 就地提示不提交（服务端复核为准）
        hints.get(row.id).textContent = t("admin.models.invalidNumber", { field: t("admin.members.colMonthlyQuota"), rule: t("admin.models.ruleNonNegativeInt") })
        hints.get(row.id).hidden = false
        inputs.get(row.id).focus()
        return
      }
      quotas[row.id] = value
    }
    try {
      const done = await ctx.api(`/api/members/${current.id}/model-quotas`, { method: "POST", body: { quotas } })
      current = { ...current, modelQuotas: done.modelQuotas ?? current.modelQuotas } // 返回形 = {id, modelQuotas}
      mode = "view"
      await refresh() // 回查看态 + 弹窗与表同刷新
    } catch (error) {
      if (error?.status === 401 && error?.code !== "invalid_credentials") { ctx.fail(error); return } // 会话失效 ⇒ 照常踢登录
      quotaNote.hidden = false
      quotaNote.textContent = mapError(error) // 失败 ⇒ 窗内状态行（弹窗留驻）
    }
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
