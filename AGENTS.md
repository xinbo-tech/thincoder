# AGENTS.md — ThinCoder Project Guide

## Project Overview

Zero-dependency AI coding CLI: pure Node.js >= 24 standard library, no build step, ESM (`.mjs`).
LLMs via OpenAI-compatible protocol, flagship models from DeepSeek / Kimi / GLM / Qwen / MiniMax.

## Requirements & Design Docs (the doc map)

**需求基线**：`docs/design/REQUIREMENTS.md`（讨论中，随对话更新，定型后拆分为正式需求/设计文档）+ 具体设计文档 + 用户对话。**本项目没有独立于设计文档的需求文件**——评审/开发时以 REQUIREMENTS.md + 相关设计文档 + 对话背景三者为参照。

设计文档在 `docs/design/`。主流程：[`PHILOSOPHY.md`](docs/design/PHILOSOPHY.md)（三观）→ [`METHODOLOGY.md`](docs/design/METHODOLOGY.md)（方法论）→ prompts。其余文档按主题：

- **架构与模块**：`ARCHITECTURE.md`（v1 定稿）/ `ARCHITECTURE-v2.md`（v2 决策收口）/ `AGENT-LOOP.md`（主循环+guard 体系）/ `TOOLS.md`（内置工具）/ `PROVIDER.md`（LLM 调用层）/ `PROXY.md` / `SESSION.md`（存储契约）/ `MEMORY.md`（三层记忆）
- **评审与工程模式**：`ADVISOR-CONVERGENCE.md`（**评审收敛机制——评审代码前必读**）/ `ENGINEERING-MODE.md` / `ENGINEERING-WORKLOOP.md`
- **多模型协作**：`CONSULTATION.md`（会诊三工具）/ `ESCALATE.md`（飞刀）
- **上下文管理**：`CONTEXT-COMPACTION.md`（压缩规范基准）/ `VERIFY-DOCONLY.md` / `PROMPT-DECOUPLING.md`
- **TUI 与客户端**：`TUI.md` / `TUI-INPUT-BOX.md`（输入框行为契约）/ `TUI-TOOL-OUTPUT.md` / `MCP.md` / `ACP-CLIENT.md`
- **需求与规划**：`REQUIREMENTS.md` / `FEATURES.md`（按实现梳理）/ `ROADMAP-0.9.0.md` / `EVALUATION.md`
- **参考分析**：`COMPETITIVE-CLI-2026.md` / `KIMI-CODE-PROMPT-ANALYSIS.md` / `TTSR-ANALYSIS.md`

## Hard Constraints

- **Zero npm runtime dependencies**: only `node:` standard library (storage via `node:sqlite`, TUI via bare ANSI). For new features, first ask whether the standard library can do it; if not, raise for discussion.
- No TypeScript, no build/bundling step.
- Every change must be verified by running it — no "written but never run" code.

## Key Conventions

- **Reminder format**: all system reminders use `role: "user"`, `[System reminder: ...]` prefix and must not be mentioned in replies. External/user text injected into reminders must be XML-escaped in `<untrusted_*>` tags.
- **Prefix caching**: the system prompt must be byte-stable across runs — per-turn varying content goes in user messages, not the system prompt.
- **Thinking echo**: `reasoning_content` in assistant tool_calls messages depends on the model's `reasoningEcho` spec field.
- **Commit messages**: `type: summary` (feat / fix / release / docs), single English line.
- **Release flow**: bump `package.json` version → `npm publish` → commit + `git tag vX.Y.Z` → `git push origin main --tags`. Manual smoke pass before release. **Version bumps default to patch (third digit) only** — never bump minor/major unless the user explicitly says so.
- **Discussion → docs**: design decisions, architecture choices, and naming conventions discussed in chat don't exist until they're in a doc file. After any design discussion, write the conclusions to the relevant document immediately — not "later". Chat context compresses; docs persist.
- **File size**: single `.mjs` / `.js` source file exceeding 300 lines → advisory (🟡): suggest splitting. Exceeding 500 lines → blocking (🔴): must split before merge. Test files (`test/**`) and generated code are exempt.
- **Testing policy**: run `npm test` after code changes to verify functionality. Pure documentation updates (`*.md`, `README`, `docs/**`, `AGENTS.md`, `CHANGELOG`) do not require running tests — only commit and push.

## Key Modules

```
bin/thincoder.cjs    CLI entry
src/agent.mjs        main loop + reminder injection + verifyGuard (opt-in) + incremental indexing
src/agent/           loop helpers (dispatch, setup, helpers, post-turn, completion)
src/agent-tools/     self-discipline tools (task/plan/goal/verify/subagent/skill)
src/prompts/         system prompts (system.md / discipline.md / main.md + subagent roles)
src/provider/        LLM calls (native fetch + SSE)
src/tools/           built-in tools (file/git/bash/search/web/checklist)
src/tui/             bare-ANSI terminal UI
src/memory/          three-layer FTS5 + vector memory
src/context.mjs      context compaction
src/config.mjs       config + provider presets
src/mcp/             MCP client (stdio/http/ws transports)
test/                test suite
```
