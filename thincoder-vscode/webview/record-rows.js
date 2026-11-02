/**
 * record-rows.js — 归档快照行派生叶件（#1733 批 · vsc-archive-sublabel）。
 *
 * 行形（`{kind, text, sub?}`）∥ 容读 ∥ 空正文判据的单源 = `docs/vsc/design/WEBVIEW.md` §5.7「行形：子标随行」条；
 * 记录形机制单源 = `docs/core/design/SESSION.md` §6.26。
 * 原 `webview/activity.js` 的同一份实现迁出于此（**禁第二份派生**）：叶件、零依赖、零浏览器全局
 * （只吃元素对象）⇒ 用例可直取，不必拉起整条 webview 模块图（`state.js` 的 `acquireVsCodeApi` ∥ 十处
 * `getElementById` 即读）。
 * 消费面 = `webview/activity.js` `subagentSnapshotOf`（快照 `rows`）；保尾上界同核契约（显示行 ≤ 500）。
 */

/** rows 保尾上界（核契约 §6.26「有界保尾」——显示行 ≤ 500；省略标记行不占额度）。 */
export const RECORD_ROWS_MAX_LINES = 500

/** 行显示行数（核 `countBlockLines` 同式：按 `\n` 切分、文末换行不计）。 */
export function rowLines(row) {
  const lines = String(row?.text ?? "").split("\n")
  return lines[lines.length - 1] === "" ? lines.length - 1 : lines.length
}

/** 内容行集（`.advisor-content` 行派生——条目形 `{kind, text, sub?}`）：工具行 kind="tool"（重放回工具行）；
 *  其余取 `dataset.kind`（text ∥ think——缺省回落 "text"）。
 *  `sub` = 行首子标的字面（`dataset.sub`——核 `thincoder-render-core/flow/block.mjs` `appendAdvisorChunk`
 *  的工具行支 ∥ 文本/思考行支），`text` = **行正文**
 *  （子标字面不入其中，否则回放双份 `explore#1 · explore#1 · …`）；`sub` 缺席（父自己的行）⇒ 条目不带该键。
 *  空正文行不产行：跳过判据 = `text` 为空，与 `sub` 在场无关（与 CLI 读面 `synthSubTask` 同一谓词）。 */
export function rowsOf(block) {
  const content = block.querySelector(".advisor-content")
  const out = []
  for (const el of content ? [...content.children] : []) {
    const text = bodyTextOf(el)
    if (text === "") continue // 空正文行不产行（活流不可达：`appendAdvisorChunk` 空串早返）——两端同判
    const sub = typeof el.dataset?.sub === "string" && el.dataset.sub ? el.dataset.sub : null
    const kind = el.classList.contains("advisor-tool-line") ? "tool"
      : (typeof el.dataset?.kind === "string" && el.dataset.kind) ? el.dataset.kind : "text"
    out.push(sub === null ? { kind, text } : { kind, text, sub })
  }
  return out
}

/** 行正文（文本节点拼接——行首 `span.advisor-sub` 不计入）：子标是身份、正文是内容，两者分装两个字段。 */
function bodyTextOf(el) {
  let out = ""
  for (const node of el.childNodes) {
    if (node.nodeType === 1 && node.classList?.contains("advisor-sub")) continue
    out += String(node.textContent ?? "")
  }
  return out
}

/** rows 保尾（弃最旧 ⇒ 前置省略标记行；标记自身不占额度；单行超界 ⇒ 行 = 最小单元，保末行）。 */
export function boundRows(rows) {
  let total = 0
  let start = rows.length
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const n = rowLines(rows[i])
    if (total + n > RECORD_ROWS_MAX_LINES) break
    total += n
    start = i
  }
  if (start === rows.length && rows.length > 0) start = rows.length - 1 // 单行超界：保末行
  if (start === 0) return rows // 未超界（零写）
  let dropped = 0
  for (let i = 0; i < start; i += 1) dropped += rowLines(rows[i])
  return [{ kind: "meta", text: `… [rows truncated: ${dropped} lines omitted]` }, ...rows.slice(start)]
}
