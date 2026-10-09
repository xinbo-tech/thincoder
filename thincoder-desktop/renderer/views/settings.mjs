/**
 * settings.mjs — 设置面 + 两导出面（批 9 · 批档 §2.12–§2.14；设计单源 = `docs/desktop/design/UI.md` §1 设置面行）。
 * 面形 = **七段**（`data-section` = `providers` / `model` / `agent` / `mcp` / `env`〔R7 增：proxy + shell〕/
 * `tools`〔R2 增：embedding ∕ websearch ∕ 索引状态〕/ `models`〔R7 增：consult ∕ advisor 行〕）
 * 各三态（`data-state` = `none` / `loading` /
 * `ready`）：`none` / `loading` ⇒ 词表提示、`ready` ⇒ 行内容；表单在 `loading` 外常在；失败面 = `notice` 节点
 * （**核错误串直传** —— `REASON_WORD` 表内码出词、表外原样，不吞、不自造码）；面头 = 标题 + **主题三态钮族**
 * （D33 · 台账 #743：锚 `settings:theme` + `data-theme` 目标值 —— 居语言控件左侧）+ 语言控件
 * （**锚名逐字** `settings:lang`，在关闭控件**左侧** —— 点按经 `config:write(locale)` 同回带重刷词面）+ 关闭锚
 * `settings:close`（**零 Esc 绑定** —— Esc 关闭归出口族 `document` 键面）。
 * **两导出面（单一 owner —— 首启向导复用，零副本，批档 §2.3）**：`channelFormTree` ∕ `verifyControl`——
 * **R7 先拆后改**：随 `fieldPair` 出档 `renderer/views/settings-controls.mjs`（本档同名 re-export ⇒ 导出面零改）；
 * 段体经 `deps` 注入取用。兄弟档：段体 = `renderer/views/settings-sections.mjs`（300 行层拆分 ——
 * 渠道 / 模型 / MCP 三形；agent 段 = `-agent.mjs`；tools 段 = `-tools.mjs`；env 段 = `-env.mjs`；
 * models 段 = `-models.mjs`——后两者 R7 增，前两者本档 re-export 面零改）。**共用面 `syncHostProps`** = 宿主属性面复位表
 * （薄挂载属性应收单源 —— 向导档取用，零副本；判据 = `docs/desktop/design/RENDERER.md` §1 退场口径 · 属性面）。
 * 纪律：零 DOM（构造点 = `dom.mjs` `build`）；
 * 文案一律经 `t()`、零字形字面（字形住 `renderer/settings.css` content）；缺 handlers ⇒ `wire` 落 `disabled: true`。
 * **D39（设置菜单升级批 · #817）增**：`settingsModalTree`（单组弹窗树——复用档内私有 `noticeNode` ∥ `sectionStateNode`
 * ∥ `sectionBody`，零第二实现；宿主 = `renderer/settings-modal.mjs`；决策单源 = `docs/desktop/design/SETTINGS.md` §1 **KD-68**）。
 * **三端对齐批增（2026-10-07 · 台账 #1027–#1028 · KD-75 ①②）**：`ADD_MODAL_GROUP`（`providerAdd`——弹窗面第八值，
 * 名单源于此，`SCOPES` ∥ `MODAL_READS` ∥ 开径出口三面同领）+ `settingsModalTree` 添加支：标题词
 * `settings.addProviderTitle`、体 = 失败串（scope = `providers` ∥ `panel`）+ 段态词（= `providers` 面态，第二闸在途判据面）
 * + 单表（`providerAddBody`——段名 ∥ 段标题不复述）；卡携 `data-initial-focus="field"`（初始焦点 = 首控件，宿主取用）。
 * 渠道段体（`providers`）同批：两形常显表单退场 ⇒ 段尾添加钮（`settings:addProvider`）。
 * **添加入口弹窗统一批增（2026-10-07 · 台账 #1054 · KD-77 ①②）**：`MCP_FORM_MODAL_GROUP`（`mcpForm`——MCP 表单
 * 弹窗，新增 ∥ 编辑两态同框、标题逐态）∥ `CONSULT_ADD_MODAL_GROUP`（`consultAdd`——会诊添加弹窗，标题
 * `settings.consultAddTitle`）；两卡皆携 `data-initial-focus="field"`；`settingsModalTree` **段态词恰一收正**（非表单支不再叠渲）。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { THEMES } from "../theme.mjs"
import { wire } from "./chat-tool.mjs"
import { channelFormTree, verifyControl } from "./settings-controls.mjs"
import { agentBody, consultAddBody, envBody, mcpBody, mcpFormBody, modelBody, modelIdOf, modelsBody, providerAddBody, providersBody, toolsBody } from "./settings-sections.mjs"

// 两导出面随 R7 出档 `settings-controls.mjs`；本档 re-export ⇒ 导出面零改（消费面 = 首启向导）。
export { channelFormTree, verifyControl } from "./settings-controls.mjs"

/** 段闭集（序固定 = 渠道 → 模型 → agent 参数 → MCP → 环境〔R7 增〕→ 工具与服务〔R2 增〕→
 *  咨询与顾问〔R7 增〕；R7 终态枚举行「providers ∕ model ∕ agent ∕ mcp ＋ env ＋ tools ＋ models」同序）：
 *  名（`data-section`）+ 词键单源。 */
export const SECTIONS = Object.freeze([
  { name: "providers", word: "settings.section.providers" },
  { name: "model", word: "settings.section.model" },
  { name: "agent", word: "settings.section.agent" },
  { name: "mcp", word: "settings.section.mcp" },
  { name: "env", word: "settings.section.env" },
  { name: "tools", word: "settings.section.tools" },
  { name: "models", word: "settings.section.models" },
])

/** 添加弹窗组名（KD-75 ①②）：**非段名** —— 弹窗体 = `providers` 段域的单表（无行族）；
 *  **名单源在此**（`SCOPES`（`mount-settings.mjs`）∥ `MODAL_READS` ∥ 开径出口（`mount-settings-exits.mjs`）三面同领 —— 零双抄）。 */
export const ADD_MODAL_GROUP = "providerAdd"

/** 添加弹窗组名二（KD-77 ①②）：**非段名** —— `mcpForm` = MCP 表单（新增 ∥ 编辑两态同框）∥ `consultAdd` = 会诊添加；
 *  名单源同 `ADD_MODAL_GROUP`（三面同领 —— 零双抄；常量名 = 设计原文 `MCP_FORM_MODAL_GROUP`——§2.18 项 3）。 */
export const MCP_FORM_MODAL_GROUP = "mcpForm"
export const CONSULT_ADD_MODAL_GROUP = "consultAdd"

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
  "base-url-required": "settings.providerUrlRequired", // S2：拉取模型前置拒（缺 baseURL）
  "slot-authority": "settings.reason.slotAuthority", // S14a：slot 权威键通用保存拒写
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

/** 主题三态读数（D33 · 台账 #743）：顶层切片 `theme` —— 闭集（`THEMES` 单源）；表外 / 缺 ⇒ `system`（不猜 —— 缺省态）。 */
function themeOf(state) {
  return THEMES.includes(state?.theme) ? state.theme : "system"
}

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 非空串归一：非串 / 空串 ⇒ `null`（禁假造）。 */
const str = (value) => (typeof value === "string" && value !== "" ? value : null)
/** 对象切片归一：缺 / 非对象 ⇒ `null`（禁假造——S2 `probe` ∕ `draft` 同判）。 */
const objOf = (value) => (value !== null && typeof value === "object" ? value : null)

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

/** 候选项归一（models 段两处 picker）：`{ id, effortEnum }` 两键投影——`id` 缺 ⇒ 弃项（禁假造）。 */
function pickerRows(value) {
  return listOf(value).map((row) => ({ id: modelIdOf(row), effortEnum: listOf(row?.effortEnum) })).filter((row) => row.id !== null)
}

/** 复合串模型段（`"provider:model"` ⇒ `"model"`；无冒号 / 空段 ⇒ `null`）。 */
function modelSegmentOf(composite) {
  const at = typeof composite === "string" ? composite.indexOf(":") : -1
  return at > 0 ? str(composite.slice(at + 1)) : null
}

/** guard 开关现值（S14b）：活动会话键 ⇒ `sessionFlags` 槽投影布尔；无活动会话 / 无读数 ⇒ `null`（未知 —— 禁假造）。 */
function guardFlagOf(state) {
  const key = typeof state?.activeSession === "string" && state.activeSession !== "" ? state.activeSession : null
  if (key === null || state?.sessionFlags === null || typeof state?.sessionFlags !== "object") return null
  const record = state.sessionFlags[key]
  return typeof record?.advisorGuard === "boolean" ? record.advisorGuard : null
}

/** advisor 推理档**归属模型**（S11 收正 · 顾问评审 🟡2——写面 ∕ 候选面同源同序；对位核 `resolveAdvisorProvider`
 *  `thincoder-core/advisor/run.mjs:26-56`「cfg.model > 父解析模型单档」——**2026-10-09 清除批**：原「渠道 model」腿
 *  随渠道单值模型退场）：`advisor.model` ⇒ 该值；再缺 ⇒ 主模型段（`defaultModel`）；无 ⇒ `null`。 */
function advisorTargetOf(settings) {
  const advisor = settings.models?.advisor ?? {}
  return str(advisor.model) ?? modelSegmentOf(settings.model?.current)
}

/** 面模型（纯 · 零 DOM）：开合 + 失败面 + 七段（各段现态直读 —— 渲染面零推导）。 */
export function settingsModel(state) {
  const settings = state?.settings ?? {}
  const notice = settings.notice !== null && typeof settings.notice === "object" ? settings.notice : null
  const scope = notice !== null && Object.hasOwn(SCOPE_WORD, notice.scope) ? notice.scope : "panel"
  return {
    open: settings.open === true,
    lang: langOf(state),
    theme: themeOf(state),
    notice: notice === null ? null : { scope, text: reasonWord(notice.reason) },
    providers: {
      state: stateOf(settings.providers),
      presets: listOf(settings.providers?.presets).filter((p) => p && typeof p.name === "string"),
      rows: listOf(settings.providers?.providers).filter((p) => p && typeof p.name === "string"),
      verify: settings.verify !== null && typeof settings.verify === "object" ? settings.verify : null,
      edit: str(settings.providers?.edit), probe: objOf(settings.providers?.probe), draft: objOf(settings.providers?.draft),
      // KD-75 ③：类型选择现值（形状唯一源）——预设名 ∥ `"custom"`；缺 / 空 ⇒ `"preset"`（缺省态 = 预设形首项）。
      addShape: str(settings.providers?.addShape) ?? "preset",
      // #615②：失败径草稿种子（`{ name, value }` ∕ `null` —— 消费面 = 渠道段钥行输入回填，`settings-sections.mjs` `keyControls`）
      keyDraft: objOf(settings.providers?.keyDraft),
    },
    model: {
      state: stateOf(settings.model),
      provider: typeof settings.model?.provider === "string" ? settings.model.provider : null,
      current: typeof settings.model?.current === "string" ? settings.model.current : null,
      // #842：行保持带渠形（全渠扇出面 `{ provider, id }` 行穿透至视图——行自带渠；串行 / 无渠行 ⇒ `provider: null`）。
      models: listOf(settings.model?.models).map((row) => ({ id: modelIdOf(row), provider: str(row?.provider) })).filter((row) => row.id !== null),
    },
    agent: {
      state: stateOf(settings.agent),
      fields: listOf(settings.agent?.fields).filter((f) => f && typeof f.path === "string"),
      // B10 W3（S10 ∕ S11 ∕ S14b）三读数：候选 = `model:list` 投影元素面（激活渠 —— 子代理模型槽值 / advisor 档位枚举双用）；
      // advisor 档归属模型 = `advisorModel`（写面 ∕ 候选面同源同序，S11 收正——见 `advisorTargetOf` · 顾问评审 🟡2）；
      // guard = 活动会话 `sessionFlags` 槽投影（未知 ⇒ null）。
      models: listOf(settings.model?.models).filter((row) => row !== null && typeof row === "object" && typeof row.id === "string" && row.id !== ""),
      provider: str(settings.model?.provider),
      advisorModel: advisorTargetOf(settings),
      guard: guardFlagOf(state),
    },
    mcp: {
      state: stateOf(settings.mcp),
      servers: listOf(settings.mcp?.servers).filter((s) => s && typeof s.name === "string"),
      details: settings.mcp?.details !== null && typeof settings.mcp?.details === "object" ? settings.mcp.details : {},
      // S8：表单态（`editing` = 编辑中服务器名 ∥ null；`type` = 三型现选）—— 缺 / 形不合 ⇒ null（新增态）。
      form: objOf(settings.mcp?.form),
    },
    env: {
      state: stateOf(settings.env),
      proxy: {
        uri: typeof settings.env?.proxy?.uri === "string" ? settings.env.proxy.uri : "",
        web: settings.env?.proxy?.web !== false,
      },
      shell: {
        current: str(settings.env?.shell?.current),
        candidates: listOf(settings.env?.shell?.candidates).filter((c) => c && typeof c.name === "string"),
      },
      test: settings.env?.test !== null && typeof settings.env?.test === "object" ? settings.env.test : null,
    },
    tools: {
      state: stateOf(settings.tools),
      status: settings.tools?.status !== null && typeof settings.tools?.status === "object" ? settings.tools.status : null,
      building: settings.tools?.building === true,
      keys: settings.tools?.keys !== null && typeof settings.tools?.keys === "object"
        ? {
          embedding: { hasKey: settings.tools.keys.embedding?.hasKey === true },
          websearch: { hasKey: settings.tools.keys.websearch?.hasKey === true },
        }
        : null,
      edit: settings.tools?.edit === "embedding" || settings.tools?.edit === "websearch" ? settings.tools.edit : null,
    },
    models: {
      state: stateOf(settings.models),
      consult: listOf(settings.models?.consult).filter((row) => row && typeof row.provider === "string" && row.provider !== "" && typeof row.model === "string" && row.model !== "")
        .map((row) => ({ provider: row.provider, model: row.model, effort: typeof row.effort === "string" ? row.effort : null, effortEnum: listOf(row.effortEnum) })),
      advisor: { provider: str(settings.models?.advisor?.provider), model: str(settings.models?.advisor?.model) },
      providers: listOf(settings.providers?.providers).map((p) => p?.name).filter((name) => typeof name === "string" && name !== ""),
      picker: {
        provider: typeof settings.models?.picker?.provider === "string" ? settings.models.picker.provider : "",
        rows: pickerRows(settings.models?.picker?.rows),
        model: str(settings.models?.picker?.model),
      },
      advisorPicker: {
        provider: typeof settings.models?.advisorPicker?.provider === "string" ? settings.models.advisorPicker.provider : "",
        rows: pickerRows(settings.models?.advisorPicker?.rows),
        model: str(settings.models?.advisorPicker?.model),
      },
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

/** 段体分派（七段各一形；段名闭集 —— 表外段零节点）：各段体住 `settings-sections*.mjs`（经本档导入面），
 *  本档经 `deps` 注入两导出面 + 词表（单一 owner —— 零副本）。**段态门**（三态单源）：`env` ∕ `models` 两
 *  新段 = `ready` 才落行（`none` / `loading` ⇒ 零行节点 —— 防未读达即落默认值〔假读数〕）；`agent` 沿旧
 *  （`loading` 期零体）；`providers` ∕ `model` ∕ `mcp` ∕ `tools` 沿各自旧判（零行为改）。 */
function sectionBody(name, model, handlers) {
  const deps = { channelForm: channelFormTree, verifyControl, reasonWord, formats: FORMATS, edit: model?.providers?.edit ?? null, keyDraft: model?.providers?.keyDraft ?? null }
  if (name === "providers") return [sectionStateNode(model.providers.state), ...providersBody(model.providers, handlers, deps)]
  // 添加弹窗体（KD-75 ①）：零行族 —— 单表唯内容；三源（形状 ∥ 暂存值 ∥ 候选）同住 `providers` 切片。
  if (name === ADD_MODAL_GROUP) return [sectionStateNode(model.providers.state), ...providerAddBody(model.providers, handlers, deps)]
  if (name === "model") return [sectionStateNode(model.model.state), ...modelBody(model.model, handlers)]
  if (name === "agent") {
    return [sectionStateNode(model.agent.state), ...(model.agent.state === "loading" ? [] : agentBody(model.agent, handlers))]
  }
  if (name === "env") return [sectionStateNode(model.env.state), ...(model.env.state === "ready" ? envBody(model.env, handlers) : [])]
  if (name === "tools") return [sectionStateNode(model.tools.state), ...toolsBody(model.tools, handlers)]
  if (name === "models") return [sectionStateNode(model.models.state), ...(model.models.state === "ready" ? modelsBody(model.models, handlers) : [])]
  // 两新组弹窗体（KD-77 ①②）：段态词恰一（本支首件）+ 体件；`mcpForm` 载入中零表单（闸住 `mcpFormBody` 内——沿段体旧闸）；`consultAdd` = `ready` 才落体（沿 models 段门）。
  if (name === MCP_FORM_MODAL_GROUP) return [sectionStateNode(model.mcp.state), ...mcpFormBody(model.mcp, handlers)]
  if (name === CONSULT_ADD_MODAL_GROUP) return [sectionStateNode(model.models.state), ...(model.models.state === "ready" ? consultAddBody(model.models, handlers) : [])]
  return [sectionStateNode(model.mcp.state), ...mcpBody(model.mcp, handlers, deps)]
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

/** 主题三态钮族（D33 · 台账 #743）：容器 `settings-theme`（`role="group"` + `aria-label`）；三钮锚 `settings:theme` +
 *  `data-theme` = 目标值；序 = `THEMES` 单源（跟随系统 ∥ 亮色 ∥ 暗色 —— 缺省态居首）；当前态 = `data-active` +
 *  `aria-pressed="true"`（三钮恰一）；缺 handlers ⇒ 三钮 `disabled`（沿 `wire` 两态通则）。 */
function themeNode(model, handlers) {
  const onSet = typeof handlers?.onSetTheme === "function" ? handlers.onSetTheme : null
  const current = model?.theme ?? "system"
  return {
    tag: "div",
    props: { class: "settings-theme", role: "group", "aria-label": t("settings.theme") },
    children: THEMES.map((value) => {
      const props = { class: "settings-theme-opt", type: "button", "data-action": "settings:theme", "data-theme": value }
      if (value === current) {
        props["data-active"] = ""
        props["aria-pressed"] = "true"
      }
      return { tag: "button", props: wire(props, onSet === null ? undefined : () => onSet(value)), children: [t(`settings.theme.${value}`)] }
    }),
  }
}

/** 面头：标题 + 主题三态钮族（居语言控件**左侧**）+ 语言控件（**锚名逐字** `settings:lang` —— 在关闭控件**左侧**）+ 关闭控件
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
      themeNode(model, handlers),
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

/** 弹窗树（D39 ∥ D38 · #817 **KD-68** —— 单组树：背板 + 卡〔`role="dialog"` + `aria-modal`；头 = 组名 + ✕；
 *  体 = 失败串（`notice.scope` = 本组 ∨ `panel`——他组隐）+ 段态词 + 段体，段标题不复述〕；复用档内私有三件
 *  （`noticeNode` ∥ `sectionStateNode` ∥ `sectionBody`）⇒ 零第二实现；三关 handler 全在树面（背板 ∥ ✕ ∥ 卡内 Esc
 *  〔`stopPropagation` —— 不连带触 F-Esc 关页〕）；表外组 ⇒ `null`（防御档——调用面已验 `SCOPES`）。
 *  体节点携 `data-state` = 组段态（装配面第二闸在途判据面 —— 与页侧 `[data-state="loading"]` 同形）。
 *  **表单支三组（KD-75 ①② ∥ KD-77 ①②）**：`providerAdd` ∥ `mcpForm` ∥ `consultAdd` ⇒ 标题词键直取（非段名）；
 *  段态 ∥ 失败串 scope 落同段域（`providers` ∥ `mcp` ∥ `models`）；卡携 `data-initial-focus="field"`（初始焦点 =
 *  表单首控件——宿主 `settings-modal.mjs` 取用；他组缺省 ✕，KD-68 ⑥ 零动）；`mcpForm` 标题逐态（`form.editing` 判
 *  ——`settings.mcp.addTitle` ∥ `settings.mcp.editTitle`）、`consultAdd` 标题 `settings.consultAddTitle`。
 *  **段态词恰一（全支——KD-77 ④收正）**：段体分支皆自带段态词（`sectionBody` 首件）⇒ 本支不再叠渲
 *  （修前非表单支叠渲：`env` 组 loading = 2 同词节点——六组同病）。 */
export function settingsModalTree(state, group, handlers = {}) {
  const model = settingsModel(state)
  const isAdd = group === ADD_MODAL_GROUP
  const isMcpForm = group === MCP_FORM_MODAL_GROUP
  const isConsult = group === CONSULT_ADD_MODAL_GROUP
  const section = SECTIONS.find((s) => s.name === group)
  if (section === undefined && !isAdd && !isMcpForm && !isConsult) return null
  const onClose = typeof handlers?.onCloseModal === "function" ? handlers.onCloseModal : undefined
  const close = () => { if (typeof onClose === "function") onClose() }
  const scope = isAdd ? "providers" : isMcpForm ? "mcp" : isConsult ? "models" : group
  const notice = model.notice !== null && (model.notice.scope === scope || model.notice.scope === "panel") ? model.notice : null
  const groupState = isAdd ? model.providers.state : isMcpForm ? model.mcp.state : isConsult ? model.models.state : model[group]?.state ?? "none"
  const editing = isMcpForm && typeof model.mcp.form?.editing === "string" && model.mcp.form.editing !== ""
  const titleWord = isAdd
    ? "settings.addProviderTitle"
    : isMcpForm
      ? editing ? "settings.mcp.editTitle" : "settings.mcp.addTitle"
      : isConsult ? "settings.consultAddTitle" : section.word
  return {
    backdrop: { tag: "div", props: { class: "settings-modal-backdrop", onClick: close }, children: [] },
    card: {
      tag: "div",
      props: {
        class: "settings-modal", role: "dialog", "aria-modal": "true", "aria-label": t(titleWord),
        "data-initial-focus": isAdd || isMcpForm || isConsult ? "field" : undefined,
        onKeydown: (event) => { if (event?.key !== "Escape") return; event.stopPropagation?.(); close() },
      },
      children: [
        { tag: "header", props: { class: "settings-head" }, children: [
          { tag: "h2", props: { class: "settings-title" }, children: [t(titleWord)] },
          { tag: "button", props: wire({ class: "settings-close", type: "button", "data-action": "settings:modalClose", "aria-label": t("settings.close") }, onClose), children: [] },
        ] },
        { tag: "div", props: { class: "settings-modal-body", "data-state": groupState }, children: [noticeNode(notice), ...sectionBody(group, model, handlers)] },
      ],
    },
  }
}

/** 宿主属性面复位表（`root` → 上次薄挂载所落属性名集）：**不入 DOM 属性面**（弱引用 —— 宿主离场随收）。 */
const hostProps = new WeakMap()

/** 薄挂载属性面（**单源** —— `views/onboarding.mjs` 向导挂载取用本表）：本次树声明的属性落宿主，
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
