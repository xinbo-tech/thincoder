# 台账执行者归属（LEDGER-EXECUTOR）· 批次记录（2026-09-21）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 02:4x · 来源 = 用户 02:37 提问「实例之间互相通讯有意义吗」讨论 + 02:46 批准「P0 马上开始，P1 记入台账」（快车道）。
> 台账 = #24（需求池 · F-LX1 · urgent）+ #23（技术待办 · P1 意图认领 · 条件触发 · **不在本批**）。
> 需求档 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` §2.8（F-LX1，本批新增）。
> 前情 = docs/batches/2026-09-21-session-claim-release.md §6（已收口 2026-09-21）——同日关联批（多实例并存话题族：SESSION-CLAIM 修槽认领，本批补台账执行者可见性）。

## §1 讨论（主 agent）

**状态行**：📝 设计进行中（eng-designer 派单在飞 · 2026-09-21）

**用户讨论轨迹（2026-09-21 02:34–02:46）**：

> 「你能知道还有几个其他thincoder实例在干嘛吗？」
> 「你觉得实例之间互相通讯有意义吗？」
> 「这个有点意思，你觉得该怎么做？」
> 「你觉得P1的必要性高吗？」
> 「可以，那你就照这个计划做吧，P0马上开始，P1记入台账。」

**结论（讨论收口）**：多实例协作的正确抽象 = 共享账本 + 拉取式可见性，不做消息通道（用户 gate 语义不动）。盘点 MULTI-INSTANCE-COLLAB 机制族（L1 回合注入 / L2 peer_instances / L3 足迹登记 / F5 config 原子写）后，真实缺口收敛为一处：

- **P0（本批 · F-LX1）**：台账「在途」条目无执行者归属——CLI 实例此刻在途实施 #45/#51（slot 41 会话），另一实例 `ledger_query` 看不到「谁在做」，排批有撞车盲区。痛点有实证，非推想。
- **P1（缓建 · 台账 #23 条件触发）**：跨实例意图认领层（peers claims + TTL 租约）——零真实冲突案例，YAGNI；触发条件 = 真实双写冲突案例 ∨ [peer-collab] 软提示高频命中；若触发源为长回合足迹空窗，优先变体 = eng-coder 子代理收尾 flush 足迹。

**本批范围（F-LX1 · 单需求点 1 批）**：

1. schema：items 加 `executor` TEXT 字段（可空；老数据 NULL 兼容——幂等 DDL 迁移）。
2. 写语义：进入「在途」写 sessionId；离开「在途」（→待核销 / →已废弃）清除。
3. 可见面：查询行 + 状态行显示执行者；判活展示（活 / 死「属主已死，可接手」/ 探测失败保守显示）。

**边界（不做什么）**：不做 P1 意图认领（#23）；不改六态状态机与迁移表；不做跨实例消息 / 等待 / 自动合并（MULTI-INSTANCE-COLLAB 需求 §4 既有边界不动）；判活不新增探测通道（复用既有 batchAlive / process-probe 判活面）；台账库位置与关联键不动。

### 1.0 授权口径

用户 02:46 明确批准本批计划（「可以，那你就照这个计划做吧，P0马上开始」）——**设计评审点火权与 §4 批准权仍在用户**（本轮授权 = 排程与推进，非代签）。P0 走快车道 = 单点全流程不裁步：设计 → 评审 → 批准 → 实施。

## §2 批次任务与设计（eng-designer）

**状态行**：✅ 已收口 2026-09-21（实施验证通过 · 三端全绿 · 台账 #24 已核销；记录冻结）

### 2.1 本批条目（覆盖）

- **F-LX1 执行者归属**（需求档 `ENGINEERING-MODE-V2-SPEC-LEDGER.md` §2.8 · 台账 #24）——三件：① schema `items` 加 `executor TEXT` 可空列（零 CHECK——会话进程 transient 无值域可锁）+ 老库幂等迁移；② 迁移写语义（进「在途」写 sessionId / 离「在途」清 NULL / `ledgerClose` 撤回同步 / 接手 = 软语义）；③ 可见面判活展示（`ownerState` 三态 + 一次批量探测 + 5s TTL 缓存 + 陈旧在途「N 天未动」标注）。
- **不在本批**：P1 意图认领（台账 #23 · 条件触发）。

### 2.2 设计档落点（所有权判定依据）

任务书候选落点 `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md` 不存在——唯一同名档已归档 `_archive/modules/`（2026-09-17 v2 退役批），且 `design/LEDGER.md` 头注自述「M2 模块设计语义并入本档」⇒ 台账模块设计所有权 = **`docs/core/design/LEDGER.md`**（就地并入 + 变更记录一行）；本批设计已落该档。

**一致性面发现（当场已修，逐条报告）**：AC 编号撞车——需求档 2026-09-21 新增 AC-M2-7/8（executor 写入 / 判活展示）与设计档 §8 既有 AC-M2-7/8（迁移表拒 / 写门）同号不同义。需求档为权威 ⇒ 设计档旧两行**重编 AC-M2-9/10 承接**（语义零变），AC-M2-7/8 让位新语义；§8 注记行「AC-M2-6 = KD7」保留；代码注释回指（`ledger-cmd.mjs` 写门注释等）实施轮顺带改指 AC-M2-10。

### 2.3 机制设计（详文 = 设计档对应该节，此处一行一句）

- **schema 与迁移**（§2）：新库 DDL 直带 `executor` 列；老库 `openLedger` 建表后 `PRAGMA table_info` 预判缺列才 `ALTER TABLE ADD COLUMN`；并发双开撞 duplicate-column → catch 复核：列在吞、列不在抛真错。
- **写语义**（§3.1）：判位 = `ledgerUpdate` 迁移表判之后、写门与 UPDATE 之前；统一优先级 **patch 显式 > 自动语义（进 = sessionId / 出 = NULL）> 行现值兜底 > NULL**；sessionId 函数参数注入（工具 execute 层动态 import `getSessionId()`——K-LX1）；`ledgerClose` 撤回路径同步置 NULL；接手软语义 = `ledger_update` 参数面加可选 `executor`。
  判语：`ledger_update` 不在批次档 §1 禁改四工具清单——接手软语义承载面。
- **判活展示**（§7.3.1）：判据单源 `ownerState` 三态（D-MI10：unknown 不判死）；`resolveExecutorStates(scans)` 一次 `probeOwnersAsync` 束（**父侧必答①性能红线**：禁逐行 exec + 5s TTL 缓存（同源 `PEER_PROBE_TTL_MS`）+ 无在途零 exec + 写径零探测）。
  L2 尾段三态文案——`（属主已死 <n>，可接手）` dead 优先 / `（执行中 <n> · 最长 <d> 天未动）`（**父侧必答②**：行龄源 = 既有 `updated_at`，零新状态）。
  L1 标记零扩；`state.ledger.warn` 扩 `deadExecutors>0`；CLI 胶水机制归核（切 core `runLedgerScan`，动态 import + colors 注入——W8 契约②不破）；VSC 调用点补 await。

### 2.4 受影响文件与测试面

| 文件 | 现行数 | 预期 |
|---|---|---|
| `thincoder-core/ledger-db.mjs` | 87 | +~20（DDL 列 + 幂等迁移） |
| `thincoder-core/ledger-cmd.mjs` | 209 | +~20 |
| `thincoder-core/ledger.mjs` | 202 | +~40（buildScan 新键 + resolveExecutorStates + formatDetailLine 尾段 + re-export） |
| `thincoder-core/ledger-surface.mjs` | 77 | +~10（runLedgerScan async 化 + warn 扩） |
| `thincoder-cli/src/tui/ledger-surface.mjs` | 85 | −~20（机制归核切 core） |
| `thincoder-vscode/src/extension/ledger-surface.mjs` | 135 | +~8（await + tooltip 径判活） |
| `thincoder-core/test/ledger-executor.test.mjs` | 新 | ~120（T15–T20 主体） |
| `thincoder-cli/test/ledger-surface.test.mjs` · `thincoder-vscode/test/ledger.test.mjs` | 300 / 260 | L2 文案段用例 + runLedgerScan await 适配 |
| `docs/core/design/LEDGER.md` | 199→275 | 设计面（本席已落盘；<300 行限无需拆） |

> ledger-cmd 增量明细：写语义判序 · 工具 schema executor 参数 · 注释回指改指 AC-M2-10 · 头注死指针改指 `design/LEDGER.md`。

### 2.5 验收对照（三链同源：需求档 §4 ↔ 本节 ↔ 设计档 §8）

| AC | 判据 | 落点 |
|---|---|---|
| AC-M2-7 | 进「在途」带 executor=sessionId（patch 显式优先）；离「在途」（两出边 + ledgerClose 撤回）置 NULL | 新档 `ledger-executor.test.mjs` T15–T17 |
| AC-M2-8 | 属主已死 →「属主已死，可接手」；探测失败不显死亡（活/死/unknown 三态对照） | 同上 T19（`_setProcessProbeTestImpl` 注入）+ CLI/VSC 双端 L2 文案断言 |
| 老库兼容 | 旧 DDL 库打开列补齐行不损；二次打开幂等；并发 ALTER 容忍 | 同上 T18 |
| 性能红线（必答①） | inflight 空 ⇒ 零 exec；同 pid TTL 内零 exec；写径零探测 | 同上 T20 |
| 陈旧在途（必答②） | alive + staleDays≥1 ⇒「最长 <d> 天未动」段 | 同上 T19 |

### 2.6 关键决策

| # | 决策 | 理由（备选已否） |
|---|---|---|
| K-LX1 | sessionId 函数参数注入，工具 execute 层动态 import `getSessionId` | 纯函数可测 + 零新静态边；备选「静态 import session-slots」否——无收益 |
| K-LX2 | buildScan 保持 sync、判活独立 `resolveExecutorStates` async | 三端 sync 直调面零破；判活一次批量合 D-MI14；备选「buildScan async 化」否——破面大收益零 |
| K-LX3 | CLI 胶水机制归核切 core `runLedgerScan` | 机制单源（判活零重复），CORE-UNIFICATION #174 方向；端壳动态 import 保持（W8②不破） |
| K-LX4 | 工具行集不判活、保原始 executor 串 | 判活时点性强，工具行保数据保真；判活展示归格式化径；签名不破 |
| K-LX5 | ALTER 幂等 = table_info 预判 + catch 复核 | 老库兼容 + 并发窗双覆盖；单预判有 TOCTOU 窗、单 catch 丢真错 |
| K-LX6（必答①） | 一次批量 + 5s TTL 缓存；无 inflight 零 exec；写径零探测 | 禁逐行 exec；TTL 挡连续扫描/换项目刷新重复探测（VSC 即时刷新径不受扫描拍节流——缓存有真实场景）；peer 惰性缓存先例 |
| K-LX7（必答②） | 陈旧在途 = `updated_at` 行龄展示 + 接手软语义（patch.executor 改写归属） | 零新状态零新机制；心跳写共享 SQLite / 自动接手 / 自动清 executor = 禁（多进程写竞争 + 绕用户 gate） |

### 2.7 上抛项（非本席写域）

1. **需求档 §2 重复标题**：`ENGINEERING-MODE-V2-SPEC-LEDGER.md` 出现两个「## ② 功能点」（:9 与 :34）——需求档面缺陷，父侧的笔，请收口。
2. **代码头注死指针**：`ledger-db.mjs` / `ledger-cmd.mjs` / `ledger.mjs` 头注仍指已归档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md`——代码面注释，实施轮 eng-coder 顺带改指 `design/LEDGER.md`（与回指改 AC-M2-10 同轮，已列入 2.4 表）。
3. **未验证项（实施轮实跑收口）**：VSC tooltip / CLI 状态行对 L2 扩展段的渲染零改动假设；CLI 胶水切 core 后 TUI 色表注入等价性。

## §3 设计评审（评审子代理）

> 父侧代笔（batch_segment 通道缺失——建档时 §3–§6 骨架未预置，评审席写入被机械门拒；下表**逐字自评审报告** review `22128628` · 2026-09-21 03:15 送达）。父侧注：评审报告两处坐标被主机标「与现盘不符」，经父侧实读核验为误报（`:72`/`:75` 与现盘逐字吻合；三档 mtime 均早于点火时刻，评审窗内零写入）。

### 轮次 1（评审子代理 · 2026-09-21）

**评审范围**（仅三档）：`docs/core/design/LEDGER.md`（全文 275 行）· `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`（全文）· 批次档本档（全文）。

**已核（覆盖面，通过项）**：F-LX1 三件逐条落 §2/§3.1/§7.1/§7.3.1/§9/§8；AC 三链同源成立（需求档 AC-M2-7/8 ↔ 批次 §2.5 ↔ 设计 §8，旧 AC-M2-7/8 重编 AC-M2-9/10 承接、既有回指同步改指）；判位链与写门判序不冲突；出边清除覆盖需求「回退清空」论证成立（六态无回退边）；T19 测试缝合规；受影响文件表全带行数增量、无越线（LEDGER.md 275 < 300 实测吻合）；设计就地并入所有权论证充分 + 变更记录一行。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档一致性 | 🟡 | LEDGER.md:75「行现值兜底」示例 `已废弃 → 在途` 与 §3 迁移表矛盾（LEDGER.md:64 已废弃 = 终态无出边；批次 §1 边界明锁「不改六态状态机与迁移表」）——该示例路径在表内不可达；连带 T15 第三拍（LEDGER.md:238）在「进在途必带 sessionId」优先级下何时可观测未写明 | 兜底示例改用可达路径（`待设计` 行先经 §3.1 case 3 纯字段更新带 executor，再迁在途且 sessionId 缺席）；T15 第三拍注明触发形态（直调不注入 sessionId） |
| 2 | 引用准确性 | 🟡 | LEDGER.md:76 将「回退清除」子句挂名「AC-M2-7」——需求档 AC-M2-7 无「回退」字样；实际出处 = 需求档 §2.1 executor 字段行（「核销 / 废弃 / 回退时清空」） | 引用改指需求档 §2.1 executor 字段行（真出处），不挂 AC 号 |
| 3 | 验收可测性 | 🟡 | T18 第三拍「并发 ALTER 撞 duplicate-column → 复核吞」（LEDGER.md:241）在 K-LX5 选型（预判缺列才 ALTER，LEDGER.md:47）下只在竞态窗可达：预判命中即不发 ALTER，catch 分支无确定性测试入口，未声明注入缝 | 为「catch 后复核」声明测试缝（注入列存在性谓词或伪造 duplicate-column 错喂给复核单元） |
| 4 | 批次档记录 | 🔵 | 批次 §2.7 #1 上抛「需求档两个 `## ② 功能点` 标题（:9 与 :34）」——现盘需求档仅一个该标题（:9；:34 起为 ②.8 条目内 bullets），该缺陷在当前盘面不存在（或已被修） | §6 收口时按现状核销该上抛项（防后续轮次按过期缺陷返工） |
| 5 | 用语一致 | 🔵 | 需求档 §2.8 示例串「在途（属主已死，可接手）」与设计 L2 尾段「（属主已死 &lt;n&gt;，可接手）」（LEDGER.md:196）形态微差——AC 判据串两端一致，AC-M2-8 断言不受影响 | 可选：需求档示例对齐 L2 尾段逐字形态（AC 级判据为准，非必须） |
| 6 | 规格完备 | 🔵 | `staleDays` 可为 null（时间戳缺，LEDGER.md:187），但三态文案分支只写「≥1 / &lt;1」（LEDGER.md:197-198）——全 null 时的分支归属未写明 | 补一句：staleDays = null 按 &lt; 1 分支处理（显「（执行中 &lt;n&gt;）」） |
| 7 | 清晰度 | 🔵 | `state.ledger.warn = aged&gt;0 \|\| deadExecutors&gt;0`（LEDGER.md:203）未钉计算点——buildScan 保持 sync（K-LX2）而 deadExecutors 仅在 async `resolveExecutorStates` 后存在 | 一句话钉位：warn 在核 `runLedgerScan` await 判活解析后重算/回填 |
| 8 | 测试确定性 | 🔵 | TTL 缓存 = 模块级 Map（LEDGER.md:188），未声明测试间清缓存缝——T19/T20 共用该缓存，跨用例顺序可能残留 pid 缓存态 | 与 `_setProcessProbeTestImpl` 同法导出测试用缓存清除（或 TTL 注入），测试 finally 恢复 |
| 9 | 证据边界 | 🔵 | 设计依赖的既有符号（`ownerState`/`probeOwnersAsync`/`PEER_PROBE_TTL_MS`/`getSessionId`/`_setProcessProbeTestImpl`）均在评审范围外，本评审未实核存在性（unverified） | 实施轮开工先实核符号存在与形态一致；`_setProcessProbeTestImpl` 若非既有面而是新建缝，实施注记标明 |
| 10 | 范围 | 🔵 | CLI 胶水「机制归核」（K-LX3，−~20 行）为随批搭载重构，非 F-LX1 必需项——已声明理由（CORE-UNIFICATION #174）且有界（批次 §2.7 #3 列色表等价性为待验证） | 保留可接受；实施验证时把批次 §2.7 #3 两项未验证假设落实验收，不外溢 |

**计数**：🔴 0 · 🟡 3 · 🔵 7。

**VERDICT**: pass

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）

### 5.1 交付摘要
F-LX1 台账执行者归属（executor 列 + 写语义 + 判活展示 + 性能红线）全部落地，测试层三档齐备。
- **核实现**（本批前段已完成）：`ledger-db.mjs`（executor 列 DDL + `ensureExecutorColumn` 幂等迁移 + duplicate 复核吞）· `ledger-cmd.mjs`（三形态判序 + `executorSessionId` 参数 + 两出边/撤回置 NULL + 写门不复活）· `ledger-surface.mjs`（核侧 async 判活 + warn 判位重算）· CLI/VSC 端面归核接线。
- **判活拆分**（计划外，见 5.3）：`ledger-executors.mjs` 新档（resolveExecutorStates / executorTail / TTL 缝），`ledger.mjs` 307→212 行（hygiene 300 软线回线内）。
- **本段新增测试**：`thincoder-core/test/ledger-executor.test.mjs`（T15–T20 六用例）+ CLI `test/ledger-surface.test.mjs` T19 端面 + VSC `test/ledger.test.mjs` T19 端面（slow 层）。

### 5.2 AC 对照（§2.5）
| AC | 用例 | 结果 |
|---|---|---|
| M2-7 T15 三形态写语义 | T15（缺省注入 / patch 显式 / 行现值兜底——第三拍裁定 #1 直调可达）| ✅ |
| M2-7 T16 两出边 + 不复活 | T16（→待核销 / →已废弃 清 NULL，patch.executor 不复活）| ✅ |
| M2-7 T17 close 撤回 / 勾销零触 | T17（撤回置 NULL；勾销哨兵 `keep-me` 原样=零触碰；纯字段零变）| ✅ |
| 老库 T18 幂等迁移 | T18（旧 DDL 裸建→补列行不损 / 二次 false / duplicate 谓词注入→复核吞 + 正拍反证）| ✅ |
| M2-8 T19+双端 L2 | T19 核心（三态文案 + unknown 不判死 + 无在途空串）+ CLI 端面（L2 尾段 + state.ledger.warn）+ VSC 端面（tooltip 尾段 + warningBackground）| ✅ |
| 性能 T20 | T20（无在途零 exec / TTL 界内零 exec+界值重探 / 写径零探测）| ✅ |
| 陈旧在途 T19 | staleDays=3 →「（执行中 1 · 最长 3 天未动）」；<1 天无标注段 | ✅ |

### 5.3 决策透明表
| # | 决策 | 理由 |
|---|---|---|
| 1 | `ledger.mjs` 判活段拆出 `ledger-executors.mjs`（re-export 三件保消费面；formatDetailLine 改直 import executorTail）| 原档 307 行越 hygiene 300 软线；拆分后 212 行。计划外触碰，如实披露 |
| 2 | T19 双端夹具带独立老化行（丁），在途行（丙）仅作判活载体 | 迁在途会刷 `updated_at` 重置自身行龄 → 单行夹具 actionable=false → L2 明细行门关。产品行为正确（行龄=最近活动），夹具须拟真：老化与在途是两条行 |
| 3 | T17 勾销零触用原生 SQL 哨兵值断言（非 NULL 等值断言）| 该态写命令已恒 NULL——NULL==NULL 不可区分「清零」与「未触碰」；哨兵原样保留 = 零触碰可观测（夹具手法同写门用例 T14 先例）|
| 4 | T18 duplicate 竞争拍经 `{exists}` 谓词注入喂复核单元（裁定 #3）| TOCTOU 窗无法真实并发复现；首判 false→ALTER 撞列→复核 true→吞，确定性入口；另加真缺列正拍反证（谓词被消费 + 返回 true）防恒吞假绿 |
| 5 | VSC T19 归 slow 层 | 同 T107 item 形态先例（webview 面板 + initLedgerSurface 装配面）|
| 6 | 探测 TTL 测试缝统一 afterEach 恢复（裁定 #8）| `_setExecutorProbeTtlForTest(null)` / `_resetProcessProbeTestImpl()` 三测试档 afterEach 挂钩——跨用例零污染 |

### 5.4 验证记录
- 定向：core 四档（executor/write-gate/hygiene/process-probe）29/29 ✅
- 全量（npm test 逐项目）：**core 462/462 · CLI 765/765 · VSC 866/866**——三端零红（本段前 CLI/VSC 未重跑欠账一并清偿）
- 中文断言全走 node/grep 扫描（零 findstr）。

### 5.5 遗留
无。三端全绿，AC 全覆盖，无欠账。

## §6 验证与收口（父代理）

### 6.1 实施验证（父侧独立复测 · 2026-09-21 03:41）

- 全量三端**父侧实跑复测**：core **462/462** · CLI **765/765** · VSC **866/866**——零红（与 §5.4 声明一致；core 入口 = `thincoder-core`: `node test/run.mjs`）。
- 定向复测：executor + write-gate **11/11** ✅。
- 交付物在场核：`thincoder-core/ledger-executors.mjs`（新拆档）/ `thincoder-core/test/ledger-executor.test.mjs`（T15–T20）/ 双端面档全部在场。
- 评审 10 项裁定逐条落实施核验：#1 直调形态 ✓ · #3 谓词注入缝+反证拍 ✓ · #5 父侧已改需求档 ✓ · #7 warn 计算点 ✓ · #8 afterEach TTL 清理 ✓ · #10 双端假设实跑（tooltip 尾段 / warningBackground / CLI L2 尾段）✓。

### 6.2 计划外触碰披露核验

- `ledger-executors.mjs` 拆档（决策表 #1）：`ledger.mjs` 307 行越 300 软线 → 拆出判活段（212 行）——**拆分有理、披露如实、re-export 保消费面** ✓ 裁定：接受，登记本 § 为准。
- 其余受影响文件表 9 档无超面触碰（git status 本批面 = 13 档，逐一对号 §2.4 表）。

### 6.3 台账与凭证

- 台账 **#24 → 已核销**（结算依据 = 本 § 6.1 实测 + 落点清单）；#23（P1）保持条件触发不动；#25（batch 工具化）另行在飞。
- 凭证槽 consume：designId `22128628-3ac7-422b-8e20-6aa33b107693`（SESSION-CLAIM 后第二枚——同 designId 再 spawn 机械拒）。

### 6.4 收口

- 提交 = **（本 § 同轮落地，hash 见 git log 本行上方提交）**；提交面 = 13 档（本批 §2.4 全集 + §6 新增披露档）；**他实例在飞面（BATCH-RECORD / TUI / SESSION / TRACES / startup-latency 等）零触碰**——path-limited 提交。
- 状态行冻结：§1 状态行 →「✅ 已收口 2026-09-21」。
- 上抛项核销：2.7-1（需求档重复标题——父侧已修，实盘单标题）**已核销** · 2.7-2（头注死指针）**随实施轮落地** · 2.7-3（双端渲染假设）**实跑收正**（§6.1 末条）。
- 遗留债：无新债。CLI 实例并发实施期间 executor 字段未生效——下一批起「谁在做」可见（本批痛点自我消化的时点注记）。
