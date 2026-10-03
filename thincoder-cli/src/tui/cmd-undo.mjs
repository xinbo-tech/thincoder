/**
 * cmd-undo.mjs — /undo command: revert recent file modifications
 *
 * Reads the snapshot stack (`agent._undoStack`) — snapshot single point = `thincoder-core/undo-stack.mjs`
 * (`snapshotForUndo`；CLI 侧旧副本已删 —— 单源 = 核档 · CORE-UNIFICATION §2.5 #149）。
 * /undo opens a picker to select and revert an operation; **oversize 占位**（无快照 —— 备份超
 * `MAX_UNDO_BYTES`）**列表可见 · 不可回退**（#863 · `docs/cli/design/TUI-COMMANDS.md` §5.3）。
 */

import { existsSync, writeFileSync, unlinkSync } from "node:fs"
import { isAbsolute, join } from "node:path"
import { MAX_UNDO_BYTES } from "@thincoder/core/undo-stack.mjs"
import { ansi, C } from "./ansi.mjs"

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
      const preview = item.oversize === true
        ? "(no snapshot — too large to undo)"
        : item.backup === null
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
  if (item.oversize === true) {
    // #863：oversize 占位（无快照）——须先判 `oversize` 再判 `backup === null`，否则被当「文件创建」态误删档。
    pushLine(`[undo] Cannot revert ${item.tool} ${item.path} — no snapshot (file larger than ${MAX_UNDO_BYTES / 1_000_000} MB)`, C.warn)
    return
  }
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
