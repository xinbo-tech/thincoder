/**
 * runner.mjs — one run = one copy × scenario × model × repeat.
 *
 * The loop belongs to the product's shape: a model call, then either no tool calls (the user turn
 * ends) or the tool calls are executed and fed back, up to `maxRounds` per user turn. It does NOT
 * stop when a verdict becomes reachable: the verdict is a post-hoc reading of the whole tool
 * sequence, so stopping early would change `toolSeq`, `calls` and `roundsExhausted` readings.
 *
 * The transport is a function parameter (`transport ?? realTransport`) — the single test seam.
 * Default null means the real provider call, so production behaviour is unchanged; a dry run
 * passes a script replayer and a unit test passes its own stub. No module-level hook, hence no
 * "forgot to reset it" leak.
 */

import { chat } from "../thincoder-core/provider/index.mjs"
import { assistantToolCallMessage, specForModel } from "../thincoder-core/config.mjs"
import { DEFAULT_CALL_TIMEOUT_MS, DEFAULT_MAX_ROUNDS } from "./data.mjs"
import { classify } from "./scenarios.mjs"
import { createExecutor, schemasFor } from "./tools.mjs"

/** The real transport: one provider call, exactly as the product makes it. */
export async function realTransport({ provider, messages, tools, signal }) {
  if (!provider) throw new Error("no provider assembled for a live call — pass --models (dry-run uses its own transport)")
  return chat(provider, { messages, tools, signal, logCtx: { stage: "prompt-fixture" } })
}

/** Tool-call arguments arrive as a JSON string from the wire; an unparseable payload becomes `{}`.*/
export function parseToolArguments(raw) {
  if (raw && typeof raw === "object") return raw
  if (typeof raw !== "string" || raw.trim() === "") return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/**
 * Run one unit and return the run record (12 fields, see the design's field table).
 * A failed call records `error` and stops that run — no retry, no make-up run: a failure that
 * happened must stay in the readings instead of being quietly re-executed.
 */
export async function runOnce({ copy, scenario, model, repeat = 1, provider = null, transport = null, callTimeoutMs = DEFAULT_CALL_TIMEOUT_MS }) {
  const send = transport ?? realTransport
  const executor = createExecutor({ sandbox: scenario.sandbox ?? {} })
  const tools = schemasFor(scenario.tools)
  // The spec decides whether the reasoning echo must be carried back; a dry run has no model to
  // look up (its label is a placeholder), so it takes the neutral spec instead of a spec warning.
  const spec = provider ? specForModel(provider.model) : null
  const rounds = scenario.maxRounds ?? DEFAULT_MAX_ROUNDS
  const turns = [scenario.prompt, ...(scenario.followUps ?? [])]
  const messages = [{ role: "system", content: copy.prompt }, { role: "user", content: turns[0] }]

  const toolSeq = []
  const usage = { prompt: 0, completion: 0 }
  let usageSeen = false
  let calls = 0
  let turnsUsed = 0
  let roundsExhausted = false
  let verdict = null
  let error = null

  try {
    for (let turn = 0; turn < turns.length; turn += 1) {
      if (turn > 0) messages.push({ role: "user", content: turns[turn] })
      turnsUsed = turn + 1
      let round = 0
      for (; round < rounds; round += 1) {
        const response = await send({ provider, model, messages, tools, signal: AbortSignal.timeout(callTimeoutMs) })
        calls += 1
        takeUsage(response?.usage, usage, () => { usageSeen = true })

        const toolCalls = Array.isArray(response?.toolCalls) ? response.toolCalls : []
        if (toolCalls.length === 0) break

        // Reasoning echo matters for providers that require it — use the product's own builder.
        messages.push(assistantToolCallMessage(response, spec))
        for (const call of toolCalls) {
          toolSeq.push(call.name)
          const result = executor.run(call.name, parseToolArguments(call.arguments))
          messages.push({ role: "tool", tool_call_id: call.id, name: call.name, content: result.content })
        }
        if (round === rounds - 1) roundsExhausted = true
      }
    }
    verdict = classify(toolSeq, scenario.verdicts)
  } catch (failure) {
    error = String(failure?.message ?? failure)
  }

  return {
    copyId: copy.id,
    scenarioId: scenario.id,
    model,
    repeat,
    verdict,
    toolSeq,
    turnsUsed,
    calls,
    roundsExhausted,
    tokens: usageSeen ? { prompt: usage.prompt, completion: usage.completion } : null,
    unknownToolCalls: executor.unknownToolCalls(),
    error,
  }
}

/**
 * `usage.prompt_tokens → prompt` / `usage.completion_tokens → completion`.
 * A response without `usage`, or with both keys undefined, contributes nothing — the run then
 * reports `tokens: null` rather than an estimated 0.
 */
function takeUsage(raw, sink, markSeen) {
  if (!raw || (raw.prompt_tokens === undefined && raw.completion_tokens === undefined)) return
  markSeen()
  sink.prompt += raw.prompt_tokens ?? 0
  sink.completion += raw.completion_tokens ?? 0
}
