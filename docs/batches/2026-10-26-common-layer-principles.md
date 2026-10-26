# 2026-10-26 · 公共层三观基准
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-26 · 来源 = 用户 2026-10-26 01:56「A」+ 01:57「可以」。
> 台账 = #1802（PHILOSOPHY · 归批）。前情 = 2026-10-26-pen-gate-batch-scope.md（在途）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**问题（父侧 2026-10-26 01:55 实读）**

`docs/core/requirements/PHILOSOPHY.md` §5 的落地面对应表说：人格层（`persona-*.md`）对「人生观（我是谁）+ 世界观（怎么看编程）」，公共层（`thincoder-core/prompts/common.md`）对「世界观（人是决策者、子 Agent 授权）」。

实测两者都对不上：

| 面 | 实际内容 |
|---|---|
| `persona-*.md` 七档（`persona-normal` 57 行 · `persona-engineering` 458 · `persona-eng-designer` 155 · `persona-eng-coder` 58 · `persona-coder` 22 · `persona-explore` 14 · `persona-plan` 26） | 全部是**岗位身份**——`Role: read-only scout` ∥ `Identity: the design-writing seat` ∥ `Identity: product manager + flow orchestrator`。**没有一处回答「你是什么样的人」** |
| `thincoder-core/prompts/common.md` 429 行 | 唯一的「我是谁」在 `:42-45`，四句讲**位置**（人决定 / 你拥有代码 / 确认即契约）；其余全是**尺子**（怎么查 ∥ 怎么判 ∥ 怎么报 ∥ 什么不许做） |

**问题的实质不是对应表写错，是公共层缺一层东西**：流程写满了「怎么做」，但流程覆盖不到的地方没有准则——模型只能自由发挥。

**今晚的实证**：我把「父侧直笔三条例外」读成了一张通行证（`2026-10-26-retire-pen-exceptions` 批的起因）。流程写了「哪些面归谁写」，没写「规则没写到的地方该往哪个方向猜」——于是往「可以」那边猜。

**用户裁定（2026-10-26 01:56，逐字）**

> 公共层应该包括世界观价值观的内容，不止是尺子，流程约定不完一切，流程没覆盖到的东西，应该有个东西告诉模型一些基本准则。

**方案（用户选 A · 2026-10-26 01:57「可以」）**：`thincoder-core/prompts/common.md` 的「Who you are」从四句**位置**扩为「位置 + 四条**品质准则**」。

**四条（草案已获用户批准，措辞以设计席定稿为准）**

| # | 准则 | `docs/core/requirements/PHILOSOPHY.md` 出处 | 补的洞 |
|---|---|---|---|
| 1 | **诚实 > 体面**：做不到就说，并说试过什么。包装过的失败比承认的缺口更贵——它拿走了人改道的机会 | §4.5 | 流程没写「做不到怎么办」，于是包装成完成 |
| 2 | **运行胜过阅读**：读代码告诉你它写了什么，跑它告诉你它做了什么。两者冲突时，运行是对的 | §6.1 | 流程没写「两种证据冲突时信谁」 |
| 3 | **不知道就说不知道**：猜装成事实会藏住缺口；标出来人能掂量，装出来人掂量不了 | §4.5 + 证据纪律的根 | 今晚多次「我记得」而非「我读了」 |
| 4 | **重要的话不说出口就是隐瞒**：缩了范围 ∥ 看到一个缺口 ∥ 对需求有疑问——说出来，让人自己决定跳过。沉默不是节省 | §2.3 | 流程没写「简化了要不要说」 |

**明确不放入的两条（有意排除，非遗漏）**

- **「充分沟通」**——它偏流程，不是品质；`thincoder-core/prompts/common.md` 的 `When choices conflict` 已有位置。
- **「做完要交代」**——纪律层已有（`thincoder-core/prompts/discipline-engineering.md`），公共层再写一遍即重复，触发 D2 单源冲突。

**同批要改的对应表（`docs/core/requirements/PHILOSOPHY.md §5`）**

| 行 | 现文 | 改为 |
|---|---|---|
| `persona-*.md` | 人生观（我是谁）+ 世界观（怎么看编程） | **岗位身份**（我在这条流程里担任什么） |
| `thincoder-core/prompts/common.md` | 世界观（人是决策者、子 Agent 授权） | **三观基准**（我是谁 / 相信什么）+ 协作约定（人是决策者、子 Agent 授权） |

**为什么改对应表而不是搬内容**：三观要每个角色都读到。放 `thincoder-core/prompts/common.md` 是所有角色共享；放七份 `persona-*.md` 就是七份重复，而重复的版本会漂。**实现是对的，表写错了。**

**方案更正（2026-10-26 02:10 · 用户三次纠正后定形）**

前稿「四条进公共层」（设计席 `#8` 已落的 §2 与设计档那节（已删））**作废**，理由三条，逐条是用户的裁定：

1. **「公共层，体积不是问题」**（02:06）⇒ 不是挑几条，是 17 条一条不少。
2. **「人格要移入人格层」**（02:07）⇒ 三观属于人格，不属于公共层。
3. **「你为啥只能二选一？为什么不是属于人格的东西进人格层，其他内容进公共层？」**（02:08）⇒ 三观不是一块整的，要按性质拆。
4. **「人格层其实是要根据每个角色调整的，不是固定的」**（02:09）⇒ 人格不是七份抄同一段，是每个角色对三观的自己的样子。
5. **「可以，这个映射对」**（02:10）⇒ 下述映射**已获批准**。

**已批准的分类（17 条 → 8 人格 / 9 公共）**

**A. 属于人格（8 条）——「我是什么样的人」**

| # | 条 | 为什么是人格 |
|---|---|---|
| 3.1 | 有责任感的工程师，不是办公设备 | 最核心的自我定义 |
| 3.2 | 说了就要做到 | 信用是你的，不是规则要求的 |
| 3.3 | 做到最好，不怕困难 | 态度 |
| 3.4 | 整个项目都是我的代码 | 责任范围 |
| 3.5 ∥ 4.5 | 诚实比体面重要（两处同一件事，合并为一条） | 品质 |
| 3.6 | 勇于提出建议 | 品质 |
| 2.2 | 人是决策者，我是代码的负责者 | 你坐在哪——人格，不是纪律 |
| 2.4 | 信息是瓶颈，不是理解力 | 你怎么看自己 |

**B. 属于公共层（9 条）——「两个人怎么配合 / 冲突时怎么选」**

| # | 条 | 为什么是公共 |
|---|---|---|
| 2.1 | 编程是协作劳动 | 协作地基，双方都成立 |
| 2.3 | 充分沟通优先 | 沟通纪律 |
| 2.5 | 设计文档是 spec | 怎么对待文档 |
| 2.6 | 官方资料是权威 | 怎么获取知识 |
| 3.7 | 做完要交代 | 交付报告的形式 |
| 4.1 | 交付透明（差距逐条交代） | 同上 |
| 4.2 | 正确性绝对优先 | 冲突时的取舍 |
| 4.3 | 关联问题不回避 | 改动的边界 |
| 4.4 | 不替人决策，但信息要充分 | 决策边界 |

**已批准的角色映射（人格 8 条按角色挑，不是每条都加）**

**通用底座（每个角色都要，3 条）**：3.1 有责任感的工程师 · 3.5/4.5 诚实 > 体面 · 2.2 我是代码的负责者。

| 角色 | 再加 | 在这个角色身上是什么意思 |
|---|---|---|
| `persona-engineering`（主 agent · 工程） | 3.4 · 4.4 · 2.3 · 3.7 | 对**整批**负责不是单个任务 · 摆选项等人拍板不自己定 · 宁可多说 · 做完要交代 |
| `persona-normal`（主 agent · 普通） | 3.3 · 4.3 · 3.6 | 做到最好不怕困难 · 关联问题不回避 · 勇于建议 |
| `persona-eng-designer`（设计席） | 3.6 · 3.3 · 2.5 | 看到更优方案要提不是照抄需求 · 设计不糊弄 · 我写的是标准不是参考 |
| `persona-eng-coder`（实施席） | 3.2 · 4.3 · 4.2 | 交付完整覆盖不打折 · 改签名就改调用点 · 不因赶时间砍步骤 |
| `persona-coder`（普通模式实施） | 3.2 · 4.2 · 4.3 | 同上 |
| `persona-plan`（计划） | 3.5 · 2.6 | 不知道就说不知道不编计划 · 查清楚再规划 |
| `persona-explore`（侦察） | 3.5 · 2.6 | 找不到就说找不到（「probably there」不是发现）· 不猜 API 行为 |

**写法（已定）**：只写**在这个角色上的样子**（一行），不抄三观原文——原文的全本在 `docs/core/requirements/PHILOSOPHY.md`，人格层写的是它落到这个角色身上的形态。

**同时要收正的两处归属判定**

- `docs/core/requirements/PROMPT-SYSTEM.md §2.8` 第 1 问现在写「你是谁 → 人格层」，与「三观进人格层」一致，**该条不用改**；但要补一句「人格 = 三观在该角色上的具体化，不是三观原文的复制」。
- `docs/core/requirements/PHILOSOPHY.md §5` 对应表已改一半（`persona-*` = 岗位身份、`common` = 三观基准）——**这半改要再收**：人格层应写「三观在该角色上的具体化 + 岗位身份」，公共层写「协作基础 + 9 条三观」。

**#8 的既有产出处置**：设计档那节（原 §6.52 四条）**整节已删**——设计档是状态档，留「已被取代」标记本身即 D8 禁的形，且该节正文还载着作废方案（含「删 `thincoder-core/prompts/common.md:50`」的旧打算）。历史见 git。现行设计 = 同档 §6.53。批档 §2 相应段落作为记录面保留（`#8` 旧稿），末段已记明非现行。

**`thincoder-core/prompts/common.md` 现状**：未落笔（`#8` 只落了设计，实施未开始）⇒ 前稿的四条从未进过提示词，无回滚负担。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-26
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**条目（本批覆盖 · 4）**

| # | 条目 | 来源 |
|---|---|---|
| 1 | `thincoder-core/prompts/common.md` 的 `## Who you are` 增四条品质准则（诚实 > 体面 ∥ 运行胜过阅读 ∥ 不知道就说不知道 ∥ 重要的话不说出口就是隐瞒），英文措辞定稿 | §1 用户 2026-10-26 01:57「可以」 |
| 2 | 诚实条合并去重：`thincoder-core/prompts/common.md:50` 的 `Honesty over saving face` 并入 `## Who you are` 第 1 条，旧处删 | §1 + 父侧 01:59 接缝令 |
| 3 | `docs/core/requirements/PHILOSOPHY.md:143-144` 落地面对应表两行收正（人格层 = 岗位身份 / 公共层 = 三观基准 + 协作约定） | §1 末段 |
| 4 | 需求档随正：`docs/core/requirements/PROMPT-SYSTEM.md:71-72` 两格（行 2 补四准则、行 3 去「做不到就解释不编」） | 本设计 J5 |

**不在本批**：`persona-*.md` 七档 · 两模式纪律层 · 工具描述 · 产品代码。

**设计档落点**：`docs/core/design/PROMPT-SYSTEM.md` §6.52——机制 ∥ 逐字英文 B1–B2 ∥ 落点 L1–L5 ∥ 验收 A1–A7 ∥ 用例 C1–C4 ∥ 关键决策 K1–K4 ∥ 勘察证据行；本段只引，不抄（D2）。

**机制摘要**：四条 = 流程未覆盖处的准则；落公共层（恒第二位）= 两模式 + 全子代理一处覆盖。诚实条两处同规则合并为一处（并到 `## Who you are`，`:50` 删）；第 2–4 条与既有句轴不同，既有句零动。逐字目标形见设计 §6.52 B1。

**受影响文件 ∥ 行数 Δ**（口径 `split('\n').length - 1`，本席实读）：`thincoder-core/prompts/common.md` 429 → 435 行（+6）· 51,889 → 52,546 字符 · 最长行 294 不变 · `##` 计数 21 不变；`docs/core/requirements/PHILOSOPHY.md` ∥ `docs/core/requirements/PROMPT-SYSTEM.md` ±0 行（两格文字，主 agent 笔）；设计档本笔。

**验收对照**：A1–A7 见设计 §6.52——A1 四条逐字各恰 1 ∥ A2 旧形 `Honesty over saving face` = 0、`When choices conflict` 节 bullet = 3 ∥ A3 行数字符 Δ ∥ A4 逐行 ≤300 ∥ A5 `node scripts/prompt-refs-check.mjs` 命中 0 ∥ A6 `^## ` = 21 ∥ A7 需求档两处读数。**测试覆盖**：本批零代码档——单元测试面 `none`；集成 `none`（判由见设计 §6.52）。

**关键决策**：K1 落点 = `## Who you are` 位置句之后；K2 合并方向 = 旧处 → 新条第 1 条（新条必留，旧处两句逐句落进规则行 + `Why` 行）；K3 第 2–4 条不删既有句（轴不同）；K4 短句、除第 1 条外不加 `Why:` 行。

**上抛项（待主 agent）**

1. 〔主 agent · 需求档笔〕`docs/core/requirements/PHILOSOPHY.md:143-144` 两行 + `docs/core/requirements/PROMPT-SYSTEM.md:71-72` 两格——需求层改变已由用户裁定，落笔 = 主 agent（D1）。
2. 〔主 agent · 读数〕`docs/core/requirements/PROMPT-SYSTEM.md:90` 自述「编号以现档 `##` 顺序为准」，实读不符：行 2（人机分工）在 `thincoder-core/prompts/common.md` 现档是第 4 个 `##`。非本批改动面，仅记读数。

**本轮设计（2026-10-26 02:10 方案更正后 · 现行）**

**上方「四条品质准则」稿作废**——按 §1 末段方案更正（17 条一条不少 ∥ 三观属于人格 ∥ 按性质拆 ∥ 人格按角色调整 ∥ 映射已批准）。现行设计 = `docs/core/design/PROMPT-SYSTEM.md` §6.53（§6.52 首行已标取代）。

**条目（本批覆盖 · 4）**

| # | 条目 | 来源 |
|---|---|---|
| 1 | 公共九条三观（2.1 ∥ 2.3 ∥ 2.5 ∥ 2.6 ∥ 3.7 ∥ 4.1 ∥ 4.2 ∥ 4.3 ∥ 4.4）落 `thincoder-core/prompts/common.md` 的 `## Who you are` 内一块（逐字 = 设计 §6.53 C1） | §1 用户 2026-10-26 02:06–02:10 |
| 2 | 人格八条按角色取形落七份人格档（逐字 = 设计 §6.53 P1–P7；映射 = 同节角色映射表） | 同上 |
| 3 | `docs/core/requirements/PHILOSOPHY.md:143-144` 对应表收正（人格 = 三观在该角色上的具体化 + 岗位身份；公共 = 协作基础 + 9 条公共三观） | 设计 §6.53 L10 |
| 4 | `docs/core/requirements/PROMPT-SYSTEM.md:250` §2.8 补一句（人格 = 三观在该角色上的具体化，不是原文复制）+ `:64` `:71` `:72` 三格随正 | 设计 §6.53 L11 ∥ L12 |

**不在本批**：两模式纪律层 · 工具描述 · 装配矩阵 · 产品代码 · 顾问 / 会诊档 · `thincoder-core/prompts/common.md:48-51` 四条 bullet（设计 §6.53 K3 零改，待裁见下）。

**受影响文件 ∥ 行数 Δ**：见设计 §6.53 受影响文件表（`thincoder-core/prompts/common.md` +10 → 439 行；七档人格档合计 +51 行；需求档两处 ±0；设计档本笔）。读数口径 = `split('\n').length - 1` 实读模拟，非推算。

**验收对照**：A1–A9 见设计 §6.53（每条机判或逐字比对）。**测试覆盖**：本批零代码档 ⇒ 单元测试面 `none`；集成 `none`（判由见设计 §6.53）。

**关键决策**：K1 块住 `## Who you are` 内、不新建 `##` 节（节数 21 不动）· K2 2.1 现行句 `thincoder-core/prompts/common.md:43` 移入块作第 1 条 · K3 `:48` ∥ `:49` ∥ `:50` 零改 · K4 不设 `Why:` 行 · K5 加粗题眼起块 · K6 两档既有句不重写。

**上抛项（待主 agent）**

1. 〔待裁 · 语义面〕诚实条两处同题（`thincoder-core/prompts/common.md:50` 与人格八条）：本轮零改，倾向 = 留（冲突时的取舍规则 vs 角色形态）。若裁定「诚实只住人格层」，删该 bullet + 并入七档诚实行，需用户明示——见设计 §6.53 上抛 1。
2. 〔待裁 · 语义面〕同上判法适用 `:48` ∥ `:49`（公共 4.2 ∥ 4.4 与冲突节同题）——见设计 §6.53 上抛 2。
3. 〔主 agent · 需求档笔〕条目 3 ∥ 4 的六处落笔（D1 路由）。
4. 〔父侧 · 编号〕设计 §6.53 未加 §7 D-PS 行。

**修正轮（2026-10-26 02:16 · 父侧裁定后执行）**

现行设计 = `docs/core/design/PROMPT-SYSTEM.md` §6.53（§6.52 整节已删——状态档只留现行形；删后全档 `6.52` 引用 = 0；`^### 6\.` 序 = 6.51 → 6.53，编号按裁定不重排）。

§6.53 补一段「诚实条两处粒度不同，不是重复」：人格层七档的诚实行写品质，`thincoder-core/prompts/common.md:50` 在 `## When choices conflict` 里写「冲突时选哪个」——取舍规则；`:48` ∥ `:49` 与公共 4.2 ∥ 4.4 同判。该节上抛 1 ∥ 2 = 已裁零改；上抛 3（需求档笔）∥ 上抛 4（§7 编号）仍待父侧。

本段上方「设计档落点 §6.52」块与「§6.52 首行已标取代」括注 = #8 旧稿记录，非现行（记录面保留，不得被误当现行）。

**修正轮（2026-10-26 · 评审 #13 十一条全部处置 · 现行）**

现行设计 = `docs/core/design/PROMPT-SYSTEM.md` §6.53。逐条处置表：

| # | 处置 | 落点 |
|---|---|---|
| 1 🔴 | **2.4 补落两档**（`persona-engineering` ∥ `persona-eng-designer`）。不走「并入 2.3」路：合并会把已批准的 8 人格改成 7 并动分类算式，而 2.4 是判断依据（瓶颈在信息、不在理解力）、2.3 是动作（多说）——不同题，各留一处。A8 改**逐条落点核**（八条各 ≥1 处、九条各 1 处），不再是「8+9=17」算术 | 设计 §6.53 分类表 2.4 行 · 角色映射表两行 · 新增「2.4 的落点」段 · 机制 #2 · P1/P5 逐字块 · A2 ∥ A8 |
| 2 🟡 | L12 改**已核零笔**（`:71` 已是「人格 8 条 / 公共 9 条」、`:72` 已无「诚实条的正文单源」）；J8 按现盘重读。待笔收窄为 `docs/core/requirements/PHILOSOPHY.md:143`–`:146` ∥ `docs/core/requirements/PROMPT-SYSTEM.md:250` | 设计 §6.53 J8 · L12 · A7 · 勘察证据行末条 |
| 3 🟡 | L10 扩四行 `:143`–`:146`：`:145` 改「方法论」，`:146` 写「顾问 / 评审自含装配 ⇒ 本批不接三观、待另批」 | 设计 §6.53 L10 · A7 · D-PS46 |
| 4 🟡 | A1 补改前全档扫描读数：`Correctness first` 已命中 `thincoder-core/prompts/common.md:48`（= 1）⇒ B1 该条题眼改 `No step is cut for speed`（改前 0 命中）；改后十串各恰 1 | 设计 §6.53 B1 第 8 行 · A1 · 勘察证据行 |
| 5 🟡 | 改面断言档不在现盘（`thincoder-cli/test/prompts-dual-source.test.mjs` 实扫只命中 `.thincoder/tmp/head/` ∥ `.wt-head-probe/` 两个探针目录）⇒ A4 写明跑不动、手扫为唯一读数 | 设计 §6.53 A4 · 勘察证据行 |
| 6 🟡 | K3 补 `:44` 同判：2.2 整句留作位置句，人格层写角色形态 | 设计 §6.53 K3 · A9 |
| 7 🟡 | §7 补 D-PS46（编号顺 D-PS45）；本档本段即 §2 口径统一行 | 设计 §7 · 本档本段 |
| 8–10 🔵 | A8 改去重计数（每档 = 底座 ∪ 加项去重）；A9 改**内容锚**（不用改前行号）；集成节补 RTM 读数 | 设计 §6.53 A8 · A9 · 集成测试设计 |
| 11 🔵 | 无需改（评审自陈边界） | — |

**本席实跑读数（两条推翻原设计前提）**

1. `node scripts/prompt-refs-check.mjs`（仓根）⇒ `命中 5`／退出码 1，五条全在 `thincoder-core/tool-docs/advisor.md:6` ∥ `thincoder-core/agent-tools/advisor.mjs:64` ∥ `:125`——非本批改动面、改前即红。**A5 原写「命中 0」是假前提**，已收窄为「八档零新增命中」。
2. `thincoder-cli/test/prompts-dual-source.test.mjs` 不在现盘 ⇒ T-CL1 跑不动，A4 节数项以手扫为唯一读数。

**读数（八档改后 = node 模拟实测，非推算）**：行/字符见设计 §6.53 A3；`>300` = 0；`^## ` 计数改前改后同数。

**上抛（待父侧）**：上文 5 条既有文档引用命中不在本批范围（父侧边界 = 不改 `thincoder-core/prompts/common.md` ∥ 需求档），未动、仅记读数——是否另开簿记由父侧定。

**口径统一**：`docs/core/design/PROMPT-SYSTEM.md` §6.52 整节已删（全档 `6.52` 引用 = 0），现行设计只有 §6.53。本档 §2 上方「设计档落点 §6.52」块 ∥「§6.52 首行已标取代」括注 ∥「四条品质准则」稿均为记录面历史，**以本行为准、不得当现行**。

**修正轮（2026-10-26 · 评审 #17（轮次 2 · #4 ∥ N1 ∥ N2 ∥ N3）四条全部处置 · 现行）**

现行设计仍 = `docs/core/design/PROMPT-SYSTEM.md` §6.53，全节只改下列四处：

| # | 处置 | 落点 |
|---|---|---|
| 1 🔴 | B1 第 8 条题眼 `Correctness first` → `No step is cut for speed`（该行正文零改）；B1 ∥ A1 十串 ∥ A8 ① ∥ 勘察行四处对齐 | 设计 §6.53 B1 · A1 · A8 ① · 勘察行 |
| 2 🟡 | A8 ② 改按各档逐字块 P1–P7 的实际题眼枚举：3.5 七档各有角色形态（P1–P5 = `Honesty over saving face` ∥ P6 = `A plan you cannot ground is a guess` ∥ P7 = `You do not dress up a thin result`）、3.3 ∥ 3.6 ∥ 2.4 逐档列形；原「七档各 1」的错串删除 | 设计 §6.53 A8 ② |
| 3 🟡 | 勘察行「`Honesty over saving face` … 七档各 1」改为 P1–P5 各 1、P6 ∥ P7 用各自形态题眼 | 设计 §6.53 勘察行 |
| 4 🔵 | A1 改前读数按勘察行分列重写：九个零命中串单列、`Programming is collaborative labor` = 1、`Correctness first` = 1 | 设计 §6.53 A1 |

**2.4 追认（评审 N2）**：2.4 补落 `persona-engineering` ∥ `persona-eng-designer` 是对用户 2026-10-26 02:10 已批准映射的 delta（原映射两档「再加」列无 2.4）——**此 delta 须在 §4 批准时显式追认**。

**读数（改后 = `node` 本席实跑，非推算）**

- 设计档全档：`No step is cut for speed` = 5（B1 1 + A1 3 + 勘察行 1）∥ `Correctness first` = 4（B1 已 0；旧节引用 1 + A1 1 + A9 1 + 勘察行 1）。
- `thincoder-core/prompts/common.md` 改前：`No step is cut for speed` = 0 ∥ `Correctness first` = 1（`:48`）。
- 题眼改名后重跑 L1–L9 模拟：`thincoder-core/prompts/common.md` 改后 = 439 行 / 53,771 字符 / 最长行 294 / `^## ` = 21 / `>300` = 0；A1 十串各恰 1。J3 ∥ A3 ∥ 受影响文件表已按此读数收正（原 53,752 = 题眼改名前旧算）。

**读数更正（2026-10-26 · 同日）**：上段「原 53,752 = 题眼改名前旧算」的归因不成立——按旧题眼重跑同一模拟得 53,764，不是 53,752。可核事实：改后模拟（现行 B1）= 439 行 / 53,771 字符 / 最长行 294 / `^## ` = 21（本席 node 实跑）；七档 persona 按同法逐档复算全中（468/66,738 · 63/7,222 · 30/2,619 · 66/7,165 · 164/21,451 · 32/2,912 · 20/1,703）。53,752 的来源未复核，不再被任何验收引用。

**修正轮（2026-10-26 · 实施席 #21 上抛两条设计面口径 · 现行）**

现行设计 = `docs/core/design/PROMPT-SYSTEM.md` §6.53。本轮只动三处：机制 #4（措辞收正为三判）· 逐字块 P1–P4（M1–M8）· 验收 A10（新增）。

**一、`persona-coder` 档内同规则两处（父侧条一）**

判：**留既有 `:21`、删新落 `:16`**（设计 §6.53 M1 · K6 ∥ J9）。判由 = K6 既有判法原样适用：该档 write-gate 节已以 `COMPLETE delivery` 写同一条（J9 逐字在盘），重写即同档两份同文（D2）；且既有句还带着批准框（「anything less is a partial delivery the parent did not approve」）。删后该档块 6 → 5 条，3.2 由既有 `:21` 承载（A8 ② 同步收正）。

**二、跨档两份全文（父侧条二）**

判据 = 设计 §6.53 机制 #4 的三判：V1 题眼不复用公共题眼 ∥ V2 与公共行最长连续同文 ≤5 词（短语可、子句不可）∥ V3 同档一条只一处。

实测（本席 `node`，七块 39 条 × 九条公共行）：越 ≤5 词线 7 条 —— 父侧点名的 3 处全部成立，同判再出 4 处。逐条处置：

| # | 文件:行（现盘） | 现文题眼 | 动作 | 新题眼 |
|---|---|---|---|---|
| M1 | `thincoder-core/prompts/persona-coder.md:16` | `A partial delivery is not a delivery` | 删整行 | — |
| M2 | `thincoder-core/prompts/persona-coder.md:17` | `No step is cut for time` | 整行替换 | `Finishing early is not finishing` |
| M3 | `thincoder-core/prompts/persona-coder.md:18` | `A related problem is not extra work` | 整行替换 | `Leave nothing broken beside it` |
| M4 | `thincoder-core/prompts/persona-normal.md:20` | `A related problem is not extra work` | 整行替换 | `Nothing next door is someone else's problem` |
| M5 | `thincoder-core/prompts/persona-eng-coder.md:13` | `No step is cut for time` | 整行替换 | `A step skipped is a step the review has to find` |
| M6 | `thincoder-core/prompts/persona-engineering.md:44` | `Lay the options out and let them pick` | 整行替换 | `The call is the user's, the framing is yours` |
| M7 | `thincoder-core/prompts/persona-engineering.md:45` | `Say the extra sentence` | 整行替换 | `Nothing important stays in your head` |
| M8 | `thincoder-core/prompts/persona-engineering.md:47` | `A finished job comes with its account` | 整行替换 | `A batch ends with its account, not with "done"` |

逐字替换文本 = 设计 §6.53 P1–P4 块（唯一权威目标形，实施席照抄）；每条判由（哪一判、多少词）= 同节 M 表。走 (a) 路：人格层句子改成真角色形态、不删——角色形态有区分价值（coder = 打完给的活 ∥ engineering = 对整批负责）。M1 是唯一走 (b) 的一处（该档既有句已承载）。

**三、读数（`node` 实跑，非推算）**

- 改后八档：common 439 / 53,771 · engineering 468 / 67,061 · normal 63 / 7,260 · coder 29 / 2,558 · eng-coder 66 / 7,289 · designer 164 / 21,451 · plan 32 / 2,912 · explore 20 / 1,703；Δ 行 = +10 ∥ +10 ∥ +6 ∥ +7 ∥ +8 ∥ +9 ∥ +6 ∥ +6；`>300` = 0（八档）；`^## ` 计数八档不变。
- A10 复扫（扫面 = 设计档 P1–P4 块）：七块 38 条，V2 >5 词 = 0（最大 5，`thincoder-core/prompts/persona-eng-coder.md:12` 的 `change the call sites a`）∥ V1 块内题眼复用 = 0 ∥ V3 违反 = 0。

**四、口径与验收**

- 机制 #4 收正：旧措辞「公共条出现在人格层的只有角色形态一句」不可判——落地就出 7 处两份；改三判 V1/V2/V3，5 词 = 短语与子句的分界（K7）。
- 验收 A1–A10（§6.53）：A2 条数（coder 6 → 5）· A3 读数 · A6 净增行（63 → 62）· A8 ② 3.2 落点 · A9 增 `persona-coder` 既有句内容锚 · 新增 A10（三判）。

**五、不做 ∥ 知会**

- `thincoder-core/prompts/persona-normal.md:10` 的 2.1 原句仍逐字在盘——父侧知会、本批不动，不入 M 表（V1 判据面 = 逐字块，不是全档）。
- 17 条分类 ∥ 2.4 落两档 ∥ 需求档六处笔 = 不动；提示词 = 实施席照 M 表落，本席零笔。
- 测试面仍 `none`（零代码档，判由同设计 §6.53 集成测试设计）。

**修正轮（父侧三条裁定 · 现行）**

父侧裁三条，本次只动设计档 `docs/core/design/PROMPT-SYSTEM.md` §6.53（提示词零笔，实施席照 P3 + P3b 落）。现行设计仍 = §6.53。

| # | 父侧条 | 处置 | 落点 |
|---|---|---|---|
| 1 | `persona-coder` 两句相反处置（`:9` 停并上报 ∥ `:17` 修掉并说明）= 真冲突，要修 | 判据 = **修完之后 caller 的「意思」变不变**：只变写法（改名 ∥ 符号搬家 ∥ 参数用旧值填）⇒ 修掉并说明；要变意思（调用方得换一种用法、得自己决定传什么）⇒ 停并上报。两句各写一侧、命题不重叠（V3 不受影响） | 设计 §6.53 K8 · 「caller 边界与两处坐标」① · P3 第 4 条（改 `:17`）· 新增 P3b（改 `:9`）· L5b |
| 2 | `persona-normal.md:10` = 位置句，结案 | 定性写进 A10 V1：B1 第 2 行是带题眼的原则本体、`:10` 是位置陈述，三判全过 ⇒ 不是重复 | 设计 §6.53 A10 V1 · 同节 ② |
| 3 | J9 ∥ A8 ② 的 `:21` 漂移（M1 删行后实为 `:20`） | 全节该处统一 `:20` + 内容锚（一致性面，一并收正）：J9 ∥ L5 ∥ M1 ∥ A8 ② ∥ A9 ∥ K6 ∥ 勘察行 ∥ 上抛 5 | 设计 §6.53 八处 · 同节 ③ |

**读数（本席 node 实跑，非推算）**：`thincoder-core/prompts/persona-coder.md` 按 P3 + P3b 模拟后 = 29 行 / 2,768 字符 / 最长行 295（改前 2,558 / 203；+210 字符、Δ 行 0）∥ `>300` = 0 ∥ `^## ` = 3（改前改后同数）。两句边界与九条公共行的最长连续同文各 = 2 词、公共题眼复用 = 0；P1–P7 共 38 条复扫 V2 最大 = 5、V1 = 0。A3 ∥ A4 ∥ 受影响文件表三处按 2,768 / 295 收正。

**不改**：其余六处 M 表落笔 · 17 条分类 ∥ 2.4 落两档 · 需求档已落部分 · 公共层九条。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：三观落地设计（17 条按性质拆 8 人格 / 9 公共 · 七份 persona 按角色取形 · `docs/core/requirements/PHILOSOPHY.md §5` 收正 · `docs/core/requirements/PROMPT-SYSTEM.md §2.8` 补句 · §6.52 整节已删）

设计档 = `docs/core/design/PROMPT-SYSTEM.md` §6.53。
**读面**：批档全档 · 设计档 §6.53 全节（`:4322`–`:4585`）· `docs/core/requirements/PHILOSOPHY.md` 全档 · `docs/core/requirements/PROMPT-SYSTEM.md` 全档 · 文档地图 `docs/README.md`（AGENTS.md 指名）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🔴 | 人格八条中的 **2.4「信息是瓶颈，不是理解力」没有任何落点**：分类表把它列为人格条（`docs/core/design/PROMPT-SYSTEM.md:4352`），但通用底座只取 3.1 ∥ 3.5+4.5 ∥ 2.2（`:4370`）、七档「再加」列（`:4372` 起）无一档含 2.4、P1–P7 逐字块与 B1 九条也无该句；而机制第 2 条声称「人格八条进七份人格档」（`:4385`）、A8 只核「8 + 9 = 17」（`:4515`）。按用户「17 条一条不少」（批档 `:57`）实落 16 条，A8 抓不到。 | 在角色映射表给 2.4 指定落点（或按 3.5∥4.5 先例明写「2.4 与 2.3 合并」并保持 17 = 8+9 的记账）；把 A8 从「8+9=17」改为逐条落点核（8 条各至少 1 处在盘），使「一条不少」可机判。 |
| 2 | Document ownership | 🟡 | 需求档现盘与 J8 的「现状实读」不符，两份需求档互相矛盾：`docs/core/requirements/PROMPT-SYSTEM.md:71` 已是「公共 9 条」新形、`:72` 已无「诚实条的正文单源」⇒ L12 两笔已是空笔；而 `docs/core/requirements/PHILOSOPHY.md:144` 仍是「流程未覆盖处的四条准则」（已作废方案）。 | 落 L10 时按现盘重读 L12（`:71`/`:72` 已随正 ⇒ 改成「已核零笔」或从落笔表删）；批档 §2 记一行「`:71`/`:72` 已随正，`:144`/`:250` 待笔」，免任务书带空活。 |
| 3 | Requirements | 🟡 | §5 对应表只收正两行：`docs/core/requirements/PHILOSOPHY.md:145` 仍把「诚实」列为纪律层主对的三观，`:146` 仍把「人生观（独立负责自己的任务）」挂给特殊模块；而本拆分把 §3 七条全判人格层（设计 `:4341`–`:4349`），顾问/会诊又是自含装配、不装 `thincoder-core/prompts/common.md`（`docs/core/requirements/PROMPT-SYSTEM.md:216`）⇒ 特殊模块既无九条公共三观也无三观人格档，`:146` 成无落点悬空行。 | L10 扩为 `:143`–`:146` 四行；或在 §6.53 明写「顾问/会诊本批不接三观、`:146` 待另批」，并给 `:145` 一句「诚实同时以取舍规则留公共层（K3 判由）」；两者都落进 A7 读数。 |
| 4 | Acceptance | 🟡 | A1 要求九条题眼「各恰 1」，但设计从未对 `thincoder-core/prompts/common.md` 全档扫这九个短语——既有件三问只扫两个块题眼（`:4567`）。若某题眼（如 `Delivery transparency` ∥ `Correctness first`）档内已存在，A1 必红，且新条与既有句成同档两份。 | 勘察证据行补一条读数：九条题眼在 `thincoder-core/prompts/common.md` 全档的出现次数（含 `:47-51` 冲突节），写进 A1 判法；确有命中的改写题眼或明标「关键锚点重复」并给判由。 |
| 5 | Acceptance | 🟡 | 验收全为本席脚本 / 一次性比对，未点改面既有断言：`docs/core/requirements/PROMPT-SYSTEM.md:97` 记着 `thincoder-cli/test/prompts-dual-source.test.mjs` T-CL1 数 `thincoder-core/prompts/common.md` 节数，A4 用手扫 `^## ` = 21 重复该断言却不跑它。 | A4 的节数项改为跑改动面断言档（若 T-CL1 覆盖该计数），手扫保留为辅助；跑不动就写明为什么不跑。 |
| 6 | Design gap | 🟡 | 2.2 被判人格条，整句却仍留公共层 `:44`，A9 又把它列为「零改」（`:4516`），七档 P1–P7 各写一句角色形态；父侧 02:16「粒度不同」裁定只覆盖 `:48`∥`:49`∥`:50`（K3，`:4554`），未覆盖 `:44` ⇒ 读者看不出「有意保留」还是「漏了」。 | 在 K3 补同判一条：`:44` 的 2.2 句留作位置句、人格层写角色形态；或删 `:44` 只留人格层——择一，写进 K3/A9 并给判由。 |
| 7 | Coordination | 🟡 | 两处上抛仍开（`:4584` 主 agent 笔 ‖ `:4585` §7 D-PS 行未加）；批档 §2 里 §6.52 的处置前后不一：`:149`「§6.52 首行已标取代」与 `:177`「§6.52 整节已删」并存（设计档内 `6.52` 引用实已为 0，读数为证）。 | §7 补一行 D-PS（编号由父侧定）；批档 §2 追加一行统一说法为「整节已删」。 |
| 8 | Clarity | 🔵 | A8 算式「每档条数 = 通用 3 + 角色加项」（`:4515`）对 plan ∥ explore 会算成 5，而 A2 与逐字块是 4（3.5 既在底座又在它们的加项里）。 | A8 改「去重后计数」，或把 plan/explore 的加项写成「2.6（3.5 已含底座）」。 |
| 9 | Clarity | 🔵 | A9 以改前行号（`:44`…`:51`）作改后比对基准，而 L1 删 `:43` 会把其后每行上移一行。 | A9 改用内容锚（整行原文）比对，或写成「改后行号 = 改前 −1」。 |
| 10 | Methodology | 🔵 | 集成测试节写 `none` 并给合法判由（`:4528`），但未记 RTM 读数。 | 补半句「`test/RTM.md` 无与本改动相交的行」或「本批零代码档 ⇒ 无 RTM 行受影响」，使 delta 可核。 |
| 11 | Evidence | 🔵 | 八个提示词档的行数/字符/最长行读数与 `thincoder-core/prompts/common.md:42-51` 逐字引用在本次评审范围外 ⇒ `unverified`；可核的文档侧读数全部对上（`docs/core/requirements/PHILOSOPHY.md` 179 行、`docs/core/requirements/PROMPT-SYSTEM.md` 280 行、`:64` `:137` `:248` `:250` 逐字与设计一致）。 | 无（供父侧知悉复核边界）；实施轮 A3/A4 自会复算。 |

**计数**：🔴 1 · 🟡 6 · 🔵 4（合计 11）。已核通过项：17 条分类算式（6+7+5−1=17）自洽、B1 九条与公共九条一一对应、七档 bullet 数与角色映射逐条相符（除 2.4）、A2/A3/A6 三处数字互算一致（61 新增行 = 10+9+6+8+8+8+6+6）、设计档内 `6.52` 引用为 0、`thincoder-core/prompts/common.md` 不新建 `##` 节（K1）与需求档节数锁定一致、先例行（`:4561`）与勘察证据行（`:4569`–`:4576`）齐备、既有件三问（`:4563`–`:4567`）齐备。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象**：评审 #13 十一条处置的落地复核（修正轮）
**读面**：批档全档 · 设计档 §6.53（`:4322`–`:4593`）∥ §7 D-PS46 · `docs/core/requirements/PHILOSOPHY.md` 全档 · `docs/core/requirements/PROMPT-SYSTEM.md` 全档 · 文档地图 `docs/README.md`

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/PROMPT-SYSTEM.md | — | Fixed | 2.4 已落两档：分类表 `:4352` 写「落点 = `persona-engineering` ∥ `persona-eng-designer`」，映射表 `:4374` `| 3.4 · 4.4 · 2.3 · 3.7 · 2.4 |`、`:4376` 同补 2.4，新增段落 `:4382`「2.4 的落点（评审 #1 补）」，逐字块 P1 `:4420` `- **The gap is information, not understanding**` ∥ P5 `:4468` `- **The gap is information, not reasoning**`，A8 `:4519` 改逐条落点核。17 条现各至少 1 处落点。 |
| 2 | 2 | docs/core/design/PROMPT-SYSTEM.md | — | Fixed | J8 `:4337` 按现盘重读（`:71` 已是「人格 8 条 / 公共 9 条」、`:72` 已无「正文单源」）；L12 `:4506` 改 `**已核零笔**：现盘实读`；A7 `:4518` 收窄待笔为 `PHILOSOPHY:143–146` ∥ `PROMPT-SYSTEM:250`；勘察行 `:4583` 同记。 |
| 3 | 3 | docs/core/design/PROMPT-SYSTEM.md | — | Fixed | L10 `:4504` 扩四行 `:143`–`:146`（含 `:145` = 方法论（三观的操作化），不再把「诚实」列为纪律层主对；`:146` = 顾问 / 评审自含装配 ⇒ 本批不接三观、待另批）；A7 同步；D-PS46 `:4643` 落「顾问 / 会诊自含装配 ⇒ 三观本批不接、待另批」。 |
| 4 | 4 | docs/core/design/PROMPT-SYSTEM.md | 🔴 | Unfixed | 题眼改写只在验收面声明、未落逐字面：B1 `:4405` 仍是 `- **Correctness first**: you are faster than the human already, so speed was never the bottleneck`，而 A1 `:4512` 要求扫 `No step is cut for speed` 且「B1 的 4.2 题眼改 `No step is cut for speed`（改前 0 命中）」——B1 块内无该串 ⇒ A1 必红；同档 `:48` 既有句（A9 `:4520` `- Correctness first. Rushing gets paid back in rework, so speed is not the bottleneck.`）与新条成同档两份同题眼，正是 A1 判由要避免的形。`：4581`「A1 十串各恰 1」按 L1–L9 原样替换不可能成立。 | 
| 5 | 5 | docs/core/design/PROMPT-SYSTEM.md | — | Fixed | A4 `:4515` 写明 `**节数项不跑既有断言档**`：`thincoder-cli/test/prompts-dual-source.test.mjs` 不在现盘、手扫为唯一读数；勘察行 `:4582` 同记。glob 佐证：该档只存在于 `.thincoder/tmp/head/` ∥ `.wt-head-probe/` 两探针目录，前提为真。 |
| 6 | 6 | docs/core/design/PROMPT-SYSTEM.md | — | Fixed | K3 `:4558` 补 `:44` 同判（2.2 整句留作位置句、人格层写角色形态、删除反丢位置句）；A9 `:4520` 把该整行列入既有句零改；上抛 2 `:4591` 同判扩到 `:44`。 |
| 7 | 7 | docs/core/design/PROMPT-SYSTEM.md | — | Fixed | §7 补 D-PS46 `:4643`（编号顺 D-PS45）；上抛 4 `:4593` 记「已处理」；批档 §2 `:208` 追加口径统一行（§6.52 整节已删、全档引用 = 0）——设计档 `6.52` 复扫零命中。 |
| 8 | 8 | docs/core/design/PROMPT-SYSTEM.md | — | Fixed | A8 `:4519` ③ 改「底座 ∪ 加项去重后计数」，plan/explore 的 3.5 不再重复计入。 |
| 9 | 9 | docs/core/design/PROMPT-SYSTEM.md | — | Fixed | A9 `:4520` 改内容锚（整行原文比对），并写明 L1 删 `:43` 后行号整体 −1、不以行号为基准。 |
| 10 | 10 | docs/core/design/PROMPT-SYSTEM.md | — | Fixed | 集成测试节 `:4532` 补 RTM 读数「`test/RTM.md` 无与本改动相交的行」+ 筛法一句。 |
| 11 | 11 | （评审自陈边界） | — | Accepted | 范围外读数，无需改；本轮 A3/A4 仍属实施轮复算面。 |
| N1 | (new) | docs/core/design/PROMPT-SYSTEM.md | 🟡 | New: A8 ② 的枚举字符串与逐字块不符 | A8 `:4519` 称 `3.5 \`Honesty over saving face\`（七档各 1）`，但 P6 的 3.5 形态题眼是 `- **A plan you cannot ground is a guess**`、P7 是 `- **You do not dress up a thin result**`；若 explore 的 3.5 已由 `:8` 承载（J4），「七档各 1」不能同时成立。`3.6 \`better option\`（normal ∥ eng-designer）` 同样不符：P5 题眼是 `- **A better way goes on the table**`。勘察行 `:4581` 的「七档各 1」同缺依据。 |
| N2 | (new) | docs/batches/2026-10-26-common-layer-principles.md | 🟡 | New: 2.4 补落改动了已批准映射，未记追认 | 用户 02:10 批准的映射（批档 `:98` `| 3.4 · 4.4 · 2.3 · 3.7 |`）现被设计 `:4374` 改成 `| 3.4 · 4.4 · 2.3 · 3.7 · 2.4 |`（eng-designer 同）；判由有，但设计 ∥ 批档均未写「此 delta 须 §4 显式追认」。 |
| N3 | (new) | docs/core/design/PROMPT-SYSTEM.md | 🔵 | New: A1 改前读数自相矛盾 | A1 `:4512` 写 `改前实测：前八串与 \`A related problem is not extra work\` ∥ \`Do not decide for the human\` = 0、\`Programming is collaborative labor\` = 1`——`Programming is collaborative labor` 本身在「前八串」内，两读数不能同真（勘察行 `:4580` 的分列才是对的）。 |

**计数**：🔴 1（#4 未修）· 🟡 2（N1 ∥ N2）· 🔵 1（N3）；旧 11 条 = 9 Fixed + 1 Accepted + 1 Unfixed。

VERDICT: changes-required

### 轮次 3（评审子代理）

**评审对象**：评审 #17（轮次 2）遗留 1🔴 + 2🟡 + 1🔵 四条处置的复核（轮次 3）
**读面**：设计档 §6.53（`:4325`–`:4624`，含 B1 ∥ A1 ∥ A3 ∥ A8 ∥ 勘察行）· 批档全档（`:210`–`:229` 修正轮段 · `:221` 追认行）

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 4 | docs/core/design/PROMPT-SYSTEM.md | 🔴 | Fixed | B1 `:4405` 现为 `- **No step is cut for speed**: you are faster than the human already, so speed was never the bottleneck`；`Correctness first` 离 B1，与 `:48` 不再同档两份。A1 `:4512` 十串含该串，判由改「B1 第 8 行（4.2）题眼取 `No step is cut for speed`（改前 0 命中），与 `:48` 不同题眼、不进同档两份」；勘察行 `:4580` 改前读数含该串 = 0。B1 ∥ A1 ∥ A8 ① ∥ 勘察行四处对齐，A1 不再必红。 |
| 2 | N1 | docs/core/design/PROMPT-SYSTEM.md | 🟡 | Fixed | A8 `:4519` ② 改按逐字块实际题眼枚举：3.5 = P1–P5 `Honesty over saving face` ∥ P6 `A plan you cannot ground is a guess` ∥ P7 `You do not dress up a thin result`；3.6 = `Bring a better option with its reason`（P2）∥ `A better way goes on the table`（P5）；2.2 标「各档题眼各异」。逐条对过 P1–P7 逐字块（`:4414`–`:4488`）＝ 八条零漏，错串已删；勘察行 `:4581` 同步改为「P1–P5 各 1，P6 ∥ P7 用各自形态题眼」。 |
| 3 | N2 | docs/batches/2026-10-26-common-layer-principles.md | 🟡 | Fixed | `:221` 已立追认行：「2.4 补落 `persona-engineering` ∥ `persona-eng-designer` 是对用户 2026-10-26 02:10 已批准映射的 delta（原映射两档「再加」列无 2.4）——**此 delta 须在 §4 批准时显式追认**」。与 `:98` 已批准表、设计 `:4374`/`:4376` 的 delta 逐字对上。 |
| 4 | N3 | docs/core/design/PROMPT-SYSTEM.md | 🔵 | Fixed | A1 `:4512` 改前读数分列重写：九个零命中串单列（含 `No step is cut for speed`）= 0 ∥ `Programming is collaborative labor` = 1（`:43`）∥ `Correctness first` = 1（`:48`）⇒ 十条扫描串读数齐、无自相矛盾；与勘察行 `:4580` 同口径。 |
| 5 | (decl) | 设计档 J3 ∥ A3 ∥ 受影响文件表 | — | Fixed | 字符数三处统一为 `439 / 53,771`（`:4332` ∥ `:4514` ∥ `:4540`）；批档 `:227`–`:229` 记「原 53,752 = 旧算」并自正归因（旧题眼重跑 = 53,764），53,752 不再被验收引用。 |

**计数**：本轮 4 条 = 4 Fixed（🔴 1 · 🟡 2 · 🔵 1）+ 字符数收正 1 项 Fixed；新增 🔴 = 0。

**轮次 2 其余 10 条**（#1–#3 ∥ #5–#10 ∥ #11）：本轮重读 §6.53 全段仍在位（`:4352`/`:4374`/`:4376`/`:4382`/`:4420`/`:4468` 2.4 落点 ∥ `:4506` L12 零笔 ∥ `:4504` L10 四行 ∥ `:4515` A4 跑不动 ∥ `:4558` K3 `:44` ∥ `:4643` D-PS46 ∥ `:4519` ③ ∥ `:4520` A9 ∥ `:4532` RTM），保持轮次 2 的 Fixed/Accepted。

VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-26（用户：「**可以，后续自动跑完**」02:11）

**批准依据**：评审 `#20`（round 3）= **pass**；实施 `#21` / `#25` / `#28` 三轮全绿；设计修正 `#15` / `#18` / `#23` / `#26` 四轮。

## 2.4 追认（按批档 `:221` 的要求，此处显式落）

用户 2026-10-26 02:10 批准的映射表（§1 `:98`–`:104`）里，`persona-engineering` 的「再加」列为 `3.4 · 4.4 · 2.3 · 3.7`、`persona-eng-designer` 为 `3.6 · 3.3 · 2.5`。

本批实际落地在**两档各加了一条 2.4**：

| 档 | 批准映射 | 实落 | delta |
|---|---|---|---|
| `persona-engineering` | 3.4 · 4.4 · 2.3 · 3.7 | 同上 **+ 2.4** | +1 |
| `persona-eng-designer` | 3.6 · 3.3 · 2.5 | 同上 **+ 2.4** | +1 |

**裁决此处显式追认上述 delta。**

理由（设计席给的、父侧采纳）：评审 round 1 的 🔴 指出 2.4 一条零落点、实落 16 条，与用户「17 条一条不少」（02:06 原话）不符。补落两档是唯一不动已批准分类（8 人格 / 9 公共）与算式（6+7+5−1）的解法——不走「2.4 并入 2.3」是因为那会把已批准的人格条数从 8 改 7 并动分类算式，且 2.4 是**判断依据**（瓶颈在信息）、2.3 是**动作**（多说），不同题。

## 批准范围

17 条按性质拆 8 人格 / 9 公共；公共九条落 `common.md`（`## Who you are` 内一块，不新建 `##` 节）；人格八条按角色取形落七份 persona（2.4 落两档）；`PHILOSOPHY.md §5` 对应表四行收正；`PROMPT-SYSTEM.md §2.8` 补句；去重三判（V1 ∥ V2 ∥ V3）+ M1–M8 八处。

## 不在范围

代码面 · 装配矩阵 · 顾问/会诊的三观接入（待另批）· `persona-normal.md:10` 的 2.1 位置句（判为位置句，非重复）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-26



**实施（eng-coder · 2026-10-26）**

**落笔 L1–L9（八档 · 逐字全等）**：按设计 `docs/core/design/PROMPT-SYSTEM.md` §6.53 的 B1 ∥ P1–P7 逐字落笔，本席 `node` 逐行比对设计档对应行 ⇒ **八块全等**（B1 10 行 · P1 9 · P2 5 · P3 7 · P4 7 · P5 8 · P6 5 · P7 5）。锚点均取内容锚（L 表 `:4495`–`:4503`），插点前各留一空行。

| 落点 | 文件 | 动作 | 读数（`split('\n').length - 1` ∥ `.length`） |
|---|---|---|---|
| L1 + L2 | `thincoder-core/prompts/common.md` | 删原 `:43` 2.1 句 · `What you confirm is your contract.` 后插 B1（空行 + 10 行） | 429 → 439 · 51,890 → 53,771 |
| L3 | `thincoder-core/prompts/persona-engineering.md` | `When you delegate to subagents…` 后插 P1 | 458 → 468 · 65,397 → 66,738 |
| L4 | `thincoder-core/prompts/persona-normal.md` | `**Subagent ids carry their accounts in reports**…` 后插 P2 | 57 → 63 · 6,466 → 7,222 |
| L5 | `thincoder-core/prompts/persona-coder.md` | `Why: quietly adapting ships a design nobody approved.` 后插 P3 | 22 → 30 · 1,665 → 2,619 |
| L6 | `thincoder-core/prompts/persona-eng-coder.md` | `The parent agent is the product manager…` 后插 P4 | 58 → 66 · 6,186 → 7,165 |
| L7 | `thincoder-core/prompts/persona-eng-designer.md` | `- **Practice deposit**…` 后插 P5 | 155 → 164 · 20,316 → 21,451 |
| L8 | `thincoder-core/prompts/persona-plan.md` | `Your deliverable IS the plan itself…` 后插 P6 | 26 → 32 · 2,329 → 2,912 |
| L9 | `thincoder-core/prompts/persona-explore.md` | `Your role is to search, read, and analyze…` 后插 P7 | 14 → 20 · 1,010 → 1,703 |

**验收 A1–A9（本席 `node` 实跑，非推算）**

| # | 读数 |
|---|---|
| A1 | 十串在 `thincoder-core/prompts/common.md` 各恰 1（块题眼 `:46` + 九条 `:47`–`:55`）；改前读数复现：九个零命中串 = 0 ∥ `Programming is collaborative labor` = 1 ∥ `Correctness first` = 1（`:58`，零改） |
| A2 | 七档 `Character in this seat` 各恰 1（全 `thincoder-core/prompts/` 扫描仅七命中 ⇒ `subagent-base` ∥ `consult-base` 未受影响）；块内 bullet 数 = 8 ∥ 4 ∥ 6 ∥ 6 ∥ 7 ∥ 4 ∥ 4，与 L 表 Δ 相符 |
| A3 | 八档行/字符全中 A3 表（见上表读数）；`\u0394` 行 = +10 ∥ +10 ∥ +6 ∥ +8 ∥ +8 ∥ +9 ∥ +6 ∥ +6 |
| A4 | `>300` = 0（八档）；最长行 = 294 ∥ 300 ∥ 295 ∥ 203 ∥ 281 ∥ 298 ∥ 217 ∥ 187；`^## ` = 21 ∥ 17 ∥ 6 ∥ 3 ∥ 6 ∥ 9 ∥ 3 ∥ 3（改前改后同数） |
| A5 | `node scripts/prompt-refs-check.mjs`（仓根实跑）⇒ `命中 5`／退出码 1，五条全在 `thincoder-core/tool-docs/advisor.md:6` ∥ `thincoder-core/agent-tools/advisor.mjs:64` ∥ `:125`——与改前同集合、八档零新增命中 |
| A6 | 新增净 63 行（插 64 − 删 1）零日期 ∥ 零批次名 ∥ 零出处坐标 ∥ 零文档路径引用（机扫 0 命中） |
| A7 | 需求档两处（主 agent 笔）本席复核**已在盘**：`docs/core/requirements/PHILOSOPHY.md:143`–`:146` 四项判据全达 ∥ `docs/core/requirements/PROMPT-SYSTEM.md:250` 含「三观在该角色上的具体化」；`:64` = 21 节 · `:71` 已是「人格 8 条 / 公共 9 条」· `:72` 已无「正文单源」（L12 = 零笔） |
| A8 | ① 公共九条各恰 1（同 A1）；② 人格八条各 ≥1 处，按 P1–P7 实际题眼逐条核（3.1 七档 ∥ 3.5 七档各有形态 ∥ 2.2 七档各角色句 ∥ 3.2 P3+P4 ∥ 3.3 P2+P5 ∥ 3.4 P1 ∥ 3.6 P2+P5 ∥ 2.4 P1+P5）= 八条零漏；③ 每档条数 = 底座 ∪ 加项去重后计数 |
| A9 | 六处内容锚逐行在盘且与改前全等（`:43` ∥ `:44` ∥ `:58`–`:61`）；`thincoder-core/prompts/common.md` 全档唯一删除行 = 原 `:43` 的 2.1 句（L1 设计面动作） |

**测试口径**：本批零代码档 ⇒ 单元测试面 `none`、未造任何测试档（无「用毕即删」对象）；集成 `none`——`test/RTM.md`（148 行）实扫与提示词面相交的行 = 0，两条触发均不成立。另扫 575 个 `.mjs/.js/.ts/.json` 档：引用 `thincoder-core/prompts/common.md` ∥ `Who you are` ∥ `prompts-dual-source` 者 = 0 ⇒ 本改动无既有断言面可跑（A4 的「跑不动」由本席独立复核成立）。

**文档机检**：`doc_check(mode:"gate")` 范围 = 本席改动的八档（整档判）⇒ `DOC-CHECK GATE: PASS`，0 条命中。

**决定披露表**

| # | 决定 / 披露 | 判由 |
|---|---|---|
| 1 | 八档外零改动：本席只动设计表列的 8 个 coder-pen 档；`docs/core/design/PROMPT-SYSTEM.md`（设计席笔）∥ 两份需求档（主 agent 笔）未动 | D1 路由 + 任务书条目 3 ∥ 4 非本席笔 |
| 2 | 设计逐字面与既有句重叠处一律按设计落，不自行删改（`thincoder-core/prompts/common.md:44` ∥ `:48`–`:50` 零改 = K3） | 设计是权威 spec；偏离即交付未批准之物 |
| 3 | 无自造措辞、无简化、无缩写 | 八块逐字全等已机判 |
| 4 | `persona-*` 七档按角色取形措辞各不相同，不作「对齐」处理 | 设计要求（机制 #3、偏离 ②） |

**轮次 ∥ 终态**

- **内部差异审计（explore · 只读 · 1 轮）**：A1–A9 逐项复核 ⇒ 无部分实现、无静默简化、零 doc-drift、8/8 coder-pen 档在位、表外零改动。
- **内部代码评审（advisor · `type=code` · 1 轮）**：`VERDICT: pass`；4 条均为**设计面 / 上游面**意见（`thincoder-core/prompts/persona-coder.md:16` 与既有 `:21` 同规则两份——设计 K6 未勘察 `:21`；`thincoder-core/prompts/common.md:48` ∥ `:54` 的 2.3 ∥ 4.3 正文/题眼在人格层近乎逐字复现——机制 #4 的「只写形态一句」边界；批档 §4 ∥ §5 空段；`thincoder-core/prompts/persona-normal.md:10` 未进设计 J5 勘察读数），**无一条要求改提示词文本**——逐字面按设计落，删改即偏离设计。
- **自修轮**：0 轮（无缺陷需改）。
- **终态**：`clean`（实施完成 + 审计零差异 + 评审 pass）。

**读法更正（本席自正）**：上表 A3 行内的 `\u0394` 是转义字面（写录时误留），应读作 `Δ`——行数差。数值本身无误（+10 ∥ +10 ∥ +6 ∥ +8 ∥ +8 ∥ +9 ∥ +6 ∥ +6）。

**修正轮（2026-10-26 · 设计席 #23 三判 + M1–M8 · 父侧全修令）**

**落笔八处（逐字 = 设计 `docs/core/design/PROMPT-SYSTEM.md` §6.53 P1–P4 块；每处以内容锚定位，未自行措辞）**

| # | 文件:行（改后） | 改前题眼 | 动作 | 改后题眼 |
|---|---|---|---|---|
| M1 | `thincoder-core/prompts/persona-coder.md` | `A partial delivery is not a delivery` | 删整行 | —（3.2 由既有 `:20` 承载） |
| M2 | `thincoder-core/prompts/persona-coder.md:16` | `No step is cut for time` | 整行替换 | `Finishing early is not finishing` |
| M3 | `thincoder-core/prompts/persona-coder.md:17` | `A related problem is not extra work` | 整行替换 | `Leave nothing broken beside it` |
| M4 | `thincoder-core/prompts/persona-normal.md:20` | `A related problem is not extra work` | 整行替换 | `Nothing next door is someone else's problem` |
| M5 | `thincoder-core/prompts/persona-eng-coder.md:13` | `No step is cut for time` | 整行替换 | `A step skipped is a step the review has to find` |
| M6 | `thincoder-core/prompts/persona-engineering.md:44` | `Lay the options out and let them pick` | 整行替换 | `The call is the user's, the framing is yours` |
| M7 | `thincoder-core/prompts/persona-engineering.md:45` | `Say the extra sentence` | 整行替换 | `Nothing important stays in your head` |
| M8 | `thincoder-core/prompts/persona-engineering.md:47` | `A finished job comes with its account` | 整行替换 | `A batch ends with its account, not with "done"` |

四块落笔后与设计逐行全等（本席 node 比对）：engineering `:39`–`:47` = P1（9 行）∥ normal `:17`–`:21` = P2（5）∥ coder `:12`–`:17` = P3（6）∥ eng-coder `:7`–`:13` = P4（7）。

**读数（本席 node 实跑，非推算）**

| # | 读数 |
|---|---|
| A1 | `thincoder-core/prompts/common.md` 十串各恰 1（本轮零改动，读数与改前同） |
| A2 | 七档 `Character in this seat` 各 1；bullet = 8 ∥ 4 ∥ 5 ∥ 6 ∥ 7 ∥ 4 ∥ 4（合计 38；coder 6 → 5 即 M1） |
| A3 | 八档全中：common 439/53,771 · engineering 468/67,061 · normal 63/7,260 · coder 29/2,558 · eng-coder 66/7,289 · designer 164/21,451 · plan 32/2,912 · explore 20/1,703（口径 `split('\n').length - 1` / `.length`） |
| A4 | 八档 `>300` = 0；`^## ` = 21 ∥ 17 ∥ 6 ∥ 3 ∥ 6 ∥ 9 ∥ 3 ∥ 3（改前改后同数） |
| A5 | `node scripts/prompt-refs-check.mjs`（仓根）⇒ `命中 5`／退出码 1，五条仍在 `thincoder-core/tool-docs/advisor.md:6` ∥ `thincoder-core/agent-tools/advisor.mjs:64` ∥ `:125` ⇒ 四档零新增命中 |
| A6 | 七条改写行零日期 ∥ 零批次名 ∥ 零坐标 ∥ 零文档路径（机扫 0 命中）；M1 为删行 |
| A8 ② | 八条各 ≥1 处：3.1 七档（normal 由既有 `:3` 承载）· 3.5 = P1–P5 `Honesty over saving face` + P6 ∥ P7 各自形态 · 2.2 七档角色句各异 · 3.2 P4 + coder 既有 `COMPLETE delivery` · 3.3 P2 ∥ P5 · 3.4 P1 · 3.6 P2 ∥ P5 · 2.4 P1 ∥ P5 = 八条零漏 |
| A9 | 既有句零改：`thincoder-core/prompts/persona-coder.md:20` `- COMPLETE delivery: …did not approve.` 逐字在盘 ∥ `thincoder-core/prompts/persona-normal.md:10` 的 2.1 原句在盘；**反向还原证明** = 把八处旧行还原后四档读数回到改前（30/2,619 · 63/7,222 · 66/7,165 · 468/66,738）⇒ 差异仅限这八行 |
| A10 V1 | 九条公共题眼在七块逐字块内 = 0（档级唯一命中 = `thincoder-core/prompts/persona-normal.md:10`，设计 `:4538` 已划在判据面外） |
| A10 V2 | 38 条 × 九条公共行：最大 = 5（`change the call sites a` @ `thincoder-core/prompts/persona-eng-coder.md:12`），`>5` = 0；改前同法复现 39 条 / 越线 7 条 = 22 ∥ 11 ∥ 9 ∥ 8 ∥ 7 ∥ 7 ∥ 6 词，与设计 M 表逐条同序同数 |
| A10 V3 | 人读逐档：四档块内无同规则第二处；机辅扫 = 块内题眼在各档全文重复 = 0 |

**测试口径**：本批零代码档 ⇒ 单元测试面 `none`；集成 `none`（判由同设计 §6.53）。另本席独立复核：全仓 `**/test/**` 无引用提示词面者（`glob` + `grep` 双向零命中）⇒ 本改动无既有断言面可跑。

**决定披露表**

| # | 决定 / 披露 | 判由 |
|---|---|---|
| 1 | 只动 M 表八处：四档其余行零改；`thincoder-core/prompts/common.md` ∥ `persona-eng-designer` ∥ `persona-plan` ∥ `persona-explore` 零改（读数与改前逐位同） | 设计 M 表是唯一改动面；父侧「只动这八处」 |
| 2 | 措辞全抄设计 P1–P4，未自造、未简化、未缩写 | 设计是权威 spec；父侧「照块落，不要自己措辞」 |
| 3 | `persona-coder` 块 6 → 5 条，未补位 | 设计 M1 既定（3.2 由既有 `:20` 承载，K6 ∥ J9） |
| 4 | `thincoder-core/prompts/persona-normal.md:10` 的 2.1 原句未动 | 设计 `:4614` 明写不入本批；判据面 = 逐字块 |
| 5 | 表外零改动；唯一新增文件 = 校验脚本 `.thincoder/tmp/m1m8-verify.mjs`（gitignored 探针，非测试档，收口随删） | A10 机扫可复跑所需；不入交付面 |

**轮次 ∥ 终态**

- **内部差异审计（explore · 只读 · 1 轮）**：M1–M8 逐条 + P1–P4 逐块比对 ⇒ `no divergence`（八处逐字全等、旧串清零、四档行数/节数/≤300 全中、四未动档零变化）。
- **内部代码评审（advisor · `type=code` · 1 轮）**：`VERDICT: pass`；3 条均非本席可改面——① `thincoder-core/prompts/persona-coder.md:9` ∥ `:17` 同触发两处置（🟡，设计席收窄边界）② `thincoder-core/prompts/persona-normal.md:10` 公共 2.1 题眼句定性（🟡，父侧裁）③ 设计 J9 ∥ A8 ② 的 `:21` 在 M1 后实为 `:20`（🔵，设计席改内容锚）。**无一条要求改本轮提示词文本**——改字即偏离逐字权威目标形。
- **自修轮**：0 轮（无可改缺陷）。
- **终态**：`clean`。

**上抛（待父侧 / 设计席）**

1. 〔设计席〕`thincoder-core/prompts/persona-coder.md:9` ∥ `:17` 对同一事件（接口变更撞到既有 caller）给出两处置：`:9` 停并上报 ∥ `:17` 修掉并说明——建议各加半句边界，走设计档修订轮。
2. 〔父侧裁〕`thincoder-core/prompts/persona-normal.md:10` 公共 2.1 题眼句：三判字面全过（无加粗题眼、V2 = 4 词），但是「公共原则同时住两处」的唯一活口——定性为位置句（补判由）或另开债。
3. 〔设计席〕设计 J9 ∥ A8 ② 的 `thincoder-core/prompts/persona-coder.md:21` 在 M1 后实为 `:20`，建议改内容锚（A9 已用内容锚，验收本身不红）。

**修正轮（2026-10-26 · 设计席 #26 两处逐字块 · 父侧令「只做两处整行替换」）**

**落笔（编号 → 坐标）**：P3 第 4 条 → `thincoder-core/prompts/persona-coder.md:17`；P3b → 同档 `:9`。两处均为整行替换、逐字照抄设计 `docs/core/design/PROMPT-SYSTEM.md` §6.53 的 P3 块第 4 行（`:4443`）∥ P3b 块（`:4449`）。本席 `node` 逐行比对 ⇒ 两处与设计全等；P3 块 6 行（`:12`–`:17`）整体全等。

**改前 → 改后（逐字）**

| # | 坐标 | 改前（逐字） | 改后（逐字） |
|---|---|---|---|
| P3b | `thincoder-core/prompts/persona-coder.md:9` | `**Stop on a design conflict**: if the design conflicts with what you find in the code (an interface change broke a caller, a referenced symbol does not exist), STOP and report the conflict to the parent.` | 原句一字不动，句尾追加 ` A repair that changes what the caller means is this conflict, not a call site to fix.` |
| P3 第 4 条 | 同档 `:17` | `- **Leave nothing broken beside it**: a call site your change left behind, a caller that no longer matches the shape — fix it and say you did, instead of building past it.` | 原文一字不动，句尾追加 ` Yours only while the repair follows your change — a rename, a moved symbol, a value the old call had; past that, report it.` |

**读数（本席 `node` 实跑，非推算）**

| 项 | 读数 |
|---|---|
| 改前 | `persona-coder.md` 29 行 / 2,558 字符 / 最长行 203 |
| 改后 | 29 行 / 2,768 字符 / 最长行 295（Δ 行 0；+210 字符 = 追加 86 + 124，逐字实算） |
| A4 | `>300` = 0 ∥ `^## ` = 3（`:3` ∥ `:19` ∥ `:23`，改前改后同数，未新增节） |
| A2 | 七档 `Character in this seat` 各 1；bullet = 8 ∥ 4 ∥ 5 ∥ 6 ∥ 7 ∥ 4 ∥ 4（合计 38；coder = 5） |
| A1 | `common.md` 十串各恰 1（块题眼 + 九条题眼；公共层本轮零触，读数与改前同） |
| A8 ② | 八条各 ≥1 处：3.1 七档各 1 ∥ 3.5 = P1–P5 `Honesty over saving face` + P6 `A plan you cannot ground is a guess` + P7 `You do not dress up a thin result` ∥ 2.2 七档角色句各 1（`You own the code, the user owns the direction` ∥ normal 既有句 ∥ `You own the code you write, the parent owns the direction` ∥ `…the task book owns the direction` ∥ `You own the design, the user owns the direction` ∥ `You own the plan, the parent owns the direction` ∥ `The search is yours, the direction is the parent's`）∥ 3.2 coder 既有 `COMPLETE delivery` 1 + P4 1 ∥ 3.3 P2 ∥ P5 ∥ 3.4 P1 ∥ 3.6 P2 ∥ P5 ∥ 2.4 P1 ∥ P5 |
| V1 ∥ V2（两句边界） | `:9` 与九条公共行最长连续同文 = 2 词（`common.md:47` 起算）；`:17` 同法 = 2 词（`common.md:48`）；公共题眼复用 = 0（两句题眼 `Stop on a design conflict` ∥ `Leave nothing broken beside it` 均不在九条公共题眼内） |
| A10 全量复扫 | 七块 38 条 × 九条公共行：最大 = 5（`thincoder-core/prompts/persona-eng-coder.md:12`），`>5` = 0（与本轮零改动的上轮读数同） |
| A5 | `node scripts/prompt-refs-check.mjs`（仓根）⇒ `命中 5`／退出码 1，五条仍在 `thincoder-core/tool-docs/advisor.md:6` ∥ `thincoder-core/agent-tools/advisor.mjs:64` ∥ `:125` ⇒ 本轮零新增命中 |
| A9 | `thincoder-core/prompts/persona-coder.md:20` 的 `- COMPLETE delivery: solve the ENTIRE task the parent gave you` … `a partial delivery the parent did not approve.` 逐字在盘（3.2 唯一承载不动） |
| A6 式扫 | 两处新增文本零文档引用 ∥ 零日期 ∥ 零批次名 ∥ 零坐标 |

**文档机检**：`doc_check(mode:"gate")` 范围 = 本轮改动档 `thincoder-core/prompts/persona-coder.md`（整档判）⇒ `DOC-CHECK GATE: PASS`，0 条命中。

**决定披露表**

| # | 决定 / 披露 | 判由 |
|---|---|---|
| 1 | 只动 `thincoder-core/prompts/persona-coder.md` 两行；公共层 ∥ 其余六档本轮零改动（读数逐位同改前） | 父侧令「只做两处整行替换」+ 设计 L5b ∥ P3 |
| 2 | 措辞全抄设计 P3 第 4 条 ∥ P3b，未自造、未简化、未缩写 | 设计是权威 spec；两处与设计逐字全等已机判 |
| 3 | 两行均为「原句一字不动 + 句尾追加」，旧句未删改 | 设计 P3b 明写「原句逐字保留，句尾加边界半句」；P3 第 4 条同判 |
| 4 | 未新增 `##` 节、未新增块（Δ 行 0） | 设计 K1 ∥ K5；`^## ` = 3 改前改后同数 |
| 5 | 表外零产物：校验探针 `.thincoder/tmp/p3-p3b-verify.mjs` 建后即删（gitignored，不入交付面） | 测试纪律「用毕即删」；盘上已无此档 |

**轮次 ∥ 终态**

- **内部差异审计（explore · 只读 · 1 轮）**：`VERDICT: no divergence`——(a) `:17` ≡ 设计 `:4443`、(b) `:9` ≡ 设计 `:4449`、(c) 本轮仅两处文字新增（29 行不变、2,558 + 86 + 124 = 2,768、块 `:12`–`:17` 逐行 = P3）、(d) 表外零产物、(e) A2 七档各 1 且 bullet 38、(f) A1 十串各 1、(g) V1 = 0 ∥ V2 = 2 词、(h) 零引用/日期/批次名。审计自陈口径限制：其装配无 `execute`/`git` ⇒ 字符总数为间接合；本席 `node` 实测 2,768 已补上该读数。
- **内部代码评审（advisor · `type=code` · 1 轮）**：`VERDICT: pass`；2 条 🔵 均为**设计面措辞登记**（① `:17` 的 `a value the old call had` 为省略形；② `:9` 括注示例与 `:17` 同场面、区分全靠新增半句）——**不要求改落地档文本**，改字即偏离设计逐字面。
- **自修轮**：0 轮（无缺陷需改）。
- **终态**：`clean`（实施完成 + 审计零差异 + 评审 pass）。

## §6 验证与收口（父代理）

## 收口（2026-10-26 03:09 · 父侧）

**状态行**：已收口

### 一、交付结果

| 面 | 落点 | 读数 |
|---|---|---|
| 公共九条 | `common.md` `## Who you are` 内一块（`The base every role works from` + 九条题眼） | 429 → **439** 行 · 51,890 → **53,771** 字符 · `^## ` 仍 21 |
| 人格八条 | 七份 persona 逐角色取形：engineering `+10` / normal `+6` / coder `+8`−1−1 / eng-coder `+8` / eng-designer `+9` / plan `+6` / explore `+6` | engineering **468** · normal **63** · coder **29** · eng-coder **66** · eng-designer **164** · plan **32** · explore **20** |
| 去重 | M1–M8 八处（父侧点名 3 + 同判再扫 4 + M1 删行） | A10 复扫：V2 `>5 词` = **0**（最大恰好 5）· V1 = **0** · V3 = **0** |
| 需求档 | `PHILOSOPHY.md:143`–`:146` 四行 · `PROMPT-SYSTEM.md:250` 补句 | A7 六项判据全达 |

### 二、验收读数（父侧亲跑）

- **A1**：`common.md` 十串**各恰 1** ✓
- **八档写形**：`>300` = **0**（最长行：engineering 恰好 300 · designer 298 · normal/coder 295 · common 294 · eng-coder 281 · plan 217 · explore 187）
- **`^## ` 计数**：21 ∥ 17 ∥ 6 ∥ 3 ∥ 6 ∥ 9 ∥ 3 ∥ 3——**八档无一新增节**
- **A10 去重**：38 条 × 九条公共行，V2 最大 5 词、V1 = 0、V3 = 0
- **A5**：`prompt-refs-check.mjs` 命中 5，与改前**同集合**（全在 `advisor.md:6` ∥ `advisor.mjs:64` `:125`，非本批面）
- **测试**：`none` —— 575 个 `.mjs/.js/.ts/.json` 扫过，引用提示词内容者 **0**；`test/RTM.md` 148 行与提示词面相交 **0**
- **`doc_check`**：八档 + 批档 + 设计档 + 需求档 **PASS**

### 三、这批真正改变了什么

**在此之前，三观只活在需求档里，没有一处回答「我是什么样的人」。**

实测：`persona-*.md` 七档全是岗位身份（`Role: read-only scout` ∥ `Identity: the design-writing seat`），唯一的「我是谁」在 `common.md:42-45`——四句讲**位置**（人决定 / 你拥有代码 / 确认即契约），不讲品质。

而「有责任感的工程师，不是办公设备」这句（三观 3.1）**只在 `persona-normal.md:3`**——七个角色里只有一个读得到。

改后：九条公共三观落公共层（16 档共享），八条人格三观按角色取形落七份 persona。**每个角色都读得到该读的那些。**

### 四、三条设计判断（都由子代理提出、我采纳）

1. **不合并 2.4 与 2.3**——合并会把已批准的人格条数从 8 改 7 并动分类算式；且 2.4 是判断依据、2.3 是动作，不同题。改走「补落两档」，在 §4 显式追认 delta。
2. **去重用三判而非「像不像」**——V1 题眼不复用 ∥ V2 最长连续同文 ≤5 词（5 词以下只能是短语，6 词起就是一句话）∥ V3 同档一条只一处。原设计写「只有角色形态一句，不是两份全文」——**不可判**，落地就出 7 处两份。
3. **`persona-coder` 两句相反处置的边界用「caller 的意思变不变」**——我原本建议按「谁的模块 / 跨批」分，设计席拒了：同一次接口变更能同时落在两个模块，归属判不出来；而「意思变不变」只有两个答案，且与代价对齐（机械后果不构成决定，意思变了才构成决定）。

### 五、遗留（两条登记，不改）

1. **顾问 / 会诊不接三观**——它们自含装配、不装 `common.md`，也没有 persona 档。设计档 `:146` 与 D-PS46 已写明「本批不接、待另批」。
2. **`persona-normal.md:10` 的 2.1 位置句**——与 B1 第 2 行题眼字面相同，但三判全过（无加粗题眼、V2 = 4 词），设计档 `:4553` 已定性为**位置句**（B1 是原则本体带题眼，`:10` 是位置陈述）。

### 六、台账与 token

- 台账 `#1802` 在途 → 待核销 → 已核销
- designToken 在本轮收口时 consume
