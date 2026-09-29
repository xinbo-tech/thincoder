/**
 * settings-sections.mjs — 设置面段体档（批 9 · 批档 §2.12–§2.13；自 `renderer/views/settings.mjs` 拆出
 * —— 300 行层拆分，零语义变化）：渠道 / 模型与档位 / MCP 各一形（agent 段体已随「桌面处理流 · VSC 对齐」批 R8
 * 拆出 `renderer/views/settings-agent.mjs` —— **原档 re-export 两件、导出面零改**；「工具与服务」段体随
 * R2（桌面功能对位批）拆出 `renderer/views/settings-sections-tools.mjs` —— **本档 re-export 一件**；
 * R7（桌面功能对位批）两新段体拆出 `renderer/views/settings-sections-env.mjs`（环境）∥
 * `settings-sections-models.mjs`（咨询与顾问）—— **本档 re-export 两件**）。
 * 面形要点：档位（现值 = `defaultModel` 渠道段条目的 `effort` 投影 · 枚举 = 模型段在 `model:list` 的元素面；
 * **不可解 ⇒ 零节点 —— 禁假造**）·
 * MCP（探活失败零保存 = 主侧口径，端侧只呈现回执；**R7 增**行内两钮：`Tools` 展开工具清单〔逐工具名 /
 * 描述 / params〕· `Test` 探活回执；两态均经 `mcp:tools` 通道）· 渠道（行 + 校验结果 + 两形表单，`loading` 期零表单）。
 * 导出面：`modelHeadNode` / `modelChoicesTree` 供首启向导第二步复用（单一 owner、零副本）；`tierFace` 供面模型取
 * 档位读数（`settings.mjs` `settingsModel`）；`NAMED_FIELDS` = agent 具名十键表（键集 / 词键 / 控型三面单源 —— 现档
 * re-export 自 `settings-agent.mjs`；消费面 = 同档 `agentBody` + `renderer/mount-settings-exits.mjs` 写路）；
 * 四段体供 `settings.mjs` 段体分派——渠道体经 `deps` 注入取用两导出面
 * （`verifyControl`）与词表（`reasonWord`），本档零 import 反向（无环）—— **R7 起 = 六段体**（env ∕ models 两新段
 * 经本档 re-export 面入分派；MCP 体随两钮先拆后改出档 `-mcp.mjs`、本档同拍 re-export；MCP 体第三参 `deps` 供
 * `reasonWord` 出词）。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ⇒ `wire` 落 `disabled: true`；
 * 零 `node:` / 零裸包 / 零 `store.mjs` import。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

// agent 段体（含具名十键表 `NAMED_FIELDS`）已随 R8 拆出 `./settings-agent.mjs`；本档 re-export ⇒ 导出面零改。
export { agentBody, NAMED_FIELDS } from "./settings-agent.mjs"
// 「工具与服务」段体（本批 = 索引族行）随 R2 拆出 `./settings-sections-tools.mjs`；本档 re-export ⇒ 导出面零改。
export { toolsBody } from "./settings-sections-tools.mjs"
// R7 两新段体（环境 ∕ 咨询与顾问）自立出档；本档 re-export ⇒ 分派面零改。
export { envBody } from "./settings-sections-env.mjs"
export { modelsBody } from "./settings-sections-models.mjs"
// MCP 段体（R7 随两钮先拆后改 —— `-mcp.mjs`）同拍；本档 re-export ⇒ 分派面零改。
export { mcpBody } from "./settings-sections-mcp.mjs"


/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 档位核心字面：`"none"` 语义由 `"off"` 承载（候选面滤值 —— 沿会话头同口径；本档局部常量，零跨档共享面）。 */
const EFFORT_NONE = "none"

/** 键面回显：已配 ⇒ 遮罩值（主侧出口直传，**明文零下发**）；未配 ⇒ 无密钥词。 */
function keyFaceNode(row) {
  const word = row.hasKey === true ? String(row.maskedKey ?? "") : t("settings.providers.noKey")
  return { tag: "span", props: { class: "settings-key", "data-key": row.hasKey === true ? "masked" : "none" }, children: [word] }
}

/** 校验结果节点（两态词键；核错误串经 `deps.reasonWord` —— 表内码出词、表外原样）。 */
function verifyNode(verify, deps) {
  if (verify === null) return null
  const word = verify.kind === "ok"
    ? t("settings.providers.verify.ok", { count: Number.isFinite(verify.count) ? verify.count : 0 })
    : t("settings.providers.verify.fail", { reason: deps.reasonWord(verify.reason) ?? "" })
  return { tag: "div", props: { class: "settings-verify", "data-verify": verify.kind === "ok" ? "ok" : "fail" }, children: [word] }
}

/** 段内按钮（锚名 ∕ 可及名 ∕ 词面三处同源；缺 handler ⇒ `wire` 落 `disabled` —— 诚实非死控）。 */
function rowButton(action, name, word, aria, handler) {
  return {
    tag: "button",
    props: wire({ class: "settings-row-action", type: "button", "data-action": action, "data-name": name, "aria-label": aria }, handler),
    children: [word],
  }
}

/** 渠道行 sub 段（S4 ∕ S3）：`model` ∕ `baseURL` ∕ 不可用标与失败句 —— **非空才显**（禁假造；空值 ⇒ 零节点）。 */
function rowSubNodes(row) {
  const unavailable = row?.available === false
  const reason = typeof row?.unavailableReason === "string" && row.unavailableReason !== "" ? row.unavailableReason : ""
  return [
    typeof row?.model === "string" && row.model !== ""
      ? { tag: "span", props: { class: "settings-row-value", "data-provider-model": "" }, children: [row.model] } : null,
    typeof row?.baseURL === "string" && row.baseURL !== ""
      ? { tag: "span", props: { class: "settings-row-value", "data-provider-baseurl": "" }, children: [row.baseURL] } : null,
    unavailable ? { tag: "span", props: { class: "settings-mark", "data-available": "false" }, children: [t("settings.reason.unavailable")] } : null,
    unavailable && reason !== ""
      ? { tag: "span", props: { class: "settings-row-value", "data-unavailable-reason": "" }, children: [reason] } : null,
  ]
}

/** 渠级代理复选（S5）：`change-to-save`（值 ⇒ `onSetProxy(name, checked)`）；缺 handler ⇒ `disabled`（沿段内先例）。 */
function proxyNode(row, handlers) {
  const props = { type: "checkbox", class: "settings-field", "data-provider-proxy": "", checked: row.proxy === true ? true : undefined }
  if (typeof handlers?.onSetProxy === "function") props.onChange = (event) => handlers.onSetProxy(row.name, event?.target?.checked === true)
  else props.disabled = true
  return {
    tag: "label",
    props: { class: "settings-field-label", title: t("settings.proxyRowTitle") },
    children: [{ tag: "input", props }, t("settings.proxyRow")],
  }
}

/** 钥控件两态（S1）：静止 = 设 ∕ 改钥（已配 ⇒ 兼出删钥；两删除门经出口前置确认）；编辑中 = 密码输入 + 存 ∕ 消。 */
function keyControls(row, handlers, editing) {
  if (editing) {
    const save = typeof handlers?.onProviderKeySave === "function" ? () => handlers.onProviderKeySave(row.name) : undefined
    const cancel = typeof handlers?.onProviderKeyCancel === "function" ? () => handlers.onProviderKeyCancel() : undefined
    return [
      { tag: "input", props: { class: "settings-field", type: "password", "data-provider-key-input": row.name, placeholder: "sk-...", "aria-label": t("settings.providers.keyLabel") } },
      rowButton("settings:providerKeySave", row.name, t("settings.save"), t("settings.save"), save),
      rowButton("settings:providerKeyCancel", row.name, t("settings.cancel"), t("settings.cancel"), cancel),
    ]
  }
  const word = t(row.hasKey === true ? "settings.changeKey" : "settings.addKey")
  const edit = typeof handlers?.onProviderKeyEdit === "function" ? () => handlers.onProviderKeyEdit(row.name) : undefined
  const controls = [rowButton("settings:providerKeyEdit", row.name, word, word, edit)]
  if (row.hasKey === true) {
    const del = typeof handlers?.onProviderKeyDelete === "function" ? () => handlers.onProviderKeyDelete(row.name) : undefined
    controls.push(rowButton("settings:providerKeyDelete", row.name, t("settings.keyDelete"), t("settings.deleteKey"), del))
  }
  return controls
}

/** 渠道行：名 + 键面 + 当前标 + sub 段（S4 ∕ S3）+ 代理复选（S5）+ 钥控件（S1）+ 校验 / 移除两控件
 *  （校验控件 = `deps` 注入，单一 owner）。行内钥编辑态（`deps.edit` = 本行名）⇒ 控件族换形：只留
 *  [钥输入, 存, 消]（沿 VSC `keyRowEdit` 同形；代理 ∕ 移除暂撤 —— 取消即回）。 */
function providerRowNode(row, handlers, deps) {
  const editing = typeof deps?.edit === "string" && deps.edit !== "" && deps.edit === row.name
  const onRemove = typeof handlers?.onRemoveProvider === "function" ? () => handlers.onRemoveProvider(row.name) : undefined
  const remove = rowButton(
    "settings:removeProvider", row.name, t("settings.providers.remove", { name: row.name }),
    t("settings.providers.remove", { name: row.name }), onRemove,
  )
  return {
    tag: "div",
    props: {
      class: "settings-row", "data-provider": row.name,
      "data-active": row.active === true ? "" : undefined, "data-edit": editing ? "" : undefined,
    },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [row.name] },
      keyFaceNode(row),
      row.active === true ? { tag: "span", props: { class: "settings-mark", "data-active": "" }, children: [t("settings.providers.active")] } : null,
      ...rowSubNodes(row),
      ...(editing ? [] : [proxyNode(row, handlers)]),
      ...keyControls(row, handlers, editing),
      deps.verifyControl(row.name, handlers),
      ...(editing ? [] : [remove]),
    ],
  }
}

/** 拉取模型状态面（S2）：三态词 —— 探期 ∕ 探通（计数 = 候选数）∥ 探不通（`reason` 经 `deps.reasonWord`
 *  直传，缺 ⇒ `settings.connFailed`）；无探 ⇒ `null`（零节点 —— 禁假造）。 */
function probeFace(probe, deps) {
  const state = probe !== null && typeof probe?.state === "string" ? probe.state : null
  if (state === "running") return { state, word: t("settings.connecting") }
  if (state === "ok") return { state, word: t("settings.connOk", { count: listOf(probe?.models).length }) }
  if (state === "fail") return { state, word: deps.reasonWord(probe.reason) ?? t("settings.reason.probeFailed") }
  return null
}

/** 渠道段体：渠道行 + 校验结果 + 两形表单（`loading` 期零表单）。**S2**：自定形随表单给
 *  `probe`（已出词状态面）∕ `draft`（暂存值回填）∕ `modelCandidates`（探通才有候选 —— 零假造）。 */
export function providersBody(section, handlers, deps) {
  const loading = section.state === "loading"
  const candidates = section?.probe?.state === "ok" ? listOf(section.probe.models) : []
  const forms = loading ? [] : [
    deps.channelForm({ shape: "preset", presets: section.presets, formats: deps.formats }, handlers),
    deps.channelForm({
      shape: "custom", presets: [], formats: deps.formats,
      probe: probeFace(section?.probe ?? null, deps), draft: section?.draft ?? null, modelCandidates: candidates,
    }, handlers),
  ]
  return [
    ...section.rows.map((row) => providerRowNode(row, handlers, deps)),
    verifyNode(section.verify, deps),
    ...forms,
  ]
}


/** 模型候选项 → 标识串（**单向投影 · 单源** —— 回执元素形 `{ id, effortEnum, thinkOff }`（`docs/desktop/design/IPC.md` §2
 *  `model:list` 行「批 B 增」）⇒ 逐项 `.id` 逐字（`docs/desktop/design/UI.md` §1 项 1 候选口径）；串元素（直测面）⇒ 自身；
 *  空串 ∥ 空 `.id` ∥ 非串非对象 ⇒ `null`（零假造 —— 调用面自行过滤）。 */
export function modelIdOf(value) {
  if (typeof value === "string") return value === "" ? null : value
  const id = value?.id
  return typeof id === "string" && id !== "" ? id : null
}

/** 当前模型读数节点（**导出面** —— 设置面模型段与首启向导第二步同一构造）；无当前 ⇒ `null`（零节点）。 */
export function modelHeadNode(model) {
  if (model?.current === null || model?.current === undefined) return null
  return {
    tag: "div",
    props: { class: "settings-row", "data-read": "current" },
    children: [{ tag: "span", props: { class: "settings-row-name" }, children: [t("settings.model.current")] },
      { tag: "span", props: { class: "settings-row-value" }, children: [model.current] }],
  }
}

/** 候选行（**导出面** —— 同上）：行 + 空态词（`ready` 而零候选 ⇒ 禁假造）。 */
export function modelChoicesTree(model, handlers = {}) {
  const rows = listOf(model?.models).map((name) => modelRowNode(name, model, handlers))
  if (model?.state !== "ready" || rows.length > 0) return rows
  return [{ tag: "div", props: { class: "settings-empty", "data-empty": "" }, children: [t("settings.model.empty")] }]
}

/** 模型行：名 + 采用控件（当前项 / 无 provider ⇒ 非死控 = `disabled`）。 */
function modelRowNode(name, model, handlers) {
  const current = model.current === `${model.provider}:${name}`
  const onUse = !current && typeof handlers?.onUseModel === "function" && model.provider !== null
    ? () => handlers.onUseModel(model.provider, name)
    : undefined
  return {
    tag: "div",
    props: { class: "settings-row", "data-model": name, "data-current": current ? "" : undefined },
    children: [{ tag: "span", props: { class: "settings-row-name" }, children: [name] }, {
      tag: "button",
      props: wire({
        class: "settings-row-action",
        type: "button",
        "data-action": "settings:useModel",
        "data-model": name,
        "aria-label": t("settings.model.use"),
      }, onUse),
      children: [t("settings.model.use")],
    }],
  }
}

/** 档位读数（`docs/desktop/design/UI.md` §1 批 B 注 5 · `docs/desktop/design/IPC.md` §2 设置族注 9）：现值 =
 *  `defaultModel` **渠道段**渠道条目的 `effort` 投影（`provider:list` 行 · 离线零探针）；枚举 / `thinkOff` = **模型段**
 *  在 `model:list` 的元素面；不可解（`defaultModel` 缺 / 段空 / 该模型无候选元素）⇒ `null`（**控件零节点**）。
 *  现值非串 ⇒ `""`（**禁吞** —— 表外现值自成一选项，核侧 `bad-level` 拒绝面可见）。 */
export function tierFace(settings) {
  const composite = typeof settings?.defaultModel === "string" ? settings.defaultModel : ""
  const at = composite.indexOf(":")
  const provider = at === -1 ? "" : composite.slice(0, at)
  const model = at === -1 ? "" : composite.slice(at + 1)
  if (provider === "" || model === "") return null
  const entry = listOf(settings?.model?.models).find((value) => modelIdOf(value) === model)
  if (entry === undefined) return null
  const row = listOf(settings?.providers?.providers).find((value) => value?.name === provider)
  return {
    provider,
    model,
    current: typeof row?.effort === "string" ? row.effort : "",
    effortEnum: listOf(entry?.effortEnum),
    thinkOff: entry?.thinkOff === true,
  }
}

/** 档位选项集（UI.md §1 批 B 注 5）：`Auto`（值 `"auto"` —— 写径意图级，非「未设」）+ `off`（仅该模型
 *  `thinkOff` 真）+ 逐模型枚举（滤空串 / `"none"`、去重）+ **表外现值自成一选项**（禁吞 · 零改写）。 */
export function tierOptions(tier) {
  const options = []
  const current = typeof tier?.current === "string" ? tier.current : ""
  const add = (value, word) => {
    if (options.some((option) => option.value === value)) return
    options.push({ value, word })
  }
  add("auto", t("effort.auto"))
  if (tier?.thinkOff === true) add("off", t("effort.off"))
  for (const member of listOf(tier?.effortEnum)) {
    if (typeof member !== "string" || member === "" || member === EFFORT_NONE) continue
    add(member, member)
  }
  add(current, current)
  return options
}

/** 档位出口（`change` 面）：现选值 ⇒ `onTier(provider, model, level)`（非串 ⇒ `null` —— 挂载面零发送）。 */
function acceptTier(event, tier, onTier) {
  const raw = event?.target?.value ?? event?.currentTarget?.value
  onTier(tier.provider, tier.model, typeof raw === "string" ? raw : null)
}

/** 档位行：名 + 档位控件（`select` —— 零 `data-action`（非点击型：接线经 `onChange`）；行标 = `data-tier`、可及名 = `aria-label` 词键；非表单控件 ⇒ 零 `name`；缺 handler ⇒ `disabled`）。 */
function tierRowNode(tier, handlers) {
  const props = { class: "settings-field", "aria-label": t("settings.model.tier") }
  if (typeof handlers?.onTier === "function") props.onChange = (event) => acceptTier(event, tier, handlers.onTier)
  else props.disabled = true
  return {
    tag: "div",
    props: { class: "settings-row", "data-tier": tier.current },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [t("settings.model.tier")] },
      {
        tag: "select",
        props,
        children: tierOptions(tier).map((option) => ({
          tag: "option",
          props: option.value === tier.current ? { value: option.value, selected: true } : { value: option.value },
          children: [option.word],
        })),
      },
    ],
  }
}

/** 模型段体：当前读数 + 档位行（不可解 ⇒ 零节点）+ 候选行（**向导不经本函数** —— 向导步 2 内零档位行）。 */
export function modelBody(section, handlers) {
  const tier = section?.tier ?? null
  return [modelHeadNode(section), ...(tier === null ? [] : [tierRowNode(tier, handlers)]), ...modelChoicesTree(section, handlers)]
}
