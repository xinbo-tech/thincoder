/**
 * undo-stack.mjs — 写工具副作用前的文件快照（`agent._undoStack`）。
 *
 * 来源 = `thincoder-cli/src/tui/cmd-undo.mjs` 的 `snapshotForUndo` + `MAX_UNDO`——**逐字随迁**
 * （CORE-UNIFICATION §2.5 #149「两阶段执行 + 前置门禁按核内结构归位」；dispatch 的唯一调用点
 * 属核内面，函数本体零 TUI 依赖 ⇒ 按核内结构归位到核；`/undo` 命令面 `handleUndoCommand`
 * 留 CLI 壳——S2 由壳 import 本档）。
 *
 * Tracks write/edit/delete/hashline_edit/apply_patch operations in agent._undoStack.
 */

import { existsSync, readFileSync } from "node:fs"
import { isAbsolute, join } from "node:path"

const MAX_UNDO = 50

/**
 * Snapshot a file before a side-effect tool modifies it.
 * Called from dispatch.mjs before each write/edit/delete/apply_patch/hashline_edit.
 */
export function snapshotForUndo(agent, toolName, args, cwd) {
  if (!agent._undoStack) agent._undoStack = []
  const path = args.path ?? args.file
  if (!path || typeof path !== "string") return

  // 绝对路径直接用（path.join 对绝对段不重置——Windows 反斜杠路径也不按 "/" 切分）；相对路径整段 join(cwd)。
  const abs = isAbsolute(path) ? path : join(cwd, path)
  let backup = null
  try {
    if (existsSync(abs)) {
      backup = readFileSync(abs, "utf8")
    }
  } catch {
    // can't read — maybe binary, skip
    return
  }

  agent._undoStack.push({
    tool: toolName,
    path,
    backup,
    timestamp: Date.now(),
  })
  if (agent._undoStack.length > MAX_UNDO) agent._undoStack.shift()
}

export { MAX_UNDO }
