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

## 需求池攒批工作流（2026-09-03 · 设计——用户裁定——待评审）

> **状态：设计（2026-09-03 用户指出——工程模式质量高但耗时——小需求点 eng-coder 单跑个把小时——固定流程成本（设计/评审/实现通读）被单点需求独扛——用户裁定 C+E 方向：攒批分摊流程成本）**。模板同批同步（`METHODOLOGY.md` 根模板——通用机制）。

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

### 提示词同步（实现批）

- `engineering.md` Mandatory Flow 加"需求入池"分流句（普通需求 → 池登记——非急不直接启动设计）+ "阈值提醒"句（两端 byte-identical + 内容断言）。
- main.md 普通模式不加（需求池是工程模式机制——但普通模式提需求的登记动作由 agent 纪律承担——见 METHODOLOGY 本文档——不落提示词）。

### 测试（实现批展开）

- 内容断言：engineering.md 含入池分流句 + 快车道例外句（fail-when-unchanged——两端）。
- 行为：登记流程（TODO 需求池组行格式）——人工抽查（无代码）。

### 受影响文件

- `docs/design/METHODOLOGY.md`（本节）+ 根模板 `METHODOLOGY.md`（同机制节——英文同构）+ **`src/prompts/methodology-template.md`（模板真身——15 文件对之一——CLI + VS Code 双端同改 byte-identical）** + `docs/TODO.md`（需求池组——初始化）+ 实现批：`src/prompts/engineering.md`（两端）+ 两端测试断言。


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
- [ ] （下一条待讨论）

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