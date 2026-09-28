/**
 * chat-pending.mjs — 流内**待发送气泡组**（「对齐第二批 · 六件」项 2 · 新档 —— `docs/desktop/design/UI.md`
 * §1「本批注（对齐第二批 · 六件）」项 2 / §1「输入区」行 · `docs/desktop/design/RENDERER.md` §1.1 插入点纪律）：
 *   ① `pendingOf(state)` —— 本会话队读取（`pending[活动会话键]` —— 缺 / 非数组 ⇒ 空表：零气泡 —— 禁假造）；
 *   ② `pendingGroupNode(model)` —— 尾组构树（纯描述符 · 机检面）：`[data-pending]` 组 = **流内非块节点**
 *      （零 `data-block-id` ⇒ 不占块序 / 不动 `data-blocks` 不变式）；项 = 待发送气泡（`.block.block-user` 形 ·
 *      文本面 `mdInline` —— 与用户块同面 · `.msg-label` 空容器 · **零复制控件**〔未受理 —— 诚实面〕）；
 *   ③ `syncPending(root, model, anchor)` —— 帧尾组同步（幂等）：在场 ⟺ 本会话队非空；项数 = 队长；内容等价 ⇒
 *      零写；**落点 = 块序列之后、卡序列之前**（= 块插入点同侧 ⇒ 回合尾受理交接位置零跳 —— 单源 =
 *      `renderer/views/chat.mjs` `blockAnchor`）。
 * 标签落笔归帧尾后处理（核 `markPending` —— 类 `pending` 由原语加，构树不得预置该类，否则原语幂等守卫吞掉落笔）。
 * 依赖单向：本档 → `renderer/dom.mjs`（`build`）+ `renderer/views/chat-text.mjs`（`labelNode` / `textFace`）。
 * 零 `node:` / 零裸包；本档零文案（不出词 —— 组内文案全在文本面与核原语）。
 */
import { build } from "../dom.mjs"
import { labelNode, textFace } from "./chat-text.mjs"

/** 本会话队读取（**单源** —— 渲染面零推导；非活动会话 / 槽缺 / 非数组 ⇒ 空表）。 */
export function pendingOf(state) {
  const key = state?.activeSession ?? null
  const table = state?.pending
  const list = key === null || table === null || typeof table !== "object" ? undefined : table[key]
  return Array.isArray(list) ? list : []
}

/** 待发送气泡（项 = 条目 `{ text, ts }` 的 `text` 逐字 —— 零显示串副本；`html` 经核 `mdInline` 转义闸）。 */
function bubbleNode(entry) {
  const text = typeof entry?.text === "string" ? entry.text : ""
  return {
    tag: "div",
    props: { class: "block block-user", "data-pending-item": "" },
    children: [labelNode("user"), textFace({ kind: "user", text }, "block-text")],
  }
}

/** 尾组构树（纯 · 零 DOM）：队空 ⇒ `null`（零节点 —— 不落空壳）；否则组 + 逐条气泡（序 = 队序）。 */
export function pendingGroupNode(model) {
  const list = Array.isArray(model?.pending) ? model.pending : []
  if (list.length === 0) return null
  return {
    tag: "div",
    props: { class: "chat-pending", "data-pending": "" },
    children: list.map(bubbleNode),
  }
}

/** 组内容等价判据（帧刷幂等）：项数 = 队长 ∧ 逐项原文锚逐字等 ⇒ 零 DOM 写（标签落笔面不入判 ——
 *  核原语自持幂等；`pending` 类由原语加，不参与等价）。 */
function equivalentPending(node, list) {
  const items = [...node.children]
  if (items.length !== list.length) return false
  return items.every((item, index) => {
    const face = item.querySelector("[data-raw]")
    const raw = typeof list[index]?.text === "string" ? list[index].text : ""
    return face !== null && face.getAttribute("data-raw") === raw
  })
}

/** 帧尾组同步（幂等）：在场判据 = 本会话队非空；`anchor` = 卡面插点锚（首个卡节点 ∨ 药丸 ∨ `null` 末位）——
 *  组恒居块序列之后、卡序列之前（交接位置零跳）。内容等价 ⇒ 零写；组换代 ⇒ 原位换（零序跳）。 */
export function syncPending(root, model, anchor = null) {
  if (!root || typeof root.querySelector !== "function") return
  const list = Array.isArray(model?.pending) ? model.pending : []
  const node = root.querySelector("[data-pending]")
  if (list.length === 0) {
    if (node !== null && node !== undefined) node.remove()
    return
  }
  if (node !== null && node !== undefined && equivalentPending(node, list)) return
  const fresh = build(pendingGroupNode(model))
  if (node !== null && node !== undefined) {
    node.replaceWith(fresh)
    return
  }
  if (typeof root.insertBefore === "function") root.insertBefore(fresh, anchor)
  else root.append(fresh)
}
