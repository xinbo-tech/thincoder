/**
 * views-sandbox-images.mjs — 沙盒页·镜像区件（webui/WEBUI.md §2.8①；sandbox-docker-admin 批——自 `views-sandbox.mjs` 外拆）：
 * 镜像表（名（多标签逐行 ∥ 无标签 ⇒「无标签」）∥ 大小 ∥ 创建 ∥ 操作：删除）+ 拉取镜像钮
 * ∥ 拉取窗（单输入 `名[:标签]`；在飞态 + 钮禁用）∥ 删除确认窗（强制删除勾选——缺省不勾）。
 * 契约 = gateway/API.md §2.5；文案经 `t()`（§2.2）；渲染一律节点 + textContent（零拼串）。批内件直测面 = `createImageSection`。
 */
import { mapError, t } from "./i18n.mjs"
import { field, openModal, showNote, submitThen } from "./modal.mjs"
import { formatBytes } from "./views-sandbox-containers.mjs"

/** 镜像区段（缓存自持——同展开懒加载；动作后 `reset` + 页重取）。 */
export function createImageSection(ctx) {
  const { h } = ctx
  const cache = new Map() // 节点 id ⇒ { images } ∥ { error }

  /** 区渲染（展开行内）。`reload` = 页数据重取 ∥ `refresh` = 立即重渲（页守卫展开态）。 */
  function area(runner, { reload, refresh }) {
    const box = h("div", { class: "stack-box" }, h("h4", { text: t("admin.sandbox.imagesTitle") }))
    const cached = cache.get(runner.id)
    if (cached === undefined || cached.loading === true) {
      if (cached === undefined) {
        cache.set(runner.id, { loading: true }) // 占位（两区并发重渲不重取）
        ctx.api(`/api/admin/sandbox/runners/${runner.id}/images`).then((data) => {
          cache.set(runner.id, { images: data?.images ?? [] })
          refresh()
        }).catch((error) => {
          cache.set(runner.id, { error: mapError(error) })
          refresh()
        })
      }
      box.append(h("p", { class: "hint", text: t("common.loading") }))
      return box
    }
    const invalidate = () => { cache.delete(runner.id); reload() } // 失缓存重取 = 界面上新
    box.append(h("div", { class: "info-actions" },
      h("button", { type: "button", class: "tiny", text: t("admin.sandbox.imagePull"), onclick: () => openPullImageModal(ctx, { runner, reload: invalidate }) })))
    if (cached.error !== undefined) {
      box.append(h("p", { class: "hint error", text: cached.error }))
      return box
    }
    if (cached.images.length === 0) {
      box.append(h("p", { class: "hint", text: t("admin.sandbox.imagesEmpty") }))
      return box
    }
    const headers = [t("admin.sandbox.image"), t("admin.sandbox.colSize"), t("admin.sandbox.colCreated"), t("admin.sandbox.colActions")]
    const rows = cached.images.map((image) => {
      const tags = Array.isArray(image.tags) ? image.tags : []
      const ref = tags[0] ?? image.id // 删除引用 = 首标签（无标签 ⇒ 镜像 id）
      return h("tr", {},
        h("td", {}, ...(tags.length === 0 ? [h("div", { text: t("admin.sandbox.imageUntagged") })] : tags.map((tag) => h("div", { text: tag })))),
        h("td", { text: formatBytes(image.size) }),
        h("td", { text: image.created ? ctx.fmtTs(image.created * 1000) : "—" }), // 引擎 `Created` = 秒
        h("td", {}, h("button", { type: "button", class: "tiny", text: t("admin.sandbox.remove"), onclick: () => openDeleteImageModal(ctx, { runner, ref, reload: invalidate }) })))
    })
    box.append(h("div", { class: "table-wrap" },
      h("table", {}, h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))), h("tbody", {}, ...rows))))
    return box
  }

  /** 失缓存（动作后重取）。 */
  function reset(runner) {
    cache.delete(runner.id)
  }

  return { area, reset }
}

/** 拉取镜像弹窗（单输入 `名[:标签]`；在飞态 =「拉取中……（可能持续数分钟）」+ 钮禁用）。 */
function openPullImageModal(ctx, { runner, reload }) {
  const { h } = ctx
  const input = h("input", { placeholder: t("admin.sandbox.imageRefPh") })
  const note = h("p", { class: "hint error", hidden: true })
  const submitBtn = h("button", { type: "submit", text: t("admin.sandbox.imagePull") })
  const modal = openModal({
    title: t("admin.sandbox.imagePull"),
    body: h("form", { class: "provider-form stacked", novalidate: true, onsubmit: submit },
      field(h, "admin.sandbox.imageRef", input), note, submitBtn),
  })

  async function submit(event) {
    event.preventDefault()
    note.hidden = true
    const image = input.value.trim()
    if (image === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.imageRef") }))
    submitBtn.disabled = true
    showNote(note, t("admin.sandbox.imagePulling"), false) // 在飞态（同步请求——可能持续数分钟）
    try {
      const data = await ctx.api(`/api/admin/sandbox/runners/${runner.id}/images/pull`, { method: "POST", body: { image } })
      ctx.flash(t("admin.sandbox.imagePulled", { ref: `${data?.image ?? image}:${data?.tag ?? ""}` }))
      modal.close()
      await reload()
    } catch (error) {
      submitBtn.disabled = false
      showNote(note, mapError(error)) // 400 携引擎原文（两形皆收）；窗内就地人话
    }
  }
}

/** 删除镜像确认窗（强制删除勾选——缺省不勾；409 ⇒ 窗内人话 + 处置句，勾上再试）。 */
function openDeleteImageModal(ctx, { runner, ref, reload }) {
  const { h } = ctx
  const forceBox = h("input", { type: "checkbox" }) // 缺省不勾（误删爆炸半径最小——KD-SV-95）
  const note = h("p", { class: "hint error", hidden: true })
  const confirmBtn = h("button", { type: "button", class: "danger", text: t("admin.sandbox.remove") })
  const modal = openModal({
    title: t("admin.sandbox.imageDeleteTitle"),
    body: h("div", {},
      h("p", { class: "hint", text: t("admin.sandbox.imageDeleteConfirm", { ref }) }),
      h("label", { class: "key-clear" }, forceBox, t("admin.sandbox.imageForce")),
      note),
    footer: h("div", { class: "row-form" }, confirmBtn, h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() })),
  })
  confirmBtn.addEventListener("click", () => submitThen(ctx, {
    note, button: confirmBtn, modal, reload,
    call: () => ctx.api(`/api/admin/sandbox/runners/${runner.id}/images`, { method: "DELETE", body: { ref, force: forceBox.checked === true } }),
    flash: t("admin.sandbox.imageDeleted", { ref }),
  }))
}
