/**
 * settings.mjs — 设置面 + 两导出面（批 9 · 批档 §2.12–§2.14；设计单源 = `docs/desktop/design/UI.md` §1 设置面行）。
 * 面形 = 四段（`data-section` = `providers` / `model` / `agent` / `mcp`）各三态（`data-state` = `none` / `loading` /
 * `ready`）：`none` / `loading` ⇒ 词表提示、`ready` ⇒ 行内容；表单在 `loading` 外常在；失败面 = `notice` 节点
 * （**核错误串直传** —— `REASON_WORD` 表内码出词、表外原样，不吞、不自造码）；面头 = 标题 + 语言控件
 * （**锚名逐字** `settings:lang`，在关闭控件**左侧** —— 点按经 `config:write(locale)` 同回带重刷词面）+ 关闭锚
 * `settings:close`（**零 Esc 绑定**）。
 * **两导出面（单一 owner —— 首启向导复用，零副本，批档 §2.3）**：`channelFormTree`（预设形 / 自定形一表；
 * `name` 属性 = 通道载荷键 ⇒ 提交端 `FormData` 直取）· `verifyControl`（渠道行 / 向导同一构造）——四段体经
 * `deps` 注入取用。兄弟档：四段体 = `renderer/views/settings-sections.mjs`（300 行层拆分）；项目级信息行 =
 * `renderer/views/info-row.mjs`（本档 `reasonWord` 供其失败面出词）。**共用面 `syncHostProps`** = 宿主属性面复位表
 * （薄挂载属性应收单源 —— 向导 / 信息行两档同取，零副本；判据 = `docs/desktop/design/RENDERER.md` §1 退场口径 · 属性面）。
 * 纪律：零 DOM（构造点 = `dom.mjs` `build`）；
 * 文案一律经 `t()`、零字形字面（字形住 `renderer/settings.css` content）；缺 handlers ⇒ `wire` 落 `disabled: true`。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"
import { agentBody, mcpBody, modelBody, modelIdOf, providersBody, tierFace } from "./settings-sections.mjs"

/** 段闭集（序固定 = 渠道 → 模型与档位 → agent 参数 → MCP）：名（`data-section`）+ 词键单源。 */
export const SECTIONS = Object.freeze([
  { name: "providers", word: "settings.section.providers" },
  { name: "model", word: "settings.section.model" },
  { name: "agent", word: "settings.section.agent" },
  { name: "mcp", word: "settings.section.mcp" },
])

/** 段态出词闭集（两态：`none` / `loading`）；`ready` ⇒ 行内容（零状态词）。 */
export const STATE_WORD = Object.freeze({
  none: "settings.state.none",
  loading: "settings.state.loading",
})

/** 失败面词表（码 → 词键）：**表内出词、表外原样直传**（核错误串不吞、端侧不造码）。 */
export const REASON_WORD = Object.freeze({
  "mtime-conflict": "settings.reason.mtimeConflict",
  "invalid-shape": "settings.reason.invalidShape",
  "invalid-key": "settings.reason.invalidKey",
  "invalid-value": "settings.reason.invalidValue",
  "invalid-patch": "settings.reason.invalidPatch",
  "no-project": "settings.reason.noProject",
  missing: "settings.reason.missing",
  invalid: "settings.reason.invalidManifest",
  unavailable: "settings.reason.unavailable",
  timeout: "settings.reason.timeout",
  malformed: "settings.reason.malformed",
  "probe-failed": "settings.reason.probeFailed",
})

/** 段名闭集（notice `scope` 判据；`panel` = 面板级失败 —— 不出段标）：由 `SECTIONS` 派生（词键单源）。 */
const SCOPE_WORD = Object.freeze(Object.fromEntries(SECTIONS.map((s) => [s.name, s.word])))

/** 自定形协议域（闭集三协议 —— 与主侧形判同域）。 */
export const FORMATS = Object.freeze(["openai", "anthropic", "google"])

/** 语言控件**目标语**（当前语 ⇒ 另一语 —— 两键闭集，零字形字面）：点按后落语 = `target`。 */
const LANG_TARGET = Object.freeze({ en: "zh", zh: "en" })

/** 语言面读数（当前语 ⇒ 另一语；表外 / 缺 ⇒ 默语对 —— 不猜）。 */
function langOf(state) {
  const current = Object.hasOwn(LANG_TARGET, state?.locale) ? state.locale : "en"
  return { current, target: LANG_TARGET[current] }
}

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 码 → 词：表内出词；表外（含核错误串）原样直传；缺 / 空 ⇒ `null`（零节点）。 */
export function reasonWord(code) {
  if (code === null || code === undefined || code === "") return null
  const key = Object.hasOwn(REASON_WORD, code) ? REASON_WORD[code] : null
  return key === null ? String(code) : t(key)
}

/** 段态归一（闭集三态；表外 / 缺 ⇒ `none` —— 不猜）。 */
function stateOf(section) {
  const raw = section?.state
  return raw === "loading" || raw === "ready" ? raw : "none"
}

/** 面模型（纯 · 零 DOM）：开合 + 失败面 + 四段（各段现态直读 —— 渲染面零推导）。 */
export function settingsModel(state) {
  const settings = state?.settings ?? {}
  const notice = settings.notice !== null && typeof settings.notice === "object" ? settings.notice : null
  const scope = notice !== null && Object.hasOwn(SCOPE_WORD, notice.scope) ? notice.scope : "panel"
  return {
    open: settings.open === true,
    lang: langOf(state),
    notice: notice === null ? null : { scope, text: reasonWord(notice.reason) },
    providers: {
      state: stateOf(settings.providers),
      presets: listOf(settings.providers?.presets).filter((p) => p && typeof p.name === "string"),
      rows: listOf(settings.providers?.providers).filter((p) => p && typeof p.name === "string"),
      verify: settings.verify !== null && typeof settings.verify === "object" ? settings.verify : null,
    },
    model: {
      state: stateOf(settings.model),
      provider: typeof settings.model?.provider === "string" ? settings.model.provider : null,
      current: typeof settings.model?.current === "string" ? settings.model.current : null,
      models: listOf(settings.model?.models).map(modelIdOf).filter((id) => id !== null),
      tier: tierFace(settings),
    },
    agent: {
      state: stateOf(settings.agent),
      fields: listOf(settings.agent?.fields).filter((f) => f && typeof f.path === "string"),
    },
    mcp: {
      state: stateOf(settings.mcp),
      servers: listOf(settings.mcp?.servers).filter((s) => s && typeof s.name === "string"),
    },
  }
}

/** 段壳（`data-section` + 三态 `data-state`）：标题 + 体内节点。 */
function sectionNode(section, body) {
  return {
    tag: "section",
    props: { class: "settings-section", "data-section": section.name, "data-state": section.state },
    children: [
      { tag: "h3", props: { class: "settings-section-title" }, children: [t(section.word)] },
      { tag: "div", props: { class: "settings-section-body" }, children: body },
    ],
  }
}

/** 段三态提示（`none` / `loading` ⇒ 词表提示；`ready` ⇒ 零节点）。 */
function sectionStateNode(state) {
  if (!Object.hasOwn(STATE_WORD, state)) return null
  return { tag: "div", props: { class: "settings-section-state", "data-state-word": "" }, children: [t(STATE_WORD[state])] }
}

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

/** 段体分派（四段各一形；段名闭集 —— 表外段零节点）：四段体住 `settings-sections.mjs`，
 *  本档经 `deps` 注入两导出面 + 词表（单一 owner —— 零副本）。 */
function sectionBody(name, model, handlers) {
  const deps = { channelForm: channelFormTree, verifyControl, reasonWord, formats: FORMATS }
  if (name === "providers") return [sectionStateNode(model.providers.state), ...providersBody(model.providers, handlers, deps)]
  if (name === "model") return [sectionStateNode(model.model.state), ...modelBody(model.model, handlers)]
  if (name === "agent") {
    return [sectionStateNode(model.agent.state), ...(model.agent.state === "loading" ? [] : agentBody(model.agent, handlers))]
  }
  return [sectionStateNode(model.mcp.state), ...mcpBody(model.mcp, handlers)]
}

/** 失败面节点（核错误串直传）：段标（面板级 ⇒ 零段标）+ 串。 */
function noticeNode(notice) {
  if (notice === null || notice.text === null) return null
  const scope = notice.scope !== "panel"
    ? { tag: "span", props: { class: "settings-notice-scope" }, children: [t(SCOPE_WORD[notice.scope])] }
    : null
  return {
    tag: "div",
    props: { class: "settings-notice", "data-notice": "", "data-scope": notice.scope },
    children: [scope, { tag: "span", props: { class: "settings-notice-text" }, children: [notice.text] }],
  }
}

/** 面头：标题 + 语言控件（**锚名逐字** `settings:lang` —— 在关闭控件**左侧**）+ 关闭控件
 *  （**锚名逐字** `settings:close`；字形住 `settings.css` content）。 */
function headNode(model, handlers) {
  const lang = model?.lang ?? langOf(null)
  const onLang = typeof handlers?.onToggleLang === "function" ? () => handlers.onToggleLang(lang.target) : undefined
  const onClose = typeof handlers?.onCloseSettings === "function" ? handlers.onCloseSettings : undefined
  return {
    tag: "header",
    props: { class: "settings-head" },
    children: [
      { tag: "h2", props: { class: "settings-title" }, children: [t("settings.title")] },
      {
        tag: "button",
        props: wire({
          class: "settings-lang",
          type: "button",
          "data-action": "settings:lang",
          "data-lang": lang.target,
        }, onLang),
        children: [t(`settings.lang.${lang.target}`)],
      },
      {
        tag: "button",
        props: wire({
          class: "settings-close",
          type: "button",
          "data-action": "settings:close",
          "aria-label": t("settings.close"),
        }, onClose),
        children: [],
      },
    ],
  }
}

/** 面树（纯构树 · 零 DOM）：`open` 假 ⇒ 零子节点（退场 = 容器清空 —— 非 `hidden`）。 */
export function settingsTree(model, handlers = {}) {
  const open = model?.open === true
  const children = open
    ? [headNode(model, handlers), noticeNode(model.notice), ...SECTIONS.map((s) => sectionNode(
      { ...s, state: model[s.name].state }, sectionBody(s.name, model, handlers),
    ))]
    : []
  return { tag: "div", props: { "data-settings": "", "data-state": open ? "open" : "closed", class: "settings" }, children }
}

/** 宿主属性面复位表（`root` → 上次薄挂载所落属性名集）：**不入 DOM 属性面**（弱引用 —— 宿主离场随收）。 */
const hostProps = new WeakMap()

/** 薄挂载属性面（**单源** —— `views/onboarding.mjs` / `views/info-row.mjs` 两挂载共用本表）：本次树声明的属性落宿主，
 *  **上次所落而本次未再声明的摘除**（退场 / 换树 ⇒ 前任所加属性零残留 · 骨架属性不入表 ⇒ 零摘除）；判据 =
 *  「退场后宿主属性集 ⊆ 挂载前属性集」（只增不减 ⇒ 判据不达 · `docs/desktop/design/RENDERER.md` §1 退场口径 · 属性面）。 */
export function syncHostProps(root, tree) {
  const next = new Set(tree.getAttributeNames())
  // 摘除走可选调用（宿主仅实现 `setAttribute` 的降级面不抛 —— 守「容器缺位 ⇒ 空转」；沿 `views/chat.mjs` 属性摘除先例）。
  for (const name of hostProps.get(root) ?? []) if (!next.has(name)) root.removeAttribute?.(name)
  for (const name of next) root.setAttribute(name, tree.getAttribute(name))
  hostProps.set(root, next)
}

/** 薄挂载：props 应收进宿主（`syncHostProps` —— `data-slot` 等骨架属性保留 + 前任所加属性摘除）+ `clear` + `append`；容器缺位 ⇒ 空转。 */
export function mountSettings(root, state, handlers = {}) {
  const model = settingsModel(state)
  if (!root || typeof root.setAttribute !== "function") return model
  const tree = build(settingsTree(model, handlers))
  syncHostProps(root, tree)
  clear(root)
  for (const child of [...tree.childNodes]) root.append(child)
  return model
}
