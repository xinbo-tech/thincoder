import { inputContentWidth } from "./layout.mjs"
import { moveCursorVertical } from "./render.mjs"
import { convMaxScroll } from "./key-handler.mjs"

/** scroll 族之一（2026-09-22 structure-debt §2.1 分族 3 · #226）：PgUp/PgDn 翻页 + 顶部
 *  loadOlder 边界加载；块体自 key-handler.mjs createKeyHandler 逐字搬移（仅去缩进）。
 *  路由 = 分派器 createKeyHandler（守卫 = 原块入口条件 pageup/pagedown）。 */
export function handleScrollKeys(key, ctx) {
  const { state, render, loadOlder } = ctx
  // page scroll
  if (key.name === "pageup") {
    // At the top of the conversation → load the next earlier history page
    // (lazy restore, parity with VS Code's scroll-back loadOlder).
    if (state._hasOlder && loadOlder && state.scroll >= convMaxScroll(state)) {
      loadOlder()
    } else {
      state.scroll += Math.max(1, ((state.dims?.get() ?? {}).rows ?? (process.stdout.rows || 24)) - 8)
    }
    state._followTail = false // 2026-08-31：用户上滚 = 暂停流式跟随
    render()
    return
  }
  if (key.name === "pagedown") {
    state.scroll = Math.max(0, state.scroll - Math.max(1, ((state.dims?.get() ?? {}).rows ?? (process.stdout.rows || 24)) - 8))
    if (state.scroll === 0) state._followTail = true // 滚回底部恢复跟随
    render()
    return
  }
}

/** scroll 族之二（分族 3 · #226）：↑↓ 三规则（TUI-INPUT-BOX.md §3）+ 输入历史导航；
 *  块体逐字搬移（仅去缩进）。路由 = 分派器（守卫 = up/down）。 */
export function handleHistoryKeys(key, ctx) {
  const { state, render } = ctx
  // ↑/↓ 三规则（TUI-INPUT-BOX.md §3——第 31 批）：① 翻历史中恒历史（多行条目不竖移）
  // ② 竖移优先（可视行口径——折行与 \n 同权；显示列保持 + 短行端钳制）③ 边界回落历史（↑）
  // ／无动作（↓）。processing 期：竖移放行（纯编辑——与字符/退格/←→ 同权）、历史导航禁
  // （规则 ①/③ 的历史分支吞——不进入、不切换）。
  if (key.name === "up" || key.name === "down") {
    if (state.historyIndex === -1) { // 规则 ① 优先——翻历史中不竖移
      const cols = (state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80)
      const next = moveCursorVertical(state.input, state.cursor, inputContentWidth(cols), key.name)
      if (next !== null) {
        state.cursor = next // 规则 ②：竖移（草稿/历史指针零涉——D-31.6）
        render()
        return
      }
    }
    if (state.processing) return // 规则 ①/③ 的历史分支吞——processing 期历史导航禁
  }

  // input history（规则 ① 恒历史 + 规则 ③ 边界回落——历史语义零改）
  if (key.name === "up") {
    if (state.history.length) {
      // Save current input as draft when entering history mode (historyIndex === -1).
      // Subsequent edits while in history mode are saved separately (see printable/editing handlers).
      if (state.historyIndex === -1) {
        state._draft = [...state.input]
      }
      state.historyIndex = state.historyIndex === -1 ? state.history.length - 1 : Math.max(0, state.historyIndex - 1)
      state.input = [...state.history[state.historyIndex]]
      state.cursor = state.input.length
      render()
    }
    return
  }
  if (key.name === "down") {
    if (state.historyIndex !== -1) {
      state.historyIndex++
      if (state.historyIndex >= state.history.length) {
        state.historyIndex = -1
        // Restore the stashed draft instead of wiping back to blank
        state.input = state._draft ? [...state._draft] : []
        state._draft = null
      } else {
        state.input = [...state.history[state.historyIndex]]
      }
      state.cursor = state.input.length
      render()
    }
    return
  }
}

/** scroll 族之三（分族 3 · #226）：←→/Home/End 光标移动；块体逐字搬移（仅去缩进）。
 *  路由 = 分派器（守卫 = left/right/home/end）。 */
export function handleCursorKeys(key, ctx) {
  const { state, render } = ctx
  // cursor movement
  if (key.name === "left") {
    state.cursor = Math.max(0, state.cursor - 1)
    render()
    return
  }
  if (key.name === "right") {
    state.cursor = Math.min(state.input.length, state.cursor + 1)
    render()
    return
  }
  if (key.name === "home") {
    state.cursor = 0
    render()
    return
  }
  if (key.name === "end") {
    state.cursor = state.input.length
    render()
    return
  }
}
