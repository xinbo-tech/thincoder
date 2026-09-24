# ThinCoder for VS Code

**Full AI coding agent, inside your editor. Zero bloat.**

ThinCoder VS Code gives you the complete ThinCoder agent — multi-turn tool-calling, subagents, plan mode, task tracking — in a side panel. It reads your project, writes code, runs commands, searches the web, and explains its work as it goes.

Like the CLI, it's pure `.mjs`, zero third-party runtime dependencies, and connects directly to top-tier models via OpenAI-compatible APIs.

## Features

- **Full agent loop** — multi-turn reasoning, tool execution, context compaction
- **20+ built-in tools** — read, write, edit, bash, glob, grep, git (diff/status/log), websearch, fetch, checkpoint, question, syntax_check, and more. Tools grouped for parallel execution (consecutive readonly tools run concurrently).
- **Subagents** — explore (codebase search) / plan (architecture design) / coder (implementation), dispatched with role-specific prompts
- **Plan Mode** — read-only exploration → design proposal → user approval → implement
- **Task tracking** — `task` tool breaks down multi-step work with pending/in_progress/done status
- **Verify guard** — file changes without verify get pushed back; syntax check must pass before claiming completion
- **Context compaction** — automatically summarizes old messages when conversation grows too long
- **Repo outline** — scans project import/export dependencies so the agent understands your codebase structure
- **Multi-session** — save and switch between conversation sessions with session bar; LLM auto-generates titles
- **Image input** — paste or drag images into chat, or use `read_image` tool; supported on vision models (Kimi K3, Qwen3.7, MiniMax M3)
- **Reasoning display** — collapsible "Thinking..." block shows the model's reasoning process in real-time
- **21 provider presets** — DeepSeek, Kimi, Kimi For Coding, GLM, GLM Coding Plan, Qwen, Qwen Token Plan, MiMo, MiMo Token Plan, MiniMax, OpenAI, Claude, Gemini, Grok, Mistral, Volcengine, Hunyuan, Tencent TokenHub, SiliconFlow, OpenRouter, Groq + custom OpenAI-compatible endpoint
- **Vector search** — semantic code search with BAAI/bge-m3 embeddings via SiliconFlow (configurable in Settings)
- **Model selection** — choose from all available models per provider, with reasoning effort control
- **Permission control** — session-level AUTO mode (off by default): every file-modifying tool prompts for approval until you click the AUTO toolbar button or "Approve All"; the flip takes effect immediately, even mid-turn
- **Right-click** — select code in editor, right-click → "Ask ThinCoder"

## Requirements

- VS Code >= 1.104.0
- An API key for at least one supported provider

## Quick Start

1. Install the extension from VS Code Marketplace (or `vsce package` + sideload)
2. Press `Ctrl+Alt+T` (Mac: `Cmd+Alt+T`) — the ThinCoder panel opens in the sidebar
3. First run shows a welcome panel: pick a provider, paste your API key, save (the key is verified on save). You can add more providers later via ⚙ (Settings) in the toolbar
4. Start chatting — ThinCoder reads your workspace and responds

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `ThinCoder: Open Chat` | `Ctrl+Alt+T` | Open the chat panel |
| `ThinCoder: Send Message` | — | Quick input box → send message to chat |
| `ThinCoder: Setup Provider & API Key` | — | Add or change API keys |
| `Ask ThinCoder` | Right-click in editor | Send selected code to chat |

## Configuration

All settings under `thincoder.*` in VS Code settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `thincoder.providers` | object | `{}` | **Deprecated** — legacy provider/key storage. On first activation it is migrated into `~/.thincoder/config.json` (shared with the CLI) and then cleared. Edit that file or use the in-panel Settings (⚙) instead. |

Auto-approve is **not a VS Code setting** — it is a session-level flag stored in the shared session slot (`~/.thincoder/sessions/`), same as the CLI. Toggle it with the AUTO toolbar button in the chat panel or via a prompt's "Approve All" button; each session remembers its own state.

### Web search (optional Tavily)

The `websearch` tool defaults to **Bing HTML extraction** (zero-config, no key). To use **Tavily's structured search API** — stable JSON results, no HTML scraping, resilient to page-structure changes — add this to `~/.thincoder/config.json` (shared with the CLI):

```jsonc
{
  "websearch": {
    "apiKey": "tvly-..."   // https://tavily.com — free monthly tier available
  }
}
```

No key (or a bad key) → the tool silently falls back to Bing, so agents never lose search.

### Supported Providers

| Provider | Default Model | API Endpoint |
|----------|--------------|-------------|
| DeepSeek | `deepseek-flash` | `https://api.deepseek.com` |
| Kimi (Moonshot) | `kimi-k3` | `https://api.moonshot.cn/v1` |
| Kimi For Coding | `k3` | `https://api.kimi.com/coding/v1` — separate platform, `sk-kimi-` keys are NOT interchangeable with Moonshot |
| GLM (Zhipu) | `glm-5.2` | `https://open.bigmodel.cn/api/paas/v4` |
| GLM Coding Plan (智谱 Coding) | `glm-5.2` | `https://open.bigmodel.cn/api/coding/paas/v4` |
| Qwen (Alibaba) | `qwen3.7-max` | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| Qwen Token Plan | `qwen3.7-max` | `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1` |
| MiMo (小米) | `mimo-v2.6-pro` | `https://api.xiaomimimo.com/v1` |
| MiMo Token Plan (小米套餐) | `mimo-v2.6-pro` | `https://token-plan-cn.xiaomimimo.com/v1` |
| MiniMax | `MiniMax-M3` | `https://api.minimaxi.com/v1` |
| OpenAI | `gpt-4o` | `https://api.openai.com/v1` |
| Claude (Anthropic) | `claude-sonnet-4` | `https://api.anthropic.com/v1` |
| Gemini (Google) | `gemini-2.5-flash` | `https://generativelanguage.googleapis.com/v1beta` |
| Grok (xAI) | `grok-4.5` | `https://api.x.ai/v1` |
| Mistral | `mistral-large` | `https://api.mistral.ai/v1` |
| Volcengine Ark (豆包) | `doubao-seed-2-0-code-preview-260215` | `https://ark.cn-beijing.volces.com/api/v3` |
| Hunyuan (腾讯混元) | `hunyuan-pro` | `https://api.hunyuan.cloud.tencent.com/v1` |
| Tencent TokenHub (腾讯混元网关) | `hy3` | `https://tokenhub.tencentmaas.com/v1` |
| SiliconFlow (硅基流动) | `deepseek-ai/DeepSeek-V3` | `https://api.siliconflow.cn/v1` |
| OpenRouter | `anthropic/claude-sonnet-4` | `https://openrouter.ai/api/v1` |
| Groq | `llama-3.3-70b-versatile` | `https://api.groq.com/openai/v1` |
| Custom | (user-specified) | User-configured |

## Chat panel shortcuts

Keyboard shortcuts inside the chat panel (CLI parity):

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Stop the running turn (a text selection still copies instead) |
| `Ctrl+I` | Interrupt and inject a message — partial output is kept, the turn resumes with your message |
| `Ctrl+F` | Search the conversation (live highlight, Enter/↑↓ to jump, Esc to close) |
| `Ctrl+U` | Clear the input line |
| `↑` / `↓` | Navigate input history (only at the absolute start/end of the input — mid-text arrows move the cursor) |
| `Enter` / `Shift+Enter` | Send / insert newline |
| `Esc` | Close dropdown / search bar |

## Architecture

```
┌──────────────────────────────────────────┐
│  VS Code Extension Host                  │
│  ┌────────────┐  ┌────────────────────┐  │
│  │ ChatPanel  │  │  Agent Loop        │  │
│  │ (session   │  │  (agent.mjs)       │  │
│  │  mgmt,     │  │  - tool execution  │  │
│  │  settings) │  │  - context compact │  │
│  └─────┬──────┘  │  - subagent spawn  │  │
│        │         └────────┬───────────┘  │
│   postMessage            │               │
│        │         ┌───────┴───────────┐   │
│        │         │  Provider         │   │
│        │         │  (fetch + SSE)    │   │
│        │         └───────────────────┘   │
│  ┌─────┴──────────────────────────────┐  │
│  │  Webview (iframe)                  │  │
│  │  - chat.js (orchestration)         │  │
│  │  - ui.js (DOM rendering)           │  │
│  │  - md.js (Markdown)                │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

- **Extension host** runs the agent loop, manages sessions, and talks to LLM providers
- **Webview** handles the chat UI — message display, model selector, session history, settings panel
- Communication is one-way message passing: webview sends `userMessage`/`abort`/`setup` etc., extension sends `token`/`toolCall`/`complete`/`error` etc.

## Development

```bash
# No build step — the extension runs directly from source
# Edit extension.mjs, src/*.mjs, webview/*.{js,css,html}

# Package for distribution
npx @vscode/vsce package
```

### Project Structure

```
thincoder-vscode/
├── extension.mjs         # VS Code entry point
├── package.json          # Extension manifest
├── AGENTS.md             # Developer guide
├── README.md             # This file
├── src/
│   ├── agent/                 # Shell assembly — setup, tool table, run stages, reminders, gates
│   ├── agent.mjs              # Agent loop — tool batching, image injection, compaction, subagents
│   ├── agent-tools/           # Meta-tool wiring — registry re-export + stop/discard face
│   ├── config-mcp.mjs         # MCP config shell — panel edits persist to config
│   ├── embed-config.mjs       # Embedding / vector config shell
│   ├── explore-distill.mjs    # Explore-summary adapter (core summarizer wrapper)
│   ├── extension/             # Chat panel modules — panel-*, session slots/IO, settings, presets
│   ├── i18n.mjs               # UI translation shell (core dictionary + end keys)
│   ├── memory-tool.mjs        # memory tool shell face (core memory single source)
│   ├── prompt-injections.mjs  # Prompt-anchor values for this end — tool face (bash / question)
│   ├── repomap.mjs            # Repository dependency outline (workspace.fs data source)
│   ├── specs.mjs              # Model capability specs (core table + end-side additions)
│   ├── tools/                 # Host tools — code, focus, ide, shell + core tool wiring
│   └── tools.mjs              # Re-export shim → src/tools/index.mjs
├── webview/
│   ├── chat.js           # Frontend orchestration
│   ├── ui.js             # DOM helpers
│   ├── md.js             # Markdown renderer
│   ├── index.html        # Webview shell
│   ├── base.css          # Reset, variables, layout
│   ├── chat.css          # Messages, markdown, tool calls
│   ├── controls.css      # Input area, controls, dropdown
│   ├── session.css       # Session bar
│   └── settings.css      # Settings panel
└── docs/
    └── design/           # Design docs (migration-period archive — authoritative Chinese design docs = repo-root docs/core/design/)
```

## vs. ThinCoder CLI

| Feature | CLI (`thincoder`) | VS Code Extension |
|---------|-------------------|-------------------|
| Interface | Terminal TUI (ANSI) | VS Code side panel |
| Memory system | 3-layer FTS5 + vector | File-based Markdown entries (CLI-compatible format); vector semantic search when embedding key configured, keyword fallback — no FTS5 |
| Checkpoint | Git snapshot restore | Git diff/status/log only |
| MCP support | ✅ | ✅ |
| Session persistence | Unlimited archive slots | Shared with the CLI — same files and slots (`~/.thincoder/sessions/`) |
| Skill system | ✅ | ✅ |
| Plan mode | ✅ | ✅ |
| Subagents | ✅ | ✅ |
| Verify guard | ✅ | ✅ |
| Image input | `read_image` tool | ✅ |
