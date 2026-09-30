# 2026-09-30 · 内存库家族（memory.db 1.65G：索引裁面 ∥ 出 UI 路径 ∥ 体积护栏）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 用户 2026-09-29 23:56 实报（假死 2.9G）+ 09-18 同族先例；2026-09-30 00:1x「能开批的都开」令点火（台账 #693）。
> 台账 = #693（内存库家族 · 归批）。前情 = docs/batches/2026-09-18-tui-freeze.md（同族先例 · 已收口）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-30
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与点火

- 用户 2026-09-29 23:56 实报假死（2.9G）→ 父侧取证；**同族先例 = `docs/batches/2026-09-18-tui-freeze.md`**（2.80G + WAL 587MB + `DatabaseSync`）。2026-09-30 00:1x 用户令「能开批的都开」点火。
- **本批边界**：本夜 23:24-23:29 冻结案经定性 = 渲染侧主导（#694 另批同刻在跑）——**本批 = memory.db 家族本体**（潜伏面：同步 IO 走 UI 路径时冻主进程）。

### 1.2 事实（父侧实读 · 2026-09-30 00:0x）

- `C:\Users\liwei\.thincoder\memory.db` = **1684 MiB**（page_count 431,070 × 4k）；**freelist 仅 3MB ⇒ VACUUM 零收益**（胖 = 内容，非空洞）。
- 成分：`code_chunks` **84,761** + `doc_chunks` **77,629**（**全部带 embedding 向量**）+ FTS 四族；entries 29 ∕ files 13（个人记忆非大头）；origin 单值 = `D:/teamcode`（全工作区，含参考系项目）。
- 访问面 = `node:sqlite` **DatabaseSync（同步 API）**：`memory/schema.mjs:63`（开库）· `core.mjs` `scanVectors`（向量全扫）· `agent/setup.mjs:99/:111`（buildSummary ∕ `COUNT(doc_chunks)`）· `code-sync` ∕ `docs` 同步链；维护面 `memory/sweep.mjs`（备份 ∕ 剪枝）在册。
- 修法面（台账 #693）：① 索引内容裁面（参考系项目是否该全量入索引 ∕ sweep 剪枝）② 大库操作出 UI 路径 ∕ 让渡式分片 ③ 库体积上限 + 增量维护策略。

### 1.3 口径

- **出界**：#694（渲染侧堆案）；不做 UI 观感改动；不动 150 窗族。
- **禁**：未经用户确认的破坏性数据操作（VACUUM ∕ 剪枝 ∕ 迁移——先设计 + 批准；备份机制在册且必须先行）。

### 1.9 授权（用户 2026-09-30 00:14 · 会话级 · 同文已录各在途批）

用户原话：「**后续这些任务你自动跑**。」射程 = 本批全链：设计评审点火 ∕ §4 代签 ∕ 修正轮与实施轮派发 ∕ 收口核销提交——父侧全自动执行，不必逐次请点。自缚三条：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 需新范围（射程外条目点火）或用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性 ∕ 不可逆动作先停（本批含数据 ops 面——剪枝 ∕ 迁移执行前仍先停）。

### 1.10 修正轮上抛裁定（2026-09-30 00:5x · 父侧）

- **上抛①（P1 端面渲染）**：**非本批**——四档判定「零改」维持（兑现面 = 核出口回执）；端面消费（`dbBytes` ∕ 逐 origin 上屏）另轮 ⇒ 台账 **#697** 立行。
- **上抛②（拆分判据口径）**：**维持已落口径**（Δ 背板 + 先拆后改触发条件 + 软线窗口）——300 = 建议线（AGENTS.md 口径），500 = 硬限；ipc.mjs 先例系「结构性触碰批」的主动拆分，非「过 300 必拆」规则。§2.4 越线六档不改判。

### 1.11 复评轮上抛裁定（父侧 · 2026-09-30 02:0x）

- **① 四处旧行物理清行**：**维持零清行**——批档 = 记录面（回改违反记录面不回改原则；append-only 机制 + §2.13 作废令 = 评审轮 2 发现 1 所许退路）。点名单（T11 ∕ T16 ∕ 693 ∕ 触发 c ∕ §2.9 括注）读法以 §2.13 为准。
- **② 需求档入字**：**无需**——可观察面已在档：`docs/core/requirements/MEMORY.md:209`（F-S6 行「存量行经 `memory sweep --origin --path` 备份先行 · 干跑默认 · 写后回读剪枝」＋「真实库写 = 用户批准 + 父侧 ops」）；walk 剪枝 ∕ 收尾保护位 = 机制层守卫（设计档 §6.14）——层分正确，维持需求档零触。

### 1.12 实施轮上抛裁定（父侧 · 2026-09-30 02:3x）

- **① 嵌套 cwd 面基（设计缝）**：**裁 = 登记为边界**（§8.3 + 面① 行加限定句）——现实现比较基 = 会话 cwd 相对 `rel`；cwd = 项目根时与设计等义（主径 ∕ 全部判据腿）；cwd 深于项目根时不命中（且同名前缀可误伤 cwd 子树）。**统一基面另立台账 #700**（条件项——cwd≠根 场景触发）；本批边界 = 「语义保证 = 会话于项目根启动」。
- **② P3「开库 + 库字节读数」无落点**：**裁 = 收正 P3 措辞**——读数面 = `memoryStatus`（核出口；L-③-1 判据面已绿）；不补独立开库读数。
- **③ 随动二件**：新档 `sync-tail.mjs` 转记 §2.4（未入表——append-only 面父侧转记）；§6.14 B6 ∕ P2 行坐标漂移（`code-sync.mjs` → `sync-tail.mjs` 承接）就地收正。以上三条随「### 2.14 实施后随动轮」落（设计舱）。
- **实施验证（父侧独立复核）**：批件 **21/21**（父侧重跑 · 18.0s）；`sync-tail.mjs` 80 行全读（预算 `:35-56` ∕ 收尾保护位 `:70` 在位）；`file-walk.mjs` 剪枝双守卫 `:94 ∕ :97` 实读在位；Δ 背板零越（§5 行数表）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（initial 轮三面落定 + 修正轮 1（发现 1–7 ∕ 9–13）已落——见 §2.12；产品码零触）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 轮次与范围（initial · 设计轮 · 2026-09-30 · eng-designer）

**设计档修订（owning · 已落盘）**：`docs/core/design/MEMORY.md` —— 新增 **§6.14**（索引规模治理与大库操作面：面① 范围裁面 ∕ 面② 大库操作调用点表 B1–B9 + worker 裁定 ∕ 面③ 体积护栏 P1–P3 + 增量维护 M1–M3 + 判据腿 L-①∕②∕③ + 边界）；§7 补 **D-MEM23–D-MEM28**；§8.3 补三条；**§6.4 文件清单句收正**（「非 git 仓库返回空」⇒ walk 兜底实态——码↔档相抵，本批顺正）；变更记录一行。**本批产品码零触**（实施轮另起）。

### 2.2 覆盖条目（批次面 → 设计落点 → 判据腿）

| 批次面（§1.2 修法面） | 设计落点（MEMORY.md） | 判据腿 |
|---|---|---|
| ① 索引内容裁面（参考系是否全量入索引 ∕ sweep 剪枝） | §6.14 面 ①（判据 A/B/C + `index.excludePaths` + `isExcludedRelPath` 三起效点 + `sweep --origin --path` 存量剪枝） | L-①-1/-2/-3 |
| ② 大库操作出 UI 路径 ∕ 让渡式分片 | §6.14 面 ②（B1–B9 表 + B2/B3/B4/B6/B7 修法 + worker 裁定 = D-MEM28） | L-②-1/-2/-3/-4/-5 |
| ③ 体积上限 + 增量维护策略 | §6.14 面 ③（P1 读数 · P2 行预算 WARN/CAP · P3 触发位 · M1 per-origin 锚 · M2 gitSync `--relative` · M3 收尾让出） | L-③-1/-2/-3/-4 |

### 2.3 逐面落点（号 → file:line / 取数路径）

**面 ①（范围裁面）**

- ①-1 声明键：`thincoder-core/manifest-schema.mjs`（155 行——`DEFAULT_MANIFEST` ∕ `MANIFEST_SCHEMA` 的 `index` 子键 + 元素层校验；坐标实读 = `docs/core/design/MANIFEST.md:98 ∕ :115 ∕ :118`）；投影 = `thincoder-core/conventions.mjs:219-238`（`buildDeclaration`）+ `:272-295`（`loadProjectDeclaration`）。
- ①-2 过滤：新谓词 `isExcludedRelPath` 落 `thincoder-core/conventions.mjs`（单源）；三起效点 = `thincoder-core/memory/code-sync.mjs:140-186`（`listProjectFiles`——git 径 `:168-183` + walk 径 `:157-165`）· 同档 `:41-125`（`gitSync` diff 表 `:76-116`）· 同档 `:390-426`（`reindexFile`）。
- ①-3 存量剪枝：`thincoder-core/memory/sweep.mjs` 新增 `--path` 档（`planSweep:64-93` ∕ 写面 `applySweep:166-192` ∕ 回读 `:141-162` 同款扩展）+ CLI 解析 `thincoder-cli/src/cli/memory-command.mjs:62-102`。
- 取数路径（参考系占比）：`SELECT substr(path,1,…) top, COUNT(*) FROM code_chunks ∕ doc_chunks GROUP BY top`——本设计轮已实跑（读数 = 设计档 §6.14 病灶读数块）；**目录名清单不入码面**（用户经 manifest 声明）。

**面 ②（大库操作）**

- ②-1 B2 探针索引（v10）：`thincoder-core/memory/schema.mjs:18`（`SCHEMA_VERSION` 9→10）+ `:94-453`（`migrate` 增 v10 段）；探针调用点 `memory/core.mjs:172-177` ∕ `code-sync.mjs:353` ∕ `docs.mjs:170`（SQL 形不变——索引使计划改走 seek）。
- ②-2 B3 有界计数：`thincoder-core/agent/setup.mjs:111`。
- ②-3 B4 大纲有界：`thincoder-core/agent/setup.mjs:99` → `thincoder-core/tools/repomap.mjs:118-120`（`_buildDepGraph` 首查 `SELECT DISTINCT path FROM code_chunks`——加 origin 参 + 文件数上界）。
- ②-4 B6/M3 收尾让出：`memory/code-sync.mjs:241-246` ∕ `memory/docs.mjs:72-77`（同族 `memory/core.mjs:257-261` 随触）。
- ②-5 B7 读面零写：`memory/core.mjs:157-170`（模型键分支）· `code-sync.mjs:343-351` ∕ `docs.mjs:160-168`（同款）；维护口 = 同步尾（`code-sync.mjs:423-425` 已有 `ensureEmbeddings` 调用位）∕ `/reindex`（`thincoder-cli/src/tui/cmd-reindex.mjs`）∕ 桌面 `thincoder-desktop/src/main/index-status.mjs:49-67` ∕ VSC `thincoder-vscode/src/extension/panel-index.mjs:180-190`。
- worker 判定 = 设计档 D-MEM28（不引；升级触发 = 修复后单回合召回墙钟 ≥ 0.5 s）。

**面 ③（护栏 ∕ 增量维护）**

- ③-1 P1 读数：`thincoder-core/memory-status.mjs:29-46`（回执加 `dbBytes` + 逐 origin 行数）；消费面 = 桌面 `thincoder-desktop/src/main/settings.mjs:232` 邻域 ∕ VSC 面板（既有读数位）。
- ③-2 P2 预算：`memory/code-sync.mjs:193-254`（`codeSync` 主循环——列序钉 `rel` 字典序 + 计数 + `budgetSkipped`）∕ `memory/docs.mjs:26-85` 同款。
- ③-3 P3 触发位：同步尾（`code-sync.mjs:248-253` ∕ `docs.mjs:79-84`）+ 开库（`schema.mjs:61-72` 既有 checkpoint 位）。
- ③-4 M1 锚：`memory/code-sync.mjs:55-56`（读）· `:118-121`（推进）· `:257-268`（`markIndexedCommit` 写）。
- ③-5 M2 `--relative`：`memory/code-sync.mjs:60-62`（committed + dirty 两处 diff 调用）。

### 2.4 受影响文件表（当前行数 → 预期；硬限 500 ∕ 软线 300）

| 文件 | 现 | Δ 预期 | 变更 |
|---|---|---|---|
| `thincoder-core/memory/schema.mjs` | 453 | ≤ +30 | v10 部分索引两枚 + 常量 |
| `thincoder-core/memory/core.mjs` | 304 | ≤ +25 | 读面零写（判定 + 降级 + 可见） |
| `thincoder-core/memory/code-sync.mjs` | 426 | ≤ +60 | 排除接线 ×3 · per-origin 锚 · `--relative` · 收尾让出 · 预算 |
| `thincoder-core/memory/docs.mjs` | 419 | ≤ +35 | 收尾让出 · 预算 · 排除（经 `listProjectFiles`） |
| `thincoder-core/memory/sweep.mjs` | 232 | ≤ +60 | `--path` 档（计划 ∕ 写 ∕ 回读 ∕ 报告） |
| `thincoder-core/memory-status.mjs` | 46 | ≤ +25 | `dbBytes` + 逐 origin |
| `thincoder-core/conventions.mjs` | 295 | ≤ +25 | `excludePaths` 投影 + `isExcludedRelPath` |
| `thincoder-core/manifest-schema.mjs` | 155 | ≤ +15 | `index.excludePaths` schema ∕ 缺省 ∕ 校验 |
| `thincoder-core/agent/setup.mjs` | 256 | ≤ +12 | B3 有界计数 + B4 传 origin |
| `thincoder-core/tools/repomap.mjs` | 313 | ≤ +15 | origin 过滤 + 文件上界（**本批前已越 300 软线**——触碰即按拆分方案处理，实施轮钉死） |
| `thincoder-cli/src/cli/memory-command.mjs` | 123 | ≤ +20 | `--path` 解析 + usage |
| 设计档 `docs/core/design/MEMORY.md` | 693 | 已落 | §6.14 + §7 + §8.3 + 变更记录 |
| 设计档 `docs/core/design/MANIFEST.md` | — | ≤ +8 | `index` 子键行收正（**实施轮落**——机制未落前不写 as-built） |

### 2.5 用例表（批件 `docs/batches/2026-09-30-memory-db-family.test.mjs`——实施轮落）

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| T1 | 正常 | manifest 夹具 `index.excludePaths:["./openclaw/","refs",""]` | 投影 `["openclaw","refs"]`（L-①-1） |
| T2 | 边界 | 夹具树含 `openclaw/` 与 `openclaw-fork/`（git ∕ walk 两径） | 排除只命中 `openclaw/**`；`openclaw-fork/**` 照常（L-①-2） |
| T3 | 错误 | 夹具库 + `sweep --origin X --path openclaw` 零命中 | 零写、无备份（L-①-3） |
| T4 | 正常 | 沙箱库含目标行 | `--confirm` 后命中行 0 ∧ 非命中行不变 ∧ 备份 `integrity_check` ok（L-①-3） |
| T5 | 正常 | 夹具库（v9）空探针 | open 后 `user_version=10` ∧ 两索引在 ∧ 探针计划含 `USING INDEX`（L-②-1） |
| T6 | 边界 | 置 NULL 行 100 枚 | 探针 `LIMIT 64` 返回恰 64（L-②-1） |
| T7 | 正常 | spy 句柄驱动 `search ∕ docSearch ∕ codeSearch` | 零 `UPDATE∕INSERT∕DELETE`（L-②-4） |
| T8 | 正常 | 模型键失配夹具 | 结果 = FTS-only + 一行可见（L-②-4） |
| T9 | 边界 | stale 行 ≥ 阈值（注入计数 `yieldFn`） | 让出次数 ≥ 1（L-②-3） |
| T10 | 正常 | `memoryStatus` 夹具 | `dbBytes` = `statSync` ∧ 逐 origin 行数同值（L-③-1） |
| T11 | 边界 | 夹具 origin 超 CAP | `budgetSkipped > 0` ∧ 落库 ≤ CAP ∧ 两跑跳过集相等（L-③-2） |
| T12 | 正常 | 两仓夹具各自 sync | 两枚 per-origin 锚键互不覆盖（L-③-3） |
| T13 | 错误 | legacy 单键在 ∕ per-origin 键缺 | `gitSync` 返 null（全扫一次）（L-③-3） |
| T14 | 正常 | 夹具仓 + 子目录 origin + touch | gitSync 重索引（非删除支）∧ path 与 `codeSync` 同形（L-③-4） |
| T15 | 错误 | 仓根他处改动 | 子目录 origin 不索引（L-③-4） |
| T16 | 探针 | 预算上界 origin 夹具——单回合召回墙钟 | 读数落档（L-②-5 升级判据） |

集成面：**无新增**（本面无业务场景入口；repo 套件零新增）。批件 = 批内单元件（随批档存，不占仓库 `test/` 树）。

### 2.6 验收对照（回指）

- **AC-①**（面①）= L-①-1/-2/-3 全绿：声明可投影、过滤两径、剪枝安全三件逐条。
- **AC-②**（面②）= L-②-1/-2/-3/-4 全绿 + L-②-5 读数落档（升级触发判据）。
- **AC-③**（面③）= L-③-1/-2/-3/-4 全绿。
- **AC-总**：设计档 §6.14 在盘（已落）+ 三面各有判定与判据腿（本条即验）。
- **数据面（破坏性）**：本轮零执行——执行 = 用户批准（§4）→ 父侧 ops（备份 → 干跑 → `--confirm`）。

### 2.7 边界与不做（显式）

- 产品码零触（本轮）；**未经批准的破坏性数据操作零执行**（VACUUM ∕ 剪枝 ∕ 迁移 = 设计 + 批准后父侧 ops）。
- 不并 **#694**（渲染侧）；不做 UI 观感改动；不动 150 窗族。
- 不引入 worker（升级触发在册）；不改召回语义 ∕ FTS 通道 ∕ RRF ∕ limit；不建 ANN。
- v10 只增索引（无表结构 ∕ 行级变更）。
- 范围声明不做通配（glob ∕ regex）；行预算常量暂不可声明（§8.3 登记）。

### 2.8 上抛（2 条）

1. **需求档缺条目（须父侧笔）**：本批设计引入三条新能力面——① 索引范围声明 + 存量子树剪枝（`index.excludePaths` ∕ `sweep --path`）② 大库操作面处置（读面零写 · 探针索引 · 收尾让出 · 计数 ∕ 大纲有界）③ 体积护栏（读数 + 行预算 + per-origin 锚）。`docs/core/requirements/MEMORY.md`（§4.9 族）无对应条目 ⇒ 建议父侧按 F-S6 起编号补三条（形 = 能力 + 边界 + 判定句），保三账一致。
2. **范围裁定项（供 §4 批准面 + 父裁）**：① `index.excludePaths` 的**实际清单**（参考系五树 ∕ thin* 等——设计给判据 + 占比读数，清单 = 用户声明）；② 存量剪枝执行清单（`openclaw` 先行 ≈ 51.6% chunk 体量；`D:/dgx-spark` 系 origin 与未归一变体随扫处置）；③ `index.excludePaths` 入本批牵动 `MANIFEST.md` schema 面——若父侧要收窄射程，请在 §4 前裁。

### 2.9 三账一致声明

批次 §2 条目 = 设计档 §6.14 判据腿 =（待父侧落）需求档条目；本批 = 设计轮，产品码与数据面零动；三账一致性在父侧落需求条目后闭合（上抛 1）。

### 2.12 修正轮（评审轮 1 · 发现 1–7 ∕ 9–13）（eng-designer · 2026-09-30）

逐号处置（设计档收正已落 = `docs/core/design/MEMORY.md`，变更记录同轮 +1 行；本轮产品码零触 ∕ 需求档零触；发现 8 = 父侧已办）：

| # | 处置 | 落点 |
|---|---|---|
| 1 | B2 部分索引 DDL 收正为**可建形**（`embedding` 键列——`rowid` 不可作索引键列，实测定案）+ 预期计划读数（实测形） | 设计档 §6.14 B2 行 ∕ L-②-1 ∕ §7 D-MEM22 鉴别句 |
| 2 | 声明键规则补「首部 `./` 剥离」（归一为项目根相对形） | 设计档 §6.14 声明键件 ∕ L-①-1 |
| 3 | 越线档拆分判据（组式）+ Δ 背板 | 本节【补块 3】 |
| 4 | 点名文件逐档判定 = **零改**（依据分列） | 本节【补块 4】 |
| 5 | 用例增补 T17 ∕ T18 | 本节【补块 5】（落批件 = 实施轮） |
| 6 | P2 计数基准 ∕ 跳过语义 ∕ 处理序钉死；L-③-2 单位词收正；T11 表述收正 | 设计档 §6.14 P2 ∕ L-③-2；T11 → 本节【补块 5】 |
| 7 | L-②-5 基线 = **缺省工作集 origin**（判别形） | 设计档 §6.14 升级触发 ∕ L-②-5 ∕ §7 D-MEM28 |
| 9 | L-②-1 补预期计划读数形（实测形 + 语义断言） | 设计档 §6.14 L-②-1 |
| 10 | B3 ∕ B4 界值定值（复用 WARN = 20,000） | 设计档 §6.14 B3 ∕ B4 行 ∕ L-②-2 |
| 11 | D-MEM26 趟时口径与 26 µs ∕ 行对齐 | 设计档 §7 D-MEM26 |
| 12 | §2.4 设计档行注记撤销（.md 豁免行数注记；修正轮后实读 = 698 行，时点读数不追注） | 本节（覆盖 §2.4 该缘注记） |
| 13 | §6.13 `--origin` 句补 `--path` 组合指针 | 设计档 §6.13 |

【补块 3】越线档拆分判据（组式）+ Δ 背板（发现 3）：

- **Δ 背板（实施轮不可越 · 相对背板）**：schema ≤ +30 ∕ core ≤ +25 ∕ code-sync ≤ +60 ∕ docs ≤ +35 ∕ sweep ≤ +60 ∕ memory-status ≤ +25 ∕ conventions ≤ +25 ∕ manifest-schema ≤ +15 ∕ setup ≤ +12 ∕ repomap ≤ +15 ∕ memory-command ≤ +20——实施后 ≤ 届盘实读 + Δ；全部 ≤ 500 硬限（最高 = code-sync 426 + 60 = 486，距硬限 14 行 = 首要监面）。
- **拆分审阅（组式 · 覆盖越软线六档）**：schema（453）· code-sync（426）· docs（419）· core（304）· repomap（313）+ 本批**新增跨线** conventions（295 ⇒ ≤320）；**结论 = 背板内落地、本批不拆**，条件 = 新增面按「关注点缝」合入（单关注点最小缝合）且不越背板；组式理由 = 硬限零越 + 逐档 Δ ≤ 60。
- **先拆后改触发（任一）**：a) 实施后越 500；b) 越 Δ 背板；c) 新增职责 ≥ 2 独立关注点 ⇒ 拆分点 = 缝：schema〔v10 索引 DDL 段〕· core〔读面零写判定块〕· code-sync〔预算判定 + stale 收尾块〕· docs〔预算 + 收尾块〕· repomap〔大纲装配（origin + 上界）块——可出纯函数叶档，先例 D-MEM8〕· conventions〔声明投影 + 谓词块——同上〕。
- **软线窗口**：越线档拆分 ∕ 回落窗口 = 各档下一次功能触碰批；§5 实施记录报逐档终值行数（背板核对 + 缝记录）。

【补块 4】点名文件判定（发现 4 · 二选一落定——全部零改，依据分列）：

| 文件（点名处） | 判定 | 依据（file:line） |
|---|---|---|
| `thincoder-desktop/src/main/settings.mjs`（P1 消费面 :232 邻域） | 零改 | `indexStatus()`（`:235-242`）计数 = `readIndexCounts` → 核出口 `memoryStatus`；IPC 回执形不动 |
| `thincoder-desktop/src/main/index-status.mjs`（P1 消费面 + B6 ∕ B7 维护口） | 零改 | 读数面 `:41` ∕ `:62` 经核 `memoryStatus`；构建面 `:22` ∕ `:56` 邻域经核 `gitSync∕codeSync∕docSync`（B6 ∕ B7 ∕ P2 皆落核内） |
| `thincoder-vscode/src/extension/panel-index.mjs`（B7 维护口 + VSC 读数位） | 零改 | 构建面 `:180-188` 经核 `gitSync → codeSync ∥ docSync`（B7 维护执行随核内落）；读数面 `readIndexCounts`（`:36-41`）现状 = 端侧直读 SQL（本批不动） |
| `thincoder-cli/src/tui/cmd-reindex.mjs`（/reindex 维护口） | 零改 | 经核 `syncDir∕codeSync∕docSync`（`:7` ∕ `:26` ∕ `:33`）——B6 ∕ B7 ∕ P2 皆落核内 |

- 附：P1 兑现面 = 核出口回执（本批）；**端面渲染（新字段上屏）= 非本批**（上抛①）。

【补块 5】用例增补 + T11 收正（发现 5 ∕ 6）：

- **T17（新 · 正常）**：spy ∕ 夹具驱动 B3 ∕ B4 ⇒ B3：SQL 含 origin 绑定 + 计数有界形（`LIMIT` = WARN+1 形）——≤ WARN 回准确数 ∕ 越界回「`20000+`」；B4：文件行查询含 origin 绑定 + `LIMIT`（同形），越界（> 20,000）⇒ 提示行 ∧ 跳过大纲构建（L-②-2）。
- **T18（新 · 错误）**：manifest `index.excludePaths` 非数组形态 ⇒ 档非法（fail-closed，与 `index.*` 同款）；投影不产出（L-①-1 半条）。
- **T11 收正**：原「夹具 origin 超 CAP ⇒ `budgetSkipped > 0` ∧ 落库 ≤ CAP ∧ 两跑跳过集相等」⇒「夹具 origin 既有行数（code + doc 合计）置于 CAP 邻域 ⇒ `budgetSkipped > 0` ∧ 跳过文件零落行 ∧ 两跑跳过集逐字相等（处理序确定性）∧ WARN 行恰一」。

上抛（报告面，2 条）：① P1 端面渲染（`dbBytes` ∕ 逐 origin 行数上屏）= 非本批——如需本批上屏须扩桌面 ∕ VSC 端面（射程外，请裁）；② 拆分判据口径 = 「背板 + 触发条件 + 窗口」——若父侧口径为「过 300 必拆」（历史先例），§2.4 越线六档需改判（请裁）。

【补块 6】同轮随动收正（发现 7 连面）：

- **§2.5 T16 收正**：原「预算上界 origin 夹具——单回合召回墙钟」⇒「**缺省工作集 origin 夹具（基线同 L-②-5）**——单回合召回墙钟；预算上界档读数同落档（结构参考，非触发判别）」——与设计档 §6.14 L-②-5 基线逐字自洽；用例其余不变。
- **验收③自查（判据腿 ↔ 需求档 §4.10 现文）**：本轮判据腿修正逐条对位——F-S6 投影句（`["./openclaw/","refs",""] → ["openclaw","refs"]`：`./` 剥离已在规则内，可推导）· F-S7 两探针无 `SCAN` 句（L-②-1 断言形）· F-S8 `budgetSkipped > 0` ∧ 两跑跳过集逐字相等句（L-③-2 对位）——**逐条自洽，无须父侧笔**。

### 2.13 复评轮修正（评审轮 2 发现 1–7）（eng-designer · 2026-09-30）

承 §3 轮次 2（发现 1–7）· 父侧逐条裁定 1–7 全收。本轮产品码零触 ∕ 需求档零触 ∕ 数据面零执行；设计档收正已落 = `docs/core/design/MEMORY.md`（变更记录同轮 +1 行）。**批档面写面 = append-only 通道**（`docs/core/design/BATCH-RECORD.md:61`「append 只追加……既有行字节不变……status ∕ close 状态行单行改写 = 唯一豁免」；子代理直写批档另有写门 `:76`）⇒ **批档旧行一律不可就地改写**——以下各条 = 点名行的现行文落根；单读旧段者以本块为准。

**1 · §2.5 T11 ∕ T16 残留——所走路径 = 退路（显式作废令；就地收正不可为）**：

- **§2.5 T11（`:109`）作废**——现行文 = §2.12 补块 5「T11 收正」句（`:184`）：夹具 origin 既有行数（code + doc 合计）置于 CAP 邻域 ⇒ `budgetSkipped > 0` ∧ 跳过文件零落行 ∧ 两跑跳过集逐字相等（处理序确定性）∧ WARN 行恰一。
- **§2.5 T16（`:114`）作废**——现行文 = §2.12 补块 6「§2.5 T16 收正」句（`:190`）：缺省工作集 origin 夹具（基线同 L-②-5）——单回合召回墙钟；预算上界档读数同落档（结构参考，非触发判别）。

**2 · 三账闭合回写（发现 2）——闭合声明**：上抛 1 已落——需求档 §4.10（F-S6–F-S8 ∕ N-S4–N-S6 + 判定句）在盘（`docs/core/requirements/MEMORY.md:239` 变更记录 = 父侧笔 · 2026-09-30）。**批次 §2 条目 = 设计档 §6.14 判据腿 = 需求档 §4.10 条目——三账闭合**；§2.9 括注「（待父侧落）」按此闭合（该行字面受 append-only 面机制保留——读法以本声明为准）。

**3 · walk 径排除语义钉死 = 剪枝径（发现 3）**：实读复核可行——`thincoder-core/memory/file-walk.mjs:91`（目录展开守卫）∕ `:94`（文件守卫）= 既有守卫位，剪枝接位即成（预算 = 仅已留文件计数 `:100-103` ⇒ 排除子树零展开 = 零耗）。落点：

- 设计档 §6.14 面① 第 2 件：walk 径 = **遍历中剪枝**（排除子树不展开、不耗 `MAX_WALK_FILES` 预算）；git 径 = 列表面过滤。
- L-①-2 第 ② 半条 = 剪枝判别形；用例 = 本块 T19。
- **§2.4 追加行**：`thincoder-core/memory/file-walk.mjs` | **现行 = 109** | ≤ +15 | 排除谓词接线（目录展开 ∕ 文件守卫双位——剪枝）。〔现行 = 2026-09-30 实读；soft ∕ hard 线远离；各档 Δ 背板不变〕

**4 · 排除 ↔ 收尾 stale 交互钉死（发现 4）**：设计档 §6.14 面① 第 2 件增**收尾保护位（第四接线 · 非过滤起点）**——同步收尾 stale 删除对排除命中路径**短路**（受保护成员集：`isExcludedRelPath` 命中 ⇒ 跳删）：被排除但存在的路径之存量行不因声明删除；此类行仅经 `sweep --path` 收敛（安全三件不被同步旁路）；不引入按存在性的逐行 stat（预算零增）；缺省 `[]` ⇒ 短路恒不命中。随动 = 面① 第 3 件分工句 · B6 行 · §8.3 边界句（设计档同轮）。L-①-2 第 ④ 半条 = 声明加入后全量同步 ⇒ 排除路径存量行逐键不变；用例 = 本块 T21。批次面「三起效点 ∕ 排除接线 ×3」现读 = 过滤起点三处（不变）+ 收尾保护位（第四接线）。

**5 · L-①-2 第 ③ 半条对位（发现 5）**：L-①-2 给出断言形——`reindexFile` 对排除路径 = 零写（spy 句柄零 `INSERT` ∕ `UPDATE` ∕ `DELETE`）；用例 = 本块 T20。

**6 · §2.4 设计档行「693」注记——作废令（发现 6）**：该注记（`:92`）**作废**——该行现读 = 「已落」（.md 豁免行数注记；时点读数不追注）。

**7 · 触发 c 措辞限定（发现 7）——现行文落根**：§2.12 补块 3 触发 c 现行文（限定形）= **「单个新增职责含 ≥ 2 独立关注点（无法按单关注点最小缝合合入）」**——多面新增文件（code-sync ∕ docs 等各为单关注点、可按最小缝合合入）不触发；与同块结论条件「背板内落地、本批不拆」并读一致。

**用例增补（承发现 3 ∕ 4 ∕ 5——落批件 = 实施轮）**：

- **T19（新 · 边界）**：walk 径剪枝判别——非 git 夹具目录（全部可索引文件位于排除子树 ∧ `maxFiles` 小于其文件数）⇒ `listProjectFiles` 返回空 ∧ `truncated=false`（错程 = 后过滤：`truncated=true`——判别形）。
- **T20（新 · 正常）**：`reindexFile` 对排除路径 = 零写（spy 句柄零 `INSERT` ∕ `UPDATE` ∕ `DELETE`）。
- **T21（新 · 正常）**：夹具库含排除路径存量行 ⇒ 声明加入后全量同步 ⇒ 排除路径存量行逐键不变 ∧ 非排除 stale 行照删（收尾保护位）。

**判据腿 ↔ 需求档 §4.10 自洽自查**：F-S6「三起效点」= **过滤面**枚举——不改（walk 剪枝 = 「walk 列文件过滤」的实现形；收尾保护位 = 「存量行经 `sweep --path` 剪枝」的分工守卫，非过滤起点）；F-S6 判定句 ∕ N-S4 ∕ N-S6 零改自洽（缺省 `[]` ⇒ 短路恒不命中）。**无须父侧笔**。

### 2.14 实施后随动轮（eng-designer · 2026-09-30）

承 §5 实施回执 + §1.12 父裁——四条点修：① 新档转记；② 坐标漂移收正；③ 嵌套 cwd 边界句；④ P3 措辞收正。本轮**产品码零触** ∕ 需求档零触 ∕ 数据面零执行；设计档收正已落 = `docs/core/design/MEMORY.md`（变更记录同轮 +1 行）。批档面写面 = append-only 通道（§2.13 同款）——§2.4 补行与本轮收正记录 = 本块落根。

**① 新档转记（§2.4 补行 · 承 §5.2 拆分缝记录）**：

| 文件 | 现 | Δ 预期 | 变更 |
|---|---|---|---|
| `thincoder-core/memory/sync-tail.mjs` | —（新增） | 新档 | 拆分缝 = §2.12 补块 3 触发 b（code-sync 首装 +80 越 Δ 背板 > +60，且越 500 硬限 ⇒ 拆；拆后各档回背板内——code-sync 457 ∕ docs 436）；档内单源 = `createRowBudget`（`:35-56`——WARN ∕ CAP）∕ `sweepStaleRows`（`:65-80`——让出 + 收尾保护位），`codeSync` ∕ `docSync` 两档共用。**行数终值以 §5 表为准**（本档终值 = 80 行）。 |

**② 坐标漂移收正（设计档已落）**：§6.14 面② B6 行——现状列收尾坐标加「设计轮实读」限定，裁定列落**现体** = `memory/sync-tail.mjs` `sweepStaleRows:65-80`（两入口消费 = `code-sync.mjs:268` ∕ `docs.mjs:87`）。§6.14 面③ P2 行——追加机制现体行 = `createRowBudget:35-56` 单源（消费 = `code-sync.mjs:232` ∕ `docs.mjs:52`）。

**③ 嵌套 cwd 边界句（§1.12① 裁定 = 登记为边界；设计档已落）**：§6.14 面① 第 2 件 + §8.3「索引范围声明的边界」加限定句——「排除声明**语义保证 = 会话于项目根启动**（实装比较基 = 会话 cwd 相对 `rel`；cwd = 项目根时等义于项目根相对面 ∕ 判据腿全成立）；cwd 深于项目根 ⇒ 排除不命中 ∕ 同名前缀可误伤 cwd 子树——**统一基面 = 台账 #700**（条件项）」。

**④ P3 措辞收正（§1.12② 裁定；设计档已落）**：§6.14 P3 行——删「开库 + 库字节读数」限定；读数面 = `memoryStatus` 核出口（`dbBytes` + 逐 origin 行数——P1 面）；同步尾括号内「读数」收正为「预算判定 + `budgetSkipped` 回执」。不补独立开库读数。

**不动面**：不 re-run 评审（父侧定）；不触 §3 ∕ §5 ∕ 他批档面。设计档收正六处与本节回读复核 = 随本轮报告面。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

范围/限制：评审对象 = 批次档 §1–§6（focus §2）+ 设计档 MEMORY.md 全文（含 §6.14 / §7 / §8.3 对位）+ 需求档 MEMORY.md 全文（§4.10 = 父侧笔）。无 Document Map（ownership 按 AGENTS.md 与结构判定）· 无项目标准档声明（methodology 按 AGENTS.md 判定）；源码当前行数 ∕ 函数层不可验（射程外，unverified）。数值抽检：86.3% ∕ 87.6% ∕ 56% ∕ 51.6% 与自给读数自洽；三账覆盖（F-S6–S8 ↔ §6.14 面①②③ ↔ §2.2 映射）逐条对齐成立。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Ownership · Feasibility（机制级两处相抵） | 🔴 | §6.14 B2 的 v10 方案 = 创建部分索引 `… ON code_chunks(rowid) WHERE embedding IS NULL`（`thincoder/docs/core/design/MEMORY.md:531`，doc 表同款）；同档既存 D-MEM22 记录 = 「否决「新索引 `(origin, rowid)`」（SQLite 拒：`no such column: rowid`——rowid 不入索引表达式）」（`:595`）。同一机制（rowid 可否作索引键列）两处陈述不能同真：D-MEM22 的实读若成立，B2 索引建不出来 ⇒ L-②-1（`:559`「`sqlite_master` 含两枚部分索引」）与「探针 O(待回填)」不成立（Feasibility 硬伤）；反之 D-MEM22 的否决理由失据。SQLite 侧行为本射程内不可实跑（unverified）——两处文本相抵本身可直接判读。 | 在 B2 的 DDL 与 D-MEM22 之间做单一裁定：给出可创建的部分索引键列形（或更正 D-MEM22 的陈述），并把「可创建 DDL + 预期计划读数」写入 §6.14，L-②-1 锚到该 DDL。 |
| 2 | Acceptance criteria（规则 ↔ 判据相抵） | 🟡 | 声明键归一规则列 = 「trim 后非空串、`/` 归一、去尾斜杠、去重保序」（`:518`；L-①-1 同款重列 `:556`），但 L-①-1 夹具期望 `["./openclaw/","refs",""] ⇒ ["openclaw","refs"]`（`:556`，需求档 `:215` 同句）——按所列规则 `"./openclaw/"` 会归一为 `"./openclaw"`（首部 `./` 剥离未在规则内）；既使机检红，也使前缀命中（恰等 ∨ 后随 `/`）对 `openclaw/...` 实际不生效 ⇒ 按夹具范式声明会静默不排除。 | 规则列补「首部 `./` 剥离（归一为项目根相对形）」，使 `:518` 规则、`:556` 判据、需求档 `:215` 三处逐字自洽。 |
| 3 | Affected-file size annotations | 🟡 | 批次档 §2.4 表（`:76-88`）：① `conventions.mjs` 295 + ≤25（`:82`）⇒ 上界 320 越过 300 软线，无拆分审阅 ∕ 方案；② 已 >300 且被触碰的 `schema.mjs` 453→≤483（`:76`）· `code-sync.mjs` 426→≤486（`:78`）· `docs.mjs` 419→≤454（`:79`）· `core.mjs` 304→≤329（`:77`）· `repomap.mjs` 313→≤328（`:85`，「触碰即按拆分方案处理，实施轮钉死」= 方案未入设计）均无设计内拆分方案（规则：>300 → 主动拆分审阅）；③ 无 >500 越线（硬限未破），但 `code-sync.mjs` 上界距 500 仅 14 行。 | §2.4 增拆分方案（或按组给一份拆分判据）覆盖 conventions ∕ repomap 等越线档，并把各 Δ 上界写成实施轮不可越的背板（函数层在实施轮补核）。 |
| 4 | Clarity（受影响文件表完备性） | 🟡 | §2.3 点名的两类文件不在 §2.4 表内、也未声明零改：P1 消费面 = 桌面 `thincoder-desktop/src/main/settings.mjs:232` 邻域 ∕ VSC 面板（批次档 `:66`；设计 P1 `:545` 记「桌面索引面板 ∕ 状态行 ∕ CLI」）；B7 维护口 = `/reindex`（`thincoder-cli/src/tui/cmd-reindex.mjs`）· 桌面 `index-status.mjs:49-67` · VSC `panel-index.mjs:180-190`（批次档 `:61`）。这些端面文件是否随本批改动无判定。 | 对每个被点名文件二选一写明：零改（依据 = 经核面函数复用 ∕ 既有读数位直接消费新字段）或补入 §2.4 行（现行数 + Δ）。 |
| 5 | Acceptance criteria（用例覆盖） | 🟡 | AC-② 声明「L-②-1/-2/-3/-4 全绿」（批次档 `:116`），但 §2.5 用例表（`:92-109`）无 L-②-2 对位用例（B3 有界计数 ∕ B4 大纲上界：origin 绑定、「+」形、提示行）；L-①-1 的「非数组形态 ⇒ 档非法（fail-closed）」半条（设计 `:556`）亦无用例。 | 补两枚用例（B3 ∕ B4 接线夹具 + manifest 非法形态 fail-closed），或将两半条并入既有编号并在表内标注。 |
| 6 | Clarity（P2 计数基准） | 🟡 | P2「每 origin 行数（code + doc 合计）过 CAP ⇒ 同步跳过后列文件」（`:546`）未钉计数基准（库内既有行 ∕ 本趟落库行）与超 CAP origin 的 mtime 更新语义；单位词混用（L-③-2 记「**文件数** > CAP ∧ 落库**行数** ≤ CAP」`:565`；需求档记「**行序**确定性」`:211`；设计记「**列序** = `rel` 字典序」`:546`）。按设计自给读数 `D:/teamcode` 现 ≈147k 行（83,506 + 63,609，`:502-503`）已 > CAP ⇒ 基准不同（全冻 vs 仅停新增）行为完全不同。 | P2 钉死：计数基准、超 CAP origin 的更新语义，并统一用例 ∕ 需求侧单位词（行数 / 列序）。 |
| 7 | Acceptance criteria（触发判据基线） | 🟡 | L-②-5 ∕ 升级触发「预算上界 origin 复测——单回合召回墙钟仍 ≥ 0.5 s」（`:541` ∕ `:563`；需求档 `:210`）未写明基线 = WARN(20k) 还是 CAP(100k)。按设计自给 26 µs ∕ 行（`:530`）与「WARN 20k ≈ 0.5 s 趟」（`:546` / D-MEM26 `:600`）：20k ⇒ ≈0.52 s、100k ⇒ ≈2.6 s——两读法均在触发线之上 ⇒ 该触发近似恒真、读数是预定结论而非判别。 | 写明探针夹具的行数基线及其与 0.5 s 的期望关系（或改为对「缺省工作集 origin」的读数），使 L-②-5 可判别。 |
| 8 | Requirements（§4.10 措辞与设计腿对齐） | 🟡 | 需求档 §4.10 两处与设计腿不逐字对齐：① F-S6 判定句含「`sweep --path` 沙箱**两跑跳过集相等**」（`:215`）——设计 L-①-3（`:558`）无对位判据，「跳过集」是 P2 预算 L-③-2（`:565`）用语；② N-S6「零行为变化…**未声明项目逐字不变**」（`:213`）与同批默认面行为变化（M1 锚 per-origin 化 ⇒ 旧锚失效首扫、M2 子目录 origin 落行改变、B3 ∕ B4 越界形）相抵。 | ① F-S6 判定句改述为设计 L-①-3 的可机检形（或删该半句）；② N-S6 射程收到「就排除面与 v10 而言」，并并列本批默认面行为变化清单。 |
| 9 | Acceptance criteria（判据形） | 🔵 | L-②-1 以字面串「计划含 `USING INDEX`（无 `SCAN`）」（`:559`）作断言，设计未记录 v10 后探针的预期计划读数（B2 `:531` 只给现状 `SCAN …`）；若正确实现的部分索引访问在所用 SQLite 版本渲染为含 `SCAN` 字样的计划行（unverified——射程内不可实跑），机检会对正确实现判红。 | 补预期计划读数（先例 = §6.10 计划实读形），或把断言改为语义形（无表全扫 ∕ 走索引），使 L-②-1 与可实现计划一一对应。 |
| 10 | Clarity（常量数值） | 🔵 | B3「≤ 界值」（`:532`）与 B4「文件数上界」（`:533`）的界值无落点数值——L-②-2（`:560`）只判「+」形 ∕ 提示行形态；越界夹具的构造与机检需要该值。 | 给 B3 界值 ∕ B4 上界定值或写明复用 WARN ∕ CAP（在 §6.14 落字），使 L-②-2 可机检。 |
| 11 | Clarity（数值注记） | 🔵 | D-MEM26 记「CAP 取「1 s 趟」量级为背板」（`:600`），同格自给 26 µs ∕ 行 ⇒ 100k 行 ≈ 2.6 s，与「1 s 趟」不相称（WARN 20k ≈ 0.5 s 则自洽）。 | CAP 的趟时口径与 26 µs ∕ 行对齐（改述或改常量），消数值注记漂移。 |
| 12 | Affected-file size annotations（数值） | 🔵 | §2.4 设计档行注记现 693 行（批次档 `:87`），本评审实读全档 697 行（末行 = 变更记录，`docs/core/design/MEMORY.md:697`）。.md 豁免行数注记要求 ⇒ 注记漂移（不改判）。 | 收正该注记（或删行数只留「已落」），免后续轮次引用失准。 |
| 13 | Ownership（跨节指针） | 🔵 | §6.13 记 `--origin` 档「删除范围 = …的**全部行**」（`:487`，无修饰条件句），本批新增 `--path` 窄化档（`:520`「须与 `--origin` 同用」）后未回加组合指针 ⇒ 单读 §6.13 会得出「`--origin` 恒整档删」。 | §6.13 `--origin` 语义句尾加组合指针（`--path` 组合档见 §6.14），保同档句面一致。 |

VERDICT: changes-required
计数：🔴 1 · 🟡 7 · 🔵 5（共 13）

### 轮次 2（评审子代理）

复核轮（重发实例——前次冻结清零）：面 = 轮 1 表 1–13 + 修正轮 §2.12（含补块 3–6）逐号核验 + 设计档收正点（B2 DDL ∕ L-①-1 ∕ L-②-1/-2/-5 ∕ L-③-2 ∕ D-MEM22/26/28）。核验结论：轮 1 的 🔴=1 已消（B2 DDL 改 `embedding` 键列 `docs/core/design/MEMORY.md:531`；D-MEM22 `:595` 鉴别句同判；L-②-1 `:559` 实读形入档）；发现 2–7 ∕ 9–13 逐号对位落盘（8 = 父侧已办——需求档 `:213`/`:215` 已收正）；残留 = 本轮发现 1 ∕ 2 ∕ 6（收正只住 §2.12、原行未动）+ 新识两处机制缝（发现 3 ∕ 4）。限制：源码行数 ∕ 函数层 ∕ SQLite 实测（3.53.4 计划形 ∕ `no such column: rowid`）与端面四档零改依据 = 射程外（unverified）；无 Document Map（ownership 按 AGENTS.md 与文档结构判定）· 无项目标准档声明（methodology 按 AGENTS.md 判定）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc hygiene · Acceptance（收正残留） | 🟡 | §2.5 被收正的两行仍为原行原文：T11（`thincoder/docs/batches/2026-09-30-memory-db-family.md:109`）与 T16（同档 `:114`「预算上界 origin 夹具」）；收正后现行文只住 §2.12 补块 5 ∕ 6（`:184` ∕ `:190`）——其中 T16 旧文与设计档现行基线（`thincoder/docs/core/design/MEMORY.md:563`「夹具基线 = 缺省工作集 origin」）相抵；单读 §2.5 取材写批件会按旧文。 | 把 §2.5 的 T11 ∕ T16 两行就地收正为补块 5 ∕ 6 的现行文；若 §2 受 append-only 约束，则在该两行挂覆盖指针（以 §2.12 补块 5 ∕ 6 为准），消旧新并存。 |
| 2 | Doc-state（三账闭合未回写） | 🟡 | 需求档 §4.10（F-S6–F-S8）已落盘（`thincoder/docs/core/requirements/MEMORY.md:239` 变更记录 = 父侧笔），但批次档 §2.8 上抛 1（`thincoder/docs/batches/2026-09-30-memory-db-family.md:136`「需求档缺条目（须父侧笔）」）与 §2.9（同档 `:141`「（待父侧落）… 闭合（上抛 1）」）仍读作未闭合——与同档 §2.12 补块 6（`:191` 按「需求档 §4.10 现文」自查）自相抵。 | 追加一行三账闭合声明（上抛 1 已落 = 需求档 §4.10 F-S6–S8 在盘），或把 §2.9 待落括注收正为已闭合形态。 |
| 3 | Clarity · Feasibility（walk 径排除语义未钉死） | 🟡 | 面① 只记「起效点 = `listProjectFiles`（git ∕ walk 两径同一谓词）」（`thincoder/docs/core/design/MEMORY.md:519` ∕ 批次档 `:56`），未钉排除是遍历中剪枝还是结果后过滤；若后过滤，`MAX_WALK_FILES = 20,000` 截断仍在排除子树内触顶（同档 `:505`「任意 2 万文件切片」；walk 上界句 `:156`），非 git 主 origin 的工作集覆盖与 L-②-5 基线（`:563`）随两读法不同，且夹具 T2（批次档 `:100`）远小于 20k 上界 ⇒ 两实现皆绿、不可判别。 | 钉死 walk 径语义（建议 = 遍历中剪枝：不展开排除子树、不耗 walk 预算）；若剪枝须落 walker，把 `thincoder-core/memory/file-walk.mjs` 补入 §2.4（现行数 + Δ）；或登记「walk 上界与排除的交互」为本批不做项。 |
| 4 | Acceptance criteria（排除 ↔ 收尾 stale 交互无判据） | 🟡 | 设计明示「声明只辖未来同步；存量行收敛 = `sweep --path`（ops）」（`thincoder/docs/core/design/MEMORY.md:522` ∕ §8.3 `:643`），但未指认保证该承诺的机制点——收尾 stale 删除（B6 行 `:535`）以「枚举集外」还是「文件存在性」为判据未钉死；若按前者实现，加一条排除声明会在下趟全量同步静默剪掉存量行（绕过 `--path` 的备份 ∕ 干跑安全三件）；L-①-2（`:557`）与 T2 ∕ T3 ∕ T4 均不覆盖此面。 | 钉死收尾 stale 判据与排除面的交互（被排除但存在的路径之存量行不受声明影响），并补一条对位判据腿 ∕ 用例（声明加入后全量同步，存量行逐键不变）。 |
| 5 | Acceptance criteria（判据覆盖不全） | 🔵 | L-①-2 第三半条「`reindexFile` 对排除路径 = 零写」（`thincoder/docs/core/design/MEMORY.md:557`）在 T2 期望列（批次档 `:100`）无对位——T2 只覆盖两列文件径与 `openclaw-fork` 不吞。 | 在 T2 期望列补「单文件缝零写」半条，或增一枚单文件缝用例，使 L-①-2 三段皆有机检位。 |
| 6 | Affected-file size annotations（残留注记） | 🔵 | §2.4 设计档行仍记「693」（批次档 `:92`），修正轮处置称该注记已撤销并由 §2.12 覆盖（同档 `:159`「修正轮后实读 = 698 行」）——作废数值未删（.md 豁免行数注记，不改判）。 | 删除该行行数注记（只留「已落」）或就地标注撤销，消两处并存的失准引用面。 |
| 7 | Clarity（拆分触发 c 措辞） | 🔵 | 补块 3「先拆后改触发 c）新增职责 ≥ 2 独立关注点」（批次档 `:166`）与同块结论条件「单关注点最小缝合」（`:165`）并读时，字面可将多面新增文件（code-sync ∕ docs——§2.4 行 `:83` ∕ `:84`）判为触发 ⇒ 与「本批不拆」结论相抵。 | 把触发 c 限定为「单个新增职责含 ≥ 2 独立关注点（无法按单关注点最小缝合合入）」，消多面文件被字面触发的误读。 |

VERDICT: pass
计数：🔴 0 · 🟡 4 · 🔵 3（共 7）

## §4 用户批准（主 agent）

**已批准（代签 · 承用户 2026-09-30 00:14 会话级授权）**
- 条件① 评审通过：§3 轮次 1 = changes-required → 修正后复核 轮次 2 = pass（0🔴）✓
- 条件② 修正轮落地并逐处核验：§2.12（轮 1 发现 1–7 ∕ 9–13）∥ §2.13（轮 2 发现 1–7）落地，父侧回读核验 ✓
- 条件③ token 已签发 ✓（值不入档）
- 批准范围：实施舱 = **码面**（§2.1「设计轮」后实施——B1–B9 表 ∕ 面① 声明+谓词+剪枝（含 `file-walk.mjs` 剪枝位）∥ 面③ 护栏与增量维护 + 批件 T1–T21）；**数据面 ops（存量剪枝执行 ∕ 备份）零执行**——须用户批准后父侧另步（§2.6 数据面 + §2.7 边界）。
- 在册：上抛裁定 = §1.5（下笔）；worker 升级触发（L-②-5）在册；`D:/dgx-spark` 系处置 = 用户裁定项。

## §5 实施记录（eng-coder）
**状态行**：实施完成（initial 轮：码面 + 批件 T1–T21（21/21 绿）· Δ 背板零越 · 数据面零执行 · 审计∕评审收敛（clean））



### 5.1 实施轮（initial · eng-coder · 2026-09-30）——码面（B1–B9 ∥ 面① ∥ 面③）+ 批件

**范围**：B1–B9 大库操作面 ∥ 面① 索引范围声明 + 谓词 + 存量剪枝档 ∥ 面③ 体积护栏与增量维护；批件 = `docs/batches/2026-09-30-memory-db-family.test.mjs`（T1–T21）。**数据面 ops 零执行**（存量剪枝 ∕ 备份 ∕ VACUUM ∕ 迁移 = 用户批准后父侧另步）；真库（`~/.thincoder/memory.db`）零触碰（全部夹具 ∕ 沙箱库 ∕ `:memory:`）。

**逐档终值行数（§2.4 Δ 背板核对 · 行计数口径 `find /c /v ""` · 硬限 500 零越）**：

| 文件 | 现（§2.4 前值） | 终值 | Δ | 背板判定 |
|---|---|---|---|---|
| `thincoder-core/memory/schema.mjs` | 453 | 468 | +15 | ≤ +30 ✓ |
| `thincoder-core/memory/core.mjs` | 304 | 319 | +15 | ≤ +25 ✓ |
| `thincoder-core/memory/code-sync.mjs` | 426 | 457 | +31 | ≤ +60 ✓ |
| `thincoder-core/memory/docs.mjs` | 419 | 436 | +17 | ≤ +35 ✓ |
| `thincoder-core/memory/sweep.mjs` | 232 | 289 | +57 | ≤ +60 ✓ |
| `thincoder-core/memory-status.mjs` | 46 | 69 | +23 | ≤ +25 ✓ |
| `thincoder-core/conventions.mjs` | 295 | 319 | +24 | ≤ +25 ✓ |
| `thincoder-core/manifest-schema.mjs` | 155 | 162 | +7 | ≤ +15 ✓ |
| `thincoder-core/agent/setup.mjs` | 256 | 266 | +10 | ≤ +12 ✓ |
| `thincoder-core/tools/repomap.mjs` | 313 | 325 | +12 | ≤ +15 ✓ |
| `thincoder-cli/src/cli/memory-command.mjs` | 123 | 127 | +4 | ≤ +20 ✓ |
| `thincoder-core/memory/file-walk.mjs` | 109 | 112 | +3 | ≤ +15 ✓（§2.13 项 3 追加行） |
| `thincoder-core/memory/sync-tail.mjs` | —（新增） | 80 | 新档 | 拆分缝（见 5.2） |
| 批件 `…memory-db-family.test.mjs` | —（新增） | 565 | 批件 | §2.5 |
| 读数件 `…memory-db-family-readings.json` | —（新增） | — | T16 读数落档 | L-②-5 |

**5.2 拆分（先拆后改触发 b）与缝记录**：code-sync.mjs 首装后 +80 越 Δ 背板（> +60）且越 500 硬限 ⇒ 按 §2.12 补块 3「先拆后改触发（任一）b」处置——拆分点 = 点名缝**「预算判定 + stale 收尾块」**：新增叶档 `thincoder-core/memory/sync-tail.mjs`（80 行 = `originRowCount` ∕ `rowCountOfPath` ∕ `createRowBudget`（WARN/CAP 单源）∕ `sweepStaleRows`（同款让出 + 收尾保护位））；code-sync ∕ docs 两档改消费该单源。拆后 code-sync 457（+31）、docs 436（+17）、硬限零越。**本档行未入批档 §2.4 表**（§2.4 为 append-only 面，请父侧转记；先例 = §2.13 项 3 为 `file-walk.mjs` 追加行）。**同轮随出**：`markIndexedCommit` 由 fire-and-forget 改 `await`（锚推进 = 同步完成条件——原竞态下 T12 ∕ T14 不可判；M1 语义不变）。

**5.3 验证读数（定向 · 批件直跑）**：`node --test docs/batches/2026-09-30-memory-db-family.test.mjs` ⇒ **21/21 pass**（连跑三轮全绿；duration ≈ 12.7–19.2 s）。T1–T21 与 §2.5 ∕ §2.12 补块 5 ∕ §2.13 用例表一对一行。T16 两向读数落档（`2026-09-30-memory-db-family-readings.json`，latest：基线档 19,000 行 = 66.7 ms < 0.5 s ⇒ **不触发**；CAP 档 100,000 行 = 289.1 ms = 结构参考；夹具 32 维已自注「较真库偏轻」）。**v10 迁移体量说明**：**只增索引**——两枚部分索引 `code_chunks_embedding_null` ∕ `doc_chunks_embedding_null`（`(embedding) WHERE embedding IS NULL`），无表结构 ∕ 行级变更；探针调用点 SQL 形不变（计划改走 `SEARCH … USING INDEX … (embedding=?)`，T5 机检在盘）。

**5.4 审计与代码评审轮次（本舱内部）与终态**：① 偏离审计（explore · 只读，对照 §2 ∕ 设计 §6.14 ∕ 需求 §4.10）= **DEVIATIONS 4 项**：§5 空座（= 本座，已消）· sync-tail 缝记录无落点（= 5.2 段，已消）· `MANIFEST.md:98`（DEFAULT_MANIFEST 行漏 `excludePaths`）与 `:259`（KD-M1-32 例外指针缺）——两处同轮已补。② 代码评审（advisor round 1）= **pass**（7 发现：2🟡 + 5🔵，零 🔴，无 must-fix）；round 2（仅复核 fix 声称）= **pass**——三处代码修复已落：`docs.mjs:17` 死 import 删除 ∕ `repomap.mjs:115-119` 越界文案条件化（`origin` 给出才缀「for this origin」）∥ 批件 T7 射程注释（`:246-248`）。**终态 = clean（无未决 must-fix）**。数据面零执行（diff 可证 = 本舱改动限于上表文件 + 批件 ∕ 读数件）。

**5.5 报告面（父侧裁 ∕ 在册 · 非 must-fix）**：① **嵌套 cwd 面基**：origin 深于 manifest 根时，`isExcludedRelPath` 比较基（cwd 相对 `rel`）≠ 声明基（项目根相对）⇒ 声明静默不命中（设计 §6.14 面① 明文「比较基 = 项目根相对面」）——请父侧裁（统一基面 ∕ 登记 §8.3）；② **P3「开库 + 库字节读数」**：实施面无开库读数（dbBytes 只在核出口 `memoryStatus`，L-③-1 已绿）——父侧裁；③ T16 读数件每次直跑覆写（探针件可再生）——如需冻结请加环境闸；④ **设计坐标漂移**：`MEMORY.md` §6.14 B6 ∕ P2 行点名的 code-sync 收尾 ∕ 预算段现经 `sync-tail.mjs` 承接（父侧转设计档时随改）。

## §6 验证与收口（父代理）

**验证读数（父侧独立复核）**

- 批件 `docs/batches/2026-09-30-memory-db-family.test.mjs` ⇒ **21/21 pass**（父侧重跑 · duration ≈18.0s；舱内连跑三轮全绿）
- 缝实读：`sync-tail.mjs` 80 行全读（`createRowBudget:35-56` ∕ `sweepStaleRows:65-80` ∕ 收尾保护位 `:70`）；`file-walk.mjs` 剪枝双守卫 `:94 ∕ :97` 在位
- Δ 背板零越（§5 行数表 · 硬限 500 零越）；数据面零执行 ✓（全夹具 ∕ 沙箱；真库存量剪枝 = 待用户批准后父侧另步——§2.6 ∕ 本 § 残留）
- 随动轮四条 ✓（§2.14 · `MEMORY.md` `:520` ∕ `:538` ∕ `:549-550` ∕ `:551` ∕ `:648` ∕ `:707`）
- **父侧直执行一笔**（可 revert）：`MEMORY.md:521` 守卫位坐标 `:91 ∕ :94` ⇒ `:94 ∕ :97`（实施 +3 行后漂移——随动轮漏项，父侧收）

**结算清单（D7）**

- 六座：§1 ✓ ∕ §2 ✓ ∕ §3 ✓（两轮）∕ §4 ✓（代签）∕ §5 ✓（实施+随动）∕ §6 = 本段
- 指针：设计档 ∕ 批档 ∕ 需求档 §4.10 三账一致（F-S6–S8 ∕ N-S4–S6）
- 台账：**#693 → 已核销**（本笔；数据面 ops = 待用户批准另步——本 § 残留在册）；#697（P1 端面）在途（UX 轮）；**#700**（嵌套 cwd 基面）条件项在册
- 前批遗留交叉核对：tui-freeze 批（2026-09-18 同族先例）已闭；`D:/dgx-spark` 系处置 = 用户裁定项（`MEMORY.md:650`）
- 残留（入册不阻收）：数据面 ops（存量剪枝 ∕ 备份——用户批准后父侧另步）；worker 升级触发 = 不触发（T16 读数 < 0.5 s）；T16 读数件可再生（如需冻结归档加环境闸）
- **暂缓批复核：无**

**收口**：全链闭合（点火 2026-09-29 23:56 实害 → 设计 → 评审两轮 → 代签 → 实施 21/21 → 随动轮 → 收口），记录冻结（2026-09-30）。
