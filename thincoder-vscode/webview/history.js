/**
 * history.js — lazy history loading: historyPage rendering (prepend older
 * pages with scroll compensation, append the first page) and the scroll-back
 * trigger that requests older pages near the top.
 * Imported for its side effects (registers the messagesEl scroll listener).
 *
 * #726（2026-10-01 · 跨端消化面恢复批）：页级 pass 携**记录重建**（`record-restore.js`）——
 * `historyPage.messages` 随携 `digest` ∥ `subagent` 记录（宿主读面 opt-in，`panel-session.mjs`）
 * ⇒ 页内逐条重建痕元素 ∥ 归档块元素（元素携 `data-idx`——分页游标 ∥ 防双渲染）。
 */
import { ctx, vscode, S } from "./state.js"
import { t } from "./i18n.js"
import { buildHistoryMessage, scrollDown } from "./ui.js"
import { attachCopyButtons } from "./streaming.js"
import { updateScrollBottomVisibility } from "./scroll.js"
// #726 重建径（页级 pass）：记录（`digest` ∥ `subagent`）⇒ 重建元素（页级轮配对 + 同位去重）。
import { scanPageRounds, restoreRecordEls } from "./record-restore.js"

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
  const anchor = ctx.messagesEl.querySelector(".message, .tool-call, .advisor-block, .sub-block")
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
  const messages = m.messages || []
  // G（SESSION-RESTORE-PARITY）：非空首屏 = 恢复出的真实会话——插入前移除 .welcome
  // （welcome 是空会话语义——clearMessages 后显示；真实消息上方不得残留）——空历史保留
  if (!m.older && messages.length > 0) ctx.messagesEl.querySelector(".welcome")?.remove()
  const frag = document.createDocumentFragment()
  // #726 重建径（单页一次预扫——复列全量（未结轮照现））：记录 ⇒ 痕元素 / 归档块元素（元素携 `data-idx`）；
  // 非记录 ⇒ 既有构件面逐字零改。落位 = 记录位次原位（零配对——页级 pass 按记录序入元素）；
  // 末页判据 = `m.older` 缺省（首窗 = 末页——`hasOlder` 另携；消化重放口径批 · 2026-10-01）。
  const rounds = scanPageRounds(messages, !m.older)
  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i]
    if (msg?.kind === "digest" || msg?.kind === "subagent") {
      for (const el of restoreRecordEls(ctx, msg, rounds.get(i))) frag.appendChild(el)
      continue
    }
    const el = buildHistoryMessage(ctx, msg)
    if (!el) continue
    if (msg.kind === "assistant") attachCopyButtons(el) // code-block copy buttons only
    frag.appendChild(el)
  }
  // F-B1f（SESSION-FLOW-B）: 锚选择器含 .advisor-block/.sub-block——懒历史页与流内
  // 子代理归档块（§14 C-3——消化后落流）共存时插位正确（older 页插到最旧块之上）。
  const anchor = ctx.messagesEl.querySelector(".message, .tool-call, .advisor-block, .sub-block")
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
    for (const msg of messages) if (typeof msg.idx === "number" && msg.idx > maxIdx) maxIdx = msg.idx
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
