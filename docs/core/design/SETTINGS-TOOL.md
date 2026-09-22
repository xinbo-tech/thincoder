# settings 工具（SETTINGS-TOOL）· 设计

> 板块 = **settings 工具**——agent 自主调整运行时配置的通道（agent 化版 `/config`）。
> 本档 = 该机制的**设计面唯一权威**（注册与动作分类 / 键寻址 / 热应用与写盘 / 敏感遮罩 / 值解析 / 类型护栏与 null 形状表 / 决策）。
> 相邻权威 = `docs/core/design/TOOLS.md`（工具系统权威——注册表 / 门禁）· `docs/core/design/AGENT-PARAMS.md`（Agent 运行参数专题——本工具是其 agent 化调整面）·
> `docs/core/design/MULTI-INSTANCE-COLLAB.md` §6（`writeConfigAtomic` 原子写语义——本档不复制）。
> 需求侧 = `docs/core/requirements/SETTINGS-TOOL.md`（F-S1.* / N-S1.*）。
> 建档：2026-09-15（**CLI 尾部真批 · 纯新建**——`thincoder-cli/docs/design/SETTINGS-TOOL.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史；VSC 镜像 = 同构实现（原则句在留，VSC 侧逐文件坐标归 VSC 轮——P2）。
> 本档坐标 = **as-of 2026-09-18 实核**（仓根 = `thincoder/`；建档 as-of 2026-09-15）。

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

### 2.4 敏感判定（判定谓词 = 两句**取或**——2026-09-18 脱敏漏项收正轮扩面）

`isSensitiveKey(path)` 对完整点分键路径做**段级**测试（**完整段名**命中才算——段界 = 串首 / 串尾 / `.` / `_` / `-`），两句取或（同文件相邻两常量——落点 `thincoder-core/agent-tools/settings.mjs`）：

- **词表句**（`:15`）：`/(^|[._-])(api[_-]?key|key|token|secret|password|authorization|auth|cookie|credential)($|[._-])/i`
  ——段名命中即敏感（本轮扩面 = `authorization` / `auth` / `cookie` / `credential`；`-` 为段界，`X-Auth-Token` 类经既有 `token` 词早已命中）；
- **开口键族句**（`:16`——**拟新增**）：`/(^|[._-])(headers|env)($|[._-])/i`
  ——段名 `headers` 或 `env` 命中 ⇒ **其下全部子键整族遮罩**——HTTP 头名与环境变量名由对端 / 用户任意取，词表**永远漏**；
  族闭合（未知新头名自动进遮罩）是本轮复发根因的处置：只补 `Authorization` 单键 = 把同族下一条漏项留给下次（D-ST13）。
- **残余类（登记——判定边界）**：段内复合段名（refreshToken / clientSecret / privateKey 类 camelCase / 前缀复合）**不命中**——本批不扩段内边界规则；理由与消解路径 = D-ST13 / D-ST17 / §4 边界行。

命中 ⇒ **值位一律 `••••（masked）`、键名保留可见**；四处调用单点同一谓词：list 行 `formatLine:187` · get 行（同函数 `:189`）· set 回显 `:260-261` · **错误文案**值位 `_shownValue:88`（D-ST8）。（坐标按现读收正 2026-09-22 · 父侧直接执行 · 可 revert）
`get` 打在敏感**父对象**上（如 `mcp.servers.0.headers`）⇒ 回显 `••••（masked） (object)`；非敏感父对象 ⇒ **`JSON.stringify` 化渲染**（`thincoder-core/agent-tools/settings.mjs:189`；2026-09-22 hygiene 批 #58 后——父侧收正 · 可 revert）。
判据面 = 夹具键集**逐键**断言（敏感族全遮 ∧ 非敏感键不误遮 ∧ 明文零出现）；用例表 = 批次档 §2（本档不复制）。
**DEFAULTS 实核（as-of 2026-09-18——用例表「不误遮」格的前提）**：`flatten(DEFAULTS)` 共 24 叶子，新谓词（两句取或）命中面 = **仅 `websearch.apiKey`**（族句命中 0——DEFAULTS 无 `headers` / `env` 段）
⇒「除 `websearch.apiKey` 外零 masked」前提成立（批次档 §2.2③ 同读数）。

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
- **测试缝双缝纪律**：写侧假体（`settingsTool({ configPath })`）+ 读侧 `_setConfigPathForTest` **必须同指临时文件**——防用例读写真实用户配置（`config.mjs` 默认 `configPath`）；两端测试档（CLI / VSC）同守此规。

### 2.7 输出契约

- 行格式：`key = value (type)`（`type` = `typeof`，数组显示 `array`）；敏感键值显示 `••••（masked）`；
- set 回显：敏感键后缀 ` — stored（值不回显）`；非敏感键后缀 ` — persisted + hot-applied（运行中已生效）`。

### 2.8 VSC 镜像（原则面）

W16（2026-09-15）：VSC 端 = **同一核工具实例化**（`thincoder-vscode/src/agent/setup.mjs` 取 `settingsTool(opts)` 工厂；写盘 = 核 `writeConfigAtomic`）；热应用 = `ctx.agent.config` 内存对象；注册于 depth-0 agentTools（动作级只读分类同款机制，`isReadonlyAction` 端面）。
键空间 = 核 `DEFAULTS` 全量（A5 已裁「以 CLI 为准（全量类型校验）」——原端侧窄表 `thincoder-vscode/src/agent-tools/settings.mjs:39-40` 已删（迁移期引文——`AGENT_DEFAULTS`/`TRACES_DEFAULTS` 键空间退场）；
VSC 端测试坐标 = `thincoder-vscode/test/settings-tool.test.mjs`（9 例——双缝并用：写侧 `settingsTool({ configPath })` + 读侧 `_setConfigPathForTest`）。
**端差（W16 登记——热应用载体键面）**：热应用落点 = 端 `ctx.agent.config` 载体，而 VSC 载体键面 = `{advisor, agent, proxy, shell, providersList, websearch, traces}`
（`thincoder-vscode/src/agent/agent-state.mjs` `:96-107`）——无 `providers` / `memory` / `embedding` / `mcp` 段 ⇒ 这些键在 VSC 端的「运行中已生效」回显不落端侧运行读取源
（端侧运行读盘面 `loadRaw()`，如 `resolveProviders`）；该面以「写盘为准」（持久化生效，进程内热应用仅限上列键面）。

### 2.9 无静默论证（判据形式——要点）

护栏的**拒绝集 ⊆ 应用侧不可消费集**（逐键证据 = 各形状表行的读取器依据）⇒ 加护栏只减少「写了等于没写」面、不可能新增静默；
判据的机械形式 = 表驱动断言「接受集 == 可消费集 ∧ 拒绝集 == 不可消费集」，判据取自应用侧读取器本体（`loadConfig()` / `effectiveSubagentModel()` / `teamConfig.repo` 条件 / `config.shell` / `model-ref.mjs` 形态面），非测试自造。
形状层止步——存在性 / 可达性（渠道、模型、可执行文件）属运行期域（D-ST9）。

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
| D-ST13 | **敏感谓词扩面 = 词表扩面 + 开口键族整族遮罩**（两句取或——§2.4） | 实证 `mcp.servers.0.headers.Authorization` 明文回显（台账 #53）。否决「只加 `Authorization` 单键」（同族下一条漏项留给下次）/「只扩词表不遮族」（头名不可枚举——`X-Custom-Auth` 类永远漏）。段内复合段名（refreshToken 类）残余登记 = D-ST17 |
| D-ST14 | **`env` 并入开口键族**（与 `headers` 同句） | 同族同因：`mcp.servers.*.env.*` 子键名由用户 / 对端任意取（实证：`env` 段任意变量名的值明文回显）；代价 = 少数无害 env 值被遮——方向安全且**键名仍可见**（只丢值） |
| D-ST15 | **遮蔽面用例落新档**（`settings-mask.test.mjs`，拟新增） | 既有 `thincoder-cli/test/settings.test.mjs` **480 行** + 遮蔽面用例 **≈ 95 行** ⇒ **≈ 575** 超 500 行硬限（估算值单源 = 批次档 §2.2⑤；登记面 = 批次档 §2.2⑥）；分档 = 工具面 / 遮蔽面，runner 通配 `test/*.test.mjs` 自动收 |
| D-ST16 | **`${env:VAR}` 引用形态不做**（需求候选） | 属**新增能力**（配置内放引用 + 消费侧展开）而非遮蔽面收正；且遮蔽面已覆盖其值位（引用串同为头值 ⇒ 族遮罩内）——登记为需求候选（批次档 §2） |
| D-ST17 | **残余类登记 = 段内复合段名不遮**（camelCase / 前缀复合） | 谓词按**完整段名**匹配 ⇒ 段内复合名仍明文；本批不扩段内边界规则（理由 ①–③ = §4 边界行）。**消解路径** = 批次档 §2.4 候选 C2（入台账待裁）；**到期条件** = 该候选结清（§4 同） |

## 4. 边界（不做）

- 不改 `DEFAULTS` 键集与语义；不改读取侧折叠 / 回落点；不改其它写面（`/config` `/shell` `/submodel` TUI 各自菜单值域受控，不共用本校验）；
- 数组默认值键（`consultModels` / `streamRules` / `mcp.servers` / `providers`）维持既有豁免（下无标量约束）；
- **本批只改读面 / 回显谓词**（`isSensitiveKey` 及其四处调用）——**写面语义零改**：敏感键仍可写、真值仍落盘（T-S2.21 契约不变）、类型护栏 / 审批门 / 热应用不动（「不回显」≠「不可写」）。
- **段内复合段名不遮**（refreshToken / clientSecret / privateKey 类 camelCase / 前缀复合——谓词按**完整段名**匹配，见 §2.4 残余类）：**登记为残余类，本批不做**（评审轮 1 发现 3 / D-ST17）；
  判定理由 = ① 段界口径与需求侧 F-ST5 判定句细化单源（批次档 §2.3）——扩段内边界即改判定句语义（需求档笔在主 agent）；② 段内规则必带假阳（`maxTokens` / tokenCount 类无害键被遮）；
  消解路径 = 批次档 §2.4 候选 C2（入台账待裁）；到期条件 = 该候选结清（采纳 ⇒ 落 §2.4 规则 + 先红夹具格；不采纳 ⇒ 本节即终态）。
- **`${env:VAR}` 引用形态不做**（配置内放引用而非真值）：属新增能力面（值模板 + 消费侧展开）——登记为需求候选（D-ST16）；本批不改 `thincoder-core/mcp.mjs` 及任何传输层。
- 不改其它写面 / TUI 面：`/mcp` 表单输入提示、`/config` 菜单、VSC 面板各自遮蔽面**不复用本谓词**（各自的坐标与判定归各自板块——本批不动）。
- 不校验角色名合法性；不做跨端配置迁移（用户既有值不动）；
- UI/交互：无 UI 面变更——唯一模型可见文案面 = 工具 description（语义判据：含 null 默认值键按真实消费形态校验 + 不可消费形态被拒 + **敏感键按 §2.4 谓词回显遮罩**；逐字文案 = 产品代码，驻 `thincoder-core/agent-tools/settings.mjs:212`〔description **句**本体——本批须同改句〕——本批描述句须同改，句内词表 / 族词与 §2.4 同源）。

## 5. 机制面坐标（核 / CLI · as-of 2026-09-18 实核）

> **坐标基准 = 变更前实核**（下表未标注者均按 as-of 2026-09-18 的变更前读数；标「拟新增」者 = 本批插入点，不适用位移）。
> 族句常量（`settings.mjs`）插入点 `:16`（一行）⇒ 其下**既有**坐标整体 **+1**（本表 `:29` / `:38` / `:61` / `:72-81` / `:146` / `:188-198` / `:212` / `:265` 均按变更前基准）。
> 实施轮落点以 coder 实读为准（D4：落点以函数名为准）。

| 面 | 落点 |
|---|---|
| 工具实现 | `thincoder-core/agent-tools/settings.mjs`（敏感判定词表句 `:15` + 开口键族句 `:16`〔拟新增〕· 形状表 `:29` / `:38` · `_nullLeafPaths:61` · 完备性锁 `:72-81` · 键寻址 `:146` · 值解析 `:188-198` · description 句 `:212` · 测试缝导出 `:265`） |
| 原子写盘 | `thincoder-core/config.mjs`（`writeConfigAtomic`——`:29` export；DEFAULTS / configPath 同档） |
| CLI 装配 | `thincoder-cli/src/cli/make-agent.mjs`（baseTools）；dispatch 动作级只读分类（list/get 放行） |
| 读取器判据点 | `thincoder-core/config.mjs:277`（defaultModel 非串→null）· `thincoder-cli/src/cli/make-agent.mjs:150`（`!team?.repo`）· `thincoder-core/agent-tools/subagent-spawn.mjs:92`（subagentModels 回落）· `thincoder-core/tools/bash.mjs:131`（`shell ?? true`） |
| 测试档 | `thincoder-cli/test/settings.test.mjs`（480 行 · T-S2 族 25 例 · T-S3 族 3 例）· 遮蔽面新档（`settings-mask.test.mjs`，拟新增——夹具键集逐键 6 例，D-ST15）· VSC 端 `thincoder-vscode/test/settings-tool.test.mjs`（9 例——W16 已改指核工具；双缝并用） |

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
| 旧档 §8.5 旧决策编号 `D-S2.3` / `D-S2.4` / `D-S2.5` | 旧编号（`null` 合法 / 敏感键错误文案遮罩 / 不校验存在性） | 语义已入本档 §3 **D-ST7 / D-ST8 / D-ST9**（编号映射——旧档原地保留）；实施档注释仍引旧号者按此对位（`settings.mjs` `:83` / `:116` / `:133`——产品代码面，本批零改） |
| 旧档 §8.4 影响面枚举（含 VSC 批次前现状与键空间缺陷面） | 单批勘察枚举 | 一次性材料——结论（4 键 + 同族 1 键 + 键空间归一）已入 §2.6 / §2.8 |
| 旧档 §9.1–§9.5（parseValue 两端分裂实测 / 候选对比 / 分支契约 / 用例） | 单批裁定材料 | 裁定结论 = D-ST11 + §2.5 现行口径；②/③ 未选分支留旧档参照 |
| 旧档 §9.4 CHANGELOG 记账更正说明 | 父侧写域落笔说明 | 一次性材料——归批次档 |
| 旧档两处「受影响文件」表（实现时点 + 第 8 批行数注记） | 单批文件清单与行数快照 | 一次性材料——现行坐标入 §5 |
| 旧档变更记录（2026-09-05 起逐批流水） | 历史叙述 | 本档自有变更记录 |

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 纯新建 · eng-designer**）：建档——`thincoder-cli/docs/design/SETTINGS-TOOL.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；坐标改写为现状路径并逐条实核（`thincoder-core/agent-tools/settings.mjs` · `thincoder-core/config.mjs` ·
  `thincoder-cli/src/cli/make-agent.mjs` 等）；null 形状表 / 完备性锁 / parseValue 去引号裁定按现行实装落笔；批次材料 / 用例与 AC 编号集 /
  逐字文案稿 / 受影响文件快照不并（§6）；VSC 逐文件坐标归 VSC 轮（P2）。
- 2026-09-18（**settings 脱敏漏项收正轮 · eng-designer**）：§2.4 敏感判定改**两句取或**——词表句扩 `authorization` / `auth` / `cookie` / `credential` + **开口键族句**（`headers` / `env` 整族遮罩；台账 #53 `mcp.servers.*.headers.Authorization` 明文回显收正）；
  §2.8 一处已删端侧旧路径改**迁移期引文**形态（机检零新增）；§3 加 D-ST13–D-ST16；§4 加「只改读面谓词（写面零改）」·「`${env:VAR}` 引用形态不做（需求候选）」·「TUI / 面板不复用本谓词」三行；§5 坐标行 as-of 2026-09-18 实核；判据面 = 夹具键集逐键（用例表在批次档 §2）。
- 2026-09-18（**settings 脱敏漏项收正轮 · 设计修正轮**（评审轮 1 发现 1–9）**· eng-designer**）：§2.4 族句逐字式样 + 段界口径 + 残余类条目 + DEFAULTS 实核句 + `D-S2.4`→`D-ST8`；§2.6 补测试缝双缝纪律句；§2.9 `D-S2.5`→`D-ST9`；§3 加 D-ST17；§4 加残余类边界行 + description 锚 → `:212`；§5 加坐标基准注；D-ST15 估算统一（480 + ≈95）；VSC 用例数 8 → 9；§6.1 加旧档编号映射行。
