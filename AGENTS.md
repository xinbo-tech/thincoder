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
- **镜像提示词约定（2026-09-04 项目文档层声明）**：本仓库（thincoder）与 thincoder-vscode 的 `src/prompts/*.md` **15 对 byte-identical**——改动任一提示词**只写 CLI 侧**，VS Code 副本由同步脚本（`scripts/sync-prompts.mjs`——若存在）/复制保证一致；**不要双端各自改**（两端并行独立实现是 byte-identity 漂移与 agent 镜像纠结的根源）。

## Key Conventions

- **Reminder format**: all system reminders use `role: "user"`, `[System reminder: ...]` prefix and must not be mentioned in replies. External/user text injected into reminders must be XML-escaped in `<untrusted_*>` tags.
- **Prefix caching**: the system prompt must be byte-stable across runs — per-turn varying content goes in user messages, not the system prompt.
- **Thinking echo**: `reasoning_content` in assistant tool_calls messages depends on the model's `reasoningEcho` spec field.
- **Commit messages**: `type: summary` (feat / fix / release / docs), single English line.
- **Release flow**: bump `package.json` version → `npm publish` → commit + `git tag vX.Y.Z` → `git push origin main --tags`. Manual smoke pass before release. **Versioning (CalVer, 2026-08-27)** — see `docs/design/RELEASE.md` §4.6: `年份.月份.月内计数`, month counter resets each month; CLI stays on `0.12.x` through 2026 then switches to `1.1.0` on 2027-01; never bump below the published version (npm/vsce reject downgrades).
- **Discussion → docs**: design decisions, architecture choices, and naming conventions discussed in chat don't exist until they're in a doc file. After any design discussion, write the conclusions to the relevant document immediately — not "later". Chat context compresses; docs persist.
- **Doc references use symbols, not line numbers**: design docs anchor code references to symbol/export names (e.g. `routeSubToken` in `subagent-blocks.mjs`), never line numbers — line numbers rot on every edit, symbols are grep-able. Historical change-log entries keep their as-of snapshot.
- **File size**: single `.mjs` / `.js` source file exceeding 300 lines → advisory (🟡): suggest splitting. Exceeding 500 lines → blocking (🔴): must split before merge. Test files (`test/**`) and generated code are exempt.
- **Testing policy**: two layers. `npm test` = fast layer — fs/git-subprocess/timer/network-heavy tests are `slow()`-gated (auto-skip, runner output shows them; ~15s). `npm run test:full` (env `THINCODER_TEST_FULL=1`) runs everything — required before release, and after touching session/checkpoint/memory/git-index areas. The real-endpoint smoke (`test/smoke-qwen-thinking.mjs`) is in NEITHER layer: run manually with `THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs` (it spends real API tokens). Gate mechanism: `test/slow.mjs`. Pure documentation updates (`*.md`, `README`, `docs/**`, `AGENTS.md`, `CHANGELOG`) do not require running tests — only commit and push.
- **Dogfooding feedback (must report)**: using thincoder to build *other* projects (e.g. thinworker) is itself a deep test of thincoder. When you find a thincoder bug, an unusable/awkward tool, or a workflow defect during such work, **report it proactively** — never silently work around it or fix-and-forget. Report routing: **functional bug / tool doesn't fit** → open a Gitee issue (thincoder or thincoder-vscode repo, label `bug`/`feature`; write mode via `thincoder-issues/check-gitee-issues.mjs`, needs `GITEE_TOKEN` env var); **doc flaw / minor polish** → thincoder `docs/TODO.md`. Fixing the bug then follows thincoder's own engineering flow (design doc → review → eng-coder → release).

## Checkpoint 事故恢复（快照机制，权威文档：docs/design/CHECKPOINT.md）

- **快照时机**（可验证触发点）：① git 工具破坏性操作前自动快照（`snapshotBefore`——checkout 还原文件 / restore / reset --hard / stash pop / branch|tag delete / clean / rebase）；② bash guard（`gitGuardSnapshot`，宽匹配 `GIT_DESTRUCTIVE_RE` 的破坏性 git 命令先快照后放行）；③ 手动 `git` 工具 `checkpointAction=create`。平台层"任务列表删除/上下文压缩前"自动快照**未在本项目代码中证实**——文档不声称。
- **恢复流程**：发现未提交改动被丢弃 → `git` 工具 `checkpointAction=list` 查快照 → `checkpointAction=cat` 确认内容 → `checkpointAction=rewind checkpointId=<id> path=<文件>` 单文件恢复（rewind 前自动快照当前状态，可逆；全量回滚被禁——与 `git checkout -- .` 同等危险）。
- **快照语义边界**：快照 = **"操作前状态"**，质量取决于操作前状态本身——编码损坏/已丢失的内容**无法直接 rewind 恢复完好原文**，但快照文件可 `cat` 读取作**重建参照**（2026-09-01 事故实证：结构/ASCII 常完好）。
- **commit 清理（F6）**：commit 成功后该项目（cwd）的全部 checkpoint 被清空（commit = 新的安全基线，git 历史 + reflog 是更强恢复手段）；checkpoint list/create 入口懒检查外部 commit（HEAD 时间 > 最新快照时间）同样清空。commit 前如需保留中间状态，先手动 `checkpointAction=create`。
- **存储**：`~/.thincoder/checkpoints/{cwdHash12}/`（cwdHash12 = `sha1(normalizeCwd(cwd)).slice(0,12)`，Windows 盘符大写归一化）——与 VS Code 端**同存储同格式**，快照跨端互通；每 cwd 上限 100 个（最旧淘汰）。
- **纪律**：**git 操作一律走 git 工具**（含 clean/rebase 等破坏性操作）——违反即视为纪律违规；bash guard 仅为纪律漏网兜底（纵深防御）。

```
bin/thincoder.cjs    CLI entry
src/agent.mjs        main loop + reminder injection + verifyGuard (opt-in) + incremental indexing
src/agent/           loop helpers (dispatch, setup, helpers, post-turn, completion)
src/agent-tools/     self-discipline tools (task/plan/goal/verify/subagent/skill/read_history)
src/prompts/         system prompts (system.md / discipline.md / main.md + subagent roles)
src/provider/        LLM calls (native fetch + SSE)
src/tools/           built-in tools (file/git/bash/search/web/checklist)
src/tui/             bare-ANSI terminal UI
src/memory/          three-layer FTS5 + vector memory
src/context.mjs      context compaction
src/config.mjs       config + provider presets
src/mcp/             MCP client (stdio/http/ws transports)
src/log.mjs          diagnostic event log (LOGGING.md — logEvent/rotation/blacklist; shared ~/.thincoder/logs/)
test/                test suite
```
