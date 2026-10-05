/**
 * chat-status.js — 显示状态元素一族（2026-09-22 structure-debt §2.4 · #163）：压缩状态行
 * （CONTEXT-COMPACTION §7 D-C3）/ 状态段两函数（WEBVIEW §14 C-12#1 / C-15）/ digest 轮可见面
 * （B6——WEBVIEW.md §7.4 + §14 C-9/C-10）——三块自 chat.js 逐字搬移（仅去包裹）；本轮计数元素引用
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
// 消化轮可见面（**每轮独立元素**——跨轮漂移消除；**2026-10-01 自然形跟正 · 台账 #768：
// 行/元素出即留**）：`digest start` → 追加 `.digest-turn` 标签行（CLI 起跑 dim 行对位）+ 本轮独立
// `.digest-status` 元素（`n > 0`）+ 记本轮边界 `S._digestBoundary`（**取面：计数元素 ∥ 无 ⇒ 标签元素**
// ——归档落点；C-4）+ `assistantLabeled` 复位（本轮 assistant 输出带一次回合标签）；`digest end` →
// **追加终态元素**（`.digest-status` + `digest-done` ∕ `digest-failed`——不动原计数元素 ∥ 零就地换文；
// **+ 消化账务批（2026-10-05 · 台账 #930）：`unsettled > 0` ⇒ 终态后再落残余元素**）；
// `digest cap` → `.digest-cap` 行（auto dim / stop warn——CLI agent-turn.mjs:188/:192 对位）。旧轮元素
// 留置原位（不改 ∥ 不删 ∥ 不退场——零清理机器）；复列 = 全量（未结轮照现——重放逐轮 ⇒ 逐轮追加；消化重放口径批 · 2026-10-01 收正）。
// **#726 构形件化（2026-10-01 · 跨端消化面恢复批）**：四类元素构形提为导出构形件（下方四函数；消化账务批 ·
// 2026-10-05 ＋残余元素一件 ⇒ 五函数）—— live（`showDigestStatus`）∥ 重建（`record-restore.js`）**单一实现零副本**；`data-idx` 归重建径独占。
let _digestRoundEl = null // 本轮计数元素引用（`end` 取 `dataset.n` 用——本批保留）

/** 起跑标签元素构形（`.digest-turn`）：M4（显示面消差批 §2.1）+ F-UC8（2026-09-21 信号提示行批 ·
 *  §6.27.12.13 ①–②）起跑标签 **两档**（`tier === "ask"` 携参 `{ from, msg }` / 其余含缺省档 ⇒ 既有键
 *  ——后向兼容）；字面单源 = 核 i18n 容器（本地档不重复定义）。AUTO 档同判（`auto` 泛句退场——无生产者）。 */
export function digestTurnEl(m) {
  const label = document.createElement("div")
  label.className = "digest-turn"
  label.textContent = t(m.tier === "ask" ? "digest.turnLabelAsk" : "digest.turnLabel",
    m.tier === "ask" ? { from: m.from ?? "?", msg: m.msg ?? "…" } : {})
  return label
}

/** 起跑计数元素构形（`.digest-status`；`dataset.n` = 起跑数口径——终态元素取数源）：规则 = `n > 0`
 *  （D-SL2——两档同规；`n = 0` 的 ask-only 轮零元素：幻影行禁出）由调用面判。 */
export function digestCountEl(n) {
  const el = document.createElement("div")
  el.className = "digest-status"
  el.dataset.n = String(n)
  el.textContent = t("digest.start", { n: el.dataset.n })
  return el
}

/** cap 行构形（`.digest-cap`）：`mode` 两档（`stop` ⇒ stop 档类 + 文案 capStop；`auto` ⇒ 平档 capAuto
 *  ——本端现无 auto 产者（`panel-callbacks.mjs` `postDigestCap` 定义 · 单调用点），读取面按契约前向兼容）。 */
export function digestCapEl(mode, turns) {
  const cap = document.createElement("div")
  cap.className = mode === "stop" ? "digest-cap digest-cap-stop" : "digest-cap"
  cap.textContent = mode === "stop" ? t("digest.capStop", { turns: turns ?? "?" }) : t("digest.capAuto")
  return cap
}

/** 终态元素构形（追加形——零就地换文）：`ok` 两档（done ∥ failed/aborted）；`n` = 本轮起跑数
 *  （live = 计数元素 `dataset.n`；重建 = 起跑记录 `n`）；`seconds` 与记录 `ms` 同值单算式。 */
export function digestTerminalEl(ok, n, ms) {
  const seconds = ((ms ?? 0) / 1000).toFixed(1)
  const el = document.createElement("div")
  el.className = ok !== false ? "digest-status digest-done" : "digest-status digest-failed"
  el.textContent = ok !== false
    ? t("digest.done", { n: n ?? "?", seconds })
    : t("digest.aborted", { seconds })
  return el
}

/** 残余元素构形（消化账务批 · 2026-10-05 · 台账 #930 · §6.31.6——追加形：终态元素之后落一枚；
 *  `n` = 本轮未销账条数；词键 `digest.residue`——核字典直取、端侧零自持字面）。live ∥ 重建同均件。 */
export function digestResidueEl(n) {
  const el = document.createElement("div")
  el.className = "digest-status"
  el.textContent = t("digest.residue", { n: n ?? "?" })
  return el
}

function showDigestStatus(m) {
  const messagesEl = ctx.messagesEl
  if (m.status === "start") {
    const label = digestTurnEl(m)
    messagesEl.appendChild(label)
    _digestRoundEl = null
    // 计数元素规则 = `n > 0`（D-SL2——两档同规；`n = 0` 的 ask-only 轮零元素：幻影行禁出）
    if ((m.n ?? 0) > 0) {
      const el = digestCountEl(m.n)
      messagesEl.appendChild(el)
      _digestRoundEl = el
    }
    // 零计数元素轮（`n = 0`——起跑即发）：只打标签行；本轮 `_digestRoundEl` 置空 ⇒ end 零动作
    // （禁兜底建元素——不得造 `dataset.n = "?"` 幻影行）。
    // C-4 边界取面：本轮边界 = **计数元素**（族末 ＝状态元素）∥ 无计数元素 ⇒ 标签元素
    // （归档落点——对位桌面「边界行取面 = 本族文档序末元素」同规）。
    S._digestBoundary = _digestRoundEl ?? label
    ctx.assistantLabeled = false // C-9③：本轮 assistant 输出带一次回合标签
    maybeScrollDown(ctx)
    return
  }
  if (m.status === "cap") {
    messagesEl.appendChild(digestCapEl(m.mode, m.turns))
    maybeScrollDown(ctx)
    return
  }
  // end：**追加终态元素**（自然形——不动原计数元素 ∥ 零就地换文）；`n` 自本轮计数元素
  // `dataset.n` 取（起跑数口径）；本轮无计数元素（`n = 0` 轮——`_digestRoundEl` 置空）⇒ **零动作**
  // （M4：禁兜底建元素——旧兜底行会造 `dataset.n = "?"` 幻影计数行）。
  // 消化账务批（§6.31.6）：`unsettled > 0` ⇒ 终态元素之后再落残余元素（`= 0` ⇒ 零元素——零噪音）。
  const el = _digestRoundEl?.isConnected ? _digestRoundEl : null
  if (!el) return
  messagesEl.appendChild(digestTerminalEl(m.ok !== false, el.dataset.n, m.ms))
  if ((m.unsettled ?? 0) > 0) messagesEl.appendChild(digestResidueEl(m.unsettled))
  maybeScrollDown(ctx)
}

export { clearStatusText, handleStatusText, showCompressStatus, showDigestStatus }
