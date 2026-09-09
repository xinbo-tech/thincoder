# 施工设计①——提示词文本迁移（PROMPT-SYSTEM-IMPL-TEXT）

> 归属：PROMPT-SYSTEM.md（需求/目标蓝图——已批准 2026-09-10）的施工设计。本档 = 迁移映射表 +
> 新文件全文定稿原则（字节源）。**eng-coder 按本档逐字落地，不自拟内容**。状态：**待评审/待批准**。

---

## 1. 迁移映射表（现文件逐节 → 新槽位文件）

判定依据：蓝图 §4 归属判定四问 + §2.5 内容大纲。**"废" = 内容不迁（被否决语义或重复）**。

### system.md（117 行）拆解

| 现节 | 内容 | 去向 |
|---|---|---|
| L1 身份宣言（ThinCoder coding agent）+ Language | 身份/语言 | **persona-normal.md**（普通人格）；语言纪律同时入 **common.md**（公共——两模式都要） |
| Who you are（人机协作原则） | 协作立场 | persona-normal.md（人格）+ common.md②（人机分工——两模式） |
| 最高纪律：确认与批准门（含豁免三条） | 批准门 | **common.md**③（公共——两模式逐句都要） |
| How you work — before you write any code（确认理解/合同/先定对再定小） | 协作纪律 | 先定对再定小 → common.md；实现相关细则 → discipline-normal.md |
| 文档先行 / 文档与计划纪律 | 文档纪律 | discipline-normal.md + discipline-engineering.md②（各自模式版） |
| 动手前如何工作（读档/查重/意图） | 写码前置 | discipline-normal.md① |
| How you work — while coding（并行/自检/模块拆分） | 写码执行 | discipline-normal.md① |
| 收尾前 / before claiming done（lint/verify/测试） | 交付纪律 | discipline-normal.md③ |
| Rules / When choices conflict | 决策冲突原则 | common.md④（诚实/取舍——公共） |

### engineering.md（277 行）二分

| 现节 | 去向 |
|---|---|
| Your Role: Designer, not Implementer + 核心纪律 + 发起权/推进档位（开关段 C1-C4） | **persona-engineering.md**（人格层全文——蓝图 §2.5 大纲①-④） |
| Mandatory Flow（step1-9）/ Work Loop / Token 生命周期 / Hard Rules | **discipline-engineering.md**（纪律层） |
| Delegation / Multi-Task / Questioning / Search Tool Priority | discipline-engineering.md（对应大纲④⑤⑥节） |

### 其余文件

| 现文件 | 去向 |
|---|---|
| discipline.md（84 行） | **discipline-normal.md**（改名+重排——内容主体即普通纪律） |
| main.md（91 行） | 废——主代理能力声明并入 persona-normal.md；会诊/飞刀/委派/收尾节并入 discipline-normal.md |
| engineering-sub.md（15 行） | 废（蓝图 §5 债#2）——eng-coder 特有句并入 persona-eng-coder.md |
| eng-coder.md → persona-eng-coder.md；explore/coder/plan.md → persona-{role}.md | 改名迁移（内容按蓝图 §2.5 大纲重写——旧文本语义保留、措辞按新大纲重组） |
| consult-base.md / advisor-design.md / advisor-round{1,2,3}.md | 不变（特殊模块——微调对齐） |
| methodology-template.md | 废（退役） |
| cwd METHODOLOGY.md（双仓） | 骨干分拣（蓝图 §2.5 分拣表）→ 零散并入各自 AGENTS.md 后删除 |

## 2. 新文件全文定稿原则（字节源）

1. 迁移内容**语义零改动**（句子的规则含义不变）；措辞按新大纲结构重组 + 编写纪律 14 条表达（短句/
   加粗/祈使/锚凸起）
2. **每个新文件头部**：一行注释 `<!-- slot:[N] consumers:[...] -->`（编写纪律 #13）
3. **锚句保护**：现 prompts-async-guidance 断言的锚句（A1-A4/开关段 C1-C4/核心纪律句族）迁移时
   **逐字随迁**（内容不变），断言重定位由施工③同步
4. **VSC 端**：同构落地——文本以 CLI 定稿为语义源，端特有段（R14 池规则等）原地保留（多实现面纪律）

## 3. 受影响文件（新增/修改/删除）

| 文件 | 操作 | 现行数 | 增量 |
|---|---|---|---|
| src/prompts/persona-engineering.md | 新增 | — | ~60 行 |
| src/prompts/persona-normal.md | 新增 | — | ~50 行 |
| src/prompts/persona-{role}.md ×4 | 新增（改名迁移） | 旧 10-20 | 各 ~15-25 行 |
| src/prompts/common.md | 新增 | — | ~45 行 |
| src/prompts/discipline-engineering.md | 新增 | — | ~150 行（承接 engineering.md 纪律节+METHODOLOGY 骨干） |
| src/prompts/discipline-normal.md | 新增（discipline.md 改名扩容） | 84 | ~110 行 |
| src/prompts/system.md / engineering.md / engineering-sub.md / main.md / discipline.md / methodology-template.md | 删除 | — | -733 行区 |
| AGENTS.md 模块图（双端） | 修改 | — | 提示词清单重写 |

（全部 .md——纯文档豁免行数标注档位核查；装配代码面见施工②。）

## 4. 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| 映射完整性 | 迁移映射表 vs 现 11 文件逐节 | 每节有去向（迁/废）——无静默丢句 |
| 锚句随迁 | A1-A4/开关段句族 grep | 新文件中逐字存在 |
| 语义零改 | 抽查 10 句规则句对照 | 含义不变（仅表达重排） |
| 头部注 | 每新文件 | slot/consumers 注释在 |

## 5. 验收

- AC-1 11 现文件全部处置（迁/废各有着落，报告逐文件去向）
- AC-2 14 新文件落地、蓝图 §2.5 大纲逐条覆盖
- AC-3 锚句族逐字随迁（施工③断言绿的前置）
- 红线：语义零改动；不自拟新规则内容；超出本表文件停下报告

## 变更记录
- 2026-09-10：落档（需求档批准后按 §6 边界开工——施工①文本迁移——归属=独立短档）。
