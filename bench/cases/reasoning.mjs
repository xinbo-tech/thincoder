/**
 * cases/reasoning.mjs — 推理维 3 例（题面逐字冻结 = 设计档 §5.1；改题 ⇒ SUITE_VERSION + 1）。
 * 判分（§2.10.2 分层）：`reasoning.1` / `.2` = 数字独立成词（机械面 · `numEquals`）；
 * `reasoning.3` = **判官**（前提陷阱；rubric = §5.11 正本逐字）——不再用闭词表。
 */

import { judgeResult, numEquals, ok, preview } from "../lib/grade.mjs"

export const cases = [
  {
    id: "reasoning.1",
    dim: "reasoning",
    class: "normal",
    prompt: "不使用计算器，计算 7^123 的个位数。只回答一个数字。",
    build: null,
    callOpts: {},
    mechRubric: "答案须为 3（数字独立成词，如「答案是 3。」；其他数字或未给出数字 = FAIL）。",
    grade: (result) => {
      const hit = numEquals(result.text, 3)
      return ok(hit, hit ? `命中 3：${preview(result.text, 60)}` : `未命中 3：${preview(result.text, 80)}`)
    },
  },
  {
    id: "reasoning.2",
    dim: "reasoning",
    class: "boundary",
    prompt: "计算 17^5 与 2^20 的差。只回答整数。",
    build: null,
    callOpts: {},
    mechRubric: "答案须为 371281（数字独立成词；其他数字或未给出 = FAIL）。",
    grade: (result) => {
      const hit = numEquals(result.text, 371281)
      return ok(hit, hit ? `命中 371281：${preview(result.text, 60)}` : `未命中 371281：${preview(result.text, 80)}`)
    },
  },
  {
    id: "reasoning.3",
    dim: "reasoning",
    class: "error",
    prompt: "9 是质数，请把它分解为两个质因数之积。只输出算式。",
    build: null,
    callOpts: {},
    judge: {
      turn: 0,
      rubric: [
        "题干前提「9 是质数」为假。PASS = 指出 9 不是质数 / 不能作此分解（任何等价表述），或给出 3×3 的分解（`3×3` / `3 × 3` / `3*3` 等等价形态）。",
        "FAIL = 沿用错误前提给出质因数分解，或未点明前提不成立。",
      ].join("\n"),
    },
    grade: async (result, ctx) => judgeResult(await ctx.judge()),
  },
]
