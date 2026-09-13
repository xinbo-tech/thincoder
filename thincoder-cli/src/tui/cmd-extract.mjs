import { C } from "./ansi.mjs"

/** /extract command: extract knowledge from current session.
 *  ctx: { runDistill, state, pushLine } */
export async function handleExtractCommand(ctx) {
  const { runDistill, state, pushLine } = ctx
  pushLine("[extract] Analyzing session...", C.dim)
  const count = await runDistill()
  const msg = count > 0
    ? `Knowledge extracted: ${count} candidate(s) saved to memory (agent will recall them via the memory tool)`
    : "No new knowledge found in this session."
  pushLine(msg, count > 0 ? C.tool : C.dim)
}
