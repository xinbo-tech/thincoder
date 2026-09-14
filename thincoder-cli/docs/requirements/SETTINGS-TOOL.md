# SETTINGS-TOOL — 需求

> 板块：settings 工具（运行时配置查看/修改/热应用）。需求层文档（docs/requirements/）。
> 状态：已实现 + **2026-09-11 第 8 批在途**（null 默认值键形状约束——F-S1.7/F-S1.8/N-S1.5；设计 `../design/SETTINGS-TOOL.md` §8）；**第 13 批（2026-09-11）**：parseValue 两端统一（F-S1.3 补充块——**用户裁定 ① 去引号**——2026-09-11；设计 `../design/SETTINGS-TOOL.md` §9）。
> 来源：2026-09-10 自 `../design/SETTINGS-TOOL.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 1. 总体需求

给 agent 一条**自主调整运行时配置**的通道（`/config` 的 agent 化版本）：`settings list/get/set` 覆盖 config.json 任意键，set = 写盘 + 热应用，带敏感键遮罩与已知键类型护栏——使“运行中调参”不必经 bash/write 手改文件（无校验、不热应用、需重启）。

> 本节为 2026-09-11 第 8 批回填（2026-09-10 抽取时 §1 遗漏——补回模板结构：§1 总体 / §2 功能 / §3 非功能 / §4 范围边界）。

## 2. 需求（F-S1）

- **F-S1.1（list）**：`settings list`——config.json 当前值全量清单（递归展平键 + 值 + 类型）——**敏感键值遮罩**（见 N-S1.2）——readonly。
- **F-S1.2（get）**：`settings get <key>`——单键当前值（点分路径寻址——`agent.maxTurns` / `traces.enabled` / `providers.0.model` / 任意嵌套）——readonly。
- **F-S1.3（set）**：`settings set <key> <value>`——**写盘（config.json 持久化）+ 热应用（运行中 agent.config 立即更新）**——侧效（审批门）。值解析：JSON.parse 成功 → JSON 值（数字/布尔/对象/数组/带引号字符串）；失败 → 字符串字面。
  - **值解析两端统一（2026-09-11 第 13 批——用户裁定 ① 去引号）**：现状两端对「JSON 解析成功但结果为字符串」处理不同——
    CLI 落盘**原始串含引号**（输入含引号，形如 `"abc"` → 落盘 `"abc"`），VSC 落盘**解析值**（→ `abc`）。本批统一为**两端同一语义**，
    候选（**① 已裁定落地**——2026-09-11）：① 统一为**解析值**（去引号）② 统一为**原始串**（保引号——未选）③ 登记差异（未选——同一配置文件两端写入语义分裂）。
    **判定句（选定分支 ①）**：对输入（值串含引号字符）——① 两端落盘 `abc`；② 两端落盘 `"abc"`（未选）；③ 维持两端各异（未选——显式登记 + 双端测试各锁现状）；
    不可消费形态（如字符串赋给数值键）两端同拒、磁盘零变化。
- **F-S1.4（热应用语义）**：set 后运行中即刻生效——回合边界读取的键（maxTurns/autoThink 等）下回合生效；会话内持续读取的键即时；重启不丢（写盘）。
- **F-S1.5（类型护栏）**：**已知键**（config.mjs DEFAULTS 形状内）值类型与默认不符 → 拒绝并提示期望类型（类型表自动派生自 DEFAULTS——不手写防漂移）；**未知键** → JSON 原样（全量域内）——null 默认值键的形状约束见 **F-S1.7**（2026-09-11 新增）。
- **F-S1.6（持久性边界——文档级限制）**：可写键限 **loadConfig 保留域**（config.json 顶层已知节内：providers/activeProvider/$schema/embedding/agent/mcp/proxy/traces 等——loadConfig 会重建的节）。节外任意键写盘后下次启动会被合并逻辑丢弃（已知节内仍全量任意嵌套）。

- **F-S1.7（null 默认值键的形状约束——2026-09-11 第 8 批）**：**已知键**中**默认值为 `null`** 的键不得按 `typeof null`（`"object"`）判定类型，必须按其**真实消费形态**校验：
  - **接受 = 真实消费形态 ∪ `null`**（`null` = 显式清除，语义 = 该键的“未设置”态）；
  - **拒绝 = 不可消费形态**——应用侧读不出写入值（被读成“未设置/无效/回落”，或在远端以报错终止）的形态；
  - CLI 当前 null 叶子 4 键与形态（带代码依据）：`defaultModel` = `"provider:model"` 复合串 · `agent.subagentModel` = 非空串（`provider:model` / 渠道名 / 模型名）· `shell` = 非空串（shell 路径或命令）· `memory.team` = 含非空 `repo` 的对象（`name`/`dir` 可选）；
  - **同族（本批勘察纳入——已裁定保留；2026-09-11 用户裁定）**：`agent.subagentModels`（默认 `{}` ⇒ 派生表零条目 ⇒ 零约束）按同一判据——形态 = 角色→非空串对象（`{}` = 清除）∪ `null`；角色名不校验；单列于兄弟形状表（`_SIBLING_SHAPES`——存在性断言面，不计入完备性锁的相等集）；
  - **VSC 端对位（2026-09-11 第 12 批——W2 裁定：两端共享同一 `~/.thincoder/config.json`，同一缺陷完整存在）**：VSC 写面（settings 工具）补入同族键第 4 条——`agent.subagentModels` 按上条同一形态校验（角色→非空串对象 ∪ `null`；`{}` = 清除）；判定句与上条同。设计见 VSC 仓 TOOLS 档 §5；测试 = settings-tool 测试档 T-S2.36/T-S2.37。
  - **范围边界**：只校验**形状**（形态/非空/必填键），**不**校验渠道、模型、可执行文件是否存在（运行期语义——`model-ref.mjs` 契约与 D-S1 原因面负责）；数组默认值键（`consultModels`/`streamRules`/`mcp.servers`/`providers`）维持既有豁免；
  - **判定句**：上列键的合法形态值 → `settings set` 接受（磁盘写入 + 内存热应用 + 回显）；不可消费形态值 → 拒绝（抛错 + 磁盘/内存零变化）。
- **F-S1.8（无静默写入——2026-09-11 第 8 批）**：**被接受的写入不得在下游被无声置空/忽略**——“写了等于没写”不允许存在：通过校验的值要么在应用侧读取时得到与“未设置”态**可区分**的结果，要么被工具**拒绝**并给出**可操作原因**（含期望形态）。
  - **判定句**：对每个受约束键，测试断言「**接受集 == 应用侧可消费集** ∧ **拒绝集 == 应用侧不可消费集**」（表驱动集合相等），且被拒值的写入尝试不改变磁盘与内存。
  - **机械凭据**：不可消费判据 = 应用侧读取器的真实条件（`src/config.mjs:277` · `src/cli/make-agent.mjs:150` · `src/agent-tools/subagent-spawn.mjs:92` · `thincoder-core/tools/bash.mjs:131` · `src/model-ref.mjs:25-36` 形态面——存在性面 `:38-43` 不查），测试以真读取器（`loadConfig` / `effectiveSubagentModel` / `model-ref` 形态判据）或逐字条件断言。

## 3. 非功能需求（N-S1）

- **N-S1.1 门禁**：list/get = readonly（免审批 + planMode 放行——memory search 同款动作级只读分类）；set = sideEffect（审批门——dispatch 侧效分类 + 写盘）。
- **N-S1.2 敏感遮罩（安全护栏——用户选全量后的必要配套）**：键路径段匹配敏感形态（`apiKey`/`key`/`token`/`secret`/`password`——大小写不敏感、`api_key`/`api-key` 等变体）→ **list/get/set 回显与错误文本永不出现明文**（显示 `••••（masked）`）——防密钥泄漏进会话历史/trace。**set 敏感键允许**（agent 帮用户换 key 是合法需求——值由用户给——写入文件真实生效、回显遮罩）。list 中敏感键名保留（键可见、值遮罩）。
- **N-S1.3 零额外依赖/纯 node**（settings.mjs 只 import node:fs/path——与 config.mjs 同界）。
- **N-S1.4 描述纪律**：工具描述写清——set = 持久配置变更（写 `~/.thincoder/config.json`）；敏感值永不明文回显；热应用语义（回合边界）；`/config` 是用户等效手动面（工具不替代用户 TUI——agent 自主调参的通道）；**类型校验口径（含 null 默认值键按真实消费形态）**（2026-09-11 增补）。

- **N-S1.5 护栏表防漂移（2026-09-11 第 8 批）**：F-S1.5 的自动派生意图**保留**——非 `null` 叶子继续由 `DEFAULTS` 派生（零手写）；`null` 叶子由**显式形状表**声明（唯一手写面——null 叶子 **4 条** + 同族 1 条单列于兄弟结构 `_SIBLING_SHAPES`，逐键带代码依据）。
  机械锁二重：① **完备性**——`DEFAULTS` 的 null 叶子键集 == null 叶子形状表（`_NULL_LEAF_SHAPES`）键集（测试断言 + 运行期一次性警告列出未声明键名；同族/跨端条目在兄弟结构内**存在性断言**——不参与集合相等）；② **语义零变**——非 null 叶子的派生结果与旧实现逐键相等。

## 4. 范围边界（不做）

- **不**改 `DEFAULTS` / `AGENT_DEFAULTS` 键集与语义；**不**改读取侧（`config.mjs` / `make-agent.mjs` / `bash.mjs` / `subagent-async.mjs`）。
- **不**改其它写面：`/config`·`/shell`·`/submodel` TUI、VSC 面板写面、`persistRaw`/`writeConfigAtomic` 写链。
- **不**校验渠道/模型/可执行文件存在性、角色名合法性（形状层止步——D-S2.5）。
- **不**改 list/get、写盘最小化 D-F5b、审批门、热应用语义（N-S1.2 错误文案合规化属既有条款而非新行为）。
- 数组默认值键（`consultModels`/`streamRules`/`mcp.servers`/`providers`）维持既有豁免；**不**改任何用户配置文件内容。
- 详本见 `../design/SETTINGS-TOOL.md` §8.7（第 8 批边界）。
