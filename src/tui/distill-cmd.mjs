import { C } from "./ansi.mjs"

/** /distill command: extract candidates from current session, confirm each y/n, then save to memory.
 *  Extracted from index.mjs.
 *  ctx: { agent, state, pushLine, render, askPermission, distillOpts } */
export async function runDistill(ctx) {
  const { agent, state, pushLine, render, askPermission, distillOpts } = ctx
  if (agent.history.length === 0) {
    pushLine("[distill] Current session is empty, nothing to extract", C.dim)
    return
  }
  state.processing = true
  state.status = "Distilling..."
  render()
  try {
    const { extractCandidates, historyToTranscript, saveCandidate } = await import("../distill.mjs")
    pushLine("[distill] Analyzing session...", C.tool)
    const candidates = await extractCandidates(agent.provider, historyToTranscript(agent.history))
    if (candidates.length === 0) {
      pushLine("[distill] No knowledge worth saving from this session", C.dim)
      return
    }
    let saved = 0
    for (const c of candidates) {
      pushLine(`── Candidate [${c.type}] ${c.title} (layer: ${c.layer ?? "personal"})`, C.warn)
      for (const line of c.content.split("\n").slice(0, 6)) pushLine(`   ${line}`, C.dim)
      if (c.type === "rule") pushLine("   (rule type — consider writing manually; press y to extract)", C.warn)
      const accept = await askPermission("distill-save", { title: c.title })
      if (!accept) {
        pushLine("   skipped", C.dim)
        continue
      }
      const where = await saveCandidate(agent.memory, c, distillOpts)
      pushLine(`   saved -> ${where}`, C.tool)
      saved++
    }
    pushLine(`[distill] Done: saved ${saved}/${candidates.length} item(s)`, C.tool)
    return saved
  } catch (error) {
    pushLine(`[distill] error: ${error.message}`, C.error)
  } finally {
    state.processing = false
    state.status = "Ready"
    render()
  }
}
