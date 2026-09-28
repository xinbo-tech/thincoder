/**
 * sessions.mjs — 会话族视图面（左列会话行 / 布局行 —— `docs/desktop/design/UI.md` §1 · §2 项 2 ·
 * `docs/desktop/design/RENDERER.md` §1.1）：
 *   ① **纯构树**（零 DOM）：`railModel({ projectCwd, recent, rows })` → 态对象；`railTree(model, handlers)` →
 *      结构描述符树（根 `data-state` = 态）；② **薄挂载**：`mountRail(root, state, handlers)` = `railModel` +
 *      `clear` + `build` + `append`（本档**唯一触 DOM 处**）；③ **机读锚**：`data-state` / `data-section` /
 *      `data-list` / `data-slot` / `data-action` / `data-origin`（走查机读面 = 名字面，零字形）。
 * 标签条面随批 A 拆档迁出（新档 = `thincoder-desktop/renderer/views/tabbar.mjs`：`tabbarModel` / `tabbarTree` /
 *   `mountTabbar` / 加速键面 `acceleratorTab` · 拆档锚 = `docs/desktop/design/PROJECT.md` §4.1）：本档保留
 *   **同名再出口**（消费面 `renderer/app.mjs` / `renderer/views/chrome.mjs` / 测试档零随动 —— 语义单源 = 新档）；
 *   收面纪律（非活动标签 Tab 序 / 零 `inert` / 加速键命中面）随之迁出，见新档头 KD-15 段。
 * 三态（`docs/desktop/design/UI.md`:13,22,23 · 批档 §2.4（d））：无当前项目 ⇒ `boot`（打开目录入口 + 最近目录列表，
 * **零会话行**）；有项目无行 ⇒ `empty`（会话区标题 + 空态提示 + 新建入口）；有行 ⇒ `list`（会话行）。
 * 行映射（批档 §2.4（e））：`title` 空 ⇒ `t("rail.session.untitled")`；`createdBy` ∈ `cli|vscode|desktop` ⇒
 * `t("origin.<值>")`，`""` / 未知值 ⇒ **无标节点**（不猜测 —— `docs/desktop/design/UI.md` §2 项 3）；`isActive`
 * ⇒ 行 `data-active="1"`。
 * **接线形通则**（`docs/desktop/design/RENDERER.md` §1.1 = 单源；本档 `wire()` 一处落形）：handlers 给 ⇒ 落
 * `onClick` 且**无** `disabled`；缺省 ⇒ `disabled: true` + `data-action`（**诚实非死控**——树形只随 handlers 变）。
 * 左列接线（`docs/desktop/design/UI.md` §1 左列会话行）= 点行 `session:switch`（激活 = 切换会话，与标签条同一路）
 * · 空态新建入口 `session:create`。行内两控件（批 A ④）= 改名 `session:rename` / 删除 `session:delete`
 * （词面经 `aria-label`，字形住 `styles.css`）；**换形态**（态单源 = store `railForm`，经 `railTree` 第三参纯读传入）
 * ＝**行原位换形**：改名形子序 [文本控件, 取消, 确认]（行控件内容即被编辑 ⇒ 行按钮原位退出，零激活歧义）·
 * 删除形子序 [行控件, 取消, 确认]（行控件在位 —— 沿标签条关闭确认面同形）；两键词面 = 文本按钮，
 * DOM 序 = 取消 → 确认（同档 §1 交互行同形）。
 * **重绘草稿保护**（`mountRail`）：重挂前捕获在形文本控件的值 / 焦点 / 光标，重建后按同锚复填 ——
 * 回合尾重绘（`refreshTitles`）不吞草稿；草稿住 DOM（零 store 字段、零签名改）。拆档纪律：本档与 `chat-tool.mjs` / `tabbar.mjs` 各持 `wire` / `withKey`
 * 私有副本（同形同律 —— 单源是设计档 §1.1，不是某一份副本）。
 * 文案一律经 `t()`（本档零硬编码 —— 词表单源 = `renderer/i18n.mjs`）；零 `node:` / 零裸包（渲染面闭包判据）。
 * **行元数据族（R3c · D18）** = 三值（provider · N msgs · updated——对位 VSC 会话栏，单源 = `docs/desktop/design/UI.md` §1
 * 「本批注（对齐重定位）」项 4）；**多标签结构不削**（本注不改形 —— 仅增行内元数据节点；换形/行动作两面零动）。
 */
import { build, clear } from "../dom.mjs"
import { locale, t } from "../i18n.mjs"
import { segNode } from "./chat-tool.mjs"
// 同名 re-export（消费面零改 —— 导入路径与名面保持；语义单源 = 新档）。
export { BADGE_WORD, mountTabbar, tabbarModel, tabbarTree } from "./tabbar.mjs"

/** 来源端闭集（核 `createdBy` 三值）：其余（含 `""`）⇒ 无标。 */
const ORIGINS = Object.freeze(["cli", "vscode", "desktop"])

/** 换形两键锚（批 A ④ —— `docs/desktop/design/UI.md` §1 左列会话行点名四面）：词面 = 文本按钮 + 机读锚。 */
const FORM_KEYS = Object.freeze({
  rename: { cancel: "session:rename-cancel", confirm: "session:rename-confirm" },
  delete: { cancel: "session:delete-cancel", confirm: "session:delete-confirm" },
})

/** 行 / 换形控件词键（行两控件词经 `aria-label` —— 字形住 `styles.css`；两键 = 文本按钮，同事实同词）。 */
const ROW_WORDS = Object.freeze({ rename: "rail.action.rename", delete: "rail.action.delete", cancel: "rail.action.cancel" })

/** 在形文本控件选择器（草稿捕获 / 复填同锚 —— 换形面唯一文本控件）。 */
const RENAME_INPUT = 'input[data-action="session:rename-input"]'

/** 态判定（无 `cwd` ⇒ `boot` / 有 cwd 无行 ⇒ `empty` / 有行 ⇒ `list`）· `ledger` = 账本警示切片（非对象 ⇒ `null`——禁假造）。 */
export function railModel({ projectCwd = null, recent = [], rows = [], ledger = null } = {}) {
  const list = Array.isArray(rows) ? rows : []
  return {
    state: projectCwd ? (list.length > 0 ? "list" : "empty") : "boot",
    recent: Array.isArray(recent) ? recent : [],
    rows: list,
    ledger: ledger !== null && typeof ledger === "object" ? ledger : null,
  }
}

/** 结构描述符树（根 `data-state` = 态）。`handlers` = 接线面 `{ onOpenDir, onOpenRecent, onSession, onNewSession,
 *  onRename, onDelete, onRenameCancel, onRenameConfirm, onDeleteCancel, onDeleteConfirm }`；`form` = 换形态
 *  （store `railForm` 切片直传 —— 本档纯读，零 store 依赖）。两态落形 = `wire`（树形只随 handlers 变，其余同形）。 */
export function railTree(model, handlers = {}, form = null) {
  return {
    tag: "div",
    props: { class: "rail-sections", "data-state": model.state },
    children: sections(model, handlers, form),
  }
}

/** 薄挂载：状态树切片（`project` / `sessions` / `railForm`）⇒ 三态树；返回模型（读数 / 走查面）。
 *  **草稿保护**：重绘前捕获在形文本控件的值 / 焦点 / 光标，重建后按同锚复填（捕获面只在本档）。 */
export function mountRail(root, state, handlers = {}) {
  if (!root || typeof root.append !== "function") return null
  const model = railModel({
    projectCwd: state?.project?.cwd ?? null,
    recent: state?.project?.recent ?? [],
    rows: state?.sessions ?? [],
    ledger: state?.ledger ?? null,
  })
  const draft = readDraft(root)
  clear(root)
  root.append(build(railTree(model, handlers, state?.railForm ?? null)))
  restoreDraft(root, draft)
  return model
}

/** 草稿捕获（重绘前）：值 / 焦点 / 光标区间；无在形控件 ⇒ `null`（零草稿）。 */
function readDraft(root) {
  const node = root.querySelector?.(RENAME_INPUT) ?? null
  if (node === null) return null
  return {
    value: String(node.value ?? ""),
    focused: root.ownerDocument?.activeElement === node,
    start: typeof node.selectionStart === "number" ? node.selectionStart : null,
    end: typeof node.selectionEnd === "number" ? node.selectionEnd : null,
  }
}

/** 草稿复填（重建后，同锚）：值恒复填（改形重绘不丢字）；焦点 / 光标择位防御（换形已收 ⇒ 跳过）。 */
function restoreDraft(root, draft) {
  if (draft === null) return
  const node = root.querySelector?.(RENAME_INPUT) ?? null
  if (node === null) return
  node.value = draft.value
  if (draft.focused !== true || typeof node.focus !== "function") return
  node.focus()
  if (draft.start !== null && typeof node.setSelectionRange === "function") node.setSelectionRange(draft.start, draft.end ?? draft.start)
}

/** 态 → 区块集（三态互斥 —— 启动态只落项目区 + 最近目录区，**零会话行**）。 */
function sections(model, handlers, form) {
  if (model.state === "boot") return [projectSection(handlers), recentSection(model.recent, handlers)]
  const body = model.state === "empty" ? [emptyHint(), newSessionEntry(handlers)] : [rowsList(model.rows, handlers, form)]
  return [sessionsSection([...body, ledgerNotice(model.ledger)])]
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

/** 注记合成分隔符（主句 ⇄ 附句之间 —— **按当前 locale 直取**：zh「；」/ en「; 」；桌面有 locale 上下文，禁内容启发式）。 */
const NOTICE_SEP = Object.freeze({ zh: "；", en: "; " })

/** 账本警示行（账本可靠批 · 桌面微轮 —— 单源 = `docs/desktop/design/UI.md` §1「本批注（账本警示面）」）：会话区末子；dim · 非可点。
 *  文案（修正轮 · 三端同义）= 主句 + **`scene === true` 条件附句**（附句另键；`scene` 缺 / false ⇒ 仅主句——禁恒附）。 */
function ledgerNotice(ledger) {
  if (ledger === null || typeof ledger !== "object") return null
  const children = [t("rail.ledger.notice", { reason: ledger.reason })]
  if (ledger.scene === true) children.push(NOTICE_SEP[locale()] ?? NOTICE_SEP.en, t("rail.ledger.notice.scene"))
  return { tag: "div", props: { class: "rail-ledger-notice", "data-ledger-notice": "" }, children }
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
function rowsList(rows, handlers, form) {
  return list("sessions", rows.map((row) => rowItem(row, handlers, form)))
}

/** 会话行（**行原位换形** = 批 A ④）：本键在形（`form.key`）⇒ 子序随形 —— 改名形 [文本控件, 两键]（行按钮
 *  原位退出：编辑对象即行内容，活性与编辑面不得同处）· 删除形 [行控件, 两键]（行控件在位 —— 沿关闭确认面同形）；
 *  未在形 ⇒ 常态 [行控件, 改名, 删除]。行键锚 = `data-slot`（行 / 控件同键）；在形 ⇒ 增 `data-form` 机读锚。 */
function rowItem(row, handlers, form) {
  const key = String(row.slot)
  const mode = form?.key === key && FORM_KEYS[form.mode] !== undefined ? form.mode : null
  const formKeys = mode === null ? [] : [formKey(mode, "cancel", key, handlers), formKey(mode, "confirm", key, handlers)]
  const children = mode === "rename" ? [renameInput(row), ...formKeys]
    : mode === "delete" ? [rowButton(row, handlers), ...formKeys]
    : [rowButton(row, handlers), rowControl("rename", key, handlers), rowControl("delete", key, handlers)]
  return item(children, { "data-slot": key, ...(mode === null ? {} : { "data-form": mode }) })
}

/** 行控件（常态）：标题 + 端标（未知 ⇒ 无标）；点击 = **激活并成标签**（`data-action` = `session:switch` ——
 * 与标签点击同一路，机读值与行为一致 KD-f）；两态 = `wire`。 */
function rowButton(row, handlers) {
  const props = { type: "button", class: "rail-row", "data-action": "session:switch", "data-slot": String(row.slot) }
  if (row.isActive === true) props["data-active"] = "1"
  return { tag: "button", props: wire(props, withKey(handlers.onSession, String(row.slot))), children: [rowTitle(row), rowMeta(row), originLabel(row.createdBy)] }
}

/** 行元数据族（R3c · D18 —— 对位 VSC 会话栏行元数据 `session-bar.js:40-41`）：provider（行载 `provider`
 *  = 核槽投影 `activeProvider` 逐字）· `messageCount`（计数）· `updatedAt`（本地化短日期）。
 *  三值各自缺席（非串 / 空串 / 非数）⇒ 该值**零节点**（禁假造 —— 沿本档「标题缺省 / 无标」同律）；
 *  三值皆缺 ⇒ 元数据节点零节点。段锚 = `data-seg`（通则 = `docs/desktop/design/RENDERER.md` §1.1「逐段包元素」；
 *  段间分隔符归样式档 —— 视图档零字形字面）。 */
function rowMeta(row) {
  const provider = typeof row?.provider === "string" && row.provider !== "" ? row.provider : null
  const count = Number.isFinite(row?.messageCount) ? row.messageCount : null
  const updated = Number.isFinite(row?.updatedAt) ? shortDate(row.updatedAt) : null
  const children = [
    segNode("provider", provider),
    count === null ? null : { tag: "span", props: { "data-seg": "msgs" }, children: [t("rail.session.msgs", { n: count })] },
    updated === null ? null : { tag: "span", props: { "data-seg": "updated" }, children: [t("rail.session.updated", { date: updated })] },
  ].filter((child) => child !== null)
  if (children.length === 0) return null
  return { tag: "span", props: { class: "rail-row-meta", "data-row-meta": "" }, children }
}

/** 本地化短日期（沿 VSC `fmtDate` 形：月 / 日 + 时:分 —— 运行时本地化；显示形单源 = `docs/desktop/design/UI.md`
 *  §1 项 4「本地化短日期」）。 */
function shortDate(ts) {
  const date = new Date(ts)
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  const clock = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  return `${day} ${clock}`
}

/** 行内动作控件（常态两控件 = 改名 / 删除）：词面经 `aria-label`（零文本子 —— 字形住 `styles.css`），锚 = `data-action`。 */
function rowControl(mode, key, handlers) {
  const props = {
    type: "button", class: `rail-${mode}`, "data-action": `session:${mode}`, "data-slot": key, "aria-label": t(ROW_WORDS[mode]),
  }
  return { tag: "button", props: wire(props, withKey(mode === "rename" ? handlers.onRename : handlers.onDelete, key)) }
}

/** 换形两键（词面 = 文本按钮）：确认键携本键（行键锚 + 回代）；两态 = `wire`。 */
function formKey(mode, kind, key, handlers) {
  const handler = {
    rename: { cancel: handlers.onRenameCancel, confirm: handlers.onRenameConfirm },
    delete: { cancel: handlers.onDeleteCancel, confirm: handlers.onDeleteConfirm },
  }[mode][kind]
  const props = { type: "button", class: `rail-${kind}`, "data-action": FORM_KEYS[mode][kind] }
  if (kind === "confirm") props["data-slot"] = key
  return { tag: "button", props: wire(props, withKey(handler, key)), children: [t(ROW_WORDS[kind === "cancel" ? "cancel" : mode])] }
}

/** 改名文本控件（改名形唯一控件）：值 = 行标题原值（**行标题面投影**，非空判据在 `rowTitle` —— 控件不造词）；
 *  词面经 `aria-label`；事件面归接线面读数（`renderer/app.mjs` 确认时读值）——本控件零 handler。 */
function renameInput(row) {
  return {
    tag: "input",
    props: {
      type: "text", class: "rail-rename-input", "data-action": "session:rename-input", "data-slot": String(row.slot),
      value: typeof row.title === "string" ? row.title : "", "aria-label": t(ROW_WORDS.rename),
    },
  }
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

/** 列表项（`props` 增补 —— 会话行携 `data-slot` / 在形 `data-form`；其余零增补）。 */
function item(children, props = {}) {
  return { tag: "li", props: { class: "rail-item", ...props }, children }
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
