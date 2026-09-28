/**
 * settings-agent.mjs — 设置面 agent 段体（「桌面处理流 · VSC 对齐」批 R8 · 自 `renderer/views/settings-sections.mjs`
 * 拆出 —— 300 行层拆分，零语义变化）：可编辑类型闭集 ∕ 具名控件**十一键**表（`NAMED_FIELDS`）∕ agent 字段行 ∕
 * 具名控件行与出值 ∕ `agentBody`。
 * 面形要点（随迁）：agent 参数（**具名控件十一键** + 即改即存 —— 「对齐第三批」P15 十键 + **R7 增
 * `agent.autoThink`**〔auto-think 档 —— `agent` 族扩：核分类器开关，键面 = 核 `DEFAULTS.agent.autoThink`］；
 * 敏感 / 非标量 ⇒ 只读回显，
 * 防把遮罩写回；泛化兜底行提交只发变更路径——变更加工归提交端；**控件型三值** = P14）。
 * 导出面零改：`settings-sections.mjs` 原档 re-export 本档两件（`NAMED_FIELDS` ∕ `agentBody`）——消费面
 * （`views/settings.mjs` 段体分派 · `renderer/mount-settings-exits.mjs` 写路 · 用例锁）import 面不动。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ⇒ `wire` 落 `disabled: true`；
 * 零 `node:` / 零裸包 / 零 `store.mjs` import。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** agent 段可编辑类型闭集（标量三型；`array` / `null` / 对象 ⇒ 只读行 —— 防类型损坏）。 */
const EDITABLE_KINDS = Object.freeze(["string", "number", "boolean"])

/** agent 具名控件**十一键**（「对齐第三批」P15 十键 + R7 增 `agent.autoThink`〔auto-think 档〕——
 *  本表 = 键集 / 词键 / 表定控型三面单源）：
 *  `path` = 全点分路径（字段读面同域；缺字段面 ⇒ 表定控型照出空控件）；`kind` = 字段缺位时的控型回退；
 *  `scale` = 显示比例（`consultTimeoutMs` 显示单位 = 分钟 —— 沿 VSC `webview/settings-agent.js:69` / `:119` 同式：
 *  读 ÷60000 · 写 ×60000）。
 *  `agent.advisor.reasoningEffort` = 核**读取键**单源（核 `config.mjs:49` 顾问覆写族列 `reasoningEffort`；VSC 写面同键
 *  `settings-panel-write.mjs:122-130`）——设计行（`docs/desktop/design/UI.md:401`）的 `advisor.effort` = 短名写法
 *  （**非盘上键**：核不读该名 ⇒ 本表不作读面兜底；盘上若只有该名，键落泛化兑底行（可编 / 可存），具名控件零假造値）。
 *  `agent.autoThink`（R7）= 核 `DEFAULTS.agent.autoThink`（布尔，缺省 false——核 `config.mjs:50`）⇒ 分类器开关
 *  （VSC 侧消费点 = `src/agent.mjs:270`；核分类器单源 = `@thincoder/core/auto-think.mjs`）。
 */
export const NAMED_FIELDS = Object.freeze([
  { path: "agent.maxTurns", word: "settings.agent.maxTurns", kind: "number" },
  { path: "agent.subagentTurns", word: "settings.agent.subagentTurns", kind: "number" },
  { path: "agent.poolLimits.engCoder", word: "settings.agent.poolLimits.engCoder", kind: "number" },
  { path: "agent.poolLimits.other", word: "settings.agent.poolLimits.other", kind: "number" },
  { path: "agent.poolLimits.advisor", word: "settings.agent.poolLimits.advisor", kind: "number" },
  { path: "agent.compactThreshold", word: "settings.agent.compactThreshold", kind: "number" },
  { path: "agent.verifyGuard", word: "settings.agent.verifyGuard", kind: "boolean" },
  { path: "agent.consultTurns", word: "settings.agent.consultTurns", kind: "number" },
  { path: "agent.consultTimeoutMs", word: "settings.agent.consultTimeoutMs", kind: "number", scale: 60000 },
  { path: "agent.advisor.reasoningEffort", word: "settings.agent.advisorEffort", kind: "string" },
  { path: "agent.autoThink", word: "settings.agent.autoThink", kind: "boolean" },
])

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** agent 字段行（泛化兜底面 —— 表外标量键）：敏感 / 非标量 ⇒ 只读回显（遮罩值直传，防把遮罩写回）；标量 ⇒ `name` = 点分路径。
 *  **P14 类型加工**：控件型按 `field.kind` 三值（`string` ⇒ `text` ∥ `number` ⇒ `number` ∥ `boolean` ⇒ `checkbox`）；
 *  出值规范化归取值面（`renderer/mount-settings-exits.mjs` —— 本档零值逻辑）。 */
function agentFieldNode(field) {
  const label = { tag: "label", props: { class: "settings-field-label", for: field.path }, children: [field.path] }
  const editable = field.sensitive !== true && EDITABLE_KINDS.includes(field.kind)
  if (editable) {
    const control = field.kind === "boolean"
      ? { tag: "input", props: { class: "settings-field", id: field.path, name: field.path, type: "checkbox", checked: field.value === true ? true : undefined } }
      : {
        tag: "input",
        props: {
          class: "settings-field", id: field.path, name: field.path,
          type: field.kind === "number" ? "number" : "text",
          value: typeof field.value === "string" ? field.value : String(field.value ?? ""),
        },
      }
    return { tag: "div", props: { class: "settings-field-row", "data-field": field.path }, children: [label, control] }
  }
  return {
    tag: "div",
    props: { class: "settings-field-row", "data-field": field.path, "data-readonly": "" },
    children: [label, { tag: "span", props: { class: "settings-field-readonly" }, children: [String(field.value ?? "")] },
      { tag: "span", props: { class: "settings-readonly-hint" }, children: [t("settings.agent.readonly")] }],
  }
}

/** 具名控件显示值（`scale` 面：显单位 = 分钟 ⇒ ÷60000 取整 —— 非数 / 缺 ⇒ 空串，禁假造）。 */
function namedValueText(entry, field) {
  if (field === undefined) return ""
  const value = field.value
  if (entry.scale === undefined) return typeof value === "string" ? value : String(value ?? "")
  const num = Number(value)
  return Number.isFinite(num) ? String(Math.round(num / entry.scale)) : ""
}

/** 具名控件行（P15 —— 词键标签 + 表定控型 + 锚 `data-field-name`＝全路径；`change` 经 `handlers.onNamedField` 直发
 *  （即改即存 —— 无保存键参与）；handler 缺 ⇒ 控件 `disabled`（锚恒在 —— 诚实非死控）。 */
function namedFieldNode(entry, field, handlers) {
  const props = { class: "settings-field", id: entry.path }
  if (typeof handlers?.onNamedField === "function") props.onChange = (event) => handlers.onNamedField(entry, event)
  else props.disabled = true
  const control = entry.kind === "boolean"
    ? { tag: "input", props: { ...props, type: "checkbox", checked: field?.value === true ? true : undefined } }
    : { tag: "input", props: { ...props, type: entry.kind === "number" ? "number" : "text", value: namedValueText(entry, field) } }
  return {
    tag: "div",
    props: { class: "settings-field-row", "data-field-name": entry.path },
    children: [{ tag: "label", props: { class: "settings-field-label", for: entry.path }, children: [t(entry.word)] }, control],
  }
}

/** agent 段体：**具名控件区**（十键 · P15 —— 字段缺位亦在场〔空值控件，禁假造值〕；字段在场而敏感 / 非标量 ⇒
 *  不落具名控件，归下行只读面）+ **泛化兜底行**（表外标量键 —— 保留编辑 + 保存键：零能力削减）+ 保存控件
 *  （零泛化可编辑字段 ⇒ 控件仍在场但 `disabled` —— 缺 handler 同判；具名面不经此键）。 */
export function agentBody(section, handlers) {
  const fields = listOf(section?.fields)
  const byPath = new Map()
  for (const field of fields) if (typeof field?.path === "string" && field.path !== "") byPath.set(field.path, field)
  const named = NAMED_FIELDS.filter((entry) => {
    const field = byPath.get(entry.path)
    return field === undefined || (field.sensitive !== true && EDITABLE_KINDS.includes(field.kind))
  })
  const taken = new Set(named.map((entry) => entry.path))
  const rows = fields.filter((field) => !taken.has(field.path))
  const editable = rows.some((f) => f.sensitive !== true && EDITABLE_KINDS.includes(f.kind))
  const onSave = editable && typeof handlers?.onSaveAgent === "function" ? handlers.onSaveAgent : undefined
  return [...named.map((entry) => namedFieldNode(entry, byPath.get(entry.path), handlers)), ...rows.map(agentFieldNode), {
    tag: "button",
    props: wire({ class: "settings-submit", type: "button", "data-action": "settings:saveAgent" }, onSave),
    children: [t("settings.agent.save")],
  }]
}
