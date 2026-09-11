> **变更史——正文冻结**（2026-09-10 文档重组批）：本档为一次实施批的过程记录或已被取代的旧权威档，
> 内容 as-of 交付时点，**不作为现状依据**。现状见 `docs/README.md` 地图指向的板块权威档。
>
> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分）**：本档对端（VSC）份已由 VSC 仓 `docs/design/_archive/PROMPT-IMPL-1-TEXT（VSC 仓）` 逐字承载（D10——零改写）；本档保留本仓份（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.4 归档面）。

# 施工设计①——提示词文本迁移（PROMPT-SYSTEM-IMPL-TEXT）

> 归属：PROMPT-SYSTEM.md（需求/目标蓝图——已批准 2026-09-10）的施工设计。本档 = 迁移映射表 +
> 新文件全文定稿原则（字节源）。**eng-coder 按本档逐字落地，不自拟内容**。状态：**待评审/待批准**。

---

## 1. 迁移映射表（现文件逐节 → 新槽位文件）

判定依据：蓝图 §4 归属判定四问 + §2.5 内容大纲。**"废" = 文件退役（内容逐行分流去向——非丢弃；
真正不迁的句子逐行标注——评审 #1 修正定义）**。**实现面边界（评审 #4——用户裁定 02:43 修订：
双端同批——CLI 定稿后 VSC 同批镜像落地，不再另批）**。

**槽位→文件总表（蓝图 §2.5 全量——评审 #2 口径）**：新文件集合 = **9 新增 + 5 特殊模块对齐 = 14**
（AC-2 口径对齐：14 = 槽位全量，非全新增）。

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
| cwd METHODOLOGY.md（双仓） | 骨干分拣（蓝图 §2.5 分拣表）→ 零散并入各自 AGENTS.md 后删除；**统一口径（评审 #6）：骨干→discipline-engineering.md；零散→AGENTS.md；细则=蓝图 §2.5 分拣表** |

## 2. 新文件全文定稿原则（字节源）

1. 迁移内容**语义零改动**（句子的规则含义不变）；措辞按新大纲结构重组 + 编写纪律 14 条表达（短句/
   加粗/祈使/锚凸起）
2. **每个新文件头部**：一行注释 `<!-- slot:[N] consumers:[...] -->`（编写纪律 #13）
3. **锚句保护**：现 prompts-async-guidance 断言的锚句（A1-A4/开关段 C1-C4/核心纪律句族）迁移时
   **逐字随迁**（内容不变），断言重定位由施工③同步
4. **VSC 端**：同构落地——文本以 CLI 定稿为语义源，端特有段（R14 池规则等）原地保留（多实现面纪律）

### VSC 端（双端同批——用户裁定 02:43 修订：不再另批）

VSC 提示词树（thincoder-vscode/src/prompts/ 同名 14 文件）同批镜像落地：文本以 CLI 定稿为语义源
（多实现面纪律——各端原文自持）；**端特有段原地保留**（R14 池规则段等——CLI 无此段的槽位，VSC 端
在该文件内保留原段）；VSC 旧文件（system/engineering/engineering-sub/main/discipline 等）同批退役。

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
| **VSC 同名镜像 14 文件（thincoder-vscode/src/prompts/）** | **同批镜像（评审 #4 修订：双端同批——新增/删除同上表，端特有段原地保留）** | 各端各自实测 | 同构 |
| cwd/METHODOLOGY.md（双仓） | **删除（评审 #3 补列）** | 145/142 | — |
| consult-base.md / advisor-design.md / advisor-round{1,2,3}.md | **对齐（评审 #3 补列——内容不变，槽位注/头部注释对齐）** | — | 微 |
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

- AC-1 11 现文件全部处置（迁/废各有着落，报告逐文件去向）——**多去向行句级切分按蓝图 §2.5 大纲
  子节标题为切分依据（评审 #7）；无去向句 → 停下报告（错误用例入用例表）**——**双端同批：VSC 镜像
  14 文件同步落地，端特有段原地保留（用户裁定 02:43）**
- AC-2 14 文件新集合落地（9 新增 + 5 特殊对齐——**口径对齐后可对账**，评审 #2）、蓝图 §2.5 大纲
  逐条覆盖——**双端各一套**
- AC-3 锚句族逐字随迁（施工③断言绿的前置）——**锚句全集 = prompts-async-guidance（含池内容断言
  三句）枚举的全部锚句，括号示例降级为示意（评审 #5）**
- 红线：语义零改动；不自拟新规则内容；超出本表文件停下报告

## 变更记录
- 2026-09-10：落档（需求档批准后按蓝图 §6 边界开工——施工①文本迁移——归属=独立短档）。
- 2026-09-10：评审 PASS + 8 项修订：①废=文件退役定义修正（内容逐行分流不丢弃）②14=9新增+5对齐
  口径对齐可对账 ③§3 补 METHODOLOGY 删除+特殊模块对齐行 ④实现面边界=CLI 权威面/VSC 镜像另批
  ⑤锚句全集枚举式定义（含池三句）⑥METHODOLOGY 去向统一口径 ⑦句级切分依据=蓝图大纲子节标题+错误
  用例补 ⑧文内 ID 与文件名统一为 PROMPT-IMPL-1-TEXT（施工族序号保留——先例）。
- 2026-09-10：**用户裁定修订（02:43）：双端同批**——VSC 提示词树同批镜像落地（推翻前条④另批）——
  §3 补 VSC 同名镜像 14 文件行，端特有段原地保留；AC-1/AC-2 双端记账。
