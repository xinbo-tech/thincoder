# 2026-10-24 · 工具面三处超时与熔断：404 不熔断 · 浏览器启动窗可配 · advisor 超时可热改
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = Gitee IKQ2KZ（404 误熔断 Web 后端）· IKP6ZI（浏览器启动窗 12s 写死）· IKJPNU（advisor timeoutMs 热应用不生效）。用户 2026-10-24 17:31 要求并行处理。
> 台账 = #1751（归批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
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
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
