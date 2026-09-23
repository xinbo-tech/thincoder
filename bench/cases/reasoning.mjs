/**
 * cases/reasoning.mjs — 推理维 3 例（题面逐字冻结 = 设计档 §5.1；改题 ⇒ SUITE_VERSION + 1）。
 * 判分：数字独立成词比对 + 闭词表（§2.6 numEquals / keywordSet）。
 */

import { keywordSet, numEquals, ok, preview } from "../lib/grade.mjs"

export const cases = [
  {
    id: "reasoning.1",
    dim: "reasoning",
    class: "normal",
    prompt: "不使用计算器，计算 7^123 的个位数。只回答一个数字。",
    build: null,
    callOpts: {},
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
    grade: (result) => {
      // 正确 = 指出 9 非质数 或 给出 3×3（前提陷阱题）
      const words = keywordSet(result.text, ["不是质数", "非质数", "不是素数", "非素数"])
      const shapes = keywordSet(result.text, ["3×3", "3 × 3", "3*3"])
      const pass = words.hit || shapes.hit
      const how = words.hit ? `指出前提错误（${words.matched}）` : shapes.hit ? `给出 3×3` : "既未指出前提错误也未给出 3×3"
      return ok(pass, `${how}：${preview(result.text, 80)}`)
    },
  },
]
