/**
 * cmd-fold.mjs — /fold command: toggle conversation result folding
 */
import { C } from "./ansi.mjs"

export async function handleFoldCommand(ctx, args = []) {
  const { state, pushLabel } = ctx
  const arg = args[0]?.toLowerCase()
  if (arg === "on") {
    state.foldEnabled = true
  } else if (arg === "off") {
    state.foldEnabled = false
  } else {
    state.foldEnabled = !state.foldEnabled
  }
  pushLabel("❯ Fold", C.bold + C.tool)
  ctx.pushLine(`Folding: ${state.foldEnabled ? "on" : "off"}`, C.tool)
  ctx.render()
}
