# Using ThinCoder in IDEs (ACP) ThinCoder speaks the [Agent Client Protocol](https://agentclientprotocol.com/) (ACP v1) via the
`thincoder acp` subcommand: the IDE launches it as a child process and communicates over
stdin/stdout using JSON-RPC (NDJSON). One login (terminal setup) serves every surface. ## Prerequisites - Node.js ≥ 24 and `thincoder` on PATH (or use an absolute path — IDE GUI processes often do not inherit the shell's PATH)
- Completed setup: `thincoder` run once in a terminal, or `~/.thincoder/config.json` with a provider API key (the ACP `authenticate` gate checks it) ## Capabilities (M1, v0.12) | Area | Status |
|---|---|
| Sessions: new / prompt (streaming) / cancel / close | ✅ |
| Tools: `tool_call` / `tool_call_update` events, approval via `session/request_permission` (Approve once / session / Reject) | ✅ |
| IDE edits: `write` and `edit` route through `fs/write_text_file` / `fs/read_text_file` — diffs render in the IDE | ✅ |
| Persisted sessions: `session/list` / `load` (history replay) / `resume` (no replay) / `delete` | ✅ |
| Config: `session/set_config_option` (model / thinking / mode), `session/set_mode` (plan ⇄ normal) | ✅ |
| Terminal reverse-RPC, MCP forwarding, unstable-surface extensions | ❌ (M2+; shell runs locally, MCP forwarding planned) | ## Zed Add to `~/.config/zed/settings.json`: ```json
{ "agent_servers": { "ThinCoder": { "type": "custom", "command": "thincoder", "args": ["acp"], "env": {} } }
}
``` If `thincoder` is not on the GUI PATH, use the absolute path (find it with `where thincoder` on
Windows / `which thincoder` on POSIX). Open a new conversation in Zed's Agent panel — it launches
a `ThinCoder` ACP subprocess per the config above. ## JetBrains IDEs JetBrains IDEs (IntelliJ IDEA, PyCharm, WebStorm, …) support ACP through the AI chat plugin.
Without a JetBrains AI subscription, enable `llm.enable.mock.response` in the Registry
(Shift twice → "Registry") to access the AI chat panel in ACP-only scenarios. In the AI chat panel menu, choose **Configure ACP agents** and add: ```json
{ "agent_servers": { "ThinCoder": { "command": "C:\\path\\to\\thincoder.exe", "args": ["acp"], "env": {} } }
}
``` JetBrains requires an **absolute path** in `command`. After saving, `ThinCoder` appears in the
AI chat's agent selector. ## Paseo (self-hosted orchestrator) Pick **ThinCoder** as a custom ACP provider in `~/.paseo/config.json`: ```json
{ "agents": { "providers": { "thincoder": { "extends": "acp", "label": "ThinCoder", "command": ["thincoder", "acp"] } } }
}
``` Paseo's generic ACP adapter does not drive the login flow — complete terminal setup first. ## Troubleshooting - **Session disconnects / "agent exited"**: wrong `command` path or missing setup. Run `thincoder acp` in a terminal — it blocks waiting for stdin when healthy; an immediate error points at the problem (usually "authenticate → authRequired").
- **"auth required"**: `~/.thincoder/config.json` has no resolvable provider key. Run `thincoder` in a terminal once to complete setup, then restart the IDE.
- **Stale editor buffers**: an `edit` reads the IDE buffer back before applying, so unsaved editor changes are respected. A file that was changed on disk but not reloaded in the editor may yield a stale-buffer mismatch — reload the file in the editor before invoking the agent.
- **No permission prompts**: AUTO mode is off by default in ACP sessions; `session/request_permission` failing (transport error) always rejects the tool (safety-first). ## Logs stdout carries ONLY protocol JSON; all diagnostics go to stderr. Run `thincoder acp 2> acp.log`
to capture them.
