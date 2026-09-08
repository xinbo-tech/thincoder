/**
 * cmd-undo.mjs — /undo command: revert recent file modifications
 *
 * Tracks write/edit/delete/hashline_edit/apply_patch operations in agent._undoStack.
 * /undo opens a picker to select and revert an operation.
 */

import { existsSync, writeFileSync, unlinkSync, readFileSync } from "node:fs"
import { isAbsolute, join } from "node:path"
import { ansi, C } from "./ansi.mjs"

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

export async function handleUndoCommand(ctx) {
  const { agent, pushLine, showPicker } = ctx
  const stack = agent._undoStack ?? []

  if (stack.length === 0) {
    pushLine("[undo] Nothing to undo — no file modifications tracked yet.", C.dim)
    return
  }

  const entries = [
    { type: "header", text: `${stack.length} operation(s) available to undo (most recent first)` },
    ...stack.map((item, i) => {
      const relIdx = stack.length - i
      const time = new Date(item.timestamp).toLocaleTimeString()
      const preview = item.backup === null
        ? "(was created — undo will delete)"
        : `(${item.backup.split("\n").length} lines — undo will restore)`
      return {
        type: "item",
        text: `#${relIdx} ${item.tool}: ${item.path} ${preview} — ${time}`,
        idx: i,
      }
    }),
  ]

  const e = await showPicker("Undo", entries)
  if (!e) return
  const item = stack[e.idx]
  const abs = isAbsolute(item.path) ? item.path : join(agent.cwd, item.path)

  try {
    if (item.backup === null) {
      // File was created — undo deletes it
      if (existsSync(abs)) unlinkSync(abs)
    } else {
      // File was modified — undo restores original
      writeFileSync(abs, item.backup, "utf8")
    }
    // Remove this and all newer entries (can't undo out of order)
    stack.splice(e.idx)
    pushLine(`[undo] Reverted: ${item.tool} ${item.path}`, C.tool)
  } catch (err) {
    pushLine(`[undo] Failed to revert ${item.path}: ${err.message}`, C.error)
  }
}
