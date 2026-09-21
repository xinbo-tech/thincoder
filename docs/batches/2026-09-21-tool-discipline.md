# 2026-09-21 · tool-discipline
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 · 来源 = 用户 2026-09-21 22:47 双提问（task 列表停用 + 词面错误设计根源）。
> 台账 = #214/#215（TOOLS.md · 归批）。前情 = docs/batches/2026-09-21-busy-injection.md（在途——本批与其并行；无文件交集）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-22
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目**（需求档 `docs/core/requirements/TOOLS.md` F10 + F11 · 台账 #214/#215 · 板块 TOOLS/TOOLING）：

| # | 条目 | 一句话 |
|---|---|---|
| F10 | task 工程模式停用 | `agent.engineering = true` ⇒ task 机械拒（plan/escalate 同款门）；普通模式零变 |
| F11-A | batch status enum 化 | `value` 按段词表 enum（STATUS_WORDS 单源 `batch-skeleton.mjs:30`）+ 独立 note 字段——散文与机器语义分离 |
| F11-B | create 参数补齐/归一化 | 补 `source` 参数填来源占位；`prev` 传入自动剥「前情 = 」前缀；`<BATCH-ID>` 占位 create 时清除 |
| F11-C | 占位符残留机检 | append/status 落笔时档内 `<...>` 模板占位 ⇒ 拒绝并列清单 |

**起因与授权**：用户 22:47 双提问——①「task 列表不适应人机子 agent 高度并行交互，工程模式该停用」②「词面错误是否有设计根源，参数结构化/enum 化是否有用」。父侧实勘归因（agent-tools 模式门控先例全扫 + 本会话五例词面错分层：①②机制层 / ③⑤归一化缺失 / ④参数覆盖缺口）呈结论 → **用户 22:49「可以，开始把」= 本批点火授权**。

**关键判据**：① 五例实证：§1 状态行「讨论已收口」误触发冻结门（本日实录）· status 双关键词被拒 · 「**状态行**：**状态行**：」双前缀 · `<BATCH-ID>`/`<讨论来源>` 残留 · 「前情 = 前情 =」双前缀；② 硬证据 = 词面纪律 2026-09-20 已入记忆仍重犯 ⇒ 散文纪律防不住此类 ⇒ 机判（项目哲学「纪律防不住的地方上机判」——冻结门/spawn 门/designToken 门同源）；③ 对照面 = 台账六态 enum（`ledger_update status=已核销`）本会话零事故——enum 化有效性有实证；④ 模式门控先例：plan.mjs:36 · subagent-actions.mjs:348 · 角色 enum 按模式过滤（subagent.mjs:249-263）。

**红线**：batch 六段 append-only / 一段一作者 / 冻结门语义零变；task 普通模式行为零变（不移注册不加开关）；散文纪律句不删（机判叠加不替代）；铁律 3 提示词分支 = PROMPT-SYSTEM 板块（设计裁定是否本批带上，不带则登记另案）。

**排除面**：台账工具自身不动（已 enum）；eng/plan/escalate 既有门零改；在飞两批（exit-claim-release / busy-injection）不受影响——本批实施窗口避开其 spawn 冲突（batch 工具改动落在核 agent-tools，与两批文件域交集 = batch-lifecycle/batch-skeleton 仅本批触碰）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 批次任务（覆盖面）

本批覆盖需求档 TOOLS.md §4.2 F10 + F11（台账 #214/#215）全判定面，不收缩：

- **F10** `task` 工程模式机械停用 = **双层门**：装配面工程分支去 taskTool（`agent/family-tools.mjs` 固定段——plan 先例 KD8「不入表」同款，描述不进工程模式工具表 = 零 token 税）+ execute 面机械拒（`agent-tools/task.mjs`——escalate 先例同款错误句形态，含「engineering」+ 指引追踪权威面 = 批次档 §5/§6 + 台账 `/ledger`，零副作用）；连带 = completion 催更门同门排除（被拒工具的催更指针须同步移除，防死胡同提醒）。普通模式装配与行为零变；登记册零改（不移除注册）。
- **F11** `batch` 词面协议结构化：**A** = status 增独立 `note` 字段（括注落盘）+ value 纯关键词校验保持（运行时校验为按段词表的唯一可行形态——JSON schema 静态 enum 表达不了「按段」）；**B** = create 补 `source`（必填，填「来源 =」占位）+ prev 幂等剥「前情 = 」前缀 + `<BATCH-ID>` 占位删除（自造序号否决——第二编号源违 D2）；**C** = append/status 落笔前死占位机检（骨架枚举单源判据——拒并列残留行号；close 不拦）。

### 设计档落点

`docs/core/design/TOOLS.md` §6.15（新增节——六裁定点结论+理由、机制设计、受影响文件、用例表、边界全量在案；写后读回核验）。

### 受影响文件

- 核：`agent/family-tools.mjs`（工程分支去 task）· `agent-tools/task.mjs`（拒门）· `agent/completion.mjs`（催更门排除）· `agent-tools/batch-skeleton.mjs`（骨架改形 + TEMPLATE_PLACEHOLDERS 单源 + findPlaceholderResidue 纯函数）· `agent-tools/batch-lifecycle.mjs`（create source/prev + status note + 机检挂点）· `agent-tools/batch.mjs`（schema 增 source/note + description 同步 + append 机检挂点）。
- 测试：`thincoder-core/test/batch.test.mjs`（C1 断言反转——`<BATCH-ID>` 保持字面断言随骨架改形失效；F11 五判定新用例）· `thincoder-core/test/family-tools.test.mjs`（装配两态断言改 + task 拒面用例）· `thincoder-vscode/test/integration/host-shape-spawn.test.mjs`（工程模式段断言同步——`[task, timer]` 现体断言失效）。已核零冲击：`context-tool.test.mjs`（ctx 无 engineering → 普通路径）· VSC `agent-tools-registry.test.mjs`（登记册零改）。
- 两端运行面：零端改——task/batch 实现与描述住核单源，CLI/VSC 装配同调核 `assembleFamilyTools`，双端同批生效（F3/F7 由单源保证）。

### 验收对照

F10 两态判定句 + F11 五判定句 → 用例逐条映射见设计档 §6.15 用例表（每条机器可验）；三面一致（本节 = 需求档 §4.2 F10/F11 = 设计档验收回指）。

### 关键决策

① F10 双层门（KD8 路由正确性——看不见的选项不会被选；escalate 兜底先例——机械防线不依赖装配正确性）；② F11-A 运行时校验 + note 括注（拒绝再入会逼散文回流 value = 事故复现路径；note 全词表零命中校验——括注永不参与 gate 判定）；③ prev 幂等 strip（归一化目的 = 值规范化）；BATCH-ID 删除（台账编号 create 时尚不存在，create 不代建台账；自造序号 = 与台账编号空间冲突）；source 必填（与 topic 同款 fail-closed——占位机检闭环不留死锁）；④ F11-C 判据 = 骨架死占位枚举单源（泛 `<[^>]{1,40}>` 正则误杀正文合法尖括号与 `<§N 模板占位>` 合法暂存——
append 不删行，模板占位行段内留存是常态）；判定域 = 档头 + 目标段（他段模板占位不归本段作者管）。

### 上抛项

① 提示词面（铁律 3 工程模式分支）裁定**带上本批**：机械拒上线而工程模式提示词仍指挥用 task（撞点三处 = discipline-engineering.md 铁律 3 句 + 同档五步流程 done-criterion 句 + persona-engineering.md 债务句）= 自相矛盾态；建议条目文本已交主 agent（见设计报告），需求档 PROMPT-SYSTEM.md 落条目 = 主 agent 笔面。② completion 催更门排除 = F10 派生连带（非新语义），已并入 F10 设计面。

### 设计评审修正轮 1（eng-designer——承 §3 轮次 1 发现 #3/#4/#5/#6）

轮次 = fix（点修）。无动作项：#1/#2（需求档侧——父侧已收正，requirements/ 零触碰）· #7（批档 §2 折行——父侧已直改）· #8（记录局限）。落点 = `docs/core/design/TOOLS.md` §6.15.2（+ 变更记录一行）：

- **#3** → 裁定点④ 增「档头两占位填充路径与次序」条：主 agent · 建档后首写前 · 普通文档写（次序句 + 两条否决备选）；兼容行改实断言——真 create→append 型两夹具（C1 `:75→:92` · AC-11 `:350-352`）补档头填充步 ⇒ Δ 入受影响文件表。
- **#4** → 受影响文件表全行 `wc -l` 实测钉死（原 185/146/398/「400+」/「300+」 ⇒ 184/145/397/380/220；lifecycle 245 已对）+ 新增「行数与拆分评估」块：lifecycle ≈322 ⇒ 登记不拆（拆分位 = create 面外提 · 消解条件 = 越 500 或下次实质改动）· batch.mjs ≈424 维持登记不拆 · batch.test.mjs 380+105 = 485 ⇒ 对 500 余量 15 行（越线触发拆档）。
- **#5** → 裁定点②两读合一：运行时校验**地位**不动 + value **谓词收紧**（剥装饰白名单后余核 = 关键词）；F11-A1 先红判读 + 兼容-3 三格先绿零改 + 事故①防复发机制句；lifecycle Δ +70−6 ⇒ +85−8 同步。
- **#6** → 条目建议文本逐字固化 = 设计档 §6.15.2「提示词面条目建议文本」（三撞点 = 铁律 3 / 需求完成判据 / 欠账入清单；正本中文 + 核内落地档英文双句）——上抛项① 的文本落点 = 该表（持久面），不再住报告。

### 实施轮上抛闭口（eng-designer——承实施轮上抛 ① · 父侧裁定 2026-09-21）

轮次 = fix（点修——设计缺口闭口；实施已在飞，零源码触碰）。落点 = `docs/core/design/TOOLS.md` §6.15（+ 变更记录一行）+ 本块。

- **上抛 ①**：§6.15 催更门连带原只覆盖核 `agent/completion.mjs:56`，VSC 运行时另有**独立守卫副本** `thincoder-vscode/src/agent/run-stages.mjs:86-101`（`maybeGuardPushbacks`）——pending 催更分支 `:91-92` 零 engineering 条件（对照：同档 advisor 分支 `:155` 有 `!agent.config?.agent?.engineering`）⇒ 工程模式 VSC 侧仍可发「更新 task 列表」死胡同提醒（F10 防胡同意图漏洞）。`_tasks` 活体链 = `agent-state.mjs:121`（槽回填）+ `agent.mjs:418`/`:433`（双向 sync）⇒ 分支可触发。
- **裁定 ①（父侧）**：本批闭口（非新范围）——防死胡同提醒 = F10 连带本意；**端差默认 = 消**。VSC 副本 verify guard 分支同类缺差（`:105` 零 engineering 条件 vs 核 `completion.mjs:73` 有）= 另册（台账 #217）· 本批零触碰。
- **Δ 两文件**：`thincoder-vscode/src/agent/run-stages.mjs`（pending 分支行内补 `!agent.config?.agent?.engineering`，+1 −1 ⇒ 420）；`thincoder-vscode/test/advisor-guard-rounds.test.mjs`（1 条直驱用例 ⇒ ≈46；档已登记 `test/files.mjs:82`——零新增登记）。
- **判据（用例表 VSC-3）**：直驱 `maybeGuardPushbacks`（桩 agent 族 T-AF7）——`_tasks` 含 pending ∧ `engineering=true`（advisor/verify 面不构成候选）⇒ 零推回（返回 false · 零提醒注入）。
- **设计档同步面**：①§6.15.1 连带两处扩 VSC 副本面；②受影响文件表 +2 行；③「两端运行面」行按实况更正（双源结构事实 + 「除该副本 pending 分支一处外零端改」——旧断言零残留）；④用例表 +VSC-3；⑤变更记录 +1 条（上抛 + 裁定 + 证据坐标）。

### 第三面闭口轮（eng-designer——承 §5 线外发现 · 父侧裁定并入本批 · 2026-09-22）

轮次 = fix（点修——设计面闭口；实施已在飞，**源码零触碰**）。落点 = `docs/core/design/TOOLS.md` §6.15（新增 §6.15.3 第三人面 + 事实基线一行收正 + 受影响文件表一行 + 变更记录一行）· `docs/core/design/ENGINEERING-MODE-V2.md` §3（同源断言三处收正 + 变更记录一行）· `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.8（digest 动作域模式条件句两处 + 变更记录一行）。

- **第三面（auto-turn digest 域模式变体）**：问题 = `AUTO_TURN_DIGEST_DOMAIN` 第 2 条指挥已停用工具（工程模式死胡同 ∧「(allowed)」错误陈述）；处置 = 平行导出 `AUTO_TURN_DIGEST_DOMAIN_ENG` + 两侧按模式选串（核 `agent.mjs:169-170` · VSC `composeTurnDomain`——签名 +1 参数默认 `false` 保零回归 · 调用点 `thincoder-vscode/src/agent.mjs:123` 传模式 · `setup-reminders.mjs` W15 转口表 +1 名）；ask 唤醒轮不受模式影响（`UPSTREAM_TURN_DOMAIN` 无 task 指针）。
  变体正文逐字落地（父侧所出 · 本席零改 = 本地规范落点）；受影响文件 7 行（核 2 · VSC 3 · 测试 2）；用例 DOM-C1/C2（core 新档 `test/turn-domain-mode.test.mjs`）+ DOM-V1/V2/V3（vsc `upstream-parity.test.mjs` T-VS-U7 扩格 + T-VS-U5/U12 同步）；行数与拆分评估（核两档在册 · VSC `src/agent.mjs` 494 ±0 · turn-domains ≈35）；边界五条。
- **设计档漂移收正 ①**：`ENGINEERING-MODE-V2.md` E7 装配面 `:348` 工程模式固定段 = `[timer]`（task / plan 皆不入表）+ 判据补 `task` · `:383` 判据链图 · `:517` T10 判据；`:372` / `:394` / `:410` 逐条实读 = 现态成立，零改。
- **设计档漂移收正 ②**：`AGENT-LOOP-SUBAGENT.md` §6.8 手动档条目「更新任务清单」改**模式条件句**（原文无条件 = F10 后工程模式半边为假）+ 权限条目自省工具示例补模式限定；指针 → §6.15.3（机制与文本单源）。
- **顺带同源收正**：`TOOLS.md:660`「工程分支现体 = `[taskTool, timerTool, …depthOnly]`」= F10 后失效的现态陈述 ⇒ 收正为 `[timerTool, …depthOnly]` + 普通分支逐字（同 §6.15 段内）；受影响文件表补 F11-C 拆档新档 `test/batch-placeholder-gate.test.mjs`（89 · ≤300 免登记）。
- **上抛（非本席笔面，报父侧裁）**：① `helpers.mjs:389` 注的出处指针「`AGENT-LOOP.md` §17 D-S6」= **悬空**（该档现为 §1–§8，无 §17）——现状 digest 域机制面出处 = `AGENT-LOOP-SUBAGENT.md` §6.8；源码注释面归实施轮 / 另册。
  ② 需求档 F10「提醒面」边界句（`docs/core/requirements/TOOLS.md:64`）无**独立判定句**（判定句仍只覆盖调用拒）——第三面可机检判据已入 §6.15.3 用例表；是否把判定句扩到提醒面 = 需求档笔面。
  ③ `CONSULTATION.md:200` 消化轮动作域行点名 `AUTO_TURN_DIGEST_DOMAIN`（工程模式改用变体后该名 = 普通档基座）——语义（禁写禁 spawn）零变、指针仍解析，本批零触碰，仅登记。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

发现表（🔴 1 · 🟡 5 · 🔵 2 · 计 8）

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 需求对齐（跨档机制矛盾） | 🔴 | 需求档 F11③ 括注规定机检判据 = 「`<>` 集合非空即拒」（泛形，docs/core/requirements/TOOLS.md:65）；设计档裁定点④判据 = 骨架死占位四字面枚举并**显式否决泛正则**，且 F11-C4 判 `<§N 模板占位>` 行合法暂存（docs/core/design/TOOLS.md:701-703、:743）——同一机检两档 prescribe 不同拒绝行为（非枚举尖括号内容：需求 = 拒 / 设计 = 放；模板占位行同理）。F11 行无 F8/F9 式「判据 = 设计档 §…」指针（先例 requirements/TOOLS.md:62-63），机制权威面未交接。R1 机制级两档异述 = 不可降格。 | F11 行补「判据 = 设计档 §6.15 裁定点④」指针（承 F8/F9 行尾先例），括注与枚举判据对齐（`<§N 模板占位>` 合法暂存一并写明）——两档同述后本发现即消。 |
| 2 | 文档态（需求侧登记滞后） | 🟡 | 需求档 §4.2 标题仍「F1–F9」（requirements/TOOLS.md:51）而表体已含 F10/F11（:64-65）——本档自立的 D3 标题计数惯例（F8/F9 随批更新，见 :194/:196）未执行；变更记录（:185-196）缺 2026-09-21 F10/F11 补登条目。 | 标题计数改 F1–F11；变更记录补一条（源 = tool-discipline 批 · 台账 #214/#215）。 |
| 3 | 清晰度（设计缺口） | 🟡 | F11-C 判定域含档头（design/TOOLS.md:704），枚举含 `#<编号>`/`<板块>`（:701），但 create 参数面只有 topic/source/prev/date、骨架改形只删 `<BATCH-ID>` + 来源实参化（:714）⇒ 两占位无 create 期填充机制且 create 不拦（:705）⇒ 新档首个 append/status 必被档头残留拒——填充人/时点未写；兼容-1/2/3「既有用例全绿零改」（:744-746）与既有 create→append 型用例在新门下相 tension（夹具若走真 create 必撞门）。 | 写明 `#<编号>`/`<板块>` 填充路径与顺序约束（或 create 增参 / 台账行移出判定域）；对兼容行作实断言：既有夹具走真 create 须补夹具 Δ（入受影响文件表），手写记录夹具则把该前提写进设计。 |
| 4 | 体量注（评审判据 #8） | 🟡 | batch-lifecycle.mjs 245+70−6≈309 越 300 建议档、batch.mjs 398+35−8≈425（>300）——均无 split 评估（design/TOOLS.md:709-719）；test/batch.test.mjs 现行「400+」+90≈490+ 计数含糊且逼近 500 硬限；host-shape-spawn.test.mjs「300+」同含糊（行数 unverified——源码不在评审范围）。 | 钉死现行行数；越 300 档补主动 split 评估/计划（lifecycle 天然拆分位：create/prev 归一 ‖ note ‖ 占位机检）；给 batch.test.mjs 对 500 硬限余量算术。 |
| 5 | 清晰度（裁定自洽） | 🟡 | 裁定点②两读并存：「value 语义收紧：合法值 = 恰一关键词 + 任意装饰」（design/TOOLS.md:688）暗示校验改码 vs 「运行时校验（assertStatusValue）唯一真值面，保持不动」（:687）读作零改码；F11-A1（:732，`value="讨论已收口 2026-09-21"` ⇒ 拒）仅在现行校验已拒「散文前缀+关键词」时零改码成立——现行接受谓词无法从评审范围核实。 | 写明现行 assertStatusValue 接受谓词与 F11-A1 是否需改码；取决于现行码语义则标实施轮必核项（先红/先绿判读依据）。 |
| 6 | 协调项（指针悬空） | 🟡 | 铁律 3 提示词条目文本 = 「条目建议文本见本批报告」（design/TOOLS.md:750）→ 批档 §2 上抛项①（2026-09-21-tool-discipline.md:58）=「见设计报告」——实际文本只住瞬态设计报告，批档（持久记录面）与设计档均不含 ⇒ 从持久文档不可复原。 | 建议条目文本（三撞点各句）逐字固化进批档 §2 或设计档引注，保证 PROMPT-SYSTEM 落条目可从持久记录面取到。 |
| 7 | 文档卫生 | 🔵 | 批档 §2 关键决策④行内码跨行断开（2026-09-21-tool-discipline.md:53-54：「泛 `<[^>]` ⏎ `{1,40}>`」）——code span 被硬换行截断、渲染破形（语义可复原）。 | 重排该行使正则居单一 code span。 |
| 8 | 方法论局限 | 🔵 | 本评审未获项目标准档与文档地图（声明 absent）——文档归属判据按 Project Guide + 板块镜像命名降级执行（requirements/TOOLS.md ↔ design/TOOLS.md 同名成对；§6.15 落设计档 = 归属正确，无归属发现）；源码坐标 / 行数注记无法实核（源码不在评审范围），涉码断言按设计自述采信并标 unverified。 | 记录局限，无动作。 |

**VERDICT: changes-required**

计数：🔴 1 · 🟡 5 · 🔵 2（发现 8 项）。🔴 判定依据 = R1 机制级两档异述（明令不降格）+ R7e（机制级描述错配 pass 前须收口）。

### 轮次 2（评审子代理）

轮次 2 核验（tool-discipline · 承轮次 1 · 修正面 #1–#8）——剩余发现：0 项。

| # | Orig# | 文件 | 严重度 | 状态 | 核验（逐项） |
|---|---|---|---|---|---|
| 1 | 1 | docs/core/requirements/TOOLS.md:65 · docs/core/design/TOOLS.md:705-707 | 🔴 | Fixed | F11③ 括注已改：「（残留机检——判据 = 设计档 `TOOLS.md` §6.15 裁定点④：骨架死占位枚举单源；`<§N 模板占位>` 行 = 合法暂存不拦）」；设计侧「判据 = 骨架死占位枚举单源（新常量 `TEMPLATE_PLACEHOLDERS`…）」+「`<§1 模板占位：…>` 等模板占位行**合法暂存**」——两档机制口径合一（原机制级异述消解） |
| 2 | 2 | docs/core/requirements/TOOLS.md:51 · :197 | 🟡 | Fixed | 标题「### 4.2 功能性需求（F1–F11）」；变更记录条目在档（「§4.2 标题计数 F1–F9 → **F1–F11**（D3）」+ 评审轮 1 #1 收口 + 新增需求 2 条） |
| 3 | 3 | docs/core/design/TOOLS.md:709-711 · :759 | 🟡 | Fixed | 档头两占位填充路径/次序句在档（「填充人 = **主 agent** · 时点 = **建档后、本档首个 append/status 之前** · 方式 = **普通文档写**…」+ 次序句 + 两条否决备选）；兼容-2 实断言（真 create→append 两夹具 C1 `:75→:92` / AC-11 `:350-352` 补档头填充步 Δ，已入受影响文件表） |
| 4 | 4 | docs/core/design/TOOLS.md:714-733 | 🟡 | Fixed | 受影响文件表全行 `wc -l` 钉死（184/145/397/380/220…）；新增「行数与拆分评估」：lifecycle ≈322 ⇒ 登记不拆 + 拆分计划（`batch-lifecycle-create.mjs`）+ 消解条件；batch.mjs ≈424 维持登记不拆；batch.test.mjs 485 ⇒ 余量 15 行 + 越线触发拆档 |
| 5 | 5 | docs/core/design/TOOLS.md:685-692 · :746 | 🟡 | Fixed | 两读合一（「运行时校验…**该地位保持不动**（不动的是「校验住运行时」这条形态；谓词字面按下条收紧）」+「**value 谓词收紧…合法值 = 恰一关键词 + 装饰白名单**」）；F11-A1 先红判读 + 兼容-3 三格先绿零改 + 事故①防复发机制句；lifecycle Δ 同步 +85−8 |
| 6 | 6 | docs/core/design/TOOLS.md:764-778 | 🟡 | Fixed | 提示词面条目建议文本三撞点逐字固化（铁律 3 / 需求完成判据 / 欠账入清单；正本中文 + 核内英文双句）；:764 边界行指针已改指该表（不再住报告） |
| 7 | 7 | docs/batches/2026-09-21-tool-discipline.md:53 | 🔵 | Fixed | code span 完整单行：「（泛 `<[^>]{1,40}>` 正则误杀正文合法尖括号与 `<§N 模板占位>` 合法暂存——」（折行已修） |
| 8 | 8 | — | 🔵 | Excluded | 记录局限——按声明排除（无动作） |

新增问题：无（修正面算术 / 交叉引用 / 谓词自洽复核过）。

VERDICT: pass

计数：剩余发现 0 项（🔴 0 · 🟡 0 · 🔵 0）。

## §4 用户批准（主 agent）

**2026-09-21 23:35 父侧代签（用户 22:51 全自动授权射程内）**

依据 = 设计评审轮 1（§3 轮次 1 · 🔴1 🟡5 🔵2）+ 修正轮（eng-designer id=12）+ 轮 2 核验（§3 轮次 2 · **VERDICT: pass** · 剩余发现 0 项）。token 已随 Approved 签发（运行态，不入档）。

**逐条收敛表**（轮 1 → 终态）：

| # | 轮 1 | 终态 | 落点证据 |
|---|---|---|---|
| 1 | Fixed（父侧） | ✅ | `requirements/TOOLS.md:65` 判据指针 + 枚举口径对齐 |
| 2 | Fixed（父侧） | ✅ | `requirements/TOOLS.md:51` 标题 F1–F11 · `:197` 变更记录 |
| 3 | Dispatched | ✅ | `design/TOOLS.md:709-711` 填充路径/次序 · `:759` 夹具 Δ |
| 4 | Dispatched | ✅ | `design/TOOLS.md:714-733` 行数钉死 + 拆分评估 |
| 5 | Dispatched | ✅ | `design/TOOLS.md:685-692` 两读合一 + 先红/先绿 |
| 6 | Dispatched | ✅ | `design/TOOLS.md:764-778` 提示词文本逐字固化 |
| 7 | Fixed（父侧） | ✅ | 批档 §2:53 code span 完整 |
| 8 | Not an issue | — | 记录局限（无动作） |

**批准**：设计通过——eng-coder 实施轮放行（round=initial）。红线：batch 六段 / append-only / 一段一作者 / 冻结门语义零变 · task 普通模式行为零变（不移注册不加开关）· 散文纪律句不删 · 台账工具零改 · eng/plan/escalate 既有门零改。提示词面（三撞点文本）随实施轮落地（eng-coder landing；文本以 §6.15.2 逐字固化为准）；需求档 `docs/core/requirements/PROMPT-SYSTEM.md` 落条目 = 主 agent 笔面（随收口）。

## §5 实施记录（eng-coder）

### 交付摘要（eng-coder · 2026-09-22 · round=initial）

**状态行**：实施完成

**交付面 17 档**：核 source 6（family-tools / task / completion / batch-skeleton / batch-lifecycle / batch.mjs）· 核 test 4（batch.test / **新档** batch-placeholder-gate.test / family-tools.test / core-hygiene.test）· VSC source 1（run-stages，用户裁定扩端）· VSC test 2（host-shape-spawn / advisor-guard-rounds）· 提示词双副本 4（正本 ─ 核内 × discipline-engineering / persona-engineering）。

**F10（task 工程模式机械停用）**

- 装配面：`thincoder-core/agent/family-tools.mjs:184-186` 工程分支 = `[timerTool, ...depthOnly]`（task / plan 皆不入表——KD8 同处置）；普通支逐字零变。
- execute 面：`thincoder-core/agent-tools/task.mjs:64-66` 前置拒（先于别名归一 / 预算归零 / `_onTaskUpdate` / 轻推 ⇒ 零副作用），拒句 = escalate 先例形态（含 engineering + 批次档 §5/§6 + 台账指引）。
- 催更门连带：核 `thincoder-core/agent/completion.mjs:58` + VSC 副本 `thincoder-vscode/src/agent/run-stages.mjs:92`（旗标读法照同档 :155；**恰一行**）；verify guard 分支（:105）不在本批（台账 #217）。
- 注册册零改（`agent-tools.mjs:8` 仍导出 taskTool）；普通模式装配 / 行为零变（F10-2 + 既有名集 fixture 回归）。

**F11（batch 词面协议结构化）**

- A：`batch-lifecycle.mjs:195-235` 装饰白名单（首尾非字母数字 / 尾部 ISO 日期 / 空白）+ 余核逐字 = 关键词；判读序不动（≥2 命中先拒）；note 落状态行行内括注（:271-272），单行 + 全词表零命中 + 零死占位。
- B：`:131-142` source 必填（topic 之后、fail-closed）+ 单行；prev 幂等剥前缀；`batch-skeleton.mjs:139-143` 骨架改形（档头无 ID 段 · 来源实参化）。
- C：`batch-skeleton.mjs:59 / :71-102` 死占位四字面枚举单源 + 纯函数（零 fs）+ 单源拒句；挂点 = append（`batch.mjs:259-260`，gate/text 校验后、insert 前）与 status（`batch-lifecycle.mjs:276-278`，写盘前）；create / close 不拦；模板占位行 = 合法暂存（C4 实证）。
- schema / 描述同步：`batch.mjs:279-332`（source 必填 · note 语义 · 占位机检说明）。

**提示词面（四档 = 两副本 × 两档）**：三撞点（铁律 3 · 需求完成判据 · 欠账入清单）逐字 = 设计 §6.15.2；正本 :6/:35/:67 → 核内 :6/:35/:68。

**测试与实测**

- 用例表 **23 行**（含 §2 修正块④ 增补的 VSC-3）逐条落地：F10-1…5 = `test/family-tools.test.mjs`；F11-A/B + 兼容组 = `test/batch.test.mjs`；F11-C 组 = **新档** `test/batch-placeholder-gate.test.mjs`；VSC-2 / VSC-3 = VSC 两档；VSC-1 = 既有登记册档零回归。
- 实跑：核 `npm test` → **tests 539 / pass 539 / fail 0**（落盘 `_f10f11-core-after.log`；批前基线 526/526/0 = `_f10f11-core-baseline.log`）；VSC `host-shape-spawn.test.mjs` 5/5 · `advisor-guard-rounds.test.mjs` 2/2；VSC 全量 913 中 9 红 = 在飞 busy-injection 批文件域（`webview/send.js` 等，声明排除；归因未独立复跑 = unverified）。
- 行数实测（口径 `split("\n").length-1`）：`batch-lifecycle.mjs` **301**（已登记）· `batch.mjs` 410 · `batch-skeleton.mjs` 156 · `batch.test.mjs` **473**（≤500；拆档前实测 **506 越硬限** ⇒ 触发设计预裁拆档）· 新档 **89**（≤300 不登记）· `family-tools.test.mjs` 213 · `core-hygiene.test.mjs` 177。

**决策透明表**

| # | 决策 | 依据 |
|---|------|------|
| 1 | execute 层拒 = **返回** `Error:` 串（非 throw） | 设计指明「错误句文案形态对齐 escalate 先例」（`subagent-actions.mjs:349` 为返回串）；F10-1 断言按返回串写 |
| 2 | 残留函数返回项多一 `where` 字段（档头 / 目标段） | 错误句须标命中位置；`line` = 各域内 1-based（设计括注「行号 = 段内 1-based」对档头域取「自档首行起」）。定位辅助，零新判定语义 |
| 3 | 死占位机检错误句前缀 = `batch:`（非 `batch_segment:`） | 新错误面（append 迁移面旧串逐字保持——`batch.mjs` 头注 :17-18 口径）；单源拒句住 skeleton |
| 4 | source 单行校验只加于 source，未加于 topic / date | 设计只给 source 立「单行约束」；topic/date 补校验 = 设计外语义 ⇒ 仅上报（advisor 🔵#2） |
| 5 | 拆档 = 新档 `test/batch-placeholder-gate.test.mjs`（表外文件） | 落地后 `batch.test.mjs` 实测 506 > 500 硬限 ⇒ 触发设计预裁拆档（design §6.15 候选 = 「F11-C 占位机检组」）；共享夹具随拆复制 |
| 6 | VSC 端改 = `run-stages.mjs:92` 恰一行 + 测试 1 档 | 用户 in-flight 裁定（本批闭口）：F10「防死胡同提醒」的另一端 |

**审计与代码评审轮次与终态**

- 轮次 1（内部 explore 审计 · 只读）：编号项 1–7（F10 双层门 / F11-A / F11-B / F11-C / 用例覆盖 / 红线 / 行数）**逐条未发现偏离**；发现 2 项 = ①拆档新档为表外文件（🔵，需本记录披露）②§5 待写（🟡 未确认，本条即其收口）；无空洞断言（`assert.ok(true)` 类零命中）。
- 轮次 1（内部 advisor 代码评审）：**VERDICT: pass** —— 🔴 0 · 🟡 1 · 🔵 6。🟡 = F11-C 判据连带（段正文引用死占位字面 ⇒ 该段永久不可再写；本条 §2 已命中 = 设计缺口类，按上报父侧裁定，未标 must-fix）；🔵 = topic/date 单行缺差 · note 非串静默丢 · create 回执缺填充指引 · 设计文件表与 Δ 预估滞后 · 无段头档的域边界 · >300 既有裁定记录。
- **fix round = 0**：两项评审均无「实现 vs 已批设计」偏离项；🟡1 / 🔵6 全属设计级或既有面，按「不新增设计外语义」红线不自行改码 ⇒ 全量上报父侧裁决。
- 终态：**clean**（无未收敛返工项）。

**偏离记录（全量）**

1. 新增档 `thincoder-core/test/batch-placeholder-gate.test.mjs`（设计文件表外——设计预裁拆档的产物，已在 core-hygiene 注与两项评审披露）。
2. `findPlaceholderResidue` 返回项增 `where` 字段（决策表 #2）。
3. 其余零偏离：设计档 / 需求档 / 本档 §1–§4 未触碰；台账工具 · eng/plan/escalate 既有门 · 登记册（`agent-tools.mjs`）零改；六段 / append-only / 一段一作者 / 冻结门语义零变（既有 C6/C7/T10/C8/C10 + D-BR21 全绿佐证）。

**线外发现（父侧裁定项）**

- `thincoder-core/agent/helpers.mjs:392-393`（`AUTO_TURN_DIGEST_DOMAIN` 含「update the task list with the task tool」）经 `agent.mjs:169-170` 在自动轮注入，**无工程模式排除**（VSC 同基座 `turn-domains.mjs:29`）⇒ 工程模式下仍存第三条指向已停用工具的提醒指针（同族死胡同；不在本批受影响文件表）。
- `context.mjs:245-250`（压缩后 task 列表重注入）· `agent-tools/verify.mjs:78`（"the task list" 回显）= 陈旧回声（非指挥语），登记。
- VSC 全量 9 红归因 = 在飞 busy-injection 批（按声明排除；未独立复跑）。

**下游注意（F11-C 的引用纪律）**

死占位四字面出现在某段正文 ⇒ 该段 append/status 此后永久被拒（append-only 无解除路径）；**入场文本不扫，是「第二次写」才撞门**。本条 §2 已命中（其 :15 / :35 引用了旧 ID 占位字面）——§2 后续修正轮与 §6 收口文请以「旧 ID 占位」「台账行两占位」等描述替代逐字引用；该形态的裁决见评审 🟡#1。

### 第三面闭口轮（eng-coder · 2026-09-22 · round=fix——auto-turn digest 域模式变体）

**状态行**：实施完成

**改动清单（号 → file:line）**

| # | 落点 | 形态 |
|---|---|---|
| ① | `thincoder-core/agent/helpers.mjs:397-402` | 平行导出 `AUTO_TURN_DIGEST_DOMAIN_ENG`（单行正文 = 设计 §6.15.3 逐字；注 = 内容权父侧 + 出处 `AGENT-LOOP-SUBAGENT.md` §6.8 / `TOOLS.md` §6.15.3） |
| ①b | `thincoder-core/agent/helpers.mjs:389-393` | 悬空引文收正（旧 `AGENT-LOOP.md §17 D-S6` → §6.8 / §6.15.3）；普通档 `:394-395` 逐字零变 |
| ② | `thincoder-core/agent.mjs:29` + `:171` | import +1 名；注入点三元 = `upstreamTurn ? UPSTREAM_TURN_DOMAIN : (agent.config?.agent?.engineering === true ? AUTO_TURN_DIGEST_DOMAIN_ENG : AUTO_TURN_DIGEST_DOMAIN)`（条件 `:170` / `transient` / 位置零改） |
| ③ | `thincoder-vscode/src/agent/turn-domains.mjs:18` + `:30-34` | 转口导入三名；`composeTurnDomain(upstreamTurn, engineering = false)` 两级选择；头注 `:5-7` / `:26-29` 同步 |
| ④ | `thincoder-vscode/src/agent.mjs:123` | 恰一行内改：第二实参 = `agent.config?.agent?.engineering === true` |
| ⑤ | `thincoder-vscode/src/agent/setup-reminders.mjs:21-23` + `:44` | W15 转口表 +1 名；头注同步（基座两名 → 三名） |
| ⑥ | `thincoder-core/test/turn-domain-mode.test.mjs`（新档 57 行） | DOM-C1（普通档全串分段逐字 + 变体单行形态）/ DOM-C2（选串结构机检） |
| ⑦ | `thincoder-vscode/test/upstream-parity.test.mjs:25 / :210-211 / :222-223 / :248-275` | DOM-V3（组合调用恰 1 处 ∧ 传模式 · 转口含新名 · 零核基座字面否定零改）+ T-VS-U7 扩格 DOM-V1/V2（四格 = 两轮 × 两模式） |

**行数实测**（口径 = `split("\n").length - 1`；对照设计 Δ 预估）：helpers.mjs **421**（≈420）· 核 agent.mjs **436**（±0；+1 = import 绑定行）· turn-domains.mjs **35**（≈35 ✓）· setup-reminders.mjs **140**（≈139）· 端 agent.mjs **494**（±0 ✓）· upstream-parity.test.mjs **275**（≈271）· 新测档 **57**（≈45）。皆在限内（≤500 硬限；核两档在 `SOFT_LINE_REGISTRY` 在册；新档 ≤300 免登记；`test/run.mjs` 单层 glob 自动收集）。

**用例与测试读数**

- DOM-C1 / DOM-C2 = 新档 `test/turn-domain-mode.test.mjs`（2/2 绿 ⇒ 核全量 **541/541/0**，基线 539 + 2）。
- DOM-V1 / V2 = 端 T-VS-U7 扩格；DOM-V3 = 端 T-VS-U5 同步。
- 单档：`node --test test/upstream-parity.test.mjs` **7/7**；受影响档组（+ setup-reminders / turn-across-segments / vsc-stream-rules / lifecycle-hooks）**49/49**。
- 端全量：920 档时 **919/920**（唯一红 = `protocol-coverage.test.mjs` T-5「§12 悬空行 `busyQueued`」）；随后 922 档时 **921/922**（红改 = `chat-panel-messages.test.mjs:74` ① busy 分流）——两红皆在飞 busy-injection 批文件域（其源/测档 mtime = 运行同刻；`busyQueued` §12 行（`docs/vsc/design/WEBVIEW-PROTOCOL.md:365`）自注「实施轮按 `--emit` 重出」且 HEAD 零命中，`pushBusyQueued` 现源码零位）⇒ 归因外批、与本轮零因果（内审独立复核同判）。
- 日志落盘 `.thincoder/tmp/`：`_f10f11-3rd-core.log` · `-core2.log` · `-vsc.log` · `-vsc2.log` · `-vsc3.log` · `-vsc-parity-final.log` · `-vsc-affected.log`。

**变体逐字读回**：`AUTO_TURN_DIGEST_DOMAIN_ENG` 与设计 §6.15.3 五行折行块 join 单空格**逐字相等**（脚本比对，含 `2) (engineering mode: the task tool is disabled …updated in real user turns);` 段）；普通档与改动前临时快照对照逐字同，且「变体 = 普通档仅 clause 2 换段」成立（其余全同）。

**决策透明表**

| # | 决策 | 依据 |
|---|---|---|
| 1 | DOM-C2「恰 1 处」读作**消费点唯一**（import 绑定不计；计数域 = 注入点三元段） | ES 模块须具名 import 该常量 ⇒ 全档字面「恰 1 处」不可满足（最少 2 处）；设计括注「注入点三元内」= 计数域；测试注释写明；仓内先例（`manifest.test.mjs` 剥 import 行计数） |
| 2 | 核注入点三元**内联**模式读法（`agent.config?.agent?.engineering === true`），不新增局部变量 | 设计契约行的 `engineering ?` 为伪码；VSC 同行明确要求内联同键读法；保持「条件 / transient / 位置零改」（Δ 仅 +1 import 行） |
| 3 | DOM-C1 加固：普通档断言由「clause 2 在场」扩为**头 + 四段 + 尾的全串分段逐字** | 内审轮 🟡（断言力：其余段改动不被拦）；段覆盖 ≈ 全串，零第二副本（不违单源） |
| 4 | T-VS-U7 默认参数断言改「缺省形 vs 显式两参形」对拍 | 顾问轮 1 🟡（原式两侧同调用 ⇒ 恒真）；改后同时补上设计 DOM-V1 输入格的显式两参形 |

**审计与代码评审轮次与终态**

- 内部 explore 审计（只读）：🔴 0 · 🟡 1（DOM-C1 断言力——已修）· 🔵 1（§5 待写——本条即其收口）。7 项改动 / 5 行接口契约 / 用例表 / 边界五条逐条「合设计」；DOM-C2 读法独立复核判「成立（非降格）」。
- 内部 advisor 代码评审：轮 1 **VERDICT: pass**（🔴 0 · 🟡 2 · 🔵 2；🟡 = 恒真断言 + 端 `src/agent.mjs` 495 行既有登记债）⇒ 轮 2（fix 核验）**VERDICT: pass**（轮 1 唯一 🟡 = Fixed；无新 🔴）。
- **fix round = 1**（仅测试档：DOM-C1 加固 + T-VS-U7 对拍；源码面零改）。
- 终态：**clean**。

**边界确认（禁列零动）**：`UPSTREAM_TURN_DOMAIN` 文本与唤醒轮基座选择零动 · 注入条件 / `transient` / 位置零动 · 零新配置开关 · 机械拒绝面（装配摘除 + execute 拒）零动 · 提示词面零动 · `context.mjs` 重注入面 / `verify.mjs` 回声面零动 · verify guard 分支（台账 #217）零动 · `VSC-DEBT.md` 零动（登记归父侧派单）· 设计档 / 需求档 / 本档 §1–§4 零触碰。**表外改动：无**（7 档全在设计 §6.15.3 受影响文件表内，「新档」行 = 表内行）。

**遗留（报父侧裁）**：① 同族悬空引文残留（`§17 D-S6` 形态，核 `agent.mjs:31/:167` / `agent/run-stages.mjs:230`，CLI/VSC 亦有多处）——设计只点名收正 `helpers.mjs:389` 一处，未扩；② 设计档数值/行号漂移（helpers 实测 421 vs 预估 420；`TOOLS.md:817` 行号指针 `:169-170` → 现态 `:170-171`）；③ 端全量两红归因外批（见上）；④ `AGENT-LOOP-SUBAGENT.md:1773` U12 命令未扩模式令牌（设计 DOM-V3 宿主列写「U12 同步」；其五项判定现态仍全绿）；⑤ DOM-C2 计数域措辞建议入设计档（内审 🔵）。

## §6 验证与收口（父代理）

### 收口记录（主 agent · 2026-09-22）

**验收读数（父侧在盘复核——日志文件实读）**
- 核全量：`tests 541 / pass 541 / fail 0`（实施轮 539 + 修轮新档 DOM-C1/C2 两条；`_f10f11-core-after.log` · `.thincoder/tmp/_f10f11-3rd-core.log` 双读一致）。
- VSC 受影响面：`49/49`（五档组）+ `7/7`（`upstream-parity.test.mjs`）；全量读数见下条。
- VSC 全量：实施 / 修轮窗内因在飞 busy 批面呈 `919/920` → `921/922`（两红皆 busy 文件域、mtime 同刻、与本批零因果——修轮已做排除性论证）——该面随后由 busy 批闭合，全局终读 **`923/923/0`**（busy 批 §6 在册）。
- CLI 六档（受影响面：批档族 + 提示词族）：`48/48`。

**裁决（逐条）**
- 设计评审核项（🔵 各级）：**全数接受现状**——topic/date 单行校验缺差 · note 非串静默丢弃 · create 回执缺档头填充指引 · 既有 >300 行；四项均属设计外语义（红线守护），登记面无新增。
- 评审 🟡（F11-C 连带：段内引用死占位 ⇒ 该段此后不可再写）：**接受**——需求 F11③ 自身语义（机判加在纪律之上）；本批 §2 已命中而零后续写入，闭合无碍；引用纪律与本文遵行口径见 §5「下游注意」。
- 实施轮线外注记 1（`AUTO_TURN_DIGEST_DOMAIN` 含指向已停用 task 工具的指挥句——第三条死指针）：**并入本批闭口**——父侧扩证同族同源；设计修正落 `TOOLS.md` §6.15.3（父侧所出变体正文逐字 + 接口契约表 + 用例宿主）；修轮落地（helpers 平行导出 + 核 / 端双侧按模式选串 + `helpers.mjs:389` 悬空引文收正）。
- 实施轮 VSC 9 红排除归因（点名 busy 域）：**已消解**（busy 批终读 `923/923/0`）。
- 修轮遗留④（U12 命令未扩模式令牌）/ ⑤（DOM-C2 计数域措辞）：**接受现状**——DOM-V1/V2/V3 已覆盖新面且全绿；措辞已由 §5 决策透明表在档。
- 拆档（`batch.test.mjs` 506 > 500 ⇒ F11-C 组新档 `batch-placeholder-gate.test.mjs`）：**合规**——设计 §6.15 预裁的拆分位；新档 89 行 ≤300 免登记；`core-hygiene` 登记注在册。

**决议**
- 需求面 F10 三处补录（父侧笔 · `docs/core/requirements/TOOLS.md`）：边界补「提醒面」句 → 判定句补「提醒面判定」半句 → 措辞放宽为「提醒/指针」并明示三面覆盖（催更门 / VSC 守卫副本 / 自动轮 digest 域）；变更记录两条在档。
- 设计面机械收正（父侧直接执行 · 可 revert）：`ENGINEERING-MODE-V2.md` 装配面行 `[task, timer]` → `[timer]`（实施轮上报 + 设计轮落档）；`TOOLS.md` §6.15.3 契约表注入点坐标 `:169-170` → 实位 `:170-171`（±1 位移）。
- 死占位引用纪律：本批 §2 引用过「旧 ID 占位」等四字面其一 ⇒ 该段不可再写——本批零后续 §2 需求，不构成本批残留；该机判属设计语义（F11③），**不视为缺陷**。
- 提示词四档（核内 / 模板 × discipline / persona）：随本批落档，逐字 = 设计 §6.15.2。

**遗留（各带处置）**
- 同族 `§17` 悬空引文残留 6 处（cli 2 · core 2 · vsc 1 + `agent.mjs` 短形态 2）⇒ 台账 #220（归批）。
- 修轮所指 `VSC-DEBT.md` §12.1 登记面：`vsc/src/agent.mjs` **494 行已在册**（触发线 >495 未触）⇒ 零动作。
- 其余残留（§5 已列）随对应档下次触碰。

**结算依据**：§5 两块（实施轮 + fix 轮）· §3（轮 1 令改 → 修正 → 轮 2 pass）· §4（批准）· 提交 = 本批提交（推 `origin/main`）· 台账 #214 / #215。
