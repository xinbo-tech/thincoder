/**
 * views-models.mjs — 管理·服务模型页（webui/WEBUI.md §2/§2.4③——KD-SV-32/34：`#/admin/models`——仅 admin）：
 * 列表 = `/v1/models` 同源（`GET /api/admin/providers` 的 `models` 展平为 `provider/model` 前缀形——**嵌入引擎模型不入本列表**
 * （单独命名空间——KD-SV-58；2026-10-09 embed 解耦批））∥ 配额列（`settings[上游].quotaTokens`——未设 ⇒「不限」；与 F 组单源）∥
 * 行点击 ⇒ 详情弹窗（复用 `modal.mjs`）；配置五组 = A 开放状态（停用流）∥
 * C 限流（RPM/TPM）∥ F 配额（`quotaTokens`——每人每月默认用量）∥ D 展示元数据（规格快照查表 + 手填「说明」）∥ E 成本权重
 * ——保存 = PATCH `settings`
 * （单键全对象提交——全子字段在册；未设/清空 = 显式 `null`；草稿初值 = GET 行 `settings` 该键值）。
 *
 * 零新端点（目录来源 = provider 配置派生——需求边界）；**零上游探针**（列表/详情/停用皆不引发现面——退役项同口径
 * 可停）；判权全在后端（admin 面——服务端 403 为准）；渲染一律节点 + textContent；文案经 `t()` 取值（§2.2）。
 */
import { t } from "./i18n.mjs"
import { openModal } from "./modal.mjs"
import { specForDisplay } from "./model-specs-snapshot.mjs"

/** 服务模型行集（与 `/v1/models` 同源——纯函数，批内件直测）：providers 展平（**嵌入引擎模型不入本列表**——
 *  单独命名空间，KD-SV-58）。行形 = `{ id（前缀形）, provider, upstream（首斜杠余段）, surface（恒 chat） }`。 */
export function deriveModels(providers) {
  const rows = []
  for (const provider of providers ?? []) {
    for (const model of provider.models ?? []) {
      const id = `${provider.name}/${model}`
      rows.push({ id, provider: provider.name, upstream: id.slice(id.indexOf("/") + 1), surface: "chat" })
    }
  }
  return [...rows].sort((a, b) => a.id.localeCompare(b.id)) // id 升序（2026-10-07 走查收正——服务模型页长清单可找；同弹窗清单口径）
}

/** A 停用 = `models` 减项（纯函数——批内件直测；本页 = 开放清单自持操作面——退役项同口径）。 */
export function modelsWithout(models, model) {
  return (models ?? []).filter((item) => item !== model)
}

/** 数值字段判据（前端先行——服务端复核为准）：rpm/tpm = 正整数 ∥ costIn/costOut = ≥0 数 ∥ quotaTokens = ≥0 整数（每人每月默认用量）；空 = 未设（rpm/tpm/quotaTokens = 不限、其余 = 未设）。 */
const NUMERIC_FIELDS = [["rpm", "positive"], ["tpm", "positive"], ["costIn", "nonNegative"], ["costOut", "nonNegative"], ["quotaTokens", "nonNegativeInt"]]
const FIELD_LABELS = { rpm: "admin.models.rpm", tpm: "admin.models.tpm", costIn: "admin.models.costIn", costOut: "admin.models.costOut", quotaTokens: "admin.members.colMonthlyQuota" }
const RULE_KEYS = { positive: "admin.models.rulePositive", nonNegative: "admin.models.ruleNonNegative", nonNegativeInt: "admin.models.ruleNonNegativeInt" }

/** 草稿汇总 → `settings` 值对象（§2.4③ 线形：键 = 上游模型名 ∥ 值 = 全字段对象——未设/清空 = 显式 `null`）。
 *  非法 ⇒ `{ invalid: { field, ruleKey } }`（就地提示——不提交；服务端复核为准）。 */
export function settingsValueFromDraft(draft) {
  const value = {}
  for (const [field, rule] of NUMERIC_FIELDS) {
    const raw = String(draft?.[field] ?? "").trim()
    if (raw === "") { value[field] = null; continue }
    const num = Number(raw)
    const ok = rule === "positive" ? Number.isInteger(num) && num >= 1
      : rule === "nonNegativeInt" ? Number.isInteger(num) && num >= 0
        : Number.isFinite(num) && num >= 0
    if (!ok) return { invalid: { field, ruleKey: RULE_KEYS[rule] } }
    value[field] = num
  }
  const note = String(draft?.note ?? "").trim()
  value.note = note === "" ? null : note
  return { value }
}

/** GET 行 `settings` 该键值 → 草稿初值（部分字段编辑不丢其余字段——§2.4③）；未设字段 ⇒ 空串（输入框原形）。 */
export function draftFromSettings(settings, upstream) {
  const value = settings?.[upstream] ?? {}
  const text = (item) => (item === null || item === undefined ? "" : String(item))
  return { rpm: text(value.rpm), tpm: text(value.tpm), costIn: text(value.costIn), costOut: text(value.costOut), quotaTokens: text(value.quotaTokens), note: value.note ?? "" }
}

export async function renderModels(ctx, mount) {
  const { h } = ctx
  const listBox = h("div", { class: "table-slot" }, h("p", { class: "hint", text: t("common.loading") }))
  ctx.dataShell(mount, { // 视口高壳（§2.6②——页题固定 ∥ 表槽吃剩高；表尾计数 = 表内 tfoot）
    head: h("h2", { text: t("admin.models.title") }),
    area: h("section", { class: "card" }, listBox),
  })
  const load = async () => {
    try {
      const data = await ctx.api("/api/admin/providers")
      const providers = data.providers ?? []
      const rows = deriveModels(providers)
      listBox.replaceChildren(rows.length === 0
        ? h("p", { class: "hint", text: t("admin.models.empty") })
        : modelsTable(ctx, rows, providers, load))
    } catch (error) {
      ctx.fail(error)
      listBox.replaceChildren(h("p", { class: "hint error", text: t("admin.models.loadFailed") }))
    }
  }
  await load()
}

/** 列表（列 = 模型 ∥ Provider ∥ 面 ∥ 配额）：行点击（Enter/Space 同开——键盘可达）⇒ 详情弹窗（entry = 该行 provider 行——设置/停用取数源）；
 *  配额 = `settings[上游].quotaTokens`（未设/清空 ⇒「不限」——与 F 组单源，零第二存储）。 */
function modelsTable(ctx, rows, providers, reload) {
  const { h } = ctx
  const headers = [t("admin.models.colModel"), t("admin.models.colProvider"), t("admin.models.colSurface"), t("admin.models.quotaTitle")]
  const quotaOf = (row) => {
    const value = ((providers.find((item) => item.name === row.provider) ?? {}).settings ?? {})[row.upstream]?.quotaTokens
    return value === null || value === undefined ? t("common.quotaUnlimited") : String(value)
  }
  const body = rows.map((row) => {
    const tr = h("tr", { class: "row-clickable", tabindex: "0" },
      h("td", {}, h("code", { text: row.id })),
      h("td", { text: row.provider }),
      h("td", { text: row.surface }),
      h("td", { text: quotaOf(row) }))
    const open = () => openModelModal(ctx, { row, entry: providers.find((item) => item.name === row.provider) ?? null, reload })
    tr.addEventListener("click", open)
    tr.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open() }
    })
    return tr
  })
  return h("div", { class: "table-wrap" },
    h("table", {},
      h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))),
      h("tbody", {}, ...body),
      h("tfoot", {}, h("tr", {}, h("td", { colspan: String(headers.length), text: t("common.rowCount", { count: rows.length }) })))))
}

/** 详情弹窗（复用公共组件；导出 = 批内件直测）：详情四行 + 配置五组（A/C/F/D/E）。
 *  停用 = confirm ⇒ PATCH `models` 减项 ⇒ 关窗 + 列表刷新 + flash；保存 = PATCH `settings`（单键全对象）⇒ flash + 弹窗留驻。 */
export function openModelModal(ctx, { row, entry, reload }) {
  const { h } = ctx
  const bodyBox = h("div")
  const footBox = h("div", { class: "row-form" })
  const modal = openModal({ title: t("admin.models.detailTitle"), body: bodyBox, footer: footBox })
  const details = h("dl", { class: "detail-grid" },
    h("dt", { text: t("admin.models.colModel") }), h("dd", {}, h("code", { text: row.id })),
    h("dt", { text: t("admin.models.colProvider") }), h("dd", { text: row.provider }),
    h("dt", { text: t("admin.models.upstream") }), h("dd", { text: ctx.fmtValue(row.upstream) }),
    h("dt", { text: t("admin.models.colSurface") }), h("dd", { text: row.surface }))

  const draft = draftFromSettings(entry?.settings, row.upstream)
  const inputs = {} // field ⇒ input（读数用）
  const hints = {} // field ⇒ 就地提示节点（非法态）
  const numericField = (field) => {
    const input = h("input", { type: "text", inputmode: "numeric", value: draft[field] })
    const hint = h("p", { class: "hint error", hidden: true })
    inputs[field] = input
    hints[field] = hint
    return h("label", { class: "config-field" }, h("span", { text: t(FIELD_LABELS[field]) }), input, hint)
  }
  const noteInput = h("input", { maxlength: "200", value: draft.note })

  /** A · 停用流（本页 = 开放清单自持操作面——退役项同口径；零上游探针）。 */
  const disable = async () => {
    if (!window.confirm(t("admin.models.disableConfirm", { model: row.id }))) return
    try {
      await ctx.api(`/api/admin/providers/${entry.id}`, { method: "PATCH", body: { models: modelsWithout(entry.models, row.upstream) } })
      modal.close()
      ctx.flash(t("admin.models.disabled", { model: row.id }))
      await reload()
    } catch (error) { ctx.fail(error) } // 失败 ⇒ flash（弹窗留驻）
  }

  /** 保存 = PATCH `settings`（单键全对象——§2.4③ 线形）；非法 ⇒ 就地提示不提交（服务端复核为准）。 */
  const save = async () => {
    for (const hint of Object.values(hints)) hint.hidden = true
    const read = { rpm: inputs.rpm.value, tpm: inputs.tpm.value, costIn: inputs.costIn.value, costOut: inputs.costOut.value, quotaTokens: inputs.quotaTokens.value, note: noteInput.value }
    const { value, invalid } = settingsValueFromDraft(read)
    if (invalid) {
      hints[invalid.field].textContent = t("admin.models.invalidNumber", { field: t(FIELD_LABELS[invalid.field]), rule: t(invalid.ruleKey) })
      hints[invalid.field].hidden = false
      inputs[invalid.field].focus()
      return
    }
    try {
      await ctx.api(`/api/admin/providers/${entry.id}`, { method: "PATCH", body: { settings: { [row.upstream]: value } } })
      entry.settings = { ...(entry.settings ?? {}), [row.upstream]: value } // 弹窗留驻——重开草稿同源（其余字段不丢）
      ctx.flash(t("admin.models.saved"))
      await reload?.() // 保存后列表刷新随动（配额列与 F 组单源——§2.4③）
    } catch (error) { ctx.fail(error) }
  }

  const group = (titleKey, ...children) => h("section", { class: "config-group" }, h("h5", { text: t(titleKey) }), ...children)
  // A · 开放状态（列表 = 开放集；重新开放 = Provider 页勾选——提示在册）
  const groupA = group("admin.models.status",
    h("div", { class: "config-row" },
      h("span", { class: "config-status", text: t("admin.models.open") }),
      h("button", { type: "button", class: "tiny danger", text: t("admin.models.disable"), onclick: disable })),
    h("p", { class: "hint", text: t("admin.models.disableHint") }))
  // C · 限流（空 = 不限；保存即生效——机制全文 = gateway/API.md §6 KD-SV-35）
  const groupC = group("admin.models.rateTitle",
    h("div", { class: "config-grid" }, numericField("rpm"), numericField("tpm")),
    h("p", { class: "hint", text: t("admin.models.rateHint") }))
  // F · 配额（每人每月默认用量——空 = 不限；成员可在成员弹窗分模型覆盖——机制全文 = metering/METERING.md §2 KD-SV-38）
  const groupF = group("admin.models.quotaTitle",
    h("div", { class: "config-grid" }, numericField("quotaTokens")),
    h("p", { class: "hint", text: t("admin.models.quotaHint") }))
  // D · 展示元数据（规格快照查表——未知 ⇒「未收录」零兜底；手填「说明」≤200 字符）
  const spec = specForDisplay(row.upstream)
  const specText = (value) => (spec === null ? t("admin.models.notCollected") : ctx.fmtValue(value))
  const groupD = group("admin.models.metaTitle",
    h("dl", { class: "detail-grid" },
      h("dt", { text: t("admin.models.context") }), h("dd", { text: specText(spec?.context) }),
      h("dt", { text: t("admin.models.maxOutput") }), h("dd", { text: specText(spec?.maxOutput) }),
      h("dt", { text: t("admin.models.multimodal") }), h("dd", { text: specText(spec?.multimodal === true ? "✓" : null) })),
    h("p", { class: "hint", text: t("admin.models.metaHint") }),
    h("label", { class: "config-field" }, h("span", { text: t("admin.models.note") }), noteInput))
  // E · 成本权重（非负；空 = 未设；显式圈界 = 内部估算参考——非计费口径）
  const groupE = group("admin.models.weightTitle",
    h("div", { class: "config-grid" }, numericField("costIn"), numericField("costOut")),
    h("p", { class: "hint", text: t("admin.models.weightHint") }),
    h("p", { class: "hint", text: t("admin.models.weightNote") }))

  bodyBox.replaceChildren(details, h("h4", { text: t("admin.models.configTitle") }), groupA, groupC, groupF, groupD, groupE)
  footBox.replaceChildren(
    h("button", { type: "button", text: t("common.save"), onclick: save }),
    h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() })) // 取消 ∥ × ∥ ESC = 弃稿
  return modal
}
