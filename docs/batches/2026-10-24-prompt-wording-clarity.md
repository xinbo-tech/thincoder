# 2026-10-24 · 提示词措辞：三处读不懂 + 自造词半句（落 common）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-24 22:28「我并不是说要求一定要百分之百的原话，我需要的是意思表达清楚」+ 22:30「如果要四档各一处，为什么不放在 common 里？」+ 22:32「你按流程做啊！」。
> 台账 = #1773（PROMPT-SYSTEM · 归批）。前情 = 2026-10-24-integration-concept-axis.md（已收口 2026-10-24）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-24

**问题**：今晚落进提示词的几句话，读者照着做不了——不是意思错，是没有可照着做的对象、没有出处、或要多绕一道才能读对。

- **已定决定**：三处读不懂的措辞要改；标准是「让人不用猜」，不是「和用户原话逐字一致」。用户原话：「我并不是说要求一定要百分之百的原话，我需要的是意思表达清楚。」· 时间：2026-10-24 22:28
- **已定决定**：自造词那条规则落 `common.md` 一处，不四档各抄。用户原话：「如果要四档各一处，为什么不放在 common 里？」· 时间：2026-10-24 22:30

**三处读不懂（父侧实读 · 行号为回退后的已批准态）**：

1. `advisor-design.md:56` ∥ `discipline-engineering.md:195` ∥ `persona-eng-designer.md:115` 的 `or a one-off reading when no runnable face exists` —— 「一次性读数」没有可照着做的对象：读的人不知道那是跑一条命令、还是写一句话。
2. `advisor-design.md:52` 的 `the project's entry` —— 单看这一档，`entry` 指什么没有出处。
3. `advisor-design.md:54` 的 `A reason that is not "…" does not stand` —— 双重否定，读者要在脑子里转一道才能用。

**第五处（新增规则，落 `common.md`）**：转述一个已经有名字的概念时用原名；自造的比喻就是第二个名字，读者对不上号。需求来源 = 用户 19:46「你别生造词，严肃认真一点」。`common.md:9` 已在说「内部术语要带一句白话解释」——本条是它的另一半（**已有名字的，别换名**），应当扩那一行，不新增条目。

**前情（本批的由来）**：父侧曾复用概念批的 token 直接派 coder 落上面三处 + `common.md` 半句 —— **跳过评审**，已用 `git checkout` 回退三档到已批准态。本批 = 补走流程。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖 · 逐条回指）**

| # | 条目 | 判据源 | 设计落点 |
|---|---|---|---|
| 1 | 三处「一次性读数」改成可照着做的表述（三档同句） | 用户 22:28 原话 + §1 已定决定 | `docs/core/design/PROMPT-SYSTEM.md` §6.51 · J1 / B1a–B1c / L1 · L4 · L5 |
| 2 | `the project's entry` 补出处 | §1 三处读不懂第 2 条 | 同 §6.51 · J2 / B2 / L2 |
| 3 | 双重否定拆成正说 | §1 三处读不懂第 3 条 | 同 §6.51 · J3 / B3 / L3 |
| 4 | `common.md:9` 续半句：已有名字的概念别换名 | 用户 22:30 + 19:46 | 同 §6.51 · J4 / B4 / L6 |

**明确不在本批（边界）**

- `#73` 已通过的 12 个落点、任何 `Why` 行、需求档、`docs/core/design/TESTING.md`：零动（任务书硬约束）。
- 判据语义改动：不做——本批只改措辞的读法，不改判据。
- `#59` 🟡① 的 `unit test file` ⇒ `unit test files`（§6.50 上抛 1）：另笔。

**受影响文件**：见 §6.51 受影响文件表——`thincoder-core/prompts/advisor-design.md` 137→139 行 · `thincoder-core/prompts/discipline-engineering.md` 344→345 · `thincoder-core/prompts/persona-eng-designer.md` 150→151 · `thincoder-core/prompts/common.md` 428→428；四档 `>300` 保持 0。

**逐字改法**：§6.51 的 B1a–B4（每处「改前 → 改后」全文）。①–③ 沿用 `124ccfd0` 的目标文本（父侧裁定：内容未被否、只是没走评审，作目标形重走流程）；④ `thincoder-core/prompts/common.md:9` 为新增设计。

**验收对照（回指条目 1–4）**

| # | 验收 | 回指 |
|---|---|---|
| A1 | B1 三处逐字落盘；四档 `one-off reading` = 0 | 条目 1 |
| A2 | 评审档含 `the project's front-end entry` 与 `Only one reason stands:` 各 1；`does not stand` = 0 | 条目 2 · 3 |
| A3 | common 含新半句恰 1；common 行数 428 不变 | 条目 4 |
| A4 | 四档 `>300 = 0`；行数 139 ∥ 345 ∥ 151 ∥ 428 | 条目 1–4 |
| A5 | `doc_check(mode:"gate")` 首行 PASS | 本批 |

**关键决策**（详表见 §6.51 K1–K4）：①–③ 用既有目标文本、不重写 · 入口只补既有名 `front-end entry`、不在评审档写定义（D2）· 双重否定改正说且例外例照留 · ④ 落 common 一处、不新增条目。

**基线说明（父侧 2026-10-24 裁定）**：盘上 = 已批准态（`75c6bb3f` 回退了 `124ccfd0`）；本批按「改前 = 已批准态现文，改后 = 设计目标形」写，盘上不是目标态。本席曾按「已在盘、只改 ④」起草，父侧裁定改回四落点全改。

**上抛项**

- 〔父侧 · 编号〕§7 的 D-PS 行待收口时定（承 §6.47–§6.50 同条）。
- 〔父侧 · 冻结区边界〕§6.50 K5 把 discipline 档 `:193-197` 标冻结（上一批的边界）；本批任务书明列 `:195`，B1b 按本批落，不冲突。

## 修正轮（评审轮次 1 · 按号处置 · 父侧 2026-10-24 22:40 派单）

**状态行**：设计完成（修正轮已落 · gate PASS）

修正口径：① 评审表 = 本档 §3 轮次 1，八条全接受；② 🔴1 的根因在父侧（父侧把 `thincoder-core/prompts/discipline-engineering.md:186` 当定义位给了本席）；③ 本轮不动提示词档、不动需求档——提示词落笔留实施轮，需求档本批冻结。

**处置表（号 → 处置 → 改动 file:line）**

| 号 | 处置 | 改动 file:line |
|---|---|---|
| 🔴1 | 撤掉「定义位」一说。四档全扫：`entry` 无独立定义句（`front-end entry points` 只在放置句），改为「名不变 + 两面各带同一句注解」 | `docs/core/design/PROMPT-SYSTEM.md:3965`（机制 2）· `:3966`（注解用词出处）· `:4044`–`:4047`（取代块——J13 成立、本节不推翻）· `:4097`（K2）· `:4108`–`:4110`（既有件三问）· `:4016`（B5 目标形） |
| 🔴2 | 一面一名：B2 撤回 `front-end entry`，两面同用 `the project's entry` ∥ `this project's entry` + 同一句注解；A2 两面同扫 | `:3996`（B2）· `:4016`（B5）· `:4060`（A2）· `:4076`（新增用例 C4） |
| 🟡3 | 取代声明：点名 §6.50 B8 与该节 A1 的 `the project's entry` 读数，比对基线改本节 | `:4044`–`:4046` |
| 🟡4 | 记明延后、本批不做：改复数须连带改命令形并三面同改，属判据面改写；接笔条件已写；台账由父侧登记 | `:4049`–`:4053` · 登记项见 `:4126`（上抛 3） |
| 🟡5 | B4 拆两行（两条规矩两行），不再引 §6.45 给「一行」立例外；A3 ∥ K4 ∥ A5 随正 | `:4009`（B4）· `:4099`（K4）· `:4061`（A3）· `:4063`（A5） |
| 🟡6 | 设计面主人同步扩一句，人读权威载全两条 | `docs/core/design/PROMPT-SYSTEM.md:345` · `:4065`（A7） |
| 🟡7 | 记明 22:30 读法：措辞面 ⇒ 公共层一处；判据面 ⇒ 三面各一处（绑角色决策点） | `:3969`（机制 5）· `:4100`（K5） |
| 🔵8 | 改真值口径 `split(/\r?\n/).length`（四档均无末行换行）；A5 读同一口径 | `:4082`（口径句）· `:4086`–`:4089`（表）· `:4063`（A5） |

**本节前段旧行更正（收口对账用·以设计档为当前形）**

- 受影响文件行数 139 ∥ 345 ∥ 151 ∥ 428 ⇒ **140 ∥ 346 ∥ 152 ∥ 430**（真值口径；旧 `-1` 口径四档各少计 1，B4 拆行再 +1）。
- 落点 L1–L6 ⇒ **L1–L6 + L5b**（设计席 `thincoder-core/prompts/persona-eng-designer.md:136` 整行替换为 B5）。
- A2 判据 `the project's front-end entry`（旧行）⇒ **两面同一名 + 同一句注解**，判法见设计档 §6.51 A2。
- 判据口径与全部读数住设计档 §6.51（「判」表 ∥「取代」∥「本批不收」∥「验收」∥「受影响文件」）——§2 只指、不重抄（D7 对账以该节为源）。

**未决（上抛主 agent）**

1. §7 的 D-PS 行编号待父侧收口时定（承 §6.47–§6.50 同条）。
2. 〔待登记〕`#59` 🟡① 延后项请父侧落台账一行（子代理不写台账）：标题 = 替换形单档 ⇒ 多档 ∥ 子集；接笔条件见设计档 §6.51「本批不收」。

**更正（坐标）**：上表 🟡4 行所引 `:4126` = 设计档「上抛项」块标题；第 3 条（台账登记）本体在 `docs/core/design/PROMPT-SYSTEM.md:4130`。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

## 设计评审 · PROMPT-SYSTEM.md §6.51（判据措辞可读性收口）

评审面：`docs/core/design/PROMPT-SYSTEM.md:3947-4094`（对象声明 · 状态 = 待评审）。
核对读数：四档落点坐标逐行实读（`advisor-design.md:52` ∥ `:54` ∥ `:56` ∥ `persona-eng-designer.md:115` ∥ `:136` ∥ `discipline-engineering.md:195` ∥ `:186` ∥ `common.md:9`）全部与现盘一致；`one-off reading` 全档 3 处（= L1 ∥ L4 ∥ L5，A1 可满足）；`does not stand` 仅 `advisor-design.md:54` 1 处（A2 可满足）；`front-end entry` 现盘只在 `discipline-engineering.md:186` ∥ `discipline-normal.md:197`（A2 的「恰 1」可满足）；`.git` 在 `thincoder/.git`（A5 的 `git diff --stat` 可跑）。
未核对：字符数 / 逐行 max 宽（本评审面无测量工具）→ 受影响文件表与 A4 的 15,385 ∥ 43,274 ∥ 19,621 ∥ 51,771 与 max 298 ∥ 300 ∥ 298 ∥ 294 记为 `unverified`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | K2 ∥ 机制 2 ∥ 既有件三问 把 `thincoder-core/prompts/discipline-engineering.md:186` 称作 `front-end entry` 的定义位（`PROMPT-SYSTEM.md:3963` ∥ `:4070` ∥ `:4078`），而 §6.50 J13 对同一句已判「放置决策（N20），不是定义位」（`PROMPT-SYSTEM.md:3735`）——同一机制两处成文、无取代句；且 J2 的缺（`PROMPT-SYSTEM.md:3956`：「`entry` 指什么，单看评审档没有出处」）并未因此修好：`:186` 讲套件住哪，不讲 `entry` 是什么 | 收口两处判：要么点出真正的定义源并核过，要么撤掉「定义位」一说、在 B2 里给 `entry` 一句白话注解（名字仍用既有名），并写明取代 §6.50 J13 的那一句 |
| 2 | Requirements coverage | 🔴 | 换名只落一面：B2 把评审档改为 `the project's front-end entry`（`PROMPT-SYSTEM.md:3996`），设计席仍为 `this project's entry (a business-observable point)`（`thincoder-core/prompts/persona-eng-designer.md:136`），L7 判其零改（`PROMPT-SYSTEM.md:4028`）——而 §6.50 K4 要求两面「行字段与评审元素同一集（B7 ∥ B8）」（`PROMPT-SYSTEM.md:3912`）。同一元素自此两个名字，正是 B4 自己新立的规矩所禁（`PROMPT-SYSTEM.md:4008`）；设计席按己档写会过不了评审档的账 | 补一条设计席落点（`persona-eng-designer.md:136` 用同一名字），或 B2 保留 `the project's entry`——一元素一名；A2 随后两面同扫 |
| 3 | Document ownership | 🟡 | §6.50 B8 ∥ A1 仍以 `the project's entry` 为 `advisor-design.md:52` 的「唯一权威目标形」（`PROMPT-SYSTEM.md:3798` ∥ `:3870`），§6.51 对同一行给出另一目标形（`PROMPT-SYSTEM.md:3996`），无取代句——本档 §6.50 自己在 `PROMPT-SYSTEM.md:3862` 立过取代句先例 | 加一句取代声明，点名 §6.50 B8 与其 A1 串 |
| 4 | Scope | 🟡 | `#59` 🟡①（`unit test file` 单档 vs F1 的「单档 ∕ 相关子集」，`docs/core/requirements/TESTING.md:73` ∥ `PROMPT-SYSTEM.md:3736`）既未修也未记：§6.51 恰好重写三面（L1 ∥ L4 ∥ L5），且上抛项 2 已解冻 `:195`（`PROMPT-SYSTEM.md:4094`），仍无一条记「本批不收」 | 记明延后（谁接、哪批），或在同三处顺手加宽（`unit test file` ⇒ `unit test files`） |
| 5 | Methodology | 🟡 | K4 以「行内续写 = 一条规矩一行（§6.45）」为 B4 撑腰（`PROMPT-SYSTEM.md:4072`），但 B4 把两条互不相干的规矩放进一行（`PROMPT-SYSTEM.md:4008`：解释术语 ∥ 不换名）——正是 §6.45 要治的「一条规则与它的理由 / 例外 / 反例挤在同一行」（`PROMPT-SYSTEM.md:2919`） | 拆成两行并同步 A3 的行数期望；或改写 K4、不成引 §6.45，把「一行」作为显式例外记下来 |
| 6 | Document ownership | 🟡 | 该规矩在设计面的主人 `PROMPT-SYSTEM.md:345`（「内部术语 / 代号 / 行话不得裸用（出现时随文一句白话解释）」）零改，落地后人读权威（`PROMPT-SYSTEM.md:4147`）只载旧半句 | 本批同步扩 `:345`；或记明机制块为何不动 |
| 7 | Requirements coverage | 🟡 | 22:30 之问只答在命名半句上（`PROMPT-SYSTEM.md:4072`），而真正在四档各一处的验收例外句仍按「一句话，三处同改」三份（`PROMPT-SYSTEM.md:3962`）；为何「不放进 common」无一句成文 | 把 22:30 的读法记明；若所指是那句三份的话，写明三面各自留句的理由 |
| 8 | Clarity | 🔵 | 行数用 `split(/\r?\n/).length - 1`（`PROMPT-SYSTEM.md:4055`），比文件实际行数少 1（实读 `advisor-design.md` 138 行、`common.md` 429 行），A5 的 139 ∥ 345 ∥ 151 ∥ 428（`PROMPT-SYSTEM.md:4040`）与寻常行数计数对不上 | 读数注明「按声明口径」，或直接改用实际行数 |

计数：🔴 2 · 🟡 5 · 🔵 1

VERDICT: changes-required

### 轮次 2（评审子代理）

### 第 2 轮复核（对象 = `docs/core/design/PROMPT-SYSTEM.md` §6.51 · `:3947-4130` · 状态 = 待评审）

核对读数（本轮实读）：落点坐标 `advisor-design.md:52` ∥ `:54` ∥ `:56` ∥ `persona-eng-designer.md:115` ∥ `:136` ∥ `discipline-engineering.md:195` ∥ `common.md:9` 全部与现盘一致；四档真值行数 138 ∥ 345 ∥ 151 ∥ 429 与受影响文件表逐档一致；`已有名字的概念保持原名` 在 `PROMPT-SYSTEM.md:345` 在盘（A7 可满足）；B1a–B5 的替换形逐行比对现文，无一条丢字（`never a full-suite run` ∥ `still 🔴` ∥ `the business-observable result it asserts` ∥ 缩进 4/3/2 空格均保留）。
未核对：字符数 ∥ 逐行 max 宽（本评审面无测量工具）——受影响文件表与 A4 的 15,385 ∥ 43,274 ∥ 19,621 ∥ 51,771、max 298 ∥ 300 ∥ 298 ∥ 294 及 A4 目标形 max 记为 `unverified`。项目无 Standards 档、无 Document Map ⇒ 归属判据按本档 D 族与既有分节形制。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | PROMPT-SYSTEM.md:3965 | 🔴 | Fixed | 「定义位」一说已撤：`entry` 没有独立的定义句可指 —— `:186` 改判为放置决策（`:4047` 明写「§6.50 J13 …成立，本节不推翻」· `:4097` K2「拿它当定义位不成立」· `:4110` 同判）；J2 的缺由 B2 ∥ B5 的就地注解承担（`:4000` ∥ `:4019`），注解用词全部取自盘上句（`:181` ∥ `:136`） |
| 2 | 2 | PROMPT-SYSTEM.md:4000 | 🔴 | Fixed | 一面一名已落地：B2 用 `the project's entry (where a user enters the business — a business-observable point)`，B5 用 `this project's entry (where a user enters the business — a business-observable point)`；新增落点 L5b（`:4038`「整行替换为 B5」）、A2 两面同扫（`:4060`）、C4 判例（`:4076`）——§6.50 K4 的「同一集」恢复 |
| 3 | 3 | PROMPT-SYSTEM.md:4046 | 🟡 | Fixed | 取代句已立：`本节 B2 取代 §6.50 B8 的目标形与该节 A1 的 `the project's entry` 读数`，照 `:3862` 先例；§6.50 B8/A1 不再是并列的「唯一权威目标形」 |
| 4 | 4 | PROMPT-SYSTEM.md:4051 | 🟡 | Accepted | `#59` 🟡① 已记明延后并给技术理由（改复数须连带改 `node --test <file>` 命令形 + 三面同改 = 判据面改写），接笔条件成文（`:4053`）、台账登记上抛（`:4130` 第 3 条）——理由成立，本批不收 |
| 5 | 5 | PROMPT-SYSTEM.md:4012 | 🟡 | Fixed | B4 已拆两行（`:4012` ∥ `:4013`），K4 改成诚实表述「「解释术语」与「不换名」是两条规矩 ⇒ 两行」（`:4099`），A3 行数随正 `common 行数 429 → 430（拆两行，§6.45）`（`:4061`），A5 同步 430（`:4063`）；不再引 §6.45 给「一行」撑腰 |
| 6 | 6 | PROMPT-SYSTEM.md:345 | 🟡 | Fixed | 设计面主人已同步：`:345` 现含 `已有名字的概念保持原名——换名让读者手里两个名字指向同一件东西`，人读权威与提示词面同载两条；A7（`:4065`）可核 |
| 7 | 7 | PROMPT-SYSTEM.md:3969 | 🟡 | Fixed | 22:30 的读法成文：`措辞面受众是全角色、与角色无关 ⇒ 公共层一处`（机制 5 · `:3969`，K5 · `:4100`），并给出「判据面三处 ≠ 四档各抄」的分界依据（D-PS41 关键锚点重复 + 提示词面禁指针）；批档 §1 的已定决定同向佐证 |
| 8 | 8 | PROMPT-SYSTEM.md:4082 | 🔵 | Fixed | 行数口径改真值：`文本行数 = `split(/\r?\n/).length``，并说明旧各节少计 1；表值 138 ∥ 345 ∥ 151 ∥ 429 与本轮实读逐档吻合，A5 的 140 ∥ 346 ∥ 152 ∥ 430 与逐处 Δ 自洽 |
| 9 | (new) | docs/batches/2026-10-24-prompt-wording-clarity.md:55 | 🟡 | New | 修正轮留了一处未更正的旧行：§2 关键决策仍写 `入口只补既有名 `front-end entry`、不在评审档写定义（D2）`，并引「§6.51 K1–K4」——与现设计相抵（K2 明判改成 `front-end entry` 是 B4 禁的动作；A2 要求扫 `front-end entry` = 0；K 表现有 K1–K5）。该档 `:83-88` 的「本节前段旧行更正」只覆盖了行数 ∥ L 行 ∥ A2 判据三处，未覆盖 `:55`。设计档为当前形（`:84` 已声明），且 A2 会当场判红，故不阻塞；建议补一条更正点到 `:55` |

计数：🔴 0 · 🟡 1 · 🔵 0

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-10-24 22:15「都做吧，后续都自动推进」为批次级放行；本批具体口径 = 22:28「我需要的是意思表达清楚」· 22:30「为什么不放在 common 里」· 22:32「按流程做」。设计评审链：轮 1 changes-required（2 🔴 + 5 🟡 + 1 🔵）→ 修正 → 轮 2 pass（0 🔴 · 1 🟡 遗留）→ 实施（`#87`）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（内部偏差审计 clean · 内部代码评审 pass · 0 个 must-fix）

**交付摘要**：按设计档 `docs/core/design/PROMPT-SYSTEM.md` §6.51 的围栏块逐字落七处——L1=B1a · L2=B2 · L3=B3（`advisor-design.md`）· L4=B1b（`discipline-engineering.md`）· L5=B1c · L5b=B5（`persona-eng-designer.md`）· L6=B4 两行（`common.md`）。判据语义零改：B3 的 50–100 窗口例外照留，B2/B5 名字不变只加同一句注解，`never a full-suite run` 尾巴保留，Why 行零动。

**决策披露表（落点 | 改动 file:line | 改前摘 → 改后摘）**

| 落点 | 改动 | 改前摘 → 改后摘 |
|---|---|---|
| L1 = B1a | `thincoder-core/prompts/advisor-design.md:56`（1 行 → 2 行）∶ `:57-58` | `…or a one-off reading when no runnable face exists; the integration half…` → `…or — when the change has no runnable test — the check you actually ran and its result;` ∥ `the integration half is reported in the closeout line, not run here.` |
| L2 = B2 | 同档 `:52`（1 行 → 2 行）∶ `:52-53` | `…the project's entry, and the business requirement…` → `…the project's entry (where a user enters the business — a business-observable point), and…` |
| L3 = B3 | 同档 `:54`（±0 行）∶ `:55` | `**A reason that is not "…" does not stand** — e.g. … ⇒ still 🔴.` → `**Only one reason stands: … . Anything else — e.g. the 50–100 case window being full — is still 🔴.**` |
| L4 = B1b | `thincoder-core/prompts/discipline-engineering.md:195`（1 行 → 2 行）∶ `:195-196` | `…or a one-off reading when no runnable face exists, never a full-suite run…` → `…or — when the change has no runnable test — the check you actually ran and its result, never a full-suite run…`（尾巴保留） |
| L5 = B1c | `thincoder-core/prompts/persona-eng-designer.md:115`（1 行 → 2 行）∶ `:115-116` | `…or a one-off reading when no runnable face exists; the integration half…` → `…or — when the change has no runnable test — the check you actually ran and its result;` ∥ `the integration half is reported in the closeout line, not run here.` |
| L5b = B5 | 同档 `:136` 行（±0 行）∶ `:137` | `…and this project's entry (a business-observable point).` → `…and this project's entry (where a user enters the business — a business-observable point).` |
| L6 = B4 | `thincoder-core/prompts/common.md:9`（1 行 → 2 行）∶ `:9-10` | 第一行原样保留 `**Internal terms / codenames / jargon used bare…**`；第二行新增 `**A concept that already has a name keeps that name** — renaming it leaves the reader holding two names for one thing.` |

**验证读数（一次性落地读数 · 零常驻断言）**

- `node` 直读四档（`split(/\r?\n/).length`）：140 行 / 15,498 字符 / max 290 · 346 / 43,312 / 300 · 152 / 19,695 / 298 · 430 / 51,890 / 294；四档 `>300 = 0`。
- 真实加载器：`import('thincoder-core/prompt-files.mjs')` 的 `loadAdvisorPrompt("advisor-design.md")` 与 `loadSlot("common.md" / "discipline-engineering.md" / "persona-eng-designer.md")` 四档均读到（长度 15,498 ∥ 51,890 ∥ 43,312 ∥ 19,695），新串逐档在位；`prompt-overlays.mjs` 装载 9 键无异常。
- `doc_check(mode:"gate", docs=四档)`：首行 `DOC-CHECK GATE: PASS`，0 条命中。
- `git diff -- thincoder-core/prompts/`：7 处 hunk = L1–L6 + L5b，四档之外零改（工作树里 `AGENT-LOOP-SUBAGENT.md` / `PROMPT-SYSTEM.md` / 若干 integration test 的改动先于本席存在，非本笔）。
- 全 16 档扫描：`one-off reading` = 0 · `does not stand` = 0 · `front-end entry` 只在放置句两处（`discipline-engineering.md:186` ∥ `discipline-normal.md:197`，§6.50 J13 判不改）。

**审计 / 评审轮次与终态**

- 内部 explore 偏差审计：1 轮 → `VERDICT: clean`（七处逐字一致 · 无越界 · A1–A4/A7 独立复算 PASS；该席无 git / 执行面，A5 的 diff 面与 A6 的 gate 标「未验证」——本席已在上面补足两项读数）。
- 内部 advisor 代码评审：1 轮 → `VERDICT: pass`（🔴 0 · 🟡 1 协调项 · 🔵 2），无 must-fix。
- 修正轮：0。

**评审条目处置**

- 🟡 批档 §2 `:55` 旧决策行仍写 `入口只补既有名 front-end entry、不在评审档写定义（D2）`，与设计档 §6.51 K2/A2 相反（设计档为当前形）；§2 非本席段，收口 D7 对账时由父侧补更正。
- 🔵 `common.md:10`（新）与 `discipline-engineering.md:213` `One word per thing` 同属命名一致性规矩，两处文义一致、不矛盾；是否补记「关键锚点重复」由父侧裁。
- 🔵 A5 diff 面 / A6 gate 的读数：本席已补（见上），交付面可见。

**终态：clean**（无未决 must-fix；两项上抛见上）

## §6 验证与收口（父代理）

## 验证与收口

**父侧复核（独立复跑，不采信报告）**

| 项 | 读数 |
|---|---|
| `one-off reading` 四档 | **0**（16 档全域 0） |
| 入口注解 | `where a user enters the business — a business-observable point` 在位（评审档 ∥ 设计席各 1） |
| 双重否定 | `does not stand` = **0** |
| `front-end entry` | **0**（评审档） |
| `common.md` 新句 | `A concept that already has a name keeps that name` 在位 |
| 四档 `>300` 字符行 | **0** |
| 四档行数 | 140 ∥ 346 ∥ 152 ∥ 430（设计声明口径） |

**批内单测档**：无（提示词文本，无 `node --test` 可跑面）。

**集成场景 = 无新增（记明理由）**：改动是判据措辞与注解，不改变任何代码路径；效果由模型行为体现，无可确定性断言的前端入口。

**收口测试行**：① 本批无单测档 · ② 集成集现量 15 例 / 窗口 50–100，本批增删 **0**。

**遗留与对账**
- 评审轮 2 报的 🟡：批档 §2 `:55` 仍留旧决策行「入口只补既有名 `front-end entry`」——**设计档为当前形（§6.51 A2 判 `front-end entry` = 0）**，该行与 §6.51 冲突，按 §2 的「以设计档为当前形」处理；本处登记，不改 §2（设计席笔）。
- `#1772`：`#59` 🟡① 延后项已入台账，接笔条件在设计档 §6.51「本批不收」段。
- 设计档 §7 的 D-PS 行编号待父侧收口时定（承 §6.47–§6.50 同条）。
