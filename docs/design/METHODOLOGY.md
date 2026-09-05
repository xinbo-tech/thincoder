# 方法论 — 如何与 AI Agent 协作编程

> 本文档是 ThinCoder 三观的实践延伸：三观回答"为什么"，方法论回答"怎么做"。

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

> **状态：方法论正文已落（本文件）。模板同步（`methodology-template.md` 英文节）待实践成功后再提炼——实践轮目标：runPanelChatImpl/两端 runAgent/buildToolCallbacks 按本节拆出骨干后，回填模板条目。**

**来源**：Dijkstra 结构化程序设计（局部推理——每段能作为单入口单出口黑盒独立理解）→ Parnas 模块分解（信息隐藏/决策边界——“模块是工作分配单元，不是子程序”）→ 认知复杂度研究（主要敌人是嵌套深度与分支密度，不是行数）→ 本项目实践教训（500 行只是红线，到 500 行说明已经很难理解——真正的判据在函数尺度）。代码读者有两个：下一个开发者，以及本项目特有的读者 agent——它把文件全量读进上下文，单体函数对模型的注意力是实打实的稀释。

### 基本尺度（定量）

**函数体（单体函数）——第一判据：**

| 行数 | 判定 |
|---|---|
| ≤50 | 好——通读无负担 |
| 50–100 | 正常——仍可整体理解 |
| ≥100 | **主动审视**：内部有无可命名的子段？有则拆出子函数 |
| ≥300 | **必须拆**：函数只留骨干（阶段调用序列），细节全部进子函数 |

**文件——兜底红线（既有，不变）：** >300 advisory 主动审视；>500 硬限。

**两者关系：先函数后文件。** 文件超标通常是“单体函数撑起来的”——按函数档拆完，文件自然回落；反过来只搬文件块不动单体（反面教训：只搬 31 行 payload 凑行数、430 行回合驱动器原封不动）是自欺。文件 ≤500 而内含 300+ 单体 = 仍未达标。

### 原则

1. **一个函数表达一个概念**——命名困难 = 职责过多。
2. **骨干—细节两层**：驱动器型函数（回合/循环/状态机）允许长，但只许长在**骨干**上——骨干 = 阶段调用序列 + 阶段间数据流；每阶段实现进子函数，细节可递归再分。判定：**去掉子函数实现，骨干仍能讲清“做什么”**。即使回合逻辑也不可能是几百个步骤堆在一起，必然有阶段划分（分流/装配/执行/收尾）。
3. **子函数提取判据**：连续一段能命名（阶段名、意图名）且闭包状态可参数化 → 提取；状态纠缠过深就先重组数据再提。
4. **模块边界围住决策（Parnas）**——按会独立变化的设计决策 / 可独立测试的单位切，不按执行步骤、不按行数切。
5. **控制流局部化**——guard clause / early return 是正道；嵌套 ≤3 层；不要在相隔数百行处配对控制流（回调与调用点分离过远时应重组）。
6. **状态机显式化**——迁移集中一处、事件按状态分组；不做行数切片，做状态分层。
7. **注释与决策同行**——决策注释（§锚点/为什么）是信息主体；抽取时注释跟决策走，不为行数删注释、不压行（反面教训）。
8. **双端 parity**——CLI/VS 镜像结构，拆分两端同步，锚跟代码走。

### 动手自检

- 拆前四问：这段不读完整段讲不清它干什么？它叫得出名吗？边界按决策还是按步骤？注释/决策跟走了吗？
- 拆后两验：骨干可独立复述；行为零变（verbatim 或闭包参数化 + 全量回归，断言数不减）。

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
- [ ] （下一条待讨论：代码结构分层章节已落——见上文 2026-09-05 节）

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
