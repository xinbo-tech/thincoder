/**
 * i18n-dom.js — apply locale strings to static HTML elements after the i18n
 * message arrives.
 */
import { t } from "./i18n.js"

/** Apply locale strings to static HTML elements after i18n message arrives */
export function applyI18nToDOM() {
  // session bar
  const title = document.getElementById("session-title")
  if (title && title.textContent === "Session 1") title.textContent = t("session.title") + " 1"
  const newBtn = document.getElementById("new-session-btn")
  if (newBtn) newBtn.title = t("session.new")

  // input
  const input = document.getElementById("input")
  if (input) input.placeholder = t("input.placeholder")

  // toolbar buttons
  const sendBtn = document.getElementById("send-btn")
  if (sendBtn) sendBtn.title = t("toolbar.send")
  const abortBtn = document.getElementById("abort-btn")
  if (abortBtn) abortBtn.title = t("toolbar.stop")
  const attachBtn = document.getElementById("attach-btn")
  if (attachBtn) { attachBtn.title = t("toolbar.attach"); attachBtn.textContent = t("toolbar.attachShort") }
  const modelBtn = document.getElementById("model-btn")
  if (modelBtn) modelBtn.title = t("toolbar.model")
  const reasoningBtn = document.getElementById("reasoning-btn")
  if (reasoningBtn) reasoningBtn.title = t("toolbar.reasoning")
  const autoBtn = document.getElementById("auto-btn")
  if (autoBtn) autoBtn.title = t("toolbar.autoApprove")
  if (document.getElementById("advisor-btn")) document.getElementById("advisor-btn").title = t("toolbar.advisor")
  if (document.getElementById("eng-btn")) document.getElementById("eng-btn").title = t("toolbar.engineering")
  const settingsBtn = document.getElementById("settings-btn")
  if (settingsBtn) settingsBtn.title = t("toolbar.settings")

  // settings panel
  const settingsTitle = document.querySelector("#settings-panel h3")
  if (settingsTitle) settingsTitle.textContent = t("settings.title")

  // Dynamic content rendered BEFORE the i18n message arrived (chat.js renders the welcome
  // strip on load — its t() calls return raw keys until setStrings ran; ui.js showWelcome
  // carries data-i18n / data-i18n-html attrs for this refresh — 2026-09-05 真机走查修复：
  // 此前只刷 .welcome h2，两个 p 键名残留）。data-i18n = textContent；data-i18n-html =
  // innerHTML（值可含 <code> 等标签）。
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n) })
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml) })
  // provider status banner（同上时序——showBanner 可能先于 i18n 消息；键随 keyOk 状态）
  document.querySelectorAll("[data-banner-key]").forEach((el) => { el.textContent = t(el.dataset.bannerKey) })

  // welcome page (legacy static path — superseded by data-i18n above, kept for the
  // static #welcome-panel h2 which onboarding.js fills at display time)
  const welcome = document.querySelector(".welcome h2")
  if (welcome) welcome.textContent = t("welcome.heading")
}
