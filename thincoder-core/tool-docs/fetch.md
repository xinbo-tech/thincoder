Fetch a URL and return its content. With a DeepSeek provider configured the URL is fetched through DeepSeek's servers and returned as Markdown ([deepseek] title + content); otherwise it is fetched locally and HTML is stripped to readable text.

Private/metadata URLs are never sent. Use after websearch to read full documents.

Parameters:
- url (required): http/https URL
- proxy: http://host:port explicit proxy (optional) — use ONLY when passed; no proxy = direct. config.json proxy is NOT auto-applied (2026-08-31 ruling); pick per target (github/foreign sites need a proxy, gitee/domestic don't)

Notes:
- Follows redirects automatically
- Timeout: 15 seconds
- HTML pages are converted to plain text (scripts, styles, navigation stripped)
- Non-HTML responses are returned as-is (truncated at ~200000 chars)
- Proxy support: set `"proxy": {"uri": "http://host:port", "web": true}` in config.json or `HTTPS_PROXY` env var
- fetch.backend: "local" disables the DeepSeek backend.
