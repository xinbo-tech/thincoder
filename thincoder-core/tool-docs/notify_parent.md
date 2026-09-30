A one-way channel to your PARENT (the agent that spawned you) — you are a subagent, so there is no user to ask. Queue a message on the parent's side; your turn is not interrupted and nothing is consumed from it.

- kind:'ask' — a question whose answer changes your next step and that you cannot answer from the materials you can read (task book / design doc / repo). The parent replies with subagent action:'send'; you receive it as an ordinary instruction at your next turn boundary. One ask at a time while a previous one still waits in the parent's queue.
- kind:'note' — an FYI that needs no answer (a premise you found broken, a conflict you resolved and want visible early).
- NON-BLOCKING: returns immediately — keep working on the unaffected parts, keep the affected part pending. No fetch, no polling; finish first = report the unanswered part as not done.
- SYNCHRONOUS SPAWN: if the parent is blocked on your run, nothing can be sent back — `send` reaches only a RUNNING ASYNC child; the message is read when the parent's call returns (it may re-spawn you with an answer). Do not idle-wait.
- Out of scope: naming / implementation / wording details, anything a read or a command would answer, trade-offs the task book already states — use the stop-and-report discipline, not this channel.
- Availability: subagents only (depth > 0). At depth 0 you talk to the user through your normal reply or the question tool.
- Limits: message ≤1,500 chars; the parent's in-flight queue holds ≤20 messages — exceeding either is an explicit error (nothing is silently dropped).