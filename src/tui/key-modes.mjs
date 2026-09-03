/**
 * key-modes.mjs — 按键模态层（2026-09-03 D-S4 自 key-handler.mjs 拆出）：
 * permission / question / interruptPrompt 三种独占模态分支。每个 handler 在模态激活时
 * 消费全部按键（返回 true——含未匹配键，与拆出前无条件 return 语义一致），未激活返回 false。
 * ctx: { state, agent, pushLine, render }（各 handler 按需取用）。
 * 搜索模态另居 key-handler-search.mjs（既有拆分，本批不动）。
 */
import { C } from "./ansi.mjs"
import { readClipboardText, insertPastedText } from "./clipboard.mjs"
import { QUESTION_CUSTOM } from "./interaction.mjs"

/** permission 确认模态：y/n/a（a = approve + AUTO ON）；batch（§16 D-B1）：a/o/n（Esc = deny）。
 *  consume：valid 键或 Esc 走 resolve 分支；其余键静默吞掉（模态独占）。 */
export function handlePermissionMode(str, key, ctx) {
  const { state, agent, pushLine, render } = ctx
  if (!state.permission) return false
  const answer = (str || "").toLowerCase()
  const isContinue = state.permission.name === "continue"
  const isBatch = Boolean(state.permission.batch)
  const validKeys = isContinue ? ["y", "n"] : isBatch ? ["a", "o", "n"] : ["y", "n", "a"]
  if (validKeys.includes(answer) || key.name === "escape") {
    const { resolve, name } = state.permission
    state.permission = null
    state.permissionPreview = []
    state.status = "Processing..."
    if (isBatch) {
      // Merged batch ask: resolve the verdict string; dispatch applies it
      // (approveAll = batch-scope allowance only, NOT the persistent AUTO flag).
      const verdict = answer === "a" ? "approveAll" : answer === "o" ? "oneByOne" : "deny"
      const tone = verdict === "approveAll" ? C.dim : C.error
      pushLine(`  [${verdict === "approveAll" ? "approved" : verdict === "deny" ? "denied" : "one by one"}] ${name}`, tone)
      resolve(verdict)
      render()
      return true
    }
    if (answer === "a" && !isContinue) {
      agent.autoApprove = true
      agent._pendingReminders = agent._pendingReminders ?? []
      agent._pendingReminders.push("[System reminder: AUTO mode is now ON. All tool calls are automatically approved. Use /auto to disable.]")
      pushLine(`  [auto] AUTO ON: tool calls no longer prompt for approval (/auto to disable)`, C.warn)
    }
    const approved = answer === "y" || (answer === "a" && !isContinue)
    // leave trail: record approval/denial in conversation (continue prompt has its own output, don't duplicate)
    if (!isContinue) {
      pushLine(`  [${approved ? "approved" : "denied"}] ${name}`, approved ? C.dim : C.error)
    }
    resolve(approved)
    render()
  }
  return true
}

/** question 工具回调模态：自由文本（type answer, Enter submit, Esc cancel）或选项
 *  （↑↓ select, Enter confirm, Esc cancel——QUESTION_CUSTOM 项切自由文本模式）。
 *  自由文本态编辑键契约见 TUI-INPUT-BOX.md §7.2（←→/Home/End/Ctrl+U/Backspace/中段插入/
 *  Ctrl+V 落 cursor/\n→空格/Ctrl+J no-op/未列键吞——无 fall-through）；Esc 语义 round2 #5：
 *  有 options（Custom 进入）→ 回 options 态；无 options → 中止 question。
 *  consume：模态激活时全部按键独占（含未匹配键——拆出前 onKeypress 尾 return）。 */
export function handleQuestionMode(str, key, ctx) {
  const { state, pushLine, render } = ctx
  if (!state.question) return false
  const q = state.question
  if (q.options.length > 0) {
    // options mode: ↑↓ select, Enter confirm, Esc cancel
    if (key.name === "escape") {
      q.resolve("")
      state.question = null
      state.status = "Processing..."
      render()
    } else if (key.name === "up") {
      q.selected = Math.max(0, (q.selected ?? 0) - 1)
      render()
    } else if (key.name === "down") {
      q.selected = Math.min(q.options.length - 1, (q.selected ?? 0) + 1)
      render()
    } else if (key.name === "return") {
      const answer = q.options[q.selected ?? 0]
      if (answer === QUESTION_CUSTOM) {
        // Switch to free-text mode — the user wants to type their own answer.
        // options 列表备份（_backOptions）——自由文本态 Esc 可回 options 态（round2 #5 逃生口）；
        // answer/cursor 按 §7.2 初始化（codepoint 数组 + cursor = answer.length）。
        q._backOptions = { options: q.options, selected: q.selected }
        q.options = []
        q.selected = undefined
        q.answer = []
        q.cursor = 0
        state.status = "Waiting for answer..."
        render()
        return true
      }
      q.resolve(answer)
      state.question = null
      state.status = "Processing..."
      pushLine(`  → ${answer}`, C.tool)
      render()
    }
  } else {
    // free text: codepoint-array answer + cursor editing (TUI-INPUT-BOX.md §7.2)
    if (!Array.isArray(q.answer)) q.answer = q.answer ? [...q.answer] : []
    q.cursor = Math.max(0, Math.min(q.cursor ?? q.answer.length, q.answer.length))
    const len = q.answer.length
    if (key.name === "escape") {
      // round2 #5：有 options（Custom 进入）→ 回 options 态（误触 Custom 有逃生口——
      // 选择列表与选中位恢复）；无 options → 中止 question（原语义）。
      if (q._backOptions) {
        q.options = q._backOptions.options
        q.selected = q._backOptions.selected
        delete q._backOptions
        delete q.answer
        delete q.cursor
        state.status = "Waiting for choice..."
        render()
      } else {
        q.resolve("")
        state.question = null
        state.status = "Processing..."
        render()
      }
    } else if (key.name === "return") {
      if (q._pasting) return true // block Enter while paste is in flight
      const answer = q.answer.join("").trim()
      q.resolve(answer || "")
      state.question = null
      state.status = "Processing..."
      pushLine(`  → ${answer || "(empty)"}`, C.tool)
      render()
    } else if (key.name === "enter") {
      // Ctrl+J（\n → name "enter"）= no-op 吞——不插换行无 fall-through（round2 #2）
    } else if (key.name === "left") {
      q.cursor = Math.max(0, q.cursor - 1)
      render()
    } else if (key.name === "right") {
      q.cursor = Math.min(len, q.cursor + 1)
      render()
    } else if (key.name === "home") {
      q.cursor = 0
      render()
    } else if (key.name === "end") {
      q.cursor = len
      render()
    } else if (key.ctrl && !key.alt && key.name === "u") {
      q.answer = []
      q.cursor = 0
      render()
    } else if (key.name === "backspace") {
      if (q.cursor > 0) {
        q.answer.splice(q.cursor - 1, 1) // codepoint 元素删除——emoji 不劈半（round2 #1）
        q.cursor--
        render()
      }
    } else if (key.ctrl && !key.alt && !key.meta && key.name === "v") {
      // Ctrl+V paste: read clipboard text (fires when the terminal passes Ctrl+V through
      // as a key event; bracketed-paste terminals are handled upstream in the stdin handler).
      // 两路径同归 insertPastedText——落 cursor 位置、\n→空格（clipboard.mjs 单行守卫）。
      if (q._pasting) return true
      q._pasting = true
      readClipboardText().then((text) => {
        q._pasting = false
        if (text) {
          // activeQuestion 守卫：粘贴在途用户 Esc 中止/Enter 提交后，本回调不得把
          // 剪贴板内容落进主输入框（审计 F1——insertPastedText 见 stale 即丢）。
          insertPastedText(state, text, q)
          render()
        }
      }).catch((e) => {
        q._pasting = false
        console.error(`[tui] clipboard paste failed: ${e.message}`)
      })
    } else if (str && !key.ctrl && !key.meta && key.name !== "tab" && key.name !== "enter") {
      // 可打印字符插入光标位置（codepoint 拆字）；\r\n 剥离 + \t→2 空格（单行不变式同主输入清洗口径）
      const chars = [...str.replace(/[\r\n]+/g, "").replace(/\t/g, "  ")]
      if (chars.length) {
        q.answer.splice(q.cursor, 0, ...chars)
        q.cursor += chars.length
        render()
      }
    }
    // 未列键（↑↓/PgUp/PgDn/Delete/F1/…）一律消费 return——无 fall-through 到正常编辑
    // （search 穿透教训——TUI-INPUT-BOX.md §3.2 BUG-2）
  }
  return true
}

/** interruptPrompt 模态（Ctrl+I 后输入注入消息）：Enter 提交 → controller.abort
 *  { interrupt: true, message }；Esc 取消；字符进 prompt；其余键静默吞（模态独占）。
 *  返回 false 当模态未激活（key-handler 先检 state.interruptPrompt 入口再调）。 */
export function handleInterruptMode(str, key, ctx) {
  const { state, pushLine, render } = ctx
  if (!state.interruptPrompt) return false
  if (key.name === "escape") {
    state.interruptPrompt = null
    render()
  } else if (key.name === "return") {
    const msg = (state.interruptPrompt.text ?? "").trim()
    state.interruptPrompt = null
    if (msg) {
      // Guard: if the turn already finished while the user was typing, the controller
      // may have been replaced or already aborted — don't abort a live turn by mistake.
      if (state.processing && state.controller && !state.controller.signal.aborted) {
        pushLine(`  [inject] ${msg}`, C.warn)
        state.controller.abort({ interrupt: true, message: msg })
      } else {
        pushLine(`  [inject — turn ended, message queued] ${msg}`, C.dim)
      }
      render()
    }
  } else if (key.name === "backspace") {
    state.interruptPrompt.text = state.interruptPrompt.text.slice(0, -1)
    render()
  } else if (str && !key.ctrl && !key.meta) {
    state.interruptPrompt.text += str.replace(/[\r\n]+/g, "")
    render()
  }
  return true
}
