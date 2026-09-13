Search the web. Returns result titles, URLs, and snippets. Use for looking up current information, docs, error messages.

Parameters:
- query (required): Search query
- limit: Max results (default 8)
- proxy: http://host:port explicit proxy (optional) — use ONLY when passed; no proxy = direct. config.json proxy is NOT auto-applied (2026-08-31 ruling); Bing/foreign sites usually need a proxy, domestic targets don't

Notes:
- Before searching the web, call the memory tool (action: search) first — you may already know the answer from a previous session. Only reach for websearch if memory comes up empty.
- Runs synchronously — returns when the search completes.
- Use this for information that is NOT in the local codebase — current docs, error messages, API references
- Follow up with `fetch` to read full pages from the results
- **Weak engine warning**: Bing's index is noisy for technical queries — if a first websearch returns irrelevant/townhall-grade results, DO NOT retry the same query. Configure a search MCP tool (e.g. `glm-websearch` via the MCP config) for technical lookups; websearch is the fallback.
- Proxy: NOT auto-applied from config.json (2026-08-31 ruling). Pass `proxy: "http://host:port"` explicitly when the target needs one; omit for domestic targets.
