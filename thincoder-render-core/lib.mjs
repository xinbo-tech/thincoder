/**
 * lib.js — pure helpers (no DOM, no module side effects) extracted from
 * chat.js / ui.js so the webview's logic is unit-testable. The webview has
 * otherwise ZERO automated coverage — every regression (Stop, iterable,
 * i18n loss, 137%) had to be caught by the user.
 *
 * Keep this module dependency-free so node --test can import it directly.
 */

/**
 * Truncate to the last ~max chars, snapped FORWARD to a line boundary so
 * markdown constructs (code fences, tables, bold spans) are never cut
 * mid-syntax by the panel preview.
 */
export function tailTruncate(text, max = 2000) {
  const t = String(text || "")
  if (t.length <= max) return t
  const start = t.length - max
  const snap = t.indexOf("\n", start)
  // Only snap forward when the newline has content AFTER it — if the only
  // newline in range is the trailing char, slicing past it yields "".
  if (snap >= 0 && snap + 1 < t.length) return t.slice(snap + 1)
  return t.slice(start)
}

/** 工具输出在 DOM 里的显示上限（字符）。超过则截断，防无界 DOM 增长拖慢布局（webview 输入卡顿修复）。 */
export const MAX_TOOL_OUTPUT = 64 * 1024

/** 把文本截到 max 字符并附截断提示（保头，工具输出用）。 */
export function capText(text, max = MAX_TOOL_OUTPUT, note = "…(输出过长已截断)") {
  const t = String(text || "")
  if (t.length <= max) return t
  return t.slice(0, max) + note
}

/** Compact token count: 10_000 → "10k", 1_500 → "1.5k", 999 → "999". */
export function fmtK(n) {
  if (n >= 10000) return Math.round(n / 1000) + "k"
  if (n >= 1000) return (n / 1000).toFixed(1) + "k"
  return String(n)
}

/** HH:MM from a Date (zero-padded). */
export function fmtTime(d) {
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

/**
 * Classify one unified-diff line for +/- coloring. Hunk/file headers stay
 * neutral ("same"); content lines color as add/del. Used by renderPatch in
 * chat.js (apply_patch approval preview).
 */
export function patchLineType(line) {
  // File headers are exactly "+++ <path>" / "--- <path>" (three markers +
  // space). A content line whose TEXT begins with "++" renders as "+++…" in a
  // unified diff — so matching the bare "+++" prefix would misclassify it.
  if (line.startsWith("+++ ") || line.startsWith("--- ")) return "same"
  if (line.startsWith("+")) return "add"
  if (line.startsWith("-")) return "del"
  return "same"
}

/**
 * 工具结果终止状态行（F-W16 判据单源的一部分——与 `isToolFailure` 同住一处，零第二份语法）：
 * **独立成行**的 `(exit code N≠0)` / `(killed: …)` / `(spawn failed)` ⇒ 返回该标记文本
 * （`"(exit code 1)"` / `"(killed: timeout 400ms)"` / `"(spawn failed)"`）；成功面 `(exit code 0)` /
 * 非独立成行 / `(stopped)`（`execute` 工具的用户中止自报形——不在判据集内）⇒ `""`。
 * 三成员闭集（设计 §4.3）：进程已跑 ⇒ 有退出码；被杀 ⇒ `killed: …`；**进程未启动 ⇒ 无退出码
 * （不伪造）⇒ `(spawn failed)`**。判据只认状态位、不认产者措辞（`Command failed:` 前缀不入判据）。
 */
export function toolFailureStatus(text) {
  const t = String(text ?? "").trim()
  if (!t) return ""
  for (const line of t.split("\n")) {
    const m = /^\((?:exit code (\d+)|killed: (.+)|spawn failed)\)$/.exec(line.trim())
    if (!m) continue
    if (m[1] === undefined && m[2] === undefined) return "(spawn failed)"
    if (m[1] === undefined) return `(killed: ${m[2]})`
    if (Number(m[1]) !== 0) return `(exit code ${m[1]})`
  }
  return ""
}

/**
 * 工具失败判据（F-W16 **单源**——活卡 `ui.js finishToolCard` 与恢复卡
 * `tool-card-restore.mjs buildFinishedToolCard` 同读）：① 既有 `Error:` / `Error：` 前缀
 * ∪ ② **独立成行**的终止状态位 `(exit code N≠0)` / `(killed: …)` / `(spawn failed)`——含用户中断值
 * `killed: user interrupted`（用户中断的命令确未完成 ⇒ 同判失败）。
 * 边界：仅「独立成行」的状态位触发——正文里提及 `(exit code 1)` / `(spawn failed)` 不误报；
 * `(stopped)`（`execute` 工具的用户中止自报形）不在判据集内。
 */
export function isToolFailure(text) {
  const t = String(text ?? "").trim()
  if (!t) return false
  if (/^Error[:：]/.test(t)) return true
  return toolFailureStatus(t) !== ""
}
