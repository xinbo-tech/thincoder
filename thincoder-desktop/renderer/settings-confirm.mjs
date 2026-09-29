/**
 * settings-confirm.mjs — 设置面删除确认件（B10 W2 · S6）：**不可复得类删除的前置确认弹层**。
 *
 * 形对位 VSC `settings-widgets.js:77-105`（`showConfirmPopover`：背板 + 弹框 + 两键 + 默认焦点取消 +
 * 框内 Escape 拦截 ⇒ 不连带关面）+ 桌面先例 `renderer/mount-sessions.mjs` `showDeleteConfirm`
 * （`.auto-confirm` 族 —— 复用既有 CSS，**零新样式**；挂 `document.body` ⇒ 出面板溢出裁面）。
 * 词面固定（同 VSC `_confirmSecretDelete` 包装）：正文 `settings.secretDeleteConfirm` · 确认 `session.delete` ·
 * 取消 `question.cancel`。`onConfirm` = **开框时捕获**的闭包（不读确认时的 DOM）⇒ 确认期间重绘不改
 * 删除目标、不吞确认（VSC 同契约）。
 *
 * 出口两件：`confirmSecretDelete(onConfirm)`（单例：开框前先清既有）· `closeSettingsConfirm()`
 * （设置面关 ∕ 背板 ∕ 取消三路同清）；纯描述符面 `settingsConfirmTree(onConfirm)` 供批内件直测两键语义。
 * 纪律：零 `node:` ∕ 零裸包；DOM 构造经 `dom.mjs`（唯一构造点）。
 */
import { build } from "./dom.mjs"
import { t } from "./i18n.mjs"

/** 现态弹框（宿主 → `{ backdrop, popover }`；单例 —— 同刻至多一框）。 */
let face = null

/** 关闭确认面（两键 ∕ 背板 ∕ 关面共用尾；无框 ⇒ 零动作）。 */
export function closeSettingsConfirm() {
  if (face === null) return
  face.popover.remove()
  face.backdrop.remove()
  face = null
}

/**
 * 确认弹层描述符（纯 —— 批内件直测面）：是 ⇒ 关框 + `onConfirm`；否 ∕ 背板 ∕ 框内 Escape ⇒ 关框零动作
 * （Escape 拦截冒泡 ⇒ 设置面 Esc 关面不连带触发）。
 */
export function settingsConfirmTree(onConfirm) {
  const yes = {
    tag: "button",
    props: { type: "button", class: "auto-confirm-yes", "aria-label": t("session.delete"), onClick: () => { closeSettingsConfirm(); if (typeof onConfirm === "function") onConfirm() } },
    children: [t("session.delete")],
  }
  const no = {
    tag: "button",
    props: { type: "button", class: "auto-confirm-no", "aria-label": t("question.cancel"), onClick: () => closeSettingsConfirm() },
    children: [t("question.cancel")],
  }
  return {
    backdrop: { tag: "div", props: { class: "auto-backdrop", onClick: () => closeSettingsConfirm() }, children: [] },
    popover: {
      tag: "div",
      props: {
        class: "auto-confirm", role: "alertdialog", "aria-label": t("session.delete"),
        onKeydown: (event) => {
          if (event?.key !== "Escape") return
          event.stopPropagation?.() // 框内 Escape：不冒到设置面 document 键面（面保持开）
          closeSettingsConfirm()
        },
      },
      children: [
        { tag: "div", props: { class: "auto-confirm-text" }, children: [t("settings.secretDeleteConfirm")] },
        { tag: "div", props: { class: "auto-confirm-actions" }, children: [yes, no] },
      ],
    },
  }
}

/** 打开确认弹层（单例；宿主缺 `append` 面 ⇒ 记错零动作 —— 零静默）。 */
export function confirmSecretDelete(onConfirm) {
  closeSettingsConfirm()
  const descriptor = settingsConfirmTree(onConfirm)
  const body = typeof document !== "undefined" ? document.body ?? document.documentElement : null
  if (body === null || typeof body.append !== "function") {
    console.error("[renderer] settings confirm: overlay host unavailable")
    return
  }
  const backdrop = build(descriptor.backdrop)
  const popover = build(descriptor.popover)
  body.append(backdrop)
  body.append(popover)
  face = { backdrop, popover }
  // 安全默认：焦点落「取消」（VSC `settings-widgets.js:104` 同径：+50ms）
  setTimeout(() => popover.querySelector?.(".auto-confirm-no")?.focus?.(), 50)
}
