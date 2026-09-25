import { ansi, C } from "./ansi.mjs"
import { capLine, accountLine, accountAll, syncLineBudget } from "./display-budget.mjs"
import { shiftFreezeAnchors } from "./subagent-blocks.mjs"

/** 对话写入面（2026-09-22 structure-debt §2.2 · #159）：pushLine（行额度单点）/ pushLabel
 *  （消息标签 + 呼吸空行）/ ensureAssistantLabel（回合内单次 assistant 标签位）——三块自
 *  index.mjs startTUI 逐字搬移（仅去包裹）。
 *  `render` 由调用侧以惰性转发承接（renderLoop 于 startTUI 后段装配——TDZ 语义保持）。
 *  @param {{ state: object, render: Function }} ctx
 *  @returns {{ pushLine: Function, pushLabel: Function, ensureAssistantLabel: Function,
 *              assistantLabeled: boolean }} */
export function createConversationWriter({ state, render }) {
  const pushLine = (text, color, kind) => {
    // TUI-OOM-ROOTCAUSE（TUI-SESSION-VIEW.md §5.1/§5.3）：行额度单点——行文本过 capLine
    // （LINE_MAX_CHARS——单行巨内容/无换行巨 chunk 的堵口）+ 总量账 + 预算对账。
    const line = { text: capLine(text), color, _kind: kind }
    state.lines.push(line)
    accountLine(state, line)
    if (state.lines.length > 5000) {
      state.lines.splice(0, 1000)
      state.lines.unshift({ text: `... [earlier messages trimmed — ${state.lines.length} lines remaining]`, color: C.dim })
      // 2026-09-03 修复轮（冻结锚点）：头裁对在途 settled 锚点整体前移（锚点是绝对
      // 流位置）——不校正则池空补发冻结（freezeSubTaskLines splice）落点漂移；校正量
      // = 净位移（裁 1000 补 1 标记行 → −999，code review round1 #3）。
      shiftFreezeAnchors(state, 1000)
      accountAll(state) // 行对象集合已变（splice/unshift 直写）——直算重对账
    }
    syncLineBudget(state, { onTrim: (st, n) => shiftFreezeAnchors(st, n) })
    render()
  }

  /** Message block label: blank line + label line. Breathing space between user/assistant messages */
  const pushLabel = (text, color) => {
    // 行额度同 pushLine（§5.1——恢复行/标签行同口径）
    if (state.lines.length > 0) {
      const blank = { text: "", color: C.dim }
      state.lines.push(blank)
      accountLine(state, blank)
    }
    const line = { text: capLine(text), color }
    state.lines.push(line)
    accountLine(state, line)
    syncLineBudget(state, { onTrim: (st, n) => shiftFreezeAnchors(st, n) })
    render()
  }

  // Only emit the assistant label once per turn (on first token or first tool call)
  let assistantLabeled = false
  const ensureAssistantLabel = () => {
    if (!assistantLabeled) {
      assistantLabeled = true
      pushLabel(`❯ ThinCoder:`, ansi.bold + C.assistant)
    }
  }
  return {
    pushLine,
    pushLabel,
    ensureAssistantLabel,
    get assistantLabeled() { return assistantLabeled },
    set assistantLabeled(v) { assistantLabeled = v },
  }
}
