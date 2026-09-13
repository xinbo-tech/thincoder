/**
 * question.mjs — User interaction tool: question
 */

import * as vscode from "vscode"
import { DESC } from "./shared.mjs"

export const questionTool = {
  name: "question",
  readonly: true,
  description: DESC("question"),
  parameters: {
    type: "object",
    properties: {
      question: { type: "string", description: "Question to ask" },
      options: { type: "array", items: { type: "string" }, description: "Single-choice options" },
    },
    required: ["question"],
  },
  async execute({ question, options }, ctx) {
    // §22 D-Q3 机械上限（2026-09-06 用户裁定 100 字符/4 条）——超限拒绝回模型，
    // 不弹卡、不调 onQuestion（与 interaction 并发守卫 / auto-turn 禁问同形态）。
    if (question?.length > 100) return "(error: question too long (>100 chars) — ask ONE short question; background belongs in your normal reply text)"
    if (Array.isArray(options) && options.length > 4) return "(error: too many options (>4) — offer at most 4 plain-string options)"
    // Panel-inline interaction (preferred): the question renders INSIDE the chat
    // panel via callbacks.onQuestion (same queue pattern as permissionRequest).
    // VS Code's native QuickPick / InputBox pops up at the TOP of the editor
    // window — users miss it and an accidental click dismisses it as "cancelled".
    if (ctx?.callbacks?.onQuestion) {
      const answer = await ctx.callbacks.onQuestion(question, options?.length ? options : null)
      return answer ?? "(user cancelled)"
    }
    // Fallback (no panel callback — e.g. subagent runs): native VS Code UI.
    let answer
    if (options?.length) {
      // Use createQuickPick for proper title support
      const picker = vscode.window.createQuickPick()
      picker.title = question
      // 防御：options 声明为 string[]，但 LLM 可能传对象；取 label/text/title 兜底，避免 [object Object]。
      picker.items = options.map((o) => ({ label: typeof o === "string" ? o : (o?.label ?? o?.text ?? o?.title ?? String(o)) }))
      picker.placeholder = question
      answer = await new Promise((resolve) => {
        picker.onDidAccept(() => {
          const sel = picker.selectedItems[0]
          resolve(sel?.label || null)
          picker.hide()
        })
        picker.onDidHide(() => resolve(null))
        picker.show()
      })
    } else {
      answer = await vscode.window.showInputBox({ prompt: question })
    }
    return answer ?? "(user cancelled)"
  },
}
