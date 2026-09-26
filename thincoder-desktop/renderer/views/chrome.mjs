/**
 * chrome.mjs — 中区外壳面（`docs/desktop/design/UI.md` §1 会话头行 / 状态栏行 · §2 项 2 ·
 * `docs/desktop/design/RENDERER.md` §1.1）：各三段（model / tree / mount），挂载面 = 本档唯一触 DOM 处。
 *   ① 会话头：`headModel({ tab, meta })` / `headTree(model)` / `mountHead(root, state)` —— 读切片 `activeTab` /
 *      `sessionMeta`；② 状态栏：`statusModel({ tabs, activeTab, badges })` / `statusTree(model)` /
 *      `mountStatus(root, state)` —— 读切片 `tabs` / `activeTab` / `tabBadges`。
 * 会话头字段（UI.md §1 会话头行槽序）：provider → model → effort → engineering → autoApprove（序单源在此，
 * 不随供给键序）；只落**已给的非空串**值 —— 非串 / 空串 ⇒ 零节点（不补空位、不造形、不猜测）；零字段 ⇒ 根
 * `data-meta="none"`（供给未落 = 常态 —— 禁假数据，KD-e）。值 = 供给串**原样**（数据面非词表 —— 视图不造词）。
 * 状态栏告警位（`statusModel`）：告警码 = **非活动**标签的位标码 ∈ {approval, running}（活动标签的位标由
 * 标签条承载 —— 同一事实只出现一处）；词面 = `BADGE_WORD[码]`（与标签位**同源同词** —— UI.md:19）；序 =
 * 标签序；`done` / `idle` 不入告警。位标码单源 = `renderer/store.mjs:100-105` `deriveTabBadge`（视图不复写
 * 优先序 —— KD-d）。活动会话上下文读数面供给未落 ⇒ 零读数节点（本批只落告警位 —— 不落占位假串）。
 * 本档零控件（零 `data-action`）⇒ 无未接线面。文案一律经 `t()`（零硬编码）；零 `node:` / 零裸包。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { deriveTabBadge } from "../store.mjs"
import { BADGE_WORD } from "./sessions.mjs"

/** 会话头字段槽序（UI.md §1 会话头行 —— 序不随供给键序）。 */
const FIELD_ORDER = Object.freeze(["provider", "model", "effort", "engineering", "autoApprove"])

/** 告警码集（状态栏取值 = 三码中入告警的子集；`done` / `idle` 不入 —— 完成 / 空闲非跨会话告警面）。 */
const ALERT_CODES = Object.freeze(["approval", "running"])

/** 会话头模型：`tab` = 活动标签键（缺 ⇒ `null`）；`meta` = 会话级供给（缺 / 非载体 ⇒ 零字段）。 */
export function headModel({ tab = null, meta = null } = {}) {
  const source = meta !== null && typeof meta === "object" ? meta : {}
  const fields = FIELD_ORDER
    .filter((name) => typeof source[name] === "string" && source[name] !== "")
    .map((name) => ({ name, value: source[name] }))
  return { tab: tab == null ? null : String(tab), fields }
}

/** 结构描述符树（根：`data-tab` = 活动标签键（缺 ⇒ 零属性）· `data-meta` = `present` / `none`；字段 `data-field` 各一）。 */
export function headTree(model) {
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
      children: [field.value],
    })),
  }
}

/** 薄挂载（`activeTab` / `sessionMeta` ⇒ 会话头）；返回模型（读数 / 走查面）。 */
export function mountHead(root, state) {
  if (!root || typeof root.append !== "function") return null
  const model = headModel({ tab: state?.activeTab ?? null, meta: state?.sessionMeta ?? null })
  clear(root)
  root.append(build(headTree(model)))
  return model
}

/** 状态栏模型：`alerts` = 告警节点集（序 = 标签序）；`badges` 非载体 / 缺键 ⇒ 该标签按空集判（空闲）；
 *  告警码须有词键（与标签位同源同词）⇒ 无词键的码不落节点（防 `t()` 把 `undefined` 变字面文本）。 */
export function statusModel({ tabs = [], activeTab = null, badges = {} } = {}) {
  const list = Array.isArray(tabs) ? tabs : []
  const table = badges !== null && typeof badges === "object" ? badges : {}
  const active = activeTab == null ? null : String(activeTab)
  const alerts = []
  for (const key of list) {
    if (String(key) === active) continue
    const code = deriveTabBadge(Array.isArray(table[key]) ? table[key] : [])
    if (ALERT_CODES.includes(code) && typeof BADGE_WORD[code] === "string") alerts.push({ tab: String(key), code })
  }
  return { alerts }
}

/** 结构描述符树（根 `data-alerts` = 告警数；告警节点 `data-alert` = 码 · `data-tab` = 标签键 · 文本 = 位标词键值）。 */
export function statusTree(model) {
  return {
    tag: "div",
    props: { class: "status-bar", "data-alerts": model.alerts.length },
    children: model.alerts.map((alert) => ({
      tag: "span",
      props: { class: "status-alert", "data-alert": alert.code, "data-tab": alert.tab },
      children: [t(BADGE_WORD[alert.code])],
    })),
  }
}

/** 薄挂载（`tabs` / `activeTab` / `tabBadges` ⇒ 状态栏）；返回模型（读数 / 走查面）。 */
export function mountStatus(root, state) {
  if (!root || typeof root.append !== "function") return null
  const model = statusModel({
    tabs: state?.tabs ?? [],
    activeTab: state?.activeTab ?? null,
    badges: state?.tabBadges ?? {},
  })
  clear(root)
  root.append(build(statusTree(model)))
  return model
}
