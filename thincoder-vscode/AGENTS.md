# AGENTS.md — ThinCoder VS Code Extension Guide

## Project Overview

VS Code extension wrapping the ThinCoder AI coding agent. Provides a side-panel chat UI with full agent capabilities — multi-turn tool-calling loop, subagents, plan mode, task tracking — all inside the editor. Zero npm runtime dependencies (pure Node.js standard library + VS Code API).

Design docs in `docs/design/`. Independent product — no dependency on thincoder CLI.

## Hard Constraints

- **Zero npm runtime dependencies**: only `node:` standard library and VS Code Extension API (`vscode` module). No TypeScript, no build/bundling step.
- ESM (`.mjs`) throughout — `package.json` declares `"type": "module"`.
- LLM calls go through native `fetch` with SSE streaming, same as thincoder core.
- Tool implementations are adapted for VS Code context (workspace root = cwd; no directory restriction on tools since 2026-09-02 — paths resolve relative to cwd, approval gate is the guard).
- **镜像提示词约定（本产品双源——2026-09-13 修订）**：本产品提示词 = **产品内双源**：`docs/design/prompts/*.md`（中文权威模板——内容权威 / 内容维护位）↔ `src/prompts/*.md`（运行期落地物——加载与发布面）。变更流 = 改中文模板 → 内容把关 → 落地回填（手抄 / 译写——无同步脚本）；双源语义同源、原文自持——落地质量由内容把关 + 设计评审守（非机械比对）。


## Key Conventions

- **Entry point**: `extension.mjs` — `activate()` registers commands and sets up the ChatPanel.
- **Webview separation**: the chat UI (`webview/`) runs in an isolated iframe, communicating with the extension host via `postMessage`. No shared state between extension and webview beyond the message protocol.
- **Session persistence**: **shared with the CLI** — same on-disk format and location (`~/.thincoder/sessions/`). Sessions are numbered slots `session.json.N` plus a `session.json.manifest` (slot metadata + active pointer + sessionId). The cwd hash is the **full 40-char `sha1(normalizeCwd(cwd))`, not truncated**, where normalizeCwd **uppercases the Windows drive letter** (`d:\…` → `D:\…`) — `uri.fsPath` lowercases it, which would otherwise produce a different hash than the CLI's `process.cwd()`. Legacy 12-char-hash files are renamed to the full hash on first access. Both ends read/write the same files, so a session created in the CLI appears in VS Code and vice versa. Titles (`title` field) are auto-generated from the first user message on both ends. The legacy `messages/` directory + base64 names + Memento index are abandoned (pre-release, no migration). **End separation (§10, 2026-09-05)**: each end's own resume target = its own end-marker file `{manifest}.vscode` (CLI writes `.cli`, never touched by the other end) — panel open resolves via `resumeSlot` (record → one-time inherit of a dead-owner `manifest.active` when no record → fresh allocate); `manifest.active` stays the shared pointer for old-version/ACP semantics and list fallback highlighting only.
- **Provider config**: shared with the CLI — both ends read/write `~/.thincoder/config.json` — MODEL-MERGE-SESSION schema: `providers[]` carry `models[]` candidate lists (per-channel `model` retired), top-level `defaultModel` ("provider:model" composite) is the new-session starting point, and the old `activeProvider`/`activeModel` config keys are gone (legacy shapes migrate on read — config-migrate.mjs, write-back failures never block). Session model selection is session-scoped: `/model` (CLI) and the model dropdown (VSC) write the session slot's `activeProvider`/`activeModel` double fields, never config. Preset table mirrors the CLI `PROVIDER_PRESETS`. Legacy VS Code storage (`thincoder.providers` settings + SecretStorage) is migrated once on activation, then cleared.
- **Tool approval**: session-level `autoApprove` slot field (shared with the CLI), not a VS Code setting. Defaults to `false` — the model runs in permission mode and the webview prompts per file-modifying tool. The AUTO toolbar button or a prompt's "Approve All" flips it; the flag is read LIVE by the agent loop (getter, CLI parity), so a mid-turn flip stops the remaining prompts of the same turn immediately. No `thincoder.autoApprove` setting exists — the panel button is the only switch.
- **No legacy migration code**: project is pre-release — breaking changes are expected. When storage format changes, just change it. Migration boilerplate becomes dead code instantly.
- **Model specs**: self-contained `src/config.mjs` with MODEL_SPECS table. No runtime dependency on any external product.
- **Editor dual channel**: file tools edit open documents via WorkspaceEdit (undo-integrated) and **save immediately after applying** (`applyEditorEdit`/`applyEditorRangeEdit` in tools/shared.mjs) — applying without saving leaves the buffer dirty while the disk stays stale, which self-locks the next edit on the isDirty guard and races external writers (split-brain data loss, 2026-08-13 incident).
- **isDirty refusal is a stop sign, not a detour**: when a file tool returns "File has unsaved changes in the editor", the agent MUST stop and ask the user to save/discard — never route around via execute/bash/direct fs writes. The guard exists precisely because the agent's own writes and the user's buffer would otherwise silently clobber each other.
- **Lazy history loading**: long sessions never load eagerly. `_loadSession` sends only the LAST page (`historyWindow(history, null)` in history-window.mjs, page size 200 — `HISTORY_PAGE_SIZE`, first-window CLI parity; `idx` = GLOBAL history indexes); the webview requests older pages via `loadOlder` when scrolled near the top (guard: `_hasOlder` + `_loadingOlder`). Older pages are prepended before the earliest `.message/.tool-call` with scroll-position compensation (scrollHeight delta). Restored assistant frames are ONE `.message.assistant` carrying nested tool cards (SESSION-RESTORE-PARITY); the `before` anchor comes from the webview's minimum rendered `data-idx` — only outer messages carry one — live streaming messages carry no idx, so they can never corrupt the window (a completed turn that lands on disk does NOT duplicate: pages always end before `before`).
- **Error surfacing**: `isNonRetryableError` in provider.mjs detects billing/param errors across all provider formats and fails immediately (no retry). `readSSE` detects non-SSE responses (API errors returned as JSON) and extracts error messages.
- **Provider-specific thinking values**: not all providers accept `thinking.type: "enabled"`. MiniMax requires `"adaptive"`. The `thinkEnabledValue` spec field maps the generic `"enabled"` UI toggle to the correct provider value.
- **Discussion → docs**: design decisions, architecture choices, and naming conventions discussed in chat don't exist until they're in a doc file. After any design discussion, write the conclusions to the relevant document immediately — not "later". Chat context compresses; docs persist.
- **Dogfooding feedback (must report)**: using thincoder to build *other* projects (e.g. thinworker) is itself a deep test of thincoder. When you find a thincoder bug, an unusable/awkward tool, or a workflow defect during such work, **report it proactively** — never silently work around it or fix-and-forget. Report routing: **functional bug / tool doesn't fit** → open a Gitee issue (thincoder or thincoder-vscode repo, label `bug`/`feature`; write mode via `thincoder-issues/check-gitee-issues.mjs`, needs `GITEE_TOKEN` env var); **doc flaw / minor polish** → thincoder `docs/TODO.md`. Fixing the bug then follows thincoder's own engineering flow (design doc → review → eng-coder → release).
- **Checkpoint 事故恢复（快照机制）**：与 CLI 完全一致——权威文档 `thincoder/docs/design/CHECKPOINT.md`（本端引用不复制）。要点：① 快照时机 = git 工具破坏性操作前自动快照（checkout 还原文件 / restore / reset --hard / stash pop / branch|tag delete / clean / rebase）+ bash guard（`gitGuardSnapshot` 宽匹配，先快照后放行）+ 手动 `checkpointAction=create`；② 恢复 = `checkpointAction=list` → `cat` → `rewind checkpointId=<id> path=<文件>`；③ 快照是"操作前状态"而非"良好状态"备份（编码损坏内容 cat 作重建参照）；④ commit 成功后该项目 checkpoint 清空（commit = 新安全基线）；⑤ 存储 = `~/.thincoder/checkpoints/{cwdHash12}/`（cwdHash12 = `sha1(normalizeCwd(cwd)).slice(0,12)`，盘符大写归一化——与 CLI 同目录同格式，快照跨端互通；镜像实现 `src/tools/checkpoint.mjs`）；⑥ **存量 stash 快照不迁移**（不再支持工具 rewind，用户可手动 `git stash drop`）。**git 操作一律走 git 工具**（含 clean/rebase 等破坏性操作）——违反即视为纪律违规；bash guard 仅为纪律漏网兜底。

```
extension.mjs        Extension entry — 注册 ChatPanel（类已迁 src/extension/chat-panel.mjs）为 WebviewViewProvider + commands/status bar（session CRUD/设置/标题生成/CSP 注入随类迁移）
src/agent.mjs         Agent main loop — parallel tool batching, multimodal image injection, context compaction, subagent spawning, reasoningEcho
src/agent-tools.mjs   Re-export shim → src/agent-tools/ (task, subagent, plan, goal, skill, verify, read_history)
src/agent-tools/subagent-actions.mjs  status/cancel action executors（§19.8 2026-09-06：action:'check' 删除——subagentCheck/MAX_ASYNC_CHECKS/F1 pool-waiter loop 退役——结果仅自动通道；2026-09-05 module split）
src/agent-tools/subagent-async.mjs  async/audit machinery (gateEngCoderSpawn/auditTaskBook/shouldAutoResume/spawnAsyncSubagent/settleAsyncEntry/injectAsyncResult/collectSettledAsync/mergeChildMutations + F2 interrupt chain filter + interrupt-settle 豁免（2026-09-05 module split——行数随维护漂移不记档）
src/agent-tools/subagent-scheduler.mjs  §20 scheduler + file-domain machinery (pool/tombstone/conflict/dep/refill/stall/queueRunnable — 2026-09-05 module split)
src/agent-tools/read-history-discovery.mjs  read_history discovery-face leaf（READ-HISTORY-SPLIT 新——listCwdSessions + 私有助手 slotMeta/tidyCwd/sha1hex verbatim 自 read-history.mjs——零行为改）——依赖核 node:fs/node:crypto/node:path + session-io.mjs（无核心私有引用）——仅 read-history.mjs 内部 import（0 外部消费者——不 re-export）
src/agent-tools/batch-segment.mjs  批次档段写入工具（第 5 批 VSC 镜像 · ENGINEERING-MODE.md §2.20/§2.22.5——无 path 参数/段白名单按身份 designer§2·评审§3·coder§5/append-only/来源戳仅 §3/凭证剥除）+ resolveBatchDocPath（评审侧「若传则须可读」）
src/tools.mjs         Re-export shim → src/tools/ (file ops, bash, glob, grep, git, web, checkpoint, read_image)
src/tools/checkpoint.mjs  Checkpoint 快照全量副本（CLI src/git/checkpoint.mjs 镜像，CHECKPOINT.md F5 存储统一）
src/tools/git-ext.mjs / git-checkpoint.mjs  git 工具 F7 扩展 action（clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv）+ checkpoint 子系统（500 行拆分，CLI 镜像）
src/mcp.mjs           Re-export shim → src/mcp/ (stdio/http transport, MCP client)
src/provider.mjs      LLM provider (fetch + SSE, non-retryable error detection, rate-limit retry) + re-exports rate gate
src/provider/rate.mjs TPM rate limiting gate
src/log.mjs           Diagnostic event log（LOGGING.md——CLI src/log.mjs 同构：logEvent/轮转/黑名单；共享 ~/.thincoder/logs/ 同格式同事件面）
src/memory.mjs        Long-term memory (file-based Markdown entries + frontmatter, CLI entry-format compatible; vector semantic search when an embedding key is configured, keyword fallback — no FTS5)
src/repomap.mjs       Repository dependency graph parsing
src/config.mjs        Model capability specs (context, thinkApi, thinkEnabledValue, noUsageStream, temp ranges)
src/specs.mjs         Re-export from config.mjs (backward compat)
src/extension/        ChatPanel 分解模块（chat-panel.mjs 类本体 + panel-chat/panel-messages/panel-session/panel-project/panel-mcp/panel-index/panel-toolpanel/panel-callbacks 等载荷分模块 + session-io/session-slots/settings/presets）
src/prompts/          System prompts (槽位化：persona-engineering / persona-normal / persona-{eng-coder,explore,coder,plan} + common + discipline-engineering / discipline-normal + 特殊模块 consult-base / advisor-design / advisor-round{1,2,3}——装配链 [1]人格 → [2]公共 → [3]纪律 → [4]项目 AGENTS+skills；旧 system/engineering/engineering-sub/main/discipline/methodology-template 已退役——PROMPT-SYSTEM.md)
webview/chat.js      Frontend orchestration: message handling, model selector, session history
webview/state.js     UI 状态单一持有（S + DOM ctx + vscode——全模块共享同一运行时对象——WEBVIEW.md）
webview/streaming.js  token/reasoning 流式渲染（rAF 节流）+ 回合收尾 + advisor review 块 + 活动块路由（块出生即 #messages 流尾——activity.js——subagentChunk 空安全守卫）
webview/panels.js    侧面板：task progress / goal + 挂起态 + 桥路由（行面板已撤——簿记 map 已删——handleSubagentMessage 纯转发——活动块生命周期在 activity.js）
webview/activity.js   编排层（ACTIVITY-REWRITE-SIMPLE 重写——B1 流尾形态）：ensureBlock（append #messages 流尾——终态幂等守卫返 null）+ applySubagentStatus 三态机（queued ⏳ 头含取消 ⏹/started 翻 running/其余 status 一律终态折叠——lookup-only 绝不建块——settled 视同 done）+ freeze 原地折叠 + resetActivity + freezeLiveBlocks——导出消费面 panels/chat/streaming（noteChunk 经此 re-export）
webview/activity-view.js   呈现叶（refreshBlock/updateStopButton/noteChunk——块头/状态词/⏹——区显隐/pin/ticker/awaiting 词删）——leaf（i18n only——不依赖核心）
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
| extension → webview | `userMessage` / `assistantMessage` | `{ text }` (history replay — retained for the quick-input `sendMessage` command echo) |
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
- **Unit tests** (`npm test`, fast layer): explicit file list in `test/files.mjs` (agent-core/checklist/compaction/distill/eng-delivery/file-tools/git/prompts/subagent-async/subagent-scheduler/subagent-tool/vscode-tools + the rest, post-§18.14 domain split) — 1060+ tests covering the agent loop, dual-line history, tool routing, config, advisor convergence protocol (fresh sessions, citations verification, escapeLiteralEscapes), provider panels, the permission gate, live autoApprove semantics (mid-turn flip stops repeated prompts), lazy history pagination (global idx anchors, scroll-back chaining), the inline question tool (panel callback preferred over native popups, subagent questions routed to the same panel callback), the webview diff renderer (every permission-prompt diff preview), context-utilization math (divides by the REAL spec context — the old `contextWindow` field read fell back to 128K and showed 137% on 1M models), provider parity constants (FETCH_TIMEOUT_MS = 10 min), SSRF guards (proxy URL validation, redirect allowlist), websearch (Bing fallback, Tavily structured API), abort end-to-end (bash process-tree kill, AbortError propagation out of tool batches, SSE stream interruption), the in-conversation search bar (Ctrl+F highlight/jump/clear, plus input-history ↑/↓ boundary behavior), and the paste-image pipeline (webview alias regression, dataURL→tmp-file save, `[Attached images:]` pointer injection, non-multimodal guard, panel-messages wiring).
- **Full suite**: `npm run test:full` — the same list with slow-registered tests released (`slow()` gate).
- **Integration tests**: `npm run test:integration` — the ②③ integration set (`test/integration/` + explicit manifest `test/integration/files.mjs`, runner `test/run-integration.mjs`): business-voice scenarios asserting observable results; no `slow()` inside; the release gate's fourth ring. Design authority: `docs/design/TESTING.md`.
- **Release gate**: `vscode:prepublish` = `npm run lint && npm run doc:check && npm run test:full && npm run test:integration` (runs automatically on `vsce package` / bare `vsce publish`).
- After modifying agent loop or tools: test with a simple file operation (read + write) and a multi-turn conversation.
