# settings 工具（SETTINGS-TOOL）· 设计

> 板块 = **settings 工具**——agent 自主调整运行时配置的通道（agent 化版 `/config`）。
> 本档 = 该机制的**设计面唯一权威**（注册与动作分类 / 键寻址 / 热应用与写盘 / 敏感遮罩 / 值解析 / 类型护栏与 null 形状表 / 决策）。
> 相邻权威 = `docs/core/design/TOOLS.md`（工具系统权威——注册表 / 门禁）· `docs/core/design/AGENT-PARAMS.md`（Agent 运行参数专题——本工具是其 agent 化调整面）·
> `docs/core/design/MULTI-INSTANCE-COLLAB.md` §6（`writeConfigAtomic` 原子写语义——本档不复制）。
> 需求侧 = `docs/core/requirements/SETTINGS-TOOL.md`（F-S1.* / N-S1.*）。
> 建档：2026-09-15（**CLI 尾部真批 · 纯新建**——`thincoder-cli/docs/design/SETTINGS-TOOL.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史；VSC 镜像 = 同构实现（原则句在留，VSC 侧逐文件坐标归 VSC 轮——P2）。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与动机

agent 工具面**无任何配置调整工具**——`/config` 是用户 TUI 命令、不在 agent 工具表；agent 的「变通」= bash / write 直改 `~/.thincoder/config.json`
（无校验 · 运行中不生效 · 只能等重启）。本工具 = `settings list/get/set` 覆盖全量 config.json 任意键，带敏感键遮罩护栏；
不替代用户 TUI——`/config` 仍是用户等效手动面。

## 2. 机制契约

### 2.1 注册与动作分类

`thincoder-core/agent-tools/settings.mjs` 导出 `settingsTool`：name `"settings"`；parameters = `action` enum [list/get/set] + `key` + `value`（按 action 分支必填——`:217-219`）。
CLI 装配 = `thincoder-cli/src/cli/make-agent.mjs`（baseTools）。dispatch 动作级只读分类：`list` / `get` 放行、`set` 保持侧效门；工具级 `readonly: false`（动作级分类管控）。

### 2.2 键寻址与展平

- `resolvePath(obj, "a.b.0.c")`（`:146`）逐段下钻（数组数字段支持）；get 缺失段返回 `{ ok:false, reached, missing, depth }`，报错含就近提示；
- `setKeyPath` 自动建中间对象；返回旧值；
- list 递归展平当前 `agent.config` 实值（含数组下标段——`providers.0.model` 形态），按 path 排序。

### 2.3 热应用 + 写盘（磁盘真相最小化）

`set` = `setKeyPath(agent.config, key, value)`（内存即热——agent.config 是运行读取源）→ 写盘 `writeConfigAtomic(cfgPath, fn)`
（**D-F5b 语义**：磁盘新鲜读 + 只改被设键——**默认值不固化**——+ mtime 门控；冲突 / 畸形抛错 → 内存不热应用，零虚假成功——语义权威 = `MULTI-INSTANCE-COLLAB.md` §6.3）。
**不整 reload**（直接改内存对象等价且无副作用）。

### 2.4 敏感判定

`SENSITIVE_SEGMENT = /(^|[._-])(api[_-]?key|key|token|secret|password)($|[._-])/i`（`:15`）——对完整点分键路径做段级测试；
命中 → 值域一律 `••••（masked）`（含**错误文案**的值位——D-S2.4），键名保留可见。

### 2.5 值解析（parseValue——引号语义 2026-09-11 用户裁定 ① 去引号）

`parseValue(raw)`（`:188`）：JSON.parse 成功且为顶层标量 / 对象 / 数组 → 采用解析结果；**JSON 解析成功但结果为字符串 → 解析值（去引号——`:196` `return v`）**；
parse 失败 → 字符串字面（`:198` `return s`——裸 `abc`）。两端语义统一（去引号 = ① 选定分支；引号 = JSON 语法、可表达「字符串数字」）。

### 2.6 已知键类型护栏（自动派生 + null 叶子形状表）

- **非 null 叶子**：遍历 `DEFAULTS` 递归生成「键路径 → typeof」映射（模块加载一次构建）——set 校验用；数组不递归、未知键跳过校验（全量域契约）。
- **null 叶子走显式形状表**（根因：`typeof null === "object"` ⇒ 派生表把 null 叶子记成 object ⇒ 合法串被拒 / 非法对象被收 + 下游静默）：
  - **`_NULL_LEAF_SHAPES`**（`:29`——相等面：键集 == `_nullLeafPaths(DEFAULTS)`；CLI 4 键 = `defaultModel` / `agent.subagentModel` / `memory.team` / `shell`）；
  - **`_SIBLING_SHAPES`**（`:38`——存在性面，不参与集合相等；`agent.subagentModels` 等同族键——默认 `{}` ⇒ 派生表零条目零约束，单列于此）；
  - **完备性机械锁**：`_checkShapeCompleteness(DEFAULTS)` 装载自检（`:72-81`——漂移即一次性警告列键名）+ 测试断言（集合相等）。
- **校验语义**（`_checkKnownKeyValue`）：未知键原样通过；非 null 叶子 typeof 语义逐字保留；形状表命中键 = `null` 放行（显式清除——消费面均有「未设置」态）+
  不可消费形态抛错（字符串类键拒空串 / 纯空白，`defaultModel` 另需 `provider:model` 形态；`memory.team` 须 `repo` 非空串、额外键放行；`agent.subagentModels` 值须非空串、角色名不校验）；
  错误消息模板值位在敏感键命中时替换为 `••••（masked）`。
- **加键流程**：核 `config.mjs` DEFAULTS 一处 → 护栏自动跟随（消除手写漂移——W16：VSC 端侧窄表 `AGENT_DEFAULTS` 已删，双源面收单）。
- **测试缝导出**（`_` 前缀——`:265`）：`_buildShapeTable` / `_nullLeafPaths` / `_NULL_LEAF_SHAPES` / `_SIBLING_SHAPES` / `_checkKnownKeyValue` / `_checkShapeCompleteness`。

### 2.7 输出契约

- 行格式：`key = value (type)`（`type` = `typeof`，数组显示 `array`）；敏感键值显示 `••••（masked）`；
- set 回显：敏感键后缀 ` — stored（值不回显）`；非敏感键后缀 ` — persisted + hot-applied（运行中已生效）`。

### 2.8 VSC 镜像（原则面）

W16（2026-09-15）：VSC 端 = **同一核工具实例化**（`thincoder-vscode/src/agent/setup.mjs` 取 `settingsTool(opts)` 工厂；写盘 = 核 `writeConfigAtomic`）；热应用 = `ctx.agent.config` 内存对象；注册于 depth-0 agentTools（动作级只读分类同款机制，`isReadonlyAction` 端面）。
键空间 = 核 `DEFAULTS` 全量（A5 已裁「以 CLI 为准（全量类型校验）」——原端侧窄表 `thincoder-vscode/src/agent-tools/settings.mjs:39-40`（已删）的 `AGENT_DEFAULTS`/`TRACES_DEFAULTS` 键空间退场）；
VSC 端测试坐标 = `thincoder-vscode/test/settings-tool.test.mjs`（8 例——双缝并用：写侧 `settingsTool({ configPath })` + 读侧 `_setConfigPathForTest`）。
**端差（W16 登记——热应用载体键面）**：热应用落点 = 端 `ctx.agent.config` 载体，而 VSC 载体键面 = `{advisor, agent, proxy, shell, providersList, websearch, traces}`
（`thincoder-vscode/src/agent/agent-state.mjs:96-107`）——无 `providers` / `memory` / `embedding` / `mcp` 段 ⇒ 这些键在 VSC 端的「运行中已生效」回显不落端侧运行读取源
（端侧运行读盘面 `loadRaw()`，如 `resolveProviders`）；该面以「写盘为准」（持久化生效，进程内热应用仅限上列键面）。

### 2.9 无静默论证（判据形式——要点）

护栏的**拒绝集 ⊆ 应用侧不可消费集**（逐键证据 = 各形状表行的读取器依据）⇒ 加护栏只减少「写了等于没写」面、不可能新增静默；
判据的机械形式 = 表驱动断言「接受集 == 可消费集 ∧ 拒绝集 == 不可消费集」，判据取自应用侧读取器本体（`loadConfig()` / `effectiveSubagentModel()` / `teamConfig.repo` 条件 / `config.shell` / `model-ref.mjs` 形态面），非测试自造。
形状层止步——存在性 / 可达性（渠道、模型、可执行文件）属运行期域（D-S2.5）。

## 3. 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-ST1 | **全量任意键而非白名单**（用户拍板） | 配套敏感遮罩护栏（防无意明文泄漏，非防有意破坏——与 bash rm -rf 同族，审批门是防线） |
| D-ST2 | **单工具多动作**（list/get/set） | 「工具会爆炸——靠参数做不同的事」（memory / subagent 同款） |
| D-ST3 | **热应用而非改完重启** | set 内存即热 = 本工具存在理由；写盘保重启 |
| D-ST4 | **文档级持久性边界** | loadConfig 保留域外键不承诺重启存活——诚实声明而非假装全量持久 |
| D-ST5 | **null 叶子 = 自动派生 + 显式形状表 + 完备性机械锁** | 否决「跳过 null」（静默面留存 + 新增静默）/ 记 `"any"`（换名不换义）/ 全表手写（丢防漂移） |
| D-ST6 | **不可消费形态一律拒绝** | 应用侧处置 = 读不出写入值（静默折叠 / 远处响亮失败）——接受即承认静默面 |
| D-ST7 | **`null` 保留为合法值**（显式清除） | 四键消费面均有「未设置」态且 TUI 使用该态——清除是有效动作 |
| D-ST8 | **敏感键错误文案遮罩** | 实证 `sk-SECRET` 明文曾进错误文本（违 N-S1.2）——只遮值、不改错误句结构 |
| D-ST9 | **不校验存在性**（渠道 / 模型 / 可执行文件——形状层止步） | 存在性属运行期（`providerInvalidReason` 等既有原因面） |
| D-ST10 | **不动读取侧**（零 reader 改动） | 护栏与 reader 是「拒绝 ⊆ 不可消费」单调关系——不可能新增静默 |
| D-ST11 | **parseValue 引号语义 = 去引号**（2026-09-11 用户裁定 ①） | 否决「保引号」（与裸数值语义撞）/「登记差异维持现状」（切换端配置值漂移）；已落地（`:196`） |
| D-ST12 | **双端同批**（用户拍板） | VSC config 存储差异以偏差注处理；键空间归一（§2.8） |

## 4. 边界（不做）

- 不改 `DEFAULTS` 键集与语义；不改读取侧折叠 / 回落点；不改其它写面（`/config` `/shell` `/submodel` TUI 各自菜单值域受控，不共用本校验）；
- 数组默认值键（`consultModels` / `streamRules` / `mcp.servers` / `providers`）维持既有豁免（下无标量约束）；
- 不校验角色名合法性；不做跨端配置迁移（用户既有值不动）；
- UI/交互：无 UI 面变更——唯一模型可见文案面 = 工具 description（语义判据：含 null 默认值键按真实消费形态校验 + 不可消费形态被拒；逐字文案 = 产品代码，驻 `thincoder-core/agent-tools/settings.mjs:207`）。

## 5. 机制面坐标（核 / CLI · as-of 2026-09-15 实核）

| 面 | 落点 |
|---|---|
| 工具实现 | `thincoder-core/agent-tools/settings.mjs`（敏感判定 `:15` · 形状表 `:29` / `:38` · `_nullLeafPaths:61` · 完备性锁 `:72-81` · 键寻址 `:146` · 值解析 `:188-198` · description `:207` · 测试缝导出 `:265`） |
| 原子写盘 | `thincoder-core/config.mjs`（`writeConfigAtomic`——`:29` export；DEFAULTS / configPath 同档） |
| CLI 装配 | `thincoder-cli/src/cli/make-agent.mjs`（baseTools）；dispatch 动作级只读分类（list/get 放行） |
| 读取器判据点 | `thincoder-core/config.mjs:277`（defaultModel 非串→null）· `thincoder-cli/src/cli/make-agent.mjs:150`（`!team?.repo`）· `thincoder-core/agent-tools/subagent-spawn.mjs:92`（subagentModels 回落）· `thincoder-core/tools/bash.mjs:131`（`shell ?? true`） |
| 测试档 | `thincoder-cli/test/settings.test.mjs`（T-S2 族 25 例）· VSC 端 `thincoder-vscode/test/settings-tool.test.mjs`（8 例——W16 已改指核工具；双缝并用） |

## 6. 不并项与历史沿革

### 6.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/SETTINGS-TOOL.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头部状态行（第 8 批 / 第 13 批在途与评审轮次） | 时点状态行 + 批序 | 批次语境——现行态已入 §2–§4 |
| 旧档 §5 T-S1 用例表 + **更正注**（「`test/settings.test.mjs` 从未落地——声称不实」） | 历史声称表 + 勘察实证更正 | 一次性材料——**更正结论保留于此**：T-S1 表为历史声称，实际覆盖 = T-S2 回归网（§5 坐标行）；诚实记录不抹 |
| 旧档 §5.1 T-S2 用例表（T-S2.1–T-S2.35 + 覆盖映射） | 用例编号集 | 批次材料——行为面由现行测试族覆盖；测试缝双缝纪律（写侧假体 + 读侧 `_setConfigPathForTest` **必须同指临时文件**，防读写真实用户配置）入 §2.6 |
| 旧档 §6 AC-S1 / AC-S2、§9.6 AC-S3 | 单批验收清单 | 批次材料——机制级判据已提炼入 §2.9 / §4 |
| 旧档 §8.3 逐字锁断言 / §8.6 工具描述逐字新句 | 实现照抄稿 / 模型可见文案逐字稿 | 逐字文案 = 产品代码面（驻 `settings.mjs`）——本档只留语义判据（§2.6 / §4 边界行） |
| 旧档 §8.4 影响面枚举（含 VSC 批次前现状与键空间缺陷面） | 单批勘察枚举 | 一次性材料——结论（4 键 + 同族 1 键 + 键空间归一）已入 §2.6 / §2.8 |
| 旧档 §9.1–§9.5（parseValue 两端分裂实测 / 候选对比 / 分支契约 / 用例） | 单批裁定材料 | 裁定结论 = D-ST11 + §2.5 现行口径；②/③ 未选分支留旧档参照 |
| 旧档 §9.4 CHANGELOG 记账更正说明 | 父侧写域落笔说明 | 一次性材料——归批次档 |
| 旧档两处「受影响文件」表（实现时点 + 第 8 批行数注记） | 单批文件清单与行数快照 | 一次性材料——现行坐标入 §5 |
| 旧档变更记录（2026-09-05 起逐批流水） | 历史叙述 | 本档自有变更记录 |

## 7. 体量与拆分规划（R24a）

**实测行数**：本档 **142 行**（as-of 2026-09-15 W16 实测）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 纯新建 · eng-designer**）：建档——`thincoder-cli/docs/design/SETTINGS-TOOL.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；坐标改写为现状路径并逐条实核（`thincoder-core/agent-tools/settings.mjs` · `thincoder-core/config.mjs` ·
  `thincoder-cli/src/cli/make-agent.mjs` 等）；null 形状表 / 完备性锁 / parseValue 去引号裁定按现行实装落笔；批次材料 / 用例与 AC 编号集 /
  逐字文案稿 / 受影响文件快照不并（§6）；VSC 逐文件坐标归 VSC 轮（P2）。
- 2026-09-15（**W16 实施轮 · eng-coder**）：§2.6 加键流程收单（核 DEFAULTS 一处——端侧窄表已删）；§2.8 VSC 镜像改「同一核工具实例化」现状（键空间 = 核全量 DEFAULTS；端侧测试坐标改指）；§5 测试坐标收正；§7 行数重核。
