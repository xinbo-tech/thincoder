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
**状态行**：设计完成
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

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
