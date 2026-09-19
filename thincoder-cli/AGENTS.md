# AGENTS.md — ThinCoder Project Guide

## Project Overview

Zero-dependency AI coding CLI: pure Node.js >= 24 standard library, no build step, ESM (`.mjs`).
LLMs via OpenAI-compatible protocol, flagship models from DeepSeek / Kimi / GLM / Qwen / MiniMax.

## Requirements & Design Docs (the doc map)

**需求基线**：需求层 `docs/requirements/` + 设计层 `docs/design/`（均 **eng-designer 产物**——写稿权唯一；需求讨论/登记在会话面）+ 用户对话。需求与设计**分目录**（2026-09-10 文档重组批——规范见 `docs/README.md`）——存量需求内容仍在各设计档内，拆分按**新老划断**（碰到哪迁哪）；评审/开发时以两层文档 + 对话背景为参照。

文档分两层：需求 `docs/requirements/`、设计+测试 `docs/design/`（规范与地图见 `docs/README.md`）。主流程：[`PHILOSOPHY.md`](docs/requirements/PHILOSOPHY.md)（三观）→ prompts（`src/prompts/` 人格/公共/纪律三层提示词——项目方法论骨干已入纪律层槽位文件，无独立 METHODOLOGY 注入体）。其余文档按主题分粗类：架构与模块 / 评审与工程模式 / 多模型协作 / 上下文管理 / TUI 与客户端 / 需求与规划 / 参考分析。

**逐档权威地图 = [`docs/README.md`](docs/README.md)**（板块 → 文档映射 + 归档标注 + 归属规则）——AGENTS.md 不逐档裸列（2026-09-08 结构债批 5：曾 28 档裸名清单与 README 地图重复 = 双源漂移——8 档归档后悬空随删消解）——写/改文档前先查地图。

## Hard Constraints

- **Zero npm runtime dependencies**: only `node:` standard library (storage via `node:sqlite`, TUI via bare ANSI). For new features, first ask whether the standard library can do it; if not, raise for discussion.
- No TypeScript, no build/bundling step.
- Every change must be verified by running it — no "written but never run" code.
- **提示词双面（2026-09-17 消端差收正）**：本产品提示词 = `docs/core/design/prompts/*.md`（仓根中文正本——**中文审核面**——内容权威）→ 翻译生成 `thincoder-core/prompts/*.md`（**英文运行面**——国外模型运行用；生成 = 翻译，不是 cp）。提示词面**无端差注入锚**（已全消——正文自足、文档地图统一 `docs/README.md`）；仅工具面 2 锚（bash/question 端差异）保留至工具面 review。
- **改动面反查（工程工具约定）**：实施轮开工前跑本仓反查脚本 `scripts/doc-impact.mjs`（文档影响面；基准 = 上一批收口点）——其输出的设计/需求档建议一并录入本批「受影响文件」表。

## Key Conventions

- **Reminder format**: all system reminders use `role: "user"`, `[System reminder: ...]` prefix and must not be mentioned in replies. External/user text injected into reminders must be XML-escaped in `<untrusted_*>` tags.
- **Prefix caching**: the system prompt must be byte-stable across runs — per-turn varying content goes in user messages, not the system prompt.
- **Thinking echo**: `reasoning_content` in assistant tool_calls messages depends on the model's `reasoningEcho` spec field.
- **Commit messages**: `type: summary` (feat / fix / release / docs), single English line.
- **Commit & push promptly**: commit at each batch closeout (path-scoped); push immediately after committing — the remote is the only disaster backup; push before any destructive git operation.
- **Release flow**（权威 `docs/design/RELEASE.md`——发布 = 唯一门禁）：bump（待发号 = registry 最高 + 1——发布时才 bump 不预占）→ 手动改 `package.json` version + `CHANGELOG.md` → `git add/commit` → `git tag vX.Y.Z` → push origin **+ github 双远端**（分支 + tag 都推——github 被墙走代理，RELEASE.md §5.2）→ **`npm publish` 放最后**（`prepublishOnly` 自动跑 lint + test:full + test:integration 单轮 = 唯一门禁——不再手动分轮）。Manual smoke pass before release. **Versioning (CalVer, 2026-08-27)** — see `docs/design/RELEASE.md` §4.6: `年份.月份.月内计数`, month counter resets each month; CLI stays on `0.12.x` through 2026 then switches to `1.1.0` on 2027-01; never bump below the published version (npm/vsce reject downgrades).
- **Discussion → docs**: design decisions, architecture choices, and naming conventions discussed in chat don't exist until they're in a doc file. After any design discussion, write the conclusions to the relevant document immediately — not "later". Chat context compresses; docs persist.
- **Doc references use symbols, not line numbers**: design docs anchor code references to symbol/export names (e.g. `routeSubToken` in `subagent-blocks.mjs`), never line numbers — line numbers rot on every edit, symbols are grep-able. Historical change-log entries keep their as-of snapshot.
- **File size**: single `.mjs` / `.js` source file exceeding 300 lines → advisory (🟡): suggest splitting. Exceeding 500 lines → blocking (🔴): must split before merge.
- **Testing policy**: three execution faces. `npm test` = fast layer — fs/git-subprocess/timer/network-heavy tests are `slow()`-gated (auto-skip, runner output shows them; ~20s as of 2026-09-06 归册后——防漏拦截：未归册超阈用例硬红，机制见 `test/slow-gate.mjs`/`run-fast.mjs`——TESTING.md §1). `npm run test:full` (env `THINCODER_TEST_FULL=1`) runs everything — required before release, and after touching session/checkpoint/memory/git-index areas. `npm run test:integration` = 集成集（业务验收场景 — `test/integration/*.test.mjs`，TESTING.md §3–§5）— NOT part of either layer (fast/full globs are single-level `test/*.test.mjs`): it runs in the release gate (`release:check` 第三步) and manually; integration files must NOT use `slow()`. The real-endpoint smoke (`test/smoke-qwen-thinking.mjs`) is in NEITHER layer: run manually with `THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs` (it spends real API tokens). Gate mechanism: `test/slow.mjs` + `test/slow-gate.mjs`（漏网拦截——未标 slow 超阈即红）. Pure documentation updates (`*.md`, `README`, `docs/**`, `AGENTS.md`, `CHANGELOG`) do not require running tests — only commit and push.
- **Dogfooding feedback (must report)**: using thincoder to build *other* projects (e.g. thinworker) is itself a deep test of thincoder. When you find a thincoder bug, an unusable/awkward tool, or a workflow defect during such work, **report it proactively** — never silently work around it or fix-and-forget. Report routing: **functional bug / tool doesn't fit** → open a Gitee issue (thincoder or thincoder-vscode repo, label `bug`/`feature`; write mode via `thincoder-issues/check-gitee-issues.mjs`, needs `GITEE_TOKEN` env var); **doc flaw / minor polish** → thincoder `docs/TODO.md`. Fixing the bug then follows thincoder's own engineering flow (design doc → review → eng-coder → release).

## Checkpoint 事故恢复（快照机制，权威文档：docs/design/CHECKPOINT.md）

- **快照时机**（可验证触发点）：① git 工具破坏性操作前自动快照（`snapshotBefore`——checkout 还原文件 / restore / reset --hard / stash pop / branch|tag delete / clean / rebase）；② bash guard（`gitGuardSnapshot`，宽匹配 `GIT_DESTRUCTIVE_RE` 的破坏性 git 命令先快照后放行）；③ 手动 `git` 工具 `checkpointAction=create`。平台层"任务列表删除/上下文压缩前"自动快照**未在本项目代码中证实**——文档不声称。
- **恢复流程**：发现未提交改动被丢弃 → `git` 工具 `checkpointAction=list` 查快照 → `checkpointAction=cat` 确认内容 → `checkpointAction=rewind checkpointId=<id> path=<文件>` 单文件恢复（rewind 前自动快照当前状态，可逆；全量回滚被禁——与 `git checkout -- .` 同等危险）。
- **快照语义边界**：快照 = **"操作前状态"**，质量取决于操作前状态本身——编码损坏/已丢失的内容**无法直接 rewind 恢复完好原文**，但快照文件可 `cat` 读取作**重建参照**（2026-09-01 事故实证：结构/ASCII 常完好）。
- **commit 清理（F6）**：commit 成功后该项目（cwd）的全部 checkpoint 被清空（commit = 新的安全基线，git 历史 + reflog 是更强恢复手段）；checkpoint list/create 入口懒检查外部 commit（HEAD 时间 > 最新快照时间）同样清空。commit 前如需保留中间状态，先手动 `checkpointAction=create`。
- **存储**：`~/.thincoder/checkpoints/{cwdHash12}/`（cwdHash12 = `sha1(normalizeCwd(cwd)).slice(0,12)`，Windows 盘符大写归一化）——与 VS Code 端**同存储同格式**，快照跨端互通；每 cwd 上限 100 个（最旧淘汰）。
- **纪律**：**git 操作一律走 git 工具**（含 clean/rebase 等破坏性操作）——违反即视为纪律违规；bash guard 仅为纪律漏网兜底（纵深防御）。

**模块图 = 概览——权威见 [`ARCHITECTURE.md`](../docs/core/design/ARCHITECTURE.md) §3（模块地图当前态）——此处只列主要项**：
```
（机制本体 = `@thincoder/core`（agent / agent-tools / advisor / provider / tools / prompts / memory / mcp / git / traces / session / config 族）——本端只列端壳面；已删的自持镜像不再列行）
bin/thincoder.cjs    CLI entry（CJS shim——npm 12 可能拒 ESM bin，转 `bin/thincoder.mjs`）
bin/thincoder.mjs    命令分发入口（tui / chat / memory / upgrade / session gc / acp / completion）
src/tui/             bare-ANSI 终端界面 + 命令族（60+ 档：index/agent-turn/render*/key-handler/cmd-*/subagent-*/…——`docs/cli/design/TUI.md`）
src/tui.mjs          TUI re-export hub（子模块在 `src/tui/` 下）
src/cli/             CLI 顶层命令实现（setup-wizard/memory-command/distill-command/make-agent/permission——bin/thincoder.mjs 分发 import）
src/acp.mjs + src/acp/   ACP 协议桥（bridge/client-caps/ext/handlers-session/handlers-slots/login/session/transport——`thincoder acp` 入口——`docs/cli/design/ACP-CLIENT.md`）
src/completions.mjs  `thincoder completion <shell>` 补全脚本发射（bash/zsh/fish）
src/crash-reports.mjs  崩溃捕获与取证（fatal 报告 / 记录 / stderr 捕获 / 近堆快照——`docs/cli/design/CRASH-REPORTS.md`）
src/distill.mjs      会话知识候选抽取（双轨制自动轨——人确认后落盘）
src/heap-watch.mjs   堆遥测 / 看门狗（`docs/cli/design/CRASH-REPORTS.md` §8）
src/prompt-injections.mjs  工具面 2 锚 CLI 取值表（bash-terminal-face / question-ui-face）
src/upgrade.mjs      版本检查与升级工具（CLI upgrade 命令 + TUI 启动检查共用）
test/                test suite
```
