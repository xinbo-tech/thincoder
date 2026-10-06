/**
 * views-providers.mjs — Provider 与模型页（webui/WEBUI.md §2：`#/admin/providers`——仅 admin）：
 * 列表 ∥ 增/改/删 ∥ 测试连通 ∥ 发现/勾选开放 ∥ 预设快速添加；契约 = gateway/API.md §2.2。
 *
 * 密钥面 = 服务端掩码回显（明文永不回显）：编辑表单留空 = 不修改；勾「清除密钥」⇒ 提交 `apiKey:""`。
 * 发现/测试 = `POST /api/admin/providers/discover`（测试同径——`providerId` 取库内 key；§2.2 无独立连通端点）；
 * 预设快速添加 = `GET /api/admin/providers/presets` 拉表 ⇒ 预填 ⇒ 补 `apiKey` ⇒ POST 全字段（校验不豁免）。
 * 写请求一律 JSON 头 + JSON 体（服务端型门）；渲染一律节点 + textContent；文案经 `t()` 取值（§2.2）。
 */
import { t } from "./i18n.mjs"

/** 开放清单合并（发现结果 ∪ 既有清单——存量保留防误删；顺序 = 既有无损在前）。 */
function unionModels(existing, found) {
  return [...new Set([...existing, ...found])]
}

export async function renderProviders(ctx, mount) {
  const { h } = ctx
  mount.append(h("h2", { text: t("admin.providers.title") }))

  // ── 表单状态与控件（新增 ∥ 编辑同形）───────────────────────────────────────
  let editingId = null
  let openModels = [] // 开放清单（勾选集——保存时提交）
  let discovered = [] // 最近一次发现结果（并列入列用）

  const nameInput = h("input", { required: true, placeholder: t("admin.providers.namePh") })
  const baseURLInput = h("input", { required: true, placeholder: t("admin.providers.baseURLPh") })
  const apiKeyInput = h("input", { placeholder: t("admin.providers.apiKeyPh"), autocomplete: "off" })
  const clearKey = h("input", { type: "checkbox" })
  const clearKeyLabel = h("label", { class: "key-clear", hidden: true }, clearKey, t("admin.providers.clearKey"))
  const modelInput = h("input", { placeholder: t("admin.providers.modelPh") })
  const checklist = h("div", { class: "model-picks" })
  const formTitle = h("h3", { text: t("admin.providers.formNew") })
  const submitBtn = h("button", { type: "submit", text: t("admin.providers.save") })
  const cancelBtn = h("button", { type: "button", class: "tiny", hidden: true, text: t("admin.providers.cancel") })
  const discoverBtn = h("button", { type: "button", class: "tiny", text: t("admin.providers.discover") })
  const listBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))

  /** 勾选清单渲染：并集入列（勾选 = openModels 成员；变化即写回 openModels）。 */
  const renderChecklist = () => {
    const models = unionModels(openModels, discovered)
    checklist.replaceChildren(...(models.length === 0
      ? [h("span", { class: "hint", text: t("admin.providers.checklistEmpty") })]
      : models.map((model) => {
        const box = h("input", { type: "checkbox", checked: openModels.includes(model) })
        box.addEventListener("change", () => {
          openModels = box.checked ? [...new Set([...openModels, model])] : openModels.filter((item) => item !== model)
        })
        return h("label", {}, box, model)
      })))
  }

  const addModel = h("button", { type: "button", class: "tiny", text: t("admin.providers.addModel") })
  addModel.addEventListener("click", () => {
    const value = modelInput.value.trim()
    if (!value) return
    openModels = unionModels(openModels, [value])
    modelInput.value = ""
    renderChecklist()
  })

  // ── 预设快速添加（数据源 = 预设列表端点——拉表 ⇒ 预填）─────────────────────
  const presetSelect = h("select", {}, h("option", { value: "", text: t("admin.providers.presetPick") }))
  const presetLoad = h("button", { type: "button", class: "tiny", text: t("admin.providers.presetLoad") })
  let presets = []
  const loadPresets = async () => {
    try {
      const data = await ctx.api("/api/admin/providers/presets")
      presets = data.presets
      presetSelect.replaceChildren(
        h("option", { value: "", text: t("admin.providers.presetSelectCount", { count: presets.length }) }),
        ...presets.map((preset) => h("option", { value: preset.preset, text: t("admin.providers.presetOption", { name: preset.name, preset: preset.preset }) })))
    } catch {
      presetSelect.replaceChildren(h("option", { value: "", text: t("admin.providers.presetFailed") })) // 降级：手填照常
    }
  }
  presetLoad.addEventListener("click", () => {
    const preset = presets.find((item) => item.preset === presetSelect.value)
    if (!preset) { ctx.flash(t("admin.providers.presetNeeded")); return }
    resetForm()
    nameInput.value = preset.name
    baseURLInput.value = preset.baseURL
    openModels = unionModels([], preset.models)
    renderChecklist()
    apiKeyInput.focus()
    ctx.flash(t("admin.providers.presetLoaded", { name: preset.name }))
  })

  // ── 列表（掩码回显 ∥ 行内：测试 ∥ 编辑 ∥ 删除）─────────────────────────────
  const testProvider = async (row) => {
    ctx.flash(t("admin.providers.testing", { name: row.name }))
    try {
      // 测试同径 = 发现（providerId 取库内 key——无独立连通端点，§2.2）
      const done = await ctx.api("/api/admin/providers/discover", { method: "POST", body: { baseURL: row.baseURL, providerId: row.id } })
      ctx.flash(t("admin.providers.testOk", { name: row.name, count: done.models.length }))
    } catch (error) { ctx.fail(error) }
  }
  const startEdit = (row) => {
    editingId = row.id
    formTitle.textContent = t("admin.providers.formEdit", { name: row.name })
    submitBtn.textContent = t("admin.providers.saveEdit")
    cancelBtn.hidden = false
    clearKeyLabel.hidden = false
    clearKey.checked = false
    nameInput.value = row.name
    baseURLInput.value = row.baseURL
    apiKeyInput.value = ""
    apiKeyInput.placeholder = row.apiKey ? t("admin.providers.keepKey", { mask: row.apiKey }) : t("admin.providers.keepKeyNone")
    openModels = [...row.models]
    discovered = []
    renderChecklist()
    nameInput.focus()
  }
  const removeProvider = async (row) => {
    if (!window.confirm(t("admin.providers.deleteConfirm", { name: row.name }))) return
    try {
      await ctx.api(`/api/admin/providers/${row.id}`, { method: "DELETE" })
      ctx.flash(t("admin.providers.deleted", { name: row.name }))
      if (editingId === row.id) resetForm()
      await loadList()
    } catch (error) { ctx.fail(error) }
  }
  const loadList = async () => {
    try {
      const data = await ctx.api("/api/admin/providers")
      listBox.replaceChildren(...(data.providers.length === 0
        ? [h("p", { class: "hint", text: t("admin.providers.listEmpty") })]
        : [ctx.table([t("admin.providers.name"), t("admin.providers.baseURL"), t("admin.providers.colKey"), t("admin.providers.colModels"), t("col.actions")], data.providers.map((row) => [
            row.name, row.baseURL, row.apiKey || t("admin.providers.maskEmpty"), row.models.join(", ") || t("admin.providers.modelsEmpty"),
            [
              h("button", { class: "tiny", text: t("admin.providers.test"), onclick: () => testProvider(row) }),
              h("button", { class: "tiny", text: t("admin.providers.edit"), onclick: () => startEdit(row) }),
              h("button", { class: "tiny danger", text: t("admin.providers.delete"), onclick: () => removeProvider(row) }),
            ],
          ]))]))
    } catch (error) {
      ctx.fail(error)
      listBox.replaceChildren(h("p", { class: "hint", text: t("admin.providers.listFailed") }))
    }
  }

  // ── 表单（新增 ∥ 编辑）∥ 发现 ──────────────────────────────────────────────
  const resetForm = () => {
    editingId = null
    formTitle.textContent = t("admin.providers.formNew")
    submitBtn.textContent = t("admin.providers.save")
    cancelBtn.hidden = true
    clearKeyLabel.hidden = true
    clearKey.checked = false
    apiKeyInput.placeholder = t("admin.providers.apiKeyPh")
    form.reset()
    openModels = []
    discovered = []
    renderChecklist()
  }
  const form = h("form", { class: "card" },
    formTitle,
    h("div", { class: "provider-form" },
      h("label", {}, t("admin.providers.name"), nameInput),
      h("label", {}, t("admin.providers.baseURL"), baseURLInput),
      h("label", {}, t("admin.providers.apiKey"), apiKeyInput),
      clearKeyLabel),
    h("div", { class: "provider-form" },
      h("label", {}, t("admin.providers.modelLabel"), h("span", { class: "row-form" }, modelInput, addModel)),
      discoverBtn),
    h("div", { class: "stack-models" },
      h("span", { class: "hint", text: t("admin.providers.openList") }), checklist),
    h("div", { class: "row-form" }, submitBtn, cancelBtn),
  )
  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    const body = { name: nameInput.value.trim(), baseURL: baseURLInput.value.trim(), models: [...openModels] }
    try {
      if (editingId === null) {
        body.apiKey = apiKeyInput.value.trim() // 新增：空 ⇒ ""（可空——不发 Authorization 头）
        await ctx.api("/api/admin/providers", { method: "POST", body })
        ctx.flash(t("admin.providers.saved"))
      } else {
        // PATCH：字段缺省 = 不动；`apiKey:""` = 清除；非空 = 改新值（留空 = 保留原密钥）
        if (clearKey.checked) body.apiKey = ""
        else if (apiKeyInput.value.trim()) body.apiKey = apiKeyInput.value.trim()
        await ctx.api(`/api/admin/providers/${editingId}`, { method: "PATCH", body })
        ctx.flash(t("admin.providers.saved"))
      }
      resetForm()
      await loadList()
    } catch (error) { ctx.fail(error) }
  })
  cancelBtn.addEventListener("click", () => resetForm())
  discoverBtn.addEventListener("click", async () => {
    const baseURL = baseURLInput.value.trim()
    if (!baseURL) { ctx.flash(t("admin.providers.needBaseURL")); return }
    const body = { baseURL }
    const typed = apiKeyInput.value.trim()
    if (typed) body.apiKey = typed // 明传（可含 env: 引用——服务端解析）
    else if (editingId !== null) body.providerId = editingId // 库内 key（编辑态留空）
    try {
      const done = await ctx.api("/api/admin/providers/discover", { method: "POST", body })
      discovered = done.models
      renderChecklist()
      ctx.flash(t("admin.providers.discovered", { count: done.models.length }))
    } catch (error) { ctx.fail(error) } // 失败 ⇒ 手填降级照常（发现非保存前置门）
  })

  // ── 装配 ───────────────────────────────────────────────────────────────────
  mount.append(h("section", { class: "card" },
    h("h3", { text: t("admin.providers.presetTitle") }),
    h("div", { class: "row-form" }, presetSelect, presetLoad,
      h("span", { class: "hint", text: t("admin.providers.presetHint") }))))
  mount.append(form)
  mount.append(h("section", { class: "card" }, h("h3", { text: t("admin.providers.listTitle") }), listBox))
  renderChecklist()
  await Promise.all([loadList(), loadPresets()])
}
