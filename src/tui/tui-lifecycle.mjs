/**
 * tui-lifecycle.mjs — TUI 生命周期终端序列（2026-08-31 advisor round1 🔴：index.mjs
 * 超 500 行硬限拆分——启动序列、退出清理序列与退出闭包从 index.mjs 移入本模块）。
 */

import { appendFileSync } from "node:fs"
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

// R25（ARCHITECTURE.md §R25 F-R25a——复审 #1）：TUI 活动态标志——index.mjs 在终端接管
// 处（writeStartupSequence 之后）经 setTuiActive(true) 置位，createExitCleanup 清理后清
// false；bin/thincoder.mjs 崩溃钩子经 restoreTerminalAfterCrash 读同一标志——chat 模式
// stdout 管道不得收 ANSI（误判即污染输出）。默认 false = 未启动（生产零变化——测试缝同源：
// T-R25a.2 注入 mock 走同一 setter）。
let tuiActive = false

/** 置/清 TUI 活动态（TUI 启动接管处与退出清理处调用；测试 env 门注入同走此 setter）。 */
export function setTuiActive(active) {
  tuiActive = active === true
}

/** 读 TUI 活动态（F-2 渲染抑制守卫——render-loop doRender 前查——cleanup 清 false 后不再重绘已恢复的主屏）。 */
export function isTuiActive() {
  return tuiActive
}

/** R25 崩溃恢复：仅 TUI 活动态执行 writeCleanupSequence（复用本模块清理序列——符号锚）。
 *  测试缝（T-R25a.2——env 门注入）：THINCODER_TEST_CLEANUP_OUT 指向文件时序列写入该文件
 *  （观察恢复被调 + stdout 管道零 ANSI）——生产不设该 env → 恒 stdout（零变化）。
 *  @returns {boolean} 是否执行了恢复（false = TUI 未启动——调用方无需处理） */
export function restoreTerminalAfterCrash() {
  if (!tuiActive) return false
  const seamOut = process.env.THINCODER_TEST_CLEANUP_OUT
  if (seamOut) {
    writeCleanupSequence((s) => appendFileSync(seamOut, s, "utf8"))
  } else {
    writeCleanupSequence()
  }
  return true
}

/** 退出清理闭包：保存会话 + 关闭 MCP + 恢复终端。幂等（cleanedUp 守卫）。stdin/write 注入缝（测试锁序——缺省生产零变化）。
 *  F-1 唯一权威序（RESIZE-MOUSE-LEAK-FIX）：① mouseOff DECRST → ② settle ~20ms（DECRST 往返——raw 仍开回显仍关）→
 *  ③ raw off → ④ stdin 排空 → ⑤ 恢复屏幕 → ⑥ 清 TUI 活动态。 */
export function createExitCleanup({ agent, saveSession, closeAllMcp, stdin = process.stdin, write = (s) => process.stdout.write(s) }) {
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
    // ① mouseOff 单独写（DECRST——不整包 writeCleanupSequence）：先于 raw off 停鼠标——消除「回显开而鼠标未停」暴露窗口
    write(ansi.mouseOff)
    // ② settle 20ms：Atomics.wait 同步等（不拆注册点——cleanup 亦挂 process.on("exit") 兜底异常退出——exit 事件仅同步合法）
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20)
    // ③ raw off（DECRST 已被终端处理——无新上报可回显）→ ④ 排空：摘 data 监听 + pause——不依赖限时读——在途已读字节丢弃不归 shell
    stdin.setRawMode(false); stdin.removeAllListeners("data"); stdin.pause()
    // ⑤ writeCleanupSequence 余部（mouseOff 已单写——clearScreen/bracketedPasteOff/…/wrapOn 恢复屏幕）
    write(ansi.clearScreen + ansi.bracketedPasteOff + ansi.keyboardPop + ansi.modifyOtherKeysOff + ansi.mainBuffer + ansi.showCursor + ansi.reset + ansi.wrapOn)
    setTuiActive(false) // ⑥ R25：清理完即清活动态（崩溃钩子不再误判——渲染抑制锚）
  }
}
