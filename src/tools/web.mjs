import { DESC, truncate, stripTags, htmlToText, isPrivateHost } from "./shared.mjs";
import { URL } from "node:url";
import { resolveWebProxy, proxyFetch } from "../proxy.mjs";

export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
const FETCH_TIMEOUT = 15_000

// ── Web search (Bing; direct by default, through proxy when configured and web toggle on) ──

function extractBing(html) {
  const results = []
  // RSS format: <item><title>..</title><link>..</link><description>..</description></item>
  for (const m of html.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = m[1]
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""
    const href = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? ""
    const snippet = block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ""
    if (!href) continue
    results.push({ href, title: stripTags(title), snippet: stripTags(snippet) })
  }
  // Fallback: HTML b_algo blocks (older server-rendered pages)
  if (results.length === 0) {
    const blocks = html.split('<li class="b_algo"').slice(1)
    for (const block of blocks) {
      const link = block.match(/<h2[^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
      if (!link) continue
      const snippet = block.match(/<p[^>]*>([\s\S]*?)<\/p>/)
      results.push({ href: link[1], title: stripTags(link[2]), snippet: snippet ? stripTags(snippet[1]) : "" })
    }
  }
  return results
}

function bingUrl(query, page) {
  let u = `https://www.bing.com/search?q=${encodeURIComponent(query)}&format=rss&setlang=en`
  if (page > 1) u += `&first=${(page - 1) * 10 + 1}`
  return u
}

const ENGINES = [{ name: "bing", label: "Bing", url: bingUrl, extract: extractBing, ua: UA }]
const ENGINE_NAMES = ENGINES.map(e => e.name)

/** Structured search via Tavily (optional — config.websearch.apiKey). Returns
 *  { engine, results } or null to fall back to Bing HTML scraping. */
async function fetchTavily(query, limit, ctx) {
  const apiKey = ctx?.agent?.config?.websearch?.apiKey
  if (!apiKey) return null
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
  try {
    const response = await proxyFetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ query, search_depth: "basic", max_results: limit, include_answer: false, include_raw_content: false }),
      signal: ctrl.signal,
    }, resolveWebProxy(ctx))
    if (!response.ok) return null
    const data = await response.json()
    const results = (Array.isArray(data.results) ? data.results : []).map((r) => ({
      href: r.url, title: r.title ?? "", snippet: r.content ?? "", _engine: "tavily",
    }))
    return { engine: "tavily", results }
  } catch { return null }
  finally { clearTimeout(timer) }
}

async function fetchEngine(engine, query, page, ctx) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
  try {
    const response = await proxyFetch(engine.url(query, page), {
      headers: { "User-Agent": engine.ua, "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8" },
      signal: ctrl.signal,
    }, resolveWebProxy(ctx))
    if (!response.ok) return null
    const html = await response.text()
    const results = engine.extract(html)
    return { engine: engine.name, results }
  } catch { return null }
  finally { clearTimeout(timer) }
}

export const websearchTool = {
  name: "websearch",
  description: DESC("websearch"),
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number", description: "Max results (default 8, max 20)" },
      engine: { type: "string", enum: ENGINE_NAMES, description: "Specific engine — \"bing\" (Bing). Omit to search all engines concurrently." },
      page: { type: "number", description: "Page number for pagination (1-based, default 1). Only used when engine is specified." },
    },
    required: ["query"],
  },
  readonly: true,
  async execute(args, ctx) {
    const limit = Math.min(args.limit ?? 8, 20)
    const page = Math.max(1, args.page ?? 1)
    // Structured search first when a Tavily key is configured — stable, dated,
    // no HTML scraping. Falls back to Bing silently.
    const tavily = await fetchTavily(args.query, limit, ctx)
    if (tavily && tavily.results.length > 0) {
      return truncate(tavily.results.slice(0, limit).map((r, i) => `${i + 1}. [tavily] ${r.title}\n   ${r.href}\n   ${r.snippet}`).join("\n\n"))
    }
    if (args.engine) {
      const engine = ENGINES.find(e => e.name === args.engine)
      if (!engine) return `Unknown engine '${args.engine}'. Available: ${ENGINE_NAMES.join(", ")}`
      const fetched = await fetchEngine(engine, args.query, page, ctx)
      if (!fetched || fetched.results.length === 0) return "(no results)"
      return truncate(fetched.results.slice(0, limit).map((r, i) => `${i + 1}. [${engine.label}] ${r.title}\n   ${r.href}\n   ${r.snippet}`).join("\n\n"))
    }
    const promises = ENGINES.map(e => fetchEngine(e, args.query, 1, ctx))
    const fetched = (await Promise.all(promises)).filter(Boolean)
    if (fetched.length === 0) return "(no results)"
    const merged = [], indexes = fetched.map(() => 0)
    let done = false
    while (!done && merged.length < limit) {
      done = true
      for (let i = 0; i < fetched.length; i++) {
        if (indexes[i] < fetched[i].results.length) {
          merged.push({ ...fetched[i].results[indexes[i]], _engine: fetched[i].engine })
          indexes[i]++; done = false
          if (merged.length >= limit) break
        }
      }
    }
    return truncate(merged.slice(0, limit).map((r, i) => `${i + 1}. [${r._engine}] ${r.title}\n   ${r.href}\n   ${r.snippet}`).join("\n\n"))
  },
}

// ── Fetch tool (with proxy support) ──────

function isPrivateUrl(urlStr) {
  let u; try { u = new URL(urlStr) } catch { return true }
  return isPrivateHost(u.hostname)
}

// proxyFetch returns a native Response (Headers object, needs .get()) without proxy,
// but a Response-like with a plain lowercase-keyed Record through the CONNECT tunnel — handle both.
function headerOf(res, name) {
  const h = res.headers
  if (!h) return null
  if (typeof h.get === "function") return h.get(name)
  return h[name.toLowerCase()] ?? null
}

/** Validate a redirect target: resolve relative → absolute, http/https only, and
 *  SSRF-checked. Returns { target } on success or { error } (never follows into a
 *  private host — the redirect SSRF bypass). */
export function resolveRedirectTarget(loc, baseUrl) {
  let target
  try { target = new URL(loc, baseUrl).toString() } catch { return { error: "invalid redirect location" } }
  if (!/^https?:\/\//.test(target)) return { error: "redirect target must be http/https" }
  if (isPrivateUrl(target)) return { error: "redirect target is internal/private/metadata" }
  return { target }
}

export const fetchTool = {
  name: "fetch",
  description: DESC("fetch"),
  parameters: { type: "object", properties: { url: { type: "string", description: "http/https URL" } }, required: ["url"] },
  readonly: true,
  async execute(args, ctx) {
    if (!/^https?:\/\//.test(args.url)) throw new Error("url must start with http:// or https://")
    if (isPrivateUrl(args.url)) throw new Error("fetch blocked: internal/private/metadata addresses are not allowed")
    try {
      const proxyUri = resolveWebProxy(ctx)
      const response = await proxyFetch(args.url, { headers: { "User-Agent": UA } }, proxyUri)
      if (!response.ok) {
        if ([301, 302, 307, 308].includes(response.status)) {
          const loc = headerOf(response, "location")
          if (loc) {
            // SSRF-check the redirect target (resolve relative → absolute) before
            // following — a 3xx must not bounce a public URL into a private host.
            const r = resolveRedirectTarget(loc, args.url)
            if (r.error) throw new Error(`fetch failed: ${r.error}`)
            const r2 = await proxyFetch(r.target, { headers: { "User-Agent": UA } }, proxyUri)
            if (!r2.ok) throw new Error(`fetch failed: HTTP ${r2.status}`)
            const ct2 = headerOf(r2, "content-type") ?? ""
            const b2 = await r2.text()
            return ct2.includes("text/html") ? truncate(htmlToText(b2)) : truncate(b2)
          }
        }
        throw new Error(`fetch failed: HTTP ${response.status}`)
      }
      const ct = headerOf(response, "content-type") ?? ""
      const body = await response.text()
      return ct.includes("text/html") ? truncate(htmlToText(body)) : truncate(body)
    } catch (e) { throw new Error(`fetch failed: ${e.cause?.code ?? e.message}`, { cause: e }) }
  },
}
