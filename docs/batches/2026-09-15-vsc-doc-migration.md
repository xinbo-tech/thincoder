# 批次档 · VSC 端文档迁移（VSC-DOC-MIGRATION）· 2026-09-15 起

> **建档 ✓：2026-09-15 00:44**（父代理 §1 ✓）。**独立成档的理由** ✗：① 主题独立（VSC 端 ✓ —— 与 CLI 端批次 `2026-09-14-doc-migration.md` **分档** ✓）② 用户 00:37 诊断「**批次档用得太狠 ⇒ 注意力下降**」✓ ⇒ **一主题一档** ✗（生命周期原则 ✓ 已挂需求：需求池「批次档生命周期」条 ✓）。
> **执行的裁定** ✗：**21:41**「VSC 必须**文档先行**」✓（代码面未许可前一行不动 ✓）· **21:37**「已取代旧档就地留参照、不上迁」✓ · **23:02**「**明显应该是 B**」✓（留原地 + 根层所缺内容补写 ✓）· **21:47** 三部分规划 `docs/core/design/DOC-SYSTEM.md`（判据 P1–P5 ✓ · `docs/vsc/` = VSC 部分 ✓）。

## §1 批次任务（主 agent · 父代理）

**目标** ✗：把 `thincoder-vscode/docs/{design,requirements}/**` 里的**活档**内容迁进基准层 `docs/vsc/` ∥ `docs/core/` ✓；**历史档就地留参照** ✓。

**本批（第 1 批）** ✗：VSC 文档**实点 + 二分表 + 当场迁第一批活档（≤6 档）** ✓ —— **规划与迁移同轮**（禁纯统计空转 ✓ 用户 00:26/00:42 双重口径 ✓）。

**硬要求** ✗（今晚实证的教训 ✓）：**凡新建目录（如 `docs/vsc/`）⇒ 同批必须把该目录加进两扫描器的射程** ✓（`scripts/check-doc-width-core.mjs` 的 `SCAN_DIRS` ✓ · `scripts/doc-anchors-v5.mjs` 的 `V5_SCAN_DIRS` ✓）；`scripts/**` = **工程工具面**（用户 00:18 规程 ✓）⇒ 可直接改 ✓ **但改完必须实跑报读数** ✓。

**纪律** ✗：三机检绿（锚域一悬空 **0** · 宽度 **0 新增** · 台账 **0**）+ 单笔可 revert + 逐批报用户 ✓；**`thincoder-vscode/**` 一字不改** ✗（只读参照 ✓）。

## §2 批次任务（eng-designer）

（待本批写入 ✓）

**本批任务（B 式迁移轮 · VSC 第 1 批）** ✗：VSC 端文档**实点 + 二分表 + 当场迁第一批活档** ✓（规划与迁移同轮 ✓）。规划结论落 = `docs/vsc/design/VSC-MIGRATION.md`（设计）+ `docs/vsc/requirements/VSC-MIGRATION.md`（需求，同名成对 ✓）。

**范围内（本批覆盖的需求）** ✗：需求档 F-M1（实点 + 二分 + 小计闭合）· F-M2（依据列 + 待核单列）· F-M3（当场迁 ≥1 档活档）· F-M4（落点档不含批次材料）· F-M5（坐标改写为现状路径并实核）· F-M6（新建目录同批入射程 + 实跑报读数）。

**本批实迁（3 档源档 · 旧档一字未改）** ✗：

| # | 源档（`thincoder-vscode/**`，未改） | 行数 | 落点（基准层活档） | 行数 |
|---|---|---|---|---|
| 1 | `docs/design/SETTINGS.md` | 178 | `docs/vsc/design/SETTINGS.md` | 128 |
| 2 | `docs/design/PROJECT-SWITCHER.md` | 75 | `docs/vsc/design/PROJECT-SWITCHER.md` | 97 |
| 3 | `docs/requirements/WEBVIEW.md` | 71 | `docs/vsc/requirements/WEBVIEW.md` | 91 |

**受影响文件（R24a · 实核行数）** ✗：新增 5 档（`docs/vsc/design/{VSC-MIGRATION,SETTINGS,PROJECT-SWITCHER}.md` 329/128/97 + `docs/vsc/requirements/{VSC-MIGRATION,WEBVIEW}.md` 46/91）；
实修 2 常量（`scripts/check-doc-width-core.mjs` `SCAN_DIRS` · `scripts/doc-anchors-v5.mjs` `V5_SCAN_DIRS`——各加 `docs/vsc/design` + `docs/vsc/requirements`）；本批次档 §2 append 1 处。

**明列批外（本批零写入）** ✗：① 统一面 64 档（P1 → `docs/core/**`）——父侧 2026-09-15 收紧写域（与并行 CLI 批同文件竞争）⇒ 列 `VSC-MIGRATION.md` §8 **待父侧另批**（串行）；
② 待核 3 条（VSC-PROMPTS 设计/需求 + `design/prompts/` 15 档）——`VSC-MIGRATION.md` §7 给两种读法 + 依据，**零裁定**；③ `WEBVIEW（VSC 侧）` 1867 行——超 500 硬限**必拆**，归**批 2**（拆分规划已在 §6 给出）；④ 历史档 14 档（就地留）· `_archive/` 17 · `prompts/` 15 · 批次档 34（批次档不迁）。

**验收标准（逐条回指需求 · 机器可验）** ✗：A-VM1 实点/二分闭合（84 = 33+3+1+13 / 31+1+1+1）✓ · A-VM2 84 行依据列非空 + 待核含两读法 ✓ · A-VM3 落点档在位 + `thincoder-vscode/**` 零改 ✓ · A-VM4 落点档无状态行/流水 + 含「不并项与历史沿革」✓
· A-VM5 坐标按现状实核（本批发现源档漂移 2 处：`setup.mjs` `:232`→`:237`、`shell.mjs` `:233`→`:229`——已按现状改写并上报）✓ · A-VM6 锚根域悬空 0 + 射程含新目录 ✓ · A-VM7 宽度无 >300 + 无 >500 档 ✓ · A-VM8 `git status` ⊆ 声明写域 ✓。

**三闸读数（改后 · 实跑）** ✗：`doc-anchors` 根域 61 档（改前 56）· **悬空 0** · exit 0；`check-doc-width` 337 档（改前 332）· 无 >300 单行 · 一致性新增违规 0 · exit 0；`check-ledger` 0 处违规 · exit 0。

**本批任务（B 式迁移轮 · VSC 第 2 批）** ✗：`WEBVIEW（VSC 侧）`（1867 行 · 超 500 硬限）——**先剔一次性材料、再按面拆三档、当批实迁** ✓；源档一字未改（留作参照历史 ✓）。

**范围内（本批覆盖的需求）** ✗：F-M3（当场迁活档 + 逐档报「旧档 → 落点」）· F-M4（落点档不含批次材料 + 不并项逐项登记）· F-M5（坐标改写为现状路径并实核）· N-M2（锚悬空 0）· N-M3（新增档无 >300 字符单行；逐档 ≤500 硬限）。
批 1 已闭合者（F-M1 实点 / F-M2 二分 / F-M6 射程）本批**不重开** —— `docs/vsc/**` 已在两扫描器射程内（批 1 落）。

**① 剔料（逐处实核）** ✗：**974 行**（正文素材 = 893 行）；前批预估 846 行 ⇒ 口径差 = 前批未计 §10.3 逐字 JS 施工形态（27 行）与各节头注 / 边界行 ✓。

| 源档节 | 内容 | 行数 |
|---|---|---|
| 头注 | 来源 / 状态 / 约束行（时点材料） | 8 |
| §5.1.1–§5.1.3 | 问题陈述 + 根因收口 R-1–R-5 + 方案选型 | 68 |
| §5.1.6–§5.1.9 | 受影响文件 / 用例表 / 验收标准 / 边界 | 54 |
| §7.4（批材料部分） | 问题陈述 + 选型 + 受影响文件 + 用例表 + AC + 边界 | 33 |
| §9.1 · §9.3 · §9.5–§9.8 | 问题陈述 / 选型 / 受影响文件 / 用例表 / AC / 边界 | 66 |
| §10.1–§10.2 · §10.3（JS 块）· §10.5–§10.8 | 现场复核 / 选型 / 逐字施工形态 / 受影响文件 / 用例表 / AC / 边界 | 131 |
| §11 头注+§11.1.1 · §11.1.4–§11.1.7 · §11.2.3–§11.2.6 | 问题陈述 / 受影响文件 / 用例表 / AC / 边界 | 92 |
| §12.1–§12.2 · §12.6–§12.9 | 问题陈述 / 选型四问 / 受影响文件 / 用例表 / AC / 边界 | 145 |
| §13.1–§13.2 · §13.5–§13.8 | 现场核实 / 选型 / 受影响文件 / 用例表 / AC / 边界 | 91 |
| §14.1–§14.2 · §14.6–§14.9 | 现场核实 / 选型 M1–M6 / 受影响文件 / 用例表 / AC / 边界 | 211 |
| §15 | 变更记录（逐批流水） | 75 |
| **合计** | —— | **974** |

**② 拆分产物（3 档 · 实核行数）** ✗：

| # | 落点（基准层活档 · 本批新建） | 行数 | 覆盖源节 |
|---|---|---|---|
| 1 | `docs/vsc/design/WEBVIEW.md` | 262 | §1–§6 · §12 · §13 · §14（结构与活动区面 + 块头形态） |
| 2 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 271 | §4 · §7 · §8 · §14.3（协议 · 秩序/忙态 · digest · 状态行对位） |
| 3 | `docs/vsc/design/WEBVIEW-INPUT.md` | 156 | §9 · §10 · §11（输入面 · 消息渲染契约） |

**切面取舍** ✗：按**读者面**切——结构面（布局/文件/组件/活动区）∥ wire 契约面（消息族/秩序/忙态/状态行）∥ 端点契约面（输入进 / 渲染出）。
理由 = 三面各自的回指密度最高处自成闭环（结构面内部互引最密；协议面读者 = 改 host 发射端或 webview 接收端者；端点面同形：纯函数 / 事件契约 + 测试档直驱）。
否决备选：① 两档（原规划两名 `WEBVIEW.md` + `WEBVIEW-PROTOCOL.md`）——首档实测超 500 硬限 ✗；② 按批序切（一批一档）——批次材料已剔，切出的档无独立语义面 ✗。

**③ 逐处「并入 K / 不并 J」** ✗：逐处清单落各档「不并项与历史沿革」节（旧档节 + 何故 + 去向）——三档合计 **22 行**（`WEBVIEW.md` 9 · `WEBVIEW-PROTOCOL.md` 4 · `WEBVIEW-INPUT.md` 9）；
不并主体 = ① 各批一次性批材料（974 行口径内）② (d) 类已作废结构（区内原地保留 · 折叠上限 20 · settled 即时折叠 · 旧 DOM-move 锚链 / `freezeInsertPoint` / 双态驻留 · preview / ticker）③ §10.3 逐字施工形态（现态源码即权威）。

**④ 统一面内容清单（待父侧另批）** ✗：

| # | 内容 | 拟并入目标 |
|---|---|---|
| 1 | CLI 侧对位事实（活动块头 / 状态行的 CLI 形态——源档 §14 C-13 / C-15 对位列） | `docs/core/design/AGENT-LOOP.md`（或 TUI 板块档）——本批**保留在 VSC 端差表内**（VSC 判据需要），是否另并归父侧裁定 |
| 2 | 镜像面判据句补条（`DOC-SYSTEM` §5.1 的 P1/P2 无「镜像面」专条） | `docs/core/design/DOC-SYSTEM.md`——本批**零写入**（与并行 CLI 批同文件竞争） |

**⑤ `VSC-MIGRATION.md` 更新点** ✗：§4.1 行 49 → 「已迁（批 2）」+ 拆分产物；§6 批 2 行 + 拆分规划 → 实落结果表；§7 待核 3 条**销项**（既有裁定 = 原地保留不动）；
§9 → 实迁记录（9.1 批 1 / 9.2 批 2）；§10 补批 2 受影响文件（行 9–14）；§12.1 批 2 验收标准（A-VM9–A-VM12）；§13 体量实核（378 行）；§11 补 D-VM8 / D-VM9；§16 变更记录 +1 行；§2.3 引-1 补同部分跨层层前缀形态。
**连带**：`docs/vsc/requirements/WEBVIEW.md` 设计侧引用翻转为同层引用（R2 层前缀）+ §5.2 第 1 条收口。

**受影响文件（R24a · 本批）** ✗：

| # | 档 | 当前行数 | 预计增量 | 动作 |
|---|---|---|---|---|
| 1 | `docs/vsc/design/WEBVIEW.md` | 0（新建） | +262 | **新建**——结构与活动区面（源档 §1–§6 / §12–§14） |
| 2 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 0（新建） | +271 | **新建**——协议 / 秩序 / 忙态 / 状态行（源档 §4 / §7 / §8 / §14.3） |
| 3 | `docs/vsc/design/WEBVIEW-INPUT.md` | 0（新建） | +156 | **新建**——输入面 / 消息渲染契约（源档 §9 / §10 / §11） |
| 4 | `docs/vsc/design/VSC-MIGRATION.md` | 329 → 378 | +49 | **实修**——§4.1 / §6 / §7 / §9 / §10 / §11 / §12.1 / §13 / §16 |
| 5 | `docs/vsc/requirements/WEBVIEW.md` | 91 → 95 | +4 | **实修**——设计侧引用翻转 + §5.2 收口 + 变更记录 |
| 6 | `docs/batches/2026-09-15-vsc-doc-migration.md` | 55 → | +本段 §2 | **append**——§2（不改 §1；段内 append-only） |

**明列批外（本批零写入）** ✗：① 统一面 64 档（`docs/core/**`——与并行 CLI 批同文件竞争，父侧 2026-09-15 收紧）② 镜像面 3 条（既有裁定 = 原地保留不动）③ `scripts/**`（父侧工程工具面）④ `thincoder-vscode/**` 一字不改（含注释）⑤ 台账 / 提示词 / 核树 / CLI 树 ⑥ 不 commit、不发起评审。

**验收标准（逐条回指需求 · 机器可验）** ✗：A-VM9 三档在位且逐档 ≤500 行（实测 262 / 271 / 156；均 <300 软线）✓ · A-VM10 三档「不并项与历史沿革」节在场（逐项：旧档节 + 何故）+ 无状态行 / 无逐批流水 ✓ · A-VM11 坐标按现状实核（本批改写漂移 5 类，见 ⑦⑤）✓ · A-VM12 锚域一悬空 0 + 台账 0 + 一致性新增违规 0 ✓。

**三闸读数（改后 · 实跑）** ✗：`doc-anchors` 根域（含 `docs/vsc/**`）**73 档 · 候选 4794 · 悬空 0** · `OK(V5)` · exit 0；
`check-doc-width` **一致性新增违规 0**（V1 / V2 / V3 全绿）· 新增三档无 >300 字符单行（新增档内唯一 >300 行 = 表格行——判据豁免）· 逐档 ≤500 ——
**exit 1 唯一来源 = 本批次档 §2（批 1 已提交内容 3 行 >300，见 ⑦②）**；`check-ledger` 两档 `OK` · 0 处违规 · exit 0；`git status` 本批改动 = 5 档（3 新 + 2 修，全在 `docs/vsc/**`）✓。

**发现（逐条 · 不静默）** ✗：

- **① 源档与现状冲突 1 处（语义面 ⇒ 请主 agent 裁定）**：源档 §14 C-13 表「审批态 = VSC 无此状态（子代理不经权限门）· 端差登记（不做——无数据源）」↔ 现行实现**已实装**（`subagentApproval` 消息 → 块头 `⏸` + 态词 `等待审批: <tool>`：`thincoder-vscode/webview/activity-view.js:45` · `:75` · `activity.js:390` · `chat.js:288`）。
  本批处置 = **按现状落笔**（三档内口径一致，见 `WEBVIEW-PROTOCOL.md` §6.2 / 变更记录）；源档一字未改（历史）——**请父侧确认活档口径以现状为准**。
- **② 批次档 §2（批 1 · 已提交 `cfcf7d65`）3 行 >300 字符**（`:32` 335 · `:34` 349 · `:36` 355）⇒ 宽度闸**常红**（基线必须为空）。
  不在本批可改写面（§2 append-only，且非本批内容）⇒ **交父侧裁定**：建议对该 3 行纯折行（零文本变更）后重跑 —— 本批**未动**。
- **③ 工作树另有 3 处非本批改动**：`docs/TODO.md` · `scripts/check-doc-width.mjs` · `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md`（均非本批写入 —— 并行批 / 父侧工作树状态）⇒ `git status` 条目超出本批写域的原因**不在本批**。
- **④ 产品树旧档在 VSC 域锚检（**报告态**、非闸）内仍计悬空**（该域共 68 处，含 `subagent-panel.mjs:104` 类对端坐标）——产品树只读，随树降格批处置（本批不阻断）。
- **⑤ 源档坐标漂移（实核发现并已按现状改写）**：`refreshLiveHeaders` `375`→`379` · `panel-session` `clearMessages` `155`→`157` · `input.js` Enter / 下拉判据 `73/109-111`→`77/135-138` · `activity-view.js` `tailLines` `68-78`→`86-96` · `panel-chat.mjs` 行数 `499`→`497` · `chat.css` 离屏跳过 `471`→`474-475`（完整清单见报告）。

**未决（真判不准）** ✗：无（四类判据皆可判）；**唯一需人裁** = ⑦①（活档口径）与 ⑦②（批次档 §2 折行授权）。

> **折行注（2026-09-15 · eng-coder · 零语义）** ✗：本段 ⑦② 所列三行超宽（**折行前**编号 `:32` / `:34` / `:36`；335 / 349 / 355 字符）⇒ **仅插换行**（去空白后逐字节相同 ✓），文字一字未改 ✓ —— 宽度闸（`scripts/check-doc-width.mjs`）恢复绿面（改后复跑 = 0 行超限 ✓）。

**本批任务（B 式迁移轮 · VSC 第 3 批）** ✗：**统一面（P1）64 档「活 / 历史」复判** ✓ + **当场迁第一批（纯新建 ≤6 档）** ✓ —— 判与迁移同轮 ✓（禁纯统计空转 ✓）。

**范围内（本批覆盖的需求）** ✗：F-M7（64 档逐档复判 + 依据 + 动作）· F-M8（小计与 64 闭合）· F-M3（当场迁活档）· F-M4（落点档不含批次材料）· F-M5（坐标改现状路径并实核）· F-M9（并入清单逐条：内容 → 目标 core 档 → 拟插节 → 依据）· N-M1（判不准单列待核）· N-M2 / N-M3 / N-M5（三闸 + 写域）。
批 1 / 批 2 已闭合者（实点 / 二分底本 / 射程）本批**不重开**。

**① 复判（64 档逐档）** ✗：落 `docs/vsc/design/VSC-MIGRATION.md` §4.1（设计 50 档）+ §4.2（需求 34 档）——列义改 **判**（活 · 统一面 / 活 · 专有（P2）/ 历史 / 待核）与 **动作**（并入既有 / 新建 / 不迁（就地留）/ 另落 `docs/vsc/`）；列义与复判修订逐条依据 = 该档 §4.4。
**小计闭合（D3）** ✗：复判后 84 = 60（活 · 统一面）+ 6（活 · 专有）+ 16（历史）+ 2（待核已销项）✓；**64 档子集闭合** = 60 + 2（→历史）+ 2（→专有）= 64 ✓（设计 33 = 30+2+1 · 需求 31 = 30+0+1）——闭合算式落该档 §4.3。

**② 复判修订 4 条** ✗（逐条依据 = 该档 §4.4）：

| # | 档 | 原判 | 复判 | 依据（实核） |
|---|---|---|---|---|
| 1 | `design/ASYNC-RESULT-CONTAINER.md`（87） | 活 · 统一面 | **历史** | 机制结论已由 `docs/core/design/AGENT-LOOP.md` §6.7.3（`:332`）+ `:175`（`async-settle.mjs` helper 登记）承载；正文 = 施工骨架 ⇒ 就地留 |
| 2 | `design/SUBAGENT-OBSERVE-SEND.md`（79） | 活 · 统一面 | **历史** | 契约正文已由 `docs/core/design/AGENT-LOOP.md` §6.7.2（`:297`-`:311`）承载；正文 = 施工骨架 ⇒ 就地留 |
| 3 | `design/RELEASE.md`（202） | 活 · 统一面（→ core） | **活 · 专有（P2）** | 发布通道结构性只属本产品（Marketplace + Open VSX；对端 = npm）⇒ P5「P2 > P1」；CLI 同判（`docs/core/design/DOC-MIGRATION.md` §2.1 第 31 行） |
| 4 | `requirements/FEATURES.md`（21） | 活 · 统一面（→ core） | **活 · 专有（P2）** | v1 功能范围 = 产品面清单；CLI 同判（同上 §2.2 第 14 行） |

修订 1 / 2 的判据 = 二-2 本轮扩展形「**机制结论已由根层活档单源承载**」（两档正文主体 = 受影响文件 / 用例表 / 验收 / 变更流水）。

**③ 本批实迁（纯新建 · 6 档 · 三板块设计 / 需求成对）** ✗：取面判据 = 判为活档 ∧ `docs/core/` 无同话题档 ⇒ 纯新建（父侧 2026-09-15 01:49 口径）；源档**一字未改**（留参照历史）。

| # | 源档（`thincoder-vscode/**`·未改） | 行数 | 落点（新建 · 基准层活档） | 行数 |
|---|---|---|---|---|
| 1 | `docs/design/TURN-CAP-CONTINUE.md` | 208 | `docs/core/design/TURN-CAP-CONTINUE.md` | 129 |
| 2 | `docs/design/SEND-STALL-DISTILL-TUNING.md` | 137 | `docs/core/design/SEND-STALL-DISTILL.md` | 130 |
| 3 | `docs/design/ESCALATE.md` | 166 | `docs/core/design/ESCALATE.md` | 155 |
| 4 | `docs/requirements/TURN-CAP-CONTINUE.md` | 45 | `docs/core/requirements/TURN-CAP-CONTINUE.md` | 73 |
| 5 | `docs/requirements/SEND-STALL-DISTILL.md` | 40 | `docs/core/requirements/SEND-STALL-DISTILL.md` | 72 |
| 6 | `docs/requirements/ESCALATE.md` | 41 | `docs/core/requirements/ESCALATE.md` | 69 |

六档均含「不并项与历史沿革」节（(d) 类不并 + 不并项登记）· 无状态行 / 无逐批流水 / 无用例表 · 逐档 ≤300 行（均低于软线，无需拆分规划）。

**④ 并入清单（本批零写入 · 待父侧串行另派）** ✗：落该档 **§8B**（25 条 · 逐条 = 内容 → 目标 `docs/core/…` 档 → 拟插节 → 依据（实核））+ **§8A**（新建面剩余 18 档）。**本批对既有 `docs/core/**` 档零写入** ✓（`git status` 实核）。

**受影响文件（R24a · 实核）** ✗：新增 6 档（129 / 130 / 155 / 73 / 72 / 69 行）+ 实修 1 档（`docs/vsc/design/VSC-MIGRATION.md` 378 → 499 行：§4 / §6 / §7 / §8 / §9 / §10 / §12 / §13 / §16）+ 批次档 §2 append 1 处。**写域外零写入** ✓。

**明列批外（本批零写入）** ✗：① §8B 并入清单 25 条 + §8A 新建面剩余 18 档（`docs/core/**`——与并行 CLI 批同文件竞争 ⇒ 父侧串行）② `thincoder-vscode/**` 一字不改 ③ `thincoder-cli/**` / `thincoder-core/**` ④ `docs/cli/**` ⑤ `scripts/**` ⑥ 台账 / 提示词 ⑦ 不 commit、不发起评审。

**验收标准（逐条回指需求 · 机器可验）** ✗：A-VM13 逐档行「判」「动作」非空且取值在枚举内 + 复判修订逐条给依据（§4.4）✓ · A-VM14 小计 disjoint 加总 = 84 且 **64 档子集闭合**（§4.3）✓ · A-VM15 六档在位 / ≤500 行 / 含「不并项与历史沿革」/ 无状态行与流水 / 坐标按现状实核 ✓ · A-VM16 §8B 逐条四要素齐 + 既有 `docs/core/**` 零写入 ✓。

**三闸读数（改后 · 实跑）** ✗：
`check-ledger` → 两档 `OK` · **0 处违规** · exit 0 ✓。
`check-doc-width` → **一致性新增违规 0**（V1 / V2 / V3 全绿）· 本批 7 档**无 >300 字符非表格行**；exit 1 唯一来源 = **并行线未提交新档 2 行 >300**（`docs/core/design/ADVISOR-GUARDS.md:228` 515 字符 · `docs/core/design/LEDGER.md:190` 326 字符——**非本批写入**）。
`doc-anchors --domain .`（域一 = 本仓基根 · 92→99 档）→ 悬空 **46**（读数随并行线在写而变动：42 → 37 → 46）。
**逐行归属**：全部 46 行落在并行线**未提交**的新档内（`docs/core/design/{BATCH-RECORD,DOC-DISCIPLINE,ENGINEERING-MODE,LEDGER}.md` 的用例号锚 + `docs/core/requirements/TESTING.md` 的路径锚）；
**本批 6 档新档 + VSC-MIGRATION.md 悬空 = 0** ✓（本批曾自报 2 处悬空——`ESCALATE.md` 的裸档名坐标与跨仓用例号——**已就地修正**：改全路径 / 去字面编号）。

**发现（逐条 · 不静默）** ✗：

- **① 并行 CLI 批正在同一批目标上出新档（竞争已实证）**：本批收口时的 `git status` 显示其**未提交**新档 9 个——含 §8A 的 3 个目标（`docs/core/design/{ADVISOR-CONVERGENCE,ENGINEERING-MODE,LEDGER-SELF-CONTAINED}.md`）+ `docs/core/requirements/ENGINEERING-MODE.md` 等。⇒ 本批「新建 vs 并入」的取面判据（根层是否已有同话题档）**会被其写入翻转**；§8A 已加**时点声明**（出发点、非预留，落笔前逐档复查）。
- **② 域一锚闸转红（46 处）——全部为并行线未提交新档所产**：本批收口前该域为绿（批 2 记录 73 档 · 悬空 0）；本批自身贡献 0。详见三闸读数逐行归属。
- **③ 同一机制的结构性发现（供父侧裁定，非本批缺陷）**：**新档内的「用例号锚」若属对端产品域 ⇒ V5-B 悬空**（V5 引擎按 CLI 域解析用例标题）——并行线把 VSC 面档并入 `docs/core/` 时即触发（T-BR* / T-DD* / T-EM* / T-LG*）。本批规避法 = 不引字面跨仓编号（`ESCALATE.md` §8.1）。建议随 §8B 落笔统一处置口径。
- **④ 本批范围内的一致性修正（已当场修）**：批 1 §8「已有 core 同名活档 | **14**」的计数与枚举不符（枚举实为 24 项）⇒ 该节随本批重写为 §8A / §8B，**计数与枚举同改**（D3）。
- **⑤ 工作树另有 3 处非本批改动**：`docs/TODO.md` · `scripts/check-doc-width.mjs` · `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md`（均非本批写入 ⇒ `git status` 超写域条目的原因不在本批）。

**未决（真判不准 / 需人裁）** ✗：**3 条归属疑变**（该档 §7.1 · 判唯一而**归属变化 = 语义面** ⇒ 写稿方不自行定案）：
D1 `design/RELEASE.md` → `docs/vsc/design/`（P2）· D2 `requirements/FEATURES.md` → `docs/vsc/requirements/`（P2）·
D3 `requirements/AGENT-LOOP.md` 的 VSC 面需求节 → `docs/vsc/requirements/`（与 `docs/core/requirements/AGENT-LOOP.md` §5 `:129`-`:132` 自述相悖，**两读法均已登记**）。三条**本批零写入**。

**三闸读数（收口复跑 · 末次）** ✗：`
check-doc-width` → **OK(宽度)：扫描域全部 .md 无 >300 字符单行（372 文件）** · 一致性新增违规 0 · **exit 0** ✓
（前次读数所报并行线 2 行 >300 已由其自身消除；本段自身 2 行 348 / 343 字符**已折行**——零语义变更）·
`doc-anchors --domain .` → 悬空 **41**——**全部** = 并行线 5 个未提交新档的**用例号锚**（`docs/core/design/{BATCH-RECORD,DOC-DISCIPLINE,ENGINEERING-MODE,LEDGER,TESTING}.md`）；**本批 7 档贡献 0**（路径 / 坐标类悬空 = **0**）·
`check-ledger` → 0 处违规 · exit 0 ✓ ·
`git status` 本批 = 6 新档 + `docs/vsc/design/VSC-MIGRATION.md` + 批次档 §2 ✓（另 3 档 `docs/TODO.md` / `scripts/check-doc-width.mjs` / `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md` = **非本批写入**）。
**读数时点** ✗：域一读数随并行 CLI 批在写而变动（观测序列 42 → 37 → 46 → 41）——本批只对**自身 7 档**的读数负责（恒 0）。

**本批任务（B 式迁移轮 · VSC 第 4 批）** ✗：统一面**纯新建**（落笔时核层**无同话题档**者 · ≤6 档）✓ + `docs/vsc/design/VSC-MIGRATION.md` **§8A 收口**（逐档判 + 小计闭合）✓ —— 规划与迁移同轮 ✓。

**范围内（本批覆盖的需求）** ✗：F-M3（当场迁活档 + 逐档报「旧档 → 落点」）· F-M4（落点档不含批次材料 + 不并项逐项登记）·
F-M5（坐标改现状路径并实核）· F-M7 / F-M8（§8A 逐档判 + 小计闭合）· F-M9（并入面逐条）· N-M1（判不准单列）· N-M2 / N-M3 / N-M5（三闸 + 写域）。
批 1 / 批 2 / 批 3 已闭合者（实点 / 二分底本 / 射程 / 64 档复判）本批**不重开**。

**① 逐档「实核判 → 定名 → 落点 → 并入 K / 不并 J」（6 档）** ✗：

| # | 源档（`thincoder-vscode/**`·一字未改） | 行数 | 实核判（批 4 落笔时点） | 定名（承 `DOC-SYSTEM` §6） | 落点（基准层活档） | 落点行数 | 并入 K / 不并 J | 拆分规划 |
|---|---|---|---|---|---|---|---|---|
| 1 | `docs/design/DOC-CODE-RECONCILE.md` | 488 | 活 · 统一面（核层无同话题档——实核 `docs/core/design/`） | 同名（N-a / N-b） | `docs/core/design/DOC-CODE-RECONCILE.md` | 206 | K = 0（纯新建）· J = 8 个（§8.1 / §8.2） | 不需（206 < 300） |
| 2 | `docs/requirements/AGENT-PARAMS.md` | 42 | 同上（核层无同名需求档） | 同名 | `docs/core/requirements/AGENT-PARAMS.md` | 70 | K = 0 · J = 3 个 | 不需 |
| 3 | `docs/requirements/NORMAL-MODE.md` | 37 | 同上 | 同名 | `docs/core/requirements/NORMAL-MODE.md` | 73 | K = 0 · J = 3 个 | 不需 |
| 4 | `docs/requirements/MULTI-INSTANCE-COLLAB.md` | 44 | 同上 | 同名 | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` | 77 | K = 0 · J = 3 个 | 不需 |
| 5 | `docs/requirements/SETTINGS-TOOL.md` | 37 | 同上 | 同名 | `docs/core/requirements/SETTINGS-TOOL.md` | 71 | K = 0 · J = 3 个 | 不需 |
| 6 | `docs/requirements/STRUCTURE-DEBT.md` | 34 | 同上 | 同名 | `docs/core/requirements/STRUCTURE-DEBT.md` | 70 | K = 0 · J = 3 个 | 不需 |

**取名实核** ✗：六档落点 basename 与 `docs/core/{design,requirements}/` 既有档**零重名**（目录即命名空间——实核）✓；
**无「core 已有同话题档 ⇒ 并入面」者进入本批** ✓（六档均为纯新建）。K = 0 的口径 = 纯新建档无既有核层档可并（B 式「旧档一字不改 + 内容重建」）。
J 个 = 各档「不并项与历史沿革」节内逐条登记（旧档节 + 何故）——1 档 8 个（源档体量大、不并面多）· 5 档各 3 个。

**② `VSC-MIGRATION.md` §8A 收口 + 小计闭合** ✗：§8A 由「目标（新建）」表改为**逐档判表**（判 / 落点 / 去向 / 备注），18 档全数处置：

| 判 | 档数 | 内容 |
|---|---|---|
| **本批新建** | 6 | `DOC-CODE-RECONCILE`（设计）· `AGENT-PARAMS` · `NORMAL-MODE` · `MULTI-INSTANCE-COLLAB` · `SETTINGS-TOOL` · `STRUCTURE-DEBT`（需求） |
| **转并入既有** | 6 | 设计四档（`ADVISOR-CONVERGENCE` / `ENGINEERING-MODE` / `LEDGER-SELF-CONTAINED` / `TESTING`）+ 需求两档（`ENGINEERING-MODE` / `TESTING`）——**核层同名档已由并行 CLI 批建** ⇒ 取面判据翻转（VSC 面内容未并 ⇒ 转 §8B） |
| **纯新建（未落）** | 6 | 需求六档：`ADVISOR-CONVERGENCE` · `DESIGN-TOKEN-SETTLEMENT` · `ENG-TOKEN-BINDING` · `PORTABILITY` · `PROJECT` · `VERIFY-REDESIGN` |

**小计闭合（D3）** ✗：**18 = 6（本批新建）+ 6（转并入既有）+ 6（纯新建未落）** ✓（设计 5 = 1 + 4 + 0 · 需求 13 = 5 + 2 + 6）。
**§4 连带** ✗：§4.1 / §4.2 共 10 行「动作」列同步改判（6 行「已迁（批 4）」· 4 + 2 行「并入既有」）；§6 分批计划改批 4（已落）+ 批 5+（37 档）。

**③ 三闸读数（改后 · 实跑）** ✗：
`check-ledger` → `OK` 两档 · **0 处违规** · 基线 0 条 · exit 0 ✓。
`doc-anchors --domain .`（域一 = 本仓基根）→ 候选 **6164** · **悬空 0** · 注记豁免 202 · `OK(V5)` · exit 0 ✓（**本批 7 档贡献 0**）。
`check-doc-width` → 一致性 V1 / V2 / V3 **新增违规 0** · 基线 0 条 ✓；宽度面 **exit 1**——**唯一来源 = 并行线新档**（`docs/core/design/AGENT-LOOP-SUBAGENT.md`，02:10 建档 ⇒ **非本批写入**，见发现 ①）；
**本批 7 档**：新增档 6 档逐档 ≤300 行软线 · 逐档 ≤500 ✓；唯一 >300 字符行 = `AGENT-PARAMS.md` 的一张表行（**表格行豁免**）✓。
`git status`（workdir = `thincoder`）本批改动 = **7 档**（6 新 + `VSC-MIGRATION.md`）+ 批次档 §2 append ✓。

**④ 未决（需人裁 / 父侧授权）** ✗：

| # | 项 | 依据（实核） |
|---|---|---|
| 1 | **`VSC-MIGRATION.md` 越过 500 行硬限（560 行）⇒ 按规则必拆** — 拆分产物 = **新增档**（计划产物裸名 = `VSC-MIGRATION-INVENTORY.md`）⇒ **超出本批写域**（批 4 = 只建 `docs/core/**` 新档 + 本档实修） | 该档 §13（实核读数） |
| 2 | **`requirements/PROJECT.md` 归属疑变**（档内混装产品级定性与 VSC 专有面）⇒ 落点与切分属**归属面**（语义面） | 该档 §7.2 D4 |
| 3 | `docs/core/design/AGENT-PARAMS.md` 档头「需求侧 = 根层**无**对应档」句随本批新建需求档**已过期**（一行收正） | 该档 `:6`（本批零写入既有 core 档） |

**⑤ 发现（逐条 · 不静默）** ✗：

- **① 并行线在本批收口时新建 `docs/core/design/AGENT-LOOP-SUBAGENT.md`（02:10）**：其 1 行 >300 字符 ⇒ **宽度闸红面的唯一来源**（非本批写入）；本批自身宽度新增违规 = **0**。该档亦不在本批写域 ⇒ 本批**未动**。
- **② 并行 CLI 批已提交同话题核层档 ⇒ 6 档取面判据翻转**：设计四档 + 需求两档由「新建」转「并入既有」（§8A 已逐档标记）——本批按**落笔时点实核**判，不照抄出发点表 ✓。
- **③ `thincoder-vscode/scripts/reconcile-lookup.mjs:25` 反查域常量为迁移前目录**（`docs/design` + `docs/requirements`）⇒ 基准层改指 `docs/<部分>/…` 后**恒空输出**（登记于新档 `DOC-CODE-RECONCILE.md` §4；收正归父侧——`thincoder-vscode/**` 本批零写入）。
- **④ `docs/core/design/DOC-SYSTEM.md` §8.4 的外部参照面判据（E-1–E-4）未落**：判据句与两落点**已备**；其**预期承载面 = 本批新建的 `docs/core/design/DOC-CODE-RECONCILE.md`**（旧预期为产品树档）⇒ 落笔归父侧另派（本批**不夹带**未备内容）。
- **⑤ `docs/core/design/AGENT-PARAMS.md` 档头过期句**（见未决 3）——一行收正，父侧另派。
- **⑥ 既有 core 档 `docs/core/requirements/TURN-CAP-CONTINUE.md` 的 F3 行重复**（`:22` 与 `:26` 同名同行）——批 3 产物遗留；**本批不动既有 core 档**，登记待父侧。
- **⑦ `VSC-MIGRATION.md` §6 残留一行过期计划行**（`批 3+`「64 档分组并入」——已被 `批 4+` 行取代）——属**计划语义面**，本批只登记不删。
- **⑧ 本批范围内的一致性修正（已当场修 · 零语义）**：§7 表下**重复游离行**删除（与表内第 3 行逐字重复）· `相饳` → `相悖` 2 处 · §13 两行重复「实测行数」（486 / 499）合并为单行实测（560 并标硬限越线）。
- **⑨ 工作树另有 4 处非本批改动**：`docs/TODO.md` · `docs/batches/2026-09-14-doc-migration.md` · `scripts/check-doc-width.mjs` · `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md`（均非本批写入 ⇒ 超写域条目的原因不在本批）。

**⑥ 交付表** ✗：

| # | 需求点 | 状态 | 交付物 |
|---|---|---|---|
| 1 | ≤6 档新建（纯新建面） | ✅ Done | 6 档实体在位（206 / 70 / 73 / 77 / 71 / 70 行） |
| 2 | 逐档实核「活 ∧ core 无同话题档」 | ✅ Done | 六档逐档实核（见 ①；1 档换档说明见未决 2） |
| 3 | 定名不撞名（目录即命名空间） | ✅ Done | `docs/core/{design,requirements}/` 零重名（实核） |
| 4 | 落点档不含批次材料 / 含「不并项与历史沿革」 | ✅ Done | 六档均含该节 + 无状态行 / 无逐批流水 |
| 5 | 坐标改现状路径 + `file:line` 实核 | ✅ Done | 全量改写（`thincoder-vscode/**` · `thincoder-core/**` · `thincoder-cli/**` · `scripts/**`） |
| 6 | 不用例号 / 不引跨域试点编号 | ✅ Done | 六档零 `T-` 形字面编号（锚闸读数 = 悬空 0） |
| 7 | `VSC-MIGRATION.md` §8A 收口 + 小计闭合 | ✅ Done | §8A 逐档判表 + **18 = 6 + 6 + 6** + §4 / §6 / §9.4 / §10 / §12.3 / §13 / §16 连带 |
| 8 | 三闸（锚 0 / 宽度新增 0 / 台账 0） | ✅ Done（本批自身） | 见 ③（宽度闸红面 = 并行线新档，非本批） |
| 9 | 既有 `docs/core/**` 零写入 · `thincoder-vscode/**` 零改 | ✅ Done | `git status` 实核（本批 7 档 ⊆ 写域） |
| 10 | `VSC-MIGRATION.md` 逐档 ≤500 行 | ❌ Not done | 本档 560 行 > 500 硬限；拆分产物属新增档 = 超写域 ⇒ **请父侧授权另派**（未决 1） |

**变更记录** ✗：- 2026-09-15（**B 式迁移轮 · VSC 第 4 批** · eng-designer）：§2 建档——统一面纯新建 6 档 + §8A 收口（小计闭合 18 = 6 + 6 + 6）。

**本批任务（B 式迁移轮 · VSC 第 5 批——重派）** ✗：§8A 剩余纯新建（需求 6 档 · 逐档落笔时点实核 ✓）+ `docs/vsc/design/VSC-MIGRATION.md` **拆分**（560 行 > 500 硬限 ✓）+ §8A / §4 / §6 批 5 更新与小计闭合 ✓。

**范围内（本批覆盖的需求）** ✗：F-M3（当场迁活档 + 逐档报「旧档 → 落点」）· F-M4（落点档不含批次材料 + 不并项逐项登记）· F-M5（坐标改现状路径并实核）· F-M7 / F-M8（§8A 逐档判 + 小计闭合）· F-M9（并入面逐条——ADVISOR-CONVERGENCE 转 §8B-26）· N-M1（判不准单列——本批零判不准）· N-M2 / N-M3 / N-M5（三闸 + 写域）。批 1–4 已闭合者不重开。

**① 逐档「实核判 → 落点 → 并入 K / 不并 J」（§8A 剩余 6 档 · 落笔时点 = 2026-09-15 03:0x 实核）** ✗：

| # | 源档（`thincoder-vscode/**`·一字未改） | 行 | 实核判（落笔时点） | 落点 | 落点行 | 并入 K / 不并 J |
|---|---|---|---|---|---|---|
| 1 | `requirements/ADVISOR-CONVERGENCE.md` | 57 | **转并入既有**——目标 `docs/core/requirements/ADVISOR-CONVERGENCE.md` 已由并行 CLI 批建并提交（其 `:8` / §7 登记「VSC 端对位面不并入，触发 = VSC 轮」） | **跳过新建** ⇒ §8B-26 | — | K = 0 · J = 0（本批零写入该档——不覆盖他线产物 ✓） |
| 2 | `requirements/DESIGN-TOKEN-SETTLEMENT.md` | 42 | 活 · 核层无同名档（实核目录） | `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md` | 74 | K = 0（纯新建）· J = 5 个（§6.1 / §6.2） |
| 3 | `requirements/ENG-TOKEN-BINDING.md` | 48 | 同上 | `docs/core/requirements/ENG-TOKEN-BINDING.md` | 73 | K = 0 · J = 5 个 |
| 4 | `requirements/PORTABILITY.md` | 51 | 同上 | `docs/core/requirements/PORTABILITY.md` | 77 | K = 0 · J = 5 个 |
| 5 | `requirements/VERIFY-REDESIGN.md` | 34 | 同上（设计侧 `docs/core/design/VERIFY-REDESIGN.md` 在位） | `docs/core/requirements/VERIFY-REDESIGN.md` | 65 | K = 0 · J = 3 个 |
| 6 | `requirements/PROJECT.md` | 118 | 活 · 档内混装（§7.2 D4）⇒ **拆分双落**（父侧任务书裁定） | `docs/core/requirements/PROJECT.md`（83 行 · 定性面）+ `docs/vsc/requirements/PROJECT.md`（72 行 · VSC 专有面） | 83 / 72 | K = 0 · J = 各 3 个（两档各有「不并项与历史沿革」） |

**PROJECT 处置与依据** ✗：切分规则 = **跨产品契约（与 CLI 共享磁盘文件 / 协议 / 行为对齐）⇒ core；仅本端实现 / 界面 / 宿主面 ⇒ vsc**。
逐条归属落两产物档「不并项与历史沿革」节（core 档 §5.2 给切分规则与去向表；vsc 档 §4.2 给反向登记）。**无判不准项**（决策表 11 行 + 待决策 7 项 + 时序节逐条可判）——Session 标题 / MODEL_SPECS / LLM 调用等边界行按「档内自述为本端决策、无跨端契约语义 ⇒ VSC 专有面」判定，判据同写于 core 档 §5.2。

**② `VSC-MIGRATION.md` 拆分（批 4 未决 1 落）** ✗：切面 = 台账面整体移出（承 §13 候选①扩形）——
§3 实点 / §4 二分表 / §5 历史档 / §8 待另批 / §9 实迁记录 / §10 受影响文件 / §11 关键决策 / §12 验收标准 / §13 体量 / §14 用例表 / §15 边界 ⇒ 新档
**`docs/vsc/design/VSC-MIGRATION-INVENTORY.md`**（节号承原号，§8B-1 类指针不断）；主档只留 判据（§1 / §2）/ 分批计划（§6）/ 待裁（§7）/ 变更记录。
**两档行数（实核）**：主档 **132** · INVENTORY **484** ——均 ≤500 ✓；拆分登记写进两档头注 ✓。

**③ §8A / §4 / §6 更新 + 小计闭合（D3）** ✗：
§8A 重写为批 5 收口表（14 行逐档）——**小计闭合：18 = 6（批 4 新建）+ 7（转并入既有——含批 5 翻转的 ADVISOR-CONVERGENCE）+ 4（批 5 新建）+ 1（批 5 拆分双落——源档 1 档 / 产物 2 档）** ✓
（设计 5 = 1+4+0 · 需求 13 = 5+3+4+1）。**§8A 闭合**——新建面无剩余。
§4.2 六行同步：ADVISOR-CONVERGENCE 转「并入既有（§8B-26）」· 四行「已迁（批 5）」· PROJECT「已迁（批 5）——拆分双落」；
§8B +1 条（26 条——ADVISOR-CONVERGENCE VSC 端对位面 F-A1–F-A12 / N-A1–N-A6 + 端差登记四条 ⇒ `docs/core/requirements/ADVISOR-CONVERGENCE.md` 新增「VSC 端对位面」节）；
§6 加批 5 行（已落）+ 批 6+ 行（§8B 26 条 + 待裁 D1–D3）；**批 4 发现 ⑦ 的过期「批 3+」行并入「批 6+」行收正**（计划行被取代——当场修，零语义）。
§7.2 D4 标「批 5 已裁定并执行」（销项——父侧任务书裁定）；§9.5 / §10 批 5 / §11 D-VM10–D-VM11 / §12.4 A-VM21–A-VM26 / §13 拆分实落。

**④ 三闸读数（改后 · 实跑）** ✗：
`check-ledger` → 两档 `OK` · **0 处违规** · 基线 0 条 · exit 0 ✓。
`check-doc-width` → **OK（宽度）**：扫描域 399 文件无 >300 字符单行 · **一致性 V1/V2/V3 新增违规 0** · 基线 0 · exit 0 ✓（本批曾自产 2 条 V1 违规——`TESTING.md §8.1` 裸名锚 + 「本档 §2」无节引用——**已当场修**：改 `TESTING（VSC 侧）§8.1` 引-2 形态 / 「批次档 §2」）。
`doc-anchors`（域一 = 本仓基根 · 123 档）→ 候选 7126 · **悬空 0** · 注记豁免 252 · `OK(V5)` · exit 0 ✓（**本批 8 档贡献 0**——本批曾自产 8 处 V5-A 悬空：变更记录内旧坐标字面形 ×4 · 旧树归位档路径 ×2 · PORTABILITY 缩写路径 ×2——**已当场修**：改仓根全路径 / 非锚叙述形）。
**域二（CLI 树域 · 99 档）→ FAIL 1 条**：`docs/design/TWO-REPO-MERGE.md:404` 引 `DOC-CODE-RECONCILE.md:98`——CLI 树档，**非本批写域、非本批写入**（如实报；建议随 CLI 线收正）。
`git status`（workdir = `thincoder`）本批改动 = **8 项**（新建 7 档：5 core 需求档 + INVENTORY + vsc PROJECT · 实修 1 档：`docs/vsc/design/VSC-MIGRATION.md`）+ 批次档 §2 append ✓ ⊆ 写域；
另 `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md` 改动 = **非本批写入**（前批已登记的父侧 / 并行工作树状态）。

**⑤ 未决（真判不准）** ✗：**无**——PROJECT 切分逐条可判（判据句落档）；§7.1 待裁 D1–D3（RELEASE / FEATURES / AGENT-LOOP 需求节归属）= 批前已登记的开放裁定项，**不属本批新产出**，仍待父侧定判（批 5 零写入）。

**⑥ 交付表** ✗：

| # | 需求点 | 状态 | 交付物 |
|---|---|---|---|
| 1 | §8A 剩余纯新建逐档实核落笔（≤6 档） | ✅ Done | 4 档新建在位（74 / 73 / 77 / 65 行）+ PROJECT 拆分双落（83 / 72 行） |
| 2 | ADVISOR-CONVERGENCE 已建 ⇒ 转并入或跳过并写明 | ✅ Done | 跳过新建（不覆盖他线产物）· §8B-26 登记 + §4.2 / §8A 同步 |
| 3 | PROJECT 按实测拆（定性 ⇒ core · VSC 专有 ⇒ vsc；判不准 ⇒ 停报） | ✅ Done | 双落 + 切分规则与逐条归属落档；零判不准 |
| 4 | 已存在目标不覆盖他线产物 | ✅ Done | 既有 `docs/core/**` 档零写入（`git status` 实核） |
| 5 | B 式（旧档一字不改）· 剔料 · (d) ⇒ 不并项节 | ✅ Done | 6 档源档零改；各落点档含「不并项与历史沿革」· 无状态行 / 无逐批流水 |
| 6 | 坐标改现状路径 + 实核 · 不引 `T-` 形跨域用例号 | ✅ Done | 全量仓根路径 + 逐条实核（漂移 2 类按现状改写）；6 档零 `T-` 形编号（锚闸 0） |
| 7 | `VSC-MIGRATION.md` 拆分 · 两档 ≤500 · 拆分登记两档 | ✅ Done | 主档 132 / INVENTORY 484（实核）· 登记写进两档头注 |
| 8 | §8A / §4 / §6 批 5 更新 + 小计闭合 | ✅ Done | **18 = 6 + 7 + 4 + 1** ✓（§8A 闭合）；§6 过期行收正 |
| 9 | 三闸（域一锚 0 / 宽度新增 0 / 台账 0）· 逐档 ≤500 · `git status` ⊆ 写域 | ✅ Done | 见 ④（域二 FAIL 1 条 = CLI 树档，非本批——如实报） |
| 10 | 不 commit · 不发起评审 · 写域外零写入 | ✅ Done | 全程未 commit；`docs/cli/**` / `scripts/**` / 产品树 / 核树 / 台账 / prompts 零写入 |

**变更记录** ✗：- 2026-09-15（**B 式迁移轮 · VSC 第 5 批** · eng-designer）：§2 append——§8A 剩余纯新建 5 档（含 PROJECT 拆分双落）+ ADVISOR-CONVERGENCE 转 §8B-26 + `VSC-MIGRATION.md` 拆分（主档 132 / INVENTORY 484）+ §8A 闭合（18 = 6 + 7 + 4 + 1）。

**本批任务（B 式迁移轮 · VSC 第 6 批）**：§8B 并入清单**第一批（8 条）**逐条对账合并 ✓ + 台账 `VSC-MIGRATION-INVENTORY.md` §8B 收口 ✓ + 批前已定裁定随批落笔（D1 / D2 / D3——出处 = 父侧 02:0x 裁决）✓。

**范围内（本批覆盖的需求）**：F-M9（并入面逐条：内容 → 目标 core 档 → 落节 → 实核）· F-M4（落点档不含批次材料 + (d) 类不并逐项入各档「不并项」节）· F-M5（坐标改现状路径 + `file:line` 实核）· F-M3（逐档报「源档 → 落点」）· N-M2 / N-M3 / N-M5（三闸 + 写域 + 逐档 ≤500）。批 1–5 已闭合者不重开。

**① 取材清单（§8B 取 8 条 · 逐条实核目标现态）**：

| 清单号 | 源档（VSC 树·一字未改） | 实核（目标 core 档现态） | 处置 |
|---|---|---|---|
| 2 | `design/AGENT-PARAMS-TUNING.md`（114） | `docs/core/design/AGENT-PARAMS.md` = 批 3 CLI 版；§8.2 己登「30 硬帽归 VSC 轮」、VSC 面缺 | **并入**（§4 注 + §6.3） |
| 3 | `design/ARCHITECTURE.md`（266） | 目标 = 批 2 CLI 版；`:6` 明载「VSC 轮并入本档」、VSC 模块地图与差异表缺 | **并入**（§3.1 + §4.1） |
| 5 | `design/PORTABILITY.md`（458） | 目标 = 批 2 CLI 版；`:6` 明载「VSC 端镜像——VSC 轮并入本档」、VSC 面缺 | **并入**（§3.6 + §5 测试面） |
| 15 | `design/TOOL-OUTPUT-LIMITS-TUNING.md`（139） | 目标 = 批 3 CLI 版；§6.2 登「VSC 树档未迁」、VSC 坐标缺 | **并入**（§6.3） |
| 16 | `design/ENG-TOKEN-BINDING-TUNING.md`（115） | 目标 = 批 3 CLI 版；VSC 载体未并 | **并入**（§6.3） |
| 17 | `design/DESIGN-TOKEN-SETTLEMENT.md`（109） | 目标 = 批 3 CLI 版；§6.2 双端差异已述、VSC 根因面缺 | **并入**（§6.3） |
| 19 | `requirements/MEMORY.md`（50） | 目标 = 拆轮需求档；§5 明载「VSC 端条目 · 触发 = §8B-19」 | **并入**（§4.7） |
| 22 | `requirements/TOOL-OUTPUT-LIMITS.md`（47） | 目标 = `requirements/TOOLS.md`（批 5 已并 CLI 面 §4.5）；VSC 端独有条目缺 | **并入**（§4.5「VSC 端显示层条目」FR-V1 / FR-V2——共享条目不重并） |

**跳过并写明**：#18（§7.1 D3——**维持现状**：VSC 面需求节留 core 档 §5 内 · 结构变更非本批题）· #25（§7.1 D2——**VSC 专有面**：另落 `docs/vsc/requirements/`，非 core 并入项）· #4 / #7（目标 = PROVIDER 两档——他线在写 · 本批跳过留待下批）。

**② 并入逐节（源节 → 目标落位）+ 行数前 → 后**：

| 目标档 | 源节 | 落位 | 行数 前 → 后 |
|---|---|---|---|
| `docs/core/design/AGENT-PARAMS.md` | 旧档 §1–§4（四参数）+ 现码核对 | §4 注 + §6.3 VSC 端接线表（8 面实核） | 123 → 142 |
| `docs/core/design/ARCHITECTURE.md` | 旧档 §3 模块地图 / §4 差异表 | §3.1 壳层装配地图 + §4.1 差异表 + VSC 专属取向 | 151 → 196 |
| `docs/core/design/PORTABILITY.md` | 旧档批次二机制面（分类权威 / 注入 / 索引 / 文案） | §3.6 VSC 端镜像面 + §5 测试 3 行 | 161 → 183 |
| `docs/core/design/TOOL-OUTPUT-LIMITS.md` | 旧档 §2 现行设计（含 §2.9 read 双端） | §6.3 VSC 端实现坐标（11 面实核） | 143 → 165 |
| `docs/core/design/ENG-TOKEN-BINDING.md` | 旧档 §3–§5（TTL / 生命周期 / 落点） | §6.3 VSC 端接线表（9 面实核——结算面指回 DTS §6.3，D2） | 124 → 145 |
| `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 旧档 §1 根因 + D1–D6 | §6.3 VSC 端结算接线表（8 面实核 + 差异注） | 126 → 146 |
| `docs/core/requirements/MEMORY.md` | 旧档 §1–§4（F-M1–F-M7 / N-M1–N-M4 / 端差登记） | §4.7 VSC 端需求条目（governing 上覆 = §2.1 归一方向） | 139 → 173 |
| `docs/core/requirements/TOOLS.md` | 旧档 FR4 / FR5 + webview DOM 上限 | §4.5「VSC 端显示层条目」FR-V1 / FR-V2 | 115 → 123 |
| `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` | —（台账面） | §8B 八行已并入 + #18/#25 销项 + 收口句 + §4 三行裁定 + §9.6 实迁记录 + §13 体量 | 484 → 500 |

**③ §8B 收口（小计闭合 · D3）**：26 = **8（批 6 已并入——#2 / #3 / #5 / #15 / #16 / #17 / #19 / #22）** + **16（未并 · 待后续批——#1 / #4 / #6 / #7 / #8 / #9 / #10 / #11 / #12 / #13 / #14 / #20 / #21 / #23 / #24 / #26）** + **2（裁定销项——#18 D3 · #25 D2）** ✓。**剩 16 条可并**（另 2 条销项不再并；#4 / #7 待 PROVIDER 线完工）。

**④ 三闸读数（改后 · 实跑）**：
`doc-anchors --domain .`（125 档）→ 候选 7621 · **悬空 0** · `OK(V5)` · exit 0 ✓（本批曾自产 2 处 V5-A 悬空——`config-io.mjs:26` / `run.mjs:19` 裸相对坐标——**已当场修**：补仓根前缀）。
`check-doc-width` → **OK（宽度）**：402 文件无 >300 字符单行 · **一致性 V1/V2/V3 新增违规 0** · 基线 0 · exit 0 ✓（本批曾自产 5 行 >300 非表格行——**已当场折行**：零语义）。
`check-ledger` → 两档 `OK` · **0 处违规** · 基线 0 · exit 0 ✓。
`git status` 本批 = **9 档**（8 core 并入档 + `VSC-MIGRATION-INVENTORY.md`）⊆ 写域 ✓；另 `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md` · `thincoder-vscode/scripts/reconcile-lookup.mjs` = **非本批写入**（工作树既有 / 父侧收正或并行线——如实报）。

**⑤ 发现（逐条 · 不静默）**：

- **① 源档坐标漂移 5 类（实核发现并已按现状收正）**：评审超时默认/检查点 `src/advisor/run.mjs` → `advisor/compaction.mjs:33` + `advisor/loop.mjs:98`（run.mjs:19 现为 re-export）；面板保存 `src/config-io.mjs` → `extension/settings-panel-write.mjs:45`（config-io re-export）；设计门禁 → `agent/tool-gates.mjs:78` / `:97`（非 execute-tools）；
  恢复过滤 `src/agent/setup.mjs` → `agent/agent-state.mjs:53/:58/:63`；`setup.mjs` 现行为 200 初始 + `?? 200` 兜底（与旧档描述一致但行号漂移——按现状落笔）。
- **② 一致性修正（本批当场修 · 报告）**：8 档中 4 档**需求侧头注过期**（AGENT-PARAMS / ENG-TOKEN-BINDING / DESIGN-TOKEN-SETTLEMENT「根层无对应档」→ 批 4/批 5 已建；TOOL-OUTPUT-LIMITS「未迁」→ 批 5 已并入 §4.5）——随本批落笔收正；ARCHITECTURE / PORTABILITY「双端对位 = 未迁」行 → 已并入；各档 §8「归 VSC 轮」登记录 → 已并入。
- **③ 台账越线收回**：`VSC-MIGRATION-INVENTORY.md` 并入后曾达 503 行 > 500 硬限 → 压缩 §9.6 + §13 归并为 500 行（§13 标注同步）。
- **④ 工作树 2 处非本批改动**：`thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md`（前批已登记）· `thincoder-vscode/scripts/reconcile-lookup.mjs`（本批未触碰——疑似父侧收正批 4 发现③ —— 非本批写入）。

**⑥ 未决（真判不准）**：**无**——(a/b/c/d) 四类对账 + 归属裁定皆可判。§8B 剩余 16 条 + 主档 `VSC-MIGRATION.md`（写域外）§7.1 销项行 / 变更记录随后续批由父侧落笔。

**⑦ 交付表**：

| # | 需求点 | 状态 | 交付物 |
|---|---|---|---|
| 1 | §8B 并入 ≤8 条 · 逐条实核（目标现态为准） | ✅ Done | 8 条并入（见 ①）——未照抄拟插节、均按目标现态落位 |
| 2 | PROVIDER 目标条目本批跳过 | ✅ Done | #4 / #7 留待下批（落笔时点实核——他线在写） |
| 3 | D1 / D2 / D3 批前裁定随批落笔 | ✅ Done | #18 销项（D3 维持现状）· #25 销项（D2 另落 vsc）· §4 三行标记（RELEASE / AGENT-LOOP / FEATURES） |
| 4 | 逐节对账 (a)(b)(c) 并入 · (d) 入各档「不并项」节 | ✅ Done | 8 档均 (d) 类 / 批次材料逐条登记 |
| 5 | 坐标改现状路径 + `file:line` 实核 | ✅ Done | 全量实核 + 漂移 5 类收正（发现①）+ 裸坐标补仓根前缀 |
| 6 | 零 `T-` 形跨域用例号 · 逐档 ≤500 | ✅ Done | 并入后 core 档 123–196 · 台账 500——均 ≤500 ✓ |
| 7 | §8B 收口 + 剩余条数 + 小计闭合 | ✅ Done | 26 = 8 + 16 + 2（§8B 收口句）+ §9.6 + §13 体量同步 |
| 8 | 三闸（锚 0 / 宽度新增 0 / 台账 0）· `git status` ⊆ 写域 | ✅ Done | 见 ④ |
| 9 | 不 commit · 不发起评审 · 写域外零写入 | ✅ Done | 未 commit；`thincoder-vscode/**` / `scripts/**` / `docs/cli/**` / 台账 / prompts 零写入 |

**变更记录**：- 2026-09-15（**B 式迁移轮 · VSC 第 6 批** · eng-designer）：§2 append——§8B 并入第一批 8 条（core 六设计 + 两需求）+ D2/D3 裁定销项 2 条 + 台账收口（26 = 8 + 16 + 2）+ 三闸全绿（锚 0 · 宽度 0 新增 · 台账 0）。

**本批任务（B 式迁移轮 · VSC 第 7 批 = §8B 并入批 2 · 8 条）**：§8B 并入清单第二批逐条对账合并 ✓ + 台账 `VSC-MIGRATION-INVENTORY.md` §8B 收口 ✓ + PHILOSOPHY 侧销项实核 ✓。

**范围内（本批覆盖的需求）**：F-M9（并入面逐条：内容 → 目标 core 档 → 落节 → 实核）· F-M4（落点档不含批次材料 + (d) 类不并逐项入各档「不并项」节）· F-M5（坐标改现状路径 + `file:line` 实核）· F-M3（逐档报「源档 → 落点」）· N-M2 / N-M3 / N-M5（三闸 + 写域 + 逐档 ≤500）。批 1–6 已闭合者不重开。

**① 取材清单（§8B 取 8 条 · 逐条实核目标现态）**：

| 清单号 | 源档（VSC 树·一字未改） | 实核（目标 core 档现态） | 处置 |
|---|---|---|---|
| 6 | `design/SESSION.md`（520） | core SESSION.md 311 行；§6.15 缺 VSC 面板装配面 | **并入**（§6.15 + D-SE27–30 + 不并项 4 行） |
| 8 | `design/MEMORY.md`（325） | core MEMORY.md 334 行；§6.9 缺 VSC 端实现面 | **并入**（§6.9 + D-MEM14–15 + 不并项 3 行 + §9 拆分表 +1） |
| 9 | `design/CONTEXT-COMPACTION.md`（146） | core 档 225 行；§6.13 缺 VSC 接线面 | **并入**（§6.13 + D-CC17 + 不并项 1 行） |
| 10 | `design/MCP.md`（170） | core MCP.md 194 行；§6.10 缺 VSC 面板页 | **并入**（§6.10 + D-MC16 + 不并项 1 行） |
| 11 | `design/CHECKPOINT.md`（105） | core 档 185 行；§6.9 缺 VSC 接线面 | **并入**（§6.9 + D-CP10 + 不并项 1 行） |
| 12 | `design/CONSULTATION.md`（161） | core 档 235 行；§6.5 缺 VSC 端级接线 | **并入**（§6.5 + D-CO7 + 不并项 1 行） |
| 24 | `requirements/{PHILOSOPHY 136, RELEASE 42}` | core RELEASE.md 68 行缺 VSC 双市场通道面；core PHILOSOPHY.md 212 行为 VSC 版超集 | **RELEASE 并入**（§5 V-F1–F5 / V-N1–V-N3）· **PHILOSOPHY 销项零并入**（VSC 版 = 旧措辞子集——§7.2 已核登记） |
| 26 | `requirements/ADVISOR-CONVERGENCE.md`（57） | core req 档 172 行；§8 缺 VSC 端对位面 | **并入**（§8 F-A1–F-A12 / N-A1–N-A6 + §8.3 端差四条；档头「不并入」声明 + §7.2 三行销项） |

**跳过并写明**：#4 / #7（目标 = PROVIDER 两档——**他线在写**（peer_instances 在册）· 本批跳过留待下批）· #18 / #25（批 6 已销项 D3 / D2 不重取）。

**② 并入逐节（源节 → 目标落位）+ 行数前 → 后**：

| 目标档 | 源档 | 落位 | 行数 前 → 后 |
|---|---|---|---|
| `docs/core/design/SESSION.md` | 旧档 §5–§7 / §9–§10（VSC 面板装配接线面） | §6.15（切换守卫 / turnSlot / 绑定入口三处 / 字段往返与 setSlot\* / 标题 A2 / 懒历史分页 / 注入序） | 311 → 364 |
| `docs/core/design/MEMORY.md` | 旧档 §1–§3 · §4（文件制存储 / 索引有效性） | §6.9（现状登记 + B1–B4 + 工具端差）· D-MEM14–15 | 334 → 366 |
| `docs/core/design/CONTEXT-COMPACTION.md` | 旧档 §1–§8（接线 / 可见性 / 边界） | §6.13（判定点封装 / 基线 / 预算端差 / REVERSE 坐标 / webview 四态 / 失败可见化 / 非压缩职责边界） | 225 → 252 |
| `docs/core/design/MCP.md` | 旧档 §2–§8（面板页 / 装配 / 探活） | §6.10（无 /mcp 命令面端差 / config-mcp 读写 / depth-0 装配 / 命连接 / 生命周期 / 代配差异） | 194 → 221 |
| `docs/core/design/CHECKPOINT.md` | 旧档 §2–§4（触发 / 恢复输出 / 只读分类） | §6.9（触发点坐标 / 恢复输出契约 / 只读分类） | 185 → 212 |
| `docs/core/design/CONSULTATION.md` | 旧档 §2.4（端级接线表） | §6.5（子 agent 构建 / runner / 只读工具集 / 注册 / 容器 / digest / 驱动中止 / 动作域 / 面板） | 235 → 257 |
| `docs/core/requirements/RELEASE.md` | 旧档 F1–F5 / N1–N4（双市场通道） | §5 VSC 端通道面（V-F1–V-F5 / V-N1–V-N3）+ §6 不并项 | 68 → 83 |
| `docs/core/requirements/PHILOSOPHY.md` | —（销项） | §7.2 VSC 侧同名档登记销项（已核零并入） | 212 → 212 |
| `docs/core/requirements/ADVISOR-CONVERGENCE.md` | 旧档 F-A1–F-A12 / N-A1–N-A6 | §8 VSC 端对位面 + §8.3 端差四条；档头 / §7.2 销项 | 172 → 218 |
| `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` | —（台账面） | §8B 八行尾注 + 批 7 收口 + §9.7 + §10 批 7 + §12.5 A-VM27–30 + §13 | 499 → 490（含 §10 历史批五表归并压缩） |

**③ §8B 收口（小计闭合 · D3）**：26 = **8（批 6 已并入）** + **8（批 7 已并入——#6 / #8 / #9 / #10 / #11 / #12 / #24 / #26）** + **8（未并 · 待后续批——#1 / #4 / #7 / #13 / #14 / #20 / #21 / #23）** + **2（裁定销项——#18 D3 · #25 D2）** ✓。剩 8 条可并（#4 / #7 待 PROVIDER 线完工）。

**④ 三闸读数（改后 · 实跑）**：
`doc-anchors --domain .`（125 档）→ 候选 7800 · **悬空 0** · `OK(V5)` · exit 0 ✓（本批曾自产 14 处 V5-A 悬空——`git-ext.mjs:55` 类**裸档名坐标**——**已当场修**：补仓根前缀 `thincoder-vscode/src/...`；全域第二域（CLI 树档面 docs/design + docs/requirements）读数 = 非本批写域——**如实报**）。
`check-doc-width` → **OK（宽度）**：402 文件无 >300 字符单行 · **一致性 V1/V2/V3 新增违规 0** · 基线 0 · exit 0 ✓（本批曾自产 21 行 >300 + 5 处 V1「本批次档 §2」——**已当场修**：折行 / 改「批次档 §2」）。
`check-ledger` → 两档 `OK` · **0 处违规** · 基线 0 · exit 0 ✓。
`git status` 本批 = **9 档**（8 目标 core 档 + `VSC-MIGRATION-INVENTORY.md`）⊆ 写域 ✓；另 `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md` · `thincoder-vscode/scripts/reconcile-lookup.mjs` = **非本批写入**（工作树既有 / 并行线——如实报）。

**⑤ 发现（逐条 · 不静默）**：

- **① 并行实例在写（peer_instances 在册）**：§8B #4 / #7（PROVIDER 目标）落笔时点实核 = **他线在写** ⇒ 本批跳过、留待下批 ✓（取材纪律——让先到者，不抢）。
- **② 源档坐标漂移 0 类**：本批引用的 VSC 坐标（`panel-session.mjs` · `session-slot-write.mjs` · `history-window.mjs` ·
  `indexer.mjs` · `compact.mjs` · `panel-callbacks.mjs` · `setup-reminders.mjs` · `git-ext.mjs` · `shell.mjs` ·
  `git-checkpoint.mjs` · `consult.mjs` · `config-mcp.mjs` · `panel-mcp.mjs`）全部按现状实核落笔、未现漂移。
> 折行注（父侧 · 零语义）：本行原 303 字符超宽度闸 ⇒ 仅插换行、文字零改 ✓（2026-09-15）
- **③ 台账越线收回**：INVENTORY 批 7 更新曾达 **533 行 > 500 硬限** ⇒ §10 历史批（批 1–5）五张明细表**归并为汇总行**（明细完整保留于批次档 §2——D2 不重复）→ 压缩后 **490 行** ✓。
- **④ PHILOSOPHY 销项实核**：VSC 版（135 行）构图 = 世界观 6 / 人生观 5 / 价值观 4 / 方法论 2——全部被 core 版（212 行）超集承载（core 版含「说了就要做到 / 做到最好 / 交付透明 / 拆解与交代」等后续补充）⇒ **零并入**（§7.2 已核登记；不硬造并入内容）。
- **⑤ 一致性修正（本批当场修 · 报告）**：AINVENTORY 打字「本批次档」→「批次档」（V1 5 处）· §9.7 / §10 / A-VM27 行数终核（折行修复后读数更新为 364 / 366 / 252 / 221 / 212 / 257 / 83 / 218）。

**⑥ 未决（真判不准）**：**无**——(a/b/c/d) 四类对账 + 隶属皆可判；§8B 剩余 8 条（#1 / #4 / #7 / #13 / #14 / #20 / #21 / #23）+ 主档 `VSC-MIGRATION.md`（写域外）变更记录由父侧后续批落笔。

**⑦ 交付表**：

| # | 需求点 | 状态 | 交付物 |
|---|---|---|---|
| 1 | §8B 并入 ≤8 条 · 逐条实核（目标现态为准） | ✅ Done | 7 档并入 + PHILOSOPHY 销项零并入（见 ①）——未照抄拟插节、均按目标现态落位 |
| 2 | PROVIDER 目标条目本批跳过 | ✅ Done | #4 / #7 留待下批（落笔时点实核——他线在写，让先到者不抢） |
| 3 | 逐节对账 (a)(b)(c) 并入 · (d) 入各档「不并项」节 | ✅ Done | 7 档均 (d) 类 / 批次材料逐条登记（含 MEMORY 文件制存储 = 已裁归一 (d) 类） |
| 4 | 坐标改现状路径 + `file:line` 实核 | ✅ Done | 全量实核 + 14 处裸坐标补仓根前缀（发现问题即报告） |
| 5 | 零 `T-` 形跨域用例号 · 逐档 ≤500 | ✅ Done | 并入后 core 档 83–366 · 台账 490——均 ≤500 ✓ |
| 6 | §8B 收口 + 剩余条数 + 小计闭合 | ✅ Done | 26 = 8 + 8 + 8 + 2（§8B 批 7 收口句）+ §9.7 + §10 批 7 + §12.5 + §13 |
| 7 | 三闸（锚 0 / 宽度新增 0 / 台账 0）· `git status` ⊆ 写域 | ✅ Done | 见 ④ |
| 8 | 不 commit · 不发起评审 · 写域外零写入 | ✅ Done | 未 commit；`thincoder-vscode/**` · `scripts/**` · `docs/cli/**` · 台账 · prompts 零写入 |

**变更记录**：- 2026-09-15（**B 式迁移轮 · VSC 第 7 批 = §8B 并入批 2** · eng-designer）：§2 append——§8B 并入第二批（core 六设计 + RELEASE 需求 + ADVISOR-CONVERGENCE 需求 + PHILOSOPHY 销项）+ 台账收口（26 = 8 + 8 + 8 + 2）+ 三闸全绿（锚 0 · 宽度 0 新增 · 台账 0）+ INVENTORY 越线收回（533 → 490）。

## §3 评审发现（评审子代理）

_（待写）_

## §4 父侧核验与裁决（主 agent）

_（待写）_

## §5 实施记录（eng-coder）

_（待写）_

## §6 收口与核销（父代理）

_（待写）_
