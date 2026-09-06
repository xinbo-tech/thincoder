# 方法论 — 如何与 AI Agent 协作编程

> 本文档是 ThinCoder 三观的实践延伸：三观回答"为什么"，方法论回答"怎么做"。
>
> **注入体指针（2026-09-05）**：工程模式注入读的是**项目根 `METHODOLOGY.md`**（两端 `thincoder/`、`thincoder-vscode/`——机制正文派生版，含代码结构分层章）——本设计文档是完整版（机制正文 + 变更记录 + 设计书账）；机制更新时**先落本文件，再同步根注入体**（根文件头注释已声明同源）。

---

## 基本流程

任何开发任务都走四步，不跳：

1. **需求** — 讨论清楚要什么，落成需求文档，确认后再往下走。需求文档按**三层**组织：
   - **总目标（overall goal）** — 一句话说清这个任务为谁解决什么问题；
   - **功能用户故事（functional user stories）** — 逐条可验收，格式：**作为一个 [角色]，我想要 [功能]，以便 [目的]**。只描述 who / what / why，不写 how；
   - **非功能标准（non-functional standards）** — 性能、安全、兼容性、可用性等约束，写清度量方式。

   需求完成的判据：三层都具体到可以据此设计（用户确认，或答案不再改变需求）。需求确认后逐条建立 checklist 条目——checklist 是需求验收的标志：没有 checklist 条目意味着需求还没落地。
2. **设计** — 方案、架构、怎么实现，落成设计文档：问题陈述、方案与理由、受影响文件全清单、可验证的验收标准（每条验收标准回指用户故事）。设计定了再动手。
3. **开发** — 写代码。
4. **测试** — 验证。测试要有测试文档：每条用户故事至少对应一个测试用例，覆盖正常情况、边界条件、异常情况。每条用例写清楚测什么、给什么输入、期望什么输出。不写实现细节。

这四步不是"最佳实践"——是硬流程。三步要写文档：需求文档、设计文档、测试文档。跳到第 3 步就开始写代码，十次有九次是错的。

## 需求池攒批工作流（2026-09-03 · 设计——用户裁定——**已批准**——三轮收敛 0🔴）

> **状态：设计批准（2026-09-03 三轮收敛 0🔴 + 第四轮评审通过——token eb58941f 签发——实现批：engineering.md 三分句逐字锚 + 断言 + ENGINEERING-MODE 变更段 + 用例表写全——R1 池行跟踪）**。模板同批同步（`METHODOLOGY.md` 根模板——通用机制）。**锚范围澄清（评审 #1）：methodology-template 英文节 = 用户面向块（状态头/动机/6 步）——排除 Prompt sync/Acceptance/Affected 书账子节与"评审 #N"注——模板措辞按根模板替换（非已匹配）——状态头不入锚（评审 #2）**。

### 目标与动机

- 单点流水线（你说一个需求 → 澄清 → 设计落档 → 评审 → eng-coder）固定成本 ~40 分钟——被一个需求点独扛；批量流水线把固定成本摊到多个需求点上（一次设计落多点、一次评审多段、eng-coder 并批/镜像并行）。
- 质量不降：代码级工程流程（评审/审计/测试纪律）原样保留——攒批只改变"触发时机"（攒够再启动），不改变"每点怎么做"。

### 机制

1. **登记（提需求时）**：你提普通需求 → agent 当场澄清 → 更新所属板块需求文档（需求句落档——澄清产物）→ `docs/TODO.md`「需求池」组登记一行（日期 / 需求句 / 归属板块 / 状态=待设计）——**不做设计**。
2. **攒批**：需求点累积——设计启动权在你（说"开始吧/这批做"）。
3. **建议阈值**：同板块积 **≥2 点** 或 池全局 **≥3 点** → agent 提醒一次（"池够大了——可以开始设计"）——提醒不代替发起。
4. **批设计**：一次落多个需求点（同板块同设计文档多段——跨板块可多文档同批）→ 同批评审（documents 列批内全部）→ 用户批准 → 批实现（并批单 eng-coder 或镜像并行——多实现面准则不变）。
5. **快车道**：你说"这个急/马上做" → 不登记——单点走现有完整流程（设计 → 评审 → 实现——一步不少）。
6. **边界**：池只收**用户需求点**——技术待办（设计遗留/评审发现/债）仍走 `docs/TODO.md` 技术组——不混池；紧急 bug 由快车道覆盖。

### 提示词同步（实现批——评审 #1 逐字锚定稿）

- `engineering.md` Mandatory Flow 加**三分句逐字锚**（两端 byte-identical——照抄——评审 #1 补定）：——**指针（2026-09-04 §18.11）：byte-identical 约束已取消——见 AGENT-LOOP §18.11——本条为历史实现记录（锚文本仍逐字定稿于设计文档——两端照抄——但不再 byte-identical 断言）**
  > 1. **Pool routing**——"ordinary requirement statements register in the owning board's requirements doc and the project docs/TODO.md「Requirement Pool」group first; design does not start until the user says start this batch (or marks the point urgent — fast lane)."
  > 2. **Threshold reminder**——"same board ≥2 or pool-wide ≥3 requirement points: remind once that batch design can start — the user still fires the review and approval."
  > 3. **Fast lane**——"the user saying this is urgent / do it now skips the pool: single-point full flow (design → review → implementation — no step cut)."
- **断言目标 1:1 对齐**（与三句——fail-when-unchanged）：engineering.md 含「Requirement Pool」组短语 +「pool-wide ≥3」+「single-point full flow」——**规格/测试句清单统一为三句（评审 #1——原"分流+阈值 vs 分流+快车道"不一致消除）**。
- `methodology-template.md` 英文节锚 = 根模板本机制节（字节源——逐字复制——15 对双端）。
- `main.md` 普通模式不加——池是**工程模式机制**——普通模式登记**不承诺**（评审 #5——删原"普通模式跟随"句——未落实承诺不做）。
- **归属文档指针（评审 #6）**：实现批落 ENGINEERING-MODE.md 变更段（engineering.md 内容改动记录）——防碎片化。
- **三副本不变量断言（评审 #8）**：实现批测试锚机制不变量（阈值 ≥2/≥3 + 边界"池只收用户需求点"）跨三副本（根模板/项目版/template 对）在——防单向漂移。
- **用例表（评审 #4——实现批展开）**：N 登记流（输入：用户提需求 → 输出：板块需求文档落句 + 池行新增）；E1 同点重复提（输入：相同需求再提 → 输出：**池行更新（dedup 键 = 板块 + 规范化需求句——评审 #4 补）**不新增）；E2 批进行中阈值再达（输入：批设计运行中再积 3 点 → 输出：提醒延后不打断批）；A 撤回需求（输入：用户撤需求 → 输出：池行撤销注保留）——每用例输入/预期输出明确。
- **main.md 普通模式**——工程模式专用（如上）。

### 测试（实现批展开——复审 #1 残留处置：旧断言清单合并入上——本节点名保留作测试权威）

- 断言目标 = 上文「断言目标 1:1 对齐」（三句短语：Requirement Pool 组短语 + pool-wide ≥3 + single-point full flow——**含阈值句——旧"两句清单"已删**——fail-when-unchanged——两端）
- 用例表 = 上文「用例表（评审 #4）」（N/E/A——登记流/dedup/批中阈值再达/撤回——每用例输入/预期输出明确）——行为不另列（并入 N 用例）
- 三副本不变量断言 + 归属指针 = 上文（评审 #8/#6）

### 受影响文件

- `docs/design/METHODOLOGY.md`（本节）+ 根模板 `METHODOLOGY.md`（同机制节——英文同构）+ **`src/prompts/methodology-template.md`（模板真身——15 文件对之一——CLI + VS Code 双端同改 byte-identical）**——**指针（2026-09-04 §18.11）：byte-identical 约束已取消——"15 文件对双端同改"为历史记录——模板锚同样以设计文档逐字定稿为准**—— + `docs/TODO.md`（需求池组——初始化）+ 实现批：`src/prompts/engineering.md`（两端）+ 两端测试断言。


## 代码结构：理解成本分层（2026-09-05 · 学习 + 用户裁定——量化尺度定稿）

> **状态：方法论正文已落（本文件）。模板同步（`methodology-template.md` 英文节）已于实践轮成功后回填（2026-09-05——三单体 runPanelChatImpl/两端 runAgent 拆出骨干且全量回归断言数不减——实践验证完成——见变更记录末条）。**

**来源**：Dijkstra 结构化程序设计（局部推理——每段能作为单入口单出口黑盒独立理解）→ Parnas 模块分解（信息隐藏/决策边界——“模块是工作分配单元，不是子程序”）→ 认知复杂度研究（主要敌人是嵌套深度与分支密度，不是行数）→ 本项目实践教训（到 500 行说明已经很难理解——函数档是早期预警线，文件档是不可协商底线）。

### 为什么分层（动机）

1. **理解的成本是状态，不是行数**。读 400 行单体时，任何一行代码的正确性都依赖前面所有局部状态——读者必须同时悬着几十个变量与分支条件才能走到后段。分层把状态域切小：每个子函数只暴露“名字 + 参数 + 返回”，读者在同一时刻只需维护一层的心智状态。
2. **局部推理**（Dijkstra 的本意）：验证一段代码“对不对”，不需要同时验证别的段。单体做不到——改 A 段必须重推 B 段。
3. **改动隔离**（Parnas 的落点）：会变化的设计决策（调度、冻结、错误重试）各自被模块围住——改一处不波及其余，回归面 = 该模块的测试，而不是全函数。
4. **可独立测试 = 质量底线**：验收标准要逐条映射测试，而测试需要可命名的单元。单体只能端到端覆盖——失败定位靠猜。
5. **本项目特有：模型是第二读者，而且是高频读者、也是写者**。agent 把文件全量读进上下文——单体挤占窗口、稀释注意力、抬高幻觉率；分层 + 模块地图让模型先读骨架、按需下钻，读得少而准。维护者（未来的模型）对分层代码的修改定位更准、误伤更少——今天的分层是给未来每一次改动的折扣。

**封口（2026-09-06）**：行数不是目标，但档位表是不可协商的判据——以上动机解释为什么，绝不是给判据打折的许可证。

### 不这样做的代价（持续单体的不良影响）

1. **修改成本随规模超线性上涨**：每次改动的固定前置 = 通读全函数理解现状。函数越长老账越厚，改得越多越贵——膨胀是正反馈：新需求最省事的落点就是往长函数里再塞一段（subagent.mjs 726、两端 runAgent 400+ 就是这么涨出来的）。
2. **修 bug 的连带风险**：单体里的“远处”就在同一函数内——改一行可能踩到几十行外依赖它的状态，回归测试覆盖不到组合爆炸。无结构代码只能越长越乱，直到重写。
3. **协作冲突面大**：两个改动（人或 agent）落在同一单体 = 必然互相干扰；模块化后各改各的边界。
4. **压缩恢复成本**：本项目上下文频繁压缩——压缩后恢复工作靠名字与注释当钩子。单体没有钩子，恢复 = 重新通读。
5. **规则失本意的负优化**（最重要的元代价）：没有 Why 的 500 行红线会退化成游戏规则——把力气花在凑行数上：搬独立小块、压注释、顺着执行步骤切，模块间耦合反而恶化（本仓库 2026-09-05 真实教训）。**写清楚动机，规则才不会被玩坏。**

### 基本尺度（定量）

**函数体（单体函数）——第一判据：**

| 行数 | 判定 |
|---|---|
| ≤50 | 好——通读无负担 |
| 50–100 | 正常——仍可整体理解 |
| ≥100 | **主动审视**：内部有无可命名的子段？有则拆出子函数 |
| ≥300 | **必须拆**：函数只留骨干（阶段调用序列），细节全部进子函数 |

| 行数 | 判定 |
|---|---|
| ≤300 | 正常 |
| >300 | **主动审视**：有无可抽模块？有则拆 |
| >500 | **必须拆**——硬限，无例外、无相对比较通道 |

**两者关系：先函数后文件。** 文件超标通常是“单体函数撑起来的”——按函数档拆完，文件自然回落；反过来只搬文件块不动单体（反面教训：只搬 31 行 payload 凑行数、430 行回合驱动器原封不动）是自欺。文件 ≤500 而内含 300+ 单体 = 仍未达标。**相对大小永远不是豁免**——"我才 500+ 行、没 X 行大"对某个 X 总成立；判据只有档位表。

### 原则

1. **一个函数表达一个概念**——命名困难 = 职责过多。
2. **骨干—细节两层**：驱动器型函数（回合/循环/状态机）允许长，但只许长在**骨干**上——骨干 = 阶段调用序列 + 阶段间数据流；每阶段实现进子函数，细节可递归再分。判定：**去掉子函数实现，骨干仍能讲清“做什么”**。即使回合逻辑也不可能是几百个步骤堆在一起，必然有阶段划分（分流/装配/执行/收尾）。
3. **时机：边写边分层，不写完再拆**（2026-09-05 用户裁定——预防优先于补救）：写作时函数近 ~100 行就应在**写的过程中**提取具名子函数（边长边提）；先写完整单体再回头拆 = 主动造债再还。≥300 行函数是债不是步骤——存量债要清（实践轮），增量债靠写前纪律不再产生。
4. **子函数提取判据**：连续一段能命名（阶段名、意图名）且闭包状态可参数化 → 提取；状态纠缠过深就先重组数据再提。
5. **模块边界围住决策（Parnas）**——按会独立变化的设计决策 / 可独立测试的单位切，不按执行步骤、不按行数切。
6. **控制流局部化**——guard clause / early return 是正道；嵌套 ≤3 层；不要在相隔数百行处配对控制流（回调与调用点分离过远时应重组）。
7. **状态机显式化**——迁移集中一处、事件按状态分组；不做行数切片，做状态分层。
8. **注释与决策同行**——决策注释（§锚点/为什么）是信息主体；抽取时注释跟决策走，不为行数删注释、不压行（反面教训）。
9. **双端 parity**——CLI/VS 镜像结构，拆分两端同步，锚跟代码走。

### 动手自检

- 拆前四问：这段不读完整段讲不清它干什么？它叫得出名吗？边界按决策还是按步骤？注释/决策跟走了吗？
- 拆后两验：骨干可独立复述；行为零变（verbatim 或闭包参数化 + 全量回归，断言数不减）。（断言数不减 = 拆分轮专用红线；存量清理轮 = 删除清单制，差额 = 清单数——2026-09-06 收窄）

### 实战教训（反例档案——2026-09-05 拆分轮起持续增补，注入体同文）

> 叙事负责“有道理”，规则负责“执行”——模型跨会话无痛觉，每条反例必须绑一条可执行规则。

| 反例 | 当时的错 | 提炼的规则 |
|---|---|---|
| 430 行驱动器只搬走 31 行 payload | 把“文件超限”当目标——搬最小块交差 | 超限先查函数档：文件里 ≥300 单体未拆 = 未拆 |
| 502→500 压注释凑行数 | 指标游戏——对可读性负贡献 | 拆分绝不以删/压注释为手段 |
| 迁移函数凭记忆重述 | `_engDesignSlots` vs `_engDesignTokens` 行为漂移——12 测试红 | 迁移必须 verbatim——从源文件复制，不重述 |
| 该拆的 execute 问“要不要拆” | 把显然的义务当选项抛回 | 判据触发（≥300）= 直接做，不问 |
| 引用"才 500+ 行、没 X 行大"拒绝拆分（2026-09-06 实测） | 用相对大小给硬限打折——"fallback/只是红线"修辞被倒读 | 文件 >500 = 必须拆——判据只有档位表，无相对比较通道 |

## 检查表

工作的时候一定要有一张检查表，把要做的事、已做的事、做到哪一步都写清楚。检查表是项目层面的——需求确认后逐条加入，开始做时标 in_progress，验证完成后标 done。`task` 工具是会话层面的——做检查表里某一条时，拆成子步骤跟踪。检查表不依赖上下文记忆，上下文会被压缩，检查表常在。检查表固定在 `.thincoder/checklist.md`，每次会话自动注入，用 `checklist` 工具增删改查。

## 遇到问题三招

1. **分析日志** — 先看完整的错误输出，根因通常在末尾。别跳过，别猜。
2. **查资料** — 搞不清楚的 API、协议、框架行为，去查官方文档。不要闭门造车。
3. **二分法测试** — 把问题空间切成两半，确认故障在哪一半，重复。每一步排除一半可能。

## 不要陷在长时间反复阅读代码里

读代码理解不了的东西，跑一遍就理解了。不要盯着代码反复看，写个测试、打个日志、二分法定位——动手比动眼有用。

---

## 本文档的检查表

- [x] 基本流程：需求→设计→开发→测试，四步不跳
- [x] 检查表：干活必须有检查表，不依赖上下文
- [x] 遇到问题三招：分析日志、查资料、二分法测试
- [x] 不要长时间反复阅读代码：动手比动眼有用
- [x] 代码结构分层章节已落（2026-09-05 节——实践轮 + 模板回填已闭环；2026-09-06 防博弈加固见下文变更条——评审 #3 处置）

---

## 变更记录

### 2026-08-23：工作流程与调试策略要求使用 `task`（已落地）

**需求**（用户拍板）：标准模式（普通开发）的**工作流程**与**调试策略**都应要求使用 `task`（会话级任务跟踪），使多步工作在任意时刻都可见「计划中 / 进行中 / 已完成」。

**设计**（已落地，落 `src/prompts/discipline.md`，CLI `thincoder/` 与 VS Code `thincoder-vscode/` 各一份 byte-identical；desktop vendored 副本不在本次范围）：
1. **Workflow 段**加总规（英文，匹配文件现语言）：「use `task` to track work for EVERY tier — one item in_progress at a time」；复杂层保留 `checklist`+`task` 双轨；中/小层都显式用 `task`（用户明确：单行小改也要 `task`）。
2. **Debugging 段**加一条（英文）：「Track the debug steps in `task` — reproduce → locate root cause → fix → verify, one in_progress」。

**范围**：仅标准模式 `discipline.md`。工程模式已自带 `checklist`+`task`（`engineering.md`：每个需求映射 checklist 条目、用 task 跟踪），无需改。

**测试**（内容级断言英文短语——`discipline.md` 全英文；两端各验；仅 byte-identical 不算通过）：
- Workflow 段含总规英文句「use `task` … every tier … one in_progress」；Complex 层仍含 `checklist`；Medium 层含 `task`；Small 层含 `task`。
- Debugging 段含「reproduce → locate root cause → fix → verify」+ `task` + 「one in_progress」。
- 内容断言必须能在副本**未改**时失败，不能只靠「两端 byte-identical」漂绿。
- 全量测试回归不降。

**受影响文件**：`src/prompts/discipline.md`（`thincoder/` + `thincoder-vscode/` 各一份）。

### 2026-08-23：改码前读文档 + 中/小改后更新文档（嵌入 Workflow 箭头序列，已落地）

> **⚠️ 已被 §21（AGENT-LOOP.md）取代（2026-09-05）**：本条目第 4 点的 `update the owning doc if you spotted a gap`（弱点触发——发现缺口才更新）已被普通模式文档纪律升级替换为**无条件补写**（决策落档 + 完成检查补写，无豁免——小修改也落档，含开发前落档）。当前权威：AGENT-LOOP.md §21 D-N1.3/D-N1.5 + discipline.md M/S 级英文逐字锚（`update the owning doc — a decision or completed change is recorded there` + `small changes are documented too`）。本条 as-of 快照保留历史。

**需求**（用户拍板）：标准模式中，① 改代码前（不论大/中/小）都要求先读一些文档；② 中/小任务改完后、发现文档缺口时更新文档。

**设计**（修订——读/更新文档**嵌入 Workflow 箭头序列**，而非独立段落；两端 byte-identical）：
1. **删除**上版独立的 `Documentation` 段。
2. Workflow 段首**前移**一条「读文档」总规（从被删的 `Documentation` 段移至 Workflow 段首；英文，定义含义）：`Read the relevant docs before changing code — at ANY tier: doc_search the topic, then locate the owning design doc via docs/design/README.md (the document map) and read it — plus AGENTS.md if present.`
3. 每个 tier 的箭头序列**前缀**加 `Read the docs`：Complex = `Read the docs → Requirements → Design → Development → Testing`；Medium = `Read the docs → Plan → Change`；Small = `Read the docs → Change → Verify`。
4. 中/小 tier 的箭头序列**后缀**加 `update the owning doc if you spotted a gap`（英文，含 gap 定义：a decision not yet recorded, or a doc now contradicting the code），Complex 不加（已写设计文档）。
5. 保留归属句（置于 Workflow 段末）`Never create a new doc for an existing board's topic — find the owner and amend it.`

**范围**：仅标准模式 `discipline.md`。工程模式已有 read-docs-first + 强制设计文档，无需改。

**测试**（英文内容级断言，两端各验；仅 byte-identical 不算通过）：
- 无独立 `Documentation` 段（断言不存在 `Documentation —` 段头）。
- 含读文档总规句：`read the relevant docs` + `document map` + `ANY tier`。
- Complex 层箭头含 `Read the docs → Requirements → Design → Development → Testing`。
- Medium/Small 层箭头含 `Read the docs` + `update the owning doc if you spotted a gap`。
- 含归属句：`Never create a new doc` + `find the owner and amend`。
- 断言在内容未改时能失败；全量回归不降。

**受影响文件**：`src/prompts/discipline.md`（`thincoder/` + `thincoder-vscode/` 各一份）。

### 2026-09-05：代码结构——理解成本分层（方法论章节已落，实践待启动）

**需求**（用户拍板）：① 代码长度限制不是被动合规指标，而是为了"以后的工作更轻松"——连续几百行的单体函数必须通读全段才能理解结构，有层次的代码能立刻看懂骨架；② 分解不应按文件行数凑数，应按可读结构；③ 文档先落方法论（本项目），实践成功后再提炼进方法论模板（`methodology-template.md`）。

**设计**（落地前学习：Dijkstra 结构化程序设计/局部推理 → Parnas 模块分解/决策边界 → 认知复杂度研究；量化尺度为用户裁定）：
1. 基本尺度：函数体 ≤50 好 / 50–100 正常 / ≥100 主动审视拆子函数 / ≥300 必须拆成骨干；文件 >300 advisory、>500 硬限（既有）；先函数后文件——搬文件块不动单体是自欺。
2. 八原则：一函数一概念；骨干—细节两层（驱动器允许长但只长在骨干）；子函数提取判据（可命名 + 闭包可参数化）；模块边界围住决策（Parnas）；控制流局部化（guard clause、嵌套 ≤3）；状态机显式化；注释与决策同行（不为行数删注释）；双端 parity。
3. 动手自检：拆前四问 + 拆后两验（骨干可复述、行为零变 + 断言数不减）。

**范围**：`docs/design/METHODOLOGY.md` 新章节「代码结构：理解成本分层」（本节落地）+ 本文档检查表项。模板同步（methodology-template.md 英文节）**明确不做**——待实践成功（实践轮目标：VS runPanelChatImpl / 两端 runAgent / buildToolCallbacks 拆出骨干且全量回归）后回填，回填时同步 discipline.md 量化锚句（用户口径：模板 = 实践成功后提炼）。

**测试**：实践轮完成前以文档自检为准（章内档位表/原则/自检完整）。实践成功后：模板英文节含档位句（函数 ≥300 必须拆骨干）与骨干判定句（去掉子函数实现，骨干仍能讲清"做什么"）+ 全量回归不降（拆分轮断言数不减）。

**受影响文件**：`docs/design/METHODOLOGY.md`（本节——CLI 仓；模板与 discipline.md 待实践轮）。


### 2026-09-05：分层方法论配套——反例档案 + 写作前分层纪律（注入体与 discipline 同步）

**需求**（用户拍板）：① 反例档案形态可以（每条反例绑一条可执行规则）；② 代码结构判据应在**写代码前**考虑（预防），而不是写完后再拆（补救）——缺口③的机制从"事后扫描拦截"改为"写前分层纪律"。

**设计**：
1. docs 分层章原则区插入 **3. 时机：边写边分层，不写完再拆**（近 ~100 行边长边提；≥300 是债不是步骤——存量债实践轮清、增量债写前纪律防）；原则顺延 3-8 → 4-9。
2. 分层章尾加 **实战教训（反例档案）**节：四反例（31 行 payload 凑数 / 压注释 / 凭记忆重述迁移 → 行为漂移 12 测试红 / 该拆的问"要不要拆"）——每条绑一条可执行规则——注入体同文（模型无痛觉——叙事负责"有道理"，规则负责"执行"）。
3. 同步两端根注入体 `METHODOLOGY.md`（工程模式注入）。
4. `discipline.md`（两端——普通模式注入）加 **Code structure** 英文段：structure before size / 写时分层的操作句（普通模式日常写码主战场——分层纪律两端模式都生效）。
5. `methodology-template.md`（模板真身）**仍不动**——实践成功后再提炼（既定顺序）。

**范围**：`docs/design/METHODOLOGY.md`（本节）+ 两端根 `METHODOLOGY.md`（注入体同步）+ 两端 `src/prompts/discipline.md`（Code structure 段）。

**测试**：内容级——注入体与 docs 同文（实战教训表四行 + 时机句）；discipline 两端含 Code structure 段（含 structure before size 锚句）；全量回归不降（纯文档）。

**受影响文件**：如上——CLI + VS Code 双端。

### 2026-09-05：实践轮完成——三单体拆骨干 + 模板回填（方法论闭环）

**需求**（用户拍板："现在可以开工了"）——按新尺度把三大 ≥300 单体拆出骨干，实践成功后回填模板。

**设计**（骨干—细节两层——每函数仅留阶段调用序列，细节进具名函数；verbatim 或闭包参数化，语义零变）：
1. **VS `runPanelChatImpl` 420→221**（55144be）：回调工厂（webview 桥——25 onX）→ `panel-callbacks.mjs`；主循环（guard-carry/ContinueError/Ctrl+I/错误持久化）→ `runTurnLoop` 模块函数。
2. **VS `runAgent` 427→~190**（1133491）：压缩检查 / 蒸馏发射 / 回合收尾 / guard 推回组 → `agent/run-stages.mjs`（VS）；import 面清理。
3. **CLI `runAgent` 383→293**（c3afa53）：压缩检查 / 注入组 / 响应提醒 / 回合收尾 + collectSettledAsync → `agent/run-stages.mjs`（CLI——双端对位同构，parity 锚跟进）。
4. 审视档评估：`buildToolCallbacks`（232）与 `verifyTool.execute`（280）为命名回调集/注释阶段序——骨架形态已达"去掉细节仍讲清做什么"——判定无需强拆（一次调用无复用——提取是负收益）。
5. **模板回填**（本批）：`methodology-template.md`（两端）加 Code Structure 英文节——档位句（≤50/100/≥300 拆骨干）+ 骨干判定句 + 八原则 + 实践验证注；docs 状态注更新。
6. 过程中方法论自证：三处"零重叠插入"编辑事故（新增内容重复/旧块未删）——均当场核对修复——反例档案再添一条：**编辑后必须核对 diff 上下文——零重叠插入语义（新块追加旧块保留）是本次三连事故根源**。

**测试**：VS 全量 1199/1199 + lint 225；CLI 全量 1485/1437+48skip/0 + lint 274；三拆分各自定向测试全绿——断言数未减（vs 拆分前基线）。

**受影响文件**：VS `extension/panel-chat.mjs`/`panel-callbacks.mjs`（新）/`agent.mjs`/`agent/run-stages.mjs`（新）；CLI `agent.mjs`/`agent/run-stages.mjs`（新）；`methodology-template.md`（两端）。

### 2026-09-06：拆分判据修辞防博弈加固——文件档与函数档同级硬判据（快车道——用户实测模型引用"才 500 多行、没 2300 行大"拒绝拆分）

> 状态：**已实现（2026-09-06——双端 clean（CLI id:14：审计 clean + advisor 0🔴；VS Code id:15：审计 CLEAN + advisor 0🔴——均零修正轮）——父侧 L2 核销：CLI 1441/0 + VS Code 全绿——工作区根两文件豁免句 grep 零残留（AC-S3 ✓）——存量债 26/17 已登记 TODO——D-S2 docs 版旧句失配（多"（既有，不变）"——整行退役处理，审计/advisor 确认）已记录——round1 评审 0🔴 通过（token 5c5c386b…/designId 553f9a4d——1🟡+2🔵 全处置）——用户批准 2026-09-06）**。

**触发**（用户实测 2026-09-06）：模型面对 500+ 行文件引用方法论修辞拒绝拆分——"才五百多行，没 2300 行那么大，所以不必拆分"。排查（explore 报告 2026-09-06）：阈值本身两端齐全（>500 硬限），但四处修辞给模型递了顺杆爬的路径：①英文模板 "**File caps (fallback):**" 把文件档定性为兜底/次级（函数档标 "the primary yardstick"——模型推论：函数 <300 = 主判据通过 → 文件档可打折）；②"不是行数"动机修辞重复三遍（中文 §来源/§动机 + 英文 Motivation）被字面化为"行数可协商"引文；③中文 §来源尾句"500 行只是红线……真正的判据在函数尺度"——"只是/真正的判据在别处"直接降级硬限；④反例档案（凑行数负优化）被倒读为"为行数而拆 = 指标游戏 = 不拆更安全"。**"2300 行"全工作区文档不存在（唯一命中 thinworker 无关数字"23004 条"）——模型自造相对锚点——文档无相对比较封堵句（漏洞⑤）**。

**需求**（用户 2026-09-06 批准修复方向 + 快车道）：

- **F-S1（同级判据）**：文件档去掉 "fallback/兜底" 定性，与函数档同格式判定表（>500 = 必须拆，无修饰语）；函数档改定位 = **早期预警线**，文件档 = **不可协商底线**——先后关系而非竞争关系。
- **F-S2（修辞封口）**："不是行数"动机保留（防凑行数负优化的本意不动），补封口——行数不是**目标**，但档位表是不可协商的**判据**。
- **F-S3（封堵相对比较）**：相对大小永远不是豁免——"比 X 小"对某个 X 总成立；判据只有档位表。
- **F-S4（反例档案）**：加新一行——相对大小打折硬限的实测反例 + 可执行规则。
- **F-S5（豁免取消——2026-09-06 用户裁定"不允许豁免，删掉那些豁免的说辞"——评审范围外 A 项升级）**：AGENTS.md / advisor.md 的"测试文件 + 生成代码豁免"说辞全删——文件档"无例外"字面成立（测试文件同判）；存量超 500 行测试文件转**存量债**登记（实测 2026-09-06：CLI 26 个 / VS Code 17 个 >500——本批不清偿，登记 docs/TODO.md 模块拆分轮组）。
- **NF-S1（载体同步）**：docs 版（权威，先落）→ 两端根注入体 `METHODOLOGY.md` → 两端 `methodology-template.md`；中英镜像锚各自逐字定稿；双端 parity（原则 9）。

**设计**（逐字锚定稿——实现面照抄，禁止自行解释）：

- **D-S1**（中文 §代码结构·来源 尾句改）：「500 行只是红线，到 500 行说明已经很难理解——真正的判据在函数尺度」→「到 500 行说明已经很难理解——函数档是早期预警线，文件档是不可协商底线」。
- **D-S2**（中文 §基本尺度 文件档改判定表）——「**文件——兜底红线：** >300 advisory 主动审视；>500 硬限。」→

  | 行数 | 判定 |
  |---|---|
  | ≤300 | 正常 |
  | >300 | **主动审视**：有无可抽模块？有则拆 |
  | >500 | **必须拆**——硬限，无例外、无相对比较通道 |
- **D-S3**（中文 §基本尺度 关系段尾补封口句）：「**相对大小永远不是豁免**——"我才 500+ 行、没 X 行大"对某个 X 总成立；判据只有档位表。」
- **D-S3b**（中文 §代码结构·为什么分层（动机）节末补封口句——评审 #1——中英镜像 1:1）：「**封口（2026-09-06）**：行数不是目标，但档位表是不可协商的判据——以上动机解释为什么，绝不是给判据打折的许可证。」
- **D-S4**（中文 §实战教训 表加一行）：「引用"才 500+ 行、没 X 行大"拒绝拆分（2026-09-06 实测）｜用相对大小给硬限打折——"fallback/只是红线"修辞被倒读｜文件 >500 = 必须拆——判据只有档位表，无相对比较通道」
- **D-S5**（英文模板镜像——`methodology-template.md`）：
  - "the quantified scale below is a fallback, not a goal" → "the quantified scale below is the yardstick — the motivation above explains the why, never a license to discount it"；
  - "**Function-body scale (the primary yardstick):**" → "**Function-body scale (the early-warning line):**"；
  - "**File caps (fallback):** >300 advisory review; >500 hard limit. Functions before files: a file ≤500 containing an unsplit ≥300-line monolith is not done — splitting files without splitting monoliths is self-deception." →

    | Lines | Verdict |
    |---|---|
    | ≤300 | normal |
    | >300 | review: extract modules if nameable units exist |
    | >500 | must split — hard limit, no exceptions, no relative-size defense |

    "Functions before files: the function scale is the early-warning line; the file cap is the non-negotiable floor. **Relative size is never an exemption** — "only 500+, not as big as X" holds for some X at any size; the scale table is the only verdict. A file ≤500 containing an unsplit ≥300-line monolith is not done — splitting files without splitting monoliths is self-deception."
- **D-S6（同步顺序）**：docs 版先落（本节 + §代码结构正文 D-S1..D-S4）→ 两端根 `METHODOLOGY.md`（同文）→ 两端 `methodology-template.md`（D-S5）。
- **D-S7（豁免说辞删除——F-S5——4 处精确串，勿误伤其他合法"豁免/exempt"语境）**：
  - `AGENTS.md`（工作区根）L42：「≤ 500 lines hard limit (test files exempt)」→「≤ 500 lines hard limit」；
  - `.thincoder/advisor.md`（工作区根）L18：删整行「- Test files (`test/**`) and generated code are exempt from these thresholds.」；
  - `thincoder/AGENTS.md` L38：删尾句「 Test files (`test/**`) and generated code are exempt.」（保留 "must split before merge."）；
  - `thincoder/.thincoder/advisor.md` L11：删整行（同根 advisor.md 句）；
  - `thincoder-vscode/AGENTS.md` 无此说辞（无需动——其 L41 "interrupt-settle 豁免" 为无关语义，不碰）。

**测试**（T-S 系——锚断言 fail-when-unchanged——落点 = 既有 methodology 锚断言所在测试文件，实现批定位）：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-S1 | N | 读两端根 `METHODOLOGY.md` | 含「必须拆」文件档表 +「相对大小永远不是豁免」封口句 + 反例档案新行锚 |
| T-S2 | N | 读两端 `methodology-template.md` | 含 "must split — hard limit, no exceptions, no relative-size defense" + "Relative size is never an exemption"；**不含** "File caps (fallback)" **与 "the primary yardstick"**（旧句退役零残留——评审 #2） |
| T-S3 | N | 读 `docs/design/METHODOLOGY.md` | 机制正文同锚（权威源先落） |
| T-S4 | E | 全量回归（两端） | 全绿零破坏（纯文档 + 断言） |
| T-S5 | N | 读 `thincoder/AGENTS.md` + `thincoder/.thincoder/advisor.md` | 不含豁免句（"Test files (`test/**`) and generated code are exempt" 零残留——fail-when-unchanged）；工作区根两文件（根 AGENTS.md / 根 .thincoder/advisor.md）由父侧交付时 grep 零残留核销（工作区级文件不入仓测试——防仓独立克隆脆性） |

**实现批注意（评审范围外 B 项）**：D-S5 英文旧句照抄替换前先核对 `methodology-template.md` 现状逐字存在——失配如实上报，不自作主张改写。

**受影响文件**：`docs/design/METHODOLOGY.md`（本节 + §代码结构正文 D-S1..D-S4 + D-S3b）、`METHODOLOGY.md`（两端根注入体——D-S1..D-S4 同步）、`src/prompts/methodology-template.md`（两端——D-S5）、`AGENTS.md`（thincoder/ + 工作区根——D-S7）、`.thincoder/advisor.md`（thincoder/ + 工作区根——D-S7）、`docs/TODO.md`（存量债登记——CLI 26 / VS Code 17 个 >500 测试文件——父侧交付时落）、测试（两端——T-S 系）。

**验收（AC-S）**：AC-S1 = T-S1..T-S3 绿（四载体锚全部落位、旧修辞零残留）；AC-S2 = T-S4 绿；AC-S3 = T-S5 绿 + 工作区根两文件豁免句零残留（父侧 grep 核销）。




## 设计侧结构规则执行挂钩（2026-09-07 · R24——快车道——用户裁定：清矛盾必须 + 拆分按本文档代码结构节规则执行（不写禁令）——round1 评审 0🔴 通过（token 05014a0a——7 项建议全采纳已落本节——复审发起权在用户））

> 板块：方法论设计规范（Design Documents 流程面）。状态：**已批准——实现批完成**（round2 复审 0🔴——token af959456——见变更记录末条）。触发：用户批评——设计批准了 chat.css 496 行（+30-60 布局改动必撞 500）评审未拦——"我们明明在文档里写了代码规则，为什么不按那个？"——实证：**为什么拆/档位判据已权威在本文档「代码结构：理解成本分层」（2026-09-05——用户裁定定量尺度——L68-110——封口 L82：档位不可协商——不是打折许可证）——缺的是设计流程执行面**。

**总体需求**：设计文档（受影响文件表）+ 设计评审按本文档代码结构节档位主动核查——超档（>300 advisory 审视 / >500 必拆）在设计落档时即标注拆分规划——不等到实现撞线。

**功能点**：
- **F-R24a（受影响文件行数标注——必填）**：设计文档「受影响文件」表对每个将修改的源/测试文件标注：`当前行数 + 预计增量`（预计 ≤±N 或"结构不变"）——超档判定按本文档档位表（文件档 >300 主动审视——>500 必须拆——**函数档为第一判据（评审 #4 补——本批将扩展 ≥300 单体函数即标注——判据"文件 ≤500 而内含 300+ 单体 = 仍未达标"）**——封口语义——无豁免通道）——满足即在该文件行内标注拆分规划（新文件/移出段——规划形态按 §20.9 Module Split Policy 方法——write-first/parity——**§20.9 现状实现批开工前核对（评审 #6）**）——**新建/迁移文件标"预计规模"（>500 不允许诞生——评审 #7）**。
- **F-R24b（评审维度）**：advisor design review 标准维度补一条：受影响文件行数标注核查（标注是否齐全 + 超档拆分规划是否在——标注数值抽查——含 ≥300 单体触及抽查——评审 #4）——**维度权威载体本批查明定名并列入受影响文件（评审 #1——先查后列改为本批内定名——单一权威源）**。
- **F-R24c（价值观矛盾清理——评审 #3 逐字锚）**：PHILOSOPHY.md 工具描述价值观表行（现"最小改动、关联问题不回避"残留）清理——**目标行逐字定稿：「价值观（正确性绝对优先、关联问题不回避）」（照 discipline.md 行枚举格式）**——与矛盾源（人生观"最小改变原则"反义句——非残留——**必须保留**）区分——实现批按句 grep 定位不按行号（评审 #5）。

**边界**：不新增任何"禁止/最小化"禁令句（用户裁定——规则已在——无需重复）；纯文档文件（.md）豁免标注；设计不触发拆分执行——只标注规划（拆分本身随实现批按 §20.9 执行）。

**验收（评审 #2 核销手段写明）**：AC-1 = 实现批交付后首个新设计批次的任一受影响文件表含行数标注（核销随该批评审记录——可当下关闭）；AC-2 = 两端 PHILOSOPHY grep「最小改动」零残留 + 目标行逐字锚在（VS 端父侧 grep 核销——仿 AC-S3 先例）；AC-3 = 实现批 diff 无"禁止最小改动"类新增条款（diff 扫描——模式 禁止/不得.*最小）；AC-4 = 注入体同步完成（根 METHODOLOGY.md 两端含本节——评审 #1）。；AC-5 = 载体文档（本批查明定名后）含"受影响文件行数标注核查"维度句（评审 #1 🟡——本批内 grep/审计核销——仿 AC-2/AC-3 手段——不等下一设计批次）；AC-1 限定"首个涉及源/测试文件的设计批次"（评审 #2 🔵——纯文档批次豁免）；AC-4 核销按内容锚（机制正文——书账留 docs——评审 #5 🔵）

**受影响文件（评审 #1 补——注入体同步）**：thincoder docs/design/METHODOLOGY.md（本节——设计规范正文）· **两端根注入体：thincoder/METHODOLOGY.md + thincoder-vscode/METHODOLOGY.md（同文同步——先落 docs 版→同步根注入体→评审维度载体——评审 #1）** · docs/design/PHILOSOPHY.md（:145 价值观行清理——按句定位）· thincoder-vscode/docs/design/PHILOSOPHY.md（同句清理——实现批先核对现状——失配上报）· **advisor 评审维度权威载体（本批查明定名——若 ADVISOR-CONVERGENCE.md 则列入——评审 #1）** · thincoder/docs/TODO.md（R24 行核销注）· docs/design/METHODOLOGY.md 变更记录。代码零改动（纯文档纪律批）。

### 变更记录
- 2026-09-07：R24 立项（用户连续批评——"改动最小化"讨厌/"文档写了代码规则为什么不按"/"这几天讨论的没进文档体系"/"专门说明为什么要拆的文档在哪"——实证澄清：为什么拆已权威在本文档代码结构节（2026-09-05）——真缺口 = PHILOSOPHY:145 矛盾残留 + 设计流程不执行档位——用户裁定：清矛盾必须 + 按方法论规则（不写禁令）——设计落本节。
- 2026-09-07：round1 评审 0🔴 通过（token 05014a0a）——7 项建议全采纳已落本节（①两端根注入体同步入受影响文件 + 同步顺序 + 维度载体本批定名 ②AC 核销手段写明（AC-1 可当下关闭/AC-2 双端 grep/AC-3 diff 扫描/AC-4 注入体） ③F-R24c 逐字锚定稿 + 反义句保护 ④函数档第一判据入 F-R24a/评审抽查 ⑤句锚不按行号 ⑥§20.9 开工核对 ⑦新建文件预计规模口径）——复审发起权在用户。
- 2026-09-07：round2 复审 0🔴（token af959456——终态 7 项修正 + AC-5 补入）——实现批完成：**F-R24c** 双端 PHILOSOPHY.md 工具描述价值观行清理（「最小改动、关联问题不回避」→「价值观（正确性绝对优先、关联问题不回避）」——逐字锚——人生观"最小改变原则"反义句未动）；**F-R24a** 机制正文入两端根注入体 METHODOLOGY.md（同文同步——131 行逐字核对）；**F-R24b** 维度权威载体查明定名 = docs/design/ADVISOR-CONVERGENCE.md（§6 先例同构）——§7 维度句已落——AC-2/3/4/5 实现批内核销（AC-3 新增条款模式 diff 扫描零命中）；AC-1 挂起（核销随首个涉及源/测试文件的设计批次）。TODO.md/CHANGELOG 行核销父侧落。
