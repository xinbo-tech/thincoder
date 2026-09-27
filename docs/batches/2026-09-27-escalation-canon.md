# 2026-09-27 · escalation-canon
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 用户 2026-09-27 12:02 / 12:05 / 12:08 裁定链 + 12:12「立」点火；台账 #442。
> 台账 = #442（子代理上抛正典重写 + 单源化 · 在途）。前情 = docs/batches/2026-09-25-conflict-escalation-bound.md §6（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批次目标**：子代理「冲突 / 裁定上抛」**正典重写 + 单源化**——「无用户可等」句族（实测 18 处重复 · 三变体）重写为**正向正典**（父代理 = 子代理的用户；问就发、不停等；禁的只是确认型提问）+ 全副本删除（单源载体设计轮定）+ **文档矛盾半句并入** + 探针复测验收；**零机检增量**。

**来源（用户裁定链 2026-09-27）**：12:02「七处重复是个问题，以后保证不了一致。」（实测 = 9 处/面 × 双面 = 18 处）· 12:05「不要那么多机检锁。」· 12:08「为什么要这么设置？主代理就是子代理的用户，你这一句就压死了模型本能中的上抛意愿。」· 12:12「立，另外，文档面要补的那一小句也进去吧？」= 点火 + 并入文档矛盾半句。

**现行句出身（考据）**：① 2026-09-17 两次收正（`requirements/PROMPT-SYSTEM.md:80-81`）= 确认门归主会话人格层、「无用户可等」句归各子代理档（原义 = 确认已在上游行使、不继承确认门）；② `question-tool-filter` 批 = 无交互通道（`question` 工具对子代机械排除）；③ `design/PROMPT-SYSTEM.md:228` + 编写纪律 #10「关键锚点重复」= 重复原为设计特性（本地出口边界就近）。

**用户判断成立（三项证据）**：① 同段自相对（`persona-coder.md:5` / `persona-explore.md:6`：同 bullet 前「所有用户消息来自父代理——把父代理当你的调用方」后「无用户可等」）；② 上抛面窄于通道面（persona 仅「冲突」一类例外 ⊂ `common.md` 四类决策级问题 + 双条件）；③ #293 实况 = 欠问才是病（修前 0.33/0.56 · 66 回合零上抛），修法却以「基础句打例外补丁」实现 ⇒ 默认重心与所需行为相反（撞 2026-09-25 06:22 满量裁定）。

**定稿范围（本批做）**：

- **① 正典重写（双面逐字 · 设计轮落字）**：两轴分离——机械面**保留**（不停轮等答 / 不以「等待批准」收尾 / 确认型请求不发〔授权已在上游行使〕）；职责面**正转**（父代理 = 子代理的用户 / 调用方：决策级问题**就发** `notify_parent`〔即发即走、继续干不受影响部分〕；四类与 common 取齐；**冲突类必发、不得拖终报**）；校准句 = 「**禁的是「确认型提问」，不是「决策型提问」**」。
- **② 单源化**：18 处副本全删（5 档/面 × 9 处，含 plan 两变体与 designer 预算变体）；载体 = 设计轮定（候选 = 新建子代理专用层，装配全部子代理角色）——**硬约束：2026-09-17 裁定「主 / 子差异不属公共层」⇒ 正典不得作为全员内容进 `common.md`**。
- **③ 文档矛盾半句（用户 12:12 点名并入）**：`common.md` 上行通道 in-scope 列表补「两处文档（需求 / 设计 / 批次档）对同一机制描述不同 ⇒ **同判冲突**：摆双方 `file:line` + 倾向，不得自行择一实现」（双面同步——把「文档矛盾」从语义映射变字面归类）。
- **④ 随动面收正**（设计轮逐处枚举 · 口径以新正典为准）：`design/PROMPT-SYSTEM.md:228`（编写纪律 #10 引述句）· `requirements/PROMPT-SYSTEM.md` · `ENGINEERING-MODE-V2.md:388` 等。
- **⑤ 验收**：矛盾上抛探针复测（#294 基建 · 一次性实跑 · 非常驻闸），判据 = **上抛率只升不降**（修后 0.67/0.78 参照）+ **静默自选族保持 0**。

**边界（不做）**：**零机检增量**（不加守卫腿 / 断言族 / 新纪律条文——承 2026-09-17「无限机检反感」裁定 · `ENGINEERING-MODE-V2.md` §8.3）；`common.md` 除 in-scope 补条外两界零动；`question` 工具面零动；探针基建零改；既有锁（refs-zero / dual-source）原样。

**台账**：#442 → 本批。**前情** = `docs/batches/2026-09-25-conflict-escalation-bound.md`（#293 修法 · 已收口）。

**§1 补记（父侧 · 2026-09-27 12:18 · 边界放口一处 + 口径确认）**：设计轮实读发现——`common.md:46`（CN）/ `:52`（EN）「父不是用户：它不确认任何事，也可能正忙」与新正典「父代理 = 你的用户 / 调用方」在同一装配链正面相抵（本批边界原写「common 除 in-scope 补条外零动」）⇒ **放开该句**：按「确认权威轴」**最小收正**（仅此一句 · 双面 · 最小改；紧邻正向半句保不动），收正后两轴分离读法自洽（对话端 = 父代理 ✓ · 确认权 = 不在父代理、已在上游行使 ✓）；正典「确认型请求不发」与收正句保持同义（两处不生新变体）。另确认：新增子代理层的 **6 处既有枚举同步 = D3 维护**（计数与列表同改）**非机检增量**——refs-zero / dual-source 零新断言、零新用例。

**§1 补记（父侧 · 2026-09-27 12:54 · 修正轮 2 域外观察两条裁定）**：① `thincoder-cli/test/prompts-async-guidance.test.mjs:29` / `:45` 计数字面（「新 15 文件全集」/「新 15 件在位于 prompts 树」）与 (d)「NEW_PROMPTS 列表本批零动」的同步时序张力 ⇒ **裁定：(d) 优先**——两串与 15 名列表一并零动、随列表下次触碰同改（披露在册）；② `docs/core/requirements/CORE-UNIFICATION.md:118`（N5「槽位 15 + 工具描述 24」）与 `:117` 同款表述 ⇒ **裁定：并入需求档收正组**（与 `:19` / `:117` / `:164` 同批 · 主 agent 笔 · 收口前置）。

**§1 补记（父侧 · 2026-09-27 12:56 · 工程工具面路由）**：F7 行 7 / §2.6(b) 脚本族（`thincoder-vscode/scripts/check-vsix.mjs`——`)`scripts/**`）按既有路由（工程工具面 = 父侧直改 · 不进 eng-coder files 域——spawn 域校验拒收）**改由父侧落**（实施后：机械变更 + 实跑报读数）；eng-coder 实施域为该档之外全部条目。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-09-27（本批 ①–⑤ 全落（正典双面逐字 · 载体 subagent-base.md · 删除清单 18 处 · common 两处/面 · 随动面逐处 · 探针口径）；修正轮 1（评审 #80 · F1–F12）逐条落 §2.12；修正轮 2（评审 #82 · F13–F19）逐条落 §2.13（排期收口前置见 §2.13-F16）；设计面收正轮（F16② · 收口前置）落 §2.14；上抛项见 §2.11）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 本批条目（覆盖）与设计落点

**本批条目（覆盖）**——逐条回指 §1 定稿范围 ①–⑤（本批条目 = 需求条目 = 验收回指，三链同源）：

| # | 条目 | 覆盖形态 | 验收回指 |
|---|---|---|---|
| A1 | 正典重写（双面逐字 · 两轴分离 · 正向化） | 新层 `subagent-base.md` 双面逐字定稿（§2.2）+ 18 处副本删除（§2.4） | AC-1 / AC-2 |
| A2 | 单源化载体定形（实读装配表核可行性） | 新层文件 + 头注 + 装配点 + 双面落位（§2.1）；5 子代理场景末位装配 | AC-1 / AC-4 |
| A3 | 文档矛盾半句（in-scope 补条 · 双面） | `common.md` 双面「可问 / In scope」列项追加（§2.5 逐字） | AC-3 |
| A4 | 随动面收正（逐处枚举） | 设计档 / 需求档 / 计数语句 / 机检枚举（§2.6） | AC-4 / AC-5 / AC-6 |
| A5 | 探针复测验收口径 | 复用 #294 基建 · 一次性实跑（§2.7） | AC-7 |

**不在本批（边界 · 承 §1）**：零机检增量（不加守卫腿 / 断言族 / 新纪律条文）· 不新增节（`##` 块计数守恒）· `question` 工具面零动 · 探针基建零改 · 既有锁（refs-zero / dual-source）原样 · 产品代码（提示词面 + 装配表外）零触 · 不新增 / 不删测试用例。

**设计落点**：一次性材料（逐字草案 / 删除清单 / 受影响面）住本段（§2——承 #293 KD-6 先例，D2）；机制面（槽位模型 / 装配矩阵 / 现状坐标）的长期档收正落 `docs/core/design/PROMPT-SYSTEM.md`（§1 计数 / §6.1 / §6.2 / §6.5 / §6.7 / 变更记录——见 §2.6 随动面表）。**需求档笔权 = 主 agent**（§2.6 只列坐标与建议文本）。

### 2.1 单源化载体定形（实读装配表核可行性 · as-of 2026-09-27）

**实读依据（装配表 = `thincoder-core/prompt-overlays.mjs` 现盘 78 行）**：`SLOT_CONTENTS`（`:14-25`）静态表 10 键；`SCENARIO_SLOT_FILES`（`:40-49`）八场景：`engineering` / `normal` = persona + common + discipline（三件）；`eng-coder` / `eng-designer` = persona-{role} + common + discipline-engineering；`explore` / `coder` / `plan` = persona-{role} + common + discipline-normal；`consult` = null（自含基底）。

**既有层覆盖裁决（「某既有层天然属子代理」逐层核）**：所需消费面 = **全部 5 个子代理场景**（eng-coder / eng-designer / explore / coder / plan），且**主链两场景（engineering / normal）不得含**（2026-09-17 裁定：主 / 子差异不属共用内容）。
覆盖集实核：`common.md` = 2 主链 + 5 子代理（含主链 ⇒ 出局，承 §1 硬约束）；`discipline-engineering.md` = engineering + eng-coder + eng-designer（含主链 ⇒ 出局）；`discipline-normal.md` = normal + explore + coder + plan（含主链 ⇒ 出局）；`persona-*` 各 1 场景（角色面，出局）；`consult-base.md` = consult 专用（出局）。
⇒ **无既有层覆盖「恰 5 子代理场景」= 空集**（5 子代理交集 = common ∩ 双纪律 ∪ 角色人格；唯一覆盖全部子代理者 = common，而 common 含主链）。**结论：新建子代理专用层是唯一可行载体**。

**载体定形（决定性）**：

| 项 | 定形 |
|---|---|
| 文件 | **`subagent-base.md`** —— 中文正本 `docs/core/design/prompts/subagent-base.md` ∥ 英文运行面 `thincoder-core/prompts/subagent-base.md`（两界双面 · 中英非同字面 · 逐面独立） |
| 头注 | CN `<!-- 槽位:[4] 消费方:[全部子代理角色——eng-coder / eng-designer / explore / coder / plan] -->` · EN `<!-- slot:[4] consumers:[all subagent roles — eng-coder / eng-designer / explore / coder / plan] -->`（槽位号 [4]：承 [1] 人格 / [2] 公共 / [3] 纪律；尾块 AGENTS/skills 非槽位文件、去数字标注） |
| 装配点 | `thincoder-core/prompt-overlays.mjs`——`SLOT_CONTENTS` +1 键（`:14-25`）；`SCENARIO_SLOT_FILES` 5 行各 +1 项、**置于行末**（序 = persona → common → discipline → subagent-base；recency 位）；两主链场景 + consult **零变** |
| 命名取舍 | 否决 `subagent-common.md`（与 `common.md` 成子串包含——grep/工具面歧义）· 否决 `subagent-upstream.md`（只覆盖上抛一轴；本层为「子代理专用内容之家」，按受众命名方可续长）· 先例 = `consult-base.md`（受众名 + base） |

**实读的连带（可行性硬约束 · 逐处）**：新文件落 `thincoder-core/prompts/` 与装配表改行 ⇒ **机械触发 6 处既有枚举锁**（文件集 / 装配矩阵行）——属 D3「计数与列表同改」，**零新增断言、零新增用例、零锁标准变化**；逐处清单 = §2.6 机器检面表。refs-zero（T9）与 dual-source（T-CL1）两锁**零动**：前者域按目录自动扩含新档（内容须自带零文档引用）、后者 `##` 块计数仍 14（补条 = 既有节内列项）。

### 2.2 正典逐字（`subagent-base.md` · 双面 · 实现 = 逐字落地不改字）

**语义三件核（缺一不可）**：① 机械面三件（不停轮等答 / 不以「等待批准」收尾 / 确认型请求不发〔授权已在上游行使〕）；② 职责面正转（父代理 = 你的用户：决策级问题就发 `notify_parent`〔即发即走〕；四类与 common 取齐；冲突类必发、不得拖终报）；③ 校准句（禁的是「确认型提问」，不是「决策型提问」）。

**中文正本（`docs/core/design/prompts/subagent-base.md` 全档逐字）：**

```markdown
<!-- 槽位:[4] 消费方:[全部子代理角色——eng-coder / eng-designer / explore / coder / plan] -->

## 你与父代理（子代理专用）

你是子代理：**父代理就是你的用户**——你所有面向用户的动作，对象都是它。
它不替你点头（不确认任何事，也可能正忙）——所以确认型请求不发；**但决策级问题正是它要的**。

- **不停轮等答复、不以「等待批准」结束回合、不发确认型请求**——确认型 = 要它点头你才继续那种。
  **禁的是「确认型提问」，不是「决策型提问」**——这两件事必须分开。
- **决策级问题就发**：答案会改变你的下一步、而材料里查不到 ⇒ 立即发 `notify_parent`（`ask`）——
  一句话摆出问题 + 你的倾向；**即发即走**：不受影响的部分继续做，受影响部分标 pending 直到答复到达。
- **决策级 = 四类**：① 写明的前提与实况冲突；② 两处要求互斥且你不可自行裁；③ 待做之事是否在任务域内；④ 继续当前路线会作废已完成的工作。
- **冲突类必发、不得拖终报**：两处要求互斥 ⇒ 立即发 `ask`——不得自选一方解套、不得继续权衡、不得拖到最终报告。
```

**英文运行面（`thincoder-core/prompts/subagent-base.md` 全档逐字）：**

```markdown
<!-- slot:[4] consumers:[all subagent roles — eng-coder / eng-designer / explore / coder / plan] -->

## You and the parent agent (subagent-only)

You are a subagent: **the parent agent IS your user** — every user-facing move you make is addressed to it.
It will not nod for you (it cannot confirm anything, and it may be busy) — so never send a confirmation request; **but decision-grade questions are exactly what it wants**.

- **Never idle-wait for an answer, never end your turn "waiting for approval", never send a confirmation request** — a confirmation request asks it to approve before you go on.
  **What is banned is the confirmation-type question, not the decision-type question** — keep the two apart.
- **Send decision-grade questions**: the answer changes your next step and the materials cannot supply it ⇒ send `notify_parent` (`ask`) at once —
  one line with the question and your leaning; **send-and-go**: keep working on the unaffected parts; mark the affected part pending until the reply arrives.
- **Decision-grade = four classes**: ① a stated premise the facts contradict; ② two requirements that conflict and you cannot arbitrate; ③ whether the action is inside your task domain; ④ a choice that would waste work already done.
- **The conflict class must be sent, never deferred to the final report**: two requirements in conflict ⇒ send an `ask` at once — never settle it by picking a side, never keep weighing, never park it for the final report.
```

**逐句对照（三件核落位）**：机械面三件 = 第 2 段 + 列 1（「不确认任何事」同时承接既有公共层「父不是用户」句的**唯一真值面**——见 §2.8 上抛 1）；职责面 = 第 1 段（父代理 = 你的用户）+ 列 2（就发 · 即发即走）+ 列 3（四类）+ 列 4（冲突必发）；校准句 = 列 1 次句（逐字）。**prompt 面纪律自查**：零档名 / 零节号 / 零日期批号（J1/J2/J3 / 维护者注反证预清）；句子自足、无指路句；行宽 CN ≤ 140 / EN ≤ 240（< 300）。

### 2.3 正典修订（承父侧 2026-09-27 12:18 裁定① · 取代 §2.2 正文头两段）

**裁定**：取备选 (b)——**放开 `common.md` 该句**（§1 边界放口一处，补记已在 §1）：`common.md:46`(CN)/`:52`(EN)「父不是用户」句按**确认权威轴**最小收正（逐字 = §2.5 甲），桥接案 (a) 不作主案。⇒ 正典头两段随之收正为**两轴分离读法**（对话端 = 父代理 / 确认权 = 不在父代理、已在上游行使），且措辞与收正后的 common 句**同轴同词**（不生新变体）。§2.2 其余各段（列 1–列 4）**零变**。

**中文正本头两段（新逐字 · 取代 §2.2 中文块第 5–6 行）：**

```markdown
你是子代理：**父代理就是你的用户**——你所有面向用户的动作，对象都是它；授权已在上游行使。
它**不是确认门**（不能代任何事点头，也可能正忙）——所以确认型请求不发；**但决策级问题正是它要的**。
```

**英文运行面头两段（新逐字 · 取代 §2.2 英文块第 5–6 行）：**

```markdown
You are a subagent: **the parent agent IS your user** — every user-facing move you make is addressed to it; the authorization has already been exercised upstream.
It is **not a confirmation gate** (it cannot approve anything, and it may be busy) — so never send a confirmation request; **but decision-grade questions are exactly what it wants**.
```

**同轴核对（正典 ↔ common 收正句）**：确认门 / 不能代任何事点头 / 也可能正忙 三词逐词同轴（EN：confirmation gate / cannot approve anything / may be busy）⇒ 两处同义、零新变体 ✓（裁定②句）。**校准句与三件核仍全**（列 1 = 机械面三件 + 校准句；列 2–4 = 职责面正转）✓。

### 2.4 副本删除清单（18 处 · 5 档 × 双面 × 9 处 · 逐处坐标）

**口径**：① 整 bullet / 整块 = 行删除（不留空行，段内其余行顺序不变）；② 行内删除 = 只删族句、保留本地承载（designer 回合预算 / plan 歧义注明）；③ 删除后**不得留下任何族句残片**（「无用户可等 / 不是用户可等 / 不需要用户可等 / 等待批准 / 歧义进（最终报告|计划）/ 冲突类除外」形态零命中——双面域 `docs/core/design/prompts/**` + `thincoder-core/prompts/**` 含新档）；④ 行号 = as-of 2026-09-27 实读。

| # | 档（双面） | CN 坐标 | EN 坐标 | 处置 | 行数 Δ（双面各档） |
|---|---|---|---|---|---|
| 1 | `persona-eng-coder` | `:6` | `:6` | **整 bullet 删除**（纯族句） | CN 42 → 38 · EN 42 → 38 |
| 2 | `persona-eng-coder` | `:20-22` | `:19-21` | **整块三行删除**（「你是子代理…（此条覆写 common 确认门）」覆写块——覆写对象随正典 + common 收正后消失；EN 侧该块含中文括注，随删清零） | 同上 |
| 3 | `persona-coder` | `:5` | `:7` | **整 bullet 删除**（含「所有用户消息来自父代理——把父代理当你的调用方」= 正典第 1 段已承） | CN 19 → 18 · EN 22 → 21 |
| 4 | `persona-eng-designer` | `:7` | `:7` | **整 bullet 删除** | CN 81 → 80 · EN 81 → 80 |
| 5 | `persona-eng-designer` | `:36` | `:36` | **行内删族尾句**（保留回合预算正文）——新行尾 = 「…**与既有「勘察预算 ≤6 次 explore spawn / 批」并列记账、不替换**。」（EN 同位同删） | 同上 |
| 6 | `persona-explore` | `:6` | `:6` | **整 bullet 删除**（含「不向最终用户提问」括注） | CN 16 → 15 · EN 16 → 15 |
| 7 | `persona-plan` | `:6` | `:7` | **整 bullet 删除** | CN 27 → 26 · EN 28 → 27 |
| 8 | `persona-plan` | `:10` | `:11` | **族句删除 + 本地承载保留** ⇒ 新全行 = `- 有歧义就在计划里注明。`（EN：`- If something is ambiguous, note it in your plan.`） | 同上 |
| 9 | `persona-plan` | `:26` | `:27` | 同 8 ⇒ 新全行 = `- 有歧义就在计划里注明。`（EN：`- If something is ambiguous, note it in the plan.`） | 同上 |

**计划档保留句的判记（#8/#9）**：「有歧义就在计划里注明」= **本地交付语义**（非族句）——「向谁问」的通道语义已由正典第 1 段 + 公共层滤网全覆盖（子代理无最终用户可问；决策级问题走 `notify_parent`）⇒ 「不问最终用户」支随族句一并删除、本地承载留存，防**能力净损**（单源化 ≠ 减内容）。**明细**：18 处 = 主射程档（eng-designer 2 + common 旁证）+ 同族五档（eng-coder 2 / coder 1 / designer 2 / explore 1 / plan 3 = 9 处/面）× 2 面 ✓（回指 §1「5 档/面 × 9 处，含 plan 两变体与 designer 预算变体」）。
**族句删除后的通道覆盖核**（不缩权）：决策级四类 ⇒ 正典列 2–4 就发；非决策级 ⇒ 公共层滤网「否则自己定，并把该判断写进报告」；冲突类 ⇒ 正典列 4 必发 ✓。

### 2.5 `common.md` 双面逐字（承 §1 ③ + 裁定① · 两处/面 · 逐字落地不改字）

**（甲）确认权威轴收正句（承裁定① · 最小改 · 仅此一句 · 紧邻上句保不动）**

- CN `docs/core/design/prompts/common.md:46` —— 现文：`父不是用户：它不确认任何事，也可能正忙。`
  ⇒ **新文：`父不是确认门：它不能代任何事点头，也可能正忙。`**
- EN `thincoder-core/prompts/common.md:52` —— 现文：`The parent is not a user: it cannot confirm anything and it may be busy.`
  ⇒ **新文：`The parent is not a confirmation gate: it cannot approve anything, and it may be busy.`**
- 上句（通道句「子代理有一条向父（spawn 方）发「决策级问题」的通道——`notify_parent` 工具」/ EN `A subagent has a channel to its parent for decision-grade questions — the notify_parent tool.`）**零动**✓；本句与正典第 2 段同轴同词（确认门 / 不能代任何事点头 / 也可能正忙）⇒ 两处零新变体 ✓（裁定①）。

**（乙）in-scope 补条（承 §1 ③ · 用户 12:12 点名 · 既有节内列项追加）**

- CN `:51` **新全行**：`- **可问**：写明的前提与实况冲突；两处要求互斥且你不可自行裁；待做之事是否在任务域内；继续当前路线会作废已完成的工作；两处文档（需求 / 设计 / 批次档）对同一机制描述不同 ⇒ **同判冲突**：摆双方 \`file:line\` + 倾向，不得自行择一实现。`
- EN `:57-58` **新全行**：`- **In scope**: a stated premise the facts contradict; two requirements that conflict and you cannot arbitrate; whether an action is inside your task domain; a choice that would waste work already done; **two documents (requirements / design / batch record) describing the same mechanism differently ⇒ judged the same as a conflict**: lay out both sides' \`file:line\` + your leaning; never pick one and implement it yourself.`
- 判据：`##` 块计数不变（T-CL1 = 14 守恒）；句子自足（「需求 / 设计 / 批次档」= 文档类别词，非档名 / 节号 / 指路句 ⇒ 三式零命中）；与正典列 4 同向（冲突类必发）✓。

### 2.6 受影响文件与随动面（逐处 · 行数 = 本席实读 as-of 2026-09-27；标 ※ 者以实施轮开工现盘复读为准）

**（a）实施面（逐字落地 · 提示词双面 + 装配表）**

| 文件 | 现读数 | 变更 | 面 |
|---|---|---|---|
| `docs/core/design/prompts/subagent-base.md` | 0（新档） | +14（§2.2 中文块 + §2.3 修订头两段） | 中文正本 |
| `thincoder-core/prompts/subagent-base.md` | 0（新档） | +14（英文块同构） | 英文运行面 |
| `docs/core/design/prompts/common.md` | 124 | **±0**（`:46` 行内收正 + `:51` 行内追加） | 中文正本 |
| `thincoder-core/prompts/common.md` | 164※ | **±0**（`:52` 行内收正 + `:57-58` 行内追加） | 英文运行面 |
| CN persona ×5（eng-coder / coder / eng-designer / explore / plan） | 42 / 19 / 81 / 16 / 27 | **−3 / −1 / −1 / −1 / −1**（§2.4 表） | 中文正本 |
| EN persona ×5（同名） | 42 / 22 / 81 / 16 / 28 | **−3 / −1 / −1 / −1 / −1**（§2.4 表） | 英文运行面 |
| `thincoder-core/prompt-overlays.mjs` | 78 | **+1**（`SLOT_CONTENTS` 键）+ 行内（5 场景行 / 头注槽模型句） | 装配面（产品代码） |

**（b）机检枚举同步（6 处 · **D3 维护 · 非机检增量** · 承裁定② · 零新断言 / 零新用例）**

| # | 文件:行 | 现判据 | 同步后 |
|---|---|---|---|
| 1 | `thincoder-core/test/prompt-files.test.mjs:23-39` | `SLOT_PROMPTS` 15 名集 + `readdirSync` 相等 | 16 名集（+`subagent-base.md`） |
| 2 | `thincoder-cli/test/prompts-async-guidance.test.mjs:65-69` | 5 子代理行 `deepStrictEqual` 三件 | 各行末 +`"subagent-base.md"`（四件） |
| 3 | `thincoder-cli/test/eng-designer-role.test.mjs:120` | eng-designer 行三件 | 四件（末位 +） |
| 4 | `thincoder-vscode/test/prompts-mirror-anchors.test.mjs:41-44` | 核包 15 + 归档镜像 15 + `deepStrictEqual(mirror, mdSetCore())` | 核包 **16**；**归档镜像冻结于 15**（裁定 B 参照历史）⇒ 等式判据拆两判：①核包 = 16 · ②镜像 15 名 ⊆ 核包名集——**本批唯一「判据形态需改」处**（强度等价保留 · 方向按冻结事实收正） |
| 5 | `thincoder-vscode/test/prompts-async-guidance.test.mjs:87-90` | 5 子代理行三件 | 四件（各行末 +） |
| 6 | `thincoder-vscode/test/eng-designer-role.test.mjs:131` | eng-designer 行三件 | 四件（末位 +） |

**（c）随动面（逐处 · 笔权分列）**

- **设计档面（笔 = eng-designer）**：`docs/core/design/PROMPT-SYSTEM.md`——`:21` / `:157` / `:189` / `:190` / `:319` 计数 15 → **16** ✓ · §6.2 装配实现事实（5 子代理行第四槽 + 头注槽模型句）· §6.7「不可裁决」节**按新正典口径收正**（「无用户可等句」指称退场——落点句改指新层 · 同族限定句同步）· 变更记录 +1 行；`docs/core/design/ARCHITECTURE.md:41/:61` · `docs/core/design/DOC-SYSTEM.md:99/:131/:157` · `docs/core/design/TWO-REPO-MERGE.md:90`（计数语句 15 → 16）；`docs/core/design/TOOLS.md:856`（question 工具面「子代无用户可等、不向最终用户提问」句 ⇒ 按新口径收正为「子代理的上行通道 = 正典层 / 提问对象 = 父代理」）。
- **需求档面（笔 = 主 agent · 本设计只列不动）**：`docs/core/requirements/PROMPT-SYSTEM.md`——`:72` §2.3 行 8（上行通道行——补「文档矛盾同判冲突」半句）· `:46`（「子代理无此通道（仍「无用户可等」）」⇒ 指称退场、建议收正）· `:80-81`（2026-09-17 两条收正注记——**增一行本批收正注记**，史实行不回改）；`docs/core/requirements/ENGINEERING-MODE-V2.md:388`（「子代理：任务已由父代理确认，无用户可等——…」⇒ 与新正典同义收正——**本批点名随动面**）；`docs/core/requirements/CORE-UNIFICATION.md:19/:117`（A7 / N4 的「15 档」句——如判为现态语句则随批收正）。
- **脚本 / 发布面（engineering-tools）**：`thincoder-vscode/scripts/check-vsix.mjs:9-10/:32`（`EXPECT = { prompts: 15 }` ⇒ 16；头注两处同步）——**父侧直笔或实施轮同带**（`scripts/**` 面）。
- **产品文本面（如含档数句 ⇒ 全流程）**：`thincoder-core/README.md` / 两包 `AGENTS.md` / `CHANGELOG.md`（`thincoder-core/CHANGELOG.md:13` 有「`prompts/` 15 档」句——.thincoder/tmp 产物面另有同形档，非本仓活档）——实施轮按 `grep -rn "15 档"` 一次性枚举（**非锁 · 一次性复核**）逐处收正；已知命中已列于本表。
- **零动面**：refs-zero（T9 · `thincoder-cli/test/prompt-refs-zero.test.mjs`）· dual-source（`thincoder-cli/test/prompts-dual-source.test.mjs` NEW_PROMPTS 列表——仅 `.includes` 用、无全集断言 ⇒ 零改仍绿；D3 口径差 = 已知残留，随下次触碰该档收正）· `thincoder-cli/test/prompt-injections-cli.test.mjs` · `thincoder-core/test/prompt-injections.test.mjs`（锚名集 2 锚不变）· `bench/probe/**`（`PROMPT_SLOTS` 取装配矩阵单源 ⇒ 自动含第四槽；`promptsDigest` 读值随内容变化 = 读数非断言）· `question` 工具面 · 探针基建。

**（d）机检面（实施轮收尾全跑 · 判据 = 净增 0 + 三包全绿）**：`cd thincoder-core && npm test` / `cd thincoder-cli && npm test` / `cd thincoder-vscode && npm test`（例数守恒：**零新增 / 零删除用例**；§2.6(b) 6 处为既有用例的枚举值同步）· `node scripts/doc-check.mjs`（仓根；基线 = 悬空 48 / 行宽 22——本席设计轮实测，见 §2.9；判据 = **前后逐值相同 + 本批触碰档 0 命中**）· 一次性在场核 = §2.2/§2.3/§2.4/§2.5 逐字 0 diff（**非断言**）。

### 2.7 探针复测验收口径（承 §1 ⑤ · 复用 #294 基建 · 一次性实跑 · 非常驻闸）

- **基建零改**：`bench/probe/**`（驱动 / 夹具 / 判据 / 停止条件 / 落档面）+ `bench/test/probe*.test.mjs` **逐档零触**（承 §1「探针基建零改」）；`PROMPT_SLOTS` 取 `SCENARIO_SLOT_FILES["eng-designer"]` 单源 ⇒ 自动含第四槽（`promptsDigest` 读值随内容变 = 读数，非断言）。
- **口径沿 #293 复测轮**（`docs/batches/2026-09-25-conflict-escalation-bound.md` 实弹轮）：夹具族（`p1` 要求互斥 / `p2` 任务书与设计档相抵 / `p3` 范围相抵）· 模型名单 · 停止条件 / 判据 / 聚合分母口径 —— **逐项沿用，不新增族、不改夹具、不改判据**。
- **判据（两条，缺一不可）**：① **上抛率只升不降**——对照 = #293 修后读数 **0.67 / 0.78**（逐模型，不得低于）；② **静默自选族 = 0**（`silent-landed` / `silent-reported` 两类计数——#293 后已 4+1 → 0，保持 0）。
- **执行序**：实施轮只落码与**零网络腿**（`--dry-run` 真装配腿）；**实弹 = 父侧点火**（真实模型 · 随批自动跑 · 成本受三闸 cap / 墙钟 / `--max-cost`），读数入批档 §6。**非门控**（不按模型设岗、不改配置默认）。

### 2.8 验收对照（AC · 逐条回指本批条目与 §1 验收）

| AC | 回指 | 判据（机器可验 / 一次性核） |
|---|---|---|
| AC-1 | A1 / A2 | 新档双面在位、与 §2.2+§2.3 逐字 **0 diff**（一次性 UTF-8 比对）；5 子代理场景 `assemblePrompt` 输出含新档全文；engineering / normal 两场景输出**不含**（反向腿）；行数 14 / 14 |
| AC-2 | A1 | 18 处删除逐处落（§2.4 表：双面各档 Δ 逐数相符）；族句零残片——域内（两面 prompts + 新档）一次性扫描 `无用户可等 / 没有用户可等 / 不是用户可等 / 歧义写进最终报告 / 冲突类除外 / 歧义就在计划 / 不向最终用户提问` 零命中；正典自身「不以「等待批准」结束回合」= 保留件合法正例 |
| AC-3 | A3 | 两处 common 收正句 + 补条与 §2.5 **逐字 0 diff**；`##` 块计数 = 14（T-CL1 守恒）；上句与补条外 common 零改 |
| AC-4 | A2 / A4 | 装配表 5 行含新档、两主链行零变（表驱动 1:1）；§2.6(b) 6 处枚举同步后三包全绿、**零新增 / 零删除用例** |
| AC-5 | 零引用 | `cd thincoder-cli && node --test test/prompt-refs-zero.test.mjs` 全绿（新档入域、零文档引用）；`prompts-dual-source` **档零改**仍绿 |
| AC-6 | 零机检增量 | `node scripts/doc-check.mjs`：开跑基线实读 + 前后逐值相同 + 触碰档 **0 命中**（基线读数见 §2.9） |
| AC-7 | A5 | 探针复测：上抛率逐模型只升不降（对照 0.67 / 0.78）+ 静默族 = 0（**实弹 = 父侧点火**，读数入 §6） |

**用例表（正常 / 边界 / 错误）**：正常 = 子代理场景装配含正典 + 主链场景不含（正反双腿）；边界 = 归档镜像（15 · 冻结）与核包（16）集合不等 ⇒ 判据拆两判后仍双向覆盖；新档缺档 ⇒ 既有 SKIPPED + 警告语义（loader 零改）；错误 = 冲突拖终报 / 自选一方 ⇒ 探针静默族判据（AC-7）。

### 2.9 机检读数（设计轮 · 本席实跑）

- `node scripts/doc-check.mjs`（仓根）⇒ **悬空 48 / 行宽 22**（全仓现盘 = 本批开工基线；48 条悬空与 22 行超宽**全落他档存量**，本批触碰面 0 命中）。**批次档不入扫描域**（`docs/batches/**` 为排除面 ⇒ 本段写入不改变任一读数）⇒ 设计轮**零新增** ✓。
- 本批触碰面（两面 prompts + 装配表 + 6 处机检档）设计轮**零写入**（本段 = 设计）；实施轮收尾复跑同一命令，判据 = 前后逐值相同 + 触碰档 0 命中（AC-6）。

### 2.10 关键决策记录（含被否决备选）

- **KD-1 载体 = 新建 `subagent-base.md`**（唯一可行）：既有层覆盖集实核——`common.md` / 双纪律层均含主链场景（2026-09-17 裁定出局）、persona 各 1 场景、`consult-base` 专用 ⇒ 无「恰 5 子代理场景」层（§2.1）。**否决** = 塞 `common.md`（撞硬约束）· 塞纪律层（主 / 子差异入主链）。
- **KD-2 命名 = `subagent-base.md`**：受众命名（本层为子代理专用内容之家）· 先例 `consult-base.md`。**否决** `subagent-common.md`（与 `common.md` 子串包含 ⇒ 扫描 / 工具面歧义）· `subagent-upstream.md`（只覆盖一轴）。
- **KD-3 装配位 = 行末第四槽（[4]）**：recency 位 + 主链零变的最小侵入。**否决** 中插（须重排 [3]→[4] 编号链，触碰 4 份纪律头注）。
- **KD-4 装配手段 = 表驱动改行**（`SLOT_CONTENTS` + `SCENARIO_SLOT_FILES`）：`prompt-overlays.mjs` 头注明写「槽文件路径字符串以本表为唯一权威」——**否决** `SLOT_CONTENTS` 内容拼接 / 场景表外加隐式追加（违表驱动红线 + 机检不可见）。
- **KD-5 枚举同步 = D3 维护 · 非机检增量**（承父侧 12:18 裁定②）：6 处逐处清单入 §2.6(b)；refs-zero / dual-source **零新断言、零新用例**；先例 = 2026-09-21 批「既有锁机械形修，锁意图不变（随批披露）」。
- **KD-6 VSC 归档镜像等式判据拆两判**（§2.6(b) #4）：归档面冻结于 15（裁定 B 参照历史）⇒ `deepStrictEqual(mirror, core)` 机械失稳；拆为 ①核包 = 16 ②镜像 15 名 ⊆ 核包名集——**强度等价保留**（双向覆盖不降）；本批**唯一判据形态改动处**，披露待核。
- **KD-7 逐字文本落 §2**（一次性材料不混长期档，D2；承 #293 KD-6）；设计档只落机制 / 落点 / 计数收正。
- **KD-8 plan 档本地承载保留**（§2.4 #8/#9）：「有歧义就在计划里注明」= 本地交付语义，随族句删除只删「向谁问 / 冲突例外」支 ⇒ 能力零净损。
- **KD-9 确认权威轴收正**（承裁定①）：common 该句按确认权威轴最小改（§2.5 甲）+ 正典第 2 段同轴同词（取代桥接案）⇒ 两处零新变体。

### 2.11 上抛项（请父侧裁 / 记录）

1. **【已裁 · 记录】** 正典「父代理 = 你的用户」vs common「父不是用户」句相抵 + 「既有锁零动」对 6 处枚举同步的口径——12:18 父侧裁定①（取备选 b：放开 common 该句）+ ②（枚举同步 = D3 维护）已落 §2.3 / §2.5 / §2.6(b) ✓。
2. **VSC 判据形态（KD-6）**：拆两判为本席判（强度等价保留）；如父侧要求其它形态请点我（涉 `thincoder-vscode/test/prompts-mirror-anchors.test.mjs`）。
3. **随动面笔权与排期**（§2.6(c)）：需求档（主 agent 笔）· 脚本面 `check-vsix.mjs`（父侧直笔 / 实施轮同带）· 产品文本面（README / AGENTS / CHANGELOG 类）——本批**只列不动**，排期由父侧定。
4. **残留观察（非阻断）**：① `prompts-dual-source.test.mjs` `NEW_PROMPTS` 15 名列表未随（按 §1「原样」零动）⇒ **D3 口径差 = 已知残留**，随下次触碰该档收正；② `docs/core/design/prompts/persona-coder.md:9`「see the same-named sections in the shared layer — already injected」= 面级指路句嫌疑（2026-09-20 裁定类），本批未触——另册。

### 2.12 评审修正块（评审 #80 · 轮次 1 · 12 条逐条落 · eng-designer · 2026-09-27）

**口径**：本块 = §3 轮次 1 发现（1🔴 + 6🟡 + 4🔵 = F1–F11，域外注 = F12）处置的**唯一落点**；append-only——与 §2.0–§2.11 正文相抵处**以本块为准**，未列处原文有效。只落评审发现与父侧裁定直接导出的修正：**零新语义 · 零新机检锁 / 断言族 / 用例 · 零需求档本体改动**。

**F1（🔴 · 发现 1——需求档随动面补全 + 建议文本；笔 = 主 agent，本席只列不动）**
§2.6(c)「需求档面」清单**补四处**（原漏）+ 逐处建议替换句：
- `docs/core/requirements/PROMPT-SYSTEM.md:12`：「（15 档槽位）」⇒ 建议「（16 档槽位）」。
- `:143` 四槽位固定序：「`[4] 其他`」⇒ 建议「`[4] 子代理层（subagent-base.md——仅子代理场景装配）`」；句末补「项目层（AGENTS——cwd 注入）与 skills 追加 = 槽位之外尾块（装配于槽链之后）」。
- `:147-157` 装配矩阵（目标态）5 个子代理行：各行「→ AGENTS」⇒ 建议「→ `subagent-base.md` → AGENTS」（主链两行 + 特殊模块两行零变）。
- `:179` N2：「档名集合 = 槽位 15 + 工具描述 25（断言 D）」⇒ 建议「档名集合 = 槽位 16 + 工具描述 24（断言 D）」。**同格另报**：「工具描述 25」与现盘相抵（`thincoder-core/test/prompt-files.test.mjs:41-67` 实读 24 名集）——是否随改由主 agent 定。
- **邻位观察（本席实读新发现——超评审清单字面 · 同因同轴 · 报主 agent 定）**：`:23`（§2.1 表「[4] 其他」行——[4] 语义迁移未同步）· `:139`（「特殊模块 5 件计入则 15」⇒ 16；「主链 10 文件」计数随新层归属定）· §2.5 命名法表（`:129-137`——无 [4] 子代理层行）。
- 口径：**保持 [4] 编号**（父侧裁定）；`subagent-base.md` 命名 = 受众名 + base（先例 `consult-base.md`）。原列项（`:72` / `:46` / `:80-81` / `ENGINEERING-MODE-V2.md:388` / `CORE-UNIFICATION.md:19/:117`）保持——本 F 为**补漏**。

**F2（🟡 · 发现 2——残片判据两表合一 + 假阳性修正）**
§2.4③ 与 AC-2 的残片模式表**合为一集**（两处引用同一判据——同文）：
- **域** = `docs/core/design/prompts/**` + `thincoder-core/prompts/**`（双面 · 含新档）。
- **模式（族句形 · 大小写不敏感）**：CN = `用户可等` / `等待批准` / `向最终用户提问` / `不要问用户` / `冲突类除外` / `写进最终报告` / `不拖到最终报告` / `可降级范围`；EN = `no user to wait for` / `waiting for approval` / `ask the end user` / `do not ask the user` / `except conflicts` / `in your final report` / `into your final report` / `degradable range`。
- **豁免行（合法保留件——命中即豁免）**：① plan 档本地承载行「有歧义就在计划里注明。」/ `If something is ambiguous, note it in your plan.`（§2.4 #8/#9 保留件）；② 正典列 1「不以「等待批准」结束回合」/ `never end your turn "waiting for approval"`（合法正例）。
- **修正点**：① 删「歧义就在计划」形——**假阳性**（撞 plan 保留件；原 AC-2 必报红的缺陷源）；② 原「歧义写进最终报告」形换为 `写进最终报告` / `in|into your final report`（「歧义进（最终报告|计划）」形域内**零命中**——退场）；③ **本席实读补** `可降级范围` / `degradable range`（§2.4 #5 族尾句——原两表均漏）；④ **本席实读补** EN 同位形（原两表均仅列 CN 形，而域含 EN 面）。
- **实读核（本席 2026-09-27 · 全量后态模拟扫描 = 18 处删除 + 两处收正 + 新档双面全量在内存合成）**：全模式 **0 命中**；豁免 ② 命中 2 处（正典列 1 双面——合法）⇒ 判据可过。

**F3（🟡 · 发现 3——persona Δ 与 18 处算式）**
- §2.6(a) eng-coder 行 Δ：**−3 ⇒ −4**（双面；§2.4 #1+#2 = −1 + −3 = −4，42 → 38）。
- §2.4 末明细句**改为**：「18 处 = **9 处/面 × 2 面**（eng-coder 2 / coder 1 / designer 2 / explore 1 / plan 3 = 9 处/面）——**不含 common 旁证**（旁证单列 §2.5 甲）」。

**F4（🟡 · 发现 4——行数口径钉死）**
- 明文口径：**CN 新档 = 13 行内容 + 行尾换行 ⇒ `split('\n')` 读 14**；**EN 新档 = 14 行内容（F9 半句折行 1 行）⇒ `split('\n')` 读 15**。唯一实判 = 逐字 0 diff（行数为形态登记）。
- 行宽自检：CN max 106 ≤ 140 · EN max 221 ≤ 240。
- §2.6(a) 新档两行 / AC-1 按此收正（全档逐字 = 本块附 A）。

**F5（🟡 · 发现 5——跨行编辑范围 + AC-3 补判）**
- CN `docs/core/design/prompts/common.md:46-47`：删 46 行尾旧句「父不是用户：它不确认任何事，」+ **删 47 行首「也可能正忙。」** ⇒ 新句落 46 行「父不是确认门：它不能代任何事点头，也可能正忙。」；47 行 = 「每条消息先过这道滤网：」。
- EN `thincoder-core/prompts/common.md:52-53` 同法：删 52 行尾「The parent is not a」+ **删 53 行首「user: it cannot confirm anything and it may be busy.」** ⇒ 新句落 52 行「The parent is not a confirmation gate: it cannot approve anything, and it may be busy.」；53 行 = 「Pass every message through this filter first:」。
- §2.6(a) CN common 行同步：「`:46` 行内收正」⇒「`:46-47` 跨行收正（±0）」。
- AC-3 补判：① 收正后 **common 双面各恰一现「确认门」/「confirmation gate」**（实读核：各 1；正典自身各 1 现 = 合法正例，另计）；② 旧句两形「父不是用户」/「The parent is not a user」**零命中**（跨行范围落定后零同句残片）。

**F6（🟡 · 发现 6——EN 补条形态钉死 + Δ 同步 + AC-3 归一）**
- EN 形态 = **按档内折行**（对齐该档折行形态；不取单长行）：新 in-scope 条目 = **4 行**（`:57-60`——行宽 111 / 92 / 133 / 91）。
- §2.6(a) EN common Δ：**±0 ⇒ +2**（`:52-53` 跨行收正 = ±0；`:57-58` → 4 行 = +2；164 ⇒ 166）。
- AC-3：逐字比对**前先归一换行 / 空白**（折行 = 排版层——面内形态差非内容差）。

**（F3–F6 合并后 §2.6(a) 取值）**：新档 CN +13 行内容（`split('\n')` 读 14）· 新档 EN +14 行内容（读 15）· common CN ±0 · common EN **+2**（164 ⇒ 166）· persona 双面 ×5 = **−4 / −1 / −1 / −1 / −1**。

**F7（🟡 · 发现 7——sweep 域 / 形态两条 + 已知命中表补全 + (d) 披露）**
§2.6(c) 一次性复核（非锁）照下收正：
- **域** = `docs/**`（除 `docs/batches/**` · `_archive/**`）+ 三包 prompts 面（`thincoder-core/prompts/**` + 相关产品测试 / 脚本面）。
- **形态** = `15 档` / `槽位 15` / `(15)`。
- **已知命中（补全——原表 + (a)(b)(c) 全组）**：

| # | 面 | 坐标 | 处置 | 笔 |
|---|---|---|---|---|
| 1 | 设计档（本档） | `docs/core/design/PROMPT-SYSTEM.md:21/:157/:189/:190/:319` + §6.2 + §6.7 + 变更记录 | 计数 15→16 / 装配事实 / 口径收正 | eng-designer |
| 2 | 设计档随动 | `docs/core/design/ARCHITECTURE.md:41/:61` · `DOC-SYSTEM.md:99/:131/:157` · `TWO-REPO-MERGE.md:90` | 计数 15→16 | eng-designer |
| 3 | 设计档（人读面） | `docs/core/design/TOOLS.md:856` | question 面句收正（**产品面 `thincoder-core/tool-docs/question.md` 零触**——见 F10） | eng-designer |
| 4 | 需求档 (a) | `docs/core/requirements/PROMPT-SYSTEM.md:12/:143/:147-157/:179`（+邻位 `:23/:139/:129-137`） | 建议文本见 F1 | **主 agent** |
| 5 | 设计档 (b) | `docs/core/design/CORE-UNIFICATION.md:1008/:1030/:1042/:1527` | D-C11 断言 D 描述 15→16 | eng-designer |
| 6 | 机检档 (c) | `thincoder-core/test/prompt-files.test.mjs:69`（标题「(15)」）· `thincoder-vscode/test/prompts-async-guidance.test.mjs:74`（+`:5-7` 头注）· `thincoder-vscode/test/files.mjs:59` · `thincoder-vscode/test/prompts-mirror-anchors.test.mjs:8/:17`；**本席实读补**：`thincoder-cli/test/prompts-async-guidance.test.mjs:29`（注释「新 15 文件全集」）· `:45`（标题「新 15 件在位于 prompts 树」） | 随 §2.6(b) 同步同改（档内计数串含标题 / 注释一并收正——D3） | 实施轮 |
| 7 | 脚本 / 发布面 | `thincoder-vscode/scripts/check-vsix.mjs:9-10/:32` | EXPECT prompts 15→16 + 头注 | 父侧直笔 / 实施轮同带 |
| 8 | 产品文本面 | `thincoder-core/README.md` / 两包 `AGENTS.md` / `CHANGELOG.md`（`:13`） | 实施轮按域 + 形态两条枚举逐处收正（非锁） | 实施轮 |

- **(d) NEW_PROMPTS 三处 = 零动 + 披露（父侧裁定）**：`thincoder-cli/test/prompts-async-guidance.test.mjs:30-35` · `thincoder-vscode/test/prompts-async-guidance.test.mjs:40-45` · `thincoder-cli/test/prompts-dual-source.test.mjs:33-38`——**本批零动**（§1「原样」）；**覆盖缺口一句**：新档不入其逐档扫描（首行头注格式断言族 / 表行宽断言 / 存在性断言），随下次触碰该三档收正（D3 口径差）。
- §2.6(c) 自称「已知命中已列于本表」⇒ **本修正后成立**（含需求档四坐标 + (a)(b)(c)(d) 全组）。

**F8（🔵 · 发现 8——唯一逐字源定形）**
§2.2 头两段（第 5–6 行）被 §2.3 取代后，实施者**不再自行合成**：唯一逐字源 = **本块附 A（合成后全档逐字——CN 13 行 / EN 14 行）**；落地 = 逐字照抄（0 diff，含行尾换行）。§2.2 / §2.3 保留为历史形态（记录面）。AC-1 首半同步改指「与 §2.12 附 A 逐字 0 diff」。

**F9（🔵 · 发现 9——正典列 3 半句同词）**
正典列 3 加半句（与 common 补条同词「同判冲突」/ `judged the same as a conflict`）——CN 见附 A 第 12 行；EN 折行（F4 口径之由）。⇒ 正典「四类」与 common 补条「五项」列举**同义**（文档矛盾 = ② 的字面形态、归此类）。

**F10（🔵 · 发现 10——question 面两义澄清）**
§2.6(c) 对 `docs/core/design/TOOLS.md:856` 的收正 = **设计档（人读面）**；**产品面 `thincoder-core/tool-docs/question.md` 零触**。§1 边界「`question` 工具面零动」读作「question **工具描述（产品面）** 零动」；§1 字面如需补注 = 主 agent 笔。

**F11（🔵 · 发现 11——KD-6 判据形态收正）**
KD-6「拆两判」**收正为**：
- ① 核包 = 16（`mdSetCore().length === 16`）。
- ② **镜像名集 ⊇ 冻结 15 名字面清单**（逐名 `includes` 核）+ 既有「镜像数 = 15」保留 ⇒ 合成 = 镜像 ≡ 冻结 15（两向覆盖 · 强度等价）。
- ③ 核侧「旧 15 名仍在位」由 `thincoder-core/test/prompt-files.test.mjs:23-39/:69` 16 名集断言承接；`thincoder-vscode/test/prompts-mirror-anchors.test.mjs:44` 原 `deepStrictEqual(mirror, mdSetCore())` 行删除（判据由 ①② 合成承接）——**既有断言形态收正 · 零新用例**。
- 批档外已列形态同入：该档 `:7-9` 头注 / `:40` 用例标题 / `:44` 断言行（+ (c) 表 `:8/:17`）。

**F12（域外注 · 设计档指针复核收正）**
复核：`docs/core/design/PROMPT-SYSTEM.md:167` 所引「§4.5」在需求档**无对应节**（该档 §4 = 提示词编写纪律 16 条；装配矩阵 = §2.6 `:141-159`）⇒ 收正为 **§2.6**（装配逻辑：四槽固定序 + 矩阵 + 降级链）。**本轮回已落**：设计档 `:167`（指针）+ `:388`（变更记录 +1 行）。

**附 A · 唯一逐字源（合成后全档 · 落地 = 逐字照抄 · 0 diff）**

**A-1 CN 正本（`docs/core/design/prompts/subagent-base.md` · 13 行内容 + 行尾换行）：**

```markdown
<!-- 槽位:[4] 消费方:[全部子代理角色——eng-coder / eng-designer / explore / coder / plan] -->

## 你与父代理（子代理专用）

你是子代理：**父代理就是你的用户**——你所有面向用户的动作，对象都是它；授权已在上游行使。
它**不是确认门**（不能代任何事点头，也可能正忙）——所以确认型请求不发；**但决策级问题正是它要的**。

- **不停轮等答复、不以「等待批准」结束回合、不发确认型请求**——确认型 = 要它点头你才继续那种。
  **禁的是「确认型提问」，不是「决策型提问」**——这两件事必须分开。
- **决策级问题就发**：答案会改变你的下一步、而材料里查不到 ⇒ 立即发 `notify_parent`（`ask`）——
  一句话摆出问题 + 你的倾向；**即发即走**：不受影响的部分继续做，受影响部分标 pending 直到答复到达。
- **决策级 = 四类**：① 写明的前提与实况冲突；② 两处要求互斥且你不可自行裁（两处文档对同一机制描述不同 ⇒ **同判冲突**、归此类）；③ 待做之事是否在任务域内；④ 继续当前路线会作废已完成的工作。
- **冲突类必发、不得拖终报**：两处要求互斥 ⇒ 立即发 `ask`——不得自选一方解套、不得继续权衡、不得拖到最终报告。
```

**A-2 EN 运行面（`thincoder-core/prompts/subagent-base.md` · 14 行内容 + 行尾换行）：**

```markdown
<!-- slot:[4] consumers:[all subagent roles — eng-coder / eng-designer / explore / coder / plan] -->

## You and the parent agent (subagent-only)

You are a subagent: **the parent agent IS your user** — every user-facing move you make is addressed to it; the authorization has already been exercised upstream.
It is **not a confirmation gate** (it cannot approve anything, and it may be busy) — so never send a confirmation request; **but decision-grade questions are exactly what it wants**.

- **Never idle-wait for an answer, never end your turn "waiting for approval", never send a confirmation request** — a confirmation request asks it to approve before you go on.
  **What is banned is the confirmation-type question, not the decision-type question** — keep the two apart.
- **Send decision-grade questions**: the answer changes your next step and the materials cannot supply it ⇒ send `notify_parent` (`ask`) at once —
  one line with the question and your leaning; **send-and-go**: keep working on the unaffected parts; mark the affected part pending until the reply arrives.
- **Decision-grade = four classes**: ① a stated premise the facts contradict; ② two requirements that conflict and you cannot arbitrate
  (two documents describing the same mechanism differently ⇒ **judged the same as a conflict**); ③ whether the action is inside your task domain; ④ a choice that would waste work already done.
- **The conflict class must be sent, never deferred to the final report**: two requirements in conflict ⇒ send an `ask` at once — never settle it by picking a side, never keep weighing, never park it for the final report.
```

**AC 收正（承 F2/F4/F5/F6/F8——AC-1/2/3 三行按此替换对应半句）**
- AC-1：判据改「与 **§2.12 附 A** 逐字 0 diff（一次性 UTF-8 比对）」；行数判据改「CN 13 行内容 / EN 14 行内容（+ 行尾换行 ⇒ `split('\n')` 读 14 / 15——逐字 0 diff 为准）」。
- AC-2：残片判据改「按 **§2.12-F2 统一残片判据**（域 / 模式 / 豁免三件）零命中（豁免 2 处 = 正典列 1——合法正例）」；Δ 判据回指 §2.4 表（含 F3 修正）。
- AC-3：比对**前先归一换行 / 空白**（EN 补条 = 折行形态）；补判「common 双面各恰一现『确认门 / confirmation gate』」+「旧句两形零命中」。

**机检复核（修正轮 1 后 · 本席实跑 · 2026-09-27）**：`node scripts/doc-check.mjs`（仓根）= **悬空 48 / 行宽 22**——与 §2.9 基线逐值相同；触碰档 0 新增（设计档本轮两处落笔零新增，`:473 → :475` 为变更记录插行后的行漂，迁移期引文类不变；本批档 `docs/batches/**` 不入扫描域）。
**本轮落点清单**：设计档 `docs/core/design/PROMPT-SYSTEM.md:167`（F12 指针）+ `:388`（变更记录 +1 行）；其余处置 = 本块 F1–F11 逐条（含建议文本与判据形态——实施轮 / 主 agent 按其落笔）。

### 2.13 评审修正块（评审 #82 · 轮次 2 · 7 条逐条落 · eng-designer · 2026-09-27）

**口径**：本块 = §3 轮次 2 发现（🟡 4 · 🔵 3 = 7 条）处置的**唯一落点**（父侧已逐条裁定接受评审处置建议——Suggestion 列 = 处置建议、执行 = eng-designer）；append-only——与 §2.0–§2.12 相抵处**以本块为准**，未列处原文有效。只落评审发现与父侧裁定直接导出的修正：**零新语义 · 零新机检锁 / 断言族 / 用例 · 零需求档 / 提示词 / 测试 / 脚本实体改动**（后三者归实施轮）。编号承接轮 1（F1–F12）⇒ 本轮 **F13–F19**，与 §3 轮次 2 表行 #1–#7 逐号对应（#1→F13 · #2→F14 · #3→F15 · #4→F16 · #5→F17 · #6→F18 · #7→F19）。

**F13（🟡 · 轮 2 #1——sweep 形态集补全 + 已知命中表补坐标 + 结句范围收正）**

- **形态集收正**（与 §2.12-F7 原集相抵处以本集为准）：`15 档` / `槽位 15` / `(15)` / **`（15）`**（末项 = 本轮补入的**全角括注 · 裸计数形**）。
- **已知命中表补入（逐处）**：
  - 行 1（设计档）坐标 += `docs/core/design/PROMPT-SYSTEM.md:23`（「`thincoder-core/prompts/`（15）+ `thincoder-core/tool-docs/`（24）」——与 `:21` 同一条现状计数）⇒ 计数 15→16（设计面收正轮）。
  - 行 4（需求档）坐标 += `docs/core/requirements/ENGINEERING-MODE-V2.md:388`（子代理节「无用户可等」句 ⇒ 按新正典同义收正）· `docs/core/requirements/CORE-UNIFICATION.md:19`（A7「`src/prompts/` 15 档」句）· `:117`（N4「核包内 `prompts/` 15 档」句）（后两处 = 如判为现态语句则随批收正）；笔 = 主 agent。
- **本席实读补**（`（15）` 形全量实读——非批档 / 非归档域共 3 命中：`PROMPT-SYSTEM.md:23`〔已列行 1〕· `CORE-UNIFICATION.md:164` · `:313`；另并登记旧形 `(15)` 一处 = `:41`）：
  - `docs/core/design/CORE-UNIFICATION.md:164`（§2.3.3 候选 a「核包内 `prompts/`（15）+ `tool-docs/`（24）」——与 `:1008`（D-C11）同类）⇒ 计数 15→16（设计面收正轮 · eng-designer 笔）。
  - `docs/core/design/CORE-UNIFICATION.md:313`（「同路径对（107）+ 中文设计档对（15）」）⇒ **不改**——二重理由：① 句内自注「起点读数」（as-of 语义自持）；② 所指 = 两产品镜像树对（冻结面），非核包面。
  - `docs/core/design/CORE-UNIFICATION.md:41`（旧形：`prompts` 1.0000`(15)`）⇒ **不改**——句内自注「读数基线注 · as-of 2026-09-14 收正」= 基线读数。（登记：旧形命中、原表未列——如实并入本表以便对账。）
- **同格另报（非本席处置）**：`CORE-UNIFICATION.md:19` 同行含「25 档工具描述」——与 `:117`（24 档）及现盘相抵（与 F1 于 `PROMPT-SYSTEM.md:179` 的同格另报同族）⇒ 主 agent 随该两处收正时一并判。
- **结句收正**：§2.12-F7 结句「已知命中已列于本表 ⇒ 本修正后成立」——**范围 = 本表实际列项**：设计档行 1–3/5（含本块补入）+ 需求档行 4（含本块补入）+ 机检行 6 + 脚本行 7 + 产品文本行 8 + 登记项（`:313` / `:41`——判不改）；**不另作超表完备性声明**。

**F14（🟡 · 轮 2 #2——「（不）问用户 / 不问最终用户」族并入残片判据 + 逐处判定 + 标题改写 + AC-2 复核）**

**（甲）统一残片判据（F2 集 + 本轮族并入——合并后唯一版本 · 取代 §2.12-F2 模式集）**

- 域 = `docs/core/design/prompts/**` + `thincoder-core/prompts/**`（双面 · 含新档）。
- CN 模式集（族句形 · 大小写不敏感）= `用户可等` / `等待批准` / **`问用户`** / **`最终用户`** / `冲突类除外` / `写进最终报告` / `不拖到最终报告` / `可降级范围`——粗体 = 本轮并入；并归并原 `向最终用户提问` / `不要问用户` 两形（子集）。
- EN 模式集 = `no user to wait for` / `waiting for approval` / **`ask the user`** / **`end user`** / `except conflicts` / `in your final report` / `into your final report` / `degradable range`——粗体 = 本轮并入；并归并原 `ask the end user` / `do not ask the user` 两形（子集）。
- 豁免行（合法保留件——命中即豁免）：① plan 档本地承载行「有歧义就在计划里注明。」/ `If something is ambiguous, note it in your plan.`（§2.4 #8/#9 保留件）；② 正典列 1「不以「等待批准」结束回合」/ `never end your turn "waiting for approval"`（合法正例 · 双面各 1）；③ 工具路由行 `common.md` CN `:72`「问用户用 `question`」∥ EN `:114` `ask the user (ambiguity, design decisions)`（所指 = `question` 工具面 / 主会话对话对象——非子代理向上通道句）；④ 主会话-子代理分列行 `common.md` CN `:80`「主会话问用户，子代理走上行 `ask`」∥ EN `:120` `the main session asks the user; a subagent raises an upstream ask`（句内自明分列——CN 命中本族形、EN 侧 `asks` 不命中）；⑤ 主链 normal 档通道分界行 `persona-normal.md` CN `:26`「`question` 工具（阻塞等答）或停下问用户」∥ EN `:30` `or stop and ask the user`（消费方 = 主链场景、所指 = 真人用户——非子代理面）。

**（乙）逐处判定**（族形域内全量实读——8 组 · 双面）：

| # | 处（双面） | 现文形 | 判定 |
|---|---|---|---|
| 1 | `persona-plan` CN `:8` ∥ EN `:9`（标题） | 「## 权限边界（只读/不问用户）」 | **改写**「## 权限边界（只读）」（见丙） |
| 2 | `persona-plan` CN `:10` ∥ EN `:11` | 不要向最终用户提问 / Do not ask the end user questions | 删（§2.4 #8——族句删除 + 本地承载保留） |
| 3 | `persona-plan` CN `:26` ∥ EN `:27` | 不要问用户 / do not ask the user | 删（§2.4 #9） |
| 4 | `persona-explore` CN `:6` ∥ EN `:6` | 不向最终用户提问 / do not ask the end user questions | 删（§2.4 #6 整 bullet） |
| 5 | `persona-coder` CN `:5` ∥ EN `:7` | （不向最终用户提问）/ (do not ask the end user questions) | 删（§2.4 #3 整 bullet） |
| 6 | `common.md` CN `:72` ∥ EN `:114` | 问用户用 `question` / ask the user (ambiguity, design decisions) | 保留 + 豁免（甲③） |
| 7 | `common.md` CN `:80` ∥ EN `:120` | 主会话问用户，子代理走上行 `ask` / the main session asks the user… | 保留 + 豁免（甲④） |
| 8 | `persona-normal` CN `:26` ∥ EN `:30` | …或停下问用户 / …or stop and ask the user | 保留 + 豁免（甲⑤） |

**（丙）`persona-plan` 标题改写**（父侧裁定 = **改写支** · 双面同改 · 行内改写 ⇒ 行数 Δ 不变——§2.4 计划档 Δ −1 照旧）：`docs/core/design/prompts/persona-plan.md:8` ∥ `thincoder-core/prompts/persona-plan.md:9`——「## 权限边界（只读/不问用户）」⇒「## 权限边界（只读）」。理由：正典重定义「用户」= 父代理（附 A CN 第 5 行）⇒ 原标题可读成「不问父代理」、与正典列 2 正面歧义；改写 = 对象自足（「只读」半句已承载本档边界；豁免注记支不取——「用户」形即使加注仍留误读面）。

**（丁）AC-2 复核**（含新形判据 · 全量后态模拟 = 18 处删除 + common 两处收正 + 新档双面 + 标题改写）：非豁免命中 = **0**；豁免命中 = **7 处**（CN 4 = 正典 / `common:72` / `common:80` / `persona-normal:26`；EN 3 = 正典 / `common:114` / `persona-normal:30`）⇒ 判据可过。

**F15（🟡 · 轮 2 #3——机检档 / 脚本行数 + Δ 标注 · 口径 = `persona-eng-designer.md:65`「源/测试文件带当前行数 + 预计增量」）**

| # | 文件 | 现列行数（实读 · `split('\n')` 读——F4 口径） | Δ | 结构 | >300 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/test/prompt-files.test.mjs` | 180 | **+1**（`:23-39` 名集 +1 元素；`:22` 注释 / `:69` 标题计数串行内改 = ±0） | 不变 | 否 |
| 2 | `thincoder-cli/test/prompts-async-guidance.test.mjs` | 174 | **±0**（`:65-69` 五子代理行行内末位补字符串） | 不变 | 否 |
| 3 | `thincoder-cli/test/eng-designer-role.test.mjs` | 274 | **±0**（`:120` 行内末位补） | 不变 | 否 |
| 4 | `thincoder-vscode/test/prompts-mirror-anchors.test.mjs` | 186 | **判据形态收正**（本批唯一·F11：`:44` 断言行删 + 冻结 15 名字面清单 / 逐名核行增——净增随实施形态，非「结构不变」） | **收正** | 否 |
| 5 | `thincoder-vscode/test/prompts-async-guidance.test.mjs` | **328** | **±0**（**4 行**行内末位补——`:87-90`；**实读补正**：该档矩阵块实为 4 条子代理行〔eng-coder / explore / coder / plan〕——§2.6(b)#5 原「5 子代理行」表述按实读收正；无 eng-designer 行 = 该档未断言该场景行） | 不变 | **是——advisory 超阈（拆分复核需要）** |
| 6 | `thincoder-vscode/test/eng-designer-role.test.mjs` | 200 | **±0**（`:131` 行内末位补） | 不变 | 否 |
| 7 | `thincoder-vscode/scripts/check-vsix.mjs` | 87 | **±0**（`:32` EXPECT 字面值 / `:9-10` 头注文本——行内改） | 不变 | 否 |

- 注 1：#1–#3 / #5 / #6 / #7 的改动 = **仅断言字面值 / 计数串同步**（结构不变）；#4 = 本批唯一判据形态改动处（F11 · 强度等价保留）。
- 注 2：**唯一 >300 行档 = #5（328 行）**——本批增量 = 行内字符串级（±0）；拆分动作不在本批（如需拆由父侧另立）。
- 注 3：口径 = `persona-eng-designer.md:65`「源 / 测试文件带当前行数 + 预计增量」；纯 .md 档豁免（照口径）。

**F16（🟡 · 轮 2 #4——随动面排期收定 · 收口前置）**

**排期行**（承父侧裁定；取代 §2.11-3「排期由父侧定」待定态——§2.6(c) 清单本身不变；本块为 append-only ⇒ 排期落本块、以本块为准）：

1. **实施轮**（文件真增）：提示词双面新档 + 18 处删除 + common 两处/面 + 装配表 + §2.6(b) 6 处枚举同步（+ F7 行 6/7/8 组）——照 §2.2–§2.5 + 附 A 逐字落笔。
2. **设计面收正轮**（eng-designer 笔）：设计档计数 15→16 组（§2.6(c) 行 1–3/5 + F7 行 1/2/3/5 + 本块 F13 补入 `:23` / `:164`）+ §6.2 装配事实 + §6.7 口径收正 + 变更记录 +1 行 + `:379` 域注 16+16=32（F18）。
3. **需求档面**（主 agent 笔）：F1 四处 + 邻位 + 本块 F13 补入 `ENGINEERING-MODE-V2:388` / `CORE-UNIFICATION:19` / `:117`。

**收口前置**：§6 收口前第 2 / 3 步**必须落**——未落 = **不得收口**。

**F17（🔵 · 轮 2 #5——另册项坐标校正）**

§2.11-4② 坐标收正：另册项（面级指路句嫌疑句）实指 = **CN** `docs/core/design/prompts/persona-coder.md:7`（「…（证据纪律/范围边界/交付表：见公共层同名节——已注入）」）∥ **EN 运行面** `thincoder-core/prompts/persona-coder.md:9`（"…see the same-named sections in the shared layer — already injected."）。原系 CN `:9`（该行实为「## 权限边界（写门控）」）⇒ 错位；CN 侧同句本轮一并登记。本批未触（仍另册）。

**F18（🔵 · 轮 2 #6——`:345` / `:379` 判定）**

- `docs/core/design/PROMPT-SYSTEM.md:345`（§10.2 标题「结构级复核（15 对 · 已结清 · as-of 2026-09-18）」）= **冻结记录面**（as-of 语义自持）⇒ **不改**。
- `:379`（AC-M9-3 判据域注「域 = 两面提示词档（模板 15 + 落地 15 = 30 档）」）= **判据域引用** ⇒ **随批收正**：模板 15 + 落地 15 = 30 ⇒ **模板 16 + 落地 16 = 32**。落点 = 设计面收正轮（F16 排期 ②）。

**F19（🔵 · 轮 2 #7——check-vsix 目录关系 + EXPECT 定值 · 本轮实读）**

实读 `thincoder-vscode/scripts/check-vsix.mjs`（87 行）：

- 所数目录 = **核包面**：`:24-25`（`CORE = join(resolve(ROOT, ".."), "thincoder-core")`）· `:44`（`repoFace(dir)` 读 `thincoder-core/prompts/`）· 断言 D `:73-82`（仓内核包 ↔ vsix 内 `extension/node_modules/@thincoder/core/prompts/`〔`:31`〕逐档 sha256 + 档数硬等 `:32` `EXPECT`）。
- 「归档镜像」所指 = **VSC 端归档镜像** `thincoder-vscode/docs/_archive/design/prompts/`（`thincoder-vscode/test/prompts-mirror-anchors.test.mjs:42` 读取面）——裁定 B 参照历史、**冻结 15**。
- ⇒ **非同一目录**：核包面（随批 15→16）∥ 归档镜像面（冻结 15）——两判据**互不抵**；据此定 **EXPECT.prompts = 16**（`:32`；`:9-10` 头注同步），§2.6(b)#4「镜像冻结于 15」保持。

**机检复核（修正轮 2 · 本席实跑 · 2026-09-27）**：`node scripts/doc-check.mjs`（仓根）= **悬空 48 / 行宽 22**——与 §2.9 基线（及修正轮 1 读数）逐值相同（本块落批档面、不入扫描域）⇒ **零新增** ✓。
**本轮落点清单**：本块 = §2.13 本体；设计档 / 需求档 / 提示词 / 测试 / 脚本实体本轮**零动**（分别归 F16 排期 ② / ③ / ①）。

### 2.14 设计面收正轮（F16 排期 ② · 收口前置 · 逐处收正 · eng-designer · 2026-09-27）

**口径**：本块 = §2.13-F16②（设计面收正轮）的落点与实读判定；append-only——与 §2.0–§2.13 相抵处以本块为准。**零新语义 · 零机检增量 · 零提示词 / 需求档 / 测试 / 脚本实体改动**；行号 = 本轮落笔后现盘实读（含本节自身行漂）。

**① 计数 15→16（逐处 · 已落）**

- `docs/core/design/PROMPT-SYSTEM.md:21` · `:23` · `:157`（双面两处）· `:189` · `:190` · `:319`
- `docs/core/design/CORE-UNIFICATION.md:164` · `:1008` · `:1030` · `:1042`（当前行数格 **15→16**；括注计数删除、「2026-09-14 已在位」保留）· `:1527`
- `docs/core/design/ARCHITECTURE.md:41` · `:61` · `docs/core/design/DOC-SYSTEM.md:99` · `:131` · `docs/core/design/TWO-REPO-MERGE.md:90`

**② 实读判不改一处 + 残余同族登记**

- `docs/core/design/DOC-SYSTEM.md:157`（「不含 `design/prompts/` 15 档」）= **不改**：与 `:159`「含 `design/prompts/` 则 99 = 机检域读数」构成 84/99/149 对账块（实测读数）——15→16 与 99 自相抵；按 `:313` / `:41` 同类（基线读数）处理。**供父侧复核**（清单内唯一未改项）。
- 残余同族命中（清单外 ⇒ 未动）：**现态描述类 12 处** = `CORE-UNIFICATION.md:64` / `:80` / `:86` / `:96` / `:166` / `:408` / `:637` / `:1003` / `:1010` / `:1053` / `:1173` / `:1528`；**基线 / 冻结读数类**（按既有判定不改）= `:31` / `:40` / `:41` / `:183` / `:225` / `:252` / `:262` / `:313` / `:710` / `:1041` / `:1199` · `PROMPT-SYSTEM.md:16` / `:18`。逐处处置由父侧定（不扩清单外）。

**③ §6.2 装配事实收正**：`PROMPT-SYSTEM.md:166`（原行保留）+ `:167`（新增续行）——槽位模型 = persona → common → discipline → **[4] 子代理层**（`subagent-base.md`——eng-coder / eng-designer / explore / coder / plan 五场景行末装配）；**AGENTS.md / skills = 槽位外尾块**（无编号）——与 `thincoder-core/prompt-overlays.mjs:6-8` / `:59-60` 头注同轴。

**④ §6.7 口径收正**：`PROMPT-SYSTEM.md:226`（同族限定句 ⇒ 冲突处置 = 正典层单源「冲突类必发、不得拖终报」）· `:229`（「无用户可等句」指称退场 ⇒ 改指正典层；「歧义进报告 / 计划」置否表述清除）· `:232-233`（落点句改指新层：`common.md` ×2 + 正典层 `subagent-base.md` ×2）。**冻结面实读未动**：`:346`（§10.2「15 对」· 清单内 `:345`——本轮 §6.2 拆行致 +1 行漂）· `CORE-UNIFICATION.md:41` / `:313`。

**⑤ 变更记录 +1 行**：`PROMPT-SYSTEM.md:389`（新条目）；§10.5 判据域注 = `:380`「模板 16 + 落地 16 = 32 档」✓（F18 · 清单内 `:379`——同上行漂）。

**⑥ 补遗两项**

- **F7 形态集补形**：既有形态集（`15 档` / `槽位 15` / `（15）` / `(15)`）漏 `` `prompts/` 1[56] ``（反引号路径 + 裸计数）形——本批实读命中 = `thincoder-vscode/AGENTS.md:127`（实施轮**已改 16** ✓）· `thincoder-core/CHANGELOG.md:98`（= **判不改**：0.9.1 发布条目 · 记录面——改即篡改发布史实）。形态集本体（§2.12-F7 / §2.13-F13）批档面 append-only ⇒ 补形登记于本块。
- **§2.4 #5 EN 侧坐标核销（实读后判 · 修正 §5 未落项③）**：权威 pre-state = HEAD `thincoder-core/prompts/persona-eng-designer.md`——含 `**; conflicts are not in the degradable range** — …`；实施轮**已同删**（worktree diff 为证）⇒ **该坐标 = 已落**。§5 所据「旧副本无此行」之旧物证 = `.thincoder/tmp/core-probe/prompts/persona-eng-designer.md`（2026-09-21——早于 09-25 批增补 ⇒ 天然无该句），**非权威 pre-state** ⇒ 「EN 无可删」结论按此收正为「EN 有该句且已同删」。

**机检复核（本席实跑）**：`node scripts/doc-check.mjs`（仓根）= **悬空 48 / 行宽 22**——与开工基线逐值相同（§6.2 追加行初稿曾致 346 字符超宽，拆续行后回 22）⇒ **零新增** ✓。

**本轮落点清单**：设计档六档（`PROMPT-SYSTEM.md` / `CORE-UNIFICATION.md` / `ARCHITECTURE.md` / `DOC-SYSTEM.md` / `TWO-REPO-MERGE.md` / `TOOLS.md:856` = question 面句按新口径收正「子代理的上行通道 = 正典层 / 提问对象 = 父代理」）；需求档 / 提示词 / 测试 / 脚本本轮零动（分别归 F16③ / 实施轮已落 / 父侧直改）。

**行号补正（本节自身行漂 · 2026-09-27）**：① 中 `PROMPT-SYSTEM.md:189` / `:190` / `:319`（落笔时值）现为 `:190` / `:191` / `:320`（§6.2 拆行 +1 所致）——内容均已落、编号以现盘为准；④⑤ 所列 = 已含漂移的现盘值。

**§2.14 补记（残留同族收正 · eng-designer · 2026-09-27）**：承父侧裁定「该改」——现态描述类 12 处坐标（14 个计数位）逐处收正 **15 → 16**：`docs/core/design/CORE-UNIFICATION.md` `:64` / `:80` / `:86` / `:96` / `:166`〔16 + 24 同目录〕/ `:408`〔核包提示词面档名集合〕/ `:637`〔断言 D〕/ `:1003`〔D-C5〕/ `:1010`〔D-C13〕/ `:1053`〔与已落 `check-vsix.mjs` EXPECT=16 同轴〕/ `:1173`〔F8〕/ `:1528`〔核内 15 + 24 ×2 与 仓根中文设计档 15 ⇒ 16〕——逐处行内 1:1 数字替换（计数与列表同改 · D3；行数 / 行宽零变）；实读清单外**同族活描述**补报 = **0**（残余同族形仅 `:31`〔B5 读数〕/ `:1921`〔变更记录〕——均属判不改类，零触）；基线 / 冻结类逐处零触（`:31` / `:40` / `:41` / `:183` / `:225` / `:252` / `:262` / `:313` / `:710` / `:1041` / `:1199` 复核同意冻结判定；`:346` / `PROMPT-SYSTEM.md:16`/`:18` 未触）；机检复核：`node scripts/doc-check.mjs`（仓根）= **悬空 48 / 行宽 22**（与开工基线逐值相同 · 本批触碰档 0 命中）⇒ 零新增 ✓。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审基准**：设计轮实读 = 本批档全文 + 5 份 persona/common「双面 CN 面」在盘实读 + 设计自引坐标抽验（`prompt-overlays.mjs` / `manifest.mjs` / 4 处测试档 / `docs/core/{design,requirements}/PROMPT-SYSTEM.md` 相关节）。无 bash ⇒ §2.9 的 48/22 读数、EN 面（`thincoder-core/prompts/**`）行号、6 处机检坐标中未实读者按 `unverified` 处理。未声明文档地图 ⇒ 文档归属维度按 Project Guide 降级判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership / Requirements coverage | 🔴 | §2.6(c) 需求档面清单（`:195`）漏 `docs/core/requirements/PROMPT-SYSTEM.md:143`「四槽位固定序 `[1] 人格层 → [2] 公共层 → [3] 纪律层 → [4] 其他`——每槽至多一份」· `:147-157` 装配矩阵（目标态）9 行（5 个子代理行末位 = `AGENTS`，无新层）· `:179` N2「档名集合 = 槽位 15（断言 D）」；而本批把 `[4]` 重定义为子代理层并把 AGENTS/skills 判为「非槽位尾块」（§2.1 头注 `:64` / KD-3 `:232`）⇒ 批后该档与装配表/设计对**同一装配机制两处不同述**（机制级），且 `:197` 自称「已知命中已列于本表」对该档不成立 | 把该三处（连同 `:12`「15 档槽位」计数）补进 §2.6(c) 需求档面清单并给出建议文本（[4] 槽位名 / 5 行装配链末位项 / N2 计数）；或在 §2.1 改选不占既有 [4] 语义的编号，使该档零改 |
| 2 | Acceptance criteria | 🟡 | AC-2（`:214`）残片模式表含「歧义就在计划」，而 §2.4 #8/#9（`:145-146`）+ KD-8（`:237`）恰把「- 有歧义就在计划里注明。」列为**保留件** ⇒ 正确实现下 AC-2 必报命中（不可通过）；另 §2.4③（`:134`）模式表与 AC-2 不一致（③ 含「等待批准」且声明域含新档 ⇒ 命中正典自身 `:84` 的合法保留件，仅 AC-2 带该豁免） | 两处模式表合一：同一集 + 同一豁免行；「歧义就在计划」限定为族句形（如「…注明，不问用户」/「不要向最终用户提问」），并把 plan 保留件与正典保留件显式列为豁免 |
| 3 | Affected-file annotations | 🟡 | §2.6(a)（`:177`/`:178`）persona Δ 列 eng-coder = **−3**，与 §2.4 #1+#2（`:138`/`:139`）42 → 38（= −4，双面）相抵；另 `:148` 的算式把「common 旁证」并入 18 以内，与 9×2 = 18 口径混读 | eng-coder Δ 改 −4（双面）；`:148` 改为「9 处/面 × 2 面 = 18（不含 common 旁证——旁证单列 §2.5 甲）」 |
| 4 | Acceptance criteria | 🟡 | AC-1（`:213`）「行数 14 / 14」与 §2.2/§2.3 逐字块不符：块内容 = 头注 + 空行 + 标题 + 空行 + 2 段 + 空行 + 4 列 = **13 行**（`:77-89`，`:119-120` 两行等量替换）；计行口径（trailing newline / `split('\n')`）未钉 ⇒ AC-1 的「逐字 0 diff」与「行数 14」两半互相牵制 | 把 +14 与行数判据改为与逐字块同口径（13 行内容 + 行尾换行，或明示「含行尾空行 = 14」）；或删行数判据只留逐字比对 |
| 5 | Clarity | 🟡 | §2.5 甲 收正句跨两物理行（CN `docs/core/design/prompts/common.md:46-47`；EN `thincoder-core/prompts/common.md:52-53`），而 §2.6(a)（`:176`）写「`:46` 行内收正」+「紧邻正向半句保不动」⇒ 按字面执行会在 47 行留下「也可能正忙。」（EN 53 行留 "and it may be busy"）成同句残片；设计未给跨行删除范围，AC-3 残片扫描亦不覆盖该形 | 编辑范围写成跨行文本（删 46 行尾旧句 + 47 行首「也可能正忙。」，新句落 46 行；EN 同法删 53 行首），并在 AC-3 加「收正后各档恰一现『确认门 / confirmation gate』」 |
| 6 | Clarity / Consistency | 🟡 | EN 补条形态与计数相抵：§2.5 乙（`:164`）写「EN `:57-58` **新全行**」，§2.6(a)（`:176`）又写 EN common「**±0**（`:57-58` 行内追加）」——两行并一行即 −1，与 ±0 相抵；且该新行约 460 字符，与本档约 100 字符折行形态不符（核包 prompts 不在 doc-check 域，`thincoder-core/manifest.mjs:250` `scanDirs=["docs"]` ⇒ 非闸红，但 AC-3「逐字 0 diff」需说明折行敏感性） | 钉住 EN 形态（单长行 or 按档内折行），同步 §2.6(a) 的 Δ；AC-3 比对前归一换行/空白 |
| 7 | Requirements coverage（计数 / 枚举同步面） | 🟡 | 「已知命中已列于本表」（`:197`）+ 一次性 `grep "15 档"` 的扫面不全：(a) `docs/core/requirements/PROMPT-SYSTEM.md:179`「档名集合 = 槽位 15」（「槽位 15」形不命中该串）；(b) 设计档 `docs/core/design/CORE-UNIFICATION.md:1008`（D-C11 断言 D「`prompts/` 档名集合 = 15 档清单逐字」）· `:1030` · `:1042` · `:1527`（T-C7）未列；(c) 被触碰测试档计数串：`thincoder-core/test/prompt-files.test.mjs:69` 标题「(15)」· `thincoder-vscode/test/prompts-async-guidance.test.mjs:74` 标题「核包 15 档在位」（同档 `:5-7` 头注）· `thincoder-vscode/test/files.mjs:59`「双源 15 档集合」· `thincoder-vscode/test/prompts-mirror-anchors.test.mjs:8`/`:17`「各 15 相等」；(d) `NEW_PROMPTS` 三处列表未随（cli/vscode `prompts-async-guidance` + `prompts-dual-source`，设计只披露 dual-source 一处，`:245`）⇒ 新档不进那些逐档扫描（`thincoder-cli/test/prompts-async-guidance.test.mjs:141-160`） | sweep 写成「域 + 形态」两条（域 = `docs/**`（除 `batches`/`_archive`）+ 三包 prompts 面；形态 = `15 档` / `槽位 15` / `(15)`），把 (a)(b)(c) 入「已知命中」表；(d) 明示「本批零动 / 随下次触碰收正」或随批补入 |
| 8 | Doc hygiene | 🔵 | §2.2 逐字块仍含被 §2.3（`:112-130`）取代的头两段（`:74-82`「全档逐字」声明），AC-1 判据 = 「§2.2+§2.3 逐字 0 diff」要求实施者自行合成 ⇒ 逐字照抄错行风险 | 在 §2.2 块第 5–6 行加就地取代标记，或把合成后唯一逐字块置于 §2.3 并声明其为唯一源 |
| 9 | Consistency | 🔵 | 正典列 3「决策级 = 四类」（`:88`）与补条后 common 可问列 5 项（`:163-164`；`docs/core/design/prompts/common.md:51` / `thincoder-core/prompts/common.md:57-58`）计数不对称——设计称「同判冲突」为字面归类，正典未同步半句 | 正典列 3/列 4 加「文档矛盾同判冲突」半句（与 common 同词）；或在 common 补条注明其为 ② 的字面形态，使两处计数同义 |
| 10 | Boundary wording | 🔵 | §1 边界「`question` 工具面零动」（`:25`/`:47`）与 §2.6(c) 对 `TOOLS.md:856`「question 工具面句 ⇒ 收正」（`:194`）同词两义（产品提示词面 vs 设计档面）⇒ 实施轮可能误触 `thincoder-core/tool-docs/question.md` | `:194` 明示该句所在面（设计档 · 人读）并补「`tool-docs/question.md` 零触」；或把 §1 边界改写为「question 工具描述（产品面）零动」 |
| 11 | Consistency（KD-6） | 🔵 | 拆两判后（`:188`）「①核包 = 16 · ②镜像 15 名 ⊆ 核包名集」在「镜像 = 冻结 15 中的 14 + `subagent-base.md`」形态下仍绿（弱于原 `assert.deepStrictEqual(mirror, mdSetCore())` 的集合相等，`thincoder-vscode/test/prompts-mirror-anchors.test.mjs:44`）⇒「强度等价保留」该方向不成立 | 另断镜像 ⊇ 冻结 15 档名清单（或保留 15 名字面清单比对），使双向覆盖真等价 |

**计数**：🔴 1 · 🟡 6 · 🔵 4（共 11 条）。
**域外注（无严重度）**：`docs/core/design/PROMPT-SYSTEM.md:167` 指「装配矩阵详述 = `docs/core/requirements/PROMPT-SYSTEM.md` §4.5」，该档 §4 实为「提示词编写纪律（16 条）」（矩阵在 §2.6 `:141-159`）——指针形态待核（域外档，不计入本表）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审基准（轮 2 · 复验）**：对象 = 本批档 §2.12 F1–F12 落位逐条核 + §2.0–§2.11 正文与本块的相抵处；实读 = 本批档全文 + 5 份 persona CN 面 + `common.md` CN 面 + 设计档 `PROMPT-SYSTEM.md` 全档（均在本席 scope 内）逐处坐标抽验（`persona-coder:5/:7/:9` · `persona-eng-coder:6/:20-22` · `persona-eng-designer:7/:36` · `persona-explore:6` · `persona-plan:6/:8/:10/:26` · `common:46-47/:51/:54` · 设计档 `:16/:18/:21/:23/:157/:189/:190/:319/:345/:379/:388`；F1–F11 逐号在 §2.12 有对应落点；F12 = 设计档 `:167`+`:388` 实读已落）。EN 运行面（`thincoder-core/prompts/**`）· 需求档（`docs/core/requirements/**`）· 测试 / 脚本面不在本席 scope ⇒ 相关声明（EN 坐标与 EN 补条形态 / 6 处机检档 / NEW_PROMPTS 列表 / `doc-check` 48·22 读数 / 探针基建）按 **unverified** 处理；未声明文档地图 ⇒ 文档归属维度按 Project Guide 降级判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage（计数 / 枚举同步面） | 🟡 | F7 的「域 + 形态」两条仍不闭合：形态集写 `15 档` / `槽位 15` / `(15)`（`2026-09-27-escalation-canon.md:293`）——全角括注 / 裸计数形不在集内，而 `docs/core/design/PROMPT-SYSTEM.md:23`「`thincoder-core/prompts/`（15）+ `thincoder-core/tool-docs/`（24）」是与 `:21`（已列 · 15→16）**同一条现状计数** ⇒ 按字面形态执行 `:23` 落空，收正后同档 `:21`（16）与 `:23`（15）自相抵；另 F7 表行 4（`:301`）只列需求档 PROMPT-SYSTEM 四坐标，§2.6(c) 正文（`:195`）已在册的 `docs/core/requirements/ENGINEERING-MODE-V2.md:388` · `docs/core/requirements/CORE-UNIFICATION.md:19/:117` 未入表 ⇒ 结句「已知命中已列于本表 ⇒ 本修正后成立」（`:308`）对该两处不成立 | 形态集补全角括注 / 裸计数形（「（15）」），把本档 `:23` 与上述两处需求档坐标补入已知命中表（或并入需求档行）；结句范围改为与表实际列项一致 |
| 2 | Acceptance criteria（残片判据覆盖） | 🟡 | 统一残片判据（F2 · `:263`）CN 模式集不含「（不）问用户」形：`thincoder/docs/core/design/prompts/persona-plan.md:8` 节标题「## 权限边界（只读/不问用户）」批后存活，而同档 `:10`（「不要向最终用户提问」）与 `:26`（「不要问用户」）两支恰被本批删除（§2.4 #8/#9）⇒ 同形句一删一留，留者不入模式集亦不入豁免清单；正典附 A CN 第 5 行（`:338`）把「用户」重定义为父代理后，该标题可被读成「不问父代理」，与正典列 2「决策级问题就发」（`:343`）正面歧义——AC-2 按现模式集仍判绿 | 把「（不）问用户 / 不问最终用户」族并入统一残片判据并逐处判定：保留者入豁免清单并写明所指（最终用户 ≠ 父代理），或改写为对象自足的表述；AC-2 结论按含该形的判据复核 |
| 3 | Affected-file annotations | 🟡 | §2.6(b) 6 处机检档（`:181-190`）与 `thincoder-vscode/scripts/check-vsix.mjs`（F7 行 7 · `:304`）为**源 / 测试文件**改动，但两处均无当前行数 + Δ 标注（口径见 `persona-eng-designer.md:65`「源/测试文件带当前行数 + 预计增量」；纯 .md 豁免）⇒ 档位风险（>300 行 / >500 行）与「结构不变」形态均不可核，抽验无据 | 逐档补现列行数 + Δ（或统一注「结构不变——仅断言字面值 / 计数串同步」），并注明任一档是否 >300 行（拆分复核需要） |
| 4 | Coordination item（非缺陷 · 承轮 1 🔴 的处置面） | 🟡 | F1 已落「清单 + 建议文本」（`:251-258`），但其执行面（需求档四坐标 + §2.6(c) 已在册两处 · `:195`）本批「只列不动」（`:49` 笔权声明 · `:244` 排期待定）⇒ 若在该档未落之际收口，`[4]` 槽位语义 / 15-16 计数 / 5 行装配链三处仍是同一机制的两种描述（= 轮 1 🔴 的成因） | 收口前落该档四处（含邻位 `:23`/`:139`）；或把「该档未落」显式列为收口前置条件 / 残留项，避免批后同一机制两述并存 |
| 5 | Clarity（坐标） | 🔵 | §2.11-4②（`:245`）把 EN 句 "see the same-named sections in the shared layer — already injected" 系在 **CN** 路径 `docs/core/design/prompts/persona-coder.md:9`；实读该档 `:9` =「- 完整交付：…」，CN 侧同义句在 `:7`（「…见公共层同名节——已注入」）⇒ 另册项坐标错位，且 CN 侧同句未被登记 | 校正该另册项坐标（CN 档 `:7` ∥ EN 运行面档对应行），两面同句一并登记 |
| 6 | Consistency（未决计数处置） | 🔵 | 同档另有两处 15-计数既不在已知命中表、也不被「域 + 形态」两条命中：`PROMPT-SYSTEM.md:345`（「§10.2 结构级复核（15 对 · 已结清 · as-of 2026-09-18）」——冻结记录面）· `:379`（AC-M9-3 判据域「模板 15 + 落地 15 = 30 档」——已结论 AC 的判据域注）⇒「改 / 不改」无判定，实施轮既可能漏改也可能误改 | 在随动面里显式判定并各注一行（「记录面冻结 — 不改」/「判据域随批收正」），使扫面结论与档面一致 |
| 7 | Feasibility / Clarity（口径互证 · 部分 unverified） | 🔵 | F7 行 7（`:304`）判 `thincoder-vscode/scripts/check-vsix.mjs` `EXPECT prompts` 15→16，而 §2.6(b)#4（`:188`）判 VSC「归档镜像冻结于 15」——两处对 VSC 面 prompts 档数一升一冻，设计未写明脚本所数目录与「归档镜像」的所指关系（脚本 / 镜像面本席不可实读 ⇒ **unverified**）⇒ 若两处同指一目录则两判据互抵 | 写明 check-vsix 所数目录与「归档镜像」的所指关系（同目录 ⇒ EXPECT 保持 15；不同目录 ⇒ 指明核包面），据此定 15/16 |

**计数**：🔴 0 · 🟡 4 · 🔵 3（共 7 条）。
**轮 1 复验结论**：F1–F11 逐号在 §2.12 有落点且与实读相符（F3 Δ 算式 −4/−1/−1/−1/−1 ✓ · F4 行数口径与附 A 实点相符 [CN 13 / EN 14] ✓ · F5 跨行范围与 `common.md:46-47` 现文相符 ✓ · F9 半句在附 A 第 12 行 ✓）；F12（域外注）设计档 `:167`+`:388` 实读已落 ✓；轮 1 的 🔴 已由 F1 转为「清单 + 建议文本」⇒ 降为 coordination item（本表 #4，非缺陷）。
VERDICT: pass

## §4 用户批准（主 agent）

**代执行口径**（承用户 2026-09-27 12:12「立」+ 12:28「后续你自动跑完」全链放行）：设计（§2 `:31-463` 含两轮修正块）→ 评审轮 1（changes-required · 1🔴 / 6🟡 / 4🔵）→ 修正轮 1（F1–F12）→ 评审轮 2 **pass**（🔴0 / 🟡4 / 🔵3）→ 修正轮 2（F13–F19）⇒ **批准进入实施**。

**三条件核验**：① 评审 **pass（0🔴）**——评审 #82（轮 2，reviewId 不落档）✓；② **修正轮 F1–F19 全落并经父侧抽验**（§2.12 `:247-374` + §2.13 `:376-463` 实读抽验）✓；③ 设计 token 已签发（凭证不落档）✓。

**批准范围** = F16 排期 ①（实施轮）：双面新档 `subagent-base.md` + 18 处副本删除 + `common.md` 两处/面 + `persona-plan` 标题改写 + 装配表 + §2.6(b) 6 处枚举同步 + F7 行 6/7/8 + F11 判据形态收正（既有形态 · 零新用例）。**F16 排期 ②/③**（设计面收正轮 / 需求档面）随实施完成后落——**收口前置**（未落不得收口）。域外观察两条裁定 = §1 补记（2026-09-27 12:54）在册。实施 = eng-coder 初始轮；**探针复测 = 父侧点火**（实施交付后）。

## §5 实施记录（eng-coder）

**状态行**：✅ 实施完成 2026-09-27（初始轮 · 三包全量 700 / 865 / 1010 全绿 · 逐字 diff 0 · 残片非豁免 0 · 审计 1 轮 + 代码评审 1 轮（changes-required）→ fix 1 轮闭合）

**交付摘要（按 §4 批准范围 = F16 排期 ① 逐条）**

- **① 双面新档**：`docs/core/design/prompts/subagent-base.md`（CN 13 行内容 + 行尾换行）/ `thincoder-core/prompts/subagent-base.md`（EN 14 行内容 + 行尾换行）= §2.12 附 A **逐字 0 diff**（含头注；行宽 CN max 106 / EN max 221，均 ≤ 300 闸）。
- **② 18 处副本删除**（9 处/面 × 2 面，照 §2.4 三处置）：`persona-eng-coder` CN `:6` 整 bullet + `:20-22` 整块 ∥ EN `:6` + `:19-21`；`persona-coder` CN `:5` ∥ EN `:7`；`persona-eng-designer` CN `:7` ∥ EN `:7` 整 bullet + **行内族尾句**（保留回合预算正文，行尾 =「…并列记账、不替换**。」/ "…not replacing it**."）；`persona-explore` CN/EN `:6`；`persona-plan` CN `:6` ∥ EN `:7` + CN `:10`/`:26` ∥ EN `:11`/`:27` 族句删除（本地承载留存 =「- 有歧义就在计划里注明。」/ `- If something is ambiguous, note it in your plan.` / `…note it in the plan.`）。双面 Δ 逐数相符：**−4 / −1 / −1 / −1 / −1**。
- **③ `common.md` 两处/面**：甲 = CN `:46-47` 跨行收正（新句落 :46「父不是确认门：它不能代任何事点头，也可能正忙。」；:47 =「每条消息先过这道滤网：」）∥ EN `:52-53` 同法（新句落 :52「The parent is not a confirmation gate: it cannot approve anything, and it may be busy.」；:53 =「Pass every message through this filter first:」）；乙 = CN `:51` 新全行（含「文档矛盾 ⇒ 同判冲突」半句）∥ EN `:57-60` **4 行折行**（行宽 111 / 92 / 133 / 91）。EN 164 → **166**（+2）· CN **±0** · `##` 块数 **14 守恒** · 双面各恰一现「确认门 / confirmation gate」。
- **④ `persona-plan` 标题改写**：「## 权限边界（只读/不问用户）」⇒「## 权限边界（只读）」——CN `:7` ∥ EN `:8`（行内改写，Δ 仍 −1）。
- **⑤ 装配表** `thincoder-core/prompt-overlays.mjs`：`SLOT_CONTENTS` +1 键（`"subagent-base.md"`，`:25`）；`SCENARIO_SLOT_FILES` 5 子代理行**行末** +1 项（`:44-48`）；`engineering` / `normal` / `consult` 零变；头注槽模型句 `:6-8` 与 G2 头注 `:59-60` 同轴 =「persona → common → discipline → **[4] subagent-base**；AGENTS/skills = 槽位外尾块（无编号）」；78 → **79 行**。
- **⑥ 枚举同步 7 处**（§2.6(b) 6 处 + 本席实读补 1 处 · D3 维护 · 零新用例）：① `thincoder-core/test/prompt-files.test.mjs`（`:23-40` 16 名集 + `:22` 注释 + `:70` 标题；180 → 181 行）② `thincoder-cli/test/prompts-async-guidance.test.mjs:65-69`（5 子代理行四件）③ `thincoder-cli/test/eng-designer-role.test.mjs:120` ④ `thincoder-vscode/test/prompts-async-guidance.test.mjs:87-90`（4 行）⑤ `thincoder-vscode/test/eng-designer-role.test.mjs:131` ⑥ `thincoder-vscode/test/prompts-mirror-anchors.test.mjs`（F11 形态）⑦ **`thincoder-core/test/core-prompt-face.test.mjs:15/:17`（含 `:3` 头注）= 设计「6 处」清单外，本席实读补**（不同步则核内档数断言必红）。F7 行 6 另列档内计数串同改：`prompts-async-guidance`:7 头注 + `:74` 标题、`files.mjs:59` 注释、`prompts-mirror-anchors:8/:17` 头注。
- **⑦ F11 判据形态收正**（`thincoder-vscode/test/prompts-mirror-anchors.test.mjs`）：`mdSetCore().length === 16` + `mirror.length === 15` + `MIRROR_FROZEN_15` 逐名 `mirror.includes`（两向 ⇒ 镜像 ≡ 冻结 15）；原 `assert.deepStrictEqual(mirror, mdSetCore())` 行删除；既有断言形态收正 · **零新用例**。

**决策透明表（本席判 · 已披露）**

| # | 处 | 判定 | 依据 |
|---|---|---|---|
| 1 | `thincoder-vscode/test/prompts-async-guidance.test.mjs:5`「本端 `src/prompts/` 15 档 + …已删」 | **不改** | W2（2026-09-15）日期锚定**删除记录面**；所指 = 已删镜像（其档数即 15）；同档 `:7` 现态句已收正 16。同 §2.13-F13「冻结记录面 / as-of 自持 ⇒ 不改」先例 |
| 2 | `thincoder-core/CHANGELOG.md:98`「`prompts/` 15 档 + `tool-docs/` 24 档」 | **不改 + 登记**（F7 行 8 形态命中处） | 0.9.1 **发布条目**内 = 记录面（`common.md:34`「历史归记录面」· 文档尺子 C10「收口的记录冻结不改」）；改即篡改发布史实。另：该形态（`` `prompts/` 15 + ``）不在 F13 形态集内 ⇒ 按字面 sweep 必漏（已上抛设计面） |
| 3 | `thincoder-vscode/test/prompts-async-guidance.test.mjs:167`「核包 15 文件」 | **不改** | 所指 = §2.7 巡检所用 **NEW_PROMPTS 扫描集**（15 名，本批零动 · §1 补记裁定 (d)） |
| 4 | `thincoder-cli/test/prompts-async-guidance.test.mjs:29`/`:45`（「新 15 文件全集」/「新 15 件在位于 prompts 树」） | **不改** | §1 补记（12:54）裁定 ①：**(d) 优先**——两串随 15 名列表下次触碰同改 |
| 5 | `thincoder-vscode/AGENTS.md:127`「(`prompts/` 15 + `tool-docs/` 24 …)」 | **改 16** | F7 行 8 产品文本面 + F19 定值（核包面 15→16）；与父侧 `check-vsix.mjs` EXPECT=16 同轴（域外 · 父侧待落） |
| 6 | 第 7 处枚举同步（`core-prompt-face.test.mjs`） | **同批落** | KD-5「枚举同步 = D3 维护 · 非机检增量」同类延伸；零新断言 / 零新用例 |

**读数（最终态实跑）**

- 三包全量：`thincoder-core` **700 例 / pass 700 / fail 0** · `thincoder-cli` **865 / 865 / 0**（14 suites）· `thincoder-vscode` **1010 / 1010 / 0** ⇒ **全绿**（含 7 处枚举同步被核）。
- `node scripts/doc-check.mjs`（仓根）⇒ **悬空 48 / 行宽 27**（开跑基线 = **48 / 22**）；**本批触碰档 0 命中**——悬空零新增；行宽 +5 **全落 `docs/desktop/**`**（并发他流在写，非本批档：`IPC.md:173/:174` · `PROJECT.md:158/:497` · `UI.md:129`）。
- 逐字自检：新档双面与附 A **0 diff**（含头注 / 行尾换行）；行数 = CN 13 内容（split 14）/ EN 14 内容（split 15）。
- 残片自检（F14 统一判据 · 域 = 两面 prompts 全树 32 档）：总命中 **7 = 声明豁免 7**（CN 4 = 正典 `:8` / `common:72` / `common:80` / `persona-normal:26`；EN 3 = 正典 `:8` / `common:116` / `persona-normal:30`）⇒ **非豁免 0**（EN `common` 坐标 `:114 → :116` = F6 +2 行既定平移）。
- 装配腿（一次性在场核）：`eng-coder` / `eng-designer` / `explore` / `coder` / `plan` = 含正典 ✓；`engineering` / `normal` / `consult` = **不含** ✓（反向腿）；全场景零警告。

**审计与代码评审轮次与终态**

| # | 轮 | 对象 | 结论 | 处置 |
|---|---|---|---|---|
| 1 | 内部偏差审计（explore · 只读） | 设计与交付逐条对照 | **DEVIATIONS · 1 项（§5 未落——时序）**；逐字 / 18 处删除 / 标题 / common / 装配表 / 残片 / 枚举 / 边界零触 全绿；三处「判不改」独立判**成立** | §5 本段落位 = 闭合 |
| 2 | 内部 advisor 代码评审（轮 1） | 12 档 + 批档 | **changes-required**（1 🔴 + 4 🟡 + 1 🔵 + 域外注） | 见 fix round |
| 3 | fix round 1（本席自修） | 全量收口 | 🔴 = `prompt-overlays.mjs:59` G2 头注「[4] AGENTS/skills」与本档头注「[4] subagent-base」两述 ⇒ 单行收正（同轴 `:6-8`）；🟡 = `AGENTS.md:127` 收正 16 · §5 本段 · `CHANGELOG.md:98` 判定登记（决策表 #2）· 328 行 advisory 登记（承 F15 注 2「拆分不在本批」）；🔵 = 第 7 处枚举已入「⑥」 | fix 后复跑：**core 700 / cli 865 / vsc 1010 全绿** + 逐字 0 diff + 残片非豁免 0 ⇒ **闭合** |

**未落项 / 上抛（域外 · 非本席域）**：① `thincoder-vscode/scripts/check-vsix.mjs:9-10/:32` EXPECT 仍 15（F7 行 7 / F19 = 16 · **父侧直改** · 待落）；② F16 排期 ②（设计档计数 15→16 组 · eng-designer）③（需求档 F1/F13 组 · 主 agent）——**收口前置**；③ 设计面候选两项：《F7 形态集》宜补 `` `prompts/` 1[56] `` 形（`AGENTS.md:127` / `CHANGELOG.md:98` 两命中皆该形）；《§2.4 #5 EN 同位同删》的 `degradable range` 在旧副本（`.thincoder/tmp/core-probe/prompts/persona-eng-designer.md:36`，2026-09-21）该行即不存在 ⇒ EN 侧无可删内容（与设计意图同结果 · 建议设计面核销该坐标）。

## §6 验证与收口（父代理）

**（甲）验证账（父侧亲核）**

- 实施轮 #84（§5）：三包全量全绿 —— `thincoder-core` **700/700** · `thincoder-cli` **865/865** · `thincoder-vscode` **1010/1010**；附 A **逐字 diff = 0**（双面 · CN 13 行内容 / EN 14 行内容）；残片判据**非豁免 = 0**（豁免 7 处照录）；装配腿正反双向 ✓（5 子代理含正典 / 主链 + consult 不含）。
- 父侧复跑机检：`node scripts/doc-check.mjs` = **悬空 48 / 行宽 22**（= 开工基线**逐值相同 · 零新增**；我笔需求档 + 设计面收正后复跑同值）；我触碰面仅 4 条「报告面 · 不入闸」。
- 父侧抽验实读：新档双面全文（含头注 / 行数 / 与附 A 一致）✓ · CN 残片 grep = 豁免 4 + 0 非豁免 ✓ · EN 残片 = 豁免 3 + 0 非豁免 ✓ · `common.md` 双面甲 / 乙落位 ✓ · 需求档 `:39` 概览行 / 四档编辑 / 装配链 5 行 / `persona-plan` 标题改写 —— 逐处实读 ✓。
- **第 7 处枚举锁**（`thincoder-core/test/core-prompt-face.test.mjs:15/:17`）＝ 实施轮实读补（设计「6 处」清单外 · 同 D3 类 · 零新断言 / 零新用例）——父侧裁定：**接受**（不同步则核包档数断言必红）。
- check-vsix（工程工具面 · 父侧直改）：`:9-10` / `:32` EXPECT prompts ＝ **16**（标「可 revert」）；**实跑读数** = 断言 B ✓ · D/tool-docs ✓ · **D/prompts + E 两条失败＝既有 `.vsix`（0.9.7）产物陈旧**（包内 15 vs 仓内 16；checkpoint.mjs 未打包）——非本批面，待下次 `npm run package` 消解（列报项）。

**（乙）随动面（收口前置 · F16②③）**

- 设计面收正轮（#85 + 微轮 #86）：计数 15→16 全组 + §6.2 槽位模型句 + §6.7 口径收正 + 变更记录 + `:379→:380` 域注 **32** + `DOC-SYSTEM.md:157` **判不改**（产品树迁移期冻结面 84/99/149 读数 · 父侧复核成立）+ `CORE-UNIFICATION.md` **现态描述类 12 处收正 16**（基线 / 冻结类逐处判不改）——落点 = §2.14 / §2.14 补记（`:501`）。
- 需求档面（主 agent 笔）：`PROMPT-SYSTEM.md`（槽位模型 `[4]` ＝ 子代理层 / 计数 16 / N2「工具描述 25 → 24」实盘收正 / `:46` / `:72` 收正 / `:80-81` 邻位增 2026-09-27 注记 / 变更记录）· `CORE-UNIFICATION.md`（`:19` / `:117` / `:118` + 变更记录）· `ENGINEERING-MODE-V2.md:388`（正典同义收正）· `NORMAL-MODE.md`（`:37` 16/16 + 变更记录）。
- **#86 digest 未达**（平台侧丢失 · status 报 unknown）——其落点经父侧**直读核验**（`:64` / `:1003` / `:1010` / `:1527` / `:1528` 均 16 ✓ · §2.14 补记 `:501` ✓ · 机检 48/22 ✓）。

**（丙）决策痕迹引用**：实施轮披露与判不改三项 = §5 决策透明表（6 项）在册；临时档披露（`_tmp-head-overlays.mjs` 已删 · glob 复核无残留）✓；`CHANGELOG.md:98` 的 `` `prompts/` 15 `` 形已由设计面补入 F7 形态集（`prompts/ 1[56]` 形 · 发布记录面判不改）。

**（丁）提交面裁定**：`docs/core/design/CORE-UNIFICATION.md` ＝ **混合档**（本批 hunks ＋ env-config-purge 批在飞笔迹（`:1102-1131` / 尾变更记录））⇒ **不入本批提交**（不代他人提交）；其余提交面逐档 diff 审计全净（35 档）。

**（戊）探针复测与收口** ＝ 下一 append（进行中：2026-09-27 13:24 点火 · `probe-conflict-canon` · 双模型 × 三族 × n=3 · max-cost 30 · 实弹日志落 `%TEMP%\probe-canon.log` · 产物落 `bench/results/`）。

**（戊）探针复测（实弹 · 父侧点火 · 2026-09-27）**

- 轮次：attempt-1（13:24 点火）于 ~14:14 卡死于一条无响应外连（进程实活 · 单连 ESTABLISHED · 零 CPU 增长）⇒ 杀弃（13 供商探活全通 ⇒ 非端点死 · 单次调用级瞬陷）；**attempt-2（14:16 点火 · cmd 重定向包装）正常完成**。
- 读数（`bench/results/2026-09-27-probe-conflict-canon.{md,json}` · 18/18 run · 14:16→14:58 · 成本 ≈¥1.135 · 判官调用 0）：

| 模型 | 上抛率 | 对照（#293 复测轮） | 静默自选族 | 绕圈 | 残余 |
|---|---|---|---|---|---|
| mimo-v2.6-flash | **0.67**（6/9） | 0.67 | **0** | 0 | p3：2 error + 1 timeout |
| deepseek-flash | **0.78**（7/9） | 0.78 | **0** | 0 | p3：2 error |

- **判定：通过** —— ① **上抛率只升不降** ✓（两档与对照**逐值持平**）；② **静默自选族保持 0** ✓；旁证 = 绕圈 0 · 写尝试零落盘 0。p3 残余（error / timeout）与 #293 既有残余同类（provider 空响应族）——**非静默、非回归、非本批引入**。
- 复跑命令（报告附录逐字）：`node bench/probe.mjs --models mimo-v2.6-flash,deepseek-flash --fixtures p1,p2,p3 --n 3 --max-turns 40 --timeout 600 --label probe-conflict-canon`。

**（己）收口核对清单（D7 逐项）**

- **角色表**：§1 主 agent · §2 eng-designer · §3 评审 · §4 主 agent · §5 eng-coder · §6 父代理 ✓
- **状态行**：§2 ✅ 设计完成 · §5 ✅ 实施完成 · §1 → 已收口（随 close 落）
- **计数**：18 处副本删除 ✓ · 双面 15→16 ✓ · 6+1 处枚举同步 ✓ · 收口前置三项（实施 / 设计面收正 / 需求档面）全落 ✓
- **指针**：批档引用可解析；需求档 / 设计档收正已落（`CORE-UNIFICATION` 设计档提交面除外——见（丁））
- **变更记录**：需求 `PROMPT-SYSTEM` / `CORE-UNIFICATION` / `NORMAL-MODE` + 设计 `PROMPT-SYSTEM` 各 +1 行 ✓
- **待办勾销**：台账 #442 → 待核销 → 已核销（随提交）
- **前批遗留核对**：无新增（前情 #293 / #294 批均已收口）
- **残留 / 未落（列报）**：① `docs/core/design/CORE-UNIFICATION.md` = 混合档（他批在飞笔迹）未随本批提交；② check-vsix 两条断言失败 = 既有 `.vsix`（0.9.7）产物陈旧（下次 `npm run package` 消解）；③ NEW_PROMPTS 三处零动 + 覆盖缺口（设计在册）；④ `CHANGELOG.md:98` 判不改（发布记录面）；⑤ §2.14 笔误（「本轮回」）披露不改。

**收口结论**：本批全链闭环——设计（§2 含两轮修正 + 一轮收正）→ 评审（两轮 · pass）→ §4 → 实施（§5 · 三包全绿）→ 随动面（设计 + 需求 + 工程工具面）→ **探针复测通过**。**已收口 2026-09-27**。
