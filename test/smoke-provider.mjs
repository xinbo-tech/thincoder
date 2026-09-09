/**
 * smoke-provider.mjs — Direct connection test for each provider
 * Usage: node test/smoke-provider.mjs <provider-name> <api-key>
 *
 * Dumps raw response headers, raw SSE lines, and parsed result.
 * Does NOT import any VS Code modules — pure Node.js.
 */

import { chat } from "../src/provider.mjs"
import { PROVIDER_PRESETS } from "../src/config-io.mjs"

// Single source of truth — do NOT hand-maintain a duplicate table (it drifted:
// deepseek baseURL gained "/v1", minimax pointed at the old .chat host).
const PRESETS = PROVIDER_PRESETS

const name = process.argv[2]
const apiKey = process.argv[3]

if (!name || !apiKey) {
  console.error("Usage: node test/smoke-provider.mjs <name> <api-key>")
  console.error("  names: " + Object.keys(PRESETS).join(" | "))
  process.exit(1)
}
const preset = PRESETS[name]
if (!preset) { console.error(`Unknown: ${name}. Valid: ${Object.keys(PRESETS).join(" ")}`); process.exit(1) }

const provider = {
  baseURL: preset.baseURL,
  apiKey,
  model: preset.models?.[0] ?? "", // MODEL-MERGE-SESSION：preset model 字段退役 → models 种子首项
  maxTokens: preset.maxTokens,
  ...(preset.thinking ? { thinking: preset.thinking } : {}),
  ...(preset.reasoningEffort ? { reasoningEffort: preset.reasoningEffort } : {}),
  ...(preset.chatPath ? { chatPath: preset.chatPath } : {}),
  ...(preset.format ? { format: preset.format } : {}),
}

console.log("=== Provider ===")
console.log(JSON.stringify({ ...provider, apiKey: "***" }, null, 2))

const messages = [{ role: "user", content: "Say hello in exactly one sentence." }]

console.log("\n=== Sending request ===")
const start = Date.now()
try {
  const result = await chat(provider, {
    messages,
    tools: [],
    onToken: (t) => process.stdout.write(t),
    onReasoning: (r) => process.stderr.write(`\n[reasoning] ${r.slice(0, 200)}`),
  })
  console.log(`\n\n=== Result (${Date.now() - start}ms) ===`)
  console.log("content:", result.content?.slice(0, 500))
  console.log("reasoning:", result.reasoning?.slice(0, 200) || "(none)")
  console.log("finishReason:", result.finishReason)
  console.log("toolCalls:", result.toolCalls?.length ?? 0)
  console.log("usage:", JSON.stringify(result.usage))
  console.log("\n✓ OK")
} catch (e) {
  console.log(`\n=== Error (${Date.now() - start}ms) ===`)
  console.log(e.message)
  if (e.stack) console.log("\nStack:", e.stack)
  process.exit(1)
}
