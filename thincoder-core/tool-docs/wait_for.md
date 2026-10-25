Wait until a condition becomes true — polls every interval_ms and returns as soon as it holds or timeout_ms passes.

**Use it only for states that cannot announce themselves**: a file appearing, a port opening, a background bash or browser task finishing. Nothing delivers those into the session, so a blocking wait is the only way to learn about them.

**Never use it to wait for a subagent or a review report.** Those arrive on their own when the session is idle — the act of waiting for one is simply ending the turn.

`wait_for "subagent id:N done"` and `wait_for "advisor settled"` park the session for the whole budget, poll hundreds of times, and learn nothing you would not have been handed anyway.

Measured in practice: two such waits in one session burned ~4.5 minutes and 210 polls on reports that were already on their way. The conditions stay supported (a background task genuinely may need joining), but reaching for them on a child is the classic misuse.

Parameters:
- condition (required): a semantic condition expression:
  - `advisor settled` — an in-flight advisor review session has finished — **discouraged**: the report is delivered automatically; end the turn instead
  - `subagent id:N done` — async subagent N (the id your async spawn ack returned) has settled — **discouraged**, same reason
  - `consult done` — every consult_start session has drained — the verdict text is delivered automatically; wait only when a synchronous caller cannot proceed without it
  - `bash id:N done` — background bash task N (the id from the bash async ack, `bash#N`) has finished — settled, or already left the pool (nothing left to wait on)
  - `browser id:N done` — a background browser task N (the id from the ack, `browser#N`) has settled — finished, or already left the pool (nothing left to wait on)
  - `file exists:path` — the file at path exists (path relative to cwd)
  - `port open:N` — something is listening on 127.0.0.1 port N
  - The agent-internal conditions (advisor / subagent / consult / bash) apply to ASYNC sessions only — a synchronous call already completed before it returned and has nothing to wait for.
  - An unknown condition is an explicit error (`wait_for: unsupported condition "..."` — the supported forms are listed above), never a silent wait.
- interval_ms: poll interval (default 1000, floor 100 — polling never busy-spins)
- timeout_ms: overall ceiling (default 30000; config.json `agent.waitForTimeoutMs` overrides the default; hard cap 600000 like the execute tool)

Returns:
- `wait_for: condition satisfied after Nms (N checks): "<condition>"` — condition held
- `wait_for: timed out after Nms waiting for "<condition>" ...` — ceiling passed with the condition still false (never burns beyond the ceiling)
- interrupts (Ctrl+C / cancel) exit immediately; malformed conditions and unsupported syntax error out explicitly

Notes:
- Read-only and non-destructive — it only observes (agent pools, the filesystem, a local port probe).
- Blocking by design — call it ALONE in a turn, not batched with calls that depend on its result.
- This is the one blocking call an agent usually should not reach for. Before calling it, ask: **will this state announce itself to me anyway?** If yes (a subagent report, a review digest, a timer), end the turn and let it arrive.
