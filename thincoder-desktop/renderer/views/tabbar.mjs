/**
 * tabbar.mjs — 标签条面（`docs/desktop/design/UI.md` §1 标签条行 / 交互行 · §2 项 2 · `docs/desktop/design/RENDERER.md`
 * §1.1 键盘面）—— 批 A 自 `thincoder-desktop/renderer/views/sessions.mjs` 拆出（拆档锚 = `docs/desktop/design/PROJECT.md`
 * §4.1）：① 纯构树（零 DOM）= `tabbarModel` / `tabbarTree`；② 薄挂载 `mountTabbar`（触 DOM 处 = 清槽 + 构树 + 加速键接线）。
 * 接线（同档 §1 标签条行 / 交互行）：标签激活 / 关闭 / 新建；**关闭确认面** = `pendingClose` 命中 ⇒ 标签项 `data-confirm="1"`
 *   + 子序 [标签, 取消, 确认]（关闭控件**原位退出**；两键 = 文本按钮）—— 否 dialog / `window.confirm` / 超时自动消 /
 *   图标字形（字形住 `renderer/styles.css`）；位标四值优先序单源 = `renderer/store.mjs` `deriveTabBadge`（KD-d）。
 * **Tab 序收面（KD-15 · 零 `inert`）**：非活动项两控件（`tab:activate` / `tab:close`）各落 `tabindex="-1"` ——
 *   真意图 = 只收**键盘 Tab 序**（指针面照常）；`inert` 使子树对**全部**用户输入失效（含指针）⇒ 杀死同行
 *   「标签点按激活」，故不用。确认态例外：标签项 `data-confirm="1"` ⇒ 标签控件与两键**免** `-1`（决策面须键盘可达）。
 * **加速键面**：`acceleratorTab(event, keys)` 纯函数 —— `Ctrl/Cmd + 1..9` ∧ 第 N 档存在 ⇒ 返第 N 档键；第 N 档不存在 ∥
 *   表外键 ∥ 无修饰键 ⇒ `null`（调用方零动作 · **不吞键** = 不 `preventDefault`）。listener 取**文档级**（焦点在输入区
 *   时亦生效）；宿主读数持 `WeakMap` ⇒ 重挂只换读数、listener 恒一枚（不叠挂）。
 * 本档零 `node:` / 零裸包（渲染面闭包判据）；文案一律经 `t()`（零硬编码 —— 词表单源 = `renderer/i18n.mjs`）；
 * 词面只走 `aria-label` / 文本（字形住样式档，KD-f）。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { deriveTabBadge } from "../store.mjs"

/** 图标控件形（关闭 / 新建）：文案取**词键**，值按构树时现语言取（模块级常量不冻词面）。 */
const CLOSE_TAB = Object.freeze({ className: "tabbar-close", action: "tab:close", word: "tab.action.close" })
const NEW_TAB = Object.freeze({ className: "tabbar-new", action: "session:create", word: "rail.action.newSession" })
/** 确认面两键（同档 §1 交互行）：文本按钮（词面出串 —— **零字形**），DOM 序 = 取消 → 确认。 */
const CLOSE_CANCEL = Object.freeze({ className: "tabbar-cancel", action: "tab:close-cancel", word: "tab.action.close.cancel" })
const CLOSE_CONFIRM = Object.freeze({ className: "tabbar-confirm", action: "tab:close-confirm", word: "tab.action.close.confirm" })
/** 非活动项收 Tab 序值（KD-15）：只收键盘序（指针面照常 —— 点击激活不受影响）。 */
const TAB_STOP_OUT = "-1"

/** 位标词键表（码 → 词键）：`approval` = 宿主新键（核无审批词条 —— KD-c）；`running` / `done` = 核状态词族键
 *  （词形单源）；`idle` **无词条**（零节点）。状态栏告警位**同用此表**（同源同词 —— `renderer/views/chrome.mjs` 消费）。 */
export const BADGE_WORD = Object.freeze({
  approval: "tab.badge.approval",
  running: "sub.running",
  done: "sub.done",
})

/** 加速键宿主读数表（宿主 → `{ keys, activate }`）：重挂只换读数，listener 恒一枚。 */
const ACCELERATORS = new WeakMap()

/** 加速键纯函数（`Ctrl/Cmd + 1..9` ⇒ 第 N 档键）：命中 ⇒ 返该档键（激活面回代）；无修饰键 / 表外键 /
 *  第 N 档不存在 ⇒ `null` —— 调用方零动作**不吞键**（闭集外不夺键盘面）。`keys` = 标签键序（最窄契约）。 */
export function acceleratorTab(event, keys = []) {
  if (event?.ctrlKey !== true && event?.metaKey !== true) return null
  const key = event?.key
  if (typeof key !== "string" || key.length !== 1 || key < "1" || key > "9") return null
  const hit = Array.isArray(keys) ? keys[Number(key) - 1] : undefined
  if (hit === undefined || hit === null) return null
  return String(hit)
}

/** 加速键宿主（**文档级** —— 焦点在输入区时亦生效）：`ownerDocument` 可用 ⇒ 取之；平测桩 / 无文档面 ⇒ 退本根；
 *  两皆不可用 ⇒ `null`（零绑 —— 沿 `renderer/views/chat-scroll.mjs` 挂载守卫先例）。 */
function acceleratorHost(root) {
  const doc = root?.ownerDocument
  if (doc && typeof doc.addEventListener === "function") return doc
  return root && typeof root.addEventListener === "function" ? root : null
}

/** 加速键接线（重挂可重入）：首挂绑**一枚** `keydown`；命中 ⇒ `preventDefault()` + 激活回调（命中才吞键）。
 *  键序与激活面随每次挂载写入读数 ⇒ listener 恒一枚、不叠挂（宿主读数持 `WeakMap`）。 */
function bindAccelerator(root, model, handlers) {
  const host = acceleratorHost(root)
  if (host === null) return
  const previous = ACCELERATORS.get(host)
  ACCELERATORS.set(host, { keys: model.tabs.map((tab) => tab.key), activate: handlers.activate })
  if (previous !== undefined) return
  host.addEventListener("keydown", (event) => {
    const current = ACCELERATORS.get(host)
    if (current === undefined) return
    const key = acceleratorTab(event, current.keys)
    if (key === null || typeof current.activate !== "function") return
    event.preventDefault()
    current.activate(key)
  })
}

/** 标签条模型：`{ tabs: [{ key, title, active, badge, pendingClose }] }` —— 标题 = 命中行（`slot` 对键）且非空 ⇒
 *  原串，否则缺省词（**不猜** —— 与左列同律）；`badge` = `deriveTabBadge(badges[key] ?? [])`（优先序单源 = store，
 *  KD-d）；`pendingClose` = 本键命中待确认关闭（真值 ⇒ 确认面 —— 判据已在 store 出，本档只比键）。 */
export function tabbarModel({ tabs = [], activeTab = null, rows = [], badges = {}, pendingClose = null } = {}) {
  const list = Array.isArray(tabs) ? tabs : []
  const table = Array.isArray(rows) ? rows : []
  const badgeTable = badges !== null && typeof badges === "object" ? badges : {}
  const active = activeTab == null ? null : String(activeTab)
  const pending = pendingClose == null ? null : String(pendingClose)
  return {
    tabs: list.map((key) => {
      const hit = table.find((row) => row !== null && typeof row === "object" && String(row.slot) === String(key))
      return {
        key: String(key),
        title: typeof hit?.title === "string" && hit.title !== "" ? hit.title : t("rail.session.untitled"),
        active: String(key) === active,
        badge: deriveTabBadge(Array.isArray(badgeTable[key]) ? badgeTable[key] : []),
        pendingClose: String(key) === pending,
      }
    }),
  }
}

/** 结构描述符树（根 = 标签条容器锚 + `data-tabs` = 标签数）。`handlers` = 接线面 `{ onActivate, onClose,
 *  onConfirmClose, onCancelClose, onNew }`；两态落形 = `wire`（树形只随 handlers 与 `pendingClose` 变 —— 其余同形）。 */
export function tabbarTree(model, handlers = {}) {
  return {
    tag: "nav",
    props: { class: "tabbar", "data-slot": "tabs", "data-tabs": model.tabs.length },
    children: [...model.tabs.map((tab) => tabItem(tab, handlers)), iconControl(NEW_TAB, handlers.onNew)],
  }
}

/** 薄挂载（`tabs` / `activeTab` / `sessions` / `tabBadges` / `pendingClose` ⇒ 标签条）；返回模型（读数 / 走查面）。 */
export function mountTabbar(root, state, handlers = {}) {
  if (!root || typeof root.append !== "function") return null
  const model = tabbarModel({
    tabs: state?.tabs ?? [],
    activeTab: state?.activeTab ?? null,
    rows: state?.sessions ?? [],
    badges: state?.tabBadges ?? {},
    pendingClose: state?.pendingClose ?? null,
  })
  clear(root)
  root.append(build(tabbarTree(model, handlers)))
  bindAccelerator(root, model, { activate: handlers.onActivate })
  return model
}

/** 单标签：活动 ⇒ `data-active="1"`；非活动 ⇒ 两控件收 Tab 序（`confine` 面 —— **零 `inert`**）；子 = 标签控件 +
 *  关闭面 —— 常态 = 关闭控件；待确认（`pendingClose`）⇒ 标签项 `data-confirm="1"` + 两键 [取消, 确认]，关闭控件
 *  **原位退出** ∧ 三控**免** `-1`（同档 §1 交互行 · KD-15 确认态例外）。 */
function tabItem(tab, handlers) {
  const props = { class: "tabbar-item", "data-tab": tab.key }
  if (tab.active) props["data-active"] = "1"
  const confirm = tab.pendingClose === true
  const confined = tab.active !== true && !confirm
  const activate = tabControl(tab, handlers, confined)
  if (!confirm) {
    return { tag: "div", props, children: [activate, iconControl(CLOSE_TAB, withKey(handlers.onClose, tab.key), confined)] }
  }
  props["data-confirm"] = "1"
  return {
    tag: "div",
    props,
    children: [
      activate,
      textControl(CLOSE_CANCEL, handlers.onCancelClose),
      textControl(CLOSE_CONFIRM, handlers.onConfirmClose),
    ],
  }
}

/** 标签控件（两态 = `wire`；`onClick` 携本键 = 激活该标签）：子 = 标题 + 位标（空闲 / 表外码 ⇒ 空位跳过）；
 *  `confined` ⇒ `tabindex="-1"`（非活动 ∧ 非确认态 —— 收 Tab 序不收点击）。 */
function tabControl(tab, handlers, confined = false) {
  const props = { type: "button", class: "tabbar-tab", "data-action": "tab:activate" }
  if (confined) props.tabindex = TAB_STOP_OUT
  return {
    tag: "button",
    props: wire(props, withKey(handlers.onActivate, tab.key)),
    children: [
      { tag: "span", props: { class: "tabbar-title" }, children: [tab.title] },
      badgeNode(tab.badge),
    ],
  }
}

/** 位标节点（`data-badge` = 码 · 文本 = 词表键值）：表外码（含 `idle`）⇒ `null`（零节点 —— 不造词）。 */
function badgeNode(code) {
  const key = BADGE_WORD[code]
  if (typeof key !== "string") return null
  return { tag: "span", props: { class: "tabbar-badge", "data-badge": code }, children: [t(key)] }
}

/** 图标控件（关闭 / 新建；两态 = `wire`）：字形住 `styles.css`（KD-f），词面只走 `aria-label`（`t()` 在**构树时**
 *  取值 —— 词表可换语言）；词键表 = `CLOSE_TAB` / `NEW_TAB`（NEW_TAB 词面 = `rail.action.newSession`，与左列空态
 *  同键：同一事实同词）。`confined` ⇒ `tabindex="-1"`（关闭控件随本项收序；新建控件**不收**）。 */
function iconControl({ className, action, word }, onClick, confined = false) {
  const props = { type: "button", class: className, "data-action": action, "aria-label": t(word) }
  if (confined) props.tabindex = TAB_STOP_OUT
  return { tag: "button", props: wire(props, onClick), children: [] }
}

/** 确认面文本按钮（取消 / 确认）：词面 = 词键值（**零字形** —— 不出图标），锚 = class + `data-action`。 */
function textControl({ className, action, word }, onClick) {
  const props = { type: "button", class: className, "data-action": action }
  return { tag: "button", props: wire(props, onClick), children: [t(word)] }
}

/** 接线形通则（**单源** —— `docs/desktop/design/RENDERER.md` §1.1）：handlers 给 ⇒ 落 `onClick` 且无 `disabled`；
 *  缺 ⇒ `disabled: true`（诚实非死控：不落假接线、不留死控件）。拆档期取私有副本（同形同律 —— 与
 *  `renderer/views/sessions.mjs` / `chat-tool.mjs` 同源）。 */
function wire(props, onClick) {
  if (typeof onClick === "function") props.onClick = onClick
  else props.disabled = true
  return props
}

/** 键携带包装：handler 给 ⇒ 携本键闭包；缺 ⇒ `undefined`（交 `wire` 判两态）。 */
function withKey(handler, key) {
  return typeof handler === "function" ? () => handler(key) : undefined
}
