/**
 * views-providers-modals.mjs — Provider 双弹窗件（webui/WEBUI.md §2.4④——功能点 18 ∥ KD-SV-33；自
 * `views-providers.mjs` 拆出——双弹窗叠加破 300 软线）：添加弹窗（预设/自定义两径——预设表首开惰性拉取·
 * 已配名剔除）∥ 详情弹窗（信息段 + 候选勾选段——候选 = 上游发现；退役项只读注 + 恒保留；单脚区保存）；
 * 模型清单/候选勾选 = 表格形（列式——2026-10-07 收正：模型 ∥ 展示名 ∥ 上下文 ∥ 视觉 ∥ 状态；首格 `label` = 勾选 + 模型名；
 * 预设清单 = `code` 行）；
 * 候选行富信息（功能点 24——列式：`displayName` ∥ `contextWindow` ∥ `vision` ∥ `status`；数据 = 发现 ∪ 存储逐字段·
 * 发现优先；缺则空、零占位）；上游退役提示（`status` ⇒ 列内标 + 注行——**只提示**，勾选/保存/派发零涉）∥ 候选段加载态（#984——
 * 在飞 `.hint` 加载文案 + 触发钮禁用；一处落双窗）。
 *
 * 端点零新（契约 = gateway/API.md §2.2）：`GET /api/admin/providers/presets`（拉表）∥ `POST /api/admin/providers/discover`
 * （探针——「测试连接」= 同径复用，key = 表单草稿口径：明填 ⇒ 明传 `apiKey`，留空且未勾清除 ⇒ `providerId` 库内回落，清除勾 ⇒ 显式空；失败 ⇒ 段内提示 + 重试；无手填兜底）∥ `POST` 全字段 ∥
 * `PATCH` 变更字段（`models` 全量数组——保存即热生效）∥ `DELETE`。弹窗 = 公共组件 `modal.mjs`（单例 ∥ 遮罩/关闭/焦点）；
 * 渲染一律节点 + textContent；文案经 `t()` 取值；错误经 `mapError` 映射（§2.2）。
 */
import { mapError, t } from "./i18n.mjs"
import { openModal } from "./modal.mjs"

/** 令牌数格式化（`fmtTokens`——元数据展示助手）：≥1e6 ⇒ `xM`（一位小数舍零）∥ ≥1e3 ⇒ `xk` ∥ 原值。 */
export function fmtTokens(value) {
  if (value >= 1000000) {
    const m = Math.round(value / 100000) / 10
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`
  }
  if (value >= 1000) return `${Math.round(value / 1000)}k`
  return String(value)
}

/** 元数据逐字段合并（发现值优先 ∥ 存储补齐——§2.4④）：两处皆缺 ⇒ 键不出。 */
export function mergeModelMeta(stored, discovered) {
  const merged = {}
  for (const [model, meta] of Object.entries(stored ?? {})) merged[model] = { ...meta }
  for (const [model, meta] of Object.entries(discovered ?? {})) merged[model] = { ...(merged[model] ?? {}), ...meta }
  return merged
}

/** 候选勾选清单（双弹窗复用——**列式表**：模型 ∥ 展示名 ∥ 上下文 ∥ 视觉 ∥ 状态——2026-10-07 轻通道收正）：
 *  候选 = 上游发现集；`draft` = 勾选集（变化即写回）；`meta` = 逐模型富信息图（发现 ∪ 存储——有则示、缺则空、零占位）；
 *  `loading` = 在飞态（#984——加载文案 ∥ 触发钮禁用 = 调用方）；发现失败 ⇒ 段内提示（重试 = 段内动作钮）；空 ⇒ `emptyText`。
 *  「零手填」——候选面零文本输入（用户 2026-10-06 21:36 裁定）；首格 = `label`（勾选 + 模型名——点题名同切换）。 */
function renderPicks(h, box, { candidates, meta = {}, draft, onToggle, emptyText, errorText, loading = false }) {
  if (loading === true) {
    box.replaceChildren(h("p", { class: "hint", text: t("admin.providers.candidatesLoading") }))
    return
  }
  if (errorText !== null) {
    box.replaceChildren(h("p", { class: "hint error", text: errorText }))
    return
  }
  const models = [...(candidates ?? [])].sort() // 名称升序（2026-10-07 走查收正——长清单可找）
  if (models.length === 0) {
    box.replaceChildren(h("span", { class: "hint", text: emptyText }))
    return
  }
  const cell = (value, cls = "hint") => h("td", {}, value === null ? null : h("span", { class: cls, text: String(value) }))
  box.replaceChildren(h("div", { class: "table-wrap" },
    h("table", {},
      h("thead", {}, h("tr", {},
        h("th", { text: t("admin.models.colModel") }),
        h("th", { text: t("admin.providers.colDisplayName") }),
        h("th", { text: t("admin.providers.colContext") }),
        h("th", { text: t("admin.providers.metaVision") }),
        h("th", { text: t("admin.providers.colStatus") }))),
      h("tbody", {}, ...models.map((model) => {
        const item = meta[model] ?? {}
        const pick = h("input", { type: "checkbox", checked: draft.has(model) })
        pick.addEventListener("change", () => onToggle(model, pick.checked))
        return h("tr", {},
          h("td", {}, h("label", {}, pick, model)),
          cell(typeof item.displayName === "string" ? item.displayName : null),
          cell(item.contextWindow !== undefined ? fmtTokens(item.contextWindow) : null),
          cell(item.vision === true ? "✓" : null),
          cell(typeof item.status === "string" ? t("admin.providers.upstreamRetiredBadge") : null, "hint error"))
      })))))
}

/** 预设模型清单表（§2.6⑤——单列「模型」：行 = `code` 芯片；名称升序）。 */
function presetModelsTable(h, models) {
  return h("div", { class: "table-wrap" },
    h("table", {},
      h("thead", {}, h("tr", {}, h("th", { text: t("admin.models.colModel") }))),
      h("tbody", {}, ...[...models].sort().map((model) => h("tr", {}, h("td", {}, h("code", { text: model })))))))
}

/** 集合等价（序无关——PATCH `models` 判「变更」用：全量数组单写）。 */
function sameSet(a, b) {
  return a.length === b.length && a.every((item) => b.includes(item))
}

/** 添加弹窗（页首「添加」；取形 = VSC 面板 [+ Add] 形——步序语义 = 核件 `addProviderFlow`）：类型一选
 *  （预设 ∥ 自定义）——预设径 = 选预设 ⇒ 信息行（地址 ∥ 模型清单——只读）+ 补 apiKey（可空——`env:` 照收）⇒ 保存；
 *  自定义径 = 名 ∥ baseURL ∥ apiKey +「获取模型」探针 ⇒ 候选勾选；保存不设发现门（models 可空——沿 POST 语义）。
 *  预设拉取失败 ⇒ 提示 + 自定义径照常；写入 = POST 全字段（无 `preset` 字段——校验不豁免）；成功 ⇒ 关窗 + 列表刷新
 *  + flash；失败 ⇒ 窗内状态行（弹窗留驻）；取消/×/ESC = 弃稿。 */
export function openAddProviderModal(ctx, { providers = [], reload = null } = {}) {
  const { h } = ctx
  const existing = new Set(providers.map((item) => item.name)) // 已配名剔除（服务端复核为准——重名 ⇒ 400）
  const bodyBox = h("div")
  const footBox = h("div", { class: "row-form" })
  const modal = openModal({ title: t("admin.providers.addTitle"), body: bodyBox, footer: footBox })

  let presets = [] // 预设表（首开惰性拉取——已配名剔除）
  let candidates = null // null = 未拉取 ∥ 数组 = 最近一次发现结果
  let probeMeta = {} // 探针所得元数据（discover 响应 `modelMeta`——无探针/零字段 ⇒ `{}` ⇒ 保存省略键）
  let loading = false // 探针在飞（#984——加载文案 + 触发钮禁用）
  let errorText = null // 发现失败 ⇒ 段内提示（重试可达）
  const draft = new Set() // 勾选集（自定义径——保存提交）

  const typeSelect = h("select", {}, h("option", { value: "", text: t("admin.providers.presetPick") }))
  const nameInput = h("input", { placeholder: t("admin.providers.namePh") })
  const baseURLInput = h("input", { placeholder: t("admin.providers.baseURLPh") })
  const apiKeyInput = h("input", { placeholder: t("admin.providers.apiKeyPh"), autocomplete: "off" })
  const fetchBtn = h("button", { type: "button", class: "tiny", text: t("admin.providers.fetchModels") })
  const askNote = h("p", { class: "hint", hidden: true }) // 窗内状态行（校验 ∥ 保存 ∥ 获取模型——2026-10-07 走查收正：反馈不落窗外）
  const showNote = (text, isError = false) => { askNote.hidden = false; askNote.className = isError ? "hint error" : "hint"; askNote.textContent = text }
  const picksBox = h("div", { class: "pick-box" })

  const keyRow = () => h("div", { class: "provider-form" }, h("label", {}, t("admin.providers.apiKey"), apiKeyInput))
  const renderPicksArea = () => renderPicks(h, picksBox, {
    candidates, meta: probeMeta, draft, errorText, loading,
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
          picksBox),
        askNote)
      return
    }
    if (preset === null) {
      bodyBox.replaceChildren(typeRow, askNote)
      return
    }
    bodyBox.replaceChildren(
      typeRow,
      h("dl", { class: "detail-grid" },
        h("dt", { text: t("admin.providers.baseURL") }), h("dd", {}, h("code", { text: preset.baseURL }) )),
      presetModelsTable(h, preset.models), // 模型清单 = 表格形（§2.6⑤——单列「模型」：`code` 行）
      keyRow(),
      askNote)
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
    if (!baseURL) { showNote(t("admin.providers.needBaseURL"), true); return }
    const body = { baseURL }
    const typed = apiKeyInput.value.trim()
    if (typed) body.apiKey = typed // 明传（可含 `env:` 引用——服务端解析）
    loading = true // 在飞态（#984）
    fetchBtn.disabled = true
    renderPicksArea()
    try {
      const done = await ctx.api("/api/admin/providers/discover", { method: "POST", body })
      candidates = done.models
      probeMeta = done.modelMeta ?? {} // 探针所得元数据（随保存落库——无 ⇒ 省略键）
      errorText = null
    } catch (error) {
      errorText = mapError(error) // 段内提示（保存不受阻——models 可空）
    } finally {
      loading = false
      fetchBtn.disabled = false
      renderPicksArea()
    }
  })

  const save = async () => {
    const value = typeSelect.value
    const preset = presets.find((item) => item.preset === value) ?? null
    if (value === "") { showNote(t("admin.providers.presetNeeded"), true); return }
    const body = value === "custom"
      ? { name: nameInput.value.trim(), baseURL: baseURLInput.value.trim(), apiKey: apiKeyInput.value.trim(), models: [...draft] }
      : { name: preset.name, baseURL: preset.baseURL, apiKey: apiKeyInput.value.trim(), models: [...preset.models] }
    if (value === "custom" && Object.keys(probeMeta).length > 0) body.modelMeta = probeMeta // 探针所得（无探针/零字段 ⇒ 省略键）
    try {
      await ctx.api("/api/admin/providers", { method: "POST", body })
      ctx.flash(t("admin.providers.saved"))
      modal.close()
      if (reload !== null) await reload()
    } catch (error) {
      if (error?.status === 401 && error?.code !== "invalid_credentials") { ctx.fail(error); return } // 会话失效 ⇒ 照常踢登录
      showNote(mapError(error), true) // 失败 ⇒ 窗内状态行（弹窗留驻）
    }
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
 *  掩码占位「留空 = 不修改」+「清除密钥」勾）∥「测试连接」（= discover 复用——key = 表单草稿口径）∥「删除」
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
  let discoveredMeta = {} // 本次发现元数据（与存储逐字段合并——展示/保存同源；缺 ⇒ 空图）
  let loading = false // 候选在飞（#984——加载文案 + 触发钮禁用）
  let errorText = null // 发现失败 ⇒ 段内提示
  const draft = new Set(provider.models) // 勾选草稿（初值 = 现配置；退役项不触碰 ⇒ 恒保留）

  const nameInput = h("input", { value: provider.name })
  const baseURLInput = h("input", { value: provider.baseURL })
  const keyInput = h("input", {
    placeholder: provider.apiKey ? t("admin.providers.keepKey", { mask: provider.apiKey }) : t("admin.providers.keepKeyNone"),
    autocomplete: "off",
  })
  const clearKey = h("input", { type: "checkbox" })
  const picksBox = h("div", { class: "pick-box" })
  const noteBox = h("div", { class: "pick-note" })
  const refreshBtn = h("button", { type: "button", class: "tiny", text: t("admin.providers.refreshCandidates") })
  const testNote = h("p", { class: "hint", hidden: true }) // 测试连接结果行（同窗内——AC-18「测试同窗」；2026-10-07 走查收正）
  const showNote = (text, isError = false) => { testNote.hidden = false; testNote.className = isError ? "hint error" : "hint"; testNote.textContent = text } // 窗内状态行（测试连接 ∥ 保存失败——2026-10-07 走查收正）

  /** 草稿 key 判定（测试连接 ∥ 刷新候选同源——与保存 key 判定同式）：清除勾 ⇒ `{ apiKey: "" }`（显式空——保存语义镜像）∥
   *  明填（trim 非空）⇒ `{ apiKey: <草稿值> }`（`env:` 引用原文照送——前端零解析）∥ 否则 ⇒ `{ providerId: provider.id }`（库内 key 回落）。 */
  const draftKey = () => {
    if (clearKey.checked) return { apiKey: "" }
    const typed = keyInput.value.trim()
    if (typed) return { apiKey: typed }
    return { providerId: provider.id }
  }

  /** 候选拉取（首开自动 ∥「刷新候选」）：`baseURL` 取草稿输入 ∥ key = 表单草稿口径（`draftKey()`——与测试连接同源）；失败 ⇒ 段内提示（重试可达候选）。 */
  const loadCandidates = async () => {
    const baseURL = baseURLInput.value.trim()
    if (!baseURL) return
    loading = true // 在飞态（#984）
    refreshBtn.disabled = true
    renderPicksArea()
    try {
      const done = await ctx.api("/api/admin/providers/discover", { method: "POST", body: { baseURL, ...draftKey() } })
      candidates = done.models
      discoveredMeta = done.modelMeta ?? {}
      errorText = null
    } catch (error) {
      errorText = mapError(error) // 段内提示 +「刷新候选」重试（保存不受阻——草稿 = 现配置未动 ⇒ 无损）
    } finally {
      loading = false
      refreshBtn.disabled = false
      renderPicksArea()
    }
  }
  refreshBtn.addEventListener("click", () => loadCandidates())

  /** 测试连接（= discover 复用——key = 表单草稿口径，`draftKey()` 与刷新候选同源；零新端点）：结果 = **同窗结果行**（AC-18「测试同窗」；2026-10-07 走查收正——原 flash 在弹窗外）。 */
  const testConnection = async () => {
    const baseURL = baseURLInput.value.trim()
    if (!baseURL) { showNote(t("admin.providers.needBaseURL"), true); return }
    showNote(t("admin.providers.testing", { name: provider.name }))
    try {
      const done = await ctx.api("/api/admin/providers/discover", { method: "POST", body: { baseURL, ...draftKey() } })
      showNote(t("admin.providers.testOk", { name: provider.name, count: done.models.length }))
    } catch (error) { showNote(mapError(error), true) }
  }

  const remove = async () => {
    if (!window.confirm(t("admin.providers.deleteConfirm", { name: provider.name }))) return
    try {
      await ctx.api(`/api/admin/providers/${provider.id}`, { method: "DELETE" })
      ctx.flash(t("admin.providers.deleted", { name: provider.name }))
      modal.close()
      if (reload !== null) await reload()
    } catch (error) {
      if (error?.status === 401 && error?.code !== "invalid_credentials") { ctx.fail(error); return } // 会话失效 ⇒ 照常踢登录
      showNote(mapError(error), true) // 失败 ⇒ 窗内状态行（弹窗留驻——定则「弹窗开着 ⇒ 一切反馈落窗内」）
    }
  }

  /** 勾选段重渲：错误态 ⇒ 段内提示；在位 ⇒ 候选勾选（勾选态 = 草稿）+ 退役项只读注行（不触碰 ⇒ 提交恒含）
   *  + 上游退役注行（`status` 命中——只提示，勾选/保存/派发零涉）。 */
  const renderPicksArea = () => {
    const meta = mergeModelMeta(provider.modelMeta, discoveredMeta)
    renderPicks(h, picksBox, {
      candidates, meta, draft, errorText, loading,
      onToggle: (model, checked) => { if (checked) draft.add(model); else draft.delete(model) },
      emptyText: t("admin.providers.candidatesEmpty", { action: t("admin.providers.refreshCandidates") }),
    })
    const retired = candidates === null ? [] : provider.models.filter((model) => !candidates.includes(model))
    const upstreamRetired = candidates === null ? [] : [...candidates].sort().filter((model) => typeof meta[model]?.status === "string")
    const notes = []
    if (retired.length > 0) notes.push(h("p", { class: "hint", text: t("admin.providers.retiredNote", { models: retired.join(", ") }) }))
    if (upstreamRetired.length > 0) {
      notes.push(h("p", { class: "hint error", text: t("admin.providers.upstreamRetiredNote", { models: upstreamRetired.map((model) => `${model} (${meta[model].status})`).join(", ") }) }))
    }
    noteBox.replaceChildren(...notes)
  }

  /** 保存（PATCH 变更字段——`models` 全量数组 + `modelMeta` 期望图（存储 ∪ 发现）随携 ⇒ 保存即热生效；零变更 ⇒ 直接关窗不请求）。 */
  const save = async () => {
    const body = {}
    if (nameInput.value.trim() !== provider.name) body.name = nameInput.value.trim()
    if (baseURLInput.value.trim() !== provider.baseURL) body.baseURL = baseURLInput.value.trim()
    if (clearKey.checked) body.apiKey = "" // 清除密钥（§2.2——保存后不发 Authorization 头）
    else if (keyInput.value.trim()) body.apiKey = keyInput.value.trim()
    const models = [...draft]
    if (!sameSet(models, provider.models)) body.models = models // 全量数组（退役项恒保留）
    if (Object.keys(body).length === 0) { modal.close(); return } // 零变更（可编辑面零动）⇒ 直接关窗零请求（发现富化不单独触发写——§2.4④）
    const expected = mergeModelMeta(provider.modelMeta, discoveredMeta) // 期望图（发现值优先 ∥ 存储补齐）
    if (Object.keys(expected).length > 0) body.modelMeta = expected // 空图 ⇒ 省略键
    try {
      await ctx.api(`/api/admin/providers/${provider.id}`, { method: "PATCH", body })
      ctx.flash(t("admin.providers.saved"))
      modal.close()
      if (reload !== null) await reload()
    } catch (error) {
      if (error?.status === 401 && error?.code !== "invalid_credentials") { ctx.fail(error); return } // 会话失效 ⇒ 照常踢登录
      showNote(mapError(error), true) // 失败 ⇒ 窗内状态行（弹窗留驻）
    }
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
    testNote,
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
