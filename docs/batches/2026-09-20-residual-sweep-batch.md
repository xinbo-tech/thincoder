# 2026-09-20 · 库存清账批（RESIDUAL-SWEEP-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 11:5x · 来源 = 用户 11:51「**库存那些也点火把**」+ 台账 #120/#128/#129/#131 一族。
> 本档 = **文档面库存清账**（不触产品码；行为面与核面另批）。

## §1 讨论（主 agent）

**状态行**：已收口 2026-09-20（§6）

### 1.1 条目清单（4 条台账 · 全为文档面）

| # | 台账 | 条目 | 要点 |
|---|---|---|---|
| 1 | **#128** | **v1 测试门词面残留「域外面」（84 处命中）** | 需逐行判「**死处方**（违规，须收正）vs **历史对照**（合法，照留）」；已点名设计面 8 处（`AGENT-LOOP-SUBAGENT.md:500` A6 判据死命令 · `DOC-DISCIPLINE.md:910`/`:997` · `CORE-UNIFICATION.md:619-620`/`:913`/`:1728` · `ADVISOR-CONVERGENCE.md:294` · `VSC-DEBT.md` 多处）+ **需求面**多处（`core/requirements/TESTING.md` · `vsc/requirements/PROJECT.md:74` · `vsc/requirements/WEBVIEW.md:99` 死命令 · `core/requirements/RELEASE.md:46`——**需求面 = 父侧笔**）。判据 = 2026-09-20 02:07 治理口径第 ② 类（指向已消失对象）✓。 |
| 2 | **#129** | **VSC 文档面陈旧登记三则** | G-2 `WEBVIEW.md:261`/`:378`「（拟新增）」未撤（`activity-diag.js` **已落地 83 行**；姊妹档已去标记 ⇒ 两档不同步）· G-3 `WEBVIEW-PROTOCOL.md` §6.2 对位表**缺 queued 状态词行** · G-4 §6.3 表自称「N 键」但**非 locales 全量**（`locales/en.json:148-162` 实 15 个 `sub.*`，表仅收 5）。判据 = 治理口径第 ②/③ 类 ✓。 |
| 3 | **#131** | **两产品 `AGENTS.md` 残余族（6 则）** | CLI `:59` CRASH-REPORTS **§8 死节号**（该档仅 §1–§6，堆遥测实为 §4）· CLI `:10` 层根两态残留 · CLI `:31` `docs/design/RELEASE.md` **死指针 ×2**（真身 `docs/cli/design/RELEASE.md`）· VSC `:7` `docs/design/`（**G-1 同族**）· VSC `:22` 不可解析节号 · VSC `:122` 陈旧基线（553/518/35 skip，早于 `TESTING.md:291` 的 593/592）。 |
| 4 | **#120 尾项** | **`CORE-UNIFICATION.md` 三坐标补判** | `:44`（B18 事实基线行）· `:710`（§2.6.3 主表 U2 行）· `:1041`（§2.8「提示词副本删除」行 `（25×2）`）——三条 = as-of 迁移期读数/计划面 ⇒ **入 B 类保留面枚举**（`DOC-DISCIPLINE.md:511` J-3 补正块的闭集）+ 补一条子集判（全档 `25` 命中集 ⊆ 保留面枚举）。`:225` 已由父侧补判为 24 ✓。 |

### 1.2 边界

- **不触**：产品码（行为面见下）· 需求档中**仅** `#128` 点名的需求面坐标（**父侧笔**）· 冻结批档 · 归档档（E9 判不动在册）。
- **判据统一**：2026-09-20 02:07 治理口径（只追**错档 / 死对象 / 计数不符**三类真缺陷；行号漂移按 D4 结；两分判据照用；判保留须给理由）✓。

### 1.3 验收

① 逐条「台账 id → 改动 file:line」；② `doc-check` **净增 0**；③ 判「保留」者逐条给理由（照 D8 两分判据）；④ `#128` 的 84 处命中须**逐行走一遍**（不得只改点名 8 处）。

### 1.4 台账

#128 / #129 / #131 → 本批（待设计）· #120 尾项 → 并入本批（主体已于 P3 收口）。

## §2 批次任务与设计（eng-designer）

**批次任务与设计（eng-designer · 2026-09-20 · 轮次 = initial）**

**状态行**：✅ 4 条逐条设计已出（2.1–2.4）· **设计档面 = 本轮已落**（8 档：v1 词面收正 26 处 + T-4 行删 + #129 三则 + J-3 块补判 + 逐档变更记录）· 产品文本面（#131 六则）= 设计已出（待 eng-coder 轮）· 需求面 = **零触碰**（父侧笔 · 逐行清单见 2.1-d）。

**书源**：本档 §1（4 条清单 + 边界 + 验收初稿）；仓根 = `D:\teamcode\thincoder`；判据 = 2026-09-20 02:07 治理口径（只追**错档 / 死对象 / 计数不符**三类真缺陷 · 行号漂移按 D4 结 · **D8 两分判据**——出处注照留 / 退役挂尸删；判保留逐条给理由）✓。

**落盘口径**（承一致性同步批「批 3」/ 结构收口批「本席已落」先例）：设计档面 = 本席本轮已落；需求档 / 提示词 / 冻结批档 / 归档档 / `scripts/**` / 产品码 = 零触碰。

### 2.1 条目 1 · #128 v1 测试门词面残留（全 docs 域 · 逐行生死判）

**a) 扫描口径与读数（as-of 2026-09-20 12:1x 本席复跑）**

- 域 = `docs/**`（排除 `batches/` 与 `_archive/`）；族正则 = `test:full|test:integration|slow-gate|run-fast|run-full|run-integration|快层|快\s*\/\s*[全慢]|slow\s*门`。
- **本刻读数 = 92 处 / 26 档**（台账 as-of 04:3x 记 **84** 处——**该刻清单未入档、逐档对账不可复核 ⇒ 本表改述**：本批以**现盘 92 处**为准、全部逐行判完；分解 = 收正 26 + 判保留 29 + 需求面登记 37 · 档数 = 7 + 6 + 13 = 26）。
- **两分判据落地（D8）**：**死处方** = 指向**已消失对象**（`test:full` / `test:integration` 命令 · `run-fast` / `run-full` / `run-integration` / `slow-gate` 四脚本档 · 「快层」机制）⇒ 收正。
  （盘上实核：三包 `package.json` scripts 仅 `test`（+`lint` / `doc:check` / `release:check`）· 四脚本档全不在盘。）
- **历史对照** = 记录面（变更记录 / 沿革 / 归档 / 迁移期引文标注行）· 对照·否定式表述（「不再 …」「砍掉 …」「v1 曾 = …」）⇒ 照留 + 理由。

**b) 死处方 → 收正（设计面 26 处 / 7 档 · 全部已落）**

| 档 | 行 | 判 | 落笔 |
|---|---|---|---|
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | `:502`（A6 判据） | 死处方 | `lint` / `test:full` / `test:integration` → **`lint` / 各包 `npm test`（单入口）全绿** |
| `docs/core/design/ADVISOR-CONVERGENCE.md` | `:294` | 死处方 | 「测试基建分层执行（快层 / 全量链终父侧——含慢测层）」→ **单入口执行 + 权威指针 `docs/core/design/TESTING.md` §10** |
| `docs/core/design/CORE-UNIFICATION.md` | `:619` `:620` `:913` `:1729` | 死处方（4） | 复跑 / 验收命令收正（`lint` → `npm test`）；`:620` 顺带收正 `doc:check` 括注（原锚 `doc-anchors.mjs` **档不在盘** → `scripts/doc-check.mjs`——同族死对象） |
| `docs/core/design/DOC-DISCIPLINE.md` | `:52` `:758` `:910` `:913` `:1000` `:1001` `:1002` | 死处方（7） | 「快层可跑 / 快层断言 / 快层直驱 / 快层面 / `npm run test:full` / 常驻快层」→ v2 单入口词面；沿革行（`:1001` → 现 `:1003`）初判保留 ⇒ **修正轮 #2 改判删除**（D8：历史归记录面——见本档变更记录 2026-09-20 修正轮条） |
| `docs/core/design/DOC-MIGRATION.md` | `:221`（A23 行） | 死处方 | 「补入快层 / 守卫快层可跑后销」→ **单入口词面**（处置列 + 触发列两处） |
| `docs/vsc/design/VSC-DEBT.md` | `:6` `:14` `:27` `:57` `:65` `:192` `:197` `:198` `:207` `:208` `:209` | 死处方（11） | 权威源行（死文件枚举 → `test/run.mjs` 单入口）· D-1 行 · 两线分立段（`slow-gate.mjs` / `THINCODER_SLOW_GATE_MS` 死对象删除）· §3.1 标题 · 归册后句 · A3 / A8 / A9 · T-2 / T-3；**T-4 行整行删**（`slow-gate` 拦截面随机制撤除——D8 对象消失） |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | `:343` | 死处方 | 「`npm test` 快层逐跑」→「`npm test` 逐跑」 |

**c) 历史对照 → 判保留（29 处 / 6 档 + `VSC-DEBT.md` 记录面 1 行 · 逐处理由 · D8 两分）**

| 档 | 行 | 理由 |
|---|---|---|
| `docs/core/design/TESTING.md` | `:259` `:266` `:267` `:277` | §10 内 **v1/v2 对照句**（显式标 v1 · 「砍掉 …」清单 · AC-M10-2 否定式判据）——指向历史事实，非可执行处方 |
| 同上 | `:384` `:387` | 变更记录行（记录面） |
| `docs/core/design/ENGINEERING-MODE-V2.md` | `:73` `:271` | v2 设计陈述（迁移表「修改 / 删除」列 + 「不再 …三层」否定式） |
| `docs/core/design/prompts/discipline-engineering.md` | `:65` | 同款否定式（提示词面 = **非本席写域**，判保留零触碰） |
| `docs/core/design/ARCHITECTURE.md` | `:189` | 变更记录行（记录面） |
| `docs/cli/design/RELEASE.md` | `:131` | 变更记录行（记录面） |
| `docs/TODO-archive.md` | 18 处 | 归档台账（记录面——归档档判不动，承 E9 口径） |

**d) 需求面清单（父侧笔 · 只登记 · 本席零触碰 · 37 处 / 13 档）**

`docs/core/requirements/TESTING.md` **18**（`:3` `:20` `:24` `:52` `:53` `:56` `:62` `:63` `:67` `:104` `:107` `:114` `:115` `:116` `:157` `:170` `:175` `:181`）· `CORE-UNIFICATION.md` 1（`:114`——N1 判据句全链）· `ENGINEERING-MODE-V2-SPEC-TEST-DISCIPLINE.md` 4（`:7` `:12` `:13` `:29`）· `ENGINEERING-MODE-V2.md` 3（`:453` `:455` `:598`）· `DESIGN-TOKEN-SETTLEMENT.md` 1（`:35`）· `ESCALATE.md` 1（`:33`）· `PORTABILITY.md` 1（`:42`）· `ADVISOR-CONVERGENCE.md` 1（`:78`）· `TOOLS.md` 1（`:143`）· `RELEASE.md` 1（`:46`——V-F1 修订式表述）· `docs/cli/requirements/TUI.md` 3（`:50` `:51` `:52`）· `docs/vsc/requirements/PROJECT.md` 1（`:74`）· `docs/vsc/requirements/WEBVIEW.md` 1（`:99`——**死命令** `node test/run-fast.mjs`）。

**分类登记（承评审 #4 拆类——两类不得混记）**：**① 死对象类**（死命令 / 已消失脚本 / 快层词面 ⇒ 治理口径「指向已消失对象」类）——主点 = `docs/vsc/requirements/WEBVIEW.md:99`（AC 格死命令 `node test/run-fast.mjs`——`thincoder-vscode/test/run-fast.mjs` 不在盘）；同族命中行以本表 13 档坐标为清单（逐行生死判 = 需求层触碰轮的活）。**② doc-hygiene 类**（D8 修订式表述 ⇒ 必删）——`docs/core/requirements/RELEASE.md:46`（V-F1 行「原『四环』…实况已收敛」）。其余命中行（归档引文 / 否定式 / as-of 对照）⇒ 照留。

**消解路径** = 主 agent 在需求层下次触碰轮按 ①② 逐行处置（① ⇒ 单入口词面收正——`npm test` + 权威指针 `docs/core/design/TESTING.md` §10；② ⇒ 删 / 改述）。**到期条件** = 需求层下一次板块级 sweep，或本表 13 档任一档下次实质修订时（承 `docs/core/design/DOC-DISCIPLINE.md` §3.8 残差登记口径——不得作常驻态）。

**e) 计数闭合**：92 = 26 收正处 + 29 判保留 + 37 需求面登记 ✓（档数 = 7 + 6 + 13 = **26 档**）；**改后残留** = 29 + 37 + **本批新落记录行 1**（`VSC-DEBT.md:590` 变更记录行）= **67**（与 §2.7 D2 期望集同口径）。逐行走完一遍；点名处按盘上实读登记——`:500` 现 `:502`（+2 漂移）· `:997` 现 `:1000`（+3）等。

### 2.2 条目 2 · #129 VSC 文档面陈旧登记三则（已落）

| # | 判据（§1） | 处置（本轮已落） |
|---|---|---|
| **G-2** | 「（拟新增）」标记陈旧（`activity-diag.js` / `activity-new.js` 均已落地） | `docs/vsc/design/WEBVIEW.md` **四处撤标**（现盘 `:207` `:299` `:386` `:416`——台账记 `:261` / `:378` 为 as-of，按盘上实读登记）；**变更记录面两处判保留**（`:573` `:583`——记录面，批次计划期表述） |
| **G-3** | §6.2 对位表缺 queued 状态词行 | `WEBVIEW-PROTOCOL.md` §6.2 **补「状态词·queued」行**：CLI ` · queued` / ` · waiting`（标尺 = `thincoder-cli/src/tui/subagent-panel.mjs:73` 判定 · `:75` 落地）∥ 本端 ` · ${t("sub.queued")}` / ` · ${t("sub.waiting")}`（en 逐字 / zh `排队中` / `等待中`）；选用判据 = 载荷 `kind`；契约回指 `WEBVIEW.md` §5.2 |
| **G-4** | §6.3 表「N 键」非 locales 全量 | §6.3 头注补**收录口径**：表 = **对位冻结面**（与 CLI 逐字对位 / 端差登记所需键）——**非 locales 全量**（全量实体 = `locales/{en,zh}.json` + 核容器 `thincoder-core/i18n.mjs`）+ **新增对位键须同轮登记本表**（D3——防「新键落表滞后」型缺口）；表头计数 18 = 表内行数 18 ✓（**本席复核 as-of 2026-09-20 12:3x**：`locales/{en,zh}.json` `sub.*` = 16 键〔现盘 `:150-165` · 两档同键面〕· §6.3 表内 `sub.*` = 4——口径句明示非全量后不再构成「表∥实体」计数缺陷；§1.1 G-4 行记「15 / 5」（`:148-162`）= 父侧 as-of 读数 ⇒ 两读数差 + 坐标偏移在报告面登记、§1 非本席写域） |

### 2.3 条目 3 · #131 两产品 `AGENTS.md` 残余族（六则 · 产品文本面 · 设计已出 · 未落）

**面判定**：产品文本面（出海产物 / 用户可见契约）⇒ **eng-coder 轮**（token 门），非父侧直改面。

| # | 落点 | 改法（逐字） | 判据 |
|---|---|---|---|
| C1 | `thincoder-cli/AGENTS.md:59` | `CRASH-REPORTS.md` §8 → **§4** | 实核该档仅 §1–§6；堆遥测 = §4「堆遥测 / 看门狗（事前预警）」 |
| C2 | 同档 `:10` | ① 层根两态收正：`docs/requirements/` → `docs/core/requirements/`；`docs/design/` → `docs/core/design/`（与同档 `:12` 同态）；② **括注收正**（承用户 2026-09-20 12:25 收正授权）：「（均 **eng-designer 产物**——写稿权唯一；需求讨论/登记在会话面）」→「（需求档 = **主 agent 产物**；设计档 = **eng-designer 产物**——写稿权唯一；需求讨论/登记在会话面）」 | 盘上两目录在；写法同 `docs/README.md` 基准层口径；括注同态 = 本批已收正的 `docs/core/design/DOC-DISCIPLINE.md:16` D1 行 |
| C3 | 同档 `:31` | `docs/design/RELEASE.md` ×2 → `../docs/cli/design/RELEASE.md`；节号 `§5.2` → **§6.2** · `§4.6` → **§3.2** | 实核 `docs/cli/design/RELEASE.md` §6.2 = GitHub 双远端 + 被墙走代理 · §3.2 = CalVer |
| C4 | `thincoder-vscode/AGENTS.md:7` | `docs/design/` → `docs/_archive/design/` | 实核 `thincoder-vscode/docs/_archive/design/` 在盘（G-1 同族） |
| C5 | 同档 `:22` | 该行整句逐字形态（反引号成对）：`**End separation (`../docs/core/design/SESSION.md` §6.10, 2026-09-05)**:`——即 `(§10, 2026-09-05)` 段 → `(`../docs/core/design/SESSION.md` §6.10, 2026-09-05)` | 实核 §6.10 = 「端分离恢复：本端 end marker」；现文 = `**End separation (§10, 2026-09-05)**:`（`:22`）；E5 同轮补反判（旧形态零命中） |
| C6 | 同档 `:122` | 陈旧基线（553 / 518 / 35 skip · as-of 09-15）→ **改指权威**（读数不重述；指针 = `../docs/core/design/TESTING.md` §10）；若欲留数字 ⇒ 实现轮实跑一次取读数 + 标 as-of | 权威面 as-of 09-18 = 593 / 592（`TESTING.md:291`）；数值读数必随后续批次漂移 ⇒ 指针形态稳 |

### 2.4 条目 4 · #120 尾项（J-3 闭集补判 + 子集判 · 已落）

**落点** = `docs/core/design/DOC-DISCIPLINE.md` §3.9 J-3 补正块（现盘 `:511`–`:514`）：

1. **保留面闭集补登三坐标**：`:44`（B18 事实基线行）· `:710`（§2.6.3 主表 U2 行）· `:1041`（§2.8「提示词副本删除」行 `（25×2）`）——三条 = as-of 迁移期读数 / 计划面（B 类）；**记录面补 `:1902`**（变更记录行——本席子集判扫出的第 7 命中原缺登）。
2. **新增子集判**：全档「tool-docs 计数 25」命中集 ⊆ 保留面枚举。
3. **未并面 errata**：需求侧 `docs/core/requirements/CORE-UNIFICATION.md` `:117` / `:118` 已 = **24** ✓；产品文本面 `thincoder-vscode/AGENTS.md:15` / `:127` 已 = **24** ✓；`thincoder-cli/AGENTS.md` 全档无计量句 ✓（无漏改）。
4. **判据细化（本席定义 · 可机检）**：命中族 = `25` 非数字前缀 ∧ 后接 `[空格、）、档×*]` 之一（排除 `Electron 25.9.7` / `+25±10` / `125 档` / 行号 `:25` 型假阳）；现盘命中集 = **{31,40,44,697,710,1041,1902}** ⊆ 枚举 ✓（命令 = 2.7-D3）。

### 2.5 受影响文件表 + 实施分批

| 档 | 面 | 执行方 | 状态 | 触碰 |
|---|---|---|---|---|
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 设计档 | eng-designer | **已落** | 1 行 + 变更记录 1 条 |
| `docs/core/design/ADVISOR-CONVERGENCE.md` | 设计档 | eng-designer | **已落** | 1 行 + 1 条 |
| `docs/core/design/CORE-UNIFICATION.md` | 设计档 | eng-designer | **已落**（修正轮再改 2 行——#5） | 6 行 + 1 条 |
| `docs/core/design/DOC-DISCIPLINE.md` | 设计档 | eng-designer | **已落**（修正轮再改 1 行 / 删 1 行——#1 / #2） | 10 行改 + 1 行删 + J-3 块补判 + 2 条 |
| `docs/core/design/DOC-MIGRATION.md` | 设计档 | eng-designer | **已落** | 1 行 + 1 条 |
| `docs/vsc/design/VSC-DEBT.md` | 设计档 | eng-designer | **已落** | 10 行改 + 1 行删 + 1 条 |
| `docs/vsc/design/WEBVIEW.md` | 设计档 | eng-designer | **已落** | 4 行 + 1 条 |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 设计档 | eng-designer | **已落**（修正轮再改 1 行——#10） | 4 行 + 新行 2 + 2 条 |
| `thincoder-cli/AGENTS.md` · `thincoder-vscode/AGENTS.md` | 产品文本 | **eng-coder 轮（已落 · 批 2）** | **已落** | 六则（2.3）· 读数 = §5 ②/③/④ |
| `docs/core/requirements/**` 13 档（37 处） | 需求档 | **主 agent** | **部分已落**（收正 24 + 判保留 5；余项在册） | 登记清单（2.1-d）· 批 3 进度 = §6 角色表 / 遗留① |

**分批（文件面并行度）**：**批 1** = 设计档面 8 档（**本轮已落**——单轮串行防互扰）；**批 2** = 产品文本面 2 档（eng-coder · 单轮可并行、同轮交付）；**批 3** = 需求面（父侧笔 · 可并入任意后续轮）。三批**文件面互斥**（无交叉档）⇒ 可并行推进；**同档禁并行双改**。

**写域冲突登记（如实）**：`docs/vsc/design/VSC-DEBT.md` / `WEBVIEW.md` / `WEBVIEW-PROTOCOL.md` 与 P1 收口轮 / P2 车道 3 同域——本批落笔时点晚于其落笔轮（三档 changelog 在册可回溯）；如后续轮再触碰，按盘上合流。

### 2.6 三向同源

批档 §2 条目 4 条 = 设计档验收回指 = 台账条目：**#128**（→ 2.1 · 命令 D1–D3）· **#129**（→ 2.2）· **#131**（→ 2.3 · 命令 E1–E6）· **#120 尾项**（→ 2.4 · 命令 D3）。本批**不新增需求条目**（全为存量债收正）；需求侧 = 台账四处，需求档**零内容改动**（仅登记清单）。

**UI / 交互决策**：无（全文档面）。

### 2.7 验收命令清单（cmd.exe · 全 ASCII · 判据非中文 `findstr`）

**D1 · #128 收正档切点前零残留**（7 档 · 逐档以「变更记录」为切点）

```
cd D:\teamcode\thincoder && node -e "const fs=require('fs');const re=/test:full|test:integration|slow-gate|run-fast|run-full|run-integration|\u5feb\u5c42|\u5feb\s*\/\s*[\u5168\u6162]|slow\s*\u95e8/;const cut=/^##\s.*\u53d8\u66f4\u8bb0\u5f55/;const files=['docs/vsc/design/VSC-DEBT.md','docs/vsc/design/WEBVIEW-PROTOCOL.md','docs/core/design/AGENT-LOOP-SUBAGENT.md','docs/core/design/ADVISOR-CONVERGENCE.md','docs/core/design/CORE-UNIFICATION.md','docs/core/design/DOC-DISCIPLINE.md','docs/core/design/DOC-MIGRATION.md'];let bad=0;for(const f of files){const t=fs.readFileSync(f,'utf8').split('\n');const c=t.findIndex(l=>cut.test(l));const n=c<0?t.length:c;const h=[];t.forEach((l,i)=>{if(i<n&&re.test(l))h.push(i+1)});if(h.length){bad++;console.log('FAIL '+f+' '+JSON.stringify(h))}}console.log(bad?('FAIL '+bad):'OK 0 pre-cut residue in 7 docs');process.exit(bad?1:0)"
```

**读数（本刻实跑）**：`OK 0 pre-cut residue in 7 docs` · exit 0（7/7 档切点前零命中）。

**D2 · #128 保留档命中集 = 登记集 + VSC-DEBT 记录面恰 1**

```
cd D:\teamcode\thincoder && node -e "const fs=require('fs');const re=/test:full|test:integration|slow-gate|run-fast|run-full|run-integration|\u5feb\u5c42|\u5feb\s*\/\s*[\u5168\u6162]|slow\s*\u95e8/;const exp={'docs/TODO-archive.md':18,'docs/core/design/TESTING.md':6,'docs/core/design/ENGINEERING-MODE-V2.md':2,'docs/core/design/prompts/discipline-engineering.md':1,'docs/core/design/ARCHITECTURE.md':1,'docs/cli/design/RELEASE.md':1};let bad=0;for(const k of Object.keys(exp)){const n=fs.readFileSync(k,'utf8').split('\n').filter(l=>re.test(l)).length;if(n!==exp[k]){bad++;console.log('FAIL '+k+' exp '+exp[k]+' got '+n)}}const t=fs.readFileSync('docs/vsc/design/VSC-DEBT.md','utf8').split('\n');const c=t.findIndex(l=>/^##\s.*\u53d8\u66f4\u8bb0\u5f55/.test(l));const h=[];t.forEach((l,i)=>{if(re.test(l))h.push(i+1)});if(!(h.length===1&&h[0]>c)){bad++;console.log('FAIL VSC-DEBT '+JSON.stringify(h))}console.log(bad?('FAIL '+bad):'OK keep-set + changelog-face counts match');process.exit(bad?1:0)"
```

**读数（本刻实跑）**：`OK keep-set + changelog-face counts match` · exit 0（VSC-DEBT 唯一残留 = `:590` 变更记录行——记录面白名单）。

**D3 · #120 子集判**（全档 tool-docs 计数 25 命中集 ⊆ 保留面枚举）

```
cd D:\teamcode\thincoder && node -e "const fs=require('fs');const t=fs.readFileSync('docs/core/design/CORE-UNIFICATION.md','utf8').split('\n');const re=/(?<!\d)25(?=[\s\u3001\uff09)\u6863\u00d7*])/;const allow=[31,40,44,697,710,1041,1902];const hits=[];t.forEach((l,i)=>{if(re.test(l))hits.push(i+1)});const extra=hits.filter(n=>!allow.includes(n));console.log(extra.length?('FAIL extra '+JSON.stringify(extra)):('OK subset judge '+JSON.stringify(hits)));process.exit(extra.length?1:0)"
```

**读数（本刻实跑）**：`OK subset judge [31,40,44,697,710,1041,1902]` · exit 0。

**E1–E6 · #131 六则**（**已落**（批 2）；读数 = §5 ②/③/④；逐条单行命令 · **正判 + 反判成对**——承评审 #9 防半改；E2 含 C2 括注面、E4 原已成对）

- E1：`node -e "const t=require('fs').readFileSync('thincoder-cli/AGENTS.md','utf8');const pos=t.includes('CRASH-REPORTS.md` \u00a74');const neg=!t.includes('\u00a78');console.log(pos&&neg?'OK C1':'FAIL C1 pos='+pos+' neg='+neg);process.exit(pos&&neg?0:1)"`
- E2：`node -e "const t=require('fs').readFileSync('thincoder-cli/AGENTS.md','utf8');const pos=t.includes('docs/core/requirements/')&&t.includes('docs/core/design/')&&t.includes('\u9700\u6c42\u6863 = **\u4e3b agent \u4ea7\u7269**');const neg=!t.includes('docs/requirements/')&&!t.includes('\u5747 **eng-designer \u4ea7\u7269**');console.log(pos&&neg?'OK C2':'FAIL C2 pos='+pos+' neg='+neg);process.exit(pos&&neg?0:1)"`
- E3：`node -e "const t=require('fs').readFileSync('thincoder-cli/AGENTS.md','utf8');const pos=t.split('../docs/cli/design/RELEASE.md').length-1===2&&t.includes('\u00a76.2')&&t.includes('\u00a73.2');const neg=!t.includes('docs/design/RELEASE.md')&&!t.includes('\u00a75.2')&&!t.includes('\u00a74.6');console.log(pos&&neg?'OK C3':'FAIL C3 pos='+pos+' neg='+neg);process.exit(pos&&neg?0:1)"`
- E4：`node -e "const t=require('fs').readFileSync('thincoder-vscode/AGENTS.md','utf8');const pos=t.includes('docs/_archive/design/');const neg=!t.includes('docs/design/');console.log(pos&&neg?'OK C4':'FAIL C4 pos='+pos+' neg='+neg);process.exit(pos&&neg?0:1)"`（`docs/_archive/design/` 不含子串 `docs/design/` ⇒ 两判不互扰）
- E5：`node -e "const t=require('fs').readFileSync('thincoder-vscode/AGENTS.md','utf8');const pos=t.includes('../docs/core/design/SESSION.md` \u00a76.10');const neg=!t.includes('\u00a710, 2026-09-05');console.log(pos&&neg?'OK C5':'FAIL C5 pos='+pos+' neg='+neg);process.exit(pos&&neg?0:1)"`
- E6：`node -e "const t=require('fs').readFileSync('thincoder-vscode/AGENTS.md','utf8');const pos=t.includes('../docs/core/design/TESTING.md` \u00a710');const neg=!t.includes('553')&&!t.includes('35 skip');console.log(pos&&neg?'OK C6':'FAIL C6 pos='+pos+' neg='+neg);process.exit(pos&&neg?0:1)"`

**F1 · 机检净增 0**

```
cd D:\teamcode\thincoder && node scripts/doc-check.mjs --root .
```

**读数（落笔后 · 原样）**：`汇总：候选 18224 · 悬空 0 · 注记豁免 43 · 拟新增 6 · 迁移期引文 211` + `OK(锚): 0 条悬空（闸态——阈值 0）`；行宽面 `FAIL(行宽): 2 行` = **并行会话在途档**（`docs/core/requirements/AGENT-LOOP.md:163` / `:168`——mtime `04:05Z` 早于本笔 `04:14Z`；`git status` 该档在途 + `MODEL-SPECS.md` 族未跟踪）⇒ **本笔写集净增 0**（无新悬空；无新增宽行）。

**修正轮复跑（2026-09-20 12:4x · 原样）**：`汇总：候选 18314 · 悬空 0 · 注记豁免 43 · 拟新增 6 · 迁移期引文 211` + `OK(锚): 0 条悬空（闸态——阈值 0）`；行宽面 `FAIL(行宽): 2 行` = 同两处并行会话在途档（`docs/core/requirements/AGENT-LOOP.md:163` / `:168`）⇒ **修正轮写集净增 0**（自产 1 处宽行已折行归零）· **D1 / D2 / D3 复跑**：`OK 0 pre-cut residue in 7 docs` · `OK keep-set + changelog-face counts match` · `OK subset judge [31,40,44,697,710,1041,1902]`（三命令与初轮同读数）。

### 2.8 边界（本批不做）

产品码 · 需求档内容（父侧笔 · 仅登记） · 提示词双面 · 冻结批档 · 归档档 · `scripts/**` · 行号漂移追改（承 D4） · 5b 家族外词面（「归册 / 慢层 / 拟新增」不扩扫——见 2.9） · 需求档 37 处收正。

### 2.9 不一致处 / 新发现（逐条 · 附证据 · 未就地动）

| # | 级 | 发现 | 证据 | 处置建议 |
|---|---|---|---|---|
| N-1 | 🔵 | **「（拟新增）」同族残留**（G-2 家族更大面）：`docs/vsc/design/VSC-DEBT.md:42` ×2（`protocol-coverage.test.mjs` / `test/files.mjs`；另 §4 受影响表含 `setup-tooltable.mjs` / `panel-messages-session.mjs` 等同款标记——三档均已落地） | doc-check 列报（拟新增 6 项含 VSC-DEBT:42 两项）；三档实盘在 | 随下一轮同族收正（本批射程 = WEBVIEW 两档，不含此档） |
| N-2 | ✅ 已裁 · 本批收正中 | **写权模型两处旧述**（与现行提示词体系「需求 = 主 agent / 设计 = eng-designer」不一致）：`thincoder-cli/AGENTS.md:10`「（均 **eng-designer 产物**）」· `docs/core/design/DOC-DISCIPLINE.md:16`（D1 行「需求/设计 = eng-designer」） | **用户 2026-09-20 12:25 收正授权**（需求档（项目需求 + 功能规格）= 主 agent；设计档 = eng-designer）⇒ 判据落地；同族补扫见 N-6 | **已裁（12:25）**：① `DOC-DISCIPLINE.md:16` D1 行**本轮已就地收正**（与同档 `:12` / `:33` 及纪律层提示词同态）；② `thincoder-cli/AGENTS.md:10` 括注收正 = **批 2（C2 改法已更新 · §2.3）**——**消解路径** = C2 实现轮按改法落笔；**到期条件** = 批 2 实现轮（既定车道）。 |
| N-3 | 🔵 | **as-of 迁移期读数**（样例 `CORE-UNIFICATION.md:622`「基线 160/160」）带「本轮实跑原样读数」注解 ⇒ 属 D8**出处注** | 该行在册 | 判保留（不入 #128 射程） |
| N-4 | 🔵 | **doc-check 行宽红项归属**：`docs/core/requirements/AGENT-LOOP.md:163` / `:168`（327 / 319 字符）= **并行会话在途档**（mtime 早于本笔；同会话在途 `MODEL-SPECS.md` 族） | 见 2.7-F1 | 交并行会话 / 收口父侧（本笔不动作） |
| N-5 | ✅ 本轮已收正（承评审 #5） | **`CORE-UNIFICATION.md` 同族死对象残留**：`:621`（仓根三机检行）· `:1726`（K1 判据行）内 `doc-anchors.mjs` / `check-doc-width.mjs` / `check-ledger.mjs` 三死名（`:620` 同轮已收、此两行漏网） | 盘上 `scripts/` 仅 `doc-check{,-anchors,-width,-targets}.mjs` 四档；两行无「（迁移期引文）」标记 ⇒ 按 `DOC-DISCIPLINE.md` §3.8 两分判据 = **A 类 · 规定动作 / 判据句** | **本轮已改指** → `scripts/doc-check.mjs`（单入口 · 核三档分居）；`check-ledger` 面**改述**（无承接——归核内 SQLite `thincoder-core/ledger.mjs`，不换名；映射单源 = §3.8）。**同族残留 3 处登记（本席扫出 · 未动）**：`:592`（A 类 · 同法待收）· `:920` / `:922`（裸名不成锚 · 同族）；消解路径 = 下一轮同族 sweep；到期条件 = `docs/core/design/` 下一次板块级 sweep 或该档下次实质修订 |
| N-6 | 🟡 | **写权旧述同族补扫（承 #1 裁定 · 3 处）** | ① `docs/core/requirements/ENGINEERING-MODE-V2.md:590`（需求侧 D1 行「需求/设计档 = eng-designer」——现役需求面 · 父侧笔）② `docs/core/design/DOC-DISCIPLINE.md:590`（2026-09-18 落笔记录块内引 D1 旧文本——带日期 ⇒ 存史块）③ `docs/core/requirements/_archive/ENGINEERING-MODE-MECHANISM.md:160`（归档档同族行） | ① **上抛父侧收正**（需求档 = 父侧笔——消解路径 = 改「需求档 = 主 agent · 设计档 = eng-designer」；到期条件 = 需求层下次触碰轮，同 §2.1-d 口径）② 判**存史块**（带日期 + 轮次号——同法 = 本档 §3.8-B / 本档 `:504` 先例）⇒ 零触碰 ③ 归档档 ⇒ 判不动在册 |
| N-7 | 🔵 | **需求档内 VSC 旧层根死指针**：`docs/core/requirements/RELEASE.md:42` 记「设计侧操作步骤 = `thincoder-vscode/docs/design/RELEASE.md`（VSC 侧未迁）」——真身已迁 `thincoder-vscode/docs/_archive/design/` | 实核 `thincoder-vscode/docs/design/` 现仅余 `_archive/`（盘上无 `RELEASE.md`）⇒ 指针按现盘不解析（G-1 / C4 同族） | 上抛父侧（需求档 = 父侧笔）——随 §2.1-d 同轮判；本批零触碰 |

**计数核对（收口）**：4 / 4 条一条不漏（2.1–2.4）· #128 92 处 = 26 收正 + 29 保留 + 37 登记 ✓ · #129 三则全落 ✓ · #131 六则设计齐（未落）✓ · #120 四项全落（闭集 + 记录面 + 子集判 + errata）✓ · **净增 0**（F1）· 与 §1 边界逐条守住 ✓ · **修正轮（评审 id=43）10/10 逐条落**（处置表 + 断言 = §2.10）。

### 2.10 修正轮（设计评审 id=43 · findings #1–#10 全落 · 2026-09-20 · eng-designer）

**轮次** = fix（定点 · 追加制）· **任务书** = §3 轮次 1 发现表全段（🔴1 / 🟡6 / 🔵3 = 10 条；父侧已逐条裁定接受）。
**形态** = §2.1–§2.9 **就地收正**（本作者段内——原行可由 git 历史逐字复核；承 `docs/batches/2026-09-13-CORE-UNIFICATION.md` §2「就地修正」先例）+ 本块（追加制处置记录）。**不夹带新范围**。

| # | 级 | 处置 | 改动 file:line | 机检断言（实跑读数） |
|---|---|---|---|---|
| 1 | 🔴 | 写权矩阵收正（用户 2026-09-20 12:25 收正授权）：D1 行就地收正 + C2 改法补括注收正 + N-2 补消解路径 / 到期条件 + 同族补扫登记（N-6） | `docs/core/design/DOC-DISCIPLINE.md:16` · 批档 `:101`（C2）· `:195`（N-2）· `:199`（N-6） | `OK #1`——正判「需求档（项目需求 + 功能规格）= 主 agent」在场 ∧ 反判「需求/设计 = eng-designer」零命中 |
| 2 | 🟡 | A-DD8 判据 1 内「沿革」行**删除**（D8；历史句移入记录面）· 变更记录 +1 条 | `docs/core/design/DOC-DISCIPLINE.md` 旧 `:1003`（删）· 变更记录 `:1304`–`:1305` | `OK #2`——正判变更记录条在场 ∧ 反判「本条原以旧慢层用例档」零命中 |
| 3 | 🟡 | 计数与枚举自洽：`92 处 / 26 档` · `29 处 / 6 档（+ 记录面 1 行）` · 闭合式改写（改后残留 = 67） | 批档 `:47` · `:64` · `:84` | `OK #3`（§2 域）——三式在场 ∧ 旧形 `25 档` / `7 档` 零命中 |
| 4 | 🟡 | 需求面两类登记（① 死对象类 / ② doc-hygiene 类）+ 消解路径 + 到期条件 | 批档 `:80`–`:82` | `OK #4`——①② 类名 ∧ 「到期条件 = 需求层下一次板块级 sweep」在场 |
| 5 | 🟡 | `CORE-UNIFICATION.md` 三死脚本名**改指**（评审点名两行；同族残留 3 处登记 = N-5）· 变更记录 +1 条 | `docs/core/design/CORE-UNIFICATION.md:621` · `:1726` · 变更记录 `:1929`–`:1931` | `OK #5`——正判 `scripts/doc-check.mjs --root .` / `scripts/doc-check-width.mjs` / 台账面改述在场 ∧ 反判旧 K1 尾「全 exit 0」与旧行首「仓根三机检**：」零命中 |
| 6 | 🟡 | G-4 两读数 as-of 对齐：§2.2 明示现盘复核时点 + `16 键 / 表收 4`；§1.1 侧差 = 报告面登记（§1 非本席写域） | 批档 `:92` | `OK #6`（§2 域）——「本席复核 as-of 2026-09-20 12:3x」∧ `16 键` 在场 ∧ 旧「现盘…16 键、表收 4」句零命中 |
| 7 | 🟡 | C5 改法写成整句形态（反引号成对）+ E5 同轮补反判 | 批档 `:104` · `:173`（E5） | `OK #7`——`End separation (`../docs/core/design/SESSION.md` §6.10, 2026-09-05)` ∧ 「E5 同轮补反判」在场 |
| 8 | 🔵 | 84 处差值改述（清单未在册 ⇒ 逐档对账不可复核；以现盘 92 为准） | 批档 `:47` | `OK #8`（§2 域）——「该刻清单未入档」∧「本表改述」在场 ∧ 旧句「84 处 ⊆ 本集」零命中 |
| 9 | 🔵 | E1–E6 逐条补配对反判（正判 + 反判成对） | 批档 `:167`–`:174`（六行命令重写） | `OK #9`——E 块「正判 + 反判成对」在场 ∧ `const neg=` × 6 |
| 10 | 🔵 | §6.3 头注末句改述（登记义务 = 承 D3 既有纪律 · 非本表新立）· 变更记录 +1 条 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:238` · `:538` | `OK #10`——正判「登记义务 = 承 **D3** 计数·枚举纪律」在场 ∧ 反判旧「（D3——防「新键落表滞后」型缺口）」零命中 |

**验收（C1–C4）**：**C1** 10 / 10 条一条不漏（上表逐号）· **C2** 逐条断言实跑全绿（读数 = 上表；命令 = `node -e` 直跑，cmd.exe 已实证；§2 域断言按「§3 引旧值」口径切域 = `a.slice(0, a.indexOf('## §3'))`）· **C3** `node scripts/doc-check.mjs --root .` ⇒ `汇总：候选 18314 · 悬空 0 · 注记豁免 43 · 拟新增 6 · 迁移期引文 211` + `OK(锚): 0 条悬空（闸态——阈值 0）` + `FAIL(行宽): 2 行`（同初轮两处并行会话在途档 `docs/core/requirements/AGENT-LOOP.md:163` / `:168`）⇒ **净增 0**（首跑自产 1 处宽行 `CORE-UNIFICATION.md:1929`（392 字符）⇒ 已折行归零）· **C4** 与父侧已落面零冲突（§1 / §3 / §4 / §6 零触碰；需求档 / 产品码 / `scripts/**` / 提示词 / 归档档 零触碰；§2 内仅本席行）。

**联改面（D3 一致性）**：批档 `:59`（§2.1-b DOC-DISCIPLINE 行——沿革行改判）· `:122` / `:123` / `:127`（§2.5 触碰计数）· `:184`（F1 修正轮复跑读数）。

**D1 / D2 / D3 复跑（原样 · 与初轮同读数）**：`OK 0 pre-cut residue in 7 docs` · `OK keep-set + changelog-face counts match` · `OK subset judge [31,40,44,697,710,1041,1902]`。

**本修正轮不做**：实现面（产品码 / 两产品 `AGENTS.md` 实体 = 批 2 · C1–C6 六则）· E1–E6 实跑（批 2 落笔后）· 需求档内容（父侧笔——死对象 / D8 两类登记 + N-6 ① / N-7 上抛）· 10 条以外的收正（N-5 同族残留 3 处 / N-1 / N-3 / N-4 = 登记面）· 行号漂移追改（承 D4）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：库存清账批 §1–§2 全段（#128 逐行 92 处 / #129 三则 / #131 六则设计 / #120 尾项）+ 已落设计档 8 档 + §2.9 四条。
**独立复核（只读 · grep 复算）**：族正则域（`docs/**` 扣 `batches/` 与 `_archive/`）设计面现存 **30 行**命中 = 判保留 29（6 档：`TODO-archive.md` 18 · `TESTING.md` 6 · `ENGINEERING-MODE-V2.md` 2 · `prompts/discipline-engineering.md` 1 · `ARCHITECTURE.md` 1 · `cli/design/RELEASE.md` 1）+ `VSC-DEBT.md:590` 新落变更记录 1；需求面 **37 行 / 13 档**逐档与 §2.1-d 相等；7 档收正处切点前零命中 ⇒ D1/D2 判据与 §2.1-b/c/d 枚举可复现。D3 子集判复现 = {31,40,44,697,710,1041,1902} ⊆ 枚举 ✓。§2.3 六则事实锚实核：C1 §4 = 堆遥测 ✓ · C3 §6.2 = GitHub 双远端 / §3.2 = CalVer ✓ · C4 `_archive/design/` 在盘且 `docs/design/` 仅余 `_archive/` ✓ · C5 `SESSION.md:169` = §6.10 ✓ · C6 权威读数 `TESTING.md:291` = 593/592 ✓ · N-1 三档已落地 ✓。受影响文件表全为 `.md` ⇒ 尺寸标注豁免（无源 / 测试档）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | **写权矩阵同机制两处互斥**：`docs/core/design/DOC-DISCIPLINE.md:16`（D1 行「需求/设计 = eng-designer」）vs 同档 `:12` / `:33`（「需求侧同步 / 需求侧落笔 = 主 agent 域」）+ 纪律层 `docs/core/design/prompts/discipline-engineering.md:39` / `:104`（「需求档（项目需求 + 功能规格）= 主 agent」）。本批三处用「需求面 = 父侧笔」（批档 `:21` · `:36` · `:76`）并把 37 处需求面收正派给 **主 agent**（`:127`），C2 落笔亦按「括注句保留 + 上报」处理（`:191` N-2，自评 🔵 + 「须裁」，无消解路径 / 到期条件）。该矛盾直接决定未落两车道（需求面 37 处 · C2 逐字改法）的归属与正确性 ⇒ 属「同机制两处不同描述」，按 Document ownership 判 🔴，不得降级。 | 裁定写权归属后就地收正被判陈旧的表述（`DOC-DISCIPLINE.md:16` D1 行与 `thincoder-cli/AGENTS.md:10` 括注「均 eng-designer 产物」须同态），并在 §2.9 给该条补消解路径 + 到期条件；归属未裁前不派发需求面 37 处与 C2 落笔。 |
| 2 | Doc hygiene | 🟡 | `docs/core/design/DOC-DISCIPLINE.md:1003`：A-DD8 判据 1 内「**沿革**」半句保留修订式表述——「本条原以旧慢层用例档（`doc-consistency.test.mjs`）为等价腿、判据仅在慢层生效——该档已随 M8 机检重写批删除…⇒ 门控口径随之消解」，住 AC / 判据块内（现值句 `:1002` 已自足）；批档 `:59` 明示「沿革块历史半句保留」。D8（`:23` + 细则 `:27`）要求现役规范面不留「原记 X ⇒ 收正 Y」，历史归记录面。 | 删该半句，或把沿革整句移入本档变更记录条；若判「沿革」为记录面，须显式成节（记录面形态），不得内嵌 AC 块。 |
| 3 | Clarity | 🟡 | **计数与枚举不自洽**：§2.1-a「92 处 / 25 档」（`:47`）与枚举面不符——收正 7 档 + 判保留 6 档 + 需求面 13 档 = **26 档**；§2.1-c 表头「29 处 / 7 档」（`:64`）而表内 6 档合计 29 处（第 7 处 = `VSC-DEBT.md:590` 记录面行，已由 D2 单列于 `:155`）；闭合式（`:82`）与档数不自洽。行数侧可复现、档数侧不可（见上复核）。 | 表头改「92 处 / 26 档」·「29 处 / 6 档（+ `VSC-DEBT.md` 记录面 1）」，并把闭合式改写为「92 = 26 收正处 + 29 判保留 + 37 需求面登记；改后残留 = 29 + 37 + 本批新落记录行 1 = 67」，与 D2 期望集同口径。 |
| 4 | Scope / Coordination | 🟡 | 需求面 37 处整体延后且**未给消解路径 / 到期条件**（`:78`-`:80` 仅「全归需求层下次触碰轮」），其中含：AC 格**死命令** `docs/vsc/requirements/WEBVIEW.md:99`（`node test/run-fast.mjs`，`thincoder-vscode/test/run-fast.mjs` 不在盘）= 治理口径「死对象」类；D8 明令必删的修订式表述 `docs/core/requirements/RELEASE.md:46`（V-F1 行「原『四环』…实况已收敛」）。同批其余残差（`:190` N-1 / `:193` N-4）均带触发与归属，此条独缺。 | 为该 37 处补消解路径 + 到期条件；并把「死命令」与「D8 修订式表述」拆为两类登记（前者按死对象、后者按 doc-hygiene），避免混在一条推荐里继续漂。 |
| 5 | Coverage | 🟡 | 同节同族死对象半改：§2.1-b 以「同族死对象」收正 `CORE-UNIFICATION.md:620` 的 `doc-anchors.mjs` 括注（实核已改），但 `docs/core/design/CORE-UNIFICATION.md:621`（「仓根三机检：`node scripts/doc-anchors.mjs` · `scripts/check-doc-width.mjs` · `scripts/check-ledger.mjs`」）与 `:1726`（K1 判据行同三名）仍为死对象——`scripts/` 盘上仅 `doc-check.mjs` / `doc-check-anchors.mjs` / `doc-check-targets.mjs` / `doc-check-width.mjs`；两行无「（迁移期引文）」标记（对照 `:1163` / `:1518` / `:1707-1710` 同族行均带），按 §3.8 两分判据（`:309`）属 A 类 · 规定动作 ⇒ 应改指。§2.9 未登记。`unverified`：两行是否入 `doc-check` 报集（V5-A 排除式④「可执行行谓词」可能整行豁免 —— `DOC-DISCIPLINE.md:690`）⇒ F1 的「悬空 0」不能作为覆盖证据。 | 于 §2.9 补一条（A 类 · 改指 `scripts/doc-check.mjs` / `scripts/doc-check-width.mjs` / 台账面改述），或按 §3.8 残差登记口径入册（带到期条件）。 |
| 6 | Consistency | 🟡 | G-4 同对象两读数未标 as-of：§1.1（`:15`）「`locales/en.json:148-162` 实 15 个 `sub.*`，表仅收 5」vs §2.2（`:90`）「现盘 locales `sub.*` = 16 键、表收 4」（G-2 行 `:88` 对台账坐标明确标了 as-of，此处无）。实核：`thincoder-vscode/locales/en.json:150-165` = **16** 键；`WEBVIEW-PROTOCOL.md` §6.3 表（`:240-259`）18 行、其中 `sub.*` = 4 ⇒ §2.2 侧为真、§1.1 侧为陈旧读数。 | §1.1 G-4 行补 as-of 标记（或改述为「台账 as-of 读数」），§2.2 明示「现盘实读 16 / 表收 4」的复核时点；表头 18 = 表内 18 行已实核成立，仅需口径对齐。 |
| 7 | Clarity | 🟡 | §2.3 C5 的「改法（逐字）」列字面畸形：`(`../docs/core/design/SESSION.md` §6.10, 2026-09-05)`（inline-code 反引号不成对）⇒ 实现轮可能产出错误形态；E5（`:171`）只判 `SESSION.md` §6.10` 在场，畸形形态可通过机检。目标锚实核成立（`docs/core/design/SESSION.md:169` = `### 6.10 端分离恢复：本端 end marker`；`thincoder-vscode/AGENTS.md:22` 现文 `(§10, 2026-09-05)`）。 | 该列写成改后整句形态（例：`**End separation (`../docs/core/design/SESSION.md` §6.10, 2026-09-05)**`），E5 同轮补反判「原 `(§10,` 形态零命中」（防半改）。 |
| 8 | Evidence | 🔵 | §2.1-a「84 处 ⊆ 本集」（`:47`）不可复核：台账 04:3x 的 84 处清单未入档，差值解释（「上批新落记录面行 + 域内漂移」）无逐档对账，读者无法验证真包含。 | 补一行差值归属（哪几档新增 / 漂移），或改述为「台账读数 84（清单未在册）；本批以现盘 92 为准」。 |
| 9 | Acceptance | 🔵 | E1–E6（`:167`-`:172`）逐条只有单向判：E1/E3/E4/E5 正判、E2/E6 只判残留，均无配对反判（E5 不判旧形态已消失；E6 只判数字缺席、不判指针形态在场）⇒ 半改可通过。 | 每条补一反判（旧形态零命中 / 新指针可解析），或在 §2.7 明示「配对判据 = F1 锚面」以免读者误读为全覆盖。 |
| 10 | Scope | 🔵 | §2.2 G-4 在「零新语义」批内新增义务句「新增对位键须同轮登记本表（D3）」（`WEBVIEW-PROTOCOL.md:238`；批档 `:90` 判为口径补注），与同轮变更记录「**零新语义**」（`WEBVIEW-PROTOCOL.md:537`）张力——对外读作新立登记义务。 | 或改述为「登记义务 = 承 D3 既有纪律（本表为其落点）」，或在 §2.9 明示「口径细化的新增义务」并登记，使「零新语义」声明与文本一致。 |

**计数**：🔴 1 · 🟡 6 · 🔵 3（合计 10 条）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**复核轮（承轮次 1 · 评审 id=43 · 修正轮 id=44）**——对象 = 修正声明 10/10 真落复核（逐号陈述 + file:line 证据）+ 修正引入的新问题；不重开全量评审。
逐号复核：① 落（`docs/core/design/DOC-DISCIPLINE.md:16` D1 收正 · 批档 `:101` C2 改法 · `:195` N-2 消解路径/到期 · `:199` N-6 · 变更记录 `:1304`）② 落（`:1002`–`:1003` 现值句自足 · 沿革句零命中 · 变更记录 `:1305`）③ 落（批档 `:47` / `:64` / `:84`）④ 落（批档 `:80` / `:82`）⑤ 落（`docs/core/design/CORE-UNIFICATION.md:621` / `:1726` / `:1929`–`:1931` · N-5 = 批档 `:198`）⑥ 落（批档 `:92` · `docs/vsc/design/WEBVIEW-PROTOCOL.md:238` / `:240`–`:259` 实核 18 行 · `sub.*` 4）⑦ 落（批档 `:104` / `:173`）⑧ 落（批档 `:47`）⑨ 落（批档 `:167` / `:169`–`:174` · `const neg=` ×6）⑩ 落（`WEBVIEW-PROTOCOL.md:238` / `:538`）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | #1 同族枚举不全：`docs/core/design/DOC-DISCIPLINE.md:278`（§3.7「实施面归属」· 无时点锚）仍写「文档面写权 = eng-designer（D1 唯一作者）」——与收正后 `:16` D1（需求档 = 主 agent）互斥（批 12 的 R1–R3 含需求档行）；`:923` 同族候选；N-6（批档 `:199`）仅登记 `:590`。另 #1 断言「零命中」不覆盖空格变体（`:590` 存「需求 / 设计 = eng-designer」，已判存史块）。 | 将 `:278`（及 `:923`）纳入同族处置——与 `:16` 单源对齐，或补入同族登记并带消解路径 / 到期条件；断言补空格变体与域切分后的逐字串。 |
| 2 | Coverage | 🟡 | #5 同族登记枚举不全：`CORE-UNIFICATION.md:1733`（K8 反证面 · 与已收正的 K1 同表）· `:1656`（§4.4 核验方式列）· `:1565`（§4.2 防漂移句）仍带死名 `check-doc-width` / `check-ledger`（裸名形态 ⇒ 不成锚 · 机检绿）；N-5（批档 `:198`）只登记 `:592` / `:920` / `:922`。 | 补齐同族枚举并统一处置（改指 / 改述，或入册带到期条件）；理由行分写「裸名不成锚」与「判据行仍为死对象」。 |
| 3 | Acceptance | 🔵 | §2.10 断言按字面不可全域复现：#3 否定判「旧形 `7 档` 零命中」——批档 `:52` / `:143` / `:149` 有正当「7 档」；#5 否定判「旧 K1 尾『全 exit 0』零命中」——`CORE-UNIFICATION.md:1729`（K4 行）含「全 exit 0」。 | 断言写成「域 + 逐字旧句」双限定（切点 / 行范围 + 完整旧串），便于复核者一键复跑。 |

**口径限制**：本仓无文档地图 / 无项目标准档声明 ⇒ Document ownership 依被审档自身的 D1 / D8 判据判；`scripts/**` / 产品码 / locales 域外 ⇒ `doc-check.mjs --root` 旗标面与 locales「16 键」读数未复核（`unverified`）。
**计数**：🔴 0 · 🟡 2 · 🔵 1（合计 3 条）。
VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-20 12:42 父侧代签**——依据用户 11:51「**库存那些也点火把**」+ 12:25「**收正授权**」（写权定案：需求档 = 主 agent · 设计档 = eng-designer）+ 排空授权（评审点火权 + §4 批准权委托父侧，自缚三条件）。

**三条件核验**：① 评审 **pass（0 🔴）**（复核轮 id=45：10/10 逐号复核全通过；新挈 2🟡 1🔵 全接受、均不阻塞）；② **修正轮（id=44）10/10 落地**（含原 🔴 = D1 行收正 + C2 改法更新 + N-2 消解路径）；③ **token 已签发**（值不落档）。

**响应表（轮 1 · 10 条）**：Fixed = #1–#10 全落；轮 2 新挈：① `DOC-DISCIPLINE.md:278`（含 `:923`）同族枚举补全 —— **接受，归尾项**；② `CORE-UNIFICATION.md:1565`/`:1656`/`:1733` 同族登记补全 —— **接受，归尾项**；③ §2.10 断言域限定 — **接受，归尾项**（三项均为小改，与 §6 同轮或随即一轮）。

**批准范围**：① **设计定稿**（批档 §1–§2 全段含 §2.10 + 已落设计档 9 档）；② **实施三道**：**批 1 = 已落**（设计档 9 档）· **批 2（eng-coder）** = 两产品 `AGENTS.md` 六则（C1–C6 + C2 写权括注按定案收正；与 P1/P2 收口轮的写域冲突已登记）· **批 3（主 agent 笔）** = 需求面 37 处（两类登记）+ N-6/N-7 同族残留；③ **尾项**：轮 2 三条 + G-4 §1.1 侧差。

**收口预告**：批 2 / 批 3 落定 → 核 D1–D3 与六则判据 → 收口（§6）+ 核销 #128 / #129 / #131 / #120 + 提交 + push。

## §5 实施记录（eng-coder）

**实施记录（eng-coder · 2026-09-20 · 轮次 = initial）**

**状态行**：✅ 批 2（产品文本面 2 档 · 六则 C1–C6 + tool-docs 计数复核）已落 · E1–E6 全绿 · 机检净增 0 · 两包测试全绿 · 内审 + advisor 终态 = clean（零 must-fix）。

**① 六则逐条「号 → 改动 file:line」**

| # | 落点 | 改动（前 → 后） |
|---|---|---|
| C1 | `thincoder-cli/AGENTS.md:59` | `CRASH-REPORTS.md` 节号 §8 → **§4**（实存 = `## 4. 堆遥测 / 看门狗（事前预警）`；旧 §8 为死节号） |
| C2 | 同档 `:10` | ① 层根两态：`docs/requirements/` → `docs/core/requirements/` · `docs/design/` → `docs/core/design/`；② 写权括注逐字收正：「均 **eng-designer 产物**……」→「需求档 = **主 agent 产物**；设计档 = **eng-designer 产物**——写稿权唯一；需求讨论/登记在会话面」（承 §2.10 #1 · 用户 2026-09-20 12:25 定案） |
| C3 | 同档 `:31` | `docs/design/RELEASE.md` ×2 → `../docs/cli/design/RELEASE.md`；节号 §5.2 → **§6.2** · §4.6 → **§3.2** |
| C4 | `thincoder-vscode/AGENTS.md:7` | `docs/design/` → `docs/_archive/design/`（实核该目录在盘且含设计档实体） |
| C5 | 同档 `:22` | `(§10, 2026-09-05)` → `(`../docs/core/design/SESSION.md` §6.10, 2026-09-05)`（整句形态 · 反引号成对 · 承评审 #7 收正） |
| C6 | 同档 `:122` | 陈旧基线（553/518/35 skip · as-of 09-15）→ **改指权威（读数不重述）**：`测试基线读数与 as-of 的权威 = `../docs/core/design/TESTING.md` §10` |
| 附则 | 两档 | tool-docs 计数复核：VSC `:15` / `:127` = **24** ✓（实盘 `thincoder-core/tool-docs/` = 24 档、`prompts/` = 15 档）；两档全档 `25` 残留 = 0（VSC 唯一命中 = `:127` `sha256` 假阳）；`scripts/**`（含 `check-vsix.mjs`）零触碰 ✓ |

改动规模：两档各 3 处**就地替换**（行号零漂移 · 无增删行）· git diff 逐 hunk 核 = CLI 3 hunk / VSC 3 hunk，恰六则，零清单外改动。

**② E1–E6 读数**（§2.7 命令原样 · cmd.exe 实跑 · as-of 2026-09-20）：

`OK C1` · `OK C2` · `OK C3` · `OK C4` · `OK C5` · `OK C6`（六级链 exit 0——逐条正判 + 反判成对，六则旧形态全清）。

**③ 机检读数**（`node scripts/doc-check.mjs --root .` · 本席实跑 · 改写前基线 / 改写后 = 逐字相同）：

`汇总：候选 18329 · 悬空 0 · 注记豁免 43 · 拟新增 6 · 迁移期引文 211`

`OK(锚): 0 条悬空（闸态——阈值 0）` · `FAIL(行宽): 2 行` = `docs/core/requirements/AGENT-LOOP.md:163` / `:168`（并行会话在途档 · 与 §2.7-F1 同两处）。

⇒ **本笔写集净增 0**。域外事实：机检扫描域 = `docs`（139 档）⇒ 两产品档在机检域外，读数逐字不变系**设计使然**（非侥幸）。

**④ 两包测试读数**（本席实跑 · as-of 2026-09-20）：

- `thincoder-cli`：`ℹ tests 738 · pass 738 · fail 0 · cancelled 0 · skipped 0`（`node test/run.mjs` 全量单入口）
- `thincoder-vscode`：`ℹ tests 833 · pass 833 · fail 0 · cancelled 0 · skipped 0`

文档面改动（两档均为 `.md`）⇒ 零回归；两包读数如实登记（VSC 833 > `TESTING.md:291` as-of 593/592 = 权威档自身 as-of 读数，改动面除外）。

**⑤ 内审 + advisor 轮次与终态**

- **内审**（explore 只读偏离审计 · 1 轮）：六则内容面逐条 ✅（零部分实现 / 零静默简化 / 零清单外内容改动）；锚点全部实核（CRASH-REPORTS §4 实存 · RELEASE §6.2/§3.2 实存 · SESSION §6.10 实存 · TESTING §10 实存 · `_archive/design/` 在盘 · D1 同态）。终态 = clean（内容面）。
- **advisor 代码评审**（轮 1）：**VERDICT: pass**（🔴 0 · 🟡 2 · 🔵 1）。两条 🟡 均在批档记录面（① §5 本席段待写——本段即其消解；② §2.5 状态列 / §2.7 E 块头档态滞后 = 设计席/父侧回填面，见 ⑥-1）；🔵 = 同档指针形态并存提示（本批无动作要求，见 ⑥-2）。
- **终态 = clean**（审计 1 轮 + advisor 1 轮 · **零 must-fix ⇒ 零自修轮**）。

**⑥ 上抛项（父侧 / 设计席）**

1. **档态滞后回填**（advisor 🟡 #2）：§2.5 受影响文件表两产品档行（`:128`）状态仍「**eng-coder 轮（待派）/ 未落**」· §2.7 E 块头（`:167`）仍「**未落 · 读数待实现轮**」——实态 = 已落（读数 = 本段 ②/③/④）。§2 为设计席写域（一段一作者），请同轮或 §6 前回填。
2. **指针形态口径**（advisor 🔵）：C3 按 §2.3 逐字落 `../docs/cli/design/RELEASE.md` ⇒ 与两档既有仓根相对形态（CLI `:35` / `:52` / `:57` / `:59`）并存；同批 VSC `:122` 同取 `../` 形态。若需「同档单形态」统一，**另轮收**（本批零动作——形态即任务书逐字改法）。
3. **C6 权威面漂移**：`docs/core/design/TESTING.md` §10 自带 09-18 as-of 读数（`:291` 593/592）——读数必随后续批次漂移，C6 选指针形态即为此稳定性；登记，非缺陷。

**本席未触碰**：需求面 37 处 · 设计档 8 档 · `scripts/**` · 归档档 · 批档他人段（§1 / §3 / §4 / §6）与 §2 全段 · 两产品档六则行以外内容。

## §6 验证与收口（父代理）

**2026-09-20 13:0x 父侧收口**

**交付核验（三车道）**：设计轮（#42 · #128 逐行 92 处 / 25 档 → **26 死处方收正 + 29 判保留（逐条理由）+ 37 需求面登记** · #129 三则 · #131 六则设计 · #120 尾项 J-3 块 + 子集判）✓ · 评审 **id=43 首轮 changes-required（🔴1 · 🟡6 · 🔵3）** → **修正轮（#44）10/10** → **复核 id=45 = pass（逐号 10/10 通过 · 新挈 2🟡1🔵 全接受）** ✓ · 批 2（#46 · 两产品 `AGENTS.md` **C1–C6 六则** + C2 写权括注按定案收正 · E1–E6 全绿 · CLI 738/738 · VSC 833/833 · advisor pass）✓ · 父侧笔（N-6/N-7 需求档两处 + 轮 2 三条尾项 + 父侧自伤两行）✓

**机检**：`OK(锚): 0 条悬空` · `OK(行宽): 源域全部 .md 无 >300 字符单行` · exit 0 ✓

**角色表**：设计席（§2 全段 + §2.10 + §2.11）· 实施（批 2 = eng-coder #46）· 父侧 §4 代签（12:42）· **批 3 = 父侧笔**（需求面 37 处：**收正 24 + 判保留 5** = 29 已处 · 余 8 = TESTING 内部机制词面（逐处对读中，承 §2.1-d 消解路径））· 父侧自伤两行已折 ✓

**台账**：**#128 / #129 / #131 → 已核销** ✓；**#120 主体已于 P3 收口**（其尾项 = 本批 J-3 块 + 子集判 ✓ 已落）⇒ **一并核销** ✓；余项 = 需求面余 8 处（在册 · 带到期条件）。

**遗留（显式）**：① 需求面余 8 处（TESTING 内部机制词面——逐处对读后收或判保留）；② 批档 §1 状态行 / §2.5 档态滞后（父侧面 · 随本笔后一次回填）；③ C6 权威面漂移（指针形态 = 稳定性选择，判非缺陷）；④ N-1 同族残留（「拟新增」超三则射程——在册）。

**提交**：`docs: residual-sweep batch (#128/#129/#131/#120) …`（`48f356ac`）+ 三采（`a13c16bd` / `37a27ce7` / 本笔）· 全 push ✓。
