/**
 * tool-args.mjs — 工具调用参数的可读展示（**转口档** —— B7 1a 收编：`describeToolArgs` 体迁核件
 * 单源 `@thincoder/core/tool-args.mjs`，本档同名转口、消费面零改；`toolArgsLines`（恢复路径全量
 * pretty JSON dim 行）留端）。
 *
 * 消费面（零改）：`tool-events.mjs`（live 标题行）· `startup.mjs`（历史恢复）· `subagent-blocks.mjs`
 * （子代理块头）。
 *
 * 已登记差额（B7 §2 修正轮 1 ⑨）：默认分支截断 = 核件简版切片（码元 `slice`）替代本端
 * `render.mjs` `sliceByWidth`（宽度感知 ∕ 全角计宽）——全角字符续接点可异于旧端（160 ∕ 80
 * 两档触发）；码元切可断代理对（展示面）；机制句单源 = 核件档头。
 */
import { capLines, ARGS_JSON_MAX_CHARS } from "./display-budget.mjs"
export { describeToolArgs } from "@thincoder/core/tool-args.mjs"

/** 恢复路径用：全量参数 pretty JSON 的 dim 行（非空才输出）。
 *  与工具结果的恢复惯例一致——完整落行；**总量额度**（TUI-OOM-ROOTCAUSE·TUI-SESSION-VIEW.md §5.1
 *  ARGS_JSON_MAX_CHARS——`write`/`apply_patch` 整文件内容进显示层的堵口）：超出尾截断
 *  + 标记，首行保真。 */
export function toolArgsLines(args) {
  if (!args || typeof args !== "object" || Object.keys(args).length === 0) return []
  return capLines(JSON.stringify(args, null, 2).split("\n"), ARGS_JSON_MAX_CHARS)
}
