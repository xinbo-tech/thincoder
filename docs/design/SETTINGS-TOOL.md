# settings 工具——agent 配置调整（SETTINGS-TOOL）

> 板块：工具系统（TOOLS.md 同板块独立保留——MCP.md / VERIFY-DOCONLY.md 先例）
> 状态：**已实现（2026-09-05——CLI settings.test 11/11 + VS Code 镜像 6/6 全绿——CLI dispatch 回归绿——热应用/遮罩/门禁/类型校验 T-S1.1-11 全勾销）**
> 关联：`docs/design/README.md`（地图）、`docs/design/TOOLS.md`（工具系统权威——§1 注册表/§3 门禁）、`docs/design/AGENT-PARAMS-*.md`（Agent 运行参数专题——本工具是其 agent 化调整面）

## 0. 动机（2026-09-05 实证）

agent 工具面全量盘点（25 内置 + 12 元工具）**无任何配置调整工具**——`/config` 是用户 TUI 命令不在 agent 工具表。agent 当前"变通"= bash/write 直接改 `~/.thincoder/config.json`：①无校验（写坏全文件）；②运行中不生效（agent.config 是内存对象——改文件不刷新）；③只能等重启。用户问"有没有给 agent 调整配置参数的 tool" → 没有 → 立项。

## 1. 需求（F-S1）

- **F-S1.1（list）**：`settings list`——config.json 当前值全量清单（递归展平键 + 值 + 类型）——**敏感键值遮罩**（见 N-S1.2）——readonly；
- **F-S1.2（get）**：`settings get <key>`——单键当前值（点分路径寻址——`agent.maxTurns` / `traces.enabled` / `providers.0.model` / 任意嵌套）——readonly；
- **F-S1.3（set）**：`settings set <key> <value>`——**写盘（config.json 持久化）+ 热应用（运行中 agent.config 立即更新）**——侧效（审批门）；值解析：JSON.parse 成功 → JSON 值（数字/布尔/对象/数组/带引号字符串）；失败 → 字符串字面；
- **F-S1.4（热应用语义）**：set 后运行中即刻生效（回合边界读取的键（maxTurns/autoThink 等）下回合生效；会话内持续读取的键即时）；重启不丢（写盘）；
- **F-S1.5（类型护栏）**：**已知键**（config.mjs DEFAULTS 形状内）值类型与默认不符 → 拒绝并提示期望类型（类型表自动派生自 DEFAULTS——不手写防漂移）；**未知键** → JSON 原样（全量域内）；
- **F-S1.6（持久性边界——文档级限制）**：可写键限 **loadConfig 保留域**（config.json 顶层已知节内：providers/activeProvider/$schema/embedding/agent/mcp/proxy/traces 等——loadConfig 会重建的节）——节外任意键写盘后下次启动会被合并逻辑丢弃（已知节内仍全量任意嵌套）。

## 2. 非功能（N-S1）

- **N-S1.1 门禁**：list/get = readonly（免审批 + planMode 放行——memory search 同款动作级只读分类）；set = sideEffect（审批门——dispatch 侧效分类 + 写盘）；
- **N-S1.2 敏感遮罩（安全护栏——用户选全量后的必要配套）**：键路径段匹配敏感形态（`apiKey`/`key`/`token`/`secret`/`password`——大小写不敏感、`api_key`/`api-key` 等变体）→ **list/get/set 回显与错误文本永不出现明文**（显示 `••••（masked）`）——防密钥泄漏进会话历史/trace；**set 敏感键允许**（agent 帮用户换 key 是合法需求——值由用户给——写入文件真实生效、回显遮罩）；list 中敏感键名保留（键可见、值遮罩）；
- **N-S1.3 零额外依赖/纯 node**（settings.mjs 只 import node:fs/path——与 config.mjs 同界）；
- **N-S1.4 描述纪律**：工具描述写清——set = 持久配置变更（写 `~/.thincoder/config.json`）；敏感值永不明文回显；热应用语义（回合边界）；`/config` 是用户等效手动面（工具不替代用户 TUI——agent 自主调参的通道）。

## 3. 设计（D-S1）

- **D-S1.1 注册**：CLI `src/agent-tools/settings.mjs` 导出 `settingsTool`（name `"settings"`；parameters：action enum [list/get/set]、key、value——按 action 分支必填）；`src/agent-tools.mjs` 注册表加行；dispatch 动作级只读分类加 list/get（memory 同款判定处扩展）；工具级 `readonly: false`（set 存在——动作级分类管控）；
- **D-S1.2 键寻址与展平**：`getKeyPath(obj, "a.b.0.c")` 逐段下钻（数组数字段支持）；`setKeyPath` 自动建中间对象（cmd-config 数值项同款 split/建链）；list 递归展平当前 agent.config 实值（含数组下标段——`providers.0.model` 形态）；
- **D-S1.3 热应用实现**：set = `setKeyPath(agent.config, key, value)`（内存即热——agent.config 是运行读取源）→ 写盘 `configPath`（原子 JSON.stringify 2 空格——无 BOM——RELEASE.md §4.5 教训）+ 敏感键回显遮罩。**不整 reload**（cmd-config 的 reloadConfig 会 loadConfig + injectProxy + provider 恢复——settings 直接改内存对象等价且无副作用——但注意：agent.config 是 loadConfig 产物（含 DEFAULTS 合并节）——set 键写盘后下次启动 loadConfig 重新合并——已知节内一致）；
- **D-S1.4 敏感判定**：`SENSITIVE = /(^|\.)[^.]*(api[_-]?key|token|secret|password)[^.]*(\.|$)/i` 对完整键路径测试（段级）；命中 → 值域一律 `••••（masked）`；
- **D-S1.5 VS Code 镜像**：thincoder-vscode 端 agent-tools 同构移植——**实测（2026-09-05 实现批）**：VS Code config-io 与 CLI 同读共享 `~/.thincoder/config.json`（`_configPath()`——测试可注入）——settings 写盘 = 同一共享文件（非 settings.json——设计初稿推测句作废）；热应用 = ctx.agent.config 内存对象（VS Code agent 同构）；注册于 setup.mjs depth-0 agentTools（isReadonlyAction 动作分类——subagent/memory 同款机制——无 CLI 式 dispatch 分支）。
- **D-S1.6 已知键类型表**：遍历 `DEFAULTS`（config.mjs 导出）递归生成 `键路径 → typeof 默认值` 映射（模块加载时一次构建）——set 校验用；未知键跳过类型校验。**方案 A 落地（2026-09-05 用户选 A——消除手写同步）**：VS Code 端 config-io 收拢 `AGENT_DEFAULTS`/`TRACES_DEFAULTS` 单一来源（loadAgentSettings 改引用——消灭内联默认漂移 + 补 autoThink CLI-parity 键）——settings 类型表两端同构自动派生（VS Code 删手写 mini 表）——**加键流程：CLI config.mjs DEFAULTS 一处 + VS Code config-io AGENT_DEFAULTS 一处 → 类型护栏自动跟随**；null/对象/数组默认值键无标量约束（compactThreshold null=auto 等——消费方/面板层校验）。

## 4. 测试（T-S1——CLI test/settings.test.mjs + VS Code 镜像）

| # | 类别 | 输入 | 预期 |
|---|---|---|---|
| T-S1.1 | N | list | 全键展平 + 类型标注；含 `agent.maxTurns` 等；`providers` 段 apiKey 显示 `••••（masked）` |
| T-S1.2 | N | get agent.maxTurns | 当前值 200（DEFAULTS） |
| T-S1.3 | E | get agent.nonexistent | 报错 no such key（含就近提示？——顶层/父键存在与否） |
| T-S1.4 | N | set agent.maxTurns 500 | 内存热应用（agent.config.agent.maxTurns=500）+ 文件写盘（重读 config.json 断言）+ 回显无遮罩（非敏感） |
| T-S1.5 | E | set agent.maxTurns "abc" | 拒绝（类型不符——期望 number）——文件与内存均不变 |
| T-S1.6 | N | set traces.enabled true（字符串 "true"） | JSON.parse → boolean true 生效 |
| T-S1.7 | E | set 敏感键（providers.0.apiKey "sk-xxx"） | 写入文件真实生效；回显 `••••（masked）`——明文不出现在任何返回值 |
| T-S1.8 | N | set 未知键（节内任意嵌套，如 agent.customFlag true） | JSON 原样写入生效（全量域内） |
| T-S1.9 | E | 门禁：list/get 免审批路由 + planMode 放行（dispatch 真路由——memory search 同款测试）；set 审批拦截 | 分类正确 |
| T-S1.10 | N | set 对象/数组值（JSON.parse 路径） | 对象写入 + 展平后 get 子键可见 |

（临时 config 隔离：测试用 `THINCODER_CONFIG_DIR` 或注入 configPath——以 config.mjs 现有测试隔离机制为准——实现批核对。）

## 5. 验收（AC-S1）

AC-S1.1 = T-S1 双端绿；AC-S1.2 = 既有工具面零破坏（注册表 25→26——工具表全量断言/枚举处同步——TOOLS.md §1 + dispatch 测试）；AC-S1.3 = 敏感遮罩抽查（任何返回值含明文 sk- → 失败）；AC-S1.4 = 热应用真机验证（set 后同会话 get 见新值）。

## 6. 受影响文件

| 端 | 文件 | 动作 |
|---|---|---|
| CLI | `src/agent-tools/settings.mjs` | NEW（工具实现） |
| CLI | `src/agent-tools.mjs` | MODIFY（注册） |
| CLI | dispatch 只读动作分类 | MODIFY（list/get 放行——memory 同款处） |
| CLI | `src/tools/index.mjs`？ | 否（agent-tools 不在此——§1 注册表计数 25→26 待核（计数含元工具与否——实现批核对） |
| CLI | `test/settings.test.mjs` | NEW |
| CLI | `docs/design/TOOLS.md`（§1 若列 agent-tools 名） | MODIFY |
| CLI | `docs/design/README.md` | MODIFY（地图登记——TOOLS.md 板块独立保留） |
| CLI | `CHANGELOG.md` | MODIFY（[Unreleased]） |
| VS Code | agent-tools 镜像 + 注册 + 门禁 + 测试 + 文档 | 同批 |

## 7. 关键决策

- **全量任意键而非白名单**（用户拍板——明知可碰 apiKey 仍选全量）：配套 N-S1.2 敏感遮罩护栏（不是禁止——遮罩回显防泄漏；set 敏感键合法）——取舍记录：agent 理论上可把 apiKey 改成错误值（自伤）——与 bash rm -rf 同族（agent 自主域——审批门是防线——护栏为防"无意的明文泄漏"而非防"有意的破坏"——§5 安全剧场同哲学）；
- **单工具多动作**（list/get/set——§19 裁定"工具会爆炸——靠参数做不同的事"——memory/subagent 先例）；
- **热应用而非"改完重启"**：set 内存即热 = 本工具存在理由（否则等价用户手改文件）；持久化写盘保重启；
- **文档级持久性边界**（F-S1.6）：loadConfig 保留域外键不承诺重启存活——设计诚实声明而非假装全量持久；
- **双端同批**（用户拍板）——VS Code config 存储差异（settings.json vs config.json）以 D-S1.5 偏差注处理。
