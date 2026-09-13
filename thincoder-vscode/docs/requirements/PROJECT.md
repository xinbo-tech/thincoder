# ThinCoder VS Code — 需求与决策记录

> 归位注记：本档自 `docs/design/REQUIREMENTS.md` 归位入 `docs/requirements/`（文档体系各仓自持批 LEDGER-SELF-CONTAINED——异名归位；原 §v1 功能范围节拆出至 `FEATURES.md`）。
> 本文档记录 VS Code 扩展的需求决策、已确定事项和待讨论项。
> 独立产品，不依赖 thincoder CLI。零外部依赖（npm + 文件系统）。

## 已确定的决策

| 项 | 决策 | 备注 |
|---|---|---|
| 语言 | 纯 JavaScript (`.mjs`) | 无 TypeScript，无构建步骤，ESM 原生 |
| 依赖 | 零 npm 运行时依赖 | 仅 `node:` 标准库 + VS Code Extension API |
| 界面 | VS Code Webview (iframe) | HTML/CSS/JS，`postMessage` 通信 |
| 入口 | `extension.mjs` → `activate()` | 标准 VS Code 扩展激活模式 |
| LLM 调用 | 原生 `fetch` + SSE 流式 | OpenAI 兼容协议，支持 reasoning / thinking |
| 支持的 Provider | 20 个 preset（含 Claude/Gemini/Kimi For Coding 等）+ 自定义端点（三协议） | 见下表 |
| 模型配置 | `~/.thincoder/config.json`（与 CLI 共享） | providers[] + activeProvider，见「与 CLI 的关系」 |
| 会话存储 | `~/.thincoder/sessions/`（与 CLI 共享） | 完整 sha1(cwd) + 槽位，两端互读 |
| 工具审批 | `autoApprove` 会话级槽位字段，默认 `false` | AUTO 按钮 / approve-all 翻转；agent 循环 live 读取，mid-turn 立即生效 |
| 模型能力 | 自包含 `src/config.mjs` | MODEL_SPECS 表独立维护 |
| Session 标题 | LLM 自动生成（首条消息后触发） | 失败静默降级为截断消息 |

### Provider 预设（以 CLI 为唯一权威）

**权威来源**：preset 表以 CLI `src/config.mjs` 的 `PROVIDER_PRESETS` 为唯一权威，VS Code 不再各自硬编码（避免漂移）。当前全集 20 个，含 `kimi-code`（Kimi For Coding 独立平台）、`glm-code`（GLM Coding Plan）、`mimo`/`mimoplan`（MiMo / MiMo Token Plan）、`claude`（format: anthropic）与 `gemini`（format: google）：

| 类别 | Provider |
|---|---|
| OpenAI 兼容 | deepseek, kimi, kimi-code, glm, glm-code, qwen, qwenplan, mimo, mimoplan, minimax, openai, grok, mistral, volcengine, hunyuan, siliconflow, openrouter, groq |
| Anthropic 协议 | claude（`format: "anthropic"`，Messages API） |
| Google 协议 | gemini（`format: "google"`，streamGenerateContent） |

每个 Provider 的能力参数（context window、maxOutput、thinking API 类型、温度范围）存在 `src/config.mjs` 的 MODEL_SPECS 表里，`specForModel(model)` 按模型名前缀匹配。

### Provider 与模型选择（对齐 CLI，✅ 已定）

四条契约，全部对齐 CLI 现有行为：

1. **配置共享**：读写 `~/.thincoder/config.json`（`providers[]` + `activeProvider`），与 CLI 同一份文件；`apiKey` 缺省回退环境变量。旧 VS Code settings 一次性迁移后停用（见「与 CLI 的关系」）。
2. **模型选择 = 二级菜单**：对齐 CLI `openModelPicker → openModelListForProvider` 两级结构 + add/remove/key 管理项。Webview 无键盘导航，用 **hover flyout 子菜单**实现两级语义：主下拉列 provider 行（provider 名 + 右侧当前模型 + `›`），hover 弹出该 provider 的模型子菜单，点击模型选中。
3. **模型添加 = 添加/删除 provider 模式**：对齐 CLI `addProviderFlow` / `removeProviderFlow` / `setKeyFlow`。添加流程：选 preset（过滤已添加的）→ 自动填 baseURL/model → 输入 API key；custom 走手动流程（下条）。删除：列出非 active 的 provider 供移除。key 管理：单独入口设/改 key。
4. **custom 支持三种协议**：对齐 CLI `addProviderFlow` 的 custom 分支——手动输入 name / baseURL / model，并选 **API format: `openai`（默认）/ `anthropic` / `google`**，写入 `provider.format`。三种协议都有 transport（见下）。

**协议 transport**：`openai`（默认，SSE chat completions）、`anthropic`（Messages API）、`google`（streamGenerateContent）——**三种均已实现**（`src/provider/transports/`，08-13 注：早期版本仅有 openai transport，anthropic/google 后补齐）。

## 待决策

> 原列各议题——下文每一项均已标记决策态（✅ 已定 即已拍板落定），非开放未决。

### 安全边界（✅ 已定）

> 走**透明 + 默认保守 + 信任用户判断**路线。不搞命令级沙箱。
>
> - `autoApprove` 默认 `false`，Agent 先描述计划等确认
> - 开启 AUTO 时弹出一次性警告，告知风险
> - 审计靠 git + 聊天历史，不建独立的审计日志
> - prompt injection 防御 v2 再议

### 多 Provider 默认选择（✅ 已定）

> 自动选第一个有 key 的 provider。用户配 key 本身就是选择行为——只配了一个就用那个，配了多个按列表顺序取第一个。

### Multi-root Workspace 策略（✅ 已定）

> 目标是所有文件夹对 Agent 可见。v0.1.0 先用 `workspaceFolders[0]`，后续补全。
> 当前在状态栏上标明工作目录，用户知道有限制。

### API Key 存储（✅ 已定）

> Key 落在 `~/.thincoder/config.json` 明文，与 CLI 共享同一份配置（决策动因：两端共享配置 > 密钥链隔离）。旧版 SecretStorage 仅用于一次性迁移，迁移后清除。

### Webview 技术选型（✅ 已定）

> 继续 vanilla JS。现约 5000+ 行（08-14），仍不值得引入框架。撑不住了再迁。

### 与 CLI 记忆互通（✅ 已定）

> 暂不处理。VS Code 已有自己的文件式记忆（`.thincoder/memory/` markdown + frontmatter，与 CLI 条目格式兼容）；自动互通/合并检索仍未做，决策保留。

### 国际化（✅ 已定 → 已变更）

> 中英双语：`locales/en.json` + `locales/zh.json`，UI 文本集中在 i18n 常量文件，webview 启动注入。

## 与 thincoder CLI 的关系

两个独立产品，共享设计理念、提示词体系，以及**会话数据与配置数据**——两端读写同一份磁盘文件，可无缝接续同一会话、同一组 provider：

```
thincoder CLI                          thincoder-vscode
├── 终端 TUI（裸 ANSI）               ├── VS Code 侧面板（Webview）
├── 3 层记忆 + MCP                    ├── 文件式记忆 + MCP（08-13 已补齐）
└── npm i -g thincoder                └── VS Code Marketplace
两端共享（同一磁盘位置，互相读写）
├── ~/.thincoder/config.json 配置（providers + activeProvider）
└── ~/.thincoder/sessions/ 会话（完整 sha1(cwd) + 槽位）
```

同级独立产品。用户只装哪一个都行；同时装则共享配置与会话，切换无感。

## 会话流时序对齐 CLI（2026-09-09 用户需求点——待设计）

> 用户反馈：VSC 会话流时序"乱/不清晰"——与 CLI 差距大。对比勘察结论：
> 双端 agent 核心（runAgent/run-stages/suspension 状态机）几乎同构——时序差距全在 **UI 呈现层**。

- **机制根源（勘察一手——对比表）**：CLI = 单 state/单 writer/整帧重绘/块原地生长——事件乱序无害（下帧收敛）；
  VSC = 无串行化消息路由（R9）+ 多镜像忙态（R4）+ 多生产者事件直写 DOM + 子代理块跨位置移动（R5）+
  会话打开波浪式落地（R2）——事件相对顺序直接决定视觉顺序。
- **成因排序**：R6 命令直发绕过 _turnActive 守卫（最硬竞态——回合中触发先 abort 再开新回合——输出
  "跑到一半重置"）→ R5 子代理块位移（live 底部面板 → settle move 进对话流——"跳"观感）→ R2 波浪式恢复
  → R4 多 writer 竞争（loading/compress/goal 徽标）→ R3 回合边界磁盘往返+后置标题 LLM → R8 启发式子回合识别。
- **分层方案（用户裁全做——非三选一）**：
  - **C 层（先行——架构级）**：R9 webview 消息路由加串行队列 + R4 忙态收敛单一状态机（host/webview 双端
    单状态机 + 单 writer）——C 深勘察在途——报告后落 C 设计档
  - **A 层（后做——局部快赢）**：R6 sendMessage 补 _turnActive 守卫 + R4 状态行收敛单 writer + R3 标题移回回合内
  - **B 层（后做——结构）**：R5 子代理块原地（live 块直接长在对话流）+ R2 会话打开原子化（单 status 快照消息）
- **实现顺序理由**：C 在 A/B 前——先建串行+状态机地基（更稳定的结构上再加固 A/B 的具体路径）。
- 状态：C 勘察中——owning board = 会话流（panel/webview）——设计/评审/实现链后续推进。
