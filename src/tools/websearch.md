Search the web via Bing. Returns result titles, URLs, and snippets. Use for looking up current information, docs, error messages.

Parameters:
- query (required): Search query
- limit: Max results (default 8, max 20)
- engine: Specific engine to use — "bing" (Bing). Omit to search all engines concurrently.
- page: Page number for pagination (1-based, default 1). Only used when engine is specified.

Notes:
- Before searching the web, call `memory_search` first — you may already know the answer from a previous session. Only reach for websearch if memory comes up empty.
- Use this for information that is NOT in the local codebase — current docs, error messages, API references
- Follow up with `fetch` to read full pages from the results
- **Weak engine warning**: Bing's index is noisy for technical queries — if a first websearch returns irrelevant/townhall-grade results, DO NOT retry the same query. Configure a search MCP tool (e.g. `glm-websearch` via the MCP config) for technical lookups; websearch is the fallback.
- Proxy support: set `"proxy": {"uri": "http://host:port", "web": true}` in config.json
