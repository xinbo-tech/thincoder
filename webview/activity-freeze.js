/**
 * activity-freeze.js — 活动块冻结叶（ACTIVITY-SPLIT——freeze 折叠 + 落流 + preview）。
 * 单一权威：freezeBlock（终态翻/class 换/⏹ 移除/落流 DOM move——普通终态尾推、
 * settled 锚 freezeInsertPoint 插 digest 报告前——锚被 150 裁 isConnected=false →
 * 尾推退化）+ appendPreview（冻结报告 preview ≤8 行×120 字符——CLI parity——
 * escalate/stopped 无）+ preview 尺寸常量。freezeSettledBlocks 批冻驱动留编排层
 * （按 settled 行表驱动——若随本叶出移则需 freeze import 核心成环——防环定论）。
 * 依赖：state.js（ctx.messagesEl）+ activity-view.js（refreshBlock/updateAreaVisibility/
 * ensureTicker）——不依赖编排层 activity.js；经 activity.js hub re-export 对外。
 * 导出：freezeBlock（freezeInsertPoint/appendPreview 私有）。
 */
import { ctx } from "./state.js"
import { refreshBlock, updateAreaVisibility, ensureTicker } from "./activity-view.js"

const PREVIEW_LINES = 8
const PREVIEW_LINE_CHARS = 120

// ─── Freeze → 落流（F-4：CLI _freezeAt DOM 版——普通终态尾推 / settled 锚插）──

/** 落流插入点（settled 锚插用）：自锚向后 walk——同锚且 settle 更早的已冻结块
 *  （及其紧跟 preview）属于"应排在本块之前"的插入组——跳过；遇同锚 settle 更晚的
 *  冻结块/其他内容（digest 报告等）即停——本块插其前。任意到达序（digest 补发
 *  done = settle 升序；freezeSettledBlocks 退出批 = 已按 settleSeq 排序）下同锚
 *  相对序都 = settle 序（后 settle 先插进组——相对序 = settle 序——设计定论）。 */
function freezeInsertPoint(anchor, meta) {
  let el = anchor.nextSibling
  while (el) {
    const m = el._subMeta
    if (m?.frozen && m._freezeAtEl === anchor && (m.settleSeq ?? 0) < meta.settleSeq) {
      el = el.nextSibling
      if (el?.classList?.contains("sub-report-preview")) el = el.nextSibling
      continue
    }
    break
  }
  return el
}

/** Fold a live block AND MOVE it into the #messages flow (F-4 — B1 原地折叠的
 *  修正反转：DOM move 红线从"无 move"反转为"落流必 move"——区外冻结块 = 会话流
 *  历史一部分——150 裁剪只数冻结——区为纯 live 面): terminal status flip, class
 *  sub-live → sub-frozen, collapse (open=false), ⏹ removal, header refresh +
 *  dim report preview inserted right after the block in the flow (CLI parity;
 *  escalate excluded, stopped excluded). Plain terminals (never settled): tail
 *  push (appendChild — CLI append parity). §17 settled parkers: insert at
 *  meta._freezeAtEl 后（digest 报告前）——锚被 150 裁（isConnected=false）→ 尾推
 *  退化（⑫）。不强制滚动（折叠单行落定——不调 maybeScrollDown）。 */
export function freezeBlock(block, kind) {
  const meta = block._subMeta
  if (!meta || meta.frozen) return
  meta.status = kind === "stopped" ? "cancelled" : kind === "error" ? "error" : "done"
  meta.frozen = true
  meta.doneAt = meta.doneAt ?? Date.now()
  block.classList.remove("sub-live")
  block.classList.add("sub-frozen")
  block.open = false
  block.querySelector(".sub-stop-btn")?.remove()
  refreshBlock(block)
  // 落流（DOM move——活动区 → #messages）: 区内移除由 insertBefore/appendChild 隐含。
  const target = ctx.messagesEl ?? block.parentNode
  if (target) {
    if (meta._freezeAtEl?.isConnected) target.insertBefore(block, freezeInsertPoint(meta._freezeAtEl, meta))
    else target.appendChild(block) // 普通终态/锚被裁（⑫ 尾推退化）
  }
  updateAreaVisibility()
  if (kind === "done" || kind === "error") appendPreview(block) // stopped = interrupted — no report preview (CLI parity)
  ensureTicker()
}

/** Frozen report preview — last "text" row's first ≤8 lines, dim, in the flow
 *  (CLI tool-events.mjs:187-191 parity). escalate: no preview (legacy surface). */
function appendPreview(block) {
  const meta = block._subMeta
  if (!meta || meta.role === "escalate") return
  const content = block.querySelector(".advisor-content")
  if (!content) return
  const rows = [...content.children]
  // The final report = the last text-kind row (think rows excluded; tool rows
  // are activity, not report). Text rows merge same-kind runs, so the last one
  // holds the whole tail answer.
  let report = null
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].classList.contains("advisor-text") && rows[i].dataset.kind === "text") { report = rows[i].textContent; break }
  }
  if (!report || !report.trim()) return
  const lines = report.split("\n").map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return
  const preview = lines.slice(0, PREVIEW_LINES).map((l) => l.length > PREVIEW_LINE_CHARS ? l.slice(0, PREVIEW_LINE_CHARS - 1) + "…" : l).join("\n")
  const div = document.createElement("div")
  div.className = "sub-report-preview"
  div.textContent = preview + (lines.length > PREVIEW_LINES ? `\n… (${lines.length - PREVIEW_LINES} more lines)` : "")
  block.insertAdjacentElement("afterend", div)
}
