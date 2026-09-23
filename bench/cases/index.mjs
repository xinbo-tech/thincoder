/**
 * cases/index.mjs — 题集注册表（设计 §1.3-1 题集口径的实现单源）
 *
 * `SUITE_VERSION` = 单源整数常量（KD-2）：题面 / 用例集 / 判据 / 计时口径任一变化 ⇒ +1；
 * 价格变动不 bump（另记 prices.asOf）。
 * 维度面 = 8 个自动维（可执行子集，机器判分）+ 1 个人工 lane（`manual`，不判分，AC-6）。
 * 轴 = `speed` / `cost`（报告轴，不影响跑什么——§2.1-1 词表统一）。
 */

import { cases as reasoning } from "./reasoning.mjs"
import { cases as code } from "./code.mjs"
import { cases as json } from "./json.mjs"
import { cases as tools } from "./tools.mjs"
import { cases as instructions } from "./instructions.mjs"
import { cases as multiturn } from "./multiturn.mjs"
import { cases as longctx } from "./longctx.mjs"
import { cases as vision } from "./vision.mjs"
import { manual } from "./manual.mjs"

/** 题集版本（整数）——改题面/判据/计时口径 +1（设计 §1.3 口径 1/2/3）。 */
export const SUITE_VERSION = 2

/** 8 个自动维度（顺序 = 报告中的列序）。 */
export const DIMENSIONS = ["reasoning", "code", "json", "tools", "instructions", "multiturn", "longctx", "vision"]

/** 人工 lane 维度键（不判分、不入矩阵/成本归一化）。 */
export const MANUAL_DIM = "manual"

/** 报告轴（§2.1-1：`speed` / `cost` 只决定「出什么轴」）。 */
export const AXES = ["speed", "cost"]

/** `--dims capability` = 8 个自动维（不含 manual——manual 需显式点名或缺省全跑，§2.1-3）。 */
export const CAPABILITY_SELECTOR = "capability"

/** 维度中文展示名（矩阵列头）。 */
export const DIM_LABELS = {
  reasoning: "推理",
  code: "代码",
  json: "严格 JSON",
  tools: "工具调用",
  instructions: "指令遵循",
  multiturn: "多轮澄清",
  longctx: "长上下文",
  vision: "视觉",
  [MANUAL_DIM]: "中文歧义（人工）",
}

/** 用例类映射（§2.6 冻结：用例对象 `normal|boundary|error` → 结果 JSON / 报告一律中文词）。 */
export const CLASS_LABELS = { normal: "正常", boundary: "边界", error: "错误" }

/** 25 个自动判分用例。 */
export const CASES = [...reasoning, ...code, ...json, ...tools, ...instructions, ...multiturn, ...longctx, ...vision]

/** 3 条人工 lane 记录项（无判分函数）。 */
export const MANUAL = manual

/** 按维度过滤用例（runDims = Set）。 */
export function casesForDims(runDims) {
  return CASES.filter((c) => runDims.has(c.dim))
}
