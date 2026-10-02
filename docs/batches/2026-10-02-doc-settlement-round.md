# 2026-10-02 · doc-settlement-round
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 17:44「需求和待办赶紧开批」+ 台账 #806（行宽清账轮·用户立批）∥ #797 ∥ #803 ∥ #804 ∥ #815 ∥ #816（清账面小件）。
> 台账 = #806 ∥ #797 ∥ #803（+#804 ∥ #815 ∥ #816——产品码注释面 ∥ 父侧直改）（文档清账轮 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-02 17:44「需求和待办赶紧开批」+ 台账 #806（行宽清账轮·用户立批）∥ #797 ∥ #803 ∥ #804 ∥ #815 ∥ #816（清账面小件）。

**设计轮落定核读 + 上抛处置（2026-10-02 18:0x · 父侧）**：#806 复核+切分六轮**接受**（届盘 46 档 · 431 锚 · 105 宽；逐轮 ≤15 档；时序门 = 轮 1–3 即可开 ∥ 轮 4 随桌面轻段静默 ∥ 轮 5 候桌面在飞批全静默 ∥ 轮 6 候 #820 解冻——排期按表）；#797 ∥ #803①② 直落核讫（读回在册）。

**U-1 = 已落笔**（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md:12` 补 `widthExemptZones` ∥ `lineCounts`——父侧笔 · 可 revert）。**U-2 = 复核后收正（附一处修正）**：`SHELL.md:175` 42 ⇒ `**42**（实读 2026-10-02）`（KD-4 实读核 ✓）；`SESSIONS.md:124` **值+形同拍**——设计判「值面 0 差异」对本行**不成立**：KD-4 实读（`countContentLines`）2026-10-02 = **79** ≠ 载值 73 ⇒ 收正 `**79**（实读 2026-10-02——前读 73〔实读 2026-09-28〕）`；**扩面快检**（邻行 12 值：SHELL §5.1 四 + SESSIONS §5.1 八）——唯此一行漂移，余 11 全对（父侧机械笔 · 可 revert）。**U-3 = 已裁**（接受切分表，见上）。**候用户点火评审**。

**授权（2026-10-02 19:30 · 用户「全自动」）**：本批转**全链自动**（代点火 ∥ 修正派发 ∥ §4 代签 ∥ 实施派发 ∥ 收口核销——自缚三条：① 代签仅当三条件齐备；② 新范围 ∥ 口径裁决 ⇒ 停；③ 破坏性/不可逆 ⇒ 停）。**设计评审代点火中**（报告到达 ⇒ 裁定 → 修正（如有）→ 代签 → 实施（#806 六轮按切分表 ∥ 产品码注释三件父侧直改）→ 核验 → 收口）。

**评审处置（轮 1 · 6 条：3🟡+3🔵——全修于本轮 · 父侧笔 · 可 revert）**：① 🟡 两档记录面缺行 ⇒ **已补**（`SHELL.md:328` ∥ `SESSIONS.md:219` 各一行「文档清账轮 · 形面 ∥ 值+形」体）；② 🟡 AC-M8-6 算式 ⇒ **已写死**（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md:38`「判据项计数 = `checkConfig` 键数 + `anchors` 拆分 1」）；③ 🟡 清账清单单源 ⇒ **本声明**：现行清单 = 本档 §2.2（届盘复核 431 锚 ∥ 105 宽 ∥ 46 档）+ §2.3 轮表；`2026-10-01-docwidth-settlement.md` §2.3/§2.4/§6 之数（117 ∥ 120 ∥ #806 指针）= as-of 2026-10-01 记录面，不再作执行依据；④ 🔵「五键」指称 ⇒ **已补**（`DOC-MIGRATION.md:414`「五键（= 声明面五项——§10.2 行 6）」）；⑤ 🔵 族覆盖 ⇒ **已处置**（`ACTIVITY.md:221` 同法去「**已落** ·」（`timer-wake.test.mjs` 实核**已失**——同 #785 族）；变更行同轮落）；⑥ 🔵 两值对盘 ⇒ **已核**（`host-floor.mjs` = **42** ✓ ∥ `session-actions.mjs` = **79** ✓——contentLines 口径）。**附裁**：记录面读解 = **采**（语义逐字留 ∥ 形退场——§2.2 ③ 披露项）；轮 5/6 门 = 候桌面在飞静默 ∥ #820 已闭讫（执行按轮表串行 ∥ 轮首复测）。**三条件齐 ⇒ §4 代签 + 实施派发（#806 轮 1 即开）。**

**父侧直改面核讫（#804 ∥ #815 ∥ #816——2026-10-02 19:5x · 可 revert）**：① **#804** = `thincoder-desktop/src/main/suspension-timers.mjs:8`「四枚读缝」⇒「**五枚读缝**」（实列五项——存量笔误收正）；② **#815** = 两档陈句收正（`renderer/search.mjs:17` ∥ `thincoder-render-core/search.mjs:27`「端侧现刻零消费点」⇒ 消费实证：**桌面 `app.mjs:277` 捕获 + `:70` `openSearch` 分派**〔菜单批接线〕∥ VSC 既有宿主键位注册；**台账原载 `:275` ⇒ 实读 `:277`**——as-of 漂移随正）；③ **#816** = **保零改维持**（re-export 保真实证在盘——`views/settings-sections.mjs` 头注「拆档族 re-export 面」；四档指针不假 ∥ 无实害——沿既有裁定不动）。

**执行轮 1 收官 + 轮 2 派发（2026-10-02 19:5x）**：轮 1（core/design 前段 7 档）——**25/25 锚 + 2/2 宽全清**（逐档读回 = §2.7；全仓 悬空 432 ⇒ **408** ∥ 行宽 107 ⇒ **105** ∥ 区带外新增超宽 **0**）；两先例随轮落（MANIFEST 承名按届盘实核收窄 ⇒ `batch-paths.mjs` ∥ DOC-CODE-RECONCILE 坐标回读 `:45 ⇒ :46`）；七档变更记录各 1 行在册。**轮 2 已派发**（core/design 后段 9 档 · 22 锚 + 7 宽——eng-designer 舱）。**行数面 7 条浮差 = 在飞桌面实施面**（`UI.md:489/:490` ∥ `SHELL.md:179/:183` ∥ `SETTINGS.md:154/:159/:170`——#25 实施轮 live 效应，读数 Δ+4~+45）：**非本批写面**；回填 = 桌面 UX 批收口轮同拍（在册——`lineCounts` 声明笔权 = main 直写，届盘一次回填，本轮不触）。

**执行轮 2 收官 + 轮 3 派发（2026-10-02 20:0x）**：轮 2（core/design 后段 9 档）——**22/22 锚 + 7/7 宽全清**（逐档读回 = §2.8；全仓 悬空 **408 ⇒ 386**（= 408 − 22，净零新增等号成立）∥ 行宽 **105 ⇒ 98**（−7 全为本轮折行）∥ 区带外新增超宽 **0**）；三披露在册（MEMORY 改指择端壳形 ∥ SESSION 承接实核随读 `session-control.mjs:58-59` ∥ 中段修正 = 改指解封宿主 ⇒ 转口坐标独立段——零语义）。**轮 3 已派发**（core/requirements + cli + vsc 12 档 · 12 锚 + 21 宽——eng-designer 舱）。行数面 8 条 = 桌面域在飞（#25 live——非本批；回填挂其收口）。

**引擎 SKIP 面随正（#31 上抛②处置 · 父侧直改 · 工程具面 · 可 revert）**：`scripts/doc-check-anchors.mjs` ∥ `doc-check-targets.mjs`（三处）∥ `doc-check-width.mjs`（两处）——SKIP 判补 **`dist-*` 前缀排除**（构建产物树 `dist-r3`/`dist-r4` 曾入 walk ⇒ 同名多义 ⇒ 悬空虚高——「374 vs 70」口径差根因之一）+ width 域发现补 **`.thincoder`**；修后复跑**两次同位**：悬空 **70** ∥ 行宽 **75**（稳定）。**轮 4–6 按此口径续跑**（轮首实测为准——轮表计数届时显著缩水属预期）。

**轮 4 开闸 + 派发（2026-10-02 20:5x）**：时序门核 = **桌面在飞全静默** ✓（桌面 UX 批已收口——#801 ∥ #702 ∥ #697 核销）；轮 4（render-core + 桌面轻段 11 档）派发。**口径注**：计划表「106 锚」系旧引擎口径（dist 树虚高未除）；修后轮首实测将显著缩水——**属预期**（相对判据照旧）。

**执行轮 4 收官 + 轮 5 派发（2026-10-02 20:5x）**：轮 4（render-core + 桌面轻段 11 档）——**18/18 锚 + 16/16 宽全清**（逐档读回 = §2.10；全仓 悬空 **70 ⇒ 52** ∥ 行宽 **75 ⇒ 59**——两方程精确成立 ∥ 区带外新增超宽 **0** ∥ 行数面 差异 0）；披露六条在册（旧口径缩水验证 ✓ ∥ 域外坐标 R3 ×2 ∥ 列报不入闸 ×2 保持 ∥ 轮内切割误读回即捕即修（D6 实证））。**轮 5 已派发**（桌面重段 3 档——PROJECT ∥ RENDERER ∥ UI；时序门 = 桌面在飞全静默 ✓）。**轮 6**（冻结面 4 档）顺列其后。

**执行轮 5 收官 + 终轮（轮 6）派发（2026-10-02 21:1x）**：轮 5（桌面重段 3 档）——**32/32 锚 + 46/46 宽全清**（逐档读回 = §2.11；全仓 悬空 **52 ⇒ 20** ∥ 行宽 **59 ⇒ 13**——两方程精确成立 ∥ 区带外新增超宽 0）；披露四条在册（改指越线同轮折 ∥ 符号解封拆分点先例）。**终轮已派发**：冻结面 4 档（IPC ∥ MENU ∥ SETTINGS ∥ SHELL——#820 解冻 ✓）+ **并入 `docs/core/design/MCP.md`**（余 1 宽；父侧排期裁——余项清零需要）；余项实测 = 悬空 20 ∥ 超宽 13（全落本轮 5 档面）。**终轮判据 = §2.6 腿 3：`OK(锚) 0 ∧ OK(行宽)` ∧ exit 0（全库归零）**。

**终轮（轮 6）收官——全库归零达成（2026-10-02 21:2x）**：冻结面 4 档 + `MCP.md` 并入——**20/20 锚 + 13/13 宽全清**；轮末实跑 = **`OK(锚): 0` ∧ `OK(行宽)` ∧ exit 0**（§2.6 腿 3 终轮判据达成——六轮全程：**432 ⇒ 0 ∥ 107 ⇒ 0**；逐轮方程皆精确成立）∥ 行数面 差异 0。**披露处置裁**：承接坐标 as-of 漂移 ×2 ⇒ **随读收正**（`SETTINGS.md:24` ∥ `SETTINGS.md:216` ∥ `IPC.md` 邻位同源句——父侧笔）；结转不动项（拟新增 45 ∥ 迁移期引文 297 = 非闸列报——沿例）。**清账批收口链启动**（§6 → 冻结 → 核销 → 凭证消费）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-02（文档清账轮——#806 复核+切分方案 ∥ #797 ∥ #803①② 直落（读回在册）；③ 需求档拟稿上抛（U-1））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）与写面

**本批（文档清账轮）= #806 复核+切分 ∥ #797 ∥ #803 并批；#804 ∥ #815 ∥ #816 = 父侧直改面（不在本舱）。** 三条覆盖：

1. **#806 行宽清账轮——复核 + 切分方案 + 回填清单**（本舱主产出 = §2.2 ∥ §2.3；清账执行 = 另轮——不在本批射程）。
2. **#797 直落**：`docs/desktop/design/ACTIVITY.md` §4.2「`agent-host-suspension`」行「已落」陈标收正（同 #785 族收正形）。
3. **#803 ①∥② 直落**：`docs/core/design/MANIFEST.md:56` ∥ `docs/core/design/DOC-MIGRATION.md:414`；**③ 需求档**（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md:12`）= 主 agent 笔权（D1）——拟稿上抛（§2.6 U-1）。

**写面**：本档 §2 + 三档（ACTIVITY ∥ MANIFEST ∥ DOC-MIGRATION——落点+读回+变更记录 = §2.4）。
**禁面遵守**：产品码零触（#804/#815/#816 = 父侧）∥ 清账执行零动 ∥ #820 冻结面（MENU ∥ SETTINGS ∥ IPC ∥ SHELL + 其批档）零触 ∥ 需求档零写（拟稿 only）∥ 六件外零扩改。

### 2.2 #806 复核（届盘实读 · 2026-10-02 17:5x）

**① 读数对表**（本席亲跑 `node scripts/doc-check.mjs` · cwd = 仓根）：

| 面 | docwidth 收口读数（10-01 19:5x） | 本刻届盘 | 差因 |
|---|---|---|---|
| 锚·闸态悬空 | 119 | **431** | **+312 = 存量回闸**（非漏报亦非新债：陈标族翻正以「已落∕实读」形撤「拟新增」非闸标 ⇒ 相对引回闸）+ 各批新笔相对引——reorg 批**已自行披露**「届盘重读 426（CLI 434）」（`2026-10-02-doc-structure-reorg.md:349`）；设置菜单升级批实测 437（其批档 :165）⇒ 本刻 431（在飞浮动） |
| 宽·正文面 | 120 | **105**（中途瞬值 106 = 在飞他笔） | 区带豁免在效；同日各批读数 101→106 区间浮动 |
| 行数面 | 差异 7 | **差异 0**（比对 158 · 跳过 186〔预估 0 ∕ 非数 186〕） | **回填清讫** |

**② 在册「121/123」口径说明**：今日各批记录之「锚 121/123」= reorg 批 12:27 **冻结基线**（其记录 :349 自披露届盘重读 426）——**切分与执行以届盘复测为准**（相对判据；绝对读数随在飞写链漂移）。

**③ 117 锚逐项判**（docwidth §2.3 清单 × 届盘对读——逐项判据 = 现读列报？+ 承接实存？）：**116/117 处置维持有效 ∥ 1 条撤**：

- **92 条**现读仍逐字列报（R1 ∥ R2 承接连结盘上实存——执行轮逐处回读坐标）；
- **24 条**（`chat-digest(.seat)` ∥ `mount-head` 族——R3 裸名化）现读仍列报（形已随迁改，如 `views/chat-digest.mjs` ∥ 全路径形——处置维持）；
- **修正 1 条（#30）**：承接候选 `thincoder-core/agent/execute-tools.mjs` 实核**不存在** ⇒ **不采改指**、维持 R3 裸名化（「禁低置信改指」实证样例）；
- **撤 1 条（#101）**：`UI.md` 原 `slash-commands.mjs:130` 行届盘**零列报**（随重写消解）⇒ 撤（届盘复核确认；若系迁址则随址判定——同源 RENDER-CORE.md:238 之 #102 仍列报）；
- **承接实核**：携承接目标 **74 条**逐条盘上核——**73 在位 ∥ 1 MISS（#30）**；符号 8 ∥ 用例 3 ∥ 死名∕记录面 32 = **43 条无承接**（处置维持 R3–R5）。
- **记录面读解披露**：「记录面 ⇒ 留」本席读 = **语义逐字留、形退场**（仍须处理至不成锚，否则闸不归零）；如另有他读请裁。

**④ §4.1 回填复核（清单 → 届盘）**：行数面**差异 0**——原工单（§2.5「差异 3」四件回填 + 三裸数字行 + yml est 形）**全清**：四件（`context-menu.mjs` **60** ∥ `serve.mjs` **144** ∥ `host-shim.mjs` **42** ∥ `run.mjs` **191**——实读 2026-10-02 形在盘）∥ `electron-builder.yml` **42**（实读形）∥ `dom.mjs` **69**（加粗形）。
**形面残留 2 处**（`SHELL.md:175` host-floor **42** 裸值 ∥ `SESSIONS.md:124` session-actions **73** 裸值+实读日——值面 0 差异）：§2.5 ③ 目标形未落——登记不动（U-2）。「非数 186（§2.5 原记 = 3）」= 声明面 1⇒14 节后口径变化——非缺陷。

### 2.3 #806 切分方案（清账执行 = 另轮 · 逐轮 ≤15 档）

**切分原则**：① 按域切轮（同域同轮——跨档冲突面最小）；② 同档**锚+宽同轮**一次触碰（单档单写者窗——防两轮两笔）；③ 逐轮 ≤15 档（实列 7 ∥ 9 ∥ 12 ∥ 11 ∥ 3 ∥ 4）；④ 顺序 = 非桌面域（低冲突，即可开）→ render-core ∥ 桌面轻段 → 桌面重段（共写热点）→ 冻结面（#820 解冻后）。

**轮表**（档数 ∥ 锚 ∥ 宽 = 届盘计数；合计 46 档 · 431 锚 · 105 宽）：

| 轮 | 域 | 档（简名——全案见届盘读数） | 档数 | 锚 | 宽 | 时序门 |
|---|---|---|---|---|---|---|
| 1 | core/design 前段 | AGENT-LOOP-ASYNC-POOL ∥ AGENT-LOOP-SUBAGENT ∥ CORE-UNIFICATION ∥ DOC-CODE-RECONCILE ∥ DOC-MIGRATION ∥ ENGINEERING-MODE-V2 ∥ MANIFEST | 7 | 25 | 2 | 即可开 |
| 2 | core/design 后段 | MEMORY ∥ MULTI-INSTANCE-COLLAB ∥ PORTABILITY ∥ SESSION ∥ STRUCTURE-DEBT ∥ TESTING ∥ TOOLS ∥ VERIFY-REDESIGN ∥ CONSULTATION | 9 | 22 | 7 | 即可开 |
| 3 | core/requirements + cli + vsc | CONFIG ∥ MEMORY ∥ PROMPT-SYSTEM ∥ PROVIDER ∥ SESSION（req 五）∥ CRASH-REPORTS ∥ TUI ∥ TUI-SESSION-VIEW ∥ WEBVIEW-INPUT ∥ WEBVIEW-PROTOCOL ∥ WEBVIEW ∥ VSC-DEBT | 12 | 12 | 21 | 即可开 |
| 4 | render-core + 桌面轻段 | RENDER-CORE ∥ 桌面需求 ACTIVITY ∥ PROJECT ∥ UI ∥ 桌面设计 ACTIVITY ∥ CHAT ∥ COMPOSER ∥ E2E-TESTING ∥ PACKAGING ∥ SESSIONS ∥ WEB-QUICKCHECK | 11 | 106 | 16 | 桌面轻段随在飞静默 |
| 5 | 桌面重段 | 桌面设计 PROJECT ∥ RENDERER ∥ UI | 3 | 210 | 47 | 桌面在飞批全静默后单开 |
| 6 | 桌面冻结面 | IPC ∥ MENU ∥ SETTINGS ∥ SHELL | 4 | 56 | 12 | #820 解冻后 |

**域注**：轮 1∕2 = `docs/core/design/**`；轮 3 = `docs/core/requirements/**` + `docs/cli/design/**` + `docs/vsc/design/**`；轮 4 = `docs/render-core/design/**` + `docs/desktop/requirements/**` + `docs/desktop/design/**`（轻段）；轮 5∕6 = `docs/desktop/design/**`。

**逐轮判据**（单源 = docwidth §2.3 规则 R1–R5 + §2.4 折行规则 + §2.6 腿 3——本表不重述，只落轮级纪律）：

- 轮首 = `git status` 在飞复读 + `node scripts/doc-check.mjs` 届盘复测（基线 = 该轮首动作前——相对判据）；
- 锚面 = 逐条按 R1–R5 处置；**改指条件 = 行内语境可定 ∧ 目标盘上实存**；不满足 ⇒ 裸名化 ∥ 改述 ∥ 注记 ∥ 上抛——**禁低置信批量改指**；
- 宽面 = 逐行折行语义零改（折点 = 子句界 ∥ `——` ∥ `；`；坐标∥命令∥码段字面保原样）；区带内零清；
- 轮末 = 复跑（轮内零新增：悬空 ≤ 轮初 − 本轮销项 ∧ 区带外新增超宽 0）+ 逐档读回（D6）；
- 收口（全轮毕）= §2.6 腿 3：`OK(锚) 0 ∧ OK(行宽)` ∧ exit 0。

**顺序与并行披露**：1→2→3→4→5→6 串行；轮 4 内 render-core ∥ 桌面需求可先启；轮 5 = 桌面共写热点（docwidth §2.10 d 串行条——PROJECT∕RENDERER∕UI 为近日多批共写面）；轮 6 四项 + 其批档在 #820 冻结窗内——**解冻后开**。**排期 = 父侧裁**（本舱只出切分）。

### 2.4 #797 ∥ #803 直落（落点 + 读回 D6 + 变更记录）

| 条 | 落点 | 现 ⇒ 新 | 读回 |
|---|---|---|---|
| #797 | `docs/desktop/design/ACTIVITY.md:160`（§4.2 测试面行——迁自 `PROJECT.md` §4.2 逐字） | 「（已落——**232**（实读 2026-09-28）…」⇒「（**232**（实读 2026-09-28）…」（陈标随档失降形——实读数保留；同 #785 族形） | ✓ 在盘（编辑回执 L160；变更记录 = :423） |
| #803① | `docs/core/design/MANIFEST.md:56` | 「写默认五键档」⇒「**写默认八键档**」（现档 = `DEFAULT_MANIFEST` 默认八键——`manifest-schema.mjs:26-27` 实读；同 §3.2 T2 已落形） | ✓ 在盘（L56；变更记录 = :645） |
| #803② | `docs/core/design/DOC-MIGRATION.md:414`（§10.6 AC-7 行） | 「五键**零改**（D3…）」⇒「五键**零改**（**as-of 2026-09-18**；D3…）」（批代 as-of 语标记化——键数保留为批代值，不误读为现役计数） | ✓ 在盘（L414；变更记录 = :673） |

**本席写面复跑（落笔后 ∥ 含变更记录笔）**：悬空 **431 ⇒ 431**（Δ0——零新增）∥ 行宽 **105 ⇒ 105**（中途瞬值 106 = 在飞他笔）∥ 行数面 差异 0。**零产品码 ∥ 零需求档 ∥ 冻结面零触**。

### 2.5 关键决策

| # | 决策 | 被否 | 理由 |
|---|---|---|---|
| D-1 | 切分以**届盘读数**（431 ∥ 105）为基准 | 按 docwidth 在册值（121 ∥ 120 ∥ 44 面）预排 | 在册值 = 冻结基线（reorg 记录自披露届盘重读 426）；相对判据——每轮首动作复测 |
| D-2 | 同档锚+宽**同轮**一次触碰 | 按面分轮（锚轮 ∥ 宽轮两列） | 单档单写者窗（防两轮两笔丢改）；少一轮回读 |
| D-3 | 记录面 = **语义留 ∥ 形退场**（R3 裸名化） | 记录面零动作 | 闸目标 = 0——零动作不可达；R3 保语义逐字（§2.3 既有规则） |
| D-4 | #803③ 需求档**不落笔**（拟稿上抛） | 随本舱直落 | D1 笔权矩阵 + 同族先例（「需求档笔权 = 主 agent——未触」）；dispatch「直落」不越笔权 |
| D-5 | 三档改笔各携**变更记录一行** | 只改正文不落记录行 | 本仓既有纪律（「各档变更记录同拍」为常设验收项） |

### 2.6 上抛 ∥ 披露

- **U-1（需求档拟稿——#803③ · 请主 agent 落笔或另派）**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md:12` 现文「扫描域（`scanDirs`）/ 行宽阈值（`lineWidth`）/ 锚域（`anchors.domain`）/ 豁免（`exemptions` / `anchors.exclude`）全读 `checkConfig`」；
  拟文「扫描域（`scanDirs`）/ 行宽阈值（`lineWidth`）/ **宽面豁免区带（`widthExemptZones`）** / 锚域（`anchors.domain`）/ 豁免（`exemptions` / `anchors.exclude`）/ **行数面声明（`lineCounts`）** 全读 `checkConfig`」（补 #546 起未收两项——与判据项 7 同拍；`:38` AC-M8-6 自洽不动）。
- **U-2（形面残留 2 处 · 请裁）**：`SHELL.md:175`（`host-floor.mjs` **42** 裸值）∥ `SESSIONS.md:124`（`session-actions.mjs` **73** 裸值+实读日）——§2.5 ③ 目标形（`**<实读>**（实读 <日>）`）未落；值面 0 差异。SHELL.md 在 #820 冻结面内 ⇒ 未触（随轮 6 轻笔 ∥ 另裁）。
- **U-3（排期）**：轮 5 ∥ 轮 6 时序门（桌面在飞批静默 ∥ #820 解冻）——请父侧排期；届盘在飞清单以轮首 `git status` 为准。
- **披露**：① 本档 §1 仍为模板占位——本席依据 = spawn 任务书（§1 由主 agent 后补）；② 「121/123」口径差 = §2.2 ②（非本席写面，已记录在案）；③ #804 ∥ #815 ∥ #816 零触；④ 本舱零产品码写。

### 2.7 执行轮 1 记录（#806 · core/design 前段 7 档 · 2026-10-02 · eng-designer）

**口径**：轮级单写者窗；形式零语义改（R1/R2 改指 ∥ R3 裸名化 ∥ R5 注记 ∥ 折行——语义逐字保留）；区带内零清（锚面照处置、宽面零动）；变更记录各档同拍（7/7）。**轮首复测**（doc-check 亲跑）：全仓悬空 **432** · 行宽 **107**；本 7 档 = **25 锚 + 2 宽**（与 §2.3 轮表届盘计数一致）。

**逐档处置**：

| 档 | 锚（处置） | 宽 | 读回 |
|---|---|---|---|
| AGENT-LOOP-ASYNC-POOL.md | 8/8 R1 补前缀（`thincoder-desktop/` ×7 ∥ `thincoder-cli/src/tui/` ×1——L604 ∥ L774 ∥ L786-787 ∥ L853 原位） | 76 ∥ 326 折行（⇒76-78 ∥ 328-329） | ✓ |
| AGENT-LOOP-SUBAGENT.md | 2/2 R5 注记（`batchSegmentTool` 退场登记——L698 ∥ L728） | — | ✓ |
| CORE-UNIFICATION.md | 5/5：R2 改指 4（`batch.mjs:55` ∥ `:55,59`+直写点 `:217` ∥ `batch.mjs` ×2——L1325 ∥ L1361 ∥ L1406）∥ R3 裸名化 1（L816） | — | ✓ |
| DOC-CODE-RECONCILE.md | 2/2 R1（L275 ∥ L352；S5 行坐标回读收正 `:45 ⇒ :46`） | 折行 1（L352 改指后越线——同轮折 ⇒352-353 自销） | ✓ |
| DOC-MIGRATION.md | 1/1 R1（L38） | — | ✓ |
| ENGINEERING-MODE-V2.md | 3/3 R3（L67 ∥ L81 去坐标尾 ∥ L92） | — | ✓ |
| MANIFEST.md | 4/4 R2 改指（`thincoder-core/agent-tools/batch-paths.mjs`——L280 ∥ L284 ∥ L397 ∥ L446；承名按届盘实核 = `batch-paths.mjs`〔`batch.mjs` = re-export 壳；`resolveBatchDocPath` 现 `:105-114`；docRoot.batches 读点 `:34`〕） | — | ✓ |

**轮末复跑**：全仓悬空 **432 ⇒ 408**（本 7 档悬空行 **0**——销项 **25/25**；Δ −24 = 25 − 1〔他档在飞 +1〕）∥ 行宽 **107 ⇒ 105**（本 7 档超宽行 **0**——销项 2/2；含一处改指越线同轮自销〔`DOC-CODE-RECONCILE.md:352` 折行〕——**区带外新增超宽 0**）。行数面 = 报告态（不动）。

**披露**：① MANIFEST 四处承名落点按届盘实核取 `batch-paths.mjs`（disposition 记 `batch.mjs`——实读该档头自陈「实现住 `batch-paths.mjs`，本档 re-export」）；② S5 行坐标 `:45 ⇒ :46`（回读实核——现 `:46` = `/submodel` 五类清单行）；③ 本轮零产品码 ∥ 零需求档 ∥ 六件外零触。

### 2.8 执行轮 2 记录（#806 · core/design 后段 9 档 · 2026-10-02 · eng-designer）

**口径**：轮级单写者窗；形式零语义改（R1/R2 改指 ∥ R3 裸名化 ∥ R4 形退场 ∥ 折行——语义逐字保留）；区带内零清（锚面照处置、宽面零动）；变更记录各档同拍（9/9）。**轮首复测**（doc-check 亲跑）：全仓悬空 **408** · 行宽 **105**；本 9 档 = **22 锚 + 7 宽**（与 §2.3 轮表届盘计数一致）。

**逐档处置**：

| 档 | 锚（处置） | 宽 | 读回 |
|---|---|---|---|
| MEMORY.md | 9/9 R1 改指（`thincoder-vscode/src/memory-tool.mjs` ×2——§1 表 ∥ §2.2 #134；§6.14 B 表核面坐标 ×6——`thincoder-core/agent/setup.mjs` ×3 ∥ `thincoder-core/memory/core.mjs` ×2 ∥ `thincoder-core/tools/repomap.mjs:119`；新档行 `index-status.mjs:56` ⇒ `thincoder-desktop/src/main/index-status.mjs:56`） | 488 ∥ 550 ∥ 565 折行（⇒ 488-490 ∥ 552-554 ∥ 569-570） | ✓ |
| MULTI-INSTANCE-COLLAB.md | 4/4：R1 改指 3（`session-slots.mjs:48` ⇒ `thincoder-core/session-slots.mjs:48`——§3.1 ∥ §7 ∥ 变更记录）∥ R3 裸名化 1（`execute-tools.mjs`——§2.2 ③ 裁「不采改指」兑现） | 56 折行（⇒ 56-57） | ✓ |
| PORTABILITY.md | 1/1 R4 形退场（死名 `tool-gates.mjs` 去坐标尾） | — | ✓ |
| SESSION.md | 1/1 R2 改指（`session-control.mjs:58-59`——左列裁撤后行元数据族现体；坐标随读） | 970 ∥ 1000 折行（⇒ 970-971 ∥ 1001-1002） | ✓ |
| STRUCTURE-DEBT.md | 1/1 R1 改指（`thincoder-core/memory/core.mjs`） | — | ✓ |
| TESTING.md | 1/1 R3 裸名化（`E2E-HARNESS.md`） | — | ✓ |
| TOOLS.md | 4/4：R3 裸名化 2（融合表行 `batch-segment.mjs`——旧树形两处）∥ R4 形退场 2（`tool-gates.mjs` ∥ `execute-tools.mjs`——端档已删） | — | ✓ |
| VERIFY-REDESIGN.md | 1/1 R1 改指（`thincoder-core/agent-tools/goal.mjs`） | — | ✓ |
| CONSULTATION.md | — | 132 折行（⇒ 132-133） | ✓ |

**轮末复跑**：全仓悬空 **408 ⇒ 386**（本 9 档悬空行 **0**——销项 **22/22**；Δ −22 = 销项全清、净零新增；中途一过性 +12〔解封窄符号 ×9 + 变更记录行自指旧形 ×3〕已随修复零）∥ 行宽 **105 ⇒ 98**（本 9 档超宽行 **0**——销项 7/7；**区带外新增超宽 0**）。行数面 = 报告态：差异 **8**（轮初 7）——8 行全落桌面域在飞（UI ∥ SHELL ∥ SETTINGS ∥ CHAT 四档声明面对盘；本 9 档零参与）。

**披露**：
① MEMORY 两处 `src/memory-tool.mjs`（docwidth 记「R1∕R3」二择）：行内语境（VSC 栏 ∥ 对位右端）定指端壳 + 目标盘上实存（74 行 · W8 归一后现态）⇒ 择 **R1 补 `thincoder-vscode/` 前缀**；核面现体 `thincoder-core/memory/memory-tool.mjs`（2026-10-01 拆出）为另一候选——未取（仅 VSC 栏改指端壳，不改指核面）。
② SESSION 行元数据族承接实核：`views/sessions.mjs` 已随「会话模型轮 R13 · 左列裁撤」删除（2026-09-29 波次收口提交 `9ac540dd`）；族门现体 = `session-control.mjs:58-59`（`msgs` ∥ `updated` 两 `Number.isFinite` 门）⇒ R2 改指 + 坐标随读；「左列」为该族在册术语（源码注 ∥ i18n 注沿称），保留。
③ `tool-gates.mjs` ∥ `execute-tools.mjs` 端档 = **已删**（主循环归核随动——`thincoder-vscode/AGENTS.md` 在册辞；仓内无同名承接档）⇒ 死名行按 R4 形退场（无改述造字、无低置信改指）。
④ 修中披露（复跑捕出、随修归零）：§7「感知面 L1/L2」行改指后**解封** 9 枚窄符号误宿主——该行唯一坐标路径成为可解析「宿主」即入闸 ⇒ 转口坐标改独立段（`thincoder-core/session-slots.mjs` `:48`）消宿主条件（零语义）；另三处变更记录行初稿引旧形自指 ⇒ 改裸名指称（同轮 1 先例形）。
⑤ 宽面折点 = 子句界 ∥ `；` ∥ `——`（码段 ∥ 坐标 ∥ 命令字面保原样）；区带内（变更记录）零折。
⑥ 本轮零产品码 ∥ 零需求档 ∥ 冻结面零触 ∥ 六件外零触——写面 = 9 档 + 本批档 §2。

### 2.9 执行轮 3 记录（#806 · core/requirements + cli + vsc 12 档 · 2026-10-02 · eng-designer）

**口径**：轮级单写者窗；形式零语义改（R1 改指 ∥ R3 裸名化 ∥ R5 注记 ∥ 折行——语义逐字保留）；区带内零清（锚面照处置、宽面零动）；变更记录各档同拍（12/12）。**轮首复测**（doc-check 亲跑）：全仓悬空 **82** · 行宽 **98**；本 12 档 = **12 锚 + 21 宽**（与 §2.3 轮表届盘计数一致）。

**逐档处置**：

| 档 | 锚（处置） | 宽 | 读回 |
|---|---|---|---|
| CONFIG.md（req） | — | 24 折行（⇒24-25） | ✓ |
| MEMORY.md（req） | — | 213 ∥ 215 折行（⇒213-214 ∥ 216-218） | ✓ |
| PROMPT-SYSTEM.md（req） | — | 92 续折（⇒92-93——seam 归「> 」形） | ✓ |
| PROVIDER.md（req） | — | 132 折行（⇒132-133） | ✓ |
| SESSION.md（req） | — | 140 ∥ 159 折行（⇒140-141 ∥ 160-161） | ✓ |
| CRASH-REPORTS.md | 1/1 R1 改指（`heap-watch.mjs` 补 `thincoder-cli/` 前缀——L197） | — | ✓ |
| TUI.md | 1/1 R5 注记（`T-XL2` 退场登记——L602） | 538 ∥ 539 折行（⇒538-539 ∥ 540-543） | ✓ |
| TUI-SESSION-VIEW.md | — | 187 ∥ 194 折行（⇒187-189 ∥ 196-197） | ✓ |
| WEBVIEW-INPUT.md | 1/1 R3 裸名化（记录行两处短形引用去目录段——L253） | — | ✓ |
| WEBVIEW-PROTOCOL.md | 2/2 R1 改指（`suspension.mjs` 补 `thincoder-vscode/src/extension/` 前缀——L536 ×2） | — | ✓ |
| WEBVIEW.md | 7/7：R1 改指 4（`suspension.mjs` 补前缀——L467 ∥ L781 ∥ L782 ∥ L783）∥ R3 裸名化 1（`test/helpers/webview-env.mjs` ⇒ `webview-env.mjs`——L620）∥ R5 注记 1（`T-G1` ∕ `T-G8` 退场登记——L459） | 9 行折行（132 ∥ 190 ∥ 219 ∥ 225 ∥ 226 ∥ 418 ∥ 424 ∥ 468 ∥ 471——⇒ 各 2–3 行；末态 431-433 ∥ 476-480 含二次收正） | ✓ |
| VSC-DEBT.md | — | 72 折行（⇒72-73） | ✓ |

**轮末复跑**：全仓悬空 **82 ⇒ 70**（本 12 档悬空行 **0**——销项 **12/12**；Δ −12 = 销项全清、净零新增）∥ 行宽 **98 ⇒ 77**（本 12 档超宽行 **0**——销项 **21/21**；**区带外新增超宽 0**）。行数面 = 报告态：差异 **8**（在飞桌面域——非本批；8 条全落 UI ∥ SHELL ∥ SETTINGS ∥ CHAT 四档声明面对盘）。

**中途捕获 ∥ 随修归零**（两处，本席自查捕出并当轮收正）：① 变更记录行初稿引用例号 token（`T-XL2` ∥ `T-G1` ∕ `T-G8`）而无注记词 ⇒ 将新添悬空 3 枚——收正为引注记词本体（「机检豁免——用例退场登记」）；② 折后残段两处仍越线（WEBVIEW.md `:431` **311** 字符 ∥ `:478` **316** 字符）⇒ 二次折行收正。**均零语义**。

**披露**：
① WEBVIEW-INPUT:253（记录行引旧短形自指「两处短形路径锚（…）收正为前缀全限定」）：改指与行义相抵（被收正对象本身写成全限定形 ⇒ 语病）⇒ 按记录面行采 **R3 裸名化**（`panel.mjs` ∕ `atmenu.mjs`——同形并落）；近条先例 = 变更记录行引旧形自指 ⇒ 裸名指称（轮 2）。
② WEBVIEW:620 `test/helpers/webview-env.mjs`：实核 n=0（仓内 glob 零命中）；退役实据 = git `a3754db4`（full test reset——retire all legacy suites）⇒ R3 裸名化。**邻列余二件**（`prompts-async-guidance.test.mjs` ∥ `session-boot.test.mjs`）实核同不在盘——`.test.mjs` 双扩展段 token 不入锚面（检查器视作模式串）故未列报亦不入闸——**登记为观察项**（`requirements/SESSION.md:162` 用例面行同族引用同况）。
③ PROMPT-SYSTEM:92 续折：seam 归「> 」形（与块内他续行同式）；L91（含 T-CL1 + 注记词）零动。
④ WEBVIEW 变更记录三行（781/782/783）＝旧⇒新坐标对；R1 补前缀落于旧值（承接实存 × 行内语境可定）——语义零改。
⑤ 宽面折点 = 子句界 ∥ `；` ∥ `——`（码段 ∥ 坐标 ∥ 命令字面保原样）；区带内（变更记录）零折；区带内锚面 6 处（CRASH L197 ∥ WEBVIEW-INPUT L253 ∥ WEBVIEW-PROTOCOL L536 ∥ WEBVIEW L781-783）照 R1/R3 处置。
⑥ 本轮零产品码 ∥ 需求档仅形面（折行）零语义改 ∥ `PROJECT-MANIFEST.json` 零触 ∥ 冻结面（#820 四档 + 其批档）零触 ∥ 12 档外零触——写面 = 12 档 + 本批档 §2。

### 2.10 执行轮 4 记录（#806 · render-core + 桌面轻段 11 档 · 2026-10-02 · eng-designer）

**口径**：轮级单写者窗；形式零语义改（R1 改指 ∥ R3 裸名化 ∥ 折行——语义逐字保留）；区带内零清（锚面照处置、宽面零动）；变更记录各档同拍（5/5——被改动档）。**轮首复测**（doc-check 亲跑）：全仓悬空 **70** · 行宽 **75** · 行数面差异 **0**；本 11 档 = **18 锚 + 16 宽**（届盘实测——「106 锚」系旧引擎口径〔dist 树虚高未除〕，缩水属预期——§1 已披露）。

**逐档处置**：

| 档 | 锚（处置） | 宽 | 读回 |
|---|---|---|---|
| RENDER-CORE.md | 6/6 R1 改指（`slash-commands.mjs:130` ⇒ `thincoder-cli/src/tui/slash-commands.mjs:130` ∥ `flow/block.mjs` ⇒ `thincoder-render-core/flow/block.mjs` ×2〔§6 ∥ 变更记录〕∥ `renderer/slash-commands.mjs` ⇒ `thincoder-desktop/renderer/slash-commands.mjs` ∥ `chat.css:404-413` ⇒ `thincoder-vscode/webview/chat.css:404-413` ∥ `composer/panel.mjs` ⇒ `thincoder-render-core/composer/panel.mjs`〔变更记录〕） | 15 行折行（209 ∥ 218 ∥ 235 ∥ 236 ∥ 237 ∥ 238 ∥ 306 ∥ 321 ∥ 363 ∥ 379 ∥ 380 ∥ 386 ∥ 389 ∥ 432 ∥ 443——⇒ 各行 2–4 段） | ✓ |
| ACTIVITY.md（req） | — | — | 零动作（轮初 0/0） |
| PROJECT.md（req） | — | 104 折行（⇒104-105） | ✓ |
| UI.md（req） | — | — | 零动作 |
| ACTIVITY.md（design） | 8/8 R3 裸名化（`chat-digest.mjs` ×5 ∥ `chat-digest-seat.mjs` ×3——行数账记录行去目录段；两档已删 ∕ 改名 `chat-digest-rows.mjs`） | — | ✓ |
| CHAT.md | 1/1 R3 裸名化（`chrome-denoise.css`——未落预案去目录段） | — | ✓ |
| COMPOSER.md | — | — | 零动作 |
| E2E-TESTING.md | — | — | 零动作（:285 迁移期引文列报——非闸，沿例不动） |
| PACKAGING.md | 3/3（R1 1——`renderer/index.html` ⇒ `thincoder-desktop/renderer/index.html`；R3 2——`fileMatcher.js` ∥ `electronGet.js`——域外第三方档坐标去目录段） | — | ✓ |
| SESSIONS.md | — | — | 零动作 |
| WEB-QUICKCHECK.md | — | — | 零动作 |

**轮末复跑**：全仓悬空 **70 ⇒ 52**（本 11 档悬空行 **0**——销项 **18/18**；Δ −18 = 销项全清、净零新增）∥ 行宽 **75 ⇒ 59**（宽销项 **16/16**；**区带外新增超宽 0**）∥ 行数面 差异 **0**。

**披露**：
① 折点 = 子句界 ∥ `——` ∥ `；`（语义零改；列举段一处借 `·` 界——RENDER-CORE §6 逐档行数账段，沿库内折痕先例形〔TUI.md:225 ∥ CORE-UNIFICATION.md:1851 同式〕）；续行缩进 = 2 空格（与轮 1–3 及库内折痕样本同式）；区带内（变更记录）锚面照处置（RENDER-CORE 2 处——`flow/block.mjs` ∥ `composer/panel.mjs`）、宽面零折。
② `fileMatcher.js` ∥ `electronGet.js` 两处 = 域外坐标（electron-builder 依赖包 `app-builder-lib` 内部档实读）——无仓内承接、不可补前缀 ⇒ R3 裸名化（保留文件名；包名与「实读」语境在行内）；同 token 另两处（§1 表 KD-64 行 ∥ 依赖镜像纪律行）因 executable-line 豁免未被报 ⇒ 未触（他行零触）。
③ 两处列报·不入闸保持：`E2E-TESTING.md:285`（迁移期引文）∥ `RENDER-CORE.md`「`core-reasoning.css`」（拟新增）——非闸态销项，沿例不动。
④ 一处行切割误（req PROJECT 记录行首插致上一行尾段错串）——**读回即捕获并当轮收正**（D6 生效）；终态复核 ✓。
⑤ 变更记录同拍 **5/5**（RENDER-CORE ∥ req PROJECT ∥ design ACTIVITY ∥ CHAT ∥ PACKAGING）；余 6 档零动作（无记录行）。
⑥ 本轮零产品码 ∥ 需求档仅形面（折行 + 记录行）零语义改 ∥ `PROJECT-MANIFEST.json` 零触 ∥ 冻结面（#820 四档 + 其批档）零触 ∥ 11 档外零触——写面 = 5 档 + 本批档 §2。

### 2.11 执行轮 5 记录（#806 · 桌面重段 3 档 · 2026-10-02 · eng-designer）

**口径**：轮级单写者窗；形式零语义改（R1 改指 ∥ R3 裸名化 ∥ 折行——语义逐字保留）；区带内零清（锚面照处置、宽面零动）；变更记录同拍（3/3——全档被改动）。**轮首复测**（doc-check 亲跑）：全仓悬空 **52** · 行宽 **59** · 行数面差异 **0**；本 3 档 = **32 锚 + 46 宽**（PROJECT 25+17 ∥ RENDERER 5+22 ∥ UI 2+7）。

**逐档处置**：

| 档 | 锚（处置） | 宽 | 读回 |
|---|---|---|---|
| PROJECT.md | 25/25（R1 13——`thincoder-desktop/` 前缀 ×11 ∥ `thincoder-render-core/` ×1 ∥ `thincoder-cli/src/tui/` ×1；R3 12——`chat-digest.mjs` ×9 ∥ `chat-digest-seat.mjs` ×2 ∥ `mount-head.mjs` ×1——已删 ∕ 改名档去目录段） | 18 行折行（17 销项 + `:445` 改指越线同轮折——182 ∥ 370 ∥ 372 ∥ 390 ∥ 396 ∥ 397 ∥ 443 ∥ 445 ∥ 446 ∥ 449 ∥ 450 ∥ 453 ∥ 930 ∥ 1043 ∥ 1046 ∥ 1047 ∥ 1048 ∥ 1067） | ✓ |
| RENDERER.md | 5/5 R1 改指（`thincoder-vscode/src/extension/suspension.mjs:132-135` ∥ `thincoder-desktop/src/main/turn-face.mjs:122 ⇒ :134-135` ∥ `thincoder-cli/src/tui/suspension-drive.mjs:173 ⇒ :182` ∥ 同档 `:182 ⇒ :212` ∥ `docs/cli/design/TUI.md:901`） | 22 行折行（36 ∥ 45 ∥ 46 ∥ 49 ∥ 50 ∥ 51 ∥ 70 ∥ 72 ∥ 76 ∥ 77 ∥ 80 ∥ 82 ∥ 90 ∥ 91 ∥ 94 ∥ 96 ∥ 97 ∥ 100 ∥ 111 ∥ 176 ∥ 219 ∥ 220） | ✓ |
| UI.md | 2/2（R3 1——`mount-head.mjs` 已删档去目录段；R1 1——`thincoder-desktop/test/files.mjs` 补前缀） | 7 行折行（57 ∥ 66 ∥ 174 ∥ 276 ∥ 296 ∥ 371 ∥ 372） | ✓ |

**轮末复跑**：全仓悬空 **52 ⇒ 20**（本 3 档悬空行 **0**——销项 **32/32**；Δ −32 = 销项全清、净零新增）∥ 行宽 **59 ⇒ 13**（宽销项 **46/46**；**区带外新增超宽 0**——见披露②）∥ 行数面 差异 **0**。

**披露**：
① 折点 = 子句界 ∥ `；` ∥ `——` ∥ `·`（码段 ∥ 坐标 ∥ 词键字面保原样）；续行缩进 = 2 空格（沿轮 1–4 及库内折痕样本同式）；区带内（变更记录）锚面照处置（RENDERER 3 处——`turn-face.mjs:122 ⇒ :134-135` ∥ `suspension-drive.mjs:173 ⇒ :182` ∥ `suspension-drive.mjs:182 ⇒ :212`+`TUI.md:901`；PROJECT 2 处——`i18n.mjs` 行值 ∥ `suspension-drive.mjs:173 ⇒ :182`）、宽面零折。
② 区带外新增超宽 0 之口径：PROJECT `:445` 因 R1 改指（+19 字符）越过 300 ⇒ **同轮折行**（改指越线同轮折——先例在册）；折后全仓余 13 行均落他档（`MCP.md` 1 ∥ `IPC.md` 7 ∥ `MENU.md` 2 ∥ `SETTINGS.md` 3——非本轮写面）。
③ 余 20 悬空亦落他档（`IPC.md` 8 ∥ `MENU.md` 1 ∥ `SETTINGS.md` 9 ∥ `SHELL.md` 2——非本轮写面，后续轮次处置）；PROJECT 拟新增列报项（不入闸）保持不动。
④ 承接实核：R1/R3 定向以届盘实核为准——`chat-digest.mjs` ∥ `chat-digest-seat.mjs` ∥ `mount-head.mjs` 均已删 ∕ 改名（R3 裸名化）；承接件皆在盘（轮末复跑零新增悬空为证）。
⑤ 符号解封陷阱一处（PROJECT `:1584`——行含定义谓词 ⇒ 拆分点落于「——详见」前，使谓词不与 host 同段）——防拆行触发行内标识符入闸；`chat-digest.mjs` ∥ `chat-digest-seat.mjs`（RENDERER `:394` 等）同步去目录段。
⑥ 变更记录同拍 **3/3**；逐档读回（D6）全过。**本轮零产品码 ∥ 需求档零触**（3 档皆设计面档）∥ `PROJECT-MANIFEST.json` 零触 ∥ 冻结面（#820 四档 + 其批档）零触 ∥ 3 档外零触——写面 = 3 档 + 本批档 §2。

### 2.12 执行轮 6 记录（#806 · 冻结面 4 档 + `docs/core/design/MCP.md` 余 1 宽 · 2026-10-02 · eng-designer）

**口径**：轮级单写者窗；**时序门核 = #820 已闭讫（解冻）✓**；形式零语义改（R1 改指 ∥ R3 裸名化 ∥ R4 改述破要素 ∥ 折行——语义逐字保留）；区带内零清（锚面照处置、宽面零动）；变更记录同拍（**5/5**——全档被改动）。**轮首复测**（doc-check 亲跑）：全仓悬空 **20** · 行宽 **13** · 行数面差异 **0**；本 5 档 = **20 锚 + 13 宽**（与 §2.3 轮表届盘计数一致）。

**逐档处置**：

| 档 | 锚（处置） | 宽 | 读回 |
|---|---|---|---|
| IPC.md | **8/8**：R4 破要素 6（§1 `ev:ledger` 行窄符号误锚——「核族扫描导出」⇒「核族扫描产出」）∥ R1 2（`settings.mjs:18` ⇒ `thincoder-vscode/src/extension/settings.mjs:18` ∥ `turn-face.mjs:122` ⇒ `thincoder-desktop/src/main/turn-face.mjs:122`） | 7 行折行（75 ∥ 97 ∥ 101 ∥ 151 ∥ 231 ∥ 323 ∥ 324——各 2 段） | ✓ |
| MENU.md | **1/1** R1（`renderer/search.mjs` ⇒ `thincoder-desktop/renderer/search.mjs`——§3.2 零触面行） | 2 行折行（21——2 段；104——3 段） | ✓ |
| SETTINGS.md | **9/9** R1（`settings.mjs:380-408` ⇒ `thincoder-vscode/src/extension/settings.mjs:380-408`——§1 KD-44 行；`agent-tools/settings.mjs` ×2（含 `:20`）⇒ `thincoder-core/agent-tools/settings.mjs`；`renderer/index.html` ∥ `renderer/i18n.mjs` ⇒ `thincoder-desktop/renderer/…`；`src/extension/settings.mjs` ⇒ `thincoder-vscode/src/extension/settings.mjs`；`src/main/settings.mjs` ⇒ `thincoder-desktop/src/main/settings.mjs`；`views/settings.mjs` ⇒ `thincoder-desktop/renderer/views/settings.mjs`——后七处落 §3.2 批块表） | 3 行折行（123——2 段；290——3 段；322——3 段） | ✓ |
| SHELL.md | **2/2** R3 裸名化（`renderer/views/chat-digest.mjs` ⇒ `chat-digest.mjs`——§5.2 记录行；`thincoder-desktop/renderer/mount-head.mjs` ⇒ `mount-head.mjs`——变更记录行；两档已删 ∕ 改名） | — | ✓ |
| MCP.md | —（锚面零销项；§2.2 迁移期引文列报不动） | 1 行折行（85——3 段） | ✓ |

**轮末复跑**：`node scripts/doc-check.mjs`（cwd = 仓根——实跑 exit **0**）⇒ **`OK(锚): 0 条悬空（闸态——阈值 0）` ∧ `OK(行宽): 源域全部 .md 无 >300 字符单行`**——**全库归零**（§2.6 腿 3 达成）；汇总 = 候选 44805 · 悬空 **0** · 注记豁免 319 · 拟新增 45 · 迁移期引文 297；行数面差异 **0** 条（比对 160 · 跳过 184——报告态）。**区带外新增超宽 0**（折后全库零超宽——超判据达成）。

**披露**：

① 折点 = 子句界 ∥ `；` ∥ `——` ∥ `·`（码段 ∥ 坐标 ∥ 命令字面保原样）；续行缩进 = 2 空格（沿轮 1–5 及库内折痕样本同式）；区带内（变更记录）锚面照处置（IPC 1 处——`turn-face.mjs:122 ⇒ :134-135` 照 R1；SHELL 1 处——`mount-head.mjs` 照 R3）、宽面零折。
② `ev:ledger` 行窄符号误锚六枚（`ev` ∥ `key` ∥ `detailLines`×3 ∥ `data`）：行内三要素 = 谓词「导出」+ 唯一宿主坐标 + 反引号标识符 ⇒ 按 R4「改述破要素」处置——「核族扫描导出」⇒「核族扫描产出」（dry-run 实核：改后该行符号候选 **0**，行内无其余谓词）；语义零改。
③ SETTINGS 九处承接按届盘实核：`thincoder-vscode/src/extension/settings.mjs`（`:18` = `import { MASKED } …` 实证）∥ `thincoder-core/agent-tools/settings.mjs` ∥ `thincoder-desktop/renderer/{index.html,i18n.mjs,views/settings.mjs}` ∥ `thincoder-desktop/src/main/settings.mjs`——盘上皆实存；邻位未列报短形（`settings-values.mjs:15` ∥ `renderer/theme.mjs` ∥ `renderer/skin.css` 等唯一 basename 通过项）零触（「只改列报件」判读——列报 token 同行出现者全量处置）。
④ 承接坐标 as-of 漂移两处（**登记观察项**——按 R1「坐标尾保留」未随读，形态零改）：`thincoder-vscode/src/extension/settings.mjs:380-408`（现档 **371** 行 ∥ `fullStatus` 现 `:341`——实读）；`thincoder-core/agent-tools/settings.mjs:20`（`MASKED` 现 **`:26`**——`export const MASKED` 实读）。是否随读收正请父侧裁。
⑤ SHELL 两处 R3 = 删档名裸名化：`chat-digest.mjs`（结构分裂批产物——后删 ∕ 改名 `chat-digest-rows.mjs`）∥ `mount-head.mjs`（撤会话头批删档）——语义逐字留（名称 ∥ 行数账值在文），形退场（不成锚）。
⑥ 各档变更记录 1 行同拍（**5/5**）——行内引旧形自指处按短语 ∥ 裸名指称（不成锚）；台账 #806。
⑦ 本轮**零产品码** ∥ **零需求档** ∥ `PROJECT-MANIFEST.json` 零触 ∥ 本 5 档外零触——写面 = 5 档 + 本批档 §2。**全库清账终轮至此达成**（§2.6 腿 3 全绿）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象（按声明）**：文档清账轮（#806 主 ∥ #797 ∥ #803）——设计定形：#806 复核 + 六轮切分方案（逐轮 ≤15 档 ∥ 时序门）∥ #797/#803 直落 ∥ U-1 需求笔（widthExemptZones ∥ lineCounts）∥ U-2 两处形/值收正（SHELL 42 ∥ SESSIONS 73⇒79）。
**评审域**：七档（`docs/desktop/design/ACTIVITY.md` ∥ `docs/core/design/MANIFEST.md` ∥ `docs/core/design/DOC-MIGRATION.md` ∥ `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md` ∥ `docs/desktop/design/SHELL.md` ∥ `docs/desktop/design/SESSIONS.md` ∥ `docs/batches/2026-10-01-docwidth-settlement.md`）。域限：无项目标准档、无 document map（文档所有权判据降级）；纯 `.md` 面 ⇒ 受影响文件尺寸标注判据不适用。
**已核落地（逐处读回相符）**：#797 = `ACTIVITY.md:177` 行「**已落**——」陈标已去（`:440` 变更记录行在册）∥ #803① = `MANIFEST.md:56`「写默认八键档」（`:645` 记录行）∥ #803② = `DOC-MIGRATION.md:414` AC-7 补 as-of 标记（`:673` 记录行）∥ U-1 = `ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md:12` 判据面枚举含 `widthExemptZones` ∥ `lineCounts` ∥ U-2 = `SHELL.md:175`（host-floor **42**（实读 2026-10-02）形收正）∥ `SESSIONS.md:124`（session-actions **79**——前读 73）。
**未及核（评审域外）**：#806 复核结果与六轮切分方案（承载档不在评审域）；行数面两值对盘（源档不在域）。
**域内实读补充**：`MANIFEST.md:53` ∥ `:97` = `checkConfig` **六键**；`MANIFEST.md:651` = `lineCounts` 落地「四键 ⇒ 五键」（2026-09-29）；`2026-10-01-docwidth-settlement.md:57` ∥ `:361` = `CRITERIA_KEYS` 6 ⇒ 7 ∥ 真跑「判据项 7 项」；`:398` = AC-M8-6「计数一致——自洽：判据项 7 = 键 6 + `anchors` 拆分 1」；`:536` = #806 清账清单指针（117 锚 ∥ 120 行 ∥ 工单 7 条）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | Methodology · 记录面 | 🟡 | U-2 两处收正只落表内，两档自身缺记录面留痕：`SHELL.md:327` ∥ `SESSIONS.md:218` 变更记录末行均属他批（设置菜单组项收窄批 ∥ 波 3 终扫轮），无「文档清账批 · 直落轮」行——同轮另三档皆有（`ACTIVITY.md:440` ∥ `MANIFEST.md:645` ∥ `DOC-MIGRATION.md:673`）。被改点 = `SHELL.md:175`（host-floor.mjs **42**（实读 2026-10-02））∥ `SESSIONS.md:124`（session-actions.mjs **79**——前读 73〔实读 2026-09-28〕）。 | 在两档变更记录各补一行同轮句式（「文档清账批 · 直落轮」体），使值 ∕ 形变更可追；或明记「本类收正不入变更记录」的单一口径。 |
| 2 | Acceptance criteria · 需求面 | 🟡 | U-1 落地后同一档两处计数不同源可判：`ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md:12` 判据面枚举 = **7 项**（含新增 `widthExemptZones` ∥ `lineCounts`）；`:38` AC-M8-6 仍写「判据项计数与 `checkConfig` 键一致（D3）」——现役 `checkConfig` 键 = **6**（`MANIFEST.md:53` ∥ `:97`），工具侧判据项 = **7**（`2026-10-01-docwidth-settlement.md:57` ∥ `:361`）；算式（7 = 6 + `anchors` 拆分 1）只落在批档记录面（`2026-10-01-docwidth-settlement.md:398`）⇒ 需求档内「计数比对」不可执行。存量行（非本轮引入）——因 U-1 正落同一枚举面而点名。 | 在 AC-M8-6 行（或 ② 功能点 2 末）写死算式「判据项 = `checkConfig` 键数 + `anchors` 拆分 1」，使「计数比对」有唯一读法。 |
| 3 | Requirements coverage · 单源（协调项） | 🟡 | #806 清账工作单在评审域内的唯一材料 = 冻结批档（`2026-10-01-docwidth-settlement.md:536`「正文清账 120 行（20 档）+ 锚面 117 悬空清账 + §4.x 行数回填工单 7 条——台账 #806」；清单体 = `:68` ∥ `:205` ∥ `:216-237`），系 as-of 2026-10-01 读数；本轮「#806 复核」的复核读数与重切清单不落任何评审域档案 ⇒ 同一工作单两套清单面并存且无单源声明。 | 明示清账清单的现行单源（复核后清单），并使冻结档旧读数按其 as-of 读（记录面），免执行轮按旧清单动手。 |
| 4 | Clarity | 🔵 | `DOC-MIGRATION.md:414`「`checkConfig` 五键**零改**（**as-of 2026-09-18**…）」——「五键」指称对象未在本行写明：按其回指「§10.2 行 6」（`:313`——声明面五项 `scanDirs` ∥ `anchors.domain` ∥ `anchors.exclude` ∥ `lineWidth` ∥ `exemptions`）读得通；字面「`checkConfig` 五键」亦易按「`checkConfig` 键清单」读（现值六键——`MANIFEST.md:53` ∥ `:97`；2026-09-18 当刻四键——`MANIFEST.md:651`）。as-of 标记已挡住「现役计数」误读（#803② 目的达成），指称仍留两读。 | 本行补指称（如「声明面五项（`§10.2` 行 6）零改」），或改具名列表形态，免两读。 |
| 5 | Document consistency · 族覆盖 | 🔵 | #797 处置（「陈标随档失降形」——`ACTIVITY.md:440`）只落 `ACTIVITY.md:177` 一行；同档同族形态仍存于 `:221`（timer-wake 阶段 2 批测试面行「新档 `thincoder-desktop/test/timer-wake.test.mjs`（**已落** · 实读 **286** · **T-TW17–T-TW21**）」）。该件是否同「已失」= **unverified**（源盘不在评审域）；「#785 族」的族定义亦不在域内 ⇒ 族边界不可核。 | 记一句族定义（哪些行属该族）或同法处置 `:221`，使「族收正」可核。 |
| 6 | 行数面（affected-file 读数） | 🔵 | U-2 两值即行数面机器读数：`DOC-MIGRATION.md:523` 载 `lineCounts` 声明已扩为「与域档一一对应的多条目」（main 直写已落——`:671`），故 `SHELL.md:175` **42** ∥ `SESSIONS.md:124` **79** = 机检期望值；其真值需对盘核（`thincoder-desktop/src/main/host-floor.mjs` ∥ `session-actions.mjs` 均在评审域外 ⇒ **unverified**；两档行是否已在多条目声明面 = 亦未核）。`79` 与档内记载相容 ✓（末项删除门 P12 落 `session-actions.mjs`——`SESSIONS.md:99`）。 | 两值对盘复核后随行数面（差异 0）收口。 |

**域限声明**：无项目标准档、无 document map —— 文档所有权判据降级（按 AGENTS.md + 档内自持纪律判）；本轮触碰面纯 `.md` ⇒ 「受影响文件尺寸标注」判据不适用。

计数：🔴 0 · 🟡 3 · 🔵 3（合计 6 条）

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**：**代签成立（2026-10-02 19:4x · 自动链授权内——用户 19:30「全自动」）**——三条件核：① **设计评审 pass** ✓（评审 #19 · 轮次 1：🔴0 ∥ 🟡3 ∥ 🔵3——§3 逐字在册）；② **修正落地并逐条核验** ✓（六条全修——见 §1「评审处置」段；两值对盘实核 ✓）；③ **token 已签发** ✓（凭据值不落档）。**实施派发** = #806 清账执行轮 1（7 档 · 25 锚 + 2 宽——eng-designer 舱；轮 2/3 续排 ∥ 轮 4–6 候时序门）；#804/#815/#816 产品码注释三件 = 父侧直改（另轮）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**§6 验证与收口（2026-10-02 21:2x · 父侧）**

**终读（父侧复跑）**：`node scripts/doc-check.mjs` ⇒ **`OK(锚): 0` ∧ `OK(行宽)` ∧ exit 0**（§2.6 腿 3 判据达成）；汇总 = 候选 44805 · **悬空 0** · 注记豁免 319 · 拟新增 45 · 迁移期引文 297；行数面 差异 **0**（比对 160）。

**六轮全程账**：432 ⇒ **0**（锚）∥ 107 ⇒ **0**（宽）——轮 1–6 销项 = **129 锚**（25+22+12+18+32+20）∥ **105 宽**（2+7+21+16+46+13）；引擎 SKIP 面随正（`dist-*` 前缀 ∥ `.thincoder`——修后基准 70/75 去虚高）+ 承接坐标随正 ×2（父子笔）；逐轮方程皆精确成立；区带外新增超宽全程 **0**。

**实施面**：#797 ∥ #803①② ∥ U-1 直落 ✓ ∥ #804 ∥ #815 ∥ #816 父侧笔 ✓ ∥ U-2 两处 ✓ ∥ 六轮执行（§2.7–§2.12）✓ ∥ 引擎 SKIP 随正 ✓。

**核销同步清单（D7）**：① 状态行 = 本冻结点；② 计数 = 全库 0/0（上）；③ 指针 = `task_book` 在册 ✓；④ 变更记录 = 各轮逐档在册 ✓；⑤ 待办勾销 = **#806 ∥ #797 ∥ #803 ∥ #804 ∥ #815 ∥ #816**；⑥ 前批遗留 = docwidth 批已收口（无遗留）；⑦ **暂缓批复核 = 无**；⑧ 台账可见面 = 随核销落。

**结算**：**收口（2026-10-02）**——记录冻结；台账六行核销；**凭证链终态消费 ✓**（designId 值不落档）。残留（非闸列报 · 沿例）：拟新增 45 ∥ 迁移期引文 297——报告面，不阻收口。
