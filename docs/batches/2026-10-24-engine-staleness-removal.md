# 2026-10-24 · 取消 doc_check 引擎过时检测
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-24 23:26「为什么引擎过时检测还在？不是已经要求取消了吗？」+ 23:29「我今天明确要求过，取消这个检测！」+ 23:32「开批！」。
> 台账 = #1776（DOC-CHECK · 归批）。前情 = 2026-10-24-prompt-wording-clarity.md（已收口 2026-10-24）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25

**已定决定**：取消 `doc_check` 的引擎过时检测——引擎档 mtime > 进程启动 ⇒ `ERROR` 不产 PASS 的那一段，连同其理由文一起删。用户原话：「我今天明确要求过，取消这个检测！」「开批！」· 时间：2026-10-24 23:29 / 23:32

**症状（今晚实测）**：`anchors.mjs` 被碰过一次（内容已回退、mtime 留痕）后，本会话所有 gate 恒 ERROR——`#87` / `#77` / `#84` / `#92` 的每次写入回执都多一行「请重启会话后复跑」。「引擎件会被频繁改」与「一改所有会话 gate 不可用」相互放大：检测面存在的前提（防旧引擎假读数）与它的代价（任何一次引擎触碰就废掉所有在飞批的 gate）不成比例。

**原设计理由（F8）**：ESM 模块缓存会让会话进程读到旧引擎，不校验即假阳 ∥ 假绿。
**用户裁定覆盖了它**：取消。删后旧引擎假读数的风险由谁兜 = 设计要回答的问题（明示即可，不许再把检测换形加回来）。

**待设计定的面**：需求档 F8 整行删（含 report 注记行）· 实现 `agent-tools/doc-check.mjs` 检查段删 · `tool-docs/doc_check.md` 对应句删 · `doc-check/version.mjs` 处置（删档或留件说明）· 引 F8 的设计档行随正 · 既有批档里「须重启会话复跑」的句子不动（批档 = 历史，不回改）。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-24（设计档三面已落（DOC-DISCIPLINE §3.20 族删 + MANIFEST + PROMPT-SYSTEM 随正）；实现面与需求档 F8 行归 eng-coder / 主 agent）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成 2026-10-24（详见下行逐面表；doc_check gate 读数随交付报告给出）

### 本批条目（覆盖 · 逐面处置）

| # | 条目 | 面 ∥ 档 | 落笔 |
|---|---|---|---|
| 1 | F8 整行删（含 report 注记句） | 需求档 `docs/core/requirements/DOC-CHECK.md:25` | 主 agent（需求档笔域） |
| 2 | §3.20「引擎版本一致」族删 + 引 F8 / 引检测各行随正 | 设计档 `docs/core/design/DOC-DISCIPLINE.md`（坐标见下「改动明细」） | 本席（本批落） |
| 3 | F8 零改句 + AC-51 行删 | 设计档 `docs/core/design/MANIFEST.md:902` ∥ `:973` | 本席（本批落） |
| 4 | 引检测句两处随正（「已知代价（改引擎件）」段 ∥ 验收表 ERROR 行） | 设计档 `docs/core/design/PROMPT-SYSTEM.md:907` ∥ `:1212` | 本席（本批落） |
| 5 | 工具描述两段删（report 陈旧注记段 + gate 版本校验句） | `thincoder-core/tool-docs/doc_check.md:3-6` ∥ `:46-50` | eng-coder（提示词面，实施轮） |
| 6 | 实现档残留注释删（档头 :13-14 版本前置自述 ∥ :23-24 版本函数单源注 ∥ :68 report 注记注） | `thincoder-core/agent-tools/doc-check.mjs` | eng-coder（实施轮） |
| 7 | `doc-check/version.mjs` 处置 = **留件** | 现盘 10 行、仅导出 `firstVerdictLine` | 零笔（理由见「关键决策」②） |

**本批明确不做**：既有批档里「须重启会话复跑」的历史句零回改（批档 = 历史）；F1–F7 / F9 / F10 零触；检测不以任何变形加回（用户 2026-10-24 23:29 裁定）。

### 关键实测（本席实读 · 改变处置面的一个事实）

检测的**代码本体已不在盘**：`thincoder-core/doc-check/version.mjs` 现仅 10 行、只导出 `firstVerdictLine`（档头注明「2026-10-24：原『引擎版本一致性』整族删除（用户裁定）」）；`agent-tools/doc-check.mjs` 全文无 `staleEngineFiles` 调用（grep `staleEngineFiles|ENGINE_FILES|引擎已更新` 于 `thincoder-core/` 仅命中工具描述与注释残留）；`agent-tools/batch-gate.mjs:28` 仅 import `firstVerdictLine`。
⇒ 今晚在飞批（#87 / #77 / #84 / #92）仍收 `ERROR` 的成因 = 各会话进程启动时经 ESM 缓存的旧引擎模块仍在内存中跑，**重启会话即消**——这正是被删机制自身的残影，不是盘上还有检测。
⇒ 本批的剩余工作面 = **规范面与描述面**：需求档 F8 行、设计档引用族、工具描述两段、实现档三处注释。

### 机制设计（删后形态）

**删，不替代。** gate 的 ERROR 因枚举由两因（多项目工作区 ∥ 引擎已更新）收敛为**一因**（`target` 指向多项目工作区）；批档门侧 ERROR 因保持（manifest 不可读 ∥ 门自身异常），其中「引擎已更新」从三因枚举中删去。
`report` 面的 `[doc_check note] 引擎陈旧…` 注记行整体删除——它由同一检测驱动，检测没了注记无从产生。

**删后旧引擎假读数的风险由谁兜（设计必答句）**：由**读数纪律**兜——交付 / 收口 / 验收的机检读数只取**新进程（盘上引擎）直跑**，会话内工具面读数不作交付判据；该纪律句改写后留在 `DOC-DISCIPLINE.md` §3.20「判据源」块。**不加回任何形式的 mtime / 版本比对**（用户裁定取消，本批不设等价物）。
为什么这够：检测要防的是「旧引擎读数被当真值」；新进程直跑读数这一既有纪律（§3.20 原「读数纪律」行本就这么写）直接把假读数挡在取证面外，代价 = 取证时多开一个进程，远小于「任何一次引擎触碰废掉所有在飞批 gate」。

### 改动明细（设计档 · 本席落 · 行号 = 开工时实读 as-of）

`DOC-DISCIPLINE.md` §3.20 域内逐处：
`:1071` 删 report 注记分句 ∥ `:1084` 读数纪律行改写（删「版本 stale 时…ERROR」句，保留新进程取证内核）∥ `:1097` ERROR 余形枚举删「引擎已更新」∥ `:1098` 两因两处置收敛为一因一处置 ∥ `:1099–1114`「引擎版本一致」整块（含判据 / 比较 / 裁定 / 多档形 / 保守方向 / report 注记 / 实现缝）整删 ∥ `:1143`「引擎版本一致（同挂）」行删 ∥ `:1144` ERROR 消费分野句保留（对残余 ERROR 因仍成立），删其「引擎在会话中途被改写」代价句 ∥ `:1149–1150` 实现面句删版本前置与 clock 注入缝表述 ∥ `:1152` 门自身异常三因枚举删「引擎已更新」∥ `:1167` 报面码块删注记行 ∥ `:1178` 删「陈旧 ⇒ 注记行居首」句 ∥ `:1264` ERROR 首行原因枚举删「引擎已更新」∥ `:1271` 产品档位行删「gate 前置版本校验」∥ `:1292–1295` 实装现状块改写（`version.mjs` 描述改为现真值 = `firstVerdictLine` 单源）∥ `:1298` 四段契约枚举删「引擎版本一致」∥ 用例表 `:1319` DD-90 收窄为多项目工作区单因 ∥ `:1320` DD-91 整行删（所测机制已删）∥ `:1326` DD-97 整行删（同）∥ 验收 `:2017` A-DD30 ① 删 staleEngineFiles 接线断言与 report 注记断言 ∥ `:2031` A-DD31 ③ 删 DD-97 引 ∥ `:2029` 五档 `node --check` 清单保留（`version.mjs` 仍在盘）。
`MANIFEST.md:902` F8 零改句删 ∥ `:973` AC-51 整行删（所守对象已删）。
`PROMPT-SYSTEM.md:907`「已知代价（改引擎件）」段删（所述代价已随检测删除而不存在）∥ `:1212` 验收表 A6 行的 ERROR 读数句改为现行口径（gate 直跑取 PASS，无「重启后复跑」前置）。

### 受影响文件表

| # | 档 | 当前行数 | 预计增量 |
|---|---|---|---|
| 1 | `docs/core/requirements/DOC-CHECK.md` | 56 | −1（F8 行；主 agent 笔） |
| 2 | `docs/core/design/DOC-DISCIPLINE.md` | 2201 | ≈ −25（§3.20 族 + 用例 / 验收行） |
| 3 | `docs/core/design/MANIFEST.md` | —（实读：行数随实施轮核） | −2 |
| 4 | `docs/core/design/PROMPT-SYSTEM.md` | —（同上） | ≈ −2（一处段删 + 一处行改写） |
| 5 | `thincoder-core/tool-docs/doc_check.md` | 67 | −8（两段） |
| 6 | `thincoder-core/agent-tools/doc-check.mjs` | 74 | −5（三处注释） |
| 7 | `thincoder-core/doc-check/version.mjs` | 10 | 0（留件） |

### 用例表（本批 earned 的验证场景）

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| E1 | 正常 | 引擎档 mtime 晚于进程启动的会话内跑 `doc_check(mode:"gate")` | 不再出 `ERROR（引擎已更新…）`；按内容判 PASS ∥ REFUSED |
| E2 | 边界 | 引擎档不可读 | 不作 ERROR 因（该因已删）；内容照判 |
| E3 | 错误（回归） | `target` 指向多项目工作区 | `ERROR（多项目工作区…）` 逐字保留（唯一残余因） |
| E4 | 正常（回归） | `report` + 显式档集 | 首行 = `文档纪律机检（报告态 · 非门禁）`，其前零注记行 |

集成测试设计：本批改动不改业务行为（删一道误伤的内部前置），集成集不变；验证 = 上表 E1–E4 由实施轮以夹具 / 实跑取证。

### 验收对照（逐条可机判 · 回指条目表）

| # | 判据 | 回指 |
|---|---|---|
| A1 | `DOC-CHECK.md` 功能点表内 `F8` 命中 = 0 | 条目 1 |
| A2 | `DOC-DISCIPLINE.md` 内 `引擎已更新` ∥ `staleEngineFiles` ∥ `引擎陈旧` ∥ `reportEngineNote` ∥ `gateEngineError` ∥ `ENGINE_FILES` 六串命中各 = 0 | 条目 2 |
| A3 | `tool-docs/doc_check.md` 内 `引擎已更新` ∥ `stale` ∥ `newer than this session's start` 命中 = 0 | 条目 5 |
| A4 | `agent-tools/doc-check.mjs` 内 `引擎陈旧` ∥ `版本一致` ∥ `version.mjs`（注释面）命中 = 0；`node --check` 过 | 条目 6 |
| A5 | `version.mjs` 在盘且导出 `firstVerdictLine`；`batch-gate.mjs` import 解析正常（`node --check` 过） | 条目 7 |
| A6 | `MANIFEST.md` 内 `AC-51` ∥ `F8 面零改` 命中 = 0；`PROMPT-SYSTEM.md` 内 `引擎已更新` 命中 = 0 | 条目 3 ∥ 4 |
| A7 | 实施完成后 `doc_check(mode:"gate", docs=[本批改动 .md 集])` 首行 = `DOC-CHECK GATE: PASS` | 全表 |
| A8 | `docs/batches/**` 内既有批档零改（本批档除外） | 「不做」条 |

### 关键决策

① **删，不以变形加回**——用户 2026-10-24 23:29 逐字裁定；被拒备选「保留 report 注记行」同删（注记由检测驱动，留之即留检测）。
② **`version.mjs` 留件不删**——`firstVerdictLine` 仍被 `batch-gate.mjs:28` 消费（收口判定行解析单源），删档断 import；档头「为何删除」注记保留 = 该决策的 why 单源。
③ **ERROR 枚举收敛而非重写**——残余因（工作区 / manifest 不可读 / 门自身异常）语义逐字不动，只删「引擎已更新」一支。
④ **读数纪律句改写保留**——「交付读数只取新进程」是删后风险的兜底面，不是检测的变形（无机检、无拦截，仅取证纪律）。

### 上抛项

无待裁。条目 1（需求档 F8 行删）按笔域归主 agent 落笔，已列入条目表，非 bounce。

### 更正（用户 2026-10-24 23:37 裁定 · 覆盖上节两处）

用户逐字：「操你妈！没问题因为这点事儿报错到用户那里的风险谁兜？」——裁定三点：

1. **「旧引擎假读数的风险由谁兜」这一问题作废**——该风险不存在，设计不留任何代偿位置。上节「删后风险由谁兜（设计必答句）」整段连同「读数纪律兜」的提法一并作废；`DOC-DISCIPLINE.md` 原「读数纪律」行（§3.20 `:1084`）整行删，不改写保留。
2. **删 = 删干净**：`version.mjs` 处置由「留件」改为**整档删除**——其唯一导出 `firstVerdictLine` 的唯一消费面 = `agent-tools/batch-gate.mjs:28`（grep `firstVerdictLine` ∥ `doc-check/version` 于 `thincoder-core/` 全仓仅此一处），该函数（2 行）迁入 `batch-gate.mjs` 本体，import 行同删。report 注记行、降级提示、任何形式的替代检测——零残留。
3. **理由只写一条**：mtime 触碰 ≠ 内容变化（今晚 `anchors.mjs` 内容已回退、mtime 留痕，全会话 gate 即废）；检测的代价（任何引擎件改动废掉所有在飞批的 gate）远超它防的假读数。

**自检句**（用户给定判据）：写完设计后全仓规范面问「还有没有一处『陈旧 ⇒ 注记 / 降级 / ERROR』的影子」——有 ⇒ 删。本批验收 A2–A4 的六串 grep 即该判据的机器形，另加 `version.mjs` 不在盘、`batch-gate.mjs` 内 `doc-check/version` import 命中 = 0 两条。

受影响文件表更正：第 7 行 `version.mjs` 由「0（留件）」改为「**整档删除**」；新增第 8 行 `agent-tools/batch-gate.mjs`（现 191 行，+4 −2：迁入 `firstVerdictLine`、删 import——eng-coder 落）。验收对照补：**A9** `version.mjs` 不在盘 ∧ `batch-gate.mjs` ∥ `agent-tools/doc-check.mjs` 内 `version` 串命中 = 0 ∧ 两档 `node --check` 过。关键决策 ② 作废（被本裁定覆盖）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：DOC-DISCIPLINE.md §3.20 检测引用族删净 · MANIFEST.md F8 零改句删 · PROMPT-SYSTEM.md 已知代价块删（触发：用户裁定取消引擎过时检测，代码已于 17:46 删除，本批清文档面）。评审方式 = 三档全读 + 族词复扫（`引擎` ∥ `版本判定` ∥ `陈旧引擎` ∥ `clock` ∥ `新进程` ∥ `已知代价` ∥ `F8` ∥ `零改` ∥ `doc_check`）。

**事实核验（盘上实读）**：

- DOC-DISCIPLINE.md §3.20 的检测引用族 = 两处，均在盘：`DOC-DISCIPLINE.md:1054`「读数环境须为新进程——陈旧引擎在报告面首行加注记」∥ `DOC-DISCIPLINE.md:1131`「`clock` 注入缝随版本判定族同删——实施轮落」。目标识别正确（两处确为已取消机制的引用）。
- PROMPT-SYSTEM.md 已知代价块 = `PROMPT-SYSTEM.md:930`「本会话内不收口——已知代价 = 改引擎件 ⇒ 交付门 ERROR（见 §6.31.4）」，在盘，其前提（改引擎件 ⇒ 交付门 ERROR）即被取消的检测。目标识别正确。
- MANIFEST.md 的「F8 零改句」在盘上**不可定位**（全档族词扫描零命中；`F8` 仅现于 `MANIFEST.md:26` 功能点行与 `MANIFEST.md:962` 回指行，均无检测指称）。
- 同档遗漏面：`PROMPT-SYSTEM.md:3100`「现为四档：`anchors.mjs` · `index.mjs` · `version.mjs` · `width.mjs`」——`version.mjs` 已随删除消失，该「现为四档」即成失效现状陈述。

**Findings**：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | 「MANIFEST.md F8 零改句」这一删除目标在盘上不可定位——全档按族词复扫零命中；实施时该目标无对象可删（或先行轮已删、目标清单失真） | 给出该句现文坐标与原文；若已不存在，把该项从目标清单撤下 |
| 2 | Requirements（覆盖） | 🟡 | 删除清单漏掉同档失效库存句：`PROMPT-SYSTEM.md:3100` 的「现为四档 … `version.mjs` …」在 `version.mjs` 删除后即成失效陈述（D8 面），不在「已知代价块删」的点名内 | 把 `PROMPT-SYSTEM.md:3100` 的 `version.mjs` 指称纳入本批删除面（改述为三档或删该枚举） |
| 3 | Scope（协调项） | 🟡 | 检测的需求面与模型可见面不在本批三档射程内：`docs/core/requirements/DOC-CHECK.md`（`DOC-DISCIPLINE.md:993` 以其 F1–F8 为交付门需求源）与 `thincoder-core/tool-docs/doc_check.md`（`PROMPT-SYSTEM.md:870` 示其含引擎件清单）若仍载该检测的要求 / 契约，文档↔实装漂移依旧 | 需求档（主 agent 笔）与工具描述档（eng-coder 笔）的同族清面在收口时登记处置（同批 ∥ 另批各记一句） |
| 4 | Clarity | 🔵 | `DOC-DISCIPLINE.md:1054` 为复合句——「读数环境须为新进程」可独立成立，失效的只是「陈旧引擎在报告面首行加注记」半句；`:1131` 只需删括注、留 `runBatchGate` 签名本体 | 实施按片段删（失效片段删、保留句义自足部分），勿整行删 |
| 5 | Acceptance | 🔵 | 三处删除可机判收口：删后以族词（陈旧引擎 ∥ 版本判定 ∥ clock ∥ 已知代价 = 改引擎件 ∥ version.mjs）复扫三档零命中即证净；现点名面未见该复扫判据 | 补一行复扫判据（族词零命中 + 三档 `git diff` 只含目标 hunk） |

**限制声明**：评审上下文无项目标准档、无文档地图（评审环境明示两者缺失）——方法学符合性与文档归属按 Project Guide 与评审标准判，已降格。

VERDICT: pass（🔴 0 · 🟡 3 · 🔵 2）

## §4 用户批准（主 agent）

**批准**：用户 2026-10-25 03:14「自动跑完」——批次级放行（批准 + 批内全链自动跑完）。
**批准前置**：设计评审首轮 pass（0 🔴 · 3 🟡 · 2 🔵）；代码已删（17:46 提交 `a0cb6e24`）；本批清文档面。

## §5 实施记录（eng-coder）

**实施完成 2026-10-25（eng-coder）**——检测代码上午已删（`a0cb6e24`），本轮清文档面与残留，删后形态 = 「删，不替代」。

### 逐面处置（对照 §2 条目 5–8）

| # | 面 | 改动 | 读数 |
|---|---|---|---|
| 5 | `thincoder-core/tool-docs/doc_check.md` | report 注记段（原 `:3-6`）整段删；gate 版本校验句（原 `:46-50`）删，ERROR 尾句收敛为「a multi-project workspace ⇒ name the project root」单因（残余因语义逐字不动） | 全文 58 行；`stale` ∥ `引擎已更新` ∥ `newer than this session's start` 零命中 |
| 6 | `thincoder-core/agent-tools/doc-check.mjs` | 档头版本前置自述两行删（原 `:13-14`）；版本函数单源注两行删（原 `:23-24`）；report 注记分句删（原 `:68`，保留「清单是唯一范围来源」自足句） | 74 → 69 行；`node --check` 过；`version` 串零命中 |
| 7 | `thincoder-core/doc-check/version.mjs` | 整档删 | 不在盘（`doc-check/` 现仅 `anchors.mjs` / `index.mjs` / `width.mjs`） |
| 8 | `thincoder-core/agent-tools/batch-gate.mjs` | 死 import 删（原 `:28`）；`clock` 注入缝三处删（jsdoc `:97-98` ∥ 签名 `:103` ∥ 传参 `:109`/`:117`）；档头「引擎版本前置同源 = `doc-check/version.mjs`」句删；「三因」改「两因」（未知 scope ∥ manifest 不可读） | 191 → 189 行；`node --check` 过；`version` ∥ `clock` ∥ `firstVerdictLine` 零命中 |

### 偏差披露（父侧裁定甲覆盖 §2 更正第 2 条一处）

§2 `:109` / `:114` 原方案 = `firstVerdictLine`「迁入 `batch-gate.mjs` 本体」。实读 + git 溯源：其最后调用点已由 `e2902dcf` 删除，`batch-gate.mjs:28` 为死 import——迁入 = 造 2 行死码。上抛后父侧裁定**甲：不迁入**（死码即残留），import 整行删 + `version.mjs` 整档删。随动的设计档失真归设计席随正：`DOC-DISCIPLINE.md:1257`「`firstVerdictLine` 住本档」∥ `API-CONTRACT.md:1181` 表行（指针目标已不在盘）。另：§2 A5（`:88`「version.mjs 在盘」）被更正面 A9（`:114`「不在盘」）覆盖，收口按 A9 判。

### 审计 / 评审轮次与终态

- explore 分歧审计 1 轮：**VERDICT clean**——验收条逐条 ✅，四类偏差零发现，声明清单（4 档）外改动零。
- advisor 代码评审 1 轮：**VERDICT pass**（🔴 0 · 🟡 2 · 🔵 2）。🟡 = `.thincoder/tmp/` 划痕区残留脚本 5 件（`2026-10-18-mech-visibility-gaps-den.test.mjs:9` 仍 import 已删模块，余 4 件为一次性脚本——归父侧定夺）∥ §5/§6 待填协调项；🔵 = tmp 内 0.10.9 实体化快照含旧检测面（历史快照）∥ `node --check` 评审侧未独立复验（实施面已跑过，见下）。
- 修正轮 0；终态 = **clean**。

### 验证读数（本批改动面 · 新进程 / 会话实测）

- **grep 兜底**（`thincoder-core/**`）：`staleEngineFiles｜ENGINE_FILES｜引擎已更新` ∥ `version.mjs｜firstVerdictLine` ∥ `引擎陈旧｜reportEngineNote｜withEngineNote｜gateEngineError｜newer than this session` 三组各**零命中**（工具描述与注释面同清）——用户 23:37 自检句的机器形全绿。
- **语法**：`node --check` 于 `batch-gate.mjs` ∥ `doc-check.mjs` 双过。
- **夹具实跑**（新进程，对照 §2 用例表 E1–E4）：E1 = 引擎档 mtime 拨至晚于进程启动 ⇒ gate 仍 `DOC-CHECK GATE: PASS`、`引擎已更新` 零出现（检测码已删，结构性不可能再出）；E3 = 工作区 target ⇒ `DOC-CHECK GATE: ERROR（多项目工作区：请指名 target）` 逐字保留；E4 = report 首行 `文档纪律机检（报告态 · 非门禁）`、零注记行；`runBatchGate` 新签名 writer 面 PASS ∥ 未知 scope ERROR 逐字。
- **A7**：`doc_check(mode:"gate", docs=[tool-docs/doc_check.md], target=本仓)` ⇒ 首行 `DOC-CHECK GATE: PASS`（1 档 0 命中）。
- **单元测试**：本批零新增（纯删除 + 注释面，无行为变化）。验收命令 `node --test thincoder-core/test/**` **结构性不满足**：核仓 `test/` 仅 `run.mjs`（需求 N20 设定核仓不设集成集，runner 恒 exit 1 防「空集读作绿」）+ `slow.mjs`——该红与本次改动无关（`a0cb6e24` 的 33/0 读数出自当批单测档，已随批用毕即删于 `e18a2d8d`）。
- **集成测试**：not integration-test verified —— 父侧收口跑是唯一集成测试跑；核仓集成集 = 0（需求 N20 明定不设，非欠账）。
- **清单外改动**：零（`git status` 中 `docs/core/**` 与 `scripts/prompt-refs-check.mjs` 的改动为 #104 / 主 agent 笔域，非本席）。

## §6 验证与收口（父代理）

## 验证与收口

**代码本体**：上午 17:46 提交 `a0cb6e24` 已删（用户裁定「对它没信心」）；本批 = 文档面清残（`#114`）。

**父侧复核**：

| 项 | 读数 |
|---|---|
| `version.mjs` | 不在盘（`doc-check/` 现仅 `anchors.mjs` ∥ `index.mjs` ∥ `width.mjs`） |
| `staleEngineFiles` ∥ `ENGINE_FILES` ∥ `firstVerdictLine` ∥ `引擎已更新` ∥ `withEngineNote` ∥ `gateEngineError` | **全 0 命中** |
| 夹具（mtime 拨晚于进程启动） | gate 仍 `PASS`、`引擎已更新` 零出现——残影机制实证消失 |
| 工作区 target | `ERROR（多项目工作区：请指名 target）` 逐字保留 |
| 需求档 F8 | 已删（父侧笔） |
| `firstVerdictLine` | 不迁入（死 import——最后调用点 `e2902dcf` 已删；裁定甲覆盖 §2 迁入方案） |

**遗留（登记）**：
- 设计席随正三处：`DOC-DISCIPLINE.md:1257` · `API-CONTRACT.md:1181`（`firstVerdictLine` 指称）· `PROMPT-SYSTEM.md:3100`（「现为四档」枚举）。
- 批档 §2 内部矛盾（`:88` 与 `:114`）——按 `:114` 判（不回改历史）。
- `.thincoder/tmp` 划痕区（评审 🟡/🔵 已登记）。

**测试行**：① 本批无批内单测档（`a0cb6e24` 的单测档已用毕即删）· ② 集成集现量 15 例 / 窗口 50–100，本批增删 0（删的是机检面内部件，无业务行为变更）。核仓集成集 = 0（需求 N20）。

**文档机检门**：本会话内恒 `ERROR（引擎已更新）`——父进程 09:42 启动，内存仍是旧引擎（被删机制自身的残影）；新进程夹具与显式 gate 均已 PASS。真读数待会话重启。
