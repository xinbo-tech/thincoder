# 2026-11-03 · write-gate-prompt-teaching
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> §2 = 现在要做什么 —— 本条可就地改（`edit`，§4.19）；§1 / §3 / §5 / §6 = 当时说了什么 —— 只追加，不回改。
> 编制：主 agent · 2026-11-03 · 来源 = 用户 2026-11-03 05:09 问「提示词系统根据这个限制调整过了吗？模型知道应该怎么使用吗？」→ 父侧实读确认缺 → 05:10 裁「提示词面必须完整的调整以适应这个变化，你开批吧」。
> 台账 = #2021（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-04
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 用户裁决

- **已定决定**：**提示词面必须完整调整以适应写门这一变化**（不是补一句，是让模型知道怎么用） · 用户原话：「**提示词面必须完整的调整以适应这个变化，你开批吧。**」 · 时间：2026-11-03 05:10

## 问题陈述（父侧实读）

写门 `#2019` 已落地并全绿（判据点 = 调用方声明的项目 + 在途台账号）。**教学面三处有、提示词面零句：**

| 面 | 现状 | 逐字 |
|---|---|---|
| 工具 schema 描述 | **有** | 每把工具的 `ledger` ∥ `project` 参数描述里带「工程模式下父侧不带 = 拒」与拒文用法句 |
| `thincoder-core/tool-docs/` 五份 | **有** | `thincoder-core/tool-docs/bash.md` 逐字「In engineering mode the parent agent must pass it — a call that does not say which row it serves is refused」 |
| 拒文 | **有** | 今晚三次实测：`no project on this call` ∥ `row #999999 does not exist in this project's ledger` ∥ `row #2020 is "待讨论" — only a 在途 row carries writes` |
| `thincoder-core/prompts/` 全档 | **零句** | 检索 `ledger` ∥ `台账` 得 4 类命中：台账是什么 ∥ 批点火怎么挂行 ∥ 收口怎么核销 ∥ 子代理台账是输入 —— **没有一句讲「每一笔写盘 / 命令都要带号」** |

**后果**：模型只能在**第一次被拒**时从拒文里学到这件事 —— 每个新会话多付一轮，且拒文只说「缺什么」，不说「这件事的规律是什么」。

## 模型必须能从提示词面直接答出的三件

1. **什么时候带号**：写盘七件与 `bash` ∥ `execute` 的每一笔都要带 `ledger:"#N"`，号须在本仓台账 `status=在途`；`bash` ∥ `execute` ∥ `memory`（落 project 层）另带 `project:<项目根>`。
2. **没有在途行时怎么办**：先挂行（`ledger add` → 推到在途）或开批 —— **这两步本身不是写，所以不会死锁**（这条不写，模型会以为「没号就什么都不能做」）。
3. **被拒时读什么**：拒文点名缺什么 + 当前在途哪几行；不是反复重试。

## 边界

- **只改提示词面**（`thincoder-core/prompts/`）+ 其设计档节。代码 ∥ 工具描述 ∥ 测试零碰（判据本体 `#2019` 已收口）。
- **判据本体不动**：用户 05:08 已裁「命令面与写盘面同一判据（甲）」，本批不改判据。
- **不新增工具参数**：`project` ∥ `ledger` 已存在。

## 设计席两个上抛的裁定（父侧 2026-11-03 05:14）

**① 需求面缺条目 —— 父侧已补（我的笔域）。**

- **已定决定**：需求落 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.8（台账用法面 FR30）第 ⑥ 条；`#2021` 的 `req_doc` 已指该节 · 父侧裁定 · 时间：2026-11-03 05:14

**落法**：§13.8 原文「用法面 = 生命周期**事件 → 动作**绑定，五条」⇒ 改「六条」，新增 ⑥（每笔带号带项目 + 挂行两步不是写 + `git` 只读不要号 + `manifest init` 唯一豁免），并带为什么（命令内容不可解析 ⇒ 事后只能靠号回查；「没号就什么都不能做」会让挂行也做不了）。验收 ① 由「五行判据」改「六行判据」并加机检串。

**② 子代理面要不要也带号 —— 裁：不带。**

- **已定决定**：写门只管父侧（`depth === 0`）；子代理不挂台账号 · 父侧裁定 · 时间：2026-11-03 05:14

**理由**：子代理已经被 **`batchDoc` + 设计 token** 绑死 —— 它写哪些档由 `files` 声明、行为由那一本批档承载，**归因已经成立**；再加一个号是同一件事记两遍。而且子代理**读不到台账**（台账是它的输入，不是写面），要它报号等于要它报一个自己看不见的东西。
**代价与边界**：子代理可以跑命令而不留台账痕 —— 它的痕在批档 §5 与父侧的调度记录里，不在台账行上。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮：块内 memory 前缀删除、台账取根两处已正；落地块的 on-disk 版待实施席重落（设计 §6.69 围栏块仍 13 行，计数不连带））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

## 本批条目（覆盖）

| # | 条目 | 内容 | 判据 / 验收落点 |
|---|---|---|---|
| 1 | 台账 `#2021`（core · 归批）写门教学面 | 让提示词面教得会「写门怎么用」——三件：每一笔写盘带什么 · 手上没在途行怎么办 · 被拒时读什么 | 设计 `docs/core/design/PROMPT-SYSTEM.md` §6.69「判据（一句）」+「验收」A1–A12 |

**批次边界（本批不做）**：实现面零改（`#2020` 已收口）· 写门判据本体零改（用户 2026-11-03 05:08 已裁「命令面与写盘面同一判据」）· 提示词文件本设计轮零碰 · 子代理档零改 · 需求档只读（`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.8 ⑥ = 本批验收源头，父侧已落）· 零新增参数 · 零新增机检门。

## 设计档落点

`docs/core/design/PROMPT-SYSTEM.md` §6.69（本批唯一设计落点，已落）。机制单源 = 该节——判据句、落点理由、逐字终稿、验收表 A1–A12、用例表 C1–C11、决策表 K1–K6 全在那一节，§2 只引用不复制。

## 机制设计（摘要 · 正文见设计 §6.69）

- **改什么**：`thincoder-core/prompts/persona-engineering.md` 的 `## Ledger (requirement pool / tech todos) — batching & lifecycle` 节内、`Lifecycle` 块之前新增一块；落地形 = 加粗题眼行 + 顶格 `- **题眼**:` 条目（与节内既有块同形）。内容：射程 = 十二把工具（写盘七件 + `bash` · `execute` · `git` · `manifest` · `memory`）· 带 `ledger:"#N"`（须**声明 ∥ 写盘目标所属项目**的台账在途——门按判据点取根后查该根台账）· `bash` / `execute` / `memory`（落 project 层）另带 `project:<项目根绝对路径>` · 按 action 判：只读 `git` 与 `manifest` `read` 不带号，`git` 写型与 `manifest` `write` 照带 · `manifest init` = 唯一豁免（目标尚无 manifest，无账可问）· `bash` 不论跑什么都带号（命令内容不解析）· 没在途行先挂行（`ledger({action:"add"})` → 在途 ∥ `batch({action:"create"})`，两步都不是写）· 被拒读拒文。
- **为什么落人格层**：受众 = 父侧（九份工具描述逐字写 `the parent agent must pass it`）；形态 = 每一笔怎么写。两条理由见设计 §6.69「落点」。
- **同形歧义**：`ledger:"#N"` 在提示词面现有 3 处用法全是 `batch` 的「接手该行」义——语境由块内**射程句**锁住（射程只列写盘工具，`batch` 不在其中），`batch` 那段一字不动（设计 §6.69 K5；改前改后逐字相等由 A11 判）。

## 受影响文件与测试覆盖

| 文件 | 轮次 / 责任 | 改动 |
|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 实施轮 · eng-coder | 台账节内新增一块，逐行照落设计 §6.69 围栏块 |
| `docs/core/design/PROMPT-SYSTEM.md` | 本设计轮 · 已落 | 新增 §6.69 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 需求面 · 父侧已落（本席零触） | §13.8 第 ⑥ 条 = 本批验收源头，§2 与设计 §6.69 逐项对它 |

**档位结论**：三档皆 `.md` ⇒ 无一档越档位、无拆分计划（需求档本批只读，改动已由父侧落地）。

**测试覆盖**：本批单测档 = `docs/batches/2026-11-03-write-gate-prompt-teaching.test.mjs`（A1–A11 每条一例，收口删除；跑法与读数见 §5——本段不抄）；机判 = 设计 §6.69 验收表 A1–A12（`node` 逐行整行比对 + 子串计数 + 位置切判 + `batch` 段改前改后逐字相等判 + 引用锁集合判 + 交付门 `doc_check`）。§2 不复制读数与判法。

## 验收对照（回指）

本批收口判据 = 设计 §6.69「验收」表 A1–A12，逐条判法与期望读数写在那一节：

- A1 块在盘且与围栏块逐行相等 · A2 射程十件枚举齐（含 `memory` 的入程条件）· A3 `project` 参数与三件同句
- A4 无在途行不死锁 · A5 被拒读拒文 · A6 计数与行宽零连带
- A7 零文档引用与引用锁集合不变 · A8 携 why 两半且无禁令腔 · A9 写型 ∥ 只读 ∥ `manifest init` ∥ `memory` 前缀各按其判
- A10 块位置（台账节内、`Lifecycle` 块之前）· A11 `batch` 段改前改后逐字相等 · A12 交付门 PASS

## 关键决策（摘要）

全文见设计 §6.69「关键决策」K1–K6：落人格层不落纪律层 · 落台账节 · 一块说三件不拆三处 · 必写「没号怎么办」并写明那两步不是写 · 语境由射程句锁同形歧义、不改 `batch` · 零新增参数。

## 上抛项

1. 〔知会 · 需求面〕本批验收源头 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.8 第 ⑥ 条（台账用法面 FR30）：父侧 2026-11-03 05:14 已落该条、`#2021` 的 `req_doc` 已指该节，设计 §6.69 与之逐项对应（A1–A12）；需求档本席零触。
2. 〔已裁 · 子代理面〕写门只拦父侧（`depth === 0`），子代理不挂台账号——父侧 2026-11-03 05:14 裁定（§1 ②）；归因已由 `batchDoc` + 设计 token 成立，且子代理读不到台账。门若日后扩到子代理，同一块随迁到 `thincoder-core/prompts/subagent-base.md`。
3. 〔知会 · 编号〕§7 机制条目（D-PS 编号）由父侧定；本席未落，避免悬空引用。
4. 〔知会 · §1 现状〕§1 已有五块正文（用户裁决 / 问题陈述 / 模型必须直接答出的三件 / 边界 / 设计席两个上抛的裁定），本席据其取方向；§1 零改。
5. 〔已裁 · 实现待修〕需求 §13.8 ⑥「`manifest` 的 `init` 是唯一豁免」成立（父侧 2026-11-03 裁：不豁免则建新项目这条路断掉）；代码 `thincoder-core/agent/write-gate.mjs` 的 `MANIFEST_WRITE_ACTIONS` 仍含 `init` = 实现偏差，修正由父侧另开批——本批零碰代码，落地块按需求写。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 评审对象与限制

- **评审对象** = 设计轮（对象状态「待评审」）：设计档 `docs/core/design/PROMPT-SYSTEM.md` §6.69 + 批档 `docs/batches/2026-11-03-write-gate-prompt-teaching.md` §2 + 需求档 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.8。
- **限制 a · 方法论合规**：项目无 standards 档 ⇒ 只按 `AGENTS.md` 与评审判据判。
- **限制 b · 文档归属**：无文档地图档（`docs/README.md` 不在盘）⇒ 该判据降级，只按 `AGENTS.md` 的文档体系指引判。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Requirements 覆盖 | 🔴 | 需求 §13.8 ⑥ 明写两条豁免——「`git` 只读 action 不要号、`manifest` 的 `init` 是唯一豁免。」；批档 §1「落法」也把「`manifest init` 唯一豁免」列进 ⑥。设计 §6.69「逐字终稿」13 行内无 `manifest` 一字，A2 射程枚举止于「`file_ops` · `bash` · `execute`」、A3 只判 `project:<absolute project root>` ⇒ 唯一豁免面整个缺席，模型读到的规则是「每一笔写盘都带号」，与需求相反。成因可读：§2 受影响文件表只列「`thincoder-core/prompts/persona-engineering.md`」∥「`docs/core/design/PROMPT-SYSTEM.md`」两档，未列需求档；§2 上抛项 1 仍称「本批无需求档条目——台账 `#2021` 的 `req_doc` 为空」⇒ 设计未读到已落的 ⑥。 | 落地块补出 `manifest` `init` 这条唯一豁免，并同步 A2 ∥ A3 的枚举判法；把需求档列入受影响文件表与勘察面，使块对 ⑥ 逐项可核。 |
| 2 | Clarity ∥ 射程自洽 | 🔴 | 落地块先写「The reach is every tool that lands bytes: `write` · `edit` · `insert_after` · `apply_patch` · `delete` · `hashline_edit` · `file_ops` · `bash` · `execute`」（九件，无 `memory`），紧接「Three of them carry `project:<absolute project root>` as well — `bash` · `execute` · `memory` when it writes into the project layer」——「them」所指的九件里没有 `memory`；而 ⑥ 要求 `memory` 落 project 层时带 `project`。读者无法判定 `memory` 落 project 层这一笔要不要 `ledger:"#N"`：不要则射程枚举不全，要则两句矛盾。这正是本批要模型「直接答出」的第一件；A2 只判九个词各 ≥1，矛盾落地仍全绿。 | 明确 `memory` 在射程内的身份（带号 ∥ 只带 `project`），让射程句与 project 三件句成为同一件事的两次陈述；验收补一条判该关系的断言，而不只是九个词在场。 |
| 3 | 分支出处（6b） | 🔴 | 落地块新增分支「A read-only `git` action carries no number — it writes nothing, so there is no row for it to serve; a write action carries one like any other write.」，但设计未给该分支的场景：勘察证据行只引三条拒文（`no project on this call` ∥ `row #999999 does not exist in this project's ledger` ∥ `row #2020 is "待讨论" — only a 在途 row carries writes`），无一条关于只读 `git`；用例表 C3 逐字只写「不带号即合规——规范只写「不带」，不教多余形态」。既无引文观测、也无复现命令 ⇒ 该分支守的是还没发生过的场景；且它与射程句并存（`bash` 在九件内），一笔 `bash` 跑只读 `git` 时按哪句走无答案。 | 给这条豁免一名场景（门对只读 `git` 的实读 ∥ 拒文一字 ∥ 可复现命令，引在勘察证据行），并写明它与「`bash` 带号」的先后关系；给不出场景就删掉这条分支，让射程句一句话说完。 |
| 4 | Requirements 覆盖 | 🟡 | ⑥ 把号教成归因——「号是**归因**——说清这一笔替哪条债干活。」并给了 why「为什么：没有归因，跑过的命令查不到它为什么跑」；落地块只有「In engineering mode a write call carries `ledger:"#N"`, and `#N` must be a row of this repo's ledger in 在途.」，why 只落在死锁那半（A8 判 `the gate cannot block the step that satisfies it` ⇒ 1）。按本档 §6.1「落笔携 why」，缺的是「为什么要带号」这一半。 | 把 ⑥ 的归因 why 落进块内，并让 A8 的 why 断言覆盖两半（带号的理由 ∥ 不死锁的理由），而不只判死锁那一句。 |
| 5 | 文档状态一致 | 🟡 | 同一本批档内对同一事实两种说法：§2 上抛项 1 逐字「本批无需求档条目——台账 `#2021` 的 `req_doc` 为空」，§1 已写「需求落 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.8（台账用法面 FR30）第 ⑥ 条；`#2021` 的 `req_doc` 已指该节 · 父侧裁定 · 时间：2026-11-03 05:14」，且该节在盘（「用法面 = 生命周期**事件 → 动作**绑定，六条：」+ ⑥ 正文）。 | 按已落事实改写 §2 上抛项 1，并在受影响文件表点名需求档，使 §2 与 §1 及需求档现状同拍。 |
| 6 | 文档状态一致 | 🟡 | §2 上抛项 2 仍把子代理面作待裁上抛——「子代理写盘是否也带号 = 机制决定，见设计 §6.69 上抛项 1」；§1 ② 已裁「写门只管父侧（`depth === 0`）；子代理不挂台账号 · 父侧裁定 · 时间：2026-11-03 05:14」。上抛一个已裁的问题，读者会二次处置。 | 改记为已裁并引 §1 ② 的裁定与时间；设计 §6.69 上抛项 1 ∥ 用例 C4 同笔对齐（保留「门若扩到子代理则同块随迁」的形态即可）。 |
| 7 | 文档状态一致 | 🟡 | §2 上抛项 4 逐字「§1 正文仍是模板占位符，只有档头一行」；实读 §1 已有「用户裁决」∥「问题陈述（父侧实读）」∥「模型必须能从提示词面直接答出的三件」∥「边界」∥「设计席两个上抛的裁定」五块正文（模板占位行仍在，但正文不空）。 | 按 §1 现状改写该上抛项或删除，免得读者据它判断「§1 无方向输入」。 |
| 8 | 验收可判 | 🟡 | 落点要求「节内、`**Lifecycle (event → action — …)**` 块之前，新增一块」，K5 要求「同一个串两个义——本块首句把语境锁在写盘调用上，`batch` 那一段一字不动。」；但 A1 只判「落地块与本节围栏块**整行相等**（首末行含）」+ 子串计数，A6 只判 `##` ∥ `###` ∥ 行宽 ⇒ 块落错节、或 `batch` 段被顺手改动，A1–A9 仍可全绿。同形先例 = §6.68 A1「落在 `## Batch-record lifecycle` 节内（节切 = 该 `##` 至下一个 `^##`）」。 | 补两条判法：位置判（节切 + 在 `Lifecycle` 块之前）与 `batch` 段改前改后逐字相等判。 |
| 9 | 受影响文件档位 | 🟡 | §2 受影响文件表列两档，全表无一句档位结论（判据要求：结论进设计档，尺寸与预期增量不进）。该表两档均为 `.md`（`thincoder-core/prompts/persona-engineering.md` ∥ `docs/core/design/PROMPT-SYSTEM.md`）⇒ 纯文档面按结构尺度豁免，缺的是那句话本身。 | 补一行结论（两档皆 `.md` ⇒ 无一档越档位、无拆分计划），不写行数读数。 |
| 10 | 最近先例 | 🟡 | 「先例 ∥ 偏离」把形制先例记为「先例 = 本节形制取 §6.68（一句判据 + 人格层既有节内增条 + 逐字终稿 + 验收表）与 §6.65（现状 / 判据 / 落点三段）。」，但 §6.68 的落地形制是「**逐字终稿（中文 = 规范面 · 唯一副本 = 本节）**」+ 参考译，§6.69 只有「**逐字终稿（英文 · 唯一副本 = 本节；围栏内即落地形，实施席逐行整行照落）**」；「偏离」只列 ① 一块说三件 ② 落点取台账节，「不给中文规范面」这一形制分叉未记、也未给理由。 | 把这一形制偏离写进「偏离」并给理由，或补中文终稿面；否则与所引先例的分叉不可见。 |
| 11 | 集成测试设计 | 🟡 | 该节理由第二半逐字「也不是生产真出过的问题」，与本批 §1 的后果陈述相反——§1 逐字「模型只能在**第一次被拒**时从拒文里学到这件事 —— 每个新会话多付一轮」。成立的是第一半（不改既有用例断言的业务可观察结果）+「从业务入口复现不出可机判结果」。 | 理由只留成立的那半并写明为何业务入口复现不出可机判结果，删掉「不是生产真出过的问题」，免得 §6 收口时与本批 §1 相撞。 |
| 12 | Clarity ∥ 落地形 | 🟡 | 围栏块 13 行无列表符号、无缩进，A1 又把「整行相等」定死 ⇒ 落地形被锁；而勘察证据行只给结构计数「469 行 / `##` 17 / `###` 5 / 最长行 300 / `>300` = 0」，未给落点节现有条目形态（是否 `- **…**` 列表）。若该节是列表，13 行齐头顶格段与节内形态分叉，实施席又不能自行缩进对齐（会撞 A1）。 | 在勘察证据行补落点节现有条目形态读数，据此定落地形的缩进 ∥ 列表符号，使 A1 的整行相等能落。 |
| 13 | Clarity ∥ K5 论证 | 🟡 | K5 的理由句「本块首句把语境锁在写盘调用上，`batch` 那一段一字不动。」与围栏块行序不符：首句是「**The write gate — every write call names the row it serves and the project it lands in**.」，紧接着的「In engineering mode a write call carries `ledger:"#N"`, and `#N` must be a row of this repo's ledger in 在途.」同样适用于 `batch create`（它也落盘）；真正锁住语境的是第 5 行的九件射程枚举。 | 把语境锁前移到首句（或在首句就写出射程是哪些调用），并把 K5 的论证改成与落地块行序一致的说法。 |
| 14 | 集成测试设计 | 🔵 | 该节只给 `破行 0 · 冗余 0 · 新增 0` 与 RTM 计数「`test/RTM.md` 398 行 / `^## ` 5 段 / `^### ` 31 个业务故事节 / `^|` 表行 184。」，未点「近面无涉」是哪几个故事；同档 §6.68 逐字「近面无涉——故事 7「收口只判本批改过的档」…· 故事 8「批次档建在项目里…」」。 | 补一句近面故事编号与为何无涉，收口核时可回读。 |
| 15 | 文档归属 | 🔵 | §6.1 的落点登记列表止于「→ §6.58 · §7 D-PS50」，本档 §6.59–§6.69 均未登记；§6.69 上抛项 2 逐字「§7 机制条目由父侧收口时定，本席未落 D 编号」已把编号留给父侧。存量滞后，非本批引入，但「落点在哪」的两处登记因此不同拍。 | 本批不处理；父侧收口若立 §7 条目，顺手把这节的登记行补进 §6.1，避免第二处活描述掉队。 |

**计数**：🔴 3 · 🟡 10 · 🔵 2（共 15 条）。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 评审对象与限制

- **评审对象** = 第 1 轮 15 条的落地验证（对象状态「待评审」）：设计档 `docs/core/design/PROMPT-SYSTEM.md` §6.69（围栏块重写后 · A1–A12 ∥ C1–C10）+ 批档 §2 + 需求档 §13.8。
- **限制 a**：项目无 standards 档 ⇒ 只按 `AGENTS.md` 与评审判据判。
- **限制 b**：无文档地图档 ⇒ 「文档归属」判据降级（本轮无该面发现）。
- **排除**（按父侧对象声明，不重判）：第 1 轮 🔵⑮（§6.1 登记滞后）已裁「本批不处理」；`manifest init` 的需求 ∥ 实现冲突已由父侧 05:22 裁定 + 挂台账 `#2022`。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `docs/core/design/PROMPT-SYSTEM.md` §6.69 | 🔴 | Fixed | 块内已补「- **The one exemption is `manifest`'s `init`**: it creates the project, so the target has no manifest yet and no ledger to ask」；A9 判 `The one exemption is` ∥ `no ledger to ask`；C8 覆盖该边界；受影响文件表已列 `docs/core/requirements/ENGINEERING-MODE-V2.md`，上抛项 1 改为「本批验收源头 = …§13.8 第 ⑥ 条」。 |
| 2 | 2 | 同上 | 🔴 | Fixed | 射程改十二把且含 `memory`；另有「- **The project**: `bash` · `execute` · `memory` (project layer) carry `project:<absolute project root>` as well」与「- **`memory`'s edge**: it carries both only when it writes into the project layer」⇒ 要不要号已可答；A2 补入程条件句判（`when it writes into the project layer`）。 |
| 3 | 3 | 同上 | 🔴 | Fixed | 分支场景已给：勘察证据行「只读 `git` 实测（父侧 2026-11-03 05:05 本会话实跑，本席转引）：`git({action:"status"})` 不带 `ledger` 跑通，回 121 个改动 + 22 个未跟踪」；与 `bash` 的先后由块内「- **No exemption by content**: `bash` carries the number whatever it runs, `git` inside it included」+ C3 ∥ C10 分流。 |
| 4 | 4 | 同上 | 🟡 | Fixed | 块内新增「- **Why the row**: the number is the attribution — it says which debt this write pays」；A8 现判两半（`the number is the attribution` ∧ `the gate cannot block the step that satisfies it`）。 |
| 5 | 5 | `docs/batches/2026-11-03-write-gate-prompt-teaching.md` §2 | 🟡 | Fixed | 上抛项 1 现为「本批验收源头 = …§13.8 第 ⑥ 条……父侧 2026-11-03 05:14 已落该条」；受影响文件表第三行点名需求档（「需求面 · 父侧已落（本席零触）」）。 |
| 6 | 6 | 同上 | 🟡 | Fixed | 上抛项 2 现为「〔已裁 · 子代理面〕……父侧 2026-11-03 05:14 裁定（§1 ②）」；设计 §6.69 上抛项 2 同步为已裁。 |
| 7 | 7 | 同上 | 🟡 | Fixed | 上抛项 4 现为「〔知会 · §1 现状〕§1 已有五块正文（用户裁决 / 问题陈述 / …）；§1 零改」。 |
| 8 | 8 | `docs/core/design/PROMPT-SYSTEM.md` §6.69 | 🟡 | Fixed | 新增 A10（节切 + 在 `**Lifecycle (event → action` 行之前）与 A11（`batch` 段改前改后逐行相等）。 |
| 9 | 9 | 同上 | 🟡 | Fixed | 已补「**档位结论**：三档皆 `.md` ⇒ 无一档越档位、无拆分计划」，且不携尺寸读数。 |
| 10 | 10 | 同上 | 🟡 | Fixed | 偏离 ③ 已补「**只落英文面、不落中文规范面**」并给理由（同一规则第二份活描述 = D2）。 |
| 11 | 11 | 同上 | 🟡 | Fixed | 集成测试设计理由现为「② 未新增业务上真需要的场景——「模型是否读得懂」从业务入口复现不出可机判结果。」；与 §1 相撞的「也不是生产真出过的问题」已删。 |
| 12 | 12 | 同上 | 🟡 | Fixed | 勘察证据行末补「落点节形态读数……落地形取后者（加粗题眼行 + 顶格 `- **题眼**:` 条目）」；围栏块已改 `- **…**` 形，A1 判「`- ` 前缀与加粗一并比」。 |
| 13 | 13 | 同上 | 🟡 | Fixed | 同形歧义 ∥ K5 均改为「语境由块内**射程句**锁住（射程只列写盘工具，`batch` 不在其中）」，与块内行序一致（射程句即十二把那一行）。 |
| 14 | 14 | 同上 | 🔵 | Fixed | 已补「**近面无涉**——故事 7「收口只判本批改过的档」…· 故事 8「批次档建在项目里…」」。 |
| 15 | 15 | `docs/core/design/PROMPT-SYSTEM.md` §6.1 | 🔵 | Accepted | 按对象声明不重判（已裁「本批不处理」）；设计 §6.69 上抛项 3 仍把 §7 编号留给父侧收口，无悬空引用。 |
| 16 | (new) | `docs/core/design/PROMPT-SYSTEM.md` §6.69 | 🔵 | New | 计数残留：「- 九份工具描述同句，逐字：」∥ 下一行「另十一档……（本席本轮逐档命中，共十二份）」；「- **为什么落人格层、不落纪律层**」句内亦作「九份工具描述逐字写「the parent agent must pass it」」——射程与现状表已改十二把，两处「九份」未跟改（算术 9 + 11 ≠ 12）。 |
| 17 | (new) | `docs/batches/2026-11-03-write-gate-prompt-teaching.md` §2 | 🔵 | New | 跨档数字漂移：§2 机制设计摘要「`ledger:"#N"` 在提示词面现有 4 处用法全是 `batch` 的「接手该行」义」，设计 §6.69 现状表 ∥ 勘察证据行两处均为 3 行（「`ledger:"#N"` 3 行全属 `batch` 工具的「接手该行」义」·「`ledger:"#N"` **3 行**，全在」）。 |

**计数**：旧 15 条 = 14 Fixed · 1 Accepted · 0 Unfixed；新 2 条（皆 🔵）。合计 🔴 0 · 🟡 0 · 🔵 2。

**结论**：第 1 轮 3 🔴 与 10 🟡 全部落地且本轮逐条复读验证；围栏块重写后射程 ∥ 豁免 ∥ 归因 ∥ 分支出处四项已自洽，A1–A12 与 C1–C10 覆盖到位；仅余两条计数级 🔵（不阻批准）。

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-11-03 05:10 裁「**提示词面必须完整的调整以适应这个变化，你开批吧。**」+ 05:19「自动跑完」——整批令覆盖批准门。

**批准时状态**：设计评审两轮 —— 轮 1 changes-required（3🔴 ∥ 10🟡 ∥ 2🔵）→ 修正 → 轮 2 **pass**（14 Fixed · 1 Accepted · 仅余 2 条计数级 🔵）。

**批准范围**：落 `thincoder-core/prompts/persona-engineering.md` 台账节、`**Lifecycle (event → action — …)**` 块之前；按设计 §6.69 围栏块逐行整行落 13 行（加粗题眼行 + 12 条 `- **题眼**:` 条目）。要点：

- **射程**：十二把工具。
- **另带 `project`**：`bash` ∥ `execute` ∥ `memory`（仅落 project 层时）。
- **按 action 判**：只读 `git` 与 `manifest` `read` 不带号；`git` 写型与 `manifest` `write` 照带。
- **唯一豁免**：`manifest` 的 `init`。
- **命令面**：`bash` 不论跑什么都带号（命令内容不解析）。
- **没号怎么办**：挂行两步本身不是写。
- **被拒读什么**：拒文点名缺什么 + 当前在途哪几行。

**判据**：设计 §6.69 验收 A1–A12（`node` 整行比对 ∥ 子串计数 ∥ 位置切判 ∥ `batch` 段改前改后逐字相等 ∥ 引用锁集合 ∥ 交付门 `doc_check`）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-11-03（重落轮：块第 3 / 6 行按设计新文整行替换，A1–A11 单测 11/11 绿；第 3 条引文失效已按 append 补记（edit 面拒写），该行引缺留在收口面待父侧裁）



### 本批唯一动作（已落盘）

- **落点**：`thincoder-core/prompts/persona-engineering.md` 台账节（`## Ledger (requirement pool / tech todos) — batching & lifecycle`）内、`**Lifecycle (event → action — …)**` 块之前。
- **落地形**：第 362–374 行 = 13 行（1 行加粗题眼 + 12 条顶格 `- **题眼**:` 条目），逐行整行照落设计 §6.69 围栏块；未改字、未改标点、未改缩进。第 361 行 = 既有空行，第 375 行 = 分隔空行，第 376 行 = `Lifecycle` 块。
- **行数**：改前 469 行 → 改后 483 行（+14 = 13 行块 + 1 行分隔空行）。
- **零连带**：`##` 仍 17、`###` 仍 5，块内无任何节标题。

### 判据读数（A1–A12 逐条自跑 · 2026-11-03）

| # | 跑法 | 读数 |
|---|---|---|
| A1 | `node` 逐行 `===`：落地块 vs 设计围栏块（13 行，首末行含） | **13/13 相等**；全档扫块首句 = **1** |
| A2 | 块内十二把工具名各 ≥1 + `when it writes into the project layer` | 十二名各在 · 条件句 **1** |
| A3 | `project:<absolute project root>` = 1，同句含 `bash` ∥ `execute` ∥ `memory` | **1** · 同句三词齐 |
| A4 | 四串各 1（`A batch's first write is always reachable` ∥ `ledger({action:"add"})` ∥ `batch({action:"create"})` ∥ `neither of those two is a write`） | 各 **1** |
| A5 | 三串各 1（`read the refusal` ∥ `no project on this call` ∥ `only a 在途 row carries writes`） | 各 **1** |
| A6 | 全档 `^## ` = 17 ∥ `^### ` = 5 ∥ `>300` 字符行 = 0 | **17 / 5 / 0**；新增最长行 259 字符 |
| A7a | 块内 `DOC-DISCIPLINE` ∥ `.md §` ∥ `§[0-9]` = 0 | **0** |
| A7b | `node scripts/prompt-refs-check.mjs` 命中**集合**不变 | 5 条，全在 `thincoder-core/agent-tools/`（改前既有 · 代码面）；提示词面零命中，本档不在集合内 ⇒ 集合不变 |
| A8 | 禁令腔词 = 0；why 两半各 1 | **0**；`the number is the attribution` = 1 ∧ `the gate cannot block the step that satisfies it` = 1 |
| A9 | 四串各 1 | 各 **1** |
| A10 | 节切 + 位置判 | 块在 `## Ledger …`（351）与 `**Lifecycle (event → action`（376）之间；块末行与 `Lifecycle` 之间仅 **1** 空行 |
| A11 | 台账节切片去新增块（13 行 + 1 空行）vs `git show HEAD:` 台账节切片，逐行相等 | **逐行相等** |
| A12 | `doc_check(mode:"gate")` 首行 | `DOC-CHECK GATE: PASS` |

**A11 基线**：`HEAD` = `f443b1bd`（2026-11-02 提交），本批 2026-11-03 05:09 起批、其后零提交 ⇒ **HEAD 即 `<batch-start sha>`**，判法即 A11 原文。

**判官非空判（反例突变试验）**：对落地块做一组一字突变——首行双空格 ∥ `(project-layer)` 连字符 ∥ 末行末字改 `!` ∥ `在途`→`在途中` ∥ `· ` 前插空格 ∥ 单引号改双引号 —— A1 判法逐组报不等（`line 1/13/3/2/9 differs`）；缺末条报 `LEN MISMATCH`；原样报 `EQUAL`。⇒ 整行相等判官有效，非空绿。

### 单测档与验证

- 本批单测档 = `docs/batches/2026-11-03-write-gate-prompt-teaching.test.mjs`（**收口时删除**）：A1–A11 每条一个用例，A12 由工具跑。
- 跑法 ∥ 结果：`node --test docs/batches/2026-11-03-write-gate-prompt-teaching.test.mjs` ⇒ **pass 11 · fail 0**。

### 内部审校两轮（终态 clean）

- **分歧审计（explore · 只读）**：`DIVERGENCE: 2 findings`，皆蓝、皆限本批单测档（§2 未列单测档 · A11 基线写 HEAD）；A1–A12 逐条复读成立，指定文件之外零改。
- **代码评审（advisor · code）**：`VERDICT: pass`；🔴 0 · 🟡 4 · 🔵 4。
- **修正轮**：1 轮（单测档补记 A11 基线来历 —— 零产品文本改动）。
- **终态**：`clean`（无 🔴、无 must-fix 的 🟡）。

### 交付披露（内容面发现 · 待父侧裁）

三条皆在**设计围栏块内**（非实施笔误）；本批被要求「逐行整行照落、不改字」，故本席按原文落地、不改设计，三条交父侧裁后走设计面改 + 重落：

1. **`memory` 的 `project:` 前缀单条删除未明说**：块第 367 行逐字「personal and team rows, a single delete by id prefix included, stay outside this gate」。而门按前缀判 —— 依据 thincoder-core/agent/write-gate.mjs「单条删除的层由 id 前缀定（`layer` 可省——`thincoder-core/memory/memory-tool.mjs` 的 `execDeleteSingle`」，同档 `const MEMORY_PROJECT_UID_PREFIX = "project:"`。即 `memory({action:"delete", id:"project:…"})` **要**带号，块内无一句直说（须读者从 `only when it writes into the project layer` 自推）。风险：`included` 一词易被读成「按 id 前缀的删除一律免号」。

2. **`this repo's ledger` ∥ 判据取「目标项目台账」**：块第 364 行逐字「a row of this repo's ledger in 在途」；需求 §13.8 ⑥ 亦逐字「号须是本仓台账 `在途` 行」。而门按声明 ∥ 写盘目标所属项目取根后查该根台账 —— 依据 thincoder-core/agent/write-gate.mjs「是目标所属项目台账里一条 `status = 在途` 的行」，拒文逐字 `row #999999 does not exist in this project's ledger`。单项目会话两说同值；跨项目写（块第 366 行自己给了 `project:<absolute project root>`）时两说分叉。

3. **需求验收 ① 的「六行判据」∥ 落地形态**：依据 docs/core/requirements/ENGINEERING-MODE-V2.md「块内 `ledger:"#N"` ∥ `project:<absolute project root>` 两串在档」（该句为父侧 2026-11-03 05:35 改写后的现文；本条原引的「**六行**判据」即由此失效）。落盘后本档「事件 → 动作」列表仍是 `Lifecycle` 的 **5** 条编号项，写门以**独立 13 行块**落于同节；两串机检成立，但原「六行」按编号列表读不成立。**（父侧代笔一处 · 2026-11-04 11:31：本节「第 3 条的引文失效」段已把该行交父侧裁，原话「改口径或给机判口径都在本席笔域之外」；本笔即执行该裁——只换引文，论断未动。）**

**另（父侧已裁，本席零改）**：块第 370 行按需求写「`manifest` 的 `init` 是唯一豁免」，而依据 thincoder-core/agent/write-gate.mjs「const MANIFEST_WRITE_ACTIONS = new Set(["init", "write"])」，`init` 当前仍计入写型 ⇒ 代码修正批（台账 `#2022`）落地前，提示词 ∥ 工具描述 ∥ 门本体三处对同一机制说法不一。设计 §6.69 上抛项 1 已记此裁，本批未碰代码。

### 修正轮 2 —— 块内两行按设计新文重落 + 第 3 条的引文失效处置（2026-11-03 05:35 起）

**父侧指令面**：设计 §6.69 围栏块第 3 行（`this repo's ledger` → `the declared project's ledger`）与第 6 行（`memory` 按 id 前缀单条删除的判法）已在设计面改正，落地块按新文重落；另修本节第 3 条的失效引文。

**重落结果**

- `thincoder-core/prompts/persona-engineering.md` 第 364 行、第 367 行按设计 §6.69 围栏块新文**整行替换**；其余 11 行一字未动；块仍 13 行，全档仍 483 行。
- 本轮动作面三处：提示词档 2 行 · 本批单测档 A9 用例（补设计 A9 新增的两串 `memory` 前缀判据）· 本节本段。

**重落后的判据读数（A1 / A6 / A11）**

| # | 跑法 | 读数 |
|---|---|---|
| A1 | `node` 逐行 `===`：落地块 vs 设计围栏块（13 行，首末行含） | **13/13 相等**；块首句全档扫 = **1** |
| A6 | 全档 `^## ` ∥ `^### ` ∥ `>300` 字符行 ∥ 总行数 | **17 / 5 / 0**；**483 行**；最长行 300 |
| A11 | `git show f443b1bd:thincoder-core/prompts/persona-engineering.md` 的台账节切片 ∥ 落地档台账节切片去新增块（13 行 + 1 空行），逐行相等 | **逐行相等** |

**A11 基线**：`f443b1bd` = 批起点（本批 2026-11-03 05:09 起批，其后零提交，`git log` 实读仍以 `f443b1bd` 为 HEAD）。

**单测档重跑**：`node --test docs/batches/2026-11-03-write-gate-prompt-teaching.test.mjs` ⇒ **pass 11 · fail 0**（A1–A11）。

**第 3 条的引文失效 —— 处置 = 未改，工具面拒写**

- **失效事实**：父侧 2026-11-03 05:35 把需求 §13.8 的验收 ① 从「六行判据」改写为「按独立一块判」；本席第 3 条所引的「**六行**判据」已不在需求档内（本席 2026-11-03 05:35 `grep` 实扫，全档零命中）⇒ `doc_check` 报 `引缺`。
- **需求现文**（本席 05:35 实读）：依据 docs/core/requirements/ENGINEERING-MODE-V2.md「块内 `ledger:"#N"` ∥ `project:<absolute project root>` 两串在档」
- **结论句**：第 3 条所依据的需求原文已由父侧 2026-11-03 05:35 改写为按独立一块判；本条引旧文已失效。
- **拒写读数**：`batch({action:"edit", segment:"§5"})` 回 `edit is not yours to run — only §2 (the spec section) is rewritable in place; §1 / §3 / §5 / §6 are append-only evidence`、`Nothing was written` ⇒ **§5 第 3 条那一行未改，edit 面拒绝**；append 是本节唯一的补记形态，故本段在此。
- **留下的机器面事实（交父侧裁）**：那一行仍带 `依据 …「**六行**判据」`，`doc_check` 的交付门在收口时仍会把它判 `引缺`；证据面 append-only，本席无删除权，改口径或给机判口径都在本席笔域之外。

## §6 验证与收口（父代理）

**为什么今天才收**：本批实施面 2026-11-03 已完，收口被机制缺口卡住 —— `batch edit` 的段域放开在盘（`#2023`），但进程未重启，`§5` 的行内改写一律被拒；当日实施席已把该行交父侧裁并留下处置路径。2026-11-04 03:30 进程重启，今日补收。

**父侧实跑读数（2026-11-04 11:31）**：

| 判据 | 结果 |
|---|---|
| A1 · 落地块 ∥ 设计围栏块逐行 | **13 行逐行相等**（设计档 `:5923`–`:5935` ∥ 提示词档 `:363`–`:375`） |
| 提示词档行数 | **484**（本批落地时 483；`#2029` 表头一行改两行净 +1，`#2030` 整行替换净 0） |
| 该档超宽行（&gt;300） | **0** |
| `doc_check(mode:"gate")` | **PASS**（1 档，0 段有问题） |

**失效引文的处置**：§5 第 3 条原引「**六行**判据」，需求 ① 经父侧 2026-11-03 05:35 改写后该串已不在盘 ⇒ 门判引缺、收口 fail-closed。实施席当日已记「该行交父侧裁、改口径在本席笔域之外」；本次由父侧就地刷新为现文「块内 `ledger:"#N"` ∥ `project:<absolute project root>` 两串在档」，行内注明代笔缘由。**只换引文，论断未动。**

**单测档**：`docs/batches/2026-11-03-write-gate-prompt-teaching.test.mjs` 随收口删除（当日读数 A1–A11 11/11 绿留在 §5）。

**§5 披露三条的落点**：① `memory` 前缀单条删除的判法 ∥ ② `this repo's ledger` → `the declared project's ledger` —— 两条均在修正轮 2 按设计新文重落；③ 「六行判据」—— 由本节收口处置。

**不移交、不代管**：`#2022`（`MANIFEST_WRITE_ACTIONS` 含 `init` 的代码修正）与 `#2025`（写门三面同拍）各有各的账，本批不代。
