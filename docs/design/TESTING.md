# TESTING — 测试基建（分层 / 库存治理 / 精简）

> 板块：测试基建——slow 门机制、测试分层纪律、测试库存治理（拆分轮/清理轮）。2026-09-06 立项（首个设计由 AGENT-LOOP.md §23 迁出——文档归属裁定：五杠杆批只有 L4 属 Agent 循环，测试基建此前无板块文档——用户"可以，这样更合理"）。
> 关联：测试分层收口流程纪律（L0/L1/L2 定义与 R2 裁定）的权威叙述在 `AGENT-LOOP.md` §18.7——本文件 §1 D-T3 对其首次实现粒度做 supersede 修订（修订句届时原位落 §18.7）。

---

## 1. 测试分层与精简（2026-09-06 · 用户需求——"测试已成包袱，过度膨胀"——五杠杆批）

> 状态：**已全部实现——三阶段收口（2026-09-06）**：Phase 1 双端分层+防漏（id:17/18）/ Phase 2 L0+ 流程修订（id:19/20）/ Phase 3 清理+镜像转层（CLI id:22 clean 修正轮 2/5 + VS Code id:23 clean 修正轮 1/5）——父侧 L2 双端并行终验：CLI 1486/1486（83.4s）+ VS Code 1204/1204（71.7s）——断言数对账：CLI 1492→1486（-6 可解释）/ VS Code 1206→1204（-2 可解释）——AC-T1/T2/T3 全绿——**AC-T4 总目标 ✓：链测试墙钟 ≈ eng-coder L0+（秒级）+ 父侧 L2 双端并行 ~83s ≈ 1.6min，较基准 4.5-5.5min 降 ~70%（≥50% 参照线过）**。round2 复审 0🔴（token 1e8dfa40…/designId 072cc73f）——用户批准 2026-09-06。

**背景**（explore 盘点报告 2026-09-06——实测数据）：CLI 1479 用例 / 快层 **39.2s**（设计基数 ~15s——腐化漂移：6.33s ticker、T-SD 1.5-2.5s 系列等漏进快层未归册）；VS Code 1194 用例 / **75.6s 且无分层**（无 slow 门、无 test:full——7s 定时器、6.7s 真 git 全在默认层）。**耗时铁律（slow.mjs 头注释实测）**：>500ms 的 ~32 个用例占 95% CPU；437 个 <5ms 用例合计仅 376ms——**数量不是成本，重 IO 才是**。流程成本：一条双端单点改动 = eng-coder 首次实现全量 L1（39+76s）+ 父侧 L2 全量（估 ~100+76s）≈ **4.5-5.5 分钟测试墙钟/链**——用户"随便改一点就上千个测试"的直接来源。用例构成：内容锚断言 ~6-8%（单价毫秒级——成本在维护不在墙钟）；双端同语义镜像 ~300-400 个（12-15%）。

**需求**（用户 2026-09-06"全做吧"——目标 C：流程少跑 + 真删低价值用例）：

- **总体需求（评审 #5——总目标句入需求段）**：双端单点链测试墙钟 ~4.5-5.5min → **降幅 ≥50%**（验收口径见 AC-T4——相对实测基准而非绝对值）；质量防线不降（父侧 L2 收口不动）；库存信噪比回升（低价值存量清单制清理）。
- **F-T1（L1）**：As a developer, I want the VS Code suite to have the same slow-gate layering as CLI, so that 日常 npm test 从 75.6s 降到 ~20-30s。
- **F-T2（L2）**：As a developer, I want CLI 快层慢测归册（漏网 >500ms 用例进 slow 门），so that 快层回落 ~15-20s。
- **F-T3（L4）**：As a user, I want eng-coder 首次实现验证降为定向 L0+（秒级），全量兜底由父侧 L2 独任，so that 每链省 ~2 分钟且质量防线不降。
- **F-T4（L3）**：As a maintainer, I want 通用逻辑镜像用例以 CLI 为权威端、VS Code 端只留端差异面，so that 双端维护成本减半。
- **F-T5（L5）**：As a maintainer, I want 低价值存量用例（一次性迁移锁/防回潮元测试/同锚多断）清单制清理，so that 库存信噪比回升。
- **F-T6（防漏纪律）**：As a maintainer, I want slow 门有漏网拦截——新慢测进快层被机械发现，so that 快层不再腐化漂移。
- **NF-T1（防线不降）**：父侧 L2 全量收口（R2 裁定）不动；test:full 语义不动；精简收益以**实测基准对比**证明（Phase 1 动手前留底——test:full 最后实测 62.8s@795 用例已失真近一倍）。
- **NF-T2（纪律修订明示）**：本批含两条既往裁定修订（D-T3 修 §18.7 D-TS1 首次实现粒度；D-T4 修"两端各验内容断言"N-TS3/N-AG3）+ 一条红线收窄（D-T5"断言数不减"收窄为拆分轮专用）——均经用户 2026-09-06 裁定（"全做吧" + 计划确认"可以"），照 §18.11 先例（裁定 → 改文档 → 改测试）。

**设计**：

- **D-T1（L1——VS Code slow 门移植）**：移植 CLI `test/slow.mjs` 机制（slow() 包装 + runner 跳过提示可见不隐身 + package.json `test:full` 脚本）。首批归册 = >1s 用例 ~35 个（git 6.70s / time-injection 7.11s×2 / terminal-bash 5.17s / distill 5.15s / bash 后台 5.17s / chat-panel 2s×4 等——**实现批以动手时实测为准**）。**纯增量——不删任何用例**。
- **D-T2（L2——CLI 快层归册）**：快层实测 >500ms 未标 slow 用例全部归册（ticker 6.33s / T-SD 系列 ~15s / T-M/T-SF 1.5s 系列 / verify 0.5s 系列等——实现批以实测为准）。**归册不是删除——test:full 照跑**。
- **D-T6（防漏——两端的门同改）**：slow 门补漏网拦截——快层跑完后机械检查「未标 slow 而 >500ms」的用例，发现即**报错红**（硬拦截防腐化——决策点：红 vs 警告，建议红——**阈值缓冲注（评审 #4）**：拦截阈值高于归册阈值（如未标 slow 而 >800ms 才红）或连续两次超标才红——防机器负载抖动把拦截变成新 flaky 源——实现批定稿）。实现形态：node --test reporter 收集用例耗时 + slow.mjs 注册表比对（实现批定稿细节）。
- **D-T3（L4——§18.7 D-TS1 supersede——用户裁定 2026-09-06）**：eng-coder 内部验证粒度：首次实现从全量 L1 降为 **L0+**（语法检查 + §18.12 定向相关测试——实测 0.06-0.56s 秒级）；修正轮维持 L0 不变；**父侧 L2 test:full 每链终态恰 1 次/端不变**（R2 收口精神延续）。交付报告模板补义务句：「本交付未经全量——父侧 L2 为唯一全量点」逐字锚——**英文逐字锚为权威镜像源（Phase 2 CLI id:19 跟进项 🟡——父侧 2026-09-06 裁定）：** `"not full-suite verified — the parent-side L2 run is the only full-suite point."`（engineering-sub.md L0+ 句——双端逐字一致）受影响：双端 `engineering-sub.md`（内部协议验证段）+ `AGENT-LOOP.md` §18.7 状态注（supersede 注原位落）+ 相关锚断言同步。
- **D-T4（L3——镜像分层——"两端各验内容断言"修订——用户裁定 2026-09-06）**：**行为类镜像用例**（T-SD/T-E 式同语义双端各一套）——通用逻辑以 **CLI 为权威端**；VS Code 端只保留**端差异面**（webview/面板/IDE 通道/原生 UI 回退）。存量镜像用例 VS Code 端**转 slow 门（不删——温和路径，决策点）**；**收益口径明示（评审 #2）**：本轮收益 = 日常墙钟 + 权威端明确化——"维护成本减半"依赖后续二轮删除（Phase 3 任务书预留观察期 → 删除路径）；prompt 内容锚断言**维持双端各验**（副本健康检查——单价毫秒级，锚纪律的载体）。§18.11 先例（byte-identical 取消）同路径。
- **D-T5（L5——存量清理——"断言数不减"红线收窄——用户裁定 2026-09-06 开口子）**：红线收窄为**模块拆分轮专用**（verbatim 迁移保真——system.md Module Split Policy 锚 + METHODOLOGY.md 拆后两验 + T-P1.1 断言同步改表述）；存量清理轮 = **删除清单制**：候选三类 ①一次性迁移零残留锁（12_000 / 16_000/2_000 / ADVISOR_DESIGN_FALLBACK / 旧弱触发句等 ~6-10 个/仓）②防回潮元测试（T-A1.4/T-AR4/T-SP4 等 ~4-6 个/仓）③同锚多断（T-AR1 六锚 4 模板×2 仓等）。**清单逐条列明（用例名 + 删除理由）进实现批任务书——父侧逐条核销——断言数变化 = 清单数（明示差额，不再"不减"）**。预估每仓删/并 20-40 用例（~2%——墙钟无感，收益 = 信噪比 + 维护面）。
- **D-T7（分阶段）**：Phase 1（D-T1 + D-T2 + D-T6——零纪律冲突先行）→ Phase 2（D-T3 流程修订）→ Phase 3（D-T4 存量转 slow + D-T5 清单清理）。每阶段独立 eng-coder 批次（双端镜像并行）+ 父侧核销。**基准先行**：Phase 1 动手前实测两端 npm test + test:full 墙钟留底（记入本节实现注）。

**测试（T-T 系）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-T1 | N | Phase 1 后 VS Code `npm test` | ≤30s（基准 75.6s）+ runner 输出 slow 跳过可见 + `test:full` 全绿 |
| T-T2 | N | Phase 1 后 CLI `npm test` | ≤20s（基准 39.2s）+ `test:full` 全绿 |
| T-T3 | N | 防漏拦截（D-T6） | 构造超过实现批定稿拦截阈值的未标 slow 用例 → 快层报错红；标记后转绿（round2 #2——与 D-T6 阈值缓冲注联动，不写死 500ms） |
| T-T4 | N | 读双端 engineering-sub.md + AGENT-LOOP §18.7 | L0+ 首次实现锚 + "父侧 L2 为唯一全量点"报告义务句逐字在（fail-when-unchanged）+ §18.7 supersede 注 |
| T-T4b | N | 读 VS Code slow 注册表 + 测试文件（Phase 3） | 指定镜像用例（T-SD/T-E 式）均在 slow 门内 + 端差异面用例仍在快层（评审 #3——D-T4/F-T4 专属用例） |
| T-T5 | N | 读 system.md + METHODOLOGY.md | "断言数不减"收窄表述锚（拆分轮专用 + 清理轮清单制——fail-when-unchanged） |
| T-T6 | E | 每阶段双端全量回归 | 全绿零破坏（Phase 3 断言数变化 = 清理清单数——明示差额） |

**受影响文件**：

- **Phase 1**：`test/slow.mjs`（CLI——D-T6 拦截）+ CLI 各测试文件（归册标记——不动用例本体）；VS Code `test/slow.mjs`（新——移植）+ `package.json`（test:full）+ 各测试文件（归册标记）；本文件 §1（实现注——基准实测留底）；双端 CHANGELOG（父侧）。
- **Phase 2**：双端 `src/prompts/engineering-sub.md`（L0+ 锚）+ `AGENT-LOOP.md` §18.7（supersede 注）+ 锚断言测试（双端）。
- **Phase 3**：双端测试文件（镜像转 slow + 清单删除——清单实现前列出进任务书）+ 双端 `src/prompts/system.md`（Module Split Policy 收窄表述）+ `METHODOLOGY.md`（两端根 + docs 版——拆后两验收窄注）+ T-P1.1 等断言同步 + `docs/TODO.md`（清理清单核销——父侧）。
- **VS Code 侧**：变更段实现时落其 `docs/design/ARCHITECTURE.md`（引用本文件——先例形态）。

**被否决/降级备选**：直接删存量镜像用例（降级为转 slow 门——温和路径，可逆）；防漏用警告（降级——建议硬红，腐化根因就是无人拦截）；首次实现完全不验证（否决——L0+ 秒级定向仍在）。

**实现注（Phase 1 · CLI 面——2026-09-06 · eng-coder 主面交付）**：

- **基准留底（动手前实测，4 核机）**：`npm test` 快层 **38.0s**（1489 用例 / skip 48）；`test:full` **72.6s**（1489 用例 / 0 skip）。
- **D-T2 归册（60 条——不动用例本体，只加 slow() 标记）**：首批 24 条 >500ms（ticker 6.33s / T-SD 1.5-2.5s 系 / T-M/T-SF 1.5s 系 / verify / reindexFile 等）；c6 快层实测滚动归册 36 条（清单外允许已逐项列于交付报告——均为真子进程/真 git/真 fs/定时器重 IO 用例，重 IO 才是成本的铁律口径）。归册后快层未归册叶子用例峰值 573ms。
- **D-T6 定稿**：新文件 `test/slow-gate.mjs`（reporter——收集叶子用例耗时，超阈写 JSON）+ `test/run-fast.mjs`（npm test 新入口——spec 直通 stdout + gate 报告判定非零退出）。**拦截阈值定稿 800ms**（评审 #4 阈值缓冲：>归册线 500ms，负载抖动不触红；env `THINCODER_SLOW_GATE_MS` 可覆盖——机制自验用）。**注册表比对省略（恒等式）**：快层 slow() 用例全 skip（test:skip），故「test:pass 且超阈」⇔「未归册」。套件（describe）聚合时长不归拦截口径（归册口径 = 单条用例 >500ms——consult 545ms / acp handlers 642-809ms 两个 describe 聚合因此不归册：子用例各自 <500ms，且改 describe 结构 = 动用例本体，越出"只加标记"边界）。机制自验 `test/slow-gate.test.mjs`（T-T3 红/绿——夹具 `test/fixtures/slow-gate-{unmarked,marked}.mjs`，非 .test.mjs 命名不入 glob）自身走 slow 门（两次 node --test 子进程，秒级），全量层验证。
- **并发调谐（实现批定稿——T-T2 达标的必要手段）**：run-fast 挂 `--test-concurrency=6`（默认 3-4 → 29s 压不到 20s；c6 → ~19s；c8 实测把 400-500ms 中位带通胀过 800 拦截线打地鼠——弃）。test:full 不动（默认调度）。
- **改后实测**：`npm test` **19.7s / 19.2s 两跑**（1491 用例 / skip 110 / 0 fail——T-T2 ≤20s ✓）；`test:full` **86.5s 全绿**（1491/1491、0 skip——T-T6 本阶段面 ✓；较基准 +13.9s = 60 条新归册用例在全量层照跑 + 机制自验 ~1s + 负载波动——用例数 1489→1491 净增 2 = T-T3 自验，零删除零本体改动）。
- **T-T3 红/绿证明**：红 = 夹具未标 slow 150ms（阈值 50ms）→ 退出码 1 + stderr 逐条点名（文件/用例/耗时）+ 修复提示；绿 = 同体 slow() 归册 → 快层跳过、退出码 0、无拦截输出。两端均经 run-fast.mjs 真路径。

**实现注（Phase 2 · CLI 面——2026-09-06 · eng-coder 主面交付）**：

- **D-T3 落地（`src/prompts/engineering-sub.md` 验证粒度段）**：首次实现从 L1 快层降为 **L0+**——镜像锚句逐字落位（"First implementation: verify with L0+ (syntax check + targeted related tests via verify) — do NOT run the full suite; the parent's L2 full run at chain terminal is the only full-suite point." + 报告义务句 "not full-suite verified — the parent-side L2 run is the only full-suite point."）；旧"AFTER the FIRST implementation only"（首次实现 = L1）时机句删除（判断处：L1 定义句保留——D-T3 后 L1 降为仅升级层，L0 null 映射/触主干升级路径不变）；修正轮 L0 句与父侧 L2 句逐字未动。
- **§18.7 原位 supersede 注（AGENT-LOOP.md）**：状态行后落 "> **§18.7 D-TS1 supersede（2026-09-06——TESTING.md §1 D-T3——用户裁定"全做吧"）**……" 注——D-TS1/F-TS1/N-TS6 旧口径保留为 as-of 快照（§18.11 先例同路径）。
- **T-T4 锚断言（`test/prompts.test.mjs`）**：新用例断 L0+ 锚句三段 + 报告义务句逐字 + fail-when-unchanged（旧 L1 时机句零残留）+ §18.7 supersede 注三锚；既有 T-TS1 用例同步修订（"AFTER the FIRST implementation only" 断言 → "escalation tier only"——D-T3 后 L1 = 仅升级层）。
- **零回归**：`npm test` 快层 **18.5s 全绿**（1492 用例 / 1382 pass / 0 fail / skip 110——用例数 1491→1492 净增 1 = T-T4 新用例，零删除零本体改动）；本批纯提示词/文档/断言纪律修订——运行时代码零改动。

**实现注（Phase 3 · CLI 面——2026-09-06 · eng-coder 主面交付）**：

- **D-T5 删除清单（用户 2026-09-06 逐条批准——16 条全执行）**：①一次性迁移零残留锁——advisor-review「无 12_000 边界残留」整案（MAX_RESULT_CHARS 正向断言在 prompts.test 兜底）；agent-core「16_000/2_000 无残留」整案（案内 64*1024 正向断言连删——offload 行为面由 agent-core 既有 offloadToolResult 系列用例（落盘/预览预算/保留期）+ cross-repo-parity 64*1024 锚兜底）；ADVISOR_DESIGN_FALLBACK 行 / T-N1.5 旧弱触发行 / T-PS2 旧手动避让零残留 ×6 行 / T-A1.4 旧 medium 档行 / N-TS4 行 / Mirror-parallel 行；「无旧硬句」整案（新句 T-10.2 正向锁在）。②防回潮元测试 4 整案——eng-delivery T-A1.4 预算句 / prompts T-A1.4 quick 档 / T-AR4 / T-SP4（正路径锚 T-A1.2/T-A1.1/T-AR1/T-SP1+T-SP2 在，锚缺即红）。③同锚多断 3 组终态——`Never assign two parallel eng-coders`：prompts:472 删 + :67 随清单 #5 删（双钉皆无，T-PS1 正向锚在）；`Never give parallel subagents…`：prompts:80 随清单 #5 删 + exploration-summary:122 删（双钉皆无）；`at most 4 concurrent`：删 prompts:54-55，留 eng-delivery:784-785（随 T-E16 schema 案）。
- **连带清理（被删断言的孤立残留——同批）**：T-PS2 引导注释 ×2 / T-A1.4 防回潮注释 / mirror 句注释 / T-N1.5 注释；三案标题修剪（委托引导 / Delegation / advisor.mjs 硬加载——标题不再点名已删断言）；T-AG5 案 roleDesc 支撑行（仅喂被删负向断言）；advisor-review readFileSync 死进口。docs/design/METHODOLOGY.md §变更记录 218 行历史快照不动（as-of 记录）。
- **红线收窄（D-T5 开口子——双端镜像锚照抄）**：`src/prompts/system.md` Module Split Policy ④ 尾追英文锚句（"Assertion-count parity binds splits only — inventory cleanup rounds delete per an explicit itemized list (count delta = list)."）；根 + docs/design 双 `METHODOLOGY.md`「拆后两验」行尾追收窄注（「断言数不减 = 拆分轮专用红线；存量清理轮 = 删除清单制，差额 = 清单数——2026-09-06 收窄」）。
- **T-T5 断言（`test/prompts.test.mjs`）**：新用例断 system.md 英文锚 + 双 METHODOLOGY.md 收窄注（fail-when-unchanged）；T-P1.1 案内补断同一新锚句。
- **差额对账（T-T6 口径——断言数变化 = 清单数）**：删前基线 npm test **1492** 用例（1382 pass / 110 skip / 0 fail / 18.7s）+ test:full **1492/1492**（85.6s）；删后 npm test **1486** 用例（1376 pass / 110 skip / 0 fail / 17.7s）+ test:full **1486/1486**。用例差 **-6** = 7 整案删除（清单 #1/#2/#10/#12/#13/#14/#15）− 1 新增（T-T5）；行级删除 9 条（清单 #3-#9/#11/#16）不影响用例计数。**明确不删项均未动**（9-06 迁移锁 / lint T-L3 / T-AG4 / bash T-B1' / render-loop outputPanels）。零回归。

**验收（AC-T）**：

- **AC-T1** = T-T1/T-T2/T-T3 绿（Phase 1：分层收益实测达标 + 防漏拦截证明）。
- **AC-T2** = T-T4 绿（Phase 2：流程修订锚落位）。
- **AC-T3** = T-T4b/T-T5/T-T6 绿（Phase 3：镜像归册验证 + 红线收窄 + 清理清单逐条核销 + 断言数差额明示）。
- **AC-T4（总目标——round1 #1 修订：相对口径）** = 链测试墙钟 ≤ 父侧 L2 实测（**双端并行**——本会话已实证可行）+ ~10s——预期 4.5-5.5min → ~2-2.5min（**降幅 ≥50% 为预期参照**——相对 5.5min 上限基准——round2 #1：主判据 = 左侧并行口径公式，二者冲突时以公式为准）——基准实测对比 + 父侧终验；不补 L2 瘦身杠杆（评审 #1 裁定——范围扩太大且与 L5 正交；L2 双端并行跑 = 核销操作纪律）。

**流程承诺（评审 #5）**：实现批启动时按 T-T 系逐条建 checklist 条目。
