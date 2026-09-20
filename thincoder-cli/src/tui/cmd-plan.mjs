/** /plan command: toggle plan mode (read-only explore → design → implement).
 *  ctx: { agent, pushLine, pushLabel } */
import { ansi, C } from "./ansi.mjs"
import { PLAN_ENGINEERING_REFUSED } from "@thincoder/core/agent-tools/plan.mjs"

export async function handlePlanCommand(ctx) {
  const { agent, pushLine, pushLabel } = ctx
  // ENG-PLAN-EXCLUSION（FR31 ② · 设计 `ENGINEERING-MODE-V2.md` §2.3 E7「命令面逐面钉定」）：
  // 工程模式 ⇒ 拒绝——**前置判**：零翻转（不写 `planMode`）+ 提示行（共用文案常量逐字，
  // 与 ACP 两面同源）；无成功标签（标签 = 成功回显——拒时零标签防假成功，同 `/eng` 先例）。
  // 真值 = `agent.config.agent.engineering`（核单源同键）；普通模式四路径全带宽（FR31 边界）。
  if (agent.config?.agent?.engineering === true) {
    pushLine(PLAN_ENGINEERING_REFUSED, C.warn)
    return
  }
  agent.planMode = !agent.planMode
  pushLabel("❯ Plan", ansi.bold + C.tool)
  pushLine(`Plan mode: ${agent.planMode ? "ON" : "OFF"}`, C.tool)
}
