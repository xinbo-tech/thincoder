# ThinCoder 0.9.0 — 体验 + 能力升级设计文档 > 目标：11 项改进，覆盖配置体验、扩展性、工具能力、TUI 交互、上下文管理。 --- ## 执行顺序 按依赖关系分为 4 个阶段，每阶段内各任务可并行： ### Phase A — 基础层（独立，无依赖） | # | 条目 | 文件 | 预估 |
|---|------|------|------|
| 1 | Config JSON Schema | `config.mjs` | 30 行 |
| 4 | 内置 Skills（5 个） | `.thincoder/skills/*.md` | 5 个文件 |
| 2 | Lifecycle Hooks | `config.mjs`, `agent/dispatch.mjs`, 新 `src/hooks.mjs` | ~200 行 | ### Phase B — TUI + Task（依赖 Phase A 无直接依赖） | # | 条目 | 文件 | 预估 |
|---|------|------|------|
| 9 | 对话区消息折叠 | `render-frame.mjs`, `index.mjs` | ~150 行 |
| 6 | 树形 Task | `checklist` 工具, `render-frame.mjs` | ~100 行 |
| 8 | AI-Native MCP 配置 | `slash-commands.mjs`, `cmd-mcp.mjs` | ~120 行 | ### Phase C — 能力层（独立实现） | # | 条目 | 文件 | 预估 |
|---|------|------|------|
| 5 | LSP 工具 | 新 `tools/lsp.mjs` | ~200 行 |
| 13 | Goal Judge | `agent-tools/goal.mjs` | ~80 行 |
| 3 | /undo 命令 | `tui/cmd-undo.mjs`, `agent/dispatch.mjs` | ~150 行 | ### Phase D — 复杂特性 | # | 条目 | 文件 | 预估 |
|---|------|------|------|
| 7 | 智能上下文管理 | `context.mjs`, `checkpoint.mjs` | ~200 行 |
| 11 | CodeMode 沙箱 JS | 新 `tools/codemode.mjs` | ~300 行 | --- ## 详细设计 ### #1 Config JSON Schema **目标**：`~/.thincoder/config.json` 保存时自动注入 `$schema`，编辑器有补全和校验。 **方案**：
- 在 `saveConfig()` 写入前，将 `$schema` 字段设为 `"https://thincoder.dev/schemas/config.json"`（或本地路径）
- 生成一份 JSON Schema 文件放在 `docs/schemas/config.schema.json`
- `loadConfig()` 忽略 `$schema` 字段（不参与 merge） ```jsonc
// saveConfig 注入
config.$schema = "https://thincoder.dev/schemas/config.json"
``` ### #2 Lifecycle Hooks **目标**：用户在 config 中定义 shell 脚本，agent 在关键事件点执行。 **设计**： ```jsonc
// config.json
{ "hooks": { "PreToolUse": [ { "matcher": "bash", // regex against tool name "command": "python3", // or any executable "args": ["-c", "..."], // optional; without args, command receives JSON on stdin "timeout": 10000, // ms, default 10000 "action": "block" // "allow" | "block" | "notify" } ], "PostToolUse": [...], "Notification": [...] }
}
``` **事件类型**（首批，后续扩展）：
- `PreToolUse` — 工具调用前（可 block）
- `PostToolUse` — 工具调用后
- `PostToolUseFailure` — 工具调用失败后
- `Notification` — 通用通知（triggered by agent via a tool） **实现位置**：`src/hooks.mjs` ```js
export async function runHooks(event, ctx) { const hooks = ctx.agent.config?.hooks?.[event] ?? [] for (const hook of hooks) { if (hook.matcher && !new RegExp(hook.matcher).test(ctx.toolName ?? "")) continue const result = await runHook(hook, ctx) if (hook.action === "block" && !result.allowed) return false } return true
}
``` **调用点**（在 `dispatch.mjs` 中）：
- `PreToolUse`：在 `executeToolCalls` phase 1 权限检查之后、执行之前
- `PostToolUse`：在每个工具执行完成后
- `PostToolUseFailure`：在 catch 块中 ### #3 /undo 命令 **目标**：回滚最近的文件修改操作。 **方案**：
- 在 `dispatch.mjs` 执行每个 side-effect 工具（write/edit/delete/apply_patch/hashline_edit）前，保存文件快照
- 快照存内存：`{ toolCallId, path, backup: <original content or null for create> }`
- `/undo` 弹出 picker，选择要回滚的操作
- 回滚 = 恢复原始内容；新建文件 → 删除；删除文件 → 恢复
- 最多保留 50 条，FIFO ```js
// agent 状态新增字段
agent._undoStack = [] // { toolCallId, tool, path, backup, timestamp } // 在 executeToolCalls 中，每个 side-effect 工具执行前：
if (!tool.readonly) { const abs = resolveInCwd(ctx, args.path) const backup = existsSync(abs) ? readFileSync(abs, "utf8") : null agent._undoStack.push({ toolCallId: tc.id, tool: tc.name, path: args.path, backup }) if (agent._undoStack.length > 50) agent._undoStack.shift()
}
``` **TUI**：新增 `/undo` slash 命令 + `tui/cmd-undo.mjs` ### #4 内置 Skills **目标**：在 `.thincoder/skills/` 下预置 5 个常用技能。 **文件**： | 技能 | 文件 | 用途 |
|------|------|------|
| `pdf-create` | `pdf-create.md` | 生成 PDF 报告/文档（HTML → PDF via headless Chrome print） |
| `xlsx-create` | `xlsx-create.md` | 生成 Excel（CSV → xlsx via PowerShell on Windows / python3 -c on Unix） |
| `frontend-design` | `frontend-design.md` | 前端页面设计规范（配色、布局、响应式） |
| `code-review` | `code-review.md` | 代码审查 checklist |
| `api-design` | `api-design.md` | RESTful API 设计规范 | **技术**：纯 markdown 指令文件，不引入任何代码依赖。每个技能告诉模型用什么零依赖方式完成任务（如 HTML→PDF 用 Chrome headless 的 `--print-to-pdf`）。 ### #5 LSP 工具 **目标**：通过 LSP 协议获得代码智能。 **方案**：
- 纯 JSON-RPC over stdio，零依赖实现 LSP client
- 工具：`lsp`，子命令：`definition`、`references`、`hover`、`symbols`、`diagnostics`
- 懒启动：首次调用时启动 language server，缓存进程
- 支持的语言：TypeScript/JavaScript（内置 `typescript-language-server` 或直接用 `tsc --noEmit` 的 diagnostics） ```jsonc
// config.json 新增
{ "lsp": { "servers": { "typescript": { "command": "typescript-language-server", "args": ["--stdio"] }, "python": { "command": "pyright-langserver", "args": ["--stdio"] } } }
}
``` **工具定义**： ```js
export const lspTool = { name: "lsp", description: "LSP code intelligence: go to definition, find references, hover info, document symbols, diagnostics.", parameters: { subcommand: { type: "string", enum: ["definition", "references", "hover", "symbols", "diagnostics"] }, uri: { type: "string", description: "file:// URI or relative path" }, line: { type: "integer" }, character: { type: "integer" }, }, readonly: true,
}
``` ### #6 树形 Task **目标**：层级化任务追踪，替代扁平 checklist。 **方案**：
- 扩展 `.thincoder/checklist.md` 格式，支持缩进层级
- 任务 ID 用 `T1`、`T1.1`、`T1.2`、`T2` 格式
- TUI 渲染时递归缩进，折叠已完成子树 ```markdown
## Tasks
- [~] T1: 用户认证模块 - [✓] T1.1: 登录 API - [~] T1.2: JWT 中间件 - [ ] T1.2.1: token 生成 - [ ] T1.2.2: token 验证
- [ ] T2: 数据模型
``` **工具参数扩展**：
- `task add` 支持 `parent: "T1"` → 自动编号
- `task list` 支持树形输出 ### #7 智能上下文管理 **目标**：在压缩时从 checkpoint 重建关键上下文，而非简单截断。 **方案**（渐进实现）： **第一步**（0.9.0）：压缩前自动创建 checkpoint
- `compressIfNeeded` 被触发时，先调用 `createCheckpoint` 保存当前状态
- 压缩完成后，注入 checkpoint 引用："Checkpoint created before compaction. Use /restore to view." **第二步**（后续）：上下文重建
- 压缩时，不删除所有历史
- 保留：最后 N 条消息 + task 列表 + 最近文件修改摘要
- 从 checkpoint 的 git diff 中提取"本次会话改了什么"，注入摘要 ### #8 AI-Native MCP 配置 **目标**：`/mcp add` 进入对话式配置，无需手写 JSON。 **方案**：
- `/mcp add` → 模型提问"你要添加什么 MCP 服务？"
- 用户回复自然语言 → 模型生成配置 → 确认 → 写入 config
- 复用现有 question 机制 ```js
// cmd-mcp.mjs 新增流程
async function handleMcpAdd(ctx) { ctx.state.question = { text: "Describe the MCP server you want to add (name, type, command/URL):", answer: "", callback: async (answer) => { // 把 answer 发送给 agent，让它生成 JSON 配置 // 用户确认后 saveConfig } }
}
``` ### #9 对话区消息折叠 **目标**：长工具结果默认折叠为一行摘要，Enter 展开。 **方案**： **状态**：`state.expandedResults = Set<toolCallId>` **渲染逻辑**（`render-frame.mjs`）：
- 每个工具结果消息：超过 5 行 → 默认显示第一行 + `[… N lines folded — Enter to expand]`
- `state.expandedResults.has(toolCallId)` → 显示全文
- Enter 键：如果光标在折叠的工具结果上 → toggle 展开 **实现要点**：
- 在 `renderConversation` 中检测工具结果消息的长度
- 折叠时保留第一行（通常是最重要的摘要行）
- 折叠提示用 dim 颜色 ### #11 CodeMode — 沙箱 JS **目标**：给模型一个 `execute` 工具，背后是受限 JS 解释器。 **方案**：
- 基于 Node.js `vm` 模块的 `Script.runInNewContext`
- 沙箱提供受限 API：`readFile`、`writeFile`、`glob`、`grep`、`fetch`、`console`
- 不允许：`require`、`import`、`process`、`child_process`
- 超时控制：`script.runInNewContext({ timeout: 30000 })`
- 输出大小限制：`maxOutputBytes: 50000` ```js
import { Script, createContext } from "node:vm" export function executeCodeMode(code, ctx, timeout = 30000) { const sandbox = createContext({ readFile: (p) => readFileSync(resolveInCwd(ctx, p), "utf8"), writeFile: (p, c) => { /* auto-create dir, write */ }, glob: (pattern) => { /* sync glob */ }, grep: (pattern, file) => { /* sync grep */ }, fetch: async (url) => { /* SSRF-protected */ }, console: { log: (...a) => output.push(a.join(" ")) }, }) const script = new Script(code, { timeout }) return script.runInContext(sandbox)
}
``` **工具定义**：`execute` 工具，参数 `code`（string），`timeout`（可选） ### #13 Goal Judge **目标**：用独立 judge 模型验证目标是否真正完成。 **方案**：
- 在 goal 的 `complete` 操作中，额外调用一次 judge
- Judge prompt：给目标描述 + 最近 5 轮工具调用结果 + "Has this goal been achieved? Answer YES or NO with brief reasoning."
- Judge 模型：默认用同一 provider 的小模型（如 deepseek-chat），可配置
- Judge 返回 NO → goal 不标记完成 → agent 继续工作 ```js
// agent-tools/goal.mjs 中
if (action === "complete") { const judge = await judgeGoal(agent, criteria) if (!judge.passed) { return { ok: false, message: `Judge says NOT complete: ${judge.reason}` } } agent.goal = null return { ok: true, message: "Goal verified complete ✓" }
}
```
