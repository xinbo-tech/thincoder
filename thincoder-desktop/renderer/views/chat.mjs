/**
 * chat.mjs — 对话流视图面（`docs/desktop/design/RENDERER.md` §1.1 / §2 / §3 · `docs/desktop/design/UI.md` §1 对话流行）。
 * 三档沿 RENDERER.md §1.1：`chatModel`（纯模型 · 窗出口）→ `chatTree`（纯构树 · 机检面）→ `mountChat`（薄挂载 =
 * 本档唯一清空 / 建树处）；DOM 面另两件 = 帧尾态刷 `syncChrome`（根锚四 + 摘要块 + 审批卡 + 药丸 · 幂等 · 无帧豁免）· 帧尾六步
 * `settleFrame`（挂尾段 → 读数 → 态刷 → 头侧摘 / 插 → 读数 → 写）；工具卡面与折叠纯函数 `toggleExpanded` 住
 * `renderer/views/chat-tool.mjs`（§2.3 拆分预案落形 —— 依赖单向：本档 → 它）；文本族块尾的复制控件 + 末条复制控件
 * 住 `renderer/views/chat-copy.mjs`（UI.md §1「批 B 注」项 4 —— 依赖单向：本档 → 它）。
 *   ① 三态 `data-state`：无活动会话 ⇒ `none`（零节点——禁假数据）· 有会话零块 ⇒ `empty`（`chat.empty.hint`）· 否则 `flow`；
 *   ② 块五型（`user` / `assistant` / `reasoning` / `tool` / `error`）单序列；块键单源 = `blockKey`（`data-block-id` /
 *      增量缝合 / toggle 同域）；兜底键用**全列表位序**（`hidden + i`）⇒ 窗滑动不改键；文本裸串（零 Markdown / 零注入）；
 *   ③ 根子序 = [摘要块?] → 块序列 → [卡序列?] → [药丸?]（卡序 = 待审批 → 提问 → 计划 —— 单源 =
 *      `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）；块插入点 = 首个**卡节点**之前（三族任一 ——
 *      锚 = `[data-card]`；无卡 ⇒ `[data-pill]` 之前 · 两锚皆缺 ⇒ 末位）；本档挂载面只管审批族（提问 / 计划
 *      两族归 `renderer/mount-cards.mjs` —— 挂载零交叠，卡序判据共用一序单源）；
 *   ④ 工具卡面（三行）已拆出：`renderer/views/chat-tool.mjs`（批档 §2.3 拆分预案落形）——本档经 `toolCard` 调用；
 *      审批卡面（两形）住 `renderer/views/approval.mjs`（批档 §2.2（a））——本档经 `approvalTree` 调用（依赖单向：
 *      本档 → 它）；卡 = **非块节点** ⇒ 与块序列 / 药丸同层不破「DOM 块节点序 ≡ visible 逐位引用等」；
 *      接线两态沿 `renderer/views/sessions.mjs:161` 通则（handlers 给 ⇒ `onClick`；缺 ⇒ `disabled` —— 诚实非死控）；
 *   ⑤ 模型形 = `{ state, state.blocks, hidden, following, pendingNew, hasOlder, inFlight, locale, approval }`
 *      （`blocks` = 窗出口；`approval` = 本会话待决项 ⇒ 卡面）。
 * 文案一律经 `t()`（零硬编码；`+` / `−` / 游标字形住 `renderer/chat.css`）；零 `node:` / 零裸包。
 */
import { build, clear, text } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { visibleWindow } from "../store.mjs"
import { approvalTree } from "./approval.mjs"
import { MAX_RENDER_BLOCKS, compensateTop, stickToBottom, tailAction } from "./chat-scroll.mjs"
import { copyBlockNode, patchTextBlock } from "./chat-copy.mjs"
import { blockKey } from "./chat-stream.mjs"
import { toolCard, wire, withKey } from "./chat-tool.mjs"

// ─── 三档之①：纯模型 ───────────────────────────────────────────────

/** 帧模型：三态 + 窗出口（`visible` / `hidden` 单源 = `renderer/store.mjs:53`）+ 四标量读数 + 待决项（卡面）。
 *  `none` ⇒ `blocks` 空 ∧ `hidden` 0 ∧ `approval` 空（守 `data-blocks` = DOM 块节点数不变式 —— 不落 stale 块 / 卡）。 */
export function chatModel(state, limit = MAX_RENDER_BLOCKS) {
  const live = state?.activeSession !== null && state?.activeSession !== undefined
  const { visible, hidden } = visibleWindow(Array.isArray(state?.blocks) ? state.blocks : [], limit)
  const mode = !live ? "none" : visible.length === 0 ? "empty" : "flow"
  return {
    state: mode,
    blocks: mode === "none" ? [] : visible,
    hidden: mode === "none" ? 0 : hidden,
    following: state?.following === true,
    pendingNew: typeof state?.pendingNew === "number" ? state.pendingNew : 0,
    hasOlder: state?.history?.hasOlder === true,
    inFlight: state?.history?.inFlight === true,
    locale: state?.locale,
    approval: mode === "none" ? [] : awaitingOf(state),
  }
}

/** 待决项（源 = `state.pool.approvals` —— 本会话切片语义）：缺 / 非数组 ⇒ 空表（**零卡** —— 禁假数据）。 */
function awaitingOf(state) {
  const list = state?.pool?.approvals
  return Array.isArray(list) ? list : []
}

/** 根锚四（单源 —— `chatTree` 与 `syncChrome` 同用）：`data-blocks` = 已渲染块数（= DOM 块节点数）。 */
function chromeProps(model) {
  return {
    "data-state": model.state,
    "data-blocks": model.blocks.length,
    "data-hidden": model.hidden,
    "data-following": model.following ? "1" : "0",
  }
}

// ─── 三档之②：纯构树（块五型 + 工具卡三行 + 三控件）─────────────────

/** 块节点（五型单序列）：文本族 = 裸串子（`white-space: pre-wrap` ⇒ 纯文本零注入）+ 块尾复制控件（块文本空 ⇒
 *  零控件）；`tool` ⇒ 工具卡三行（工具卡无文本面 ⇒ 不入复制面）。 */
function blockNode(block, index, hidden, handlers) {
  const kind = block?.kind
  const key = blockKey(block, hidden + index)
  if (kind === "tool") return toolCard(block, key, handlers)
  return {
    tag: "div",
    props: {
      class: `block block-${kind}`,
      "data-block-id": key,
      "data-block-kind": kind,
      "data-streaming": kind === "assistant" && block?.streaming === true ? "1" : undefined,
    },
    children: [block?.text, copyBlockNode(block, key, handlers)],
  }
}

/** 摘要块（根首子 · 在场 ⟺ `hidden > 0`）：文本（`[data-summary-text]` 供态刷就地刷）+ 回填控件（接线两态）。 */
function summaryNode(model, handlers) {
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
function pillNode(model, handlers) {
  const label = model.pendingNew > 0 ? t("chat.pill.new", { n: model.pendingNew }) : t("chat.pill.bottom")
  return {
    tag: "button",
    props: wire({ class: "chat-pill", "data-pill": "", "data-action": "chat:return" }, handlers.onReturn),
    children: [label],
  }
}

/** 构树（纯 · 零 DOM）：根 = 挂载根（props 四锚；宿主 `class` / `data-slot` 归 `renderer/index.html` 骨架），
 *  子序 = [摘要块?] → [块序列 | 空态提示] → [审批卡?] → [药丸?] —— `none` 皆无 ⇒ 零节点。 */
export function chatTree(model, handlers = {}) {
  const children = []
  if (model.state !== "none") {
    if (model.hidden > 0) children.push(summaryNode(model, handlers))
    if (model.state === "empty") children.push({ tag: "div", props: { class: "chat-empty" }, children: [t("chat.empty.hint")] })
    else children.push(...model.blocks.map((block, index) => blockNode(block, index, model.hidden, handlers)))
    children.push(...model.approval.map((item) => approvalTree(item, handlers)))
    if (!model.following) children.push(pillNode(model, handlers))
  }
  return { tag: "div", props: chromeProps(model), children }
}

// ─── 三档之③：薄挂载 + DOM 面两件 ────────────────────────────────

/** DOM 块节点序 ⇒ 记账形（`{ node, block }`）：DOM ≡ `visible` 不变式下的逐位配对（帧层下帧输入）。 */
function mountedOf(root, blocks) {
  const nodes = typeof root?.querySelectorAll === "function" ? [...root.querySelectorAll("[data-block-kind]")] : []
  return nodes.map((node, index) => ({ node, block: blocks[index] }))
}

/** 薄挂载（本档唯一清空 / 建树处）：根描述符四锚复制到宿主（**保留** `data-slot`）⇒ `clear` ⇒ 子节点入位。
 *  返回 `{ model, mounted }`；容器缺位 ⇒ 模型照给、零节点（非重挂帧的对齐输入 = 空序）。 */
export function mountChat(root, state, handlers = {}, limit = MAX_RENDER_BLOCKS) {
  const model = chatModel(state, limit)
  if (!root || typeof root.setAttribute !== "function") return { model, mounted: [] }
  const tree = build(chatTree(model, handlers))
  for (const name of tree.getAttributeNames()) root.setAttribute(name, tree.getAttribute(name))
  clear(root)
  for (const child of [...tree.childNodes]) root.append(child)
  return { model, mounted: mountedOf(root, model.blocks) }
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

/** 帧尾态刷（刷新面单点 · 幂等 · 与档位解耦 —— `none` 帧同刷）：根锚四 + 摘要块 / 审批卡 / 药丸在场与文本随判据。
 *  `none` 态零节点化不破：三控件判据皆含 `state !== "none"`（卡面由 `chatModel` 归零）⇒ 零插入（只摘）。 */
export function syncChrome(root, model, handlers = {}) {
  if (!root || typeof root.querySelector !== "function") return model
  for (const [name, value] of Object.entries(chromeProps(model))) root.setAttribute(name, String(value))
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
  syncCards(root, model, handlers)
  chromeSlot(
    root, "[data-pill]", live && !model.following,
    () => pillNode(model, handlers),
    (node) => text(node, model.pendingNew > 0 ? t("chat.pill.new", { n: model.pendingNew }) : t("chat.pill.bottom")),
  )
  return model
}

/** 卡面态刷（帧尾 · 幂等）：在场判据 = 待决项非空；逐位按序对齐 —— 同 `prompt-id` ∧ 同 `data-shape` ∧ 同文本 ⇒
 *  **零 DOM 写**（幂等），否则就地换；多出 ⇒ 摘；缺 ⇒ 插到卡锚位（首个更高序卡之前 ⇒ 卡恒居块序列之后、
 *  同序族之后、药丸之前）。 */
function syncCards(root, model, handlers) {
  const live = typeof root.querySelectorAll === "function" ? [...root.querySelectorAll('[data-card="approval"]')] : []
  const wanted = Array.isArray(model?.approval) ? model.approval : []
  const keep = Math.min(live.length, wanted.length)
  for (let index = 0; index < keep; index += 1) {
    const next = build(approvalTree(wanted[index], handlers))
    if (equivalentCard(live[index], next)) continue
    live[index].replaceWith(next)
    live[index] = next
  }
  for (const node of live.slice(keep)) node.remove()
  const anchor = cardAnchor(root)
  for (const item of wanted.slice(keep)) {
    const node = build(approvalTree(item, handlers))
    if (typeof root.insertBefore === "function") root.insertBefore(node, anchor)
    else root.append(node)
  }
}

/** 卡内容等价判据（刷新幂等）：`prompt-id` ∧ `data-shape` ∧ 文本三面全等 ⇒ 零 DOM 写；
 *  出口锚集 = `data-shape` 的单值函数（同形 ⇒ 同三出口）⇒ 不另比。 */
function equivalentCard(node, next) {
  return node.getAttribute?.("data-prompt-id") === next.getAttribute("data-prompt-id") &&
    node.getAttribute?.("data-shape") === next.getAttribute("data-shape") &&
    node.textContent === next.textContent
}

/** 块节点插点锚（单源 —— 尾段挂载与头侧前插同用）：首个**卡节点**之前（三族任一 —— 卡序判据面 = 卡序单源）；
 *  无卡 ⇒ 药丸之前；两锚皆缺 ⇒ `null`（末位）。 */
function blockAnchor(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}

/** 卡面插点锚（新建**审批族**卡 —— 卡序 = 待审批 → 提问 → 计划）：首个更高序卡之前（序首 ⇒ 首个提问卡 /
 *  其次计划卡）；无 ⇒ 药丸之前（`null` ⇒ 末位）—— 卡序逐项，后到者居尾、不夺旧卡位。 */
function cardAnchor(root) {
  if (typeof root?.querySelector !== "function") return null
  const higher = root.querySelector('[data-card="question"]') ?? root.querySelector('[data-card="task"]')
  return higher ?? root.querySelector("[data-pill]")
}

/** 尾段挂载（帧尾第 ① 步 · 先于读数）：逐枚建块 ⇒ 插点 = 首个卡节点之前（无卡 ⇒ 药丸之前 · 两锚皆缺 ⇒ 末位）。 */
function mountTail(root, model, plan, handlers) {
  const start = model.blocks.length - plan.tail.length
  const anchor = blockAnchor(root)
  plan.tail.forEach((block, step) => {
    root.insertBefore(build(blockNode(block, start + step, model.hidden, handlers)), anchor)
  })
}

/** 流式锚同刷（就地更新面）：`assistant` ∧ `streaming` ⇒ 落 `data-streaming`，否则摘（残锚不留）。 */
function setStreaming(node, on) {
  if (on) node.setAttribute("data-streaming", "1")
  else node.removeAttribute?.("data-streaming")
}

/** 就地更新尾块（第 ① 步 · `patch` 档）：文本 + 复制控件（`patchTextBlock`）+ 流式锚同刷；kind 变（含 tool 卡 ⇄
 *  文本族）⇒ 单块重建（节点形变非就地可改）；非尾块零触碰。 */
function patchTail(root, model, handlers) {
  const index = model.blocks.length - 1
  const block = model.blocks[index]
  const nodes = typeof root.querySelectorAll === "function" ? [...root.querySelectorAll("[data-block-kind]")] : []
  const node = nodes[nodes.length - 1]
  if (!node || !block) return
  if (node.getAttribute?.("data-block-kind") !== block.kind || block.kind === "tool") {
    node.replaceWith(build(blockNode(block, index, model.hidden, handlers)))
    return
  }
  patchTextBlock(node, block, blockKey(block, model.hidden + index), handlers)
  setStreaming(node, block.kind === "assistant" && block.streaming === true)
}

/** 头动作（帧尾第 ④ 步）：摘 `evict` 枚头块 + 前插 `prepend` 枚（插点 = 首块之前 ⇒ 摘要块之后）；返回动作数。 */
function headMoves(root, model, plan, handlers) {
  const nodes = typeof root.querySelectorAll === "function" ? [...root.querySelectorAll("[data-block-kind]")] : []
  const evicted = Math.max(0, Math.min(plan.evict, nodes.length))
  for (const node of nodes.slice(0, evicted)) node.remove()
  const anchor = nodes[evicted] ?? blockAnchor(root)
  const prepends = Math.max(0, Math.min(plan.prepend, model.blocks.length))
  for (let index = 0; index < prepends; index += 1) {
    root.insertBefore(build(blockNode(model.blocks[index], index, model.hidden, handlers)), anchor)
  }
  return evicted + prepends
}

/** 帧尾六步（非重挂帧 · 判据面 = `docs/desktop/design/RENDERER.md` §3 帧尾滚动作）：
 *  ① 挂尾段（append / reset 档；`patch` 档就地更新；`none` 档 ∅）② 读数 `t0` ③ `syncChrome` ④ 头动作
 *  ⑤ 读数 `t1` ⑥ 帧尾三写（贴底 / 补偿算式 / 零写）。返回新 `mounted`（由 DOM 重建 —— 对齐步下帧输入）。 */
export function settleFrame(root, model, scroll, align, tier, handlers = {}) {
  if (!root || typeof root.querySelector !== "function") return []
  const plan = align ?? { evict: 0, prepend: 0, tail: [], ok: true }
  if (tier === "append" || tier === "reset") mountTail(root, model, plan, handlers)
  else if (tier === "patch") patchTail(root, model, handlers)
  const readMetrics = () => (typeof scroll?.readMetrics === "function" ? scroll.readMetrics() : {
    scrollTop: Number.isFinite(root.scrollTop) ? root.scrollTop : 0,
    scrollHeight: Number.isFinite(root.scrollHeight) ? root.scrollHeight : 0,
    clientHeight: Number.isFinite(root.clientHeight) ? root.clientHeight : 0,
  })
  const t0 = readMetrics()
  syncChrome(root, model, handlers)
  const moved = headMoves(root, model, plan, handlers)
  const t1 = readMetrics()
  const writing = tailAction({ following: model.following, headMoves: moved })
  if (writing === "stick") stickToBottom(root)
  else if (writing === "compensate") {
    root.scrollTop = compensateTop({ prevTop: t0.scrollTop, prevHeight: t0.scrollHeight, nextHeight: t1.scrollHeight })
  }
  return mountedOf(root, model.blocks)
}
