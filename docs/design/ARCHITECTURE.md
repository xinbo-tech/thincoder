# ThinCoder 架构设计

> 依据：REQUIREMENTS.md（需求已定稿）。本文档定义 v1 的模块划分、接口与开发顺序。
> 约束：纯 mjs、无构建、Node >= 24、零 npm 依赖（仅 Node 标准库）。

## 设计原则

1. **零依赖**：只用 Node 标准库。`node:sqlite` 作存储，`fetch` 调 LLM，裸 ANSI 做 TUI。这不是苦行，是工程洁癖——每引入一个 npm 包就引进一份技术债（bug、安全漏洞、版本冲突）。我们做的是专业工程工具，不是玩具。
2. **接口先行**：模块间只通过显式接口通信，尤其是 memory——团队记忆的扩展位在此
3. **可运行验证**：每个里程碑都必须实际跑通，不留"写了没跑"的代码（teamcode 教训）
4. **准比短重要**：上下文宁长勿缺。1M 窗口是常态，未来继续增长。不要为了省 token 砍掉模型需要的信息——信息完整优先于字数精炼。
5. **代码是问题，不是答案**：编程智能体的场景是改代码，不是读教材。面对的项目代码可能有 bug、有过时设计、有技术债——模型应诊断和修复，不是朝圣模仿。
6. **面向全球，不做中文限定**：不预设用户是中国开发者。提示词用英文书写（模型对英文指令服从性更好），TUI 文本、系统消息、CLI 输出均应可切换语言，英文为默认回落。

## 目录结构

```
thincoder/
├── package.json          # type: module, bin 入口, engines: node >= 24
├── bin/
│   ├── thincoder.mjs     # 可执行入口（#!/usr/bin/env node），解析 argv，分发命令
│   └── thincoder.cjs     # CommonJS shim（npm bin 入口）
├── src/
│   ├── agent.mjs         # Agent 主循环 + 提醒注入 + 完成守卫 + 修复-验证循环 + 增量索引
│   ├── agent/            # agent 循环辅助
│   │   ├── dispatch.mjs  # 两段式工具调度
│   │   ├── setup.mjs     # 系统提示词组装
│   │   ├── helpers.mjs   # 工具函数与常量
│   │   ├── completion.mjs # 完成处理（空回复重试/pending task pushback）
│   │   └── post-turn.mjs # turn 结束后处理（advisor/verify guard）
│   ├── agent-tools/      # 自律工具（task/plan/goal/verify/subagent/skill/recent_changes）
│   ├── agent-tools.mjs   # 自律工具注册入口
│   ├── advisor/           # 独立评审子系统
│   │   ├── run.mjs       # 评审主流程
│   │   ├── messages.mjs  # 消息构建
│   │   ├── repos.mjs     # 仓库分析（isDocFile/isProductCode）
│   │   ├── convergence.mjs # 收敛逻辑
│   │   ├── citations.mjs # 引用验证
│   │   └── history.mjs   # 评审历史管理
│   ├── advisor.mjs        # advisor 入口
│   ├── provider/         # LLM 调用
│   │   ├── core.mjs      # SSE 流式 + reasoning_content + usage
│   │   ├── rate.mjs      # TPM/RPM 闸门
│   │   ├── sse.mjs       # SSE 解析
│   │   ├── anthropic.mjs # Anthropic Messages API transport
│   │   ├── google.mjs    # Gemini generateContent transport
│   │   └── index.mjs     # 入口（chat / listModels / createProvider）
│   ├── tui/              # 裸 ANSI TUI（45 个模块）
│   │   ├── index.mjs     # startTUI + render 副作用
│   │   ├── layout.mjs    # 声明式面板布局引擎
│   │   ├── render.mjs    # 绘制原语（charWidth / wrapText / formatTables / sanitize）
│   │   ├── render-frame.mjs  # 纯帧渲染器
│   │   ├── ansi.mjs      # ANSI 常量
│   │   ├── agent-turn.mjs    # agent 循环 + 回调构造
│   │   ├── key-handler.mjs   # 键盘事件分发
│   │   ├── startup.mjs       # 启动画面 + 会话恢复 + 后台索引
│   │   ├── interaction.mjs   # 权限审批 + Q&A
│   │   ├── pickers.mjs       # 通用列表选择器 + 模型选择器
│   │   ├── mouse.mjs          # SGR 鼠标点击处理
│   │   ├── render-conversation.mjs # 对话面板行构建（缓存/搜索高亮/折叠）
│   │   ├── render-loop.mjs    # 渲染循环
│   │   ├── markdown.mjs       # 行内标记 ANSI 渲染
│   │   ├── key-handler-search.mjs # 搜索模式键盘处理
│   │   ├── tool-summaries.mjs # 工具结果摘要渲染
│   │   ├── wizard.mjs        # 首次启动配置向导
│   │   ├── slash-commands.mjs # 斜杠命令分发 + Tab 补全
│   │   ├── cmd-*.mjs         # 各命令实现（24 个）
│   │   ├── config-helpers.mjs # 配置持久化辅助
│   │   └── clipboard.mjs     # 剪贴板图片粘贴
│   ├── tui.mjs           # 重导出 shim → src/tui/index.mjs
│   ├── tools/            # 工具系统（20+ 文件/网络/git 工具）
│   │   ├── index.mjs     # builtinTools 注册
│   │   ├── file.mjs      # read / write / edit / insert_after / read_image
│   │   ├── pdf.mjs       # read_pdf 工具壳（multimodal:true——扫描页图像回传；pages 页选择）
│   │   ├── pdf-parse-xref.mjs # PDF 对象层：xref 双形态/ObjStm/流过滤器 + PNG 预测器/加密拒绝（TOOLS.md §11 双核）
│   │   ├── pdf-parse-text.mjs # PDF 文本层：页树/内容流操作符/CMap+编码/布局 + 轻量 x 聚类分栏（TOOLS.md §11 双核）
│   │   ├── system.mjs    # bash / glob / grep / ls（bash 支持 config.shell 自定义 shell，win32 默认 cmd 前缀 chcp 65001 强制 UTF-8）
│   │   ├── git.mjs       # git 综合工具（diff / status / log / checkpoint 子命令）+ question
│   │   ├── web.mjs       # websearch / fetch
│   │   ├── patch.mjs     # apply_patch / delete（JS 自动语法预检 autoSyntaxCheck 内置）
│   │   ├── shared.mjs    # 工具共享工具函数
│   │   ├── linter.mjs    # lint（node --check / 语言级联：tsc/ruff/cargo/go vet——eslint 2026-09-02 §10.2 删除）
│   │   ├── lsp.mjs       # LSP 代码智能
│   │   ├── codemode.mjs  # 沙箱代码执行（execute 工具）
│   │   ├── checklist.mjs # 项目级 checklist 管理
│   │   ├── repomap.mjs   # 依赖大纲（repo_outline 工具）
│   │   └── *.md          # 工具描述（25 个）
│   ├── tools.mjs         # 重导出 shim → src/tools/index.mjs
│   ├── context.mjs       # 上下文压缩（关键决策保存 + task/plan 回注）
│   ├── memory/           # 三层记忆
│   │   ├── schema.mjs    # 常量 / DDL
│   │   ├── core.mjs      # CRUD + 检索
│   │   ├── code-index.mjs + code-sync.mjs  # 代码块索引
│   │   └── docs.mjs      # 文档块索引
│   ├── memory.mjs        # 重导出 shim
│   ├── session.mjs       # 会话持久化（槽位制，无上限；manifest + slotSessions 认领）
│   ├── embedding.mjs     # 向量 embedding（SiliconFlow bge-m3）
│   ├── mcp/              # MCP 客户端（stdio / HTTP / WebSocket）
│   ├── mcp.mjs           # MCP 入口
│   ├── config.mjs        # 配置加载 + provider 预设管理
│   ├── git/              # checkpoint.mjs（v2 全量副本快照，HEAD 无关可回滚）+ gitmem.mjs（Team 层同步）
│   ├── skills.mjs        # 项目技能加载
│   ├── markdown.mjs      # frontmatter 解析（零依赖）
│   ├── distill.mjs       # 会话知识提取
│   ├── generate-title.mjs # 会话标题生成
│   ├── auto-think.mjs     # 自动思考模式分类器
│   ├── hooks.mjs          # 生命周期钩子
│   ├── rules.mjs          # 项目规则发现
│   ├── upgrade.mjs        # CLI 版本升级检查
│   ├── prompts/          # 提示词文本
│   │   ├── system.md     # 核心规则（主/子通用）
│   │   ├── discipline.md # 编码/测试纪律
│   │   ├── main.md       # 主 agent 专属条款（subagent/goal/verify/skill/plan）
│   │   ├── engineering.md # 工程模式 work loop
│   │   ├── explore.md / coder.md / plan.md  # 子 agent 角色 overlay
│   └── cli/              # CLI 命令（distill / memory / permission / wizard）
├── test/
│   ├── agent.test.mjs    # agent 循环端到端（mock LLM server）
│   ├── memory.test.mjs   # 记忆 CRUD + 检索
│   ├── tools.test.mjs    # 工具测试
│   └── tui.test.mjs      # TUI 纯函数与布局
└── docs/design/          # 设计文档
    ├── REQUIREMENTS.md
    ├── ARCHITECTURE.md
    ├── ARCHITECTURE-v2.md
    ├── EVALUATION.md
    └── PHILOSOPHY.md
```

总源文件 ~123 个 `.mjs` + 19 个 `.md` 工具描述。测试用 Node 内置 `node:test` + `node:assert`，不引 vitest。

## 模块接口

### provider/ — LLM 调用
> 详细设计见 [`PROVIDER.md`](PROVIDER.md)。

`src/provider/core.mjs` 是核心，`index.mjs` 重导出 `chat` / `createProvider` / `listModels`。

```js
// 创建 provider。config: { baseURL, apiKey, model }
export function createProvider(config)

// 流式对话。messages: OpenAI 格式; tools: 工具 schema; 
// onToken: (text) => void 流式回调; onReasoning: 思考流回调
// 返回 { content, toolCalls, usage, finishReason, reasoning }
export async function chat(provider, { messages, tools, onToken, onReasoning, signal })

// 错误分级：可重试（网络/5xx/429）vs 不可重试（4xx 参数错误）
// 由 provider 内部处理重试（指数退避，最多 3 次），调用方无感
// rate.mjs 提供 TPM/RPM 闸门控制
```

覆盖范围：只跟顶流、只跟最新——当前内置 DeepSeek / Kimi / GLM / Qwen / MiniMax 五家国内顶流厂商的旗舰模型。不做老旧/不成熟模型（早期模型行为怪异，要堆大量防御性适配，堆出垃圾代码）、不做 Anthropic 原生协议、不做"通用 OpenAI 兼容端点"泛化承诺。预设表随模型换代增删，不留历史包袱。

注意：流式解析时除 `delta.content` 外必须同时认 `delta.reasoning_content`（DeepSeek-R1 类推理模型的思考流），思考流与正文流分开回调，TUI 可选择折叠展示。

thinking 模式的协议约束：是否回传 reasoning_content 由规格表 reasoningEcho 决定——"required"（DeepSeek/Kimi K3，缺失会 400 / Preserved Thinking 要求保留）必须回传；"optional"（GLM，clear_thinking 默认清除历史 reasoning）不回传；未声明（未知模型）保守不回传。实现：readSSE 累积 reasoning → agent.mjs 入 history 时按 reasoningEcho 决定是否以 reasoning_content 字段挂在 assistant 消息上。估算 token 时该字段计入长度（思考链很长，影响压缩阈值判断）。

### tools/ — 工具系统
> 详细设计见 [`TOOLS.md`](TOOLS.md)。

工具定义分散在 `src/tools/file.mjs` / `system.mjs` / `git.mjs` / `web.mjs` / `patch.mjs` / `checklist.mjs`，统一在 `index.mjs` 注册为 `builtinTools` 数组。描述文本存在 `src/tools/*.md`，运行时动态加载。

```js
// 每个工具的定义形状（对齐 OpenAI tool calling schema）：
{
  name: "read",
  description: "...",                    // 从 .md 文件动态加载
  parameters: { type: "object", ... },   // JSON Schema
  readonly: true,                        // 只读工具可并行；false 则串行
  multimodal: false,                     // 多模态工具返回 { text, images }
  execute: async (args, ctx) => result   // ctx: { cwd, agent, signal, ... }
}

export const builtinTools = [read, write, edit, bash, glob, grep, ...]  // 20 个工具
export function toOpenAISchema(tool)     // 转成 OpenAI tools 参数格式
```

调度由 `src/agent/dispatch.mjs` 负责——两段式：阶段一逐条权限确认，阶段二只读并行、副作用串行。

关键决策：
- `bash` 工具有超时（默认 120 秒）和输出截断（防上下文爆炸）
- `edit` 用 old_string/new_string 精确替换（参照主流实践，可靠）
- 危险操作（写文件、bash）在 TUI 层做权限确认，tools 层只做执行——关注点分离
- `checklist` 管**项目级**任务清单（`.thincoder/checklist.md`，人可读可手改），与 `task`（会话内单任务拆解）互补；条目一一对应需求/设计要点，标 done 自动归档到 `checklist-done.md`；每轮 run 开头把 pending + in_progress 条目作为 transient reminder 注入（`setup.mjs`）——上下文会压缩，清单文件不丢

### agent.mjs — 主循环
> 详细设计见 [`AGENT-LOOP.md`](AGENT-LOOP.md)。

主循环在 `src/agent.mjs`，辅助模块在 `src/agent/`：
- `dispatch.mjs`：两段式工具调度（阶段一权限确认，阶段二分类执行）
- `setup.mjs`：系统提示词组装（记忆注入、技能列表、项目指令）
- `helpers.mjs`：工具函数与常量
- 诊断事件日志：`src/log.mjs`（[`LOGGING.md`](LOGGING.md)——回合/LLM/工具/子代理事件统一入口——llm/tool 事件在 chat()/dispatch 落点统一发射）

自律工具（task/plan/goal/verify/subagent/skill）在 `src/agent-tools/`，由 `agent-tools.mjs` 注册。

```js
// 跑一轮任务。input: 用户输入字符串
// callbacks: { onToken, onReasoning, onToolCall, onToolResult, onPermissionRequest, ... }
// 返回最终文本
export async function runAgent(agent, input, callbacks, { depth, signal, resume })

// agent 内部状态
export function createAgent({ provider, tools, config, cwd, memory, overlay, ... })
```

循环逻辑（学 kimi-code 的扎实劲儿，去掉花哨部分）：
1. 用户输入入 context；检索相关记忆注入 system prompt
2. 调 provider.chat（带 tools schema）
3. 无 toolCalls → 流式输出，结束
4. 有 toolCalls → 按"两段式"执行（见下）→ 结果回喂 context → 回到 2
5. 循环上限（默认 200 轮）防失控；上下文超阈值时先压缩再继续

**工具执行：两段式并行（已确认 ✅，调研自三个榜样）**

三个榜样（kimi-code / MiMo-Code / opencode）全部并行执行 toolCalls，且系统提示词都主动要求模型批量发并行调用——串行等于浪费模型的行为习惯。但 kimi-code 的资源冲突矩阵对 thin 太重，折中方案：

- 工具分两类：**只读**（read / glob / grep）与**有副作用**（write / edit / bash）
- **阶段一（串行准备）**：逐个 toolCall 做权限确认（用户审批一个一个来，体验清晰）
- **阶段二（分类执行）**：只读工具 `Promise.all` 并行；有副作用工具逐个串行
- 结果按 `toolCallId` 配对回喂（OpenAI 协议按 ID 不按位置，完成乱序无正确性问题）
- 实现成本 ~20 行，拿到并行收益的 80%；冲突矩阵留给 v2 真有需要时
- 配套：system prompt 中明确鼓励模型批量发并行 tool call（三个榜样都这么做，模型已习惯该行为）

#### 任务规划与自律机制（实现增量，补录 ✅）

> 原稿未覆盖；实现时参考 kimi-code / Claude Code 补上，此处补录为正式设计。

**自律工具**（定义在 `src/agent-tools/`，由 `agent-tools.mjs` 注册，随主循环注入）：

| 工具 | 职责 | 注入范围 |
|---|---|---|
| `task` | 多步任务规划与进度跟踪（TodoList 模式），整体替换列表，readonly | 所有 agent |
| `plan` | plan mode 开关；plan mode 下拒绝一切非只读工具 | 所有 agent |
| `goal` | 长程自主目标生命周期（完成合约制，三态 active/complete/blocked） | 仅顶层（depth=0） |
| `verify` | 完成前自检：git diff --stat + task 清单 + 自检 checklist | 仅顶层 |
| `subagent` / `skill` | 子 agent（explore/plan/coder）与项目技能加载 | 仅顶层（防递归） |

**子 agent 模型指定**：`subagent` 工具 `model` 参数可覆盖子 agent 的 provider/model——`"provider:model"`（指定 provider 与模型，如 `deepseek:deepseek-v4-flash`）、provider 名（用其配置模型）、或纯模型名（父 provider 换模型）。**配置按类型分层**：`config.agent.subagentModels[role]`（explore/plan/coder/eng-coder 各自独立，如 explore 用便宜模型、coder 用好模型）+ `config.agent.subagentModel`（全局兜底，向后兼容）。优先级：**工具参数 > 类型级 > 全局 > 继承父 provider**（resolveChildProvider 单一解析源，仅收最终字符串）。API key 仅从 config.json 的 provider.apiKey 读取（不支持环境变量）。典型用法：主会话用 glm-5.2 讨论定方案，explore/coder 外包给便宜模型、plan 用好模型推敲设计。

**子 agent 权限模型**：explore/plan 强制只读（权限回调恒 false）；coder/默认角色在 AUTO 模式直接放行，**手动模式把权限请求排队透传到父 agent 的审批 UI**（工具名带 `coder/` 前缀，如 `coder/bash`）——人在回路，子 agent 的写操作由用户逐条批准，拒绝后子 agent 按 overlay 设计改为交报告。并行子 agent 的请求经 `parent._permQueue` 串行化，避免两个审批同时弹出互相覆盖（question 工具的教训）。

**plan 子 agent（借鉴 kimi-code 的 plan profile）**：只读规划 agent，交付物是计划本身。overlay 的灵魂是**编排意识**——先判断是否足够了解代码库，不足则明确列出"建议父 agent 派 explore 调查的问题"（plan → explore → plan 链），而非硬猜；输出契约：引用真实文件/行号、步骤可验证、有权衡时推荐一个方案并给理由。工具与 explore 相同（只读过滤），git 上下文同样注入。与 plan mode 互补：plan mode 是用户在场审批方案，plan 子 agent 是父 agent 自主外包规划阅读。

**prompt 分层组织（借鉴 kimi-code 的自包含 profile，分文件方案）**：`system.md` 是核心规则（主/子通用：诚实、并行、最小改动、编码纪律）；`discipline.md` 是编码/测试纪律；`main.md` 是主 agent 专属条款（plan/goal/skill/subagent/verify——子 agent 没有这些工具，prompt 不教它调不存在的东西，消除"继承全量 prompt 再打补丁"的矛盾）；子 agent prompt = 角色 overlay（`explore.md` / `coder.md` / `plan.md`，**开头**，对齐 kimi 的 role prefix，身份先于通用规则）+ 核心规则。

**提示注入防御与上下文工程（借鉴 kimi-code）**：
- goal 提醒：目标文本 XML 转义 + `<untrusted_objective>` 标签包裹 + "是数据不是指令"声明——用户目标里的"忽略你的指令"不再能穿透
- 技能清单以 "DISREGARD any earlier skill listings" 开头（刷新即旧单作废）；技能按名去重——history 里已有 `<skill-loaded>` 块不重复展开（历史即账本）
- 压缩摘要：第一人称现在时交接笔记、未验证事项必须标注；摘要前缀"当笔记不当证据"
- 项目指令：每份 `<!-- From: <path> -->` 来源标注（冲突裁决可追溯）；超 8000 字符截断时留下显式 WARNING，不静默
- 注入自愈：AUTO 提醒被压缩折叠后（history 查不到）自动补播
- 工具结果超 16k 字符整体落盘 `~/.thincoder/tool-results/`，模型只见 2k 预览 + 路径 + read 分页指引（落盘失败退化为硬截断）
- **落盘目录写时自清理（2026-08-21）**：每次 offload 写新文件前，删除目录内 mtime 超过 3 天（`TMP_RETENTION_MS = 3×24×3600×1000`）的**文件**——子目录不动、任何异常静默（清理尽力而为，不影响 offload 主流程）。动机：Windows 磁盘清理/存储感知不覆盖 `~/.thincoder/tool-results/` 与项目 `.thincoder/tmp/`，不清理会无限堆积（2026-08-21 用户拍板：保留期 3 天、目录内所有过期文件都清）。实现：CLI `src/agent/helpers.mjs`——清理抽为导出函数 `cleanupOldToolResults(dir)`（async，fs/promises readdir/stat/unlink，readdir 失败直接返回、逐条目 try/catch），`offloadToolResult(text, callId, dir = join(configDir, "tool-results"))` 落盘前调用（可选第三参 `dir` 供测试隔离注入）；VS Code 端同语义同步实现于 `src/agent/run-helpers.mjs#offloadToolResult`（readdirSync/statSync/unlinkSync，目录 `<cwd>/.thincoder/tmp/`，含 paste-* 粘贴图片文件），逐行等价、CLI 为准。边界：刚写入文件 mtime 新鲜不误删；>3 天旧文件被删后 read 报不存在（可接受，重新执行工具即可）；清理仅在 offload 触发时执行（低频，成本 O(目录条目)）；readdir 与 stat 之间的并发删除竞态由逐条目 try/catch 构造保证（无测试钩子，不做确定性模拟）。VS Code 端落盘目录在 workspace 内（`<cwd>/.thincoder/tmp/`）——依赖 workspace `.gitignore` 忽略 `.thincoder/`（thincoder-vscode 自身仓库已配置；用户项目需自备）。测试：CLI `test/agent.test.mjs`（现有 offload 测试旁）+ VS Code 新建 `test/run-helpers.test.mjs`（并入 package.json test 脚本）——用例：① 目录含 >3 天旧文件 + 新文件 + 子目录 → offload 后旧文件删、新文件与子目录保留；② mtime 恰好 3 天内的边界文件保留；③ 目录不存在或 stat 失败不抛、offload 正常返回落盘结果
- **截断纪律**：一切截断必须发生在落盘之后——工具输出上限 200k 只是内存安全阀（远高于 16k 落盘阈值）；子 agent 报告不再内部截断（旧 32k 上限会在落盘前丢内容）；压缩序列化 user 消息放宽到 8000（长需求不进摘要器就丢原始意图）；项目指令 32K 软上限只警告不截断（对齐 kimi-code）
- 工作目录浅层树注入（仅顶层、run 开头的 user 上下文消息；根 30 项/子目录 10 项、目录优先、隐藏折叠、`.git`/`node_modules` 跳过）——开局方位感，且新消息不破前缀缓存

**报告质量兜底（借鉴 kimi-code 的 summaryPolicy）**：子 agent 报告不足 200 字符视为交接不完整，打回扩写一次——子 agent 的 history 还在，续写指令作为新输入追加，它能看到自己刚才的工作；重试仅 1 次，避免死循环。

**explore 的 git 上下文（借鉴 kimi-code 的 promptPrefix）**：explore 子 agent 启动时向输入注入仓库现状（当前分支、最近 5 条提交、工作区改动清单）——探索问题常和仓库状态有关；非 git 仓库静默跳过。

**促使模型"落地前先制定 todolist"的四层机制（对齐 kimi-code，软引导不硬强制）：**

1. **工具描述 prompt**：写明何时该用（多步任务动手前先建表、收到多步指令先落成 tasks）、何时不该用（单发请求）、状态机纪律（恰好一个 in_progress、完成立即标 done 不批量补标、测试红不许标 done、阻塞保持 in_progress、避免 churn）
2. **工具结果即时强化**：每次 task 写入成功的 result 尾部附"继续保持恰好一个 in_progress、完成立即标 done"提醒，形成即时反馈回路
3. **pending 完成守卫**：模型无工具调用回合（准备收尾）时，若任务列表仍有 pending 项，注入"更新 task 状态再收尾"的 system reminder 并继续循环——**每个任务列表状态最多推回一次**（`_taskPushbacks` 计数，task 工具更新列表即重置；防无限循环卡死——模型第二次坚持收尾则放行）。**仅顶层 agent（depth=0）**；提醒统一以 `role: "user"` 的 `[System reminder: ...]` 写入 history
4. **生命周期保障**：压缩后以独立 system reminder 回注 task 列表（每次压缩重新注入，永远最新且在历史末尾；单一信息源，不嵌入摘要正文）；tasks 随会话持久化（session.mjs），resume 恢复

**完成守卫（completion guard）**：模型给出最终回答（无 toolCalls）时，若本轮运行用写/编辑类工具改过文件却没跑过 `verify`，不直接收工——把回答入历史、注入"先跑测试并调 verify 自检"的 system reminder 后继续循环。每次 runAgent 最多推一次（防死循环）；`bash` / `subagent` 不算 mutation（跑测试、explore 子 agent 不该被催；coder 子 agent 有专属校验提醒）。仅顶层 agent（depth=0）生效。

**长程自主任务（goal mode，对齐 kimi-code 的 goal 设计）**：
- **完成合约**：`goal set` 强制要求可机器检查的完成条件（测试/命令输出/搜索结果），"做个东西"式的愿望被拒绝——没有验证手段的目标不值得设立
- **每轮状态注入**：goal active 时每轮注入 `turns N/预算 (remaining M)` + 目标文本（untrusted 转义）+ 审计纪律；预算（默认 200 轮，`config.agent.goalTurns` 可配）消耗 ≥75% 切换为"不要开新的自由裁量工作"预警。每轮注入同时解决了压缩后 goal 感知丢失（下一轮自动恢复）
- **完成审计**：`goal complete` 要求 criteria 声明的检查真的跑过；本轮改过文件没跑 verify 会被硬拒（与完成守卫共用 `_mutatedThisRun`/`_verifiedThisRun` 证据链）——虚假完成是自主任务的最坏结果
- **阻塞审计**：`goal blocked` 需同一阻塞条件**连续 3 次**才受理（工具内 `_blockTally` 计数，换条件重新计）——防止一遇阻就放弃，也防止死磕不报
- **停滞检测**：同一工具+同一参数连续 3 次调用，注入"你在原地空转，换条路或求助"提醒（kimi-code 没有的机制，长程任务防死循环）

**编码纪律（system prompt）**：`discipline.md` 尾部「Coding discipline」段（对齐 kimi-code 的严谨条款）——修 bug 先找根因不打补丁式修复、匹配周边代码风格、用库前先确认项目已有依赖、重构更新所有调用方且不改测试逻辑凑通过、不留占位符、改完扫旧注释、终答前重读用户最新请求。原则：token 花在验证上是合算的。

**前缀缓存（context caching）**：DeepSeek 自动缓存请求公共前缀（命中价约为 miss 的 1/120），前提是 system prompt + 历史消息的前缀跨请求逐字节不变。约束落到代码上：
- system prompt 只允许放跨 run 稳定的内容；`Session start` 时间戳每会话固定一次（`agent._sessionStart`），不能每次 runAgent 重新取
- 每轮变化的**记忆注入**不进 system prompt，作为独立 user 上下文消息（`[Relevant memories ...]`）随输入一起入 history——历史只增不改，前缀缓存照常命中
- 技能列表、项目指令按 cwd 稳定，留在 system prompt；skills 文件变更会破一次缓存，可接受
- 回归测试：连续两次 runAgent，断言两请求的 system 消息逐字节相等

**视觉能力防护（image_url 会话毒化）**：文本模型的 API 见到任何一条消息含 image_url 部分就整个请求 400——历史里混进一张图，之后每轮请求都挂，会话直接变砖。三道防线：
1. `read_image` 执行前按 `specForModel(model).multimodal` 拒绝非视觉模型（读文件之前就拒，错误信息给出替代方案）
2. 主循环注入多模态工具结果时，非视觉模型改注入 system reminder（"图片未注入，不要重复调用"），image 部分不进历史（纵深防御）
3. `stripImagesForTextModel`（`provider/core.mjs`）发送前把历史里残留的 image_url 替换为文本占位符——防"视觉模型会话切到文本 provider 恢复"的存量毒化；历史本身不改，切回视觉模型图片即恢复

**tool 配对协议防护（DeepSeek 严格校验）**：严格 provider（DeepSeek）要求每条 tool 消息**紧跟**声明其 tool_call_id 的 assistant 消息，中间隔一条 user 消息都整个请求 400。历史可能合法地违反紧邻性——并行 read_image 在 tool 结果之间注入多模态 user 消息、压缩切割、中断会话留下悬空 tool_calls。两道防线：
1. 源头：主循环把多模态 user 消息（图片注入 / 未注入提醒）**延后到所有 tool 结果提交之后**再入历史（`deferredUserMsgs`），新产生的历史天然紧邻
2. 兜底：`normalizeToolPairing`（`provider/core.mjs`）发送前规范化线上载荷——tool 消息重排到 owner assistant 之后、孤儿 tool 丢弃、缺失结果合成占位；与 `stripImagesForTextModel` 同语义，历史本身不改。覆盖存量会话（恢复/压缩产生的交错历史）

**TUI todo 面板**：对话区与输入框之间常驻，最多 5 行（`▶ in_progress` / `✓ done`（暗色+删除线）/ `○ pending`；超 5 条优先 in_progress、兼顾最早 pending 和最近 done）；一轮结束全部 done 自动收起；会话恢复时以 `agent.tasks` 直接初始化。状态栏保留 `▶done/total` 计数，对话区每次更新留痕 `[task] x/y ▶ 当前任务`。chat 命令经 stderr 输出同款留痕。

**轻量 markdown 显示（IK5VW3）**：`tui/markdown.mjs` 把模型回复的行内标记渲染为 ANSI——`**粗体**`/`__粗体__`（`\x1b[1m`，用 `22` 关闭不破坏行底色）、`` `代码` ``（反色 `7m/27m`）、`~~删除线~~`（`9m/29m`）、`# 标题`（去标记+整行粗体）。设计约束：**在 wrapText 之后渲染**（ANSI 不再影响宽度数学）；反引号内标记不解释（markdown 语义）；未闭合标记按原文（流式安全）。表格对齐走 render.mjs 既有 `formatTables`，**含标记单元格由 `renderMarkdownPreservingWidth` 行尾补偿**（标记消失导致的宽度差补空格，竖线不错位）；`stringWidth` 剥离 ANSI 序列（零显示宽度）。复制文本时 ANSI 剥离即得干净内容。

**Ctrl+C 两段确认（IK61BI）**：空闲态第一次 Ctrl+C 只提示"再按一次退出"并武装（3 秒窗口，超时自动解除），窗口内再按才退出；picker 打开时 Ctrl+C = 取消 picker、生成中 Ctrl+C = abort，均不退出进程。状态栏与 F1 帮助文案同步（`Ctrl+C: exit (×2)`）。

**token 用量展示**：`readSSE` 捕获 `usage` → runAgent 经 `callbacks.onUsage` 透传 → TUI 状态栏累计显示 `↑输入 ↓输出 hit 缓存命中率%`（DeepSeek usage 自带 `prompt_cache_hit/miss_tokens`，前缀缓存效果因此可观测）；chat 命令结束时 stderr 输出 `[usage]` 汇总行。状态栏另显示**上下文利用率** `ctx N%`（`estimateTokens(history) / compactThreshold`，history 长度变化才重算；≥80% 变黄——到 100% 触发压缩，提醒用户收尾或 /new）。

### context.mjs — 上下文管理 + 压缩
> 压缩统一规范见 [`CONTEXT-COMPACTION.md`](CONTEXT-COMPACTION.md)。

```js
export function estimateTokens(messages)      // 粗略 token 估算
export async function compressIfNeeded(agent, threshold)  // 超阈值时压缩
export function compressFallback(agent)       // 压缩失败时确定性截断兜底
export function pushReal(agent, msg)          // 真实消息双写：同时追加 agent.history 与 agent._fullHistory
```

压缩策略（学 kimi-code，简化版）：保留最近 N 条（窗口自适应），其余全部用 LLM 摘要成一条——**不保留头部**（KEEP_HEAD=0，2026-08 决策：多任务会话里最早消息是已完成的旧任务，原文保留会锚定旧事；摘要提示词区分已完成/进行中工作）。token 判定**实测优先**：上次响应的 `usage.prompt_tokens` 是完整上下文的实测值。安全点是 user **或 tool** 结尾（splitHistory 保证 tool_calls 配对完整）。摘要 LLM 连续 3 次失败降级为确定性截断（`compressFallback`，丢 middle 不碰网络——丢信息好过任务被 400 打死）。压缩后以独立 system reminder 回注 task 列表。原子写（tmp+rename）；每 5 个工具 turn 增量保存。**CLI 与 VS Code 的压缩语义统一规范见 `CONTEXT-COMPACTION.md`（D1–D12：窗口自适应 tail、实测基线、双侧配对保护、三级降级、摘要对前端静默、KEEP_HEAD=0 等）——两端实现以该文档为准。**

**机读上下文与人读历史分离（双结构）**：`agent.history` 是机读上下文（压缩照常），`agent._fullHistory` 是**永不压缩**的完整记录（人读）。压缩只作用前者；后者只追加。两线在**源头各自独立写入**：真实消息（用户输入、assistant 回复、tool 结果、多模态图像）统一走 `pushReal`——同时追加进 `agent.history` 与 `agent._fullHistory`（后者懒初始化）；机读消息（`[System reminder:`、`[User interrupt:`、压缩 note、task/plan/checkpoint 回注等 transient 注入）直接 push 进 `agent.history`，**不经过** `pushReal`，因此永远不进人读线。这一版取代了旧的事后差量同步（`syncFullHistory`/`_syncedLen` 基线）：差量基线需要在 reminder/checkpoint splice 时手工补偿，太脆、易错；源头双写语义直白——两条线各写各的，无需事后对账。checkpoint 引用、压缩 note、task/plan reminder 等机读消息**有意不进** `_fullHistory`。

**消息形态：ts 字段（2026-09-03，权威：SESSION.md §9）**：每条真实消息带 `ts`（epoch ms）——`pushReal` 落对象时刻单点打点；压缩重建注入的 note/"Understood" 同刻打点。恢复的旧消息不补 ts（不伪造取证时间）。`ts` 是本地字段：发送层 `stripLocalMessageFields` 在格式分派前剥离（anthropic/responses 直传原始消息对象——剥离必须在最前），**不进任何 provider 请求**；TUI/VS Code 渲染不读它（零 UI 变化）。depth-0 的 `read_history` 只读工具查询人读线（role/keyword/tool/since-until/limit/direction 筛选）——取证面（工具时序）见 SESSION.md §9。

**会话文件双写**（session.mjs）：`history` 字段存完整 `_fullHistory`（人读，VS Code 历史面板与 CLI resume 渲染读它）；`contextHistory` 字段存压缩后机读 `agent.history`。恢复（`applySession`）：**人读线 `_fullHistory ← history`**；**机读线 `agent.history ← contextHistory`**（缺失或为空才回退用 `history` 播种）。机读线必须优先从 `contextHistory` 恢复，而非从完整 `history` 重建——后者会把已压缩掉的中间过程重新塞回机读上下文，使 prompt 体积远超压缩目标（实测曾到 283%）。盘上两线是同一时刻的快照；VS Code 追加的尾巴本就该在机读线里。临时上下文打 `transient` 标记，保存时过滤。

**VS Code 端契约**（thincoder-vscode）：同一双结构语义，但两线由调用方（chat-panel）持有并经 `opts.history`（机读）/`opts.fullHistory`（人读）传入 `runAgent`，就地更新、跨调用存活。`session-io` 的 `saveMessages(msgDir, name, messages, contextHistory)` 把两条线写成 `{ messages, contextHistory }` 双字段；`loadSessionLines` 读回两线、`loadMessages` 只返回人读线供 UI。旧格式（裸数组或无 `contextHistory` 的对象）→ `contextHistory: null`，调用方回退从人读线播种机读线。

### 会话存储统一（CLI ↔ VS Code 共享）

两端使用**同一套磁盘格式与存储位置**，可互相读写同一份会话数据：

```
~/.thincoder/sessions/
  <sha1(cwd)>.json.manifest   # { slots: { 1: {ts, title, firstMessage, turnCount, activeProvider, updatedAt}, ... }, active: N, sessionId, slotSessions: { N: "<pid>-<ts>-<rand>" } }
  <sha1(cwd)>.json.1          # 槽位1: { version:2, cwd, title, history, contextHistory, display, tasks, ... }
  <sha1(cwd)>.json.2          # 槽位2
```

`sha1(cwd)` 为**完整 40 位十六进制，不截断**。

**设计要点**：
- **槽位模型**：数字键 `1..N`（无上限），文件名 `session.json.N`；manifest 存元数据 + active 指针 + sessionId（PID 防多开）。
- **槽位认领与避让（关键）**：`slotSessions` 记录"哪个槽位正被哪个活进程占用"——键是槽位号，值是占用者的 `sessionId`（`<pid>-<ts>-<rand>`，取首段为 PID）。每个进程启动时**必须**经 `activeSlot()` → `ensureActive()` 认领一个槽位（把 `slotSessions[槽位]` 写为自己的 sessionId），供其它进程（CLI ↔ VS Code）判断占用并避让。认领的偏好顺序：① 当前 active 槽位若可拿（无人认领 / 是自己的 / 认领者已死）→ 复用（保留"接着上次"体验）；② 否则认领第一个空槽或死进程槽（按 `isProcessAlive(pid)` 判定，Windows `tasklist` / Unix `kill(pid,0)`）；③ 全被活进程占用 → 分配新槽位（避让）。**曾有的 bug**：旧 `activeSlot()` 有 `if (!m.active)` 守卫——active 非空就跳过 `ensureActive`，导致 CLI 从不写 `slotSessions`，VS Code 因而看不到占用、误开同一槽位。修复后两端都"总是认领"，占用对彼此可见。
- **cwd 归一化（关键）**：`sha1(cwd)` 的输入必须先归一化，否则两端因路径大小写/分隔符差异算出不同 hash，会话互不可见。规则：**Windows 盘符转大写**（`d:\…` → `D:\…`），路径分隔符保持反斜杠；非 Windows 平台原样。VS Code 的 `uri.fsPath` 会把盘符小写化，CLI 的 `process.cwd()` 保留用户输入大小写——归一化后两端收敛到同一 hash。
- **hash 不截断**：文件名用完整 40 位 sha1。早期曾截断（CLI 12 位 / VS Code 16 位），既无设计依据又导致两端不一致的 bug——不截断从根上消除"该截几位"的争议，且零碰撞风险。12/16 位旧文件由 CLI 首次访问时自动改名为 40 位。
- **标题**：`title` 字段两端都认。CLI 在**第一条用户消息后自动生成**（复用 VS Code 的 generate-title 逻辑）；VS Code 保留现有自动标题 + 下拉 UI。标题写入 manifest 与槽位文件，不再 rename 文件。
- **VS Code 迁移**：废弃 `messages/` 目录 + base64 文件名 + Memento 索引，改用上述共享格式。旧 `messages/` 会话**不迁移**，直接丢弃（从空开始）。
- **排序**：列表按 `updatedAt` 倒序（最新在前），两端一致。
- **字段往返完整（关键）**：槽位文件是全量覆盖写，不是增量合并——任何一端存盘时若漏掉某字段，该字段就**永久丢失**。因此两端重写 data 对象时**必须透传自己不认识的字段**（先 `loadSlot` 再展开 `...existing` 覆盖已知键），不得逐字段重建一份"自己认识的子集"。**已修复（2026-08，SESSION.md:80 为现契约）**：VS Code `panel-session.mjs saveLines` 已改 `...existing` 展开式透传 + 键存在性写入——CLI 写入的 `activeModel` / `engineering` / `engDesignToken` 等未知字段往返 intact；早先"逐字段重建丢字段"的缺口不复存在。


### 配置共享（CLI ↔ VS Code）

两端读写**同一份** `~/.thincoder/config.json`，结构为 `providers[]` + `activeProvider`：

- **唯一权威**：provider preset 表（baseURL / 默认 model / maxTokens / chatPath / 特殊参数适配）以本文件 `src/config.mjs` 的 `PROVIDER_PRESETS` 为准。VS Code 扩展**不再各自硬编码** preset，避免两端漂移（MiniMax 等配置曾因此不一致）。
- **apiKey**：存于各 provider 项内；缺省时回退环境变量（两端同一回退链）。写入时 0600 权限（POSIX 语义，Windows 尽力而为）。
- **VS Code 迁移**：首次启动若检测到旧版 VS Code settings 里的 `thincoder.providers`，一次性迁移进 `config.json`，此后停用 settings 存储。旧 `messages/` 会话不迁移（见上）。
- **关系**：配置与会话共享，**代码仍各自独立、无运行时依赖**——共享的是磁盘数据，不是代码。


### memory/ — 记忆系统
> 详细设计见 [`MEMORY.md`](MEMORY.md)。

核心在 `src/memory/core.mjs`，`memory.mjs` 重导出所有接口。三层记忆（Personal / Project / Team），FTS5 + 向量 RRF 混合检索。

```js
// 接口——统一检索入口，跨层合并结果：
export async function put(memory, { type, title, content, tags, scope })
export async function search(memory, query, { limit })      // FTS5 + 向量 RRF
export async function list(memory, { type, limit })
export async function remove(memory, id)

// 代码/文档索引（code-index.mjs + code-sync.mjs / docs.mjs）
export async function codeSync(memory, cwd)
export async function docSync(memory, cwd)
export async function reindexFile(memory, cwd, absPath)     // 单文件增量
```

- v1 实现：`node:sqlite` + FTS5 虚表，BM25 排序。entry.type ∈ `rule | knowledge | decision | pattern`（对齐团队记忆四类内容）
- **扩展位设计**：`createMemory` 返回的对象即接口。v2 团队版 = 同一接口 + git 同步层 + 向量检索（embedding 走 provider 的 fetch）+ RRF 排序，单机版无痛升级
- agent 集成：system prompt 里注入 `search` 结果 + 提供 `memory_put` / `memory_search` 两个工具让 agent 自主存取

### config.mjs — 配置

```js
export function loadConfig()    // 读 ~/.thincoder/config.json + 环境变量兜底
export function saveConfig(config)
export const PROVIDER_PRESETS   // 内置 provider 预设表（17 个：DeepSeek/Kimi/kimi-code/GLM/Qwen/MiniMax/OpenAI/Claude/Gemini/Grok/Mistral/Volcengine/Hunyuan/SiliconFlow/OpenRouter/Groq 等；kimi-code = Kimi For Coding 端点，key 与 Moonshot 不通用）
export function specForModel(model)  // 查模型规格（contextWindow / reasoningEcho / multimodal / tempRange）；未知模型警告一次后回落 DEFAULT_SPEC（IK5VGJ）
```

```jsonc
// ~/.thincoder/config.json（multi-provider 结构）
{
  "providers": [
    { "name": "deepseek", "baseURL": "https://api.deepseek.com/v1", "model": "deepseek-chat" },
    { "name": "kimi", "baseURL": "https://api.moonshot.cn/v1", "model": "kimi-k3" }
  ],
  "activeProvider": "deepseek",
  "agent": { "maxTurns": 200, "compactThreshold": 100000, "compactThresholdAuto": true },
  "memory": { "dbPath": "~/.thincoder/memory.db" },
  "embedding": { "baseURL": "https://api.siliconflow.cn/v1", "model": "BAAI/bge-m3" }
}
```

apiKey 仅从 config.json 读取（不支持环境变量配置 API key）。

### tui/ — 裸 ANSI 终端 UI
> 详细设计见 [`TUI.md`](TUI.md)。

`src/tui/index.mjs` 是入口，45 个模块约 5,500 行，全部自研零依赖。

```
src/tui/
├── index.mjs          # startTUI 入口 + render 副作用 + submit + 依赖注入
├── layout.mjs         # 面板布局引擎（纯函数 computeLayout）
├── render.mjs         # 绘制原语（charWidth / wrapText / formatTables / sanitize）
├── render-frame.mjs   # 纯帧渲染器（renderFrame）
├── render-conversation.mjs # 对话面板行构建（缓存/搜索高亮/折叠）
├── ansi.mjs           # ANSI 常量 + 颜色定义
├── mouse.mjs          # SGR 鼠标点击：picker 选中 / 折叠展开 / 行菜单
├── agent-turn.mjs     # agent 循环 + 回调构造（流式/工具/子agent/压缩）
├── key-handler.mjs    # 键盘事件分发（权限/问题/选择器/向导/编辑/历史/粘贴）
├── interaction.mjs    # 权限审批 + Q&A 输入
├── pickers.mjs        # 通用列表选择器 + 模型管理选择器
├── wizard.mjs         # 首次启动配置向导
├── slash-commands.mjs # 斜杠命令分发 + Tab 补全
├── cmd-*.mjs          # 各命令实现（24 个：model/think/session/config/…）
├── startup.mjs        # 启动画面 + 会话恢复 + 后台索引
├── clipboard.mjs      # 剪贴板：图片粘贴 + 文本复制/读取
├── distill-cmd.mjs    # /distill 命令
├── key-handler-search.mjs # 搜索模式键盘处理
├── markdown.mjs       # 行内标记 ANSI 渲染
├── mouse.mjs          # SGR 鼠标点击
├── render-conversation.mjs # 对话面板行构建
├── render-loop.mjs    # 渲染循环
├── tool-summaries.mjs # 工具结果摘要
└── config-helpers.mjs # 配置持久化辅助
```

```js
export async function startTUI(agent, opts)   // 主入口，接管终端直到退出
```

### bin/thincoder.mjs — 命令分发

```
thincoder              # 启动 TUI（默认）
thincoder chat "..."   # 一次性问答（管道友好，可接 stdout）
thincoder memory       # 记忆管理子命令（list/search/put/remove）
thincoder sync         # Team 层 git pull + 增量索引
thincoder reindex      # 全量重建索引（含向量）
thincoder distill      # 从会话提取候选记忆条目
thincoder config       # 查看/设置配置
```

## 数据流（一次问答）

```
用户输入 → tui → agent.runAgent
  → memory.search 注入相关记忆
  → context 组装 → provider.chat (流式)
  → toolCalls? → tui 权限确认 → tools.execute → 回喂 → 再循环
  → 最终文本流式渲染到 tui
  → (可选) agent 自主调 memory_put 沉淀
```

## 开发顺序（里程碑）

| 里程碑 | 内容 | 验证标准 | 状态 |
|---|---|---|---|
| M1 | provider + 最简 chat 命令（无 TUI） | `thincoder chat "hello"` 流式输出真实回复 | ✅ |
| M2 | tools + agent 主循环 | `thincoder chat "读一下 package.json 总结它"` 能调工具完成 | ✅ |
| M3 | TUI | 交互式对话跑通，流式渲染、权限确认可用 | ✅ |
| M4 | context 压缩 | 构造超长对话，压缩后任务不断片 | ✅ |
| M5 | memory | agent 能自主存取记忆，跨会话生效 | ✅ |

全部里程碑已完成（2026-08）。v1 额外提前交付：checkpoint、子 agent、MCP、advisor 评审、工程模式、团队记忆三层体系。

## 明确排除（防范围蔓延）

- TypeScript / 任何构建步骤 / 任何 npm 运行时依赖
- GUI 桌面客户端 / 工作流引擎
- Windows 特殊处理以外的平台适配（win32 控制台 quirks 遇到再修）
