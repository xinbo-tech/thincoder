/**
 * activity.mjs — 本会话**右列 = 子 agent 面板**（D20 · `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 2 ·
 * 「本批注（对齐第二批 · 六件）」项 3 / 5 · `docs/desktop/design/PROJECT.md` §2 KD-26 · `docs/desktop/design/RENDERER.md`
 * §1.1「池面挂载（键控差分）」条）：三面 —— `poolModel`（纯模型）→ `poolTree`（纯构树 · 机检面）→ `mountPool`
 * （薄挂载 · **键控差分**）。宿主 = 骨架 `.pool-body[data-slot="pool"]` **自身**（根描述符 props 复制到宿主 ·
 * `data-slot` 保留 ⇒ 槽位零改）。
 *   ① 三态 `data-state`（根描述符**恒在**）：无活动会话 ⇒ `none`（零子节点 —— 禁假数据）· 有会话三族皆空 ⇒
 *      `empty`（**区域退场** —— R10 E2：与 `none` 一致零子节点，锚值保留）· 否则 `pool`；
 *   ② 族序**固定** = 待审批 → **子 agent** → 队列（`data-family`）；族空 ⇒ 该族**零节点**（不落空壳）；
 *   ③ 头 = `pool.title` + 两读数（`[data-read="running"|"approval"]`，值 = `pool.running` / `pool.approval`；
 *      非数 ⇒ **零节点** —— 禁假造）+ 折叠控件（`data-action="pool:toggle"`）—— 存量口径；
 *   ④ 折叠态 = `poolCollapsed[会话键]`（按会话记忆 —— 键 = `activeSession`）；
 *   ⑤ **子 agent 族 = 核件直消费**（「对齐第二批」项 3 —— `renderSubBlock` / `refreshBlock` / `renderSubagentChunk` /
 *      `renderSubDesc`）：块面 = VSC 同件（`details.advisor-block.sub-block` + 头行 + 状态词 + 内容 tail-3 + 展开 +
 *      ⏹）—— 桌面自建五段行块面**退场**；**容器常驻**（跨帧同一 —— 同 key 元素复用：内容追加 / 折叠态 / ⏹ 全走
 *      核函数，**不重建**；**键域 = 本会话**（会话变更 ⇒ 弃容器重建 —— 禁沿用旧会话行账；「键域与换代」判据）；
 *      壳（三态 / 头 / 折叠与待审批 / 队列两族）**照帧刷**）；表项 `region: "flow"`（归档墓碑）
 *      **不入族**（池内退场 —— 项 5 归档入流；退场块随 `renderer/views/chat-subagent.mjs` 在流内留形）；
 *   ⑥ 键域 = **本会话**：族 / 读数 / 折叠态皆出 `state` 现态（块表 = `subBlocks[activeSession]`；渲染面**零推导 /
 *      零复制** —— 族与读数一致性由供给面单点写入保证，沿 `docs/desktop/design/UI.md` §1 状态栏行）。
 * **R10（子代理面板 ∕ live 面 ⇒ VSC 对齐 · 2026-09-28）四点**：
 *   ① **空态退场**（E2 —— `none` ∕ `empty` 两态一致：**零子节点**；VSC `#subagent-activity:empty{display:none}`
 *      的**内容面同形**（区域盒 = 常驻右列卡 —— 骨架差异在册）—— 原 `empty` 词表提示面退场；`data-state` 三态锚保留）；
 *   ② **生命期**（E4 —— 终态折叠含 `settled`（`awaitingDigest`）**同折**：VSC fold 效果无 awaiting 分支，驻留态词
 *      `sub.awaitingDigest` 由核 `refreshBlock` 落头行）；
 *   ③ **出生计数贴**（E6 / U-2 —— `renderer/views/activity-new.mjs`：块出生点判据「跟底 ⇒ 区钉底；未跟底 ⇒ 计数」
 *      + 帧面重挂复原；会话切换 ∕ 空态退场 ⇒ 清账）；
 *   ④ **封顶自滚**（E1 —— 封顶 = 列高（布局骨架差异在册：VSC 横带 32vh）；自滚 = 宿主 `overflow: auto` +
 *      `overscroll-behavior: contain`（`renderer/pool.css` 该条注））。核件消费面（`subblocks/*`）零改。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { renderSubagentChunk, renderSubBlock, renderSubDesc } from "/rc/subblocks/block.mjs"
import { refreshBlock } from "/rc/subblocks/activity-view.mjs"
import { clearActivityNew, notePoolBirth, syncActivityNew } from "./activity-new.mjs"
import { approvalExits, approvalTitle } from "./approval.mjs"
import { segNode, wire } from "./chat-tool.mjs"

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
function headNode(model, handlers) {
  const title = { tag: "span", props: { class: "pool-title" }, children: [t("pool.title")] }
  return {
    tag: "div",
    props: { class: "pool-head", "data-pool-head": "" },
    children: [title, readNode("running", model.running), readNode("approval", model.approval), toggleNode(model, handlers)],
  }
}

/** 族标签行（词键 ⇒ 文本；常驻容器换标签同用）。 */
function familyLabel(word) {
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

/** 队列条目：标题串（供给面出串）+ 状态词（同闭枚举 —— 表外码两处皆零）。席位保留 · 零写者（项 2 —— 用户
 *  排队消息改住流内 `pending`；族空 ⇒ 零节点恒不在场）。 */
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
    children: [familyLabel(word), ...items.map(entryOf)],
  }
}

/** 子 agent 族节点（纯树 = **常驻容器空壳** —— 族标签;项元素 = 核件（DOM 面）由 `mountPool` 键控差分填入）。
 *  空族 ⇒ `null`（零节点）；`mountPool` 认得本壳（`data-family="subagents"`）并以常驻容器置换/领用。 */
function subFamilyNode(model) {
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

// ─── 子 agent 族（核件直消费 · 键控差分）─────────────────────────────

/** 核件块元素（新代 / 首见）：块壳（`renderSubBlock` —— 含 data 面 + toggle + 首刷）⇒ 内容行重放
 *  （`entry.rows` 逐条 `renderSubagentChunk` —— 重挂重放单源）⇒ 冻结着装 ⇒ 末刷（挂 DOM 后补 —— 首见径 `createSubBlock` ∕ 接管径 `updateSubBlock` 同序）。 */
function subElementOf(entry) {
  const element = renderSubBlock(entry)
  element._rowsDone = 0
  replayRows(element, entry)
  foldIfFrozen(element, entry)
  return element
}

/** 内容行增量重放（`_rowsDone` 记账 —— 同 frames 内只追加新行；`rows` 缺 / 非数组 ⇒ 零动作）。 */
function replayRows(element, entry) {
  const rows = Array.isArray(entry?.rows) ? entry.rows : []
  const pending = rows.slice(element._rowsDone ?? 0)
  if (pending.length > 0) {
    // 冻结块重放（重建 / 会话切回两径 —— 历史面，非运行态增量）：临时以未冻态过核件追加闸，毕还原本相
    const thaw = entry?.frozen === true
    if (thaw) element._subMeta = { ...entry, frozen: false }
    for (const row of pending) renderSubagentChunk(element, row)
    if (thaw) element._subMeta = entry
  }
  element._rowsDone = rows.length
}

/** 冻结着装（终态折叠 —— 核 fold 效果逐值同形：`sub-live ⇒ sub-frozen` + 折叠 + ⏹ 移除）。R10 E4：
 *  `settled`（`awaitingDigest`）与其余终态**同折**（VSC `activity.js:80-86` fold 效果无 awaiting 分支 ——
 *  驻留态词 `sub.awaitingDigest` 由核 `refreshBlock` 照常落头行）。幂等（已着装重复调用零新写）。 */
function foldIfFrozen(element, entry) {
  if (entry?.frozen !== true) return
  element.classList.remove("sub-live")
  element.classList.add("sub-frozen")
  element.open = false
  element.querySelector(".sub-stop-btn")?.remove()
}

/** 同 key 元素更新（**不重建**）：新代接管（核 `takeover` —— 同键新代：前态已冻结 ∧ 新态未冻结）⇒ 换新元素
 *  （**挂载后末刷** —— ⏹ 门控读 `isConnected`，与首见径 `createSubBlock` 同序）；其余（内容追加 / 状态迁移 /
 *  终态折叠）⇒ 就地核函数更新（内容追加 / 折叠态 / ⏹ 全走核函数）。 */
function updateSubBlock(element, entry) {
  const known = element._subMeta
  if (known === entry) return
  if (known?.frozen === true && entry?.frozen !== true) {
    const next = subElementOf(entry)
    element.replaceWith(next)
    // 挂载后末刷（换元素径 —— 核首刷发生在挂载前，`isConnected` 门控未过；与首见径同序）
    refreshBlock(next)
    return
  }
  element._subMeta = entry
  replayRows(element, entry)
  foldIfFrozen(element, entry)
  refreshBlock(element)
}

/** 新块出生（族尾 append）：说明行（会话首个活动块 · 一次性 —— 核 `renderSubDesc` 插 `.advisor-content` 之前）；
 *  出生点判据（R10 E6 —— VSC `activity.js:60-63` 同点：跟底 ⇒ 区钉底；未跟底 ⇒ 计数贴 +1）；
 *  挂 DOM 后重刷（⏹ 门控读 `isConnected` —— 核首刷发生在挂载前）。 */
function createSubBlock(root, family, entry) {
  const element = subElementOf(entry)
  if (family.querySelectorAll(".sub-block").length === 0 && family.querySelector(".sub-desc") === null) {
    element.insertBefore(renderSubDesc(), element.querySelector(".advisor-content"))
  }
  family.append(element)
  notePoolBirth(root)
  refreshBlock(element)
  return element
}

/** 键控差分（项 3）：同 key ⇒ 复用元素就地更新；新 key ⇒ 尾追出生；出表（归档墓碑过滤后缺席 / 取消）⇒ 摘除。
 *  块表序 = 插入序 ∧ 新增恒在尾 ⇒ DOM 序 ≡ 模型序（不重排）。 */
function syncSubBlocks(root, family, model) {
  const items = [...family.querySelectorAll(".sub-block")]
  const byKey = new Map()
  for (const element of items) {
    const key = element.getAttribute("data-subname") ?? ""
    if (key !== "" && !byKey.has(key)) byKey.set(key, element)
  }
  const wanted = new Set()
  for (const entry of model.blocks) {
    const key = typeof entry?.key === "string" ? entry.key : ""
    if (key === "" || wanted.has(key)) continue
    wanted.add(key)
    const element = byKey.get(key)
    if (element === undefined) createSubBlock(root, family, entry)
    else updateSubBlock(element, entry)
  }
  for (const element of items) {
    if (!wanted.has(element.getAttribute("data-subname") ?? "")) element.remove()
  }
}

/** 常驻族容器标签刷（语言切 ⇒ 词面随动；容器身份与项元素零扰 —— 原位换标签）。 */
function bindFamilyLabel(family) {
  const label = family.querySelector(".pool-family-label")
  const next = build(familyLabel("pool.family.subagents"))
  if (label !== null && label !== undefined) label.replaceWith(next)
  else family.prepend(next)
}

/** 薄挂载（帧面 · **键控差分**）：壳（三态 / 头读数 / 折叠）与待审批 / 队列族照帧刷；子 agent 族容器**常驻**
 *  （`root._poolSub` —— 跨帧同一，项元素按 key 复用，不重建）。**键域 = 本会话**（`root._poolSubSession` ——
 *  会话变更 ⇒ 弃旧容器令族重建，禁沿用旧会话行账）。折叠 ⇒ 容器摘离（子树存活 ⇒ 展开即复现）；**空态退场**
 *  （R10 E2 —— `none` ∕ `empty` ⇒ 零子节点 + 计数贴清账）。
 *  容器缺位 ⇒ 空转；回值 = 模型（调用面零分支）。 */
export function mountPool(root, state, handlers = {}) {
  const model = poolModel(state)
  if (!root || typeof root.setAttribute !== "function") return model
  root.setAttribute("data-pool", "")
  root.setAttribute("data-state", model.state)
  // 会话换代（「键域与换代」判据）：容器账 = 会话内 —— 会话变更（含退至 none）⇒ 弃旧容器（族重建；
  // 同键跨会话重现不承旧行账 / 旧 `.sub-desc` 判据）；R10 E6：计数贴同清（VSC `resetActivity` 同点）+ pin
  // 旗标复位（跟随缺省 —— 桌面宿主跨会话存活，VSC 区为会话内；chassis 适配，见 `activity-new.mjs` 档头）
  if (root._poolSubSession !== undefined && root._poolSubSession !== model.key) {
    clearActivityNew(root)
    root._poolPin = true
  }
  if ((root._poolSub ?? null) !== null && root._poolSubSession !== model.key) {
    root._poolSub = null
    root._poolSubSession = null
  }
  const live = root._poolSub ?? null
  // 先摘 —— 常驻容器不入 clear 射程（子树存活）
  if (live !== null && typeof live.remove === "function") live.remove()
  if (model.state === "none" || model.state === "empty") {
    clear(root)
    clearActivityNew(root)
    return model
  }
  const tree = build(poolTree(model, handlers))
  clear(root)
  for (const child of [...tree.childNodes]) root.append(child)
  syncActivityNew(root) // 计数贴帧面复原（R10 E6 —— `clear` 摘钮后按计数重挂；`N = 0` ⇒ 零动作）
  root._poolSubSession = model.key // 换代账随池面在场即落（无块族帧同记 —— 会话切换清账判据不倚块族）
  const shell = root.querySelector('[data-family="subagents"]')
  if (shell !== null && shell !== undefined) {
    const family = live ?? shell
    if (family !== shell) shell.replaceWith(family)
    root._poolSub = family
    root._poolSubSession = model.key
    bindFamilyLabel(family)
    syncSubBlocks(root, family, model)
  }
  return model
}
