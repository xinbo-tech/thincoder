import { DESC } from "./shared.mjs";

export const questionTool = {
  name: "question",
  description: DESC("question"),
  parameters: {
    type: "object",
    properties: {
      question: { type: "string", description: "The question to ask the user" },
      options: {
        type: "array",
        items: { type: "string" },
        description: "Single-choice options for the user to pick from (optional)",
      },
    },
    required: ["question"],
  },
  readonly: true,
  async execute(args, ctx) {
    if (!ctx.onQuestion) throw new Error("question tool not supported in this context (no UI to ask)")
    // §22 D-Q3 机械限制（2026-09-06 用户裁定：100 字符 / 4 条——超限拒绝回模型，不弹卡、不调 onQuestion）
    if (args.question.length > 100) return "(error: question too long (>100 chars) — ask ONE short question; background belongs in your normal reply text)"
    if (Array.isArray(args.options) && args.options.length > 4) return "(error: too many options (>4) — offer at most 4 plain-string options)"
    return ctx.onQuestion(args.question, args.options ?? [])
  },
}
