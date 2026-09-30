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
 *   ④ **归档位置 ∕ 裁剪面（R10 E4 ∕ E10 判据 —— 逐值对表结论）**：归档块 = 流内**尾追块**（入块序；序 = 归档序
 *      —— 块恒居尾组（消化行组等）之前 ⇒ 与 VSC `activity.js:104-110`「本轮边界前插入 ∕ 失效尾追」同位，零消差项）；
 *      **窗口 ∕ 裁剪** = 随既有尾窗（`MAX_RENDER_BLOCKS`）：出窗即弃、不计 `data-hidden`、非回填对象（运行期块
 *      非落盘件）；两机制**别名登记**（VSC `ui.js:199-206` 150 块 DOM 裁剪 ⇄ 桌面 200 块渲染窗 —— 值差 = 在册
 *      显式裁，`docs/render-core/design/RENDER-CORE.md` 行 13「各自 · 数值差登记」）；归档块**两窗口皆含**
 *      （VSC 裁剪集含 `.sub-block` ⇄ 桌面 `visibleWindow` 含 `kind === "subagent"`）。
 *   ⑤ **展开集捕获 ∕ 复填协作件**（#606④⑤ —— `echoOpenSet` ∕ `applyEchoOpen`；重挂径消费 = `renderer/views/chat.mjs`
 *      `mountChat`：重建前捕展开块键集 ⇒ 重建后 `open` 回真（**不强制关闭**）；冻结块静态面零改）。
 * 核件消费（「对齐第二批」项 3 同源面）：`renderSubBlock` / `renderSubagentChunk`（`/rc/subblocks/block.mjs`）·
 * `refreshBlock`（`/rc/subblocks/activity-view.mjs`）。**让位修复批（2026-09-29 · #603）**：归档重建径尾接
 * `initBlockFollow`（接线一致性——出生 ∕ 接管 ∕ 重放三径同件）；冻结块零行为变更（出口钮不建、零写）。
 * 域外零触：归档块为**运行期块**（页读整置即失 —— 端差登记）。
 * 依赖单向：本档 → `renderer/views/chat-text.mjs`（`labelNode`）+ 核件四件；零 `node:` / 零裸包；本档零文案。
 */
import { renderSubagentChunk, renderSubBlock, initBlockFollow } from "/rc/subblocks/block.mjs"
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
  initBlockFollow(element) // 让位修复批：归档重建径同源接线（冻结块 —— 出口钮不建、零写）
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

/** 展开集捕获（重挂前 —— #606④⑤）：回显 `details` 展开件在场块键集（`[data-block-id]` 键；缺根 ⇒ 空集）。 */
export function echoOpenSet(root) {
  if (!root || typeof root.querySelectorAll !== "function") return []
  const open = []
  for (const node of root.querySelectorAll('[data-block-kind="subagent"]')) {
    if (node.querySelector(".advisor-block")?.open === true) open.push(node.getAttribute("data-block-id"))
  }
  return open
}

/** 展开集复填（重建后 —— #606④⑤）：同键回显 `open` 回真；缺件零动作；**不强制关闭**（未捕获者零写）。 */
export function applyEchoOpen(root, keys) {
  if (!root || typeof root.querySelectorAll !== "function" || !Array.isArray(keys) || keys.length === 0) return
  for (const node of root.querySelectorAll('[data-block-kind="subagent"]')) {
    if (!keys.includes(node.getAttribute("data-block-id"))) continue
    const echo = node.querySelector(".advisor-block")
    if (echo !== null && echo !== undefined) echo.open = true
  }
}
