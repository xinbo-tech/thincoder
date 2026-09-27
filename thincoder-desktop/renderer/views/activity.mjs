/**
 * activity.mjs — 本会话**右列 = 子 agent 面板**（D20 · `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 2 ·
 * `docs/desktop/design/PROJECT.md` §2 KD-26 / §6.1 D20 / §7 T-DSK36；批档 §2 ㈣）：
 * 三面 —— `poolModel`（纯模型）→ `poolTree`（纯构树 · 机检面）→ `mountPool`（薄挂载）。宿主 = 骨架
 * `.pool-body[data-slot="pool"]` **自身**（根描述符 props 复制到宿主 · `data-slot` 保留 ⇒ 槽位零改）。
 *   ① 三态 `data-state`（根描述符**恒在**）：无活动会话 ⇒ `none`（零子节点 —— 禁假数据）· 有会话三族皆空 ⇒
 *      `empty`（词表提示）· 否则 `pool`；
 *   ② 族序**固定** = 待审批 → **子 agent** → 队列（`data-family`）；族空 ⇒ 该族**零节点**（不落空壳）；
 *   ③ 头 = `pool.title` + 两读数（`[data-read="running"|"approval"]`，值 = `pool.running` / `pool.approval`；
 *      非数 ⇒ **零节点** —— 禁假造）+ 折叠控件（`data-action="pool:toggle"` + `aria-expanded` + `aria-label`
 *      两态词键；字形住 `pool.css` 的 `content` ⇒ 本档零字形字面）；
 *   ④ 折叠态 = `poolCollapsed[会话键]`（按会话记忆 —— 存量口径键 = `activeTab`）⇒ 体零条目节点 ∧ 头读数在场；
 *   ⑤ **子 agent 块**（射程五类 = sync spawn / async 池 / consult / escalate / advisor-async —— 归约面零角色过滤，
 *      凭 relay 前缀出场；`docs/render-core/design/RENDER-CORE.md` §5）：块头四段（`data-seg` = `role` / `model` /
 *      `elapsed` / `turn`）+ 状态词（**闭枚举** —— 核态机码 → 词键，`cancelled` ⇒「已停止」）+ 停止钮
 *      （`data-action="subagent:stop"` —— **只对可中止块**在场：未终态 ∧〔queued ∨ running ∧（async 池 ∨ sync
 *      registry live）〕；不可中止者零钮 —— 诚实非死控）+ **零内容回显**（需求 §3.1:51 / D4：内容不进流也不进块）；
 *      **工具调用行摘除**（工具面 = 对话流工具卡）；
 *   ⑥ 键域 = **本会话**：族 / 读数 / 折叠态皆出 `state` 现态（块表 = `subBlocks[activeSession]`；渲染面**零推导 /
 *      零复制** —— 族与读数一致性由供给面单点写入保证，沿 `docs/desktop/design/UI.md` §1 状态栏行）。
 * 文案一律经 `t()`（零硬编码 · 零字形字面）；零 `node:` / 零裸包 / 零 `store.mjs` import（挂载面纯读现态）。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { approvalExits, approvalTitle } from "./approval.mjs"
import { segNode, wire } from "./chat-tool.mjs"

/** 读数（`pool.running` / `pool.approval`）：数为值、非数 ⇒ `null`（**零节点** —— 禁假造）。 */
const readingOf = (value) => (Number.isFinite(value) ? value : null)

/** 条目列表（供给切片）：缺 / 非数组 ⇒ 空表（**零节点** —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 块状态词（**闭枚举** —— 核态机码 → 词键；单源 = `docs/desktop/design/UI.md` §1 状态词行六词；
 *  `cancelled` ⇒ 「已停止」（`⟦ev⟧stopped` 先例兼容映射）；表外码 ⇒ `null`（零状态词 —— 不自造词））。 */
const BLOCK_WORD = Object.freeze({
  queued: "sub.queued", running: "sub.running", done: "sub.done", cancelled: "sub.stopped", error: "sub.error",
})

/** 状态词解析（码入闭枚举 ⇒ 词；表外 / 非串 ⇒ `null`）。 */
function statusWord(status) {
  return typeof status === "string" && Object.hasOwn(BLOCK_WORD, status) ? t(BLOCK_WORD[status]) : null
}

/** 块呈现记录（自核态机模型读读数 —— 用时 / 回合 / 可中止三判；**零内容回显**：模型仅出块头字段）。
 *  用时：`startedAt` 有效 ∧ 非排队态才计（排队等待不计用时；终态取 `doneAt` ⇒ 冻结后不再走时；负差夹 0）。
 *  可中止（**诚实非死控**）：判据字段与宿主停止出口两族命中面同源（`pool` = async 池 · `syncLive` = 核 sync
 *  registry 只读采样）—— 不可中止者（如 consult：无池条目 / 无 registry）零钮。 */
function blockViewOf(block, now) {
  const frozen = block?.frozen === true
  const status = typeof block?.status === "string" ? block.status : null
  const started = typeof block?.startedAt === "number" && Number.isFinite(block.startedAt) ? block.startedAt : null
  const end = frozen && typeof block?.doneAt === "number" && Number.isFinite(block.doneAt) ? block.doneAt : now
  const seconds = started === null || block?.queued === true ? null : Math.max(0, Math.floor((end - started) / 1000))
  const turn = Number.isInteger(block?.turn) && block.turn > 0 && Number.isInteger(block?.maxTurns) && block.maxTurns > 0
    ? { n: block.turn, m: block.maxTurns }
    : null
  return {
    id: block?.id ?? null,
    role: typeof block?.role === "string" && block.role !== "" ? block.role : null,
    model: typeof block?.model === "string" && block.model !== "" ? block.model : null,
    status,
    seconds,
    turn,
    cancellable: !frozen && (status === "queued" || (status === "running" && (block?.pool === true || block?.syncLive === true))),
  }
}

/** 池模型（纯 · 零 DOM）：三态 + 三族 + 两读数 + 折叠态（折叠键 = `activeTab` —— 按会话记忆，存量口径；
 *  块表键 = `activeSession` —— 面板随**已载入页**）。`now` = 用时现刻（可注入 —— 测试缝）。 */
export function poolModel(state, now = Date.now()) {
  const live = state?.activeSession !== null && state?.activeSession !== undefined
  const pool = state?.pool ?? {}
  const approvals = listOf(pool.approvals)
  const queue = listOf(pool.queue)
  const key = live ? String(state.activeSession) : null
  const tab = typeof state?.activeTab === "string" ? state.activeTab : null
  const table = state?.subBlocks !== null && typeof state?.subBlocks === "object" ? state.subBlocks : null
  const blocks = key === null || table === null ? [] : listOf(table[key])
  const empty = approvals.length === 0 && blocks.length === 0 && queue.length === 0
  const mode = !live ? "none" : empty ? "empty" : "pool"
  return {
    state: mode,
    approvals,
    blocks: mode === "none" ? [] : blocks.map((block) => blockViewOf(block, now)),
    queue,
    running: mode === "none" ? null : readingOf(pool.running),
    approval: mode === "none" ? null : readingOf(pool.approval),
    collapsed: mode !== "none" && tab !== null && state?.poolCollapsed?.[tab] === true,
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
function approvalItemNode(item, handlers) {
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

/** 子 agent 块头行（**逐段包元素** —— 通则 = `docs/desktop/design/RENDERER.md` §1.1）：四数据段 + 状态词段
 *  （`elapsed` 复用状态行耗时段词键 · `turn` 复用核键 `status.turn` —— 词形单源，桌面不另立同义键）。 */
function blockHeadNode(entry) {
  return {
    tag: "div",
    props: { class: "pool-item-label" },
    children: [
      segNode("role", entry.role),
      segNode("model", entry.model),
      segNode("elapsed", entry.seconds === null ? null : t("status.elapsed", { seconds: entry.seconds })),
      segNode("turn", entry.turn === null ? null : t("status.turn", { n: entry.turn.n, m: entry.turn.m })),
      segNode("status", statusWord(entry.status)),
    ],
  }
}

/** 停止钮（`data-action="subagent:stop"` —— 只对可中止块在场；出口零乐观写：块折叠随事件面 `cancelled`）。
 *  接线两态沿通则（`wire`）：handler 给 ⇒ 点击；缺 ⇒ `disabled`（锚仍在场 —— 零假控件）。 */
function stopNode(entry, key, handlers) {
  if (!entry.cancellable) return null
  const onStop = typeof handlers?.onStopSubagent === "function"
    ? () => handlers.onStopSubagent(key, entry.id, entry.role)
    : undefined
  return {
    tag: "button",
    props: wire({ class: "pool-stop", "data-action": "subagent:stop" }, onStop),
    children: [t("pool.stop")],
  }
}

/** 子 agent 块条目：块头 + 停止钮；身份锚 `data-sub-id` / `data-sub-role`（停止出口载荷源 —— 与
 *  `ev:subagent` 同源同值）；表外状态码 ⇒ 零 `data-status` ∧ 零状态词（禁假造）。 */
function blockItemNode(entry, key, handlers) {
  return {
    tag: "div",
    props: {
      class: "pool-item",
      "data-pool-item": "subagent",
      "data-status": statusWord(entry.status) === null ? undefined : entry.status,
      "data-sub-id": entry.id == null ? undefined : String(entry.id),
      "data-sub-role": entry.role == null ? undefined : entry.role,
    },
    children: [blockHeadNode(entry), stopNode(entry, key, handlers)],
  }
}

/** 队列条目：标题串（供给面出串）+ 状态词（同闭枚举 —— 表外码两处皆零）。 */
function queueItemNode(entry) {
  const word = statusWord(entry?.status)
  return {
    tag: "div",
    props: { class: "pool-item", "data-pool-item": "queue", "data-status": word === null ? undefined : entry.status },
    children: [labelNode(entry?.title, word)],
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
        familyNode("subagents", "pool.family.subagents", model.blocks, (entry) => blockItemNode(entry, model.key, handlers)),
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
