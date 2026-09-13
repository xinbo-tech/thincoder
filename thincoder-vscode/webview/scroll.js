/**
 * scroll.js — scroll-follow init and the floating scroll-to-bottom button.
 * Lazy history made scrolling back a long trip — the button returns to the
 * latest message in one click. Positioned just above the toolbar.
 * Imported for its side effects.
 */
import { ctx } from "./state.js"
import { t } from "./i18n.js"
import { scrollDown, initScrollFollow } from "./ui.js"

initScrollFollow(ctx)

const scrollBottomBtn = document.createElement("button")
scrollBottomBtn.id = "scroll-bottom-btn"
scrollBottomBtn.className = "scroll-bottom-btn"
scrollBottomBtn.type = "button"
scrollBottomBtn.title = t("msg.scrollBottom")
scrollBottomBtn.textContent = "↓"
scrollBottomBtn.addEventListener("click", () => scrollDown(ctx))
document.getElementById("chat-container").appendChild(scrollBottomBtn)

function positionScrollBottomBtn() {
  const tb = document.getElementById("toolbar")
  scrollBottomBtn.style.bottom = (tb ? tb.offsetHeight : 150) + 10 + "px"
}
positionScrollBottomBtn()
window.addEventListener("resize", positionScrollBottomBtn)

export function updateScrollBottomVisibility() {
  const el = ctx.messagesEl
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  const scrollable = el.scrollHeight > el.clientHeight + 40
  scrollBottomBtn.classList.toggle("visible", scrollable && !nearBottom)
}
