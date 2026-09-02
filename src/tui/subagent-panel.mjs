/**
 * subagent-panel.mjs — 运行中子 agent 固定底部面板渲染（AGENT-LOOP.md §7.2.1 D1/D2）。
 *
 * 面板位于 conversation 与 todo 之间（布局顺序 header → conversation → 面板 →
 * todo → picker → permission → queue → input → status），高度完全自适应 = 全部
 * 运行中区块的渲染行数（F2，会话区被挤小）；无运行中区块 → 返回 []（F6 空态，
 * 无悬空分隔线）。子 agent 完成后立即冻结进会话流（subagent-blocks.mjs
 * freezeSubTaskLines，✓ 头 + 可展开，§7.2 D4 现状不变），面板下一帧自然移除
 * 该区块（F5）——本模块只渲染 `!done` 条目。§17 T-S14 中间态例外：挂起期已结算
 * 区块（sub.done && sub.awaitingDigest）冻结被延迟，驻留面板显示
 * "done · awaiting digestion"，池空补发冻结后才移除。
 *
 * 中立模块（D1 评审 #6）：layout.mjs 调 renderSubagentPanel 预计算面板高度
 * （subagentLines → subagentH），render-frame.mjs 直接 put 预计算行（不重复
 * 渲染）——若本函数放 render-frame 会引入 layout↔render-frame 循环依赖。
 *
 * 区块渲染逻辑自 render-conversation.mjs buildConvLines runningSubs 段迁移
 * （§7.2.1 D2）：折叠头 `[▶/⏸ key · model · elapsed · turn] state`（⏸ = 等待
 * 审批态图标，sub.approval 非空时显示）+ tail 3；展开态经 fold-block.mjs 公共
 * 组件（renderBlockTimeline + renderExpandedBlock，60% 封顶 + 块内滚动）。
 * 折叠状态 key = `sub-${key}` 跨 turn 保持（D5，与冻结区块同一 key——冻结边界
 * 无缝衔接）。
 */
import { C } from "./ansi.mjs"
import { sliceByWidth, stringWidth } from "./render.mjs"
import { isExpanded, renderBlockTimeline, renderExpandedBlock, foldTailLines } from "./fold-block.mjs"

/**
 * 面板行构建（纯函数）：顶部分隔线 `─` + 各运行中区块（折叠头 + tail 3 /
 * 展开全量）。maxRows = 终端行数（展开态 60% 封顶窗口化）；省略 = 不封顶
 * （单测/无终端环境）。
 * @returns {Array<{text: string, color: string, ...}>}
 */
export function renderSubagentPanel(state, cols, maxRows) {
  const runningSubs = Object.values(state.subTasks ?? {}).filter((s) => !s.done || s.awaitingDigest)
  if (runningSubs.length === 0) return []
  const out = []
  // 面板顶部边界线（现状分隔线语义迁移，§7.2.1 D2/NF2）——面板存在即画线，
  // 无运行区块时面板整体不渲染（F6：无悬空线）。
  out.push({ text: "─".repeat(Math.max(1, cols - 1)), color: C.dim, _skipDimFold: true })
  for (const sub of runningSubs) {
    const foldKey = `sub-${sub.key}`
    // 头部摘要：`[▶ coder#1 · glm-5.3 · 45s · turn 12/100] bash — npm test`
    // ⏸ = 等待审批态（sub.approval 非空，评审 #5 定义）；图标在括号内，
    // 与冻结头 `[✓ …]` 格式统一（任务简报 UI 决策）。
    const icon = sub.approval ? "⏸" : sub.done ? "✓" : "▶"
    const elapsed = Math.floor(((sub.done ? (sub.doneAt ?? Date.now()) : Date.now()) - sub.started) / 1000)
    // 评审 #1 宽度预算：模型名先单独按显示宽度截断（[model] token 原样记录可长
    // 20-30+ 字符，不截断则括号前缀宽度不可预算、状态区被挤出终端右边距）；
    // 再量括号前缀实际显示宽度，状态区按 cols - bracketWidth - 2 截断——整行
    // ≤ cols 铁律（TUI 布局纪律：任何写入帧的行 ≤ cols）。极端窄终端下括号
    // 前缀自身也按 cols-2 截断兜底（状态区宁可让位也不撑破帧）。
    const modelPart = sub.model
      ? ` · ${sliceByWidth(sub.model, Math.max(8, Math.floor(cols / 3)))}`
      : ""
    const turnPart = sub.maxTurns > 0 ? ` · turn ${sub.turn}/${sub.maxTurns}` : ""
    const bracket = sliceByWidth(`[${icon} ${sub.key}${modelPart} · ${elapsed}s${turnPart}]`, Math.max(1, cols - 2))
    const bracketWidth = stringWidth(bracket)
    let statePart
    if (sub.approval) statePart = `等待审批: ${sub.approval}`
    else if (sub.awaitingDigest) statePart = "done · awaiting digestion"
    else if (sub.currentTool) statePart = sub.currentTool
    else statePart = "thinking..."
    const argSummary = sub.currentTool && sub.toolArgs?.command
      ? ` — ${String(sub.toolArgs.command).replace(/\s+/g, " ").trim().slice(0, 60)}`
      : ""
    out.push({
      text: `${bracket} ${sliceByWidth(statePart + argSummary, Math.max(0, cols - 2 - bracketWidth))}`,
      color: C.tool,
      _foldToggle: foldKey,
    })
    if (isExpanded(state, foldKey)) {
      // 展开态：全量活动时间线（per-kind 着色，60% 屏封顶 + 块内滚动——公共组件）。
      const body = renderBlockTimeline(sub.blocks, cols)
      out.push(...renderExpandedBlock({ body, foldKey, state, maxRows, cols, label: "subagent activity" }))
    } else {
      // 折叠态：tail 3 非空 block 行（最近活动），dim。
      for (const line of foldTailLines(sub.blocks)) {
        out.push({ text: `│ ${sliceByWidth(line, cols - 4)}`, color: C.dim })
      }
    }
  }
  return out
}
