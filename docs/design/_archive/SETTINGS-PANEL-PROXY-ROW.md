# 配置面板 · 批次 A 增补：Provider 行内 Proxy 开关 > 状态：**已实施**（2026-08-03）。
> 本增补属于 SETTINGS-PANEL.md（批次 A，已实施）的扩展，不改动已定契约，只在 Provider 行内增加一个 per-provider 的 proxy 开关。 ## 1. 需求 配置面板的 **Provider 列表每一行**增加一个"走 proxy"勾选框，**与 preset/custom 无关**——任何 provider（preset 添加的、custom 添加的、CLI 加的）都可以独立勾选是否走代理。 ## 2. 现状与底层支持 - config.json 的 provider 条目支持 `proxy: true` 字段（CLI `injectProxy` 语义：per-provider `proxy: true` **且** 全局 `config.proxy.model === true` 双重开启，模型请求才走代理）
- `providerFromConfig`（config-io.mjs）已读 `target.proxy === true` 注入 `provider.proxyUri`——**底层已就绪，只缺 UI 落盘/勾选**
- 全局开关 `proxy.model`（批次 D 的面板 Proxy 区块）保持不动：它是"总闸"，行内勾选是"分支" ## 3. 设计 ### 3.1 行内 UI ```
PROVIDERS [+ Add]
┌────────────────────────────────────────────────────────────┐
│ (●) DeepSeek deepseek-v4-pro [☑ proxy] [Key] [−] │
│ api.deepseek.com │
└────────────────────────────────────────────────────────────┘
``` - checkbox 放在按钮组最左（model 之后、[Key] 之前），label 小字 "proxy"
- 勾选状态 = config.json 该 provider 条目的 `proxy === true`
- 勾选/取消即落盘（persistRaw，单字段更新），不提交整个表单 ### 3.2 语义（与全局 Proxy 区块的配合） | 行内 proxy | 全局 proxy.model | 模型请求走代理？ |
|-----------|-----------------|-----------------|
| ☑ | ☑ | ✅ |
| ☑ | ☐ | ❌（总闸关） |
| ☐ | ☑ | ❌（该 provider 不启用） |
| ☐ | ☐ | ❌ | 行内勾选只是"该 provider 允许走代理"的意愿标记；真正生效仍需全局 `proxy.model` 开启 + `proxy.uri` 已配置。UI 上全局关时勾选不报错（预配置），文档写明。 ### 3.3 消息协议 新增（webview → extension host）： | 消息 | 载荷 | 行为 |
|------|------|------|
| `setProviderProxy` | `{ name, proxy: boolean }` | 写 config.json providers[i].proxy（false 时删字段） | ### 3.4 改动文件 | 文件 | 改动 |
|------|------|
| `src/extension/settings.mjs` | providerStatus 每项加 `proxy: entry.proxy === true`；新增 handleSetProviderProxy（纯落盘） |
| `src/extension/chat-panel.mjs` | 路由 setProviderProxy |
| `webview/settings.js` | 每行加 proxy checkbox + onchange 发消息 |
| `test/provider-panel.test.mjs` | setProviderProxy 落盘/删字段测试 | 不改：config-io.mjs（providerFromConfig 已读）、全局 Proxy 区块、消息协议其余部分。 ## 4. 验收标准 1. 每行有 proxy checkbox，状态与 config.json providers[i].proxy 一致
2. 勾选 → `proxy: true` 落盘；取消 → 字段删除（false 不落盘）
3. preset/custom/CLI 添加的 provider 一视同仁
4. 全局 proxy.model 关时勾选不报错（预配置）
5. 测试全过、ESLint 干净
