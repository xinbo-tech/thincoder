/**
 * settings-sections.mjs — 设置面段体档（批 9 · 批档 §2.12–§2.13；自 `renderer/views/settings.mjs` 拆出
 * —— 300 行层拆分，零语义变化）：模型与档位段体 + 拆档族 re-export 面（渠道 / agent / 工具 / env / models /
 * MCP —— 各段体自立出档，本档 re-export ⇒ 分派面零改）。
 *   - 渠道族（行族 + 段体）随 D37 设置面样式收正批（2026-10-02 · 台账 #812）出档
 *     `renderer/views/settings-sections-providers.mjs`（**先拆后改** · 越层消解 —— 本档 309 ⇒ 回线）；
 *   - agent 段体（含具名十键表 `NAMED_FIELDS`）随 R8 拆出 `./settings-agent.mjs`（本档 re-export 两件）；
 *   - 「工具与服务」段体随 R2 拆出 `./settings-sections-tools.mjs`（本档 re-export 一件）；
 *   - R7 两新段体拆出 `./settings-sections-env.mjs` ∥ `./settings-sections-models.mjs`（本档 re-export 两件）；
 *   - MCP 段体随两钮出档 `./settings-sections-mcp.mjs`（本档 re-export 一件）。
 * 面形要点：档位（现值 = `defaultModel` 渠道段条目的 `effort` 投影 · 枚举 = 模型段在 `model:list` 的元素面；
 * **不可解 ⇒ 零节点 —— 禁假造**）· 各段体供 `settings.mjs` 段体分派（段体经 `deps` 注入取用两导出面
 * （`verifyControl`）与词表（`reasonWord`），本档零 import 反向（无环）—— **R7 起 = 六段体**（env ∕ models 两新段
 * 经本档 re-export 面入分派；MCP 体第三参 `deps` 供 `reasonWord` 出词）。
 * 导出面：`modelHeadNode` / `modelChoicesTree` 供首启向导第二步复用（单一 owner、零副本）；`tierFace` 供面模型取
 * 档位读数（`settings.mjs` `settingsModel`）；`providersBody` = D37 拆档 re-export（消费面零改）。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；零 `node:` / 零裸包 / 零 `store.mjs` import。
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
// 渠道族（行族 + 段体）随 D37 先拆后改出档 `./settings-sections-providers.mjs`；本档 re-export ⇒ 分派面零改。
export { providersBody } from "./settings-sections-providers.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 档位核心字面：`"none"` 语义由 `"off"` 承载（候选面滤值 —— 档位闭集口径；本档局部常量，零跨档共享面）。 */
const EFFORT_NONE = "none"

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

/** 候选行（**导出面** —— 同上）：行 + 空态词（`ready` 而零候选 ⇒ 禁假造）。行形 = 行自带渠 `{ id, provider }`
 *  （全渠扇出面 · #842）∥ 纯 id（常规面 —— 渠落段级）。 */
export function modelChoicesTree(model, handlers = {}) {
  const rows = listOf(model?.models).map((row) => modelRowNode(row, model, handlers))
  if (model?.state !== "ready" || rows.length > 0) return rows
  return [{ tag: "div", props: { class: "settings-empty", "data-empty": "" }, children: [t("settings.model.empty")] }]
}

/** 模型行：名 + 采用控件（当前项 / 无渠 ⇒ 非死控 = `disabled`）。**#842**：行自带渠（全渠扇出面）⇒ 名显示
 *  `provider · id`、「采用」按行自带渠（`onUseModel(provider, id)`）；行无渠 ⇒ 落段级激活渠（常规面判据零变）。 */
function modelRowNode(row, model, handlers) {
  const id = modelIdOf(row) ?? ""
  const own = row !== null && typeof row === "object" && typeof row.provider === "string" && row.provider !== "" ? row.provider : null
  const provider = own ?? (typeof model?.provider === "string" && model.provider !== "" ? model.provider : null)
  const current = model.current === `${provider}:${id}`
  const onUse = !current && typeof handlers?.onUseModel === "function" && provider !== null
    ? () => handlers.onUseModel(provider, id)
    : undefined
  return {
    tag: "div",
    props: { class: "settings-row", "data-model": id, "data-current": current ? "" : undefined },
    children: [{ tag: "span", props: { class: "settings-row-name" }, children: [own === null ? id : `${own} · ${id}`] }, {
      tag: "button",
      props: wire({
        class: "settings-row-action",
        type: "button",
        "data-action": "settings:useModel",
        "data-model": id,
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
