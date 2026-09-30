# 2026-09-30 · normal 测试知识
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #658（normal 面测试层级知识适配——discipline-normal 双面缺口）；用户 2026-09-30 16:46 口径裁定 + 23:44 批次令「别的也不该等」。。
> 台账 = #658（TESTING · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：台账 **#658**（normal 面测试层级知识适配——discipline-normal 双面缺口）+ **用户 2026-09-30 16:46 口径裁定**（台账 #658 evidence 所载：「批次档概念非工程模式专有；文档体系对全模式同一；两模式之别 = 是否强流程约束」——原裁「normal 无批次 ⇒ 不能照抄」= 错）; 批次点火 = 用户 23:44 令「别的也不该等」。

**范围**：`discipline-normal.md` 双面（CN ∥ EN）补**测试层级知识**（单元 ∥ 集成的定义与放置）——放置语义照**全模式同一的文档体系**书写。**边界**：流程约束面**零搬迁**（normal = 纪律非结构强制）∥ 工程面（discipline-engineering）零触 ∥ 不造词 ∥ 提示词内容权 = 主 agent（拟文待裁后落地）。

**设计轮** = #10（已完成——落点见 §2：设计档机制面 11 处 + 拟文逐字稿 + 双面对照 13 条 + AC/KD 全册）。

**上抛（另裁）**：F-1（双面音量行既存表述差）∥ F-2（Feature 行抽象指针）∥ F-3（集成集窗口读数缺）∥ R-1（需求档 `PROMPT-SYSTEM.md:114` 补测试层级指针——父侧笔面，本行处置）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（四条落点：设计档 11 处已落 ∥ 提示词两档拟文就绪（待落地轮）；缺口审计 ∥ 拟文逐字稿 ∥ 双面对照 13 条 ∥ 观察（F-1~3 ∥ R-1）在册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

（本块 = 设计轮落笔 · 2026-09-30 · eng-designer——承 §1 与用户 2026-09-30 16:46 口径裁定（全文见台账 #658 evidence）；前轮 = `2026-09-29-test-knowledge-prompts.md` §2.8-U2（已裁：normal 面适配另设计 ⇒ 即本批）。）

### 2.1 本批条目（覆盖 #658）

| # | 条目 | 判据 / 来源 | 落点 | 状态 |
|---|---|---|---|---|
| 1 | normal 面补测试层级知识（定义 ∥ 放置细目）——双面（EN ∥ ZH 逐段对应） | 用户 2026-09-30 16:46 裁定 · 台账 #658（重述） | EN `thincoder-core/prompts/discipline-normal.md:105/:106` ∥ CN `docs/core/design/prompts/discipline-normal.md:103/:104` | 拟文就绪（2.4）· 落地随提示词纪律 |
| 2 | 设计档机制面随动（§6.10 扩双模式 + §7 D-PS13 + §6.1 实例 + 变更记录） | 承条目 1 | `docs/core/design/PROMPT-SYSTEM.md`（11 处） | 已落（2.3 / 2.10） |
| 3 | 观察登记（F-1 ∥ F-2 ∥ F-3）与需求面笔候选（R-1） | 审计发现（2.9） | 另裁 / 主 agent 笔 | 在册 |

**口径（唯一依据）**：用户 2026-09-30 16:46 原话（#658 evidence 全文）——「批次档概念不是工程模式专有，普通模式一样有，文档体系对什么模式都是一样的，工程模式和普通模式的区别不在于要不要文档体系，而在于是否强流程约束。」⇒ 放置语义照**全模式同一的文档体系**书写；**禁止**「normal 无批次」式前提。

**本批性质**：提示词知识补写批——产品码零触（提示词 = 产品码，本批只出拟文；内容权 = 主 agent）；设计档笔 = eng-designer（已落）。

### 2.2 缺口审计（现态实读 · as-of 2026-09-30 设计轮 · 双面）

**知识两条（定稿原词——承 09-29 批）**：① **定义**——单元测试 = 单个组件隔离测（外部协作者打桩隔离）——开发者改完即跑的反馈回路（回答「刚改的这处对了没有」）；集成测试 = 组件协同（真实组合）——上线前的验收回路（从用户能看见的入口把真实业务走一遍）。② **放置（两类分述——禁合称「测试用例」）**——单元测试用例随批次档存（开发期工具——不占项目 `test/` 树）；集成测试用例与测试代码同住项目的 `test/` 目录。

| 面 | 现态（实读坐标） | 已有（对 A ∥ B） | 缺口 |
|---|---|---|---|
| EN 运行面（208 行） | `:105` 单元行 ∥ `:106` 集成行 ∥ `:107` 音量行（括注含「unit test files stay with their batch record」） | A：仅「development-time tools」半句；B：仅 `:107` 括注的单元半句 | 定义两条整体缺；放置细目缺（不占 `test/` 树 ∥ 同住 `test/` 目录 ∥ 只住前端口） |
| CN 正本（204 行） | `:103` 单元行 ∥ `:104` 集成行 ∥ `:105` 音量行（「单元档不累积、集成集不超窗」） | 同 EN（「开发期工具」半句） | 同上；且 CN 侧 B 全缺（`:105` 无任何放置半句） |

**缺口定性**：两面对「测试层级」只有零碎半句（无定义、无放置）——正是 09-29 批在工程面所闭的伪问族（「单元测试该放哪 ∥ 集成测试该放哪 ∥ 要不要把单元件迁进 `test/`」）在 normal 面的同款开口。

### 2.3 落点与改法（四落点）

| # | 落点 | 动作 | 形态 |
|---|---|---|---|
| 1 | EN `thincoder-core/prompts/discipline-normal.md:105` ∥ `:106` | 整行替换（并文——定义 + 放置细目并入既有单元 ∥ 集成两行） | 拟文 = 2.4 EN 块；`##` 块计数零连带 |
| 2 | CN `docs/core/design/prompts/discipline-normal.md:103` ∥ `:104` | 整行替换（同形） | 拟文 = 2.4 CN 块；同上 |
| 3 | `docs/core/design/PROMPT-SYSTEM.md` §6.10 / §6.1 / §7 / 变更记录 | 机制面随动（扩双模式） | **已落**（11 处；读数 = 2.10） |
| 4 | 零触面 | EN `:107` ∥ CN `:105`（音量行）· 两档其余节 · 工程面两档 · 需求 ∥ 台账 ∥ 记录面 | 见 KD-3 / KD-6 / 2.9 |

**落地分工（提示词纪律）**：拟文 = 本设计轮起草逐字（2.4）→ 主 agent 确认（内容权）→ 落笔（先例 = 09-29 批：CN 正本设计师笔 ∥ EN 运行面 eng-coder 笔；本批分工父侧裁）；**两稿措辞修正同步约束**（任一稿修正 ⇒ 两稿同改再落）。

### 2.4 拟文全文（逐字稿——可直接落地形）

**CN 正本**（`docs/core/design/prompts/discipline-normal.md:103` ∥ `:104` 改后逐字）：

```md
- 代码改动必须验证。**单元测试**：**在隔离下测单个组件**（外部协作者打桩隔离）——开发者改完即跑的反馈回路，回答「刚改的这处对了没有」；**单元测试用例随批次档存**（开发期工具——不占项目 `test/` 树）。**单元测试档**：一批一至几个测试文件，文件名随批次档、住批次目录；**单元测试永不转集成**——集成用例一律按业务需要另行设立。
- **集成测试**：**测组件协同**（真实组合）——**上线前的验收回路：从用户能看见的入口，把真实业务走一遍**；项目资产：业务场景 + 生产问题补入，只断言业务可观察结果；常驻，**不因单次改动而增补**；发布门 = 项目的完整验证链。**集成测试用例与测试代码同住项目的 `test/` 目录**；**集成集只住前端口**——测前端自然带到核心（核心不设集成集）。
```

**EN 运行面**（`thincoder-core/prompts/discipline-normal.md:105` ∥ `:106` 改后逐字）：

```md
- Code changes must be verified. **Unit tests** exercise **a single component in isolation** (its external collaborators stubbed or faked) — the **feedback loop the developer runs right after the change**, answering "did this spot get fixed right?"; **unit test cases stay with the batch record** (**development-time tools — they don't occupy the project's `test/` tree**). A batch's unit tests are kept as **unit test files** — named after the batch record, kept in the batch directory, one to a few files per batch; **unit tests never convert into integration tests** — integration cases are established from business needs, not graduated from unit files.
- **Integration tests** exercise **components working together** (the real composition) — the **pre-release acceptance loop**: walk through the real business from a user-visible entry; project assets: business scenarios + production-problem additions, asserting only business-observable results; permanent, **never augmented per single change**; the release gate is the project's full verification chain. **Integration test cases and test code live together in the project's `test/` directory**; integration suites live in the **front-end entry points only** — front-end scenarios cover the core transitively (the core carries no integration suite).
```

**行宽读数**：CN 178 ∥ 187（≤300 ✓——docs 域）；EN 657 ∥ 649（运行期面不在 docs 行宽域）。
**引用锁预核（一次性）**：四行对 J1 ∥ J2 ∥ J3 三式 = 0 ∥ 0 ∥ 0（`§` 零命中 · `.md` 形零命中）——落地后以 `scripts/prompt-refs-check.mjs` 复跑为准。

### 2.5 双面对照（逐段对应 · 13 条）

| # | 语项 | CN（`:103` ∥ `:104`） | EN（`:105` ∥ `:106`） |
|---|---|---|---|
| 1 | 验证义务（原句保留） | 代码改动必须验证。 | Code changes must be verified. |
| 2 | 单元定义 | 在隔离下测单个组件（外部协作者打桩隔离） | a single component in isolation (its external collaborators stubbed or faked) |
| 3 | 单元用途 | 开发者改完即跑的反馈回路，回答「刚改的这处对了没有」 | the feedback loop the developer runs right after the change, answering "did this spot get fixed right?" |
| 4 | 单元放置（正向 + 负向排除） | 单元测试用例随批次档存（开发期工具——不占项目 `test/` 树） | unit test cases stay with the batch record (development-time tools — they don't occupy the project's `test/` tree) |
| 5 | 单元档形 | 单元测试档：一批一至几个测试文件，文件名随批次档、住批次目录 | A batch's unit tests are kept as unit test files — named after the batch record, kept in the batch directory, one to a few files per batch |
| 6 | 类间不互转 | 单元测试永不转集成——集成用例一律按业务需要另行设立 | unit tests never convert into integration tests — integration cases are established from business needs, not graduated from unit files |
| 7 | 集成定义 | 测组件协同（真实组合） | components working together (the real composition) |
| 8 | 集成用途 | 上线前的验收回路：从用户能看见的入口，把真实业务走一遍 | the pre-release acceptance loop: walk through the real business from a user-visible entry |
| 9 | 集成性质 | 项目资产：业务场景 + 生产问题补入，只断言业务可观察结果 | project assets: business scenarios + production-problem additions, asserting only business-observable results |
| 10 | 常驻性 | 常驻，不因单次改动而增补 | permanent, never augmented per single change |
| 11 | 发布门（normal 固有条——保留） | 发布门 = 项目的完整验证链 | the release gate is the project's full verification chain |
| 12 | 集成放置 | 集成测试用例与测试代码同住项目的 `test/` 目录 | Integration test cases and test code live together in the project's `test/` directory |
| 13 | 集成集射程 | 集成集只住前端口——测前端自然带到核心（核心不设集成集） | integration suites live in the front-end entry points only — front-end scenarios cover the core transitively (the core carries no integration suite) |

对位结论：13 ∥ 13 逐条对应（语义对等、各面原文自持——不做字节一致，D-PS1 ∕ D-PS4）。

### 2.6 受影响文件与测试面

| 文件 | 现况 | 本批增量 | 面 / 笔 |
|---|---|---|---|
| `thincoder-core/prompts/discipline-normal.md` | 208 行 | **±0 行**（`:105` ∥ `:106` 两行整行替换） | EN 运行面（落笔随提示词纪律） |
| `docs/core/design/prompts/discipline-normal.md` | 204 行 | **±0 行**（`:103` ∥ `:104` 两行整行替换） | CN 正本（同上） |
| `docs/core/design/PROMPT-SYSTEM.md` | 553 → **563 行**（+10） | §6.10 扩（+6）· §7 D-PS13（+1）· §6.1 ∥ D-PS11 行内 · 变更记录（+3） | 设计档（eng-designer——已落） |

**测试面**：产品测试面 = 无（提示词文本批）；单元档 = 无（一次性比对核）；集成影响 = 无；仓套件 = 不跑（文本批——按纪律归父侧收口）。
**机检**：`scripts/prompt-refs-check.mjs`（落地后复跑——零命中判据）· `scripts/doc-check.mjs`（设计档面——读数见 2.10）· 提示词档免档位判定。

### 2.7 验收对照（AC——回指条目）

- **AC-1 双面落点到位**：两档四行 = 2.4 逐字稿（一次性逐行比对）；行数 ±0 · `##` 块计数前后不变（EN 6 ∥ CN 6）。
- **AC-2 知识齐备（定义 ∥ 放置细目）**：两档各含 ①单元定义 ②集成定义 ③单元放置（「不占项目 `test/` 树」）④集成放置（「同住项目的 `test/` 目录」）⑤前端口射程——逐项在场各 1 处；**放置句各带类别限定词**（裸「测试用例」放置断言 = 0——禁合称）。
- **AC-3 零文档引用**：`node scripts/prompt-refs-check.mjs` 复跑 = J1/J2/J3 三式零命中（落地后为准；拟文预核 = 0）。
- **AC-4 流程约束零搬迁**：新文零工程约束词（门 ∥ 收口跑 ∥ 报告义务 ∥ eng-coder ∥ 父侧 ∥ 不代跑——逐词扫描 = 0）。
- **AC-5 工程面零触**：`thincoder-core/prompts/discipline-engineering.md` ∥ `docs/core/design/prompts/discipline-engineering.md` 两档 diff = 0。
- **AC-6 行宽**：CN 两新行 ≤300（实测 178 ∥ 187）；EN 面不在 docs 行宽域。
- **AC-7 设计档读回（D6）**：`PROMPT-SYSTEM.md` §6.10 / §7 D-PS13 / §6.1 / 变更记录 读回 = 设计判据（读数见 2.10）。

### 2.8 关键决策（KD · 含否决）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| KD-1 | **并文（既有两条 bullet 整行替换）**——定义 + 放置细目并入 normal 面既有单元 ∥ 集成两行 | 与工程面同形（D-PS2 复用存量词句）；否决「新增独立放置节」（块计数连带 + 越既有节形态）·「另加两条 bullet 不动原行」（抽象指针与具体知识同场并存——复述） |
| KD-2 | **纳入面** = ①定义 ②放置（正 ∥ 负 ∥ 射程）③类间不互转 ④单元档形（一批一至几个文件 ∥ 名随批次档 ∥ 住批次目录） | 「放置细目」= 放置事实面全量（含类间不互转——正是伪问「要不要迁进 `test/`」的闭口句）；否决「只补放置句」（定义缺半——伪问不闭） |
| KD-3 | **排除面 = 工程流程约束（零搬迁）**——收口测试行 ∥ 门禁（一条 `test` 全绿）∥ 迭代期只跑单元 ∥ 仓套件收口跑（父侧）∥ 谁写谁跑（改动实施者本人 ∥ 不代跑 ∥ 不逐轮复跑）∥ 散文锚禁令 ∥ 09-29 清出项（硬路径 ∥ 命令形 ∥ 三前端名） | 两模式之别 = **是否强流程约束**（用户 16:46）：normal = 纪律非结构强制 ⇒ 工程约束面不入；散文锚禁令 = 测试写作纪律（非层级知识）。否决「照搬工程侧全节」（携工程约束——超知识面） |
| KD-4 | **保留原句「代码改动必须验证」（并为首句）+ 保留 normal 固有「发布门 = 项目的完整验证链」** | 零静默丢弃；否决「整句原样保留 + 另加两条」（多一行 + 抽象政策指针与具体放置并存） |
| KD-5 | **抽象指针退场**：原「用后去留按项目的测试生命周期政策」⇒ 具体放置句（随批次档存 ∥ 不占 `test/` 树） | 口径 = 具体知识（用户 16:46）；该指针 = 抽象政策引用，且与工程面同机制不同形（跨面差异默认消除）；残留指针登记 F-2 / R-1 |
| KD-6 | **落点 = 既有节内增列 · 音量行（EN `:107` ∥ CN `:105`）零触** | 音量条非缺口面（缺口 = 定义 ∥ 放置）；两档 `##` 块计数零连带 |

### 2.9 观察与上抛（发现逐条 · 不静默）

- **F-1（既有 EN ∥ CN 表述差 · 本批零触）**：音量行 EN `:107` 括注「unit test files stay with their batch record」∥ CN `:105`「单元档不累积」（无放置半句）——本批后 EN 侧该括注与 `:105` 新放置句重复（工程面同款重复在册）。处置候选：CN 补 ∥ EN 减 ∥ 维持（另裁）。
- **F-2（抽象指针残留 · 本批零触）**：两档 `:8`（Feature 行）仍持「retention per the test-lifecycle policy ∥ 用后去留按测试生命周期政策」——具体放置知识现落测试节；是否收正为「随批次档存」（另裁）。
- **F-3（读数面 · 本批零触）**：normal 面「集成集不超窗」无窗口读数（工程面 = 50–100）——参数面非本批知识面（另裁）。
- **R-1（需求面笔候选 · 笔权 = 主 agent · 非阻塞）**：`docs/core/requirements/PROMPT-SYSTEM.md:114`（纪律层 `discipline-normal.md` 大纲「收尾前」行——现「测试交付（lint→verify 声明 status）」）——候选补「测试层级知识（单元 ∥ 集成定义与放置）」，使三链同源可核。
- **落地轮备忘**：两稿措辞修正同步约束（任一稿修正 ⇒ 两稿同改）；落地后 `prompt-refs-check.mjs` 复跑 + 逐字对照 2.4。

### 2.10 读回（D6）· 设计档落点读数

- `docs/core/design/PROMPT-SYSTEM.md`：**553 → 563 行**（+10）；`##` 11 ∥ `###` 23（均不变）；>300 字符行 **9 → 9（零新增）**；其中 D-PS11 行因本批注 +40 字符——该行原已超限（非本批新增违规行），登记在册。
- 落点读回：§6.10（`:275` 标题 / `:279-280` 扩展来源 / `:285-287` 分层归属 / `:289-290` 落点 / `:293` 口径 / `:296` 机检面 / `:298` 边界）· §7 `:346`（D-PS11 注）· `:348`（D-PS13）· §6.1 `:160` · 变更记录 `:452-453`——逐处读回 = 设计判据。
- 提示词两档（本批落点）**零落笔**（拟文在 2.4——内容权 = 主 agent；落地随提示词纪律）。

### 2.11 修复轮（轮 1 · 2026-09-30）——§3 三号逐条收正

（本块 = §3 轮次 1 三号收正记录——父侧逐条裁已并入各项；三号收正视读以本块为准。）

- **修-1（🟡 发现 1 · AC-4 扫描词自撞）**：扫描词「门」收正为工程侧专属形「**门禁**」；并明列排除面——KD-4 保留句（CN「发布门 = 项目的完整验证链」2.4 `:63` ∥ EN "the release gate is the project's full verification chain" 2.4 `:70`；对照表 #11）为**保留项 · 不计入违规判定**。收正后 AC-4 读作——**AC-4 流程约束零搬迁**：新文零工程约束词（**门禁** ∥ 收口跑 ∥ 报告义务 ∥ eng-coder ∥ 父侧 ∥ 不代跑——逐词扫描 = 0）；**排除面（保留项 · 不计入违规判定）**：KD-4 保留句（CN「发布门 = 项目的完整验证链」∥ EN "the release gate is the project's full verification chain"）。⇒ 按字面（子串 ∥ 分词任一实现）可判且结果 = 0（预核：拟文四行六扫描词子串 = 0；「发布门」∥ "release gate" 各 1 = 保留句）。拟文四行正文零动（扫描面收正即足）。
- **修-2（🟡 发现 2 · F-1 处置未定）**：父裁 = **维持 + 登记**——EN `:105` 新句 与 `:107` 括注（"unit test files stay with their batch record"）重复面：**本批容忍**；**统一时机 = 两档（`discipline-normal.md` EN ∥ CN）下次结构性触碰**。原三候选（CN 补 ∥ EN 减 ∥ 维持）⇒ 定为「维持」；F-1 结论记录 = 本块（登记延续 2.9）；F-2 ∥ F-3 ∥ R-1 = 维持登记待裁（本批零动作）。
- **修-3（🔵 发现 3 · §2.2 缩写未定义）**：§2.2 表头「已有（对 A ∥ B）」与行内缩写所指补明（表注 · 本块）：**A = ①定义 ∥ B = ②放置**（与同节首段「知识两条 ①定义 ∥ ②放置」编号口径对齐）。

**边界（本修复轮）**：拟文四行（2.4）正文零动 ∥ 需求档（R-1）零触 ∥ 产品码零触 ∥ §2 前文既有行零动。
**读回（D6）**：三号逐条在盘（本块）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收判据·可核性 | 🟡 | AC-4 扫描词表含裸「门」（批档 `:112`）；本批拟文自身保留句「**发布门 = 项目的完整验证链**」（批档 `:63` ∥ 对照表 #11 `:90` ∥ KD-4 `:124`）及 EN 侧 "the release gate…"（批档 `:70`）均含该词形——按子串扫描该 AC 在自家拟文上即命中（≠0），按分词扫描才为 0；过 / 不过取决于扫描实现，结论不可复判。 | 把扫描词改为工程侧专属词形（如「门禁」），或在本 AC 的排除面显式列出 KD-4 保留句（EN 侧同理排除 "release gate"），使该扫描按字面可判且结果 = 0。 |
| 2 | 范围·协调（非缺陷） | 🟡 | 四项观察 / 上抛（F-1 ∥ F-2 ∥ F-3 ∥ R-1）均已登记、处置皆「另裁」（批档 `:130`–`:133`）：F-1 的 EN 重复面（新 `:105` 句 与 `:107` 括注）随本批落地即成同文件双句并存事实而结论未定；F-2 / F-3 / R-1 本批零动作。 | F-1 在三候选（CN 补 ∥ EN 减 ∥ 维持）中择一或在落地前明示「维持」，并留一处结论记录；F-2 / F-3 / R-1 维持登记待裁。 |
| 3 | 清晰度 | 🔵 | §2.2 审计表表头「已有（对 A ∥ B）」（批档 `:39`）与其行内缩写 A ∥ B（批档 `:41` ∥ `:42`）未定义——A / B 与同节首段「知识两条 ①定义 ∥ ②放置」的对应关系需读者反推。 | 在表头或表下注写明 A ∥ B 所指（如「A＝定义 ∥ B＝放置」或「A＝单元侧 ∥ B＝集成侧」），与该节编号口径对齐。 |

域外注（无严重度）：(a) 落点两档 `discipline-normal.md`（EN `:105/:106` ∥ CN `:103/:104`；208 ∥ 204 行；`##` 6 ∥ 6）不在本轮评审域、未核——落笔以落地档现文为准；(b) 对照表 #5/#6/#9/#10 各条「复用存量词句」来源（工程侧两档现文）未核；(c) `scripts/prompt-refs-check.mjs` ∥ `scripts/doc-check.mjs` 实际判据未核；(d) R-1 所指需求档行号未核。另：本轮无文档地图与项目标准档声明 ⇒ 文档归属 / 方法学判据按 PROMPT-SYSTEM.md 自身体系（§6.1 ∥ §6.10 ∥ §7 D-PS1 ∥ §6.1 D2）判，属降级判定——降级项未发现归属缺陷（§6.10 就地扩写 ∥ D-PS13 入 §7 ∥ 变更记录入册，均 amend 既有归属面）。

在域核（本轮实测）：PROMPT-SYSTEM.md 现盘 **563 行** ∥ `##` **11** ∥ `###` **23** ∥ >300 字符行 **9**（含 D-PS11 `:346`）——与 2.10 读数一致；落点 `:275` ∥ `:279-280` ∥ `:285-287` ∥ `:289-290` ∥ `:293` ∥ `:296` ∥ `:298` ∥ `:346` ∥ `:348` ∥ `:160` ∥ `:452-453` 逐处读回相符；CN 拟文行宽 178 ∥ 187 与 EN 657 ∥ 649 实测相符（逐位界核）。

计数：🔴 0 ∥ 🟡 2 ∥ 🔵 1。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-01 00:2x · [代签 · 承用户令]**

用户 2026-09-30 23:42「实活都做了」∥ 23:44「别的也不该等」= 全线点火令。本批评审 **pass**（§3 轮次 1：🔴0 · 🟡2 · 🔵1）+ 修复轮（§2.11 三号：AC-4 扫描词收正 ∥ F-1 维持+登记 ∥ A/B 补明）逐条落定并读回 ⇒ 按令**代签放行**。

落地分笔（父侧裁）：CN 正本（`docs/core/design/prompts/discipline-normal.md`）= 设计师笔 ∥ EN 运行面（`thincoder-core/prompts/discipline-normal.md`）= eng-coder 笔（令牌面）；**内容权 = 本确认**——两笔一律 **§2.4 围栏拟文逐字**（零增删）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（EN 运行面一笔：§2.4 围栏逐字落位 · 机检零命中 · 审计 all-clear ∥ 评审 pass · 零 fix round）


（本块 = 落地轮落笔 · 2026-10-01 · eng-coder——EN 运行面一笔；承 §2.4 EN 围栏逐字（内容权 = §4 代签）；令牌面落笔。）

### 5.1 交付摘要

- **落点**：`thincoder-core/prompts/discipline-normal.md:105` ∥ `:106`——整行替换为 §2.4 EN 围栏逐字（零增删 ∥ 零改标点）。
- **文件面**：仅此 1 档、2 行——无清单外改动。
- **逐字读回（字符级 `===` 比对）**：`:105` = 围栏 `:69`（657 字符，`=== true`）∥ `:106` = 围栏 `:70`（649 字符，`=== true`）。
- **回归面**：档 208 行（±0）· `##` 6 ∥ `###` 14（不变）· 邻居行 hash 未变（`:104` b6b8db2c8cd2 ∥ `:107` 3794abfcb2eb ∥ `:108` 603d9a3bb335）· git diff = 单档单 hunk −2/+2。
- **机检复跑**：`node scripts/prompt-refs-check.mjs` ⇒「提示词面 84 档 · 代码面 401 档 · 命中 0」· `OK(prompt-refs): J1/J2/J3 三式零命中`。
- **扫描面**：新文六扫描词（门禁 ∥ 收口跑 ∥ 报告义务 ∥ eng-coder ∥ 父侧 ∥ 不代跑）∥ EN 对位形（closeout ∥ obligation ∥ report ∥ parent ∥ behalf）= 0；唯一 `gate` = KD-4 保留句（§2.11 修-1 排除面）。
- **零触面**：`:107` 音量行（F-1 父裁维持——括注原样保留）∥ 档内其余节 ∥ CN 正本 ∥ 产品码 ∥ 需求档 ∥ `PROMPT-SYSTEM.md`——本笔零动作。
- **未跑项**：仓套件未跑（按令——收口轮由父侧恰跑一次）。

### 5.2 决策透明表

| # | 实现决策 | 依据 / 理由 |
|---|---|---|
| D-1 | 整行替换以内容 hash 定位（两行一并替换） | 长行（181 ∥ 134 → 657 ∥ 649）内容串匹配有漂移风险；hash 定位失效即报错、不静默 |
| D-2 | 逐字比对用字符级 `===`（读回）而非肉眼形核 | 657/649 字符 + em dash ∥ 直引号面——形核不可靠，字符级 `===` 才是判据面 |
| D-3 | 零旁逸：未顺手处理 F-1 重复面 ∥ 未动 `:107` | §2.11 修-2 父裁「维持 + 登记」（统一时机 = 两档下次结构性触碰） |

### 5.3 审计与评审轮次 · fix round · 终态

- **内部 explore 分歧审计（轮 1）**：`all-clear`——四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 越清单）零发现；逐行 SHA256 前缀双侧相等（`fbbf578e551f` ∥ `14fdd577f615`）；审计自陈两项无工具面复跑项（git 单-hunk ∥ 机检脚本实跑）由本笔读数补齐。
- **内部 advisor 代码评审（轮 1）**：`pass`——🔴 0 ∥ 🟡 0 ∥ 🔵 2（均为存量登记项复核，顾问标「零动作 · 沿父裁 · 不重开」）。
- **响应表（advisor 轮 1）**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | F-1（`:105` 新句与 `:107` 括注同知识重复）——§2.11 修-2 父裁「维持 + 登记」（本笔零动作） |
| 2 | Deferred | F-2（`:8` Feature 行抽象指针残留）——§2.11 修-2 父裁「维持登记待裁」（本批零触） |

- **fix round**：0 轮（审计 all-clear ∥ 评审 pass，无 🔴 ∥ 🟡）。
- **终态**：`clean`。

## §6 验证与收口（父代理）
