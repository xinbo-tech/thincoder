/**
 * question.mjs — User interaction tool: question
 */

import * as vscode from "vscode"

export const questionTool = {
  name: "question",
  readonly: true,
  description:
    "Ask the user a question and wait for their response. Use when the task is ambiguous, you need a design decision, or you're stuck and need human judgment.\n" +
    "\n" +
    "Parameters:\n" +
    "- question (required): The question to ask the user\n" +
    "- options: Array of single-choice options for the user to pick from (optional). MUST be plain strings, e.g. [\"A\", \"B\", \"C\"] — never objects.\n" +
    "\n" +
    "Notes:\n" +
    "- The agent loop pauses until the user answers\n" +
    "- The answer is injected as the next user message\n" +
    "- Returns the user's answer — the chosen option or free text — as the next message; the loop resumes when it arrives.\n" +
    "- Use sparingly — prefer making reasonable decisions when possible\n" +
    "- Ask ONE question per call — never bundle multiple sub-questions into one question string; ask the next one after the answer arrives.\n" +
    "- Keep the question text short — one or two sentences. Background, context, and analysis belong in your normal reply text, NOT in the question.\n" +
    "- Routine confirmations (confirm gates) belong in your plain reply text — the user answers in their next message. Use this tool ONLY when you need the user's decision or input to proceed.\n" +
    "- After receiving an answer about a design convention, tool preference, or recurring pattern: save it with the memory tool (action: put). This prevents asking the same question in future sessions — the user shouldn't have to repeat their preferences.",
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
