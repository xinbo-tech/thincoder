/** /exit command: exit TUI via ctx.exit（F-2——RESIZE-MOUSE-LEAK-FIX——与 Ctrl+C 同退出
 *  形态：cleanup 同步执行 + 延迟 exit——非同派发路径）。不再直调 process.exit(0)（零提前量——
 *  清理押 'exit' 事件）；handleSlash 返回后的无条件 render() 由 render-loop tuiActive 守卫
 *  抑制（cleanup 已清活动态——不把 TUI 帧重绘到已恢复的主屏）。 */
export async function handleExitCommand(ctx) {
  ctx.exit?.() // ctx.exit 由 index.mjs 装配（cleanup + 100ms 延迟 exit）
}
