# 2026-10-23 · 分支须有出处 —— 抑制「为不存在的场景加防御」的提示词判据
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-23 · 来源 = 用户 2026-10-23 22:46「thincoder这种假设不存在的边界情况的问题出现过很多次了，有办法从提示词层面抑制吗？」+ 22:51「可以」。
> 台账 = #1742（METHODOLOGY · 归批）。前情 = docs/batches/2026-10-23-drop-ambiguity-guard.md §1（已收口 2026-10-23）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-23
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**讨论（主 agent）**

**用户问题**：这种「假设不存在的边界情况」出现过很多次，能否从提示词层面抑制。**用户裁定**：「可以」（2026-10-23 22:51）。

**已复现的共同形态（三次同构）**：

| 时间 | 用户给的口径 | 实际写成 | 代价 |
|---|---|---|---|
| 2026-10-22 | 模型名「只取最后一段」 | 「完整名没中且含 `/` ⇒ 再试末段」（保留旧路的多分支兜底） | `glm-5.3/zzz` 误判成 1M，压缩永不触发 |
| 2026-10-23 | 需求 R29④「命中同一条」 | 「撞键 ⇒ 视为未提供 + 告警 + 三端拒写」 | 五处判定 + 三端报错 + 告警文案，全部拆除（批 `2026-10-23-drop-ambiguity-guard`） |
| — | — | 同一动作：**为一个没见过的输入加分支，理由是「稳一点」** | 分支自带告警 ∥ 文案 ∥ 三端一致性 ∥ 用例四份配套，没场景则四份都验证不了 |

**根因（判据写法问题，不是态度问题）**：现有评审维度第 6 条 `Scope: Is the scope appropriate? Are there opportunities to simplify? Is there scope creep?` 是形容词——评审席据此判不出红。同档「既有件三问」之所以有效，是因为**写不出那一行就红**。

**裁定方案（三条，均为「必须写一行」而非「要小心」）**：

1. **评审维度**（`thincoder-core/prompts/advisor-design.md`）：每一条针对输入 / 状态的分支必须指到出处——真实观测（数据读数 ∥ 日志 ∥ 用户报告）或可复现失败路径（给复现命令）；两者都给不出 ⇒ 🔴。
2. **落笔格**（`thincoder-core/prompts/persona-eng-designer.md`）：设计机制表带「依据」列，写不出当场删。
3. **代价句**（`thincoder-core/prompts/discipline-engineering.md`）：讲清一条无场景分支的成本链，**不写禁令**——真需要的防御给出复现路径照过。

**边界**：不动既有「业务门」（配置解析非法值、权限校验等真防御有其可复现路径，不受影响）；不做工具层机检（「有没有出处」是语义判断，机器判不了）。

**用户口径**：按完整流程走（需求 → 设计 → 评审 → 实施），落点 = 三份提示词 + 评审维度。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮已落（评审 10 条逐条处置 · 双面形照 §6.44 · gate PASS））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成（2026-10-23）

**本批覆盖条目**

| 需求条目 | 覆盖 | 设计落点 | 判据 |
|---|---|---|---|
| `docs/core/requirements/METHODOLOGY.md:36` F2-7（设计里每条分支须有出处；无出处分支判红） | 三处提示词落点全给逐字块 | 设计 §6.46 · B1 / B2 / B3 + 落点表 L1–L3 | 设计 §6.46 验收 A1–A6（A1 = 三块在盘；A2 = 评审可直接判红） |

**本批不覆盖（边界）**：不改 `thincoder-core/prompts/advisor-round2.md` / `thincoder-core/prompts/advisor-round3.md`（轮次递减规则）· 不动既有「业务门」条文 · 不做工具层机检（「有没有出处」是语义判断）· 不改需求档（F2-7 已由父侧入册）· 英文运行面由实施席照译，本批只定中文最终文 + 术语锚。

**受影响文件（现行 = 本席实读 2026-10-23；Δ = 估值，不作验收条）**

| 文件 | 现行 | Δ | 动作 |
|---|---|---|---|
| `thincoder-core/prompts/advisor-design.md` | 127 行 / 13,277 字符（`## Review Criteria` 节内 11 条） | ≈ +7 行 | 第 6 条后插 `6b. 分支出处` |
| `thincoder-core/prompts/persona-eng-designer.md` | 142 行 / 18,006 字符 | ≈ +3 行 | 8 项 item 1 bullet 列末追加「每条分支带出处」 |
| `thincoder-core/prompts/discipline-engineering.md` | 327 行 / 40,402 字符 | ≈ +4 行 | `## Engineering judgment` 节末追加代价句（知识形态） |
| `docs/core/design/PROMPT-SYSTEM.md` | 本节写入前 3,202 行 / 276,842 字符 | 本节新增 | §6.46（设计档面） |
| 其余提示词档 · 工具面 · 产品代码 · 需求档 | — | ±0 | 零改 |

**关键决策（详 = 设计 §6.46 关键决策表）**：K1 新维度编号 `6b`、不重排 7–11（档外引用点名「第 9 / 第 10 条」）· K2 判据 = 两类出处 + 都给不出 ⇒ 🔴，不写禁令（真防御给复现路径照过）· K3 落笔格进设计席 8 项 item 1，与「同类先例行」「既有件三问」同格同形 · K4 代价句落既有 `## Engineering judgment` 节、不新建节 · K5 设计档给中文定稿、实施席照译 · K6 两个实例脱敏成形态。

**上抛项**：[上抛·待裁] 无。

**修正轮（2026-10-23 · 评审轮次 1 = changes-required 处置）**

本笔收正上列边界句「英文运行面由实施席照译，本批只定中文最终文 + 术语锚」——改为 §6.44 双面形：英文逐字块 = 落笔目标形，中文复核面 = 人读复核。

| 评审 # | 处置 | 改动坐标 |
|---|---|---|
| 1 🔴 | B1–B3 改为英文逐字块（落笔目标形）；A3 三串逐字取自英文块，写明串→档映射 + 大小写 / 含标点判 | `docs/core/design/PROMPT-SYSTEM.md:3132`（块头）· `:3137`（B1）· `:3146`（B2）· `:3155`（B3）· `:3198`（A3） |
| 2 🔴 | 双面形照 §6.44：+中文复核面；§6.1 批次收尾核对恢复可执行（围栏块 = 落地基线）；偏离 ② 删除（改为对齐形，已非偏离） | `:3132-3135` · `:3164`（中文复核面）· `:3239-3241`（先例 ∥ 偏离） |
| 3 🟡 | 「机制表」空指 → 依据列落 8 项 item 2（Interface contract，模板真实存在） | `:3146`（B2）· `:3242`（三问） |
| 4 🟡 | 权威载体补链：ADVISOR-CONVERGENCE 新增 §16 + A-AC17；头部维度清单随正 | `docs/core/design/ADVISOR-CONVERGENCE.md:424`（§16）· `:401`（A-AC17）· `:17` |
| 5 🟡 | 既有件三问（`existing but unusable: 第 6 条 Scope`）+ 6 ∥ 6b 分工句 | `docs/core/design/PROMPT-SYSTEM.md:3242-3243` |
| 6 🟡 | B3 两实例收成项目中性形态（不点名本仓机制） | `:3155`（B3）· `:3174`（中文面）· `:3236`（K6） |
| 7 🟡 | A6 改实测：gate 首行 = `DOC-CHECK GATE: PASS` · 0 命中（本席 2026-10-23 实跑） | `:3201` |
| 8 🔵 | D-PS37 改按条目号引（行号随写入漂移） | `:3199`（A4）· `:3231`（K1） |
| 9 🔵 | 行数口径写明（`split(/\r?\n/).length - 1`；他式可读出 ±1） | `:3214`（表头）· `:3225` |
| 10 🔵 | L1 写形约束 + 与 §6.45 连带项 C1 / §6.19 的先后 | `:3189-3190` |

**受影响文件随正**：`docs/core/design/ADVISOR-CONVERGENCE.md` 进本批改动面（§16 + A-AC17 + 头部清单）；其余同 §2 上表。

**gate 驱动的一致性面修正（逐处报，语义零变）**：`docs/core/design/ADVISOR-CONVERGENCE.md` 11 处裸目录 / 裸名指针补成仓根全路径——`:6` `:7`（×2）`:8` `:9` `:10`（×3）`:47` `:59` `:74` `:275`（×2）`:362` `:364`；`docs/core/design/PROMPT-SYSTEM.md:3187`（`thincoder-core/prompts/advisor-round3.md` 裸名）。

**doc_check 读数**：`DOC-CHECK GATE: PASS`（2 档全清 · 0 命中 · 2026-10-23 本席实跑）。

**上抛项**：[上抛·待裁] 无。评审 10 条逐条落地（🔴2 / 🟡5 / 🔵3）；本批验收 ①–③ 已落，④ = 回报表随交付。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审（§6.46 分支须有出处 · 需求 F2-7）· 轮次记录

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance | 🔴 | A3 钉的三串英文在 B1/B2/B3 里从未出现：`docs/core/design/PROMPT-SYSTEM.md:3178` 要求 `` `branch provenance` ∥ `Every branch carries its provenance` `` 各 1 次，而 K5（`:3212`「设计档只给中文最终文，英文译文在实施轮生成」）把英文授权给实施席；`:3132` 只给「英文运行面 = 实施席照译」+ 词级术语锚（`:3160`），句子形态、大小写、串→档映射均未定。B1 的标签译成 `6b. **Branch provenance**`（§6.45 题眼加粗形）时，小写 `branch provenance` 不构成连续命中 ⇒ 忠实实现也判不过；三条串与三个文件的对应关系也未写（「在对应档」）。 | 补英文逐字块（B1/B2/B3 各一段），A3 的判据串从逐字块里取；若坚持中文块 + 照译，则 A3 改写为「B1–B3 四行逐句对读（规则 / 红判据 / why / 边界四段各在位）」的语义判，并把串→档映射与大小写规则写进 A3。 |
| 2 | Methodology / Precedent | 🔴 | 只给中文围栏块使 `docs/core/design/PROMPT-SYSTEM.md:144`「**批次收尾核对（内容漂移防线）**：提示词面批次收尾加一步**一次性**比对——**落地档 ↔ 当批设计围栏块**」无法执行——落地是英文、围栏是中文，逐行 / 去折行段比对没有可比对象，本节也未给替代判（A3 只是三串在场，非保真判）。本档既有形恰好解决这件事：`docs/core/design/PROMPT-SYSTEM.md:2772`「**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**」+ `:2800`「**中文复核面（与英文面同一语义 · 供人复核，不入提示词）**」；偏离 ②（`:3217`「② 逐字块给中文最终文（既有形 = 英文逐字块」）只引「本批任务书定」（K5），既未点名 §6.44 双面形，也未说它为何不适用 ⇒ 按评审标准第 9 条判「偏离理由未显式」。 | 按 §6.44 双面形落：英文逐字块 = 落地目标（保真比对基线），中文面 = 人读复核；若确要走「中文 + 照译」，则偏离职须点名 §6.44 双面形并给出它不适用的理由，同时在节内补一步保真判（落地段 ↔ 中文块逐句映射）。 |
| 3 | Clarity | 🟡 | B2 的落笔格指向 `docs/core/design/PROMPT-SYSTEM.md:3146`「在机制表里带「依据」列」，但设计席模板 8 项里没有「机制表」（`thincoder-core/prompts/persona-eng-designer.md:118`「**Design doc 8 items** (missing one = incomplete):」，`:123` 项 2 = Interface contract）；需求判定句的口径是设计档层面（`docs/core/requirements/METHODOLOGY.md:36`「设计档每条分支带「依据」列」）。实施席照译后，设计席读到的是一格它找不到的表。 | 把落笔格改成模板里存在的名字（如「机制节的机制表」或直接沿用需求的「设计档每条分支带『依据』列」），并在 B2 里点明这条列落在 8 项中的哪一项下。 |
| 4 | Document ownership | 🟡 | 新评审维度只在提示词与本档出现，其权威载体未随正：`docs/core/requirements/METHODOLOGY.md:83` 定 advisor 设计评审维度的「权威载体 = `docs/core/design/ADVISOR-CONVERGENCE.md`」，该档既有形是每维一节 + 验收条目（`docs/core/design/ADVISOR-CONVERGENCE.md:407`「核查维度行为语义 = 本节；执行实现 = 设计评审提示词的对应维度」，§14 / §15 / A-AC15 / A-AC16）。本节 L5 与受影响文件表把该档列为零改 ⇒ 第 6b 维的行为语义只活在提示词与 PROMPT-SYSTEM，权威链少一环。 | 在 docs/core/design/ADVISOR-CONVERGENCE.md 补一节（分支出处核查：两类出处 / 红判据 / 真防御能过）与一条 A-ACn，或在节内写明为何 PROMPT-SYSTEM §6.46 即该维的唯一权威载体（偏离既有链的理由）。 |
| 5 | Document ownership | 🟡 | 新维度与既有第 6 条 `Scope`（`thincoder-core/prompts/advisor-design.md:28`「6. **Scope**: Is the scope appropriate?」）同格相邻、判域重叠（为没见过的输入加分支既是范围蔓延也是无出处分支），本节只证「6 判不出红」，未写两条维度的分工，也未按「既有件三问」形给答案（新增标签「分支出处」/ 编号 `6b` 无 existing / none found / existing-but-unusable 一行）——§6.41 正是本档立的三问纪律。 | 补一行既有件三问：`existing but unusable: 第 6 条 Scope（形容词式，判不出红）`；并加一句分工（6 判范围总量 / 6b 判单条分支的出处），避免评审席同一条既在 6 过又在 6b 红。 |
| 6 | Document ownership | 🟡 | B3 把两个本项目实例写进工程纪律层（`docs/core/design/PROMPT-SYSTEM.md:3156`「**两个本项目实例（脱敏成形态）**」：模型名解析兜底 / 撞键守卫 + 三端拒写），与本档既有口径相抵——`:298`「新文零具体项目实例」正是本档对纪律层新文立的规矩（§6.10「口径（纯通用层）」；§6.9 的实例也只留在说明面）。脱敏成形态仍点名本仓机制（模型名解析 / 撞键守卫 / 三端）。 | 二选一：把实例收成与项目无关的形态（「别名解析的兜底把真名判成了另一档」），或在节内写明本口径不伸到工程纪律层的理由（现无此理由）。 |
| 7 | Acceptance | 🟡 | A6 的读数是推断不是实跑：`docs/core/design/PROMPT-SYSTEM.md:3181` 写「本档实跑 `doc_check(mode:"gate", …)` ⇒ `PASS`」，同一格自述「（2026-10-23 报告态实测 0 命中，gate 同判，见回报）」——报告态与 gate 是两次不同判，且「见回报」指向档外。设计席交付前置正是 gate 首行（`thincoder-core/prompts/persona-eng-designer.md:87`「Only a first line of `DOC-CHECK GATE: PASS` may be returned」）。 | 本节落笔后实跑一次 gate 并引首行（`DOC-CHECK GATE: PASS` / 命中数），或把 A6 改成「报告态读数 + 实施轮 gate 复跑」两步，删掉「gate 同判」的推断句。 |
| 8 | Clarity | 🔵 | K1 的先例坐标已漂：`docs/core/design/PROMPT-SYSTEM.md:3208` 引「`docs/core/design/PROMPT-SYSTEM.md:3154` D-PS37」，现盘 D-PS37 在 `:3275`（`:3154` 属本节 B3 块内）。 | 改按条目号引（D-PS37），或写「D-PS37（行号随写入漂移）」。 |
| 9 | Clarity | 🔵 | `:3200` 记 `thincoder-core/prompts/discipline-engineering.md` 为「327 行 / 40,402 字符」，本席读盘 = 328 行（工具尾行计数）；差 1 属计数式差异而非文件变动。 | 受影响文件表补一句计数式（`split(/\r?\n/).length - 1` 等），读数才可复算。 |
| 10 | Clarity | 🔵 | L1 把英文落笔形态定义为「按 ≤300 字符折行」（`:3166`「≈ +7 行（英文照译后按 ≤300 字符折行）」），只满足了 §6.45 A1 的行宽，未提 §6.45 的写形（一条规则一行 / 题眼加粗 / 理由以 Why 起头）——折行会产出没有题眼的续行；另本节未记它与 §6.19 现盘 `:476`「EN 档**不在行宽机检域**」这一步的口径先后（§6.45 C 表尚未落笔）。 | L1 动作格补写形约束（每行一个题眼加粗短语、why 独立成行），并在节内点明落地须在 §6.45 C1 收正之后或同时成立。 |

范围说明：本次评审上下文未提供文档地图（Document ownership 判据降级——按 Project Guide 与两份评审文档判定），也未提供项目标准档（methodology compliance 按 Project Guide + 需求档判定）。

VERDICT: changes-required

计数：🔴 2 · 🟡 5 · 🔵 3 = 10 行

### 轮次 2（评审子代理）

第 2 轮 · 只验上一轮 10 条（🔴2 / 🟡5 / 🔵3）的修复，不全量重扫。

**逐条核（10/10 → Fixed）**

| 评审 # | 上轮发现 | 本轮核查（证据 = 现盘实读） | 归宿 |
|---|---|---|---|
| 1 🔴 | A3 钉的英文串在 B1–B3 中从未出现；串→档映射与大小写规则缺失 | B1/B2/B3 已为英文逐字块（`docs/core/design/PROMPT-SYSTEM.md:3140` / `:3149` / `:3158`），三条判据串在块内逐字在位；A3（`:3198`）写明「@ 档」映射 + 大小写敏感 + 含标点 | Fixed |
| 2 🔴 | 中文围栏块使 §6.1「批次收尾核对」无比对对象；§6.44 双面形偏离未显式 | `:3132` 块头 = 英文唯一权威目标形 · `:3134` 双面形照 §6.44 · `:3135` 围栏块 = §6.1 比对基线 · 中文复核面 `:3164-3177`；偏离②已删（`:3241` 只剩字母后缀一项） | Fixed |
| 3 🟡 | B2 指向设计席模板里不存在的「机制表」 | B2 改指 8 项 item 2（`:3146` / `:3149` 首行）；磁盘实读 `thincoder-core/prompts/persona-eng-designer.md:123` = `2. **Interface contract**` ✓ | Fixed |
| 4 🟡 | 评审维度权威载体未随正 | `docs/core/design/ADVISOR-CONVERGENCE.md` §16（`:424-432`）+ A-AC17（`:401`）+ 头部维度清单 `:17` 已含 §16 ✓ | Fixed |
| 5 🟡 | 缺「既有件三问」+ 6 ∥ 6b 分工 | `:3242` 三问（`existing but unusable: 第 6 条 Scope` · 标签与编号 `none found`）+ `:3243` 分工句 ✓ | Fixed |
| 6 🟡 | B3 两个本项目实例进入通用层 | `:3160` 两形态已收成项目中性形（不点名模型名 / 撞键 / 三端）；中文面 `:3176` 同步 ✓ | Fixed |
| 7 🟡 | A6 读数为推断、且指向档外 | `:3201` 改为 gate 实跑首行 + 父侧收口轮复跑位 ✓ | Fixed |
| 8 🔵 | K1 先例坐标按行号引已漂 | K1（`:3231`）改按条目号引（A-AC15 / A-AC16 · D-PS37）✓ | Fixed |
| 9 🔵 | 行数差 1 未给计数口径 | `:3214` / `:3225` 写明 `split(/\r?\n/).length - 1` + ±1 属计数式差异；抽核 `advisor-design` 127 / `persona-eng-designer` 142 / `discipline-engineering` 327 与约定自洽 ✓ | Fixed |
| 10 🔵 | L1 只说折行、未提 §6.45 写形；与 §6.19 `:476` 口径先后未记 | `:3189` 写形约束 + 原样落不折行；`:3190` 记 C1 先后（抽核 `:476` 旧口径仍在盘 ✓，故该先后句成立） | Fixed |

**本轮发现（0 🔴 · 0 🟡 · 3 🔵 —— 不阻断）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| A | Clarity | 🔵 | 勘察证据行 `:3252` 引 `:17`「§9 ∥ §14 ∥ §15」——该行已被本笔改为「§9 ∥ §14 ∥ §15 ∥ §16」（引文仍是连续子串，但记录面落后于同一节自己做的修正） | 引文随正为「§9 ∥ §14 ∥ §15 ∥ §16」 |
| B | Acceptance | 🔵 | A6 的 `DOC-CHECK GATE: PASS` 是自报读数，评审面无从复核（本评审工具面无 `doc_check`） | 无需改档：档内已把复跑落到父侧收口轮 |
| C | Clarity | 🔵 | `:3135`（围栏内折行不作落地基线 ⇒ 去折行后逐段比）与 `:3189`（围栏块已按写形写好、原样落不折行）并存；本节三块实际无板内折行，两说会让实施席无法判断是否可重排 | 补半句：本节三块无板内折行，比对即逐行相等 |

范围说明：本轮角色 = 第 2 轮收敛核验，判域 = 上一轮 10 条；文档地图与项目标准档均未提供（Document ownership / methodology compliance 降级为按 Project Guide + 三份评审文档判定）。

VERDICT: pass

计数：🔴 0 · 🟡 0 · 🔵 3；上一轮 10 条 = 10/10 Fixed（🔴2 / 🟡5 / 🔵3）。

## §4 用户批准（主 agent）

**批准（主 agent 代记）**

用户 2026-10-23 22:55「自动跑完」+ 23:00「也自动跑完」= 两批全链授权（FR36）。批内批准门不停。

**评审轨迹**：
- 第 1 轮（`#8`）：changes-required —— 🔴2（A3 钉的英文串设计里从未出现 · 中文围栏块使 §6.1 比对失对象）/ 🟡5 / 🔵3。
- 修正轮（`#9`）：10 条全落；B1–B3 改英文逐字块 + 中文复核面（§6.44 双面形）；补 `docs/core/design/ADVISOR-CONVERGENCE.md` §16 + A-AC17。
- 第 2 轮（`#11`）：**pass** —— 上轮 10 条 10/10 Fixed；新 🔵3（勘察行引文落后 · A6 自报读数 · 折行两说），未决 🔴 = 0。

**批准结论**：设计可实施。实施面 = 三档提示词照英文逐字块原样落笔（不快照中文面、不重排、不折行）。

**实施约束**：
- 逐行 ≤300 字符；题眼加粗每行一处；理由以 `Why` 起头。
- 落地次序：§6.45 连带项 C1（`docs/core/design/PROMPT-SYSTEM.md` §6.19 `:476` 的 EN 行宽口径）未收正前，本条写形以设计 `:3189` 为准——不依赖旧口径。
- 禁区词 `never|must not|do not|don't|forbidden` 零新增。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-10-23 · 三档逐字落笔 · 审计 clean · 代码复核 pass）



**交付摘要**：三档提示词按设计 §6.46 英文围栏块逐字落笔，各 +4 行，零改词 / 零重排 / 零折行；本轮实施面 = 三档，工作树里设计档与需求档的改动属设计席与父侧，非本席。

**块 → file:line**

| 块 | 设计围栏块（唯一权威目标形） | 落地坐标 | 落点 |
|---|---|---|---|
| B1 评审维度 `6b` | `docs/core/design/PROMPT-SYSTEM.md:3140-3143` | `thincoder-core/prompts/advisor-design.md:29-32` | `## Review Criteria` 第 6 条（`:28`）后 / 第 7 条（`:33`）前 |
| B2 落笔格 | `docs/core/design/PROMPT-SYSTEM.md:3149-3152` | `thincoder-core/prompts/persona-eng-designer.md:123-126` | `### Doc structure` 项 1 bullet 列末（`:122` 后 / `:127` 项 2 前） |
| B3 代价句 | `docs/core/design/PROMPT-SYSTEM.md:3158-3161` | `thincoder-core/prompts/discipline-engineering.md:127-130` | `## Engineering judgment (verdicts ∥ sizing)` 节末（`:126` 后 / `:132` 下一节前） |

**交付表（验收 ①–⑦ 逐条）**

| # | 判据 | 状态 | 读数 |
|---|---|---|---|
| ① | 三块逐字落笔（与围栏块整行相等） | ✅ Done | 12/12 行逐行相等（含 `∥` U+2225 · `—` U+2014 · `⇒` U+21D2 · `🔴` U+1F534；B1 续行 3 空格、B2/B3 续行 2 空格原样） |
| ② | A3 三串各恰 1 次（大小写敏感） | ✅ Done | `6b. **Branch provenance**` → `thincoder-core/prompts/advisor-design.md:29` · `Every branch carries its basis` → `thincoder-core/prompts/persona-eng-designer.md:123` · `A branch added for an input that has not shown up` → `thincoder-core/prompts/discipline-engineering.md:127`；全 `thincoder-core/prompts/` 16 档扫，各 1 命中、零跨档溢出 |
| ③ | 落地后逐行 ≤300 字符 | ✅ Done | 三档 `>300` 行数 = 0/0/0；新增行最长 288（B3 首行）；档内最长 290 / 298 / 300（与本笔前一致） |
| ④ | 禁区词零新增 | ✅ Done | 新增 12 行扫 `never\|must not\|do not\|don't\|forbidden`（不分大小写）= 0 |
| ⑤ | `node scripts/prompt-refs-check.mjs` 命中 0 | ✅ Done | 汇总：提示词面 70 档 · 代码面 465 档 · 命中 0（`OK(prompt-refs): J1/J2/J3 三式零命中`） |
| ⑥ | `doc_check(mode:"gate")` 三档 PASS | ✅ Done | 首行 `DOC-CHECK GATE: PASS` · 0 条命中（3 档全清） |
| ⑦ | 编号引用零破坏（A4） | ✅ Done | `## Review Criteria` 节内 `^[0-9]+\. \*\*` 计数 = 11；`6b.` 不占整数编号；第 7–11 条编号与维度名未动（`:33` / `:40` / `:44` / `:48`） |

**独立复核轮次与终态**

| 轮 | 类型 | 读数 | 处置 |
|---|---|---|---|
| 偏离审计 | 内部 explore（只读） | `AUDIT VERDICT: clean` —— 四类偏离（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）均未发现 | 0 修正 |
| 代码复核 | advisor `type="code"` | `VERDICT: pass` —— 🔴 0；🟡 2（均为设计围栏形面问题，非落笔偏离，未标必改） | 0 修正 |
| 自修轮 | — | 0 轮 | 终态 = `clean` |

**设计档面不一致（报告不代笔 · 设计档非本席写权；落笔对围栏是逐字的，故不改落地形）**

1. **B2 缩进级**：围栏 `docs/core/design/PROMPT-SYSTEM.md:3149` 起首为 0 缩进 `- **Every branch carries its basis**`，
  而该档 item 1 的兄弟 bullet（`thincoder-core/prompts/persona-eng-designer.md:120` / `:121`）为 3 空格缩进 ⇒ 落地后该条成为顶层 bullet（item 1 的 bullet 列在 `:122` 结束），与设计 K3「与同类先例行 / 勘察证据行同格同形」及 `:3146`「bullet 列末尾」在 markdown 结构层不成立。
  若需兄弟形，须设计层改围栏（首行 3 空格、续行随级）并同步 A1 基线后重落。
2. **B3 缺 `Why` 独立行**：围栏 `:3158-3161` 无 `Why` 起头行（理由并进首行），而本节写形约束 `:3189`「理由独立成行且以 `Why` 起头」并断言「围栏块已按此形写好」——与 B1（`thincoder-core/prompts/advisor-design.md:31`）/ B2（`thincoder-core/prompts/persona-eng-designer.md:126`）的 `**Why**:` 形不一致。

**未落地项**：无（本批实施面 3/3 落笔；上述两处属设计档形面，待父侧裁定是否开设计修正轮）。

## §6 验证与收口（父代理）

**验证与收口（主 agent）**

### 1. 父侧独立复核（不采信各席报告）

| 检查 | 命令 | 读数 |
|---|---|---|
| 围栏 ↔ 落地 整行相等 | `node` 逐行比对（三对，各 4 行） | **12/12 相等**（`thincoder-core/prompts/advisor-design.md:29-32` · `thincoder-core/prompts/persona-eng-designer.md:123-126` · `thincoder-core/prompts/discipline-engineering.md:127-130`） |
| A3 三串各 1 次 | 全 `thincoder-core/prompts/` 16 档扫描 | 各 **1**，零跨档溢出 |
| 行宽 ≤300 | 逐行扫描 | `advisor-design` 132 行/最长 290 · `persona-eng-designer` 147/298 · `discipline-engineering` 332/**300**；`>300` = 0 |
| 提示词引用 | `node scripts/prompt-refs-check.mjs` | 提示词面 70 档 · 代码面 465 档 · **命中 0** |
| 文档门 | `doc_check(mode:"gate")` 5 档 | **PASS** · 0 命中 |

### 2. 形面修正（`#12` 上抛 → `#14` 落）

- **B2 缩进**：围栏首行 0 → 3 空格（与兄弟 bullet 同格）。父侧先就地修落地档（机械笔，零语义改），设计席再随正围栏 —— §6.1 比对重新成立。
- **B3 理由行**：围栏无 `Why` 独立行，而 `:3189` 断言三块一律独立成行。**不挪文案**，改判据句按实际形写：B1/B2 独立 `Why` 行 · B3 理由收在首句后半。

### 3. 批次单测

本批不动代码、无数值，验收面 = 文本读数（上表）。**未建批次单测档**（无代码面可测）；集成面：本批是提示词与设计档，**未触及业务行为** ⇒ 集成场景无变化，**窗口读数 `0 / 50–100`**（现量 0，见同晚 `2026-10-23-integration-test-as-design-task` 批正在立的第一条用例）。

### 4. 文档门与机械整顿

`doc_check` 两轮共修：PROMPT-SYSTEM 侧由设计席随正；父侧未在本批做扫描式批量改写（仅 §6.46 内文句由设计席落）。

### 5. 结算同步清单

- **§2 ↔ 设计对账**：一致（三处落点 ↔ 三块围栏 ↔ 验收 A1–A6）。
- **前批遗留**：无。
- **暂缓批复核**：无。
- **搁置项复核**：无。
- **修正轮落地前置**：设计两轮（`#8` changes-required → `#9` → `#11` pass）+ 实施一轮（`#12`）+ 形面修正一轮（`#14`），均已落并复核。
- **用户文档面同步**：本条是提示词面纪律，无用户可见能力变化 ⇒ 三端 CHANGELOG **不记**。

### 6. 台账

`#1742` 结账依据 = 本条 + §4 批准 + 设计评审批次（§3 两轮）。
