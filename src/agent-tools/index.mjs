/**
 * agent-tools/index.mjs — re-exports all self-discipline tools
 */
export { taskTool } from "./task.mjs"
export { recentChangesTool } from "./recent_changes.mjs"
export { subagentTool } from "./subagent.mjs"
export { planTool } from "./plan.mjs"
export { goalTool } from "./goal.mjs"
export { skillTool } from "./skill.mjs"
export { verifyTool } from "./verify.mjs"
export { timerTool } from "./timer.mjs"
export { advisorTool } from "./advisor.mjs"
export { engTool } from "./eng.mjs"
export { readHistoryTool } from "./read-history.mjs"
export { consultStartTool, consultStopTool } from "./consult.mjs" // §25 R17: consult_check 退役（自动 digest 后无消费对象）
export { batchSegmentTool } from "./batch-segment.mjs" // §2.22.5（第 5 批 VSC 镜像）：批次档段写入通道（eng-designer §2 / 设计评审 §3 / eng-coder §5）
