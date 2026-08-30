/**
 * generate-title.mjs — LLM-generated session titles (CLI side)
 * Called after the first user message to auto-title the session.
 * Mirrors thincoder-vscode/src/extension/generate-title.mjs but uses the CLI provider shape.
 *
 * CLI is OpenAI-compatible ONLY: a single direct fetch (no anthropic/google format dispatch) —
 * see docs/design/SESSION.md §IK9UZ8-D.
 */

import { proxyFetch } from "./proxy.mjs"

// Test seam (_-prefix, mirrors run.mjs seams): lets the proxy-branch regression
// test swap the proxy fetch. The branch it exercises used to carry a dynamic
// import("../proxy.mjs") that silently resolved to the REPO ROOT from src/ —
// the thrown ERR_MODULE_NOT_FOUND vanished into the catch, and proxy users
// lost session titles with zero test coverage (2026-08-30 review).
export const _deps = { proxyFetchImpl: proxyFetch }

const MAX_TITLE_TOKENS = 100

/** Generate a session title from the first user message using an LLM. Returns title string or null. */
export async function generateTitle(userContent, provider) {
  // Extract text even from multimodal content (array of parts)
  const userText = Array.isArray(userContent)
    ? userContent.find((p) => p.type === "text")?.text || ""
    : userContent
  if (typeof userText !== "string" || userText.length < 10) return null
  if (!provider?.apiKey || !provider?.baseURL || !provider?.model) return null

  try {
    const body = JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: "Generate a concise title (max 40 chars, no quotes) for this conversation. Reply ONLY with the title." },
        { role: "user", content: userText.slice(0, 200) },
      ],
      // Disable thinking so reasoning_content doesn't consume the whole output budget and
      // leave content empty (IK9UZ8). Providers that don't accept the field ignore it
      // (OpenAI-compatible convention). A 40-char title wants ~60–80 tokens, so 100 is
      // ~2.5x headroom (design decision — docs/design/SESSION.md §IK9UZ8-D).
      thinking: { type: "disabled" },
      max_tokens: MAX_TITLE_TOKENS,
      stream: false,
    })
    const chatPath = provider.chatPath ?? "/chat/completions"
    const url = `${provider.baseURL.replace(/\/+$/, "")}${chatPath}`
    const opts = {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
      body,
      signal: AbortSignal.timeout(10000),
    }
    const res = provider.proxyUri
      ? await _deps.proxyFetchImpl(url, opts, provider.proxyUri)
      : await fetch(url, opts)
    if (!res.ok) return null
    const data = await res.json()
    const title = data.choices?.[0]?.message?.content?.trim().slice(0, 40)
    return title || null
  } catch {
    return null
  }
}

/** Derive + assign the session title from the first user message (once per session).
 *  Extracted from agent-turn.mjs's finally block (2026-08-30): the lookup + call +
 *  assign belongs beside generateTitle, not in the turn driver. Non-fatal on
 *  failure — title generation must never break the turn. Returns the title (or null). */
export async function ensureSessionTitle(agent) {
  if (agent.title) return agent.title
  try {
    const firstUser = (agent._fullHistory ?? agent.history).find(
      (m) => m.role === "user" && typeof m.content === "string" && !m.content.startsWith("[System reminder:"),
    )
    if (firstUser) {
      const title = await generateTitle(firstUser.content, agent.provider)
      if (title) agent.title = title
    }
  } catch {
    // Title generation failure is non-fatal
  }
  return agent.title ?? null
}