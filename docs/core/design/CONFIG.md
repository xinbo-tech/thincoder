# 配置系统（CONFIG）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.1 / §2.12.2 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§8 · 2026-09-14「B 轮并入」）：本板块**同名旧档缺 ⇒ 无新内容并入**（不虚构）——详见 §6 / §8。
> **并入面补记**（2026-09-15 批 5）：配置面机制文本散布旧档——按父侧点名并入 `POOL-CONFIG-UNIFIED`（§6.1）。

## 1. 归属与范围（自本档行内容的路径归纳）

> **W16 现况（2026-09-15）**：配置面两端均已迁核——加载器 / 迁移 / 预设表 = 核单源；VSC 端侧镜像（`src/config-io.mjs` 等 6 档）**已删**，端侧只留消费面（写盘通道 / 监视 / 迁移 glue / provider 访问层）。下表“现体”列 = 当前落点；历史映射（U14 前 / W16 前）见各单元批次档。

| 面 | CLI 档（现体） | VSC 档（现体） |
|---|---|---|
| 装载器 / 默认值 | `thincoder-core/config.mjs`（U14 已迁核） | `thincoder-core/config-io.mjs` + `thincoder-core/config.mjs`（W16 已迁核——端侧镜像 `src/config-io.mjs` 已删；端壳读面 = `thincoder-vscode/src/extension/presets.mjs`） |
| 迁移 | `thincoder-core/config-migrate.mjs`（U14 已迁核） | `thincoder-core/config-migrate.mjs`（W16 已迁核——端侧 VS Code glue = `src/extension/migrate-settings.mjs`） |
| 分段配置 | （内联于核 `config.mjs`） | `thincoder-core/config-presets.mjs`（W16 已迁核——VSC `config-presets.mjs` 已删）· 端壳段 = `config-mcp.mjs` · `embed-config.mjs` · 端侧 consult 读面 = `thincoder-vscode/src/extension/presets.mjs` |
| 写盘面 / 面板 | `src/cli/`（TUI 侧） | `src/extension/settings-panel-write.mjs`（`$schema` 缝供值）· `thincoder-vscode/src/extension/settings.mjs` · `config-watch.mjs` · `migrate-settings.mjs` |
| settings 工具 | `thincoder-core/agent-tools/settings.mjs`（U14 已迁核） | 同核面（W16 已迁核——端侧实例化于 `thincoder-vscode/src/agent/setup.mjs`；类型表 = 核全量 DEFAULTS 派生，A5） |
| 路径展开 | `thincoder-core/expand-home.mjs`（U14 已迁核） | `@thincoder/core/expand-home.mjs`（W4 已迁核） |
| 代理 | `thincoder-core/proxy.mjs`（U14 已迁核） | `@thincoder/core/proxy.mjs`（W10 已迁核） |
| 供应商增删 / 密钥 / 激活 | `thincoder-core/config-io.mjs` 纯持久化面（U14 已迁核）+ `src/cli/setup-wizard.mjs` · `src/tui/model-picker.mjs`（UI 壳） | `thincoder-vscode/src/extension/settings.mjs` · `provider-flows.mjs`（UI 壳）· `presets.mjs`（端侧访问层）；纯持久化面 W16 已取核面 |

**共同基线**：两端**同一文件同一格式**——`~/.thincoder/config.json`（严格 `JSON.parse`，无 JSONC）。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 74 | `proxy.mjs` | 同路径 | 0.7570 · 异 | ② | 进核 | 融合：取 CLI（abort 来源标注）+ VSC 的坏代理串友好报错并入 | 分叉 ＝ 错误形态（VSC 包 try/catch 报「Invalid proxy URI」`src/proxy.mjs:189,236`（迁移期引文——VSC 该档已拆入核） / CLI 抛原生）；配置格式与双开关语义同 | — | S1（建核补齐） |
| 77 | `expand-home.mjs` | 同路径 | 0.2308 · 异 | ② | 进核 | 融合：取一侧、逐字随迁 | 分叉 ＝ 仅注释出处（CLI 引记忆子系统规范档的 §9.3a / VSC 引本端设置档的 §2.7） | — | S1（建核补齐） |
| 79 | `config-migrate.mjs` | 同路径 | 0.0802 · 异 | ② | 进核 | 融合：取并集——核内保留 VSC 的 VS Code 旧设置 / 密钥库迁移遍（`src/config-migrate.mjs:112-184`） | 分叉 ＝ VSC 多一条老用户升级通道（VSC 独有迁移遍，不迁即丢密钥）；模型字段迁移两端同规则（CLI `src/config-migrate.mjs:20-63`） | — | S1（建核补齐） |
| 80 | `config.mjs` | 同路径 | 0.0471 · 异 | ③ | 进核（**同名不同物**：对位 = CLI `config.mjs` ↔ VSC `config-io.mjs`；VSC 的 `config.mjs` 实为模型规格表 ↔ CLI `model-specs.mjs`） | 以 CLI 为准（装载器）+ VSC 的 `$schema` 注入与配置监视面按端注入；默认值 / 校验覆盖面取 CLI 全量表 | 分叉 ＝ 组织结构（VSC 拆 8 档）+ 两处差异（`$schema` 注入 VSC `src/config-io.mjs:108`（as-of 2026-09-29）；VSC 校验表只覆盖 agent/traces `src/agent-tools/settings.mjs:43`）；前提（同一 `~/.thincoder/config.json`、同一 v2 架构）仍成立 | **①②** | S1（建核补齐） （迁移期引文） |
| 87 | `thincoder-core/agent-tools/settings.mjs` | 同路径 | 0.5546 · 异 | ③ | 进核 | 以 CLI 为准（类型表由全量 DEFAULTS 派生 `src/agent-tools/settings.mjs:58`） | 分叉 ＝ 校验覆盖面（VSC 只派生 agent/traces `:43,61` ⇒ `websearch` / `mcp` / `memory` / `embedding` / `shell` 错类型可静默写入两端共享的 `config.json`）；前提（同一 config.json）仍成立 | **①②** | S1（建核补齐） （迁移期引文） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 128 | `src/config.mjs`（装载器 + DEFAULTS）↔ `src/config-io.mjs` | ② | 融合：以 CLI 装载器为准 + `$schema` 注入按端差注入 | 分叉 ＝ 拆分（VSC 拆 8 档）；同一 `~/.thincoder/config.json`、同一 v2 架构 ⇒ 前提成立；**承 §2.5 #80** | —（承 #80） | S1（建核补齐） （迁移期引文——档已迁核） |
| 129 | `src/config.mjs`（`PROVIDER_PRESETS`）↔ `src/config-presets.mjs` | ② | 融合：取一侧（逐条同值） | 分叉 ＝ 拆档；VSC 头注自述「mirrors CLI PROVIDER_PRESETS…双端逐条同值」（`:2,7`）⇒ 前提成立 | — | S1（建核补齐） （迁移期引文——档已迁核） |
| 130 | `src/config.mjs`（consult / mcp / embedding 三段）↔ `src/config-consult.mjs`（W16 已删——端侧 consult 读面现体 = `thincoder-vscode/src/extension/presets.mjs`） · `config-mcp.mjs` · `embed-config.mjs` | ② | 融合：核内单一 DEFAULTS + 三段的端侧消费面按端注入 | 分叉 ＝ 拆档；三段均以同一 `config.json` 为源（VSC `config-consult.mjs:8` 自述「镜像 CLI config.mjs 同规则」）⇒ 前提成立 | — | S1（建核补齐） （迁移期引文） |
| 131 | `src/config.mjs`（写盘面）↔ `src/extension/settings-panel-write.mjs` · `thincoder-vscode/src/extension/settings.mjs` | ② | 融合：核内单一读写 + 面板写面按端注入；**MCP 配置留 VS Code 设置** ＝ 端特有段 | 分叉 ＝ 写入口（VSC 设置面板 / CLI TUI）；写盘产物同一 `config.json`（VSC `thincoder-vscode/src/extension/settings.mjs:2` 自述「Backed by the shared ~/.thincoder/config.json」）⇒ 前提成立 | — | S1（建核补齐） （迁移期引文——档已迁核） |
| 132 | （CLI 无监视面）↔ `thincoder-vscode/src/extension/config-watch.mjs` · `thincoder-vscode/src/extension/migrate-settings.mjs` | ④ | 端特有段（**判词收窄 · 2026-09-29**）：配置监视**宿主接线**（`workspace` 事件——端壳；纯逻辑已上提核 `thincoder-core/config-watch.mjs`）+ VS Code 旧设置 / 密钥库迁移 | 结构性不对称 = **依赖壳能力**（宿主文件监视 / `SecretStorage`）——CLI 无对应宿主面（B17）；依据是「**只在单侧存在**」，**非**「差异」（A9） | — | S1（建核补齐） |
| 177 | `src/cli/setup-wizard.mjs` + `src/tui/model-picker.mjs` ↔ `thincoder-vscode/src/extension/settings.mjs` + `provider-flows.mjs` + `presets.mjs` | ② | 融合：provider 增删 / 密钥 / 激活的**纯持久化函数**取一侧 + UI 壳按端注入 | 分叉 ＝ UI 壳（QuickPick / TUI picker）+ 目录；持久化语义两端同（`config.json` `providers[]` + 单值 `model`——VSC `thincoder-vscode/src/extension/provider-flows.mjs:10` 自述「identical to the CLI」）⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A4 | `config.mjs`（席位 #80；**同名不同物**——对位 = CLI `config.mjs` ↔ VSC `config-io.mjs`） | ①② | 装载器 + 全量 DEFAULTS（agent / memory / shell / embedding / mcp / websearch / traces）；写盘不注入 `$schema` | 装载器在 `config-io.mjs`（同址同格式）；写盘**注入 `$schema`**（`src/config-io.mjs:108`（as-of 2026-09-29））；本端 `config.mjs` 实为模型规格表 | 以 CLI 为准（装载器）+ 端差注入（`$schema` 是否注入 · 配置监视面） | ① 配置文件里会 / 不会多一个 `$schema` 键（仅 VSC 写盘时）；② 键名与默认值口径统一 ⇒ 旧键保留为读入别名（兼容） | **已裁（2026-09-13）· 按建议** |
| A5 | `thincoder-core/agent-tools/settings.mjs`（#87） | ①② | 类型表由**全量** DEFAULTS 派生（`thincoder-core/agent-tools/settings.mjs:58`）⇒ 错类型被拒 | 类型表只派生 agent / traces（`:43,61`）⇒ `websearch` / `mcp` / `memory` / `embedding` / `shell` 的错类型**静默写进两端共享的 `config.json`** | 以 CLI 为准（全量类型校验） | ① VSC 里写错类型会被拒绝（原来会静默落盘，且 CLI 下次读该值会异常）；② 共享 `config.json` 的写入可靠性 | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12.2 搬入 · 逐字；契约类模板见该档 §2.12.1）

> **契约类形态（模板）** → `CORE-UNIFICATION.md` §2.12.1「**配置格式**」行（单一权威源——本档不复制；该表 = 逐类兼容形态模板）。

### 4.1 处置表行（原 §2.12.2）

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 1 | `~/.thincoder/config.json` 键面与默认值（含 CLI-only `agent.goalTurns` / `agent.streamRules`；`agent.compactThreshold` 默认值分叉） | 配置 | 两面 → 核内单一 DEFAULTS | 旧键可读（迁移幂等 + 写回带 `.bak-{ts}`）· CHANGELOG | 两产品 `CHANGELOG.md` + `thincoder-cli/README.md` 键面 + 旧配置读入用例（S2 落） | 已裁（2026-09-13）· 按建议（§2.5.1 A4） |
| 2 | `$schema` 注入与否（VSC 写盘注入 / CLI 不注入） | 配置 | 取一侧 + 登记 | 登记 + README 键面同步 | 同第 1 行 + 配置读写用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A4） |
| 3 | `settings` 工具的类型校验面（错类型是否拒写） | 输出（工具回话） | VSC 由「静默落盘」→「拒绕并报错」（同 CLI） | 登记 + CHANGELOG（工具行为条目） | `SETTINGS-TOOL.md` 同步 + VSC 用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A5） |
| 4 | `agent.engineering` 的写盘范围（VSC 双写共享 `config.json`） | 配置 | 取 CLI（只进会话） | 旧行为撤回 ⇒ CHANGELOG + 登记 | `SESSION.md` / `ENGINEERING-MODE.md` 同步 | 已裁（2026-09-13）· 按建议（§2.5.1 A6） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **对外契约兼容面（S0 登记 / S2 落地）**。
**核内落点行数（R24a · S1 落地收正）** → §2.8.1「核内逐档行数与拆分计划」（本子系统面：`thincoder-core/config.mjs`（带拆分计划）· `thincoder-core/config-io.mjs` · `thincoder-core/config-presets.mjs`）。

## 6. 机制面（B 轮 · 2026-09-14 · 第 3 批）

**结论：本板块同名旧档缺 ⇒ 无新内容并入（不虚构）。**

逐档比对前提：本批的旧档参照面 = `thincoder-cli/docs/{design,requirements}/CONFIG.md`。**实核（as-of 2026-09-14）**：

| 旧档 | 状态 |
|---|---|
| `thincoder-cli/docs/design/CONFIG.md` | **不存在**（CLI / VSC 两树设计 / 需求两侧均无同名档；CLI 树 git 历史零命中） |
| `thincoder-cli/docs/requirements/CONFIG.md` | **不存在**（同上） |

⇒ 本批对 CONFIG 板块**无并入面**——不据其他档代拟机制文本（不虚构）。

**越段发现（只记 · 未处置）**：配置面机制文本**散布于旧档**（非同板块同名档）——`thincoder-cli/docs/design/SETTINGS-TOOL.md`（`settings` 工具面 #87）· `thincoder-cli/docs/design/PROXY.md`（代理面 #74）· `thincoder-cli/docs/_archive/design/POOL-CONFIG-UNIFIED.md`（池配置面）；
家目录展开面（#77）**已随试点批并入**本层 `MEMORY.md` §6.7（指回）；装载器 / 迁移面（#79 / #80）在旧档无专档。⇒ **2026-09-15 批 5**：按父侧点名并入 `POOL-CONFIG-UNIFIED`（§6.1——代理面已于第 3 批落 `docs/core/design/PROXY.md`）；其余（SETTINGS-TOOL / 装载器 / 迁移面）维持触发 = 父侧另派。

### 6.1 并发池配置面（自 `POOL-CONFIG-UNIFIED` 并入 · 2026-09-15 批 5）

来源 = `thincoder-cli/docs/_archive/design/POOL-CONFIG-UNIFIED.md`（130 行 · 旧档一字未改，留参照历史）。**池机制本体**（容量 / 补位 / 调度 / 评审池）住 `AGENT-LOOP-ASYNC-POOL.md` §6.10 / §6.11——本档只收**配置键面**（D2）。

**配置键**：`agent.poolLimits = { engCoder, other, advisor }`——单对象配置键（三池统一，默认 **4 / 4 / 4**）。

| 键 | 消费面 | 校验 / 回退 |
|---|---|---|
| `engCoder` | subagent 域读取器（运行期读） | 正整数 ≥1 生效；非法 / 缺省回退 4 |
| `other` | 同上 | 同上 |
| `advisor` | **独立** advisor 读取器（每 launch 读） | 合法 ≥1 整数生效；非法 / 缺省回退 4 |

- **双读取器独立不共享**（键表语义不同）：subagent 两键 = `thincoder-core/agent-tools/subagent-async.mjs:94`（`poolLimitsFor`）；advisor 第三键 = `thincoder-core/agent-tools/advisor-async.mjs:178`（`resolveAdvisorPoolLimit`）。
- **默认值四源同改**（缺一即漂移）：DEFAULTS（`thincoder-core/config.mjs:63`）↔ 运行时常量（`thincoder-core/agent-tools/subagent-async.mjs:55` · `thincoder-core/agent-tools/advisor-async.mjs:166`）↔ 耦合锁（`thincoder-cli/test/config-pool.test.mjs` ·（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  `thincoder-vscode/test/config-pool.test.mjs`）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
- **生效时机**：变更下回合生效；运行期读取点各自校验（非法键回退默认 + 告警）。
- **界面入口**：CLI `/config` →「并发池」子菜单（`thincoder-cli/src/tui/cmd-config.mjs:245`–`:273`——三域读写 + 主菜单 / view 摘要）；VSC 设置面板并发池三域（`thincoder-vscode/src/extension/settings-panel-write.mjs:94` 白名单 · `thincoder-vscode/src/extension/settings.mjs:176` 回退显 4/4/4——W16 行号重核）。
- **向后兼容**：旧两键配置值零迁移（`advisor` 缺省 ⇒ 回退 4）；非法值不落盘回退；VSC 面板白名单全非法 ⇒ 删整键回退默认（语义不变）。
- **模型可见文案去数字化**：advisor 工具描述与拒文案报**生效上限**（`thincoder-core/agent-tools/advisor.mjs:49` · `thincoder-core/agent-tools/advisor-async.mjs:266`）。
- **同 scope 评审并发守卫**（同批用户裁①）：容量守卫 ⇄ 同 scope 守卫**两关独立**——机制本体见 `AGENT-LOOP-ASYNC-POOL.md` §6.10（本档不复制）。
- **范围边界（旧档承接）**：评审轮次**无机械上限**（cap 已撤——见 `ADVISOR-CONVERGENCE.md` §3 · 2026-09-18 用户裁定）；**排队口径 = 异 scope 入队 / 同 scope 仍拒**（2026-09-16 批 8 ED-4 裁定——见 §7 D-CF3 与 `AGENT-LOOP-ASYNC-POOL.md` §6.10）；engCoder / other 两域语义不变（本批只界面 / 一致性 / 第三键）；全仓注释大扫 = 旧档挂 TODO 观察项（随两仓合并面收敛，不另立）。

### 6.2 配置通道纪律与自有环境变量面（2026-09-27 批 · 环境变量配置面拔除）

**纪律（单源 · 全仓适用）**：自有配置 / 行为输入**只经四类通道**——不得经环境变量（含「未设即缺省」与「旧名兼容读」两类回退分支）。

**值位显式引用 ≠ 配置通道（2026-09-29）**：敏感值位的 `${env:VAR}` 引用（§6.3）**不构成配置通道**——配置键（`config.json`）仍是唯一真源；env 只在用户于值位**显式引用**时充当凭据来源，无隐式回退分支（缺失 ∕ 空串即抛错——§6.3）。

| # | 通道 | 形态 | 适用面 |
|---|---|---|---|
| ① | **配置键** | `~/.thincoder/config.json` 键（DEFAULTS 声明 + `loadConfig` 合并；非法 / 缺失回退默认） | 用户面开关（CLI / VSC 共用同档） |
| ② | **CLI 参数** | 工具自身 CLI 契约（`bench/*.mjs --<opt>`） | 无 `config.json` 面的工具（bench 族） |
| ③ | **进程内 setter 缝** | `_set<名>ForTest(v)` / `_reset<名>ForTest()` 成对（模块级 `let _x = null`；读点 `_x ?? 默认`）· **命名 / 成对例外 = 逐行标于名录** | 测试隔离落点（日志 / 轨迹 / bench 结果目录 / 判官档 / 价格表） |
| ④ | **显式参数门** | 子进程 argv 内部标志（bin 顶部自剥离，不进命令解析）/ 直跑脚本参数（缺 ⇒ skip + 提示，退出 0） | 子进程测试钩 / 冒烟 / 嵌套实例 |

**缝形态先例**：`thincoder-core/config-io.mjs:37-42`（`_setConfigPathForTest` / `_resetConfigPathForTest` + 模块级 `_configPath`）。

**写门**：`NODE_TEST_CONTEXT`（node:test 自设——外部约定，不在拔除面）下，日志 / 轨迹**只写显式缝指向的落点**；未设缝 ⇒ 跳过写盘（不污染真实 `~/.thincoder`）。

**argv 门的副作用免害**：显式 argv 标志不受宿主 env 透传影响——旧 env 门的「宿主 TUI 会话把门透传给套件 ⇒ 假红」类问题随拔除消失。

**保留集 = 外部约定**（非「我们的配置」——不属本纪律、不拔）：`NODE_TEST_CONTEXT` · `ELECTRON_RUN_AS_NODE` · `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` / `NO_PROXY` 一族 · CI 与 `npm_*` 系 · 系统原语（`HOME` / `USERPROFILE` / `LOCALAPPDATA` / `PATH` / `LC_ALL` / `LANG`）· 外部工具契约（`GIT_EDITOR` · `VSCE_PAT` / `OVSX_PAT`）。

**自有面名录（拔除后形 · 同批）**：

| 旧 env | 现通道 | 落点 |
|---|---|---|
| `THINCODER_LOG_DIR` | ③ 缝 | `thincoder-core/log.mjs`：`_setLogsDirForTest` / `_resetLogsDirForTest`（写门 = `NODE_TEST_CONTEXT` ∧ 未设缝） |
| `THINCODER_TRACES_DIR` | ③ 缝 | `thincoder-core/traces/trace-store.mjs`：`_setTracesRootForTest` / `_resetTracesRootForTest`（同门形） |
| `THINCODER_HEAP_SNAPSHOT` | ① 键 | `diagnostics.heapSnapshot`（默认 `false`——2026-09-30 采集收网批：隐私默认关〔traces D-TR6 同族〕；桌面端运行期热读）→ `prepareCrashReporting({ heapSnapshot })`（`thincoder-cli/src/crash-reports.mjs`） |
| `THINCODER_HEAP_WATCH` | ① 键 | `diagnostics.heapWatch`（默认 `true`）→ `startHeapWatch({ enabled })`（`thincoder-cli/src/heap-watch.mjs`） |
| `THINCODER_TUI_WRAPPED` | ④ argv | bin 顶部剥离 `--tui-wrapped`（注入点 = `thincoder-cli/src/tui/wrapped-spawn.mjs`） |
| `THINCODER_TEST_CRASH` / `THINCODER_TEST_TUI_ACTIVE` | ④ argv | bin 崩溃钩 `--test-crash` / `--test-tui-active`（生产零路径） |
| `THINCODER_TEST_CLEANUP_OUT` | ④ argv | bin `--test-cleanup-out=<路径>` → `_setCleanupOutPathForTest`（`thincoder-cli/src/tui/tui-lifecycle.mjs`）（**单半例外**——启动时一次性读点，复位面无消费者） |
| `THINCODER_DEBUG_RENDER` · `THIN_DEBUG_BODY` · `ADVISOR_DEBUG` | 退场 | 调试开关整体删除（能力收缩已披露） |
| `BENCH_RESULTS_DIR` | ② 参数 / ③ 缝 | `--results-dir <路径>` + `setResultsDir(dir)`（`bench/lib/output.mjs`——③ 缝；读点 `_resultsDir ?? join(BENCH_DIR,"results")`）（**命名 / 成对例外**——`setResultsDir` 兼具参数应用与测试缝〔非纯测试缝〕· 无 `_reset` 半：复位面无消费者；混合形口径见名录后） |
| `BENCH_JUDGE` / `BENCH_PRICES` | ② 参数 / ③ 缝 | `--judge-config <路径>` / `--prices <路径>`（子进程调用面——参数名定值）+ `_setJudgeConfigPathForTest` / `_resetJudgeConfigPathForTest`（`bench/lib/judge.mjs`）· `_setPricesPathForTest` / `_resetPricesPathForTest`（`bench/lib/prices.mjs`）——进程内面（③ 缝成对） |
| `THINCODER_SMOKE` | ④ argv | `node test/smoke-qwen-thinking.mjs --smoke`（缺 ⇒ skip + 退出 0——发版 glob 收集面零花费） |
| `DOC_CHECK_NESTED` | 退场 | `node test/doc-check.test.mjs --nested`（`--nested` 门）随 2026-09-28 测试树全清令随档退场——常驻重建挂台账 #590 面 |
| `FAKE_MCP_READY_FILE` | 退场 | 孤儿死块删除（`thincoder-vscode/test/fixtures/fake-mcp-server.mjs`） （迁移期引文） |

**混合形（argv 解析 + 进程内缝）**：CLI 面参数（② / ④ 面）经入口解析后落 **③ 缝**——缝面成对规则同 ③；**单半 / 命名例外逐行标于名录**（现存：`--test-cleanup-out` → 单半；结果目录 `setResultsDir` → 命名例外〔参数应用与测试缝共用〕）。

**派生消费面（登记 · 2026-09-27）**：`diagnostics.heapSnapshot` / `diagnostics.heapWatch` / `agent.timerWake`（timer-wake 批）经**全量 DEFAULTS 派生**进入 `settings` 工具类型面（`thincoder-core/agent-tools/settings.mjs:62`——装载期派生）⇒ 双端可见可写键面随配置键扩张，**实现面零改码**。

**包装门作用域（实施实证 · 2026-09-27）**：包装门（`--tui-wrapped`）改 argv 后**仅直系子进程生效**（旧 env 门随宿主 env 透传、及于全后代）——TUI 会话内嵌套起多一层包装 + 一份 `tui-stderr-*.log`（无功能破坏）。

**`loadConfig()` 全命令路径（实施实证 · 2026-09-27）**：配置装载现于**全命令路径**运行（含 `--version` / `completion`）——老字段迁移写回 / 告警可能出现（stdout 未污染）。

**关键决策（本面）**：

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-CF5 | 自有配置 / 行为输入**只经四类通道**——**禁 env 回退** | 用户裁定「不用环境变量做配置……存量的也直接拔掉」；env = 隐式全局态（不可枚举 / 不可见 / 宿主与子进程串扰）；否决「保留旧名兼容读」（= 存量不拔）。**2026-09-29 补注**：值位显式引用（`${env:VAR}`——§6.3）≠ 通道 ∕ 回退；缺失即抛错，无隐式分支 |
| D-CF6 | 退场后**按原受众定型**：用户面开关 ⇒ 配置键；测试隔离落点 ⇒ 进程内缝；子进程测试钩 ⇒ argv 标志 | 等价能力以最小面承接——用户面仍有可关通道、测试面零污染、生产零路径不进命令解析；否决「一律升为配置键」（测试钩进产品配置面 = 面膨胀） |

### 6.3 配置值 `${env:VAR}` 引用（消费侧解析 · 2026-09-29 provider-config-family 批 · 台账 #57）

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

### 6.4 团队登录配置面（`team` 段——2026-10-10 B1 批 · 台账 #1212）

- **键面**：顶层 `team` 段 = `{ server, member{username,name}, label, token }`（形与语义**全文** = `docs/core/design/TEAM.md` §2.1——本档不复制）；派生 provider 条目（`providers[].derived`）= `docs/core/design/PROVIDER.md` §6.25。
- **通道归属**：① 配置键通道（本档 §6.2 名录第 ① 类）——`loadConfig` 归一（形不符 ⇒ null——软失败不阻启动；沿 `proxy` 段先例）；**不入 `DEFAULTS`**（沿 `providers` / `proxy` 先例——settings 工具面零涉 ∥ agent 不可写）。
- **写面**：唯一写者 = `thincoder-core/team.mjs`（拟新增——登录/退出流程；`writeConfigAtomic` 一次 mutate；端侧零自写盘）。
- **登录态判据**：`team.token`（trim 非空）——= 团队功能开关（口径④）；消费面 = 三端 + 后续团队面（各面设计轮）。
- **边界**：不做 team 段的手工编辑入口（写面 = 登录/退出流程单源）∥ 不做多套登录态并存 ∥ 不写 `DEFAULTS`。

## 7. 并入的关键决策记录（含否决备选）

现有决策面见 §3.1 A4 / A5 与 §4.1 第 1–4 行。**2026-09-15 批 5 并入**（自 `POOL-CONFIG-UNIFIED`）：

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-CF1 | 三池统一默认 **4/4/4** + 可配 | 统一心智模型；否决「advisor 保持旧限 2」（旧档勘察证：100% 仓内实现——无平台面） |
| D-CF2 | advisor 第三键 = **独立读取器**（不与 subagent 域读取器共享） | 键表语义不同（advisor = 评审专用池）；否决「并入同一遍历表」（subagent 调度路径误消费）。**2026-09-16 批 8 收正**：理由句中「advisor 无排队」一义已随 D-CF3 修订退场——独立读取器决策本身不变 |
| D-CF3 | **同 scope 并发守卫**（同 type+scope 有 running 评审 → 拒） | 只查 settled 会放大「并行多实例」歧义；拒文案给指引；否决「**同 scope** 排队」（同 scope 续审 stale）——**异 scope 排队** 2026-09-16 批 8 已采纳（`AGENT-LOOP-ASYNC-POOL.md` §6.10） |
| D-CF4 | 模型可见文案**去数字化**（活引用生效上限） | 死数字与配置实值脱节；改插值 / 描述构建时读 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

**不适用**——本板块无同名旧档（无 (d) 类叙述可登记）。

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| `thincoder-cli/docs/design/SETTINGS-TOOL.md`（+ 同名需求档） | `settings` 工具面机制（#87） | 非同板块同名档——本批参照面不含 ⇒ **越段登记**——触发 = 父侧另派（按「配置面」点名） |
| `thincoder-cli/docs/design/PROXY.md` | 代理面机制（#74） | **已落** `docs/core/design/PROXY.md`（第 3 批——本批指态收正） |
| `thincoder-cli/docs/_archive/design/POOL-CONFIG-UNIFIED.md` | 池配置面 | **已并入**本档 §6.1（2026-09-15 批 5——旧档一字未改，留参照历史） |
| `thincoder-cli/docs/design/MEMORY.md` §9（家目录展开） | 展开器契约（#77） | **已并入**本层 `docs/core/design/MEMORY.md` §6.7（试点批）——指回；不重复（D2） |

## 变更记录

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #74 / #77 / #79 / #80 / #87 / #128–#132 / #177 · §2.5.1 A4 / A5 · §2.12.1「配置格式」类 · §2.12.2 第 1–4 行）；**语义零改**，行号沿用原编号。
- 2026-09-14（S1 收口轮）：§5 补**核内落点行数**指针（`config.mjs` · `config-io.mjs` · `config-presets.mjs`——§2.8 新增小节）。
- 2026-09-14（**B 轮并入 · 第 3 批**）：§6 **机制面 = 同名旧档缺**（`thincoder-cli/docs/{design,requirements}/CONFIG.md` 均不存在——两产品树实核）⇒ 无并入内容（不虚构）；§7 无新增决策；§8 登记配置面机制文本散布于旧档（越段发现 + MEMORY §6.7 指回）；首部加机制面指针一行。
- 2026-09-15（**迁移批 · 第 5 批 · 并入 · eng-designer**）：新增 §6.1 **并发池配置面**（自 `thincoder-cli/docs/_archive/design/POOL-CONFIG-UNIFIED.md` 并入——配置键表 / 双读取器 / 默认四源 / 界面入口 / 兼容面；机制本体指 `AGENT-LOOP-ASYNC-POOL.md` §6.10）；§7 补 D-CF1–D-CF4；§8.2 两行指态收正（PROXY 已落 / POOL 已并入）。
- 2026-09-15（**W16 实施轮 · eng-coder**）：§1 归属表改「现体」双列（加载器 / 迁移 / 预设 / settings 工具 / 供应持久化面 = 核单源；VSC 端侧镜像 6 档已删——端壳保留写盘通道 / 监视 / 迁移 glue / provider 访问层）+ W16 现况注；§2.2 #130 行注 W16 端侧 consult 读面现体；§6.1 界面入口行号重核（`settings-panel-write.mjs:94` · `thincoder-vscode/src/extension/settings.mjs:176`）。
- 2026-09-16（**ENGINE-DEBT 批 8 · ED-4 决策面收正 · eng-designer**——承 `docs/batches/2026-09-16-engine-debt.md` §1 裁定 ④）：§7 **D-CF2 理由句 / D-CF3 否决句**按「评审池满 → 异 scope 入队」收正（决策本体不变——独立读取器 / 同 scope 守卫；机制落 `AGENT-LOOP-ASYNC-POOL.md` §6.10/§6.11）。
- 2026-09-16（**批 8 ENGINE-DEBT · 补充收正 · eng-designer**）：§6.1 范围边界句「『评审不排队』语义不变」→「**表述已废**」（承 ED-4——与 §7 D-CF3 · `AGENT-LOOP-ASYNC-POOL.md` §6.10 对齐；残留旧语义清理）。
- 2026-09-20（**卫生族批 · 台账 #138 · eng-designer**）：首部机制面节区改 `§6–§8` + 历史节号指称清理（行数规则废除批残留）；设计源 = `docs/batches/2026-09-20-hygiene-sweep-batch.md` §2。
- 2026-09-25（**hygiene-ab 批 · 文档面实施轮 · eng-designer**——承 `docs/batches/2026-09-25-hygiene-ab.md` §2 · 台账 #229）：§6.1 范围边界句「『评审不排队』表述已废」**转裁定语**（现文 = 「排队口径 = 异 scope 入队 / 同 scope 仍拒（2026-09-16 批 8 ED-4 裁定）」——D8 修订式标记清理）。**语义零改**。
- 2026-09-27（**env-config-purge 批 · eng-designer**——承 `docs/batches/2026-09-27-env-config-purge.md` §1.5）：新增 **§6.2 配置通道纪律与自有环境变量面**（四类通道表 + 保留集 + 自有面名录 + D-CF5 / D-CF6）；机制句 = 本档单源；§6.2 补**实施实证两注**（argv 门作用域 / `loadConfig()` 全命令路径——承本批 §5，收口轮）。
- 2026-09-27（**env-config-purge 批 · 设计评审轮 1 修正轮 · eng-designer**——承 `docs/batches/2026-09-27-env-config-purge.md` §3 轮次 1 发现 2 / 7）：③ 形态列补**命名 / 成对例外 = 逐行标于名录**；名录逐行标例外（`--test-cleanup-out` 单半 · `setResultsDir` 命名例外）+ 
  `BENCH_JUDGE` / `BENCH_PRICES` 补 `_reset` 对（去「若既有等价参数存在则复用」条件句）；名录后补**混合形口径**段 + **`settings` 派生消费面登记**（`thincoder-core/agent-tools/settings.mjs:62`）。**零语义**：四类通道 / D-CF5 / D-CF6 零改。
- 2026-09-27（**timer-wake 批 · 设计评审轮 1 修正轮（fix）· eng-designer**——承 `docs/batches/2026-09-27-timer-wake.md` §3 轮次 1 发现 4 · 父侧裁定）：§6.2 派生消费面登记行**扩面**——键列补 `agent.timerWake`（`thincoder-core/config.mjs` DEFAULTS `agent` 段；与 `diagnostics` 两键同经 `settings` 工具类型面装载期派生）。**零新语义**（登记面补列）。
- 2026-09-29（**doc-sync-residuals 批 · 设计面残留收正轮 · eng-designer**——承 `docs/batches/2026-09-28-tech-debt-closeout.md` §2.9 ∕ 收正行 · `config-watch` 上提）：§2.2 #132 行收正——路径补仓根全形（端壳两档——`doc-check` 悬空 −1）+ **端特有段判词收窄**（配置监视纯逻辑已上提核 `thincoder-core/config-watch.mjs`；端特有 = 宿主接线 + 迁移面）。**零新语义**。
- 2026-09-29（**doc-sync-carryover 批 · 文档随动族收正轮 · eng-designer**——承 `docs/batches/2026-09-29-doc-sync-carryover.md` §1 · 台账 #647）：§6.2 自有面名录 `DOC_CHECK_NESTED` 行收正——随档退场（`--nested` 门随 2026-09-28 测试树全清令无消费者；常驻重建挂台账 #590 面）。**零新语义**。
- 2026-09-29（**provider-config-family 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-provider-config-family.md` · 台账 #57）：新增 **§6.3 配置值 `${env:VAR}` 引用（消费侧解析）**——机制 ∕ 生效面五族 ∕ 语义（缺失即抛错）∕ 与遮蔽面关系 ∕ 与 §6.2 通道纪律的关系 ∕ 边界；
  机制单源 = 本节（`doc:SETTINGS-TOOL.md` D-ST16 与 `doc:MCP.md` §6.5 改指）。**零新语义**（= 台账 #57 既定设计与 settings 脱敏批候选 C1 的成文）。
- 2026-09-29（**provider-config-family 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承 `docs/batches/2026-09-29-provider-config-family.md` §3 轮次 1 发现 1 ∕ 2）：§6.3 解析点集**五处 → 六处**（补「会话标题生成径」+ 标题径非致命兜底句）；§6.2 补**值位显式引用 ≠ 配置通道**边界句 + D-CF5 补注（与 §6.3 双向指）。**零新语义**（= 评审发现的直接导出项）。
- 2026-09-30（**doc-sweep 批 · 行宽收正 · eng-designer**——承 `docs/batches/2026-09-30-doc-sweep.md` §2 · 台账 #664）：provider-config-family 设计轮条（原单行 332 字符）**折行**（仅换行 ∕ 语义零改——doc-check 行宽闸收正）。**零新语义**。
- 2026-09-30（**采集收网批 · eng-designer**——承 `docs/batches/2026-09-30-heap-snapshot-switch.md` §2）：§6.2 名录 `THINCODER_HEAP_SNAPSHOT` 行**默认值收正**（`true` ⇒ `false`——采集隐私默认关〔D-TR6 同族〕；桌面端运行期热读＝本批新机制）。**四类通道 ∥ D-CF5 ∥ D-CF6 零改**。
- 2026-10-10（**team-login-client-access 批（B1）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §1 · 台账 #1212）：新增 **§6.4 团队登录配置面（`team` 段）**——键面指针（全文 = `docs/core/design/TEAM.md` §2.1）∥ 通道归属（① 配置键 ∥ 不入 `DEFAULTS`）∥ 写面单源 ∥ 登录态判据（口径④）；机制单源 = `TEAM.md`（本档不复制——D2）。**四类通道 ∥ D-CF5 ∥ D-CF6 零改**。
