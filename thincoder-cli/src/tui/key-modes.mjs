/**
 * key-modes.mjs — 按键模态层（2026-09-03 D-S4 自 key-handler.mjs 拆出）：
 * permission / question / interruptPrompt 三种独占模态分支。每个 handler 在模态激活时
 * 消费全部按键（返回 true——含未匹配键，与拆出前无条件 return 语义一致），未激活返回 false。
 * ctx: { state, agent, pushLine, render }（各 handler 按需取用）。
 * 搜索模态另居 key-handler-search.mjs（既有拆分，本批不动）。
 */
import { C } from "./ansi.mjs"
import { readClipboardText, insertPastedText } from "./clipboard.mjs"
import { QUESTION_CUSTOM, isYesNoModal } from "./interaction.mjs"
import { inputContentWidth } from "./layout.mjs"
import { moveCursorVertical } from "./render.mjs"

/** SYNC-CANCEL v2 模态 deny 解绕（用户裁——2026-09-09）：⏹ 定向中止 sync child 时
 *  顺带 deny 其 pending 权限/continue 模态——ask 不观 signal（R1——targeted abort 后
 *  child 停在模态则 runChildPipeline 不返回、父回合阻塞至模态回答）。owner 判定：
 *  工具权限 ask name 前缀 `${key}/`（subagent-spawn.mjs 装配——owner key 标识）；continue
 *  ask args.agent === key（subagent.mjs askSubagentContinue 既有参数）。副作用镜像
 *  handlePermissionMode deny 分支（清除模态 + deny 轨迹 + resolve(false)——子代理随即
 *  在 abort 检出点解绕折叠）。返回 true = 本模态属该 child 且已 deny 解绕。鼠标 ⏹ 路径
 *  （mouse.mjs cancelSubagent）调用——key-modes 是权限模态归属语义的驻点。 */
export function denyModalForOwner(state, key, { pushLine, render } = {}) {
  const p = state?.permission
  if (!p) return false
  const owned = (typeof p.name === "string" && p.name.startsWith(`${key}/`)) || p.args?.agent === key
  if (!owned) return false
  const { resolve, name } = p
  state.permission = null
  state.permissionPreview = []
  state.status = "Processing..."
  pushLine?.(`  [denied] ${name}`, C.error)
  resolve(false)
  render?.()
  return true
}

/** permission 确认模态：y/n/a（a = approve + AUTO ON）；batch（§16 D-B1）：a/o/n（Esc = deny）。
 *  `continue` / `retry` = y/n-only 族（判据单源 `isYesNoModal`——X8 跟进①：`retry` 框不
 *  广告 `a`，零会话级 AUTO 副作用）。
 *  consume：valid 键或 Esc 走 resolve 分支；其余键静默吞掉（模态独占）。 */
export function handlePermissionMode(str, key, ctx) {
  const { state, agent, pushLine, render } = ctx
  if (!state.permission) return false
  const answer = (str || "").toLowerCase()
  // `yOnly` = 本框键面仅 y/n（continue / retry）；`isContinue` 仅保轨迹行豁免（continue 有
  // 自有输出行——retry **保留** `[approved]` / `[denied]` 轨迹行）。
  const isContinue = state.permission.name === "continue"
  const yOnly = isYesNoModal(state.permission.name)
  const isBatch = Boolean(state.permission.batch)
  const validKeys = yOnly ? ["y", "n"] : isBatch ? ["a", "o", "n"] : ["y", "n", "a"]
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
    if (answer === "a" && !yOnly) {
      agent.autoApprove = true
      agent._pendingReminders = agent._pendingReminders ?? []
      agent._pendingReminders.push("[System reminder: AUTO mode is now ON. All tool calls are automatically approved. Use /auto to disable.]")
      pushLine(`  [auto] AUTO ON: tool calls no longer prompt for approval (/auto to disable)`, C.warn)
    }
    const approved = answer === "y" || (answer === "a" && !yOnly)
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
      // A4（第 20 批 §12.4 契约——同义键同形）：↑↓ 环绕（原钳位——对齐 picker/wizard 既有语义）
      q.selected = ((q.selected ?? 0) - 1 + q.options.length) % q.options.length
      render()
    } else if (key.name === "down") {
      q.selected = ((q.selected ?? 0) + 1) % q.options.length
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
 *  { interrupt: true, message }；Esc 取消；编辑键 = §7.2 最小集 + 四方向键（第 31 批：
 *  `{ chars, cursor }` codepoint 模型——TUI-INPUT-BOX.md §8.1）；其余键静默吞（模态独占）。
 *  返回 false 当模态未激活（key-handler 先检 state.interruptPrompt 入口再调）。 */
export function handleInterruptMode(str, key, ctx) {
  const { state, pushLine, render } = ctx
  if (!state.interruptPrompt) return false
  const p = state.interruptPrompt
  if (!Array.isArray(p.chars)) p.chars = p.chars ? [...p.chars] : [] // 形态防御（同 question 自由文本态）
  p.cursor = Math.max(0, Math.min(p.cursor ?? p.chars.length, p.chars.length))
  const len = p.chars.length
  if (key.name === "escape") {
    state.interruptPrompt = null
    render()
  } else if (key.name === "return") {
    const msg = p.chars.join("").trim()
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
  } else if (key.name === "enter") {
    // Ctrl+J（\n → name "enter"）= no-op 吞——单行不变式：不插换行（§8.1）
  } else if (key.name === "left") {
    p.cursor = Math.max(0, p.cursor - 1)
    render()
  } else if (key.name === "right") {
    p.cursor = Math.min(len, p.cursor + 1)
    render()
  } else if (key.name === "up" || key.name === "down") {
    // 折行竖移（§8.1）：显示列保持 + 短行端钳制；无邻行 = 吞（零副作用——无历史回落）
    const cols = (state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80)
    const next = moveCursorVertical(p.chars, p.cursor, inputContentWidth(cols), key.name)
    if (next !== null) {
      p.cursor = next
      render()
    }
  } else if (key.name === "home") {
    p.cursor = 0
    render()
  } else if (key.name === "end") {
    p.cursor = len
    render()
  } else if (key.ctrl && !key.alt && key.name === "u") {
    p.chars = []
    p.cursor = 0
    render()
  } else if (key.name === "backspace") {
    if (p.cursor > 0) {
      p.chars.splice(p.cursor - 1, 1) // codepoint 元素删除——emoji 不劈半
      p.cursor--
      render()
    }
  } else if (key.ctrl && !key.alt && !key.meta && key.name === "v") {
    // Ctrl+V 粘贴：落 cursor 位置（\n/\r 去除、\t → 2 空格——insertPastedText 注入框分支）。
    // 异步读剪贴板期间框可能已 Esc/Enter 关闭 → 回调守卫比对同一引用，防落主输入框
    // （同 question 态 stale-paste 守卫语义；不加守卫会静默落 state.input）。
    const target = p
    readClipboardText().then((text) => {
      if (text && state.interruptPrompt === target) {
        insertPastedText(state, text)
        render()
      }
    }).catch((e) => console.error(`[tui] clipboard paste failed: ${e.message}`))
  } else if (str && !key.ctrl && !key.meta && key.name !== "tab" && key.name !== "enter") {
    // 可打印字符插入光标位置（codepoint 拆字）；\r\n 剥离 + \t→2 空格（单行不变式）
    const chars = [...str.replace(/[\r\n]+/g, "").replace(/\t/g, "  ")]
    if (chars.length) {
      p.chars.splice(p.cursor, 0, ...chars)
      p.cursor += chars.length
      render()
    }
  }
  // 未列键（Delete/PgUp/PgDn/F1/…）一律 consume return——无 fall-through（模态独占；§8.1：
  // Delete 不引入——与 §7.2 最小集对齐）
  return true
}
