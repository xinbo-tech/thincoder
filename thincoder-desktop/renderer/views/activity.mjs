/**
 * activity.mjs — 本会话活动池面（`docs/desktop/design/UI.md` §1 审批呈现行 / §2 项 1 池落形 · 批档 §2.2（c））：
 * 三面 —— `poolModel`（纯模型）→ `poolTree`（纯构树 · 机检面）→ `mountPool`（薄挂载）。宿主 = 骨架
 * `.pool-body[data-slot="pool"]` **自身**（根描述符 props 复制到宿主 · `data-slot` 保留 ⇒ 槽位零改）。
 *   ① 三态 `data-state`（根描述符**恒在**）：无活动会话 ⇒ `none`（零子节点 —— 禁假数据）· 有会话三族皆空 ⇒
 *      `empty`（词表提示）· 否则 `pool`；
 *   ② 族序**固定** = 待审批 → 活动块 → 队列（`data-family`）；族空 ⇒ 该族**零节点**（不落空壳）；
 *   ③ 头 = `pool.title` + 两读数（`[data-read="running"|"approval"]`，值 = `pool.running` / `pool.approval`；
 *      非数 ⇒ **零节点** —— 禁假造）+ 折叠控件（`data-action="pool:toggle"` + `aria-expanded` + `aria-label`
 *      两态词键；字形住 `pool.css` 的 `content` ⇒ 本档零字形字面）；
 *   ④ 折叠态 = `poolCollapsed[会话键]`（按会话记忆；会话键 = `activeTab`）⇒ 体零条目节点 ∧ 头读数在场；
 *   ⑤ 条目**零内容回显**（标称 + 状态词）：待审批 = `approvalTitle` + 状态词 + 操作区（与卡面**同一构造**
 *      `approvalExits` —— 两态同锚 · **不争焦**：零 `data-autofocus`）；活动块 = 工具名 + 状态词 + `data-status`；
 *      队列 = 标题串 + 状态词；表外状态码 ⇒ 零状态词 ∧ 零 `data-status`（禁假造）；
 *   ⑥ 键域 = **本会话**：族 / 读数 / 折叠态皆出 `state` 现态（渲染面**零推导 / 零复制** —— 族与读数一致性由
 *      供给面单点写入保证，沿 `docs/desktop/design/UI.md` §1 状态栏行）。
 * 文案一律经 `t()`（零硬编码 · 零字形字面）；零 `node:` / 零裸包 / 零 `store.mjs` import（挂载面纯读现态）。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { approvalExits, approvalTitle } from "./approval.mjs"
import { STATUS_WORD, wire } from "./chat-tool.mjs"

/** 读数（`pool.running` / `pool.approval`）：数为值、非数 ⇒ `null`（**零节点** —— 禁假造）。 */
const readingOf = (value) => (Number.isFinite(value) ? value : null)

/** 条目列表（供给切片）：缺 / 非数组 ⇒ 空表（**零节点** —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 状态词（闭枚举单源 = `STATUS_WORD`）：码入集 ⇒ 词；表外码 / 非串 ⇒ `null`（零状态词 —— 不自造词）。 */
function statusWord(status) {
  return typeof status === "string" && Object.hasOwn(STATUS_WORD, status) ? t(STATUS_WORD[status]) : null
}

/** 池模型（纯 · 零 DOM）：三态 + 三族 + 两读数 + 折叠态（键 = `activeTab` —— 按会话记忆）。 */
export function poolModel(state) {
  const live = state?.activeSession !== null && state?.activeSession !== undefined
  const pool = state?.pool ?? {}
  const approvals = listOf(pool.approvals)
  const blocks = listOf(pool.blocks)
  const queue = listOf(pool.queue)
  const empty = approvals.length === 0 && blocks.length === 0 && queue.length === 0
  const mode = !live ? "none" : empty ? "empty" : "pool"
  const key = typeof state?.activeTab === "string" ? state.activeTab : null
  return {
    state: mode,
    approvals,
    blocks,
    queue,
    running: mode === "none" ? null : readingOf(pool.running),
    approval: mode === "none" ? null : readingOf(pool.approval),
    collapsed: mode !== "none" && key !== null && state?.poolCollapsed?.[key] === true,
    key,
  }
}

/** 读数节点：非数 ⇒ `null`（零节点）；数（含 0）⇒ 值文本（单源 = `pool` 切片）。 */
function readNode(name, value) {
  if (value === null) return null
  return { tag: "span", props: { class: "pool-read", "data-read": name }, children: [String(value)] }
}

/** 折叠控件（`aria-label` 两态词键；字形住 `pool.css`）：`onTogglePool` 给 ⇒ 接线（回执 = 本会话键）；
 *  缺 ⇒ `wire` 落 `disabled: true`（诚实非死控 —— 锚仍在场）。 */
function toggleNode(model, handlers) {
  const onToggle = typeof handlers?.onTogglePool === "function" ? () => handlers.onTogglePool(model.key) : undefined
  return {
    tag: "button",
    props: wire({
      class: "pool-toggle",
      "data-action": "pool:toggle",
      "aria-expanded": model.collapsed ? "false" : "true",
      "aria-label": t(model.collapsed ? "pool.expand" : "pool.collapse"),
    }, onToggle),
    children: [],
  }
}

/** 池头（`pool` / `empty` 两态在场；`none` 态由根面整树零子节点兜住）：标题 + 两读数 + 折叠控件。 */
function headNode(model, handlers) {
  const title = { tag: "span", props: { class: "pool-title" }, children: [t("pool.title")] }
  return {
    tag: "div",
    props: { class: "pool-head", "data-pool-head": "" },
    children: [title, readNode("running", model.running), readNode("approval", model.approval), toggleNode(model, handlers)],
  }
}

/** 条目标签行（标称 + 状态词）：两片皆缺 ⇒ 空行（`el` 跳空位；`null` / 空串不落文本）。 */
function labelNode(parts) {
  return { tag: "div", props: { class: "pool-item-label" }, children: parts }
}

/** 待审批条目：标称（逐项 ⇒ 工具名 / 批 ⇒ 计数词）+ 状态词 + 操作区（与卡面**同一构造**；`shape` 表外
 *  ⇒ `approvalExits` 回 `null` ⇒ 零操作区 ∧ 账目仍在 `data-prompt-id`）。 */
function approvalItemNode(item, handlers) {
  return {
    tag: "div",
    props: {
      class: "pool-item",
      "data-pool-item": "approval",
      "data-prompt-id": item?.promptId == null ? undefined : String(item.promptId),
    },
    children: [labelNode([approvalTitle(item), t(STATUS_WORD.approval)]), approvalExits(item, handlers)],
  }
}

/** 活动块条目：工具名 + 状态词 + `data-status`（码入闭枚举 ⇒ 落；表外 ⇒ 两处皆零 —— 禁假造）；零内容回显。 */
function blockItemNode(block) {
  const word = statusWord(block?.status)
  return {
    tag: "div",
    props: { class: "pool-item", "data-pool-item": "block", "data-status": word === null ? undefined : block.status },
    children: [labelNode([block?.tool, word])],
  }
}

/** 队列条目：标题串（供给面出串）+ 状态词（同闭枚举 —— 表外码两处皆零）。 */
function queueItemNode(entry) {
  const word = statusWord(entry?.status)
  return {
    tag: "div",
    props: { class: "pool-item", "data-pool-item": "queue", "data-status": word === null ? undefined : entry.status },
    children: [labelNode([entry?.title, word])],
  }
}

/** 条目族：空 ⇒ `null`（零节点 —— 不落空壳）；非空 ⇒ 族标签（词键）+ 逐条目。 */
function familyNode(name, word, items, entryOf) {
  if (items.length === 0) return null
  return {
    tag: "div",
    props: { class: "pool-family", "data-family": name },
    children: [{ tag: "div", props: { class: "pool-family-label" }, children: [t(word)] }, ...items.map(entryOf)],
  }
}

/** 池体（头下展开区）：折叠 ⇒ 零条目节点；`empty` ⇒ 词表提示；`pool` ⇒ 三族（序固定 · 空族零节点）。 */
function bodyNode(model, handlers) {
  let children = []
  if (!model.collapsed) {
    if (model.state === "empty") {
      children = [{ tag: "div", props: { class: "pool-empty", "data-pool-empty": "" }, children: [t("pool.empty.hint")] }]
    } else {
      children = [
        familyNode("approvals", "pool.family.approvals", model.approvals, (item) => approvalItemNode(item, handlers)),
        familyNode("blocks", "pool.family.blocks", model.blocks, blockItemNode),
        familyNode("queue", "pool.family.queue", model.queue, queueItemNode),
      ]
    }
  }
  return { tag: "div", props: { class: "pool-items", "data-pool-body": "" }, children }
}

/** 池树（纯构树 · 零 DOM）：根 = 描述符（props 复制到宿主 —— `mountPool`）；`none` ⇒ **零子节点**。 */
export function poolTree(model, handlers = {}) {
  const mode = model?.state ?? "none"
  const children = mode === "none" ? [] : [headNode(model, handlers), bodyNode(model, handlers)]
  return { tag: "div", props: { "data-pool": "", "data-state": mode }, children }
}

/** 薄挂载：props 复制到宿主（`data-slot` 等骨架属性**保留** ⇒ 槽位零改）+ `clear` + `append`；容器缺位 ⇒ 空转。 */
export function mountPool(root, state, handlers = {}) {
  const model = poolModel(state)
  if (!root || typeof root.setAttribute !== "function") return model
  const tree = build(poolTree(model, handlers))
  for (const name of tree.getAttributeNames()) root.setAttribute(name, tree.getAttribute(name))
  clear(root)
  for (const child of [...tree.childNodes]) root.append(child)
  return model
}
