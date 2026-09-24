# 2026-09-25 · conflict-escalation-probe
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 05:44「矛盾任务书探针可以做」——承 #293 个案（mimo-v2.6-flash 绕圈/被戳才上抛 vs deepseek-flash 3/3 即时上抛）+ 05:43 裁定「模型不能限制」（本探针 = 测量面，非门控）。
> 台账 = #294（MODEL-BENCH.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 批件与授权（父侧 · 2026-09-25 05:45 · 台账 #294）

**来源**：用户 05:44「**矛盾任务书探针可以做**」——承 #293 讨论链（05:35 观察「弱模型撞矛盾要求反复权衡不上报」→ 05:41 个案实证 → 05:43 裁定「模型不能限制，还是在提示词方向做工作」）。

**要义**：本探针 = **测量面 · 非门控**（不按模型设岗 / 不改配置默认——承用户 05:43 裁定）；用途 = ① 子代理模型选型参考；② **#293 提示词修法的验证面**（探针建成后对新旧提示词各测）。

### 1.2 动因证据（个案 · as-of 05:41）

- **mimo-v2.6-flash**（VSC 侧会话的 eng-designer#1）：≈04:38 起跑 → 05:18 读数 = turn 60/180 · **零落盘** · grep/read 原地循环（越其人格档首版预算 ≤15 回合 **4×**）→ 被外部戳一句才上抛决策级 ask → 05:41 仍在跑。
- **同夜同提示词反证**：deepseek-flash 子代理 **3/3** 即时正确上抛（#79 AC-6 裁定请求 · #84 抓派单矛盾 · #78/#80 上抛族）。
- ⇒ 需要**可重复**的行为测量：构造矛盾任务书 → 驱动子代理 → 观测（是否上抛 / 首次上抛回合序 / 绕圈无落盘 / 静默自选一方 / 拖到收尾报告）。

### 1.3 范围与边界

- **做**（全部归设计轮实读后定形）：探针 harness 形态（跑在哪层：bench `run.mjs` 族 / core spawn API / headless CLI——实读后定）· 「矛盾」形态族（要求互斥 / 任务书 vs 设计档相抵 / 范围相抵……）· 判据与读数面（机械可判优先，judge 兜底）· 报告形态（与 bench 报告家族对齐）· 成本上界与可重复性 · 与现有 `--models/--dims` 族的集成关系。
- **不做**：模型门控 / 配置默认改动 · 既有 bench 判分合同与 suiteVersion 面（除非设计轮自证必要）· `model-specs.mjs`（并行 VSC 批在写）· 提示词内容（#293 批的笔）· 其他面零触。
- **与 #293 关系**：探针建成后对新旧提示词各测 = 其修法的测量面（设计输入，不硬绑排序）。

### 1.4 授权

05:05「自动跑完吧」全链授权**沿用**（设计评审点火 / §4 代签 / 修正·实施派发 / 收口核销提交推送）+ 本回合定向（「可以做」）。父侧自缚同本夜各批（代签三条件 / 复评再出 🔴 即停 / 验证不过即停 / 需新范围即停）。

### 1.5 设计轮上抛裁定 + 需求五要素落笔（父侧 · 2026-09-25 06:0x）

**上抛 4 项裁定（全采纳 · 设计侧判定维持）**：

1. **judge.json A 位复用（只读取）= 采纳**——零改动，不触「既有判分合同零动」✓；探针自持槽不必另起。
2. **排序建议（探针先行 · 基线轮在 #293 提示词落地前）= 采纳，并升级为派发序约束**：`#294 实施（落码 + dry-run）→ #294 基线实弹（随批自动跑）→ #293 提示词落地 → #294 复测`——基线只在改动前可采（`promptsDigest` 为对照锚）；两链其余环节并行不互等。
3. **实弹轮点名触发 = 采纳**（实施轮身份 = 落码 + 测试 + `--dry-run`；真实跑批 = 点名制，同 v5 口径）。
4. **逐字分工（D2 单源 = 设计档 §10.4 / §10.5；§2 只索引）= 采纳**——不复制（D2 单源纪律；实施轮任务书以 §2 索引 + 设计档正本为准）。
   - 附（微项）：设计档 §10 头注范围句「§1.1–§1.4」随本 §1.5 延伸为 **§1.1–§1.5** —— 下次触碰设计档时同步（不另开轮）。

**需求五要素落笔（父侧笔 · 承 §2.6-3 草案）**：

- **模块目标**：给子代理模型选型与提示词修法提供**可重复的「矛盾上抛行为」测量面**。
- **功能点**：三族夹具冻结（`p1` 要求互斥 / `p2` 任务书与设计档相抵 / `p3` 范围相抵）· 进程内 spawn 驱动（父面零 LLM）· 机械读数 11 字段 + 行为类 6 类 · judge 兜底（A 位单发）· 报告对落档（`probe-` 前缀 + `kind` / `probeVersion`）· 成本三闸（cap / 墙钟 / `--max-cost`）。
- **边界**：非门控 · 不动配置默认 · 不动提示词与 `model-specs.mjs` · 不动既有判分合同与版本轴（`SUITE_VERSION` / `judge.json` / `cases/` / `run.mjs`）· 实弹随批自动跑（成本受三闸约束）· 不进 CI。
- **验收**：AC-1..AC-10（设计档 §6 本批回指 `MODEL-BENCH.md:1366`）。
- **依赖**：核 spawn 面（`buildSpawnChild` / `runChildPipeline` / `notify_parent` 队列）+ `bench/models.json` / `prices.json` / `judge.json` + #293 批（对照面）。

**评审**：设计评审代点火（05:05 全链授权 + 05:44 定向）——对象 = 设计档 §10 全节 + 批档 §2。

### 1.8 用户裁定：实弹不再点名——随批自动跑（2026-09-25 06:24）

**用户原话**：「啥时候不调模型不花钱？用得着跟我这么装吗？」

**裁定**：

1. **「实弹轮点名制」废止**——模型调用 / 成本支出 = 全流程常态（子代理 / 评审 / 实施每一步皆然，均在既有授权内）；**不得把「本轮会花钱」单独拎出来做点火仪式**。
2. **实弹轮（#294 基线轮及其后复测轮）随批自动跑**；成本安全靠**预算闸**（`--max-cost` / cap / 墙钟——设计三闸）而非重新问人。
3. 本批 §1.5 上抛 3 与 §2.6-2 的**点名条款作废**；派发序中「基线先于 #293 落地」**保留**——那是 A/B 正确性（对照锚），非许可门。
4. **迁移面**：本裁定适用后续各批——成本不设点火山头；成本读数照常入报告（透明）。
5. 残余「点名」措辞（§1.5 边界行等）随本裁定收正（父侧直接执行 · 可 revert）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-09-25（探针 §10 落档 + 评审轮 1 修正 12 条（#1–#12）+ 轮 2 残余 2 条（#13/#14）落实——机检闸态零新增；本批 = 设计轮（零实现））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 本批范围（一句）

台账 #294：建**可重复的「矛盾任务书上抛行为」探针**——构造矛盾任务书 → 进程内驱动一个 eng-designer 子代理（真实模型）→ 观测（是否上抛 / 首次上抛回合序 / 绕圈无落盘 / 静默自选一方 / 拖到收尾报告）→ 产出测量读数（子代理模型选型参考 + #293 提示词修法的验证面）。**非门控**（不按模型设岗 / 不改配置默认——用户 2026-09-25 05:43 裁定）；**本批 = 设计轮（零实现）**；设计正本 = `docs/core/design/MODEL-BENCH.md` §10（新面 · `:1500` 起）。

### 2.1 本批条目（覆盖）与设计落点（逐条 = 派单七条 + 边界）

| # | 条目（派单 / 需求面） | 设计结论（一句） | 设计落点 |
|---|---|---|---|
| 1 | 探针形态（矛盾构造 / 驱动方式 / 每轮成本上界） | 三族夹具逐字冻结（`p1` 要求互斥 / `p2` 任务书与设计档相抵 / `p3` 范围相抵）；驱动 = 进程内核心 spawn API（父面零 LLM · 沙箱 cwd）；成本上界 = 单 run ≤ `--max-turns + 1` 次调用（cap 40）× 单 call 输出 ≤ 4096 tokens + 墙钟闸 + 全局 `--max-cost` | `MODEL-BENCH.md:1518`（§10.3）· `:1542`（§10.4）· `:1648`（§10.8 成本上界句） |
| 2 | 判据与读数面（机械优先 / judge 兜底边界 / 与 bench 报告家族对齐） | 机械读数 10 字段 + 行为类表 5 类（含反例信号列）；judge 兜底 = 仅无 ask run 的报告面 1 bit 分类（A 位单发 · 失败 null + warning · 不套级联）；报告对段名 / 结构同 §2.3 家族 | `:1602`（§10.5）· `:1631`（§10.6）· `:1639`（§10.7） |
| 3 | 可重复性与集成（与 `--models` / `--dims` 族关系 / 夹具确定性 / 结果落档） | **独立 runner**（`bench/probe.mjs`（拟新增））——复用名单解析 / 价格 / 落档面 / 脱敏；**不并入** `run.mjs` 的 `--dims` / `--n` 合同与 `SUITE_VERSION` 轴；夹具三层同源逐字冻结；落档 = `bench/results/<日期>-probe-<标签>.{md,json}`（前缀强制 + `kind` / `probeVersion`） | `:1500`（§10 头注）· `:1512`（§10.2）· `:1639`（§10.7）· `:1648`（§10.8） |
| 4 | 与 #293 的排序 | 建议**探针先行（建设 + 基线轮）→ #293 提示词落地后复测**——基线只能在改前采（`promptsDigest` 为对照锚）；**不硬绑**（若先改提示词 ⇒ 基线改采「改后」单点，差分面如实登记留空） | `:974`（KD-45）· 本节 §2.6（报告面） |
| 5 | AC + 受影响文件表 + 行数预算 + 测试面 + 需求侧建议 | AC-1..AC-10（§6 回指块）；受影响文件表 = §3 本批表（新增 10 档 + README +8 ±4）；测试面 = 结构级 + 行为级（`--dry-run` 全链路）；三包零新增例 / `bench/test/` ≤ +16 例 | `:1366`（§6）· `:903`（§3 本批表）· `:1674`（§10.10）· 本节 §2.3 / §2.4 |
| 6 | 上抛（探针形态与既有 bench 合同相抵 / 需动 core 机制面 / 成本失控） | **零相抵**：判分合同 / `SUITE_VERSION` / `judge.json` / `bench/cases/` / `run.mjs` 全零动；**不需动 core 机制面**（全部为核既有导出的进程内直调）；成本有界（cap + 墙钟 + `--max-cost` 三闸）+ 实弹轮随批自动跑（§1.8） | `:1500`（§10 头注）· `:1518`（§10.3-6 / -7）· `:1648`（§10.8） |
| 7 | 边界（不做） | 模型门控 / 配置默认 / `thincoder-core/model-specs.mjs` / 提示词内容 / 既有判分合同与 suiteVersion / 其他面——全零触；探针不写用户 config / 不写台账；不进 CI | `:1403`（§7-18…-20）· `:1669`（§10.9） |

**明确不在本批**（边界声明）：模型门控与配置默认（用户 05:43 裁定）· `thincoder-core/model-specs.mjs`（并行 VSC 批在写）· 提示词内容（#293 批的笔）· 既有 bench 判分合同 / `SUITE_VERSION` / `bench/cases/` / `run.mjs` CLI 合同 · core 机制面（零改动）· **实弹跑批**（随批自动跑——§1.8；出本批实施轮范围）。

### 2.2 机制设计（正本 = 设计档 §10；本节只给裁定口径与边界）

1. **驱动路径（KD-41）**：进程内直调核单点——`buildSpawnChild(...)`（`thincoder-core/agent-tools/subagent-spawn.mjs:201`；`wantAsync = true` ⇒ 返回注取**异步形**）+ `runChildPipeline(...)`（`thincoder-core/agent-tools/subagent-async.mjs:305`；与真实 `subagent` 工具 spawn 同管道）；父面 = 合成 parent（零 LLM · depth 0 · `autoApprove`）；child = eng-designer 人格 + depth 1（家族段含 `notify_parent`）。
2. **观测面（探针自持夹具）**：回合帧 = `⟦ev⟧turn` 事件 / `child._currentTurn`；工具序列 = `ctx.callbacks.onToolCall`（relay 前缀）+ childOpts 直挂 `onToolResult`（原始工具名）；上抛 = `parent._childUpstream` 的 `kind="ask"` 条目（`note` 不计）；落盘 = 沙箱树前后 diff（KD-43）；记账 = `childOpts.onUsage` + 墙钟。
3. **停止条件（KD-42）**：首次 ask **已入队** ⇒ 终止该 run（`terminal = "asked"`；判据时点 = `onToolResult` 收口——不在 `onToolCall` 前时点 abort）；无 ask ⇒ `completed` / `cap`（撞帽拒绝降级） / `timeout`（墙钟）；运行异常 ⇒ `error`（逐 run 记，不杀全批）。
4. **读数与类表**：10 字段（`firstAskTurn` / `askMessage` / `turnsUsed` / `terminal` / `firstWriteTurn` / `mutatorCalls` / `landedFiles` / `reportHead`·`reportLen` / `reportFace` / `metrics`）+ 行为类 5 类（`escalated` / `silent-landed` / `silent-reported` / `spun` / `timeout`·`error`）+ 反例信号列——**逐字正本 = `MODEL-BENCH.md:1602`（§10.5）**，本段不复述（D2）。
5. **夹具（逐字正本 = `MODEL-BENCH.md:1542`（§10.4））**：`p1` 要求互斥（同段内互斥 · 零勘察可见）/ `p2` 任务书引述 vs 档内正本相抵（须读档确认）/ `p3` 范围 vs 验收相抵（须复扫确认）；每族 = 任务书逐字 + 沙箱树（沙箱内相对路径 · 探针运行时物化 · **非本仓文件**）+ 沙箱批次档骨架（三族同形）。
6. **judge 兜底（KD-44）**：无 ask run ⇒ `judge.json` A 位单发（`allowed = surfaced|buried|unclear`）+ 冻结 rubric；失败 ⇒ `reportFace = null` + warning（不阻断、不级联）。
7. **版本轴**：`PROBE_VERSION` 单源（夹具 / 判据 / 停止条件 / rubric / 参数口径变化 ⇒ +1；呈现面不 bump）；`SUITE_VERSION` / `frozenAtSuiteVersion` 零触（本面不参与既有版本轴）。
8. **参数面与提示词锚（KD-45）**：逐档条目经 `bench/lib/params.mjs:30`（`buildProviderEntry`）覆写（temperature 缺省 0 / roster 例外 + KD-32 中档 effort）；`promptsDigest`（三槽文件摘要哈希）逐 run 入档——#293 两轮对照的锚。

### 2.3 受影响文件与测试面（正本 = 设计档 `MODEL-BENCH.md:903`（§3 本批表））

- **新增档 10 个（全部拟新增）**：`bench/probe.mjs`（~140）· `bench/probe/fixtures.mjs`（~230）· `bench/probe/driver.mjs`（~250）· `bench/probe/sandbox.mjs`（~90）· `bench/probe/classify.mjs`（~120）· `bench/probe/judge-report.mjs`（~90）· `bench/probe/report.mjs`（~190）· `bench/test/probe.test.mjs`（~240）· `bench/test/probe-fixtures.frozen.mjs`（~120）· `bench/test/probe-report.test.mjs`（~150）。
- **现有档**：`bench/README.md` 219 → +8 ±4（探针节）；`docs/core/design/MODEL-BENCH.md`（本档 · 设计轮就地更新至 1805 行）。
- **拆分触发**：新档 >300 行 ⇒ 就地拆点（`driver.mjs` >280 ⇒ 拆 `bench/probe/driver-spawn.mjs`（拟新增）；测试档 >280 ⇒ 拆两份）——预算全部 ≤300（500 硬限不触）。
- **测试面（探针自身）**：结构级（夹具三层同源逐字等值 / `PROBE_VERSION` 单源 / 类表逐态 / 字段在场）+ 行为级（`--dry-run` 全链路：假 child 三形态 + 判官三态 + 报告对产物）+ 沙箱 diff 三态 + 成本闸 + 落档面四腿；**例数预算 = 三包（core / CLI / VSC）零新增例；`bench/test/` 现 11 档 / 92 例 ⇒ 本批 ≤ +16 例（≤108）**。
- **零改动面**：`bench/run.mjs` · `bench/cases/**` · `bench/judge.json` · `bench/models.json` · `bench/prices.json` · 三端产品树——判分合同、版本轴、`model-specs.mjs`、提示词全零触。

### 2.4 验收对照（AC-1..AC-10 · 正本 = 设计档 §6 本批回指 `MODEL-BENCH.md:1366`）

| AC | 判据 | 判定方式 |
|---|---|---|
| AC-1 | 夹具三层同源逐字（可重复） | 测试逐字等值 + `PROBE_VERSION` 单源断言 |
| AC-2 | 驱动面 = 真实 spawn 面（eng-designer / depth 1 / `notify_parent` / 同管道） | dry-run 装配腿 + 实跑遥测（读数入 §5） |
| AC-3 | 机械读数齐 + 行为类表（上抛判据 = `kind="ask"` 队列条目） | 脚本化假 child 三形态 + 字段在场断言 |
| AC-4 | 停止条件三态区分 + ask 入队时点收口 | 单测（三态 + 「未入队不记 ask」反例腿） |
| AC-5 | 沙箱隔离（真实仓零残留）+ 落盘 = 沙箱 diff | 单测（diff 三态）+ 实跑后 `git status` 零残留 |
| AC-6 | judge 兜底（单判三态 + 失败 null + warning 不阻断） | 桩传输三态 + 失败腿 |
| AC-7 | 落档形态（前缀强制 / 同名拒写 / 脱敏 / `kind` + `probeVersion`） | 单测 + dry-run 产物断言 |
| AC-8 | 成本上界与闸（上界式 + `--max-cost` ⇒ 余面 `skipped`） | 单测（假成本到顶腿） |
| AC-9 | 既有面零动（`SUITE_VERSION` / `judge.json` / `cases/` / `run.mjs` 判分合同；三端零改动） | 既有断言零改 + `git diff` 范围核对 |
| AC-10 | 测试全绿 + 例数预算 | `node --test "bench/test/*.test.mjs"` 全绿（读数入 §5） |

**本批（设计轮）自身验收**（派单四条）：① 七条逐条裁定 = §2.1 表（已落）；② 设计档收正在档 + 变更记录（已落）+ 批档 §2（即本段）；③ 机检零新增（悬空 4 / 行宽 8 基线——读数入 §2.7）；④ §2 状态行刷新（批次工具 status 面）。

### 2.5 关键决策（索引）

| KD | 决策（一句） | 落点 |
|---|---|---|
| KD-41 | 驱动路径 = 进程内核心 spawn API（父面零 LLM；异步形返回注；池不入） | `MODEL-BENCH.md:970` |
| KD-42 | 停止条件 = 首次 ask 入队即终止该 run（判据时点 = `onToolResult`） | `:971` |
| KD-43 | 落盘判据 = 沙箱 diff（实测）+ 写工具调用序列（尝试）双列 | `:972` |
| KD-44 | judge 兜底 = A 位单发；失败 null + warning（不套级联） | `:973` |
| KD-45 | 参数面沿 bench 口径 + `promptsDigest` 入档（A/B 对照锚） | `:974` |
| KD-46 | 落档 = 同一 `bench/results/` 家 + `probe-` 前缀强制 + `kind` / `probeVersion` | `:975` |

### 2.6 报告面（给主 agent / 用户）

1. **排序建议（#293）**：探针先行（建设 + 基线轮）→ #293 提示词落地后复测——理由：基线只能在改动前采集（`promptsDigest` 为对照锚）；提示词双源（运行面 + 正本）回退面大，事后补基线成本高。**不硬绑**：若父侧决定先改提示词，则基线改采「改后」单点、差分面如实登记留空。
2. **实弹轮**：实施轮只落码 + 测试 + `--dry-run`；真实跑批（触网 / 花钱）**随批自动跑**（成本受三闸约束）——点名制已废止（§1.8）。
3. **需求侧建议条目（父侧笔 · 五要素草案）**：模块目标 = 给子代理模型选型与提示词修法提供**可重复的「矛盾上抛行为」测量面**；功能点 = 三族夹具冻结 + 进程内 spawn 驱动 + 机械读数 / 行为类 + judge 兜底 + 报告对落档 + 成本闸；边界 = 非门控 / 不动配置默认 / 不动提示词与 `model-specs.mjs` / 不动既有判分合同与版本轴 / 实弹点名；验收 = AC-1..AC-10；依赖 = 核 spawn 面（`buildSpawnChild` / `runChildPipeline` / `notify_parent` 队列）+ `bench/models.json` / `bench/prices.json` / `bench/judge.json` + #293 批（对照面）。
4. **上抛项（供父侧裁）**：① judge 兜底复用 `judge.json` A 位（**只读取**）——设计侧判定 = 不触「既有判分合同零动」红线（零改动；如父侧另有读法，可改探针自持槽）；② 排序建议见 1（不硬绑）；③ 「夹具 / 判据逐字」分工——逐字正本住设计档 §10.4 / §10.5（D2 单源），本 §2 只承接索引（如父侧要求 §2 亦逐字复制，请示下，我可补）。

### 2.7 机检读数（设计轮）

`node scripts/doc-check.mjs`：**悬空 4 / 行宽 8 —— 与本批前基线逐项相同（零新增）**；本批新增引用全部为「（拟新增）」列报类（不入闸）。设计档 `docs/core/design/MODEL-BENCH.md` 设计轮就地更新：1571 → 1805 行（§10 新增 306 行 + §3 / §4 / §6 / §7 / §8 / 变更记录）。

### 2.8 设计轮自查收正（appended · 2026-09-25）

- **成本上界口径（§2.1 行 1 数字低估）**：call 数 ≤ **2 × `--max-turns`**——主体 run ≤ `--max-turns`；追问扩写轮（报告 < `MIN_REPORT_CHARS` 时启用）为**第二个 run**、上限同。**正本 = 设计档 `MODEL-BENCH.md:1667`（§10.8 成本上界句）**，以彼为准。
- **`turnsUsed` 口径**：= **最大观测回合帧**（`⟦ev⟧turn` 最大值；追问扩写轮为新 run、帧从其自身重数）——总调用数看 `metrics.calls`。正本 = `MODEL-BENCH.md:1610`（§10.5）。
- **本批（设计轮）自检四条**：① 需求五要素——批档 §1 现有四条（授权 / 证据 / 范围边界 / 授权链），**五要素式条目形态未成文**（本 §2.6-3 已给草案；落笔 = 父侧）——如实登记，不阻断设计；② 受影响文件表 + 行数预算 = §2.3（齐）；③ AC 逐条可机验 = §2.4（齐 · 10 条）；④ UI / 交互 = 设计档 §10.8 + §8-7（`open` 0 条）。

### 2.9 设计轮收尾读数（appended · 2026-09-25）

- **§2.7 数字收正**：设计档 §10 新增 = **183 行**（`:1500`–`:1682`）；全档总增 = 1571 → **1805** = +234 行（§10 + §3 本批表 + §4 KD-41…KD-46 + §6 AC 块 + §7-18…20 + §8-7 + 变更记录 1 条）。
- **机检终读**：`node scripts/doc-check.mjs` —— 悬空 **4** / 行宽 **8**（与本批前基线逐项相同；本批新增引用全为「（拟新增）」列报类，不入闸）。
- **笔触面**：仅两档——`docs/core/design/MODEL-BENCH.md`（M）· `docs/batches/2026-09-25-conflict-escalation-probe.md`（本档 · 新增）。

### 2.10 设计评审轮 1 修正（appended · 2026-09-25）（12 条逐号落地）

**对象** = `docs/core/design/MODEL-BENCH.md` §10 + §3 表 + §6 + §7-20 + 变更记录 + 本档 §2（本段）。**轮次** = fix（定点 12 条——先实读复核后落笔）；**零扩面**：`thincoder-core/**` / `bench/**` / 提示词面 / 本档 §1 / §3 段零触（§1 无笔、§3 他笔）。

**12 条逐号落地表（号 → 处置 → 落点——设计档坐标 = 修正后现读）**：

| # | 严重度 | 处置（一句） | 落点 |
|---|---|---|---|
| 1 | 🔴 | `skipped` 态三处补全（§10.3-6 / §10.5 `terminal` / 类表 = 6 类）+ `aggregate` 口径定形（`n` = 实跑数 · 分母排除 · 新增 `skipped` 计数） | §10.3-6 · §10.5 · §10.7 · §10.10 · §6 AC-8 |
| 2 | 🟡 | 沙箱根 = **仓外系统临时根**（二选一裁定；被否：仓内）——§7-20 / §10.9-② 同步 + 路径入档口径新设（§10.7） | §7-20 · §10.7 · §10.9-② · §10.10 |
| 3 | 🟡 | AC-2 / AC-5 分段（实施轮零网络腿 / 实跑腿点名轮补记）+ 装配腿入 §10.10 结构级 + dry-run 形态钉死 | §6 AC-2 · AC-5 · §10.10 · §10.8 |
| 4 | 🟡 | `silent-landed` 判据改挂目标件：`targets` 集逐族冻结 + `landedFiles[].target` + 类表 / md 列 | §10.4 · §10.5 · §10.7 |
| 5 | 🟡 | §10 头注射程 → §1.1–§1.5 | §10 头注 |
| 6 | 🔵 | §2.1 行 1 成本上界数字对齐（见下行「§2.1 数字」） | 本段 |
| 7 | 🔵 | 追问扩写轮记账分区：`firstAskTurn` / `turnsUsed` 只取主体 run + `continuation` 单列 | §10.5 |
| 8 | 🔵 | 父面 provider = 抛错桩（零 LLM 可机检） | §10.3-1 |
| 9 | 🔵 | `.gitignore` 现盘复核 = **已覆盖**（`.thincoder/tmp/` 条目在册）；沙箱根改仓外后该前提不再承重 ⇒ 受影响表**无需**新增行 | 本段（受影响表零改） |
| 10 | 🔵 | effort 表达式语义钉死（`?? null` = 键不落条目 ⇒ 沿 base 原值；与 KD-32 / `pipeline.mjs:183` 同式） | §10.3-4 |
| 11 | 🔵 | AC-1 机检形式写明 = 两层机检（运行面 ↔ 冻结副本）+ 设计档正本层 = 写定时纪律 | §10.2 · §10.10 · §6 AC-1 |
| 12 | 🔵 | 实施轮任务书加行（见下行「实施轮行」） | 本段 |

**§2.1 数字（#6）**：§2.1 行 1「单 run ≤ `--max-turns + 1` 次调用」以 **§2.8 / 设计档 §10.8 成本上界句** 为准 = **≤ 2 × `--max-turns`**（主体 run ≤ `--max-turns` + 追问扩写轮第二个 run、上限同）。本档 = append-only（批档工具不改写既有行）⇒ 就地改字面不可为，落本修正块。

**计数收正（随 #1 / #4 / #7）**：机械读数 10 → **11 字段**（+`continuation`）；行为类 5 → **6 类**（+`skipped`）——正本 = 设计档 §10.5。§2.2-4 / §2.1 行 2 的「10 字段 / 5 类」字面为 append-only 面、不可就地改，以本段为准；**§1.5（`:44`）同数字 = 需求面（父侧笔）**——提请父侧随动。

**实施轮行（#12）**：实施轮开工先**现盘复读全部被引坐标**（`thincoder-core/**` · `bench/**`），漂移按实况登记。本修正轮抽检读数（均与文相符）：`thincoder-core/agent.mjs:60` · `:141-145` · `:215-216` · `:222-224`；`thincoder-core/agent-tools/subagent-spawn.mjs:201` · `:397`；`thincoder-core/agent-tools/subagent-async.mjs:139` · `:151-155` · `:305`；`bench/lib/params.mjs:30-34`；`bench/lib/pipeline.mjs:183`；`bench/lib/client.mjs:47` · `:78`。

**机检读数（修正轮复跑）**：`node scripts/doc-check.mjs` —— **悬空 6 / 行宽 11**（全仓现盘；与本轮开工前读数逐项相同 = **零新增**）。注：批件所称基线「悬空 4 / 行宽 8」与现盘 6 / 11 有差——差项落**他档在飞改动**（`BATCH-RECORD.md` / `MODEL-SPECS.md` / `PROMPT-SYSTEM.md` / `SESSION.md` / `TOOLS.md` 的既有超宽 / 悬空项——非本批触碰面）；本批两触碰档（设计档 + 本档）逐项零新增。

**笔触面**：设计档 `docs/core/design/MODEL-BENCH.md`（§10 + §3 表 + §6 + §7-20 + 变更记录）+ 本档 §2（本段 + 状态行刷新）。

### 2.11 设计评审轮 2 残余落地（appended · 2026-09-25）（2 条逐号）

**对象** = 设计档 `docs/core/design/MODEL-BENCH.md` §10.5 头注（#14）+ 本档 §2 指针面（#13）。**轮次** = fix（定点 2 条——承 §2.10 修正块；先实读复核后落笔）；**零扩面**（提示词面 / `thincoder-core/**` / `bench/**` / 本档 §1 / §3 段零触）。

**2 条逐号落地表（号 → 处置 → 落点）**：

| # | 严重度 | 处置（一句） | 落点 |
|---|---|---|---|
| 13 | 🔵 | §2 内设计档行号指针 = 修正前坐标（append-only 面不可就地改）⇒ 自本行起 **§2 内设计档行号指针以现盘复读为准**；四处现盘值逐处实读登记（见下行） | 本段（记录面声明） |
| 14 | 🔵 | §10.5 头注明示例外：`skipped` run = 未执行 ⇒ 记 `terminal` / `behaviorClass` = `skipped`，其余字段一律 null——消解与类表（`:1641`）/ §10.10 逐态腿（`:1699`）的字面张力 | `MODEL-BENCH.md:1616`（半句就地改）+ 变更记录（`:1834`–`:1835`） |

**#13 · 四处指针现盘值（本次逐处实读复核——不按位移推算）**：

1. 本档 `:133`（§2.8）「正本 = 设计档 `MODEL-BENCH.md:1667`（§10.8 成本上界句）」→ 现盘 **`:1687`**（该句；§10.8 节 = `:1668` 起）。
2. 本档 `:134`（§2.8）「正本 = `MODEL-BENCH.md:1610`（§10.5）」→ 现盘 **`:1622`**（`turnsUsed` 行）。
3. 本档 `:63`（§2.1 行 1）「`:1518`（§10.3）· `:1542`（§10.4）· `:1648`（§10.8 成本上界句）」→ 现盘 **`:1519`**（§10.3 节）· **`:1547`**（§10.4 节）· **`:1687`**（§10.8 成本上界句）。
4. 本档 `:78`（§2.2-4）「逐字正本 = `MODEL-BENCH.md:1602`（§10.5）」→ 现盘 **`:1614`**（§10.5 节 = `:1614`–`:1644`）。

**机检读数（本次复跑）**：`node scripts/doc-check.mjs` —— 悬空 **6** / 行宽 **11**（全仓现盘，与开工前读数逐项相同——**闸态零新增**；悬空 6 全落他档在飞改动：`MODEL-SPECS.md` ×2 / `SESSION.md` ×1 / `TOOLS.md` ×3）。报告面（不入闸）MODEL-BENCH.md 符号行 +2（`behaviorClass`@`:1616` / `:1834`——#14 正名引入）。

**笔触面**：设计档 `docs/core/design/MODEL-BENCH.md`（§10.5 头注半句 + 变更记录 1 条）+ 本档 §2（本段 + 状态行刷新）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象：设计档 `docs/core/design/MODEL-BENCH.md` §10（:1500–:1682）+ KD-41…46（:970–975）+ §3 本批表（:903–921）+ §6 AC 回指（:1366–1379）+ §7-18…20（:1403–1405）+ §8-7（:1419）+ 变更记录（:1802–1804）；批档 §2（§2.0–§2.9）。行号为本次实读坐标。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / 读数契约 | 🔴 | 「成本闸到顶 ⇒ 余面 `skipped`」在三处生效行出现（`MODEL-BENCH.md:1661` §10.8 · `:1377` AC-8 · `:1679` §10.10），却不在两处冻结定义中：§10.3-6 停止条件（`:1539`）与 §10.5 `terminal`（`:1611`，`asked/completed/cap/timeout/error`）均无该态，行为类表（`:1619–1627`）亦无对应类；§10.7 JSON（`:1643–1644`）由 §10.5 字段 + `fixtureId` 与 `aggregate{asked,n,firstAskTurnMedian,spun,landed,costCny}` 构成 ⇒ `skipped` 无落位，且 `asked/n` 分母口径（`n` = 计划面还是实跑面）未定——闸门截断轮次会被读成「上抛率下降」（既有 bench 侧同态必配记录位 + 聚合排除句：`:209` / `:251` / `:284–286`）。 | 把 `skipped` 补入 §10.3-6 与 §10.5 的枚举 / 类表（或明确「余面不入 `runs[]`、只作告警」），并定义 `aggregate` 口径（`n` = 实跑数 · 上抛率分母排除 `skipped`）。 |
| 2 | Consistency（沙箱面） | 🟡 | 同机制两处相抵：§7-20（`:1405`）定沙箱目录 = 「`.thincoder/tmp/` 下 · gitignored」（仓内相对形态；本档即以该形态使用：`:643` / `:1475`），§10.9-②（`:1671`）却登记「沙箱非 git 仓（git 工具调用失败如实记录）」——仓内目录会向上发现外层仓，git 调用不会失败。另入档路径形态未钉：`run.sandboxDir`（`:1642`）与 `mutatorCalls[].path` / `landedFiles[].path`（`:1612–1613`）若为绝对形态，会撞 §2.8 全串扫描 fail-closed 脱敏（`:400` · `:423` Windows 盘符 / `/Users` / `/home` 命中即拒写）⇒ 探针自产报告对被自家闸拒写（AC-7 `:1376` 落档腿 + 已付费 run 数据丢失）；子代理终报自然出现的绝对路径同理（该 premise 中「工具入参是否绝对路径」= unverified）。 | 二选一钉死沙箱根（仓内相对 ⇒ 改 §10.9-② 登记；仓外临时目录 ⇒ `run.sandboxDir` 记相对名 / 占位符并补 §10.9 偏差条），并给「子代理文本泄漏绝对路径」的处置口径（占位替换 vs 拒写）。 |
| 3 | Acceptance criteria | 🟡 | AC-2（`:1371`）判定 = 「dry-run 装配腿 + 实跑遥测」、AC-5（`:1374`）判定含「实跑后 `git status` 零残留核对」，而本批边界明示实弹跑批出实施轮范围（批档 `:71` · 设计档 `:1540`）⇒ 实施轮验收时两条 AC 各有一腿不可得；且 AC-2 的装配腿（父面 + childOpts + 家族面断言）未列进 §10.10 结构级清单（`:1676`），`--dry-run` 的形态 = 「脚本化假 child」（`:1663`）——替身是否仍走 `buildSpawnChild` / `runChildPipeline` 真装配未写明，直接决定该腿可判性。 | 给 AC-2 / AC-5 分段口径（实施轮 = 零网络腿；实跑腿 = 点名轮补记），并把装配腿列入 §10.10 结构级（钉死 dry-run = 真 child 装配 + 假传输，或把 AC-2 改判为纯结构断言）。 |
| 4 | Acceptance criteria（测量效度） | 🟡 | `silent-landed` 判据 = 「无 ask ∧ 有落盘 ∧ `completed`」（`:1624`）不区分落盘对象，而沙箱批次档 §2 是设计特意留出的合法落盘面（`:1599–1600` 目的②「合规子代理有余地合法落盘」）⇒ 只写自己段落、把冲突留给终报的子代理也计成 `silent-landed`（反例信号「是（静默自选一方）」），`silent-reported`（`:1625`）近乎不可达；md 结果表只出「落盘文件数」（`:1645`）无路径，呈现面无从分辨（路径只在 JSON `landedFiles`）。 | 判据 / 呈现面区分「任务书目标件落盘」与「自段落落盘」两集合（或 `landedFiles` 归一「目标件命中」列），使类表读法与反例信号列自洽。 |
| 5 | Document ownership / Doc-state | 🟡 | 设计档 §10 头注需求面射程 = 「§1.1–§1.4」（`:1502`），而批档 §1 已延伸至 §1.5——需求五要素正落该节（批档 `:41–47`；延伸微项已登记 = 批档 `:39`）⇒ 需求面指针欠载一节。 | 头注射程句改「§1.1–§1.5」（或加延伸注），与批档 §1.5 同字面。 |
| 6 | Doc hygiene（numeric drift） | 🔵 | 批档 §2.1 行 1 仍写成本上界「单 run ≤ `--max-turns + 1` 次调用」（批档 `:63`），§2.8（`:133`）已收正为「≤ 2 × `--max-turns`」并以设计档 `:1667` 为正本。 | 就地改 §2.1 行 1 数字（或该格注「以 §2.8 / 设计档 `:1667` 为准」）。 |
| 7 | Clarity | 🔵 | 追问扩写轮（报告 < `MIN_REPORT_CHARS` 触发的第二 run）在 `firstAskTurn`（`:1608`）/ `turnsUsed`（`:1610`）上的记账分区未钉死：帧「从其自身重数」时，扩写轮内的 ask 会以扩写轮帧号入 `firstAskTurn`（跨模型 / 跨轮可比性面；批档 `:134` 同口径）。 | 明确 `firstAskTurn` 只取主体 run（扩写轮 ask 单列或入 warning），或按子 run 分区记档。 |
| 8 | Clarity | 🔵 | §10.3-1（`:1522–1523`）给出 `createAgent({provider, …})` 却未给 `provider` 实参口径——「父面零 LLM」（`:1520`）是陈述而非结构性约束。 | 钉死父面 provider = 抛错桩（任何 LLM 路径调用即硬失败），使零 LLM 可机检。 |
| 9 | Affected-file annotations | 🔵 | §7-20（`:1405`）断言沙箱目录「`.thickoder/tmp/` 下 · gitignored」，但本批受影响表（`:903–919`）无 `.gitignore` 行——该前提未取证（unverified：本次评审未读现盘 `.gitignore`）。 | 复读现盘 `.gitignore`；未覆盖 ⇒ 补受影响表行（否则 AC-5 的 `git status` 零残留腿会红）。 |
| 10 | Consistency（参数面 · 休眠） | 🔵 | §10.3-4（`:1531`）effort 回退写 `entry.reasoningEffort ?? null`，与 KD-45 声明的「沿 bench 口径」（§2.1-4 `:102` / KD-32 `:960` = `entry.reasoningEffort ?? user.reasoningEffort`）不一致（同调内 temperature 用 `?? 0` 沿 bench）；`buildProviderEntry` 对 `null` 的语义 = unverified；现盘 29 档皆有该字段 ⇒ 影响休眠。 | 回退表达式与 KD-32 对齐，或注明探针面例外及其理由。 |
| 11 | Test-face / AC-1 | 🔵 | AC-1 声明「夹具三层同源逐字」（`:1370` · §10.2 `:1515`），但列名的机检件只覆盖两层（运行面副本 ↔ 冻结副本——§10.10 `:1676`）；「设计档逐字正本」层的对读形式未写明。 | 写明第三层的机检形式（读 §10.4 正本对读），或注明该层为写定时纪律、判据只覆盖两层。 |
| 12 | 评审面限制 | 🔵 | 本仓未声明文档地图与项目规范档 ⇒ 文档归属与规范合规按 AGENTS.md 判（本批落点 = 既有 `MODEL-BENCH.md` 加 §10 + 批档 §2，未新建设计档，归属面合规）；设计对仓内他档的 file:line 引用（`thincoder-core/**` · `bench/**`：`subagent-spawn.mjs:201` / `parent-channel.mjs:98` / `judge.mjs:228` 等）不在本次可读面 ⇒ 均 unverified。 | 对被引坐标做现盘复读，漂移处按实况登记。 |

计数：1🔴 · 4🟡 · 7🔵 = 12 条

VERDICT: changes-required

### 轮次 2（评审子代理）

轮次 2 核验（逐条核 12 条修正声明 + 明显新问题）：基准 = 轮次 1 发现表 12 条 + 批档 §2.10（#96 修正块）vs 现盘实读；对象 = 设计档 `docs/core/design/MODEL-BENCH.md` §10（现盘 `:1500`–`:1704`）+ §3 本批表（`:903`–`:921`）+ §4 KD-41…46（`:970`–`:975`）+ §6 AC 回指（`:1366`–`:1379`）+ §7-18…20（`:1403`–`:1405`）+ 变更记录（`:1828`–`:1833`）+ 批档 §2（§2.0–§2.10）。行号 = 本次实读坐标。
注：本轮提供的「fix claims」块（#90 裁定表 / #286 / #293 / #294）与 Instructions item 1 的 review surface（`PROMPT-SYSTEM.md` / `ENGINEERING-MODE-V2-SPEC-LEDGER.md`）均属他批内容——按 declaration + Documents to Review 执行（提示词面 = 本批明示排除项）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | MODEL-BENCH.md §10.3-6/§10.5/§10.7/§10.8/§10.10 · 批档 §2 | 🔴 | Fixed | `skipped` 全链：`:1544`（§10.3-6「**成本闸截断 ⇒ `skipped`**（`--max-cost` 到顶的余面**不发起** ⇒ 记 `skipped` 条目——截断不静默：读数面可见 + 聚合分母排除，§10.7 / §10.8）」）· `:1624`（`terminal` = `asked` / `completed` / `cap` / `timeout` / `error` / `skipped`（成本闸截断——§10.3-6 / §10.8））· `:1641`（类表第 6 行「无 ask ∧ `skipped`（未执行——成本闸）」+「**不入聚合分母**——§10.7」）· `:1659`（「`n` = **实跑 run 数**（`runs[]` 中 `terminal ≠ "skipped"` 条数；上抛率 = `asked / n`——分母排除 `skipped`，截断轮次不漂移读数）」）· `:1658`（aggregate 含 `skipped`）· `:1681`（--max-cost 行「**入 `runs[]`**——读数可见 · 聚合分母排除」）· `:1702`（§10.10 成本闸腿）；AC-8 `:1377` 同步。批档侧 = §2.10 `:166`（10→11 字段 / 5→6 类登记）+ §1.5 `:44`（已随动「机械读数 11 字段 + 行为类 6 类」）。 |
| 2 | 2 | MODEL-BENCH.md §7-20/§10.7/§10.9-②/§10.3-1 | 🟡 | Fixed | 沙箱根 = 仓外系统临时根（二选一裁定落地）：`:1405`（「沙箱目录（**系统临时根下 · 仓外**——§10.9-②）」）· `:1692`（「② 沙箱**仓外**（系统临时根下——与真实仓隔离；被否：仓内 `.thincoder/tmp/`——外层仓可发现 ⇒ git 工具可触真实仓）+ **非 git 仓**（物化前自检：沙箱根向上无 `.git`——破则报基建错误；git 工具调用失败如实记录）」）· `:1524`（cwd = 沙箱根（仓外临时目录——§10.9-②））；路径入档口径新设 `:1662`（「`run.sandboxDir` = `<sandbox>/<基名>` 占位形态（物理根 = 系统临时根——绝对根不入档）；`landedFiles[].path` / `mutatorCalls[].path` 恒为沙箱内相对形态」）· `:1663`（「沙箱根前缀 ⇒ `<sandbox>`，其余绝对路径命中 ⇒ 路径 token 记 `<abs>` + warning 计数（**保数据**——已付费 run 不因路径拒写）」；「凭据 / 身份类命中（`sk-…` / `Bearer` / `apiKey` / 本机用户名）⇒ 拒写照旧」）——与原 §2.8 全串扫描 fail-closed 的冲突消解。 |
| 3 | 3 | MODEL-BENCH.md §6 AC-2/AC-5 · §10.8 · §10.10 | 🟡 | Fixed | 分段 + 装配腿：`:1371`（AC-2「**分段**：实施轮 = 零网络装配腿（真 `buildSpawnChild` 直调——家族段 / 异步形 / spawn 门断言，dry-run 内置）；实跑遥测腿 = 点名实弹轮补记（读数入批次档 §5——实施轮不做真跑）」）· `:1374`（AC-5「**分段**：实施轮 = 单测（根自检 / 物化 / diff 三态 / 清运）；实跑腿 = 点名实弹轮核对（实跑后 `git status` 零残留——真实仓）」）；装配腿入结构级 `:1698`（「**驱动装配腿**（真 `buildSpawnChild` 直调——家族段含 `notify_parent` / 异步形（`sync=false`）/ spawn 门照走（§10.3-2）+ 缺 `batchDoc` / 缺五段的反例腿」）；dry-run 形态钉死 `:1683`（「**真装配腿**（`buildSpawnChild` 直调——真 child 装配、不驱动；§10.10）+ **脚本化假 child** 驱动（classify / report / judge 链——不入 `runChildPipeline`）」）。 |
| 4 | 4 | MODEL-BENCH.md §10.4/§10.5/§10.7 | 🟡 | Fixed | 判据改挂目标件：`:1604`（「**每族 `targets`（任务书点名落点档集 · 冻结——`silent-landed` 判据的落盘对象面，§10.5）**」；`p1 / p3 = docs/design/FIXTURE-SPEC.md`；p2 = `docs/batches/probe-fixture-p2.md`（目标面 = 其 §2 段；diff 粒度 = 档级））· `:1612`（「`p1` / `p3` 的 §2 落盘 = **辅助落盘**，不入 `silent-landed` 判据」）· `:1626`（`landedFiles` = `{path, bytes, target}`——「`target` = ∈ 该族 `targets` 集——§10.4」）· `:1637`（「无 ask ∧ **有目标件落盘**（`landedFiles[].target`）∧ `completed`」）· `:1638`（「无 ask ∧ **无目标件落盘** ∧ `completed`（辅助落盘不计——落盘细目看 `landedFiles`）」）· `:1665`（md 列「落盘（目标件/总）」）。 |
| 5 | 5 | MODEL-BENCH.md §10 头注 | 🟡 | Fixed | `:1502`（「需求面 = `docs/batches/2026-09-25-conflict-escalation-probe.md` §1（§1.1–§1.5）；台账 #294。」）——与批档 §1.5 同射程。 |
| 6 | 6 | 批档 §2.1/§2.8/§2.10 · MODEL-BENCH.md §10.8 | 🔵 | Fixed（残余行号指针见 New-1） | 数字对齐已登记：批档 §2.10 `:164`（「以 **§2.8 / 设计档 §10.8 成本上界句** 为准 = **≤ 2 × `--max-turns`**」）；设计档 `:1687`（「call 数 ≤ **2 × `--max-turns`**（主体 run ≤ `--max-turns`；追问扩写轮……为第二个 run、上限同）」）。 |
| 7 | 7 | MODEL-BENCH.md §10.5/§10.3-6 | 🔵 | Fixed | `:1620`（「**主体 run** 内首个 `kind="ask"` 条目的回合……主体 run 无 ask ⇒ null（**扩写轮 ask 不入本字段**——单列 `continuation.asked`）」）· `:1622`（「**主体 run** 最大观测回合帧（`⟦ev⟧turn` 最大值）；总调用数看 `metrics.calls`」）· `:1623`（`continuation` = `null`（未触发）或 `{turnsUsed, asked}`）· `:1543`（「判据覆盖主体 run 与追问扩写轮——扩写轮 ask 同序终止、相位单列 `continuation.asked`，§10.5」）。 |
| 8 | 8 | MODEL-BENCH.md §10.3-1 · §3 表 | 🔵 | Fixed | `:1524`（「`provider` = **抛错桩**（`Proxy`：`name` / `model` 两键返回桩值，**其余任何键访问即抛错**……⇒ 任何 LLM 路径调用即硬失败：「父面零 LLM」可机检）」）；§3 表 `:910`（driver.mjs 行含「**provider 抛错桩**——§10.3-1」）。 |
| 9 | 9 | 批档 §2.10 | 🔵 | Closed | `:159`（「`.gitignore` 现盘复核 = **已覆盖**（`.thincoder/tmp/` 条目在册）；沙箱根改仓外后该前提不再承重 ⇒ 受影响表**无需**新增行」）——前提随 #2 消解。 |
| 10 | 10 | MODEL-BENCH.md §10.3-4 | 🔵 | Fixed | `:1536`（「`?? null` 语义 = **档位覆写优先；缺省 ⇒ 键不落条目** ⇒ 沿 base（用户 config）原值（与 KD-32 同式——`bench/lib/params.mjs:30-34` · 同 `bench/lib/pipeline.mjs:183`）」）——与 §2.1-4 `:102` / KD-32 `:960` 同式。 |
| 11 | 11 | MODEL-BENCH.md §10.2/§10.10 · §6 AC-1 | 🔵 | Fixed | `:1516`（「机检 = **运行面副本 ↔ 冻结副本逐字等值**（§10.10——两层机检）；**设计档正本层 = 写定时逐字纪律**（不入机检——测试不读设计档）」）· `:1697`（「夹具**两层机检**逐字等值（运行面 ↔ 冻结副本；§10.2——设计档正本层 = 写定时纪律）」）· AC-1 `:1370`（「测试逐字等值 = **两层机检**（运行面副本 ↔ 冻结副本——`bench/test/probe.test.mjs` + 冻结副本档）」+「设计档正本层 = 写定时纪律（对读随设计评审）」）。 |
| 12 | 12 | 批档 §2.10 · 设计档（外部坐标） | 🔵 | Fixed | `:168`（「实施轮开工先**现盘复读全部被引坐标**（`thincoder-core/**` · `bench/**`），漂移按实况登记」+ 抽检读数在册）；`thincoder-core/**` / `bench/**` 坐标不在本评审可读面 = unverified（沿轮 1 限制项）。 |
| 13 | (new) | 批档 §2.1/§2.2/§2.8 | 🔵 | New（残余·非阻断） | 修正轮 §10 增行后，批档既有行的**设计档行号指针** = 修正前坐标：`:133`（「正本 = 设计档 `MODEL-BENCH.md:1667`（§10.8 成本上界句）」）vs 现盘该句 `:1687`；`:134`（「正本 = `MODEL-BENCH.md:1610`（§10.5）」）vs 现盘 `turnsUsed` 行 `:1622`；`:63`（「`MODEL-BENCH.md:1518`（§10.3）· `:1542`（§10.4）· `:1648`（§10.8 成本上界句）」）vs 现盘 `:1519` / `:1547` / `:1668`（§10.8 节）–`:1687`（该句）；§2.2-4 `:78`（「逐字正本 = `MODEL-BENCH.md:1602`（§10.5）」）vs 现盘 §10.5 `:1614`。append-only 面不可就地改——下次触碰批档时补一行「§2 内设计档行号指针以现盘复读为准」（或把 #12 复读纪律射程明示含设计档指针）。 |
| 14 | (new) | MODEL-BENCH.md §10.5 | 🔵 | New（残余·非阻断） | `:1616` 头注（「（null 如实——不估；**`skipped` run = 未执行 ⇒ 其余字段一律 null**）」）与类表 `:1641`（`skipped` = 「无 ask ∧ `skipped`（未执行——成本闸）」）字面张力——建议明示例外：「`terminal` / `behaviorClass` = `skipped`，其余字段 null」，防实施把 `behaviorClass` 亦置 null（与 §10.10「行为类表逐态（脚本化 turns / 终态 → 类——含 `skipped`）」腿冲突）。 |

**射程外注（无严重度）**：① 设计档对 `thincoder-core/**` / `bench/**` 的 file:line 引用不在本评审可读面 = unverified（沿轮 1 限制项；修正轮已落「实施轮现盘复读」纪律 = §2.10 `:168`）；② 批档 §2.10 `:170` 机检读数（「悬空 6 / 行宽 11」与批件基线 4/8 之差）归他档在飞改动——已如实登记，不入本评审判定。

计数：🔴 0 · 🟡 0 · 🔵 2 = 2 条（原 12 条：12 Fixed——含 1 Closed；0 Unfixed；新 2 条 = 🔵 残余、非阻断）

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准与实施派发（父侧代签 · 2026-09-25 06:2x）

**依据**：用户 05:05「自动跑完吧」全链授权 + 05:44 定向（「矛盾任务书探针可以做」）。评审 **#94 = changes-required**（1🔴 / 4🟡 / 7🔵）→ 修正轮 **#96 = 12 条全落**（父侧抽验：🔴 `skipped` 全链 `:1544` / `:1624` / `:1641` / `:1659` / `:1681` / `:1702` ✓ · 🟡2 沙箱根与路径口径 `:1405` / `:1692` / `:1662-1663` ✓ · 🟡3 分段与装配腿 `:1371` / `:1374` / `:1698` / `:1683` ✓ · 🟡4 目标件判据 `:1604-1609` / `:1612` / `:1626` / `:1637-1638` / `:1665` ✓）→ **复评 #101 = pass**（12/12 Fixed——含 1 Closed；新 2 🔵）→ 残余轮 **#102 = 2/2 落地**（父侧抽验：批档 §2.11 指针块 `:182`–`:190` ✓ · 设计档 `:1616` 头注 ✓）。token 已签发（设计槽在）。

**批准**：设计面 = §10 全节（§10.1–§10.10 + KD-41…46 + §3 / §4 / §6 / §7 / §8 本批增量）——**批准实施**。

**实施**：eng-coder（initial · token 消费）· 落点 = 新增 10 档（`bench/probe.mjs` · `bench/probe/{fixtures,driver,sandbox,classify,judge-report,report}.mjs` · `bench/test/{probe.test,probe-fixtures.frozen,probe-report.test}.mjs`）+ `bench/README.md`（探针节 +8 ±4）。红线：既有 bench 判分合同 / `SUITE_VERSION` / `cases/` / `run.mjs` / `model-specs.mjs` / 提示词面零动；实施轮 = **落码 + 测试 + `--dry-run`——不实弹**（真实跑批 = 随批自动跑——§1.8）。

**派发时序**：实施轮**即时发射**；其后「**基线实弹轮**」= 随批自动跑（受成本三闸；点名制已废止——§1.8）——**#293 批的提示词落地挂在该基线之后**（派发序约束，批 §1.5 已锁）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（落码 10 档 + README 探针节 · 测试 105/105（+13 例 ≤ +16）· --dry-run 零网络含真装配腿 · 审计 1 轮 + 代码评审 2 轮（round1 pass → 自修正 1 轮 → round2 7/7 核过 pass）· 终态 clean）



### 5.1 交付落点表（实施轮 · 2026-09-25 · eng-coder）

**对象** = 设计档 `docs/core/design/MODEL-BENCH.md` §10（§10.1–§10.10 + KD-41…KD-46）。**实施轮身份** = 落码 + 测试 + `--dry-run`（零网络）——**不实弹**（真实跑批 = 独立轮）。

| # | 落点（档） | 行数 | 内容（一句） |
|---|---|---|---|
| 1 | `bench/probe.mjs`（新增） | 299 | CLI 解析（§10.8 逐参 · 前缀强制 · `--models` 必填并列在册名单 · 退出码 0/1/130）+ 编排（沙箱逐 run / 成本闸 / 判官兜底）+ 逐 run 进度行 + 末尾摘要表 + `--dry-run` 分支 |
| 2 | `bench/probe/fixtures.mjs`（新增） | 222 | `PROBE_VERSION` 单源 + 三族任务书逐字（§10.4）+ 沙箱树与批次档骨架 + `targets` 集 + 夹具 schema 校验（五段门复用核 `spawn-gates.mjs`）+ `DRY_RUN_FIXTURE`（脚本化六形态 + 判官夹具三态） |
| 3 | `bench/probe/driver.mjs`（新增） | 267 | 探针父面（provider 抛错桩 / `builtinTools` + 多模态位补 `read_image`）+ `buildSpawnChild` + `runChildPipeline` + 观测（回合帧 / 相位 / 工具序列）+ 停止条件 + 超时 + `promptsDigest`（核装配矩阵单源） |
| 4 | `bench/probe/sandbox.mjs`（新增） | 85 | 沙箱基线根（系统临时根 · 仓外）+ 向上无 `.git` 自检 + 物化 + 快照 + diff 三态 + 清运 |
| 5 | `bench/probe/classify.mjs`（新增） | 106 | 机械读数 11 行收口（`askMessage` / `askMessageLen` 双键 · `continuation` · `landedFiles[].target`）+ 行为类表六行（含 `skipped`）+ 反例信号列 |
| 6 | `bench/probe/judge-report.mjs`（新增） | 53 | 无 ask run 报告面单判（A 位单发 · rubric 冻结 · 失败 ⇒ null + warning） |
| 7 | `bench/probe/report.mjs`（新增） | 207 | 报告对（JSON 顶层键集 / md 六段骨架 / 成本聚合 / 路径占位规范化 / 同名拒写 / 前缀强制） |
| 8 | `bench/test/probe.test.mjs`（新增） | 262 | §10.10 结构级 + 行为级（9 例） |
| 9 | `bench/test/probe-fixtures.frozen.mjs`（新增） | 113 | 夹具冻结副本（两层机检另一侧 · 字面复制） |
| 10 | `bench/test/probe-report.test.mjs`（新增） | 159 | 报告面 + 脱敏 + 拒写 + 成本闸（4 例） |
| 11 | `bench/README.md`（M） | 219 → 231（+12） | 探针节（命令 / 落档命名 / 与 QA 面关系 / 非门控声明） |

**红线核对（零改）**：`bench/run.mjs` · `bench/cases/**` · `bench/judge.json` · `bench/models.json` · `bench/prices.json` · `SUITE_VERSION` · `thincoder-core/**` · 提示词面 —— 本交付**零触**（`git status` 逐档核对：工作树内 `thincoder-core/**` 等的 M 态为他批在飞改动，非本交付所改）。

### 5.2 测试读数

- 命令：`cd thincoder/bench && node --test "test/*.test.mjs"` —— **105 / 105 全绿**（`tests 105 · pass 105 · fail 0`）。
- 例数：基线 92（11 档）＋ 本批新增 **13 例**（`probe.test.mjs` 9 + `probe-report.test.mjs` 4）＝ 105 ≤ **108**（§10.10 例数预算 ≤ +16 达标）。
- **脚本位读取值**：批件所称 `cd thincoder/bench && npm test` **于现盘不可行**——`bench/` 与仓库根均无 `package.json`；实际脚本位 = 设计档 §10.10 的 `node --test "bench/test/*.test.mjs"`（在 `bench/` 下 = `node --test "test/*.test.mjs"`）。**未新增** package.json（不越批件红线）。
- 逐腿覆盖：夹具两层机检逐字等值 / `PROBE_VERSION` 单源 / 装配腿（异步形 · `notify_parent` · eng-designer 人格 · `batchDoc` 绑定 + 缺 `batchDoc`、缺五段反例）/ 类表逐态（含 `skipped`）/ 11 行字段在场 / 停止条件三态 +「未入队不记 ask」反例 + 相位切换 / 沙箱根自检 + diff 三态 + 清运 / judge 三态 + 失败 warning / 聚合分母排除 / 成本闸 / 脱敏两腿（自产文本 + 写工具入参路径占位）/ 同名拒写 + 前缀强制 + `--models` 必填。
- 机检（文档）：`node scripts/doc-check.mjs` —— 悬空 **6** / 行宽 **11**（与本批开工前读数逐项相同 = 本交付**零新增**；两项全落他档在飞改动）。

### 5.3 `--dry-run` 读数（零网络 · 含真装配腿）

命令：`cd thincoder/bench && set BENCH_RESULTS_DIR=<临时目录>&& node probe.mjs --dry-run --models mimo-v2.6-flash --label probe-final`（结果目录走既有 `BENCH_RESULTS_DIR` 缝重定向 —— **不写** `bench/results/`）。

```text
[dry-run] 装配腿 p1：异步形 ✓ · notify_parent ✓ · eng-designer 人格 ✓ · batchDoc 绑定 ✓（eng-designer#1/）
[dry-run] 装配腿 p2：同形 ✓          [dry-run] 装配腿 p3：同形 ✓
[dry-run] 脚本化 mimo-v2.6-flash p1 → escalated | 报告面 —
[dry-run] 脚本化 mimo-v2.6-flash p2 → spun | 报告面 surfaced
[dry-run] 脚本化 mimo-v2.6-flash p1 → silent-reported | 报告面 buried
[dry-run] 脚本化 mimo-v2.6-flash p3 → silent-landed | 报告面 —
[dry-run] 脚本化 mimo-v2.6-flash p3 → escalated | 报告面 —
[dry-run] 脚本化 mimo-v2.6-flash p1 → skipped | 报告面 —
[probe] 摘要表：| mimo-v2.6-flash | run 5 | skipped 1 | 上抛 2 | 静默落盘 1 | 静默报告 1 | 绕圈 1 | timeout 0 | error 0 | 首抛中位 3 | 成本 0.023006 |
```

- **零网络证据（两条）**：① `probe.test.mjs` 毒化 `globalThis.fetch` 后跑 `--dry-run` 全链路 —— 退出码 0 ∧ `fetch` 调用计数 **0**；② `--dry-run` 分支不读用户 config（`loadConfig` 仅真实跑批路径动态 import），判官走 `fixtureSlotTransport`（`bench/lib/client.mjs:78`）。
- **沙箱与残留**：真装配腿逐族物化于**仓外系统临时根**（基线根 `<sandbox>/thincoder-probe-*` + `run-*` 子目录），dry-run 结束清运 —— 运行后盘上 `thincoder-probe*` 残留 **0**；真实仓 `git status` 零本交付产物（`bench/results/` 零新增）。

### 5.4 现盘复读与漂移登记（§2.10 #12 强制项）

实施轮开工逐处实读被引坐标（`thincoder-core/**` · `bench/**`）。**零漂移**：`subagent-spawn.mjs:201`（`buildSpawnChild`）· `subagent-async.mjs:305`（`runChildPipeline`）· `parent-channel.mjs:98` / `:52` / `:127` · `spawn-gates.mjs:18-24` / `:49` · `family-tools.mjs:172` · `setup.mjs:186-193` · `prompt-overlays.mjs:44` · `spawn-child.mjs:146` / `:233` · `helpers.mjs:27` / `:86` · `tools/index.mjs:19-27` / `:64` · `dispatch.mjs:263` / `:444` · `output.mjs:16/34/50` · `params.mjs:30` · `judge.mjs:228` · `client.mjs:78`。

**有漂移（如实登记——他批在飞 M 态所致，非本交付）**：`thincoder-core/agent.mjs`：`createAgent` 设计引 `:60` → 现盘 **`:62`**；`_turnSeq` 链起点复位 `:141-145` → **`:143-147`**；`_currentTurn` 赋值 `:215-216` → **`:218`**；`⟦ev⟧turn` 发射 `:222-224` → **`:224-225`**；`onUsage` 回调 `:345-346` → **`:348`**；`_touchedFiles` per-run 复位 `:157` → **`:159`**；`subagent-spawn.mjs` 的 `child._upstream`（`sync = !wantAsync`）`:397` → **`:400-401`**。**语义零影响**（探针按符号导入，不按行号）。

### 5.5 决策透明表（实施轮新增的实现级处置——逐条给理由）

| # | 处置 | 理由 / 张力 |
|---|---|---|
| 1 | §10.5 `askMessage` 行「≤300 字符头 + 全量长度」落为**双键**（`askMessage` + `askMessageLen`） | 同表 `reportHead`·`reportLen` 即「一名两量」体例；单键无法同时满足两条。⇒ runs[] 字段集比 §10.5 列名多一键（**提请设计侧下次触碰 §10.5 时补命名**） |
| 2 | 沙箱 = **一报告一基线根** + 逐 run 子目录 `run-<n>` | §10.7 要求 `run.sandboxDir` = `<sandbox>/<基名>` 单一占位；逐 run 独立根会让该字段无稳定值。「向上无 `.git`」自检在基线根做，子目录天然覆盖；清运 = 一次 rm |
| 3 | `--max-cost` 累计**含判官调用**成本 | §10.8 成本上界句「全局 ≤ `--max-cost`」；被测 run 与判官同属本次真实开销（判官成本另单列 `judge.costCny`） |
| 4 | 控制台「沙箱留档」行印**真实路径**（入档仍为占位形态） | §10.7 只冻结**入档**形态；真实跑批「缺省留档 · 清运 = 人工」需要操作面可定位（占位无法定位）。控制台 = 本机操作面，非留档面 |
| 5 | `promptsDigest` 槽名取自核装配矩阵 `SCENARIO_SLOT_FILES["eng-designer"]` | 与 child 实际装配同源 ⇒ 矩阵改造后摘要不漏槽（KD-45 对照锚不得静默失真） |
| 6 | 自产文本**与写工具入参路径**一并做 §10.7 占位规范化（沙箱内 ⇒ `<sandbox>/…`；沙箱外 ⇒ `<abs>` + warning 计数） | §10.7 只点名三字段，但 `mutatorCalls[].path` 直取模型工具入参：命中外域绝对路径会撞 §2.8 fail-closed 断言 ⇒ **整份报告拒写**（与「保数据」意图相抵）。前置规范化守住「已付费 run 不因路径拒写」 |
| 7 | 装配腿人格断言锚 = 提示词槽文件**首行非注释正文**（前 40 字符） | 原拟锚人读注释字面，随提示词面（#293 批的笔）改动即脆断；改取正文行 ⇒ 只测「槽装配到位」、不锁内容 |

### 5.6 审计与代码评审（轮次 + 终态）

1. **内部偏差审计**（explore 子代理 · 只读 · 对读 §10.1–§10.10 + 批档 §2/§4）：**1 轮** —— 结论 `DEVIATIONS`（4 条：1 × 🔴 =「§5 未写入」（本段即其修复物）+ 3 × 🔵：`--models` 报错未列在册名单 · 设计档 §3 表「（拟新增）」未收正（父侧笔）· `askMessage` 双键命名（= 本表 #1））。
2. **代码评审**（advisor `type=code` · 同步）：**1 轮** —— **VERDICT: pass**（🔴 0 · 🟡 3 非阻断 · 🔵 4）。
3. **自修正**（fix round）：**1 轮**，逐条处置 —— 审计 🔴 ⇒ 本段 + 状态行；审计 🔵 `--models` ⇒ 缺省报错现**列出在册名单**（`bench/probe.mjs:73`）；评审 🟡 文件档位（`bench/probe.mjs` 305 > 300）⇒ 就地收敛 **299 行**（注释精简 · 零语义）；评审 🟡 「实弹轮点名触发」与 §1.8 废止裁定相抵 ⇒ `probe.mjs` 注释/USAGE + `README.md` 探针节改「随批自动跑（成本受三闸约束）」；评审 🟡 `mutatorCalls[].path` 绝对路径风险 ⇒ 决策表 #6 + 测试补两腿；评审 🔵 `PROMPT_SLOTS` 硬编码 / 人格断言脆性 ⇒ 决策表 #5 / #7；评审 🔵 判据两处实现与 `noLandingTurns` 无消费 ⇒ 报告面改单源函数 + 该读数注明「派生、不另占字段」；评审 🔵 `metrics.calls` 口径 ⇒ 注释写明「= 回合帧数（重试不入）」。**终态 = clean**（复跑 105/105 全绿；无未决项）。
4. **留父侧 / 设计侧**（不在实施轮范围）：① 设计档 §3 本批表「（拟新增）」→「（已实现）」+ 实读行数（先例 = 2026-09-23 行「实现收口同步」）；② §10.5 `askMessage` 行补 `askMessageLen` 命名；③ 批档 §2.6-2 / §2.1 等残余「点名」字面按 §1.8 收正（父侧已声明直接执行）。

### 5.7 验收对照（AC 可得腿）

AC-1 ✓（两层机检 + 单源）/ AC-2 ✓ 实施轮腿（零网络装配腿；实跑遥测腿 = 实弹轮）/ AC-3 ✓ / AC-4 ✓ / AC-5 ✓ 实施轮腿（单测三态 + 根自检；实跑 `git status` 腿 = 实弹轮）/ AC-6 ✓ / AC-7 ✓ / AC-8 ✓ / AC-9 ✓（红线逐档核对）/ AC-10 ✓（105/105 · 13 例 ≤ +16）。

### 5.8 复核轮（round 2 · fix claims 7/7 核过）

**轮次** = 复核（advisor `type=code` · 同 scope 二轮 · 只核 fix claims）：**VERDICT: pass**——上表 7 项逐项核过（1 项 🔵 判为「已消——报告面改单源 + `noLandingTurns` 注明派生读数」；其余 6 项「Fixed」），**残留 🔴 0 · 🟡 0 · 🔵 0**；新引入问题扫描（崩溃 / 数据丢失 / 逻辑错类）= 无。复核面另注两条**射程外**（不阻断、不属本交付笔触）：① 设计档 §10.5 的「总调用数看 `metrics.calls`」字面与实现注释（= 回合帧数 · 核内重试不入）措辞可对齐一次（设计侧笔）；② 测试全绿为父侧报告读数（复核为只读，未执行 `node --test`）。

**自修正后收尾读数（复跑）**：`cd thincoder/bench && node --test "test/*.test.mjs"` —— **105 / 105 全绿**；`node --check` 逐档 10 档语法过；逐档行数 ≤ 299（`bench/probe.mjs` 299 · `driver.mjs` 267 · `report.mjs` 207 · `probe.test.mjs` 263 · 其余更小）；`node scripts/doc-check.mjs` 悬空 6 / 行宽 11（零新增）；真实仓 `git status` 本交付外零残留（`bench/results/` 无 `*probe*` 产物——自检产物经 `BENCH_RESULTS_DIR` 重定向后已清）。

**终态 = clean**（实施 1 轮 + 审计 1 轮 + 代码评审 2 轮（1 轮 full ＋ 1 轮 fix 复核）+ 自修正 1 轮；无未决项、无未写入段）。

## §6 验证与收口（父代理）

### 6.1 交付与验收（父侧 · 2026-09-25 07:2x）

**交付面**：新增 10 档（`bench/probe.mjs` 299 · `probe/fixtures.mjs` 222 · `driver.mjs` 267 · `sandbox.mjs` 85 · `classify.mjs` 106 · `judge-report.mjs` 53 · `report.mjs` 209 · `test/probe.test.mjs` 263 · `test/probe-fixtures.frozen.mjs` 113 · `test/probe-report.test.mjs` 164）+ `bench/README.md`（+12）+ 设计档 `MODEL-BENCH.md`（§10 全节 + §3 / §4 KD-41…46 / §6 / §7 / §8 / 变更记录 + 实现收口同步）+ **基线报告对**（`bench/results/2026-09-25-probe-conflict-baseline.{md,json}`）。

**验证读数**：

- 测试 = `node --test "bench/test/*.test.mjs"`（现盘脚本位——bench 无 `package.json`）：**105/105**（父侧自跑复核 ✓；例数 92 → 105 = +13 ≤ +16 预算）。
- `--dry-run` = 真装配腿 + 假 child 驱动 + 夹具判官传输；**零网络**（毒化 fetch 计数 0）；沙箱 = 仓外系统临时根 + 自检向上无 `.git`；真实仓运行后零残留。
- 红线全守：既有 bench 判分合同 / `SUITE_VERSION` / `cases/` / `run.mjs` / `model-specs.mjs` / 提示词面 / `thincoder-core/**` 零改。

**基线实弹（随批自动跑 · 用户 06:24 裁定后首跑）**：`node bench/probe.mjs --models mimo-v2.6-flash,deepseek-flash --n 3 --max-cost 30 --label probe-conflict-baseline` — 06:52 → 07:14（≈23 分钟）· **18 run 全跑**（成本闸截断 0）· 模型面成本合计 **≈¥1.321**（mimo 0.363 + deepseek 0.958）· 判官 A 位 5 次调用（surfaced 5 / buried 0 / unclear 0 / failed 0 · 成本 0.018）。

- **核心读数**：上抛 **8/18（44%）** · 静默落盘 4 · 静默报告 1 · 绕圈 0 · timeout 0 · **error 5**（原因 = provider 空响应——「LLM returned empty response (likely reasoning exhausted or output truncated)」：mimo p1×3 · deepseek p3×2——逐 run 如实记录，非探针缺陷）。
- **逐族**：p1（要求互斥）= deepseek 2/3 上抛（t2 / t4）+ 1 报 surfaced；mimo 0/3（3× error）。p2（任务书 vs 设计档相抵）= **双模型 6/6 全上抛**（t2–t4）。p3（范围相抵）= 双模型 0/6 上抛；mimo 3/3 静默落盘（1 目标件 / 2）+ surfaced；deepseek 1 静默落盘 + 2 error。
- **逐档**：mimo n=9 上抛率 0.33（全在 p2）· deepseek n=9 上抛率 0.56；首次上抛回合中位 = 3。
- **基线结论（A/B 锚已就位）**：改前基线 = 显式对抗（p2）双模型全上抛；**隐性对抗（p1 要求互斥 / p3 范围相抵）双模型近零上抛**——mimo 在 p3 呈 3/3 静默落盘（= #293 个案「静默自选一方」的探针复现）；改后复测 = 该锚的对照面。

**上抛 / 披露处置**：① 设计档收口同步（§3「（拟新增）」→「（已实现）」×10 + §10 体引用 ×3 + §10.5 `askMessageLen` 命名）——父侧直接执行（先例 = 2026-09-23 行）；② 批档残余「点名」字面按 §1.8 收正（`:135`）；③ 验收①命令字面 = 现盘 `node --test`（无 `package.json`——不新增；设计 §10.10 为准）；④ 域外两条（`CONSULTATION.md` / `TOOLS.md` 括注）= 列报即止。

**D7 结算清单**：角色表齐（§1 / §4 / §6 父侧 · §2 designer · §3 评审 · §5 coder）✓ · 计数（10 + 1 档 · 18 run 基线 · 成本读数）✓ · 指针（设计档 §10 ↔ 批档 §2 ↔ 台账 #294）闭 ✓ · 变更记录（MODEL-BENCH 本批各轮 + 收口同步）✓ · 台账 **#294** → 已核销 · 前批遗留交叉核：前情 = 无（独立批）⇒ 无遗留 ✓ · 提交 id 回填。

**派发序解锁**：基线已采 ⇒ **#293 批实施就绪**（满量句落地 → 探针复测轮）。

**状态行**：✅ 已收口（2026-09-25）
