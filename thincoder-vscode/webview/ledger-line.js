/**
 * ledger-line.js — 台账行投递壳（LEDGER-SURFACE——设计档 §2.30.3.5 webview 面）。
 * 行构造与类名单源 = 核包 `flow/ledger-line.mjs`（R2 换接）；留端 = append 位与跟滚。
 * 载荷 `{type:"ledgerNotice", lines:[{text, warn}]}`（端内自有投递通道——与 CLI 的
 * pushLine 各自实现、语义同源）；样式在 `chat.css`。
 */
import { renderLedgerLine } from "../node_modules/@thincoder/render-core/flow/ledger-line.mjs"
import { maybeScrollDown } from "./ui.js"

export function addLedgerNotice(ctx, lines) {
  for (const line of lines ?? []) ctx.messagesEl.appendChild(renderLedgerLine(line))
  maybeScrollDown(ctx)
}
