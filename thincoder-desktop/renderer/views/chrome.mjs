/**
 * chrome.mjs — 中区外壳面（`docs/desktop/design/UI.md` §1 会话头行 · §1「批 B 注」项 1 ·
 * `docs/desktop/design/RENDERER.md` §1.1）：会话头三段（model / tree / mount），挂载面 = 本档唯一触 DOM 处。
 *   ① 会话头：`headModel({ tab, meta })` / `headTree(model, handlers)` / `mountHead(root, state, handlers)` ——
 *      读切片 `activeSession` / `sessionMeta`（供给取面 = `sessionMetaOf(state)` ⇒ **本行** `sessionMeta[activeSession]`
 *      —— 整表不是一份供给；会话模型轮 R13：原 `activeTab` 切片随标签裁撤退场，活动键单源 = `activeSession`）。
 *   ② 状态行：本批自本档拆出（300 行拆分层预案落形 —— `docs/desktop/design/PROJECT.md` §4.2 状态行族档）
 *      ⇒ 语义单源 = `renderer/views/statusline.mjs`（D17 / D22 · 承载 16 段构树 + 薄挂载）；本档**同名再出口**
 *      （`statusModel` / `statusTree` / `mountStatus` —— 消费面零改）。
 *   ③ 位标词键表 `BADGE_WORD`（码 → 词键 —— 单一持有点）：两消费面 = 会话控制条目位标（`renderer/mount-sessions.mjs`）
 *      ∕ 状态行跨会话告警位（`renderer/views/statusline.mjs`）—— 同源同词（词键沿 `tab.badge.*` 族）。
 * 会话头字段（UI.md §1 会话头行槽序 · 「状态栏对齐」批 D22 **回三值**）：provider → model → effort（序单源在此，不随供给键序）；
 * `engineering` / `autoApprove` 两显示位**已撤**（两态呈现面单源 = 状态行段 —— `docs/desktop/design/UI.md` §1「本批注（状态栏对齐 · 屏面为准）」项 2；
 * 供给仍可携两键 ⇒ 本档不渲染 —— 负向锁）；只落**已给的非空串**值 —— 非串 / 空串 ⇒ 零节点（不补空位、不造形、不猜测）；零字段 ⇒ 根
 * `data-meta="none"`（供给未落 = 常态 —— 禁假数据，KD-e）。值 = 供给串**原样**（数据面非词表 —— 视图不造词）；
 * 例外 = `effort`：其值域含「未设」（`null` —— 批次档 §2.4 KD-17）⇒ 值取「非空串 ∥ `""`（= Auto · 未设）」。
 * 会话头三值就地可改（UI.md §1「批 B 注」项 1）：provider / model / effort 三字段内嵌 `select`（原生控件，
 * 锚仍 = `data-field` 字段节点）；工程模式 / AUTO 两位不在本项（呈现面单源 = 状态行段 —— 同注项 2）。候选面 =
 * `handlers.candidates()` ⇒ `{ providers, models }`（元素形同通道回执：`provider:list` 行 / `model:list` 逐项
 * `{ id, effortEnum, thinkOff }` —— 模型标识投影单源 = `views/settings-sections.mjs` `modelIdOf`）；
 * 选项集 = 候选 ∪ {现值}（现值缺于候选 ⇒ 追加 —— 禁吞）；候选面缺 ⇒ 仅 [现值]（禁假造替代项）；
 * `effort` 选项 = Auto（值 `""`）+ off（值 `"off"` —— 仅当该模型 `thinkOff` 真）+ 逐模型枚举（**滤掉
 * `"none"`**：档位闭集 = `null` ∥ `"off"` ∥ 枚举成员，语义由 `"off"` 承载 —— `docs/desktop/design/IPC.md` §2
 * 档位控件注）；`effort` 在场 ⟺ `model` 字段在场（档位候选逐模型 ⇒ 无模型无档位控件 —— 同注「模型段空 ⇒
 * 档位控件零节点」）。写面 = 通道 `session:prefs`（**接线住挂载档** `renderer/mount-head.mjs`：写路 + 回执刷行 +
 * 失败回退 —— 本档只出控件与供给取面）；控件两态沿房规（`views/chat.mjs` 头注通则）：handler 给 ⇒ `onChange`（值 `""` = Auto ⇒ `null` 出参），
 * 缺 ⇒ `disabled`（诚实非死控）。
 * 文案一律经 `t()`（零硬编码）；零 `node:` / 零裸包。
 * **对齐第三批（P23 忙态写门）**：本会话位标含 `running` ⇒ 三值就地控件 `disabled` + `aria-disabled`（控件**保位** ——
 * 信息面不撤；原生 `select` 无菜单面 ⇒ VSC `closeModelMenu` 零对位）；判据单源 = `busyOf`（写路入口同取 ——
 * `renderer/mount-head.mjs`）。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { modelIdOf } from "./settings-sections.mjs"
// 同名 re-export（消费面零改 —— 导入路径与名面保持；语义单源 = 状态行族档）。
export { mountStatus, statusModel, statusTree } from "./statusline.mjs"

/** 位标词键表（码 → 词键 —— 单一持有点，两消费面同引）：`approval` = 宿主新键（核无审批词条 —— KD-c）；
 *  `running` / `done` = 核状态词族键（词形单源）；`idle` **无词条**（零节点）。会话模型轮 R13：标签条面裁撤
 *  退场 ⇒ 本表迁入本档（两消费面 = 会话控制条目位标 ∕ 状态行告警位）。 */
export const BADGE_WORD = Object.freeze({
  approval: "tab.badge.approval",
  running: "sub.running",
  done: "sub.done",
})

/** 会话头字段槽序（UI.md §1 会话头行 · 「状态栏对齐」批 D22 回三值 —— 序不随供给键序）。 */
const FIELD_ORDER = Object.freeze(["provider", "model", "effort"])

/** 就地可改三值（UI.md §1「批 B 注」项 1 —— 工程模式 / AUTO 两位不在本集）；现阶段与槽序面重合（撤两键后）、含义仍分属两面（展示序 / 可改面）—— 非重复常量，勿并；树面 `headTree` 的 `field.value` 侧为防御分支（`headModel` 产出字段名恒 ∈ 本集 ⇒ 仅手造模型可达）。 */
const PICK_FIELDS = Object.freeze(["provider", "model", "effort"])

/** 档位滤词（`"none"` 不作独立档 —— 语义由 `"off"` 承载：`docs/desktop/design/IPC.md` §2 档位闭集）。 */
const EFFORT_NONE = "none"

/** 单字段供体（`null` ⇔ 未落 ⇒ 零字段节点）：`provider` / `model` / 其余两位 = 非空串（原规则）；`effort` =
 *  非空串 ∥ `""`（未设 ⇒ Auto），**在场 ⟺ `model` 在场**（档位候选逐模型 —— 无模型无档位控件）。 */
function fieldOf(name, source, hasModel) {
  if (name === "effort") return hasModel ? { name, value: typeof source.effort === "string" ? source.effort : "" } : null
  if (name === "model" && !hasModel) return null
  const value = source[name]
  return typeof value === "string" && value !== "" ? { name, value } : null
}

/** 忙态判据（P23 —— 本会话位标含 `running`；与输入区忙态同式 —— `renderer/mount-composer.mjs` `isBusy`，两面各持一份
 *  同形判据，避免跨面向下依赖；写路入口（`renderer/mount-head.mjs`）同取本函数 ⇒ 单源。 */
export function busyOf(state, key) {
  const codes = key === null || key === undefined ? null : state?.tabBadges?.[key]
  return Array.isArray(codes) && codes.includes("running")
}

/** 会话头模型：`tab` = 活动会话键（缺 ⇒ `null`；参数名沿在册 —— 机读锚 `data-tab` 不变）；`meta` = 会话级供给（缺 / 非载体 ⇒ 零字段）；`busy` = 忙态（P23 ——
 *  缺省假：直调面（旧夹具）行为零改）。 */
export function headModel({ tab = null, meta = null, busy = false } = {}) {
  const source = meta !== null && typeof meta === "object" ? meta : {}
  const hasModel = typeof source.model === "string" && source.model !== ""
  const fields = FIELD_ORDER.map((name) => fieldOf(name, source, hasModel)).filter((field) => field !== null)
  return { tab: tab == null ? null : String(tab), fields, busy: busy === true }
}

/** 结构描述符树（根：`data-tab` = 活动会话键（缺 ⇒ 零属性）· `data-meta` = `present` / `none`；字段 `data-field` 各一）。 */
export function headTree(model, handlers = {}) {
  const face = candidateFace(handlers)
  const chosen = model.fields.find((field) => field.name === "model")?.value ?? null
  const onField = typeof handlers?.onField === "function" ? handlers.onField : undefined
  return {
    tag: "div",
    props: {
      class: "head-fields",
      "data-meta": model.fields.length > 0 ? "present" : "none",
      ...(model.tab === null ? {} : { "data-tab": model.tab }),
    },
    children: model.fields.map((field) => ({
      tag: "span",
      props: { class: "head-field", "data-field": field.name },
      children: [PICK_FIELDS.includes(field.name) ? pickNode(field, face, chosen, onField, model.busy === true) : field.value],
    })),
  }
}

/** 候选面读（供给未落 / 非载体 ⇒ 空面 ⇒ 选项集退化为「仅现值」）：`handlers.candidates()` ⇒ `{ providers, models }`。 */
function candidateFace(handlers) {
  const raw = typeof handlers?.candidates === "function" ? handlers.candidates() : null
  const source = raw !== null && typeof raw === "object" ? raw : {}
  return { providers: listOf(source.providers), models: listOf(source.models) }
}

/** 数组载体（非数组 ⇒ 空集 —— 禁假造）。 */
function listOf(value) {
  return Array.isArray(value) ? value : []
}

/** provider 候选 → 名（`provider:list` 行形 `{ name, … }`；直测面可给串）；空名 / 非串非对象 ⇒ `null`（零假造）。 */
function providerNameOf(value) {
  if (typeof value === "string") return value === "" ? null : value
  const name = value?.name
  return typeof name === "string" && name !== "" ? name : null
}

/** 就地可改字段节点（`select` —— UI.md §1「批 B 注」项 1）：选项 = 选项集；两态 = handler 两态（沿房规）；
 *  **P23 忙态门**：`busy` 真 ⇒ `disabled` + `aria-disabled`（保位不撤 —— 写路入口另有一道忙判）。 */
function pickNode(field, face, chosen, onField, busy) {
  const props = { class: "head-pick", "aria-label": t(`head.field.${field.name}`) }
  if (busy === true) {
    props.disabled = true
    props["aria-disabled"] = "true"
  } else if (typeof onField === "function") props.onChange = (event) => acceptPick(event, field.name, onField)
  else props.disabled = true
  return {
    tag: "select",
    props,
    children: optionSet(field, face, chosen).map((option) => ({
      tag: "option",
      props: { value: option.value, ...(option.value === field.value ? { selected: true } : {}) },
      children: [option.word],
    })),
  }
}

/** 选项集（UI.md §1「批 B 注」项 1）：候选 ∪ {现值}（现值缺于候选 ⇒ 追加 —— 禁吞）。 */
function optionSet(field, face, chosen) {
  if (field.name === "effort") return effortOptions(field, face, chosen)
  const project = field.name === "provider" ? providerNameOf : modelIdOf
  const values = listOf(field.name === "provider" ? face.providers : face.models)
    .map(project)
    .filter((value) => value !== null)
  return [...new Set(values), ...(values.includes(field.value) ? [] : [field.value])]
    .map((value) => ({ value, word: value }))
}

/** 档位选项集（UI.md §1「批 B 注」项 1）：Auto（值 `""` = 未设）+ off（仅当该模型 `thinkOff` 真）+ 逐模型枚举
 *  （滤 `"none"` —— 语义由 `"off"` 承载）；候选面缺该模型 ⇒ 仅 Auto ∪ {现值}（禁假造）。 */
function effortOptions(field, face, chosen) {
  const entry = chosen === null ? null : face.models.find((row) => modelIdOf(row) === chosen) ?? null
  const options = [{ value: "", word: t("effort.auto") }]
  if (entry?.thinkOff === true) options.push({ value: "off", word: t("effort.off") })
  for (const member of listOf(entry?.effortEnum)) {
    if (typeof member !== "string" || member === "" || member === EFFORT_NONE) continue
    if (options.some((option) => option.value === member)) continue
    options.push({ value: member, word: member })
  }
  if (field.value !== "" && !options.some((option) => option.value === field.value)) options.push({ value: field.value, word: field.value })
  return options
}

/** 控件出口（写面 = 通道 `session:prefs` —— 接线住挂载面）：值 `""` = Auto ⇒ `null`（未设）；非串 ⇒ `null`。 */
function acceptPick(event, name, onField) {
  const raw = event?.target?.value ?? event?.currentTarget?.value
  const value = typeof raw === "string" ? raw : null
  onField(name, value === "" ? null : value)
}

/** 活动会话的会话级供给（读面单源：`sessionMeta[activeSession]` ⇒ 本行供给 —— 表 / 本键缺 ⇒ `null`；无活动会话
 *  ⇒ `null`。头面读面两处同用：构树薄挂载 `mountHead` + 接线档 `renderer/mount-head.mjs`）。 */
export function sessionMetaOf(state) {
  const key = state?.activeSession ?? null
  const table = state?.sessionMeta
  if (key === null || table === null || typeof table !== "object") return null
  return table[key] ?? null
}

/** 薄挂载（`activeSession` / `sessionMeta[activeSession]` / 位标忙态 ⇒ 会话头；`handlers` = 候选面 + 字段出口）；返回模型（读数 / 走查面）。 */
export function mountHead(root, state, handlers = {}) {
  if (!root || typeof root.append !== "function") return null
  const tab = state?.activeSession ?? null
  const model = headModel({ tab, meta: sessionMetaOf(state), busy: busyOf(state, tab) })
  clear(root)
  root.append(build(headTree(model, handlers)))
  return model
}
