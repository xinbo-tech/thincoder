# settings 工具——agent 配置调整

> 板块：工具系统（TOOLS.md 同板块独立保留——MCP.md 同规）。
> 状态：**已实现**（2026-09-05）+ **第 8 批在途**（2026-09-11——null 默认值键形状约束：F-S1.7/F-S1.8/N-S1.5；设计见本档 §8；设计评审轮次 1 修正已落档——待复审）；**第 13 批（2026-09-11）**：parseValue 两端统一（**用户裁定 ① 去引号**——2026-09-11）+ CHANGELOG 记账更正说明（§9）。
> （2026-09-11 更正：原“CLI settings.test 11/11 + VS Code 镜像 6/6 全绿”陈述不实——`test/settings.test.mjs` 从未落地，实证见 §5 更正注。）
> 权威源：CLI `src/agent-tools/settings.mjs`、`src/config.mjs`（DEFAULTS / writeConfigAtomic / configPath）。
> 关联：`docs/README.md`（总地图）、`docs/design/TOOLS.md`（工具系统权威——§1 注册表/§3 门禁）、`docs/design/AGENT-PARAMS-*.md`（Agent 运行参数专题——本工具是其 agent 化调整面）。

## 变更记录

- 2026-09-05：定稿并实现（需求 + 设计 + 测试三层完整；CLI dispatch 侧效门 + 热应用 + 遮罩 + 类型护栏落地，VS Code 镜像同批）。
- 2026-09-05（D-S1.6 方案 A）：VS Code config-io 收拢 `AGENT_DEFAULTS`/`TRACES_DEFAULTS` 单一来源，类型表两端自动派生（用户选 A——消除手写同步）。
- 2026-09-07：重写为当前态（格式正常化、历史变更流水账折叠为本记录）。
- 2026-09-11（第 8 批）：null 默认值键形状约束——类型表对 null 叶子改走显式形状表 + 完备性机械锁（§8）；测试层更正与 T-S2 落地（§5 更正注 + §5.1）；§4.6 口径更正；描述句同步（§8.6）；验收 AC-S2 与决策 D-S2（§6 / §7.2）。
- 2026-09-11（第 8 批·评审修正轮）：锁结构拆分（`_NULL_LEAF_SHAPES` 相等面 / `_SIBLING_SHAPES` 存在性面）；判据类表述统一为「可消费/不可消费」；VSC 描述句与键归类同步；回归网补 get 成功用例（T-S2.17b——CLI 25 例 / 总 31）；测试缝双缝说明；行数注记口径修正。
- 2026-09-11（第 8 批·交付同步）：按交付实测对齐——§8.3 第 6 条补 `_checkShapeCompleteness`（测试缝导出 6 个）· 第 7 条 VSC 锁断言形态改 `_nullLeafPaths({ agent: AGENT_DEFAULTS })` · §8.4 补 VSC 派生表键空间（`_DEFAULTS_ROOT`）与连带行为增量 · T-S2.33/T-S2.34 行同步 · 受影响文件行数注记改实测。
- 2026-09-11（第 13 批）：parseValue 两端语义统一（**用户裁定 ① 去引号**——2026-09-11）+ CHANGELOG 记账更正说明（§9）；§4.5 歧义句更正注；修正轮：§9 裁定标记同步（评审 #5）。

---

## 1. 定位与动机

agent 工具面全量盘点（25 内置 + 12 元工具）**无任何配置调整工具**——`/config` 是用户 TUI 命令、不在 agent 工具表。agent 当时的"变通"= bash/write 直接改 `~/.thincoder/config.json`：

1. **无校验**——写坏全文件；
2. **运行中不生效**——`agent.config` 是内存对象，改文件不刷新；
3. **只能等重启**。

用户问"有没有给 agent 调整配置参数的 tool" → 没有 → 立项。

**用途**：给 agent 一条**自主调整运行时配置**的通道（agent 化版本 `/config`），`settings list/get/set` 覆盖全量 config.json 任意键，带敏感键遮罩护栏。工具不替代用户 TUI——`/config` 仍是用户等效手动面。

> 需求层已迁出（2026-09-10 需求层拆分批）：本板块需求见 `../requirements/SETTINGS-TOOL.md`——本档保留设计+测试层。

## 4. 设计（D-S1）

### 4.1 注册与动作分类

CLI `src/agent-tools/settings.mjs` 导出 `settingsTool`：name `"settings"`；parameters 为 `action` enum [list/get/set] + `key` + `value`——按 action 分支必填。`src/cli/make-agent.mjs` 装配入 baseTools（与 memory/codeSearch/repoOutline 等动态工具并列）。

dispatch 动作级只读分类加 list/get（`isSubagentReadonlyAction` 扩展）：`settings` 下 `action === "list" || action === "get"` 放行，`set` 保持侧效门。工具级 `readonly: false`（set 存在——动作级分类管控）。

### 4.2 键寻址与展平

- `resolvePath(obj, "a.b.0.c")` 逐段下钻（数组数字段支持）；get 缺失段返回 `{ ok:false, reached, missing, depth }`，报错含就近提示（`（config 顶层无此键——顶层可用键见 settings list）` 或 `（父键 X 存在——无 Y 子键）`）。
- `setKeyPath` 自动建中间对象（cmd-config 数值项同款 split/建链）；返回旧值。
- list 递归展平当前 agent.config 实值（含数组下标段——`providers.0.model` 形态），按 path 排序。

### 4.3 热应用 + 写盘（磁盘真相最小化）

`set` = `setKeyPath(agent.config, key, value)`（内存即热——agent.config 是运行读取源）→ 写盘 `writeConfigAtomic(cfgPath, fn)`。**D-F5b 语义（原子写盘）**：磁盘新鲜读 + 只改被设键（**默认值不固化**）+ mtime 门控；冲突/畸形抛错 → 内存不热应用（零虚假成功）。**不整 reload**（cmd-config 的 reloadConfig 会 loadConfig + injectProxy + provider 恢复——settings 直接改内存对象等价且无副作用）。

> 注意：agent.config 是 loadConfig 产物（含 DEFAULTS 合并节）——set 键写盘后下次启动 loadConfig 重新合并——已知节内一致。

### 4.4 敏感判定

```js
SENSITIVE_SEGMENT = /(^|[._-])(api[_-]?key|key|token|secret|password)($|[._-])/i
```

对完整点分键路径做段级测试；命中 → 值域一律 `••••（masked）`。键名保留可见。

### 4.5 值解析

`parseValue(raw)`：JSON.parse 成功且为顶层标量/对象/数组 → 采用解析结果（数字/布尔/对象/数组/带引号字符串）；JSON.parse 失败或结果为字符串 → 字符串字面。

> **2026-09-11 更正（第 13 批）**：本句「带引号字符串」表述两端歧义（实测：CLI 保引号 / VSC 去引号——两端不一致）——权威口径以 §9 为准（用户裁定 ① 去引号——2026-09-11）。

### 4.6 已知键类型表（方案 A——自动派生）

遍历 `DEFAULTS`（config.mjs 导出）递归生成 `键路径 → 值类型` 映射（模块加载时一次构建）——set 校验用；数组不递归（`providersList` 等下无标量约束）、对象节递归到叶子；未知键跳过类型校验。null/对象/数组默认值键无标量约束（compactThreshold null=auto 等——消费方/面板层校验）。

> **2026-09-11 更正**：本句与 CLI 实现不符——CLI `buildTypeMap` 对 `null` 叶子记 `typeof null === "object"`（`src/agent-tools/settings.mjs:24-32`），**并非**“无约束”；"跳过 null 叶子"是 VSC 端的写法（`src/agent-tools/settings.mjs:29`（VSC 仓））。null 叶子的口径自本批起以 `docs/design/SETTINGS-TOOL.md` §8.3 形状表为准。

**加键流程**：CLI config.mjs DEFAULTS 一处 + VS Code config-io AGENT_DEFAULTS 一处 → 类型护栏自动跟随（消除手写漂移）。

### 4.7 输出契约

- **行格式**：`key = value (type)`——`type` = `typeof`（数组显示 `array`）；敏感键值显示 `••••（masked）`。
- **set 回显**：`settings set: key = shown (type) ...`——敏感键后缀 ` — stored（值不回显）`；非敏感键后缀 ` — persisted + hot-applied（运行中已生效）`。

### 4.8 VS Code 镜像

thincoder-vscode 端 agent-tools 同构移植。VS Code config-io 与 CLI 同读共享 `~/.thincoder/config.json`（`_configPath()`——测试可注入）——settings 写盘 = 同一共享文件（非 settings.json）。热应用 = `ctx.agent.config` 内存对象（VS Code agent 同构）。注册于 setup.mjs depth-0 agentTools（isReadonlyAction 动作分类——subagent/memory 同款机制）。

## 5. 测试（T-S1——CLI test/settings.test.mjs + VS Code 镜像）

> 测试隔离：临时 config 用 `THINCODER_CONFIG_DIR` 或注入 configPath——以 config.mjs 现有测试隔离机制为准。

> **2026-09-11 更正（勘察实证）**：下表声称的 `test/settings.test.mjs`（及 VSC 镜像档）**在工作区不存在**——`thincoder-cli/test/**` 全目录零命中字符串 `settings`；
> `thincoder-vscode/test/**` 无 `settingsTool` / `agent-tools/settings.mjs` 引用（仅面板面 `settings-panel.test.mjs` / `smoke-settings.mjs`，与本工具无关）。
> 下表保留为历史声称；实际覆盖由 §5.1 T-S2 落地（含把历史声称的核心用例补成真实回归网）。

| # | 类别 | 输入 | 预期 |
|---|---|---|---|
| T-S1.1 | N | list | 全键展平 + 类型标注；含 `agent.maxTurns` 等；`providers` 段 apiKey 显示 `••••（masked）` |
| T-S1.2 | N | get agent.maxTurns | 当前值 200（DEFAULTS） |
| T-S1.3 | E | get agent.nonexistent | 报错 no such key（含就近提示——顶层/父键存在与否） |
| T-S1.4 | N | set agent.maxTurns 500 | 内存热应用（agent.config.agent.maxTurns=500）+ 文件写盘（重读 config.json 断言）+ 回显无遮罩（非敏感） |
| T-S1.5 | E | set agent.maxTurns "abc" | 拒绝（类型不符——期望 number）——文件与内存均不变 |
| T-S1.6 | N | set traces.enabled true（字符串 "true"） | JSON.parse → boolean true 生效 |
| T-S1.7 | E | set 敏感键（providers.0.apiKey "sk-xxx"） | 写入文件真实生效；回显 `••••（masked）`——明文不出现在任何返回值 |
| T-S1.8 | N | set 未知键（节内任意嵌套，如 agent.customFlag true） | JSON 原样写入生效（全量域内） |
| T-S1.9 | E | 门禁：list/get 免审批路由 + planMode 放行（dispatch 真路由——memory search 同款测试）；set 审批拦截 | 分类正确 |
| T-S1.10 | N | set 对象/数组值（JSON.parse 路径） | 对象写入 + 展平后 get 子键可见 |

### 5.1 T-S2（第 8 批——null 默认值键形状约束 + 回归网）

**测试档**：CLI = `test/settings.test.mjs`（NEW——`test/run-fast.mjs` 默认 glob `test/*.test.mjs` 自动纳入，无需注册；**25 例**：T-S2.1–T-S2.24 + T-S2.17b）；VSC（W2）= `thincoder-vscode/test/settings-tool.test.mjs`（NEW——VSC 清单为显式列表，**必须**登记 `thincoder-vscode/test/files.mjs`，不登记不跑；**6 例**：T-S2.30–T-S2.35）。

**测试缝（CLI——双缝并用）**：写侧 = `settingsTool({ configPath })` 临时文件 + `ctx.agent.config` 假体（`settings.mjs:90` 既有缝——set 的落盘/热应用都走它）；读侧 = `config.mjs: _setConfigPathForTest`（`:26-30`——让 `loadConfig()`（`:253-255`）真读同一个临时文件；T-S2.1/T-S2.2/T-S2.3/T-S2.5/T-S2.13 的「读回」断言用它）。
**两缝必须同时指向临时文件**——只注入写侧（读侧仍指真实用户配置）或只注入读侧（写侧落进真实用户配置），都会造成对真实 `~/.thincoder/config.json` 的读写。
**测试缝（VSC——W2）**：`thincoder-vscode/src/config-io.mjs:35 _setConfigPathForTest`（本端 `_configPath()`——读写同缝）+ 形状表/校验器 `_` 前缀导出（§8.3 第 6 条）。

**快层纪律**：未标 slow 用例须 <500ms（`test/slow.mjs`——超阈未归册即硬红）；T-S2.23 若触线则用 `slow()` 归册。

| # | 组 | 类别 | 输入 | 预期（机器断言） | 回指 |
|---|---|---|---|---|---|
| T-S2.1 | 接受 | N | `set defaultModel "deepseek:deepseek-flash"` | 接受——磁盘 JSON == 该串 ∧ 内存 hot-apply ∧ `loadConfig()` 读回同串 | F-S1.7 |
| T-S2.2 | 接受 | N | `set shell "pwsh"` | 接受——磁盘 == 该串 ∧ 内存 `config.shell` == 该串 | F-S1.7 |
| T-S2.3 | 接受 | N | `set agent.subagentModel "kimi:k3"` | 接受 ∧ `effectiveSubagentModel(parent, "explore")` 返回该串 | F-S1.7 |
| T-S2.4 | 接受 | N | `set memory.team '{"repo":"git@x:y.git"}'` | 接受 ∧ 写入值 `repo` 非空（读取器条件 `!team?.repo → null` 不成立） | F-S1.7 |
| T-S2.5 | 接受 | B | 四键 + `agent.subagentModels` 各 `set null` | 接受（显式清除）∧ 读取侧回“未设置”态（`loadConfig().defaultModel === null` 等） | F-S1.7 / F-S1.8 |
| T-S2.6 | 拒绝 | E | `set defaultModel '{"a":1}'` | 抛错（expects non-empty string "provider:model"）∧ 磁盘/内存零变化 | F-S1.7 |
| T-S2.7 | 拒绝 | B | `set defaultModel ""` / `"bogus"`（无冒号）/ `"a:"`（尾段空） | 三种均抛错 ∧ 零变化 | F-S1.7 |
| T-S2.8 | 拒绝 | E | `set shell '{}'` / `set shell ""` | 抛错 ∧ 零变化 | F-S1.7 |
| T-S2.9 | 拒绝 | E | `set agent.subagentModel '{}'` / `""` / `'[1,2]'` | 抛错 ∧ 零变化（对象原会在 spawn 期 TypeError） | F-S1.7 |
| T-S2.10 | 拒绝 | E | `set memory.team "abc"` | 抛错（expects object { repo: string, name?, dir? }） | F-S1.7 |
| T-S2.11 | 拒绝 | B | `set memory.team '{}'` / `'{"name":"x"}'` / `'{"repo":""}'` | 抛错（requires a non-empty "repo"）∧ 零变化 | F-S1.7 |
| T-S2.12 | 接受 | N | `set agent.subagentModels '{"coder":"x"}'`（W3 正控） | 接受 ∧ `effectiveSubagentModel(parent, "coder") === "x"` | F-S1.7 |
| T-S2.13 | 无静默 | N | 表驱动：每键 { 值, 消费判据 } 行——判据由**真读取器**给出（`loadConfig()` / `effectiveSubagentModel()` / `teamConfig.repo` 条件 / `config.shell`；`defaultModel` 串另经 `model-ref.mjs:25-36` 形态面——夹具串避开存在性层 `:38-43`，D-S2.5） | 集合相等：接受集 == 可消费集 ∧ 拒绝集 == 不可消费集（含 W3 行：字符串 → 拒） | F-S1.8 |
| T-S2.14 | 防漂移 | N | `_nullLeafPaths(DEFAULTS)` vs `Object.keys(_NULL_LEAF_SHAPES)`；`_SIBLING_SHAPES` 存在性；夹具注入新 null 叶子 | **完备性锁**：两集合相等（当前 **4 键**）∧ `agent.subagentModels` ∈ `_SIBLING_SHAPES`（存在性断言——不参与集合相等）∧ 夹具下未声明 null 叶子被捕获 + 一次性警告列出键名 | N-S1.5 |
| T-S2.15 | 防漂移 | N | `_buildShapeTable(fixture, patch)` 对拍旧实现 | 非 null 叶子逐键相等（抽样 `agent.maxTurns`→number / `traces.enabled`→boolean / `agent.consultModels`→array） | N-S1.5 / F-S1.5 |
| T-S2.16 | 回归 | N | `list` | 全键展平 + 类型标注（原 T-S1.1） | F-S1.1 |
| T-S2.17 | 回归 | E | `get agent.nonexistent` | 报错 no such key + 就近提示（原 T-S1.3） | F-S1.2 |
| T-S2.17b | 回归 | N | `get agent.maxTurns` | 回显 `agent.maxTurns = <夹具值> (number)`（get 成功态——与 T-S2.17 错误态成对；补 T-S1.2 面） | F-S1.2 |
| T-S2.18 | 回归 | N | `set agent.maxTurns 500` | 磁盘写入 + 内存热应用 + 回显非遮罩（原 T-S1.4） | F-S1.3 / F-S1.4 |
| T-S2.19 | 回归 | N | `set agent.customFlag true`（未知键） | JSON 原样写入生效（原 T-S1.8） | F-S1.5 |
| T-S2.20 | 回归 | E | `set agent.maxTurns "abc"` | 拒绝（expects number）∧ 磁盘/内存不变（原 T-S1.5） | F-S1.5 |
| T-S2.21 | 回归 | E | `set providers.0.apiKey "sk-xxx"` | 写入真实生效 ∧ 回显 `••••（masked）` ∧ 明文零出现（原 T-S1.7） | N-S1.2 |
| T-S2.22 | 回归 | E | `set websearch.apiKey '{"k":"sk-SECRET"}'`（D-S2.4） | 错误文本含判据 + **零明文**（值位 = `••••（masked）`） | N-S1.2 |
| T-S2.23 | 回归 | E | D-F5b：写盘前对端改 mtime → `writeConfigAtomic` 放弃 | 抛 `config changed on disk concurrently` ∧ **内存不热应用**（零虚假成功） | F-S1.3 |
| T-S2.24 | 文案 | N | 工具 description 逐字断言（§8.6 CLI 新句） | 新句整句在 `settingsTool().description` 内逐字出现 | N-S1.4 |
| T-S2.30 | VSC | N | `set agent.subagentModel "kimi:k3"` / `'{}'` / `""` | 接受非空串；对象/空串拒绝 | F-S1.7 |
| T-S2.31 | VSC | B | `set agent.compactThreshold 100000` / `"100000"` / `'{}'` | 接受 number ∪ null；字符串/对象拒绝 | F-S1.7 |
| T-S2.32 | VSC | E | 跨端三键两形态：`set defaultModel '{}'` / `set defaultModel "bogus"`（无冒号）/ `set shell '{}'` / `set memory.team "abc"` | 均拒绝（未落地前它们零条目 = 全收；无冒号串锁 `provider:model` 形态面——评审修正轮补） | F-S1.7 / F-S1.8 |
| T-S2.33 | VSC | N | `_nullLeafPaths({ agent: AGENT_DEFAULTS })` vs 本端 `_NULL_LEAF_SHAPES` 键集（交付实测形态——§8.3 第 7 条旁注）；`_SIBLING_SHAPES` 跨端三键存在性 | 相等（当前 2 键）∧ `defaultModel`/`shell`/`memory.team` 全部 ∈ `_SIBLING_SHAPES`（存在性断言——不参与集合相等） | N-S1.5 |
| T-S2.34 | VSC | N | 非 null 叶子对拍旧实现（派生根 `{ agent: AGENT_DEFAULTS, traces: TRACES_DEFAULTS }`——键空间归一） | 逐键相等（`agent.maxTurns`→number / `traces.enabled`→boolean / `agent.consultModels`→array）＋归一生效面断言（`set agent.maxTurns "abc"` 拒 / `"200"` 收——交付实测补） | N-S1.5 |
| T-S2.35 | VSC | N | 工具 description 逐字断言（§8.6 VSC 新句） | 新句逐字出现 | N-S1.4 |

**覆盖映射（历史声称 → 落地）**：T-S1.1→T-S2.16 · T-S1.2→T-S2.17b（本批补——get 成功态）· T-S1.3→T-S2.17 · T-S1.4→T-S2.18 · T-S1.5→T-S2.20 · T-S1.7→T-S2.21 · T-S1.8→T-S2.19；
**T-S1.6/T-S1.9/T-S1.10 未纳入本批回归网——不在本批改动面**（布尔解析/门禁路由/对象值展平；不虚指他档——原 `test/config.test.mjs`（已并入 `test/config-merge.test.mjs`——2026-09-11 TEST-LIFECYCLE）只覆盖 `reloadMcpFromDisk` 的 mcp.servers 回退、`test/**` 无 settings 面断言）。

## 6. 验收（AC-S1）

- **AC-S1.1** = T-S1 双端绿。
- **AC-S1.2** = 既有工具面零破坏（注册表 25→26——工具表全量断言/枚举处同步——TOOLS.md §1 + dispatch 测试）。
- **AC-S1.3** = 敏感遮罩抽查（任何返回值含明文 `sk-` → 失败）。
- **AC-S1.4** = 热应用真机验证（set 后同会话 get 见新值）。

### AC-S2（第 8 批——null 默认值键形状约束，逐条回指需求）

- **AC-S2.1**（→ `../requirements/SETTINGS-TOOL.md` §2 F-S1.7）：4 个 null 叶子键 + 同族 `agent.subagentModels` 的**真实消费形态值全部接受**（T-S2.1–T-S2.5、T-S2.12 绿）；**非消费形态值全部拒绝**且磁盘/内存零变化（T-S2.6–T-S2.11 绿）。
- **AC-S2.2**（→ F-S1.8）：**无静默**——表驱动断言「接受集 == 应用侧可消费集 ∧ 拒绝集 == 应用侧不可消费集」（T-S2.13 绿）；判据逐键取自应用侧读取器（`loadConfig` / `effectiveSubagentModel` / `teamConfig` 的 `repo` 条件 / `config.shell`；`defaultModel` 串另经 `model-ref.mjs` 形态面——夹具串避开存在性层），非测试自造。逐键判据见 §8.5。
- **AC-S2.3**（→ N-S1.5 + F-S1.5）：① **完备性锁**——`DEFAULTS` 的 null 叶子键集 == `_NULL_LEAF_SHAPES` 键集（T-S2.14 绿；夹具注入新 null 叶子 → 捕获未声明键 + 触发一次性警告）；同族键单列 `_SIBLING_SHAPES`（存在性断言——不参与集合相等）；② **语义零变**——非 null 叶子派生结果与旧实现逐键相等（T-S2.15 绿）；③ **文档一致**——本档 §4.6 与 §5 的失真陈述已更正，与实际实现一致。
- **AC-S2.4**（→ N-S1.4）：工具描述（`src/agent-tools/settings.mjs:98`）逐字替换为 §8.6 新句（含 null 默认值键按真实消费形态校验 + 不可消费形态被拒；T-S2.24 绿）。
- **AC-S2.5**（→ F-S1.1–F-S1.5、N-S1.2）：**回归网绿**——list 展平/类型标注、get 成功（T-S2.17b）与缺失键提示、set 正常路径（磁盘 + 热应用 + 回显）、未知键原样、类型不符拒绝、敏感键 set 回显遮罩、**敏感键错误文案零明文**（T-S2.16–T-S2.23 + T-S2.17b 绿）。
- **AC-S2.6**（→ N-S1.3）：`node --test test/settings.test.mjs` 全绿（未标 slow 用例均 <500ms 快层线）；`cd thincoder && node scripts/check-doc-width.mjs` 新增超宽 0 / 新增违规 0。
- **AC-S2.7**（→ F-S1.7/F-S1.8 的 VSC 面——范围项 W2，**已裁定纳入本批**——2026-09-11 用户裁定）：VSC 镜像档同源形状表落地（其 null 叶子 = `agent.subagentModel`/`agent.compactThreshold`——本端 `_NULL_LEAF_SHAPES` 2 键；跨端三键 `defaultModel`/`shell`/`memory.team` 单列 `_SIBLING_SHAPES` 3 键）
  + T-S2.30–T-S2.35 绿 + `test/files.mjs`（VSC 仓）登记 + `TOOLS（VSC 仓）` 同步。**确定项，无纳入前置条件**。

## 7. 关键决策

- **全量任意键而非白名单**（用户拍板——明知可碰 apiKey 仍选全量）：配套 N-S1.2 敏感遮罩护栏（不是禁止——遮罩回显防泄漏；set 敏感键合法）。取舍：agent 理论上可把 apiKey 改成错误值（自伤）——与 bash rm -rf 同族（agent 自主域——审批门是防线——护栏为防"无意的明文泄漏"而非防"有意的破坏"）。
- **单工具多动作**（list/get/set——"工具会爆炸——靠参数做不同的事"——memory/subagent 同款）。
- **热应用而非"改完重启"**：set 内存即热 = 本工具存在理由（否则等价用户手改文件）；持久化写盘保重启。
- **文档级持久性边界**（F-S1.6）：loadConfig 保留域外键不承诺重启存活——设计诚实声明而非假装全量持久。
- **双端同批**（用户拍板）——VS Code config 存储差异（settings.json vs config.json）以 D-S1.5 偏差注处理。

### 7.2 第 8 批决策（D-S2——2026-09-11）

- **D-S2.1 根因修法 = 自动派生 + null 叶子显式形状表**（选型对比见 §8.2）：非 null 叶子继续派生（零手写）；null 叶子 **4 条**显式声明（逐键带代码依据）+ 同族 1 条单列于兄弟结构（`_SIBLING_SHAPES`——存在性断言面）；完备性由机械锁守（测试断言 + 一次性警告）。否决：跳过 null（静默面留存 + 新增静默面，见 §8.2 候选 1）/ 记 `"any"`（换名不换义）/ 全表手写（丢防漂移，违 F-S1.5 派生条款）。
- **D-S2.2 不可消费形态一律拒绝**（不按“形态接受”）：依据 = 应用侧对不可消费值的处置 = **读不出写入值**（折叠为未设置/回落，或远处的响亮失败——`subagentModel` 对象 → spawn 期 TypeError）而非按形态消费（`src/config.mjs:277` / `src/cli/make-agent.mjs:150` / `src/agent-tools/subagent-async.mjs:136`）——接受即等于承认静默面（违 F-S1.8）；响亮面同样写侧拒绝（错误点近写点——更便宜）。
- **D-S2.3 `null` 保留为合法值**（显式清除）：四键消费面均有“未设置”态且由 TUI 使用该态（`src/tui/cmd-shell.mjs:65` reset→null · `src/tui/cmd-submodel.mjs:63` 清除→null · `memory.team: null` = 未配置团队层）——清除是**有效动作**，不属静默。
- **D-S2.4 敏感键错误文案遮罩**（既有 N-S1.2 条款的合规化，非新行为）：现状错误句含 `JSON.stringify(args.value)`（`src/agent-tools/settings.mjs:138`）——实证 `set websearch.apiKey '{"k":"sk-SECRET"}'` → `sk-SECRET` 明文进错误文本（违 N-S1.2“错误文本永不出现明文”）；新校验器统一构造消息，敏感键命中时值位改 `••••（masked）`。取舍：不改错误句**结构**（判据/期望形态仍全量可见），只遮值。
- **D-S2.5 不校验渠道/模型/可执行文件存在性**（形状层止步）：`defaultModel` 只校验 `provider:model` 形态（首冒号 idx>0 ∧ 尾段非空），不查渠道是否存在——存在性属运行期（`src/model-ref.mjs:38-43`），已有 D-S1 原因面（`providerInvalidReason`）；同理 `shell` 不查可执行文件、`memory.team.repo` 不查 git 可达。
- **D-S2.6 不动读取侧**（零 reader 改动）：全部折叠/回落点（`config.mjs:277` / `make-agent.mjs:150` / `subagent-async.mjs:135-158` / `tools/bash.mjs:131`）保持原样——本批只加写侧护栏，护栏与 reader 是「拒绝 ⊆ 不可消费」的单调关系（§8.5），不可能新增静默。
- **D-S2.7 W3 同族纳入**（`agent.subagentModels`——默认 `{}` ⇒ 派生表零条目 ⇒ 零约束）：实证字符串被静默忽略（回落 `subagentModel`，`subagent-spawn.mjs:92`）——按 F-S1.8 一般表述纳入；**已裁定纳入本批**（2026-09-11 用户裁定——保留 W3 条目与用例：T-S2.12 正控 + T-S2.13 表驱动含 W3 行）。
- **D-S2.8 `parseValue` 引号行为保持现状**（登记观察，本批不裁定）：CLI 对“JSON 解析成功但结果为字符串”返回**原始串**（`settings.mjs:83`——`set x '"abc"'` 落盘 `"abc"` 含引号），VSC 返回**解析值**（`src/agent-tools/settings.mjs:79`（VSC 仓）——落盘 `abc`）；F-S1.3 值解析条款未覆盖引号语义，差异登记 `docs/TODO.md`（父侧）——本批不修、不锁测试。

## 8. 设计追加：null 默认值键的形状约束（第 8 批——2026-09-11）

> 需求层：`docs/requirements/SETTINGS-TOOL.md` §2（F-S1.7/F-S1.8）、§3（N-S1.5）；`F-S1.5` 派生条款由 N-S1.5 承接。
> 来源：`docs/TODO.md` 登记项（`settings` 工具对「内置默认值为 null 的已知键」类型校验失效）→ 批次档 `docs/batches/2026-09-11-SETTINGS-NULL-DEFAULT.md` §1。

### 8.1 问题陈述

**根因**：`buildTypeMap`（`src/agent-tools/settings.mjs:24-32`）用 `typeof 默认值` 作类型，`typeof null === "object"` → **null 叶子被记成 `"object"`**；而校验器唯一的放行口是 `value === null && want === "object"`（`:137`）→ 该键**只能被置 null**。

**三个方向同时坏（实证——本批勘察实跑，非推断）**：

| # | 方向 | 实证 | 后果 |
|---|---|---|---|
| ① | 合法值被拒 | `set defaultModel "deepseek:deepseek-flash"` / `set shell "pwsh"` / `set agent.subagentModel "kimi:k3"` → 全部抛 `expects object — got string` | 三键**无法经工具设置**（用户 config 的 `defaultModel` 改不动——本批来源） |
| ② | 非法值被收 + 下游静默 | `set defaultModel '{"a":1}'` → 通过 → `src/config.mjs:277` 非串 → **静默置 null**；`set memory.team '{"name":"x"}'` → 通过 → `src/cli/make-agent.mjs:150` `!team?.repo` → **团队层静默关闭** | 写了等于没写（零提示） |
| ③ | 同族静默（非 null 默认值） | `set agent.subagentModels "abc"` → 通过（派生表零条目）→ `subagent-spawn.mjs:92` 索引不到角色 → **静默回落 `subagentModel`** | 同族静默面（W3） |

附证（②的响亮面，非静默但更贵）：`set agent.subagentModel '{}'` → 通过 → spawn 期 `src/agent-tools/subagent-async.mjs:147` `modelArg.includes is not a function` **TypeError**（错误点远离写入点）。

### 8.2 方案选型对比

判据来自需求层：**① 防漂移意图保留**（F-S1.5/N-S1.5）· **② 反向静默面消除**（F-S1.8）· **③ 实现面大小** · **④ 双端可达**（VSC 无 DEFAULTS 顶层导出——只有 `AGENT_DEFAULTS`/`TRACES_DEFAULTS`）。

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **跳过 null 叶子**（`if (v !== null)`——即 VSC 现状） | ① 保留（派生不变）② **不消除**：`defaultModel` 收对象仍被静默置 null；`memory.team` 收字符串由「拒」变「收 + 静默关团队层」（**新增静默面**）③ 最小（1 行）④ 可达 | —— | **否决**——违 F-S1.8；且把当前唯一挡住字符串的路径拆掉 |
| 2 | **null 叶子记 `"any"`** 显式态 | ① 保留 ② 同候选 1（`"any"` = 无约束的换名）③ 最小 + 1 分支 ④ 可达 | —— | **否决**——换名不换义，静默面照旧 |
| 3 | **自动派生 + null 叶子显式形状表**（4 条）+ 同族/跨端单列（`_SIBLING_SHAPES`）+ 完备性机械锁 | ① 保留（非 null 仍派生；手写面收敛到 4 + 同族 1 条且逐键有代码依据）② **消除**（按消费形态接受、不可消费形态拒绝）③ 小（~45 行 + 4+1 条目）④ 可达（表就地声明，不依赖 DEFAULTS 顶层导出——VSC 端可只声明跨端键） | 代价 = 首次引入“逐键手写形状”面；以**完备性机械锁**（测试断言 + 运行期一次性警告）抵消手写漂移风险（N-S1.5） | **选定** |
| 4 | **全表手写**（含非 null 叶子） | ① 丢失（退回手写同步）② 消除 ③ 大（~30 条目 × 双端，且随 DEFAULTS 演化）④ 可达 | —— | **否决**——违 F-S1.5 派生条款 |

### 8.3 契约（形状表 + 校验语义）

**两表结构（评审修正轮 2026-09-11——集合相等面 / 存在性面分离；校验器两表都查）**：

**① `_NULL_LEAF_SHAPES`——null 叶子形状表（唯一「逐键手写形状」面；完备性锁的相等面——键集 == `_nullLeafPaths(DEFAULTS)`；CLI 4 条）**：

| 键 | 真实消费形态 | 依据（代码） | 接受集 | 拒绝集（= 不可消费形态） |
|---|---|---|---|---|
| `defaultModel` | `"provider:model"` 复合串 | `src/config.mjs:59`（默认 null）· `:277`（非串→null）· `src/model-ref.mjs:25-36`（形态面：首冒号分割 + 尾段非空；裸名拒）· `:38-43`（存在性面——D-S2.5 不查） | `provider:model` 形态串 ∪ `null` | 对象 / 数组 / 数字 / 布尔（`:277` → 静默 null）· 空串 / 无冒号串 / 尾段空串（解析无效——运行期原因面） |
| `agent.subagentModel` | 非空串 = `provider:model` \| 渠道名 \| 模型名 \| `"default"` 别名 | `src/agent-tools/subagent-spawn.mjs:83-93` · `subagent-async.mjs:135-158` | 非空串 ∪ `null` | 对象 / 数组 / 数字 / 布尔（spawn 期 TypeError——远处的响亮失败）/ 空串（falsy → 回落父 provider = 静默） |
| `shell` | 非空串 = shell 路径或命令 | `src/tools/bash.mjs:261` → `:131`（`shell ?? true`）· `src/tui/cmd-shell.mjs:28-38`（候选值域） | 非空串 ∪ `null` | 对象 / 数字 / 布尔（执行面读不出命令串）/ 空串（falsy → 关闭 shell 包裹——行为改变，非折叠） |
| `memory.team` | `{ repo: 非空串, name?, dir? }` | `src/cli/make-agent.mjs:148-152`（`!team?.repo → null`）· `src/distill.mjs:145` | 含非空 `repo` 的对象 ∪ `null` | 字符串 / 数组 / 数字 / 布尔（`!team?.repo` → 团队层静默关）/ 无 `repo` 或 `repo` 空/非串的对象 |

**② `_SIBLING_SHAPES`——同族/跨端形状表（存在性断言面——不参与集合相等；CLI 1 条）**：

| 键 | 真实消费形态 | 依据（代码） | 接受集 | 拒绝集（= 不可消费形态） |
|---|---|---|---|---|
| `agent.subagentModels`（W3 同族——默认 `{}`，非 null） | 角色→非空串映射 | `src/agent-tools/subagent-spawn.mjs:92` · `src/tui/cmd-submodel.mjs:15` | 值全为非空串的对象（`{}` = 清除）∪ `null` | 字符串 / 数组 / 数字 / 布尔（索引不到角色 → 静默回落 `subagentModel`） |

**校验语义（`_checkKnownKeyValue(path, value)`——替换现 `:134-140` 的逻辑）**：

1. **未知键**（表无条目）→ 原样通过（既有契约：全量域）。
2. **非 null 叶子**（表值 = `typeof` 串）→ 既有语义**逐字保留**（含 `want === "array"` 跳过、`value === null && want === "object"` 放行、错误句骨架）。
3. **形状表命中键**（`_NULL_LEAF_SHAPES` / `_SIBLING_SHAPES` 两表都查——表值 = 形状规格）：① `value === null` → 放行（显式清除）；② 不可消费形态 → 抛错；
   ③ 字符串类键：空串/纯空白 → 抛错，`defaultModel` 另需 `provider:model` 形态（首冒号 `idx > 0` ∧ 尾段非空）；④ `memory.team`：`repo` 必填非空串，`name`/`dir` 出现时须为非空串，**额外键放行**（既有“未知键原样”口径）；⑤ `agent.subagentModels`：值须为非空串（**角色名不校验**——见 §8.7）。
4. **错误消息（逐字模板；`<value>` 位在敏感键命中时替换为 `••••（masked）`——D-S2.4）**：
   - `settings set: "<key>" expects non-empty string ("provider:model" composite) — got <kind> (<value>)`
   - `settings set: "<key>" expects non-empty string — got <kind> (<value>)`
   - `settings set: "<key>" expects object { repo: string, name?, dir? } — got <kind> (<value>)`
   - `settings set: "memory.team" requires a non-empty "repo" (team layer stays off without it) — got <value>`
   - `settings set: "<key>" expects object of role→non-empty string — got <kind> (<value>)`
5. **`null` 语义**：显式清除 = 有效动作（消费面均有“未设置”态，见 D-S2.3）——不是静默。
6. **测试缝导出**（`_` 前缀——同 `config.mjs _setConfigPathForTest` 口径；**6 个**——`_checkShapeCompleteness` 为交付实测补入，2026-09-11）：`_buildShapeTable` / `_nullLeafPaths` / `_NULL_LEAF_SHAPES` / `_SIBLING_SHAPES` / `_checkKnownKeyValue` / `_checkShapeCompleteness`。
   依据注：`_checkShapeCompleteness` = T-S2.14「夹具注入未声明键被捕获 + 一次性警告列出键名」的**唯一机械缝**（导出面 `src/agent-tools/settings.mjs:263`；测试直用 `test/settings.test.mjs:284-290`；VSC 端同导出于 `thincoder-vscode/src/agent-tools/settings.mjs:249`）。
7. **锁断言形态（逐字——coder 照抄；VSC 相等面 = 交付实测形态 2026-09-11）**：CLI——`assert.deepEqual(Object.keys(_NULL_LEAF_SHAPES).sort(), _nullLeafPaths(DEFAULTS).sort())`（T-S2.14 相等面）·
   `assert.ok("agent.subagentModels" in _SIBLING_SHAPES)`（存在性面）。VSC——`assert.deepEqual(Object.keys(_NULL_LEAF_SHAPES).sort(), _nullLeafPaths({ agent: AGENT_DEFAULTS }).sort())`（T-S2.33 相等面——当前 2 键；实测 `thincoder-vscode/test/settings-tool.test.mjs:106`）·
   跨端三键逐个 `assert.ok(k in _SIBLING_SHAPES)`（实测 `:107`）。
   **旁注（交付实测修正——语义不变 = 相等面锁）**：设计原字面 `_nullLeafPaths(AGENT_DEFAULTS)` 产出**裸名**集合（`subagentModel` / `compactThreshold`——缺 `agent.` 前缀），与本端形状表 `agent.*` 键集**不可同时满足**（逐字实现必红）；`{ agent: AGENT_DEFAULTS }` 为唯一可满足式。

### 8.4 影响面枚举（穷尽——本批最易漏面）

**机械枚举**（对 `DEFAULTS` 递归取 null 叶子）：`["defaultModel", "agent.subagentModel", "memory.team", "shell"]`——**4 键**，与手工枚举一致；另有同族键 `agent.subagentModels`（默认 `{}` ⇒ **零条目** ⇒ 零约束，W3——单列 `_SIBLING_SHAPES`）与数组默认值键（`agent.consultModels` / `agent.streamRules` / `mcp.servers`——既有设计**明示豁免**，本批不动）。

逐键消费形态与不可消费条件见 §8.3 两表（每行「依据/拒绝集」两列即影响面证据）。补注：`agent.advisor`（`{guard:false}` 非空对象）· `agent.poolLimits`（三键对象）· `memory.*` 其余键均有非 null 默认值 → 已有 `typeof` 约束，**不在影响面内**。

**VSC 端批次前现状（W2——跨端三键无约束；本批已修——交付实测见下）**：其派生表只覆盖 `AGENT_DEFAULTS`/`TRACES_DEFAULTS`（`thincoder-vscode/src/config-io.mjs:296-324`）——null 叶子 2 键（`subagentModel` / `compactThreshold`）。
`compactThreshold` 在 CLI 侧默认 `100000`（两端不同源）；`defaultModel` / `shell` / `memory.team` **表内无条目** ⇒ 任何形态都被接受并落进**共享的** `~/.thincoder/config.json`（②静默面在 VSC 工具面完整存在）。
**VSC 派生表键空间（交付实测 2026-09-11——显式化）**：派生根 `_DEFAULTS_ROOT = { agent: AGENT_DEFAULTS, traces: TRACES_DEFAULTS }`（`thincoder-vscode/src/agent-tools/settings.mjs:39-40`——键空间 = **工具寻址的完整点分路径**）。
旧实现键空间 = 裸名（`subagentModel`/`maxTurns`…——`buildTypeMap(AGENT_DEFAULTS)` 无前缀）= 另一处缺陷面：真实寻址键 `agent.maxTurns` 恒无条目 ⇒ 类型校验空转（`traces.*` 旧实现已带前缀——不受此影响）。
**连带行为增量（如实记录）**：`agent.*` 非 null 叶子在 VSC **开始受校验**（T-S2.34 补断言锁住：`set agent.maxTurns "abc"` 拒 / `"200"` 收）；裸名键（如 `set maxTurns …`）按**未知键原样**（落盘但不被消费——与 CLI 未知键语义一致）。

### 8.5 无静默的机械论证（F-S1.8 的判据形式）

- **单调性引理**：护栏的**拒绝集 ⊆ 应用侧不可消费集**（逐键证据见 §8.3 两表「依据/拒绝集」两列）⇒ 加护栏只会**减少**「写了等于没写」的落盘面（静默折叠 + 远处的响亮失败），不可能新增静默。反例对照：候选 1（跳过 null）把 `defaultModel` 的不可消费形态（对象）与 `memory.team` 的不可消费形态（字符串）从「拒」翻成「收」→ 新增静默——这正是它被否决的机械理由。
- **判据的机械形式**：对每个受约束键，表驱动断言「**接受集 == 应用侧可消费集** ∧ **拒绝集 == 应用侧不可消费集**」（集合相等——T-S2.13）；判定取自应用侧读取器本体（`loadConfig()` 真读 / `effectiveSubagentModel()` / `teamConfig` 的 `repo` 条件 / `config.shell`；`defaultModel` 串另加 `model-ref.mjs:25-36` 形态面——夹具串避开存在性层 `:38-43`，D-S2.5），非测试自造谓词。
- **逐键消费判据（可机判——T-S2.13 表驱动行）**：`defaultModel` 可消费 ⟺ `loadConfig()` 保留写入串（`:277`）∧ 形态可解析（`model-ref.mjs:25-36`）；`agent.subagentModel` ⟺ 非空串（`effectiveSubagentModel` 返回）；`shell` ⟺ 非空串（`config.shell` 读回）；`memory.team` ⟺ 非空 `repo`（`make-agent.mjs:150` 不成立）；`agent.subagentModels` ⟺ 命中写入值（否则回落）。
- **`null` 的排除**：`null` 在四键消费面均映射到“未设置”态（D-S2.3）——它是**有效值**，不属于「不可消费形态」；工具放行 = 语义稳定，测试断言其读取结果为“未设置”态（而非被丢弃）。
- **边界（形状层止步）**：本论证只覆盖**形状**。存在性/可达性（渠道、模型、可执行文件）属运行期域——由既有原因面负责（`providerInvalidReason` / spawn 期抛错 / bash 执行报错），本批不纳入（D-S2.5）。

### 8.6 工具描述同步（第 5 问——逐字新句）

**CLI（`src/agent-tools/settings.mjs:98`，整句替换）**：

> Known keys are type-checked: scalar keys against the built-in defaults (agent.maxTurns a number, traces.enabled a boolean); keys whose default is null against their real consumption shape —
> defaultModel "provider:model", agent.subagentModel / shell non-empty string, memory.team object with a repo — so a value the app would silently drop is refused (null clears the key).
> Unknown keys under a known section are stored as given. Values parse as JSON first (true/false/numbers/objects/arrays), else stay strings.
>
> （换行仅为排版——实现时合并为**一整句**逐字替换原文。）

**VSC（`thincoder-vscode/src/agent-tools/settings.mjs:91`，整句替换）**：

> Known keys are type-checked: scalar keys against the built-in defaults (agent.maxTurns a number, traces.enabled a boolean); keys whose default is null (or that live only in the shared config.json) against their real consumption shape —
> defaultModel "provider:model", agent.subagentModel / shell non-empty string, agent.compactThreshold a number, memory.team object with a repo — so a value the app would silently drop is refused (null clears the key).
> Unknown keys under a known section are stored as given. Values parse as JSON first (true/false/numbers/objects/arrays), else stay strings.
>
> （换行仅为排版——实现时合并为**一整句**逐字替换原文。）

取舍：只**增补一条从句**、不删既有语义（未知键/值解析/遮罩/门禁句全保留）；描述是**模型可见文案面**（每回合计费）——从句长度 ~200 字符，换取的是一次调用失败的避免（现状：合法值失败 → 模型反复试错）。

### 8.7 边界（本批不做）

- **不改 `DEFAULTS` / `AGENT_DEFAULTS` 键集与语义**（零 delta——`src/config.mjs` 本批**零改动**）。
- **不改读取侧**（`config.mjs:277` 兜底 / `make-agent.mjs` / `bash.mjs` / `subagent-async.mjs` 全部零 delta）。
- **不改其它写面**：`/config`、`/shell`、`/submodel` TUI（各自菜单值域受控，**不共用本校验**——实证：`TYPE_MAP` 全仓仅 2 处）、VSC 面板写面（`settings-panel-write.mjs` 自有一套清洗）、`persistRaw`/`writeConfigAtomic` 写链。
- **不改** list/get、敏感键遮罩语义（D-S2.4 属既有条款合规化）、写盘最小化 D-F5b、审批门、热应用语义。
- **不校验**渠道/模型/可执行文件存在性、角色名合法性；**不改** `parseValue` 引号行为（D-S2.8 登记观察）。
- **数组默认值键**（`consultModels`/`streamRules`/`mcp.servers`/`providers`）维持既有豁免。
- **不改任何用户配置文件内容**（本批 = 工具面修复；改用户值是运维动作）。
- **UI/交互**：无 UI 面变更——唯一模型可见文案面 = §8.6 描述句；无未决（open）项。

## 受影响文件（实现时点）

| 端 | 文件 | 动作 |
|---|---|---|
| CLI | `src/agent-tools/settings.mjs` | NEW（工具实现） |
| CLI | `src/cli/make-agent.mjs` | MODIFY（装配 baseTools） |
| CLI | dispatch 只读动作分类 | MODIFY（list/get 放行——memory 同款处） |
| CLI | `test/settings.test.mjs` | NEW |
| CLI | `docs/design/TOOLS.md` | MODIFY |
| CLI | `docs/README.md` | MODIFY（地图登记——TOOLS.md 板块独立保留） |
| CLI | `CHANGELOG.md` | MODIFY（[Unreleased]） |
| VS Code | agent-tools 镜像 + 注册 + 门禁 + 测试 + 文档 | 同批 |

### 第 8 批受影响文件（2026-09-11——行数注记 = 批次前 → 交付态；增量 = 设计估 → 实测）

| 端 | 文件 | 行数注记（批次前 → 交付态） | 增量（设计估 → 实测） | 动作 |
|---|---|---|---|---|
| CLI | `src/agent-tools/settings.mjs` | 153（批次前）→ **263**（交付态·实测） | +110（实测——设计估 +40~50；形状表 4 + 同族 1（分表）+ 校验器 + 测试缝导出 + 描述句） | MODIFY |
| CLI | `test/settings.test.mjs` | ——（批次前无此档）→ **433**（交付态·实测） | 433（实测——设计估 ~163；T-S2.1–T-S2.24 + T-S2.17b——25 例，含回归网） | NEW |
| CLI | `docs/design/SETTINGS-TOOL.md` | 121（批次前）→ **335**（交付态·实测——含交付同步） | +§8 + §5.1 + AC-S2 + §7.2 + 更正注 + 评审修正轮 + 交付同步（见行数差） | MODIFY（本设计——eng-designer 已落） |
| CLI | `docs/requirements/SETTINGS-TOOL.md` | 22（批次前）→ 50（交付态·实测） | +F-S1.7/F-S1.8/N-S1.5（见行数差） | MODIFY（需求合并——eng-designer 已落） |
| VSC（W2） | `thincoder-vscode/src/agent-tools/settings.mjs` | 147（批次前）→ **249**（交付态·实测） | +102（实测——设计估 +~35；同源形状表——本端 null 叶子 2 + 跨端 3 + 键空间归一） | MODIFY |
| VSC（W2） | `thincoder-vscode/test/settings-tool.test.mjs` | ——（批次前无此档）→ **148**（交付态·实测） | 148（实测——设计估 ~110；T-S2.30–T-S2.35——6 例） | NEW |
| VSC（W2） | `thincoder-vscode/test/files.mjs` | 49（批次前）→ 50（交付态·实测） | +1（登记——VSC 清单为显式列表，不登记不跑） | MODIFY |
| VSC（W2） | `TOOLS（VSC 仓）` | 213（批次前）→ 222（交付态·实测） | +10（实测——设计估 +~20；settings 工具形状护栏节） | MODIFY（本设计——eng-designer 已落） |
| 父侧 | `docs/TODO.md` / `CHANGELOG.md` | 259 / —— | —— | 核销/记账（主 agent——不入 coder files 域） |

**拆分计划**：无需拆分——最大改动面 `src/agent-tools/settings.mjs` 预计 ~200 行（<300 建议线）；`src/config.mjs`（487，接近 500 硬限）本批**零改动**。

## 9. 第 13 批：parseValue 两端统一（用户裁定 ① 去引号——2026-09-11）+ CHANGELOG 记账更正

> 需求层 = `../requirements/SETTINGS-TOOL.md` §2 F-S1.3 补充块；批次档 = `../batches/2026-09-11-MECH-DEBT-SWEEP.md` §1 条目 E。
> 承接 = §4.5 / §7.2 D-S2.8（第 8 批登记观察——本批裁定面）。
> **裁定（2026-09-11——用户「可以」；批次档 §1）**：**选定 ①「去引号（解析值）」**——下文「选定分支」= ①；②/③ 保留为未选分支记录（不实施）。

### 9.1 问题（两端语义分裂——as-of 实测）

同一共享配置（`~/.thincoder/config.json`）的同一键，两端 `parseValue` 对「JSON 解析成功但结果为字符串」处理不同：

| 端 | 落点 | 实现行 | 输入含引号（值串形如 `"abc"`）的落盘值 |
|---|---|---|---|
| CLI | `src/agent-tools/settings.mjs` | :188–198（`return s`——原始串） | `"abc"`（**含引号字面**） |
| VSC | `thincoder-vscode/src/agent-tools/settings.mjs` | :179–188（`return v`——解析值） | `abc`（去引号） |

其余形态（数字 / 布尔 / `null` / 数组 / 对象）两端一致；裸字符串（无引号）两端一致（原样字面）。

**影响面（实测核过）**：① 两端测试现状都不锁该分歧（CLI `test/settings.test.mjs` 无引号面用例；
VSC 档 `:69` 注释记「解析值」但断言面 = 拒绝非数值——两种语义下同拒）；② 已知键形状校验可能被带引号值「穿过」
（如 `defaultModel` 的 `provider:model` 形态判据 = 首冒号位置 + 尾段非空——含引号值可过形态面，
但下游按字面消费时引号进 provider 段——写入值 ≠ 用户意图）；③ 影响频率低（仅当传值字面含引号字符时）。

### 9.2 候选对比（**用户裁定 ① 去引号——2026-09-11**）

| # | 候选 | 语义 | 影响 / 代价 | 结论 |
|---|---|---|---|---|
| ① | 统一为**解析值**（去引号） | 两端都返回 `v`（VSC 现语义） | 改 CLI 一行 + 注释；引号 = JSON 语法（符合直觉）；可表达「字符串数字」（含引号 `"100"` → 字符串 `100`）；CLI 测试补 pin | **设计推荐** |
| ② | 统一为**原始串**（保引号） | 两端都返回 `s`（CLI 现语义） | 改 VSC 一行 + 注释；引号保留（含引号 `"100"` 无法表达为字符串数字——与裸 `100` 撞数值语义）；VSC 测试补 pin | 备选（保守——CLI 零改） |
| ③ | 登记差异（维持现状） | 两端各异（显式契约） | 零代码；同一键两端写入值不同成为**登记事实**——切换端后配置值漂移；双端测试各锁现状 + 文档登记 | 不推荐 |

### 9.3 契约（选定 ① 落地——分支逐字）

- **① 去引号**：CLI `parseValue` 的字符串分支 `return s` 改 `return v`（+注释更正为「解析值」）；两端落盘一致 = `abc`。VSC 零改。
- **② 保引号**：VSC `parseValue` 的 `return v` 改 `return s`（+注释）；两端落盘一致 = `"abc"`。CLI 零改。
- **③ 登记**：两端行为零改；F-S1.3 记差异条目 + 双端测试各锁现状。
- **共同**：不可消费形态（如字符串赋给数值键）两端同拒、磁盘零变化（既有校验面零改）。

### 9.4 CHANGELOG 记账更正（父侧写域——一行说明）

- 目标：`CHANGELOG.md:42`（[0.12.59] Added 首条）——「测试 T-S1.1-11（CLI 11 + VS Code 6）」**不实**
  （该测试档从未随批落地；实证 = 本档 §5 更正注）。
- 建议文案（就地更正）：`…（记账更正 2026-09-11：原声称的 T-S1.1-11 测试未随批落地——测试欠账于 2026-09-11 补齐：CLI 25 例 / VS Code 6 例）。`
- 替代方案：0.12.60 节加 `### Fixed` 一行同文更正（不动历史行）。
- **父侧落笔**（本设计不动 CHANGELOG）。

### 9.5 用例表（选定分支 ① 适用——②/③ 分支的对照端互换）

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-S3.1 | 正常 | `set` 串型键传值字面含引号 | ① 落盘 `abc`；② 落盘 `"abc"`（两分支各自断言） | F-S1.3 补充 |
| T-S3.2 | 正常 | 既有形态回归：裸串 / 数字 / 布尔 / 对象 / 数组 | 落盘值与判定零回归（沿 T-S2 家族口径） | F-S1.3 |
| T-S3.3 | 错误 | 含引号数字赋给数值键 | 拒绝 + 磁盘零变化（两分支同） | F-S1.5 面 |
| T-S3.4 | 边界（仅 ③ 分支） | 两端对照 | 各自现状锁定（CLI 含引号 / VSC 去引号）+ 差异登记在档 | ③ 分支专用 |

> 计数（修正轮 #8）：① 裁定下适用 **3** 例（T-S3.1–T-S3.3）；T-S3.4 = **③ 分支专用**（未选留档、不交）。全批计数 = 批次档 `2026-09-11-MECH-DEBT-SWEEP.md` §2 修正轮同步块（设计 15 行 / ① 下实交 14）。

### 9.6 验收标准（逐条回指）

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-S3.1 | 选定分支落地：改端一行 diff 与 §9.3 逐字一致 + T-S3.1/T-S3.3 绿（对照端零改——改动集判据按分支） | F-S1.3 补充 |
| AC-S3.2 | CHANGELOG 更正落档（父侧——行内 `记账更正` 子串在位；或 0.12.60 Fixed 行） | E-② |
| AC-S3.3 | 零回归：改端既有设置测试档全绿；`node scripts/check-doc-width.mjs` 新增违规 0 | F-S1.5 面 |

### 9.7 边界（本批不做）

- 不改 `parseValue` 的其他分支语义（数字 / 布尔 / null / 数组 / 对象 / 裸串）；不改校验器 / 形状表 / 写盘链
- 不改 `DEFAULTS` / 读取侧；不做跨端配置迁移（用户既有值不动）
- 不碰 `docs/TODO.md` / CHANGELOG（父侧写域——§9.4 只给落笔说明）
