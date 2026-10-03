# 2026-10-03 · ledger-family-aggregate
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 23:01 原话「这其实昨天解决多仓问题的时候没注意到这个，逻辑上有多个项目时应该显示这些项目的合计」+ 23:11 收窄「我当前打开的是啥就是啥，有什么全局局部的？」+ 23:13「4可以开始了吗？」= 开批令——台账 #882。
> 台账 = #882（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源与点火**：用户 2026-10-03 23:01 原话（承 22:57 走查「状态栏台账计数为啥没了」——现场 = 工作区根锚、双候选）：「当然这不是bug，这是设计问题，其实昨天解决多仓问题的时候没注意到这个，逻辑上有多个项目时应该显示这些项目的合计。」+ 23:11 收窄：「那个什么『打开根看全局』是不是你想多了？我当前打开的是啥就是啥，有什么全局局部的？」+ 23:13「4可以开始了吗？」= 开批令（台账 #882）。

**需求（定形 · 无全局/局部二分）**：状态行台账标记（FR24 F2 面）= **「当前打开范围」的合计**：
- 打开**具体项目**（如 thincoder）⇒ 只显**该项目自己的数**（不做兄弟合计）；
- 打开**容器根**（其下含项目——如 `d:\teamcode`）⇒ 显示**这些项目的合计**（23:01 原话）；
- 同径覆盖「根下恰好一个项目」（显示该项目的数）；零项目 ∥ 无台账面 ⇒ 现状（标记无值——段缺席）。

**对账（实读）**：
- 现行判据 = `thincoder-core/ledger-surface.mjs:52` `marker: current ? formatMarker(current) : null`——**只用 current**；
- 族数据**已在手**：`thincoder-core/ledger.mjs:95-107` `discoverFamily` 返回 `projects: [current, ...同级]` ∥ 扫描面逐项目 `buildScan`（不可读 skip）——**零新采集面**；
- 现场（台账 #881）= 根锚 ⇒ `current: null` ⇒ `marker: null` ⇒ 段静默缺席——**本批落地后随本批闭合**；
- FR24 原句「只显当前项目」（`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.3 F2）= **被修订句**（需求档修订 = 父侧笔——随本批落）。

**边界（明示不做）**：不动「两池不合计」（F1——需求池 ∥ 技术待办分列本体）；不动族发现本体（`discoverFamily` 零改——只改标记消费；若设计轮论证必须改，须在 §2 先立论）；不动 detail 行集面（「当前 ∪ 可动作」既有语义）；不改台账库 ∥ 写面；两端（CLI ∥ 桌面）渲染随动 = 设计轮核适用性。

**验收方向**：① 根锚多项目 ⇒ 标记 = 合计（批内夹具：双项目临时台账可核）；② 单项目锚 ⇒ 只显该项目（负向锁——兄弟零掺）；③ 根锚单项目 ⇒ 显示该项目数；④ 无台账面 ⇒ 现状零变；⑤ 零回归（两池语义 ∥ 空值语义 ∥ 两端渲染）。

**父侧核验 ∥ 裁点（2026-10-03 23:4x）**：① 设计稿核验通过（判据单源 `scopeMarkerOf` ∥ 用例 T47–T54 ∥ 受影响表 ≤500 零拆分 ∥ FR24 F2 修订逐字在 §2.6）；② **KD4 裁 = 含入本批**——VSC item 面（`thincoder-vscode/src/extension/ledger-surface.mjs:66-73` 端侧特化）随动收一（同 FR24 面第三实现、同 #881 症状同源；不留端差）；③ FR24 F2 修订由父侧落笔（需求档笔权——已落 + 变更记录一行）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审修正轮 1 收正（发现 1–3 ∥ 5–7；复跑 exit 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### §2.1 本批条目（覆盖）

台账 **#882**（core · 归批）——状态行台账标记 = **「当前打开范围」的合计**（用户 2026-10-03 23:01 原话 + 23:11 收窄「无全局/局部二分」；验收五条以 §1 为准）。

| # | 条目 | 定形 |
|---|---|---|
| 1 | 标记语义（L1） | `current` 在场 ⇒ 只显该项目自己的数（不做兄弟合计）；`current` 缺（容器根锚）⇒ 族内已读项目**两池分列求和**；「根下恰一项目」同径；空范围 ⇒ 现状（无值——段缺席） |
| 2 | 消费链核查（CLI ∥ 桌面 + **第三面发现**） | CLI ∥ 桌面 = 纯透传（零改）；**VSC item = 端侧特化 ⇒ 随动一处**（§2.3-3） |
| 3 | 需求档 FR24 F2 修订建议（逐字） | 落笔 = 父侧（§2.6） |
| 4 | 批内用例（可机判 · 先红后绿） | T47–T54（§2.5） |

**不在本批**（§1 边界随照）：明细行集（L2「当前 ∪ 可动作」）· 族发现本体（`discoverFamily` 零改）· 台账库 ∥ 写面 · F1「两池不合计」· detail 行集语义 · 他批。

### §2.2 设计档落点（本设计轮已落）

| 档 | 落点 |
|---|---|
| `docs/core/design/LEDGER.md` | §7.1 +导出 `scopeMarkerOf`；§7.2 +「标记范围」条；§7.3 L1 行 ∥ §7.3.1 状态位句随动；§8 +AC-M2-18 +T47–T54；§9 +边界行；变更记录 +1 行 |
| `docs/desktop/design/UI.md` | 表行 11 ∥「本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）」项 2（两条随动） |
| `docs/desktop/design/IPC.md` | `ev:ledger` 行随动（`text` ∥ `warn` 口径） |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.3 | FR24 F2 句修订 = **父侧笔**（逐字见 §2.6） |
| VSC 面 | 无独立设计档面（item 语义单源 = 核档 §7.2——本批不新造档）；端随动 = 产品码一处（§2.4） |

### §2.3 机制设计（定形）

1. **范围口径单源 = 新导出 `scopeMarkerOf(scans, family)`**（`thincoder-core/ledger.mjs`，落点 = `formatMarker` 邻位）：
   - `family.current` 在场（打开具体项目）⇒ 范围 = 该项目 scan；**命中但不可读 ⇒ 空范围**（不掺兄弟）；
   - `family.current` 缺（打开容器根）⇒ 范围 = 族内**已读**项目（不可读 skip 随动——既有语义）；
   - 空范围 ⇒ `{ marker: null, warn: false }`（现状——不落 `0·0`）；
   - 范围非空 ⇒ `marker` = `formatMarker` 逐字（两池**分列求和**——F1 不冲突）；`warn` = 范围内任一项 `aged>0 ∨ deadExecutors>0`；
   - 「根下恰一个项目」= 同径（零特判）。
2. **核拍面**：`ledger-surface.mjs` `runLedgerScan` 的 `state.ledger` 行改走本函数——形状 `{ marker, warn, scannedAt }` 零变（出站面零随动）。
3. **三端消费链核查（结论 + 随动）**：
   - **CLI**（`thincoder-cli/src/tui/render-frame.mjs:444-447`）：`state.ledger.marker` 直读——纯透传，**零改**；
   - **桌面**（`thincoder-desktop/src/main/project-info.mjs:62-64` `ledgerMarkerOf` → `:147-153` 首拍必携 → `renderer/views/statusline-segments.mjs:185-195` 段 11）：纯透传，**零改**（`{ text, warn }` 语义随核走）；
   - **VSC**（`thincoder-vscode/src/extension/ledger-surface.mjs:66-73` `updateItem`）= **端侧特化**：现自算 `formatMarker(current)` + `current.aged/deadExecutors`、`!current` 即 hide ⇒ 与新语义相抵（容器根锚静默缺席——同 #881 症状）⇒ **随动**：改核单源 `scopeMarkerOf`（`scanFamily` 回携 `family`；在场判据 = `marker` 非空）。**含入依据** = 同一 FR24 面的第三实现面（§1 边界列「CLI ∥ 桌面」未含 VSC——探索发现）；不留端差（FR24「语义同源、各自实现」）；**可裁点**（§2.9）。
4. **禁用面随照**：`discoverFamily` 零改（范围消费在标记层）· `formatMarker` 签名 ∥ 逐字零改 · L2（明细行集）· L3 ∥ L4（变化行）· 去重档 ∥ 送达门零改。

### §2.4 受影响文件表（file:line 级 + 行数预算；as-of 2026-10-03）

| # | 文件 | 现状 | 改点 | 预算 |
|---|---|---|---|---|
| 1 | `thincoder-core/ledger.mjs` | 220 | 新导出 `scopeMarkerOf`（`formatMarker` 邻位——`:146-149` 后）+ 头注面句 | +14±4 |
| 2 | `thincoder-core/ledger-surface.mjs` | 84 | `:52` `state.ledger` 行改走本函数 + 头注 | +2±2 |
| 3 | `thincoder-vscode/src/extension/ledger-surface.mjs` | 141 | `scanFamily`（`:53-62` 回携 `family`）+ `updateItem`（`:66-73`） | +4±3 |
| 4 | `thincoder-cli/src/tui/render-frame.mjs` | 461 | **零改**（透传面） | 0 |
| 5 | `thincoder-desktop/src/main/project-info.mjs` | 182 | **零改**（透传面） | 0 |
| 6 | `thincoder-desktop/renderer/views/statusline-segments.mjs` | 228 | **零改**（透传面） | 0 |
| 7 | `docs/batches/2026-10-03-ledger-family-aggregate.test.mjs` | —（拟新增） | 批内单测件（T47–T54） | ≈150±40 |
| 8 | `docs/core/design/LEDGER.md` | 489 | §7.1/§7.2/§7.3/§7.3.1/§8/§9/变更记录（**已落**） | +17±3 |
| 9 | `docs/desktop/design/UI.md` | 809 | 两处随动（**已落**） | ±2 行内 |
| 10 | `docs/desktop/design/IPC.md` | 535 | 一处随动（**已落**） | ±1 行内 |
| 11 | `docs/core/requirements/ENGINEERING-MODE-V2.md` | 758 | FR24 F2（**父侧笔**）+ 变更记录一行 | ±2 行内 |

行数软线：改动档全部 ≤500（`ledger.mjs` ≈234、`ledger-surface.mjs` ≈86）——零拆分义务。坐标（`:52` ∥ `:53-62` 等）= as-of 现盘；实施落盘后按盘重锚。

### §2.5 批内用例设计（可机判；先红后绿可行）

夹具 = 临时台账目录注入（`_setLedgerDirForTest`）+ 双项目临时树（A ∥ B 各注册台账、条目数可区分）+ 根容器目录；直驱 `runLedgerScan({ state, anchor, notifyFile: tmp })` 读 `state.ledger`。

| # | 用例 | 断言 |
|---|---|---|
| T47 | 根锚双项目 | `marker` = 两池分列求和（例 `台账 3·4`）——**先红**（现状 ⇒ `null`） |
| T48 | 单项目锚（A 内） | `marker` = A 自身数；B 的数零掺入（负向锁） |
| T49 | 根锚恰一项目 | `marker` = 该项目数（同径） |
| T50 | 不可读 skip | 余者照常求和；全不可读 ⇒ `null`（不落 `0·0`） |
| T51 | 命中但不可读 | 具体项目锚 ⇒ `null`（兄弟零掺） |
| T52 | 空族 | `marker = null` + `warn = false`（现状零变） |
| T53 | warn 范围聚合 | 族内任一项 `aged>0` ⇒ 根锚 `warn = true`；无老化单锚 ⇒ `false`（负向锁） |
| T54 | 端面 | 桌面 `ledgerMarkerOf` 三态透传（纯函数）；VSC 源面锁（`scopeMarkerOf` 消费 ∥ `formatMarker(current)` 自算零残余） |

复跑（实施轮落件后 · 仓根）= `node --test docs/batches/2026-10-03-ledger-family-aggregate.test.mjs`。

### §2.6 需求档 FR24 F2 修订建议文本（逐字——父侧落笔）

现行句（`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.3 F2）：

> - **状态行极简标记**：`台账 <需求池数>·<技术待办数>`，只显当前项目，老化 >0 转警示色；两池分显不合计。

建议改为（逐字）：

> - **状态行极简标记**：`台账 <需求池数>·<技术待办数>`，**按当前打开范围取值**——打开具体项目 ⇒ 只显该项目自己的数（不做兄弟合计）；打开容器根（其下含项目）⇒ 显示这些项目的合计（不可读项目跳过）；老化 >0 转警示色；两池分显不合计。

同节其余句零改（「多项目判据」行 ∥ 明细行集语义不变）。设计侧回指已落 = LEDGER.md §7.2 ∥ AC-M2-18 ∥ T47–T54。

### §2.7 验收对照（回指 §1 五条）

| §1 验收方向 | 设计承接 | 机判面 |
|---|---|---|
| ① 根锚多项目 ⇒ 合计 | §2.3-1 | T47 |
| ② 单锚 ⇒ 只该项目（兄弟零掺） | §2.3-1 | T48 |
| ③ 根锚单项目 ⇒ 该项目数 | §2.3-1（同径） | T49 |
| ④ 无台账面 ⇒ 现状零变 | §2.3-1（空范围 ⇒ `null`） | T52（+T50 ∥ T51） |
| ⑤ 零回归（两池 ∥ 空值 ∥ 两端渲染） | §2.3-1（分列求和）∥ §2.3-3（两端零改 ∥ VSC 随动一处） | T53 + T54；渲染面 = 透传链核查在册 |

机检读数（设计轮 · 仓根 `node scripts/doc-check.mjs` 复跑）= **exit 0**（锚 0 悬空 · 行宽 0 命中；`scopeMarkerOf` 为「符号·宽——报告面」类——不入闸）。

### §2.8 关键决策与被否项

| # | 决策 | 理由 / 被否 |
|---|---|---|
| KD1 | 范围归约收核为**新导出** `scopeMarkerOf(scans, family)`（`ledger.mjs`）——核拍面 ∥ VSC item 双消费 | 被否：核内内联（VSC 须端侧复刻求和式——第二实现面）；被否：改 `formatMarker` 本体（逐字 ∥ 签名契约锁定） |
| KD2 | `family.current` 在场性判「具体项目锚」——**不可读 ⇒ 空范围**（不掺兄弟） | 「打开的是啥就是啥」——unreadable 不得改显兄弟数；被否：`current ?? 全族` 简式（错掺——T51 锁） |
| KD3 | `warn` 同范围聚合（端零重算） | 与 `marker` 同源单点；被否：端侧自判（两面漂移） |
| KD4 | VSC item 含入本批（第三面随动） | FR24 语义同源 ⇒ 不留端差；**可裁点**（§2.9） |
| KD5 | 空范围 ⇒ `null`（不落 `0·0`） | 禁假造 ∥ 现状语义（`0·0` 会被读作「确无未决」） |

### §2.9 上抛项

- **可裁点（唯一）**：VSC item 面含入本批（KD4）——裁出 ⇒ 容器根锚下 VSC 仍静默缺席（同 #881 症状；端差在册，须另批或落登记）。
- 其余无上抛：需求键面 ∥ 台账库 ∥ 写面 ∥ 提示词面 ∥ 其他端零触。

### §2.10 设计评审修正轮 1（fix 轮 · eng-designer · 2026-10-03）

承 §3 轮次 1 发现 1–3 ∥ 5–7（父侧全数采纳）；发现 4 ∥ 8 = 需求档笔（父侧已办——本侧零触）。改动全部落 `docs/core/design/LEDGER.md`——**零语义改**（纯补明文 ∥ 收口）：

- §7.2「标记范围」条补三条子项——**范围推导**（`current` 在场 ⇒ 范围 = `scans` 中 `root` = `family.current.root` 的 scan；**容器根自身带台账** ⇒ `findProject` 含自身命中 ⇒ 归属 = 具体项目锚——不合计其下项目；`current` 缺席 ⇒ 族 = `discoverFamily` 既有枚举面 `projects`——向上（含锚）最近「含台账子目录」层取其子目录）· **两参对账**（`family` 判归属 ∥ `scans` 载体——「已读」= 在 `scans` 中）· **文本产出**（`marker` 文本 = 委托 `formatMarker` 逐字模板——产出者三档命名收口）。
- §7.2 增「标记范围批（#882）受影响面」指针行（全清单 = 本节 §2.4；贴线判 = 零贴线 ⇒ 零拆分）。
- §7.1 `formatMarker` 行补**范围限定括注**（单 scan 逐字模板——范围求和经 `scopeMarkerOf` 委托出文）。
- §8 AC-M2-18 行两处 F2 引用改可解析形态（需求 §13.3 第 1 条「状态行极简标记」）；T53 补死执行者腿（族内 `deadExecutors>0` ⇒ 根锚 `warn=true`）；T54「三态」改「两形」。
- 变更记录 +1 行。

机检复跑（仓根 `node scripts/doc-check.mjs`）= **exit 0**（锚 0 悬空 ∥ 行宽 0 命中）。行数面 = 5 条差异（报告态）——全部指向 desktop 侧源文件（并行在途改动；本修复轮零笔——本设计档不在 lineCounts 声明面）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements/Clarity | 🟡 | 范围判据的枢不同：`LEDGER.md:299`（§7.2「标记范围」）以「`current` 在场」立式，而 `LEDGER.md:380`（AC-M2-18）∥ `LEDGER.md:434-439`（T47–T52）∥ `ENGINEERING-MODE-V2.md:615`（需求 §13.3 第 1 条）以「容器根 ∥ 具体项目锚」立式——两式映射无明文；`current` 缺席时「族」如何枚举无定义（§7.1 `discoverFamily` 定义 =「projects = current + 其同级含台账目录」`LEDGER.md:288`，对 null 无义），而本批核心场景恰是容器根锚（T47 双项目夹具）；`scopeMarkerOf(scans, family)` 两参谁驱动范围 ∥「已读」如何判亦未述。 | §7.2 补一句范围推导句（`current` 缺席 ⇒ 族 = 点名既有枚举面；`scans`∕`family` 对账口径；容器根自身带台账时归属 = 具体项目锚 ∥ 容器根锚）。 |
| 2 | Document ownership/Consistency | 🟡 | L1 文本产出者三档命名不一：`LEDGER.md:290` 定 `scopeMarkerOf` =「L1 取值单源」，而 `UI.md:116` ∥ `UI.md:382` ∥ `IPC.md:30` 三处均写「核 `formatMarker` 逐字 `台账 N·M`（= 当前打开范围合计）」；`LEDGER.md:289` 又保留 `formatMarker(scan)`「签名与键语义不变」（单 scan 语义不能承载范围求和）——`formatMarker` 是否仍在调用链无明文。 | 择一收口：明写 `scopeMarkerOf` 委托 `formatMarker` 逐字模板，或把端侧两档产出者名改为 `scopeMarkerOf`；§7.1 `formatMarker` 行括注补范围限定。 |
| 3 | Acceptance criteria/引用纪律 | 🟡 | AC-M2-18 回指「需求 §13.3 F2·2026-10-03」（`LEDGER.md:380`）不可解析：§13.3 五条功能点无 F 编号（`ENGINEERING-MODE-V2.md:615-619`），F 编号住 §13.4 FR25（`:627` 起；F2 = 批次档同规）；`LEDGER.md` 自身把「两池不合并为一数」记作 F1（`:299` ∥ `:455`）⇒ 同序下 F2 = 第 2 条（三处文本行），与 AC 对象（第 1 条状态行极简标记）不符。 | 改可解析形态（例「需求 §13.3 第 1 条『状态行极简标记』· 2026-10-03」），或先定义 F 编号再引用。 |
| 4 | Requirements | 🟡 | 警示色判据两档分叉：需求 §13.3 第 1 条只写「老化 >0 转警示色」（`ENGINEERING-MODE-V2.md:615`）；设计面（`LEDGER.md:309` ∥ `:345` ∥ `:380` ∥ `UI.md:116` ∥ `UI.md:382` ∥ `IPC.md:30`）为「范围内 `aged>0 ∨ deadExecutors>0`」——死执行者腿在需求档零表述（F-LX1 随动未回收）。 | 该条补「∨ 范围内有死执行者」半句，或明写「警示色判据单源 = 设计档」。 |
| 5 | Affected-file annotations（判据 8） | 🟡 | 本批设计面无受影响文件清单（现行行数 + 预期增量）：项目自制模块设计内容③ =「受影响文件全清单（源/测试标当前行数 + 预计增量）」（`ENGINEERING-MODE-V2.md:273`），`LEDGER.md` 有先例形（§3.2 受影响面 `:203-209`）；本批至少触及核台账模块（`:290` 新增归约导出）· 核 `ledger-surface.mjs`（`state.ledger` 产出面——`UI.md:116` 坐标）· VSC 端 `ledger-surface.mjs`（item 面——`LEDGER.md:352` 坐标）+ 批内单测件（`:432` 仅给路径，无行数/增量）。贴线判定（300/500）在评审射程内无从核对。 | 补受影响面表（源/测试 × 现行行数 × `≤±N` ∥「结构不变」），贴线者随附拆分方案；若该表按批住批次档，设计面留一行指针。 |
| 6 | Acceptance criteria | 🔵 | 范围 `warn` 只测老化腿：T53（`LEDGER.md:440`）以 `aged>0` 立根锚 true、以无老化具体项目锚立 false；AC-M2-18 ∥ §7.3.1 状态位句同含的 `deadExecutors>0` 腿无范围级用例（T19 `:392` 仅单项目 L2 尾段）。 | T53 补一拍（族内项目 `deadExecutors>0` ⇒ 根锚 `warn=true`），或注「死执行者腿由 T19 覆盖」。 |
| 7 | Clarity | 🔵 | T54（`LEDGER.md:441`）「桌面 `ledgerMarkerOf` 透传三态（新文字 `{ text, warn }` ∕ `null`）」——称三态而列两形。 | 改「两形」或写全三形。 |
| 8 | Doc hygiene | 🔵 | 需求 §13.3 第 1 条的 2026-10-03 修订（承批档 §1 用户 23:01 ∥ 23:11 裁定）在需求档内无日期/来源痕——该档同类父侧改判的既成记法 = 就地日期注（例 `ENGINEERING-MODE-V2.md:15`「2026-09-18：本段新增 + 同日两次改判（父侧直接执行 · 可 revert）」）；范本面已按 D8 清得干净（无划改残留）。 | 落一行日期注（记法与 `:15` 同式），或于批档记明修订来源。 |

计数：🔴 0 · 🟡 5 · 🔵 3（共 8）

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（审计 1 轮 clean ∥ 代码评审 1 轮 pass（🔵 6 条报告态）——T47–T54 先红后绿 · 既有件复跑三项 · doc-check exit 0）



### §5.1 交付面（file:line · as-of 实施后现盘）

| # | 文件 | 改动 | 实读行数 |
|---|---|---|---|
| 1 | `thincoder-core/ledger.mjs` | 新导出 `scopeMarkerOf(scans, family)`（`:157-171`，`formatMarker` 邻位——范围归约单源：`current` 在场按 `root` 滤取、缺席取全族；空范围 `{ marker: null, warn: false }`；两池分列求和 + 委托 `formatMarker` 逐字；`warn` = 范围内 `aged>0 ∨ deadExecutors>0`）+ 头注 ⑤ 句随动（`:12`） | 241（+21） |
| 2 | `thincoder-core/ledger-surface.mjs` | `state.ledger` 行改走本函数（`:51-54`——形状 `{ marker, warn, scannedAt }` 零变）+ import 面（`:15`）+ 头注 ③ 句随动（`:12`） | 85 |
| 3 | `thincoder-vscode/src/extension/ledger-surface.mjs` | `scanFamily` 回携 `family`（`:62`）；`updateItem` 收核单源（`:67-75`——`ledger.scopeMarkerOf(scans, family)`，在场判据 = `marker` 非空；端侧 `formatMarker(current)` ∥ `aged/deadExecutors` 自算零残余）；两调用点传 `family`（`:100` ∥ `:110`）；头注 ① 句随动（`:4-5`） | 142 |
| 4 | `docs/batches/2026-10-03-ledger-family-aggregate.test.mjs` | 批内件新建（T47–T54 全表；夹具 = `_setLedgerDirForTest` + 项目临时树（各带 manifest）） | 239（拟新增） |
| 5 | CLI（`render-frame.mjs`）∥ 桌面三档（`project-info.mjs` ∥ `statusline-segments.mjs`） | **零改**（实读复核 = 纯透传） | 0 |

`formatMarker` 本体 ∥ `discoverFamily` ∥ 台账库 ∥ 写面零改；批档 §1/§3–§6、设计档零触（本段笔权 = §5）。

### §5.2 测试读数（先红后绿）

红基线（实施前 · 现盘 `state.ledger` 只取 `current`）：**T47 ✖ / T50 ✖ / T53 ✖ / T54 ✖**；T48 ✔ / T49 ✔（**同径**——容器下唯一项目经发现解析已命中 `current`，改动前即绿）/ T51 ✔ / T52 ✔。
绿复跑（实施后同件）：**8/8 ✔**——逐腿读数：T47 `marker="台账 3·4"` warn=false（A 1·1 + B 2·3）；T48 `"台账 1·1"`（B 2·3 零掺）；T49 `"台账 2·1"`（同径零特判）；T50 求和腿 `"台账 1·2"`（B 不可读跳过）∥ 全不可读腿 `null` + warn=false；T51 `null`（A 命中但不可读——B 2·3 在场不顶替）；T52 `null` + warn=false；T53 老化腿 `"台账 0·3"` warn=true ∥ 负向锁 `"台账 0·2"` warn=false ∥ 死执行者腿 `"台账 0·1"` warn=true（判活桩 pid 424242）；T54 桌面 `ledgerMarkerOf` 两形 ✓ ∥ VSC 源面锁（消费 true ∥ 残余 false）。

既有件复跑（直接相关三件）：`2026-09-29-residuals-round2.test.mjs` **12/12 ✔**；`2026-09-29-residuals-round2-vsc.test.mjs` **7/7 ✔**；`2026-09-29-desktop-statusline-cli-gap.test.mjs` **16/17**——`T17` 与改动前基线同红（对象 = 桌面 `agent-host.mjs` 的 `ev:usage` 载荷源，属并行在途桌面改动，与本批无关）。仓套件 = 父侧收口跑（本链未跑）。

doc-check（仓根 `node scripts/doc-check.mjs`）：**exit 0**——悬空 0 ∥ 行宽 0 ∥ 行数面差异 5 条（全部 desktop 侧源文件，与设计轮 as-of 一致；本批零关）。

### §5.3 决策透明表（KD1–KD5 实施）

| 决策 | 落法 | 偏离 |
|---|---|---|
| KD1 归约收核为新导出 `scopeMarkerOf` | 照落（核拍面 ∥ VSC item 双消费） | 零 |
| KD2 `current` 在场性判锚（命中不可读 ⇒ 空范围） | 照落（`root` 滤取空集早退——不掺兄弟） | 零 |
| KD3 `warn` 同范围聚合（端零重算） | 照落（核内单点；VSC ∥ 桌面零自判） | 零 |
| KD4 VSC item 含入本批（第三面收一） | 照落（`family` 回携 + `updateItem` 收核——不留端差） | 零 |
| KD5 空范围 ⇒ `null`（不落 `0·0`） | 照落 | 零 |

行数实读 vs §2.4 预算：`ledger.mjs` 241（预算 220 +14±4——超上限 3 行）· 单测件 239（预算 ≈150±40）；两者 ≤300 顾问线 ⇒ **零拆分义务**。§2.4 坐标（`:52` ∥ `:53-62` ∥ `:66-73`）已随盘移位（核 `:51-54`；VSC `:54-63` / `:67-75`）——随父侧收口按盘重锚（§2.4 尾句自定口径）。

### §5.4 自检链（轮次与终态）

- **分歧审计（explore · 只读）1 轮**：四类（分歧 ∥ 静默降级 ∥ 漏项 ∥ 超范围）**零命中 ⇒ clean**；结构面 + 语法面复核通过（`node --check` 四档全 OK）。旁支观察 1 条：`thincoder-cli/src/tui/render-frame.mjs:443` 注句「warn = 当前项目老化 > 0」为 #882 前措辞（零改透传面、非本批引入）——转父侧处置。
- **代码评审（advisor）1 轮**：**VERDICT pass**（无 🔴 / 无必改 🟡；🔵 6 条报告态）——① 行数/读数未随盘收正（本段 §5.3 已按盘写实读）；② 设计档 §2.1「比较点登记两处」计数未随动（新比较点 = `ledger.mjs:160`；同谱系 ⇒ 守卫本体零破；设计档非本段笔权 ⇒ 转父侧）；③ T54 源面锁为文本级（设计既定的锁形；建议端测树回迁时补行为腿）；④ 先红基线记录互斥——**实证裁 = 测试件头注原「T49 红」为误**（红基线实跑 T49 ✔、读数 `marker="台账 2·1"`）；已按实跑收正头注（注释级；复跑仍 8/8 ✔）；⑤ VSC 容器根锚 + 全族无可动作项 ⇒ tooltip 落空串（`new MarkdownString("")`）——真机渲染表现未验证（观感级；转父侧真机裁）；⑥ 新导出对 `family` 缺席与容器根锚同判（两现消费点均传实体——当下零风险；JSDoc 脚坑级）。
- **终态**：**clean**（审计 1 轮 clean + 评审 1 轮 pass；零残留修轮）。

### §5.5 上抛（父侧面）

1. 设计档两处读数随动：`LEDGER.md:303`「最高 ≈234——`ledger.mjs`」（实读 241）∥ §2.1 比较点登记计数——设计档笔权。
2. 桌面侧坐标重锚：`project-info.mjs:62` ∥ `docs/desktop/design/UI.md:116` / `:381` ∥ `IPC.md:30` 的「`ledger-surface.mjs:52`」⇒ 现盘 `:54`。
3. `render-frame.mjs:443` 注句陈旧（零改透传面——选项：随下一微批收口）。
4. 真机复核项（本件只承机检腿）：容器根锚下 VSC item 显示 ∥ 空 tooltip 观感。

## §6 验证与收口（父代理）
