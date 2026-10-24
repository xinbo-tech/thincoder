# settings 工具（SETTINGS-TOOL）· 设计

> 板块 = **settings 工具**——agent 自主调整运行时配置的通道（agent 化版 `/config`）。
> 本档 = 该机制的**设计面唯一权威**（注册与动作分类 / 键寻址 / 热应用与写盘 / 敏感遮罩 / 值解析 / 类型护栏与 null 形状表 / 决策）。
> 相邻权威 = `docs/core/design/TOOLS.md`（工具系统权威——注册表 / 门禁）· `docs/core/design/AGENT-PARAMS.md`（Agent 运行参数专题——本工具是其 agent 化调整面）·
> `docs/core/design/MULTI-INSTANCE-COLLAB.md` §6（`writeConfigAtomic` 原子写语义——本档不复制）。
> 需求侧 = `docs/core/requirements/SETTINGS-TOOL.md`（F-S1.* / N-S1.*）。

## 1. 定位与动机

agent 工具面**无任何配置调整工具**——`/config` 是用户 TUI 命令、不在 agent 工具表；agent 的「变通」= bash / write 直改 `~/.thincoder/config.json`
（无校验 · 运行中不生效 · 只能等重启）。本工具 = `settings list/get/set` 覆盖全量 config.json 任意键，带敏感键遮罩护栏；
不替代用户 TUI——`/config` 仍是用户等效手动面。

## 2. 机制契约

### 2.1 注册与动作分类

`thincoder-core/agent-tools/settings.mjs` 导出 `settingsTool`：name `"settings"`；parameters = `action` enum [list/get/set] + `key` + `value`（按 action 分支必填——`:217-219`）。
CLI 装配 = `thincoder-cli/src/cli/make-agent.mjs`（baseTools）。dispatch 动作级只读分类：`list` / `get` 放行、`set` 保持侧效门；工具级 `readonly: false`（动作级分类管控）。

### 2.2 键寻址与展平

- `resolvePath(obj, "a.b.0.c")`（`settings.mjs:162`）逐段下钻（数组数字段支持）；get 缺失段返回 `{ ok:false, reached, missing, depth }`，报错含就近提示；
- `setKeyPath` 自动建中间对象；返回旧值；
- list 递归展平当前 `agent.config` 实值（含数组下标段——`providers.0.model` 形态），按 path 排序。

### 2.3 热应用 + 写盘（磁盘真相最小化）

`set` = `setKeyPath(agent.config, key, value)`（内存即热——agent.config 是运行读取源）→ 写盘 `writeConfigAtomic(cfgPath, fn)`
（**D-F5b 语义**：磁盘新鲜读 + 只改被设键——**默认值不固化**——+ mtime 门控；冲突 / 畸形抛错 → 内存不热应用，零虚假成功——语义权威 = `MULTI-INSTANCE-COLLAB.md` §6.3）。
**不整 reload**（直接改内存对象等价且无副作用）。

**promoted 视图同步（承 §2.8 W16 端差条）**：`agent.config` 的部分段是**装载期派生副本**——`thincoder-core/config.mjs:354` 把 `agent.advisor` promote 成顶层 `advisor`，而运行读面读的是**副本**（`thincoder-core/advisor/loop.mjs:103`；VSC `thincoder-vscode/src/advisor/loop.mjs:98` 同形）。
  所以 `set` 写到 `agent.advisor*` 之后必须调 `promoteAgentViews(config)` 重 derive 副本，`null` 删除腿在副本上同步删同一子键
  否则盘与嵌套键都变了、读面仍是旧值——回显的「运行中已生效」就成了假承诺。
  运行面独有的会话级键（如 `advisor.guard`）在合并（`{ ...config.advisor, ...config.agent.advisor }`）中保留。

### 2.4 敏感判定（判定谓词 = 两句**取或**）

`isSensitiveKey(path)` 对完整点分键路径做**段级**测试（**完整段名**命中才算——段界 = 串首 / 串尾 / `.` / `_` / `-`），两句取或（同文件相邻两常量——落点 `thincoder-core/agent-tools/settings.mjs`）：

- **词表句**（`settings.mjs:22`）：`/(^|[._-]|[a-z0-9])(api[_-]?key|key|token|secret|password|authorization|auth|cookie|credential)($|[._-])/i`
  ——段名命中即敏感（`-` 为段界，`X-Auth-Token` 类经 `token` 词命中）；
- **开口键族句**（`settings.mjs:24`）：`/(^|[._-])(headers|env)($|[._-])/i`
  ——段名 `headers` 或 `env` 命中 ⇒ **其下全部子键整族遮罩**——HTTP 头名与环境变量名由对端 / 用户任意取，词表**永远漏**。
- **段内复合段名 = 已裁采纳**（D-ST17）：段内复合敏感名（`refreshToken` / `clientSecret` / `privateKey` 类 camelCase / 前缀复合）⇒ 谓词扩**段内边界**（**先红夹具格**）；假阳取舍 = 方向安全（只丢值、键名仍可见）；理由与裁定 = D-ST13 ∕ D-ST17。

命中 ⇒ **值位一律 `••••（masked）`、键名保留可见**；四处调用单点同一谓词：list 行 `formatLine:210` · get 行（同函数 `:263`）· set 回显 `:283-288` · **错误文案**值位 `_shownValue:99`（D-ST8）。
`get` 打在敏感**父对象**上（如 `mcp.servers.0.headers`）⇒ 回显 `••••（masked） (object)`；非敏感父对象 ⇒ **`JSON.stringify` 化渲染**（`thincoder-core/agent-tools/settings.mjs:210-213`）。
判据 = 夹具键集**逐键**断言（敏感族全遮 ∧ 非敏感键不误遮 ∧ 明文零出现）。
**DEFAULTS 实核**：`flatten(DEFAULTS)` 叶子数 = **33**（`flatten` 本体实测——本批两键落键后；`TOOLS.md` §6.23 同拍），新谓词（两句取或）命中面 = **仅 `websearch.apiKey`**（族句命中 0——DEFAULTS 无 `headers` / `env` 段）
⇒「除 `websearch.apiKey` 外零 masked」前提成立。

### 2.5 值解析（parseValue——引号语义 = 用户裁定 ① 去引号）

`parseValue(raw)`（`:216`）：JSON.parse 成功且为顶层标量 / 对象 / 数组 → 采用解析结果；**JSON 解析成功但结果为字符串 → 解析值（去引号——`:224` `return v`）**；
parse 失败 → 字符串字面（`:226` `return s`——裸 `abc`）。两端语义统一（去引号 = ① 选定分支；引号 = JSON 语法、可表达「字符串数字」）。

### 2.6 已知键类型护栏（自动派生 + null 叶子形状表）

- **非 null 叶子**：遍历 `DEFAULTS` 递归生成「键路径 → typeof」映射（模块加载一次构建）——set 校验用；数组不递归、未知键跳过校验（全量域契约）。
- **null 叶子走显式形状表**：
  - **`_NULL_LEAF_SHAPES`**（`:40`——相等面：键集 == `_nullLeafPaths(DEFAULTS)`；CLI 4 键 = `defaultModel` / `agent.subagentModel` / `memory.team` / `shell`）；
  - **`_SIBLING_SHAPES`**（`:49`——存在性面，不参与集合相等；`agent.subagentModels` 等同族键——默认 `{}` ⇒ 派生表零条目零约束，单列于此）；
  - **完备性机械锁**：`_checkShapeCompleteness(DEFAULTS)` 装载自检（`:87-95`——漂移即一次性警告列键名）+ 测试断言（集合相等）。
- **校验语义**（`_checkKnownKeyValue`）：未知键原样通过；非 null 叶子 typeof 语义逐字保留；形状表命中键 = `null` 放行（显式清除——消费面均有「未设置」态）+
  不可消费形态抛错（字符串类键拒空串 / 纯空白，`defaultModel` 另需 `provider:model` 形态；`memory.team` 须 `repo` 非空串、额外键放行；`agent.subagentModels` 值须非空串、角色名不校验）；
  错误消息模板值位在敏感键命中时替换为 `••••（masked）`。
- **加键流程**：核 `config.mjs` DEFAULTS 一处 → 护栏自动跟随（消除手写漂移——W16：双源面收单）。
- **测试缝导出**（`_` 前缀——`:297`）：`_buildShapeTable` / `_nullLeafPaths` / `_NULL_LEAF_SHAPES` / `_SIBLING_SHAPES` / `_checkKnownKeyValue` / `_checkShapeCompleteness`。
- **测试缝双缝纪律**：写侧假体（`settingsTool({ configPath })`）+ 读侧 `_setConfigPathForTest` **必须同指临时文件**——防用例读写真实用户配置（`config.mjs` 默认 `configPath`）；两端单元测试档（CLI / VSC）同守此规。

### 2.7 输出契约

- 行格式：`key = value (type)`（`type` = `typeof`，数组显示 `array`）；敏感键值显示 `••••（masked）`；
- set 回显：敏感键后缀 ` — stored（值不回显）`；非敏感键后缀 ` — persisted + hot-applied（运行中已生效）`。

### 2.8 VSC 镜像（原则面）

W16：VSC 端 = **同一核工具实例化**（`thincoder-vscode/src/agent/setup.mjs` 取 `settingsTool(opts)` 工厂；写盘 = 核 `writeConfigAtomic`）；热应用 = `ctx.agent.config` 内存对象；注册于 depth-0 agentTools（动作级只读分类同款机制，`isReadonlyAction` 端面）。
键空间 = 核 `DEFAULTS` 全量（A5 已裁「以 CLI 为准（全量类型校验）」；
VSC 端测试坐标 = `thincoder-vscode/test/settings-tool.test.mjs`（9 例——双缝并用：写侧 `settingsTool({ configPath })` + 读侧 `_setConfigPathForTest`）——单元测试树重建时回迁。
**端差（W16 登记——热应用载体键面）**：热应用落点 = 端 `ctx.agent.config` 载体，而 VSC 载体键面 = `{advisor, agent, hooks, proxy, shell, providersList, websearch, fetch, traces}`
（`thincoder-vscode/src/agent/agent-state.mjs` `:98-112`）——无 `providers` / `memory` / `embedding` / `mcp` 段 ⇒ 这些键在 VSC 端的「运行中已生效」回显不落端侧运行读取源
（端侧运行读盘面 `loadRaw()`，如 `resolveProviders`）；该面以「写盘为准」（持久化生效，进程内热应用仅限上列键面）。

### 2.9 无静默论证（判据形式——要点）

护栏的**拒绝集 ⊆ 应用侧不可消费集**（逐键证据 = 各形状表行的读取器依据）⇒ 加护栏只减少「写了等于没写」面、不可能新增静默；
判据的机械形式 = 表驱动断言「接受集 == 可消费集 ∧ 拒绝集 == 不可消费集」，判据取自应用侧读取器本体（`loadConfig()` / `effectiveSubagentModel()` / `teamConfig.repo` 条件 / `config.shell` / `model-ref.mjs` 形态面），非测试自造。
形状层止步——存在性 / 可达性（渠道、模型、可执行文件）属运行期域（D-ST9）。

## 3. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-ST1 | **全量任意键而非白名单**（用户拍板） | 配套敏感遮罩护栏（防无意明文泄漏，非防有意破坏——与 bash rm -rf 同族，审批门是防线） |
| D-ST2 | **单工具多动作**（list/get/set） | 「工具会爆炸——靠参数做不同的事」（memory / subagent 同款） |
| D-ST3 | **热应用而非改完重启** | set 内存即热 = 本工具存在理由；写盘保重启 |
| D-ST4 | **文档级持久性边界** | loadConfig 保留域外键不承诺重启存活——诚实声明而非假装全量持久 |
| D-ST5 | **null 叶子 = 自动派生 + 显式形状表 + 完备性机械锁** | — |
| D-ST6 | **不可消费形态一律拒绝** | 应用侧处置 = 读不出写入值（静默折叠 / 远处响亮失败）——接受即承认静默面 |
| D-ST7 | **`null` 保留为合法值**（显式清除） | 四键消费面均有「未设置」态且 TUI 使用该态——清除是有效动作 |
| D-ST8 | **敏感键错误文案遮罩** | 实证 `sk-SECRET` 明文曾进错误文本（违 N-S1.2）——只遮值、不改错误句结构 |
| D-ST9 | **不校验存在性**（渠道 / 模型 / 可执行文件——形状层止步） | 存在性属运行期（`providerInvalidReason` 等既有原因面） |
| D-ST10 | **不动读取侧**（零 reader 改动） | 护栏与 reader 是「拒绝 ⊆ 不可消费」单调关系——不可能新增静默 |
| D-ST11 | **parseValue 引号语义 = 去引号**（用户裁定 ①） | 落点 = `:196` |
| D-ST12 | **双端同批**（用户拍板） | VSC config 存储差异以偏差注处理；键空间归一（§2.8） |
| D-ST13 | **敏感谓词扩面 = 词表扩面 + 开口键族整族遮罩**（两句取或——§2.4） | 实证 `mcp.servers.0.headers.Authorization` 明文回显。段内复合段名（refreshToken 类）残余登记 = D-ST17 |
| D-ST14 | **`env` 并入开口键族**（与 `headers` 同句） | 同族同因：`mcp.servers.*.env.*` 子键名由用户 / 对端任意取（实证：`env` 段任意变量名的值明文回显）；代价 = 少数无害 env 值被遮——方向安全且**键名仍可见**（只丢值） |
| D-ST15 | **遮蔽面用例落新档**（`settings-mask.test.mjs`——单元测试树重建时回迁该档形） | 单档行数超 500 行硬限（工具面 480 行 + 遮蔽面用例 ≈95 行 ⇒ ≈575）；分档 = 工具面 / 遮蔽面，runner 通配 `test/*.test.mjs` 自动收 |
| D-ST16 | **`${env:VAR}` 引用形态 = 已受理做** | 属新增能力（配置内放引用 + 消费侧展开）；机制（解析点 ∕ 生效面 ∕ 语义 ∕ 与遮蔽关系）单源 = `doc:CONFIG.md:§6.3`——本档遮蔽谓词零改（引用串同住敏感值位 ⇒ 族遮罩内）；解析产物永不回显 |
| D-ST17 | **段内复合段名入遮 = 采纳**（camelCase / 前缀复合敏感名） | 谓词扩段内边界（形如 `refreshToken` / `clientSecret` / `privateKey`）；假阳取舍 = 方向安全（只丢值、键名仍可见）；**先红夹具格**（§2.4 / §4 同拍） |

## 4. 边界（不做）

- 不改 `DEFAULTS` 键集与语义；不改读取侧折叠 / 回落点；不改其它写面（`/config` `/shell` `/submodel` TUI 各自菜单值域受控，不共用本校验）；
- 数组默认值键（`consultModels` / `streamRules` / `mcp.servers` / `providers`）维持既有豁免（下无标量约束）；
- **只改读面 / 回显谓词**（`isSensitiveKey` 及其四处调用）——**写面语义零改**：敏感键仍可写、真值仍落盘（T-S2.21 契约不变）、类型护栏 / 审批门 / 热应用不动（「不回显」≠「不可写」）。
- **段内复合段名入遮 = 已裁采纳**（`refreshToken` / `clientSecret` / `privateKey` 类 camelCase / 前缀复合——谓词扩段内边界；**先红夹具格**）：假阳取舍 = 方向安全（`maxTokens` / tokenCount 类误解遮可容忍——只丢值、键名仍可见）；规则落 §2.4；需求侧 F-ST5 判定句 = `docs/core/requirements/SETTINGS-TOOL.md:26`。
- **`${env:VAR}` 引用形态**（配置内放引用而非真值）：已受理做——机制单源 = `doc:CONFIG.md:§6.3`；本档谓词与读面零改（引用串同值位 ⇒ 族遮罩内；解析产物不回显）。
- 不改其它写面 / TUI 面：`/mcp` 表单输入提示、`/config` 菜单、VSC 面板各自遮蔽面**不复用本谓词**（各自的坐标与判定归各自板块——不动）。
- 不校验角色名合法性；不做跨端配置迁移（用户既有值不动）；
- UI/交互：无 UI 面变更——唯一模型可见文案面 = 工具 description（语义判据：含 null 默认值键按真实消费形态校验 + 不可消费形态被拒 + **敏感键按 §2.4 谓词回显遮罩**；逐字文案 = 产品代码，驻 `thincoder-core/tool-docs/settings.md`（`DESC()` 单一解析面——接线 `thincoder-core/agent-tools/settings.mjs:235`；句内词表 / 族词与 §2.4 同源）。

## 5. 机制面坐标（核 / CLI）

| 面 | 落点 |
|---|---|
| 工具实现 | `thincoder-core/agent-tools/settings.mjs`（敏感判定词表句 `:22` + 开口键族句 `:24` · 形状表 `:40` / `:49` · `_nullLeafPaths:76` · 完备性锁 `:87-95` · 键寻址 `:162` · 值解析 `:216-228` · description 文本 = `thincoder-core/tool-docs/settings.md`（`DESC()`——接线 `:235`）· 测试缝导出 `:297`） |
| 原子写盘 | `thincoder-core/config.mjs`（`writeConfigAtomic`——`:28` export；`configPath` 同档；`DEFAULTS` 在 `thincoder-core/config-defaults.mjs:15`） |
| CLI 装配 | 核 `thincoder-core/agent/assemble.mjs` 装配 + `thincoder-cli/src/cli/make-agent.mjs` 留面（MCP ∕ 剔除经 `toolsFinalize` 缝）；dispatch 动作级只读分类（list/get 放行） |
| 读取器判据点 | `thincoder-core/config.mjs:216`（defaultModel 非串→null）· 核 `thincoder-core/agent/assemble.mjs:31`（`!team?.repo`）· `thincoder-core/agent-tools/subagent-spawn.mjs:82`（subagentModels 回落）· `thincoder-core/tools/bash.mjs:120`（`shell ?? true`） |
| 单元测试档 | `thincoder-cli/test/settings.test.mjs`（480 行 · T-S2 族 25 例 · T-S3 族 3 例）· 遮蔽面档（`settings-mask.test.mjs`；夹具键集逐键 6 例，D-ST15）· VSC 端 `thincoder-vscode/test/settings-tool.test.mjs`（9 例——W16 改指核工具；双缝并用）——单元测试树重建时回迁 |
