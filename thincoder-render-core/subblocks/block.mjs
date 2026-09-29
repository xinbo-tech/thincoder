/**
 * block.mjs — 子代理块构件面（设计 §5 构件族 `renderSubBlock`；核化自 VSC `webview/activity.js`
 * `buildBlock` 的 DOM 面 + 自 VSC `webview/streaming.js` `subagentChunk` 的块侧构图——判定表 §3 行 4 / 47）。
 *
 * 留端清单（2026-09-29 重写——让位修复批 `docs/batches/2026-09-29-subblock-follow-resume.md` §2.13 · 用户裁定）：
 *   ① **块级跟滚**：原语 ∕ 旗标 ∕ 出口钮 ∕ 核应用器住本档；**应用点契约住核档**（应用点清单 = 追加后 ∕ 挂载后 ∕
 *      帧尾复核——单源 = `docs/render-core/design/RENDER-CORE.md` §5）；**触发源在端**（帧合并 ∕ 更新纪律已收核
 *      ——单源 = 该档 §2 KD-RC-9）。
 *   ② **区钉底**：滚动策略族契约句（近底 24px 判据 ∕ 旗标门 `!== false` ⇒ 写 `scrollTop = MAX` ∕ 不夺阅读位 ∕
 *      清账三路——判据 ∕ 清账路 = 契约；载体与帧调用点 = 宿主适配；单源 = 该档 §2 KD-RC-8 ④）。
 *   ③ 其余留端：出生位（活动区 `#subagent-activity` 区尾 append）· 说明行判重与插入点 · 痕迹 · 帧调度。
 * 模型（`_subMeta`）= `subblocks/state.mjs` 的 list 元素——块面与态机共用同一模型。
 */
import { buildAdvisorBlock, appendAdvisorChunk } from "../flow/block.mjs"
import { t } from "../i18n.mjs"
import { refreshBlock, noteChunk } from "./activity-view.mjs"

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

// ─── 块内容区跟滚原语（提核 2026-09-29 · KD-RC-8 —— 让位三律 + 出口钮收正同批）──────────

/** 手势门宽（让位三律②——远离底仅凭用户手势门；值 = 设计定 600ms）。 */
export const GESTURE_GATE_MS = 600

/** 近底阈（**滚动策略族契约同源**——KD-RC-8 ④：与 VSC `webview/ui.js` ∕ 桌面 `views/chat-scroll.mjs` 同值 24）。 */
export const NEAR_BOTTOM_PX = 24

/** 让位期出口钮同步（幂等 · 建 ∕ 更 ∕ 删一体——KD-RC-8 出口钮 = 原语自持面）：在场判据 = `open ∧ 非冻结
 *  （sub-frozen 缺席）∧ _pinFollow === false ∧ 内容可滚`；两态文案 = 让位期有新行（`_subFollowNew`）⇒
 *  `sub.follow.new`，否则 ⇒ `sub.follow.bottom`；点击 ⇒ 回底 + 复跟 + 钮退场。清账三路 = 点击 ∕ 近底复跟（旗标
 *  翻真 ⇒ 本同步退场）∕ 元素重建（随元素灭）。钮不入 `.advisor-content`（避行合并判据读点）；折叠态 CSS 兜底。 */
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
    content.scrollTop = Number.MAX_SAFE_INTEGER
    content._pinFollow = true
    content._subFollowNew = false
    syncFollowButton(block)
  })
  block.appendChild(next)
}

/** 块级跟滚监听（出生接线——自 VSC `webview/activity.js` 逐字搬移；2026-09-29 让位三律收正）：
 *   ① 近底（gap < 24px）**无条件**翻真（自愈——吸收复位 ∕ 程序写 ∕ 布局回波）；② 远离底**仅凭用户手势门**
 *  （`wheel` ∕ `touchmove` ∕ `pointerdown` 起算 `GESTURE_GATE_MS` 内）翻假（让位）；③ 其余（非手势位移）**不
 *  改旗标**。监听集 = 手势三事件（标记）+ `scroll`（更新点——近底自愈与键盘 ∕ 拖条 ∕ 程序写三覆盖）；全
 *  `{ passive: true }`；旗标 = `内容区._pinFollow`（`false` ⇒ 零写——不夺阅读位）。内容区缺失零操作。 */
export function initBlockFollow(block) {
  const content = block.querySelector(".advisor-content")
  if (!content) return
  let gestureAt = 0
  const markGesture = () => { gestureAt = Date.now() }
  const onScroll = () => {
    if (content.scrollHeight - content.scrollTop - content.clientHeight < NEAR_BOTTOM_PX) {
      content._pinFollow = true // ① 近底无条件翻真（自愈）
      content._subFollowNew = false // 已见底 ⇒ 无未读（出口钮两态判据复位）
    } else if (Date.now() - gestureAt < GESTURE_GATE_MS) {
      content._pinFollow = false // ② 手势门内远离底 ⇒ 让位
    } // ③ 其余不改旗标（非手势位移：复位回波 ∕ 程序写 ∕ 布局）
    syncFollowButton(block) // 翻旗后同步（幂等——让位 ⇒ 钮在场；复跟 ⇒ 钮退场）
  }
  content.addEventListener("wheel", markGesture, { passive: true })
  content.addEventListener("touchmove", markGesture, { passive: true })
  content.addEventListener("pointerdown", markGesture, { passive: true })
  content.addEventListener("scroll", onScroll, { passive: true })
}

/** 块级跟滚应用（逐块消费——自 VSC `webview/activity.js` 逐字搬移；应用点契约 = 追加后 ∕ 挂载后 ∕ 帧尾复核
 *  （调用时刻在端））：折叠（open=false）或已移除（!isConnected）→ no-op（零滚动副作用）；默认钉底
 *  （`内容区._pinFollow !== false` idiom 同 `ctx._pinBottom`）→ 写超值不读 `scrollHeight`；**让位期零写**且
 *  出口钮随同步（旗标假 ⇒ 在场；旗标真 ⇒ 退场）。 */
export function maybeScrollBlock(block) {
  if (!block?.isConnected || !block.open) return
  const content = block.querySelector(".advisor-content")
  if (content === null || content === undefined) return
  if (content._pinFollow !== false) content.scrollTop = Number.MAX_SAFE_INTEGER
  syncFollowButton(block)
}
