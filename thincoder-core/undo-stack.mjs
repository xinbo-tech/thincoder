/**
 * undo-stack.mjs — 写工具副作用前的文件快照（`agent._undoStack`）。
 *
 * 来源 = `thincoder-cli/src/tui/cmd-undo.mjs` 的 `snapshotForUndo` + `MAX_UNDO`——**逐字随迁**
 * （CORE-UNIFICATION §2.5 #149「两阶段执行 + 前置门禁按核内结构归位」；dispatch 的唯一调用点
 * 属核内面，函数本体零 TUI 依赖 ⇒ 按核内结构归位到核；`/undo` 命令面 `handleUndoCommand`
 * 留 CLI 壳——S2 由壳 import 本档）。
 *
 * 双上界（#863 · TUI-COMMANDS.md §5.3）：单条备份超 `MAX_UNDO_BYTES` ⇒ **oversize 占位**条目
 * （`oversize: true` · `backup: null`——列表可见 · 不可回退；与「文件创建」态靠 `oversize` 字段分判，
 * 消费面 = `cmd-undo.mjs` 先判该字段再判 `backup === null`）；总量超 `MAX_UNDO_TOTAL_BYTES`
 * ⇒ 逐最旧驱逐（条数上限 `MAX_UNDO` 保留）。
 *
 * Tracks write/edit/delete/hashline_edit/apply_patch operations in agent._undoStack.
 */

import { existsSync, readFileSync, statSync } from "node:fs"
import { isAbsolute, join } from "node:path"

const MAX_UNDO = 50
const MAX_UNDO_BYTES = 10_000_000             // 10 MB — 单条备份上界（= tools/file.mjs 大档 read 守卫同值）
const MAX_UNDO_TOTAL_BYTES = 64_000_000       // 64 MB — 备份总预算（超限逐最旧驱逐）

/** 条目预算字节数（oversize 占位 ∥ 文件创建态（backup = null）不占预算）。 */
const backupBytes = (e) => (typeof e?.backup === "string" ? Buffer.byteLength(e.backup, "utf8") : 0)

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
  let oversize = false
  try {
    if (existsSync(abs)) {
      if (statSync(abs).size > MAX_UNDO_BYTES) oversize = true // 大档不入内存——占位条目（与「文件创建」态分判）
      else backup = readFileSync(abs, "utf8")
    }
  } catch {
    // can't read — maybe binary, skip
    return
  }

  agent._undoStack.push(oversize
    ? { tool: toolName, path, backup: null, oversize: true, timestamp: Date.now() }
    : { tool: toolName, path, backup, timestamp: Date.now() })
  if (agent._undoStack.length > MAX_UNDO) agent._undoStack.shift()
  // 总量上界：超限逐最旧驱逐（按字节预算计——条数上界保留）。
  let total = agent._undoStack.reduce((n, e) => n + backupBytes(e), 0)
  while (total > MAX_UNDO_TOTAL_BYTES && agent._undoStack.length > 0) {
    total -= backupBytes(agent._undoStack.shift())
  }
}

export { MAX_UNDO, MAX_UNDO_BYTES, MAX_UNDO_TOTAL_BYTES }
