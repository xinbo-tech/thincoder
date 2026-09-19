/**
 * permission.js — the permissionRequest prompt: approve / approve-all / deny,
 * with apply_patch approval preview (+/- coloring) and a native-diff-viewer
 * handoff for large diffs.
 */
import { vscode } from "./state.js"
import { t } from "./i18n.js"
import { patchLineType } from "./lib.js"
import { renderDiff, lineDiff } from "./diff.js"
import { escHtml } from "./ui.js"

/**
 * Render a raw unified diff (apply_patch approval preview) with +/- coloring.
 * Hunk headers (@@, diff --git, ---/+++) stay neutral; only content lines colored.
 */
function renderPatch(patch) {
  const lines = String(patch || "").split("\n").map((l) => ({ type: patchLineType(l), text: l }))
  return renderDiff(lines)
}

export function showPermissionRequest(m) {
  const el = document.createElement("div")
  el.className = "permission-prompt"
  // §18 C-7：卡携 promptId（host 响应按 id 精确路由 / 释放清扫 permissionWithdrawn 按 id 移除）
  if (m.promptId != null) el.dataset.promptId = String(m.promptId)
  el.setAttribute("role", "alert")
  el.setAttribute("aria-label", t("perm.wantsTo") + " " + m.tool)
  const argsPreview = m.args ? m.args.slice(0, 150) + (m.args.length > 150 ? "…" : "") : ""
  let diffHtml = ""
  let diffBig = false
  if (m.diff && m.diff.patch) {
    diffHtml = '<div class="diff-preview"><div class="diff-header">apply_patch</div>' + renderPatch(m.diff.patch) + '</div>'
    diffBig = m.diff.patch.split("\n").length > 20
  } else if (m.diff && m.diff.old !== m.diff.new) {
    const lines = lineDiff(m.diff.old, m.diff.new)
    diffHtml = '<div class="diff-preview"><div class="diff-header">' + escHtml(m.diff.path) + '</div>' + renderDiff(lines) + '</div>'
    diffBig = lines.filter((l) => l.type !== "same").length > 12
  }
  // §18 C-7（child permission gate）：owner 非空（child 卡）→ 首行 = `<owner> · <tool>`
  // （R1 逐字格式——与活动块 label 同源，目视配对）；owner 空（depth-0 既有调用）→ 既有句零改。
  let html = '<div class="permission-prompt-text">'
  if (m.owner) {
    html += '<span class="perm-owner">' + escHtml(m.owner) + '</span> · <code>' + escHtml(m.tool) + '</code>'
  } else {
    html += t("perm.wantsTo") + ' <code>' + escHtml(m.tool) + '</code>'
  }
  if (argsPreview) html += '<br><span style="font-size:11px;opacity:0.7">' + escHtml(argsPreview) + '</span>'
  html += '</div>' + diffHtml
  // Large diffs are unreviewable in the cramped card — offer the native diff viewer.
  if (diffBig) html += '<button class="view-diff" style="margin-top:4px;font-size:11px">' + t("perm.viewInEditor") + '</button>'
  html += '<div class="permission-prompt-actions">'
  html += '<button class="approve" aria-label="' + t("perm.approve") + ' ' + m.tool + '">' + t("perm.approve") + '</button>'
  html += '<button class="approve-all" aria-label="' + t("perm.approveAll") + '">' + t("perm.approveAll") + '</button>'
  html += '<button class="deny" aria-label="' + t("perm.deny") + ' ' + m.tool + '">' + t("perm.deny") + '</button>'
  html += '</div>'
  el.innerHTML = html
  el.querySelector(".view-diff")?.addEventListener("click", () => {
    vscode.postMessage({ type: "openDiff", diff: m.diff })
  })
  const reply = (approved) => ({ type: "permissionResponse", approved, ...(m.promptId != null ? { promptId: m.promptId } : {}) })
  el.querySelector(".approve").addEventListener("click", () => {
    el.remove()
    vscode.postMessage(reply(true))
  })
  el.querySelector(".approve-all").addEventListener("click", () => {
    el.remove()
    vscode.postMessage(reply("approveAll"))
  })
  el.querySelector(".deny").addEventListener("click", () => {
    el.remove()
    vscode.postMessage(reply(false))
  })
  document.getElementById("messages").appendChild(el)
  el.scrollIntoView({ behavior: "smooth" })
  // Focus the deny button (safest default)
  setTimeout(() => el.querySelector(".deny")?.focus(), 50)
}


/**
 * §16 D-B1 merged batch-approval row: "N tools need permission: A、B、C" with
 * approve-all / one-by-one / deny. One ask covers the whole batch — no click fatigue.
 * approveAll → whole batch runs; oneByOne → the extension falls back to per-item cards;
 * deny → whole batch refused (no second ask).
 */
export function showBatchPermissionRequest(m) {
  const el = document.createElement("div")
  el.className = "permission-prompt"
  // F-W13（D-W15）：合并卡同携族键 promptId（与逐项卡同族——同一移除选择器
  // `.permission-prompt[data-prompt-id]`；host 释放 permissionWithdrawn 按 id 精确移除）
  if (m.promptId != null) el.dataset.promptId = String(m.promptId)
  el.setAttribute("role", "alert")
  const names = (m.tools ?? []).map((t) => escHtml(t?.name ?? "?")).join(", ")
  let html =
    '<div class="permission-prompt-text">' +
    t("perm.batch.wantsTo", { count: String(m.count ?? (m.tools ?? []).length), names }) +
    "</div>"
  html += '<div class="permission-prompt-actions">'
  html += '<button class="approve-all">' + t("perm.approveAll") + "</button>"
  html += '<button class="one-by-one">' + t("perm.batch.oneByOne") + "</button>"
  html += '<button class="deny">' + t("perm.deny") + "</button>"
  html += "</div>"
  el.innerHTML = html
  // F-W13：三按钮载荷同携 promptId（逐项卡 `reply` 同形——旧 host 无 id 则只发 choice）
  const reply = (choice) => ({ type: "batchPermissionResponse", choice, ...(m.promptId != null ? { promptId: m.promptId } : {}) })
  el.querySelector(".approve-all").addEventListener("click", () => {
    el.remove()
    vscode.postMessage(reply("approveAll"))
  })
  el.querySelector(".one-by-one").addEventListener("click", () => {
    el.remove()
    vscode.postMessage(reply("oneByOne"))
  })
  el.querySelector(".deny").addEventListener("click", () => {
    el.remove()
    vscode.postMessage(reply("deny"))
  })
  document.getElementById("messages").appendChild(el)
  el.scrollIntoView({ behavior: "smooth" })
  // Focus the deny button (safest default)
  setTimeout(() => el.querySelector(".deny")?.focus(), 50)
}
