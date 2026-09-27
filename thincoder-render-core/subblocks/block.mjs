/**
 * block.mjs — 子代理块构件面（设计 §5 构件族 `renderSubBlock`；核化 `activity.js:75-115`
 * `buildBlock` 的 DOM 面 + `streaming.js:244` `subagentChunk` 的块侧构图——判定表 §3 行 4 / 47）。
 *
 * 留端：出生位（活动区 `#subagent-activity` 区尾 append）/ 说明行判重（`S._subDescShown`）与
 * 插入点 / 区钉底（`maybeScrollActivity`）/ 块级跟滚接线（`initBlockFollow`）/ 痕迹 / 帧调度。
 * 模型（`_subMeta`）= `subblocks/state.mjs` 的 list 元素——块面与态机共用同一模型。
 */
import { buildAdvisorBlock, appendAdvisorChunk } from "../flow/block.mjs"
import { t } from "../i18n.mjs"
import { refreshBlock, noteChunk } from "./activity-view.mjs"

/** 建子代理块（`details.advisor-block.sub-block.sub-live` + data 面 + toggle 监听 + 首刷）。
 *  `model` 须含 `{ key, label, role, id }`（态机 `born` / `takeover` 路径产出）；块元素持
 *  `_subMeta = model`（`refreshBlock` / `noteChunk` 读它）。 */
export function renderSubBlock(model) {
  const block = buildAdvisorBlock(model?.label ?? "")
  block.classList.add("sub-block", "sub-live")
  block.dataset.subname = model?.key ?? ""
  block.dataset.subrole = model?.role ?? ""
  if (model?.id != null) block.dataset.subid = String(model.id)
  block.open = true
  block._subMeta = model
  block.addEventListener("toggle", () => { if (block._subMeta && !block._subMeta.frozen) refreshBlock(block) })
  refreshBlock(block)
  return block
}

/** 说明行（A13——会话首个活动块的一次性说明；`S._subDescShown` 判重与「summary 之后、
 *  `.advisor-content` 之前」插入点留端）。 */
export function renderSubDesc() {
  const desc = document.createElement("div")
  desc.className = "sub-desc"
  desc.textContent = t("sub.desc")
  return desc
}

/** 子代理 chunk 入块构图（核化 `subagentChunk:244` 的块侧两面——内容追加 + 状态词写点；
 *  出生闸本体 = 核 `ensureSubBlock`（`state.mjs`）；其调用序 / 丢弃痕迹 / 跟滚脏集 / 帧调度留端）。
 *  `kind` 单点默认 `"text"`（R4 埋雷归一——与桥 `panel-toolpanel.mjs:15` 及 CLI `tool-events.mjs:324` 同值）。 */
export function renderSubagentChunk(block, m) {
  const kind = m?.kind ?? "text"
  appendAdvisorChunk(block, kind, m?.text, m?.sub, m) // m 随行（§5.6 合并判据读 face/tool）
  noteChunk(block, kind, m?.text, m) // m 携结构化 tool/cmd（§14 C-11①——结果 chunk 不改写状态区）
}
