/**
 * settings-sections-models.mjs — 设置面「Consultation & Advisor」段体（R7 · 桌面功能对位批 · 批档 §2 R7 #1/#2：
 * models〔consult ∕ advisor 行〕；**先拆后改**：段体自立 —— 自 `renderer/views/settings-sections.mjs` 命名面出档）。
 *
 * 面形（源 = VSC `webview/settings-agent.js` `consultAdvisorCardHtml`（:35-72）· `settings-models.js`（行交互）：
 *  ① **consult 行族** —— 逐行 = 名（`provider · model`）+ effort `select`（选项 = 「—」+ 该模型 spec 枚举
 *     [`effortEnum`]；枚举空 ⇒ 零控件 —— VSC `effortSelectView` 同判）+ 移除钮；行数 ≤5（VSC 同上限）；
 *     行族上状态行（在场 / OFF 两词）；
 *  ② **添加入口**（KD-77 ②）—— 段尾「+ Add consult model」钮（锚 `settings:consultAddOpen`；行满 5 ⇒ `disabled`）
 *     + 弹窗体（`consultAddBody`）—— provider `select`（候选 = 已配渠道）+ model `select`（候选 = 现取 `model:list` 投影）
 *     + `Add consult model` 钮（两值齐 ∧ 行未满才可用）+ 取消；
 *  ③ **advisor 行** —— provider `select`（空项 = `Inherit`）+ model `select` + `Save` 钮（空 provider ⇒
 *     清两键回 Inherit；provider + model ⇒ 落两键；形不齐 ⇒ 零发送）。
 *  现值恒在场（禁吞）：model 候选取表外现值 ⇒ **自成一选项**（沿档位控件同律 —— 不吞 · 零改写）。
 * 三态：`none` / `loading` ⇒ 段态词承载（本档零节点）；`ready` ⇒ 上述面。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ⇒ 控件 `disabled`（诚实非死控）；
 * 零 `node:` ∕ 零裸包。
 * **添加入口弹窗统一批（2026-10-07 · 台账 #1054 · KD-77 ②）**：原内联增行表单退场——段尾添加入口钮 + 弹窗体
 * （导出面 +`consultAddBody`）；开 = `openSettingsModal("consultAdd")`（`resetFacets` 复位 `models.picker`）；成功 ⇒ 关框。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 行键（`provider:model` 复合 —— `data-consult` 锚用）。 */
const keyOf = (row) => `${row?.provider ?? ""}:${row?.model ?? ""}`

/** effort 选项集：占位项（值空 = 「—」语义 ⇒ 落键归一 `null`）+ 枚举逐项；现值 ∉ 枚举 ⇒ 占位选中（VSC 同律）。 */
function effortOptions(entry, value) {
  const levels = listOf(entry?.effortEnum)
  const selected = typeof value === "string" && levels.includes(value) ? value : ""
  const placeholder = selected === ""
    ? { tag: "option", props: { value: "", selected: true }, children: [t("settings.noneMark")] }
    : { tag: "option", props: { value: "" }, children: [t("settings.noneMark")] }
  return [placeholder, ...levels.map((level) => ({
    tag: "option",
    props: level === selected ? { value: level, selected: true } : { value: level },
    children: [level],
  }))]
}

/** consult 行：名 + effort 控件（枚举空 ⇒ 零控件）+ 移除钮（载荷 = 行两键 —— 出口按 provider+model 定位）。 */
function consultRowNode(row, handlers) {
  const onRemove = typeof handlers?.onConsultRemove === "function" ? () => handlers.onConsultRemove({ provider: row.provider, model: row.model }) : undefined
  const onEffort = typeof handlers?.onConsultEffort === "function"
    ? (event) => handlers.onConsultEffort({ provider: row.provider, model: row.model }, String(event?.target?.value ?? ""))
    : undefined
  const effort = listOf(row.effortEnum).length > 0
    ? selectNode({ class: "settings-field", "data-consult-effort": "", "aria-label": t("settings.effortLabel") }, effortOptions(row, row.effort), onEffort)
    : null
  return {
    tag: "div",
    props: { class: "settings-row", "data-consult": keyOf(row) },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [`${row.provider} · ${row.model}`] },
      effort,
      {
        tag: "button",
        props: wire({
          class: "settings-row-action",
          type: "button",
          "data-action": "settings:consultRemove",
          "data-provider": row.provider,
          "data-model": row.model,
          "aria-label": t("settings.consultRemove"),
        }, onRemove),
        children: [t("settings.consultRemove")],
      },
    ],
  }
}

/** 渠道选项集（`select` 通用）：`placeholder` 给 ⇒ 空值占位项在首（值选中判据 = 字面相等）。 */
function providerOptions(providers, value, placeholder) {
  const names = listOf(providers).filter((n) => typeof n === "string" && n !== "")
  const options = names.map((name) => ({ tag: "option", props: name === value ? { value: name, selected: true } : { value: name }, children: [name] }))
  options.unshift({
    tag: "option",
    props: value === "" ? { value: "", selected: true } : { value: "" },
    children: [placeholder],
  })
  return options
}

/** 模型选项集：候选行 `{ id }` 逐项 + 占位项；**现值恒在场**（表外现值 ⇒ 自成一选项 —— 不吞 · 零改写）。 */
function modelOptions(rows, value, placeholder) {
  const ids = listOf(rows).map((row) => row.id)
  const options = ids.map((id) => ({ tag: "option", props: id === value ? { value: id, selected: true } : { value: id }, children: [id] }))
  const current = typeof value === "string" && value !== "" ? value : null
  if (current !== null && !ids.includes(current)) {
    options.unshift({ tag: "option", props: { value: current, selected: true }, children: [current] })
  }
  options.unshift({
    tag: "option",
    props: current === null ? { value: "", selected: true } : { value: "" },
    children: [placeholder],
  })
  return options
}

/** 受控 select 节点（handler 缺 ⇒ `disabled`）。 */
function selectNode(props, options, handler) {
  return {
    tag: "select",
    props: typeof handler === "function" ? { ...props, onChange: handler } : { ...props, disabled: true },
    children: options,
  }
}

/** 会诊添加入口钮（KD-77 ②——段尾）：词 `settings.consultAdd`（既有）；`consult.length >= 5` ⇒ `disabled`
 *  （对齐「行未满才可用」）；缺 handler ⇒ `wire` 落 `disabled`（诚实非死控）。 */
function consultAddButton(consult, handlers) {
  const onOpen = consult.length >= 5 || typeof handlers?.onConsultAddOpen !== "function" ? undefined : () => handlers.onConsultAddOpen()
  return {
    tag: "button",
    props: wire({ class: "settings-submit", type: "button", "data-action": "settings:consultAddOpen" }, onOpen),
    children: [t("settings.consultAdd")],
  }
}

/** 会诊添加弹窗体（KD-77 ② —— `sectionBody("consultAdd")` 消费；载闸 = `ready` 归分派面）：两 select（选型面照现）
 *  + 提交（词 `settings.consultAdd`——两值齐 ∧ 行未满才可用）+ 取消（词 `settings.cancel`；锚 `settings:consultCancel`）；
 *  根件 = `form`（宿主 `data-initial-focus="field"` 取面：首控件 = provider select）。 */
export function consultAddBody(section, handlers = {}) {
  const consult = listOf(section?.consult)
  const providers = listOf(section?.providers)
  const picker = { provider: section?.picker?.provider ?? "", rows: listOf(section?.picker?.rows), model: section?.picker?.model ?? null }
  const onPickProvider = typeof handlers?.onConsultPickProvider === "function" ? (event) => handlers.onConsultPickProvider(String(event?.target?.value ?? "")) : undefined
  const onPickModel = typeof handlers?.onConsultPickModel === "function" ? (event) => handlers.onConsultPickModel(String(event?.target?.value ?? "")) : undefined
  const onAdd = picker.provider !== "" && picker.model !== null && consult.length < 5 && typeof handlers?.onConsultAdd === "function"
    ? () => handlers.onConsultAdd()
    : undefined
  const onCancel = typeof handlers?.onConsultCancel === "function" ? handlers.onConsultCancel : undefined
  return [{
    tag: "form",
    props: { class: "settings-form", "data-form": "consult", "data-field": "consult.add" },
    children: [
      selectNode({ class: "settings-field", "data-consult-pick": "provider", "aria-label": t("settings.consultProvider") }, providerOptions(providers, picker.provider, t("settings.pickProvider")), onPickProvider),
      selectNode({ class: "settings-field", "data-consult-pick": "model", "aria-label": t("settings.providers.modelLabel") }, modelOptions(picker.rows, picker.model, t("settings.pickModel")), onPickModel),
      { tag: "button", props: wire({ class: "settings-submit", type: "button", "data-action": "settings:consultAdd" }, onAdd), children: [t("settings.consultAdd")] },
      { tag: "button", props: wire({ class: "settings-submit", type: "button", "data-action": "settings:consultCancel" }, onCancel), children: [t("settings.cancel")] },
    ],
  }]
}

/** models 段体（KD-77 ②）：consult 行族 + advisor 行 + 段尾添加入口钮（原内联增行表单退场 ⇒ 弹窗体
 *  `consultAddBody`）；`section` = 面模型投影（渲染面零推导）。 */
export function modelsBody(section, handlers = {}) {
  const consult = listOf(section?.consult)
  const providers = listOf(section?.providers)
  const advisorPicker = { provider: section?.advisorPicker?.provider ?? "", rows: listOf(section?.advisorPicker?.rows), model: section?.advisorPicker?.model ?? null }
  const onAdvisorProvider = typeof handlers?.onAdvisorPickProvider === "function" ? (event) => handlers.onAdvisorPickProvider(String(event?.target?.value ?? "")) : undefined
  const onAdvisorModel = typeof handlers?.onAdvisorPickModel === "function" ? (event) => handlers.onAdvisorPickModel(String(event?.target?.value ?? "")) : undefined
  const onAdvisorSave = typeof handlers?.onAdvisorSave === "function" ? () => handlers.onAdvisorSave() : undefined
  return [
    { tag: "div", props: { class: "settings-field-label", "data-subtitle": "consult" }, children: [t("settings.consultSection")] },
    {
      tag: "div",
      props: { class: "settings-row", "data-consult-status": "" },
      children: [{
        tag: "span",
        props: { class: "settings-row-value" },
        children: [t(consult.length > 0 ? "settings.consultActive" : "settings.consultInactive", { n: consult.length })],
      }],
    },
    ...consult.map((row) => consultRowNode(row, handlers)),
    { tag: "div", props: { class: "settings-field-label", "data-subtitle": "advisor" }, children: [t("settings.advisorSection")] },
    {
      tag: "div",
      props: { class: "settings-row", "data-advisor": "" },
      children: [
        { tag: "span", props: { class: "settings-row-name" }, children: [t("settings.advisorProvider")] },
        selectNode({ class: "settings-field", "data-advisor-pick": "provider", "aria-label": t("settings.advisorProvider") }, providerOptions(providers, advisorPicker.provider, t("settings.inherit")), onAdvisorProvider),
        selectNode({ class: "settings-field", "data-advisor-pick": "model", "aria-label": t("settings.providers.modelLabel") }, modelOptions(advisorPicker.rows, advisorPicker.model, t("settings.pickModel")), onAdvisorModel),
        {
          tag: "button",
          props: wire({ class: "settings-row-action", type: "button", "data-action": "settings:advisorSave" }, onAdvisorSave),
          children: [t("settings.save")],
        },
      ],
    },
    consultAddButton(consult, handlers),
  ]
}
