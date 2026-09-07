# 配置面板（Settings Panel）功能梳理与重新设计 > 状态：**批次 A 已实施**（2026-08-03，commit 见 git log "settings panel provider redesign"）。
> 批次 B/C/D 设计见 SETTINGS-PANEL-2.md，待批。 ## 1. 现状盘点 配置面板（webview 侧 `webview/settings.js` + 扩展侧 `src/extension/settings.mjs`）当前包含 4 个区块： | 区块 | 当前功能 | 数据源 |
|------|---------|--------|
| Provider 列表 | 动态渲染 config.json 的 providers[]，每行：label + 密钥状态 + Change/✕/Add Key | `~/.thincoder/config.json`（共享） |
| Custom Provider | 固定名字 "custom" 的三字段表单（key/baseURL/model），改任一格即保存 | 同上（providers[] 里 name="custom" 的条目） |
| MCP Servers | 列表 + stdio/http/ws 添加表单 | VS Code settings `thincoder.mcpServers`（扩展本地） |
| Semantic Index | embedding key 管理 + 索引构建按钮 + 状态 | config.json embedding + 本地索引 | provider 增删流程目前**只在聊天工具栏的模型下拉菜单底部**有入口（"+ Add provider… / − Remove provider… / Key…"），走 VS Code 原生 QuickPick/InputBox（`src/extension/provider-flows.mjs`）。配置面板里**没有**任何增删入口。 ## 2. 问题清单 1. **配置面板没有 Add Provider 按钮**（用户报告）——面板只管 key，provider 的增删被藏在模型下拉菜单里，用户找不到。
2. **✕ 按钮语义是"删 key"不是"删 provider"**——删完 key，provider 条目还在 config.json 里，行还在列表里，只是变成未配置状态。用户预期 ✕ 是移除这个 provider。
3. **无法设置 activeProvider**——CLI 的 config.json 有 `activeProvider` 指针。**2026-08-03 决策：不需要手动设置**——activeProvider 由模型选择隐式更新（CLI selectModel 语义：选模型时写 provider+model），单独切 provider 是半截状态无意义。模型下拉已负责此职责。
4. **custom 表单与 CLI 不对齐**： - 名字写死 "custom"，CLI custom 流程可以起任意名字（允许同时挂多个自定义 provider） - 没有协议格式选择（openai/anthropic/google），CLI addProviderFlow 的 custom 分支有这一步 - "改一格即保存"的交互容易误触发半截配置落盘
5. **provider 行信息太少**——只显示 label 和 key 状态，看不到 model、baseURL、是否 active。
6. 消息协议冗余：`saveProviderKey` / `saveCustomProvider` / `deleteProviderKey` 三个消息与新流程并存，语义重叠。 ## 3. 重设计（对齐 CLI） 总原则：配置面板是 provider 管理的**主入口**；行为逐项对齐 CLI `addProviderFlow` / `removeProviderFlow` / `setKeyFlow` / `/provider list` 的语义。模型下拉菜单底部那三个入口保留（快捷方式），QuickPick 流程继续复用。 ### 3.1 Provider 区块重排 ```
PROVIDERS [+ Add]
┌────────────────────────────────────────────────────────────┐
│ DeepSeek deepseek-v4-pro [☑ proxy] [Key] [−] │
│ api.deepseek.com │
│ Kimi kimi-k3 [☑ proxy] [Key] [−] │
│ api.moonshot.cn/v1 │
└────────────────────────────────────────────────────────────┘
``` - 每行两行式：第一行 label + model + proxy 勾选 + 按钮；第二行 baseURL（dim 小字）。
- **无 active radio（2026-08-03 决策）**：activeProvider 由模型选择隐式更新（CLI selectModel 语义），面板不再提供手动设置入口——"切 provider 不切模型"是半截状态，无意义。
- **[☑ proxy]**：per-provider 代理开关（见 SETTINGS-PANEL-PROXY-ROW.md）。
- **[Key]**：改 key（inline 密码输入，沿用现有 `_editKey` 交互）。
- **[−]**：移除 provider（对齐 CLI removeProviderFlow——active 的不能移除，按钮置灰）。
- **[+ Add]**：打开添加表单（见 3.2）。 ### 3.2 Add Provider 流程（对齐 CLI addProviderFlow） 点 [+ Add] 后面板内切到表单视图（不弹 QuickPick——面板内完成才是面板的职责）： 1. **选 preset**：列 `PROVIDER_PRESETS` 里还没添加的 16 个（radio/下拉），选中后自动填 baseURL/model（只读展示，preset 值不允许手改——对齐 CLI：preset 就是预设）。
2. 或选 **Custom**：依次输入 name → baseURL → model → format（openai/anthropic/google 三选一，对齐 CLI custom 分支）。
3. 最后一步输入 key（可留空，对齐 CLI "skip if none"）。
4. 保存 → 写 config.json providers[] → 刷新列表。 校验规则对齐 CLI：name 与已有 providers/presets 重名拒绝；baseURL/model 必填。 ### 3.3 消息协议 新增（webview → extension host）： | 消息 | 载荷 | 行为 |
|------|------|------|
| `addProvider` | `{ preset?: string, custom?: { name, baseURL, model, format }, key? }` | 走 config-io persistRaw 落盘，等价 provider-flows.addProviderFlow 的落盘逻辑 |
| `removeProvider` | `{ name }` | active 拒绝；删条目 |
| `setProviderProxy` | `{ name, proxy }` | 写 provider 条目 `proxy: true` / 删字段（见 SETTINGS-PANEL-PROXY-ROW.md） | 保留：`saveProviderKey`（改 key）、`deleteProviderKey`（删 key——行上不放这个按钮了，留协议给未来/命令行场景；或一并删掉，见实施决策 D2）。 ### 3.4 实施决策（已按"对齐 CLI"原则定死，不再问） - **D1**：面板内表单优先于 QuickPick——面板里操作全在面板内完成；模型下拉菜单的 QuickPick 入口保留作快捷方式。
- **D2**：`deleteProviderKey`（只删 key 留条目）没有 CLI 对应物，UI 上不再暴露；协议保留不删（避免动 webview/扩展两端的消息分支，风险大于收益）。
- **D3**：activeProvider 的语义对齐 CLI：它决定 `providerFromConfig()` 无参调用时的默认 provider；聊天时用户在模型下拉里选的具体 provider 仍然优先（per-message override，现状不变）。**2026-08-03 增补：activeProvider 不提供手动设置 UI**——由模型选择隐式更新（CLI selectModel 语义），单独切 provider 是半截状态无意义；已移除 radio 及 setActiveProvider 消息。
- **D4**：custom provider 支持任意名字 → 可以同时存在多个 custom；现有 name="custom" 的旧条目自然兼容（就是一个普通条目）。 ### 3.5 改动文件清单 | 文件 | 改动 |
|------|------|
| `webview/settings.js` | provider 区块重排（两行式 + proxy 勾选 + Key/− 按钮）、[+ Add] 表单视图、Custom 表单加 name/format |
| `webview/settings.css` | 新增样式（两行式行、proxy 勾选、表单视图） |
| `src/extension/settings.mjs` | providerStatus 增加 baseURL/model/isActive/proxy 字段；新增 addProvider/removeProvider/setProviderProxy 处理函数 |
| `src/extension/chat-panel.mjs` | 路由新消息 |
| `src/extension/provider-flows.mjs` | 落盘逻辑抽成可复用函数（面板和 QuickPick 两条路径共用，避免重复） |
| `locales/en.json` + `zh.json` | 新增文案键 |
| `test/` | settings 新处理函数的单测（add/remove/setActive 的落盘与拒绝规则） | 不改：config-io.mjs（读写逻辑已齐）、config.json 格式、MCP/Index 区块。 ## 4. 验收标准 1. 配置面板有 [+ Add] 按钮；添加 preset/custom provider 后出现在列表且 config.json providers[] 有对应条目。
2. activeProvider 由模型选择隐式更新（模型下拉选模型 → config.json activeProvider+activeModel 同步，CLI 端 loadConfig 能读到）；面板无手动设置入口。
3. [−] 移除非 active provider；active 的行 [−] 置灰。
4. custom 添加可选 openai/anthropic/google 三种 format，写进条目的 `format` 字段。
5. 改 key（[Key]）行为不变。
6. 每行有 proxy 勾选，落盘 provider 条目 `proxy` 字段。
7. 两端测试全过、ESLint 干净。
