# 工具系统设计（thincoder/src/tools/ + src/agent-tools/ + src/mcp/）

> 状态：2026-08 回补。24 个内置工具 + MCP 客户端 + 元工具（agent-tools），统一 schema（OpenAI function calling）、统一上下文（cwd/agent/callbacks/signal）、统一安全边界（路径/命令/网络/沙箱）。

## 1. 注册与 schema

- **注册表**（tools/index.mjs）：`builtinTools` 数组（24 个）——file 6（read/write/edit/insert_after/hashline_edit/read_image）、patch 2（apply_patch/delete）、system 4（bash/glob/grep/ls）、web 2（websearch/fetch）、git 2（git/question）、checklist、lint、lsp、codemode、ops 4（file_ops/process/get_current_time/sleep）。
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
