# 批次档 · 文档面迁移（DOC-MIGRATION）· 2026-09-14 起

> **建档 ✓：2026-09-15 00:33**（**用户诊断** ✗：「**你把一个批次档用得太狠了，导致批次档过长，你的注意力不行了**」✓）
> **本档 = 文档面迁移批次** ✗ —— 与代码面迁移批次 `docs/batches/2026-09-13-CORE-UNIFICATION.md`（**≈6900 行 · 已闭码面** ✓）**分离** ✓。
> **分离理由** ✗：① 一个档承载全部轮次 ⇒ **所有子代理在它上面串行排队** ✓（队列实测被它反复阻塞 ✓）② 档过长 ⇒ **父侧注意力下降**（漏项/误报的机制性根因 ✓）。
> **前情** ✗：迁移批 1–4（正本位移 · B 轮试点 · 第 2/3 批 · 板块档归位 ✓）的 §2/§5 记录**留在旧档** ✓（append-only ✓ 不回改 ✓）；**本档自下一批起承接** ✗。

## §1 批次任务（主 agent · 本段作者 = 父代理）

**目标** ✗：把产品树里的**活档**内容迁进基准层 `docs/core/` ∥ `docs/cli/` ✓（**历史档就地留参照** ✗ —— 用户 2026-09-14 21:37 裁定 ✓）。

**执行的裁定** ✗（逐条引出处 ✓）：
1. **21:38**「需求和设计文档，cli 修改完成以后要尽快迁移进根仓」✓ ⇒ 触发条件（CLI 代码面完工 ✓）已满足 ✓；
2. **21:37**「已被取代的旧档 ⇒ 就地留参照历史、不上迁」✓（**批次档不迁** ✓ 原话「批次档你迁移个鸡毛」✓）；
3. **23:02**「**明显应该是 B**」✓ ⇒ B = 旧档留原地 ✓ **+ 根层所缺内容补写进根层** ✓（**不许只留原地就算完** ✗）；
4. **21:47** 三部分规划（`DOC-SYSTEM` ✓）已在案 ✓ ⇒ 落点按 **P1–P5** ✓；
5. **21:41**「VSC 必须文档先行」✓ ⇒ **VSC 树不在本批** ✗（VSC 轮才做 ✓）。

**已完成（记录在旧档 ✓）** ✗：批 1（正本 15 档 ⇒ `docs/core/design/prompts/` ✓）· 批 2（B 轮试点：AGENT-LOOP/MEMORY ✓）· 批 3（6 板块 ✓）· 批 4（**34 板块档 ⇒ `docs/core/{design,requirements}/`** ✓）· 补洞（**`docs/core` 进两扫描器射程** ✓）。

**本档承接** ✗：
- CLI 树 84 档**二分（活/历史）+ 当场迁第一批活档** ✓；
- 后续批次（每批 ≤6 档 ✓）⇒ 逐批报用户 ✓；
- 收尾：设计面欠账收正轮 ✓。

**纪律** ✗：每批 = 三机检绿（锚域一悬空 **0** ✓ · 宽度 **0 新增** ✓ · 台账 **0** ✓）+ 单笔可 revert ✓ + 逐批报 ✓；**`files` 只列写域** ✗；**台账 `docs/TODO.md` = 父侧维护面** ✗（子代理不列 ✓）。

## §2 批次任务（eng-designer）

（待本轮起逐批写入 ✓）

### 第 1 批 · 二分表 + 编辑工具族当场迁（2026-09-15 · eng-designer · 段作者 = 本角色）

**目标**：把 CLI 树 84 档**逐档二分（活 / 历史）**并**当场迁第一批活档**（用户裁定「不许纯统计空转——判 + 迁同轮」）。
**判据依据**：`docs/core/design/DOC-SYSTEM.md` §5.1（P1–P5）· §4（去向表）· §6（命名规则）——判据句住该档，本批不重述（D2）。
**迁法**（用户 2026-09-14 裁定「明显应该是 B」）：**旧档留原地一字不改** + **内容重建进根层**。

#### 一、第一件：84 档二分表（落点 = 迁移台账）

| 面 | 落点 | 说明 |
|---|---|---|
| 二分表本体 | `docs/core/design/DOC-MIGRATION.md`（**新建** · 203 行） | 84 行逐档表（判 · 依据 `file:line` · 动作 / 落点）+ 对账 + 待核 + 小计闭合 + 后续批分组 |
| 判据与指针 | `docs/core/design/DOC-SYSTEM.md` §5.2 | 原初分类表**搬出**至台账（该档只留判据句与指针——承其 §11 拆分规划 · D2） |

**小计闭合（= 底本 84 档）**：本批迁 **6** · 已清 **16** · 尚有未并 **4** · 历史（不迁）**4** · 待核 **9** · 后续批 **45** —— 6+16+4+4+9+45 = **84**（设计 47 = 6+9+1+4+5+22 · 需求 37 = 7+3+4+23）。
**待核 9 档**（两种读法 + 依据，不静默归类）：design/ARCHITECTURE · design/PORTABILITY · design/RELEASE · design/STRUCTURE-DEBT · design/TWO-REPO-MERGE · req/FEATURES · req/PHILOSOPHY · req/RELEASE · req/TWO-REPO-MERGE（逐档两读见台账 §3）。
**对账（已并入的 11 板块）**：已清 **16** 侧（设计 9 / 需求 7）；**尚有未并** = design/AGENT-LOOP · req/AGENT-LOOP · req/MEMORY · design/PROMPT-SYSTEM · req/PROMPT-SYSTEM（逐条见台账 §4）。

#### 二、第二件：本批实迁 6 档（编辑工具族 · 全 P1 统一面 ⇒ `docs/core/design/`）

| # | 旧档（CLI 树 · **一字未改**） | 新档（根层） | 行数 改前→改后 | 拆分规划 |
|---|---|---|---|---|
| 1 | `thincoder-cli/docs/design/WRITE.md` | `docs/core/design/WRITE.md` | 0 → 88 | 低于 300 软线 ⇒ 无需 |
| 2 | `thincoder-cli/docs/design/HASHLINE-EDIT.md` | `docs/core/design/HASHLINE-EDIT.md` | 0 → 96 | 无需 |
| 3 | `thincoder-cli/docs/design/INSERT-AFTER.md` | `docs/core/design/INSERT-AFTER.md` | 0 → 97 | 无需 |
| 4 | `thincoder-cli/docs/design/APPLY-PATCH.md` | `docs/core/design/APPLY-PATCH.md` | 0 → 93 | 无需 |
| 5 | `thincoder-cli/docs/design/EDIT.md` | `docs/core/design/EDIT.md` | 0 → 116 | 无需 |
| 6 | `thincoder-cli/docs/design/EDIT-HELPERS.md` | `docs/core/design/EDIT-HELPERS.md` | 0 → 105 | 无需 |

**入选理由（选型对比见 §四）**：① 根层**无对应话题**且已有**悬空指针**——`docs/core/design/TOOLS.md` §6.6 末「共享 helper 权威 = 编辑辅助面」无档名、§8.2 登记「逐工具正文已拆到各工具权威档」⇒ 本批迁入即**解悬**；② **双端同名对位**（VSC 树同名设计档在位）⇒ P1 判据硬命中；③ 皆为现行机制（实装坐标本批逐条实核）。
**形态**：根层活档（首部指针块 + 定位 / 参数 / 语义 / 路由 + **§6 机制面**（现状路径坐标表）+ **§7 关键决策（含否决备选）** + **§8 不并项与历史沿革**（(d) 类逐项：旧档位置 + 何故）+ **§9 体量与拆分规划** + 变更记录）。
**不并**：批次材料 / 状态行 / 变更流水（逐档在 §8 登记）；产品树 AC 与 VSC 面节（按 P2 ⇒ VSC 轮）。
**坐标**：一律改写为**现状路径**并经 `file:line` 实核（`thincoder-core/tools/**` · `thincoder-vscode/src/tools/**`）；旧档 `src/**` 形坐标（迁移前）不照搬。
**需求侧**：CLI 树**无**逐工具需求档（实核）⇒ 本板块需求面由既有 `docs/core/requirements/TOOLS.md` 承载，不新起需求档。

#### 三、受影响文件（R24a）

| # | 档 | 当前行数 | 预计增量 | 动作 |
|---|---|---|---|---|
| 1–6 | `docs/core/design/{WRITE,HASHLINE-EDIT,INSERT-AFTER,APPLY-PATCH,EDIT,EDIT-HELPERS}.md` | 0（新建） | +595（合计） | **新建**（B 式迁移 · 逐档行数见 §二表） |
| 7 | `docs/core/design/DOC-MIGRATION.md` | 0（新建） | +203 | **新建**（迁移台账 · 第一件产物） |
| 8 | `docs/core/design/DOC-SYSTEM.md` | 425 | **−1**（表搬出 · 换指针 + 变更记录续行） | **实修**（§5.2 表 → 指针 · §13 A3 收正 · §11 拆分面标已落地） |
| 9 | `docs/batches/2026-09-14-doc-migration.md` | 47 | +本段 | **append §2**（不改 §1） |
| — | `thincoder-cli/docs/**`（84 档） | —— | **0** | **一字不改**（只读参照——B 式） |
| — | `scripts/**` | —— | **0** | **零改动**（本批未新建 `docs/cli/` ⇒ 射程无需扩） |
| — | `docs/TODO.md` · `docs/core/design/prompts/**` · `thincoder-core/**` · `thincoder-vscode/**` | —— | **0** | 零写入（写域外） |

**档位判据**（>300 给拆分规划 / >500 硬门必拆）：本批 7 个新档实测 **88 / 96 / 97 / 93 / 116 / 105 / 203 行**——**全部低于 300 行软线**，无拆分规划义务。

#### 四、方案选型对比（第一批取哪 6 档）

| # | 候选集 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **编辑工具族**（本批所选 · 6 档） | ① 根层无对应话题 ✓ ② 根层已有**悬空指针**指向它们（`TOOLS.md` §6.6 / §8.2）⇒ 迁入即解悬 ✓ ③ 双端同名对位（P1 硬判据）✓ ④ 各 35~83 行 ⇒ 可**逐档完整重建**（不缩水）✓ ⑤ 六档互为引用（helper 单源）⇒ 同批迁才自洽 ✓ | 代价 = 体量小（非最大价值档）⇒ 但「完成度 100% 优于覆盖度」 | **选定** |
| 2 | `ARCHITECTURE` / `TESTING` / `ENGINEERING-MODE`（父侧举例） | ① 皆为「根层完全无对应话题」✓ ② **体量**：86 / 995 / 3030 行 ⇒ 重建面巨大（TESTING 批材料 ≈590 行、ENGINEERING-MODE 变更流水 ≈305 行）✗ ③ `ARCHITECTURE` §3 模块地图为**迁移前**路径（`src/**` 已入核）⇒ 须照现状**重写**（非搬运）且其活 / 历史两读未决 ✗ ④ TESTING / ENGINEERING-MODE 超 500 硬门 ⇒ 须**先出拆分方案**（拆分动作独立于搬迁）✗ | 代价 = 缩水风险（3030 行无法在单批内忠实重建） | **否决**（③④ —— 改列后续批 3：一档一批、先出拆分方案） |
| 3 | CLI 专有面（`TUI` / `ACP-CLIENT` / `CRASH-REPORTS` …） | ① 落点 P2 ⇒ **须先新建 `docs/cli/` 并同时扩两扫描器射程**（硬要求）✗ ② TUI 1529 行超硬门 ✗ | —— | **否决**（本批不引入射程改动——改列后续批 5） |

#### 五、关键决策记录

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| M1 | 二分表落**迁移台账**（新档）而非本节 / 原判据档 | 84 行逐档表 = 跨批复用的工作台账（活档）；批次档过长已被用户点名 ⇒ 不塞 §2；`DOC-SYSTEM.md` §11 早已规划「表搬出」（D2 单一权威源） |
| M2 | 第一批取**编辑工具族**（6 档 · 全 P1） | §四 候选 1；否决父侧举例的二候选（缩水风险 / 拆分需求）与 P2 候选（射程改动） |
| M3 | **不新建 `docs/cli/`** | 本批 6 档皆 P1 ⇒ 无需 CLI 专有面目录；避免引入射程改动（搬档不改射程 = 无守卫窗口） |
| M4 | 根层档 §8 逐项登记「不并」 | (d) 类（状态行 / 变更流水 / 旧节号 / 已废对照矩阵）逐项登记 + 何故——防静默丢弃 |
| M5 | `EDIT-HELPERS` 「现行为 → 改后」对照矩阵**移入 §8.1 历史沿革** | 左列 = 已废现状（旧结构）；现行行为只留一版入 §4（防两版行为并存） |

#### 六、验收标准（逐条回指 · 机器可验）

| # | 验收标准 | 回指 |
|---|---|---|
| B1 | `node scripts/doc-anchors.mjs` 域一**悬空 0** · exit 0（读数 **49 → 56 档**——新增 7 档全在既有射程内） | FR7 · N3 |
| B2 | `node scripts/check-doc-width.mjs` **宽度读数 0 行 >300 字符**（332 文件） | N3 |
| B3 | `node scripts/check-ledger.mjs` exit 0 · **0 处违规** | N3 |
| B4 | 二分表 **84 行** + 小计六栏闭合（6+16+4+4+9+45 = 84；设计 47 / 需求 37） | FR3 · A3 |
| B5 | 本批 6 档落 `docs/core/design/`，逐档含 §6 机制面 + §8 不并项与历史沿革 + §9 体量 | FR1 · FR2 |
| B6 | 新档内坐标全为**现状路径**且经实核（0 处 `thincoder-cli/src/**` 迁移前形） | FR4 · FR5 |
| B7 | `git status` 改动集 ⊆ `docs/core/**` + 本档 §2——`thincoder-cli/docs/**` · `scripts/**` · `thincoder-core/**` · `thincoder-vscode/**` **零写入** | N4 |

**读数（as-of 2026-09-15 本批实测）**：B1 ✓（56 档 · 悬空 0）· B2 ✓（宽度 0 行超限）· B3 ✓（0 违规）· B4 ✓（84 闭合）· B5 ✓ · B6 ✓ · B7 ✓（改动集 = `docs/core/design/**` 7 新 + 1 改）。
**未过项**：**一致性面 V3 两条**（均系批次档 §3 缺工具写入轮次行——**非本批写作面**：一条为父侧本档占位形态、一条为他实例新建档）⇒ 见 §八。

#### 七、用例表（正常 / 边界 / 错误）

| # | 类 | 输入 | 期望输出 |
|---|---|---|---|
| T1 | 正常 | `node scripts/doc-anchors.mjs` | 域一 56 档 · 悬空 0 · `OK(V5)` · exit 0 |
| T2 | 正常 | `node scripts/check-doc-width.mjs` | 宽度面「无 >300 字符单行」· exit 0 判定面见 §八（一致性另计） |
| T3 | 正常 | `node scripts/check-ledger.mjs` | 台账两档 `OK` · 0 处违规 · exit 0 |
| T4 | 边界 | 二分表小计复核（六栏加总 = 84 = 47 + 37） | 闭合（D3——计数与列表同改） |
| T5 | 边界 | 新档内 `docs/core/design/*.md` 路径 token | 直命中（不依赖 V5-A 的 fail-open 分支） |
| T6 | 错误 | 本批未新建 `docs/cli/` ⇒ 射程未改 | 无「无守卫窗口」（后续批若新建 ⇒ **必须先扩射程**再落档） |
| T7 | 错误 | B 式越界（改旧档） | `git status` 出现 `thincoder-cli/docs/**` 改动 ⇒ 判违规（本批实测 **0** 改动） |

#### 八、未决与打回（不静默处置）

| # | 项 | 归属 / 处置 |
|---|---|---|
| 1 | **V3 一致性 2 条**：`docs/batches/2026-09-14-doc-migration.md` §3 缺工具轮次行 | 父侧：该档 §4 / §6 占位行（「_（待写）_」）**非斜体形态** ⇒ 被判为实质内容；修法 = 占位改斜体（豁免谓词见 `scripts/check-doc-width-core.mjs`）或待评审落地 §3 轮次行——**不在本角色写域** |
| 2 | 同上：`docs/batches/2026-09-15-vsc-doc-migration.md` §3 | **他实例**（peer pid 9204——并行 VSC 轮）新建档；本批零触碰 |
| 3 | 新档 `docs/core/design/DOC-MIGRATION.md` 未登记进地图 `docs/README.md` §4 | 写域外（父侧落一行——本角色不写地图） |
| 4 | 待核 **9 档**（活 / 历史或 P 号两读） | 待父侧 / 用户裁定（台账 §3 已给两读 + 依据） |
| 5 | `thincoder-cli/docs/design/PROXY.md` §TLS 段与现行实现**相反**（现行默认校验证书 + `insecureTls` 显式放行） | **安全语义错误**：后续批迁前须先更正（照搬 = 把错误安全承诺写进权威层） |
| 6 | `QUICKFIX-BATCH-3` 的 F-3 / F-4 未落且**无任何台账承载** | 若按「历史档」归档会**丢需求** ⇒ 父侧回写 `docs/TODO.md` 后再归档 |
| 7 | 需求侧未并面（req/MEMORY 整档条目面 · req/PROMPT-SYSTEM · req/AGENT-LOOP 的 VSC 面节等） | 后续批 4（并入既有档）——本批只登记不动手 |

#### 九、边界（本批不做）

1. **不创建 `docs/cli/`**（本批无 P2 档）⇒ `scripts/**` 零改动、射程零改动。
2. **不动历史档**（4 档）· **不动待核 9 档**（待裁定）。
3. **`thincoder-cli/docs/**` 一字不改**（B 式 · 只读参照）；`thincoder-vscode/**` · `thincoder-core/**`（实现）· `docs/TODO.md` · `docs/core/design/prompts/**` 零写入。
4. **不 commit · 不发起评审**（发起权 = 用户）。
5. **不代写地图 / 台账**（`docs/README.md` · `docs/TODO.md` = 父侧面）。

#### 十、三方条目一致

**本段条目（6 档 + 台账 + 判据档实修）= 迁移台账 §2.1 第 5 / 13 / 14 / 18 / 19 / 47 行（本批迁栏）= 需求档既有条目回指**（FR1 · FR2 · FR3 · FR4 · FR5 · FR7 · N3 · N4——`docs/core/requirements/DOC-SYSTEM.md`）；本批**不新增需求条目**（执行既有 FR，无范围增减）。

### 第 2 批 · 9 档「待核」收口 + 实迁（2026-09-15 · eng-designer · 段作者 = 本角色）

**目标**：把迁移台账 §3 的**待核 9 档**逐档实核后定判并**同批实迁**（用户 2026-09-15 00:56 批准父侧裁定表）；同批新建 `docs/cli/` 并把新目录加进两扫描器射程。
**判据依据**：`docs/core/design/DOC-SYSTEM.md` §5.1（P1–P5）· §4（目标目录结构）· §6（命名规则）——判据句住该档，本段不重述（D2）。
**迁法**：**B 式**——旧档留原地一字不改 + 内容重建入落点（旧档 = 参照历史，保留 ≠ 维护）。
**逐档实核结论**：裁定表 9 条的依据（行数 / 档首自述）**逐条与档内原句一致**——无冲突 ⇒ 未触发「停下上报」。

#### 一、本批实迁（B 式 · 9 档）

| # | 旧档（CLI 树 · 一字未改） | 落点（基准层活档） | 层归属 | 行数 改前→改后 | 拆分规划 |
|---|---|---|---|---|---|
| 1 | `thincoder-cli/docs/design/ARCHITECTURE.md` | `docs/core/design/ARCHITECTURE.md` | 统一面（P1） | 86 → 151 | ≤300 ⇒ 无需 |
| 2 | `thincoder-cli/docs/design/PORTABILITY.md` | `docs/core/design/PORTABILITY.md` | 统一面（P1） | 499 → 161 | ≤300 ⇒ 无需 |
| 3 | `thincoder-cli/docs/design/RELEASE.md` | `docs/cli/design/RELEASE.md` | **CLI 面（P2）** | 131 → 138 | ≤300 ⇒ 无需 |
| 4 | `thincoder-cli/docs/design/STRUCTURE-DEBT.md` | `docs/core/design/STRUCTURE-DEBT.md` | 统一面 | 186 → 78 | ≤300 ⇒ 无需 |
| 5 | `thincoder-cli/docs/design/TWO-REPO-MERGE.md` | `docs/core/design/TWO-REPO-MERGE.md` | 统一面 | 444 → 206 | ≤300 ⇒ 无需（含越线风险登记——见该档 §11） |
| 6 | `thincoder-cli/docs/requirements/FEATURES.md` | `docs/cli/requirements/FEATURES.md` | **CLI 面（P2）** | 142 → 193 | ≤300 ⇒ 无需 |
| 7 | `thincoder-cli/docs/requirements/PHILOSOPHY.md` | `docs/core/requirements/PHILOSOPHY.md` | 统一面 | 176 → 212 | ≤300 ⇒ 无需 |
| 8 | `thincoder-cli/docs/requirements/RELEASE.md` | `docs/core/requirements/RELEASE.md` | 统一面（P5：P2 > P1） | 34 → 68 | ≤300 ⇒ 无需 |
| 9 | `thincoder-cli/docs/requirements/TWO-REPO-MERGE.md` | `docs/core/requirements/TWO-REPO-MERGE.md` | 统一面 | 70 → 86 | ≤300 ⇒ 无需 |

**行数口径** = `readFileSync(...).split("\n").length`（含末行空元素）· as-of 2026-09-15 实核。
**落点分布**：`docs/core/design/` 4 档 · `docs/core/requirements/` 3 档 · `docs/cli/design/` 1 档 · `docs/cli/requirements/` 1 档。
**九档全部 ≤300 行** ⇒ 无 >300 拆分规划义务；**无 >500 行档**。

#### 二、台账收口（`docs/core/design/DOC-MIGRATION.md`）

| 项 | 改前 | 改后 |
|---|---|---|
| §2.1 设计档「待核」行 | 5（ARCHITECTURE · PORTABILITY · RELEASE · STRUCTURE-DEBT · TWO-REPO-MERGE） | 0（逐行改写为「**本批迁**」+ 现状依据 + 落点） |
| §2.2 需求档「待核」行 | 4（FEATURES · PHILOSOPHY · RELEASE · TWO-REPO-MERGE） | 0（同上） |
| §3 待核节 | 9 行两读法表 | **已清空**——保留节头 + 去向说明（去 §2；裁定前两读法入本档 §2） |
| §5 小计「本批迁」 | 设计 6 / 需求 0 = **6** | 设计 11 / 需求 4 = **15**（第 1 批 6 + 第 2 批 9） |
| §5 小计「待核」 | 设计 5 / 需求 4 = **9** | **0 / 0 = 0** |
| §5 闭合校验 | 6+16+4+4+9+45 = 84 | 15+16+4+4+0+45 = 84 ✓（设计 11+9+1+4+0+22=47 ✓ · 需求 4+7+3+0+0+23=37 ✓） |
| §6 批 5 备注 | 「须先新建 `docs/cli/` + 扩射程」 | 「**前置已满足**」 |
| §8 体量 | 203 行 | 199 行（收正） |

#### 三、射程扩展（新建 `docs/cli/` 的连带）

| 档 | 常量（**实核真名**） | 改前 | 改后 |
|---|---|---|---|
| `scripts/check-doc-width-core.mjs` | `SCAN_DIRS`（`:15`） | 7 项（无 `docs/cli/*`） | 9 项（插 `docs/cli/design` · `docs/cli/requirements`） |
| `scripts/doc-anchors-v5.mjs` | `V5_SCAN_DIRS`（`:20`） | 6 项（无 `docs/cli/*`） | 8 项（同上） |

**读数（改前 → 改后）**：根域扫描档数 **61 → 73**（净 +12 = 射程扩展 **+2**（`docs/cli/` 两档）· 本批实迁 **+7**（落 `docs/core/` 者）· **+3** = 并轮 VSC 实例新增档（`docs/vsc/design/WEBVIEW*.md`，他实例在写））。
**射程扩展自身的净增 = +2 档**（两扫描器同口径）。

#### 四、方案选型对比（落点：`docs/cli/` 建不建）

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **同批新建 `docs/cli/` 并把两目录入射程**（本批所选） | ① #3 / #6 判 CLI 面（P2）⇒ 必须有 CLI 专有目录 ✓ ② 新建目录**同批**入射程 ⇒ 无「无守卫窗口」（搬档不改射程 = 假绿）✓ ③ 与并轮 VSC 轮已落形态一致（`docs/vsc/` 先例）✓ | 代价 = 两扫描器各改一行常量（行内改、行数不变） | **选定** |
| 2 | 落 `docs/core/` 暂代（等批 5 再建 `docs/cli/`） | ① 免除射程改动 ✓ ② **与 P2 判据相抵**（CLI 专有面住统一面 ⇒ 部分轴失效）✗ ③ 后续还得搬一次（双倍成本 + 二次漂移）✗ | 代价 = 判据面失真 | **否决**（②③） |
| 3 | 只迁 `docs/core/` 面板，`docs/cli/` 两档延后 | ① 本批无射程改动 ✓ ② 待核 9 档**只收口一半**（§5 小计无法闭合到 0）✗ ③ 台账仍留「待核」栏 ⇒ 判定未完成 ✗ | —— | **否决**（②③） |

#### 五、关键决策记录

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| M1 | 九档**全部实迁**（无延后） | 用户裁定的落点 + 台账收口要求（待核 9 → 0）；§四 候选 3 已否决 |
| M2 | `docs/cli/` **同批新建 + 同批扩射程** | 与并轮 VSC 轮同型（D-VM6）；防「搬档不改射程 = 无守卫窗口」 |
| M3 | `RELEASE` **两档跨部分成对**（设计 = CLI 面 / 需求 = 统一面） | P5 冲突序（P2 压 P1）用于设计档；需求档判统一面（跨产品板块主题）——**两侧档头互注配对档位置** |
| M4 | 各档**（d）类内容入「不并项与历史沿革」节** | 批次材料 / 状态行 / 变更流水 / 一次性选型 / 受影响文件清单 / 用例表与 AC ——逐项登记 + 何故（防静默丢弃） |
| M5 | 落点档**择机制面重建**（不搬批次面） | 活档形态要求；来源档留原地作参照历史（B 式） |
| M6 | 实核发现的**陈旧断言按现状收正**并**逐条登记** | 见 §八 未决 1——三条收正处于「一致性面 ⇄ 语义面」边界，**已如实上报待裁定** |

#### 六、受影响文件（R24a）

| # | 档 | 当前行数 | 增量 | 动作 |
|---|---|---|---|---|
| 1–9 | 九档落点（见 §一表） | 0（新建） | **+1293**（合计） | **新建**（B 式重建） |
| 10 | `docs/core/design/DOC-MIGRATION.md` | 203 | **−4**（净；含 §3 清空 + 小计重算 + 变更记录） | **实修** |
| 11 | `scripts/check-doc-width-core.mjs` | 287 | **0**（常量行内改） | **实修** |
| 12 | `scripts/doc-anchors-v5.mjs` | 256 | **0**（常量行内改） | **实修** |
| 13 | `docs/batches/2026-09-14-doc-migration.md` | — | +本段 | **append §2**（不改 §1） |
| — | `thincoder-cli/docs/**`（84 档） | —— | **0** | **一字不改**（只读参照——B 式） |
| — | `thincoder-core/**` · `thincoder-vscode/**` · `docs/TODO.md` · `docs/core/design/prompts/**` | —— | **0** | 零写入（写域外） |

#### 七、验收标准（逐条回指 · 机器可验）

| # | 验收标准 | 回指 |
|---|---|---|
| C1 | `node scripts/doc-anchors.mjs` **根域悬空 0**（射程扩后档数 61 → 73） | FR7 · N3 |
| C2 | `node scripts/check-doc-width.mjs` **本批新增宽度违规 0**（本批 12 档零超宽行） | N3 |
| C3 | `node scripts/check-ledger.mjs` exit 0 · **0 处违规** | N3 |
| C4 | 二分表**待核 9 → 0** 且小计六栏闭合（15+16+4+4+0+45 = 84；设计 47 / 需求 37） | FR3 · A3 |
| C5 | 九档全部落位且含「不并项与历史沿革」节 + 体量节；无状态行 / 无逐批变更流水 | FR1 · FR2 |
| C6 | 新档内坐标全为**现状路径**（0 处迁移前 `src/**` 形坐标入正文叙述面） | FR4 · FR5 |
| C7 | `SCAN_DIRS` / `V5_SCAN_DIRS` 含 `docs/cli/design` + `docs/cli/requirements`，改后档数 > 改前 | FR6 · N2 |
| C8 | `git status` 本角色写域 ⊆ §六 表 1–13 行 | N4 |

**读数（as-of 2026-09-15 本批实测）**：
- **C1 ✓**：根域 `OK(V5): 0 条悬空锚`（闸态）；档数 **61 → 73**。
- **C2 ✓**：本批 12 档**零超宽行**；`check-doc-width` 全局仍红——**红面为他实例在写档**（`docs/batches/2026-09-15-vsc-doc-migration.md` 3 行 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` 3 行）**+ 他实例的 V2 违规**（`docs/vsc/design/WEBVIEW.md:141`），**均不在本角色写域**（见 §八 未决 3）。
- **C3 ✓**：台账两档 `OK` · **0 处违规** · 基线 0 条。
- **C4 ✓**：待核 9 → **0**；小计闭合（六栏 + 设计 / 需求分列双向闭合）。
- **C5 ✓**：九档均含 §「不并项与历史沿革」+ §「体量与拆分规划」。
- **C6 ✓**：坐标逐条实核改写（`thincoder-core/**` · `thincoder-cli/**` · `thincoder-vscode/**` 现状形态）。
- **C7 ✓**：两常量各加 2 项；根域档数 61 → 73（其中射程净增 **+2**）。
- **C8 ⚠**：`git status` 另含**他实例**在写档（`docs/TODO.md` · `scripts/check-doc-width.mjs` · `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md` · `docs/vsc/design/WEBVIEW*.md`）——本角色**零触碰**（见 §八 未决 3）。

#### 八、未决与打回（不静默处置）

| # | 项 | 归属 / 处置 |
|---|---|---|
| 1 | **三条「按现状收正」处于一致性面 ⇄ 语义面边界**：① `FEATURES` 清点面补列现行能力（12 项）并把 `escalate` 并入 `subagent` 动作；② RELEASE 需求档 F1 补入**集成集**环（设计档早已三环）；③ TWO-REPO-MERGE 需求档 N1 旁注路径 `<ws>/thincoder/thincoder` → `<ws>/thincoder/thincoder-cli` | **逐条实核为真**（`thincoder-core/tools/index.mjs` · `thincoder-core/agent-tools.mjs` · `thincoder-cli/scripts/release-check.mjs:68/:78/:82` · 现状仓形态）。**本角色判 = 一致性面（文档 ⇄ 实现对齐）并已逐条登记**（各档 §「不并项与历史沿革」+ 变更记录）；**若父侧判为语义面 ⇒ 请打回**——三条可独立单笔 revert（同批其余内容不受影响） |
| 2 | `docs/cli/` 未登记进地图 `docs/README.md`（§1 内容表 / §5 与产品地图的关系） | **写域外**（地图 = 父侧面）——请父侧补登记行 |
| 3 | **他实例并行在写**：`docs/TODO.md` · `scripts/check-doc-width.mjs` · `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md` · `docs/vsc/design/{WEBVIEW,WEBVIEW-PROTOCOL,WEBVIEW-INPUT}.md` | VSC 轮 / 父侧——本角色零触碰；**其三机检红面**已如实登记（§七 C2 读数） |
| 4 | `docs/vsc/design/VSC-MIGRATION.md` §4 的**同名档落点与本次裁定不一致**：该档给 `docs/core/design/RELEASE.md`（待建）· `docs/core/requirements/FEATURES.md`（待建）；本次裁定 = CLI 面（`docs/cli/`） | **跨部分一致性问题**——VSC 侧台账**非本角色写域**；请父侧裁决后另派收正（本批只登记，不改他档） |
| 5 | `thincoder-cli/docs/design/PROXY.md` §TLS 段与现行实现**相反**（现行默认全量校验证书 + `insecureTls` 显式放行） | 安全语义错误——**本批不迁 PROXY**；**迁前须先更正**（照搬 = 把错误安全承诺写进权威层）；本批**不改旧档** |
| 6 | `design/TUI-INPUT-BOX.md` 二态混装（当前态 + §8 / §9 目标态） | 台账 §3 注意项保留——批 5（P2）迁时按该档 §9.6 收口 |

#### 九、边界（本批不做）

1. **不写他档**：`thincoder-cli/docs/**` 一字不改（B 式只读参照）；`thincoder-core/**` · `thincoder-vscode/**` · `docs/TODO.md` · `docs/core/design/prompts/**` 零写入。
2. **不写地图 / 台账**（`docs/README.md` · `docs/TODO.md` = 父侧面）。
3. **不裁定他侧台账**（VSC 侧落点分歧只登记，见 §八 未决 4）。
4. **不 commit · 不发起评审**（发起权 = 用户）。
5. **不改旧档的已知错误**（PROXY §TLS——登记「迁前须更正」）。

#### 十、三方条目一致

**本段条目（九档实迁 + 台账收口 + 两射程常量）= 迁移台账 §2.1 / §2.2 本批迁栏（第 6 / 14 / 20 / 24 / 26 / 31 / 35 / 36 / 45 行）= 需求档既有条目回指**（`docs/core/requirements/DOC-SYSTEM.md` 的 FR1–FR8 / N1–N4）；本批**不新增需求条目**（执行既有 FR，无范围增减）。
**层归属不对称一处**（`RELEASE` 两档）已在两侧档头与台账 §3 双向登记。

## §3 评审发现（评审子代理）

_（待写）_

## §4 父侧核验与裁决（主 agent）

_（待写）_

## §5 实施记录（eng-coder）

_（待写）_

## §6 收口与核销（父代理）

_（待写）_
