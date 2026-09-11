/**
 * ledger-line.js — 台账行渲染（LEDGER-SURFACE——设计档 §2.30.3.5 webview 面）。
 *
 * 载荷 `{type:"ledgerNotice", lines:[{text, warn}]}`（端内自有投递通道——与 CLI 的 pushLine
 * 各自实现、语义同源）：逐行 `<div class="ledger-line [warn]">` append 到 `#messages`
 * （会话流、可回看——非状态区）。样式在 `chat.css`（`ui.js` 491 行——不寄居新函数）。
 */
import { maybeScrollDown } from "./ui.js"

export function addLedgerNotice(ctx, lines) {
  for (const line of lines ?? []) {
    const el = document.createElement("div")
    el.className = line?.warn ? "ledger-line warn" : "ledger-line"
    el.textContent = line?.text ?? ""
    ctx.messagesEl.appendChild(el)
  }
  maybeScrollDown(ctx)
}
