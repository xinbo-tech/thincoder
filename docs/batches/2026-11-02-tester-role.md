# 2026-11-02 · tester-role
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> §2 = 现在要做什么 —— 本条可就地改（`edit`，§4.19）；§1 / §3 / §5 / §6 = 当时说了什么 —— 只追加，不回改。
> 编制：主 agent · 2026-11-02 · 来源 = 用户 2026-11-02 17:51 原话「我想好了，我先不拿，你先去做一个tester的子agent用来跑集成测试，这样下次你再犯，我就可以把执行工具全都收掉了。」+ 17:55 原话「execute/bash这些可以给他，先不要一上来就限制死，放宽松一点，控制不住再收紧。其实只要不是你模型训练本能里的常用工具，就能按住你。」。
> 台账 = #2004（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与已定决定

**性质**：新建角色，走全链（需求 → 设计 → 评审 → 批准 → 实施）。用户 17:56「可以」= 需求定稿确认。

**来源（用户原话，逐字）**

- 17:51：「我想好了，我先不拿，你先去做一个tester的子agent用来跑集成测试，这样下次你再犯，我就可以把执行工具全都收掉了。」
- 17:55：「execute/bash这些可以给他，先不要一上来就限制死，放宽松一点，控制不住再收紧。其实只要不是你模型训练本能里的常用工具，就能按住你。」

**背景（我造成的）**：本会话两次拿整树 grep 去做文档发现（应走 `doc_search`），把批次档旧话捞上来当依据，其中一次还重开了一本已收口批档去改正文。用户据此提出把 `grep` / `bash` / `execute` 从工程模式工具集收走；本条 = 在此之前先造一个**独立读数来源**，使父侧失去执行权时验收仍能进行。

**已定决定**

- **已定决定**：`tester` = 专职跑验证并交回读数的子代理；主 agent 可派，工程 ∥ 普通两模式都给；子代理不可派；不进 advisor 通道。· 用户原话：「你先去做一个tester的子agent用来跑集成测试」 · 时间：2026-11-02 17:51
- **已定决定**：执行面**先宽后紧** —— `execute` ∥ `bash` 一并给，含测试前准备（装依赖 ∥ 编译 ∥ 建夹具）；不因「它是测试角色」预先阉割。· 用户原话：「execute/bash这些可以给他，先不要一上来就限制死，放宽松一点，控制不住再收紧」 · 时间：2026-11-02 17:55
- **已定决定**：报告 = **读数不是结论**；不写任何档；报告直接回父侧对话，不做二次改写。· 依据：用户同两句的立意（读数来源须独立于父侧） · 时间：2026-11-02 17:55
- **已定决定**：**只跑不改**是角色契约、不是机械拦截 —— 它拿得到 `bash` 就能写盘，机制不设文本拦截（本项目既定安全哲学：拦截 = 安全剧场），越权按缺陷处理。· 时间：2026-11-02 17:56（用户「可以」时我明示此条，未被告否）

**待复核项（本批不做，已单列）**

- 用户若最终仍要收工具，收哪几个（`grep` ∥ `bash` ∥ `execute` 的组合）是另一回事，本批只造读数来源，不决定工具集变更。

**覆盖账 = #2004**

**重开记录**：2026-11-02 · 原收口 2026-11-02 · 理由 = 补 §6.3 承诺的真派单读数（#2007 触发：进程已重启，tester 可派） · 操作者 = 主 agent
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 5（父侧裁后落设计档七处：⑥ 端侧分支改记防御面 + 可达性实读 · 30-1 断言语义 = 装配层快照相等 · §6.59.3 两处「尚未落」改完成态 · §6.59.7 补 MCP 既有缺口一条 · 端侧坐标 :171→:177/:181 · 需求指针补 F-TT4-补））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### §2.1 本批条目（覆盖）

需求 = `docs/core/requirements/AGENT-LOOP.md` §4.20（F-TT1–F-TT5 + `F-TT4-补`）。F-TT1–F-TT5 = 2026-11-02 用户裁定；`F-TT4-补` = 父侧落笔。六条逐条覆盖；设计席未改需求档，条目口径零改。

| # | 条目 | 覆盖 |
|---|---|---|
| 1 | F-TT1 角色存在且可派（工程 ∥ 普通两模式；子代理不可派；不进 advisor 通道） | 设计已定（§2.3 注册面） |
| 2 | F-TT2 执行面不预先阉割（`execute` ∥ `bash`，含测试前准备，`async` 不裁） | 设计已定（§2.3 工具面） |
| 3 | F-TT3 报告 = 读数不是结论（四块固定形 + 摘要取末 40 行）；不写任何档 | 设计已定（§2.3 报告形态 + §2.4 边界） |
| 4 | F-TT4 角色契约只跑不改（改了 = 越权，父侧按缺陷处理） | 设计已定（§2.4 边界 1） |
| 5 | F-TT5 任务书五项与 explore 同形，命令写死在 `goal` | 设计已定（不进 `ENGINEERING_ROLES` ⇒ 自动取五项形） |
| 6 | `F-TT4-补` 越权读数两条（父侧 2026-11-02 裁） | 设计已定（§6.59.7 边界 2） |

**本批明确不做**：产品代码零改 · 英文运行期提示词零写（实施席的活）· `test/RTM.md` 零写（实施轮落行 `30-1`）· 别的批零碰。

### §2.2 设计档落点

| 档 | 节 | 内容 |
|---|---|---|
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | §6.59（§6.59.1–§6.59.10） | 机制全貌 + 人格层中文权威正文：做法与理由 ∥ 接口契约 ∥ 受影响文件与层级结论 ∥ 关键决策 D-TT1–D-TT6 ∥ 验收 AC-TT1–AC-TT6 ∥ 用例表 ∥ 边界（含越权读数两条） ∥ UI 决策 ∥ RTM 增量 ∥ persona 正文 |
| `docs/core/design/TOOLS.md` | §6.27 | 工具面这一侧（工具表判据、装配点、角色 enum 两处、任务书、池位），全貌回指 §6.59（D2 单源） |

### §2.3 机制设计（三条主线，全貌见设计档 §6.59.2）

**① 角色面六处**（漏一处即「静默错」「报错说谎」或用户可见端差）：

- `thincoder-core/agent-tools/subagent.mjs`：schema enum · `ROLES` 白名单 · 未知角色拒文 · 模式拒文里那唯一一句枚举了角色集的。
- `thincoder-core/agent/family-tools.mjs`：两模式 depth-0 角色 enum + suffix 句。
- `thincoder-core/prompt-overlays.mjs`：`SLOT_CONTENTS` + `SCENARIO_SLOT_FILES` 两张表。
- `thincoder-core/agent-tools/subagent-spawn.mjs`：工具过滤的角色分支（核侧）。
- `thincoder-vscode/src/agent/tool-table.mjs`：`vscSubagentFace` 替换核 `filteredSubagent` ⇒ 端侧自带 role enum + suffix；同档 `buildToolTable` 的 depth>0 基础集过滤是端侧第二处工具面。两处都要含 `tester`。前者是用户可见端差 = 缺陷；后者（`buildToolTable` 的 depth>0 分支）运行期不可达 ⇒ 按防御面记账，不按「已修的缺陷」（设计档 §6.59.2 ⑥）。
- `thincoder-core/tool-docs/subagent.md`：角色矩阵（产品文本面，实施轮写）。

**不登记提示词场景的后果已实读**：`assemblePrompt` 对未登记场景 `return CONSULT_BASE`，零警告 ⇒ tester 会带着会诊人格跑测试。

**`setup.mjs` 不需要改**（父侧勘察曾疑此处）：场景名取 `agent._role ?? "normal"`，`tester` 自然落到新登记的场景行；工程模式角色枚举住在 `family-tools.mjs`，不在 `setup.mjs`。

**② 工具面 = 第三种面**（不是纯只读、不是全量）：`readonlyToolNames(parent.tools)` ∪ `{execute, bash}` − `{verify, advisor}`。

允许清单式（fail-closed），因为拒绝清单会随父侧工具表漂。减 `verify` 的理由：它是「宣布达标」，属结论。减 `advisor` 同理——「开评审、出判断」也是结论；且它 `readonly: true`（`thincoder-core/agent-tools/advisor.mjs:146`）会自动落进只读集，不减就等于边界句没人执行（父侧 2026-11-02 裁：减工具，不改边界句）。

**③ 报告形态可判**：四块固定——命令原文 + `exit code` ∥ 跑者汇总行逐字引用 ∥ 失败用例名逐行（上限 20）∥ 摘要 = 末 40 行 + 首个错误栈段（上限 20 行）。

写盘落点寄居第 1 块（不另立第五块）；超长输出落到**报告产物文件**（系统临时目录，跑命令时 `tee`——仓库外、不进任何账，故不与 F-TT3「不写任何档」相抵）。判据本体住 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.2。形态写进人格层正文，机制面只约束形态、不约束措辞。

### §2.4 受影响文件与测试覆盖

设计轮（本轮）写两个设计档（见 §2.2）。实施轮改哪些档、逐档层级与「无一档越 500 软线」的结论 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.3 那张表（读数不入设计档，本节不复制）。

**测试覆盖**：单元面 = 实施席自写自跑（AC-TT1 ∥ AC-TT2 ∥ AC-TT6，收口即删）；真实派单面 = 必败 + 必过各一次，读数落 §5；集成面 = RTM 新行 `30-1`。

### §2.5 验收对照（逐条回指）

判据本体 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.5 的 AC-TT1–AC-TT6（本节只指认，不转录）。

对应关系：AC-TT1 → F-TT1 · AC-TT2 → F-TT2/F-TT3/F-TT4 · AC-TT3 ∥ AC-TT4 → F-TT3 · AC-TT5 → F-TT5 · AC-TT6 → F-TT1（角色存在即人格存在）。

### §2.6 关键决策（详见 §6.59.4）

D-TT1 允许清单而非拒绝清单 · D-TT2 池位落 `other` 不新增键 · D-TT3 `async` 不新增裁（`execute` 保留后台形；`bash` 的 `async` 由既有子代排除面删参）· D-TT4 depth>0 段走兜底不加分支 · D-TT5 不进 `ENGINEERING_ROLES` · D-TT6 纪律槽取普通纪律档。

### §2.7 上抛项

**本轮已定、父侧只需知会**（不阻塞实施轮）：

1. **`verify` 的 `readonly` 旗标已实读为真**（`thincoder-core/agent-tools/verify.mjs:97` `readonly: true`）⇒ 显式减法是真减法、非空操作。同批读到 `git` 的 `readonly: false`（`thincoder-core/tools/git.mjs:92`）⇒ 本就不进只读集。
2. **`bash` 的 `async` 在 depth>0 本来就没有**：`excludeSubagentTools` 对 `bash` / `browser` 删 `async` 参（`thincoder-core/agent/helpers.mjs:303-305`）。F-TT2 的「`async` 不裁」按「本设计不新增收窄」执行，`execute` 的后台形保留；设计档 §6.59.2 ④ ∥ D-TT3 已按此口径改写。
3. **修正轮 2 顺带读出的同源面**（同一判据「描述与门同源」，评审 N1 那五格之外）：`thincoder-core/agent-tools/subagent.mjs` 的任务书拒文 ∥ `thincoder-core/agent-tools/spawn-gates.mjs` 的 designPoints 指路句 ∥ §6.23.3 两格「改后」文本 ∥ `thincoder-core/prompts/persona-engineering.md` 池位句 + 四处代码注释。逐处改法已落设计档 §6.22.8 P16 ∥ P17 与 §6.59.3 受影响表。

4. **`advisor` 减除（父侧 2026-11-02 裁）**：`thincoder-core/agent-tools/advisor.mjs:146` `readonly: true` ⇒ 按公式它会自动落进 tester 的只读集，与「不做评审」的边界相反。父侧裁 = 减工具、不改边界句；三处已同步（§6.59.2 ④ 公式与两枚减法理由 · AC-TT2 快照断言 · §6.59.7 边界 4 改事实句）。代码侧减除由父侧另派实施席。

5. **端侧第二处过滤面（本轮实读，实施席上抛）**：`thincoder-vscode/src/agent/tool-table.mjs:171` 的 `isReadOnlyRole` 只认 `explore` / `plan` / `consult` ⇒ VS Code 端的 tester 子代拿 `builtinTools` 全集（含写面）。§6.59.2 ⑥ 已把它写进角色面，实施轮须补分支（父侧另派）。

**推回需求侧一条**（[上抛·待裁]，不阻塞实施轮）：

- **F-TT4 要求的「越权读数」有残余面不可观测**：`bash` 可跑 `git checkout` / `git stash` 把改动抹平，父侧 `git status --porcelain` 的前后差集为空。设计给的两条读数（子侧自报写盘落点 + 父侧前后差集）覆盖普通写盘，盖不住「写完再抹」；堵它只能靠沙箱或派单前 `checkpoint` 快照对照（后者是父侧操作纪律，不是 tester 契约）。要不要更强保障，口径由父侧定。

**需求侧其余无洞**：五条需求与「先宽后紧」的口径自洽，未发现需父侧裁的冲突。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 设计评审（tester 子代理角色设计）

评审对象：`docs/batches/2026-11-02-tester-role.md` §2（设计席）· `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59（§6.59.1–§6.59.10）· `docs/core/design/TOOLS.md` §6.27 · `docs/core/requirements/AGENT-LOOP.md` §4.20。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 设计新增第 6 个角色 `tester`，但同一机制的两处活体描述未被列入修订面：`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.1 角色表只列五角色，且明写「**模式过滤**：普通模式 explore / plan / coder；工程模式 explore / eng-designer / eng-coder——schema enum 反映现行模式」；§6.22.1 必填集合表只有 explore / plan / coder 一行、无 tester 行；§6.22.8-A 逐字块以「Task book (normal-mode roles: explore / plan / coder): four core structured parameters」开头（该块由 AC-SC-5 按整行逐字锁定）。而 §6.59.2 ② 要求两模式 enum「**都增** `"tester"`」，§6.59.3 却把本档写成「写（§6.59）」+「**层级结论**：本轮零跨层——只写设计面二档。」⇒ 实施后同档两处描述互相冲突（角色集与按模式枚举 = 同一机制两种说法） | 把 §6.7.1 角色表与「模式过滤」句、§6.22.1 必填集合表、§6.22.8-A 逐字块（连带 AC-SC-5 期望值）写进 §6.59.3 的修订面，并逐处给出 tester 行/改法；若判定某处**不改**，在设计档里写明理由（现无一句） |
| 2 | Document ownership | 🟡 | `docs/core/design/TOOLS.md` §6.27 自称「本节只写工具面这一侧」「D2 单源，本节不复制」，随后仍逐条重述与 §6.59.1/§6.59.2 同文的判据：「**工具面判据**：`tester` 子的工具表 = `readonlyToolNames(parent.tools)` ∪ `{execute, bash}` − `{verify}`。」「**角色 enum 两处**」「**任务书**」「**池位**」。两处活体副本，任一侧日后改动即漂 | 本节只留「哪一面归本档 / 判据住 §6.59 哪一小节」的指针与端差，删掉与 §6.59 重复的公式与表；或把工具面判据单源放本档、§6.59 回指——二者选一 |
| 3 | Requirements coverage | 🟡 | 需求 F-TT3 范围边界写「**不写任何档**（无 `batch` ∥ 无台账通道）」，设计却两次引入「全文落档」行为：§6.59.2「超长 ⇒ 全文落档 + 报告给路径。」·§6.59.10「输出超长 ⇒ 全文落一个文件，报告里给路径并说明「摘要 = 末 40 行」。」——落点、命名、是否算「写档」均未定；且 tester 无 `write` 工具，事后「落档」只有跑命令时即 tee/重定向才可能，设计未要求 tee 这一步（可执行性缺口） | 明确三点：①落点目录（与 §6.59.10「落在临时目录或既有约定位置」同口径）；②与 F-TT3「不写任何档」的区分句（报告产物 ≠ 档）；③跑命令即 tee 到该文件，不止事后落档 |
| 4 | Requirements coverage | 🟡 | 需求 F-TT2 范围边界把收紧判据指向「收紧判据见 F-TT4 的越权读数」，而设计 §6.59.7 边界 1 只写「不做机械写拦截：`bash` 能写盘，所以「只跑不改」是**角色契约 + 父侧按缺陷处理**（F-TT4），不是沙箱。」——全档没有定义「越权读数」从哪来：tester 报告只覆盖它**自愿**写下的落点，对源码的越权改动无任何读数面，父侧无从「按缺陷处理」 | 给出一个可判读数：至少要求 tester 报告固定列出本次**所有**写盘落点（含命令里隐含的重定向目标），并声明父侧判定越权的对照面（如派单前后父侧自查 changed files）；若确无观测面，就明写「越权不可观测，父侧自理」并把该口径回推需求侧 |
| 5 | Acceptance criteria | 🟡 | AC-TT2 断言「不含 … ∥ `file_ops` ∥ `batch` ∥ `git` ∥ `verify`」，但机制只保证两件事：公式「只读集 ∪ {execute, bash}」与「再把 `verify` 从结果里去掉」。`git` / `file_ops` 是否落在 `readonlyToolNames(parent.tools)` 内，设计无读数（§2.7 上抛项只对 `verify` 声明「`readonly` 旗标未实读」）⇒ AC 与机制之间有一处未证的合取 | 把 AC-TT2 的排除清单改成「按公式实跑一次得到的工具名集合快照 = 期望集」，或为 `git` / `file_ops` 各写一句读数（是否 readonly）后再决定是否需显式减法 |
| 6 | Criteria-8 tier conclusion | 🟡 | §6.59.3 把行数读数写进设计档：「存量行数读数**（本轮实读，用 LF 计数）：`subagent.mjs` 423 ∥ `family-tools.mjs` 206 ∥ `subagent-spawn.mjs` 未量 ∥ `prompt-overlays.mjs` 80」，其中一档明写「未量」，结论句却仍是「**没有一档因本节新增而越 500 软线**」——一档的层级判断缺测量 | 删掉四个数字，只留结论句；评审侧实测（423 · 206 · 462 · 80，全部 ≤500）⇒ 结论成立、无需拆分计划，「未量」补成测量或直接删掉逐档读数 |
| 7 | Existing-piece check | 🟡 | 新名字 `tester` 没有三问式答案行（`existing: …` / `none found: …` / `existing but unusable: …`）。设计只有「**最近先例行**」与 D-TT1 的否决替代（coder 减写工具 ∥ 纯只读面 + 只给 `bash`），形式是「为什么新造」而非「现有件查过没有」，读者无法区分「查过没有」与「没查」 | 补一行：新角色名由谁给（父侧）、住在哪（五处注册面逐处点名）、现有件查询结果——把 D-TT1 的两个替代写成 `existing but unusable: coder…（理由）` 的形 |
| 8 | Doc hygiene | 🔵 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` 档头仍写「本档承接 §6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28–§6.30；本档自有 §6.58」——新增的 §6.59 不在该枚举里 | 档头枚举补 §6.59 |
| 9 | Requirements (numeric drift) | 🔵 | 需求 F-TT5 写「任务书四项（`goal` ∥ `knownFacts` ∥ `scope` ∥ `acceptance` ∥ `reportFormat`）与 explore 同形」——「四项」与所列五项不符；设计全档按五项写，与 §6.22.1「四项核心 + scope」既有口径一致 | `docs/core/requirements/AGENT-LOOP.md` 把「四项」改为「五项」（形为四项核心 + `scope`），设计侧不动 |
| 10 | Acceptance criteria | 🔵 | §6.59.9 集成行 30-1 的回指列写「设计 §6.59.2 · AC-TT1–TT3」，不经需求条目号；先例 §6.58.8 行 20-1 同形（「设计 §6.58.1–§6.58.2 · AC-BG-1」），故不判缺陷 | 回指列补 F-TT1 ∥ F-TT2 ∥ F-TT3，业务需求到行的追溯可一步到位 |
| 11 | Clarity | 🔵 | §6.59.10 写「运行期加载的是 `thincoder-core/prompts/` 下的同名 persona 档」——「同名」无处可对：中文权威正文住设计档 §6.59.10，盘上不存在同名中文档；实施席只能从 §6.59.2 ③ 的 `SLOT_CONTENTS` 键反推文件名 | 直接写运行期 persona 档的完整落点路径（`thincoder-core/prompts/` 下、以 `persona-` 开头以角色名结尾的那一档），删「同名」二字 |

**判据已满足、不计入不足的面**：需求 F-TT1–F-TT5 逐条有落点（§2.1 覆盖表 + §6.59.2 / §6.59.4）· 设计档本体在位（二档）· 最近先例行带实现坐标与偏离理由（§6.59.1）· 勘察证据行在（含 `index.publicRepos` 为空一句）· 集成测试设计自 `test/RTM.md` 起算增量，给出新行号 `30-1` 与用例标题形（§6.59.9）· 机检给的是「本批单测档」而非全量套件（§6.59.5「机检命令」）。

**本次评审的范围限制**：无文档地图（Document ownership 判据降级，按 Project Guide 与档内自述判）· 无项目标准档 · `test/RTM.md` 不在评审范围，故 §6.59.9 的「既有行打破 0 / 冗余 0 / 既有故事号至 29」一句本评审未核（unverified）。

**计数**：🔴 1 · 🟡 6 · 🔵 4

VERDICT: changes-required

### 轮次 2（评审子代理）

### 验证轮（第 2 轮）：上轮 11 条逐条复核 + 修正引入的新面

复核面：`docs/batches/2026-11-02-tester-role.md` · `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.1 ∥ §6.22 ∥ §6.22.8-A ∥ §6.59 · `docs/core/design/TOOLS.md` §6.27 · `docs/core/requirements/AGENT-LOOP.md` §4.20。全部逐条重读本轮盘面，不据上轮快照判。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🔴 | Fixed | 三处同笔落地：角色表新增「| tester | 读数来源：只读工具集 ∪ `{execute, bash}` − `verify`；只跑不改 = 角色契约（父侧按缺陷处理）；不写档、不进 advisor 通道（面见 §6.59） |」；模式过滤句改为「普通模式 explore / plan / coder / tester；工程模式 explore / eng-designer / eng-coder / tester」；必填集合表新增「| tester | `role` · `goal` · `knownFacts` · `scope` · `acceptance` · `reportFormat`（同 explore 五项；不进 `ENGINEERING_ROLES`，见 §6.59.2） |」；§6.22.8-A 首句改为「Task book (non-engineering roles: explore / plan / coder / tester)」；§6.59.3 把这四处列为本轮修订行（「同档 §6.7.1 角色表 + 「模式过滤」句 …（本轮已落）」等） |
| 2 | 2 | `docs/core/design/TOOLS.md` | 🟡 | Fixed | §6.27 已删公式与表，只留面切分与回指：「**判据本体不在本节**：工具面公式、过滤分支、角色 enum 两处、任务书形、池位，**单源住 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.2**（本节不复制公式与枚举，回指即可；改动只改那一处）。」 |
| 3 | 3 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🟡 | Fixed | 三点齐：落点（「落点是**报告产物文件**，不是「档」——跑命令时即 `tee` 到 `<系统临时目录>/thincoder-tester-<role#id>-<时间戳>.log`」）· 与 F-TT3 的区分句（「F-TT3 的「不写任何档」指不写仓库内的需求 / 设计 / 批次 / 台账档」）· 跑时即 tee（§6.59.10 第 4 块「跑的时候就 `tee` 一份全文 …（不是事后补写——你没 `write` 工具）」）。案例表残留措辞见 N4 |
| 4 | 4 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🟡 | Fixed | §6.59.7 新增「**越权读数两条（父侧拿这两条判题）**」：① 子侧自报写盘落点（含 `>` / `tee` 隐式重定向目标）；② 父侧 `git status --porcelain` 前后差集；残余面明写「这一层**不可观测**」，并指 checkpoint 为父侧纪律。需求侧同步出现 `F-TT4-补` 行（连带账目滞后见 N2） |
| 5 | 5 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🟡 | Fixed | AC-TT2 改为「按公式取快照比集合（不逐名列表项当判据）」，并补 `git` 读数「`git` 的 `readonly: false`（`thincoder-core/tools/git.mjs:92`）⇒ 本来就不进只读集、无需显式减」——AC 不再依赖逐名合取，`file_ops` 一类随公式自动判定 |
| 6 | 6 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🟡 | Fixed | §6.59.3 已无逐档行数、「未量」二字消失，只剩结论句「**实施轮四个产品代码档无档越 500 行软线 ⇒ 无拆分计划。**」 |
| 7 | 7 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🟡 | Fixed | 三问式查据在位：「**三问式查据（新名字 `tester`）**」下两条 `existing but unusable: …`（只读面分支 · coder 全量面分支，各带 failed on 理由）+ 一条 `none found: 既有五个 spawn 角色（explore / plan / coder / eng-coder / eng-designer）无一承担「跑验证、交读数、不改不写」这一职责` |
| 8 | 8 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🔵 | Fixed | 档头枚举现为「本档承接 §6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28–§6.30；本档自有 §6.58 · §6.59」 |
| 9 | 9 | `docs/core/requirements/AGENT-LOOP.md` | 🔵 | Fixed | F-TT5 改为「**上下文零继承**：任务书五项（`goal` ∥ `knownFacts` ∥ `scope` ∥ `acceptance` ∥ `reportFormat`）与 explore 同形」，数字与所列一致 |
| 10 | 10 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🔵 | Fixed | RTM 行 30-1 回指列现为「设计 §6.59.2 · AC-TT1–TT3 · F-TT1 ∥ F-TT2 ∥ F-TT3」 |
| 11 | 11 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🔵 | Fixed | 「同名」已删：「运行期加载的是 `thincoder-core/prompts/` 下以 `persona-` 开头、以角色名结尾的那一档（本批 = tester 的 persona 档，文件名单源 = §6.59.2 ③ 代码块；…）」——指针链闭合。需求侧同语残留见 N5 |
| N1 | (new) | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🔴 | New: §1 的修正只改了 §6.22.8-A 一格，同表其余逐字格仍按三角色枚举「普通模式角色集」，同一机制在同一张表里并存两种角色集 | 改后 §6.22.8-A = 「Task book (non-engineering roles: explore / plan / coder / tester): four core structured parameters」（四角色）；同表 P3 = 「`For action:'spawn': normal-mode roles (explore/plan/coder) — OPTIONAL free-text supplement; …`」；P4 = 「`Optional background for normal-mode spawns (explore/plan/coder) only; action:'spawn' only.`」；P5 = 「`goal` / `knownFacts` / `acceptance` / `reportFormat` 首句 → `REQUIRED for role='explore'/'plan'/'coder' (normal-mode task book) …`」；P10 = 「`Every normal-mode delegation (explore / plan / coder) carries a task book — four core structured spawn parameters:`」。这些格的判据列写的就是「描述与门同源」，而门对 `tester` 同样要求五项（§6.22.1 必填表 tester 行、§6.59.2「任务书面」）⇒ 实施后工具参数描述面与纪律面仍按三角色说话，与 §6.7.1／§6.22.8-A／§6.59.2 冲突，且实施席无法既守 P5 逐字又守「描述与门同源」。建议：把 P3 ∥ P4 ∥ P5 ∥ P10 ∥ P14 的角色枚举写进 §6.59.3 修订面并给出逐字改法（枚举改 explore / plan / coder / tester），或明写「这几句不改、理由 = …」并说明门与描述如何同源 |
| N2 | (new) | `docs/batches/2026-11-02-tester-role.md` | 🟡 | New: 需求档本轮新增 `F-TT4-补` 行，但 §2.1 仍写「本批不新增条目、不改需求口径」、覆盖表仍只有五条，§6.59.3 受影响表也无需求档一行——账目与实际盘面不一致 | §2.1：「需求 = `docs/core/requirements/AGENT-LOOP.md` §4.20（F-TT1–F-TT5，2026-11-02 用户裁定，已定稿）。五条逐条覆盖，本批不新增条目、不改需求口径。」；§4.20 现含「| F-TT4-补 | **越权读数两条**（父侧 2026-11-02 裁）：…」。内容面已被 §6.59.7 覆盖，缺的只是记账。建议 §2.1 改为「F-TT1–F-TT5 + F-TT4-补（父侧落笔）」，覆盖表加一行，§6.59.3 受影响表补需求档一行（写「父侧落笔，设计席未改」。该行「父侧 2026-11-02 裁」一句本评审未核：unverified） |
| N3 | (new) | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🔵 | New: §6.59.7 列表编号重号（两个「2.」） | 现存两条：「2. **越权读数两条（父侧拿这两条判题）**：」与「2. 不改 `agent.toolExclusions` / 权限门 / planMode 语义。」；其后接「3. 不给 tester 评审、令牌、收口权；不进 advisor 通道。」⇒ 插入新条未顺延编号，建议改为 1/2/3/4/5/6/7 |
| N4 | (new) | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🔵 | New: §6.59.2 已定性「报告产物文件，不是「档」」，§6.59.6 案例格仍留旧措辞「全文落档 + 路径」 | §6.59.6：「| 边界 | 输出 5000 行 | 摘要 = 末 40 行 + 首个错误栈段；全文落档 + 路径 |」——与 #3 的修正用语相左，建议同步改为「全文 tee 到报告产物文件 + 报告给路径」 |
| N5 | (new) | `docs/core/requirements/AGENT-LOOP.md` | 🔵 | New: #11 只在设计侧落地，需求侧同语仍在 | §4.20 依赖段：「提示词：运行期英文档 = `thincoder-core/prompts/` 下的同名 persona 档；中文权威正文 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.10。」——「同名」仍无处可对；建议父侧一笔改为「以 `persona-` 开头、以角色名结尾那一档」 |
| N6 | (new) | `docs/core/design/TOOLS.md` | 🔵 | New: #2 的改写引入一句与 §6.59.1 口径不同的走漏说法 | §6.27：「**零新增工具**：本批不注册任何工具、不动任何工具 schema——`tester` 拿到的面 = 父侧工具表过一遍过滤的结果；父侧多一把只读工具，它自动跟着多一把。」 vs §6.59.1：「允许清单式（fail-closed）则相反：新工具默认**进不来**，要进得显式加名。」——按 §6.59.2 ④ 的公式，只读新工具确实自动进（本节对），而 §6.59.1 那句只在「写工具」语境下成立。建议 §6.59.1 改为「非只读新工具默认进不来」以免 fail-closed 的表述被读成对全部新工具成立 |

**判据已满足、不计入不足的面**（本轮复核）：F-TT1–F-TT5 逐条有落点且需求侧另有 F-TT4-补；设计档本体在位二档；最近先例行带实现坐标与偏离理由；勘察证据行在（含 `index.publicRepos` = 空一句）；层级结论给的是结论句而非行数或增量；集成测试设计自 `test/RTM.md` 起算增量、新行号 `30-1` 与用例标题形齐备、回指含 F-TT1–F-TT3；机检命令指「本批单测档」而非全量套件；机检与真实派单面分工清楚（AC-TT3 ∥ AC-TT4 走真实派单落 §5）。

**本次评审的范围限制**：无文档地图（Document ownership 判据按 Project Guide 与档内自述判）· 无项目标准档 · `test/RTM.md` 不在评审范围，§6.59.9 的「既有行打破 0 / 冗余 0 / 既有故事号至 29」本评审未核（unverified）· 产品代码未逐行复核，§6.59.3 的「无档越 500 软线」结论本评审沿用上轮实读（423 · 206 · 462 · 80），本轮未重测。

**计数**：🔴 1（新）· 🟡 1（新）· 🔵 4（新）· 上轮 11 条全部 Fixed

VERDICT: changes-required

### 轮次 3（评审子代理）

**验证轮（第 3 轮）：第 2 轮 N1–N6 六条逐条复核**

复核面：`docs/batches/2026-11-02-tester-role.md` · `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.22.8 ∥ §6.23.3 ∥ §6.59 · `docs/core/design/TOOLS.md` §6.27 · `docs/core/requirements/AGENT-LOOP.md` §4.20。逐条重读本轮盘面，不据上轮快照判。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | N1 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🔴 | Fixed | 五格逐格落地：P3 改法现为「`For action:'spawn': non-engineering roles (explore / plan / coder / tester) — OPTIONAL free-text supplement; …`」；P4「`Optional background for non-engineering spawns (explore / plan / coder / tester) only; action:'spawn' only.`」；P5「`REQUIRED for role='explore'/'plan'/'coder'/'tester' (non-engineering task book) …`」（`scope` 首句同集）；P10「`Every non-engineering delegation (explore / plan / coder / tester) carries a task book — four core structured spawn parameters:`」；P14 走 N1 允许的第二路并明写理由「**本格不改**（该行只枚举工程角色 `eng-coder / eng-designer only`，无「非工程角色集」可增；它所在的清单头 = P10，已在 P10 改）」。§6.59.3 修订面已收「同档 §6.22.8 P3 ∥ P4 ∥ P5 ∥ P10」行、P14「不改」行，并新增 P16 ∥ P17 两行（`subagent.mjs` 任务书拒文 ∥ `spawn-gates.mjs` designPoints 指路句）；§6.23.3 两格「改后」文本亦已含 `tester`（「normal mode exposes explore/plan/coder/tester …」）。「描述与门同源」不再有第二种角色集 |
| 2 | N2 | `docs/batches/2026-11-02-tester-role.md` | 🟡 | Fixed | 账目三处齐：§2.1 现为「需求 = `docs/core/requirements/AGENT-LOOP.md` §4.20（F-TT1–F-TT5 + `F-TT4-补`）。F-TT1–F-TT5 = 2026-11-02 用户裁定；`F-TT4-补` = 父侧落笔。六条逐条覆盖；设计席未改需求档，条目口径零改。」；覆盖表新增「| 6 | `F-TT4-补` 越权读数两条（父侧 2026-11-02 裁） | 设计已定（§6.59.7 边界 2） |」；§6.59.3 受影响表新增「| `docs/core/requirements/AGENT-LOOP.md` §4.20 | 需求档 | 父侧落笔（`F-TT4-补` 行），设计席未改 |」 |
| 3 | N3 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🔵 | Fixed | §6.59.7 编号已顺移为 1–7：「1. 不做机械写拦截…」·「2. **越权读数两条（父侧拿这两条判题）**：…」·「3. 不改 `agent.toolExclusions` / 权限门 / planMode 语义。」·「4. 不给 tester 评审、令牌、收口权；不进 advisor 通道。」——重号消失 |
| 4 | N4 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 🔵 | Fixed | 案例格已同步 N1 那批的用语：「| 边界 | 输出 5000 行 | 摘要 = 末 40 行 + 首个错误栈段；全文 `tee` 到报告产物文件 + 报告给该路径 |」——与 §6.59.2「落点是**报告产物文件**，不是「档」」同口径 |
| 5 | N5 | `docs/core/requirements/AGENT-LOOP.md` | 🔵 | Fixed | 需求侧同语已改：「提示词：运行期英文档住 `thincoder-core/prompts/`，命名规则 = `persona-` + 角色名；中文权威正文 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.10。」——「同名」二字不再出现，与设计侧 §6.59.10 的指针一致 |
| 6 | N6 | `docs/core/design/TOOLS.md` | 🔵 | Fixed | 走的是 N6 建议的那一路（改 §6.59.1 表述）：§6.59.1 现为「允许清单式则相反：**写入面 fail-closed**——非只读新工具默认**进不来**，要进得显式加名；只读新工具按同一公式自动进（§6.59.2 ④ 的 `readonlyToolNames` 那一项就是它）。」§6.27 的「父侧多一把只读工具，它自动跟着多一把」与之不再相左 |

**本轮不新开面**：按本轮对象声明，只验 N1–N6 是否落地，不猎新问题。

**本次复核的范围限制**：产品代码未逐行复核，§6.59.3 的「实施轮四个产品代码档无档越 500 行软线」与 §6.23.3 引用的代码坐标本轮未重测 · `test/RTM.md` 不在评审范围，§6.59.9 的「打破 0 / 冗余 0 / 既有故事号至 29」本评审未核（unverified）· §4.20「父侧 2026-11-02 裁」一句本评审未核（unverified）。

**计数**：上轮 6 条（N1–N6）全部 Fixed · 新开 0 · 未解决 🔴 0

VERDICT: pass

### 轮次 4（评审子代理）

### 设计评审（第 4 轮）：A ⑥ 端侧角色面 ∥ B 减 advisor 全档同步 ∥ C 两处漂移收正

评审对象（按本轮声明，只审通过后新增三处，不重评前三轮已结项）：`docs/batches/2026-11-02-tester-role.md` §2 ∥ `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.23.3 ∥ §6.59。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | AC-TT2 要求「核 ∥ 端各跑一次…两端名集不等 = 不通过」，但 §6.59.2 ⑥ 只写端侧「套 ④ 的同一公式（只读集 ∧ 非 `TRIMMED`，再补 `execute` / `bash`）」，端侧「只读集」怎么取未写明。核侧是 `readonlyToolNames(parent.tools)`，端侧盘上是 `builtinTools.filter((t) => t.readonly)`（`tool-table.mjs:173`）。同档 §6.24 又立了反向先例「不 import 核常量」⇒ 实施席要在引核 helper ∥ 用 `t.readonly` ∥ 自持名集三者间自决 | 在 ⑥ 补一句端侧推导的逐字形（`allowed` = `builtinTools.filter((t) => t.readonly)`；`TRIMMED` 两端各自字面量），使「两端名集相等」两侧各有一条成文规则可判 |
| 2 | Acceptance criteria | 🟡 | A 新增的是用户可见的端面（VS Code 端 tester 子代工具面），但 §6.59.9 的增量答案仍是「打破 0 / 冗余 0 / 缺行 1」，行 30-1 的「交互组件」列只有核三处 + 报告，没有端面。AC-TT2 要两端同集，集成面却只写核 | 二择一并在 §6.59.9 写明：①行 30-1 的「交互组件 / 进入口」补 VS Code 端（同一业务结果、两个进入口）并说明两端各跑一次；②判为另一业务可观察点则立端侧行并按 RTM 编号取号 |
| 3 | Document ownership | 🟡 | B 定「减工具、不改边界句」，设计面已逐格同步（§6.7.1 表 · §6.59.1 · ④`TRIMMED` 与两枚理由 · ⑤ · §6.59.6 · D-TT1 · AC-TT2 · §6.59.7 边界 4 均含 `advisor`，无处残留只减 `verify`）。但代码面未减：`subagent-spawn.mjs:288` 现为 `.filter((t) => t.name !== "verify")` ⇒ AC-TT2 公式盘上暂不成立。§6.59.3 的 `tool-table.mjs` 行有「尚未…（续修）」标记，`subagent-spawn.mjs` 行却只写「实施轮写」 | 给 §6.59.3 的 `subagent-spawn.mjs` 行补同形式续修标记（点明 `TRIMMED` 的 `advisor` 一枚为续修、AC-TT2 待其落地后成立） |
| 4 | Doc-state | 🟡 | 批档 §2.4 写「逐档层级、存量行数读数与「无一档越 500 软线」的判据 = §6.59.3 那张表」，而 §6.59.3 已按第 2 轮裁定删掉逐档行数、只剩结论句（设计档本不该带读数）⇒ 指针指向一个有意不存在的东西 | §2.4 删「存量行数读数」四字，改为「逐档层级与「无一档越 500 软线」的结论 = §6.59.3 那张表（读数不入设计档）」 |
| 5 | Affected-file tier | 🟡 | §6.59.3 层级结论句点名「实施轮五个代码档」（`subagent.mjs` ∥ `family-tools.mjs` ∥ `subagent-spawn.mjs` ∥ `prompt-overlays.mjs` ∥ `tool-table.mjs`），但表内另有两条注释面源档（`spawn-gates.mjs` `:7` ∥ `:29` · `subagent-async.mjs` `:67`）不在该枚举里 ⇒ 结论未覆盖表内全部源档 | 把这两档按同一句收进结论（「含两处注释面档，均不越线」），或明写「注释面档不做层级判定」及其理由 |
| 6 | Doc-state | 🔵 | C 第一处把 §6.23.3「模式过滤」格的改前换成盘上真实现文——该批已落地，盘上现在只存改后形（`thincoder-core/tool-docs/subagent.md:77` = 改后句）⇒「改前」格在任何时刻都无法再被核验 | 该格保留即可，但可加一句「改前 = 落地前实读，落地后不可复验」，免得后续轮把它当活体判据重读 |
| 7 | Doc-state | 🔵 | §6.59.7 边界 4 写「开评审、签设计令牌、做收口判断三个动作它都做不到（§6.59.2 ④ 的显式减法）」——三个动作里只有「开评审」由 ④ 挡住；签令牌 / 收口不可达靠 ⑤ 的段级排除（`batch` / `doc_check` 不在该段） | 拆一句：`advisor` 由 ④ 显式减；`batch` / `doc_check` 由 ⑤ 段级排除不可达 |

**判据已满足、不计入不足的面（本轮逐项实读）**

- **A 的六处角色面成立**：`tool-table.mjs` 实读 `:40` `export function vscSubagentFace(` · `:45` `const testerSuffix = …` · `:48` `enum: ["explore", "eng-designer", "eng-coder", "tester"],` · `:53` `enum: ["explore", "plan", "coder", "tester"],` · `:171` 逐字同 §6.59.2 ⑥ 引用 · `:173` `...(isReadOnlyRole ? builtinTools.filter((t) => t.readonly) : builtinTools),`。
- **没有第七处端侧角色面**：`thincoder-vscode/src/**/*.mjs` 全目录 `eng-designer` 仅 4 命中、全在 `tool-table.mjs`（`:26` ∥ `:43` 注释、`:48`、`:50`）。
- **§6.24 所指档不藏活体角色面**：`setup-tooltable.mjs` 与 `tool-table.mjs` 是两个不同盘上文件，前者 `role` / `enum` 零命中。
- **B 的前提为真**：`advisor.mjs:146` `readonly: true,` · `verify.mjs:97` `readonly: true,`——不减即自动落进只读集，减法是有效减法。
- **C 第二处完全对得**：四条模式拒文只有 `:259` 枚举角色集（「the engineering-mode enum is explore / eng-designer / eng-coder / tester」），`:256` ∥ `:262` ∥ `:268` 各只点名一个替代角色，与 §6.59.2 ① 逐句相符。
- **需求覆盖**：§2.1 六条（F-TT1–F-TT5 + `F-TT4-补`）与 A ∥ B ∥ C 逐条有落点。
- **其余四判据在位**：最近先例行（带对齐 ∥ 偏离 ∥ 理由）· 勘察证据行（含 `index.publicRepos` = 空）· 三问式查据（两条 `existing but unusable` + 一条 `none found`）。
- **集成与机检**：§6.59.9 自 `test/RTM.md` 起算增量并给行号 `30-1`；机检命令 = `node --test <本批单测档>`（非全量套件）。

**本次评审的范围限制**

- **文档面**：无文档地图（Document ownership 按 Project Guide 与档内自述判）· 无项目标准档。
- **RTM 未核**：`test/RTM.md` 不在评审范围 ⇒ §6.59.9「打破 0 / 冗余 0 / 既有故事号至 29」本评审未核（unverified）。
- **需求档未核**：`docs/core/requirements/AGENT-LOOP.md` §4.20 不在评审范围 ⇒ 六条口径取自 §2.1 与设计档引述（unverified）。
- **行数未重数**：本评审只实测字节量（`subagent.mjs` 37578 ∥ `subagent-spawn.mjs` 34224 ∥ `tool-table.mjs` 12847）⇒ 第 5 条按「枚举不全」报，不断言任何档越线。

**计数**：🔴 0 · 🟡 5 · 🔵 2

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-11-02 18:41 逐字「两个都评审吧，然后自动跑完」——该句覆盖本批与 `#2006` 两批的整条链（设计 → 评审 → 修正 → 实施 → 收口），故不再逐轮请批。

**批准时的状态**：

- 设计评审共 4 轮（`docs/batches/2026-11-02-tester-role.md` §3）：第 1 轮 changes-required（11 条）→ 第 2 轮 changes-required（新 🔴 1）→ 第 3 轮 pass → 设计在通过后又改（A/B/C 三处）→ 第 4 轮 pass（新 🔴 0，🟡 5 + 🔵 2，全部按号落）。
- 实施 + 修正两轮完成，实施席自含内部审计 1 轮 + 代码评审 1 轮，终态 clean。

**批准范围**：`F-TT1`–`F-TT5` + `F-TT4-补` 六条（`docs/core/requirements/AGENT-LOOP.md` §4.20）。`docs/core/requirements/AGENT-LOOP.md` §4.20 的 `F-TT4-补` 行与「提示词命名规则」一处由父侧落笔，其余需求条文属用户裁定。

## §5 实施记录（eng-coder）

### 实施记录（eng-coder）

**结论**：设计 §6.59 的机制面逐处落地，机检全绿。

需父侧动作的两条写在第四节：AC-TT3 ∥ AC-TT4 的真实派单只能由 depth-0 执行；工具面是否该减 `advisor` 需设计裁定。

#### 一、逐面落地

| 面 | 文件 | 改了什么 |
|---|---|---|
| 角色白名单 | `thincoder-core/agent-tools/subagent.mjs` | schema `role.enum` 增 `"tester"`；`ROLES` 集与未知角色拒文增 `tester`；工程模式角色枚举句增 `tester`；P16 拒句改 `for non-engineering roles (explore / plan / coder / tester)`（其余逐字不变）；`task` / `context` / 五项任务书说明按 P3 ∥ P4 ∥ P5 改 |
| depth-0 角色 enum | `thincoder-core/agent/family-tools.mjs` | 两模式 enum 各增 `"tester"`；新增 `testerSuffix` 并补进两份 suffix（§6.59.2 ②） |
| 提示词装配 | `thincoder-core/prompt-overlays.mjs` | `SLOT_CONTENTS` 增人格档；`SCENARIO_SLOT_FILES` 增 `tester` 行（纪律槽 = 普通纪律，D-TT6） |
| 工具面过滤 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 新增 `role === "tester"` 分支：只读集 ∪ `{execute, bash}` − `{verify}`；`excludeSubagentTools` 仍在其后 |
| 人格档（新建） | `thincoder-core/prompts/persona-tester.md` | §6.59.10 中文权威正文的英文落形：五节逐节对应 |
| 纪律槽 | `thincoder-core/prompts/discipline-normal.md` | 按 P10 改：`Every non-engineering delegation (explore / plan / coder / tester)` 与末尾 `Every non-engineering spawn role (…)` |
| 池位句 | `thincoder-core/prompts/persona-engineering.md` | `other-role (explore / plan / coder)` pool 增 `tester` |
| 产品文本面 | `thincoder-core/tool-docs/subagent.md` | 角色矩阵增 `tester` 一条（含「不是沙箱」边界句）；任务书段首句改四角色；模式过滤句补全两模式各拒哪些角色 |
| 注释面四处 | `spawn-gates` 两处 ∥ `subagent-spawn.mjs` ∥ `subagent-async.mjs` | 角色枚举补 `tester`，零行为变更 |
| 集成面 | `test/RTM.md` ∥ `test/integration/tester-role.test.mjs` | 新故事 30 + 行 `30-1`；用例 `test('30-1 …')` |

#### 二、验收对照

| # | 判据 | 状态 | 读数 |
|---|---|---|---|
| AC-TT1 | 两模式可派 ∥ 子代理内不可派 | ✅ | 单测 AC-TT1-a…e 五条：schema enum 含 tester；两模式拒句是任务书门的（不是「未知角色」）；装配腿取号 `tester#1/`；子通道 enum `["explore"]` + 门拒；缺 `acceptance` 拒并点名 |
| AC-TT2 | 工具面按公式取快照比集合 | ✅ | 两模式下 `child.tools` 名集与 `readonlyToolNames ∪ {execute, bash} − {verify}`（再经子代排除面）逐名相等；`verify` / `write` / `apply_patch` / `git` 均不在表 |
| AC-TT2-b | `async` 不新增裁 | ✅ | `execute` 保留 `async` 参；`bash` 的 `async` 由既有 `excludeSubagentTools` 删参（继承面） |
| AC-TT6 | 装配首槽 = 人格档、零警告 | ✅ | `warnings` 空、`prompt` 以人格档全文开头、非 `CONSULT_BASE`；红面对照 = 未登记场景名仍落 `CONSULT_BASE` 且零警告 |
| AC-TT6 改前读数 | 改前同一调用 = `CONSULT_BASE` | ✅ | 改前实跑：`tester registered? false` · `prompt === CONSULT_BASE: true` · `warnings: []` |
| AC-TT3 | 真实派单必败 ⇒ 四块读数 | ⚠️ 部分（见第四节） | 集成 30-1 必败跑：报告含命令原文、`fail 1`、失败用例名、`exit code 1`（模型侧为脚本化夹具） |
| AC-TT4 | 真实派单必过 ⇒ `pass` 计数与 `exit code: 0` | ⚠️ 部分（见第四节） | 集成 30-1 必过跑：报告含 `pass 1` 与 `exit code 0` |
| AC-TT5 | 任务书缺项即拒 ∥ 无命令不自选靶 | ✅ | 缺项拒绝由单测 AC-TT1-e 钉住；「不自选靶」住人格档「任务书」一节（契约面，模型行为） |

#### 三、机检读数（本席实跑）

| 命令 | 结果 |
|---|---|
| `node --test docs/batches/2026-11-02-tester-role.test.mjs` | 8 用例全过 |
| `node --test test/integration/tester-role.test.mjs` | 1 用例全过（30-1 必败 ∥ 必过两跑） |
| `node --test bench/check/probe.check.mjs` | 11 项全过（含 AC-11 的逐字比对） |
| `node --test test/integration/batchdoc-reuse-guard.test.mjs` | 1 用例过（spawn 路径零回归） |
| `node --check` × 七个改动代码档 | 全过 |
| `doc_check`（gate 态，五份文档） | `DOC-CHECK GATE: PASS` |

#### 四、需父侧动作的两条（[上抛·待裁]）

**（1）AC-TT3 ∥ AC-TT4 的「真实派单」本席做不了。**

本席是 depth>0 子代理：子通道 `subagent` 的 role enum = `["explore"]`，`gateEngCoderSpawn` 对非 explore 一律拒（该读数已由单测 AC-TT1-d 钉住）。

集成 30-1 走的是同一条真工具面：`executeToolCalls` → 真门 → 真装配 → 真 `bash` 跑真 `node --test`，只有模型侧是脚本化夹具。

因此它证明「受理 ∥ 工具表无写面 ∥ 读数原样回到父侧」，不证明 persona 的四块形态。

请父侧在 depth-0 各派一次（必败 ∥ 必过），把真实模型下的四块形态读数落 §5。派单形：

`subagent(role:"tester", goal=<写死命令>, knownFacts=…, scope=…, acceptance=…, reportFormat=…)`

**（2）工具面是否该减 `advisor`。**

按 §6.59.2 ④ 的公式，`readonlyToolNames` 含 `verify`（已减），也含 `advisor`（`thincoder-core/agent-tools/advisor.mjs:146` `readonly: true`）。

于是 tester 手里有「发起评审」这一动作，与 §6.59.7 边界 4「不进 advisor 通道」及人格档「不做评审」字面张力。

本席未动：AC-TT2 断的正是该公式的快照，减 `advisor` 会让判据与实现同时失效。取舍（减 `advisor` ∥ 改写边界句）请设计侧裁定。

#### 五、审计与评审轮次

- **内部偏离审计（explore，只读）**：1 轮，报 2 必修 + 3 应修 + 5 记录。
- 必修已修：P10 的落点（纪律档）未改（已补）；§5 未落账（即本段）。
- 应修已修：集成用例缺「必过」半边（已补进 30-1）；产品文本面的模式过滤句未补全两模式拒收说明（已补）；两处注释把「无写工具」说成「无写面」（与「不是沙箱」相左，已改写）。
- **代码评审（advisor，`type:"code"`）**：1 轮，结论 changes-required。
- 🔴 1 条 = VS Code 端自持一份 role enum（`thincoder-vscode/src/agent/tool-table.mjs` 经 `vscSubagentFace` 替换核面）未随本批更新 ⇒ 该端角色集无 `tester`（已修，见第六节）。
- 🟡 2 条 = 减不减 `advisor`（转第四节第 2 条）∥ §5 未落账（本段）。
- 🔵 3 条 = 集成用例的报告断言强度（已在用例档头写明证得了什么、证不了什么）∥ `NODE_TEST_CONTEXT` 全局改写（保留，注释已给理由）∥ 执行面两枚工具名以内联字面量写死（未动：设计逐字如此）。
- **修正轮**：1 轮（审计 5 条 + 评审 🔴 1 条一次落）。**终态 = clean**：本席可修的全部已修，第四节两条属设计 / 父侧裁定项。

#### 六、出清单改动与漂移（如实登记）

**（1）出声明清单改动 1 档**：`thincoder-vscode/src/agent/tool-table.mjs`。

理由：该档经 `vscSubagentFace` **替换核 `filteredSubagent`**（档头自述「端侧自带 role 面」），所以它是同一角色集的第二处活体描述。

不补 `tester`，则该端模型看不到这个角色——用户可见的端差即缺陷，按跨面处置默认消差。

设计 §6.59.2 的「五个注册面」与 §6.59.3 的受影响表都漏了这一面，请设计侧补一行（设计档是设计席的笔，本席不写）。

**（2）修掉一处改前就红的机检**：`bench/check/probe.check.mjs` 第 5 项（AC-11 / AC-SC-5 的 §6.22.8-A 逐字比对）在 HEAD 上即为红。

原因是产品文本面的任务书段中间夹着「A record carries one concurrent spawn at a time…」一段，且首句仍写 `normal-mode roles`。

本批按设计「逐字对比目标 = 改后的块」把它救回：首句对齐 §6.22.8-A，该段移到 designToken 段之后 ⇒ 现为 11/11 绿。

**（3）设计档漂移 2 处（交父侧路由，本席不写设计档）**：

- `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.23.3 的「模式过滤」格：其「改前」写 `The schema enum reflects the active mode.`，与盘上现文不符（后批已改写）。
- 本席按现有句加 `tester`，并补回该格「改后」里的两模式拒收说明；**未**逐字粘贴过期「改后」（那会回退后批的改写）。
- 同档 §6.59.2 ① 写「那四句拒文枚举了模式内角色…须同笔把 `tester` 写进去」：实读只有 plan 被禁那句枚举了模式角色集。
- 另三句各自只点名一个具体替代角色（`coder` / `explore`·`plan`），把 `tester` 写进去反而不对。已改的只有那一句；建议设计侧订正此说法。

### 实施记录（eng-coder · 续修轮）

**本轮覆盖** = 设计 §6.59.3 标为「续修」的两条 + AC-TT2 的「核 ∥ 端各跑一次」。上一轮已落的角色面（`thincoder-core/agent-tools/subagent.mjs` · `thincoder-core/agent/family-tools.mjs` 的 enum 与 suffix · `thincoder-core/prompt-overlays.mjs` · `thincoder-core/prompts/persona-tester.md` · `thincoder-core/tool-docs/subagent.md`）本轮未动。

#### 一、逐面落地（本轮）

| 面 | 文件 | 改了什么 |
|---|---|---|
| 核侧工具面 | `thincoder-core/agent-tools/subagent-spawn.mjs` | tester 分支改成设计 §6.59.2 ④ 的逐字形：`TRIMMED = new Set(["verify", "advisor"])` + `parent.tools.filter((t) => (allowed.has(t.name) && !TRIMMED.has(t.name)) \|\| t.name === "execute" \|\| t.name === "bash")`。原本文只减 `verify`（`.filter((t) => t.name !== "verify")`） |
| 端侧工具面 | `thincoder-vscode/src/agent/tool-table.mjs` | `buildToolTable` 增 `isTesterRole` 分支：只读集 = `builtinTools.filter((t) => t.readonly)`（不引核 helper，§6.24），再并 `execute` / `bash`，再按端侧自持字面量 `TESTER_TRIMMED = {verify, advisor}` 减。原本文 `tester` 走 `builtinTools` 全集 |
| 集成用例 | `test/integration/tester-role.test.mjs` | 30-1 增 `assertSameToolFace`：核 = 真派单请求体减家族段，端 = 真跑端装配函数（`vscode` 桩掉），两头逐名比；并断核侧实得名集 = 公式快照。夹具父面改 `[...builtinTools, verifyTool, advisorTool]`，使两枚减法各走一次**真减法** |
| 集成索引 | `test/RTM.md` | 行 30-1 的判据补两端比较与公式快照；标题同号；按 §6.59.9 口径**不另立行** |
| 本批单测档 | `docs/batches/2026-11-02-tester-role.test.mjs` | AC-TT2 夹具补 `advisor`（只读结论工具），公式快照补 `formula.delete("advisor")`，缺席名单补 `advisor` |
| 注释面 | `thincoder-core/agent/family-tools.mjs` | 一处注释里的公式 `− verify` → `− {verify, advisor}`，零行为变更 |

#### 二、机检读数（本席实跑）

| 命令 | 结果 |
|---|---|
| `node --test docs/batches/2026-11-02-tester-role.test.mjs` | 8 用例全过（AC-TT1-a…e · AC-TT2 · AC-TT2-b · AC-TT6） |
| `node --test test/integration/tester-role.test.mjs` | 1 用例全过（30-1，必败 ∥ 必过两跑 + 两端工具面比较）；复跑一次仍过 |
| `node --test bench/check/probe.check.mjs` | 11 项全过 |
| `node --test test/integration/batchdoc-reuse-guard.test.mjs` | 1 用例过（spawn 路径零回归） |
| `node --check` × 五个改动代码档 | 全过 |
| `doc_check`（gate 态，`target` = 仓根，docs = `test/RTM.md`） | `DOC-CHECK GATE: PASS`（1 档全清） |

#### 三、红-绿对照（端侧分支确证会红）

把端侧 `isTesterRole` 分支临时退回 `builtinTools` 全集 ⇒ `30-1` 变红（断言落在「核 ∥ 端同一角色的工具面必须逐名相等」）；恢复后变绿。所以这条断言不是恒绿的摆设。

#### 四、审计与评审轮次

- **内部偏离审计（explore，只读）**：1 轮。0 必修 · 3 应修（全在设计档，属设计席的笔）· 4 记录。
- **代码评审（advisor `type:"code"`）**：1 轮，结论 `pass`；🔴 0 · 🟡 2 · 🔵 3。
- **修正轮**：1 轮（同一笔落）：用例档补两句免责（端侧腿是直调函数，不证 VS Code 入口可达；两边喂的是核内置表而非端侧自有登记表）+ 桩文件跑完回收。
- **终态 = `clean`**：本席可修的全修；余下 🟡 两条分别属设计档（设计席的笔）与设计前提裁定（见第六节）。

#### 五、出声明清单改动（2 档，如实登记）

- `docs/batches/2026-11-02-tester-role.test.mjs`——本批单测档。理由：设计 §6.59.5「机检命令 = `node --test <本批单测档>`」认的载体；本轮改了公式，夹具不带 `advisor` 就测不到第二枚减法（用例名会与代码不符）。
- `thincoder-core/agent/family-tools.mjs`——一行注释。理由：注释里的公式是本轮改动的同一条判据，留着旧形等于让下一位读者按错公式核对代码。

#### 六、[上抛·待裁] / [上抛·知会]

**[上抛·待裁] 1 · 设计前提与盘上事实相左（端侧 `depth > 0` 面是否可达）**

设计 §6.59.2 ⑥ 说「`tester` 不在该判据里 ⇒ VS Code 端的 tester 子代拿 `builtinTools` 全集（含写面）——是缺陷」。盘上实读：`buildToolTable` 全仓唯一调用点 = `thincoder-vscode/src/agent/setup.mjs` 的唯一上游 `hydrateRun`，而 `hydrateRun` 的唯一调用点传的是 `depth: 0, role: null`（`thincoder-vscode/src/extension/panel-turn-loop.mjs:198`）。

⇒ VS Code 端的子代理装配眼下走的是核 `buildSpawnChild` 一条路，端侧那条 `depth > 0` 分支（连同既有的 explore/plan/consult 只读分支）在运行期不可达。

本席按设计把分支落了（它无害，且是设计点名要的续修），但「用户可见端差已消」这句话缺一条可达性读数。要不要改记「防御面 / 未来面」、或删分支，请父侧裁（设计档是设计席的笔，本席不写）。

**[上抛·知会] 2 · 设计档三处时态已过期（设计席的笔）**

`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.3 的 `subagent-spawn.mjs` 行仍写「`TRIMMED` 的 `advisor` 一枚盘上尚未落」；同表 `tool-table.mjs` 行仍写「depth>0 基础集过滤**尚未**含 `tester`」；§6.59.2 ⑥ 的「实施轮须在该行补 `tester` 分支（续修）」同理。三处盘上均已落（`subagent-spawn.mjs` 的 `TRIMMED` · `tool-table.mjs` 的 `isTesterRole`）。

**[上抛·知会] 3 · MCP 下两端不同集（设计缺口，非本轮引入）**

端侧 `buildToolTable` 在 tester 分支之外无条件并入 `mcpTools`，核侧 tester 分支只认只读集 ⇒ 父侧一挂 MCP，两端名集就不同，AC-TT2 那句「两端名集不等 = 不通过」在该配置下不成立。explore ∥ plan 同样如此（端侧只筛 `builtinTools`），故不是本角色引入的。本批集成用例走 `mcpServers: []`，不覆盖此面——已在用例档头写明。要不要在设计档补一句 MCP 处置，口径由父侧定。

**[上抛·待裁] 4 · AC-TT3 ∥ AC-TT4 的真实派单（沿用上一轮，未变）**

本席是 depth>0 子代理，子通道 `subagent` 的 role enum = `["explore"]`，派不出 tester。真实模型下的四块报告形态只能由父侧在 depth-0 各派一次（必败 ∥ 必过），读数请落 §5。

## §6 验证与收口（父代理）

### 6.1 交付面（八条目逐条）

| # | 条目 | 落点（实现侧） |
|---|------|----------------|
| 1 | F-TT1 角色存在且两模式可派 | `thincoder-core/agent-tools/subagent.mjs`（schema enum ∥ `ROLES` ∥ 拒文）· `thincoder-core/agent/family-tools.mjs`（两模式 enum）· `thincoder-core/prompt-overlays.mjs`（`SLOT_CONTENTS` ∥ `SCENARIO_SLOT_FILES`） |
| 2 | F-TT2 执行面不预先阉割 | `thincoder-core/agent-tools/subagent-spawn.mjs`：`TRIMMED = new Set(["verify", "advisor"])` |
| 3 | F-TT3 报告 = 读数不是结论 | `thincoder-core/prompts/persona-tester.md`（新建，英文运行期档；中文正文 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.10） |
| 4 | F-TT4 只跑不改 = 角色契约 | 工具表里无 `write` / `edit` / `apply_patch` / `delete` / `batch` / `advisor`；不设机械拦截 |
| 5 | F-TT5 任务书五项与 explore 同形 | 不进 `ENGINEERING_ROLES` ⇒ 自动取五项；缺项机械拒并点名 |
| 6 | `F-TT4-补` 越权读数两条 | 人格档要求子侧自报写盘落点；父侧 `git status --porcelain` 前后差集 |
| 7 | 端侧角色面 | `thincoder-vscode/src/agent/tool-table.mjs`（enum ∥ `testerSuffix`；`depth > 0` 分支 = **防御面，运行期不可达**） |
| 8 | 集成面 | `test/integration/tester-role.test.mjs`（30-1）· `test/RTM.md` 第 30 节 |

### 6.2 验证读数（父侧实跑，非转述）

- 本批单测档 `docs/batches/2026-11-02-tester-role.test.mjs`：**8 / 8**（实施席跑；含 AC-TT1-a…e ∥ AC-TT2 ∥ AC-TT2-b ∥ AC-TT6）。
- 集成用例 `test/integration/tester-role.test.mjs`：**1 / 1**（父侧复跑，2026-11-02 19:15 与 19:27 两次皆绿）。
- **发布门（父侧，全量套件）**：`node test/run.mjs` ⇒ `tests 124 · pass 124 · fail 0 · exit 0`。
- 红-绿对照：端侧分支退回旧形 ⇒ 30-1 红；恢复 ⇒ 绿（断言确实会咬）。
- 文档门：`doc_check(mode:"gate")` ⇒ `DOC-CHECK GATE: PASS`（6 档全清）。

### 6.3 未验项（如实登记，不冒充已验）

**F-TT3 的四块报告形态未在真实模型下验过。** 本进程启动于 2026-11-02 18:25，其角色表是启动时装配的那一份；`tester` 于 18:5x 才落码 ⇒ 父侧实调 `subagent(role:"tester", …)` 返回 `Unknown subagent role: "tester"`。集成 30-1 用的是**真工具面 + 真跑者**（真门 → 真装配 → 真 `bash` 跑真 `node --test`），只证「受理 ∥ 工具表无写面 ∥ 读数原样回到父侧」，**不证人格档四块形态**。

**⇒ 必须重启后补一次真派单（必败 ∥ 必过各一），读数落本节；在此之前本条按「未验」记，不按「已验」。**

**端侧 `depth > 0` 分支运行期不可达**（实读：`buildToolTable` 全仓唯一调用点是 `thincoder-vscode/src/agent/setup.mjs` 的 `hydrateRun`，其唯一调用点传 `depth: 0, role: null`）⇒ 该分支按**防御面**记账，不是「已修的缺陷」，也不构成「用户可见端差已消除」的证据。

### 6.4 已知差异（明说，不沉默）

- **MCP 工具两端不同集**：核侧 tester 分支只认只读集，`mcpTools` 不在其列；端侧 `buildToolTable` 在角色分支之外无条件并入 `mcpTools`。同一缺口对 `explore` / `plan` 同样存在，**先于本批**，修它要动 MCP 面 ⇒ 本批只登记不修（`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.7 边界 8）。

### 6.5 收口链检查

- **暂缓批复核**：无（本会话无暂缓批）。
- **§2 ↔ 设计档对账**：设计席修正轮 5 已把 §2 的「端差 = 缺陷」一句改成区别对待（enum 面 = 缺陷 ∥ `depth > 0` 分支 = 防御面），与设计档两处同口径。
- **§2 ↔ §5 对账**：§5 记 14 档实施 + 6 档续修，§2 受影响表逐行对得上。
- **前批遗留**：无（本批自持一行）。
- **用户文档面同步**：`thincoder-core/tool-docs/subagent.md` 角色矩阵已随批更新。
- **台账**：`#2004` 指针指向本档，收口后核销。

### 6.6 单测档处置

**⇒ `docs/batches/2026-11-02-tester-role.test.mjs` 收口即删（读数已记 §6.2）。集成用例 `test/integration/tester-role.test.mjs` 留在盘上，属发布门。**

**⇒ 集成集计数：本批新增 1 行（故事 30 的 30-1），现有 31 节 / 窗口约 50–100 ⇒ 在窗内。**

### 6.7 真派单读数（补 §6.3 的承诺 · 2026-11-02 19:47 重启后）

**重启使角色表重新装配，`tester` 已在表内。两次真派单（必败 ∥ 必过）各一次，读数如下。**

**派单门先咬了一口**：父侧第一次派单漏了 `acceptance`，被 `Spawn task-book gate (role='tester')` 当场拒，拒文点名 `acceptance — missing` ⇒ `F-TT5` 机械成立（缺一份即拒、并点名缺哪个），不靠人记得。

| 跑 | 命令 | exit code | 计数（跑者原话） | 失败用例 |
|---|---|---|---|---|
| 必败 | `node --test test/integration/nonexistent-xyz.test.mjs` | node 进程 = `1`（外层 bash 包装 = `0`，因尾部 `Write-Output` 成功） | 「跑者未给计数」——输出无 `# pass` / `# fail`，加载阶段即退出 | 0 条；只有 `Could not find 'test/integration/nonexistent-xyz.test.mjs'` |
| 必过 | `node --test test/integration/grep-process-doc-mark.test.mjs`（会话锚是 `D:\teamcode`，直接跑 exit 1；`Set-Location` 到仓根后重跑） | `1`（首次，cwd 不对）→ `0`（仓根重跑） | 逐字：`tests 18 / pass 18 / fail 0` | 无（`ℹ fail 0`） |

**四块形态逐条对照**：

- **① 命令原文 + exit code**：两跑都给了；必败那条把「node 自身」与「bash 包装」两个 exit code 分开写，并说明差因。
- **② 汇总行逐字引用**：必过跑逐字引了七行；必败跑写「跑者未给计数」并说明为何没有 —— **没有编一个数**。
- **③ 失败用例名**：必败跑按实说「跑者没有给出任何用例名」，只给找不到档那一行。
- **④ 摘要块**：必败跑输出共 1 行（少于 40 行，全录）；必过跑输出 25 行（全录），均无错误栈段。

**三次自我披露（都不是我要求的，而是它们主动写的）**：

1. 必败跑披露它加了 `Write-Output "EXITCODE=$LASTEXITCODE"` 尾巴（否则拿到的是假绿 `0`）。
2. 必过跑披露它第一次在会话锚 `D:\teamcode` 下跑失败（exit 1），并说明 `Set-Location` 是它加的、命令本体逐字未改。
3. 两跑都在建议处标注「未执行，供父侧裁量」，没有自己动手。

**结论：`F-TT3` 的四块报告形态成立**（此前只有机制级证据，无模型行为证据）。**两跑均未出现「替父侧下收口结论」的句子。**
