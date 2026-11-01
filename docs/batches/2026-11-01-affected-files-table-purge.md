# 2026-11-01 · affected-files-table-purge
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 18:14 逐字「设计档里不该有这些，这是批次档的职责，是你以前写错地方了，都要清掉，不要留」+ 18:15 逐字「大也得做啊！」。
> 台账 = #1953（DOC-DISCIPLINE · 归批）。前情 = #1902state-doc-history-purge（`docs/batches/2026-11-01-state-doc-history-purge.md`，进行中）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与结论（主 agent）

**覆盖账 = #1953** · **前情 = `docs/batches/2026-11-01-state-doc-history-purge.md`（进行中）**

### 1.1 用户裁定（逐字）

> 2026-11-01 18:14：「**设计档里不该有这些，这是批次档的职责，是你以前写错地方了，都要清掉，不要留。**」
> 18:15：「**大也得做啊！**」

### 1.2 判据单源（档里早就写着，只是存量没清完）

- `docs/core/design/DOC-DISCIPLINE.md` **A-DD15**：受影响文件表「**两列整列退场**」。
- 同档 **DD-30**：「三档的尺寸档位结论**仍在**（表级一句 + 越档者带拆分计划）；**表内无行数与增量数值**」。

**⇒ 规范已经定了「判档制」：留文件名与一句档位结论，行数与增量的数不落档。甲类 35 节是它没清完的存量。**

**为什么这对**：一张表答的是「这块地现在什么样」。而「本次要改哪些档、各涨几行」答的是「这一批怎么做」—— 那是批档 §2 的活。

**放错地方的代价**：状态档里长期躺着一份过期账（`984 → 1,145` 明早就是错的，且没人会回来改）。

### 1.3 父侧实测存量（逐节，非估计）

**甲 · 表头带 `现行 / 行数 / Δ / 预算`，要清 —— 35 节 / 25 档**

```
docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md:244        [248] 文件｜现行｜Δ｜预算｜改动点
docs/cli/design/READ-DATA-INTERFACE.md:150            [154] 文件｜模块｜现行｜Δ｜预算｜改动点
docs/core/design/AGENT-LOOP-ASYNC-POOL.md:310         [312] 文件｜当前行数｜预计增量｜落点
docs/core/design/AGENT-LOOP-ASYNC-POOL.md:631         [636] 文件｜现行行数｜实测增量｜说明
docs/core/design/AGENT-LOOP-ASYNC-POOL.md:1045        [1047] 文件｜现行行数｜预计增量｜说明
docs/core/design/AGENT-LOOP-ASYNC-POOL.md:1261        [1263] 文件｜现行行数｜预计增量｜说明
docs/core/design/AGENT-LOOP-SUBAGENT.md:206           [208] #｜文件｜当前行数｜预计增量｜说明
docs/core/design/AGENT-LOOP-SUBAGENT.md:322           [326] 文件｜现｜Δ（设计估算）｜说明
docs/core/design/AGENT-LOOP-SUBAGENT.md:477           [479] 文件｜现｜Δ｜说明
docs/core/design/AGENT-LOOP-SUBAGENT.md:969           [973] 文件｜现｜Δ｜改动
docs/core/design/AGENT-LOOP-UPSTREAM.md:203           [205] #｜文件｜当前行数｜Δ｜说明
docs/core/design/AGENT-LOOP-UPSTREAM.md:562           [564] #｜文件｜现量行数｜Δ（估）｜变更类型｜说明
docs/core/design/AGENT-LOOP-UPSTREAM.md:1065          [1069] #｜文件｜现量 → 预计终值｜Δ｜说明
docs/core/design/AGENT-LOOP-UPSTREAM.md:1208          [1210] #｜文件｜现量｜Δ（预计）｜面
docs/core/design/BASH-EXECUTOR-FACE.md:92            [94] #｜档｜现行数｜增量｜动作
docs/core/design/BROWSER-TOOL.md:377                  [381] 表头为数据行 —— 需人工定位
docs/core/design/CORE-UNIFICATION.md:507              [509] 类别｜档｜当前行数｜预计增量｜备注
docs/core/design/DOC-SYSTEM.md:302                    [306] #｜档｜当前行数｜预计增量｜动作
docs/core/design/MANIFEST.md:191                      [193] #｜文件｜当前行数｜变更｜编辑点｜增量
docs/core/design/MODEL-SPECS.md:1583                  [1588] 表头为数据行 —— 需人工定位
docs/core/design/PROMPT-FIXTURE.md:287                [289] 文件｜现状行数｜本批动作｜预计行数（增量）
docs/core/design/PROMPT-SYSTEM.md:948                 [950] 文件｜现行｜Δ（⇒ 实施后）｜档位与拆分结论
docs/core/design/SESSION-OBSERVABILITY.md:121         [123] 文件｜当前行数｜预期增量｜变更
docs/core/design/TEAM-LEDGER.md:82                    [84] 档｜行数｜职责
docs/core/design/TEAM.md:149                          [151] 域｜档｜行数
docs/core/design/TESTING.md:1098                      [1102] 文件｜现（行）｜Δ｜判据
docs/core/design/TESTING.md:1243                      [1251] 表头为数据行 —— 需人工定位
docs/core/design/TIMEOUT-DIGEST.md:165                [167] 文件｜当前行数｜本层 Δ｜改动
docs/core/design/TOOLS.md:1590                        [1592] 档｜现况｜Δ｜说明
docs/desktop/design/E2E-TESTING.md:133                [135] 档｜现行数｜预估增量｜说明
docs/desktop/design/PANEL-READBACK.md:96              [98] 文件｜现｜Δ 预算｜改动
docs/desktop/design/WEB-QUICKCHECK.md:117             [119] 档｜行数｜说明
docs/server/design/gateway/PUBLICNET.md:122           [124] 文件｜现况｜预期增量
docs/vsc/design/VSC-DEBT.md:104                       [106] 文件｜当前行数｜预计增量｜性质
docs/vsc/design/WEBVIEW-INPUT.md:189                  [193] 文件｜现行行数｜预计增量｜改动
```

**乙 · 已合规（判档制，数字不落档）—— 9 节 / 9 档，复核即可**

- `docs/core/design/ADVISOR-CONVERGENCE.md:356`（尺寸档位核查维度）
- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:472`
- `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:590`
- `docs/core/design/DOC-DISCIPLINE.md:2061`
- `docs/core/design/MODEL-SPECS.md:1728`
- `docs/core/design/TESTING.md:788`
- `docs/desktop/design/PROJECT.md:215`
- `docs/render-core/design/RENDER-CORE.md:413`
- `docs/vsc/design/VSC-DEBT.md:382`

**丙 · 纯指针（指向甲）—— 15 节 / 15 档，随甲改指**

- `docs/core/design/AGENT-LOOP.md:178`
- `docs/core/design/CHECKPOINT.md:62`
- `docs/core/design/CONFIG.md:70`
- `docs/core/design/CONSULTATION.md:87`
- `docs/core/design/CONTEXT-COMPACTION.md:35`
- `docs/core/design/I18N.md:40`
- `docs/core/design/LOGGING.md:39`
- `docs/core/design/MCP.md:45`
- `docs/core/design/MEMORY.md:71`
- `docs/core/design/PROMPT-SYSTEM.md:109`
- `docs/core/design/PROVIDER.md:55`
- `docs/core/design/SESSION.md:58`
- `docs/core/design/TOOLS.md:117`
- `docs/core/design/TRACES.md:38`
- `docs/core/design/WORKSPACE.md:61`

### 1.4 处置口径

**甲类每一张表，改成 A-DD15 / DD-30 的形**：

- **留**：文件名列 · 编辑点列（函数级坐标）· 表级一句尺寸档位结论（越档者带拆分计划）。
- **删**：`现行 / 当前行数 / 现 / 现量` 列，`Δ / 增量 / 预计增量 / 预算` 列。
- **连带**：表标题里「（行数 = …；判时按盘现读）」「（R24a · 行数口径 `wc -l`）」这类**口径注一并删**。
- **不许**：把数改成「判时现读」了事 —— 那还是让读者去取一个数，只是把取数时机挪了。**列要退场。**

**丙类**：指针指向甲的表。甲清完，指针文字随正；**指针本身不复制内容**，多半只需改一句指向描述。

**乙类**：复核一遍「确实无行数 / 增量数值」，有一处算我漏。

### 1.5 边界

- **只动 `docs/**` 的设计档**（`_archive` / `batches` / 需求档不动）。
- **判据强度、机制描述、代码坐标不动** —— 只退两列与口径注。
- **编辑点列与档位结论一句都不许顺手删。**
- **不加机检。**

### 1.6 分包

甲类 25 档超过单次派单上限 ⇒ **拆两轮**（第一轮 13 档、第二轮 12 档），丙类 15 档随后收尾。

### 1.7 口径收正（用户 18:17 追加裁定 · 取代 §1.4 的「退两列」）

> 用户逐字：「**对呀，丙不是一样不该存在？所以，甲乙丙都应该清除掉。**」
> 18:18：「**你另开一批干这事儿，现在就开始**」

**⇒ §1.4 的「退两列」作废。整节删，不是瘦身。**

**为什么我先前那版是错的**：把「受影响文件表」当成设计内容在保，只想摘掉数字。**它整节回答的都是「这一批怎么做」——数字摘掉之后，剩下的文件名与档位结论仍然是批次账。** 用户这一问把前提否掉了：**这一节的存在理由本身不成立。**

### 1.8 三类一律清（含混在乙里的规则 —— 逐节判过，不是整类删）

**甲 35 节 · 乙 7 节 · 丙 15 节 = 57 节，全部整节删。**

**乙类里有 2 节不是账，是规则，必须留**（我逐节读过，不是按类拍板）：

- `docs/core/design/ADVISOR-CONVERGENCE.md:356`「受影响文件尺寸档位核查（**设计评审维度**）」—— 说的是评审该查什么。
- `docs/core/design/DOC-DISCIPLINE.md:2061`「受影响文件（**本契约的实施轮面**）」—— 说的是这条纪律管哪些面。

**判据一句话**：**说「这批改了哪些档」的删；说「该查什么 / 管哪些面」的留。**

### 1.9 拆分计划先入账，再随表删

`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:472` 那类节里带「越档者逐档带拆分计划」。

**它是工程债，不是批次账。** 处置：设计席**逐条报上来**（档名 + 现状规模 + 拆分设想），**父侧先落台账**（`trigger=归批`），**再删节**。

**不许随表一起删掉** —— 那会把一条真债删成没人知道。

### 1.10 分包

三批派：**第一轮 13 档**（甲类 core/design）→ **第二轮**（甲类 cli / desktop / server / vsc + 乙类 3 账节）→ **第三轮**（丙类 15 档，与已删档去重）。

**编号不重排**（本仓惯例：删节留空号，重排会连带改一堆交叉引用）。要重排得用户另说。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
