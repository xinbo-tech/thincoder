/**
 * settings-agent.mjs — 设置面 agent 段体（「桌面处理流 · VSC 对齐」批 R8 · 自 `renderer/views/settings-sections.mjs`
 * 拆出 —— 300 行层拆分，零语义变化）：可编辑类型闭集 ∕ 具名控件**十八键**表（`NAMED_FIELDS`）∕
 * 具名控件行与出值 ∕ `agentBody`。
 * 面形要点（随迁）：agent 参数（**具名控件十八键** + 即改即存 —— 「对齐第三批」P15 十键 + **R7 增
 * `agent.autoThink`**〔auto-think 档〕+ **B10 W3 增七键**：S10 子代理模型槽六件（`agent.subagentModel` +
 * `agent.subagentModels.{explore,plan,coder,eng-coder,eng-designer}` —— 模型**选择器**，候选 = `model:list`
 * 投影 · 写 `settings:agent` patch 同键 · 清空 = 删键）+ S14b guard 开关（`agent.advisor.guard` —— 值面 =
 * `sessionFlags` 槽投影，写经 `session:flags`）；S11 将 `agent.advisor.reasoningEffort` 改选项型；
 * 字段形态不齐（敏感 / 非标量 / slot 权威键）⇒ 该键不落行（零行 —— 防把遮罩 ∕ 类型腐坏写回）；
 * **控件型三值** = P14 **∘ B10 W3 三新（`model` ∕ `effort` 选择器 · `guard` 槽开关）**）。
 * 导出面零改：`settings-sections.mjs` 原档 re-export 本档两件（`NAMED_FIELDS` ∕ `agentBody`）——消费面
 * （`views/settings.mjs` 段体分派 · `renderer/mount-settings-exits.mjs` 写路 · 用例锁）import 面不动。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ⇒ 控件落 `disabled: true`；
 * 零 `node:` / 零裸包 / 零 `store.mjs` import。
 */
import { t } from "../i18n.mjs"

/** agent 段可编辑类型闭集（标量三型；`array` / `null` / 对象 ⇒ 不落具名控件（零行）—— 防类型损坏）。 */
const EDITABLE_KINDS = Object.freeze(["string", "number", "boolean"])

/** **自持值面**控件型（B10 W3）：值不取自读面字段类型门（选择器现值 ∕ 槽投影自持 —— 字段缺位 / 值形不齐
 *  照出空控件，禁假造值）：S10 模型槽 ∕ S11 推理档 ∕ S14b guard 开关。 */
const SELF_FACED_KINDS = Object.freeze(["model", "effort", "guard"])

/** agent 具名控件**十八键**（「对齐第三批」P15 十键 + R7 增 `agent.autoThink`〔auto-think 档〕+ B10 W3 七键
 *  —— 本表 = 键集 / 词键 / 表定控型三面单源）：
 *  `path` = 全点分路径（字段读面同域；缺字段面 ⇒ 表定控型照出空控件）；`kind` = 字段缺位时的控型回退；
 *  `text` = 字面标签（缺 ⇒ 词键 `word`，经 `t()`）；`scale` = 显示比例（`consultTimeoutMs` 显示单位 = 分钟 ——
 *  沿 VSC `webview/settings-agent.js:69` / `:119` 同式：读 ÷60000 · 写 ×60000）。
 *  `agent.advisor.reasoningEffort` = 核**读取键**单源（核 `config.mjs:49` 顾问覆写族列 `reasoningEffort`；VSC 写面同键
 *  `settings-panel-write.mjs:122-130`）；**S11 控型 = `effort` 选项**（候选 = `model:list` 该模型 `effortEnum` ∪
 *  off 两特值 —— 中性 `—` ∕ `none`）。
 *  `agent.autoThink`（R7）= 核 `DEFAULTS.agent.autoThink`（布尔，缺省 false——核 `config.mjs:50`）⇒ 分类器开关
 *  （VSC 侧消费点 = `src/agent.mjs:270`；核分类器单源 = `@thincoder/core/auto-think.mjs`）。
 *  **S10 六件**（子代理模型槽 —— VSC `settings-agent.js:27-29` 同序同角色集；值 = `provider:model` 复合串
 *  〔CLI 兼容〕；角色名 = 字面标签）；**S14b** `agent.advisor.guard`（会话槽面键 —— 值面 = `sessionFlags`
 *  切片投影，写经 `session:flags` 槽面；读面字段作 `taken` 排除防重复行）。
 */
export const NAMED_FIELDS = Object.freeze([
  { path: "agent.maxTurns", word: "settings.agent.maxTurns", kind: "number" },
  { path: "agent.subagentTurns", word: "settings.agent.subagentTurns", kind: "number" },
  { path: "agent.poolLimits.engCoder", word: "settings.agent.poolLimits.engCoder", kind: "number" },
  { path: "agent.poolLimits.other", word: "settings.agent.poolLimits.other", kind: "number" },
  { path: "agent.poolLimits.advisor", word: "settings.agent.poolLimits.advisor", kind: "number" },
  { path: "agent.compactThreshold", word: "settings.agent.compactThreshold", kind: "number" },
  { path: "agent.verifyGuard", word: "settings.agent.verifyGuard", kind: "boolean" },
  // S10 子代理模型槽六件（VSC `settings-agent.js:26-29` 段位：verifyGuard 之后、咨询参数之前）
  { path: "agent.subagentModel", word: "settings.submodelGlobal", kind: "model" },
  { path: "agent.subagentModels.explore", text: "explore", kind: "model" },
  { path: "agent.subagentModels.plan", text: "plan", kind: "model" },
  { path: "agent.subagentModels.coder", text: "coder", kind: "model" },
  { path: "agent.subagentModels.eng-coder", text: "eng-coder", kind: "model" },
  { path: "agent.subagentModels.eng-designer", text: "eng-designer", kind: "model" },
  { path: "agent.consultTurns", word: "settings.agent.consultTurns", kind: "number" },
  { path: "agent.consultTimeoutMs", word: "settings.agent.consultTimeoutMs", kind: "number", scale: 60000 },
  { path: "agent.advisor.reasoningEffort", word: "settings.agent.advisorEffort", kind: "effort" },
  // S14b guard 开关（VSC `settings-agent.js:58` advisor 段位：effort 之后）
  { path: "agent.advisor.guard", word: "settings.advisorGuard", kind: "guard" },
  { path: "agent.autoThink", word: "settings.agent.autoThink", kind: "boolean" },
])

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 非空串归一：非串 / 空串 ⇒ `null`（禁假造）。 */
const str = (value) => (typeof value === "string" && value !== "" ? value : null)

/** 字段表（路径 → 字段记录；缺 / 非数组 ⇒ 空表）。 */
function fieldsOf(section) {
  const out = new Map()
  for (const field of listOf(section?.fields)) if (typeof field?.path === "string" && field.path !== "") out.set(field.path, field)
  return out
}

/** 子代理模型槽现值（S10：值 = `provider:model` 复合串原样；非串 / 缺 ⇒ `""`）。 */
function modelValueOf(fields, path) {
  const field = fields.get(path)
  return typeof field?.value === "string" ? field.value : ""
}

/** advisor 推理档现值投影（S11 —— VSC `settings-state.js` `advisorEffortCurrent` 同序）：`thinking` 两 off 形
 *  （`null` 字面 ∕ `{type:"disabled"}` 的 `.type` 叶）⇒ `"none"`；否则 `reasoningEffort` 串；再缺席 ⇒ `""`（中性）。 */
function advisorEffortValue(fields) {
  const thinking = fields.get("agent.advisor.thinking")
  const typeLeaf = fields.get("agent.advisor.thinking.type")
  if ((thinking !== undefined && thinking.value === null) || (typeLeaf !== undefined && typeLeaf.value === "disabled")) return "none"
  const effort = fields.get("agent.advisor.reasoningEffort")
  return typeof effort?.value === "string" ? effort.value : ""
}

/** advisor 推理档候选归属模型（S11）：`section.advisorModel`（归一已含回落链：覆写 ⇒ 渠默认 ⇒ 主模型段，
 *  与主侧写面同源同序 —— S11 收正 · 顾问评审 🟡2；缺 ⇒ `null` 即枚举空，零假造）。 */
const advisorTargetOf = (section) => str(section?.advisorModel)

/** 选项集（值字面）：占位项恒首（值 `""`）+ 逐候选去重 + **表外现值自成一选项**（禁吞 · 零改写——
 *  沿 models 段 picker 同律）。 */
function selectOptions(values, current, placeholder) {
  const seen = new Set()
  const list = []
  for (const value of values) {
    if (typeof value !== "string" || value === "" || seen.has(value)) continue
    seen.add(value)
    list.push(value)
  }
  if (current !== "" && !seen.has(current)) list.unshift(current)
  const head = { tag: "option", props: current === "" ? { value: "", selected: true } : { value: "" }, children: [placeholder] }
  return [head, ...list.map((value) => ({
    tag: "option",
    props: value === current ? { value, selected: true } : { value },
    children: [value],
  }))]
}

/** 子代理模型槽选项（S10）：候选 = `model:list` 投影（激活渠 —— 值 = `provider:id` 复合串）+ 占位
 *  `Inherit`（值 `""` = 清槽）。无激活渠 ⇒ 只余占位与表外现值（禁假造候选）。 */
function submodelOptions(section, current) {
  const provider = str(section?.provider)
  const ids = listOf(section?.models).map((row) => row?.id).filter((id) => typeof id === "string" && id !== "")
  const values = provider === null ? [] : ids.map((id) => `${provider}:${id}`)
  return selectOptions(values, current, t("settings.inherit"))
}

/** advisor 推理档选项（S11）：占位 `—`（值 `""` = 中性 ⇒ 删两记）+ `none`（关思考 ⇒ 族别 off 形）
 *  + 该模型 `effortEnum`（滤 `"none"` ∕ `"enabled"` ∕ 空串 —— 两特值已占位）+ 表外现值自成一选项（禁吞）。 */
function effortOptions(section, current) {
  const target = advisorTargetOf(section)
  const entry = listOf(section?.models).find((row) => row?.id === target)
  const levels = listOf(entry?.effortEnum).filter((level) => typeof level === "string" && level !== "" && level !== "none" && level !== "enabled")
  return selectOptions(["none", ...levels], current, t("settings.noneMark"))
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
 *  （即改即存 —— 无保存键参与）；handler 缺 ⇒ 控件 `disabled`（锚恒在 —— 诚实非死控）。
 *  **B10 W3 三新控型**：`model` ∕ `effort` = `select`（现值 / 候选 = `section` 切片投影，空选 = 显式清除）；
 *  `guard` = 会话槽开关（值 = `section.guard` 槽投影；未知 ⇒ `disabled` 禁假造；写经 `handlers.onToggleGuard`
 *  —— `session:flags` 槽面，不走 patch）。 */
function namedFieldNode(entry, field, section, handlers) {
  const id = entry.path
  const fields = fieldsOf(section)
  const onNamed = typeof handlers?.onNamedField === "function" ? (event) => handlers.onNamedField(entry, event) : undefined
  let control
  if (entry.kind === "guard") {
    const live = typeof section?.guard === "boolean"
    const onToggle = typeof handlers?.onToggleGuard === "function" ? (event) => handlers.onToggleGuard(event) : undefined
    const props = { class: "settings-field", id, type: "checkbox", checked: live && section.guard === true ? true : undefined }
    control = { tag: "input", props: live && onToggle !== undefined ? { ...props, onChange: onToggle } : { ...props, disabled: true } }
  } else if (entry.kind === "model" || entry.kind === "effort") {
    const current = entry.kind === "model" ? modelValueOf(fields, id) : advisorEffortValue(fields)
    const options = entry.kind === "model" ? submodelOptions(section, current) : effortOptions(section, current)
    const props = { class: "settings-field", id }
    control = { tag: "select", props: onNamed === undefined ? { ...props, disabled: true } : { ...props, onChange: onNamed }, children: options }
  } else if (entry.kind === "boolean") {
    const props = { class: "settings-field", id, type: "checkbox", checked: field?.value === true ? true : undefined }
    control = { tag: "input", props: onNamed === undefined ? { ...props, disabled: true } : { ...props, onChange: onNamed } }
  } else {
    const props = { class: "settings-field", id, type: entry.kind === "number" ? "number" : "text", value: namedValueText(entry, field) }
    control = { tag: "input", props: onNamed === undefined ? { ...props, disabled: true } : { ...props, onChange: onNamed } }
  }
  return {
    tag: "div",
    props: { class: "settings-field-row", "data-field-name": id },
    children: [{ tag: "label", props: { class: "settings-field-label", for: id }, children: [entry.text ?? t(entry.word)] }, control],
  }
}

/** agent 段体：**具名控件区**（十八键 · P15 —— 字段缺位亦在场〔空值控件，禁假造值〕；自持值面三型
 *  〔model ∕ effort ∕ guard〕不受读面类型门约束；字段在场而敏感 / 非标量 / slot 权威键（`slotAuthority`）⇒ 不落具名控件（零行））。 */
export function agentBody(section, handlers) {
  const fields = listOf(section?.fields)
  const byPath = new Map()
  for (const field of fields) if (typeof field?.path === "string" && field.path !== "") byPath.set(field.path, field)
  const named = NAMED_FIELDS.filter((entry) => {
    if (SELF_FACED_KINDS.includes(entry.kind)) return true
    const field = byPath.get(entry.path)
    return field === undefined || (field.sensitive !== true && EDITABLE_KINDS.includes(field.kind))
  })
  return named.map((entry) => namedFieldNode(entry, byPath.get(entry.path), section, handlers))
}
