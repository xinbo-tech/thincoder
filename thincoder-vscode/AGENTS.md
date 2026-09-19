# AGENTS.md — ThinCoder VS Code Extension Guide

## Project Overview

VS Code extension wrapping the ThinCoder AI coding agent. Provides a side-panel chat UI with full agent capabilities — multi-turn tool-calling loop, subagents, plan mode, task tracking — all inside the editor. Shared mechanisms live in the core package `@thincoder/core` (single source — the same one the CLI consumes); this tree keeps the VS Code shell / assembly face.

Design docs in `docs/design/` (migration-period reference — retained, not maintained). The authoritative Chinese design docs for the shared core live at the repo root `docs/core/design/`.

## Hard Constraints

- **Zero third-party npm runtime dependencies**: only `node:` standard library, the VS Code Extension API (`vscode` module), and the in-repo core package `@thincoder/core` — the one declared dependency (zero third-party). No TypeScript, no build/bundling step. (The vsix-unpack assertion script uses the **dev-only** `yauzl` — see `scripts/check-vsix.mjs`; never a runtime import.)
- ESM (`.mjs`) throughout — `package.json` declares `"type": "module"`.
- LLM calls go through native `fetch` with SSE streaming, same as thincoder core.
- Tool implementations are adapted for VS Code context (workspace root = cwd; no directory restriction on tools since 2026-09-02 — paths resolve relative to cwd, approval gate is the guard).
- **提示词面（核内唯一副本——2026-09-15 修订）**：运行期提示词/工具描述 = 核内落地（`thincoder-core/prompts/` 15 档槽位 + `thincoder-core/tool-docs/` 24 档工具描述）——本端自持提示词 / 工具描述镜像已删（F9 零残留）；中文设计档（人读正本）= 仓根 `docs/core/design/prompts/*.md`。装配 = 核单点（`@thincoder/core/prompt-overlays.mjs`）+ 本端 `src/prompt-injections.mjs`（13 锚 VSC 取值表）注入端取值。


## Key Conventions

- **Entry point**: `extension.mjs` — `activate()` registers commands and sets up the ChatPanel.
- **Webview separation**: the chat UI (`webview/`) runs in an isolated iframe, communicating with the extension host via `postMessage`. No shared state between extension and webview beyond the message protocol.
- **Session persistence**: **shared with the CLI** — same on-disk format and location (`~/.thincoder/sessions/`). Sessions are numbered slots `session.json.N` plus a `session.json.manifest` (slot metadata + active pointer + sessionId). The cwd hash is the **full 40-char `sha1(normalizeCwd(cwd))`, not truncated**, where normalizeCwd **uppercases the Windows drive letter** (`d:\…` → `D:\…`) — `uri.fsPath` lowercases it, which would otherwise produce a different hash than the CLI's `process.cwd()`. Legacy 12-char-hash files are renamed to the full hash on first access. Both ends read/write the same files, so a session created in the CLI appears in VS Code and vice versa. Titles (`title` field) are auto-generated from the first user message on both ends. The legacy `messages/` directory + base64 names + Memento index are abandoned (pre-release, no migration). **End separation (§10, 2026-09-05)**: each end's own resume target = its own end-marker file `{manifest}.vscode` (CLI writes `.cli`, never touched by the other end) — panel open resolves via `resumeSlot` (record → one-time inherit of a dead-owner `manifest.active` when no record → fresh allocate); `manifest.active` stays the shared pointer for old-version/ACP semantics and list fallback highlighting only.
- **Provider config**: shared with the CLI — both ends read/write `~/.thincoder/config.json` — MODEL-MERGE-SESSION schema: `providers[]` carry `models[]` candidate lists (per-channel `model` retired), top-level `defaultModel` ("provider:model" composite) is the new-session starting point, and the old `activeProvider`/`activeModel` config keys are gone (legacy shapes migrate on read — 核 `@thincoder/core/config-migrate.mjs`（本端自持镜像已删——W16）, write-back failures never block). Session model selection is session-scoped: `/model` (CLI) and the model dropdown (VSC) write the session slot's `activeProvider`/`activeModel` double fields, never config. Preset table = 核 `PROVIDER_PRESETS`（端壳经 `src/extension/presets.mjs` 取用）。Legacy VS Code storage (`thincoder.providers` settings + SecretStorage) is migrated once on activation, then cleared.
- **Tool approval**: session-level `autoApprove` slot field (shared with the CLI), not a VS Code setting. Defaults to `false` — the model runs in permission mode and the webview prompts per file-modifying tool. The AUTO toolbar button or a prompt's "Approve All" flips it; the flag is read LIVE by the agent loop (getter, CLI parity), so a mid-turn flip stops the remaining prompts of the same turn immediately. No `thincoder.autoApprove` setting exists — the panel button is the only switch.
- **No legacy migration code**: project is pre-release — breaking changes are expected. When storage format changes, just change it. Migration boilerplate becomes dead code instantly.
- **Model specs**: `src/specs.mjs` = 核 `@thincoder/core/model-specs.mjs` 规格表 + 端侧 `reasoningEffortDefault` 增补面（原自包含 `src/config.mjs` 镜像已删——W16）。
- **Editor dual channel**: file tools edit open documents via WorkspaceEdit (undo-integrated) and **save immediately after applying** (`applyEditorEdit` in tools/shared.mjs — range 径 `applyEditorRangeEdit` 已 retired（W14），勿再接线) — applying without saving leaves the buffer dirty while the disk stays stale, which self-locks the next edit on the isDirty guard and races external writers (split-brain data loss, 2026-08-13 incident).
- **isDirty refusal is a stop sign, not a detour**: when a file tool returns "File has unsaved changes in the editor", the agent MUST stop and ask the user to save/discard — never route around via execute/bash/direct fs writes. The guard exists precisely because the agent's own writes and the user's buffer would otherwise silently clobber each other.
- **Lazy history loading**: long sessions never load eagerly. `_loadSession` sends only the LAST page (`historyWindow(history, null)` in history-window.mjs, page size 200 — `HISTORY_PAGE_SIZE`, first-window CLI parity; `idx` = GLOBAL history indexes); the webview requests older pages via `loadOlder` when scrolled near the top (guard: `_hasOlder` + `_loadingOlder`). Older pages are prepended before the earliest `.message/.tool-call` with scroll-position compensation (scrollHeight delta). Restored assistant frames are ONE `.message.assistant` carrying nested tool cards (SESSION-RESTORE-PARITY); the `before` anchor comes from the webview's minimum rendered `data-idx` — only outer messages carry one — live streaming messages carry no idx, so they can never corrupt the window (a completed turn that lands on disk does NOT duplicate: pages always end before `before`).
- **Error surfacing**: `isNonRetryableError`（核 `@thincoder/core/provider/`——本端自持 provider 镜像已删，W10）detects billing/param errors across all provider formats and fails immediately (no retry). `readSSE`（同核面）detects non-SSE responses (API errors returned as JSON) and extracts error messages.
- **Provider-specific thinking values**: not all providers accept `thinking.type: "enabled"`. MiniMax requires `"adaptive"`. The `thinkEnabledValue` spec field maps the generic `"enabled"` UI toggle to the correct provider value.
- **Discussion → docs**: design decisions, architecture choices, and naming conventions discussed in chat don't exist until they're in a doc file. After any design discussion, write the conclusions to the relevant document immediately — not "later". Chat context compresses; docs persist.
- **Commit & push promptly**: commit at each batch closeout (path-scoped); push immediately after committing — the remote is the only disaster backup; push before any destructive git operation.
- **Dogfooding feedback (must report)**: using thincoder to build *other* projects (e.g. thinworker) is itself a deep test of thincoder. When you find a thincoder bug, an unusable/awkward tool, or a workflow defect during such work, **report it proactively** — never silently work around it or fix-and-forget. Report routing: **functional bug / tool doesn't fit** → open a Gitee issue (thincoder or thincoder-vscode repo, label `bug`/`feature`; write mode via `thincoder-issues/check-gitee-issues.mjs`, needs `GITEE_TOKEN` env var); **doc flaw / minor polish** → thincoder `docs/TODO.md`. Fixing the bug then follows thincoder's own engineering flow (design doc → review → eng-coder → release).
- **Checkpoint 事故恢复（快照机制）**：与 CLI 完全一致——权威文档 `../docs/core/design/CHECKPOINT.md`（本端引用不复制）。要点：① 快照时机 = git 工具破坏性操作前自动快照（checkout 还原文件 / restore / reset --hard / stash pop / branch|tag delete / clean / rebase）+ bash guard（`gitGuardSnapshot` 宽匹配，先快照后放行）+ 手动 `checkpointAction=create`；② 恢复 = `checkpointAction=list` → `cat` → `rewind checkpointId=<id> path=<文件>`；③ 快照是"操作前状态"而非"良好状态"备份（编码损坏内容 cat 作重建参照）；④ commit 成功后该项目 checkpoint 清空（commit = 新安全基线）；⑤ 存储 = `~/.thincoder/checkpoints/{cwdHash12}/`（cwdHash12 = `sha1(normalizeCwd(cwd)).slice(0,12)`，盘符大写归一化——与 CLI 同目录同格式，快照跨端互通；实现 = 核 `@thincoder/core/git/checkpoint.mjs`——本端自持镜像已删，W5）；⑥ **存量 stash 快照不迁移**（不再支持工具 rewind，用户可手动 `git stash drop`）。**git 操作一律走 git 工具**（含 clean/rebase 等破坏性操作）——违反即视为纪律违规；bash guard 仅为纪律漏网兜底。

**模块图 = 概览——权威见 [`ARCHITECTURE.md`](../docs/core/design/ARCHITECTURE.md) §3（模块地图当前态 · VSC 壳层装配地图 = §3.1）——此处只列主要项（**非穷尽**）**：

```
（机制本体 = `@thincoder/core`（prompts / provider / mcp / memory / checkpoint / tools / tool-docs / traces / advisor / agent-tools 族）——本端只列端壳 / 装配面；已删的自持镜像不再列行）
extension.mjs        Extension entry — 注册 ChatPanel（类已迁 src/extension/chat-panel.mjs）为 WebviewViewProvider + commands/status bar（session CRUD/设置/标题生成/CSP 注入随类迁移）
src/agent.mjs         Agent main loop — parallel tool batching, multimodal image injection, context compaction, subagent spawning, reasoningEcho
src/agent/           端壳装配面（W15 重定保留）—— setup.mjs（装配/注入/工具表）· setup-tooltable.mjs（工具表装配装饰面——W9 记账缝 / W14 三缝 / 池装配与子代理面）· turn-domains.mjs（端侧回合域文本组合单点——核基座转口 + 端 overlay，digest 轮与 ask 唤醒轮共用）· run-stages.mjs（回合级阶段）· setup-reminders.mjs（端特有提醒 + 核转口）· agent-state.mjs · context-injections.mjs · execute-tools.mjs · tool-gates.mjs · run-helpers.mjs
src/agent-tools/index.mjs  自持工具集转口（W9 起 = 核登记册 `@thincoder/core/agent-tools.mjs` 单源；端侧不再自持名清单）
src/agent-tools/async-discard.mjs  Stop 丢弃面（端壳档；池/墓碑读改指核 `async-settle` 单源）
src/config-mcp.mjs    MCP 配置端壳（面板增删改 → 端壳写盘通道 `vscPersistRaw`）
src/embed-config.mjs  嵌入/向量配置端壳面（消费核 embedding 读点）
src/explore-distill.mjs  探索摘要端壳适配器（核 `summarizeRunExplorations` 包装——共享 history 原位回收）
src/i18n.mjs          `t()` 壳（核 `projectDictionary` 投影底座 + 端特有键叠加；locales/{en,zh}.json）
src/memory-tool.mjs   memory 工具端壳面（核 memory 单源消费）
src/prompt-injections.mjs  13 名锚 VSC 取值表（W2——数据面；核槽位装配注入值）
src/repomap.mjs       Repository dependency graph parsing（workspace.fs 数据源）
src/specs.mjs         Model capability specs（核 `model-specs.mjs` 表 + 端侧 `reasoningEffortDefault` 增补面）
src/tools.mjs         Re-export shim → src/tools/index.mjs（端壳工具面 = {code,context,focus,index,shared,shell}；内置工具实现本体在核）
src/tools/{index,shell,code,context,focus,shared}.mjs  端壳工具面（index = 核工具装配 · shell/code/context/focus = 宿主工具 · shared = 拆壳薄壳 + 四缝供值）
src/extension/        ChatPanel 分解模块（chat-panel.mjs 类本体 + panel-chat/panel-messages/panel-session/panel-project/panel-mcp/panel-index/panel-toolpanel/panel-callbacks 等载荷分模块 + session-io/session-slots/settings/presets）
webview/chat.js
webview/state.js     UI 状态单一持有（S + DOM ctx + vscode——全模块共享同一运行时对象——WEBVIEW.md）
webview/streaming.js  token/reasoning 流式渲染（rAF 节流）+ 回合收尾 + 活动块路由（块出生即活动区 `#subagent-activity` 区尾——activity.js——subagentChunk 空安全守卫）
webview/panels.js    侧面板：task progress / goal + 挂起态 + 桥路由（行面板已撤——簿记 map 已删——handleSubagentMessage 纯转发——活动块生命周期在 activity.js）
webview/activity.js   编排层（ACTIVITY-REWRITE-SIMPLE 重写——B1 流尾形态已由活动区回归取代）：ensureBlock（出生 append 活动区 `#subagent-activity` 区尾——终态幂等守卫返 null）+ applySubagentStatus 三态机（queued ⏳ 头含取消 ⏹/started 翻 running/其余 status 一律终态折叠——非出生消息 lookup-only 绝不建块（终态补桩例外——§5.3「终态必现」）——settled ⇒ awaitingDigest 驻留（回收 done 才归档））+ freeze 原地折叠 + resetActivity + freezeLiveBlocks——导出消费面 panels/chat/streaming（noteChunk 经此 re-export）——`../docs/vsc/design/WEBVIEW.md` §5.1
webview/activity-view.js   呈现叶（refreshBlock/updateStopButton/noteChunk——块头/状态词/⏹——区显隐/pin/ticker/awaiting 词删）——leaf（i18n only——不依赖核心）——`../docs/vsc/design/WEBVIEW.md` §5.2
webview/activity-new.js    未钉底期新块出生未读计数钮（建/更/删 + 点击回底 + resetActivity 同清——`../docs/vsc/design/WEBVIEW.md` §5.5 D-W27）
webview/activity-diag.js   诊断痕迹面（七 kind + 环载体 SUB_TRACE_MAX=50 + `panelDiag` 批内合并上行——`../docs/vsc/design/WEBVIEW.md` §5.3 D-W22；2026-09-19 批自 activity.js/state.js 迁出）
webview/ui.js        DOM helpers: welcome banner, message bubbles, tool call rendering
webview/md.js        Lightweight Markdown → HTML renderer
webview/base.css     Base styles, variables, layout
webview/chat.css     Messages, markdown, tool calls, error
webview/controls.css Input area, controls, dropdown
webview/session.css  Session bar
webview/settings.css Settings panel
webview/index.html   Webview shell (referenced by ChatPanel._html())
```

## Webview ↔ Extension Message Protocol

| Direction | Message Type | Payload |
|-----------|-------------|---------|
| webview → extension | `userMessage` | `{ text, model?, reasoning?, provider?, images? }` — `images` = base64 dataURL array of pasted images; the extension saves them to `<cwd>/.thincoder/tmp/paste-*.<ext>` (image-handler.mjs) and passes the absolute PATHS downstream — setupAgentRun appends an `[Attached images: …]` pointer to the user message and the model views them via the `read_image` tool (GitHub thincoder#3, Plan B — images never ride inline in the request) |
| webview → extension | `abort` | — |
| webview → extension | `interrupt` | `{ message }` — Ctrl+I inject: abort with an interrupt reason; the agent loop commits partial output, injects the message, and resumes the same turn on a rebuilt controller |
| webview → extension | `newSession` / `switchSession` / `deleteSession` | `{ slot }` — active list is pushed by the extension; switching mid-turn is rejected with a warning |
| webview → extension | `getAgentSettings` | — pull: extension re-reads config.json and pushes `agentSettings` (settings panel open = fresh disk state) |
| extension → webview | `agentSettings` | `{ settings }` — full agent.* snapshot (push at webviewReady / after saves; reply to `getAgentSettings`) |
| webview → extension | `selectModel` / `selectReasoning` | `{ model, provider? }` / `{ reasoning }` |
| webview → extension | `setAdvisorGuard` / `setEngineeringEnabled` | `{ value }` — toolbar quick switches (GUARD / ENG buttons), persisted to config.json `agent.advisor.guard` / `agent.engineering` (guard = require advisor review after code changes; advisor reviews themselves are always available) |
| extension → webview | `token` | `{ text }` |
| extension → webview | `reasoning` | `{ text }` (model's thinking process, shown in collapsible block) |
| extension → webview | `turnBreak` | — (machine-only sub-turn boundary: advisor/verify/pending-task guard pushback → the webview resets its block pointers so the next reasoning/content starts a fresh block; covers non-thinking models) |
| extension → webview | `toolCall` / `toolResult` | `{ name, args? / text }` |
| extension → webview | `complete` / `loading` / `aborted` / `error` | `{ text? }` |
| extension → webview | `providerInfo` | `{ text, keyOk, needsSetup?, settings? }` |
| extension → webview | `autoApprove` | `{ value }` (session-level AUTO state, pushed on session load and on approve-all) |
| extension → webview | `models` | `[{ id, label, provider, group, reasoning[] }]` |
| extension → webview | `sessions` | `{ sessions: [{ name, title, count, active, updated }], active }` |
| extension → webview | `historyPage` | `{ messages: [{ kind, text, name?, timestamp, idx }], hasOlder, older }` — lazy history: first paint sends the LAST page (`older=false`); scroll-back pages come via `loadOlder` (`older=true`, prepended with scroll compensation). Restored assistant messages are FRAME containers: `{ kind, text, reasoning?, turnStart, tools: [{ id, name, args, result }] }` — nested finished tool cards (SESSION-RESTORE-PARITY); a `tool`-kind message is a true-orphan fallback card only |
| webview → extension | `loadOlder` | `{ before }` — `before` = earliest rendered global idx (from `data-idx`), the older page ends just before it |
| extension → webview | `question` | `{ question, options, promptId }` — inline question-tool card (option buttons or free-text input + submit/cancel), NOT a native VS Code popup; card carries a host-generated monotonic `promptId` — `questionResponse` matches by it (C1, WEBVIEW.md §8) |
| webview → extension | `questionResponse` | `{ answer, promptId }` — null = cancelled → tool returns "(user cancelled)"; host resolves the queue entry BY promptId (never an unconditional head shift — C1, see WEBVIEW.md §8) |
| extension → webview | `questionCancelled` | `{ promptId }` — an unanswered question card was released by abort/Stop; the webview removes the matching card (C1, see WEBVIEW.md §8) |
| extension → webview | `turnState` | `{ state, counts? }` — single busy-state broadcast: `state` ∈ `idle`/`running`/`susp`; `counts` = `{ running, queued, pending, done }` background-pool numbers riding the susp publishes (C2 — authoritative prose in WEBVIEW.md §8, mirrored here without duplication) |
| extension → webview | `userMessage` | `{ text }` (history replay; also the quick-input `sendMessage` command echo) |
| extension → webview | `clearMessages` | — |

## Agent Lifecycle

1. User sends message → `ChatPanel._chat()` called
2. Abort previous run via `AbortController`
3. Append user message to persisted history
4. Call `runAgent(provider, cwd, text, callbacks, signal, autoApprove)`
5. Agent loop runs (tool execution with parallel batching, context compaction, subagent spawning)
6. Each token → `onToken` callback → webview `token` message
7. Reasoning tokens → `onReasoning` callback → webview `reasoning` message (collapsible "Thinking..." block)
8. Tool calls/results → `onToolCall`/`onToolResult` callbacks → webview messages
9. On complete → append assistant message to history, trigger title generation if first exchange
10. On abort → send `aborted` to webview
11. On error → send `error` with provider/model context

## Testing

- **Smoke test**: `node test/smoke-provider.mjs <provider> <api-key>` — directly tests an API provider (single turn, no tools).
- **Unit tests** (`npm test`): explicit file list in `test/files.mjs`（清单单一来源——逐档登记 + 行内注释记覆盖面；基线（as-of 2026-09-15）≈ **553 例**——实跑 553/518 pass/0 fail/35 skip）covering the agent loop, dual-line history, tool routing, config, advisor convergence protocol (fresh sessions, citations verification, escapeLiteralEscapes), provider panels, the permission gate, live autoApprove semantics (mid-turn flip stops repeated prompts), lazy history pagination (global idx anchors, scroll-back chaining), the inline question tool (panel callback preferred over native popups, subagent questions routed to the same panel callback), the webview diff renderer (every permission-prompt diff preview), context-utilization math (divides by the REAL spec context — the old `contextWindow` field read fell back to 128K and showed 137% on 1M models), provider parity constants (FETCH_TIMEOUT_MS = 10 min), SSRF guards (proxy URL validation, redirect allowlist), websearch (Bing fallback, Tavily structured API), abort end-to-end (bash process-tree kill, AbortError propagation out of tool batches, SSE stream interruption), the in-conversation search bar (Ctrl+F highlight/jump/clear, plus input-history ↑/↓ boundary behavior), and the paste-image pipeline (webview alias regression, dataURL→tmp-file save, `[Attached images:]` pointer injection, non-multimodal guard, panel-messages wiring).
- **Full suite**: `npm test` — the single entry: unit + integration + slow all run in one go (no separate fast/full/integration scripts).
- **Integration set**: business-voice scenarios asserting observable results — they run inside `npm test` (`test/integration/` + its manifest `test/integration/files.mjs`, driven by the unified runner `test/run.mjs`).
- **Release gate**: `vscode:prepublish` = `npm run lint && npm test` (runs automatically on `vsce package` / bare `vsce publish`).
- **Doc check (not a gate step)**: `npm run doc:check` — repo-root domain; same command as the CI docs job.
- **Packaging assertion**: `postpackage` = `node scripts/check-vsix.mjs` (runs automatically after `npm run package`) — unpacks the produced vsix and asserts the embedded core + version literal equality + prompt-face completeness (`prompts/` 15 + `tool-docs/` 24 — names + sha256); fail-closed (a core-less vsix exits 1, though vsce itself exits 0).
- After modifying agent loop or tools: test with a simple file operation (read + write) and a multi-turn conversation.
