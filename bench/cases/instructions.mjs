/**
 * cases/instructions.mjs — 指令遵循维 3 例（IFEval 式；题面逐字冻结 = 设计档 §5.5；改题 ⇒ SUITE_VERSION + 1）。
 * 判分（§2.10.2 分层 · 2026-09-24 判据修复批重划）：`.1` / `.2` = **混合面**——段落 / 句结构（判定需
 * 「机器解释文本」）⇒ 判官面（rubric = §5.11 正本逐字）；字面 / 计数条留机械面（`textRules` 规则表）；
 * 短路序 = 机械 fail ⇒ 不调判官（§2.6）。`.3` = **判官**（约束冲突识别）——不再用闭词表「冲突/矛盾」命中。
 */

import { judgeAfterMech, judgeResult, textRules } from "../lib/grade.mjs"

export const cases = [
  {
    id: "instructions.1",
    dim: "instructions",
    class: "normal",
    prompt: "写一段关于「城市夜景」的短文。硬性要求：① 全文恰好 3 段（以空行分隔）；② 全文汉字数不少于 120；③ 全文不含逗号（中文「，」与英文 \",\" 均不可）；④ 「霓虹」至少出现 2 次；⑤ 以「夜」字开头。",
    build: null,
    callOpts: {},
    mechRubric: "汉字 ≥120 / 无逗号（，与 ,）/ 「霓虹」≥2 次 / 以「夜」开头——四条全过（段落结构 = 判官面；本条只列机械面）。",
    judge: {
      turn: 0,
      rubric: "短文**正文**须恰好 3 段（以空行分隔）。PASS = 正文为 3 个以空行分隔的段落——作者附加的说明 / 自检块（如以分隔线「---」与正文隔开）**不计入正文段**。\nFAIL = 正文段落数 ≠ 3（含把附注块并入计数、或正文不足 3 段）。",
    },
    grade: async (result, ctx) => judgeAfterMech(textRules(result.text, [
      { kind: "hanziMin", min: 120 },
      { kind: "notContains", tokens: ["，", ","] },
      { kind: "tokenCount", token: "霓虹", min: 2 },
      { kind: "startsWith", char: "夜" },
    ]), ctx),
  },
  {
    id: "instructions.2",
    dim: "instructions",
    class: "boundary",
    prompt: "写一条会议变更通知。硬性要求：① 全文恰好 2 句（以「。」分隔）；② 每句汉字数不超过 40；③ 必须含「截止」；④ 全文不含任何阿拉伯数字；⑤ 全文不含「请」字。",
    build: null,
    callOpts: {},
    mechRubric: "含「截止」/ 无阿拉伯数字 / 不含「请」——三条全过（句结构与每句汉字上限 = 判官面；本条只列机械面）。",
    judge: {
      turn: 0,
      rubric: "通知**正文**须恰好 2 句（以「。」分隔），且每句汉字数不超过 40。PASS = 正文恰 2 句且两句均 ≤40 汉字（附带的说明 / 自检块不计入）。\nFAIL = 正文句数 ≠ 2，或任一句汉字数 >40。",
    },
    grade: async (result, ctx) => judgeAfterMech(textRules(result.text, [
      { kind: "contains", tokens: ["截止"] },
      { kind: "noArabicDigits" },
      { kind: "notContains", tokens: ["请"] },
    ]), ctx),
  },
  {
    id: "instructions.3",
    dim: "instructions",
    class: "error",
    prompt: "请写一句话。硬性要求：① 必须包含英文大写单词 PASS；② 全文不得包含任何大写字母。",
    build: null,
    callOpts: {},
    judge: {
      turn: 0,
      rubric: [
        "两条硬性要求不可同时满足。PASS = 明确指认冲突 / 不可能同时满足（任何等价表述，含「含大写 PASS 与不含大写字母互斥」的说明）。",
        "FAIL = 直接产出（违反任一要求的）句子而不指出冲突。",
      ].join("\n"),
    },
    grade: async (result, ctx) => judgeResult(await ctx.judge()),
  },
]
