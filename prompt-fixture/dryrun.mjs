/**
 * dryrun.mjs — the scripted replay behind `--dry-run`: zero network, deterministic readings.
 *
 * The script is data (`dry-run.json`): per scenario a list of run entries, each holding the
 * responses of one run in call order. Entries are taken by the scenario's run sequence; an
 * overrun throws instead of inventing an answer, so a missing entry can never look like a model
 * that stayed quiet.
 */

import { readFileSync } from "node:fs"
import { DRY_RUN_FILE } from "./data.mjs"
import { classify } from "./scenarios.mjs"
import { DECLARED_TOOL_NAMES } from "./tools.mjs"

export function loadScript(file = DRY_RUN_FILE) {
  try {
    return JSON.parse(readFileSync(file, "utf8"))
  } catch (error) {
    throw new Error(`dry-run script unreadable: ${file} (${error.message})`)
  }
}

/** Replay one entry of the script: responses are handed out in order, an overrun throws. */
export function createScriptTransport({ script, scenario, runIndex }) {
  const entries = script?.scenarios?.[scenario.id]?.runs
  if (!Array.isArray(entries) || entries.length === 0) throw new Error(`dry-run script has no entries for scenario "${scenario.id}"`)
  if (runIndex > entries.length) {
    throw new Error(`dry-run script exhausted for scenario "${scenario.id}": run #${runIndex} but only ${entries.length} entries`)
  }
  const responses = entries[runIndex - 1]?.responses ?? []
  let cursor = 0
  return () => {
    if (cursor >= responses.length) {
      throw new Error(`dry-run script exhausted for scenario "${scenario.id}" run #${runIndex} at call #${cursor + 1}`)
    }
    const raw = responses[cursor]
    cursor += 1
    return {
      content: typeof raw?.content === "string" ? raw.content : "",
      reasoning: typeof raw?.reasoning === "string" ? raw.reasoning : "",
      toolCalls: (raw?.toolCalls ?? []).map((call, i) => ({
        id: call.id ?? `call_${runIndex}_${cursor}_${i + 1}`,
        name: call.name,
        arguments: typeof call.arguments === "string" ? call.arguments : JSON.stringify(call.arguments ?? {}),
      })),
      usage: raw?.usage ?? null,
      finishReason: raw?.finishReason ?? null,
    }
  }
}

/** What the script covers, read with the scenario's own verdicts — visible before any model runs. */
export function scriptCoverage(script, scenario) {
  const entries = script?.scenarios?.[scenario.id]?.runs ?? []
  return entries.map((entry, i) => {
    const names = (entry.responses ?? []).flatMap((response) => (response.toolCalls ?? []).map((call) => call.name))
    return {
      index: i + 1,
      verdict: classify(names, scenario.verdicts),
      unknown: names.filter((name) => !DECLARED_TOOL_NAMES.includes(name)).length,
    }
  })
}
