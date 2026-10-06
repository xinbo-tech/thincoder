/**
 * views-models.mjs — 管理·服务模型页（webui/WEBUI.md §2/§2.4③——KD-SV-32：`#/admin/models`——仅 admin）：
 * 列表 = `/v1/models` 同源（`GET /api/admin/providers` 的 `models` 展平为 `provider/model` 前缀形 + 嵌入引擎
 * 模型 `state.system.embedding.model`）∥ 行点击 ⇒ 详情弹窗（复用 `modal.mjs`）；配置区 = 骨架（候选已上抛；
 * 未裁前零可编辑字段——需求 §2:17）。
 *
 * 零新端点（目录来源 = provider 配置派生——需求边界）；控制台无团队 key（不直连 `/v1/models`）；判权全在后端
 * （admin 面——服务端 403 为准）；渲染一律节点 + textContent；文案经 `t()` 取值（§2.2）。
 */
import { t } from "./i18n.mjs"
import { openModal } from "./modal.mjs"

/** 服务模型行集（与 `/v1/models` 同源——纯函数，批内件直测）：providers 展平 + 引擎模型（在场则列）。
 *  行形 = `{ id（前缀形 ∥ 引擎模型原样）, provider, upstream（首斜杠余段——引擎行无此段）, surface }`。 */
export function deriveModels(providers, embeddingModel) {
  const rows = []
  for (const provider of providers ?? []) {
    for (const model of provider.models ?? []) {
      const id = `${provider.name}/${model}`
      rows.push({ id, provider: provider.name, upstream: id.slice(id.indexOf("/") + 1), surface: "chat" })
    }
  }
  if (embeddingModel) rows.push({ id: embeddingModel, provider: "embedding", upstream: null, surface: "embeddings" })
  return rows
}

export async function renderModels(ctx, mount) {
  const { h } = ctx
  mount.append(h("h2", { text: t("admin.models.title") }))
  const listBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))
  mount.append(h("section", { class: "card" }, listBox))
  try {
    const data = await ctx.api("/api/admin/providers")
    const rows = deriveModels(data.providers, ctx.state.system?.embedding?.model ?? null)
    listBox.replaceChildren(rows.length === 0
      ? h("p", { class: "hint", text: t("admin.models.empty") })
      : modelsTable(ctx, rows))
  } catch (error) {
    ctx.fail(error)
    listBox.replaceChildren(h("p", { class: "hint", text: t("admin.models.loadFailed") }))
  }
}

/** 列表（列 = 模型 ∥ Provider ∥ 面）：行点击（Enter/Space 同开——键盘可达）⇒ 详情弹窗。 */
function modelsTable(ctx, rows) {
  const { h } = ctx
  const headers = [t("admin.models.colModel"), t("admin.models.colProvider"), t("admin.models.colSurface")]
  const body = rows.map((row) => {
    const tr = h("tr", { class: "row-clickable", tabindex: "0" },
      h("td", {}, h("code", { text: row.id })),
      h("td", { text: row.provider }),
      h("td", { text: row.surface }))
    const open = () => showModelDetail(ctx, row)
    tr.addEventListener("click", open)
    tr.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open() }
    })
    return tr
  })
  return h("div", { class: "table-wrap" },
    h("table", {}, h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))), h("tbody", {}, ...body)))
}

/** 详情弹窗（复用公共组件）：模型标识 ∥ Provider ∥ 上游模型名 ∥ 面——嵌入模型行注 + 配置骨架（零可编辑字段）。 */
function showModelDetail(ctx, row) {
  const { h } = ctx
  const body = h("div", {},
    h("dl", { class: "detail-grid" },
      h("dt", { text: t("admin.models.colModel") }), h("dd", {}, h("code", { text: row.id })),
      h("dt", { text: t("admin.models.colProvider") }), h("dd", { text: row.provider }),
      h("dt", { text: t("admin.models.upstream") }), h("dd", { text: ctx.fmtValue(row.upstream) }),
      h("dt", { text: t("admin.models.colSurface") }), h("dd", { text: row.surface })),
    row.surface === "embeddings" ? h("p", { class: "hint", text: t("admin.models.embedNote") }) : null,
    h("h4", { text: t("admin.models.configTitle") }),
    h("p", { class: "hint", text: t("admin.models.configSkeleton") }))
  openModal({ title: t("admin.models.detailTitle"), body })
}
