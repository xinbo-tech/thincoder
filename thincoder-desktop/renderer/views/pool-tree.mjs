/**
 * pool-tree.mjs — 右列池面**纯构树族**（让位修复批预案落形 · 2026-09-29 · 台账 #603 —— 自
 * `renderer/views/activity.mjs` 出档，沿「纯构树 ∕ 薄挂载」两层分家 · `docs/desktop/design/RENDERER.md` §1.1）：
 * `poolModel`（纯模型）→ `poolTree`（纯构树 · 机检面）+ 节点族（头 ∕ 读数 ∕ 折叠控件 ∕ 三族条目）。
 * 零 DOM ∕ 零 `node:` ∕ 零裸包；**挂载编排（三径 ∕ 弃容器 ∕ 帧尾扫）留 `renderer/views/activity.mjs`**
 * （`mountPool` 认族壳 `data-family="subagents"` 并以常驻容器领用 ∕ 置换——键控差分面）。
 *   ① 三态 `data-state`（根描述符**恒在**）：无活动会话 ⇒ `none`（零子节点 —— 禁假数据）· 有会话三族皆空 ⇒
 *      `empty`（**区域退场** —— R10 E2：与 `none` 一致零子节点，锚值保留）· 否则 `pool`；
 *   ② 族序**固定** = 待审批 → **子 agent** → 队列（`data-family`）；族空 ⇒ 该族**零节点**（不落空壳）；
 *   ③ 头 = `pool.title` + 两读数（`[data-read="running"|"approval"]`，值 = `pool.running` / `pool.approval`；
 *      非数 ⇒ **零节点** —— 禁假造）+ 折叠控件（`data-action="pool:toggle"`）—— 存量口径；
 *   ④ 折叠态 = `poolCollapsed[会话键]`（按会话记忆 —— 键 = `activeSession`）；
 *   ⑤ 键域 = **本会话**：族 / 读数 / 折叠态皆出 `state` 现态（块表 = `subBlocks[activeSession]`；渲染面**零推导 /
 *      零复制** —— 族与读数一致性由供给面单点写入保证，沿 `docs/desktop/design/UI.md` §1 状态栏行）；
 *   ⑥ 子 agent 族节点 = **常驻容器空壳**（族标签;项元素 = 核件（DOM 面）由 `mountPool` 键控差分填入）；
 *      表项 `region: "flow"`（归档墓碑）**不入族**（池内退场 —— 项 5 归档入流）。
 */
import { t } from "../i18n.mjs"
import { wire, segNode } from "./chat-tool.mjs"
import { approvalExits, approvalTitle } from "./approval.mjs"

/** 读数（`pool.running` / `pool.approval`）：数为值、非数 ⇒ `null`（**零节点** —— 禁假造）。 */
const readingOf = (value) => (Number.isFinite(value) ? value : null)

/** 条目列表（供给切片）：缺 / 非数组 ⇒ 空表（**零节点** —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 队列条目状态词（**闭枚举** —— 核态机码 → 词键；单源 = `docs/desktop/design/UI.md` §1 状态词行；
 *  表外码 ⇒ `null`（零状态词 —— 不自造词））。子 agent 族状态词归核件（`refreshBlock` —— 本档不复制）。 */
const BLOCK_WORD = Object.freeze({
  queued: "sub.queued", running: "sub.running", done: "sub.done", cancelled: "sub.stopped", error: "sub.error",
})

/** 状态词解析（码入闭枚举 ⇒ 词；表外 / 非串 ⇒ `null`）。 */
function statusWord(status) {
  return typeof status === "string" && Object.hasOwn(BLOCK_WORD, status) ? t(BLOCK_WORD[status]) : null
}

/** 池模型（纯 · 零 DOM）：三态 + 三族 + 两读数 + 折叠态（折叠键 = `activeSession` —— 按会话记忆；会话模型轮 R13：
 *  原 `activeTab` 键随标签裁撤退场，与块表同键）。**子 agent 族 = 核态机模型直传**（零视图侧推导）；
 *  `region === "flow"` 墓碑过滤（归档者池内退场 —— 项 5）。 */
export function poolModel(state) {
  const live = state?.activeSession !== null && state?.activeSession !== undefined
  const pool = state?.pool ?? {}
  const approvals = listOf(pool.approvals)
  const queue = listOf(pool.queue)
  const key = live ? String(state.activeSession) : null
  const table = state?.subBlocks !== null && typeof state?.subBlocks === "object" ? state.subBlocks : null
  const blocks = key === null || table === null ? [] : listOf(table[key]).filter((block) => block?.region !== "flow")
  const empty = approvals.length === 0 && blocks.length === 0 && queue.length === 0
  const mode = !live ? "none" : empty ? "empty" : "pool"
  return {
    state: mode,
    approvals,
    blocks: mode === "none" ? [] : blocks,
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
export function headNode(model, handlers) {
  const title = { tag: "span", props: { class: "pool-title" }, children: [t("pool.title")] }
  return {
    tag: "div",
    props: { class: "pool-head", "data-pool-head": "" },
    children: [title, readNode("running", model.running), readNode("approval", model.approval), toggleNode(model, handlers)],
  }
}

/** 族标签行（词键 ⇒ 文本；常驻容器换标签同用）。 */
export function familyLabel(word) {
  return { tag: "div", props: { class: "pool-family-label" }, children: [t(word)] }
}

/** 条目标签行（标称 + 状态词 —— 段码 `title` / `status`，**逐段包元素**）：两片皆缺 ⇒ 空行（段缺席 ⇒ 该段零节点）。 */
function labelNode(title, status) {
  return {
    tag: "div",
    props: { class: "pool-item-label" },
    children: [segNode("title", title), segNode("status", status)],
  }
}

/** 待审批条目：标称（逐项 ⇒ 工具名 / 批 ⇒ 计数词）+ 状态词 + 操作区（与卡面**同一构造**；`shape` 表外
 *  ⇒ `approvalExits` 回 `null` ⇒ 零操作区 ∧ 账目仍在 `data-prompt-id`）。 */
export function approvalItemNode(item, handlers) {
  return {
    tag: "div",
    props: {
      class: "pool-item",
      "data-pool-item": "approval",
      "data-prompt-id": item?.promptId == null ? undefined : String(item.promptId),
    },
    children: [labelNode(approvalTitle(item), t("tab.badge.approval")), approvalExits(item, handlers)],
  }
}

/** 队列条目：标题串（供给面出串）+ 状态词（同闭枚举 —— 表外码两处皆零）。席位保留 · 零写者（项 2 —— 用户
 *  排队消息改住流内 `pending`；族空 ⇒ 零节点恒不在场）。 */
export function queueItemNode(entry) {
  const word = statusWord(entry?.status)
  return {
    tag: "div",
    props: { class: "pool-item", "data-pool-item": "queue", "data-status": word === null ? undefined : entry.status },
    children: [labelNode(entry?.title, word)],
  }
}

/** 条目族：空 ⇒ `null`（零节点 —— 不落空壳）；非空 ⇒ 族标签（词键）+ 逐条目。 */
export function familyNode(name, word, items, entryOf) {
  if (items.length === 0) return null
  return {
    tag: "div",
    props: { class: "pool-family", "data-family": name },
    children: [familyLabel(word), ...items.map(entryOf)],
  }
}

/** 子 agent 族节点（纯树 = **常驻容器空壳** —— 族标签;项元素 = 核件（DOM 面）由 `mountPool` 键控差分填入）。
 *  空族 ⇒ `null`（零节点）；`mountPool` 认得本壳（`data-family="subagents"`）并以常驻容器置换/领用。 */
export function subFamilyNode(model) {
  if (model.blocks.length === 0) return null
  return {
    tag: "div",
    props: { class: "pool-family", "data-family": "subagents" },
    children: [familyLabel("pool.family.subagents")],
  }
}

/** 池体（头下展开区）：折叠 ⇒ 零条目节点；`pool` ⇒ 三族（序固定 · 空族零节点）。空态分支随 R10 E2 退场
 *  （`empty` 不再落体 —— 区域退场见 `poolTree`）。 */
function bodyNode(model, handlers) {
  const children = model.collapsed ? [] : [
    familyNode("approvals", "pool.family.approvals", model.approvals, (item) => approvalItemNode(item, handlers)),
    subFamilyNode(model),
    familyNode("queue", "pool.family.queue", model.queue, queueItemNode),
  ].filter((node) => node !== null)
  return { tag: "div", props: { class: "pool-items", "data-pool-body": "" }, children }
}

/** 池树（纯构树 · 零 DOM）：根 = 描述符（props 复制到宿主 —— `mountPool`）。**空态退场**（R10 E2 —— VSC
 *  `#subagent-activity:empty{display:none}` 的**内容面同形**）：`none` ∕ `empty` 两态**零子节点**（内容退场；
 *  区域盒 = 常驻右列卡 —— 骨架差异在册）；`pool` ⇒ 头 + 体。 */
export function poolTree(model, handlers = {}) {
  const mode = model?.state ?? "none"
  const children = mode === "pool" ? [headNode(model, handlers), bodyNode(model, handlers)] : []
  return { tag: "div", props: { "data-pool": "", "data-state": mode }, children }
}
