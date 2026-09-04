/**
 * question.mjs — User interaction tool: question
 */

import * as vscode from "vscode"

export const questionTool = {
  name: "question",
  readonly: true,
  description:
    "Ask the user a question and wait for their response. Use when the task is ambiguous, you need a design decision, or you're stuck and need human judgment. The answer is injected as the next user message.\n" +
    "Parameters:\n" +
    "- question (required): The question to ask\n" +
    "- options: Array of single-choice options (optional). MUST be plain strings, e.g. [\"A\", \"B\", \"C\"] — never objects.",
  parameters: {
    type: "object",
    properties: {
      question: { type: "string", description: "Question to ask" },
      options: { type: "array", items: { type: "string" }, description: "Single-choice options" },
    },
    required: ["question"],
  },
  async execute({ question, options }, ctx) {
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
