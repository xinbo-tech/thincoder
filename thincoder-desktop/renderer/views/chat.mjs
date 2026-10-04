/**
 * chat.mjs — 对话流视图面（`docs/desktop/design/RENDERER.md` §1.1 / §2 / §3 · `docs/desktop/design/UI.md` §1 对话流行）。
 * 三档沿 RENDERER.md §1.1：`chatModel`（纯模型 · 窗出口 —— 更新纪律收核批出档 `renderer/views/chat-model.mjs`）→
 * `chatTree`（纯构树 · 机检面 —— **构树面出档 `renderer/views/chat-tree.mjs`**：留档批 · #719 拆分预案执行，
 * 含重建径**按记录位次复列**）→ `mountChat`（薄挂载 = 本档唯一清空 / 建树处）；
 * DOM 面另两件 = 帧尾态刷 `syncChrome`（根锚四 + 摘要块 + 审批卡 + 药丸 + **消化行族** + **到期触发行组** +
 * **停止痕** + **台账行组** + **真置焦执行** · 幂等 · 无帧豁免）· 帧尾六步 `settleFrame`（**读数按动数裁剪** ·
 * `mountedOf` 记账直取 —— 更新纪律收核批；**尾段步**（步①）= 行族出生 ∥ 刷项就地 ∥ 造项（尾段 ∥ 中洞）∥ 退流摘 —— 到达序 · 先于读数）。
 * **卡面态刷**住 `renderer/views/chat-cards.mjs`（R3c 拆档 —— 在册预案 = 卡构树拆出；本档经 `syncCards` 调用）；
 * **排队期「待发送块」不在本档**（收正轮 B12 新口径 —— 住**输入行上方带**，硬验收 = 与输入面板恒定邻接；
 * 消费前流内零真块，交付时刻 `ev:queue` 消费回执才入流）；
 * **消化行族**（`[data-digest]` —— **全轮行族 · 流内就地**〔**无轮容器**：行元素 = 流内并列兄弟——#747〕）行集 ∕ 帧刷住
 * `renderer/views/chat-digest-rows.mjs`（**自然形收正批 · 2026-10-01**：到达序出生 ∥ 行出生即定型（终态 = 追加新行——零就地换文）
 * ∥ 零清理（行出即留）；归档块 = **普通块**（随到达入流——行族出生先于同帧补发块）；行族出生归帧尾入流步）；
 * **留档批 · #719**：行入流（与内容同生态）；复列 ∥ 回填径按记录位次**复列全量（未结轮照现）**（构树面 `chat-tree.mjs`；消化重放口径批 · 2026-10-01 收正）；元素 = **流内普通项** —— 不占块序 ∥ 不计 `data-blocks`）；
 * **到期触发行组**（`[data-timer]` —— timer-wake 阶段 2）：非块节点组 · 在场 ⟺ 本键 `timerNotice` 切片在场，
 * 构树 ∕ 帧尾同刷住 `renderer/views/chat-chrome.mjs`（与消化行族同族）；
 * **归档子 agent 块**住 `renderer/views/chat-subagent.mjs`（项 5 新档 —— 壳构树 + 核件回显补装）；
 * 工具卡面与折叠纯函数 `toggleExpanded` 住 `renderer/views/chat-tool.mjs`（§2.3 拆分预案落形 —— 依赖单向：本档 → 它）；**文本面（核 Markdown 呈现）+ 推理块 + 就地更新 + 说话人标签**住 `renderer/views/chat-text.mjs`（R3c · D19；项 1 / 4 增推理画笔分流 + 标签落笔，复制面对齐批迁入 `blockTextOf` —— 依赖单向：本档 → 它）；首启空白态引导面（判据
 * `guideOf` + 构树 `guideNode` + 帧尾只摘态刷 `syncGuide`）住 `renderer/views/chat-guide.mjs`（UI.md §1「批 B 追加注」项 1 —— 依赖单向：本档 → 它）。
 *   ① 三态 `data-state`：无活动会话 ⇒ `none`（零**块**节点 + 引导节点——禁假数据）· 有会话零块 ⇒ `empty`
 *      （引导节点 · `chat.empty.hint`）· 否则 `flow`；
 *   ② 块六型（`user` / `assistant` / `reasoning` / `tool` / `error` 五项页读域 + **留档块** `subagent` —— 归档入流块，
 *      单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 5 ∥ 留档批 · #719）单序列；块键单源 = `blockKey`（`data-block-id` /
 *      增量缝合 / toggle 同域）；兜底键用**全列表位序**（`hidden + i`）⇒ 窗滑动不改键；文本族块面 = **经核 Markdown**
 *      呈现（KD-RC-4 · R3c —— 单源 = `renderer/views/chat-text.mjs`；转义闸在核；原文逐字另存 `[data-raw]` 锚——就地更新判据面）；
 *      **说话人标签**（项 4）：用户块恒出 / 助手族块回合首出（判据 = `turnHeadOf` 单源 —— 活流与回放同判据）——
 *      标签为**块内子节点**（不入块序 / 不改 `data-blocks`），文本落笔归帧尾着装面；
 *   ③ 根子序 = [引导?] → [摘要块?] → **流序**（块序列 × 消化轮**按记录位次复列** —— 恢复序 ≡ 记录序 · 零配对〔本批 #765〕；位次件无 ⇒ 退化为
 *      块序列 → 轮序列）→ [**压缩行**?] → [**到期触发行组**?] → [**停止痕**?] → [**台账行组**?] → [卡序列?] → [药丸?]（卡序 = 待审批 → 提问 → 计划 —— 单源 =
 *      `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条；**四尾组** = 流内非块节点，族内序 = 消化行族 → 到期触发行组 → 停止痕 → 台账行 —— 落点 = 流序之后、卡序列之前（**压缩行例外 = 流元素冻结点** —— 创建点定位后新块随流居其下，块插入点不收本行）；「对齐第三批」项 6 / 12 增停止痕与台账行组，F-置焦增置焦执行点）；
 *      **活流序 = 就地**（消化行族行元素逐轮落流末、随流滚动；归档块 = **普通块**（随到达入流——本批 #765）；常规新块随流居行族之下；块插入点 = 首个**尾组（压缩行 ∕ 消化行族除外）∕ 卡节点**之前（`blockAnchor` 单源 —— 尾组在则块恒居其前 ⇒
 *      交接位置零跳；无组无卡 ⇒ `[data-pill]` 之前 · 两锚皆缺 ⇒ 末位）；本档挂载面只管审批族（提问 / 计划
 *      两族归 `renderer/mount-cards.mjs` —— 挂载零交叠，卡序判据共用一序单源）；
 *   ④ 工具卡面（三行）已拆出：`renderer/views/chat-tool.mjs`（批档 §2.3 拆分预案落形）——构树面经 `toolCard` 调用；
 *      审批卡面（两形）住 `renderer/views/approval.mjs`（R1 —— 核卡工厂直取 + 端壳四件）；卡 = **非块节点** ⇒ 与块序列 / 药丸同层不破「DOM 块节点序 ≡ visible 逐位引用等」；
 *      接线两态沿 `renderer/views/chat-tool.mjs` 通则（handlers 给 ⇒ `onClick`；缺 ⇒ `disabled` —— 诚实非死控）；
 *   ⑤ 模型形 = `{ state, state.blocks, hidden, following, pendingNew, hasOlder, inFlight, locale, approval, guide, digest, timer,
 *      stopped, ledger, canRetry, configured, compress }`
 *      （`blocks` = 窗出口；`approval` = 本会话待决项 ⇒ 卡面；`guide` = 引导码 —— 非块节点，判据单源 = `chat-guide.mjs`；
 *      `digest` = 本键消化轮集（**全轮累积** —— 切片 = […旧轮, 本轮]；每轮起跑 ∕ cap ∕ 终态三态；流内普通项（行出即留）；
 *      **`compress`（R4）** = 本键压缩状态行切片 —— 单元素四态，非块节点；**「对齐第三批」四字段** = `stopped`（停止痕切片在场 ——
 *      项 6）· `ledger`（本键台账行集 —— 项 12）· `canRetry`（末 `user` 块在场 ⇒ 错误横幅重试钮在场 —— 项 9）·
 *      `configured`（provider 已配 —— 欢迎条文案二值 —— 项 15））。
 * 文案一律经 `t()`（零硬编码；`+` / `−` / 游标字形住 `renderer/chat.css`）；零 `node:` / 零裸包。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
// 快照族（波 1 产物 —— #606④ 重挂保真：滚位 ∕ 域内焦点复填）
import { captureView, restoreView } from "../view-state.mjs"
import { attachCopyButtons } from "/rc/flow/stream.mjs"
import { MAX_RENDER_BLOCKS, compensateTop, stickToBottom, tailAction } from "./chat-scroll.mjs"
import { chatModel } from "./chat-model.mjs"
import { blockAnchor, syncChrome } from "./chat-chrome.mjs"
// 构树面出档（留档批 · #719 拆分预案执行 —— 原 `errorNode` / `blockNode` / `chatTree` 迁入；重建径按记录位次复列）。
import { blockNode, chatTree } from "./chat-tree.mjs"
export { chatTree } // 保名面（旧 import 面零改 —— 沿 `chat-chrome.mjs` 再出口先例）
// 消化行族（单档 `renderer/views/chat-digest-rows.mjs` —— 帧刷一键；入流步（出生 ∕ 换代）亦引本件）。
import { syncDigest } from "./chat-digest-rows.mjs"
import { blockKey, flowStep } from "./chat-stream.mjs"
import { fillSubagentEcho, applyEchoOpen, echoOpenSet, syncSubagentEcho } from "./chat-subagent.mjs"
import { paintSpeakerLabels, patchTextBlock, pinReasoning, pinReasoningBlocks } from "./chat-text.mjs"
// 巨块分段挂载窗（E4-JS 支 —— 初窗 ∥ 重挂转移 ∥ 帧尾第 ⑦ 步；机制 ∕ 参数单源 = 批档 §2.15）
import { captureSegmentWindows, mountSegmentWindows, mountSegments, segmentViewStep } from "./chat-text-segments.mjs"
import { linkifyResult, patchToolCard } from "./chat-tool.mjs"

// 帧尾态刷面出档 `renderer/views/chat-chrome.mjs`（拆分产出 —— 「对齐第三批」触碰批执行在册预案：本档越 300
// 在册、本批触碰 ⇒ 出档）；构树面出档 `renderer/views/chat-tree.mjs`（留档批 · #719 拆分执行 —— 本档越 300 结构性
// 触碰）。本档引调面 = 帧尾态刷 `syncChrome` + 插点锚 `blockAnchor` + 帧刷 `syncDigest`（本批 2026-10-01 —— 旧边界设施引调随拆净）。
// ⇒ 依赖单向（本档 → 三出档档，无环）。

// ─── 三档之③：薄挂载 + DOM 面两件 ────────────────────────────────

/** DOM 块节点序 ⇒ 记账形（`{ node, block }`）：DOM ≡ `visible` 不变式下的逐位配对（帧层下帧输入）。 */
function mountedOf(root, blocks) {
  const nodes = typeof root?.querySelectorAll === "function" ? [...root.querySelectorAll("[data-block-kind]")] : []
  return nodes.map((node, index) => ({ node, block: blocks[index] }))
}

/** 代码块复制钮挂点（核件 `attachCopyButtons` —— 真代码块面随核落：围栏切分 / 语言高亮 / **代码块级复制**；
 *  KD-22 收正（复制面对齐批）：自建两控件退场 ⇒ 核件代码块 Copy 钮 = **复制面唯一**）：根内逐 `pre.code-block`
 *  补按钮（**已挂着跳过** ⇒ 幂等）；`t` 注入 = 桌面词表（核件 `deps.t`；词键 `msg.copy` / `msg.copied` = **端供给面** ——
 *  核 dict 无此两键，值住 `renderer/i18n.mjs` 宿主表，词值同 VSC 同键）；钮定位住 `renderer/core.css`
 *  （`position: absolute` ⇒ 不入高度读数 ⇒ 补偿算式零扰）。 */
function attachCodeCopies(root) {
  attachCopyButtons(root, { t })
}

/** 新块节点着装（帧尾尾段挂载 / 重建 / 前插三径内 —— **先于读数 `t0` / `t1`** ⇒ 高度计入本帧尾 / 头侧）：
 *  **巨块初窗（E4-JS —— 首步：先于一切读数）** + 说话人标签落笔（项 4）+ 归档块核件回显补装（项 5）
 *  + 推理块首帧钉底（项 1）+ 工具卡结果区链接着装（相抵②）+ **代码块复制钮（gating —— 逐新节点，禁帧级全根扫）**。 */
function dressNode(node, block, following = false) {
  mountSegments(node, block, following)
  paintSpeakerLabels(node)
  fillSubagentEcho(node, block)
  if (block?.kind === "reasoning") pinReasoning(node)
  if (block?.kind === "tool") linkifyResult(node, block)
  attachCodeCopies(node)
}

/** 薄挂载（本档唯一清空 / 建树处）：根描述符四锚复制到宿主（**保留** `data-slot`）⇒ `clear` ⇒ 子节点入位。
 *  返回 `{ model, mounted }`；容器缺位 ⇒ 模型照给、零节点（非重挂帧的对齐输入 = 空序）。
 *  **#606④ 重挂保真**：重建前捕快照（滚位 ∕ 域内焦点）+ 归档块展开集 ⇒ 重建后展开集复填（高度先落）、快照复填。
 *  **留档批 · #719**：树已按记录位次复列（`chat-tree.mjs` —— 重建轮记录位次 ∥ 未结轮流末）；行族随树同出（零采纳步——本批 #765）。 */
export function mountChat(root, state, handlers = {}, limit = MAX_RENDER_BLOCKS) {
  const model = chatModel(state, limit)
  if (!root || typeof root.setAttribute !== "function") return { model, mounted: [] }
  const snap = captureView(root)
  const openSet = echoOpenSet(root)
  const segWindows = captureSegmentWindows(root) // 重挂转移：先捕旧账（后建新树）
  const tree = build(chatTree(model, handlers))
  for (const name of tree.getAttributeNames()) root.setAttribute(name, tree.getAttribute(name))
  clear(root)
  for (const child of [...tree.childNodes]) root.append(child)
  mountSegmentWindows(root, model, segWindows) // 批量初窗 + 重挂转移复填（先于一切读数步）
  syncSubagentEcho(root, model)
  applyEchoOpen(root, openSet) // 展开集复填（高度先落 —— 先于滚位复填）
  paintSpeakerLabels(root)
  // 重挂径推理块同「新建即落底」（尾段三径归 `dressNode`）
  pinReasoningBlocks(root)
  attachCodeCopies(root)
  restoreView(root, snap) // 滚位末写（域内焦点同复填）
  if (model.following === true) stickToBottom(root) // 跟滚 ⇒ 贴底覆盖（与帧尾三写同律）
  const mounted = mountedOf(root, model.blocks)
  // 工具卡结果区链接着装（相抵② 渲染半 —— 重挂径全根逐块；尾段三径归 `dressNode`）
  for (const item of mounted) if (item.block?.kind === "tool") linkifyResult(item.node, item.block)
  return { model, mounted }
}

/** 造项挂载（尾段 ∥ 中洞 ∥ 头段同点 · 先于其所在侧的读数 —— 新建即着装：巨块初窗 / 说话人标签 / 归档回显 /
 *  推理钉底）：位次 = 窗位（`item.index`）；插点 = `item.before`（其后首账项）—— 缺 ⇒ 尾插点 `blockAnchor`。 */
function mountItem(root, model, handlers, item) {
  const node = build(blockNode(item.block, item.index, model.hidden, handlers, model.blocks[item.index - 1], model.canRetry === true))
  root.insertBefore(node, item.before === null ? blockAnchor(root) : item.before.node)
  dressNode(node, item.block, model.following === true)
}

/** 流式锚同刷（就地更新面）：`assistant` ∧ `streaming` ⇒ 落 `data-streaming`，否则摘（残锚不留）。 */
function setStreaming(node, on) {
  if (on) node.setAttribute("data-streaming", "1")
  else node.removeAttribute?.("data-streaming")
}

/** 就地更新一项（结算步**刷项** —— 留位且块对象变者 · 先于其所在侧的读数）：kind 变（tool ⇄ 文本族 ⇄ 他型）⇒
 *  单块节点换（节点形变非就地可改；节点换形时调用面据此更新账项引用）；`tool` 卡 ⇒ 就地更新
 *  （`patchToolCard` —— 头行分段刷 + 结果区 O(1) 追加，**节点身份不变** —— #605 消）；文本族 ⇒ `patchTextBlock`
 *  + 流式锚同刷 + 重渲帧补代码块复制钮（gating —— 逐节点，禁帧级全根扫）；非命中项零触碰。 */
function refreshNode(node, block, index, model, handlers) {
  if (!node || !block) return node
  if (node.getAttribute?.("data-block-kind") !== block.kind) {
    const fresh = build(blockNode(block, index, model.hidden, handlers, model.blocks[index - 1], model.canRetry === true))
    node.replaceWith(fresh)
    dressNode(fresh, block, model.following === true)
    return fresh
  }
  if (block.kind === "tool") {
    patchToolCard(node, block, blockKey(block, model.hidden + index), handlers)
    return node
  }
  const face = typeof node.querySelector === "function" ? node.querySelector("[data-raw]") : null
  const before = face !== null && typeof face.getAttribute === "function" ? face.getAttribute("data-raw") : null
  patchTextBlock(node, block, blockKey(block, model.hidden + index), handlers)
  if (before !== null && face.getAttribute("data-raw") !== before) attachCodeCopies(node)
  setStreaming(node, block.kind === "assistant" && block.streaming === true)
  return node
}

/** 帧尾六步（非构造帧 · 判据面 = `docs/desktop/design/RENDERER.md` §1.1「流面结算步」条 ∥ §3 帧尾滚动作 ——
 *  **读数按动数裁剪**：跟滚帧零读（贴底 = 写超值）· 非跟滚 ∧ 头段动数（摘 + 前插）> 0（补偿径）才读
 *  `t0` ∕ `t1`）：
 *  ① **尾段步**（行族出生 ∥ 刷项就地 ∥ 退流摘 ∥ 尾段 ∥ 中洞造项 —— 皆先于读数）
 *  ② 读数 `t0` ③ `syncChrome` ④ **头段步**（越位摘 + 前插按数 —— 高度入 [t0, t1]）⑤ 读数 `t1`
 *  ⑥ 帧尾三写（贴底 / 补偿算式 / 零写）⑦ 巨块段窗步（六步之后 —— 独立显式补偿）。
 *  `account` = 账（`{ mounted, hidden, ops }` —— `mounted` = 上帧 DOM 块节点序记账 · `ops` = 本帧作业单）；
 *  返回新账（由 DOM 重列 —— 下帧输入）。 */
export function settleFrame(root, model, scroll, handlers = {}, account = null) {
  if (!root || typeof root.querySelector !== "function") return []
  const plan = flowStep({ account, model, ops: account?.ops ?? [] })
  syncDigest(root, model, blockAnchor(root)) // 步①首：行族出生（**唯追加**——到达序；先于造项）
  for (const item of plan.refresh) {
    const fresh = refreshNode(item.entry.node, item.block, item.index, model, handlers)
    if (fresh !== item.entry.node) item.entry.node = fresh // 型变换节点：账项引用随换（后续插点直取同项）
  }
  for (const entry of plan.drop) entry.node.remove() // 步①续：退流摘（作业命中 —— 按位）
  for (const item of plan.build) mountItem(root, model, handlers, item) // 步①续：尾段追加 ∥ 中洞就位
  const readMetrics = () => (typeof scroll?.readMetrics === "function" ? scroll.readMetrics() : {
    scrollTop: Number.isFinite(root.scrollTop) ? root.scrollTop : 0,
    scrollHeight: Number.isFinite(root.scrollHeight) ? root.scrollHeight : 0,
    clientHeight: Number.isFinite(root.clientHeight) ? root.clientHeight : 0,
  })
  // 读数裁剪：头段动数先于读数确定（每项各自判定 ⇒ 预判 = 实动数）；行族出生居尾段步（先于读数）
  const moves = plan.head.drop.length + plan.head.build.length
  const t0 = model.following === true || moves === 0 ? null : readMetrics()
  syncChrome(root, model, handlers) // 步③
  for (const entry of plan.head.drop) entry.node.remove() // 步④：头段越位摘（按数）
  for (const item of plan.head.build) mountItem(root, model, handlers, item) // 步④：头段前插（按数）
  const writing = tailAction({ following: model.following, headMoves: moves })
  if (writing === "stick") stickToBottom(root)
  else if (writing === "compensate") {
    const t1 = readMetrics()
    root.scrollTop = compensateTop({ prevTop: t0.scrollTop, prevHeight: t0.scrollHeight, nextHeight: t1.scrollHeight })
  }
  segmentViewStep(root, model, account?.mounted ?? []) // 步⑦（六步之后 —— 巨块段窗：独立显式补偿）
  return mountedOf(root, model.blocks)
}
