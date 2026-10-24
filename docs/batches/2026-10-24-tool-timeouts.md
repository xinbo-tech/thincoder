# 2026-10-24 · 工具面三处超时与熔断：404 不熔断 · 浏览器启动窗可配 · advisor 超时可热改
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = Gitee IKQ2KZ（404 误熔断 Web 后端）· IKP6ZI（浏览器启动窗 12s 写死）· IKJPNU（advisor timeoutMs 热应用不生效）。用户 2026-10-24 17:31 要求并行处理。
> 台账 = #1751（归批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（三件目标形与判据已落；需求档 W4 改法待主 agent 落（代码不得先于需求档）；doc_check 门 = ERROR（引擎版本新于进程启动，需重启会话复跑））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 本批条目（覆盖三个 Gitee 项 · 台账 #1750）

| # | 来源 | 覆盖需求条目 | 设计档落点 |
|---|---|---|---|
| ① | IKQ2KZ | `docs/core/requirements/TOOLS.md` §4.9 W4（改法见下「需求档改法」——**主 agent 落**） | `docs/core/design/TOOLS.md` §6.23 ④（错误矩阵）· ⑨ D-WB3 · ⑦ T7/T18 · 验收回指 W4 |
| ② | IKP6ZI | `docs/core/requirements/BROWSER-TOOL.md` F-BT16 ∥ N-BT5（既有条目已覆盖「有界不悬挂 ∥ 启动失败可读」——本批只动预算数值与可配面，不改需求语义） | `docs/core/design/BROWSER-TOOL.md` §2.4 ∥ §2.6 ∥ §2.9 ∥ §8 |
| ③ | IKJPNU | `docs/core/requirements/SETTINGS-TOOL.md` F-ST2（热应用语义）· `docs/core/requirements/AGENT-PARAMS.md` 评审墙钟 | `docs/core/design/AGENT-PARAMS.md` §2 · §6.1 · `docs/core/design/SETTINGS-TOOL.md` §2.3 |

**不在本批**：Tavily / Bing 腿语义 · MCP 搜索面 · 浏览器动作预算表其余行 · `config.mjs` 拆分（TOOLS.md §6.23 ⑧ 已登记软线超限与拆批计划）· 除 advisor 外的其余 promoted 视图（`provider` / `providersList` / `proxy`——见「上抛项」）。

### 需求档改法（W4——代码不得先于需求档落地）

**改前**（`docs/core/requirements/TOOLS.md:233`，实读）：

> 软着陆：401 / 402 / 403 / 404 ⇒ 本会话**熔断** DeepSeek 后端（不再反复烧请求）、回落 Tavily → Bing（fetch：本地直取）；408 / 429 / 5xx ⇒ 退避重试一次后回落；任何路径工具调用不因后端失败而失败（有兜底）

**改后**（建议逐字落）：

> 软着陆：401 / 402 / 403（凭据 ∥ 计费 ∥ 策略类拒绝）⇒ 本会话**熔断** DeepSeek 后端（不再反复烧请求），熔断**限时 10 分钟**、到期自动重新放行（改完 key 无需重启会话）；回落 Tavily → Bing（fetch：本地直取）。**404 不熔断**——404 = 本次抓取的目标页面不存在，不是凭据失效，只影响本次调用（fetch 回落本地直取；search 腿不受影响）；408 / 429 / 5xx ⇒ 退避重试一次后回落；任何路径工具调用不因后端失败而失败（有兜底）

**判据对比**（改前 → 改后）：

| 输入 | 改前行为 | 改后行为 |
|---|---|---|
| fetch 腿收到 404 | 熔断；本会话后续 search 零请求 | **不熔断**；本次 fetch 回落本地直取；后续 search 仍发 DeepSeek |
| search 腿收到 401 | 熔断（永久，至进程结束） | 熔断，**10 分钟后自动解封**；解封后再请求照常发 |
| 401 后 10 分钟内再调 | 零请求、直回落 | 零请求、直回落（不变） |

**同档第二处**（`docs/core/requirements/TOOLS.md:254` 验收方向 ④）改前「401 / 404 腿 ⇒ 熔断回落且工具调用成功」→ 改后「401 腿 ⇒ 熔断回落且工具调用成功、10 分钟后解封；404 腿 ⇒ 仅本次回落、不熔断（后续 search 仍发 DeepSeek）」。

**依据（为什么这是需求缺陷而非实现缺陷）**：同档 W3（`:232`）已把 404 判为**逐 URL** 条件——「403（安全策略）/ 404（无可提取内容）/ 429 / 5xx ⇒ 回落本地直取」；W4 又把 404 列入熔断名单 ⇒ **同档两条互斥**。设计侧选 W3 口径（404 是页面事实，不是凭据事实），D-WB3 原「代价在册」一条随之作废。

### ① 404 不熔断 + 熔断限时

**现状**（`thincoder-core/tools/web-deepseek.mjs` 实读）：`:30` `TRIP_STATUS = new Set([401, 402, 403, 404])`；`:38` `let _breaker = new WeakSet()`；`:107` 命中 `TRIP_STATUS` ⇒ `trip(agent)`；`:143`/`:157` 已熔断 ⇒ `{status:"failed", reason:"breaker open"}`，transport 零调用。`WeakSet` 无时间维度 ⇒ 唯一解封口 = 进程结束或测试缝 `_resetDeepseekTransportForTest()`（`:42`）。

**目标形**：
1. `TRIP_STATUS = new Set([401, 402, 403])`——404 退化为「本次失败」，与其他未列 4xx 同路（`:338` 矩阵行「400 ∥ 413 ∥ 其它未列 4xx」）。
2. 熔断容器 `WeakMap<agent, expiresAtMs>`；`BREAKER_TTL_MS = 600_000`（10 分钟）。`tripped(agent)` 判 `expiresAt > now()`；到期即 `delete` 并放行。`trip(agent)` 写 `now() + BREAKER_TTL_MS`。
3. 时钟缝 `_setDeepseekClockForTest(fn)`（缺省 `Date.now`），`_resetDeepseekTransportForTest()` 同时复位时钟——与既有「成对两半、无第三缝」纪律同形（TOOLS.md §6.23 ⑦）。
4. 熔断日志行增 `ttlMs`；不新增日志级别（NW3 口径不变）。

**判据**（机判）：
- `fetch` 腿 404 ⇒ 返回 `failed`、transport 恰 1 次；同一 `agent` 随即 `search` ⇒ transport **再 1 次**（未熔断）。
- `search` 腿 401 ⇒ `failed`；同 agent 再调 ⇒ transport **0 次**；把时钟拨过 600 s ⇒ 再调 transport **1 次**；拨回未到期 ⇒ 0 次。
- 401 / 402 / 403 三码逐码成行；404 在 `TRIP_STATUS` 中零命中。

**不做**：不按工具分域（search ∥ fetch 共享熔断域——账号级信号，D-WB3 保留）· 不引入指数退避 / 半开探测（TTL 到期即全开，够用且零状态机）。

### ② 浏览器启动窗可配

**现状**：`thincoder-core/browser/launch.mjs:34` `export const START_TIMEOUT_MS = 12_000`；`:148` `timeoutMs = START_TIMEOUT_MS` 缺省；`:166-168` 超时前 `killBrowser(child)` 再抛错（**已修，不在本批**）；`:107` 启动前全进程枚举（`Get-CimInstance` / `ps`）仍在关键路径上，重负载机器上可达数秒——12 s 帽由此被吃掉。

**目标形**：
1. 缺省放宽：`START_TIMEOUT_MS = 25_000`（重负载 Windows 实测 13–17 s，留 ≈8 s 余量）。
2. env 覆盖：新增 `browserStartTimeoutMs(env = process.env)`——读 `BROWSER_START_TIMEOUT_MS`，`Number.isFinite && > 0` 才采纳，钳 `[2_000, 30_000]`；非法 ∥ 越界 ⇒ 回落缺省。命名沿同档既有逃生口 `BROWSER_PATH`（`:47`）。
3. `launchBrowser` 缺省参数改 `timeoutMs = browserStartTimeoutMs()`（显式入参优先——既有探针 `timeoutMs: 4000` 零改）。
4. 上限 30 s 的理由：`navigate` 动作预算 45 s（`thincoder-core/browser/queue.mjs:15`）含会话自启 ⇒ 启动窗必须留出导航 + 快照的余量；要更长的时间窗，走动作级 `timeoutMs` 覆盖（硬上限 120 s，`:33`）。

**回落的诚实性**：非法 env 值静默回落缺省——业务结果不变（启动成功 ∥ 失败都带可读原因），只是用户没得到自己想要的时间窗；env 拼错无权威读取面可汇报，故不加告警（按「fallback 合法性」判据：删掉该回落会让「浏览器根本起不来」暴露给每个用户，而它恢复的是技术性抖动，不是业务判定）。

**判据**（机判）：`browserStartTimeoutMs({})` ⇒ 25000；`{BROWSER_START_TIMEOUT_MS:"40000"}` ⇒ 30000（钳顶）；`"1500"` ⇒ 25000（钳底不采纳 ⇒ 缺省？**否**：钳底 2000，1500 落钳底 2000）——以用例表为准；`"abc"` ∥ `"0"` ∥ `"-5"` ⇒ 25000；`launchBrowser` 不传 `timeoutMs` 且 env 无值 ⇒ 错误句含 `within 25s`（`:168` 插值现值）。

### ③ advisor `timeoutMs` 热应用

**现状**：`thincoder-core/advisor/loop.mjs:103-104` 读 `agent.config?.advisor?.timeoutMs`（**运行读面 = promoted 视图**）；`thincoder-core/config.mjs:354` `merged.advisor = { ...merged.agent.advisor }`——**只在 `loadConfig` 那一次建副本**；`thincoder-core/agent-tools/settings.mjs:300` 只 `setKeyPath(config, "agent.advisor.timeoutMs", v)`（写 nested）⇒ promoted 视图停在装载那一刻的值。`settings.mjs:305` 回显 `— persisted + hot-applied（运行中已生效）` 因此在 advisor 族上不成立。

**根因定位（与任务书三条的差异，需上抛知会）**：读面（`loop.mjs:103`）**不是缺陷**——promoted 视图是 advisor 的运行读面，同族读者还有 `advisor/run.mjs:27` ∥ `agent/completion.mjs:129` ∥ CLI `status-line.mjs:49` ∥ `cmd-advisor.mjs:14`（**只写 promoted**）；会话恢复也写 promoted（`session-lifecycle.mjs:138`）。真正的缺口 = **写面没有把 promoted 视图与 nested 同步**。因此本批**不改 `loop.mjs`**，改 `settings set`：写入后按 `loadConfig` 同一条规则重derive promoted 视图。

**目标形**：
1. `thincoder-core/config.mjs` 导出 `promoteAgentViews(config)`——把 `agent.advisor` 合入 `config.advisor`（`{ ...config.advisor, ...config.agent.advisor }`，保留只存在于运行面的会话级键如 `guard`）；`loadConfig` 内部改调它（行为逐字不变：装载时 `config.advisor` 为空 ⇒ 等价于整体复制）。
2. `settings.mjs` set 路径（含 `null` 删除腿）在写内存后调 `promoteAgentViews(config)`；`agent.advisor` 整体赋值腿 = 整体替换 `config.advisor`（显式整段写入语义）。`null` 删除腿 = 在 promoted 视图上同步删同一子键（否则旧值留在读面上，正是本缺陷）。
3. 文档面同步：`AGENT-PARAMS.md:18` 的「⇒ `agent.config.advisor.timeoutMs` 天然可见」一句**删除**（它是错的：只在 `loadConfig` 那一瞬成立）；改为「写面负责同步」的不变式 + 读取链坐标。`SETTINGS-TOOL.md` §2.3 增一条「promoted 视图必须在写入点同步」的机制句。

**判据**（机判）：
- 假体 `agent.config = { agent: { advisor: { timeoutMs: 1000 } }, advisor: { timeoutMs: 1000 } }` ⇒ `settings set agent.advisor.timeoutMs 900000` ⇒ 内存 `config.agent.advisor.timeoutMs === 900000` **且** `config.advisor.timeoutMs === 900000`；`list` 两行同值。
- 同一假体喂 `_runAdvisorToolLoop`（`seams.now` 走到 700 s）⇒ 不返回 timeout 尾；改前形态（promoted 停 1000）⇒ 返回 timeout 尾（红/绿对照对）。
- `settings set agent.advisor.timeoutMs null` ⇒ 两个视图都不再有该键。
- `config.advisor.guard = true` 而 `agent.advisor` 无 `guard` ⇒ 一次 `promoteAgentViews` 后 `guard` 仍在（会话级键不被吞）。

### 受影响文件（现况 = 本轮实读行数；Δ 为设计预期）

| 档 | 现况 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/tools/web-deepseek.mjs` | 172 | +12 | `TRIP_STATUS` 去 404 · `WeakMap` + TTL · 时钟缝 · 日志 `ttlMs` |
| `thincoder-core/browser/launch.mjs` | 189 | +18 | `START_TIMEOUT_MS` 25 s · `browserStartTimeoutMs(env)` · 缺省参数改调用 |
| `thincoder-core/config.mjs` | 439 | +8 / −1 | 导出 `promoteAgentViews` · `:354` 改调（软线超限已在册，本批不重构） |
| `thincoder-core/agent-tools/settings.mjs` | 315 | +10 | set ∥ null 腿调 `promoteAgentViews` |
| `thincoder-core/advisor/loop.mjs` | 290 | **0** | 零改（读面保留 promoted 语义——见 ③ 根因定位） |
| `docs/core/design/TOOLS.md` | 1715 | +10 / −6 | §6.23 ④ 矩阵 · 熔断域句 · ⑦ T7/T18 · ⑨ D-WB3 · 验收回指 W4 |
| `docs/core/design/BROWSER-TOOL.md` | 539 | +6 / −6 | §2.4 · §2.6 · §2.9 · §8 行——12 s 全部换成缺省 25 s + env 面 |
| `docs/core/design/AGENT-PARAMS.md` | 97 | +4 / −2 | §2 读取链句更正 · §6.1 行 |
| `docs/core/design/SETTINGS-TOOL.md` | 131 | +3 | §2.3 promoted 视图同步不变式 |
| `docs/core/requirements/TOOLS.md` | — | 主 agent 落 | W4 与验收方向 ④（本段已给逐字改法） |
| `docs/batches/2026-10-24-tool-timeouts.test.mjs` | 新增 | ≈180 | 三件的单测（收口随批删） |

`docs/core/design/API-CONTRACT.md:1046` 的 `START_TIMEOUT_MS` 行属**生成块**（`<!-- BEGIN GENERATED -->`）——不手工改，下次生成器跑时随导出面刷新（新增导出 `browserStartTimeoutMs` 同源入表）。本项记入「上抛项」备查。

### 验收对照（逐件机判）

| 条目 | 判据句（命令 ∥ 断言） |
|---|---|
| ①-a | `node --test docs/batches/2026-10-24-tool-timeouts.test.mjs`：fetch 404 ⇒ transport 1 次 + 紧随 search transport 1 次 |
| ①-b | 同上：search 401 ⇒ 再调 transport 0 次；时钟 +600 001 ms ⇒ transport 1 次 |
| ①-c | 源码扫描 `TRIP_STATUS` 值集 == `[401,402,403]`（用例断言 `_TRIP_STATUS_FOR_TEST` 导出） |
| ②-a | `browserStartTimeoutMs({})` === 25000；`"40000"` === 30000；`"abc"` ∥ `"0"` === 25000；`"2000"` === 2000 |
| ②-b | `launchBrowser({exe:<stub>, profile:<tmp>, sleep:<fake>})` 超时抛句含 `within 25s`（缺省来自常量而非入参） |
| ③-a | `settings set agent.advisor.timeoutMs 900000` 后两视图同值 + `list` 两行同值 |
| ③-b | 700 s 腿：改后无 timeout 尾、改前有（红/绿对照） |
| ③-c | `null` 清除两视图同步；`guard` 会话级键经 `promoteAgentViews` 后仍在 |
| 全 | `npm test` 绿（收集面 = `thincoder-cli/test/*.test.mjs` + `test/integration/*.test.mjs`）；`doc_check(mode:"gate")` PASS |

### 关键决策

| # | 决策 | 被否方案与理由 |
|---|---|---|
| D-TT1 | 404 移出熔断名单，余三码熔断 + 10 分钟 TTL | 只加 TTL 不去 404——用户报的主症（一次 404 停掉 search）还在；只去 404 不加 TTL——改完 key 仍要重启会话才恢复 |
| D-TT2 | TTL = 10 分钟，到期全开（不半开、不探针） | 半开探测 / 指数退避——多一层状态机与一条无人走过的分支；账号级失败在分钟级恢复，全开已足 |
| D-TT3 | 启动窗缺省 25 s + env `BROWSER_START_TIMEOUT_MS`（钳 2–30 s） | 新增 config.json 键——浏览器面在核内跨四端，落键要 DEFAULTS + 四端配置面（远大于缺陷本身）；同档既有逃生口就是 env（`BROWSER_PATH`） |
| D-TT4 | 上限 30 s | 上限放开——`navigate` 预算 45 s 含自启，启动窗过大时动作先被预算掐断，用户看到的是「启动超时」的假象 |
| D-TT5 | 修写面（settings set 同步 promoted 视图），**不改**读面（`loop.mjs`） | 读面改读 nested——会吞掉只存在于运行面的会话级 advisor 键（`cmd-advisor.mjs:14` 只写 promoted、`session-lifecycle.mjs:138` 只恢复 promoted）⇒ 全局统一 promoted 面要动 9 个读者 + 2 个写者，超出本批 |

### 上抛项

1. **需求档 W4 与验收方向 ④ 的改动归主 agent 落**（本段已给逐字改法 + 判据对比）。**代码不得先于需求档落地**——否则实现与需求档对撞（W4 现文要求 404 熔断）。
2. **`promoted 视图` 缺陷类是族级的**：`config.mjs` 还 promote 了 `provider` / `providersList` / `proxy` / `providerState` 等；`settings set` 对它们同样只写 nested（除 `provider` 由 `providers` 派生外）。本批按任务书范围只修 `advisor`；是否需要另批统一「写入即重derive」请主 agent 裁。
3. `API-CONTRACT.md` 生成块需重新生成（非手工笔）。
4. 本批 §1 目前仍是模板占位（讨论未落）——不影响本段方向（三件 ∥ 台账 #1750 已由任务书给定），但按六段纪律请主 agent 补齐。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：404 不熔断 + 熔断限时 10 分钟 ∥ 浏览器启动窗 25s 可配 ∥ advisor timeoutMs 热生效（含需求 W4 同步）——scope = `design/TOOLS.md` · `design/BROWSER-TOOL.md` · `design/AGENT-PARAMS.md` · `design/SETTINGS-TOOL.md` · `requirements/TOOLS.md`。

**已核通过面（无异议）**：404 不熔断（`TOOLS.md:1340` ∥ `:1409` T7 ∥ `:1476` ∥ `:1489` W4）与 10 分钟 TTL（`:1339` ∥ `:1351` `BREAKER_TTL_MS` = 600 000 ∥ `:1420` T18 ∥ `:1454` D-WB3）在五档内口径一致；需求 W4 已同步（`requirements/TOOLS.md:233` 熔断**限时 10 分钟** ∥ **404 不熔断**；`:254` 验收方向 ④ 同句）；时钟缝合 R6（`TOOLS.md:1399` `_setDeepseekClockForTest(fn)`，缺省 `Date.now` + `finally` 复位）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | promoted 视图在 `null` 删除腿的同步写成两套机制：`AGENT-PARAMS.md:19` 写「`settings` 工具的 set ∥ `null` 删除腿在写内存后调用它。」（= `promoteAgentViews`），而 `SETTINGS-TOOL.md:35` 写「`null` 删除腿在副本上同步删同一子键」。而 promote 本体 = `{ ...config.advisor, ...config.agent.advisor }`（`AGENT-PARAMS.md:61`），按它重 derive 会把旧值从 `config.advisor` 再带回副本 ⇒ 两条描述对同一写路径给出不同结果，实现者无法判定哪份权威（且正是本批「timeoutMs 热生效」的删除腿） | 在拥有写面的档（SETTINGS-TOOL §2.3）落一句唯一机制（副本上删同子键 ∧ 是否仍调 `promoteAgentViews`），`AGENT-PARAMS.md` §2 改为指针（只保留它拥有的读取链 + 默认值单一来源事实），两处不再各写一版 |
| 2 | Acceptance | 🟡 | 浏览器启动窗可配无验收格：§7 回指表覆盖 F-BT1–F-BT19 / N-BT1–N-BT10 无该旋钮行，§8 最近格 U52 只覆盖动作超时；旋钮的边界语义也未定——「钳 2–30s」（`BROWSER-TOOL.md:134`）未说非数值 / 0 / 负值如何处理（同族数值旋钮的既有口径 = `AGENT-PARAMS.md:17` 非法一律回退默认）。需求侧登记 `unverified`（`requirements/BROWSER-TOOL.md` 不在本次范围） | §7 加一行、§8 加用例格：缺省 25s ∥ env 覆盖生效 ∥ 2s 下限与 30s 上限夹取 ∥ 非数值回缺省 ∥ 失败句回显生效秒数（`BROWSER-TOOL.md:161`）；§2.4 同句补非法值口径 |
| 3 | Feasibility / Clarity | 🟡 | 冷启预算与启动帽无规则：§2.4「首动作即开（`navigate` 为常规入口）」，但只有 navigate 45s 注明「含会话自启（启动帽 25s 缺省 ∥ 上限 30s 在内）」（`BROWSER-TOOL.md:196`），而 type / snapshot = 15s（`:198`）、其余 30s（`:197`），启动帽上限 30s（`:206`）⇒ 首动作非 navigate（或自愈重开后的首动作，§2.10）可整格预算耗在 `launch browser`，按 §2.9 「预算到点落于会话自启序列中途」（`:211`）复位后重试可再撞 | 补一条冷启预算规则：或冷启动动作按 max(动作预算, 启动窗 + 余量) 取界，或限定仅 `navigate` 可开启会话；并配一格用例 |
| 4 | Acceptance | 🟡 | advisor `timeoutMs` 热生效无专属验收判据：`AGENT-PARAMS.md:70` 只登记「评审超时：配置覆盖 / 回退 / 非法值回退三态」，无「settings set 后运行读面即变」「null 删除回默认 600 000」「会话级键（`advisor.guard`，`:20`）在合并中保留」三格 | 三格落成机判句：set → 下一检查点读到新值（无需重启）∥ null → 回 `REVIEW_TIMEOUT_MS` ∥ `advisor.guard` 仍在 |
| 5 | Requirements coverage（错误路径） | 🟡 | `agent.advisor.timeoutMs` 被有意排除在 DEFAULTS 外（`AGENT-PARAMS.md:21`）⇒ settings 类型护栏把它当未知键「未知键原样通过」（`SETTINGS-TOOL.md:67`）⇒ 非数值 / 非正数写进内存后仍回显「persisted + hot-applied（运行中已生效）」（`:77`），而循环静默回落默认（`AGENT-PARAMS.md:17`）——正是 `SETTINGS-TOOL.md:36-37` 要防的假承诺 | 定一处：要么写面拒非有限正数，要么回显改为「persisted — invalid value falls back to 600000」，并在 §2.3 / §6 登记该已知形状（或显式记为已接受的缺口） |
| 6 | Affected-file annotations | 🟡 | 本批改动面的行数注不全（criterion 8）：`BROWSER-TOOL.md:352` 只给「实施后实读」189（`launch.mjs`），无现况 + Δ；`AGENT-PARAMS` / `SETTINGS-TOOL` 无受影响文件表——promote 面若要动 `thincoder-core/config.mjs`（`TOOLS.md:1433` 已 **570** 行）与 `settings.mjs`（行数未读），无行数 / Δ ⇒ 无法判越档 | `launch.mjs` 补「现况 → ≤±N」列；promote 面补两档行数与 Δ，或每档明写「本批零代码（仅文档同步）」 |
| 7 | Methodology（先例 ∥ 勘察） | 🟡 | 只有 `TOOLS.md` 携必需两行（先例行 `:1279`、公开源核查行 `:1289`）；`BROWSER-TOOL.md` / `AGENT-PARAMS.md` / `SETTINGS-TOOL.md` 均无 ⇒ 启动窗旋钮与 promote 面既无先例对齐 / 偏离，也无勘察结论（criterion 9 / 10） | 每档补一行先例行 + 一行勘察行：BROWSER-TOOL 先例 = walkthrough `:124-127`（偏离 = env 覆盖 + 钳位）；AGENT-PARAMS / SETTINGS-TOOL 先例 = `loadConfig` 与 `settings set` 共用同一条 promote 规则 |
| 8 | Existing-piece / KD | 🔵 | 新旋钮 `BROWSER_START_TIMEOUT_MS` 无三问式答案，且 §6 决策表（KD-1…KD-24）无条目说明为何走 env 而非配置键——同工具已有配置键面「配置键 `browser.allowDomains: string[]`（缺省 `[]` = 不设限）」（`BROWSER-TOOL.md:289`） | 补一行 KD：通道选择（env，沿 `BROWSER_PATH` 先例）与 2–30s 钳位理由；或写 `none found: …` 点名已勘察的配置面 |
| 9 | Doc-state / numeric drift | 🔵 | `TOOLS.md` 自身读数三份不一致：`:1442` **1549**（+238）∥ `:1692` 1,714 行（2026-10-19 实测）∥ 现盘 1,719；另 `:395` 「`thincoder-core/test/` 现盘 = `run.mjs` / `slow.mjs`」已被本档 `:1670` 标为陈旧读数（父侧待办） | 一次刷新自读数，并把陈旧测试树读数换成现清单（或删除该括注） |
| 10 | Branch provenance（取证面） | 🔵 | 404 分支的依据是需求 W3 / W4 判词（`requirements/TOOLS.md:232-233`）；上游错误码面的第一手读数在需求 §4.9「上游事实」块（`:218-220`）未录（只录参数 / 结果 / 计费 / 限速），设计侧亦只引 W3 | 在「上游事实」块补一行错误码语义（404 = 无可提取内容，含出处）或引 T7 的复现径，使该分支的现场可追 |

**计数**：🔴 1 · 🟡 6 · 🔵 3

VERDICT: changes-required

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
