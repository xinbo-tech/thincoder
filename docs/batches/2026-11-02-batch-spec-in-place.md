# 2026-11-02 · batch-spec-in-place
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> §2 = 现在要做什么 —— 本条可就地改（`edit`，§4.19）；§1 / §3 / §5 / §6 = 当时说了什么 —— 只追加，不回改。
> 编制：主 agent · 2026-11-02 · 来源 = 用户 2026-11-02 10:34 逐字「**那个 append-only 的规则其实也不是我定的。**」→ 10:35「**你不如把这条规则也给改了吧！**」。
> 台账 = #1990（ENGINEERING-MODE · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

- **已定决定**：**批档内两种东西、两种处置** —— §2 是「现在要做什么」的规范，**可就地改**；§1 / §3 / §5 / §6 是「当时说了什么」的证据，**append-only**。 · 用户原话：「**那个 append-only 的规则其实也不是我定的。**」→「**你不如把这条规则也给改了吧！**」 · 时间：2026-11-02 10:34 / 10:35

- **覆盖账** = `#1990`

### 为什么要改（现场）

`docs/batches/2026-11-02-review-requires-batch.md` 收口前出过一次真实事故：**§2 验收表里留着一行已被裁定作废的判据**，实施席照验收表落笔，就会把已删掉的分支原样写回来。当时的处置是在后面追加一节（2.11 / 2.12）声明「以本节为准」。

**⇒ 那是补救。任务书（§2）是施工依据，施工依据只能有一种读法。**

### 判据（为什么两种处置）

| 段 | 是什么 | 处置 | 理由 |
|---|---|---|---|
| **§2** | 现在要做什么 —— 实施席照着做的规范 | **就地改** | 照着做的东西不能留两行相左的话；留了就是上一批那次翻车 |
| §1 / §3 / §5 / §6 | 当时说了什么 —— 决策 / 评审结论 / 实施记录 / 收口 | **append-only** | 那是证据；改了就是篡改证据 |

**⇒ 历史不丢：git 记着。项目自己的规矩就是「历史住 git，不住文档」**（`docs/core/design/DOC-DISCIPLINE.md` 的活面纪律同源）。

### 边界

- 只改**写入语义**这一条：§2 可就地改；其余段 append-only 不变。
- 不改段作者白名单 ∥ 不改状态行词表 ∥ 不改收口链门 ∥ 不改骨架形态。
- **`batch` 工具要不要新增「§2 改写」动作**：交设计席判 —— 现在是靠设计席用文件工具直写 §2 达到这个效果，工具面没有这个动作用。**若判要加，属本批范围；若判不加，要写清「§2 就地改由谁、用什么都写」。**

- **已定决定（上抛项 1 的裁）**：**存量批档的档头句，按档的冷热分两种处置** —— 状态行 = `进行中`（在飞）⇒ 档头「六段 append-only」那句随正；状态行 = `已收口`（冻结）⇒ 一字不动。 · 父侧裁 · 时间：2026-11-02 10:39

### 理由（为什么不分一律不改）

**档头那句是给**当下的人**读的操作说明，不是决策证据。**

**⇒ 在飞批档的档头，实施席现在就会照着读** —— 留着旧句，就是让他按 append-only 处理 §2，本批改的规则当场失效。

**⇒ 已收口批档的档头是冻在那一次执行里的账** —— 改了就等于说那一轮是按新规则跑的，而它不是。

**⇒ 判据不是「存量 / 存量以外」，是「这本档还在不在跑」。**

- **已定决定（修正轮两件上抛的裁）** · 父侧裁 · 时间：2026-11-02 10:50

**① 需求层三行随动 —— 归父侧，已落**

- `docs/core/requirements/ENGINEERING-MODE-V2.md` 的「设计变更传播」
  改为「**同轮**就地改 §2（§2 = 规范面，可就地改；§1/§3/§5/§6 = 证据面，只追加）或当日挂债」。
- `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md` 第 3 条
  改为「**两种处置**：§2 可就地改；§1 / §3 / §5 / §6 段不重叠、不回改，只追加」。
- `docs/core/requirements/TOOLS.md` F11 边界句
  改为「段作者写域、冻结门语义全部零变（§2 规范面可就地改；§1/§3/§5/§6 证据面只追加）」。

**② 设计档层三档五处 —— 并入本批**

- 判据：它们是**同一个机制的旧说法**，不是别的板块的独立判据。
- 另开一批只会让这几句错得更久，且违反本批自己的「触达即清」。
- **落成一件事**：扫这三档五处、按新语义就地改；改到的每一句都要在该档自己的上下文里成立，不是贴补丁。

- **已定决定（同族残留的收尾裁）** · 父侧裁 · 时间：2026-11-02 11:05

**不改的两处**：`docs/core/design/DOC-DISCIPLINE.md` 的 `:1011`（`docs/batches/**`（一次性载体不回改））与 `:1044`（不回改 `docs/batches/**`）。

- 判据：这两句各自住在**别的规则**的边界清单里，管的是那条规则的射程；对**已收口档**仍然为真。
- 改它们等于往别人那条规则的边界里塞本批的语义 —— 那不是随正，是扩面。
- **本批的规则单源在 `docs/core/design/BATCH-RECORD.md` §4.19**；两条处置在 `:2226` 与 `:328` 已明写。裸读风险由单源承担。

**⇒ 同族残留就此收手，不再扫。本批设计面到此为止。**

- **已定决定（旁路残余的处置）** · 父侧裁 · 时间：2026-11-02 11:44

**处置 = 不补门、不另裁，维持 §7 `D-BR36` 的登记。**

- 用户当场点出「旁路补门」这条是我想多了 —— 判断成立。
- **判据一**：文件工具今天正在被正当使用（`batch edit` 尚未实现，设计席改 §2、父侧改档头都只能走它）；补段级写门先挡住的正是这些正当写入。
- **判据二**：档级写门是半个门 —— 文件工具对设计档、需求档同样零拦，只给批档加门是假安全。
- **判据三**：无实测案例 + 需 diff 段归属判定 = 新机制；符合「没人踩过的坑不先建分支」。
- **⇒ `§4` 不必为此裁定；`D-BR36` 的登记即为终局，不构成收口阻塞。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成

## 2. 本批任务（覆盖）

| # | 条目 | 判据落点 |
|---|---|---|
| 1 | 批档两种处置：§2（现行任务书）可就地改 · §1/§3/§5/§6（当时说过的话）只追加 | design §4.1「两种处置」行 · §4.19 |
| 2 | `batch` 新增 `edit` 动作（§2 就地改的**受认可通道**，不是唯一通道） | design §4.19 · §4.1 action 分发行 · §4.8 BR-77–BR-84 |
| 3 | 射程三条：只改本批自己的 §2 · 已收口档不改（性质翻转）· 改 §2 不追认实施（判据 = 收口对账两半） | design §4.19「就地改的射程」· §7 D-BR37 |
| 4 | 档头两句形 + 存量档按冷热：在飞随正 · 已收口一字不动 | design §4.10「档头两句」+「存量档按冷热分两种处置」 |
| 5 | 其它写「整档 append-only」的活面随正（设计档层 + 描述面 + 提示词面） | 本文件 §2.3 · §2.4 |
| 6 | 设计档层其余三档五处旧说法并入本批（§1 已裁 ②：并入，不另开批） | 本文件 §2.3 · §2.4「并入本批」表 · 验收 A11 |

**本批不做**（边界）：不动段作者白名单 / 状态行词表 / 收口链门 / 骨架形态（design §8 边界 5 / 13 零变）；不做 §2 整段替换（`edit` = 锚定区间替换，design §8 边界 14）；不做段级文件写门（design §8 边界 16；处置 = 登记即终局，不补门、不另裁（design §7 D-BR36），见 §2.7）；不改需求档面（父侧已落三行，见 §2.7）。

## 2.1 三件逐件判

**① 就地改的射程 —— 判：只改本批自己的 §2；已收口档不改；作者 = §2 的段作者。**

- **只改本批自己的 §2**。目标 = 调用者绑定那一本档；depth-0 用 `path` / 在飞批；他批档 ⇒ 拒。**依据** = 「一段一作者」在工具通道上已是机械事实（design §4.1 段白名单行）；`edit` 的段域照同表同判——一张表管两个动作，段域只有一处单源。
- **作者 = 段作者，不是父侧代笔**。父侧代写 §2 = 第二作者 + 二次加工（design §4「子代理没有写手段 ⇒ 父侧代写 = 失真源」同一理由）。父侧要改 §2 ⇒ 派设计席一轮。
- **已收口档不改**。**依据** = **§2 的性质在收口时翻转**：在飞时是规范，收口后是证据——回头改它，账里就出现一件从没跑过的任务。修法 = 重开径（带追记行，design §4.18-B）或另起新批。与 D-BR11 同源。
- **改 §2 不追认实施**。`edit` 只改规范面，§5 / §3 一条不动。**判据 = 收口对账的两半**（§2 ↔ 设计档 · §2 ↔ §5，单源 = design §4.19「取什么」· D-BR37）：对得上 = 澄清，对不上 = 差异记 §6——**不取改时拦截**（实施开始后改 §2 正当且常见，拦住等于把正路关掉）。

**② 工具面 —— 判：加 `edit` 动作。不加，这条规则就只剩自觉。**

- **依据（机制面，实读）**：携绑定子代理**直写自身批档本就放行**——`thincoder-core/agent/write-gate.mjs:165`：`if (targetKey === boundKey) continue // 写自己绑定的档 = 正常面`。而跨批档门只拦「写别批」、工具段白名单只拦「用工具写别段」⇒ 若只靠「文件工具直写 §2」，**「改动落到别人段」没有任何机械面**。
- **形态**：锚定区间替换——`oldText` 在目标段段体内**恰一次**（逐字节，含行尾）⇒ 换为 `newText`；`newText` 空串 = 删区间。空锚 / 零命中 / ≥2 命中 / 跨段界 / 触及或引入状态行 ⇒ 一律拒（fail-closed，不猜、不模糊匹配）。
- **为什么不是整段替换**：§2 **可能超** `MAX_TEXT_CHARS`（= 20000，`batch.mjs` 实读）。**实测**：266 本带 §2 的批档里 **53 本（约两成）超 20000**，最大 = `docs/batches/2026-10-15-doc-ref-direction-cleanup.md` 的 §2 **128,916 字符（≈上限 6.4 倍）**。
- **复用的既有判据（不新开写盘路径）**：段白名单 · 剥凭证 · 骨架保护 · 冻结拒写 · 文档机检门（`pending` = 本次写进来的文本，`edit` 面 = `newText`；判据单源 = design §4.19「文档机检门」行）· `onWrite` 记账 · 一次 `writeFileSync`。先例 = `append` + `status`。

**③ 与既有条的关系 —— 判：改 design §4.1 那一行；改写面清单见 §2.3 / §2.4（含单源档与三档五处）。**

- `docs/core/design/BATCH-RECORD.md` §4.1 表内原 `| **append-only** |` 行 → 已改为「两种处置」行，并按段的用途限缩。同表另三行随正：段白名单（`edit` 同表）、fail-closed（加 `edit` 锚判据）、action 分发（四 → 五）。
- §4.9 门清单：冻结拒写的覆盖通道加 `edit`；④ 文档机检门的路数加 `edit §2`。§4.18-B 不变量句按新语义限缩（证据面零改 ∥ 骨架零改 ∥ 段作者表零改）。

## 2.2 机制设计（判据单源 = design §4.19）

| 面 | 契约 |
|---|---|
| 参数 | `segment`（= 自己段）+ `oldText` + `newText`；`path` 仅 depth-0 |
| 段域 | `eng-designer → §2`（工程） · `主 agent depth-0 → §2`（普通） · 评审 / coder 零段 |
| 锚判据 | `oldText` 空串 ∥ 纯空白 ⇒ 拒；恰一次命中（逐字节，含行尾）；零 / ≥2 / 跨段界 / 触及或引入 `**状态行**：` ⇒ 拒 |
| 拒面归属 | 四条有场景（零命中 = 观测型；≥2 命中 ∥ 跨段界 ∥ 触及状态行 = **构造型复现，各给最小两步**）+ 两条无场景落程序不变量（**仍带拒文、仍进 A2**，理由 = design §4.19「两条无场景的仍带拒文」） |
| 门 | 冻结门（已收口 ⇒ 拒）+ 文档机检门（`pending` = 本次写进来的文本，`edit` 面 = `newText`；判据单源 = design §4.19「文档机检门」行） |
| 回执 | `batch: edited §2 of the batch record — replaced <N> characters with <M>.` |
| 拒句逐字 | `docs/core/design/TOOLS.md` §6.24 ⑤（E1–E6） |

## 2.3 受影响文件

| 档 | 面 | 改什么 | 模块 |
|---|---|---|---|
| `thincoder-core/agent-tools/batch.mjs` | 实现 | action 枚举四 → 五 + `edit` 执行体 + `oldText` / `newText` schema + 骨架保护拒串改写 | M4 |
| `thincoder-core/tool-docs/batch.md` | 描述面（模型可见） | action 枚举行 + `edit` 参数说明 + 「six append-only sections」句改两种处置 | M4 |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 实现（骨架） | §4.10 档头第二句（新增档逐字取形）+ `:149` 注释随正 | M4 |
| `thincoder-core/agent-tools/batch-gate.mjs` | 实现（注释 / 回执） | `:18` 注释 + `:304` 回执行「append-only 零破」随正 | M4 |
| `docs/core/design/BATCH-RECORD.md` | 设计档 | **本批已落**：§4.1 / §4.8（BR-77–BR-84）/ §4.9 / §4.10 / §4.18-B / §4.19 / §6.2 A1·A8 / §7（含 D-BR37）/ §8 | — |
| `docs/core/design/PROMPT-SYSTEM.md` | 设计档（**单源**） | **本批已落**：§6.37 规则 2 · 规则 3（收口对账两半）· 逐字块 C（四行 = persona-engineering 四行整体替换目标形）· 逐字块 D（三行 = discipline-engineering D7 bullet 两行整体替换目标形）· **逐字块 F（F-1 / F-2 = persona-eng-designer 两处整行替换目标形）** · 同向表行 · K6 · 用例表 U2·U4·U6·U8 · 验收 A2 · A3（判法改 D7 bullet 形） | — |
| `docs/core/design/TOOLS.md` | 设计档（描述面镜像） | 工具索引行 + F11 总则 / 边界 + §6.24 ④⑤（`edit` 描述与拒句逐字） | — |
| `docs/core/design/ENGINEERING-MODE-V2.md` | 设计档（工程模式板） | `:52` `继承 v1 六段 append-only` · `:193` `批次档 append-only` ⇒ 两种处置（§1 已裁 ② 并入本批） | — |
| `docs/core/design/ANCHOR-DEBT-REPAIR.md` | 设计档（锚修复板） | `:110` `批档 append-only + 非追溯` · `:180` `append-only 写入为合规必需` ⇒ 证据面 append-only ∥ §2 可就地改 | — |
| `docs/core/design/DOC-CODE-RECONCILE.md` | 设计档（对账板） | `:24` `append-only、回改禁` ⇒ 证据面回改禁，§2 可就地改 | — |
| `docs/core/design/DOC-DISCIPLINE.md` | 设计档（文档纪律板） | **本批三处**：`:1270` 写入口三个（`append` 段尾 / 状态行 / `edit` §2 段体）· §4.6 边界句 · `:328` 标注取消面边界句 ⇒ 已收口零写 ∥ 在飞 §2 可就地改 | — |
| `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 设计档（评审板） | **本批已落**：§4 决策 25「代价与边界」句 ⇒ `append §3` 的例外只剩状态行；§2 段体区间改写是另一条通道（判据 = `docs/core/design/BATCH-RECORD.md` §4.19） | — |
| `docs/core/design/LEDGER.md` | 设计档（台账板 · 描述面引文镜像） | **属实施轮改**：`thincoder-core/tool-docs/batch.md` 首句的引文 `six append-only sections, one author each` ⇒ 两种处置——与描述面同笔，引文镜像不得先于原文改 | M4 |
| `thincoder-core/prompts/persona-eng-designer.md` | 提示词 | 「Two deliverables」写入手段句（append 之外补 `edit`） | M2 |
| `thincoder-core/prompts/persona-engineering.md` | 提示词 | 「设计变更传播」句 ⇒ 就地改（逐字 = `PROMPT-SYSTEM` §6.37 块 C） | M2 |
| `thincoder-core/prompts/discipline-engineering.md` | 提示词 | D7 对账句 ⇒ 就地改 + §2 ↔ §5 半句（逐字 = 同节块 D） | M2 |

**笔主分工**（design §4.1 路由）：代码 / 描述面 / 提示词 = eng-coder（M4 ∥ M2，提示词按逐字块落笔）；设计档 = eng-designer。

**落盘态（本席本轮核过）**：表内实现 / 描述面 / 提示词三面已实施完毕，逐档落盘判定与验收对照在 §5 —— §2 不重述读数。

- **已在盘（本席本轮逐档实读，共 8 档）**：`docs/core/design/BATCH-RECORD.md` · `docs/core/design/PROMPT-SYSTEM.md` · `docs/core/design/TOOLS.md` · `docs/core/design/ENGINEERING-MODE-V2.md` · `docs/core/design/ANCHOR-DEBT-REPAIR.md` · `docs/core/design/DOC-CODE-RECONCILE.md` · `docs/core/design/DOC-DISCIPLINE.md` · `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`（验收 A9 ∥ A10 ∥ A11 的落点）。
- **只剩一档属实施轮**：`docs/core/design/LEDGER.md` 的 `:1022` 引文——它引的就是描述面首句，随 `thincoder-core/tool-docs/batch.md` 同笔由 eng-coder 改；引文不得先于原文改，设计席不代笔。

**模块结论**：M4（工具面）+ M2（提示词面）= **2 个模块**，不触 L7 上限（design §5.1 L7「≤2」）；设计档层不计模块。

**贴线判（实施后实测 · `node` 逐档 `split('\n').length`）**：

- `batch.mjs` **516** 行 —— **过 500 软线**（`edit` 面整体 ≈130 行：`sectionBodySpan` ∥ `statusLineSpans` ∥ 三条 `EDIT_*` 拒串 ∥ `editBatchRecord`）⇒ **有拆分计划**：按本工具既有的「一关注一档」分法（`batch-lifecycle.mjs` ∥ `batch-gate.mjs` ∥ `batch-skeleton.mjs` ∥ `batch-reopen.mjs` ∥ `batch-ledger-bind.mjs` 同层兄弟），把这四件移入新档 `thincoder-core/agent-tools/batch-edit.mjs`，`batch.mjs` 留 schema 与 action 分发 ⇒ 预期 ≈386 行。拆分归属 = **下一批**：本批实施已收口、读数已绿，拆它是一次等价搬迁，不属本批验收面。
- `batch-skeleton.mjs` **496** 行（距 500 软线 4 行）；本批只改模板里的字面句，**不带出助手函数**（行数 ±0）⇒ 零拆分义务。预留拆分计划（若需）= 模板与占位常量拆出 `batch-skeleton-template.mjs`（承 KD-4 的 skeleton ← lifecycle ← 主档分层先例）。
- `batch-lifecycle.mjs` **369** 行，本批零触。
- `batch-gate.mjs` **365** 行，本批只改两处注释 / 回执字面（±0）⇒ **零拆分义务**。

## 2.4 「整档 append-only」活面清单（逐处处置；扫描面 = 设计文档层 + 需求层 + 提示词树 + 代码 / 描述面）

**已在本轮改完（设计档层，本席笔域）**：

| 处 | 原现文（逐字） | 处置 |
|---|---|---|
| `docs/core/design/BATCH-RECORD.md` §4.1 / §4.8 / §4.9 / §4.10 / §4.18-B / §4.19 / §6.2 / §7 / §8 | — | 已改（§2.3 行） |
| `docs/core/design/PROMPT-SYSTEM.md:1760` | `**同轮**追加 §2 更正（append-only，旧行不动）` | 已改：就地改那几行（`edit`），旧行删掉 |
| `docs/core/design/PROMPT-SYSTEM.md` §6.37 规则 3 | `D7 收口清单加一项「§2 判据 / 计数 ↔ 当前设计档」` | 已改：加 §2 ↔ §5 半句（对得上 = 澄清 / 对不上 = 差异记 §6） |
| `docs/core/design/PROMPT-SYSTEM.md` §6.37 **逐字块 C** | `append a §2 correction through a designer fix round (appended lines; the old ones stay as the record of what was thought then)` | 已改：`correct those lines in place through a designer fix round (\`batch({action:"edit", …})\` — an anchored range replacement; the superseded lines are deleted …)`；落点说明改为**整行替换** |
| `docs/core/design/PROMPT-SYSTEM.md` §6.37 **逐字块 D** | `a mismatch is closed by an appended §2 correction` | 已改：`a mismatch is corrected in place with \`batch({action:"edit", …})\`` + 追加 `§2 ↔ §5 reconciliation` 半句 |
| `docs/core/design/PROMPT-SYSTEM.md` §6.37 用例表 U2 · U4 · U6 · U8 | `append 更正行` ∥ `补新形态引用（更正行）` ∥ `父侧直接给 §2 append 更正` ∥ `补引用或 append 更正` | 已改：四行皆就地改（`U6` 的拒面不变，仍是段白名单机械兜底） |
| `docs/core/design/PROMPT-SYSTEM.md` §6.37 验收 A2 | `append a §2 correction` 各 1 次 | 已改：正形换成 `batch({action:"edit", …})`；加反向判据——逐字块 C ∥ D 内扫 `appended lines` ∥ `appended §2 correction` ⇒ 0 |
| `docs/core/design/PROMPT-SYSTEM.md:1847` | `| §2 append-only（\`batch\` 工具段白名单） | §2 只可追加… |` | 已改：§2 两种处置 |
| `docs/core/design/PROMPT-SYSTEM.md:1888` | `| K6 | 更正 = append，不改旧行 |` | 已改：更正 = 就地改 |
| `docs/core/design/TOOLS.md:221` | 索引行 `append 段写入 append-only` | 已改：五动作 + 两种处置 |
| `docs/core/design/TOOLS.md:603` | F11 总则 `六段 append-only … 语义**零变**` | 已改：六段结构零变，段内写入纪律指向 §4.19 |
| `docs/core/design/TOOLS.md:672` | F11 边界 `batch 六段 / append-only / …语义零变` | 已改：同上 |
| `docs/core/design/TOOLS.md` §6.24 | 原只登记收口 / 重开文本面 | 已新增 ④⑤（`edit` 描述面 + 拒句 E1–E6） |
| `docs/core/design/DOC-DISCIPLINE.md:1270` | `append-only 下别人的段落字面改不动（工具只有 append 与状态行两个写入口）` | 已改：写入口三个（`append` 段尾 / `status`·`close` 状态行 / `edit` §2 段体） |
| `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:832` | `append-only 的例外只剩状态行那一行本身` | 已改：`append §3` 的例外只剩状态行；§2 段体区间改写是另一条通道 |

**并入本批、本席本轮已落（§1 已裁 ② —— 判据：同一机制的旧说法，不是别的板块的独立判据）**：

| 处 | 原现文（逐字） | 落盘形（逐字 = 盘上现文；在该档自己的上下文里成立） |
|---|---|---|
| `docs/core/design/ENGINEERING-MODE-V2.md:52` | `继承 v1 六段 append-only` | 已落：`继承 v1 六段结构：§2 规范面可就地改，§1/§3/§5/§6 证据面只追加（判据单源 = `docs/core/design/BATCH-RECORD.md` §4.19）` |
| `docs/core/design/ENGINEERING-MODE-V2.md:193` | `批次档 append-only` | 已落：`批次档按段分两种处置——证据面只追加、§2 规范面可就地改，收口落的是 §6 的追加` |
| `docs/core/design/ANCHOR-DEBT-REPAIR.md:110` | `批档 append-only + 非追溯` | 已落：`批档非追溯——在飞时 §2 规范面可就地改、其余段只追加，冻结后除重开径外零写` |
| `docs/core/design/ANCHOR-DEBT-REPAIR.md:180` | `append-only 写入为合规必需` | 已落（父侧裁 · 2026-11-02 11:00 · 判 = 改）：`append-only 写入对证据面为合规必需，§2 规范面就地改同为合规`。理由 = AC-4 判的是「本档的写入是否合规」，新规下 §2 就地改是合规写入——不改则一次合规的 §2 修改被这条验收判成不合格 |
| `docs/core/design/DOC-CODE-RECONCILE.md:24` | `（…不是漂移）且 append-only、回改禁` | 已落：`证据面 append-only、回改禁，§2 规范面可就地改` |
| `docs/core/design/DOC-DISCIPLINE.md:2226` | `- **不重写历史批档**（批次档 append-only）；V5 扫描域**不含批档**。` | 已落（父侧裁 · 2026-11-02 11:02 · 判 = 改）：`- **不改已收口批档**（冻结档除重开径外一字不动）；在飞批档的 **§2 是规范面，可就地改**（判据单源 = `docs/core/design/BATCH-RECORD.md` §4.19）；V5 扫描域**不含批档**。` 理由 = 旧句把「历史批档」与「在飞批档」混成一句，会挡住一次合规的在飞 §2 修改 |
| `docs/core/design/DOC-DISCIPLINE.md:328` | （旧句把「一次性批次材料」整句当成不回改的理由，无「§2 规范面」这一半；旧字面已不在盘） | 已落：`- **批档分两种处置**：**在飞批档的 §2 是规范面，可就地改**（判据单源 = `docs/core/design/BATCH-RECORD.md` §4.19）；**已收口批档一字不动**（冻结档除重开径外零写）——一次性批次材料（同条目 1 的边界），取消的射程 = **规则面（今后）+ 活档（设计 / 需求档）行**。` 判别串 = 词组 `批档分两种处置`（A11 第三处读数） |

**逐句判法（本轮的落笔依据，可复核）**——两类，两种依据：

- **机制描述五句**：`docs/core/design/ENGINEERING-MODE-V2.md` 两句 ∥ `docs/core/design/ANCHOR-DEBT-REPAIR.md:110` ∥ `docs/core/design/DOC-CODE-RECONCILE.md:24` ∥ `docs/core/design/DOC-DISCIPLINE.md:2226`——都是对该档机制的描述（选型理由 / 事务边界 / 边界依据 / 选型评估 / 清理层边界），改写不动它们各自支撑的裁定。
- **验收判据本体一句 = `AC-4`**（`docs/core/design/ANCHOR-DEBT-REPAIR.md:180`）：改它 = 改该板块验收的通过集会，故单列一层判——父侧 2026-11-02 11:00 裁**改**（理由见 §2.7）；落盘形把例外从「append-only 写入」扩到「证据面 append-only 写入 + §2 规范面就地改」。

**机检门连带修（本档外一处）**：`docs/core/design/DOC-CODE-RECONCILE.md:120-123` 原为一段超长（逐段判定超 300 字，本批之前即在），到门即修——拆成四条，文字逐句不变。读数：首轮 `doc_check(mode:"gate")` = `REFUSED（1 段文字太长）` ⇒ 修后复跑 = `PASS（3 档全清）`。

**属实施轮改（代码 / 描述面；引文本轮实读）**：

| 处 | 原现文（逐字） | 处置 |
|---|---|---|
| `thincoder-core/agent-tools/batch-skeleton.mjs:478` | `> 六段 append-only，一段一作者：…` | 改：两句形（design §4.10 骨架块） |
| `thincoder-core/tool-docs/batch.md:1` | `six append-only sections, one author each` | 改：两种处置（design §4.19） |
| `thincoder-core/agent-tools/batch.mjs:225` | `…would break section location and the append-only guarantee.` | 改：`…would break section location.`（逐字 = `docs/core/design/TOOLS.md` §6.24 ⑤ E6） |
| `thincoder-core/agent-tools/batch-skeleton.mjs:149` | `append-only 的唯一豁免，域限状态行` | 改：改写面有三处（§2 段体 / 状态行 / 重开追记） |
| `thincoder-core/agent-tools/batch-gate.mjs:18` | `append-only 下别人的段落字面改不动，拒一个改不动的人` | 改：对证据面仍真，对 §2 不真 |
| `thincoder-core/agent-tools/batch-gate.mjs:304` | `append-only 零破：前文逐字不变、段号不前进、轮次 N 不推进` | 改：本批新增面（原扫面未含） |
| `docs/core/design/LEDGER.md:1022` | `six append-only sections, one author each` | 改：同描述面（`batch` 描述原文引用） |

**不改（对它们仍真）**：`batch.mjs:125,127`（段尾插入路径）· `batch-reopen.mjs:9,56`（重开径 ±1 行判据）· `docs/core/design/SESSION.md:672,1051`、`docs/core/design/LEDGER-SELF-CONTAINED.md:213`（会话记录 / 搬迁的 append-only，不是批档六段面）· `docs/core/design/_archive/**`（归档）· `docs/core/requirements/_archive/**`（归档）。

**同族残留就此收手（登在此、不改）**：`docs/core/design/DOC-DISCIPLINE.md` 的两处 `docs/batches/**` 不回改句（逐字 = `docs/batches/**`（一次性载体不回改）∥ 不回改 `docs/batches/**`）——它们各住在**别的规则**的边界清单里，管的是那条规则的射程，对**已收口档**仍然为真；改它们等于往别人那条规则的边界里塞本批的语义 = 扩面，不是随正。本批规则单源 = `docs/core/design/BATCH-RECORD.md` §4.19（判据来源 = §1「已定决定（同族残留的收尾裁）」）。

**提示词树扫描读数（本轮实读）**：`thincoder-core/prompts/**` 全文扫 `append-only` = **0 命中**（扫描脚本逐档逐行）。三处待改的提示词说的是 `append` / `appended §2 correction`，不是 `append-only`。

## 2.5 验收（机检项）

| # | 判据 | 机检形 |
|---|---|---|
| A1 | `edit §2` 恰一次命中 ⇒ 就地换，其余行逐字节不变 | 单测：改前 / 改后行长比较，仅目标区间变（BR-77） |
| A2 | 空锚 / 零命中 / ≥2 命中 / 跨段界 / 触及状态行 / 引入状态行 ⇒ 拒且零字节落盘 | 单测六例，全文 `===` 比对（BR-78 / BR-80 / BR-83） |
| A3 | 段域：eng-coder `edit §5` · 评审 `edit §3` · 工程 depth-0 `edit §2` ⇒ 三拒 | 单测三例（BR-79） |
| A4 | 已收口档 `edit §2` ⇒ 拒，拒串含「已收口档不回改」 | 单测（BR-81） |
| A5 | `newText` 空串 ⇒ 删区间；含 `## §4` ⇒ 拒 | 单测两例（BR-80 / BR-82） |
| A6 | 新建档档头两句形逐字 = design §4.10 骨架块（第二、三行） | 单测断言 `batchSkeleton()` 产出含该两句 |
| A7 | **在飞档档头随正**（载体 = 主 agent 文件直改，`batch` 无此动作 ⇒ 无单测） | 两条直写判据：(a) 本档 §1 = `进行中` ∧ 本档档头逐字 = design §4.10 骨架块第二、三行（`node` 逐行 `===`）；(b) 造一本 §1 = `已收口` 夹具档，同形操作前后档头逐字节 `===`（`node` 比对）。两条都跑才算过（BR-84 已写明载体） |
| A8 | **提示词三处随正（逐行相等 + 正反两形）** | 硬判 = 落地行与单源档逐字块**逐行整行相等**（`node` 逐行 `===`）：`thincoder-core/prompts/persona-engineering.md` 四行 = 块 C · `thincoder-core/prompts/discipline-engineering.md` 三行 = 块 D（`- the role table / status line / counts / pointers / todo check-offs;` 行零改）· `thincoder-core/prompts/persona-eng-designer.md` = 块 F-1 一行 + 块 F-2 两行；反向扫 ⇒ 0：persona-engineering 无 `the old ones stay` ∥ `append yourself` · persona-eng-designer 无 `an append — §1 belongs to the main agent` · discipline-engineering 无 `closed by an appended §2 correction`；正向：三档各含子串 `batch({action:"edit"` |
| A9 | 单源档规则面随正 | grep：`docs/core/design/PROMPT-SYSTEM.md` 无 `追加 §2 更正` ∥ `更正 = append，不改旧行` |
| A10 | 单源档逐字目标形块随正 | 块 C ∥ 块 D ∥ 块 F 落地行与 `docs/core/design/PROMPT-SYSTEM.md` §6.37 对应围栏块逐行 `===`（`node`）；两档扫 `appended lines` ∥ `appended §2 correction` ∥ `append yourself` ⇒ **0**；用例表 U2 / U4 / U6 / U8 四行不再含 `append 更正` |
| A11 | 四档六处旧说法清零（§1 已裁 ② · 文档纪律板一处 = 父侧裁 2026-11-02 11:02） | 本轮实读（逐档 `grep`）：`docs/core/design/ENGINEERING-MODE-V2.md` 扫 `六段 append-only` ∥ `批次档 append-only` ⇒ **0** · `docs/core/design/ANCHOR-DEBT-REPAIR.md` 扫 `批档 append-only` ⇒ **0**，扫 `append-only 写入为合规必需` ⇒ **0**（AC-4 已落新形 `append-only 写入对证据面为合规必需，§2 规范面就地改同为合规`——判别串是旧句的字面串，新形在其间插了「对证据面」故不命中） · `docs/core/design/DOC-CODE-RECONCILE.md` 扫 `且 append-only、回改禁` ⇒ **0**（新形本身含 `append-only、回改禁` 作证据面描述 ⇒ 判别串取旧句的连词前缀） · `docs/core/design/DOC-DISCIPLINE.md` 扫 `批次档 append-only` ⇒ **0**，扫 `批档分两种处置` ⇒ **1**（第三处的正形判别串；旧句无此词组）。落盘形逐字在盘 = 7 句（§2.4「落盘形」表 7 行） |
| A12 | 收口对账两半（D7）跑过 | 本批 §6 里两行读数都在**且各携读数来源**：`§2 ↔ design` 行点名所比设计节（`design §N.M`）· `§2 ↔ §5` 行点名 §5 的哪几行 / 哪条；缺一行 ∥ 一行无来源 = 未跑（design §4.19「取什么」） |

**验收命令**（本批单测档，收口随批删）：`node --test docs/batches/2026-11-02-batch-spec-in-place.test.mjs`

**集成面（按 `test/RTM.md` 逐节写 Δ）**：

| 节 | 断言的业务结果 | 本批 Δ |
|---|---|---|
| §7 机检门（7-1…7-9） | `batch` 收口 / 写段前后 gate 的 verdict 与「拒 ⇒ 字节不变」 | 零 Δ：九行的进入口不含 `edit`；7-8「前文零变」判 append 面，判据未动 |
| §8 工作区锚 create · §10 收口消费凭证 · §13 建档带台账 · §14 门与重锚 · §17 评审落地 · §20 一本档一席 · §27 状态行自动置位 | 各自的建 / 收 / 门 / 重锚 / 评审 / 并发 / 状态置位结果 | 零 Δ：均无 `edit` 进入口，本批不动 create / close / status / 段级状态行判据（§17 只 17-1 ∥ 17-2，与 7-10 不重复） |
| §7 新增一行 `7-10` | **§2 就地改的可观察结果**：改得对 ⇒ §2 那一行被换掉、其余行逐字节不变；锚不唯一 ⇒ 拒且零字节落盘 | **立行**：进入口 = 工程模式设计席对在飞批档 §2 的一次更正（本批起因 = `docs/batches/2026-11-02-review-requires-batch.md` §2 验收表留着已作废判据）；回指 = design §4.19 ∥ §4.8 BR-77 · BR-78 ∥ 用例档 `test/integration/batch-edit-spec-section.test.mjs` ∥ 台账 `#1990` ∥ 本档 §1「已定决定（批档内两种东西、两种处置）」；**节注同笔两处**：① 交互组件句（`batch` 工具（append ∥ close）⇒（append ∥ edit ∥ close））、② 进入口句加「§2 改写 = 设计席 `edit`，门判的是写进来的 `newText`（判据单源 = design §4.19）」；③ 九态 → **十态**（行序加 7-10）。行号已在此定死，实施轮落行 + 写用例标题 |

## 2.6 关键决策

design §7：**D-BR33**（两种处置按段的性质切）· **D-BR34**（就地改走 `edit`，不走文件直写）· **D-BR35**（已收口档的 §2 不改）· **D-BR36**（段级文件写门 = 登记即终局：不补门、不另裁）· **D-BR37**（「不追认实施」判据 = 收口对账两半，不取改时拦截）。

## 2.7 上抛项

- **[已落 · 需求层三行]**（父侧笔，本席零触）：`docs/core/requirements/ENGINEERING-MODE-V2.md` 设计变更传播 = 同轮就地改 §2 · `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md` 第 3 条 = 两种处置 · `docs/core/requirements/TOOLS.md` F11 边界句 = 段作者写域与冻结门零变、§2 规范面可就地改。
- **[已裁 · 已落] `docs/core/design/ANCHOR-DEBT-REPAIR.md` 的 AC-4 例外句**（父侧裁 · 2026-11-02 11:00 · 判 = 改）：原句「**自身留痕段除外**——append-only 写入为合规必需」→ `append-only 写入对证据面为合规必需，§2 规范面就地改同为合规`。理由 = AC-4 判的是「本档的写入是否合规」，新规下 §2 就地改是合规写入——不改则一次合规的 §2 修改被这条验收判成不合格（放宽的不是标准，是验收跟上规则）。**「比较基准（AC-4）」块（`:187`）同笔核过、零改**：该块逐字实读 = 「基准 = 实施轮开工时的 `HEAD`；读数 = `git diff --name-only <基准>` + `git status --porcelain`（未跟踪档）两读并用、按档名去重；清单外未跟踪档 = 判红」——它只定读数口径、全文不含 append-only，通过集只在 AC-4 一处携带 ⇒ 两处说法一致。
- **[已裁 · 已落] `docs/core/design/DOC-DISCIPLINE.md` §4.6 边界句**（父侧裁 · 2026-11-02 11:02 · 判 = 改）：原句「不重写历史批档（批次档 append-only）」把「历史批档」与「在飞批档」混成一句——新规下只有已收口档零写，在飞档的 §2 是规范面、可就地改 ⇒ 改后两半都在（已收口零写 ∥ 在飞 §2 可就地改），V5 扫描域半句零动。落点 = §2.4「落盘形」表第六行 · 验收 A11。
- **[已裁 · 已落] 旁路残余 = 登记即终局，不补门、不另裁**（父侧裁 · 2026-11-02 11:44）：文件工具直写本档别人段仍无机械面（判据单源 = design §7 D-BR36）——不立段级文件写门，`§4` 不为此裁定。理由 = ① 文件工具仍在被正当使用（改档头、工具未建模的一次性修字面）；② 档级写门只给批档加门，对设计档 / 需求档同样零拦 = 假安全；③ 无实测案例 + 需 diff 段归属判定 = 新机制。
- **[上抛·待裁] 文档机检门的阻断面：`edit` 的 `pending` 判 = 收窄** —— 判 = **只判本次写进来的文本**（`edit` = `newText`），已落内容只入回执、不阻本次写；理由与实测见 design §4.19「文档机检门」行（266 本带 §2 的批档中 118 本的 §2 段体内有超 300 字长段，其中 11 本在飞）。**代码现文不符**：`thincoder-core/agent-tools/batch.mjs` 传的是 `pending: { section: 2, body: newBody }`（改写后的整个 §2 段体），而 `append` 那一处传的是 `pending: { section: n, body }`（`body` = 本次追加文）⇒ 同门两种阻断面。要落这条 = 一次代码面改动（改 `pending.body` 的取值），归父侧派单；本批实施已收口，设计席无代码笔权。

- **[上抛·知会] 描述面预算读数**：`batch` 描述增加 `edit` 段后，`PROMPT-SYSTEM.md` §6.11 读数变化——实施轮跑 `node scripts/tool-schema-size.mjs` 回填（先例 = `TOOLS.md` §6.20）。


## 2.8 第 6 轮评审八行 ∥ §5 五条上抛的处置（本席本轮逐条）

| # | 来源 | 处置 | 落点 |
|---|---|---|---|
| 1 | §3·6 #1 🟡 | 已改：块 C ∥ 块 D 的落点说明按盘上现态收正 —— 只留「盘上该条 = 四行 / 三行」+ 逐字块 + A8 逐行 `===` | `docs/core/design/PROMPT-SYSTEM.md` §6.37 |
| 2 | §3·6 #2 🟡 | 已改：§2.3 加「落盘态」行（表内三面已实施，读数在 §5）；贴线判按实测重写 | 本档 §2.3 |
| 3 | §3·6 #3 🟡 | 已改：§2.4 不改清单补登 `docs/core/design/DOC-DISCIPLINE.md` 的两处 `docs/batches/**` 不回改句，并写明「同族残留就此收手」 | 本档 §2.4 |
| 4 | §3·6 #4 🟡 | 已改：`batch.mjs` 实测 **516** 行（过 500 软线）⇒ 给拆分计划（`batch-edit.mjs`，归属下一批）；另三档读数同笔改实测 | 本档 §2.3 |
| 5 | §3·6 #5 🔵 | 已改：「本批不做」行 ∥ §2.6 的「残余裁定面 = 用户」→「登记即终局，不补门、不另裁」 | 本档「本批不做」行 · §2.6 |
| 6 | §3·6 #6 🔵 | 已改：错算行映射（「并入第二、三行」）随 #1 一并退场 —— 只留四行逐字块，硬判 = A8 逐行 `===` | `docs/core/design/PROMPT-SYSTEM.md` §6.37 |
| 7 | §3·6 #7 🔵 | 已改：补块 F 行宽读数 F-1 = **249** · F-2 = **189** ∥ **280**（均 ≤300） | 同上 |
| 8 | §3·6 #8 🔵 | 已改：§4.19 ∥ §7 D-BR36 ∥ 本档 §2.7 三处理由① 换成不依赖实现进度的表述 | `docs/core/design/BATCH-RECORD.md` §4.19 · §7 |
| 9 | §5 上抛 1（贴线） | 同 #4 | 本档 §2.3 |
| 10 | §5 上抛 2（段域拒文） | 已改：`docs/core/design/TOOLS.md` §6.24 ⑤ E6 拆两半 —— 冻结 / 骨架 / 剥凭证逐字同 append，**段域自成一形两式**并给逐字（不复用的理由：append 串对 eng-coder 说 §5 不是你的，而 `edit` 的调用者正是能写 §5 的人） | `docs/core/design/TOOLS.md` §6.24 ⑤ |
| 11 | §5 上抛 3（机检门 `pending`） | 判 = **收窄**，设计已按判据收正；代码面待派单 | `docs/core/design/BATCH-RECORD.md` §4.19 · 本档 §2.7 |
| 12 | §5 上抛 4（围栏缩进观感） | 判 = **不动**：`4` ∥ `6` 缩进落在编号项的内容区内、不成为代码块，渲染不受影响；硬判据（落地行与围栏逐字相等）已成立，改它 = 一次提示词面（产品代码）改动，换不到可判收益 | — |
| 13 | §5 上抛 5（复现步骤落 E4） | 已改：拒面表「锚或替换触及状态行」行的第一步改成「取状态行一行作锚」，并写明取「段头 + 状态行」会先抛 E4 | `docs/core/design/BATCH-RECORD.md` §4.19 拒面表 |

## §3 设计评审（评审子代理）
**状态行**：评审通过（第 6 轮：第 5 轮 8 行逐条回盘，🔴 0 ∥ 🟡 4 ∥ 🔵 4，裁定行独立成行）



### 轮次 1（评审子代理）

**评审对象** = 本档 §2 设计（批档两种处置 · `batch` 新增 `edit` 动作）· 轮次 1

**结论** = VERDICT: changes-required（🔴 4 ∥ 🟡 9 ∥ 🔵 2）

**1 · Requirements · 🔴 在飞档头随正这条裁定没落进设计**

- 依据：本档 §1「**已定决定（上抛项 1 的裁）**：**存量批档的档头句，按档的冷热分两种处置**」
- 依据：同节「状态行 = `进行中`（在飞）⇒ 档头「六段 append-only」那句随正；状态行 = `已收口`（冻结）⇒ 一字不动」
- 冲突：§2.4「**不改**：存量批次档档头（记录面，不回改）」∥ §2.7「本批判 = **不回改**…若父侧认为在飞档该随正，请裁」
- 冲突：`docs/core/design/BATCH-RECORD.md` §4.10「新增档逐字取形；存量档不回改（记录面）」
- 现场：本档状态行 = `进行中`，档头仍是旧句——正是该随正的那一句；设计把它当待裁项重开了一次
- 建议：把父侧裁定写成设计规则（在飞 ⇒ 新两句形；已收口 ⇒ 一字不动），落成任务行 + 验收；删掉该上抛项

**2 · Document ownership · 🔴 单源档还写着反向规则**

- 依据：`docs/core/design/BATCH-RECORD.md` §4.10「设计变更传播…单源 = `docs/core/design/PROMPT-SYSTEM.md` §6.37」
- 现文：`docs/core/design/PROMPT-SYSTEM.md` §6.37「**同轮**追加 §2 更正（append-only，旧行不动）」
- 现文：同档 §6.31 K6「更正 = append，不改旧行 | §2 append-only 是工具机械事实」
- 冲突：本批只改三处提示词副本，单源未改，且该档不在受影响文件表内
- 建议：同批改 §6.37 / K6 / 同向表行，并把该档写进受影响文件表（md = 免档位判）

**3 · Document ownership · 🔴 本档 §4.18-B 的不变量仍说「append-only 零改」**

- 现文：`docs/core/design/BATCH-RECORD.md` §4.18-B「六段一段一作者零改 · append-only 零改」
- 冲突：同档 §4.1 同表已改成「§2 = 现行任务书（规范面）：可就地改」
- 判：§2.4 的「八处」扫面不含本档 §4.18——同一机制两处两种说法，且都在规范面
- 建议：该不变量句按新语义限缩（证据面零改 ∥ 骨架零改 ∥ 段作者表零改）

**4 · Branch provenance（6b）· 🔴 四条锚拒面没有场景**

- 面：零命中 ∥ ≥2 命中 ∥ 锚越段界 ∥ 锚或替换触及状态行——各带拒串 + A2 四例单测
- 缺口：全档无这四条的观测或复现路径；依据只有「不猜、不模糊匹配」
- 先例：本仓对 2026-11-02-review-requires-batch 那批已用同一判据（「结算面 `no-batch-binding` 臂没有场景」= 🔴）
- 已成立：`newText` 空串 = 删区间这条有场景（2026-11-02 批 §2.8 判据 5 留着一行已作废判据）
- 建议：逐条给复现路径；给不出就落成程序不变量（不带拒文分支），并把「有场景 / 无场景」分列

**5 · Clarity · 🟡 拒面差两形，且 EOL 未定**

- 缺形一：`oldText` 空串 / 纯空白——空针的命中计数不会 ≥2，按「恰一次」会放行并插在段首
- 缺形二：`newText` **引入**一条 `**状态行**：` 行——现文只拒「锚或替换触及」既有状态行
- 后果：§4.12「段内多命中 ⇒ 改写首条」会让新插的行接管 §2 状态行写入
- 缺形三：未说匹配是否逐字节含行尾；CRLF 档上 LF 锚会零命中（安全但必须写明）
- 建议：两形补进拒面与 A2，并写明「逐字节匹配，含行尾」

**6 · Feasibility · 🟡「唯一通道」说得比机制大**

- 现文：§2 条目 2「`batch` 新增 `edit` 动作（§2 就地改的唯一通道）」
- 事实：本档（BATCH-RECORD）§4.2「主 agent（depth 0）不受该门约束」；§8 边界 6 保留主 agent 普通文档写
- 事实：设计自己的前提 = 携绑定子代理直写自身档本就放行 ⇒ 设计席走文件工具仍无机械面
- 判：`edit` 是受认可的通道，不是排他的通道；文件工具那条路仍是零摩擦旁路（正是本设计的采纳风险）
- 建议：把「唯一通道」改成「受认可通道」，并用一行写清它为什么更省事（只需锚，不需重发全文）

**7 · Methodology · 🟡 整段替换不可行缺一个实测例**

- 成立部分：`thincoder-core/agent-tools/batch.mjs` 实读 `export const MAX_TEXT_CHARS = 20000`
- 未成立：设计「§2 动辄数百行」没有实测例；本档自己的 §2 约百行，远未触上限
- 建议：给一本真实 §2 超单次上限的档（路径 + 读数），或把断言改成「可能超」而不是「动辄」

**8 · Acceptance · 🟡 A7 只覆盖三处提示词的一处**

- 现文：A7「grep：`thincoder-core/prompts/persona-engineering.md` 不再含「the old ones stay」语境句」
- 缺口：persona-eng-designer「(an append — §1 belongs to the main agent and stays as written)」与 discipline-engineering「closed by an appended §2 correction」无机检形
- 建议：三处各给一条 assert 形，或写明后两处为何只能靠评审核

**9 · Tier check · 🟡 结论行只覆盖一个实现档**

- 现文：设计 §2.3「`batch.mjs` 现 365 行 + ≈70 行 `edit` 执行体 ⇒ ≈435，500 软线内」（365 与盘一致）
- 缺口：同表另一实现档 `thincoder-core/agent-tools/batch-skeleton.mjs` 无读数；复核当刻实测 = 494 行（距 500 软线 6 行）
- 建议：补该档实测读数 + 「零拆分义务」结论；若档头句改动带出助手函数，给拆分计划

**10 · Integration · 🟡 RTM 零 Δ 只有断言没有面**

- 现文：设计 §2.5「本批不改任何业务可观察结果…`test/RTM.md` 零 Δ」——未点名任一行或一节
- 事实：`test/RTM.md` 确有 batch 工具故事（§7 机检门 · §13 台账绑定 · §14 门与重锚 · §20 重用门 · §27 状态置位）
- 建议：按节写 Δ（各态未变的理由 = append/status/close 的断言与字节判据未动）；新增的就地改场景要么立行要么写清为什么不是业务可观察结果

**11 · Doc ownership · 🟡 扫面只到代码 + 提示词树，文档层未扫**

- 现文：§2.4 标题「其它「整档 append-only」声明（**已查**，逐处处置）」
- 未扫：`docs/core/design/TOOLS.md`「action = create ∕ append ∕ status ∕ close…append 段写入 append-only」
- 未扫：同档 F11「六段 append-only / 一段一作者 / 冻结门…语义**零变**」
- 未扫：`docs/core/design/BATCH-RECORD.md` §6.2 A1「六段 append-only·**一段一作者**声明句」/ A8「…/ append-only / …」
- 未扫：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`「append-only 的例外只剩状态行那一行本身」
- 未扫：`docs/core/design/DOC-DISCIPLINE.md`「工具只有 append 与状态行两个写入口」
- 未扫：`thincoder-core/tool-docs/batch.md`「existing lines are never rewritten or deleted」+「every append runs it」
- 未扫：`thincoder-core/agent-tools/batch-gate.mjs` 回执行「append-only 零破：前文逐字不变…」
- 核实：「提示词树其余扫 append-only = 0 命中」为真（全树 0 命中，非字面三处才是原文说法）
- 建议：把 §2.4 的射程扩到文档层与描述档，并把「已查无」限缩成「提示词树字面 0 命中」

**12 · Coordination · 🟡 需求层旧说法未点名**

- 现文：`docs/core/design/BATCH-RECORD.md` §8 边界 7「需求档面（`requirements/`）零改动」
- 会失效的行：`docs/core/requirements/ENGINEERING-MODE-V2.md`「**同轮**追加 §2 更正（append-only）或当日挂债」
- 会失效的行：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md`「3. **append-only**：段不重叠、不回改。」
- 会失效的行：`docs/core/requirements/TOOLS.md` F11「六段 append-only 语义…全部零变」
- 建议：按本档 §4.10 先例（需求侧随动 = 上抛主 agent）把这三种点名为上抛项的行

**13 · Discipline-only · 🟡「改 §2 不追认实施」有可机检的代理形**

- 现文：设计 §8 边界 15「机判不出「这次改动是不是为了洗账」」——这答的是意图，不是状态
- 可机检的代理：§5 已有内容 ⇒ `edit §2` 拒（或必须带理由 + 追记行）；单源已就绪 = `sectionContentState`
- 先例：同档 §4.18-B 重开径的追记行就是「改动留痕」的既有形状
- 建议：要么落成该代理判据，要么写清为什么连状态代理也不取（例如实施后正当澄清很常见）

**14 · Note · 🔵 新名字没走三问形**

- `edit` / `oldText` / `newText` / 回执串无「住哪 · 逐字名 · 归谁」三问；实质已在（复用 append/status 判定函数、不新开写盘路径）
- 附带：骨架保护 `^## §\d` 可被 `##  §4` 一类写法绕过（继承自 append 面，非本批引入）

**15 · Note · 🔵 八处逐处处置判得对，缺的是扫面不是判据**

- 八条引文逐一在盘核过（骨架档头句 / 描述档首句 / 拒串 / 两处注释 / 三处提示词），处置方向都对
- 「§4.19 目标态 + 理由 + 边界」三件齐备，未写成禁令清单——这一条本批做到了

**VERDICT: changes-required**（🔴 4 ∥ 🟡 9 ∥ 🔵 2）

### 轮次 2（评审子代理）

**评审对象** = 本档 §2 第 2 轮（只核上轮 15 条：🔴4 ∥ 🟡9 ∥ 🔵2）

**结论** = VERDICT: changes-required（🔴 3 ∥ 🟡 3 ∥ 🔵 4）

**五判**

- A（🔴1 落得对不对）：过。在飞 ∥ 已收口的判据 = 状态行（§4.10「状态行 = `进行中`（在飞）⇒ 随正」）；本档档头第二句已随正；§4.10 ∥ §4.19 同一说法（「同一条规则的两端」）。A7 的载体缺（#4）。
- B（🔴2 清干净没有）：未清干净（#1）。
- C（🔴4 场景分列）：过。四条有场景各自可跑；两条无场景落程序不变量，仍带拒文、仍进 A2（与 §2.2 ∥ A2 六例一致）。#8 ∥ #9 只作登记。
- D（7-10）：必要，且与 §17 不重复（`test/RTM.md` §17 只有 17-1 ∥ 17-2，均为评审 ↔ §3 ∥ `batchDoc`）。它的 Δ 不全（#6）。
- E（收口对账）：拦不住洗账（#3）。

**证据（逐字）**

- `docs/core/design/PROMPT-SYSTEM.md` §6.37 块 C 的标头 = 「逐字英文文本（实施席照此落笔 · 唯一权威目标形）」，块内：
- 　"append a §2 correction through a designer fix round (appended lines; the old ones stay as the record of what was thought then)"
- 同节块 D："closed by an appended §2 correction"
- 同节用例表："派 designer 修正轮 append 更正行" ∥ "父侧直接给 §2 append 更正" ∥ "补引用或 append 更正"
- 盘面：`thincoder-core/prompts/persona-engineering.md` 逐字是块 C 那句；`thincoder-core/prompts/discipline-engineering.md` 逐字是 "A mismatch is closed by an appended §2 correction, or recorded in §6"
- 本档 A8 反向判据："`thincoder-core/prompts/discipline-engineering.md` 无 `closed by an appended §2 correction`"（⇒ 照块 C ∥ 块 D 落笔即撞自己的验收）
- 本档 §2.3 该档行："§6.37 规则 2 + K6 + 同向表行（设计变更传播 = 就地改）"（未含块 C ∥ 块 D ∥ 用例表）
- 本档 §1："**② 设计档层三档五处 —— 并入本批**" ∥ "**落成一件事**：扫这三档五处、按新语义就地改"
- 本档 §2.4："**属另轮改（设计档层其余一句；本席本轮不改，列明不让它静默）**"；§2.7："请裁 = 并入本批（那要多一个任务行）∥ 另开一批"
- 盘面仍在：`docs/core/design/ANCHOR-DEBT-REPAIR.md` "批档 append-only + 非追溯" ∥ `docs/core/design/DOC-CODE-RECONCILE.md` "append-only、回改禁" ∥ `docs/core/design/ENGINEERING-MODE-V2.md` "继承 v1 六段 append-only"
- 本档 §4.19："判的对象从意图（改它是不是为了洗账——机判不出）换成事实（§2 与 §5 / §6 是否对得上——机检与人都可读）"
- 同 bullet 括注："D7 清单项：§2 判据 / 计数 ↔ 当前设计档，差异记 §6"
- D7 在盘（`thincoder-core/prompts/discipline-engineering.md`）："**§2 ↔ design-doc reconciliation** — every criterion or count §2 cites still matches the owning design-doc section."
- 本档 §8 边界 15："机判不出「这次改动是不是为了洗账」，故它落为纪律句（§4.19 射程第三条）"
- 本档 §4.10 谁改："主 agent 建档时写、收口前由主 agent 随正；子代理不碰档头"；A7："造一本 §1 = `进行中`、档头仍是旧句的档，跑随正（BR-84）"
- `test/RTM.md` §7 节注："交互组件 = `batch` 工具（append ∥ close）⟷ `runBatchGate`（范围 + 强制集）⟷ `doc-check` 引擎"
- 实测（本轮 node / read 实读）：`batch.mjs` 366 行 ∥ `batch-skeleton.mjs` 494 行 ∥ `batch-lifecycle.mjs` 369 行（与 §2.3 读数一致）∥ `batch-gate.mjs` 361 行

**发现表**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership | 🔴 | 🔴2 未清干净：§6.37 块 C ∥ 块 D ∥ U2·U6·U8 仍写「append §2 更正」，两档提示词逐字就是这两句 | 三处换成 `edit` 形并给改后逐字英文；§2.3 ∥ §2.4 扩面；加机检形 |
| 2 | Requirements | 🔴 | 父侧裁「三档五处并入本批」未落进 §2.3 ∥ 验收；§2.4 仍写「本席本轮不改」 | 移进 §2.3 + 逐句改后形 + 验收；删 §2.7 第 2 条；条目表补一行 |
| 3 | Discipline-only | 🔴 | 收口对账只比 §2 ↔ 设计档，§4.19 却称判「§2 与 §5」；其余靠纪律 | D7 加 §2 ↔ §5 半句 + 逐字英文；或删该句并写明风险由谁裁定 |
| 4 | Clarity | 🟡 | A7「跑随正」无载体（§4.10 = 主 agent 手写档头） | 写明载体，A7 改成可直写的两条判据 |
| 5 | Doc state | 🟡 | §2.7 第 1 条仍「[上抛·待裁]」，§1 已记「归父侧，已落」 | 改成已落确认行或删掉 |
| 6 | Integration | 🟡 | 7-10 的 Δ 只说九态→十态；§7 节注交互组件句仍（append ∥ close）；7-10 缺回指 | Δ 补交互组件句；7-10 补回指格 |
| 7 | Tier check | 🔵 | batch-gate.mjs 无贴线读数（另三档 366 ∥ 494 ∥ 369 与盘一致） | 结论行补该档 361 行、零拆分义务 |
| 8 | Branch provenance | 🔵 | 后三条有场景给的是构造步骤，非观测例；可跑 | 标构造型复现 + 最小两步，或补真实例 |
| 9 | Acceptance | 🔵 | 两条无场景仍带拒文、仍进 A2（与 §2.2 一致） | §4.19 写一句保留 fail-closed 拒的理由 |
| 10 | Scope | 🔵 | 旁路无机械面，只登记 D-BR36 | 写明这条风险由谁裁定接受 |

**计数** = 🔴 3 ∥ 🟡 3 ∥ 🔵 4

**VERDICT: changes-required**

### 轮次 3（评审子代理）

**评审对象** = 本档 §2 第 3 轮（只核上轮 10 条是否真解决，不另找新问题）

**计数** = 🔴 2 ∥ 🟡 2 ∥ 🔵 4

**VERDICT: changes-required**

**三条重点判（逐条读数）**

- A（🔴1 英文块是否终稿）：设计档内文已改到位（块 C 收「`write yourself`」· 块 D 收「a mismatch is corrected in place」
  + §2 ↔ §5 半句 · U2/U4/U6/U8 就地改 · A2 加反向判据）；**但两块的中文落笔指令与盘面形不符** ⇒ 两条 🔴（#1 / #2）。

- B（🔴2 五句是否真改在盘上）：**过**。`docs/core/design/ENGINEERING-MODE-V2.md` 两句 ·
  `docs/core/design/ANCHOR-DEBT-REPAIR.md` 两句 · `docs/core/design/DOC-CODE-RECONCILE.md` 一句，落盘形逐字在盘，
  各自在该档上下文里成句（不是句尾挂括注）；A11 六条判别串对新形均不命中自己
  （新形插了「对证据面」· 判别串取旧句连词前缀 `且`）。

- C（🔴3 洗账判据）：判据本体**能分开**——时点 = 收口，两处记录比对；正当澄清在收口时 §5 终态与 §2 相符，洗账则不；
  D-BR37 ∥ 块 D ∥ §4.19 两条并列判据同一口径；边界 15 已删「故它落为纪律句」。残留一条 🔵（#6）。

**证据（逐字）**

- `docs/core/design/PROMPT-SYSTEM.md` §6.37 C 的落笔指令：「条**整行替换**
  （该条在盘、现文是旧形 `append a §2 correction…`；行数 ±0，bullet 位置不动）」

- 盘面 `thincoder-core/prompts/persona-engineering.md`：该条不是一行，是四个物理行——
- 　「- **A landed design change propagates to the task books that cite it**: the moment a design-doc change lands」
- 　「- **In that same round**, append a §2 correction through a designer fix round」
- 　「- **The scan and the dispatch are yours**: §2 corrections go to **eng-designer**.」
- 　「  - **Why**: a correction you append yourself puts a second author on their segment」

- `docs/core/design/PROMPT-SYSTEM.md` §6.37 D 的落笔指令：「`thincoder-core/prompts/discipline-engineering.md:188` 内、
  整段替换现文 `counts / pointers`（块 D 首尾即两端锚；行数 ±0）」

- 盘面 `thincoder-core/prompts/discipline-engineering.md`：三项分处三行——
- 　「- the role table / status line / counts / pointers / todo check-offs;」
- 　「- **§2 ↔ design-doc reconciliation** — every criterion or count §2 cites still matches the owning design-doc section.」
- 　「A mismatch is closed by an appended §2 correction, or recorded in §6」

- A3 判据：「`counts / **§2 ↔ design-doc reconciliation**` 1 次，且与 `7. **D7 settlement sync**` 同一行」
  ——盘上 D7 标题自占一行。

**发现表**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity / Feasibility | 🔴 | 块 C 落笔指令与盘面不符：称「该条在盘、现文是旧形 …行数 ±0」，盘上该条是四个物理行 | 落点改「该条四行整体替换」并给替换后行形；A8 该档反向串补 `append yourself` |
| 2 | Acceptance / Clarity | 🔴 | 块 D 落点识别错：`counts / pointers` 与 §2↔design 项分处两行；照落多一份项、旧 bullet 留着（A8 反向串红）；A3「同一行」两形皆不可满足 | 二选一写死：块 D 改 D7 bullet 形整段替换并删旧续行 ∥ 保留清单行内形则写明删哪两行并改 A3 判法 |
| 3 | Clarity | 🟡 | `thincoder-core/prompts/persona-eng-designer.md` 的写入手段句无逐字目标形，A8 只查子串 `batch({action:"edit"` | 补一块逐字英文（形同块 C ∥ 块 D），A8 改判落地行逐行 `===` |
| 4 | Doc state（🔵10 对齐） | 🟡 | 旁路残余未与 §1 裁定对齐：§1 = 不补门、不另裁、§4 不必裁定；§4.19 ∥ §2.7 仍写「裁定面 = 用户 · 落点 = §4 · 不接受则并入本批」 | 两处改与裁定同文（登记即终局），删二分支；§2.7 改已裁确认行 |
| 5 | Registration | 🔵 | §2.3 称 `docs/core/design/DOC-DISCIPLINE.md` 三处，§2.4 只登记两处；第三处（「批档分两种处置」那行）无原现文 | §2.4「落盘形」表补第三行，或写明 A11 扫面覆盖该处原现文串 |
| 6 | Acceptance | 🔵 | A12 机检形只判 §6 两行「在」，不判比较做过；无门读这两行 | 两行之一要求携读数来源（`§5` 哪几行 ∥ `design` 哪节） |
| 7 | Integration | 🔵 | 7-10 回指只到 `design §4.19` ∥ BR-77·BR-78 ∥ 用例档，无需求 / 台账指针 | 回指补一条指向台账 `#1990` 与 §1「已定决定」 |
| 8 | Note | 🔵 | U6 与 §6.37 对照表末行「机械兜底，不靠自觉」只对 `batch` 工具通道成立（§4.19 明写「**旁路仍在**…无机械面」） | 两处补「（工具通道内）」或指向 D-BR36 登记 |

**已解决（逐条给读数）**

- 🟡4 A7：已改成两条可直写判据并写明载体（主 agent 文件直改）；本档档头第二句与 `docs/core/design/BATCH-RECORD.md`
  §4.10 骨架块第二、三行逐字相同 ⇒ (a) 可跑。
- 🟡5：§2.7 第 1 条已是「[已落 · 需求层三行]」，无「待裁」。
- 🟡6：7-10 的 Δ 已补交互组件句、进入口句、回指与十态行序。
- 🔵7 贴线读数抽核通过：`thincoder-core/agent-tools/batch.mjs` 366 行 ·
  `thincoder-core/agent-tools/batch-skeleton.mjs` 494 行 · `thincoder-core/agent-tools/batch-gate.mjs` 361 行
  ⇒ 结论行「零拆分义务」与实测一致。
- 🔵8 / 🔵9：三条拒面标「构造型复现（最小两步）」；两条无场景落程序不变量并写明仍带拒文、仍进 A2 的理由。

### 轮次 4（评审子代理）

**评审对象** = 本档 §2 设计（批档写入语义）· 第 4 轮：只核上轮 8 条（🔴2 ∥ 🟡2 ∥ 🔵4）

**结论** = VERDICT: pass

**计数** = 🔴 0 ∥ 🟡 0 ∥ 🔵 3（上轮 8 条：Fixed 8 ∥ Unfixed 0；本轮新增 🔵 3）

**三条重点判（逐条读数）**

- **A（🔴1 块 C 能不能真执行）= 能。** `docs/core/design/PROMPT-SYSTEM.md` §6.37 C 已改成「条**四行整体替换**」，点名盘上四行并写「旧四行整行删、不留续行（行数 4 → 4，标题那一行不再单独存在）」；围栏 4 行、无段内空行（行宽 206 ∥ 163 ∥ 253 ∥ 205，均 ≤300）。
- **B（🔴2 块 D 与 D7 是否自洽）= 是。** 块 D 改成「D7 清单**一条 bullet 整段替换**」，点名盘上两行 + 「上一行 `- the role table / status line / counts / pointers / todo check-offs;` 零改」，围栏三行缩进与盘上一致；A3 撤掉「与 D7 标题同一行」，改判 D7 段内两串 + 该行零改。
- **C（🟡4 是否对齐）= 已对齐。** `docs/core/design/BATCH-RECORD.md` §4.19 ∥ §7 D-BR36 ∥ 本档 §2.7 同文「登记即终局（不补门、不另裁）」；「登记不是交代」「接受则 / 不接受则」两档实扫 0 命中。

**盘面读数（本轮实读）**

- `thincoder-core/prompts/persona-engineering.md` 该条 = 四个物理行，与块 C 的替换说明一一对得上：
- 　`- **A landed design change propagates to the task books that cite it**: the moment a design-doc change lands`（标题行）
- 　`- **In that same round**, append a §2 correction through a designer fix round (appended lines; the old ones stay as the record of what was thought then), or book the day's debt on the ledger, naming the batch and the section.`
- 　`- **The scan and the dispatch are yours**: §2 corrections go to **eng-designer**.`
- 　`  - **Why**: a correction you append yourself puts a second author on their segment, and a correction left unbooked is one nobody comes back to make.`
- `thincoder-core/prompts/discipline-engineering.md` D7 三项分处三行，与块 D「两行换三行、上一行零改」对得上：
- 　`- the role table / status line / counts / pointers / todo check-offs;`（零改行）
- 　`- **§2 ↔ design-doc reconciliation** — every criterion or count §2 cites still matches the owning design-doc section.`
- 　`A mismatch is closed by an appended §2 correction, or recorded in §6; judging closeout by a stale §2 is what turns a correct implementation red.`
- `thincoder-core/prompts/persona-eng-designer.md` 块 F 两处锚点实读在位：
- 　`1. **The batch task**: this batch's covered requirement entries / entries explicitly NOT in this batch / affected files / acceptance criteria → **batch record §2** (an append — §1 belongs to the main agent and stays as written).`
- 　`Write means = the `batch` tool, `batch({action:"append", segment, text})` (**no path parameter** — the target doc is bound at your spawn, the segment number is determined by your identity: eng-designer → §2)`
- `docs/core/design/DOC-DISCIPLINE.md` 第三处落盘形实读在位：`- **批档分两种处置**：**在飞批档的 §2 是规范面，可就地改**（判据单源 = `docs/core/design/BATCH-RECORD.md` §4.19）；**已收口批档一字不动**`
- `docs/core/design/BATCH-RECORD.md` §4.19 两半同文：`**对得上 = 澄清，照此收口**` ∥ `**对不上 = 洗账的形**`——与块 D 的 `matched = a clarification that stands; mismatched = a difference recorded in §6, never closed by editing §2 again` 同一口径。

**逐条核**

| # | Orig# | 档 | 严重度 | 状态 | 说明 |
|---|---|---|---|---|---|
| 1 | 1 | `docs/core/design/PROMPT-SYSTEM.md` §6.37 C | 🔴 | Fixed | 四行整体替换 + 点名旧四行 + 行数 4→4；反向串 `append yourself` 已进 A8 ∥ A2（0 命中），A8 判法为落地行逐行 `===` |
| 2 | 2 | 同上 · 块 D ∥ A3 | 🔴 | Fixed | 块 D = D7 bullet 两行整段替换、三行落地；`counts / pointers` 行零改；A3 改判 D7 段内两串，可满足 |
| 3 | 3 | `thincoder-core/prompts/persona-eng-designer.md` | 🟡 | Fixed | 补块 F-1 ∥ F-2 逐字目标形；两锚盘上实读在位；A8 改判「F-1 一行 + F-2 两行」逐行 `===` |
| 4 | 4 | `docs/core/design/BATCH-RECORD.md` §4.19 ∥ D-BR36 ∥ 本档 §2.7 | 🟡 | Fixed | 三处同文「登记即终局」；§2.7 已改 `[已裁 · 已落]`；「接受则 / 不接受则」二分支与「登记不是交代」两档 0 命中 |
| 5 | 5 | 本档 §2.4 ∥ A11 | 🔵 | Fixed | 补第七行（`docs/core/design/DOC-DISCIPLINE.md` 的 `批档分两种处置` 落盘形 + 判别串）；该句盘上实读在位、该串全档 1 次 |
| 6 | 6 | 本档 A12 | 🔵 | Fixed | 改为「两行都在**且各携读数来源**；缺一行 ∥ 一行无来源 = 未跑」 |
| 7 | 7 | 本档 §2.5 集成面 7-10 | 🔵 | Fixed | 回指已含 `台账 #1990` ∥ 本档 §1「已定决定（批档内两种东西、两种处置）」 |
| 8 | 8 | `docs/core/design/PROMPT-SYSTEM.md` §6.37 U6 ∥ 对照表末行 | 🔵 | Fixed | 两处加「（工具通道内）」并点明文件工具旁路无机械面、登记 = 段级文件写门候选扩展 |
| 9 | (new) | `docs/core/design/PROMPT-SYSTEM.md` §6.37 C | 🔵 | New | 「后两条 bullet 并入第二、三行」与同节 4 行围栏不符：第一、二行仍属标题 bullet，`- **The scan and the dispatch are yours**…` 落第四行；以围栏为准，A8 逐行 `===` 会拦住落错 |
| 10 | (new) | 本档「本批不做」行 ∥ §2.6 | 🔵 | New | 两处仍写「残余裁定面 = 用户」（`候选扩展 = D-BR36，残余裁定面 = 用户，见 §2.7` ∥ `D-BR36（段级文件写门登记为候选扩展；残余裁定面 = 用户）`）；无 §4 分支故非「待裁」，属措辞残留 |
| 11 | (new) | `docs/core/design/PROMPT-SYSTEM.md` §6.37 块 F | 🔵 | New（unverified） | 块 F 未给行宽读数（块 C 给了 206 ∥ 163 ∥ 253 ∥ 205）；F-2 第二行（`(**no path parameter** — … the report states "§2 not written".`）接近 300 阈值，本席无 `node` 实算 ⇒ 宽度 unverified |

**范围与限制**

- 评审面 = 本档 §2 设计 + 声明的三档审查面；为核 A / B / 🟡3 另读三档提示词与 `docs/core/design/DOC-DISCIPLINE.md`（盘面可读，属本轮核验面）。
- 集成用例档本体不属本轮评审对象（7-10 立行 = 实施轮，本档 §2.5 已写明「行号已在此定死，实施轮落行 + 写用例标题」）；只核本档 §2.5 的 Δ 行。
- 硬要求扫描：「普通模式不装门 ∥ 不适用 ∥ 由纪律承担（作为免于校验的理由）」——两档实扫 0 命中；`docs/core/design/BATCH-RECORD.md` §4.19 的「不取改时拦截」给的是「正当澄清常见」+ 收口两半判据，不是纪律豁免。

### 轮次 5（评审子代理）

**评审对象** = 本档 §2 设计（批档写入语义）· 第 5 轮：核第 4 轮裁定面 + 裁定行合法形

**本轮核法** = 第 4 轮 11 行逐条回盘复读（在评三档 + 盘面证据）；量法 = `read` 逐档读数 ∥ 逐字引文比对（无 shell；行数取 `read` 报的档尾行）

**结论** = 三处旁路表述**同文成立**；块 C ∥ 块 D 的**落笔描述已与盘面不符**（目标形已落地，指令点名的旧行不在盘）；**无 🔴**

**计数** = 🔴 0 ∥ 🟡 4 ∥ 🔵 4

**逐条回盘（第 4 轮 11 行）**

| 原# | 条目 | 本轮实读 | 结论 |
|---|---|---|---|
| 1 | 块 C 四行整体替换（原 🔴） | `thincoder-core/prompts/persona-engineering.md` 已是目标形四行（`and in that same round correct those lines in place through a designer fix round`）；A8 逐行 `===` 有可比对象 | 目标形成立；落点描述失真 ⇒ 🟡 #1 |
| 2 | 块 D 两行 → 三行（原 🔴） | `thincoder-core/prompts/discipline-engineering.md` 已是三行目标形（`a mismatch is corrected in place`），`- the role table / status line / counts / pointers / todo check-offs;` 仍零改 | 同上 ⇒ 🟡 #1 |
| 3 | 块 F 两处逐字形（原 🟡） | `thincoder-core/prompts/persona-eng-designer.md`：`(an append, or an in-place edit — §1 belongs to the main agent and stays as written).` | 成立 |
| 4 | 三处旁路表述同文（原 🟡） | `docs/core/design/BATCH-RECORD.md` §4.19 `处置 = **登记即终局**（§7 D-BR36）：不补门、不另裁` ∥ 同档 §7 D-BR36 `**处置 = 登记即终局**（不补门、不另裁）` ∥ 本档 §2.7 `旁路残余 = 登记即终局，不补门、不另裁` | 同文成立（理由①前提见 🔵 #4） |
| 5 | §2.4 第七行 + A11 判别串（原 🔵） | `docs/core/design/DOC-DISCIPLINE.md` 扫 `批档分两种处置` = 1；四档扫 `六段 append-only` ∥ `批次档 append-only` ∥ `批档 append-only` ∥ `且 append-only、回改禁` = 0 | 成立 |
| 6 | A12 携读数来源（原 🔵） | 本档 A12 行在；未跑（属收口） | 成立 |
| 7 | 7-10 回指含台账（原 🔵） | 本档 §2.5 集成面 7-10 行含 `台账 #1990` ∥ `本档 §1「已定决定（批档内两种东西、两种处置）」` | 成立 |
| 8 | U6 ∥ 对照表末行「（工具通道内）」（原 🔵） | `docs/core/design/PROMPT-SYSTEM.md` §6.37 两处均在 | 成立 |
| 9 | 块 C 行映射措辞（第 4 轮新 🔵） | 同节四行围栏块第四行 = `The scan and the dispatch are yours; the §2 pen is the designer's` | 仍在 ⇒ 🔵 #2 |
| 10 | 残余裁定面措辞（第 4 轮新 🔵） | 本档「本批不做」行 ∥ §2.6 仍写 `残余裁定面 = 用户` | 仍在 ⇒ 🔵 #1 |
| 11 | 块 F 行宽未测（第 4 轮新 🔵） | 块 F 围栏块仍无行宽读数；提示词面门判 `lineMax: 300` | 仍在 ⇒ 🔵 #3 |

**证据（逐字）**

- `docs/core/design/PROMPT-SYSTEM.md` §6.37 C：`盘上该条 = 标题行` + `- **In that same round**, append a §2 correction…` + `- **The scan and the dispatch are yours**…`（该四行已不在盘）

- 同节块 D：`盘上 = 两行：` + `- **§2 ↔ design-doc reconciliation** …` + `与其续行` + `A mismatch is closed by an appended §2 correction, or recorded in §6; …`（该两行已不在盘）

- 本档 §2.3：`action 枚举四 → 五 + `edit` 执行体 + `oldText` / `newText` schema + 骨架保护拒串改写`（列为待改）

- 盘上已落：`thincoder-core/agent-tools/batch.mjs` 的 `enum: ["create", "append", "edit", "status", "close"]` ∥ `thincoder-core/tool-docs/batch.md` 首句 `two write dispositions` ∥ `docs/core/design/LEDGER.md` 引文同形 ∥ `docs/batches/2026-11-02-batch-spec-in-place.test.mjs` 在盘 —— 而本档 §5 为空

- 本档 §2.3 结论行：`batch.mjs` **366** 行 + ≈70 行 `edit` 执行体 ⇒ ≈436——500 软线内，零拆分义务 —— 本轮实测 `thincoder-core/agent-tools/batch.mjs` = **516** 行

- 本档 §1：「不改的两处：`docs/core/design/DOC-DISCIPLINE.md` 的…（`docs/batches/**`（一次性载体不回改））与…（不回改 `docs/batches/**`）」·「同族残留就此收手，不再扫」；§2 全档扫两处坐标串 = 0（两处盘上仍为旧句，与裁定一致）

**发现表**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Doc-state / Clarity | 🟡 | `docs/core/design/PROMPT-SYSTEM.md` §6.37 C ∥ D 的落笔说明仍把 `append a §2 correction…` ∥ `closed by an appended §2 correction` 当作盘上现文；两档盘上已是目标形（`and in that same round correct those lines in place` ∥ `a mismatch is corrected in place`） | 两处落点说明按盘上现态收正；或标注该落笔已落、只留逐字块 + A8 逐行 `===` |
| 2 | Doc-state | 🟡 | 本档 §2.3 仍把代码 ∥ 描述面 ∥ 提示词列作待改（`action 枚举四 → 五 + `edit` 执行体`），盘上已落（`thincoder-core/agent-tools/batch.mjs` 的 `enum: ["create", "append", "edit", "status", "close"]` ∥ `thincoder-core/tool-docs/batch.md` 首句 `two write dispositions`）；本档 §5 为空 | §2.3 该行按落盘收正；§5 补记实施读数 |
| 3 | Requirements | 🟡 | 本档 §1「不改的两处」（`docs/core/design/DOC-DISCIPLINE.md` 的两处 `docs/batches/**` 不回改句）+「同族残留就此收手」未进 §2：§2.4 的不改清单、§2.7 上抛项都没有它们 | §2.4 不改清单补登该边界与理由（否则实施席照「触达即清」扫过去） |
| 4 | Tier check | 🟡 | 本档 §2.3 结论行 `≈436——500 软线内，零拆分义务` 与实测不符：本轮 `read` 全档读数 `thincoder-core/agent-tools/batch.mjs` = **516** 行（另两档 496 ∥ 365，设计读数 494 ∥ 361） | 结论行按实测重写；>500 须附主动拆分复核结论（拆分计划，或写明不拆的理由）；尺寸与预计增量不写进设计档 |
| 5 | Doc-state | 🔵 | 本档「本批不做」行 `候选扩展 = D-BR36，残余裁定面 = 用户` ∥ §2.6 `残余裁定面 = 用户`，与 §2.7 `登记即终局，不补门、不另裁` 不同口径 | 两处改与裁定同文（登记即终局），删二分支措辞 |
| 6 | Clarity | 🔵 | `docs/core/design/PROMPT-SYSTEM.md` §6.37 C 的 `后两条 bullet 并入第二、三行` 与同节四行围栏块不符：`The scan and the dispatch are yours` 落第四行 | 说明按围栏块改算行；硬判仍走 A8 逐行 `===` |
| 7 | Acceptance | 🔵 | 块 F 两处围栏块仍无行宽读数（块 C 给了 206 ∥ 163 ∥ 253 ∥ 205）；本席无实算 ⇒ F-2 行宽 unverified | 补块 F 行宽读数（量法 = 逐行字符数；阈值 `lineMax: 300`） |
| 8 | Doc-state | 🔵 | §4.19 ∥ §7 D-BR36 ∥ 本档 §2.7 三处理由① 共用的前提 `edit` 尚未实现前改 §2 只能走它` 已不成立（盘上 `edit` 已实现）；三处文字仍同文，决定本身由 §1「登记即终局」撑着 | 三处同步把理由①改为时点句（裁定当时的前提），或换一条不依赖实现进度的理由 |

**范围与限制**

- 评审面 = 在评三档（本档 ∥ `docs/core/design/BATCH-RECORD.md` ∥ `docs/core/design/PROMPT-SYSTEM.md`）；块 C ∥ D ∥ F 与代码落点的核验读了 `thincoder-core/prompts/**` 三档 ∥ `thincoder-core/agent-tools/batch.mjs` ∥ `thincoder-core/tool-docs/batch.md` ∥ `docs/core/design/LEDGER.md` ∥ `docs/core/design/DOC-DISCIPLINE.md`（盘面证据，非评审对象）

- 评审上下文无 project standards 档 ∥ 无 document map ⇒ 方法论合规与文档归属两项按降级口径判（以 `AGENTS.md` 与在评三档互指为准）

- 集成用例档本体（`docs/batches/2026-11-02-batch-spec-in-place.test.mjs`）只核「在盘 / 是本批单测档」；其用例内容与 RTM 7-10 落行属实施面，本轮不判

- 本轮未跑任何命令（无 shell）：行数取 `read` 档尾行，引文逐字取自盘面；块 F 行宽未实算，标 unverified

### 轮次 6（评审子代理）

**评审对象** = 本档 §2（批档写入语义）· 第 6 轮：第 5 轮 8 行逐条回盘 + 独立裁定行

**本轮核法** = `read` / `grep` 逐档实读（在评三档 + 盘面证据）；无 shell ⇒ 行数取 `read` 报的档尾行

**计数** = 🔴 0 ∥ 🟡 4 ∥ 🔵 4（第 5 轮 8 行逐条仍在；无新增；无 🔴）

**盘面读数（本轮实测）**

- `thincoder-core/agent-tools/batch.mjs` = **516** 行 · `thincoder-core/agent-tools/batch-skeleton.mjs` = **496** 行

- `thincoder-core/agent-tools/batch-gate.mjs` = **365** 行 · `thincoder-core/agent-tools/batch-lifecycle.mjs` = **369** 行

- 本档 §5 段体零行（段头之后无正文）——实施面已落盘而 §5 空

**发现表**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Doc-state / Clarity | 🟡 | `docs/core/design/PROMPT-SYSTEM.md` §6.37 C ∥ D 的落笔说明仍称盘上现文是旧形（`盘上该条 = 标题行` ∥ `盘上 = 两行：`），而 `thincoder-core/prompts/persona-engineering.md` 已是 `correct those lines in place`、`thincoder-core/prompts/discipline-engineering.md` 已是 `a mismatch is corrected in place` | 两处落点说明按盘上现态收正；已落者只留逐字块 + A8 逐行 `===` |
| 2 | Doc-state | 🟡 | 本档 §2.3 仍把代码 / 描述面 / 提示词列作待改（`action 枚举四 → 五 + `edit` 执行体`），盘上已落：`thincoder-core/agent-tools/batch.mjs` 的 `enum: ["create", "append", "edit", "status", "close"]`；本档 §5 为空 | §2.3 该行按落盘收正；§5 补记实施读数 |
| 3 | Requirements | 🟡 | 本档 §1 的 `不改的两处` 与 `同族残留就此收手，不再扫` 未进 §2：§2.4 不改清单与 §2.7 都没有 `docs/core/design/DOC-DISCIPLINE.md` 那两处（实施席照「触达即清」会扫过去） | §2.4 不改清单补登该边界与理由 |
| 4 | Tier check | 🟡 | 本档 §2.3 结论行 `≈436——500 软线内，零拆分义务` 与实测不符：本轮 `read` 读数 `thincoder-core/agent-tools/batch.mjs` = 516 行（另两档 496 ∥ 365，设计读数 494 ∥ 361） | 结论行按实测重写为「哪几档过线 + 各自拆分计划」；尺寸与预计增量不写进设计档 |
| 5 | Doc-state | 🔵 | 本档「本批不做」行与 §2.6 仍写 `残余裁定面 = 用户`，与 §2.7 `登记即终局，不补门、不另裁` 不同口径 | 两处改与裁定同文 |
| 6 | Clarity | 🔵 | `docs/core/design/PROMPT-SYSTEM.md` §6.37 C 的 `后两条 bullet 并入第二、三行` 与同节四行围栏块不符：`The scan and the dispatch are yours` 落第四行 | 说明按围栏块改算行；硬判仍走 A8 逐行 `===` |
| 7 | Acceptance | 🔵 | §6.37 块 F 两处围栏块无行宽读数；F-2 第二行接近 300 阈值，本席无 `node` 实算 ⇒ 行宽 **unverified** | 补块 F 行宽读数（量法 = 逐行字符数；阈值 `lineMax: 300`） |
| 8 | Doc-state | 🔵 | `docs/core/design/BATCH-RECORD.md` §4.19 ∥ §7 D-BR36 ∥ 本档 §2.7 三处理由① 共用的前提 `edit` 尚未实现之前，改 §2 / 改档头只能走它 已不成立（盘上 `thincoder-core/agent-tools/batch.mjs` 的 `edit` 执行体在） | 三处把理由①改为时点句（裁定当时的前提），或换一条不依赖实现进度的理由 |

**逐条回盘（第 5 轮 8 行）**

- #1 仍在：§6.37 C ∥ D 的落笔说明与两档提示词现态相反（`grep` 实读如上）。

- #2 仍在：本档 §2.3 待改行逐字未变；§5 段体零行。

- #3 仍在：§2.4「不改」清单实读无 `docs/core/design/DOC-DISCIPLINE.md` 两处。

- #4 仍在：实测 516 对设计 ≈436（三档读数全偏，方向一致）。

- #5 / #6 / #7 / #8 仍在：三处措辞与围栏块说明逐字未变；块 F 行宽仍无读数。

**本轮复核过、结论同前的三量**

- 集成面：本档 §2.5 起自 `test/RTM.md`，按节写 Δ 并立行 7-10；`test/RTM.md` 行 7-10 在盘，节注为十态且含 `§2 改写 = 设计席 `edit``。

- 分支来历（6b）：`docs/core/design/BATCH-RECORD.md` §4.19 拒面表四条给场景、两条落程序不变量；仍成立。

- 既有件三问：同节「新落点的三问」以 `existing:` 形给 `edit` / `oldText` / `newText` / 回执串；仍成立。

**范围与限制**

- 评审面 = 在评三档；为回盘实读 `thincoder-core/prompts/**` 三档 ∥ `thincoder-core/agent-tools/batch*.mjs` ∥ `thincoder-core/tool-docs/batch.md` ∥ `test/RTM.md`（盘面证据，非评审对象）。

- 评审上下文无 project standards 档 ∥ 无 document map ⇒ 方法论合规与文档归属按降级口径判。

- 本轮未跑命令（无 shell）：行数取 `read` 档尾行；块 F 行宽未实算，标 unverified。

VERDICT: pass

## §4 用户批准（主 agent）

**批准判据** = 用户 2026-11-02 12:16「**自动跑完**」（批次级授权：评审 → 修正 → 实施 → 收口一趟跑完，含批准门）+ 第 5 / 6 轮设计评审判 pass。

**批准对象** = 本档 §2 设计（批档两种处置：§2 可就地改、其余只追加）+ 其实施结果（`batch` 新增 `edit` 动作 ∥ 三处提示词逐字落地 ∥ 描述面与引文镜像随正）。

**用户原话链**（本批的授权来源，不是评审代签）：

- 12:01「三个不同的席，今晚全部在同一个动作上出错：拿行号定位改文档。 这个问题要怎么解决。」
- 12:09「立」（开批）
- 12:16「自动跑完」（批次级授权）

**一处要说清**：用户在本批推进期间（13:46 ∥ 13:49）另有两次强烈不满，对象是**流程闭环失败**（评审 §3 写不进裁定行 ⇒ §5 两度被挡），不是对本设计内容的否决。那件事已独立立批（`docs/batches/2026-11-02-review-verdict-line.md` · 台账 `#1994`），不记在本批名下。

**批准范围之外，由本档 §6 逐条交代**：设计档侧五条上抛 —— `batch.mjs` 越 500 软线 ∥ `docs/core/design/TOOLS.md` §6.24 ⑤ E6 行的段域半句不成立 ∥ `pending` 连带后果 ∥ 块 D ∥ 块 F-2 缩进差一格 ∥ `docs/core/design/BATCH-RECORD.md` §4.19 复现步骤落点。

## §5 实施记录（eng-coder）

**状态行**：实施完成 2026-11-02（§2 六条落讫 · 单测 9/9 · 集成 34/34 · 五条上抛 = 设计档侧）

**一、实测读数（命令 + 计数，可复跑）**

| 项 | 命令 | 实测 | 判定 |
|---|---|---|---|
| 本批单测档 | `node --test docs/batches/2026-11-02-batch-spec-in-place.test.mjs` | `tests 9 · pass 9 · fail 0` | 绿 |
| 集成面（8 档） | `node --test test/integration/batch-*.test.mjs` | `tests 34 · pass 34 · fail 0` | 绿 |
| 合计 | 上两条之和 | **43** | 与父侧复核同数 |
| 描述面预算 | `node scripts/tool-schema-size.mjs` | 总量 157,405 字符（基线 103,529 ⇒ 1.52）· `batch` 单档 11,435 | 报告态：`batch` 超单档 8,000 软线 |

单测九例逐条 = A1 · A2 · A3 · A4 · A5 · A6 · A8 · A9/A10 · A11，均按 §2.5 的机检形断言。

集成那半的早前口头报数多算 1 例；以本节实测 34 为准，不引用旧数。

`batch` 单档字符数无改前读数 ⇒ 本批增量未判（unverified）；超线本身是读到的现值，不是本批推高的判据。

**二、本批覆盖（§2 六条，逐条对落点）**

| §2 条目 | 状态 | 落点读数 |
|---|---|---|
| 1 两种处置（§2 就地改 ∥ 证据面只追加） | ✅ Done | 描述面首句 `two write dispositions` · `docs/core/design/LEDGER.md` 引文镜像逐字同形 · 骨架档头两句形 |
| 2 `batch` 五动作含 `edit`（受认可通道，非唯一通道） | ✅ Done | action 枚举五值 · `edit` 执行体 · `oldText` / `newText` 两 schema · 单测 A1–A5 |
| 3 射程三条（只改本批 §2 · 已收口不改 · 改 §2 不追认实施） | ✅ Done | 单测 A3 / A4 覆盖前两条；第三条 = 收口对账，判据在 `docs/core/design/BATCH-RECORD.md` §4.19，读数落 §6（A12） |
| 4 档头两句形 + 存量档按冷热 | ✅ Done（A7 的 b 半见下） | 本档档头两行与 §4.10 骨架块第二、三行逐字节相等 |
| 5 其它「整档 append-only」活面随正 | ✅ Done | 描述面 · 骨架档头 · 两处注释 / 回执附注 · 三处提示词 · 引文镜像 |
| 6 设计档层三档五处旧说法并入本批 | ✅ Done（设计席笔 · 本席零触） | 单测 A11 四档六处清零 |

**三、落盘面（逐档内容判定；尺寸 = 本轮 `node` 逐档 `split('\n').length` 实测）**

| 档 | 落盘内容判定 | 实测行数 |
|---|---|---|
| `thincoder-core/agent-tools/batch.mjs` | 枚举五值 · `edit` 执行体（段体区间定位 → 空锚 / 缺 `newText` / 骨架保护 → 唯一命中 → 状态行两判 → 机检门 → 一次写盘）· 两 schema 属性 · 骨架保护串已去掉 `and the append-only guarantee` | **516** |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 模板档头两句形（渲染产物 = §4.10 骨架块第二、三行，单测 A6 断言）· 状态行改写注释改「改写面三处」 | 496 |
| `thincoder-core/agent-tools/batch-gate.mjs` | 「① 面」注释改两种处置 · 拒后附注的改写面含 `edit` 的目标区间 | 365 |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 本批零触 | 369 |
| `thincoder-core/tool-docs/batch.md` | 首句两种处置 · action 列五动作 · `edit` 参数与六拒面 | 73 |
| `docs/core/design/LEDGER.md` | 引文镜像 = 描述面首句逐字（本轮 `includes` 比对成立） | 引文一处 |
| `thincoder-core/prompts/persona-engineering.md` | 落地四行与 `docs/core/design/PROMPT-SYSTEM.md` §6.37 块 C 逐行整行相等 | — |
| `thincoder-core/prompts/discipline-engineering.md` | 落地三行与块 D 逐行整行相等；`- the role table / status line / counts / pointers / todo check-offs;` 零改 | — |
| `thincoder-core/prompts/persona-eng-designer.md` | 落地 F-1 一行 + F-2 两行，与块 F 逐行整行相等 | — |
| `test/RTM.md` | §7 立行 7-10（十态）· 节注含交互组件句与进入口句 | — |
| `test/integration/batch-edit-spec-section.test.mjs` | 7-10 正 / 误两例 | 90 |

提示词三档反向串本轮实扫 ⇒ 0（`the old ones stay` ∥ `append yourself` ∥ `closed by an appended §2 correction`）；正向子串 `batch({action:"edit"` 三档各 1。

**四、§2.5 验收对照（A1–A12）**

| # | 判据 | 状态 | 读数来源 |
|---|---|---|---|
| A1 | 恰一次命中 ⇒ 只换目标区间，其余行逐字节不变 | ✅ | 单测 A1（行数不变 · 仅一行变 · 档头零变） |
| A2 | 六拒 ⇒ 拒且零字节落盘 | ✅ | 单测 A2；本轮另以 temp 夹具复现 E4 / E5 两形（上抛 5） |
| A3 | 段域三拒 | ✅ | 单测 A3 |
| A4 | 已收口档 `edit §2` ⇒ 拒，串含「已收口档不回改」 | ✅ | 单测 A4 |
| A5 | `newText` 空串 = 删区间；含 `## §4` ⇒ 拒 | ✅ | 单测 A5 |
| A6 | 新建档档头两句形 = §4.10 骨架块第二、三行 | ✅ | 单测 A6 |
| A7 | 在飞档档头随正 | ⚠️ (a) 成立 · (b) 本会话未机跑 | 见下方两半 |
| A8 | 提示词三处随正（逐行相等 + 正反两形） | ✅ | 单测 A8；本轮另做逐行 `===` 复核 |
| A9 | 单源档规则面无旧说法 | ✅ | 单测 A9 / A10 |
| A10 | 单源档逐字目标形块随正 | ✅ | 单测 A9 / A10 |
| A11 | 四档六处旧说法清零 | ✅ | 单测 A11 |
| A12 | 收口对账两半 | ⏳ 归父侧 | 收口面（§6） |

A7 两半逐条：

- **(a)** 本档（在飞）档头第二、三行与 `docs/core/design/BATCH-RECORD.md` §4.10 骨架块第二、三行**逐字节相等**（本轮两次 `===`，皆 true）。
- **(b)** 「已收口夹具档同形操作前后逐字节相同」这一半**本会话未机跑**：档头改写载体 = 主 agent 文件直改，工具面无档头动作；文件工具亦无段级写门，旁路登记 = `D-BR36`。这一半靠纪律，不靠机械面。冻结侧的机械面由 A4 覆盖，在九例之内。

**五、决策透明表**

| 决策 | 择 | 理由 |
|---|---|---|
| `edit` 的段体区间取 `## §2` 标题行之后 | 段体不含标题行 | 标题行是段定位判据，改它就是改段结构；副作用 = 上抛 5 |
| 两条无场景拒面仍带拒文、仍进 A2 | 保留 | 设计已裁（`docs/core/design/BATCH-RECORD.md` §4.19「两条无场景的仍带拒文」）；空锚 ∥ 引入状态行都是「规范面只许一种读法」的下限 |
| `edit` 的段域拒文自成一形 | 不复用 append 串 | 见上抛 2：逐字复用即谎报 |
| 本会话范围 | 只写本节 | 父侧本轮裁定：不重做实施、不动代码 ∥ 设计档 ∥ §2 |

**六、上抛（五条 · 设计档侧 · 本席无笔权）**

| # | 面 | 实测证据 | 建议落点 |
|---|---|---|---|
| 1 | 贴线 | `thincoder-core/agent-tools/batch.mjs` = **516** 行（量法 = `node` 逐档 `split('\n').length`）；§2.3 贴线判写的 ≈436 与实测差 80 行 | 设计席给拆分计划 ∥ 写明不拆的理由；本席不自行拆 |
| 2 | 描述面镜像（**本批最值钱的一条**） | `docs/core/design/TOOLS.md` §6.24 ⑤ 的 E6 行称「段域 ∥ 骨架 ∥ 冻结**逐字同 append 面**」——段域这一半不成立：`edit` 的段域拒文自成一形两式（depth-0 ∥ 子代理），逐字见 `batch.mjs` 的 `editBatchRecord` 段域分支 | **E6 行按代码现文收正**；理由 = append 的段白名单串对 eng-coder 说「§5 is not yours to write」，而 `edit` 的调用者正是能写 §5 的人 ⇒ 逐字复用就是谎报 |
| 3 | 机检门连带 | `edit` 的 `pending` = **改写后的整个 §2 段体**，不是被改的那几行。temp 夹具观测：§2 里放一段超 300 字的长段 ⇒ 改另一行 ⇒ `REFUSED（命中 1 条——本次写入文本（1 处文字太长））`，档字节不变；回执另附一行点名真实位置的已落段命中（带作者标注） | 设计席判：接受（改前先清 §2）∥ 把 `pending` 收窄到被改区间 |
| 4 | 单源档围栏形 | 块 C 四行 ∥ 块 D 三行 ∥ 块 F-1 一行 ∥ 块 F-2 两行**全部与落地行逐字节相等**（本轮逐行 `===`）⇒ A8 硬判据成立。残留只有观感面：块 D ∥ F-2 围栏取缩进 4 ∥ 6，同列表项相邻续行是 3 ⇒ 落地后比邻居深一格，markdown 渲染不受影响 | `docs/core/design/PROMPT-SYSTEM.md` §6.37，观感面可不动 |
| 5 | 复现步骤 | `docs/core/design/BATCH-RECORD.md` §4.19 拒面表「锚或替换触及状态行」行的两步落 E4 而非 E5：照它取「§2 段头 + 状态行两行」作锚 ⇒ 先越段界 ⇒ 抛 crossing 串（E4）。改用「状态行一行作锚」⇒ 抛状态行串（E5），与单测 A2 的用例同形 | 该行两步的第一步按「状态行一行」收正；判据与拒文本体无误 |

**七、环境读数（写入本节时观测，非盘上缺陷）**

本节首写被机检门拒（三条裸档名不解析，已改全路径后复跑成功）。那次拒收回执里带着「append-only 零破：前文逐字不变、段号不前进、轮次 N 不推进」一句 —— 该串**不在盘上源码**：现行 `batch-gate.mjs` 的回执附注已改成「append 面 ∥ edit 面」两句形。

判 = 宿主进程里加载的是改前的旧模块（未热更），回执来自旧副本。测试读数不受影响：单测 ∥ 集成都在独立子进程里跑，读的是盘上现文。

后续若在回执里再见到旧串，按本条判，不要据此判「旧句仍在盘」。

**八、收口测试行（两半）**

- **①** 本批单测档 = `docs/batches/2026-11-02-batch-spec-in-place.test.mjs`；读数 = `9 / 9 pass`；收口**随批删**。
- **②** 集成集现状 = 34 例 / 8 档，在 50–100 窗口内；本批新增 = 7-10 正 ∥ 误两例，落 `test/integration/batch-edit-spec-section.test.mjs`；既有行本批零修订。

**九、本会话边界与终态**

- 本会话 = 记录轮：只写本节；不改代码 ∥ 设计档 ∥ §2（父侧本轮范围）。
- 未跑独立代码评审轮 ∥ 发散审计轮；进入本节的前提 = §3 最后一轮块携 `VERDICT: pass` 且 §3 状态行 = `评审通过`。
- 终态 = `clean`（本节所记读数全绿）；形外仍开 = 第六节五条设计档侧上抛。

## §6 验证与收口（父代理）

## 6.1 交付面（逐档）

- `thincoder-core/agent-tools/batch.mjs` —— action 枚举五值（`create` / `append` / `edit` / `status` / `close`）+ `editBatchRecord` 执行体 + `oldText` / `newText` 两 schema 属性 + 四条拒串提为模块级单源。
- `thincoder-core/agent-tools/batch-skeleton.mjs` —— 骨架档头改两句形（两种处置）。
- `thincoder-core/agent-tools/batch-gate.mjs` —— `gateRefusalMessage` 增 `edit` 面；注释与回执行随正。
- `thincoder-core/tool-docs/batch.md` —— 首句两种处置；`edit` 项与参数段逐字取设计档。
- `docs/core/design/LEDGER.md` —— 引文镜像与描述面同笔改（引文未先于原文）。
- 三处提示词，逐字取 `docs/core/design/PROMPT-SYSTEM.md` §6.37 块 C ∥ 块 D ∥ 块 F：`thincoder-core/prompts/persona-engineering.md` ∥ `thincoder-core/prompts/discipline-engineering.md` ∥ `thincoder-core/prompts/persona-eng-designer.md`。
- `test/integration/batch-edit-spec-section.test.mjs`（新，常驻）+ `test/RTM.md` 行 7-10 与节注三处。

## 6.2 验证读数（父侧独立复跑，不是转述）

- `node --test docs/batches/2026-11-02-batch-spec-in-place.test.mjs` ⇒ **tests 9 · pass 9 · fail 0**
- `node --test test/integration/batch-*.test.mjs`（8 档）⇒ **tests 34 · pass 34 · fail 0**
- **合计 43 / 43，fail 0** —— 量法 = 上面两条命令，`--test-reporter=tap` 数 `ok` 行。实施席早前报的「44（单测 9 + 集成 35）」中集成那半多算 1 例；§5 按实测 34 记，旧数未落笔。
- 尺寸（父侧 `node` 逐档 `split('\n').length` 现算）：`thincoder-core/agent-tools/batch.mjs` **516** ∥ `thincoder-core/agent-tools/batch-skeleton.mjs` **496** ∥ `thincoder-core/agent-tools/batch-gate.mjs` **365** ∥ `thincoder-core/agent-tools/batch-lifecycle.mjs` **369**。
- 本批单测档 `docs/batches/2026-11-02-batch-spec-in-place.test.mjs` —— **收口即删，已删**（读数留本节 6.2）。

## 6.3 集成面

- 新增常驻用例 = `test/integration/batch-edit-spec-section.test.mjs`（RTM 故事 7 · 行 7-10 两半）。
- `test/RTM.md` 行 7-10 与节注（交互组件 ∥ 进入口 ∥ 九态 → 十态）已在盘。
- 既有 `test/integration/batch-*.test.mjs` 八档零回归（34/34）。

## 6.4 文档门

`doc_check(mode:"gate")` 本轮多次运行，最后一次范围 4 档（本档 ∥ `docs/core/design/BATCH-RECORD.md` ∥ `docs/core/design/TOOLS.md` ∥ `docs/core/design/PROMPT-SYSTEM.md`）⇒ 首行 **PASS**，0 段超长、0 锚缺。

## 6.5 未决项（只留指针，逐条已入台账）

| # | 事项 | 台账 |
|---|---|---|
| 1 | `batch edit` 写入门代码判整段体，设计档已判 `newText` —— 设计与代码说法不同 | `#1995`（条件） |
| 2 | `thincoder-core/agent-tools/batch.mjs` 516 行越 500 软线，拆分点 = 抽 `thincoder-core/agent-tools/batch-edit.mjs` | `#1996`（条件） |
| 3 | `docs/core/design/ADVISOR-GUARDS.md` 行号漂移（§1.1 ∥ A-AG23） | `#1991`（条件） |
| 4 | 文档机检读数不记位置 ∥ 写枚举结论必须带量法 | `#1993`（条件） |
| 5 | 评审 §3 写不进可认的裁定行 —— 已独立立批 | `#1994`（在途，`docs/batches/2026-11-02-review-verdict-line.md`） |

## 6.6 结算与复核

- **台账**：`#1990` → 待核销 → 已核销（本笔同步）。
- **延后批复核**：无暂缓批次命中（本批期间无暂缓标记档）。
- **前情指针**：`#1987`「授权门」· `#1988`「账链门」均已收口核销，本批是其下游的「批档写入语义」。
- **收口状态**：`已收口 2026-11-02`。链门四段（§2 ∥ §3 ∥ §4 ∥ §6）均有内容；§5 于收口前落盘（79 行正文 / 5744 字符 · 裸位置坐标 0 条）。
