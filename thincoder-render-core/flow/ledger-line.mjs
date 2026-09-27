/**
 * ledger-line.mjs — 台账行构件（核化 `webview/ledger-line.js` 的行构造与类名——判定表 §3 行 19
 * 「拆」）。载荷 `{text, warn}`；样式在端 CSS（`chat.css`）。append 与跟滚（`maybeScrollDown`）
 * 留端。
 */

/** 单行台账 notice ⇒ `<div class="ledger-line [warn]">`（类名逐字承源档）。 */
export function renderLedgerLine(line) {
  const el = document.createElement("div")
  el.className = line?.warn ? "ledger-line warn" : "ledger-line"
  el.textContent = line?.text ?? ""
  return el
}
