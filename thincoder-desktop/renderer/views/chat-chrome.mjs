/**
 * chat-chrome.mjs — 对话流**帧尾态刷面**（拆分产出 —— 「对齐第三批」触碰批执行在册预案：`renderer/views/chat.mjs`
 * 越 300 在册、本批触碰 ⇒ 出档；登记面 = `docs/desktop/design/PROJECT.md` §4.2 本批行）：
 *   ① 根锚四（`chromeProps`）+ 帧尾态刷 `syncChrome`（摘要块 / 消化行组 / 停止痕 / 台账行组 / 待发送气泡组 /
 *      审批卡 / 药丸 / **真置焦执行** —— 幂等 · 与档位解耦 · `none` 帧同刷）；
 *   ② 四尾组的构树（`summaryNode` / `digestGroupNode` / `stoppedNode` / `ledgerGroupNode` / `pillNode`）与
 *      插点锚五（`blockAnchor` 等 —— 单源：族内序 = 消化行组 → 停止痕 → 台账行 → 待发送气泡组）；
 *   ③ 帧尾真置焦执行 `focusAutofocus`（F-置焦 · 「对齐第三批」重核入册）。
 * 依赖单向：`renderer/views/chat.mjs` → 本档（构树与帧尾两径引调）；反向无引用 ⇒ 无环。
 * 文案一律经 `t()`（零硬编码；`+` / `−` / 游标字形住 `renderer/chat.css`）；零 `node:` / 零裸包。
 */
import { build, text } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { syncCards } from "./chat-cards.mjs"
import { syncGuide } from "./chat-guide.mjs"
import { syncPending } from "./chat-pending.mjs"
import { wire } from "./chat-tool.mjs"

/** 根锚四（单源 —— `chatTree` 与 `syncChrome` 同用）：`data-blocks` = 已渲染块数（= DOM 块节点数）。 */
export function chromeProps(model) {
  return {
    "data-state": model.state,
    "data-blocks": model.blocks.length,
    "data-hidden": model.hidden,
    "data-following": model.following ? "1" : "0",
  }
}

/** 计数读数归一（`n` / `ms` 非数 ⇒ 0 —— 沿归约面 `countOf` 同判；零抛）。 */
function countOf(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

/** 起跑标签行文（两档 —— 单源 = 核字典 `digest.*`：`tier === "ask"` ⇒ `digest.turnLabelAsk` 携 `from` / `msg`〔核 `upstreamAskLabelVars`〕；
 *  余 ⇒ `digest.turnLabel`；缺参回落 `?` / `…` —— 沿 VSC `chat-status.js:74-78` 同式）。 */
function digestLabel(slice) {
  return slice.tier === "ask"
    ? t("digest.turnLabelAsk", { from: slice.from ?? "?", msg: slice.msg ?? "…" })
    : t("digest.turnLabel")
}

/** 计数行文（起跑态 —— 核字典 `digest.start`；`n` = 起跑 pending 数）。 */
function digestCount(slice) {
  return t("digest.start", { n: countOf(slice.n) })
}

/** 消化状态行组（**非块节点组** —— 沿 `[data-pending]` 先例：零 `data-block-id` ⇒ 不占块序 / 不动 `data-blocks` 不变式）：
 *  两行 = 起跑标签行 + `n > 0` 计数行（`n = 0` 轮零计数行 —— 沿 VSC `.digest-status` 规则，幻影行禁出）；
 *  词面 = 核字典 `digest.*` 经 `t()` 投影直取（**零新键** · 值同源零复制）；单源 = `thincoder-vscode/webview/chat-status.js:69-122`。 */
export function digestGroupNode(slice) {
  const rows = [{ tag: "div", props: { class: "digest-turn", "data-digest-label": "" }, children: [digestLabel(slice)] }]
  if (countOf(slice.n) > 0) rows.push({ tag: "div", props: { class: "digest-status", "data-digest-count": "" }, children: [digestCount(slice)] })
  return { tag: "div", props: { class: "chat-digest", "data-digest": "" }, children: rows }
}

/** 停止痕节点（「对齐第三批」项 6 —— 流尾**非块节点**：零 `data-block-id` ⇒ 不占块序 / 不动 `data-blocks` 不变式）：
 *  词 = 核键 `status.stopped` 直取（两语逐字 —— 本端零新键）；样式 = 提示色 + 斜体（`renderer/chat.css`）。 */
export function stoppedNode() {
  return { tag: "div", props: { class: "chat-stopped", "data-stopped": "" }, children: [t("status.stopped")] }
}

/** 台账行组（「对齐第三批」项 12 —— 流尾非块节点组）：逐行 `div[data-ledger-line]`，类名面 = 核行产口径
 *  （`ledger-line` / `warn` 加类）；行文 = **核行产逐字**（端侧零构造 —— 禁假造）。 */
export function ledgerGroupNode(lines) {
  return {
    tag: "div",
    props: { class: "chat-ledger", "data-ledger": "" },
    children: lines.map((line) => ({
      tag: "div",
      props: { class: line.warn === true ? "ledger-line warn" : "ledger-line", "data-ledger-line": "" },
      children: [line.text],
    })),
  }
}

/** 摘要块（根首子 · 在场 ⟺ `hidden > 0`）：文本（`[data-summary-text]` 供态刷就地刷）+ 回填控件（接线两态）。 */
export function summaryNode(model, handlers) {
  return {
    tag: "div",
    props: { class: "chat-summary", "data-summary": "" },
    children: [
      { tag: "span", props: { class: "chat-summary-text", "data-summary-text": "" }, children: [t("chat.summary.older", { n: model.hidden })] },
      { tag: "button", props: wire({ class: "chat-backfill", "data-action": "chat:backfill" }, handlers.onBackfill), children: [] },
    ],
  }
}

/** 药丸（根末子 · 在场 ⟺ `!following`）：文本两态 = 未读数 > 0 ⇒ `chat.pill.new`，否则 `chat.pill.bottom`。 */
export function pillNode(model, handlers) {
  const label = model.pendingNew > 0 ? t("chat.pill.new", { n: model.pendingNew }) : t("chat.pill.bottom")
  return {
    tag: "button",
    props: wire({ class: "chat-pill", "data-pill": "", "data-action": "chat:return" }, handlers.onReturn),
    children: [label],
  }
}

/** 组内容等价判据（帧刷幂等）：标签行逐字等 ∧ 计数行在场 / 文面逐字等 ⇒ 零 DOM 写。 */
function equivalentDigest(node, slice) {
  const label = node.querySelector("[data-digest-label]")
  if (label === null || label.textContent !== digestLabel(slice)) return false
  const row = node.querySelector("[data-digest-count]")
  if (countOf(slice.n) > 0) return row !== null && row.textContent === digestCount(slice)
  return row === null
}

/** 终态行就地更新（`end` ⇒ **先更新**）：计数行改终态句（`ok !== false` ⇒ `digest.done` 携 `n` / `seconds`；
 *  否则 `digest.aborted` 携 `seconds`）+ 终态 class 落笔；`n = 0` 轮零计数行 ⇒ **零动作**（不造幻影行 —— 沿 VSC 同判）。 */
function updateDigestRows(node, slice) {
  const row = node.querySelector("[data-digest-count]")
  if (row === null || row === undefined) return
  const seconds = (countOf(slice.ms) / 1000).toFixed(1)
  if (slice.ok === false) {
    text(row, t("digest.aborted", { seconds }))
    row.setAttribute("class", "digest-status digest-failed")
    return
  }
  text(row, t("digest.done", { n: countOf(slice.n), seconds }))
  row.setAttribute("class", "digest-status digest-done")
}

/** 帧尾组同步（幂等）：在场 ⟺ 本键切片 = 起跑态（`start`）；`end` ⇒ **先原地更新本键游标行**（先更新后摘）后摘除
 *  （单源 = `docs/desktop/design/RENDERER.md` §1.1 事件归约面条 / 帧尾态刷条）；`anchor` = 尾插点（组恒居块序列之后、
 *  停止痕 / 台账行 / 待发送组之前）；内容等价 ⇒ 零写；组换代 ⇒ 原位换（零序跳）。 */
function syncDigest(root, model, anchor = null) {
  if (!root || typeof root.querySelector !== "function") return
  const slice = model?.digest ?? null
  const node = root.querySelector("[data-digest]")
  if (slice === null || slice.status !== "start") {
    if (node === null || node === undefined) return
    if (slice?.status === "end") updateDigestRows(node, slice)
    node.remove()
    return
  }
  if (node !== null && node !== undefined && equivalentDigest(node, slice)) return
  const fresh = build(digestGroupNode(slice))
  if (node !== null && node !== undefined) {
    node.replaceWith(fresh)
    return
  }
  if (typeof root.insertBefore === "function") root.insertBefore(fresh, anchor)
  else root.append(fresh)
}

/** 尾节点态刷（幂等 · 插点锚定）：在场 ⟺ 判据；缺席 ∧ 判据真 ⇒ 插于 `anchor`（`null` ⇒ 末位）；在场 ∧ 判据假 ⇒ 摘。
 *  两用 = 停止痕（项 6 —— 常文节点 ⇒ 换代零题）/ 台账行组（项 12 —— 内容换代判据归 `syncLedger`）。 */
function syncTailNode(root, selector, want, make, anchor) {
  const node = typeof root.querySelector === "function" ? root.querySelector(selector) : null
  if (!want) { if (node) node.remove(); return }
  if (node) return
  const fresh = build(make())
  if (typeof root.insertBefore === "function") root.insertBefore(fresh, anchor)
  else root.append(fresh)
}

/** 台账行组态刷（幂等）：在场 ⟺ 本键行集非空；**行集换代（引用变）⇒ 原位换**（内容面逐字更新；同引用 ⇒ 零写）；
 *  锚 = 待发送组前（族内序：消化行组 → 停止痕 → 台账行 → 待发送组）。 */
function syncLedger(root, model, anchor) {
  if (!root || typeof root.querySelector !== "function") return
  const lines = Array.isArray(model?.ledger) && model.ledger.length > 0 ? model.ledger : null
  const node = root.querySelector("[data-ledger]")
  if (lines === null) { if (node) node.remove(); return }
  if (node && node._ledgerLines === lines) return
  const fresh = build(ledgerGroupNode(lines))
  if (node) { node.replaceWith(fresh); return }
  if (typeof root.insertBefore === "function") root.insertBefore(fresh, anchor)
  else root.append(fresh)
}

/** 控件三态刷（幂等）：在场 ∧ 判据真 ⇒ 就地刷文本；在场 ∧ 判据假 ⇒ 摘；缺席 ∧ 判据真 ⇒ 建（`atStart` 真 ⇒ 首插 · 假 ⇒ 末插）。 */
function chromeSlot(root, selector, want, make, update, atStart = false) {
  const node = typeof root.querySelector === "function" ? root.querySelector(selector) : null
  if (node && !want) return void node.remove()
  if (node) return void update(node)
  if (!want) return
  const built = build(make())
  if (atStart && typeof root.prepend === "function") root.prepend(built)
  else root.append(built)
}

/** 帧尾态刷（刷新面单点 · 幂等 · 与档位解耦 —— `none` 帧同刷）：根锚四 + 引导节点 / 摘要块 / **消化行组** / **停止痕** /
 *  **台账行组** / **待发送气泡组** / 审批卡 / 药丸随判据（尾四组 = 流内非块节点 —— 在场 ⟺ 各自本键切片；
 *  落点 = 块后卡前，族内序 = 消化行组 → 停止痕 → 台账行 → 待发送组）；**帧尾真置焦执行** = `focusAutofocus`。
 *  `none` 态零块节点化不破：诸控件判据皆含 `state !== "none"`（卡面由 `chatModel` 归零）⇒ 零插入（只摘——
 *  引导节点同此面纪律：缺席 ⇒ 零动作 · 判据空 ⇒ 摘，「只摘不插」）；卡面态刷住 `renderer/views/chat-cards.mjs`。 */
export function syncChrome(root, model, handlers = {}) {
  if (!root || typeof root.querySelector !== "function") return model
  for (const [name, value] of Object.entries(chromeProps(model))) root.setAttribute(name, String(value))
  syncGuide(root, model, handlers)
  const live = model.state !== "none"
  chromeSlot(
    root, "[data-summary]", live && model.hidden > 0,
    () => summaryNode(model, handlers),
    (node) => {
      const label = node.querySelector("[data-summary-text]")
      if (label) text(label, t("chat.summary.older", { n: model.hidden }))
    },
    true,
  )
  syncDigest(root, live ? model : { digest: null }, digestAnchorOf(root))
  syncTailNode(root, "[data-stopped]", live && model.stopped === true, () => stoppedNode(), stoppedAnchorOf(root))
  syncLedger(root, live ? model : { ledger: null }, ledgerAnchorOf(root))
  syncPending(root, live ? model : { pending: [] }, cardAnchorOf(root))
  syncCards(root, model, handlers)
  chromeSlot(
    root, "[data-pill]", live && !model.following,
    () => pillNode(model, handlers),
    (node) => text(node, model.pendingNew > 0 ? t("chat.pill.new", { n: model.pendingNew }) : t("chat.pill.bottom")),
  )
  focusAutofocus(root)
  return model
}

/** 帧尾真置焦（F-置焦 · 「对齐第三批」重核入册）：对卡内 `[data-autofocus="1"]`（恰一枚 —— 卡面判据）执行
 *  `focus()`；逐节点 `_autofocused` 记账（**幂等 —— 卡出现即焦，非每帧抢焦**：中频帧不得夺已移焦）；
 *  假 DOM 无焦点面 ⇒ 执行读数归真机（`document.activeElement` = 卡内焦点锚）。 */
export function focusAutofocus(root) {
  const node = typeof root?.querySelector === "function" ? root.querySelector('[data-autofocus="1"]') : null
  if (node === null || node === undefined || node._autofocused === true) return
  node._autofocused = true
  if (typeof node.focus === "function") node.focus()
}

/** 块节点插点锚（单源 —— 尾段挂载与头侧前插同用）：首个**消化行组**之前（组在 ⇒ 块恒居其前）、无组 ⇒ 首个**停止痕**之前、
 *  无痕 ⇒ 首个**台账行组**之前、无组 ⇒ 首个**待发送组**之前（组在 ⇒ 块恒居其前 = 受理交接位置零跳）、
 *  无组 ⇒ 首个**卡节点**之前（三族任一 —— 卡序判据面 = 卡序单源）、无卡 ⇒ 药丸之前；两锚皆缺 ⇒ `null`（末位）。 */
export function blockAnchor(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-digest]") ?? root.querySelector("[data-stopped]") ?? root.querySelector("[data-ledger]")
    ?? root.querySelector("[data-pending]") ?? root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}

/** 尾组插点锚（**待发送组专用** —— 组恒居块后卡前）：首个卡节点 ∨ 药丸 ∨ `null`（末位）。 */
function cardAnchorOf(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}

/** 消化行组插点锚（组恒居**块后、停止痕 / 台账行 / 待发送组前** —— 族内序 = 消化行组 → 停止痕 → 台账行 → 待发送组）：
 *  首个停止痕 ∨ 台账行组 ∨ 待发送组 ∨ 卡节点 ∨ 药丸 ∨ `null`（末位）。 */
function digestAnchorOf(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-stopped]") ?? root.querySelector("[data-ledger]")
    ?? root.querySelector("[data-pending]") ?? root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}

/** 停止痕插点锚（痕恒居台账行组 / 待发送组前）：首个台账行组 ∨ 待发送组 ∨ 卡节点 ∨ 药丸 ∨ `null`（末位）。 */
function stoppedAnchorOf(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-ledger]") ?? root.querySelector("[data-pending]")
    ?? root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}

/** 台账行组插点锚（组恒居待发送组 / 卡前）：首个待发送组 ∨ 卡节点 ∨ 药丸 ∨ `null`（末位）。 */
function ledgerAnchorOf(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-pending]") ?? root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}
