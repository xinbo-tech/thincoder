/**
 * generate-title.mjs — LLM-generated session titles
 * Called from ChatPanel._generateTitle() with (userContent, providerName, modelName).
 *
 * IK9UZ8 (2026-08-25, CLI parity 3c1815e): thinking models burn the whole output budget on
 * reasoning_content and leave content empty → title generation silently fails. Fix: disable
 * thinking per format (openai: thinking field; anthropic: thinking param; google:
 * thinkingConfig) and raise max tokens 30→100 (a 40-char title wants ~60-80; 100 is headroom).
 */
import { getKey, buildProvider } from "./presets.mjs"

/** Generate a session title from the first user message using an LLM. Returns title string or null. */
export async function generateTitle(userContent, providerName, _modelName) {
  // Extract text even from multimodal content (array of parts)
  const userText = Array.isArray(userContent)
    ? userContent.find(p => p.type === "text")?.text || ""
    : userContent
  if (typeof userText !== "string" || userText.length < 10) return null

  const key = await getKey(providerName)
  if (!key) return null
  const prov = await buildProvider(providerName)
  if (!prov) return null

  try {
    const title = await requestTitle(prov, userText.slice(0, 200))
    return title?.trim().slice(0, 40) || null
  } catch {
    return null
  }
}

/** Non-streaming title request, routed by provider.format (same transport split as provider.mjs). */
async function requestTitle(prov, text) {
  const system = "Generate a concise title (max 40 chars, no quotes) for this conversation. Reply ONLY with the title."
  const headers = { "Content-Type": "application/json" }
  if (prov.format === "anthropic") headers["x-api-key"] = prov.apiKey
  else headers.Authorization = `Bearer ${prov.apiKey}`
  if (prov.format === "anthropic") headers["anthropic-version"] = "2023-06-01"

  let url, body, extract
  if (prov.format === "anthropic") {
    url = `${prov.baseURL}/messages`
    body = JSON.stringify({
      model: prov.model,
      system,
      messages: [{ role: "user", content: text }],
      max_tokens: 100, stream: false,
      thinking: { type: "disabled" }, // IK9UZ8: don't let reasoning eat the budget
    })
    extract = (data) => data.content?.map((b) => b.text || "").join("")
  } else if (prov.format === "google") {
    url = `${prov.baseURL}/models/${encodeURIComponent(prov.model)}:generateContent?key=${encodeURIComponent(prov.apiKey)}`
    body = JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: { maxOutputTokens: 100, thinkingConfig: { thinkingLevel: "none" } }, // IK9UZ8
    })
    extract = (data) => data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("")
  } else {
    const chatPath = prov.chatPath ?? "/chat/completions"
    url = `${prov.baseURL.replace(/\/+$/, "")}${chatPath}`
    body = JSON.stringify({
      model: prov.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: text },
      ],
      // IK9UZ8 (CLI parity): disable thinking so reasoning_content doesn't consume the whole
      // output budget and leave content empty. Providers that don't accept the field ignore it
      // (OpenAI-compatible convention). 100 tokens = ~2.5x headroom for a 40-char title.
      thinking: { type: "disabled" },
      max_tokens: 100, stream: false,
    })
    extract = (data) => data.choices?.[0]?.message?.content
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return null
  const data = await res.json()
  return extract(data) || null
}
