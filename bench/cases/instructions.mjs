/**
 * cases/instructions.mjs — 指令遵循维 3 例（IFEval 式；题面逐字冻结 = 设计档 §5.5；改题 ⇒ SUITE_VERSION + 1）。
 * 判分 = 机器可验证约束（字数 / 次数 / 格式 / 否定）——由 `lib/grade.mjs` 的 textRules 规则表驱动。
 */

import { keywordSet, ok, preview, textRules } from "../lib/grade.mjs"

export const cases = [
  {
    id: "instructions.1",
    dim: "instructions",
    class: "normal",
    prompt: "写一段关于「城市夜景」的短文。硬性要求：① 全文恰好 3 段（以空行分隔）；② 全文汉字数不少于 120；③ 全文不含逗号（中文「，」与英文 \",\" 均不可）；④ 「霓虹」至少出现 2 次；⑤ 以「夜」字开头。",
    build: null,
    callOpts: {},
    grade: (result) => textRules(result.text, [
      { kind: "paragraphCount", count: 3 },
      { kind: "hanziMin", min: 120 },
      { kind: "notContains", tokens: ["，", ","] },
      { kind: "tokenCount", token: "霓虹", min: 2 },
      { kind: "startsWith", char: "夜" },
    ]),
  },
  {
    id: "instructions.2",
    dim: "instructions",
    class: "boundary",
    prompt: "写一条会议变更通知。硬性要求：① 全文恰好 2 句（以「。」分隔）；② 每句汉字数不超过 40；③ 必须含「截止」；④ 全文不含任何阿拉伯数字；⑤ 全文不含「请」字。",
    build: null,
    callOpts: {},
    grade: (result) => textRules(result.text, [
      { kind: "sentenceCount", count: 2 },
      { kind: "hanziPerSentenceMax", max: 40 },
      { kind: "contains", tokens: ["截止"] },
      { kind: "noArabicDigits" },
      { kind: "notContains", tokens: ["请"] },
    ]),
  },
  {
    id: "instructions.3",
    dim: "instructions",
    class: "error",
    prompt: "请写一句话。硬性要求：① 必须包含英文大写单词 PASS；② 全文不得包含任何大写字母。",
    build: null,
    callOpts: {},
    grade: (result) => {
      // 正确 = 指出约束不可能同时满足；判据 = 命中闭词表（不得以违反任一约束的产出通过）
      const hit = keywordSet(result.text, ["冲突", "无法", "不能", "矛盾", "不可能"])
      return ok(hit.hit, hit.hit
        ? `指出约束冲突（${hit.matched}）：${preview(result.text, 60)}`
        : `未指出约束冲突：${preview(result.text, 80)}`)
    },
  },
]
