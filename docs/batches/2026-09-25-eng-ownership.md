# 2026-09-25 · 工程模式归属口径统一
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 指正「桌面端需求档把『工程模式状态』误归项目级」并令挖出仓内残留（「你作为 agent 不会凭空创造出没有的东西」）；两路只读侦察 + 父侧自核确认；台账 #358。
> 台账 = #358（工程模式归属口径统一 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-25 指正：父侧在 `docs/desktop/requirements/PROJECT.md` 把「工程模式状态」归为**项目级**；用户判断「agent 不会凭空创造，仓内必有残留」并令挖出、消除。执行 = 两路只读侦察（文档/提示词面 · 代码面）+ 父侧抽核（人格档首句自读 · CLI/扩展端镜像写行为自核）。

### 1.2 已确认事实（实核坐标）

- 模式的**状态** = **会话级**：`thincoder-core/session.mjs:118-136`（会话槽字段含 `engineering` / `activeProvider` / `activeModel` / `autoApprove` / `planMode`）· `thincoder-core/session-lifecycle.mjs:109-115`（载入恢复）· `thincoder-core/session-slot-write.mjs:135`（单字段写）· `thincoder-core/agent-tools/eng.mjs` 档头注「Toggled here at session level … the session slot is the sole authority」。
- **项目级** = 台账（按项目根键控）· `PROJECT-MANIFEST.json`（`phase` / `activeBatch`）· `.thincoder/conventions.json`（分类声明）。
- 唯一真实耦合 = 模式 **ON 方向的准入判据**读项目 manifest（`thincoder-core/manifest.mjs` 的 `resolveEngineeringManifest`）——状态与判据两层，不得混为一谈。

### 1.3 残留清单（本批射程）

| 面 | 条 | 坐标（现状） |
|---|---|---|
| 提示词双面 | 6 | `thincoder-core/prompts/persona-engineering.md:3` ∥ `docs/core/design/prompts/persona-engineering.md:3`（**每回合注入**）· `thincoder-core/prompts/advisor-design.md:2` ∥ `docs/core/design/prompts/advisor-design.md:3` · `thincoder-core/prompts/common.md:163` ∥ `docs/core/design/prompts/common.md:123` |
| 需求档 | 2 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:55`（「在场 = 该项目在工程模式管理下」）· `docs/core/requirements/ENGINEERING-MODE-V2.md:168`（**过期处方**「缺 manifest 时机制拒绝进入正常循环」——已被 AC-M1-2 废止） |
| 设计档 | 1 | `docs/core/design/ENGINEERING-MODE-V2.md:324`（模式门判据句丢「会话权威值」限定；同档 `:217` 为完整口径 ⇒ 档内张力） |
| 码面表述 | 7 | `thincoder-core/manifest.mjs:2`（档头把项目档叙述成模式的从属模块）· `:22`（命名补注）· `conventions.mjs:4-11`（把共用分类面说成模式专属）· `config.mjs:51`（注释缺「仅初始默认」）· phase 标签 `discipline` 与会话模式概念**同词**（`agent/setup-reminders.mjs:66-67` 映射 ↑ 纪律档名）· `agent-tools/spawn-gates.mjs:79-80`（注释 + 报错文案：实际对所有会话生效却报 engineering tool path）· `session-slots.mjs:88`（会话 `.manifest` 指针 vs 项目 `PROJECT-MANIFEST.json` 命名撞车） |
| 行为面 | 1 | 扩展端翻转**槽 + config 双写**（`thincoder-vscode/src/agent/setup-tooltable.mjs:90-107`）∥ CLI 只写槽（`thincoder-cli/src/tui/cmd-eng.mjs:84-87`） |

### 1.4 父侧内容裁定（提示词面逐字——**落地不再改形**）

| # | 坐标 | 现状 → 裁定 |
|---|---|---|
| P1a | `thincoder-core/prompts/persona-engineering.md:3` | `【Engineering mode — this project is under engineering discipline.】` → `【Engineering mode — engineering discipline is in force for this session.】` |
| P1b | `docs/core/design/prompts/persona-engineering.md:3` | `【工程模式——本项目处于工程纪律之下。】` → `【工程模式——本会话处于工程纪律之下。】` |
| P2a | `thincoder-core/prompts/advisor-design.md:2` | `You are an independent design reviewer for an engineering-mode project.` → `You are an independent design reviewer for a design review inside an engineering-mode session.` |
| P2b | `docs/core/design/prompts/advisor-design.md:3` | `你是工程模式项目的独立设计评审员。` → `你是工程模式会话内一次设计评审的独立评审员。` |
| P3a | `thincoder-core/prompts/common.md:163` | 删限定语：`…are defined by the project's own batch-record mechanism…` → `…are defined by the batch-record mechanism…` |
| P3b | `docs/core/design/prompts/common.md:123` | 「由**项目自身的批次档机制**定义」 → 「由**批次档机制**定义」 |

（判据：只换主语 / 删限定，句形与长度量级不变，零语义外溢。）

### 1.5 用户裁定

**镜像口径统一到「槽唯一权威」**：扩展端停写 config 镜像——翻转不再静默改变「新会话的初始默认」；与 CLI 现行代码及其 2026-09-08 裁定（`ENG-SESSION-PROVIDER-CLEANUP` D1.1）同向。

### 1.6 边界

- 不改模式**语义本身**（模式仍是会话级；本批只清表述与镜像行为）；
- 不动 ACP 面；
- **不重命名** `resolveEngineeringManifest` 导出名（6 个调用点 + 测试逐名断言；改注不改名）；
- 需求档那 2 条 = **父侧笔**（需求档唯一作者），本批设计轮不涉；提示词面逐字 = 父侧裁定（上 §1.4），设计轮只管落笔形与影响面。

### 1.7 批级判据

① 同族字面零命中（「项目级 / 仓库级 / 全局」×「工程模式」）· ② 提示词双面各自自持、语义一致 · ③ phase 标签与会话模式概念**不再同词** · ④ 两端镜像行为一致（扩展端零 config 镜像写）· ⑤ 三包测试全绿（含逐字断言改动的同步）· ⑥ 机检（`node scripts/doc-check.mjs`）零新增闸态失败。

### 1.9 评审后收正（父侧 · 2026-09-25）

**说明**：§1.7 判据表为一行式（append-only 段不重写）——本节为其**收正后权威形**。

- **判据① 收正**（原形有自反假红：本批刚收正的 `ENGINEERING-MODE-V2.md:324` 同一行内既含「工程模式」又含「项目级」= 正确陈述）。新形 = ①-a **定向否定扫描**（「模式…项目级」/「属于项目」类断言形）零命中；①-b 该行属**显式白名单**（正确陈述：状态 = 会话级 · 项目级 = 台账 / 项目状态档 / 声明面）。
- **判据③ 收正**（原形把「17 处」当字面数：设计面 `(rigor: ` 实读仅 5 处）。新形 = ③-a `(discipline: ` 文档面零命中（实测 ✓）；③-b `rigor` 逐处断言（17 个命中面 = 码 5 + 测试 5 + 设计 7；其中 `MANIFEST.md:270` / `:490` 为**无括号形**，不得按字面计）。
- **事实更正**：`PROJECT-MANIFEST.json` 现值清单 = **五键**（`version` / `phase` / `docRoot` / `promptsLanding` / `checkConfig`）——`activeBatch` 已于 2026-09-17 全链撤销（`MANIFEST.md:198` KD-M1-10）。§1.2 的旧记法作废。
- **射程边界依据（在评 #4 的答）**：边界**按「键」划，不按「手法」划**——纳入 `panel-messages-settings.mjs:178-180`（= **engineering 键**翻转路径的 config 镜像写）· 排除 `:163-166`（= **advisor.guard 键**，另一键另一路径；同族手法 ≠ 同族裁定，§1.5 裁定射程只及 engineering）。判据④ 的读数面 = engineering 翻转路径（实施轮落地时逐处确认；若 `:163-166` 实为 engineering 路径组成部分则一并纳入）。advisor.guard 键的收口 = 台账 #362。
- **评审引用核验**：主机核验报 `ENGINEERING-MODE-V2.md:341` / `MANIFEST.md:182` 两条「内容不符」——父侧 grep 逐字复核，**两条实际属实**（原文在位）⇒ 主机侧核验在此二例为**误报**；评审结论不受影响。

### 1.10 实施轮并发面（父侧实读 · 2026-09-25 16:5x）

**事件**：实施轮（eng-coder）报 peer-collab 警告——另一活体实例（pid 17904 · slot 43）对本批数个档持写入意图声明，且 5 分钟内注册写过 `docs/core/design/prompts/common.md`。父侧实读处置如下。

**核查结论（证据）**：
1. **非重复批**：该实例（父侧经会话槽表实读）在跑**另外的批**——`docs/batches/2026-09-25-hygiene-items.md`（#295 提示词补译）与 `docs/batches/2026-09-25-doc-face-closeout.md`（文档面收尾 · 裸编号 sweep）；与本批交付目标不同。
2. **本批改动未被覆盖**：六处提示词落地 + 三处码面改动**逐处实读在位**（见 §1.4 逐字对照）；无第三方内容侵入。
3. **坐标漂移（+1）**：该实例在 CN `common.md` `:72` 后新增一行（其批的落笔）⇒ 本批 P3b 的靶坐标由 `:123` 漂至 `:124`——**内容已在位**（「**结构权威**：段结构 / 门禁 / 生命周期由**批次档机制**定义（本节只给全图，不重述机制）。」）；坐标以实施轮读回为准（§5 载）。
4. **重叠面（供后续批避让）**：两会话共碰 `docs/core/design/prompts/common.md`；`docs/core/design/DOC-DISCIPLINE.md` 为其批读面、本批修复轮（#14）写面——**收敛后须复核该档未被交叉覆盖**。

**处置**：不锁文件、不中止对方（非同批不构成越权）；本批收尾以**逐档读回**为准（实施轮已按此执行），父侧在台账核销前复读一次。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-25 · initial 轮 · 17 条逐条处置 · 上抛 8 项待父侧）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**轮次**：initial（设计轮）· 任务书 = 本档 §1 · 台账 = #358 · 作者 = eng-designer（笔 = `docs/core/design/{ENGINEERING-MODE-V2.md,MANIFEST.md}` 两档）

### 2.1 本批条目（覆盖 · 17 条逐条处置）

处置口径：**语义面**（口径 / 行为改动——须裁定 + 设计承载）· **一致性面**（表述 / 注释 / 标签撞车——就地收正，仍逐条报告）。

| # | 面 | 坐标（实读） | 处置 | 类型 |
|---|---|---|---|---|
| 1 | 提示词 · 英文运行面 | `thincoder-core/prompts/persona-engineering.md:3`（每回合注入） | 逐字按 §1.4 P1a；**落地 = 父侧**（提示词内容权非本笔） | 语义面（已裁） |
| 2 | 提示词 · 中文审核面 | `docs/core/design/prompts/persona-engineering.md:3` | 逐字按 §1.4 P1b；落地 = 父侧 | 语义面（已裁） |
| 3 | 提示词 · 英文运行面 | `thincoder-core/prompts/advisor-design.md:2` | 逐字按 §1.4 P2a；落地 = 父侧 | 语义面（已裁） |
| 4 | 提示词 · 中文审核面 | `docs/core/design/prompts/advisor-design.md:3` | 逐字按 §1.4 P2b；落地 = 父侧 | 语义面（已裁） |
| 5 | 提示词 · 英文运行面 | `thincoder-core/prompts/common.md:163` | 按 §1.4 P3a 删限定语（只删、不换词）；落地 = 父侧 | 语义面（已裁） |
| 6 | 提示词 · 中文审核面 | `docs/core/design/prompts/common.md:123` | 按 §1.4 P3b；落地 = 父侧 | 语义面（已裁） |
| 7 | 需求档 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:55` | 本笔零改（需求档唯一作者 = 主 agent）——建议口径见 §2.9 | 语义面（父侧笔） |
| 8 | 需求档 | `docs/core/requirements/ENGINEERING-MODE-V2.md:168` | 同上（过期处方——已被 AC-M1-2 废止） | 语义面（父侧笔） |
| 9 | 设计档 | `docs/core/design/ENGINEERING-MODE-V2.md:324`（§2.3 E5.1 表第 8 行） | **已落**：判据补会话权威值限定 + 三层指针 + 归属分层半句（§2.2 / §2.3） | 语义面（已设计） |
| 10 | 码面表述 | `thincoder-core/manifest.mjs:2` | **已设计**：档头括注改「项目级状态账 + 模式读侧消费者」（§2.4） | 一致性面 |
| 11 | 码面表述 | `thincoder-core/manifest.mjs:22` | **已设计**：`resolveEngineeringManifest` 命名补注（**不改名**——§1.6） | 一致性面 |
| 12 | 码面表述 | `thincoder-core/conventions.mjs:4-11` | **已设计**：段首叙述改共用分类面（零语义） | 一致性面 |
| 13 | 码面表述 | `thincoder-core/config.mjs:51` | **已设计**：注释补「仅初始默认 + 运行时判据取会话权威值」 | 一致性面 |
| 14 | 码面表述 | `thincoder-core/agent/setup-reminders.mjs:66-67`（phase 标签 `discipline` 与会话模式同词） | **已设计**：改名 `discipline` → `rigor`（命中面 17 处——§2.3） | 一致性面（命名撞车） |
| 15 | 码面表述 | `thincoder-core/agent-tools/spawn-gates.mjs:79-80`（注释）· `:101`（报错文案） | **已设计**：注释 / 文案补「模式无关」限定 + 文案锚改（测试三处同步） | 一致性面 |
| 16 | 码面表述 | `thincoder-core/session-slots.mjs:88` | **已设计**：行内尾注消歧（会话槽索引 ≠ `PROJECT-MANIFEST.json`） | 一致性面 |
| 17 | 行为面 | 扩展端翻转 = 槽 + config 双写（`thincoder-vscode/src/agent/setup-tooltable.mjs:90-107`）∥ CLI 只写槽（`thincoder-cli/src/tui/cmd-eng.mjs:84-87`） | **已设计**：按 §1.5 裁定删 config 镜像写（连带死引用——§2.4） | 语义面（已裁） |

**明确不在本批**（射程外，登记备查）：

- `docs/desktop/requirements/PROJECT.md:140`——父侧已就同一指正就地收正（实读在场：「工程模式属会话级」归入会话头）。
- advisor guard 面翻转仍双写（`thincoder-vscode/src/extension/panel-messages-settings.mjs:163-166`）——与 §1.5 同族，但**未列入 §1.3**，不在本批射程。
- 提示词档名 `prompts/discipline-engineering.md`——模式面档名，§1.6 范围外。

### 2.2 设计档落点（本笔已落 · D6 读回见 §2.8）

| 档 | 处 | 动作 | 行数增量 |
|---|---|---|---|
| `docs/core/design/ENGINEERING-MODE-V2.md` | §2.3 E5.1 表第 8 行（:324） | 原地收正——判据补**会话权威值**（槽优先 + config 回退）· 口径指本档 §2.3 E2 · 机制权威指 `MANIFEST.md` §2.2 · 补归属分层半句 | ±0 |
| 同档 | §2.3 E5.1 表第 3 行（:319）· §3.2 T8（:518） | phase 标签行形 `discipline` → `rigor` | ±0 |
| 同档 | §4 变更记录（首行位） | 新增 2026-09-25 一条 | +4 |
| `docs/core/design/MANIFEST.md` | §2.6 逐字行形（:267）· 标签映射（:270）· §3.1 AC-N1（:490）· §3.2 T8（:536）· T32（:565） | phase 标签 `discipline` → `rigor` | ±0 |
| 同档 | 变更记录（文末时序追加） | 新增 2026-09-25 一条 | +3 |

### 2.3 机制设计

**② 归属分层（口径 + 指针——零新机制）**

- **会话级** = 模式**状态**的真身：恢复槽字段 `engineering` / `planMode` / `autoApprove`（`thincoder-core/session.mjs:118-136` 定义 · `session-lifecycle.mjs:109-115` 载入恢复 · `session-slot-write.mjs:135` 单字段写）；承载档 = `SESSION.md` §6.1 / §6.3 / §6.4，单句权威 = `agent-tools/eng.mjs` 档头注「the session slot is the sole authority」。
- **项目级** = 台账（按项目根键控）· `PROJECT-MANIFEST.json`（项目状态账——五键 schema）· `.thincoder/conventions.json`（分类声明面）。
- **唯一真实耦合** = 模式 **ON 方向的准入判据**读项目 manifest（`manifest.mjs` `resolveEngineeringManifest`）；判据**取值**取**会话权威值**（`MANIFEST.md` §2.2 单源；口径限定 = `ENGINEERING-MODE-V2.md` §2.3 E2）。**状态与判据两层，不混为一谈**。
- 落地 = E5.1 表第 8 行补「限定 + 分层半句 + 三层指针」；`MANIFEST.md` §2.2 已是会话权威值口径**单源**（实读 :113），故**不改**（D2——不重述）。

**③ phase 标签改名 `discipline` → `rigor`**

- 理由：`discipline` 与会话模式面同词（模式面提示词档名 `discipline-engineering.md`），读者会把「纪律强度档」误读成模式标签；`rigor` 与 mode / discipline / plan / tier 各族字面零撞（`strictness` 与值 `strict` 同根而弃 · `tier` / `grade` 消歧弱而弃 · 弃标签 = 值信息丢失而弃）。
- **命中面（出货 / 活体面 = 17 处，逐处原地改、行数全 ±0）**：
  - 码面 `thincoder-core/agent/setup-reminders.mjs`：`:66`（注释）· `:67`（常量名 `MANIFEST_DISCIPLINE` → `MANIFEST_RIGOR`）· `:71`（注释行形）· `:74`（局部量）· `:75`（模板字面 + 局部量）= **5 处**。
  - 测试 `thincoder-core/test/setup-reminders.test.mjs`：`:78` · `:79` · `:83` · `:108`（字面断言）· `:182`（`lineOf` helper 参数与模板）= **5 处**（`:189` / `:192` / `:203` / `:215` / `:227` / `:241` / `:244` / `:332` / `:336` / `:360` / `:363` / `:366` 走 helper——零改）。
  - 设计面 `docs/core/design/ENGINEERING-MODE-V2.md`：`:319` · `:518` = 2 处；`docs/core/design/MANIFEST.md`：`:267` · `:270` · `:490` · `:536` · `:565` = 5 处。
- **不在命中面（零改）**：`thincoder-vscode/src/agent/setup-reminders.mjs:47`（同档同源转口 re-export——常量模块私有；VSC 端零改，判据④自动成立）· VSC 侧测试（`thincoder-vscode/test/setup-reminders.test.mjs:233` 只断布尔）· 记录面（`docs/batches/2026-09-17-activebatch-repeal.md` :107/:121/:264 · `docs/batches/2026-09-17-manifest-closeout.md` :105/:179/:357 · `docs/TODO-archive.md:192`——冻结，不回改）· 构建 / 会话产物 `.thincoder/tmp/**`（已忽略）。
- **判据③口径**：只判**带标签形** `(discipline: `（收正后应零命中 ∧ `(rigor: ` 全在位）；裸词 `discipline` 在他处**合法**（`thincoder-cli/src/tui/cmd-config.mjs:207` 英文随笔 · 提示词档名 `discipline-engineering.md` 模式面档名）——判据若用裸词即假红。**此收窄请父侧确认**（§2.9 项 2）。

### 2.4 码面 / 行为面改法（逐条 → 坐标 · 改法 · 行数预算）

| # | 坐标 | 改法（目标形） | 行数 |
|---|---|---|---|
| 10 | `thincoder-core/manifest.mjs:2` | 档头括注「（ENGINEERING-MODE v2 基础模块）」→「（项目级状态账——工程模式是其**读侧消费者**之一）」 | ±0 |
| 11 | `thincoder-core/manifest.mjs:22` | 条目尾部加括注「名中 `Engineering` = 历史命名（本批**不改名**——§1.6）；消费面 = 两端入口钩子 + 翻转面——**非**「模式拥有本模块」」 | ±0 |
| 12 | `thincoder-core/conventions.mjs:4-11` | 段首 `engineering-mode gates and guards` → `the write-domain gates and guards`（判据面 = 写域，模式无关）；末句补「a **shared** classification surface — those gates are consumers, not owners（消费面含 advisor / agent-tools / 两端）」 | ±0（8 行 → 8 行） |
| 13 | `thincoder-core/config.mjs:51` | 注释补「仅**初始默认值**——运行时判据取**会话权威值**（`MANIFEST.md` §2.2；模式门 = `ENGINEERING-MODE-V2.md` §2.3 E5.1）」 | ±0 |
| 14 | ③ 改名 | 见 §2.3 命中面表（17 处原地） | ±0 |
| 15 | `thincoder-core/agent-tools/spawn-gates.mjs:79-80`（注释首句）· `:101`（文案） | 注释「工程模式写入面 basename」→「写域 basename（**模式无关**——`PROJECT-MANIFEST.json` 是项目级状态档，其写门对任何会话生效）」；文案 `engineering tool path ${f} …` → `engineering-tools face path ${f} … （applies to every session, not engineering-mode-scoped）` | ±0 |
| 15b | `thincoder-core/test/spawn-gates.test.mjs:107` · `:123` · `:129` | 断言锚 `/engineering tool path/` → `/engineering-tools face path/`（三处同步） | ±0 |
| 16 | `thincoder-core/session-slots.mjs:88` | `manifestPath` 行内尾注「会话级槽索引 ≠ 项目级 `PROJECT-MANIFEST.json`」 | ±0 |
| 17 | `thincoder-vscode/src/extension/panel-messages-settings.mjs:178-180` | 删翻转路径的 `saveAgentSettingsFromPanel({ engineering: … })` 调用（§1.5 裁定：槽唯一权威——翻转不再改「新会话的初始默认」） | −3 |
| 17b | `thincoder-vscode/src/agent/setup-tooltable.mjs:98-105` | 删 `vscPersistRaw` config 镜像块；连带死引用 `:19` `CONFIG_CONFLICT_HINT` / `:23` re-export 删（`:94-97` 槽写**保留**） | −8 ~ −10 |

**行数硬限**（实读 as-of 本笔）：`session-slots.mjs` 299（≤300——#16 走行内尾注保零增量，不触 registry）· `spawn-gates.mjs` 110 · `setup-reminders.mjs` 256 · `conventions.mjs` 224 · `manifest.mjs` 451 · `config.mjs` 420。§5 开工前须按现况 re-read 复核坐标（行号为 as-of 引用）。

### 2.5 受影响文件与测试面（行数 = 本笔实读 as-of 2026-09-25）

| 文件 | 现状行数 | 本批增量 | 面 |
|---|---|---|---|
| `thincoder-core/agent/setup-reminders.mjs` | 256 | ±0 | ③ 改名 5 处 |
| `thincoder-core/test/setup-reminders.test.mjs` | 369 | ±0 | ③ 改名 5 处 |
| `thincoder-core/agent-tools/spawn-gates.mjs` | 110 | ±0 | #15 |
| `thincoder-core/test/spawn-gates.test.mjs` | 156 | ±0 | #15b |
| `thincoder-core/manifest.mjs` | 451 | ±0 | #10 / #11 |
| `thincoder-core/conventions.mjs` | 224 | ±0 | #12 |
| `thincoder-core/config.mjs` | 420 | ±0 | #13 |
| `thincoder-core/session-slots.mjs` | 299 | ±0 | #16 |
| `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 209 | −3 | #17 |
| `thincoder-vscode/src/agent/setup-tooltable.mjs` | 344 | −8 ~ −10 | #17b |
| `thincoder-core/prompts/{persona-engineering,advisor-design,common}.md` | — | 逐字（不动结构） | 落地 = **父侧** |
| `docs/core/design/prompts/{persona-engineering,advisor-design,common}.md` | — | 逐字（不动结构） | 落地 = **父侧** |
| `docs/core/design/ENGINEERING-MODE-V2.md` | 580 | +4 | 本笔已落 |
| `docs/core/design/MANIFEST.md` | 715 | +3 | 本笔已落 |

**测试面**：改 = `thincoder-core/test/setup-reminders.test.mjs`（③）· `thincoder-core/test/spawn-gates.test.mjs`（#15b）；零改 = VSC 侧两测试（`thincoder-vscode/test/setup-reminders.test.mjs:233` 只断布尔 · `thincoder-vscode/test/chat-panel-messages.test.mjs:384-410` 无镜像断言）。

### 2.6 验收对照（逐条回指 §1.7 判据）

| # | 判据（§1.7） | 机判 / 读数方式 | 现状 |
|---|---|---|---|
| ① | 同族字面零命中（「项目级 / 仓库级 / 全局」×「工程模式」） | 扫描面 = **活体面**（`docs/**` 除 `_archive` / `batches` · 三包 `src|agent|agent-tools|test|prompts` · `scripts/**`）；形式 = 同行共现扫描（UTF-8 感知 grep / node，**禁 findstr 中文**） | 本笔已扫：**活体面零命中**；同类命中仅 `docs/core/design/_archive/ENGINEERING-MODE.md:275`（归档面历史） |
| ② | 提示词双面各自自持、语义一致 | 逐字比对 §1.4 表（P1a–P3b 六处）；两面各自为独立文本（多实现面纪律条款 1/2），禁跨面改写 | 待父侧落地（本笔零改提示词） |
| ③ | phase 标签与会话模式概念不再同词 | 活体面 `(discipline: ` 零命中 ∧ `(rigor: ` 恰 17 处在位；**带标签形**（裸词合法——§2.3） | 设计面 7 处本笔已落；码面 / 测试 10 处待 §5 |
| ④ | 两端镜像行为一致（扩展端零 config 镜像写） | 静态读数：扩展端翻转路径 `saveAgentSettingsFromPanel`（engineering 参）/ `vscPersistRaw` 零命中；行为读数：翻转前后 `config.json` 的 `agent.engineering` 逐字不变 | 待 §5 实装 |
| ⑤ | 三包测试全绿（含逐字断言同步） | `npm test` × 3 包（含 §2.5 两处断言同步） | 待 §5 |
| ⑥ | 机检零新增闸态失败 | `node scripts/doc-check.mjs` 读数 vs 基线 | 本笔设计档落地后已跑——§2.8 |

### 2.7 关键决策记录（含弃选）

| KD | 决策 | 弃选与理由 |
|---|---|---|
| KD-1 | ③ 标签改名取 `rigor` | 弃 `strictness`（与取值 `strict` 同根，消歧反弱）· 弃 `tier` / `grade`（与 mode / phase / effort 各族区分度弱）· 弃「去标签只出值」（丢「纪律强度」维度信息）· 弃保留 `discipline`（与会话模式面同词 = 本批病灶本身） |
| KD-2 | ② 只原地收正 `ENGINEERING-MODE-V2.md:324`，`MANIFEST.md` §2.2 **零改** | `MANIFEST.md` §2.2 已是「会话权威值（槽优先 + config 回退）」**单源**（实读 :113）；D2 禁重述——两档同改即造双源 |
| KD-3 | 判据① 扫描面收窄为**活体面** | 归档面（`docs/core/design/_archive/**`）· 冻结批次档（`docs/batches/**`）· 会话产物（`.thincoder/tmp/**`）保留历史表述是记录本职；纳入即要求回改记录（违「记录面冻结」） |
| KD-4 | 判据③ 判据形收窄为**带标签形** `(discipline: ` | 裸词 `discipline` 在他处合法（`thincoder-cli/src/tui/cmd-config.mjs:207` 英文随笔 · 模式面档名 `discipline-engineering.md`）；裸词判据 = 假红（本笔已实证） |
| KD-5 | 模式门取值口径**双锚**（口径 = 本档 §2.3 E2 · 机制权威 = `MANIFEST.md` §2.2） | 弃「在本档重写取值规则」（重述即双源漂移之始） |
| KD-6 | 行为面镜像：扩展端**删** config 镜像写（§1.5「槽唯一权威」） | 弃「两端都写」（静默改「新会话初始默认」——正是本批病灶）· 弃「两端都不写」（CLI 现状已只写槽，改动面外扩） |
| KD-7 | `resolveEngineeringManifest` **只补注、不改名** | 6 调用点 + 测试逐名断言；改名收益 < 面扩（§1.6 已裁） |
| KD-8 | 提示词六处逐字**本笔零改** | 提示词内容权 = 主 agent（§1.4 父侧已裁逐字）；本笔只列影响面（§2.1 #1–#6） |
| KD-9 | ③ 改名命中面按「出货 / 活体面」定界（码 5 + 测试 5 + 设计 7 = 17 处） | 记录面（`docs/batches/2026-09-17-*` · `docs/TODO-archive.md`）不回改（冻结）；VSC 端同源 re-export 零改 |

### 2.8 自检读数（D6 读回 · ⑥ 门态）

**D6 读回（本笔两档实读）**

- `docs/core/design/ENGINEERING-MODE-V2.md`：`:319` 行形 `(rigor: <light|strict>)` 在位 · `:324`（§2.3 E5.1 表第 8 行）= 会话权威值限定（槽优先 + config 回退）+ 三层指针 + 归属分层半句 · §4 变更记录 +4 行。正文行数 ±0。
- `docs/core/design/MANIFEST.md`：`:267` / `:270` 标签形 `rigor` 在位 · `:490` / `:536` / `:565` 五处 · 变更记录 +3 行。正文行数 ±0。

**⑥ 机检门态**（`node scripts/doc-check.mjs` · exit 1 · 扫描域 docs 145 档）

- 闸态失败两类，**全部落在本笔未触碰的档**：
  - `FAIL(锚): 4 条悬空` = `docs/core/design/MODEL-SPECS.md:323`（符号 `cacheMode`）· `MODEL-SPECS.md:1372` / `:1465`（`provider/core.mjs`）· `docs/core/design/SESSION.md:793`（`index.mjs:444-450`）。
  - `FAIL(行宽)` = 实读可见 7 条：`CORE-UNIFICATION.md:1102`（392 字符）· `:1961`（415）· `MODEL-BENCH.md:1793`（318）· `:1794`（431）· `:1797`（376）· `:1806`（353）· `:1807`（481）——**输出尾被截断，总数未见**。
- **归因（实读 `git status`）**：`SESSION.md` / `CORE-UNIFICATION.md` / `MODEL-BENCH.md` 三档在本工作树**零改动** ⇒ 其失败项 = 已提交内容 = **pre-existing**；`MODEL-SPECS.md` 系他批在改（本笔未触）⇒ 亦非本笔引入。
- **本笔两档读数**：`ENGINEERING-MODE-V2.md` 仅 `:80` 一条「迁移期引文——列报 · 不入闸」；`MANIFEST.md` 仅 `:177` / `:178` 两条「拟新增——列报 · 不入闸」；**零闸态命中、零行宽超限** ⇒ 判据⑥「零新增闸态失败」设计轮成立（§5 实装后须复跑）。
- 行宽自觉：两档改动全在既有行内（±0 行），未新增 >300 字符行。

### 2.9 上抛项（父侧裁 / 登记）

| # | 项 | 处置建议 | 阻塞性 |
|---|---|---|---|
| 1 | 需求档 2 条（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:55` · `docs/core/requirements/ENGINEERING-MODE-V2.md:168`） | 父侧笔：口径建议「manifest 在场 = 项目侧管理声明 = 模式 ON 准入判据的**输入**，非模式状态载体」；`:168` 系已被 AC-M1-2 废止的过期处方 ⇒ 删 | 非阻塞（本笔零改） |
| 2 | 判据③ 收窄为带标签形（§2.3 末） | 请确认；不确认则判据在 `thincoder-cli/src/tui/cmd-config.mjs:207` / 模式面档名处假红 | 非阻塞（§2.3 已按收窄形记录） |
| 3 | 判据① 扫描面收窄为活体面（§2.6 ① 行已按此记录） | 请确认 | 非阻塞 |
| 4 | 判据① 形式覆盖面：本笔实扫只覆盖「项目级 / 仓库级 / 全局」三词**共现**形；同义异形（「属于项目」「整仓范围」「跨仓」）未扫 | 定是否扩面；否则可能漏网 | 非阻塞（覆盖面已声明） |
| 5 | 判据④ 是否新增行为用例（翻转前后 `config.json` 的 `agent.engineering` 逐字不变） | 测试面 = 资产；本笔未新增（§2.6 ④ 走静态 + 行为读数） | 待裁 |
| 6 | 行为面第二缝：advisor guard 面翻转仍双写（`thincoder-vscode/src/extension/panel-messages-settings.mjs:163-166`） | 与 §1.5 同族但**未列入 §1.3** ⇒ 射程外（§2.1 已登记）；建议另立条目 | 非阻塞 |
| 7 | `docs/desktop/requirements/PROJECT.md:140` 复核结论 = **非违规**：该行位于 `## 变更记录`（记录面，:136 起），历史归属正确；规范面（:132–:134 P1–P4 表）清白 | 无需动作（登记以免下轮误开工单） | 非阻塞 |
| 8 | 工作树根未跟踪 scratch 残留（`.doc-check-*.txt` / `.tmp-*.txt` 等 40+，含他批产物） | 非本笔写域；建议父侧择批清理 | 非阻塞 |

**§2.9 项 8 补正（本笔读数）**：工作树根未跟踪 scratch 实读 = `.tmp-*` 36 条 + `.doc-check-*` 3 条 = **39 条**（前文「40+」系估读，按 D3 以实读计数为准）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**在评对象**（按评审对象声明）：`docs/core/design/ENGINEERING-MODE-V2.md`（模式门判据行收正 + 情境行形 `(rigor: …)`）· `docs/core/design/MANIFEST.md`（phase 标签单源）· 批档 §2（设计面承载）。实施面（§5：提示词六处 · 码面 5 处 · 测试 5 处 · 扩展端撤 config 镜像写）不在本次评审。

**正向读数（实核通过）**：① 落点逐处在位——`ENGINEERING-MODE-V2.md:319`（行形）· `:324`（模式门行：会话权威值 + 三层指针 + 归属分层半句）· `:518`（T8）；`MANIFEST.md:267` / `:270` / `:490` / `:536` / `:565`——与批档 `:97`–`:101` 声明逐处相符；② 行数账自洽——两档正文 ±0、变更记录 `ENGINEERING-MODE-V2.md:528-531`（+4）/ `MANIFEST.md:716-718`（+3），与实读内容行数（584 = 580+4 · 718 = 715+3；文末空行不计）相符；③ 单源声明可核——`MANIFEST.md:113` 确为「会话权威值（槽优先 + config 回退）」单源，KD-2「同档 §2.2 零改」未造双源，`:324` 前两条指针（本档 §2.3 E2 = `:217` 口径限定 · `MANIFEST.md` §2.2）成立；④ 改名后设计面标签单源 = `rigor`，`discipline` 仅存于模式面档名（`discipline-engineering.md`）与记录面（变更记录行）——未引入机制级矛盾。

**限度声明**：无项目标准档 / 无文档地图声明 ⇒ 文档归属维度按 Project Guide + 在评档判定；跨档指针目标（`SESSION.md`）与全部码面 / 测试坐标不在评审清单内 ⇒ 相关断言标 `unverified`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | 判据① 自反假红：§1.7①（批档 `docs/batches/2026-09-25-eng-ownership.md:55`）「同族字面零命中（项目级/仓库级/全局 × 工程模式）」，形式 = 同行共现扫描（同档 `:164`）；而本批刚收正的 `docs/core/design/ENGINEERING-MODE-V2.md:324` 同一行内既有「**仅工程模式**」又有「项目级 = 台账 · `PROJECT-MANIFEST.json` · `.thincoder/conventions.json`」⇒ 按该形扫描必命中，与同表同行的「本笔已扫：活体面零命中」相抵。 | 收正判据形（改定向否定形「模式**状态**归项目级」或限定断言语境），或声明该行属白名单，使判据与交付文本自洽。 |
| 2 | Acceptance criteria | 🟡 | 判据③ 不可机判：批档 `:166`「活体面 `(discipline: ` 零命中 ∧ `(rigor: ` 恰 17 处在位」把「命中面处数」（同档 `:115`–`:118`：码 5 + 测试 5 + 设计 7）当作字面出现数——设计面实读 `(rigor: ` 仅 5 处（`ENGINEERING-MODE-V2.md:319` / `:518` · `MANIFEST.md:267` / `:536` / `:565`），另两处计入 17 的坐标（`MANIFEST.md:270` 标签映射 · `:490` AC-N1）不含该字面 ⇒ 字面扫描永不等于 17。 | 拆成两条判据：①`(discipline: ` 零命中；②17 处命中面逐处断言（或改按「含 `rigor` 且不含 `discipline`」的字面形并写明应得计数）。 |
| 3 | Affected-file size annotations | 🟡 | 触碰档 `thincoder-vscode/src/agent/setup-tooltable.mjs`（批档 `:152`：现状 344 · 增量 −8 ~ −10 · #17b）越 300 软线，设计面未给拆分复核结论；而既有登记的触发条件 = 「越 500 硬限，**或下一次触碰该档的批**」（`docs/core/design/MANIFEST.md:182`）——本批即该「下一次触碰」⇒ 触发成立而零表述。（核侧 >300 档由 `SOFT_LINE_REGISTRY` + `MANIFEST.md:177`/`:180` 计划指针覆盖，问题仅此 VSC 一档。） | 该行补一行档位结论（现况 / 本批 Δ / 触发成立与否 / 拆分或不拆的理由 + 方案指针），或写明沿用 `MANIFEST.md:182` 方案并顺延的理由。 |
| 4 | Scope | 🟡 | 射程边界依据不自洽：`thincoder-vscode/src/extension/panel-messages-settings.mjs:178-180` 纳入本批（批档 `:134` #17），而同档 `:163-166` 排除的理由是「**未列入 §1.3**」（批档 `:90`）——该理由对 `:178-180` 同等成立；且排除自述「与 §1.5 同族」⇒ 判据④（批档 `:55` · 读数面 `:167`）的「扩展端零 config 镜像写」是否覆盖 `:163-166` 未写明（码面未读 · `unverified`）。 | 同处写明两处写入点的分界依据（哪条属 §1.5 的「翻转路径」、哪条属 advisor guard 面）与判据④的读数面，使排除 / 纳入同依据、判据可执行。 |
| 5 | Document ownership / Doc state | 🟡 | 批档 `:16` 仍把 `PROJECT-MANIFEST.json` 记作「（`phase` / `activeBatch`）」——`activeBatch` 已于 2026-09-17 全链撤销（`docs/core/design/MANIFEST.md:198` KD-M1-10 · 同档 `:254` 记五键），与本批 §2.3（批档 `:108`「五键 schema」）及 `MANIFEST.md:96-97` 相抵 ⇒ 失效字段当活体清单。 | 删该键，现值清单 = 五键（`version` / `phase` / `docRoot` / `promptsLanding` / `checkConfig`）。 |
| 6 | Doc hygiene | 🟡 | 规范面残留修订式标记（非本批引入）：`docs/core/design/ENGINEERING-MODE-V2.md:341`「〔该文本已于 2026-09-21 收正为「呈计划 ⇒ 待批准 ⇒ 实施」✗ 见批档 … ✓〕」= 失效表达 + ✗/✓ 对照语；同档 `:80` 括注「（迁移期引文——机制已废）」。同族先例：2026-09-22 hygiene-sweep 已对 FR31 边界行做同款清理（同档 `:533`）。 | 改现态陈述（只留现行文本坐标 / 现值句），对照语与已废标记移入记录面。 |
| 7 | Acceptance criteria / Verification evidence | 🔵 | 判据⑥ 证据不完整为设计侧自述：批档 `:196`「输出尾被截断，总数未见」⇒「零新增闸态失败」仅对可见 7 条成立（归因逻辑 `:197` 成立、风险低）。 | 复跑并留全量输出（含计数），使「零新增」可机判。 |
| 8 | Clarity / 跨档指针 | 🔵 | 承载档列举不一致且本次不可核：批档 `:107` 记 `SESSION.md` §6.1 / §6.3 / §6.4，设计档 `ENGINEERING-MODE-V2.md:324` 记 §6.3 / §6.4（`SESSION.md` 不在评审清单 ⇒ 未核）。 | 两处取同一节号（以实读为准）。 |
| 9 | Clarity | 🔵 | 评审对象声明记「§2.13 模式门判据行收正」，`ENGINEERING-MODE-V2.md` 无 §2.13——实际落点 = §2.3 E5.1 表第 8 行（`:324`，批档 `:97` 同指）。 | 声明坐标与落点对齐（便于主机侧核验）。 |
| 10 | Doc state | 🔵 | 批档 §1 状态行留占位符字面「🔄 进行中（…）」（`:6`），§1 已填内容之下仍留模板占位行（`:7`）。 | 占位符清空 / 补实况（不改语义）。 |

**计数**：🔴 0 · 🟡 6 · 🔵 4（无 🔴 ⇒ 不阻断）。

**VERDICT: pass**

（口令值按规不带入档；token / designId 仅见于评审席回执。）

## §4 用户批准（主 agent）

### 4.1 批准与实施派发（父侧 · 2026-09-25）

**批准依据**：用户 2026-09-25 16:42「落地吧」——父侧读作「**批准本批设计 + 开始实施**」，并在同轮回复中**显式声明该读法**（附纠正路径：若所指为他批则改）。此前本批设计评审已 **pass**（§3 轮次 1 · 🔴0 / 🟡6 / 🔵4），裁决表收敛（§1.9 收正后权威形）· Deferred 两条已挂账（#365 / #366）。

**派发**：`eng-coder`（round = initial；batchDoc = 本档；写域 = 提示词六处 + 码面 8 + 测试面 2 起）。**designToken 见评审回执——按凭据纪律不入档。**

**实施记录**：§5（eng-coder 段 · 终态 `clean`）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（审计 1 轮 + 代码评审 1 轮 pass · 终态 clean · 三包复跑 675/997/863 全绿 2026-09-25）



### 5.1 实施摘要（eng-coder · 2026-09-25）

**任务书** = 本档 §2.4 / §2.5 条目（#10–#17b）+ §2.3 ③ 改名 + §1.4 提示词六处逐字。零扩面（唯一超面项 = `agent/helpers.mjs`，见 §5.3）。

**落位清单（坐标均本笔实读）**

| 面 | 落点 | 实读形 |
|---|---|---|
| 码面表述 | `thincoder-core/manifest.mjs:2` · `:24` | 档头括注「项目级状态账——工程模式是其**读侧消费者**之一」· 入口名为历史命名（沿用不改名，6 调用点零改） |
| 码面表述 | `thincoder-core/conventions.mjs:5` · `:11` | 写域分类面 = **共享**面（各门为消费者而非所有者；消费者面点名） |
| 码面表述 | `thincoder-core/config.mjs:51` | `engineering` 默认值的会话权威限定（初始默认 only） |
| 码面表述 | `thincoder-core/session-slots.mjs:88` | 会话级槽索引尾注「≠ 项目级状态档」 |
| 码面表述 | `thincoder-core/agent-tools/spawn-gates.mjs:79` · `:101` | 写域 basename = 模式无关；拒收文案「applies to every session, not engineering-mode only」 |
| 测试面 | `thincoder-core/test/spawn-gates.test.mjs:107` · `:123` · `:129` | 断言文案随码面同步（3 处逐字） |
| 改名 ③ 码面 | `thincoder-core/agent/setup-reminders.mjs:67` · `:71` · `:74` · `:75` | 映射表 `MANIFEST_RIGOR` + 行形 `(rigor: <light\|strict>)`（5 行改） |
| 改名 ③ 测试面 | `thincoder-core/test/setup-reminders.test.mjs:78` · `:79` · `:83` · `:108` · `:182` | 逐字断言改 `(rigor: `（5 行改） |
| 改名 ③ 设计面 | `ENGINEERING-MODE-V2.md:319` · `:518` · `MANIFEST.md:267` · `:270` · `:490` · `:536` · `:565` | 7 处命中面（设计面由设计轮落笔，本笔只复核：逐处在位 ✓） |
| 扩展端镜像撤写 | `thincoder-vscode/src/extension/panel-messages-settings.mjs:171`–`:180` | 翻转点 `handleSetEngineeringEnabled` 撤 config 镜像写调用（唯一落点 = `setSlotEngineering` + 面板回推） |
| 提示词六处 | EN `prompts/{persona-engineering:3, advisor-design:2, common:163}` ∥ CN `docs/core/design/prompts/{persona-engineering:3, advisor-design:3, common.md:124}` | 六处逐字（§1.4 裁定形；见 §5.2 坐标注） |
| KD-6 槽唯一权威 | `thincoder-vscode/src/agent/setup-tooltable.mjs:94` | 装配面只写槽（不再回写 config 镜像） |

**证据读数**

1. **AC①/③ 判据**：活体面扫描（1058 档，排除 `_archive` / `batches` / `.thincoder/tmp` / `node_modules`）——
   `(rigor: ` 命中 **12 处** = 码 2（`setup-reminders.mjs:71/75`）+ 测试 5（`setup-reminders.test.mjs:78/79/83/108/182`）+ 设计 5（`E-M-V2:319/518` · `MANIFEST:267/536/565`），改名面 17 行（码 5 + 测试 5 + 设计 7，其中 `MANIFEST.md:270` / `:490` 为**含 `rigor` 不含 `(rigor: ` 字面**形）逐行在位 ✓。
   **⚠ 判据① 字面形收窄**：字面 `(discipline: ` 活体面尚有 **1** 处 = `thincoder-cli/src/tui/cmd-config.mjs:207`
   ——实读为英文随笔括号（`// … pickers (discipline: options, never free-text)`，语义与 phase 标签无关），
   ⇒ 判据① 若按**字面**扫描永不零命中；按**语义形**（phase 标签 `(discipline: <light|strict>)`）零命中 ✓。
   与评审 🟡 #2（判据③ 计数形）同源，处置权在父侧（本笔只报不裁）。
2. **AC② 双面逐字**：六处按 §1.4 裁定形落位，句形与长度量级不变、零语义外溢 ✓。双面各自自持（EN 档形 / CN 档形各自成立，非字节同一）。
3. **AC④ 扩展端零 config 镜像写**：静态——翻转路径唯一（`mode-buttons.js` → `panel-messages.mjs:350` 分发 → `handleSetEngineeringEnabled`），
   全档 `vscPersistRaw` / config 写面零命中于该路径；`saveAgentSettingsFromPanel` 仅存 `:144`（通用设置保存，eng 键不可达）与 `:166`（advisor.guard 面，射程外）。
   **行为**——一次性探针（临时档，跑完即删、未入库；桩面板 + 真槽落盘夹具，同 `chat-panel-messages.test.mjs` ⑮ 组手法）**8/8 PASS**：
   ON/OFF 双向 + 5 轮反复翻转，`config.json` **逐字不变**（含 `agent.engineering` 仍 false ⇒ 新会话初始默认未被静默改写）；槽 `engineering` 落位 ✓ · ON 时槽 `planMode` 清零 ✓ · 面板轻量回推未退化 ✓。
4. **AC⑤ 三包实测全绿**：core **675** · cli **863** · vsc **997**（0 fail；本笔复跑）。
5. **AC⑥ 闸态**：`node scripts/doc-check.mjs` → exit 1，**pre-existing**：悬空 **4**（基线 4）· 行宽 **18**（基线 18）；
   与基线集的差全部落在**他批在途档**（`docs/desktop/**` 新增 · `MODEL-SPECS.md` / `VSC-DEBT.md` 行号漂移），**零条指向本批触碰档** ⇒ 「零新增闸态失败」成立；基线漂移如实登记。

### 5.2 决策透明表

| # | 决策点 | 取法 | 理由 / 来源 |
|---|---|---|---|
| D1 | `helpers.mjs` 超声明面（+1 行） | 改并如实报为超面项 | 该档在本笔落句点触碰；改动 = `ENG_ON_REMINDER` 注释补 "(session-scoped)"（本批「模式仍是会话级」表述的**应然面**）；同档其余改动（`file_ops` action-aware）属他批 D-TO13，非本笔 |
| D2 | `panel-messages-settings.mjs` 行数 | 实改 **−2**（§2.5 声明 −3） | 实删 = 翻转点镜像写调用 + 其上一行注释；声明数与实测差 1，按实测记账（D3 计数纪律） |
| D3 | `setup-tooltable.mjs` 行数 | 实改 **−10**（声明 −8~−10 ✓） | `git numstat` +5/−15 = −10；档实读 333 行 |
| D4 | 行数口径 | 本笔行数 = `split('\n')` 末换行前计数 | 与设计面声明值恒差 +1（声明显式含末空行）⇒ 本批各档正文 ±0 的结论不受影响（逐档同口径比对） |
| D5 | CN `common.md` P3b 坐标 | 实落 `:124`（§1.4 声明 `:123`） | 其上方同期插入一行非 §1.4 内容（工具路由 proccess/verify 段），坐标右移 1 ⇒ 逐字内容 ✓、坐标漂移如实报（设计档不改） |
| D6 | 判据① 字面形 | 按**语义形**判 + 如实登记字面假红 | 见 §5.1 证据 1（`cmd-config.mjs:207` 英文随笔） |
| D7 | AC④ 行为读数手段 | 一次性探针（未入库） | §2.9 项 5「是否新增行为用例」待父侧裁；本笔只取证不落测 |

### 5.3 超面 / 域外（只报不动手）

- **超声明面**：`thincoder-core/agent/helpers.mjs`（+1 行，见 D1）。
- **已入父侧 wave 提交 `e7c16ebc`**（本笔 5 档的实现内容已随该 commit 落盘）：`agent/setup-reminders.mjs` · `test/setup-reminders.test.mjs` · `agent/helpers.mjs` · `thincoder-vscode/src/agent/setup-tooltable.mjs` · `docs/core/design/prompts/common.md` ⇒ 该 5 档 `git diff` 为零属**已提交**，非漏改。
- **域外仅报**：`thincoder-vscode/AGENTS.md:86`（仍称 `setEngineeringEnabled` 持久化 config.json，与 KD-6 相反，属文档面他笔）· 仓根 scratch 39 项（含 `.tmp-hyg2-kept.json`）· `thincoder-{cli,vscode}/docs/_archive/**/persona-engineering.md:3`（归档冻结旧字面，不追改）· 评估 🟡 #2 / #3（判据计数形 · `setup-tooltable.mjs` >300 软线结论）由父侧处置。

### 5.3 补（内部审计轮 findings 处置）

- 🟡 **新增设计档漂移**（内部审计发现，本笔原报单漏项）——**只报不动手**（设计档写权 = eng-designer）：
  - `docs/core/design/TOOLS.md:81`（「分叉 ＝ VSC 双写（会话槽 + `config.json` 的 `agent.engineering`）⇒ **跨端副作用**」）
  - `docs/core/design/TOOLS.md:122`（「现状：在 VSC 开一次工程模式，会改变 CLI 下次启动的模式」）
  - 事实：KD-6 落地后该「现状」不再成立（翻转只写会话槽）⇒ 两行陈述失效，需设计面同步改写。
  - 附注：`:122` 所引坐标 `src/agent-tools/eng.mjs:92-104` 在 VSC 活体面已悬空——属**既存悬空**，非本批引入。
- 🟢 **能力面残留**（审计附注，无面板调用点可达）：`thincoder-vscode/src/extension/settings-panel-write.mjs:88` 仍透传 `payload.engineering`。
  判据④只要求**翻转路径**零镜像写（成立：`handleSetEngineeringEnabled` 单写槽）；此残留不构成偏离，登记备查。
- 🟢 **审计已自报项确认**：`thincoder-core/agent/helpers.mjs`（超声明面，§5.2 D1）· `thincoder-vscode/AGENTS.md:86`（域外，§5.3）。
- 审计无 **PARTIAL / SILENT-SIMPLIFICATION** 项；改名 17 处 · 提示词六处 · #10–#16 表述面 · #17/#17b 镜像撤写均经独立复核在位。⇒ **本笔无代码修复轮**（fix round = 0）。

### 5.4 审计与代码评审轮次 · 终态

**内部偏离审计（explore 子代理 · 只读 · 1 轮）**
- 结论：**无 PARTIAL（部分实现）/ 无 SILENT-SIMPLIFICATION（静默简化）**；findings 3 项。
- 处置：① `helpers.mjs` 超声明面 🟢（已自报，见 5.2 D1）— 不改；
  ② 新增 🟡 **设计档漂移** `docs/core/design/TOOLS.md:81` / `:122`（本笔原报单**漏项**）— 已补入 5.3 补（只报不动手，设计档写权 = eng-designer）；
  ③ `thincoder-vscode/AGENTS.md:86` 🟡 — 已列 5.3 域外只报项。
- 附注 🟢：`settings-panel-write.mjs:88` 仍透传 `payload.engineering`（能力面残留，今日无面板调用点可达）— 已登记 5.3 补。

**内部代码评审（advisor `type=code` · 1 轮）**
- 在评范围 = 本笔改动 13 档 + 提示词六处（双面）；对照面 = 设计档 `ENGINEERING-MODE-V2.md` / `MANIFEST.md` + 本档。
- 结论：**VERDICT: pass**。findings 4 项**全 🔵（advisory）· 零 🟡 必修 · 零 🔴**（无安全 / 无正确性 / 无越权）：
  1. `thincoder-core/agent/helpers.mjs:419` 超声明面 — 处置权在父侧/designer（§2.5 补登）；
  2. AC④ **行为读数不可复现**（翻转探针未入库）— 设计面 §2.9 项 5 已把「是否新增行为用例」留待父侧裁定，非偏离；建议后续在既有 ⑮ 用例组内资产化一条断言；
  3. 残留能力：`thincoder-vscode/src/extension/panel-messages-settings.mjs:144` 通用保存仍可达 `settings-panel-write.mjs:88`（白名单含 `engineering`）— 今日 webview 不发该键（实读 `webview/settings-agent.js:91-134` 为显式字段集）⇒ 判据④成立；建议择批收口为「删该键 / 加守卫」；
  4. 行数账漂移（§2.5 声明 `panel-messages-settings.mjs` −3 / 209，实测 −2 / 207；`setup-tooltable.mjs` 声明 344 vs 实读 333）— 由 D4 计数口径解释，结论不受影响。
- 正向复核（评审独立实读，逐条在位）：AC② 六处逐字 · AC③ 改名 17 处 + 全域 `(discipline: ` 零命中 · AC④ 翻转路径单写槽（`panel-messages-settings.mjs:178`）· `setup-tooltable.mjs` 死引用零残留且导入面零死项 · #15 新断言 `spawn-gates.mjs:101` 属实（`normalizeFileList` 为通用 spawn 面）· 触碰的 >300 核档全在 `SOFT_LINE_REGISTRY` 且本批 Δ0。

**fix round 计数 = 0**（审计/评审均无必修项；唯一动作 = 5.3 补的报单补登）。
**终态 = `clean`**（1 审计轮收敛 + 1 代码评审轮 pass，无未决必修）。

**交付回归证据（2026-09-25 本会话复跑，非转述）**
- `cd thincoder-core && npm test` ⇒ **tests 675 · pass 675 · fail 0**（exit 0）
- `cd thincoder-vscode && npm test` ⇒ **tests 997 · pass 997 · fail 0**
- `cd thincoder-cli && npm test` ⇒ **tests 863 · pass 863 · fail 0**（suites 14）
- 未由本会话复跑：判据⑥ `node scripts/doc-check.mjs --root ..`（只读闸读数承 5.1 证据 5：exit 1 = **基线态**，4 悬空 + 18 行宽全落他批在途档）。

### 5.5 收尾复核（本会话追加 · 只读复跑）

- **AC⑥ 闸态复跑（更正 §5.4 末条的命令形）**：正确调用 = `cd thincoder && node scripts/doc-check.mjs`（**不加 `--root`**，仓根 = cwd）。
  §5.4 末条记的命令形 `--root ..` 会把仓根解析到 `d:\teamcode`，据此复跑得 **4830 悬空**的假读数 —— **该命令形作废，以本节读数为准**。
  正确调用复跑读数：**exit 1 · 悬空 4 · 行宽 18**，与 5.1 证据 5 **逐字一致**。
- **闸态命中逐条归属**：22 条闸态失败 = 悬空 4（`MODEL-SPECS.md:323` / `:1372` / `:1465` + `SESSION.md:850`）+ 行宽 18
  （`CORE-UNIFICATION.md` ×2 · `MODEL-BENCH.md` ×6 · `MODEL-SPECS.md` ×6 · `VSC-DEBT.md` ×3 · `docs/vsc/requirements/WEBVIEW.md` ×1）
  ⇒ **零条**指向本批触碰档（13 档 + 提示词六处），全部落他批在途档 ⇒ 判据⑥「零新增闸态失败」**本会话实读成立**。
- **会话临时档清理**：`thincoder/.tmp-own-{core,vsc,cli}-test.txt`、`.tmp-own-doccheck{,-final}.txt`（5 个测试输出捕获档）已删，未入库。
- **终态不变**：`clean` · fix round **0**（本轮复核无结论变更，仅补齐闸态实读证据与命令形更正）。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧实读 · 2026-09-25 17:30）

| 面 | 核验方式 | 结果 |
|---|---|---|
| 提示词六处（§1.4 逐字） | 逐处实读（EN 运行面 ∥ CN 正本） | ✓ 六处全对（`thincoder-core/prompts/persona-engineering.md:3` · `advisor-design.md:2` · `common.md:163` ∥ `docs/core/design/prompts/` 同名三档——P3b 因他会话在 `:72` 增行漂 +1（`:123`→`:124`），**内容在位**） |
| 判据①（定向否定形） | 全域扫描 + 逐命中判定 | ✓ 零命中；唯一带标签形命中 = `thincoder-cli/src/tui/cmd-config.mjs:207`（英文随笔括号，语义无关 ⇒ §1.9 白名单口径成立）；其余命中 = `.thincoder/tmp/**`（打包副本非源）+ `docs/batches/**`（记录面） |
| 判据③（`rigor` 逐处） | 抽核（core 码 + 测试 + 设计面） | ✓ 在位（`thincoder-core/agent/setup-reminders.mjs:66/71/74/75` · `thincoder-core/test/setup-reminders.test.mjs:78/79/83/108/182` · 设计面 7 处） |
| 行为面（镜像撤写） | 父侧 diff 实读 | ✓ `thincoder-vscode/src/extension/panel-messages-settings.mjs` 删 `saveAgentSettingsFromPanel({engineering})` · `thincoder-vscode/src/agent/setup-tooltable.mjs` 删 `vscPersistRaw` 块 + 死引用（槽写保留） |
| `config.mjs:51` 限定语 | 实读 | ✓ 逐字（`initial default only — the runtime value is the session authority (MANIFEST.md §2.2 / ENGINEERING-MODE-V2.md §2.3 E5.1)`） |
| 三包测试 | 子代理实跑（父侧未复跑——依「交付已内审、不重复审计」纪律） | 675 / 997 / 863 全绿 · fail 0 |
| 机检 | 子代理实跑 | 悬空 4 / 行宽 18 = 基线态 · 零新增 |

### 6.2 核销同步清单（D7）

- **角色表** ✓：§1 父侧 · §2 eng-designer · §3 评审子代理 · §5 eng-coder · §6 父侧。
- **状态行** ✓：§1 已收口 · §2 设计完成 · §3 评审完成 · §5 实施完成。
- **计数 / 指针** ✓：§1.9 = 判据①②③ 收正后权威形；§1.4 = 六处逐字；§1.10 = 并发面登记。
- **变更记录** ✓：设计档两档（`ENGINEERING-MODE-V2.md` +4 · `MANIFEST.md` +3）· 本档 §2.9 / §2.10 修正轮块。
- **待办勾销** ✓：**台账 #358 → 已核销**（在途 → 待核销 → 已核销）。Deferred 保留：**#365**（`setup-tooltable.mjs` 拆分触发 · 顺延下次触碰）· **#366**（`ENGINEERING-MODE-V2.md` 规范面修订式残留）。本批新出域外债：**#378** · **#379**。
- **台账可见面** ✓（settlement line = #358 已核销）。
- **前批遗留核对** ✓：本批无挂靠前批遗留；`e7c16ebc` 提交含本批 4 档（**归属未核**——非本会话动作；内容已实读在位，不影响核销）。

### 6.3 域外项处置（实施轮报告 7 条 → 逐条归宿）

1. 设计档漂移（`TOOLS.md:81` / `:122`）→ **#378**；2. VSC 陈旧注释三处 → **#378**；3. `helpers.mjs` 超声明面 +1 行 → **本节记录**（补登以 §6 为准）；4. AC④ 断言未资产化 → **#379**；5. `panel-messages-settings.mjs:144` 通用保存仍可达 `settings-panel-write.mjs:88`（白名单含 `engineering`）→ **并入下一步「advisor.guard 收口批」**（同面：键写面收口）；6. scratch / `_archive` / 行数账 → 只报不入账（认）；7. §2.9 上抛 1–5 → 1/2（需求档两条）✓ 已落 · 3（判据① 覆盖面）✓ 以 §1.9 定向否定形为准 · 5（判据③ 收窄）✓ 已确认 · 4（行为用例裁定）→ **#379**。

### 6.4 验收（§1.3 残留 15 条逐条）

提示词双面 **6** ✓ · 需求档 **2** ✓（父侧笔，已落）· 设计档 **1** ✓ · 码面 **7** ✓ · 行为面 **1** ✓ —— **15/15 全落**；批级判据 ①–⑥ 逐条成立（⑤ 三包测试 · ⑥ 机检零新增，读数 = §5 + 本节）。
