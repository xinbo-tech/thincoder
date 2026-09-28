/**
 * settings-sections.mjs — 设置面段体档（批 9 · 批档 §2.12–§2.13；自 `renderer/views/settings.mjs` 拆出
 * —— 300 行层拆分，零语义变化）：渠道 / 模型与档位 / MCP 各一形（agent 段体已随「桌面处理流 · VSC 对齐」批 R8
 * 拆出 `renderer/views/settings-agent.mjs` —— **原档 re-export 两件、导出面零改**；「工具与服务」段体随
 * R2（桌面功能对位批）拆出 `renderer/views/settings-sections-tools.mjs` —— **本档 re-export 一件**）。
 * 面形要点：档位（现值 = `defaultModel` 渠道段条目的 `effort` 投影 · 枚举 = 模型段在 `model:list` 的元素面；
 * **不可解 ⇒ 零节点 —— 禁假造**）·
 * MCP（探活失败零保存 = 主侧口径，端侧只呈现回执）· 渠道（行 + 校验结果 + 两形表单，`loading` 期零表单）。
 * 导出面：`modelHeadNode` / `modelChoicesTree` 供首启向导第二步复用（单一 owner、零副本）；`tierFace` 供面模型取
 * 档位读数（`settings.mjs` `settingsModel`）；`NAMED_FIELDS` = agent 具名十键表（键集 / 词键 / 控型三面单源 —— 现档
 * re-export 自 `settings-agent.mjs`；消费面 = 同档 `agentBody` + `renderer/mount-settings-exits.mjs` 写路）；
 * 四段体供 `settings.mjs` 段体分派——渠道体经 `deps` 注入取用两导出面
 * （`verifyControl`）与词表（`reasonWord`），本档零 import 反向（无环）。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ⇒ `wire` 落 `disabled: true`；
 * 零 `node:` / 零裸包 / 零 `store.mjs` import。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

// agent 段体（含具名十键表 `NAMED_FIELDS`）已随 R8 拆出 `./settings-agent.mjs`；本档 re-export ⇒ 导出面零改。
export { agentBody, NAMED_FIELDS } from "./settings-agent.mjs"
// 「工具与服务」段体（本批 = 索引族行）随 R2 拆出 `./settings-sections-tools.mjs`；本档 re-export ⇒ 导出面零改。
export { toolsBody } from "./settings-sections-tools.mjs"


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

/** 渠道行：名 + 键面 + 当前标 + 校验 / 移除两控件（校验控件 = `deps` 注入，单一 owner）。 */
function providerRowNode(row, handlers, deps) {
  const onRemove = typeof handlers?.onRemoveProvider === "function" ? () => handlers.onRemoveProvider(row.name) : undefined
  const remove = {
    tag: "button",
    props: wire({
      class: "settings-row-action",
      type: "button",
      "data-action": "settings:removeProvider",
      "data-name": row.name,
      "aria-label": t("settings.providers.remove", { name: row.name }),
    }, onRemove),
    children: [t("settings.providers.remove", { name: row.name })],
  }
  return {
    tag: "div",
    props: { class: "settings-row", "data-provider": row.name, "data-active": row.active === true ? "" : undefined },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [row.name] },
      keyFaceNode(row),
      row.active === true ? { tag: "span", props: { class: "settings-mark", "data-active": "" }, children: [t("settings.providers.active")] } : null,
      deps.verifyControl(row.name, handlers),
      remove,
    ],
  }
}

/** 渠道段体：渠道行 + 校验结果 + 两形表单（`loading` 期零表单）。 */
export function providersBody(section, handlers, deps) {
  const loading = section.state === "loading"
  const forms = loading ? [] : [
    deps.channelForm({ shape: "preset", presets: section.presets, formats: deps.formats }, handlers),
    deps.channelForm({ shape: "custom", presets: [], formats: deps.formats }, handlers),
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

/** MCP 行：名 + 形词（表外原样）+ 摘要（主侧出口——不含密钥面）+ 移除控件。 */
function mcpRowNode(row, handlers) {
  const onRemove = typeof handlers?.onRemoveMcp === "function" ? () => handlers.onRemoveMcp(row.name) : undefined
  const kind = row.kind === "url" || row.kind === "command" ? t(`settings.mcp.kind.${row.kind}`) : String(row.kind ?? "")
  return {
    tag: "div",
    props: { class: "settings-row", "data-mcp": row.name, "data-kind": row.kind ?? undefined },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [row.name] },
      { tag: "span", props: { class: "settings-row-value" }, children: [kind] },
      { tag: "span", props: { class: "settings-row-value" }, children: [String(row.summary ?? "")] },
      {
        tag: "button",
        props: wire({
          class: "settings-row-action",
          type: "button",
          "data-action": "settings:removeMcp",
          "data-name": row.name,
          "aria-label": t("settings.mcp.remove", { name: row.name }),
        }, onRemove),
        children: [t("settings.mcp.remove", { name: row.name })],
      },
    ],
  }
}

/** MCP 表单：名 + 配置 JSON（`name` 属性 = 载荷键；JSON 解析归提交端 —— 解析失败零发送）。 */
function mcpFormNode(handlers) {
  return {
    tag: "form",
    props: { class: "settings-form", "data-form": "mcp" },
    children: [
      { tag: "label", props: { class: "settings-field-label", for: "mcp-name" }, children: [t("settings.mcp.nameLabel")] },
      { tag: "input", props: { class: "settings-field", id: "mcp-name", name: "name", type: "text" } },
      { tag: "label", props: { class: "settings-field-label", for: "mcp-config" }, children: [t("settings.mcp.configLabel")] },
      { tag: "textarea", props: { class: "settings-field", id: "mcp-config", name: "config", rows: "3" }, children: [] },
      {
        tag: "button",
        props: wire(
          { class: "settings-submit", type: "button", "data-action": "settings:addMcp" },
          typeof handlers?.onAddMcp === "function" ? handlers.onAddMcp : undefined,
        ),
        children: [t("settings.mcp.add")],
      },
    ],
  }
}

/** MCP 段体：行 + 表单（`loading` 期零表单 —— 载入中不落半形）。 */
export function mcpBody(section, handlers) {
  return [...section.servers.map((row) => mcpRowNode(row, handlers)), section.state === "loading" ? null : mcpFormNode(handlers)]
}
