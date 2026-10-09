# 2026-10-10 · prompt-face-residues
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10「全清了」直令（承 03:39「归批清理」）+ 清账轮批档簇Ⅰ = #1163 ∥ #1165 ∥ #1171 ∥ #1173（提示词面清收）。
> 台账 = #1163（core · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 簇Ⅰ）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）**

**直令**：用户 2026-10-10「全清了」（承 03:39「归批清理」）——本批 = 清账轮簇Ⅰ（`docs/batches/2026-10-10-ledger-full-triage.md` §1 ②）；授权 = 会话全自动沿用。

**条目（4）**：
- `#1163`：「特殊」槽位族注释统一为 `槽位:[值]` 形——EN `thincoder-core/prompts/advisor-design.md:1` + CN `docs/core/design/prompts/advisor-round1/2/3.md` ∥ `consult-base.md`（5 处）。
- `#1165`：普通侧 `docs/core/design/prompts/discipline-normal.md:92`「同类」定义同源补齐（待裁：沿 D-PS13「同源同知识」先例）。
- `#1171`：提示词面写权三说同拍裁定唯一口径（D1 矩阵 ∥ `ENGINEERING-MODE-V2.md:365` ∥ 人格档 `:15` 面）。
- `#1173`：CN `discipline-engineering.md:99` 半句 vs EN `:101` 无对位（补译 ∥ 判 CN 冗余）。

**边界**：只动上述坐标；不改提示词语义面（#1171 = 口径裁定 + 措辞随正）；不触他簇。

**授权口径**：会话全自动（2026-10-10 03:07「全自动」+ 03:44「全清了」）——设计 → 评审（用户点火）→ 批准 → 实施。

**父裁（2026-10-10）**：① `#1163` 计数差 5⇒9 处——按设计轮现读 9 处取齐 ✓（§1 原计数随收口同步）；② 泛式残句 4 档（`TESTING.md:127` ∥ `LEDGER-SELF-CONTAINED.md:270` ∥ `PORTABILITY.md:234` ∥ `DOC-MIGRATION.md:568`）归批 → 台账 `#1174`（面外残句收束批）；③「引文第二处不可定位」= 无动作（全仓扫单命中、零影响）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮（initial · eng-designer · 2026-10-10）**

### 本批条目（覆盖 4 · 逐条对照）
| # | 条目 | 裁定 / 结论 | 落地面 |
|---|---|---|---|
| #1163 | 「特殊」槽位族注释形不一 | 家族统一为 `槽位:[值]` 形（现读 = **9 处**未括形，见下表） | 提示词双面 × 9 处（CN 4 + EN 5） |
| #1165 | 普通侧「同类」定义 | **同源补齐**（裁定 + 理由见下） | CN/EN `discipline-normal.md:92` |
| #1171 | 提示词面写权三说 | 唯一口径 = **按面分述**（裁定句 + 三说处置见下） | `DOC-DISCIPLINE.md:16` + 纪律档 `:18` 双面 |
| #1173 | CN :99 半句 / EN :101 无对位 | **EN 补译**（CN 保留；理由见下） | EN `discipline-engineering.md:101` |

不在本批（§1 边界沿用）：#1167（他批在途）· 簇 Ⅲ/Ⅳ/Ⅵ/Ⅶ · #1136（运行文案面）· 提示词语义面（措辞零改——本批 = 注释形 / 对译补齐 / 写权口径面）。

### 逐条落地表（动作 ∥ 目标 file:line ∥ 期望结果 ∥ 机检法）

**#1163 · 9 处（仅第 1 行注释形；其余逐字不动）**

现读实况（本席逐档读第 1 行 · 2026-10-10）：家族内先行收正 1 处 = `docs/core/design/prompts/advisor-design.md:1`（`槽位:[特殊-advisor-design]`——#34 修正轮评审 #32 第 8 条直落，见 `docs/batches/2026-10-09-design-precedent-survey.md:211/:227`）；未括形 = 9 处。**计数差（报告）**：§1/台账记「5 处」；现读多 4 处（EN round1/2/3 + EN consult-base）——本设计按全家族 9 处取齐（只改 5 处 ⇒ EN 面内自相残形仍在，「统一」不闭）。

| # | 动作 | 目标 file:line | 期望结果（改后第 1 行） |
|---|---|---|---|
| C1 | 槽位值加方括号 | `docs/core/design/prompts/advisor-round1.md:1` | `<!-- 槽位:[特殊-advisor-round1] 消费方:[advisor round-1 代码评审注入——自含，不属于主装配链] -->` |
| C2 | 同上 | `docs/core/design/prompts/advisor-round2.md:1` | `槽位:[特殊-advisor-round2]`（其余逐字不动） |
| C3 | 同上 | `docs/core/design/prompts/advisor-round3.md:1` | `槽位:[特殊-advisor-round3]`（其余逐字不动） |
| C4 | 同上 | `docs/core/design/prompts/consult-base.md:1` | `槽位:[特殊-consult]`（其余逐字不动） |
| E1 | 同上（EN 对位） | `thincoder-core/prompts/advisor-design.md:1` | `slot:[special-advisor-design]`（其余逐字不动） |
| E2 | 同上 | `thincoder-core/prompts/advisor-round1.md:1` | `slot:[special-advisor-round1]`（其余逐字不动） |
| E3 | 同上 | `thincoder-core/prompts/advisor-round2.md:1` | `slot:[special-advisor-round2]`（其余逐字不动） |
| E4 | 同上 | `thincoder-core/prompts/advisor-round3.md:1` | `slot:[special-advisor-round3]`（其余逐字不动） |
| E5 | 同上 | `thincoder-core/prompts/consult-base.md:1` | `slot:[special-consult]`（其余逐字不动） |

变更语义 = 零（注释形面）·行数 Δ = 0（原位）。标准形先例 = CN `advisor-design.md:1`（括形）+ 全族编号槽（`[1]`–`[4]`，双面已同轴）。
机检法（块级）：node UTF-8 扫描 10 档第 1 行 vs 正则 `^<!-- (?:槽位|slot):\[(?:特殊|special)-[^\]]+\] (?:消费方|consumers):\[.+\] -->$` ⇒ **10/10 命中**；残形扫描（`槽位:特殊|slot:special` 去括形）⇒ **0 命中**。勿用 `findstr /c:"中文"`（本机不可判别——#102 在册）。

**#1165 · 2 处（in-place；句其余逐字不动）**

| # | 动作 | 目标 file:line | 期望结果 |
|---|---|---|---|
| N1 | 「同类」处嵌补定义（同源逐字） | `docs/core/design/prompts/discipline-normal.md:92` | `…扫同面既有行——**同类 = 同一事项**（同一问题 ∥ 同一工作对象——与 \`kind\` 字段取值无关）**并入**（不另立新行），否则**注记关系**（关联行互指）。` |
| N2 | EN 对位同拍 | `thincoder-core/prompts/discipline-normal.md:92` | `…scan the existing rows on the same face first — the same item (same problem ∥ same work object — irrespective of the \`kind\` field) ⇒ merge (no second row), otherwise note the relation (cross-referencing rows).` |

**裁定与理由（§1 待裁 ①）＝ 同源补齐**（沿 D-PS13「同源同知识」先例）。① 歧义同物同形：普通侧同句「同类」同样未定义、同样可被读成「`kind` 字段同类」——#1155/#1156 的两行并存病（病单 + 治单）对普通侧同样开放（登记 = 同一台账、同一主 agent 行为面，与模式强流程无关）；② D-PS13 已立判例（`docs/core/design/PROMPT-SYSTEM.md:589`）——「批次档非工程专有 · 文档体系对全模式同一 · 两模式之别 = 是否强流程约束」⇒ 模式无关的知识面同源同知识；③ 反驳「不补」的候选理由已试尽：「普通侧无失败史」不成立（防护对象 = 同歧义，非失败史）；「D2 重复」不成立（两侧受众互不读对方档，D-PS13 同款成立）。**未随迁项（明示）**：工程侧尾十字句「与批点火前的合并扫描（『批设计』条）互为上下游」= 工程侧接线（普通侧无同款条）——不入普通侧。
机检法（块级）：CN :92 含 `同类 = 同一事项` ∧ EN :92 含 `the same item`；同源回归锚 = 工程侧两坐标（`docs/core/design/prompts/persona-engineering.md:177` ∥ `thincoder-core/prompts/persona-engineering.md:180`）仍在位。

**#1171 · 2 处收正 + 1 处核对（复核结论）**

裁定句（唯一口径）：**提示词 = 产品代码；内容权 = 主 agent（双面）；落笔按面分述——中文审核面（`docs/core/design/prompts/**`，文档面 / 非运行期）= eng-designer 笔（随设计轮直落——2026-09-26 裁定）；英文运行面（`thincoder-core/prompts/**`）= eng-coder 落笔（走正常链：设计评审 → 用户批准 → 实施轮；起草 = eng-designer 逐字草案 → 主 agent 确认 → eng-coder 机械落笔）。**

三说处置（逐条）：①「主 agent 内容权 + eng-coder 落笔」泛式——**收正为按面分述**（残留仅 3 坐标，见下表；依据 = ② 的 2026-09-26 裁定已把中文设计档面切出运行期面，① 为切出前的旧概括）；② `ENGINEERING-MODE-V2.md:365`「中文设计档面其笔归设计轮」= **保留**（= 裁定句之中文面半幅；实存坐标 `:365` ∥ `:602`）✓；③「提示词模板目录除外（含中文模板）」= **已消解**：两面人格档现文已收正为「不碰英文运行面；笔域 = 中文审核面」（CN `persona-eng-designer.md:6/:14/:15` ∥ EN 同名坐标——#1157 落地，本席复核已核）⇒ 零改。

| # | 动作 | 目标 file:line | 期望结果 |
|---|---|---|---|
| W1 | D1 行并入按面分述（与 `discipline-engineering.md:170` 同语逐字） | `docs/core/design/DOC-DISCIPLINE.md:16` | 「提示词 = 主 agent 内容权 + eng-coder 落笔」⇒「提示词 = 主 agent 内容权 + **落笔按面分述：中文审核面 = eng-designer 笔 · 英文运行面 = eng-coder 落笔**」 |
| W2 | 括注对齐（CN） | `docs/core/design/prompts/discipline-engineering.md:18` | `（提示词 = 主 agent 内容权 + 落笔）` ⇒ `（提示词 = 主 agent 内容权 + 落笔按面分述）` |
| W3 | 括注对齐（EN） | `thincoder-core/prompts/discipline-engineering.md:18` | `(prompts = main agent content authority + landing)` ⇒ `(prompts = main agent content authority + landing split by face)` |

已达标面（零改 · 逐处已核）：`ENGINEERING-MODE-V2.md:365/:602` ∥ `PROMPT-SYSTEM.md:163` ∥ `discipline-engineering.md:170` ∥ EN `:177` ∥ 人格档双面 `:6/:14/:15`。V2:602 的「eng-coder 落笔（运行期面——…）」= 括注切面式，属标准同义表达（明示保留）。
机检法（块级）：W1–W3 含「按面分述 / split by face」；收正域（`DOC-DISCIPLINE.md` + 纪律档双面）内「内容权 + eng-coder 落笔」（无分述同句）残形 = 0；已达标面读回比对零漂。

**#1173 · 1 处（EN in-place；CN 零改）**

| # | 动作 | 目标 file:line | 期望结果 |
|---|---|---|---|
| T1 | 半句补译（插于「budget;」与「**verification spend…**」之间） | `thincoder-core/prompts/discipline-engineering.md:101` | `…integration sets stay inside their budget; the two gates (never convert ∥ over budget ⇒ trim) are **hard discipline**; **verification spend ∝ cost of failure, not code volume**.` |

**裁定与理由（§1 待裁 ②）＝ EN 补译**（判 CN 非冗余，不删）。① 该半句 = **用户裁定语本体**（2026-09-28/29 用户 00:12 裁「两道闸（永不互转 ∕ 超窗即裁）为硬纪律」——同句落需求档 `docs/core/requirements/TESTING.md:113` N21）——删 CN = 删用户裁定，不可；② D-PS1：EN = 中文审核面的翻译产物，对译缺口的默认收正 = 补译（M9 回写），反向删权威面须更强理由（此处无）；③ 语义非冗余：两闸的**强度归类**（硬 = 不可情境放松）非 :98/:100 各条自含（各条只述规则本体）——EN 运行面缺此句 ⇒ 运行时读者拿不到强度标注。
机检法（块级）：EN :101 含 `the two gates` ∧ `hard discipline`；CN :99 零改读回（含 `两道闸…硬纪律` 原句）；双面语义对位 = 人工对读一次（明示：措辞对位不可机判）。

### 本批落笔分面（按 #1171 裁定口径 · dispatch 用）
- CN 6 处（C1–C4 ∥ N1 ∥ W2）= **eng-designer 笔**（逐字 = 本表）；EN 7 处（E1–E5 ∥ N2 ∥ W3+T1）= **eng-coder 落笔**（逐字 = 本表——设计轮已出逐字草案）；设计档 1 处（W1）= eng-designer 笔。

### 受影响文件（14 档 · 全 .md——行数档豁免；逐档 Δ 行 = 0，逐处原位）
- CN 提示词面 6：`docs/core/design/prompts/`——`advisor-round1.md` · `advisor-round2.md` · `advisor-round3.md` · `consult-base.md`（各 :1）· `discipline-normal.md`（:92）· `discipline-engineering.md`（:18）。
- EN 运行面 7：`thincoder-core/prompts/`——`advisor-design.md` · `advisor-round1.md` · `advisor-round2.md` · `advisor-round3.md` · `consult-base.md`（各 :1）· `discipline-normal.md`（:92）· `discipline-engineering.md`（:18 + :101）。
- 设计档 1：`docs/core/design/DOC-DISCIPLINE.md`（:16）。

### 测试面（现有常驻机检说明 · 零新增门）
- `node scripts/prompt-refs-check.mjs`（仓根）：域 = `thincoder-core/prompts/**` + `thincoder-core/tool-docs/**` + `docs/core/design/prompts/**` 两提示词面——本批改动不引入文档引用 ⇒ 期望保持 `命中 0`（回归读数；判据三式 J1/J2/J3 与本批改面不相交）。
- `node scripts/doc-check.mjs`（仓根）：域 = manifest scanDirs（收 `docs/**`，含 CN 提示词面）——锚 / 行宽 / 行数面；**EN 面不在其域**（明示）；本批 CN 改动均为行内文本 ⇒ 复核各改后行 <300 字符 + 零新锚。
- 现有 test 树对本批 14 档零断言（thincoder-core / cli 测试树 2026-09-28 全清后未建提示词面断言——现读 core = `run.mjs`/`slow.mjs`、cli = `run.mjs`/`slow.mjs`+3 smokes）；`slot:special-*` 全仓 .mjs 消费 = 0（实扫）——注释形改动无代码依赖。
- 批内单元件 = 上四「机检法」块（node 单脚本，随批次档存档、随批复跑）。

### 验收对照（逐条回指）
| 条目 | 验收（可机判） |
|---|---|
| #1163 | 10 档第 1 行全中括形正则（10/10）∧ 残形扫描 0 |
| #1165 | 普通侧双档 :92 含定义句（同源逐字）∧ 工程侧两锚在位 |
| #1171 | W1–W3 含按面分述句 ∧ 收正域残形 0 ∧ 已达标面读回零漂 |
| #1173 | EN :101 含对位句 ∧ CN :99 零改读回 |
| 全批 | `doc-check` EXIT 0 ∥ `prompt-refs-check` EXIT 0 ∥ 零夹带（14 档 diff 逐处 = 本表行） |

### 上抛项与范围外发现（findings——逐条）
1.〔一致性面 · 已就地校正〕**#1163 计数差**：§1/台账记「5 处」；现读 = 9 处未括形（多 EN round1/2/3 + EN consult-base 4 处）。本设计按 9 处取齐；§1 计数请父侧随收口刷新。
2.〔记录面小疑 · 报告不追改〕台账 #1163 证据句「与收正后 `槽位:[值]` 两处同形不同」——本席全仓扫（`槽位:[特殊` / `slot:[special`）仅 1 处命中（CN `advisor-design.md:1`）；「两处」第二处不可定位（疑引文差）。零影响：动作 = 全家族取齐，不依赖该计数。
3.〔范围外发现 · 报主 agent 路由（不扩条目）〕泛式残句「提示词 = 主 agent 内容权 + eng-coder 落笔」他档在盘：`docs/core/design/TESTING.md:127` ∥ `LEDGER-SELF-CONTAINED.md:270` ∥ `PORTABILITY.md:234`（「落笔 = 实施舱」）∥ `DOC-MIGRATION.md:568`——归批 ∥ 随触碰收正，由主 agent 定。历史批档与 `_archive/**` 命中 = 记录面 / 归档面（零触）。
4.〔知会 · 装配面〕本席 spawn 所见系统性提示词与盘面差（人格档旧文「prompt template dirs excluded…」vs 盘面已收正）——装配面进程级缓存滞后（机制既有）；本设计按**盘面**取齐（盘 = 真相源），不影响本批；提示 = 运行态刷新（进程重启）时机由主 agent 知悉。

### 边界（不做）
提示词语义 / 措辞零改（advisor 族正文、注释语义、消费方字段均零触——唯形面）· 不动 advisor 运行时装配与任何 .mjs · 不触他簇（Ⅲ/Ⅳ/Ⅵ/Ⅶ）∥ #1167 ∥ #1136 · 需求档零笔（若 #1171 口径句需入需求档 = 主 agent 定）。
**UI / 交互面：零**（注释形 / 文本对位 / 设计档口径——无界面面）。

### 零触确认（本席）
本席本轮唯一写入 = 本 §2（batch append）。提示词 / 代码 / 设计档 / 需求档 / 台账：零写。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**状态行**：✅ 已收口（2026-10-10 · 机械面轻收——记录 + 机检 + §6，不挂独立评审；口径 = 用户 03:28「纯机械面最简收口」）

**父侧落笔（2026-10-10 · 父侧直接执行 · 逐处可 revert）**：
- `#1163`（9 处）：CN `advisor-round1/2/3.md:1` ∥ `consult-base.md:1` + EN `advisor-design.md:1` ∥ `advisor-round1/2/3.md:1` ∥ `consult-base.md:1` —— `槽位:特殊-…` ⇒ `槽位:[特殊-…]` / `slot:special-…` ⇒ `slot:[special-…]`（与已收正先例 `advisor-design.md` 同形）。
- `#1165`（2 处）：`discipline-normal.md:92` CN/EN —— 嵌补「同类 = 同一事项（同一问题 ∥ 同一工作对象——与 `kind` 字段取值无关）」（同源补齐）。
- `#1171`（2 处收正 + 1 核对）：`DOC-DISCIPLINE.md:16` D1 行 + `discipline-engineering.md:18` CN/EN —— 落笔按面分述（中文审核面 = eng-designer 笔 · 英文运行面 = eng-coder 落笔；EN「landing split by face」）；其余三说坐标现读达标 = 零改（核对 ✓）。
- `#1173`（1 处）：`thincoder-core/prompts/discipline-engineering.md:101` —— 补译「the two gates (never convert ∥ over budget ⇒ trim) are **hard discipline**;」。

**机检读数（父侧实跑）**：`node scripts/doc-check.mjs` ⇒ **EXIT 0**（锚 0 悬空 ∥ 行宽 = 源域全部 .md 无 >300 字符单行；行数面报告 1 条 = `docs/desktop/design/PACKAGING.md:340` 报告态——他批既存）∥ `node scripts/prompt-refs-check.mjs` ⇒ **OK（提示词面 82 档 ∥ 命中 0）**。

**计数**：条目 4/4（`#1163` ∥ `#1165` ∥ `#1171` ∥ `#1173`）全覆；落点 14 处 + 核对 1 处；零产品码（仅提示词/纪律档面）。
