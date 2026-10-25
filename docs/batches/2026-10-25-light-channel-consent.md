# 2026-10-25 · 轻通道准入改为用户放行（F-LC2）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 用户 2026-10-25 18:16「我现在觉得轻通道被滥用得厉害」→ 18:22「我觉得应该是你判断应该走轻通道时让我确认一次。」→ 18:22「开」。
> 台账 = #1792（LIGHT-CHANNEL · 归批）。前情 = 2026-10-25-spec-retire-cleanup.md（已收口 2026-10-25）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**已定决定**：轻通道准入从「主 agent 交底即走、用户可改判」改为「主 agent 交底 → **用户点头** → 才开工」；未点头 = 未获准入，默认回全链。 · 用户原话：「我觉得轻通道要用户授权这一点更合理。」→「我觉得应该是你判断应该走轻通道时让我确认一次。」→「开」 · 时间：2026-10-25 18:16–18:22

**为什么改（实证，非设想）**：

| 笔（2026-10-25） | 改的是什么 | 为什么越界 |
|---|---|---|
| `operand-count-sync` | 操作数族**六名 → 七名** | 改变「什么算指针」这个判据。台账 `#1775` 自己写着「属判据语义变更，须另批设计+评审」——下一轮仍走轻通道 |
| `acceptance-subset` | 三面提示词的**验收命令形** | 改变「怎样算通过」这个判据。设计档 §2.1 第二类明文「**限代码笔**（产品源文件，**不含提示词面**）」 |

当日 12 批档中 6 笔走轻通道，两笔越界。**不是判错边界**——`operand-count-sync` 那笔明知有疑仍走。

**根因**：判准入的人和放行的人是同一个。规则再细也拦不住——最后那一票在自己手里，而快一点是本能。收窄准入清单（A）、加自证句式（B）、大幅收缩（C）三个方案都不解决这一点，因为它们仍把尺子交给自己。

**改法**：判仍归主 agent（只有它看得到改动全貌），**放行票交用户**。判的人不自放。

**范围边界（不做）**：不动三样清单本体（§2.1 准入仍由主 agent 判）∥ 不动收尾全链（§2.3）∥ 不动机械门（核销标记）∥ 不动代码笔通路（§2.5）∥ 不改 `scope` 等参数面。**只改「谁放行」这一件。**

**已定决定（18:23 修正）**：不是「我提议轻通道 + 您点头」，而是**每笔开工前给选择题**——「A) 轻通道 ∥ B) 全链，走哪个？」，我附建议与理由但**建议不是默认**；两条路平等，您选定哪条走哪条；**未选定 ⇒ 不动**。 · 用户原话：「我觉得你应该的问题应该是让我选择走轻通道还是走全链。」 · 时间：2026-10-25 18:23

**为什么这个形更准**：点头是二元确认，它默认采纳被提议的那条——被问的人要拒绝得先想到拒绝。而「轻通道还是全链」里没有哪条是天然预设，两条路一起摆在台面上，选的才是真选。我上一版写「交底 → 等点头」，等于把轻通道设成了默认值，只是把否决权给了您——形似而神不是。

**修正要求（父侧核 · 2026-10-25 19:42 · 来源 = 设计评审轮次 2 的三条 New）**——三件，逐件给坐标与依据：

**① 🔴 增量表漏一处：`thincoder-core/prompts/discipline-engineering.md:102`**

设计档 §2.10 的 discipline 增量列了五处（`docs/core/design/LIGHT-CHANNEL.md:303`–`:307`：`:97` 首句 ∥ `:104` 走查点名归类 ∥ `:110` 附则指代 ∥ `:112` 轮次形指代 ∥ `:117` 行使线），**没有 `:102`**。

实读 `thincoder-core/prompts/discipline-engineering.md:102` 现文：

```
2. **Defect fix** — **a defect ⇒ walk** (the implementation contradicts an existing source: ...)
```

`a defect ⇒ walk` 是**路由语**（自动放行），与需求 §2.1 第 2 条的「**是缺陷即归此类**」（分类语）相抵；也与同清单已改的 `:104` 新文「whether to walk is still the user&apos;s pick」正面冲突——同一张清单里两条相邻项写相反的规则。

落地后缺陷修复笔（轻通道最常见的一类）仍会被自动放行，本批要治的正是这个。

**要求**：把 `:102` 补进增量表并改写成分类义（如 `a defect ⇒ goes up as item 2`，保留其括号内的定义半句），同步在 A2 增一条能捕获它的 grep（现 A2 的 `straight through` = 0 抓不到 `a defect ⇒ walk`）。

**② 🟡 `docs/core/design/LIGHT-CHANNEL.md:336` 与 `:283` 相抵**

`:336`（C4 行）：「轻通道笔做到一半发现改的是提示词面 ⇒ 停笔、报、**重给选择题**」
`:283`：「提示词面 ∥ 设计档面笔不入轻通道 ⇒ 提请句限定 **code pen**：这两面只有全链一条路，**不出一条无 A 项可选的选择题**」

同一情形（中途发现是提示词面），两条期望相反。**要求**：C4 的期望改成与该面一致形（只报全链去向、不出 A/B 题），或 `:283` 说明例外——二选一，档内一致。

**③ 🔵 `docs/core/design/LIGHT-CHANNEL.md:342` 勘察行读数**

勘察行写 `thincoder-core/prompts/persona-engineering.md:211-224`，而增量改到 `:227`（`:300` 的指代句）。**要求**：读数改 `:211-227`，覆盖所改末行。

**范围**：只改设计档 `docs/core/design/LIGHT-CHANNEL.md`（增量表 + C4 行 + 勘察行 + A2 断言）。**不动提示词档**（那是实施轮 eng-coder 的笔，逐字锚在 §2.10）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮次 1 的 9 条已逐条落（修正轮 4）· 交付前自检订正 1 条（修正轮 5：A1 的 choice question 计数 3 → 4）· 待复审（轮次 2））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**：台账 `#1792`（LIGHT-CHANNEL · 归批）——一件：轻通道准入的**放行票归用户**。路由由主 agent 拟成**选择题**（A 轻通道 ∥ B 全链，两条平等摆出，可附建议与理由但**建议不是默认**），**用户选定才开工**；**未选定 ⇒ 不动**（不是默认回全链，是等挑选）；中途越界 ⇒ 停笔重新给选择题。

**不覆盖（本批不做）**：三样清单本体（准入判据仍归主 agent 判，§1 范围边界）∥ 收尾全链 ∥ 核销机械门 ∥ 代码笔通路 ∥ `scope` 等参数面 ∥ 判据半句成分（命中三样①②③ ∥ 附则）。

**设计档落点**（`docs/core/design/LIGHT-CHANNEL.md`，本席本轮已落）：
- §2.1 行使面一句——路由 = 拟选择题、由用户选定；
- §2.2 整节重写（标题「交底」→「路由选择题」）——选择题句 ∥ 建议非默认 ∥ 未选定即不动 ∥ 越界重提请 ∥ 零链免提请；
- §2.10（新）——提示词面**逐字 EN 锚** + 受影响文件 + 验收 A1–A3 + 用例表 + 边界 + 先例行 / 勘察行；
- §3 落点表 + 咬合处置两行（确认与批准门 ∥ 父侧不代笔的条件面）；
- §4 ②（验收映射改选择题形）∥ §7 K4（重写）∥ §8（RTM delta = `none`，逐节对账已记）；
- `docs/core/design/PROMPT-SYSTEM.md` §6.12 分层归属一句同步（交底即行 → 选择题形）。

**机制**：判仍归主 agent（只有它看得到改动全貌），放行票交用户——判的人不自放（根因见 §1）。选「选择题」而非「请点头」：点头是二元确认、默认采纳被提议的那条；选择题无天然预设（设计 §2.2 末段）。
**判定句**：会话记录抽查——每笔开工前必见选择题（两条路由 + 改面 + 射程 ∥ 回退）与用户选定；无「未出选择题即开工」的笔（回指需求 §2.2 判定句 ∥ §4 ②）。

**受影响文件与测试覆盖**（现量 = 本轮实读）：

| 文件 | 现量 | Δ | 面 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 459 行 | 轻通道块段内改写 ⇒ ±0 行 | 提示词面（**实施轮 eng-coder 落笔**，逐字锚 = 设计 §2.10） |
| `thincoder-core/prompts/discipline-engineering.md` | 349 行 | 两处句内改 ⇒ ±0 行 | 同上 |
| `docs/core/design/LIGHT-CHANNEL.md` | 397 行 | 六节落笔 | 设计档（本席笔） |
| `docs/core/design/PROMPT-SYSTEM.md` | 4,403 行 | 一句 ⇒ ±0 行 | 设计档（本席笔） |

**测试覆盖**：本批零可执行面（提示词正文 + 设计档）⇒ **无单元测试档**；验收读数 = 三条 grep（下）。集成测试 = `none`：组件之间的交互零改、既有用例所断言的业务可观察结果零改（需求 F34 两维都未触及）；RTM（`test/RTM.md`）逐节对账 = 破行 0 / 冗余 0 / 新增 0（细目 = 设计 §8 末段）。
**§5 并非不适用**：提示词面 = 产品代码面（D1）⇒ 本批有实施段（eng-coder 照设计 §2.10 逐字落笔）。

**验收对照**：

| # | 需求回指 | 判法 / 读数 |
|---|---|---|
| A1 | 需求 §4 ②、§2.2 判定句 | `grep -c "disclose-then-go" thincoder-core/prompts/*.md` = 0；`thincoder-core/prompts/persona-engineering.md` 含 `choice question` ∥ `No pick ⇒ nothing moves` ∥ `a recommendation is not a default` 各恰 1 |
| A2 | 需求 §2.1 边界句 | `grep -c "the user can overrule" thincoder-core/prompts/discipline-engineering.md` = 0；同档含 `nothing moves before the pick` ∥ `put it up as a choice` 各恰 1 |
| A3 | 需求 §1 模块目标 | 设计档扫 `交底即行` = 0 ∥ `用户可改判` = 0；§2.1 行使面 ∥ §2.2 皆述「未选定即不动」（本轮已实读核对） |

**关键决策**：① 选择题而非点头（需求 §2.2 同句；设计 §7 K4 重写）；② 设计档 §2.2 整节重写而非增句——旧句「交底即行 / 用户一票改判」是失效表达，按 D8 删除、不留对照；③ 提示词面只改两档三处，不动 `common.md`（该面零轻通道句——本轮 grep 实读确认）。

**上抛项**：
1. 〔父侧 · 需求档笔〕`docs/core/requirements/METHODOLOGY.md:65` 铁律④单源句现为「**默认全流程；分流只走轻通道（每笔交底、用户可改判）**……」——其中「用户可改判」= 交底即行时代的措辞，与现义（选择题 + 选定才动）相抵；同档 `:69`「出口只此一条，且须交底」同族。需求档笔 = 主 agent，本席未改。
2. 〔父侧 · 措辞确认〕需求 `LIGHT-CHANNEL.md:21`「该走的三样（正面清单——命中即走）」仍留「命中即走」；本席按 §2.1 边界句（`:32`「未选定即不动」）读为「命中 = 建议该路，选定才走」，未据此改需求档。若父侧认为「命中即走」读不出这层，需改写该括注。
3. 〔父侧 · 提示词落笔〕`thincoder-core/prompts/**` 落笔 = 实施轮 eng-coder（逐字锚住在设计 §2.10，实施席照落、不另行改写）。

**§2 订正（同轮 · 现量读数复核后）**：上文受影响文件表的行数按**当轮实读复核**订正为——`thincoder-core/prompts/persona-engineering.md` = 458 行 ∥ `thincoder-core/prompts/discipline-engineering.md` = 348 行 ∥ `docs/core/design/LIGHT-CHANNEL.md` = 461 行（含本批落笔）∥ `docs/core/design/PROMPT-SYSTEM.md` = 4,402 行；读法 = `[System.IO.File]::ReadAllText` + `split(/\r?\n/)` 计数。设计档 §2.10 表与 §8 同轮已按同一读数收正（`设计档一档` → `设计档两档`）。判定与条目不变。

**§2 修正轮（按父侧 fix 清单 1–10 逐条落）**：设计档 `docs/core/design/LIGHT-CHANNEL.md` 11 处句内改，行数 ±0（上一轮订正读数不变）；判定与条目不变。受影响文件表「六节落笔」随本轮扩为：§1 定位 ∥ §2.1 ∥ §2.3 ∥ §2.6 ∥ §2.8 边界 ∥ §3 咬合表 ∥ §4 ④ ∥ §7 K10（上一轮 = §2.1 行使面 ∥ §2.2 ∥ §2.10 ∥ §3 ∥ §4 ② ∥ §7 K4 ∥ §8）。

| # | 落点 | 改动 |
|---|---|---|
| 1 | `docs/core/design/LIGHT-CHANNEL.md:12` | 「是缺陷就走」→「是缺陷即归此类」（去动作义，改为归类） |
| 2 | `:18` | 「命中即走」→「命中 = 该路值得作为选项提出，走不走由用户选定」 |
| 3 | `:24` | 同 2 口径（正面清单括注） |
| 4 | `:34` | 「交底自带「可 revert」」→「选择题自带「可 revert」」 |
| 5 | `:56` | §1 收录项「交底」→「选择题与选定」 |
| 6 | `:140` | §2.6 段表 §1 行同上改 |
| 7 | `:184` | §2.8 判断面「∥ 交底」→「∥ 选择题与选定」 |
| 8 | `:411` | K10 理由列「命中即走」→ 同 2 口径 |
| 9 | `:369` | 验收 ④「重交底」→「重给选择题」 |
| 10 | `:28` | 「是缺陷就走」→「是缺陷即归此类」——与 1 同句同改（需求 §2.1 条目②已为「是缺陷即归此类」） |
| 10 | `:353` | §3 咬合表打标义务句「随逐笔交底」→「随逐笔选择题与选定」 |

**复扫读数（本轮实跑 · 逐字计数）**：`命中即走` = 0 ∥ `重交底` = 0 ∥ `交底` = 4，皆改动史 ∥ 扫描目标描述，按父侧口径保留——`:281`（落点段名「轻通道块——交底段改选择题形」）· `:309`（变更描述「§6.12 …（交底即行 → 选择题形）」）· `:317`（A3 验收的扫描字面「设计档扫 `交底即行` = 0」）· `:330`（变更描述「本批只换句法：交底句 → 选择题句」）。`用户可改判` 仅 `:317` 扫描字面 ∥ `就走` 仅 `:45`（§2.2「用户选定哪条就走哪条」——选定后才走，现行句）。`用户可改判` / `交底即行` 在其余位 = 0。doc_check gate = PASS（0 命中）。

**未改 · 上抛父侧裁**：`docs/core/design/LIGHT-CHANNEL.md:30`（§2.1 条目③「细节类默认直行」）与需求档 `docs/core/requirements/LIGHT-CHANNEL.md:25` 为同句——「默认直行」给细节类留了一条默认路，与「未选定即不动 ∥ 无天然预设」相抵。不在本 fix 清单内，且需求档同句未改（父侧本轮已改的六处不含该句）⇒ 本席未动；是否两档同改待父侧裁定。

**§2 修正轮 3（单条 fix · 父侧裁定 = 两档同改）**：设计档 `docs/core/design/LIGHT-CHANNEL.md:30`（§2.1 条目③「走查当场点名」）改为与需求档 `docs/core/requirements/LIGHT-CHANNEL.md:25` **同句逐字对齐**。新句 = 「按前两样归（细节类按第 1 类提请；行为类按第 2 类提请）——两类都只是「归到哪条」，**走不走仍由用户选定**。」——「默认直行」这一条给细节类留的默认路随之删除（与「未选定即不动 ∥ 无天然预设」不再相抵）。

行数 ±0；本批条目、判定句、验收 A1–A3 皆不变；上一轮「未改 · 上抛父侧裁」一条就此关闭（裁定 = 两档同改，父侧已改需求档、本席落设计档）。

**复扫读数（本轮实跑）**：设计档全档 `默认直行` = 0（grep 无命中）；`docs/**` 全域仅本批档 `:96` 一处为上一轮上抛行的改动史记述（保留，属记录面）。doc_check gate = PASS（显式 1 档 · 0 命中）。

**§2 修正轮 4（设计评审 §3 轮次 1 · 9 条逐条落）**：父侧裁定 = 9 条全部接受；8 条落设计档 `docs/core/design/LIGHT-CHANNEL.md`（#7 的需求档取代注 = 父侧已落，本席未动需求档）。设计档 461 → 471 行（内容行数）。

| # | 落点（设计档 · 落笔后行号） | 改动 |
|---|---|---|
| 1 | `:302-308` ∥ `:326` | discipline 增量「两处」→ 五处：补 `:104` 走查点名归类（`detail class straight through by default` ⇒ `detail class goes up as item 1; behavior class goes up as item 2 … whether to walk is still the user's pick`）；A2 增 `straight through` = 0 |
| 2 | `:297-300` ∥ `:325` | persona 两处指代：`:223` `the disclosure's "this pen = light channel"` ⇒ `the pick's "A) light channel"`；`:227` `(disclosure · change · walkthrough · freeze;` ⇒ `(the choice question and the pick · change · walkthrough · freeze;`。discipline `:110` ∥ `:112` 归入五处增量（`disclosure` ⇒ `the choice question`）。A1 逐条列四处旧串 = 0 + `disclos` 读数 |
| 3 | `:325` | A1 计数改读：`both routes on the same line` 恰 1（单次串）；`choice question` = 3（落笔块内三处）作副读数 |
| 4 | `:319` ∥ `:327` | PROMPT-SYSTEM 行删「交底即行」字样（⇒「改为选择题形」）；A3 由「全档 = 0」改为命中行集判据（仅本行 = 扫描字面，余行命中 ⇒ 红） |
| 5 | `:285` ∥ `:325` | 替换域写成行域「第 211 行整行起至第 217 行末」+ 明写旧头随整行删除、不叠新头；A1 增 `hit one of the three ⇒ walk` = 0（两档逐档） |
| 6 | `:283` ∥ `:288` | 落笔句收窄 `before each **code** pen`；§2.10 正文补面界依据一行（提示词面 ∥ 设计档面只有全链一条路） |
| 7 | `:416`（K4 理由列） | 补取代关系：本裁取代需求档来源行「走查反馈明示轻通道」原话的直通义——走查点名仍按三样清单归口，走不走由用户选定（需求档一侧父侧已落） |
| 8 | `:457` ∥ `:461` ∥ `:469` | 窗口读数 5 档 15 例 → **7 档 22 例**（逐档补 `review-doc-scope` 4 ∥ `batch-close-gate` 3）；`:461`「CLI 节 5 节 15 例」→「CLI 端 7 个故事节 22 例」；`:469` 补故事 6 ∥ 7 的断言面 |
| 9 | `:312` ∥ `:316` ∥ `:317` | 口径写明「内容行数，不含末尾空行；`split(/\r?\n/).length` 因末尾换行各 +1 = 459 ∥ 349」；同行副读数「6 行 → 6 行」订正为「7 行 → 7 行」（旧块 = 第 211–217 行，共 7 行） |

**复扫读数（本轮实跑）**：设计档 `交底即行` = 1 ∥ `用户可改判` = 1（皆 A3 本行 = 扫描字面，余行 0）；`落点两处` = 0 ∥ `6 行 → 6 行` = 0；`disclose-then-go` = 0（仅 A1 扫描字面）；`hit one of the three ⇒ walk` = 3（`:285` 旧头引 ∥ `:304` 旧串 ∥ `:325` 扫描字面）；`straight through` = 2（`:305` 旧串 ∥ `:326` 扫描字面）。设计档现量 = 471 行；提示词两档现量 = 458 ∥ 348 行（`split` 读数 459 ∥ 349）。doc_check gate（设计档）= PASS（0 命中）。

**提示词两档 `disclos` 命中（落笔前实读 · 行号 → 处置）**：persona = `:44`(1) ∥ `:211`(2) ∥ `:214`(1) ∥ `:216`(1) ∥ `:217`(1) ∥ `:223`(1) ∥ `:227`(1) ∥ `:346`(2)——`:211` ∥ `:214` ∥ `:216` ∥ `:217` 随第 211–217 行整段替换消失，`:223` ∥ `:227` 随指代句消失 ⇒ 余 `:44` ∥ `:346`(2) 共 2 行 3 处（交付缩减面 ∥ 文件域声明面，非轻通道路由义）；discipline = `:110`(1) ∥ `:112`(1) ∥ `:117`(1)——三处随五处增量全清 ⇒ 0。

**验收预期读数（落地后实跑 · A1–A3）**：

| 断言 | 命令（工作目录 = `thincoder/`） | 期望 |
|---|---|---|
| A1 | `grep -c "disclose-then-go"` 两档逐档 | 0 |
| A1 | `grep -c "hit one of the three ⇒ walk"` 两档逐档 | 0 |
| A1 | `grep -c "both routes on the same line" thincoder-core/prompts/persona-engineering.md` | 1 |
| A1 | `grep -c "choice question"` 同档 | 3 |
| A1 | `grep -c "No pick ⇒ nothing moves"` ∥ `a recommendation is not a default` 同档 | 1 ∥ 1 |
| A1 | 四处旧指代串（persona `the disclosure's "this pen = light channel"` ∥ `per-pen entries in §1 (disclosure`；discipline `(the disclosure carries "revertable"` ∥ `(per-pen entries: disclosure`） | 各 0 |
| A1 | `grep -c "disclos"` discipline ∥ persona | 0 ∥ 2 行 3 处（`:44` ∥ `:346`） |
| A2 | `grep -c "the user can overrule"` ∥ `grep -c "straight through"` discipline | 0 ∥ 0 |
| A2 | `grep -c "nothing moves before the pick"` ∥ `grep -c "put it up as a choice"` 同档 | 1 ∥ 1 |
| A3 | `grep -n -e "交底即行" -e "用户可改判" docs/core/design/LIGHT-CHANNEL.md` | 命中行集 = 仅 A3 本行 |

**未覆盖 · 上抛父侧**：批次档自身的 doc_check gate 命中（24 条 = 既有、落于 §1 ∥ §2 前轮 ∥ §3 段：悬空裸档名如 `LIGHT-CHANNEL.md` ∥ `common.md`，超长段 `:76` ∥ `:94` ∥ `:122`）——非本席本轮改动引入；§3 段属评审笔、§1 属父侧笔 ⇒ 本席未动。设计档一档 gate = PASS。

**§2 修正轮 5（交付前自检 · 一条 count 订正）**：A1 的 `choice question` 计数原写 3，与落笔后实读不符——系数修正轮 4 两笔叠加所致（#2 把 `thincoder-core/prompts/persona-engineering.md:227` 的指代改为 `(the choice question and the pick · …)`；#3 把该计数由 1 改 3）⇒ 落笔块内三处 + `:227` 一处 = **4 行 4 处**。设计档 A1 行已改为 4（补落点注 `:227`），行数 ±0。只改验收读数；判据、条目、判定句皆不变。

- **A1 实跑读数（模拟落笔：按逐字锚替换两档后计数；`grep -c` 语义 = 命中行数）**：`disclose-then-go` 0 ∥ `hit one of the three ⇒ walk` 0 ∥ `both routes on the same line` 1 ∥ `choice question` **4** ∥ `No pick ⇒ nothing moves` 1 ∥ `a recommendation is not a default` 1。
- **A1 续（旧串与 `disclos`）**：四处旧指代串各 0；`disclos` = `thincoder-core/prompts/persona-engineering.md` 2 行 3 处（`:44` ∥ `:346`）· `thincoder-core/prompts/discipline-engineering.md` 0。
- **A2 实跑读数（同法）**：`the user can overrule` 0 ∥ `straight through` 0 ∥ `nothing moves before the pick` 1 ∥ `put it up as a choice` 1。
- **落笔后行数**：两档各 458 ∥ 348（±0，与设计档 §2.10 表一致）；落笔前现量同值——`thincoder-core/prompts/` 实读旧串仍在（提示词面尚未落笔，§5 待 eng-coder）。
- **§8 读数复核（实读）**：集成集 = `test/integration/` 7 档 22 例（`advisor-timeout-hot` 3 ∥ `anthropic-tool-roundtrip` 3 ∥ `batch-close-gate` 3 ∥ `browser-start-window` 3 ∥ `review-doc-scope` 4 ∥ `unbooked-pen` 3 ∥ `web-backend-404` 3）；`test/RTM.md` = CLI 端 7 个故事节 + 22 行，另 VS Code ∥ Desktop ∥ 异常与更正 ∥ 签署面四节 ⇒ 设计档 §8 的 7 档 22 例 ∥ 7 故事节成立。
- **同步面复核**：`docs/core/design/PROMPT-SYSTEM.md` 的 `### 6.12` 在 `:353`、分层归属句 `:361` 已为选择题形 ⇒ 修正轮 4 #4 落点成立。
- **上抛项 1 关闭**：`docs/core/requirements/METHODOLOGY.md:67` ∥ `:71` 已为选择题形（父侧已落需求档）。

**§2 修正轮 6（设计评审 §3 轮次 2 · 三条 New 逐条落 · 父侧 §1「修正要求」19:42）**：只改设计档 `docs/core/design/LIGHT-CHANNEL.md`，现量 **472 行**（内容行数；`split(/\r?\n/).length` = 473）。本批条目、判定句、A1 读数皆不变；A1 的 `choice question` = 4 仍成立（本轮未动 persona 逐字块的可数串）。

| # | 落点（落笔后行号） | 改动 |
|---|---|---|
| ①🔴 | `:281` ∥ `:302` ∥ `:318` | discipline 增量「五处」→「**六处**」（三处口径同改） |
| ①🔴 | `:305` | 新增第六处：`:102` `**a defect ⇒ walk**` ⇒ `**a defect ⇒ goes up as item 2**`——括号内定义半句原样保留；路由语改分类语，与 `:104` 的 `whether to walk is still the user's pick` 同向 |
| ①🔴 | `:304` | `:97` 增量由「首句」扩为**整行**改写：除首句外补行末 `— walks this channel.` ⇒ `— is put up as a choice question; it moves only after the pick.`（同一行的另一条无条件放行句，评审 #10 明列「:97 后半亦为无条件句」） |
| ①🔴 | `:327`（A2 行） | 增三条读数：`⇒ walk` = 0（一条即同捕 `:97` 首句 ∥ `:102` 路由语，正是父侧点名「`straight through` 抓不到」的那串）∥ `walks this channel` = 0 ∥ 含 `a defect ⇒ goes up as item 2` 恰 1 |
| ②🟡 | `:337`（C4 行） | 期望改为面界一致形：停笔、报；**不出 A/B 题**、只报全链去向，按全链处置（§2.10 面界 ∥ §2.2 越界限定）——取「改 C4」这一支 |
| ②🟡 | `:46`（§2.2 越界行） | 补同一例外：落到提示词面 ∥ 设计档面 ⇒ 不出 A/B 题、只报全链去向。**不加则同一情形在档内仍有两条相反期望**（`:46` 说重给选择题、`:283` 说不出题）——C4 只是它的用例行 |
| ②🟡 | `:293`（EN 逐字块越界行） | 同一情形的**落笔位**补半句例外：落到提示词面 ∥ 设计档面 ⇒ 回全链、不出题。**不加则落笔后提示词仍写 re-ask**，`acceptance-subset` 那类笔照旧会被自动放行——本批要治的就是这个 |
| ③🔵 | `:343`（勘察行） | `persona-engineering.md:211-224` ⇒ `:211-227`，覆盖所改末行（`:227` 指代句） |
| 附 | `:354`（§3 落点表 persona 行） | 内容清册补「面界例外 = 回全链、不出题」——否则清册与逐字块内容不符 |
| 附 | `:319`（受影响文件表自身行） | 设计档现量 471 → 472 行 |

**预期读数（本轮实跑 · 模拟落笔：按逐字锚在内存替换两档后计数，未改提示词档）**：persona = `disclose-then-go` 0 ∥ `hit one of the three ⇒ walk` 0 ∥ `both routes on the same line` 1 ∥ `choice question` 4（落于 `:211` ∥ `:216` ∥ `:217` ∥ `:227`）∥ `No pick ⇒ nothing moves` 1 ∥ `a recommendation is not a default` 1 ∥ 两处旧指代串各 0 ∥ `disclos` 2 行 3 处（`:44` ∥ `:346`）；discipline = `the user can overrule` 0 ∥ `straight through` 0 ∥ **`⇒ walk` 0** ∥ **`walks this channel` 0** ∥ `nothing moves before the pick` 1 ∥ `put it up as a choice` 1 ∥ **`a defect ⇒ goes up as item 2` 1** ∥ `disclos` 0；两档行数 ±0（458 ∥ 348 内容行）。
**复扫读数（设计档自身）**：`五处` = 0 ∥ `211-224` = 0 ∥ `六处` = 3（`:281` ∥ `:302` ∥ `:318`，与增量表 6 条 bullet 逐条相容）。doc_check gate（设计档）= **PASS（0 命中）**。

**两处附加改动的依据**：`:97` 行末 ∥ `:293` 半句均非新语义——前者是评审 #10 逐字点名却未进父侧 ① 清单的同句半截，后者是 ② 的同一冲突落实施逐字块后的同一形；两处都只是把已裁定的「未选定即不动 ∥ 无 A 项可选的选择题不成立」写到它必须出现的位。不加则本轮修完，档内（∥ 落笔后的提示词）仍自相矛盾。

**上抛父侧 · 需求档笔（一条，未改）**：`docs/core/requirements/LIGHT-CHANNEL.md:42`「**中途越界 ⇒ 停笔重提请**：干到一半发现超出所选路线的边界 ⇒ 立刻停、报、重新给选择题」无面界例外，而同档 `:33`「轻通道只作用于**代码笔**——提示词面 ∥ 设计档面 ∥ 需求档面不入直改」已定面界。设计档本轮按 `:33` 定形（`:46` ∥ C4 ∥ 逐字块 `:293`）；需求档 `:42` 是否补同一半句 = 父侧笔。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · 轻通道准入改「选择题 + 用户选定」**（对象 = 需求档 §1/§2.1/§2.2/§4② + 设计档 §2.2/§2.10/§3/§4②/§7 K4/§8；排除 = 提示词面落笔）

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 需求覆盖 | 🔴 | 落笔面缺一处：`thincoder-core/prompts/discipline-engineering.md:104`「detail class straight through by default」不在 §2.10 的两处增量内（`docs/core/design/LIGHT-CHANNEL.md:295` 明写「两处」＝首句 ∥ 行使线）——该句是旧「交底即行」的直通预设，与设计档 `LIGHT-CHANNEL.md:30`「走不走仍由用户选定」相反；落地后提示词面仍预放行走查点名的细节笔 | 在 §2.10 的 `discipline-engineering.md` 增量里补第三处：把 `:104` 括注改为「按前两样归（细节类按第 1 类提请；行为类按第 2 类提请）」，并在 A2 增一条 `straight through` = 0 的 grep |
| 2 | 需求覆盖 / 落笔完整 | 🟡 | 替换后仍留四处「disclosure」指代已取消的步骤：`prompts/persona-engineering.md:223` ∥ `:227`、`prompts/discipline-engineering.md:110` ∥ `:112`；而记录形已是「选择题与选定」（`LIGHT-CHANNEL.md:140`）。A1（`:315`）只扫 `disclose-then-go`，这四处能通过验收 | 把四处一并列入 §2.10 增量（disclosure → the pick ∥ the choice question），A1 的扫词扩到 `disclos` 前缀或逐条列出四个落点 |
| 3 | 验收 | 🟡 | A1（`LIGHT-CHANNEL.md:315`）断言 `persona-engineering.md` 含 `choice question` 恰 1；设计档自己的逐字块在 `:286` ∥ `:291` ∥ `:292` 三行各含一次 ⇒ 落地后 `grep -c` = 3，该断言恒红 | 计数改 3，或换成只出现一次的串（如 `both routes on the same line` 恰 1）作断言 |
| 4 | 验收 | 🟡 | A3（`LIGHT-CHANNEL.md:317`）断言「设计档扫 `交底即行` = 0」，但同档 `:309`（PROMPT-SYSTEM 行的 Δ 说明）与 A3 本行都含该串 ⇒ 断言对自己恒红 | 收窄扫描域并写明域（如「§1–§3 正文」），或删 `:309` 的该字样（改为「§6.12 分层归属一句（改为选择题形）」） |
| 5 | 清晰度 | 🟡 | 替换域起点落在行中：`LIGHT-CHANNEL.md:283` 写「before each pen, a one-line disclosure — disclose-then-go …」起，而替换块（`:286`）以整条 bullet 头起 ⇒ 照字面执行会保留旧头「hit one of the three ⇒ walk」并再叠一条新头；A1 ∥ A2 都不扫 `⇒ walk`，此形态能过验收 | 替换域写成「第 211 行整行起至第 217 行末」，并在 A1 增 `hit one of the three ⇒ walk` = 0 |
| 6 | 范围 / 清晰度 | 🟡 | 逐字块（`LIGHT-CHANNEL.md:286`）写「before each pen, put the route to the user as a choice question」，而轻通道只作用于代码笔（`:35`）；提示词面 ∥ 设计档面笔上 A 项不可用却仍出两张路——即需求档 `:45` 记的 `acceptance-subset` 形态 | 该句收窄为「before each **code** pen」，或同块补半句「doc-face ∥ prompt-face pens take the full chain — no choice question」 |
| 7 | 文档状态 | 🟡 | 需求档 `:7` 仍把「走查反馈明示轻通道」作为现行原话记录，而 `:25` 已改为「走不走仍由用户选定」；设计档按后者落地（`:30`）却未记取代关系 ⇒ 同一机制两条互斥路由规则同时在线 | K4（`LIGHT-CHANNEL.md:406`）补一句本裁取代该则原话，并在需求档 `:7` 该则后标「（现行 = 选择题——§2.2）」 |
| 8 | 数字读数 | 🔵 | §8 窗口读数（`LIGHT-CHANNEL.md:447`）「集成集现量 5 档 15 例」与盘上不符：`thincoder/test/integration/` 现 7 档（多 `review-doc-scope.test.mjs` ∥ `batch-close-gate.test.mjs`），RTM 登记 7 个 CLI 故事 22 行；同节 `:451` 仍写「CLI 节 5 节 15 例」，与 `:457` 的「7 个 CLI 故事节」自相矛盾 | :447 ∥ :451 刷成 7 档 / 22 例，并按故事 6 ∥ 7 补对账行 |
| 9 | 数字口径 | 🔵 | 受影响文件表（`:306` ∥ `:307`）报 458 ∥ 348 行，而同表声明口径为 `split(/\r?\n/).length`（`:302`）——按该口径两档为 459 ∥ 349（读档工具同报 459 ∥ 349） | 统一口径并在表头写明「= 内容行数（不含末尾空行）」 |

**已核通过面**：§8 路由选择题批判定 `none`（`:455-461`）起步于 `test/RTM.md` 的逐节对账，理由 = 组件交互零改 ∧ 既有用例断言的业务可观察结果零改（唯一成立形）；实读 `thincoder/test/RTM.md` = 7 个 CLI 故事 + VS Code ∥ Desktop ∥ 异常与更正 ∥ 签署面，无一行断言路由问句或提示词正文 ⇒ 对账成立。先例行（`:330`）∥ 勘察行（`:332`，含 `index.publicRepos: []`）在场。文档归属：`thincoder/docs/README.md:79` 确认 `LIGHT-CHANNEL.md` 为拥有档、`:51` 确认 `PROMPT-SYSTEM.md` 拥有提示词系统面 ⇒ 无新档、无主题碎片化。（评审上下文报「无文档地图」——地图实存于 AGENTS.md 指定的 `thincoder/docs/README.md`。）
**计数**：🔴 1 ∥ 🟡 6 ∥ 🔵 2（共 9）

VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审 · 轻通道准入改「选择题 + 用户选定」（F-LC2）**｜对象 = 需求档 §1/§2.1/§2.2/§4② + 设计档 §2.2/§2.10/§3/§4②/§7 K4/§8｜对象状态 = 待评审

**第 2 轮复核**：上轮 9 条（🔴1 / 🟡6 / 🔵2）逐条对现文核过 —— **全部 Fixed**（依据 = 设计档现文 471 行实读 ∥ 两档提示词在盘实读 ∥ `test/integration/` 7 档实读）。本轮新增 3 条（🔴1 / 🟡1 / 🔵1）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/LIGHT-CHANNEL.md | 🔴 | Fixed | `:104` 归类句已入增量（设计档 :305 逐字给出 ⇒ 新文「detail class goes up as item 1 … whether to walk is still the user's pick」）；文件表 :317 记「五处」；A2（:326）加 `straight through` = 0。与需求 :24 ∥ 设计 :28 一致 |
| 2 | 2 | docs/core/design/LIGHT-CHANNEL.md | 🟡 | Fixed | 旧步骤名清扫成篇：persona `:223` ∥ `:227`（:299-300）与 discipline `:110` ∥ `:112`（:306-307）；A1（:325）四处旧串各 = 0。实读核：`disclos` 在 persona 现 8 行（44/211/214/216/217/223/227/346），落入增量的 6 行全清 ⇒ 余 `:44` ∥ `:346` = 2 行 3 处，与 A1 数值逐字相符；discipline 三行（110/112/117）全在增量内 ⇒ 全档 = 0 |
| 3 | 3 | docs/core/design/LIGHT-CHANNEL.md | 🟡 | Fixed | A1 改为 `choice question` = 4（落笔块三处 + `:227` 一处）——实读验证：块内 :288 ∥ :293 ∥ :294 各一次 + `:227` 一次 = 4，可满足 |
| 4 | 4 | docs/core/design/LIGHT-CHANNEL.md | 🟡 | Fixed | A3 改为「命中行集 = 仅本行」；grep 实读：`交底即行`／`用户可改判` 全档仅命中 :327 本行 ⇒ 断言可满足（原 :309 的该字样已删） |
| 5 | 5 | docs/core/design/LIGHT-CHANNEL.md | 🟡 | Fixed | 替换域改写为「第 211 行整行起至第 217 行末」+「旧头随整行删除，不叠新头」（:285）；A1 加 `hit one of the three ⇒ walk` = 0 ⇒ 旧头再留存即红 |
| 6 | 6 | docs/core/design/LIGHT-CHANNEL.md | 🟡 | Fixed | 提请句限定 code pen：:283 出半句（提示词面 ∥ 设计档面「不出一条无 A 项可选的选择题」），逐字块 :288 落为「before each **code** pen」 |
| 7 | 7 | docs/core/requirements/LIGHT-CHANNEL.md | 🟡 | Fixed | 需求 :7 该则原话后补「该则随之改形……现行 = §2.2」；设计 K4（:416）补「本裁取代需求档来源行……的直通义」⇒ 两条规则不再并列在线 |
| 8 | 8 | docs/core/design/LIGHT-CHANNEL.md | 🔵 | Fixed | 窗口读数刷为 7 档 22 例（:457，3+3+3+3+3+4+3 = 22）；`test/integration/` 实读 7 档（含 `review-doc-scope` ∥ `batch-close-gate`）相符；:461 的 RTM 索引同步为「7 个故事节 22 例」 |
| 9 | 9 | docs/core/design/LIGHT-CHANNEL.md | 🔵 | Fixed | :312 写明口径「内容行数，不含末尾空行」+ 另一读数（split = 459 ∥ 349）；读档工具总行数 459 ∥ 349 相符，458 ∥ 348 为内容行数 |
| 10 | (new) | thincoder-core/prompts/discipline-engineering.md | 🔴 | New: 自动路由语只清了一半 | `:102`「**a defect ⇒ walk** (the implementation contradicts an existing source」仍在，而 :104 已改为「whether to walk is still the user's pick」——同一张清单相邻两条互斥；`**Light channel …**: any one of the three named cases … walks this channel.`（:97 后半）亦为无条件句。设计档增量只列五处（:302-308），A2（:326）无一条 grep 能捕获「a defect ⇒ walk」⇒ 落地后提示词面仍预放行缺陷修复笔（最常见的一类） |
| 11 | (new) | docs/core/design/LIGHT-CHANNEL.md | 🟡 | New: 代码笔限定与 C4 相抵 | C4（:336）期望「停笔、报、重给选择题」，而 :283 规定提示词面笔「不出一条无 A 项可选的选择题」——同一情形两条规则：重给选择题（无 A 项）vs 不出题 |
| 12 | (new) | docs/core/design/LIGHT-CHANNEL.md | 🔵 | New: 勘察行读数未随增量更新 | :342 记实读 `persona-engineering.md:211-224`，而增量改到 `:227`（:300）——读面读数应覆盖所改末行 |

**计数**：本轮 🔴 1 ∥ 🟡 1 ∥ 🔵 1（新增）；上轮 9 条 = 9 Fixed ∥ 0 Accepted ∥ 0 Unfixed。

VERDICT: changes-required

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

## 验证（父侧亲跑）

**改动面**：需求 2 档（`LIGHT-CHANNEL.md` · `METHODOLOGY.md`）+ 设计 1 档（`LIGHT-CHANNEL.md`）+ `PROMPT-SYSTEM.md:361` 一句同步（设计席笔）。

**判据面清零核验（父侧实跑逐字计数）**：

| 串 | 需求档 | 设计档 | 说明 |
|---|---|---|---|
| `命中即走` | 0 | 0 | 旧准入语——已全部改为「该路值得作为选项提出，走不走由用户选定」 |
| `默认直行` | 0 | 0 | 旧默认路——已改为「按第 1/2 类提请，走不走仍由用户选定」 |
| `用户可改判` | 0 | 1 | 设计档仅存 `:317` 验收 A3 的**扫描字面**（该条本就是「扫 `用户可改判` = 0」），保留正确 |
| `交底` | 0 | 4 | 设计档 4 处全为改动史/落点描述（`:281` `:309` `:317` `:330`），非规范位 |

**两档逐字一致**：需求 `:25` 与设计 `:30` 的条目③ 为同一句（「细节类按第 1 类提请；行为类按第 2 类提请——两类都只是「归到哪条」，走不走仍由用户选定」）。

**doc_check（四档，逐档跑）**：`LIGHT-CHANNEL` 需求 0 · `LIGHT-CHANNEL` 设计 0 · `PROMPT-SYSTEM` 0 · `METHODOLOGY` 0。
`METHODOLOGY` 首跑 1 条（`:9` 存量段超长——改前即 1，非本批引入），按本批「碰档即整档入判」清掉：`:9`/`:11` 两处按句插空行，零字符改动。

**修正轮**：`#1` 设计初稿（六节）→ `#2` 十条判据位收正 + 2 处复扫 → `#3` 条目③「默认直行」两档同改。三轮逐条实读复核。

**测试行**：① 本批无代码面（纯文档机制改动），无单测档；② 集成集现量 **22 例 / 窗口 50–100**，本批无增删。

**§6 读数刷新（设计评审 #4 修正轮后 · 2026-10-25 18:44）**

上表那两行读数随修正轮漂移，以本段为准：

| 串 | 需求档 | 设计档（现 472 行） | 说明 |
|---|---|---|---|
| `交底即行` | 0 | **1** | 仅 A3 本行（`:327` 的扫描字面）——修正轮已删 `:319` 的同串 |
| `用户可改判` | 0 | **1** | 同上，仅 `:327` 扫描字面 |
| `命中即走` / `默认直行` | 0 | 0 | 不变 |
| `交底` | 0 | **2** | `:327` 扫描字面 ∥ `:340` 先例行描述——均非规范位 |
| `disclos`（提示词两档） | — | persona **2 行 3 处**（`:44` 交付缩减面 ∥ `:346` 文件域声明面）· discipline **0** | 轻通道块内 = 0 |

**评审处置**：`#4` 结论 changes-required（1🔴 6🟡 2🔵）→ 9 条全部裁定接受 → `#5` 修正轮逐条落地（行号落点见 §2「修正轮 4」段）→ 父侧逐条实读核过。

**评测方引用可读性（记录）**：`#4` 报告尾部标 `[host-verified] 0/5 citations match` + `file unreadable`——评审侧因会话锚为 workspace，相对路径解不出基底，未读到提示词两档。父侧逐行复核该 5 条引用（`persona:211/223/227` · `discipline:104/110`），**内容全部属实**，🔴 成立。
