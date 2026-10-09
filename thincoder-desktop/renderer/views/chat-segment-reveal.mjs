/**
 * chat-segment-reveal.mjs — 巨块隐藏段披露助手（#711② · 核缝 `deps.reveal` 的桌面消费件）：
 * 搜索跳转命中隐藏段（`display:none` ⇒ 无布局盒 ⇒ `scrollIntoView` 无位移）⇒ 把命中段一次性放窗（段 ±1
 * —— 同初窗 ∥ 重挂转移径；不计「≤2 段变更/帧」步进预算：该预算服务连续滚动的渐进收敛，跳转为用户离散动作）。
 * 机制 ∥ 段账单源 = `chat-text-segments.mjs`（本档 = 披露面，零机制副本）；降级 = 现行为（`false`，调用方照常跳转）。
 */
import { ACCOUNTS, applyWindow, padWindow } from "./chat-text-segments.mjs"

/** 披露命中件所在段（`mark.search-hit` 等）：未分段 ∥ 未在账 ∥ 段号非法 ⇒ `false`（零写）；
 *  段已在窗 ⇒ `true`（幂等零写）；否则一次性放窗（段 ±1）⇒ `true`。 */
export function revealSegmentAt(el) {
  const face = typeof el?.closest === "function" ? el.closest("[data-raw]") : null
  const record = face === null ? undefined : ACCOUNTS.get(face)
  if (record === undefined) return false
  const shell = el.closest("span[data-seg]")
  if (shell === null) return false
  const seg = Number.parseInt(shell.getAttribute("data-seg") ?? "", 10)
  if (!Number.isInteger(seg) || seg < 0 || seg >= record.count) return false
  if (seg >= record.window.first && seg <= record.window.last) return true // 已在窗（幂等）
  applyWindow(record, padWindow({ viewFirst: seg, viewLast: seg }, record.count))
  return true
}
