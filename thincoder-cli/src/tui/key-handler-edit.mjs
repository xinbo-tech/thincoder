import { C } from "./ansi.mjs"
import { readClipboardText, insertPastedText } from "./clipboard.mjs"

/** 编辑族（2026-09-22 structure-debt §2.1 分族 5 · #226）：Tab 补全 / Ctrl+U 清框 /
 *  退格·删除 / Enter（多行换行 · 挂起单槽 · submit）/ 剪贴板文本与图片粘贴 / 可打印字符；
 *  各块自 key-handler.mjs createKeyHandler 逐字搬移（仅去缩进）。
 *  路由 = 分派器 createKeyHandler 末族（其后无可达分支 —— 块内 return 即终结本次按键）。 */
export function handleEditKeys(str, key, ctx) {
  const { agent, state, render, handleTab, submit, pasteClipboardImage, pushLine } = ctx
  // Tab: slash-command completion (cycle candidates); other input ignored (\t would blow up input box, never inserted directly)
  if (key.name === "tab") {
    handleTab()
    return
  }

  // Ctrl+U: clear entire input box
  if ((key.name === "u" && key.ctrl) || str === "\x15") {
    if (state.historyIndex !== -1) state._draft = [...state.input]
    state.input = []
    state.cursor = 0
    render()
    return
  }

  // editing
  if (key.name === "backspace") {
    if (state.cursor > 0) {
      state.input.splice(state.cursor - 1, 1)
      state.cursor--
      if (state.historyIndex !== -1) state._draft = [...state.input]
      render()
    }
    return
  }
  if (key.name === "delete") {
    if (state.cursor < state.input.length) {
      state.input.splice(state.cursor, 1)
      if (state.historyIndex !== -1) state._draft = [...state.input]
      render()
    }
    return
  }

  if (key.name === "return" || key.name === "enter" || str === "\r") {
    // Multiline newline (docs/design/TUI-INPUT-BOX.md §1.5): Alt+Enter / Shift+Enter
    // (translateShiftEnter) / Ctrl+J — the universal no-protocol fallback.
    if ((key.name === "return" && key.meta) || key.name === "enter") {
      state.input.splice(state.cursor, 0, "\n")
      state.cursor++
      render()
    } else {
      const text = state.input.join("").trim()
      // §17 D-S5/F3/F7 + 偏差 #1 + INPUT-LOCK 单槽化（F-6——2026-09-09）：挂起态
      // （suspended 或释放窗口 _suspPending）Enter = 新回合输入（非打断）——填
      // pendingInput 单槽（至多一条待交接）由挂起会话调度；挂起会话内 busy（含 digest）
      // 提交经 busy 门禁入同槽（F16 §4.1——两分支同槽、同款清理与唤醒）；输入框零干扰（F3）。
      // 槽满（竞态防御——不覆盖不丢失）→ 吞 + 提示，文本保留在输入框。
      if ((state.suspended || state._suspPending) && text && !text.startsWith("/")) {
        state.pendingInput ??= []
        if (state.pendingInput.length > 0) {
          pushLine(`[主会话处理中 —— 已有一条消息待发送，请等其处理完成后再发送]`, C.warn)
          render()
          return
        }
        state.input = []
        state.cursor = 0
        state.history.push(text)
        state.historyIndex = -1
        state._draft = null
        state.pendingInput.push(text)
        state._suspWake?.()
        render()
        return
      }
      submit().catch((e) => pushLine(`[error] ${e.message}`, C.error))
    }
    return
  }

  // Ctrl+V: paste clipboard text into the active text target.
  // Exclude meta (ESC-prefix) so Ctrl+Alt+V — which readline reports as ctrl+meta —
  // falls through to the image-paste branch below instead of being eaten here.
  if (key.ctrl && !key.alt && !key.meta && key.name === "v") {
    ;(async () => {
      const text = await readClipboardText()
      if (text) {
        insertPastedText(state, text)
        render()
      }
    })()
    return
  }

  // Alt+V / Ctrl+Alt+V: paste clipboard image.
  // NOTE: readline reports ESC-prefixed combos as key.meta, NOT key.alt (probe-verified:
  // \x1b + char → { meta: true, alt: false }). Checking key.alt alone is a dead branch —
  // the key fell through to the printable handler which ignores meta keys, so image paste
  // silently did nothing. Accept meta (and alt, for terminals that set it); the text-paste
  // branch above excludes meta so Ctrl+Alt+V reaches here.
  const isPasteImage = key.name === "v" && (key.alt || key.meta)
  if (isPasteImage) {
    pasteClipboardImage(agent).catch((e) => pushLine(`[error] ${e.message}`, C.error))
    return
  }

  // printable characters / paste (str may contain multiple chars at once); Tab always converted to two spaces (\t has variable display width, would blow up input box)
  // \r\n may leak through in Windows raw mode and scramble the display
  if (str && !key.ctrl && !key.meta) {
    const chars = [...str.replace(/[\r\n]+/g, "").replace(/\t/g, "  ")]
    state.input.splice(state.cursor, 0, ...chars)
    state.cursor += chars.length
    if (state.historyIndex !== -1) state._draft = [...state.input]
    render()
  }
}
