/**
 * chat-cards.mjs — 对话流**卡面态刷**（`docs/desktop/design/RENDERER.md` §1.1 卡面在场与随动 / 插入点纪律两单源：
 * 卡序 = 待审批 → 提问 → 计划 ⇒ 插点 = 首个更高序卡之前；卡三族皆**非块节点** ⇒ 不入块序不变式）。
 * 自 `renderer/views/chat.mjs` 拆出（R3c —— 档行预算 `docs/desktop/design/PROJECT.md` §4.1「300 行 = 主动拆分层」
 * + 该档在册拆档预案 = **卡构树拆出**；预判触发 = 本舱 `chat.mjs` 换接核文本面后越 300）：
 * 面不变、判据不变，只换宿主档（先例 = 批 A `tabbar.mjs` / 批 8 `events-subscribe.mjs` / R3a `statusline.mjs`）。
 *   ① `syncCards` —— 帧尾卡面态刷（幂等：同 `prompt-id` ∧ 同 `data-shape` ∧ 同文本 ⇒ 零 DOM 写）；
 *   ② `cardAnchor` —— 卡面插点锚（新建审批族卡）：首个更高序卡之前（无 ⇒ 药丸之前 · 两锚皆缺 ⇒ 末位）。
 * 依赖单向：`chat.mjs` → 本档 → `approval.mjs`（卡构树）+ `dom.mjs`（`build`）。零 `node:` / 零裸包；
 * 本档零文案（不出词）。
 */
import { build } from "../dom.mjs"
import { approvalTree } from "./approval.mjs"

/** 卡面态刷（帧尾 · 幂等）：在场判据 = 待决项非空；逐位按序对齐 —— 同 `prompt-id` ∧ 同 `data-shape` ∧ 同文本 ⇒
 *  **零 DOM 写**（幂等），否则就地换；多出 ⇒ 摘；缺 ⇒ 插到卡锚位（首个更高序卡之前 ⇒ 卡恒居块序列之后、
 *  同序族之后、药丸之前）。 */
export function syncCards(root, model, handlers) {
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

/** 卡面插点锚（新建**审批族**卡 —— 卡序 = 待审批 → 提问 → 计划）：首个更高序卡之前（序首 ⇒ 首个提问卡 /
 *  其次计划卡）；无 ⇒ 药丸之前（`null` ⇒ 末位）—— 卡序逐项，后到者居尾、不夺旧卡位。 */
export function cardAnchor(root) {
  if (typeof root?.querySelector !== "function") return null
  const higher = root.querySelector('[data-card="question"]') ?? root.querySelector('[data-card="task"]')
  return higher ?? root.querySelector("[data-pill]")
}
