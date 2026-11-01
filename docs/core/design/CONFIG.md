# 配置系统（CONFIG）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围

> **现况**：配置面两端均已迁核——加载器 / 迁移 / 预设表 = 核单源；端侧只留消费面（写盘通道 / 监视 / 迁移 glue / provider 访问层）。下表“现体”列 = 当前落点。

| 面 | CLI 档（现体） | VSC 档（现体） |
|---|---|---|
| 装载器 / 默认值 | `thincoder-core/config.mjs` | `thincoder-core/config-io.mjs` + `thincoder-core/config.mjs`（端壳读面 = `thincoder-vscode/src/extension/presets.mjs`） |
| 迁移 | `thincoder-core/config-migrate.mjs` | `thincoder-core/config-migrate.mjs`（端侧 VS Code glue = `src/extension/migrate-settings.mjs`） |
| 分段配置 | （内联于核 `config.mjs`） | `thincoder-core/config-presets.mjs` · 端壳段 = `config-mcp.mjs` · `embed-config.mjs` · 端侧 consult 读面 = `thincoder-vscode/src/extension/presets.mjs` |
| 写盘面 / 面板 | `src/cli/`（TUI 侧） | `src/extension/settings-panel-write.mjs`（`$schema` 缝供值）· `thincoder-vscode/src/extension/settings.mjs` · `config-watch.mjs` · `migrate-settings.mjs` |
| settings 工具 | `thincoder-core/agent-tools/settings.mjs` | 同核面（端侧实例化于 `thincoder-vscode/src/agent/setup.mjs`；类型表 = 核全量 DEFAULTS 派生，A5） |
| 路径展开 | `thincoder-core/expand-home.mjs` | `@thincoder/core/expand-home.mjs` |
| 代理 | `thincoder-core/proxy.mjs` | `@thincoder/core/proxy.mjs` |
| 供应商增删 / 密钥 / 激活 | `thincoder-core/config-io.mjs` 纯持久化面 + `src/cli/setup-wizard.mjs` · `src/tui/model-picker.mjs`（UI 壳） | `thincoder-vscode/src/extension/settings.mjs` · `provider-flows.mjs`（UI 壳）· `presets.mjs`（端侧访问层） |

**共同基线**：两端**同一文件同一格式**——`~/.thincoder/config.json`（严格 `JSON.parse`，无 JSONC）。

## 2. 核模块裁决行

### 2.1 同路径对

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 74 | `proxy.mjs` | 同路径 | 0.7570 · 异 | ② | 进核 | 融合：取 CLI（abort 来源标注）+ VSC 的坏代理串友好报错并入 | 分叉 ＝ 错误形态（VSC 包 try/catch 报「Invalid proxy URI」`src/proxy.mjs:189,236` / CLI 抛原生）；配置格式与双开关语义同 | — | S1（建核补齐） |
| 77 | `expand-home.mjs` | 同路径 | 0.2308 · 异 | ② | 进核 | 融合：取一侧、逐字随迁 | 分叉 ＝ 仅注释出处（CLI 引记忆子系统规范档的 §9.3a / VSC 引本端设置档的 §2.7） | — | S1（建核补齐） |
| 79 | `config-migrate.mjs` | 同路径 | 0.0802 · 异 | ② | 进核 | 融合：取并集——核内保留 VSC 的 VS Code 旧设置 / 密钥库迁移遍（`src/config-migrate.mjs:112-184`） | 分叉 ＝ VSC 多一条老用户升级通道（VSC 独有迁移遍，不迁即丢密钥）；模型字段迁移两端同规则（CLI `src/config-migrate.mjs:20-63`） | — | S1（建核补齐） |
| 80 | `config.mjs` | 同路径 | 0.0471 · 异 | ③ | 进核（**同名不同物**：对位 = CLI `config.mjs` ↔ VSC `config-io.mjs`；VSC 的 `config.mjs` 实为模型规格表 ↔ CLI `model-specs.mjs`） | 以 CLI 为准（装载器）+ VSC 的 `$schema` 注入与配置监视面按端注入；默认值 / 校验覆盖范围取 CLI 全量表 | 分叉 ＝ 组织结构（VSC 拆 8 档）+ 两处差异（`$schema` 注入 VSC `src/config-io.mjs:108`；VSC 校验表只覆盖 agent/traces `src/agent-tools/settings.mjs:43`）；前提（同一 `~/.thincoder/config.json`、同一 v2 架构）仍成立 | **①②** | S1（建核补齐） |
| 87 | `thincoder-core/agent-tools/settings.mjs` | 同路径 | 0.5546 · 异 | ③ | 进核 | 以 CLI 为准（类型表由全量 DEFAULTS 派生 `src/agent-tools/settings.mjs:58`） | 分叉 ＝ 校验覆盖范围（VSC 只派生 agent/traces `:43,61` ⇒ `websearch` / `mcp` / `memory` / `embedding` / `shell` 错类型可静默写入两端共享的 `config.json`）；前提（同一 config.json）仍成立 | **①②** | S1（建核补齐） |

### 2.2 语义对位遍行（同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 128 | `src/config.mjs`（装载器 + DEFAULTS）↔ `src/config-io.mjs` | ② | 融合：以 CLI 装载器为准 + `$schema` 注入按端差注入 | 分叉 ＝ 拆分（VSC 拆 8 档）；同一 `~/.thincoder/config.json`、同一 v2 架构 ⇒ 前提成立；**承 §2.5 #80** | —（承 #80） | S1（建核补齐） |
| 129 | `src/config.mjs`（`PROVIDER_PRESETS`）↔ `src/config-presets.mjs` | ② | 融合：取一侧（逐条同值） | 分叉 ＝ 拆档；VSC 头注自述「mirrors CLI PROVIDER_PRESETS…双端逐条同值」（`:2,7`）⇒ 前提成立 | — | S1（建核补齐） |
| 130 | `src/config.mjs`（consult / mcp / embedding 三段）↔ `src/config-consult.mjs`（端侧 consult 读面现体 = `thincoder-vscode/src/extension/presets.mjs`） · `config-mcp.mjs` · `embed-config.mjs` | ② | 融合：核内单一 DEFAULTS + 三段的端侧消费面按端注入 | 分叉 ＝ 拆档；三段均以同一 `config.json` 为源（VSC `config-consult.mjs:8` 自述「镜像 CLI config.mjs 同规则」）⇒ 前提成立 | — | S1（建核补齐） |
| 131 | `src/config.mjs`（写盘面）↔ `src/extension/settings-panel-write.mjs` · `thincoder-vscode/src/extension/settings.mjs` | ② | 融合：核内单一读写 + 面板写面按端注入；**MCP 配置留 VS Code 设置** ＝ 端特有段 | 分叉 ＝ 写入口（VSC 设置面板 / CLI TUI）；写盘产物同一 `config.json`（VSC `thincoder-vscode/src/extension/settings.mjs:2` 自述「Backed by the shared ~/.thincoder/config.json」）⇒ 前提成立 | — | S1（建核补齐） |
| 132 | （CLI 无监视面）↔ `thincoder-vscode/src/extension/config-watch.mjs` · `thincoder-vscode/src/extension/migrate-settings.mjs` | ④ | 端特有段（**判词收窄**）：配置监视**宿主接线**（`workspace` 事件——端壳；纯逻辑已上提核 `thincoder-core/config-watch.mjs`）+ VS Code 旧设置 / 密钥库迁移 | 结构性不对称 = **依赖壳能力**（宿主文件监视 / `SecretStorage`）——CLI 无对应宿主面（B17）；依据是「**只在单侧存在**」，**非**「差异」（A9） | — | S1（建核补齐） |
| 177 | `src/cli/setup-wizard.mjs` + `src/tui/model-picker.mjs` ↔ `thincoder-vscode/src/extension/settings.mjs` + `provider-flows.mjs` + `presets.mjs` | ② | 融合：provider 增删 / 密钥 / 激活的**纯持久化函数**取一侧 + UI 壳按端注入 | 分叉 ＝ UI 壳（QuickPick / TUI picker）+ 目录；持久化语义两端同（`config.json` `providers[]` + 单值 `model`——VSC `thincoder-vscode/src/extension/provider-flows.mjs:10` 自述「identical to the CLI」）⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A4 | `config.mjs`（席位 #80；**同名不同物**——对位 = CLI `config.mjs` ↔ VSC `config-io.mjs`） | ①② | 装载器 + 全量 DEFAULTS（agent / memory / shell / embedding / mcp / websearch / traces）；写盘不注入 `$schema` | 装载器在 `config-io.mjs`（同址同格式）；写盘**注入 `$schema`**（`src/config-io.mjs:108`）；本端 `config.mjs` 实为模型规格表 | 以 CLI 为准（装载器）+ 端差注入（`$schema` 是否注入 · 配置监视面） | ① 配置文件里会 / 不会多一个 `$schema` 键（仅 VSC 写盘时）；② 键名与默认值口径统一 ⇒ 旧键保留为读入别名（兼容） | **已裁 · 按建议** |
| A5 | `thincoder-core/agent-tools/settings.mjs`（#87） | ①② | 类型表由**全量** DEFAULTS 派生（`thincoder-core/agent-tools/settings.mjs:58`）⇒ 错类型被拒 | 类型表只派生 agent / traces（`:43,61`）⇒ `websearch` / `mcp` / `memory` / `embedding` / `shell` 的错类型**静默写进两端共享的 `config.json`** | 以 CLI 为准（全量类型校验） | ① VSC 里写错类型会被拒绝（原来会静默落盘，且 CLI 下次读该值会异常）；② 共享 `config.json` 的写入可靠性 | **已裁 · 按建议** |

## 4. 对外契约影响（契约类模板见 `CORE-UNIFICATION.md` §2.12.1）

> **契约类形态（模板）** → `CORE-UNIFICATION.md` §2.12.1「**配置格式**」行（单一权威源——本档不复制；该表 = 逐类兼容形态模板）。

### 4.1 处置表行

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 1 | `~/.thincoder/config.json` 键面与默认值（含 CLI-only `agent.goalTurns` / `agent.streamRules`；`agent.compactThreshold` 默认值分叉） | 配置 | 两面 → 核内单一 DEFAULTS | 旧键可读（迁移幂等 + 写回带 `.bak-{ts}`）· CHANGELOG | `thincoder-cli/CHANGELOG.md` ∥ `thincoder-vscode/CHANGELOG.md` + `thincoder-cli/README.md` 键面 + 旧配置读入用例（S2 落） | 已裁 · 按建议（§2.5.1 A4） |
| 2 | `$schema` 注入与否（VSC 写盘注入 / CLI 不注入） | 配置 | 取一侧 + 登记 | 登记 + README 键面同步 | 同第 1 行 + 配置读写用例 | 已裁 · 按建议（§2.5.1 A4） |
| 3 | `settings` 工具的类型校验面（错类型是否拒写） | 输出（工具回话） | VSC = 拒绕并报错（同 CLI） | 登记 + CHANGELOG（工具行为条目） | `SETTINGS-TOOL.md` 同步 + VSC 用例 | 已裁 · 按建议（§2.5.1 A5） |
| 4 | `agent.engineering` 的写盘范围（VSC 双写共享 `config.json`） | 配置 | 取 CLI（只进会话） | 旧行为撤回 ⇒ CHANGELOG + 登记 | `SESSION.md` / `docs/core/design/ENGINEERING-MODE-V2.md` 同步 | 已裁 · 按建议（§2.5.1 A6） |

## 6. 机制面

### 6.1 并发池配置面

**池机制本体**（容量 / 补位 / 调度 / 评审池）住 `AGENT-LOOP-ASYNC-POOL.md` §6.10 / §6.11——本档只收**配置键面**（D2）。

**配置键**：`agent.poolLimits = { engCoder, other, advisor }`——单对象配置键（三池统一，默认 **4 / 4 / 4**）。

| 键 | 消费面 | 校验 / 回退 |
|---|---|---|
| `engCoder` | subagent 域读取器（运行期读） | 正整数 ≥1 生效；非法 / 缺省回退 4 |
| `other` | 同上 | 同上 |
| `advisor` | **独立** advisor 读取器（每 launch 读） | 合法 ≥1 整数生效；非法 / 缺省回退 4 |

- **双读取器独立不共享**（键表语义不同）：subagent 两键 = `thincoder-core/agent-tools/subagent-async.mjs:94`（`poolLimitsFor`）；advisor 第三键 = `thincoder-core/agent-tools/advisor-async.mjs:178`（`resolveAdvisorPoolLimit`）。
- **默认值三源同改**（缺一即漂移）：DEFAULTS（`thincoder-core/config-defaults.mjs:46`）↔ 运行时常量（`thincoder-core/agent-tools/subagent-async.mjs:55` · `thincoder-core/agent-tools/advisor-async.mjs:166`）。
- **生效时机**：变更下回合生效；运行期读取点各自校验（非法键回退默认 + 告警）。
- **界面入口**：CLI `/config` →「并发池」子菜单（`thincoder-cli/src/tui/cmd-config-menus.mjs:160`–`:191`——三域读写 + 主菜单 / view 摘要）；VSC 设置面板并发池三域（`thincoder-vscode/src/extension/settings-panel-write.mjs:94` 白名单 · `thincoder-vscode/src/extension/settings.mjs:176` 回退显 4/4/4）。
- **向后兼容**：旧两键配置值零迁移（`advisor` 缺省 ⇒ 回退 4）；非法值不落盘回退；VSC 面板白名单全非法 ⇒ 删整键回退默认（语义不变）。
- **模型可见文案去数字化**：advisor 工具描述与拒文案报**生效上限**（`thincoder-core/agent-tools/advisor.mjs:49` · `thincoder-core/agent-tools/advisor-async.mjs:266`）。
- **同 scope 评审并发守卫**：容量守卫 ⇄ 同 scope 守卫**两关独立**——机制本体见 `AGENT-LOOP-ASYNC-POOL.md` §6.10（本档不复制）。
- **范围边界**：评审轮次**无机械上限**（见 `ADVISOR-CONVERGENCE.md` §3）；**排队口径 = 异 scope 入队 / 同 scope 仍拒**（见 §7 D-CF3 与 `AGENT-LOOP-ASYNC-POOL.md` §6.10）；engCoder / other 两域语义不变（只界面 / 一致性 / 第三键）。

### 6.2 配置通道纪律与自有环境变量面

**纪律（单源 · 全仓适用）**：自有配置 / 行为输入**只经四类通道**——不得经环境变量（含「未设即缺省」与「旧名兼容读」两类回退分支）。

**值位显式引用 ≠ 配置通道**：敏感值位的 `${env:VAR}` 引用（§6.3）**不构成配置通道**——配置键（`config.json`）仍是唯一真源；env 只在用户于值位**显式引用**时充当凭据来源，无隐式回退分支（缺失 ∕ 空串即抛错——§6.3）。

| # | 通道 | 形态 | 适用面 |
|---|---|---|---|
| ① | **配置键** | `~/.thincoder/config.json` 键（DEFAULTS 声明 + `loadConfig` 合并；非法 / 缺失回退默认） | 用户面开关（CLI / VSC 共用同档） |
| ② | **CLI 参数** | 工具自身 CLI 契约（`bench/*.mjs --<opt>`） | 无 `config.json` 面的工具（bench 族） |
| ③ | **进程内 setter 缝** | `_set<名>ForTest(v)` / `_reset<名>ForTest()` 成对（模块级 `let _x = null`；读点 `_x ?? 默认`）· **命名 / 成对例外 = 逐行标于名录** | 测试隔离落点（日志 / 轨迹 / bench 结果目录 / 判官档 / 价格表） |
| ④ | **显式参数门** | 子进程 argv 内部标志（bin 顶部自剥离，不进命令解析）/ 直跑脚本参数（缺 ⇒ skip + 提示，退出 0） | 子进程测试钩 / 冒烟 / 嵌套实例 |

**缝形态先例**：`thincoder-core/config-io.mjs:37-42`（`_setConfigPathForTest` / `_resetConfigPathForTest` + 模块级 `_configPath`）。

**写门**：`NODE_TEST_CONTEXT`（node:test 自设——外部约定，不在拔除面）下，日志 / 轨迹**只写显式缝指向的落点**；未设缝 ⇒ 跳过写盘（不污染真实 `~/.thincoder`）。

**argv 门的副作用免害**：显式 argv 标志不受宿主 env 透传影响。

**保留集 = 外部约定**（非「我们的配置」——不属本纪律、不拔）：`NODE_TEST_CONTEXT` · `ELECTRON_RUN_AS_NODE` · `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` / `NO_PROXY` 一族 · CI 与 `npm_*` 系 · 系统原语（`HOME` / `USERPROFILE` / `LOCALAPPDATA` / `PATH` / `LC_ALL` / `LANG`）· 外部工具契约（`GIT_EDITOR` · `VSCE_PAT` / `OVSX_PAT`）。

**自有面名录**：

| 旧 env | 现通道 | 落点 |
|---|---|---|
| `THINCODER_LOG_DIR` | ③ 缝 | `thincoder-core/log.mjs`：`_setLogsDirForTest` / `_resetLogsDirForTest`（写门 = `NODE_TEST_CONTEXT` ∧ 未设缝） |
| `THINCODER_TRACES_DIR` | ③ 缝 | `thincoder-core/traces/trace-store.mjs`：`_setTracesRootForTest` / `_resetTracesRootForTest`（同门形） |
| `THINCODER_HEAP_SNAPSHOT` | ① 键 | `diagnostics.heapSnapshot`（默认 `false`——隐私默认关〔traces D-TR6 同族〕；桌面端运行期热读）→ `prepareCrashReporting({ heapSnapshot })`（`thincoder-cli/src/crash-reports.mjs`） |
| `THINCODER_HEAP_WATCH` | ① 键 | `diagnostics.heapWatch`（默认 `true`）→ `startHeapWatch({ enabled })`（`thincoder-cli/src/heap-watch.mjs`） |
| `THINCODER_TUI_WRAPPED` | ④ argv | bin 顶部剥离 `--tui-wrapped`（注入点 = `thincoder-cli/src/tui/wrapped-spawn.mjs`） |
| `THINCODER_TEST_CRASH` / `THINCODER_TEST_TUI_ACTIVE` | ④ argv | bin 崩溃钩 `--test-crash` / `--test-tui-active`（生产零路径） |
| `THINCODER_TEST_CLEANUP_OUT` | ④ argv | bin `--test-cleanup-out=<路径>` → `_setCleanupOutPathForTest`（`thincoder-cli/src/tui/tui-lifecycle.mjs`）（**单半例外**——启动时一次性读点，复位面无消费者） |
| `BENCH_RESULTS_DIR` | ② 参数 / ③ 缝 | `--results-dir <路径>` + `setResultsDir(dir)`（`bench/lib/output.mjs`——③ 缝；读点 `_resultsDir ?? join(BENCH_DIR,"results")`）（**命名 / 成对例外**——`setResultsDir` 兼具参数应用与测试缝〔非纯测试缝〕· 无 `_reset` 半：复位面无消费者；混合形口径见名录后） |
| `BENCH_JUDGE` / `BENCH_PRICES` | ② 参数 / ③ 缝 | `--judge-config <路径>` / `--prices <路径>`（子进程调用面——参数名定值）+ `_setJudgeConfigPathForCheck` / `_resetJudgeConfigPathForCheck`（`bench/lib/judge.mjs`）· `_setPricesPathForCheck` / `_resetPricesPathForCheck`（`bench/lib/prices.mjs`）——进程内面（③ 缝成对）（命名例外） |
| `THINCODER_SMOKE` | ④ argv | `node test/smoke-qwen-thinking.mjs --smoke`（缺 ⇒ skip + 退出 0——发版 glob 收集面零花费） |

**混合形（argv 解析 + 进程内缝）**：CLI 面参数（② / ④ 面）经入口解析后落 **③ 缝**——缝面成对规则同 ③；**单半 / 命名例外逐行标于名录**（现存：`--test-cleanup-out` → 单半；结果目录 `setResultsDir` → 命名例外〔参数应用与测试缝共用〕；bench 判官 / 价格表四缝 `…ForCheck` → 命名例外〔评估工具自身的测试代码面〕）。

**派生消费面（登记）**：`diagnostics.heapSnapshot` / `diagnostics.heapWatch` / `agent.timerWake` / `agent.injectDocs` / `agent.injectMemories` 经**全量 DEFAULTS 派生**进入 `settings` 工具类型面（`thincoder-core/agent-tools/settings.mjs:62`——装载期派生）⇒ 双端可见可写键面随配置键扩张，**实现面零改码**。

**包装门作用域**：包装门（`--tui-wrapped`）改 argv 后**仅直系子进程生效**——TUI 会话内嵌套起多一层包装 + 一份 `tui-stderr-*.log`（无功能破坏）。

**`loadConfig()` 全命令路径**：配置装载现于**全命令路径**运行（含 `--version` / `completion`）——老字段迁移写回 / 告警可能出现（stdout 未污染）。

**关键决策（本面）**：

| # | 决策 | 理由 |
|---|---|---|
| D-CF5 | 自有配置 / 行为输入**只经四类通道**——**禁 env 回退** | 用户裁定「不用环境变量做配置……存量的也直接拔掉」；env = 隐式全局态（不可枚举 / 不可见 / 宿主与子进程串扰）。**补注**：值位显式引用（`${env:VAR}`——§6.3）≠ 通道 ∕ 回退；缺失即抛错，无隐式分支 |
| D-CF6 | 退场后**按原受众定型**：用户面开关 ⇒ 配置键；测试隔离落点 ⇒ 进程内缝；子进程测试钩 ⇒ argv 标志 | 等价能力以最小面承接——用户面仍有可关通道、测试零污染、生产零路径不进命令解析 |

### 6.3 配置值 `${env:VAR}` 引用（消费侧解析）

**机制**：敏感值位可写 `${env:NAME}` 引用替代明文——**落盘不落明文**；解析 = **消费侧（use-time）单源**，叶档 `env-ref.mjs`（住 `thincoder-core/`——已落）：
`resolveEnvRefs`（串）· `resolveEnvRefMap`（键值对象）· 形状适配 `resolveProviderSecrets` ∕ `resolveMcpServerSecrets`。

**生效面（v1 五族）**：`providers[].apiKey` ∕ `providers[].headers.*` ∕ `mcp.servers[].token` 与 `.headers.*` ∕ `.env.*` ∕ `websearch.apiKey` ∕ `embedding.apiKey`——
解析点 = 各消费口（provider 聊天入口 ∕ 清单拉取入口 ∕ MCP 传输建连 ∕ websearch 读点 ∕ embedding 读点 ∕ **会话标题生成径**——`thincoder-core/generate-title.mjs`）——**六处**；

标题径解析抛错落其既有非致命兜底（标题回落 `null`——不破坏回合）；引用串不再按原文上线（401 静默回落消解）。

**语义**：值内嵌与整值同解（`sk-${env:K}` 式）；同一值可含多引用；**变量未设或为空串 = 消费点抛错**（点名变量；无「未设即缺省」回退——不静默字面透传）；
畸形引用（`${env:` 开头不匹配标识符名形）同抛错；非字符串值原样通过。

**与遮蔽面关系**：`settings` 工具 ∕ 面板的敏感谓词（`doc:SETTINGS-TOOL.md:§2.4`）**零改**——引用串同住敏感值位 ⇒ 族遮罩内；
解析产物只在请求 ∕ 建连路径使用——**永不回显、永不回写**（写盘链按磁盘原文；显示面读存储形 = 引用串）。

**与 §6.2 四类通道纪律的关系**：不构成新配置通道——配置键（`config.json`）仍是唯一通道与唯一真源；env 只被用户在值位**显式引用**为凭据来源，无隐式回退分支。

**边界（不做）**：非敏感值位（`baseURL` ∕ `model` ∕ `command` ∕ `args` 等）不解析；无缺省语法（`${env:VAR:-…}`）与转义形；MCP `url` ∕ `command` ∕ `args` 不解析；解析单遍（产物不再二次解析）。

### 6.4 团队登录配置面（`team` 段）

- **键面**：顶层 `team` 段 = `{ server, member{username,name}, label, token }`（形与语义**全文** = `docs/core/design/TEAM.md` §2.1——本档不复制）；派生 provider 条目（`providers[].derived`）= `docs/core/design/PROVIDER.md` §6.25。
- **通道归属**：① 配置键通道（本档 §6.2 名录第 ① 类）——`loadConfig` 归一（形不符 ⇒ null——软失败不阻启动；沿 `proxy` 段先例）；**不入 `DEFAULTS`**（沿 `providers` / `proxy` 先例——settings 工具面零涉 ∥ agent 不可写）。
- **写面**：唯一写者 = `thincoder-core/team.mjs`（已落——登录/退出流程；`writeConfigAtomic` 一次 mutate；端侧零自写盘）。
- **登录态判据**：`team.token`（trim 非空）——= 团队功能开关（口径④）；消费面 = 三端 + 后续团队面（各面设计轮）。
- **边界**：不做 team 段的手工编辑入口（写面 = 登录/退出流程单源）∥ 不做多套登录态并存 ∥ 不写 `DEFAULTS`。

### 6.5 网络工具后端选择键（`websearch.backend` ∥ `fetch.backend`）

**键面**（DEFAULTS 声明 = `thincoder-core/config.mjs`；机制与判据全文 = `TOOLS.md` §6.23——本档只收键面）：

| 键 | 缺省 | 取值 | 消费点 | 回退 |
|---|---|---|---|---|
| `websearch.backend` | `"auto"` | `"auto"` ∥ `"local"` | `thincoder-core/tools/web.mjs`（`websearch.execute` → `web-deepseek.mjs` `backendMode(cfg, "websearch")`） | 非 `"local"` 一律按 `auto`（fail-open，含拼写错） |
| `fetch.backend` | `"auto"` | 同上 | 同上（`fetch.execute` → `backendMode(cfg, "fetch")`） | 同上 |

- **语义**：`local` = 跳过 DeepSeek 后端（`websearch` 仍 Tavily → Bing ∥ `fetch` 仍本地直取——**不是**「只用本地能力」）；`auto` = 有合格 DeepSeek 渠道即优先（资格判据 = `TOOLS.md` §6.23）。
- **通道归属**：① 配置键通道（§6.2）——入 `DEFAULTS` ⇒ `settings` 工具键面自动派生（§6.2「派生消费面」），类型护栏 = 默认值类型（字符串）。
- **敏感面**：两键**非敏感**（不命中 §2.4 谓词；`websearch.apiKey` 照旧为族内唯一敏感叶子）。
- **环境变量面**：零新增（无 env 通道 ∥ 无回退分支——D-CF5 照旧）。
- **边界**：不设顶层 `deepseek` 段；`websearch.deepseek.baseURL` 槽位保留（另批）。

## 7. 关键决策记录

现有决策面见 §3.1 A4 / A5 与 §4.1 第 1–4 行：

| # | 决策 | 理由 |
|---|---|---|
| D-CF1 | 三池统一默认 **4/4/4** + 可配 | 统一心智模型 |
| D-CF2 | advisor 第三键 = **独立读取器**（不与 subagent 域读取器共享） | 键表语义不同（advisor = 评审专用池） |
| D-CF3 | **同 scope 并发守卫**（同 type+scope 有 running 评审 → 拒） | 只查 settled 会放大「并行多实例」歧义；拒文案给指引；异 scope 排队见 `AGENT-LOOP-ASYNC-POOL.md` §6.10 |
| D-CF4 | 模型可见文案**去数字化**（活引用生效上限） | 死数字与配置实值脱节；改插值 / 描述构建时读 |

