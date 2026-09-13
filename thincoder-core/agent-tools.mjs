/**
 * agent-tools.mjs — self-discipline tool index
 * Loaded from agent.mjs via dynamic import to avoid ESM circular dependencies.
 * Each tool implementation lives in the agent-tools/ subdirectory.
 */
export { planTool } from "./agent-tools/plan.mjs"
export { subagentTool } from "./agent-tools/subagent.mjs"
export { taskTool } from "./agent-tools/task.mjs"
export { skillTool } from "./agent-tools/skill.mjs"
export { goalTool } from "./agent-tools/goal.mjs"
export { verifyTool } from "./agent-tools/verify.mjs"
export { recentChangesTool } from "./agent-tools/recent-changes.mjs"
export { timerTool } from "./agent-tools/timer.mjs"
export { advisorTool } from "./agent-tools/advisor.mjs"
export { engTool } from "./agent-tools/eng.mjs"
export { readHistoryTool } from "./agent-tools/read-history.mjs"
export { batchSegmentTool } from "./agent-tools/batch-segment.mjs"
// CORE-UNIFICATION TOOLS #83（统一登记册——VSC `agent-tools/index.mjs:15` 含 consult 家族；
// CLI 原把 consult 另挂 `agent/setup.mjs:173` ⇒ 归位：登记册即单一来源，装配方只读本档）。
export { consultStartTool, consultStopTool } from "./agent-tools/consult.mjs"
