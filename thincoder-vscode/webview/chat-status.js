/**
 * chat-status.js — 显示状态元素一族（2026-09-22 structure-debt §2.4 · #163）：压缩状态行
 * （CONTEXT-COMPACTION §7 D-C3）/ 状态段两函数（WEBVIEW §14 C-12#1 / C-15）/ digest 轮可见面
 * （B6——WEBVIEW.md §7.4 + §14 C-9/C-10）——三块自 chat.js 逐字搬移（仅去包裹）；本轮元素槽
 * `_digestRoundEl` 随迁（与 showDigestStatus 同生共死——D-C3）。
 * 导出面 = 档尾 `export { … }` 名单（四函数声明保持原档逐字——零改声明行）。
 */
import { ctx, S } from "./state.js"
import { escHtml, maybeScrollDown } from "./ui.js"
import { t } from "./i18n.js"
import { renderStatusBar } from "./status-bar.js"

// ─── Compression status line (CONTEXT-COMPACTION §7 D-C3) ─────
// Lifecycle-only visibility: "Compressing context…" → "Compressed: N tokens freed
// (Xs)" / "failed: <error>" / 3-failure degradation note. One element in the messages
// stream, updated in place (session view clears recreate it via replaceChildren).
function showCompressStatus(m) {
  let el = document.getElementById("compress-status")
  if (!el) {
    el = document.createElement("div")
    el.id = "compress-status"
    el.className = "compress-status"
    document.getElementById("messages").appendChild(el)
  }
  el.classList.remove("compress-done", "compress-failed")
  let text
  if (m.status === "start") {
    text = m.messages != null ? t("compress.start", { n: m.messages }) : t("compress.starting")
  } else if (m.status === "done") {
    text = t("compress.done", {
      tokens: m.tokensFreed != null ? String(m.tokensFreed) : "?",
      seconds: ((m.elapsedMs ?? 0) / 1000).toFixed(1),
    })
    el.classList.add("compress-done")
  } else if (m.status === "fallback") {
    text = t("compress.fallback", { n: m.tailMessages != null ? String(m.tailMessages) : "?" })
    el.classList.add("compress-failed")
  } else {
    text = t("compress.failed", { error: escHtml(m.error ?? "") })
    el.classList.add("compress-failed")
  }
  el.innerHTML = text
  maybeScrollDown(ctx)
}


// ─── Status-line text segment (WEBVIEW §14 C-12#1 / C-15) ──────
// host 发结构化 statusText（kind 判别——限流/过载/配额/索引）；webview 按 locale 渲染
// （M3——locale 单源；文案在 status-bar.js）。**活动恢复即清**（token/reasoning/toolCall/
// toolResult/complete/aborted/error——C-15——无 TTL）。
function clearStatusText() {
  if (S._statusText == null) return
  S._statusText = null
  renderStatusBar()
}
/** index 进度 done 相位 = 状态段清除（索引进度结束）；其余原样存（渲染时按 kind 取文案）。 */
function handleStatusText(m) {
  S._statusText = m.kind === "index" && m.phase === "done" ? null : m
  renderStatusBar()
}

// ─── Digest round visibility (B6 — WEBVIEW.md §7.4 + §14 C-9/C-10) ─────
// 消化轮可见面（**每轮独立元素**——跨轮漂移消除）：`digest start` → 追加 `.digest-turn` 标签
// 行（CLI 起跑 dim 行对位）+ 本轮独立 `.digest-status` 元素（`id="digest-status"` 退役）+ 记
// 本轮边界 `S._digestBoundary`（归档落点——C-4）+ `assistantLabeled` 复位（本轮 assistant
// 输出带一次回合标签——C-9③）；`digest end` → **本轮**元素原地更新（ok 旗标语义不变）；
// `digest cap` → `.digest-cap` 行（auto dim / stop warn——CLI agent-turn.mjs:188/:192 对位）。
let _digestRoundEl = null
function showDigestStatus(m) {
  const messagesEl = ctx.messagesEl
  if (m.status === "start") {
    const label = document.createElement("div")
    label.className = "digest-turn"
    // M4（显示面消差批 §2.1）+ F-UC8（2026-09-21 信号提示行批 · §6.27.12.13 ①–②）：起跑标签 **两档**
    // （`tier === "ask"` 携参 `{ from, msg }` / 其余含缺省档 ⇒ 既有键——后向兼容）；字面单源 = 核
    // i18n 容器（本地档不重复定义）。AUTO 档同判（`auto` 泛句退场——无生产者）。
    label.textContent = t(m.tier === "ask" ? "digest.turnLabelAsk" : "digest.turnLabel",
      m.tier === "ask" ? { from: m.from ?? "?", msg: m.msg ?? "…" } : {})
    messagesEl.appendChild(label)
    _digestRoundEl = null
    // 计数元素规则 = `n > 0`（D-SL2——两档同规；`n = 0` 的 ask-only 轮零元素：幻影行禁出）
    if ((m.n ?? 0) > 0) {
      const el = document.createElement("div")
      el.className = "digest-status"
      el.dataset.n = String(m.n)
      el.textContent = t("digest.start", { n: el.dataset.n })
      messagesEl.appendChild(el)
      _digestRoundEl = el
    }
    // 零计数元素轮（`n = 0`——起跑即发）：只打标签行；本轮 `_digestRoundEl` 置空 ⇒ end 零动作
    // （禁兜底建元素——不得造 `dataset.n = "?"` 幻影行）。
    S._digestBoundary = label // C-4：本轮边界 = 本轮首元素（标签行）
    ctx.assistantLabeled = false // C-9③：本轮 assistant 输出带一次回合标签
    maybeScrollDown(ctx)
    return
  }
  if (m.status === "cap") {
    const cap = document.createElement("div")
    cap.className = m.mode === "stop" ? "digest-cap digest-cap-stop" : "digest-cap"
    cap.textContent = m.mode === "stop"
      ? t("digest.capStop", { turns: m.turns ?? "?" })
      : t("digest.capAuto")
    messagesEl.appendChild(cap)
    maybeScrollDown(ctx)
    return
  }
  // end：本轮元素原地更新（start 连发亦各成独立元素——end 更新其前最近未结本轮元素）；
  // 本轮无计数元素（`n = 0` 轮——`_digestRoundEl` 置空）⇒ **零动作**（M4：禁兜底建元素——
  // 旧兜底行会造 `dataset.n = "?"` 幻影计数行）。
  const el = _digestRoundEl?.isConnected ? _digestRoundEl : null
  if (!el) return
  el.classList.remove("digest-done", "digest-failed")
  const seconds = ((m.ms ?? 0) / 1000).toFixed(1)
  if (m.ok !== false) {
    el.textContent = t("digest.done", { n: el.dataset.n ?? "?", seconds })
    el.classList.add("digest-done")
  } else {
    el.textContent = t("digest.aborted", { seconds })
    el.classList.add("digest-failed")
  }
  maybeScrollDown(ctx)
}

export { clearStatusText, handleStatusText, showCompressStatus, showDigestStatus }
