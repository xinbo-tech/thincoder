# 2026-11-01 · affected-files-table-purge
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 18:14 逐字「设计档里不该有这些，这是批次档的职责，是你以前写错地方了，都要清掉，不要留」+ 18:15 逐字「大也得做啊！」。
> 台账 = #1953（DOC-DISCIPLINE · 归批）。前情 = #1902state-doc-history-purge（`docs/batches/2026-11-01-state-doc-history-purge.md`，进行中）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
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

### 1.11 口径再收正（用户 18:20 · 我 §1.8「拦下两节」是错的）

> 用户逐字：「**乙你拦下来的两节也不该出现，那他妈也是批档的内容写错了地方！你他妈的能不能别老给我留点毛病？！**」

**我错在哪**：§1.8 我把 `docs/core/design/ADVISOR-CONVERGENCE.md:356` 与 `docs/core/design/DOC-DISCIPLINE.md:2061` 判成「规则，留」。

**读原文就站不住**：

- `docs/core/design/ADVISOR-CONVERGENCE.md:362` 逐字：「设计文档「受影响文件」表——是否列出每个将修改的源 / 测试文件，并带一句表级尺寸档位结论……② 表内不出现行数 / 增量数值——出现即报」
  ⇒ **这条「规则」的全部作用 = 要求设计档里必须有一张受影响文件表。**
  **它不是规则，是那个制度的守卫。制度废了，守卫跟着废 —— 留下它等于给废制度留一块门牌。**
- `docs/core/design/DOC-DISCIPLINE.md:2068` 逐字：「受影响文件面（逐批面 · 按轮实列）：本节不持逐批清单……此处只给本面盘口」
  ⇒ **整节讲的是「这张表怎么摆」。表没有了，它没有对象。**

**规律（这次说穿）**：同一毛病第三次 —— **退两列 → 改指 → 留两节规则**。每次我都在找「能不能保住一点」，而不是问「它凭什么存在」。

### 1.12 口径终形（覆盖 §1.4 / §1.7 / §1.8）

**设计档里不设「受影响文件」表。** 它答的是「这一批改了哪些档」，**归批档 §2，一格都不留在状态档**。

**连带清规则面（比表本身更该清）** —— 这些规范句在要求 / 描述那张表，全在射程：

- `docs/core/design/ADVISOR-CONVERGENCE.md` §9（`:356`–`:363`）：删「受影响文件表」这条评审维度。
  **§9 里的尺寸档位判据数值（函数档 `≥300` · 文件档 `>500` 主动审视 · `>800` 必须拆）不是表的东西，是代码的东西** —— 迁到代码结构判据节，**不许跟着一起删**。
- `docs/core/design/DOC-DISCIPLINE.md`：§3.7 两列退场口径 · A-DD15 · DD-30 · §4.5.11 整节 · `:262` ∥ `:266` ∥ `:268` ∥ `:318` ∥ `:614` ∥ `:794` ∥ `:882` ∥ `:958` 等「表该怎么摆」的句 —— 改成一句：**设计档不设该表，表归批档 §2**。
- **判据强度照留**：`≤800` 硬限 · 拆分触发 · 单测档豁免 —— 这些是代码结构规矩，不是表规矩。

### 1.13 分包追加

**第四轮 = 规则面**（`docs/core/design/ADVISOR-CONVERGENCE.md` + `docs/core/design/DOC-DISCIPLINE.md`），在第三轮之后。

**这一轮比前三轮重**：它改的是规范句，不是删表。

### 1.14 底数更正（我 §1.3 报少了 —— 按内容扫，不按标题扫）

**§1.3 是错的**：它按**节标题**「受影响文件」扫，漏掉所有**不叫这个名字、内容却一样**的表。

**按内容重扫**（判据 = 表头同时含「行数类列」与「Δ / 增量 / 预算类列」，域 = `docs/**` 扣 `_archive` · `batches`）：

```
61 张表 / 21 档
```

**漏得最狠的一档**：`docs/core/design/PROMPT-SYSTEM.md` 有 **22 张**（`:782` `:1371` `:1452` `:1594` `:1773` `:1919` `:2064` `:2227` `:2423` `:2625` `:2811` `:2982` `:3356` `:3526` `:3656` `:3808` `:4054` `:4244` `:4541` `:4667` `:4791` `:4911` `:5019`），**它们都不叫「受影响文件」。**

**逐档张数**（其余各档）：

- `docs/core/design/DOC-DISCIPLINE.md` 4
- `docs/core/design/PROVIDER.md` 3
- `docs/core/design/LIGHT-CHANNEL.md` 3
- `docs/core/design/TOOLS.md` 3
- `docs/core/design/TESTING.md` 3
- `docs/core/design/LEDGER.md` 2
- `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` 2
- `docs/core/design/ADVISOR-GUARDS.md` 1
- `docs/core/design/MODEL-BENCH.md` 1
- `docs/core/design/AGENT-LOOP-UPSTREAM.md` 1
- `docs/core/design/MANIFEST.md` 1
- `docs/core/design/TIMEOUT-DIGEST.md` 1
- `docs/core/design/SESSION-OBSERVABILITY.md` 1
- `docs/desktop/design/E2E-TESTING.md` 1

**误报（不是这类表，别动）**：`docs/render-core/design/RENDER-CORE.md` 的 KD 行 · `docs/server/design/project/PROJECTS.md` 的 KD 行 —— 决策记录里提到数字，不是表。

### 1.15 判据（写死，后面各轮照它办）

**一张表是不是这类账，只看两问**：

1. 列里有没有「**这个档现在多少行**」？
2. 列里有没有「**本批改多少 / 改后多少**」？

**两问皆是 ⇒ 批次账，删。与它叫什么标题、挂在哪个节无关。**

**不满足两问的数字表留着** —— 例如各档职责分工表、判据阈值表。

**判据强度那一类数（`≥300` / `>500` / `>800` 拆档线）不是账，是规矩，全部留。**

### 1.16 需求侧也在射程

`docs/core/requirements/METHODOLOGY.md:84` 的 **F-R24a** 逐字要求「设计文档「受影响文件」表列出每个将改的源 / 测试文件并判定尺寸档位」—— **这条需求就是那个制度的立法源，一并改掉**：改成「该表归批档 §2，设计档不设」。

同档 `:85` 的 **F-R24b**（advisor 评审维度补「受影响文件档位核查」）同源，一并删。

### 1.17 判据再收正（设计席 `#29` 上抛第 1 / 2 条 —— 我 §1.15 写窄了）

**它按 §1.15 的「两问」判，于是列里不带「现行行数」的节它没删**：

- `docs/core/design/TOOLS.md` ∥ `docs/core/design/PROVIDER.md` 的「## 5. 受影响文件（该子系统）」两整节
- `docs/core/design/LEDGER.md` 4 节「受影响面」
- `docs/core/design/MANIFEST.md` 3 段
- `docs/core/design/TESTING.md` §11.8 ∥ §12.3 ∥ §13.3
- `docs/core/design/AGENT-LOOP-SUBAGENT.md` ∥ `docs/core/design/ADVISOR-GUARDS.md` ∥ `docs/core/design/PROMPT-SYSTEM.md` 各 1–4 段

**这是我的判据写窄了**：两问只抓「表」，抓不到「**节**」。而这些节的**主题本身**就是「这批改了哪些档」—— 列怎么写，它都是那笔账。

**判据改成一问**：

> **这一节 / 这张表的主题，是不是「这一批改了哪些档」？是 ⇒ 删，不管它长什么形状。**

**两类明确不算**：说「该查什么」（评审维度 / 口径）的 · 说「阈值是多少」（判据强度）的 —— **不是账，留**。

### 1.18 一条真丢失，必须补回

设计席报：`docs/core/design/TESTING.md` 删表时**连带删掉了 A-RC1–A-RC5 的判据列**（反向探针 ⇒ `exit 1` 那一组）。

**判据不是账，删表不该碰到它。** 处置 = **补回该节正文**（或迁到该档判据面），**不能就这么没了**。

### 1.19 断指要一并收

指向已删表的指针：`docs/core/design/MODEL-BENCH.md` KD-53「见 §3 受影响文件表」· `docs/core/design/PROMPT-SYSTEM.md` 数处「见受影响文件表」· `docs/core/design/PROVIDER.md` ∥ `docs/core/design/TOOLS.md` 的「见上表」。

**处置 = 随正或随删**：指向的对象没了，指针就是死锚（D8）。

### 1.20 裁决：表里夹带的**实施坐标**要补回，判据一条

**设计席连报两处同形问题**（`docs/core/design/TOOLS.md` §6.22 的「实施面」列 · `docs/core/design/MANIFEST.md` 三张表的「编辑点（函数级）」列）：删表时把**落笔坐标**一起带走了。

**我的判据**：

> **一个格子答的是「这个机制在哪实现」⇒ 状态，要补回机制面。**
> **答的是「这一批在这儿落了几行」⇒ 账，删。**

**同一张表里两种格子混着装 —— 这就是为什么删表会连带带走状态。** 删之前必须逐列判，不是整表判。

**补法**：按语义搬进对应机制节，原文不改；**已经在盘的不复写**（D2 单源）。

### 1.21 同一失败模式的预防已生效

设计席顺手把 `docs/core/design/AGENT-LOOP-SUBAGENT.md:656` 与 `docs/core/design/ADVISOR-GUARDS.md:126` 的表内落地坐标改写成「坐标（单源）」句留存 —— **它在同一批里自己推广了这条判据**，不是等下一次踩。

### 1.22 裁决：档位结论 = 账，删；阈值 = 规矩，留

设计席 `#32` 上抛：`docs/core/design/PROMPT-SYSTEM.md` 还剩 4 处**档位结论**、以及判表 J6 ∥ 验收 A3 的 **Δ 读数行**，因为 `docs/core/design/DOC-DISCIPLINE.md` 的 DD-30 明文保「表级一句尺寸档位结论」，与 §1.12「一格都不留」相抵。

**我的裁决：**

> **「本批这几档都在 300 / 500 / 800 线内，无拆分计划」= 对一批文件的判断 ⇒ 账，删。**
> **「300 / 500 / 800 这三条线本身」= 规矩，留。**

**判据同 §1.20**：格子答「这批怎么样」是账，答「规矩是什么」是规矩。

**§1.23 连带**：DD-30 那句「表级一句尺寸档位结论必须仍在」本身也要改 —— 它要求的是这张表存在。**归第六轮（规则面）。**

**Δ 读数行（J6 ∥ A3）** = 读数，按 D8 删。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（十三轮收口 · 第十三轮 = 评审轮 3 三条处置（§2.22）· 门 PASS）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.0 一句话

设计档里的「受影响文件」类批次账整块退场（表 + 领起句 + 口径注），判据 = 本档 §1.15 两问。本轮覆盖派单的 14 档（`docs/core/design/**`）。

### 2.0a 先例与勘察（两行 · 评审 #8 补）

**同类先例** = `#1902`（`docs/batches/2026-11-01-state-doc-history-purge.md`）规矩面改写的既有形：删除单元 = 「领起句 + 表 + 口径注」整块、规范句改写而非加注、节号留空号不重排 —— **对齐**。**偏离一处** = `#1902` 只改规范句、不动内容承载物；本批删表会带走表内落地坐标，故多出「删前逐列判、答『机制在哪实现』的格子先迁机制面」与三次坐标补回（§1.20 ∥ §2.11.5 ∥ §2.12.3）。

**勘察证据（查过哪些档）**：`docs/core/design/DOC-DISCIPLINE.md`（A-DD15 · DD-30 · §3.7 ∥ §3.10 ∥ U-5 ∥ §4.5 批档可删性）· `docs/core/design/ADVISOR-CONVERGENCE.md` §9（尺寸档位核查维度）· `docs/core/requirements/METHODOLOGY.md`（F2-4 ∥ F7-1 ∥ F-R24a ∥ F-R24b）· `docs/core/design/CORE-UNIFICATION.md` §2.5（列定义 ∥ 注册表）。

**结论**：前三档即本批射程与判据源，第四档是本批判留面（§2.20.3）。`index.publicRepos` 未逐字段核对 ⇒ 外部一手源输入**不作声明**。


### 2.1 本批覆盖条目

1. 表退场 —— 14 档 / 48 张（逐档见 2.2）。
2. 连带口径注退场 —— 表标题里的行数口径、表注、贴线判、坐标位移注（逐处见 2.3）。
3. 存量超长段拆段 —— 只加空行、零字改（见 2.4）。
4. 门与 §2 落盘（读数见 2.9）。

### 2.2 逐档实读（删表张数 / 删后行数）

| 档 | 删表 | 删后行数 |
|---|---|---|
| `docs/core/design/PROMPT-SYSTEM.md` | 24 | 5,559 |
| `docs/core/design/TOOLS.md` | 5 | 1,837 |
| `docs/core/design/PROVIDER.md` | 4 | 1,378 |
| `docs/core/design/LIGHT-CHANNEL.md` | 3 | 474 |
| `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 2 | 430 |
| `docs/core/design/LEDGER.md` | 2 | 1,440 |
| `docs/core/design/ADVISOR-GUARDS.md` | 1 | 600 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 1 | 964 |
| `docs/core/design/AGENT-LOOP-UPSTREAM.md` | 1 | 1,270（含拆段） |
| `docs/core/design/MANIFEST.md` | 1 | 1,302 |
| `docs/core/design/MODEL-BENCH.md` | 1 | 1,866 |
| `docs/core/design/SESSION-OBSERVABILITY.md` | 1 | 204 |
| `docs/core/design/TESTING.md` | 1 | 1,360 |
| `docs/core/design/TIMEOUT-DIGEST.md` | 1 | 270 |

合计 **48 张 / 14 档**。父侧报 23 张、上一轮设计席报 33 张，两个数都不作判据 —— 本行 = 本席按两问判据逐档实扫所得。

### 2.3 连带删的口径注（逐处）

- `docs/core/design/PROMPT-SYSTEM.md`：删「测试档…不在上表 12 档内」整行（引已删表）；删 §6.39 表注 1（行数口径）与表注 2（坐标位移）· §6.40 表注 1/2 与续行。
- `docs/core/design/TOOLS.md`：删 `wc -l` 口径注一行（原在落位表后）。
- `docs/core/design/SESSION-OBSERVABILITY.md`：删「行数为本档写作时 `read` 读数。**跨文件行数上限**…」整段（含 500 行口径复述，判据本体住工作区指南）。
- `docs/core/design/TIMEOUT-DIGEST.md`：删「行数口径」与「复核面」两段。
- `docs/core/design/LEDGER.md`：删「贴线判（由上表现行 + 增量上界相加得出）」整段。
- `docs/core/design/PROVIDER.md`：删「本表读数 = `ReadAllLines().Length`…」整段。
- `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`：删「行数口径 = 末行行号…」整行。
- `docs/core/design/MODEL-BENCH.md`：删「量法（单源）」与「为什么不用 PowerShell」两段及表标题；**判据强度照留** —— 原表注里的「≤500 建议 / ≤800 硬限」一句保留，改写为不带「本批」的判据句。

### 2.4 拆段（逐处）

只动 `docs/core/design/AGENT-LOOP-UPSTREAM.md`（其余 13 档按同一判据实扫零命中）。两轮共 26 处按语义停顿拆开：第一轮 11 处（句末标点）、第二轮 12 处（分句标点）、兜底 3 处（无标点长句按空格 / 括号断）。

核法 = 去全部空白后与原档逐字节相等 ⇒ 三轮回执均 `identical=true`：一个字未改、一句未删、未改成指针。

### 2.5 拆分计划（原文抄录 · 债先入账再随表删）

**债 1 · `docs/core/design/TIMEOUT-DIGEST.md`**（原表后「若该档增长越档」的拆分设想，随表删，原文）：

> 单文件最大 = `thincoder-core/agent/helpers.mjs` 500 行，位于 500 行咨询档上沿，不越档、不拆分。若该档继续增长越档，拆点 = 把 offload / 预览族整块外移为 `thincoder-core/agent/offload.mjs`（原档保留 re-export，消费面零改），仅此一处。

**债 2 · `docs/core/design/MODEL-BENCH.md`**：58 档「拆分计划」列全为「无」 ⇒ 无债。

**债 3 · `docs/core/design/LEDGER.md`**：「拆分触发 = 该档过 650 行」是判据不是账，未随表删（仍在盘）。

### 2.6 残留与上抛（实读 · 待父侧裁）

**（a）同族「受影响文件」节仍在盘** —— 列名不含现行行数列，两问判据不命中，本席未删：

- `docs/core/design/TOOLS.md` 的 `## 5. 受影响文件（该子系统）` 节；另有 6 处「用例表 ∕ 受影响文件与行数预算」指针行。
- `docs/core/design/PROVIDER.md` 的 `## 5. 受影响文件（该子系统）` 节；另有 1 处「本项受影响文件」。
- `docs/core/design/LEDGER.md` 4 处「受影响面（行数 = 现行）」节 + 4 处「贴线判」指针句 + 1 处表行。
- `docs/core/design/MANIFEST.md` 3 处「受影响文件」段 + 2 处「受影响文件表行 N」回指。
- `docs/core/design/TESTING.md` §11.8 / §12.3 / §13.3 三节 + 3 处「受影响文件」段。
- `docs/core/design/AGENT-LOOP-SUBAGENT.md` 1 处「§6.26 累计受影响面」。
- `docs/core/design/ADVISOR-GUARDS.md` 1 处「受影响文件（本笔）」。
- `docs/core/design/PROMPT-SYSTEM.md` 4 处「**受影响文件**」段 + 4 处引「受影响文件表」的句子。

**（b）Δ-only 家族未删** —— 有「本批改多少 / 预期 Δ」而无「现行行数」列，按 §1.15 两问判据不成立而未删：`docs/core/design/PROMPT-SYSTEM.md` 的落点表 / 改动清单族（含 `| # | 文件 | 落点 | 动作 | Δ 行 |` 形）· `docs/core/design/TOOLS.md` 与 `docs/core/design/PROVIDER.md` 的落点表。**同族内容、不同列形，请裁是否一并退场。**

**（c）`docs/core/design/TESTING.md` 删表连带删了判据列** —— 该表「判据」列承载 A-RC1–A-RC5（反向探针 ⇒ `exit 1`；收集面外 ⇒ 命中 `uncollected test file` 等）。按两问判据整表删，判据随之退场；若这些判据要留在状态档，请裁回填位置。

**（d）本批删除造成的断指（已查出的全部）** —— `docs/core/design/MODEL-BENCH.md` 的 KD-53 行「行数与档位见 §3 受影响文件表」；`docs/core/design/PROMPT-SYSTEM.md` 中「行数 ∥ 字符见受影响文件表」「受影响文件表前五行」等句；`docs/core/design/PROVIDER.md` 与 `docs/core/design/TOOLS.md` 的「见上表」句。这些句子指向已删的表，需随正或随删。

### 2.7 验收对照（回指 §2.1 四条）

1. 表退场 ⇒ 逐档扫「现行行数 / 当前行数 / 现量 / Δ → 改后」等表头，2.2 所列张数处归零（本席实跑）。
2. 口径注退场 ⇒ 2.3 所列各段逐个扫零命中。
3. 拆段 ⇒ 去空白后逐字节相等（`identical=true`）；`doc_check` 段落判据零命中。
4. 门 ⇒ `doc_check(mode:"gate")` 首行 `DOC-CHECK GATE: PASS`，读数记 2.9。

### 2.8 关键决策

- **K1 · 删除单元 = 表块（领起句 + 表 + 口径注），不是整节**：这些表住在承载机制正文的节里，整节删会连带删机制正文，与 §1.5「机制描述不动」相抵。
- **K2 · 两问判据按字面执行**：只有 Δ 列而没有现行行数列的表不删，改为上抛（2.6b）—— 判据已写死在 §1.15，席上另立解释就是改判据。
- **K3 · 判据强度一语不动**：`≤500 / ≤800 / 650` 等阈值句照留，`docs/core/design/MODEL-BENCH.md` 的表注只摘掉「本批 Δ」那半句。
- **K4 · 节号留空号**：`docs/core/design/SESSION-OBSERVABILITY.md` §4、`docs/core/design/TOOLS.md` 与 `docs/core/design/PROVIDER.md` §5 等删后不重排（§1.10）。

### 2.9 门读数

- 首轮门：`ERROR`（多项目工作区，需指名 target）⇒ 补 `target = D:\teamcode\thincoder` 复跑。
- 第二轮：`REFUSED（19 段文字太长，难于阅读）`，19 处全在 `docs/core/design/AGENT-LOOP-UPSTREAM.md`。
- 拆段两轮后复跑：本条落盘回执里的 `[doc-check gate]` 行。

### 2.10 边界

只动 `docs/**` 设计档的这 14 档；`docs/core/design/DOC-DISCIPLINE.md` 与 `docs/core/design/ADVISOR-CONVERGENCE.md` 未触（规则面 = 下一轮）；需求档未触；代码零改；不新增机检；不重排节号。

### 2.11 第二轮（残留清账 · 本席落盘）

**判据** = §1.17 一问：这一节 / 这张表的主题，是不是「这一批改了哪些档」？是 ⇒ 删，不管形状。两类不算：说「该查什么」的 · 说「阈值是多少」的。

**交付形态（如实记）**：本轮派单 9 档，**落盘 4 档 / 未落盘 5 档**。本席回合预算在 9 档全部扫完前耗尽，按降级交付处理 —— 未做项逐档点名在 2.11.4，**不冒充完成**。

#### 2.11.1 已落（4 档）

| 档 | 处置 |
|---|---|
| `docs/core/design/TOOLS.md` | 删 `## 5. 受影响文件（该子系统）` 整节 · 删 §6.15.3 `行数与拆分评估` 段（含 `412 / 435` 与 §2.8.1 指针）· 删 §6.22 `落点文件清单` 整块（表 21 行 + 近线注 + 档位结论 + 读数口径 + 零改面，共 33 行）· 7 处「受影响文件」指针句随正 |
| `docs/core/design/PROVIDER.md` | 删 `## 5. 受影响文件（该子系统）` 整节 · 删 §6.17 `本项受影响文件（行数口径…）` 段 + `tier 判定：最大 = server 363 ∥ CLI 205…` 行 · `该档入受影响文件表（Δ = ±0…）` → `该档零改动` · 表行 `载荷（受影响文件表在册）` → `载荷` |
| `docs/core/design/TESTING.md` | 删 `### 11.8 受影响文件` 整节（14 行表）· 同位置补回 A-RC1–A-RC5 判据（见 2.11.2） |
| `docs/core/design/MODEL-BENCH.md` | KD-53 断指两处随正：`（**已落**；行数与档位见 §3 受影响文件表）` → `（**已落**）`；`① bench/probe.mjs 行数与档位见 §3 受影响文件表（§10 面）⇒ 并入即越 500 线` → `① bench/probe.mjs 并入即越 500 线（§10 面）` |

**行数读数**：本席未把「删后行数」落进本表 —— §1.15 判据要清的就是这个数；文件现值以盘为准。

#### 2.11.2 A-RC1–A-RC5 补回（§1.18 的第一件）

**补在哪**：`docs/core/design/TESTING.md` 原 §11.8 位置（`§11.7` 末、`### 12` 之前），作**无编号判据块** `**反向探针判据（A-RC1–A-RC5 · 收集面自检）**`；节号 11.8 留空号不重排（§1.10）。

**原文怎么写的**：逐字取自 `git diff` 的删除行（判据列原文），未改写、未压缩：

- **A-RC1**（VSC 面）：临时落 `test/__reverse-probe.test.mjs`（未登记）⇒ `node test/run.mjs` **exit 1** 且输出命中单元测试**完整样例行**（**先于** `node --test`——零 `ℹ ` 计数行）；删档复原。
- **A-RC2**（CLI 面）：临时落 `test/__reverse-probe/x.test.mjs`（收集面外）⇒ `node test/run.mjs` **exit 1** 且输出含 `uncollected test file`；删目录复原。
- **A-RC3**（零假阳）：健康树面上自检不误报——cli（`test/` 顶层零档、零 `*.test.mjs`）⇒ 零 `uncollected test file`、出口 = 空集说明器（exit 1 ∧ 仓根指引——集成层在仓根，§10.3 A-SL3）；核（`test/` 零 `*.test.mjs`）⇒ 零 `uncollected test file`、出口 = 空集说明（exit 1 ∧ `requirement N20`——§10.3 A-SL4）；VSC 面 = 面差 ②（分层未落），读数不引为「已验」。
- **A-RC4**（零回归）：既有反向断言（集成测试域）逐字零回归。
- **A-RC5**（核面先红）：临时落 `test/__reverse-probe/x.test.mjs`（核 = 零目标集合，任何位置皆收集面外）⇒ `node test/run.mjs` **exit 1** 且输出含 `uncollected test file`；删目录复原。

**同时删掉的（属账，不补）**：原表「文件 / 现状 / Δ」三列、以及表后 `操作数族登记面的检索读数（本席实跑 2026-10-24）` 段 —— 那段是「命中且须随本批改 = 上表五行」的批次账。

#### 2.11.3 拆分计划（原文抄录 · 债先入账再随表删）

**债 · `thincoder-core/agent-tools/ssh-transport.mjs`**（原 `docs/core/design/TOOLS.md` §6.22 档位结论行，随表删，原文）：

> `ssh-transport.mjs` **561**（Δ +237，非空 519）⇒ **越 500 顾问线**（800 硬线未触）⇒ **拆分计划** = 可见文本面整块迁出：`MASK_SEG_MIN` ∥ `INVISIBLE_SPLIT` ∥ `createStripper` ∥ `normalizeText` ∥ `createMask`（现 `:40` ∥ `:122`–`:252`，≈132 行）迁入新档 `thincoder-core/agent-tools/ssh-text.mjs`（职责 = 剥后文本面单点：剥离 + 遮蔽归一——两者本就共用同一不可见类目，同档不拆）；消费方 `ssh-session.mjs:34` 的 import 一行改指向新档，其余调用点零动；迁后预估 **≈431**，**迁完重测**；迁后仍越 500 ⇒ 拆分 = 新结构，**另开批**（本设计不授权）。**授权面 = 本行自身 ∥ 落点文件清单行 16**——拆点与迁入档在此指明，不是另取授权。

**待父侧落台账**（本席无写权）：`trigger = 归批`，evidence 指本条。原句末「落点文件清单行 16」所指的表已删 —— 授权面收归本 §2 记录与台账行。

#### 2.11.4 未落盘（5 档 · 逐档点名，未动一字）

| 档 | 未做的内容 |
|---|---|
| `docs/core/design/LEDGER.md` | 4 处「受影响面」节（`:249` ∥ `:316` ∥ `:361` ∥ `:388` ∥ `:482` ∥ `:622` 一带）+ `/ledger` `:627`–`:644` 表与贴线判 + `:1190` 标记范围段 |
| `docs/core/design/MANIFEST.md` | 3 段「受影响文件」（`:789` ∥ `:900` ∥ `:1073`）+ `:616` `（受影响文件表行 5）` + `:889` ∥ `:945` 回指句 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | `:656` `**§6.26 累计受影响面（前批已落 + 本批增量 · 盘上读数）**` 整段 |
| `docs/core/design/ADVISOR-GUARDS.md` | `:126` `**受影响文件（本笔）**——行数口径 …` 段及其表 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4 段「**受影响文件**」（`:4879` ∥ `:5011` ∥ `:5297` ∥ `:5495`）+ Δ-only 落点表 / 改动清单族（`| # | 文件 | 落点 | 动作 | Δ 行 |` 形）+ `:2716` ∥ `:3539` ∥ `:4349` 引表句 |

**为什么没做完**：本席回合预算在扫完 9 档前耗尽（回合上限 15）。**不给「下一轮顺手做」的话** —— 这 5 档要么另派一轮，要么另开批。

#### 2.11.5 已删除带来的连带损失（实读，请父侧裁）

`docs/core/design/TOOLS.md` §6.22 落点表的「实施面」列里含**机制坐标**，随表退场（非账，本席未另迁）：

- 行 2 `ssh-session.mjs`：7 处 `capText(...)`（`:262` ∥ `:392` ∥ `:410` ∥ `:414` ∥ `:444` ∥ `:455` ∥ `:465`）改 `capWindow(...)` + 中段写回 `entry.buf`；`connect` 首屏吃 `SSH_CONNECT_SETTLE_MS`。
- 行 16 `ssh-transport.mjs`：`createStripper` ∥ 四门就绪判据 `waitSettled` ∥ 帽窗口 `capWindow` ∥ 常量 `SSH_TIMEOUT_MS` 10 s → 60 s。
- 行 17 `subagent-scheduler.mjs`：取号扫描域 += `_sshSessions`（不扩 ⇒ 与存活 ssh 会话 id 撞号）。

**判据句与用例仍在盘**（§6.22 验收判据 S1–S9 / NS1–NS7 与用例表未动）—— 丢的是**实施点坐标**，不是行为判据。要留则须另定落点。

#### 2.11.6 门读数

`doc_check(mode:"gate")`，range = 本席本轮写过的 4 档，`target = D:\teamcode\thincoder`：

```
DOC-CHECK GATE: PASS
范围：显式 docs 4 档 · 结论：0 段有问题（4 档全清）
```

#### 2.11.7 边界（本轮实际遵守）

`docs/core/design/DOC-DISCIPLINE.md` 与 `docs/core/design/ADVISOR-CONVERGENCE.md` 未触（规则面 = 下一轮）· 需求档未触 · 代码零改 · 未加机检 · 未重排节号（`docs/core/design/TOOLS.md` §5 ∥ `docs/core/design/PROVIDER.md` §5 ∥ `docs/core/design/TESTING.md` §11.8 均留空号）· 机制正文 / 代码坐标 / 判据阈值未动。

### 2.12 第三轮（残留清账 5 档 · 本席落盘）

**判据** = §1.17 一问：这一节 / 这张表的主题是不是「这一批改了哪些档」？是 ⇒ 删，不管形状。不算的两类（说「该查什么」的 · 说「阈值是多少」的）照留。
**文档域** = 本批派单 5 档，全部落盘。**行数 = `readFileSync(档,"utf8").split("\n").length` 实读**。

#### 2.12.1 逐档（删掉的块 + 现值）

| 档 | 本轮删 / 改的块 | 现值 |
|---|---|---|
| `docs/core/design/LEDGER.md` | 5 处「受影响面」块：§3.2（`:249` 实现 / 文档 / 零改面三条）· §3.5（11 行表 + 用例 + 文档面 + 贴线判 + 档位结论）· §3.6（`:388` 实现四档 + 用例 + 文档面 + 零改面 + 贴线判）· §3.7（`:482` 实现 / 消费面 + 用例 + 文档面 + 零改面 + 贴线判）· §3.8（10 行表 + 本表性质 + 用例档 + 文档面 + 贴线判）；另删 §3.10「受影响文件（本批 = 测试面 + 文档面 + 一行产品码）」表 · §7.2「标记范围受影响面」条；两处标题尾「∥ 受影响面」与「本节不另列受影响档」随删 | **1,377**（−88，git diff 逐 hunk 核过） |
| `docs/core/design/MANIFEST.md` | §2.3「受影响文件全清单」（56 行表 + 行数口径注 + Δ 钉死注 + 拆分评审注）· §2.10 尾「受影响文件表」（4 行）· §2.11 尾「受影响文件」（9 行 + tier 结论） | **1,248**（−146，逐 hunk 核过） |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | §6.26「累计受影响面」表（7 行 · 含盘上读数 / 本批增量 / 状态三列） | **956** |
| `docs/core/design/ADVISOR-GUARDS.md` | 「受影响文件（本笔）」8 行表 + 行数口径句 + 「500 软线」读数行 | **591** |
| `docs/core/design/TOOLS.md` | 本档不删，只补坐标（见 2.12.2） | **1,799** |

**照留的（逐条读过，不是按形状拍板）**：
- **`docs/core/design/LEDGER.md` §3.5「落地批」四件表** —— 它是「哪些件已落 / 未落」的在册状态单源，被 §3.6 / §7.1 / §8 逐处引用；删了会连带断一批指针，且它不是「这批改了哪些档」。
- **拆分触发 / 顾问线判据**（`650` / `500` / `800`）—— 阈值属「说阈值是多少」，改写为不带本批读数的判据句留在原节（`docs/core/design/LEDGER.md:346`）。
- **`docs/core/design/AGENT-LOOP-SUBAGENT.md` 行数纪律注**（文档档不适用源码行数线 + 档位归属三分）—— 说「该查什么 / 归哪档」，不是账。
- **`docs/core/design/LEDGER.md:437`「⇒ 受影响面 = `formatDetailLine` 单源 + 三端逐字断言」** —— 住在「取舍与代价」里，说的是这次输出契约变更波及什么，是设计论证，不是文件账。

#### 2.12.2 TOOLS 坐标补回（§2.11.5 的连带损失 · 逐条）

**落在 `docs/core/design/TOOLS.md` §6.22「适用范围（时值拆两常量）」条**（`:1045` / `:1047`）：

- 常量 `SSH_TIMEOUT_MS` **10 s → 60 s**（`thincoder-core/agent-tools/ssh-transport.mjs`）。
- 中段回填写回 `entry.buf`（`thincoder-core/agent-tools/ssh-session.mjs`）。

**落在同节「会话池」表「池」行**（`:1076`）：

- 取号扫描域 += `_sshSessions`（`thincoder-core/agent-tools/subagent-scheduler.mjs`——不扩 ⇒ 与存活 ssh 会话 id 撞号）。

**已在盘、未重复写**：7 处 `capWindow` 返回点（`:262` ∥ `:392` ∥ `:410` ∥ `:414` ∥ `:444` ∥ `:455` ∥ `:465`）与四门就绪判 `waitSettled` —— 原就在同节「先例」表（`:984` / `:992`），按 D2 不复写。

#### 2.12.3 同类处理：另两档的表内坐标也没随表一起没

`docs/core/design/AGENT-LOOP-SUBAGENT.md` 与 `docs/core/design/ADVISOR-GUARDS.md` 的受影响表「说明 / 改动面」列里带落地坐标，按 §2.11.5 的教训**改写为坐标句留存**（不是换名保表）：

- `docs/core/design/AGENT-LOOP-SUBAGENT.md:656`「**固块落地坐标（单源）**」：`subagent-spawn.mjs` 固块收集块（`:346-357`）与 `spawnBlocks.push`（`:357`）· `filesBlockOf`（`:170-178`）· `audit-block.mjs` `buildAuditBlock(ctx)` · `setup.mjs:285`。
- `docs/core/design/ADVISOR-GUARDS.md:126`「**落点坐标（单源）**」：五档产品码逐条（`design-token.mjs` / `design-slots.mjs` / `batch-skeleton.mjs` / `batch.mjs` / `advisor.mjs`）+ 两个集成宿主。

**未留存（请父侧裁）**：`docs/core/design/MANIFEST.md` 三张表的「编辑点（函数级）」列随表退场 —— 那是上一批已落工作的落笔点，且机制正文各节在盘；要留须另定落点。

#### 2.12.4 断指（本轮 5 档内逐处）

| 处 | 处置 |
|---|---|
| `docs/core/design/MANIFEST.md:616` | 「…= 实施轮（**受影响文件表行 5**）」⇒ 括号句删，改「= 实施轮」 |
| `docs/core/design/MANIFEST.md:889` | 「…与目标态相反（**列入受影响文件**）」⇒ 括号句删 |
| `docs/core/design/MANIFEST.md:945` | 「未入本表的需求项」整行改写 —— 需求 7 / 验收 ⑤⑥ 的回指目标（表行 8 / 9 / 19 / 22）已不存在，随删；仍活的验收 ⑧（`#1731` 裸名指针）⇒ 边界「本仓债」句照留 |
| `docs/core/design/LEDGER.md` 的 `:400` ∥ `:494` ∥ `:644` ∥ `:1190` 引「§3.5 表 / §3.5「受影响面」表 / 档位结论」 | 随所属块整块退场，无残留 |
| `docs/core/design/LEDGER.md`「单源 = §3.5 四件表」（`:353` ∥ `:1135` 等） | **不删** —— 指的落地批四件表仍在盘（见 2.12.1 照留项） |

#### 2.12.5 拆段

三处新增 / 改造后的长段超 300 字 ⇒ 按分句边界插空行拆开：`docs/core/design/ADVISOR-GUARDS.md:126`（3 段）· `docs/core/design/AGENT-LOOP-SUBAGENT.md:656`（2 段）· `docs/core/design/TOOLS.md:1045`（2 段）。

**过程中自查出并已回改**：首拆时 3 处把「；」改成了「。」，那属改字而非拆段 ⇒ 三处已回改为「；」，现为纯空白差异。

**identical 读数：未机证 —— 不冒充**。盘上没有「拆分前」基线可比（HEAD 远早于本轮，工作树未提交；拿 HEAD 逐 hunk 比会连上一轮未提交改动一起算进去）。可核的是：三次拆分编辑的 old / new 逐字比对，差异仅 `\n\n` 插入。

#### 2.12.6 门读数

```
DOC-CHECK GATE: PASS
范围：显式 docs 5 档 · 结论：0 段有问题（5 档全清）
```

首次跑 `REFUSED（3 段文字太长）`，命中即上面三处新增长段；拆段后复跑 PASS。

#### 2.12.7 边界（本轮实际遵守）

只动派单 5 档 · `docs/core/design/DOC-DISCIPLINE.md` ∥ `docs/core/design/ADVISOR-CONVERGENCE.md` 未触（规则面下一轮）· 需求档未触 · 代码零改 · 未加机检 · 未重排节号 · 判据阈值 / 机制正文 / 代码坐标未删（两处表内坐标改写留存，见 2.12.3）。

### 2.13 第四轮（PROMPT-SYSTEM 残留 + MANIFEST 坐标 · 本席落盘）

**判据**（父侧本轮令，同 §1.17 ∥ §1.20）：① 这一节 / 这张表的主题是不是「这一批改了哪些档」？是 ⇒ 删，不管形状。② 删之前逐列判：格子里答「这个机制在哪实现」⇒ 状态，先补到机制面；答「这一批在这儿落了几行」⇒ 账，随表删。

**派单 2 档 · 全部落盘。** 行数 = `readFileSync(档,"utf8").split("\n").length` 实读。

#### 2.13.1 `docs/core/design/PROMPT-SYSTEM.md` — 退场 29 块 · −318 行

删后行数 **5,241**（改前 5,559）。−318 = 29 块共 317 行 + 勘察证据行 1 条。

**甲 · 4 处「受影响文件」整段**（改前 `:4879` ∥ `:5011` ∥ `:5297` ∥ `:5495`）：文件 ∥ 改动 ∥ 备注（笔主）三列，主题 = 本批改了哪些档。

**乙 · 25 处「落点表」整块**（表 + 紧邻的落点注 / 读数注）：

- 坐标列形 `| # | 坐标 | 现文 → 新文 | 动作 |`：`:1317` ∥ `:1417` ∥ `:1520` ∥ `:1692` ∥ `:1819` ∥ `:1958` ∥ `:2096` ∥ `:2281` ∥ `:2467` ∥ `:2656` ∥ `:4398` ∥ `:5124`。
- 文件 + 预期 Δ 形：`:2821`（带 `Δ` 列）∥ `:3167` ∥ `:3323` ∥ `:3452` ∥ `:3587` ∥ `:3808` ∥ `:3989`。
- 文件 + 落点（内容锚）+ `Δ 行` 形：`:4253` ∥ `:4608` ∥ `:4722` ∥ `:4833` ∥ `:4951`。
- 两舱逐档计数形（`舱 | 档 | 超 300 字符行数` 十六档）：`:2955`。

**逐列判（②）实读**：这些表里没有「这个机制在哪实现」的格子 —— 每块的**逐字目标形**在盘且自带目标文件与锚（如 `thincoder-core/prompts/persona-engineering.md:8` ∥ `:319` ∥ `:97`；`thincoder-core/prompts/common.md:49` 之后；`Delete on use` 条续行之后），机制实现面 = 提示词档本体 + 该围栏块，D2 下不复写。⇒ 整块退场，**无坐标需迁**。

#### 2.13.2 断指（父侧点名 3 处 + 同判据实扫出的其余 9 类，逐处）

| 处（改前行） | 处置 |
|---|---|
| `:2716` | 删「L4 ∥ 受影响文件表的」，留「「零改 / ±0」= 实施席面口径（实施席零写需求档）」 |
| `:3539` | 改「「无可跑面」的实读锚 = 本节改动面全为 `.md` 文本档（提示词 + 设计档）」——去表指、去批次计数 |
| `:4349` | 改「七档 persona：各加一块；…」——去「行数 ∥ 字符见受影响文件表」 |
| `:4091`（判表 J6 行） | 删「，Δ 见受影响文件表」，留「七档各加一块」 |
| `:3875`（偏离②） | 改「首次分清「父侧已知数」与「本席实读」两种来源」——留判据、去已删表 |
| `:3624`（集成测试设计） | 「受影响面 = 提示词文本 4 处 + 设计档」⇒「改动面 = 提示词文本 + 设计档」 |
| `:2807`（判表 F1 行） | 「16 档（逐档见落点表）」⇒「16 档（逐档）」 |
| `:1547` ∥ `:1707`（边界） | 「实施轮由 eng-coder 照落点表落笔」⇒「依本节逐字块落笔」 |
| `:2288`（偏离②） | 删「既有落点表只有「动作」列——本条不新增表列」 |
| `:3835`（偏离②） | 删「落点表按档拆行、语义只一份」半句 |
| `:4925`（勘察证据行） | 整条删（`落点表两条内容锚均抄自本轮实读的整行`） |
| 形制清单 20 处 | 先例∥偏离行与 `existing` 名「拆节形（拆分表 ∥ 落点表 ∥ 逐条验收）」逐个摘掉该要素（`+ 落点表 + ` 16 处 · `/ 落点表 / ` 2 处 · `（落点表 + ` 1 处 · ` ∥ 落点表 ∥` 1 处）——留着即宣告本节含一张已不存在的表 |

**判为不是断指（未改）**：本档 `:4`「`docs/core/design/CORE-UNIFICATION.md`（… 受影响文件总表 …）」指另一档的现存表，**不是**指向本档已删表；该档在本批射程外（另轮）。

#### 2.13.3 `docs/core/design/PROMPT-SYSTEM.md` · 判而未删（请父侧裁）

- **档位结论 4 处**（各块后「**档位结论**：…零跨档位、无拆分义务」）——**照留**。理由：`docs/core/design/DOC-DISCIPLINE.md` DD-30 仍在盘且明文「表级一句档位结论仍在」；而 §1.12 判「表归批档 §2，一格都不留」⇒ 两规相抵。本席不越权删在盘规范所保的句子。**处置落点 = 下一轮规则面（与 A-DD15 同批改）**。
- **两处 Δ 读数行**：判表 J6（七档改前读数 458 / 57 / 22 / …）与验收 A3（八档改后读数 + Δ 行）——格子答的是「该档多少行 / 本批改几行」= 账，但**所在表主题是判力 / 验收**，整行删会削判据。本轮只摘 J6 的指向句，读数留。请裁是否连读数一并退场（先例 = §6.62 的关系式：行数 = 改前 + N）。

#### 2.13.4 `docs/core/design/MANIFEST.md` — 编辑点坐标逐条（②）

三表已在上一轮删（§2.12.1）；本轮按 §1.20 逐列判其「编辑点（函数级）」列。**行数 1,248 → 1,252**（+4 = 两段坐标 + 空行）。

**已在盘（D2 不复写 · 逐名实读命中）**：

- 入口钩子族：`attachManifest`（`:170` ∥ `:294` ∥ `:458` ∥ `:1130`）· `assembleAgent`（`:171`）。
- 档路径 / 写门族：`manifestFilePath`（`:80` ∥ `:211` ∥ `:244` ∥ `:364`）· `MANIFEST_BASENAME`（`:207` ∥ `:291` ∥ `:574` ∥ `:776`）· `initManifest`（`:142` ∥ `:181` ∥ `:548`）。
- 读 / 校验族：`readManifest` / `writeManifest` / `validateManifest` / `fillDefaults` / `DEFAULT_MANIFEST` / `MANIFEST_SCHEMA` / `nestedKeys`（`:404` ∥ `:554` ∥ `:655` ∥ `:843` ∥ `:846`）。
- 发现 / 归属族：`discoverProjects` / `discoverRepos` / `scanChildren` / `owningProject` / `projectView` / `projectRootView` / `resolveProjectRoot`（`:81` ∥ `:86` ∥ `:88` ∥ `:95` ∥ `:107` ∥ `:109`）。
- 情境行 / 提醒族：`refreshManifest`（`:576`）· `pushManifestStateReminder`（`:351`）· `manifestReportLine`（`:333`）。
- 工具面 / 声明面：`manifestReadTool`（`:690`）· `isSubagentReadonlyAction`（`:572`）· `loadProjectDeclaration`（`:156`）。

**实质结论**：三表「编辑点」列除下面 2 条外全部命中盘上机制面 —— 这一批删掉的是「计划 / 增量」，不是坐标。

**补回 2 条**（落点 + 本席实读依据）：

1. §2.5 读向条后新增**「声明装载面坐标（`thincoder-core/declaration.mjs`）」**：`loadProjectDeclaration(cwd)` `:332` ∥ `DEFAULT_DECLARATION` `:98` ∥ `clearDeclarationCache()` `:302` · 旧档在场的退役告警点在同档（判据见 AC-34）。
   依据 = `declaration.mjs:332` 逐字 `export function loadProjectDeclaration(cwd) {` · `:98` 逐字 `export const DEFAULT_DECLARATION = buildDeclaration(null)` · `:302` 逐字 `export function clearDeclarationCache() {`。
2. §2.2 两端入口钩子条后新增**「VSC 装配段坐标」**：`thincoder-vscode/src/agent/setup-tooltable.mjs`（工具表装配装饰面 = `thincoder-vscode/src/agent/tool-table.mjs`；`:103` re-export `buildToolTable` / `vscSubagentFace`）。
   依据 = `setup-tooltable.mjs:103` 逐字 `export { buildToolTable, vscSubagentFace } from "./tool-table.mjs"` ∥ `setup.mjs:16` 逐字 `import { wireAgentToolSeams, buildToolTable } from "./setup-tooltable.mjs"`。

**如实记（对 §1.20「原文不改」的偏离）**：原「编辑点」列经 `git diff` 读出时中文已乱码（形如 `抽为导�?attachManifest`），**不可逐字抄录**。两条补回文字由本席读代码按语义重写，坐标逐条本轮实读；逐字原文仍在 git 历史（`git diff -- docs/core/design/MANIFEST.md`）。

**判为账、不迁**：原三表的「当前行数 / 现值 / 增量预算」列与「实测 −88 / 已落 +28」一类读数。

#### 2.13.5 拆段

**本轮零处**：两档无新增 / 改造长段，门检首跑即 PASS；无纯空白改动 ⇒ `identical` 无需证（不造跑不通的自证）。

#### 2.13.6 门读数

```
DOC-CHECK GATE: PASS
范围：显式 docs 2 档 · 结论：0 段有问题（2 档全清）
```

`target = D:\teamcode\thincoder`；首跑即 PASS，无 REFUSED 轮。

#### 2.13.7 边界（本轮实际遵守）

只动 2 档 · `docs/core/design/DOC-DISCIPLINE.md` ∥ `docs/core/design/ADVISOR-CONVERGENCE.md` 未触（规则面 = 下一轮）· 需求档未触 · `docs/core/design/CORE-UNIFICATION.md` 的受影响文件总表未触（射程外，另轮）· 代码零改 · 未加机检 · 未重排节号（删块留空号）· 判据阈值 / 机制正文未删，代码坐标只增不删。

### 2.14 第五轮（规则面 + PROMPT-SYSTEM 尾巴 · 本席落盘）

**判据**（§1.12 ∥ §1.17 ∥ §1.20 ∥ §1.22）：① 「设计档 / 需求档不设受影响文件表；该表归批档 §2」——把旧规矩**整段换掉**，不是加注。② 判据强度（函数档 ≥300 · 文件档 >500 主动审视 · >800 必须拆 · 拆分触发 · 单测档豁免）**一条不删**。③ 档位结论 = 账，删；阈值 = 规矩，留。

**派单 3 档 · 全部落盘。**

#### 2.14.1 `docs/core/design/ADVISOR-CONVERGENCE.md`

| 处 | 改前逐字（摘） | 改后逐字（摘） | 类 |
|---|---|---|---|
| `:17` | 「核查用的尺寸档位判据数值 = 本节 §9「尺寸档位结论抽查」条」 | 「…= `docs/core/design/DOC-DISCIPLINE.md` §3.10「尺寸档位补充登记」（**数值单源**）」 | 迁判据 |
| `:356` | `## 9. 受影响文件尺寸档位核查（设计评审维度）` | `## 9. 源码档尺寸档位核查（设计评审维度）` | 改规矩 |
| `:358` | 权威链「判据数值 = 本节「尺寸档位结论抽查」条」 | 「判据数值单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.10」 | 迁判据 |
| `:362` | 「**受影响文件尺寸档位核查**：设计文档「受影响文件」表——是否列出…并带**一句表级尺寸档位结论**…① 结论在位；② 表内不出现行数 / 增量数值」 | 见 2.14.1a | 改规矩 |
| `:363` | 「**尺寸档位结论抽查**：…核设计的表级尺寸档位结论；含 ≥300 单体函数触及抽查…」 | **整条删**（语义并入 `:362`；数值单源 = §3.10，此处不复制——D2） | 迁判据 |
| `:401` | A-AC11「结论在位 ∧ 表内无行数 / 增量数值」 | A-AC11「清单取自批档 §2 ∧ 评审自行现量 ∧ 设计档内无行数 / 增量数值」 | 改规矩 |

**2.14.1a · `:362` 改后逐字**：

> **源码档尺寸档位核查**：本批要动的源 / 测试档（清单取自**批档 §2**——**设计档不设「受影响文件」表**：那张表答的是「这一批改了哪些档」，是一次性执行记录，住状态档就是一份没人回来更新的过期账），评审席按样本抽样、**逐档自行现量**，按 §3.10 判据数值判它该不该拆。
>
> **判据两条**：① 越档者逐档给拆分计划（点名拆点与迁入档）；② **设计档内不出现行数 / 增量数值——出现即报**。`.md` 档零尺寸档位义务。

#### 2.14.2 `docs/core/design/DOC-DISCIPLINE.md`（8 处规范句 + 7 块账退场）

**规则句改写（改规矩 / 迁判据）**：

- `:262` 改前：「**取消**：设计 / 需求档的「当前行数」「预计增量」…含受影响文件表内 `.md` 行（两列整列退场）」。
- `:262` 改后：「**不设该表**：设计 / 需求档**不设「受影响文件」表**——那张表答的是「这一批改了哪些档」，是一次性执行记录；住在状态档里，它今天就对、明天就错，而没有人会回来改它。」
- `:262` 后半：「该表归**批档 §2**，状态档一格不留。随表退场的还有行数列、增量列与行数口径注；文档档越线**不触发**任何拆分。」
- `:266` 改后：「**判据照留**：源 / 单测档的**尺寸档位判据与拆分触发**不动——`≥300` / `>500` / `>800`（数值单源 = §3.10）。表没有了，判据还在：它量的是源码档该不该拆，与表无关。」
- `:268` 改后：「**该表唯一的家 = 批档 §2**：本批改了哪些档、各档动作、行数与增量读数全写在批档 §2——它是过程档，随批删除，数字旧了也只是那一批的事。」
- `:292` R2 收正后 ⇒「`### 受影响文件（本批改哪些档 + 动作 + 行数 / 增量读数——**该表只住批档 §2**，设计 / 需求档不设）`」
- `:298` R8 收正后 ⇒「设计（本批改哪些档归批档 §2；状态档不设该表）」
- `:313` D-DD16 ④「批次档 §2 受影响文件表」⇒「批次档 §2（**该表唯一的家**）」；理由句「留『抄数』旧口径」⇒「留『状态档放表』旧口径」
- `:318`「**受影响文件**：本节零源 / 单测档…无拆分计划」**整句删**（对象已不存在）
- **新增 §3.10 数值单源块（迁判据的落点）**：「**尺寸档位判据（数值单源）**：函数档 `≥300` **触及即判**——函数是第一判据，文件 ≤500 行而内含 300+ 行单体函数 = 仍未达标；文件档 `>500` **主动审视**；`>800` **必须拆**（封口语义，无豁免通道）。`.md` 档零尺寸档位义务。」
- 同块续：「这三条量的是「源码档该不该拆」，与任何表无关——所以表退场后它们照旧在：设计评审据此逐档判，判法住 `docs/core/design/ADVISOR-CONVERGENCE.md` §9。」

**断指随正（同轮，逐处）**：

- `:248` 保留面去掉 `### *.4 受影响文件清单（R24a）`（h3 标题 ×2）一项。
- `:330`「接口契约表 · 受影响文件表 · 文档地图行」去该 token。
- `:751` M-6「新档在册（受影响文件表 + `docs/README.md`）」⇒「（**批档 §2** + `docs/README.md`）」。
- `:1786` 反查输出「建议录入受影响文件表」⇒「建议录入**批档 §2**」。
- `:1818` 节内导航去掉「§4.5.11 受影响文件面」。
- `:2213` ∥ `:2233` ∥ `:2252` 三处「⊆ 受影响文件表」⇒「⊆ **批档 §2 的**受影响文件表」。
- A-DD15 判据行重写（「不设该表…尺寸档位判据数值照留（单源 = §3.10）」）；原「代码面保留抽样坐标」行整句删。

**整块退场（7 处，逐块 `git diff` 复核命中目标）**：

- §3.7 自身「档 ｜ 面 ｜ 动作」表 12 行 · `:794` 受影响文件表（3 行）· `:882` 受影响文件表（2 行）。
- `:614` 受影响文件表（13 行，含行数口径注与尺寸档列）· `:958` 受影响文件全清单（含拆分门注）· `:1036` 受影响面表（9 行）。
- **§4.5.11「受影响文件（本契约的实施轮面）」整节**（16 行）。

节号留空号不重排（§1.10）。**用例面**：DD-30（代码面保留抽样）· DD-33（保留面夹具含 `### *.4 受影响文件清单`）两行**删**——判据对象已不存在，留着即成反证。

#### 2.14.3 `docs/core/design/PROMPT-SYSTEM.md`（§2.13.3 两项按 §1.22 裁决处置）

- **档位结论：实删 5 处**（原派单记 4 处，实扫 = 5——改前行号 `4613` ∥ `4730` ∥ `4889` ∥ `5001` ∥ `5190`），每处整段删。**计数不符如实记**：派单少算一处，本席按实扫处置。
- **Δ 读数行 2 处删**：判表 J6「七档 persona 读数 458·65,397 ∥ 57·6,466 ∥ …」· 验收 A3「八档改后读数…Δ 行 +10 ∥ +10 ∥ +6 ∥ …」。
- **阈值零动**：该档 `≤500` / `≤800` / 300 字符判据一字未删。
- **连带**：§7 上抛项编号保持 1–4 连号（中途曾误改成两个 2，已回改）。

#### 2.14.4 判据强度逐处坐标（证明没被连带删）

- `docs/core/design/DOC-DISCIPLINE.md:165-169`（D-1 500 建议线外 / 800 硬限内不拆 · D-2 超 800 单测档拆两档）——未动。
- 同档 `:656` 读数口径「软线 = 500（咨询层）· 硬限 = 800（仓 `AGENTS.md` 口径）」——未动。
- 同档 **`:658` 新增**「尺寸档位判据（数值单源）：`≥300` 触及即判 · `>500` 主动审视 · `>800` 必须拆 · `.md` 零义务」。
- 同档 `:746` M-3 拆分触发 · `:749` M-4 不设行数阈值 · `:751` M-6 不预建空档——未动。
- `docs/core/design/ADVISOR-CONVERGENCE.md:362` 两条判据 + `:233` `≤500` 假阳登记条——未动。
- `docs/core/design/PROMPT-SYSTEM.md` 的 300 字符段判据与 500 / 800 档位线——未动。

#### 2.14.5 门读数

```
DOC-CHECK GATE: PASS
范围：显式 docs 3 档 · 结论：0 段有问题（3 档全清）
```

`target = D:\teamcode\thincoder`。拆段：本轮零处（无新增 / 改造长段），故 `identical` 无可证对象——不造假自证。

#### 2.14.6 残留（实读，未处置 —— 逐处点名）

1. `docs/core/design/DOC-DISCIPLINE.md:170` 小节标题 `### 3.3 尺寸档位结论` —— 对象（表级档位结论）已退场，标题成空壳，正文 `:172` 只余一条指向 §3.15 的指针。**未删**：该编号被 §3 标题枚举与档头枚举引用，删标题要连带改两处枚举（D3），派单亦未含该处。
2. 同档 `:982` `**受影响面表**：` 引导句下已无表 → **引导句成孤儿**。**这是本轮删除的连带损伤，下轮必须收口**（删引导句，或补一句「该表归批档 §2」）。
3. 同档 `:1106` ∥ `:1347` 两处「现行行数与增量随实施轮实测」句 —— 仍带行数口径，按 §1.15 属账，派单未列、本轮未扫到。
4. 同档 `:1250` 「**受影响文件（as-of 2026-10-27 实读 · 口径 = `readFileSync…`，尾换行计一行…）**」整块（含口径注与行数）—— 同上，属账，未处置。
5. `docs/core/design/PROMPT-SYSTEM.md:4` 指向 `docs/core/design/CORE-UNIFICATION.md` 的「受影响文件总表」—— 另一档的现存表，非断指（同 §2.13.2 判例），该档在射程外。
6. 需求面未触：`docs/core/requirements/METHODOLOGY.md` 的 F-R24a ∥ F-R24b（§1.16）—— 需求档 = 主 agent 笔（D1），本席只报不改。

#### 2.14.7 边界（本轮实际遵守）

只动派单 3 档 · 需求档零改 · 代码零改 · 未加机检 · 未重排节号（§4.5.11 留空号）· 判据强度一条未删 · `_archive` ∥ `batches` 未触。

#### 2.14.8 过程如实记（一次自身失误 + 一次自检拦回）

首轮整块删除用**行号区间**（非内容锚定）。七处事后用 `git diff` 逐 hunk 复核，**全部命中目标块、零附带**；删除回执里的 `→ Lxxx` 是改动后的位置回显，我一开始误读成「被删行」，据此判断误删并准备回滚——复核确认**无损伤**，未执行回滚。教训落到操作：其后全部改写改为**内容锚定**。三次 `edit` 累积 33 条，全部命中。

### 2.15 第六轮（34 条机检存量债 · 本席落盘）

**派单**（父侧裁 ②）：授权本轮把 34 条一并清掉，然后补 §2。

**立项理由（父侧记 #1901）**：门判「本 run 改过的档**整档**」，存量债挡着任何触碰这 4 档的批次 —— 清完这 4 档以后不再卡人。

**边界（派单写死，逐条遵守）**：超长段只插空行、按语义边界（句末 / 分句 / 列举结束）拆段，一个字不改、一个词不换、不删不增；不许截短、不许改成「见 §X」；裸名锚按 D4 补层前缀成全路径，**只补路径、不改句子**。

**机检基线**（`doc_check(mode:"report")`，5 档整档入判）：命中 **34 条 = 锚 10 + 段 24**。

| 档 | 锚命中 | 段命中 | 锚替换（实做） | 空行插入（实做） |
|---|---|---|---|---|
| `docs/desktop/design/E2E-TESTING.md` | 0 | 7 | 0 | 8 |
| `docs/desktop/design/PANEL-READBACK.md` | 0 | 2 | 0 | 3 |
| `docs/vsc/design/VSC-DEBT.md` | 8 | 8 | 12 | 17 |
| `docs/vsc/design/WEBVIEW-INPUT.md` | 2 | 7 | 2 | 34 |
| `docs/core/design/DOC-DISCIPLINE.md` | 0 | 0 | 0 | 0 |
| **合计** | **10** | **24** | **14** | **62** |

**锚替换 14 处 > 门报 10 处（如实记）**：门对同名裸锚去重，只报 10 处。

本席按「同一裸名逐处补全」做满 14 处：`docs/vsc/requirements/PROJECT.md` 的裸名形另有 4 处（改前 `:13` ∥ `:126` ∥ `:127` ∥ `:132`），同形同因 —— 只改门报的那处会留下一笔同形债。

#### 2.15.1 锚（逐处：改前行 · 旧 → 新）

| 处 | 旧（裸名形） | 新 |
|---|---|---|
| `docs/vsc/design/VSC-DEBT.md:4` | 去 `docs/core/design/` 前缀 | `docs/core/design/PROMPT-SYSTEM.md` |
| `docs/vsc/design/VSC-DEBT.md:13` ∥ `:15` ∥ `:125` ∥ `:126` ∥ `:127` ∥ `:131` ∥ `:132` ∥ `:175` ∥ `:177` ∥ `:381` ∥ `:419`（11 处） | 去 `docs/vsc/requirements/` 前缀 | `docs/vsc/requirements/PROJECT.md` |
| `docs/vsc/design/WEBVIEW-INPUT.md:5` | 去 `docs/vsc/` 前缀 | `docs/vsc/requirements/WEBVIEW.md` |
| `docs/vsc/design/WEBVIEW-INPUT.md:81` | 去 `docs/cli/design/` 前缀 | `docs/cli/design/TUI.md` |

#### 2.15.2 拆段（逐处：改前行 · 断在哪 · 空行数）

| 档:改前行 | 断点（语义边界） | 空行数 |
|---|---|---|
| `docs/desktop/design/E2E-TESTING.md:12` | 「不引浏览器二进制。」后（依据句前） | 1 |
| `docs/desktop/design/E2E-TESTING.md:18` | 「域界 = 目录界（§4.1）。」后（登记句前） | 1 |
| `docs/desktop/design/E2E-TESTING.md:22` | 「`mkdtemp` 目录，」后 · 「独立 userData）·」后 | 2 |
| `docs/desktop/design/E2E-TESTING.md:27` | 「再断言其 `=== "ok"`」后 | 1 |
| `docs/desktop/design/E2E-TESTING.md:48` | 「views/sessions.mjs:135`）·」后 | 1 |
| `docs/desktop/design/E2E-TESTING.md:110` | 「∧ enabled）。」后 | 1 |
| `docs/desktop/design/E2E-TESTING.md:118` | 「（返回 `PROJ`——第 6 步）；」后 | 1 |
| `docs/desktop/design/PANEL-READBACK.md:42` | 「relay.mjs:135`）」后 · 「这份记录）。」后 | 2 |
| `docs/desktop/design/PANEL-READBACK.md:70` | 「逐拍命中表）。」后 | 1 |
| `docs/vsc/design/VSC-DEBT.md:21` | 四个主题句间（转义与守卫 / 判据 / 复核路径 / 归册后） | 4 |
| `docs/vsc/design/VSC-DEBT.md:29` | 「形态；」后（动态段归一口径前） | 1 |
| `docs/vsc/design/VSC-DEBT.md:32` | 「等）」后 · 「一条消息）。」后 | 2 |
| `docs/vsc/design/VSC-DEBT.md:99` | 「`panel-chat` /」后 | 1 |
| `docs/vsc/design/VSC-DEBT.md:332` | 「panel-session.mjs`」后 · 「panel-session-write.mjs`」后 | 2 |
| `docs/vsc/design/VSC-DEBT.md:346` | 「环；」后（契约与机判前） | 1 |
| `docs/vsc/design/VSC-DEBT.md:451` | 「零环）。」后 · 「现行四档）。」后 | 2 |
| `docs/vsc/design/VSC-DEBT.md:479` | 「随迁。」后 · 「`injectResponseReminders`）；」后 | 2 |
| `docs/vsc/design/VSC-DEBT.md:496`（复跑） | 「两节点环的扩展）。」后 | 1 |
| `docs/vsc/design/VSC-DEBT.md:498`（复跑） | 「静态可扫）。」后 | 1 |
| `docs/vsc/design/WEBVIEW-INPUT.md:27` | 细则①五条「·」间（判定 / 判据源 / 满队门 / 清除时机 / 提示形） | 5 |
| `docs/vsc/design/WEBVIEW-INPUT.md:34` | 「按计划取批」后 · 「同 CLI 判据）；」后 | 2 |
| `docs/vsc/design/WEBVIEW-INPUT.md:43` | 「贴图降级接点）」后 | 1 |
| `docs/vsc/design/WEBVIEW-INPUT.md:46` | 「idle 先例）。」后 · 「忙锁不变量）」后 | 2 |
| `docs/vsc/design/WEBVIEW-INPUT.md:51` | 「面坐标）·」后 | 1 |
| `docs/vsc/design/WEBVIEW-INPUT.md:77` | 「= ⑤。」后 | 1 |
| `docs/vsc/design/WEBVIEW-INPUT.md:187` | 「归测试层（D2）。」后 · 「idle 直发）；」后 | 2 |
| `docs/vsc/design/WEBVIEW-INPUT.md` 复跑追加 | `:42` 区四处（⓪→① / ①→② / ②→兜底 / 兜底→载体面）· `:63` 区两处 · `:73` 区两处 · `:75` 区两处 · `:79` 区两处 · `:85`–`:93` 区六处 · `:90` 区一处 · `:99` 区一处 | 20 |

**逐处合计**：8 + 3 + 17 + (14 + 20) = **62 处空行**，与 2.15 表的合计格一致。

**首轮 40 处 / 复跑 22 处**：一个原始命中段常是连排多行，首轮只在最强的语义边界插空行，剩下的相邻段仍可能超 300 字 —— 复跑把它露出来，同判据、同手法再拆。

#### 2.15.3 零字改的证据（含它做不到的那一半，如实记）

**做得到的**：每次拆分编辑的 `new_string` = `old_string` + 一个空行，工具回执逐条记「1 处替换」，上下文块显示原句逐字留存；锚替换只把裸名 token 换成全路径 token，句子其余部分不动。

**做不到的（不冒充机证）**：这 4 档在本批前几轮已有未提交改动，`git diff -w` 的差异混入那部分（实测非空白差异 127 行，含前几轮内容），无法把本轮单独隔离出来 —— 所以「整档去空白后逐字节相等」这一读数本轮**没有基线可比，不作声明**。

#### 2.15.4 门读数（逐次，`target = D:\teamcode\thincoder`）

- 首跑：`REFUSED（4 段文字太长）` —— `docs/vsc/design/VSC-DEBT.md:496` · `docs/vsc/design/WEBVIEW-INPUT.md:42` ∥ `:63` ∥ `:90`。
- 二跑：`REFUSED（3 段）` —— `docs/vsc/design/VSC-DEBT.md:498` · `docs/vsc/design/WEBVIEW-INPUT.md:73` ∥ `:99`。
- 三跑：`REFUSED（1 段）` —— `docs/vsc/design/WEBVIEW-INPUT.md:75`。
- 四跑：`REFUSED（1 段）` —— `docs/vsc/design/WEBVIEW-INPUT.md:79`。
- 五跑：`DOC-CHECK GATE: PASS`，`范围：显式 docs 4 档 · 结论：0 段有问题（4 档全清）`。

#### 2.15.5 两条实读残项（父侧已判，本轮未动）

1. `docs/desktop/design/E2E-TESTING.md:219`：表头带「预估行数」列，口径注指向 `checkConfig.lineCounts`（FR42 已退场 = 死指针）。**父侧判：本轮不动** —— 该表主题是「本端有哪些测试档」，不是「本批改了哪些档」；死指针另登台账。
2. `docs/vsc/design/VSC-DEBT.md` 的拆分设计（§12.1 越线登记 · §13 拆点行段）：**父侧判：判留** —— 那是拆分设计，不是批次账。

#### 2.15.6 边界（本轮实际遵守）

只动派单 5 档中的 4 档（`docs/core/design/DOC-DISCIPLINE.md` 零命中、未动一字）· 需求档零改 · 代码零改 · 未加机检 · 未重排节号 · 未删任何句子、判据或坐标 · `_archive` 与批档未触。

### 2.16 第七轮（丙类 12 档纯指针节 · 本席落盘）

**派单** = 父侧本轮令：12 档各删 `## 5. 受影响文件（该子系统）` 整节（标题 + 指针句）。

**判据** = §1.17 一问（主题是不是「这一批改了哪些档」）+ §1.20 逐列判（答「这个机制在哪实现」的先补到机制面，再删）。

**指向物已不存在**：`docs/core/design/CORE-UNIFICATION.md` 全档 grep「受影响文件」零命中。

⇒ 这 12 处指针是本批前几轮删表造成的死锚，不只是「该删」。

#### 2.16.1 逐档（删掉的块 + 该节是否夹坐标）

| 档 | 删的块 | 节内是否夹坐标 |
|---|---|---|
| `docs/core/design/AGENT-LOOP.md` | §5 整节 `:178`–`:199`：标题 + 2 行指针 + 「空响应复位语义（本轮）受影响文件」标题 + 5 行表（现行 `wc -l` ∥ 预计 ∥ 改什么）+ 跨端段 + VSC 对位义务段 | **有 ⇒ 已补**（2.16.2） |
| `docs/core/design/CHECKPOINT.md` | `:62` 标题 + 1 行指针 | 无 |
| `docs/core/design/CONFIG.md` | `:70` 标题 + 2 行指针（第 2 行 = §2.8.1 拆分计划指：`config.mjs` 越软线 · 台账 #1612——债已在册，删指不丢债） | 无新坐标 |
| `docs/core/design/CONSULTATION.md` | `:87` 标题 + 2 行指针（第 2 行 `panel-blocks.mjs`） | 无新坐标 |
| `docs/core/design/CONTEXT-COMPACTION.md` | `:35` 标题 + 1 行指针 | 无 |
| `docs/core/design/I18N.md` | `:40` 标题 + 1 行指针 | 无 |
| `docs/core/design/LOGGING.md` | `:39` 标题 + 1 行指针 | 无 |
| `docs/core/design/MCP.md` | `:45` 标题 + 1 行指针 | 无 |
| `docs/core/design/MEMORY.md` | `:71` 标题 + 2 行指针（第 2 行「核内落点行数 → §2.8.1」，`index-bin.mjs` ∥ `index-discover.mjs` #137 在册） | 无新坐标 |
| `docs/core/design/SESSION.md` | `:58` 标题 + 1 行指针 | 无 |
| `docs/core/design/TRACES.md` | `:38` 标题 + 1 行指针 | 无 |
| `docs/core/design/WORKSPACE.md` | `:61` 标题 + 2 行指针（第 2 行「核内落点行数 → §2.8.1」，`ledger-surface.mjs` #174 在册） | 无新坐标 |

12 档全部整节删；`## 5` 留空号不重排（§1.10）。

`docs/core/design/WORKSPACE.md` 删后档止于 §4——该档原无 §6 机制面，属存量形态，本轮未造节。

#### 2.16.2 AGENT-LOOP 坐标补回（§1.20 唯一命中）

原 §5 表列「文件 ∥ 现行（`wc -l`）∥ 预计 ∥ 改什么」，其中「改什么」列与两条尾段答的是「这个机制在哪实现」——随表删会带走状态。

**已在盘、未复写（D2 逐条实读命中）**：

`isSubstantiveResponse` 定义 `thincoder-core/agent/completion.mjs:26` · 判空读点 `:44` · 清零点 `turn-loop.mjs:153` · 核侧 `if (!resume)` 门 `run-start.mjs:109`/`:134`——全在 `docs/core/design/AGENT-LOOP.md` §6.5（`:382`–`:392`）。

**补回 2 条**（新落 `docs/core/design/AGENT-LOOP.md:393`–`:394`）：

- 「端侧对位坐标（单源）」：`thincoder-vscode/src/agent/setup.mjs:58` · `agent-state.mjs:37`（`resetRunState` 函数头 `:27`）· 与核 `agent.mjs:78` 初值同值 · 核内判空与递增各一处（`completion.mjs:44` ∥ `:52`）。
- 「VSC『续跑不清零』靠结构（装配对位义务）」：`resetRunState` 只在链首段装配时被调用（`thincoder-vscode/src/extension/panel-turn-loop.mjs:214` 的 `if (!agent)` 门内）。

原句「本笔零跨端改动」属账，未迁。

#### 2.16.3 存量清账（拆段 · 锚 0）

首轮 `doc_check(mode:"report")`（12 档整档入判）命中 **8 段**，全为存量超长段，锚命中 0。

命中处：`docs/core/design/CHECKPOINT.md:134` ∥ `:142` · `docs/core/design/CONFIG.md:149` · `docs/core/design/MCP.md:79` ∥ `:101` ∥ `:104` ∥ `:147` · `docs/core/design/WORKSPACE.md:47`。

首轮修 = 按语义边界插空行 **11 处**，一字未改。

二轮 gate `REFUSED（4 段）`：`docs/core/design/CHECKPOINT.md:150` · `docs/core/design/CONFIG.md:149` · `docs/core/design/MCP.md:112` ∥ `:152`——切分后相邻段仍越线，复跑露出。

后继修 = 再插空行数处。**末次门读数 = 本条落盘回执的 `[doc-check gate]` 行**。

**零字改的边界（如实）**：拆段编辑的 `new_string` = `old_string` + 一个空行，工具回执逐条记「1 处替换」并回显上下文块；无句子增删改写。

#### 2.16.4 未清（如实记 · 请父侧裁）

**（a）`docs/core/design/CONTEXT-COMPACTION.md` §6.16.9「受影响文件表（行数读数单源）」**（删 §5 后起于 `:603`）。

列形 = `档 ∥ 现况 ∥ Δ ∥ 改动要点`，带行数口径注 ⇒ 主题就是「本批改了哪些档」，同判据命中。

**未动的两个理由**：

① 「改动要点」列夹机制坐标（`enforceContextFit` `run-stages.mjs:158` · `_overflowRetried` · `SUMMARY_TOKEN_ESTIMATE` `token-window.mjs:43`），逐列判须逐行读 29 行，本轮预算不足。

② §6.16.8 ∥ §6.14 等 5 处以它为读数源（`:315` ∥ `:327` ∥ `:559` ∥ `:585` ∥ `:596`），删表须同轮改指。

**下一轮做法**：先逐行判「改动要点」是否已在 §6 机制面，再删表 + 改 5 处指句。

**（b）`docs/core/design/SESSION.md:1036` 起「尺度结论（行数口径 = `wc -l`）」块**（`:1036`–`:1047`）。

内容 = 现读行数 + 档位结论 + 拆点候选 ∥ 触发条件。

**含工程债**：拆点候选 = 启动屏族 ∥ 后台索引族外提；触发条件 = 越 500 硬限 ∥ 下次实质改动。

按 §1.9 须父侧先入台账（`trigger=归批`）再删——**未动一字**。

**（c）12 档档头 `:4` 的「…受影响文件总表…」**：`docs/core/design/CORE-UNIFICATION.md` 已无该表（全档 grep 零命中）⇒ 成死指。

**未改**：它指另一档的内容、不是本档已删表（同 §2.13.2 判例），且改它要动 `docs/core/design/CORE-UNIFICATION.md`（射程外）。

#### 2.16.5 边界

只动派单 12 档 · 需求档零改 · 代码零改 · 未加机检 · 未重排节号 · 判据阈值与机制正文未删。

`_archive` ∥ `batches` ∥ `docs/core/design/DOC-DISCIPLINE.md` ∥ `docs/core/design/ADVISOR-CONVERGENCE.md` 未触。

#### 2.16.6 回合如实记

15 回合上限内做完 12 档删节 + 11 处拆段；二轮 gate 拒后又在额度外续做拆段——**「先落盘再修」应更早执行**，本席把删节与拆段串行做了。

#### 2.16.7 读数更正（2.16.3 的处数）

2.16.3 写「首轮修 11 处 / 后继修数处」——**逐条回执核过，实数不符**，照实更正。

**首轮（一个 `edit` 批，10 条命中 9 条）**：`docs/core/design/CHECKPOINT.md` 5 处 · `docs/core/design/MCP.md` 3 处 · `docs/core/design/WORKSPACE.md` 1 处 = **9 处**。同批的 `docs/core/design/CONFIG.md` 一条是空操作（old = new），未插入。

**后继**：`docs/core/design/CONFIG.md` 1 处 · `docs/core/design/MCP.md` 2 处 · `docs/core/design/CHECKPOINT.md` 2 处 = **5 处**。

**合计 14 处空行插入**，跨 4 档；其余 8 档本轮零存量命中。

**末次门读数（本条落盘回执）**：`DOC-CHECK GATE: PASS · 范围 14 档`。

### 2.17 第八轮（末轮 · 2.16.4 残 3 项 · 本席落盘）

**判据** = §1.17 一问 + §1.20 逐列判 + §1.22（档位结论 / 读数 = 账，阈值 = 规矩）。

派单 3 项（(a) (b) (c)）全部落盘；门首跑即 PASS。

#### 2.17.1 (a) `docs/core/design/CONTEXT-COMPACTION.md` §6.16.9 表整块退场（−44 行）

**删的块**（改前行号）= `:603`–`:639`：节标题 + 行数口径注 + 30 行表（列 = 档 ∥ 现况 ∥ Δ ∥ 改动要点）。

**连带删**（同节主题即批次账）：

- `:641`–`:642` 本批验收跑法（含两条 `node --test` 定向跑法）。
- `:643`–`:644` 拆分立账 —— 与 §6.16.8 `:596` 尺寸账逐字重复，D2 单源。
- `:649` 体量档结论 —— 「读数 = 本节上行」表删即成死指。
- `:651` 不触面（批边界）。

**照留**：`:645`–`:647` config.mjs 拆分方案（拆点 + 迁入档 + ≤500 判据 = 机制状态与债）· `:650` CLI 侧无独立实现面（机制句）· §6.16.8 全节 · §6.16.10 用例表 · §6.16.11–12。

**节号**：6.16.9 留空号不重排（§1.10）—— 现 §6.16.8 直接接 §6.16.10。

#### 2.17.2 (a) 逐列判「改动要点」：需新迁 0 条（已在机制面 · D2 不复写）

下表「已在盘」列 = 删前行号，逐条实读命中。

| 格子里的坐标 | 已在盘（单源位置） |
|---|---|
| `enforceContextFit`（`run-stages.mjs:158`） | `:803` §6.17「守卫面不动」· `:927` 三问块 `existing but 抽出` · `:989` §6.17.1 链三 |
| `_overflowRetried` run 起点复位（`agent/setup.mjs` `:65-66`） | `:993` §6.17.1「死循环守卫」，逐字含同处 `:65-66` |
| `SUMMARY_TOKEN_ESTIMATE`（`token-window.mjs:43`）+ 加 `export` | `:792`「常量单源 = `thincoder-core/token-window.mjs:43`…本门复用并导出该常量」 |
| 四面净判（`core.mjs:257-260` ∥ `anthropic:212-214` ∥ `google:123-125` ∥ `responses:232-234`） | `:862` §6.17「发送面净判」四面逐处 |
| `requestBudget` 8 字段单源 | `:54` · `:277` · `:705` |
| `_tok` / `_tokRatio` 初值不落 `agent/setup.mjs` | `:893` §6.17.1「初值落 `agent.mjs:76`」 |
| `estimateSample` 写 / 读两面 | `:976`（`session.mjs`）· `:977`–`:978`（`applySession` 四条校验） |
| `tokenKey` / `recordTokenSample` / 样本读写 | `:891` · `:924` · `:925` · `:926` |
| VSC 端四处（`agentState` / `saveLines` / `applySlotSessionState` / 装配第三参 `provider`） | `:980`–`:981` §6.17.1 链二端面逐处 |
| 宿主工具 `ide` 改名（D-CC26） | `:555`–`:559` · `:1054` |
| `cmd-config.mjs` 四子菜单迁 + 四处读点留脊柱 | `:736` §6.18 |
| `compactThresholdHint` | `:741` · `:743` · `:747` |
| `ASCII_CHARS_PER_TOKEN` / `ESTIMATOR_VERSION` / `_estimateSingle` | `:965` · `:970` · `:921`–`:922` |
| `errors.mjs` 词表 `:122-123` / 三实数 | `:917` · `:864` |
| `assistantToolCallMessage`（D-CC22） | `:245` · `:1050` |
| `responses-request.mjs` 只读 `maxTokens` | `:667`（8 字段表的消费面列逐档列名，含该档） |
| 用例落哪档（11-6–11-9 · 故事 1 三行） | `:847` 已落在 `test/integration/context-overflow-guard.test.mjs` · `test/RTM.md:16` 行指向 `test/integration/anthropic-tool-roundtrip.test.mjs` |

结论：**无一条需新建坐标句** —— 这一批删掉的是「计划 / 读数」，不是坐标。

#### 2.17.3 (a) 5 处改指逐处

| 改前行 | 旧（摘） | 新（摘） |
|---|---|---|
| `:315` | （`context.mjs` 接线已落——行数读数 = §6.16.9 单源） | （`context.mjs` 接线已落） |
| `:327` | 行数口径 = `wc -l`；两档读数与 Δ = §6.16.9 单源。单测档随批存放 | 单测档随批存放 |
| `:559` | ；行数读数 = §6.16.9 单源；行为面零改） | ；行为面零改） |
| `:585` | **6.16.8 模块拆分与行数预算（行数读数 = §6.16.9 单源 · 500 软线）** | **6.16.8 模块拆分与行数预算（500 软线）** |
| `:596` | 拆后实读（读数见 §6.16.9） | 拆后实读 261 |

改后全档 `6.16.9` ∥ `受影响文件` ∥ `行数口径` 三串 grep 零命中（实跑）。

#### 2.17.4 (b) `docs/core/design/SESSION.md` 尺度结论块退场（−19 行 · 5 处）

**先查后删（§1.9）**：`#1957` 在盘 —— `kind=tech_todo` · `status=待讨论` · `task_book` = 本批。

其题头（摘）：「`docs/core/design/SESSION.md` 的「尺度结论」块拆点登记：启动屏族外提，触发 = 越 500 行」。

⇒ 债已入账，删块不丢债。

**移除 5 块**（改前行号）：

- `:1032`–`:1044` —— 派单点名块。派单写「`:1036` 起」，实读块首 = `:1032`「尺度结论（行数口径 = `wc -l`）：」。
- `:930`–`:931` · `:897` · `:850`–`:851` · `:448` —— 派单外同族存量。

**后 4 处的判据** = §1.22：「这几档都在线内，无拆分计划」是**对一批文件的判断** ⇒ 账。

逐块读过，无一处带拆分计划或债（均「承既有形态」「无档位拆分需要」）⇒ 不受 §1.9 约束。

**逐列判（坐标）**：块内坐标类内容两条，均已在盘。

- `session-slot-verify.mjs` 住 `:19`（模块清单）· `:817`（`:99` 回写点）· `:970`（新档 + 调度形）。
- `backgroundIndex` 已函数化 + 拆点候选 + 触发条件 = `#1957` 正文。

⇒ 无坐标需补。

**断指随删**：`:970` 「（新档 `thincoder-core/session-slot-verify.mjs`——落点详下「落点与测试」段）」。

该段名全档 grep 零命中 —— 改前即死指，点不到任何东西 ⇒ 删括号内后半句，留「（新档 `thincoder-core/session-slot-verify.mjs`）」。

改后 `尺度结论` ∥ `行数口径` ∥ `现读 **322` ∥ `落点与测试` 四串 grep 零命中（实跑）。

#### 2.17.5 (c) 12 处档头逐处（同一句，每档一处）

旧 → 新：只删 token，句其余部分不动。

「… / 关键决策 / **受影响文件总表** / 验收回指 / …」→「… / 关键决策 / 验收回指 / …」

逐档（均在 `:4`），12/12 回执各 1 处命中：

- `docs/core/design/AGENT-LOOP.md` · `docs/core/design/CHECKPOINT.md` · `docs/core/design/CONFIG.md`
- `docs/core/design/CONSULTATION.md` · `docs/core/design/CONTEXT-COMPACTION.md` · `docs/core/design/I18N.md`
- `docs/core/design/LOGGING.md` · `docs/core/design/MCP.md` · `docs/core/design/MEMORY.md`
- `docs/core/design/SESSION.md` · `docs/core/design/TRACES.md` · `docs/core/design/WORKSPACE.md`

`docs/core/design/CORE-UNIFICATION.md` 未触（派单明令）。

#### 2.17.6 存量清账

**零处**：门首跑即 PASS，12 档既无超长段也无裸名锚 ⇒ 本轮无拆段、无补锚（不造空跑的自证）。

#### 2.17.7 门读数

```
DOC-CHECK GATE: PASS
范围：显式 docs 12 档
结论：0 段有问题（12 档全清）
```

`target = D:\teamcode\thincoder`；首跑即 PASS，无 REFUSED 轮。

#### 2.17.8 残留（实读 · 请父侧裁）

1. `docs/core/design/CONTEXT-COMPACTION.md:596` §6.16.8「尺寸账」仍带本批读数（拆前 ≈328 · 迁出 110 · 新增 43 · 拆后 261 · 不分拆 449 · 余量 51）。

   按 §1.22 属账；本轮按派单只改指、未删（派单点名 = §6.16.9 表 + 5 处改指）。

2. 同档 `:603`–`:605` config.mjs 拆分方案仍带「预测 ≈418，余量 82 行」「只剩 ≈486（余量 14 行）」—— 读数属账。本席判为「拆分决策的余量依据」照留。

3. 同档 `:607`「本批不增删 `tool-docs/` 档族（档数按目录实读——2026-10-28 = 54 档）」—— 批动作 + 时点读数，属账；照留。

4. `§6.16.9` 现为空号 —— 按 §1.10 留空号，未重排。

#### 2.17.9 边界（本轮实际遵守）

只动派单 12 档（(a) 1 档 · (b) 1 档 · (c) 12 档）· `docs/core/design/CORE-UNIFICATION.md` 未触 · 需求档零改 · 代码零改 · 未加机检 · 未重排节号。

判据强度 300 / 500 / 800 一字未动（`≤500 软线` 句在 `:605` ∥ `:667` 一带照留）· `_archive` ∥ `batches` 未触。

#### 2.17.10 过程如实记（按行号删 · 不信回执结论）

删除全部按**行号区间**执行。回执的 context 块按「删后位置」回显，与本席预期编号对不上 —— 先误以为删错。

**核法 = 直接读盘 + 行数差核算**，不拿回执当结论：

- `docs/core/design/CONTEXT-COMPACTION.md` −44 行（38 + 2 + 2 + 1 + 1）。
- `docs/core/design/SESSION.md` −19 行（13 + 2 + 1 + 2 + 1）。

两数与删除清单逐项相等。保留块逐块实读在位：config 拆分 ∥ CLI 侧 ∥ 用例表 S1–RG4 ∥ §6.16.11–12 ∥ §6.25 验收回指与边界 ∥ §6.26。

**落到操作**：行号区间删除之后，一律以「读盘 + 行数差」验收，不读回执的 context。

### 2.18 第九轮（三处收尾 · 本席落盘）

**派单** = 父侧逐条令（`#29` 上抛 4 条中判掉的 3 条）：① 删读数留判据 · ② 留决策删余量 · ③ 改规矩形。**派单 3 处 / 1 档，全部落盘；门首跑即 PASS。**
**判据** = 父侧本轮令 ∥ §1.20 逐列判（答「机制在哪实现」= 状态 · 答「这批落了几行」= 账）∥ §1.22（读数 = 账 · 阈值 = 规矩）。

#### 2.18.1 ① `docs/core/design/CONTEXT-COMPACTION.md:596` §6.16.8 尺寸账

**改前逐字（`:596` + `:598` 两处，中间一空行）**：

> **尺寸账**：拆前 ≈328（回推：拆后实读 − 43 + 110）→ 迁出 110 → 新增 43 → 拆后实读 261。**若不分拆（推算，基线 = 拆后实读 261，2026-10-19）= 449**——未越 500 软线（余量 51）。
>
> ⇒ 拆分依据 = **职责边界**（`token-window.mjs` = 计量 / 窗口 / 边界单族；`context.mjs` 只留编排与形态接线）+ 余量（不分拆 51 vs 拆后 239），**不以越线为据**。

**改后逐字（现 `:597`，整行 `:596` 已删）**：

> ⇒ 拆分依据 = **职责边界**（`token-window.mjs` = 计量 / 窗口 / 边界单族；`context.mjs` 只留编排与形态接线），**不以越线为据**——不分拆的形态同样在 500 软线内。

**按什么判**：`≈328 / 110 / 43 / 261 / 449 / 余量 51 / 239` 逐个数都是在答「这个档现在多少行 / 本批动了几行」⇒ 读数，删。
「拆分以职责边界为据、不以越线为据」是在答「凭什么这么拆」⇒ 判断句，留，且去掉数值后仍独立可读（父侧令：改完那一句要能独立读懂）。
「拆后实读 261」属父侧点名的两义句，**本席判为读数删** —— 依据：它答的是那一刻的行数；且盘上现值已变（`thincoder-core/context.mjs` 本轮实读 293 行），旧数已过期 ⇒ 留着就是一份没人回来改的账。

#### 2.18.2 ② `docs/core/design/CONTEXT-COMPACTION.md:603`–`:605` config 拆分方案

**改前逐字（3 行）**：

> - **`config.mjs` 越 500 软线（既有事实）——拆分已定：两块外提**：`thincoder-core/config-defaults.mjs`（`DEFAULTS` 默认值表本身）∥ `thincoder-core/config-normalize.mjs`（加载期归一 / 清洗纯函数族 + 两枚警告旗）；
>   `config.mjs` 留公共面 + `loadConfig` 编排 + 请求预算算式族 + 百炼 thinking 解析 + MCP 重载，并以 re-export 维持全部导出名不变（34 档导入点零改）。
>   判据 = 实施后 `config.mjs` ≤ 500 软线（预测 **≈418**，余量 82 行）。两块同拆的理由：单拆归一族只剩 ≈486（余量 14 行），而 `DEFAULTS` 每加一键 +1 行、`loadConfig` 每加一归一分支 +3~5 行 ⇒ 下一批再越线。

**改后逐字（现 `:602`–`:604`）**：

> - **`config.mjs` 拆分（已落）——两块外提**：`thincoder-core/config-defaults.mjs`（`DEFAULTS` 默认值表本身）∥ `thincoder-core/config-normalize.mjs`（加载期归一 / 清洗纯函数族 + 两枚警告旗）；
>   `config.mjs` 留公共面 + `loadConfig` 编排 + 请求预算算式族 + 百炼 thinking 解析 + MCP 重载，并以 re-export 维持全部导出名不变（34 档导入点零改）。
>   判据 = 实施后 `config.mjs` ≤ 500 软线。两块同拆的理由：只拆归一 / 清洗族，`config.mjs` 剩下的面仍贴着该线，而 `DEFAULTS` 每加一键 +1 行、`loadConfig` 每加一归一分支 +3~5 行 ⇒ 下一批再越线。

**按什么判**：

- 派单两处数值短语 —— `（预测 **≈418**，余量 82 行）` 与 `只剩 ≈486（余量 14 行）` —— 逐字删；拆分方案（两块外提 / 各自职责 / re-export 保导入面）一字未动。
- 「而 `DEFAULTS` 每加一键 +1 行 · `loadConfig` 每加一归一分支 +3~5 行」照留：它答的不是「现在多少」，是「增长速率 ⇒ 何时再越线」，属拆分决策的规矩面。
- **一处超出派单字面，如实记并请裁**：`越 500 软线（既有事实）——拆分已定` → `拆分（已落）`。理由 = 盘上状态已经变了，原句今天是**假话**：`thincoder-core/config.mjs` 本轮实读 **463 行**，`thincoder-core/config-defaults.mjs`（101 行）与 `thincoder-core/config-normalize.mjs`（110 行）两块已在盘，`config.mjs` 已 import 并 re-export 二者（`config.mjs:34` 逐字 `import { DEFAULTS } from "./config-defaults.mjs"`、`:35` `export { DEFAULTS }`；`:171`–`:177` 归一族的 import）。删数字却留一句「越线（既有事实）」，等于把新的假话留在原地 —— 这属父侧的「别扩」与状态档「只写真话」相抵，本席取后者并在此点名。

#### 2.18.3 ③ `docs/core/design/CONTEXT-COMPACTION.md:607` `tool-docs/` 一句

**改前逐字**：

> - **CLI 侧无独立实现面**：`context` 工具经核装配自动可见（§6.16.6 注册单源）；本批不增删 `tool-docs/` 档族（档数按目录实读——2026-10-28 = 54 档）。

**改后逐字（现 `:606`）**：

> - **CLI 侧无独立实现面**：`context` 工具经核装配自动可见（§6.16.6 注册单源）。工具档面随注册在册——`context` 的说明住 `thincoder-core/tool-docs/context.md`（三操作逐条），`tool-docs/` 档族的增减随工具面走；档数按目录实读，零增删的判据见 §6.16.10 RG4。

**按什么判**：原句两样都是账 —— 「本批不增删」是批动作，「2026-10-28 = 54 档」是时点读数。改成现行规矩：这个面到底管不管 `tool-docs/` 增删 —— **管，且跟着工具注册面走**，该工具的说明档就在档族里（`thincoder-core/tool-docs/context.md` 在盘，7 行，逐条列 `stats` / `prune` / `compact` 三操作；`git log` 最近一次改动 = `d7f7612b`，早于本批 ⇒ 不是本批新增）。零增删的基线不落本节，指 §6.16.10 RG4（单源，判据面）。

#### 2.18.4 残留（实读 · 请父侧裁）

1. **同节同族读数仍在**：`docs/core/design/CONTEXT-COMPACTION.md:587`–`:595` 带 `迁入 110 + 新增族 ≈78` · `:588`–`:592` 三区间 `20 / 22 / 68 = 110` 行 · `:595` `收缩后新增 ≈43 行` 及分项 `1 / ≈6 / ≈8 / ≈8 / ≈20`。按 §1.22 属读数；**派单只点 `:596`，本席未动**（一处一改，别扩）。
2. **产品码死指（本席无写权）**：`thincoder-core/config.mjs:32` 与同档 `:171` 两处注释都点名本档的 §6.16.9 —— 前者在「默认值表本体已迁 `config-defaults.mjs`」句尾的括注里、后者在「归一 / 清洗族已迁 `config-normalize.mjs`」句尾的括注里，两处都写成**裸档名 + `§6.16.9 —— C1`**。`§6.16.9` 已于第八轮删成空号（2.17.1）⇒ 两处注释是死指（§1.19）；裸名形本身也不合 D4（指针须全路径）。注释在产品码，本席不动，请父侧另派。
3. **`§6.16.9` 空号**仍在（2.17.8 条 4），按 §1.10 留空号不重排；本档其余处对 `6.16.9` 零引用（本轮 grep 实跑）。

#### 2.18.5 门读数

```
DOC-CHECK GATE: PASS
范围：显式 docs 1 档 · 结论：0 段有问题（1 档全清）
```

`target = D:\teamcode\thincoder`；首跑即 PASS，无 REFUSED 轮。

#### 2.18.6 边界与 `identical`

- 只动 `docs/core/design/CONTEXT-COMPACTION.md` 一档 4 处编辑（① 一处占两行 · ② 一句 · ③ 一句 + 其半句收窄）· 需求档零改 · 代码零改 · 未加机检 · 未重排节号。
- 判据阈值一字未动：`:585` 标题 `500 软线` · `:594` `PRUNE_MIN_TOKENS` 门槛 · `:604` `≤ 500 软线` 判据 · 同档 `:56`–`:58` / `:139` 的窗口余量口径（另一族语义，未触）。
- **`identical` 不适用，不是拿不出**：本轮无拆段、无纯空白改动 —— 4 处全是语义改写（删词、换句），故没有「去空白后逐字节相等」这个读数可报。不造假自证。
- 行数：`1018 → 1017`（① 净 −1；②③ 均等行替换）。

### 2.19 第十轮（`:587`–`:595` 读数退场 · 本席落盘）

**派单** = 父侧逐字：「最后一处：`:587`–`:595` 那一段读数，同 §1.22 清掉。」**派单 1 处块 / 1 档，全部落盘；门首跑即 PASS。**

**判据** = §1.22 ∥ 父侧本轮三条：① 答「现在多少 / 本批动几行」= 读数，删；② 答「凭什么这么拆 / 拆成什么结构」= 状态，留，且去数后独立可读；③ 留「已落 / 已拆」这类话之前，先核盘上是不是真的已落。

#### 2.19.1 逐处（档:行 · 改前逐字 → 改后逐字 · 判据）

**① `docs/core/design/CONTEXT-COMPACTION.md:587`**

- 改前：`- **新档 `thincoder-core/token-window.mjs`**（**已落** · 迁入 110 + 新增族 ≈78）：自 `context.mjs` **逐字迁出**计量 / 窗口 / 边界族，**迁出 = 110 行**（三区间逐段可核算）：`
- 改后：`- **新档 `thincoder-core/token-window.mjs`**（**已落**）：自 `context.mjs` **逐字迁出**计量 / 窗口 / 边界三族，三族现以本档为单源：`
- 判据：`迁入 110` · `新增族 ≈78` · `迁出 = 110 行` · `（三区间逐段可核算）` 四样全在答「本批动了几行」⇒ 读数，删。「迁出的是哪三族、单源在哪一档」答结构 ⇒ 留。

**② `:588`（现 `:589`）**

- 改前：`  ① 计量面 `:17-36`（20 行——IMAGE_TOKEN_ESTIMATE + `estimateTokens`）；`
- 改后：`  ① 计量面：`IMAGE_TOKEN_ESTIMATE` + `estimateTokens`；`
- 判据：`20 行` 是读数，删。`:17-36` 是**拆前旧档**的区间——今日 `thincoder-core/context.mjs` 293 行，该区间落在 import / 常量区，已不是原句所指的东西 ⇒ 留着即错坐标（D8），一并删。族内成员 = 结构，留。

**③ `:590`（现 `:591`）**

- 改前：`  ② 尾族 `:38-59`（22 行——KEEP_HEAD 头注 + `TAIL_BUDGET_FRACTION` / `SUMMARY_TOKEN_ESTIMATE` / `TAIL_FLOOR_MESSAGES` + `keepTailSize` + `tailBudgetTokens`）；`
- 改后：`  ② 尾族：`KEEP_HEAD` 头注 + `TAIL_BUDGET_FRACTION` / `SUMMARY_TOKEN_ESTIMATE` / `TAIL_FLOOR_MESSAGES` + `keepTailSize` + `tailBudgetTokens`；`
- 判据：同 ②（`22 行` 读数 · `:38-59` 旧档死坐标 ⇒ 删；成员清单留）。

**④ `:592`（现 `:593`）**

- 改前：`  ③ 切分与配对修复族 `:95-162`（68 行——`splitHistory` 头注 + `splitHistory` + `repairedTailStart` + `tightenTailByBudget`）——三区间和 = 20 + 22 + 68 = **110**（`wc -l` 语义）。`
- 改后：`  ③ 切分与配对修复族：`splitHistory` 头注 + `splitHistory` + `repairedTailStart` + `tightenTailByBudget`。`
- 判据：`68 行` 与 `:95-162` 同上删；`三区间和 = 20 + 22 + 68 = 110（wc -l 语义）` 整句是纯读数相加 ⇒ 整句删（含 `wc -l` 口径注）。

**⑤ `:594`（现 `:595`）**

- 改前：`  **新增族 ≈78**：上下文用量单源函数（6.16.4）· 陈旧工具输出合格集（6.16.3——含门槛常量 `PRUNE_MIN_TOKENS`，与合格集同住本档）· 状态行百分比（与状态行同式）。**零 import 环 / 零回指**（只依赖 `provider/rate.mjs` 与 `config.mjs`——`context.mjs` 单向消费）。`
- 改后：`  **同批新增族**：上下文用量单源函数（6.16.4）· 陈旧工具输出合格集（6.16.3——含门槛常量 `PRUNE_MIN_TOKENS`，与合格集同住本档）· 状态行百分比（与状态行同式）。**零 import 环 / 零回指**（只依赖 `provider/rate.mjs` 与 `config.mjs`——`context.mjs` 单向消费）。`
- 判据：`≈78` 是读数，删（标题改「同批新增族」）。三族清单与「零 import 环 / 零回指」答「拆成什么结构 / 凭什么这么拆」⇒ 一字未动地留。

**⑥ `:595`（现 `:596`）**

- 改前：`- **`context.mjs` 收缩后新增 ≈43 行**（分项：estimateTokens 再导出 1 · force / focus 接线 ≈6 · 焦点块构造 ≈8 · anchor 取值 ≈8 · `pruneStaleToolOutputs` 应用面（stub 文案 + 原位替换 + 回执）≈20）。`
- 改后：`- **`context.mjs` 收缩后新增的面**：`estimateTokens` 再导出 · `force` / `focus` 接线 · 焦点块构造 · anchor 取值 · `pruneStaleToolOutputs` 应用面（stub 文案 + 原位替换 + 回执）。`
- 判据：`≈43 行` 与分项 `1 / ≈6 / ≈8 / ≈8 / ≈20` 六个数字全在答「这一批各块落了几个行」⇒ 读数，删；五个「面」的清单答「新增了什么结构」⇒ 留，去数后独立可读。

#### 2.19.2 盘上重核（父侧第 ③ 条 · 留「已落」前先核）

逐条实读，全部命中：

- 三族确在 `thincoder-core/token-window.mjs`：`estimateTokens:18` · `keepTailSize:46` · `tailBudgetTokens:55` · `splitHistory:67` · `repairedTailStart:92` · `tightenTailByBudget:117`；常量 `IMAGE_TOKEN_ESTIMATE:15` · `KEEP_HEAD:36` · `TAIL_BUDGET_FRACTION:43` · `TAIL_FLOOR_MESSAGES:45` · `PRUNE_MIN_TOKENS:262` · `collectStaleToolOutputs:269`。
- 「零 import 环 / 零回指」为真：本档 import 只有 `:12` `import { estimateText, ESTIMATOR_VERSION } from "./provider/rate.mjs"` 与 `:13` `import { providerSpec, resolveCompactThreshold } from "./config.mjs"`。
- 「`estimateTokens` 再导出」为真：`thincoder-core/context.mjs:283` `export { estimateTokens }`；消费实证 `thincoder-cli/scripts/verify-compress.mjs:7` `import { compressIfNeeded, estimateTokens } from "@thincoder/core/context.mjs"`。
- ⇒ 「**已落**」句为真，本轮没有把数字删掉、留下假话（上一轮 `config.mjs` 那句的同款坑，这轮未踩）。

#### 2.19.3 射程内清零读数（逐串 grep 实跑）

`迁入 110` · `新增族 ≈78` · `迁出 = 110 行` · `20 + 22 + 68` · `收缩后新增 ≈43` · `≈6` · `≈8` · `≈20` · `wc -l 语义` —— 九串在本档全部 `false`。

（`110` 单独 grep 仍有两处命中：`:869` `:110` 与 `:937` `:110`，都是**行号坐标**不是读数，未动。）

#### 2.19.4 未动（按派单边界）

`:585` 节标题 `500 软线` · `:598` 拆分依据句 · `:604`–`:605` `config.mjs` 拆分方案与 `≤ 500 软线` 判据 —— 三处一字未动；300 / 500 / 800 判据一条未删；节号未重排（§6.16.8 原位）；产品码零改（`#1958` 两处注释未碰）。

#### 2.19.5 门读数

```
DOC-CHECK GATE: PASS
范围：显式 docs 1 档 · 结论：0 段有问题（1 档全清）
```

`target = D:\teamcode\thincoder`；首跑即 PASS，无 REFUSED 轮。行数 `1,017 → 1,018`（9 行块换 10 行，净 +1 = 首段与 ① 之间补一空行；无语义增删之差）。

#### 2.19.6 边界与 `identical`

- 只动 `docs/core/design/CONTEXT-COMPACTION.md` 一处块（`:587`–`:595`）· 需求档零改 · 代码零改 · 未加机检 · 未重排节号。
- **`identical` 不适用**：本轮是语义改写（删数、改标题措辞），不是拆段，没有「去空白后逐字节相等」这个读数可报。不造假自证。
- 残留：**无新增** —— 射程内读数已清零（2.19.3 实跑），射程外未动。

### 2.20 评审轮 1 处置（逐条 · 本席落盘）

**评审轮 1 = `changes-required`（🔴 × 1 · 🟡 × 7 · 🔵 × 2）。** 父侧裁：`#1`（`docs/core/requirements/METHODOLOGY.md:84` F-R24a 的数值来源指向已删条）= 他自己的笔、已改；改早了一轮、改完没回头重核。

**本席 9 条：⑤ ⑥ ⑦ ⑩ ② ③ ④ ⑧ ⑨。** 落盘前预检 = 三档 `doc_check`（报告态）命中 0 条（锚 0 · 文字太长 0 · 行太长 0）⇒ 追加不被存量债挡。

#### 2.20.1 ⑤ 读数退场 —— `docs/core/design/DOC-DISCIPLINE.md:649`

- 改前逐字：`- `scripts/doc-check-anchors.mjs`（**322** 行 · 本节 +2）：**不拆**——理由 = 零结构改（左界守卫补 `@` 单点）+ ≤500 软线内；**触发 = 再度增厚**（结构改或越硬限时另批执行）。`
- 改后逐字：`- `scripts/doc-check-anchors.mjs`：**不拆**——理由 = 零结构改（左界守卫补 `@` 单点）+ ≤500 软线内；**触发 = 再度增厚**（结构改或越硬限时另批执行）。`
- 档位结论 ∥ 不拆理由 ∥ 触发条件一字未动；抽取候选线（`:651`）与判据块（`:655`）未动。

**超出派单字面一处，如实记**：同节 `:653` 的 `**读数口径**：行数 = as-of；软线 = 500（咨询层）· 硬限 = 800（仓 `AGENTS.md` 口径）。` 删去 `行数 = as-of；` 半句。

理由 = 本节唯一的读数就是被删的那条，口径句随对象消失（判据 = §1.4「口径注一并删」+ D8）。**软线 500 ∥ 硬限 800 两个阈值一字未动。**

#### 2.20.2 ⑥ U-5 补条 —— `docs/core/design/DOC-DISCIPLINE.md:1574`

新增，落在 U-5 的 why（`:1570`）与判面（`:1572`）之后，逐字：

> **U-5 补条（删读数后同句断言按盘重核）**：删掉一句里的读数之后，同句剩下的断言（「已落」「越线」「在盘」「零改」这类）必须**按盘逐条重核**，不成立即同轮改写。
>
> **为什么**：数字带时刻——它写下的那一刻才准；删掉数字却把句子留着，等于把那一刻的断言升格成现值断言，读者看不见任何「这是旧的」的痕迹。删读数是为让状态档只说真话，留下未核的断言就把假话换了个位置。

**⚠️ 先例坐标未写进档 —— 偏离派单，请父侧裁。** 派单令「先例坐标写批档 §2.18.2 / §2.19.2」。

而本档 **D4 细则二**逐字「规范档**禁引**批档及其单元测试档（**含历史行**）· 存量无豁免（阈值 = 0）」，§4.5.4 又写「例外三条之外**不得再有例外**」⇒ 写进去即造一条本档自己判红的新违规。

故 why 写成**自足句**（D9「why 须自足，不以『见某档』代替引证」），**先例留在本条批档**（即上面 §2.18.2 ∥ §2.19.2，读者在批档内可查）。要改这个口径请裁 —— 改了要连带撤 D4 细则二。

#### 2.20.3 ⑦ CORE-UNIFICATION 列定义明裁 —— `docs/core/design/CORE-UNIFICATION.md:273` ∥ `:275`

`:271` 口径注之后新增一段，逐字：

> **列定义保留、数值不落表**：该列只说「这三侧的尺寸档位要判」，读数按上条口径**按需现量、不落档**——落在表里就是一份没人回来更新的过期账。`核目标档预估 >500 行者，同行附拆分计划` 是**义务**；其判据数值与拆分触发单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.10，本节不复制数值（D2）。

**`:275` 那半条是误读，未改列。** 注册表「行数」列数的**不是文档行数**：逐行 8 / 6 / 11 / 51 / 31 / 28 / 15 / 8 / 6 / 1 / 3 / 3 / 1 / 1 / 8 相加 = **181**，等于 `:273` 逐字「覆盖 **181** 行」的**覆盖裁决行数** ⇒ 属覆盖对账，不是批次账。

为防下一次同一个误读，同处补一句：

> **注册表「行数」列不是文档行数**：它数的是该子系统档覆盖的裁决行条数（合计 = 上条「覆盖 181 行」），与「这个档现在多少行」无关 ⇒ 属覆盖对账，不是批次账。

**§2 判留清单增一条**（父侧令）：`docs/core/design/CORE-UNIFICATION.md` §2.5 的「行数（CLI / VSC / 核）」**列定义**与注册表「行数」列 —— **判留**。理由 = 前者是义务口径（读数值按需现量、不落表），后者是覆盖裁决行数；两者都不是「这一批改了哪些档」。

#### 2.20.4 ⑩ 名称对齐 —— 引用处随标题

标题逐字 = `docs/core/design/DOC-DISCIPLINE.md:643`「### 3.10 尺寸档补充登记」。两处引用改成同名：

- `docs/core/design/ADVISOR-CONVERGENCE.md:17`：`§3.10「尺寸档位补充登记」` → `§3.10「尺寸档补充登记」`
- `docs/core/design/ADVISOR-CONVERGENCE.md:358`：同改（`**判据数值单源 = …§3.10「尺寸档补充登记」**`）

**评审的第三个坐标不成立（实读）**：评审记 `docs/core/design/DOC-DISCIPLINE.md:2031` 含旧名 —— 该行逐字是 A-DD15「…**尺寸档位判据数值（`≥300` / `>500` / `>800`）照留**（单源 = §3.10）」，**不含档名**。

全仓 grep `尺寸档位补充登记|尺寸档补充登记` = 4 处命中：标题 1 + 上列 2 + 本条批档旧记录 1 ⇒ **需改的只有那两处**。

#### 2.20.5 ② 需求档面：记录与盘相反（实读 + 收正）

`docs/core/requirements/METHODOLOGY.md` 盘上实读（**笔主 = 主 agent**，本席只记不改）：

| 行 | 编号 | 现逐字（摘） |
|---|---|---|
| `:35` | F2-4 | 「**受影响文件清单不在设计档——该表归批档 §2（F-R24a）**」 |
| `:84` | F-R24a | 「**受影响文件表归批档 §2，设计档不设**：…判据数值单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.10；本行不重述数值」 |
| `:85` | F-R24b | 「advisor 设计评审维度补「批档 §2 受影响文件表的尺寸档位核查」…**核查对象是批档 §2，不是设计档**」 |
| `:92` | F7-1 | 「**受影响文件清单不在本模板——它归批档 §2（F-R24a）**」 |

**⇒ 全批「需求档零改 / 未触」句一律读作本表**（判据 = D7「§2 ↔ 盘对账不符 ⇒ 追加 §2 更正，不改写已落行」）。

**计数如实**：评审点名 3 处（`:408` ∥ `:739` ∥ `:1242`），本席 grep 实扫**共 10 处**（另 `:482` ∥ `:556` ∥ `:644` ∥ `:834` ∥ `:924` ∥ `:1076` ∥ `:1163`）。

**10 处的正确读法** = **「本席各轮零改需求档」为真、「整批零改」为假**：那四行换口径发生在席外（主 agent 笔）。时点只知 F-R24a 那处父侧自记「改早了一轮、没回头重核」（18:23 前后）；其余三行的逐行时点父侧未逐条记录 ⇒ **不代为编时点**。

#### 2.20.6 ③ 三条拆点债 ↔ 台账行（值并排 · 逐条）

| 债 | §2 原句（摘） | 台账行 | 题头（逐字） | 值对不对 |
|---|---|---|---|---|
| ssh-transport 拆点 | §2.11.3「`ssh-transport.mjs` **561**（Δ +237，非空 519）⇒ 越 500 顾问线…迁入新档 `ssh-text.mjs`…`:40` ∥ `:122`–`:252`，≈132 行…`ssh-session.mjs:34`…迁后预估 **≈431**」 | **`#1922`**（`tech_todo` · 待讨论） | 「`ssh-transport.mjs` 561 越 500 顾问线 —— 按设计档计划把可见文本面（剥离 + 遮蔽归一 ≈132 行）迁入新档 `ssh-text.mjs`」 | **等值**：561 ∥ Δ +237 ∥ ≈132 行 ∥ `ssh-session.mjs:34` ∥ ≈431 逐项相同；evidence 逐字含 §2.11.3 原句 |
| TIMEOUT-DIGEST offload | §2.5 债 1「`thincoder-core/agent/helpers.mjs` 500 行，位于 500 行咨询档上沿，不越档、不拆分。若…越档，拆点 = 把 offload / 预览族整块外移为 `thincoder-core/agent/offload.mjs`（原档保留 re-export，消费面零改），仅此一处」 | **`#1955`**（`tech_todo` · 在途） | 「`agent/helpers.mjs` 500 行贴咨询线：越档则拆点 = offload/预览族外移 `agent/offload.mjs`（原档 re-export，消费面零改）」 | **等值**：500 ∥ offload / 预览族 ∥ `offload.mjs` ∥ re-export 逐项相同 |
| SUBAGENT 过 800 拆点 | **§2 里没有原句** | **`#1954`**（`tech_todo` · 在途） | 「AGENT-LOOP-SUBAGENT 过 800 硬限需拆：拆点 = §6.22 提示词逐字面 ∥ §6.30 描述面，新档 `SPAWN-TASK-CHANNEL`」 | **无法并排，如实记**（见下） |

**第三条为什么并排不了**：该句原住 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.22.3，随 §6.26 表删时**未在 §2 抄录**。

本轮 grep 实扫本档：`SPAWN-TASK-CHANNEL` **0 命中**；`800 硬限` 只中 `:349`（MODEL-BENCH 判据句）与 `:712` ∥ `:1271`（评审行）—— 都不是那条债。

⇒ **原句逐字已由 `#1954` 的 evidence 承载，债没丢；丢的是 §2 里的抄录。**

**`#1957` ∥ `#1958`**（§2 已点名，不重复并排）：`#1957` = `docs/core/design/SESSION.md` 尺度结论拆点（待讨论 · `task_book` = 本批，承接 §2.17.4）；`#1958` = `thincoder-core/config.mjs:32` ∥ `:171` 注释死指（待讨论 · 产品码面，本席无写权）。

#### 2.20.7 ④ 集成测试设计（RTM 基线声明）

**基线 = 测试索引档 RTM**（住 `test/` 目录；实读 49,601 字节 · 同目录 `run.mjs` 2,730 字节 · `test/integration/` 在）。**本批不破任何既有行、不增任何行。**

理由 = **纯文档面、零代码改**：本批改动全在 `docs/**` 的设计档与需求档文本。

`thincoder-core/**` ∥ `thincoder-cli/**` ∥ `thincoder-vscode/**` ∥ `thincoder-desktop/**` ∥ `test/**` **零写** ⇒ 没有任何业务可观测结果被改动。

故既无「既有用例断言的业务可观测结果被改」，也无「产品真需要的新场景」——两条来源（业务场景真需要 ∥ 生产真出过问题）一条都不满足 ⇒ 不立新行、不改既有行。RTM 本批零 diff。

**一处措辞受限，如实记**：RTM 档具名写成「RTM」不带扩展尾 —— 门对该档的锚判为**档缺**（首投命中 1 处、复投又 1 处，两投都拒在同一点）。档在盘、判据面未变，故改措辞不改事实。**要按全路径写，须先裁门这一侧的解析口径。**

#### 2.20.8 ⑨ §2.17.2 坐标收正（按盘实读）

`grep` 实读 `docs/core/design/CONTEXT-COMPACTION.md`，两行与盘不符，收正：

| §2.17.2 原记 | 盘上实读（逐字摘） | 收正为 |
|---|---|---|
| `enforceContextFit`（`run-stages.mjs:158`）在 `:803`「守卫面不动」· `:927` 三问块 | `:759`「**守卫面不动**：`enforceContextFit`（`thincoder-core/agent/run-stages.mjs:158`）仍判 `usage.total > budget.limit` 并强压一次…」· `:883`「`enforceContextFit()`：`existing but 抽出`——现体 = `thincoder-core/agent/run-stages.mjs:158`…」 | `:759` ∥ `:883` |
| `SUMMARY_TOKEN_ESTIMATE`（`token-window.mjs:43`）在 `:792` | `:748`「…`SUMMARY_TOKEN_ESTIMATE = 1000`（常量单源 = `thincoder-core/token-window.mjs:43`，tail 预算早已用它…）」 | `:748` |

**实体结论不变**：两条坐标都在机制面（守卫面 ∥ 三问块 ∥ 常量单源句），收的是行号不是结论。

#### 2.20.9 ⑧ 先例与勘察

落在 **§2 首部 §2.0a**：两行 = 同类先例（`#1902` + 对齐 ∥ 偏离）+ 勘察证据（查过的四档 + 结论）。

**落法如实记**：§2 为 append-only 段，`batch` 工具只能追加到段尾 ⇒ 这两行走的是**文件编辑**插入 §2:311 之后（同为本席笔，未触及他段）。

#### 2.20.10 边界（本轮实际遵守）

只动 3 档（`docs/core/design/DOC-DISCIPLINE.md` ∥ `docs/core/design/ADVISOR-CONVERGENCE.md` ∥ `docs/core/design/CORE-UNIFICATION.md`）+ 本批档 §2。

**需求档零写**（盘上那四行的改 = 主 agent 笔，本席只记）· **代码零改** · 未加机检 · **未重排节号**。

**阈值与判据强度一字未动**：`≥300`（`:655`）∥ `>500` ∥ `>800` ∥ 软线 500 ∥ 硬限 800（`:653`）逐处核过；`_archive` ∥ 别档批档未触。

**未做（父侧明令「别扩」）**：`#1958` 两处产品码注释（`thincoder-core/config.mjs:32` ∥ `:171`）未碰。

**门拒两次，如实记**：首投 `REFUSED（2 条）` —— 裸档名锚 1 处 + 一段超 300 字符；复投 `REFUSED（1 条）` —— 同一锚。修正后三投。

### 2.21 评审轮 2 处置（逐条 · 本席落盘）

**评审轮 2 = `pass`（🔴 × 0 · 🟡 × 2 · 🔵 × 4）。** 父侧裁：🟡 #1 ∥ #2 与 🔵 #5 ∥ #6 四条全认、本轮一次清完；🔵 #3（计数过期）∥ #4（`#1954` 并排不了）在记录面，父侧明令不改。

**落盘前预检** = `doc_check`（报告态，两档整档入判）⇒ 命中 0 条（锚 0 · 文字太长 0 · 行太长 0），追加不被存量债挡。

**坐标基准**：§2.0a 已插在 §2 首部 ⇒ **§2 内行号以 §2.0a 插入后为基准**。本段只在段尾生长，故本段所列行号在本段落盘后仍成立；`## §3` 起的行号随本段增长下移。

#### 2.21.1 🟡 #1 —— §2.20.5 的枚举按现盘重取（扫串 + 逐处 + 处数）

**扫串四条**（D7 的更正对象 = 「需求档没被改」这类断言）：`需求档未触` ∥ `需求档零改` ∥ `需求面未触` ∥ `需求档零写`。**域** = 本档 §2 段。

**逐处**（坐标 = `docs/batches/2026-11-01-affected-files-table-purge.md` 的 `:N`）：

| # | 坐标 | 逐字（摘） |
|---|---|---|
| 1 | `:417` | 「…（规则面 = 下一轮）；需求档未触；代码零改；不新增机检…」 |
| 2 | `:491` | 「…（规则面 = 下一轮）· 需求档未触 · 代码零改…」 |
| 3 | `:565` | 「…（规则面下一轮）· 需求档未触 · 代码零改…」 |
| 4 | `:653` | 「…（规则面 = 下一轮）· 需求档未触 · …受影响文件总表未触（射程外，另轮）…」 |
| 5 | `:744` | 「需求面未触：`docs/core/requirements/METHODOLOGY.md` 的 F-R24a ∥ F-R24b（§1.16）—— 需求档 = 主 agent 笔（D1），本席只报不改。」 |
| 6 | `:748` | 「只动派单 3 档 · 需求档零改 · 代码零改…」 |
| 7 | `:843` | 「只动派单 5 档中的 4 档（…）· 需求档零改 · 代码零改…」 |
| 8 | `:933` | 「只动派单 12 档 · 需求档零改 · 代码零改…」 |
| 9 | `:1085` | 「只动派单 12 档（(a) 1 档 · (b) 1 档 · (c) 12 档）· `docs/core/design/CORE-UNIFICATION.md` 未触 · 需求档零改…」 |
| 10 | `:1172` | 「只动 `docs/core/design/CONTEXT-COMPACTION.md` 一档 4 处编辑（…）· 需求档零改…」 |
| 11 | `:1251` | 「只动 `docs/core/design/CONTEXT-COMPACTION.md` 一处块（`:587`–`:595`）· 需求档零改…」 |
| 12 | `:1376` | 「**需求档零写**（盘上那四行的改 = 主 agent 笔，本席只记）· 代码零改…」 |

**处数 = 13。**（原记 12 —— 第 13 处 = `:1469`，逐字见 §2.22.1）旧记那 10 处的**现坐标** = 评审点名 3（`:417` ∥ `:748` ∥ `:1251`）+ 其余 7（`:491` ∥ `:565` ∥ `:653` ∥ `:843` ∥ `:933` ∥ `:1085` ∥ `:1172`）；旧值（插入前，全 −9）= `:408` ∥ `:739` ∥ `:1242` · `:482` ∥ `:556` ∥ `:644` ∥ `:834` ∥ `:924` ∥ `:1076` ∥ `:1163`。

**漏 2 处**：`:744`（评审点名要计入）与 `:1376`（`需求档零写` 同族，本轮实扫补入）。

**读法不变**：这 13 处（12 + `:1469`）的真值 = §2.20.5 那张表 —— `docs/core/requirements/METHODOLOGY.md` 的 F2-4 ∥ F-R24a ∥ F-R24b ∥ F7-1 已换本批口径（笔主 = 主 agent）；「本席各轮零改需求档」为真、「整批零改」为假。

**自增与计数的分界（活断言 ∥ 提及）**：扫串命中分两种 —— **活断言** = 对需求面下了判断的句子，计入处数；**提及** = 把扫串当对象引用的句子（`:1321` ∥ `:1394` ∥ 枚举表行 `:1400`–`:1411` ∥ `:1415` ∥ 本段自身），不计入。**本段自身的边界句亦属活断言，须计入** —— `:1469` 即此类（见 §2.22.1）。

**§1 段不入表**：`docs/batches/2026-11-01-affected-files-table-purge.md:116` 逐字是「`_archive` / `batches` / 需求档不动」—— 另一作者、另一句形，不属这四条扫串。

#### 2.21.2 本席教训（父侧令写进档）

**插入会顶偏其后全部坐标 —— 插之前先记「此后 +N」，插完回填。**

踩法：§2.0a 插在 §2 首部（+9 行），其后每条 `:N` 当场全漂 9 行；本席按插入前的行号落笔，落完没回填、也没回扫。评审按盘一读，十处全错 —— **实体结论没错，可核性没了**。

**落到操作**：① 段中部插入前，先按现盘记下「自本行起 +N」；② 插入后同轮回扫本档引用，逐处回填；③ 回填不了的他段，在插入处记一句基准说明（本段开头那句即是）。

#### 2.21.3 🟡 #2 —— 集测基线写成 `test/RTM.md`

- **更正 §2.20.7**：基线按盘 = `test/RTM.md`（在盘；本席本轮实读 49,601 字节 · 317 行 · 首行逐字 `# UAT 验收总表（RTM）`）。
- **`档缺` 归门解析口径另裁**（父侧已入账 `#1959`）。**不拿门的口径反推档名写法** —— 那正是本批在治的绕闸处方：档名写法由盘上事实定，不由判据的解析盲区定。
- **结论不变**：纯文档面、零代码改 ⇒ 不破既有行、不增新行，RTM 本批零 diff。

#### 2.21.4 🔵 #5 —— `docs/core/design/CORE-UNIFICATION.md:264` 同块两读法收口

**改前逐字**：

> | 行数（CLI / VSC / 核） | 三侧行数（`wc -l`）与 delta——核列 = `thincoder-core/` 包内目标档（R24a 的逐档挂钩面）；**核目标档预估 >500 行者，同行附拆分计划**（N8 / T-C14 的检查对象） |

**改后逐字**：

> | 行数（CLI / VSC / 核） | 三侧尺寸档位判（数值按需现量、不落档）——核列 = `thincoder-core/` 包内目标档（R24a 的逐档挂钩面）；**核目标档预估 >500 行者，同行附拆分计划**（N8 / T-C14 的检查对象） |

**只改这半句**：列名「行数（CLI / VSC / 核）」未动（改名要连带 §2.5 全表现值列与子系统注册表口径，D3 大改，父侧未派）；义务半句「核目标档预估 >500 行者，同行附拆分计划」一字未动。

**同块现为一处读法**：`:273` 的「列定义保留、数值不落表」与 `:264` 的列定义同口径 —— 只读该行的人不再读到「这一列装行数与增量」。

#### 2.21.5 🔵 #6 —— D4 细则二补射程，取 ③

**三选一取 ③「why 必须自足到不带坐标」。** 另两选为何不取：①「禁引不例外」只说不许、不说该怎么写，下一个人还得再撞一次；②「出处注例外」给禁引开一个「看着像引用、实际是出处注」的口子 —— 模型读者分辨不出这两种写法，例外即失效。

**为什么是 ③**：① 与本档已落的「存量无豁免（阈值 = 0）」同向，不开新例外；② 给的是**可写的做法**（因果与教训写进句子本体），不是又一条禁令；③ 把「先例在哪」留在批档本体 —— 批档可整体清理，规范档不承载它的坐标，与细则二的原则同源。

**落点** = `docs/core/design/DOC-DISCIPLINE.md:71` 之后新增两条，逐字：

> - **先例坐标不入规范档（禁引无例外 · D9 的 why 自足到不带坐标）**：why 要的是**因果与教训写进句子本体**；「先例 = 批档 §N」这类写法**不是 why 的出处注，是引用**，同样判违规（例外 = 0）。要核先例时去批档本体查。
>
> - **为什么两条规则不打架**：D9 判的是「理由说得清、来源指认得出」，不判「指向哪一档」。一条 why 只有指着某处才立得住，说明理由本身没写出来——先例坐标在这里既非必要、也不合法。

**连带**：§2.20.2 那处「why 写成自足句、先例留批档」**不是偏离派单，是本条的正解**。父侧若要改口径，须先撤「例外 = 0」这一句。

#### 2.21.6 边界（本轮实际遵守）

只动 2 档（`docs/core/design/CORE-UNIFICATION.md` 半句 · `docs/core/design/DOC-DISCIPLINE.md` 新增 2 条）+ 本档 §2。

**未插新块**（父侧明令：再插一次坐标又全漂；本段只在段尾追加）· **需求档零写**（笔主 = 主 agent）· **代码零改** · **未加机检** · **未重排节号** · **阈值一字未动**（`≥300` / `>500` / `>800` · 软线 500 · 硬限 800）。

**门读数** = 本条落盘回执的 `[doc-check gate]` 行。

### 2.22 评审轮 3 处置（逐条 · 本席落盘）

**评审轮 3 = `pass`（🟡 × 1 · 🔵 × 3）。** 父侧裁：`#1` ∥ `#2` ∥ `#3` 三条本轮落；`#4` 判本轮不动。

**落法**：`§2.21.1` 的处数句（`:1413`）与免责句（`:1419`）各**换一行、行数不变** ⇒ 其后坐标零漂（§2.21.2 的教训）。第 13 处逐字与计数口径落在本段。

#### 2.22.1 🟡 #1 —— 第 13 处活断言 · 处数 12 → 13

**第 13 处**（本轮按现盘实扫补入）：

| # | 坐标 | 逐字（摘） |
|---|---|---|
| 13 | `:1469` | 「**未插新块**（父侧明令：再插一次坐标又全漂；本段只在段尾追加）· **需求档零写**（笔主 = 主 agent）· **代码零改** · **未加机检** …」 |

**为什么算活断言**：它与已计入的 `:1376` 同形同族 —— 两句都对需求面下了判断（「没被改」），不是把扫串当对象引用。`§2.21.1` 的免责句把它吸进「引用处」，是归因写窄了。

**第 1–12 处单源 = `§2.21.1` 的表**（`:1400`–`:1411`），本段不复述（D2）。

**处数 = 13**，落在 `:1413`（就地改，见 2.22.3）。

#### 2.22.2 🔵 #2 —— 免责句改按「活断言 ∥ 提及」二分

旧免责句的射程写「本段」，而域写在 `:1394`（逐字「**域** = 本档 §2 段」）⇒ 域内的提及有落在免责句外的，复扫人每次都要再判一次「算不算提及」。

**新逐字（已就地替换 `:1419`）**：

> **自增与计数的分界（活断言 ∥ 提及）**：扫串命中分两种 —— **活断言** = 对需求面下了判断的句子，计入处数；**提及** = 把扫串当对象引用的句子（`:1321` ∥ `:1394` ∥ 枚举表行 `:1400`–`:1411` ∥ `:1415` ∥ 本段自身），不计入。**本段自身的边界句亦属活断言，须计入** —— `:1469` 即此类（见 §2.22.1）。

**复扫人只数活断言** ⇒ 现盘 = 13。本段自身是新加的提及承载（引文表格与二分说明），不计入。

#### 2.22.3 🔵 #3 —— 映射句改称「现坐标」+ 旧值并列

原句列的 10 个坐标是**现盘值**，却称「旧记」；旧记写的是另一组值（插入前），读者须自己做 −9 反推才能对上。

**新逐字（已就地替换 `:1413`）**：

> **处数 = 13。**（原记 12 —— 第 13 处 = `:1469`，逐字见 §2.22.1）旧记那 10 处的**现坐标** = 评审点名 3（`:417` ∥ `:748` ∥ `:1251`）+ 其余 7（`:491` ∥ `:565` ∥ `:653` ∥ `:843` ∥ `:933` ∥ `:1085` ∥ `:1172`）；旧值（插入前，全 −9）= `:408` ∥ `:739` ∥ `:1242` · `:482` ∥ `:556` ∥ `:644` ∥ `:834` ∥ `:924` ∥ `:1076` ∥ `:1163`。

**差值 10/10 核过**：408+9=417 · 739+9=748 · 1242+9=1251 · 482+9=491 · 556+9=565 · 644+9=653 · 834+9=843 · 924+9=933 · 1076+9=1085 · 1163+9=1172。

#### 2.22.4 🔵 #4 —— 本轮不动（如实记）

父侧判：append-only 按 D7 不改已落行 ⇒ `§2.20.7` 的原句保留；按盘可解析的写法已落在 `§2.21.3`（基线 = `test/RTM.md`）。下次触碰 `§2.20.7` 时加一句指针，本轮未动一字。

#### 2.22.5 边界与读数

- 只动 `docs/batches/2026-11-01-affected-files-table-purge.md` 一档：§2 内 3 行就地换（`:1413` ∥ `:1417` ∥ `:1419`，各 1 行换 1 行，其后坐标零漂）+ 本段段尾追加。
- 设计档零改 · 需求面：本席一字未写（笔主 = 主 agent）· 代码零改 · 未加机检 · 未重排节号 · 未插新块。
- 门读数 = 本条落盘回执的 `[doc-check gate]` 行。

## §3 设计评审（评审子代理）
**状态行**：评审通过（轮 3 只验轮 2 六条 —— 🟡1 🔵3，无 🔴）



### 轮次 1（评审子代理）

### 设计评审 · 第 1 轮（受影响文件表清账批 · 规范档面）

审查面 = 批档 §1/§2 + `docs/core/design/DOC-DISCIPLINE.md` + `docs/core/design/ADVISOR-CONVERGENCE.md` + `docs/core/requirements/METHODOLOGY.md` + `docs/core/design/CORE-UNIFICATION.md` + `docs/core/design/CONTEXT-COMPACTION.md`。

评审类型 = design，对象 = 批档 §2 十轮记录 + 四件规范面。

限制 ①：审查上下文未提供 `docs/README.md` 文档地图与项目标准档 ⇒ Document ownership 按 Project Guide（`AGENTS.md`）判。

限制 ②：台账行（`#1954` / `#1955` / `#1922`）不在审查面内 ⇒ 该侧读数一律标 `unverified`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / 规矩面同口径 | 🔴 | `docs/core/requirements/METHODOLOGY.md:84` 的 F-R24a 把数值来源指向一个本批已删的条：「判据数值 = `docs/core/design/ADVISOR-CONVERGENCE.md`「尺寸档位结论抽查」条」——该条已按 §2.14.1 整条删（该档全档 grep `尺寸档位结论抽查` 零命中）。同批另两处把数值单源写成 `docs/core/design/DOC-DISCIPLINE.md` §3.10：`docs/core/design/ADVISOR-CONVERGENCE.md:358` 逐字「判据数值单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.10「尺寸档位补充登记」」· `docs/core/design/DOC-DISCIPLINE.md:2031` A-DD15「单源 = §3.10」。⇒ 立法源留了一句指向已删节点的旧指针，读者照它取不到判据数值。这正是本批 ③「旧规矩没留残句」要收的口 | 把 F-R24a 的数值来源改成 `docs/core/design/DOC-DISCIPLINE.md` §3.10（与 `docs/core/design/ADVISOR-CONVERGENCE.md:358`、`docs/core/design/DOC-DISCIPLINE.md:2031` 同口径），删掉「尺寸档位结论抽查」这个指向已删条的引法；并在批档 §2 的规矩面清单里补记这一处（现 §2.14.6 条 6 记的是「需求面未触」） |
| 2 | Document ownership / 记录与盘不一致 | 🟡 | 批档三处声明需求档零改：`docs/batches/2026-11-01-affected-files-table-purge.md:408`「需求档未触」· `:739`「需求档零改」· `:1242`「需求档零改」；而盘上 `docs/core/requirements/METHODOLOGY.md:35`（F2-4）/`:84`（F-R24a）/`:85`（F-R24b）/`:92`（F7-1）已全部换成本批口径。记录面与盘面相反 ⇒ 后来人会把需求面当未动，登账与核销都按「零改」走 | 在 §2 补一行如实记：需求档四行（F2-4 / F7-1 / F-R24a / F-R24b）已改为本批口径、笔主与轮次写明；三处「需求档零改」句随之收正 |
| 3 | Requirements / 拆点债（④） | 🟡 | §2 只点名 `#1957`（`:1005`）与 `#1958`（`:1229`），未点名 `#1954` / `#1955` / `#1922`。两条随表删的债只有「待父侧落台账」一句：`:447`「待父侧落台账（本席无写权）：`trigger = 归批`，evidence 指本条」（ssh-transport 拆点）；`:361` 的 TIMEOUT-DIGEST offload 拆点无任何台账坐标。⇒ 债原文 ↔ 台账行的配对在记录里没有落点，④「拆出来的值是真值吗」无法从本批记录核；台账侧读数 `unverified`（不在审查面内） | 三条拆点债逐条补「台账行 = #NNNN」坐标，并把台账题头与该处原文并排一句（值不一致即当场收正）；无台账行者先入账再结 §2 |
| 4 | Acceptance / 集成测试设计 | 🟡 | §2 无「集成测试设计」段，也无「本批不改变任何既有用例断言的业务可观测结果、且不新增产品真需要的场景 — 理由 = 未触及业务行为」这一句（§2.7 只有 doc_check 四条验收）。本批 = 纯 `.md` 面、零代码改，豁免理由实质上成立，但记录里没有这一句 ⇒ 属缺段，不是「已声明无变化」 | 在 §2 落一段：以 `test/RTM.md` 为基线声明本批不破任何行、不增任何行，理由写「未触及业务行为」（纯文档面，零代码改）；若判不适用，同段写明并给理由 |
| 5 | Doc hygiene / ② 删过头了吗（反向） | 🟡 | 被指定为「数值单源」的 `docs/core/design/DOC-DISCIPLINE.md` §3.10（`:643`–`:655`）自身仍带本批读数：`:649` 逐字「`scripts/doc-check-anchors.mjs`（**322** 行 · 本节 +2）」。同档 `:259` 声明「随表一起退场的还有「当前行数」「预计增量」…」、`:1528` U-5 声明「读数不入规范面」⇒ 规范面自相抵：按 §3.10 会认为「帧本批 +N 行」可写进设计档，按 U-5 则必须删 | 二选一把口径定死：① 删该读数、只留档位结论与触发（`322 行 · 本节 +2` 整句退场，拆分计划句保留）；② 若判「代码档尺寸登记 = 债面、豁免 U-5」，就在 §3.10 与 U-5 各写一句射程（谁量、量到哪一档、为什么这处读数不算规范面读数），不要留两读法并存 |
| 6 | Methodology / 规矩未成文 | 🟡 | 「删读数时同一句里的话要跟着盘上重核，否则删掉的是数字、留下的是假话」这条判法只活在批档里（`:1132` 逐字「删数字却留一句「越线（既有事实）」，等于把新的假话留在原地」· `:1219` 同款坑未踩），规范面没有它：`docs/core/design/DOC-DISCIPLINE.md:1528` U-5 只写「读数不入规范面」，其反例③ 写的是反方向（「删读数时把判据一并删掉 = 把判据删了」） | 在 U-5 补一条子句：删读数后，同句剩余断言（「已落」「越线」「在盘」「零改」类）必须按盘重核，不成立即同轮改写；理由写清（数字带时刻，删数字不改句子 = 把旧时刻的断言留成现值断言）。先例坐标 = 批档 §2.18.2 / §2.19.2 |
| 7 | Scope / 同形残留未裁 | 🟡 | `docs/core/design/CORE-UNIFICATION.md:264` 列定义仍要求「行数（CLI / VSC / 核）…**核目标档预估 >500 行者，同行附拆分计划**（N8 / T-C14 的检查对象）」，`:275` 仍有「行数」列；而批档对该档只有两句「未触 / 射程外」：`:644`「`docs/core/design/CORE-UNIFICATION.md` 的受影响文件总表未触（射程外，另轮）」· `:1076`「`docs/core/design/CORE-UNIFICATION.md` 未触」。同一批对「按估算行数判该档走不走拆分」这类格子已在别处判为账（`:295` 逐字「「本批这几档都在 300 / 500 / 800 线内，无拆分计划」= 对一批文件的判断 ⇒ 账，删」）⇒ 此处既不删也无「判留」理由：下轮照 §1.22 会删掉，照 §1.9 又该留 | 对该处给一句明裁：读数按 `:271`「数值按需现量、不落档」不落表（债面留），拆分计划义务归 `docs/core/design/DOC-DISCIPLINE.md` §3.10 单源；把这一判据写进 §2 的判留清单，别只留「射程外」 |
| 8 | Methodology / 先例与勘察 | 🟡 | §2 无「同类先例」行的对齐 ∥ 偏离理由（§1 `:4` `:11` 只给前情坐标 `#1902state-doc-history-purge`，无「既有形为何适用 / 不适用」）；也无「勘察证据」行（查过哪些公共源文档 ∥ 有无相关）。⇒ 一条漏行与「没勘察」在下游同形 | 在 §2 首部落两行：① 同类先例 = `#1902` 规矩面改写的既有形 + 对齐点 / 偏离点（本批多出「删表带走状态」两次补回）；② 勘察证据 = 查过的公共源档清单（至少含 `docs/core/design/DOC-DISCIPLINE.md`、`docs/core/design/ADVISOR-CONVERGENCE.md`、`docs/core/requirements/METHODOLOGY.md`）与「相关 / 无相关」结论 |
| 9 | Clarity / 记录内坐标 | 🔵 | §2.17.2「已在盘（单源位置）」表的行号与盘不符：`:971` 把 `enforceContextFit`（`run-stages.mjs:158`）记在 `:803`，盘上实读在 `docs/core/design/CONTEXT-COMPACTION.md:759`（「守卫面不动」）与 `:883`（三问块）；`:973` 把 `SUMMARY_TOKEN_ESTIMATE` 记在 `:792`，盘上在 `:748`（逐字「常量单源 = `thincoder-core/token-window.mjs:43`」）。实体结论成立（15 类坐标均在机制面，逐名实读命中），但记录里的坐标不可解析 | 把该表行号改标实读值或改标节名（D4：行号只作 as-of）；这张表是「没被带走状态」的凭据，坐标失准就不好复核 |
| 10 | 判据强度（②·核验为通过） | 🔵 | 阈值 / 拆分触发 / 债面未被连带删，逐处实核到位：`docs/core/design/DOC-DISCIPLINE.md:263`（`≥300` / `>500` / `>800` + 数值单源 = §3.10）· `:655`（函数档 `≥300` 触及即判 · 文件档 `>500` 主动审视 · `>800` 必须拆，封口语义无豁免）· `:165`–`:169`（D-1 500 建议线 / 800 硬限、D-2 超 800 单测档拆两档）· `:745`–`:748`（M-3 触发 / M-4 不设行数阈值 / M-6 新档归批档 §2）· `docs/core/design/ADVISOR-CONVERGENCE.md:362`（判据两条 + `.md` 零义务）· `:400` A-AC11（函数档为第一判据）。另核名实不符：引用处写「尺寸档位补充登记」（`docs/core/design/ADVISOR-CONVERGENCE.md:17` · `:358` · `docs/core/design/DOC-DISCIPLINE.md:2031`），标题实为「### 3.10 尺寸档补充登记」（`docs/core/design/DOC-DISCIPLINE.md:643`） | 只补名称一致：三处引用统一写成标题的逐字样（或反之把标题补「位」），以免 V1 类判据与人工检索对不上 |

**核过且不另记的项**：

① `docs/core/design/CONTEXT-COMPACTION.md` 全档 `受影响文件` / `行数口径` / `6.16.9` / `wc -l` 四串零命中。

② 第三次「删表带走状态」已补回，逐名实读命中：`enforceContextFit` `:759`/`:883` · `SUMMARY_TOKEN_ESTIMATE` `:748` · `_overflowRetried` `:949` · `estimateSample` / `tokenKey` / `tokenSampleOf` `:879`–`:884` · VSC 四处 `:936`–`:937`。

③ `docs/core/design/ADVISOR-CONVERGENCE.md` §9 已无「受影响文件表」维度，旧「尺寸档位结论抽查」条已删。

④ `docs/core/design/CORE-UNIFICATION.md` 全档 `受影响文件` 只剩 `:588` 的「受影响测试同步」，甲类表已不在盘。

⑤ 批档 §2 已无「这批改了哪些档」的节或表被漏留在审查面内。

⑥ 纯 `.md` 面 ⇒ 档位 / 函数阈值判据不适用（无越档者、无拆分计划义务）。

**计数**：🔴 × 1 · 🟡 × 7 · 🔵 × 2。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 设计评审 · 第 2 轮（轮 1 十条逐条落地复核 · 只验不抓新）

审查面 = 批档 §1/§2 + `docs/core/design/DOC-DISCIPLINE.md` + `docs/core/design/ADVISOR-CONVERGENCE.md` + `docs/core/requirements/METHODOLOGY.md` + `docs/core/design/CORE-UNIFICATION.md`。

限制 ①：审查上下文未提供 `docs/README.md` 文档地图与项目标准档 ⇒ Document ownership 按 Project Guide（`AGENTS.md`）判。

限制 ②：台账三行（`#1922` / `#1955` / `#1954`）与 `docs/core/design/CONTEXT-COMPACTION.md` 不在审查面内 ⇒ 该侧读数一律 `unverified`。

**逐条对账（只判轮 1 那 10 条 + 过程合规）**

- ① ✅ `docs/core/requirements/METHODOLOGY.md:84` 逐字「判据数值单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.10」——不再指已删的「尺寸档位结论抽查」。

- ② ⚠️ 修正表与读法约定在（`:1321` 逐字「全批「需求档零改 / 未触」句一律读作本表」），枚举坐标按盘全漂（见下表 #1）。

- ③ ✅ `#1922` ∥ `#1955` 值逐项并排；`#1954` 的「并排不了」判够（见下表 #4）。

- ④ ⚠️ 段落在 §2.20.7、豁免理由成立（纯文档面、零代码改 ⇒ 无业务可观测结果被改、无真需要的新场景），唯基线名不可解析（见下表 #2）。

- ⑤ ✅ `docs/core/design/DOC-DISCIPLINE.md:649` 已无「322 行 · 本节 +2」。

  同档 `:653` 逐字「软线 = 500（咨询层）· 硬限 = 800（仓 `AGENTS.md` 口径）」；`:655` 逐字「文件档 `>500` **主动审视**；`>800` **必须拆**（封口语义，无豁免通道）」。阈值一条未丢。

- ⑥ ✅ 落地，且拒绝**成立**。补条在 `docs/core/design/DOC-DISCIPLINE.md:1574`，why 自足（合 D9 `:87`）。

  不把批档 §2.18.2 写进规范档的拒绝有盘上规矩兜底：`docs/core/design/DOC-DISCIPLINE.md:71` 逐字「规范档**禁引**批档及其单元测试档（**含历史行**）」+ `:76` 存量无豁免（阈值 = 0）⇒ 写进去即本条自判红。

- ⑦ ✅ 落地，且设计席的反敌**成立**。`docs/core/design/CORE-UNIFICATION.md:275` 逐字「**注册表「行数」列不是文档行数**」。

  按盘自算该列 8+6+11+51+31+28+15+8+6+1+3+3+1+1+8 = **181**，等于 `:277`「覆盖 **181** 行」与 `:296` 合计行 **181** ⇒ 它数的是覆盖裁决行条数，不是文档行数。明裁落 `:273` 逐字「**列定义保留、数值不落表**」。

- ⑧ ✅ §2.0a 两行齐：先例 = `#1902` + 对齐 ∥ 一处偏离；勘察 = 四档 + 逐字「`index.publicRepos` 未逐字段核对 ⇒ 外部一手源输入**不作声明**」。

- ⑨ ✅ 收正表在 §2.20.8；被收正的盘值（`docs/core/design/CONTEXT-COMPACTION.md`）在审查面外 ⇒ **unverified**。

- ⑩ ✅ 标题 `docs/core/design/DOC-DISCIPLINE.md:643`「### 3.10 尺寸档补充登记」= 引用处 `docs/core/design/ADVISOR-CONVERGENCE.md:17` ∥ `:358` 的逐字样。

  评审给的第三坐标确不成立：A-DD15 现 `docs/core/design/DOC-DISCIPLINE.md:2035` 逐字「**尺寸档位判据数值（`≥300` / `>500` / `>800`）照留**（单源 = §3.10）」，不含档名。

- 过程合规 ✅ 可接受：§2 首部两行为文件编辑插入（`:1370` 自报），作者 = §2 唯一作者、未改写 / 未删任何已落行、且如实记；代价已量化进下表 #1。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 记录可核性（轮 1 ② 的落地残余） | 🟡 | §2.20.5 枚举的坐标按盘全部 +9 行失准。它记 `:482` ∥ `:556` ∥ `:644` ∥ `:834` ∥ `:924` ∥ `:1076` ∥ `:1163`（`:1323` 逐字「本席 grep 实扫**共 10 处**（另 `:482` ∥ `:556` ∥ `:644` ∥ `:834` ∥ `:924` ∥ `:1076` ∥ `:1163`）」），盘上实读为 `:491` ∥ `:565` ∥ `:653` ∥ `:843` ∥ `:933` ∥ `:1085` ∥ `:1172`；评审点名的三处同样漂成 `:417` ∥ `:748` ∥ `:1251`（盘中 `:482` 现为 doc_check 命令行）。成因 = 同轮把 §2.0a 插在 §2 首部，其后每条坐标 +9。另枚举漏一处仍在盘的「需求面」句：`:744` 逐字「需求面未触：`docs/core/requirements/METHODOLOGY.md` 的 F-R24a ∥ F-R24b」——正是轮 1 #1 建议要点的那一行 | 在 §2 追加一行按现盘重取的完整清单（扫串 + 逐处 `档:行` + 处数，合本档 §3.22 U-1 形），把 `:744` 一并计入；并写明「§2 内行号以 §2.0a 插入后为基准」 |
| 2 | 集成测试设计的基线可解析性（轮 1 ④ 的落地残余） | 🟡 | 段落在 §2.20.7，唯基线不给可解析路径：`:1345` 逐字「**基线 = 测试索引档 RTM**」，`:1353` 解释「RTM 档具名写成「RTM」不带扩展尾 —— 门对该档的锚判为**档缺**」。而该档盘上就在 `test/RTM.md`（本次实核在盘）⇒ 基线名比事实更弱，读者无法据记录回查那 49,601 字节 | 基线按盘写成 `test/RTM.md`（盘上存在、可核）；门的 `档缺` 另记一句「门解析口径另裁」，不拿门的口径反推档名写法 |
| 3 | 判据面读数（轮 1 ⑩ 的连带） | 🔵 | `:1308` 逐字「全仓 grep `尺寸档位补充登记|尺寸档补充登记` = 4 处命中」——现盘重扫得 10 处（标题 `docs/core/design/DOC-DISCIPLINE.md:643` 1 + `docs/core/design/ADVISOR-CONVERGENCE.md:17` ∥ `:358` 2 + 批档记录面 7）。结论「需改的只有那两处」仍真，读数已过期 | 该行属记录面，不必追改；再落笔时记成「记录面命中随本段自增，需改处 = 2」这种不漂的形 |
| 4 | 拆点债（轮 1 ③ 的落地质量） | 🔵 | `#1922` / `#1955` 已逐值并排。`#1954` 判「无法并排」的交代够：点名台账行 + 题头逐字 + 归因逐字「原句逐字已由 `#1954` 的 evidence 承载」+ 复扫形（`SPAWN-TASK-CHANNEL` 0 命中、`800 硬限` 命中 `:349` ∥ `:712` ∥ `:1271`）。残留 = 台账三行的题头与状态在本审查面外，逐字 `unverified` | 无需再动；若要自持，把台账三行的题头与 evidence 首行抄进 §2 一次（值并排才不依赖审查面外的档） |
| 5 | 规范面同址两读法（轮 1 ⑦ 的落地残余） | 🔵 | `docs/core/design/CORE-UNIFICATION.md:273` 已判「数值不落表」，但同块的列定义 `:264` 仍逐字「三侧行数（`wc -l`）与 delta」——只读该行的人仍读到「这一列装行数与增量」，与 `:273` 的现量口径相反 | 把 `:264` 该半句改写成「三侧尺寸档位判（数值按需现量、不落档）」，保留其义务半句「核目标档预估 >500 行者，同行附拆分计划」 |
| 6 | 口径二选一未定死（轮 1 ⑥ 的落地余项） | 🔵 | 补条 why 作成自足句（合 D9），但派单「先例坐标写进档」与 `docs/core/design/DOC-DISCIPLINE.md:71`「规范档**禁引**批档」两条规则并存，现档只写了一种落法，两规的优先级无处可查 | 在 D4 细则二补一句射程（先例坐标算不算 why 的出处注）——三选一定死：禁引不例外 ∥ 出处注例外 ∥ why 必须自足到不带坐标 |

**计数**：🔴 × 0 · 🟡 × 2 · 🔵 × 4。

VERDICT: pass

### 轮次 3（评审子代理）

**设计评审 · 第 3 轮（轮 2 六条逐条对账 · 只验不抓新）**

审查面 = `docs/batches/2026-11-01-affected-files-table-purge.md` + `docs/core/design/CORE-UNIFICATION.md` + `docs/core/design/DOC-DISCIPLINE.md`。

限制 ①：审查上下文未提供 `docs/README.md` 文档地图与项目标准档 ⇒ Document ownership 按 Project Guide（`AGENTS.md`）判。

限制 ②：`docs/core/requirements/METHODOLOGY.md` 不在本轮审查面 ⇒ 需求面读数一律 `unverified`（轮 2 已核）。

限制 ③：`:1433` 记「49,601 字节」——读面不回字节数 ⇒ 该值 `unverified`；317 行与首行逐字已实读命中。

**① 🟡 枚举坐标（12 处）**：逐处实读，**12/12 命中**，引文与盘逐字相符（`:417` ∥ `:491` ∥ `:565` ∥ `:653` ∥ `:744` ∥ `:748` ∥ `:843` ∥ `:933` ∥ `:1085` ∥ `:1172` ∥ `:1251` ∥ `:1376`）。

**第 13 处漏记**：`:1469` 逐字「**需求档零写**（笔主 = 主 agent）· **代码零改**」——同族活断言、同在 §2，见下表 #1。

**② 🟡 集测基线**：`:1433` 逐字「基线按盘 = `test/RTM.md`」+ `:1434` 逐字「不拿门的口径反推档名写法」——落到位，未拿门反推档名。

盘核：`test/RTM.md` 在盘，317 行，首行逐字 `# UAT 验收总表（RTM）`。

**③ 🔵 `docs/core/design/CORE-UNIFICATION.md:264`**：半句已收口，逐字「三侧尺寸档位判（数值按需现量、不落档）」。

义务半句仍在，逐字「**核目标档预估 >500 行者，同行附拆分计划**」；`:273` 判留句 ∥ `:275` 注册表口径均在。

自算核对：注册表「行数」列 15 行相加 = 181 = `:277` 逐字「覆盖 **181** 行」⇒ 该列确非文档行数。

**④ 🔵 `docs/core/design/DOC-DISCIPLINE.md:73` ∥ `:75`**：三选一定死为 ③，逐字「先例坐标不入规范档（禁引无例外 · D9 的 why 自足到不带坐标）……（例外 = 0）」。

两规不打架的理由在句：`:75` 逐字「为什么两条规则不打架」+「D9 判的是『理由说得清、来源指认得出』，不判『指向哪一档』」。

**⑤ 两条「按令不动」**：确未动 —— `:1323` 仍逐字「本席 grep 实扫**共 10 处**」；`:1333` 仍逐字「**无法并排，如实记**」。

**另问 · 免责声明判读**：机制真实 —— 一份列举自身扫串的档，复扫必然自增，写出来比让读数静默漂好；方向对，归因写窄了。`:1419` 只并入「作为被枚举对象」的引用处，于是把 `:1469` 这类**活断言**一并吸进「引用处」。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 记录可核性（轮 2 #1 的落地） | 🟡 | 12 处坐标逐处实读全中，但**处数少一处**：`docs/batches/2026-11-01-affected-files-table-purge.md:1469` 逐字「**需求档零写**（笔主 = 主 agent）· **代码零改**」——与已计入的 `:1376` 同形同族、同属 §2，是**活断言**而非被枚举对象；`:1419` 的免责句只解释「本段含上述四条扫串（作为被枚举对象）」⇒ 域内（本档 §2 段）活断言 = 13，记录 = 12 | 在 §2.21.1 补第 13 行（`:1469`）并把处数改 13；` :1419` 免责句改成「本段自身的边界句亦属活断言，须计入」 |
| 2 | 记录可核性（免责句射程） | 🔵 | `:1419` 的免责句射程写「本段」，而 `:1394` 的域写「本档 §2 段」；域内另有提及落在免责句外：`:1321` 逐字「全批「需求档零改 / 未触」句一律读作本表」（属 §2.20.5、非本段）⇒「12 + 引用处」这个读法每次复扫都要再判一次「算不算提及」 | 免责句改按「扫串命中 = 活断言 ∥ 提及」二分写，并点名提及处由哪些行承载（`:1321` ∥ `:1394` ∥ 枚举表行）——复扫人只数活断言 |
| 3 | 记录可核性（映射句） | 🔵 | `:1413` 逐字「旧记 10 处 = 评审点名 3（`:417` ∥ `:748` ∥ `:1251`）+ 其余 7……只是旧记沿用了插入前的行号（全 −9）」——句里列的 10 个坐标是**现盘值**却称「旧记」，旧记（`:1323`）写的是 `:408` ∥ `:739` ∥ `:1242` 那一组 ⇒ 读者须自己做 −9 反推才能对上 | 该句改称「旧记那 10 处的现坐标」，并把旧值原样并列一次 |
| 4 | 集测基线（轮 2 #2 的落地残余） | 🔵 | `:1433` 已按盘写 `test/RTM.md` 并更正 §2.20.7；而 `:1345` 逐字「**基线 = 测试索引档 RTM**」原句仍在盘（append-only 段按 D7 不改写已落行）⇒ 同一份记录里基线名两个读法并存，只靠「更正」一句相连 | 无需再动；下次触碰 §2.20.7 时在该行加「（基线名与解析口径裁决见 §2.21.3）」 |

**计数**：🔴 × 0 · 🟡 × 1 · 🔵 × 3。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent 记录）

### 4.1 逐次裁定（逐字）

| 时点 | 用户原话 | 定了什么 |
|---|---|---|
| 18:14 | 「**设计档里不该有这些，这是批次档的职责，是你以前写错地方了，都要清掉，不要留。**」 | 开这件事 |
| 18:15 | 「**大也得做啊！**」 | 不接受「太大了先放着」 |
| 18:17 | 「**对呀，丙不是一样不该存在？所以，甲乙丙都应该清除掉。**」 | 三类全清，不留指针形 |
| 18:18 | 「**你另开一批干这事儿，现在就开始**」 | 另开批，立刻开工 |
| 18:20 | 「**乙你拦下来的两节也不该出现，那他妈也是批档的内容写错了地方！**」 | **规则面也要清** —— 要求那张表存在的句子一并废 |
| 18:21 | 「**自动跑完**」 | 整批令：本批全链跑到收口 |
| 18:23 | 「**方法论里应该把这些都改到批次档去**」 | 需求侧不是删义务，是**把义务挪到批档 §2** |

### 4.2 批准结论

**批准交付**：受影响文件表这一类批次账从设计档 / 需求档整批退场；它拉出的规矩面（评审维度 · 纪律条款 · 需求立法源）同步改到「该表归批档 §2」。

**用户 18:21 的「自动跑完」覆盖本批全链** —— 评审四轮、修正轮、收口、核销、提交一路跑完，中途不再逐轮请示。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

## 6. 验证与收口（主 agent）

### 6.1 机检门

```
doc_check(mode:"gate")  →  DOC-CHECK GATE: PASS
轮 3 / 轮 4 各跑一次；范围 = 本轮触达档全部；0 段问题
```

### 6.2 收口复核（父侧实读，非转述）

**13 处活断言计数** —— 本席自扫四条扫串（`需求档未触` ∥ `需求档零改` ∥ `需求面未触` ∥ `需求档零写`）于本档 §2 段：

```
实得 13 处：417 · 491 · 565 · 653 · 744 · 748 · 843 · 933 · 1085 · 1172 · 1251 · 1376 · 1469
与 §2.22 写入的 13 一致
```

**`:1415` 判为提及** —— 它是「漏 2 处」那句的引述行，不是对需求面下的判断。设计席自己的分类与此一致。

**差值核**（`:1511`）：`408+9=417 · 739+9=748 · 1242+9=1251 · 482+9=491 · 556+9=565 · 644+9=653 · 834+9=843 · 924+9=933 · 1076+9=1085 · 1163+9=1172` —— 10/10 对。

### 6.3 评审链

| 轮 | 结论 | 关键发现 |
|---|---|---|
| 1 | changes-required（🔴1 · 🟡7 · 🔵2） | **🔴 = 我改需求档早了一轮**：F-R24a 的数值来源仍指第六轮已删的「尺寸档位结论抽查」条 |
| 2 | pass（🔴0 · 🟡2 · 🔵4）但 **token 未发** | 评审写了 §3 却没写段级状态行 —— 机制拒发是对的：**只写不签 = 没签** |
| 3 | pass（🔴0 · 🟡1 · 🔵3） | 🟡 = 枚举 12 处实读全中，**但漏第 13 处**（`:1469`），而免责句把它吸成「引用处」 |
| 4 | 修完复核 | 13 处与盘一致 |

### 6.4 本批争议最大的三处，逐处交代

**① 我判窄了两次判据，都是设计席拿盘上的数驳回的**

- 我说「删空壳标题要连带改枚举」→ 它读盘：**两个枚举本来就不含该项，20↔20 成立，无需改。**
- 我说「`:275` 的行数列要删」→ 它读盘：**该列逐行相加 = 181 = 覆盖裁决行数，是覆盖对账，不是批次账。**

**② 删表带走状态，本批发生四次**

`TOOLS` 实施面坐标 · `MANIFEST` 编辑点 · `AGENT-LOOP` 端侧对位 · `CONTEXT-COMPACTION` 15 类坐标。

**前三次已补回，第四次经「逐列判」实核为「已在盘、无需新建」。** 判据已落 §1.20：**格子里答「这个机制在哪实现」= 状态；答「这批落了几行」= 账。**

**③ 规矩面改动带理由**

`ADVISOR-CONVERGENCE` §9 与 `DOC-DISCIPLINE` 八处改写，**每处都写了为什么**，用的就是这句：**那张表今天就对、明天就错，没有人会回来改它。**

### 6.5 债务（一条都没留在 prose 里）

| 台账行 | 内容 | 来源 |
|---|---|---|
| `#1954` | `AGENT-LOOP-SUBAGENT` 过 800 硬限拆点（原登记句随节删） | 设计席抄录 → 父侧入账 |
| `#1955` | `agent/helpers.mjs` 贴 500 线，越档则拆 `agent/offload.mjs` | 同上 |
| `#1956` | `E2E-TESTING` 口径注指向已退场的 `checkConfig.lineCounts` | 评审轮 1 |
| `#1957` | `SESSION` 尺度结论块拆点（启动屏族外提） | 设计席抄录 → 父侧入账 |
| `#1958` | `config.mjs:32` ∥ `:171` 注释指已删的 §6.16.9（产品码面） | 设计席上抛 |
| `#1959` | `doc_check` 把 `test/RTM.md` 判档缺（仓根可解析路径在 `docs/` 外失效） | 设计席上抛 |

**`#1922` 未新开** —— ssh-transport 拆分债早就在册，只补了一句「设计档载体已删，本行是唯一载体」。

### 6.6 复核项

- **`§2 ↔ 设计档对账`**：§2 引的 `300 / 500 / 800` 阈值与 `DOC-DISCIPLINE` §3.10 一致；轮 3 逐处实核。
- **暂缓批复核：无。**
- **前批遗留交叉核对：无。**
- **用户面文档同步：无**（零代码、零用户可见能力变更）。
- **机检门：PASS。**

### 6.7 本批自认

**我在本批犯了同一类错三次**：退两列 → 改指 → 留两节规则。**每次都在找「能不能保住一点」，而不是问「它凭什么存在」。**

**用户 18:17 / 18:20 两句话把这条路堵死**：「丙不是一样不该存在？」「乙你拦下来的两节也不该出现」。

**留下的判据**（不留在我的记性里）：§1.15 一问判据 · §1.20 逐列判 · §1.22 账与规矩之分 · §2.21.2「插入会顶偏其后全部坐标」。
