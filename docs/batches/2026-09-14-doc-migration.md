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

### 第 3 批 · 机制小档 6 档实迁（2026-09-15 · eng-designer · 段作者 = 本角色）

**目标**：把迁移台账 §6「机制小档（P1）」组的 6 档实迁入 `docs/core/design/`（用户裁定「明显应该是 B」= 旧档留原地一字不改 + 内容重建入根层）。
**判据依据**：`docs/core/design/DOC-SYSTEM.md` §5.1（P1–P5 归属判据句）· §4（目标目录结构）· §6（命名规则）——判据句住该档，本段不重述（D2）。
**迁法**：**B 式**——逐档先**实核旧档全文**，再按三层结构重建；坐标一律改**现状路径**并经 `file:line` 实核；批次材料 / 状态行 / 变更流水入「不并项与历史沿革」节。

#### 一、本批实迁（B 式 · 6 档 · 全落 `docs/core/design/`）

| # | 旧档（CLI 树 · **一字未改**） | 落点（基准层活档） | 行数 改前→改后 | 并入 K / 不并 J | 拆分规划 |
|---|---|---|---|---|---|
| 1 | `thincoder-cli/docs/design/TOOL-OUTPUT-LIMITS.md` | `docs/core/design/TOOL-OUTPUT-LIMITS.md` | 116 → 143 | K = 阈值 / preview / 切片 / 落盘 / advisor 截断 / read 双端 · J = 状态行 · AC 表 · 受影响文件 · 变更流水 | ≤300 ⇒ 无需 |
| 2 | `thincoder-cli/docs/design/AGENT-PARAMS.md` | `docs/core/design/AGENT-PARAMS.md` | 86 → 123 | K = 评审墙钟 / maxTurns / 子代理轮次三参数 + 新增 §5 参数总表 · J = 旧检查点代码块 · AC 表 · 已删测试档锚 · 变更流水 | ≤300 ⇒ 无需 |
| 3 | `thincoder-cli/docs/design/VERIFY-REDESIGN.md` | `docs/core/design/VERIFY-REDESIGN.md` | 87 → 149 | K = 声明式契约 / 判定门 / guard / goal 门 / 双端一致 · J = 相 1/相 2 流水与 G 编号审计清单 · 已退场用例行 · AC 行 · 前身吸收注 | ≤300 ⇒ 无需 |
| 4 | `thincoder-cli/docs/design/DESIGN-TOKEN-SETTLEMENT.md` | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 79 → 126 | K = D1 落盘 / D2 回读 / D3 镜像退役 / consume 对称 · J = 状态行与 commit 号 · 一次性 explore 行号剖析 · 与 VSC 的镜像清单 · AC 行 · 变更流水 | ≤300 ⇒ 无需 |
| 5 | `thincoder-cli/docs/design/ENG-TOKEN-BINDING.md` | `docs/core/design/ENG-TOKEN-BINDING.md` | 106 → 124 | K = 三铁律 / TTL 格式 / 生命周期 / 结算语义 · J = **§4 结算语义（含已退役单值镜像）** · **§5 实现落点表（迁移前宿主划分）** · 双源排查流水 · AC 行 · 变更流水 | ≤300 ⇒ 无需 |
| 6 | `thincoder-cli/docs/design/PROXY.md` | `docs/core/design/PROXY.md` | 47 → 138 | K = 配置形态 / 传输实现 / **TLS 校验（按实装收正）** / 消费面 / 子菜单 · J = **§TLS 与 §web 两处陈旧句** · 建档语境注 · `selectModel` 剥离括注 | ≤300 ⇒ 无需 |

**行数口径** = `readFileSync(...).split("\n").length`（含末行空元素）· as-of 2026-09-15 实核。
**六档全部 ≤300 行** ⇒ 无 >300 拆分规划义务；**无 >500 行硬门档**。

#### 二、PROXY 安全语义更正（**本批必做**——旧档与实装相反，不许照抄）

| 面 | 内容 |
|---|---|
| **旧档原句**（`thincoder-cli/docs/design/PROXY.md:32`） | 「CONNECT 隧道内的 TLS 握手使用 `rejectUnauthorized: false`——**不校验目标站证书**。」 |
| **实装事实** | `thincoder-core/proxy.mjs:214`：`rejectUnauthorized: opts?.insecureTls !== true` ⇒ **默认 true（全量校验）**；`:174`–`:175` / `:213` 注释：「TLS 默认全量证书校验……确需自签 / 内网代理时 opts.insecureTls=true 显式放行」 |
| **新档写法** | `docs/core/design/PROXY.md` §3：**默认全量校验**；自签 / 企业 MITM 代理须**显式 `insecureTls` opt-in**（三方对照表留在该节） |

**全仓 `.md` 同型「不校验证书」陈述清单（只列不改）**：**1 处**——`thincoder-cli/docs/design/PROXY.md:32`（即上述旧档原句本身；B 式下旧档一字不改）。其余命中均为迁移记录中**正确描述该不一致**的条目（本档 §1 未决 5 / 第 2 批 §八 未决 5），不属同型陈述。

**第二处陈旧（本批实核发现 · 与 §web 同源）**：旧档 §「配置形态」称 `web` 开关门控 fetch / websearch 且 env「只影响 web 工具」——**实装相反**。
web 工具已改**逐次调用** `args.proxy`（`thincoder-core/tools/web.mjs:104`–`:106`，2026-08-31 裁定「config proxy is NOT auto-applied」）。
`web` 字段现行唯一活消费面 = `/config` 的 Test connection 探针（`thincoder-cli/src/tui/cmd-config.mjs:141` · `thincoder-core/proxy.mjs:39`）；新档 §4 按实装落笔，旧句登记该档 §8.1。**请父侧裁定**（见 §八 未决 1）。

**附带实核**：`insecureTls` 目前**无 config / UI 入口**（全仓仅 `thincoder-core/proxy.mjs` 三处出现，无调用方注入）——`opts` 层契约，为测试与将来接入保留；新档 §3 如实登记。

#### 三、台账收口（`docs/core/design/DOC-MIGRATION.md`）

| 项 | 改前 | 改后 |
|---|---|---|
| §2.1 六行判栏 | 后续批（第 4 / 12 / 15 / 29 / 39 / 46 行） | **本批迁**（逐行补现状实核依据 + 落点路径） |
| §5 小计「本批迁」 | 设计 11 / 需求 4 = **15** | 设计 17 / 需求 4 = **21** |
| §5 小计「后续批」 | 设计 22 / 需求 23 = **45** | 设计 16 / 需求 23 = **39** |
| §5 闭合校验 | 15+16+4+4+0+45 = 84 | **21+16+4+4+0+39 = 84** ✓（设计 17+9+1+4+0+16=47 ✓ · 需求 4+7+3+0+0+23=37 ✓） |
| §5 口径行 | 第 1 批 6 + 第 2 批 9 = 15 | 第 1 批 6 + 第 2 批 9 + **第 3 批 6 = 21** |
| §6 批 2 行 | 「PROXY 须先更正 §TLS 安全语义」 | **已落（2026-09-15 第 3 批）**——六档全迁；PROXY §TLS 已按实装收正 |
| §6 标题 | 活档剩余 45 档 | 活档剩余 **39** 档 |
| §8 体量 | 199 行 | **203 行**（本批实核） |

#### 四、方案选型对比（本批批次取哪 6 档——**单方案**）

**单方案——无对比**：本批批次 = 迁移台账 §6 既定「批 2 · 机制小档」组（6 档，P1 各 ≤200 行），非本批新选；候选集比较已在台账建档批完成（`DOC-MIGRATION.md` §6）。档内无 `≥2` 候选的机制决策需新选型。

#### 五、关键决策记录

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| M1 | **两处陈旧按实装收正**（PROXY §TLS / §web；ENG-TOKEN-BINDING §4 §5） | 照抄即把错误安全承诺与已废结构写进权威层；旧档原句逐条登记各档 §8.1（防静默丢弃）。否决「B 式 = 照搬」 |
| M2 | 坐标一律**现状路径 + 实核**（含行号） | 旧档坐标为迁移前仓形态（`src/**`、`advisor/run.mjs` 常量面等）；行号漂移逐条重核（如 guard 三闸 → `completion.mjs:81/:94/:109`） |
| M3 | 结算面 ⇄ 生命周期面**分档归位**（D2） | `DESIGN-TOKEN-SETTLEMENT` 管结算 / 持久化 / 回读；`ENG-TOKEN-BINDING` 管 TTL / 格式 / 存活——两档互挂指针不重述 |
| M4 | 各档 (d) 类内容入「不并项与历史沿革」节 | 批次材料 / 状态行 / 变更流水 / AC 表 / 一次性审计编号——逐项登记 + 何故 |
| M5 | 提示词逐字文案**不并**（只留语义判据） | 提示词 = 产品代码——guard 三句与消息号只留判据，逐字文案归提示词面 |

#### 六、受影响文件（R24a）

| # | 档 | 当前行数 | 增量 | 动作 |
|---|---|---|---|---|
| 1–6 | 六档落点（见 §一表） | 0（新建） | **+803**（合计） | **新建**（B 式重建） |
| 7 | `docs/core/design/DOC-MIGRATION.md` | 199 | **+4**（净；含六行改写 + 小计 + §6 行 + §8 + 变更记录） | **实修** |
| 8 | `docs/batches/2026-09-14-doc-migration.md` | — | +本段 | **append §2**（不改 §1） |
| — | `thincoder-cli/docs/**`（84 档） | —— | **0** | **一字不改**（只读参照——B 式；实核 `git status` 零改动） |
| — | `scripts/**` | —— | **0** | 零改动（射程已含 `docs/core/**`——无需扩） |
| — | `docs/TODO.md` · `docs/README.md` · `docs/core/design/prompts/**` · `thincoder-core/**` · `thincoder-vscode/**` | —— | **0** | 零写入（写域外） |

**档位判据**（>300 给拆分规划 / >500 硬门必拆）：本批 7 档实测 **143 / 123 / 149 / 126 / 124 / 138 / 203 行**——全部低于 300 行软线，无拆分规划义务。

#### 七、验收标准（逐条回指 · 机器可验）

| # | 验收标准 | 回指 |
|---|---|---|
| A1 | `node scripts/doc-anchors.mjs` **域一悬空 0** · exit 0（读数 **73 → 79 档**——本批新增 6 档全在既有射程内） | FR7 · N3 |
| A2 | `node scripts/check-doc-width.mjs` **OK(宽度)**：355 文件 0 行 >300 字符；一致性 V1/V2/V3 **新增违规 0** | N3 |
| A3 | `node scripts/check-ledger.mjs` exit 0 · **0 处违规** · 基线 0 条 | N3 |
| A4 | 迁移台账小计闭合：21+16+4+4+0+39 = 84（设计 47 / 需求 37，双向闭合） | FR3 · A3 |
| A5 | 六档落 `docs/core/design/`，逐档含「机制面（现状坐标表）」+「不并项与历史沿革」+「体量与拆分规划」节 | FR1 · FR2 |
| A6 | 新档内坐标全为**现状路径**（0 处迁移前 `src/**` 形入正文叙述面；行号逐条实核） | FR4 · FR5 |
| A7 | `git status` 本角色写域 = 7 档（1 改 + 6 新）⊆ `docs/core/**` + 本档 §2 | N4 |

**读数（as-of 2026-09-15 本批实测）**：A1 ✓（79 档 · 悬空 0 · exit 0；域二 99 档亦 0）· A2 ✓（`OK(宽度)` 355 文件 · 新增违规 0）· A3 ✓（0 违规）· A4 ✓（84 闭合）· A5 ✓ · A6 ✓ · A7 ✓（改动集 = `docs/core/design/**` 7 档）。
**未过项**：无。

#### 八、未决与打回（不静默处置）

| # | 项 | 归属 / 处置 |
|---|---|---|
| 1 | **PROXY §web 消费面按实装收正**（旧档称 `web` 门控 web 工具 + env 只影响 web 工具；实装 = 逐次调用 `args.proxy`，`web` 只活于 Test connection 探针） | **一致性面（文档 ⇄ 实现对齐）判定**——与用户已授权的 §TLS 收正同类，已逐条登记落点档 §8.1 + 变更记录。**若父侧判为语义面 ⇒ 请打回**：该节可独立单行 revert（同批其余内容不受影响） |
| 2 | 6 新档未登记进地图 `docs/README.md` | **写域外**（地图 = 父侧面）——请父侧补登记 |
| 3 | 他实例并行在写：`docs/TODO.md` · `docs/batches/2026-09-15-vsc-doc-migration.md` · `scripts/check-doc-width.mjs` · `thincoder-cli/test/doc-{anchors,consistency}.test.mjs` · `thincoder-cli/test/ledger.test.mjs` · `thincoder-vscode/test/doc-consistency.test.mjs` · `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md` · `.tmp-vscdom.json` | VSC 轮 / 父侧——本角色**零触碰**（`git status` 如实登记；其宽度红面已由他侧自修，本批读数已转绿） |
| 4 | `insecureTls` 无 config / UI 入口（实核） | 如实登记（落点档 §3）——非缺陷、非本批可决；如需入口 = 新范围（另起批） |
| 5 | 六档的**需求侧**同名档仍在后续批（`DOC-MIGRATION.md` §6 批 6b / §2.2 对应行） | 本批只迁设计侧（台账分组既定）；需求侧按批 6b 另轮 |

#### 九、边界（本批不做）

1. **`thincoder-cli/docs/**` 一字不改**（B 式只读参照——实核 `git status` 零改动）。
2. **不动 `scripts/**`**（射程已含 `docs/core/**`，无需扩）；**不创建 `docs/cli/`**（本批无 P2 档）。
3. **不写他档**：`docs/TODO.md` · `docs/README.md` · `docs/core/design/prompts/**` · `thincoder-core/**` · `thincoder-vscode/**` 零写入。
4. **不 commit · 不发起评审**（发起权 = 用户）。
5. **不改旧档的已知错误**（旧档只读——错误在落点档按现状收正并登记）。

#### 十、三方条目一致

**本段条目（6 档实迁 + 台账收口）= 迁移台账 §2.1 第 4 / 12 / 15 / 29 / 39 / 46 行（本批迁栏）= 需求档既有条目回指**（`docs/core/requirements/DOC-SYSTEM.md` 的 FR1–FR8 / N1–N4）；本批**不新增需求条目**（执行既有 FR，无范围增减）。

### 第 4 批 · 四个大档拆分 + 实迁（2026-09-15 · eng-designer · 段作者 = 本角色）

**目标**：把 CLI 树 **4 个超 500 硬限的设计大档 + 2 个需求大档**逐档**先拆后迁**入基准层 `docs/core/{design,requirements}/`（用户 2026-09-15 01:47「拜托把这两件事推进完好吗」——本批是大头，一次落干净）。
**判据依据**：`docs/core/design/DOC-SYSTEM.md` §5.1（P1–P5 归属判据句）· §4（目标目录结构）· §6（命名规则）——判据句住该档，本段不重述（D2）。
**迁法**：**B 式**——旧档一字不改（只读参照）+ 内容**重建**入落点；**先剔一次性材料**（逐处实核）；**(d) 已作废/旧结构 ⇒ 各档「不并项与历史沿革」节**；同一事实只详述一处、余挂指针（D2）；坐标一律改**现状路径**并经 `file:line` 实核（**迁移前 `src/**` 形坐标全量改写**）；**VSC 专有面实现坐标按 P2 不并**（列报告 §十）。

#### 一、本批实迁（6 档 → 12 档产物）

| # | 旧档（CLI 树 · **一字未改**） | 行数 | 落点（基准层活档） | 产物行数 | 并入 K / 不并 J |
|---|---|---|---|---|---|
| 1 | `design/ENGINEERING-MODE.md` | 3030 | `docs/core/design/ENGINEERING-MODE.md` | 254 | K = 角色模型 / 主流程 10 步 / 机械闸表 / 评审范围与时机 / 凭证生命周期 / 错误恢复 / 逐字锚清单 / 会话恢复 / 取舍 · J = 逐批设计记录 · 受影响文件 as-of 快照 · 逐批用例与 AC 编号集 · 状态行 · 已退役载体 |
| 1a | 同上（拆分面 2） | — | `docs/core/design/BATCH-RECORD.md` | 224 | K = 批次档三点 / batchDoc 门禁 / 交界面锚 / `batch_segment` 工具契约 / 行为纪律 / VSC 镜像机制原则 · J = 逐批表 · VSC 实现坐标（P2） |
| 1b | 同上（拆分面 3） | — | `docs/core/design/DOC-DISCIPLINE.md` | 279 | K = D1–D7 / V1–V5 判据族 / V5 全规格 / 表格行豁免 / 拆分债 / 对账三层 / 语义巡检 / 跨仓批派单与写域 · J = 逐批表 · 行号修正流水 · 文案卫生批逐条 · 一次性裁定材料 |
| 1c | 同上（拆分面 4） | — | `docs/core/design/LEDGER.md` | 279 | K = 条目契约 / 六态 / 两池分组计数 / 归档触发老化 / 机检 L1–L3 / 可见面四行逐字契约 / 单源导出面 · J = 逐批表 · 两仓收拢执行清单 · 已废口径 · 对端实现坐标（P2） |
| 2 | `design/ADVISOR-CONVERGENCE.md` | 1570 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 266 | K = 目标 / 轮次表与映射 / 工具轮预算 / 通过判定 / cap 与豁免 / 会话隔离与证据纪律 / prior 注入 / citations / 触发与失效 / 响应表四值 + 修正轮时序 / 需求契合 / 行数核查 / 工程模式集成 / 配置 / 验证 · J = 逐批表 · 用例与 AC 编号集 · 变更记录流水 · 演进沿革 · 受影响文件快照 |
| 2a | 同上（拆分面 2） | — | `docs/core/design/ADVISOR-GUARDS.md` | 341 | K = 六 kind 判定族 / 凭证链守卫 / 引文候选链 / 预算硬墙+提示+结构化尾 / 冻结窗口边界与拦截 / 同步面记账 / 连续未完成护栏 / 预算跟随模型窗口 / 估算加权 · J = 逐批表 · 编号集 · 拆分实施流水 · 对端差异登记 |
| 3 | `design/LEDGER-SELF-CONTAINED.md` | 1033 | `docs/core/design/LEDGER-SELF-CONTAINED.md` | 321 | K = 两轴 / 射程判据 / L4 判据与判序 / 例外判据 E1–E5 / 存量清零 / 例外登记表 / 提示词三节逐字稿 / 勘察 checklist 通用化 / normal 覆盖面 / 决策表 · J = **存量处置清单全节** · 逐档对位蓝图与分期表 · 受影响文件清单 · 用例与 AC 编号集 · 两仓合并退役注记 |
| 4 | `design/TESTING.md` | 995 | `docs/core/design/TESTING.md` | 277 | K = 分层纪律 / slow 门与防漏拦截 / 库存治理 / 三层来源与处置判据 / 批次档 §6 处置行 / 集成集承载 runner 接口与镜像 / 首批用例表 / 散文锚退役判据与禁令 · J = 首执行清单 · 逐条删除清单 · 受影响文件清单 · 编号集 · 已退役机制注记 |
| 4a | 同上（拆分面 2） | — | `docs/core/design/E2E-HARNESS.md` | 208 | K = 缺环与复用面 / 方案选型 / 两驱动面契约 / 四周守卫接缝裁定 / 接入与分层 / 覆盖边界 / 验收与用例 · J = 立项勘察注与实核读数 · 逐批表 · 受影响文件清单 |
| 5 | `requirements/ENGINEERING-MODE.md` | 1003 | `docs/core/requirements/ENGINEERING-MODE.md` | 367 | K = 铁律 / 总体 / 用户故事 / FR·NFR / 裁定清单 / 工作流程 / 各角色工作流 / 交界面契约 B1–B14 + 五条铁律 / 失败路径 / 可移植性 / 边界 · J = 头部状态行与逐批指针 · 过渡例外块 · 逐批对账明细 · 机制面逐批块（随 5a 拆出） |
| 5a | 同上（拆分面 2） | — | `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` | 380 | K = §1.12 批次记录档（含模板骨架 + 段作者表）/ §1.13 需求池 / §1.15 文档更新纪律 / §1.16 段写入工具 / §1.17 VSC 镜像 / §1.18 台账可见面 / §1.19 各仓自持 / §1.20 文档↔实装对账 · J = 逐批声明与勘察快照 · 计数修正流水 · 逐批对位与迁移清单 |
| 6 | `requirements/TESTING.md` | 177 | `docs/core/requirements/TESTING.md` | 191 | K = 总体 / F1–F28 / N1–N18 / 维护模型 / 散文锚退役判据与禁令 / CLI 自动验证面需求 / 判定句 · J = 来源注与逐批指针 · 修正轮流水 · 归册批号 · §6 立项勘察注 |

**行数口径** = `readFileSync(...).split("\n").length`（含末行空元素）· as-of 2026-09-15 本批实测。
**落点分布**：`docs/core/design/` 9 档 · `docs/core/requirements/` 3 档。
**逐档 ≤500**（实测 191–380）⇒ **无硬门档**；>300 的 7 档**已在档内附拆分规划**（R24a）。

#### 二、逐档剔料清单（逐处——一次性材料不并）

| 旧档 | 剔除项（逐处） | 去向 |
|---|---|---|
| `design/ENGINEERING-MODE.md` | ① §2.11–§2.32 的**逐批设计记录**（问题陈述 / 方案选型 / 关键决策 / 修正轮注记）② §2.14/§2.18/§2.21/§2.23/§2.25 **受影响文件 as-of 快照**（标注「不得当契约引用」）③ §3.1 验收标准 + §3.2 用例表（T25–T112 / AC10–AC90 / T-V5-*）④ §7 变更记录（逐批复述）⑤ 已退役载体（METHODOLOGY 携带/缺失降级 D-M1/D-M2 · 旧 `engineering.md` 系 · 无签名 token 防伪层）⑥ VSC 仓实现坐标（§2.22/§2.23） | ①④ 归 `docs/batches/` + git 历史；②⑤ 由现状读数/现行载体替代；③ 机制级不变量已提炼入落点档验收标准；⑥ **P2 ⇒ VSC 轮**（报告 §十） |
| `design/ADVISOR-CONVERGENCE.md` | ① §13–§18 的逐批小节（问题陈述 / 选型 / 决策 / 修正轮注记）② 受影响文件 as-of 清单（`N lines total` 口径）③ 用例与 AC 编号集（T-CG* / T-SG* / T-EST* / AC-CG* / AC-B4-*）④ 变更记录流水（历史折叠）⑤ 机制演进反转史（cap 引入 → design 并入 → 重获豁免） | ①④ 归批次档 + git；② 由现状读数替代；③ 机制级判定句已提炼；⑤ 收为动机一句 |
| `design/LEDGER-SELF-CONTAINED.md` | ① **§8 存量处置清单全节**（逐档迁移 / 拆分 / 归档面 / 写痕处置 + 对端文档体系对位蓝图 + 36 档对位表 + 分期表）② §9 受影响文件清单 ③ §10 用例表 + §11 验收标准（AC-LS1–AC-LS35 / T-LS1–T-LS43）④ §13 变更记录 ⑤ 两仓合并批退役注记（因合并失去对象的隔离条款） | ① **一次性执行材料**（**判据** = 三值 / 处置判据 / 分期须带触发条件 → 已并入落点档 §2.3/§2.4/§2.6）；②③④ 批次面；⑤ 判决已并入现行条文 |
| `design/TESTING.md` | ① §7 首执行清单（退役 / 合并 / 削段 / 域外补录逐条）② §8 受影响文件清单 ③ §11.3/§11.4 **逐条删除清单**（201 条处置行）④ §11 的修正轮流水与批号 ⑤ 用例与 AC 编号集（T-TL* / T-PA* / AC-TL* / AC-PA*）⑥ §12 的立项勘察注与实核读数 | ①③ **一次性执行清单**（清单制判据已并入落点档）；②⑤ 批次面；④⑥ 一次性材料 |
| `requirements/ENGINEERING-MODE.md` | ① 头部状态行与逐批指针行（「来源：…」+ 第 13/14/20 批 + 角色重定义批 + 台账可见面/自持/对账三批）② §1.5 过渡例外块（a 案破例代行）③ §1.5 角色重定义批逐条对账明细 ④ §1.15 逐批块（第 13/14/20/22 批等「无新需求」声明与落笔明细）⑤ §1.16–§1.20 立项勘察快照（「全不存在 / 零命中」时点表述）⑥ 段号修正流水（B12 §4→§5 等） | ①②③④ 一次性建档/对账/批次材料（判定句已并入现行条文）；⑤ 现行态以设计档为准；⑥ 修正流水归批次档 |
| `requirements/TESTING.md` | ① 来源注与逐批指针（TEST-LIFECYCLE / PROSE-ANCHOR-RETIRE / E2E-HARNESS）② §5.1 修正轮流水 ③ 归册补登批号与批次档指针 ④ §6 立项勘察注（硬约束实核读数） | ①③④ 一次性材料（结论句保留）；② 判据补充（C1-a–d）已并入 §5.1 |

#### 三、拆面与产物（逐档：范围 / 行数 / 取舍理由）

| 旧档 | 拆面（读者面 / 机制族） | 产物 | 取舍理由 |
|---|---|---|---|
| `design/ENGINEERING-MODE.md`（3030） | ① 工作流本体 ② 批次档与段写入 ③ 文档纪律与机检对账 ④ 台账机制 | 4 档（254/224/279/279） | 3030 行超硬限；四类机制的**读者面互不重叠**（「怎么写工程任务」/「谁写批次档」/「文档怎么守」/「台账是什么」）；切点零交叉（各档自带契约与不变量）；台账面与自持档成对（D2：L1–L3 与 L4/V4 各述一处） |
| `design/ADVISOR-CONVERGENCE.md`（1570） | ① 收敛协议本体 ② 边缘守卫族 | 2 档（266/341） | 「评审几轮、怎么收敛」与「边界上怎么不失守」两个读者面；本体 ≤300、守卫族 >300（附拆分规划） |
| `design/LEDGER-SELF-CONTAINED.md`（1033） | 单档（自持判据面） | 1 档（321） | 重建后 ≤500 ⇒ 不拆；**§8 存量处置清单**（一次性执行材料）剔出即达标 |
| `design/TESTING.md`（995） | ① 分层/生命周期/集成集/散文锚 ② CLI 端到端 harness | 2 档（277/208） | 单体 ≤500 但 995 >500 ⇒ 拆；harness 是**独立读者面**（「CLI 怎么自动验证」），并与集成集承载契约分家 |
| `requirements/ENGINEERING-MODE.md`（1003） | ① 工作流本体需求 ② 机制面需求 | 2 档（367/380） | 1003 行超硬限；**节号沿用原档**（§1.12/§1.13/§1.15–§1.20）——全仓既有指针只需改档名、不改节号 |

#### 四、台账收口（`docs/core/design/DOC-MIGRATION.md`）

| 项 | 改前 | 改后 |
|---|---|---|
| §2.1 四行（第 2 / 16 / 20 / 38 行） | 后续批 | **本批迁**（逐行补现状实核依据 + 落点，含拆分产物档名） |
| §2.2 两行（第 12 / 30 行） | 后续批 | **本批迁**（同上；第 12 行含需求侧拆分产物） |
| §5 小计「本批迁」 | 设计 17 / 需求 4 = **21** | 设计 21 / 需求 6 = **27** |
| §5 小计「后续批」 | 设计 16 / 需求 23 = **39** | 设计 12 / 需求 21 = **33** |
| §5 闭合校验 | 21+16+4+4+0+39 = 84 | **27+16+4+4+0+33 = 84** ✓（设计 21+9+1+4+0+12=47 ✓ · 需求 6+7+3+0+0+21=37 ✓） |
| §5 口径行 | 第 1 批 6 + 第 2 批 9 + 第 3 批 6 = 21 | 第 1 批 6 + 第 2 批 9 + 第 3 批 6 + **第 4 批 6 = 27** |
| §6 批 3 行 | 「每档须先出 R24a 拆分规划」 | **已落（2026-09-15 第 4 批）**——四档设计侧拆 9 档、需求侧拆 3 档；标题档数 39 → **33** |
| §8 体量 | 203 行 | **214 行**（本批实核） |

#### 五、方案选型对比（拆分面取哪几档拼接 / 落哪）

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **按读者面 / 机制族切**（本批所选） | ① 读者面互不重叠（工作流本体 / 批次档 / 文档纪律 / 台账 / 收敛 / 守卫 / 测试 / harness）✓ ② 切点零交叉（各档自带契约与不变量；跨档只挂指针）✓ ③ 每档 ≤500 且余量充足 ✓ ④ 与需求侧拆面同构（本体 ⇄ 机制面）⇒ 三层指针形态统一 ✓ | 代价 = 档数增多（12 档）；但**完成度 100% 优于覆盖度** | **选定** |
| 2 | 按行数均分（机械切半 / 切三） | ① 行数齐整 ✓ ② **切点落在机制中部**（如把「工具契约」与「不变量」分家）⇒ 每档各需重复上下文 ✗ ③ 与需求层/批次档指针形态对不上 ✗ | 代价 = 内容重复 + 可读性差 | **否决**（②③） |
| 3 | 不拆，只把超限档整体落盘 | ① 零拆分开销 ✓ ② **违 >500 硬限（无豁免通道）** ✗ | —— | **否决**（②） |

#### 六、关键决策记录

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| M1 | **先拆后迁**（拆分动作与搬迁同批） | 四档超 500 硬限无豁免；拆面按读者面定（§五 候选 1） |
| M2 | 需求侧拆分**节号沿用**原档（§1.12 / §1.13 / §1.15–§1.20） | 全仓既有指针只需换档名；否决「重新编号」（会连带全仓指针改写面） |
| M3 | 台账机制与自持判据**分档**（L1–L3 / 可见面 vs L4 / V4 / 例外判据） | D2 单一权威源——两种判据各自详述一处；否决「合一档」（>500 且两类读者面不同） |
| M4 | **一次性执行材料不并**（存量处置清单 / 逐条删除清单 / 首执行清单 / 逐档对位蓝图） | 判据与三值规则已并入落点档；清单本体是执行材料（归批次档 + git） |
| M5 | **VSC 专有面实现坐标不并**（P2） | P5 冲突序：产品面压过引用计数；本档只保留机制原则与锚面，坐标归 VSC 轮 |
| M6 | 坐标一律**现状路径 + 实核** | 迁移前仓形态（产品树 `src/**`、CLI 树内 `scripts/`）已变——本批实核：检查器 = 仓根 `scripts/`；运行期模块 = `thincoder-core/**`；测试/入口 = `thincoder-cli/**` |
| M7 | 用例编号**避开 V5-B 形态** | 新档用例号首版用 `T-<字母><数字>` 被机检判为悬空用例号锚（41 处）⇒ 改 `BR-1`/`DD-1`/`EM-1`/`LG-1`/`TS-1` 形态（非 `T` 前缀、不入锚抽取）；**未改脚本**（脚本 = 写域外） |
| M8 | 不动他线在写档 | 并行线（VSC 迁移批）在写 `docs/TODO.md` / `scripts/check-doc-width.mjs` / `thincoder-vscode/**` —— 本批零触碰 |

#### 七、受影响文件（R24a）

| # | 档 | 当前行数 | 动作 | 增量 |
|---|---|---|---|---|
| 1–9 | `docs/core/design/{ENGINEERING-MODE,BATCH-RECORD,DOC-DISCIPLINE,LEDGER,LEDGER-SELF-CONTAINED,ADVISOR-CONVERGENCE,ADVISOR-GUARDS,TESTING,E2E-HARNESS}.md` | 0（新建） | **新建**（B 式重建 + 拆分） | +2449（实测合计） |
| 10–12 | `docs/core/requirements/{ENGINEERING-MODE,ENGINEERING-MODE-MECHANISM,TESTING}.md` | 0（新建） | **新建** | +938（实测合计） |
| 13 | `docs/core/design/DOC-MIGRATION.md` | 203 | **实修**（六行改写 + 小计 + §6 + §8 + 变更记录） | +11（实测 214） |
| 14 | `docs/batches/2026-09-14-doc-migration.md` | — | **append §2**（不改 §1） | +本段 |
| — | `thincoder-cli/docs/**`（84 档） | —— | **0** | 一字不改（只读参照——B 式） |
| — | `scripts/**` · `docs/TODO.md` · `docs/core/design/prompts/**` · `thincoder-core/**` · `thincoder-vscode/**` | —— | **0** | 零写入（写域外；`scripts/check-doc-width.mjs` 的他线改动为零触碰） |

#### 八、验收标准（逐条回指 · 机器可验）

| # | 验收标准 | 回指 |
|---|---|---|
| D1 | `node scripts/doc-anchors.mjs` 两域**悬空 0** · exit 0 | FR7 · N3 |
| D2 | `node scripts/check-doc-width.mjs` **新增宽度违规 0**（373 文件） | N3 |
| D3 | `node scripts/check-ledger.mjs` exit 0 · **0 处违规** · 基线 0 条 | N3 |
| D4 | 台账小计闭合：27+16+4+4+0+33 = 84（设计 47 / 需求 37，双向闭合） | FR3 · A3 |
| D5 | 产物 **12 档逐档 ≤500**；>300 的 7 档档内附拆分规划 | R24a |
| D6 | 各档含「不并项与历史沿革」节；无状态行 / 无逐批变更流水 | FR1 · FR2 |
| D7 | 新档内坐标全为**现状路径**（0 处迁移前 `src/**` 形入正文叙述面） | FR4 · FR5 |
| D8 | `git status` 本角色写域 ⊆ 13 档（12 新 + 1 改）⊆ `docs/core/**` + 本档 §2 | N4 |

**读数（as-of 2026-09-15 本批实测）**：
- **D1 ✓**：两域各 `OK(V5): 0 条悬空锚（闸态——阈值 0）`（读数 97 档 / 99 档——他线在写档，读数有变）。
- **D2 ✓**：`OK(宽度)` 373 文件 · 一致性 V1/V2/V3 新增违规 0 · 存量 0。
- **D3 ✓**：台账两档 `OK` · 0 处违规 · 基线 0 条。
- **D4 ✓**：84 闭合（设计 21+9+1+4+0+12=47 · 需求 6+7+3+0+0+21=37）。
- **D5 ✓**：12 档实测 191 / 208 / 224 / 254 / 266 / 277 / 279 / 279 / 321 / 341 / 367 / 380 行。
- **D6 ✓ / D7 ✓**：逐档含不并项节；坐标实核改写（`thincoder-core/**` · `thincoder-cli/**` · 仓根 `scripts/**`）。
- **D8 ⚠**：`git status` 另含**他实例**在写档（`docs/TODO.md` · `docs/batches/2026-09-15-vsc-doc-migration.md` · `scripts/check-doc-width.mjs` · `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md`）——本角色**零触碰**（见 §十）。

#### 九、用例表（正常 / 边界 / 错误）

| # | 类 | 输入 | 期望输出 |
|---|---|---|---|
| D-T1 | 正常 | `node scripts/doc-anchors.mjs` | 两域悬空 0 · `OK(V5)` · exit 0 |
| D-T2 | 正常 | `node scripts/check-doc-width.mjs` | `OK(宽度)` · 373 文件 · 新增违规 0 |
| D-T3 | 正常 | `node scripts/check-ledger.mjs` | 两档 `OK` · 0 处违规 · exit 0 |
| D-T4 | 边界 | 台账小计复核（六栏加总 = 84 = 设计 47 + 需求 37） | 闭合（D3——计数与列表同改） |
| D-T5 | 边界 | 产物逐档行数清点 | 全部 ≤500 |
| D-T6 | 边界 | 新档用例编号形态（`BR-1` 类） | 不入 V5-B 锚抽取（零悬空） |
| D-T7 | 错误 | B 式越界（改旧档） | `git status` 出现 `thincoder-cli/docs/**` 改动 ⇒ 判违规（实测 **0**） |

#### 十、未决与打回（不静默处置）

| # | 项 | 归属 / 处置 |
|---|---|---|
| 1 | **VSC 专有面实现坐标不并**（原 §2.22 / §2.23 的 VSC 仓逐文件落点与行数） | **P2 产品面**——本批只保留机制原则（语义同源·原文自持 / 镜像锚 A1–A12 / 两处各落 / 八处落地）与需求指针；坐标归 **VSC 轮**。**列报告，不静默** |
| 2 | **需求侧板块档仍在 CLI 树**（`requirements/ADVISOR-CONVERGENCE.md` 等） | 本轮未迁（台账 §2.2 分组既定）——本批设计档的档头指针按「该板块需求档迁入基准层属后续批」书写；请父侧排批 |
| 3 | **他实例并行在写档**（`docs/TODO.md` · `docs/batches/2026-09-15-vsc-doc-migration.md` · `scripts/check-doc-width.mjs` · `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md`） | VSC 轮 / 父侧——本角色**零触碰**；三机检读数已如实登记（§八 D8） |
| 4 | **新档未登记进地图**（`docs/README.md` 内容表 / 与产品地图的关系） | **写域外**（地图 = 父侧面）——请父侧补登记 12 档 |
| 5 | **实例级编号形态裁定**（本批 M7：把 `T-<字母><数字>` 改为 `BR-1` 类） | 本角色判 = **一致性面**（机检谓词对齐——新档不得自造悬空用例号锚），已逐档落地并登记；**若父侧判为语义面 ⇒ 请打回**（改名可独立单笔 revert） |
| 6 | DOC-MIGRATION §5「本批迁」栏口径 = **活档迁入数**（本批 6 源档 ⇒ 12 产物档，仍计 6） | 口径与前三批一致（按**源档**计数，非按产物档）——如父侧要按产物计 ⇒ 请裁定（本批未改口径） |

#### 十一、边界（本批不做）

1. **`thincoder-cli/docs/**` 一字不改**（B 式只读参照——实测 `git status` 零改动）。
2. **不动 `scripts/**`**（他线在写 `scripts/check-doc-width.mjs`，本角色零触碰）；**不新建目录**（落点皆既有）。
3. **不写他档**：`docs/TODO.md` · `docs/README.md` · `docs/core/design/prompts/**` · 其余既有 `docs/core/**` 档 · `thincoder-core/**` · `thincoder-vscode/**` 零写入。
4. **不 commit · 不发起评审**（发起权 = 用户）。
5. **不改旧档的已知错误**（旧档只读——语义按现状在落点档收正并登记）。

#### 十二、三方条目一致

**本段条目（6 源档 ⇒ 12 产物档 + 台账收口）= 迁移台账 §2.1 第 2 / 16 / 20 / 38 行 + §2.2 第 12 / 30 行（本批迁栏）= 需求档既有条目回指**（`docs/core/requirements/DOC-SYSTEM.md` 的 FR1–FR8 / N1–N4）；
本批**不新增需求条目**（执行既有 FR，无范围增减）。需求侧拆分（`ENGINEERING-MODE-MECHANISM`）**节号沿用**原档——两侧档头互注。

**§2 自检修正（同日 · 本角色）**：① `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` 曾残留 §2 可移植性 / §3 边界（与 `requirements/ENGINEERING-MODE.md` 重复——违 D2），已删除并改挂指针 ⇒ 实测行数 **380 → 359**；
需求侧产物行数合计 **938 → 917**（367 + 359 + 191）。② 设计侧产物行数合计 **2449**（254 / 224 / 279 / 279 / 321 / 266 / 341 / 277 / 208）——不变。
**修正后读数（as-of 2026-09-15）**：`doc-anchors` 两域 **0 悬空** · `check-doc-width` **373 文件 · 新增违规 0** · `check-ledger` **0 处违规 · 基线 0 条**；12 档逐档 ≤500（191–359）。

### 第 5 批 · 并入既有档的未并面（2026-09-15 · eng-designer · 段作者 = 本角色）

**目标**：把 CLI 树 13 档活档的**未并内容**并入基准层既有档（= 迁移台账 §6「批 4」组；用户 2026-09-15 01:47「拜托把这两件事推进完好吗」——一次落干净 ✓）。
**判据依据**：`docs/core/design/DOC-SYSTEM.md` §5.1（P1–P5）· §4（去向表）· §6（命名规则）；并入目标按三处登记解析（CLI 台账行 + `docs/vsc/design/VSC-MIGRATION.md` §8A/§8B + 各设计档档头指针）——判据句住各档，本节不重述（D2）。
**迁法**：**B 式**——旧档一字不改 + **只并根层缺者**；**追加式**（既有结构之后，不打乱节序）；(d) 类入各档「不并项与历史沿革」；坐标按现状路径 + `file:line` 实核；**VSC 面节按 P2 不并**（列报告）。

#### 一、逐档：根层现状 → 未并节 → 并入 K / 不并 J（13 源档）

**设计侧（3 档）**

| # | 源档（CLI 树 · 一字未改） | 根层目标 | 未并节（逐节实核） | K 并入 | J 不并 / 登记 | 行数 前→后 |
|---|---|---|---|---|---|---|
| 1 | `design/AGENT-LOOP.md`（1786） | `docs/core/design/AGENT-LOOP.md` + **拆分面新建** `AGENT-LOOP-SUBAGENT.md` | §12.1 对象锚 / §12.2 铁律 / §8.1 后半+§19 轻量审计 / §12.4 byte-identical / §14 飞刀（指针收口） | 母档 §6.17（轻量审计）+ 子档 §6.18 / §6.19（对象锚 / 铁律）；§6.16 指针表按现状收正；byte-identical → 提示词板 §6.4；飞刀 → `ESCALATE.md` 指针 | 旧 §13 / §15 / §21 / §23 批材料等既有登记；§12 各行的「属××板」= 迁移期指态 → 销项登记 | 670 → **472**（母档，拆分后）+ 新 **272**（子档） |
| 2 | `design/PROMPT-SYSTEM.md`（707） | `docs/core/design/PROMPT-SYSTEM.md` | 双源落地流程 / 装配实现事实 / 端特有段纪律 / byte-identical 取消 | §6 机制面 + §7 决策（D-PS1–4）+ §8 沿革 | §1–§4 施工批材料 / §8 机制纪律落地批 → 沿革登记 | 150 → **221** |
| 3 | `design/POOL-CONFIG-UNIFIED.md`（130） | `docs/core/design/CONFIG.md`（前批裁定：并入 **CONFIG**） | 配置键面（三键 4/4/4 / 双读取器 / 四源同改 / 界面入口 / 向后兼容） | §6.1 并发池配置面 + §7 决策（D-CF1–4） | 单批选型 / 用例 / AC → 沿革 | 119 → **149** |

**需求侧（10 档 —— 落点按登记解析；4 路径当时无档 ⇒ 按「并入既有」登记执行）**

| # | 源档（CLI 树） | 根层目标（实核） | 未并节 | K 并入 | J 不并 / 登记 | 行数 前→后 |
|---|---|---|---|---|---|---|
| 4 | `requirements/MEMORY.md`（154） | `core/requirements/MEMORY.md` | 整档条目面（F1–F14 / F-M1–F-M3 / N1–N9 / N-M1–N-M3） | §4（4.1–4.6）+ §5 沿革 | 头注 / 状态 / 流水；VSC 端条目面（VSC 轮登记） | 46 → **139** |
| 5 | `requirements/AGENT-LOOP.md`（356） | `core/requirements/AGENT-LOOP.md` | 无（前批 B 轮已并；4 VSC 面节维持 P2） | §4.7 / §4.8（自 #8 / #9 并入） | §3 / §5 / §8 / §13 VSC 面节（P2） | 140 → **173** |
| 6 | `requirements/PROMPT-SYSTEM.md`（418） | `core/requirements/PROMPT-SYSTEM.md` | 分层 / 命名法 / 内容大纲 / 编写纪律 15 条 / 装配逻辑 / 归属判定 | §4（蓝图条目）+ §5 沿革 | §5 结构债 / §6 / §7 / §8 / §9（VSC 面）/ §10 → 登记 | 55 → **209** |
| 7 | `requirements/ADVISOR-CONVERGENCE.md`（379） | **新建** `core/requirements/ADVISOR-CONVERGENCE.md` | F1–F17 / F27–F29 + N1–N11 / N19–N21 + §5 待设计需求 | §2/§3/§5/§6 全量重建 | §8 / §9 / §13 VSC 面节；§11 退役评估 → 沿革 | 0 → **172** |
| 8 | `requirements/ASYNC-RESULT-CONTAINER.md`（27） | `core/requirements/AGENT-LOOP.md` | 整档（F1–F6 / N1–N4） | §4.8 | — | — |
| 9 | `requirements/SUBAGENT-OBSERVE-SEND.md`（22） | `core/requirements/AGENT-LOOP.md` | 整档（F1–F2 / N1–N4） | §4.7 | — | — |
| 10 | `requirements/ESCALATE.md`（36） | `core/requirements/ESCALATE.md`（VSC 批 3 建） | **零实质缺口**（逐节对账：一句话 / 分工表 / 边界哲学 / 不做清单全覆） | 零新增文本（对账 + 销项） | — | 69 → **70** |
| 11 | `requirements/SEND-STALL-DISTILL.md`（38） | `core/requirements/SEND-STALL-DISTILL.md` | N3 的 CLI 中止形态（退出 flush ≤5s / Stop 不中止蒸馏） | N3 补注 + 销项 | — | 72 → **73** |
| 12 | `requirements/TURN-CAP-CONTINUE.md`（45） | `core/requirements/TURN-CAP-CONTINUE.md` | F7 跨段累计编号 / N6 零机制改动 / N2 补注 / §4 分段显示边界 | F7 + N6 + 补注；**并整 F3 重复行**（一致性面就地修） | — | 73 → **76** |
| 13 | `requirements/TOOL-OUTPUT-LIMITS.md`（43） | `core/requirements/TOOLS.md` | FR1–FR6 / N1–N5 | §4.5 工具输出上限系 + §5 登记 | — | 96 → **115** |

**台账**：`docs/core/design/DOC-MIGRATION.md` 214 行（13 行判栏改写 + 小计重算 + §4 对账两行 + §6 + §8 + 变更记录）。

#### 二、台账收口（`docs/core/design/DOC-MIGRATION.md`）

| 项 | 改前 | 改后 |
|---|---|---|
| §2.1 三行（第 3 / 25 / 27 行） | 尚有未并 ×2 · 后续批 ×1 | **本批迁**（逐行补实核依据 + 落点） |
| §2.2 十行（第 2 / 3 / 5 / 13 / 17 / 23 / 25 / 29 / 31 / 35 行） | 尚有未并 ×3 · 后续批 ×7 | **本批迁**（同上） |
| §5 小计「本批迁」 | 27（设计 21 / 需求 6） | **40**（设计 24 / 需求 16） |
| §5 小计「尚有未并」 | 印刷 4（**实计 5**） | **0** |
| §5 小计「后续批」 | 印刷 33（**实计 32**） | **24**（设计 10 / 需求 14） |
| §5 闭合校验 | 27+16+4+4+0+33 = 84 | **40+16+0+4+0+24 = 84** ✓（设计 24+9+0+4+0+10=47 ✓ · 需求 16+7+0+0+0+14=37 ✓） |
| §5 口径行 | 第 1–4 批 = 27 | 第 1–5 批 = **40** |
| §5 小计收正注 | — | 上一版印刷值 4/33 与逐行实计（5/32）不符 ⇒ **按逐行实核收正**（新行） |
| §6 批 4 行 | 「并入面 = 追加节，不新起档」 | **已落（2026-09-15 第 5 批）**；标题 33 → **24** |
| §8 体量 | 214 行 | **214 行**（第 5 批实核） |

**收口校验**：逐行重算脚本复核 = 设计 24/9/0/4/0/10 = 47 · 需求 16/7/0/0/0/14 = 37 · 合计 84 ✓（D3）。

#### 三、方案选型对比

**单方案（落点）**：本批无「往哪并」真选择——13 档的落点均已有登记（CLI 台账行 · VSC §8A/§8B · 设计档指针），取其交集执行。**多方案（拆分面）**：见 §四 M1（AGENT-LOOP 拆分面三方候选：Stop 钩子→TOOLS / abort provider 半边→PROVIDER / 主循环族∥子代理族两档分家——前两者落点在本批写域外，取第三方案落地）。

#### 四、关键决策记录

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| M1 | **AGENT-LOOP 拆分执行**：§6.7–§6.12 → 新档 `AGENT-LOOP-SUBAGENT.md`（**节号沿用**） | 670 + 并入 > 500 硬限 ⇒ 必拆（任务书点明）；§9 原规划行 3（两档分家）落地的写域内可行变体（行 1/2 落点在写域外）；节号沿用 = 全仓既有指针只改档名（承前批 M2 先例）；与「一板块一档」冲突点如实登记 |
| M2 | **四「无档目标」按登记解析落笔**：ASYNC-RESULT-CONTAINER / SUBAGENT-OBSERVE-SEND → `req/AGENT-LOOP.md`；TOOL-OUTPUT-LIMITS → `req/TOOLS.md`；ADVISOR-CONVERGENCE → **新建同名需求档** | 判据 = 三处登记（台账 + VSC-MIGRATION §8B-20/21/22 与 §8A + 设计档档头指针）；任务书 10 路径中 4 路径实核无档——**逐条进报告**；TOOL-OUTPUT-LIMITS 落 `req/TOOLS.md` 在任务书 14 档字面清单外（⚠ 见 §七） |
| M3 | **VSC 面节不并**（旧 §8/§9/§13 等） | 任务书硬性（P2 ⇒ VSC 轮）；逐档登记进各档「不并项」 |
| M4 | **小计按逐行实核算**（印刷值纠偏） | 上一版印刷 4/33 与逐行实计 5/32 不符——D3（计数与列表同改）按实核修正 |
| M5 | 并入内容坐标 = **现状路径 + file:line 实核**；写后三机检复跑 | 机检首跑暴露 3 处裸 basename 悬空（本批自产）→ **就地修正**（全路径化）后复跑归零 |

#### 五、受影响文件（R24a · 实核行数）

设计侧：`docs/core/design/{AGENT-LOOP(472), AGENT-LOOP-SUBAGENT(272·新), PROMPT-SYSTEM(221), CONFIG(149), DOC-MIGRATION(214)}.md`；
需求侧：`docs/core/requirements/{MEMORY(139), AGENT-LOOP(173), PROMPT-SYSTEM(209), ADVISOR-CONVERGENCE(172·新), ESCALATE(70), SEND-STALL-DISTILL(73), TURN-CAP-CONTINUE(76), TOOLS(115)}.md`；
本批次档 §2 append 1 处。**逐档 ≤500 ✓（最大 472）**；>300 者均含拆分规划 / 体量节。

#### 六、验收标准（逐条回指 · 机器可验）

| # | 验收标准 | 回指 |
|---|---|---|
| E1 | `node scripts/doc-anchors.mjs --domain .` **域一悬空 0** · exit 0 | FR7 · N3 |
| E2 | `node scripts/check-doc-width.mjs` **OK(宽度)**：381 文件 0 行 >300 字符 · 一致性新增违规 0 | N3 |
| E3 | `node scripts/check-ledger.mjs` exit 0 · **0 处违规** · 基线 0 条 | N3 |
| E4 | 迁移台账小计闭合：40+16+0+4+0+24 = 84（设计 47 / 需求 37，双向闭合） | FR3 · A3 |
| E5 | 13 档全有落点；逐档 ≤500；并入面 = 追加节（含拆分面 + 一档新建） | FR1 · FR2 |
| E6 | 坐标全现状路径 + file:line 实核（0 处迁移前形态入正文叙述面） | FR4 · FR5 |
| E7 | `git status` 本批 ⊆ 写域（14 档 + 本段）——⚠ 见 §七-2/6 | N4 |

**读数（as-of 2026-09-15 本批实测 · 复跑）**：
- **E1 ✓**：域一 `OK(V5): 0 条悬空锚`（复跑；首跑自产 3 处裸 basename 悬空 → 已修正）。
- **E2 ✓**：`OK(宽度): 扫描域全部 .md 无 >300 字符单行（381 文件）` · 一致性 V1/V2/V3 新增违规 0 · 存量 0（首跑 5 行超宽为本批自产 → 已纯折行修正）。
- **E3 ✓**：两档 `OK` · 0 处违规 · 基线 0 条。
- **E4 ✓**：84 闭合（逐行重算脚本复核）。
- **E5 ✓ / E6 ✓**。
- **E7 ⚠**：见 §七-2（他线提交 `e29afe23` 吞并本批在途 4 档）+ §七-3（3 处非本批未提交文件）。

#### 七、未决与打回（不静默处置）

| # | 项 | 归属 / 处置 |
|---|---|---|
| 1 | **他线 commit `e29afe23`（"vsc batch4"）吞并本批在途 4 档**：`docs/core/design/{AGENT-LOOP,AGENT-LOOP-SUBAGENT,CONFIG,PROMPT-SYSTEM}.md`（提交时点早于本批收口 ⇒ 4 档的最终版仍有未提交增量）| 本批**未 commit**（发起权非本角色）；请父侧知悉「混提交」事实；本批余量（各档收尾编辑）留在工作树待父侧收口 |
| 2 | **VSC 树域 1 条悬空锚**（全量运行第二节 FAIL——`docs/COMPETITIVE_ANALYSIS.md` / `docs/design/*` 系文件，实核属 `thincoder-vscode/` 域） | **非本批写域**（本批零触碰 VSC 树）——他线/父侧；本批自身供 0 |
| 3 | 工作树另有 3 处非本批未提交改动：`docs/TODO.md` · `scripts/check-doc-width.mjs` · `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md`（+ `docs/batches/2026-09-14-doc-migration.md` 的第 4 批段 = 上批遗留未提交） | 他线 / 父侧——本批零触碰 |
| 4 | **`TOOL-OUTPUT-LIMITS` 需求侧落点 = `req/TOOLS.md`**（任务书 14 档字面清单外） | 判据 = 三处登记一致（CLI 台账 §2.2 #31 · VSC-MIGRATION §8B-22 · `design/TOOL-OUTPUT-LIMITS.md:7`）；**如父侧判越界 ⇒ 单笔可 revert**（该节独立） |
| 5 | **设计侧指针陈旧 3 处**（写域外）：`design/ADVISOR-CONVERGENCE.md:5` / `ADVISOR-GUARDS.md:5`「需求档迁入基准层属后续批」；`design/TOOL-OUTPUT-LIMITS.md:7/:99`「CLI 树需求档未迁」 | 本批已落 ⇒ 指针已成 stale——设计侧写域外（他线持有），请父侧/他线收正 |
| 6 | `docs/vsc/design/VSC-MIGRATION.md` §4.4-1/2 引母档旧节号（§6.7.2/§6.7.3——拆分后居 `AGENT-LOOP-SUBAGENT.md`） | 写域外——请父侧/他线随下一批收正 |
| 7 | 台账 §6 批 6a 行未反映「`SEND-STALL-DISTILL` / `TURN-CAP-CONTINUE` 根层设计档已由 VSC 批 3 建 ⇒ CLI 侧转『并入既有』形态」 | 本批未改（超收口范围）——列报告供父侧排批时复查 |

#### 八、边界（本批不做）

1. **`thincoder-cli/docs/**` 一字不改**（B 式只读参照——实测 `git status` 零改动）。
2. **不动 `scripts/**`**（机检复跑只读）；不新建 `docs/cli/**` 外目录（ADVISOR-CONVERGENCE 需求档 = 登记目标新建）。
3. **不写他档**：`docs/TODO.md` · `docs/README.md` · 其余既有 `docs/core/**`（含他线持有的设计侧 ENGINEERING-MODE / TESTING / ADVISOR-CONVERGENCE / LEDGER-SELF-CONTAINED）· `thincoder-core/**` · `thincoder-vscode/**` · 提示词正本 零写入。
4. **不 commit · 不发起评审**（发起权 = 用户）。
5. **VSC 面节一律不并**（列报告）；**不改旧档已知错误**（旧档只读）。

#### 九、三方条目一致

**本段条目（13 源档 ⇒ 目标档并入 + 拆分面 + 一档新建 + 台账收口）= 迁移台账 §2.1 第 3 / 25 / 27 行 + §2.2 第 2 / 3 / 5 / 13 / 17 / 23 / 25 / 29 / 31 / 35 行（本批迁栏）= 需求档既有条目回指**（`docs/core/requirements/DOC-SYSTEM.md` 的 FR1–FR8 / N1–N4）；
本批**不新增需求条目**（执行既有 FR，无范围增减；ADVISOR-CONVERGENCE 需求档 = 既有条目的迁建，非新需求）。

**§2 自检读数订正（同日 · 本角色）**：① 全量运行（无域参）三域读数实核 = **域一（根域）OK(V5): 0 条悬空锚** ✓；**`thincoder-cli` 域 FAIL(V5): 1 条悬空锚**——`thincoder-cli/docs/design/TWO-REPO-MERGE.md:404` → `DOC-CODE-RECONCILE.md:98`
（CLI 树旧档 × VSC 线新档 `docs/core/design/DOC-CODE-RECONCILE.md` 的跨树引用未解析；**非本批**——本批零触碰 CLI 树）；**`thincoder-vscode` 域 = 报告态 21 处（非阻断）** ✓
（§七-2 原表述「VSC 树域 1 条悬空」**作废**——1 条实属 CLI 域；VSC 域恒为报告态）。
② §七-2 相应订正为：**CLI 树域 1 条悬空（非本批写域）**；VSC 树域 21 处报告态（非阻断、非本批）。
③ 本批自身供给的悬空 = **0**（首跑 3 处自产已在收口前修正；复跑全绿）。

**§2 形态修正（同日 · 本角色 · 零语义）**：订正段 1 行超宽 → 纯折行（去空白逐字节相同）；§七-6 引文改写（旧形态 = 直挂已拆出的 §6.7.2/§6.7.3 节号 ⇒ 改为「母档旧节号」表述——消 V1 段引用误报（`AGENT-LOOP.md` 已无该二节）；本行亦不再携该旧形态字面）；复跑 `check-doc-width` = OK（381 文件 · 一致性新增违规 0）✓。

### 尾部批 · 剩余「后续批」档实核（2026-09-15 · eng-designer · 段作者 = 本角色）

**目标**：取迁移台账 §2 判为「后续批」的活档 ≤8 档实迁入基准层（重派——原 spawn 排队丢失；方法 = B 式，同前批）。
**判据依据**：`docs/core/design/DOC-SYSTEM.md` §5.1（P1–P5）· §4 · §6——判据句住该档，本段不重述（D2）。
**硬纪律命中**：「本批某档若已存在或与他线同名 ⇒ 跳过、留待下一批（不抢）」——**本批全程命中此条**。

#### 一、取材与实核（逐档：台账行 → 实核判 → 结局）

台账剩余「后续批」= **15 档**（设计 5 / 需求 10，§5 闭合 49+16+0+4+0+15=84）。逐档对根层现状实核（as-of 2026-09-15）：

| # | 台账行 | 档 | 实核判 | 结局 |
|---|---|---|---|---|
| 1 | §2.2 #10 | req/DESIGN-TOKEN-SETTLEMENT | 活 · P1；spawn 时根层无档，**落笔窗口内 VSC 批 5 同名新建**（磁盘现态 = 他线版本，74 行） | **撞车跳过**——本角色草稿被覆盖后**不夺回** |
| 2 | §2.2 #11 | req/ENG-TOKEN-BINDING | 同上（VSC 批 5 版 73 行在位） | **撞车跳过** |
| 3 | §2.2 #21 | req/PORTABILITY | 同上（VSC 批 5 版 77 行在位） | **撞车跳过** |
| 4 | §2.2 #22 | req/PROJECT | 同上（VSC 批 5 版 83 行 + 拆出 `docs/vsc/requirements/PROJECT.md`；档头自注「CLI 侧同名档未迁，迁入时对账合并」） | **撞车跳过** |
| 5 | §2.2 #37 | req/VERIFY-REDESIGN | 活 · P1；**同名根档已由 VSC 批 5 新建**（在途未提交）⇒ 与原登记「并入既有 `req/TOOLS.md`」**两读冲突** | **撞车跳过**；本角色对 `req/TOOLS.md` 的 §4.6 并入草稿**已 restore 回转**——落点待父侧裁定 |
| 6–10 | §2.2 #4 / #18 / #19 / #27 / #28 | req/AGENT-PARAMS · MULTI-INSTANCE-COLLAB · NORMAL-MODE · SETTINGS-TOOL · STRUCTURE-DEBT | 同名根档**已由 VSC 批 4 建**（commit `e29afe23`） | **同名跳过**（不抢） |
| 11–13 | §2.1 #17 / #32 / #44 | design/ESCALATE · SEND-STALL-DISTILL · TURN-CAP-CONTINUE | 同名根档**已由 VSC 批 3 建**（commit `9b31da9b`） | **同名跳过**（不抢） |
| 14–15 | §2.1 #24 / #34 | design/MULTI-INSTANCE-COLLAB · SETTINGS-TOOL | 设计侧根层仍无档，但**需求侧同名根档已由 VSC 批 4 建**（同话题他线在写面） | **同名跳过**（保守——不抢同话题） |

**本批实迁 = 0 档**（15/15 全数命中「不抢」）。**撞车事件如实登记**：本角色的 4 个新建草稿在写入后被 VSC 线同路径重写覆盖（写窗撞车）；磁盘现态 = 他线完整版本，**无数据损失**；本角色未再触碰该 4 档，并把已落笔的 `req/TOOLS.md` §4.6 与本批台账判栏翻转一并 **git restore 回转**（快照 `mu1mrf49-bg4x` / `mu1mrjm1-mf1j` 在案）。

#### 二、本批落笔（只剩台账转形态登记——`docs/core/design/DOC-MIGRATION.md` 一档）

| 项 | 内容 |
|---|---|
| §2.1 五行（#17 / #24 / #32 / #34 / #44） | 判栏**保持「后续批」**；依据列补「同名根档已由 VSC 批 3 / 批 4 建」实核；动作列改「转**并入既有**，归下一批」（#24 / #34 = 下一批实核定形态） |
| §2.2 十行（#4 / #10 / #11 / #18 / #19 / #21 / #22 / #27 / #28 / #37） | 同上（VSC 批 4 / 批 5 已建同名根档）；**#37 VERIFY-REDESIGN 落点两读待父侧裁定**（并入同名根档 ⇄ 并入 `req/TOOLS.md`） |
| §6 批 6a 行 | **一致性收正**：补 ESCALATE（原缺分组——实核 §2.1 #17 为后续批却不在任何组）+ 转形态注记 |
| §6 批 6b 行 | 剔 TESTING 印刷残留（第 4 批已迁）+ 注记全量 10 档转「并入既有」 |
| §5 小计 | **不变**（49 / 15 仍闭合——本批 0 迁） |
| §8 体量 | 214 → **218 行**（实核） |
| 变更记录 | +1 行（本批实核与转形态登记 · 0 迁 · 撞车与回转留痕） |

#### 三、受影响文件（R24a · 实核）

| # | 档 | 改前→改后 | 动作 |
|---|---|---|---|
| 1 | `docs/core/design/DOC-MIGRATION.md` | 214 → **218** | 实修（转形态登记 + 变更记录） |
| 2 | 本批次档 §2 | — | append 本段 |
| — | `docs/core/requirements/{DESIGN-TOKEN-SETTLEMENT,ENG-TOKEN-BINDING,PORTABILITY,PROJECT,VERIFY-REDESIGN}.md` · `docs/vsc/requirements/PROJECT.md` | — | **他线在写档——本角色零触碰**（草稿被覆盖后不夺回） |
| — | `docs/core/requirements/TOOLS.md` | — | 草稿 **restore 回转**（落点两读待裁） |
| — | `thincoder-cli/docs/**` · `scripts/**` · `docs/TODO.md` · `docs/cli/**` · `docs/vsc/**` · 两产品树 · 核树 · prompts | — | **零写入**（实核 `git status`：本角色写域 = 台账一档） |

#### 四、验收读数（as-of 2026-09-15 本批实测）

| # | 验收标准 | 读数 | 判 |
|---|---|---|---|
| F1 | `node scripts/doc-anchors.mjs` 域一悬空 | **FAIL 6 条——全在他线在写档**（VSC 批 5 的 DESIGN-TOKEN-SETTLEMENT:73 · ENG-TOKEN-BINDING:54 · PORTABILITY:25 ×2 · PROJECT:59 + `docs/vsc/requirements/PROJECT.md:54`）；**本批供给 0**（本批唯一写域 = 台账，零新锚）。CLI 域 FAIL 1 = 既有（`TWO-REPO-MERGE.md:404`，前批已登记）。VSC 域 21 处报告态（非阻断） | ⚠ 他线在写 ⇒ 有变如实报 |
| F2 | `node scripts/check-doc-width.mjs` 宽度 | `OK(宽度)` 398 文件 · 0 行 >300 字符；**一致性 V1 新增 3 条——全在他线在写档**（VSC 批 5 的 PORTABILITY ×2 · VERIFY-REDESIGN ×1——引用不存在档 / 节）；本批供给 0 | 宽度 ✓ · 一致性 ⚠（他线自产） |
| F3 | `node scripts/check-ledger.mjs` | 两档 OK · 0 处违规 · 基线 0 条 · exit 0 | ✓ |
| F4 | 台账小计闭合 | 49+16+0+4+0+15 = 84 ✓（设计 47 / 需求 37 双向闭合——本批 0 迁，小计不变） | ✓ |
| F5 | 逐档 ≤500 | 本批无新档；台账 218 行 | ✓ |
| F6 | `git status` 本批 ⊆ 写域 | 本角色写域 = `docs/core/design/DOC-MIGRATION.md` 一档 + 本段；其余改动（6 个 untracked + `COMPETITIVE_ANALYSIS.md`）皆他线 | ✓ |

#### 五、未决与打回（不静默处置）

| # | 项 | 归属 / 处置 |
|---|---|---|
| 1 | **VERIFY-REDESIGN 需求侧落点两读**：CLI 台账原登记「并入既有 `req/TOOLS.md`」（D-V5 接管面）⇄ VSC 批 5 已新建同名根档 `docs/core/requirements/VERIFY-REDESIGN.md` | **语义面——待父侧裁定**；本批已回转 `req/TOOLS.md` 草稿，台账 #37 行已登记两读 |
| 2 | **两线撞车事实**：VSC 批 5 落点（其 §8A「待父侧另批」清单的 6 档）与 CLI 尾部批取材完全重叠——VSC-MIGRATION §8A 标注「待父侧另批」却已落笔 | **父侧**——请裁定该类档的归属线（VSC 新建 + CLI 并入既有，还是单线成对迁移）；本批已按「不抢」执行 |
| 3 | 剩余 15 档**全部**转为「并入既有 / 待裁定」形态 ⇒ 下一批 = 逐档把 CLI 侧独有内容并入他线已建根档（含对账合并——如 PROJECT 档头自注） | 下一批取材指引已写入台账 §2 动作列 + §6 |
| 4 | VSC 批 5 在途档自产机检红面（域一悬空 6 + 一致性 V1 新增 3） | **他线 / 父侧**——本角色零触碰，读数如实登记（§四 F1 / F2） |
| 5 | 设计侧 4 档（`design/{DESIGN-TOKEN-SETTLEMENT,ENG-TOKEN-BINDING,PORTABILITY,VERIFY-REDESIGN}.md`）档头「CLI 树需求档未迁（后续批）」指针在下一批并入后转 stale | 下一批随迁收正（本批 0 迁，未触发） |

#### 六、边界（本批不做）

1. **`thincoder-cli/docs/**` 一字不改**（B 式只读参照——实核 `git status` 零改动）。
2. **不夺回他线在写档**（4 个同名根档 + `docs/vsc/**`）；不动 `scripts/**` · `docs/TODO.md` · `docs/cli/**` · 两产品树 · 核树 · prompts。
3. **不 commit · 不发起评审**（发起权 = 用户）。
4. **不替他线修机检红面**（VSC 批 5 自产 6+3 条——登记上报）。

#### 七、三方条目一致

**本段条目（0 档实迁 + 台账转形态登记 15 行 + 批 6a/6b 收正）= 迁移台账 §2.1 / §2.2「后续批」15 行的动作列更新（判栏不变）= 需求档既有条目回指**（`docs/core/requirements/DOC-SYSTEM.md` FR1–FR8 / N1–N4）；本批**不新增需求条目、无范围增减**（实迁为 0——全部命中「不抢」纪律，留待下一批以「并入既有」形态落地）。

### 尾部真批 · 断点续作 + 收口（2026-09-15 · eng-designer · 段作者 = 本角色）

**目标**：把迁移台账 §2 判为「后续批」的 15 档（设计 5 / 需求 10）以「并入既有 / 纯新建」形态落地并清零台账——本轮 = **断点续作**：前轮子代理（SSE idle 120s 断流）已落笔 15 档的主体但未经审计、未更新台账、未写 §2；本轮对**全量（含前任部分）逐档审计 → 就地补完 → 台账收口**。
**判据依据**：`docs/core/design/DOC-SYSTEM.md` §5.1（P1–P5）· §4 · §6——判据句住该档，本段不重述（D2）。
**两条已定裁定（直接执行）**：① req/VERIFY-REDESIGN 并入**同名根档**（原登记「并入 `req/TOOLS.md`」作废——当年登记时同名档不存在）；② req/PROJECT 按其档头自注「迁入时对账合并」执行。

#### 一、前任部分落笔审计结论（当自己的交付核）

逐档核对 15 档工作树内容 ⇄ CLI 树旧档全文（三类逐节闭合：已有 / 并入 / 不并）：

- **完整闭合 13 档**：design 全 5 档（ESCALATE · SEND-STALL-DISTILL · TURN-CAP-CONTINUE · MULTI-INSTANCE-COLLAB · SETTINGS-TOOL）+ req 8 档（AGENT-PARAMS · DESIGN-TOKEN-SETTLEMENT · ENG-TOKEN-BINDING · MULTI-INSTANCE-COLLAB · NORMAL-MODE · PROJECT · SETTINGS-TOOL · STRUCTURE-DEBT）——并入内容、不并登记、档头收正、变更记录均在场。
- **断点面两档（PORTABILITY / VERIFY-REDESIGN）重点核**：两档**主体均完整**（断流发生在写入之后——PORTABILITY §5 接受方向表 + FR14 落实文本逐字在场；VERIFY-REDESIGN 对账与落点裁定注记在场）。PORTABILITY 缺一登记行（下表）。
- **补完项（本轮就地修——一致性面，10 处）**：
  ① 域一悬空锚 5 处（全在 15 档内——机检实跑暴露）：ESCALATE:151 `T-R17*` 用例号形态 → 改写「R17 系用例编号」（CASE_RE 避让）；MIC:75 / SETTINGS-TOOL:99 / AGENT-PARAMS:59 三处裸 basename 坐标 → 全路径化；PROJECT:148 旧树路径 `docs/design/REQUIREMENTS.md` 引文 → 去路径化（「自旧树设计档迁入」）。
  ② 超宽行 1 处：req/SETTINGS-TOOL §4 收正行（330 字符 · 非表格行）→ 纯折行（零文本变更）。
  ③ V1 段引用 1 处：req/NORMAL-MODE:136 对 PROJECT.md 的旧节号引用（该节已随并入重排为 §5.5）→ 改写为「PROJECT.md 产品定性节」。
  ④ 不并登记缺行 2 处：PORTABILITY §6.1 补「旧档 §3 尾注（建档语境）」；PROJECT §6.1 补「旧档 §3.1 渠道枚举（DeepSeek/Kimi/GLM/Qwen/MiniMax——易漂移时点枚举不并，定性句保留）」。
  ⑤ 行数口径收正 3 处：TURN-CAP-CONTINUE §7「约165→155」· design/SETTINGS-TOOL §7「约130→140」· design/MIC §11「约200→221」（实测口径 = split("\n").length）。

#### 二、15 档逐档对账表（N = 已有 K + 并入 L + 不并 M——逐档闭合）

**设计侧（5 档）**

| # | 档（源行数 → 落点行数） | 已有 K | 并入 L | 不并 M（登记处） | 闭合 |
|---|---|---|---|---|---|
| 1 | design/ESCALATE（82 → 177） | 术语 / 需求定位 / 候选池 / 契约 / async 机制 / D-E1–D-E10 / VSC 接线 | relay 前缀双端异形（§4）· 撞墙继续 CLI 通道 + Stop 传播（§5）· CLI 接线 5 行坐标（§6）· D-E11 / D-E12 | 状态行 · jsonc 示例 · 受影响文件表 · 跨仓用例编号 · 变更流水（§8.1） | ✓ |
| 2 | design/SEND-STALL-DISTILL（55 → 155） | 问题陈述 / 时序 §2.1–§2.5 / VSC 接线 / 决策 | CLI 保存回调（§2.3）· §2.6 退出 flush · §3 坐标两行按实装收正 | 状态行 · 内嵌代码块 · 验收清单 · 变更流水（§5.1） | ✓ |
| 3 | design/TURN-CAP-CONTINUE（100 → 155） | 统一语义 6 条 / 四执行体表 / 双端坐标 / §4 跨段累计 / D-TC1–D-TC7 | `TURN_CAP_MARK` 单源（§1#3）· CLI 继续通道段（§2）· §3.1 六行坐标 · D-TC8–D-TC11 | 状态行 · §19 批次材料 · 跨仓登记行指针 · 变更流水（§6.1） | ✓ |
| 4 | design/MULTI-INSTANCE-COLLAB（139 → 221 · **新建**） | —（根层无档） | §1–§7 全机制面（四分类 / L1 / L2 / L3 / F4 / F5 / 坐标 / D-MI1–D-MI8） | 状态行 · 用例编号集 · 受影响文件表 · 变更流水（§10.1）· VSC 实现坐标（§10.2 · P2） | ✓ |
| 5 | design/SETTINGS-TOOL（223 → 140 · **新建**） | —（根层无档） | §1–§4（注册 / 寻址 / 热应用 / 遮罩 / parseValue / 形状表 / 输出契约 / VSC 镜像原则 / 无静默论证）· D-ST1–D-ST12 · 边界 · 坐标 | 状态行 · T-S1 历史声称表 · T-S2 编号集 · AC 清单 · 逐字文案稿 · §8.1/§8.2/§8.4 批次材料 · §9 裁定材料 · 受影响文件表 ×2 · 变更流水（§6.1——④ 补登记） | ✓ |

**需求侧（10 档——全并入 VSC 批 4 / 批 5 同名根档）**

| # | 档（源行数 → 落点行数） | 已有 K | 并入 L | 不并 M（登记处） | 闭合 |
|---|---|---|---|---|---|
| 6 | req/AGENT-PARAMS（26 → 82） | FR1–FR3 / N1–N4 ⇒ F-AP1–F-AP4 / N-AP1–N-AP4 **全覆** | 零新增（对账销项） | 状态行 · 现码核对旧坐标 · 30 硬帽时点注 · 变更流水（§5.1——① 已修裸坐标） | ✓ |
| 7 | req/DESIGN-TOKEN-SETTLEMENT（4 → 85） | R1–R4 ⇒ F-D1 / F-D4+F-D5 / N-D3 / N-D1 **全覆** | 零新增 + §4 对位句更新 | 头注 · R2「用户选 B」括注（§6.1） | ✓ |
| 8 | req/ENG-TOKEN-BINDING（28 → 86） | 头注裁定块 / §1 / FR1–FR5·FR7 / N1–N4 **全覆**（编号承旧档） | 零新增；**旧 FR6 口径陈旧**（「pass 分支后签发」⇄ 现行 echo 机制）按现状收正并登记 | 状态行 · N1 旧措辞 · 变更流水（§5.1） | ✓ |
| 9 | req/MULTI-INSTANCE-COLLAB（43 → 91） | F1–F5 / N1–N4 ⇒ F-MI1–F-MI5 / N-MI1–N-MI5 **全覆** | 零新增 + 档头补设计侧指针 | 头注 · §1 实况叙述（§5.1）· §2 外部写感知 F6/N5/N6（§5.2 · P2 ⇒ VSC 轮） | ✓ |
| 10 | req/NORMAL-MODE（53 → 161） | —（CLI 档与装配面**不同题**） | **全量并入 §5–§6**：定性 / 总体 / F1–F10 / N1–N10 / 边界 / 开放项 / F-N1.1–F-N1.6（F7 按现行四值裁决表落笔） | 头注 · 批序旧节号 · F7 三值旧措辞（§7.1——③ 已修 V1 引用） | ✓ |
| 11 | req/PORTABILITY（30 → 124） | §1–§4（VSC 面）；FR10–FR15 正文 = `ENGINEERING-MODE.md` §2（指针不重述——D2） | **§5**：接受方向表（逐字）+ FR14 落实文本（推进档位契约）+ §5.3 边界（搬迁归位 = 父侧裁决项） | 头注 · §2 引言行 · §4 缺陷覆盖面 + §5 批次二镜像面 · §3 尾注（④ 补登记）· 变更流水（§6.1） | ✓ |
| 12 | req/PROJECT（72 → 175） | §1–§4（跨产品契约面） | **§5 产品级定性面全量**（品类 / 用户 / C1–C5 / 产品边界 / 定位坐标 / 两种工作模式 / 总体需求与 v1 范围 / v2 团队记忆与已细化决策 / 技术约束九项 / 质量约束四条）——按档头自注对账合并（裁定②） | 头注 · 旧树指针（§6.1——① 已修路径引文）· §3.1 渠道枚举（④ 补登记） | ✓ |
| 13 | req/SETTINGS-TOOL（18 → 92） | F-ST1–F-ST6 / N-ST1–N-ST4 | F-ST7（值解析去引号裁定）· F-ST2 热应用细节 · F-ST4 无静默集合相等判据 · N-ST5 / N-ST6 · CLI 边界族 · 持久性边界；**§4 错误边界行按双端实装收正**（「已知键之外一律拒绝」与实装相反——证据双端 `:128` / `:135` + 描述句） | 头注 · N-S1.3 陈旧口径（收正为 N-ST5）· VSC 跨仓引例（§5.1——② 已修超宽行） | ✓ |
| 14 | req/STRUCTURE-DEBT（19 → 82） | F1–F4 / N1–N5 ⇒ F-SD1–F-SD4 / N-SD1–N-SD5 **全覆** | 零新增；旧 N5 双树口径确认为合并前措辞（台账标注的随迁收正项销项） | 头注 · 旧 N5 作废句 · 旧 F3（§5.1） | ✓ |
| 15 | req/VERIFY-REDESIGN（9 → 76） | 总体段 / 四条用户故事 ⇒ F1–F3 / 非功能三条 ⇒ N1–N3 **全覆**（编号承旧档） | 零新增 + **落点裁定落档**（裁定①——并入同名根档） | 头注（含「终验收待核销」状态行 = 台账面事项，已上报——§5.1） | ✓ |

#### 三、台账收口（`docs/core/design/DOC-MIGRATION.md`）

| 项 | 改前 | 改后 |
|---|---|---|
| §2.1 五行（第 17 / 24 / 32 / 34 / 44 行） | 后续批 | **本批迁**（逐行补实核依据 + 落点） |
| §2.2 十行（第 4 / 10 / 11 / 18 / 19 / 21 / 22 / 27 / 28 / 37 行） | 后续批（#37 落点两读待裁） | **本批迁**（#37 按裁定①落同名根档；#22 按档头自注对账合并） |
| §5 小计「本批迁」 | 设计 29 / 需求 20 = **49** | 设计 34 / 需求 30 = **64** |
| §5 小计「后续批」 | 设计 5 / 需求 10 = **15** | **0 / 0 = 0**（清零） |
| §5 闭合校验 | 49+16+0+4+0+15 = 84 | **64+16+0+4+0+0 = 84** ✓（设计 34+9+0+4+0+0=47 ✓ · 需求 30+7+0+0+0+0=37 ✓——双向闭合） |
| §5 口径行 | 第 1–6 批 = 49 | 第 1–6 批 + **尾部真批 15 = 64** |
| §6 批 6a / 6b 行 | 转形态 / 待裁 | **已落（2026-09-15 尾部真批）**；批 7 残留行销项（待核 9 档第 2 批已裁定实迁）；标题 15 → **0** |
| §1 根层基准档数 | 17 + 17（建档时点，已陈旧） | **50 + 37**（现状实核——一致性收正） |
| §8 体量 | 218 行 | **226 行**（本批实核） |
| 变更记录 | — | +1 条（断点续作事实 + 逐批翻转 + 补完清单 + 三闸读数） |

#### 四、受影响文件（R24a · 实核）

| # | 档 | 动作 | 行数（实测） |
|---|---|---|---|
| 1–3 | `docs/core/design/{ESCALATE,SEND-STALL-DISTILL,TURN-CAP-CONTINUE}.md` | 并入既有（前任落笔 + 本轮审计修补 3 处） | 177 / 155 / 155 |
| 4–5 | `docs/core/design/{MULTI-INSTANCE-COLLAB,SETTINGS-TOOL}.md` | 新建（前任落笔 + 本轮修补 3 处） | 221 / 140 |
| 6–15 | `docs/core/requirements/{AGENT-PARAMS,DESIGN-TOKEN-SETTLEMENT,ENG-TOKEN-BINDING,MULTI-INSTANCE-COLLAB,NORMAL-MODE,PORTABILITY,PROJECT,SETTINGS-TOOL,STRUCTURE-DEBT,VERIFY-REDESIGN}.md` | 并入既有（前任落笔 + 本轮修补 5 处） | 82 / 85 / 86 / 91 / 161 / 124 / 175 / 92 / 82 / 76 |
| 16 | `docs/core/design/DOC-MIGRATION.md` | 台账收口（218 → 226） | 226 |
| 17 | 本批次档 §2 | append 本段（不改 §1） | — |
| — | `thincoder-cli/docs/**`（84 档）· `scripts/**` · `docs/TODO.md` · `docs/README.md` · `docs/cli/**` · `docs/vsc/**` · 两产品树 · 核树 · prompts · PROVIDER 两档 · 陌生批次档 · COMPETITIVE_ANALYSIS.md | **零写入**（实核 `git status`） | 0 |

**逐档 ≤500 ✓（最大 226）**；全部 ≤300 ⇒ 无拆分规划义务。

#### 五、验收读数（as-of 2026-09-15 本轮实测 · 修补后复跑）

| # | 验收标准 | 读数 | 判 |
|---|---|---|---|
| G1 | `node scripts/doc-anchors.mjs --domain .` 域一悬空 | **OK(V5): 0 条悬空锚**（125 档 · 闸态）——修补前 FAIL 5（全在 15 档内）→ 修补后归零。CLI 域 FAIL 1 = 既有（`thincoder-cli/docs/design/TWO-REPO-MERGE.md:404`——前批已登记，非本批写域）；VSC 域 21 处报告态（非阻断） | ✓（本批供给 0） |
| G2 | `node scripts/check-doc-width.mjs` | **OK(宽度)**：402 文件 0 行 >300 字符 · 一致性 V1/V2/V3 **新增违规 0** · 存量 0——修补前 FAIL 2（超宽 1 + V1 引用 1，全在 15 档内）→ 修补后归零 | ✓（本批新增 0） |
| G3 | `node scripts/check-ledger.mjs` | 两档 OK · **0 处违规** · 基线 0 条 · exit 0 | ✓ |
| G4 | 台账小计闭合 | 64+16+0+4+0+0 = 84 ✓（设计 47 / 需求 37 双向闭合；后续批 **0**） | ✓ |
| G5 | 逐档 ≤500 + 三层形态 | 16 档逐档 ≤226；各档含不并登记节；无状态行 / 无逐批流水入正文 | ✓ |
| G6 | `git status` 本批 ⊆ 写域 | 本批 = 15 档 + 台账 + 本段；其余改动（PROVIDER 两档 · `docs/TODO.md` · `thincoder-core/model-specs.mjs` + 其测试 · `2026-09-15-DEEPSEEK-QWENPLAN.md` · `COMPETITIVE_ANALYSIS.md`）全为他线在写——本角色**零触碰** | ✓ |

#### 六、未决与打回（不静默处置）

| # | 项 | 归属 / 处置 |
|---|---|---|
| 1 | req/VERIFY-REDESIGN 旧档状态行「已实现（**终验收待核销**）」 | **台账面事项**——归父侧 `docs/TODO.md` 核销面；需求档不承载（§5.1 已登记，本段上报） |
| 2 | req/PORTABILITY §5.3：FR10–FR15 正文是否自 `ENGINEERING-MODE.md` §2 **搬迁归位**入 PORTABILITY 档 | **父侧裁决项**（随档并入的既有登记）——未裁决前以 `ENGINEERING-MODE.md` §2 为权威正文 |
| 3 | req/NORMAL-MODE §5.5 开放项两条（提示词双向核对 / 可机械化保障划界） | 随档并入的既有开放项——保持开放（非本批可决） |
| 4 | 他线（DeepSeek 渠道名批）在写：`docs/core/{design,requirements}/PROVIDER.md` · `docs/TODO.md` · `thincoder-core/model-specs.mjs`（+ 新建测试档）· `docs/batches/2026-09-15-DEEPSEEK-QWENPLAN.md`；用户在写 `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md` | 他线 / 用户——本角色**零触碰**；其机检红面（若有）不归本批 |
| 5 | req/MULTI-INSTANCE-COLLAB 的 F-MI 判定句证据坐标仅引 VSC 路径（VSC 批 4 落笔形态） | 观察项——CLI 侧实现坐标已由本批新建的设计档承载；需求层补 CLI 侧证据坐标 = 后续润饰（不阻断） |
| 6 | req/SETTINGS-TOOL 的 N-S1.5（护栏表防漂移完备性锁）未单列需求条目 | 观察项——机制判据由 `docs/core/design/SETTINGS-TOOL.md` §2.6 完备性机械锁承载（设计层在档，不阻断） |
| 7 | §8.1 两处「按现状收正」（req/ENG-TOKEN-BINDING FR6 口径 · req/SETTINGS-TOOL §4 边界行——均与实装相反） | **一致性面判定**（文档 ⇄ 实现对齐——同类判例 = 第 3 批 PROXY §TLS），已逐条登记各档 §5.1 + 变更记录；**若父侧判为语义面 ⇒ 请打回**（两处均可独立单行 revert） |

#### 七、边界（本批不做）

1. **`thincoder-cli/docs/**` 一字不改**（B 式只读参照——实核 `git status` 零改动）。
2. **不动 `scripts/**`**（机检复跑只读）；不动 `docs/cli/**` / `docs/vsc/**` / 两产品树 / 核树 / prompts / `docs/TODO.md` / `docs/README.md`。
3. **不碰他线在写档**（PROVIDER 两档 / DEEPSEEK-QWENPLAN 批次档 / model-specs / COMPETITIVE_ANALYSIS）。
4. **不 commit · 不发起评审**（发起权 = 用户）。
5. 不改旧档已知错误（旧档只读——语义在落点档按现状收正并逐条登记）。

#### 八、三方条目一致

**本段条目（15 档并入 / 新建 + 台账收口）= 迁移台账 §2.1 第 17 / 24 / 32 / 34 / 44 行 + §2.2 第 4 / 10 / 11 / 18 / 19 / 21 / 22 / 27 / 28 / 37 行（本批迁栏——「后续批」清零）= 需求档既有条目回指**（`docs/core/requirements/DOC-SYSTEM.md` FR1–FR8 / N1–N4）；本批**不新增需求条目、无范围增减**（两条裁定 = 落点执行，非新范围）。

## §3 评审发现（评审子代理）

> **§3（父侧代写 · 打标——免设独立轮，承批 11 设计 §9.1）**：本批正文主体已吸收入基准层；收口由批 11 MIGRATION-WRAPUP 统一执行（设计评审 = 批 11 轮 1 changes-required → 轮 2 pass）；本批无独立设计评审轮。

## §4 父侧核验与裁决（主 agent）

> **§4 收口裁定（主 agent · 2026-09-16）**：口径 = **「已吸收 ＋ 尾巴移交批 11」**——正文不回改；未落尾巴逐条移交批 11 §9.3 权威表（CLI 7 条：A10 / A20 / A21 / A22 / A23 / A24 / A27）。判词：批 11 实施轮已落 A20（`DOC-DISCIPLINE.md:426` 追加条）· A21（`docs/README.md:65` 补登 27 档——双向等式 `49 0` / `0`）；其余 5 条逐条登记（落点 / 触发·到期见批 11 §9.3）。

## §5 实施记录（eng-coder）

> （占位回收——本段已有实施记录，见下。）

### 三件尾活收口（2026-09-15 · eng-coder · 段作者 = 本角色）

**任务**（父侧派单 · 收尾轮）：① 修 5 行「扫描域常量钉死」断言（CLI 真红）；② 两批次档超宽行**纯折行**；③ `docs/README.md` 地图补登记。
**写域** = 4 档 test + `docs/batches/2026-09-15-vsc-doc-migration.md` + `docs/README.md` + 本段（6 档 + 本段）；**未 commit · 未发起评审**（发起权 = 用户）。

#### 一、① 5 行断言（改前 → 改后 · 逐处选定 (a)/(b) 及理由）

| # | 位置（档:行） | 改前 | 改后 | 选定 |
|---|---|---|---|---|
| 1 | `thincoder-cli/test/doc-anchors.test.mjs:263`（T-V5-16 ①） | `deepStrictEqual(SCAN_DIRS, [三元素])` | `deepStrictEqual(SCAN_DIRS, [九元素])`（消息改「九元素逐字全等 · D3」） | **(b)** |
| 2 | 同档 `:190`（T-V5-8） | `deepStrictEqual(V5_SCAN_DIRS, [两元素])` | `deepStrictEqual(V5_SCAN_DIRS, SCAN_DIRS.filter((d) => d !== "docs/batches"))` | **(a)** |
| 3 | `thincoder-cli/test/doc-consistency.test.mjs:174`（T41 ⑤） | `deepStrictEqual(SCAN_DIRS, [三元素])` | 三基线域 `includes` + 无重复（关系式） | **(a)** |
| 4 | `thincoder-cli/test/ledger.test.mjs:101`（T71②） | 同上 | 同上（并注 AC51 子句 1） | **(a)** |
| 5 | `thincoder-vscode/test/doc-consistency.test.mjs:195`（T64） | 同上 | 同上 | **(a)** |

**逐处理由（先实核后判定）**：

- **#1 取 (b)**：设计档**明文要求逐字快照**——`thincoder-cli/docs/design/ENGINEERING-MODE.md:2486`「AC-V5-16 …… `SCAN_DIRS` 三元素逐字不变」· `:2694`「T-V5-16 …… ① `SCAN_DIRS` 断言（import——逐字三元素全等）」。结构式改写 = 偏离设计声明形态，而设计档在写域外、无法同批同步 ⇒ 只按新值更新（D3：计数与列表同改）。
- **#2/#3/#4/#5 取 (a)**：这四行**设计档未声明逐字快照**（T-V5-8 / T41⑤ / T71② / T64 的设计行只述语义 = 基线零改 / 扫描域零违规 / 两域互不侵入 / 接线），钉死系实现期自加；其声明意图是**可机判属性** ⇒ 按属性断言（基线三域在 + 无重复）。
- **#2 另取关系式**（V5 域 = 宽度域 − 批档面）：因 `V5_SCAN_DIRS` 全仓无第二处钉死，仅取子集会丢覆盖守卫（内部审计发现，见 §五）。
- **残留**：#1 仍是逐字快照 ⇒ 射程再扩会再红；AC-V5-16 / T-V5-16 的「三元素」文本未同步（写域外）⇒ 见 §六 未决 1。

#### 二、② 纯折行（零文本变更）

| 档 | 折行前 | 折行后 + 自证 |
|---|---|---|
| `docs/batches/2026-09-15-vsc-doc-migration.md` | `:32` 335 · `:34` 349 · `:36` 355 字符 | 3 行折断为 6 行（166+169 / 125+224 / 173+182）；**去空白后与 HEAD 逐字节相同**（7221 = 7221 字符）；折行注落该档 `:122` |
| `docs/batches/2026-09-14-doc-migration.md` | `:85`（375）· `:255`（467）等 | **不动**——实核为**表格行**（宽度判据豁免，谓词 `isTableRow`）⇒ 判「非同型」 |

**复跑读数**：`node scripts/check-doc-width.mjs` → `OK(宽度): 扫描域全部 .md 无 >300 字符单行（355 文件）` · 宽度面归零 · exit 0。

#### 三、③ `docs/README.md` 地图补登记（按该档现有结构补三行登记）

- **§1 内容表 +1 行**：新增「部分档（CLI / VSC 面）」= `cli/{requirements,design}/` · `vsc/{requirements,design}/`（10 档 = `cli/` 2 · `vsc/` 8）。
- **§4 +1 段**：「迁移批迁入档（2026-09-15——非核心统一拆分）」= 18 档（`core/design/` 5 · `core/requirements/` 3 · `cli/` 2 · `vsc/` 8），逐档档名在行。
- **§5 +1 行**：三部分（`core/` · `cli/` · `vsc/`）不各设地图——本 README = 唯一地图（目标结构指针 = `core/design/DOC-SYSTEM.md` §4）。
- **变更记录 +1 行**（2026-09-15 地图补登记）。

18 档逐档路径经实核在位；**只登记父侧列出的 18 档**，未自行扩列（见 §六 未决 2）。

#### 四、决策透明表

| # | 决定 | 依据 / 备选 |
|---|---|---|
| D1 | 断言按「该测试原有意图」**逐处**判 (a)/(b)，不搞一刀切 | 判据 = 设计档是否声明逐字快照（见 §一）；备选 = 全 (b)（不改形态但留钉死类）/ 全 (a)（改形态但偏离 AC-V5-16）——均否决 |
| D2 | 判定 `2026-09-14-doc-migration.md` 的 >300 行「非同型」 | 宽度判据表格行豁免（实核谓词 `isTableRow`，非估计）⇒ 不折行 |
| D3 | 折行**只插换行**、不动字词；折行注一行 | 父侧令「零文本变更」；自证 = 去空白逐字节相同（已实测） |
| D4 | README 只登记父侧列举的 18 档 | 任务书列举为准；`docs/core/design/` 另有 12 档（工具族 6 + 机制小档 6）未在被列清单内 ⇒ 登记为未决 2（不自行扩列） |

#### 五、审计与代码评审轮次与终态

- **内部审计 1 轮**（只读 explore 分歧审计 · 阻塞）：**DIVERGENT**——🟡「§5 未落笔」· 🟡「AC-V5-16 三元素未同步」· 🔵「临时产物 `.tmp-vscdom.json`」；另 4 行 QUESTION（含「`V5_SCAN_DIRS` 全仓无第二处钉死 ⇒ 覆盖守卫缺位」的边界）。
  **自修（本轮内）**：临时产物已删（零残留）· #2 断言升级为**关系式**（补回覆盖守卫）· 折行注补「**折行前**编号」限定 · §5 = 本段。
- **advisor 代码评审 1 轮**（`type=code` · 阻塞）：**pass**——0 🔴 · 5 🟡 · 3 🔵（含「#1 逐字快照与其余四行口径不一」「AC 文本滞后」「`:190` 守卫只住 slow 例」「README 悬空自指『本节 §11』」「地图漏登 12 档」「折行注落 §2」「旧读数与折行注并置」「§3 待迁行与 §4 新登记并置」）。
- **修复轮 0**（无 🔴）：域内唯一 🟡 已就地修——README 悬空自指改为明指 `core/design/DOC-SYSTEM.md` §11；余下各条按「写域外 / 越出『修 5 处』授权 / 口径待裁」三类**如实登记**，见 §六。
- **终态 = clean**（本写域内：审计 1 轮 + 评审 1 轮，逐条已落地或登记；无阻塞项）。

#### 六、未决与打回（不静默处置）

| # | 项 | 归属 / 处置 |
|---|---|---|
| 1 | AC-V5-16 / T-V5-16 的「三元素」文本与实装九元素不符（`thincoder-cli/docs/design/ENGINEERING-MODE.md:2486` / `:2694`）——本交付 #1 正按该 AC 行事 | **写域外**（`thincoder-cli/docs/**` 禁改）⇒ 请父侧 / designer 同步文本（或标 as-of 并指向批次档读数） |
| 2 | 地图未登 `docs/core/design/` 的另 12 档（工具族 6 + 机制小档 6；同一迁移轮新建） | **父侧裁**——任务书只列 18 档，本交付照列；补登 or 在 §4 明写「族档归 `core/design/DOC-MIGRATION.md`」边界 |
| 3 | VSC 全量红 1 例：`thincoder-vscode/test/doc-anchors.test.mjs:173`（T-DC6②「清账收口…零命中」；VSC 域报告态命中 21 · distinct 13） | **非本交付写域**（既有红；VSC 批 §2 ⑦④ 已登「产品树旧档随树降格批处置」）⇒ 读数如实上报（VSC 全量 621 pass / 1 fail） |
| 4 | `:190` 的域关系守卫仍住 `slow()` 例（`npm test` 不跑） | 原断言本就在该例（非本次引入）；补入快层属「修 5 行」之外 ⇒ 待父侧点头 |
| 5 | `docs/batches/2026-09-15-vsc-doc-migration.md` 的旧读数（宽度闸「常红」）与折行注并置 | 该档 §2 = 他作者段，本交付只获「纯折行 + 一行注」授权 ⇒ 余下标记由父侧 / designer 落 |

#### 七、验收读数（原样 · 本交付实跑）

| 项 | 读数 | 判 |
|---|---|---|
| `cd thincoder-cli && npm test` | pass 552 · fail **0** · skipped 57 | ✓ |
| `cd thincoder-cli && npm run test:full` | pass 609 · fail **0** · skipped 0 | ✓ |
| `cd thincoder-vscode && npm test` | pass 581 · fail **0** · skipped 41 | ✓ |
| `cd thincoder-vscode && npm run test:full` | pass 621 · fail **1**（既有红，见 §六 未决 3） | ⚠ |
| `node scripts/doc-anchors.mjs` | 根域 79 档 悬空 0 `OK(V5)` · CLI 域 99 档 悬空 0 `OK(V5)` · exit 0 | ✓ |
| `node scripts/check-doc-width.mjs` | `OK(宽度)…（355 文件）` · 一致性新增 0 · exit 0 | ✓ |
| `node scripts/check-ledger.mjs` | 两档 OK · 0 处违规 · 基线 0 条 · exit 0 | ✓ |

**同类扫描结论**：全仓再扫「扫描域常量钉死」类断言——除本交付 5 行外**无其他实例**（两产品 test 树 `SCAN_DIRS` / `V5_SCAN_DIRS` 只此 5 处消费）；**仓外 1 处**：`d:\teamcode\thincoder-vscode\test\doc-consistency.test.mjs:169`（合并前独立仓副本，非本仓写域）——列表上报，未动。

## §6 收口与核销（父代理）

> **§6 收口判词：已收口 2026-09-16**（按 L4——§6 非空 + 状态行；口径 = 已吸收 ＋ 尾巴移交批 11）。
> **三机检读数行（批 11 实施轮 as-of 复跑）**：锚 = 根域悬空 3（批 9 拟新增前向引用 · 非本批）+ 参照面腿 0；宽度 = 5 文件 12 行（他批 / 段面，归作者折行）；台账 = 0 违规。
> **尾巴指针表（CLI 7 条 → 批 11 §9.3）**：A10 → 登记＋归批 · A20 → 已落（`DOC-DISCIPLINE.md:426`）· A21 → 已落（`README:65`）· A22 → 归批（测试面）· A23 → 登记 · A24 → 主 agent 裁 · A27 → 主 agent 裁。
> **状态行**：**已收口 2026-09-16**（整档冻结——正文不回改）。
