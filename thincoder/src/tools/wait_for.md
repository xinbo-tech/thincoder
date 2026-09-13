Wait until a condition becomes true — polls the condition every interval_ms and returns as soon as it holds or the timeout_ms ceiling passes. Use it ONLY for genuinely asynchronous waits: an async subagent/consult still settling, a file appearing, a port opening. Synchronous tools (advisor, blocking subagent spawn) return when done — waiting after them is NOT needed and wastes time.

Parameters:
- condition (required): a semantic condition expression:
  - `advisor settled` — an in-flight advisor review session has finished (async advisor-role children settled)
  - `subagent id:N done` — async subagent N (the id your async spawn ack returned) has settled
  - `consult done` — every consult_start session has drained
  - `file exists:path` — the file at path exists (path relative to cwd)
  - `port open:N` — something is listening on 127.0.0.1 port N
  - The agent-internal conditions (advisor / subagent / consult) apply to ASYNC sessions only — a synchronous call already completed before it returned and has nothing to wait for. An unknown condition is an explicit error (`wait_for: unsupported condition "..."` — the supported forms are listed above), never a silent wait.
- interval_ms: poll interval (default 1000, floor 100 — polling never busy-spins)
- timeout_ms: overall ceiling (default 30000; config.json `agent.waitForTimeoutMs` overrides the default; hard cap 600000 like the execute tool)

Returns:
- `wait_for: condition satisfied after Nms (N checks): "<condition>"` — condition held
- `wait_for: timed out after Nms waiting for "<condition>" ...` — ceiling passed with the condition still false (never burns beyond the ceiling)
- interrupts (Ctrl+C / cancel) exit immediately; malformed conditions and unsupported syntax error out explicitly

Notes:
- Read-only and non-destructive — it only observes (agent pools, the filesystem, a local port probe).
- Blocking by design — call it ALONE in a turn, not batched with calls that depend on its result.
- Do not use it to wait after synchronous tools (advisor / blocking subagent spawn / verify return only when done).
