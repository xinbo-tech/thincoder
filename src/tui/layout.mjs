/**
 * layout.mjs — TUI layout engine (pure function)
 * Computes position and height of each panel from state + terminal dimensions.
 * Does not modify state — side effects are performed by the caller before rendering.
 *
 *   header → conversation → todo → picker → permission → queue → input → status
 * Subagent activity renders INSIDE the conversation as collapsible blocks
 * (AGENT-LOOP.md §7.2 D4) — no dedicated subagent/output panels anymore.
 * Fixed panels deducted first, conditional panels allocated by priority, remaining space to conversation.
 */
import { layoutInput, wrapText } from "./render.mjs"
import { QUESTION_CUSTOM } from "./interaction.mjs"

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
  const taskPanelH = visibleTasks.length

  // Subagent activity: rendered inside the conversation (§7.2 D4) — no panel slot.

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
  const fixedH = headerH + inputBoxH + statusH + pickerH + taskPanelH + permPreviewH + queueH
  let convH = Math.max(1, rows - fixedH)

  // 小终端高度补偿：先压 conversation 到最小 1 行，再压 picker 到最小 3 行，
  // 仍溢出再压 permission preview 到最小 1 行（仅标题）。
  let pickerFinalH = pickerH
  let permFinalH = permPreviewH
  const overflow = fixedH + convH - rows
  if (overflow > 0) {
    if (pickerH > 0) {
      pickerFinalH = Math.max(Math.min(3, pickerH), pickerH - overflow)
    }
    const afterPicker = fixedH - pickerH + pickerFinalH
    convH = Math.max(1, rows - afterPicker)
    const remaining = afterPicker + convH - rows
    if (remaining > 0 && permPreviewH > 0) {
      permFinalH = Math.max(1, permPreviewH - remaining)
      convH = Math.max(1, rows - (afterPicker - permPreviewH + permFinalH))
    }
  }

  // --- Y coordinates (0-indexed, +1 when used with ANSI) ---
  let y = 0
  const header = { y, h: headerH }; y += headerH
  const conversation = { y, h: convH }; y += convH
  const todo = taskPanelH > 0 ? { y, h: taskPanelH } : null; y += taskPanelH
  const picker = pickerFinalH > 0 ? { y, h: pickerFinalH } : null; y += pickerFinalH
  const permission = permFinalH > 0 ? { y, h: permFinalH } : null; y += permFinalH
  const queue = queueH > 0 ? { y, h: queueH } : null; y += queueH
  const inputBox = { y, h: inputBoxH }; y += inputBoxH
  const status = { y, h: statusH }

  return {
    W, cols, rows,
    panels: { header, conversation, picker, todo, permission, queue, inputBox, status },
    // precomputed content (affects height, reused during render)
    inputLayout,
    inputOffset,
    boxLines,
    visibleTasks,
    permPreviewLines,
    overlay,
  }
}
