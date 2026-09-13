Fetch a URL and return its content as text. HTML pages are stripped to readable text. Use after websearch to read full documents.

Parameters:
- url (required): http/https URL
- proxy: http://host:port explicit proxy (optional) — use ONLY when passed; no proxy = direct. config.json proxy is NOT auto-applied (2026-08-31 ruling); pick per target (github/foreign sites need a proxy, gitee/domestic don't)

Notes:
- Follows redirects automatically
- Timeout: 15 seconds
- HTML pages are converted to plain text (scripts, styles, navigation stripped)
- Non-HTML responses are returned as-is (truncated at ~50000 chars)
- Proxy support: set `"proxy": {"uri": "http://host:port", "web": true}` in config.json or `HTTPS_PROXY` env var
