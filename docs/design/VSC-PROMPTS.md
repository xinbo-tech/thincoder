# VSC 提示词（VSC-PROMPTS）

> 板块：VSC 端提示词（src/prompts/ 全 15 文件——本端独立实现面）。权威关系：机制语义与重排方法
> 论源自 CLI 仓 `thincoder/docs/design/PROMPT-ATTENTION-RESTRUCTURE.md`（注意力 7 原则 + 阶段 A-D）
> 及其施工图 SPLIT-PLAN——**本端文本以本端原文为准**（多实现面纪律——byte-identical 已废——端特有
> 段各端保留）。状态：**现行形态已落地**（2026-09-09 批 1/批 2 交付——本档为板块归属补建——用户裁定
> VSC 端须有自己的提示词设计文档）。注入路径：`src/agent/setup.mjs` buildEngineeringPrompt 按角色拼装。

---

## 加载拼装机制（setup.mjs L315-334 + run-helpers.mjs loadEngineeringPrompt L43-63）

### 主会话（depth 0）

- **工程模式 on**：`SYSTEM_PROMPT(system.md)` + `engineering.md` + 项目根 `METHODOLOGY.md`（存在则
  以 `---\n\n## Project METHODOLOGY.md` 拼尾；缺失则注入 methodology-template.md 全文作参考——
  L55-58 missing 分支）。**main.md/discipline.md 不注入**（工程模式替换普通模式纪律块）。
- **普通模式**：`SYSTEM_PROMPT(system.md)` + `DISCIPLINE_RULES(discipline.md)` + `MAIN_OVERLAY(main.md)`
  （L326/L334——三件套）。engineering.md/METHODOLOGY 不注入。

### 子代理（depth > 0）

| 角色 | 拼装（L317-330） |
|---|---|
| eng-coder | eng-coder.md（overlay 顶层） + system.md + **engineering-sub.md**（L44 role 分支）+ 项目 METHODOLOGY.md（同主会话规则） |
| explore / coder / plan | 对应 .md（overlay） + system.md + discipline.md（非工程基底——L317 engPromptActive 仅 depth 0 或 eng-coder 为真） |
| consult | consult-base.md 单独基底（L322——不用 system.md） |
| advisor（评审） | 不走 setup 拼装——advisor/main.mjs 独立注入：advisor-design.md（设计评审 L83）或 advisor-round1/2/3.md（代码评审轮次 L72-78） |

### 降级链（L59-61）

engineering.md 模板缺失 → 仅 `[ENGINEERING MODE]` + METHODOLOGY.md；两者都缺 → engResult.prompt
为 null → 退回裸 system.md。templateMissing/methodologyMissing 随状态面提示（D-M1/D-M2 警告）。

## 现行形态（2026-09-09 注意力重排后）

### 主会话提示词（三文件——重排完成——含自动推进开关段）

| 文件 | 行数 | 骨架 | 开关段 |
|---|---|---|---|
| engineering.md | 280（10 节标题） | banner+Role → **Progress mode**（S2——开关段 C1）→ 核心纪律 → Mandatory Flow(step1-9) → Work Loop(状态表转条目+dispatch) → Token 生命周期 → Delegation → Multi-Task → Questioning → Search → Hard Rules | C1 顶层档位 + C2 step4 尾句 + C3 dispatch User stop 条 |
| main.md | 97（6 节） | 角色与责任 → **推进档位**（C4 语义对应段）→ 文档与计划纪律 → 委派 → 会诊 Consult → 飞刀 Escalate → 收尾验收 | C4（语义对应——非逐字） |
| system.md | 117（8 节） | 身份+语言 → **最高纪律：确认与批准门**（L10 批准门置顶）→ 文档先行 → 先定对再定小 → 动手前如何工作 → 收尾前 → Rules → 按任务型匹配 → 测试与交付 | C4 在确认门区内 |

### 子代理提示词（无开关段——子代理无用户可等）

engineering-sub(15) / coder(16) / eng-coder(20) / advisor-design(34) / advisor-round1/2/3(40/39/35) /
discipline(85) / methodology-template(39) / plan(10) / explore(13) / consult-base(18)——**未重排**
（形态仍为长行堆积——待后续批——PROMPT-ATTENTION 阶段 B 批 3-5 范围）。

## 端特有差异（本端独有——保留面）

| 差异 | 位置 | 说明 |
|---|---|---|
| §11.1 R14 池规则段 | engineering.md Multi-Task 节 | per-role-domain pools（4+4 + agent.poolLimits 覆盖）——CLI 无此段 |
| 端特有措辞 | main.md（consult 超回合 digest 句/escalate 异步句）、system.md（CRITICAL 行/中文日志位置细则） | 各端原文自持——不互抄 |
| CLI 独有句（本端无） | "Only a full user stop…terminates them"、verify 门句 | CLI 原文有——本端无——不添加 |

## 纪律（多实现面——METHODOLOGY §7 现行版）

- 各端独立实现语义同源——不加双端同步依赖；实现面互不追赶（乒乓已实证）；差异如实上报；
  端特有段各端保留（R14 等）。
- 语义锚断言：`test/prompts-async-guidance.test.mjs`（本端）fail-when-unchanged——重排后行号锚
  已改内容特征锚（阶段 D 完成时全量）；当前 4 红为阶段 D 计划内中间态。

## 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| 注入 | engineering 模式回合 | buildEngineeringPrompt 拼 engineering.md + methodology-template + discipline——280 行版注入 |
| 开关段生效 | 用户叫停（停/先别/别急） | manual 档——每步呈现等 go（Progress mode/推进档位段驱动） |
| 端特有保留 | 对照 CLI | R14 段仅本端有——不丢失 |
| 锚断言 | prompts-async-guidance 测试 | 阶段 D 后全绿（当前 4 红中间态） |

## 变更记录
- 2026-09-09：建档（用户裁定 VSC 端须有提示词设计文档——多实现面纪律下各端独立——本档承载本端
  15 文件现行形态 + 端特有差异 + 与 CLI 权威档的关系——批 1/批 2 已交付/批 3-5 待做如实记录）。
