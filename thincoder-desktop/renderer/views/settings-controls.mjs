/**
 * settings-controls.mjs — 设置面两导出面（R7 · 桌面功能对位批 · 批档 §2 R7 #1；**先拆后改**：自
 * `renderer/views/settings.mjs` 拆出 —— 300 行层拆分，**零语义变化**）：`channelFormTree`（预设形 /
 * 自定形一表；`name` 属性 = 通道载荷键 ⇒ 提交端 `FormData` 直取）· `verifyControl`（渠道行 / 向导同一
 * 构造）· 共用叶 `fieldPair`（标词 + 输入两片）。
 * **B10 W2 增（S2 ∕ S7）**：自定形「拉取模型」钮 + 状态行 + `datalist` 候选面（探不通 ⇒ 失败词；
 * **手输不受限** —— 零阻断保存）+ 表单暂存值回填（`form.draft` —— 探果写切片 ⇒ 树重挂 ⇒ 未落盘输入救回）；
 * 预设项标签 = `name — desc (model)` 串形（`form.presets[].desc` 由主侧转发）。
 * **单一 owner** —— 消费面 = 设置面渠道段体（经 `renderer/views/settings.mjs` 段体分派 `deps` 注入）
 * 与首启向导第二步（`renderer/views/onboarding.mjs`）；`settings.mjs` **同名 re-export** ⇒ 导出面零改。
 * **#604 增草稿申报标记**：表单可输入控件携 `data-draft`（总闸捕获域 —— 键取 `id`；值 = 空串）——
 * 组四 = `fieldPair`（`baseURL` ∕ `model` ∕ `key`）× 两形 ∥ 自定形 `name` 文本 ∥ 两 `select`（预设 `name` ∕ 自定形 `format`）∥ `active` 复选。
 * **#652 增草稿作用域**：表单携 `data-draft-scope`（两形各一骨 = `add:preset` ∕ `add:custom`）—— 写成功径失效声明自读本值
 * （提交一击只废本形草稿；跨形 ∕ 他表单草稿零误伤）。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`、零字形字面；缺 handlers ⇒ `wire` 落 `disabled: true`。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 候选面 `datalist` id（面板内唯一 —— 自定形单表单；`input[list=…]` 引用点同锚）。 */
const MODEL_CANDIDATE_LIST_ID = "settings-model-candidates"

/** 字段两片（标词 + 输入）：`name` = 载荷键、`id` / `for` 同源。
 *  `data-draft` = **草稿申报标记**（#604 总闸捕获域 —— 值 = 空串；键取 `id`：`baseURL` ∕ `model` ∕ `key`）。 */
function fieldPair(name, type, labelWord, extra = {}) {
  return [
    { tag: "label", props: { class: "settings-field-label", for: name }, children: [t(labelWord)] },
    { tag: "input", props: { class: "settings-field", id: name, name, type, "data-draft": "", ...extra } },
  ]
}

/** 预设项标签（S7 · 串形对位 VSC `settings-providers.js:204` —— `name — desc (model)`）：缺段不落空括号
 *  （禁假造 —— 注记：VSC 空 model 落 `()`；本端不落，有效段集下两形逐字同）。 */
export function presetLabel(preset) {
  const name = typeof preset?.name === "string" ? preset.name : ""
  const desc = typeof preset?.desc === "string" && preset.desc !== "" ? ` — ${preset.desc}` : ""
  const model = typeof preset?.model === "string" && preset.model !== "" ? ` (${preset.model})` : ""
  return `${name}${desc}${model}`
}

/** 模型候选 `datalist`（S2）：拉取所得逐项（`input[list]` 下拉建议 —— **手输不受限**，零阻断保存）。 */
function candidateListNode(candidates) {
  return {
    tag: "datalist",
    props: { id: MODEL_CANDIDATE_LIST_ID },
    children: candidates.map((name) => ({ tag: "option", props: { value: name }, children: [] })),
  }
}

/** 拉取模型行（S2）：钮 + 状态行（`probe` = 段面已出词三态：探期 ∕ 探通（携计数）∥ 探不通；缺 ⇒ 零节点）。 */
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

/** **导出面①** —— 渠道表单（纯构树）：`{ shape, presets, formats, activeDefault, submitKey }` +
 *  `handlers.onSubmit`（提交端读 `FormData`——本档零值搬运）。两形一表：`preset` / `custom`。 */
export function channelFormTree(form, handlers = {}) {
  const shape = form?.shape === "custom" ? "custom" : "preset"
  const presets = listOf(form?.presets).filter((p) => p && typeof p.name === "string")
  const formats = listOf(form?.formats).filter((f) => typeof f === "string" && f)
  const onSubmit = typeof handlers?.onSubmit === "function" ? handlers.onSubmit : undefined
  const onFetch = typeof handlers?.onFetchModels === "function" ? handlers.onFetchModels : undefined
  const children = [
    { tag: "input", props: { type: "hidden", name: "shape", value: shape } },
    { tag: "label", props: { class: "settings-field-label", for: "name" }, children: [t(shape === "custom" ? "settings.providers.nameLabel" : "settings.providers.presetLabel")] },
  ]
  // 暂存值回填（S2 —— 仅自定形；`draft` 缺 ⇒ 全空，零行为改）：探果写切片 ⇒ 树重挂 ⇒ 未落盘输入救回。
  const draft = shape === "custom" && form?.draft !== null && typeof form?.draft === "object" ? form.draft : null
  const seed = (key) => (draft !== null && typeof draft[key] === "string" && draft[key] !== "" ? { value: draft[key] } : {})
  const candidates = shape === "custom" ? listOf(form?.modelCandidates).filter((m) => typeof m === "string" && m !== "") : []
  if (shape === "custom") {
    // 自定形名文本（非经 `fieldPair` 建 —— 单独申报；`id` 键 = `name`）。
    children.push({ tag: "input", props: { class: "settings-field", id: "name", name: "name", type: "text", "data-draft": "", ...seed("name") } })
    children.push(...fieldPair("baseURL", "text", "settings.providers.baseURLLabel", seed("baseURL")))
    if (onFetch !== undefined) children.push(fetchRowNode(form?.probe, onFetch)) // S2：拉取模型（暂存值直探，不落盘）
    children.push(...fieldPair("model", "text", "settings.providers.modelLabel", {
      ...seed("model"), ...(candidates.length > 0 ? { list: MODEL_CANDIDATE_LIST_ID } : {}),
    }))
    if (candidates.length > 0) children.push(candidateListNode(candidates))
    children.push({ tag: "label", props: { class: "settings-field-label", for: "format" }, children: [t("settings.providers.formatLabel")] })
    children.push({
      tag: "select",
      props: { class: "settings-field", id: "format", name: "format", "data-draft": "" },
      children: formats.map((f) => ({ tag: "option", props: draft?.format === f ? { value: f, selected: true } : { value: f }, children: [f] })),
    })
  } else {
    children.push({
      tag: "select",
      props: { class: "settings-field", id: "name", name: "name", "data-draft": "" },
      children: presets.map((p) => ({ tag: "option", props: { value: p.name }, children: [presetLabel(p)] })),
    })
  }
  children.push(...fieldPair("key", "password", "settings.providers.keyLabel", seed("key")))
  children.push({ tag: "label", props: { class: "settings-field-label", for: "active" }, children: [t("settings.providers.activeToggle")] })
  children.push({
    tag: "input",
    props: { class: "settings-field", id: "active", name: "active", type: "checkbox", "data-draft": "", checked: form?.activeDefault === true ? true : undefined },
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
  // #652 草稿作用域（表单身份面；两形各一骨 —— 写成功径失效声明自读本值，提交一击只废本形草稿）。
  return { tag: "form", props: { class: "settings-form", "data-form": shape, "data-form-shape": shape, "data-draft-scope": shape === "custom" ? "add:custom" : "add:preset" }, children }
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
