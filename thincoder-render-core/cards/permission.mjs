/**
 * permission.mjs — 审批卡构件面（核化 `webview/permission.js` 的构树——判定表 §3 行 28「拆」；
 * §4 行 18 机制「审批卡」）。出站三出口（`openDiff` / `permissionResponse` ×2 卡）一律经
 * `deps.emit(type, payload)` 注入（VSC 绑 `postMessage` / 桌面绑 `invoke`）。
 * 输出形态 = **DOM 构件**（KD-RC-3：端消费面 = `renderApprovalCard` / `renderBatchApprovalCard` 元素，
 * 端不经 innerHTML 注入）；卡体 HTML 串（含转义闸）为本件内部实现面——不入 §5 纯函数族。
 * 留端：append 到 `#messages` / `scrollIntoView` / deny 聚焦。
 */
import { esc as escHtml } from "../md.mjs"
import { patchLineType } from "../lib.mjs"
import { renderDiff, lineDiff } from "../diff.mjs"
import { t as coreT } from "../i18n.mjs"

/**
 * Render a raw unified diff (apply_patch approval preview) with +/- coloring.
 * Hunk headers (@@, diff --git, ---/+++) stay neutral; only content lines colored.
 */
function renderPatch(patch) {
  const lines = String(patch || "").split("\n").map((l) => ({ type: patchLineType(l), text: l }))
  return renderDiff(lines)
}

/** 逐项审批卡体内 HTML（内部面——逐字承 `permission.js:28-56`；卡壳 / 事件接线见 `renderApprovalCard`）。
 *  `m` = `{ tool, args?, diff?, owner?, promptId? }`。 */
function approvalCardHtml(m = {}, deps = {}) {
  const t = deps.t ?? coreT
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
  return html
}

/** 逐项审批卡（承 `permission.js:21-77` 构树；`promptId` 落 `data-prompt-id`——host 按 id 路由 /
 *  释放清扫按 id 移除）。返回卡元素（append / scrollIntoView / deny 聚焦留端）。 */
export function renderApprovalCard(m = {}, deps = {}) {
  const t = deps.t ?? coreT
  const el = document.createElement("div")
  el.className = "permission-prompt"
  // §18 C-7：卡携 promptId（host 响应按 id 精确路由 / 释放清扫 permissionWithdrawn 按 id 移除）
  if (m.promptId != null) el.dataset.promptId = String(m.promptId)
  el.setAttribute("role", "alert")
  el.setAttribute("aria-label", t("perm.wantsTo") + " " + m.tool)
  el.innerHTML = approvalCardHtml(m, deps)
  el.querySelector(".view-diff")?.addEventListener("click", () => {
    deps.emit?.("openDiff", { diff: m.diff })
  })
  const reply = (approved) => ({ approved, ...(m.promptId != null ? { promptId: m.promptId } : {}) })
  el.querySelector(".approve").addEventListener("click", () => {
    el.remove()
    deps.emit?.("permissionResponse", reply(true))
  })
  el.querySelector(".approve-all").addEventListener("click", () => {
    el.remove()
    deps.emit?.("permissionResponse", reply("approveAll"))
  })
  el.querySelector(".deny").addEventListener("click", () => {
    el.remove()
    deps.emit?.("permissionResponse", reply(false))
  })
  return el
}

/** 合并批审批卡体内 HTML（内部面——逐字承 `permission.js:93-102`）。`m` = `{ count?, tools?, promptId? }`。 */
function batchApprovalCardHtml(m = {}, deps = {}) {
  const t = deps.t ?? coreT
  const names = (m.tools ?? []).map((x) => escHtml(x?.name ?? "?")).join(", ")
  let html =
    '<div class="permission-prompt-text">' +
    t("perm.batch.wantsTo", { count: String(m.count ?? (m.tools ?? []).length), names }) +
    "</div>"
  html += '<div class="permission-prompt-actions">'
  html += '<button class="approve-all">' + t("perm.approveAll") + "</button>"
  html += '<button class="one-by-one">' + t("perm.batch.oneByOne") + "</button>"
  html += '<button class="deny">' + t("perm.deny") + "</button>"
  html += "</div>"
  return html
}

/** 合并批审批卡（承 `permission.js:86-122`；§16 D-B1）。三按钮载荷同携 `promptId`（逐项卡同形）。 */
export function renderBatchApprovalCard(m = {}, deps = {}) {
  const t = deps.t ?? coreT
  const el = document.createElement("div")
  el.className = "permission-prompt"
  // F-W13（D-W15）：合并卡同携族键 promptId（与逐项卡同族——同一移除选择器
  // `.permission-prompt[data-prompt-id]`；host 释放 permissionWithdrawn 按 id 精确移除）
  if (m.promptId != null) el.dataset.promptId = String(m.promptId)
  el.setAttribute("role", "alert")
  el.innerHTML = batchApprovalCardHtml(m, deps)
  // F-W13：三按钮载荷同携 promptId（逐项卡 `reply` 同形——旧 host 无 id 则只发 choice）
  const reply = (choice) => ({ choice, ...(m.promptId != null ? { promptId: m.promptId } : {}) })
  el.querySelector(".approve-all").addEventListener("click", () => {
    el.remove()
    deps.emit?.("batchPermissionResponse", reply("approveAll"))
  })
  el.querySelector(".one-by-one").addEventListener("click", () => {
    el.remove()
    deps.emit?.("batchPermissionResponse", reply("oneByOne"))
  })
  el.querySelector(".deny").addEventListener("click", () => {
    el.remove()
    deps.emit?.("batchPermissionResponse", reply("deny"))
  })
  return el
}
