# 2026-10-08 · 索引自维护
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-08 · 来源 = 用户 2026-10-08 14:43「我发现我们需要索引的自动维护能力」+ 14:46「可以，应该也允许agent触发」（范围 A+B+C 拍板 + agent 触发通道增补）。
> 台账 = #1096（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-08
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 需求与范围裁定（2026-10-08 14:43–14:46 · 主 agent）

- 用户「我发现我们需要索引的自动维护能力」→ 父侧摆范围（A 跨 origin 鬼行 GC ∥ B 压实自触发 ∥ C 备份轮转 ∥ D 读数挂靠 §4.10）→ 用户 14:46「可以，应该也允许agent触发」= **范围 A+B+C 拍板 + agent 触发通道增补**（D 挂靠 §4.10 顺带；origin 结构卫生另议）。
- **触发模型** = 启动后低峰窗口 + 阈值双条件（余量正常 = 零动作零空转）。
- **证据面**（当日全手动清算五实例）= 需求档 §4.12 来源段；**安全封套同律**（自动 ∥ agent 触发同引擎同口径：备份先行 ∥ ENOENT-only ∥ 干跑日志 ∥ 写后回读）= §4.12 N-S8。
- 落地 = 需求档 §4.12（F-S10–F-S13 ∥ N-S8–N-S9 + 判定句）；台账 **#1096**（在途）；本批设计轮 = eng-designer（§2 落点 = `docs/core/design/MEMORY.md` §6.14 段族）。

### 1.2 授权（2026-10-08 14:47 · 用户「自动跑完。」）

- **射程** = 本批全链：设计评审点火（代点火）∥ §4 代签 ∥ 修正轮派发 ∥ 实施轮派发 ∥ 收口核销 ∥ 提交双推 ∥ token 消费——父侧自动执行，不必逐次请点。
- **父侧自缚三条**（本仓惯例 · 先例同形）：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停、只摆那一条；③ 破坏性 ∥ 不可逆（数据 ops ∥ 强杀 ∥ 外仓写）⇒ 先停。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 1 · 7 条发现逐条收正；doc-check 复跑 exit 0——悬空 0 ∥ 行宽 0）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 · 三方一致锚 = 需求档 §4.12）

- **覆盖（全量）**：F-S10 跨 origin 鬼行 GC ∥ F-S11 压实自触发 ∥ F-S12 备份轮转 ∥ F-S13 agent 触发通道 ∥ N-S8 安全封套同律 ∥ N-S9 零空转。
- **显式不在本批**：CLI 命令形（`memory maintain`）∥ origin 结构卫生（盘根僵尸 ∥ 变体折叠 ∥ 嵌套重叠）∥ 收录范围自动扩缩（收录 = 声明 ∥ 名单面）∥ worker 化（升级触发承 §6.14 面② 判据腿）∥ `files` 表维护 ∥ §6.11 ∥ §6.13 既有判据改（复用非改）。
- **判定句**：四条 = 需求档 §4.12（回指该节，不复制）；机检形 = 设计档 §6.14 **L-⑥-1–L-⑥-6**（映射见 2.5）。

### 2.2 设计档落点（已落盘 · 与 §6.11 ∥ §6.13 口径对齐）

- `docs/core/design/MEMORY.md`：§6.14 新增**面 ⑤（自愈轮）**（引擎单源表 ∥ ⑤-1 鬼行 GC ∥ ⑤-2 压实 ∥ ⑤-3 轮转 ∥ ⑤-4 工具通道 ∥ ⑤-5 触发接线 ∥ ⑤-6 安全封套 ∥ L-⑥-1–6 ∥ 边界）；
  §7 补 **D-MEM33–D-MEM38**；§6 族动作计数**五 ⇒ 六**（§6.1 ∥ §6.6 ∥ §6.6.1 ∥ §6.9 ∥ §8.3 五处同拍）；变更记录行。
- §6.14 两处失效句随批收正（面③ P3「无任一自动删除」∥ §6.14 尾「不做自动删除 ∕ 自动 VACUUM」——改指面 ⑤；D8 失效句删除——逐处已报告，见 2.7）。
- 需求档 §4.12 设计侧行 = 设计档 §6.14 段族——本轮落面 ⑤（即该段族）。

### 2.3 机制摘要（细 = 设计档面 ⑤）

- **引擎** = 核新档 `thincoder-core/memory/maintain.mjs`——单入口 `maintainMemory`（自动拍 ∥ 工具同一单点）；单源复用 = `sweep.mjs`（`probeOriginPath` ∥ `treeState` ∥ `takeBackup` ∥ `originCounts`——三处加 `export`，零行为变）；折叠面不涉（信号 A 归 sweep 全扫档）。
- **鬼行 GC（F-S10）**：全 origin 逐档扫描（code ∥ doc 两表）；判亡 = 双路径（原样 ∥ 归一形）皆 ENOENT（仅 ENOENT 判亡）；树亡短路；活行零触；安全三件同律（备份先行 ∥ 干跑默认 ∥ 写后回读）。
- **压实（F-S11）**：`freelist ≥ 64 MiB ∧ freelist ∕ db ≥ 20%`（核常量——缺省值待用户拍）；未越零动作；`VACUUM` 后回读（freelist 回落）。
- **轮转（F-S12）**：严格名族 `<basename>.sweep-backup-<14 位戳>`；保 N（`config.memory.maintain.backupKeep`——缺省 2 · 钳 ≥ 1）；引擎直落删。
- **工具（F-S13）**：`memory` 工具 action `maintain`（六动作）——缺省干跑 ∥ `confirm:true` 执行；描述文本 = `tool-docs/memory.md`（主 agent 定稿）。
- **触发**：核侧 `scheduleMemoryMaintenance`（每进程一次 ∥ 3 s 延迟拍 ∥ 静默 + `logEvent`）；落点 = CLI（`startup.mjs` `backgroundIndex` 尾）∥ 桌面（`main.mjs` 启动拍邻位 + 新档 `memory-maintenance.mjs` 惰性转口）；幂等三腿（进程内 ∥ 逐动作闸 ∥ 跨进程事务）。

### 2.4 受影响文件与测试面（现读数 = 实读 2026-10-08；Δ = 预计 ≤±N；结构不变）

| # | 文件 | 现读数 | Δ（≤±N） | 结构 |
|---|---|---|---|---|
| 1 | `thincoder-core/memory/maintain.mjs` | — | 新档 ≈300 | 新档（引擎 ∥ 调度 ∥ 报告） |
| 2 | `thincoder-core/memory/sweep.mjs` | 289 | ≤+6（三处 `export`） | 结构不变（零行为变） |
| 3 | `thincoder-core/memory/memory-tool.mjs` | 229 | ≤+30（action ∥ 执行器） | 结构不变 |
| 4 | `thincoder-core/tool-docs/memory.md` | 10 | ≤+10（maintain 段——文本归主 agent） | 文本面 |
| 5 | `thincoder-core/config.mjs` | 494 | ≤+4（`memory.maintain.backupKeep` 缺省） | 结构不变（近 500 软线——若越线随批登记拆档评估） |
| 6 | `thincoder-cli/src/tui/startup.mjs` | 334 | ≤+10（收尾调度接线） | 结构不变 |
| 7 | `thincoder-desktop/src/main/memory-maintenance.mjs` | — | 新档 ≈45 | 新档（惰性转口——零 electron） |
| 8 | `thincoder-desktop/src/main/main.mjs` | 265 | ≤+4（启动拍邻位调用） | 结构不变 |
| 9 | `thincoder-vscode/src/memory-tool.mjs` | 73 | ≤+4（动作清单 + `maintain`） | 结构不变 |
| 10 | `docs/batches/2026-10-08-index-automaintain.test.mjs` | — | 新增（批内件） | L-⑥ 直测（沙箱库） |

测试面 = 单元批内件（沙箱库 + 直测 L-⑥-1–6）；集成面无新增（后台机制——不进现有集成场景）；既有套件回归 = 收口轮父侧跑。

### 2.5 验收对照（判定句 → 机检形）

- F-S10 ⇔ L-⑥-1（三 origin 夹具：干跑零写 ∥ confirm 死档归零 + 活行逐键不变 + 备份在册 ∥ 探针错保留）。
- F-S11 ⇔ L-⑥-2（双式全越 ⇒ 执行 + freelist 回落 ∥ 单越一式跳过 ∥ 全未越零执行）。
- F-S12 ⇔ L-⑥-3（N+k ⇒ 恰余 N + 最老者清 + 干扰档在场）。
- F-S13 ⇔ L-⑥-4（干跑 ∥ confirm 读数 + 三段齐 + VSC 闭集）。
- N-S8 ∥ N-S9 ⇔ L-⑥-5（单点 ∥ 备份两腿 ∥ 零空转）。
- 接线 ∥ 幂等 ⇔ L-⑥-6。

### 2.6 关键决策（细 = 设计档 §7）

- D-MEM33 单引擎单入口 ∥ D-MEM34 逐档 ENOENT 双路径判亡 + 树亡短路 ∥ D-MEM35 压实双式联立 ∥ D-MEM36 轮转严格名族 + 保 N ∥ D-MEM37 工具 action（干跑默认；命令形不做）∥ D-MEM38 启动后延迟拍 + 幂等三腿。

### 2.7 上抛与登记

- **[上抛·待裁]** 需求档 `docs/core/requirements/MEMORY.md` §4.10 F-S8 范围边界句「无自动删除 ∥ 自动 VACUUM」与本批 §4.12（自动删除 ∥ 自动压实 ∥ 轮转）相抵——收正归主 agent 笔（设计面已按 §4.12 为最新口径；设计档两处失效句已随批收正并逐处报告）。
- **[上抛·知会]** 需求档两处「五动作」计数（`:61` F4 ∥ `:143` F-M3——`memory` 工具动作现在 = 六）建议随批收正（需求档零触——父侧笔）；`docs/core/requirements/NORMAL-MODE.md:70` 示例动作清单同理（低优先）。
- **[上抛·知会]** 缺省数值 = 提案待用户拍（§4 批准时可改，零机制改）：压实 `64 MiB ∧ 20%` ∥ 轮转 N=2 ∥ 延迟 3 s ∥ 鬼行不设阈值（扫描 = 判定成本，写入面零空转）。
- **[上抛·知会]** `tool-docs/memory.md` 描述文本 = 提示词面——主 agent 定稿（设计只钉动作名 ∥ 参数 ∥ 输出契约 = 面 ⑤-4）。
- **登记（接受面）**：① CLI home 根启动档（`backgroundIndex` 早退）不拍维护——维护为库全局、非 cwd 依赖；home 启动本为被指引避免档（`thincoder-cli/src/tui/startup.mjs:279-282`）。
  ② `VACUUM` 单语句不可让出——窗口内少见档执行，升级路径 = worker（承面② 判据腿）。③ 库外备份手动清理通路 = 改名 `tmp-*`（temp 面）后经 delete 工具（本会话实证——面 ⑤ 已载 ops 参考）。

### 2.8 自检（交付前一趟）

- **读回核过（D6）**：设计档面 ⑤ `:648-701` ∥ §7 D-MEM33–38 `:772-777` ∥ §6.6 六动作面 `:192-206` ∥ 变更记录 `:825-826`——逐处实读在位。
- **机检门（单引擎 · `node scripts/doc-check.mjs`）**：**OK(锚) 0 悬空** ∥ **OK(行宽)** ∥ 行数面差异 0 —— exit 0。首跑 1 条悬空 = `docs/core/design/MEMORY.md:654`（`thincoder-core/memory/maintain.mjs` 新档引用）⇒ 补「（拟新增）」标（拟新增计数 25 ⇒ 26）后复跑归零。
- **三方一致**：需求档 §4.12（F-S10–S13 ∥ N-S8–S9）⇔ 设计档面 ⑤（L-⑥-1–6）⇔ 本 §2（2.1 ∥ 2.5）——逐条同源。

**设计评审修正轮（§3 轮次 1 发现 1–7 · 父侧逐条裁定接受 · 2026-10-08 · eng-designer）**

- **F1（🟡 · 自动拍写姿态明写）**：设计档 `docs/core/design/MEMORY.md:682`（⑤-5）∥ `:686`（⑤-6）——**非干跑**（计划随行后执行 ∥ 备份先行）；干跑默认只辖工具缺省（⑤-4）。与需求侧收正句对齐（F-S10「干跑读数随行——工具面缺省 = 干跑」∥ N-S8 同拍；父侧同轮已落）。
- **F2（🟡 · 让出腿 + 已知界登记）**：同档 `:697` 补 **L-⑥-5 ④ 让出腿**（注入计数 `yieldFn` ⇒ 鬼行扫描越阈值时让出次数 ≥ 1——承 L-②-3 形）∥ `:694`（L-⑥-2 尾）登记 **`VACUUM` 已知界**（单语句不可让出——阻塞 = 恰一次全库重写；本批手清实例 2054.1 ⇒ 1006.0 MiB；时长未记）。
- **F3（🔵 · 两缝点名）**：同档 `:672`（⑤-2）∥ `:694`（L-⑥-2）——阈值注入参数（`??` 缺省核常量）∥ `vacuumFn` 注入（缺省 = `exec` 形 `VACUUM`；执行观测 = 注入计数）。原「spy 句柄零 `VACUUM`」形删除（exec 形观测改注入计数——设计档零残留）。
- **F4（🔵 · 表集点名）**：同档 `:692`（L-⑥-1）——表集 = `code_chunks` ∥ `doc_chunks`（夹具 ∥ 读回 ∥ 「鬼行 0」限此二表）；`files` 行归 §6.13 sweep ∥ `syncDir` 面。随带折行（333 ⇒ 293 ∥ 42 字符——≤300）。
- **F5（🔵 · 钳制支）**：同档 `:695`（L-⑥-3）——钳制支 = N=0 ∥ 负值 ⇒ 引擎钳 1 ⇒ 恰余 1。
- **F6（🔵 · VSC 缺位登记）**：同档 `:683`（⑤-5 落点）——**VSC 自动拍缺位登记** = 端壳多窗 ∥ 惰性句柄；自动拍不落 VSC，触发经工具面（⑤-4）。
- **F7（🔵 · 工具一面即达标）**：同档 `:777`（D-MEM37）∥ `:701`（面⑤ 边界）——**工具一面即达标**（命令形 = 边界在册）——与需求侧收窄后判定句（工具面）对齐。
- **随动**：§7 D-MEM33 措辞对齐（「干跑读数」⇒「读数随行」——`:773`）；设计档变更记录增修正轮条目（`:826-827`）；本档 §2.5 N-S8 ∥ N-S9 行读作「单点 ∥ 备份两腿 ∥ 零空转 ∥ **让出腿**」（批档 append-only——以本块为准）。
- **复核**：`node scripts/doc-check.mjs --root thincoder` 复跑 = **exit 0**——OK(锚) 0 悬空 ∥ OK(行宽) ∥ 行数面差异 0（拟新增 26 不变——不劣化）；七条逐条读回在册（旧句面「计划先落报告 ∥ spy 句柄零 `VACUUM` ∥ 干跑读数 ∥ 写后回读 ∥ 阈值注入缝」设计档零残留）。
- **零机制改**（判定 ∥ 名族 ∥ 阈值 ∥ 单点不变）；产品码 ∥ 测试件 ∥ 需求档零触；域外注记 3 条（① 落点指针 ∥ ② §2.2 #134 ∥ ③ D-MEM24/26 字面）本轮不动——父侧另裁。

**交付评审收口轮（设计侧 3 条 + ① 口径族随裁扩面 · 父侧裁定 · 2026-10-08 · eng-designer）**

- **① 口径族收正（随父裁扩面至 §6.15 两处）**：`docs/core/design/MEMORY.md`——§6.15 机制 1（`:720`）∥ §6.15 边界（`:735` ∥ `:736`，随带折行）∥ §8.3 登记面（`:822`）三处改写：存量行归 §6.14 面 ⑤ 维护面回收（备份窗内可回滚；树恢复 ⇒ 重新同步）；同步面「整根跳过 ⇒ 不扫不删」事实保留（限同步面）；ops `sweep --origin` 通路在册。#832 期「保留」口径由维护面收编——**旧字面 grep 零残留**（`存量行保留` ∥ `不自动删` ∥ `无自动删除` ∥ `自动删除不可接受` 四式全零）。
- **② 导出计数收正（实核对——推翻「4」）**：`git diff HEAD` ∥ `git blame` 实读——本批实增 = **3 处**（`thincoder-core/memory/sweep.mjs`：`treeState` `:42` ∥ `originCounts` `:49` ∥ `takeBackup` `:134`）；`probeOriginPath` `:36` ∥ `backupPathFor` `:123` 均 2026-09-25（b19fcb9bc）建档即 export。设计行 1 收正（`MEMORY.md:658`：「两处加 `export`」⇒「`treeState` 加 `export`（`probeOriginPath` 原已 export）」）；§2.3 ∥ §2.4「三处」计数与实相符（同句并列名单含 `probeOriginPath` 系误列——以本块为准）；§5.1 名单 ∥ §5.5「实读 4」同误（供父侧知悉）。
- **③ §7 旧决策行核（改指注）**：D-MEM24（`:765`——折行后行号，原 `:764`）「自动删除不可接受」⇒「存量剪枝须用户批准 + 父侧 ops（自动删除 = §6.14 面 ⑤）」；D-MEM26（`:767`，原 `:766`）「**无自动删除**」⇒「**自动删除 = §6.14 面 ⑤**」。理由：两字面为 P3 ∥ §6.14 尾同族失效句之遗漏；收窄 ∥ 改指消抵，判据零改（存量剪枝 = 收录面手工路径不变；护栏「只停新增」不动）。
- **读数（复跑）**：`node scripts/doc-check.mjs --root D:\teamcode\thincoder` ⇒ **exit 0**——OK(锚) 0 悬空（候选 53253 ∥ 拟新增 25 ∥ 迁移期引文 320 ∥ 声明源缺位 0）∥ OK(行宽) ∥ 行数面差异 1 条（SHELL.md:178 既有——与基线一致）。编辑诸行行宽逐行 ≤300（`:827` ∥ `:828` = 206 ∥ 196）；诸行读回在册。**零机制改**；产品码 ∥ 需求档 ∥ 测试件零触。
- **[知会]** export 计数以本块为准（§2.3 ∥ §2.4 计数正确、名列误列；§5.1 ∥ §5.5「4」误）；折行使其后行号 +1（原 :764/:766/:821 ⇒ 现 :765/:767/:822）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖 ∥ 文档状态 | 🟡 | 同一「回收动作安全三件」在需求档两处措辞不一：F-S10 列「干跑默认」（`requirements/MEMORY.md:246`——「回收动作走安全三件（备份先行 ∥ 干跑默认 ∥ 写后回读）」），N-S8 列「干跑日志」（`:251`），F-S10 判定句写「干跑先行读数在」（`:253`）；设计侧自动拍的写姿态只在 ⑤-6 以「干跑读数随行（计划先落报告）」（`design/MEMORY.md:686`）隐含，未单句明写（⑤-4 的「缺省 = 干跑（计划 + 逐动作读数——零写）」只辖工具面——`:678`）。按 F-S10 字面把自动拍实现成零写 ⇒ 与同节总体「自己完成」及 F-S11 ∥ F-S12 相抵。 | 在 ⑤-5 ∥ ⑤-6 明写自动拍写姿态（计划随行后执行 ∥ 备份先行——非干跑）；并把 F-S10「干跑默认」与 N-S8「干跑日志」、判定句「干跑先行读数在」三处措辞对齐（干跑默认只辖工具缺省）。 |
| 2 | 验收标准 | 🟡 | N-S8 的「低峰不阻塞」半条（`requirements/MEMORY.md:251`）在 L-⑥ 族无判据腿：⑤-6 声明「鬼行扫描分片让出（`SCAN_YIELD_MS` 口径——探针循环读钟让出）」（`design/MEMORY.md:687`），但 L-⑥-1–6（`:692–697`）无让出断言（同档先例 = L-②-3 的「注入计数 `yieldFn`」腿，`:630`）；「`VACUUM` 单语句不可让出」（`:687`）无读数 ∥ 上界登记。 | 补一条让出腿（注入计数 `yieldFn` ⇒ 鬼行扫描越阈值时让出 ≥ 1，承 L-②-3 形）；`VACUUM` 阻塞段以一行已知界（或实测读数）登记。 |
| 3 | 验收标准（可判性） | 🔵 | L-⑥-2 依赖两处未点名的缝：「阈值注入缝」（`design/MEMORY.md:693`）未在 ⑤-2（`:670`——只写「核常量」）出现；「spy 句柄零 `VACUUM`」（`:693`）观测路径未说明——承 L-②-4 的「记录 `prepare(sql)`」录制点（`:631`），若压实经 `exec` 形语句执行则该断言可能观测不到（node:sqlite 语义未在本档内核实——unverified）。 | 在 ⑤-2 ∥ L-⑥-2 点名两缝（阈值 override 参数或模块级 setter + `??` 缺省；VACUUM 观测 = exec 录制或注入 `vacuumFn`）。 |
| 4 | 清晰性（面 ∥ 需求对齐） | 🔵 | GC 表面 = `code_chunks ∥ doc_chunks`（`design/MEMORY.md:664`）、`files` 表不涉（`:668` ∥ `:700`），而 F-S10 正文「扫「文件已不在」的行并回收」（`requirements/MEMORY.md:246`）与判定句「鬼行 0」（`:253`）未点名表集——夹具与「鬼行 0」的表面靠读者推定。 | 在 F-S10 或 L-⑥-1 点名表集（`code_chunks` ∥ `doc_chunks`；`files` 行归 §6.13 sweep ∥ `syncDir` 面），消夹具歧义。 |
| 5 | 验收标准（边界支） | 🔵 | 钳制行为无私下判据腿：⑤-3「缺省 2 · 钳 ≥ 1」（`design/MEMORY.md:675`）、D-MEM36「N ≥ 1 = 需求明文锚」（`:775`）、F-S12 边界「N 下限护栏（≥1 锚）」（`requirements/MEMORY.md:248`）——L-⑥-3（`:694`）只覆盖 N+k ⇒ 恰余 N。 | L-⑥-3 补一支：N=0 ∥ 负值 ⇒ 引擎钳 1 ⇒ 恰余 1。 |
| 6 | 清晰性（落点面） | 🔵 | ⑤-5 落点三处 = CLI ∥ 桌面 ∥ agent（`design/MEMORY.md:683`——「③ agent：会话内工具显式（⑤-4）」），未含 VSC 端自动拍；VSC 仅经工具面触达（⑤-4）——该缺位未登记为有意缺席。 | 一句登记（端壳多窗 ∥ 惰性句柄——自动拍不落 VSC，触发经工具面），或补落点。 |
| 7 | 需求措辞（判定句 ∥ 设计裁定） | 🔵 | F-S13 判定句「agent 通道（工具 ∥ 命令）一次调用产出全读数（各动作执行 ∥ 跳过 + 理由）」（`requirements/MEMORY.md:253`）与 D-MEM37「命令形不做」（`design/MEMORY.md:776`）+ 边界「不做 CLI 命令形（引擎已备——出现实测需求再补）」（`:700`）并存——判定句按字面含命令通道。 | 判定句收窄为「工具通道」，或加一句「工具一面即达标（命令形 = 边界在册）」消歧。 |

域外注记（不在本批目标面，无严重度）：① `design/MEMORY.md:77–81` 落点指针族未含本批行（`docs/batches/2026-10-08-index-automaintain.md`——同日盘根门批已加于 `:81`）⇒ 本批「受影响文件 ∥ 行数注」承载面无指针，行数注在本轮无法核对；② `:37`（§2.2 #134）「两端动作集同规格（五动作 / layer 词面）」——动作数今为六（本批五处同拍未含 §2 冻结面，承「逐字搬入」纪律）；③ `:763`（D-MEM24）「自动删除不可接受」∥ `:765`（D-MEM26）「无自动删除」字面与面⑤ 并存——本批两处失效句收正（`:826`）未含此两行。

VERDICT: pass

计数：🔴 0 ∥ 🟡 2 ∥ 🔵 5；域外注记 3 条（无严重度）。

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**——用户 2026-10-08 14:47「自动跑完。」授权（§1.2 在册）。

- **三条件齐备** ✓：① 设计评审 pass 0🔴（§3 轮次 1——🟡 2 ∥ 🔵 5 全裁定接受）；② 修正轮已落地并逐条核验（7/7——父侧实读 `design/MEMORY.md:682 ∥ :686 ∥ :692-697 ∥ :701 ∥ :773 ∥ :775-777` 逐条在位 ∥ 旧句面 grep 零残留）；③ token 已签发（值不入档）。
- **批准范围** = 本批实施轮（§2.4 十档）+ 后续收口链（实施核验 → §6 → 台账 #1096 核销 → 提交双推 → token 消费）。
- **缺省数值（提案核准 · 可配项——随时可改）**：压实 `64 MiB ∧ 20%` ∥ 轮转 N=2 ∥ 延迟 3 s ∥ 鬼行不设阈值。
- 依据登记 = §3 ∥ §2（含 2.4 十档表）∥ §1.1–1.2。可撤回。

## §5 实施记录（eng-coder）
**状态行**：实施完成（10 档在册 ∥ 审计 CLEAN ∥ 评审 pass ∥ 批内件 6/6；修正轮 1 = 提示词面 4 处定点落地；修正轮 2 = 收窄句定稿落地 —— 字节读回 ✓ ∥ DESC 新片命中 ∥ 旧片零命中 ∥ 审计 CLEAN ∥ 评审 pass ∥ 4 🔵 建议面上抛）



### §5 实施记录（eng-coder · 2026-10-08 · 自愈轮）

**范围**：任务书 = 本档 §2.3 机制摘要 ∥ §2.4 十档表 ∥ §2.5 验收对照 ∥ L-⑥-1–6；设计权威 = `docs/core/design/MEMORY.md` §6.14 面⑤ `:648-701` + §7 D-MEM33–38；需求锚 = 需求档 §4.12（F-S10–S13 ∥ N-S8/N-S9）；台账 #1096。

#### 5.1 改动清单（10 档 · 全在 §2.4 声明面内 · 零清单外改动）

| # | 档 | 落点（行号为交付态实读） |
|---|---|---|
| 1 | `thincoder-core/memory/maintain.mjs`（新 410 行） | 引擎 `maintainMemory` `:258` ∥ `ghostGcStep` `:108` ∥ `vacuumStep` `:181` ∥ `rotateStep` `:214` ∥ `scanGhosts` `:80` ∥ `twoPathState` `:58` ∥ 报告 `formatMaintainReport` `:336` / `maintainActionCount` `:347` / `maintainLine` `:354` ∥ 调度 `scheduleMemoryMaintenance` `:389` + 测试缝 `:371` `:373` ∥ 常量 `:40` `:42` `:44` `:46` |
| 2 | `thincoder-core/memory/sweep.mjs`（+3 行） | `probeOriginPath` `:36` ∥ `treeState` `:42` ∥ `originCounts` `:49` ∥ `takeBackup` `:134` 加 `export`（零行为变；`backupPathFor` 原已 export） |
| 3 | `thincoder-core/memory/memory-tool.mjs`（+15 行） | `MEMORY_ACTIONS` 六项 `:21` ∥ import 单点 `:12` ∥ `execMaintain` `:239` ∥ `confirm` 参数描述扩展 `:66` |
| 4 | `thincoder-core/tool-docs/memory.md`（+1 行 → 11 行） | `:7` maintain 行（父侧定稿逐字，字节比对 ✓） |
| 5 | `thincoder-core/config.mjs`（+2 行，496 ≤ 500 软线） | `:73` `maintain: { backupKeep: 2 }`（浅并入 `:319` 保位） |
| 6 | `thincoder-cli/src/tui/startup.mjs`（+9 行） | `:338-342` `backgroundIndex` Ready 置后接线（`onReport` 一行缝） |
| 7 | `thincoder-desktop/src/main/memory-maintenance.mjs`（新 21 行） | 纯动态 import 转口（零静态 import） |
| 8 | `thincoder-desktop/src/main/main.mjs`（+3 行） | `:252-253` 启动拍邻位调用（零参 → 核侧 config 现读） |
| 9 | `thincoder-vscode/src/memory-tool.mjs`（+0 行） | `:23` `MEMORY_ACTIONS` 六项（`isReadonlyAction` 零改） |
| 10 | `docs/batches/2026-10-08-index-automaintain.test.mjs`（新 448 行） | L-⑥-1–6 六腿 |

#### 5.2 验证读数（全实跑）

- **批内件**：`node --test docs/batches/2026-10-08-index-automaintain.test.mjs`（cwd = 仓库根 `D:/teamcode/thincoder`）⇒ **6/6 全绿 · 0 fail · duration 768.8ms**（L-⑥-1 76.7 ∥ 2 52.5 ∥ 3 22.7 ∥ 4 105.6 ∥ 5 201.1 ∥ 6 203.5 ms）。
- **语法面**：9 个 `.mjs` 逐档 `node --check` 全过（含批内件）。
- **行数面**：maintain 410（新档，≤500 软线）∥ sweep 292（+3 ≤ +6）∥ memory-tool 244（+15 ≤ +30）∥ tool-docs 11（+1）∥ config 496（+2 ≤ +4）∥ startup 343（+9 ≤ +10）∥ relay 21 ∥ 桌面 main 268（+3 ≤ +4）∥ VSC 73（+0）∥ 批内件 448（新增）。
- **回归守卫（射程相交面）**：`docs/batches/2026-09-29-residuals-round2.test.mjs` 12/12 全绿——W8 端壳静态闭包零 `node:sqlite` 仍成立（本批 `memory-tool.mjs` 静态引 `maintain.mjs` 未破闭包）。
- **未做（口径内）**：repo 套件全跑 = 父侧收口项。旁证：`2026-09-30-crossline-clearance-vsc.test.mjs` 10/11——T-XL15c 红，根因 = **他流在途未提交改**（`thincoder-vscode/webview/settings-providers.js` #1053 在编守卫，该测试断言旧重建行为），与本批十档零交集；同批 `T-XL9`（两端描述字节同源）绿——本批 tool-docs 改后仍成立。

#### 5.3 决策透明表（D1–D10，逐条承设计口径）

- **D1 备份只随 GC 命中取**（压实 ∥ 轮转不取）：承 ⑤-1「命中 > 0 才取」具体规范行；压实 = 内容保全操作、轮转 = 只删本机制备份档。⇒ 提示词面「backs up before writing」措辞偏宽（见 5.4 上抛 ③）。
- **D2 GC 全 origin（含停更/公共仓）**：承 F-S10 §4.12 最新口径；与设计 §8.3 `:821`「公共仓移走 ⇒ 旧行保留」相抵 ⇒ 已上抛（5.4 上抛 ①；设计档本批零触）。
- **D3 `onReport` 缝** = 端侧可见面：设计只定「CLI 有动作 ⇒ 一行」；机制落为回调缝（CLI 传一行函数 ∥ 缺省零行——端面板零改）。
- **D4 桌面 dbPath 走核侧 config 现读**：`scheduleMemoryMaintenance({})` → 核 `configuredDbPath()` 读 `config.memory.dbPath` ⇒ 桌面只 +3 行（转口不搬 config）。
- **D5 可见面行零 freelist 数值**：⑤-6「freelist = 维护内部读数，不入可见面」按严读落（可见面枚举 = CLI 行 ∥ `logEvent`）；工具报告面保留完整读数（⑤-4 ∥ L-⑥-2「读数在」），批内件加两向断言（报告含 ∥ 可见面行不含）。
- **D6 批内件正则转义形**：`familyRe` ∥ `staticSpecs` 等用 `new RegExp("\\d{14}")` / 双反斜杠字符串形（首轮写入曾吞 `\` 致 `:330` 语法错，按实跑修正）。
- **D7 行数**：maintain.mjs 410 > 估 ≈300（批档 §2.4 注）——内容 = 三动作 + 三段报告 + 调度 + 12 缝 + 头注；≤500 软线，不擅拆（父侧如需拆档另裁）。
- **D8「静态闭包零 `node:sqlite`」判据形**：桌面 `main.mjs` 静态闭包**本批前既有** `node:sqlite` 边（`agent-host.mjs → 核 agent/assemble.mjs → memory.mjs → schema.mjs`）；批内件按「**新边**零静态可达」判（转口零静态 import ∥ main.mjs 零静态核维护链）——域外发现（5.4 知会 ⑤）。
- **D9 评审后零改**：advisor 🔵 #3（vacuum 回读异常入可见面行）∥ #6（备份体积读数）——可观测性增益、非判据腿；为保「已评审产物 = 交付产物」本批不追加，登记供父侧下一轮收。
- **D10 变更面外零触**：`memory.mjs → docs.mjs → memory-tool.mjs` 消费链零改；`files` 表 ∥ §6.11 §6.13 既有判据 ∥ VSC `isReadonlyAction` 零触。

#### 5.4 审计与代码评审轮次与终态

- **域内自审（自复读）3 轮**：① 语法/接线（修批内件 `:330` 缺闭引）；② 逐档读回（修 2 处：VACUUM 失败理由中文化 → 英文；`scheduleMemoryMaintenance` 返回说明陈旧）；③ 可见面严读修正（freelist 出可见面行 + 加断言）。
- **探索子代理偏离审计（read-only explore）1 轮 ⇒ CLEAN**：四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 清单外改动）零发现；十档 = 声明面 10/10；行数面全 ≤ 档注。两条观察：① 提示词面「五动作」残留（`thincoder-core/prompts/common.md:129` ∥ `thincoder-core/prompts/discipline-normal.md:153` ∥ `docs/core/design/prompts/discipline-normal.md:152`）——域外 + 父侧权限面，本批零触（5.4 上抛 ②）；② freelist 判读两义 —— 已按严读落（D5）。
- **独立代码评审（advisor · code）1 轮 ⇒ VERDICT: pass**：6 行发现（2 🟡 非阻塞 ∥ 4 🔵）+ 1 条域外注记；零 🔴 ∥ 零 must-fix。
- **终态 = clean**。

#### 5.5 上抛（父侧）

1. **[待裁]** 设计档 §8.3 `:821` 与面⑤ 相抵（公共仓移走 ⇒ 旧行**自动删** vs 登记句「保留」；声明根临时缺位 ∥ 卷不可达与「停更 origin」在树探针不可分）——建议三选一：随批收正 `:821` ∥ 补「声明根缺位 ⇒ 组归 `unknown` 保留」判据（引擎已有 unknown 通道，零新结构）∥ 加接受面登记（恢复路径 = 该跑备份）。
2. **[待裁]** 提示词面「五动作」计数三处（`thincoder-core/prompts/common.md:129` ∥ `thincoder-core/prompts/discipline-normal.md:153` ∥ `docs/core/design/prompts/discipline-normal.md:152`，模型可见 + 跑期加载）+ 需求档两处（§2.7 已登记）——建议随批收正。
3. **[待裁]** `thincoder-core/tool-docs/memory.md:7`「backs up before writing」措辞收窄（现文 = 父侧定稿逐字；本批未擅改）。
4. **[知会]** 冻结指纹守卫 `docs/batches/2026-09-29-tools-carryover-15.test.mjs:116` 因本批枚举扩面失效（baseline 行仍五动作；`:223` ∥ `:224` 等值断言不可能成立——我无执行面未跑，字面已异）——父侧收口轮重生成 + 伴生读数件同步。
5. **[知会]** D8 桌面静态闭包既有 `node:sqlite` 边（本批前既有，非本批引入）；`export` 计数三处不自洽（批档「三处」vs 设计表 4 vs 实读 4）——纯计数锚。

### §5 修正轮记录（eng-coder · 2026-10-08 · 提示词面 4 处定点修正）

**范围**：处置 §5.5 上抛 ②（提示词面五动作计数）∥ ③（tool-docs 措辞收窄）——四处逐字落，不动相邻行 ∥ 不加语义 ∥ 归档 ∥ 批档零触。

#### 修正清单（4 处 · 全字节读回）

| # | 档:行 | 改动 |
|---|---|---|
| ① | `thincoder-core/tool-docs/memory.md:7` | maintain 行整句替换为父侧定稿新句：备份句自 `backs up before writing` 收窄为 `deletions take a backup first and read back after`（挂 GC 子句内；压实 ∥ 轮转不取备份）；尾句改 `every run reports its readings.` |
| ② | `thincoder-core/prompts/common.md:129` | 工具路由行动作清单补 `/maintain`（五 ⇒ 六） |
| ③ | `thincoder-core/prompts/discipline-normal.md:153` | `(actions: …)` 补 `/maintain` |
| ④ | `docs/core/design/prompts/discipline-normal.md:152` | 同句中文面补 `/maintain` |

#### 验证读数（全实跑）

- **字节对拍**：四行 vs 任务书定稿逐字 = **ALL-MATCH**（脚本字符级相等，含破折号 ∥ 全角括号）。
- **活面 grep** `search/put/list/delete/clear`：旧形态残留 **0**——残留仅在归档区（`_archive/**`）∥ 构建产物（`thincoder-desktop/dist-r3|r4`）∥ 临时面（`.thincoder/tmp/**`）；`docs/batches/**` 零命中；带 `/maintain` 新句 = 3（②③④）。
- **守卫复跑**：批内件 `2026-10-08-index-automaintain.test.mjs` **6/6 绿**（888ms）∥ `2026-10-04-tool-path-baseline.test.mjs` **8/8 绿** ∥ `scripts/doc-check.mjs --root D:/teamcode/thincoder` **exit 0**（报告面既有列报，不入闸）∥ 冻结守卫 `2026-09-29-tools-carryover-15.test.mjs` **4/4 红** = 前批漂移类（档集 49≠52 ∥ `ledger` 五档 ∥ `browser` 增补；§5.5 #4 既有登记）——其 ① 面为运行期 `description === read(tool-docs/<n>.md)` 字节对拍，本改两侧同动、零新增红。
- **装载面**：`DESC("memory")` 运行时读回 = 收窄后新句（`narrowed: true ∥ old-frag: false`——模型可见面即取此单源）。
- **引用守卫相交面**：四点均未引入 `.md` / `§` token（`scripts/prompt-refs-check.mjs` J1/J2/J3）；doc-check 域 = `docs`（`PROJECT-MANIFEST.json:27-31`）⇒ ① 长行不在行宽闸；④ 行 ≤80 字符、无指针。
- **未做（口径内）**：repo 套件全跑 = 父侧收口项。

#### 决策透明表

- **D11 逐字照落**：① 为父侧定稿原文整句替换，评审两处措辞微调建议（作用域限定 ∥ `deletions` 消歧）不上改——上抛父侧裁（见下）；②③④ 只做括号内插入，行结构零变。
- **D12 归档 ∥ 批档 ∥ 构建产物零触**：`_archive/**` ∥ `docs/batches/**` ∥ `dist-r3/r4` ∥ `.thincoder/tmp/**` 命中只读不扫不动。
- **D13 清单外披露**：②③④ 三档（`thincoder-core/prompts/common.md` ∥ `thincoder-core/prompts/discipline-normal.md` ∥ `docs/core/design/prompts/discipline-normal.md`）不在批档 §2.4 十档表内——授权 = 本轮任务书点名（处置 §5.5 上抛 ②）；① 档在表内（#4）。
- **D14 单源一致**：需求档 ∥ 设计档 ∥ 核实现注释（`memory-tool.mjs:43` "six actions"）前批已六动作；本轮只补提示词面三处 + tool-docs 一处，其余零触。

#### 审计与代码评审轮次与终态

- **探索子代理偏离审计 1 轮 ⇒ CLEAN**：四类偏差零发现；交付四档 = 任务书 4/4；活面旧字面零残留；限制披露 = 审计装配无 git 面（diff 形态由本侧 `git diff` 逐档单行核过补足）。
- **独立代码评审（advisor · code）1 轮 ⇒ VERDICT: pass**（🔴 0 ∥ 🟡 1 可选不阻塞 ∥ 🔵 2）；发现全落 ① 行定稿文本的建议面，非缺陷。
- **终态 = clean**。

#### 上抛（父侧）

1. **[知会]** 评审 2 条微调建议（均指 ① 行定稿文本，非阻塞）：a) `dry-run by default` 加作用域限定（与设计 ⑤-5 ∥ ⑤-6「自动拍 = 非干跑」口径齐平）；b) `deletions` ⇒ `ghost-row deletions` 消歧。
2. **[知会]** 冻结守卫 `2026-09-29-tools-carryover-15.test.mjs` 红读数在册（既有漂移，§5.5 #4 待父侧收口重生成）。
3. **[知会]** 构建/临时面旧字面在册：`thincoder-desktop/dist-r3|r4` ∥ `.thincoder/tmp/**`（重打包随动，非活面）。

### §5 修正轮记录 2（eng-coder · 2026-10-08 · 收窄句定稿落地）

**范围**：处置修正轮 1 上抛 ①（评审 a/b 两条文本建议——父裁采纳）——`thincoder-core/tool-docs/memory.md:7` 整行逐字替换为父侧定稿收窄句；本轮改动 = 仅此一行 ∥ 其余零触 ∥ 不加旁注。

#### 修正清单（1 处 · 全字节读回）

| # | 档:行 | 改动 |
|---|---|---|
| ① | `thincoder-core/tool-docs/memory.md:7` | maintain 行逐字替换为父侧定稿。三处微调 = ① `(dry-run by default)` ⇒ `(dry-run by default in tool calls)`（作用域限定——自动拍执行直落）② `deletions take a backup first` ⇒ `ghost-row deletions take a backup first`（消歧——压实 ∥ 轮转不取备份）③ `runs the same engine;` ⇒ `runs the same engine and executes directly;` |

#### 验证读数（全实跑）

- **行落位 ∥ 字节读回**：`:7`，byteEq=true（504B ∥ 498 chars ∥ LF ∥ 行尾空白 0 ∥ 全档 2441B ∥ 11 行）——对拍源 = 任务书定稿原文（逐字）。
- **`DESC("memory")` 运行时装载**：含新片 `in tool calls` ∧ `executes directly`；旧片 `dry-run by default)` 命中 0 ∥ `backs up before writing` 命中 0；装载单源 = `tools/shared.mjs:19` ⇒ `prompt-files.mjs:59`（直读本档，零加工）。
- **批内件复跑**：`node --test docs/batches/2026-10-08-index-automaintain.test.mjs` ⇒ **6/6 绿**（745.7ms）。
- **冻结守卫复跑**：`2026-09-29-tools-carryover-15.test.mjs` ⇒ 4/4 红，逐条 = 前批漂移类（档集 49≠52 ∥ `ledger` 五档 ∥ `browser` 增补——§5.5 #4 既有登记）；断点全在档集/计数面，memory 描述字节面无涉 ⇒ 零新增红。
- **git 面**：相对 HEAD 该行整体呈「+」（本批未收口——maintain 行全量未提交态，非本轮差异面；本轮差异 = 上列三处微调，读回 ∥ 审计两侧可复核）。
- **未做（口径内）**：repo 套件全跑 = 父侧收口项。

#### 审计与代码评审轮次与终态

- **探索子代理偏离审计 1 轮 ⇒ CLEAN**：四类零发现；行逐字一致 ∥ 差异恰三处 ∥ 旧片零命中 ∥ 杂质探针零命中（行尾空白 ∥ 双空格 ∥ NBSP/零宽/BOM ∥ 短横线变体）；边界披露 = 审计装配无 git/执行面（基线字节差 ∥ 复跑未独立；机制单源已核）。
- **独立代码评审（advisor · code）1 轮 ⇒ VERDICT: pass**：4 🔵（全指 `:7` 定稿文本——建议面 ∥ 零 must-fix）；零 🔴。
- **终态 = clean**。

#### 上抛（父侧）

1. **[知会]** 评审 4 🔵（非阻塞，均指 `:7` 文本）：a) `N` 无锚（缺省 2 ∥ `memory.maintain.backupKeep`——运行期报告 `backupKeep=` 才可见）；b) `The automatic startup pass …` 在 VSC 端可读作端内承诺（VSC 自动拍 = 设计登记有意缺位）；c) `layer` 被静默忽略未点明（`maintain` = 库全局）；d) 评审侧可达面限制——本侧字节读回 = 对任务书定稿原文 `byteEq=true`；建议父侧收口以定稿原文再对拍一次闭环。

## §6 验证与收口（父代理）

### 6.1 交付与读数（2026-10-08 · 父代理）

- **交付** = §5 十档 + 修正三轮（#6 设计侧五处 ∥ #7 提示词四笔 ∥ #8 文本收窄一笔）；细账 = §5 ∥ §2 尾块 ∥ 各修正轮块。
- **终验（父侧独立复跑）**：批内件 **6/6 绿**（1035.5 ms）∥ `2026-09-29-residuals-round2` **12/12 绿** ∥ `2026-09-30-crossline-clearance-vsc` 10/11——**T-XL9（memory 两端字节同源）绿**；T-XL15c 红 = **他流在编**（`settings-providers.js` provider-add 面，与本批零交——git status 旁证在册）∥ `scripts/doc-check.mjs` = 0 入闸项（列报全属迁移期引文 ∥ 报告面档）。repo 套件 = 空清单绿（2026-09-28 用户令重置口径——本批不新增仓套件面）。
- **真机首跑实证（交付前即发生）**：桌面重启触发自动拍（15:46:20）——回收 222 档对真鬼行（665 行——`D:/repos/bms_db/**`，14:35→15:46 间从盘上消失；在盘检查 0 例外）∥ 备份先行（`memory.db.sweep-backup-20261008074620`）∥ 压实按双式跳过（freelist 6.0 MiB < 64 MiB）∥ 轮转保 2 枚即停。**披露**：13:5x 留的旧锚备份被轮转出局（保最新 2 = 设计行为；如需留住特定快照 ⇒ 调 `backupKeep` ∥ 改名脱名族）。
- **§8.3 口径族收正（评审发现 #1 父裁）**：`design/MEMORY.md:720 ∥ :735 ∥ :822` + `D-MEM24/26` 全对齐「存量行归 §6.14 面⑤ 维护面回收（备份窗内可回滚；树恢复 ⇒ 重新同步）」；四式旧字面 grep 零残留。
- **未决 ∥ 挂账**：① `thincoder-core/config.mjs` maintain 默认键**未提交**——该档混合 hunk（他流 proxy 批在编 `normalizeProxy` 收形）；引擎 `??` 缺省兜底 ⇒ 功能无碍——**已挂台账 #1099**（trigger=条件：他流落地后补本批 +2 行）。② 退役守卫 `2026-09-29-tools-carryover-15.test.mjs` 红 = 既有漂移（档头载「勿修」——零动作）。③ 域外注记两条留档：`design:37`（§2.2 #134 五动作历史映射行——as-of 留档，零改）∥ §5 落点指针族未含本批行（历史面，零改）。
- **结算**：台账 **#1096 核销**（追认）∥ 批档冻结 ∥ token 消费（值不入档）。
- **D9 结算同步清单**：六段齐 ✓ ∥ 状态行 ✓ ∥ 计数 ✓（十档 + 修正三轮）∥ 三方一致指针 ✓（§4.12 ⇔ §6.14 ⇔ §2）∥ changelog ✓（需求档三条 ∥ 设计档两条）∥ todo 勾销 ✓（#1096）+ 新增 #1099 在册 ✓。
