/** /auto command: toggle auto-approve mode.
 *  ctx: { agent, pushLine, pushLabel } */
import { ansi, C } from "./ansi.mjs"

export async function handleAutoCommand(ctx) {
  const { agent, pushLine, pushLabel } = ctx
  agent.autoApprove = !agent.autoApprove
  pushLabel("❯ Auto", ansi.bold + C.tool)
  pushLine(`Auto-approve: ${agent.autoApprove ? "ON" : "OFF"}`, C.tool)
}
