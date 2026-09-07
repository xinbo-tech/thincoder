# 模型选择统一 + 会诊/Advisor 思考强度 — 设计 > 状态：**已实施**（0.1.19 统一模型 picker overlay 重构；会诊/Advisor effort 档、会诊读写链随 0.1.19 发布；effort 默认档 0.1.22 起按官方默认或最低档）。
> 关联：CONSULTATION.md（会诊）、SETTINGS-PANEL-2.md §3（Agent 设置卡）。 --- ## 1. 问题 ### 1.1 同一个动作六种风格（用户 2026-08-14 指出） "选模型"在全项目出现 6 处，交互与数据形态互不相同： | # | 位置 | 交互 | 数据形态 |
|---|---|---|---|
| A | 主面板模型选择 | 两级悬停子菜单（provider 行 → 右侧模型列表） | `{id, provider, group, label, reasoning}` |
| B | subagent 模型 ×5（global + 4 角色） | 原生单下拉 | 复合串 `"provider:model"` |
| C | Advisor | provider 下拉 + model 下拉级联 | 两个字段 |
| D | 会诊行 | provider 下拉 + model 下拉级联 | `{provider, model}[]` |
| E | 添加 provider 表单 | 预设下拉 + [获取模型] + 模型下拉 | 抓取后单选 |
| F | Welcome 引导 | provider 下拉 + key 输入 | 仅 provider | 每次加功能"就地解决"一套控件，配置界面成了风格博物馆。 ### 1.2 会诊/Advisor 无法控制思考强度 主对话有思考档位（off~max），但 consult/advisor 的子调用完全不带 `reasoningEffort`——用户无法表达"会诊难题要深挖（max）、快速验证要便宜（low）"。模型选择（视角差异）与强度（深度）是正交的两个维度，都该可配。 --- ## 2. 设计决策（用户拍板记录） 1. **五处全部复用主面板同款两级悬停子菜单**——不是原生下拉（千问一家几十个模型，原生下拉不可用，用户明确否决）；**不加搜索框**（用户明确否决）。
2. **会诊与 Advisor 必须有思考强度档**（用户拍板："会诊和 advisor 是一定要加的"）。
3. **强度显式落盘**——不选也落模型默认档，不留"隐式继承"（用户："谁要你省了？"）。落盘值过时由用户自行改，配置项语义显式优先。
4. subagent **不加**强度档：任务粒度的深度需求由主 agent 派任务时自行表达（判断权给 agent 的既有原则）。 --- ## 3. 组件设计 ### 3.1 modelMenu（可复用悬停菜单） 从 `chat.js` 的 `buildModelDropdown/providerRow` 提取为独立模块 `webview/model-menu.js`： ```
modelMenu({ anchor, value, onPick }) value: { provider, model } | null onPick({ provider, model })
``` - 渲染：provider 行列表，悬停展开右侧模型子菜单（与主面板同款 `.dropdown/.submenu` 结构与 CSS）。
- 数据源：`ctx._models`（面板已有，extension 推送的全量 `{id, provider, group, label, reasoning}[]`）。
- 行为：点击模型 → `onPick` → 关闭；点击外部/Esc → 关闭；子菜单超高滚动（既有 max-height 行为）。
- 主面板自身也改为经此模块构建（消除 chat.js 内联版，单一实现）。 ### 3.2 替换清单 | 位置 | 现控件 | 换成 | 值迁移 |
|---|---|---|---|
| B subagent ×5 | 原生 select（`provider:model`） | modelMenu 触发按钮 | 存取边界转换复合串 ↔ `{provider, model}`（**落盘格式不变**，仍 `provider:model`，与 CLI 兼容） |
| C Advisor | 双 select 级联 | modelMenu ×1 | `advisor.provider + advisor.model`（落盘不变） |
| D 会诊行 | 双 select 级联 | modelMenu ×行 + 强度下拉 | `{provider, model, effort}[]`（新增 effort） |
| A 主面板 | chat.js 内联实现 | 改用 modelMenu 模块（行为不变） | — |
| E 添加 provider | 保留 | 不动（一次性抓取流程，非选模型） |
| F Welcome | 保留 | 不动（仅选 provider + key） | ### 3.3 思考强度档（effort） **选项来源**：`specForModel(model).reasoningEffortEnum`（官方枚举，已与各家 OpenAPI 对齐）。 **显示规则**：
- 所配模型有 `reasoningEffortEnum` → 显示强度下拉（原生 select——**选项 ≤7 个**，原生合适）
- 非思考模型（gpt-4o、gemini 等）→ 强度下拉隐藏，effort 落 `null` **默认值 = 模型官方默认档**（DeepSeek→high、GLM/kimi→max、qwen3.8-preview→xhigh），来源 spec 新增 `reasoningEffortDefault` 字段；spec 未标则取枚举最高档。**显式落盘**：即使用户没动过，保存时也写入该默认值。 **落盘格式**： ```jsonc
"agent": { "consultModels": [ { "provider": "zhipu-plan", "model": "glm-5.2", "effort": "max" }, { "provider": "deepseek", "model": "deepseek-v4-pro", "effort": "high" } ], "advisor": { "enabled": true, "provider": "...", "model": "...", "effort": "high" }
}
``` **生效链路**：
- `consult.mjs`：构建会诊子 provider 时 `reasoningEffort = entry.effort`（buildRequest 已透传）
- `advisor.mjs`：构建审查 provider 时同上
- thinking 开关沿用 provider 条目自身（有 `thinking` 用之，无则 spec 缺省开思考——既有行为） ### 3.4 模型默认档 spec 数据 `src/config.mjs` 各 spec 增补 `reasoningEffortDefault`（对齐官方文档默认值）：
deepseek 系 → `"high"`；kimi-k3/k3 → `"max"`；glm-5.2/glm-5 → `"max"`；qwen3.8-max-preview → `"xhigh"`。 --- ## 4. 交互流（会诊行最终形态） ```
[ Zhipu GLM · glm-5.2 ▾ ] [ max ▾ ] [✕] ← modelMenu 触发按钮 + 强度 select
[+ 添加会诊模型] - 点触发按钮 → 悬停菜单（同主面板）→ 选 provider → 悬停 → 选模型
- 选完：effort 下拉刷新为该模型枚举，值 = 默认档
- 非思考模型：effort 下拉消失
- change-to-save：选完 400ms 自动落盘（既有机制）
``` Advisor 同理（一个 modelMenu + 一个 effort select）。 --- ## 5. 受影响文件 | 文件 | 动作 |
|---|---|
| `webview/model-menu.js` | **新增**：悬停菜单组件（从 chat.js 提取） |
| `webview/chat.js` | 主面板改用组件；删除内联实现 |
| `webview/settings.js` | B/C/D 替换为 modelMenu；会诊行/Advisor 加 effort select |
| `webview/chat.css` | 菜单样式如需从 chat 上下文解耦则调整选择器 |
| `src/config.mjs` | spec 增补 `reasoningEffortDefault` |
| `src/config-io.mjs` | consultModels 校验含 effort（字符串枚举）；advisor 合并保留 effort |
| `src/agent-tools/consult.mjs` | 子 provider 注入 `reasoningEffort: entry.effort` |
| `src/agent-tools/advisor.mjs` | 审查 provider 注入 effort |
| `locales/en.json` / `zh.json` | effort 标签、隐藏时无文案需求 |
| `test/settings.test.mjs` | 选模型交互、effort 默认/落盘/隐藏 |
| `test/config-io.test.mjs` | consultModels+advisor effort 往返 |
| `test/provider.test.mjs` | spec reasoningEffortDefault 断言 | ## 6. 验收标准 1. 设置卡内任何"选模型"操作与主面板同款悬停菜单；键盘可达（↑↓ Enter Esc）
2. subagent 5 处选完后落盘值仍为 `provider:model`（CLI 兼容不变）
3. 会诊行选模型后 effort 下拉出现且为该模型默认档；保存落盘 `{provider, model, effort}`
4. Advisor 同上
5. 非思考模型的行无 effort 下拉，落盘 effort:null
6. consult_start 起的子请求带 `reasoning_effort`（抓包/日志可证）
7. 会诊/Advisor 行为回归：既有 consult 测试全绿 ## 7. 明确不做 - 主面板/设置卡**不加搜索框**（用户否决）
- subagent 不加 effort（判断权给主 agent）
- E（添加 provider 表单）/ F（Welcome）不改
- 不引入第三方组件库
