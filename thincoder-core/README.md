# @thincoder/core

**The shared core of the ThinCoder products — the mechanisms and the prompt content behind the ThinCoder CLI and the ThinCoder VS Code extension.**

Both products are thin shells: this package owns everything they have in common — the agent loop and subagent
scheduling, the advisor review system, the provider layer (SSE streaming, thinking-mode mapping, retries, rate
gating), the three-layer memory with its code and document indexes, the built-in tool system, session storage,
the MCP client, git and checkpoint integration, the ledger — plus the prompt texts and tool descriptions the
two products assemble their model context from.

The core has **zero third-party dependencies**: Node.js standard library only, pure ESM (`.mjs`), no build step.

## Requirements

- **Node.js >= 22.13.0** — the floor comes from the built-in `node:sqlite` module (usable without a flag since 22.13.0), which the memory and ledger modules use.

## Install

```bash
npm install @thincoder/core
```

The package is a library — it ships no CLI of its own. Most users never install it directly: the two products
declare it as a dependency (`thincoder`, the CLI, and `thincoder-vscode`, the VS Code extension). Install it
directly when you build your own tooling on the shared core.

## Importing

There is no bare-root entry point — `import "@thincoder/core"` does not resolve (`ERR_PACKAGE_PATH_NOT_EXPORTED`).
Every import is a subpath, and subpaths map 1:1 onto files in the package (`exports` is `{ "./*": "./*" }`), so
include the `.mjs` extension:

```js
import { loadConfig } from "@thincoder/core/config.mjs"
import { createAgent } from "@thincoder/core/agent.mjs"
import { chat } from "@thincoder/core/provider/index.mjs"
import { put, putMarkdown } from "@thincoder/core/memory.mjs"
import { runAdvisorReview } from "@thincoder/core/advisor/run.mjs"
```

Nested paths work the same way (`@thincoder/core/git/checkpoint.mjs`, `@thincoder/core/mcp/transport-stdio.mjs`).

## What's inside

| Area | Modules |
|---|---|
| Agent loop, subagents | `agent.mjs` · `agent/` · `agent-tools/` |
| Advisor review, consultation, escalate | `advisor/` · `agent-tools/consult.mjs` · `agent-tools/escalate-async.mjs` |
| Provider layer (streaming, thinking mapping, retries, rate gate) | `provider/` |
| Memory, embedding, code/doc indexes | `memory.mjs` · `memory/` · `embedding.mjs` |
| Built-in tools | `tools/` |
| Sessions | `session.mjs` · `session-*.mjs` |
| MCP client | `mcp.mjs` · `mcp/` |
| Git, checkpoints, team-memory sync | `git/` |
| Ledger, traces | `ledger.mjs` · `traces/` |

## Shared prompt content

The two products author no slot prompts or tool-description bodies of their own: both assemble their model
context from the texts in this package. `prompt-files.mjs` resolves them relative to the package itself, so the
same files are loaded in every delivery state (local link, npm install, packaged extension).

- `prompts/` — the slot-based prompt texts: personas, the common layer, the discipline layers, and the advisor
  and consultation modules.
- `tool-docs/` — one file per built-in tool; these texts are what the model reads as tool descriptions.

A prompt rule or a tool-description body is edited in exactly one place, and both products pick it up with the
next release. The exception is two tool-face anchors — the bash terminal face in `tool-docs/bash.md` and the
question-panel availability line in `tool-docs/question.md`: each product supplies those two values from its own
`src/prompt-injections.mjs`, because they describe behavior that differs between the CLI and the extension.

## Versioning

Version numbers are calendar-based (CalVer): `year.month.monthly-count`, where the year segment counts from
2026 (`0` = 2026). `0.9.1` is therefore the first core release of September 2026.

The number marks release time, not API compatibility — read `CHANGELOG.md` for what changed.

## Contributing

The core lives in `thincoder-core/` of the ThinCoder repository; bug reports and questions go to the
repository issue tracker. Two conventions shape every change: pure ESM `.mjs` with no build step, and
zero third-party dependencies — if the Node.js standard library can do it, no third-party package is
allowed. `npm test` runs the offline unit suite; it runs again on release through `prepublishOnly`.
Mechanism design documents live in the repository under `docs/core/design/`.

## License

MIT — see `LICENSE`.
