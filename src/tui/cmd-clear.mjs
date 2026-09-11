/** /clear command: clear screen (confirm to prevent accidental trigger).
 *  ctx: { state, showPicker, render } */
export async function handleClearCommand(ctx) {
  const { state, showPicker, render } = ctx
  if (state.lines.length > 0) {
    const e = await showPicker("Clear screen?", [
      { type: "item", text: "Yes, clear all conversation output", action: "yes" },
      { type: "item", text: "Cancel", action: "no" },
    ], { defaultIndex: 1 })
    if (e?.action === "yes") {
      state.lines = []
      state._linesChars = 0 // TUI-OOM-ROOTCAUSE（§15.3.2）：行集清空 → 字符账同步归零
      state.streaming = ""
      render()
    }
    return
  }
  state.lines = []
  state._linesChars = 0 // TUI-OOM-ROOTCAUSE（§15.3.2）：行集清空 → 字符账同步归零
  state.streaming = ""
  render()
}
