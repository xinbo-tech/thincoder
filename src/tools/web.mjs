/**
 * web.mjs — Web tools: websearch, fetch
 * Proxy is a PER-CALL parameter (args.proxy) since 2026-08-31 — config.json fixed
 * proxy (proxy.web) is no longer auto-applied to tools: fixed config broke domestic
 * sites (gitee unreachable via foreign proxy), per-call lets the model pick by target.
 */

import { proxyFetch } from "../proxy.mjs"
import { isPrivateHost } from "./shared.mjs"
import { URL } from "node:url"

/** True when the URL resolves to a private/internal host (SSRF guard). */
function isPrivateUrl(urlStr) {
  let u; try { u = new URL(urlStr) } catch { return true }
  return isPrivateHost(u.hostname)
}

/** Structured search via Tavily (optional — config.websearch.apiKey). Returns a
 *  formatted result string, or null to fall back to Bing HTML scraping.
 *  proxyUri: explicit per-call proxy (args.proxy) — never the config.json one. */
async function fetchTavily(query, limit, ctx, proxyUri) {
  const apiKey = ctx?.agent?.config?.websearch?.apiKey
  if (!apiKey) return null
  try {
    const res = await proxyFetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ query, search_depth: "basic", max_results: limit, include_answer: false, include_raw_content: false }),
      signal: AbortSignal.timeout(15000),
    }, proxyUri)
    if (!res.ok) return null
    const data = await res.json()
    const results = Array.isArray(data.results) ? data.results : []
    if (results.length === 0) return null
    return results.slice(0, limit).map((r, i) => `${i + 1}. [tavily] ${r.title ?? ""}\n   ${r.url}\n   ${r.content ?? ""}`).join("\n\n")
  } catch {
    return null // any failure → Bing fallback
  }
}

export const websearchTool = {
  readonly: true,
  name: "websearch",
  description:
    "Search the web. Returns result titles, URLs, and snippets.\n" +
    "Parameters:\n" +
    "- query (required): Search query\n" +
    "- limit: Max results (default 8)\n" +
    "- proxy: http://host:port explicit proxy (optional) — use ONLY when passed; no proxy = direct. config.json proxy is NOT auto-applied (2026-08-31 ruling); Bing/foreign sites usually need a proxy, domestic targets don't\n" +
    "Notes: Bing's index is noisy for technical queries — if a first search returns irrelevant results, DO NOT retry the same query. Configure a search MCP tool (e.g. glm-websearch) for technical lookups; websearch is the fallback. Call the memory tool (action: search) first — the answer may already be in a previous session.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number", description: "Max results" },
      proxy: { type: "string", description: "http://host:port explicit proxy (optional) — use ONLY when passed; no proxy = direct" },
    },
    required: ["query"],
  },
  async execute({ query, limit, proxy }, ctx) {
    const max = limit || 8
    const proxyUri = proxy ?? null
    // Structured search first when a Tavily key is configured (stable, no HTML
    // scraping); silently falls back to Bing HTML extraction.
    const tavily = await fetchTavily(query, max, ctx, proxyUri)
    if (tavily) return tavily
    try {
      const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${max}`
      const res = await proxyFetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThinCoder-VSCode/0.1" },
      }, proxyUri)
      const html = await res.text()
      // Simple extraction: find result snippets
      const results = []
      const snippetRe = /<li class="b_algo"[^>]*>[\s\S]*?<h2[^>]*><a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi
      let match
      while ((match = snippetRe.exec(html)) && results.length < max) {
        results.push({
          url: match[1],
          title: match[2].replace(/<[^>]+>/g, "").trim(),
          snippet: match[3].replace(/<[^>]+>/g, "").trim(),
        })
      }
      if (results.length === 0) return "(no results found)"
      return results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`).join("\n\n")
    } catch (e) {
      return `websearch error: ${e.message}`
    }
  },
}

export const fetchTool = {
  readonly: true,
  name: "fetch",
  description:
    "Fetch a URL and return its content as text.\n" +
    "Parameters:\n" +
    "- url (required): http/https URL\n" +
    "- proxy: http://host:port explicit proxy (optional) — use ONLY when passed; no proxy = direct. config.json proxy is NOT auto-applied (2026-08-31 ruling); pick per target",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "URL to fetch" },
      proxy: { type: "string", description: "http://host:port explicit proxy (optional) — use ONLY when passed; no proxy = direct" },
    },
    required: ["url"],
  },
  async execute({ url, proxy }, ctx) {
    // SSRF guard (CLI parity): http/https only, and no private/internal targets.
    if (!/^https?:\/\//.test(url)) return "fetch error: url must start with http:// or https://"
    if (isPrivateUrl(url)) return "fetch error: internal/private/metadata addresses are not allowed"
    try {
      const proxyUri = proxy ?? null
      const res = await proxyFetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 ThinCoder-VSCode/0.1" },
        signal: AbortSignal.timeout(20000),
        // No automatic redirect following: a 3xx could bounce a public URL into
        // a private host (SSRF via redirect). Refuse instead of chasing it.
        redirect: "manual",
      }, proxyUri)
      if ([301, 302, 307, 308].includes(res.status)) {
        return `fetch error: redirect (HTTP ${res.status}) not followed`
      }
      const text = await res.text()
      // Strip HTML tags for cleaner output
      const stripped = text.replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
      const hint = stripped.length < 300
        ? (/unavailable in (your )?region|not available in (your )?region|app-unavailable|enable.?javascript|just a moment|attention required|cf-browser-verification/i.test(text)
          ? "\n\n[fetch hint: page looks region-blocked or JS-gated (body <300 chars). Try a search MCP tool or the site's .md/raw/mirror endpoint]"
          : /<div[^>]+id="(app|root)"[^>]*>\s*<\/div>|id="app"|id="root"/i.test(text)
            ? "\n\n[fetch hint: page is a JS-rendered SPA shell (body <300 chars). Try a search MCP tool or the site's .md/API endpoint]"
            : "")
        : ""
      return stripped.slice(0, 20000) + hint
    } catch (e) {
      return `fetch error: ${e.message}`
    }
  },
}
