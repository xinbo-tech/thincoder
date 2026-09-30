/**
 * block.mjs — 子代理块构件面（设计 §5 构件族 `renderSubBlock`；核化自 VSC `webview/activity.js`
 * `buildBlock` 的 DOM 面 + 自 VSC `webview/streaming.js` `subagentChunk` 的块侧构图——判定表 §3 行 4 / 47）。
 *
 * 留端清单（2026-09-29 重写——让位修复批 `docs/batches/2026-09-29-subblock-follow-resume.md` §2.13 · 用户裁定；
 * 同日滚动策略族抽核 ∕ 批 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.5 收正）：
 *   ① **块级跟滚**：块面（`renderSubBlock` ∕ `renderSubDesc` ∕ `renderSubagentChunk` ∕ 出口钮自持面）住本档；
 *      滚动策略族四件（判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记）= **核抽核件 `../scroll.mjs`**——本档 = 薄包直消费
 *      （`initBlockFollow` ∕ `maybeScrollBlock` 两导出保名 ⇒ 消费面零改；单源 = `docs/render-core/design/RENDER-CORE.md`
 *      §2 KD-RC-8 ④ ∕ §5「滚动策略族」）；**应用点契约住核档**（应用点清单 = 追加后 ∕ 挂载后 ∕ 帧尾复核）；
 *      **触发源在端**（帧合并 ∕ 更新纪律已收核——单源 = 该档 §2 KD-RC-9）。
 *   ② **让位三律 ∕ 清账三路**：语义单源 = 核 `../scroll.mjs`（近底判据 ∕ 旗标门 ∕ 手势门 ∕ 清账路——本档只留
 *      让位期出口钮同步与两态文案）；载体与帧调用点 = 宿主适配。
 *   ③ 其余留端：出生位（活动区 `#subagent-activity` 区尾 append）· 说明行判重与插入点 · 痕迹（端观测面——桌面无上行面 ⇒ 不接（给由）：缺省 no-op ⇒ 零行为差异）· 帧调度。
 * 模型（`_subMeta`）= `subblocks/state.mjs` 的 list 元素——块面与态机共用同一模型。
 */
import { buildAdvisorBlock, appendAdvisorChunk } from "../flow/block.mjs"
import { t } from "../i18n.mjs"
import { refreshBlock, noteChunk } from "./activity-view.mjs"
import { applyPin, createPinWatch } from "../scroll.mjs"

/** 近底阈再出口保名（**唯一数值源** = 核 `../scroll.mjs`——消费面零改；KD-RC-8 ④ 收正）。 */
export { NEAR_BOTTOM_PX } from "../scroll.mjs"

/** 建子代理块（`details.advisor-block.sub-block.sub-live` + data 面 + toggle 监听 + 首刷）。`model` 须含
 *  `{ key, label, role, id }`（态机 `born` / `takeover` 路径产出）；块元素持 `_subMeta = model`。 */
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

/** 说明行（A13——会话首个活动块的一次性说明；`S._subDescShown` 判重与「summary 之后、`.advisor-content` 之前」插入点留端）。 */
export function renderSubDesc() {
  const desc = document.createElement("div")
  desc.className = "sub-desc"
  desc.textContent = t("sub.desc")
  return desc
}

/** 子代理 chunk 入块构图（核化自 VSC `webview/streaming.js` `subagentChunk` 的块侧两面——内容追加 + 状态词写点；
 *  出生闸本体 = 核 `ensureSubBlock`（`state.mjs`）；其调用序 / 丢弃痕迹 / 跟滚脏集 / 帧调度留端）。`kind` 单点
 *  默认 `"text"`（R4 埋雷归一——与桥 `panel-toolpanel.mjs:15` 及 CLI `tool-events.mjs:324` 同值）。让位期新行到达
 *  （旗标假）⇒ 置 `_subFollowNew`（出口钮两态「新内容」判据——KD-RC-8）。 */
export function renderSubagentChunk(block, m) {
  const kind = m?.kind ?? "text"
  appendAdvisorChunk(block, kind, m?.text, m?.sub, m) // m 随行（§5.6 合并判据读 face/tool）
  noteChunk(block, kind, m?.text, m) // m 携结构化 tool/cmd（§14 C-11①——结果 chunk 不改写状态区）
  const content = block.querySelector(".advisor-content")
  if (content !== null && content !== undefined && content._pinFollow === false) content._subFollowNew = true
}

// ─── 块内容区跟滚（滚动策略族四件 = 核 `../scroll.mjs`；本档 = 薄包 + 出口钮自持面）─────────

/** 手势门宽（让位三律②——远离底仅凭用户手势门；值 = 设计定 600ms；传核 `createPinWatch({ gestureGateMs })`）。 */
export const GESTURE_GATE_MS = 600

/** 让位期出口钮同步（幂等 · 建 ∕ 更 ∕ 删一体——KD-RC-8 出口钮 = 原语自持面）：在场判据 = `open ∧ 非冻结
 *  （sub-frozen 缺席）∧ _pinFollow === false ∧ 内容可滚`；两态文案 = 让位期有新行（`_subFollowNew`）⇒
 *  `sub.follow.new`，否则 ⇒ `sub.follow.bottom`；点击 ⇒ 回底（写口 = 核 `applyPin`）+ 复跟 + 钮退场。
 *  清账三路 = 点击 ∕ 近底复跟（旗标翻真 ⇒ 本同步退场）∕ 元素重建（随元素灭）。
 *  钮不入 `.advisor-content`（避行合并判据读点）；折叠态 CSS 兜底。 */
function syncFollowButton(block) {
  const content = block?.querySelector?.(".advisor-content") ?? null
  const btn = block?.querySelector?.(".sub-follow-btn") ?? null
  const show = content !== null && block.open === true && block.classList.contains("sub-frozen") === false
    && content._pinFollow === false && content.scrollHeight > content.clientHeight
  if (!show) { if (btn !== null) btn.remove(); return }
  const label = t(content._subFollowNew ? "sub.follow.new" : "sub.follow.bottom")
  if (btn !== null) { if (btn.textContent !== label) btn.textContent = label; return }
  const next = document.createElement("button")
  next.type = "button"
  next.className = "sub-follow-btn"
  next.textContent = label
  next.addEventListener("click", () => {
    applyPin(content, true) // 写口单源（核 `../scroll.mjs`——超值不读 `scrollHeight`）
    content._pinFollow = true // 复跟（显式动作——旗标键面保持）
    content._subFollowNew = false
    syncFollowButton(block)
  })
  block.appendChild(next)
}

/** 块级跟滚监听（出生接线——核工厂 `createPinWatch` 直消费；让位三律语义单源 = `../scroll.mjs`）：
 *  旗标宿内容区（`内容区._pinFollow`——元素重建 ⇒ 随元素灭，零模块级账）；`onNearBottom` = 近底清账
 *  （`_subFollowNew` 复位 + 钮同步）；`onGesture` = 让位回调（钮同步）。内容区缺失零操作。 */
export function initBlockFollow(block) {
  const content = block?.querySelector?.(".advisor-content")
  if (!content) return
  createPinWatch(content, {
    flagKey: "_pinFollow",
    gestureGateMs: GESTURE_GATE_MS,
    onNearBottom: () => { content._subFollowNew = false; syncFollowButton(block) },
    onGesture: () => syncFollowButton(block),
  }).attach()
}

/** 块级跟滚应用（逐块消费；应用点契约 = 追加后 ∕ 挂载后 ∕ 帧尾复核（调用时刻在端））：折叠（open=false）
 *  或已移除（!isConnected）→ no-op（零滚动副作用）；默认钉底（`applyPin(内容区, 内容区._pinFollow)`——
 *  旗标门 `!== false` ⇒ 写超值；**让位期零写**）且出口钮随同步（旗标假 ⇒ 在场；旗标真 ⇒ 退场）。 */
export function maybeScrollBlock(block) {
  if (!block?.isConnected || !block.open) return
  const content = block.querySelector(".advisor-content")
  if (content === null || content === undefined) return
  applyPin(content, content._pinFollow)
  syncFollowButton(block)
}
