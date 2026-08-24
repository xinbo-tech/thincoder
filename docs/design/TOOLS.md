# 工具系统设计（thincoder/src/tools/ + src/agent-tools/ + src/mcp/）

> 状态：2026-08 回补。24 个内置工具 + MCP 客户端 + 元工具（agent-tools），统一 schema（OpenAI function calling）、统一上下文（cwd/agent/callbacks/signal）、统一安全边界（路径/命令/网络/沙箱）。

## 1. 注册与 schema

- **注册表**（tools/index.mjs）：`builtinTools` 数组（24 个）——file 6（read/write/edit/insert_after/hashline_edit/read_image）、patch 2（apply_patch/delete）、system 4（bash/glob/grep/ls）、web 2（websearch/fetch）、git 2（git/question）、checklist、lint、lsp、codemode、ops 3（file_ops/process/get_current_time）。
- **schema 生成**：`toOpenAISchema(tool)`（shared.mjs）——name/description/parameters 转 OpenAI function 格式；description 来自 `tools/*.md`（`DESC(name)` 机制：md 文件即描述源，带参数说明，模型看到的是完整使用手册而非一行字符串）。
- **工具契约**：`{ name, description, parameters, readonly?, sideEffectExempt?, parallel?, multimodal?, execute(args, ctx) → string }`；`ctx = { cwd, agent, depth, signal, callbacks, onOutput, onQuestion, onPermissionRequest }`。**execute 必须返回字符串**（undefined 视为错误，dispatch 显式检查）。
- **元工具**（agent-tools.mjs）：task / plan / goal / verify / subagent / skill / recent_changes / advisor / eng / timer——`readonly` 自管纪律工具；子代理按 role 过滤（explore/plan 只读，eng-coder 额外门控）。

## 2. 安全边界（shared.mjs + 各工具）

| 面 | 机制 |
|---|---|
| **路径** | `resolveInCwd(ctx, p)`（防 `../` 逃逸到工作区外）+ `assertInside` + `realpathNearest`（符号链接解算）；`resolveExternal` 显式白名单外部路径（仅 question 等特殊工具） |
| **命令**（bash） | **零文本拦截**：破坏性命令（rm -rf/DROP TABLE 等）一律放行——恶意模型可用空白变体/heredoc/node -e 绕过，文本匹配拦不住且误伤正常操作；真实防线 = 审批层 + 快照。保留：`hasFileRedirection`（禁止 bash 写文件，路由到 write/edit，引导性非安全门）、`detectDanger`（危险标注只提示不拦截：recursive-delete/sudo/pipe-to-shell/dd/mkfs/raw-device/chmod-777/fork-bomb，审批面板红标，引号感知防 commit message 误标）、git 破坏操作快照后放行（gitGuardSnapshot，永不拦截）；超时 120s |
| **网络**（websearch/fetch） | `isPrivateHost`（localhost/内网/云元数据 169.254.169.254）——SSRF 防护；响应体 ≤5MB；HTML 转文本（stripTags/htmlToText） |
| **文件** | `MAX_READ_LINES=2000`、`MAX_OUTPUT_CHARS=200_000`（超限落盘，模型见预览）；`normalizeEOL`（CRLF 统一）；write 前 `autoSyntaxCheck`（JS 文件自动 node --check 预检） |
| **lint** | `node --check` fast path + eslint 级联（flat config 检测）——取代旧 syntax_check |
| **lsp** | 按需 spawn LSP server（`process.execPath` 直跑，无 shell），语义级诊断/跳转兜底 |

**execute 工具（沙箱）**：`import()` 动态加载被阻断（防沙箱逃逸）、`require()`/`process` 访问被禁、超时强杀——代码执行只出不进（模型在隔离环境跑用户代码）。

## 3. 调度与权限（见 AGENT-LOOP.md §4）

- **两段式**：Phase 1 预审（planMode/工程门/权限/hooks）→ Phase 2 顺序保序执行（只读并行、副作用串行）
- **readonly/parallel 标记**：readonly = 无副作用可并行；`parallel: true` = 显式声明可并行（如 grep/glob）；sideEffectExempt = 有副作用但豁免于"失效 advisor/verify"追踪（subagent）
- **undo 快照**：副作用工具执行前 `snapshotForUndo`（写前文件内容入内存栈），`/undo` 回滚
- **hooks**（PreToolUse/PostToolUse/PostToolUseFailure）：用户脚本可在 `~/.thincoder/hooks/` 定义门控/后处理（PreToolUse 返回 false 阻断执行）

## 4. MCP 客户端（mcp.mjs + mcp/）

- **三种 transport**：stdio（`mcp/transport-stdio.mjs`，spawn 子进程 JSON-RPC over stdio）、http、ws（`transport-http/ws.mjs`，零依赖 fetch/WebSocket）
- **生命周期**：`connectMcpServer` → 握手（initialize/listTools）→ 工具并入注册表（`mcp` 前缀包装成 OpenAI schema）→ 退出 `closeAllMcp`（TUI cleanup 防孤儿进程）
- **管理**：`/mcp` 命令（connect/disconnect/list/status）；MCP 工具名冲突去重；连接失败注入提醒（启动时 stderr 不可见场景）
- 工具执行透传：`mcp` 工具 execute → JSON-RPC `tools/call`；stdout/stderr 流式 onOutput

## 5. 关键设计决策

| 决策 | 理由 |
|---|---|
| md 文件即 description | 长文档描述模型才理解边界；与代码分离便于迭代不触发 schema 变更 |
| bash 命令零文本拦截 | 文本匹配是安全剧场：恶意模型必然绕过（空白/heredoc/node -e），拦住的只有正常操作；真实防线 = 审批层（autoApprove）+ 快照（gitGuardSnapshot/checkpoint）。危险标注（detectDanger）只给人看，不构成边界 |
| 超限落盘而非截断 | 模型可再用 read 工具读全量；预览 2K 字符足够决策 |
| 沙箱只出不进 | 模型执行用户代码时，网络/文件系统读写按工具授权而非代码内自由 |
| 工具全部字符串返回 | schema 简单、dispatch 统一、流式展示统一 |

## 6. git 工具能力扩充（2026-08-23）

**需求**（用户观察「git 操作还在走 bash」+ 拍板「最全」）：git 操作模型常走 bash 而非 git 工具。三层缺口——能力（工具做不到带参/分文件操作）、描述（git.md 无反向路由）、提示词（main.md 无路由条款）。

**设计**：扩充 `git` 工具的 action 集，把日常 git 操作收敛进工具（bash 反向路由 + main.md 条款）。

**新增 action**（两端一致）：

| 组 | action | 说明 | 破坏性 |
|---|---|---|---|
| 暂存 | `add` | 分文件暂存；`path` 可选（不给则 `-A`）；`commit` 加 `path`（只暂存这些） | — |
| 发布 | `push` | 加 `remote` / `branch` / `tags` 参数 | outward |
| 标签 | `tag`（`tagAction` list/create/delete） | tag 创建/列举/删除 | delete 需确认 |
| 分支 | `branch`（`branchAction` list/create/delete/switch） | 分支管理 | delete 需确认 |
| 切换/还原 | `checkout` | 切到分支/ref（`ref`）或还原文件（`path`） | path 还原需确认 |
| 还原 | `restore` | 从 index/HEAD 还原文件（`path`，`staged?`） | 需确认 |
| 暂存栈 | `stash`（`stashAction` push/pop/list） | stash 管理 | pop 需确认 |
| 同步 | `fetch` / `pull`（`remote`/`branch` 可选） | 拉取远端 | outward |
| 回退 | `reset`（`mode` soft/mixed/hard） | 重置到 ref | hard 先 snapshot + 确认 |
| 撤销 | `revert` | revert 一个 commit（安全撤销） | — |
| 合并 | `merge` | 合并分支/ref（冲突如实上报） | — |
| 摘樱桃 | `cherry-pick` | cherry-pick 一个 commit（`ref`） | — |

**反向路由**（git.md 描述）：加 `**Route to git instead of bash:**` 段 + 逐条 bash→工具映射。

**提示词条款**（discipline.md）：加「git 操作用 git 工具、不要用 bash」的 Tool routing 条款（标准模式纪律，两端 byte-identical；git 路由属编码纪律、放 discipline.md 而非协调职责的 main.md）。

**破坏性原则**（沿用「破坏性操作 snapshot-then-proceed」）：reset --hard / checkout 丢改动 / rm 等先快照再执行 + 用户确认。CLI 用 `createCheckpoint`（全量复制，非破坏）；VS Code 用 `git stash create`+`git stash store`（非破坏，与 `git stash push` 清工作区不同）。**顺带修复的既有 bug**：`runGit` 对整段输出 `.trim()` 会剥掉 porcelain 首行的「 」（unstaged 标记），把 unstaged 误分类成 staged——status 改用保行前导空格的 `runGitRaw`。

**测试**（两端各验）：每个新 action 的成功路径 + 参数校验 + 破坏性快照触发；反向路由断言（git.md 含 Route to git、discipline.md 含条款）；全量回归不降。

**受影响文件**：CLI `src/tools/git.mjs` + `src/tools/git.md` + `src/prompts/discipline.md`、VS Code `src/tools/git.mjs` + `src/prompts/discipline.md`、两端测试、`CHANGELOG.md`。

---

## 7. 工具「真覆盖」：workdir + scriptFile + 全工具路由（2026-08-23）

**需求**（用户问「git 工具有 workdir/filter 吗」「为什么 JS 还走 bash 不走 execute」，并要求按会话历史 bash 调用做真覆盖分析）：bash 调用可归三类——能力缺口（工具做不到被迫 bash）、路由缺口（工具做得到但习惯 bash）、合理 bash（npm/CLI/服务器）。逐项补齐。

**设计**：

| 缺口 | 补法 | 落点 |
|---|---|---|
| git 无 `workdir`（子目录/多 repo） | 加 `workdir` 参数（`ctx = {...ctx, cwd: resolveBaseDir(ctx.cwd, workdir)}` 遮蔽，isInside 校验防逃逸） | 两端 `git.mjs` |
| execute 只能 inline（`node <script>` 被迫 bash） | 加 `scriptFile`（跑 workspace `.mjs`/`.js`，子进程、无 prelude）+ `nodeArgs`（禁 `--eval`/`--inspect` 类）；`runNodeEval` 重构为接 args 的 `runNode` | 两端 `codemode.mjs`/`execute.mjs` + `execute.md` |
| grep/ls/delete/read 无反向路由 | 描述补「Route to X instead of bash」 | 两端描述 |
| 提示词路由零散 | discipline.md「Tool routing」扩为全工具路由总表（git/execute/读写搜/进程 + bash 适用边界） | 两端 discipline.md（byte-identical） |

**测试**（两端各验）：git workdir（子仓库运行 + 越界报错）；execute scriptFile（跑文件 + nodeArgs `--check` 好/坏语法 + 越界 + 缺参 + 禁 flag）；全量回归不降。注：测试里不断言 `node --test` 输出——嵌套 node --test（测试套件内再跑）输出为空属测试环境伪影，真实场景正常。

**受影响文件**：CLI `src/tools/git.mjs` + `git.md` + `codemode.mjs` + `execute.md` + `grep.md`/`ls.md`/`delete.md`/`read.md` + `src/prompts/discipline.md`、VS Code 对应（git.mjs / execute.mjs / search.mjs / more-file.mjs / file.mjs / discipline.md）、两端测试。
