# 2026-11-01 · ledger-contract-five-faces
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 11:31 逐字「四 台账契约层也处理掉。」—— 承接 `#1917` `#1918` `#1919` `#1884` `#1885` 五条（全部 `#1915` 批系滚出的契约面欠账，父侧 triage 时归为一组）。五条的共同判据：**同一份台账契约，五个面各说各的** —— 设计档 §2.4 表 ∥ 工具描述枚举 ∥ 收口回执文案 ∥ §3 状态门 ∥ 需求层条目。。
> 台账 = #1917（ENGINEERING-MODE · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与结论（主 agent）

**覆盖账 = #1917 #1884 #1885 #1918 #1919**

### 1.1 这批要治的病（一句话）

**同一份台账契约，五个面各说各的。**

`#1915`（台账账本基数）落了「认领即承诺」「点火直跳 `在途`」「一本批档的账 = 指回本档的行集」三条口径，**但只落了它自己动过的那些面**。**同一份契约余下的五个面仍停在旧口径上** ⇒ **模型读到哪一面，就按哪一面的做法办。**

### 1.2 五条与它各自的病灶（父侧逐条实读，非引用台账转述）

| # | 面 | 病灶（现读） |
|---|---|---|
| `#1917` | 收口回执文案 | `thincoder-core/agent-tools/batch-closeout.mjs:133` 逐字仍写「做完的请在收口前 update → 待核销，**没做完的 update → 条件 / 已废弃**」—— 而 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:188` 已定「**没有第三种** —— 退回 `待讨论`、转 `条件` 等下一批都不是认领行的出路」 |
| `#1918` | 设计档 §2.4 两张表 | 建档表 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:124`–`:131` **无 `待核销` 一行**（末行只到 `已核销` / `已废弃` ⇒ `R-C3`）；而逐行处置表 `:185` 断言「`create` 对 `待核销` 号同拒」。另 `:186` 的「重新开账」未写明 = 另立新行，与 `:167` 铁律「本档不新开第二条台账行」边界未划死 |
| `#1919` | 工具描述枚举 | `thincoder-core/tool-docs/ledger.md:3` 写「`待讨论→待设计` / `待设计→在途` / `在途→待核销` / `待核销→已核销` / 任意态→`已废弃`；表外拒」，**缺两条实边**：`待讨论 → 在途` · `待核销 → 在途`（`thincoder-core/ledger-db.mjs:163`–`:166` 实读 `ALLOWED_MIGRATIONS` 两条都在）。而 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:190`「点火直跳 `在途`，不过 `待设计`」教的正是那条描述里不存在的边 |
| `#1884` | §3 状态门 | 打回重置（`thincoder-core/agent-tools/batch-skeleton.mjs` `statusResetPlan`）触发条件 = ① 本笔写 §3 ∧ ② 正文命中打回裁定行。**评审写 §3 却不给任何裁定行** ⇒ 上一轮 `评审通过` 仍是字面 ⇒ §5 门照旧放行 |
| `#1885` | 需求层 | 「一本批档只服务一个并发 spawn」的**机制在盘三层**（`thincoder-core/agent-tools/subagent-spawn.mjs:236` 拒发 ∥ 判据单源 `subagent-scheduler.mjs:194` ∥ 设计 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.58 ∥ 集成 `test/RTM.md:242` 结果 = 通过），**只缺需求档那一条**（回填） |

### 1.3 为什么合成一批

**同一个交付目标**（台账契约五面一致）、**同一组文件域**（`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` ∥ `thincoder-core/tool-docs/ledger.md` ∥ `thincoder-core/agent-tools/batch-closeout.mjs` ∥ `batch-skeleton.mjs` ∥ `docs/core/requirements/AGENT-LOOP.md`）、**同一套评审面**。

**拆开做会各判一次、各审一次，而结论互相依赖** —— 比如 `#1918` 补的那行怎么写，取决于 `#1919` 的枚举补完之后的表形。

### 1.4 射程边界（先写死，设计席据此不越界）

- **不改状态机行为**：`ALLOWED_MIGRATIONS` 已在盘且正确，`#1919` 只补**描述面**。
- **不改 `#1915` 已落的口径**：§2.4 主线五句（认领即承诺 ∥ 点火直跳 ∥ 行集判据 ∥ 覆盖账行 ∥ 唯一撤回场合）**逐字不动**，本批只在它们旁边补缺口。
- **`#1884` 可能判「不做」**：若找不到能区分「补记说明」与「隐性打回」的**结构信号**，就按 `docs/core/design/ADVISOR-GUARDS.md:103` 已登记的口径维持现状，**把理由写进设计档而不是硬做一个猜意图的分支**。**这一条是本批唯一允许「不做」的项**，其余四条必须落。
- **需求档 §1.4 边界不变**：`#1885` 只补一条需求条目，不重写 `docs/core/requirements/AGENT-LOOP.md` 的既有条目。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-11-01

### 2.0 这批治什么（一句话）

同一份台账契约，五个面各说各的：模型读到哪一面，就按哪一面的做法办。本批把五面收到同一句上。

| # | 条目 | 病灶（本轮实读） | 处置 | 落点 |
|---|---|---|---|---|
| ① | `#1917` 收口回执文案 | `thincoder-core/agent-tools/batch-closeout.mjs:133` 仍写「没做完的 update → 条件 / 已废弃」 | 建议句按类分流，贴到它管的那一行上 | 产品码 + 设计档 §2.11 |
| ② | `#1918` 建档表 `待核销` 行 | 设计档 §2.4 建档表无该行；同节逐行处置表却断言 `create` 同拒 | 另立 `R-C4` + 拒文第四条；「重新开账」写明 = 另立新行 | 设计档 §2.4 |
| ③ | `#1919` 工具描述枚举 | `thincoder-core/tool-docs/ledger.md:3` 缺 `待讨论→在途` · `待核销→在途` | 逐边写全，两条边各带一句用途 | 产品码 + 设计档 §2.8 |
| ④ | `#1884` §3 状态门 | `statusResetPlan` 要裁定行才重置；不带裁定的那一笔 ⇒ 上一轮 `评审通过` 留字面 ⇒ `§5` 放行 | **做**，走拒面：`§5` 门加判据 2 | 产品码 + 设计档 §2.5 / §2.6 + `docs/core/design/ADVISOR-GUARDS.md` §1.2 |
| ⑤ | `#1885` 需求层 | `docs/core/requirements/AGENT-LOOP.md` 原无对应条目；而机制层早已在盘（本席首轮漏查，见 §2.1-⑤） | §4.19 回填已落，F-BR1 按已落事实 = **命中即拒** | 需求档（主 agent 笔） |

### 2.1 逐条设计

**① `#1917` — 建议句按类分流（设计档 §2.11 已落）**

改前（`thincoder-core/agent-tools/batch-closeout.mjs:133`，逐字）：末段 `—— 做完的请在收口前 update → 待核销，没做完的 update → 条件 / 已废弃`。

改后：回执三行各管一类，建议贴在自己那一类旁边——

- 第一行（`在途` 行 → `待核销`）：`—— 认领行只有两种终局：做完的 close 勾销（待核销 → 已核销），判定不做的 update → 已废弃 并写判据（认领即承诺，没有第三种）`
- 第二行（`待讨论` / `待设计` 行 → `条件`）：`—— 这些行不是本批的活（未认领却被绑在本档 = 点火违规）；已落 trigger = 条件 + 复启句，由下一批接手，本批不再处置`
- 第三行（汇总）：只点名，不给建议。

为什么不删一句就完：回执要覆盖两类行。认领行没有「转 `条件`」这条出路，未认领行本来就不该在本批——两类并进一句，正是要收的病句。

**② `#1918` — `R-C4` 另立（设计档 §2.4 已落）**

- 建档表插一行：`| #N | 待核销 | 拒（R-C4）——已结账待勾销的行不构成本批的活 |`（排在 `R-C2` 与 `R-C3` 之间）。
- 拒文第四条逐字取实现（`thincoder-core/ledger-write-ops.mjs:194`），档与码同一句。
- 逐行处置表的 `已核销` / `已废弃` 行写明：**重新开账 = 另立新行**，并划清与铁律「本档不新开第二条台账行」的边界——铁律禁「同一件债同时挂两条未决行」，另立新行的前提是旧行已离开未决面。

并入 `R-C3` 被拒：两条拒的出路不同（终态 vs 结账位），且实现面本就是两个字面（`:308` / `:309`）。

**③ `#1919` — 描述面逐边枚举（设计档 §2.8 已落）**

产品码落点 = `thincoder-core/tool-docs/ledger.md:3` 的 `update` 条首句，改后逐字：

```text
- update：按六态允许表迁移（逐边枚举，表外拒）：待讨论→待设计 / 待讨论→在途 / 待设计→在途 / 在途→待核销 / 待核销→已核销 / 待核销→在途 / 任意非 已废弃 态→已废弃（已废弃 无出边）。`待讨论→在途` 是点火与建档的正路——批档一开就把覆盖行直接落到 在途，不过 待设计（待设计 = 已排设计，不是点火发生的事）；`待核销→在途` 是重开回收——批档重开 ⇒ 行回工作位，六态唯一的回退边。迁移入 已核销 时结果行标题携「收尾链待跑」同拒（同笔携清标记 title 放行）。id ∥ batch 恰携其一。status 缺省 = 仅更新字段；executor 缺省 = 进入待设计 / 在途自动写本会话，出在途 / 撤回清空；resume_when 同 update 可空字段（缺省 = 不变）。evidence 传入 = 追加（旧值非空 ⇒ 拼接 `旧｜新`——「｜」零空格；旧空直写）；`evidenceReplace: true` 与 evidence 同传 = 整段替换；旗独传（无新文）∥ 新值全空白 ⇒ 拒。
```

只改枚举句与新增的用途句，其余措辞零改。`ALLOWED_MIGRATIONS` 零改（`thincoder-core/ledger-db.mjs:163`-`:166` 已正确）。

描述面不引档名——它由模型直接读，指向别档的引用会在改词后失效。

**④ `#1884` — 判「做」，走拒面（设计档 §2.5 / §2.6 已落；`docs/core/design/ADVISOR-GUARDS.md` §1.2 已收正）**

结构信号 = **轮次块内的裁定行**（锚形已在盘：`_V_PRE` / `_V_SUF` / `VERDICT_CHANGES_LINE` = `thincoder-core/agent-tools/batch-skeleton.mjs:261`-`:264`；`VERDICT_PASS_LINE` = `thincoder-core/agent-tools/design-token.mjs:114`）。它不判意图，只读事实。

门 = `§5` 写入门加**判据 2**：`§3` 最近一轮轮次块自己携 pass 裁定。状态词过了才判块；无任何轮次块 ⇒ 照拒。

- **为什么是拒面不是触发面**：触发面要判「这一笔是打回还是补记」，那是猜意图；拒面只问「门所依赖的那个块，自己有没有说结论」，且两种情形处置同一条（补一行裁定）。选型判据照 `docs/core/design/ADVISOR-GUARDS.md` §1.2 判据二——拒绝时能把状态退回去。
- **误伤面**：修正轮（块携 pass 裁定）· 轻通道（不写 §5）· 无评审的批（`§1` 声明不适用，两判据同免）——三处均不受影响。
- **拒文 `R-G2b` 逐字**（设计档 §2.6）。
- **实现面**：`VERDICT_PASS_LINE` 由 `const` 改 `export`（零复制）；`batch-skeleton.mjs` 加取最后一个轮次块的导出；`assertSectionFiveGate` 加判据 2。`statusResetPlan` 零改。

被拒方案 = 扩触发面（写 `§3` 即重置）：猜意图，猜错还改写了写者刚落的档。

**⑤ `#1885` — 需求条目（已落；父侧笔）**

落点 = `docs/core/requirements/AGENT-LOOP.md` 的 `### 4.19`（`:337`-`:349` 逐字在盘），标注「**回填 · 源 = 提示词层既有规则**」（`thincoder-core/prompts/persona-engineering.md:335`-`:337`，无用户原话）。

**本节不转录正文**——需求档是它的单源，能力条 ∥ 边界 ∥ 验收以该节为准。本轮据实收正的是下面这个**事实**，不是措辞。

**收正的事实（本席首轮写错的那一句）：这一条不是「只有提示词层锚」。** 机制层、设计层、集成层都在盘，逐条实读：

- `thincoder-core/agent-tools/subagent-spawn.mjs:236` —— 同档在飞即 `throw`「batchDoc is already in flight — spawn refused」。
- 判据单源 `thincoder-core/agent-tools/subagent-scheduler.mjs:194` `batchDocInFlight(parent, batchDocAbs)`。
- 设计面 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.58「把提示词的软约束落成写不出来的硬拒」。
- 集成行 `test/RTM.md:242`（20-1）结果 = 通过。

⇒ `F-BR1` 按已落事实写成「**在飞只一份，命中即拒**」（不排队；回执点名批档路径 ∥ 占用者 ∥ 其 status ∥ 下一步），验收对齐 20-1，依赖指 `batchDocInFlight` 与 §6.58。父侧已在 `docs/core/requirements/AGENT-LOOP.md:343` 落定。

**这一条给本批的教训（本席自陈）**：回填类条目要查的是「机制在不在盘」，不是「提示词写没写」。首轮只读了提示词层就下了「无对应条目」的结论——把一个面当成了全仓，与本批要治的病同形。调研读数行见 §2.6。

### 2.2 受影响文件

| 文件 | 面 | 改动 |
|---|---|---|
| `thincoder-core/agent-tools/batch-closeout.mjs` | 产品码 | 回执三行（`:117`-`:136`）+ `assertSectionFiveGate` 判据 2（`:103`-`:111`）+ 拒文 `R-G2b` |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 产品码 | 新增导出 `lastRoundBlock(src, seg = 3)` → 块文本 ∥ `null`（**只切块**，复用既有 `ROUND_HEADING_RE:222`；裁定判定仍单源 `VERDICT_PASS_LINE`；`statusResetPlan` 零改） |
| `thincoder-core/agent-tools/design-token.mjs` | 产品码 | `VERDICT_PASS_LINE` 改导出（`:114`），锚零复制 |
| `thincoder-core/tool-docs/ledger.md` | 产品码 | `:3` 的 `update` 条枚举逐边写全 + 两条用途句 |
| `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 文档面 | §2.4 / §2.5 / §2.6 / §2.8 / §2.11 / §5 / §6 / §7 / §9（本席已落） |
| `docs/core/design/ADVISOR-GUARDS.md` | 文档面 | §1.2 的「未收」登记据实收正（本席已落） |
| `docs/core/requirements/AGENT-LOOP.md` | 文档面 | §4.19 新增 + 档头第 8 行读数收正（**主 agent 落**） |
| `test/integration/batch-gates-reanchor.test.mjs` | 工程工具面 | 14-5 断言行按类分流改写 |
| `test/integration/*`（`append §5` 夹具） | 工程工具面 | 14-1 及同形夹具补 `§3` 块内 pass 裁定 |
| `docs/batches/2026-11-01-ledger-contract-five-faces.test.mjs` | 工程工具面 | 本批单测（R18–R22 判据），收口即删 |

**层别结论**：无文件跨层——改动全落在既有档的既有节 / 既有条，无新层、无新根、无新增目录枚举。

**行数读数结论（本席判时实读，2026-11-01，`\n` 计数）**：`batch-closeout.mjs` **171** · `batch-skeleton.mjs` **450** · `design-token.mjs` **267** · `test/integration/batch-gates-reanchor.test.mjs` **190**——四档**无一越 500 软线 / 800 硬线，无拆分计划**。`docs/**` 的 `.md` 豁免不列。

### 2.3 关键决策（含被拒）

1. **`R-C4` 另立、不并入 `R-C3`**：两条拒的出路不同（终态 vs 结账位），实现面本就是两个字面。
2. **`#1917` 不删句、不并句，按类分流**：两类行的出路相反，一句管两类就是病灶本身；汇总行只点名。
3. **`#1919` 只收描述面**：状态机在盘且正确，改它就是改行为，本批一条不动。
4. **`#1884` 做，且走拒面**：结构信号存在（轮次块内的裁定行），不必猜意图；拒面只影响 `§5` 门，不改写 `§3` 的行为。
5. **`#1884` 无轮次块也拒**：真跑过的 pass 必有本轮块（A-AG22 判据 1），无块即无 pass 可依。
6. **`#1885` 需求档写权归主 agent（D1）**：本席给落点与事实读数，正文由父侧落——已落。
7. **判据 2 只堵 `§5` 门，不同步扩到收口 / 核销**：`§5` 门判的是「能不能开工」，开工面拦得住损失就止住了；收口是本批**已做完**的事，在那里再插一道评论文本判据只会让台账行卡在结账位、逼父侧改档才能结账。这条不对称作为**已登记残余**写在设计档 §2.6，日后要扩先重估这个代价。
8. **`lastRoundBlock` 只切块、不判裁定**：裁定判定仍单源 `VERDICT_PASS_LINE`（签发面那条），新导出不持有任何判定——否则同一事实长成第二处真源（D2）。被拒方案 = 返回 `{ text, verdict }`，那等于把判定搬进切块器。

### 2.4 验收判据（逐条回指条目）

判据正文单源 = 设计档 §5 的 `R18`–`R22` 五行，本节只登记「哪条判哪条」：

| 条目 | 判据 | 机检形 |
|---|---|---|
| ① `#1917` | `R18` | 两行回执夹具 + `grep -c "没做完的" thincoder-core/agent-tools/batch-closeout.mjs` = 0 |
| ② `#1918` | `R19` · `R20` | `create` 传 `待核销` 号 ⇒ 拒文逐字；覆盖已归档行 ⇒ 另立新行、旧行零改 |
| ③ `#1919` | `R21` | 描述面枚举边集合 = `ledger-db.mjs:163-166` 的边集合 |
| ④ `#1884` | `R22` | `append §5` 三格：块无裁定 ⇒ 拒 / 补 `VERDICT: pass` ⇒ 写入 / 无块 ⇒ 拒 |
| ⑤ `#1885` | 需求档 §4.19 | 该节在盘且五要素齐（总体需求 · 能力逐条 · 边界 · 验收 · 依赖） |

**本批单测**：`docs/batches/2026-11-01-ledger-contract-five-faces.test.mjs`（R18–R22 各一格 + `R-G2b` 拒文逐字），收口即删。

**集成面**：破 3 行（14-1 · 14-5 · 14-8）、新增 0 行，delta 依据 = 设计档 §9。14-8 判据 2 落地后必被破：`test/integration/batch-gates-reanchor.test.mjs:187` 只用 `status` 置 `评审通过`，而其上一块（`:175`）携 `VERDICT: changes-required` ⇒ `:188` 的 `append §5` 必被 `R-G2b` 拒。

### 2.5 上抛 / 交回

- **[上抛·知会]** `#1885` 需求条目**已落**（`docs/core/requirements/AGENT-LOOP.md:337`-`:349`）——正文经轮次 1 评审按已落机制收正（`F-BR1` = 命中即拒），由父侧改定；本席 §2.1-⑤ 随之收正，且不再转录正文（需求档是单源）。
- **[上抛·知会]** 批档 `§1` 的 §1.2 表 `#1885` 行病灶句**已由父侧收正**（现读「机制在盘三层…只缺需求档那一条（回填）」，批档 `:27`），与 §2.1-⑤ ∥ §2.6 同口径。
- **[上抛·知会]** 设计档 §2.6 的 `R-G2` 拒文此前与盘上实现不一致（档里缺实现已有的那句中文括注），本轮按盘上实现收正——属一致性面，已在同轮修掉。

**对账（本席 · 2026-11-01，逐条实读）**：§2.5 三条无悬空 —— ① `docs/core/requirements/AGENT-LOOP.md:337`-`:349` 在盘（`F-BR1` = 「在飞只一份，命中即拒」）；② 批档 `:27` 该行父侧已收正；③ 设计档 §2.6 两条拒文均在盘（判据 1 的中文括注 `:332`、判据 2 的「两者同携」`:338`）。

### 2.6 证据面：最近先例 · 调研读数 · 既有件三问（本批 delta）

**最近先例（逐面：对齐 ∥ 偏离）**

| 面 | 先例坐标 | 对齐 | 偏离 |
|---|---|---|---|
| ① 收口回执建议句 | `thincoder-core/agent-tools/batch-closeout.mjs:122`-`:136` `reanchorReceiptLine` 的既有三行信封 | 同一函数、同一三行结构、同一「空行不出」规则 | 只改**建议句挂在哪一行**：由汇总行迁到它管的那一类行旁边；信封与行序零改 |
| ② 建档拒文第四条 | `thincoder-core/ledger-write-ops.mjs:192` `bindArchivedError` ∥ `:194` `bindSettledError`（各在 `:308` / `:309` 抛出） | 同一拒文族形（`batch: ledger entry #<N> is …`）、同一后果（档零落盘 + 行零改） | 不并入 `R-C3`：两条拒的**出路不同**（终态只能另立新行；结账位可勾销或重开回收），并成一句父侧不知道走哪条 |
| ④ `§5` 门判据 2 | `thincoder-core/agent-tools/design-token.mjs:116`-`:120` `verdictGateFailure`（同一条锚、先打回后 pass） | 同一个 `VERDICT_PASS_LINE` 与 `VERDICT_CHANGES_LINE`，同一判定顺序；`VERDICT_PASS_LINE` 改导出、零复制 | 只改**读哪一段文本**：签发面读整份回执，本门读 `§3` 末一块 |

**调研读数（本批 delta）**

- **仓外声明源**：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（档级读数见设计档 §1；本批复核仍为空）⇒ **无仓外声明源可查**（照记，不当「查过且有结论」）。
- **仓内查过并命中的面**（`#1885` 那一处漏查由此补上）：`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.58 · `thincoder-core/agent-tools/subagent-scheduler.mjs:194` `batchDocInFlight` · `thincoder-core/agent-tools/subagent-spawn.mjs:236` · `test/RTM.md:242`（20-1）。
- **结论**：回填类条目的判据 = 机制在不在盘；首轮只读提示词层即下结论，漏了上列三层。

**既有件三问（本批三处新名）**

| 新名 | 住哪 | 叫什么（逐字） | 谁消费 | 结论 |
|---|---|---|---|---|
| `R-G2b` | 既有拒文族 `R-G1` / `R-G2`（设计档 §2.6）的第三支 | `R-G2`（段序未过）/ `R-G1`（`§3` 未过） | 设计档 §2.6 / §5 `R22` · 批档 §2.4 | **existing but unusable**：`R-G1` 判状态词、`R-G2` 判段序，二者都不看块内裁定——判据面与出路都不同，只能另立一支，前两条零改 |
| `R-C4` | 既有拒文族 `R-C1` / `R-C2` / `R-C3`（设计档 §2.4） | `R-C1`（号不存在）/ `R-C2`（在途指别档）/ `R-C3`（已核销 / 已废弃） | 设计档 §2.4 / §5 `R19` · 批档 §2.4 | **existing but unusable**：`R-C3` 的出路 = 另立新行，`待核销` 另有两条（勾销 ∥ 重开回收）；实现面本就是两个字面 |
| `lastRoundBlock(src, seg = 3)` | `thincoder-core/agent-tools/batch-skeleton.mjs` 的轮次块工具族（`ROUND_HEADING_RE:222` · `countRoundBlocks:233` · `nextRoundNumber:243`） | 三个既有名均保留 | `countRoundBlocks` ← `design-token.mjs` 点火基线 / 写入门；`nextRoundNumber` ← `statusResetPlan:289` · `batch.mjs` | **existing but unusable**：既有两个导出只数块数 / 算下一个 N，都不返回块文本；切块需一个新导出，且只切块、裁定判定留 `VERDICT_PASS_LINE` 一处 |

### 轮次 1 评审 13 条的落地（修正轮 1）

| # | 处置 | 落点（改前 → 改后） |
|---|---|---|
| 1 🔴 | 要求事实收正 | §2.1-⑤ 由「转录五要素正文」→ **不转录**，只记事实：`subagent-spawn.mjs:236` ∥ 单源 `subagent-scheduler.mjs:194` ∥ 设计 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.58 ∥ 集成 `test/RTM.md:242` 三层全在盘；`F-BR1` = 命中即拒（父侧已落 `docs/core/requirements/AGENT-LOOP.md:343`）。§2.0 表 ⑤ 行同步 |
| 2 🔴 | RTM delta 补破一行 | 设计档 §9「破 2」→「**破 3**」+ 14-8 行（再 pass = 追加一块携 `VERDICT: pass` 的轮次块；断言由「再 pass ⇒ 放行」改「补块 ⇒ 放行」）；§2.4 集成面行同步 + 证句（`batch-gates-reanchor.test.mjs:187` 上方 `:175` 携 `changes-required`） |
| 3 🟡 | 记录面滞后 | §2.5 首条由「[上抛·待裁] 由主 agent 落」→「[上抛·知会] **已落**，正文经轮次 1 收正」 |
| 4 🟡 | 导出留白 | 设计档 §2.6 + §2.2 表：给出 `lastRoundBlock(src, seg = 3) → string ∥ null`；写明**只切块**、裁定判定仍单源 `VERDICT_PASS_LINE`；切块复用 `ROUND_HEADING_RE:222` |
| 5 🟡 | pass 谓词 | 设计档 §2.6 增「**含 pass 行 ∧ 不含打回行**」，与 `verdictGateFailure`（`design-token.mjs:116`-`:120`）同序；`R-G2b` 拒文取值补「两者同携」；`R22` 验收行同步 |
| 6 🟡 | 不对称登记 | 设计档 §2.6 增「不对称（已登记残余）」：判据 2 只落 `§5` 门，收口 ∥ 核销门③ 仍判判据 1，并给出为何不同步扩的理由；§2.3 决策 7 |
| 7 🟡 | 存量出路 | 设计档 §2.6 增「存量出路」：追加一轮携 pass 裁定的评审（工程模式 `§3` 只由绑本档的评审实例写）∥ 收口面照判据 1；并标「`status` 单写不再足以开 `§5`」 |
| 8 🟡 | 行数档结论 | §2.2 增「行数读数结论」行：171 / 450 / 267 / 190（本席 `\n` 计数实读），无一越 500 软线 / 800 硬线 |
| 9 🟡 | 最近先例 | §2.6 新增逐面先例表（①回执三行信封 ②`bindArchivedError` ∥ `bindSettledError` ④`verdictGateFailure`），各写对齐 ∥ 偏离 |
| 10 🟡 | 调研读数 | §2.6 新增调研读数行：`index.publicRepos` = `[]`（本轮复核 `PROJECT-MANIFEST.json:35`）+ 仓内查过并命中的四处 + 结论 |
| 11 🟡 | 既有件三问 | §2.6 新增三问表（`R-G2b` ∥ `R-C4` ∥ `lastRoundBlock`），三条均判 `existing but unusable` 并写失败面 |
| 12 🔵 | 时态先落 | `docs/core/design/ADVISOR-GUARDS.md:101`-`:102` 与设计档 §2.5 末条：由「拒面已收 / 堵这个洞的是拒面」→「判据 / 拒文已定，**代码随本批落**」 |
| 13 🔵 | 占位行 | §2 状态行下的 `<§2 模板占位：…>` 行删除 |

**两处非本席段的落点（父侧均已落地，无悬空）**：① §1.2 表 `#1885` 行病灶句已由父侧收正为「机制在盘三层…只缺需求档那一条」；② `docs/core/requirements/AGENT-LOOP.md` §4.19 由父侧落定（本席只读，正文不转录）。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 设计评审（第 1 轮）

**范围（4 档）**：`docs/batches/2026-11-01-ledger-contract-five-faces.md` · `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` · `docs/core/design/ADVISOR-GUARDS.md` · `docs/core/requirements/AGENT-LOOP.md`。

**取证实读**（按声明逐条读被引源档）：

- `thincoder-core/agent-tools/batch-closeout.mjs:133` 逐字仍写「没做完的 update → 条件 / 已废弃」，`:117`-`:118` 的同一句在 doc 注释里 ⇒ `#1917` 成立。
- `thincoder-core/tool-docs/ledger.md:3` 枚举缺两条实边；`thincoder-core/ledger-db.mjs:163`-`:166` 两条都在 ⇒ `#1919` 成立。
- 锚在盘：`thincoder-core/agent-tools/batch-skeleton.mjs:261`-`:264`；`thincoder-core/agent-tools/design-token.mjs:114` 的 `VERDICT_PASS_LINE` 现为 `const` 未导出 ⇒ ④ 的「改 export、零复制」可落。
- 拒文第四条 `thincoder-core/ledger-write-ops.mjs:194` 与设计档 `:246` 逐字一致、抛出点 `:309` ⇒ `#1918` 确是档面欠账。
- `thincoder-core/prompts/persona-engineering.md:335`-`:337` 即 §4.19 的来源句（回填成立）。
- 行数（判时实读）：`thincoder-core/agent-tools/batch-closeout.mjs` 171 · `thincoder-core/agent-tools/batch-skeleton.mjs` 450 · `thincoder-core/agent-tools/design-token.mjs` 267 · `test/integration/batch-gates-reanchor.test.mjs` 190——无一越 500 线。

**声明三问的答复**：

- ① 落点：①②③④ 都有可执行落点（回执三行逐字 = 设计档 §2.11；描述面新句逐字 = §2.8；建档表 `R-C4` = §2.4；`R-G2b` 逐字 = §2.6）。⑤ 也在盘（`docs/core/requirements/AGENT-LOOP.md:337`），但正文与已落机制相抵 ⇒ #1。
- ② 结构信号**能**：只读事实、不判意图，补记 ∥ 隐性打回同一条处置成立。残余 = 判据 2 只在 `§5`（#6）；打回后的复评必须真补一块携 pass 裁定的块（#2）。
- ③ 五要素齐、不越 `#1885` 的「只补一条」边界；越过的是已落机制（#1）。
- ④ 「破 2 行 / 新增 0」**不如实**：14-8 同时被破（#2）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / Doc ownership | 🔴 | F-BR1 边界句（`docs/core/requirements/AGENT-LOOP.md:343`「不做机械门（不阻断 spawn）」）与**已落**机制相反：`thincoder-core/agent-tools/subagent-spawn.mjs:236` 逐字「batchDoc is already in flight — spawn refused」；单源 `batchDocInFlight`（`subagent-scheduler.mjs:194`）；设计面 `docs/core/design/AGENT-LOOP-SUBAGENT.md:916`「把提示词的软约束落成写不出来的硬拒」、`:936`「命中 ⇒ 拒」；集成行 `test/RTM.md:242`（20-1）结果 = 通过。同一机制两处相反描述。 | 按已落事实回填 F-BR1：同档在飞 ⇒ 第二席**拒发**（点名批档路 + 占用者 + status + 下一步）、不作排队；「依赖·下游」改指 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.58；验收①对齐 20-1（拒文 + 第一席照常交付）。若确要「不阻断」，那是改产品行为而非回填，须先撤 §6.58——二选一写死。 |
| 2 | Acceptance / Integration | 🔴 | RTM delta 少破一行：`test/integration/batch-gates-reanchor.test.mjs:187` 只用 `status` 置 `评审通过`，其上一块（`:175`）携 `VERDICT: changes-required` ⇒ 判据 2 落地后 `:188` 的 `append §5` 必被 `R-G2b` 拒，`test/RTM.md:184` 的「该批再 `pass` 后 `append §5` 放行」不再成立。批档 `:168`「破 2 行（14-1 · 14-5）」与设计档 `§9`「新增行 = 0」表均未登记 14-8。 | delta 改「破 3 行（14-1 · 14-5 · 14-8）」：14-8 改写为「再 pass = 追加一块携 `VERDICT: pass` 的 `§3` 轮次块」，断言由「再 pass ⇒ 放行」改为「补块 ⇒ 放行」；另在 §2.6「不误伤三处」旁写明：`status` 单写不再足以开 `§5`。 |
| 3 | Doc ownership | 🟡 | 记录面滞后：批档 `:172` 仍写「**[上抛·待裁]** `#1885` … 由主 agent 落」，而 `docs/core/requirements/AGENT-LOOP.md:337`-`:349` 已逐字在盘（档头 `:8` 也已登记回填）。 | 该条改「已落，待裁是否按 #1 收正正文」，两处读数对齐。 |
| 4 | Clarity | 🟡 | 取块导出只有描述无名字 / 签名（批档 `:134`「新增「取最后一个轮次块」的导出」）⇒ 返回形（块文本 ∥ 行数组 ∥ `{text, roundN}`）留白，R22 无接口面可钉。 | 给符号名与返回形（例 `lastRoundBlock(src, seg = 3): string \| null`），并写明它只切块、裁定判定仍由 `VERDICT_PASS_LINE` 一处负责。 |
| 5 | Acceptance | 🟡 | 判据 2 的 pass 谓词留白：末块**同时**携 pass 与打回两行时未定，只有拒文取值（`<无裁定行 \| VERDICT: changes-required>`）暗示后者优先。 | 写成显式合取「末块含 pass 行 ∧ 不含打回行」，与 `verdictGateFailure` 先打回后 pass 同序；拒文取值表补「两者同携 ⇒ changes-required」。 |
| 6 | Scope | 🟡 | 判据 2 只落 `§5`（`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:287`），收口门（`:288`）与核销门③仍只判判据 1 ⇒ 一笔「只写散文、无裁定」的 `§3` 之后，实现被拦而收口 / 核销照走；设计未把这条不对称登记为残余。 | §2.6 加一句边界：本批只堵实现开工面，收口 / 核销面同形留作登记残余（或说明为何不需同判据）。 |
| 7 | Feasibility | 🟡 | 「不误伤的三处」（`:317`）漏了存量在飞批：`§3` pass 块若写在「裁定行进 §3」成文之前，判据 2 判成无结论 ⇒ `§5` 永不可写；工程模式 `§3` 只由绑定本档的评审实例写，主 agent 无法自行补块。 | 补一条存量出路（追加一轮携 pass 裁定的评审 ∥ 收口面照判据 1），并说明它是可枚举的小集合而非持续产生的形。 |
| 8 | Affected-file tier | 🟡 | §2.2 只有批档 `:144`「**层别结论**：无文件跨层」——那是「层」不是行数档；表内零行数读数、无「有无文件越档」结论行。判时实读（见上）：四档最大 450 行，无一越 500。 | 补一行读数结论：「判时实读 … 无文件越 500 软线 / 800 硬线，无拆分计划」（`.md` 豁免不列）。 |
| 9 | Closest precedent | 🟡 | 本批 delta 无最近先例行（坐标 + 对齐 ∥ 偏离）；④ 只引 `docs/core/design/ADVISOR-GUARDS.md` §1.2 判据二作**选型判据**，那是一条判据不是先例。档级先例在 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:15` ∥ `:23`，未覆盖本批五个面。 | §2 补一行逐面先例：①收口回执 → 既有三行回执形；②拒文分支 → `bindArchivedError` / `bindSettledError` 两字面；④ → 裁定闸同读一根正则；各写对齐 ∥ 偏离。 |
| 10 | Survey evidence | 🟡 | 本批 delta 无调研证据行；档级那条（`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:23` `index.publicRepos` = `[]`）是更早一轮读数。真正漏查处：`#1885` 的「只有提示词层锚」不成立（§6.58 ∥ `batchDocInFlight` ∥ 20-1 均在盘），#1 由此产生。 | 补一条本批调研读数：查过 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.58、`thincoder-core/agent-tools/subagent-scheduler.mjs`、`test/RTM.md` 故事 20（`index.publicRepos` 仍 = `[]`，照记）+ 结论。 |
| 11 | Existing-piece check | 🟡 | 新名无三问答复：`R-G2b`、`R-C4` 均缺 `existing: … ∥ none found: … ∥ existing but unusable: …` 形；② 的「为何不并入 `R-C3`」是近邻论证不成熟形；④ 的导出连名字都无（#4）故既有件无从比。 | 三处各补三行答案（住哪 · 叫什么逐字 · 谁消费）；② 用「`existing but unusable`：`bindArchivedError` 出路不同」收口。 |
| 12 | Doc hygiene | 🔵 | 时态先落：`docs/core/design/ADVISOR-GUARDS.md:101` 小标题「**无裁定行的那一笔（拒面已收）**」∥ `:102`「洞由 `§5` 写入门堵上」，`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:275`「**堵这个洞的是拒面**」——而 `§5` 门现盘只有判据 1。 | 两处改成「判据 / 拒文已定，代码随本批落」的时态。 |
| 13 | Doc hygiene | 🔵 | 批档 §2 状态行已「设计完成」，`:44` 的 `<§2 模板占位：…>` 行仍在（工具面合法，读起来像未填）。 | 删该占位行。 |

**计数**：🔴 2 · 🟡 9 · 🔵 2（共 13 项）

VERDICT: changes-required

### 轮次 2（评审子代理）

### 轮次 2 验证（轮次 1 的 13 条 + 新问题）

范围同轮次 1（四档）。结论：**13 条全部落地**，遗留 🟡×1 · 🔵×1（新），无未解 🔴。

**逐条验证（Status / 证据 = 本轮实读）**

- 1 🔴 **Fixed**
  - docs/core/requirements/AGENT-LOOP.md:343 F-BR1 =「在飞只一份，命中即拒」，边界句已由「不做机械门（不阻断 spawn）」改为「不排队（是拒，不是延后）」。
  - 与 thincoder-core/agent-tools/subagent-spawn.mjs:236 的拒发逐字一致；:347 验收对齐 20-1；:349 依赖指 `batchDocInFlight` ∥ docs/core/design/AGENT-LOOP-SUBAGENT.md §6.58。
- 2 🔴 **Fixed**
  - docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:818「破 3 / 冗余 0 / 缺 0」；:824 的 14-8 行连断言改写一起落（「再 pass = 追加一块携 VERDICT: pass 的 §3 轮次块」，断言改「补块 ⇒ 放行」）。
  - 批档 :165 同步并带证句（test/integration/batch-gates-reanchor.test.mjs:187 只写 `status`、:175 块携 `changes-required`）。
- 3 🟡 **Fixed** —— 批档 :169 已改「[上抛·知会] `#1885` 需求条目已落」。
- 4 🟡 **Fixed** —— docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:314 给出 `lastRoundBlock(src, seg = 3) → string ∥ null`，:315 写明只切块；批档 :126 同步。
- 5 🟡 **Fixed** —— 同档 :319 显式合取（含 pass ∧ 不含打回，与 `verdictGateFailure` 同序）；:338 拒文取值补「两者同携」；:707 R22 同步。
- 6 🟡 **Fixed** —— 同档 :326「不对称（已登记残余）」含不同步扩到收口 / 核销的理由；批档 :148 决策 7。
- 7 🟡 **Fixed** —— 同档 :325「存量出路」+ :324「`status` 单写不再足以开 `§5`」。
- 8 🟡 **Fixed** —— 批档 :138 行数读数结论（171 / 450 / 267 / 190，无一越 500 软线 / 800 硬线）。
- 9 🟡 **Fixed** —— 批档 :175-181 逐面先例表（坐标 + 对齐 ∥ 偏离）。
- 10 🟡 **Fixed** —— 批档 :183-187 调研读数（`index.publicRepos` = `[]` + 仓内命中四处 + 结论）。
- 11 🟡 **Fixed** —— 批档 :189-195 既有件三问表（`R-G2b` ∥ `R-C4` ∥ `lastRoundBlock`，均判 existing but unusable）。
- 12 🔵 **Fixed** —— docs/core/design/ADVISOR-GUARDS.md:101「拒面判据已定，代码随本批落」、:102 同；docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:275 同。
- 13 🔵 **Fixed** —— 批档 §2 状态行下已无模板占位行（该行现为正文空行）。

**新问题（本轮发现）**

- N1 🟡 —— 批档 :170 仍写「[上抛·待裁] … §1.2 表 `#1885` 行病灶句仍写「只有提示词层锚」… **该行待父侧收正**」，
  而同一档 :27 现读「机制在盘三层（…）**只缺需求档那一条**（回填）」⇒ 该上抛项已失效，记录面自相矛盾。
  建议：删除该条，或改为「已由父侧收正」。
- N2 🔵 —— test/integration/ssh-device-readability.test.mjs 三条用例共用一个模块级 `id`（:44 `let id = ""`，:46 的 `ssh` 闭包），
  22-2 ∥ 22-3 依赖 22-1 建立的会话态 ⇒ 单条跑 / 乱序跑结论不可复现（R4 脆弱测试）。
  建议：每条用例自建会话并在收尾关闭。

**计数**：旧 13 条全部落地（🔴 2 Fixed · 🟡 9 Fixed · 🔵 2 Fixed）；新 🟡 1 · 🔵 1。

VERDICT: pass

### 轮次 3（评审子代理）

### 轮次 3 验证（轮次 2 的 N1 + 修正轮 3 处 + §3 状态行）

**范围（2 档，本轮声明口径）**：`docs/batches/2026-11-01-ledger-contract-five-faces.md` ·
`docs/core/requirements/AGENT-LOOP.md`。**按文本复，不按行号**（修正轮在 §2 插行后，
轮次 2 的引用从 `:175` 起整体 +2；结论不受影响，见 O1）。
另两档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` ∥ `docs/core/design/ADVISOR-GUARDS.md`
不在本轮范围 ⇒ 其中断言本轮 unverified，不作事实。

**逐处验证（Status / 证据 = 本轮实读，引文逐字）**

- **① §2.5 第二条（`#1885` 行已收正）— Fixed**
  `:170` 现读「`[上抛·知会]` 批档 `§1` 的 §1.2 表 `#1885` 行病灶句**已由父侧收正**」；
  `:27` 逐字「**机制在盘三层**（…），**只缺需求档那一条**（回填）」⇒ 两处同口径，轮次 2 的 N1 消解。
- **② §2 末尾「两处未由本席改」同形悬空 — Fixed**
  `:217` 现读「**两处非本席段的落点（父侧均已落地，无悬空）**」；
  其 ② 指需求档 §4.19 = `:337`-`:349` 在盘（本轮实读该区间）。
- **③ §2.5 新建的对账行 — 在盘（`:173`）**，三项逐条实读：
  ① `docs/core/requirements/AGENT-LOOP.md:337`-`:349` 在盘，
  `F-BR1` = 「**在飞只一份，命中即拒**」逐字见 `:343` ⇒ 成立；
  ② 批档 `:27` 该行父侧已收正 ⇒ 成立；
  ③ 设计档 §2.6 两条拒文（`:332` / `:338`）——该档不在本轮范围 ⇒ **unverified**，不作事实断言。
- **④ §3 状态行（轮次 2 漏的那一步）— 本轮补写**
  `:219` `## §3 设计评审（评审子代理）` 与 `:221` `### 轮次 1（评审子代理）` 之间
  无 `**状态行**：` 行（对照 §1 `:6` ∥ §2 `:43` 均有）⇒ 正文已落而状态行缺位，
  正是轮次 2 未签发 token 的成因。本轮以 `batch status §3 = 评审通过` 写掉。
- **N2 复核（父侧点验）**：`test/integration/ssh-device-readability.test.mjs`
  三条用例共用模块级会话，**不在本轮范围**，未复读；按父侧陈述「尚未修」⇒
  **照旧 🔵**（不阻塞，归另一本批 `#1921` 收）。

**§4.19 五要素（本轮实读需求档）**：总体需求 `:339` · 能力逐条 `F-BR1`/`F-BR2`/`F-BR3` `:343`-`:345` ·
边界 = 同表第三列 · 验收 `:347` · 依赖 `:349`（上游 `batchDocInFlight` ∥ §6.58，下游 20-1）⇒ 齐；
与档头 `:8` 的「`§4.19` 属**回填**」标注一致。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| O1 | Doc hygiene · 行号漂移 | 🔵 | 轮次 2 引用自 `:175` 起整体 +2：`:283` 写「批档 :175-181 逐面先例表」，该表现于 `:177`-`:183`（表头 `:179`）；`:284` / `:285` 同形。§3 append-only，旧行不可改写。 | 本轮已按文本复（结论不依赖旧行号）；后续轮引「节名 + 逐字片段」，行号仅辅助。 |
| O2 | Affected-file tier | 🔵 | §2.2 表内 `test/integration/*` 是通配行，未被 `:138` 行数读数结论枚举 ⇒ 该行涉及文件无法逐档判（具名四档读数本身成立）。 | 实施轮把通配行展开为实际触碰文件清单；仍无一越档则结论行补一句。 |
| O3 | 脆弱测试（承轮次 2 N2） | 🔵 | `test/integration/ssh-device-readability.test.mjs` 三条用例共用模块级会话态（父侧陈述：尚未修）⇒ 单条跑 / 乱序跑不可复现（R4）。 | 每条用例自建会话并在收尾关闭；本轮不阻塞（归 `#1921`）。 |

**计数**：轮次 2 的 N1（🟡）= Fixed；修正轮 3 处全部在盘（① 成立 ② 成立 ③ 成立——第三手 unverified = 范围外）；
④ §3 状态行本轮补写。新 🔴 0 · 🟡 0 · 🔵 3。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准 = 批级放行。**

- **点火与放行原话**：2026-11-01 11:54 逐字「**自动跑完**」—— 批级 go-ahead，覆盖本批**评审 → 实施 → 收口**全链，不再逐步请示。
- **批准的对象**：台账契约五面（`#1917` 回执分流 ∥ `#1918` 待核销拒文 ∥ `#1919` 描述面逐边枚举 ∥ `#1884` `§5` 门判据 2 ∥ `#1885` 需求条目回填）。
- **批准前已知的面（当时的读数，不是事后追认）**：设计经 **3 轮**独立评审（轮次 3 = `pass`，13 条遗留全部 Fixed）；实施要动产品码 3 档 + 描述面 1 档 + 集成本档 1 档；`statusResetPlan` 与 `ALLOWED_MIGRATIONS` 按设计裁定**零改**。
- **批准不以「还没改」为前提**：本批实施期间 `test/RTM.md` 被另一在飞批次占用，实施席排在队尾才开跑 —— 这件事记在 §6.12 的读数旁，不掩饰。

## §5 实施记录（eng-coder）

## 5. 实施记录（eng-coder）

### 5.0 一句话

五面收到同一句上：收口回执按类分流 ∥ 建档 `待核销` 号拒文有档面 ∥ 描述面逐边枚举 ∥ `§5` 门加判据 2 ∥ 需求条目已由父侧回填。产品码三档 + 工具描述一档 + 集成三行 + 本批单测。

### 5.1 逐条交付

| # | 条目 | 处置 | 终态落点 | 状态 |
|---|---|---|---|---|
| ① | `#1917` 收口回执文案 | 建议句按类分流：第一行只装 `在途` 行、第二行只装 `待讨论`/`待设计` 行、汇总行只点名 | `thincoder-core/agent-tools/batch-closeout.mjs:172`-`:184`（JSDoc 同拍对齐 `:154`-`:163`） | ✅ 完成 |
| ② | `#1918` 建档表 `待核销` 行 | 设计档 `R-C4` 行 + 拒文第四条 + 「重新开账 = 另立新行」+ 与铁律划界（设计席已落；本席以 R19 断言钉住实现面逐字） | 设计档 `:130` ∥ `:136` ∥ `:193` ∥ `:246`；实现 `thincoder-core/ledger-write-ops.mjs:194`（抛出点 `:309`，零改） | ✅ 完成 |
| ③ | `#1919` 工具描述枚举 | `update` 条逐边写全 + 两条非常规边各带一句用途；`ALLOWED_MIGRATIONS` 零改 | `thincoder-core/tool-docs/ledger.md:3` | ✅ 完成 |
| ④ | `#1884` §3 状态门 | `§5` 门加判据 2（末块含 pass 行 ∧ 不含打回行，两者同携判打回）；`statusResetPlan` 零改 | `batch-closeout.mjs:110`-`:116`（谓词）∥ `:120`-`:125`（拒文 `R-G2b`）∥ `:141`-`:152`（门）；`batch-skeleton.mjs:252`-`:259`（`lastRoundBlock`）；`design-token.mjs:115`（`VERDICT_PASS_LINE` 改导出） | ✅ 完成 |
| ⑤ | `#1885` 需求条目 | 父侧笔，已落；本席只以事实钉住（机制在盘三层） | `docs/core/requirements/AGENT-LOOP.md` §4.19（本席未改） | ✅ 完成（非本席笔） |

### 5.2 逐档改前 → 改后

| 档 | 改前 | 改后 | 行数 |
|---|---|---|---|
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 轮次块工具族只有 `ROUND_HEADING_RE` / `countRoundBlocks` / `nextRoundNumber` | 新增导出 `lastRoundBlock(src, seg = 3) → string ∥ null`（只切块，零判定；复用 `ROUND_HEADING_RE`） | 450 → 471 |
| `thincoder-core/agent-tools/design-token.mjs` | `const VERDICT_PASS_LINE`（不导出），注释写「它只服务签发面」 | `export const VERDICT_PASS_LINE`；注释改为「导出给 `§5` 写入门共读（判定单源）」 | 267 → 268 |
| `thincoder-core/agent-tools/batch-closeout.mjs` | ① 回执汇总行携「做完的… 没做完的…」 ② `assertSectionFiveGate` 只判 `§3` 状态词 | ① 建议句各贴其行、汇总行只点名 ② 门加判据 2 + `R-G2b` 拒文 + 谓词函数；档头 ② 句与门 JSDoc 同拍对齐 | 171 → 220 |
| `thincoder-core/tool-docs/ledger.md` | `按六态允许表迁移：待讨论→待设计 / 待设计→在途 / 在途→待核销 / 待核销→已核销 / 任意态→已废弃；表外拒；` | `按六态允许表迁移（逐边枚举，表外拒）：… 待核销→在途 / 任意非 已废弃 态→已废弃（已废弃 无出边）。` + 两条用途句（其余措辞零改） | 9 行不变 |
| `test/integration/batch-gates-reanchor.test.mjs` | 14-1 / 14-5 / 14-8 三行按旧判据写（`status` 单写即可开 `§5`；汇总行含旧建议句） | 14-1 补「块内无裁定 ⇒ 拒」+ 补块放行；14-5 断言建议各贴其行、汇总行零建议；14-8 补「`status` 单写仍拒 ⇒ 补块放行」 | 190 → 208 |
| `docs/batches/2026-11-01-ledger-contract-five-faces.test.mjs` | 无 | 本批单测：R18–R22 各一格 + `R-G2b` 拒文逐字（R22 六格：无裁定 / 补 pass / 无块 / 两者同携 / 打回未重置 / `§3` 不适用） | 0 → 189（收口即删，见 §5.9） |

### 5.3 实跑读数

| 读什么 | 命令 | 结果 |
|---|---|---|
| 集成三行改写后 | `node --test test/integration/batch-gates-reanchor.test.mjs` | `tests 8 / pass 8 / fail 0` |
| 全集成（收口门口径） | `node test/run.mjs` | `tests 79 / pass 79 / fail 0` |
| 本批单测 R18–R22 | `node --test docs/batches/2026-11-01-ledger-contract-five-faces.test.mjs` | `tests 5 / pass 5 / fail 0` |
| R18 机检 | `grep -c "没做完的" thincoder-core/agent-tools/batch-closeout.mjs` | `0`（正文与 doc 注释同拍清掉） |
| 文档机检 | `doc_check(mode:"gate")`，docs = `thincoder-core/tool-docs/ledger.md` + `test/RTM.md` | `DOC-CHECK GATE: PASS` · 0 段有问题（2 档全清） |
| 行数终值 | `\n` 计数 | `batch-closeout 220` · `batch-skeleton 471` · `design-token 268` · 集成 208 · 本批单测 189——无一越 500 软线 / 800 硬线 |

R19 / R20 另用实现面实跑确认（不是读代码推断）：`create{ledger:"#<待核销号>"}` 抛出的整串与设计档 §2.4 第四条逐字相同，档零落盘、行零改；覆盖行已 `已核销` 时 `create` 不带 `ledger` 自开新行，旧行状态与 `evidence` 字节零改。

### 5.4 扫面（设计档 §9「实施轮扫面」）

全仓 `append §5` 夹具只两处：`test/integration/batch-gates-reanchor.test.mjs`（`:76` / `:81` / `:86` / `:194` / `:201` / `:206`）与 `docs/batches/2026-11-01-ledger-contract-five-faces.test.mjs`（R22 六格）。

每一处都按其所在格的判据成立：写入口的三笔前面都有「末块携 pass 裁定」或「`§1` 声明 `§3` 不适用」；拒面各格吃到 `R-G2` / `R-G2b`。无第三处漏改。

### 5.5 域外改动（逐条自报）

| 档 | 改了什么 | 理由 |
|---|---|---|
| `test/RTM.md:177` / `:181` / `:184` | 14-1 / 14-5 / 14-8 三行的「怎么做 / 怎么算通过」文本按设计档 §9 delta 改写（破 3 行） | 原断言在本批后为假（「再 `pass` 即放行」「末行含旧建议句」）；设计档 §9 明定 RTM 改行由实施轮落。**结果列仍 `待执行`**——收口跑由父侧定 |

### 5.6 设计与码的漂移（别的席的笔，本席只报不改）

- **设计档 §2.2 行数读数**：设计时 171 / 450 / 267 / 190；终态 220 / 471 / 268 / 208，结论不变（无一越 500 / 800）。
- **设计档 §2.2 的坐标是设计时值**：表内 `assertSectionFiveGate（:103-:111）` 与 `回执三行（:117-:136）`，终态为 `:141`-`:152` / `:164`-`:185`。
- **设计档 §2.5 `:275` ∥ `docs/core/design/ADVISOR-GUARDS.md` §1.2 `:101`-`:102` 的时态**：「判据 / 拒文已定，代码随本批落」——本批已落，该句现为完成态，宜改「已落」。
- **设计档 §2.8 `:389` 的枚举示例形**：分组形（`待讨论 → 待设计 / 在途 / 已废弃`）与落地字面（逐边形 + `任意非 已废弃 态→已废弃`）不同形。边集合相等（R21 机检已证），非机制矛盾；但「逐边写全」这句下挂两种形，宜在 §2.8 点明逐字形以批档 §2.1-③ 为准。
- **批档 §2.2 表未列 `test/RTM.md`**：实施轮实际触碰该档（§9 授权），表内只列到 `test/integration/*`。
- **`docs/core/design/API-CONTRACT.md` 生成区**：未含新导出 `lastRoundBlock` 与改导出后的 `VERDICT_PASS_LINE`；上批的 `newDebtReasonOf` / `newDebtReasonReceiptLine` 同样缺席 ⇒ 是跨档再生欠账，不是本批新造，归生成器刷新。

### 5.7 设计留白（已按设计落，代价如实记）

判据 2 拒文只有一个模板，`第 <N> 轮` 在「`§3` 无任何轮次块」时渲染为「第 0 轮」。

- 机制面无损：无块 ⇒ 照拒（fail-closed）、`§5` 字节不变。
- 措辞面有代价：该格把「无块」说成了「有块无裁定」，读者可能去补一个不存在的「第 0 轮」。
- 本席未自造第二个拒文字面（设计只给一段逐字），也未把 `<N>` 换字——那会改动设计给的字面。是否单列无块形态的措辞，留给设计席裁定。

### 5.8 审计 ∥ 评审轮次与终态

| 面 | 轮次 | 结论 |
|---|---|---|
| 内部偏差审计（read-only explore，对设计档逐条） | 1 轮 | 无偏差（其唯一命中项 = 本段当时尚未写，即 §5 本身） |
| 内部代码评审（advisor `type=code`） | 1 轮 | `VERDICT: pass`：0 🔴 · 1 🟡（非 must-fix——`docs/core/design/API-CONTRACT.md` 生成区滞后，范围外档）· 5 🔵（全部落在别的席的笔 + 本节自身） |
| 自修轮次 | 实施期 2 次（集成 14-5 断言正则转义；单测夹具 `task_book` 与核销机检前置）+ 审计后 0 次 | — |
| 终态 | — | **clean** |

### 5.9 零留存

本批单测档 `docs/batches/2026-11-01-ledger-contract-five-faces.test.mjs`（189 行）跑完读数即删——盘上零留存，可执行件只余集成面。

### 5.10 未做（如实）

- 别的席的档（设计档 §2.2/§2.5/§2.8、`docs/core/design/ADVISOR-GUARDS.md` §1.2、批档 §2.2、`docs/core/design/API-CONTRACT.md` 生成区）本席一字未改，坐标见 §5.6。
- RTM 三行的「结果」列未填（`待执行`）：收口跑归父侧。

## §6 验证与收口（父代理）

### 6.12 交付与父侧复跑（收口轮）

**五面各自落在哪、按什么判、读数多少：**

| 面 | 落点 | 判据 | 父侧复跑 |
|---|---|---|---|
| `#1917` 收口回执按类分流 | `thincoder-core/agent-tools/batch-closeout.mjs:172`-`:184` | 建议句各贴其行、汇总行只点名 | `Select-String '没做完的'` ⇒ **0 命中** |
| `#1918` `待核销` 行有其自己的拒文 | `thincoder-core/agent-tools/batch-closeout.mjs:120`-`:125`（`R-G2b`） | 拒文逐字在位 | 本批单测 R19 整串断言（档已删，读数见 §5） |
| `#1919` 描述面逐边枚举 | `thincoder-core/tool-docs/ledger.md:3` | 逐边写全 6 条 + 两条非常规边带用途句 | `ALLOWED_MIGRATIONS` 零改（设计裁定） |
| `#1884` `§5` 门加判据 2 | `thincoder-core/agent-tools/batch-closeout.mjs:141`-`:152` + 谓词 `:110`-`:116` | 含 pass ∧ 不含打回；两者同携 ⇒ 判打回；无块照拒 | 集成本档 **fail 0**（14-1 ∥ 14-5 ∥ 14-8 三行改写后） |
| `#1885` 需求条目回填 | `thincoder-core/agent-tools/batch-skeleton.mjs:252`（`lastRoundBlock`）+ `thincoder-core/agent-tools/design-token.mjs:115`（`VERDICT_PASS_LINE` 导出） | 锚零复制、块判定单源 | 同上 |

**仓根集成层**：`node test/run.mjs` ⇒ **fail 0**（§5 记 79/79，本轮回读一致）。

**零留存**：本批单测档 `docs/batches/2026-11-01-ledger-contract-five-faces.test.mjs` 已按纪律删除，读数留 §5 一行。

### 6.13 修正轮三条上抛的处置

**① 我的改动被并进了别人的提交（`474cc364`）** —— **这笔是我的错**（那条提交没带路径，`add -A` 把 19 档扫进去了）。

- **不 amend、不拆分**：改写历史比这条错的代价大；
- **处置**：本批的交付由**下一条限路径提交**记名（`thincoder-core/agent-tools/*` 三档 + `thincoder-core/tool-docs/ledger.md` + 集成本档 + 本批档）；
- **改后的规矩**：本仓提交一律带 `path`，临时件落 `.thincoder/tmp/`。

**② `R-G2b` 在「`§3` 无任何轮次块」时渲染成「第 0 轮」** —— 设计只给了一段逐字拒文，加第二个字面就是实施席自己发明措辞，**它没有自造，这个边界守对了**。

- **机制无损**：照拒、字节不变；
- **措辞不准**：「无块」说成「有块无裁定」；
- **处置**：登 `#1945`，不在本批硬改（改它要新增一段拒文 = 新语义，走设计）。

**③ 别的席的档待收正**（实施席一个字没改，逐条处置如下）：

| 待收正项 | 处置 |
|---|---|
| 设计档 §2.2 行数读数与坐标是设计时值（终态 220 / 471 / 268 / 208；坐标 `:141`-`:152` / `:164`-`:185`） | 登 `#1946`（设计席笔） |
| §2.5 `:275` 与 `docs/core/design/ADVISOR-GUARDS.md` §1.2 的「代码随本批落」已成完成态 | 同上（`#1946`） |
| `docs/core/design/API-CONTRACT.md` 生成区缺两个新导出 | 同上（`#1946`） |
| 批档 §2.2 表未列 `test/RTM.md` | 同上（`#1946`，§2 是设计席段） |
| `test/RTM.md` 三行「结果」列仍 `待执行` | **用户签署面**，本批不代签（与 `#1921` 同口径） |
| `.thincoder/tmp` 里实施席留下的夹具目录 | **临时区、不进仓**；该区已积数千项历史档，**清它不属本批**，不动 |

### 6.14 集成集读数（本批增量）

**破 3 行**（14-1 ∥ 14-5 ∥ 14-8）已按设计档 §9 改写，**新增 0 行** —— 与 §2.4 的 delta（破 3 / 冗余 0 / 缺 0）一致。

**核对**：`node --test test/integration/batch-gates-reanchor.test.mjs` ⇒ **fail 0**；RTM 行号未变。
