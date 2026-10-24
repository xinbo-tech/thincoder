# 2026-10-24 · 工具面三处超时与熔断：404 不熔断 · 浏览器启动窗可配 · advisor 超时可热改
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = Gitee IKQ2KZ（404 误熔断 Web 后端）· IKP6ZI（浏览器启动窗 12s 写死）· IKJPNU（advisor timeoutMs 热应用不生效）。用户 2026-10-24 17:31 要求并行处理。
> 台账 = #1751（归批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-24
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修轮（评审轮次 2 · 8 条）已处置：预算表与 KD-26 同口径 · F-BT16b 键 · 测试树清单按现盘 · 显式 doc_check gate PASS（3 档 0 命中））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 本批条目（覆盖三个 Gitee 项 · 台账 #1750）

| # | 来源 | 覆盖需求条目 | 设计档落点 |
|---|---|---|---|
| ① | IKQ2KZ | `docs/core/requirements/TOOLS.md` §4.9 W4（改法见下「需求档改法」——**主 agent 落**） | `docs/core/design/TOOLS.md` §6.23 ④（错误矩阵）· ⑨ D-WB3 · ⑦ T7/T18 · 验收回指 W4 |
| ② | IKP6ZI | `docs/core/requirements/BROWSER-TOOL.md` F-BT16 ∥ N-BT5（既有条目已覆盖「有界不悬挂 ∥ 启动失败可读」——本批只动预算数值与可配面，不改需求语义） | `docs/core/design/BROWSER-TOOL.md` §2.4 ∥ §2.6 ∥ §2.9 ∥ §8 |
| ③ | IKJPNU | `docs/core/requirements/SETTINGS-TOOL.md` F-ST2（热应用语义）· `docs/core/requirements/AGENT-PARAMS.md` 评审墙钟 | `docs/core/design/AGENT-PARAMS.md` §2 · §6.1 · `docs/core/design/SETTINGS-TOOL.md` §2.3 |

**不在本批**：Tavily / Bing 腿语义 · MCP 搜索面 · 浏览器动作预算表其余行 · `config.mjs` 拆分（docs/core/design/TOOLS.md §6.23 ⑧ 已登记软线超限与拆批计划）· 除 advisor 外的其余 promoted 视图（`provider` / `providersList` / `proxy`——见「上抛项」）。

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

**现状**（`thincoder-core/tools/web-deepseek.mjs` 实读）：`:30` `TRIP_STATUS = new Set([401, 402, 403, 404])`；`:38` `let _breaker = new WeakSet()`；`:107` 命中 `TRIP_STATUS` ⇒ `trip(agent)`；
  `:143`/`:157` 已熔断 ⇒ `{status:"failed", reason:"breaker open"}`，transport 零调用。`WeakSet` 无时间维度 ⇒ 唯一解封口 = 进程结束或测试缝 `_resetDeepseekTransportForTest()`（`:42`）。

**目标形**：
1. `TRIP_STATUS = new Set([401, 402, 403])`——404 退化为「本次失败」，与其他未列 4xx 同路（`:338` 矩阵行「400 ∥ 413 ∥ 其它未列 4xx」）。
2. 熔断容器 `WeakMap<agent, expiresAtMs>`；`BREAKER_TTL_MS = 600_000`（10 分钟）。`tripped(agent)` 判 `expiresAt > now()`；到期即 `delete` 并放行。`trip(agent)` 写 `now() + BREAKER_TTL_MS`。
3. 时钟缝 `_setDeepseekClockForTest(fn)`（缺省 `Date.now`），`_resetDeepseekTransportForTest()` 同时复位时钟——与既有「成对两半、无第三缝」纪律同形（docs/core/design/TOOLS.md §6.23 ⑦）。
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

**现状**：`thincoder-core/advisor/loop.mjs:103-104` 读 `agent.config?.advisor?.timeoutMs`（**运行读面 = promoted 视图**）；`thincoder-core/config.mjs:354` `merged.advisor = { ...merged.agent.advisor }`——**只在 `loadConfig` 那一次建副本**；
  `thincoder-core/agent-tools/settings.mjs:300` 只 `setKeyPath(config, "agent.advisor.timeoutMs", v)`（写 nested）⇒ promoted 视图停在装载那一刻的值。`settings.mjs:305` 回显 `— persisted + hot-applied（运行中已生效）` 因此在 advisor 族上不成立。

**根因定位（与任务书三条的差异，需上抛知会）**：读面（`loop.mjs:103`）**不是缺陷**——promoted 视图是 advisor 的运行读面，同族读者还有 `advisor/run.mjs:27` ∥ `agent/completion.mjs:129` ∥ CLI `status-line.mjs:49` ∥ `cmd-advisor.mjs:14`（**只写 promoted**）；
  会话恢复也写 promoted（`session-lifecycle.mjs:138`）。真正的缺口 = **写面没有把 promoted 视图与 nested 同步**。因此本批**不改 `loop.mjs`**，改 `settings set`：写入后按 `loadConfig` 同一条规则重derive promoted 视图。

**目标形**：
1. `thincoder-core/config.mjs` 导出 `promoteAgentViews(config)`——把 `agent.advisor` 合入 `config.advisor`（`{ ...config.advisor, ...config.agent.advisor }`，保留只存在于运行面的会话级键如 `guard`）；`loadConfig` 内部改调它（行为逐字不变：装载时 `config.advisor` 为空 ⇒ 等价于整体复制）。
2. `settings.mjs` set 路径（含 `null` 删除腿）在写内存后调 `promoteAgentViews(config)`；`agent.advisor` 整体赋值腿 = 整体替换 `config.advisor`（显式整段写入语义）。`null` 删除腿 = 在 promoted 视图上同步删同一子键（否则旧值留在读面上，正是本缺陷）。
3. 文档面同步：`docs/core/design/AGENT-PARAMS.md:18` 的「⇒ `agent.config.advisor.timeoutMs` 天然可见」一句**删除**（它是错的：只在 `loadConfig` 那一瞬成立）；改为「写面负责同步」的不变式 + 读取链坐标。`docs/core/design/SETTINGS-TOOL.md` §2.3 增一条「promoted 视图必须在写入点同步」的机制句。

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
3. `docs/core/design/API-CONTRACT.md` 生成块需重新生成（非手工笔）。
4. 本批 §1 目前仍是模板占位（讨论未落）——不影响本段方向（三件 ∥ 台账 #1750 已由任务书给定），但按六段纪律请主 agent 补齐。

### 修轮（评审轮次 1 处置——设计面修订 · 2026-10-24）

**🔴1 `null` 删除腿定死一处**：唯一机制住 `docs/core/design/SETTINGS-TOOL.md` §2.3——
子键 set：写 nested 后调 `promoteAgentViews(config)`；
`null` 删除腿：删 nested 同子键 → 再删 promoted 副本同子键 → **不再 re-derive**（re-derive 会把 `config.advisor` 旧值带回，删除即失效；判据 = 删除后两视图均无该键）；
整段赋值：同 promote 合并语义（只覆盖不删除，清键走 `null` 腿）。
`docs/core/design/AGENT-PARAMS.md` §2 收敛为指针（只留读取链 ∥ 默认值单源 ∥ 写面校验）。
**原文「`agent.advisor` 整段赋值 = 整体替换 `config.advisor`」一句作废**——整体替换会吞掉只住运行面的会话级键（`advisor.guard`）。

**② 浏览器启动窗旋钮**：`docs/core/design/BROWSER-TOOL.md` §2.4 补取值口径（`Number.isFinite(v) && v > 0` 才采纳 → 钳 `[2_000, 30_000]`；非数值 ∥ 空 ∥ 0 ∥ 负值 ⇒ 回落 25000），§7 补两行验收（T45 / T46），§8 补 U61。需求侧 `docs/core/requirements/BROWSER-TOOL.md` 未登记该旋钮 = 已知缺口（需求档归主 agent，见上抛）。

**③ 冷启预算定死**：会话自启段受自身帽界定（启动窗 ≤30s ∥ 三域 enable 各 10s），**不占动作预算**——动作时钟自会话就绪后起算（排队期照常计入）。落 `docs/core/design/BROWSER-TOOL.md` §2.4 / §2.9 / §6 KD-26 / §8 U62；实现面 = `queue.mjs` 的 `ActionController.extendBy` + `session.mjs:489` 入口计量（各 ≈+8 / +4 行）。被否：限定仅 `navigate` 可开会话（收窄既有语义）。

**④ advisor 热生效验收三格**：`docs/core/design/AGENT-PARAMS.md` §6.2——set 后下一检查点读到新值 ∥ `null` 后回退 `REVIEW_TIMEOUT_MS`（600 000）∥ `advisor.guard` 经 promote 仍在。

**⑤ 非法 `timeoutMs` = 写面拒**（新增 D-ST18，`docs/core/design/SETTINGS-TOOL.md` §2.6）：`agent.advisor.timeoutMs` ∥ `advisor.timeoutMs` 只收 `null` ∥ 有限正数；拒绝句点名键与可消费形态。回执「运行中已生效」不再可能假承诺；手写 `config.json` 仍按读面回退默认（D-P3 不撤）。

**⑥ 受影响文件（修订版；现况 = `split("\n").length − 1` 实读 · 2026-10-24）**：

| 档 | 现况 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/tools/web-deepseek.mjs` | 172 | +12 | `TRIP_STATUS` 去 404 · `WeakMap` + TTL · 时钟缝 · 日志 `ttlMs` |
| `thincoder-core/browser/launch.mjs` | 189 | +18 | `START_TIMEOUT_MS` = 25_000 · `browserStartTimeoutMs(env)` · 缺省参数改调用 |
| `thincoder-core/browser/queue.mjs` | 171 | +8 | `ActionController.extendBy(ms)`（冷启段不占动作预算） |
| `thincoder-core/browser/session.mjs` | 494 | +4 | 动作入口计量自启段用时并 extendBy |
| `thincoder-core/config.mjs` | 438 | +8 / −1 | 导出 `promoteAgentViews` · `:354` 改调（原文记 439 / `docs/core/design/TOOLS.md` 记 570，均与实读不符） |
| `thincoder-core/agent-tools/settings.mjs` | 315 | +12 | set 腿 promote · `null` 腿删副本同子键 · 写面校验 |
| `thincoder-core/advisor/loop.mjs` | 290 | 0 | 零改（读面保留 promoted 语义） |
| `docs/core/design/TOOLS.md` | 1722 | 本批 | §6.23 ④ 404 依据 · ⑧ 计数刷新 · ⑨ D-WB3 · ⑦ T7 / T18 |
| `docs/core/design/BROWSER-TOOL.md` | 561 | 本批 | §2.4 取值 / 冷启 · §2.9 · §5 受影响面 · §6 KD-25 / KD-26 · §7 两行 · §8 U61 / U62 |
| `docs/core/design/AGENT-PARAMS.md` | 103 | 本批 | §2 指针化 + 写面校验 · §6.1 / §6.2 |
| `docs/core/design/SETTINGS-TOOL.md` | 160 | 本批 | §2.3 单源 · §2.6 D-ST18 · §3 D-ST18 · §5 受影响文件 |
| `docs/core/requirements/TOOLS.md` | 254 | 主 agent 落 | W4 + 验收方向 ④（本段已给逐字改法） |
| `docs/batches/2026-10-24-tool-timeouts.test.mjs` | 新增 | ≈180 | 三件单测（含 T45–T47；收口随批删） |

**⑦ 先例行 + 勘察行**：BROWSER-TOOL / AGENT-PARAMS / SETTINGS-TOOL 三档各补两行（先例 = walkthrough `:124-127` ∥ `loadConfig` promote；勘察 = 本仓 docs 树 + 代码实读，公共源仓 `publicRepos` 实读 `[]`）。

**⑧ env 旋钮三问 + KD-25**：`docs/core/design/BROWSER-TOOL.md` §6 KD-25 记三问答案与钳位理由（env 沿 `BROWSER_PATH` 先例；config 键要过 DEFAULTS + 四端配置面）。

**⑨ docs/core/design/TOOLS.md 自读数刷新**：`1,722` 行（2026-10-24 实测，`split("\n").length − 1` 口径），两处表同值；`thincoder-core/test/` 现盘清单补齐（`run.mjs` / `slow.mjs` + 5 个常驻 `*.test.mjs`）；同表 `config.mjs` 570→438、`web-deepseek.mjs` 173→172 一并校正；另修两处 >300 字长行（门判宽）。

**⑩ 404 分支依据**：`docs/core/design/TOOLS.md` §6.23 ④ 补一行——需求 W3 判词（`docs/core/requirements/TOOLS.md:232`）+ Gitee IKQ2KZ 现场 + 复现径 T7。需求档「上游事实」块（`:218-220`）补错误码语义 = 上抛主 agent。

**上抛（新增）**：
1. `docs/core/requirements/TOOLS.md` §4.9「上游事实」块补 404 错误码语义一行（本席不改需求档）。
2. `docs/core/requirements/BROWSER-TOOL.md` 未登记启动窗旋钮（F-BT16 只要求「有界」）——是否加需求行由主 agent 裁。
3. `docs/core/design/TOOLS.md` §6.23 ⑧ 的 `docs/core/design/SETTINGS-TOOL.md | 131` 与本批实测 160 不符（非本批引入，未改，备查）。

### 修轮（评审轮次 2 处置——设计面修订 · 2026-10-24）

| # | 严重度 | 处置 | 现址 |
|---|---|---|---|
| 🔴1 | 预算表 ↔ 冷启规则同口径 | 预算表 navigate 行改为「**不含**会话自启；首动作总墙钟 = 启动窗 + 本预算」；`:139` 与 KD-25 的 30s 上限理由改按总墙钟表述；§2.4 冷启预算补 navigate 同判；§7 冷启行加 T48、§8 加 U63（首动作 `navigate`：假自启 12s + 导航 40s ⇒ 不超时、总墙钟 52s；旧形态 33s 到点、卡点 = 导航步） | `docs/core/design/BROWSER-TOOL.md:202` · `:139` · `:426` · `:140` · `:459` · `:531` |
| 🟡2 | 上抛句改为指向已落行 | 设计侧不再称需求档缺行——改指 `docs/core/requirements/TOOLS.md:221` 的错误码语义 | `docs/core/design/TOOLS.md:1356` |
| 🟡3 | 测试树清单 ↔ 同档引用 | 以现盘为准：清单 = `run.mjs` / `slow.mjs` + 6 个常驻 `*.test.mjs`（补 `anthropic-message-adapt`）；被引的三档（`tool-seams` / `git-noninteractive` / `git-repo-discovery`）全仓实读不存在 ⇒ 引用改按判据表述、不再点名不存在的档（同文件另两处同档引用一并收口） | `docs/core/design/TOOLS.md:395-396` · `:311-312` · `:520` · `:525` · `:563` · `:565` · `:567` |
| 🟡4 | 按编号可查 | §7 启动窗那行改键 `F-BT16b`（冷启预算行仍归 `F-BT16`） | `docs/core/design/BROWSER-TOOL.md:458` |
| 🔵5 | 现况读数 | `docs/core/design/SETTINGS-TOOL.md` 131 → 160（2026-10-24 实测） | `docs/core/design/TOOLS.md:1446` |
| 🔵6 | 用例集对齐 | U61 补负值格 `"-5"` ⇒ 25000 | `docs/core/design/BROWSER-TOOL.md:529` |
| 🔵7 | 500 线距离 | `session.mjs` 行记 494 → 本批 ≈498，距 500 建议线余 2 行、距 800 硬限余 306 行；触发条件补「下批实质改动先做拆分评审」 | `docs/core/design/BROWSER-TOOL.md:391` |
| 🔵8 | 验收宿主 | 三格宿主明写 = 批次单测档（收口随批删；`test/` 树不新增常驻档）；同档 `:76` 的死引用（`config.test.mjs:37`）改为单一来源坐标 | `docs/core/design/AGENT-PARAMS.md:75-76` · `:77` |

**本轮实读新发现（已在设计侧处置或上抛）**：

1. `thincoder-core/browser/queue.mjs:15` 的 `navigate` 常量注释仍写「含会话自启（12s 启动帽内）」——与 KD-26 同属旧前提。已入 `docs/core/design/BROWSER-TOOL.md` §5 受影响面：实现轮 `extendBy` 落地时同改该注释（实施席照改，设计侧不改代码）。
2. 需求面 `docs/core/requirements/BROWSER-TOOL.md:38` F-BT16 判定句的括注「（含会话自启 ∥ CDP 命令 ∥ 轮询等待 ∥ 关闭路径）」与 KD-26 的两段口径措辞不一致——判定判据（有界不悬挂）仍成立，只措辞归需求档，见下。

**上抛（新增，需求档归主 agent）**：`docs/core/requirements/BROWSER-TOOL.md:38` F-BT16 的「含会话自启」括注建议改为「自启段自成一帽（启动窗），总墙钟 = 两段之和」——设计侧已按两段口径落定（KD-26），需求侧未动。

**门禁**：`doc_check(mode:"gate")` = PASS（`docs/core/design/BROWSER-TOOL.md` / `docs/core/design/TOOLS.md` / `docs/core/design/AGENT-PARAMS.md` 三档 · 0 命中）。自读三表：清单 6 档与磁盘一致；SETTINGS-TOOL 160 / TOOLS 1722 / `session.mjs` 494 均为本轮实测。

### 补轮（F34 集成测试设计段 · 2026-10-24）

**缺项**：本批三件都改变用户可见结果，设计档却无「集成测试设计」段——F34（`docs/core/requirements/TESTING.md:199` 实读）判该缺项 = 设计不合格；收口删掉批次单测档后，就只剩单测，没有从用户入口走的验收。

**逐件业务可见性判定**（三件全部触及业务行为，故无「集成场景无变化」项）：

| # | 业务可见结果 | 判定 |
|---|---|---|
| ① 404 不熔断 | 抓一个不存在的页面之后，同一会话的 `websearch` 仍打到 DeepSeek（不再整个后端停 10 分钟）；凭据类失败后 10 分钟自动放行、不用重启 | 触及业务行为 |
| ② 启动窗可配 | 慢机上不再 12s 早夭；`BROWSER_START_TIMEOUT_MS` 改了下一调用即生效，失败句回显生效秒数 | 触及业务行为 |
| ③ advisor 超时热改 | `settings set agent.advisor.timeoutMs` 之后下一次评审按新值跑，不用重启 | 触及业务行为 |

**落点（三处 · 常驻集成档——不随批删）**：

| 设计档 | 新段 | 档 | 场景数 |
|---|---|---|---|
| `docs/core/design/TOOLS.md` | §6.23 末「集成测试设计（F34 · 本批 · 收口口径）」（`:1515` 起） | `thincoder-cli/test/integration/web-backend-404.test.mjs` | I-WB1–I-WB3 |
| `docs/core/design/BROWSER-TOOL.md` | §11「集成测试设计（F34 · 本批 · 收口口径）」（`:563` 起） | `thincoder-cli/test/integration/browser-start-window.test.mjs` | I-BT1–I-BT3 |
| `docs/core/design/AGENT-PARAMS.md` | §6.2 末「集成测试设计（F34 · 本批 · 收口口径）」（`:78` 起） | `thincoder-cli/test/integration/advisor-timeout-hot.test.mjs` | I-AP1–I-AP3 |

每条场景的判据 = 业务可观察结果（回执句 ∥ 结果文本 ∥ 上游命中计数 ∥ 会话还能不能继续用），表内逐行回指业务需求（W4 ∥ F-BT16b ∥ F-BT16 KD-26 ∥ F-ST2 ∥ D-ST18）。

**不入门的三半（逐条写理由，不留空）**：熔断 10 分钟到期解封（业务入口无时钟缝，门里要实等 10 分钟；单测 T18 拨时钟判两读数）∥ 启动窗「时长」半（需常驻不退出又不写端口的替身可执行档；`launch.mjs:160` spawn 不带 shell，Windows 上 `.cmd`/`.js` 当不了 exe；单测 T45 + `launch.mjs:163` 判同值即期限）∥ 冷启首动作墙钟半（真机耗时不可控；单测 T47/T48 判两格，真机面 = 冒烟 S1，门内留 I-BT3 抽样格）。

**集成集现状（实读 2026-10-24）**：`thincoder-cli/test/integration/` **目录不存在、0 个档**；`thincoder-cli/test/run.mjs:3` 两层 glob 已备好（`:38` 拒收集别处的档）。本批新增两档 = 该目录的首批常驻用例（0 → 2 档），距 50–100 窗口仍空；缺口由父侧收口记账。

**上抛项**：

1. 任务书给的权威坐标 `docs/core/requirements/TESTING.md:198` 实为 F28（宿主零 TTY），F34 在 `:199`——本段按实读引 `:199`。
2. ③ 的集成段落在 `docs/core/design/AGENT-PARAMS.md`（任务书只点了 TOOLS ∥ BROWSER-TOOL 两档）：③ 的业务可见性由任务书自己判为「触及」，而该档 §6.2 原写「宿主 = 批次单测档，收口随批删」——正是 F34 要堵的洞。若父侧不要这一档，删该块即可，另两档不依赖它。
3. 三个集成档的实现归属未定（本席只写设计）：两档是 `node:http` 假上游 / 假 SSE（零外网），一档要真 Chromium（无则 skip 并打印）。实施轮按设计档落。

**本节更正（同段自校，1 条）**：「集成集现状」一段原写「本批新增两档 = 该目录的首批常驻用例（0 → 2 档）」——与本章落点表的三行不一致（实为三档）。以落点表为准：`0 → 3 档`。

### 回改轮（实施偏离回归——设计档跟实现收正 · 2026-10-24）

**依据**：实施席交付报偏离 7 条（`§5` 偏离项表 D1–D7）。D1–D3 = 设计档写错、实施席按正确做法落地 ⇒ 设计档按**实现**收正；D4–D7 = 设计档补记或按其现实处置。代码零改（57/0 · 35/0 · 17/17 已由父侧独立复跑）。

| # | 设计档原字样 | 实落（本轮实读） | 处置（file:line） |
|---|---|---|---|
| D1 | `queue.mjs` 加 `ActionController.extendBy`、`session.mjs:489` 入口计量（Δ ≈+8） | `pauseBudget` / `resumeBudget` 成对（`queue.mjs:71-75` · `:78-83`，经 `extendBy:87-94` 回补；`remaining()` 暂停期读 `_pausedAt:61`）+ 冷启段暂停/恢复接线（`session.mjs:200` · `:205` · `:208`） | §2.4 机制句换 pause/resume，并写明「事后回补不能替代暂停」（`type`/`snapshot` 15s 预算 < 启动窗 25s ⇒ 回补前已到点，旧句 `stuck in launch browser` 仍在）；§5 受影响面 Δ ≈+8 → **+28**、坐标 → `queue.mjs:61-94` / `session.mjs:199-208`（`docs\core\design\BROWSER-TOOL.md:140-144` · `:385-387`） |
| D2 | 子键 set 写嵌套后调 `promoteAgentViews` 重 derive 副本 | 子键写后**只键级同步被写的键**（`settings.mjs:340`）；整段赋值腿仍 promote（`:337-338`） | §2.3 三条腿各写一句并补因：`DEFAULTS.agent.advisor.guard = false`（`config-defaults.mjs:40`）⇒ 整段 re-derive 会静默关掉 `/advisor` 打开的会话级 guard（`docs\core\design\SETTINGS-TOOL.md:42-44`） |
| D3 | §6.23 ⑥/⑦ 未登记 `_TRIP_STATUS_FOR_TEST` | `web-deepseek.mjs:49` `Object.freeze([...TRIP_STATUS])` | 接口契约「实现面（导出）」行 + ⑦ 测试缝段各补一行，明写「只读断言面、不是缝」（`docs\core\design\TOOLS.md:1371` · `:1403`） |
| D4 | §8 U63 只写「首动作 navigate + 假自启 12s」 | 批测档用 `evaluate` + navigate 格预算比例值（45s → 450ms）、墙钟 100× 缩比；真 `navigate` = 集成档 I-BT3 | §8 补「冷启用例的批测落形（登记）」一行，说明机制不随动作类型分叉（`docs\core\design\BROWSER-TOOL.md:541`） |
| D5 | D-ST18 只列两键 + `agent.advisor` 段 | `advisor` 段整段赋值同校验（`settings.mjs:168`） | §2.6 整段赋值腿改「`agent.advisor` ∥ `advisor` 两个段名的对象值」（`docs\core\design\SETTINGS-TOOL.md:86`） |
| D6 | `promoteAgentViews` = `{ ...config.advisor, ...config.agent.advisor }` | 非对象段不展开（`config.mjs:202`） | §2.3 promote 本体句 + `docs\core\design\AGENT-PARAMS.md:18` · `:63` 同步补「非对象段不展开」；理由 = 畸形段 spread 产 `0/1/2` 垃圾键，读面本就回退默认（D-P3） |
| D7 | Δ 估算（settings ≈+12 · queue ≈+8） | 实读：`settings.mjs` **357**（+45/−3）· `queue.mjs` **199**（+28）· `session.mjs` **498**（+4）· `launch.mjs` **200**（+11）· `web-deepseek.mjs` **187**（+15）· `config.mjs` **456**（+19/−1，净 +18，其中 4 行为在跑批次的 `bodyIdleTimeoutMs`） | 两档受影响面表改「改动前 ∥ 本批 Δ ∥ 实施后」三列并落实读（`docs\core\design\BROWSER-TOOL.md:381-387` · `docs\core\design\SETTINGS-TOOL.md:155-160`）；档位结论：全部 < 500 建议线，`session.mjs` 498 距 500 余 2 行为最紧面、距 800 余 302（触发条件已在档） |

**顺带收正的读数列（一致性面）**：`docs\core\design\TOOLS.md` 自读数 1,722 → **1,739**（`:1446` · `:1713`）；`docs\core\design\SETTINGS-TOOL.md` 160 → **162**（`docs\core\design\TOOLS.md:1448`）；`docs\core\design\BROWSER-TOOL.md:378` 的 `docs\core\design\TOOLS.md` 读数 1,353 → 1,739；
  `session.mjs:489` → `:493`（`docs\core\design\BROWSER-TOOL.md:223`——本批 +4 行下移）；`docs\core\design\AGENT-PARAMS.md` 的 promote 调用点 `config.mjs:354` → `:372`（`:18` · `:24` · `:63` 三处）。

**实施席报告的两处读数修正**：① `settings.mjs` 实读 **357**（报告写 360；`+45` 是新增行，净值 +42）；② `_TRIP_STATUS_FOR_TEST` 在 `web-deepseek.mjs:**49**`（报告写 `:48`——那行是注释）。

**门禁**：`doc_check(mode:"gate")` = **PASS**（`docs\core\design\BROWSER-TOOL.md` / `docs\core\design\SETTINGS-TOOL.md` / `docs\core\design\TOOLS.md` / `docs\core\design\AGENT-PARAMS.md` 四档 · 0 命中）。
  自读三表：`docs\core\design\TOOLS.md` 1,739 ∥ `docs\core\design\BROWSER-TOOL.md` 583 ∥ `docs\core\design\SETTINGS-TOOL.md` 162 ∥ `docs\core\design\AGENT-PARAMS.md` 118（本轮实测）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：404 不熔断 + 熔断限时 10 分钟 ∥ 浏览器启动窗 25s 可配 ∥ advisor timeoutMs 热生效（含需求 W4 同步）——scope = `docs/core/design/TOOLS.md` · `docs/core/design/BROWSER-TOOL.md` · `docs/core/design/AGENT-PARAMS.md` · `docs/core/design/SETTINGS-TOOL.md` · `docs/core/requirements/TOOLS.md`。

**已核通过面（无异议）**：404 不熔断（`docs/core/design/TOOLS.md:1340` ∥ `:1409` T7 ∥ `:1476` ∥ `:1489` W4）与 10 分钟 TTL（`:1339` ∥ `:1351` `BREAKER_TTL_MS` = 600 000 ∥ `:1420` T18 ∥ `:1454` D-WB3）在五档内口径一致；
  需求 W4 已同步（`docs/core/requirements/TOOLS.md:233` 熔断**限时 10 分钟** ∥ **404 不熔断**；`:254` 验收方向 ④ 同句）；时钟缝合 R6（`docs/core/design/TOOLS.md:1399` `_setDeepseekClockForTest(fn)`，缺省 `Date.now` + `finally` 复位）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | promoted 视图在 `null` 删除腿的同步写成两套机制：`docs/core/design/AGENT-PARAMS.md:19` 写「`settings` 工具的 set ∥ `null` 删除腿在写内存后调用它。」（= `promoteAgentViews`），而 `docs/core/design/SETTINGS-TOOL.md:35` 写「`null` 删除腿在副本上同步删同一子键」。而 promote 本体 = `{ ...config.advisor, ...config.agent.advisor }`（`docs/core/design/AGENT-PARAMS.md:61`），按它重 derive 会把旧值从 `config.advisor` 再带回副本 ⇒ 两条描述对同一写路径给出不同结果，实现者无法判定哪份权威（且正是本批「timeoutMs 热生效」的删除腿） | 在拥有写面的档（SETTINGS-TOOL §2.3）落一句唯一机制（副本上删同子键 ∧ 是否仍调 `promoteAgentViews`），`docs/core/design/AGENT-PARAMS.md` §2 改为指针（只保留它拥有的读取链 + 默认值单一来源事实），两处不再各写一版 |
| 2 | Acceptance | 🟡 | 浏览器启动窗可配无验收格：§7 回指表覆盖 F-BT1–F-BT19 / N-BT1–N-BT10 无该旋钮行，§8 最近格 U52 只覆盖动作超时；旋钮的边界语义也未定——「钳 2–30s」（`docs/core/design/BROWSER-TOOL.md:134`）未说非数值 / 0 / 负值如何处理（同族数值旋钮的既有口径 = `docs/core/design/AGENT-PARAMS.md:17` 非法一律回退默认）。需求侧登记 `unverified`（`docs/core/requirements/BROWSER-TOOL.md` 不在本次范围） | §7 加一行、§8 加用例格：缺省 25s ∥ env 覆盖生效 ∥ 2s 下限与 30s 上限夹取 ∥ 非数值回缺省 ∥ 失败句回显生效秒数（`docs/core/design/BROWSER-TOOL.md:161`）；§2.4 同句补非法值口径 |
| 3 | Feasibility / Clarity | 🟡 | 冷启预算与启动帽无规则：§2.4「首动作即开（`navigate` 为常规入口）」，但只有 navigate 45s 注明「含会话自启（启动帽 25s 缺省 ∥ 上限 30s 在内）」（`docs/core/design/BROWSER-TOOL.md:196`），而 type / snapshot = 15s（`:198`）、其余 30s（`:197`），启动帽上限 30s（`:206`）⇒ 首动作非 navigate（或自愈重开后的首动作，§2.10）可整格预算耗在 `launch browser`，按 §2.9 「预算到点落于会话自启序列中途」（`:211`）复位后重试可再撞 | 补一条冷启预算规则：或冷启动动作按 max(动作预算, 启动窗 + 余量) 取界，或限定仅 `navigate` 可开启会话；并配一格用例 |
| 4 | Acceptance | 🟡 | advisor `timeoutMs` 热生效无专属验收判据：`docs/core/design/AGENT-PARAMS.md:70` 只登记「评审超时：配置覆盖 / 回退 / 非法值回退三态」，无「settings set 后运行读面即变」「null 删除回默认 600 000」「会话级键（`advisor.guard`，`:20`）在合并中保留」三格 | 三格落成机判句：set → 下一检查点读到新值（无需重启）∥ null → 回 `REVIEW_TIMEOUT_MS` ∥ `advisor.guard` 仍在 |
| 5 | Requirements coverage（错误路径） | 🟡 | `agent.advisor.timeoutMs` 被有意排除在 DEFAULTS 外（`docs/core/design/AGENT-PARAMS.md:21`）⇒ settings 类型护栏把它当未知键「未知键原样通过」（`docs/core/design/SETTINGS-TOOL.md:67`）⇒ 非数值 / 非正数写进内存后仍回显「persisted + hot-applied（运行中已生效）」（`:77`），而循环静默回落默认（`docs/core/design/AGENT-PARAMS.md:17`）——正是 `docs/core/design/SETTINGS-TOOL.md:36-37` 要防的假承诺 | 定一处：要么写面拒非有限正数，要么回显改为「persisted — invalid value falls back to 600000」，并在 §2.3 / §6 登记该已知形状（或显式记为已接受的缺口） |
| 6 | Affected-file annotations | 🟡 | 本批改动面的行数注不全（criterion 8）：`docs/core/design/BROWSER-TOOL.md:352` 只给「实施后实读」189（`launch.mjs`），无现况 + Δ；`AGENT-PARAMS` / `SETTINGS-TOOL` 无受影响文件表——promote 面若要动 `thincoder-core/config.mjs`（`docs/core/design/TOOLS.md:1433` 已 **570** 行）与 `settings.mjs`（行数未读），无行数 / Δ ⇒ 无法判越档 | `launch.mjs` 补「现况 → ≤±N」列；promote 面补两档行数与 Δ，或每档明写「本批零代码（仅文档同步）」 |
| 7 | Methodology（先例 ∥ 勘察） | 🟡 | 只有 `docs/core/design/TOOLS.md` 携必需两行（先例行 `:1279`、公开源核查行 `:1289`）；`docs/core/design/BROWSER-TOOL.md` / `docs/core/design/AGENT-PARAMS.md` / `docs/core/design/SETTINGS-TOOL.md` 均无 ⇒ 启动窗旋钮与 promote 面既无先例对齐 / 偏离，也无勘察结论（criterion 9 / 10） | 每档补一行先例行 + 一行勘察行：BROWSER-TOOL 先例 = walkthrough `:124-127`（偏离 = env 覆盖 + 钳位）；AGENT-PARAMS / SETTINGS-TOOL 先例 = `loadConfig` 与 `settings set` 共用同一条 promote 规则 |
| 8 | Existing-piece / KD | 🔵 | 新旋钮 `BROWSER_START_TIMEOUT_MS` 无三问式答案，且 §6 决策表（KD-1…KD-24）无条目说明为何走 env 而非配置键——同工具已有配置键面「配置键 `browser.allowDomains: string[]`（缺省 `[]` = 不设限）」（`docs/core/design/BROWSER-TOOL.md:289`） | 补一行 KD：通道选择（env，沿 `BROWSER_PATH` 先例）与 2–30s 钳位理由；或写 `none found: …` 点名已勘察的配置面 |
| 9 | Doc-state / numeric drift | 🔵 | `docs/core/design/TOOLS.md` 自身读数三份不一致：`:1442` **1549**（+238）∥ `:1692` 1,714 行（2026-10-19 实测）∥ 现盘 1,719；另 `:395` 「`thincoder-core/test/` 现盘 = `run.mjs` / `slow.mjs`」已被本档 `:1670` 标为陈旧读数（父侧待办） | 一次刷新自读数，并把陈旧测试树读数换成现清单（或删除该括注） |
| 10 | Branch provenance（取证面） | 🔵 | 404 分支的依据是需求 W3 / W4 判词（`docs/core/requirements/TOOLS.md:232-233`）；上游错误码面的第一手读数在需求 §4.9「上游事实」块（`:218-220`）未录（只录参数 / 结果 / 计费 / 限速），设计侧亦只引 W3 | 在「上游事实」块补一行错误码语义（404 = 无可提取内容，含出处）或引 T7 的复现径，使该分支的现场可追 |

**计数**：🔴 1 · 🟡 6 · 🔵 3

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象**：工具面三处修正（第 2 轮——只验上轮 10 条的修复声明）· scope = `docs/core/design/TOOLS.md` · `docs/core/design/BROWSER-TOOL.md` · `docs/core/design/AGENT-PARAMS.md` · `docs/core/design/SETTINGS-TOOL.md` · `docs/core/requirements/TOOLS.md` · `docs/core/requirements/BROWSER-TOOL.md`

**已核通过的修复声明（逐条 → 现址）**

- #1（轮次 1 的 🔴）null 删除腿单源：`docs/core/design/SETTINGS-TOOL.md:40-48` 现为唯一机制（子键 set → `promoteAgentViews`；null 腿 = 删嵌套 → 删副本同子键 → 不再 re-derive；整段赋值 = 合并语义），
  `docs/core/design/AGENT-PARAMS.md:20` 收敛为指针（「写面三条腿（子键 set ∥ `null` 删除腿 ∥ 整段赋值）的唯一机制、会话级键保留规则与判据住 `docs/core/design/SETTINGS-TOOL.md` §2.3」）——两处不再各写一版，"整体替换"旧句已在修轮作废。
- #2 启动窗验收 + 非法值口径：`docs/core/design/BROWSER-TOOL.md:138`（`Number.isFinite(v) && v > 0` 才采纳→钳 `[2_000, 30_000]`；非数值∥空∥0∥负值 ⇒ 回落 25s）· `:458` T45/T46 · `:529` U61；需求侧已登记 `docs/core/requirements/BROWSER-TOOL.md:39` F-BT16b。
- #3 冷启预算规则已立：`docs/core/design/BROWSER-TOOL.md:140` · `:427` KD-26 · `:459` T47 · `:530` U62 · `:383-384` 实现面 `extendBy`——但与同档旧句互斥，见下表 #1。
- #4 advisor 热生效三格：`docs/core/design/AGENT-PARAMS.md:75` 三格齐（set 900000 即时读 ∥ null 回 600 000 ∥ `advisor.guard` 经 promote 仍在）。
- #5 非法 timeoutMs 写面拒：`docs/core/design/SETTINGS-TOOL.md:81-84`（D-ST18：只收 null ∥ 有限正数，拒句点名键与可消费形态）· `:130`；读面「非法一律回退默认」仍只兜手写 config（`docs/core/design/AGENT-PARAMS.md:21`）。
- #6 受影响文件表：`docs/core/design/BROWSER-TOOL.md:378-386`（launch 189/**≈+18（≤ +30）** · queue 171/≈+8 · session 494/≈+4）· `docs/core/design/SETTINGS-TOOL.md:153-158`（`config.mjs` 438/+8−1 · `settings.mjs` 315/≈+12）· `docs/core/design/AGENT-PARAMS.md:70`（本档零代码）——无档越 500/800。
- #7 先例 + 勘察两行：`docs/core/design/BROWSER-TOOL.md:133-134` · `docs/core/design/AGENT-PARAMS.md:24` · `docs/core/design/SETTINGS-TOOL.md:37-38`（偏离理由 ∥ 对齐零偏离 + 公共源仓 `publicRepos` 实读 `[]`）。
- #8 三问 + KD：`docs/core/design/BROWSER-TOOL.md:426` KD-25（现址/现名/消费者 + 为何走 env 而非 config 键 + 钳位理由）。
- #9 docs/core/design/TOOLS.md 自读数：`:1444` 与 `:1696` 均 1,722 · `:1435` config.mjs 438 · `:1433` web-deepseek 172——但 `:395` 测试树清单与同档三处坐标互斥，见下表 #3。
- #10 404 分支取证：`docs/core/design/TOOLS.md:1355`（需求 W3 判词 + Gitee IKQ2KZ 现场 + 复现径 T7）· 需求档 `:221` 已补错误码语义——设计侧遗留「上抛」句，见下表 #2。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / Document ownership（机制面） | 🔴 | 冷启预算与本档三处旧句互斥、且互斥点正落在声明为机检的预算表上：`docs/core/design/BROWSER-TOOL.md:140` 写「**不占动作预算**——动作时钟自会话就绪后起算」、KD-26 `:427` 写「总墙钟界 = 启动窗 + 动作预算」，而 `:202` 预算表 navigate 行仍写「含会话自启（启动帽 25s 缺省 ∥ 上限 30s 在内）」（`:198` 表头声明该表 = `queue.mjs` 导出常量·机检）；`:139` 与 KD-25 `:426` 的「上限 30s 保 `navigate` 45s 预算内的导航 + 快照余量」同属旧前提。实现席读表得「45s 含自启」、读 §2.4 得「45s 不含自启（总 75s）」，两者都自称权威 ；且唯一冷启用例 T47/U62 只取 `type`（15s），navigate 格无判据可分辨 | 把 §2.9 navigate 行的说明与 §2.4 / KD-26 对齐（自启段不计入动作预算），并把 `:139` / `:426` 的上限理由改按总墙钟（启动窗 + 动作预算）表述；冷启用例补一格 navigate（或显式说明首动作取 `type` 的理由），使判据覆盖表中与旧描述冲突的那一行 |
| 2 | Doc-state / cross-file lag | 🟡 | `docs/core/design/TOOLS.md:1356` 仍称「上游错误码页未在需求档「上游事实」块（`docs/core/requirements/TOOLS.md:218-220`）留行——该块归主 agent，本批上抛」，而该块现已在 `docs/core/requirements/TOOLS.md:221` 携带「错误码语义…404…401 / 402 / 403 才是…」——设计侧对已落地项仍留上抛态，读者会重开一个已关的缺口 | 把该句改为指向已落的 `docs/core/requirements/TOOLS.md:221` 行（或删除上抛句），使 404 分支的取证链在两侧同址可追 |
| 3 | Doc-state（同档自相矛盾） | 🟡 | `docs/core/design/TOOLS.md:395` 的刷新读数称「`thincoder-core/test/` 现盘 = `run.mjs` / `slow.mjs` + 5 个常驻 `*.test.mjs`（`advisor-project-context` / `doc-check-builtins` / `doc-check-scope` / `manifest-five-keys` / `subagent-design-token-gate`——2026-10-24 实读）」，而同档另三处把该目录下更多档当既有回归守卫引用：`:311`「`thincoder-core/test/tool-seams.test.mjs:88-106`」、`:525`「`thincoder-core/test/git-noninteractive.test.mjs`（已落）」、`:567`「`thincoder-core/test/tool-seams.test.mjs`…· `thincoder-core/test/git-repo-discovery.test.mjs`」——清单与引用二者只能有一份为真，而本轮修复声明正是「测试树清单补齐」 | 以现盘为准二选一收口：清单补上这三档，或把三处坐标改为不再指向已不存在的档；两种都能消矛盾，混着留则下一次读者无从判 |
| 4 | Requirements coverage（追溯） | 🟡 | 需求侧新增条目 F-BT16b（`docs/core/requirements/BROWSER-TOOL.md:39`：缺省 25s ∥ env 覆盖钳 2–30s ∥ 非法值回落 ∥ 失败回执携生效秒数）在设计侧无同名落点：`docs/core/design/BROWSER-TOOL.md` 的 §7 回指表两行均键作「**F-BT16**（本批·启动窗旋钮）」（`:458`）与「**F-BT16**（本批·冷启预算）」（`:459`），全档零处 `F-BT16b`——判定句实际已覆盖（`:138` / T45 / T46 / U61），但按编号查不到落点 | 把 §7 的启动窗那行改键为 F-BT16b（冷启那行归 F-BT16 或另立），使需求条目与设计落点按编号一一可查 |
| 5 | Doc-state / numeric drift | 🔵 | `docs/core/design/TOOLS.md:1446` 该行仍记 `docs/core/design/SETTINGS-TOOL.md` 现况 = **131** / ±0，而该档实读 160 行（本轮读全文：末行 160）——本批 §6.23 ⑧ 表未随 SETTINGS-TOOL 的 +29 行刷新（修轮已作为备查登记） | 与本节同拍刷新该行现况读数（`.md` 不入 Δ 表，只须现况数对） |
| 6 | Acceptance（用例集对齐） | 🔵 | 同一旋钮的两张用例表覆盖面不同：`docs/core/design/BROWSER-TOOL.md:458` T45 与 `:426` KD-25 都列「`"-5"` ⇒ 25000（负值）」，而 `:529` U61 的输入集为「未设 ∥ `"4000"` ∥ `"1500"` ∥ `"40000"` ∥ `"abc"` ∥ `"0"`」——恰缺负值一格，而 §2.4:138 的口径明写「非数值 ∥ 空串 ∥ `0` ∥ 负值」 | 两表取值集对齐（U61 补负值一格，或 T45 侧注明该格只在单测面判） |
| 7 | Scope / tier note | 🔵 | `session.mjs` 本批 ≈+4 后落到 ≈498 行（`docs/core/design/BROWSER-TOOL.md:384` 现况 494），距 500 建议线上仅剩 2 行；而 §5 的「档位处置」只按「距 800 硬限」计量（`:390-391`「`session.mjs`（**494——余 306 行；最紧面**）」）——500 软线的距离在档为零 | 在该行同时记 500 建议线距离与触发条件（下次实质改动即做拆分评审），免下一次改动时才发现已越线 |
| 8 | Test durability（验收宿主） | 🔵 | advisor 热生效三格的唯一宿主 = 批次单测档（修轮 ⑥ 表末行 `docs/batches/2026-10-24-tool-timeouts.test.mjs` 新增 ≈180，收口随批删）；`docs/core/design/AGENT-PARAMS.md:75` 未记宿主机，档内亦无「随批删」的声明——promote 同步是写面不变式（长期守点），与 §6.25 ⑥ 把门面判据落常驻回归套的既有判读不同源 | 明写三格落哪一侧：常驻套（如 `thincoder-core/test/config.test.mjs` 族，`docs/core/design/AGENT-PARAMS.md:76` 已引）或显式声明「批次单测档，收口随批删」——两种都可，缺声明则读不出守点会不会消失 |

**计数**：🔴 1 · 🟡 3 · 🔵 4

**验证边界（如实）**：受影响文件的代码行数注（`launch.mjs` 189 / `queue.mjs` 171 / `session.mjs` 494 / `config.mjs` 438 / `settings.mjs` 315）未逐档回读 src 核对——本次评审对象只含上述六档文档，代码档不在声明范围内 ⇒ 该列采信实读声明（`unverified`）；文档侧三档行数（`AGENT-PARAMS` 103 / `SETTINGS-TOOL` 160 / `BROWSER-TOOL` 561）与本轮读全文一致。

VERDICT: changes-required

### 轮次 3（评审子代理）

#### 第 3 轮 · 修复验证（预算表对齐 ∥ 测试树清单 ∥ F-BT16b 回指 ∥ 需求侧口径同拍）

**已验证成立（无发现）**：① 预算表 = 16 动作全覆盖（`docs/core/design/BROWSER-TOOL.md:200-205`：navigate 45s ∥ 12 动作 30s ∥ type/snapshot 15s ∥ wait 谓词帽+15s），且 `:457` 携机检格「`ACTION_BUDGETS` 覆盖全动作」；与 `:140` 冷启预算 ∥ `:202` navigate 行 ∥ §8 U62/U63（12s+40s=52s）∥ KD-26 逐字同拍。
  ② F-BT16b 回指链成立：需求 `docs/core/requirements/BROWSER-TOOL.md:39` → 设计 `:138-139` ∥ `:167` ∥ KD-25 `:426`（三问在位）→ 用例 T45/T46 `:458` ∥ U61 `:529`。
  ③ 需求侧同拍：F-BT16 已内嵌 KD-26 冷启句（requirements `:38`）；`docs/core/design/BROWSER-TOOL.md:138` 对 `docs/core/design/AGENT-PARAMS.md` §2 的「非法一律回退默认」引证准确（`docs/core/design/AGENT-PARAMS.md:17`）。
  ④ 设计前置两行 ∥ 公开源核查行在位（`docs/core/design/BROWSER-TOOL.md:133-134`）。⑤ 档位账目自洽：189+18=207 ∥ 171+8=179 ∥ 494+4=498（距 500 余 2 行已登记为最紧面）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 验收标准 ∥ 受影响文件清单（测试树清单） | 🟡 | T45–T48 在 U61–U63 的落点列标「（新档）」（`docs/core/design/BROWSER-TOOL.md:529-531`），但本批受影响面表（`:378-384`）只有 3 条源码档行、零测试档行；`:386` 又写「主表其余行 = 上一批实施后读数，本批零触」——主表里唯一的测试档行（`:372-374`）正在其中 ⇒ 本批新测试档既无落点路径、也无现况/Δ 行；`:458-459` 亦未带 `:457` 的「（新档）」标记 | 在本批表补一行测试档（沿 `docs/batches/<date>-<topic>.test.mjs` 先例，见 `docs/core/design/TOOLS.md:1425`）：现况 = 无 ∥ Δ ≈+N 行；把 `:386` 的「零触」限定为确未变的行；`:458-459` 补「（新档）」标记 |
| 2 | 验收标准（F-BT16b 回指） | 🟡 | 需求 F-BT16b 把**空**列为回落情态（`docs/core/requirements/BROWSER-TOOL.md:39`），设计 `:138` 亦写「空串」，但机检格 T45（`:458`）与 U61（`:529`）的取值枚举只有 未设／"4000"／"1500"／"40000"／"abc"／"0"／"-5"——空串无对应格 | 在 T45 ∥ U61 的取值列补 `""`，期望值同行落 25000（与 `"abc"` 同格） |
| 3 | 受影响文件清单 | 🔵 | 「本批零触」（`:386`）与本批自身交付面不一致：`:376` 把 `docs/core/design/API-CONTRACT.md` 的生成区列为收口必跑，而 `:382` 本批新增导出 `browserStartTimeoutMs(env)`（生成器是否索引 `thincoder-core/browser/*` 导出 = **unverified**）；需求档本批新增 F-BT16 冷启句 + F-BT16b 亦无任何行登记 | 把「零触」限定为代码行，并单列两笔 .md 交付（API-CONTRACT 生成区收口跑、需求档 docs/core/design/BROWSER-TOOL.md 设计轮已改） |
| 4 | 文档卫生（数值漂移） | 🔵 | `docs/core/design/BROWSER-TOOL.md:375` 记 `docs/core/design/TOOLS.md` = 1353 行，docs/core/design/TOOLS.md 自述 1,722（`docs/core/design/TOOLS.md:1445` ∥ `:1697`），两处同标 2026-10-24 | 刷新 `:375` 读数，或标注「上一批读数，本批未复核」 |

**计数**：🔴 0 ∥ 🟡 3 ∥ 🔵 2（另一 🔵 并入上表 #3 说明）→ 实际列条 = 4 条（🟡×3、🔵×2 中的 #3 一条含两笔 .md）。
**计数（按行）**：🔴 0 ∥ 🟡 3 ∥ 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-10-24 会话内授权「自动跑」，本批设计评审轮 3 通过后按该授权进入实施（记录见 §3）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（三件落地（404 不熔断 + TTL 10 分钟 · 启动窗 25s + 冷启预算 · advisor 热生效 + D-ST18）；审计 1 轮 + 代码评审 2 轮（轮 1 五条 → 修轮 1 轮 → 轮 2 pass）；终态 clean；设计档漂移 D1–D7 见 §5 偏离项表）



**实施摘要**：三件按设计档落地（见下交付表）。代码面 6 档 + 批次单测档 1 档（收口随批删）；`advisor/loop.mjs` 零改（读面保留 promoted 语义）。

### 交付表（逐条对三件 + 判据格）

| # | 状态 | 需求点 | 落点（实读坐标） |
|---|---|---|---|
| ① | ✅ 完成 | 404 移出熔断 + 熔断限时 10 分钟 | `thincoder-core/tools/web-deepseek.mjs:31`（`TRIP_STATUS = new Set([401, 402, 403])`）· `:32`（`BREAKER_TTL_MS = 600_000`）· `:39-48`（WeakMap + 时钟缝 + `_resetDeepseekTransportForTest` 同复位时钟 · `_TRIP_STATUS_FOR_TEST`）· `:76-89`（`tripped` 到期删条目放行 / `trip` 写 `now + TTL`）· `:125`（熔断日志行携 `ttlMs`） |
| ② | ✅ 完成 | 浏览器启动窗 25s 可配 | `thincoder-core/browser/launch.mjs:34`（`START_TIMEOUT_MS = 25_000`）· `:35-44`（`browserStartTimeoutMs(env)`：`Number.isFinite(v) && v > 0` 才采纳 → 钳 `[2_000, 30_000]`；非法 ∥ 空 ∥ 0 ∥ 负值 ⇒ 25000）· `:159`（`launchBrowser` 缺省参数改调用） |
| ② | ✅ 完成 | 自启段不占动作预算（KD-26） | `thincoder-core/browser/queue.mjs:63-66`（`remaining()` 暂停期读暂停点）· `:69-75`（`pauseBudget()`）· `:77-83`（`resumeBudget()`）· `:86-93`（`extendBy`，`ms = 0` 也重挂）· `:15`（navigate 注释改「不含自启」）· `thincoder-core/browser/session.mjs:198-210`（`ensureSession` 冷启段暂停/恢复 + 失败腿恢复） |
| ③ | ✅ 完成 | advisor `timeoutMs` 热生效 | `thincoder-core/config.mjs:192-204`（`promoteAgentViews`）· `:369`（`loadConfig` 改调）· `thincoder-core/agent-tools/settings.mjs:139-181`（`_promotedAdvisorPath` / `_checkAdvisorTimeout` / `_checkKnownKeyValue` ⓪ 腿）· `:319-345`（null 腿 = 删嵌套 + 删副本、不 re-derive；子键 set = 键级同步；整段赋值 = promote 合并） |
| ③ | ✅ 完成 | D-ST18 写面拒非法 `timeoutMs` | `thincoder-core/agent-tools/settings.mjs:174-181`（只收 `null` ∥ 有限正数；拒绝句逐字）· `:167-170`（`agent.advisor.timeoutMs` ∥ `advisor.timeoutMs` ∥ 两个段名对象内同键） |
| — | ✅ 完成 | 批次单测档 | `docs/batches/2026-10-24-tool-timeouts.test.mjs`（17 例：T7×3 / T14 / T18 / T45 / T46 / T47 / T47b / T48 / 热生效三格 / guard 保值 / 整段赋值 / D-ST18；收口随批删） |

### 关键实现点（机制面）

- **熔断**：`WeakMap<agent, expiresAtMs>` 单域（search ∥ fetch 共享）；判活读时钟，到期 `delete` 并放行（改完 key 无需重启）；时钟缝 `_setDeepseekClockForTest(fn)`（缺省 `Date.now`），`_resetDeepseekTransportForTest()` 同时复位传输、时钟与熔断容器（成对，无第三缝）。
- **启动窗**：显式入参 ＞ env ＞ 缺省 25s；失败句 `Math.round(timeoutMs / 1000)` 回显生效秒数（既有插值点，零改）。
- **冷启预算**：自启窗口内 `ActionController` 的预算钟**暂停**（清 `_timer` + 记 `_pausedAt`），会话就绪后经 `extendBy(pausedMs)` 把暂停时长还给 deadline 并重挂；排队期照旧自入队起算。
- **写面**：`null` 腿 = 删嵌套同子键 → 删 promoted 副本同子键 → **不再 re-derive**（re-derive 会把 `config.advisor` 旧值带回）；子键 set = 只同步被写的键；整段赋值 = `promoteAgentViews` 合并语义（只覆盖不删除）；回填对象值 `structuredClone`（DEFAULTS 是共享常量，防别名）。

### 偏离项 / 设计档漂移（逐条给因由）

| # | 设计/任务书字样 | 实落 | 因由 |
|---|---|---|---|
| D1 | 「`queue.mjs` 加 `extendBy` + `session.mjs:489` 入口计量」（docs/core/design/BROWSER-TOOL.md §5 受影响面） | `queue.mjs:69-83` 加 `pauseBudget` / `resumeBudget` 一对（`resumeBudget` 经 `extendBy` 回补）；计量点 = `session.mjs:199-208`（`ensureSession` 冷启完成处） | `extendBy` 只在自启**结束后**加回 deadline，不能撤销自启窗口内已触发的中止：`type` / `snapshot` 15s 预算（`queue.mjs:28-29`）< 启动窗 25s ⇒ 慢机首动作仍在 `launch browser` 到点（正是 U62 要消失的旧句）。设计规则「动作时钟自会话就绪后起算」要求自启窗口内预算钟不裁决 ⇒ 暂停/恢复是规则的必要形。设计档坐标需同步（`:489` → `:199-208`；Δ ≈+28 而非 ≈+8） |
| D2 | 「子键 set：写嵌套后调 `promoteAgentViews(config)` 重 derive 副本」（docs/core/design/SETTINGS-TOOL.md §2.3） | 子键写后**只键级同步被写的键**（`settings.mjs:340`）；整段赋值腿仍调 `promoteAgentViews` | 整段 re-derive 会把嵌套面的同名默认值盖回运行面：`DEFAULTS.agent.advisor.guard = false` 经 `loadConfig` 并入 `agent.advisor` ⇒ 一次 `settings set agent.advisor.timeoutMs` 会静默关掉 `/advisor` 打开的会话级 guard，违反 §2.3「运行面独有的会话级键在合并中保留」 |
| D3 | 任务书验收 ①-c 要求用例断言 `_TRIP_STATUS_FOR_TEST` 导出 | `web-deepseek.mjs:48` 导出只读快照（`Object.freeze([...TRIP_STATUS])`） | 设计档 §6.23 ⑥/⑦ 未登记该导出（审计 🔵#1）——它是任务书验收要求的只读断言面、非缝；设计档补一行即可 |
| D4 | 设计 U63「首动作 = `navigate`」；墙钟 12s / 15s / 40s | 批测档 T48 用 `evaluate` + navigate 预算值（450ms 比例值）；墙钟按 100× 缩比 | 机制在控制器与入口计量，**不随动作类型分叉**；真 `navigate` 的真机抽样 = 集成档 I-BT3。已在批测档头 `:13-18` 书面披露 |
| D5 | docs/core/design/SETTINGS-TOOL.md §2.6 只列 `agent.advisor.timeoutMs` ∥ `advisor.timeoutMs` 两键 + `agent.advisor` 段 | `advisor` 段整段赋值也纳入 D-ST18 校验（`settings.mjs:168`） | 拒绝集 ⊆ 不可消费集（§2.9 判据）；同一类值两个入口两种结果 = 写面假承诺 |
| D6 | `promoteAgentViews` 公式 `{ ...config.advisor, ...config.agent.advisor }` | 非对象段不展开（`config.mjs:202`） | 手写 config.json 的畸形段（字符串）spread 会产出 `0/1/2` 垃圾键；读面对非法值「一律回退默认」（D-P3），本函数同口径 |
| D7 | 行数 Δ（设计档估算） | `settings.mjs` 315→360（+45）· `queue.mjs` 171→199（+28）· `session.mjs` 494→498（+4）· `launch.mjs` 189→200（+11）· `web-deepseek.mjs` 172→187（+15）· `config.mjs` 442→456（含另一在跑批次的 `bodyIdleTimeoutMs` 四行） | 设计档 Δ 列为估算；超出的部分 = 两条新机制（暂停/恢复、键级同步）与 why 注释。各档均 < 500 建议线（`session.mjs` 498，距 500 余 2 行，拆分触发条件已在档） |

### 测试读数（本轮实跑）

| 命令 | 读数 |
|---|---|
| `node --test docs/batches/2026-10-24-tool-timeouts.test.mjs`（cwd = 仓根） | **17 tests / 17 pass / 0 fail** |
| `cd thincoder-core && node test/run.mjs` | 6 个常驻档 **49 pass / 0 fail**；第 7 档 `test/unbooked-pen.test.mjs` 属另一在跑批次（未跟踪），其 import 的 `thincoder-core/agent/unbooked-pen.mjs` 当前不在盘 ⇒ `ERR_MODULE_NOT_FOUND`，非本批改动面（本批早段该套 57 pass / 0 fail） |
| `cd thincoder-cli && npm test` | 两个已跟踪档 **32 pass / 0 fail**；全量套现含另一批次的未跟踪 `test/integration/unbooked-pen.test.mjs` 三例失败（同因：该批次模块未落盘） |
| `node --check`（7 档） | 全 OK |
| 404 不熔断读数 | fetch 404 ⇒ transport 恰 1 次（不重试）；同一 agent 紧随 search ⇒ transport 第 2 次（未熔断） |
| 熔断 TTL 读数 | search 401 ⇒ 熔断；时钟 +599 999ms ⇒ transport 0 次；再 +2ms（越过 600 000）⇒ transport 1 次 |
| 冷启预算读数 | 自启 120ms + 动作 60ms / 预算 150ms ⇒ 完成（回补型旧形 ⇒ 150ms 到点）；自启 200ms > 预算 150ms ⇒ 完成（旧形 ⇒ `type timed out after 150ms (stuck in launch browser)`） |

### 审计与评审轮次

- **内部偏离审计（explore）**：1 轮 → VERDICT pass（0 🔴 / 0 🟡 / 3 🔵）。3 条 🔵 处置：`_TRIP_STATUS_FOR_TEST` 未登记 → D3；`session.mjs` 坐标 → D1；T48 替换 → D4。
- **内部 advisor 代码评审**：2 轮。
  - 轮 1：🔴1（冷启计量为事后回补——自启 > 动作预算仍到点）+ 🟡2（必须修：promote 重 derive 会静默关掉会话级 `advisor.guard`；`advisor` 段绕开 D-ST18）+ 🔵2（非对象段 spread 垃圾键；墙钟型用例脆弱）。
  - 修轮 1（同轮处置 5 条）：`pauseBudget`/`resumeBudget`（+ T47b 反例格）· 子键写面改键级同步（+ 真实装载形状用例）· `advisor` 段纳入 D-ST18 · `promoteAgentViews` 非对象段不展开 · 红侧断言去墙钟下界。
  - 轮 2（修复验证）：6 条全部 Fixed/Accepted，无新 🔴 → **VERDICT pass**。
- **终态**：`clean`（审计 1 轮 + 评审 2 轮 + 修轮 1 轮；无遗留 🔴/🟡）。

### 收口提示（父侧）

- 需求档 `docs/core/requirements/TOOLS.md` W4 与验收方向 ④ 已由主 agent 落（`:234` / `:255` 实读），代码未先于需求档。
- 设计档需按 D1 / D2 / D3 回改三处（`docs/core/design/BROWSER-TOOL.md` §5 受影响面与 §2.4 实现面坐标 · `docs/core/design/SETTINGS-TOOL.md` §2.3 子键腿口径 · `docs/core/design/TOOLS.md` §6.23 ⑥/⑦ 的 `_TRIP_STATUS_FOR_TEST` 一行）。
- 批次单测档收口随批删（`docs/batches/2026-10-24-tool-timeouts.test.mjs`，零留存）。

### 补轮：F34 常驻集成验收（3 档 9 例 · 2026-10-24）

**缘起**：三件（404 不熔断 · 启动窗可配 · advisor 超时热改）原验收宿主 = 批次单测档，收口即删；本补轮按三份设计档的「集成测试设计（F34）」段落常驻用例。判据源 = `docs/core/design/TOOLS.md` §6.23 末 · `docs/core/design/BROWSER-TOOL.md` §11 · `docs/core/design/AGENT-PARAMS.md` §6.2 末。

#### 交付（三档 · 常驻 `npm test`，不随批删）

| 档 | 行数 | 场景 |
|---|---|---|
| `thincoder-cli/test/integration/web-backend-404.test.mjs` | 109 | I-WB1–I-WB3 |
| `thincoder-cli/test/integration/browser-start-window.test.mjs` | 119 | I-BT1–I-BT3 |
| `thincoder-cli/test/integration/advisor-timeout-hot.test.mjs` | 142 | I-AP1–I-AP3 |

#### 逐例判据与红/绿读数

| # | 判据（业务可观察） | 退实现红读数 | 绿读数 |
|---|---|---|---|
| I-WB1 | 404 后 fetch 回执 = fixture 正文；同一 agent 的 search 以 `1. [deepseek]` 起头、DeepSeek 替身 search 命中 1 次、无 `(deepseek ` 提示行 | `TRIP_STATUS` 加回 404 ⇒ 红：search 回落 bing（`1. [bing] …` + `(deepseek backend unavailable — results from bing)`） | ✅ 绿 |
| I-WB2 | 401 后 fetch 回落本地直取成功；search 零上游命中、≤10s 结算、回落 bing 承接 | 本批不改该路径（批前 401 已熔断）⇒ 退实现同绿；守点是回归面 | ✅ 绿 |
| I-WB3 | 无渠道回执与固定基准逐字相等、零 `(deepseek …)`、替身零命中 | 本批不改该路径 ⇒ 退实现同绿；守点是零变化面 | ✅ 绿 |
| I-BT1 | env=2000：失败句 `within 2s`；二次同句、非 `session is already running` | `START_TIMEOUT_MS=12_000` + 不读 env ⇒ 红：两断言均报 `within 12s` | ✅ 绿 |
| I-BT2 | 不设 env：失败句 `within 25s`、无 `within 12s` | 同上 ⇒ 红：实际 `within 12s` | ✅ 绿 |
| I-BT3 | 真 Chromium 首动作 navigate：回执 `[navigate]` + 页摘（标题 ∥ `link "next"`）；若超时，卡点非 `launch browser`；无 Chromium skip 并打印 | 真机快启（本机 ≈1.5–2.5s）< 12s/45s 两形都放行 ⇒ 退实现同绿；设计 §11 已声明墙钟半不入门 | ✅ 绿（本机 Edge） |
| I-AP1 | set 3000 后下一次评审 ≈3s 结束带 `Advisor: review timeout after 3s.`，同进程零重启 | 关 promoted 同步 ⇒ 红：运行读面仍 900000（断言 900000 !== 3000） | ✅ 绿 |
| I-AP2 | set null 后两视图均无该键；同一 5s 流跑完 ≥4s、无超时尾 | 关 null 腿副本删除 ⇒ 红：运行读面仍有该键 | ✅ 绿 |
| I-AP3 | set abc 被拒（点名键 + `null ∥ 有限正数`）；get 读回 3000、两视图与磁盘未污染 | 关 D-ST18 校验 ⇒ 红：Missing expected rejection | ✅ 绿 |

**红法（零 git）**：三档实现文件先复制到 `.thincoder/tmp/` 留底 → 最小改动退实现 → 跑红 → 备份写回 → `read` 逐行比对 + 字节数一致（`web-deepseek.mjs` 9979 · `launch.mjs` 11478 · `settings.mjs` 20069）；备份已删，产品代码零净改动。

#### 验证读数

| 命令 | 读数 |
|---|---|
| `cd thincoder-cli && node --test test/integration/<三档>` | **9 tests / 9 pass / 0 fail**（8.5s） |
| `cd thincoder-cli && node test/run.mjs` | **44 tests / 44 pass / 0 fail**（13–14s；35 → 44 = 新增 9 例，两层 glob 收集） |
| `node --check`（3 档） | 全 OK |

#### 审计与评审

- **内部偏离审计（explore）**：1 轮 → VERDICT pass（0 🔴 / 0 🟡；仅全量读数采信父侧声明）。
- **内部 advisor 代码评审**：1 轮 → VERDICT pass（0 🔴 / 2 🟡 可选 / 5 🔵）。
  - 已处置：I-BT3 档头诚实化（KD-26 快机不可证伪 + 环境红残差登记）；I-AP1/2 上界收紧（4.5s / 10s）使上界能区分「超时停」与「跑完 5s 流」；I-WB1 装饰性否定断言换成可违反的 `(deepseek ` 提示行断言；I-AP3 恒真零请求断言换成磁盘零变化读数；I-BT1 不可达否定断言加注释说明可达条件。
  - 未改产品代码：T47/T48 的墙钟半按设计不入门。
- **终态**：`clean`（审计 1 轮 + 评审 1 轮；无遗留 🔴 / 🟡 必改）。

#### 偏离项 / 漂移

1. **三例红侧不可由退实现复现**（I-WB2 / I-WB3 / I-BT3）：本批未改其路径（401 熔断、无渠道零变化、真机自启预算），或真机耗时不足以触发旧形——按父侧口径如实登记，不造假分支。
2. **设计档行号漂移（归 eng-designer）**：`docs/core/design/BROWSER-TOOL.md` §11 引 `launch.mjs:166`（`child.exitCode !== null` 支）与 `:168`（失败句），现盘为 `:177` / `:179`（`:160` / `:163` → `:171` / `:174`），Δ+11 = 本批 `browserStartTimeoutMs` 段（`:40-44`）新增行。评审 🔵#7，未改设计档（非本席笔）。
3. 产品代码零净改动；批内单测档 `docs/batches/2026-10-24-tool-timeouts.test.mjs` 未触碰（收口随批删）。

## §6 验证与收口（父代理）

## 验证与收口

**父侧独立复核**

| 项 | 读数 |
|---|---|
| core 全量（收口后） | **33 pass / 0 fail** |
| cli 全量（收口后） | **15 pass / 0 fail**（全部为集成用例） |
| 批内单测读数（删前实跑） | **17 pass / 0 fail** |
| 集成用例 | 三档 9 例 · 全部通过 |

**批内单测档处置**：`docs/batches/2026-10-24-tool-timeouts.test.mjs`（356 行 · 17 例）已**删除**。

**集成用例落点**：`thincoder-cli/test/integration/` 三档 —— `web-backend-404.test.mjs`（I-WB1–3）· `browser-start-window.test.mjs`（I-BT1–3）· `advisor-timeout-hot.test.mjs`（I-AP1–3）。

**红侧诚实登记**：I-WB2 / I-WB3 / I-BT3 三条**退实现后仍绿**（本批未改其路径，或真机快启不足以触发旧形）。未造假分支，如实记。这三条的价值是**回归守点**，不是本批的证伪证据。

**设计档同步**：`docs\core\design\BROWSER-TOOL.md` §2.4 机制句改为 `pauseBudget`/`resumeBudget`（原 `extendBy` 回补型不能替代暂停）；`docs\core\design\SETTINGS-TOOL.md` §2.3 三条腿各写一句；`docs\core\design\TOOLS.md` §6.23 补 `_TRIP_STATUS_FOR_TEST` 只读断言面。

**未决项**：无。
