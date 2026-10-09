/**
 * settings-controls.mjs — 设置面两导出面（R7 · 桌面功能对位批 · 批档 §2 R7 #1；**先拆后改**：自
 * `renderer/views/settings.mjs` 拆出 —— 300 行层拆分，**零语义变化**）：`channelFormTree`（渠道添加**单表**）、
 * `verifyControl`（渠道行 / 向导同一构造）· 共用叶 `fieldPair`（标词 + 输入两片）。
 * **B10 W2 增（S2 ∕ S7）**：渠道校验钮（原「拉取模型」——2026-10-09 清除批收窄为渠道校验）+ 状态行 + 表单暂存值
 * 回填（`form.draft` —— 探果写切片 ⇒ 树重挂 ⇒ 未落盘输入救回）；
 * 预设项标签 = `name — desc` 串形（`form.presets[].desc` 由主侧转发）。
 * **三端对齐批增（2026-10-07 · 台账 #1027–#1029 · KD-75 ③ —— 内容演进，名不换 ⇒ 调用面零改）**：
 * 单表节序 = 类型 `select[name="preset"]`（预设项 + 自定末项 `customChoice`）→ 预设信息行（`data-preset-info`）
 * → 条件块 A（名 ∥ baseURL ∥ 格式）→ key → 「走 proxy」复选 → 条件块 B（校验行——原拉取行 ∥ 模型；
 * **`model` 输入件 ∥ `datalist` 随 2026-10-09 清除批退场**）→ 提交 → 取消
 * （字段序 = 用户填写序：`preset→[info]→name→baseURL→format→key→proxy→[校验]`；源 = VSC `settings-provider-dialog.js` 逐元素对齐）。
 * **形状唯一源 = `form.shape`**（消费面 = `providers.addShape` 切片：预设名 ∥ `"custom"` ∥ 缺省 `"preset"` ——
 * 选中项按名命中、未命中回首项）；类型切换 = 出口写切片 ⇒ 重绘（第二闸复填在编输入——草稿作用域单骨
 * `add:provider` 跨形恒同 ⇒ 跨形切换键值保真）。
 * **弹窗体三件随出口在场渲染**（类型切换 ∥ 预设信息行 ∥ 取消钮 —— 随 `handlers.onAddShape` ∥ `handlers.onCloseModal`；
 * 向导步 1 不携两 handler ⇒ 保持预设单选语义，零死控）。
 * **单一 owner** —— 消费面 = 渠道添加弹窗体（`renderer/views/settings-sections-providers.mjs` `providerAddBody`）
 * 与首启向导第二步（`renderer/views/onboarding.mjs`）；`settings.mjs` **同名 re-export** ⇒ 导出面零改。
 * **#604 增草稿申报标记**：表单可输入控件携 `data-draft`（总闸捕获域 —— 键取 `id`；值 = 空串）——
 * 组四 = `fieldPair`（`baseURL` ∥ `key`）× 两形 ∥ 自定形 `name` 文本 ∥ 两 `select`（类型 `preset` ∕ 自定形 `format`）
 * ∥ `proxy` 复选（2026-10-09 清除批：`model` 输入件退场；fix 轮：激活渠 `active` 复选退场）。
 * **#652 增草稿作用域**：表单携 `data-draft-scope`（单骨 `add:provider` —— 写成功径失效声明自读本值；
 * 跨形切换键不换骨 ⇒ 在编输入随重绘复填）。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`、零字形字面；缺 handlers ⇒ `wire` 落 `disabled: true`。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

const CUSTOM_CHOICE = "custom"

/** 字段两片（标词 + 输入）：`name` = 载荷键、`id` / `for` 同源。
 *  `data-draft` = **草稿申报标记**（#604 总闸捕获域 —— 值 = 空串；键取 `id`：`name` / `baseURL` / `key`）。 */
function fieldPair(name, type, labelWord, extra = {}) {
  return [
    { tag: "label", props: { class: "settings-field-label", for: name }, children: [t(labelWord)] },
    { tag: "input", props: { class: "settings-field", id: name, name, type, "data-draft": "", ...extra } },
  ]
}

/** 预设项标签（S7 · 串形对位 VSC `settings-providers.js:204` —— `name — desc`）：缺段不落空后缀
 *  （禁假造；`(model)` 段随 2026-10-09 清除批退场——核表零该键）。 */
export function presetLabel(preset) {
  const name = typeof preset?.name === "string" ? preset.name : ""
  const desc = typeof preset?.desc === "string" && preset.desc !== "" ? ` — ${preset.desc}` : ""
  return `${name}${desc}`
}

/** 预设信息串（KD-75 ③）：`baseURL` —— 缺段不落空分隔符（D37 口径）；空 ⇒ `null`（零节点——禁假造）。
 *  **2026-10-09 清除批**：原 `model · baseURL` 两段式收为单段（渠道单值模型退场）。 */
function presetInfoWord(preset) {
  return typeof preset?.baseURL === "string" && preset.baseURL !== "" ? preset.baseURL : null
}

/** 渠道校验行（S2 收窄 · 2026-10-09 清除批）：钮 + 状态行（`probe` = 段面已出词三态：探期 ∕ 探通（携计数）∥ 探不通；缺 ⇒ 零节点）。 */
function fetchRowNode(probe, onFetch) {
  const state = typeof probe?.state === "string" ? probe.state : null
  const word = typeof probe?.word === "string" ? probe.word : ""
  return {
    tag: "div",
    props: { class: "settings-field-row", "data-fetch-models": "" },
    children: [
      { tag: "button", props: wire({ class: "settings-submit", type: "button", "data-action": "settings:fetchModels" }, onFetch), children: [t("settings.fetchModels")] },
      word === "" ? null : { tag: "span", props: { class: "settings-verify", "data-probe": state }, children: [word] },
    ],
  }
}

/** **导出面①** —— 渠道添加单表（纯构树）：`{ shape, presets, formats, submitKey }` +
 *  `handlers.onSubmit`（提交端读 `FormData`——本档零值搬运）。
 *  `shape` = 类型选择现值（预设名 ∥ `"custom"`；表外 ∥ 缺 ⇒ 预设形 + 首项选中）；条件块 A ∕ B 随形。
 *  **fix 轮（2026-10-09 清除批）**：激活渠 `active` 复选 ∥ 其条件参随同退场（无 active 写路 ⇒ 死控净删；向导 ∥ 弹窗全径零节点）。 */
export function channelFormTree(form, handlers = {}) {
  const shape = form?.shape === CUSTOM_CHOICE ? CUSTOM_CHOICE : "preset"
  const presets = listOf(form?.presets).filter((p) => p && typeof p.name === "string")
  const formats = listOf(form?.formats).filter((f) => typeof f === "string" && f)
  const onSubmit = typeof handlers?.onSubmit === "function" ? handlers.onSubmit : undefined
  const onFetch = typeof handlers?.onFetchModels === "function" ? handlers.onFetchModels : undefined
  /** 弹窗体三件（类型切换接线 ∥ 预设信息行 ∥ 自定末项）随 `onAddShape` 在场；取消钮随 `onCloseModal` 在场
   *  （向导步 1 不携两 handler ⇒ 预设单选语义保持——KD-75 ② 弹窗件不外溢）。 */
  const onShape = typeof handlers?.onAddShape === "function" ? handlers.onAddShape : null
  const onCancel = typeof handlers?.onCloseModal === "function" ? handlers.onCloseModal : undefined
  // 选中项归一：自定形 ⇒ 无预设选中（`custom` 末项独占 `selected` —— 免双 `selected` 竞位）；预设形 ⇒ 按名命中 ∥ 首项。
  const selected = shape === CUSTOM_CHOICE ? null : presets.find((p) => p.name === form?.shape) ?? presets[0] ?? null
  // 暂存值回填（S2 —— 仅自定形；`draft` 缺 ⇒ 全空，零行为改）：探果写切片 ⇒ 树重挂 ⇒ 未落盘输入救回。
  const draft = shape === "custom" && form?.draft !== null && typeof form?.draft === "object" ? form.draft : null
  const seed = (key) => (draft !== null && typeof draft[key] === "string" && draft[key] !== "" ? { value: draft[key] } : {})
  const children = [{ tag: "input", props: { type: "hidden", name: "shape", value: shape } }]

  // ① 类型选择（`select[name="preset"]`）：预设项 + 自定末项；切换出口 = `onAddShape`（写 `providers.addShape` ⇒ 重绘）。
  children.push({ tag: "label", props: { class: "settings-field-label", for: "preset" }, children: [t("settings.providers.presetLabel")] })
  const options = presets.map((p) => ({
    tag: "option",
    props: p.name === selected?.name ? { value: p.name, selected: true } : { value: p.name },
    children: [presetLabel(p)],
  }))
  if (onShape !== null) {
    options.push({
      tag: "option",
      props: shape === CUSTOM_CHOICE ? { value: CUSTOM_CHOICE, selected: true } : { value: CUSTOM_CHOICE },
      children: [t("settings.providers.customChoice")],
    })
  }
  const selectProps = { class: "settings-field", id: "preset", name: "preset", "data-draft": "" }
  if (onShape !== null) selectProps.onChange = (event) => onShape(event?.target?.value)
  children.push({ tag: "select", props: selectProps, children: options })

  // ② 预设信息行（仅预设形 ∥ 有选中项内容）：`baseURL`（缺段不落空分隔符；`model` 段随 2026-10-09 清除批退场）。
  if (onShape !== null && shape !== CUSTOM_CHOICE && selected !== null) {
    const info = presetInfoWord(selected)
    if (info !== null) children.push({ tag: "div", props: { class: "settings-row-value", "data-preset-info": "" }, children: [info] })
  }

  // ③ 条件块 A（自定形）= 名称 → baseURL → 格式。
  if (shape === CUSTOM_CHOICE) {
    children.push({ tag: "label", props: { class: "settings-field-label", for: "name" }, children: [t("settings.providers.nameLabel")] })
    children.push({ tag: "input", props: { class: "settings-field", id: "name", name: "name", type: "text", "data-draft": "", ...seed("name") } })
    children.push(...fieldPair("baseURL", "text", "settings.providers.baseURLLabel", seed("baseURL")))
    children.push({ tag: "label", props: { class: "settings-field-label", for: "format" }, children: [t("settings.providers.formatLabel")] })
    children.push({
      tag: "select",
      props: { class: "settings-field", id: "format", name: "format", "data-draft": "" },
      children: formats.map((f) => ({ tag: "option", props: draft?.format === f ? { value: f, selected: true } : { value: f }, children: [f] })),
    })
  }

  // ④ API Key（词值随 #1035「API Key」形）；⑤ 走 proxy（拨杆形 —— D37；词 ∥ title 同键复用）。
  children.push(...fieldPair("key", "password", "settings.providers.keyLabel", seed("key")))
  children.push({
    tag: "label",
    props: { class: "settings-field-label", title: t("settings.proxyRowTitle") },
    children: [
      { tag: "input", props: { class: "settings-field", type: "checkbox", name: "proxy", "data-draft": "proxy" } },
      t("settings.proxyRow"),
    ],
  })

  // ⑥ 条件块 B（自定形）= 渠道校验行（暂存值直探，不落盘；`model` 输入件 ∥ 候选 `datalist` 随 2026-10-09 清除批退场）。
  if (shape === CUSTOM_CHOICE) {
    if (onFetch !== undefined) children.push(fetchRowNode(form?.probe, onFetch))
  }

  // ⑦ 提交（词 = `settings.save`——KD-75 ③；锚名按形不碎）+ ⑧ 取消（弹窗体件——`settings:modalClose` 关径）。
  children.push({
    tag: "button",
    props: wire({
      class: "settings-submit",
      type: "button",
      "data-action": shape === CUSTOM_CHOICE ? "settings:addCustom" : "settings:addPreset",
    }, onSubmit),
    children: [t(form?.submitKey ?? "settings.save")],
  })
  if (onCancel !== undefined) {
    children.push({
      tag: "button",
      props: wire({ class: "settings-submit", type: "button", "data-action": "settings:modalClose" }, onCancel),
      children: [t("settings.cancel")],
    })
  }
  // #652 草稿作用域（表单身份面——单骨 `add:provider`：跨形切换键不换骨 ⇒ 第二闸复填达；写成功径失效声明自读本值）。
  return { tag: "form", props: { class: "settings-form", "data-form": shape, "data-form-shape": shape, "data-draft-scope": "add:provider" }, children }
}

/** **导出面②** —— 校验控件：`name` 给 ⇒ 携标（`data-name`）；缺 ⇒ 提交端自读表单现选。
 *  **state**（null ∥ `"ok"` ∥ `"fail"`——轮六）：渠行给 ⇒ 态词换形（「校验通过」∕「校验失败」短形 + `data-verify-state` 锚），
 *  缺 ∥ null ⇒ 原「校验」词（首启向导径零变）。 */
export function verifyControl(name, handlers = {}, state = null) {
  const onClick = typeof handlers?.onVerify === "function" ? () => handlers.onVerify(name ?? null) : undefined
  const word = state === "ok"
    ? t("settings.providers.verify.okShort")
    : state === "fail"
      ? t("settings.providers.verify.failShort")
      : t("settings.providers.verify")
  return {
    tag: "button",
    props: wire({
      class: "settings-row-action",
      type: "button",
      "data-action": "settings:verify",
      "data-name": typeof name === "string" && name ? name : undefined,
      "data-verify-state": state === "ok" || state === "fail" ? state : undefined,
    }, onClick),
    children: [word],
  }
}
