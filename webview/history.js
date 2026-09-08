/**
 * history.js — lazy history loading: historyPage rendering (prepend older
 * pages with scroll compensation, append the first page) and the scroll-back
 * trigger that requests older pages near the top.
 * Imported for its side effects (registers the messagesEl scroll listener).
 */
import { ctx, vscode, S } from "./state.js"
import { t } from "./i18n.js"
import { buildHistoryMessage, scrollDown } from "./ui.js"
import { attachCopyButtons } from "./streaming.js"
import { updateScrollBottomVisibility } from "./scroll.js"

/** Earliest loaded global history idx (from data-idx buttons), or null if none. */
function minLoadedIdx(ctx) {
  let min = Infinity
  for (const el of ctx.messagesEl.querySelectorAll("[data-idx]")) {
    const v = Number(el.dataset.idx)
    if (Number.isFinite(v) && v < min) min = v
  }
  return min === Infinity ? null : min
}

function showLoadOlderIndicator(ctx) {
  if (document.getElementById("load-older-indicator")) return
  const el = document.createElement("div")
  el.id = "load-older-indicator"
  el.className = "load-older-indicator"
  el.textContent = t("msg.loadingOlder")
  const anchor = ctx.messagesEl.querySelector(".message, .tool-call, .advisor-block")
  ctx.messagesEl.insertBefore(el, anchor)
}

function removeLoadOlderIndicator(ctx) {
  ctx.messagesEl.querySelector("#load-older-indicator")?.remove()
}

/**
 * Render a historyPage payload ({ messages, hasOlder, older }). `older` pages are
 * prepended ABOVE the earliest rendered message with the scroll position
 * compensated (the newly loaded content must not shove the viewport down);
 * the first paint page is appended and scrolled to the bottom.
 */
export function applyHistoryPage(ctx, m) {
  const frag = document.createDocumentFragment()
  for (const msg of m.messages || []) {
    const el = buildHistoryMessage(ctx, msg)
    if (!el) continue
    if (msg.kind === "assistant") attachCopyButtons(el) // code-block copy buttons only
    frag.appendChild(el)
  }
  // F-B1f（SESSION-FLOW-B）: 锚选择器含 .advisor-block——懒历史页与流内子代理块
  // （live/冻结——同层直接子元素）共存时插位正确（older 页插到最旧块之上）。
  const anchor = ctx.messagesEl.querySelector(".message, .tool-call, .advisor-block")
  if (m.older) {
    const prevTop = ctx.messagesEl.scrollTop
    const prevHeight = ctx.messagesEl.scrollHeight
    ctx.messagesEl.insertBefore(frag, anchor)
    ctx.messagesEl.scrollTop = prevTop + (ctx.messagesEl.scrollHeight - prevHeight)
  } else {
    ctx.messagesEl.insertBefore(frag, anchor)
    scrollDown(ctx)
  }
  ctx._hasOlder = !!m.hasOlder
  if (!m.older) {
    // 初始页：以页内最大 idx+1 作为后续 live 消息的起始 idx（宿主不回发 live idx，本地续接）
    let maxIdx = -1
    for (const msg of m.messages || []) if (typeof msg.idx === "number" && msg.idx > maxIdx) maxIdx = msg.idx
    ctx._nextIdx = maxIdx + 1
  }
  S._loadingOlder = false
  removeLoadOlderIndicator(ctx)
}

// Scroll-back trigger: near the top → fetch the next older page (guarded against
// double requests; _hasOlder=false means everything is already rendered).
ctx.messagesEl.addEventListener("scroll", () => {
  updateScrollBottomVisibility()
  if (!ctx._hasOlder || S._loadingOlder) return
  if (ctx.messagesEl.scrollTop > 40) return
  const before = minLoadedIdx(ctx)
  if (before == null) { ctx._hasOlder = false; return }  // nothing anchorable — defensive stop
  S._loadingOlder = true
  showLoadOlderIndicator(ctx)
  vscode.postMessage({ type: "loadOlder", before })
})
