/**
 * ui-prefs.js — 视图偏好应用（`uiPrefs` 消息 · 协议 §3.2 行 23 · 台账 #875；发射 = 扩展侧
 * `src/extension/ui-prefs.mjs`）。三键：
 *   - `autoFollow`（自动滚动门）→ 落 `ctx._autoFollow`（读侧 = `ui.js` 两原语门 ∥
 *     `streaming.js` 块跟滚帧尾门；`=== false` 判——未达报文前同缺省 true）；
 *   - `activityMaxHeight`（活动区封顶，单位 vh）→ 活动区内联 `max-height`（CSS 缺省 32vh
 *     = `base.css` `#subagent-activity`——内联覆盖）；
 *   - `activityTailLines`（折叠预览行数；允许 0）→ 核缝 `configureActivityView({ tailLines })`。
 * 缺键 / 坏值 ⇒ 缺省（true ∥ 32 ∥ 3）；每次消息全量落三面（幂等）。
 */
import { ctx } from "./state.js"
import { configureActivityView } from "./activity-view.js"

/** `uiPrefs` 载荷应用（应用面三条——见档头）。 */
export function applyUiPrefs(m) {
  ctx._autoFollow = m?.autoFollow !== false // 非 boolean 值（缺键 / 坏值）⇒ 缺省 true
  const maxH = m?.activityMaxHeight
  const maxHeight = Number.isFinite(maxH) && maxH > 0 ? maxH : 32 // 缺键 / 坏值 ⇒ 缺省 32
  if (ctx.activityEl) ctx.activityEl.style.maxHeight = `${maxHeight}vh`
  const tail = m?.activityTailLines
  configureActivityView({ tailLines: Number.isInteger(tail) && tail >= 0 ? tail : 3 }) // 允许 0；坏值 ⇒ 缺省 3
}
