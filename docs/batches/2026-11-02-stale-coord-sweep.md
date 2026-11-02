# 2026-11-02 · stale-coord-sweep
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-02 · 来源 = 用户 2026-11-02 01:32「你拿1975-77这三项试试新代码呗」—— 取台账 #1975（helpers 号漂坐标，已知旧值窗口）；按判据换成符号名、不做偏移重算。
> 台账 = #1975（TOOLS · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

- **已定决定**：把 helpers 拆分后「号漂」的坐标按判据换成**符号名**，不做偏移重算。 · 用户原话：「**你拿1975-77这三项试试新代码呗**」 · 时间：2026-11-02 01:32

### 现状

`thincoder-core/agent/helpers.mjs` 已 500 → **407** 行、`thincoder-core/agent/offload.mjs` **98** 行（#1973 已收口）。**「对象换了档」那 19 处已由 #1973 的 A9 改指完毕**；**剩下的是「号漂」型** —— 符号仍在原档，只是行号偏移。

### 判据（本项目已立，直接引用不重述）

**行号一律不作引用**（`docs/core/design/DOC-DISCIPLINE.md` D4 细则族）。代码面的正确形 = **符号名**，不是新行号。

### 为什么不做偏移重算

偏移重算 = 把这个成本再付一次，**下一次搬动又得重付**。这正是「行号作引用」的账单，**今晚已经在一个批里现结过一次**。

### 设计席要先判的三件

1. **清单重出** —— 不许沿用任何历史数。**口径写死**（归属键 = 哪几种写法归一、域 = 什么、围栏内算不算），并在**两种形态**下各扫一遍（全路径形 ∥ 裸 `xxx.mjs:NN` 形）。**裸形态整类逃出上一轮射程**，这次必须在射程内。
2. **逐处换形的判法** —— 句子删掉行号后还读得通吗？读不通 ⇒ 补什么（符号名 ∥ 节名 ∥ 逐字引文）。**判据已立：删后读得通 ⇒ 那个坐标从来不是它的定位物。**
3. **工作量分桶** —— 按「一句话一处」与「一张表 N 处」分，给出档数与处数，让实施轮能按桶推进。

### 一条边界

**只改坐标形，不改句子的主张。** 发现某处坐标所指的那句已经不在盘（语义悬空）⇒ **不猜号、不倒填**，改指节名并写明「旧句已不在盘」，或删坐标。**碰到这类就报上来，不代改主张。**

### 另一条

**`docs/batches/**` 零改**（过程档，整份可删，不参与清账读数）。

### 1.1 设计轮上抛 · 父侧裁决（2026-11-02 01:37）

**① 「对象换了档」的 19 处：纳批。**

**理由**：它们不是号漂，**但仍然是行号引用** —— 同一条判据成立、同一批文档、同一笔作业，边际成本近零。**不纳的代价是：下次触达它们是另起一批的完整流程（设计 → 评审 → 实施），而那时的结论和现在一模一样。**

**并且记一条教训**：`#1973` 的 A9 当时把 19 处改指到新档的实档行 —— **那只是把错坐标换成对坐标，坐标本身还活着。** **对的做法是那一步就该换成符号名。** 本批顺带把它补上，**不是因为 A9 做错了，是因为 A9 只做到了判据的一半**。

**② 需求档 4 处（`docs/core/requirements/AGENT-PARAMS.md` ×2 ∥ `docs/core/requirements/TURN-CAP-CONTINUE.md` ×2）：父侧自己落，纳本批交付。**

**设计席给形态即可**（哪一处删、哪一处补符号名），**落笔由父侧**（需求档 = 主 agent 的笔）。**别写进实施轮写域。**

**③ 语义悬空桶 = 0、零新增行号 —— 两条都对，照此执行。**

**④ 引文桶那 1 处（`docs/core/design/AGENT-LOOP.md` 引 vsc 档自述句）：判法对。**

**改别人的引文 = 把别人的话改成我们方便的样子。** 「引文不动 + 引文外补一句定位」是唯一诚实的落法。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-11-02
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 条目 | 状态 | 判据指针 |
|---|---|---|---|
| E1 | **两类分开**：「对象换了档」与「号漂」各出各的数，不重扫已改完的那一类 | ✅ 覆盖 | 本文 §2.2 |
| E2 | **清单重出**：不沿用任何历史数；口径三样（归属键 / 域 / 围栏）写死，两种形态都在射程内 | ✅ 覆盖 | 设计档 `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则 + 本文 §2.3 |
| E3 | **逐处换形态**：删后读得通 ⇒ 删坐标；读不通 ⇒ 补符号名 / 节名 / 逐字引文 | ✅ 覆盖 | 本文 §2.4 ∥ §2.5 |
| E4 | **语义悬空与引文内坐标**单独一桶，不猜号、不倒填 | ✅ 覆盖 | 本文 §2.6 |
| E5 | **只改坐标形，不改句子的主张** | ✅ 覆盖（边界） | 本文 §2.4 判据句 |
| E6 | `docs/batches/**` 零改；不做偏移重算（不写任何新行号） | ✅ 覆盖（边界） | 本文 §2.9 |

### 2.2 两类分开的两个数

- **「对象换了档」= 19 处，已完**：`#1973` A9 已把 `helpers.mjs` 里搬到新档的对象改指到 `thincoder-core/agent/offload.mjs` 的实档行。**本批一处不碰**。复核过：这 19 处逐处与现盘对得上（`safeSliceUTF16` / `safeSliceUTF16End` / `buildDualEndPreview` / `offloadToolResult` / `cleanupOldToolResults` / `TOOL_RESULT_OFFLOAD_LIMIT` / `TMP_RETENTION_MS` 及各回退支）。
- **「号漂」= 80 处 / 18 档，本批清**：符号仍在 `thincoder-core/agent/helpers.mjs`，只是行号已偏。
- 分开的办法 = 归属键（同一条被引档的路径形态归一处）+ 符号是否仍在原档（实读原档判定，不看旧号）。

### 2.3 口径三样（实施轮照此复现同一个数）

口径本体 = 设计档 `docs/core/design/DOC-DISCIPLINE.md` §1 的 D4 细则「一支内清账的扫描口径」块（单一权威源，本文不重述）。本文只记本批的实际取法：

- **归属键**：`thincoder-core/agent/helpers.mjs` ∥ `agent/helpers.mjs` ∥ 裸 `helpers.mjs` 归一；`run-helpers.mjs` / `config-helpers.mjs` / `thincoder-core/mcp/helpers.mjs` 各是各的档，不入集。
- **续接形**：`helpers.mjs:161`–`:167`、`:454` `:461` 逐号计处；每号归属 = 同行最近的前一个路径 token，`.md` 亦作 token（挡 `.md:NN` 被前一个 `.mjs` 认领）。
- **域**：本仓 `git ls-files` 的 `*.md`，扣 `docs/batches/**`、`**/_archive/**`、`thincoder-cli/docs/**`、`thincoder-vscode/docs/**`（两参照历史树）、`TODO` 两档、`thincoder-desktop/dist*/**`。
- **围栏**：围栏内不计入清账面，**读数另报**：本批实测 **0 处**（口径跑出，非"没看"）。

### 2.4 换形的判法（三类，判据已立）

- **判据句**：删掉坐标后句子**还读得通** ⇒ 那个坐标从来不是它的定位物 ⇒ **删**。读不通 ⇒ 句子靠这个坐标定位 ⇒ **补定位物**：补符号名（代码面）／补节名或逐字引文（规则面）。
- **A 删（62 处）**：句子里已经有符号名 / 常量名 / 钩子名 —— 坐标是重述，删。
- **B 补（17 处）**：句子只靠坐标指物（多为表格首格只有一个坐标、或并列串里只有一个档名）—— 把坐标换成符号名 / 常量名。
- **C 引文内不动（1 处）**：坐标是被引对象的**原文**（另一份档里的自述句），改它即改引文。处置 = 引文字面保留，坐标指出的对象在引文外补符号名（见 §2.6）。
- **零新行号**：全批不写任何一个新行号（偏移重算 = 把这一轮的成本留给下一轮再付一次）。

### 2.5 逐处清单（档 · 行 · 处 · 落法 · 补什么）

A = 删坐标；B = 坐标换符号名；C = 引文内不动。行号 = **改前**的行号（改后不再有定位含义）。

**`docs/core/design/PROMPT-SYSTEM.md`**（18 处 / 7 行）

| 行 | 处 | 落法 | 补什么 |
|---|---|---|---|
| 741 | 1 | A | `loadProjectInstructions` 已在句中 |
| 905 | 4 | A | 四个常量名已在句中（`AUTO_TURN_DIGEST_DOMAIN_ENG` / `UPSTREAM_TURN_DOMAIN` / `TIMER_TURN_DOMAIN` / `DIGEST_ACCOUNT_DOMAIN`） |
| 913 | 1 | B | 首格 → `AUTO_TURN_DIGEST_DOMAIN_ENG` |
| 914 | 1 | B | 首格 → `UPSTREAM_TURN_DOMAIN` |
| 915 | 2 | B | 首格 → `TIMER_TURN_DOMAIN` |
| 916 | 6 | B | 首格 → `DIGEST_ACCOUNT_DOMAIN`；两处「与 `:469`–`:470` 同形」→「与 `UPSTREAM_TURN_DOMAIN` / `TIMER_TURN_DOMAIN` 同形」 |
| 944 | 1 | B | → `DIGEST_ACCOUNT_DOMAIN` |
| 945 | 2 | B | → `UPSTREAM_TURN_DOMAIN` / `TIMER_TURN_DOMAIN` |

**`docs/core/design/TOOL-OUTPUT-LIMITS.md`**（19 处 / 11 行，全 A，对象均已搬到 `thincoder-core/agent/offload.mjs`）

| 行 | 处 | 补什么 |
|---|---|---|
| 30 | 2 | `safeSliceUTF16` / `safeSliceUTF16End` 已在句 |
| 35 | 1 | `offloadToolResult` 已在句 |
| 37 | 1 | `TOOL_RESULT_OFFLOAD_LIMIT` 已在句 |
| 41 | 1 | 长度门——补「`offloadToolResult` 的长度门」 |
| 45 | 3 | `TMP_RETENTION_MS` 已在句；`:85`–`:91` 一段 → 补 `offloadToolResult` 的落盘与回显段 |
| 53 | 2 | 回退支——补 `offloadToolResult` 的 catch 支 |
| 84 | 2 | 四常量——首格已列常量义，坐标删 |
| 85 | 1 | `TMP_RETENTION_MS` 已在句 |
| 86 | 2 | head `safeSliceUTF16` / tail `safeSliceUTF16End` 已在句 |
| 87 | 1 | `buildDualEndPreview` 已在句 |
| 88 | 3 | `offloadToolResult` / `cleanupOldToolResults` 已在句（第 3 处 = 清理调用点，补「`offloadToolResult` 内的清理调用」） |

**`docs/core/design/AGENT-PARAMS.md`**（7 处 / 7 行，全 A）：行 30 / 38 / 42 / 51 / 52 / 53 / 66 —— 每句都已写出常量名（`DEFAULT_MAX_TURNS` / `DEFAULT_GOAL_TURNS` / `DEFAULT_SUBAGENT_TURNS`），删坐标即可。

**`docs/core/design/LIGHT-CHANNEL.md`**（7 处 / 5 行）

| 行 | 处 | 落法 | 补什么 |
|---|---|---|---|
| 204 | 1 | A | `FILE_MUTATORS` 已在句 |
| 212 | 1 | A | 同句「`name: "FILE_MUTATORS"`」已在 |
| 232 | 2 | A | `toolTouchPaths` / `touchedPaths(args)` 已在句 |
| 234 | 1 | B | 单参兜底 → 补 `toolTouchPaths` 的「其余工具单参兜底」支 |
| 236 | 2 | A | `FILE_MUTATORS` / `toolTouchPaths` 已在句 |

**`docs/core/design/TURN-CAP-CONTINUE.md`**（6 处 / 5 行，全 A）：行 31（2 处，`DEFAULT_MAX_TURNS` / `DEFAULT_SUBAGENT_TURNS` 已在括注）· 50（`turnFrame` 已在句）· 171（帧公式逐字已在句）· 241（`ContinueError` 载荷已在句）· 243（`ContinueError` 自身 message 已在句）。

**`docs/core/design/AGENT-LOOP.md`**（3 处 / 3 行）：行 51 → **C**（引 `thincoder-vscode` 一份档的自述句，坐标是被引原文）；行 406 → **B**（补 `turnFrame`——删后「→ `thincoder-core/agent/helpers.mjs`，`turn = seq`」指向整档，读不通）；行 552 → **A**（`ContinueError` 已在句）。

**`docs/core/design/AGENT-LOOP-ASYNC-POOL.md`**（2 处 / 2 行，全 A）：行 272（`escapeXml` 已在句）· 395（`TIMER_TURN_DOMAIN` 已在句）。

**`docs/core/design/AGENT-LOOP-UPSTREAM.md`**（2 处 / 2 行，全 A）：行 389（`AUTO_TURN_DIGEST_DOMAIN` 已在句）· 884（`FILE_MUTATORS` 已在句）。

**`docs/core/design/MODEL-BENCH.md`**（2 处 / 2 行，全 A）：行 1548（`FILE_MUTATORS` 已在句）· 1614（`MIN_REPORT_CHARS` 已在句）。

**`docs/core/design/TOOLS.md`**（2 处 / 2 行，全 A）：行 750（`readonlyToolNames` 已在句）· 869（`excludeSubagentTools` 已在句）。

**`docs/core/design/AGENT-LOOP-SUBAGENT.md`**（1 处 / 1 行）→ **B**：行 573 表内「活体守卫行」一格的裸坐标 → 补 `injectEngineeringReminder`。

**`docs/core/design/MANIFEST.md`**（1 处 / 1 行）→ **B**：行 798 只读角色过滤那一枚坐标 → 补 `readonlyToolNames`（同句的 `tools.filter((t) => t.readonly)` 是谓词字面，不是名字）。

**`docs/core/design/CHECKPOINT.md`**（1 处 / 1 行）→ **A**：行 32，`escapeXml` 已在句。

**`docs/core/design/ENGINEERING-MODE-V2.md`**（1 处 / 1 行）→ **A**：行 431，`ENG_ON_REMINDER` 已在句。

**`docs/core/design/SESSION.md`**（1 处 / 1 行）→ **A**：行 410，`collectGitContext` 已在句。

**`docs/server/design/agent/ADMIN-AGENT.md`**（3 处 / 2 行，全 A）：行 489（`TIMER_TURN_DOMAIN` / `AUTO_TURN_DIGEST_DOMAIN` 已在句）· 行 619（`repairHistory` 已在句——此枚是裸形 `:279`，包说明符 `@thincoder/core/agent/helpers.mjs` 挡住了按路径 token 抽取，属本批要收进射程的裸形态）。

### 2.6 两个专门桶

- **语义悬空桶 = 0 处**：本批逐处核过坐标所指的那句仍在盘（符号仍在原档），无一处需要写「旧句已不在盘」。这是**读数**，不是没查。
- **引文内坐标桶 = 1 处**：`docs/core/design/AGENT-LOOP.md`。该坐标出自被引档 `thincoder-vscode/src/agent/context-injections.mjs` 的自述句「CLI 对位 `thincoder-core/agent/helpers.mjs:275-348`」，是引文的一部分；改字面即改引文。落法 = 引文字面不动，在引文外补一句「该段现已分居 `agent/helpers.mjs` 与 `agent/offload.mjs`，据符号名定位」。
- **不改桶 = 1 处**：`docs/core/design/DOC-DISCIPLINE.md` 里 `helpers.mjs` 那一行（`:368` `§17`）。该表是**代码面**行号引用清单的读数（列的是源码注释里带着的坐标），不是文档面坐标；本批不动代码面，故该行不改，登记于此以免下一轮当漏项。

### 2.7 分桶（实施轮推进顺序）

- **一句话一处 = 41 处 / 16 档**：一条句子里一枚坐标，改一处即完（A 类为主）。
- **一张表 N 处 = 39 处**：`docs/core/design/TOOL-OUTPUT-LIMITS.md` 的常量表（7 行 / 19 处）· `docs/core/design/PROMPT-SYSTEM.md` 的收正表（4 行 / 10 处）· `docs/core/design/AGENT-PARAMS.md` 三张表（6 行 / 6 处）· `docs/core/design/AGENT-LOOP-SUBAGENT.md` / `docs/core/design/MANIFEST.md` / `docs/core/design/LIGHT-CHANNEL.md` 的单行表格 4 处。
- **并列表（一个档名带多号）= 2 行**：`docs/core/design/TURN-CAP-CONTINUE.md` 行 31 · `docs/core/design/PROMPT-SYSTEM.md` 行 905 —— 一行多号，逐号处理。

### 2.8 受影响文件与测试覆盖

**设计档面 = 16 档**（实施轮写域）：

- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`
- `docs/core/design/AGENT-LOOP-SUBAGENT.md`
- `docs/core/design/AGENT-LOOP-UPSTREAM.md`
- `docs/core/design/AGENT-LOOP.md`
- `docs/core/design/AGENT-PARAMS.md`
- `docs/core/design/CHECKPOINT.md`
- `docs/core/design/ENGINEERING-MODE-V2.md`
- `docs/core/design/LIGHT-CHANNEL.md`
- `docs/core/design/MANIFEST.md`
- `docs/core/design/MODEL-BENCH.md`
- `docs/core/design/PROMPT-SYSTEM.md`
- `docs/core/design/SESSION.md`
- `docs/core/design/TOOL-OUTPUT-LIMITS.md`
- `docs/core/design/TOOLS.md`
- `docs/core/design/TURN-CAP-CONTINUE.md`
- `docs/server/design/agent/ADMIN-AGENT.md`

**需求档面 = 2 档 / 4 处**（不归本席，也不归实施轮）：

- `docs/core/requirements/AGENT-PARAMS.md` 行 20 / 21（2 处，A）
- `docs/core/requirements/TURN-CAP-CONTINUE.md` 行 17（A）· 行 33（B：补 `DEFAULT_MAX_TURNS` / `DEFAULT_SUBAGENT_TURNS`）

需求档 = 主 agent 笔（D1）。这 4 处随本批上抛，由主 agent 落。

**跨层判定**：本批零代码面、零测试面、零数据面改动 —— 全部改在文档文本内，无档跨层，无拆分计划。

**测试覆盖（改面反馈环）**：本批没有可跑的业务断言，判据是**复扫**——同一段扫描口径在本批改完后重跑，设计档面读数必须为 0（A / B 清零），余下恰为 C 1 处 + 不改 1 处。复跑即本批的验收命令。

**集成测试**：`test/RTM.md` **差量 = 0 行**（不新增、不改写、不删）。理由 = 本批是文档面坐标形收正，无任何业务可观测结果变化，也无用户可见入口；集成用例的两个生长点（产品真需要的业务场景 / 生产真出过的问题）都不落在这类改动上。

### 2.9 验收对照（回指 §2.1）

| 条目 | 验收判据（机器可判） |
|---|---|
| E1 | 复扫结果里「指向 `thincoder-core/agent/offload.mjs`」的处数 = 19 且与改前逐处相同（本批零触碰） |
| E2 | `docs/core/design/DOC-DISCIPLINE.md` §1 含「一支内清账的扫描口径」块（`grep -c` ≥1），块内三样（归属键 / 续接形 / 域与围栏）各 ≥1 行 |
| E3 | 改后复扫：设计档面 helpers 面读数 = **0**；`offload.mjs` 面读数与改前相同（19） |
| E4 | 悬空桶空（0 处）；引文桶 = 1 处（`docs/core/design/AGENT-LOOP.md`）且该档引文字面逐字未变 |
| E5 | 逐档 `git diff` 只含坐标形改动：删 / 换符号名的行与改前相比，除坐标片段外正文逐字相同 |
| E6 | `docs/batches/**` 在 `git status --porcelain` 内零行；全批 diff 内**零新增行号**（新出现的 `:NN` 除本 §2 记录用例外为 0） |

**交付门**：`doc_check(mode:"gate")` 首行 `DOC-CHECK GATE: PASS`。

### 2.10 关键决策

1. **换符号名，不重算行号** —— 行号指向位置不指向内容，插一行即全漂；重算等于把成本再付一次（D4 细则已立此判据，本批照用）。
2. **口径写进设计档，不只留在批档** —— 上一轮的缺口不是「没扫」，是**没写口径**：裸形态整类逃出射程，扫出来的数下一次无法复现。口径属长期面，批档整份可删。落点 = `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则（该处已持「分批推进」清法，口径贴着清法住）。
3. **A 删优先于 B 补** —— 句中已有符号名时，补第二个定位物是重复（D2）；只有句子确实靠坐标定位才补。
4. **引文内坐标不动** —— 改引文字面 = 把一份档的自述改成我们方便的样子，读者对不上原档。
5. **围栏内不计数、但报读数** —— 围栏内坐标是命令字面的组成部分，改它即改命令语义；读数单报，避免"没看"与"没有"混同。
6. **需求档 4 处转主 agent** —— 写权矩阵（D1）不分批次，需求档的笔只在主 agent 手上。

### 2.11 上抛项

- **[上抛·待裁] `offload.mjs` 那 19 处是否本批一并换符号名**：它们不是「号漂」（对象换了档，`#1973` 已改指），但它们**仍是行号引用**——同一条判据（行号不作引用）对它们成立，同一份档、同一笔改动顺带即可完成；本批不动，下一次触达就是另起一批的完整流程。
  **我的倾向 = 纳批**（判据同一 · 同档一笔 · 边际成本近零）。**未获裁决前按任务书口径执行：不纳。** 注：`docs/core/design/TOOL-OUTPUT-LIMITS.md` 在本批受影响文件表内（§2.8），两口径下它都要改，差别只在它是改 19 处还是 0 处。
- **[上抛·待裁] 需求档 4 处**（`docs/core/requirements/AGENT-PARAMS.md` ×2 · `docs/core/requirements/TURN-CAP-CONTINUE.md` ×2）：写权归主 agent，本席与实施轮都不落笔，请主 agent 排入本轮或另派。
- **[上抛·知会] 代码面读数行不改**：`docs/core/design/DOC-DISCIPLINE.md` 里 `helpers.mjs` 那一行是代码面的行号引用读数，本批不动代码面，登记在 §2.6 以免下一轮当漏项。

### 2.12 修正轮：§1.1 两条裁决的落地（2026-11-02）

本节即 §2.11 两条上抛的处置结果；§2.1 – §2.10 的判法、口径、逐处清单照用，只改被裁决动到的三处：① 那 19 处纳批 · ② 处数/档数重算 · ③ 需求档 4 处的形态。写域 = 本文 §2 ∥ `docs/core/design/DOC-DISCIPLINE.md`（A9 教训一条）∥ `docs/core/design/TOOL-OUTPUT-LIMITS.md` 的换形形态（只登记，落笔在实施轮）。

#### 2.12.1 ① 纳批的 19 处 —— 现态实读只剩 2 行 / 3 处，其余 16 处已由 `#1976` 换形

落笔前实读 `docs/core/design/TOOL-OUTPUT-LIMITS.md` 现态：带行号的 `offload.mjs` 坐标现在只剩下面两行。父侧预警的坑成立 —— 上一轮为这 19 处写的「补什么」有 16 处已没有落笔对象。

| 行（现态） | 处 | 落法 | 补什么 |
|---|---|---|---|
| 38 | 1 | A | 句内已有 `TOOL_RESULT_OFFLOAD_LIMIT`（「两族按同一常量 `TOOL_RESULT_OFFLOAD_LIMIT`（`thincoder-core/agent/offload.mjs:8`）二分」）⇒ 删 `:8`，留档路径 |
| 85 | 2 | A | 首格「落盘阈值 + preview 四常量」已列对象义，§2 代码块列了四个常量名 ⇒ 删 `:8`–`:11`，留 `thincoder-core/agent/offload.mjs` |

**其余 16 处已不在盘**：`#1976` 同期把该档双端切片两条陈述与 §3 的坐标改成了符号锚 —— `safeSliceUTF16` / `safeSliceUTF16End` / `buildDualEndPreview` / `offloadToolResult` / `cleanupOldToolResults` / `TMP_RETENTION_MS` 各句现只剩符号名 + 档路径。**⇒ 实施轮就这 2 行动手，不按上轮读数找 19 处**；找不到不是漏项。

#### 2.12.2 重算的两个数（口径 + 读数 + 与上轮的差）

**口径** = 本文 §2.3 三样；本轮补两处实读出来的边界：

- **包说明符形入归属键**：`@thincoder/core/agent/helpers.mjs` 这种带 `@` 的写法，上轮的路径 token 抽取被 `@` 挡在射程外，同行那个裸 `:279` 整类漏记。实例 = `docs/server/design/agent/ADMIN-AGENT.md` 第 619 行，本轮收进射程，计 **1 处**。这正是「裸形态整类逃出射程」里最隐蔽的一支。
- **口径块自身的示例不入清账面**：`docs/core/design/DOC-DISCIPLINE.md` 第 65 行（续接形示例 `helpers.mjs:161`–`:167` · `:454` `:461`，4 处）是规则自身的形态示例，按 D8「提到 ≠ 引用」不是引用 ⇒ **不入清账面，读数另报**。

**读数（本轮 `node` 实算 · 2026-11-02 · 域 = 跟踪面 `*.md` 扣 §2.3 所列）**：

| 桶 | 处 | 档 | 处置 |
|---|---|---|---|
| helpers 支 · 设计档 | 60 | 15 | 本批清（实施轮） |
| offload 支 · 设计档 | 3 | 1 | 本批清（实施轮），档 = `docs/core/design/TOOL-OUTPUT-LIMITS.md` |
| helpers 支 · 需求档 | 4 | 2 | 本批交付，**父侧落笔**（形态见 2.12.3） |
| **本批交付面合计** | **67** | **18** | |
| 例外桶：`docs/core/design/DOC-DISCIPLINE.md` | 5 | 1 | 4 = 口径块示例（提到 ≠ 引用）· 1 = 代码面读数行（§2.6 不改桶，照留） |

**档数不变 = 18**（16 设计档 + 2 需求档），与上轮一致。

**与上轮读数（80 处 / 18 档）的差，逐项**：offload 支 **19 → 3**（`#1976` 已换形 16 处）· `docs/core/design/PROMPT-SYSTEM.md` **18 → 21**（该档现盘多出 1 行坐标，属他批新增）· `docs/core/design/DOC-DISCIPLINE.md` **+5**（上轮没扫出：示例 4 + 读数行 1）。

**父侧「80 → 99」不成立**：99 的算子是 80 + 19，但那 19 已经在上轮的 80 里（上轮 §2.5 的 offload 行就是它），再按现态 16 处已被 `#1976` 换形 ⇒ 真实数是 **67**。两个数都按本节给，实施轮照 67 复核。

**复现命令**（cwd = 仓根；产出的三个计数即本节的 60 / 3 / 4）：

```js
const { execSync } = require('node:child_process'), fs = require('node:fs');
const EXCL = [/^docs\/batches\//, /(^|\/)_archive\//, /^thincoder-cli\/docs\//, /^thincoder-vscode\/docs\//,
  /(^|\/)TODO\.md$/, /(^|\/)TODO-archive\.md$/, /^thincoder-desktop\/dist[^/]*\//];
const files = execSync('git ls-files "*.md"', { maxBuffer: 1 << 28 }).toString().split(/\r?\n/)
  .filter(f => f && !EXCL.some(r => r.test(f)));
const HELP = t => /(^|\/)helpers\.mjs$/.test(t) && !/run-helpers|config-helpers|mcp\/helpers/.test(t);
const OFF = t => /(^|\/)offload\.mjs$/.test(t);
const PATH = /@?(?:[A-Za-z0-9_.\-]+\/)*[A-Za-z0-9_.\-]+\.(?:mjs|md)/g, COORD = /:(\d+)(?:-(\d+))?/g;
const FENCE = /^(\s*)(`{3,}|~{3,})/;
for (const f of files) { let open = null; let h = 0, o = 0;
  for (const ln of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const fm = FENCE.exec(ln);
    if (fm) { const ch = fm[2][0], len = fm[2].length;
      if (open === null) open = { ch, len }; else if (ch === open.ch && len >= open.len) open = null; continue; }
    if (open !== null) continue;
    const toks = [...ln.matchAll(PATH)].map(m => ({ t: m[0].replace(/^@/, ''), at: m.index + m[0].length }));
    for (const m of ln.matchAll(COORD)) {
      const prev = toks.filter(t => t.at <= m.index).pop(); if (!prev) continue;
      if (HELP(prev.t)) h++; else if (OFF(prev.t)) o++; } }
  if (h || o) console.log(f + '\thelpers=' + h + '\toffload=' + o); }
```

#### 2.12.3 ② 需求档 4 处的形态（**父侧落笔，本席零触**）

| 档 | 行（现态） | 处 | 落法 | 删 / 补 |
|---|---|---|---|---|
| `docs/core/requirements/AGENT-PARAMS.md` | 20 | 1 | A | 删行号，留档路径：`agent.subagentTurns`（默认 `100`——`thincoder-core/agent/helpers.mjs`） |
| `docs/core/requirements/AGENT-PARAMS.md` | 21 | 1 | A | 删 `:24`：「兜底常量 `thincoder-core/agent/helpers.mjs`」 |
| `docs/core/requirements/TURN-CAP-CONTINUE.md` | 17 | 1 | A | 句中已有 `ContinueError` 与抛点 ⇒ 删 `:239`，留档路径 |
| `docs/core/requirements/TURN-CAP-CONTINUE.md` | 33 | 1 | B | 「默认 200 / 100 / 40——单源 `thincoder-core/agent/helpers.mjs:24-25`」→「单源 `DEFAULT_MAX_TURNS` / `DEFAULT_SUBAGENT_TURNS`（`thincoder-core/agent/helpers.mjs`）」；40 那一档不在该坐标内，原数照留 |

写权归主 agent（D1）——本席给形态不落笔，实施轮也零触这两档。收口时对得上作者。

#### 2.12.4 A9 的教训已落设计档一条

落点 = `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则「清法」段内，新增判据行：**改指不等于换形** —— 把坐标从一份档改指到另一份档的行号，仍是一处行号引用，换的是目标、不是形态；换形只有两条路（符号名 ∥ 节名 + 逐字引文）。

**不是判 A9 做错，是它只做到了判据的一半**：改指当场让读数归位，下一次对象搬动照样重付一次。本批把这 19 处按换形处理（现 3 处），不再改指一次。

#### 2.12.5 验收判据同步（改 §2.9 的 E1 / E3 / E6，其余照旧）

| 条目 | 改后判据（机器可判） |
|---|---|
| E1 | 复扫：offload 支改前 = **3 处 / 1 档**（即 2.12.1 那两行），改后 = **0**；helpers 支改前 = **64 处 / 17 档**（设计 60 / 15 + 需求 4 / 2） |
| E3 | 改后复扫：设计档面 helpers 支 = **0** ∧ offload 支 = **0**；例外桶 `docs/core/design/DOC-DISCIPLINE.md` = 5 处 / 1 档照留（读数另报） |
| E6 | 全批 diff 内**零新增行号** —— 含 `docs/core/design/TOOL-OUTPUT-LIMITS.md` 那 2 行（删号，不写新号） |

**父侧落笔的 4 处不进实施轮的完成读数**：实施轮只对 16 设计档报 0；需求档那 4 处随父侧落笔后另行核。

#### 2.12.6 边界（照旧，只补一句）

不改句子的主张 · 不猜号不倒填 · `docs/batches/**` 零改 · 不做偏移重算 —— 三条都不因纳批而松动。**新增一句**：`docs/core/design/TOOL-OUTPUT-LIMITS.md` 只动那 2 行的坐标形，不动 `#1976` 刚落的符号锚句（同档他批正在改，重写即踩）。

#### 2.12.7 上抛项

- **[知会] 两条上抛均已裁**（§1.1 ①纳批 · ②父侧落笔），本节即处置，无新上抛。
- **[知会] 父侧口径 80 → 99 与实测不符**：真实是 67（算理见 2.12.2）。差异有实物可查 —— `docs/core/design/TOOL-OUTPUT-LIMITS.md` 现盘只剩 2 行带号，`#1976` 已换形 16 处。

### 2.13 修正轮：§3 评审十条落地（2026-11-02）

#### 2.13.1 逐条处置

| # | 处置 | 落点 / 逐字 |
|---|---|---|
| 1 🔴 | **择改法 1（收窄）** | `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则：「**行号引用指向代码件 / 规则面**时，换形只有两条：**符号名** ∥ **节名 + 逐字引文**；其余对象类（报一个量 · 数据档键 · 同档自指）的换形 = 下方「换形怎么落」的五种落法，本行不另立枚举。」 |
| 2 🟡 | 67 基线改为**本轮实算基线**，三桶按档出数、A/B 归属逐处由实施轮判 | §2.13.2 |
| 3 🟡 | **现盘已是 B 形，不必再改**（详见 §2.13.2 的 offload 支读数） | `docs/core/design/TOOL-OUTPUT-LIMITS.md` §6.1 首行：「落盘阈值 + preview 四常量 \| `thincoder-core/agent/offload.mjs`（`TOOL_RESULT_OFFLOAD_LIMIT` · `TOOL_RESULT_PREVIEW` · `TOOL_RESULT_PREVIEW_HEAD` · `TOOL_RESULT_PREVIEW_TAIL`）」——档路径 + 四常量名，无行号 |
| 4 🟡 | 包说明符形写进归属键行 | `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则：「全路径形 … ∥ 裸形 `helpers.mjs` ∥ **包说明符形** `@thincoder/core/agent/helpers.mjs` 四者归一」＋「机检抽取式的左界排除集含 `@`…照写法正则会整类漏记」 |
| 5 🟡 | 取改法 ①（在规则面立条） | `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则新增一条：「**引文内坐标照引**：被引对象**自己的自述句**里带着行号时，那枚号是**引文的字面**…处置 = 引文字面逐字不动 + 在引文之外补定位物」；并写明与「元陈述里也不写具体坐标」不冲突（前者管别人原话，后者管我们自己报量） |
| 6 🟡 | 复现命令补围栏计数器，读数由命令产出 | §2.13.4 |
| 7 🟡 | 先例行补在 §2.13.2 末 | 「先例 = `#1973` A9 改指；对齐 = 同一判据『行号不作引用』；偏离 = 改指只换目标不改形态，理由 = 读数当场归位、成本照付」 |
| 8 🟡 | 公共源勘察行补在 §2.13.2 末 | 「`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]` ⇒ 已查，无相关公共源可引」 |
| 9 🟡 | 受影响文件表补 `docs/core/design/DOC-DISCIPLINE.md`，16 档改 17 档 | §2.13.3 |
| 10 🔵 | 量法互不可比一句标在 E1 / E3 旁 | §2.13.4 |

#### 2.13.2 本修正轮实算基线（口径 = §2.3 + 修正轮补的两条边界）

**两处与上一轮读数不同，都因他批同期改动，不是本批判法变化**：

- **offload 支 = 0 处 / 0 档**（§2.12.1 记的 2 行 / 3 处已在盘上被改完）：现盘 `docs/core/design/TOOL-OUTPUT-LIMITS.md` 的常量表首行与「两族按同一常量…二分」句**都已只剩符号名 + 档路径**。⇒ 实施轮在该档**零处要改**，评审第 3 条的 A→B 改法**已被现盘满足**。
- **helpers 支 = 69 处 / 18 档**（上轮 67）：`docs/core/design/PROMPT-SYSTEM.md` 由 18 处增至 **21 处**（他批新增 3 处），其余各档逐档与上轮相同。

| 桶 | 处 | 档 | 处置 |
|---|---|---|---|
| helpers 支 · 设计档（15 档，含 `docs/server/design/agent/ADMIN-AGENT.md`） | 60 | 15 | 实施轮清 |
| helpers 支 · 需求档 | 4 | 2 | 父侧落笔 |
| 例外桶 `docs/core/design/DOC-DISCIPLINE.md`（口径块示例 4 + 代码面读数行 1） | 5 | 1 | 不动，读数另报 |
| **合计** | **69** | **18** | |
| offload 支 | **0** | **0** | 他批已清，本批零触 |

**三桶（A 删 ∥ B 补 ∥ C 引文内不动）的口径**：A/B 是**逐处的处置形态**，不是可预先算定的数——同一档里哪一处删得通、哪一处必须补名字，判据句只有一个（删后读得通 ⇒ 删）。故本节只给**档级处数**（上面表），A/B 归属由实施轮逐处当场判、逐处登记在 §5。

**评审要求本席认定的两件事，认定如下**：① `docs/core/requirements/TURN-CAP-CONTINUE.md` 那一处 = **B**（补 `DEFAULT_MAX_TURNS` / `DEFAULT_SUBAGENT_TURNS`），按 §2.12.3 记；②「新增三处按 A 计」这个前提**不成立也不必立**——实施轮按判据句逐处判，不预分桶。**验收不依赖 A/B 的比**：判据是改后复扫归零。

**`docs/core/design/PROMPT-SYSTEM.md` 块头行数**：§2.5 记「18 处 / 7 行」而表内实列 8 行——以表为准 = **8 行**；现盘 21 处，实施轮按现盘逐处扫，不按本表的老处数。

**先例行**：先例 = `#1973` 的 A9 改指（对象 = 原 19 处 `offload.mjs` 坐标）；**对齐** = 同一判据「行号不作引用」；**偏离** = 改指只换目标不改形态，偏离理由 = 改指当场让读数归位、成本照付（下一次对象搬动还得再指一次）。

**公共源勘察**：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]` ⇒ 已查，无相关公共源可引。

#### 2.13.3 受影响文件（改 §2.8）

**写域 = 17 档**：§2.8 那 16 档 ＋ `docs/core/design/DOC-DISCIPLINE.md`（本修正轮落 3 条规则行：改指不等于换形收窄 · 归属键补包说明符形 · 引文内坐标照引）。

**实施轮实改 = 15 档**（60 处）：`docs/core/design/DOC-DISCIPLINE.md` 与 `docs/core/design/TOOL-OUTPUT-LIMITS.md` **都在实施轮之外**——前者只有例外桶的 5 处读数，后者已 0 处；且后者他批正在改，实施轮**零触**。

**需求档 = 2 档 / 4 处**（父侧笔，不进实施轮读写域）：`docs/core/requirements/AGENT-PARAMS.md`（2 处，A）· `docs/core/requirements/TURN-CAP-CONTINUE.md`（1 处 A + 1 处 B）。

**档数表说明**：2.12.2 的「档数不变 = 18」= 15 设计档（实施轮）+ 2 需求档（父侧）+ 1 例外桶（不动）＝ 18；本批写域 17 档 = 15 + 2，例外桶那 1 档只在其内落规则行，不计入清账写域。

**跨层判定（照旧）**：零代码面、零测试面、零数据面；无档跨层，无拆分计划。

#### 2.13.4 复现命令（含围栏读数）与验收同步

复现命令 = §2.12.2 那段，**围栏分支改计数并末尾打印**（本修正轮实跑，cwd = 仓根）：围栏内 `open !== null` 时累计 `fh` / `fo`，收尾打 `围栏内 helpers / offload`。**实测读数：围栏内 helpers = 0 · offload = 0**（此数由命令产出，不是「没看」）。

**验收判据同步**：E1 / E3 的期望读数改为本修正轮基线——**helpers 支 设计档面 60 → 0** ∧ **offload 支 0 → 0** ∧ 例外桶 5 处照留；需求档 4 处随父侧落笔另核。**标注**：本读数为**清账面口径（同行内最近的前一个路径 token 归属）**，与 `docs/core/design/DOC-DISCIPLINE.md` §3.23 的行号坐标清单（归属窗含段落承名）**不可互比**——两数之差不是漏项。

**边界（照旧）**：不改句子的主张 · 不猜号不倒填 · `docs/batches/**` 零改 · 不做偏移重算 · `docs/core/design/TOOL-OUTPUT-LIMITS.md` 实施轮零触（他批正在改）。

### 2.14 修正轮：§3 轮次 2 四条 + 实施面逐处登记（2026-11-02）

#### 2.14.1 三个读数（复扫实测，命令见本节末）

| 读数 | 处 | 档 | 读法 |
|---|---|---|---|
| 设计档面 helpers 支 · 本支复扫 | **1** | 1 | `docs/core/design/AGENT-LOOP.md` 的 C 桶引文（被引档自述句里的 `:275-348`），按 §2.6 不动 |
| 例外桶 `docs/core/design/DOC-DISCIPLINE.md` | **5** | 1 | 4 = 口径块示例（提到 ≠ 引用）· 1 = 代码面读数行（§2.6 不改桶）——**未动** |
| 本批设计档面改前基线 | **60** | 15 | §2.13.2 基线；实施面逐处处置见 2.14.3 |

同一次扫描的其余读数：offload 支 = **0 处**；围栏内 helpers **0** · offload **0**；域 = `git ls-files "*.md"` 扣 §2.3 所列后 **307 档**。

围栏内那 0 由命令内的计数器产出（`fence=` 一行），不是"没看"：§2.3 的口径要求围栏读数另报一个数，此数即该数。

#### 2.14.2 归属伪影 3 处 ⇒ 真实 helpers 坐标 57 处

清账面的归属键是「同行内最近的前一个路径 token」。它在两种排布上会误归：别的档的坐标排在本行 `agent/helpers.mjs:399` 之后、档内自指的 `§N :NN` 排在本行档名之后。本批逐处核出 3 处：

- `docs/core/design/PROMPT-SYSTEM.md`（改前第 736 行）第一格 —— `:281` 与 `:57-60` 是 `thincoder-core/agent/setup.mjs` 的坐标，被同一行的 `agent/helpers.mjs:399` 认领。**2 处**。
- `docs/core/design/PROMPT-SYSTEM.md`（改前第 894 行）—— 「§6.6 `:186`」是**本档自指**（节号 + 本档行号），被上文「注释面（`helpers.mjs` JSDoc）」的档名认领。**1 处**。

**⇒ 真实 helpers 坐标 = 60 − 3 = 57 处。** 这三个数（60 / 3 / 57）是同一批逐处核出来的，不是三种算法。

#### 2.14.3 逐档逐处登记（A 删 ∥ B 换符号名 ∥ C 引文内不动）

行号 = **改前**行号（改后不承载定位含义）。本支实改 = **22 处 / 2 档**，其中 19 处为真实 helpers 坐标、3 处为 2.14.2 的伪影。

| 档 · 改前行 | 处 | 落法 | 逐处理由 |
|---|---|---|---|
| `docs/core/design/PROMPT-SYSTEM.md` 736 | 3 | A | 句内已有 `loadProjectInstructions` ⇒ `agent/helpers.mjs:399` 删号留档路径；同格两枚 setup 伪影随同句删号（该格已有符号名，删后读得通） |
| `docs/core/design/PROMPT-SYSTEM.md` 894 | 1 | A | 「§6.6 `:186`」删号留节名——节名即定位物，号是重述 |
| `docs/core/design/PROMPT-SYSTEM.md` 900 | 4 | A | 四个常量名已在句（`AUTO_TURN_DIGEST_DOMAIN_ENG` / `UPSTREAM_TURN_DOMAIN` / `TIMER_TURN_DOMAIN` / `DIGEST_ACCOUNT_DOMAIN`），坐标是同一对象的重述 |
| `docs/core/design/PROMPT-SYSTEM.md` 908 | 1 | B | 表格首格只有裸坐标，无符号名 ⇒ 换成 `AUTO_TURN_DIGEST_DOMAIN_ENG` |
| `docs/core/design/PROMPT-SYSTEM.md` 909 | 1 | B | 同上 ⇒ `UPSTREAM_TURN_DOMAIN` |
| `docs/core/design/PROMPT-SYSTEM.md` 910 | 2 | B | 同上 ⇒ `TIMER_TURN_DOMAIN` |
| `docs/core/design/PROMPT-SYSTEM.md` 911 | 6 | B | 首格换 `DIGEST_ACCOUNT_DOMAIN`；续接的 4 号随首格去；「与 `:469`–`:470` 同形」→「与 `TIMER_TURN_DOMAIN` 同形」 |
| `docs/core/design/PROMPT-SYSTEM.md` 939 | 1 | A | grep 用例里「`:478` 现文小写」⇒ 换 `DIGEST_ACCOUNT_DOMAIN`（句子靠常量名读通） |
| `docs/core/design/PROMPT-SYSTEM.md` 940 | 2 | A | 「覆盖 `:469` / `:477`」⇒ 换 `TIMER_TURN_DOMAIN` / `DIGEST_ACCOUNT_DOMAIN` |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` 573 | 1 | B | 表内「活体守卫行」一格只有裸坐标 ⇒ 补 `injectEngineeringReminder` |

**57 处的去向账（三个数相加即 57）**：本支真实 helpers 坐标 **19** ∥ C 桶不动 **1**（`docs/core/design/AGENT-LOOP.md`）∥ 他批同期已换形 **37**（现盘复扫为 0，本支零触、不重做）。

判 A 还是判 B 只由一条判据句定：删掉坐标后句子还读得通 ⇒ A；读不通 ⇒ B。逐处判、逐处记在上面，不预分。

#### 2.14.4 号漂实证：`injectEngineeringReminder`

`docs/core/design/AGENT-LOOP-SUBAGENT.md` 的活体守卫行原记 `thincoder-core/agent/helpers.mjs:372`。

实测（`grep -n "injectEngineeringReminder" thincoder-core/agent/helpers.mjs`，现盘）= 第 **400** 行 `export function injectEngineeringReminder(agent) {` —— **漂了 28 行，符号本身一处没搬。**

这就是本批判据的实证：行号指向位置，位置会动；符号指向对象，对象不动。若当时按「偏移重算」写 400，下一次搬动再付一次。

#### 2.14.5 边界（读数，不是嘱咐）

- **零新增行号**：本支两种落法（删号 ∥ 换符号名）都不产生新 `:NN`，全批 diff 内本支无新增号。
- **语义悬空桶 = 0 处**：逐处核过，改前每枚坐标所指的符号仍在 `thincoder-core/agent/helpers.mjs`，无一处需要写「旧句已不在盘」。
- **非 helpers 坐标零触**：本支只动 helpers 坐标所在的句子；2.14.2 那 3 处伪影随同句改写一并删号，不计入本支读数（它们指的是 `thincoder-core/agent/setup.mjs` 与本档节号，不是本支对象）。
- **`docs/batches/**` 零改**：本批只写本记录的 §2。

#### 2.14.6 验收法收正：`git diff` 复核 → 「逐处登记 + 复扫读数」

§2.9 的 E5 原写「逐档 `git diff` 只含坐标形改动」。此刻**不可复核**：同 15 档里有他批未提交改动（`docs/core/design/PROMPT-SYSTEM.md` 一处 788 行 · `docs/core/design/AGENT-LOOP-SUBAGENT.md` 30 行），而本支实改是 9 行与 1 行——逐档 diff 分不出哪几行是本支的。

**本轮替代 = 2.14.3 的逐处登记 + 2.14.1 的复扫读数**；他批提交后再按 E5 复核一次。这不是放宽判据，是把此刻不可判的检查换成可判的读数。

#### 2.14.7 §3 轮次 2 的四条处置

| # | 处置 |
|---|---|
| N1 | 基线口径统一：**清账面 64 = 60（设计档面）+ 4（需求档）**；含例外桶 **69 = 64 + 5**。与上轮 67 的差 = **−3**（他批同期换形，offload 支 3 → 0）／**+5**（例外桶新纳入）。§2.13.2 那句「（上轮 67）」按此读，不再按 69 − 67 解释差额 |
| #2 剩余 | §2.4 的「A 62 ∥ B 17 ∥ C 1」与 §2.7 的「41 处 / 39 处」按旧总 80 计，**不是本批读数**，实施与复核都不按它们推进；本批读数 = 2.14.1，A/B 归属 = 2.14.3 逐处判 |
| N2 | 「实施轮在该档零处要改」的射程限定：**本支（helpers 支 / offload 支）零处要改；该档引他档的行号坐标不在本批射程**（`docs/core/design/TOOL-OUTPUT-LIMITS.md` 仍持 `dispatch-run.mjs` 等他人坐标，读成「该档已清」会漏排） |
| #6 | 围栏读数由本节末命令产出（`fence=0/0`），不再只靠散文 |

#### 2.14.8 复现命令（cwd = 仓根；产出的即为 2.14.1 的三个读数与围栏读数）

```js
const { execSync } = require('node:child_process'), fs = require('node:fs');
const EXCL = [/^docs\/batches\//, /(^|\/)_archive\//, /^thincoder-cli\/docs\//, /^thincoder-vscode\/docs\//,
  /(^|\/)TODO\.md$/, /(^|\/)TODO-archive\.md$/, /^thincoder-desktop\/dist[^/]*\//];
const files = execSync('git ls-files "*.md"', { maxBuffer: 1 << 28 }).toString().split(/\r?\n/)
  .filter(f => f && !EXCL.some(r => r.test(f)));
const HELP = t => /(^|\/)helpers\.mjs$/.test(t) && !/run-helpers|config-helpers|mcp\/helpers/.test(t);
const OFF = t => /(^|\/)offload\.mjs$/.test(t);
const PATH = /@?(?:[A-Za-z0-9_.\-]+\/)*[A-Za-z0-9_.\-]+\.(?:mjs|md)/g, COORD = /:(\d+)(?:-(\d+))?/g;
const FENCE = /^(\s*)(`{3,}|~{3,})/;
let th = 0, to = 0, tf = 0, tfo = 0;
for (const f of files) { let open = null, h = 0, o = 0, fh = 0, fo = 0;
  for (const ln of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const fm = FENCE.exec(ln);
    if (fm) { const ch = fm[2][0], len = fm[2].length;
      if (!open) open = { ch, len }; else if (ch === open.ch && len >= open.len) open = null; continue; }
    const toks = [...ln.matchAll(PATH)].map(m => ({ t: m[0].replace(/^@/, ''), at: m.index + m[0].length }));
    for (const m of ln.matchAll(COORD)) {
      const prev = toks.filter(t => t.at <= m.index).pop(); if (!prev) continue;
      if (!HELP(prev.t) && !OFF(prev.t)) continue;
      if (open) { if (HELP(prev.t)) fh++; else fo++; } else if (HELP(prev.t)) h++; else o++; } }
  if (h || o || fh || fo) console.log(f + '\thelpers=' + h + '\toffload=' + o + '\tfence=' + fh + '/' + fo);
  th += h; to += o; tf += fh; tfo += fo; }
console.log('TOTAL helpers=' + th + ' offload=' + to + ' fence=' + tf + '/' + tfo + ' files=' + files.length);
```

**实跑读数（2026-11-02）**：`docs/core/design/AGENT-LOOP.md helpers=1` · `docs/core/design/DOC-DISCIPLINE.md helpers=5` · `TOTAL helpers=6 offload=0 fence=0/0 files=307`。

#### 2.14.9 射程外项与上抛

- **[知会] `docs/server/design/agent/ADMIN-AGENT.md` 本批不修**：该档 55 条存活指针已悬空、另有 9 段超宽段落 ⇒ 修它等于一次指针重指 + 段落重写，与本批「正文逐字相同」直接相抵。已另立台账 `#1981`。本批对该档**零触**。

- **[知会] 需求档 4 处（`docs/core/requirements/AGENT-PARAMS.md` 2 处 · `docs/core/requirements/TURN-CAP-CONTINUE.md` 2 处）**：写权在主 agent（D1），形态见 §2.12.3，本席与实施轮零触；收口时按作者核。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

**五问核（结论先行，引文见下表）**

- ① **67 / 18 成立**。按 §2.5 逐档相加 = 设计档面 76 处（含 `docs/core/design/TOOL-OUTPUT-LIMITS.md` 整档 19 处）＋需求档 4 处 = 80 ⇒「80 + 19」把同一批 19 处计了两次；现态 60 + 3 + 4 = 67、15 + 1 + 2 = 18，与本席独立复算一致。这个更正对。

- ② **按现态重算对**。实读该档：带行号的 `offload.mjs` 坐标只剩「两族按同一常量 `TOOL_RESULT_OFFLOAD_LIMIT`（`thincoder-core/agent/offload.mjs:8`）二分」与常量表首格「落盘阈值 + preview 四常量」的 `:8`–`:11` ⇒ **2 行 / 3 处**成立，其余各行已只剩符号名 + 档路径。

- ②后半：**「找不到 19 处不是漏项」不会变成漏项理由** —— E1 / E3 是复扫读数（offload 支 0 ∧ helpers 设计档面 0），真漏只会以非 0 读数出现，不靠嘱咐。

- ③ **三桶没对上现态**（第 2 行）。抽检：`offload.mjs:8` 那一句删后读得通（常量名已在句内）✓；常量表首格那一行首格无符号名、只靠 §2 代码块撑着，是「只有坐标指物」的边角（第 3 行）。

- ④ **该立**（既有纪律只给禁令，A9 是改指的实证），但「换形只有两条」与同节「四类对象 → 五种落法」两处闭枚举互斥（第 1 行 🔴）。与 C 桶不直接冲突，但 C 桶在规则面无条（第 5 行）。

- ⑤ **漏是真的**：两处抽取式的左界排除集都含 `@`（§3.21 Ⅰ 形 ∥ A-DD33 的 `PATH_RE`）⇒ `@` 起首的 token 整条抽不出，同行裸 `:NN` 无主。补法在批档脚本里成立，但只落批档（第 4 行）。

- **需求档 4 处形态可落**：A 三处（删号留档路径）∥ B 一处（补 `DEFAULT_MAX_TURNS` / `DEFAULT_SUBAGENT_TURNS`，并申明 40 那一档不在坐标内）✓。

- **`docs/core/design/PROMPT-SYSTEM.md` 按现数处理对**（已点名不在其读内，验收是读数归零）；但该块「18 处 / 7 行」与表内 8 行自相矛盾（并见第 2 行）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 新增判据行「**换形只有两条：符号名 ∥ 节名 + 逐字引文**」与同节「**换形怎么落（四类对象 → 五种落法，不新造第六种）**」两处闭枚举互斥——后者含「报一个量 ⇒ **量法 + 量取日期**」与「指数据档 / 配置档里的一个键 ⇒ **键名路径 + 所在节**」。同一机制（坐标换形）在同一节被写成两个基数，且新行带「只有」⇒ 指向数据档键的那类坐标（该档别处实例：`PROJECT-MANIFEST.json` 的 `index.publicRepos` 那一项）在规则里无处可落。 | 把新行收窄为「**行号引用指向代码件 / 规则面**时换形只有两条（符号名 ∥ 节名 + 逐字引文）」，句内回指「换形怎么落」的五种落法承担其余对象类；或只删「只有两条」四字、改成「换形的两条主路 = …（全枚举 = 同节『换形怎么落』）」。 |
| 2 | Clarity（计数·枚举 D3） | 🟡 | 三桶与分桶仍按旧总 80 计：§2.4「A 删（62 处）· B 补（17 处）· C 引文内不动（1 处）」= 80，§2.7「一句话一处 = 41 处 / 16 档」＋「一张表 N 处 = 39 处」= 80；而 2.12.2 把交付面改成 67 / 18。逐处复核 = **A 61 / B 18 / C 1**：`docs/core/requirements/TURN-CAP-CONTINUE.md` 那一处「默认 200 / 100 / 40——单源」（2.12.3 记 **B**）被合计算进了 A，故 62 多一、17 少一。另 §2.5 的 PROMPT-SYSTEM 块头写「18 处 / 7 行」，表内实列 8 行。 | 在 2.12 补一张 **67 基线**的三桶表（本席按同一逐处表复算 = A 48 / B 18 / C 1，前提 = 新增三处按 A 计，须设计席认定）并把 §2.7 的 41 / 39 重算；需求档那一枚归属按 2.12.3 统一；PROMPT-SYSTEM 块头行数改 8。 |
| 3 | Clarity（③ 抽检） | 🟡 | 常量表首格「落盘阈值 + preview 四常量」那一行记 **A**（「删 `:8`–`:11`，留 `thincoder-core/agent/offload.mjs`」），但首格只有对象的中文义、无符号名，删后要翻 §2 代码块才见四个常量名；同表其余各行（`TMP_RETENTION_MS` / `safeSliceUTF16` / `buildDualEndPreview` / `offloadToolResult` / `cleanupOldToolResults`）都自带符号名 ⇒ 删完它是表内唯一无名字锚的行。 | 改 **B**：档路径后补四常量名（`TOOL_RESULT_OFFLOAD_LIMIT` / `TOOL_RESULT_PREVIEW` / `TOOL_RESULT_PREVIEW_HEAD` / `TOOL_RESULT_PREVIEW_TAIL`），至少补 `TOOL_RESULT_OFFLOAD_LIMIT` + 「preview 三常量」。 |
| 4 | Requirements（口径耐久） | 🟡 | ⑤ 的补法（包说明符形入归属键）只写在 2.12.2 的批档里，而 §2.10 决策 2 自陈「口径属长期面，批档整份可删」；`docs/core/design/DOC-DISCIPLINE.md` 的归属键行仍是「全路径形 … ∥ 段前缀形 … ∥ 裸形 … 三者归一」，未含 `@` 形。两处机检抽取式的左界排除集同样含 `@`（§3.21 Ⅰ 形 `(?<![\w.\-\\/@<>])` ∥ A-DD33 的 `PATH_RE` `(?<![A-Za-z0-9_.\-\\\\/@])`）⇒ 下一轮照规则面重出清单仍会整类漏记同一批坐标。 | 把「`@thincoder/core/agent/…` 包说明符形同归一」写进该归属键行（该档已在 2.12 写域内），句内点明「左界排除集含 `@`」即漏因；不落这一步，本批等于把「裸形态整类逃出射程」原样留到下一轮。 |
| 5 | Document ownership（C 桶立足） | 🟡 | C 桶在规则面无条：D4 细则是「**行号一律不作引用形态（强制 · 无例外）**」，C 桶却让一处行号引用原样留在规范面，理据只在批档（§2.6 / §2.10 决策 4）。既有「**提到 ≠ 引用**」条说的是元陈述里「行号」「坐标」这些词照写，且紧接着写「**元陈述里也不写具体坐标**」——不能直接当 C 的豁免条。 | 二选一落进 `docs/core/design/DOC-DISCIPLINE.md`：① 在「提到 ≠ 引用」后补一句「**引文内坐标照引**——被引对象自己的字面，改它即改引文；处置 = 引文字面不动 + 引文外补符号名」；或 ② 在 §2.6 明写 C 桶按该条的子类归档并点节名。 |
| 6 | Acceptance（可复现） | 🟡 | §2.3 报「围栏内不计入清账面，**读数另报**：本批实测 **0 处**（口径跑出，非"没看"）」，但 2.12.2 给的复现命令把围栏行整块 `continue` 掉、不计数 ⇒ 这个 0 不由此命令产出；清账口径本身写「围栏内读数**另报一个数**——静默排除与"那儿没有"读起来一样」。 | 复现命令补一个围栏内计数器（同一坐标抽取式，在 `open !== null` 分支累计、末尾打印），或删掉「实测 0 处」改记「本批不报围栏读数」。 |
| 7 | Methodology（先例） | 🟡 | 设计（§2）无「最近先例（对齐 ∥ 偏离）」行。2.12.4 在散文里点了 A9 并给了偏离理由，但不是「先例坐标 + 对齐 ∥ 偏离」的登记形，而本批正是对 A9 那一形的偏离。 | 补一行：先例坐标 = `#1973` 的 A9 改指（对象 = 本档那 19 处 `offload.mjs` 坐标）；对齐 = 同一判据「行号不作引用」；偏离 = 改指只换目标不改形态，偏离理由 = 改指当场让读数归位、成本照付。 |
| 8 | Methodology（公共源） | 🟡 | 设计（§2）无「公共源勘察证据行」。本批判据全落本仓规则面与现盘读数，仍属于「无相关公共源也必须记一行」的那一类。 | 补一行：「公共源勘察：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]` ⇒ 已查，无相关公共源可引」（与 §3.23 同条同形）。 |
| 9 | Affected files | 🟡 | §2.8「**设计档面 = 16 档**（实施轮写域）」不含 `docs/core/design/DOC-DISCIPLINE.md`，而 2.12 的写域第一句就是「本文 §2 ∥ `docs/core/design/DOC-DISCIPLINE.md`（A9 教训一条）」——该档新增判据行已在盘，写域实为 17 档；2.12.2 的「档数不变 = 18（16 设计档 + 2 需求档）」同样漏它。 | §2.8 表补 `docs/core/design/DOC-DISCIPLINE.md` 一行（动作 = 新增判据行），「16 档」改 17 档；2.12.2 的档数表说明例外桶那一档是否计入写域。 |
| 10 | Clarity（量法互不可比） | 🔵 | 清账面归属 = 「每号的归属 = 同行内**最近的前一个路径 token**」（本批照此），而 §3.23 条目的归属窗是紧贴 / 承名 / **段落承名**（取上一行最后一个档名）⇒ 同一份盘两面读数不同；跨行承名的坐标在清账面整类不计。 | 在 E1 / E3 的读数旁标一句「本读数为清账面口径（同行归属），与 §3.23 清点面不可互比」，免得下一轮把两数之差当漏项。 |

**计数**：🔴 1 · 🟡 8 · 🔵 1（共 10 条）

VERDICT: changes-required

### 轮次 2（评审子代理）

### 轮次 2 复核（评审子代理）

**本轮只核上轮 10 条 + 一处态变更，不重开判据。**

| # | 上轮条目 | 本轮状态 | 证据（本轮实读逐字） |
|---|---|---|---|
| 1 | 🔴 换形两条 ∥ 五落法互斥 | **Fixed** | 规则面新句 =「**行号引用指向代码件 / 规则面**时，换形只有两条：**符号名** ∥ **节名 + 逐字引文**；其余对象类（报一个量 · 数据档键 · 同档自指）的换形 = 下方「换形怎么落」的五种落法，本行不另立枚举。」⇒ 2 + 3 = 5，与「**换形怎么落（四类对象 → 五种落法，不新造第六种）**」不再互斥。 |
| 2 | 🟡 计数 · 三桶与分桶 | **Unfixed（部分）** | 已落：需求档那一处认定 = 「**B**」；块头改「以表为准 = **8 行**」。未落：§2.7「**一句话一处 = 41 处 / 16 档**」＋「**一张表 N 处 = 39 处**」仍按旧总 80 计、无作废指针（同一逐处表重算 = 64 = 60 + 4）。拒绝预分 A/B 这一段**站得住**（理由见下）。 |
| 3 | 🟡 常量表首格 A→B | **Fixed（他批已落盘）** | 「落盘阈值 + preview 四常量 \| `thincoder-core/agent/offload.mjs`（`TOOL_RESULT_OFFLOAD_LIMIT` · `TOOL_RESULT_PREVIEW` · `TOOL_RESULT_PREVIEW_HEAD` · `TOOL_RESULT_PREVIEW_TAIL`） \| 在位」——四常量名齐、无行号。 |
| 4 | 🟡 包说明符形耐久 | **Fixed** | 归属键行：「全路径形 … ∥ 段前缀形 … ∥ 裸形 … ∥ **包说明符形** `@thincoder/core/agent/helpers.mjs` 四者归一」，紧随理由行「机检抽取式的左界排除集含 `@`…整类漏记」。 |
| 5 | 🟡 C 桶规则面立足 | **Fixed** | 新增「**引文内坐标照引**：…处置 = 引文字面逐字不动 + 在引文之外补定位物」，并补「**与「元陈述里也不写具体坐标」不冲突**：那一条管我们自己报量，这一条管别人原话」。 |
| 6 | 🟡 围栏读数可复现 | **Unfixed** | 复现命令块内仍为「if (open !== null) continue;」——围栏行照跳、不计数；§2.13.4 只有散文「**围栏分支改计数并末尾打印**」＋读数「围栏内 helpers = 0 · offload = 0」，改后码块未给 ⇒ 该 0 不由记录内可跑件产出。 |
| 7 | 🟡 先例行 | **Fixed** | 「**先例行**：先例 = `#1973` 的 A9 改指…**对齐** = 同一判据「行号不作引用」；**偏离** = 改指只换目标不改形态」。 |
| 8 | 🟡 公共源勘察行 | **Fixed** | 「**公共源勘察**：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]` ⇒ 已查，无相关公共源可引。」 |
| 9 | 🟡 受影响文件 / 档数 | **Fixed（追赶句取代表内数）** | 「**写域 = 17 档**：§2.8 那 16 档 ＋ `docs/core/design/DOC-DISCIPLINE.md`」＋「**档数表说明**：… = 15 设计档（实施轮）+ 2 需求档（父侧）+ 1 例外桶（不动）＝ 18」。 |
| 10 | 🔵 量法互不可比 | **Fixed** | 「**标注**：本读数为**清账面口径（同行内最近的前一个路径 token 归属）**，与 `docs/core/design/DOC-DISCIPLINE.md` §3.23 的行号坐标清单（归属窗含段落承名）**不可互比**」。 |

| # | 类 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| N1 | 计数 · 枚举（D3） | 🟡 | 「helpers 支 = 69 处 / 18 档（上轮 67）」与差额叙述不自洽：69 = 60 + 4 + 5（含例外桶），上轮 67 = 60 + 3 + 4（含 offload 支、不含例外桶）；真实差 = −3 ＋ 5，而表下把差额归给「`docs/core/design/PROMPT-SYSTEM.md` 由 18 处增至 **21 处**（他批新增 3 处）」——那 +3 已在 §2.12.2 的 60 之内（§2.5 逐档相加 = 57 处 @ PROMPT 18）。 | 把「（上轮 67）」换成同构成口径（清账面 64 = 60 + 4 ∥ 含例外桶 69 = 64 + 5），差额写成 −3 / +5；§2.4 的「A 删（62 处）· B 补（17 处）」与 §2.7 的 41 / 39 各加作废指针。 |
| N2 | Clarity（射程） | 🔵 | 「⇒ 实施轮在该档**零处要改**」只对本支成立：该档仍持大量行号坐标（例「`thincoder-core/agent/dispatch-run.mjs:148`——非 multimodal 结果统一过落盘守卫」·「上限常量 `MAX_RESULT_CHARS = 64 * 1024`（`thincoder-core/advisor/compaction.mjs:38`，与主链路对齐）」），读成「该档已清」会让下一支漏排。 | 该句补射程括注「（本支；该档引他档的行号坐标不在本批射程）」。 |

**两个等式都站**：69 = 60 + 4 + 5；18 = 15 + 2 + 1。逐档独立复算 = 57 处 / 15 档（PROMPT 按 18），加他批 3 处 = 60；需求档 4 / 2；例外桶 5 / 1 = 续接形示例 4 号 ＋ 代码面读数行 1 号。

**态变更处置对**：实读该档，引 helpers / offload 的带号坐标 = 0；「他批已清，本批零触」如实记账、不虚增本批交付；判 0 靠复扫读数，不靠嘱咐。

**A/B 不预分站得住**：判据句一条且确定（删后读得通 ⇒ 删），验收是复扫归零、不依赖 A/B 之比，逐处处置登记 §5 —— 不构成把结构决定压给实施人。

**引文条不开口子**：成立条件两项（被引对象自己的自述句 ＋ 引文外必须补定位物）⇒ 那枚号永不充当定位手段，与「禁的是拿位置当定位手段」同拍。

**补法耐久一半**：归属键行已点名包说明符形并写了漏因；围栏读数仍无可跑件（见第 6 条）。

**判面限三档**：其余 14 档的 60 处读数不在本轮实读面 —— 未核，以设计席读数为准。

**本批仍有独立交付价值**：他批只吃掉了 16 档里的一档，DOC-DISCIPLINE 三条规则行 ＋ 4 处需求档 ＋ 其余 14 档本支坐标仍在本批 ⇒ 不建议改判「已由他批完成、本批收口记数」。

**计数**：上轮 10 条 = Fixed 8 · Unfixed 2（均为 🟡）；新增 🟡 1 · 🔵 1；🔴 0。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**批准对象**：`thincoder-core/agent/helpers.mjs` 那一支的「号漂」行号坐标按判据换形（15 档 / 60 处），以及三条规则行（`docs/core/design/DOC-DISCIPLINE.md`：「改指不等于换形」收窄 ∥ 归属键补包说明符形 ∥ 引文内坐标照引）。

**批准依据链（全部在盘可查）**：

| 环节 | 事实 |
|---|---|
| 设计评审 | 两轮；第 2 轮 `VERDICT: pass`（🔴 0 · 🟡 9 · 🔵 3，其中 🟡 Fixed 8 / Unfixed 2） |
| —— 轮次块 | 批档 §3 的两轮块，含核验表 + 计数 + VERDICT |
| —— 签字 | §3 状态行 = `评审通过`（工具随 pass 轮次自动置位） |
| 授权凭据 | 评审结算回执 `Approved. Pass this exact token to eng-coder` —— **凭据值按纪律不入档** |
| 用户批准 | 用户原话「**你拿1975-77这三项试试新代码呗**」（2026-11-02 01:32） |

**批准范围**：§2 所述 15 档 / 60 处的坐标换形 + 三条规则行。**两处不在批准范围且已如实登记**：① 引文桶 1 处有意不动（§6.3）；② `docs/server/design/agent/ADMIN-AGENT.md` 的 64 条老账未修（§6.6 · 台账 `#1981`）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

### 6.1 本批交付了什么

把「符号仍在 `thincoder-core/agent/helpers.mjs`、只是行号漂了」的那一支坐标按判据换形：**15 档 / 60 处**（真实 helpers 坐标 57 处 + 3 处归属伪影），并立起三条规则行（改指不等于换形收窄 · 归属键补包说明符形 · 引文内坐标照引）。需求档 4 处由父侧落笔。

### 6.2 读数（父侧本轮独立复扫，非转述）

| 项 | 口径 | 读数 |
|---|---|---|
| **offload 支** | `offload\.mjs:(\d+)` · `docs/**` 扣 `batches` / `_archive` | **0 处 / 0 档** |
| **helpers 支（域内）** | 四形归一 + 左界 `(?<![\w-])`（排 `run-helpers` / `config-helpers` / `mcp/helpers`） | **1 处** —— `docs/core/design/AGENT-LOOP.md` 引文桶（有意留，字面未动） |
| **例外桶** | `docs/core/design/DOC-DISCIPLINE.md` | **5 处未动**（续接形示例 4 号 + 代码面读数行 1 号） |
| 域外（不入读数） | — | `docs/TODO-archive.md` 2 处（按域排除）· `docs/server/design/mcp/MCP.md` 2 处（**那是 `mcp/helpers.mjs`，另一个档**） |
| 符号名仍在 helpers | 抽查 6 件 | `injectEngineeringReminder` ∥ `readonlyToolNames` ∥ `turnFrame` ∥ `DEFAULT_GOAL_TURNS` ∥ `DEFAULT_MAX_TURNS` ∥ `DEFAULT_SUBAGENT_TURNS` **全在** |
| 零新增行号 | 逐处登记 | 成立（唯一含坐标的落地行 = 引文桶，字面与改前逐字相同） |

**父侧自记**：我第一次扫面**没加左界**，把 `run-helpers.mjs` 与 `mcp/helpers.mjs` 的坐标算成 `helpers.mjs` 的，得 18 处 / 13 档 —— **12 处假阳性**。**这正是本批在 §2.4 写死的「同名异档不归一」，而我扫的时候没照它办。**

### 6.3 验收的如实对齐（一处不达成，原因在设计）

**E1/E3 的期望读数是「设计档面 60 → 0」，实际收在 1。**

那 1 处 = `docs/core/design/AGENT-LOOP.md` 的**引文桶**（被引 vsc 档自述句里的坐标），设计档决策写明「引文字面逐字不动」。**⇒ 0 从来不是本批可达到的数 —— 是验收句把「引文桶」算进了归零面。** **按实际记 1，不按字面记 0。**

### 6.4 三处归属伪影（如实留痕）

`docs/core/design/PROMPT-SYSTEM.md` 三处（两处指 `setup.mjs`、一处本档自指）被「同行最近前一个路径 token」误归给 helpers ⇒ **60 里含 3 处伪影，真实 helpers 坐标 = 57 处**，与评审第 2 轮的独立复算一致。

### 6.5 号漂实证

`injectEngineeringReminder` 在设计档原记 `:372`，**实测在 `thincoder-core/agent/helpers.mjs` 第 400 行 —— 漂 28 行，而它一直被当作定位物引用。** 本批把它换成符号名。

### 6.6 没做（如实）

- **`docs/server/design/agent/ADMIN-AGENT.md` 的 64 条老账未修**（55 悬空 `.md` 指针 + 9 段超宽）：它挡住过本批的批档写入一次，但修它属另一批 ⇒ 台账 `#1981`。
- **`git diff` 复核不可用**：他批在同 15 档内有未提交改动（`docs/core/design/PROMPT-SYSTEM.md` 一处 788 行），故以「逐处登记 + 复扫读数」替代，待他批提交后补复核。
- **需求档 4 处由父侧落**（已落，见 §1.1 之外的父侧笔迹）。

### 6.7 集成面

本批**零代码**，不新增、不改写任何集成用例（`test/RTM.md` 零改）。

### 6.8 收口结论

设计两轮过审、实施一轮（15 档 / 60 处）、父侧独立复扫与实施读数吻合、三处伪影与一处未归零如实留痕、两笔衍生债入账（`#1981` · 破门档）。**本批收口。**
