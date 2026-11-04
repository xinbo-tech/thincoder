/**
 * views-ledger.mjs — 我的·团队台账（webui/LEDGER.md §2.1——KD-SV-148；team-ledger 批；台账 #1206）：
 * `#/me/ledger`——页头（页题 + 「新建」钮）+ 筛选行（三筛：仓 ∥ 状态 ∥ 负责人 + 「清除」——即选即查）+ 表槽（加载/空/错三态）
 * + 表七列（编号 ∥ 仓 ∥ 标题 ∥ 状态 + 老化标 ∥ 负责人 ∥ 更新 ∥ 操作）+ 行点击 ⇒ 详情/编辑弹窗。
 *
 * 详情段（恒显）：编号 ∥ 仓（`repos[]` 显示名回填——缺（项目已删）⇒ 归地址）∥ 状态 ∥ 负责人 ∥ 创建者 ∥ 创建/更新时间 ∥ 正文；
 * 编辑段（仅 `canWrite` 渲）：标题 ∥ 正文 ∥ 负责人 ∥ 状态选单（= 迁移表合法后继 ∪ 当前值——表逐字对齐
 * `thincoder-server/src/ledger/items.mjs`，单测档机检两处相等；归档态 = 终态门先行 ⇒ 仅当前值）；仓不可改（只读选单——记账键）。
 * 行内动作（仅 `canWrite` 渲）：「收口」（核销只自 待核销——服务端 400 人话行内就地呈）∥「撤回」（非原生 confirm + 后果句）。
 * 新建弹窗：仓（选单 = `repos[]` 中 `canWrite` 者；无可写项目 ⇒ 钮禁用 + 括注「需先加入项目」）∥ 标题 ∥ 正文 ∥ 负责人（缺省 = 自己）。
 *
 * 判权全在后端：控件显隐 = `canWrite` 读数（行级 ∥ `repos[]` 级）——页面不是判据（直打端点仍 403/404；`webui/WEBUI.md` §3）；
 * 渲染一律节点 + textContent（零拼串）；文案经 `t()` 取值（`webui/I18N.md` §2.1）；失败就地人话（列表读败 = `ctx.fail` + 页内句 ∥
 * 窗内/行内动作 = 状态行）。端点 = gateway/API.md §2.10。导出面 = 单元测试档直测（`STATUS_VALUES` ∥ `STATUS_KEYS` ∥
 * `ALLOWED_MIGRATIONS` ∥ `statusLabel` ∥ `nextStatusOptions` ∥ `repoNameOf` ∥ 共用件两枚：`openLedgerDetail` ∥ `openCreateLedger`）。
 *
 * 域语汇注：六态线上值 = 中文词（沿本机台账——`ledger/LEDGER.md` §3/KD-SV-141）；前端唯一 CJK 载体 = zh 表
 * （`webui/I18N.md` §2.1 零 CJK 口径）⇒ 本档零 CJK 字面量，六态值/迁移表自 zh 表取词（`V`）；单测档机检
 * 值集与迁移表 = 服务端 `src/ledger/items.mjs` 逐字（防两面漂移）。
 */
import { ZH } from "./i18n-zh.mjs"
import { mapError, t } from "./i18n.mjs"
import { confirmModal, field, openModal, showNote, submitThen } from "./modal.mjs"

/** 六态数据值（线上值——域语汇为中文：沿本机台账 KD-SV-141；值恒取 zh 表词，与界面语言无关——
 *  展示标签经 `t()` 随动；枚举外原值兜底）。 */
const V = Object.freeze({
  discuss: ZH["me.ledger.status.discuss"],
  design: ZH["me.ledger.status.design"],
  inflight: ZH["me.ledger.status.inflight"],
  closeout: ZH["me.ledger.status.closeout"],
  closed: ZH["me.ledger.status.closed"],
  withdrawn: ZH["me.ledger.status.withdrawn"],
})

/** 六态值集（序 = 状态机序——与 `src/ledger/items.mjs` `STATUSES` 同序；单测档机检逐字相等）。 */
export const STATUS_VALUES = Object.freeze([V.discuss, V.design, V.inflight, V.closeout, V.closed, V.withdrawn])

/** 六态文案键（值 ⇒ 键——标签经 `t()` 取值；枚举外 ⇒ 原值兜底）。 */
export const STATUS_KEYS = Object.freeze({
  [V.discuss]: "me.ledger.status.discuss",
  [V.design]: "me.ledger.status.design",
  [V.inflight]: "me.ledger.status.inflight",
  [V.closeout]: "me.ledger.status.closeout",
  [V.closed]: "me.ledger.status.closed",
  [V.withdrawn]: "me.ledger.status.withdrawn",
})

/** 六态允许迁移表（值域——逐字对齐 `thincoder-server/src/ledger/items.mjs` `ALLOWED_MIGRATIONS`；单测档机检两处相等）。 */
export const ALLOWED_MIGRATIONS = Object.freeze({
  [V.discuss]: Object.freeze([V.design, V.withdrawn]),
  [V.design]: Object.freeze([V.inflight, V.withdrawn]),
  [V.inflight]: Object.freeze([V.closeout, V.withdrawn]),
  [V.closeout]: Object.freeze([V.closed, V.withdrawn]),
  [V.closed]: Object.freeze([V.withdrawn]),
  [V.withdrawn]: Object.freeze([]),
})

/** 归档态（终态——编辑段状态选单仅当前值；再动由服务端 400 同判——`ledger/LEDGER.md` §4）。 */
const ARCHIVED = Object.freeze([V.closed, V.withdrawn])

/** 状态文案（纯函数——枚举外原值兜底；单测直测）。 */
export function statusLabel(status) {
  const key = STATUS_KEYS[status]
  return key === undefined ? String(status ?? "—") : t(key)
}

/** 编辑态状态选单选项（= 当前值 ∪ 迁移表合法后继；归档态 = 终态门先行 ⇒ 仅当前值——非法迁移服务端 400 同判）。 */
export function nextStatusOptions(status) {
  const successors = ARCHIVED.includes(status) ? [] : ALLOWED_MIGRATIONS[status] ?? []
  return [status, ...successors]
}

/** 仓显示名（`repos[]` 回填；缺 / 空（项目已删——KD-SV-147）⇒ 归地址）。 */
export function repoNameOf(repo, repos) {
  const hit = (repos ?? []).find((row) => row.address === repo)
  const name = hit?.displayName
  return name === null || name === undefined || name === "" ? String(repo ?? "—") : String(name)
}

// ── 页：我的·团队台账（`#/me/ledger`——全体；行集由服务端能力矩阵过滤） ────────────

export async function renderMeLedger(ctx, mount) {
  const { h } = ctx
  let repos = [] // 可见项目 + canWrite 读数（列表响应单源——筛选选单 ∥ 仓列回填 ∥ 新建选单三处共用）
  const repoFilter = h("select", { title: t("me.ledger.filterRepo") })
  const statusFilter = h("select", { title: t("me.ledger.filterStatus") },
    h("option", { value: "", text: t("me.ledger.filterStatusAll") }),
    ...STATUS_VALUES.map((status) => h("option", { value: status, text: statusLabel(status) })))
  const ownerFilter = h("input", { placeholder: t("me.ledger.filterOwnerPh"), title: t("me.ledger.filterOwner") })
  const clearBtn = h("button", { type: "button", class: "tiny", text: t("me.ledger.filterClear") })
  const createBtn = h("button", { type: "button", disabled: true, text: t("me.ledger.create") }) // 首个响应前禁用（可写项目未知——硬点 ⇒ 空选单空仓上送）
  const createHint = h("span", { class: "hint", text: t("me.ledger.noWritable"), hidden: true }) // 无可写项目 ⇒ 钮禁用 + 括注
  const box = h("div", { class: "table-slot" }, h("p", { class: "hint", text: t("common.loading") }))

  /** 仓筛选项随 `repos[]` 刷新（现选中值仍在册 ⇒ 保留；不在 ⇒ 复位「全部仓」）。 */
  const syncRepoFilter = () => {
    const current = repoFilter.value
    repoFilter.replaceChildren(
      h("option", { value: "", text: t("me.ledger.filterRepoAll") }),
      ...repos.map((row) => h("option", { value: row.address, text: row.displayName ?? row.address })))
    repoFilter.value = repos.some((row) => row.address === current) ? current : ""
  }

  /** 取数 + 渲染（成 ⇒ 表/空态两形；败 ⇒ 页内人话——`ctx.fail` 同拍）。 */
  const load = async () => {
    box.replaceChildren(h("p", { class: "hint", text: t("common.loading") }))
    try {
      const params = new URLSearchParams()
      if (repoFilter.value !== "") params.set("repo", repoFilter.value)
      if (statusFilter.value !== "") params.set("status", statusFilter.value)
      if (ownerFilter.value.trim() !== "") params.set("owner", ownerFilter.value.trim())
      const query = params.toString()
      const data = await ctx.api(query === "" ? "/api/ledger" : `/api/ledger?${query}`)
      repos = data.repos ?? []
      syncRepoFilter()
      createBtn.disabled = repos.filter((row) => row.canWrite === true).length === 0
      createHint.hidden = !createBtn.disabled
      const items = data.items ?? []
      box.replaceChildren(items.length === 0
        ? h("div", {},
            h("p", { class: "hint", text: t(query === "" ? "me.ledger.empty" : "me.ledger.emptyFiltered") }),
            h("p", { class: "hint", text: t(query === "" ? "me.ledger.emptyHint" : "me.ledger.emptyFilteredHint") }))
        : ledgerTable(ctx, { items, repos, open: (item) => openLedgerDetail(ctx, { item, repos, reload: load }), reload: load }))
    } catch (error) {
      ctx.fail(error)
      box.replaceChildren(h("p", { class: "hint error", text: t("me.ledger.loadFailed") }))
    }
  }

  repoFilter.addEventListener("change", () => { load() })
  statusFilter.addEventListener("change", () => { load() })
  ownerFilter.addEventListener("change", () => { load() })
  clearBtn.addEventListener("click", () => { repoFilter.value = ""; statusFilter.value = ""; ownerFilter.value = ""; load() }) // 「清除」= 复位三筛
  createBtn.addEventListener("click", () => openCreateLedger(ctx, { repos, reload: load }))
  const filterForm = h("form", { class: "row-form", onsubmit: (event) => { event.preventDefault(); load() } },
    h("label", {}, t("me.ledger.filterRepo"), repoFilter),
    h("label", {}, t("me.ledger.filterStatus"), statusFilter),
    h("label", {}, t("me.ledger.filterOwner"), ownerFilter),
    clearBtn)
  mount.append(
    h("h2", { text: t("me.ledger.title") }),
    h("div", { class: "row-form" }, createBtn, createHint),
    h("section", { class: "card" }, filterForm, box))
  await load()
}

/** 台账表（七列——编号 ∥ 仓 ∥ 标题 ∥ 状态+老化标 ∥ 负责人 ∥ 更新 ∥ 操作；行点击/键盘 ⇒ `open`）。 */
function ledgerTable(ctx, { items, repos, open, reload }) {
  const { h } = ctx
  const headers = [
    t("me.ledger.col.id"), t("me.ledger.col.repo"), t("me.ledger.col.title"), t("me.ledger.col.status"),
    t("me.ledger.col.owner"), t("me.ledger.col.updated"), t("me.ledger.col.actions"),
  ]
  const rows = items.map((item) => {
    const tr = h("tr", { class: "row-clickable", tabindex: "0" },
      h("td", { text: `#${item.id}` }),
      h("td", { text: repoNameOf(item.repo, repos) }),
      h("td", { text: item.title }),
      h("td", {}, h("span", { text: statusLabel(item.status) }),
        item.aged === true ? h("span", { class: "badge warn", text: t("me.ledger.aged") }) : null),
      h("td", { text: item.owner ?? "—" }),
      h("td", { text: ctx.fmtTs(item.updatedAt ?? item.createdAt) }),
      h("td", {}, ...actionNodes(ctx, item, reload)))
    const show = () => open(item)
    tr.addEventListener("click", show)
    tr.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show() } })
    return tr
  })
  return h("div", { class: "table-wrap" },
    h("table", {},
      h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))),
      h("tbody", {}, ...rows)))
}

/** 行内动作节点（仅 `canWrite` 渲）：「收口」（400 人话行内就地呈——核销只自 待核销）∥「撤回」（非原生 confirm）；其余 ⇒ 「—」。 */
function actionNodes(ctx, item, reload) {
  const { h } = ctx
  if (item.canWrite !== true) return [h("span", { text: "—" })]
  const note = h("p", { class: "cell-hint hint error", hidden: true })
  const close = h("button", { type: "button", class: "tiny", text: t("me.ledger.close") })
  close.addEventListener("click", async (event) => {
    event.stopPropagation() // 行点击（详情）让位
    note.hidden = true
    close.disabled = true
    try {
      await ctx.api(`/api/ledger/${item.id}/close`, { method: "POST", body: { status: V.closed } })
      ctx.flash(t("me.ledger.closed"))
      await reload()
    } catch (error) {
      close.disabled = false
      showNote(note, mapError(error))
      note.classList.add("cell-hint") // `showNote` 重写类名 ⇒ 补回表内折行面（`.cell-hint`：`th,td` 全局 `nowrap`）
    }
  })
  const withdraw = h("button", { type: "button", class: "tiny danger", text: t("me.ledger.withdraw") })
  withdraw.addEventListener("click", (event) => {
    event.stopPropagation()
    const { modal, note: confirmNote, confirmBtn } = confirmModal(ctx, { // 非原生 confirm（平台 `<dialog>`）+ 后果句
      title: "me.ledger.withdrawTitle",
      bodyText: "me.ledger.withdrawConfirm",
      confirmText: t("me.ledger.withdrawSubmit"),
      submit: () => submitThen(ctx, {
        note: confirmNote, button: confirmBtn, modal,
        call: () => ctx.api(`/api/ledger/${item.id}/close`, { method: "POST", body: { status: V.withdrawn } }),
        flash: t("me.ledger.withdrawn"),
        reload,
      }),
    })
  })
  return [close, withdraw, note]
}

// ── 共用件：详情/编辑弹窗（详情段恒显 ∥ 编辑段仅 `canWrite`；保存 = `submitThen` 先例） ──────

/** 详情/编辑弹窗（行点击入口；`reload` = 宿主列表刷新口——保存成功后收口；缺省空函数（`submitThen` 无条件调）。 */
export function openLedgerDetail(ctx, { item, repos = [], reload = () => {} }) {
  const { h } = ctx
  const note = h("p", { class: "hint error", hidden: true }) // 窗内状态行（保存失败就地人话）
  const bodyBox = h("div", { class: "stack-box" })
  const footer = h("div", { class: "row-form" })
  const modal = openModal({ title: t("me.ledger.detailTitle"), body: bodyBox, footer })
  bodyBox.append(h("dl", { class: "detail-grid" },
    h("dt", { text: t("me.ledger.col.id") }), h("dd", { text: `#${item.id}` }),
    h("dt", { text: t("me.ledger.col.repo") }), h("dd", {}, h("code", { text: repoNameOf(item.repo, repos) })),
    h("dt", { text: t("me.ledger.col.status") }),
    h("dd", {}, h("span", { text: statusLabel(item.status) }),
      item.aged === true ? h("span", { class: "badge warn", text: t("me.ledger.aged") }) : null),
    h("dt", { text: t("me.ledger.col.owner") }), h("dd", { text: item.owner ?? "—" }),
    h("dt", { text: t("me.ledger.detail.createdBy") }), h("dd", { text: item.createdBy ?? "—" }),
    h("dt", { text: t("me.ledger.detail.created") }), h("dd", { text: ctx.fmtTs(item.createdAt) }),
    h("dt", { text: t("me.ledger.detail.updated") }), h("dd", { text: ctx.fmtTs(item.updatedAt ?? item.createdAt) }),
    h("dt", { text: t("me.ledger.detail.body") }), h("dd", { text: item.detail ?? "—" })),
  note)
  let save = null
  if (item.canWrite === true) { // 编辑段（服务端同判——页面不是判据）
    const repoSelect = h("select", { disabled: true }, h("option", { value: item.repo, text: repoNameOf(item.repo, repos) })) // 仓不可改
    const titleInput = h("input", { value: item.title })
    const bodyArea = h("textarea", { value: item.detail ?? "" })
    const ownerInput = h("input", { value: item.owner ?? "" })
    const statusSelect = h("select", {}, ...nextStatusOptions(item.status).map((status) => h("option", { value: status, text: statusLabel(status) })))
    statusSelect.value = item.status
    save = h("button", { type: "button", text: t("me.ledger.save") })
    save.addEventListener("click", () => submitThen(ctx, {
      note, button: save, modal,
      call: () => ctx.api(`/api/ledger/${item.id}`, { method: "PATCH", body: {
        title: titleInput.value.trim(), detail: bodyArea.value, owner: ownerInput.value.trim(), status: statusSelect.value,
      } }),
      flash: t("me.ledger.saved"),
      reload,
    }))
    bodyBox.append(h("h4", { text: t("me.ledger.editTitle") }),
      h("div", { class: "provider-form stacked" },
        field(h, "me.ledger.edit.repoLabel", repoSelect),
        field(h, "me.ledger.edit.titleLabel", titleInput),
        field(h, "me.ledger.edit.bodyLabel", bodyArea),
        field(h, "me.ledger.edit.ownerLabel", ownerInput),
        field(h, "me.ledger.edit.statusLabel", statusSelect)))
  }
  footer.append(...(save === null ? [] : [save]), h("button", { type: "button", class: "tiny", text: t("common.close"), onclick: () => modal.close() }))
  return modal
}

// ── 共用件：新建弹窗（仓选单 = 可写项目；负责人缺省 = 自己——服务端缺省同口径） ────────────

/** 新建弹窗（页头「新建」入口；`repos` = 列表响应读数——选单过滤 `canWrite`；`reload` 缺省空函数（同详情件）。 */
export function openCreateLedger(ctx, { repos = [], reload = () => {} }) {
  const { h } = ctx
  const writable = (repos ?? []).filter((row) => row.canWrite === true)
  const repoSelect = h("select", {}, ...writable.map((row) => h("option", { value: row.address, text: row.displayName ?? row.address })))
  const titleInput = h("input", { placeholder: t("me.ledger.create.titlePh") })
  const bodyArea = h("textarea", {})
  const ownerInput = h("input", { placeholder: t("me.ledger.create.ownerPh") })
  const note = h("p", { class: "hint error", hidden: true })
  const submit = h("button", { type: "button", text: t("me.ledger.create.submit") })
  const modal = openModal({
    title: t("me.ledger.createTitle"),
    body: h("div", { class: "provider-form stacked" },
      field(h, "me.ledger.create.repoLabel", repoSelect),
      field(h, "me.ledger.create.titleLabel", titleInput),
      field(h, "me.ledger.create.bodyLabel", bodyArea),
      field(h, "me.ledger.create.ownerLabel", ownerInput),
      note),
    footer: h("div", { class: "row-form" }, submit, h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() })),
  })
  submit.addEventListener("click", () => {
    if (titleInput.value.trim() === "") { showNote(note, t("me.ledger.titleRequired")); return }
    return submitThen(ctx, {
      note, button: submit, modal,
      call: () => ctx.api("/api/ledger", { method: "POST", body: {
        repo: repoSelect.value, title: titleInput.value.trim(), detail: bodyArea.value,
        owner: ownerInput.value.trim() || null, // 留空 ⇒ null（服务端缺省 = 创建者）
      } }),
      flash: t("me.ledger.created"),
      reload,
    })
  })
  titleInput.focus()
  return modal
}
