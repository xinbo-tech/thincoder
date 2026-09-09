# PROMPT-ATTENTION-RESTRUCTURE 阶段 A 切分方案（施工图——SPLIT-PLAN）

> 所属设计：docs/design/PROMPT-ATTENTION-RESTRUCTURE.md（156 行定稿——评审 #3 PASS——designId 60ff4e55）。
> 状态：**阶段 A 定稿——用户 2026-09-09 批准 6 项裁定**（① 开关段序 = banner 后 S2 ② markdown 表行 → 条目转换
> ③ 建标题骨架 ④ 工程-sub L3/L14 重复只拆不删 ⑤ 命令句化只标不改 ⑥ L16 digest 锚句保完整）。
> 权威源：本方案以 CLI 仓 src/prompts/ 原文为字节源实测（2026-09-09 explore）；**VSC 落地以该端原文为字节源
> 照抄切分**——端特有段各端保留（设计范围边界——双端同源不硬一致）。
> 施工后产出记录于 docs/design/README.md 地图。

---

## 通用施工约定（各文件适用——eng-coder 必读）

1. **零语义改动**：只断行/换行/换位/提权——**不改任何一个字**。切分边界符 = `## ` / 编号边界（`1.` `①`
   `(a)` `R1`…）/ `。 - ` / `——` 与 ` — `——句子无边界时在 `。` `；` `, ` 后纯折行。
2. 15 文件均无 ``` 代码围栏——但**内联引用不切**：`| # | Action | Detail |`、`[DESIGN-TOKEN:<token>]`、
   `action:'consume-design'`、`"OK / 可以 / continue"` 整块保行不切断。
3. **Markdown 表行不可换行**（用户裁 #2）——凡表行 >200（engineering.md 状态表 L30-40、discipline.md
   路由表 L35-74 区）→ **表 → 逐条 `- **State** → action` 条目对转换**（词序保原——纯格式）。
4. 保逐字整句不拆 = 核心纪律句族 + A2/A4 + 行内引用（阶段 D 分类）——整句独占一行——内不拆（若 >200 且
   有 `——`/`；` 边界可折行但句子归属不变）。
5. 列举型 A1/A3 子条（①-⑤）→ 子条独立行——子条级关键词保行内（阶段 D 子串断言）。
6. 标题（`##`/`###`/伪标题 `**xxx:**`）全部**独占一行**（用户裁 #3——建标题骨架——含新节名"核心纪律"
   "推进档位"等）。
7. 断行落在边界——锚定子串保持完整。行号锚（main L8/L13、engineering step4 L16）与 escSeg 切片改
   内容特征锚由阶段 D 测试批处理——重排时只保子串存活。
8. 命令句化**只标不改**（用户裁 #5）——原词保留——不动任何字。

---

## engineering.md（阶段 B 批 1——最高优先——主会话带开关段）

现状：87 内容行；>200 字符 32 行；L13/L16/L18/L19/L20/L44 ≥1501；标题 inline 7 处（L1/L8/L28/L56/L69/L75/L78）。

重排目标节序：S1 banner → **S2 `## Progress mode（推进档位）`**（开关段 C1 逐字文本 blockquote 5 行——
用户裁 #1：banner 后立即——Work Loop 随后紧随——"Work Loop 前插"兼得）→ S3 `## 核心纪律（审批门/发起权）`
（原句移入——不动字——保逐字整句）→ S4 `## Mandatory Flow`（step1-9 + 子节）→ S5 `## Work Loop`（状态表
L32-40 转条目 + dispatch）→ S6 `## Token 生命周期`（L21-27 blockquote 提为独立节）→ S7 `## Delegation` →
S8 `## Multi-Task Parallelism` → S9 `## Questioning Style` → S10 `## Search Tool Priority` → S11 `## Hard Rules`。

### 切分要点（原文行 → 拆/归）
- **L13**（step1 墙 ~1500-2000）拆 6 组：step1 主句 / 勘察 checklist 引句 + **A1 ①-⑤ 各成子行**（关键词
  doc_search 定位/读既有实现/核测试面/核双端对位面/广度勘察委派 各保行内）/ **Plan confirmation 首句 +
  例外句（核心纪律——保逐字整句）** / "Writing docs is a writing action" 尾句 / Requirement pool 引句 +
  三子规则（Pool routing / Threshold reminder / Fast lane 各成行——引号内逐字）
- **L14**（step2）拆 4：主句 / **A2 方案对比句（保逐字整句）** / UI 决策 MUST 句（`—` 后折行）/ "Do NOT open
  any code file" 禁止句
- **L15**（step3）拆 4：主句 / **A3 预检引句 + ①-⑤ 各成子行**（关键词 需求三层/受影响文件+行数/验收逐条回指/
  UI决策全落档/方案对比 各保行内）/ **"Present the design summary…then WAIT" 保逐字** / **"You do NOT call the
  advisor yourself — the initiation right belongs to the user" 保逐字**
- **L16**（step4）拆 7：主句 / "If advisor finds issues" 子弹（`。` 折行）/ **"Amend per their call…Never
  fix-and-resubmit" 保逐字** / "keeps rejecting after 3 rounds STOP" 句 / "Advisor calls are async R13" 段
  （`。`/`—` 折行——含 "start reviews one at a time and wait for each to settle"）/ **"On approval the design
  token…for the eng-coder spawn." 保完整（C2 锚——用户裁 #6——C2 追加句尾此句后）** / "A re-launched review…"
- **L17**（step5）拆 3：**主句 + "WAIT for explicit approval" 保逐字** / "A user ruling…NOT sign-off" /
  "scope extensions…full review chain"
- **L18**（step6）拆 6：主句 / Docs involved 句 / UI restate 句 / designToken 参数句 / designId 句 /
  "Eng-coder spawns are async §18" 段
- **L19**（step7）拆 5：主句 / DIVERGENCE 4 项（`—` 分列成行）/ advisor code 句 / 5-round stalled 句 /
  "Do NOT re-run the explore audit" / Fix-round docs-first
- **L20**（step8）拆 5：主句 / L1/L0 信任 / METHODOLOGY 测试句 / 父侧 advisor 可选 / "Chain-terminal token
  consumption" 段
- **L32-40**（Work Loop 状态表 >200）→ **表转条目**（用户裁 #2——`- **State** → Default action`）
  ——L40 单元格内 "Then handle the message" 列表拆出（C3 dispatch 首条位）
- **L42**（dispatch Explicit approval）拆 2
- **L44**（dispatch 巨型墙 ~1900——最险）拆 ~11：注意 **末句跨 L45-46——先合并回本行再拆**（不得把 L45-46
  当独立规则）；**"Only the explicit sign-off after the advisor review unlocks eng-coder" 保逐字**；
  "Code changes must land in docs" 保逐字；"End every turn with three checks ①②③" 各成行
- **L52-54**（Delegation）`。` 折行；**L56** escalate 句 + `## Multi-Task Parallelism` 提行
- **L65-67**（Multi-Task）按句/` — ` 折——"files must be file-level paths…NOT supported" 保行；
  **concurrency cap 句保逐字**
- **L69/L75/L78** 标题提行（Questioning/Search/Hard Rules）
- **L82**（Docs capture）**A4 实践沉淀句保逐字整行**；**L83-87** 各拆条——L84 "DESIGN review called ONLY when
  the user explicitly asks"/"never fire it yourself" 保逐字；**L85 响应表块整块保行**（`| # | Action | Detail |`
  表头 + Fixed/Not an issue/Deferred 三值句保逐字）；L87 Credential values 禁止句保逐字

### 开关段插入（阶段 C 定稿文本）
- C1 顶层档位规则 blockquote 5 行 → S2（banner 后）
- C2 step4 尾句 → L16 "…for the eng-coder spawn." 句尾后
- C3 分派表 User stop 条 → dispatch 列表最前

### 提权后前 20% 须含（AC-2 巡检词）：`WAIT` / `initiated by the user` / `Do NOT` / `auto`/`manual`
——S2 + S3 覆盖。

### 保逐字清单（阶段 D 断言——整句不拆）
L13 plan-confirmation WAIT 族 / L15 两 WAIT+发起权句 / L17 sign-off WAIT / L44 "Only the explicit
sign-off…unlocks eng-coder" / L84 "DESIGN review ONLY when the user asks" / L86 前半 / L79 Do NOT / L87 禁止句
——移动时整句搬移——任何分句/改写触发 AC-4 红。

---

## engineering-sub.md（阶段 B 批 3）

现状：14 内容行；>200 7 行（50%）；L7 ≥1501（①-⑦协议整墙）；标题 inline L7。

目标节：S1 模式 banner+硬约束（L1-6）→ S2 `## Subagent 执行纪律`（execute-immediately 族）→ S3
`## Internal Delivery Protocol（§18）`（①-⑦ 各节段 + 测试三档子节）。

切分要点：
- L1 拆 3（banner/MUST/引句）；L3 拆 1（out-of-list——与 L14 重复——**只拆不删**——用户裁 #4——两处各成行）
- **L7 拆 ~9**：**execute-immediately 整句保逐字成行**（"There is no user to wait for — execute
  immediately, never ask for confirmation"——子代理最高纪律——设计红线）；ambiguous 句；`## Internal
  Delivery Protocol` 提行；①Implement；测试三档 L0+/L1/L0/L2 各成行
- L9 拆 4（③Audit/quick 括注/**机械附注句保逐字**/**"Never edit design documents" 保逐字**）
- L13 拆 ~6（⑦Clean/LLM=3/修正轮 max5/stalled 报告句保逐字/两次失败/7th 拒发/test-seam）
- 提权：execute-immediately → S2（前 ~20%）。无开关段（子代理）。AC-2 巡检词 = `execute immediately`/`never
  ask for confirmation`。

---

## system.md（阶段 B 批 2——主会话带开关段）

现状：44 内容行；>200 16 行（36%）；L10/L9/L24 最长 ≥1001；**无一个 `##` 标题**——伪标题全 inline。

目标节（纯格式化建骨架——用户裁 #3）：S1 身份+语言 → **S2 `## 最高纪律：确认与批准门`**（L9 确认理解 +
**L10 批准门（最高——保逐字）** + L11 重确认 + **开关段语义对应 C4**）→ S3 `## 文档先行` → S4 `## 先定对再
定小` → S5 `## 动手前如何工作`（并行/模块拆分）→ S6 `## 收尾前` → S7 `## Rules` → S8 `## 按任务型匹配` →
S9 `## 测试与交付`。

切分要点：L2/L3 语言+伪标题提行；L4/L5 doc 归属（"exactly ONE place…reference never copy" 保逐字）；L8
Decide-right（"Smallest change is not a goal" 保行内）；L9 确认理解拆 ~6（"Wait for confirmation." 单独成行）；
**L10 批准门拆 ~6**（**"Confirm before ANY file-writing action…WAIT for the user's explicit confirmation"
核心纪律保逐字成行** / "no exemptions" / "No confirmation, silence, or a new question…do not touch anything" /
"obvious enough to skip asking is never a valid reason" / carve-out (a)(b)(c) 各成行）；L14 并行化拆 5；
**L17 Module Split Policy ①-④ 各成行** + "How you work — before claiming done" 提行；L24 环境状态（
`[System reminder:…]` 整块保行）；L37 Coding 四型各成行 + Testing 提行；L42 verify 门句保逐字。

开关段 C4：语义对应段插 S2 确认门区内（L9/L10/L11 族之间——措辞源 = 设计档顶层档位语义——auto/manual +
叫停意图非词表 + 不丢状态 + 恢复词——不逐字抄 Work Loop 句）。

保逐字：L10 批准门 WAIT 族 / L9 确认理解 / L11 重确认 / L5 ONE-place 句 / L42 verify 门句。

---

## main.md（阶段 B 批 2——主会话带开关段）

现状：34 内容行；>200 18 行（53%）；无 ≥1001；**无 `##` 标题**。

目标节：S1 角色与责任 → **S2 `## 推进档位`**（开关段 C4 语义对应——normal-mode 对应物）→ S3 `## 文档与
计划纪律` → S4 `## 委派` → S5 `## 会诊 Consult` → S6 `## 飞刀 Escalate` → S7 `## 收尾验收`。

切分要点：L1 拆 3（role/责任句保行/`**Your coordination capabilities:**` 提行）；L4 doc 归属（"locate the
owning design doc…No exemption — even one-line fixes" 保逐字）；L8 **任务书机制（行号锚源 split[7]）**拆 5
（字段 5 项各成行——子串防漂移——"Sized delegation without these fields is a defect" 保行）；L12 调度元数据
拆 4；**L13 async 机制（行号锚源 split[12]）**拆 4（§18 引用/"never pass async:false"/end-turn 等待）；
L15 交付验证 (a)(b) 各成行；L18 拆 3；L19 consult 提行；L22 consult flow；**L25 拆 2 大段**（consult 触发
规则保逐字 + Escalate 提行——**escSeg 切片锚覆盖 L25-30——子串逐字存活**）；L28 escalate async；L30 飞刀触发
词保行 + "Never write a script"；L31 对比句 + "Only a full user stop…terminates them" 保行 + How-you-finish
提行；L32 verify 机制句保逐字（"verify does not run your tests for you"）；L34 reconcile。

开关段 C4：S2（L1-6 顶部纪律区内——auto/manual 词前 20% 兜底）。保逐字清单：L4 doc 归属族 / L30 飞刀触发词 /
L32 verify 句 / L31 终止语义句。VSC 端 R14 池规则段保留（端特有）。

---

## methodology-template.md（阶段 B 批 3）

现状：39 内容行；>200 10 行（26%）；L1/L4 ≥1001；标题 inline L1/L4/L9/L11/L26/L34；**表 L18-25 唯一合规
保留**。

切分：L1 拆 ~10（`# METHODOLOGY` 提行/blockquote/`---`/`## Development Workflow` 提行/四步引句/step1
行 + 三层子句 + "Requirements are DONE when" 保行）；L2 step2 拆 2-3；L4 拆 ~9（step4 + "These four steps
are not 'best practice'" 保逐字 + `## Requirement-Pool Batched Workflow` 提行 + 状态 blockquote 按 `;` 折 +
`### Mechanism` 提行 + 1. Register 机制行）；L7 拆 2-3；L9 拆 ~6（fast lane/Boundary "never mixed" 保行/
`## Checklist` 提行/`## Problem-Solving` 提行）；L11 `## Don't Stare at Code` 提行；L26 原则区提行；L28
原则 2 折；L34 原则 8（"behavior unchanged, verified by full regression with no assertion-count drop" 保行）+
`## This Document's Checklist` 提行。checkbox 行与表格保留原样。模板文体——命令句化不动。

---

## advisor-design.md / advisor-round1/2/3.md（阶段 B 批 4——四件套同化）

**同化纪律**：四件套共享身份 1-4 与 R 规则文本——**拆法同一化**（同段落同切分——防四件套文本漂移）。

### advisor-design.md
33 内容行；>200 8 行（24%）；L1 ≥1501（身份 4 条+标准 1 墙）；标题 inline L1/L8/L16/L23。
切分：L1 拆 ~12（`## Your role` 提行/身份 1-4 各成行——**每条独立纪律句整条成行不内拆**/任务句/`## Review
Criteria` 提行/引句/标准 1）；L7 标准 7 折；L8 标准 8（">500 拆档 Tier authority" 保行）+ `## Output Format`
提行 + 表头；L16 拆 5（`## Citation Discipline`/`## Approval Signal` 提行 + token 回显纪律句保逐字）；
L20 拆 3（**"Copy BOTH values verbatim — the designId must be the LAST thing you output" 保逐字**）；L23 拆 3
（git-diff 禁令/`## Judgment Rules` 提行/R1）；L28 R6（`;` 折——test seam 词族保行）；L33 R7e + Source 分离。
R 规则每条整条成行（R1/R2/R6/R7 子串断言对象）。

### advisor-round1.md
39 行；>200 13 行；L1/L13 ≥1501（L13 = Requirement-fit 墙）。切分：L1 身份 1-4 + 任务句；L4/5/6 工作流
1-3（"do not read files one at a time" 保行）；L12 all-clear（"All clear — no code changes to review" 整块
保行 + "Prompts and configs that shape behaviour are NOT exempt" 保行）；**L13 拆 ~8**（(a)(b) 各成行/"asked
for A, got B" 保行/docs-primary 保行/Known-limit/🔴🟡 Severity 定义词保行）；L24/25 引句；L26 `## Judgment
Rules` 提行 + R 系；L36 R7e+Source 分离；L38/39 Verdict 规则（"output NOTHING after it" 保逐字）。

### advisor-round2.md
38 行；>200 10 行；L1 ≥1501。round2 专属 = "Verify the prior review output"（L1 任务句保行）+ 工作流 1
（prior review 为 HISTORY 保行）+ L8 工作流 4（"You have NO git tool this round" 括注保行）+ L14 引证纪律
（quote-exact-line 保行）+ L24 `## Judgment Rules` 提行 + L30/35/37/38 R6/R7e+Source/Verdict 规则。
### advisor-round3.md
34 行；>200 10 行；L1 ≥1501。同 round2 模式——round3 专属 = "Do NOT look for new issues"（L14 区）+ identity
4 "Strictly verify only" 保行——纯核验轮最高规则保持顶部。

---

## discipline.md（阶段 B 批 4）

现状：84 内容行；>200 22 行（26%）；**无 ≥501**（最长 ~400-500）；段头 inline 7 处（L8/L14/L18/L23/L26/L74/
L78）；**L35-74 工具路由表（4 行 >200——表行不可换行）→ 条目转换**（用户裁 #2）。

目标节：S1 Workflow → S2 Debugging → S3 UI/交互 → **S4 用户约定纪律（L18——最高行为纪律——从 21% 提到
S2 位）** → S5 Code structure → S6 Edit/write → S7 工具路由（含表区）→ S8 搜索优先级 → S9 评审纪律。

切分要点：L18 **用户约定执行纪律拆 4-5**（"以用户原话为准"保逐字/"不得等效替换"两例括注整块保行/简化须上报/
parity 注释 + `Code structure` 段头提行——**整块前移到 S2**）；L23/L24/L26 注释/记忆/工具纪律 + 段头提行；
L34 bash-IS-correct + 表头提行；**L55/58/61/68 表行 → 双栏转双短语条目**（"`- **git** — ALL git ops…；
不用 git in bash" 词序保原）；L74/75/78 搜索优先级 + Review discipline 提行；**L80 Advisor 响应表拆 5**
（`| # | Action | Detail |` 表头整块保行/Fixed-Not-Deferred 三值句保逐字/no-cop-out 句）；L81/82 cop-out
禁令 + 🔴 处理句。
保逐字：L18 用户约定纪律族（最高——断言对象）/ L80 三值句。

---

## coder.md / eng-coder.md（阶段 B 批 5）

### coder.md
14 行；>200 8 行（57%）；L11 ≥1001（报告清单墙）。L1 身份 1-3 各成行（证据/中立/边界保逐字）；L3 doc
纪律句；L5 COMPLETE delivery 拆 2-3；L6 单文件验证编号各成行；L10 final review 1-5 各成行；**L11 报告五要素
+ `| # | Status | Requirement |` 整块保行 + "Your last message IS the report" 保行 + 无 deferred 列句保行**。
无开关段。最高 = 报告即全部可见（顶部已含）。

### eng-coder.md
20 行；>200 8 行（40%）。L1 `## Authorization` 提行 + token 门句组（"Your authorization to modify files is
verified against that token at spawn time" 保行 + "You do NOT need to re-run the design review" 保行）；L3
`## Guidelines` 提行；L5 **"A 'simpler approximation' of a specified behavior IS a deviation" 保逐字成行**；
L8 out-of-list 句（与 engineering-sub 同族——保行）；L15 模块表更新句 + 报告头分离；L19 偏差句 + Tool
permissions 分离。token 授权门 = 最高纪律（已顶）。

---

## plan.md / explore.md / consult-base.md（阶段 B 批 5）

### plan.md
10 行；>200 5 行（50%）。L1 身份 2 句 + "Your deliverable IS the plan itself" 成行；L3 理解度 1-2-3 各成行；
L8 scope 纪律 + 文件清单句（"List every file that will be modified" 保行）。前 20% 巡检词 = `Do not ask`。

### explore.md
13 行；>200 3 行（23%）。L1 身份 3 句成行；L2 工具替代 3 子句各成行；L8 显式报告句。

### consult-base.md
18 行；>200 5 行（28%）。L1 `## Your role` 提行 + 1-2 条成行；L7 budget 机制拆 2（~40 tool turns 括注保行）；
L17 verify 括注保行（"~500 words is ideal" 保行）。标题 L12/14/16 已合规。

---

## 施工顺序与验证（阶段 B）

1. 批 1：engineering.md（含开关段 C1/C2/C3）——双端各自 eng-coder（端特有段保留）
2. 批 2：main.md + system.md（含 C4）——双端
3. 批 3：engineering-sub.md + methodology-template.md——双端
4. 批 4：discipline.md + advisor 四件套——双端
5. 批 5：coder/eng-coder/plan/explore/consult-base——双端
6. 阶段 D：锚断言测试改写（行号→内容特征 + 分类断言——单 eng-coder 全量一次——避免测试文件并发冲突）
7. 每批验收：无 >500 行 + 标题全独立 + 规则独立行 + 行长 ≤200（保逐字句可超——见设计 AC-1 豁免注）+
   核心纪律句未动（批自查）——最终 AC-5 双端 npm test 快层绿

## 变更记录
- 2026-09-09：阶段 A 定稿（explore 15 文件实测方案——用户 6 项裁定批准——①S2 序 ②表转条目 ③建骨架
  ④只拆不删 ⑤只标不改 ⑥锚句保完整）——施工权威——VSC 以端原文为字节源照抄——端特有段保留。
