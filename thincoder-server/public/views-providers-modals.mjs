/**
 * views-providers-modals.mjs — Provider 双弹窗件（webui/WEBUI.md §2.4④——功能点 18 ∥ KD-SV-33；自
 * `views-providers.mjs` 拆出——双弹窗叠加破 300 软线）：添加弹窗（预设/自定义两径——预设表首开惰性拉取·
 * 已配名剔除）∥ 详情弹窗（信息段 + 候选勾选段——候选 = 上游发现；退役项只读注 + 恒保留；单脚区保存）；
 * 模型清单/候选勾选 = 表格形（§2.6⑤——单列「模型」：`label`（勾选 + 模型名）∥ `code` 行）。
 *
 * 端点零新（契约 = gateway/API.md §2.2）：`GET /api/admin/providers/presets`（拉表）∥ `POST /api/admin/providers/discover`
 * （探针——「测试连接」= 同径复用，`providerId` 取库内 key；失败 ⇒ 段内提示 + 重试；无手填兜底）∥ `POST` 全字段 ∥
 * `PATCH` 变更字段（`models` 全量数组——保存即热生效）∥ `DELETE`。弹窗 = 公共组件 `modal.mjs`（单例 ∥ 遮罩/关闭/焦点）；
 * 渲染一律节点 + textContent；文案经 `t()` 取值；错误经 `mapError` 映射（§2.2）。
 */
import { mapError, t } from "./i18n.mjs"
import { openModal } from "./modal.mjs"

/** 候选勾选清单（双弹窗复用——表格形：单列「模型」——§2.6⑤）：候选 = 上游发现集；`draft` = 勾选集（变化即写回）；
 *  发现失败 ⇒ 段内提示（重试 = 段内动作钮——调用方常驻持有）；空 ⇒ `emptyText`。
 *  「零手填」——候选面零文本输入（用户 2026-10-06 21:36 裁定）；行 = `label`（勾选 + 模型名——点题名同切换）。 */
function renderPicks(h, box, { candidates, draft, onToggle, emptyText, errorText }) {
  if (errorText !== null) {
    box.replaceChildren(h("p", { class: "hint error", text: errorText }))
    return
  }
  const models = candidates ?? []
  if (models.length === 0) {
    box.replaceChildren(h("span", { class: "hint", text: emptyText }))
    return
  }
  box.replaceChildren(h("div", { class: "table-wrap" },
    h("table", {},
      h("thead", {}, h("tr", {}, h("th", { text: t("admin.models.colModel") }))),
      h("tbody", {}, ...models.map((model) => {
        const pick = h("input", { type: "checkbox", checked: draft.has(model) })
        pick.addEventListener("change", () => onToggle(model, pick.checked))
        return h("tr", {}, h("td", {}, h("label", {}, pick, model)))
      })))))
}

/** 预设模型清单表（§2.6⑤——单列「模型」：行 = `code` 芯片）。 */
function presetModelsTable(h, models) {
  return h("div", { class: "table-wrap" },
    h("table", {},
      h("thead", {}, h("tr", {}, h("th", { text: t("admin.models.colModel") }))),
      h("tbody", {}, ...models.map((model) => h("tr", {}, h("td", {}, h("code", { text: model })))))))
}

/** 集合等价（序无关——PATCH `models` 判「变更」用：全量数组单写）。 */
function sameSet(a, b) {
  return a.length === b.length && a.every((item) => b.includes(item))
}

/** 添加弹窗（页首「添加」；取形 = VSC 面板 [+ Add] 形——步序语义 = 核件 `addProviderFlow`）：类型一选
 *  （预设 ∥ 自定义）——预设径 = 选预设 ⇒ 信息行（地址 ∥ 模型清单——只读）+ 补 apiKey（可空——`env:` 照收）⇒ 保存；
 *  自定义径 = 名 ∥ baseURL ∥ apiKey +「获取模型」探针 ⇒ 候选勾选；保存不设发现门（models 可空——沿 POST 语义）。
 *  预设拉取失败 ⇒ 提示 + 自定义径照常；写入 = POST 全字段（无 `preset` 字段——校验不豁免）；成功 ⇒ 关窗 + 列表刷新
 *  + flash；失败 ⇒ flash（弹窗留驻）；取消/×/ESC = 弃稿。 */
export function openAddProviderModal(ctx, { providers = [], reload = null } = {}) {
  const { h } = ctx
  const existing = new Set(providers.map((item) => item.name)) // 已配名剔除（服务端复核为准——重名 ⇒ 400）
  const bodyBox = h("div")
  const footBox = h("div", { class: "row-form" })
  const modal = openModal({ title: t("admin.providers.addTitle"), body: bodyBox, footer: footBox })

  let presets = [] // 预设表（首开惰性拉取——已配名剔除）
  let candidates = null // null = 未拉取 ∥ 数组 = 最近一次发现结果
  let errorText = null // 发现失败 ⇒ 段内提示（重试可达）
  const draft = new Set() // 勾选集（自定义径——保存提交）

  const typeSelect = h("select", {}, h("option", { value: "", text: t("admin.providers.presetPick") }))
  const nameInput = h("input", { placeholder: t("admin.providers.namePh") })
  const baseURLInput = h("input", { placeholder: t("admin.providers.baseURLPh") })
  const apiKeyInput = h("input", { placeholder: t("admin.providers.apiKeyPh"), autocomplete: "off" })
  const fetchBtn = h("button", { type: "button", class: "tiny", text: t("admin.providers.fetchModels") })
  const picksBox = h("div")

  const keyRow = () => h("div", { class: "provider-form" }, h("label", {}, t("admin.providers.apiKey"), apiKeyInput))
  const renderPicksArea = () => renderPicks(h, picksBox, {
    candidates, draft, errorText,
    onToggle: (model, checked) => { if (checked) draft.add(model); else draft.delete(model) },
    emptyText: t("admin.providers.candidatesEmpty", { action: t("admin.providers.fetchModels") }),
  })

  /** 体渲（类型一选——控件节点重挂，已填值随节点保留）：未选 ⇒ 仅类型行 ∥ 预设 ⇒ 信息行 + apiKey ∥
   *  自定义 ⇒ 名/baseURL + apiKey + 探针/勾选段。 */
  const renderBody = () => {
    const value = typeSelect.value
    const preset = presets.find((item) => item.preset === value) ?? null
    const typeRow = h("div", { class: "provider-form" }, typeSelect)
    if (value === "custom") {
      bodyBox.replaceChildren(
        typeRow,
        h("div", { class: "provider-form" },
          h("label", {}, t("admin.providers.name"), nameInput),
          h("label", {}, t("admin.providers.baseURL"), baseURLInput)),
        keyRow(),
        h("div", { class: "stack-models" },
          h("div", { class: "pick-head" }, h("span", { class: "hint", text: t("admin.providers.openList") }), fetchBtn),
          picksBox))
      return
    }
    if (preset === null) {
      bodyBox.replaceChildren(typeRow)
      return
    }
    bodyBox.replaceChildren(
      typeRow,
      h("dl", { class: "detail-grid" },
        h("dt", { text: t("admin.providers.baseURL") }), h("dd", {}, h("code", { text: preset.baseURL }) )),
      presetModelsTable(h, preset.models), // 模型清单 = 表格形（§2.6⑤——单列「模型」：`code` 行）
      keyRow())
  }
  typeSelect.addEventListener("change", () => {
    renderBody()
    if (typeSelect.value === "custom") nameInput.focus()
    else if (presets.some((item) => item.preset === typeSelect.value)) apiKeyInput.focus() // 预设径：补 apiKey 为首要动作
  })

  /** 预设表拉取（首开惰性）：成功 ⇒ 选项 = 计数 + 未配预设 + 自定义 ∥ 失败 ⇒ 提示项 + 自定义（照常可达）。 */
  const loadPresets = async () => {
    try {
      const data = await ctx.api("/api/admin/providers/presets")
      presets = (data.presets ?? []).filter((item) => !existing.has(item.name))
      typeSelect.replaceChildren(
        h("option", { value: "", text: t("admin.providers.presetSelectCount", { count: presets.length }) }),
        ...presets.map((item) => h("option", { value: item.preset, text: t("admin.providers.presetOption", { name: item.name, preset: item.preset }) })),
        h("option", { value: "custom", text: t("admin.providers.customChoice") }))
    } catch {
      typeSelect.replaceChildren(
        h("option", { value: "", text: t("admin.providers.presetFailed") }),
        h("option", { value: "custom", text: t("admin.providers.customChoice") }))
    }
  }

  fetchBtn.addEventListener("click", async () => {
    const baseURL = baseURLInput.value.trim()
    if (!baseURL) { ctx.flash(t("admin.providers.needBaseURL")); return }
    const body = { baseURL }
    const typed = apiKeyInput.value.trim()
    if (typed) body.apiKey = typed // 明传（可含 `env:` 引用——服务端解析）
    try {
      const done = await ctx.api("/api/admin/providers/discover", { method: "POST", body })
      candidates = done.models
      errorText = null
      ctx.flash(t("admin.providers.discovered", { count: done.models.length }))
    } catch (error) {
      errorText = mapError(error) // 段内提示（保存不受阻——models 可空）
    }
    renderPicksArea()
  })

  const save = async () => {
    const value = typeSelect.value
    const preset = presets.find((item) => item.preset === value) ?? null
    if (value === "") { ctx.flash(t("admin.providers.presetNeeded")); return }
    const body = value === "custom"
      ? { name: nameInput.value.trim(), baseURL: baseURLInput.value.trim(), apiKey: apiKeyInput.value.trim(), models: [...draft] }
      : { name: preset.name, baseURL: preset.baseURL, apiKey: apiKeyInput.value.trim(), models: [...preset.models] }
    try {
      await ctx.api("/api/admin/providers", { method: "POST", body })
      ctx.flash(t("admin.providers.saved"))
      modal.close()
      if (reload !== null) await reload()
    } catch (error) { ctx.fail(error) } // 失败 ⇒ flash（弹窗留驻）
  }

  footBox.replaceChildren(
    h("button", { type: "button", text: t("common.save"), onclick: save }),
    h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() }))
  renderBody()
  renderPicksArea() // 空态提示随窗成立（拉取结果到达即就地重渲）
  loadPresets() // 首开惰性拉取（异步——完成即回填选项；失败 ⇒ 提示 + 自定义径照常）
  return modal
}

/** 详情弹窗（行点击；两段 + 单脚区）：信息段 = 名称 ∥ baseURL（预填输入——「改」承接旧编辑面）∥ 密钥（输入 +
 *  掩码占位「留空 = 不修改」+「清除密钥」勾）∥「测试连接」（= discover 复用——`providerId` 取库内 key）∥「删除」
 *  （confirm ⇒ DELETE）；勾选段 = 「服务的模型」——候选 = 上游发现集（首开自动拉取 ∥「刷新候选」重试；失败 ⇒
 *  段内提示，草稿 = 现配置未动 ⇒ 无损）；退役项（不在发现列表的已开放模型）只读注 + 恒保留（停用入口 = 服务
 *  模型页——用户 2026-10-06 21:40 裁）；脚区 = 保存（PATCH 变更字段——`models` 全量数组；零变更 ⇒ 直接关窗）∥
 *  取消（弃稿）。 */
export function openProviderDetailModal(ctx, { provider, reload = null } = {}) {
  const { h } = ctx
  const bodyBox = h("div")
  const footBox = h("div", { class: "row-form" })
  const modal = openModal({ title: provider.name, body: bodyBox, footer: footBox })

  let candidates = null // null = 未拉取/失败前 ∥ 数组 = 最近一次发现结果（退役判定面）
  let errorText = null // 发现失败 ⇒ 段内提示
  const draft = new Set(provider.models) // 勾选草稿（初值 = 现配置；退役项不触碰 ⇒ 恒保留）

  const nameInput = h("input", { value: provider.name })
  const baseURLInput = h("input", { value: provider.baseURL })
  const keyInput = h("input", {
    placeholder: provider.apiKey ? t("admin.providers.keepKey", { mask: provider.apiKey }) : t("admin.providers.keepKeyNone"),
    autocomplete: "off",
  })
  const clearKey = h("input", { type: "checkbox" })
  const picksBox = h("div")
  const noteBox = h("div")
  const refreshBtn = h("button", { type: "button", class: "tiny", text: t("admin.providers.refreshCandidates") })

  /** 候选拉取（首开自动 ∥「刷新候选」）：`baseURL` 取草稿输入 ∥ key 取库内；失败 ⇒ 段内提示（重试可达候选）。 */
  const loadCandidates = async ({ flash = false } = {}) => {
    const baseURL = baseURLInput.value.trim()
    if (!baseURL) return
    try {
      const done = await ctx.api("/api/admin/providers/discover", { method: "POST", body: { baseURL, providerId: provider.id } })
      candidates = done.models
      errorText = null
      if (flash) ctx.flash(t("admin.providers.discovered", { count: done.models.length }))
    } catch (error) {
      errorText = mapError(error) // 段内提示 +「刷新候选」重试（保存不受阻——草稿 = 现配置未动 ⇒ 无损）
    }
    renderPicksArea()
  }
  refreshBtn.addEventListener("click", () => loadCandidates({ flash: true }))

  /** 测试连接（= discover 复用——`providerId` 取库内 key；零新端点）：结果 = flash（弹窗留驻——不触碰候选草稿）。 */
  const testConnection = async () => {
    const baseURL = baseURLInput.value.trim()
    if (!baseURL) { ctx.flash(t("admin.providers.needBaseURL")); return }
    ctx.flash(t("admin.providers.testing", { name: provider.name }))
    try {
      const done = await ctx.api("/api/admin/providers/discover", { method: "POST", body: { baseURL, providerId: provider.id } })
      ctx.flash(t("admin.providers.testOk", { name: provider.name, count: done.models.length }))
    } catch (error) { ctx.fail(error) }
  }

  const remove = async () => {
    if (!window.confirm(t("admin.providers.deleteConfirm", { name: provider.name }))) return
    try {
      await ctx.api(`/api/admin/providers/${provider.id}`, { method: "DELETE" })
      ctx.flash(t("admin.providers.deleted", { name: provider.name }))
      modal.close()
      if (reload !== null) await reload()
    } catch (error) { ctx.fail(error) }
  }

  /** 勾选段重渲：错误态 ⇒ 段内提示；在位 ⇒ 候选勾选（勾选态 = 草稿）+ 退役项只读注行（不触碰 ⇒ 提交恒含）。 */
  const renderPicksArea = () => {
    renderPicks(h, picksBox, {
      candidates, draft, errorText,
      onToggle: (model, checked) => { if (checked) draft.add(model); else draft.delete(model) },
      emptyText: t("admin.providers.candidatesEmpty", { action: t("admin.providers.refreshCandidates") }),
    })
    const retired = candidates === null ? [] : provider.models.filter((model) => !candidates.includes(model))
    noteBox.replaceChildren(...(retired.length === 0 ? []
      : [h("p", { class: "hint", text: t("admin.providers.retiredNote", { models: retired.join(", ") }) })]))
  }

  /** 保存（PATCH 变更字段——`models` 全量数组单写 ⇒ 保存即热生效；零变更 ⇒ 直接关窗不请求）。 */
  const save = async () => {
    const body = {}
    if (nameInput.value.trim() !== provider.name) body.name = nameInput.value.trim()
    if (baseURLInput.value.trim() !== provider.baseURL) body.baseURL = baseURLInput.value.trim()
    if (clearKey.checked) body.apiKey = "" // 清除密钥（§2.2——保存后不发 Authorization 头）
    else if (keyInput.value.trim()) body.apiKey = keyInput.value.trim()
    const models = [...draft]
    if (!sameSet(models, provider.models)) body.models = models // 全量数组（退役项恒保留）
    if (Object.keys(body).length === 0) { modal.close(); return } // 零变更 ⇒ 直接关窗
    try {
      await ctx.api(`/api/admin/providers/${provider.id}`, { method: "PATCH", body })
      ctx.flash(t("admin.providers.saved"))
      modal.close()
      if (reload !== null) await reload()
    } catch (error) { ctx.fail(error) } // 失败 ⇒ flash（弹窗留驻）
  }

  bodyBox.replaceChildren(
    h("div", { class: "provider-form" },
      h("label", {}, t("admin.providers.name"), nameInput),
      h("label", {}, t("admin.providers.baseURL"), baseURLInput),
      h("label", {}, t("admin.providers.apiKey"), keyInput),
      h("label", { class: "key-clear" }, clearKey, t("admin.providers.clearKey"))),
    h("div", { class: "info-actions" },
      h("button", { type: "button", text: t("admin.providers.test"), onclick: testConnection }),
      h("button", { type: "button", class: "danger", text: t("admin.providers.delete"), onclick: remove })),
    h("div", { class: "stack-models" },
      h("div", { class: "pick-head" }, h("span", { class: "hint", text: t("admin.providers.openList") }), refreshBtn),
      picksBox, noteBox))
  footBox.replaceChildren(
    h("button", { type: "button", text: t("common.save"), onclick: save }),
    h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() }))
  renderPicksArea()
  loadCandidates() // 首开自动拉取（失败 ⇒ 段内提示 +「刷新候选」重试；草稿 = 现配置未动 ⇒ 无损）
  return modal
}
