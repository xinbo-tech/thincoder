/**
 * tool-card-restore.mjs — restored finished-tool card builder (SESSION-RESTORE-PARITY
 * split, 2026-09-09): buildFinishedToolCard lives here so ui.js stays under the
 * 500-line limit. Leaf module (md/lib/i18n only — no state.js, no ui.js import).
 *
 * DOM parity with the live terminal card (finishToolCard in ui.js): header
 * (icon + name + args slice 80 + title full + status) + collapsible body.
 * Card is nested INSIDE the restored assistant frame container — never a
 * top-level paging anchor: no data-idx (only outer .message carries it).
 */

import { capText, isToolFailure } from "./lib.js"
import { esc } from "./md.js"
import { t } from "./i18n.js"

/** One restored tool card from a historyWindow tools[] entry ({ id, name, args, result }).
 *  - args（评审 #5 槽位定）：header 恒 raw slice 80 + title 全（live :209 对齐——live 显示
 *    raw 截断）；JSON.parse 成功 → pretty JSON 入 body（result 上方独立块）；解析失败
 *    （slim 300 截断串）→ 只留 header raw 原样
 *  - result：capText 落 body（防未 slim 老文件超大输出）；失败判据（`Error:`/`Error：` 前缀 ∪
 *    独立成行的退出状态行——`lib.js isToolFailure` 单源）→ 红 error + body 展开
 *    （finishToolCard 判据复用，两卡面同形）；成功 → 绿 done 折叠；无 result → body 只余
 *    args 块（无两者 → 空）+ done */
export function buildFinishedToolCard(tc) {
  if (!tc || typeof tc !== "object") return null
  const name = typeof tc.name === "string" && tc.name ? tc.name : "tool"
  const rawArgs = tc.args == null ? "" : String(tc.args)
  const result = typeof tc.result === "string" ? tc.result : ""
  const isError = isToolFailure(result) // F-W16：与活卡同判据（lib.js 单源）

  const c = document.createElement("div")
  c.className = "tool-call"
  if (tc.id) c.dataset.toolId = String(tc.id)

  const h = document.createElement("div")
  h.className = "tool-call-header"
  h.tabIndex = 0
  h.setAttribute("role", "button")
  h.setAttribute("aria-expanded", "false")
  h.innerHTML =
    `<span class="tool-call-icon"></span>` +
    `<span class="tool-call-name">${esc(name)}</span>` +
    `<span class="tool-call-args" title="${esc(rawArgs)}">${esc(rawArgs.slice(0, 80))}</span>` +
    `<span class="tool-call-status" style="color:${isError ? "#f14c4c" : "#4ec9b0"}">${isError ? t("tool.error") : t("tool.done")}</span>`

  const b = document.createElement("div")
  b.className = "tool-call-body"
  b.setAttribute("role", "region")
  b.setAttribute("aria-label", `Output of ${name}`)

  let pretty = null
  try {
    const parsed = JSON.parse(rawArgs)
    pretty = JSON.stringify(parsed, null, 2)
  } catch { pretty = null }
  const parts = []
  if (pretty !== null) parts.push(pretty)
  if (result) parts.push(capText(result))
  b.textContent = parts.join("\n")

  h.addEventListener("click", () => {
    h.querySelector(".tool-call-icon").classList.toggle("open")
    b.classList.toggle("open")
    h.setAttribute("aria-expanded", String(b.classList.contains("open")))
  })

  // 终态折叠语义对齐 finishToolCard：错误保持展开（用户必须看到失败面），成功折叠
  if (isError) {
    b.classList.add("open")
    h.querySelector(".tool-call-icon")?.classList.add("open")
    h.setAttribute("aria-expanded", "true")
  }

  c.appendChild(h)
  c.appendChild(b)
  return c
}
