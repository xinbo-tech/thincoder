# ThinCoder VS Code 架构设计

> 本文档定义 VS Code 扩展的模块划分、数据流和设计决策。
> 约束：纯 `.mjs`、零 npm 运行时依赖、VS Code API + Node 标准库。

## 设计原则

1. **薄封装**：扩展是 agent 核心的 VS Code 适配层。Agent 循环、工具系统、prompt 体系采用与 ThinCoder 一致的设计理念。负责任，不是办公设备。
2. **职责分离**：扩展主机（extension host）负责 agent 循环和工具执行；Webview 只负责 UI 渲染和用户交互。两者通过 `postMessage` 单向通信。
3. **零构建**：无 TypeScript、无打包器。`extension.mjs` 即入口，`package.json` 声明 `"type": "module"`。
4. **VS Code 原生能力优先**：工具执行通过 VS Code API 增强（如 `workspace.openTextDocument` 在写入后自动在编辑器中打开文件）。
5. **会话与 CLI 共享**：会话数据存储在 `~/.thincoder/sessions/`（与 CLI 同一磁盘位置），两端互读互写，跨产品接续无感。旧 `context.workspaceState` 方案已废弃（pre-release，无迁移）。

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Extension Host                           │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  extension.mjs│    │ src/agent.mjs│    │src/provider  │  │
│  │  ChatPanel    │───▶│ runAgent()   │───▶│+src/mcp      │  │
│  │  +extension/  │    │ +context.mjs │    │ chat()       │  │
│  └──────┬────────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                    │                    │          │
│   postMessage          tool calls           HTTP → LLM API  │
│         │                    │                               │
│  ┌──────┴────────────────────┴──────────────────────────┐   │
│  │                   Webview (iframe)                    │   │
│  │  chat.js ─── ui.js ─── md.js ─── base|chat|controls|session|settings.css │   │
│  │  index.html                                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 模块详解

### 1. extension.mjs — ChatPanel 类

**职责**：扩展入口、会话生命周期管理、设置管理、Webview 创建与消息路由。

**核心状态**：
```js
class ChatPanel {
  _context      // vscode.ExtensionContext（workspaceState 存模型偏好等轻量状态，会话已迁磁盘文件）
  _panel        // vscode.WebviewPanel (聊天 UI)
  _abortController  // 当前的 AbortController（用于取消正在运行的 agent）
}
```

**会话持久化**（与 CLI 共享，同一磁盘位置）：
- 存储位置：`~/.thincoder/sessions/`
- 文件：槽位文件 `session.json.N` + `session.json.manifest`（槽位元数据 + active 指针 + sessionId）
- 目录键：完整 40 位 `sha1(normalizeCwd(cwd))`，其中 normalizeCwd **大写 Windows 盘符**（`d:\…` → `D:\…`）——`uri.fsPath` 会小写盘符，直接 hash 会与 CLI 的 `process.cwd()` 不一致；旧 12 位 hash 文件首访时改名
- 数据结构：槽位文件全量覆盖写，扩展以 `...existing` 展开式透传不认识的字段（activeModel / engineering / engDesignToken 等 CLI 字段往返不丢）
- 废弃方案（pre-release，无迁移）：`context.workspaceState` 的 `thincoder.sessions.<base64(workspacePath).slice(0,32)>`、legacy `messages/` 目录 + base64 文件名 + Memento 索引

**Provider 配置**：与 CLI 共享 `~/.thincoder/config.json`，结构为 `providers[]`（每项 `{ name, baseURL, model, apiKey, chatPath?, maxTokens?, format? }`）+ `activeProvider` 指针；`apiKey` 缺省时回退环境变量。preset 表**以 CLI `config.mjs` 的 `PROVIDER_PRESETS` 为唯一权威**（16 个，含 claude/gemini），VS Code 不再各自硬编码，避免两端漂移。读写逻辑在 `src/extension/config.mjs`（共享 config.json），设置管理 `src/extension/settings.mjs`，会话 I/O `src/extension/session-io.mjs`。首次启动若检测到旧版 VS Code settings 里的 `thincoder.providers`，一次性迁移进 `~/.thincoder/config.json` 后停用 settings 存储。

**模型选择 UI（对齐 CLI 二级菜单）**：主下拉列 provider 行（provider 名 + 右侧当前模型 + `›`），hover 弹出该 provider 的模型 flyout 子菜单，点击模型选中——两级语义对应 CLI `openModelPicker → openModelListForProvider`，因 Webview 无键盘导航改用 hover flyout 实现。主下拉底部含 add / remove / key 管理入口。

**Provider 增删（对齐 CLI）**：`addProviderFlow`（选 preset[过滤已添加] → 自动填 baseURL/model → 输 key；custom 手动输 name/baseURL/model + 选 format）、`removeProviderFlow`（列非 active provider 供删）、`setKeyFlow`（设/改 key）。

**协议 transport**：三种 `provider.format` —— `openai`（默认，SSE chat completions）、`anthropic`（Messages API）、`google`（streamGenerateContent）。三种 transport 均已实现并在 `src/provider.mjs` 的 `TRANSPORTS` 表按 format 分派（含 thinking、tool calls、多模态），可承接 custom 的协议选择及 claude/gemini preset。

**LLM 标题生成**：
- 触发：会话第一条用户消息后，agent 完成回复
- 策略：用任意已配置的 provider 发送简短 prompt（"Generate a concise title"），限制输出 100 tokens；openai 格式显式带 `thinking:{type:"disabled"}`（思考型模型禁用思考，否则 reasoning_content 吃光输出预算——IK9UZ8，需求/设计见 CLI `docs/design/SESSION.md` 变更段）
- 失败静默降级（使用首条消息截断作为标题）

### 2. src/agent.mjs — Agent 主循环

**职责**：多轮工具调用循环，采用与 ThinCoder 一致的架构设计。

**关键参数**：
```js
runAgent(provider, cwd, input, callbacks, signal, autoApprove, opts)
// opts: { depth, role, maxTurns } — 子 agent 上下文
```

**循环控制**：
- 默认最大轮次：100
- Stall 检测：连续 5 轮中工具重复 ≥ 3 次 → 警告注入
- Verify 守卫：顶层 agent 最多 push back 2 次（verify 失败后重试）

**工具结果落盘与写时自清理（2026-08-21）**：工具结果超 16k 字符落盘 `<cwd>/.thincoder/tmp/tool-<id>.txt`，模型只见 2k 预览 + `[Large output saved…]` 路径指引（`offloadToolResult`，CLI parity）。落盘目录写时自清理：每次 offload 写新文件前删除目录内 mtime 超过 3 天（`TMP_RETENTION_MS`）的文件——子目录不动、异常静默；同目录的 paste-* 粘贴图片临时文件一并按此回收。需求与用例见 CLI `docs/design/ARCHITECTURE.md`「落盘目录写时自清理」——**清理逻辑**两端逐行等价、CLI 为准；落盘目录两端各自为政（CLI `~/.thincoder/tool-results/`、VS Code `<cwd>/.thincoder/tmp/`）。实现 `src/agent/run-helpers.mjs`（sync 版 readdirSync/statSync/unlinkSync），测试新建 `test/run-helpers.test.mjs`。

**上下文注入（顶层）**：
```
[System: working directory snapshot]
[System: project dependency outline]
[System: AUTO mode active]          ← 当 autoApprove 为 true 时；每次循环迭代动态检查（live getter，CLI parity）——
                                       approve-all / AUTO 按钮在轮次中途翻转后，下一条注入即生效
user input
```

**子 agent 支持**：
- `depth=0`：顶层 agent，拥有完整工具集 + meta 工具
- `depth=1`：子 agent，role 模式相关（非工程 explore/plan/coder，工程 explore/plan/eng-coder，见下文「subagent role 枚举按模式覆盖」），工具集缩减，prompt 叠加角色 overlay
- explore/plan：只读工具；coder：完整工具
- 轮次上限对齐 CLI：统一取共享 config.json 的 `agent.subagentTurns`（默认 100），顶层轮次取 `agent.maxTurns`（默认 100）

### 3. 工具系统（`src/tools.mjs` → `src/tools/`）

**设计原则**：每个工具 `{ name, description, parameters, execute(ctx) }`，统一的工具接口规范。`tools.mjs` 是 re-export 入口，实现拆分到 `src/tools/` 子目录（`file.mjs`, `system.mjs`, `git.mjs`, `web.mjs`, `patch.mjs`, `index.mjs`）。

**VS Code 适配增强**：
- `write` / `edit`：写入后自动在编辑器中打开文件（`workspace.openTextDocument` → `window.showTextDocument`）
- `bash`：继承终端 shell 环境，`cwd` 默认为第一个 workspace 文件夹
- 路径解析：相对路径相对于 `ctx.cwd`（workspace 根目录）

**路径安全**：
- `resolvePath(path, cwd)` → 拒绝 `../` 跳出 workspace 的路径
- 绝对路径仅在 cwd 子树内放行

**工具清单（20+）**：
| 分类 | 工具 |
|------|------|
| 文件 | `read`, `write`, `edit`, `insert_after`, `delete`, `lint`（CLI 级联）, `checklist` |
| 搜索 | `glob`, `grep`, `ls`, `code_search`, `doc_search` |
| Git | `git`（统一工具，action 子命令：diff/status/log/show/checkpoint/...） |
| 系统 | `bash` |
| 网络 | `websearch`, `fetch` |
| 交互 | `question` |
| 媒体 | `read_image` |
| 补丁 | `apply_patch` |
| 代码智能 | `lsp`（VS Code 原生语言服务）, `execute`（vm 沙箱 JS） |
| 元工具 | `task`, `recent_changes`, `subagent`, `plan`, `goal`, `skill`, `verify`, `timer`, `advisor`, `eng` |

**lsp（VS Code 原生实现）**：CLI 的 lsp 工具自起 LSP server 进程（JSON-RPC over stdio，需 config.json `lsp.servers` 配置）；VS Code 侧直接用编辑器自己的语言服务（`vscode.executeDefinitionProvider` / `executeReferenceProvider` / `executeHoverProvider` / `executeDocumentSymbolProvider` + `languages.getDiagnostics`），无需配置、无需进程管理，任何装有语言扩展的语言都可用。子命令与 CLI 一致：definition / references / hover / symbols / diagnostics。

**advisor / eng（与 CLI 同源移植）**：
- `advisor`：独立只读评审子代理，工具集 = read/glob/grep/ls/git_diff/git_status/git_log/code_search（CLI 另有 lsp，VS Code 侧待补，见 TODO.md）。收敛协议（round 1 全量 → round 2 验证+新明显问题 → round 3+ 严格验证，机械上限 5 轮）、会话内 `_advisorSession` 复用、`.thincoder/advisor.md` 自定义标准、advisor guard pushback（最多 3 次）——全部与 CLI 一致。
- `type='design'` 设计评审：生成 HMAC 签名 design token（1 小时过期），advisor 仅在无 🔴 时回显 `[DESIGN-TOKEN:…]`，回显即签发 token 给 eng-coder。
- `eng`：工程模式开关。**engineering 与 advisor.guard 都是会话级（2026-08-29 重构，详见 CLI `docs/design/ENGINEERING-MODE.md`「会话级模式开关」——单一权威源）**：事实源是当前会话槽位文件（slot 显式值 > config.json 兜底 > false），config.json `agent.engineering` / `agent.advisor.guard` 降为 CLI 兼容镜像（双写保留）。工程模式下主代理 system prompt 换成 `engineering.md` + 项目 METHODOLOGY.md，dispatch 门禁机械拦截 design review 通过前的代码文件写入（docs/** 豁免），`eng-coder` 子代理须持 token 才获写权限（spawn 时校验 + 运行时门禁双保险）。
- 工程状态持久化：`engineering`/`advisor.guard` 进会话槽位文件（面板 toggle 双写、`engPersist: { cwd, slot }` 通道、`agentState()` 每 turn 随 `saveLines` 落盘），config.json 镜像；`engDesignToken` 进会话槽位文件（`_advisorRound` 为 per-run，不持久化，与 CLI 一致）。

**提示词借鉴增量（kimi-code 对照，2026-08-21）**：explore 彻底度分级（quick/medium/thorough，prompt 约定形态）+ system.md 确认理解补"列出最重要的验收标准"。需求/设计/测试/文件清单见 CLI `docs/design/AGENT-LOOP.md`「## 10. 提示词借鉴增量」——两端 `src/prompts/` 改动保持 byte-identical，subagent 工具 description 两端各自同步语义。VS Code 端受影响文件：`src/prompts/explore.md`、`src/prompts/main.md`、`src/prompts/system.md`、`src/agent-tools/subagent.mjs`、测试、`CHANGELOG.md`。

**开工前计划确认纪律（2026-08-21）**：任何写代码/写文档动作前纯文字复述"理解+计划"并等用户明确确认，无豁免（普通模式 + 工程模式；子 agent 不适用）。需求/设计/测试/文件清单见 CLI `docs/design/AGENT-LOOP.md`「## 11. 开工前计划确认纪律」——两端 `src/prompts/system.md`、`engineering.md` 保持 byte-identical。VS Code 端受影响文件：`src/prompts/system.md`、`src/prompts/engineering.md`、`test/agent.test.mjs`、`CHANGELOG.md`。

**subagent 活动流修复（2026-08-22）**：

- **需求**（用户报告，仅 VS Code 端）：① 同一 turn 多次调用 eng-coder 时，后续调用的活动流继续显示在第一个 eng-coder 块里（应每次调用独立一块）；② eng-coder 块只有工具调用输出，无 reasoning 也无主输出 token。
- **设计**：`src/agent-tools/subagent.mjs`——① 面板通道名 `sub:${role}` → `sub:${role}#${subId}`（webview `_subBlocks` 按 name 复用块的根因；resume 续跑 subId 不变，块不重复）；② `baseOpts` 加 `streamOutput: true`（agent.mjs 的 onToken depth gate 豁免，escalate 同款）；③ runAgent 调用的 `onToken` 改为累加 + `panel({ kind: "text", text: t })`，新增 `onReasoning: (r) => panel({ kind: "think", text: r })`（agent.mjs 的 onReasoning 无 gate，传了就流）。`webview/chat.js` 的 `subagentChunk` 无需改动（按 name 建块，标题自动显示 `eng-coder#N` 可区分多次调用）。CLI 端无此问题（relay 前缀已含 role#id），不涉及。
- **测试**（`test/subagent.test.mjs` + webview 测试）：① panel 通道名含 `#${subId}`（单测 execute 的 onToolPanel 捕获）；② onToken 转 panel kind=text、onReasoning 转 panel kind=think；③ webview `subagentChunk`：`sub:eng-coder#1` 与 `sub:eng-coder#2` 各自建独立块、`_subBlocks` 两个 key；④ 回归：全量测试通过。
- **受影响文件**：`src/agent-tools/subagent.mjs`、`test/subagent.test.mjs`、webview 测试文件（`test/webview-lib.test.mjs` 或 `test/ui.test.mjs`，选现有 subagentChunk 覆盖处）、`CHANGELOG.md`。


**文档归属纪律 + advisor 设计评审增强（2026-08-21）**：文档地图（`docs/design/README.md`，两端各建）+ system.md 归属纪律（找到就改、新建须登记、单一权威源引用不复制）+ advisor-design.md 加 Document ownership 维度（矛盾表述 🔴、碎片化 🟡）与引用纪律 + fallback 转硬加载。需求/设计/测试/文件清单见 CLI `docs/design/AGENT-LOOP.md`「## 12. 文档归属纪律 + advisor 设计评审增强」——两端 prompts 保持 byte-identical。




**advisor 开关语义重构（对齐 CLI AGENT-LOOP.md §8，2026-08-21）**：

- **需求**：`advisor.enabled` 是双义开关——既 gate 评审能力（非工程模式 enabled=false 时 advisor 工具返回 "not enabled"），又 gate guard 推回。用户拍板：**评审能力恒启用（不设禁用开关），开关语义收敛为 guard，guard 默认 OFF**（评审自愿调用，打开才强制）。工程模式行为不变。
- **设计**：`src/advisor/run.mjs` 删除 enabled gate；`src/agent.mjs` guard 条件 `advisorCfg?.enabled && advisorCfg?.guard !== false` → `advisorCfg?.guard === true`（工程模式豁免保留）；`src/config-io.mjs` guard 默认 `?? true` → `?? false`；`enabled` 字段废弃不再读写（存量不迁移，pre-release 约定，CHANGELOG 说明）。UI：工具栏 ADVISOR 按钮语义改为 guard（消息 `setAdvisorEnabled` → `setAdvisorGuard`，`webview/chat.js` `_advisorOn` ← `settings.advisor.guard`，按钮文案/aria 由 ADVISOR 改为 GUARD）；设置面板删除 `adv-enabled` 开关、保留 `adv-guard`（默认未勾选）；`locales/*.json` 相应文案（`toolbar.advisor` 改 guard 语义，`settings.advisorEnabled*` 移除或改义）。评审 provider 沿用 `resolveAdvisorProvider`（未配 advisor.provider → 继承主 provider，恒启用零障碍）。
- **测试**（更新 `test/advisor.test.mjs` / `test/settings.test.mjs` / `test/settings-panel.test.mjs` / `test/chat-panel.test.mjs`）：① 无任何 advisor 配置时调 advisor 正常执行（不再 "not enabled"）；② `{ advisor: {} }` 改代码收尾不推回（guard 默认 OFF）；③ `{ advisor: { guard: true } }` 改代码未评审收尾推回 "MUST get an advisor review"；④ 工程模式豁免不变；⑤ `{ advisor: { enabled: true } }` 不再触发推回（enabled 废弃）；⑥ 面板开关读写真值：`saveAgentSettingsFromPanel({ advisor: { guard: true } })` → config.json `advisor.guard === true`，enabled 不再写入；⑦ `agentSettings()` 返回 guard 供按钮/面板反射。
- **受影响文件**：`src/advisor/run.mjs`、`src/agent.mjs`、`src/config-io.mjs`、`src/extension/panel-messages.mjs`、`src/extension/settings.mjs`、`webview/chat.js`、`webview/settings.js`、`webview/index.html`、`locales/en.json`、`locales/zh.json`、`AGENTS.md`（消息协议表 setAdvisorEnabled 行）、`test/advisor.test.mjs`、`test/settings.test.mjs`、`test/settings-panel.test.mjs`、`test/chat-panel.test.mjs`、`test/agent.test.mjs`（补 loop 级 guard 推回用例 ②③④⑤ 的 VS Code 侧断言——agent.mjs 内联 guard 逻辑需本端测试兜底，不依赖 CLI 侧）、`CHANGELOG.md`。CLI 端文件清单见 CLI AGENT-LOOP.md §8（两端逐行等价，CLI 为准）。

**subagent role 枚举按模式覆盖（对齐 CLI setup.mjs）**：

- **需求**：非工程模式下 `subagent` 工具的 role enum 仍展示 `eng-coder`（VS Code 侧漏了 CLI 的按模式覆盖），模型看见"design-driven"角色后可用公开工具自主走完解锁链（`eng(enter)` → `advisor(type='design')` 拿 token → 派生 eng-coder 写码），造成"非工程模式盗用 eng-coder"。修复目标：非工程模式 schema 不展示 `eng-coder`；运行期硬门禁保持不动。
- **设计**：`src/agent-tools/subagent.mjs` 新增导出 `modeRoleField(engineering)`（纯函数，文案与 CLI `setup.mjs` 逐字一致）。**返回形状 `{ role: { type: "string", enum, description }, suffix: string }`**——`role` 整体替换 schema 的 `parameters.properties.role`（role 自身的 description 即模式相关文案），`suffix` 拼接到工具级 description 末尾（非工程 suffix 为 `""`）。两态取值——非工程：`role.enum = ["explore","plan","coder"]`、role 描述注明 "'eng-coder' is disabled in normal mode"、`suffix = ""`；工程：`role.enum = ["explore","plan","eng-coder"]`、role 描述注明 "'coder' is disabled in engineering mode"、`suffix = "In engineering mode, use role='eng-coder' for implementation (coder is disabled)."`。`src/agent.mjs` 将 `toolSchemas` 的构建从紧邻 tools 数组处**移到 `engineering` 计算之后**（以符号锚定：`const engineering = engState?.enabled ?? cfgEngineering` 之后），对 depth 0 的 subagent schema 应用 `modeRoleField(engineering)`；其余参数（designToken 等）不变。`subagent.mjs` 的 engineering/role 互斥 throw 与 `execute-tools.mjs` 的 eng-coder 写门禁**原样保留**（schema 覆盖只是第一道防线，不替代运行期校验）。
- **范围外**（记入 TODO.md，本变更不实现）：`eng(enter)` 的用户同意门、design token 的用户批准点、拒绝文案降噪（CLI 侧同样存在，两端待议）。
- **测试**（`test/subagent.test.mjs`）：① `modeRoleField(false)` → enum 含 coder、不含 eng-coder，role 描述含 "disabled in normal mode"，suffix 为空；② `modeRoleField(true)` → enum 含 eng-coder、不含 coder，role 描述含 "disabled in engineering mode"，suffix 指名 role='eng-coder'；③ 门禁回归：非工程 + `role='eng-coder'` 仍 throw "Engineering mode is not active"；④ 接线层测试：depth 0 构建出的 subagent schema 在非工程模式 role enum 不含 eng-coder、含 coder，工程模式不含 coder、含 eng-coder；⑤ 互斥回归：工程模式 + `role='coder'` throw "Engineering mode: use role='eng-coder' for implementation tasks."。
- **需求→用例映射**：需求「非工程模式 schema 不展示 eng-coder」→ ①④；「工程模式 schema 不展示 coder」→ ②④；「运行期硬门禁保持不动」→ ③⑤。

### 4. LLM 调用层（`src/provider.mjs` + `src/provider/rate.mjs`）

**职责**：OpenAI 兼容的流式 chat completion，自动重试与退避。

**重试策略**：
- 网络错误：最多 3 次，退避 [1s, 4s, 12s]
- 429 限频：读取 `Retry-After` header，最多 3 次
- 5xx 服务端错误：退避重试最多 3 次

**流式处理**：
- 原生 `fetch` + `response.body.getReader()`
- 逐行解析 SSE (`data: {...}`)
- 支持 `reasoning_content` (DeepSeek/Kimi thinking)
- 支持 `usage` chunk (token 统计)

**模型能力适配**（`src/config.mjs`，自包含）：
- `thinking.type`：Kimi/GLM 的思考 API
- `reasoning_effort`：DeepSeek 的推理强度
- `maxOutput`：输出 token 上限
- `tempRange`：温度范围钳制
- `reasoningEcho`：thinking token 回传策略

### 5. src/context.mjs / src/compact.mjs — 上下文管理（code review #6：压缩/蒸馏逻辑 2026-08 拆至 compact.mjs，本节为两文件共同语义）

**上下文压缩**（与 CLI 统一规范，见 thincoder `docs/design/CONTEXT-COMPACTION.md`；实现主体 = `src/compact.mjs`——compactHistory/truncateFallback/shrinkOversized/摘要/蒸馏/§8 ≤1K/§9 预算与 `tailStartByBudget`，context.mjs 保留 doc 注入等非压缩职责）：
- 触发：仅安全点（history 末尾为 user/tool）且完整 prompt 估算 ≥ 阈值；**实测优先**——上次响应的 `usage.prompt_tokens` 为基线，之后的消息按增量估算（无基线时 system+tools+history 纯估算）
- 阈值：显式 `agent.compactThreshold` 优先，否则 auto = 模型 context × **0.6**（为注入上下文与输出/reasoning 留余量）
- 策略：无 head（KEEP_HEAD=0——最早消息可能是已完成的旧任务，锚点留给当前任务）+ LLM 摘要（thinking 关闭，对前端静默；**摘要目标 ≤1K tokens**，CONTEXT-COMPACTION §8 D13）+ tail（窗口自适应 `max(10, ctx/100K×30)` ≤40% 历史，orphan tool 拉回 owner；**再受 15% token 预算约束** §9 D-T1/D-T2——超预算 pair-safe 前移 tailStart、保底 10 条）
- 降级链：摘要 LLM 失败 → 连续 3 次后 `truncateFallback` 确定性截断（无 LLM 调用）；无 middle 可切 → `shrinkOversized` 单消息截断
- 压缩后回注：task 列表（先清旧注入去重）+ plan mode + AUTO/permission reminder
- 空响应（reasoning 耗尽/输出截断）：注入 reminder 重试，上限 2 次，仍空才抛错（IK60QP，CLI 同语义）

**仓库大纲**：
- 扫描 `.js/.mjs/.ts/.jsx/.tsx` 文件
- 解析 `import` / `export` 语句
- 构建文件级依赖图
- 输出格式：目录依赖 + Hub 文件（被最多文件导入的）+ 入口点（不被其他文件导入的）

### 6. Webview 前端

**文件结构**：
- `index.html`：Webview shell，引用 5 个 CSS 文件（base, chat, controls, session, settings）和 `chat.js`
- `chat.js`：主逻辑 — 状态管理、事件处理、消息渲染控制、模型选择器、历史面板、设置面板
- `ui.js`：DOM 构造 — 欢迎页、消息气泡、工具调用卡片、loading 指示器
- `md.js`：Markdown → HTML 转换（代码块高亮、inline code、链接）

**消息流**：
```
用户输入 → chat.js:send()
  → vscode.postMessage({ type:"userMessage", text, model, reasoning, provider, images? })
    → extension:_chat()   — images: 粘贴图 dataURL[] 先落盘 <cwd>/.thincoder/tmp/paste-*.<ext>（image-handler.mjs），路径[] 下传
      → runAgent() [agent 循环] — setupAgentRun 在用户消息尾部追加 "[Attached images: …] — use the read_image tool"（GitHub thincoder#3 方案 B，图片走 read_image 工具通路）
        → onToken → webview.postMessage({ type:"token", text })
        → onToolCall → webview.postMessage({ type:"toolCall", name, args })
        → onToolResult → webview.postMessage({ type:"toolResult", name, text })
        → onComplete → webview.postMessage({ type:"complete" })
```

## 扩展点

| 功能 | 状态 | 备注 |
|------|------|------|
| Memory 三层体系 | ✅ 基础 | 文件式 markdown 条目 + frontmatter（CLI 条目格式兼容，put/search/list/remove）；配 embedding key 时走向量语义检索，否则关键词回退；不依赖 sqlite |
| MCP 支持 | ✅ | stdio + HTTP/WS transport，工具**动态展开为原生工具**（`{server}_{tool}` 前缀，CLI parity——统一规范见 thincoder `docs/design/MCP.md`；旧 `mcpTool` 网关已废弃）。配置存 `~/.thincoder/config.json` 的 `mcp.servers[]`（面板 Settings 可管理；旧 `thincoder.mcpServers` 设置已随迁移删除） |
| Checkpoint | ✅ | 全量副本快照（~/.thincoder/checkpoints/，CLI 同存储）+ list/create/rewind/cat/versions，单文件恢复（详见 CLI docs/design/CHECKPOINT.md） |
| Image input | ✅ | `read_image` 工具（多模态模型支持：Kimi K3、Qwen、GPT-4o、MiniMax M3、GLM-5.3-Flash；文本模型发送侧自动剥离图片部分）。**粘贴/拖拽/附加按钮**（GitHub thincoder#3 方案 B，2026-08-29）：webview 传 dataURL → 扩展端落盘 `<cwd>/.thincoder/tmp/paste-*.<ext>`（image-handler.mjs，随 offloadToolResult 的 mtime 清理回收）→ 用户消息追加 `[Attached images: …]` 指针（setup.mjs，非多模态模型直接 throw）→ 模型调 `read_image` 走工具通路带图进载荷 |
| Skill 系统 | ✅ | 读取 `.thincoder/skills/` 目录下的 .md 文件，列表注入上下文 |
| 权限审批 UI | ✅ | webview 逐工具弹窗（approve / deny / approve-all + diff 预览）；autoApprove 是**会话级槽位字段**（与 CLI 共享），AUTO 工具栏按钮或 approve-all 翻转它；agent 循环以 live getter 读取——轮次中途翻转立即停掉后续弹窗（2026-08-13 修复） |

## 与 thincoder CLI 的差异

两个产品共享设计理念、提示词体系，以及**会话数据与配置数据**（同一磁盘位置、互相读写）。代码各自独立、安装独立、无运行时依赖。

| 方面 | CLI | VS Code |
|------|-----|---------|
| 用户界面 | 裸 ANSI TUI (~24 模块) | Webview (iframe) |
| 会话存储 | `~/.thincoder/sessions/`（共享，槽位按需递增、无上限） | 同上（共享同一目录） |
| 工具目录约束 | 工作目录 (`process.cwd()`) | 第一个 workspace 文件夹 |
| 文件打开 | TUI 内显示 | VS Code 编辑器标签页 |
| 权限审批 | TUI 内交互式（y/n/a；a = approve + AUTO ON） | webview 逐工具弹窗（approve / deny / approve-all）；autoApprove 会话级槽位字段，两端语义一致 |
| 配置存储 | `~/.thincoder/config.json`（共享） | 同上（共享同一文件；apiKey 回退环境变量） |
| 记忆系统 | 3-layer FTS5 + vector | 文件式 markdown 条目（CLI 兼容格式；可选向量检索，无 FTS5） |
| MCP | ✅ | ✅ stdio + HTTP（`~/.thincoder/config.json` 的 `mcp.servers[]`） |

> **字段往返完整（已落地）**：共享槽位文件是全量覆盖写。`chat-panel._saveLines` 现以 `...existing` 展开式透传（不认识的字段原样保留），仅覆盖扩展自己拥有的字段——CLI 写入的 `activeModel`/`engineering`/`engDesignToken` 等字段在 VS Code 侧往返不丢。契约详见 CLI `docs/design/ARCHITECTURE.md`「会话存储统一 → 字段往返完整」。


## 变更段（2026-08-22 · 需求层）

> 来源：GitHub thincoder#2、Gitee #IK9UZ8（同修引用）。

### GitHub thincoder#2 · GLM 5.3 畸形 tool_calls 解析崩溃（LLM 调用层）

**总体需求**：OpenAI 兼容 SSE 流中畸形 `tool_calls`（数组含 null 元素、缺 `function`/`name`/`id`/`index`）不再导致扩展崩溃或静默丢工具；防御性解析 + 可读告警。现状：`transports/openai.mjs` `parseStream` 循环零防御——`tc.index`/`tc.id` 对 null 元素直接抛异常；空 name 向下游传播（`execute-tools.mjs` 静默丢工具、`compact.mjs:185` `tc.function.name` 二次崩溃）。

**功能性需求**：
- F1 自定义 provider（如一步 GLM 5.3）用户，模型返回非标准 tool_calls 时扩展不崩溃，其余正常工具调用继续执行。
- F2 修复（parseStream 单点防御）：跳过 null/非对象元素；缺 `id` 合成 `call_N`；缺 `name`（function 缺失或 name 空）的调用丢弃并记录；缺 `index` 追加到数组尾部；结果过滤 name 为空的 slot。
- F3 下游安全审计：`execute-tools.mjs`、`compact.mjs` 对缺 name 调用保持安全（现状部分防御，一并审计补齐）。
- **范围边界**：仅防御与降级，不替模型修复语义；告警形式（机读线提示）设计层定。

**非功能性需求**：
- NF1 性能：解析热路径无新增开销（O(n) 过滤）。
- NF2 测试：单测锁定 4 种畸形负载（null 元素、缺 id、缺 name、function 为 null）。

### IK9UZ8 · 标题生成同修（引用）

需求与设计见 CLI `docs/design/SESSION.md` 变更段（单一权威源，本文件不复制）。本仓库改动点：`src/extension/generate-title.mjs`（§模块详解·1 "LLM 标题生成" 段的机制描述随设计层同步更新）。

### GitHub thincoder#2-D · 设计层

**方案**：parseStream 单点防御（跳过/补缺/过滤）+ 流结束收尾。**两端同修**：CLI `src/provider/sse.mjs` 解析循环（line 54-58 非流式 JSON 分支、line 99-103 流式分支）同病——CLI 侧权威设计见 `thincoder/docs/design/PROVIDER.md` §10 变更段（本文件不复制）。

**防御算法**：与 CLI 端同一规格（独立仓库不共享代码），完整算法与收尾逻辑见 CLI `thincoder/docs/design/PROVIDER.md` §10——本仓库 `src/provider/transports/openai.mjs` 的 `parseStream` 按同规格实现（跳过 null/非对象元素并计数、缺 id 收尾合成 `call_N`、缺 name 丢弃、缺 index 追加尾部、非字符串 arguments 走 JSON.stringify、返回 `droppedToolCalls`）。

**告警通道**（本仓库，**两端统一策略：告警进机读线、不进人读线**——模型需知道其工具调用未执行）：
- `response.droppedToolCalls > 0` 时 `agent.mjs` 在 pushReal assistant 消息后向 `history`（机读线）push 一条 user 角色提示 `[System reminder: N malformed tool_calls from the provider response were dropped (non-standard provider format).]`（与 CLI 端 `_warnings` 注入同语义；人读线不写）；`panel-chat.mjs` 不改
- CLI 侧告警通道见 CLI `PROVIDER.md` §10

**F3 下游安全审计结论**（本仓库）：
- `execute-tools.mjs:27-28`：parseStream 过滤后 `tc.name` 恒有值；未知工具名 `toolByName.get()` 返回 undefined，后续 `tool?.readonly` 已安全——**无需改**
- `compact.mjs:185` `tc.function.name`：history 内 tool_calls 由 `agent.mjs:575` 构造（完整对象）——安全；顺手加 `tc.function?.name ?? tc.name` 守卫（一行，防御未来输入源变化）
- `provider.mjs:182-188` 续跑合并：输入来自 parseStream 已过滤结果——安全，无需改

**受影响文件**（本仓库；CLI 侧文件清单见 CLI `PROVIDER.md` §10）：
- `src/provider/transports/openai.mjs`（parseStream + 收尾）
- `src/agent.mjs`（droppedToolCalls 机读线告警注入）
- `src/compact.mjs`（一行守卫，可选）
- 修改 `test/provider.test.mjs`（已有 tool_calls 解析用例区追加）

**关键决策**：过滤丢弃而非报错——畸形调用无法可靠执行（缺 name 无从路由），静默崩溃/空转更差；合成 id 而非复用 index——保证 `tool_call_id` 配对唯一性；两端同修（CLI parity 是既定纪律，sse.mjs 同病）。决策记录统一在 CLI `PROVIDER.md` §10。

**测试用例表**（映射 F1/F2 + NF2）：

| # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | `delta.tool_calls: [null, {index:0,id:"a",function:{name:"read"}}]` | 不抛异常；null 跳过计数 1；read 正常入列 | F2 |
| T2 | 正常 tc 但无 `function`（`{index:0,id:"a"}`） | 丢弃该 slot（name 空），计数 1 | F2 |
| T3 | tc 无 `index`：第一段 `{id:"call_1",function:{name:"read",arguments:"{\"a\":"}}`、第二段 `{function:{arguments:"1}"}}`（纯增量） | 按 id 归并 + 尾槽延续：单槽、arguments 拼接正确 | F2 |
| T4 | tc 无 `id` | 收尾合成 `call_N`，与 tool 消息配对不 400 | F2 |
| T5 | `function: null` 的 tc | 不抛异常，丢弃计数 | F2 |
| T6 | `arguments` 为对象（非字符串） | JSON.stringify 追加，不产生 `[object Object]` | F2 防御 |
| T7 | 混合负载：1 正常 + 2 畸形 | 正常执行；`droppedToolCalls=2`；机读线 1 条告警 | F1 |
| T8 | 回归：现有 provider.test.mjs 的 tool_calls 解析用例全过 | 无破坏 | 范围边界 |
### 子agent/advisor 模型显示（2026-08-26 · 需求层）

**总体需求**：会话界面必须展示子 agent 与 advisor 实际使用的模型——防止"模型悄悄换掉"造成认知断层；两端对称交付（2026-08-23 功能批次：CLI CHANGELOG 0.12.41 / 本仓库 CHANGELOG 0.1.46）。现状盘点：子 agent 面板行 `role · model` 已实现可用；advisor 块标题期望 `advisor round N · model`，自 0.1.46 起**从未生效**（实现断链，见设计层）。

**功能性需求**：
- F1 advisor 评审块标题显示实际使用的模型，格式 `advisor round N · model`（与主 agent 同模型时同样显示——显式优于推断）。
- F2 子 agent 活动流面板行显示 `role · model`（已实现，2026-08-23）。
- **范围边界**：不改模型解析逻辑（`resolveAdvisorProvider` / `effectiveSubagentModel` 单一解析源维持）；不移植 CLI 的 `[model]` 字符串 token 机制。

**非功能性需求**：
- NF1 消息契约完备性：`toolPanel` postMessage 载荷凡 chunk 携带的展示字段一律透传，桥处不得静默丢字段（本次审计暴露的缺陷类型）。
- NF2 链路级回归测试：锁**桥**（扩展端 → postMessage），断言 `model` 语义字段而非渲染字符串。

### 子agent/advisor 模型显示 · 设计层（2026-08-26）

**消息契约**（本段为单一权威源）：
- `onSubagent(info)` → `{ type:"subagent", ...info }`——展开透传，`model` 随行（已实现；webview `panels.js` `handleSubagentMessage` → `renderSubagentPanel` 显示 `role · model`）。
- `onToolPanel(name, chunk)` → `{ type:"toolPanel", name, kind, text, round, model }`——显式白名单字段（修复后）。
- webview `advisorChunk(m)` 渲染 `round + (m.model ? " · " + m.model : "")`（已实现，此前因桥缺失恒空）。
- **演进先例**：新增展示字段需同时落三个点——发射端 chunk / 桥 postMessage / webview 渲染端（本次断链即只改两点、漏桥）。

**断链根因**：2026-08-23 commit `948ad70`（"show subagent/advisor model in webview"）只改了发射端（`advisor.mjs:137` start chunk 带 `model`）与渲染端（`streaming.js` 消费 `m.model`），**未改桥**——`panel-chat.mjs` `onToolPanel` 的 postMessage 只带 `type/name/kind/text/round`，`model` 从发布首日起被丢弃。该 commit 自带 84 行测试全为 git/execute 工具用例，桥字段零覆盖，故全绿发布。

**方案**：
- `src/extension/panel-chat.mjs`：提取并导出**纯函数 `toolPanelPayload(name, chunk)`**——kind/text 的 string/对象推导与白名单载荷 `{ type, name, kind, text, round, model }` 统一在此构造；`onToolPanel` 闭包改调它再 `postMessage`（行为不变，仅新增导出缝）。修复点即载荷补 `model: chunk?.model`——string 兼容分支下 `chunk?.model` 恒 undefined，安全；webview 三元渲染自然降级为空。（2026-08-26 交付评审 #1：string 兼容分支无生产触发路径，须直测纯函数方可覆盖——用户批准 (a) 此重构。）
- 回归测试锁桥：`chat-panel.test.mjs` T1-T3 用真实链路（scripted provider + stub webview）捕获 `{ type:"toolPanel" }` 载荷，断言 `advisor` start chunk 的 `model` 字段透传；T4 直测 `toolPanelPayload` string 分支。
- 渲染端锁定：`test/advisor-webview.test.mjs`（T5）**收编进 package.json test 脚本**——曾缺席 `npm test` 导致 T5 永不执行（交付评审 #2），并入后 CI 实际运行。

**受影响文件**：
- `src/extension/panel-chat.mjs`（提取 toolPanelPayload + onToolPanel 闭包调用，约 3 行重构）
- `test/chat-panel.test.mjs`（桥字段回归 T1-T4）
- `test/advisor-webview.test.mjs`（新建，T5 渲染端）
- `package.json`（test 脚本文件清单收编 advisor-webview.test.mjs）
- `AGENTS.md`（测试段补录该测试文件）

**关键决策**：
- 不移植 CLI `[model]` token：两端渲染架构不同——CLI TUI 直接访问 agent 对象（`resolveAdvisorProvider(agent).model`），webview 只能经 postMessage 收结构化字段；token 在 vscode 无收益且引入新解析面。
- 回归测试锁桥而非渲染端：缺陷类型是"桥丢字段"，测试必须断言 postMessage 载荷；渲染端（streaming.js）逻辑不变、无需改。
- T4 直测纯函数而非真实链路：string 分支无生产触发路径（四个发射端全传对象 chunk，shell 的 string 走 `onToolOutput` 通道），真实链路不可达；`toolPanelPayload` 导出缝使桥字段契约（含防御分支）可单测。

**测试用例表**：

| # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | `onToolPanel("advisor", { kind:"start", text:"", round:1, model:"deepseek-v4" })` | postMessage 载荷含 `model:"deepseek-v4"` | F1 / NF1 |
| T2 | `onSubagent({ id:"a", role:"explore", status:"started", model:"glm-5.2" })` | postMessage 载荷 `...info` 含 model（展开透传不回退） | F2 |
| T3 | `onToolPanel("sub:explore#1", { kind:"text", text:"chunk" })`（无 model chunk） | 载荷 `model === undefined`（对象层 key 存在、JSON 序列化后消失）、不抛错；webview 三元渲染降级为空 | 范围边界 |
| T4 | `toolPanelPayload(name, "raw string")`（string 兼容分支，直测纯函数） | 载荷 `model === undefined`、不抛错 | NF1 / 评审 #1 |
| T5 | `advisorChunk({ kind:"start", round:1, model:"deepseek-v4" })` | 块标题含 `round 1 · deepseek-v4`；无 model 时无 `·` 后缀 | F1 / 评审 #2 |
### Qwen 思考关闭映射（2026-08-28 · 引用）

需求与设计见 CLI `docs/design/PROVIDER.md` §12（单一权威源，本文件不复制机制）。要点引用：qwen3.x（百炼混合思考默认开启）`off` 时请求体无思考控制字段 → 关不掉静默失效；`resolveEnableThinking(provider, spec)` 纯函数按白名单（qwen\* 且 百炼域名）在显式 off（`thinking === null`）时发 `enable_thinking: false`、effort 档位时发 `true`。

本仓库改动点（与 CLI §12 同源）：
- `src/config.mjs`：导出 `resolveEnableThinking`（与 CLI 同构造）
- `src/provider/transports/openai.mjs`：body 组装（reasoning_effort 行附近）注入 `enable_thinking`
- `src/extension/reasoning-mode.mjs`：off 已产 `thinking:null`（显式 off 约定天然一致）；**effort 分支补清 `thinking`（undefined）**——选档位 = 要思考，清 off 标记（评审 #1，与 CLI §12 语义统一，propagate 后 `enable_thinking` 映射为 `true`）

测试：同 CLI §12 用例表 T1-T6（纯函数单测，双端各一份）；T7 冒烟**已由 CLI 侧真实端点闭环**（2026-08-28：`thincoder/test/smoke-qwen-thinking.mjs`，qwenplan/qwen3.8-max：off 无 reasoning / xhigh 有 / 默认无字段=默认思考）——服务端行为已证，vscode 端字段注入由 buildRequest 单测断言（`enable_thinking:true/false` 载荷），双端函数体 parity 互锁，无需重复真实调用。
### GLM-5.3-Flash 模型支持（2026-08-28 · 引用）

需求与设计见 CLI `docs/design/PROVIDER.md` §11（单一权威源，本文件不复制）。补充：图片输入在本仓**全部 spec 驱动**（非硬编码模型表）——`setup.mjs`（spec.multimodal 才挂 read_image）、`provider.mjs` `stripImagesForTextModel`（按 spec.multimodal 剥离/保留），`glm-5.3-flash` spec 已带 `multimodal: true`，故图片输入自动生效；仅 `setup.mjs` 错误提示文案与本文档扩展点列表（行 235）需同步模型清单（2026-08-28 设计评审 #2 处置，扩展点列表已更新，setup.mjs 文案随实现批次）。图片 gate 无代码改动。
### 会话切换竞态修复（2026-08-28 · 引用）

GitHub thincoder-vscode#2 / thincoder#5 同根修复（CHANGELOG 0.8.3）。根因三层：切换零守卫（旧 turn stream 灌新会话视图）、`saveLines` 每次取当前 slot（内容落错槽）、中间态只存 webview DOM。修复按用户决策"**运行中禁止切换**"：switchSession/newSession/deleteSession 三处 `_turnActive` 守卫（warning 拒绝，对齐 `panel-project.mjs` applyProjectSwitch 模式）+ `saveLines`/`_saveLines`/`generateTitle` 加 slotOverride（turn 启动捕获 turnSlot，纵深防御对标 onDistilled 既有 slot guard）。守卫测试 3 例（chat-panel.test.mjs，真实慢 turn + 跨槽零污染断言）。
### 子代理工具描述：角色能力矩阵 + 委派动机（2026-08-28 · 引用）

需求与设计见 CLI `docs/design/AGENT-LOOP.md` §7.1（单一权威源，本文件不复制）。本仓库改动点：`src/agent-tools/subagent.mjs`（description 与 role 参数与 CLI 逐字对齐：Available roles 矩阵 + Mode filtering + Why delegate? 段 + 开发注释泄漏清理）、`test/subagent.test.mjs`（内容断言 probe 10 项 + 防泄漏负断言，与 CLI 同构）。

### deepseek 400 三件套：escape v5 + UTF-16 安全截断 + 续写构造（2026-09-02 · 引用）

需求与设计见 CLI `docs/design/PROVIDER.md` §14（14.7 对齐清单，单一权威源，本文件不复制）。本仓库改动点：

- `src/escape.mjs`：**v5 升级**——`sanitizeLoneSurrogates`（孤立高/低代理 → U+FFFD）+ `sanitizeText` 总入口 + `escapeLiteralEscapes` odd-run 修复 + `escapeMessageContent` 覆盖 `tool_calls[].arguments` / `reasoning_content`
- **UTF-16 安全截断 5 处**（截断点落高代理向前收一码元）：`src/context.mjs`（doc 注入预览 ×2）、`src/tools/code.mjs`（doc_search 预览）、`src/agent/run-helpers.mjs`（`offloadToolResult` 预览/兜底截断 ×2）、`src/compact.mjs`（摘要/蒸馏序列化 ×2）——`safeSliceUTF16` 定义于 run-helpers（CLI helpers.mjs/setup.mjs 同语义，两处独立实现）
- `src/provider.mjs`：**续写构造对齐**——`buildContinuationMessages`（prefix 分支过滤 tool/assistant(tool_calls)、保留 system + ≤8 文本、末条 `prefix:true` + `reasoning_content` 回传；partial 分支全量历史不变）；删除"reasoning 时跳过续写"早退；续写调用 try/catch 注入 `_warnings`（失败不静默；AbortError 透传）

测试：`test/escape.test.mjs`（v5 断言 5 项）、`test/run-helpers.test.mjs`（safeSliceUTF16 + offload/compact 序列化无孤立代理）、`test/provider.test.mjs`（T1-T4：prefix 精简 / reasoning 回传 / partial 不受影响 / 400 可见性）。

### 压缩可见性回调 + webview 状态行（2026-09-02 · 引用）

需求与设计见 CLI `docs/design/CONTEXT-COMPACTION.md` §7（D-C3 对齐形态，单一权威源，本文件不复制）。VS Code 无 TUI 面板——对齐形态 = onCompressStart/onCompressFail 回调 + webview 压缩状态行。本仓库改动点：

- `src/compact.mjs`：`compactHistory` 增 `callbacks`/`agent` 参数——摘要 chat 调用**前**触发 `onCompressStart({ messages: N })`；成功落 `agent._lastCompressInfo = { mode:"summary", tokensFreed, elapsedMs }`
- `src/agent.mjs`：压缩成功 → `onCompress`（完成信息）；catch 分支补 `console.error` + `onCompressFail(error)`（Q3 不再静默）；3 次连续失败降级截断 → `onCompress({ mode:"fallback", tailMessages })`（降级说明与 3 次失败绑定，§7 状态机语义）；回调缺省 no-op（headless 不崩）
- `src/extension/panel-chat.mjs`：三回调 → webview `compress` 消息（start/done/failed/fallback 四态）；`webview/chat.js` + `webview/base.css`：`#compress-status` 状态行（Compressing context…（summarizing N messages）→ Compressed: N tokens freed (Xs) / failed: <错误> / fallback truncated to N messages）；`locales/{en,zh}.json` 新增 `compress.*` 键

测试：`test/agent.test.mjs` V4 组（回调序、完成信息、失败可见性 + console.error、3 次失败降级、无回调不崩）。

### subagent 异步化：async 分支 + 槽位队列 + subagent_check（2026-09-02 · 引用）

> **§19 修订（2026-09-03 实现时标注）：`subagent_check` 工具退役——语义并入 `subagent` 工具的 `action:"check"`（原样保留——arrival order / 阻塞 / n 计数 / 消费删除）——本节保留为 as-of 快照，现状见文末「subagent 工具面合并」段**

需求与设计见 CLI `docs/design/AGENT-LOOP.md` §15（15.6 VS Code 对齐，单一权威源，本文件不复制；CLI 端同批落地，本端与设计同规格实现）。本仓库改动点：

- `src/agent-tools/subagent.mjs`：subagent schema 加 `async` 布尔参数；execute 重构出 `runChild`（同步/异步共享同一子代理管线——relay/turn-cap/权限/mergeChildMutations 全不变）；async 分支：`parent._asyncSubagents` Map + **槽位队列**（running 数 < `ASYNC_SUBAGENT_LIMIT=4` 立即启动返回 `{id, role, status:"running"}`；≥4 入队返回 `{status:"queued", position}`；任一 running settle → 队列头部自动补位——settle 逻辑绑定 entry 自身，不同 execute 调用不串扰）；turn-cap 撞墙自动拒绝继续（不弹 continue 面板）；depth>0 传 async → 报错拒绝
- 新增 `subagent_check` 工具（`readonly: true`）：n 必填 1-based 递增读数（`MAX_ASYNC_CHECKS=3` 防循环；乱序/重复 n 拒绝）；无 id = arrival order 取下一个完成（`Promise.race` on settled）；带 id = 等特定子代理（含 queued 先等启动）；未知/已消费 id → `unknown async subagent id`；全消费 → `{done:true}`
- `src/agent.mjs`：**回合收尾**（finally）——正常退出 await 全部（queued 随腾槽级联启动）→ 报告/错误以 user 角色 reminder 注入双线（XML 转义 + 超长走 offloadToolResult 预览/落盘）→ 清空注册表；signal aborted → 立即清空不注入；ContinueError/其他错误 → 原样保留（resume 下轮收尾顺延）；depth-0 的 map 沿共享 `history` 数组跨 runAgent 调用存活（agent 对象本身 per-run）；`_asyncCheckN` 非 resume 重置
- `src/agent/run-helpers.mjs`：`MAX_PARALLEL_SUBAGENTS` 3 → 4（提示词层上限随 CLI 端同步——两端 prompts 已同步 byte-identical：engineering.md 上限 3→4 / system.md 批量句 / main.md async 句）
- `src/agent/setup.mjs` + `src/agent-tools/index.mjs`：subagent_check 注册（仅 depth-0）

测试：`test/subagent.test.mjs`（T1-T14 VS Code 语义 + depth 门 + 收尾注入 + 中断清空；同步路径全量回归）。

### approval 批确认：同批合并询问（2026-09-02 · 引用）

需求与设计见 CLI `docs/design/AGENT-LOOP.md` §16（16.1 D-B1，单一权威源，本文件不复制）。本仓库改动点：

- `src/agent/execute-tools.mjs`：前置门禁（planMode/工程设计闸）提取为 `preGateBlocked` 单点；新增 `collectBatchPermission`——执行前扫描同一 response.toolCalls 中所有**通过前置门禁、到达权限询问阶段**的非只读工具（depth-0 + 手动模式），≥2 个时一次 `onBatchPermissionRequest({tools, count})`：`approveAll` → 本批放行（按 tc.id 标记）；`deny` → 全批拒绝、无二次询问；`oneByOne`/无 handler → 回退既有逐项通道（`onPermissionRequired` 签名不变，ACP 桥/headless 零波及）；autoApprove 短路不变
- `src/extension/permission-gate.mjs`：新增 `batchPermissionGate(panel)`（队列 + abort 释放语义与逐项门同款）；`src/extension/panel-chat.mjs` 接线 `onBatchPermissionRequest`；`src/extension/panel-messages.mjs` `batchPermissionResponse`（approveAll/oneByOne/deny）
- `webview/permission.js`：`showBatchPermissionRequest` 合并行 UI（"N 个工具需要权限：A、B、C" + approve all / one by one / deny 三选项）；`webview/chat.js` 路由；`locales/{en,zh}.json` `perm.batch.*` 键

测试：`test/permission.test.mjs`（T-B1 一次合并询问 / T-B2a deny 全批 / T-B2b oneByOne 回退 / T-B6 无 handler 缺省 / autoApprove 短路 / planMode 前置门禁不计入批）。
### 工具作用域限制移除（2026-09-02 · 引用）

需求与设计见 CLI `docs/design/TOOLS.md` §10.1（10.1 D-W1..W3/T-W1..W5，单一权威源，本文件不复制）。残留风险声明（权限门禁 + 破坏性快照不变）适用。本仓库改动点：

- `src/tools/execute.mjs`：`isInside` 删除；`resolveBaseDir` 去断言（纯 resolve——workdir 越界正常执行）；scriptFile 越界拒绝删除（可指向 workspace 外文件，bash 一致性）；工具描述 "confined to the workspace" 措辞改 "no directory restrictions"
- `src/tools/git.mjs`：同上（`isInside` 删除、`resolveBaseDir` 去断言、workdir 描述同步）
- `src/tools/exec-prelude.mjs`：**保留**（safe() 的 workspace-root 约束是 execute 内联辅助 API 的 orthopedic guard——同一调用内可经 require()/process 绕过，不产生失败往返；设计定稿枚举未列，照设计不动）
- 逃逸测试更新：`test/execute.test.mjs`（workdir 越界正常执行 / scriptFile 指向外部文件正常执行；prelude 的 Path traversal denied 测试保留）、`test/tools.test.mjs`（git workdir 越界不再拒绝 + T-W1 外部路径 read/write + T-W5 symlink——Windows 无权限时 skip）

### lint 基建零依赖化（2026-09-02 · 引用）

需求与设计见 CLI `docs/design/TOOLS.md` §10.2（10.2 D-L1..L4/T-L1..L4，单一权威源，本文件不复制）。检测能力损失声明（node --check 仅语法级）适用。本仓库改动点：

- `package.json`：devDependencies 删 `@eslint/js` + `eslint`；`scripts.lint` 改 `node scripts/check-syntax.mjs`；`package-lock.json` 经 npm install 更新（eslint 全套移除）
- `eslint.config.mjs` 删除；`scripts/check-syntax.mjs` 新增——遍历 **src/ + test/ + webview/ + scripts/ + extension.mjs**（VS Code 文件集与 CLI 不同），逐个 `node --check`，非零退出汇总报错文件清单（含脚本自检）
- `src/tools/linter.mjs`：eslintCheck 级联删除（js/mjs/cjs/jsx 的 full 级联回退 node --check，TS 保留 tsc）、描述同步
- eslint-disable 注释清理（`src/tools/shared.mjs` / `shell.mjs` / `webview/md.js` / `test/terminal-bash.test.mjs`）；CI `.github/workflows/test.yml` 的 `npx eslint` 改 `npm run lint`
- `src/prompts/discipline.md`：lint 行 "ad-hoc eslint runs" → "ad-hoc node --check"（两端 prompts byte-identical——**CLI 端需同步镜像**）

测试：`test/tools.test.mjs`（full cascade 对 JS 回退 node --check）。

### 模型上下文长度可配置（2026-09-02 · 引用）

需求与设计见 CLI `docs/design/PROVIDER.md` §15（15.2 D-C1..C5/T-C1..C6，单一权威源，本文件不复制）。本仓库改动点：

- `src/config.mjs`：新增 `providerSpec(provider)`（specForModel + `providers[].context` K 单位拷贝覆盖 ×1024；非法值防御性忽略；specForModel 纯函数不变）；`ctxPercentForModel(promptTokens, provider)` 改 provider 感知（签名变更——webview 状态栏 context % 跟随覆盖值）
- `src/specs.mjs`：re-export `providerSpec`；`src/config-io.mjs`：`resolveProviders` 校验 `providers[].context`（0/负数/非数字 → 删除 + `console.warn` 一次/每 provider，loadConfig 等价校验点）
- 调用方换 providerSpec：`src/compact.mjs`（compactionThreshold + keepTailSize——压缩阈值跟随覆盖）、`src/extension/panel-chat.mjs`（onUsage → ctxPercentForModel(u.prompt_tokens, p)）
- 配置界面 = `~/.thincoder/config.json` 的 `providers[].context`（VS Code 设置 UI 编辑，migrate-settings 同源——`src/config-migrate.mjs` 迁移时透传 context 字段；**不做会话面板入口**，settings 是 provider 配置唯一权威，评审 round2 #10 定死）

测试：`test/agent.test.mjs`（providerSpec 覆盖/非法值/未配置/独立拷贝 + ctxPercentForModel 显示跟随 + T-C2 压缩阈值跟随——同批消息 1M spec 不触发、128K 覆盖触发）、`test/config-io.test.mjs`（resolveProviders 非法值 warn 一次 + 合法保留 + 未配置回归 + migrate 透传）。

### 压缩目标调优：摘要 ≤1K + tail 15% token 预算（2026-09-02 · 引用）

需求与设计见 CLI `docs/design/CONTEXT-COMPACTION.md` §8/§9（8.2 D13-1..D13-4 + 9.2 D-T1..D-T5，单一权威源，本文件不复制；CLI 端同批落地，本端与设计同规格实现）。本仓库改动点：

- `src/compact.mjs`：`SUMMARIZE_PROMPT` 尾句改写（§8 D13-1/D13-2）——删除 "err on the long side" 无界语义 → "Stay under ~1K tokens (≈1000 Chinese chars / 4000 ASCII chars) — a hard target…" 硬目标句 + 砍价优先级整条写入（① 已完成 recap 一行 ② FILES CHANGED why 注释 → 裸路径 ③ 进行中叙述收紧 ④ NEVER cut 设计锚点/UNRESOLVED）；无 max_tokens 机械保险丝（D13-3），既有规则（两清单/COMPLETED vs IN-PROGRESS/honest）全保留（D13-4）
- `src/compact.mjs`：tail token 预算（§9 D-T1/D-T2/D-T4）——新增 `tailStartByBudget(history, provider, tailStart)`：count 公式候选尾 + 既有配对保护之后，估算候选尾超预算（`context×0.15 − SUMMARY_SEGMENT_ESTIMATE=1100`——摘要段 note+占位+~1K 目标固定估算）→ tailStart 前移（旧消息并入摘要段）；**pair-safe 边界**（tool 位置跳过：整对同切，切在中间会 orphan 且预算重新超支）；保底 10 条（floor = len−10，超支接受；短历史候选 <10 → 40% cap 已封顶、预算逻辑 no-op）；`compactHistory` + `truncateFallback` 两路接线（降级路径形状契约一致）；`estimateTokens` 拆出单条 `estimateMessage` 供预算扫描增量裁剪
- 触发阈值 0.6 不变（D-T4：预算只约束压缩结果，不改变触发判据）

测试：`test/agent.test.mjs` §9 组（T-DT1：600K 场景压缩后 history 段估算 ≤15% 窗口 ±5% 容差 + T-DT7 摘要输入 ≤ 0.6×ctx − tail 预算 + T-DT4 摘要指令携带 ≤1K 句；T-DT2 普通会话 tailStart 零变化回归；T-DT3a 保底 10 条超支接受；T-DT3b 短历史候选 <10 无预算逻辑；T-DT6 pair-safe 边界——tool 位跳过、整对进摘要、无 orphan）+ D13 组（T-D13a/b：~1K 硬目标句、无 "err on the long side"、砍价优先级①②③④；既有 SUMMARIZE_PROMPT 断言不回归）。

### tailStartByBudget 倒序配对保护增强（2026-09-02 · 偏差修复，VS Code 独有）

> 来源：偏差审计 2026-09-02。**CLI 端不涉及**：CLI `repairHistory` 在 run 起点保证 tool_calls→tool 正向顺序，其 `tightenTailByBudget` 只跳 tool 位即安全（审计论证）；VS Code 历史流可产生倒序形状（tool 结果块在 assistant 前，2026-08-16 400 事故实证）——REVERSE 保护防的类别，预算收紧在保护之后运行可重新制造。

- `src/compact.mjs`：pair-safe 判据**增强为单一实现**——新增 `callsGapAfter(history, q)`（assistant 位 q 声明的 tool_calls 是否有缺口：ids 未被 q 后连续 tool 块全盖住——与既有 REVERSE 保护同判据）+ `reverseProtectTail`（两处 REVERSE 保护块收敛为同源调用，行为不变）。`tailStartByBudget` 主循环与 floor 回退统一走该判据：倒序配对的 assistant 位（其 results 已切进中段）不停——主循环继续前移（该 assistant 整体并入摘要段，配对在中段序列化无害）；floor 回退继续回退到安全位（保底语义不变：tail ≥ 10 条按消息计数）。

测试：`test/agent.test.mjs` §9 组新增 **T-DT8**（倒序配对 [tool, assistant] + 预算超限——主循环场景边界落在安全位、floor 场景回退越过倒序 assistant 位；断言压缩结果 tail 内每个 assistant(tool_calls) 的 ids 均有对应 tool 结果——无悬空）；T-DT1..7 与既有 REVERSE 保护（`test/tool-pairing.test.mjs`）回归全绿。
### 挂起回合：会话级后台双通道（2026-09-02 · 引用，§17 V2 完整版 + 推进型）
**§17.5 supersede（2026-09-03）**：本段"回合尾 collectSettled 收已完成直注入"的形态在面板驱动下再修订——`collectSettledAsync`（subagent-async.mjs）不再直注入排空（opts.suspDriven——panel-chat 驱动层传）——done 条目留池（settled not consumed）由挂起会话首轮 sweep → digest 消化轮注入（17.5.2/17.5.4 #2，无驱动直连调用方保留直注入兜底）；digest/会话内用户回合消化完成后逐条补发 done 回收驻留块（17.5.5——reclaimDigestedBlocks——块回收与池空解耦——会话退出 freeze 仅兜底未消化残项）。本端改动点见 AGENT-LOOP.md §17.5.2 受影响文件清单。

需求与设计见 CLI `docs/design/AGENT-LOOP.md` §17（17.1 F1-F8/N1-N5、17.3 D-S1..S9/T-S1..S17/AC-S1..S7，单一权威源，本文件不复制）——本端与设计同规格实现（CLI 端先落地，同语义移植）。**核心语义**：回合尾 async 池未空 → 不阻塞等待（回合尾 collectSettled 收已完成直注入、未完成移交池）→ 交互层进入挂起会话——输入放开（Enter = 新回合 / digest 中 Enter 排队 pendingInput）、settle 驱动 auto-turn 消化（手动档 organize-only 禁 spawn/写 / AUTO 档全语义推进）、池空 + 无待处理输入 → 补发冻结自然退出。**与 CLI 的结构差异**：CLI 的池/pending/_suspended 挂 agent 对象（跨 run 存活）；VS Code 的 agent 对象 per-run 重建——全部挂在**共享 depth-0 history 数组**（`_asyncSubagents` / `_pendingAsyncResults` / `_suspended`；JSON 序列化只走数组下标，附加属性不污染会话文件）。本仓库改动点：

- `src/agent.mjs`：runAgent 加 `autoTurn` 选项（§17 D-S6——prepareRun 不 push input + per-run 状态照常重置，CLI `resume || autoTurn` 同款但 autoTurn 不绑定 ContinueError 语义）；run-start **pending 注入**（D-S3 ② 单注入点：`opts.history._pendingAsyncResults` 在 setupAgentRun 前消费——用户回合与 digest 共用；splice 即 consumed）；`_inAutoTurn`（subagent spawn 门读它）+ `_sessionSignal`（会话 children 共享）；手动档消化动作域模板 `AUTO_TURN_DIGEST_DOMAIN` 注入（`autoTurn && !getAuto()`）；`_inheritedGuard`（`INHERITED_GUARD_KEYS`——autoTurn 结束快照 guard 字段，下一用户回合 !resume 时恢复而非重置——digest 的改动不静默漏验）；finally 收尾改 `collectSettledAsync`（D-S1——已 settle 直注入 + 未完成留池，**不再 allSettled 等待**；abort 清池 / ContinueError 留池语义不变；map 沿 history 数组跨 run 存活、排空即释放）；digest 撞 ContinueError → AUTO 自动 resume（§2 统一规则）/ 手动静默停止（部分消化留历史不丢）
- `src/agent-tools/subagent.mjs`：spawn 分档（D-S6/N3——`parent._inAutoTurn && !ctx.getAuto` → 机械拒绝 async + 同步，AUTO 档放行——推进链成立）；settle 回调挂起分流（D-S8 冻结门控 + D-S3 ②——`parent.history._suspended`（共享数组，读取时刻为准）→ 条目移交 `history._pendingAsyncResults` 并从池移除（延迟冻结），非挂起照旧留池回合尾直注入；`entry.signal` = 会话信号优先（aborted 跳过移交——中止清池不注入）；`injectAsyncResult(entry, {history, fullHistory, cwd})` 共享注入器（D-S3 ①/②/③ 三路同形：XML 转义 + 超长 offloadToolResult 预览）；runChild 终态通知按 `terminalStatus()`（挂起期 async settle → `onSubagent settled`——webview 延迟冻结信号）
- `src/extension/suspension.mjs`（**新增**）：挂起会话驱动（D-S2/D-S9 行表——`suspensionSession(panel, entry)`：settle→pending→合并消化轮（多 pending 一轮注入全部，N1）；pendingInput 优先于 digest；池空自然退出（残余 pending ③ 兜底直注入再退 + 落盘）；中止 → 清池不注入）；`poolLive` / `sweepSettledToPending` / `backgroundStatus` 导出；回合执行器经 `entry.runTurn` 注入（panel-chat 装配，避免循环依赖——CLI ctx.runAgent 同款手法）；`panel._susp` 会话句柄 + `panel._suspWake` 单槽唤醒器
- `src/extension/panel-chat.mjs`：`runPanelChat(panel, {…, autoTurn, susp, skipSession})`——挂起会话内回合**复用会话的 live lines**（池/pending/_suspended 随行——重载磁盘会孤儿化池）；回合尾 `poolLive(history)` → 进 `suspensionSession`（skipSession 防重入）；digest 手动档装配 deny stub（D-S7——`onPermissionRequired→false` / `onBatchPermissionRequest→"deny"` / `onQuestion→null`：不弹面板、denied 不悬挂）；digest 不 abort 前一 controller（会话 controller 是池 children 的句柄）、不存模型偏好、不发完成通知；`onAsyncSettled` 唤醒 parked driver；guard-carry 簿记（`panel._guardCarry` → runAgent `inheritedGuard`/`guardCarry` 选项）；autoTurn ContinueError 行（AUTO 自动 resume / 手动静默停）
- `src/extension/chat-panel.mjs`：`_chat` 挂起分流（`panel._susp?.active` → `pendingInput` 队列 + 唤醒——不并发开独立回合）；dispose abort 会话 controller（面板死 = 会话死）
- `src/extension/panel-messages.mjs`：`abort` 挂起分支（中止整个后台会话——会话 controller + 当前回合 + 唤醒，CLI Ctrl+C parity）；`newSession`/`switchSession`/`deleteSession`/`setProject` 挂起期拒绝（会孤儿化池）
- `src/agent/execute-tools.mjs` + `src/agent/setup.mjs`：工具 ctx 透传 `getAuto`（spawn 门读 live AUTO）+ `sessionSignal`；setupAgentRun 支持 `autoTurn`（不 push input——digest 复用 resume 机制但不绑定 ContinueError 语义）
- webview：`webview/panels.js` `handleSuspensionMessage`（D-S8——`settled` 状态行 "done · awaiting digestion"（§7.2.1 F5 挂起例外）驻留面板；`active:false + freeze` → 补发 done 折叠进流；settled 不折叠、done/error 终态即折叠）；`webview/status-bar.js` 后台模式状态行（⏳ 后台 N 子代理 + 待消化计数）；`webview/loading.js`（**新增**——`setLoading` 从 ui.js 拆出：挂起分支输入框永不锁 F7（显式赋值 `on && !susp`，进挂起必重启用；send/abort 双按钮可见）——ui.js 保持 state.js 自由的 leaf 模块，diff.js/settings-*/autocomplete.js 及其测试的静态导入链不被 webview bridge 依赖污染）；`webview/send.js` send 门放宽（`isRunning && !S._suspended` 才拦截——digest 中 Enter 提交由 host 排队）；`webview/streaming.js` `finish` 挂起期不清 activity blocks（跨 digest 存活）；`webview/state.js` `_suspended`/`_suspCounts`；`locales/{en,zh}.json` `sub.awaitingDigest` + `susp.*` 键

测试：`test/suspension.test.mjs`（**新增**——T-S1..S17 VS Code 端同语义实现，用例映射见文件头 + AGENT-LOOP.md §17 用例表：T-S1 回合尾不等 / T-S2 注入不丢（直注入 ①）/ T-S2b 挂起期 settle→pending→prepareRun 前注入（② 单注入点）/ T-S3 挂起态输入可用 / T-S4 叠加 / T-S5 中止清池 / T-S6 自然退出补发冻结 / T-S7 手动档消化 + 动作域模板 / T-S8 禁 spawn 分档 / T-S9 排队续发 / T-S10 权限拒绝不悬挂 / T-S11 合并消化 / T-S12 AUTO 写一致性 / T-S14 中间态渲染 / T-S15 双模式输入 + 输入框零干扰 / T-S16 压缩兜底 / T-S17 settle-during-digest；T-S13 §15 全回归由 `test/subagent.test.mjs` 既有用例覆盖）；`test/subagent.test.mjs` T5 断言随 D-S1 语义更新（collectSettled 收已完成 + 未完成留池——不再 allSettled 等待清空）；`test/ui.test.mjs` 既有 DOM 断言回归（done/error 折叠不变）。
### 挂起唤醒断链修复：`_chat` 挂起分流唤醒错槽（2026-09-02 · 偏差修复，VS Code 独有）

> 来源：偏差审计 2026-09-02。**CLI 端不涉及**：CLI key-handler 唤醒走 `state._suspWake?.()`（对照正确）；VS Code `chat-panel.mjs` `_chat` 挂起分流写的是 `susp.wake?.()`——`susp.wake` 是 `suspension.mjs` 初始化为 `null` 的死字段（全仓无赋值），真实唤醒槽是 `panel._suspWake`（`waitForSettleOrWake` 注入）。后果：挂起会话停在纯等待期（无 digest 运行、子代理在跑）时用户 Enter → 消息入 `pendingInput` 但不唤醒 driver → 须等下一后台 settle 才被处理——违反 D-S9「用户 Enter → 普通新回合」即时性（与 `_chat` 注释矛盾）。不丢消息（下个 settle/退出兜底执行）——延迟缺陷非死锁。

- `src/extension/chat-panel.mjs`：`_chat` 挂起分流唤醒改走 `this._suspWake?.()`——与 settle 回调（panel-chat `onAsyncSettled`）、abort 分支（panel-messages）同槽；`susp.wake` 字段不建不设（避免双槽漂移——单槽唤醒器语义见 suspension.mjs `waitForSettleOrWake` 注释）

测试：`test/suspension.test.mjs` **T-S3b**（新增）——真实 `ChatPanel`（chat-panel.test.mjs 构造手法）+ `suspensionSession` + mock runTurn：挂起纯等待期经真实 `panel._chat("挂起中插话", …)` 消息路径发消息 → driver 被唤醒立即开普通新回合（断言回合先于任何 settle 开跑——子代理全程 running、无 pending 记账；修复前该用例 waitFor 超时失败）；随后 settle → 消化轮 → 池空自然退出（既有 T-S3 语义回归）。既有驱动级 T-S3/T-S5/T-S9 保留不改——状态机行表直接断言回归照旧。
### 挂起回合偏差修复轮：释放窗口竞态 + 中止统一 controller + aborted settle 出池（2026-09-02 · code review #2/#3/#4，VS Code 独有）

> 来源：挂起回合 code review findings #2/#3/#4（AC-S2 风险），修复要求按评审限定 `thincoder-vscode/`；CLI 端对照不在本轮范围（有同类结构差异时由架构师另行评估）。

- **#2 释放窗口竞态**：`runPanelChat` finally（释放 `_turnActive`/`loading`）→ `await panel._generateTitle`（可达秒级）→ 会话入口（`suspensionSession`）之间存在窗口——窗口内用户消息经 `_chat` 的 `susp?.active` 分流不命中 → 直接新开 runPanelChat：新回合 reload 磁盘 lines（新 history 数组与池所在数组分离）+ `panel._abortController?.abort()` 中止外回合 controller → 池 children 全中止 → 后果二选一：(a) aborted settle 不出池（settle 回调 `signal.aborted` 跳过移交也不删 map）→ done 僵尸条目让 `poolLive` 恒真 → 外回合仍进挂起 → 驱动器 waitForSettleOrWake 空转、状态行永远“后台 N 子代理”（僵尸挂起）；(b) 新回合先建会话 → 外回合 `!panel._susp` 门控失败 → 池结果随旧数组静默丢弃。双违 AC-S2。
  - `src/extension/panel-chat.mjs`：挂起决策**先于任何释放点登记**——finally 顶部 `poolLive(history)` 判定置 `panel._suspPending`（`!skipSession && !susp && !panel._susp && panel._panel` 门控同会话入口）；回合尾（generateTitle 之后）消费：池仍 live 且会话 controller 未被中止 → 带队列进 `suspensionSession`（新 entry 字段 `pendingInput`，用户输入优先于 digest——D-S5）；池已空 / Stop 已中止 / 面板消失 → 队列消息以普通回合兜底执行（零丢失）。
  - `src/extension/chat-panel.mjs`：`_chat` 挂起分流新增 `_suspPending` 分支——消息入队 `panel._suspQueue` 等待会话接管（不开并发独立回合）；构造器声明 `_suspPending/_suspQueue/_turnControllers`。
  - **会话 lines 双键形补正**（T-S18 全路径回归实证）：会话入口 `lines` 增 `contextHistory: history`——in-session 回合按 activeLines 契约读 `loadedLines.contextHistory`，缺键使 `history` undefined → onComplete 落盘崩 + run-start pending 注入不消费 → digest 死循环（修复前真实面板路径必炸）。
  - `src/agent-tools/subagent.mjs`：`settleAsyncEntry` **abort 分支出池清理**——`entry.signal.aborted` 项 settle 即从共享 map 移除（不注入 pending——中止不注入陈旧错误）；修复前留 done 僵尸让 poolLive 恒真。
- **#3 会话中止统一 controller**：Ctrl+I / ContinueError / AUTO resume 重建 `panel._abortController` 后，持旧 controller signal 的池 children 仍在跑——会话中止句柄（`susp.abort = panel._abortController`）只取最后一个 → Stop 只 abort 新 controller → 旧 children 跑完整个 turn 预算 + mergeChildMutations 写父 guard 标记被下轮重置清掉（磁盘被改、advisor/verify 门被绕过）。
  - `panel-chat.mjs`：每次 controller 创建/重建登记 `panel._turnControllers`（`newTurnController` 助手；顶层回合起点清空——#2 守卫保证此刻池已空）；`suspension.mjs` 会话入口快照为 `susp.abortControllers` 并清空登记表；`panel-messages.mjs` abort 分支 + `chat-panel.mjs` dispose 统一 abort `abortControllers`（旧 controller children 一并中止——abort 已 abort 的 controller 是 no-op，无害）。
- **#4 死字段清理**：`suspension.mjs` susp 字面量删除 `wake: null`（全仓无赋值无读取——2026-09-02 T-S3b 修复后唤醒走 `panel._suspWake` 单槽）；`chat-panel.mjs:294` 注释保留作历史说明。

测试：`test/suspension.test.mjs` **T-S18**（全路径真实回合——真实 ChatPanel/runPanelChat/runAgent + 子代理慢活 + `_generateTitle` gate：窗口期 `_chat` 入队不并发开回合（无 second-message 请求）、池 controller 不 abort；放行后会话接管——消息在会话内执行、子代理结果注入落盘（AC-S2）、无僵尸）/ **T-S18a**（驱动级 pendingInput 预装载——窗口队列移交 wiring）/ **T-S19**（工具级真实 spawn + abort——aborted settle 出池清理、不注入 pending、poolLive 不恒真）/ **T-S20**（真实子代理持旧 controller + 会话中止——abortControllers 统一 abort，child 中止不逃逸；修复前 waitFor 超时红）。


### 挂起回合 round-2 偏差修复：中止路径排队消息零丢失（2026-09-02 · 引用）

来源：code review round2 #2（VS Code 独有语义）。中止（Stop/Ctrl+C）挂起会话时 digest 期间排队用户消息（已清输入框入 `pendingInput`，用户视为已发送）曾被静默丢弃——原退出兜底被 `!aborted` 门控。

- `src/extension/suspension.mjs` finally：退出兜底（自然退出竞态 + 中止两路径）**无条件消费 `susp.pendingInput` 残余**——中止后池已清空 → 以普通回合 `entry.runTurn(q)` 顺序执行（零丢失 AC-S2）；面板已死（dispose）→ 随会话终止（注释有据）
- `test/suspension.test.mjs` **T-S21**：digest 运行中 2 消息入队 → Stop 中止 → 中止语义照旧 + 排队消息以普通回合按序执行（autoTurn=false、_suspended=false、队列排空）——修复前 `!aborted` 门控下红
- 受影响文件：`suspension.mjs` + `test/suspension.test.mjs`（架构师统一回写变更段；CLI 侧对应修复见 AGENT-LOOP.md §17 偏差修复轮 2——_suspAborted 复位 + 排队消息转队列 + Ctrl+C 两级中止）

### 工程交付协议：eng-coder 默认 async + 内部自审计闭环（2026-09-02 · 引用，AGENT-LOOP.md §18）

需求与设计见 CLI `docs/design/AGENT-LOOP.md` §18（18.1 F1-F7 / 18.2 D-E1..E6 / 18.3 关键决策 / 18.4 N1-N3，单一权威源，本文件不复制）——本端与设计同规格实现。**核心语义**：① eng-coder **角色级缺省 async**（不带 async = async:true——其余角色缺省阻塞不变；`async:false` 显式覆盖同步）；② 交付协议在 **eng-coder 内部闭环**（实现 → explore 偏差审计 → dirty 自修 → advisor 复评 → 收敛 → 一次交付——父侧不再自动二次审计/评审，复核保留可选）；③ eng-coder 内部 spawn **受限**（仅 explore + 同步 + 审计预算 ≤6，第 7 次机械拒绝）；④ spawn 即**任务域授权**（豁免粒度 = 仅 onPermissionRequest 阶段）。**与 CLI 的结构差异**：CLI 的机械门在 `agent/spawn-child.mjs`（gateEngCoderSpawn）与 `dispatch.mjs` 权限阶段；VS Code 的 spawn 管线整体在 `agent-tools/subagent.mjs`（无独立 spawn-child 模块）——同规格实现落同一文件。权限豁免在 VS Code 的既有语义下天然成立（子代理 runAgent 一直以 autoApprove 运行、无逐写面板），无 dispatch 等价改动；粒度保证 = 前置门（JSON 解析/未知工具/planMode/design-token 闸）先于权限阶段运行且原样生效（T-E14）。**本端无 §7「权限」/§15 D-A3 的 blanket 文档句**（AGENT-LOOP.md 的对应句在 CLI 仓，CLI 端同批加"eng-coder 例外见 §18 D-E3"指向——AC-E7）；本端等价记录 = execute-tools.mjs 权限门注释（§18 D-E3 粒度）+ 本节。共享 prompts（engineering.md / engineering-sub.md）两端 byte-identical（CLI 端同批落地，交付前字节对比验证）。本仓库改动点：

- `src/agent-tools/subagent.mjs`：**schema async 描述 = 角色级默认措辞**（D-E1——`role='eng-coder' → true`，async:false 显式覆盖）；execute 解析 `asyncFlag = asyncArg ?? role === "eng-coder"`；新增 `gateEngCoderSpawn` + `ENG_AUDIT_SPAWN_LIMIT = 6`（D-E3 机械门——eng-coder ctx（depth>0 且 `_role==="eng-coder"`）spawn 仅 explore、async 强制同步、第 7 次审计 spawn 拒绝——错误文案即 stalled 信号；在 mode 门之前执行使 eng-coder 专属错误先于通用工程模式错误）；**审计任务书机械追加**（D-E2 ③ round4 #4——eng-coder ctx 的 explore spawn 输入自动附加 `[Audit scope — mechanical context…]`：父 spawn 任务书 verbatim（`agent._engTaskInput`）+ 实际 `_touchedFiles` 并集——非自述清单）；runChild baseOpts 增 `engTaskInput`（role eng-coder 时携带自身任务原文，setup 落 `agent._engTaskInput`）+ engDesignReviewed 注释注明 §18 任务域授权与粒度
- `src/agent/setup.mjs`：eng-coder depth-only 工具装配补 **受限 subagent 变体**（`engAuditSubagentTool()`——schema：role 枚举仅 `["explore"]`、async 参数移除（同步强制）、描述点名 AUDIT/BLOCKING ONLY——参数层过滤，机械强制在 subagent.mjs gate）；agent 字段 `_engTaskInput`
- `src/agent/execute-tools.mjs`：仅注释（§18 D-E3 粒度声明——design-token 门先于权限阶段、豁免绝不扩权）
- `src/prompts/engineering-sub.md` + `src/prompts/engineering.md`：§18 版本（内部交付协议附录 ①-⑦ + 修正轮 ≤5/`修正轮 N/5` 提醒 + 永不编辑设计文档 + stalled 不静默；架构师侧 async + 内部协议口径 + 父侧复核可选——**两端 byte-identical**）
- 文档：本仓无 AGENT-LOOP.md（CLI 仓）——`docs/TODO.md` 无跟进项（vs Code 无 TUI/§7 blanket 句——AC-E7 记录见上）

测试：`test/subagent.test.mjs`（§18 组——**T-E1** 缺省 async（spawn 返回 running + 报告 settle 带 designId；explore 缺省阻塞回归）/ **T-E1-loop** 真实 agent 循环中 spawn 工具结果 = JSON 字符串（code review #1 回归）/ **T-E2** async:false 显式覆盖 / **T-E3** 内部 explore 审计 spawn 成功 + 任务书机械追加断言 / **T-E4** 非 explore role 拒绝 / **T-E5** async:true 拒绝（同步强制）/ **T-E7** 第 7 次审计 spawn 拒绝（`ENG_AUDIT_SPAWN_LIMIT=6`）/ **T-E7-resume** 审计预算跨续跑段存活（code review #2 回归）/ **T-E12** 域内写授权（autoApprove=false 会话 eng-coder 写文件成功、零权限询问）/ **T-E14** 授权粒度（design-token/planMode 门在 AUTO 下仍生效——豁免仅限 onPermissionRequest 阶段）/ **T-E6** 内部协议闭环 wiring（脚本化 runAgent：audit dirty → 自修 → re-audit clean → advisor clean → 报告含轮次与终态）/ **T-E16-schema** async 描述角色级默认 + 受限变体 schema（role 仅 explore、无 async 参数））；`test/agent.test.mjs`（**T-E16-prompt**——engineering-sub.md 协议步骤/四类偏差/机械任务书/修正轮 N/5/stalled 断言 + engineering.md async 交付口径/step 7-8 下沉断言（2026-08-30 父侧审计句式已移除断言）+ 既有 prompts 断言随新文本更新）。T-E8/T-E15（节点失败→stalled、审计任务书独立性）为提示词纪律层——由 T-E16-prompt 断言承载；T-E9 双通道 = §17 suspension 既有套件回归（T-S3/T-S5）；T-E10/T-E11 = 全量回归 + digest 消化既有语义（§17 套件）。

**code review 修正轮（2026-09-02 内部复评 #1/#2）**：① async spawn 返回改 **JSON 字符串**（`JSON.stringify({id, role, status})`——agent 循环以 `String(raw)` 序列化工具结果（execute-tools.mjs），原对象返回在真实循环里退化为 `[object Object]`，模型读不到 id/status/position——CLI 同款 stringify；测试直调点统一 JSON.parse（subagent.test.mjs `spawnJson` helper + suspension.test.mjs 直调点）——**T-E1-loop** 循环级断言（工具结果含 `"status":"running"`/`"id":1`、非 `[object Object]`）；② 审计预算跨 **runAgent 段**存活（gateEngCoderSpawn 计数载体 = `parent.history ?? parent`——child agent 的 history 即本 run 数组（setup `agent.history`/`sink.history` 同引用），ContinueError resume 经 `opts.history = sink.history` 复用同数组——预算按**交付**计一次，非每 runAgent 段重置）——**T-E7-resume** 回归。


### §18 修正轮 + 拆分轮记录（2026-09-02/03）

- **askContinue AUTO 续跑**（CLI advisor 发现镜像）：async 分支撞 turn-cap 硬编码 auto-decline → 改 `shouldAutoResume`（`ctx.getAuto` 载体——VS Code agent 是 per-run 对象无 `parent.autoApprove` 字段——live AUTO 规范读法；CLI 用 `parent.autoApprove`——两端语义等价）——AUTO+工程 async eng-coder 撞 cap 自动续跑完整交付；测试 T-E17 + T-E17-manual（反例锁——AUTO 关 → auto-decline partial 零续跑）
- **subagent.mjs 500 行拆分**（574 超硬顶——§15/§17/§18 累积）：async 机械迁 `src/agent-tools/subagent-async.mjs`（282 行——settleAsyncEntry/collectSettledAsync/subagentCheckTool/常量/gateEngCoderSpawn/auditTaskBook/spawnAsyncSubagent/injectAsyncResult）——subagent.mjs 357 行——re-export shim 零消费点改动——导出面 13 名一致（脚本验证）——纯移动零逻辑改动
- 受影响文件：`subagent.mjs` + `subagent-async.mjs`（新）+ `agent.mjs`（注释指向）

### subagent 工具面合并：单工具四动作 spawn/check/status/escalate（2026-09-03 · 引用，AGENT-LOOP.md §19）

需求与设计见 CLI `docs/design/AGENT-LOOP.md` §19（19.1 F1-F8 / 19.2 D-M1..M4 + 测试 T-M1..M17 / 19.3 关键决策 / 19.4 N1-N4，单一权威源，本文件不复制）——本端与设计同规格实现（用户裁定：工具会爆炸——靠参数做不同的事；escalate 并入二次裁定）。**核心语义**：① `subagent` 单工具四动作——`action` 缺省 spawn（既有调用零迁移）；② `action:"check"` = 退役 `subagent_check` 语义原样保留（arrival order / 指定 id 阻塞 / n 计数 / MAX_ASYNC_CHECKS / 消费后删除）；③ `action:"status"` = 新增非阻塞查询（不消费、不动 n 计数、立即返回——主回合查进度不挂的根治）；④ `action:"escalate"` = 退役 escalateTool（飞刀）执行 verbatim 并入（约束/前缀/术后报告全保留）。本仓库改动点：

- `src/agent-tools/subagent-async.mjs`：`subagentCheckTool` 定义移除（工具退役）——新增 §19 action handler：`subagentCheck`（check 动作——语义 verbatim）、`subagentStatus`（status 动作——概览/单查两形态，done 条目带"未取"注记，挂起期项已移 pending 不在池 → 按 id 查为 unknown）、`escalateAction`（escalate 动作——escalate.mjs 执行逻辑整体迁入：池选模型/effort 钳制/ContinueError 续跑/mergeChildMutations/术后报告 + `sub:escalate <label> #N` relay 前缀不变——TUI 区块/活动流路由零改动 T-M16）；`mergeChildMutations` 迁入本模块（subagent.mjs re-export 兜住消费点——模块图无环）
- `src/agent-tools/subagent.mjs`：工具描述重写（四动作矩阵 + **查进度用 status——check 会阻塞直到完成**防误用引导 + escalate 触发词条款随迁——"用户说 飞刀/escalate → 调 action:'escalate'"）；parameters 合并单 schema（action 枚举 + task/role/model/designToken/designId/async/id/n——required 移出 schema，按动作 execute 内校验）；execute 前插 action 分流（缺省 spawn 走既有路径零改动）；`isReadonlyAction(args)` 钩子（check/status → 只读分类；spawn/escalate → 副作用）；导出面删 `subagentCheckTool`（T-M11 工具名消失）；**受限变体 action 门（round2 #3 机械层）**——eng-coder 子代理 ctx（depth>0 且 `_role==="eng-coder"`）内非 spawn 动作工具层拒绝（镜像 T-E4/E5 的 action 维度）
- `src/agent-tools/escalate.mjs`：**退役删除**（逻辑并入 escalate 动作）；`src/agent-tools/index.mjs`：`subagentCheckTool`/`escalateTool` 导出删
- `src/agent/setup.mjs`：depth-0 装配 `subagentTool` 常驻（consultModels 非空时 withPool 装饰——escalate 动作候选池列出——escalateTool 注册点删；池空时 escalate 动作运行时返回既有错误语义）；`engAuditSubagentTool()` 受限变体参数删 async + **删 action**（schema 层 spawn-only 提示）
- `src/agent/execute-tools.mjs`：**action 级门控（round2 #2）**——前置门禁 planMode 判定与只读批分组纳入 `tool.isReadonlyAction(args)`（status/check = readonly 分类：planMode 放行、免权限审批、并入只读并行批；spawn/escalate = 非只读分类：planMode deny、批审批照常）——collectBatchPermission/权限阶段既有 `isReadonlyAction` 钩子共用（git 先例）
- `src/prompts/main.md` + `engineering.md` + `discipline.md`：工具描述引用迁移（subagent_check → action:'check'/'status'；escalate 触发词条款 → `subagent` `action:'escalate'`；discipline 工具表 escalate 行并入 subagent 行）——**两端 byte-identical（CLI 端同批落地，交付前字节对比验证）**
- 文档：`docs/design/ESCALATE.md` 为历史设计文档（escalate 机制语义不变——工具注册表述为 as-of 快照，未改——按实现惯例仅本节记录迁移）

测试：`test/subagent.test.mjs`（§19 组——**T-M1** action 缺省 spawn 零迁移回归 / **T-M2..M4** check 迁移（既有 T3/T4/T12-14 改 `action:"check"` 后全绿）/ **T-M5..M10** status 非阻塞新用例（running 立即返回不阻塞 / queued 带 position / done 未取注记不消费→check 仍可取回 / 全概览三类 / 未知 id error / status 不扰 n 计数）/ **T-M11** 工具名消失（subagentCheckTool/escalateTool 导出 undefined + 四动作枚举 + required 移出）/ **T-M12** 描述锚点（四动作 + check 阻塞警告 + 飞刀触发词）/ **T-M17a** planMode 下 status/check 放行 vs spawn/escalate 拒绝 / **T-M17b** 混合批次批审批按 action 分组（check/status 不入审批组零询问）/ 受限变体 action 门（round2 #3））；`test/escalate.test.mjs`（**T-M14..M16 迁移**——escalate.test.mjs 直调 `escalateTool` → `subagentTool` `action:"escalate"`——既有语义/约束/前缀断言原样 + 新增 onSubagent role/model 事件断言（UI 路由零改动））；全量回归 = 既有 §15/§17/§18 套件零改全绿（T-M13）。

**code review 修正轮（2026-09-03 内部复评 #1——advisor round1 三发现）**：① 🔴 **async 子代理 id 跨 runAgent 复用**——agent 对象（含 `_subIdCounter`）per-run 重建而池沿 `history._asyncSubagents` 跨 run 存活：次 run 的 spawn 会复用仍在池中条目的 id，`map.set` 直接覆盖 → 旧条目报告永不注入（collectSettledAsync 只遍历现存条目——违 §17 零丢失）+ check/status 错指——新增共享分配器 `nextSubagentId(parent)`（计数器与池内最大 key 取上界续号，spawn 与 escalate 动作同用）——测试 advisor#1 ×2；② 🟡 **status 的 queued position 是入队瞬间快照**——settle 腾槽补位后变陈旧（CLI 端为查询时实时计算）——status/概览改为查询时实时计算（`queuePosition`——map 插入序即 FIFO 队列序）——测试 advisor#2；③ 🔵 **id 寻址严格数值键**——模型可能把工具返回的 id 以字符串回传而误报 unknown（CLI 端 String(id) 归一化对称语义）——check/status 查找前对纯数字字符串归一化（错误消息回显原值）——测试 advisor#3。受影响文件：`subagent-async.mjs` + `subagent.mjs` + `test/subagent.test.mjs`（新增 4 用例——全量 58 绿）。

### eng-coder 子代理内 advisor 流可见性：runChild onToolPanel 转发（2026-09-03 · 偏差修复，VS Code 独有）

> 来源：用户实测 + 一手探索定位（用户裁定「两边都修」——CLI 侧为同根因修复，本端为可见性补齐）。§18 内部交付协议每次都在 eng-coder 内跑 advisor（长文评审），但 runChild 的 runAgent callbacks 只转发 onToken/onReasoning/onToolCall/onToolResult（subagent.mjs）——**无 onToolPanel**：子代理 ctx.callbacks.onToolPanel 为空（工具 ctx.callbacks = runAgent callbacks 参数，execute-tools.mjs）→ advisor.mjs:142-144 的流（start/think/text/tool chunk）静默丢弃——用户只见 `advisor {...}` 工具行 + 结束 80 字符结果行，评审全程不可见。

- `src/agent-tools/subagent.mjs`：runChild 的 runAgent callbacks 增 **`onToolPanel: (name, chunk) => panel(chunk)`**——子代理侧工具面板流（advisor 评审流、嵌套 spawn 活动流）原样透传进该子代理自己的块频道 `sub:{role}#{subId}`：chunk kind（think/tool/text/start）与同 kind 合并语义不动（webview appendAdvisorChunk 同构）——**不复刻 CLI 的逐 chunk 换行**；子代理内层频道名（"advisor"）按既有语义折叠进子代理块（与 consult/escalate 的 `panel(chunk)` 形态同构）。接线点唯一——depth>0 工具 ctx.callbacks = runAgent callbacks 参数（execute-tools.mjs 透传），webview 端零改动（chat.js 既有 `sub:` 前缀路由 → subagentChunk）。
- **escalate 动作同缺口**（subagent-async.mjs escalateAction 的 runAgent callbacks 亦无 onToolPanel——coder 子代理可自主跑 advisor）——本轮范围外（任务书限定 subagent.mjs runChild），记入报告待架构师评估跟进。

测试：`test/subagent.test.mjs` **T-E18**（真实 run——eng-coder 子代理执行真实 code review（advisor 内部 chat 对脚本化 server），顶层 ctx.callbacks.onToolPanel 收到 `sub:eng-coder#1` 频道 text/think/tool chunk；评审尾部标记跨两个 SSE delta 拆开发送——转发无注入分隔符才能重组——修复前该断言红）；`test/ui.test.mjs`（webview 渲染锁定——advisor 形态流 start→think→text（同 kind 合并）→tool 行进入子代理块：start 空文本 no-op、text 合并不换行、长文完整不截断；复评 #4 补强——既有「完成态」describe 的 before 加同款 name-pattern 自备守卫——单独 `--test-name-pattern` 跑不再依赖前序 describe 的 body/bridge）；`test/chat-panel.test.mjs` bridge（T1/T2/T3）+ ui.test 既有 subagentChunk 用例零改全绿。

### §19.5 控制面扩展：status 决策字段 + cancel + UI ⏹ + 嵌套子标（2026-09-03 · 引用，AGENT-LOOP.md §19.5）

需求与设计见 CLI `docs/design/AGENT-LOOP.md` §19.5（19.5.1 F9-F13 / 19.5.2 D-M5..M8 + §19.5.2b 修订注 / 19.5.3 关键决策，单一权威源，本文件不复制）——本端与设计同规格实现（round2 通过 0🔴 后移植）。**核心语义**：① status 全览/单查的 running 条目补可决策字段 `{role, model, elapsedSec, turn, maxTurns}`（决定中止谁时看得清）；② `action:"cancel"` = 定向中止单个后台 async 子代理（id 必填——防误全停）——running 目标条目级 AbortController abort（其余子代理/挂起会话不受影响）→ cancelled settle（不入 pending、不参与 collect 直注入、停止冻结通知）；queued 目标出队移除（position 前移、无 abort）；③ UI ⏹（子代理活动块标题行——仅 running——DOM click → postMessage cancel → extension 层直连 abort——不经模型回合）+ ⟦ev⟧stopped 冻结相位（折叠 + 标题 stopped 标记）；④ 嵌套 relay 前缀子标（explore 审计活动在 eng-coder 块内渲染 `explore#1 · …` dim 行首子标——前缀不再丢失归属也不字面泄漏）；⑤ cancel 归**控制类豁免**（免权限审批 / planMode 允许 / 批审批不入组 / 手动档 digest 放行）。**与 CLI 的结构差异**：CLI 的 ⟦ev⟧turn 文本事件 → 本端为 `agent.mjs` 每轮迭代的 `callbacks.onAgentTurn` 钩子（D-M5 锚点允许选改动最小方案——runChild 内同步 entry.turn）；CLI 的 ⟦ev⟧stopped 文本 token/routeSubToken → 本端为 `onSubagent {status:"cancelled"}` 消息（panels.js 冻结渲染）；CLI 的 relay 前缀文本行解析 → 本端为 runChild 转发时把内层频道名附加到 chunk（`chunk.sub`——桥白名单透传——webview 行首子标）；模型可见取消提醒 = 机读线 user-role 注入（形态仿 injectAsyncResult——XML 转义——人读线由 UI 冻结相位承载）。本仓库改动点：

- `src/agent-tools/subagent-async.mjs`：池条目增 D-M5 字段（`model`/`maxTurns`/`turn`/`startedAt`——startedAt 记于 entry.start = 实际启动时刻，elapsedSec 按它计算：队列等待不计入）+ D-M6 控制字段（`cancelled`/`controller`——per-entry AbortController 链到 childSignal，Ctrl+C 全停逐链传播不变；`_onCancelled` = spawn 上下文绑定的停止冻结通知）；`spawnAsyncSubagent` 装配 + `runChild(entry)` 启动——started 事件带 **`pool: true`**（审计 #1——webview 只给池条目挂 ⏹；同步 spawn 的 started 无此标记）；**settle 回调 cancelled 第一分支**（出池清理双 map + 冻结通知——不入 pending/不直注入）；`subagentStatus` 结构化输出（running 对象数组含决策字段；queued/done 带 role）；`cancelSubagent(parent,id)`（工具 + UI ⏹ 共用核心：id 必填/未知/已完成 error、queued 出队 + `_resolve` 释放等待者 + 即时通知、running 标记 + controller abort——幂等早退审计 #2）+ `cancelSubagentAction`（depth-0 only 守卫）+ `injectCancelReminder`（机读线 user-role 提醒——running "partial changes not merged/audited" / queued "was queued" 两形态）；`subagentCheck` 消费端对 cancelled 条目返回 `{status:"cancelled"}`（不悬挂）
- `src/agent-tools/subagent.mjs`：schema/描述升级**五动作**（cancel 动作 bullet + id 必填警告 + status 决策字段 + async 段 cancel 引导）；`isControlAction` 钩子（cancel）；execute 分流 cancel + 动作白名单；runChild 重构——`runChild(entry)`（async 条目持 controller.signal——cancel 定向；sync 路径原样）、`onAgentTurn` 同步 entry.turn、**cancelled catch 免报错**（AbortError 不是错误——settle cancelled 分支收尾）、`forward(name, chunk)` 嵌套子标附加（内层 `sub:*` 频道名去前缀成 `chunk.sub`——advisor 频道照旧折叠）
- `src/agent.mjs`：主循环每轮迭代 `callbacks.onAgentTurn?.(turn + 1)`（D-M5 turn 钩子——顶层无订阅 no-op）
- `src/agent/execute-tools.mjs`：**控制类豁免（round2 #4）**——preGateBlocked（planMode 放行 cancel）、collectBatchPermission（不入批审批组）、逐项权限阶段（免询问——无 permission handler 也不拒）三处纳入 `tool.isControlAction`
- `src/extension/panel-chat.mjs`：`toolPanelPayload` 白名单补 `sub`（嵌套子标透传——string 兼容分支安全 undefined——`String.prototype.sub` 陷阱规避）；runPanelChat 登记 **`panel._liveLines`**（回合 live lines 常驻——池/机读线载体——UI ⏹ cancel 路由锚点；挂起期与 susp.lines 同数组）
- `src/extension/panel-messages.mjs`：webview 消息 `cancelSubagent` 路由 → 定位 live lines 池条目 → `cancelSubagent`（与工具 action:'cancel' 同实现路径——D-M6）；未知 id no-op
- webview：`streaming.js` `subagentChunk`（块创建时按行态装 ⏹——仅 running；`m.sub` 透传 appendAdvisorChunk）；`panels.js` `handleSubagentMessage`（cancelled = 冻结态——折叠 + stopped 标记 + ⏹ 移除；settled/done/error 亦移除 ⏹）+ `updateBlockStopButtons`/`freezeStoppedBlocks`/`subBlockTarget` 导出；`ui.js` `appendAdvisorChunk(block, kind, text, sub)`（子标 span 行首——同 sub 文本合并续行不重复前缀；**合并分支改 append text node——textContent 赋值会清掉子标 span**——实现修点）；`chat.js` ⏹ 点击委托（postMessage cancelSubagent——preventDefault 不触发折叠翻转）；`chat.css`（.sub-stop-btn 块级 overlay——不落 summary 文本、.advisor-sub、.sub-stopped）；`locales/{en,zh}.json`（sub.cancelled/sub.stopped/sub.stopBtn）
- 文档：本仓无 AGENT-LOOP.md（CLI 仓）——本节即引用段；AGENTS.md 模块图零改动（无新增/重命名文件）

测试：`test/subagent.test.mjs`（§19.5 组——**T-M18** status 决策字段（running 条目 role/model/elapsedSec/turn/maxTurns——单查 + 全览）/ **T-M18b** turn 跟踪真实轮次（wall 循环 4 次 LLM 调用 → entry.turn=4）/ **T-M19** cancel 定向中止（interrupted settle——无 error 报告/无陈旧注入——条目出池 + stopped 冻结通知 + 机读线提醒 + 其余子代理照常跑完）/ **T-M19b** cancel 幂等（重复取消单提醒——审计 #2）/ **T-M20** cancel 错误路径（省略 id/未知 id/已完成 id）/ **T-M21** cancel 后槽位补位（queued 自动启动）/ **T-M27** queued 取消（was:"queued" 确认 + position 前移 + running 槽不动 + 无 abort）/ **T-M27b** depth>0 拒绝 / **T-M17c** digest 内 cancel 放行（手动档 deny-stub 阶段——审计 #3）/ **T-M25-engine** forward 引擎级（嵌套 explore chunk 带子标——审计 #4）；既有用例形状更新——T-M8（overview 结构化对象）、T-M11（五动作枚举 + isControlAction）、T-M12（FIVE actions 锚点）、T-M17a（planMode 下 cancel 放行——控制类豁免）、advisor#2（queued 带 role）、受限变体门（cancel 同拒））；`test/ui.test.mjs`（**T-M22** ⏹ 点击 → cancelSubagent 消息 + 折叠翻转不触发 / **T-M23** ⏹ 仅 running 且仅池条目（同步 spawn 形态反例锁——审计 #1）——done/error/settled 消失 / **T-M23c** ⟦ev⟧stopped 冻结——折叠 + 标题 stopped 标记 + 冻结后不复活 / **T-M24/25** 嵌套子标渲染——子标行首 + 同 sub 合并不重复前缀 + 无 sub 切回 + 工具行跟随归属 + 单层零变化）；`test/chat-panel.test.mjs`（**T5** toolPanelPayload sub 透传 / **T6** cancelSubagent 消息路由 → 定向 abort + queued 出队 + 未知 id no-op）；全量回归 = 既有 §15/§17/§18/§19 套件零改全绿（T-M26）。

**实现修点（2026-09-03 交付过程）**：① `String.prototype.sub` 陷阱——toolPanelPayload 的 `chunk?.sub` 在 string chunk 上取到的是 String 内建方法（truthy 函数）——string 兼容分支显式 `undefined`；② appendAdvisorChunk 合并分支 `textContent +=` 会清掉行内子标 span（textContent 赋值移除全部子节点）——改 appendChild text node。

**审计修正轮（2026-09-03 偏差审计 #1——四发现）**：① 🔴 **同步 spawn 块挂无效 ⏹**——同步（阻塞）spawn 同样发 `started` 事件但无池条目——cancel 路由定位不到（静默 no-op）——async 池条目的 started 事件增 `pool: true` 标记（subagent-async entry.start），webview 按行态 `pool` 门控装 ⏹（panels.js/streaming.js）——ui.test T-M23 增同步形态反例锁；② 🟡 **cancel 幂等**——settle 前重复 cancel 同一 running 条目重复注入机读线提醒——running 分支加 `entry.cancelled` 早退（二次取消仅返回确认）——T-M19b；③ 🟡 **digest 内 cancel 放行无专项测试**——补 T-M17c（手动档 digest deny-stub 阶段：spawn 被权限 deny、cancel 控制类豁免跳过询问照常定向 abort——设计 19.5.2b 的 digest 放行用例）；④ 🟡 **forward 子标附加无引擎级测试**——补 T-M25-engine（真实 eng-coder → 受限 explore 嵌套 spawn：内层文本经双层转发带 `chunk.sub = "explore#1"` 到达主会话 `sub:eng-coder#1` 频道；eng-coder 自身文本不带子标——D-M8 首段路由不变断言）。F3（超两层嵌套丢中间层归属）记录为注释（当前嵌套深度上限 = 2——explore 无 subagent 工具——零实际影响）。

**code review 修正轮（2026-09-03 advisor #1——两 🔴 三 🟡 一 🔵）**：① 🔴 **subagent-async.mjs 654 行超 500 硬顶**——escalate 引擎（escalateLabel/escalateAction/touchedFilesNote ≈150 行）verbatim 拆至新模块 `src/agent-tools/subagent-escalate.mjs`（171 行——模块图单向：它 import subagent-async 的 mergeChildMutations/nextSubagentId，反向不成立——无环）；subagent.mjs 的 escalateAction import 改指新模块；subagent-async 头部文档与 mergeChildMutations 注释同步更新——本文件回落到 500 行；② 🔴 **agent.mjs 504 行**（HEAD 已 500 顶格——onAgentTurn 钩子 +4 越线）——钩子注释压缩 + finally 段注释重排——回落 500；③ 🟡 **取消语义内部矛盾（cancel 后 partial 变更实际被 merge，文案/提醒却称 not merged/audited）**——runChild catch 与成功路径均把 `entry?.cancelled` 判定提到 mergeChildMutations **之前**：取消路径不合并（磁盘半成品不入父 guard 记账——不触发 verify/advisor 推回——与描述/提醒/设计 D-M6 round2 #3 一致）；成功路径的提前判定同时封死「完成瞬间点击取消 → done 后 frozen stopped 双终态 + 报告静默丢弃」的竞态（settle 统一以 entry.cancelled 收尾）——**T-M19c**（真实 eng-coder 写盘后取消：磁盘半成品在、_touchedFiles 零合并、提醒单发）；④ 🟡 **spawn 缺 task 无 execute 级校验**（§19「required 移出 schema → execute 内校验」承诺对 task 未兑现）——spawn 分支补 presence/空白校验（干净工具错误——不再带 undefined 输入进子代理）——**T-M27c**；⑤ 🔵 **cancelSubagent 路由丢弃 role 死参数**——路由以 `entry.role !== msg.role` 交叉校验（陈旧按钮同 id 异 role 不误停）——chat-panel T6 更新 + 不匹配 no-op 断言。子标单跳限制（F3）与 subagent.mjs 448 行咨询项（advisor #3——<500 硬顶合规，后续拆分候选）。

**续跑轮注（2026-09-03——前次 eng-coder id:10 中断后续接）**：前次实现完成代码 + 文档 + 审计 #1 修正后被中断于全量测试（测试进程群被杀——残留进程疑点经本轮排查无复现）。续跑轮以**逐文件带硬超时**（100s/文件）重跑全量 50 个测试文件——**零失败、零挂起**（最长单文件 tools.test 61.5s；suspension.test 3.9s 通过——settle 分流改动无挂起根因）。中断根因判断为进程管理而非测试缺陷：`node --test` 全量单次调用的并行子进程在驱动进程被杀后成孤儿残留——本轮全部测试均在 execute 超时帽内独立进程完成。验收 AC-M6..M10 逐项绿（见上文测试清单——全量回归 T-M26 = 50 文件全绿）。


