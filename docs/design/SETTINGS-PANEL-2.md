# 配置面板重设计 · 第二部分：MCP / 语义索引 / Agent 设置 / Proxy > 状态：**全部批次已实施**（批次 B: a23ebdc；批次 C: 812f24f；批次 D: 本批）。 ## 1. MCP Servers 区块 ### 现状（批次 B 实施后） **存储已迁移进共享 config.json**（`mcp.servers[]`，CLI 同格式），旧 `thincoder.mcpServers` settings 由 migrateCore 一次性迁移后清除。UI 支持 env 字段、args 空格分隔、重名校验（错误回显）、连接状态 ●/○ + 工具数、[Reconnect]。CLI 与 VS Code 看到同一份 server 列表。 ### 历史问题（均已解决） | # | 问题 | 解决 |
|---|------|------|
| M1 | 存储位置与 CLI 不一致 | 迁移进 config.json `mcp.servers[]`，migrateCore 一次性迁移（CLI 已有条目跳过） |
| M2 | stdio 表单缺 env 字段 | 表单加 env 输入（KEY=value 空格分隔） |
| M3 | 无重连、无连接状态 | mcp 模块加 mcpConnectedNames/mcpConnectedToolCounts/mcpDisconnectByName；面板 ●/○ + [Reconnect] |
| M4 | 重名静默覆盖 | addMcpServer 拒绝重名，错误回显 webview |
| M5 | AI 辅助添加 | 不做（记录在案） |
| M6 | args 分隔符不一致 | 改空格分隔（CLI 一致） | ### 实施记录（a23ebdc） 1. config-io.mjs 新增 `loadMcpServers`/`addMcpServer`（重名拒绝）/`removeMcpServer`
2. migrateCore 新增 legacyMcpServers/clearLegacyMcp 迁移段
3. settings.mjs 的 MCP 函数改走 config.json（不再用 VS Code settings）
4. mcp/index.mjs 新增 `mcpConnectedNames`/`mcpConnectedToolCounts`/`mcpDisconnectByName`
5. chat-panel：_pushMcpStatus 推送数组（name/desc/connected/toolCount）、路由 reconnectMcp、runAgent 传数组
6. agent.mjs MCP 注入段改数组渲染（含 wsUrl 分支）
7. webview：表单加 env、args 空格分隔、行显示 ●/○ + 工具数 + [Reconnect] ## 2. Semantic Index 区块 **模型与 baseURL 写死为 SiliconFlow bge-m3——这是定案，不是待修问题。**（2026-08-03 用户拍板：embedding 模型固定；CLI 侧原有的 5 模型选择属过度工程，已在 CLI `2d99b60` 撤除该 picker。向量索引的格式假定单一 embedding 空间，暴露模型选择只会制造索引失配。） VS Code 现状（`_saveEmbeddingConfig`/`_resolveEmbedder` 写死 bge-m3 + SiliconFlow）**保持不动**。本区块唯一要做的： | # | 事项 | 详情 |
|---|------|------|
| I1 | key 管理入口保留 | 现有 Add/Change/✕ 交互不变，落盘 config.json embedding.apiKey（已如此） | 不做：模型选择、baseURL 输入、任何 embedding 高级设置。 ## 3. Agent 设置区块（新增，批次 C 已实施） CLI `/config` 的可配置项，config.json `agent.*`，批次 C 前 VS Code 面板**零入口**： | 配置项 | CLI | VS Code 批次 C 后 |
|--------|-----|--------------|
| `agent.maxTurns` | /config 可改 | 面板数字输入，落盘 config.json |
| `agent.subagentTurns` | /config 可改 | 面板数字输入 |
| `agent.compactThreshold` | /config 可改（auto 标记） | 面板输入（留空=auto），**已接线 compactHistory 第 4 参** |
| `agent.verifyGuard` | /config 开关，默认 off（opt-in） | 面板 checkbox，**行为已修正为 opt-in**（默认 off 不回推） |
| `advisor.enabled` / `guard` / `provider` / `model` | config + /advisor 命令 | 面板 Advisor 区块（enabled/guard checkbox + provider/model 文本框） | ### 实施记录（批次 C） 1. config-io.mjs 新增 `loadAgentSettings`（扩展 maxTurns/subagentTurns/compactThreshold/verifyGuard/advisor）+ `saveAgentSettings`
2. **verifyGuard 行为修正**：agent.mjs 的 verify guard 改为 `cfgVerifyGuard === true` 才启用（对齐 CLI opt-in；默认 off 后不再自动回推——与 CLI 一致）
3. **compactThreshold 接线**：context.mjs `compactHistory` 加 explicitThreshold 参数 + baseline 参数（实测 prompt_tokens 基线，CLI parity）；agent.mjs 读 config 传入（explicit > auto-from-model，CLI resolveCompactThreshold 语义；auto = context × 0.6，对齐 CONTEXT-COMPACTION.md D2）
4. settings.mjs 新增 agentSettings/saveAgentSettingsFromPanel（advisor 段合并保留旧字段）
5. chat-panel 路由 saveAgentSettings/getAgentSettings，_pushSettings 带 agentSettings 推送
6. webview：Agent 区块（maxTurns/subagentTurns/compactThreshold/verifyGuard）+ Advisor 区块（enabled/guard/provider/model）+ 保存按钮 ## 4. Proxy（能力缺口，批次 D 已实施） ### 现状（批次 D 后） CLI 的完整 proxy 支持已移植：
1. **`src/proxy.mjs`**：从 CLI 逐字移植（零依赖 CONNECT 隧道，net/tls/stream 原生实现）
2. **接线**：`tools/web.mjs` 的 websearch/fetch 按 `proxy.web` 走代理；`provider.mjs` 的 LLM 请求（chat/listModels）按 `provider.proxyUri` 走代理——providerFromConfig 按 CLI injectProxy 语义注入（per-provider `proxy: true` 且全局 `proxy.model === true` 双重开启）
3. **面板 Proxy 区块**：URI 输入 + web/model 两个开关 + [Test] 按钮（fetch gstatic generate_204，5s 超时）+ 保存
4. 落盘 config.json `proxy` 段（config-io normalizeProxy 复用）；URI 清空 = 清除 ### 实施记录（批次 D） - src/proxy.mjs 移植（resolveProxyConfig/resolveWebProxy/streamHttpResponse/tunnelHttps/tcpConnectProxy/proxyFetch）
- config-io.providerFromConfig 注入 proxyUri（target.proxy === true && proxy.model === true）
- agent.mjs config.proxy 归一化注入（web 工具的 resolveWebProxy 读 ctx.agent.config.proxy）
- settings.mjs proxySettings/saveProxySettingsFromPanel；chat-panel 路由 saveProxySettings + 推送 proxySettings
- eslint globals 补 Headers/Response/Request（Node 18+ 全局）
- test/proxy.test.mjs：config 解析 ×4、normalizeProxy ×1、本地 CONNECT 隧道 ×2（7 个测试） ## 5. 已确认不动的 - ~~`thincoder.autoApprove`（VS Code 特有权限模型，合理留在 settings）~~ **已推翻（2026-08-13）**：autoApprove 迁移为会话级槽位字段（与 CLI 共享 `~/.thincoder/sessions/`），`thincoder.autoApprove` 设置项已删除。AUTO 工具栏按钮 / approve-all 是唯一开关；agent 循环以 live getter 读取，轮次中途翻转立即生效（见 ARCHITECTURE.md 权限审批 UI 行）
- engineering 模式：走 eng 工具（已移植），面板不加开关
- MCP AI 辅助添加（M5）：不做
- 面板整体布局：保持单列滚动分区 ## 6. 实施批次建议 | 批次 | 内容 | 依赖 |
|------|------|------|
| A（已批） | Provider 区块重设计（SETTINGS-PANEL.md） | — |
| B | MCP：迁移 config.json + env/重名/重连 | A 完成后（settings.js 同一文件） |
| C | Agent/Advisor 设置区块 + verifyGuard/compactThreshold 接线（embedding 区块不动，模型写死 bge-m3） | 与 B 无冲突，可并行 |
| D | Proxy 全套（移植 + 接线 + UI） | 独立一批 | ## 7. 验收标准 **B（MCP）**：
1. CLI 与 VS Code 看到同一份 MCP server 列表（改一端另一端刷新可见）
2. stdio 表单含 env；重名拒绝；行显示 ●/○ 与工具数；[Reconnect] 可用
3. 旧 `thincoder.mcpServers` settings 一次性迁入 config.json 并清除 **C（Agent 设置）**：
4. maxTurns/subagentTurns/compactThreshold/verifyGuard/advisor 五项可看可改，改后下一轮生效
5. verifyGuard 默认 off 时 verify guard 不回推（与 CLI 一致） **D（Proxy）**：
6. 设 proxy URI + web:on 后 websearch/fetch 走代理；Test 按钮返回 OK/错误
7. model:on 时 LLM 请求走代理
