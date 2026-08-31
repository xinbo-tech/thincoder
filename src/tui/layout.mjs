/**
 * layout.mjs — TUI layout engine (pure function)
 * Computes position and height of each panel from state + terminal dimensions.
 * Does not modify state — side effects are performed by the caller before rendering.
 *
 *   header → conversation → subagent 面板 → todo → picker → permission → queue → input → status
 * Running subagent activity renders in a FIXED bottom panel between the
 * conversation and the todo panel (AGENT-LOOP.md §7.2.1) — full adaptive height
 * (the conversation shrinks); compressed away first on small terminals (to 0 =
 * hidden, data stays in the buffer). Done children are frozen into the
 * conversation stream (§7.2 D4, unchanged). Output panels abolished (§7.2 D6).
 * Fixed panels deducted first, conditional panels allocated by priority, remaining space to conversation.
 */
import { layoutInput, wrapText } from "./render.mjs"
import { QUESTION_CUSTOM } from "./interaction.mjs"
import { renderSubagentPanel } from "./subagent-panel.mjs"

/** 防御：question options 声明为 string[]，但 LLM 可能误传对象；取 label/text/title 兜底，避免渲染 "[object Object]"。 */
function optText(opt) {
  if (typeof opt === "string") return opt
  return opt?.label ?? opt?.text ?? opt?.title ?? String(opt)
}


const MAX_INPUT_LINES = 5
const MAX_TASK_LINES = 5
const QWIN = 5

/**
 * Computes layout. Returns panel coordinates + precomputed content (height-affecting parts).
 * Pure function: does not modify state.
 */
export function computeLayout(state, { cols, rows }) {
  const W = Math.max(20, cols - 1)

  // --- input box ---
  const inputBuf = state.search ? [...state.search.query] : (state.interruptPrompt ? [...state.interruptPrompt.text] : state.input)
  const inputCursor = state.search ? inputBuf.length : (state.interruptPrompt ? inputBuf.length : state.cursor)
  const inputLayout = layoutInput(inputBuf, inputCursor, W - 4)
  let inputOffset = 0
  if (inputLayout.lines.length > MAX_INPUT_LINES) {
    inputOffset = Math.min(inputLayout.cursorLine, inputLayout.lines.length - MAX_INPUT_LINES)
  }
  const inputLines = inputLayout.lines.slice(inputOffset, inputOffset + MAX_INPUT_LINES)
  let boxLines = inputLines
  if (state.question) {
    const q = state.question
    if (q.options.length > 0) {
      const sel = q.selected ?? 0
      const start = Math.max(0, Math.min(sel - 2, q.options.length - QWIN))
      boxLines = q.options.slice(start, start + QWIN).map((opt, i) =>
        (start + i === sel ? "▸ " : "  ") + (opt === QUESTION_CUSTOM ? "✍ Custom answer…" : optText(opt)))
    } else {
      boxLines = ["▸ " + (q.answer ?? "")]
    }
  }
  const inputBoxH = boxLines.length + 2

  // --- fixed panels ---
  const headerH = 1
  const statusH = 1

  // --- conditional panels ---
  const overlay = state.picker ?? state.wizard
  const pickerH = overlay ? Math.min(overlay.lines.length + 1, Math.max(6, rows - 12)) : 0

  // Todo
  let visibleTasks
  if (state.tasks.length <= MAX_TASK_LINES) {
    visibleTasks = state.tasks
  } else {
    const inProgress = state.tasks.filter((t) => t.status === "in_progress")
    const pending = state.tasks.filter((t) => t.status === "pending")
    const done = state.tasks.filter((t) => t.status === "done")
    visibleTasks = [...inProgress, ...pending, ...done].slice(0, MAX_TASK_LINES)
  }
  // +1 for the divider line separating the todo panel from the conversation
  // (user request 2026-08-30).
  const taskPanelH = visibleTasks.length > 0 ? visibleTasks.length + 1 : 0
  // Squeeze target: the divider line yields first under small terminals (the
  // task rows themselves never compress away — put() truncates by panel h).

  // Subagent panel (§7.2.1 D1): RUNNING blocks only, between conversation and
  // todo. Height = the FULL rendered height of every running block (F2 — fully
  // adaptive, no cap; the conversation shrinks accordingly). Precomputed here
  // via renderSubagentPanel (neutral module, no layout↔render-frame cycle);
  // render-frame puts `subagentLines` directly (no double render). Done
  // children are frozen into state.lines (subagent-blocks.mjs
  // freezeSubTaskLines) and excluded here — the panel only shows running blocks.
  let subagentLines = []
  let subagentH = 0
  if (Object.values(state.subTasks ?? {}).some((s) => !s.done)) {
    subagentLines = renderSubagentPanel(state, cols, rows)
    subagentH = subagentLines.length
  }

  // Permission preview (height depends on wrapped content)
  let permPreviewLines = []
  let permPreviewH = 0
  if (state.permission) {
    const maxLines = Math.min(8, Math.max(1, rows - 10))
    outer: for (const l of state.permissionPreview) {
      for (const wrapped of wrapText(`  ${l}`, W - 1)) {
        if (permPreviewLines.length >= maxLines) break outer
        permPreviewLines.push(wrapped)
      }
    }
    permPreviewH = 1 + permPreviewLines.length // 1 for header line
  }

  // Queue preview (1 line when queue has items and processing)
  const queueH = state.queue.length > 0 && state.processing ? 1 : 0

  // --- elastic panel: conversation takes remaining space ---
  const fixedH = headerH + inputBoxH + statusH + pickerH + taskPanelH + permPreviewH + queueH + subagentH
  let convH = Math.max(1, rows - fixedH)

  // 小终端高度补偿：subagent 面板最先让位（可至 0 隐藏，活动仍进缓冲区不丢），
  // 再压 conversation 到最小 1 行，再压 picker 到最小 3 行，仍溢出再压
  // permission preview 到最小 1 行（仅标题）——输入框/状态栏/会话区保留。
  let subagentFinalH = subagentH
  let pickerFinalH = pickerH
  let permFinalH = permPreviewH
  let todoFinalH = taskPanelH
  const overflow = fixedH + convH - rows
  if (overflow > 0) {
    // 压缩链第 1 级（§7.2.1 NF1/评审 #2 措辞统一）：subagent 面板最先让位——
    // 可压缩至 0 隐藏（运行中活动仍在缓冲区不丢），输入框/状态栏/会话区不可挤没。
    let afterSub = fixedH
    if (subagentH > 0) {
      subagentFinalH = Math.max(0, subagentH - overflow)
      afterSub = fixedH - subagentH + subagentFinalH
      convH = Math.max(1, rows - afterSub)
    }
    // 压缩链第 2/3 级（既有逻辑）：picker → 最小 3 行，permission → 最小 1 行
    const overflow2 = afterSub + convH - rows
    if (overflow2 > 0) {
      if (pickerH > 0) {
        pickerFinalH = Math.max(Math.min(3, pickerH), pickerH - overflow2)
      }
      const afterPicker = afterSub - pickerH + pickerFinalH
      convH = Math.max(1, rows - afterPicker)
      const remaining = afterPicker + convH - rows
      if (remaining > 0 && permPreviewH > 0) {
        permFinalH = Math.max(1, permPreviewH - remaining)
        convH = Math.max(1, rows - (afterPicker - permPreviewH + permFinalH))
      }
      // 压缩链末级：todo 面板的分隔线行让位（任务行保留——put 按 h 截断自动
      // 丢弃第一行的分隔线，2026-08-30 用户请求加的 divider 不得在小终端挤掉输入框）。
      const afterPerm = afterPicker - permPreviewH + permFinalH
      const finalOverflow = afterPerm + convH - rows
      if (finalOverflow > 0 && taskPanelH > visibleTasks.length) {
        todoFinalH = Math.max(visibleTasks.length, taskPanelH - finalOverflow)
        convH = Math.max(1, rows - (afterPerm - taskPanelH + todoFinalH))
      }
    }
  }

  // --- Y coordinates (0-indexed, +1 when used with ANSI) ---
  let y = 0
  const header = { y, h: headerH }; y += headerH
  const conversation = { y, h: convH }; y += convH
  const subagent = subagentFinalH > 0 ? { y, h: subagentFinalH } : null; y += subagentFinalH
  const todo = todoFinalH > 0 ? { y, h: todoFinalH } : null; y += todoFinalH
  const picker = pickerFinalH > 0 ? { y, h: pickerFinalH } : null; y += pickerFinalH
  const permission = permFinalH > 0 ? { y, h: permFinalH } : null; y += permFinalH
  const queue = queueH > 0 ? { y, h: queueH } : null; y += queueH
  const inputBox = { y, h: inputBoxH }; y += inputBoxH
  const status = { y, h: statusH }

  return {
    W, cols, rows,
    panels: { header, conversation, subagent, picker, todo, permission, queue, inputBox, status },
    // precomputed content (affects height, reused during render)
    inputLayout,
    inputOffset,
    boxLines,
    visibleTasks,
    permPreviewLines,
    subagentLines,
    overlay,
  }
}

/**
 * §7.2.1 评审 #4：面板部分压缩（subagentFinalH < subagentLines.length）时 render-frame
 * 实际显示的行——**保底截断**：分隔线 + 末尾 (h-1) 行（最新启动区块优先；小终端上仍
 * 能看到最新子 agent 活动，旧 slice(0,h) 保留顶部会把最新活动裁掉）。分隔线始终保留
 * （面板边界语义）。h ≥ 全长 → 原样；h = 0 → []（layout 侧 panels.subagent 已为 null，
 * 防御分支）；h = 1 → 只显示分隔线（极端小终端）。
 */
export function subagentVisibleLines(subagentLines, h) {
  if (h >= subagentLines.length) return subagentLines
  if (h <= 0) return []
  if (h === 1) return [subagentLines[0]]
  return [subagentLines[0], ...subagentLines.slice(-(h - 1))]
}

/** 与 subagentVisibleLines 同一几何契约：可见面板行（0-based 行内坐标）→
 *  subagentLines 索引（mouse 命中映射用——保底截断后可见行 ≠ 前 h 行）；
 *  localRow 越界 → -1。 */
export function subagentLineIndex(subagentLines, h, localRow) {
  if (localRow < 0 || localRow >= h) return -1
  if (h >= subagentLines.length) return localRow
  if (localRow === 0) return 0
  return subagentLines.length - h + localRow
}
