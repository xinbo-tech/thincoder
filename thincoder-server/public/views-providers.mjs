/**
 * views-providers.mjs — 管理·Provider 页（webui/WEBUI.md §2/§2.4④——功能点 18 ∥ KD-SV-33）：`#/admin/providers`——仅 admin；
 * 页首 = 标题「Provider」+「添加」钮；列表（名称 ∥ baseURL ∥ 密钥（掩码 ∥ 未配置）∥ 服务模型数）；行点击
 * （Enter/Space 同开——沿成员页口径）⇒ 详情弹窗；**零内联添加/编辑面**（旧表单撤除——判据 = §6 AC-18 行）。
 * 双弹窗（添加 ∥ 详情）= 同域拆档 `views-providers-modals.mjs`（叠加破 300 软线——§5 拆分两档）。
 *
 * 契约 = gateway/API.md §2.2（**零新端点**）：列表 = `GET /api/admin/providers`；写路径全在弹窗侧；判权全在后端
 * （admin 面——服务端 403 为准）；渲染一律节点 + textContent；文案经 `t()` 取值（§2.2）。
 */
import { t } from "./i18n.mjs"
import { openAddProviderModal, openProviderDetailModal } from "./views-providers-modals.mjs"

export async function renderProviders(ctx, mount) {
  const { h } = ctx
  let providers = [] // 最近一次列表（添加弹窗——已配名剔除用）

  const listBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))
  const openAdd = () => openAddProviderModal(ctx, { providers, reload: loadList })
  mount.append(h("div", { class: "toolbar" },
    h("h2", { text: t("admin.providers.title") }),
    h("button", { type: "button", text: t("admin.providers.add"), onclick: openAdd })))
  mount.append(h("section", { class: "card" }, listBox))

  async function loadList() {
    try {
      const data = await ctx.api("/api/admin/providers")
      providers = data.providers
      listBox.replaceChildren(...(data.providers.length === 0
        ? [h("p", { class: "hint", text: t("admin.providers.listEmpty") })]
        : [table(ctx, data.providers, (row) => openProviderDetailModal(ctx, { provider: row, reload: loadList }))]))
    } catch (error) {
      ctx.fail(error)
      listBox.replaceChildren(h("p", { class: "hint error", text: t("admin.providers.listFailed") }))
    }
  }
  await loadList()
}

/** 列表（列 = 名称 ∥ baseURL ∥ 密钥（掩码 ∥ 未配置）∥ 服务模型数）：行点击（Enter/Space 同开——键盘可达）⇒ 详情弹窗。 */
function table(ctx, providers, open) {
  const { h } = ctx
  const headers = [t("admin.providers.name"), t("admin.providers.baseURL"), t("admin.providers.colKey"), t("admin.providers.colModelCount")]
  const body = providers.map((row) => {
    const tr = h("tr", { class: "row-clickable", tabindex: "0" },
      h("td", { text: row.name }),
      h("td", { text: row.baseURL }),
      h("td", { text: row.apiKey || t("admin.providers.maskEmpty") }),
      h("td", { text: String((row.models ?? []).length) }))
    const show = () => open(row)
    tr.addEventListener("click", show)
    tr.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show() } })
    return tr
  })
  return h("div", { class: "table-wrap" },
    h("table", {}, h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))), h("tbody", {}, ...body)))
}
