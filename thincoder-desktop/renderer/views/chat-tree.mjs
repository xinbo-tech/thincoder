/**
 * chat-tree.mjs — 对话流**构树面**出档（拆分产出 —— `docs/desktop/design/PROJECT.md` §4.1 越层段：`renderer/views/chat.mjs`
 * **305** 越 300、`docs/desktop/design/PROJECT.md` §4.2 本批行判「结构性触碰」（重建径按记录位次复列——树装配面参与）
 * ⇒ 拆分预案**构树面出档**随本批执行；原三件（`TURN_KINDS` / `turnHeadOf` / `errorNode` / `blockNode` / `chatTree`）
 * 自 `renderer/views/chat.mjs` **纯搬移**，增量 = **流序复列**（留档批 · #719 —— 恢复序 ≡ 记录序；**复列全量（未结轮照现）**——
 * 自然形收正批 · 2026-10-01 · 台账 #768；消化重放口径批 · 2026-10-01 · 台账 #771 收正）：
 * 重建径块序列 ∥ 消化轮按**记录位次**（`at`）复列 —— 有 `at` 的轮插于首位位次更大的块之前；无位次件
 * （运行期轮 ∥ 运行期块）落运行期尾段（轮恒居块后 —— 「流末插本元素」同序）。
 * **本批 2026-10-01 · #765**：配对支拆除（归档块 = **普通块** —— 记录位次原位出，补发到达序自洽：
 * `subagent` 记录居起跑记录之后 ⇒ [行族][归档块]）；行元素出序 = `digestRows` 逐行（无轮容器）。
 * **自然形收正批 · 2026-10-01 · #768**：行族 = **全轮在流**（行出即留——本档只按记录序复列，零清理动作；单源 = §1.1
 * 「消化行入流与重放规则」条）。
 * 机制 ∕ 判据单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条 ∥ 根子序句（重建径 = 按记录位次复列）。
 * 视图面纪律（同档 §1.1）：纯构树（零 DOM / 零 `node:` / 零裸包 —— 渲染面静态闭包判据）；文案一律经 `t()`。
 * 依赖单向：`renderer/views/chat.mjs` → 本档（`mountChat` 建树引调）；反向无引用 ⇒ 无环。
 */
import { t } from "../i18n.mjs"
import { toolCard, wire } from "./chat-tool.mjs"
import { approvalCardNode } from "./approval.mjs"
import { compressNode } from "./compress-status.mjs"
import { labelNode, reasoningNode, textFace } from "./chat-text.mjs"
import { blockKey } from "./chat-stream.mjs"
import { subagentNode } from "./chat-subagent.mjs"
import { digestRows, roundAt } from "./chat-digest-rows.mjs"
import { guideNode } from "./chat-guide.mjs"
import { chromeProps, helpGroupNode, pillNode, stoppedNode, summaryNode, timerGroupNode } from "./chat-chrome.mjs"

/** 助手族块型（回合首块判据射程 —— 归档 `subagent` 块在内）。 */
const TURN_KINDS = Object.freeze(["assistant", "reasoning", "tool", "error", "subagent"])

/** 回合首块判据（**单源** · 活流 / 回放同判据 —— 「对齐第二批」项 4）：助手族块前一位块 = `user` 块 ∨ 居块序首位
 *  ⇒ 出标签；其余零标签。窗越限时块序首位的前位不可知（更早块未渲染）⇒ 零标签（禁假造 —— 不猜回合界）。 */
function turnHeadOf(kind, prev, index, hidden) {
  if (!TURN_KINDS.includes(kind)) return false
  if (index === 0 && hidden > 0) return false
  return prev === undefined || prev?.kind === "user"
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
  return { tag: "div", props: { class: "block block-error", "data-block-id": key, "data-block-kind": "error" }, children }
}

/** 块节点（六型单序列）：文本族 = 核 Markdown 面（`textFace` —— 转义闸在核 · 原文另存 `[data-raw]`）；
 *  `reasoning` ⇒ 核推理块结构（`reasoningNode`）；`tool` ⇒ 工具卡三行；`subagent` ⇒
 *  归档块壳（回显 = 核件元素，帧后补装）；`withLabel` = 说话人标签容器（用户块恒出 / 助手族回合首出 ——
 *  文本落笔归帧尾着装面；标签容器为块内子节点 —— 不入块序）。 */
export function blockNode(block, index, hidden, handlers, prev, canRetry = false) {
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
    children: [...(label ? [labelNode(kind === "user" ? "user" : "assistant")] : []), textFace(block)],
  }
}

/** 流序复列（**重建径 · 留档批 · #719 —— 按记录位次复列**；恢复序 ≡ 记录序 —— 本批 2026-10-01 · #765 收正：
 *  配对支拆除；**复列全量（未结轮照现）**——自然形收正批 · 2026-10-01；消化重放口径批 · 2026-10-01 收正）：块序列逐枚走过，位次轮（`at` 非空）插于
 *  **首位位次更大的已标块**之前（未标块位次未知 ⇒
 *  不作锚）；余位次轮 ∥ 运行期轮（无位次）居块序列之后（模型序 —— 与活流「`start` 帧落流末」同序、
 *  与 §1.1 根子序「块序列 → 消化行族」同向）；归档块 = **普通块**（原位 = 记录位次 —— 补发到达序自洽：
 *  归档记录居起跑记录之后 ⇒ [行族][归档块]）。 */
function pushFlow(children, model, handlers) {
  const blocks = Array.isArray(model?.blocks) ? model.blocks : []
  // 在区轮集（窗判据就地两行）：位次轮 `at ≥ 首枚已标块位次` ∥ 运行期轮恒在场 ∥ 下界未知 ⇒ 在场
  let floor = null
  for (const block of blocks) {
    if (typeof block?.at === "number" && Number.isFinite(block.at)) { floor = block.at; break }
  }
  const rounds = (Array.isArray(model?.digest) ? model.digest : []).filter((round) => {
    const at = roundAt(round)
    return at === null || floor === null || at >= floor
  })
  const atOf = (block) => (typeof block?.at === "number" && Number.isFinite(block.at) ? block.at : null)
  let cursor = 0
  const flush = (bound) => {
    while (cursor < rounds.length) {
      const at = roundAt(rounds[cursor])
      if (at === null || bound === null || at >= bound) break
      children.push(...digestRows(rounds[cursor])) // 重建轮于其记录位次复列
      cursor += 1
    }
  }
  blocks.forEach((block, index) => {
    flush(atOf(block))
    children.push(blockNode(block, index, model.hidden, handlers, blocks[index - 1], model.canRetry === true))
  })
  while (cursor < rounds.length) {
    children.push(...digestRows(rounds[cursor])) // 未结轮 ∥ 余轮 = 流末（运行期尾段）
    cursor += 1
  }
}

/** 构树（卡族 = 核卡工厂元素直取 —— R1；审批族入树项由 `approvalCardNode` 产出**真元素**，余仍为描述符 ——
 *  `dom.mjs` `fill` 对真节点直挂 ⇒ 两形同树同序）：根 = 挂载根（props 四锚；宿主 `class` / `data-slot` 归 `renderer/index.html` 骨架）；子序 = [引导节点?] → [摘要块?] →
 *  [流序（块序列 × 消化轮按记录位次复列 —— 恢复序 ≡ 记录序 · 零配对〔本批 #765〕）?] → [压缩行?]〔R4 —— 流元素冻结点、非尾组成员，另列〕→ [尾组?] → [审批卡?] → [药丸?] —— 尾组（皆非块节点）居流序之后、卡序列之前（族内序 = 消化行族 → 到期触发行组 → 停止痕 → 帮助行族）；`none` 帧 = 引导节点唯一子（零**块**节点 · 引导 = 非块节点 ⇒ 不入块序：`docs/desktop/design/UI.md` §1 批 B 追加注项 1）。 */
export function chatTree(model, handlers = {}) {
  const children = []
  const guide = guideNode(model, handlers)
  if (guide) children.push(guide)
  if (model.state !== "none") {
    if (model.hidden > 0) children.push(summaryNode(model, handlers))
    pushFlow(children, model, handlers)
    // 流内压缩状态行（R4 —— 非块节点 · 族首 · 流元素冻结点（创建点定位 —— 新块随流居其下）；在场 ⟺ 本键切片在场（四态皆在场））
    if (model.compress !== null) children.push(compressNode(model.compress))
    // 流内到期触发行组（非块节点 —— 流序之后；在场 ⟺ 本键切片在场；族内序 = 消化行族 → 本组 → 停止痕）
    if (model.timer !== null) children.push(timerGroupNode(model.timer))
    // 停止痕（项 6 —— 流尾非块节点；族内序 = 消化行族 → 停止痕）
    if (model.stopped === true) children.push(stoppedNode())
    // 帮助行族（`/help` 增量 · 2026-10-01② —— 流内非块行族；族内序 = 停止痕 → 本族 → 卡序列）
    if (Array.isArray(model.help) && model.help.length > 0) children.push(helpGroupNode(model.help))
    children.push(...model.approval.map((item) => approvalCardNode(item, handlers)))
    if (!model.following) children.push(pillNode(model, handlers))
  }
  return { tag: "div", props: chromeProps(model), children }
}
