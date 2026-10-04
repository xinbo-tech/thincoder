/**
 * chat-chrome.mjs — 对话流**帧尾态刷面**（拆分产出 —— 「对齐第三批」触碰批执行在册预案：`renderer/views/chat.mjs`
 * 越 300 在册、本批触碰 ⇒ 出档；登记面 = `docs/desktop/design/PROJECT.md` §4.2 本批行）：
 *   ① 根锚四（`chromeProps`）+ 帧尾态刷 `syncChrome`（摘要块 / **压缩行** / 消化行族 / **到期触发行组** / 停止痕 /
 *      **帮助行族** / 审批卡 / 药丸 / **真置焦执行** —— 幂等 · 与档位解耦 · `none` 帧同刷）；② 尾组的构树（`summaryNode` /
 *      `timerGroupNode` / `stoppedNode` / `helpGroupNode` / `pillNode`）与插点锚（`blockAnchor` 等 —— 单源：
 *      族内序 = 压缩行〔R4 增 —— 构树 ∕ 态刷 ∕ 锚出档 `renderer/views/compress-status.mjs`〕→ 消化行族〔单档 `renderer/views/chat-digest-rows.mjs`（构树 ∥ 帧刷引调）—— 流内落位批改**逐轮行族 · 流内就地**〔无轮容器——#747〕；**自然形收正批 · 2026-10-01 · 台账 #768**：到达序出生 ∥ 行出生即定型（零就地换文 ∥ 零摘除——行出即留）〕；
 *      构树消费面 = 构树出档 `renderer/views/chat-tree.mjs`（留档批拆分 —— 按记录位次复列）〕→ 到期触发行组 → 停止痕 → 帮助行族〔`/help` 增量 · 2026-10-01② —— 行族三件（构树 ∕ 态刷 ∥ 锚）住本档〕 —— **压缩行例外 = 流元素冻结点**〔创建点定位 —— `blockAnchor` 链不收本行，新块随流居其下〕）；
 *   ③ 帧尾真置焦执行 `focusAutofocus`（F-置焦 · 「对齐第三批」重核入册）。
 * 依赖单向：`renderer/views/chat.mjs` → 本档（构树与帧尾两径引调）；反向无引用 ⇒ 无环。
 * 文案一律经 `t()`（零硬编码；`+` / `−` / 游标字形住 `renderer/chat.css`）；零 `node:` / 零裸包。
 */
import { build, text } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { syncCards } from "./chat-cards.mjs"
import { syncGuide } from "./chat-guide.mjs"
import { wire } from "./chat-tool.mjs"
// 流内压缩状态行（R4 —— 构树 / 帧尾态刷 / 插点锚三件出档；本档引态刷与锚两件）。
import { compressAnchorOf, syncCompress } from "./compress-status.mjs"
// 流内消化行族（单档 `renderer/views/chat-digest-rows.mjs` —— 帧刷一件；构树归 `renderer/views/chat-tree.mjs`）。
import { syncDigest } from "./chat-digest-rows.mjs"

/** 根锚四（单源 —— `chatTree` 与 `syncChrome` 同用）：`data-blocks` = 已渲染块数（= DOM 块节点数）。 */
export function chromeProps(model) {
  return {
    "data-state": model.state,
    "data-blocks": model.blocks.length,
    "data-hidden": model.hidden,
    "data-following": model.following ? "1" : "0",
  }
}

/** 显示裁（CLI 同规 —— 提醒镜像口径 `REMINDER_CAP` = 3）：> 3 行 ⇒ 前 3 行 + `…`（逐行落子节点 —— 免依赖样式面）。 */
const TIMER_CAP = 3
function timerLines(text) {
  const lines = String(text).split("\n")
  return lines.length > TIMER_CAP ? [...lines.slice(0, TIMER_CAP), "…"] : lines
}

/** 到期触发行组（timer-wake 阶段 2 —— **非块节点组**：零 `data-block-id` ⇒ 不占块序 / 不动 `data-blocks` 不变式；
 *  **与 `[data-digest]` 行同族**）：逐行 `div[data-timer-line]`（行文 = 交付原文）；单源 = `docs/desktop/design/RENDERER.md` §1.1。 */
export function timerGroupNode(slice) {
  const row = (line) => ({ tag: "div", props: { "data-timer-line": "" }, children: [line] })
  return { tag: "div", props: { class: "chat-timer", "data-timer": "" }, children: timerLines(slice.text).map(row) }
}

/** 帧尾组同步（幂等）：在场 ⟺ 本键切片在场（`ev:timer` 归约面写——同键就地替换）；内容逐行等价 ⇒ 零写；
 *  切片换代 ⇒ 原位换（零序跳）；缺席 ⇒ 摘除。`anchor` = 尾插点（停止痕之前 —— 恒居消化行族之右）。 */
function syncTimer(root, model, anchor = null) {
  if (!root || typeof root.querySelector !== "function") return
  const slice = model?.timer ?? null
  const node = root.querySelector("[data-timer]")
  if (slice === null) { if (node) node.remove(); return }
  const want = timerLines(slice.text)
  const rows = node && typeof node.querySelectorAll === "function" ? [...node.querySelectorAll("[data-timer-line]")] : []
  if (node && rows.length === want.length && rows.every((row, index) => row.textContent === want[index])) return
  const fresh = build(timerGroupNode(slice))
  if (node) { node.replaceWith(fresh); return }
  if (typeof root.insertBefore === "function") root.insertBefore(fresh, anchor)
  else root.append(fresh)
}

/** 停止痕节点（「对齐第三批」项 6 —— 流尾**非块节点**：零 `data-block-id` ⇒ 不占块序 / 不动 `data-blocks` 不变式）：
 *  词 = 核键 `status.stopped` 直取（两语逐字 —— 本端零新键）；样式 = 提示色 + 斜体（`renderer/chat-fixes.css` 小修族尾段）。 */
export function stoppedNode() {
  return { tag: "div", props: { class: "chat-stopped", "data-stopped": "" }, children: [t("status.stopped")] }
}

/** 帮助行族（`/help` 增量 · 2026-10-01② —— **非块节点组**：零 `data-block-id` ⇒ 不占块序 ∕ 不动 `data-blocks` 不变式；
 *  **与 `[data-timer]` 行同族**）：逐行 `div[data-help-line]` + `data-help-kind`（类名面 = `help-标签 ∕ 组行 ∕ 命令行`）；
 *  行文 = 核 `formatHelp` 行集逐字（端侧零构造 —— 禁假造）；单源 = `docs/desktop/design/RENDERER.md` §1.1 帮助行族条。 */
export function helpGroupNode(rows) {
  const row = (line) => ({ tag: "div", props: { class: `help-${line.kind}`, "data-help-line": "", "data-help-kind": line.kind }, children: [line.text] })
  return { tag: "div", props: { class: "chat-help", "data-help": "" }, children: rows.map(row) }
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

/** 尾节点态刷（幂等 · 插点锚定）：在场 ⟺ 判据；缺席 ∧ 判据真 ⇒ 插于 `anchor`（`null` ⇒ 末位）；在场 ∧ 判据假 ⇒ 摘。
 *  单用 = 停止痕（项 6 —— 常文节点 ⇒ 换代零题）。 */
function syncTailNode(root, selector, want, make, anchor) {
  const node = typeof root.querySelector === "function" ? root.querySelector(selector) : null
  if (!want) { if (node) node.remove(); return }
  if (node) return
  const fresh = build(make())
  if (typeof root.insertBefore === "function") root.insertBefore(fresh, anchor)
  else root.append(fresh)
}

/** 帮助行族态刷（幂等 · 同 `syncTimer` 形）：在场 ⟺ 本键切片在场（`printHelp` 口写）；**内容逐行等价 ⇒ 零写**；
 *  换代 ⇒ 原位换（零序跳）；缺席 ⇒ 摘除。`anchor` = 尾插点（卡序列之前 —— 恒居停止痕之右）。 */
function syncHelp(root, model, anchor = null) {
  if (!root || typeof root.querySelector !== "function") return
  const rows = Array.isArray(model?.help) && model.help.length > 0 ? model.help : null
  const node = root.querySelector("[data-help]")
  if (rows === null) { if (node) node.remove(); return }
  const want = rows.map((line) => `${line.kind} ${line.text}`)
  const live = node === null ? [] : [...node.querySelectorAll("[data-help-line]")].map((row) => `${row.getAttribute("data-help-kind")} ${row.textContent}`)
  if (node && live.length === want.length && live.every((rowText, index) => rowText === want[index])) return
  const fresh = build(helpGroupNode(rows))
  if (node) { node.replaceWith(fresh); return } // 换代 ⇒ 原位换（零搬移）
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

/** 帧尾态刷（刷新面单点 · 幂等 · 与档位解耦 —— `none` 帧同刷）：根锚四 + 引导节点 / 摘要块 / **压缩行** / **消化行族** / **到期触发行组** / **停止痕** /
 *  **帮助行族** / 审批卡 / 药丸随判据（尾组 = 流内非块节点 —— 在场 ⟺ 各自本键切片；
 *  落点 = 块后卡前，族内序 = 压缩行 → 消化行族 → 到期触发行组 → 停止痕 → 帮助行族）；**帧尾真置焦执行** = `focusAutofocus`。
 *  **压缩行例外 = 流元素冻结点、不在块插入点上** —— 插入点纪律单源 = `docs/desktop/design/RENDERER.md` §1.1（`blockAnchor` 链不收本行）。
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
  syncCompress(root, live ? model.compress : null, compressAnchorOf(root))
  // 消化行族帧刷（**唯追加** —— 出生已在入流步（`settleFrame` 步①）落定，此拍采纳 ∥ 零写；非 live 面 ⇒ 零动作）。
  syncDigest(root, live ? model : { digest: null }, blockAnchor(root))
  syncTimer(root, live ? model : { timer: null }, timerAnchorOf(root))
  syncTailNode(root, "[data-stopped]", live && model.stopped === true, () => stoppedNode(), stoppedAnchorOf(root))
  syncHelp(root, live ? model : { help: null }, helpAnchorOf(root))
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

/** 块节点插点锚（单源 —— 尾段挂载与头侧前插同用）：首个**到期触发行组**之前、无组 ⇒ 首个**停止痕**之前、
 *  无痕 ⇒ 首个**帮助行族**之前、无族 ⇒ 首个**卡节点**之前（尾组任一 —— 卡序判据面 = 卡序单源）、
 *  无卡 ⇒ 药丸之前；两锚皆缺 ⇒ `null`（末位）。**消化行族元素不在链上**（逐轮行族：常规新块随流落轮行**之下**——
 *  入流步先于尾段挂载 ⇒ 同帧行族出生 ∥ 换代在前）；归档块（`kind: "subagent"`）= **普通块**（随到达入流——同此锚）；
 *  单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）。
 *  **压缩行不在链上**（R4 定位语义收正 —— 行 = 流元素冻结点：创建点定位后新块随流居其下；VSC D-C3 append-once 对齐 —— 单源 = `renderer/views/compress-status.mjs` 档头）。**待发送块不入流**（收正轮 B12 新口径：住输入区带 —— 本档零参）。 */
export function blockAnchor(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-timer]") ?? root.querySelector("[data-stopped]")
    ?? root.querySelector("[data-help]") ?? root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}

/** 到期触发行组插点锚（组恒居**块后、停止痕 / 帮助行族前** —— 族内序 = 消化行族 → 本组 → 停止痕）：
 *  首个停止痕 ∨ 帮助行族 ∨ 卡节点 ∨ 药丸 ∨ `null`（末位 —— 消化行族在场时本组仍落其右：同锚前插）。 */
function timerAnchorOf(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-stopped]") ?? root.querySelector("[data-help]")
    ?? root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}

/** 停止痕插点锚（痕恒居帮助行族 / 卡节点前）：首个帮助行族 ∨ 卡节点 ∨ 药丸 ∨ `null`（末位）。 */
function stoppedAnchorOf(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-help]")
    ?? root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}

/** 帮助行族插点锚（族恒居卡序列之前）：首个卡节点 ∨ 药丸 ∨ `null`（末位）。 */
function helpAnchorOf(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}
