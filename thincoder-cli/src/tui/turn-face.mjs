import { createInteraction } from "./interaction.mjs"
import { runAgentTurn } from "./agent-turn.mjs"
import { pasteClipboardImage as pasteClipboardImageImpl } from "./clipboard.mjs"

/** 回合面（2026-09-22 structure-debt §2.2 · #159）：submit 门禁 / interaction 装配（权限 + 提问）/
 *  剪贴板图片粘贴 / turnCtx / turn——块体自 index.mjs startTUI 逐字搬移；唯一改指 = turnCtx 的
 *  `assistantLabeled` 存取器两行改经 ctx.conversation（写入面单源）承接。
 *  `handleSlash` 由调用侧以惰性转发承接（命令层后定义——循环依赖语义逐字保持），turnCtx 由
 *  index.mjs 在命令层之后原址回填 `turnCtx.handleSlash`。
 *  @param {object} ctx
 *  @returns {{ submit: Function, turn: Function, turnCtx: object, askPermission: Function,
 *              askQuestion: Function, askBatchPermission: Function, pasteClipboardImage: Function }} */
export function createTurnFace(ctx) {
  const { agent, state, pushLine, pushLabel, render, ensureAssistantLabel, summarize, handleSlash, conversation } = ctx
  async function submit() {
    const text = state.input.join("").trim()
    if (!text) return
    // INPUT-LOCK 防御（C'——2026-09-09 + F16 busy 队列——2026-09-21 · queue-visible 2026-09-24）：门禁在 key-handler
    // （busy Enter 非模态 = 队列受理（容量 8）/ 模态·斜杠·空·满队 = 吞 + 提示，文本保留——TUI-INPUT-BOX.md
    // §4.1）；submit 只在非 busy 期达此；防御直呼/上游改动：busy 期拒绝（不清输入框不吞内容）。
    if (state.processing) {
      pushLine(`[主会话处理中 —— 消息未发送（回合结束后请重按 Enter）]`, C.warn)
      render()
      return
    }
    state.input = []
    state.cursor = 0
    const wasInHistory = state.historyIndex !== -1
    state.history.push(text) // review #3 fix: single push (was duplicated — every submit appeared twice in ↑/↓ history)
    state.historyIndex = -1
    if (!wasInHistory) state._draft = null // submitted — the draft is now history. Keep draft when submitting from history mode (↓ can recover)
    state.scroll = 0
    state._followTail = true // 2026-08-31 会诊 deepseek：新消息恢复跟随（注释曾承诺、实现缺漏）

    // Slash commands: handled locally, don't enter agent loop. 斜杠 busy 期提交在 key-handler
    // 门禁被吞（白名单已删——斜杠同吞——INPUT-LOCK-BEHAVIOR-REVISED）——submit 仅非 busy 期可达。
    if (text.startsWith("/")) {
      await handleSlash(text)
      render()
      return
    }

    await turn(text)
  }

  // Interaction primitives: permission approval + Q&A input, implemented in interaction.mjs
  const { askPermission, askQuestion, askBatchPermission } = createInteraction({
    agent, state, pushLine, pushLabel, render, summarize,
  })

  // Clipboard image paste: implemented in clipboard.mjs
  const pasteClipboardImage = () => pasteClipboardImageImpl({ agent, state, pushLine, render })

  // Agent loop: implemented in agent-turn.mjs
  const turnCtx = {
    agent, state, pushLine, pushLabel, render, scheduleRender: render, ensureAssistantLabel,
    askPermission, askQuestion, askBatchPermission, handleSlash: null,
    get assistantLabeled() { return conversation.assistantLabeled },
    set assistantLabeled(v) { conversation.assistantLabeled = v },
  }
  const turn = (text) => runAgentTurn(turnCtx, text)

  return { submit, turn, turnCtx, askPermission, askQuestion, askBatchPermission, pasteClipboardImage }
}
