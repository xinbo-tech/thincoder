import { computeLayout } from "./layout.mjs"
import { handleSearchKey } from "./key-handler-search.mjs"
import { countConvLines } from "./render-conversation.mjs"
import { handlePermissionMode, handleQuestionMode, handleInterruptMode } from "./key-modes.mjs"
import { handleCtrlCFamily } from "./key-handler-ctrlc.mjs"
import { handlePickerKeys, handleWizardKeys } from "./key-handler-modals.mjs"
import { handleScrollKeys, handleHistoryKeys, handleCursorKeys } from "./key-handler-scroll.mjs"
import { handleBusyEnter } from "./key-handler-busy.mjs"
import { handleEditKeys } from "./key-handler-edit.mjs"

/** 第 33 批（TUI §14.3(e)——attention 清位）：输入即在场——仅当原值为真时置假 + `render()`
 *  （已假则零副作用、零重绘）。键盘入口与本文件（`onKeypress`）与鼠标输入路径（index.mjs
 *  stdin data 处理器）两点共用；blocked 两态无需清位（实时派生）。
 *  @returns {boolean} 本次是否发生清位 */
export function clearAttention(state, render) {
  if (!state.attentionAwaiting) return false
  state.attentionAwaiting = false
  render()
  return true
}

/** Current conversation max scroll offset (display lines beyond the visible panel). */
export function convMaxScroll(state) {
  const d = state.dims ? state.dims.get() : {} // Single source (ConPTY instability, 2026-08-30) — cached dims
  const cols = d.cols ?? ((state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80))
  const rows = d.rows ?? (process.stdout.rows || 24)
  const layout = computeLayout(state, { cols, rows })
  return Math.max(0, countConvLines(state, cols, rows) - layout.panels.conversation.h)
}

/** Keyboard event dispatch: permission confirm / question / picker / wizard / edit / scroll / history / paste.
 *  Extracted from index.mjs.
 *  2026-09-22 structure-debt §2.1（#226）：五族块体迁出为 key-handler-{ctrlc,modals,scroll,busy,edit}.mjs
 *  （逐字搬移）；本档保留 attention 清位 / 三模态前置委派 / F1 表 / Ctrl+I 入口 / interrupt 模态 +
 *  五族顺序委派（委派守卫 = 原块入口条件；族体自持同一入口判定，可直接调用）。
 *  ctx: { agent, state, render, renderPickerLines, popPicker,
 *         handleSlash, handleTab, submit, pasteClipboardImage,
 *         wizardChooseProvider, wizardSubmitText, cancelWizard, wizardProviderItems,
 *         renderWizard, pushLine, cleanup, showPicker } */
export function createKeyHandler(ctx) {
  const { agent, state, render, pushLine, showPicker } = ctx

  return function onKeypress(str, key = {}) {
    // 第 33 批（TUI §14.3(e) 键盘点）：模态分派**之前**——任意按键 = 用户在场 ⇒ 清 attention
    // 位（仅复位呈现态字段，按键语义 / 模态判定 / busy 门禁零改）。
    clearAttention(state, render)
    // permission confirm: y/n/a (a = approve + AUTO ON); batch (§16 D-B1): a/o/n (Esc = deny)
    // ——模态实现 key-modes.mjs handlePermissionMode（2026-09-03 D-S4）
    if (handlePermissionMode(str, key, { state, agent, pushLine, render })) return

    // question tool callback: free text / option selection——模态实现
    // key-modes.mjs handleQuestionMode（D-S4）
    if (handleQuestionMode(str, key, { state, pushLine, render })) return

    // Search mode: Ctrl+F to enter, Ctrl+N/Ctrl+P (or Ctrl+G/Ctrl+R) navigate, Esc exit
    if (handleSearchKey(str, key, state, render)) return

    // 序 1：Ctrl+C 族（key-handler-ctrlc.mjs）——picker 取消 / 武装窗口全停 / 挂起态两级中止 /
    // 回合 interrupt / 空闲退出武装（守卫 = 原块入口条件）
    if (key.ctrl && key.name === "c") { handleCtrlCFamily(str, key, ctx); return }

    // F1: 显示快捷键帮助
    if (key.name === "f1" && !state.picker && !state.permission && !state.question) {
      showPicker("Keyboard Shortcuts", [
        { type: "item", text: "Ctrl+C — Cancel/Abort; first press stops the turn (or arms), twice within 3s stops all / exits" },
        { type: "item", text: "Ctrl+I — Interrupt and inject message" },
        { type: "item", text: "Ctrl+F — Search conversation history" },
        { type: "item", text: "Shift+Enter / Ctrl+J — Insert newline (multiline input)" },
        { type: "item", text: "Alt+V — Paste clipboard image" },
        { type: "item", text: "Ctrl+U — Clear input line" },
        { type: "item", text: "Esc — Cancel current input/picker" },
        { type: "item", text: "↑/↓ — Navigate input history" },
        { type: "item", text: "PgUp/PgDn — Scroll conversation" },
        { type: "item", text: "Enter — Send message or confirm selection" },
        { type: "item", text: "F1 — Show this help" },
      ])
      return
    }

    // Ctrl+I (or Tab during processing): interrupt and inject a message
    if ((key.ctrl && !key.alt && key.name === "i") || (key.name === "tab" && state.processing && !state.interruptPrompt)) {
      if (state.processing && state.controller && !state.interruptPrompt) {
        // 注入框状态模型（第 31 批——TUI-INPUT-BOX.md §1 不变量 9）：{ chars, cursor }，空态 = { chars: [], cursor: 0 }
        state.interruptPrompt = { chars: [], cursor: 0 }
        render()
      }
      return
    }

    // Interrupt prompt mode: type message, Enter to inject, Esc to cancel——模态实现
    // key-modes.mjs handleInterruptMode（D-S4）
    if (handleInterruptMode(str, key, { state, pushLine, render })) return

    // 序 2：模态族（key-handler-modals.mjs）——picker 导航 / 初始配置 wizard
    if (state.picker) { handlePickerKeys(str, key, ctx); return }
    if (state.wizard) {
      // 守卫 = wizard 块内返回分支（provider 步恒返回；文本步仅 escape / return / ↑↓ / PgUp·PgDn 返回，
      // 其余编辑键落空至编辑族 —— 守卫项与 key-handler-modals.mjs 块内返回点逐条对应）
      const w = state.wizard
      if (w.step === "provider" || key.name === "escape" || key.name === "return" ||
          key.name === "up" || key.name === "down" || key.name === "pageup" || key.name === "pagedown") {
        handleWizardKeys(str, key, ctx)
        return
      }
    }

    // 序 3：scroll 族（key-handler-scroll.mjs）——PgUp/PgDn 翻页（含 loadOlder 边界加载）/
    // ↑↓ 三规则 + 历史导航 / ←→·Home·End 光标
    if (key.name === "pageup" || key.name === "pagedown") { handleScrollKeys(key, ctx); return }
    if (key.name === "up" || key.name === "down") { handleHistoryKeys(key, ctx); return }
    if (key.name === "left" || key.name === "right" || key.name === "home" || key.name === "end") { handleCursorKeys(key, ctx); return }

    // 序 4：busy 门禁（key-handler-busy.mjs）——Enter 单槽受理 + 吞面四 / Tab 吞
    // （守卫 = busy 块内返回条件：processing 期仅 tab 与无 meta 的 Enter/回车 被吞，余键落空至编辑族）
    if (state.processing && (key.name === "tab" || ((key.name === "return" && !key.meta) || (str === "\r" && !key.meta)))) {
      handleBusyEnter(str, key, state, ctx)
      return
    }

    // 序 5：编辑族（key-handler-edit.mjs）——Tab 补全 / Ctrl+U 清框 / 退格·删除 / Enter 提交 /
    // 剪贴板文本与图片粘贴 / 可打印字符（末族：其后无可达分支）
    handleEditKeys(str, key, ctx)
  }
}
