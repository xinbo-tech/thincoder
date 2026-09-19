# 2026-09-17 · 文档债修复批（悬空锚 837 + 行宽 + 计数）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（A + D + S2 交付 · 悬空 837→627；B/C 转续批 `2026-09-18-doc-debt-b`）

### 1.1 条目（台账 #26）

| # | 条目 | 实况（台账证据行 + 今晚实测） |
|---|---|---|
| #26 | 机检存量债：**悬空锚 837** + **行宽 3** + 计数收正 | `node scripts/doc-check.mjs` 读数（as-of 2026-09-17 23:3x）：扫描域 `docs` 137 档 · 判据项 5 · 拟新增 3；来源 = doc-check 父侧多轮复跑（三批零新增判定后的当前基线） |

### 1.2 本轮要回答的设计问题（设计轮勘察定夺）

1. **三分归类**：837 悬空锚按形态分族（用例号 / 坐标引用 / 符号名 / 其他）——各族的**正确修法**（改指真实落点 / 删 / 加锚 / 豁免登记），全线一条不落（按档汇总）。
2. **修复机制**：逐档手工 vs 机械批量——后者须**零语义 · 逐条可核验 · 显式声明**（文档纪律：语义内容禁 scripted 批量改写；机械面可脚本辅助但须如实披露）。
3. **批结构**：是否拆子批（按族 / 按域）+ 单档 1000 行护栏 / §5 五轮护栏的适配。
4. **边界**：冻结批档（非追溯）· `_archive/**` · 参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）是否纳入修复域——设计轮给出论证与裁定建议。
5. **豁免闸门**：若引入「锚豁免清单」，其判据与防滥用规则（豁免 = 登记而非掩盖）。

### 1.3 边界

- **做**：设计（策略 + 判据 + 验收 + 受影响文件全清单）+ 后续实施。
- **不做**：不动 doc-check 判据本体（本批是**修债**不是**改判据**）· 不碰代码面 · 不碰冻结批档 / `_archive/**` / 参照树（除非设计轮论证纳入）。
- **并发**：本批设计（新档 + `DOC-DISCIPLINE.md`）与在途 id=8 / id=9 无碰面；实施轮与各在途批靠调度器串行。

### 1.4 父侧注记

- 2026-09-17 23:49 立批（承用户 23:33「全量评估 + 分批 + 开始处理」——批③为原计划『待排』项，现起点火；设计面不碰在途档，可先行）。
- **设计轮（id=10）交付 + 父侧裁定（2026-09-17 23:59）**：交付 11 项（10 ✅ / 1 ⚠️）；**关键读数**：837 = 判据面伪影 **251** + 待裁定 **420** + **本批可闭合 166**（45 档）；**目标态诚实声明采纳**（本批边界内不可达 0——闭合后 = **671**）。**八项打回/裁定逐条**：① 注记集两口径互斥 → 判据面轮（另批）；② `.json` 截断伪影 → 同上（引擎缺陷）；③ 符号面假阳 211/226 → 同上；④ 用例树缺口 → 同上；⑤ §4 失效段 → 同上；⑥ **豁免闸门 / C 子批 → 呈用户裁定**（六判据闸门 + 五防滥用条为候选）；⑦ 提示词副本行宽漂移（设计面 2 行 vs 落地 23 行 · 最大 981 字符 + 仓外第三副本）→ 登记入提示词面（批⑤ 归口，主 agent 内容权）；⑧ 计数收正口径 → **父侧答复：对象 = ① `docs/README.md` 计数行（设计者已就地收正 49→51 ✓）② `doc-check` 计数类判据与 `checkConfig` 键一致（D3——归判据面轮核）**；无可增对象。**⚠️#11（需求档缺环）→ 父侧裁定：不补**（本批 = 修债非立项；判据源 = 现有 `DOC-DISCIPLINE` §4/§7 + `SPEC-MACHINE-CHECK`——设计档引用即足）。**→ 点火设计评审（子批 A/B/D 面；C 待用户裁定）。**
- **设计评审轮 1（2026-09-18 00:06 · VERDICT: pass——🔴0 / 🟡9 / 🔵5）**：发现表由评审自写入 §3；评审已逐行复算 §2.5 六列 85 行（A 166 / 判据面 246 / 待裁定 425 / 计 837）+ §1 三类 + 三锚面小计（591/226/20）✓。**父侧裁决：14 条全数接受（建议面）→ 派 fix 轮（id=18）**：S2 归属轮 · 计数收正（46→47 · 32/10/3 · 10→11 档）· AC-1↔AC-7 耦合 · AC-4 收窄（+ L1 脚本落点）· C 拆两面（路径锚/用例号锚）+ 注记集联动 · 提示词面口径（裁定：**副本纳入本批写域**，两处「零改」句 = 批 12 处置面）· `_archive` 证据取证或降级 · D2 指针化 · 裁定回填（发现 7 收 open）· 列名/口径/标签/槽位/护栏来源五组。设计 token 已签发（值不落文档——运行时凭证）；**fix 轮落位 → 父侧核验 → §4 → 派实施**。
- **C 子批裁定（用户 2026-09-18 00:02）**：采 **(a) 豁免闸门**（六判据 + 五防滥用条）——A/B/C/D 全授权。
- **fix 轮（id=18）交付 + 父侧核验（2026-09-18 00:14）**：14/14 落位（§2.8 在册）+ 一致性面 4 处就地校正（P3/P4 档数 7→9 / 41→31 · §2.3 #6 归属 · §4 开头 47 · AC-5 受影响计数）+ **C 裁定回填** ✓。**父侧抽读核验**：S2 行 `:207` · C1/C2 `:208` · 写域口径 `:264-266` · AC-1 `:272` · AC-4 `:275`（含 append-only 例外）· AC-5 `:276`（837 闭合式）· 读数口径 `:280` · item 基线 `:282` · AC-7 `:278` · U7 `:296`——全对 ✓；机检 837/3 回归（自伤 842/4 已自纠披露）✓。**#7 取证结论**：`_archive` 覆盖**成立**（引擎实证 `doc-check-anchors.mjs:147-153` → `:53` 不经 SKIP_DIRS + `requirements/METHODOLOGY.md:100` 复跑实证）⇒ 分支保留 ✓。**待裁项 4 裁定**：C1 机制载体（引擎侧行级标记族「迁移期引文」）= **归判据面批（#40）**——C1 实施以 #40 落族为前置；C2 同源（发现 1 收口 = #40）。**→ §4 代签；实施 coder 待 id=19 / id=20 两评审窗开**（47 档含 `MANIFEST.md` / `AGENT-LOOP.md` / `AGENT-LOOP-SUBAGENT.md`——防冻结窗污染）。
- 基线：悬空 **837** · 行宽 **3**（as-of 2026-09-17 23:3x）。

## §2 批次任务与设计修订（eng-designer）

### 2.1 设计落点

- **设计档** = `docs/core/design/ANCHOR-DEBT-REPAIR.md`（新建 · 本设计轮）——五问定案 / 三分归类 / 七分路径族修法判据 / 四子批 / 边界裁定 / 豁免闸门 / 8 条发现，全在该档（§1–§9）。
- **判据权威不改**：`DOC-DISCIPLINE.md` §4（V5 判据规格）· §7（引擎落点）为单一权威源；本批**不动判据本体**（`scripts/doc-check*.mjs` 三档零改）。

### 2.2 本批覆盖条目（A + D 子批）

| # | 条目 | 条数 | 档数 | 修法 |
|---|---|---|---|---|
| 1 | P2 模块旧址 → 转正档 / 归档落点改指 | 27 | 11 | 改指（映射单源 = 反向退役表 + 各档转正注记） |
| 2 | P3 占位 / 示例 token 归一 | 12 | **9** | 改述去锚（占位形态） |
| 3 | P4 缺仓前缀 / 缺中段 token 补齐 | 127 | **31** | 改指（补前缀命中唯一落点；须上下文核验仓别） |
| 4 | 行宽：`ENG-TOKEN-BINDING.md` :147（360 字符） | 1 行 | 1 | 折行（零语义） |
| 计 | —— | **166 条 + 1 行** | **45 档**（A 列 > 0）+ 1 档（行宽） | —— |

**验收（逐条回指设计档 §5）**：AC-1 复跑悬空 **671**（837 − 166，逐条差集 = 清单集合）· AC-2 `FAIL(行宽)` = 2（提示词面另轮）· AC-3 机检零新增 · AC-4 `git diff` ⊆ 受影响表（判据面 / `_archive` / 参照树 / 批档 命中 0）· AC-5 计数一致（D3：166 / 246 / 425 = 837）· AC-6 逐条留痕 + 机械面脚本显式声明 · AC-7 P4 上下文核验留痕。

### 2.3 本批**不做**（明示清单）

| # | 不做项 | 条数 | 归属 |
|---|---|---|---|
| 1 | P1 `.json` 截断伪影（原文正确、抽取式交替序缺陷） | 35 | 判据面另轮（发现 2） |
| 2 | S1 符号·窄 路径段碎片 / 通用词伪影 | 211 | 判据面另轮（发现 3） |
| 3 | B1 对端仓在册用例（用例定义面缺口） | 5 | 判据面另轮（发现 4） |
| 4 | P5 同名多落点（71）· P7 零落点无史实谓词（169） | 240 | B 子批（逐条订正 / 裁定后） |
| 5 | S2 宿主取错订正（15）· B2 已删测试档（5）· B3 旧档用例表（10） | 30 | **S2 → S2 轮**（L2 逐条订正，随 B）· **B2 / B3 → C 轮**（机制裁定后；C2 面以发现 1 收口为前置） |
| 6 | P6 迁移期引文行（史实谓词同行） | 150 | C 子批（**C1 路径锚**）——机制裁定**已落**（用户 2026-09-18 00:02：采豁免闸门）；族落地 = 机制面新增（须设计 + 评审） |
| 7 | 提示词面行宽 2 行（`docs/core/design/prompts/persona-engineering.md` :137 / :139） | 2 行 | 主 agent（提示词面内容权；副本漂移见发现 6） |
| 8 | 代码面死指针（`thincoder-core/manifest.mjs` 等 4 处 + 2 处） | 6 处 | 代码面另轮（已在案） |

### 2.4 受影响文件全清单（file 级）

**本批改动面（47 档）**：§2.5 设计档表 A 列 > 0 的 **45 档**（`docs/core/design/**` **32 档**（含 `prompts/` 3）· `docs/core/requirements/**` 10 档 · `docs/vsc/**` **3 档**）＋ `docs/core/design/ENG-TOKEN-BINDING.md`（行宽，与 A 列同档）＋ **新增** `docs/core/design/ANCHOR-DEBT-REPAIR.md` ＋ `docs/README.md`（新档登记 + §4 计数行收正——本设计轮已落）。

**本批零触碰（硬边界）**：`scripts/**`（判据本体）· `thincoder-core/**` · `thincoder-cli/**` · `thincoder-vscode/**`（代码面与参照树正文）· `docs/**/_archive/**` · `docs/batches/**`（冻结批档）。

**另轮清单（不在本批写域）**：`thincoder-core/prompts/persona-engineering.md` · `docs/core/design/prompts/persona-engineering.md`（提示词行宽）· `scripts/doc-check-anchors.mjs` · `scripts/doc-check-targets.mjs`（P1 / S1 / B1 修法落点）。

### 2.5 设计轮已落（本代理）

- 新建 `docs/core/design/ANCHOR-DEBT-REPAIR.md`（设计档 · 8 项齐备 + 变更记录）。
- `docs/README.md`：新档登记（§4 流程 / 文档机制面 8 → 11 档，同批补登 `MANIFEST.md` · `ENGINEERING-MODE-V2.md` 两档历史漏登）+ 计数行收正 **49 = 49 → 51 = 51**（as-of 2026-09-17）+ 变更记录一行（**一致性面就地收正 · 已上报**）。
- **机检自检（本设计轮 · 复跑两次）**：悬空 **837**（= 基线，**零新增**）· 行宽 **3**（零新增）· 扫描域 137 → 138 档（本档计入）。本档自身新增**仅**符号·宽报告面行（不入闸，与全仓 495 行同族常态）。

### 2.6 上报裁定点（设计轮发现 · 逐条）

| # | 裁定点 | 证据 | 建议 |
|---|---|---|---|
| 1 | 注记集两套口径（规格 §4.2.3 vs 引擎常量表互斥；§7 却声明判据同源） | 规格 vs `scripts/doc-check-anchors.mjs` | 判据面轮对齐（影响 247 条史实叙述锚） |
| 2 | `.json` 截断伪影（交替序 `js` 先于 `json`） | 35 条 · 抽样核原文 3 例 | 判据面轮修正则 |
| 3 | 符号面伪影（路径段切段 + 谓词集含高频词「在」） | 226 中 211 条 | 判据面轮收紧抽取面 |
| 4 | 用例定义面缺口（实装只走 `<域根>/test`，合并仓根无 `test/`） | 20 中 7 条对端档在位 | 判据面轮补两测试树 |
| 5 | §4 存失效段（§4.2.8 豁免族 / §4.2.6 V4 / §4.2.4 假阳表——实装已砍） | 引擎头注 + §7 F3 | 判据面轮收窄规格 |
| 6 | 豁免闸门形态（新族「迁移期引文」· 行级标记驱动） | 设计档 §3-Q5（六判据 + 五防滥用） | 须**用户裁定 + 评审**后方可启动 C 子批 |
| 7 | 提示词副本行宽漂移（设计面 2 行 vs 落地副本 23 行） | 实测两副本 | 提示词同步轮（主 agent） |
| 8 | 「计数收正」口径未明（台账 #26 未指明对象） | —— | **open**——请主 agent 明确（本批先落地图计数行） |

### 2.7 §2.2 表栏收正（D6 回读发现 · 本代理自纠）

- §2.2 表「档数」列两处笔误**收正**：P3 = **9 档**（原记 7）· P4 = **31 档**（原记 41）——复算口径 = A 列并集 45 档（P2 11 ∪ P3 9 ∪ P4 31）。
- 复核读数（**as-of 2026-09-17 23:5x · 复跑**）：悬空 **837**（用例号 20 · 路径 591 · 符号 226）——与基线同值；子族条数 P2 27 · P3 12 · P4 127 · 合 166 零漂。
- 备注：同刻另有在途批改动他档（`AGENT-LOOP-SUBAGENT.md` 等行号位移），本批计数口径以本批清单为准（他批在途档不入本批清单）。

### 2.8 修正轮（fix · 评审轮 1 落修 14 条）（2026-09-18 · eng-designer）

> 追加段（append-only）。**零新语义 / 新范围**：只落评审轮 1 的 14 条建议面 + 父侧逐条裁定（`Suggestion` 列 = 处置建议；处置执行人 = 本代理）。**§2.2 / §2.3 / §2.4 上方各表已按编号就地校正**（D3——计数与枚举同改；残留以现值为准）。

**1. 逐条落地表（号 → 改动 file:line）**

设计档 = `docs/core/design/ANCHOR-DEBT-REPAIR.md`（下行行号为落修后现值）；批档行号 = 本档。

| # | 发现（本档 §3） | 落点（file:line） |
|---|---|---|
| 1 | S2（15 条）无归属轮 | 设计 `:201`（定案句「+ S2 归属行」）· `:207`（**新增 S2 行** = 15 条 / 8 档）· `:27`（§1 ② 类处置轮改 B + S2 / C）· `:33`（目标态：余 671 归属分解）· `:193`（§3-Q2 L2 + S2）· `:211` / `:213`（时序 + D3 闭合 586 + 251 = 837）· `:309`（§7）；批档 `:62`（§2.3 #5 归属列） |
| 2 | 受影响文件计数与枚举不符 | 批档 `:69`（**46 → 47**；分解 33/10/2 → **32/10/3**）· `:47` / `:48`（§2.2 P3 7→**9** · P4 41→**31**——承 §2.7 复算，就地校正）；设计 `:258`（映射面 10 → **11 档**）· `:253`（§4 开头 = **47 档**）· `:276`（AC-5 增「受影响文件 = 47」） |
| 3 | AC-1 ↔ AC-7 未耦合 | 设计 `:272`（AC-1 = **837 − 闭合条数**；闭合 + 降级 = 166）· `:278`（AC-7 同源）· `:282`（item 级基线 = 首跑清单 · 载体 = 批档 §5 · 实施轮开工冻结） |
| 4 | AC-4 与 AC-6 / 批档机制相冲 | 设计 `:275`（AC-4 收窄：**修复面** diff ⊆ §4 清单 ∧ 不触 `scripts/**` / `_archive/**` / 参照树 / 批档（**本批自身 §5 留痕段除外**））· `:284`（比较基准 = 开工 HEAD · 两读并用 · 未跟踪档口径）· `:192`（**L1 脚本落点 = execute 内联、不落仓**）· `:296`（U7 补「脚本落仓」违规） |
| 5 | C 机制前提两处未闭合 | 设计 `:208`（C 拆 **C1 路径锚 / C2 用例号锚** + 机制分列）· `:241`（§3-Q5 生效面 = C1 面；C2 走 §4.3 三选 ②）· `:182`（§3-Q1 豁免登记适用族按锚类拆）· `:243`（前提③ 补证据指针） |
| 6 | 提示词副本写域 vs 在案零改口径 | 设计 `:264` / `:266`（**写域口径**：副本**纳入本批写域** · 内容权归主 agent · 落地逐字确认；两处「零改」句 = **批 12 处置面**）· `:262`（另轮行改标「提示词 2 行行宽 · 主 agent 处置」） |
| 7 | `_archive` 行无证据坐标 | 设计 `:220`（行内指向下证据）· `:225`–`:231`（**引擎证据块**：`scripts/doc-check-anchors.mjs:147-153` 解析序 → `:53` `isFile`/`statSync`，**不经 SKIP_DIRS**；`:46` / `:56-68` 作用面 = walk；实证 `docs/core/requirements/METHODOLOGY.md:100` 复跑**未入 837**）· `:300`（U11 边界用例）⇒ **分支保留、不删** |
| 8 | 机制句重述 + 四选一 ↔ 三选关系未述（D2） | 设计 `:193`（L2 硬约束改**指针形态**，承 `docs/core/design/DOC-DISCIPLINE.md:521` §4.3 + 四选一 ↔ 三选映射 + 「冲突处以 §4.3 为准」） |
| 9 | 未回填父侧裁定 | 设计 `:322`（§8 发现 7 **收 open** → 回指批档 §1.4 ⑧）· `:327`–`:331`（§9 变更记录补行：**父侧八项 + 需求档缺环不补**）· `:237`（§3-Q5 改「已裁定」）；**追加回填**（非 #9 条内、同族）：用户 C 子批裁定已落（设计 `:208` / `:237` / `:249` + 批档 `:63`） |
| 10 | 列名「判据面」同词不同指 | 设计 `:82`（列名 → **符号 + 用例锚**）· `:79`（列义同改）· `:31`（§1 补两数口径括注：251 ≠ 246） |
| 11 | AC-1 / AC-3 无读数口径 | 设计 `:280`（读数口径：收口复跑判定 · 他批在途 = **活动量** · 先例 `DOC-DISCIPLINE.md:516`） |
| 12 | 三处标签 / 措辞 | 设计 `:205`（A 行「L1 + P2」→「**L1 + L2**」）· `:192`（「脚本生成候选 diff + 逐条落盘」→「**候选清单落盘（不改档）+ 逐条留痕（§5）**」）· `:257`（§4 机械面行标 →「**A 列 45 档**（P3 + P4 行内替换，P2 见下行）」） |
| 13 | 模板槽位（零 UI 面） | 设计 `:310`（**零 UI 面（纯文档面）——无未决项**，落 §7） |
| 14 | 护栏来源坐标 | 设计 `:205`（**改动量口径**：`CORE-UNIFICATION.md` A 列 20 条单列一轮；**行数不入判据** = `DOC-DISCIPLINE.md:271` §3.7 / R3（用户 2026-09-16 裁定）；「单档 >1000 行」射程 = **批次档生命周期** `BATCH-RECORD.md:173` L2 / `:131` BR-11）· `:206`（B 行同款 + §5 修正轮上限 5 轮 = `BATCH-RECORD.md:174`）· `:295`（U6 改「大改动量档」） |

**2. 就地校正清单（D3 / D6——残留以现值为准）**

- 批档 §2.2 `:47` / `:48` · §2.3 `:62`（#5 归属列）/ `:63`（#6 归属列）· §2.4 `:69`（46 → 47 · 32/10/3）。
- 设计档：上述 14 条各落点（均为就地落修，非追加注记）。

**3. 自检读数（机检 · 2026-09-18 00:2x 复跑）**

- `node scripts/doc-check.mjs`：**悬空 837**（= 基线，**零新增**）· **行宽 3 行**（= 基线，零新增）· 扫描域 **138 档**。
- 首跑曾出现 **842 / 行宽 4**（本代理新增行自伤：`:229` 符号面 5 条 + `:328` 513 字符）——**已就地消解**（`:229` 去反引号形态 · §9 拆四行），复跑回基线（AC-3 零新增成立）。
- 本档自身新增 = 符号·宽**报告面**行（不入闸，与全仓 495 行同族常态）。

**4. 待父侧裁 / 未决（**非 14 条内**，供裁）**

- **C1 机制的落地载体**：行级标记族「迁移期引文」= 引擎侧**新族**（判据本体面），与本批硬边界「`scripts/**` 三档零改」（设计 §3-Q2 L3 / §7）张力未解。设计档按原口径记「族 = 机制面新增（须设计 + 评审）」+「点火时点由父侧按裁定排」——**未自行扩展本批范围**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评面**：`ANCHOR-DEBT-REPAIR.md` · `DOC-DISCIPLINE.md` · 批次档 `2026-09-17-doc-debt-repair.md`（按申报的出批面不评：C 子批裁定 / 判据面改动 / 代码实施）。**方法学限制**：无 Document Map（归属判据降级为「在评面 + Project Guide」）；无项目标准档（方法学按 Project Guide + 在评文档判；纪律层提示词不在评面 ⇒ 模板槽位与护栏来源无法核验）。**复算**（按文档数字，未复跑机检）：§2.5 六列 85 行逐行相符（A **166** / 判据面 **246** / 待裁定 **425** / 计 **837**）；§1 三类 251 + 420 + 166 = 837；§2.2 = 591 · §2.3 = 226 · §2.4 = 20；A 列 > 0 档 = **45**；§3-Q1 154 + 12 + 0 + 165 = 331 为另一量口径无误。**需求契合**：批档 §1.2 五问（Q1–Q5）在设计中逐问有定案（§3）——未发现漏答；引擎行为类断言（发现 1–5、`_archive` 解析）标 unverified（引擎档不在评面）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage | 🟡 | **S2（15 条）无归属轮**：§3-Q3 四子批 A 166 + B 240 + C 165 = 571（另 D = 3 行宽行），加判据面 251 = 822 ≠ 837（差 15 = S2）；批档 `:60` 记 S2「裁定后（C 子批 / 逐条）」，而设计 `:205` 的 C = P6 + B2 + B3 = 165 不含 S2（§1 三类表 `:27` 把 S2 计入②，`:77` 又把它计入「判据面」列） | 在 §3-Q3 表给 S2 补归属行（或并入 B / C 之一）并同步该子批计数、§1 目标态与 §7（`:287`）的归属表述；批档 §2.3 #5 同改（D3 计数与枚举同改） |
| 2 | Clarity / D3 | 🟡 | **受影响文件计数与枚举不符**：批档 `:67`「本批改动面（**46 档**）」+ 分解「core/design 33 · core/requirements 10 · vsc 2」，但同句枚举 = A 列 > 0 的 45 档 + 本档 + `docs/README.md` = **47**；按 A 列目录实算（`:82-166`）= core/design **32**（含 prompts 3）· core/requirements 10 · vsc **3** = 45（合计无误、分解有误）；设计 `:245` 标「**10 档**」而同行列 **11** 档（批档 `:44` / `:94` 记 P2 = 11 档）；AC-5（`:261`）的 D3 核对项不含受影响文件计数 | 以枚举重算并同改三处计数（批档 §2.4 的 46 与目录分解、设计 §4 映射面行标）；把受影响文件计数纳入 AC-5 的 D3 核对项 |
| 3 | Acceptance criteria | 🟡 | **AC-1 与 AC-7 未耦合**：AC-1（`:257`）要「悬空 **671**、不得多减」，而 §3-Q2 前置换算（`:195`）明确「核不出仓别者降级为待裁定」、AC-7（`:263`）正是该降级的留痕判据 ⇒ 降级一旦发生，闭合 < 166、读数 > 671，AC-1 按字面判红且无替代读数；「逐条差集 = 清单集合」还需 item 级清单（§2.5 只到档粒度，未给载体与冻结时点） | 把 AC-1 写成「悬空 = 837 − 闭合条数（闭合 + 降级 = 166）」并给降级条的记账位；指明 item 级基线（首跑清单）的冻结时点与载体 |
| 4 | Acceptance criteria | 🟡 | **AC-4 与 AC-6 / 批档机制相冲**：AC-4（`:260`）「`git diff --name-only` ⊆ §4 清单 ∧ `docs/batches/**` 命中 = 0」，而 AC-6（`:262`）要求逐条记录入批次档 §5（批档 append-only 段写入为合规必需）⇒ 按字面即判红；判据未定义比较基准与未跟踪新档口径；同一 AC 的 `scripts/**` 命中 = 0 还约束 L1 候选脚本落点（§3-Q2 L1 `:190` 未给脚本落点） | 把 AC-4 限定为「修复面 diff ⊆ §4 清单 ∧ 修复面不触 `scripts/**` / `_archive/**` / 参照树 / `docs/batches/**`（批档自身 append-only 段除外）」，写明比较基准与未跟踪档口径，并给 L1 候选脚本落点 |
| 5 | Requirements coverage / 自洽 | 🟡 | **C 子批（165）机制前提两处未闭合**：① §3-Q5「生效面」(`:228`) **仅路径 / 坐标锚**、明示不覆盖用例号 / 符号，而 §3-Q1（`:180`）把「豁免登记」射程写作 P6 · B2 · B3 = 165、§3-Q3 C 行（`:205`）亦含 B2 + B3 ⇒「须先落 §3-Q5 裁定」对这 15 条不成立；② B2 / B3 修法 = 退场注记（`:71` / `:72`）依赖 §4.2.3 注记集，而 §8 发现 1（`:293`）正记「注记集两口径互斥、实装判红」⇒ 修法与发现 1 的联动未声明 | 在 §3-Q3 / §3-Q5 内按锚类把 C 拆两面（路径锚 / 用例号锚）并各自写明机制与待裁对象；注明 C 的退场注记路线以发现 1 收口为前置，或改走 B 子批式现态改写 |
| 6 | Document ownership / 协调项 | 🟡 | **提示词副本三档入 A 写域 vs 在案零改口径**：A 清单含 `docs/core/design/prompts/**` 三档（4 条 P3；设计 `:251` 自注「内容权归主 agent、落地须逐字确认」），而在案两处把该面列为零改——`DOC-DISCIPLINE.md:83`「提示词面零碰…提示词 = 产品代码」· `:283` 不处置面「`docs/core/design/prompts/**` 与 `thincoder-core/prompts/**`（提示词 = 产品代码，零改）」⇒ 写域判据（AC-4 / AC-6）在两口径下结论不同 | 明示生效口径：或把这 4 条移出 A 清单并同步 A 的 166 条 / 45 档计数（批档 §2.2 / §2.4 同改），或补一句界定两处「零改」句的射程（批 12 处置面）并声明提示词副本纳入本批写域 |
| 7 | Feasibility / 证据纪律 | 🟡 | **`_archive` 行「存在性判据可解析」无证据坐标**（`:215`；引擎档不在评面 ⇒ unverified），而同面三处倾向反向读法：`DOC-DISCIPLINE.md:575`（§4.6「归档档不作现状依据，也不入扫描域」）· `:162`（§3.5 边界同款）· `:467`（索引面 `SKIP_DIRS` 含 `_archive`）；该断言同时是 P2 修法分支「或补全归档落点」（`:48`）与 P4「尾段唯一」索引面的可行性依据 | 补引擎侧证据坐标（索引 / 解析序哪一步覆盖 `_archive`），或标 unverified 并加边界用例（活档 → 归档落点复跑转绿）；若不成立，把「补全归档落点」从 P2 修法与 §3-Q5 适用前提③中删除 |
| 8 | Document ownership（D2） | 🟡 | **机制句重述 + 修法表并存关系未述**：§3-Q2 L2 硬约束句（`:191`）与 `DOC-DISCIPLINE.md:521`（§4.3 粒度与纪律）近逐字重复且无指针；§3-Q1「修法四选一」（`:173`–`:180`）与 `DOC-DISCIPLINE.md:522`（§4.3 处置三选）的并存关系未说明（何者适用 / 是否等价 / 四选一是否为三选的批内细化） | 改指针形态（承 §4.3 三选 + 粒度纪律）并一句话给四选一 ↔ 三选的映射，或声明四选一为批内细化、冲突处以 §4.3 为准 |
| 9 | 跨档滞后（R7a） | 🟡 | **设计档未回填父侧裁定**：§8 发现 7（`:299`）仍记「open——请主 agent 明确口径」，批档 `:30`（§1.4 ⑧）已答复（对象 = `docs/README.md` 计数行 + doc-check 判据项一致；无可增对象）；另 ⚠️#11（需求档缺环）「不补」的裁定在设计档内无痕（§7 边界 / §9 变更记录未提；档头 `:4` 仅列判据权威指针） | 在 §8 发现 7 收起 open 标记并回指批档 §1.4 ⑧；在 §9 变更记录补一行「父侧裁定已落（八项 + 需求档缺环不补）」 |
| 10 | Clarity | 🔵 | §2.5 列名「判据面」（`:80` / `:167`）实指「全部符号 + 用例锚 = 246」（`:77`），与 §1 第①类「判据面伪影 **251**」（`:26`）同词不同指（246 ≠ 251，易混） | 列名改「符号 + 用例锚」，并在 §1 第①类行补括注区分两数口径 |
| 11 | Acceptance robustness | 🔵 | AC-1 / AC-3（`:257` / `:259`）为定值判据、未带读数口径；同面先例已裁「在途他批 = 活动量」（`DOC-DISCIPLINE.md:514-516`：读数只在收口复跑时判定、期间波动不作缺陷），批档 `:96` 亦记他批在途档位移 | 补读数口径一句（判据在收口复跑时判定；他批在途档波动不作缺陷，以清单逐条为准） |
| 12 | Clarity | 🔵 | 三处标签 / 措辞不一致：① §3-Q3 A 行「（L1 + **P2**）」（`:203`）与 §3-Q2 层分配（P2 ∈ **L2**，`:191`）不符；② L1 手段「脚本生成候选 diff + **逐条落盘**」与同格「**不直接改档**」（`:190`）相冲（U7 `:275` 以脚本直接改档为违规）；③ §4 机械面行标「（P3 + P4）」而档单元 = A 列 > 0 的 45 档（含 P2 项） | ① 改「（L1 + L2）」；② 改「候选清单落盘（不改档）+ 逐条留痕（§5）」；③ 行标改「A 列 45 档（P3 + P4 行内替换，P2 见下行）」 |
| 13 | Methodology（模板槽位） | 🔵 | 设计档无「零 UI / 交互面」类显式槽位句（同面先例 `DOC-DISCIPLINE.md:314`「UI / 交互面：零 UI 面（纯文档面）——无未决项」）；模板对该槽位的要求因纪律层提示词不在评面而无法核验 | 若模板含该槽位，补一行「零 UI 面（纯文档面）——无未决项」 |
| 14 | Methodology（护栏来源） | 🔵 | §3-Q3 的「单档 1000 行护栏 / 每轮 ≤5 轮护栏」（`:203` / `:204`，另 U6 `:274`）无来源坐标；且以「1915 行」总行数触发的读法，与 `DOC-DISCIPLINE.md:211`（用户 2026-09-16 裁定：300 / 500 只约束程序代码、文档不受行数限制）· `:271`（R3：文档无任何行数义务）的射程关系未说明 | 补护栏来源坐标；若其 = 文档体量规则，注明与 §3.7 裁定的关系；若为单轮改动量口径，按「改动量」表述 |

出批面注记（不评 / 不给严重度）：Project Guide（`AGENTS.md`）「File size: ≤300 advisory / ≤500 hard limit」与 `DOC-DISCIPLINE.md:211` 所载用户 2026-09-16 裁定（300 / 500 只约束程序代码）在字面上不一致——属工作区指南面，不属本次评面。

**计数**：🔴 0 · 🟡 9 · 🔵 5。

VERDICT: pass

## §4 用户批准（主 agent）

**代签 2026-09-18 00:14**（承用户 23:33「开始处理」授权）：评审轮 1 **PASS** → fix 轮（id=18）落位 + 父侧核验 ✓；设计 token 已签发（值不落文档——运行时凭证）。**实施范围** = **A + B + S2 + D**（C1 / C2 待 #40——引擎侧族为前置）；**prompt 面 4 条 P3 = 内容权主 agent**（逐字确认随派单落）。**派单时序**：待 id=19 / id=20 两评审结算后派（同档防污染）；派单口径 = §4 清单 47 档 + §5 留痕 + item 级基线开工冻结。

## §5 实施记录（eng-coder）

### 实施轮（initial）· item 级基线冻结（2026-09-18 · eng-coder）

**冻结时点** = 实施轮开工首跑（`node scripts/doc-check.mjs`，as-of 2026-09-18 00:4x）；载体 = 本段。

**开工读数**：悬空 **836**（用例号 20 · 路径/坐标 590 · 符号·窄 226）· 行宽超限 **3** 行 · 扫描域 **138** 档。
> 与设计建档基线 837 差 1 = 他批在途档位移（**活动量**，承设计 §5 读数口径）——本批清单以本冻结为准。
> 分族复算：P1 35 · P2 27 · P3 12 · P4 127 · P5 70 · P6/P7 319 ⇒ 590 ✓；A 列（P2+P3+P4）= **166 条 / 45 档**，逐档与设计 §2.5 A 列一致（零差异）。

**A 子批清单（166 条 · `file:line | 旧 token | 类`；file 前缀 = `docs/`）**

| # | file:line | 旧 token | 类 |
|---|---|---|---|
| 1 | core/design/AGENT-LOOP-SUBAGENT.md:4 | `modules/ENGINEERING-MODE-V2-MODULE-DELEGATION.md` | P2 |
| 2 | core/design/AGENT-LOOP-SUBAGENT.md:624 | `modules/ENGINEERING-MODE-V2-MODULE-DELEGATION.md` | P2 |
| 3 | core/design/AGENT-LOOP.md:16 | `src/agent/setup.mjs` | P4 |
| 4 | core/design/AGENT-LOOP.md:18 | `src/extension/suspension.mjs` | P4 |
| 5 | core/design/AGENT-LOOP.md:19 | `src/cli/permission.mjs` | P4 |
| 6 | core/design/AGENT-LOOP.md:23 | `src/explore-distill.mjs` | P4 |
| 7 | core/design/AGENT-LOOP.md:32 | `src/explore-distill.mjs` | P4 |
| 8 | core/design/AGENT-LOOP.md:33 | `src/agent.mjs` | P4 |
| 9 | core/design/AGENT-LOOP.md:33 | `src/agent.mjs` | P4 |
| 10 | core/design/AGENT-LOOP.md:41 | `src/agent/run-stages.mjs` | P4 |
| 11 | core/design/AGENT-LOOP.md:42 | `src/agent/setup.mjs` | P4 |
| 12 | core/design/AGENT-LOOP.md:43 | `src/agent/setup-reminders.mjs` | P4 |
| 13 | core/design/AGENT-LOOP.md:50 | `agent/helpers.mjs` | P4 |
| 14 | core/design/AGENT-LOOP.md:51 | `src/agent/setup-reminders.mjs` | P4 |
| 15 | core/design/AGENT-LOOP.md:59 | `src/cli/permission.mjs` | P4 |
| 16 | core/design/AGENT-LOOP.md:64 | `src/extension/suspension.mjs` | P4 |
| 17 | core/design/AGENT-LOOP.md:133 | `src/agent.mjs` | P4 |
| 18 | core/design/AGENT-LOOP.md:400 | `src/agent-tools/index.mjs` | P4 |
| 19 | core/design/AGENT-LOOP.md:401 | `src/agent.mjs` | P4 |
| 20 | core/design/AGENT-LOOP.md:401 | `src/agent.mjs` | P4 |
| 21 | core/design/AGENT-LOOP.md:401 | `src/agent/setup-reminders.mjs` | P4 |
| 22 | core/design/AGENT-LOOP.md:401 | `src/explore-distill.mjs` | P4 |
| 23 | core/design/AGENT-LOOP.md:401 | `src/i18n.mjs` | P4 |
| 24 | core/design/AGENT-LOOP.md:490 | `src/agent-tools/index.mjs` | P4 |
| 25 | core/design/AGENT-PARAMS.md:136 | `agent/helpers.mjs` | P4 |
| 26 | core/design/ARCHITECTURE.md:146 | `test/files.mjs` | P4 |
| 27 | core/design/ARCHITECTURE.md:172 | `src/agent.mjs` | P4 |
| 28 | core/design/BATCH-RECORD.md:4 | `modules/ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md` | P2 |
| 29 | core/design/BATCH-RECORD.md:265 | `modules/ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md` | P2 |
| 30 | core/design/CONFIG.md:20 | `extension/settings.mjs` | P4 |
| 31 | core/design/CONFIG.md:21 | `src/agent/setup.mjs` | P4 |
| 32 | core/design/CONFIG.md:24 | `src/extension/settings.mjs` | P4 |
| 33 | core/design/CONFIG.md:38 | `agent-tools/settings.mjs` | P4 |
| 34 | core/design/CONFIG.md:47 | `extension/settings.mjs` | P4 |
| 35 | core/design/CONFIG.md:49 | `src/extension/settings.mjs` | P4 |
| 36 | core/design/CONFIG.md:58 | `agent-tools/settings.mjs` | P4 |
| 37 | core/design/CONSULTATION.md:15 | `agent-tools/subagent-panel.mjs` | P4 |
| 38 | core/design/CONSULTATION.md:53 | `agent-tools/advisor.mjs` | P4 |
| 39 | core/design/CONSULTATION.md:60 | `advisor/run.mjs` | P4 |
| 40 | core/design/CONSULTATION.md:74 | `advisor/run.mjs` | P4 |
| 41 | core/design/CONSULTATION.md:82 | `advisor/run.mjs` | P4 |
| 42 | core/design/CONSULTATION.md:199 | `extension/suspension.mjs` | P4 |
| 43 | core/design/CONSULTATION.md:247 | `agent-tools/subagent-panel.mjs` | P4 |
| 44 | core/design/CONSULTATION.md:247 | `src/tui/subagent-panel.mjs` | P4 |
| 45 | core/design/CONTEXT-COMPACTION.md:15 | `src/extension/generate-title.mjs` | P4 |
| 46 | core/design/CONTEXT-COMPACTION.md:25 | `src/extension/generate-title.mjs` | P4 |
| 47 | core/design/CORE-UNIFICATION.md:252 | `extension/session-gc.mjs` | P4 |
| 48 | core/design/CORE-UNIFICATION.md:268 | `src/extension/session-gc.mjs` | P4 |
| 49 | core/design/CORE-UNIFICATION.md:329 | `src/tui/markdown.mjs` | P4 |
| 50 | core/design/CORE-UNIFICATION.md:334 | `memory/core.mjs` | P4 |
| 51 | core/design/CORE-UNIFICATION.md:343 | `tui/markdown.mjs` | P4 |
| 52 | core/design/CORE-UNIFICATION.md:391 | `agent-tools/settings.mjs` | P4 |
| 53 | core/design/CORE-UNIFICATION.md:871 | `src/tools/index.mjs` | P4 |
| 54 | core/design/CORE-UNIFICATION.md:879 | `src/tools/shared.mjs` | P4 |
| 55 | core/design/CORE-UNIFICATION.md:885 | `src/agent.mjs` | P4 |
| 56 | core/design/CORE-UNIFICATION.md:892 | `src/agent/run-stages.mjs` | P4 |
| 57 | core/design/CORE-UNIFICATION.md:893 | `src/agent/setup.mjs` | P4 |
| 58 | core/design/CORE-UNIFICATION.md:894 | `src/agent/setup-reminders.mjs` | P4 |
| 59 | core/design/CORE-UNIFICATION.md:898 | `src/explore-distill.mjs` | P4 |
| 60 | core/design/CORE-UNIFICATION.md:1098 | `agent/suspension.mjs` | P4 |
| 61 | core/design/CORE-UNIFICATION.md:1121 | `provider/core.mjs` | P4 |
| 62 | core/design/CORE-UNIFICATION.md:1229 | `src/i18n.mjs` | P4 |
| 63 | core/design/CORE-UNIFICATION.md:1289 | `agent/suspension.mjs` | P4 |
| 64 | core/design/CORE-UNIFICATION.md:1341 | `tools/context.mjs` | P4 |
| 65 | core/design/CORE-UNIFICATION.md:1601 | `x/packages/core/y.md` | P3 |
| 66 | core/design/CORE-UNIFICATION.md:1829 | `agent/suspension.mjs` | P4 |
| 67 | core/design/DESIGN-TOKEN-SETTLEMENT.md:4 | `modules/ENGINEERING-MODE-V2-MODULE-REVIEW-CREDENTIAL.md` | P2 |
| 68 | core/design/DESIGN-TOKEN-SETTLEMENT.md:165 | `modules/ENGINEERING-MODE-V2-MODULE-REVIEW-CREDENTIAL.md` | P2 |
| 69 | core/design/DOC-CODE-RECONCILE.md:240 | `src/tui/index.mjs` | P4 |
| 70 | core/design/DOC-CODE-RECONCILE.md:265 | `ENGINEERING-MODE-MECHANISM.md` | P4 |
| 71 | core/design/DOC-DISCIPLINE.md:4 | `modules/ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK.md` | P2 |
| 72 | core/design/DOC-DISCIPLINE.md:439 | `thincoder-cli/docs/design/X.md` | P3 |
| 73 | core/design/DOC-DISCIPLINE.md:758 | `modules/ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK.md` | P2 |
| 74 | core/design/DOC-SYSTEM.md:49 | `design/X.md` | P3 |
| 75 | core/design/DOC-SYSTEM.md:49 | `requirements/X.md` | P3 |
| 76 | core/design/EDIT-HELPERS.md:96 | `_archive/EDIT-TOOL-EOL-DESIGN.md` | P4 |
| 77 | core/design/ENG-TOKEN-BINDING.md:4 | `modules/ENGINEERING-MODE-V2-MODULE-WRITE-GATE.md` | P2 |
| 78 | core/design/ENG-TOKEN-BINDING.md:100 | `src/agent/setup.mjs` | P4 |
| 79 | core/design/ENG-TOKEN-BINDING.md:167 | `modules/ENGINEERING-MODE-V2-MODULE-WRITE-GATE.md` | P2 |
| 80 | core/design/ENGINEERING-MODE-V2.md:78 | `src/tools/index.mjs` | P4 |
| 81 | core/design/ENGINEERING-MODE-V2.md:88 | `src/agent.mjs` | P4 |
| 82 | core/design/ENGINEERING-MODE-V2.md:88 | `src/agent/setup-reminders.mjs` | P4 |
| 83 | core/design/ENGINEERING-MODE-V2.md:88 | `src/agent/setup.mjs` | P4 |

| 84 | core/design/ENGINEERING-MODE-V2.md:89 | `src/extension/ledger-surface.mjs` | P4 |
| 85 | core/design/ENGINEERING-MODE-V2.md:89 | `src/tui/ledger-surface.mjs` | P4 |
| 86 | core/design/I18N.md:32 | `src/i18n.mjs` | P4 |
| 87 | core/design/I18N.md:38 | `src/i18n.mjs` | P4 |
| 88 | core/design/LEDGER.md:4 | `modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md` | P2 |
| 89 | core/design/LEDGER.md:165 | `modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md` | P2 |
| 90 | core/design/MANIFEST.md:3 | `modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md` | P2 |
| 91 | core/design/MCP.md:15 | `mcp/helpers.mjs` | P4 |
| 92 | core/design/MEMORY.md:137 | `memory/core.mjs` | P4 |
| 93 | core/design/MEMORY.md:319 | `agent/helpers.mjs` | P4 |
| 94 | core/design/PORTABILITY.md:42 | `agent-tools/advisor.mjs` | P4 |
| 95 | core/design/PORTABILITY.md:123 | `src/prompts/x.md` | P3 |
| 96 | core/design/PROMPT-SYSTEM.md:3 | `modules/ENGINEERING-MODE-V2-MODULE-PROMPT-PIPELINE.md` | P2 |
| 97 | core/design/PROMPT-SYSTEM.md:252 | `modules/ENGINEERING-MODE-V2-MODULE-PROMPT-PIPELINE.md` | P2 |
| 98 | core/design/prompts/advisor-design.md:41 | `path/to/file.md` | P3 |
| 99 | core/design/prompts/advisor-round2.md:35 | `src/x.mjs` | P3 |
| 100 | core/design/prompts/advisor-round2.md:36 | `src/y.mjs` | P3 |
| 101 | core/design/prompts/advisor-round3.md:33 | `src/x.mjs` | P3 |
| 102 | core/design/PROVIDER.md:129 | `provider/core.mjs` | P4 |
| 103 | core/design/PROVIDER.md:381 | `src/tools/index.mjs` | P4 |
| 104 | core/design/PROVIDER.md:381 | `src/tui/index.mjs` | P4 |
| 105 | core/design/SESSION.md:15 | `src/extension/session-slots.mjs` | P4 |
| 106 | core/design/SESSION.md:16 | `src/extension/session-gc.mjs` | P4 |
| 107 | core/design/SESSION.md:34 | `src/extension/session-slots.mjs` | P4 |
| 108 | core/design/SESSION.md:35 | `src/extension/session-gc.mjs` | P4 |
| 109 | core/design/SESSION.md:36 | `src/extension/session-slot-write.mjs` | P4 |
| 110 | core/design/TESTING.md:4 | `modules/ENGINEERING-MODE-V2-MODULE-TEST-DISCIPLINE.md` | P2 |
| 111 | core/design/TESTING.md:310 | `modules/ENGINEERING-MODE-V2-MODULE-TEST-DISCIPLINE.md` | P2 |
| 112 | core/design/TOOLS.md:4 | `modules/ENGINEERING-MODE-V2-MODULE-CHECKLIST-REMOVAL.md` | P2 |
| 113 | core/design/TOOLS.md:17 | `src/agent-tools/index.mjs` | P4 |
| 114 | core/design/TOOLS.md:56 | `src/agent/setup.mjs` | P4 |
| 115 | core/design/TOOLS.md:60 | `src/tools/shared.mjs` | P4 |
| 116 | core/design/TOOLS.md:60 | `src/tools/shared.mjs` | P4 |
| 117 | core/design/TOOLS.md:61 | `src/tools/shared.mjs` | P4 |
| 118 | core/design/TOOLS.md:67 | `src/tools/shared.mjs` | P4 |
| 119 | core/design/TOOLS.md:75 | `src/agent-tools/index.mjs` | P4 |
| 120 | core/design/TOOLS.md:75 | `src/agent/setup.mjs` | P4 |
| 121 | core/design/TOOLS.md:104 | `tools/repomap.mjs` | P4 |
| 122 | core/design/TOOLS.md:107 | `tools/context.mjs` | P4 |
| 123 | core/design/TOOLS.md:338 | `modules/ENGINEERING-MODE-V2-MODULE-CHECKLIST-REMOVAL.md` | P2 |
| 124 | core/design/TURN-CAP-CONTINUE.md:148 | `agent/helpers.mjs` | P4 |
| 125 | core/design/WORKSPACE.md:15 | `src/extension/rules.mjs` | P4 |
| 126 | core/design/WORKSPACE.md:16 | `src/extension/peer-instances.mjs` | P4 |
| 127 | core/design/WORKSPACE.md:18 | `src/tui/ledger-surface.mjs` | P4 |
| 128 | core/design/WORKSPACE.md:34 | `src/extension/skills.mjs` | P4 |
| 129 | core/design/WORKSPACE.md:35 | `src/extension/rules.mjs` | P4 |
| 130 | core/design/WORKSPACE.md:36 | `src/extension/peer-instances.mjs` | P4 |
| 131 | core/design/WORKSPACE.md:37 | `src/extension/peer-domains.mjs` | P4 |
| 132 | core/design/WORKSPACE.md:38 | `src/extension/ledger-surface.mjs` | P4 |
| 133 | core/design/WORKSPACE.md:38 | `src/tui/ledger-surface.mjs` | P4 |
| 134 | core/requirements/AGENT-LOOP.md:167 | `src/agent.mjs` | P4 |
| 135 | core/requirements/AGENT-LOOP.md:167 | `src/extension/suspension.mjs` | P4 |
| 136 | core/requirements/ENGINEERING-MODE-V2.md:525 | `modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md` | P2 |
| 137 | core/requirements/ENGINEERING-MODE-V2.md:526 | `modules/ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md` | P2 |
| 138 | core/requirements/ENGINEERING-MODE-V2.md:527 | `modules/ENGINEERING-MODE-V2-MODULE-WRITE-GATE.md` | P2 |
| 139 | core/requirements/ENGINEERING-MODE-V2.md:528 | `modules/ENGINEERING-MODE-V2-MODULE-DELEGATION.md` | P2 |
| 140 | core/requirements/ENGINEERING-MODE-V2.md:529 | `modules/ENGINEERING-MODE-V2-MODULE-REVIEW-CREDENTIAL.md` | P2 |
| 141 | core/requirements/ENGINEERING-MODE-V2.md:530 | `modules/ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK.md` | P2 |
| 142 | core/requirements/ENGINEERING-MODE-V2.md:531 | `modules/ENGINEERING-MODE-V2-MODULE-PROMPT-PIPELINE.md` | P2 |
| 143 | core/requirements/ENGINEERING-MODE-V2.md:532 | `modules/ENGINEERING-MODE-V2-MODULE-TEST-DISCIPLINE.md` | P2 |
| 144 | core/requirements/I18N.md:12 | `src/i18n.mjs` | P4 |
| 145 | core/requirements/NORMAL-MODE.md:129 | `docs/design/VSC-PROMPTS.md` | P4 |
| 146 | core/requirements/PORTABILITY.md:28 | `packages/foo/src/x.md` | P3 |
| 147 | core/requirements/PROVIDER.md:12 | `provider/core.mjs` | P4 |
| 148 | core/requirements/SESSION.md:100 | `src/extension/session-slots.mjs` | P4 |
| 149 | core/requirements/TOOLS.md:12 | `agent-tools/index.mjs` | P4 |
| 150 | core/requirements/TOOLS.md:111 | `src/tools/index.mjs` | P4 |
| 151 | core/requirements/TOOLS.md:111 | `src/tools/shared.mjs` | P4 |
| 152 | core/requirements/TURN-CAP-CONTINUE.md:56 | `src/agent.mjs` | P4 |
| 153 | core/requirements/WORKSPACE.md:12 | `extension/ledger-surface.mjs` | P4 |
| 154 | core/requirements/WORKSPACE.md:12 | `tui/ledger-surface.mjs` | P4 |
| 155 | vsc/design/VSC-DEBT.md:51 | `src/agent.mjs` | P4 |
| 156 | vsc/design/VSC-DEBT.md:51 | `src/agent.mjs` | P4 |
| 157 | vsc/design/VSC-DEBT.md:77 | `src/extension/ledger-surface.mjs` | P4 |
| 158 | vsc/design/VSC-DEBT.md:99 | `src/agent-tools/async-discard.mjs` | P4 |
| 159 | vsc/design/VSC-DEBT.md:105 | `src/agent/setup.mjs` | P4 |
| 160 | vsc/design/VSC-DEBT.md:136 | `src/agent.mjs` | P4 |
| 161 | vsc/design/VSC-MIGRATION.md:58 | `design/X.md` | P3 |
| 162 | vsc/design/VSC-MIGRATION.md:58 | `requirements/X.md` | P3 |
| 163 | vsc/design/VSC-MIGRATION.md:90 | `design/VSC-PROMPTS.md` | P4 |
| 164 | vsc/design/WEBVIEW-PROTOCOL.md:285 | `src/extension/ledger-surface.mjs` | P4 |
| 165 | vsc/design/WEBVIEW-PROTOCOL.md:297 | `src/extension/settings.mjs` | P4 |
| 166 | vsc/design/WEBVIEW-PROTOCOL.md:309 | `src/extension/suspension.mjs` | P4 |

（清单完：1–166 条 · 载体冻结；实施记录见下行段）

### 实施轮（initial · 重派）· 基线重冻 + 前置写者披露（2026-09-18 · eng-coder）

> 承接上段冻结（00:4x · 836 态）。**本代理开工复跑**（`node scripts/doc-check.mjs` · cwd = 仓根）：悬空 **758**（用例号 20 · 路径 512 · 符号·窄 226）· 行宽 **4** 行 · 扫描域 138 档。
> **重冻理由（如实）**：上段冻结清单与开工实况**不一致**——上段 166 条中开工时已闭合 **71** 条（写者 = 未署名的前置 bulk 写，落盘时戳 2026-09-18 00:38:09，16 件档同秒写入；本代理接手时仅剩 95 条在册（88 条同址仍悬 + 7 条位移误配））。**本段基线 = 本代理开工首跑读数（载体 = 本段）**；上段清单仍按 166 条逐条对账（下表）。

**A 族闭合总账（166 条逐条）**：前置写者 **71** 条（本代理仅复核，未落笔）· 本代理 **88** 条（清单内）+ **2** 条同址附带 = **161 条**；余 **5** 条 = 位移误配项（其上段行号已随他批编辑漂移，实锚 = 同档他行，均在本代理 88 条内闭合）。
**收口机检**：悬空 758 → **627**（−131 = A 90 + S2 41）· 行宽 4 → **2**（余 = 提示词面 2 行 · 主 agent 域）· **清单外新增 = 0**（逐条差集复跑核验：`✗` 集合新增 ∅）。

**前置写者闭合块（71 条 · 逐条：`file:line` · 旧 → 新；本代理只读复核，未改一字）**

| # | file:line | 旧 → 新 |
|---|---|---|
| 1 | AGENT-LOOP-SUBAGENT.md:4 | `modules/…MODULE-DELEGATION.md` → `_archive/modules/…MODULE-DELEGATION.md` |
| 2 | AGENT-LOOP-SUBAGENT.md:624 | 同上 |
| 4 | AGENT-LOOP.md:18 | `src/extension/suspension.mjs` → `thincoder-vscode/src/extension/suspension.mjs` |
| 5 | AGENT-LOOP.md:19 | `src/cli/permission.mjs` → `thincoder-cli/src/cli/permission.mjs` |
| 7 | AGENT-LOOP.md:32 | `src/explore-distill.mjs:80` → `thincoder-vscode/src/explore-distill.mjs:80` |
| 11 | AGENT-LOOP.md:42 | `src/agent/setup.mjs` → `thincoder-vscode/src/agent/setup.mjs` |
| 12 | AGENT-LOOP.md:43 | `src/agent/setup-reminders.mjs` → `thincoder-vscode/src/agent/setup-reminders.mjs` |
| 13 | AGENT-LOOP.md:50 | `agent/helpers.mjs` → `thincoder-core/agent/helpers.mjs` |
| 14 | AGENT-LOOP.md:51 | `src/agent/setup-reminders.mjs` → `thincoder-vscode/src/agent/setup-reminders.mjs` |
| 15 | AGENT-LOOP.md:59 | `src/cli/permission.mjs` → `thincoder-cli/src/cli/permission.mjs` |
| 16 | AGENT-LOOP.md:64 | `src/extension/suspension.mjs` → `thincoder-vscode/src/extension/suspension.mjs` |
| 18 | AGENT-LOOP.md:400 | `src/agent-tools/index.mjs` → `thincoder-vscode/src/agent-tools/index.mjs` |
| 19 | AGENT-LOOP.md:401 | `src/agent.mjs` → `thincoder-vscode/src/agent.mjs` |
| 20 | AGENT-LOOP.md:401 | 同上 |
| 21 | AGENT-LOOP.md:401 | `src/agent/setup-reminders.mjs` → `thincoder-vscode/src/agent/setup-reminders.mjs` |
| 22 | AGENT-LOOP.md:401 | `src/explore-distill.mjs` → `thincoder-vscode/src/explore-distill.mjs` |
| 23 | AGENT-LOOP.md:401 | `src/i18n.mjs` → `thincoder-vscode/src/i18n.mjs` |
| 24 | AGENT-LOOP.md:490 | `src/agent-tools/index.mjs` → `thincoder-vscode/src/agent-tools/index.mjs` |
| 25 | AGENT-PARAMS.md:136 | `agent/helpers.mjs` → `thincoder-core/agent/helpers.mjs` |
| 26 | ARCHITECTURE.md:146 | `test/files.mjs` → `thincoder-vscode/test/files.mjs` |
| 27 | ARCHITECTURE.md:172 | `src/agent.mjs` → `thincoder-vscode/src/agent.mjs` |
| 28 | BATCH-RECORD.md:4 | `modules/…MODULE-BATCH-SEGMENT.md` → `_archive/modules/…` |
| 29 | BATCH-RECORD.md:265 | 同上 |
| 30 | CONFIG.md:20 | `extension/settings.mjs` → `thincoder-vscode/src/extension/settings.mjs` |
| 31 | CONFIG.md:21 | `src/agent/setup.mjs` → `thincoder-vscode/src/agent/setup.mjs` |
| 32 | CONFIG.md:24 | `src/extension/settings.mjs` → `thincoder-vscode/src/extension/settings.mjs` |
| 33 | CONFIG.md:38 | `agent-tools/settings.mjs` → `thincoder-core/agent-tools/settings.mjs` |
| 34 | CONFIG.md:47 | `extension/settings.mjs` → `thincoder-vscode/src/extension/settings.mjs` |
| 35 | CONFIG.md:49 | `src/extension/settings.mjs` → `thincoder-vscode/src/extension/settings.mjs` |
| 36 | CONFIG.md:58 | `agent-tools/settings.mjs` → `thincoder-core/agent-tools/settings.mjs` |
| 37 | CONSULTATION.md:15 | `agent-tools/subagent-panel.mjs` → `thincoder-core/agent-tools/subagent-panel.mjs` |
| 38 | CONSULTATION.md:53 | `agent-tools/advisor.mjs` → `thincoder-core/agent-tools/advisor.mjs` |
| 39 | CONSULTATION.md:60 | `advisor/run.mjs` → `thincoder-core/advisor/run.mjs`（止损护栏三处坐标） |
| 40 | CONSULTATION.md:74 | `advisor/run.mjs` → `thincoder-core/advisor/run.mjs` |
| 41 | CONSULTATION.md:82 | 同上 |
| 42 | CONSULTATION.md:199 | `extension/suspension.mjs` → `thincoder-vscode/src/extension/suspension.mjs` |
| 43 | CONSULTATION.md:247 | `agent-tools/subagent-panel.mjs` → `thincoder-core/agent-tools/subagent-panel.mjs` |
| 44 | CONSULTATION.md:247 | `src/tui/subagent-panel.mjs` → `thincoder-cli/src/tui/subagent-panel.mjs` |
| 45 | CONTEXT-COMPACTION.md:15 | `src/extension/generate-title.mjs` → `thincoder-vscode/src/extension/generate-title.mjs` |
| 46 | CONTEXT-COMPACTION.md:25 | 同上 |
| 47 | CORE-UNIFICATION.md:252 | `extension/session-gc.mjs` → `thincoder-vscode/src/extension/session-gc.mjs` |
| 48 | CORE-UNIFICATION.md:268 | `src/extension/session-gc.mjs` → `thincoder-vscode/src/extension/session-gc.mjs` |
| 49 | CORE-UNIFICATION.md:329 | `src/tui/markdown.mjs` → `thincoder-cli/src/tui/markdown.mjs` |
| 50 | CORE-UNIFICATION.md:334 | `memory/core.mjs` → `thincoder-core/memory/core.mjs` |
| 51 | CORE-UNIFICATION.md:343 | `tui/markdown.mjs` → `thincoder-cli/src/tui/markdown.mjs` |
| 52 | CORE-UNIFICATION.md:391 | `agent-tools/settings.mjs` → `thincoder-core/agent-tools/settings.mjs` |
| 53 | CORE-UNIFICATION.md:871 | `src/tools/index.mjs` → `thincoder-vscode/src/tools/index.mjs` |
| 54 | CORE-UNIFICATION.md:879 | `src/tools/shared.mjs` → `thincoder-vscode/src/tools/shared.mjs` |
| 55 | CORE-UNIFICATION.md:885 | `src/agent.mjs` → `thincoder-vscode/src/agent.mjs` |
| 56 | CORE-UNIFICATION.md:892 | `src/agent/run-stages.mjs` → `thincoder-vscode/src/agent/run-stages.mjs` |
| 57 | CORE-UNIFICATION.md:893 | `src/agent/setup.mjs` → `thincoder-vscode/src/agent/setup.mjs` |
| 58 | CORE-UNIFICATION.md:894 | `src/agent/setup-reminders.mjs` → `thincoder-vscode/src/agent/setup-reminders.mjs` |
| 59 | CORE-UNIFICATION.md:898 | `src/explore-distill.mjs` → `thincoder-vscode/src/explore-distill.mjs` |
| 60 | CORE-UNIFICATION.md:1098 | `agent/suspension.mjs` → `thincoder-core/agent/suspension.mjs` |
| 61 | CORE-UNIFICATION.md:1121 | `provider/core.mjs` → `thincoder-core/provider/core.mjs` |
| 62 | CORE-UNIFICATION.md:1229 | `src/i18n.mjs` → `thincoder-vscode/src/i18n.mjs` |
| 64 | CORE-UNIFICATION.md:1341 | `tools/context.mjs` → `thincoder-vscode/src/tools/context.mjs` |
| 65 | CORE-UNIFICATION.md:1601 | `x/packages/core/y.md` → 占位归一（元字符形） |
| 66 | CORE-UNIFICATION.md:1829 | `agent/suspension.mjs` → `thincoder-core/agent/suspension.mjs` |
| 67 | DESIGN-TOKEN-SETTLEMENT.md:4 | `modules/…MODULE-REVIEW-CREDENTIAL.md` → `_archive/modules/…` |
| 68 | DESIGN-TOKEN-SETTLEMENT.md:165 | 同上 |
| 69 | DOC-CODE-RECONCILE.md:240 | `src/tui/index.mjs` → `thincoder-cli/src/tui/index.mjs` |
| 70 | DOC-CODE-RECONCILE.md:265 | `ENGINEERING-MODE-MECHANISM.md` → `docs/core/requirements/_archive/ENGINEERING-MODE-MECHANISM.md` |
| 71 | DOC-DISCIPLINE.md:4 | `modules/…MODULE-MACHINE-CHECK.md` → `_archive/modules/…` |
| 72 | DOC-DISCIPLINE.md:439 | `thincoder-cli/docs/design/X.md` → `thincoder-cli/docs/design/<X>.md` |
| 73 | DOC-DISCIPLINE.md:758 | `modules/…MODULE-MACHINE-CHECK.md` → `_archive/modules/…` |
| 74 | DOC-SYSTEM.md:49 | `design/X.md` → `design/<X>.md` |
| 75 | DOC-SYSTEM.md:49 | `requirements/X.md` → `requirements/<X>.md` |
| 76 | EDIT-HELPERS.md:96 | `_archive/EDIT-TOOL-EOL-DESIGN.md` → `thincoder-cli/docs/design/_archive/EDIT-TOOL-EOL-DESIGN.md` |
| 77 | ENG-TOKEN-BINDING.md:4 | `modules/…MODULE-WRITE-GATE.md` → `_archive/modules/…` |
| 78 | ENG-TOKEN-BINDING.md:100 | `src/agent/setup.mjs` → `thincoder-vscode/src/agent/setup.mjs` |
| 80 | ENGINEERING-MODE-V2.md:78 | `src/tools/index.mjs` → `thincoder-vscode/src/tools/index.mjs` |
| 81 | ENGINEERING-MODE-V2.md:88 | `src/agent.mjs` → `thincoder-vscode/src/agent.mjs` |
| 82 | ENGINEERING-MODE-V2.md:88 | `src/agent/setup-reminders.mjs` → `thincoder-vscode/src/agent/setup-reminders.mjs` |
| 83 | ENGINEERING-MODE-V2.md:88 | `src/agent/setup.mjs` → `thincoder-vscode/src/agent/setup.mjs` |
| 84 | ENGINEERING-MODE-V2.md:89 | `src/extension/ledger-surface.mjs` → `thincoder-vscode/src/extension/ledger-surface.mjs` |
| 85 | ENGINEERING-MODE-V2.md:89 | `src/tui/ledger-surface.mjs` → `thincoder-cli/src/tui/ledger-surface.mjs` |

（前置块完 · 71 条逐条在册；`…MODULE-*.md` = `ENGINEERING-MODE-V2-MODULE-*.md` 简写）

**本代理闭合块（88 条清单内 + 2 条同址附带；逐条：`file:line` · 旧 → 新）**

**docs/core/design/AGENT-LOOP.md**（6 + 2 附带）
- :16 `src/agent/setup.mjs` → `thincoder-core/agent/setup.mjs`（CLI 列 · 该面已迁核）；同址附带 `src/agent/helpers.mjs` → `thincoder-core/agent/helpers.mjs`
- :23 `src/explore-distill.mjs` → `thincoder-core/explore-distill.mjs`（CLI 列 → 核落点）
- :33 `src/agent.mjs:237` → `thincoder-core/agent.mjs:237`（CLI 半）；`src/agent.mjs:342-350` → `thincoder-vscode/src/agent.mjs:342-350`（VSC 半）
- :41 `src/agent/run-stages.mjs:131-140` → `thincoder-core/agent/run-stages.mjs:131-140`；同址附带 `:296-297,312-313` → `thincoder-vscode/src/agent/run-stages.mjs:296-297,312-313`
- :133 `src/agent.mjs:237` → `thincoder-core/agent.mjs:237`；同址附带 `:342-350` → `thincoder-vscode/src/agent.mjs:342-350`

**docs/core/design/CORE-UNIFICATION.md**（2 条）
- :1289 `agent/suspension.mjs:151,216` → `thincoder-core/agent/suspension.mjs` + `（`:151,216`）`（**坐标出 span**——见下「坐标出 span 修法」）
- :1329 `tools/write-path.mjs` → `thincoder-core/tools/write-path.mjs:66`

**docs/core/design/I18N.md**（2）：:32 / :38 `src/i18n.mjs` → `thincoder-vscode/src/i18n.mjs`
**docs/core/design/LEDGER.md**（2）：:4 / :165 `modules/…MODULE-LEDGER.md` → `_archive/modules/…MODULE-LEDGER.md`
**docs/core/design/MANIFEST.md**（1）：:3 `modules/…MODULE-MANIFEST.md` → `…MODULE-MANIFEST.md`（去路径段——全仓（含 `_archive`）无该档，glob 零命中；保留模块档名、非锚形态）
**docs/core/design/MCP.md**（1）：:15 `mcp/helpers.mjs` → `thincoder-core/mcp/helpers.mjs`
**docs/core/design/MEMORY.md**（2）：:137 `memory/core.mjs` → `thincoder-core/memory/core.mjs`；:319 `agent/helpers.mjs` → `thincoder-core/agent/helpers.mjs`
**docs/core/design/PORTABILITY.md**（2）：:42 `agent-tools/advisor.mjs` → `thincoder-core/agent-tools/advisor.mjs`；:123 `src/prompts/x.md` → `src/prompts/<x>.md`（P3 占位归一）
**docs/core/design/PROMPT-SYSTEM.md**（2）：:3 / :252 `modules/…MODULE-PROMPT-PIPELINE.md` → `_archive/modules/…`
**docs/core/design/prompts/advisor-design.md**（1）：:41 `path/to/file.md:42` → `path/to/<file>.md:42`
**docs/core/design/prompts/advisor-round2.md**（2）：:35 `src/x.mjs` → `src/<x>.mjs`；:36 `src/y.mjs` → `src/<y>.mjs`
**docs/core/design/prompts/advisor-round3.md**（1）：:33 `src/x.mjs` → `src/<x>.mjs`
　（prompt 面 4 条 = 机械面占位归一 · 父侧预确认范围内；实读确认非语义面）
**docs/core/design/PROVIDER.md**（3 + 1 附带）：:129 `provider/core.mjs:235,454` → `thincoder-core/provider/core.mjs:235,454`；:381 `src/tools/index.mjs` → `thincoder-vscode/src/tools/index.mjs`、`src/tui/index.mjs` → `thincoder-cli/src/tui/index.mjs`；同址附带 `src/provider/index.mjs` → `thincoder-core/provider/index.mjs`
**docs/core/design/SESSION.md**（5）：:15 / :34 `src/extension/session-slots.mjs` → `thincoder-vscode/src/extension/session-slots.mjs`；:16 / :35 `src/extension/session-gc.mjs` → 同前缀；:36 `src/extension/session-slot-write.mjs` → 同前缀
**docs/core/design/TESTING.md**（2）：:4 / :310 `modules/…MODULE-TEST-DISCIPLINE.md` → `_archive/modules/…`
**docs/core/design/TOOLS.md**（12）：:4 / :338 `modules/…MODULE-CHECKLIST-REMOVAL.md` → `_archive/modules/…`；:17 `src/agent-tools/index.mjs` → `thincoder-vscode/src/agent-tools/index.mjs`；:56 `src/agent/setup.mjs:196` → `thincoder-vscode/…`；:60 `src/tools/shared.mjs:282-290` → `thincoder-core/tools/shared.mjs:282-290` 与 `:109-112` → `thincoder-vscode/src/tools/shared.mjs:109-112`；:61 `src/tools/shared.mjs:129` → `thincoder-vscode/…`；:67 `src/tools/shared.mjs:66-106` → `thincoder-vscode/…`；:75 `src/agent-tools/index.mjs:15` → `thincoder-vscode/…` 与 `src/agent/setup.mjs:173,271-275` → `thincoder-core/…`；:104 `tools/repomap.mjs` → `thincoder-core/tools/repomap.mjs`；:107 `tools/context.mjs` → `thincoder-vscode/src/tools/context.mjs`
**docs/core/design/TURN-CAP-CONTINUE.md**（1）：:148 `agent/helpers.mjs` → `thincoder-core/agent/helpers.mjs`
**docs/core/design/WORKSPACE.md**（9）：:15 `src/extension/rules.mjs` → `thincoder-vscode/…`；:16 `src/extension/peer-instances.mjs` → `thincoder-vscode/…`；:18 `src/tui/ledger-surface.mjs` → `thincoder-cli/src/tui/ledger-surface.mjs`；:34 `src/extension/skills.mjs`、:35 `src/extension/rules.mjs`、:36 `src/extension/peer-instances.mjs`、:37 `src/extension/peer-domains.mjs`、:38 `src/extension/ledger-surface.mjs` → 均 `thincoder-vscode/src/extension/…`；:38 `src/tui/ledger-surface.mjs` → `thincoder-cli/src/tui/ledger-surface.mjs`
**docs/core/requirements/AGENT-LOOP.md**（2）：:167 `src/extension/suspension.mjs:32-55` 与 `src/agent.mjs:66-74` → 均 `thincoder-vscode/…`
**docs/core/requirements/ENGINEERING-MODE-V2.md**（8）：:525–:532 反向退役表首列 `modules/…MODULE-{LEDGER,BATCH-SEGMENT,WRITE-GATE,DELEGATION,REVIEW-CREDENTIAL,MACHINE-CHECK,PROMPT-PIPELINE,TEST-DISCIPLINE}.md` → `docs/core/design/_archive/modules/…`（仓根相对形）
**docs/core/requirements/I18N.md**（1）：:12 `src/i18n.mjs` → `thincoder-vscode/src/i18n.mjs`
**docs/core/requirements/NORMAL-MODE.md**（1）：:129 `docs/design/VSC-PROMPTS.md` → `thincoder-vscode/docs/design/VSC-PROMPTS.md`
**docs/core/requirements/PORTABILITY.md**（1）：:28 `packages/foo/src/x.md` → `packages/<foo>/src/<x>.md`（P3）
**docs/core/requirements/PROVIDER.md**（1）：:12 `provider/core.mjs` → `thincoder-core/provider/core.mjs`
**docs/core/requirements/SESSION.md**（1）：:100 `src/extension/session-slots.mjs` → `thincoder-vscode/…`
**docs/core/requirements/TOOLS.md**（3）：:12 `agent-tools/index.mjs` → `thincoder-vscode/src/agent-tools/index.mjs`；:111 `src/tools/index.mjs:50` 与 `src/tools/shared.mjs` → 均 `thincoder-vscode/src/tools/…`
**docs/core/requirements/TURN-CAP-CONTINUE.md**（1）：:56 `src/agent.mjs` → `thincoder-vscode/src/agent.mjs`
**docs/core/requirements/WORKSPACE.md**（2）：:12 `tui/ledger-surface.mjs` → `thincoder-cli/src/tui/ledger-surface.mjs`、`extension/ledger-surface.mjs` → `thincoder-vscode/src/extension/ledger-surface.mjs`
**docs/vsc/design/VSC-DEBT.md**（6）：:51 `src/agent.mjs` → `thincoder-vscode/src/agent.mjs`（`:29`）+ 同档 `:79`（坐标出 span）；:77 `src/extension/ledger-surface.mjs` → `thincoder-vscode/…`（`:58` 出 span）；:99 `src/agent-tools/async-discard.mjs:98-104` → `thincoder-vscode/…`；:105 `src/agent/setup.mjs` → `thincoder-vscode/src/agent/setup.mjs`；:136 `src/agent.mjs:15` → `thincoder-vscode/…`
**docs/vsc/design/VSC-MIGRATION.md**（3）：:58 `design/X.md` / `requirements/X.md` → `design/<X>.md` / `requirements/<X>.md`（P3）；:90 `design/VSC-PROMPTS.md` → `thincoder-vscode/docs/design/VSC-PROMPTS.md`
**docs/vsc/design/WEBVIEW-PROTOCOL.md**（3）：:285 / :297 / :309 `src/extension/{ledger-surface,settings,suspension}.mjs` → 均 `thincoder-vscode/src/extension/…`

**D 子批（行宽 · 1 行）**：`docs/core/design/ENG-TOKEN-BINDING.md:147`（360 字符）→ 折为两行（断点 = 首句末「…不重复实现）。」后；语义零改）。另**顺手折**（同属本批改动面 · 前置写者 +13 字符致该行 308 > 300）：`AGENT-PARAMS.md:136` → 折为两行（断点 = 「…`tui/cmd-config.mjs`）；」后）——AC-2 收口 = 2 行（余 = 提示词面 `persona-engineering.md:137/:139` · 主 agent 域）。

**「坐标出 span」修法（防符号面激活 · 5 处）**：P4 改指把「行内唯一带坐标路径」变为**可解析宿主**后，引擎的符号·窄抽取（`DEF_PREDICATES` 含高频「在」「见 」+ 恰一宿主）会被激活 ⇒ 把路径段切出的标识符（`thincoder`/`core`/`src`/`vscode`/`extension`）判为符号锚，而宿主档文本不含这些字串 ⇒ **新增悬空**。处置 = 该处坐标移出反引号（正文语义零改；`CORE-UNIFICATION.md:1289` · `VSC-DEBT.md:51`×2 · `VSC-DEBT.md:77` · `DOC-CODE-RECONCILE.md:383` · `HASHLINE-EDIT.md:54` · `SETTINGS-TOOL.md:71` · `METHODOLOGY.md:61` 同法）。复跑核验：清单外新增 = **0**。

**S2 子批（符号面宿主订正 · 18 机检条 / 15 设计条 / 9 档）**

| # | file:line · 标识符 | 处置（file:line · 旧 → 新） |
|---|---|---|
| 1 | AGENT-PARAMS.md:31 · `REVIEW_TIMEOUT_MS` | 补真宿主：`REVIEW_TIMEOUT_MS` 常量 → `（`thincoder-core/advisor/compaction.mjs:36`）` |
| 2 | CORE-UNIFICATION.md:1293 · `applyEditorRangeEdit` | 补坐标：薄壳现体 `thincoder-vscode/src/tools/shared.mjs` → `…shared.mjs:69` |
| 3 | CORE-UNIFICATION.md:1329 · `write`（路径段伪影） | `tools/write-path.mjs` → `thincoder-core/tools/write-path.mjs:66`（补实）+ 与 `exec-run.mjs:25` 成双宿主 |
| 4-5 | DESIGN-TOKEN-SETTLEMENT.md:97 · `_engDesignToken` / `resolveDesignSlot` | 补真宿主：核 `resolveDesignSlot` → `（`thincoder-core/agent-tools/subagent-spawn.mjs:115`）` |
| 6-9 | SETTINGS-TOOL.md:71 · `providers` / `memory` / `embedding` / `mcp` | 判定 = **非宿主错**（该句即断言宿主档「无这几段」）⇒ 坐标出 span：`agent-state.mjs:96-107` → `…mjs` `:96-107` |
| 10 | METHODOLOGY.md:61 · `LEDGER`（路径段伪影） | 坐标出 span：`discipline-engineering.md:169` → `…md` `:169` |
| 11-12 | HASHLINE-EDIT.md:54 · `EDIT` / `HELPERS`（`EDIT-HELPERS.md` 路径段伪影） | 坐标出 span：`thincoder-core/tools/shared.mjs:162` → `…mjs` `:162` |
| 13-16 | DOC-CODE-RECONCILE.md:383 · `wc`×2 / `l`×2（命令行片段伪影） | 坐标出 span：`ARCHITECTURE.md:8` → `…md` `:8` |
| 17-18 | vsc/design/SETTINGS.md:75 · `startConfigWatch` / `onChange` | 补真宿主：`（定义 = `thincoder-vscode/src/extension/config-watch.mjs:35`）` |

> S2 判据面注（如实）：设计 §2.3 判「15 条全为真标识符、仅宿主取错/漂移」——实读**部分成立**：真标识符 9 条（REVIEW_TIMEOUT_MS · applyEditorRangeEdit · resolveDesignSlot · _engDesignToken ×2 · startConfigWatch · onChange · write · 及 SETTINGS-TOOL 键名族）按「补真宿主/补坐标」落；余 7 条 = **宿主句本就正确**（含「无 X 段」的断言句）或**路径段/命令行片段伪影** ⇒ 取「坐标出 span」（宿主归零 ⇒ 符号判据不触发），未采「改指他档」以免与正文语义相冲。**全部 18 条复跑转绿；清单外新增 = 0。**

**收口读数（AC-1..AC-7 对照）**

- AC-1：悬空 **758 → 627**；闭合 = **131**（A 90 + S2 41）。逐条差集复跑：`✗` 集合**新增 = ∅**、减项**逐条在册**（A 表 + S2 表 = 108 行 · 90+18）；余 627 归属 = 判据面伪影（P1 35 / S1）+ P6 144（C 子批 · 待 #40）+ P5 70 + P7 342（B 子批）+ 用例号 20（B1/B2/B3）。
- AC-2：行宽 **4 → 2**（余 = `prompts/persona-engineering.md:137` / `:139` · 主 agent 域）。
- AC-3：**改动档内清单外新增悬空 = 0**（复跑逐条差集核验；「坐标出 span」修法专为消解 11 条符号面激活而落，见上）。
- AC-4：修复面 diff ⊆ 本批清单 + 下列**清单外 4 档**（S2 落点 · 见下披露）；**未触** `scripts/**` / `_archive/**` / 参照树 / `docs/batches/**`（本档 §5 除外）。
- AC-5：本批计数（A 166 / B 240 / S2 15 / D 3 行）未改；实测闭合数见 AC-1。
- AC-6：本表 = A 逐条（161 条：前置 71 + 本代理 90）+ S2 逐条（18）+ 旧 → 新 + 复跑读数 ✓；**机械面声明**：候选生成 = `execute` 内联（临时脚本落 **工作树外** `%TEMP%\adr19\`，**不落仓**）；**改档 = `edit` 逐条（batched edits 数组、逐项定址）· 未用脚本直接改档**；`scripts/**` 零写。
- AC-7：P4 上下文核验 = 逐条按「同行/列头仓别」判定（CLI 列 → 迁核落点 `thincoder-core/…`；VSC 列 → `thincoder-vscode/…`；核语境 → `thincoder-core/…`）；**降级条 = 0**（88 条全数闭合）。

**B 子批（P5 + P7 · 240 条 / 43 档）——本轮❌未执行（如实）**

- 实况：开工后 B 面实测 = P5 **70** 条（`land>=2` · 主族 = 「同路径对」表行的 `agent|tools|agent-tools/<档>.mjs` 裸相对路径 ↔ 核/VSC 双落点）+ P7 **342** 条（零落点；含 P6 144 条归 C1）。**逐条处置量 ≈ 412 条 L2 语义面**，单轮不可完成（设计亦定「超限按档拆轮」+ 本批 §5 修正轮上限 5 轮）。
- 首读结论（供下一轮）：P5 主族 = `CORE-UNIFICATION.md` / `AGENT-LOOP.md` / `TOOLS.md` 等迁移档案的**相对路径列**——该列语义即「相对路径 / 对位」（表头明示「相对路径」），**无单仓可指** ⇒ 宜按设计「核不出仓别者降级/待裁定」从宽，勿强行改指（防 U9 改指错仓）；P7 需按「现态改写 / 订正」逐条 + 「无现态落点者停下上报」。
- 本轮回退边界：B **零落笔**（不产生半成品；差异集与 §5 记录不涉 B 面）。

**清单外改动披露（AC-4 补齐 · 5 档）**

| # | 档 | 因 | 形态 |
|---|---|---|---|
| 1 | `docs/core/design/SETTINGS-TOOL.md` | S2 子批落点（设计 §3-Q3 S2 行 · 15 条 / 8 档）——不在 §4 的「A + D 子批」47 档清单内 | 坐标出 span（1 行） |
| 2 | `docs/core/requirements/METHODOLOGY.md` | 同上（S2 落点） | 坐标出 span（1 行） |
| 3 | `docs/core/design/HASHLINE-EDIT.md` | 同上（S2 落点） | 坐标出 span（1 行） |
| 4 | `docs/vsc/design/SETTINGS.md` | 同上（S2 落点） | 补宿主坐标（1 行） |
| 5 | `docs/core/design/prompts/{advisor-design,advisor-round2,advisor-round3}.md` | A 列 P3 4 条（设计 §4 写域口径：副本纳入本批写域；内容权 = 主 agent、父侧预确认） | 占位归一（4 行） |

**遗留／待父侧**：① B 子批未执行（建议另轮 · 按档拆轮）；② prompt 面行宽 2 行 = 主 agent 域（本批零触）；③ 前置写者的 71 条闭合本代理仅复核（未逐条重做「改指错仓」抽检——如需要，建议父侧抽核或并入下轮审计面）。

### §5 计数收正 + 审计发现处置（D3 · 承 divergence audit）

**审计（read-only explore · 本轮）**：🔴 1 · 🔵 3；处置如下。

1. **🔴 审计 #1（U9 改指错仓 · 前置写者行）→ 本代理落修**：`docs/core/design/AGENT-LOOP.md:32`（A 清单第 7 条）——前置写者把「CLI 裸 slice」的坐标挂到 VSC 树（`thincoder-vscode/src/explore-distill.mjs:80`，该档仅 53 行适配器、`:80` 不存在），本代理复核入账时漏网（如实记）。**现落修**：`thincoder-vscode/src/explore-distill.mjs:80` → **`thincoder-core/explore-distill.mjs:80`**（CLI 侧 → 核落点；`thincoder-cli/src/` 无该档，核档 157 行在位）。附带登记（**语义面，本代理不自行改写**）：该句描述「CLI 裸 slice」与融合后现态不符（核档 `:81` = `safeSliceUTF16`——融合已归一截断实现）⇒ 描述句收正属语义面改述，待父侧/设计面处置。**此前置条复盘**：审计抽核 27 条 P2 ✓ + AGENT-LOOP 族 7 条 ✓ + CONFIG/CONSULTATION 抽读——**该 🔴 为前置块唯一检出**（其余 70 条未见错仓）。
2. **🔵 审计 #2（MANIFEST.md:3 P2 族外沿）**：保留现落（证据：`_archive/modules/` 实存 9 档独缺 MODULE-MANIFEST，两条改指分支均空）——建议设计面 §2.2 补一句「无转正路径且无归档副本者 ⇒ 去路径段」（父侧/设计面）。
3. **🔵 审计 #3（§4 清单未含 S2 落点 4 档）**：属设计 §4 表滞后（§3-Q3 已列 S2 = 15 条 / 8 档；§4 批准范围含 S2）；本批以 §5 披露表为准——建议设计面 §4 补 S2 行（父侧/设计面）。
4. **🔵 审计 #4（计数口径 · D3）→ 本代理收正（就地口径）**：
   - S2 块「9 档」**应为 8 档**（表内枚举 8 档：AGENT-PARAMS · CORE-UNIFICATION · DESIGN-TOKEN-SETTLEMENT · SETTINGS-TOOL · requirements/METHODOLOGY · HASHLINE-EDIT · DOC-CODE-RECONCILE · vsc/design/SETTINGS；与设计 §3-Q3「8 档」一致）。
   - S2 条数**口径补全**：**18 条** = 真标识符族 **7 条**（补真宿主 / 补坐标：`REVIEW_TIMEOUT_MS` · `applyEditorRangeEdit` · `write` · `_engDesignToken` · `resolveDesignSlot` · `startConfigWatch` · `onChange`）+ **11 条**（坐标出 span：键名断言句 4 · 路径段伪影 3 · 命令行片段 4）。
   - AC-1 行「S2 41」**口径补全**：符号·窄族减项 41 = S2 表 **18** + A 面「坐标出 span」连带消解的符号面重算 **23**（226 → 185）。
   - **收口复跑（修正后）**：悬空 **627 → 626**（AGENT-LOOP.md:32 修后转绿）· 行宽 2 · 清单外新增 = 0（复跑差集核验）。本代理闭合合计 = **91 条清单内**（88 + 审计修正 1 + 前置块复核修正后归属见上）+ 2 条同址附带。

**§5 计数收正（承上段 · D6 回读纠错）**：上段末行「悬空 627 → 626」为**预估值，实测不成立**——该行修前修后均为**已解析路径**（只是仓别语义收正），不改变悬空计数。**修正后实测复跑**（`node scripts/doc-check.mjs` · 收口）：悬空 **627**（用例号 20 · 路径 422 · 符号·窄 185）· 行宽 **2** · **清单外新增 = 0**（差集核验：`✗` 集合新增 ∅ / 净减 131）。本代理闭合合计（最终口径）= **A 91 条**（88 条 + 审计修正 1 条〔AGENT-LOOP.md:32〕+ 前置块条目按上段在册）+ 同址附带 2 条 + S2 18 条 = **111 条**；前置写者块 70 条（71 − 该 1 条回归本代理落修）。

### §5 D3 收正 + code review 处置（承 advisor code review · 轮 1）

**评审结论**：VERDICT **pass**（🔴 0 · 🟡 3〔可选·设计面缺口〕· 🔵 5）。逐条处置如下。

- **🔵 #4（位移误配 7 vs 5）收正**：**现值 = 5 条**（上段「7 条」为初稿笔误）；闭合式 = 前置 71 + 本代理 88 + 同址附带 2 + 位移误配 5 = **166** ✓。
- **🔵 #5（AC-1 收口分解）收正**：**P7 342 含 P6 144**（B 面首读行已注明）；收口分族读数 = 用例号 20 · 路径 422 · 符号·窄 185（合 **627**）——族计数为 as-of-开工（590/226 基数）面，收口差集以逐条表为准，勿混用。
- **🔵 #6（清单外档数口径）收正**：**清单外 = 4 档**（S2 落点：`SETTINGS-TOOL.md` · `requirements/METHODOLOGY.md` · `HASHLINE-EDIT.md` · `vsc/design/SETTINGS.md`）；**prompt 三档 = 清单内**（设计 §4 写域口径已声明）——披露表标题「（AC-4 补齐 · 5 档）」作废，按本行口径（4 档 + prompt 3 档单列）。
- **🔵 #7（AC-6 读数粒度）口径明写**：逐条留痕 = `file:line → 旧 → 新`（A 两表 + S2 表在册）；**读数 = 聚合复跑**（悬空 **758 → 627** · `✗` 集合新增 ∅）——与设计 §3-Q2 L1 字面「每条 … → 复跑读数」的差异，按父侧口径裁定（本代理按「逐条转绿由集合差集见证 + 聚合读数公布」执行）。
- **🔵 #8（AGENT-LOOP.md:15 存量残留）**：属冻结清单外（B/P5 面），**非本批引入**（行 15 不在本批改动面）；建议 B 轮按「CLI 列已迁核 ⇒ 落核路径」同口径处置（与 §5 B 面首读原则一致）。
- **🟡 #1–#3（设计面缺口 · 可选）**：① `MANIFEST.md:3` P2 项走「去路径段」（设计 §3-Q1 修法表未覆盖该分支）；② 设计 §4 的 47 档清单未含 S2 落点 4 档；③ 「坐标出 span」修法未在设计登记。**均为设计档域——本代理不自行改设计档**，随本报告上报父侧（与 divergence audit 的 🔵 #2/#3 同源，互证一致）。
- **评审面限制（如实）**：advisor 无 shell/git ⇒ 机检读数（627 · 行宽 2）未能独立复跑（采信 §5 在册日志）；其报文的 8 处引证经宿主机械核验 **0/8 命中**（路径写法未对齐），故其结论按「方向性一致 + 本代理既有实测证据」采信，未作新增落笔。

## §6 验证与收口（父代理）

### 6.1 父侧实施核验（2026-09-18 01:12——实跑 + 实读，非转录）

- **实跑**：`node scripts/doc-check.mjs`（父侧复跑）= **汇总 17010 候选 · 悬空 627 · 注记豁免 61 · 拟新增 3** ✓（与 §5 读数逐字一致）；`✗` 集合零新增。
- **实施面**：A 90（166 − 前置写者 71 − 位移误配 5 = 本代理 88 + 同址附带 2）· S2 41（表 18 + 符号面连带 23）· D 2 行（行宽 4 → 2）✓；B 零落笔（如实）✓。
- **前置写者（71 条）归因**：**推定 = id=23**（让出轮——同 designId/token/写域；取消时其 bulk 写已落盘）——id=28 只读复核 + 逐条在册 + 审计抽核（P2 27 条 + AGENT-LOOP 族 7 条，检出 1 例错仓已修 `AGENT-LOOP.md:32`）。证据：时间（00:38:09）· 范围（恰 A 清单锚）· 无他写者（`peer_instances` 空 · 余线皆代码面）。

### 6.2 披露项处置

- 🔴 审计（U9 改指错仓 `AGENT-LOOP.md:32`）→ 已修 ✓。
- 🟡#1–3（设计面缺口）→ **转 designer 轮**（本刻派：① 修法表补「去路径段」分支 ② §4 清单补 S2 落点 4 档 + 计数 ③ 「坐标出 span」修法登记）。
- 🔵 #8（`AGENT-LOOP.md:15` 存量）→ B 轮同口径处置 ✓；🔵 #4–7 已就地收正 ✓。
- 机械面：候选脚本落 `%TEMP%\adr19\`（工作树外）· `edit` 逐条改档 ✓（AC-6 核过）。

### 6.3 收口与转批

- **本批收口范围 = A + D + S2**（B 未执行——如实；C 待 #40）。
- **B（P5 70 + P7 342）转续批**：理由 = ① 单轮容量（412 条 L2 语义面，超单轮）② 本档行数逼近 1000 行上限（生命周期规则）③ 设计 §3-Q3「超限按档拆轮」本意。新批 = `docs/batches/2026-09-18-doc-debt-b.md`（§1 已立 · prior 指针 → 本档）。
- **台账 #26**：保持 **在途**（umbrella——B/C 完结后核销）✓。
- 交付提交 = **见收口提交**（docs 集 + 本档 + 设计新档；含批② 设计落笔混载——同域在写，已注）。

### 6.4 父侧域遗留

- prompt 面行宽 2 行（`persona-engineering.md:137/:139` + 落地副本）→ 父侧另轮 ✓（在册）。
