# 配置面板（Settings Panel）— 现行设计 > 状态：**现行权威源**（2026-08-25 合并自 6 份历史批次文档，单一权威源纪律）。历史文档归档于同目录（文件名保留，地图不再单独列出）。
> 归档来源：SETTINGS-PANEL.md（批次 A）、SETTINGS-PANEL-2.md（批次 B/C/D）、SETTINGS-PANEL-PROXY-ROW.md、SETTINGS-REORG.md（重组）、SETTINGS-SUBMODEL-SHELL.md、MODEL-PICKER-UNIFY.md（模型选择统一）——全部已实施，细节见各归档文档。 ## 1. 信息架构（5 卡，2026-08-15 REORG 定稿） 面板打开时整体重建（**单一状态源 = config.json**；DOM/模块变量无独立状态，回声压制等历史补丁随重组移除）。卡片按使用频率排序： | 卡 | 内容 | 实现入口 |
|---|---|---|
| **Providers** | provider 行（dot / label / masked key / model·baseURL / proxy 勾选 / Key / −）+ Add 表单（preset 下拉 + 获取模型） | `webview/settings-providers.js` |
| **Agent** | maxTurns（默认 200）、subagentTurns（默认 100）、compactThreshold（空=auto）、verifyGuard + Subagent models（global + explore/plan/coder/eng-coder，modelMenu 槽位） | `webview/settings-agent.js` |
| **Consult & Advisor** | 会诊行（modelMenu + effort 档 + ✕、+ 添加）+ Advisor（guard + provider/model + effort） | `webview/settings-agent.js` |
| **Tools & Services** | MCP servers（列表 + stdio/http/ws 表单 + 连接状态 ●/○ + Reconnect）+ Web Search key + Semantic Index（key + Build） | `webview/settings-tools.js` |
| **Environment** | Proxy（URI / web / model 双开关 / Test）+ Shell（平台感知候选） | `webview/settings-env.js` | ## 2. 关键语义（跨卡片契约） ### 2.1 Provider 管理 - 存储：共享 `~/.thincoder/config.json` 的 `providers[]` + `activeProvider`（CLI 同源）。activeProvider 由模型选择隐式更新，**无手动设置入口**（2026-08-03 决策）。
- ✕ = 删 provider 条目（非删 key）；[Key] = 改 key。
- 行内 proxy 勾选 = `provider.proxy: true`；与全局 `proxy.model` **双开关**（都开才走代理，`injectProxy` 语义）。
- Custom provider 支持三协议（openai / anthropic / google），format 字段落盘。 ### 2.2 模型选择统一（2026-08-14 六处风格收敛） 所有"选模型"控件统一复用**主面板同款两级悬停子菜单**（provider 行 → 模型列表；否决原生下拉与搜索框——千问系几十个模型原生下拉不可用）。会诊与 Advisor 行带**思考强度档**（effort 显式落盘，不留隐式继承；过时由用户自改）；subagent **不带** effort（深度由主 agent 派任务时表达）。 ### 2.3 Agent 运行参数 - 写入链：面板 → `saveAgentSettingsFromPanel`（单写通道）→ config.json `agent.*`。**advisor 字段级合并**（GitHub #3 修复，2026-08-29）：payload 缺键从磁盘回填（CLI 写入的 provider/model/thinking/reasoningEffort 面板保存后存活），显式 `null`/`''` = 清空删除；wire 层空槽位必须发 `null` 而非 `undefined`（postMessage JSON 序列化丢弃 undefined 键——缺失与清空必须可区分）。timeoutMs 透传保留手写值。
- 面板打开即拉新：`openSettings` → `getAgentSettings`（webview→extension）→ extension 重读盘推送 `agentSettings`（extension→webview）→ 收到后渲染（250ms 超时回退用快照）。CLI `/advisor` 写盘后打开面板即可见。
- subagentModels 优先级：工具 model 参数 > `subagentModels[role]` > `subagentModel` > 父 provider。
- Shell 为 config.json **顶层字段**（不在 agent 下），独立消息通道；平台感知候选（System default / pwsh / Git Bash / WSL）。 ### 2.4 MCP 存储共享 config.json `mcp.servers[]`（CLI 同格式）；旧 VS Code settings 已一次性迁移。重名拒绝、args 空格分隔、env KEY=value。 ### 2.5 语义索引 embedding key + 构建按钮 + 状态；向量维度/模型切换的校验缺口见 `docs/TODO.md`（语义索引盲区组）。 ## 3. 已知待办（不属本文档范围） - design round2 专用提示词、ARCHITECTURE NFR 补全等见 `docs/TODO.md`。
