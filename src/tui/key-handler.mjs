import { ansi, C } from "./ansi.mjs"
import { readClipboardText, insertPastedText } from "./clipboard.mjs"
import { computeLayout, inputContentWidth } from "./layout.mjs"
import { moveCursorVertical } from "./render.mjs"
import { handleSearchKey } from "./key-handler-search.mjs"
import { countConvLines } from "./render-conversation.mjs"
import { handlePermissionMode, handleQuestionMode, handleInterruptMode } from "./key-modes.mjs"

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
 *  ctx: { agent, state, render, renderPickerLines, popPicker,
 *         handleSlash, handleTab, submit, pasteClipboardImage,
 *         wizardChooseProvider, wizardSubmitText, cancelWizard, wizardProviderItems,
 *         renderWizard, pushLine, cleanup, showPicker } */
export function createKeyHandler(ctx) {
  const { agent, state, render, popPicker, renderPickerLines, handleSlash, handleTab, submit, pasteClipboardImage, wizardChooseProvider, wizardSubmitText, cancelWizard, wizardProviderItems, renderWizard, pushLine, cleanup, showPicker, loadOlder } = ctx

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

    if (key.ctrl && key.name === "c") {
      // picker 打开时 Ctrl+C = 取消当前 picker（等同 Esc），不杀进程
      if (state.picker) {
        popPicker(null)
        return
      }
      // §17.6（2026-09-03）：武装窗口内第二次 Ctrl+C = 显式全停（D-C4 /abort 语义）。
      // 在状态路由前检查（picker 取消分支例外——picker 打开时 Ctrl+C 语义 = 取消
      // picker，武装让位；场景极窄——3s 窗口内需另有 picker 被打开）——两次按下之间
      // 状态会迁移（首按停回合 → 释放窗口/挂起会话启动），武装必须跨态桥接：只查挂起
      // 分支会让非挂起 processing 首按后的二按落入空闲退出分支（三按误退出应用）。
      if (state.suspAbortArmed) {
        if (ctx.suspArmTimer) clearTimeout(ctx.suspArmTimer)
        state.suspAbortArmed = false
        // 无可停目标（无 processing 回合 / 无会话 abort 集合 / 未挂起）时不吞键：
        // 首按停的是普通回合（无后台池）——二按落回下方空闲退出分支（exitArmed 双
        // 确认），不打印误导性的 "[Aborting background subagents…]"（advisor round1
        // 🟡——停回合后连按退出的第二次按下被空转吞掉 → 退出从 3 按变 4 按）。
        const hasStopTarget = (state.processing && state.controller) ||
          (agent._sessionAbortAll?.length ?? 0) > 0 ||
          (agent._sessionAbort != null && !agent._sessionAbort.signal.aborted) ||
          state.suspended
        if (hasStopTarget) {
          // 当前回合平 abort（无 interrupt——命中 agent.mjs 回合收尾清池分支——全停）
          // §20.3 站点 #11（第 24 批）：整批 / 会话级停 = stop（reason 载荷）
          if (state.processing && state.controller) state.controller.abort({ abortTrigger: "stop", abortDetail: "session-stop" })
          // 会话 abort 集合 = 链条内全部 controller（含 Ctrl+I/ContinueError 重建的旧
          // controller——children 不逃逸，round1 偏差 #3）。挂起态才标记 _suspAborted +
          // 唤醒 driver（driver 收尾清池）——非挂起语境置位会粘滞阻塞未来挂起会话重入
          // （round2 偏差 #1 语义）。
          for (const c of agent._sessionAbortAll ?? (agent._sessionAbort ? [agent._sessionAbort] : [])) c?.abort({ abortTrigger: "stop", abortDetail: "session-stop" })
          if (state.suspended) {
            state._suspAborted = true
            state._suspWake?.()
          }
          pushLine("[Aborting background subagents…]", C.warn)
          render()
          return
        }
        // 无目标可停 → 落空继续到下方分支（processing 已停 → 空闲态 exitArmed 双确认）
      }
      if (state.suspended) {
        // §17 D-S9 + round2 偏差 #4（2026-09-02）+ §17.6 修订（2026-09-03）：挂起态
        // Ctrl+C = 武装窗口两级中止——一次按键直接清池中止全部后台子代理的误触代价高
        // （digest 刷屏时用户可能只想停住当前回合）；仿空闲态退出武装语义（同下方空闲态
        // exitArmed 双确认分支）。§17.6 修订 ①：中止当前回合的 abort 带 interrupt
        // （无 message）——此前平 abort 命中 agent.mjs 回合收尾清池分支（aborted &&
        // !reason.interrupt → 无条件 _asyncSubagents.clear()），一次首按即误杀全部后台
        // 子代理（2026-09-03 用户两次实测——提示"再按才杀"与实际"一次就全杀"不符）；
        // interrupt 排除清池分支——会话与后台保留（agent-turn 区分：无 message 停回合
        // 不续跑）：
        //   ① 未武装 + 有回合在跑（digest 消化/会话内回合）：仅中止当前回合
        //      （controller.abort({ interrupt: true })）——会话继续、后台子代理不受
        //      影响，回挂起等待；
        //   ② 未武装 + 纯挂起等待：仅提示不清池；
        //   ③ 3s 武装窗口内再次 Ctrl+C：彻底中止——上方统一块（二按语义不变）。
        if (state.processing && state.controller) {
          state.controller.abort({ interrupt: true }) // ① 仅中止当前回合（digest/会话内回合），不碰后台池
          pushLine("[stopped current turn — press Ctrl+C again within 3s to abort all background subagents]", C.warn)
        } else {
          const bgActive = [...(agent._asyncSubagents?.values() ?? [])].filter((e) => e.status === "running").length + (agent._asyncQueue?.length ?? 0)
          pushLine(`[abort] Press Ctrl+C again within 3s to abort all background subagents (${bgActive} running)`, C.warn)
        }
        state.suspAbortArmed = true
        if (ctx.suspArmTimer) clearTimeout(ctx.suspArmTimer)
        ctx.suspArmTimer = setTimeout(() => { state.suspAbortArmed = false }, ctx.exitArmDelay ?? 3000)
        ctx.suspArmTimer.unref?.()
        render()
        return
      }
      if (state.processing && state.controller) {
        // §17.6 D-C1（2026-09-03 紧急修复——processing 态曾无武装窗口，第一按直接平
        // abort() → 命中 agent.mjs 回合收尾清池分支 → 一次 Ctrl+C 误杀全部后台子代理，
        // 用户两次实测被坑）：首按 = interrupt 语义（无 message——停当前回合不续跑——
        // interrupt 排除 agent.mjs 清池分支——后台池保留——agent-turn 区分不重建续跑）
        // + 武装 3s（复用 suspArmTimer/exitArmDelay——与挂起态同构——过期自动复位）；
        // 窗口内再按 = 上方统一块全停（平 abort → agent.mjs 清池）。
        state.controller.abort({ interrupt: true })
        pushLine("[stopped current turn — press Ctrl+C again within 3s to abort all background subagents]", C.warn)
        state.suspAbortArmed = true
        if (ctx.suspArmTimer) clearTimeout(ctx.suspArmTimer)
        ctx.suspArmTimer = setTimeout(() => { state.suspAbortArmed = false }, ctx.exitArmDelay ?? 3000)
        ctx.suspArmTimer.unref?.()
        render()
        return
      }
      // 防误触：空闲态第一次 Ctrl+C 仅提示并武装，窗口内再按才真正退出
      if (!state.exitArmed) {
        state.exitArmed = true
        if (ctx.exitArmTimer) clearTimeout(ctx.exitArmTimer)
        ctx.exitArmTimer = setTimeout(() => { state.exitArmed = false }, ctx.exitArmDelay ?? 3000)
        ctx.exitArmTimer.unref?.()
        pushLine("[exit] Press Ctrl+C again within 3s to exit", C.warn)
        render()
        return
      }
      if (ctx.exitArmTimer) clearTimeout(ctx.exitArmTimer)
      cleanup()
      // 延迟退出可注入（测试传大值并清理定时器，避免定时器在 mock 恢复后调到真 process.exit）
      ctx.exitTimer = setTimeout(() => process.exit(0), ctx.exitDelay ?? 100)
      ctx.exitTimer.unref?.()
      return // review #5 fix: exiting — don't fall through to later branches
    }

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

    // generic list picker: ↑↓/PgUp/PgDn/Home/End 导航，输入即过滤，Enter 选中，Esc 取消
    if (state.picker) {
      const p = state.picker
      const items = p.filteredItems ?? p.entries.filter((e) => e.type === "item")
      // 可视窗高度：直接取 layout 算出的实际 picker 面板高（含小终端 pickerFinalH 压缩），减标题行。
      // 单一数据源，避免与 layout.mjs 公式漂移
      const winH = Math.max(1, (computeLayout(state, { cols: (state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80), rows: (state.dims?.get() ?? {}).rows ?? ((state.dims?.get() ?? {}).rows ?? (process.stdout.rows || 24)) }).panels.picker?.h ?? p.lines.length + 1) - 1)
      const applyFilter = (f) => {
        p.filter = f
        p.index = 0
        p.scroll = 0
        renderPickerLines()
      }
      if (key.name === "escape") {
        popPicker(null)
      } else if (key.name === "up" && items.length) {
        p.index = (p.index - 1 + items.length) % items.length
        renderPickerLines()
      } else if (key.name === "down" && items.length) {
        p.index = (p.index + 1) % items.length
        renderPickerLines()
      } else if (key.name === "pageup" && items.length) {
        p.index = Math.max(0, p.index - winH)
        renderPickerLines()
      } else if (key.name === "pagedown" && items.length) {
        p.index = Math.min(items.length - 1, p.index + winH)
        renderPickerLines()
      } else if (key.name === "home" && items.length) {
        p.index = 0
        renderPickerLines()
      } else if (key.name === "end" && items.length) {
        p.index = items.length - 1
        renderPickerLines()
      } else if (key.name === "backspace") {
        if (p.filter) applyFilter(p.filter.slice(0, -1))
      } else if ((key.name === "return" || key.name === "enter" || str === "\r") && items.length) {
        popPicker(items[p.index]) // 选中即关闭
      } else if (str && !key.ctrl && !key.meta) {
        // 输入即过滤；粘贴的多行文本先去换行（与输入框清洗口径一致），仍含控制字符则整段丢弃
        const text = str.replace(/[\r\n]+/g, "")
        if (text && !/[\x00-\x1f\x7f]/.test(text)) applyFilter(p.filter + text)
      }
      return
    }

    // initial config wizard: menu step ↑↓/Enter/Esc; text step Enter submit, Esc cancel, edit keys fall through to normal input
    if (state.wizard) {
      const w = state.wizard
      if (key.name === "escape") {
        cancelWizard()
        return
      }
      if (w.step === "provider") {
        const items = wizardProviderItems()
        if (key.name === "up" && items.length) {
          w.index = (w.index - 1 + items.length) % items.length
          renderWizard()
        } else if (key.name === "down" && items.length) {
          w.index = (w.index + 1) % items.length
          renderWizard()
        } else if ((key.name === "return" || key.name === "enter" || str === "\r") && items.length) {
          wizardChooseProvider(items[w.index])
        }
        return
      }
      if (key.name === "return") {
        wizardSubmitText()
        return
      }
      // text steps: block scroll/history, remaining edit keys fall through to normal input logic below
      if (key.name === "up" || key.name === "down" || key.name === "pageup" || key.name === "pagedown") return
    }

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

    if (state.processing) {
      // busy 门禁（INPUT-LOCK C'——2026-09-09 + INPUT-LOCK-BEHAVIOR-REVISED——2026-09-09）：
      // processing（含 digest——单一判据）输入不禁——吞提交不吞字符（打字照常回显）；Enter
      // 提交吞 + busy 提示——斜杠同禁发（白名单已删——/exit 也发不出——退出靠 Ctrl+C 终端
      // 层通道——门禁前不误伤）；空 Enter 静默（text 非空才吞）；多行换行
      // （meta/enter——编辑）照常放行。**第 31 批**：↑↓ 不再在此全屏蔽——分流下沉到下方
      // 三规则块（竖移放行 / 历史导航禁；TUI-INPUT-BOX.md §3）；Tab 仍吞（死条件在案——原样保留）。
      if (key.name === "tab") return
      const isSend = (key.name === "return" && !key.meta) || (str === "\r" && !key.meta)
      if (isSend && state.input.join("").trim()) {
        pushLine(`[主会话处理中 —— 消息未发送（回合结束后请重按 Enter）]`, C.warn)
        render()
        return
      }
    }

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
        // pendingInput 单槽（至多一条待交接——busy 提交吞在 L265 门禁先拦，digest 期
        // 不会到这——仅挂起空闲/释放窗口触达）由挂起会话调度；输入框零干扰（F3）。
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
}
