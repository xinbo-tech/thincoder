/**
 * text-budget.mjs — 文本额度纯函数（零依赖——TUI-OOM-ROOTCAUSE 批，AGENT-LOOP.md §23.3.1 / TUI.md §15.3.2）。
 *
 * 单一来源（D2）：agent 侧捕获截断（spawn-child.mjs——子代理 `_capturedOutput`）与 TUI 面
 * 载体额度（tui/display-budget.mjs）共用本体的 `capText` / `appendCappedText`——两处各自
 * 复制截断逻辑的漂移面被消除。本模块零 import（可被任意层直接引用）。
 *
 * 计量口径 = **UTF-16 码元**（`String.length`——与 JS 字符串内存近似、确定、O(1) 计长；
 * TUI.md §15.2 表 1）。截断形态 = 头保 + 中段标记 + 尾保（标记含真实省略数 N）。
 *
 * 标记串约定：`marker` 模板中以字面 `N` 为省略数占位（逐字进测试断言——如
 * `… [captured output truncated: N chars omitted] …`）。
 */

/** 省略数占位符替换（首个 `N`——模板约定；TUI 面 capLines 等复用）。 */
export function fillMarker(marker, omitted) {
  if (typeof marker === "function") return String(marker(omitted))
  const tpl = String(marker ?? "")
  const i = tpl.indexOf("N")
  return i === -1 ? `${tpl} (${omitted} omitted)` : `${tpl.slice(0, i)}${omitted}${tpl.slice(i + 1)}`
}

/**
 * 头尾保真截断：`text` ≤ `max` 时零拷贝原样返回；超限 → 头 `keepHead` + 标记 + 尾 `keepTail`。
 * keepHead/keepTail 各自夹紧到文本长度（互不重叠——头 + 尾 ≤ 文本长）。
 * @returns {string} 原串或截断串（含 `marker` 替换后的省略数）
 */
export function capText(text, { max, keepHead = 0, keepTail = 0, marker = "" } = {}) {
  const t = String(text ?? "")
  if (!(max > 0) || t.length <= max) return t
  const head = Math.max(0, Math.min(keepHead, t.length))
  const tail = Math.max(0, Math.min(keepTail, t.length - head))
  const omitted = t.length - head - tail
  return t.slice(0, head) + fillMarker(marker, omitted) + (tail > 0 ? t.slice(t.length - tail) : "")
}

/**
 * 流式累积（滞后水位——摊还 O(1)）：`prev + add`；超 `hard` 时立即裁至
 * 头 `head` + 标记 + 尾 `tail`（下一轮从截断值继续累积——稳态长度 ≤ hard）。
 * @returns {string} 合并（可能已截断）的累积串
 */
export function appendCappedText(prev, add, { hard, head = 0, tail = 0, marker = "" } = {}) {
  const merged = String(prev ?? "") + String(add ?? "")
  if (!(hard > 0) || merged.length <= hard) return merged
  return capText(merged, { max: hard, keepHead: head, keepTail: tail, marker })
}
