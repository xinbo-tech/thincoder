# 2026-10-24 · 验收命令纪律：只写改动面单测单档，全量套件归父侧收口
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-24 19:08「那怎么阻止这个毛病？提示词如何增强才能阻止你写这个要求？designer和advisor是不是也应该检查踢出跑全量的要求？」——今晚任务书把「全量套件全绿」写成验收，逼每一轮跑集成，违 TESTING.md F1/F3。
> 台账 = #1763（TESTING · 归批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-24
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-24
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成 2026-10-24（设计档 = `docs/core/design/PROMPT-SYSTEM.md` §6.49；实施面 = 提示词 4 档 4 处，待 eng-coder 落笔）

### 本批条目（覆盖）

| # | 条目（= 本批任务书三条落点） | 判据来源 |
|---|---|---|
| ① | 主 agent 派单纪律：验收只写改动面单测单档（`node --test <档>`），全量套件 = 父侧收口动作 | `design §6.49` B1 / A1–A2 · 需求 `TESTING.md:73`（F1）∥ `:75`（F3） |
| ② | 设计席自查：验收写成全量套件的不是本批验收条件（`thincoder-core/prompts/persona-eng-designer.md:114` 处） | `design §6.49` B2 / A3 · 需求 `:73` ∥ `:74` ∥ `:75` |
| ③ | 评审兜底：设计档验收写全量 ⇒ 🔴（补在 advisor-design 第 12 条内，不新开判据） | `design §6.49` B3 / A4 · 需求 `:73` ∥ `:75` |
| ④ | 同一句话三处同义不同面（写 ∥ 自查 ∥ 审）+ 每处带 why + 给替换形 | `design §6.49`「机制」「与既有句的不重复判据」 |
| ⑤ | 机判方法（一次性落地读数，零常驻断言） | `design §6.49` A1–A7 |

### 明确不在本批（任务书明令）

- 不给实施席加「拒绝违规验收」的检查；不开「任务书评审」维度；不改 `run.mjs`。
- 需求档零改（F1/F2/F3 已是权威）；普通模式提示词档（`discipline-normal.md`）零改。

### 设计档落点

- 机制本体 = `docs/core/design/PROMPT-SYSTEM.md` §6.49（逐字英文块 B1–B3 + 中文复核面 + 落点表 L1–L5 + 验收 A1–A7 + 用例表 C1–C6 + 关键决策 K1–K5 + 勘察证据行）。
- 一句话规则：**验收写的是改动面单测单档；全量套件是父侧的收口动作**——集成是你的收口动作，写进任务书就变成每轮成本，而每轮都跑的套件不再是发布门，只是回合成本。

### 受影响文件（现行 = 设计席 `node` 实读 2026-10-24，详见 `design §6.49` 表）

| 文件 | 现行 | Δ |
|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | 342 行 / max 300 / `##` 10 | +2 行（L1 插入 B1） |
| `thincoder-core/prompts/persona-engineering.md` | 473 行 / max 300 / `##` 17 | −1 行（L2 删旧副本 `:345`） |
| `thincoder-core/prompts/persona-eng-designer.md` | 148 行 / max 298 / `##` 9 | +2 行（L3 插入 B2） |
| `thincoder-core/prompts/advisor-design.md` | 135 行 / max 290 / `##` 7 | +1 行（L4 插入 B3） |
| `docs/core/design/PROMPT-SYSTEM.md` | 3,638 行（本节写入前） | 新增 §6.49（设计档面） |

### 验收对照（回指，不转抄）

- 本批验收 ①–⑤ 的逐条判法 = `design §6.49` A1–A7（字串计数 ∥ 行首索引比较 ∥ 逐行 ≤300 ∥ `prompt-refs-check` 命中 0 ∥ `doc_check` gate PASS）。
- 与需求 F1/F2/F3 的对齐表 = `design §6.49` 表格 F1–F4 与「不重复判据」段；F2 义务句原文不复制，B1 用 `reported, not run` 指路。

**关键决策**：K1–K5 在 `design §6.49`（一句话三处 ∥ 旧副本删除并入 B1 ∥ 落测试纪律节 ∥ B3 补第 12 条内 ∥ 双面形逐字块）。此处不转抄（D2）。

**上抛项**

1. 〔父侧 · 落点 1 既有副本〕`thincoder-core/prompts/persona-engineering.md:345` 在本批前已在盘（规则存在、今晚仍被跳过）。本设计按 `design §6.49` K2 删除它并并入 B1；若父侧认为该副本应保留，请驳回 L2——不驳回则按 L2 落。
2. 〔父侧 · 编号〕设计档 §6.49 未加 §7 D-PS 行（承 §6.47 ∥ §6.48 上抛项）。

**修正轮随正（批档 §3 轮次 1 · 七条全接受）**：设计档 §6.49 现状态——① B1/B2/B3 补「无可跑面 ⇒ 一次性读数」例外半句，A1–A4 / C1–C6 同形随正；② B3 落点 = 第 12 条末（`**Why**: integration tests are the only acceptance run` 行之后、`## Output Format` 前），判断句与其 Why 保持相邻；③ F1 实证改指本批编制行（`:3`）并逐字引串，读数按实读改写；④ 勘察证据行补 `docs/core/design/TESTING.md` 读数（同义句零命中 ⇒ L5 零改成立）；⑤ 设计档补第 9 项（集成测试设计 = 本批不改业务行为 ⇒ 无场景新增 ∥ 修订）；⑥ 受影响文件表行数口径改 `split(/\r?\n/).length - 1`（读数不变）；⑦ 集成半统一为指针形 `reported in the closeout line, not run here`。逐条坐标见设计档 §6.49 对应处；本节不转抄。

补一句显式替换（§2 前文为 append-only，不能原位改）：上文验收对照里「B1 用 `reported, not run` 指路」的引字已失效，现行 = `reported in the closeout line, not run here`（B1/B2/B3 三处统一）。

**修正轮随正（批档 §3 轮次 2 · 1 🟡 + 2 🔵 全接受）**：设计档 §6.49 现状态——

1. 🟡 B3 自有 `Why`：英文围栏块改两行（判断句 + `    Why: acceptance is what the implementing round runs — a suite there turns the release gate into a round cost, and a repeat run proves nothing new.`）；B3 落点说明、L4 行（+2 行）、受影响文件表（advisor 135 ⇒ 137 行）随之；中文复核面 B3 拆出独立「理由：」行与 B1/B2 同形。判法侧：A4 补「规则行的下一行 = B3 自己的 `Why` 行」，A6 补「B1 ∥ B2 ∥ B3 各带一行 `Why`」（判法 = 规则行下一行去掉缩进后以 `Why:` 起头）。
2. 🔵 `docs/core/design/TESTING.md` 行数读数删除（只留四式命中，复扫 `全量` ∥ `full suite` ∥ `full-suite` ∥ `acceptance` 各 0）——该档非本批改动面，行数会独立漂，读数留在设计档必过期；本席实测该档 `split(/\r?\n/).length - 1` = 708 ∥ 数组末元素形 = 709，两句口径不同即不写数。
3. 🔵 「无可跑面」实读锚补在机制第 3 条：受影响文件表前五行全为 `.md` 文本档（提示词 4 + 设计档 1），无 `.mjs` ∥ `.js` ⇒ 无 `node --test` 可跑面，本批自身即此态。

逐条坐标见设计档 §6.49 对应处（本节不转抄）。`doc_check(mode:"gate", docs=["docs/core/design/PROMPT-SYSTEM.md"])` = 首行 `DOC-CHECK GATE: PASS`（0 条命中）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审判据范围**：`docs/core/design/PROMPT-SYSTEM.md` §6.49（`:3551-3695`）∥ `docs/core/requirements/TESTING.md`；实证抽核 = 四档提示词现盘（行号 / `##` 块计数 / 内容锚）+ `docs/batches/2026-10-24-tool-timeouts.md:125` + `PROJECT-MANIFEST.json:35`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / Clarity | 🟡 | B1/B2 的正面半句只承认「验收点名改动面单测档（`node --test <file>`）」这一形（`:3581` ∥ `:3588`），而本节自己的 C4 给纯文档批定的验收 = 一次性字串读数（`:3647`），需求 F1 亦允许「单档 ∕ 相关子集」（`TESTING.md:73`）——对无代码改动的提示词批（含本批自身），落笔后规则没有可满足的正面形，照字面执行 B2/B3 的席位会被推去造一个不存在的测试档 | 在 B1/B2 的规则句内补例外半句（如「——或对无可跑面的改动给一次性读数」），并让 C1–C6 与 A1–A4 各补一行落点，使规则文本与用例表同形 |
| 2 | Clarity / 写形 | 🟡 | B3 落在 `advisor-design.md:54`（判断句）与 `:55`（其 `**Why**:` 行）之间（`:3592` ∥ `:3595`），把既有的「规则 → Why」对拆开：`:55` 的「Why: integration tests are the only acceptance run…」会读成 B3 的理由，而 §6.45 写形要求理由紧随其规则；A4 更把这个拆位写成验收顺序（`:3633`） | 把 B3 移到 `:55` 之后（第 12 条末），或给 B3 自带一行 `Why`，使 `:54` 与 `:55` 仍成对 |
| 3 | Evidence | 🟡 | F1 实证行把今晚任务书的 `acceptance` 引到「本批 §1 来源行」（`:3561`），但该座位的 §1 仍是模板占位（`docs/batches/2026-10-24-acceptance-command-discipline.md:5-7`），其编制行（`:3`）只有「今晚任务书把『全量套件全绿』写成验收」而无被引的 `cd thincoder-cli && node test/run.mjs` ∥ `pass=35/44`；盘上最近的读数是 `2026-10-24-tool-timeouts.md:453`（44/44）与 `2026-10-24-unbooked-pen-nudge.md:322`（35 pass），均非 `pass=35/44` ⇒ 主 agent 座位的场景断言指在一个不存在的坐标上 | 把该行改指实际承载处（批档编制行或派单记录），并从该处逐字引串；读数不同则按实读改写 |
| 4 | Document ownership / Evidence | 🟡 | L5 声明 `docs/core/design/TESTING.md` 与需求档「零改」（`:3622`），但勘察证据行（`:3679-3688`）没有该档的任何读数——同族先例 §6.47（`:3412`）∥ §6.48（`:3538`）都给过所读行；B1 的 D2「无第二处成文」判据因此未对设计侧测试档展示过 | 补该档读数（查过的字串 + 命中读数），或在勘察行写明「已查该档：同义句零命中」 |
| 5 | Methodology | 🟡 | 设计档 9 项规范的第 9 项（集成测试设计）没有落句：本节无「不改业务行为 + 理由」的声明，`UI / 交互决策`（`:3690`）只覆盖第 8 项；设计席规范（`persona-eng-designer.md:134-135`）与评审判据（`advisor-design.md:52-53`）都要求这一段在场 | 补一行：集成测试设计 = 本批不改业务行为（受影响面零代码档）⇒ 无场景新增 ∥ 修订，并给理由 |
| 6 | Numeric / 口径 | 🔵 | 受影响文件表头声明行数口径 = `split(/\r?\n/).length`（`:3651`），但四个读数（342 ∥ 473 ∥ 148 ∥ 135）各自比盘上末行（343 ∥ 474 ∥ 149 ∥ 136）少 1，恰合 §6.47（`:3380`）∥ §6.48（`:3507`）声明的 `… - 1` 口径；Δ 不受影响（字符总量未独立复核） | 把表头口径改成与读数一致的那一式 |
| 7 | Clarity | 🔵 | 「the integration half is reported, not run」（B1 ∥ B2 ∥ B3，`:3581` ∥ `:3588` ∥ `:3595`）与 `discipline-engineering.md:197` 已在盘的义务句并列，是同一义务的第二种说法；孤读可被读成「集成那半永不跑」，而 F3（`TESTING.md:75`）是父侧收口恰跑一次 | 把该半句写成指向收口报告行的指针形（如「reported in the closeout line, not run here」），不再另造一种描述 |

**Counts**：🔴 0 · 🟡 5 · 🔵 2

**已抽核无误的项**（供后续轮省复查）：`:192` `The gate` ∥ `:193` `Iteration = unit tests only` ∥ `:194` release gate ∥ `:197` 报告行与盘面逐字吻合；`persona-engineering.md:345` 旧副本逐字吻合且为 `:344` `**acceptance**` 的独立续行（整行删除不破结构）；`persona-eng-designer.md:114` ∥ `:115` ∥ `:130` 与 `advisor-design.md:52-55` 坐标全中；`##` 块计数 10 ∥ 17 ∥ 9 ∥ 7 与现盘一致（L1–L4 均不新增 `##`）；A1/A3/A4/A5 的字串在盘现零命中（落地后可达「恰 1」）；`full-suite` 在提示词面现零命中；`publicRepos: []` 于 `PROJECT-MANIFEST.json:35` 属实；需求 `TESTING.md:73` ∥ `:74` ∥ `:75` ∥ `:84` ∥ `:160` 与引用描述一致。

VERDICT: pass

### 轮次 2（评审子代理）

**评审判据范围（第 2 轮）**：`docs/core/design/PROMPT-SYSTEM.md` §6.49（`:3551-3699`）∥ `docs/core/requirements/TESTING.md`；抽核 = 四档提示词现盘 + `docs/core/design/TESTING.md` + `docs/batches/2026-10-24-{acceptance-command-discipline,tool-timeouts}.md`。本轮对象 = 上一轮 7 条是否落地 + 修正是否引入新问题。

**7 条落地核（逐条 · 均以现盘实读为据）**

1. 例外半句 —— 落地：B1 `:3581` ∥ B2 `:3588` ∥ B3 `:3595` 三处均含 `or a one-off reading when no runnable face exists`；A1 `:3630` ∥ A3 `:3632` ∥ A4 `:3633` 各判「恰 1」，A2 `:3631` 判「例外半句与规则同行」，C1–C4 `:3644-3647` 同形。
2. B3 落点 —— 落地：`:3592` 改为 `**Why**: integration tests are the only acceptance run` 行之后 ∥ `## Output Format` 之前，A4 `:3633` 同形；实读 `advisor-design.md:52-55` = 第 12 条（判断 ∥ 例外 ∥ Why）、`:56` 空行、`:57` `## Output Format` ⇒ 坐标与落点相符。
3. F1 实证 —— 落地：`:3561` 改指 `docs/batches/2026-10-24-acceptance-command-discipline.md:3` 并逐字引串；实读该行逐字含「今晚任务书把「全量套件全绿」写成验收，逼每一轮跑集成」；旧引（`cd thincoder-cli && node test/run.mjs` ∥ `pass=35/44`）已不在本节。
4. 设计档 TESTING.md 读数 —— 落地：`:3690` 已补；本席复扫 `docs/core/design/TESTING.md` 对 `全量` ∥ `full suite` ∥ `full-suite` ∥ `acceptance` 四式命中 0 ⇒ L5 零改判据成立（行数读数见 🔵 #2）。
5. 设计档第 9 项 —— 落地：`:3651` 已在；`none` 条件回指 §6.46 K2 实存（`:3394`「未触及业务行为的改动（纯文档 ∥ 纯重构）确实没有集成用例可加」）。
6. 行数口径 —— 落地：`:3653` 改为 `split(/\r?\n/).length - 1`；抽核四档现盘末行 343 ∥ 474 ∥ 149 ∥ 136 对读数 342 ∥ 473 ∥ 148 ∥ 135，全为 −1 形，口径与读数一致。
7. 指针形 —— 落地：B1/B2/B3 统一 `reported in the closeout line, not run here`（`:3581` ∥ `:3588` ∥ `:3595`），机制第 3 条 `:3570` 同步，批档随正注 `:58` 一致。

**抽核无误（供下轮省复查）**：`##` 块计数 discipline-engineering = 10 ∥ persona-eng-designer = 9，与 A6 读数一致；B1 上下锚 `:194` ∥ `:195` 在盘相邻；B2 锚 `persona-eng-designer.md:114` ∥ `:115` 逐字吻合且为相邻 bullet；`persona-engineering.md:345` 旧副本三串（`targeted unit tests for the changed face` ∥ `all-green-per-round` ∥ `the integration-test run belongs to parent-side closeout`）仍在盘 ⇒ A5 作「落地后 0 命中」判据成立；三处新串（`one-off reading` ∥ `full-suite acceptance` ∥ `An acceptance criterion names`）在提示词面现 0 命中 ⇒ A1/A3/A4「落地后恰 1」可达；`2026-10-24-tool-timeouts.md:125` 逐字为 F2 实证所述读数。B3 行长本席手工计数约 296 字符 ≤ 300（未脚本复核）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / 写形（本轮修正引入） | 🟡 | 第 2 条修正把 B3 移到第 12 条末（`:3592`），`:54`↔`:55` 的「规则 → Why」对因此复原；但 B3 自身无 Why 行（`:3595` 围栏块只一行判断句），与本节两处声明相抵——`:3576`「写形照本档 §6.45：… 理由以 `Why` 起头」、`:3569`「why（三处同源）」；B1 `:3582` ∥ B2 `:3589` 各带一行 `Why:`，B3 缺。实读 `advisor-design.md:55` 的 `**Why**:` 属第 12 条 `:52` 的判断句（「integration tests are the only acceptance run that starts from a user-visible entry…」），不承载 B3 的「验收命令形态」⇒ B3 孤读无理由；A4 `:3633` ∥ A6 `:3635` 只判字串在场、行宽、块计数与引用锁，不含「新规则行带 Why」⇒ 照落即得一条无理由判据行 | 给 B3 补一行自己的 `Why`（语义 = 本节机制第 2 条三处同源的理由；逐字文本由设计席出），并把「B1 ∥ B2 ∥ B3 各带一行 `Why`」加进 A6 的判法；若判定 B3 与第 12 条共用一条 why，则改在「先例 ∥ 偏离」（`:3674-3676`）显式声明该形、别处不照办 |
| 2 | Evidence / Numeric（本轮修正引入） | 🔵 | 第 4 条修正补的读数（`:3690`）称 `docs/core/design/TESTING.md`「692 行」，现盘实读 709 行——与本轮新补的实读口径不一致；该行的实质判据（`全量` ∥ `full suite` ∥ `full-suite` ∥ `acceptance` 各 0 命中）本席复扫成立，L5 零改结论不受影响 | 行数按现盘重读后改写，或删去行数只留命中读数（判据靠命中表，不靠总行数） |
| 3 | Branch provenance（本轮修正引入的例外形） | 🔵 | 第 1 条修正新增的例外半句 `or a one-off reading when no runnable face exists` 为「无可跑面」态开了分支，但该态只由 C4 `:3647`「（如本批自身）」指认，设计档未给该态的实读证据（对照 F1 `:3561` ∥ F2 `:3562` 两座位的场景均有逐字引串 + 坐标）⇒ 「无可跑面」由谁判、判到什么程度无锚 | 在 C4 或「机制」第 3 条补一句实读证据（例如本批受影响文件表零代码档这一读数），把该态的判据钉在可核坐标上 |

**Counts**：🔴 0 · 🟡 1 · 🔵 2

**口径限制**：本审查上下文无项目标准档、无文档地图（投影自述）⇒ 准则 7（文档归属）按 Project Guide 与既有形制判，判据面可能弱于有地图时。

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-10-24 19:15「开批」为整批令；19:08 逐字「designer和advisor是不是也应该检查踢出跑全量的要求？」为本批要解决的问题。设计评审链：轮 1 pass（7 条）→ 修正 → 轮 2 pass（1 🟡 + 2 🔵）→ 修正 → 实施。

## §5 实施记录（eng-coder）

**状态行**：实施完成 2026-10-24

### 落点对照（任务书 B1/B2/B3 + 删旧副本）

| 落点 | 改了 file:line | 插入 ∥ 删除行数 |
|---|---|---|
| B1 → `thincoder-core/prompts/discipline-engineering.md` | `:195-196`（`:194` release gate 之后 ∥ `:197` 缺集欠账句之前） | +2 |
| B2 → `thincoder-core/prompts/persona-eng-designer.md` | `:115-116`（`:114` Acceptance 之后 ∥ `:117` Dependencies 之前） | +2 |
| B3 → `thincoder-core/prompts/advisor-design.md` | `:56-57`（`:55` 第 12 条 Why 之后 ∥ `:59` `## Output Format` 之前） | +2 |
| 删旧副本 → `thincoder-core/prompts/persona-engineering.md` | 原 `:345` 整行 | −1 |

文案来源 = 设计档 §6.49 围栏块 B1/B2/B3（逐字符照抄；未改写任何既有句，未动四档其它行）。

### 自检读数（一次性 · 本会话实跑）

| # | 判据 | 读数 |
|---|---|---|
| ① | 逐字比对（设计围栏块 vs 落盘） | B1/B2/B3 三块 IDENTICAL（含缩进：B1 两空格续行 ∥ B2 三空格 ∥ B3 四空格）；三处 `Why` 均紧随各自规则行 |
| ② | 行数（`split(/\r?\n/).length − 1` 口径） | discipline 344（+2）∥ persona-engineering 472（−1）∥ designer 150（+2）∥ advisor 137（+2）——与设计受影响文件表四项预测全等 |
| ③ | 超宽行 | 四档 `>300` = 0；最大行 = discipline 300（`:68` 既有）∥ persona-eng 300（`:143` 既有）∥ designer 298（`:104` 既有）∥ advisor 294（B3 规则行 `:56`） |
| ④ | `##` 块数 | 10 ∥ 17 ∥ 9 ∥ 7——零变 |
| ⑤ | 新增串计数 | 目标档各恰 1；全 `prompts/` 目录：三条判断句各 1、例外半句 3（B1/B2/B3 各一）；旧副本三串在 persona-engineering = 0 |
| ⑥ | `node scripts/prompt-refs-check.mjs` | 提示词面 70 档 ∥ 代码面 466 档 ⇒ 命中 0（`OK(prompt-refs): J1/J2/J3 三式零命中`） |
| ⑦ | 改动面 | `git diff` 限定 `thincoder-core/prompts/` 恰 4 档、恰 7 行变更（+6 ∥ −1）；无其它提示词档改动 |
| ⑧ | `doc_check(mode:"gate")` | 四档首行 `DOC-CHECK GATE: PASS`（0 条命中） |

### 审计 ∥ 评审轮次与终态

- **内部分歧审计（explore）**：`AUDIT: clean`——四类偏差 0 条；逐字 × 位置 × 旧副本残留 × 块数 × 行数全一致。审计席无工具未跑的两项（refs-check ∥ git diff）由本席读数 ⑥⑦ 补齐。
- **独立代码评审（advisor · code）**：VERDICT pass（🔴 0 · 🟡 2 · 🔵 2，均非阻塞）。逐条：🟡 #1 替换形只认单档、未覆盖需求允许的「相关子集」∥ 🟡 #2 `discipline-engineering.md` 既有门句（`:192`）未限定，仍可被读成每批全量 ∥ 🔵 #3 设计 §6.49 的 `:197` 坐标落笔后漂移（报告行现为 `:199`）∥ 🔵 #4 `closeout line` 与既有 `Closeout test line` ∥ `Report line` 三名一物。
- **处置**：四条全部原样上抛父侧，未改一字。理由：#1 #4 动的是一句已批准、已两轮评审通过的逐字文案（任务书明令「照抄不改写」）；#2 #3 动的是设计档（设计席笔）。实施轮擅自改任一处 = 交付与批准目标形不一致 ∥ 越出本席笔域。
- **修正轮**：0 轮（无偏离可修）。
- **终态**：`clean`。

**测试面**：本批改动面全为 `.md` 文本档（提示词 4 + 设计档 1），无 `.mjs` ∥ `.js` 档 ⇒ 无 `node --test` 可跑面；验收 = 一次性落地读数（设计 §6.49 C4 例外半句的正面形）。**未跑 `run.mjs` 全量**（任务书明令）。

## §6 验证与收口（父代理）

## 验证与收口

**父侧复核（不采信报告，实跑）**

| 项 | 读数 |
|---|---|
| 改动面 | `git diff --stat -- thincoder-core/prompts/` = **4 档 +6 / −1** |
| B1 在位 | `discipline-engineering.md` 含 `An acceptance criterion names the changed-face unit test file` ✅ |
| 旧副本已删 | `persona-engineering.md` 内 `targeted unit tests for the changed face` **零命中** ✅ |
| 超宽行 | 四档 `>300` 字符 = **0**（discipline 345 行 ∥ persona-eng 473 ∥ designer 151 ∥ advisor 138） |
| 引用检查 | `node scripts/prompt-refs-check.mjs` 命中 0（实施席读数） |

**批内单测档**：本批为提示词文本，无单测档。

**集成场景 = 无新增（记明理由）**：改动是判据文本本身，不改变代码路径；其效果由模型行为体现，无可确定性断言的前端入口。

**评审遗留两条 🟡 的处置**：① 替换形只认「单档」，未覆盖 F1 允的「相关子集」；② 既有门句 `:192` 未限定，仍可被读成每批全量。**两条都不在本批单独修**——它们与「集成测试的表达轴选错」是同一处，并入概念重写批（`#1768`）统一处理。
