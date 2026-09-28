/**
 * mount-sessions.mjs — 会话控制面**挂载与交互** + 会话族接线（会话模型轮 R13：原标签条 ∕ 左列两面随会话模型
 * 裁撤退场 —— 本档由「会话族接线」扩为「VSC 形会话控制面 + 接线」；**硬限拆分**：纯构树三件
 * 〔`sessionModel` ∕ `sessionBarTree` ∕ `sessionDropdownTree` + 节点助手〕随 `renderer/views/session-control.mjs`
 * 出档〔该档 588 行越 500 硬限〕—— **结构拆分零语义**：面不变 ∕ 判据不变，只换宿主档）。
 * 基准 = `thincoder-vscode/webview/session-bar.js` 三件〔项目钮 ∕ 下拉选择器 ∕ 新建钮〕，值面 = `webview/session.css`；
 * 需求句 = `docs/desktop/requirements/PROJECT.md` §3.1「会话控制（面板内 · VSC 形）」行。
 *
 * 面（`SESSION_SLOT` = `.session` 首槽 —— 原标签条槽改锚；条体三件 ∕ 下拉内容构树住 `views/session-control.mjs`）：
 *   ① 项目钮（出口 `project:open`）· ② 下拉选择器（开合 = 点击 toggle ∕ Enter ∕ Space；`aria-expanded` 同步；
 *   点内不关 ∕ 点外关）· ③ 新建钮（出口 `session:create`）；三出口（通道名零改）：切会话 `session:switch`
 *   （点条目 ⇒ 关下拉）· 改名 `session:rename`（✎ ⇒ 条目原位换形〔文本控件 + 取消 ∕ 确认两键〕⇒ 通道）·
 *   删除 `session:delete`（✕ ⇒ 内联确认 popover〔`.auto-confirm` 族：背板 + 两键 + 默认焦点取消〕⇒ 通道）。
 *
 * 接线：会话路三出口**同一路**（`session:switch` / `session:create` / `session:resume`）⇒ 共用尾 `openResult`
 * （开页 `openPage` + 列表刷新 `refreshRail`）；`backfill` = 触顶回填出口；删会话 `ok` ⇒ 列表刷新 + **删活动会话 ⇒
 * 邻位接管**（会话列表形：同位置行，越界取末行；列表空 ⇒ 关页）—— `ok:false`（核拒：末项门 ∕ 槽缺）
 * ⇒ **零动作** + 记错。**换形态态 ∕ 开合态住面内 DOM 记账**（`FACE` WeakMap —— 原 store `railForm` ∕ `pendingClose`
 * 两切片随裁撤退场）；重绘（外部刷新）草稿保护 = 值 / 焦点 / 光标按同锚捕获复填（沿原左列挂载先例）。
 *
 * 导出面 = `renderer/app.mjs` 消费集：`SESSION_SLOT` · `refreshRail`（启动 / 切项目 / 会话路三出口后 —— **唯一写
 * 路径**）· `backfill` · `resumeOpened` · `activateSession` · `createSession` · `confirmRename` / `deleteSession`
 * （两出口 ∥ popover 确认）· `mountSessionBar`（薄挂载）；纯树面三件住 `renderer/views/session-control.mjs`；
 * `isProject` / `slotOf` / `loadPage` / `openPage` / `openResult` = 本档私有。
 * 窄桥 = 本档模块级 `globalThis.thincoder`（装配面 = `src/preload/preload.cjs` —— 与 `renderer/app.mjs` 同源同刻读取）。
 * 纪律：读面失败一律 `console.error` + 零切片写；零 `node:` / 零裸包（守卫 = `test/guard-closure.test.mjs`）。
 */
import { openSession } from "./events.mjs"
// 页读径拆分产出（「对齐第二批」）——硬限拆档，结构拆分零语义
import { applyPage } from "./page-read.mjs"
import { build, clear, el } from "./dom.mjs"
import { t } from "./i18n.mjs"
import { beginBackfill, endBackfill, store } from "./store.mjs"
// 会话控制面纯构树三件（R13 硬限拆分产出 —— 树面单源；本档只挂载与接线）
import { sessionBarTree, sessionModel } from "./views/session-control.mjs"

// 窄桥（装配面 = `src/preload/preload.cjs`）
const host = globalThis.thincoder

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

/** 草稿捕获（重绘前）：在形文本控件的值 / 焦点 / 光标区间；无在形控件 ⇒ `null`。 */
function readDraft(root) {
  const node = root.querySelector?.(NAME_INPUT) ?? null
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
  const node = root.querySelector?.(NAME_INPUT) ?? null
  if (node === null) return
  node.value = draft.value
  if (draft.focused !== true || typeof node.focus !== "function") return
  node.focus()
  if (draft.start !== null && typeof node.setSelectionRange === "function") node.setSelectionRange(draft.start, draft.end ?? draft.start)
}

/** 薄挂载（面内态直读 ⇒ 重挂保态；容器缺位 ⇒ 空转）：清槽 → 条体树（开时含下拉）→ 草稿复填 ∕ 置焦 → 点外关注册。 */
export function mountSessionBar(root, state, handlers = {}) {
  if (!root || typeof root.append !== "function") return null
  const model = sessionModel(state)
  const face = setFace(root, { handlers })
  const draft = face.open === true && face.form !== null ? readDraft(root) : null
  clear(root)
  root.append(build(sessionBarTree(model, wireFace(root, handlers), face)))
  bindOutsideClose(root)
  if (face.open === true && face.form !== null) {
    const input = root.querySelector?.(NAME_INPUT) ?? null
    if (draft !== null) restoreDraft(root, draft)
    else if (typeof input?.focus === "function") input.focus()
  }
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

// ─── 会话族接线（批 5 · 批档 §2.2（f）· 批 8 补页读两径）────────────────────────

/** `{ cwd, recent }` 形判据（`project:recent` 面；`cwd` = 未打开项目时 `null`）。 */
function isProject(payload) {
  return payload !== null && typeof payload === "object" && Array.isArray(payload.recent)
}

/** 列表刷新（启动 / 切项目 / 会话路三出口后 —— **唯一写路径**）：两读面并发 ⇒ 写切片 ⇒ 订阅面重挂（下拉列表供给）。 */
export async function refreshRail() {
  try {
    const [project, list] = await Promise.all([host.invoke("project:recent"), host.invoke("sessions:list")])
    if (!isProject(project) || !Array.isArray(list?.rows)) {
      console.error("[renderer] session list payload shape unexpected:", project, list)
      return
    }
    store.set({ project: { cwd: project.cwd ?? null, recent: project.recent }, sessions: list.rows, ledger: list.ledger ?? null })
  } catch (error) {
    console.error("[renderer] session list refresh failed:", error)
  }
}

/** 槽号回代：视图面行键 / 条目键是**串**（键域），通道载荷 `{ slot }` 是槽号域 —— 核写本端记录时**原值落盘**
 *  （`thincoder-core/session-slots.mjs:133`）且读面要求整数槽（同档 `:126` `Number.isInteger`）⇒ 串入会使本端记录
 *  退化为「缺失」。纯类型回代（非整数 ⇒ 原值直传，交核判 —— 端层**零预校验**：判据单源 = 核）。 */
function slotOf(key) {
  const slot = Number(key)
  return Number.isInteger(slot) ? slot : key
}

/** 页读（首屏 `before = null` / 回填 = 页游标）：`history:page` ⇒ `applyPage` 落态；抛 / 拒绝 ⇒ 记错 + 清在途（成败皆清）。 */
async function loadPage(key, before) {
  try {
    const receipt = await host.invoke("history:page", { key, before })
    store.set(applyPage(store.get(), receipt, { key, before }))
  } catch (error) {
    console.error("[renderer] history:page failed:", error)
    store.set(endBackfill(store.get()))
  }
}

/** 开页（三路开会话**同一路**）：键面动作（`openSession` ⇒ `activeSession` + 清本键 `done` 位标）+ 首屏页读。 */
function openPage(key) {
  store.set(openSession(store.get(), key))
  void loadPage(key, null)
}

/** 触顶回填（接线态）：判据单源 = store `beginBackfill`（无更早页 / 重入 ⇒ 原引用 ⇒ 零动作、零页读）；受理 ⇒ 页读。 */
export function backfill() {
  const state = store.get()
  const next = beginBackfill(state, { page: state.history?.page ?? null })
  if (next === state) return
  store.set(next)
  void loadPage(next.activeSession, next.history.page)
}

/** 会话路三出口**共用尾**（三路 = 同一路）：`ok` ⇒ 开页 + 列表刷新；否则只记错（零切片写、界面照旧）。 */
async function openResult(channel, receipt, context) {
  if (receipt?.ok !== true) {
    if (context !== undefined) console.error(`[renderer] ${channel} failed:`, receipt?.reason, "slot:", context)
    else console.error(`[renderer] ${channel} failed:`, receipt?.reason)
    return false
  }
  openPage(String(receipt.slot))
  await refreshRail()
  return true
}

/** 点开即续（`project:open` 成功后自动一次 —— 该通道恒 `ok`：核判据兜底分配新槽）。 */
export async function resumeOpened() {
  try {
    await openResult("session:resume", await host.invoke("session:resume"))
  } catch (error) {
    console.error("[renderer] session:resume failed:", error)
  }
}

/** 切会话（下拉点条目 —— **同一路**：切换即开页）：`session:switch` ⇒ 共用尾。 */
export async function activateSession(key) {
  try {
    return await openResult("session:switch", await host.invoke("session:switch", { slot: slotOf(key) }), key)
  } catch (error) {
    console.error("[renderer] session:switch failed:", error)
    return false
  }
}

/** 新建会话（新建钮出口）：`session:create` ⇒ 共用尾。 */
export async function createSession() {
  try {
    return await openResult("session:create", await host.invoke("session:create"))
  } catch (error) {
    console.error("[renderer] session:create failed:", error)
    return false
  }
}

/** 改名出口（下拉条目 ✎ 换形后的确认键 —— 通道既有）：`ok` 真 ⇒ 列表刷新（新标题可见）+ 回 `true`（面收形）；
 *  `ok:false`（核拒：`invalid-slot` ∕ `mtime-conflict` 等四值闭集直传）∕ 抛 ⇒ **零写零收形**（草稿不丢）+ 记错。 */
export async function confirmRename(key, text) {
  try {
    const receipt = await host.invoke("session:rename", { slot: slotOf(key), title: text })
    if (receipt?.ok !== true) {
      console.error("[renderer] session:rename failed:", receipt?.reason, "slot:", key)
      return false
    }
    await refreshRail()
    return true
  } catch (error) {
    console.error("[renderer] session:rename failed:", error)
    return false
  }
}

/** 删除出口（确认 popover 的「删除」键 —— 通道既有）：`ok` 真 ⇒ 列表刷新 + **删活动会话 ⇒ 邻位接管**
 *  （`closeTab` 同律的会话列表形：同位置行〔越界取末行〕⇒ `session:switch` 同一路；列表空 ⇒ 关页）；
 *  `ok:false`（核拒：末项门 `last-session` ∕ `slot-missing`）⇒ **零动作**（不造死页）+ 记错。 */
export async function deleteSession(key) {
  try {
    const before = store.get()
    const rows = Array.isArray(before.sessions) ? before.sessions : []
    const index = rows.findIndex((row) => String(row?.slot) === String(key))
    const wasActive = String(before.activeSession ?? "") === String(key)
    const receipt = await host.invoke("session:delete", { slot: slotOf(key) })
    if (receipt?.ok !== true) {
      console.error("[renderer] session:delete failed:", receipt?.reason, "slot:", key)
      return false
    }
    await refreshRail()
    if (wasActive) await takeover(index)
    return true
  } catch (error) {
    console.error("[renderer] session:delete failed:", error)
    return false
  }
}

/** 删活动会话后的接管（**邻位接管律**会话列表形）：同位置行（越界取末行）⇒ 切会话同一路；列表空 ⇒ 关页。 */
async function takeover(index) {
  const rows = store.get().sessions ?? []
  if (rows.length === 0) {
    store.set(openSession(store.get(), null))
    return
  }
  const at = Math.min(Math.max(index, 0), rows.length - 1)
  await activateSession(String(rows[at]?.slot))
}
