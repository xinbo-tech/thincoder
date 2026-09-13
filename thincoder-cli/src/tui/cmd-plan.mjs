/** /plan command: toggle plan mode (read-only explore → design → implement).
 *  ctx: { agent, pushLine, pushLabel } */
import { ansi, C } from "./ansi.mjs"

export async function handlePlanCommand(ctx) {
  const { agent, pushLine, pushLabel } = ctx
  agent.planMode = !agent.planMode
  pushLabel("❯ Plan", ansi.bold + C.tool)
  pushLine(`Plan mode: ${agent.planMode ? "ON" : "OFF"}`, C.tool)
}
