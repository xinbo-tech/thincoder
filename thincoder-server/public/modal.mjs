/**
 * modal.mjs — 控制台公共弹窗组件（webui/WEBUI.md §2.4①——KD-SV-31）：基座 = 原生 `<dialog>` + `showModal()`
 * （平台承担模态语义——顶层渲染 ∥ 背景 inert ∥ ESC 缺省关闭（`cancel` 事件）∥ `::backdrop` 遮罩）；本档只补壳与策略。
 *
 * API：`openModal({ title, body, footer, onClose })` ⇒ 句柄 `{ close(), root }`；`title` = 字符串（textContent）；
 * `body`/`footer` = 调用方以 `h` 构建的节点（footer 缺省 ⇒ 无脚区）；`onClose` = 关闭回调（任意路径——一次）。
 * `closeActiveModal()` = 清单例窗（路由切换收口 —— 幂等单源；无在场 ⇒ 零动作）。
 * **窗体助手四件（本批自 `views-sandbox.mjs` 迁入——sandbox-docker-admin 批；拆档避循环 import）**：
 * `showNote`（窗内状态行）∥ `field`（表单字段行）∥ `submitThen`（确认类提交收口）∥ `confirmModal`（确认弹窗骨）——两新沙盒件共用。
 * 单例：同时最多一窗——开新先关旧（不叠加）。关闭 = × 钮 ∥ `Esc` ∥ `close()`；遮罩点击不关（平台缺省——防误触
 * 丢表单）；任意关闭 = 丢弃未保存草稿（在案）。开窗期锁背景滚动（`body.modal-open` 类——`close` 事件收口）；
 * 焦点/背景 inert/关闭还原 = 平台语义（调用方以 `autofocus` ∥ `focus()` 定首选）。
 *
 * 可测性：模块顶层零浏览器全局（node 可 import——API 形断言）；DOM 交互仅在 `openModal` 内。零依赖零构建（KD-SV-9）。
 */
import { mapError, t } from "./i18n.mjs"

/** 单例槽：当前窗（同时最多一窗——开新先关旧；不叠加）。 */
let active = null

/** 开窗：建 `<dialog>` 壳（头 = 标题 + × 钮 ∥ 体 ∥ 脚缺省无）⇒ `showModal()`；返回句柄 `{ close, root }`。 */
export function openModal({ title, body = null, footer = null, onClose = null } = {}) {
  if (active !== null) active.close() // 单例：开新先关旧

  const root = document.createElement("dialog")
  root.className = "modal"
  const heading = document.createElement("h3")
  heading.textContent = String(title ?? "")
  const closeBtn = document.createElement("button")
  closeBtn.type = "button"
  closeBtn.className = "modal-close"
  closeBtn.textContent = "×"
  closeBtn.setAttribute("aria-label", t("common.close")) // 两表同步（§2.2）
  const head = document.createElement("header")
  head.className = "modal-head"
  head.append(heading, closeBtn)
  const bodyEl = document.createElement("div")
  bodyEl.className = "modal-body"
  if (body !== null) bodyEl.append(body)
  root.append(head, bodyEl)
  if (footer !== null) {
    const footEl = document.createElement("footer")
    footEl.className = "modal-foot"
    footEl.append(footer)
    root.append(footEl)
  }

  let closed = false
  /** 收口（一次——× ∥ `Esc` ∥ `close()` 三路同链）：解锁滚动 ∥ 移除壳 ∥ 清单例槽 ∥ 回调。 */
  const finish = () => {
    if (closed) return
    closed = true
    document.body.classList.remove("modal-open")
    root.remove()
    if (active !== null && active.root === root) active = null
    if (onClose !== null) onClose()
  }
  const close = () => {
    if (closed) return
    if (root.open) root.close() // 平台 `close` 事件 ⇒ finish
    finish() // 显式收口兜底（两路幂等——`closed` 卫）
  }
  closeBtn.addEventListener("click", close)
  root.addEventListener("close", finish)

  document.body.append(root)
  document.body.classList.add("modal-open")
  active = { close, root }
  root.showModal()
  return active
}

/** 清单例窗（路由切换收口 —— #979）：`active?.close()` 幂等单源（`close` 内 `closed` 卫 + 槽自清）；
 *  无在场 ⇒ 零动作；返回是否有窗在闭（调用面零依赖 —— 路由链直呼）。 */
export function closeActiveModal() {
  if (active === null) return false
  active.close()
  return true
}

// ── 窗体助手四件（迁入——沙盒两新档共用；行为零变）─────────────────────────────

/** 窗内状态行（`note` 节点置文 + 类：错 ⇒ `hint error` ∥ 中性 ⇒ `hint`）。 */
export function showNote(note, text, isError = true) {
  note.hidden = false
  note.className = isError ? "hint error" : "hint"
  note.textContent = text
}

/** 表单字段（标题行 + 控件——`.provider-form.stacked` 逐项竖排）。 */
export function field(h, labelKey, ...controls) {
  return h("label", {}, h("span", { text: t(labelKey) }), ...controls)
}

/** 确认类提交收口：成功 ⇒ flash + 关窗 + 刷新；失败 ⇒ 窗内人话（钮复位——可重试）。 */
export async function submitThen(ctx, { note, button, modal, call, flash, reload }) {
  note.hidden = true
  button.disabled = true
  try {
    await call()
    ctx.flash(flash)
    modal.close()
    await reload()
  } catch (error) {
    button.disabled = false
    showNote(note, mapError(error))
  }
}

/** 确认弹窗骨（说明段 + 脚区：危险确认 + 取消）；调用方传入提交动作；`bodyParams` = 说明文案占位参数（可选）。 */
export function confirmModal(ctx, { title, bodyText, bodyParams = {}, confirmText, submit }) {
  const { h } = ctx
  const note = h("p", { class: "hint error", hidden: true })
  const confirmBtn = h("button", { type: "button", class: "danger", text: confirmText, onclick: submit })
  const modal = openModal({
    title: t(title), body: h("div", {}, h("p", { class: "hint", text: t(bodyText, bodyParams) }), note),
    footer: h("div", { class: "row-form" }, confirmBtn, h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() })),
  })
  return { modal, note, confirmBtn }
}
