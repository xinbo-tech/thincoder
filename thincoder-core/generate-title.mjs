/**
 * generate-title.mjs — LLM-generated session titles
 * Called after the first user message to auto-title the session.
 *
 * §2.5 #163 并入：按 `provider.format` 三格式分派（VSC 侧能力归位）——openai 兼容（缺省/
 * 未知）/ anthropic / google；各格式的 thinking 禁用形态与响应提取各自适配（IK9UZ8：
 * thinking 模型会把输出预算烧在 reasoning 上、content 为空——标题静默失败）。
 * 定制头（`provider.headers`）与代理路径（`proxyUri`）为 CLI 侧口径，三格式共用。
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
    const system = "Generate a concise title (max 40 chars, no quotes) for this conversation. Reply ONLY with the title."
    const text = userText.slice(0, 200)
    let url, body, extract
    if (provider.format === "anthropic") {
      url = `${provider.baseURL.replace(/\/+$/, "")}/messages`
      body = JSON.stringify({
        model: provider.model,
        system,
        messages: [{ role: "user", content: text }],
        max_tokens: MAX_TITLE_TOKENS,
        stream: false,
        thinking: { type: "disabled" }, // IK9UZ8：不让 reasoning 吃掉输出预算
      })
      extract = (data) => data.content?.map((b) => b.text || "").join("")
    } else if (provider.format === "google") {
      url = `${provider.baseURL.replace(/\/+$/, "")}/models/${encodeURIComponent(provider.model)}:generateContent?key=${encodeURIComponent(provider.apiKey)}`
      body = JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: { maxOutputTokens: MAX_TITLE_TOKENS, thinkingConfig: { thinkingLevel: "none" } }, // IK9UZ8
      })
      extract = (data) => data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("")
    } else {
      const bodyObj = {
        model: provider.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
        // Disable thinking so reasoning_content doesn't consume the whole output budget and
        // leave content empty (IK9UZ8). Providers that don't accept the field ignore it
        // (OpenAI-compatible convention). A 40-char title wants ~60–80 tokens, so 100 is
        // ~2.5x headroom (design decision — docs/core/design/SESSION.md §6.7).
        thinking: { type: "disabled" },
        max_tokens: MAX_TITLE_TOKENS,
        stream: false,
      }
      const chatPath = provider.chatPath ?? "/chat/completions"
      url = `${provider.baseURL.replace(/\/+$/, "")}${chatPath}`
      body = JSON.stringify(bodyObj)
      extract = (data) => data.choices?.[0]?.message?.content
    }
    // 定制头展开（PROVIDER.md §6.17）——定制头在前、内置头在后：内置头胜出；三格式各自内置头。
    const headers = { ...(provider.headers ?? {}), "Content-Type": "application/json" }
    if (provider.format === "anthropic") {
      headers["x-api-key"] = provider.apiKey
      headers["anthropic-version"] = "2023-06-01"
    } else if (provider.format !== "google") {
      headers.Authorization = `Bearer ${provider.apiKey}` // google 走 URL key
    }
    const opts = {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    }
    const res = provider.proxyUri
      ? await _deps.proxyFetchImpl(url, opts, provider.proxyUri)
      : await fetch(url, opts)
    if (!res.ok) return null
    const data = await res.json()
    const title = extract(data)?.trim().slice(0, 40)
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
    // TUI-OOM-ROOTCAUSE 批（SESSION.md §6.14）：绑定态首条 user 消息在记录存储（段 1）——
    // 内存窗口可能已滑过它（store.firstUserMessage 首扫一次并缓存）；未绑定回退内存查找。
    let firstUser = agent._recordStore?.firstUserMessage?.() ?? null
    if (!firstUser) {
      firstUser = (agent._fullHistory ?? agent.history).find(
        (m) => m.role === "user" && typeof m.content === "string" && !m.content.startsWith("[System reminder:"),
      )
    }
    if (firstUser) {
      const title = await generateTitle(firstUser.content, agent.provider)
      if (title) agent.title = title
    }
  } catch {
    // Title generation failure is non-fatal
  }
  return agent.title ?? null
}