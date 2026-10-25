# 2026-10-25 · 轻通道准入改为用户放行（F-LC2）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 用户 2026-10-25 18:16「我现在觉得轻通道被滥用得厉害」→ 18:22「我觉得应该是你判断应该走轻通道时让我确认一次。」→ 18:22「开」。
> 台账 = #1792（LIGHT-CHANNEL · 归批）。前情 = 2026-10-25-spec-retire-cleanup.md（已收口 2026-10-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25
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

**修正要求（父侧核 · 2026-10-25 19:49 · 来源 = 设计评审轮次 3 的新增 🔴，责任在父侧）**

**背景（我的疏漏）**：19:44 我补需求档 `:42` 面界例外时写了**三面**（提示词面 ∥ 设计档面 ∥ 需求档面），但没让设计席同步 `:46`/`:283`/落笔 EN 的两面写法。

**现状三处（实读 `docs/core/design/LIGHT-CHANNEL.md`）**：

- `:46`：「**落到提示词面 ∥ 设计档面 = 例外**：这两面只有全链一条路」
- `:283`：「这两面只有全链一条路，不出一条无 A 项可选的选择题（需求 §2.1 面界）」
- `:293` 落笔 EN：「(a pen that has landed on the prompt face ∥ the design docs takes the full chain instead: stop, report the destination, and put up no question)」

**同档与之相反的两处（说明三面才是对的口径）**：

- `:400` §5：「**提示词面 ∥ 设计档面 ∥ 需求档面不入轻通道直改**」
- 需求档 `:33`（面界）与 `:42`（面界例外）均三面

**后果（为什么必须改）**：落笔文本是模型唯一读到的那份。笔做到一半落到**需求档面**时，EN 里的例外不覆盖它 ⇒ 模型按前半句「goes back to the choice question」出 A/B 题，而 A 项（轻通道直改需求档面）按 `:33` 不可选——正是需求 `:42` 新段要消除的「出一个 A 项不可选的选择题」。

**要求**：`:46` ∥ `:283` ∥ `:293` 落笔 EN 三处的例外面界补齐为**三面**（与 `:400`、需求 `:33`/`:42` 一致）；`:337` C4 的「该面」可保持（它针对提示词面场景），但其括注 `§2.10 面界` 应指向改后的三面表述。**并在 A1/A2 增一条面界断言**（如落笔后 `需求档面` 在例外句内的命中 = 1），避免下次再漏。

**范围**：只改 `docs/core/design/LIGHT-CHANNEL.md`。需求档已是三面，不动。

**修正要求（父侧核 · 2026-10-25 20:07 · 来源 = 实施轮 `#21` 的设计档漂移上抛，父侧已复跑确认）**

**事实**：实施轮按逐字块落笔时，块内两行超长（316 ∥ 336 字符）撞上提示词面的行宽门（300 字符/行、裸判、无段归并），门 `REFUSED`。处置 = 按**句界**各拆两行，**文字零改动**（以单空格归并后与原行逐字相同，实施席用程序比对过）。代价 = 每档 **+1 行**。

**父侧复跑（本刻实读）**：persona **459** 行 ∥ discipline **349** 行；超 300 字符行 **各 0**；A1/A2 全部断言值 = 设计期望（`choice question` = 4 · 面界断言 = 1 · `⇒ walk` = 0 · `walks this channel` = 0 · `a defect ⇒ goes up as item 2` = 1 等）。

**所以设计档四处读数失效，需按实测收正**：

| 落点 | 现写 | 应为 |
|---|---|---|
| `docs/core/design/LIGHT-CHANNEL.md:317` / `:318` | persona `458` / discipline `348` | **459 / 349** |
| 同上，`±0 行` / `7 行 → 7 行` | 零净增 | **+1 行**（说明：两行按句界拆为四行，文字零改） |
| `:285` | 「第 211–217 行整行起至第 217 行末」+「Start-up booking 起不动」 | 落笔块 **`:211-218`**；`Start-up booking` 移 **`:219`** |
| `:326`（A1） | `:346` ∥ `:227` | **`:347`** ∥ **`:228`** |
| `:343`（勘察行） | `persona-engineering.md:211-227` | **`:211-228`** |

**要求**：按上表收正，并把「行宽门会强制拆行」这条写进设计档（一句即可）——**这是设计席写逐字块时该预见的**：提示词面是逐行裸判，写超长逐字句必撞门，标注「±0 行」就得先确认每行 ≤300。

**范围**：只改 `docs/core/design/LIGHT-CHANNEL.md`。提示词两档已落对，**不动**。

**两条上抛的裁决（父侧，不派）**：
- `persona:222` 代码笔通路句 —— **不改**。设计 §5 边界明列「不改代码笔通路」，且该句与 `:215` 的选择题不冲突（一个是准入判定，一个是挂账后的放行）。
- `discipline:97-98` 缺三面面界半句 —— **不改**。design §2.10 的六处增量本就不含此句；面界由 `persona:217`/`:225` 覆盖，子代理又被 `:118` 禁止路由，双层兜住。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 8：父侧 20:07 四处读数按实测收正（459 ∥ 349 · 落笔块 211–218 · A1 坐标 :347 ∥ :228 · 勘察行 211-228）+ 行宽门一句；设计档 474 行 · gate PASS · 待复审（轮次 5））
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

**§2 修正轮 7（设计评审 §3 轮次 3 新增 🔴 + 父侧 §1「修正要求」19:49 逐条落）**：只改设计档 `docs/core/design/LIGHT-CHANNEL.md`，现量 **472 行**（内容行数；`split(/\r?\n/).length` = 473）——±0，句内改。本批条目、判定句、A1–A3 判据皆不变；提示词两档未动（落笔仍待 §5 eng-coder）。

| # | 落点（落笔后行号） | 改动 |
|---|---|---|
| 1 | `:46`（§2.2 越界行） | 例外面界**两面 → 三面**：`落到提示词面 ∥ 设计档面 = 例外` ⇒ `落到提示词面 ∥ 设计档面 ∥ 需求档面 = 例外`；`这两面` ⇒ `这三面`；括注补 `§5 边界`（三面的定义位） |
| 2 | `:283`（§2.10 面界行） | 同改三面：`提示词面 ∥ 设计档面笔不入轻通道` ⇒ 三面 + `（三面各有唯一作者——§5 边界；同档 :224 既有句）`；`这两面` ⇒ `这三面` |
| 3 | `:293`（落笔 EN 例外句） | 补 `∥ the requirement docs`——落笔文本例外句三面齐，越界落到需求档面时不再回「goes back to the choice question」（正是 `acceptance-subset` 那个 A 项不可选的形态） |
| 4 | `:337`（C4 行） | 括注 `§2.10 面界` ⇒ `§2.10 面界 = 三面`（指向改后的三面表述）；入参由「改的是提示词面」泛化为「**面界三面之一**（提示词面 ∥ 设计档面 ∥ 需求档面）」——期望主体不变 |
| 5 | `:326`（A1 行） | 增**面界断言**：`grep -c "the design docs ∥ the requirement docs"` 于 `persona-engineering.md` = 1（落笔后例外句三面齐；= 0 ⇒ 需求档面漏） |
| 6 | `:354`（§3 落点表 persona 行） | 清册「面界例外 = 回全链、不出题」⇒「面界例外 = **三面**回全链、不出题」——清册与逐字块同口径 |

**复扫读数（本轮实跑 · 逐字计数）**：设计档 `这两面` = **0** ∥ `这三面` = 2（`:46` ∥ `:283`）∥ `需求档面` = 5 行（`:46` ∥ `:283` ∥ `:326` ∥ `:337` ∥ `:400`——三处例外表述 + A1 断言说明 + §5 边界定义行）∥ `交底即行` ∥ `用户可改判` 仍各仅 `:328`（A3 扫描字面）。doc_check gate（设计档）= **PASS（0 命中）**。

**A1 ∥ A2 模拟落笔读数（按逐字锚在内存替换两档后计数，未改提示词档）**：A1 = `disclose-then-go` 0 ∥ `hit one of the three ⇒ walk` 0 ∥ `both routes on the same line` 1 ∥ `choice question` 4 ∥ `No pick ⇒ nothing moves` 1 ∥ `a recommendation is not a default` 1 ∥ **`the design docs ∥ the requirement docs` 1**（新增面界断言）∥ 四处旧指代串各 0 ∥ `disclos` persona 2 行 3 处（`:44` ∥ `:346`）· discipline 0；A2 = `the user can overrule` 0 ∥ `straight through` 0 ∥ `⇒ walk` 0 ∥ `walks this channel` 0 ∥ `nothing moves before the pick` 1 ∥ `put it up as a choice` 1 ∥ `a defect ⇒ goes up as item 2` 1；同串于 discipline = 0（A1 断言域限定 persona，无跨档歧义）。两档行数 ±0（内容行 458 ∥ 348）。除第 5 项外全部读数与修正轮 6 逐字相同——本轮未动任何被计数的旧串。

**两处自检（交付前实读订正，留痕于本档）**：
① **A3 第三维删除**：首稿在 A3 增「`grep -c "需求档面"` = 3」，实测 = **6**（A3 行自身的扫描字面自指 + C4 行命中）——同 A3 早先踩过的恒红形；该维当场删除，面界机检只留 A1 的英文串（模拟落笔 = 1，无自指）。
② **C4 入参泛化**与父侧「「该面」可保持」不冲突：父侧判的是期望句；入参若只举提示词面，用例就在档内留一条比分界裁定更窄的场景面，故按需求 `:42` 的三面写。期望主体（停笔、报、不出 A/B 题、只报全链去向）逐字未改。

**未改 · 核对结论（一条，附读数）**：`thincoder-core/prompts/persona-engineering.md:224` 实读为「**Prompt faces and design docs are not light-channel direct edits**: … — the light channel applies to code pens only.」——两面列举 + 收束通用句；需求档面由「code pens only」覆盖，无 `:283` 那种闭合两面集（「只有这两面」），故本席判为**不需改**。若父侧要求列举面也写成三面，属提示词面笔（落笔 = eng-coder，锚需另给）。

**上抛项关闭**：修正轮 6 的上抛（需求档 `:42` 越界行无面界例外）已由父侧落为三面（实读 `docs/core/requirements/LIGHT-CHANNEL.md:42`：「面界例外：越界后发现改的是提示词面 ∥ 设计档面 ∥ 需求档面（`:33` 的面界），那三面只有全链一条路 ⇒ 此时只报全链去向、不出 A/B 题」）⇒ 设计档与本轮三处同口径，该项关闭。本席本轮未改需求档。

**§2 修正轮 8（父侧 §1「修正要求」20:07 · 实施轮 `#21` 上抛的设计档漂移 · 四处读数收正 + 行宽门一句）**：只改设计档 `docs/core/design/LIGHT-CHANNEL.md`，现量 **474 行**（内容行数；`split(/\r?\n/).length` = 475）——472 + 新增一段 2 行。提示词两档未动（已落对，父侧定范围）。本批条目、判定句、A1–A3 判据皆不变。

| # | 落点（改后行号） | 改动 |
|---|---|---|
| 1 | `:317` ∥ `:318` | 现量 persona 458 → **459** 行 ∥ discipline 348 → **349** 行；两行 Δ「±0 行」→「**+1 行**（按句界拆为两行，文字零改）」；persona 行内「7 行 → 7 行（第 211–217 行）」→「7 行 → 8 行（第 211–218 行）」 |
| 2 | `:285` | 「替换域 = 第 211 行整行起至第 217 行末」→「**落笔块 = 第 211–218 行**（8 行 = 原 7 行 + 拆出的一行）」；「第 218 行 Start-up booking 起不动」→ **`:219`**；「及其后六行」→「及其后七行」 |
| 3 | `:328`（A1） | `disclos` 文件域声明面 `:346` → **`:347`** ∥ `choice question` 指代句 `:227` → **`:228`** |
| 4 | `:345`（勘察行） | `persona-engineering.md:211-227` → **`:211-228`**，覆盖所改末行 |
| 5 | `:322`（新增段） | 「**行宽门会强制拆行（写逐字块即须预见）**」：提示词面逐行裸判 300 字符、无结构豁免（`docs/core/design/DOC-DISCIPLINE.md:949-952`）⇒ 逐字块写入超长句必撞门（`doc_check(mode:"gate")` = REFUSED）、实施席只能按句界拆行；**标「±0 行」前先核块内每行 ≤ 300 字符** |

**同族收正（父侧表未列，同一失效读数 ⇒ 一致面当场改，逐条报）**：

| # | 落点 | 改动 | 不改的后果 |
|---|---|---|---|
| 6 | `:281` | 「轻通道块整段 = 第 211–217 行」→ **第 211–218 行** | 与 #2 同一块的另一处读数，不改则同节内两值并存 |
| 7 | `:302` | discipline 段头「六处句内改、行数 ±0」→「六处句内改；`:97` 首句按句界拆为两行 ⇒ **+1 行**，文字零改」 | 与 #1 同一档的 Δ 读数，不改则同档内 ±0 与 +1 并存 |
| 8 | `:319` | 受影响文件表自身行：设计档现量 472 → **474 行** | 表内自指读数，不改则表头与本档实况不符 |
| 9 | `:297` | 两处指代段头补「**行号为落笔前坐标**」 | `:299`/`:300` 的锚值 `:223`/`:227` 是落笔前坐标（旧串已不在盘），与 A1 的落笔后坐标 `:228` 并置会被读成互相矛盾；锚值未动，只标坐标系 |

**实测读数（本席本轮跑 · node 逐行计数；提示词两档未改）**：

- **行数**：persona **459** 内容行（`split` 460）∥ discipline **349**（`split` 350）∥ 设计档 **474**（`split` 475）∥ PROMPT-SYSTEM **4,402**；两档超 300 字符行各 **0**、最长行 **300**。
- **A1（落笔后实读，非模拟）**：`choice question` **4**（`:211` ∥ `:216` ∥ `:218` ∥ `:228`）∥ `both routes on the same line` **1**（`:211`）∥ `No pick ⇒ nothing moves` **1**（`:215`）∥ `a recommendation is not a default` **1**（`:213`）∥ 面界断言 `the design docs ∥ the requirement docs` **1**（`:217`）∥ `disclose-then-go` ∥ `hit one of the three ⇒ walk` 两档各 **0** ∥ `disclos` = persona **2 行 3 处**（`:44`(1) ∥ `:347`(2)）· discipline **0**。
- **A2**：`the user can overrule` **0** ∥ `straight through` **0** ∥ `⇒ walk` **0** ∥ `walks this channel` **0** ∥ `nothing moves before the pick` **1**（`:118`）∥ `put it up as a choice` **1**（`:97`）∥ `a defect ⇒ goes up as item 2` **1**（`:103`）。
- **拆行字符数复核（与父侧读数一致）**：persona 块第 6 行 = `:216` 148 + 空格 + `:217` 169 − 缩进 2 = **316** ∥ discipline `:97` 155 + 空格 + `:98` 180 = **336**。
- **门**：`doc_check(mode:"gate")`（设计档 · target = `D:\teamcode\thincoder`）= **PASS（0 命中）**；设计档失效串复扫 `458` ∥ `348` ∥ `211-227` ∥ `211–217` ∥ `:346` ∥ `7 行 → 7 行` ∥ `459 ∥ 349` ∥ `472 行` 全部 **0 命中**。

**未改 · 判过（附依据）**：`docs/core/design/LIGHT-CHANNEL.md:299`/`:300` 的锚值 `:223`/`:227` 保留——落笔前坐标，段头已标明坐标系（#9）；`thincoder-core/prompts/persona-engineering.md:224`（两面列举 + `code pens only` 收束句）按修正轮 7 裁定不需改，本轮复核仍成立、未动。

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

### 轮次 3（评审子代理）

## 轮次 2 复核（改后复评）——轻通道准入改「选择题 + 用户选定」（F-LC2）

实读面：`docs/core/design/LIGHT-CHANNEL.md`（473 行全文）∥ `docs/core/requirements/LIGHT-CHANNEL.md`（111 行全文）。前轮 3 条（#10 🔴 ∥ #11 🟡 ∥ #12 🔵）逐条对现文核 = **均 Fixed**；本轮新发现 1 条 🔴（需求 :42 三面 vs 设计 :46/:283/落笔 EN 两面）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 10 | docs/core/design/LIGHT-CHANNEL.md | 🔴 | Fixed | `:305` 把 `:102` 路由语入增量（`a defect ⇒ walk` ⇒ `a defect ⇒ goes up as item 2`）；`:304` 覆盖 `:97` 同行收尾句（`— walks this channel.` ⇒ `— is put up as a choice question; it moves only after the pick.`）；`:281`/`:302`/`:318` 同步为「六处句内改」；A2（`:327`）新增 `⇒ walk` = 0 ∥ `walks this channel` = 0 ∥ `a defect ⇒ goes up as item 2` 恰 1 |
| 2 | 11 | docs/core/design/LIGHT-CHANNEL.md | 🟡 | Fixed | C4（`:337`）改为「停笔、报；该面只有全链一条路 ⇒ **不出 A/B 题**、只报全链去向」；落笔 EN（`:293`）带例外括注；需求档 `:42` 补「面界例外」段——三条同向 |
| 3 | 12 | docs/core/design/LIGHT-CHANNEL.md | 🔵 | Fixed | 勘察行（`:343`）已改 `thincoder-core/prompts/persona-engineering.md:211-227`，覆盖所改末行 |
| 4 | new | docs/core/requirements/LIGHT-CHANNEL.md ∥ design LIGHT-CHANNEL.md | 🔴 | New | 需求 `:42`: `**面界例外**：越界后发现改的是提示词面 ∥ 设计档面 ∥ 需求档面（`:33` 的面界），那三面只有全链一条路` = **三面**；设计 `:46`: `**落到提示词面 ∥ 设计档面 = 例外**：这两面只有全链一条路` ∥ `:283`: `这两面只有全链一条路，不出一条无 A 项可选的选择题（需求 §2.1 面界）` ∥ 落笔 EN `:293`: `a pen that has landed on the prompt face ∥ the design docs takes the full chain instead: stop, report the destination, and put up no question` = **两面**。设计档 `:400` §5 自身列三面 ⇒ 同一机制两套面界描述，落笔文本缺需求档面：越界落到需求档面时仍回「goes back to the choice question」，出一个 A 项不可选的选择题——正是需求 `:42` 新段要消除的形态。须在 :46 ∥ :283 ∥ :293 的例外面界对齐（三面）或回改需求 `:42`/`:33`，并在 A2/A1 增一条面界断言 |

计数：Fixed 3 ∥ New 1（🔴 1）∥ 未决 🔴 = 1。

VERDICT: changes-required

### 轮次 4（评审子代理）

### 轮次 4 复核（对象：轮 3 的 4 条 —— 3 条复核项 + 1 条 New）

实读：`docs/core/design/LIGHT-CHANNEL.md`（473 行全文）∥ `docs/core/requirements/LIGHT-CHANNEL.md`（111 行全文）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 10 | docs/core/design/LIGHT-CHANNEL.md | 🔴 | Fixed | `:305`: "`:102` 缺陷类分类义 —— `**a defect ⇒ walk**` ⇒ `**a defect ⇒ goes up as item 2**`"；`:304` 同行收尾句 "行末 `— walks this channel.` ⇒ `— is put up as a choice question; it moves only after the pick.`"；`:281`/`:302`/`:318` 同步「六处句内改」；A2（`:327`）"`⇒ walk` = 0（同捕 `:97` 首句与 `:102` 路由语）、`walks this channel` = 0" + "含 `a defect ⇒ goes up as item 2` 恰 1" —— 前轮两条残留均已闭合 |
| 2 | 11 | docs/core/design/LIGHT-CHANNEL.md | 🟡 | Fixed | C4（`:337`）"停笔、报；该面只有全链一条路 ⇒ **不出 A/B 题**、只报全链去向，按全链处置"；需求 `:42` "**面界例外**：越界后发现改的是提示词面 ∥ 设计档面 ∥ 需求档面（`:33` 的面界），那三面只有全链一条路 ⇒ 此时只报全链去向、不出 A/B 题"；落笔 EN `:293` 同向 —— 原「重给选择题 vs 不出题」相抵已解 |
| 3 | 12 | docs/core/design/LIGHT-CHANNEL.md | 🔵 | Fixed | 勘察行（`:343`）"`thincoder-core/prompts/persona-engineering.md:211-227`" —— 覆盖所改末行（`:223` ∥ `:227`），读数不再短于改面 |
| 4 | new(轮3) | docs/core/requirements/LIGHT-CHANNEL.md ∥ docs/core/design/LIGHT-CHANNEL.md | 🔴 | Fixed | 三面已对齐：需求 `:42` 三面 ∥ 设计 `:46` "**落到提示词面 ∥ 设计档面 ∥ 需求档面 = 例外**：这三面只有全链一条路" ∥ `:283` "提示词面 ∥ 设计档面 ∥ 需求档面笔不入轻通道（三面各有唯一作者——§5 边界" ∥ 落笔 EN `:293` "a pen that has landed on the prompt face ∥ the design docs ∥ the requirement docs takes the full chain instead: stop, report the destination, and put up no question" ∥ C4 `:337` "轻通道笔做到一半发现改的是**面界三面之一**（提示词面 ∥ 设计档面 ∥ 需求档面）" ∥ `:400` §5 三面；A1（`:326`）新增 "**面界断言**：`grep -c \"the design docs ∥ the requirement docs\"` 同档 = 1（落笔后例外句三面齐；= 0 ⇒ 需求档面漏，即本轮补的那一面）" —— 面界两套描述已收敛为一套 |

计数：Fixed 4 ∥ New 0 ∥ 未决 🔴 0 ∥ 未决 🟡/🔵 0 ⇒ 放行。

VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-25（用户原话：「评审」→「派」）

**批准依据**：设计评审第 4 轮 `VERDICT: pass`（token 已签发并使用）。批准的动作 = 派 eng-coder 实施提示词两档落笔。

**批准范围**：`thincoder-core/prompts/persona-engineering.md` + `thincoder-core/prompts/discipline-engineering.md`——按设计 §2.10 逐字锚落笔。不含设计档/需求档（各自的笔），不含代码面。

## §5 实施记录（eng-coder）

**状态行**：实施完成（逐字锚落两档 · A1–A3 全绿 · `doc_check` PASS · 偏离审计 1 轮 + 代码评审 1 轮 · 终态 clean · 4 条上抛）

**交付摘要**：按 `docs/core/design/LIGHT-CHANNEL.md` §2.10 逐字锚落两档提示词——`thincoder-core/prompts/persona-engineering.md`（轻通道块整段改写 + 两处指代）∥ `thincoder-core/prompts/discipline-engineering.md`（六处句内改）。零代码面、零新档、零配置键、零新参数。

**落点（改后实读行号）**：

| 锚（设计 §2.10） | 落点 | 内容 |
|---|---|---|
| `:288-294` 逐字块 | persona `:211-218` | 选择题形（两条路由同行 ∥ 建议非默认 ∥ 未选定即不动 ∥ 越界停笔重提请 + 三面例外 ∥ 零链免提请） |
| `:299` / `:300` | persona `:224` / `:228` | `the disclosure's "this pen = light channel"` → `the pick's "A) light channel"`；`(disclosure · change · …` → `(the choice question and the pick · change · …` |
| `:304` 首句 + 同行收尾 | discipline `:97-98` | `⇒ walk` → `⇒ put it up as a choice, the user picks`；`— walks this channel.` → `— is put up as a choice question; it moves only after the pick.` |
| `:305` 缺陷类归类 | discipline `:103` | `**a defect ⇒ walk**` → `**a defect ⇒ goes up as item 2**`（括注定义半句原样） |
| `:306` 走查点名归类 | discipline `:105` | `detail class straight through by default; behavior class = defect fix` → 两类归类 + `whether to walk is still the user's pick` |
| `:307` 附则指代 | discipline `:111` | `the disclosure carries "revertable"` → `the choice question carries "revertable"` |
| `:308` 轮次形指代 | discipline `:113` | `(per-pen entries: the choice question and the pick · change · walkthrough · freeze)` |
| `:309` 行使线 | discipline `:118` | 选择题句 + `nothing moves before the pick` |

**验收读数（本轮实跑 · node 逐字计数 · `grep -c` 语义 = 命中行数）**：

- **A1**：`disclose-then-go` = 0 ∥ 0；`hit one of the three ⇒ walk` = 0 ∥ 0（persona ∥ discipline）。
  persona：`both routes on the same line` = 1（`:211`）∥ `choice question` = 4（`:211` ∥ `:216` ∥ `:218` ∥ `:228`）∥ `No pick ⇒ nothing moves` = 1（`:215`）∥ `a recommendation is not a default` = 1（`:213`）∥ 面界断言 `the design docs ∥ the requirement docs` = 1（`:217`）。
  四处旧指代串各 = 0；`disclos` = persona 2 行 3 处（`:44` 交付缩减面 ∥ `:347` 文件域声明面——轻通道块内 0）· discipline 0。
- **A2**：`the user can overrule` = 0 ∥ `straight through` = 0 ∥ `⇒ walk` = 0 ∥ `walks this channel` = 0 ∥ `nothing moves before the pick` = 1（`:118`）∥ `put it up as a choice` = 1（`:97`）∥ `a defect ⇒ goes up as item 2` = 1（`:103`）。
- **A3**：`交底即行` ∥ `用户可改判` 于设计档各 1，皆 `docs/core/design/LIGHT-CHANNEL.md:328`（A3 本行扫描字面）⇒ 命中行集 = 仅本行；§2.1 行使面 ∥ §2.2 皆述「未选定即不动」（实读）。
- **行数**：persona 459 内容行（`split` 460）∥ discipline 349（`split` 350）；两档最长行 = 300，>300 = 0。
- **门**：`DOC-CHECK GATE: PASS`（本会话写过的文档 2 档 · 0 条命中）。

**决策披露表**：

| # | 决策 | 理由 | 代价 / 偏差 |
|---|---|---|---|
| 1 | **拆行（强制，非自选）**：设计逐字块第 6 行（316 字符）∥ discipline 首句（336 字符）按句界拆为两行 | 行宽判据 300 字符对提示词面逐行裸判（`docs/core/design/DOC-DISCIPLINE.md:952`「阈值 300 字符」）；未拆时 `doc_check(mode:"gate")` = REFUSED（2 条行太长）⇒ §5 写入与交付同被拒 | **零字改动**：两行以单空格归并后与原行逐字相同（已程序核对）；每档 +1 行 ⇒ 设计档 §2 的「±0 行」失效（漂移见下） |
| 2 | 未改 `persona:225`（两面列举句） | 设计 §2 修正轮 7 已裁「不需改」（需求档面由 `code pens only` 收束句覆盖），且未给逐字锚；改它 = 设计外笔 | 无 |
| 3 | 未改 `persona:222`（`**Light-channel code pens** … ⇒ direct edits pass.`） | 设计 §2.10 替换域止于旧第 217 行、边界明列「不改代码笔通路」；该句可读作 §2.8 闸的**机械**条件（挂账即过闸），授权面由 `:215` 承担 | 见上抛 1 |

**修正轮**：1 轮——`doc_check` 首跑 REFUSED（2 条行太长）⇒ 同轮拆行 ⇒ 复跑 PASS。无其他自修，无未落项。

**偏离审计 / 代码评审（本会话内两轮，终态 = `clean`）**：

- **内部背离审计（explore · 只读）1 轮**：7 项逐判——5 项 PASS；DOC-DRIFT 1 项（设计档受影响文件表）；DIVERGENT 1 项（`persona:222` 残留句，归责设计边界、非实施越界）。两项均不在本席笔域 ⇒ 零自修。
- **内部代码评审（advisor · type=code）1 轮**：VERDICT = **pass**（🔴 0 ∥ 🟡 2 可选项 ∥ 🔵 2）。🟡 = 拆行未落盘记录（本段即其记录）+ discipline 缺三面面界半句（设计缺口）；🔵 = 坐标随 +1 行漂移 + `persona:225` 两面列举（设计已裁）。
- **终态 = `clean`**：本席笔域内零遗留；余项皆属设计档 ∥ 需求档 ∥ 父侧裁定面。

**设计档漂移（报父侧路由 · 设计档 = eng-designer 笔，本席未改）**：

- `docs/core/design/LIGHT-CHANNEL.md:317` ∥ `:318`：现量 458 ∥ 348 且「±0 行」⇒ 实际 459 ∥ 349（各 +1，因强制拆行）。
- 同档 `:285`：「第 211 行整行起至第 217 行末」（7 行）⇒ 实际落为 `:211-218`（8 行）；`Start-up booking` 旧第 218 行 ⇒ 今 `:219`。
- 同档 `:326`：`disclos` 第二行记 `:346` ⇒ 实为 `:347`；`:227` 记的指代句 ⇒ `:228`。
- 同档 `:343` 勘察行：`persona-engineering.md:211-227` ⇒ 改面覆盖至 `:228`。

**上抛父侧**：

1. 〔待裁〕`thincoder-core/prompts/persona-engineering.md:222`「**Light-channel code pens**: with the round booked (batch record + 在途 row) on disk ⇒ direct edits pass.」——可被读作「挂账即可动」的充分条件，与新 `:215`「未选定即不动」并置时有缺口观感。本席按设计边界未改；是否补半句由父侧裁（提示词面 = 本席可落，但需设计锚）。
2. 〔待裁〕`thincoder-core/prompts/discipline-engineering.md:97-98` 缺三面面界半句：设计 §2.10 六处增量内无该句，而需求 §2.1 面界 ∥ 设计 §2.10 正文皆三面。补句 = 设计缺口修（需 eng-designer 给锚）；缓解项 = `persona:217` ∥ `:225` 已覆盖，且子代理被 `discipline:118` 禁止路由。
3. 〔知会〕需求档 `docs/core/requirements/LIGHT-CHANNEL.md:81` 引 `persona-engineering.md:218-222`；落笔后该段为 `:219-223`（主 agent 笔）。
4. 〔知会〕`§2` 早段 A3 行（`docs/batches/2026-10-25-light-channel-consent.md:119`）写「设计档扫 `交底即行` = 0」，与设计 §2.10 A3（`:328` 命中行集 = 仅本行）两形并存；同档 `:187` 已是后者口径 ⇒ 按后段为准，无实害。

**测试行**：① 本批零可执行面（提示词正文）⇒ 无单元测试档（设计 §2.10 判）；可核面 = 上列三条 grep 读数。② 集成集 = `none`（设计 §8：组件交互零改 ∧ 既有用例断言面无关）；**本批未集成测试验证——父侧收口跑为唯一集成跑**。窗口读数 = 22 例 / 50–100（本批零增删）。

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

## 验证与收口（父侧亲跑，未采信转述）

**改动面（2 档）**：`thincoder-core/prompts/persona-engineering.md`（轻通道块 `:211-218` 整段改写 + 两处旧指代 `:224`/`:228`）· `thincoder-core/prompts/discipline-engineering.md`（六处句内改）。

**父侧独立复跑读数**（2026-10-25 20:08，本刻实读）：

| 判据 | 读数 | 期望 |
|---|---|---|
| persona 行数 | **459** | 459 ✓ |
| discipline 行数 | **349** | 349 ✓ |
| 超 300 字符行 | persona 0 ∥ discipline 0 | 0 ✓ |
| `choice question`（persona） | 4 | 4 ✓ |
| 面界断言 `the design docs ∥ the requirement docs` | 1 | 1 ✓ |
| `both routes on the same line` | 1 | 1 ✓ |
| `No pick ⇒ nothing moves` | 1 | 1 ✓ |
| `a recommendation is not a default` | 1 | 1 ✓ |
| `disclose-then-go` / `hit one of the three ⇒ walk`（persona） | 0 / 0 | 0 / 0 ✓ |
| `⇒ walk` / `walks this channel` / `straight through` / `the user can overrule`（discipline） | 0 / 0 / 0 / 0 | 0 ✓ |
| `nothing moves before the pick` / `put it up as a choice` / `a defect ⇒ goes up as item 2` | 1 / 1 / 1 | 1 ✓ |
| `doc_check` gate（设计档 + 需求档） | **0 命中** | PASS ✓ |

**偏离（如实 · 1 处）**：逐字块内两行超长（316 ∥ 336 字符）撞提示词面行宽门（300 字符/行、逐行裸判、无结构豁免），实施席按**句界**拆行、**文字零改动** ⇒ 每档 +1 行。设计档「±0 行」读数随之失效，已由修正轮 `#23` 收正为 `+1 行` 并补「行宽门会强制拆行」规则句（设计档 `:322`）。**这是设计席写逐字块时该预见的**——已入档防复发。

**两条上抛的裁决（父侧）**：`persona:222` 代码笔通路句 = **不改**（设计 §5 边界明列不改；它管挂账后放行，与 `:215` 准入判定不同层）· `discipline:97-98` 缺三面面界半句 = **不改**（设计六处增量本不含此句；`persona:217`/`:225` 覆盖 + `:118` 禁止子代理路由，双层兜住）。

**测试行**：① 本批**零可执行面**（只改提示词正文）⇒ 无单测档；可核面 = 上表 grep 读数。② 集成 = **`none`**（设计 §8 判定：组件交互零改、既有 22 例断言面无关）——**本批未集成测试验证，父侧收口跑是唯一集成跑**；集成集现量 **22 例 / 窗口 50–100**，本批零增删。

**未走到的确认（如实）**：`#21` 报告称 `doc_check` 首次 `REFUSED` 因两行超长，实施席同轮拆行后复跑 PASS；父侧本轮只跑终态门（0 命中），未复现首次 REFUSED——但拆行痕迹（行数 +1）与设计档收正在盘，可交叉印证。
