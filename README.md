# ThinCoder

**Sharp Code, Zero Bloat.**

**A "thin" AI coding agent: pure `.mjs`, no build step, zero npm dependencies, native Node.js.**

The "Thin" in ThinCoder doesn't mean "feature-poor" — it means **sharp thinking, straight to the point** — like a blade.
While every AI agent races to be "all-powerful", ThinCoder plays the opposite card: **restraint, precision, no filler**.
Its persona is a geek engineer of few words who cuts to the bone: give it a complex requirement, get back a clean implementation.

Design philosophy (the entire meaning of the name): if the Node standard library can do it, no dependency is allowed. The project's `node_modules` is empty.

## Features

- **Fix-verify loop**: file changes without `verify` get pushed back — syntax check + tests must pass before the agent can claim completion (auto-repair up to 3 rounds)
- **Checkpoint system**: auto-snapshot before every user task, `list`/`create`/`rewind` tools for the model, single-file restore — rewinding itself is reversible (pre-rewind state auto-saved)
- **Codebase understanding** ⭐0.5.0: `repo_outline` (dependency outline, auto-injected at startup), `code_search` (source FTS5 + vectors + JSDoc extraction), `doc_search` (docs chunked by ## headings) — background indexing, auto-incremental updates on file writes, three tools guided by "structure → intent → details"
- **Model adaptation** ⭐: top-tier only, latest only. Built-in flagship models from seventeen providers — DeepSeek / Kimi / Kimi For Coding / GLM / Qwen / Qwen Token Plan / MiniMax / OpenAI / Claude / Gemini / Grok / Mistral / Volcengine Ark (豆包) / Hunyuan (腾讯混元) / SiliconFlow (硅基流动) / OpenRouter / Groq. No legacy model compatibility. Auto-matched context windows, truncation-resume protocols (prefix/partial), thinking-mode APIs (thinking.type / reasoning_effort), reasoning_content echo strategies (reasoningEcho), output limits, temperature range clamping — all deeply adapted.
- **Toolset**: `read` / `write` / `edit` / `bash` / `glob` (supports `**`) / `grep` / `websearch` / `ls` / `fetch` + `read_image` (image/video paste) + three retrieval tools + MCP — all zero-dependency, file tools confined to the working directory
- **Memory system**: three layers (personal/project/team), FTS5 + vector RRF hybrid retrieval, git-friendly markdown format
- **Two-phase tool scheduling**: permission prompts serialized, read-only tools parallelized, side-effect tools serialized
- **Session persistence** ⭐0.5.0: unlimited archive slots, `/session` to switch anytime, tool results visible after restore. Process-level isolation — multiple instances in the same directory each get their own session slot
- **Concurrent subagents**: three roles — `explore`/`plan`/`coder` — dispatched in parallel, streaming output visible, reports land in the conversation; per-subagent model override (`subagent` tool `model` arg or `agent.subagentModel` config — e.g. discuss with `glm-5.2`, let `deepseek-v4-flash` implement)
- **Multi-model consultation 会诊 + 飞刀 (escalate)** ⭐0.12.30: `consult_start`/`consult_check`/`consult_stop` run several configured models in parallel as independent read-only consultants (each with its own TUI activity card, `main_history` access to the failure trail); `escalate` flies in a stronger model for a single expert implementation run with full write access. Candidate pool = `agent.consultModels` ([{ provider, model, effort? }], up to 5); budgets via `agent.consultTurns` / `agent.consultTimeoutMs`
- **Plan Mode**: read-only exploration + design, implement after user approval
- **AUTO mode**: `/auto` full authorization, no confirmations on long tasks
- **Task tracking**: `task` tool breaks down multi-step work, status bar ✓n/m live progress, auto-filters completed items
- **Goal/Verify/Skills**: long-goal tracking, completion verification, reusable skills
- **Streaming TUI**: bare ANSI, permission preview right above the input box, write/edit auto-shows diffs, paste shortcut hint in the input box corner for multimodal models (Win: Alt+V / Mac/Linux: Ctrl+V). Two-level model picker (providers → models), search/filter support, Shift+Enter for multiline input

## Memory: What One Learns, the Whole Team Knows

Three layers, all "query if present, skip if absent", unified hybrid retrieval:

| Layer            | Location                                             | Sync method                                                                                    |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Personal**     | `~/.thincoder/memory.db` (sqlite)                    | Not synced, private                                                                            |
| **Project**      | `.thincoder/memory/*.md` in the project repo         | With the project git (ThinCoder **only writes files, never commits for you**)                  |
| **Team** (opt.)  | Dedicated memory repo, cloned to `~/.thincoder/teams/<name>/` | `thincoder sync` (pull --rebase); auto commit + push on write (dedicated facility, opt-in) |

- **Hybrid retrieval**: FTS5 (BM25, per-character CJK indexing, bigrams matchable) + embedding vectors (brute-force cosine) + RRF(k=60) fusion ranking
- **Embeddings**: OpenAI-compatible `/v1/embeddings`, defaults to SiliconFlow `BAAI/bge-m3` (free tier, good CJK support); Ollama works as an offline option. Vectors generated lazily — not computed on write, backfilled and persisted on first search
- **Entry format**: Markdown + frontmatter (type/title/tags/author/created), readable and reviewable directly on GitHub; one file per entry, naturally avoiding merge conflicts; real conflicts produce honest errors, never auto-merged
- **Dual-track accumulation**: conventions written manually (`memory_put`), experience extracted from sessions via `/extract` — **the LLM proposes candidates, a human confirms each y/n** before anything is stored; never fully automatic
- **Retrieval isolation**: the Project layer is isolated by project path — project A's memories never leak into project B

- **Agent Client Protocol** ⭐: `thincoder acp` exposes the agent over [ACP](https://agentclientprotocol.com/) v1 on stdio — one terminal login drives sessions from **Zed**, **JetBrains** AI chat, or **Paseo**:
  - Streaming replies + thinking chunks; tool approval dialogs in the IDE
  - IDE-native diffs — `write`/`edit` route through the editor buffer
  - Persisted sessions: list / load (history replay) / resume / delete
  - Per-session config: model / thinking / mode
  - Setup: [docs/guides/ides.md](docs/guides/ides.md)


## Requirements

- Node.js >= 24
- An API key for any OpenAI-compatible endpoint
- Optional: an embedding service key (without it, retrieval degrades to pure FTS)

## Quick Start

```bash
# Install
npm install -g thincoder

# Launch the TUI (default command)
thincoder
```

First launch walks you through a setup wizard: arrow keys to pick a provider (built-in presets or a custom endpoint) → enter API key → optionally enter an embedding key (SiliconFlow, enables vector memory search, skippable) → arrow keys to pick a model — no hand-editing config files. Adjust anytime with `/provider`, `/model`, `/config embedkey`. `chat`/`distill` also offer in-place interactive setup when no key is configured in a terminal (in pipes/CI they exit with an error and instructions).

You can also hand-write `~/.thincoder/config.json` (see "Configuration" below), then:

```bash
# One-shot Q&A (pipe-friendly)
thincoder chat "read package.json and summarize it"

# Memory management
thincoder memory put --type=rule --title="code style" --content="no semicolons"
thincoder memory search "code style"
thincoder memory list
thincoder memory remove 1

# Team memory (optional, available after configuring memory.team)
thincoder sync                       # pull the team repo and rebuild the index

# Extract knowledge from a session transcript (stored after per-item confirmation)
thincoder distill session.txt

# Upgrade
thincoder upgrade
```

Running from source: replace `thincoder` above with `node bin/thincoder.mjs`.

Slash commands in the TUI: `/help`, `/model` (two-level picker: first select provider, then model; `/model <provider>:<name>` switches directly), `/submodel` (subagent models per type — picker over global + explore/plan/coder/eng-coder slots, or `/submodel <type> <provider:model>` directly), `/shell` (platform-aware picker of available shells — e.g. `/shell` → pick Git Bash/pwsh, or `/shell "C:\Program Files\Git\bin\bash.exe"`, `/shell reset`; fixes win11 cmd encoding/command issues), `/provider` (add/remove providers, set keys, custom endpoints), `/think` (thinking mode toggle and reasoning effort), `/config` (view config, `/config embedkey` for the embedding key, `/config set` for parameters), `/session` (list/switch archived sessions), `/reindex` (rebuild the index), `/extract` (extract knowledge from the current session), `/restore` (restore checkpoint), `/clear`, `/exit`. High-frequency commands support abbreviations: `/h` `/x` `/m` `/p` `/t` `/c` `/n`. Typing `/` shows live matching hints in the status bar. Model picker supports search/filter — type to narrow down results.

Configuration comes exclusively from `~/.thincoder/config.json` — no environment-variable configuration is supported.

> **Kimi note**: Kimi has **two separate platforms with non-interchangeable API keys** — Moonshot (`https://api.moonshot.cn/v1`, keys `sk-...`, platform.moonshot.cn) and **Kimi For Coding** (`https://api.kimi.com/coding/v1`, keys `sk-kimi-...`, platform.kimi.com, model ID `k3`). Use the `kimi` preset for Moonshot and `kimi-code` for Kimi For Coding — putting one platform's key on the other's endpoint fails with 401 (a hint is appended when the key/baseURL look mismatched).

## Configuration

`~/.thincoder/config.json`:

```jsonc
{
  "providers": [
    // multiple allowed; switch with /model <name>
    {
      "name": "deepseek",
      "baseURL": "https://api.deepseek.com/v1", // any OpenAI-compatible endpoint
      "apiKey": "sk-...", // or leave empty to use env vars
      "model": "deepseek-chat",
      // optional: proactive throttling budget (match your account's rate-limit tier;
      // without it the gate is off, 429 backoff still applies).
      // Rate limits are per-account counters (RPM/TPM over a 60s window) — check each vendor's console
      // "tpm": 200000, // tokens/minute (input + output total)
      // "rpm": 50,     // requests/minute
    },
  ],
  "activeProvider": "deepseek", // currently active provider name
  "shell": null, // bash tool shell (win11: e.g. "C:\\Program Files\\Git\\bin\\bash.exe" or "pwsh"); null = system default — cmd on Windows (UTF-8 forced per command), /bin/sh elsewhere. TUI: /shell
  "embedding": {
    // optional: without it, retrieval is pure FTS
    "baseURL": "https://api.siliconflow.cn/v1",
    "apiKey": "sk-...",
    "model": "BAAI/bge-m3",
  },
  "agent": {
    "maxTurns": 100, // tool-loop cap
    "subagentModel": null, // default subagent provider/model override: "provider:model" | provider name | model name; null = inherit parent provider. Per-call: subagent tool `model` arg
    "subagentModels": {}, // per-type override: { "explore": "...", "plan": "...", "coder": "...", "eng-coder": "..." }; priority: tool model arg > this > subagentModel > parent provider
    "compactThreshold": 100000, // context compaction threshold (approx. tokens)
  },
  "memory": {
    "dbPath": "~/.thincoder/memory.db", // sqlite index path
    "projectDir": ".thincoder/memory", // Project layer directory (relative to project root)
    "team": {
      // optional: Team layer disabled without it
      "name": "myteam",
      "repo": "git@github.com:org/team-memory.git",
    },
  },
  "mcp": {
    // optional: MCP server list
    "servers": [
      {
        "name": "filesystem",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      },
    ],
  },
  "websearch": {
    // optional: Tavily structured search (stable JSON API, no HTML scraping).
    // Empty apiKey → silently falls back to Bing HTML extraction (zero-config).
    "provider": "tavily",
    "apiKey": "tvly-...", // https://tavily.com — has a free monthly tier
  },
}
```

## Architecture

```
bin/thincoder.mjs   command entry (tui / chat / memory / sync / distill)
src/
  provider/         LLM calls — core.mjs (fetch, SSE streaming, reasoning_content, usage, retries),
                    rate.mjs (TPM/RPM proactive rate gate), index.mjs (entry)
  embedding.mjs     vector embeddings (OpenAI-compatible /v1/embeddings)
  tools/            16 builtin tools + MCP wrapping + readonly scheduling flags
                    index.mjs (registry), file/git/patch/system/web.mjs (groups), shared.mjs (schema utils),
                    repomap.mjs (repo dependency outline: import/export regex parsing, on-demand via tool)
  tools.mjs         re-export shim → src/tools/index.mjs
  mcp/              MCP client — helpers.mjs, transport-stdio/http/ws.mjs (JSON-RPC, zero-dependency)
  mcp.mjs           MCP client entry (connectMcpServer), delegates to src/mcp/
  agent.mjs         main loop + two-phase tool execution + reminder injection + completion guard + fix-verify loop
                    + incremental indexing (auto reindexFile after write/edit/delete)
  agent/            agent loop helpers — dispatch.mjs (two-phase execution), setup.mjs (system prompt assembly), helpers.mjs
  agent-tools/      self-discipline tools (task/plan/goal/verify/subagent/skill/recent_changes)
  context.mjs       rough token estimation + history compaction + task re-injection
  memory/           three-layer memory — schema.mjs (DDL/constants), core.mjs (CRUD + retrieval),
                    code-index.mjs + code-sync.mjs (code_chunks), docs.mjs (doc_chunks)
  memory.mjs        re-export shim → src/memory/*
  session.mjs       session persistence (unlimited archive slots, isolated by project cwd, process-level isolation via sessionId + slotSessions)
  skills.mjs        skill discovery/loading (.thincoder/skills/*.md)
  markdown.mjs      entry format (frontmatter parse/serialize)
  git/              checkpoint.mjs (git patch snapshots / rewind), gitmem.mjs (Team layer git sync)
  distill.mjs       session knowledge extraction (candidates + human confirmation)
  config.mjs        config loading
  tui/              bare-ANSI terminal UI — index.mjs (startTUI), render.mjs (drawing primitives),
                    render-frame.mjs (frame layout), render-conversation.mjs (conversation panel),
                    markdown.mjs (lightweight inline markdown → ANSI), mouse.mjs (SGR clicks),
                    clipboard.mjs (paste/copy), ansi.mjs
  tui.mjs           re-export shim → src/tui/index.mjs
  tui-render.mjs    re-export shim → src/tui/render.mjs
  prompts/          prompt texts — system.md (core), discipline.md (coding/testing rules),
                    main.md (main-agent overlay), explore.md / coder.md / plan.md (subagent roles)
test/               node:test offline unit tests (npm test)
scripts/            real-environment verification scripts (compaction, team sync)
```

Key design decisions:

- **Two-phase tool execution**: phase one serializes permission prompts (each side-effect tool asks the user); phase two runs read-only tools in parallel (`Promise.all`) and side-effect tools serially. Results are fed back paired by `toolCallId`
- **Permissions live in the UI layer**: tools only execute; "ask the user or not" is the TUI/CLI's business, so headless scenarios need no tool changes
- **The index is disposable**: sqlite is just a local index of code/docs/memories — `reindex` rebuilds it anytime
- **Separate code/doc indexes**: source and markdown docs are indexed in separate tables and searched through different tools — keeps the model from mistaking old code patterns for design conventions
- **git boundaries**: the Project layer only writes files and never touches your repo's commits; the Team layer is a ThinCoder-managed repo where auto commit+push is allowed
- **CJK retrieval**: FTS5 unicode61 + per-character CJK spacing on both write and query sides; semantic matching goes through the vector channel

## Development

```bash
npm test                          # offline unit tests (node:test, with local mock servers)
node scripts/verify-compress.mjs  # real-API verification of context compaction (needs valid config)
node scripts/verify-team.mjs      # team memory A->git->B full-chain verification (local git, offline)
```

Code conventions: pure `.mjs`, no semicolons, no npm dependencies allowed (including devDependencies).

## Roadmap

- More builtin skills

## Changelog

### 0.12.11 (2026-08)
- **Subagent model per type** — `subagent` tool `model` arg, `config.agent.subagentModels` (per explore/plan/coder/eng-coder) and `config.agent.subagentModel` (global fallback); priority: tool arg > type > global > parent provider. `/submodel` TUI command: picker over 5 slots (global + 4 roles) with provider→model selection, or direct args (`/submodel coder deepseek:deepseek-v4-flash`).
- **Configurable bash shell** — `config.shell` or `/shell` TUI command: platform-aware picker (Windows: pwsh/Git Bash/WSL bash; POSIX: bash/zsh/fish — availability-detected, custom path supported). Windows default cmd now forces UTF-8 per command (`chcp 65001`) — fixes garbled Chinese output on win11.
- **Markdown table alignment fix** — `stringWidth` strips ANSI (zero display width) and rendered table rows are padded back to the computed width; inline markers (`` `code` ``, `**bold**`) no longer shift the borders.
- **sliceByWidth keeps ANSI sequences whole** — never slices mid-escape-sequence.

### 0.12.10 (2026-08)
- **Code-quality pass (advisor subsystem):**
  - **Drop 11 unused exports** — internal-use symbols no longer leak through the module API (advisor table headers/constants, plan reminders, token-UUID helper, shrinkOversized).
  - **Advisor tool-timeout timer is now cleared** when the tool wins the race (no dangling timers); static import replaces a dynamic import on the hot path.
  - **Advisor re-review no longer trusts git output** — the follow-up path previously injected a `git diff HEAD` snapshot: once fixes were committed the diff was empty and the model read "no changes" as "no fixes", misreporting fixed items as unfixed. The follow-up now injects **no git information at all** — verification is `read`-only, evidence must quote this round's read output (line numbers from the stale prior table are not evidence), and dead snapshot-dedup fields were removed.

### 0.12.9 (2026-08)
- **Prompt-system quality pass (both CLI and VS Code extension, byte-identical sync):**
  - **Advisor-after-code rule moved from system.md to discipline.md** — engineering mode no longer receives the conflicting "call advisor after changing code" instruction (its review-timing rules say do not call unprompted). Standard mode behavior unchanged.
  - **engineering.md delivery-review semantics unified** — the mandatory-flow step and the state table now both say: eng-coder self-reviews inside the subagent; the architect verifies against acceptance criteria and re-reviews only when asked or when the delivery looks wrong. (Previously the step forced a parent-side advisor code review that the hard rules contradicted.)
  - **checkpoint description aligned with actual auto-snapshot triggers** (task-list deletion + context compaction; manual checkpoint for the rest).
  - **advisor round budget wording fixed** — prompts advertise a 30-round budget; the mechanical hard cap is 100 rounds (loop guard). Both layers are now named explicitly.

### 0.12.8 (2026-08)
- **Fix: pending-task pushback fires at most once** — the completion guard that reminds the model to update pending tasks before finishing could loop forever when a pending item could not be resolved. Now each task-list state earns exactly one reminder; if the model insists on finishing anyway, it is allowed to (updating the list via the task tool resets the budget). VS Code extension synced.

### 0.12.7 (2026-08)
- **Fix: long replies and thinking are never folded** — the long-message folding feature (0.12.6) collapsed main output and reasoning behind a click when they exceeded 12 lines, hurting readability. Folding now applies to secondary dim-colored content (tool summaries/status) only; expanded blocks are exempt from the consecutive-dim folding so nothing folds twice.
- **Fix: wide tables misaligned in narrow terminals** — a many-column table that still exceeded the terminal width after column shrinking (e.g. 8 columns at 40 cols) wrapped at the terminal and misaligned. Table rows are now clipped with an ellipsis instead of ever exceeding the width.

### 0.12.6 (2026-08)
- **Checkpoint v2 — full-file-copy snapshots** — snapshots now store complete copies of changed files (tracked + untracked) instead of a git diff patch: rollback works even after commits happened post-snapshot. New `versions` checkpoint action lists a file's historical copies across snapshots (time / size / content hash) and restores a specific version. **Full rollback is disabled** (as dangerous as a working-tree reset — silently discards post-snapshot work); oversized files (>5MB) are skipped with an explicit notice; files created after a snapshot are never deleted by a restore.
- **Git destructive-command protection** — `checkout --` / `restore` / `reset --hard` / `clean -f` (including bypass variants like `checkout HEAD -- .`) auto-snapshot every uncommitted file **before** running, then execute without blocking — a model rollback can no longer destroy uncommitted work. Snapshot triggers slimmed to: destructive-git guard, pre-restore, manual.
- **Fix: bash no longer hangs on background processes** — `start /b`, `&`, `nohup` children that hold the output pipe no longer stall the tool until timeout (resolves after a short grace with a notice).
- **Mouse support** (SGR-protocol terminals) — click a picker option to select it, click a folded-block hint to expand it, click a message line for an action menu (copy to clipboard / load into the input box). **Long messages (>12 wrapped lines) auto-fold** to first/hint/last with click-to-expand — folding now has real objects in everyday sessions.
- **Fix: legacy session hash migration** — the 12→40 char hash migration now tries every historical algorithm (CLI 12-char, VS Code 16-char, both drive-letter cases): Windows sessions from older versions are found and migrated on next startup instead of being stranded.

### 0.12.5 (2026-08)
- **Fix: inline code styling** — markdown code spans now render with underline instead of reverse video (less harsh on the eyes)

### 0.12.4 (2026-08)
- **Context compaction unified spec** — CLI/VS Code now share one compaction semantics (`docs/design/CONTEXT-COMPACTION.md`): window-adaptive tail size (`max(10, ctx/100K×30)`, ≤40% of history), measured prompt-token baseline preferred, pure-estimation path includes system+tools overhead, head/tail tool-call pairing protection on both sides, 3-tier fallback (LLM summary → deterministic truncation after 3 failures → per-message shrink), compaction summaries are silent to the frontend (no streaming into the conversation), task re-injection deduplicated. Unknown model names now warn once instead of silently degrading to the 128K default
- **Kimi For Coding support** — new `kimi-code` preset (`api.kimi.com/coding/v1`, model `k3`, platform.kimi.com, `sk-kimi-` keys — NOT interchangeable with Moonshot); `MODEL_SPECS` gains the `k3` alias (1M context / multimodal / partialMode / reasoningEcho); 401 errors hint at the two-platform key mismatch; README documents the split
- **Ctrl+C double-confirm** — idle-state first Ctrl+C only warns (3s window), second press exits; picker-cancel and in-flight abort semantics unchanged
- **Empty-response auto-retry** — a transient empty LLM response (reasoning exhausted / truncated output) injects a retry reminder instead of aborting the whole turn; after 2 consecutive empties the original error surfaces (with the `/think` lowering hint)
- **Lightweight inline markdown display** — model replies render `**bold**`, `` `code` `` (reverse video), `~~strike~~`, and `# headings` (marker-stripped + bold) via ANSI instead of showing literal markers; code spans are not re-interpreted; streaming-safe on unclosed markers; copied text comes out clean

### 0.12.3 (2026-08)
- **Fix: user-level skills loading** — skills in `~/.thincoder/skills/` are now properly discovered and loaded alongside project-level skills. Project-level skills with the same name take priority. Both `skill list` and `skill load` support both directories.

### 0.12.2 (2026-08)
- **Session isolation for multiple processes** — each process gets a unique session ID (`pid-timestamp-random`), manifest tracks slot ownership via `slotSessions` mapping. Concurrent sessions in the same directory automatically get separate slots. Dead process slots are intelligently reclaimed via `isProcessAlive()` check
- **Two-level model picker** — `/model` now shows providers first, then models for selected provider. Reduces visual clutter when many providers are configured. Direct switching still works: `/model qwen:qwen-max`
- **Picker improvements** — auto-scroll keeps selected item visible, "type to filter" hint shown, search/filter support added
- **Shift+Enter multiline input** — TUI now supports Shift+Enter for multiline input (regular Enter still submits)
- **New provider presets** — added Volcengine Ark (豆包), Hunyuan (腾讯混元), SiliconFlow (硅基流动), OpenRouter, Groq (5 new providers, total now 12)
- **Execute tool security hardening** — blocks dynamic `import()` calls to prevent sandbox escape. Pre-execution regex check + sandbox blocks `require()` and `process` access
- **Advisor system overhaul** — convergence hardening with round-aware prompts, evidence rules, round cap (5 max). Design-review token gate. Simplified prompts, removed git dependency. Unified streaming block
- **Verify guard improvements** — file path validation, error context enrichment, test coverage expanded

### 0.12.1 (2026-07)
- **Fix: `/exit` screen artifacts** — `/exit` now uses synchronous `process.exit(0)` instead of the deferred cleanup callback, preventing the post-handler `render()` from redrawing the TUI over the cleaned terminal. Ctrl+C and `/exit` now produce identical clean exits.

### 0.12.0 (2026-07)
- **Interactive slash command UX** — `/advisor`, `/think`, `/config`, `/mcp` now use persistent menu loops with live state feedback. Toggle, change settings, and see results without re-entering the command. Cursor position is remembered across menu cycles. `/plan` and `/auto` now show immediate local feedback (`❯ Plan: ON/OFF`).
- **User-level AGENTS.md** — `~/.thincoder/AGENTS.md` is now loaded alongside the project-level `AGENTS.md`. User-level preferences (language, style, format) apply across all projects; project-level rules take priority.
- **Skill subdirectory format** — `.thincoder/skills/` now supports the standard `skill-name/SKILL.md` subdirectory convention (Claude Code / Cursor compatible). Flat `.md` files remain fully backward-compatible. Subdirectories take priority when both formats exist with the same name.
- **MCP stdio `env` field** — `env` key in MCP stdio server config is now merged into the child process environment. Enables MCP servers requiring custom environment variables (e.g. `deveco-mcp`).
- **Project-level `.mcp.json`** — `.mcp.json` in the project root is auto-loaded at startup (standard MCP client convention). Servers defined here are merged with `config.json` servers — `config.json` takes priority for same-named entries.
- **Cleaner conversations** — Removed redundant `[System reminder: ...]` injections from `/advisor`, `/plan`, `/auto`, and `/think` toggles. All feedback is now local TUI output, not conversation noise.

### 0.10.0 (2026-07)
- **LSP tool** — `lsp` tool provides code intelligence via Language Server Protocol: go-to-definition, find-references, hover info, document symbols, diagnostics. Zero-dependency JSON-RPC 2.0 over stdio client. Lazy-starts language servers on first call. Configurable via `lsp.servers` in config.json (defaults: `typescript-language-server` for JS/TS, `pyright-langserver` for Python).
- **Smart context: compaction checkpoint** — `compressIfNeeded` now auto-creates a git checkpoint before compaction. A checkpoint reference is injected after compaction so the model can reconstruct context from git diff + recent messages + task progress. Prevents information loss during long sessions.
- **CodeMode: sandboxed JS execution** — `execute` tool backed by `vm.Script.runInNewContext`. Compose multiple file operations (read/write/glob/grep/log) into a single script, reducing API round-trips and keeping intermediate results out of context. Sandbox strips all Node APIs, limits output to 50KB, enforces 30s timeout, and blocks private IPs in fetch. Script size capped at 50KB.

### 0.9.0 (2026-07)
- **Config JSON Schema** — `saveConfig` auto-injects `$schema` reference; `docs/schemas/config.schema.json` provides editor autocompletion/validation for all config fields including the new `hooks` section.
- **Lifecycle Hooks** — `PreToolUse` / `PostToolUse` / `PostToolUseFailure` / `Notification` events. User-defined shell commands in config, with per-tool regex matching, timeout control, and `block`/`allow`/`notify` actions. Implemented in `src/hooks.mjs`, integrated into tool dispatch.
- **Built-in Skills (5)** — `pdf-create`, `xlsx-create`, `frontend-design`, `code-review`, `api-design` ship with the installation. Each is a standalone markdown instruction file using zero-dependency approaches (Chrome headless for PDF, PowerShell for Excel, etc.).
- **Conversation message folding** — Long tool result blocks (>8 consecutive dim lines) auto-collapse to first 2 lines + "… N more lines — Enter to expand". `/fold on|off` toggles globally.
- **Tree-shaped tasks** — `checklist` tool now supports hierarchical task IDs (`T1`, `T1.1`, `T1.2.1`) with auto-assigned numbering. `add` accepts `parent` parameter for subtree positioning. Indentation-based persistence in `checklist.md`.
- **AI-native MCP config** — `/mcp add` picker now includes "Describe with AI" option. Describe a server in natural language → model generates config JSON → preview + confirm → save and connect.
- **Goal judge model** — `goal complete` now runs an independent LLM check: goal criteria + recent agent activity → judge model verifies YES/NO. Prevents false completion claims during autonomous work.
- **`/undo` command** — Tracks up to 50 write/edit/delete operations in `agent._undoStack`. `/undo` opens a picker showing each operation's file and original content size. Select to revert.
- **Roadmap**: LSP tool, intelligent context management (checkpoint-based reconstruction), and CodeMode sandboxed JS are planned for 0.10.0.

### 0.8.13 (2026-07)
- **TUI: incremental rendering** — panel-level cache (`panelCache`) with sync-update bracketing (`DECSET 2026`). Only redraws changed panels, eliminating flicker. `saveCursor`/`restoreCursor` for efficient cursor positioning. Panel order reorganized: `header → conversation → subagent → output → todo → picker → permission → queue → input → status`.
- **Ctrl+I inject resume** — Ctrl+I (or Tab during processing) now properly interrupts, injects the message, and *resumes* the agent loop. Controller is recreated after abort. Added active signal check in SSE read loop for faster abort on Windows.
- **Processing hints** — Input box shows "Ctrl+U clear" hint during processing. Tab during processing treated as Ctrl+I. Slash commands re-render the frame.
- **Compression visibility** — `compressIfNeeded` now forwards `onToken`/`onReasoning` callbacks, making compression activity visible in the TUI.
- **Session: data-preserving fallback** — when atomic rename fails during session save, fall back to direct write instead of losing data.
- **Distill: balanced-bracket JSON extraction** — handles nested arrays in LLM output (e.g. `"tags": ["a", "b"]`), replacing the broken non-greedy regex approach.
- **File tools: EOL normalization** — `normalizeEOL` (`\r\n` → `\n`) applied on all reads (`read`, `edit`, `hashline_edit`, `insert_after`, `grep`, `repomap`), making hash computation and string matching platform-consistent.
- **hashline_edit: multiple-match detection** — when a hash sequence matches multiple positions, reports all with surrounding context instead of silently picking one.
- **delete: symlink-safe** — uses `lstat` instead of `stat` to correctly identify symlinks (not directories even if pointing to one).
- **repomap: large file guard** — skip files >10MB in dependency outline builds to prevent OOM.
- **Improved error messages** — `grep` and `insert_after` now catch invalid regex patterns at validation time with clear error messages.
- **Advisor session persistence** — advisor config saved/restored across sessions.
- **Timeout hardening** — auto-think uses `AbortSignal.timeout(5s)`, embedding requests add 60s timeout, MCP HTTP connect uses `INIT_TIMEOUT_MS`, fetch timeout extended to 10 minutes.
- **ClearScreen on exit** — terminal restored with `clearScreen` ANSI on TUI cleanup.

### 0.8.12 (2026-07)
- **Indexing: git-repo-only** — `codeSync` and `docSync` now only index inside git worktrees (via `git ls-files`), respecting `.gitignore`. Non-git directories get empty indexes. Prevents 2.9GB memory.db from accidentally indexing entire user profiles (AppData, browser extensions, Office add-ins, Program Files)
- **Indexing: file-size caps** — code files >1MB and doc files >512KB are skipped during bulk indexing (minified bundles, test fixtures, generated code)
- **Compaction: earlier trigger** — `COMPACT_RATIO` lowered from 0.8 to 0.6 (with 40K floor), so injected context (directory tree, git context, outline, memory/doc search results) doesn't starve the model for headroom before compaction fires
- **Bugfix: event-loop blocking** — `buildOutline`/`buildSummary` in `repomap.mjs` now awaited (was sync calling async), `setup.mjs` outline injection fixed, `codeSync` walk uses `readFile` instead of `readFileSync`
- **Feat: SKIP_DIRS expanded** — Windows profile directories (`AppData`, `Desktop`, `Documents`, `Downloads`, `Music`, `Pictures`, `Videos`, etc.) added to the skip list
- **Feat: `listProjectFiles` shared helper** — extracted from `codeSync`/`docSync`, used by both; git-only with fallback removed
- **Refactor: `embed-config.mjs`** — simplified to only read API key via `resolveEmbedKey()`, base URL and model are fixed constants; VSCode SecretStorage dependency removed

### 0.8.11 (2026-07)
- **Feat**: `checklist` tool — persistent project task tracking in `.thincoder/checklist.md`. Add/mark/list items, auto-archive done items to `checklist-done.md`. Injected at session start (pending + in_progress only)
- **Feat**: updated prompts — four-step workflow (requirements→design→development→testing), three-step debugging strategy (logs→docs→binary search), working checklist discipline
- **Feat**: methodology docs — `docs/design/METHODOLOGY.md` rebuilt, `PHILOSOPHY.md` expanded with worldview #6 (official docs over guessing)
- **Bugfix**: vision guard — `read_image` now refuses non-vision models before reading the file, the agent loop injects a system reminder instead of image parts for text-only models, and `stripImagesForTextModel` sanitizes image parts at send time (history untouched, restored when switching back to a vision model). Previously a single image in history made text-only APIs (e.g. DeepSeek) reject EVERY subsequent request with 400, bricking the conversation
- **Improvement**: silent `catch {}` blocks now log to stderr (checkpoint file copies, MCP notify/close, session incremental save, clipboard paste, provider picker, team-memory rebase abort, tool dispatch) — failures are visible for debugging instead of disappearing

### 0.8.10 (2026-07)
- **Bugfix**: pasted text now lands in the active TUI text target — the API key prompt when adding a provider via `/model` (and any free-text `askQuestion`) now accepts paste correctly. Previously, bracketed-paste injection in the terminal was always written to the main input box, so pasting into a question prompt appeared as "nothing happened" and orphaned the text into the input box after the question closed. Both bracketed-paste (Windows Terminal / most modern terminals) and Ctrl+V-as-key-event (legacy conhost) now route through a single `insertPastedText` helper that targets the question answer, options-list (ignored), or main input box as appropriate

### 0.8.9 (2026-07)
- **Bugfix**: `wizardProviderItems` was defined inside `createWizard()` but not included in the return statement, causing key-handler to crash with `TypeError` during provider selection on first launch (/ new config)

### 0.8.8 (2026-07)
- **Bugfix**: remove env whitelist from bash tool — child processes receive full parent environment
- **Bugfix**: reduce TUI flicker — single `write` with `home` + `clearToEnd` instead of separate cursor moves
- **Feat**: auto update check on startup + `/upgrade` command

### 0.8.3 (2026-07)
- **Output panels**: tools with `outputPanel` flag stream to scrolled panel, auto-collapse to summary on completion (bash, long tool results)（机制已于 2026-08-30 废除——D6 清理，见 AGENT-LOOP.md）
- **Checkpoint enhancements**: `cat` for file preview from snapshots, per-file rewind, auto-recover on apply failure, escape-hatch hints on errors
- **Bash safety**: `checkpoint-before-destructive` discipline rule; bash guard guides checkpoint instead of just commit/stash
- **Code review fixes**: output friendliness, readability, English-only strings, TUI polish

### 0.8.0 (2026-07)
- **TUI rendering overhaul**: layout engine (`layout.mjs`) — panels are positioned declaratively by priority instead of hand-pinned arithmetic; `renderFrame` is now a pure function (no state mutation); cursor position derived from layout coordinates. Status bar slash-command hints moved from if-else chain to lookup table. Three Chinese UI strings fixed to English
- **Subagent panel redesigned**: per-instance tracking (`role#id/` prefix) — parallel subagents of the same role no longer overwrite each other. Shows current tool name + args, or streaming text last line (what it's writing right now), instead of truncated 200-char token fragments. `onToolCall` relayed from subagent to parent TUI. Only the earliest running subagent is marked done on completion (not all)
- **Tool file split**: `system.mjs` (337 lines) split into `bash.mjs` / `glob.mjs` / `grep.mjs` / `ls.mjs`; `repomap.mjs` (306 lines) split into `repomap.mjs` (public API) + `repomap-parse.mjs` (dependency graph parsing)
- **Export position normalization**: 8 files rearranged — exports at top, implementation helpers below, for top-down readability
- **Provider management UX**: Add Provider excludes already-added presets from the list; Esc in sub-pickers (Add/Remove/Key) returns to model picker instead of exiting; config operations no longer leave traces in the conversation flow (picker refresh is the feedback); `❯ You:` label restored for user messages
- **distill-cmd import fix**: resolved export name mismatch that crashed TUI startup

### 0.7.8 (2026-07)
- **Provider config flow streamlined**: adding a provider now immediately prompts for API key (no more "go back to /provider → Set Key"). Switching to a keyless provider via `/model` also prompts for key inline. Empty input gives clear "skipped" feedback
- **bash tool: file writing forbidden**: models must use write/edit/insert_after/apply_patch instead of `echo`/`sed`/`printf > file`. Fixes GBK encoding corruption on Chinese Windows (cmd.exe writes redirected files in ANSI code page, not UTF-8). `PYTHONIOENCODING=utf-8` set for Python subprocesses on Windows

### 0.7.7 (2026-07)
- **Code review fixes (4 critical bugs)**:
  - `gitSync` anchor never set after full `codeSync` fallback → fast path was dead in production; now `codeSync`/`docSync` write the anchor on success
  - `gitSync` skipped deleted files → stale chunks remained in index forever; `--diff-filter` now includes `D`, and `ENOENT` is distinguished from other errors (failed files don't advance the anchor)
  - Completion guard was a one-shot latch → after firing once, further mutations could finish unverified; now re-armed with a pushback counter (max 2 pushes, 3rd passes through)
  - Verify-failure exhaustion returned raw model text without honesty framing → now injects a system reminder forcing the model to state what's still failing, what was tried, and that the work is unfinished
- **Input queue during processing**: messages typed while the agent is processing are queued and auto-executed when processing ends. Queue preview shown as a single line above the input box (no collision with subagent panel). `Ctrl+D` deletes the last queued item. `/cancel` and `/exit` bypass the queue

### 0.7.6 (2026-07)
- **SYSTEM_PROMPT split into core + discipline**: core rules (shared by all agents) separated from coding/testing/debugging discipline (main agent + coder), so explore/plan subagents no longer burn attention on irrelevant coding clauses — single source of truth, one rule changed in one file
- **git-driven incremental indexing**: new `gitSync` uses `git diff` at startup to find files changed since the last index and rebuilds only their FTS5 chunks. Non-git repos / first run / large changesets (>200 files) automatically fall back to full scans. `codeSync` + `docSync` startup parallelized
- **Embeddings backfilled right after reindexFile**: incremental indexing after each agent write/edit no longer leaves vector NULLs — `ensureEmbeddings` runs immediately, so freshly changed files are semantically searchable at once
- **Project-instruction injection hardening**: AGENTS.md content wrapped with `escapeXml` + `<untrusted_project_instructions>`, closing the prompt-injection hole from malicious project instructions
- **Compaction threshold**: triggers at 60% of model context window, reserving 40% headroom for injected context
- **readSSE tool_calls name dedup**: some APIs (GLM occasionally) resend the full name instead of deltas in the stream, and `+=` produced `readread`. Now only the first non-empty value is taken
- **Edge-case thinking across all prompt layers**: plan/explore/coder/main overlays each gained an edge-case recognition rule (open-ended, no scenario enumeration)
- **Testing discipline refined**: full-test trigger changed from "touched core infrastructure files" to "changed core infrastructure behavior" — adding a helper to memory.mjs no longer triggers the full suite

### 0.7.5 (2026-07)
- **Compound prompt instructions split**: 8 compound sentences across SYSTEM_PROMPT / main-overlay / coder-overlay split into independent bullets (one attention node per instruction), improving instruction-following on DeepSeek/GLM/Qwen — fallback clauses like "add tests after changing code" no longer get skipped
- **Testing discipline strengthened**: SYSTEM_PROMPT Testing discipline gained an independent hard rule (changing behavior/adding code requires tests); main-overlay self-review checklist gained "do existing tests cover the change"; coder-overlay final checklist gained a test item
- **Plan mode workflow**: main-overlay's plan mode instruction split from one compound sentence into a 3-step numbered flow

### 0.7.4 (2026-07)
- **verify tiered self-check**: default quick mode (syntax-check changed files + git diff + self-review checklist, milliseconds); `full=true` also runs the full npm test suite — no more waiting ten-plus seconds per line changed; quick satisfies the completion guard, use full when wrapping up or touching core infrastructure
- **Prompt discipline strengthened**: SYSTEM_PROMPT gained Testing discipline (when to run which tier) and Debugging strategy (diagnose before treating, one change at a time); coder/plan/main overlays gained self-review checklists (simplest solution, match project patterns, don't touch unrelated files)
- **Fix**: quick mode marked verification passed even when syntax checks failed, gutting the completion guard

### 0.7.3 (2026-07)
- **Image paste**: new `read_image` tool — paste images/videos from the clipboard, multimodal models directly understand screenshots, UI mockups, architecture diagrams (Win: `Alt+V` / Mac/Linux: `Ctrl+V`)
- **TUI paste hint**: with a multimodal model, the input box corner shows the OS-appropriate paste shortcut; hidden for text-only models

### 0.7.2 (2026-07)
- **TPM/RPM proactive rate gate**: with `tpm`/`rpm` budgets configured on a provider, requests are booked against a local sliding window (60s, input+output) before sending — over budget means sleeping until the window frees up instead of gambling on 429s; covers the main loop / compaction summaries / subagents / truncation resume. Status bar shows `TPM throttle wait ~Ns`; the gate is off for unconfigured providers
- **429-specific backoff**: respects the `Retry-After` header, otherwise backs off 15s/30s/60s (60s window — sub-second backoff is pointless); quota/balance errors (`exceeded_current_quota_error`) are distinguished from rate limits and no longer retried uselessly
- **Dependency injection as compact summary**: `buildSummary` (directory-level dependencies + hub files + entry points, naturally ~1-2k chars) replaces the full-outline injection; detailed import/export available on demand via `repo_outline`
- **TUI menus**: `/model` `/config` `/provider` `/think` `/mcp` `/goal` `/session` `/restore` unified into picker menus
- **Session robustness**: corrupted files or disk errors during archive/switch no longer crash — silently abandoned

### 0.7.1 (2026-07)
- **Context explosion fix (urgent)**: the startup dependency-outline injection is no longer unbounded — a multi-repo parent directory (thousands of indexed files) produced a 1.4M-char ≈ 350K-token outline, re-injected every turn, blowing up context within a few turns and tripping TPM limits. Now truncated to 6000 chars (with a pointer to `repo_outline` for focused queries) and injected only once per session
- **Compaction escape hatch**: when history was too short (≤13 messages) to slice a middle section, compaction never happened — one giant message (huge paste/oversized injection) could deadlock. Now a deterministic slimming path: oversized user/tool bodies are truncated to stubs, reasoning_content and tool_calls pairing untouched
- **docSync ReferenceError fix**: undeclared `failed`/`errors` made every doc index sync throw (two tests red)
- **apply_patch tool**: unified-diff multi-file atomic patching (any failed hunk → nothing written), permission preview shows the diff directly
- **checkpoint tool**: `list`/`create`/`rewind` snapshot abilities exposed to the model (previously only wired to TUI auto-snapshots + /rewind, so the model couldn't save itself); the bash destructive-git guard upgraded to per-segment detection (chained forms like `&&`/`;`/`|`/command substitution no longer slip through)
- **bash process-tree kill**: timeout/interrupt kills the whole tree (POSIX process groups / Windows taskkill /T) — no orphaned grandchildren
- **Subagent display contract**: only content/thinking tokens relay to the TUI scrolling area; internal tool calls no longer flood the screen
- **Path safety**: `resolveInCwd` prevents symlink escapes (realpath double-check); edit rejects empty old_string; single-file incremental indexing skips hidden directories and node_modules
- **Misc**: SQLite WAL + busy_timeout, single-transaction schema migrations, semantic version comparison for upgrades, MCP cmd.exe quote-doubling escape, gitmem skips commits when nothing changed

### 0.7.0 (2026-07)
- **Deep model protocol adaptation**: reasoning_content echo differentiated per model (`reasoningEcho` spec field) — DeepSeek/Kimi must echo, GLM must not; reasoning_effort enum validation (`reasoningEffortEnum`); temperature range clamping (`tempRange`)
- **Qwen/MiniMax spec completion**: reasoning_effort enums (Qwen 3.8-max-preview), temperature ranges (Qwen [0,2), MiniMax [0,2]), MiniMax M3 thinking mode
- **grep context lines**: `before`/`after` params (grep -B/-A equivalents), matches marked with `:`, context with `-`, adjacent ranges in the same file merged and deduped
- **System prompt boundary rule**: never modify files outside the working directory; never use bash to bypass the read/write/edit directory confinement
- **question tool input box title**: fixed to ` Question `, question text goes to the conversation area (no longer crammed into the box title)

### 0.5.0 (2026-07)
- **Codebase understanding**: `repo_outline` (dependency outline, auto-injected at startup), `code_search` (FTS5 + vectors + JSDoc), `doc_search` (chunked by ## headings), auto-incremental indexing on file writes
- **Model adaptation**: 5 built-in presets (DeepSeek/Kimi/GLM/Qwen/MiniMax), maxTokens maxed out, truncation resume, thinking-mode APIs auto-matched
- Session 5-slot archiving, `/session` switching, tool results shown after restore
- Subagent streaming output visible, final reports in the conversation area
- File tools confined to the working directory, permission preview above the input box
- write/edit auto-attach git diffs, edit error messages with better hints
- task auto-filters completed items, proactive reminder when all done
- Prompt guidance: "check official docs → save discrepancies to project memory"

### 0.4.0
- Permission approval shows content previews (write content, edit diff, bash command)
- Todo panel progress visualization, status bar token usage and context utilization
- Two-layer project instructions merge (global + project AGENTS.md)

### 0.3.0
- MCP client (JSON-RPC + stdio, zero-dependency)
- Skills system (`.thincoder/skills/*.md`)
- Plan/Goal/Question tools
- Prompts externalized to `.md` files, subagent role overlays
- Strict task discipline (keep ONE in_progress), completion guard (file changes blocked without verify)
- DeepSeek thinking echo, system prompt prefix caching
- checkpoint snapshots + `/rewind` rollback

### 0.2.0
- multi-provider configuration (switch between endpoints)
- Initial setup wizard (arrow-key model picker, key entry)
- `/think` thinking mode toggle and reasoning effort
- `/model` model picker
- bash streaming output passthrough

### 0.1.0
- Agent main loop, 14 builtin tools, zero-dependency TUI
- Three-layer memory (personal/project/team), FTS5 retrieval
- Session persistence, context compaction, streaming SSE

## License

MIT
