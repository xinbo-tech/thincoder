# 2026-10-28 · tier-none-branch
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = `#1907` 收口时登记（§6.4）。用户 2026-10-28 19:32「B」= 路线取全链（设计 → 评审 → 批准 → 实施）。。
> 台账 = #1908（core · 归批）。前情 = 2026-10-28-prompt-readout-purge（已收口 2026-10-28）—— 它收口时留的 🟡，本批收。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

### 1.1 一句话

**两处提示词补上一个分支：全档没有越档文件时，也要给一句结论。**

**这是让实施面回到已批设计的说法，不是新增语义。**

### 1.2 缺陷现场（父侧实读）

**作者面（设计席实际照办的那两处）：**

- `thincoder-core/prompts/persona-eng-designer.md:140`
  「…source/test files + one tier-conclusion line (which files cross a tier, each with a **split plan**); no line counts or expected deltas in the doc」
- `thincoder-core/prompts/advisor-design.md:35`
  「**Neither the size nor an expected delta goes into the design document**: the conclusion does — one line naming which files cross a tier, each with its split plan.」

**评审面（实施面必须与之同源的那一处）：**

- `docs/core/design/ADVISOR-CONVERGENCE.md:362`
  「**两条并列判据**：① **结论在位**；② **表内不出现行数 / 增量数值——出现即报**」
  其中结论的形态含「**或『无一越档』**」这一支。

**需求面：**

- `docs/core/requirements/METHODOLOGY.md:84`（F-R24a 判定句）
  「设计文档受影响文件表列文件名 + 一句表级尺寸档位结论（越档者逐档带拆分计划）…」

### 1.3 病在哪

**两处提示词只写了「越档者带拆分计划」，没写「无一越档也要给一句」。**

**⇒ 全档无越档时，设计席按提示词可以合法地不写那一行；评审按 `docs/core/design/ADVISOR-CONVERGENCE.md:362` 的 ① 判「结论不在位」打回。**

**★ 作者面与评审面不同源 —— 同一个交付物，一边说「不用写」，一边说「不写就红」。**

### 1.4 改法（父侧方向，逐字由设计席定）

**两处各补一个极短分支**，让「无一越档」这一支在作者面成文。

**★ 约束**：补的分支**不得引入新义务** —— 它只是把「结论句恒在位」这一条在作者面说全，不是加一种新交付物。

### 1.5 为什么走全链（用户 19:32「B」）

**改动落在提示词正文（产品面）** —— 那是模型实际读到的运行文本，不是设计档里的描述。

**⇒ 它要过设计 ⇄ 评审 ⇄ 批准，和任何产品面改动一样。**

**★ 父侧曾提议轻通道（缺陷修复类），用户裁全链。此裁定不回改。**

### 1.6 边界（不做）

- **不动 `docs/core/design/ADVISOR-CONVERGENCE.md`**（评审面的判据是对的，改的是作者面）
- **不动 `docs/core/requirements/METHODOLOGY.md`**（需求面的判定句已含「表级一句」，方向对）
- **不改任何档位数值**（`>300` / `>500` / `>800` 一字不动）
- **不动 `#1907` 落下的其它提示词改动**
- **不做批 A（`#1912`）那四件** —— 面不同

### 1.7 补正两处（父侧笔误 + 设计席知会核实）

**① `§1.2` 的小标题「作者面」写错了 —— 两处不是同一个面。**

- `thincoder-core/prompts/persona-eng-designer.md:140` = **作者面**（设计席照办的那份提示词）
- `thincoder-core/prompts/advisor-design.md:35` = **评审面**（评审照办的那份提示词）

**§1.2 把两处合在「作者面」标题下，是父侧的笔误。** 两处仍然都要改（同一缺陷各在一面），**但面别要写对** —— 否则后面判「两面是否同源」时，前提就是错的。

**② 设计席知会 ③ 说「批次档面已含无越档形」——半对，父侧实读如下。**

| 处 | 现文要点 | 含无越档支？ |
|---|---|---|
| `docs/core/design/DOC-DISCIPLINE.md:266` | 「…表级一句结论（越档者逐档带拆分计划）」 | **无条件要求结论句**，但**未点名**无越档支 |
| `docs/core/design/DOC-DISCIPLINE.md:268` | 「…列文件名 + 表级一句尺寸档位结论（越档者逐档带拆分计划）」 | 同上 |
| `docs/core/design/DOC-DISCIPLINE.md:318` | 「…尺寸档位结论（表级一句）：本节无源 / 测试档可判 ⇒ 无越档」 | **是实例，不是判据** |
| `docs/core/design/ADVISOR-CONVERGENCE.md:362` | 「…结论在位…或『无一越档』」 | **明确点名** |

**⇒ 精确的缺陷陈述是**：**四层里只有两处提示词的措辞预设了「存在越档文件」**（`which files cross a tier`）；其余三层要么明确点名（见上表第四行），要么无条件要求「一句表级结论」（见上表前两行）。

**所以本批只改两处提示词是对的，不动 `docs/core/design/DOC-DISCIPLINE.md` 也对** —— 它要求的那个「一句结论」本来就是无条件的。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（两处提示词各补一支「无一越档」；两面共用锚词 none crosses，各按各的口吻；不新建设计档；验收 A1–A6）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.0 一句话与轮次

**轮次** = initial（设计轮，零实施）。**面** = 产品码面（提示词正文 = 产品文本，模型实际读到的运行文本），实现归 eng-coder + designToken。**坐标口径** = 仓根相对（仓根 = 仓库 `thincoder`），行号 = 2026-10-28 现盘实读。

**本批 = 给两处提示词补上「无一越档」这一支**：尺寸档位结论句恒在位，无越档时它写「无一越档」。

**这不是新语义**：评审面判据早已含该支——`docs/core/design/ADVISOR-CONVERGENCE.md:362` 写「（『表内 M 个源 / 测试档，越档者：X（拆分计划见下）』或『无一越档』；越档者逐档带各自拆分计划）」。缺的只是作者面与评审实施面的成文。

**缺陷读数为证**（本席现测）：`thincoder-core/prompts/**` 扫 `none crosses|无一越档` = **0 命中** ⇒ 两支都不在提示词面。

### 2.1 覆盖条目（回指 F-R24a · 现文 ∥ 改后逐字）

**需求锚**：`docs/core/requirements/METHODOLOGY.md:84`（F-R24a）——「设计文档受影响文件表列文件名 + 一句表级尺寸档位结论（越档者逐档带拆分计划）…」。本批不改需求档，只让两处提示词与它同源。

**① 作者面 · 设计席照办的那一行**：`thincoder-core/prompts/persona-eng-designer.md:140`

现文（**173** 字符，现量）：

```text
3. **Affected-file list** — source/test files + one tier-conclusion line (which files cross a tier, each with a **split plan**); no line counts or expected deltas in the doc
```

改后（**195** 字符，现量）：

```text
3. **Affected-file list** — source/test files + one tier-conclusion line (which files cross a tier, each with a **split plan**, or that none crosses); no line counts or expected deltas in the doc
```

**增量 = `, or that none crosses`（19 字符）· 零删改**。

**② 评审实施面 · 评审核对的那一行**：`thincoder-core/prompts/advisor-design.md:35`

现文（**166** 字符，现量）：

```text
   **Neither the size nor an expected delta goes into the design document**: the conclusion does — one line naming which files cross a tier, each with its split plan.
```

改后（**196** 字符，现量）：

```text
   **Neither the size nor an expected delta goes into the design document**: the conclusion does — one line naming which files cross a tier, each with its split plan, or stating that none crosses.
```

**增量 = `, or stating that none crosses`（30 字符）· 零删改**。行首 3 空格缩进保留（第 8 条续行形）。

### 2.2 为什么这个形不会被读成新义务（派工问题 ①）

**受管的名词只有一个**：「one tier-conclusion line」（作者面）∥「one line」（评审面）。补的那支挂在同一括注里、用 `or` 并列——它是**这一行的第二种内容**，不是第二个交付物。交付物计数不变 = 1。

**形上排除三个读成「又一件」的可能**：

- **不另起一句**：不写「If no file crosses a tier, say so.」——独立句自带祈使语气，读起来是第二条义务，还引入一次额外的条件判断（模型要多走一遍表）。
- **不加「is required」**：被动式义务句让主语悬空，且明写「必须」= 把恒在位说成新门槛。
- **不动 `each with a **split plan**` 的加粗**：加粗仍是越档者的那一件，新支是普通体 ⇒ 视觉上「主形 + 备选」，不是「两件并列」。

**锚词 = `none crosses`**：它是设计层既有「无一越档」的直译，跨面靠一个词对得上（`docs/core/design/ADVISOR-CONVERGENCE.md:362` 的「或『无一越档』」）。

### 2.3 两面措辞同形还是各按口吻（派工问题 ②）

**判**：**共用受管名词 + 共用锚词 `none crosses`，句子各按各的口吻。** 不追求整句同形。

**理由三条**：

1. **两句不是同一类句子**：① 是规格项（表里装什么内容），② 是评审判据（评审核什么）。整句同形必有一边语法变扭，或丢掉那一面自己的职能（② 的「the conclusion does」承载「数不落档、结论落档」这一对照，删不得）。
2. **两面不共处一个上下文**：① 只进设计席的装配体，② 只进评审装配体。读者永远不会把两行并排读 ⇒ 整句同形换不来阅读收益，只换来维护成本（一边改词就得连带另一边）。
3. **可核性由锚词承担**：单测 / 复核只需一个词 `none crosses`（加设计层中文锚「无一越档」），就能判两面同源。这比逐字同形更耐改。

### 2.4 设计档落点：无（决定 + 理由）

**本批不新建、不修订任何设计档 / 需求档。**

- **该机制的权威面已在位且本批零改**：评审判据与结论形态 = `docs/core/design/ADVISOR-CONVERGENCE.md:362`；批次档面形态 = `docs/core/design/DOC-DISCIPLINE.md:266` ∥ `:268`，其本节自适用句 `:318` 已写「无源 / 测试档可判 ⇒ 无越档、无拆分计划」——**无越档形在设计层已成文**。
- **为已有归属的机制节新开一份设计档 = 分片**（一主题一属主档）：缺口只在提示词正文（产品文本，由 eng-coder 落笔），设计档里没有可改的句子。
- **9 项设计内容由本段承载**：本段即本批设计载面（先例 = 同仓 `#1907` 的提示词面部分，设计内容也在批档 §2 成文）。

### 2.5 受影响文件与尺寸档位结论

| 档 | 面 | 改动点 | 尺寸档位 |
|---|---|---|---|
| `thincoder-core/prompts/persona-eng-designer.md` | 提示词面（产品码面） | `:140` 行内补 19 字符 | `.md` ⇒ 零尺寸档位义务 |
| `thincoder-core/prompts/advisor-design.md` | 提示词面（产品码面） | `:35` 行内补 30 字符 | `.md` ⇒ 零尺寸档位义务 |

**尺寸档位结论（表级一句）**：表内 2 档全为 `.md`，无源 / 测试档、无函数可判 ⇒ **无一越档，无拆分计划在册**。

**本批自身即该支的实例**：全 `.md` 表不写这一句，重演的就是 §1.3 那个病 ⇒ 本行是本批要补的那一支的落地示范。

### 2.6 关键决策（决定 + 一句理由；被否形一并记）

**KD-1 · 取「同一行内 `or` 支」，不取独立句。** 交付物计数不变 = 不得引入新义务（派工约束 2）；独立句会被读成第二条义务。

**KD-2 · 两面共用锚词、不共整句。** 见 2.3；被否的整句同形在 2.3 第 1 条上不成立（两部分职能不同）。

**KD-3 · 不新建设计档、不改需求档。** 见 2.4；被否的「新开一份 TIER-NONE 设计档」= 同一机制两个属主。

**KD-4 · 不设单元测试档。** 可断言面是散文，断言散文违反测试纪律（红于一次措辞微调、证不出行为）；验收改由 2.7 的现跑读数承担，收口不留可执行档。

### 2.7 验收对照（每条可跑 · 回指 2.1 的覆盖条目）

**A1 · 逐字对位（2/2）**：两行与 2.1 的「改后」块逐字相等。做法 = `node` utf8 行扫 substring 断言，命中须 = 2。

**A2 · 提示词面行宽（零超 300）**：两档逐行字符数 ≤ 300；新增两行为 **195** ∥ **196**（现量）。做法 = 行扫 `^.{301,}$`，命中须 = 0。

**A3 · 未触面零改**：`git diff --stat -- thincoder-core/prompts/` = **恰 2 档**、块数 = 2，块外零改。

**A4 · 档位数值与既有半句零改**：`thincoder-core/prompts/advisor-design.md` 第 8 条的档位三行（`>500 lines → proactive split review` ∥ `>800 lines → must split` ∥ `300+ line single function`）逐字仍在；作者面 `no line counts or expected deltas in the doc` 逐字仍在。做法 = 4 条 substring，命中各 ≥1。

**A5 · 边界零触**：`git diff --stat -- docs/core/design/ docs/core/requirements/` 为空（`.md` 档零越档义务，且需求 / 设计面按 §1.6 不动）。

**A6 · 交付门**：`doc_check(mode:"gate")`，清单 = 本笔两档提示词 ⇒ 首行 `DOC-CHECK GATE: PASS`。

**回指**：A1 / A3 验「结论句恒在位」在作者面成文（F-R24a 判定句的那一侧）· A4 验「只补一支、不动数值」· A5 验边界 · A2 / A6 验交付门。

### 2.8 用例表（这一支上线后的行为）

| 类 | 输入（受影响文件表的内容） | 期望输出（结论句） |
|---|---|---|
| 正常 | 含 1 个越档源档 | 「越档者：X（拆分计划见下）」 |
| 边界 | 有源 / 测试档、无一越档 | 「无一越档」 |
| 边界 | 全 `.md` 或无源 / 测试档 | 「无一越档」（本批 2.5 即此例） |
| 错误（反证） | 无越档却不写结论行 | 评审按 `docs/core/design/ADVISOR-CONVERGENCE.md:362` ①「结论在位」判不在位 |

### 2.9 边界（本批不做）

- 不动 `docs/core/design/ADVISOR-CONVERGENCE.md`（评审判据是对的，且已含「无一越档」）。
- 不动 `docs/core/requirements/METHODOLOGY.md`（F-R24a 判定句方向已对）。
- 不改任何档位数值（`>300` / `>500` / `>800` 一字不动）。
- 不动 `#1907` 落下的其它提示词改动（`thincoder-core/prompts/persona-eng-designer.md:91` ∥ `:87` 与第 8 条其余六行）。
- 不新增义务、新交付物、新检查器；不写修订式旧句（旧文由替换直接消失）。

### 2.10 RTM delta（读 `test/RTM.md` 后答）

**实读**：`test/RTM.md` 的 CLI 端各节「一行 = 一个集成用例」，行断言全为**运行时业务结果**（实读故事 1–3；其余节未逐行读 ⇒ 余量 `unverified`）；集成用例只登 `test/integration/**`。

- **破行 = 0**：无一行断言提示词正文或设计档文本。
- **冗余 = 0**：无一行因本批失去意义。
- **缺失 = 0**：本批改的是模型读到的散文，没有用户可进入的业务入口可供机器断言；集成用例只从两个入口长出（产品真需要的业务场景 / 生产真发生过的问题），两者皆无 ⇒ 不立行。

### 2.11 上抛与知会

**[知会·父侧] ① §1 的两面归类与派工口径不一致**：§1.2 把 `thincoder-core/prompts/advisor-design.md:35` 列在「作者面（设计席实际照办的那两处）」，而 19:32 派工称其为「评审面（评审核对）」。两种说法指向同一行、同一处补丁，本设计按「两面各补一支」落，不改语义。§1 是主 agent 笔，本席不改。

**[知会·父侧] ② 派工写域清单的绝对路径不在盘**：清单把两档放在工作区根下的 `thincoder-core/prompts/`；实盘位置在仓根（`thincoder`）内的同一相对路径，即 `thincoder-core/prompts/persona-eng-designer.md` ∥ `thincoder-core/prompts/advisor-design.md`。§1 的仓根相对坐标是对的；eng-coder 落笔须用仓根相对坐标。

**[知会·父侧] ③ 评审实施面并非全缺**：`docs/core/design/ADVISOR-CONVERGENCE.md:362` 与 `docs/core/design/DOC-DISCIPLINE.md:318` 都已含无越档形；缺的只是两处提示词（本批补）。

**[知会·父侧] ④ 命名照既有**：全段用「尺寸档位结论」（`#1907` 定名），未另起新名。

### 2.12 自查更正（字符计数 · 原行不改）

**2.1 ① 与 2.5 表首行的「19 字符」错，实为 22 字符。**

**现量**（`node` 直读两档，utf8）：

- `thincoder-core/prompts/persona-eng-designer.md:140` 现长 **173**；补串 `, or that none crosses` = **22** 字符 ⇒ 改后 **195**。**原「19」是纸上估的，不是量的。**
- `thincoder-core/prompts/advisor-design.md:35` 现长 **166**；补串 `, or stating that none crosses` = **30** 字符 ⇒ 改后 **196**（这一处原本就对）。

**另两读**：本席引的「现文」两行与盘上逐字相等（`===` 判 = true ∥ true）⇒ 2.1 的现文块可直接作改前基线。

**结论不变**：增量只加不删、两行改后均 ≤300（195 ∥ 196），A1–A6 判据一字不动。

### 2.13 交付门读数（本席现跑）

- `doc_check(mode:"gate")` · 清单 = 本批档 ⇒ 首行 `DOC-CHECK GATE: PASS`，0 段命中。
- `doc_check(mode:"report")` · 清单 = 两档提示词 ⇒ 命中 **0** 条（锚 0 · 段 0 · 行 0）⇒ 现盘两档无超宽行、无悬空锚；补后最长行 196，仍远低于 300。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

**设计评审 · 首轮** · 对象 = 本档 §2 设计（两处提示词补「无一越档」支）· 判据核心 = 补的那一支只把话说全、不加新义务。

**核心判据核对（通过）**：受管名词仍为 1，补串挂在同一括注内以 `or` 并列，两处增量均标「零删改」（§2.1）。评审面判据本已要求结论句恒在位 —— `docs/core/design/ADVISOR-CONVERGENCE.md:362` ①「结论在位」并点名「无一越档」形；故补支只把作者面说全，交付物计数不变。

**尺寸档位判据**：表内 2 档全为 `.md`（§2.5），无源 / 测试档、无函数可判 ⇒ 尺寸档位判据（含函数档第一判据）无待判对象；表级一句结论在位（§2.5）。本席自量改后行宽 195 / 196 ≤ 300。

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 勘察证据行 | 🟡 | §2 无「勘察证据」行（查过哪些公共源文档 ∥ 有无相关）；同形先例见 `docs/core/design/ADVISOR-CONVERGENCE.md:450` | 补一行：声明源（`index.publicRepos` 读数）+ 树内所查档（需求 / 设计两档）+「有 / 无相关」，无相关亦照记 |
| 2 | 同类先例 | 🟡 | §2 无「同类先例」行（实现坐标 ∥ 设计档对应节 ∥ 先例批 + 对齐 ∥ 偏离理由）；§2.4 只把 `#1907` 作「设计内容住批档 §2」的先例，未勘本次补支的措辞形先例 | 按 `docs/core/design/ADVISOR-CONVERGENCE.md:449` 的成形补一行（先例 = 本档 §16 ∥ §17 的「权威链引块 + 提示词逐字建议」形）；偏离须显式 |
| 3 | 集成测试设计 | 🟡 | §2.10 立「破行 0 / 冗余 0」却只「实读故事 1–3；其余节未逐行读」——全档读数未成立 | 读完 RTM 其余各节（或逐节点名）后再给三条 0 读数；「无变化 + 理由」本身可取 |
| 4 | 需求覆盖 | 🟡 | §2.0 只扫锚词（`none crosses｜无一越档` = 0 命中），未扫措辞族（`which files cross a tier` / `tier-conclusion line`）⇒ 未排除第三处提示词面同款预设 | 补一次措辞族扫描并登记命中清单，证「只有两处」 |
| 5 | 分支出处 | 🔵 | 该支有场景（本批 §2.5 全 `.md` 表即实例 + §2.0 的 0 命中读数），但无打回记录 / 复现命令佐证 | 若能引一条评审打回记录或复现路径，出处更硬；无则照现状也可过 |
| 6 | 既有件核查 | 🔵 | 锚词 `none crosses` 的来源以散文给出（§2.2 指设计层「无一越档」），未落 `existing: …` 三问形 | §2.2 或 §2.11 补一行 `existing: 无一越档 @ docs/core/design/ADVISOR-CONVERGENCE.md:362` |
| 7 | 引用保真 | 🔵 | §2.0 引 `:362` 时把源文的「」写成『』—— 引块非逐字子串 | 引文按源文引号逐字回抄，便于机核 |
| 8 | 数字漂移 | 🔵 | §2.1 / §2.5 写「19 字符」，§2.12 自更正为 22；append-only 下前行不可改，A1–A6 不依赖该数 | 无需改；后续引用一律取 §2.12 的 22 |

**计数**：🔴 0 · 🟡 4 · 🔵 4。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**状态行**：已批准 2026-10-28

### 4.1 批准依据（用户原话 · 逐字）

- **「B」**（2026-10-28 19:32）—— 本批路线取**全链**（设计 → 评审 → 批准 → 实施）。此前父侧提议轻通道（缺陷修复类），用户裁全链。
- **「做错没关系，重要的是找出机制上的问题，解决以后的问题。」**（同日 19:37）—— 同一轮里对「机制缺口要写进提示词」的总要求。

### 4.2 批准范围

两处提示词各补一支「无一越档」：`thincoder-core/prompts/persona-eng-designer.md:140` ∥ `thincoder-core/prompts/advisor-design.md:35`。

### 4.3 明确不在本批

`docs/core/design/ADVISOR-CONVERGENCE.md`（评审面判据已对，一字不动）· `docs/core/requirements/METHODOLOGY.md`（需求面已含「表级一句」）· 任何档位数值 · `#1912`（判据写法四件）· `#1915`（批档↔台账）。

## §5 实施记录（eng-coder）

### 5.1 一句话与终局

**两处提示词按 §2.1 的「改后」块逐字落盘**：作者面 `thincoder-core/prompts/persona-eng-designer.md:140`、评审实施面 `thincoder-core/prompts/advisor-design.md:35`，各为一行内插入，零删改、行数不变。

**终局 = clean**：内部偏差审计 1 轮（零偏差）· 内部代码评审 1 轮（VERDICT pass，🔴0 · 🟡1 协调项 · 🔵2）· 自纠轮 0（无 must-fix 项）。

### 5.2 改前 / 改后逐字（现盘实测，非引述）

**① `thincoder-core/prompts/persona-eng-designer.md:140`** — 改前 173 字符：

```text
3. **Affected-file list** — source/test files + one tier-conclusion line (which files cross a tier, each with a **split plan**); no line counts or expected deltas in the doc
```

改后 195 字符（增量 `, or that none crosses` = 22 字符）：

```text
3. **Affected-file list** — source/test files + one tier-conclusion line (which files cross a tier, each with a **split plan**, or that none crosses); no line counts or expected deltas in the doc
```

**② `thincoder-core/prompts/advisor-design.md:35`** — 改前 166 字符：

```text
   **Neither the size nor an expected delta goes into the design document**: the conclusion does — one line naming which files cross a tier, each with its split plan.
```

改后 196 字符（增量 `, or stating that none crosses` = 30 字符；行首 3 空格续行缩进保留）：

```text
   **Neither the size nor an expected delta goes into the design document**: the conclusion does — one line naming which files cross a tier, each with its split plan, or stating that none crosses.
```

### 5.3 验收读数（A1–A6 · 命令 + 结果）

| 判据 | 做法 | 结果 |
|---|---|---|
| A1 逐字对位 | node utf8 行读，与 §2.1 两「改后」块 `===` 比对 | true ∥ true ⇒ **命中 2/2** |
| A2 行宽零超 300 | 两档 `^.{301,}$` 行扫 | **0 命中**（两档最长 298 ∥ 290；新行 195 ∥ 196） |
| A3 未触面零改 | `git diff --stat -- thincoder-core/prompts/` | **恰 2 档**（2 files changed, 2 insertions(+), 2 deletions(-)） |
| A4 数值与半句零改 | 4 条 substring | 全命中：`>500 lines → proactive split review` ∥ `>800 lines → must split`（`thincoder-core/prompts/advisor-design.md:37`）· `300+ line single function`（`:38`）· `no line counts or expected deltas in the doc`（`thincoder-core/prompts/persona-eng-designer.md:140`） |
| A5 边界零触 | `git diff --stat -- docs/core/design/ docs/core/requirements/` | `docs/core/requirements/` 干净；`docs/core/design/` **返非空，非本笔**（见 5.4） |
| A6 交付门 | `doc_check(mode:"gate")` 清单 = 本笔两档 | 首行 **DOC-CHECK GATE: PASS**（2 档全清，0 段命中） |

### 5.4 决策披露（含一条不达字面判据的读数）

**① A5 按字面不成立，但不是本笔改动。** `docs/core/design/DOC-DISCIPLINE.md` 与 `docs/core/design/CORE-UNIFICATION.md` 带未提交改动，mtime 分别为 19:39:02 ∥ 19:34:31；本会话起于 19:39:44，两处提示词写入于 19:39:58。

**本笔只写过两个提示词路径**（一次批量替换、2 个 entry）；`docs/core/**` 全程零写入。旁证 = 新增内容 `none crosses` 在两目录 grep **0 命中**。

**② 无偏离、无简化**：两处增量均为纯插入，`each with a **split plan**` 的加粗未动、越档支措辞未动、档位三行未动。

**③ 未做 KD-4 之外的动作**：不设单元测试档（判定散文的断言红于一次措辞微调、证不出行为），验收由 5.3 的现跑读数承担，收口不留可执行档。

### 5.5 边界核对（§2.9 逐项）

- 档位数值一字未动（`>300` / `>500` / `>800` 全在位，见 A4）。
- `#1907` 落下的其它行未动：`thincoder-core/prompts/persona-eng-designer.md:87` ∥ `:91`、`thincoder-core/prompts/advisor-design.md` 第 8 条其余行均在位。
- 未引入修订式措辞：两档 `previously` / `~~` 仅命中 2 处，均为「禁止修订式」条文本身（`thincoder-core/prompts/persona-eng-designer.md:51`、`thincoder-core/prompts/advisor-design.md:127`），非本笔引入。
- 未触 `docs/core/design/**`、`docs/core/requirements/**`（见 5.4 ①）。

### 5.6 测试与集成读数

**单元测试档 = 无**（KD-4：本笔可断言面是散文，断言散文违反测试纪律）。验收读数 = 5.3 的 A1–A6，收口不留可执行档。

**集成用例 = 0 行**：本笔改的是模型读到的散文，没有用户可进入的业务入口可供机器断言；集成用例只从两个入口长出（产品真需要的业务场景 / 生产真发生过的问题），两者皆无。RTM delta 见 §2.10。

**未做集成测试验证** —— 集成面的唯一一次运行是父侧收口那一次。

### 5.7 审计与评审轮次

| 轮 | 通道 | 结论 |
|---|---|---|
| 1 | 内部偏差审计（explore，只读） | **clean / no divergence**：A1 ∥ A2 ∥ A4 由其自量成立；A3 ∥ A5 ∥ A6 其装配无对应工具未复跑，已逐条标明 |
| 2 | 内部代码评审（advisor，type=code） | **VERDICT pass**：🔴 0 · 🟡 1（批档 §5 段为空 = 本轮写入前状态，即本段）· 🔵 2（A3/A5 全树判据在并发轮下会飘红 · 两面措辞非语法同形，KD-2 已载） |

### 5.8 上抛（父侧裁量，非本席笔）

**[知会·父侧] A3 / A5 是工作树全局判据，不是相对判据。** 他轮一写同域目录，判据即飘红而本笔其实零触（本笔已实遇：A5 返非空）。

**改法建议**（评审席同判）：把「未触面零改」改为开工前两目录 sha 基线 + 收口时同集合比对 + 差异逐档归因，或按 `git diff -U0` 的档名集合判「本笔两档外 hunk 数 = 0」。

**本席不改 §2** —— 判据是设计席的笔。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

**状态行**：已收口 2026-10-28

### 6.1 交付事实

| 档 | 改前 | 改后 | 增量 |
|---|---|---|---|
| `thincoder-core/prompts/persona-eng-designer.md:140` | 173 字符 | **195** | `, or that none crosses`（22） |
| `thincoder-core/prompts/advisor-design.md:35` | 166 字符 | **196** | `, or stating that none crosses`（30） |

**整行内插入，零删改，行数不变。**

### 6.2 父侧独立复核（不采信报告 · 全部自跑）

```
persona:140  长 195 · 含 `, or that none crosses`                 ✓
advisor:35   长 196 · 含 `, or stating that none crosses`          ✓
git diff --stat -- thincoder-core/prompts/  = 2 files, 2 insertions(+), 2 deletions(-)  ✓
```

**⇒ 与设计 §2.1 的两处「改后」块逐字相等。**

### 6.3 一处判据毛病（实施席上抛，父侧采认）

**A5「`docs/core/**` 零 diff」是工作树全局判据，不是相对判据。**

**现场**：本批实施期间，`docs/core/design/DOC-DISCIPLINE.md` 与 `docs/core/design/CORE-UNIFICATION.md` 带着**另外两批**（`#1912` ∥ `#1915`）的在途改动 ⇒ A5 字面判据飘红，而本笔对 `docs/core/**` **零写入**。

**★ 根因**：**并行批次下，「某目录零 diff」这类判据必然被同域的在途改动污染。** 本会话同时在跑三本批档，这个形状会反复出现。

**处置**：本批以「本笔只写过两个提示词路径 + `none crosses` 在两目录 grep = 0」为其零触佐证，**不按 A5 字面判红**；判据改法另登台账（`#1916`）。

### 6.4 集成测试面

**本批零可执行面**（纯 `.md` 提示词文本）。RTM 读数：5 端节 / 21 故事节 / 74 表行；**破行 0 · 冗余 0 · 缺失 0** —— 父侧已独立核过：74 个编号表行中提到「提示词 / 设计档」的仅 1 行，且是 `prompt / max_tokens not sent` 的 token 计数，不是提示词正文 ⇒ **无一行断言提示词文本**。

### 6.5 未收项（指向台账）

- `#1916`：验收判据「某目录零 diff」在并行批次下被同域在途改动污染 ⇒ 需改成「开工前基线与收口同集合比对 + 逐档归因」
- 设计席两条建议未补（勘察证据行 · 同类先例行）—— **自知差距**：本批设计面是两个半句，为补形式行再走一轮设计席收益小于成本；信息在 §1.2 / §1.7 与父侧扫描读数里

### 6.6 收口判据

- chain：§1 · §2 · §3（评审通过）· §4 · §6 全在
- 交付门 `DOC-CHECK GATE: PASS` · 两处逐字与设计相符 · diff 恰 2 档
- 台账：`#1908` 转已核销
