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
export { batchTool } from "./agent-tools/batch.mjs"
// 批次档生命周期工具（BATCH-RECORD §4.3 挂载表——主名 `batch` 单工具四 action：depth-0 主 agent
// create/close + append §1/§4/§6 + status §1（轮 2 裁定②：§4/§6 状态面走普通文档写）（D-BR18）；
// eng 子代理 eng 分支绑定段写入；评审 §3。
// 过渡别名 batchSegmentTool 不入登记册（§4.14——生产挂载面全切主名；别名仅供 shim 导出面）。
// CORE-UNIFICATION TOOLS #83（统一登记册——VSC `agent-tools/index.mjs:15` 含 consult 家族；
// CLI 原把 consult 另挂 `agent/setup.mjs:173` ⇒ 归位：登记册即单一来源，装配方只读本档）。
export { consultStartTool, consultStopTool } from "./agent-tools/consult.mjs"
// SUBAGENT-UPSTREAM-CHANNEL（AGENT-LOOP-SUBAGENT.md §6.27.4 装配接线）：子代理上行通道工具
// （depth>0 段装配——`agent/family-tools.mjs`；depth-0 / consult 不装配）。
export { parentChannelTool } from "./agent-tools/parent-channel.mjs"
