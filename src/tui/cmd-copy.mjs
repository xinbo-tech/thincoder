/**
 * cmd-copy.mjs — /copy command: copy the last assistant response to the clipboard.
 * Copies the RAW markdown reply (agent.history content), not the ANSI-styled display.
 */
import { C } from "./ansi.mjs"
import { writeClipboardText } from "./clipboard.mjs"

/** Most recent assistant reply with non-empty text content (skips tool-calls-only / transient). */
export function lastAssistantContent(history) {
  if (!Array.isArray(history)) return null
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i]
    if (m?.role === "assistant" && typeof m.content === "string" && m.content.trim().length > 0) {
      return m.content
    }
  }
  return null
}

export async function handleCopyCommand(ctx) {
  const { agent, pushLine } = ctx
  const text = lastAssistantContent(agent?.history)
  if (!text) {
    pushLine("No assistant response to copy yet", C.warn)
    return
  }
  const ok = await writeClipboardText(text)
  pushLine(ok ? `Copied last response (${text.length} chars) to clipboard` : "Clipboard write failed", ok ? C.tool : C.error)
}