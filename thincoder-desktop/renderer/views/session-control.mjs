/**
 * session-control.mjs — 会话控制面**纯构树三件**（会话模型 ∕ 条体树 ∕ 下拉树 + 节点助手）。
 * 会话模型轮 R13 硬限拆分产物：自 `renderer/mount-sessions.mjs` 出档（该档 588 行越 500 硬限）——
 * **结构拆分零语义**（面不变 / 判据不变，只换宿主档）；挂载与交互（开合 ∕ 点内不关 ∕ 点外关 ∕
 * 改名换形 ∕ 删除 popover）与接线留 `renderer/mount-sessions.mjs`。基准 = `thincoder-vscode/webview/session-bar.js`
 * 三件〔项目钮 ∕ 下拉选择器 ∕ 新建钮〕，值面 = `webview/session.css`；需求句 = `docs/desktop/requirements/PROJECT.md`
 * §3.1「会话控制（面板内 · VSC 形）」行。
 *
 * 面（纯函数 —— 零 DOM；机检面 = 下拉结构锚 ∕ 条目形 ∕ 位标 ∕ 空态）：
 *   条体三件 = 项目钮（📁 当前项目 —— 桌面单活动项目 ⇒ **恒在场**〔适配 a：VSC 多根显隐 vs 桌面单项目〕，
 *   出口 `project:open`）→ 下拉选择器（标签 = 活动会话题；开合锚 = `aria-expanded` + 下拉 `data-open`；
 *   Enter ∕ Space 键触发 —— VSC `session-bar.js:20-25` 同径）→ 新建钮（出口 `session:create`）。
 *   下拉（开时挂选择器子位）：首行 = 账本警示注记（`data-ledger-notice` 锚保持 · 非可点 —— 端既有面迁位；
 *   缺席 ⇒ 零节点）⇒ 条目（标题 + 元数据 `provider · N msgs · updated` + 位标〔运行中 ∕ 待审批 —— `tabBadges`
 *   切片〕+ 行内 ✎ ∕ ✕〔>1 才显 ✕〕）⇒ 空态行（`session.empty`，半透明）。
 *   三出口（通道名零改，接线住挂载档）：切会话 `session:switch` · 改名 `session:rename`（✎ ⇒ 条目原位换形
 *   〔文本控件 + 取消 ∕ 确认两键〕）· 删除 `session:delete`（✕ ⇒ 内联确认 popover）。
 *
 * 纪律：纯函数（零 DOM · 零窄桥读）；面向用户文案全经 `t()`（本档源零 CJK）；零 `node:` / 零裸包
 * （守卫 = `test/guard-closure.test.mjs`）。
 */
import { locale, t } from "../i18n.mjs"
import { deriveTabBadge } from "../store.mjs"
import { BADGE_WORD } from "./chrome.mjs"

/** 注记合成分隔符（主句 ⇄ 附句之间 —— 按当前 locale 直取：zh「；」/ en "; "；桌面有 locale 上下文，禁内容启发式）。 */
const NOTICE_SEP = Object.freeze({ zh: "；", en: "; " })

// ─── 模型 ∕ 构树（纯函数 —— 零 DOM；机检面 = 下拉结构锚 ∕ 条目形 ∕ 位标 ∕ 空态）──────

/** 本地化短日期（沿 VSC `fmtDate` 形：月 / 日 + 时:分 —— 运行时本地化）。 */
function shortDate(ts) {
  const date = new Date(ts)
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  const clock = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  return `${day} ${clock}`
}

/** 目录基名（项目钮读数 —— 沿 VSC `session-bar.js:157` 取法）。 */
function baseName(cwd) {
  const parts = String(cwd).split(/[\\/]/)
  return parts[parts.length - 1] !== "" ? parts[parts.length - 1] : String(cwd)
}

/** 会话控制模型（纯 · 零 DOM）：`sessions` 行投影 ⇒ 选择器标签 + 条目集（对位 VSC `buildSessionDropdown` 行形）。
 *  活动判据 = 行 `isActive`（`sessions:list` 投影 —— VSC 同源 `s.active`）；标题空 ⇒ 缺省词（**不猜**）；无活动行
 *  ⇒ `session.title`（VSC `updateSessionTitle` 同径）。元数据三值各自缺席（非串 / 空串 / 非数）⇒ 该值**零节点**。 */
export function sessionModel(state = {}) {
  const rows = Array.isArray(state?.sessions) ? state.sessions : []
  const badges = state?.tabBadges !== null && typeof state?.tabBadges === "object" ? state.tabBadges ?? {} : {}
  const items = rows.map((row) => {
    const key = String(row?.slot)
    const codes = Array.isArray(badges[key]) ? badges[key] : []
    return {
      key,
      title: typeof row?.title === "string" && row.title !== "" ? row.title : t("rail.session.untitled"),
      provider: typeof row?.provider === "string" && row.provider !== "" ? row.provider : null,
      msgs: Number.isFinite(row?.messageCount) ? row.messageCount : null,
      updated: Number.isFinite(row?.updatedAt) ? shortDate(row.updatedAt) : null,
      active: row?.isActive === true,
      badge: deriveTabBadge(codes),
    }
  })
  const active = items.find((item) => item.active === true) ?? null
  const cwd = typeof state?.project?.cwd === "string" && state.project.cwd !== "" ? state.project.cwd : null
  return {
    title: active === null ? t("session.title") : active.title,
    items,
    canDelete: items.length > 1,
    ledger: state?.ledger !== null && typeof state?.ledger === "object" ? state.ledger : null,
    project: cwd === null ? null : { cwd, name: baseName(cwd) },
  }
}

/** 条体树（两子树：项目钮 → 下拉选择器 → 新建钮；下拉内容 = `sessionDropdownTree`，开时挂进选择器）。
 *  `handlers` = 面接线（`mountSessionBar` 装配：`onToggle` / `onSelect` / `onRename` / `onRenameCancel` /
 *  `onRenameConfirm` / `onDelete` / `onNew` / `onOpenProject`）；`face` = 面内态 `{ open, form }`。 */
export function sessionBarTree(model, handlers = {}, face = {}) {
  return {
    tag: "div",
    props: { class: "session-bar" },
    children: [
      projectNode(model, handlers),
      selectorNode(model, handlers, face),
      buttonNode({ className: "session-new", action: "session:create", label: t("rail.action.newSession"), onClick: handlers.onNew }),
    ],
  }
}

/** 下拉内容树（注记首行 → 条目 ⋯ → 空态行）：`el` 形描述符 —— 机检面 = 结构锚 ∕ 条目形 ∕ 空态。
 *  **点内不关**（VSC `session-bar.js:27-29` 同径）：下拉内任一点按吞泡 —— 选择器本体的开合 handler 在上层，
 *  不吞则条目 ∕ 换形键点按会连带 toggle（真 DOM 事件冒泡下必现）。 */
export function sessionDropdownTree(model, handlers = {}, face = {}) {
  const children = []
  const notice = ledgerNotice(model.ledger)
  if (notice !== null) children.push(notice)
  for (const item of model.items) children.push(itemNode(item, handlers, model.canDelete, face.form === item.key))
  if (model.items.length === 0) {
    children.push({ tag: "div", props: { class: "session-item session-empty" }, children: [t("session.empty")] })
  }
  return {
    tag: "div",
    props: {
      class: "session-dropdown", role: "listbox", "aria-label": t("session.title"),
      "data-open": face.open === true ? "1" : "0",
      onClick: (event) => event?.stopPropagation?.(),
    },
    children,
  }
}

/** 项目钮（📁 当前项目 ∕ 无项目 ⇒ 打开目录词 —— 恒在场；词面经 `aria-label`，字形住 `chrome.css`，KD-f）。 */
function projectNode(model, handlers) {
  const label = model.project === null ? t("rail.action.openDir") : model.project.name
  const props = {
    type: "button", class: "session-project", "data-action": "project:open",
    "aria-label": t("rail.action.openDir"), title: model.project === null ? "" : model.project.cwd,
  }
  return { tag: "button", props: { ...wire(props, handlers.onOpenProject) }, children: [label] }
}

/** 下拉选择器（开合锚 = `aria-expanded` + 下拉 `data-open`；Enter ∕ Space 键触发 —— VSC `session-bar.js:20-25` 同径）。 */
function selectorNode(model, handlers, face) {
  const open = face.open === true
  return {
    tag: "div",
    props: {
      class: "session-selector", tabindex: "0", role: "combobox", "aria-haspopup": "listbox",
      "aria-expanded": String(open), "aria-label": t("session.title"),
      onClick: handlers.onToggle,
      onKeydown: (event) => {
        if (event?.key !== "Enter" && event?.key !== " ") return
        event?.preventDefault?.()
        if (typeof handlers.onToggle === "function") handlers.onToggle()
      },
    },
    children: [
      { tag: "span", props: { class: "session-title" }, children: [model.title] },
      { tag: "span", props: { class: "session-arrow", "aria-hidden": "true" }, children: [] },
      ...(open ? [sessionDropdownTree(model, handlers, face)] : []),
    ],
  }
}

/** 条目（标题 + 元数据 + 位标 + 行内 ✎ ∕ ✕〔>1 才显 ✕〕—— 对位 VSC `.session-item`）。
 *  本键在形（改名形）⇒ 子序 [文本控件, 取消, 确认]（条目控件原位退出 —— 同旧左列换形律）。 */
function itemNode(item, handlers, canDelete, inForm) {
  const props = {
    class: item.active === true ? "session-item active" : "session-item",
    "data-slot": item.key, role: "option", "aria-selected": String(item.active === true),
  }
  if (inForm === true) {
    return { tag: "div", props: { ...props, "data-form": "rename" }, children: renameForm(item, handlers) }
  }
  const children = [
    { tag: "span", props: { class: "session-item-title" }, children: [item.title] },
    metaNode(item),
    badgeNode(item.badge),
    controlNode("session-rename", "session:rename", `${t("session.rename")} ${item.title}`, handlers.onRename, item.key, item.key),
    canDelete ? controlNode("session-delete", "session:delete", `${t("session.delete")} ${item.title}`, handlers.onDelete, item, item.key) : null,
  ]
  return { tag: "div", props: { ...props, tabindex: "0", onClick: () => handlers.onSelect?.(item.key) }, children }
}

/** 元数据三值（provider · N msgs · updated —— 逐段包元素 `data-seg`；段间分隔符归样式档）。 */
function metaNode(item) {
  const children = [
    item.provider === null ? null : { tag: "span", props: { "data-seg": "provider" }, children: [item.provider] },
    item.msgs === null ? null : { tag: "span", props: { "data-seg": "msgs" }, children: [t("rail.session.msgs", { n: item.msgs })] },
    item.updated === null ? null : { tag: "span", props: { "data-seg": "updated" }, children: [t("rail.session.updated", { date: item.updated })] },
  ].filter((child) => child !== null)
  if (children.length === 0) return null
  return { tag: "span", props: { class: "session-item-meta", "data-row-meta": "" }, children }
}

/** 位标节点（`data-badge` = 码 · 文本 = 词表键值）：表外码（含 `idle`）⇒ `null`（零节点 —— 不造词）。 */
function badgeNode(code) {
  const word = BADGE_WORD[code]
  if (typeof word !== "string") return null
  return { tag: "span", props: { class: "session-item-badge", "data-badge": code }, children: [t(word)] }
}

/** 行内动作控件（✎ ∕ ✕ —— 词面经 `aria-label`，字形住样式档；点按不冒泡到条目选择面）。 */
function controlNode(className, action, label, handler, arg, key) {
  const bound = typeof handler === "function" ? (event) => { event?.stopPropagation?.(); handler(arg) } : undefined
  const props = wire({ type: "button", class: className, "data-action": action, "data-slot": key, "aria-label": label }, bound)
  return { tag: "button", props, children: [] }
}

/** 改名形（条目原位换形）：[文本控件, 取消, 确认]；文本控件值 = 行标题原值（**行标题面投影** —— 控件不造词）。 */
function renameForm(item, handlers) {
  return [
    {
      tag: "input",
      props: {
        type: "text", class: "session-rename-input", "data-action": "session:rename-input", value: item.title,
        "aria-label": t("session.rename"),
      },
    },
    { tag: "button", props: wire({ type: "button", class: "session-cancel", "data-action": "session:rename-cancel" }, handlers.onRenameCancel), children: [t("question.cancel")] },
    { tag: "button", props: wire({ type: "button", class: "session-confirm", "data-action": "session:rename-confirm" }, typeof handlers.onRenameConfirm === "function" ? () => handlers.onRenameConfirm(item.key) : undefined), children: [t("session.rename")] },
  ]
}

/** 账本警示注记（账本可靠批 · 端既有面迁位 = 下拉首行 · 非可点）：主句 + `scene === true` 条件附句（两键合成）。 */
function ledgerNotice(ledger) {
  if (ledger === null || typeof ledger !== "object") return null
  const children = [t("rail.ledger.notice", { reason: ledger.reason })]
  if (ledger.scene === true) children.push(NOTICE_SEP[locale()] ?? NOTICE_SEP.en, t("rail.ledger.notice.scene"))
  return { tag: "div", props: { class: "session-ledger-notice", "data-ledger-notice": "" }, children }
}

/** 图标 ∕ 文本控件（两态 = `wire`）：handlers 给 ⇒ 落 `onClick` 且无 `disabled`；缺 ⇒ `disabled: true`（诚实非死控）。 */
function buttonNode({ className, action, label, onClick }) {
  const props = { type: "button", class: className, "data-action": action, "aria-label": label }
  return { tag: "button", props: wire(props, onClick), children: [] }
}

/** 接线形通则（**单源** —— `docs/desktop/design/RENDERER.md` §1.1）：handlers 给 ⇒ 落 `onClick`；缺 ⇒ `disabled`。 */
function wire(props, onClick) {
  if (typeof onClick === "function") props.onClick = onClick
  else props.disabled = true
  return props
}
