/**
 * mount-sessions.mjs — 会话控制面**挂载与交互**（会话族**接线**面随本批出档 `renderer/session-wire.mjs` —— 越线档结构轮 · 台账 #536；
 * 会话模型轮 R13：原标签条 ∕ 左列两面随会话模型裁撤退场 —— 本档由「会话族接线」扩为「VSC 形会话控制面 + 接线」〔旧述〕；
 * **硬限拆分**：纯构树三件〔`sessionModel` ∕ `sessionBarTree` ∕ `sessionDropdownTree` + 节点助手〕随 `renderer/views/session-control.mjs`
 * 出档〔该档 588 行越 500 硬限〕；接线面随本批出档——**结构拆分零语义**：面不变 ∕ 判据不变，只换宿主档）。
 * 基准 = `thincoder-vscode/webview/session-bar.js` 三件〔项目钮 ∕ 下拉选择器 ∕ 新建钮〕，值面 = `webview/session.css`；
 * 需求句 = `docs/desktop/requirements/PROJECT.md` §3.1「会话控制（面板内 · VSC 形）」行。
 *
 * 面（`SESSION_SLOT` = `.session` 首槽 —— 原标签条槽改锚；条体三件 ∕ 下拉内容构树住 `views/session-control.mjs`）：
 *   ① 项目钮（出口 `project:open`）· ② 下拉选择器（开合 = 点击 toggle ∕ Enter ∕ Space；`aria-expanded` 同步；
 *   点内不关 ∕ 点外关）· ③ 新建钮（出口 `session:create`）；三出口（通道名零改）：切会话 `session:switch`
 *   （点条目 ⇒ 关下拉）· 改名 `session:rename`（✎ ⇒ 条目原位换形〔文本控件 + 取消 ∕ 确认两键〕⇒ 通道）·
 *   删除 `session:delete`（✕ ⇒ 内联确认 popover〔`.auto-confirm` 族：背板 + 两键 + 默认焦点取消〕⇒ 通道）。
 *
 * **换形态态 ∕ 开合态住面内 DOM 记账**（`FACE` WeakMap —— 原 store `railForm` ∕ `pendingClose` 两切片随裁撤退场）；
 * 重绘保真 = **键控差分**（#606① —— 壳原位 ∕ 条目复用：下拉 scrollTop ∕ 悬停 ∕ 跨帧点按保真；改名草稿随输入
 * 节点存续 —— 全建径仅壳缺位首挂）；接线描述（三出口同一路 ∕ 邻位接管律）随出档居 `renderer/session-wire.mjs` 档头。
 *
 * 导出面（`renderer/app.mjs` 消费集九名 = 名面零改）：`SESSION_SLOT` · `mountSessionBar`（薄挂载——本档实现）＋
 * `refreshRail` ∕ `backfill` ∕ `resumeOpened` ∕ `activateSession` ∕ `createSession` ∕ `confirmRename` / `deleteSession`
 * **七名同名再出口**（接线面出档 `renderer/session-wire.mjs`——缝 = 同名再出口：本档不持实现，`app.mjs` 导入面零改）；
 * 另 `isProject` ∕ `slotOf` / `loadPage` / `openPage` / `openResult` 随接线面出档（同档），纯树面三件住 `renderer/views/session-control.mjs`。
 * 纪律：读面失败一律 `console.error`（不静默）+ 零切片写；零 `node:` / 零裸包（守卫 = `test/guard-closure.test.mjs`）。
 * 失败面可见提示（toast —— R9 · #486 ∕ #556 ∕ #578③ 三族）随接线面住 `renderer/session-wire.mjs` 档头 ∕ 实现。
 */
import { build, clear, el } from "./dom.mjs"
import { t } from "./i18n.mjs"
import { store } from "./store.mjs"
// 会话控制面树面单源（R13 硬限拆分产出）+ 差分辅助件（槽序 ∕ 空态行 ∕ 注记 ∕ 条目构建：挂载面同引）
import { ITEM_SLOTS, emptyRowNode, itemNode, ledgerNoticeNode, sessionBarTree, sessionDropdownTree, sessionModel } from "./views/session-control.mjs"
// 快照族（波 1 产物 —— 重建保真「位置 ∕ 状态」半边：#606④ 包络，壳全建径复填滚位 ∕ 域内焦点）
import { captureView, restoreView } from "./view-state.mjs"
// 同名 re-export（越线档结构轮 · #536 —— 缝 = 同名再出口）：会话族接线面随本批出档 `renderer/session-wire.mjs`；
// `app.mjs` 导入面零改（七名经本档转口 ∕ 名面与引用同为直导出——单模块实例）。
export {
  activateSession, backfill, confirmRename, createSession, deleteSession, refreshRail, resumeOpened,
} from "./session-wire.mjs"

/** 会话控制条容器锚（骨架 = `renderer/index.html`：`.session` 首子元素槽 —— 原标签条槽改锚）。 */
export const SESSION_SLOT = '[data-slot="session-control"]'

/** 改名形文本控件选择器（构树 ∕ 行内读数同锚 —— 单源住本档；构树面 = `views/session-control.mjs` `renameForm`）。 */
const NAME_INPUT = '[data-action="session:rename-input"]'

// ─── 面内态 ∕ 薄挂载（开合态 ∕ 换形态住面内 DOM 记账 —— 原 store 两切片随裁撤退场）──────

/** 面内态（宿主 → `{ open, form, handlers }`）：重挂保态（含接线面 —— 文档级 listener 回读用）。 */
const FACE = new WeakMap()
/** 文档级 listener 注册簿（每文档一枚 —— 重挂不叠挂）。 */
const OUTSIDE_BOUND = new WeakSet()

/** 现态读（缺 ⇒ 闭 + 无形态）。 */
function faceOf(root) {
  return FACE.get(root) ?? { open: false, form: null, handlers: {} }
}

/** 态写（局部键合并）。 */
function setFace(root, patch) {
  FACE.set(root, { ...faceOf(root), ...patch })
  return FACE.get(root)
}

/** 文档面（真 DOM = `ownerDocument` ∕ 平测 = 全局 `document`；两皆不可用 ⇒ `null`）。 */
function docOf(root) {
  const doc = root?.ownerDocument ?? (typeof document !== "undefined" ? document : null)
  return doc !== null && doc !== undefined ? doc : null
}

/** 覆盖层宿主（真 DOM = `body` ⇒ 出面板溢出裁面；平测无 body ⇒ 退挂载根 —— 零静默落空）。 */
function overlayHost(root) {
  const doc = docOf(root)
  const body = doc?.body ?? doc?.documentElement ?? null
  if (body !== null && typeof body.append === "function") return body
  return root !== null && root !== undefined && typeof root.append === "function" ? root : null
}

// ─── 键控差分（#606① —— 壳原位 ∕ 条目复用：下拉 scrollTop ∕ 悬停 ∕ 跨帧点按保真）──────────────────

/** 部件签名（零写判据：标签 + 文本 + `aria-label`）。 */
const partSig = (node) => `${node.tagName}|${node.textContent}|${node.getAttribute("aria-label") ?? ""}`

/** 条目槽对账（槽序单源 = `ITEM_SLOTS`）：等值 ⇒ 零写；异 ⇒ 原位换件；缺 ⇒ 补位（首个后槽件之前）。 */
function syncSlots(node, children) {
  ITEM_SLOTS.forEach((sel, index) => {
    const cur = node.querySelector(sel)
    const want = children[index] ?? null
    if (want === null) { if (cur !== null) cur.remove(); return }
    const fresh = build(want)
    if (cur === null) {
      const ref = ITEM_SLOTS.slice(index + 1).map((next) => node.querySelector(next)).find((hit) => hit !== null) ?? null
      node.insertBefore(fresh, ref)
    } else if (partSig(cur) !== partSig(fresh)) cur.replaceWith(fresh)
  })
}

/** 条目原位更新（身份保真 = 条目节点复用）：活动态原位写；**换形两向 = 换件**（监听面随换 —— 形内点按冒泡不得误触选择出口）；
 *  在位 ⇒ 槽对账；回值 = 现件（换件径返回新节点 —— 调用面位置对账用）。 */
function patchItemNode(node, item, handlers, canDelete, inForm) {
  node.setAttribute("class", item.active === true ? "session-item active" : "session-item")
  node.setAttribute("aria-selected", String(item.active === true))
  const held = node.getAttribute("data-form") === "rename"
  if (held !== (inForm === true)) {
    const fresh = build(itemNode(item, handlers, canDelete, inForm === true))
    node.replaceWith(fresh)
    return fresh
  }
  if (inForm !== true) syncSlots(node, itemNode(item, handlers, canDelete, false).children)
  return node
}

/** 下拉差分（壳不摘 ⇒ scrollTop 自保）：注记 ∕ 条目键控（删差额 · 逆序定位 · 逐件原位）∕ 空态行对账。 */
function syncDropdown(dropdown, model, handlers, face) {
  dropdown.setAttribute("data-open", face.open === true ? "1" : "0") // 值域 1 ∕ 0（CSS 锚 `[data-open="1"]` —— 与构树面同字面）
  if (dropdown.getAttribute("aria-label") !== t("session.title")) dropdown.setAttribute("aria-label", t("session.title")) // 词面随 `locale`
  const notice = dropdown.querySelector("[data-ledger-notice]")
  const wantNotice = ledgerNoticeNode(model.ledger)
  if (wantNotice === null) { if (notice !== null) notice.remove() }
  else if (notice === null) dropdown.prepend(build(wantNotice))
  else if (notice.textContent !== wantNotice.children.join("")) notice.replaceWith(build(wantNotice))
  const empty = dropdown.querySelector(".session-empty")
  const byKey = new Map()
  for (const node of dropdown.querySelectorAll(".session-item")) {
    const key = node === empty ? null : node.getAttribute("data-slot")
    if (key === null || byKey.has(key) || !model.items.some((item) => item.key === key)) { if (node !== empty) node.remove(); continue }
    byKey.set(key, node)
  }
  let cursor = empty
  for (let i = model.items.length - 1; i >= 0; i -= 1) {
    const item = model.items[i]
    let node = byKey.get(item.key)
    if (node === undefined) node = build(itemNode(item, handlers, model.canDelete, face.form === item.key))
    else node = patchItemNode(node, item, handlers, model.canDelete, face.form === item.key) // 回值 = 现件（换形径可能换件）
    if (node.parentNode !== dropdown || node.nextSibling !== cursor) dropdown.insertBefore(node, cursor)
    cursor = node
  }
  if (model.items.length === 0) { if (empty === null) dropdown.append(build(emptyRowNode())); else if (empty.textContent !== t("session.empty")) empty.textContent = t("session.empty") }
  else if (empty !== null) empty.remove()
}

/** 壳原位对账（#606①）：项目钮 ∕ 选择器 ∕ 下拉三件就地更新（`aria-label` 词面随 `locale` 同刷 —— 原位写）；壳缺位 ⇒ 假（挂载面全建径）。 */
function syncBar(root, model, handlers, face) {
  const selector = root.querySelector(".session-selector")
  if (selector === null) return false
  const project = root.querySelector(".session-project")
  const label = model.project === null ? t("rail.action.openDir") : model.project.name
  const cwd = model.project === null ? "" : model.project.cwd
  if (project !== null && project.textContent !== label) project.textContent = label
  if (project !== null && (project.getAttribute("title") ?? "") !== cwd) project.setAttribute("title", cwd)
  for (const [node, word] of [[project, t("rail.action.openDir")], [root.querySelector(".session-new"), t("rail.action.newSession")]]) if (node !== null && node.getAttribute("aria-label") !== word) node.setAttribute("aria-label", word)
  if (selector.getAttribute("aria-label") !== t("session.title")) selector.setAttribute("aria-label", t("session.title"))
  selector.setAttribute("aria-expanded", String(face.open === true))
  const title = selector.querySelector(".session-title")
  if (title !== null && title.textContent !== model.title) title.textContent = model.title
  const dropdown = selector.querySelector(".session-dropdown")
  if (face.open !== true) { if (dropdown !== null) dropdown.remove() }
  else if (dropdown === null) selector.append(build(sessionDropdownTree(model, handlers, face)))
  else syncDropdown(dropdown, model, handlers, face)
  return true
}

/** 薄挂载（面内态直读 ⇒ 重挂保态；容器缺位 ⇒ 空转）：快照捕获 → 壳键控差分（壳缺位 ⇒ 全建）→ 域内复填
 *  → 在形置焦 → 点外关注册。**改名草稿随输入节点存续**（键控差分下无重建擦写——原 `readDraft` ∕ `restoreDraft` 随退役）。 */
export function mountSessionBar(root, state, handlers = {}) {
  if (!root || typeof root.append !== "function") return null
  const model = sessionModel(state)
  const face = setFace(root, { handlers })
  const snap = captureView(root)
  const wired = wireFace(root, handlers)
  if (syncBar(root, model, wired, face) !== true) { clear(root); root.append(build(sessionBarTree(model, wired, face))) }
  restoreView(root, snap)
  bindOutsideClose(root)
  const active = docOf(root)?.activeElement ?? null // 形内焦点不夺（现焦已在形内 ⇒ 零动作 —— 只在形外 ∕ 新起形时置焦）
  if (face.open === true && face.form !== null && active?.closest?.('[data-form="rename"]') == null) root.querySelector?.(NAME_INPUT)?.focus?.()
  return model
}

/** 面接线（面内态 ∘ 注入 handlers 合流；**唯一装配点** —— 树面只认这一层）：开合 ∕ 选择 ∕ 换形三键 ∕ 删除请求。 */
function wireFace(root, handlers) {
  return {
    onToggle: () => {
      const face = faceOf(root)
      setFace(root, { open: face.open !== true, form: null })
      render(root, handlers)
    },
    onSelect: (key) => {
      setFace(root, { open: false, form: null })
      render(root, handlers)
      if (typeof handlers.onSwitch === "function") handlers.onSwitch(key)
    },
    onRename: (key) => {
      setFace(root, { open: true, form: key })
      render(root, handlers)
    },
    onRenameCancel: () => {
      setFace(root, { ...faceOf(root), form: null })
      render(root, handlers)
    },
    onRenameConfirm: (key) => submitRename(root, key, handlers),
    onDelete: (item) => showDeleteConfirm(root, item, handlers),
    onNew: handlers.onNew,
    onOpenProject: handlers.onOpenProject,
  }
}

/** 重挂（面内态变更后 —— 现态取 store 单源）。 */
function render(root, handlers) {
  mountSessionBar(root, store.get(), handlers)
}

/** 点外关（VSC `chat.js:116-121` 对位 · 文档级一枚 —— 选择器全体〔含下拉〕内点按不关 ⇒ 条内零误关）。
 *  判据 = **类名祖链**（非节点引用）：开合处理器先于本监听器重挂树 ⇒ 旧节点已离树，节点引用判据必假。 */
function bindOutsideClose(root) {
  const doc = docOf(root)
  if (doc === null || typeof doc.addEventListener !== "function" || OUTSIDE_BOUND.has(doc)) return
  OUTSIDE_BOUND.add(doc)
  doc.addEventListener("click", (event) => {
    const face = faceOf(root)
    if (face.open !== true) return
    if (insideSelector(event?.target)) return
    setFace(root, { open: false, form: null })
    render(root, face.handlers)
  })
}

/** 点击目标落在选择器子树内（含下拉 —— 两题同子树；按类名祖链上溯 —— 重绘换节点不破）。 */
function insideSelector(target) {
  for (let at = target; at !== null && at !== undefined; at = at.parentNode) {
    if (at.classList?.contains?.("session-selector") === true) return true
  }
  return false
}

/** 改名确认（**词面读数 = 挂载面**：读在形文本控件值 ⇒ 注入 handler；控件缺位 ⇒ 零动作 + 记错）。
 *  读数两形：真 DOM `input.value`（属性面默认值即行题 ⇒ 同值）∥ 描述符面只落 `value` 属性 ⇒ 回退读属性（平测同径）。
 *  `ok` 真 ⇒ 收形 + 重挂（新标题可见）；`ok` 假 ∕ 抛 ⇒ **留场**（草稿不丢）+ 记错。 */
function submitRename(root, key, handlers) {
  const input = root.querySelector?.(NAME_INPUT) ?? null
  if (input === null) {
    console.error("[renderer] rename input missing for slot:", key)
    return
  }
  const raw = input.value !== undefined ? input.value : input.getAttribute?.("value")
  const text = String(raw ?? "")
  let result
  try {
    result = typeof handlers.onRename === "function" ? handlers.onRename(key, text) : false
  } catch (error) {
    console.error("[renderer] session:rename failed:", error)
    return
  }
  Promise.resolve(result)
    .then((ok) => {
      if (ok !== true) return
      setFace(root, { ...faceOf(root), form: null })
      render(root, handlers)
    })
    .catch((error) => console.error("[renderer] session:rename failed:", error))
}

/** 确认面单例（同一刻至多一枚 —— VSC `session-bar.js:103-104` 同径）。 */
let confirmFace = null

/** 关闭确认面（两键 ∕ 背板共用尾）。 */
function closeConfirm() {
  if (confirmFace === null) return
  confirmFace.popover.remove()
  confirmFace.backdrop.remove()
  confirmFace = null
}

/** 内联确认 popover（VSC `showSessionDeleteConfirm` 对位 —— 背板 + 两键 + **默认焦点取消**〔+50ms〕；
 *  挂覆盖层宿主 ⇒ 出面板裁面）；「删除」键 ⇒ 注入 handler（回执面零乐观 —— 列表随 `refreshRail` 刷）。 */
function showDeleteConfirm(root, item, handlers) {
  closeConfirm()
  const backdrop = el("div", { class: "auto-backdrop", onClick: () => closeConfirm() })
  const popover = el("div", { class: "auto-confirm", role: "alertdialog", "aria-label": t("session.delete") }, [
    el("div", { class: "auto-confirm-text" }, [t("session.deleteConfirm", { title: item.title })]),
    el("div", { class: "auto-confirm-actions" }, [
      el("button", {
        type: "button", class: "auto-confirm-yes", "aria-label": t("session.delete"),
        onClick: () => {
          closeConfirm()
          if (typeof handlers.onDelete === "function") handlers.onDelete(item.key)
        },
      }, [t("session.delete")]),
      el("button", { type: "button", class: "auto-confirm-no", "aria-label": t("question.cancel"), onClick: () => closeConfirm() }, [t("question.cancel")]),
    ]),
  ])
  const holder = overlayHost(root)
  if (holder === null) {
    console.error("[renderer] session delete confirm: overlay host unavailable")
    return
  }
  holder.append(backdrop)
  holder.append(popover)
  confirmFace = { popover, backdrop }
  // 安全默认：焦点落「取消」（VSC `session-bar.js:126` 同径：+50ms）
  setTimeout(() => popover.querySelector?.(".auto-confirm-no")?.focus?.(), 50)
}
