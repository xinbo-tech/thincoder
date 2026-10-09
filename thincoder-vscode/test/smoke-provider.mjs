/**
 * smoke-provider.mjs — Direct connection test for each provider
 * Usage: node test/smoke-provider.mjs <provider-name> <api-key> <model>（模型须显式给——渠道不携模型 · 2026-10-09 清除批）
 *
 * Dumps raw response headers, raw SSE lines, and parsed result.
 * Does NOT import any VS Code modules — pure Node.js.
 */

import { chat } from "@thincoder/core/provider/core.mjs"
import { PROVIDER_PRESETS } from "@thincoder/core/config.mjs"

// Single source of truth — do NOT hand-maintain a duplicate table (it drifted:
// deepseek baseURL gained "/v1", minimax pointed at the old .chat host).
const PRESETS = PROVIDER_PRESETS

const name = process.argv[2]
const apiKey = process.argv[3]
const model = process.argv[4] // 显式模型（渠道不携模型——2026-10-09 清除批）

if (!name || !apiKey || !model) {
  console.error("Usage: node test/smoke-provider.mjs <name> <api-key> <model>")
  console.error("  names: " + Object.keys(PRESETS).join(" | "))
  process.exit(1)
}
const preset = PRESETS[name]
if (!preset) { console.error(`Unknown: ${name}. Valid: ${Object.keys(PRESETS).join(" ")}`); process.exit(1) }

const provider = {
  baseURL: preset.baseURL,
  apiKey,
  model, // 显式模型（渠道不携模型——2026-10-09 清除批；预设零 model 键）
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
