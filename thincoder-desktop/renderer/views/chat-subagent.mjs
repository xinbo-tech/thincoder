/**
 * chat-subagent.mjs — 流内**归档子 agent 块**（「对齐第二批 · 六件」项 5 · 新档 —— `docs/desktop/design/UI.md`
 * §1「本批注（对齐第二批 · 六件）」项 5 / §2 项 1 · `docs/desktop/design/RENDERER.md` §1.1 块型表 · §2 运行期块记账）：
 *   ① `subagentNode(block, key, withLabel)` —— 归档块壳（纯描述符）：`div.block.block-subagent[data-block-kind="subagent"]`
 *      = **零边距透传容器**（样式住 `renderer/chat.css`）+ 说话人标签容器（回合首块判据归 `renderer/views/chat.mjs`）；
 *   ② `fillSubagentEcho(node, block)` —— 回显着装（**核件元素**：`details.advisor-block.sub-block` 冻结形
 *      `[✓ … done Ns]` + tail-3 留场 + 可展开内容）—— 内容按快照 `rows` **逐条重放**（`renderSubagentChunk` ·
 *      `rows` = 内容单留存处 · `renderer/subagent-reduce.mjs` 归档交快照）；幂等（已挂 ⇒ 零动作）；
 *   ③ `syncSubagentEcho(root, model)` —— 全根扫描补装（**重挂径**消费 —— `renderer/views/chat.mjs` `mountChat`；
 *      帧尾径 = 逐块 `fillSubagentEcho`（`chat.mjs` `dressNode`）；两径同件）；冻结块**静态** —— 不重放第二遍。
 * 核件消费（「对齐第二批」项 3 同源面）：`renderSubBlock` / `renderSubagentChunk`（`/rc/subblocks/block.mjs`）·
 * `refreshBlock`（`/rc/subblocks/activity-view.mjs`）。域外零触：归档块为**运行期块**（页读整置即失 —— 端差登记）。
 * 依赖单向：本档 → `renderer/views/chat-text.mjs`（`labelNode`）+ 核件四件；零 `node:` / 零裸包；本档零文案。
 */
import { renderSubagentChunk, renderSubBlock } from "/rc/subblocks/block.mjs"
import { refreshBlock } from "/rc/subblocks/activity-view.mjs"
import { labelNode } from "./chat-text.mjs"

/** 归档块壳（纯描述符 · 零 DOM）：核件回显由 `fillSubagentEcho` 帧后补装（核件需 `document` —— 不入纯树面）。 */
export function subagentNode(block, key, withLabel = false) {
  return {
    tag: "div",
    props: { class: "block block-subagent", "data-block-id": key, "data-block-kind": "subagent" },
    children: [...(withLabel ? [labelNode("assistant")] : [])],
  }
}

/** 冻结着装（终态折叠形 —— 核 fold 效果同形）：`sub-live ⇒ sub-frozen` + 折叠 + ⏹ 移除 + 末刷。 */
function foldEcho(element) {
  element.classList.remove("sub-live")
  element.classList.add("sub-frozen")
  element.open = false
  element.querySelector(".sub-stop-btn")?.remove()
  refreshBlock(element)
}

/** 核件回显元素（快照 → DOM）：块壳 + 内容行重放（`rows` 逐条 `renderSubagentChunk` —— 文本 / think / 工具两行同径）。
 *  **重放闸**：核件 `appendAdvisorChunk` 拒冻结块追加（运行态增量守卫）—— 归档块为**历史重放**（非增量）⇒
 *  临时以未冻态过闸，重放毕还原本相（折叠着装随其后落定）。 */
function echoOf(block) {
  const meta = block?.meta ?? {}
  const rows = Array.isArray(block?.rows) ? block.rows : []
  // 核件：块壳 + data 面 + toggle + 首刷
  const element = renderSubBlock(meta)
  element._subMeta = { ...meta, frozen: false }
  for (const row of rows) renderSubagentChunk(element, row)
  element._subMeta = meta
  foldEcho(element)
  return element
}

/** 回显着装（幂等 —— 已挂 `.advisor-block` ⇒ 零动作；非 subagent 块 / 容器缺 ⇒ 零动作）：冻结块静态（不重放第二遍）。 */
export function fillSubagentEcho(node, block) {
  if (!node || typeof node.append !== "function" || block?.kind !== "subagent") return
  if (node.querySelector(".advisor-block") !== null) return
  node.append(echoOf(block))
}

/** 全根补装（**重挂径**消费 —— `renderer/views/chat.mjs` `mountChat`；帧尾径 = 逐块 `fillSubagentEcho`）：
 *  `[data-block-kind="subagent"]` 节点序 ≡ 帧内 subagent 块序（DOM ≡ visible 不变式）⇒ 逐位配对补缺；无节点 ⇒ 零动作。 */
export function syncSubagentEcho(root, model) {
  if (!root || typeof root.querySelectorAll !== "function") return
  const nodes = root.querySelectorAll('[data-block-kind="subagent"]')
  if (nodes.length === 0) return
  const blocks = Array.isArray(model?.blocks) ? model.blocks.filter((block) => block?.kind === "subagent") : []
  nodes.forEach((node, index) => {
    if (blocks[index] !== undefined) fillSubagentEcho(node, blocks[index])
  })
}
