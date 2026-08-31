/**
 * tui-lifecycle.mjs — TUI 生命周期终端序列（2026-08-31 advisor round1 🔴：index.mjs
 * 超 500 行硬限拆分——启动序列、退出清理序列与退出闭包从 index.mjs 移入本模块）。
 */

import { ansi } from "./ansi.mjs"

/** TUI 启动序列：alt buffer + 隐藏光标 + 鼠标/粘贴/键盘增强 + 禁环绕。
 *  wrapOff（DECRST 7）为 2026-08-31 会诊的最终防线：Ambiguous 宽度字符（│/—/●/▸/…/↑↓）
 *  在中文 locale 终端渲染 2 格而 stringWidth 按 1 格算 → 行实际超宽 → 物理 wrap 污染
 *  下一行 + \x1b[K 清错行 → picker 残影；禁环绕后超宽行硬截断在边距，不可能跨行污染。
 *  每帧 write 再包 wrapOff/wrapOn（render-loop），退出经 writeCleanupSequence 恢复。 */
export function writeStartupSequence(write = (s) => process.stdout.write(s)) {
  write(ansi.altBuffer + ansi.hideCursor + ansi.mouseOn + ansi.bracketedPasteOn + ansi.keyboardPush + ansi.modifyOtherKeysOn + ansi.wrapOff)
}

/** TUI 清理序列：清屏 + 关闭鼠标/粘贴/键盘增强 + 退出 alt buffer + 显示光标 + 恢复环绕。 */
export function writeCleanupSequence(write = (s) => process.stdout.write(s)) {
  write(ansi.clearScreen + ansi.mouseOff + ansi.bracketedPasteOff + ansi.keyboardPop + ansi.modifyOtherKeysOff + ansi.mainBuffer + ansi.showCursor + ansi.reset + ansi.wrapOn)
}

/** 退出清理闭包：保存会话（同步）+ 关闭 MCP 子进程 + 恢复终端。幂等（cleanedUp 守卫）。 */
export function createExitCleanup({ agent, saveSession, closeAllMcp }) {
  let cleanedUp = false
  return () => {
    if (cleanedUp) return
    cleanedUp = true
    // Save session before exit (synchronous write).
    // Archiving to a slot is handled by /new and /session switch — not on every exit,
    // otherwise simply opening and closing the TUI repeatedly would fill all slots with duplicates.
    try {
      saveSession(agent)
    } catch {
      // Save failure shouldn't block exit
    }
    // Kill MCP stdio subprocesses, don't leave orphans
    try {
      closeAllMcp(agent)
    } catch {
      // Can't close? fine, process is exiting anyway
    }
    process.stdin.setRawMode(false)
    writeCleanupSequence()
  }
}
