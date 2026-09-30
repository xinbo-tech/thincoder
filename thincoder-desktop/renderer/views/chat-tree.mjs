/**
 * chat-tree.mjs — 对话流**构树面**出档（拆分产出 —— `docs/desktop/design/PROJECT.md` §4.1 越层段：`renderer/views/chat.mjs`
 * **305** 越 300、`docs/desktop/design/PROJECT.md` §4.2 本批行判「结构性触碰」（重建径按记录位次复列——树装配面参与）
 * ⇒ 拆分预案**构树面出档**随本批执行；原三件（`TURN_KINDS` / `turnHeadOf` / `errorNode` / `blockNode` / `chatTree`）
 * 自 `renderer/views/chat.mjs` **纯搬移**，本批增量 = **流序复列**（留档批 · #719）：
 * 重建径块序列 ∥ 消化轮按**记录位次**（`at`）复列 —— 有 `at` 的轮插于首位位次更大的块之前；无位次件
 * （运行期轮 ∥ 运行期块）落运行期尾段（轮恒居块后 —— 「流末插本元素」同序）。
 * **三端消化面统一批 · #747 增量** = **消费轮配对**（复列镜式）：`subagent` 记录居其消费轮行族之前（配对单源 =
 * `consumedRoundOf` —— `views/chat-digest.mjs`；与页读块序重排同判）+ 行元素出序（无轮容器 —— `digestRows` 逐行）。
 * 机制 ∕ 判据单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条 ∥ 根子序句（重建径 = 按记录位次复列 + 消费轮配对）。
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
import { consumedRoundOf, digestRows, roundAt, shownDigestRounds } from "./chat-digest.mjs"
import { guideNode } from "./chat-guide.mjs"
import { chromeProps, ledgerGroupNode, pillNode, stoppedNode, summaryNode, timerGroupNode } from "./chat-chrome.mjs"

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

/** 流序复列（**重建径 · 留档批 · #719 —— 按记录位次复列 + 消费轮配对**〔#747〕）：块序列逐枚走过，
 *  位次轮（`at` 非空）插于**首位位次更大的已标块**之前（修复轮 · #738：**未标块不作锚**——位次未知不落
 *  其前；原「位次轮恒居运行期块之前」在长会话窗把座位漂到中段）；**归档块配对**（复列镜式）= `subagent`
 *  记录按其消费轮（记录落于该轮 [start, end] 之后且中无块记录者——即消化回收落点）居该轮行族之前
 *  （对位 VSC #726「落点镜式」；跨页无本轮 ∥ 无配对 ⇒ 原位即记录位次）；余位次轮 ∥ 运行期轮（无位次）居
 *  块序列之后（模型序 —— 与活流「`start` 帧落流末」同序、与 §1.1 根子序「块序列 → 消化行族」同向）。 */
function pushFlow(children, model, handlers) {
  const rounds = shownDigestRounds(model)
  const atOf = (block) => (typeof block?.at === "number" && Number.isFinite(block.at) ? block.at : null)
  const paired = new Set() // 配对块位序（随其消费轮族出——不随记录位次）
  const pairsOf = new Map() // 轮对象 → 配对块序[]
  model.blocks.forEach((block, index) => {
    if (block?.kind !== "subagent") return
    const round = consumedRoundOf(block, model.blocks, rounds) // 复列镜式（消费轮配对——单源）
    if (round === null) return
    paired.add(index)
    const list = pairsOf.get(round)
    if (list === undefined) pairsOf.set(round, [index])
    else list.push(index)
  })
  const emitRound = (round) => {
    for (const index of pairsOf.get(round) ?? []) {
      children.push(blockNode(model.blocks[index], index, model.hidden, handlers, model.blocks[index - 1], model.canRetry === true))
    }
    children.push(...digestRows(round))
  }
  let cursor = 0
  const flush = (bound) => {
    while (cursor < rounds.length) {
      const at = roundAt(rounds[cursor])
      if (at === null || bound === null || at >= bound) break
      emitRound(rounds[cursor])
      cursor += 1
    }
  }
  model.blocks.forEach((block, index) => {
    if (paired.has(index)) return // 配对块随其消费轮族出（先于行族）
    flush(atOf(block))
    children.push(blockNode(block, index, model.hidden, handlers, model.blocks[index - 1], model.canRetry === true))
  })
  while (cursor < rounds.length) {
    emitRound(rounds[cursor])
    cursor += 1
  }
}

/** 构树（卡族 = 核卡工厂元素直取 —— R1；审批族入树项由 `approvalCardNode` 产出**真元素**，余仍为描述符 ——
 *  `dom.mjs` `fill` 对真节点直挂 ⇒ 两形同树同序）：根 = 挂载根（props 四锚；宿主 `class` / `data-slot` 归 `renderer/index.html` 骨架）；子序 = [引导节点?] → [摘要块?] →
 *  [流序（块序列 × 消化轮按记录位次复列 + 消费轮配对 —— #747）?] → [压缩行?]〔R4 —— 流元素冻结点、非尾组成员，另列〕→ [四尾组?] → [审批卡?] → [药丸?] —— 四尾组（皆非块节点）居流序之后、卡序列之前（族内序 = 消化行族 → 到期触发行组 → 停止痕 → 台账行）；`none` 帧 = 引导节点唯一子（零**块**节点 · 引导 = 非块节点 ⇒ 不入块序：`docs/desktop/design/UI.md` §1 批 B 追加注项 1）。 */
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
    // 停止痕（项 6 —— 流尾非块节点；族内序 = 消化行族 → 停止痕 → 台账行）
    if (model.stopped === true) children.push(stoppedNode())
    // 台账行组（项 12 —— 流尾非块节点组；行集源 = 本键切片）
    if (Array.isArray(model.ledger) && model.ledger.length > 0) children.push(ledgerGroupNode(model.ledger))
    children.push(...model.approval.map((item) => approvalCardNode(item, handlers)))
    if (!model.following) children.push(pillNode(model, handlers))
  }
  return { tag: "div", props: chromeProps(model), children }
}
