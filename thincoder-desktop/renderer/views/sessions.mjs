/**
 * sessions.mjs — 会话族视图面（`docs/desktop/design/UI.md` §1 左列会话行 / 布局行 / 标签条行 · §2 项 2 ·
 * `docs/desktop/design/RENDERER.md` §1.1）：
 *   ① **纯构树**（零 DOM）：`railModel({ projectCwd, recent, rows })` → 态对象；`railTree(model, handlers)` →
 *      结构描述符树（根 `data-state` = 态）；② **标签条**：`tabbarModel({ tabs, activeTab, rows, badges })` →
 *      模型 · `tabbarTree(model, handlers)` → 结构描述符树（根 `nav[data-slot="tabs"][data-tabs=N]` —— 溢出
 *      面机读锚 = 标签数）；③ **薄挂载**：`mountRail(root, state, handlers)` / `mountTabbar(root, state, handlers)`
 *      = `*Model` + `clear` + `build` + `append`（本档**唯一触 DOM 处**）。
 * 三态（`docs/desktop/design/UI.md`:13,22,23 · 批档 §2.4（d））：无当前项目 ⇒ `boot`（打开目录入口 + 最近目录列表，
 * **零会话行**）；有项目无行 ⇒ `empty`（会话区标题 + 空态提示 + 新建入口）；有行 ⇒ `list`（会话行）。
 * 行映射（批档 §2.4（e））：`title` 空 ⇒ `t("rail.session.untitled")`；`createdBy` ∈ `cli|vscode|desktop` ⇒
 * `t("origin.<值>")`，`""` / 未知值 ⇒ **无标节点**（不猜测 —— `docs/desktop/design/UI.md` §2 项 3）；`isActive`
 * ⇒ 行 `data-active="1"`。
 * **接线形通则**（`docs/desktop/design/RENDERER.md` §1.1 = 单源；本档 `wire()` 一处落形）：handlers 给 ⇒ 落
 * `onClick` 且**无** `disabled`；缺省 ⇒ `disabled: true` + `data-action`（**诚实非死控**——树形只随 handlers 变）。
 * 左列接线（`docs/desktop/design/UI.md` §1 左列会话行）= 点行 `session:switch`（激活 = 切换会话，与标签条同一路）
 * · 空态新建入口 `session:create`；标签条接线（同档 §1 标签条行 / 交互行）= 标签激活 / 关闭（状态码集需确认 ⇒
 * 确认面）/ 新建；非活动标签 `inert`（不收 Tab 序）；位标四值优先序单源 = store `deriveTabBadge`（视图只消费 ——
 * KD-d）；**关闭确认面** = `pendingClose` 命中 ⇒ 标签项 `data-confirm="1"` + 子序 [标签, 取消, 确认]（关闭控件
 * **原位退出**；两键 = 文本按钮，词键 `tab.action.close.cancel` / `tab.action.close.confirm`）——否 dialog /
 * `window.confirm` / 超时自动消 / 图标字形（判据单源 = store `needsCloseConfirm`）；字形住 `renderer/styles.css`
 * （`content`），词面只走 `aria-label`（KD-f）。
 * 文案一律经 `t()`（本档零硬编码 —— 词表单源 = `renderer/i18n.mjs`）。零 `node:` / 零裸包（渲染面闭包判据）。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { deriveTabBadge } from "../store.mjs"

/** 来源端闭集（核 `createdBy` 三值）：其余（含 `""`）⇒ 无标。 */
const ORIGINS = Object.freeze(["cli", "vscode", "desktop"])

/** 态判定：无 `cwd` ⇒ `boot`；有 `cwd` 无行 ⇒ `empty`；有行 ⇒ `list`（`recent` / `rows` 非载体 ⇒ 空集防御）。 */
export function railModel({ projectCwd = null, recent = [], rows = [] } = {}) {
  const list = Array.isArray(rows) ? rows : []
  return {
    state: projectCwd ? (list.length > 0 ? "list" : "empty") : "boot",
    recent: Array.isArray(recent) ? recent : [],
    rows: list,
  }
}

/** 结构描述符树（根 `data-state` = 态）。`handlers` = 接线面 `{ onOpenDir, onOpenRecent, onSession, onNewSession }`
 *  —— 两态落形 = `wire`（树形只随 handlers 变，其余同形）。 */
export function railTree(model, handlers = {}) {
  return {
    tag: "div",
    props: { class: "rail-sections", "data-state": model.state },
    children: sections(model, handlers),
  }
}

/** 薄挂载：状态树切片（`project` / `sessions`）⇒ 三态树；返回模型（读数 / 走查面）。 */
export function mountRail(root, state, handlers = {}) {
  if (!root || typeof root.append !== "function") return null
  const model = railModel({
    projectCwd: state?.project?.cwd ?? null,
    recent: state?.project?.recent ?? [],
    rows: state?.sessions ?? [],
  })
  clear(root)
  root.append(build(railTree(model, handlers)))
  return model
}

/** 态 → 区块集（三态互斥 —— 启动态只落项目区 + 最近目录区，**零会话行**）。 */
function sections(model, handlers) {
  if (model.state === "boot") return [projectSection(handlers), recentSection(model.recent, handlers)]
  return [sessionsSection(model.state === "empty" ? [emptyHint(), newSessionEntry(handlers)] : [rowsList(model.rows, handlers)])]
}

/** 启动态项目区：无项目提示 + 打开目录入口（入口单键 = `rail.action.openDir` —— 决策 D-6）。 */
function projectSection(handlers) {
  return section("project", [
    heading(t("rail.project.none")),
    control({ label: t("rail.action.openDir"), action: "project:open", onClick: handlers.onOpenDir }),
  ])
}

/** 启动态最近目录区：条目序 = 输入序；点项直接进入（`docs/desktop/design/UI.md`:23）—— `project:open` 带 `path`。 */
function recentSection(recent, handlers) {
  const items = recent.map((entry) => item([
    control({
      label: entry.cwd, action: "project:open", data: { "data-path": entry.cwd },
      onClick: withKey(handlers.onOpenRecent, entry.cwd),
    }),
  ]))
  return section("recent", [heading(t("rail.recent.title")), list("recent", items)])
}

/** 会话区（`empty` / `list` 两态共用外壳 —— 标题恒在）。 */
function sessionsSection(children) {
  return section("sessions", [heading(t("rail.sessions.title")), ...children])
}

/** 空态提示（有项目无会话）。 */
function emptyHint() {
  return { tag: "p", props: { class: "rail-hint" }, children: [t("rail.empty.hint")] }
}

/** 空态新建入口（两态 = `wire`）：接线 ⇒ `onNewSession`（落 `session:create` 通道）。 */
function newSessionEntry(handlers) {
  return control({ label: t("rail.action.newSession"), action: "session:create", onClick: handlers.onNewSession })
}

/** 会话行列表（行序 = 输入序 = 核投影序）。 */
function rowsList(rows, handlers) {
  return list("sessions", rows.map((row) => rowItem(row, handlers)))
}

/** 会话行：标题 + 来源端标（未知 ⇒ 无标）；点击 = **激活并成标签**（`data-action` = `session:switch` —— 与标签点击
 *  同一路，机读值与行为一致 KD-f）；两态 = `wire`。 */
function rowItem(row, handlers) {
  const props = {
    type: "button", class: "rail-row", "data-action": "session:switch", "data-slot": String(row.slot),
  }
  if (row.isActive === true) props["data-active"] = "1"
  const button = { tag: "button", props: wire(props, withKey(handlers.onSession, String(row.slot))), children: [rowTitle(row), originLabel(row.createdBy)] }
  return item([button])
}

/** 行标题：空 ⇒ 缺省词（**非空串** —— 批档 §2.4（e））。 */
function rowTitle(row) {
  const label = typeof row.title === "string" && row.title !== "" ? row.title : t("rail.session.untitled")
  return { tag: "span", props: { class: "rail-row-title" }, children: [label] }
}

/** 来源端标：三值闭集 ⇒ 端标（`data-origin` = 机读面）；`""` / 未知 ⇒ `null`（空位跳过 —— 不猜测）。 */
function originLabel(createdBy) {
  if (!ORIGINS.includes(createdBy)) return null
  return { tag: "span", props: { class: "rail-origin", "data-origin": createdBy }, children: [t(`origin.${createdBy}`)] }
}

/** 区块容器（`data-section` = 机读面）。 */
function section(name, children) {
  return { tag: "section", props: { class: "rail-section", "data-section": name }, children }
}

/** 区块标题（文案已过 `t()`）。 */
function heading(label) {
  return { tag: "div", props: { class: "rail-title" }, children: [label] }
}

/** 列表容器（`data-list` = 机读面：`recent` / `sessions`）。 */
function list(name, items) {
  return { tag: "ul", props: { class: "rail-list", "data-list": name }, children: items }
}

/** 列表项。 */
function item(children) {
  return { tag: "li", props: { class: "rail-item" }, children }
}

/** 控件（两态 = `wire`）：`data-action` 恒在（机读锚），事件面只随 handlers 变。 */
function control({ label, action, onClick, data = {} }) {
  const props = { type: "button", class: "rail-control", "data-action": action, ...data }
  return { tag: "button", props: wire(props, onClick), children: [label] }
}

/** 接线形通则（**单源** —— `docs/desktop/design/RENDERER.md` §1.1）：handlers 给 ⇒ 落 `onClick` 且无 `disabled`；
 *  缺 ⇒ `disabled: true`（诚实非死控：不落假接线、不留死控件）。 */
function wire(props, onClick) {
  if (typeof onClick === "function") props.onClick = onClick
  else props.disabled = true
  return props
}

/** 键携带包装：handler 给 ⇒ 携本键闭包；缺 ⇒ `undefined`（交 `wire` 判两态）。 */
function withKey(handler, key) {
  return typeof handler === "function" ? () => handler(key) : undefined
}

// ─── 标签条面（`docs/desktop/design/UI.md` §1 标签条行 · §2 项 2）────────────────

/** 图标控件形（关闭 / 新建）：文案取**词键**，值按构树时现语言取（模块级常量不冻词面）。 */
const CLOSE_TAB = Object.freeze({ className: "tabbar-close", action: "tab:close", word: "tab.action.close" })
const NEW_TAB = Object.freeze({ className: "tabbar-new", action: "session:create", word: "rail.action.newSession" })
/** 确认面两键（同档 §1 交互行）：文本按钮（词面出串 —— **零字形**），DOM 序 = 取消 → 确认。 */
const CLOSE_CANCEL = Object.freeze({ className: "tabbar-cancel", action: "tab:close-cancel", word: "tab.action.close.cancel" })
const CLOSE_CONFIRM = Object.freeze({ className: "tabbar-confirm", action: "tab:close-confirm", word: "tab.action.close.confirm" })

/** 位标词键表（码 → 词键）：`approval` = 宿主新键（核无审批词条 —— KD-c）；`running` / `done` = 核状态词族键
 *  （词形单源）；`idle` **无词条**（零节点）。状态栏告警位**同用此表**（同源同词 —— `views/chrome.mjs` 消费）。 */
export const BADGE_WORD = Object.freeze({
  approval: "tab.badge.approval",
  running: "sub.running",
  done: "sub.done",
})

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
  return model
}

/** 单标签：活动 ⇒ `data-active="1"`；非活动 ⇒ `inert`（不收 Tab 序）；子 = 标签控件 + 关闭面 —— 常态 = 关闭控件；
 *  待确认（`pendingClose`）⇒ 标签项 `data-confirm="1"` + 两键 [取消, 确认]，关闭控件**原位退出**（同档 §1 交互行）。 */
function tabItem(tab, handlers) {
  const props = { class: "tabbar-item", "data-tab": tab.key }
  if (tab.active) props["data-active"] = "1"
  else props.inert = true
  const activate = tabControl(tab, handlers)
  if (tab.pendingClose !== true) {
    return { tag: "div", props, children: [activate, iconControl(CLOSE_TAB, withKey(handlers.onClose, tab.key))] }
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

/** 标签控件（两态 = `wire`；`onClick` 携本键 = 激活该标签）：子 = 标题 + 位标（空闲 / 表外码 ⇒ 空位跳过）。 */
function tabControl(tab, handlers) {
  const props = { type: "button", class: "tabbar-tab", "data-action": "tab:activate" }
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
 *  同键：同一事实同词）。 */
function iconControl({ className, action, word }, onClick) {
  const props = { type: "button", class: className, "data-action": action, "aria-label": t(word) }
  return { tag: "button", props: wire(props, onClick), children: [] }
}

/** 确认面文本按钮（取消 / 确认）：词面 = 词键值（**零字形** —— 不出图标），锚 = class + `data-action`。 */
function textControl({ className, action, word }, onClick) {
  const props = { type: "button", class: className, "data-action": action }
  return { tag: "button", props: wire(props, onClick), children: [t(word)] }
}

