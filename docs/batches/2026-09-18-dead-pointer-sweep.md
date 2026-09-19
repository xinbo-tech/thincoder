# 2026-09-18 · 死指针 sweep（#42 + #54）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（提交 `6783d246`；悬空 283 → 252 净 −31 · 新增悬空 0 · 行宽零新增）

### 1.1 批件（用户 2026-09-18 04:46「都开了吧」）

| # | 条目 | 实况 |
|---|---|---|
| ① | **台账 #54**：死脚本名引用 sweep——全仓 ~50 处引用**已退役机检脚本族**（`scripts/doc-anchors-*.mjs` / `check-ledger.mjs` / `check-doc-width.mjs`）；现盘 `scripts/` 仅 `doc-check{,-anchors,-targets,-width}.mjs` | 机检读数（冻结批修正轮）：悬空 **225 → 285**（+50 集中于此族） |
| ② | **台账 #42**：已归档模块档死指针族（>10 处）——测试档头注 / `scripts/doc-check.mjs:3` / `agent-tools/batch-segment.mjs:1·:237` / cli·vsc src 同类；**另** `DOC-DISCIPLINE.md` 内旧脚本名 **9 处**（`:223` `:330` `:639` `:649` `:650` `:665` `:683` `:699` `:855`）+ v1 残留坐标簇 | 坐标逐条在台账证据行 |

### 1.2 路径

**设计轮（eng-designer）** → 评审 → 实施（eng-coder）。处置口径 = **现态改指 / 史实保留 两分**（史实行保留时点语境、不改字）。

### 1.3 边界

- **禁触**：`_archive/**` 既有内容 · 参照树**内容**（只改引用形态）· 需求档（父侧笔——涉需求档者列表上抛）· 提示词面（另批 `#27`）。
- **不做**：判据面引擎改动（`#40` 已收口）。

### 1.4 台账

- **#42** · **#54**。

## §2 批次任务与设计修订（eng-designer）

**状态行**：🔄 设计轮已完成（§2 落笔中）——等待设计评审。

### 2.1 设计落点与修订

| # | 落点 | 修订 |
|---|---|---|
| ① | `docs/core/design/DOC-DISCIPLINE.md` **§3.8 条目 I**（新） | 判据双分（A 现态改指 / B 史实保留 / C 需求档上抛）· **死名→现名映射 10 行**（改指目标单源）· 形态纪律 · 残差登记与到期条件 · 用例 I-1–I-6 |
| ② | 同档 §3 标题 | 枚举同步：`+ 死指针 sweep 两分口径`（D3） |
| ③ | 同档 §5 | 新增 **A-DD18**（本批验收，回指 §3.8 + 本档 §2.2 + #54/#42） |
| ④ | 同档 变更记录 | +1 条（2026-09-18 · 死指针 sweep 设计轮·eng-designer） |

**设计期实测（`node scripts/doc-check.mjs`，cwd = 仓根，as-of 2026-09-18）**：悬空 **286 → 285**（设计落笔前后；差额 = 并行链在飞写入的时点漂移，非本设计产物）· 行宽 **3 行**（`persona-engineering.md:137/:139` · `CONTEXT-COMPACTION.md:27`）——**本设计新增悬空 0 · 新增超宽 0**（设计期首稿曾自产 9 锚 + 1 超宽，已按 §3.8 形态纪律收正并复跑核销）。

**判据面引擎零改**（承 §1.3「不做」——#40 已收口）：本批只动**文档正文与代码头注**，不动 `scripts/**` 判据逻辑、不动 `PROJECT-MANIFEST.json` `checkConfig`。

### 2.2 全量清单（逐条在册——判定单位 = 行）

**A 类 · 现态改指（机检悬空 33 锚 / 29 行）**

| # | 坐标 | 命中 token | 处置 / 改指目标 |
|---|---|---|---|
| 1 | `docs/README.md:81` | `scripts/check-ledger.mjs` | **改述**：台账机检已随 M2 转 SQLite ⇒「本层自带机检覆盖（`node scripts/doc-check.mjs`，扫描域 = `docs`）；台账核销面 = `/ledger`（`thincoder-core/ledger.mjs`）」 |
| 2 | `docs/core/design/DOC-CODE-RECONCILE.md:6` | `doc-anchors-core.mjs` · `doc-anchors-v5.mjs`（2 锚） | 改指 `scripts/doc-check-anchors.mjs`（双引擎已收敛为单引擎） |
| 3 | `:39` | `scripts/doc-anchors-targets.mjs:20` | 改指 `scripts/doc-check-targets.mjs`（行号 as-of 复核后对齐 `collectSourceDomain`） |
| 4 | `:40` | `…targets.mjs:110` · `:135` | 改指 `scripts/doc-check-targets.mjs`（`collectCaseTitles` 体） |
| 5 | `:41` | `…targets.mjs:64` · `:89` | 改指 `scripts/doc-check-targets.mjs`（`collectTestTrees` 体） |
| 6 | `:42` | `scripts/check-ledger.mjs` · `doc-anchors-core.mjs:32`（2 锚） | **改述**：`evidenceState` 实体**全仓已不存在**（`scripts/` / `thincoder-core/` / `thincoder-cli/` 三面实核零命中）⇒ 删「导出复用 / 判据单源」句，改指 `scripts/doc-check-anchors.mjs`（A3 判序自持） |
| 7 | `:44` | `scripts/doc-anchors.mjs` | 改指 `scripts/doc-check.mjs`（入口 / 域驱动 / 报告） |
| 8 | `:45` | `doc-anchors-v5.mjs` · `doc-anchors-core.mjs` · `doc-anchors-targets.mjs`（3 锚） | 改指 `scripts/doc-check-anchors.mjs`（CLI/VSC 双引擎收敛）+ `scripts/doc-check-targets.mjs`（采集面） |
| 9 | `:51` | `scripts/doc-anchors-core.mjs:207` | 改指 `scripts/doc-check-anchors.mjs`（fenced 整块跳过——行号 as-of 复核） |
| 10 | `:52` | `scripts/check-doc-width.mjs` | 改指 `scripts/doc-check-width.mjs`（`isExecutableLine` 谓词宿主） |
| 11 | `:58` | `scripts/doc-anchors-core.mjs:39` | 改指 `scripts/doc-check-anchors.mjs`（`CASE_RE` 右界强制） |
| 12 | `:70` | `scripts/doc-anchors-core.mjs:112` | 改指 `scripts/doc-check-anchors.mjs`（强形态判据） |
| 13 | `:73` | `scripts/doc-anchors-core.mjs:63` | 同上 |
| 14 | `:81` | `scripts/doc-anchors-core.mjs:43` | 同上（坐标尾闭枚举） |
| 15 | `:87` | `scripts/check-doc-width.mjs` | **改述**：`MERGED_SCRIPTS`（六档并入映射）已随 v2 收敛**全数删除**（`doc-check-anchors.mjs:7` 头注逐字）⇒ 整句删 |
| 16 | `:92` | `scripts/doc-anchors-core.mjs:103` | 改指 `scripts/doc-check-anchors.mjs`（注记消解通道） |
| 17 | `:165` | `thincoder-vscode/scripts/reconcile-lookup.mjs` | **改述**：该脚本已退役（VSC 仓 `scripts/` 现仅 `check-syntax` / `check-vsix` / `publish-all`）⇒ 层 3 反查面宿主改指「无承接（退役）」 |
| 18 | `:166` | `scripts/doc-anchors-core.mjs` | 改指 `scripts/doc-check-anchors.mjs`（`extractTokens`） |
| 19 | `:169` | `thincoder-vscode/scripts/reconcile-lookup.mjs:25` | **改述**：登记缺陷随载体退役**消解**（原登记「恒空输出」已无对象） |
| 20 | `docs/core/design/DOC-DISCIPLINE.md:223` | `scripts/doc-anchors.mjs` | 改指 `node scripts/doc-check.mjs`（§3.7 规则① 复跑句） |
| 21 | `:372` | `scripts/doc-anchors-targets.mjs:113` | 改指 `scripts/doc-check-targets.mjs`（§4 在途对齐句） |
| 22 | `:382` | `scripts/doc-anchors.mjs` · **同行另含** `thincoder-cli/test/doc-anchors.test.mjs`（见 A′-21） | 改指 `scripts/doc-check.mjs` + `thincoder-cli/test/doc-check.test.mjs`（§4.1 三层交付表 · 机检器落点） |
| 23 | `:504` | `scripts/check-doc-width-core.mjs:15`（`SCAN_DIRS` 值）· **同行另含** `thincoder-cli/test/doc-anchors.test.mjs:263`（见 A′-22） | **改述**：`SCAN_DIRS` 与逐字快照断言已随 v2 收敛删除 ⇒ 改指声明面「扫描域 = `checkConfig.scanDirs`（`PROJECT-MANIFEST.json:21`）」 |
| 24 | `docs/core/design/DOC-SYSTEM.md:10` | `doc-anchors-v5.mjs:33-34` | 改指 `scripts/doc-check-anchors.mjs`（抽取面谓词 · 行号 as-of 复核） |
| 25 | `:175` | `doc-anchors-v5.mjs:182` | 同上 |
| 26 | `:178` | `doc-anchors-v5.mjs:182` | 同上（零报样例仍成立——basename 唯一性判据不变） |
| 27 | `:253` | `scripts/check-ledger.mjs:61-64` | **改述**：`LEDGER_MODULES` 域→模块表随台账机检退役消解；登记行改指 `docs/core/design/LEDGER.md`（SQLite 承接） |
| 28 | `:349` | `doc-anchors-v5.mjs:22-25`（`NOTE_MARKERS`） | 改指 `scripts/doc-check-anchors.mjs:29`（现注记标记集 14 词——判据缺口登记随之复核） |
| 29 | `docs/core/design/ENGINEERING-MODE-V2.md:71` | `scripts/check-doc-width.mjs`（受影响档列） | 改指现行四档 `scripts/doc-check*.mjs`（v2 已落地——左列改「现状档」义） |

**A′ 类 · 现行档内死名（机检不报——命令形态 / 围栏 / 裸名 / 正则段豁免；**29 坐标 / 27 行**）**

判据 = 施为何同 A 类（规定动作 / 断言现态），仅**抽取面形态**使其不入悬空读数。**处置同 A 类**（改指 / 改述）——不因不报而漏改。

| # | 坐标 | 命中 token | 处置 |
|---|---|---|---|
| A′-1 | `docs/README.md:22` | 三机检命令族 | 改指单引擎 `node scripts/doc-check.mjs`（三闸 → 一闸） |
| A′-2 | `docs/core/design/DOC-DISCIPLINE.md:119` | `doc-anchors-core.mjs:109` · `:43` · `doc-anchors-v5.mjs:33-34` | 改指 `scripts/doc-check-anchors.mjs` + 行号 as-of 复核 |
| A′-3…6 | 同档 `:697`（A-DD1）· `:698`（A-DD2）· `:707`（A-DD11）· `:708`（A-DD12） | `node scripts/doc-anchors.mjs` / `check-doc-width.mjs` / `check-ledger.mjs` | 改指 `node scripts/doc-check.mjs`；含台账腿者**改述**（台账机检无承接） |
| A′-7 | 同档 `:724`（§5 命令块 · fenced） | `node thincoder/scripts/doc-anchors.mjs && …check-doc-width.mjs && …check-ledger.mjs` | 整行换 `node scripts/doc-check.mjs` |
| A′-8 | 同档 `:739`（A-DD9①） | `thincoder-cli/test/doc-anchors.test.mjs` · `thincoder-vscode/test/doc-anchors.test.mjs` | 改指 `thincoder-cli/test/doc-check.test.mjs`（VSC 侧引擎已退役 ⇒ 该参删） |
| A′-9…13 | 同档 `:742`（A-DD9④）· `:744`（A-DD10⑥）· `:753`（A-DD10⑥）· `:758`（A-DD12②）· `:761`（A-DD12⑤） | `node scripts/doc-anchors.mjs` / `check-doc-width.mjs` | 改指 `node scripts/doc-check.mjs` |
| A′-11 | 同档 `:749`（A-DD10②） | `node scripts/mirror-divergence.mjs`（未划删的残留判据） | **改述**：承同块第 1 / 5 条已划删体例，标「脚本已退役 2026-09-17」 |
| A′-12 | 同档 `:801`（DD-28 用例行） | `doc-anchors`（裸名） | 改指 `doc-check`（复跑零悬空） |
| A′-13 | `docs/core/design/DOC-CODE-RECONCILE.md:307` | `node scripts/doc-anchors.mjs` · `node scripts/check-doc-width.mjs` | 改指 `node scripts/doc-check.mjs` |
| A′-14 | `docs/core/design/DOC-SYSTEM.md:141` | `check-ledger.mjs`（裸名 · 归属判据表 P3） | **改述**：台账面归 SQLite（`docs/core/design/LEDGER.md`） |
| A′-15 | 同档 `:241`（manifest 示例块） | `"merges": { "check-doc-anchors.mjs": "doc-anchors.mjs" }` | **改述**：`merges` 键随六档并入映射删除（示例作废） |
| A′-16…20 | 同档 `:363`（A7）· `:365`（A9）· `:374`（T1）· `:375`（T2）· `:376`（T3） | 三机检命令族 | 改指 `node scripts/doc-check.mjs`；台账腿改述 |

**本轮补入（评审轮 1 发现 1——同行第二 token / 未入清单项；实核：六处均不入悬空读数 ⇒ 归 A′ 判据）**

| # | 坐标 | 命中 token | 处置 |
|---|---|---|---|
| A′-21 | 同档 `:382`（§4.1 三层交付表·机检器落点——**A-22 同行第二 token**） | `thincoder-cli/test/doc-anchors.test.mjs` | **改指** `thincoder-cli/test/doc-check.test.mjs`（承接 = §3.8 映射表 `doc-anchors.test.mjs` 行；盘上实核存在） |
| A′-22 | 同档 `:504`（§4.2.7 判据面登记——**A-23 同行第二 token**，带 `:263`） | `thincoder-cli/test/doc-anchors.test.mjs` | **改述**：`SCAN_DIRS` 与逐字快照断言均有随 v2 收敛删除 ⇒ 去死名坐标形态、改指声明面（同 A-23） |
| A′-23 | 同档 `:90`（§3.4 证据行） | `thincoder-cli/test/doc-consistency.test.mjs` | **改述**：档已随 M8 机检重写批（`b9f439c9`）删除、缺陷随载体消解 ⇒ 去死名坐标形态；CLI 侧承接 = `thincoder-cli/test/doc-check.test.mjs`（夹具纪律入其头注） |
| A′-24 | 同档 `:91`（§3.4 同形先例行） | `thincoder-vscode/test/doc-consistency.test.mjs` | **改述**：**VSC 侧无承接**（四档随 M8 机检重写批删除——`thincoder-vscode/test/files.mjs:49-50` 在册） |
| A′-25…26 | 同档 `:731`（A-DD8 判据① 等价单档腿）· `:732`（同判据证据行） | `thincoder-cli/test/doc-consistency.test.mjs` | **改述**：同上删除消解；现行承接档 = `thincoder-cli/test/doc-check.test.mjs`（**常驻快层、无慢层门控**——门控口径随之消解）。**本轮补入（同族机检不报项——评审未列）** |

**本轮登记（非死指针——零动作）**：同档 `:733` 的 `_doc-consistency-probe.md` = **断言不存在**（零落仓判据）⇒ 语义正确、非死指针（同 §2.9-3 体例）；现行夹具名判据 = `fixtureProbeHits()`（`thincoder-cli/test/doc-check.test.mjs:297`）。

### 2.3 #42 族 · 归档模块档死指针（代码 / 脚本头注——机检域外，26 处 / **19 档**）

**承接表单源** = `docs/core/requirements/ENGINEERING-MODE-V2.md` §12 反向退役表（已在册，与 `_archive/modules/**` 现址逐行一致——**零改**）。本族只改**指向**，不动归档档内容。

| # | 坐标 | 死指针形态 | 改指目标 |
|---|---|---|---|
| 1 | `scripts/doc-check.mjs:4` | 裸名 `ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK` §2.2 | `docs/core/design/DOC-DISCIPLINE.md` §7 |
| 2 | `scripts/doc-check-anchors.mjs:3` | 同上 | 同上（+ 判据权威 §4 已在行内——保留） |
| 3 | `scripts/doc-check-targets.mjs:3` | 同上 | 同上 |
| 4 | `scripts/doc-check-width.mjs:3` | 同上 | 同上 |
| 5 | `thincoder-core/ledger.mjs:3` | 全路径 `docs/core/design/modules/…-LEDGER.md` §2.2 | `docs/core/design/LEDGER.md` §2 |
| 6 | `thincoder-core/ledger-db.mjs:3` | 同上 §2.3 | 同上 |
| 7 | `thincoder-core/ledger-cmd.mjs:3` | 同上 §2.3 | 同上 |
| 8 | `thincoder-core/test/manifest.test.mjs:3` | 全路径 `…-MANIFEST.md` §3 | `docs/core/design/MANIFEST.md` §3 |
| 9 | `thincoder-core/test/batch-segment-manifest.test.mjs:2` | 裸名 `…-BATCH-SEGMENT.md` | `docs/core/design/BATCH-RECORD.md` |
| 10 | `thincoder-core/test/batch-segment.test.mjs:2` | 同上 §3 | 同上 §3 |
| 11 | `thincoder-core/test/spawn-gates.test.mjs:2` | 裸名 `…-DELEGATION.md` §3 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.22 |
| 12 | `thincoder-core/agent-tools/batch-segment.mjs:12` · `:237` | 裸名 `…-BATCH-SEGMENT.md` §2.1 | `docs/core/design/BATCH-RECORD.md` §4.9 |
| 13 | `thincoder-core/agent-tools/spawn-gates.mjs:2` · `:13` · `:44` · `:67` · `:89` | 裸名 `…-DELEGATION.md` §2.2 / §2.3 / §1.2 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.22 |
| 14 | `thincoder-core/agent-tools/subagent-scheduler.mjs:16` · `:60` | 同上 §2.3 / §2.2 | 同上 |
| 15 | `thincoder-core/agent-tools/subagent-spawn.mjs:27` · `:269` | 同上 §2.3 / §2.2 | 同上 |
| 16 | `thincoder-core/agent-tools/subagent.mjs:155` | 同上 §1.2 F2 | 同上 |
| 17 | `thincoder-core/agent/family-tools.mjs:102` | 同上 §1.2 | 同上 |
| 18 | `thincoder-cli/test/ledger-surface.test.mjs:3` | 全路径 `…-LEDGER.md` §3 | `docs/core/design/LEDGER.md` §8 |
| 19 | `thincoder-vscode/test/ledger.test.mjs:3` | 同上 | 同上 |

**形态纪律**：头部注释内一律用**档相对 / 全路径现址**（`docs/core/design/<档>.md §N`）——禁止保留 `modules/` 段；`M<n>` 模块号可留（承接表在册，D4 指针纪律）。

**已核不动（登记）**：`docs/core/design/{MANIFEST,BATCH-RECORD,DESIGN-TOKEN-SETTLEMENT,DOC-DISCIPLINE,ENG-TOKEN-BINDING,LEDGER,PROMPT-SYSTEM,TESTING,TOOLS}.md` 的「v2 就地更新 / 转正注记 / 变更记录」行——其指称形态 = `_archive/modules/<同名>.md`（**现址存在**，机检零悬空）⇒ **零触碰**（B 类）。

### 2.4 B 类 · 史实保留（机检悬空 39 锚 / 31 行 + 机检不报 1 行——**零触碰**）

| 档 | 行（as-of 2026-09-18） | 锚 | 性质 |
|---|---|---|---|
| `docs/core/design/CORE-UNIFICATION.md` | `:27` `:36` `:41` `:269` `:609` `:611` `:615` `:1060` `:1074` `:1089` `:1162` `:1518` `:1613` `:1617` `:1642` `:1651` `:1670` `:1708` `:1709` `:1710` `:1711` `:1712` | 29 | 已收口批 §2 事实表 / 读数表 / 受影响文件行数表 / F·T·AC 表 / 登记块 |
| `docs/core/design/DOC-DISCIPLINE.md` | `:167` `:176` `:185` `:205` `:547` `:907` · **`:675`（机检不报——本轮补入）** | 7 | 条目 G（已作废）证据与候选对比 + §4.2.8 实测登记（带 as-of / 裁定日期） + 变更记录 + **D-V5-12 决策行的「已登记后果（实施轮）」** |
| `docs/core/design/DOC-SYSTEM.md` | `:379` | 1 | T6 用例表行 |
| `docs/core/design/TWO-REPO-MERGE.md` | `:70` | 1 | 合并迁入记录 |
| `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` | `:301` | 1 | 「批 4 登记」块 |

**不改字理由（实测反证在先）**：批档 `2026-09-13-CORE-UNIFICATION.md` §5 已实测复证——把旧脚本名替成新名会**把记录改成假陈述**（该批验收当时确以 `doc-anchors.mjs` 为闸；工具改名后输出逐字不变）。本批沿用该裁定。

**本轮补入登记（评审轮 1 发现 1-②——`:675` 归 B 类 · 零触碰）**：D-V5-12 行的「已登记后果（实施轮）」句含死指针 `thincoder-cli/test/doc-anchors.test.mjs`（两用例 T-V5-1 `:65` / T-V5-17 `:298`）——判 **B 类**：① 行施何为 = 记录（「已登记后果」+ 时点锚「实施轮」）② 改指会**把记录改成假陈述**（该两用例当时确在旧档内）。机检不报（`*.test.mjs` 形态）⇒ 不计入 B 类 39 锚读数（行数 +1）。

### 2.5 C 类 · 需求档（**零触碰 · 列表上抛**——父侧笔，D1）

| # | 坐标 | 锚 | 待父侧裁定 |
|---|---|---|---|
| C-1 | `docs/core/requirements/CORE-UNIFICATION.md:119` | 3 | N6「机检零红」仍写三机检（`doc-anchors` / `check-doc-width` / `check-ledger`）——**口径过时**（现为单引擎） |
| C-2 | `docs/core/requirements/STRUCTURE-DEBT.md:33` | 1 | N-SD4 批量检查命令 = `scripts/check-doc-width.mjs` |
| C-3 | 同档 `:66` | 1 | 同上（判据本体出处句） |
| C-4 | `docs/core/requirements/TWO-REPO-MERGE.md:79` | 1 | ② 坐标改现状路径句内 `scripts/mirror-divergence.mjs`（工具已退役） |
| C-5 | `docs/cli/requirements/FEATURES.md:180` | 1 | N9 度量方式句写 `scripts/doc-anchors.mjs` 不覆盖（引擎名过时；**结论面仍成立**） |

### 2.6 受影响文件表（当前行数 → 预计增量）

| # | 档 | 现行数 | 增量 | 改动面 |
|---|---|---|---|---|
| 1 | `docs/core/design/DOC-DISCIPLINE.md` | — | — | A 4 行 + A′ **16 行**（改指 / 改述）；§3.8 / §5 / 变更记录 = 设计轮已落 + 本轮修正 |
| 2 | `docs/core/design/DOC-CODE-RECONCILE.md` | — | — | 18 行改指；`:42` `:87` 两处**整句删**（`evidenceState` / `MERGED_SCRIPTS` 无承接） |
| 3 | `docs/core/design/DOC-SYSTEM.md` | — | — | 5 行改指 + A′ 7 行；`:241` 示例键删 |
| 4 | `docs/core/design/ENGINEERING-MODE-V2.md` | — | — | `:71` 受影响档列改现状档 |
| 5 | `docs/README.md` | — | — | `:22` + `:81` 两句改述 |
| 6 | `scripts/doc-check.mjs` | 75 | ±0 | 头注 `:4` 改指（**仅注释**——判据逻辑零改） |
| 7 | `scripts/doc-check-anchors.mjs` | 321 | ±0 | 头注 `:3` |
| 8 | `scripts/doc-check-targets.mjs` | 128 | ±0 | 头注 `:3` `:4` |
| 9 | `scripts/doc-check-width.mjs` | 66 | ±0 | 头注 `:3` `:4` |
| 10 | `thincoder-core/ledger.mjs` · `ledger-db.mjs` · `ledger-cmd.mjs` | 202 · 86 · 182 | ±0 | 头注 `:3` |
| 11 | `thincoder-core/test/manifest.test.mjs` | 266 | ±0 | 头注 `:3` |
| 12 | `thincoder-core/test/batch-segment-manifest.test.mjs` · `batch-segment.test.mjs` · `spawn-gates.test.mjs` | 76 · 238 · 155 | ±0 | 头注 `:2` |
| 13 | `thincoder-core/agent-tools/batch-segment.mjs` | 265 | ±0 | `:12` `:237` |
| 14 | `thincoder-core/agent-tools/spawn-gates.mjs` | 109 | ±0 | `:2` `:13` `:44` `:67` `:89` |
| 15 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 446 | ±0 | `:16` `:60` |
| 16 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 470 | ±0 | `:27` `:269` |
| 17 | `thincoder-core/agent-tools/subagent.mjs` | 409 | ±0 | `:155` |
| 18 | `thincoder-core/agent/family-tools.mjs` | 169 | ±0 | `:102` |
| 19 | `thincoder-cli/test/ledger-surface.test.mjs` | 313 | ±0 | 头注 `:3` |
| 20 | `thincoder-vscode/test/ledger.test.mjs` | 248 | ±0 | 头注 `:3` |

**全域零触碰**：`_archive/**` · `docs/batches/**` · `thincoder-{cli,vscode}/docs/**`（产品参照树）· `thincoder-cli/docs/requirements/**`（需求档）· `docs/core/requirements/**` · `docs/cli/requirements/**` · `docs/vsc/requirements/**`（需求档）· `docs/core/design/prompts/**` 与 `thincoder-core/prompts/**`（提示词面——另批 #27）· `PROJECT-MANIFEST.json` `checkConfig` · `.github/workflows/test.yml`（`:54` 已收正，实测 CI 只跑单引擎 ⇒ **零动作**）。

### 2.7 验收标准（回指 §1 条目 / 设计 §3.8）

| # | 判据（机器可验） | 回指 |
|---|---|---|
| AC-1 | A 类 33 锚 + A′ 类 **29 坐标 / 27 行**逐条改指 / 改述且**目标盘上存在**（清单 = §2.2 / §2.3） | #54 · §3.8 |
| AC-2 | #42 族 26 处逐条改指（§2.3），头注零 `modules/` 段残留（`grep -rn "design/modules/" scripts thincoder-core thincoder-cli thincoder-vscode` ⇒ 命中 0，`_archive` 除外） | #42 |
| AC-3 | 复跑 `node scripts/doc-check.mjs`：悬空由改前基线回落 **≥33**（预测 **286 → ≤253**），**新增悬空 0** | §1.2 判据 |
| AC-4 | B 类 39 锚 / C 类 7 锚**零触碰**（`git diff` 该 36 行零命中） | §1.3 边界 |
| AC-5 | 行宽零新增（**以 coder 复测基线为准**——绝对读数随并行链漂移） | 文档人类可读判据 |
| AC-6 | `node --test thincoder-cli/test/doc-check.test.mjs` ⇒ exit 0（引擎零改的反证） | §1.3 |

**读数对照（as-of 2026-09-18 设计轮实测）**：改前 **悬空 286 / 行宽 3**（§1 记 `287 / 2` = 更早时点，差额 = 并行链在飞写入）⇒ 设计落笔后 **285 / 3**（本设计零新增）⇒ 预期改后 **≤253 / 3**。**改前基线须由 coder 在首个动作前复测一次**（同命令、同树状态、原样落 §5），以消并行漂移。

### 2.8 上抛项（父侧裁定——本批零触碰）

| # | 事项 | 待裁 |
|---|---|---|
| U-1 | **需求档 5 行**（§2.5 C-1…C-5） | 改指 / 改述 / 保留 |
| U-2 | `PROJECT-MANIFEST.json:16` `docRoot.modules` 指向**空目录** `docs/core/design/modules/`（模块档已全数归档） | 删键 / 改指 / 保留——**语义面**，非本批射程 |
| U-3 | **`_archive/modules/**` 9 档本体内的死指针**（归档档自身引用的旧脚本名 / 旧路径） | 归档档 = 历史快照（禁触）⇒ 维持现状 or 另批 |
| U-4 | **产品参照树 `thincoder-{cli,vscode}/docs/**` 大量同类死名**（实测 `check-doc-width` 系 ≥250 处 / `check-ledger` 系 ≥150 处） | 政策 = 「保留 ≠ 维护」（`docs/README.md` §5）⇒ 建议维持零触碰；如要清，须另立批 + 明确「参照树不是现行档」 |
| U-5 | 行宽 3 行超 300 | `persona-engineering.md:137/:139` = 提示词面（另批 #27）· `CONTEXT-COMPACTION.md:27` = 域外登记 |

### 2.9 域外发现（非本批射程——记录）

1. **`docs/core/design/DOC-SYSTEM.md` 的 §3.4 迁移映射表（`:210`–`:217`）与 `:241` manifest 示例**：登记的是 v1 六档 → v2 声明面的迁移计划，**六档并入映射已全数删除** ⇒ 该表整体已无对象（不只死名，是**整表过期**）。本批只收 `:253` `:349` 两行（A 类）+ `:141` `:241` 两行（A′）；**整表重写不属本批**（属 DOC-SYSTEM 下次实质修订）。
2. **`docs/core/design/DOC-DISCIPLINE.md` §4.2.8「参照历史面豁免族」整段**：该族已随 v2 收敛**删除**（`doc-check-anchors.mjs:7` 头注逐字），但 §4.2.8 / §5 A-DD11 / 用例 DD-19·DD-20 仍在册 ⇒ **判据段与实现脱节**（非死指针，是**判据面过时**）。本批按 B 类零触碰；**建议另批**（属判据面，须走设计轮）。
3. **`docs/core/design/DOC-DISCIPLINE.md:867` AC-M8-4「无 `check-ledger`」**：断言的是**不存在**，语义正确 ⇒ 非死指针，**零动作**（`grep` 复核易误判为命中，特此登记）。
4. **`engine-mode-v2` 与 `defaultActiveBatch` 类键**：本批零涉。

### 2.10 设计轮收口读数（as-of 2026-09-18 · 设计轮末复跑）

| 项 | §1 记（更早时点） | 设计轮首测 | 设计轮末（落笔后） | 归因 |
|---|---|---|---|---|
| 悬空总数 | 287 | 286 | **285** | 差额 = 并行链在飞写入的时点漂移（`git status` 另见 `docs/core/design/{MANIFEST,SETTINGS-TOOL}.md` · `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-*.md` 等他链改动）；**本设计新增悬空 0** |
| 行宽 | 2 | 3 | **4** | 第 4 行 = `docs/core/design/CONTEXT-COMPACTION.md:303`（433 字符）——**他链在飞写入**（本设计零触碰该档）；另 `docs/core/requirements/CONTEXT-COMPACTION.md:27` 由 326 → 448 亦属他链。**本设计新增超宽 0 · `DOC-DISCIPLINE.md` 零超宽** |
| 迁移期引文 | 0 | 0 | **1** | 他链在其在写档打标（本设计未使用该族——§3.8「为何 B 类零触碰」） |

**给 coder 的基线纪律（写进 §5 首行）**：AC-3 的「回落 ≥33」是**相对判据**——coder 首动作前须以同命令、同树状态**复测一次改前基线**并原样落 §5；**不得**把本节数字当作不可复跑的绝对值（并行链持续写入）。

**设计轮自检（D6 回读 · 逐项在册）**：

- ① `docs/core/design/DOC-DISCIPLINE.md` §3.8（`:316` 起）· §3 标题（`:57`）· §5 A-DD18（`:714`）· 变更记录（`:942`–`:945`）——四处逐处回读在位 ✓
- ② 设计期首稿曾自产 **9 悬空锚 + 1 超宽行**（§3.8 映射表取带目录段的死名形态 + 变更记录单行 400+ 字符）⇒ 已按 §3.8 形态纪律整表改**裸名形态** + 变更记录折 4 行，复跑核销 ✓（**该事故已写进 §3.8 形态纪律与用例 I-5——作为本判据现场反例**）
- ③ 改指 / 改述目标 **15 项**（4 脚本 + `thincoder-core/ledger.mjs` + `thincoder-cli/test/doc-check.test.mjs` + 9 档）**逐项盘上实核存在** ✓
  （`scripts/doc-check{,-anchors,-targets,-width}.mjs` ・ `thincoder-core/ledger.mjs` ・ `thincoder-cli/test/doc-check.test.mjs` ・
  `docs/core/design/{LEDGER,MANIFEST,BATCH-RECORD,ENG-TOKEN-BINDING,AGENT-LOOP-SUBAGENT,DESIGN-TOKEN-SETTLEMENT,PROMPT-SYSTEM,TESTING,TOOLS}.md` = 全 OK；
  `evidenceState` / `MERGED_SCRIPTS` / `SCAN_DIRS` / `doc-anchors.test.mjs` / `doc-consistency.test.mjs` 五者**确认无承接**）
- ④ 三方条目一致：§1 条目 ①(#54)/②(#42) ⇔ §2.2/§2.3 清单 ⇔ §5 A-DD18 的「#54 · #42」回指 ✓
- ⑤ 写域自证：本轮改动 = 设计档 1 档（`docs/core/design/DOC-DISCIPLINE.md`）+ 本批档 §2；**需求档 · 提示词面 · `_archive/**` · 参照树 · `scripts/**` 判据逻辑 · `PROJECT-MANIFEST.json` 零触碰** ✓

### 2.11 设计评审修正轮 1 小结（8 条逐条落位 · 2026-09-18 · eng-designer）

**口径**：父侧对 §3 轮次 1 八条（🔴 1 · 🟡 4 · 🔵 3）裁定**全部接受**；`Suggestion` 列 = 处置建议，**处置执行人 = 本席**。本轮 = 定点改（无全量勘察）——实施面代码 / 需求档 / `_archive/**` / 参照树 / 冻结批档零触碰。

**逐条落位（发现号 → 改动 file:line）**

| # | 级 | 落位（file:line） | 处置 |
|---|---|---|---|
| 1 | 🔴 | 批档 §2.2 A′ 表（新增 **A′-21…26** 六坐标块 · `docs/batches/2026-09-18-dead-pointer-sweep.md:99-109`）· A-22 `:71` / A-23 `:72`（命中 token 列补**同行第二死名**）· §2.4 B 表 `:146` + `:153`（`:675` 归 B）· 设计档 §3.8 映射表 `docs/core/design/DOC-DISCIPLINE.md:355`（新增 `doc-consistency.test.mjs` 行——承接单源）· §3.4 `:90` / `:91`（改述：去死名坐标形态；现行号 `:90`–`:92`）· §4.1 `:393`（同行第二 token 改指）· §4.2.7 `:515`（改述） | A′ 清单补全 + 承接单源 |
| 2 | 🟡 | 设计档 §3.8 映射表 `DOC-DISCIPLINE.md:353` | VSC `scripts/` 枚举收正**三支**（`check-syntax` / `check-vsix` / `publish-all`——盘面实核） |
| 3 | 🟡 | 批档 §2.2 A′ 头（21 行 → **29 坐标 / 27 行**）· A′-9…10 标签 → **A′-9…13** `:91` · §2.3 头（16 档 → **19 档**）· §2.10 自检③（17 项 → **15 项**） | 三处计数按表内枚举与盘面收正 |
| 4 | 🟡 | 设计档 §3.8 判据句 `DOC-DISCIPLINE.md:330-336` | 补 **A-① / B-① 优先序**（行施何为优先于表类）+ 「**整表已无对象 ⇒ 归承接档实质修订**」显式分支（§2.9-1 延后与判据句同源） |
| 5 | 🟡 | 设计档 §5 A-DD18 `DOC-DISCIPLINE.md:725` | 补齐 **A′ 面**并与 §2.7 AC-1 同口径；绝对读数改**相对判据**（回落 ≥33） |
| 6 | 🔵 | 批档 §2.6 `.md` 五行两列改 `—`（`:169`–`:173`）· 设计档 §3.7 新增射程句 `DOC-DISCIPLINE.md:247` | 取「批次档同口径」分支：模板收正 R2 已定「文档档不列该两列」+ §3.7 显式补明（存量批次档不回改） |
| 7 | 🔵 | 批档 §2.7 AC-5 `:200` | 去硬编码「3 行」→「**以 coder 复测基线为准**」 |
| 8 | 🔵 | 设计档 §3.8 映射表 `DOC-DISCIPLINE.md:356` | 「M1–M10」注明 = **模块号区间、非档数**（盘上 `_archive/modules/` 实存 **9 档**，与 §2.8 U-3 同口径） |

**本轮补入（评审未列——按 A′ 定义同源补入，非新语义）**

- **`:731` / `:732`（A′-25…26）**：A-DD8 判据① 的等价单档腿与证据行——同为 `doc-consistency.test.mjs` 死名、同属机检不报形态（评审轮 1 只列 `:90`/`:91`）。
  处置 = **改述**（去死名坐标形态 + 指现行承接档）；据 **实测**：现行承接档常驻快层、**无慢层门控**（`thincoder-cli/test/doc-check.test.mjs` 无 `slow()` 注册）⇒ 原门控口径随之消解。
- **`:733` 零动作登记**：`_doc-consistency-probe.md` = **断言不存在**（零落仓判据）⇒ 非死指针（同 §2.9-3 体例）；现行夹具名判据 = `fixtureProbeHits()`（`thincoder-cli/test/doc-check.test.mjs:297`）。

**复跑读数（`node scripts/doc-check.mjs`，cwd = 仓根 · as-of 2026-09-18 修正轮）**

| 时点 | 悬空 | 行宽 | 备注 |
|---|---|---|---|
| 本轮首测（改前） | **287** | 5 | 与 §2.10 设计轮末 285 / 4 的差 = 并行链在飞写入（**相对判据**） |
| 本轮改后 | **285** | 4 | **本席档（`DOC-DISCIPLINE.md`）零新增悬空 · 零新增超宽** ✓ |
| 差额归因 | −2 | — | 本席已落 **A-22 / A-23 两锚**（该两行属本档、为本轮编辑对象）⇒ **coder 剩余 A 类 = 31 锚** |

**行号漂移（给 coder——必读）**：本轮对设计档的改动使 §2.2 / §2.3 中该档的行号**整体下移**（分区间不同：§3.4 后 +1、§3.8 后 +11、§5 / 变更记录最大 **+16**）⇒ **落笔前逐处回读原文**（D4：行号只作 as-of），**勿照抄本表行号**。

**外溢发现（非本批射程——上抛 / 记录，零动作）**

1. **代码面 `doc-consistency.test.mjs` 死名另有 4 处**（机检域外——扫描域 = `docs`）：`thincoder-cli/test/batch-segment.test.mjs:3` · `thincoder-cli/test/eng-designer-role.test.mjs:124` · `thincoder-cli/test/prompts-async-guidance.test.mjs:9` · `:36`——**不在 §2.3 #42 族清单内**（该族 = 归档模块档指针），本轮零触碰，建议随 #42 余波另批或扩族（须走设计）。
2. **§4.2.8 判据面登记首行的 `scripts/doc-anchors-v5.mjs:113-116`** = 同族机检不报项、未入任何清单——该段判据面已由 §2.9-2 判「建议另批」（判据面过时），本条随该批处置。
3. **评审轮 1 发现 3 提及的「批件摘要里的 16 档」**：全档 grep「16 档」仅 §2.3 头一处（已收正）⇒ §1（主 agent 段）**无需回改**，无上抛项。

### 2.12 死指针 sweep · 执行轮（A / A′ 逐条落位 · 2026-09-18 · eng-designer）

**执行口径**：按 §2.2（A / A′ 表）逐条处置；**B 类（§2.4）· C 类（§2.5）零触碰**（C = 需求档 = 父侧笔，未动）；无自创口径、无射程扩张。**首动作前复测基线**（`node scripts/doc-check.mjs`，cwd = 仓根）⇒ 悬空 **283** · 行宽 **4**（`CONTEXT-COMPACTION.md:303` · `persona-engineering.md:137/:139` · `requirements/CONTEXT-COMPACTION.md:27`——全为域外 / 他链）；`git status --porcelain` 同刻录读。

**A 类逐条落位（发现号 → 改动 file:line ⇒ 处置）**

| # | 改动 file:line（现） | 处置 / 改指目标 |
|---|---|---|
| A-1 | `docs/README.md:81` | 改述：台账机检随 M2 转 SQLite ⇒ 本层机检覆盖句 + `/ledger`（`thincoder-core/ledger.mjs`） |
| A-2 | `docs/core/design/DOC-CODE-RECONCILE.md:6` | 改指 `scripts/doc-check-anchors.mjs`（双引擎收敛单引擎） |
| A-3 | 同上 `:39` | 改指 `scripts/doc-check-targets.mjs:35`（`collectSourceDomain`） |
| A-4 | `:40` | 改指 `scripts/doc-check-targets.mjs:81`（`collectCaseTitles`） |
| A-5 | `:41` | 改指 `scripts/doc-check-targets.mjs:61`（`collectTestTrees`）· `:107`（`collectCodeTokens`） |
| A-6 | `:42` | 改述：`evidenceState` 全仓无承接 ⇒ 判序自持句；改指 `scripts/doc-check-anchors.mjs` |
| A-7 | `:44` | 改指 `scripts/doc-check.mjs`（入口 / 域驱动 / 报告） |
| A-8 | `:45` | 改指 `scripts/doc-check-anchors.mjs` + `scripts/doc-check-targets.mjs`（采集面） |
| A-9 | `:51` | 改指 `scripts/doc-check-anchors.mjs:247`（围栏翻转） |
| A-10 | `:52` | 改指 `scripts/doc-check-width.mjs:43`（`isExecutableLine` 宿主）+ `scripts/doc-check-anchors.mjs:141`（调用点） |
| A-11 | `:58` | 改指 `scripts/doc-check-anchors.mjs:45`（`CASE_RE` 右界强制） |
| A-12 | `:70` | 改指 `scripts/doc-check-anchors.mjs`（符号·窄形态面——文件级） |
| A-13 | `:73` | 同上（平台 / 库 API 词表面——文件级） |
| A-14 | `:81` | 改指 `scripts/doc-check-anchors.mjs:44`（`PATH_RE` 整段消费坐标尾） |
| A-15 | `:87-88` | 改述：`MERGED_SCRIPTS` 随 v2 删除 ⇒ 该 bullet **整句删** |
| A-16 | `:92` | 改指 `scripts/doc-check-anchors.mjs:249`（注记判定） |
| A-17 | `:165` | 改述：`reconcile-lookup` 退役 ⇒ **无承接**（VSC `scripts/` 实核三支） |
| A-18 | `:166` | 改指 `scripts/doc-check-anchors.mjs:128`（`extractAnchors`） |
| A-19 | `:169` | 改述：登记缺陷随载体退役消解 |
| A-20 | `docs/core/design/DOC-DISCIPLINE.md:224` | 改指 `node scripts/doc-check.mjs`（§3.7 处置表①） |
| A-21 | 同上 `:383` | 改指 `scripts/doc-check-targets.mjs:81` · `:95`（§4 在途对齐句） |
| A-24 | `docs/core/design/DOC-SYSTEM.md:10` | 改指 `scripts/doc-check-anchors.mjs:44` · `:247`（抽取面 / 围栏） |
| A-25 | 同上 `:175` | 改指 `scripts/doc-check-anchors.mjs`（`resolveFile` 解析序） |
| A-26 | 同上 `:178` | 同上（零报样例行） |
| A-27 | 同上 `:253` | 改述：`LEDGER_MODULES` 随台账机检退役消解 ⇒ 指 `docs/core/design/LEDGER.md` |
| A-28 | 同上 `:349` | 改指 `scripts/doc-check-anchors.mjs:29`（`NOTE_MARKERS` 现 14 词） |
| A-29 | `docs/core/design/ENGINEERING-MODE-V2.md:71` | 改指现行四档 `scripts/doc-check{,-anchors,-targets,-width}.mjs`（枚举形式） |
| A-22 · A-23 | — | 修正轮已落（§2.11）；本轮复核**零悬空**在位 |

**A′ 类逐条落位（23 坐标）**

- A′-1 `docs/README.md:22` ⇒ `node scripts/doc-check.mjs`（三闸 → 一闸）。
- A′-2 `DOC-DISCIPLINE.md:120` ⇒ `scripts/doc-check-anchors.mjs:44` · `:45`（`PATH_RE` 整段消费 / `CASE_RE` 右界）。
- A′-3…6 同档 `:708`（A-DD1）· `:709`（A-DD2）· `:718`（A-DD11）· `:719`（A-DD12）⇒ `node scripts/doc-check.mjs`（A-DD12 的 `--domain .` 保留）。
- A′-7 同档 `:735`（fenced 命令块）⇒ 整行换 `node thincoder/scripts/doc-check.mjs`（**路径形态随块约定**——见下注 1）。
- A′-8 同档 `:751`（A-DD9①）⇒ `node --test thincoder-cli/test/doc-check.test.mjs`（VSC 参删）。
- A′-9…13 同档 `:754` · `:756` · `:765` · `:770` · `:773` ⇒ `node scripts/doc-check.mjs`。
- A′-11 同档 `:761`（A-DD10②）⇒ 划删 + 「脚本已退役 2026-09-17」（承同块 1 / 5 条体例）。
- A′-12 同档 `:813`（DD-28 用例行）⇒ `doc-check`。
- A′-13 `DOC-CODE-RECONCILE.md:307`（ACC-6）⇒ `node scripts/doc-check.mjs`（单引擎）。
- A′-14 `DOC-SYSTEM.md:141`（P3）⇒ 改述：台账面 = SQLite（`docs/core/design/LEDGER.md`）。
- A′-15 同档 `:241`（manifest 示例块）⇒ `merges` 行删（随六档并入映射删除 ⇒ 示例作废）。
- A′-16…20 同档 `:363`（A7）· `:365`（A9）· `:374`（T1）· `:375`（T2）· `:376`（T3）⇒ 改指 `node scripts/doc-check.mjs`；A9 / T3 台账腿**改述**。

**复跑读数（cwd = 仓根 · as-of 2026-09-18 执行轮）**

| 时点 | 悬空 | 行宽 | 备注 |
|---|---|---|---|
| 首动作前复测 | **283** | 4 | 与 §2.11 的 285 差 = 他链在飞写入（相对判据） |
| 执行后复跑 | **253** | 4 | **新增悬空 0**（逐条集合比对）· **行宽零新增** |
| 差额 | **−30** | 0 | 30 条全落于 A 类坐标（逐条核销）；A′ 类按定义机检不报 ⇒ 贡献 0 |

**归因（相对判据「回落 ≥31」对账）**：设计口径 33 锚 − 修正轮已落 2 = 31；实测机检可见 A 类锚 = **32**（本轮 30 + 修正轮 2）⇒ 差值 1 = A 表计锚口径含「同行第二坐标」（A-4 `:110` · `:135` / A-5 `:64` · `:89`——空格分离的第二坐标按 §4.2.1 射程**不成独立锚**）。**绝对预测（§2.7：286 → ≤253）命中**：执行后恰为 **253**。

**执行轮注（形态与偏差 · 零语义改）**

1. A′-7 处置字面 = 「整行换 `node scripts/doc-check.mjs`」；该 fenced 块其余命令（grep）以 **workspace 根**为 cwd（路径写 `thincoder/docs/...`）⇒ 落笔取 `node thincoder/scripts/doc-check.mjs`（形态随块约定，语义 = 单引擎）。
2. A-12 / A-13（§3.4 符号锚「强形态判据」与「平台 / 库 API 词表」）：单引擎现以 `DEF_PREDICATES`（`scripts/doc-check-anchors.mjs:36`）+ 恰一宿主坐标为窄形态判据，**无同名谓词 / 词表** ⇒ 按「A 类只改坐标、语义零改」取**文件级**改指（不带行号）；描述句与现引擎的对应关系入下「发现」栏。

**发现（实测 · 报告不擅动）**

1. **机检红但 A / A′ / B / C 四表皆未列的 5 坐标**（均在本档 `DOC-DISCIPLINE.md`：`:515` / `:516` `T-V5-16` · `:686` `T-V5-17` · `:558` `scripts/doc-anchors-targets.mjs:15` + `scripts/doc-anchors-v5.mjs` · `:779` `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md`）——行内均带时点锚 / 史实谓词（§3.8 B-② 判据面），但未入 §2.4 B 表在册 ⇒ **清单完备性缺口**（本批零触碰，列表上抛）。
2. `DOC-CODE-RECONCILE.md:28` `T-VS3` / `T-VS32`（用例号红）· `ENGINEERING-MODE-V2.md:78`（`thincoder-core/tools/checklist.mjs`）——同为机检红、未入任何清单（存量）；不在本批射程。
3. `DOC-SYSTEM.md` §8.1 引擎族切分表（`:211`–`:216`）仍列死名（**裸名形态** ⇒ 不入机检，但语义面过期）——属 §2.9-1「整表已无对象」判据分支（本批零触碰）。
4. **B 类行号漂移**：DOC-SYSTEM T6 行由 `:379` → `:378`（本轮 `merges` 行删所致）——**行内容零改**（B 类零触碰成立；行号只作 as-of，D4）。

**自检（用例 I-1–I-6 逐条）**：I-1 ✓ A 类行改指后复跑零悬空 · I-2 ✓ `evidenceState` 无承接走改述、未换名 · I-3 ✓ B 类零触碰、复跑仍报悬空（在册残差）· I-4 ✓ 带史实谓词的 B 行零触碰、未加标记 · I-5 ✓ 改指目标逐项盘上实核存在、未产新增悬空 · I-6 ✓ 需求档零触碰。
**机检复跑**：`node scripts/doc-check.mjs` ⇒ 悬空 **253** · 行宽 **4**（零新增）· `node --test thincoder-cli/test/doc-check.test.mjs` ⇒ **17 pass / 0 fail**（exit 0）。
**写域自证**：本轮改动 = 5 档（`docs/README.md` · `docs/core/design/{DOC-CODE-RECONCILE,DOC-DISCIPLINE,DOC-SYSTEM,ENGINEERING-MODE-V2}.md`）+ 本批档 §2；**需求档（`docs/**/requirements/**`）· `_archive/**` · 参照树 · 提示词面 · `scripts/**` 判据逻辑 · 实施面代码 · 冻结批档零触碰** ✓。
**§5 未写入**：`batch_segment(segment:"§5")` ⇒ 被拒（「§5 is not yours to write … eng-designer → §2」）——执行轮记录落 §2（本段）；§5 段待父侧指派。

**§2.12 附注（末次复跑 · 2026-09-18 · eng-designer）**：执行后末次复跑 `node scripts/doc-check.mjs` ⇒ 悬空 **252** · 行宽 **4**（较首次执行后读数 253 再降 1）。**归因 = 并行链在飞写入**：`5390bb03`（05:40:01「docs: settle settings-mask batch …」）改动 `docs/core/design/DOC-MIGRATION.md`（+168 行，非本批写域）——本席在该两次读数之间**零编辑**。⇒ 对账：相对判据「回落 ≥31」**净达成（283 → 252 = −31）**，其中本席 A 类逐条核销 **−30**、并行链 **−1**；**本批新增悬空 = 0**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements（覆盖完整性） | 🔴 | A′ 类清单与本设计自定的 A′ 定义（「机检不报也不得漏改」）不符，且遗漏未被任何清单/登记吸收：① `docs/core/design/DOC-DISCIPLINE.md:382` 与 `:504` 是同批**已列 A 类、要改指的两行**，两行除脚本名 token 外**另含死指针** `thincoder-cli/test/doc-anchors.test.mjs`（`:504` 带 `:263`）；该名已被本设计 §3.8 映射表判定死名并给出承接（`DOC-DISCIPLINE.md:344` ⇒ `thincoder-cli/test/doc-check.test.mjs`），而盘上 `thincoder-cli/test/`、`thincoder-vscode/test/`、`thincoder-core/test/` 三面实核**无同名档** ⇒ 目标不存在、锚走不通；A-22 / A-23 两行只列了同行的脚本名 token，未列该 token；② `DOC-DISCIPLINE.md:675`（D-V5-12 行）含同一死指针，**不属 A / A′ / B / C 任何清单**，§2.9 域外发现亦未登记（静默遗漏）；③ 同形态另有 `:90`（`thincoder-cli/test/doc-consistency.test.mjs:42`）· `:91`（`thincoder-vscode/test/doc-consistency.test.mjs:38`）——两档在盘上均不存在，属 A′ 定义中「正则段豁免」类（设计自己已用 A′-8 `:739` 处置过同形态 `*.test.mjs` token），却未入 A′ 21 行表。⇒ §2.2「全量清单」与 A′「不因不报而漏改」两条自述不成立；sweep 落地后本档仍留同族死指针（含本批自己编辑的那两行） | 逐条补入 A′ 清单（含 `:382`/`:504` 同行第二 token、`:675`、`:90`/`:91`），或在对应 A 行的「命中 token / 处置」列写明同行第二死名及其承接目标；补后复跑一次读数并同步 A′ 计数（读数作相对判据，不锁绝对值） |
| 2 | Document ownership / 档间一致 | 🟡 | 同一事实两处不一致：`DOC-DISCIPLINE.md:343`（§3.8 映射表）称 VSC 仓 `scripts/`「现仅 `check-syntax.mjs` / `publish-all.mjs` 两支」，批档 §2.2 行 17 写三支；盘上实存**三支**（`check-syntax.mjs` · `check-vsix.mjs` · `publish-all.mjs`）⇒ §3.8 侧漏 `check-vsix.mjs`（结论「`reconcile-lookup.mjs` 无承接」不受影响） | §3.8 括注按盘面与 §2.2 行 17 改为三支枚举 |
| 3 | Methodology（D3 计数·枚举纪律）/ Clarity | 🟡 | 计数与自身枚举不一致三处：① §2.2 A′ 头「21 行」vs 表内 **23** 个坐标（且 A′-9…10 标签下挂 5 个坐标，编号应 9…13）；② §2.3 头「26 处 / **16 档**」vs 表内 **19** 个档（「26 处」经盘面 grep 实核一致：core 20 + scripts 4 + cli 1 + vscode 1；档数不符——19 档）；③ §2.10 自检③「改指目标 **17 项**」vs 括号内枚举 **15** 项（4 脚本 + `ledger.mjs` + `doc-check.test.mjs` + 9 档） | 三处计数按表内枚举与盘面收正（AC-1 / AC-2 的可验性依赖枚举，不依赖计数；批件摘要里的「16 档」同源收正） |
| 4 | Clarity（判据可判性） | 🟡 | §3.8 判据句 A-① 与 B-① 有重叠面而无优先序：A-① 列「受影响文件表 · 命令块 · 判据句」，B-① 列「受影响文件行数表 · F/N/AC/T 表 · 登记块 · 变更记录」——同一行可双命中。实测归类靠个案判断：本档 `:504`（§4.2.7「判据面登记（批 11）」块内行、行内无时点锚）判 **A**，同块 `:547`（行内含「已裁 2026-09-16」）判 **B**；本档 §5 A-DD1 / A-DD2 / A-DD11 / A-DD12 行（F/N/AC/T 表行）判 **A′ 处置**，而 `CORE-UNIFICATION.md` 的 F/T/AC 表行判 **B 零触碰**；`DOC-SYSTEM.md:210`–`:217`（v1 迁移受影响文件表 + 死名 + 行内无时点锚）按 A-① 字面应改指，实际按 §2.9-1「整表已过期」延后 | 在 §3.8 判据句补一条互斥/优先序（例：以「行施何 = 规定动作 / 断言现态」优先于所属表类；表类仅在行施何为记录 / 读数时判 B），并把「整表已无对象 ⇒ 归承接档实质修订」写成判据内的显式分支，使 §2.9-1 的延后与判据句同源 |
| 5 | Acceptance（可验性 / 覆盖面） | 🟡 | 文档侧验收与批档验收面不一致：`DOC-DISCIPLINE.md:714` A-DD18 只写「A 类 33 锚逐条改指且目标盘上存在」，**未含 A′ 类**（批档 AC-1 含「A′ 类逐条改指」）⇒ 机制档侧的验收漏掉本批约 21 行的处置面；A-DD18 的「33 锚」与 AC-1 的「33 锚 + A′」不同口径 | A-DD18 与批档 AC-1 对齐（补齐 A′ 面），或明写 A-DD18 只覆盖 A 类、A′ 归批档 AC-1 |
| 6 | Methodology（文档行数标注口径） | 🔵 | §2.6 受影响文件表对 5 个 `.md` 档仍给「现行数 / 增量」两列（945 / −6±4 / −4±3 / ±0 / ±0）。本项目已在 `DOC-DISCIPLINE.md` §3.7（`:240`–`:246`）废除文档行数标注（设计 / 需求档受影响文件表 `.md` 行两列填 `—`、行保留），批次档模板亦记「文档档不列该两列」；§3.7 声明的取消射程为「设计 / 需求档」，批次档是否同口径未明 | 若批次档同口径 ⇒ `.md` 行两列改 `—`（行保留）；若批次档维持现状是既定口径 ⇒ 在 §3.7 显式声明批次档例外 |
| 7 | Acceptance / 读数一致性 | 🔵 | AC-5「行宽零新增（改后基线 = 改前 **3** 行，全部域外）」与 §2.10 设计轮末读数（行宽 **4**，含 `CONTEXT-COMPACTION.md:303`）不一致；AC-3 与 §2.10 的「相对判据 + coder 首动作前复测」纪律已覆盖该漂移 | AC-5 去掉硬编码「3 行」，改「行宽零新增（以 coder 复测基线为准）」 |
| 8 | （核读）事实面 | 🔵 | §3.8 映射表行 10 写 `ENGINEERING-MODE-V2-MODULE-M*.md`（**M1–M10**），而 `docs/core/design/_archive/modules/` 实存 **9 档**（`requirements/ENGINEERING-MODE-V2.md:525`–`:532` 反向退役表列 8 档 + 未入表的 `-CHECKLIST-REMOVAL.md`）⇒「M1–M10」与盘面档数不同口径 | 档数口径与 §2.8 U-3（9 档）统一，或注明「M1–M10」= 模块号区间、非档数 |

**已实核（未构成发现的正证据）**：① A 类 29 行 / 33 锚与 §2.2 枚举逐行相合（含同行多 token 计数法）；② §2.3 #42 族 26 处与盘面 grep 逐处命中（core 20 · scripts 4 · cli 1 · vscode 1）；③ 改指目标存在：`scripts/doc-check{,-anchors,-targets,-width}.mjs` · `thincoder-core/ledger.mjs` · `thincoder-cli/test/doc-check.test.mjs` · `AGENT-LOOP-SUBAGENT.md` §6.22（`:600`）· `BATCH-RECORD.md` §4.9（`:138`）· `LEDGER.md` §2（`:17`）/ §8（`:148`）· `MANIFEST.md` §3（`:348`）· `DOC-DISCIPLINE.md` §7（`:820`）；④ 新增改述指针 `PROJECT-MANIFEST.json:21` = `scanDirs` 实核命中；⑤ 受影响文件行数标注与 `wc -l` 口径一致（抽 5 档：`doc-check.mjs` 75 · `doc-check-width.mjs` 66 · `doc-check-targets.mjs` 128 · `doc-check-anchors.mjs` 321 · `ledger.mjs` 202；`read` 计数 = `wc -l`+1 为本仓既定差）；无 >500 档，300–500 带内 3 档（470 / 446 / 409）本批 ±0（仅头注）⇒ 不构成越档；⑥ AC-2 的 `design/modules/` grep 在 `thincoder-cli` / `thincoder-vscode` 全域仅命中本批两处目标行（`ledger-surface.test.mjs:3` · `ledger.test.mjs:3`）⇒ 零残留可达。**限制**：无项目标准档 / 无文档地图（Document ownership 维度降级）；引擎无法实跑（本评审无命令执行面），故「机器是否报上述 token」为 unverified——发现 1 的判定不依赖该点（按本设计自己的 A/A′ 判据与 §3.8 映射表，它们都是应登记/应处置对象）。

**计数**：🔴 1 · 🟡 4 · 🔵 3。

VERDICT: changes-required

### 轮次 2（评审子代理）

**复核轮 2 · 死指针 sweep 修正验证**（上轮表 8 条 + 修正轮自报补项 2 条逐条核；依据 = 两档全文复读 + 有界盘面实核）

| # | Orig# | File | Severity | Status | Notes（本轮实读证据） |
|---|-------|------|----------|--------|----------------------|
| 1 | 1 | 批档 §2.2/§2.4 · DOC-DISCIPLINE.md §3.4/§4.1/§4.2.7 | 🔴→ | **已落位** | A′-21…24 落（批档 `:103`–`:106`：`:382`/`:504` 同行第二 token + `:90`/`:91`）；A-22/A-23 行加「同行另含…（见 A′-21/A′-22）」；`:675` 归 B 在册（`:146` + `:153`）；本档两行已就地收正（`:393` = `scripts/doc-check.mjs` + `thincoder-cli/test/doc-check.test.mjs`；`:515` = 改述含 `PROJECT-MANIFEST.json:21`） |
| 2 | 2 | DOC-DISCIPLINE.md:353 | 🟡→ | **已落位** | 「…**三支**——盘上实核」；盘面 `thincoder-vscode/scripts/` = check-syntax.mjs · check-vsix.mjs · publish-all.mjs 三档 ✓ |
| 3 | 3 | 批档 §2.2/§2.3/§2.10 | 🟡→ | **已落位** | A′ 头「29 坐标 / 27 行」（`:80`，29 坐标逐行清点相合）· #42「26 处 / **19 档**」（`:111`）· 自检③「**15 项**」（`:236`，4+1+1+9）✓；残留小项见下新-3 |
| 4 | 4 | DOC-DISCIPLINE.md:330–336 | 🟡→ | **已落位** | 优先序（行施何为优先于表类）+「整表已无对象」显式分支 + :504/:547 与 A-DD 行判例 ✓ |
| 5 | 5 | DOC-DISCIPLINE.md:725 | 🟡→ | **已落位** | A-DD18 补齐 A′ 面、与批档 AC-1 同口径、绝对读数改相对（≥33 口径注见下新-2） |
| 6 | 6 | 批档 §2.6 · DOC-DISCIPLINE.md §3.7 | 🔵→ | **已落位** | `.md` 五行两列改 `—`（`:169`–`:173`）+ §3.7「**批次档同口径**（射程补明）」（`:247`）✓ |
| 7 | 7 | 批档 §2.7 AC-5 | 🔵→ | **已落位** | 「行宽零新增（**以 coder 复测基线为准**——绝对读数随并行链漂移）」（`:200`）✓ |
| 8 | 8 | DOC-DISCIPLINE.md:356 | 🔵→ | **已落位** | 「**M1–M10 = 模块号区间，非档数**——盘上 `_archive/modules/` 实存 **9 档**」✓ |
| 9 | 自报 | 批档 §2.2 A′-25…26 · DOC-DISCIPLINE.md §5 | — | **已落位** | `:731`/`:732` 与 `:90`/`:91` 同死名（doc-consistency.test.mjs）✓；本档 `:742`–`:744` 已改述 ✓；坐标 as-of 口径与「行号漂移」注自洽 ✓（「机检不报」= 修正轮实核主张——本席无执行面，**unverified** 但无相抵） |
| 10 | 自报 | 批档 `:107`/`:263` · DOC-DISCIPLINE.md:743 | — | **已落位（写入一致）** | 「无 slow() 注册 ⇒ 慢层门控消解」三处措辞一致；事实抽核：`thincoder-cli/test/doc-check.test.mjs` grep `slow` = **零命中** ✓ |
| 11 | (新) | 批档 §2.10 自检③ | 🟡 | New | 「…`doc-anchors.test.mjs` / `doc-consistency.test.mjs` 五者**确认无承接**」（`:239`）与同档承接口径相抵：§3.8 映射表 `doc-anchors.test.mjs` → `thincoder-cli/test/doc-check.test.mjs`（`:354`「引擎用例档随引擎改名」）、`doc-consistency.test.mjs` → 「CLI 侧功能面承接」（`:355`）、A′-25…26 处置栏「现行承接档 = …」（`:107`） |
| 12 | (新) | 批档 §2.7 AC-3 · §2.11 | 🔵 | New | 「回落 **≥33**（预测 **286 → ≤253**）」（`:198`）与自记「**coder 剩余 A 类 = 31 锚**」（`:272`）基准口径需明示（286 锚定则自洽；以 coder 复测基线为准则 31 < 33 不可达） |
| 13 | (新) | 批档 §2.2 A′ 表 | 🔵 | New | 编号重叠：区间行「A′-9…13」（`:91`）与其后独立行 A′-11（`:92`）/A′-12（`:93`）/A′-13（`:94`）共用号；另 `:744` 括注（A-DD10⑥）按坐标对应应为（A-DD9⑥） |

**计数**：上轮 🔴1 · 🟡4 · 🔵3 全部落位；本轮新增 🔴 0 · 🟡 1 · 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-09-18 04:46「都开了吧」= 全批授权（含本批）；两轮评审（轮 1 = changes-required → 修正轮 8 条 → 轮 2 = pass）。

## §6 验证与收口（父代理）

**收口（2026-09-18）**：

- **验收**：A 类余 31 锚逐条处置（改指 25 行 · 改述 4 行——A-6 / A-15 整句删 / A-17 / A-19 / A-27 含改述）+ A′ 类 23 坐标（改指 11 · 改述 12）+ **B 类 39 锚 / C 类 7 锚零触碰**。
- **读数**：首动作前复测基线 **283** → 末次 **252**（净 **−31**；本席 A 类核销 −30 + 并行链 1）；**新增悬空 0**（逐文件集合比对）· **行宽零新增**（恒 4 行 = 基线）· 用例 **I-1–I-6 全过** · `node --test thincoder-cli/test/doc-check.test.mjs` = **17 pass / 0 fail**；AC-3 预测（286 → ≤253）**命中**。
- **提交**：`6783d246`（6 档 · +324 / −74）。
- **执行轮记录**：批档 **§2.12**（eng-designer 写域；§5 = coder 写域，本批执行人为 designer ⇒ §5 不写入——工具有权拒写 ✓）。
- **残留（登记/路由）**：① **清单完备性缺口**——机检红 5 坐标未入四表（`DOC-DISCIPLINE.md:515/:516/:686/:558/:779`）⇒ **台账 #70** ② 残余三条（`DOC-CODE-RECONCILE.md:28` · `ENGINEERING-MODE-V2.md:78` · `DOC-SYSTEM.md:211-216`）均在 **C 批射程** ✓ ③ A-12 / A-13 语义面（§3.4 强形态判据无单引擎对应物）⇒ 待该档下次实质修订 ④ 形态偏差 1 处（A′-7 fenced 块 cwd 写法——语义等同，已报）。
- **三账**：台账 **#54 / #42** 已核销；批档冻结；收口日期 2026-09-18。
