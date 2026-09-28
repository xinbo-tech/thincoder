/**
 * settings-controls.mjs — 设置面两导出面（R7 · 桌面功能对位批 · 批档 §2 R7 #1；**先拆后改**：自
 * `renderer/views/settings.mjs` 拆出 —— 300 行层拆分，**零语义变化**）：`channelFormTree`（预设形 /
 * 自定形一表；`name` 属性 = 通道载荷键 ⇒ 提交端 `FormData` 直取）· `verifyControl`（渠道行 / 向导同一
 * 构造）· 共用叶 `fieldPair`（标词 + 输入两片）。
 * **单一 owner** —— 消费面 = 设置面渠道段体（经 `renderer/views/settings.mjs` 段体分派 `deps` 注入）
 * 与首启向导第二步（`renderer/views/onboarding.mjs`）；`settings.mjs` **同名 re-export** ⇒ 导出面零改。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`、零字形字面；缺 handlers ⇒ `wire` 落 `disabled: true`。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 字段两片（标词 + 输入）：`name` = 载荷键、`id` / `for` 同源。 */
function fieldPair(name, type, labelWord, extra = {}) {
  return [
    { tag: "label", props: { class: "settings-field-label", for: name }, children: [t(labelWord)] },
    { tag: "input", props: { class: "settings-field", id: name, name, type, ...extra } },
  ]
}

/** **导出面①** —— 渠道表单（纯构树）：`{ shape, presets, formats, activeDefault, submitKey }` +
 *  `handlers.onSubmit`（提交端读 `FormData`——本档零值搬运）。两形一表：`preset` / `custom`。 */
export function channelFormTree(form, handlers = {}) {
  const shape = form?.shape === "custom" ? "custom" : "preset"
  const presets = listOf(form?.presets).filter((p) => p && typeof p.name === "string")
  const formats = listOf(form?.formats).filter((f) => typeof f === "string" && f)
  const onSubmit = typeof handlers?.onSubmit === "function" ? handlers.onSubmit : undefined
  const children = [
    { tag: "input", props: { type: "hidden", name: "shape", value: shape } },
    { tag: "label", props: { class: "settings-field-label", for: "name" }, children: [t(shape === "custom" ? "settings.providers.nameLabel" : "settings.providers.presetLabel")] },
  ]
  if (shape === "custom") {
    children.push({ tag: "input", props: { class: "settings-field", id: "name", name: "name", type: "text" } })
    children.push(...fieldPair("baseURL", "text", "settings.providers.baseURLLabel"))
    children.push(...fieldPair("model", "text", "settings.providers.modelLabel"))
    children.push({ tag: "label", props: { class: "settings-field-label", for: "format" }, children: [t("settings.providers.formatLabel")] })
    children.push({
      tag: "select",
      props: { class: "settings-field", id: "format", name: "format" },
      children: formats.map((f) => ({ tag: "option", props: { value: f }, children: [f] })),
    })
  } else {
    children.push({
      tag: "select",
      props: { class: "settings-field", id: "name", name: "name" },
      children: presets.map((p) => ({ tag: "option", props: { value: p.name }, children: [p.name] })),
    })
  }
  children.push(...fieldPair("key", "password", "settings.providers.keyLabel"))
  children.push({ tag: "label", props: { class: "settings-field-label", for: "active" }, children: [t("settings.providers.activeToggle")] })
  children.push({
    tag: "input",
    props: { class: "settings-field", id: "active", name: "active", type: "checkbox", checked: form?.activeDefault === true ? true : undefined },
  })
  children.push({
    tag: "button",
    props: wire({
      class: "settings-submit",
      type: "button",
      "data-action": shape === "custom" ? "settings:addCustom" : "settings:addPreset",
    }, onSubmit),
    children: [t(form?.submitKey ?? (shape === "custom" ? "settings.providers.addCustom" : "settings.providers.addPreset"))],
  })
  return { tag: "form", props: { class: "settings-form", "data-form": shape, "data-form-shape": shape }, children }
}

/** **导出面②** —— 校验控件：`name` 给 ⇒ 携标（`data-name`）；缺 ⇒ 提交端自读表单现选。 */
export function verifyControl(name, handlers = {}) {
  const onClick = typeof handlers?.onVerify === "function" ? () => handlers.onVerify(name ?? null) : undefined
  return {
    tag: "button",
    props: wire({
      class: "settings-row-action",
      type: "button",
      "data-action": "settings:verify",
      "data-name": typeof name === "string" && name ? name : undefined,
    }, onClick),
    children: [t("settings.providers.verify")],
  }
}
