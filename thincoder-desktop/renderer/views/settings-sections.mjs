/**
 * settings-sections.mjs — 设置面四段体（批 9 · 批档 §2.12–§2.13；自 `renderer/views/settings.mjs` 拆出
 * —— 300 行层拆分，零语义变化）：渠道 / 模型与档位 / agent 参数 / MCP，各一形。
 * 面形要点：档位（候选 = `model:list` 投影 × 当前读数 `defaultModel`；**档位无供给面 ⇒ 零节点 —— 禁假造**）·
 * agent 参数（敏感 / 非标量 ⇒ 只读回显，防把遮罩写回；提交只发变更路径——变更加工归提交端）·
 * MCP（探活失败零保存 = 主侧口径，端侧只呈现回执）· 渠道（行 + 校验结果 + 两形表单，`loading` 期零表单）。
 * 导出面：`modelHeadNode` / `modelChoicesTree` 供首启向导第二步复用（单一 owner、零副本）；四段体供
 * `settings.mjs` 段体分派——渠道体经 `deps` 注入取用两导出面（`verifyControl`）与词表（`reasonWord`），
 * 本档零 import 反向（无环）。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ⇒ `wire` 落 `disabled: true`；
 * 零 `node:` / 零裸包 / 零 `store.mjs` import。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** agent 段可编辑类型闭集（标量三型；`array` / `null` / 对象 ⇒ 只读行 —— 防类型损坏）。 */
const EDITABLE_KINDS = Object.freeze(["string", "number", "boolean"])

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

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

/** agent 字段行：敏感 / 非标量 ⇒ 只读回显（遮罩值直传，防把遮罩写回）；标量 ⇒ `name` = 点分路径。 */
function agentFieldNode(field) {
  const label = { tag: "label", props: { class: "settings-field-label", for: field.path }, children: [field.path] }
  const editable = field.sensitive !== true && EDITABLE_KINDS.includes(field.kind)
  if (editable) {
    const value = typeof field.value === "string" ? field.value : String(field.value ?? "")
    return {
      tag: "div",
      props: { class: "settings-field-row", "data-field": field.path },
      children: [label, { tag: "input", props: { class: "settings-field", id: field.path, name: field.path, type: "text", value } }],
    }
  }
  return {
    tag: "div",
    props: { class: "settings-field-row", "data-field": field.path, "data-readonly": "" },
    children: [label, { tag: "span", props: { class: "settings-field-readonly" }, children: [String(field.value ?? "")] },
      { tag: "span", props: { class: "settings-readonly-hint" }, children: [t("settings.agent.readonly")] }],
  }
}

/** agent 段体：字段行 + 保存控件（零可编辑字段 ⇒ 保存控件仍在场但 `disabled` —— 缺 handler 同判）。 */
export function agentBody(section, handlers) {
  const editable = section.fields.some((f) => f.sensitive !== true && EDITABLE_KINDS.includes(f.kind))
  const onSave = editable && typeof handlers?.onSaveAgent === "function" ? handlers.onSaveAgent : undefined
  return [...section.fields.map(agentFieldNode), {
    tag: "button",
    props: wire({ class: "settings-submit", type: "button", "data-action": "settings:saveAgent" }, onSave),
    children: [t("settings.agent.save")],
  }]
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

/** 模型段体：当前读数 + 候选行。 */
export function modelBody(section, handlers) {
  return [modelHeadNode(section), ...modelChoicesTree(section, handlers)]
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
