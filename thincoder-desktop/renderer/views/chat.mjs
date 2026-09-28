/**
 * chat.mjs — 对话流视图面（`docs/desktop/design/RENDERER.md` §1.1 / §2 / §3 · `docs/desktop/design/UI.md` §1 对话流行）。
 * 三档沿 RENDERER.md §1.1：`chatModel`（纯模型 · 窗出口）→ `chatTree`（纯构树 · 机检面）→ `mountChat`（薄挂载 =
 * 本档唯一清空 / 建树处）；DOM 面另两件 = 帧尾态刷 `syncChrome`（根锚四 + 摘要块 + 审批卡 + 药丸 + **消化行组** + **到期触发行组** + **停止痕** + **台账行组** + **真置焦执行** · 幂等 · 无帧豁免）· 帧尾六步 `settleFrame`；
 * **卡面态刷**住 `renderer/views/chat-cards.mjs`（R3c 拆档 —— 在册预案 = 卡构树拆出；本档经 `syncCards` 调用）；
 * **排队期「待发送块」不在本档**（收正轮 B12 新口径 —— 住**输入行上方带**，硬验收 = 与输入面板恒定邻接；
 * 消费前流内零真块，交付时刻 `ev:queue` 消费回执才入流）；
 * **消化行组**（`[data-digest]` —— 桌面空闲唤醒批）本档自持：非块节点组（沿 `[data-pending]` 先例），在场 ⟺ 本键 `digest`
 * 切片起跑态（`start`）—— `end` ⇒ 先原地更新本键游标行后摘除（单源 = `docs/desktop/design/RENDERER.md` §1.1 两条纪律）；
 * **到期触发行组**（`[data-timer]` —— timer-wake 阶段 2）：非块节点组 · 在场 ⟺ 本键 `timerNotice` 切片在场，
 * 构树 ∕ 帧尾同刷住 `renderer/views/chat-chrome.mjs`（与消化行组同族）；
 * **归档子 agent 块**住 `renderer/views/chat-subagent.mjs`（项 5 新档 —— 壳构树 + 核件回显补装）；
 * 工具卡面与折叠纯函数 `toggleExpanded` 住 `renderer/views/chat-tool.mjs`（§2.3 拆分预案落形 —— 依赖单向：本档 → 它）；文本族块尾的复制控件 + 末条复制控件
 * 住 `renderer/views/chat-copy.mjs`（UI.md §1「批 B 注」项 4 —— 依赖单向：本档 → 它）；**文本面（核 Markdown 呈现）+ 推理块 + 就地更新 + 说话人标签**住 `renderer/views/chat-text.mjs`（R3c · D19；项 1 / 4 增推理画笔分流 + 标签落笔 —— 依赖单向：本档 → 它）；首启空白态引导面（判据
 * `guideOf` + 构树 `guideNode` + 帧尾只摘态刷 `syncGuide`）住 `renderer/views/chat-guide.mjs`（UI.md §1「批 B 追加注」项 1 —— 依赖单向：本档 → 它）。
 *   ① 三态 `data-state`：无活动会话 ⇒ `none`（零**块**节点 + 引导节点——禁假数据）· 有会话零块 ⇒ `empty`
 *      （引导节点 · `chat.empty.hint`）· 否则 `flow`；
 *   ② 块六型（`user` / `assistant` / `reasoning` / `tool` / `error` 五项页读域 + 运行期块 `subagent` —— 归档入流块，
 *      单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 5）单序列；块键单源 = `blockKey`（`data-block-id` /
 *      增量缝合 / toggle 同域）；兜底键用**全列表位序**（`hidden + i`）⇒ 窗滑动不改键；文本族块面 = **经核 Markdown**
 *      呈现（KD-RC-4 · R3c —— 单源 = `renderer/views/chat-text.mjs`；转义闸在核；原文逐字另存 `[data-raw]` 锚供复制面）；
 *      **说话人标签**（项 4）：用户块恒出 / 助手族块回合首出（判据 = `turnHeadOf` 单源 —— 活流与回放同判据）——
 *      标签为**块内子节点**（不入块序 / 不改 `data-blocks`），文本落笔归帧尾着装面；
 *   ③ 根子序 = [引导?] → [摘要块?] → 块序列 → [**压缩行**?] → [**消化行组**?] → [**到期触发行组**?] → [**停止痕**?] → [**台账行组**?] → [卡序列?] → [药丸?]（卡序 = 待审批 → 提问 → 计划 —— 单源 =
 *      `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条；五尾组 = 流内非块节点，族内序 = 压缩行〔R4〕→ 消化行组 → 到期触发行组 → 停止痕 → 台账行 —— 落点 = 块序列之后、
 *      卡序列之前；「对齐第三批」项 6 / 12 增停止痕与台账行组，F-置焦增置焦执行点）；块插入点 = 首个**尾组 / 卡节点**之前（`blockAnchor` 单源 —— 组在则块恒居其前 ⇒
 *      交接位置零跳；无组无卡 ⇒ `[data-pill]` 之前 · 两锚皆缺 ⇒ 末位）；本档挂载面只管审批族（提问 / 计划
 *      两族归 `renderer/mount-cards.mjs` —— 挂载零交叠，卡序判据共用一序单源）；
 *   ④ 工具卡面（三行）已拆出：`renderer/views/chat-tool.mjs`（批档 §2.3 拆分预案落形）——本档经 `toolCard` 调用；
 *      审批卡面（两形）住 `renderer/views/approval.mjs`（R1 —— 核卡工厂直取 + 端壳四件）——本档经
 *      `approvalCardNode` 调用（依赖单向：本档 → 它）；卡 = **非块节点** ⇒ 与块序列 / 药丸同层不破「DOM 块节点序 ≡ visible 逐位引用等」；
 *      接线两态沿 `renderer/views/sessions.mjs:161` 通则（handlers 给 ⇒ `onClick`；缺 ⇒ `disabled` —— 诚实非死控）；
 *   ⑤ 模型形 = `{ state, state.blocks, hidden, following, pendingNew, hasOlder, inFlight, locale, approval, guide, digest, timer,
 *      stopped, ledger, canRetry, configured, compress }`
 *      （`blocks` = 窗出口；`approval` = 本会话待决项 ⇒ 卡面；`guide` = 引导码 —— 非块节点，判据单源 = `chat-guide.mjs`；
 *      `digest` = 本键消化行切片 —— 起跑 / 终态两态，非块节点；**`compress`（R4）** = 本键压缩状态行切片 —— 单元素四态，非块节点；**「对齐第三批」四字段** = `stopped`（停止痕切片在场 ——
 *      项 6）· `ledger`（本键台账行集 —— 项 12）· `canRetry`（末 `user` 块在场 ⇒ 错误横幅重试钮在场 —— 项 9）·
 *      `configured`（provider 已配 —— 欢迎条文案二值 —— 项 15））。
 * 文案一律经 `t()`（零硬编码；`+` / `−` / 游标字形住 `renderer/chat.css`）；零 `node:` / 零裸包。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { attachCopyButtons } from "/rc/flow/stream.mjs"
import { visibleWindow } from "../store.mjs"
import { approvalCardNode } from "./approval.mjs"
// 流内压缩状态行（R4 —— 单元素四态；构树件出档 `renderer/views/compress-status.mjs`，态刷 ∕ 锚居 `chat-chrome.mjs`）。
import { compressNode } from "./compress-status.mjs"
import { MAX_RENDER_BLOCKS, compensateTop, stickToBottom, tailAction } from "./chat-scroll.mjs"
import { copyBlockNode } from "./chat-copy.mjs"
import { blockAnchor, chromeProps, digestGroupNode, ledgerGroupNode, pillNode, stoppedNode, summaryNode, syncChrome, timerGroupNode } from "./chat-chrome.mjs"
import { guideNode, guideOf } from "./chat-guide.mjs"
import { blockKey } from "./chat-stream.mjs"
import { fillSubagentEcho, subagentNode, syncSubagentEcho } from "./chat-subagent.mjs"
import { labelNode, paintSpeakerLabels, patchTextBlock, pinReasoning, pinReasoningBlocks, reasoningNode, textFace } from "./chat-text.mjs"
import { linkifyResult, toolCard, wire } from "./chat-tool.mjs"

// 帧尾态刷面出档 `renderer/views/chat-chrome.mjs`（拆分产出 —— 「对齐第三批」触碰批执行在册预案：本档越 300
// 在册、本批触碰 ⇒ 出档）；本档引调面 = 构树五件（`chromeProps` / `summaryNode` / `digestGroupNode` / `stoppedNode` /
// `ledgerGroupNode` / `pillNode`）+ 插点锚 `blockAnchor` + 帧尾态刷 `syncChrome` ⇒ 依赖单向（本档 → 出档档，无环）。

// ─── 三档之①：纯模型 ───────────────────────────────────────────────

/** 帧模型：三态 + 窗出口（`visible` / `hidden` 单源 = `renderer/store.mjs:53`）+ 四标量读数 + 待决项（卡面）
 *  + 引导码（`guide` —— 判据转调 `chat-guide.mjs` 的 `guideOf`）。
 *  `none` ⇒ `blocks` 空 ∧ `hidden` 0 ∧ `approval` 空（守 `data-blocks` = DOM 块节点数不变式 —— 不落 stale 块 / 卡）。 */
export function chatModel(state, limit = MAX_RENDER_BLOCKS) {
  const live = state?.activeSession !== null && state?.activeSession !== undefined
  const { visible, hidden } = visibleWindow(Array.isArray(state?.blocks) ? state.blocks : [], limit)
  const mode = !live ? "none" : visible.length === 0 ? "empty" : "flow"
  return {
    state: mode,
    guide: guideOf({ live, cwd: state?.project?.cwd, visible: visible.length }),
    blocks: mode === "none" ? [] : visible,
    hidden: mode === "none" ? 0 : hidden,
    following: state?.following === true,
    pendingNew: typeof state?.pendingNew === "number" ? state.pendingNew : 0,
    hasOlder: state?.history?.hasOlder === true,
    inFlight: state?.history?.inFlight === true,
    locale: state?.locale,
    approval: mode === "none" ? [] : awaitingOf(state),
    // 本键消化行切片（桌面空闲唤醒批 —— `[data-digest]` 组；非块节点）
    digest: mode === "none" ? null : digestOf(state),
    // 本键压缩状态行切片（R4 —— `[data-compress]` 单元素四态；非块节点 —— 族首）
    compress: mode === "none" ? null : compressOf(state),
    // 本键到期触发切片（timer-wake 阶段 2 —— `[data-timer]` 行组；非块节点 · 与消化行同族）
    timer: mode === "none" ? null : timerNoticeOf(state),
    // 「对齐第三批」：停止痕（项 6 —— 本键切片在场；页读整置即失）· 台账行（项 12 —— 本键行集）
    stopped: mode !== "none" && state?.stopMark?.[state.activeSession] === true,
    ledger: mode === "none" ? null : ledgerOf(state),
    // 重试钮在场判据（项 9）：可重发源在场（= 末个「`user` ∧ 文本为串」块）—— 与出口同谓词（`retrySourceOf` 单源）
    canRetry: mode !== "none" && retrySourceOf(state?.blocks) !== null,
    // 欢迎条文案二值（项 15）：provider 已配 ⇒ `welcome.textConfigured` ∥ 余（未配 / 未知）⇒ `welcome.text`
    configured: state?.settings?.configured === true,
  }
}

/** 重试源判据（项 9 单源 —— 模型在场判据与出口取文同谓词，防「可点但静默」的死控）：
 *  末个「`kind === "user"` ∧ `text` 为串」块的文本；无 ⇒ `null`（禁假造 —— 非串文本块不算可重发源）。 */
export function retrySourceOf(blocks) {
  const list = Array.isArray(blocks) ? blocks : []
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const block = list[index]
    if (block?.kind === "user" && typeof block.text === "string") return block.text
  }
  return null
}

/** 待决项（源 = `state.pool.approvals` —— 本会话切片语义）：缺 / 非数组 ⇒ 空表（**零卡** —— 禁假数据）。 */
function awaitingOf(state) {
  const list = state?.pool?.approvals
  return Array.isArray(list) ? list : []
}

/** 本键消化行切片（源 = `state.digest[活动会话键]` —— `ev:digest` 归约面写，起跑 / 终态两态；缺 / 非载体 ⇒ `null`：
 *  零组 —— 禁假造）。 */
function digestOf(state) {
  const key = state?.activeSession ?? null
  const table = state?.digest
  if (key === null || table === null || typeof table !== "object") return null
  const slice = table[key]
  return slice !== null && typeof slice === "object" ? slice : null
}

/** 本键压缩状态行切片（源 = `state.compress[活动会话键]` —— `ev:compress` 归约面写，四态就地推进；缺 / 非载体 ⇒ `null`：
 *  零行 —— 禁假造；生命期 = 首屏页读整置即失（`renderer/page-read.mjs` —— 沿 `stopMark` 先例）。 */
function compressOf(state) {
  const key = state?.activeSession ?? null
  const table = state?.compress
  if (key === null || table === null || typeof table !== "object") return null
  const slice = table[key]
  return slice !== null && typeof slice === "object" ? slice : null
}

/** 本键到期触发切片（源 = `state.timerNotice[活动会话键]` —— `ev:timer` 归约面写；缺 / 非载体 / 文本非串 ⇒ `null`：
 *  零组 —— 禁假造；生命期 = 运行期痕（首屏页读整置即失 —— 同 `[data-stopped]` 族））。 */
function timerNoticeOf(state) {
  const key = state?.activeSession ?? null
  const table = state?.timerNotice
  if (key === null || table === null || typeof table !== "object") return null
  const slice = table[key]
  return slice !== null && typeof slice === "object" && typeof slice.text === "string" ? slice : null
}

/** 本键台账行集（源 = `state.ledgerLines[活动会话键]` —— `ev:ledger` 归约面写；缺 / 非数组 / 空 ⇒ `null`：
 *  零组 —— 禁假造；单源 = 「对齐第三批」项 12 · KD-38）。 */
function ledgerOf(state) {
  const key = state?.activeSession ?? null
  const table = state?.ledgerLines
  if (key === null || table === null || typeof table !== "object") return null
  const lines = table[key]
  return Array.isArray(lines) && lines.length > 0 ? lines : null
}

/** 错误横幅（「对齐第三批」项 9 · KD-37）：`.error-text`（文面经核 `md` —— 同文本面）+ [`details.error-details`
 *  （`techInfo` 在场才落 —— `summary` + `pre` 原生折叠）] + **重试钮**（在场判据 = 末 `user` 块在场 —— 诚实面，
 *  判据源 = 模型 `canRetry`；词键 `error.retry` —— 值同 VSC）；重试出口 = 重发末 `user` 块文本（经输入区既有
 *  直发径 —— 零新通道，句柄 = `handlers.onRetry`）。两态通则沿块族（handler 缺 ⇒ 钮 `disabled`）。 */
function errorNode(block, key, handlers, withLabel, canRetry) {
  const children = [...(withLabel ? [labelNode("assistant")] : [])]
  // 文面 = 桌面 md 容器类 `block-text`（核 md 产出样式面单源 = `renderer/core.css`）+ 核横幅类 `error-text`
  children.push(textFace(block, "block-text error-text"))
  if (typeof block?.techInfo === "string" && block.techInfo !== "") {
    children.push({
      tag: "details",
      props: { class: "error-details" },
      // `summary` 字面 = 核横幅同字面（`thincoder-render-core/flow/block.mjs:138` —— 核 / VSC 两源无此词键）
      children: [{ tag: "summary", props: {}, children: ["Details"] }, { tag: "pre", props: {}, children: [block.techInfo] }],
    })
  }
  if (canRetry === true) {
    children.push({ tag: "button", props: wire({ class: "error-retry-btn", "data-action": "chat:retry" }, handlers?.onRetry), children: [t("error.retry")] })
  }
  children.push(copyBlockNode(block, key, handlers))
  return { tag: "div", props: { class: "block block-error", "data-block-id": key, "data-block-kind": "error" }, children }
}

// ─── 三档之②：纯构树（块六型 + 工具卡三行 + 三控件）─────────────────

/** 助手族块型（回合首块判据射程 —— 归档 `subagent` 块在内）。 */
const TURN_KINDS = Object.freeze(["assistant", "reasoning", "tool", "error", "subagent"])

/** 回合首块判据（**单源** · 活流 / 回放同判据 —— 「对齐第二批」项 4）：助手族块前一位块 = `user` 块 ∨ 居块序首位
 *  ⇒ 出标签；其余零标签。窗越限时块序首位的前位不可知（更早块未渲染）⇒ 零标签（禁假造 —— 不猜回合界）。 */
function turnHeadOf(kind, prev, index, hidden) {
  if (!TURN_KINDS.includes(kind)) return false
  if (index === 0 && hidden > 0) return false
  return prev === undefined || prev?.kind === "user"
}

/** 块节点（六型单序列）：文本族 = 核 Markdown 面（`textFace` —— 转义闸在核 · 原文另存 `[data-raw]`）+ 块尾复制控件
 *  （块文本空 ⇒ 零控件）；`reasoning` ⇒ 核推理块结构（`reasoningNode`）；`tool` ⇒ 工具卡三行；`subagent` ⇒
 *  归档块壳（回显 = 核件元素，帧后补装）；`withLabel` = 说话人标签容器（用户块恒出 / 助手族回合首出 ——
 *  文本落笔归帧尾着装面；标签容器为块内子节点 —— 不入块序）。 */
function blockNode(block, index, hidden, handlers, prev, canRetry = false) {
  const kind = block?.kind
  const key = blockKey(block, hidden + index)
  const label = kind === "user" || turnHeadOf(kind, prev, index, hidden)
  if (kind === "tool") return toolCard(block, key, handlers, label)
  if (kind === "reasoning") return reasoningNode(block, key, handlers, label)
  if (kind === "subagent") return subagentNode(block, key, label)
  if (kind === "error") return errorNode(block, key, handlers, label, canRetry)
  return {
    tag: "div",
    props: {
      class: `block block-${kind}`,
      "data-block-id": key,
      "data-block-kind": kind,
      "data-ts": kind === "user" && typeof block?.ts === "number" ? String(block.ts) : undefined,
      "data-streaming": kind === "assistant" && block?.streaming === true ? "1" : undefined,
    },
    children: [...(label ? [labelNode(kind === "user" ? "user" : "assistant")] : []), textFace(block), copyBlockNode(block, key, handlers)],
  }
}

/** 构树（卡族 = 核卡工厂元素直取 —— R1；审批族入树项由 `approvalCardNode` 产出**真元素**，余仍为描述符 ——
 *  `dom.mjs` `fill` 对真节点直挂 ⇒ 两形同树同序）：根 = 挂载根（props 四锚；宿主 `class` / `data-slot` 归 `renderer/index.html` 骨架）；子序 = [引导节点?] → [摘要块?] → [块序列] →
 *  [待发送块?] 不入本档（N/A）→ [审批卡?] → [药丸?] —— 四尾组（皆非块节点）居块序列之后、卡序列之前（族内序 = 消化行组 → 到期触发行组 → 停止痕 → 台账行）；`none` 帧 = 引导节点唯一子（零**块**节点 · 引导 = 非块节点 ⇒ 不入块序：`docs/desktop/design/UI.md` §1 批 B 追加注项 1）。 */
export function chatTree(model, handlers = {}) {
  const children = []
  const guide = guideNode(model, handlers)
  if (guide) children.push(guide)
  if (model.state !== "none") {
    if (model.hidden > 0) children.push(summaryNode(model, handlers))
    if (model.state === "flow") children.push(...model.blocks.map((block, index) => blockNode(block, index, model.hidden, handlers, model.blocks[index - 1], model.canRetry === true)))
    // 流内压缩状态行（R4 —— 非块节点 · 族首；在场 ⟺ 本键切片在场（四态皆在场））
    if (model.compress !== null) children.push(compressNode(model.compress))
    // 流内消化行组（非块节点 —— 块序列之后、卡序列之前；在场 ⟺ 本键切片起跑态）
    if (model.digest?.status === "start") children.push(digestGroupNode(model.digest))
    // 流内到期触发行组（非块节点 —— 块序列之后；在场 ⟺ 本键切片在场；族内序 = 消化行组 → 本组 → 停止痕）
    if (model.timer !== null) children.push(timerGroupNode(model.timer))
    // 停止痕（项 6 —— 流尾非块节点；族内序 = 消化行组 → 停止痕 → 台账行）
    if (model.stopped === true) children.push(stoppedNode())
    // 台账行组（项 12 —— 流尾非块节点组；行集源 = 本键切片）
    if (Array.isArray(model.ledger) && model.ledger.length > 0) children.push(ledgerGroupNode(model.ledger))
    children.push(...model.approval.map((item) => approvalCardNode(item, handlers)))
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

/** 代码块复制钮挂点（核件 `attachCopyButtons` —— 真代码块面随核落：围栏切分 / 语言高亮 / **代码块级复制**；
 *  KD-22 两控件（块级 / 末条）口径不变 ⇒ 三控件并存）：根内逐 `pre.code-block` 补按钮（**已挂着跳过** ⇒ 幂等）；
 *  `t` 注入 = 桌面词表（核件 `deps.t`；词键 `msg.copy` / `msg.copied` = **端供给面**——核 dict 无此两键，
 *  值住 `renderer/i18n.mjs` 宿主表，词值同 VSC 同键）；钮定位住 `renderer/core.css`（`position: absolute`
 *  ⇒ 不入高度读数 ⇒ 补偿算式零扰）。 */
function attachCodeCopies(root) {
  attachCopyButtons(root, { t })
}

/** 新块节点着装（帧尾尾段挂载 / 重建 / 前插三径内 —— **先于读数 `t0` / `t1`** ⇒ 高度计入本帧尾 / 头侧）：
 *  说话人标签落笔（项 4）+ 归档块核件回显补装（项 5）+ 推理块首帧钉底（项 1）+ 工具卡结果区链接着装（相抵②）。 */
function dressNode(node, block) {
  paintSpeakerLabels(node)
  fillSubagentEcho(node, block)
  if (block?.kind === "reasoning") pinReasoning(node)
  if (block?.kind === "tool") linkifyResult(node, block)
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
  syncSubagentEcho(root, model)
  paintSpeakerLabels(root)
  // 重挂径推理块同「新建即落底」（尾段三径归 `dressNode`）
  pinReasoningBlocks(root)
  attachCodeCopies(root)
  const mounted = mountedOf(root, model.blocks)
  // 工具卡结果区链接着装（相抵② 渲染半 —— 重挂径全根逐块；尾段三径归 `dressNode`）
  for (const item of mounted) if (item.block?.kind === "tool") linkifyResult(item.node, item.block)
  return { model, mounted }
}

/** 尾段挂载（帧尾第 ① 步 · 先于读数）：逐枚建块 ⇒ 插点 = `blockAnchor`；新建即着装（标签 / 归档回显 / 推理钉底 ——
 *  先于 `t0` ⇒ 高度计入本帧尾侧）。 */
function mountTail(root, model, plan, handlers) {
  const start = model.blocks.length - plan.tail.length
  const anchor = blockAnchor(root)
  plan.tail.forEach((block, step) => {
    const index = start + step
    const node = build(blockNode(block, index, model.hidden, handlers, model.blocks[index - 1], model.canRetry === true))
    root.insertBefore(node, anchor)
    dressNode(node, block)
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
    const fresh = build(blockNode(block, index, model.hidden, handlers, model.blocks[index - 1], model.canRetry === true))
    node.replaceWith(fresh)
    dressNode(fresh, block)
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
    const block = model.blocks[index]
    const node = build(blockNode(block, index, model.hidden, handlers, model.blocks[index - 1], model.canRetry === true))
    root.insertBefore(node, anchor)
    // 前插 = 头侧 ⇒ 着装先于 `t1`（高度入补偿算式）
    dressNode(node, block)
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
  // 尾段 / 就地更新两径新出的代码块补钮（六步后 —— 钮绝对定位 ⇒ 不入高度读数）
  attachCodeCopies(root)
  return mountedOf(root, model.blocks)
}
