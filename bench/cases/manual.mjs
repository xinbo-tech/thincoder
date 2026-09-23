/**
 * cases/manual.mjs — 人工 lane 3 条（中文歧义；设计 §5.9 / AC-6；**不判分**）。
 *
 * 与自动用例的结构差异 = 无 `grade` 函数（机检判据：AC-6「人工 lane 无判分函数」）；
 * 只记录响应摘要 + 指标，报告「人工判读」小节并列；不入能力矩阵 / 成本归一化 / 退出码。
 */

export const manual = [
  {
    promptId: "manual.1",
    prompt: "最近怎么样？",
  },
  {
    promptId: "manual.2",
    prompt: "帮我把那个东西改一下。",
  },
  {
    promptId: "manual.3",
    prompt: "这个功能有点意思，你觉得呢？",
  },
]
