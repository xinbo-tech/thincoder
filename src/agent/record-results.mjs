/**
 * record-results.mjs — tool result commit + mutation accounting (split from
 * agent.mjs 2026-08-30, consult P2: the 100-line loop was pure bookkeeping
 * mixed into the run loop; it now lives behind one call).
 *
 * Contract (moved verbatim from the run loop):
 *  - Multimodal tool results ({ text, images }) close the tool pairing with a
 *    tool message, then inject the images as a multimodal user message — but
 *    NEVER between tool messages of parallel calls (strict providers 400 when
 *    a tool message does not immediately follow its assistant tool_calls), so
 *    image injections are DEFERRED until all results are committed.
 *  - Non-vision models get a text-only System-reminder instead of image parts
 *    (image parts 400 on every subsequent request — defense-in-depth).
 *  - FILE_MUTATORS invalidate advisor/verify state (code changed → prior
 *    review/verify is stale); non-mutating side-effect tools (bash/git)
 *    invalidate verify only (user decision 2026-08-08: reviews trigger on
 *    code mutations, not environment changes).
 *  - advisor calls always advance _advisorRound (convergence budget counts
 *    attempts, not successes).
 *  - Mutations feed _touchedFiles and fire-and-forget memory reindex.
 */
import { pushReal } from "../context.mjs"
import { specForModel } from "../config.mjs"
import { FILE_MUTATORS } from "./helpers.mjs"
import { join } from "node:path"

let _reindexFile = null

export async function recordToolResults(agent, toolByName, results) {
  // Multimodal user messages (injected images / not-injected reminders) must NOT be pushed
  // between tool results of parallel calls — strict providers (DeepSeek) 400 when a tool
  // message does not immediately follow its assistant tool_calls. Defer to after the loop.
  // real: image injections are real messages (pushReal → _fullHistory); reminders stay machine-only.
  const deferredUserMsgs = []

  for (const { toolCall, result, ok } of results) {
    const tool = toolByName.get(toolCall.name)
    // Multimodal tools return JSON { text, images } — inject as multimodal user message
    if (tool?.multimodal && ok) {
      try {
        const parsed = JSON.parse(result)
        if (parsed.images?.length) {
          // tool message first — closes the tool_call pairing (OpenAI API requires tool result immediately after assistant with tool_calls)
          pushReal(agent, { role: "tool", tool_call_id: toolCall.id, name: toolCall.name, content: parsed.text })
          if (specForModel(agent.provider.model).multimodal) {
            // then inject multimodal user message with base64 images for the model to actually "see" them on the next turn
            deferredUserMsgs.push({
              real: true,
              msg: {
                role: "user",
                content: [{ type: "text", text: parsed.text }, ...parsed.images],
              },
            })
          } else {
            // Non-vision model: image parts must never enter history — text-only APIs 400 on them on EVERY
            // subsequent request, poisoning the conversation. (read_image itself already refuses; this is defense-in-depth.)
            deferredUserMsgs.push({
              real: false,
              msg: {
                role: "user",
                content: `[System reminder: the image returned by ${toolCall.name} was NOT injected — model ${agent.provider.model} does not support image input. Do not call ${toolCall.name} again under this provider; verify visual output programmatically instead.]`,
              },
            })
          }
          continue
        }
      } catch { /* Parse failure doesn't affect normal tool messages */ }
    }
    pushReal(agent, { role: "tool", tool_call_id: toolCall.id, name: toolCall.name, content: result })
    if (tool && ok) {
      if (FILE_MUTATORS.has(toolCall.name)) {
        // Direct file edit — code was changed. The prior advisor review and
        // verify are stale: a review that ran before the edit no longer
        // covers the current file state.
        agent._mutatedThisRun = true
        agent._calledAdvisorThisRun = false
        agent._verifiedThisRun = false
        agent._verifyPassed = undefined
      } else if (!tool.readonly && !tool.sideEffectExempt) {
        // Non-mutating side-effect tools (bash, git): do NOT invalidate the
        // advisor review — a review is triggered by CODE MUTATIONS only
        // (user decision 2026-08-08: the guard rule is "review after code
        // changes", not "review after any environment change"; bash is
        // barred from writing files, so it cannot change the reviewed code).
        // Verify IS invalidated: its state snapshot (git diff, file list)
        // may be stale after git/shell operations.
        if (agent._verifiedThisRun) {
          agent._verifiedThisRun = false
          agent._verifyPassed = undefined
        }
      }
      if (toolCall.name === "verify") agent._verifiedThisRun = true
      if (toolCall.name === "advisor") {
        agent._calledAdvisorThisRun = true
        // All advisor calls (code and design) share the 5-round convergence
        // budget — each advances _advisorRound toward MAX_ADVISOR_ROUNDS.
        // Always advance the round — the convergence protocol cares about
        // how many reviews have run (round 1→2→3→4→5), not how many succeeded.
        // A failed/interrupted review is still a review attempt and should use
        // the next round's prompt on retry.
        agent._advisorRound++
      }
      if (FILE_MUTATORS.has(toolCall.name)) {
        const args = JSON.parse(toolCall.arguments)
        const paths = tool.touchedPaths ? tool.touchedPaths(args) : [args.path]
        for (const p of paths) {
          const abs = join(agent.cwd, p)
          if (!agent._touchedFiles.includes(abs)) agent._touchedFiles.push(abs)
          if (agent.memory) {
            // Fire-and-forget: don't block the agent loop on indexing.
            // Reuses a single cached import; errors surface as pending reminders on next turn.
            if (!_reindexFile) {
              const mod = await import("../memory.mjs")
              _reindexFile = mod.reindexFile
            }
            _reindexFile(agent.memory, agent.cwd, abs).catch((e) => {
              agent._pendingReminders.push(`[System reminder: background indexing failed for ${toolCall.name} on ${abs}: ${e.message}. This does not affect your work — the code index will catch up on next reindex.]`)
            })
          }
        }
      }
    }
  }

  // All tool results committed — now safe to inject deferred multimodal user messages
  for (const { real, msg } of deferredUserMsgs) {
    if (real) pushReal(agent, msg)
    else agent.history.push(msg)
  }
}
