# SETTINGS-TOOL — 需求

> 板块：settings 工具（运行时配置查看/修改/热应用）。需求层文档（docs/requirements/）。
> 状态：已实现。
> 来源：2026-09-10 自 `../design/SETTINGS-TOOL.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 2. 需求（F-S1）

- **F-S1.1（list）**：`settings list`——config.json 当前值全量清单（递归展平键 + 值 + 类型）——**敏感键值遮罩**（见 N-S1.2）——readonly。
- **F-S1.2（get）**：`settings get <key>`——单键当前值（点分路径寻址——`agent.maxTurns` / `traces.enabled` / `providers.0.model` / 任意嵌套）——readonly。
- **F-S1.3（set）**：`settings set <key> <value>`——**写盘（config.json 持久化）+ 热应用（运行中 agent.config 立即更新）**——侧效（审批门）。值解析：JSON.parse 成功 → JSON 值（数字/布尔/对象/数组/带引号字符串）；失败 → 字符串字面。
- **F-S1.4（热应用语义）**：set 后运行中即刻生效——回合边界读取的键（maxTurns/autoThink 等）下回合生效；会话内持续读取的键即时；重启不丢（写盘）。
- **F-S1.5（类型护栏）**：**已知键**（config.mjs DEFAULTS 形状内）值类型与默认不符 → 拒绝并提示期望类型（类型表自动派生自 DEFAULTS——不手写防漂移）；**未知键** → JSON 原样（全量域内）。
- **F-S1.6（持久性边界——文档级限制）**：可写键限 **loadConfig 保留域**（config.json 顶层已知节内：providers/activeProvider/$schema/embedding/agent/mcp/proxy/traces 等——loadConfig 会重建的节）。节外任意键写盘后下次启动会被合并逻辑丢弃（已知节内仍全量任意嵌套）。

## 3. 非功能需求（N-S1）

- **N-S1.1 门禁**：list/get = readonly（免审批 + planMode 放行——memory search 同款动作级只读分类）；set = sideEffect（审批门——dispatch 侧效分类 + 写盘）。
- **N-S1.2 敏感遮罩（安全护栏——用户选全量后的必要配套）**：键路径段匹配敏感形态（`apiKey`/`key`/`token`/`secret`/`password`——大小写不敏感、`api_key`/`api-key` 等变体）→ **list/get/set 回显与错误文本永不出现明文**（显示 `••••（masked）`）——防密钥泄漏进会话历史/trace。**set 敏感键允许**（agent 帮用户换 key 是合法需求——值由用户给——写入文件真实生效、回显遮罩）。list 中敏感键名保留（键可见、值遮罩）。
- **N-S1.3 零额外依赖/纯 node**（settings.mjs 只 import node:fs/path——与 config.mjs 同界）。
- **N-S1.4 描述纪律**：工具描述写清——set = 持久配置变更（写 `~/.thincoder/config.json`）；敏感值永不明文回显；热应用语义（回合边界）；`/config` 是用户等效手动面（工具不替代用户 TUI——agent 自主调参的通道）。
