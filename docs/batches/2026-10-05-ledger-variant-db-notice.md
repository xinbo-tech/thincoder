# 2026-10-05 · ledger 变体键库首跑检测提示（F-LX3）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 台账 #935 ∥ GitHub #19 请求②（2026-10-04 zacharyyyang——变体键库首跑检测提示）；用户 2026-10-05 16:50「已入账的需求处理掉吧」= 本批点火（16:50 系就地修正——原录 17:50 为父侧记误；§1 同行同修）。
> 台账 = #935（core · 归批）。前情 = 无（独立批——承 2026-09-25-ledger-key-normalize（已收口）之存量面）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源与授权

- 用户 **16:50「已入账的需求处理掉吧」** = 本批点火（承 16:5x 父侧报告「#19 请求②已入池 #935」；**16:50 系就地修正——原录 17:50 为父侧记误**）。**16:55「自动修完」= 全链跑授权**（代点火评审 / §4 代签〔三条件惯例〕/ 实施派发 / 收口核销；自缚三条在册）。
- **需求** = GitHub #19（zacharyyyang·2026-10-04）请求②：升级后首跑检测变体键库并提示 migrate。已落需求档五要素：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` §②.10 **F-LX3** + §④ **AC-M2-20**（终值——17/18/19 均已占用，连避；评审 #3 发现 1 处置，见需求档变更记录）+ §③ 边界两条 + 变更记录（2026-10-05 条）。
- **父侧核（16:4x）**：请求①（「npm 链无收正面」）= 误读——`@thincoder/core` 随依赖入包（根级 `*.mjs` 含 `ledger-db`/`ledger-migrate`）+ `thincoder ledger audit|migrate` 在 0.12.70 在盘；回帖已发（issuecomment-5991181118）。请求② = 真需求（检测面确缺）。
- **范围裁决（父侧——供设计勘定）**：检测 = **当前项目根**的盘符变体（非全局——键为哈希、不可反推根）；可见面 = **CLI 主入口**（桌面 / VSC 不做）；行为 = **只提示**（零自动动作）；降级 = **静默**（绝不阻塞启动）。
- **授权** = 用户「处理掉吧」⇒ 全链跑（设计 → 评审代点火 → §4 代签〔三条件惯例〕→ 实施 → 收口）。
- **台账** = **#935**（待设计——任务书 = 本档 §2）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮（评审 #3 四项）落修在盘——AC-M2-20 逐号 ∥ headless 收口（维持不做）∥ KD-VN1 理由① 收窄 ∥ API-CONTRACT 判定（入生成区）；上抛 2 项均收口）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 本批条目（覆盖）

| # | kind | 标题 | board |
|---|---|---|---|
| 1 | requirement | 台账变体键库首跑检测提示（升级后自动发现存量分裂并引导 migrate——GitHub #19 请求②） | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` |

**非本批覆盖**：无（台账 #935 单条）。

### 设计档落点

`docs/core/design/LEDGER.md` §12（新建节——`:712` 起）+ 随动三处：§7.1 导出行（`:287`）· §2.2 指针行（`:109`）· 变更记录（`:528`）。

### 机制设计要点（判据句）

- **检测**：CLI 主入口（TUI）启动时对**当前项目根**（`resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`——与 `planLedgerMigration` 同子表达式）沿 `legacyKeyVariants` 算盘符变体键，并过滤 `k !== ledgerKey(root)`；**「变体键库在盘」判据 = 文件存在**（`statSync().isFile()`——与 `migrate` 源枚举同判据 / 零开库 / 坏档与空库不漏）；主库在否均提示；无 ⇒ 零动作零输出。
- **提示**：判定成立 ⇒ 单行 i18n 文案（键 `ledger.variantDbNotice`——zh ∥ en 逐字 = 设计档 §12.2；内文含 `thincoder ledger audit` ∥ `thincoder ledger migrate` 指引）；落点链 = `tuiCommand` 计算（动态 import）→ `startTUI` opts 承载 → `showStartup` 一行渲染（`crashNotice` 同款）；**每进程至多一次 = 核内闩**（首唤检测 / 后唤零动作 + 重置缝）。
- **降级**：核内全径 try + 调用面独立 try——import ∥ 检测报错 ⇒ 静默（零抛 · 零中断 · 零阻塞）。
- **动因面**：GitHub #19 请求②（旧产物持续写入小写盘符变体键——21 库中 10 为变体键、约 130 条搁浅）；需求 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` §②.10 F-LX3 + §④ AC-M2-17；台账 #935。

### 受影响文件与测试面（现行 = 实读 2026-10-05；Δ = 实施轮以实读为准）

| 文件 | 现行 | Δ | 改动 |
|---|---|---|---|
| `thincoder-core/ledger-variant-notice.mjs` | 新（拟新增——本批实施轮落盘） | 估 ≈45 | 检测 + 文案（`t()`）+ 闩 + 重置缝 |
| `thincoder-core/i18n.mjs` | 111 | +2 | 键 `ledger.variantDbNotice`（zh ∥ en） |
| `thincoder-cli/src/command-interactive.mjs` | 196 | +≈7 | `tuiCommand` 计算段 + opts 键 |
| `thincoder-cli/src/tui/startup.mjs` | 332 | +2 | `showStartup` 渲染行（恰一行） |
| `docs/core/design/LEDGER.md` | 710 | +101 | §12 全节 + §7.1 / §2.2 / 变更记录 三处随动；**落档 811（末行号法）** |
| `docs/batches/2026-10-05-ledger-variant-db-notice.test.mjs` | 新（拟新增——本批实施轮落盘） | 估 ≈130 | 批内件 U-VN1–U-VN6 |

**零改面**：`thincoder-core/ledger-migrate.mjs`（`flipDriveLetter` / `legacyKeyVariants` / 迁移六步）∥ `thincoder-core/ledger-db.mjs`（键式 / DDL / 开库）∥ `thincoder ledger migrate` / `audit` 命令面（`thincoder-cli/src/command-table.mjs` 分发）——零触（新档直引两名，不二写）。
**跨文件极限**：新档估 ≈45 ∥ `command-interactive.mjs` ≈203 ≤300 ✓；`startup.mjs` **334 >300 顾问线**（既有超线档——本批 +2 为行级改动、非结构性 ⇒ 不拆；拆分预案随该档下次结构性触碰登记）。

### 用例（U-VN1–U-VN6——批内件 · 明细 = 设计档 §12.5）

- U-VN1 正常·变体对夹具两拍（主键档不在 / 在场）⇒ 单行文案逐字（zh ∥ en）；
- U-VN2 边界·零输出两拍（仅主库 / 无库）；U-VN3 错误·抛错注入 ⇒ `null` 零抛；
- U-VN4 边界·每进程至多一次（连唤两次 + 重置缝）；U-VN5 边界·负向锁（翻转拼写 ≡ 主键 ⇒ 零输出）；
- U-VN6 集成·启动面渲染腿（`showStartup` 直驱——有 ⇒ 恰一行 / 无 ⇒ 零行 + 接线静态锁）。

### 验收对照（A-VN1–A-VN6——逐条回指需求 §②.10 / §④ AC-M2-17）

| # | 判据（可机判） | 回指 |
|---|---|---|
| A-VN1 | 检测判据成立（主库在否两分支同判）——U-VN1 绿 | §②.10 检测 / AC-M2-17 句 1 |
| A-VN2 | 提示恰一行 ∧ 含 `ledger audit` ∥ `ledger migrate` ∧ 文案 i18n 键（zh ∥ en 单源）——U-VN1 / U-VN6 绿 | §②.10 提示 / AC-M2-17 句 1 |
| A-VN3 | 单库 / 无库 ⇒ 零输出——U-VN2 绿 | AC-M2-17 句 2 |
| A-VN4 | 抛错 ⇒ 启动照常零报错（静默降级）——U-VN3 绿 | §②.10 降级 / AC-M2-17 句 3 |
| A-VN5 | 每进程至多一次——U-VN4 绿 | AC-M2-17 句 4 |
| A-VN6 | migrate / audit 既有语义零改（静态判）∧ 批内件全绿 ∧ `node scripts/doc-check.mjs` exit 0 | 边界 / 批档自身约束 |

**设计轮读数**：`node scripts/doc-check.mjs` = **exit 0**（候选 48546 · **悬空 0** · 拟新增 50〔含本批 3 处——列报不入闸〕· 行宽 0 违规）。

### 边界（本批不做）

- 只提示零动作：不自动迁移 / 不删档 / 不建库 / 零写 / 不弹交互；
- 提示面 = CLI 交互主入口（TUI）为限：桌面 / VSC / headless `chat` / `acp` 启动面不做；
- 不改 `ledger migrate` / `audit` 既有语义；不新增哈希式；不做变体键反推根；不做全局 / 多项目扫描；不阻塞启动。

### 关键决策

| KD | 决策 | 否决方案 |
|---|---|---|
| KD-VN1 | 「在盘」判据 = 文件存在（零开库） | 读行数（开库读——坏档 / 空库漏报） |
| KD-VN2 | 检测 / 文案落新档（`ledger-migrate.mjs` 保 300 行零触） | 并入 `ledger-migrate.mjs`（≈330 越顾问线）∥ 并入 `ledger-db.mjs`（成环） |
| KD-VN3 | 一次为限 = 核内闩 + 重置缝 | 调用面结构事实（漂移 · 无直测） |
| KD-VN4 | 承载 = opts + `showStartup` 渲染（`crashNotice` 同款） | `showStartup` 内计算（sync 不可 import） |
| KD-VN5 | 文案单源 = i18n 键（locale = `agent.config?.locale`） | CLI 内联字面 / 固定中文 |
| KD-VN6 | 提示面 = CLI TUI 启动为限 | headless / ACP / VSC / 桌面同步提示（噪声 + 面差） |

### 上抛项 / 披露

1. **AC 编号撞车（待裁）**：需求 §④ AC-M2-17（F-LX3）与设计档 §8 既有 AC-M2-17（#828 根解析面）编号相同、所指不同——本批以批内编号 A-VN / U-VN 承载、§8 不增行（设计档 §12.6 编号注记在案）；处置建议 = 需求侧改号（主 agent 笔）或双面异构登记。涉引用面 = `docs/core/design/MANIFEST.md:615` ∥ 批件 `docs/batches/2026-10-02-manifest-resolution-fix.test.mjs`（两处引设计 §8 AC-M2-17——改号会牵动）。
2. **提示面边界裁决（披露）**：headless `chat` / `acp` 面不做（「CLI 主入口」取交互 TUI 为准 + 机器消费面纪律）；如需 headless 面（stderr 一行）请裁——扩张代价 = 一处调用点 + 一条用例腿。
3. `thincoder-cli/src/tui/startup.mjs` **334 行**（>300 顾问线——既有超线；本批 +2 行级 ⇒ 非结构性、不拆；拆分预案随下次结构性触碰登记）。
4. `thincoder-core/i18n.mjs` 增键后 **113 行**（`docs/core/design/CORE-UNIFICATION.md` §2.8.1 行 11 读数 as-of 108——本批未触该表；读数刷新随其自理节奏）。
5. 检测判据「文件存在 vs 有行」= 设计裁定 KD-VN1（理由在案——供评审核）。

### 修正块（设计评审轮 1 修正——评审 #3〔§3 轮次 1〕发现 1–4 逐号落修 · 父侧裁定 · 2026-10-05）

**落修逐号**（设计档 = `docs/core/design/LEDGER.md`；行号 = 改后实读）：

1. **发现 1（🟡 AC 编号终值）**——现文 `AC-M2-17` → 终值 **`AC-M2-20`**：设计 §12 全部引用逐号改（`:715` ∥ `:744` ∥ U-VN 表 `:770`–`:775` ∥ A-VN 表 `:781`–`:785` ∥ 编号注记 `:788`–`:789`）；§12.6 编号注记 = 终局句（「需求侧 F-LX3 验收 = **AC-M2-20**（17/18/19 均已占用，连避至 20——2026-10-05 逐号对读终裁；需求档变更记录在案）」）。改后 §12 区（`:712`–`:811`）`AC-M2-17` grep 零命中；区外正当保留 = §2.1 指针 `:73` ∥ §8 `:386`（#828 根解析面）∥ 变更记录 `:514`（他档 `docs/core/design/MANIFEST.md:615` 同属 §8 引用——零触）。
2. **发现 2（🟡 headless 面 · 父侧裁定 = 维持不做）**——§12.7 边界句 `:794` 写成单源结论：TUI 为限；headless `chat` / `acp` 不做（理由 = 机器消费面纪律：机器面零新增输出）；与 §7.8 不变量句「headless 零新增输出」（`:364`）同向——本面不做 ⇒ 不变量保持。
3. **发现 3（🔵 KD-VN1 理由①）**——`:722` 括注收窄为与 §2.2 同读的分述：空库 ⇒ `migrate` 照回收；坏档 / `-wal` ⇒ confirm 面拒跑（fail-closed）、走 `thincoder ledger audit` 定性；判据本体（文件存在 / 零开库）零改。
4. **发现 4（🔵 API-CONTRACT 判定 = 入生成区）**——实读 `scripts/api-contract.mjs`：射程 = 根下 `**/*.mjs`（`:16` 跳表不含 `thincoder-core`）· 采集 `:25` · 判据 `^export `（`:63`）⇒ 新档 `thincoder-core/ledger-variant-notice.mjs`（拟新增——本批实施轮落盘）的导出行**入生成区**。**受影响表新增行**：

| 文件 | 现行 | Δ | 改动 |
|---|---|---|---|
| `docs/core/design/API-CONTRACT.md` | 2989 | 生成区随动 | 实施轮重跑 `node scripts/api-contract.mjs --write`（新档导出行入生成区——`^export ` 口径；语义区零动） |

**上抛项收口**（§2 旧文 `:94`–`:95` 不改——append-only；终值以本块为准）：

1. **AC 编号撞车 → 收口**：需求侧改号终值 = **AC-M2-20**（需求档 `:78` 行 + `:107` 变更记录已落——父侧笔；复扫零 `AC-M2-17`）；设计 §12 引用逐号随动（见落修 1）；A-VN / U-VN 批内编号原样保留。
2. **提示面边界（headless）→ 收口**：维持不做（父侧 2026-10-05 裁定——CLI 交互 TUI 为限）；**无扩张点**（扩张预案 = 一处调用点 + 一条用例腿——未启用、不登记）。

**§2 上游引用随动声明**：本块之上文本中的 `AC-M2-17` 引用（`:39` ∥ `:62` ∥ `:66`–`:70`）与上抛项旧文（`:94`–`:95`）以本修正块为终值（append-only 不改旧行）。旁注：§1 状态行 `:6` 仍含旧号（§1 = 父侧笔——本块零触）。

**读数**：`node scripts/doc-check.mjs` = exit 0（悬空 0——本轮终态运行）；§12 区 `AC-M2-17` 复扫零命中。设计档变更记录补本修正轮一笔（`:529`——惯例落档）。**余面零改**（判据 / 用例 / 验收内容 / 决策 / 文案零动；§1 / §3–§6 零触）。发现 5（i18n 读数漂移）= 维持披露口径（本块零动作）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审范围 = 本批档 ∥ `docs/core/design/LEDGER.md`（811 行 · §12 = `:712`–`:811`）∥ `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`；跨文件引用（`thincoder-core/ledger-migrate.mjs` 等）与机检读数（doc-check exit 0）超出评审范围、未验证；无文档地图 / 无工程标准档 ⇒ Document ownership 判据降级（按 Project Guide + 范围档互证）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership（doc-state） | 🟡 | AC 编号三处失同步，且「改号避撞」未避掉：需求侧 F-LX3 验收已编号 **AC-M2-18**（`thincoder/docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:78`；裁定在案 `:107`「17 号已为设计档 #828 根解析面所用——改号避撞，2026-10-05 现场裁定」），而设计档 §8 既有 AC-M2-18 = 标记范围行（`thincoder/docs/core/design/LEDGER.md:387`，增行记录 `:517`）——撞车点由 17 移到 18；同时设计 §12 / 批档全篇仍写 AC-M2-17（`LEDGER.md:715`「§④ AC-M2-17」· `:744` · `:770`–`:775` · `:781`–`:785` · `:788`–`:789`；批档 `:6` · `:12` · `:39` · `:62` · `:66`–`:70`）：该号在需求档无对应行（悬空），在设计档内指 §8 #828 行（`LEDGER.md:386`——档内歧义）；批档上抛项 1 仍记「待裁」（批档 `:94`） | 需求 §④ 与设计 §8 的 AC 表做一次逐号对读，F-LX3 验收落到真正未占用号（或为仅设计侧行补双向登记）；随后把设计 §12 回指列 / 编号注记（`:770`–`:789`）与批档 §1/§2 引用及上抛项 1（`:6` · `:12` · `:39` · `:62` · `:94`）随动收口；A-VN / U-VN 批内编号原样保留 |
| 2 | Scope（协调项） | 🟡 | headless `chat` / `acp` 面取舍未决：设计边界取「CLI 交互主入口（TUI 启动）为限」并排除 headless（`LEDGER.md:794`），需求 §③ 仅排除桌面 / VSC（`ENGINEERING-MODE-V2-SPEC-LEDGER.md:55`），本批自记为待裁（批档 `:95`「如需 headless 面（stderr 一行）请裁」）——与档内不变量「headless 零新增输出」（`LEDGER.md:364`）的张力未成文收口 | 把该面取舍落成设计边界句的单源结论（维持不做 ⇒ 收口上抛项 2；若做 ⇒ 登记扩张点 = 一处调用点 + 一条用例腿），并写明与 `LEDGER.md:364` 不变量的关系 |
| 3 | Clarity | 🔵 | KD-VN1 理由①与 §2.2 fail-closed 口径不同读：`LEDGER.md:722` 称「提示 ⇒ `--confirm` 必有一源可处理（含仅空库 / 坏档一态：迁移照回收、审计照定性）」，而 §2.2 对不可读 / 缺列 / `-wal` 源的口径为 confirm 面拒跑（`LEDGER.md:83`「源不就绪（不可读 / 无 `items` 表 / 缺列）⇒ 行内标「⚠ <拒因>（confirm 面将拒跑）」」 · `:93`） | 将括注收窄为与 §2.2 同读的分述（空库 ⇒ 迁移照回收；坏档 / `-wal` ⇒ confirm 面拒跑、走 audit 定性）——KD-VN1 判据本体不动 |
| 4 | Clarity（受影响面完备） | 🔵 | 新核档 + 新导出（`ledgerVariantNotice`）未在受影响表登记 API-CONTRACT 生成区 / 生成器重跑与否（批档受影响表 `:43`–`:50` 无该行）；同档前批以导出面变化触发重跑、生成区行入表为先例（`LEDGER.md:656` · `:665`） | 核对新档导出是否入生成区：入 ⇒ 受影响表补一行（生成区随动）+ 重跑步；不入 ⇒ 在设计 §12.4 或批档表加「API-CONTRACT 零动」判定句（生成器射程超出本次评审范围——未验证） |
| 5 | Doc-state（数字漂移） | 🔵 | i18n 读数漂移已披露未闭合：`thincoder-core/i18n.mjs` 111 ⇒ 113 行（批档 `:97`），而 `docs/core/design/CORE-UNIFICATION.md` §2.8.1 仍读 108——该档不在本批触碰面 | 维持披露口径即可；若顺路则随 CORE-UNIFICATION 的读数节奏刷新为 113 |

**计数**：🔴 0 · 🟡 2 · 🔵 3
**VERDICT: pass**

## §4 用户批准（主 agent）

**2026-10-05 17:2x 父侧代签**——依据用户 16:50「已入账的需求处理掉吧」+ 16:55「自动修完」= 全链跑授权（代点火评审 / §4 代签〔三条件惯例〕/ 实施派发 / 收口核销；自缚三条在册）。

**三条件核验**：
① **设计评审 pass** ✓——§3 轮次 1：🔴 0 · 🟡 2 · 🔵 3（无阻塞项）。
② **修正轮落地并逐条核验** ✓——`#5` 四项（§12 全 14 处 AC 引用 ⇒ **AC-M2-20** ∥ §12.7 headless 单源结论 ∥ §12.1 KD-VN1 分述 ∥ API-CONTRACT 判定「入生成区」+ 受影响表补行）+ 批档 §2 修正块 + 两上抛收口——父侧实读核过（§12 区 `AC-M2-17` 零残留；区外仅正当保留）。
③ **token 已签发** ✓（运行态不入档）。

**批准范围** = F-LX3 全量实施：新档 `thincoder-core/ledger-variant-notice.mjs` ∥ `thincoder-core/i18n.mjs`（+2 键 zh/en）∥ `thincoder-cli/src/command-interactive.mjs`（计算段 + opts）∥ `thincoder-cli/src/tui/startup.mjs`（恰一行渲染）∥ 批内件 `docs/batches/2026-10-05-ledger-variant-db-notice.test.mjs`（U-VN1–U-VN6）∥ `docs/core/design/API-CONTRACT.md` 生成区重跑。
**边界** = 只提示（零自动动作）∥ TUI 为限（headless / 桌面 / VSC 不做）∥ 降级静默 ∥ 键式单源（零新建哈希式）。

## §5 实施记录（eng-coder）

**状态行**：实施完成 · 2026-10-05（F-LX3 六档落盘；U-VN1–U-VN6 先红后绿（6 fail → 6 pass）；内部审计 clean ∥ 代码评审轮 1 pass（一项采纳修复）∥ 轮 2 修复验证 pass；API-CONTRACT 重跑后 --check 绿；终态 clean）

**完成面**（F-LX3 · 6 档全落 · 2026-10-05）：变体键库首跑检测提示全量落盘（设计单源 = `docs/core/design/LEDGER.md` §12 逐档执行、零越界）。新档 `thincoder-core/ledger-variant-notice.mjs`（47 行）导出 `ledgerVariantNotice({ cwd, dir, locale, exists })` → `string ∥ null` + `_resetLedgerVariantNoticeForTest()`；检测 = 根式（与 `planLedgerMigration` 同子表达式 `resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`）→ `legacyKeyVariants(root)` 过滤 `k !== ledgerKey(root)` → 文件存在探针（`statSync().isFile()` 吞错形——零开库／零伴生档）；命中 ⇒ `t("ledger.variantDbNotice", {}, locale)`（i18n 容器单源——CLI 侧零内联副本）；核内闩 = 每进程至多一次（首唤检测／后唤零动作）+ 重置缝；全径 try ⇒ 异常静默 `null`（零抛）。落点链 = `tuiCommand` 计算（动态 import，import∥调用整段 try——`thincoder-cli/src/command-interactive.mjs:170-176`）→ `startTUI` opts 键 `:186` → `showStartup` 恰一行渲染（`thincoder-cli/src/tui/startup.mjs:247-248`，`C.warn`）。文案 = `thincoder-core/i18n.mjs:76`（键 `ledger.variantDbNotice` zh ∥ en 逐字 = §12.2）。零改面核实 = `ledger-migrate.mjs` ∥ `ledger-db.mjs` ∥ `ledger migrate|audit` 命令面 ∥ 桌面／VSC／headless 启动面 ∥ 零自动动作 ∥ 零新建哈希式——逐条核过零触。

**落地表（file:line → Δ · 实读）**

| 档 | Δ | 落点 |
|---|---|---|
| `thincoder-core/ledger-variant-notice.mjs` | 新增 · 47 行 | 探针 `:23` ∥ 闩 `:26` ∥ 重置缝 `:29` ∥ `ledgerVariantNotice` `:38` |
| `thincoder-core/i18n.mjs` | 111 ⇒ 113（+2） | 键 `:76`（注释 `:75`） |
| `thincoder-cli/src/command-interactive.mjs` | 196 ⇒ 205（+9） | 计算段 `:170-176`（动态 import `:174`）；opts 键 `:186` |
| `thincoder-cli/src/tui/startup.mjs` | 332 ⇒ 334（+2） | 渲染句 `:247-248` |
| `docs/batches/2026-10-05-ledger-variant-db-notice.test.mjs` | 新增 · 214 行 | U-VN1–U-VN6；夹具钉死 `mkDriveProject` `:52`；无盘符 skip `:73`／`:125`／`:145`／`:167` |
| `docs/core/design/API-CONTRACT.md` | 生成区整区替换（+89／−67） | 新档两导出 `:1027`／`:1028`；语义区零动 |

**红绿两读**

- 先红（实施前 · 批内件首跑）：`tests 6 · pass 0 · fail 6`——U-VN1–U-VN5 = `ERR_MODULE_NOT_FOUND`（新档未存在）；U-VN6 = 渲染零行（读数为 `["Welcome to ThinCoder. Provider: p / m","Tools: "]`）+ 接线静态锁缺。
- 后绿（六档落盘后）：`tests 6 · pass 6 · fail 0 · skipped 0`——U-VN1 ①zh（主键档不在）∥ ②zh（在场）同判；U-VN2 ①仅主库／②目录空／②′无目录三拍 `null`；U-VN3 `threw=none · r=null`；U-VN4 `1st=文案 · 2nd=null · 3rd=文案`；U-VN5 键在盘 ⇒ `null`；U-VN6 ①恰一行／②零行。
- 修复轮后复绿：`6 · pass 6 · fail 0 · skipped 0`（本机全跑零 skip）。

**门读数**

| 门 | 读数 |
|---|---|
| `node --check` ×5 档 | 全 exit 0 |
| 批内件（红 → 绿） | 6 fail → 6 pass |
| `node scripts/doc-check.mjs` | exit 0（`OK(锚): 0 条悬空` · `OK(行宽): 源域全部 .md 无 >300 字符单行`） |
| `node scripts/api-contract.mjs` | 重跑前 `--check` = exit 1 · DRIFT（盘上 2880 行 ∕ 生成 2902 行）→ `--write` exit 0（2900 条 · 641 档）→ `--check` = exit 0 · `OK(api-contract): 骨架零漂移` |
| 相邻件复跑 | `2026-10-03-read-data-interface.test.mjs` 12/12 ∥ `2026-10-05-ledger-unification.test.mjs` 18/18（零回退） |
| 生产径冒烟（沙箱 HOME ∥ 裸 specifier `@thincoder/core/ledger-variant-notice.mjs` ∥ 默认 `ledgerDirPath()`） | `zh-CN` ⇒ zh 文案（归一 zh）· 再唤 `null`（闩）· 重置缝后再出（en 逐字）· 零开库（目录／文件零变 · 零伴生档） |

**决策透明表**

| # | 决策点 | 裁定 | 依据 |
|---|---|---|---|
| 1 | 闩置位时序 | `noticeChecked = true` 于 try 之前（失败首唤同样消费） | §12.2「首唤检测／后唤零动作」——生产调用恰一次，影响面零；重置缝供直测 |
| 2 | 缺省形补 `= {}` | 保留（零参可调；规定调用面零影响） | §12.4 全缺省参数对象之自然补全（审计边注在案、非偏离） |
| 3 | 夹具拼写钉死 + 无盘符 skip | 采纳（内部代码评审 🔵 项） | 消「低盘符宿主 ⇒ U-VN1 假红／非盘符宿主 ⇒ `vk` 未定义假红」两态；U-VN2／U-VN6 不依赖盘符、不加 skip（覆盖面不缩） |
| 4 | API-CONTRACT 整区重跑 | 按 §2 修正块（发现 4）执行 | `--check` 由红转绿机检判据；生成区为源树快照（含他批既有导出随行——见披露 3） |

**审计与代码评审轮次与终态**

- 内部 explore 背离审计（1 轮 · read-only）：**clean**——A-VN1–A-VN6 + 禁项①–⑤ + 行数 + 六腿覆盖 + API-CONTRACT 逐条 pass，divergent = 0（四类偏差零）。
- advisor 代码评审轮 1（全量）：**pass**——🔴 0 · 🟡 2（启动档 334 行顾问线〔既有超线、非必须修〕；批档 §5／§1 状态面〔报告态〕）· 🔵 2（夹具盘符敏感〔采纳修复〕；读数漂移〔披露口径〕）。
- fix round 1（1 轮）：夹具拼写钉死 + 无盘符 skip + U-VN5 前置锁 + 档头宿主假设句（`docs/batches/2026-10-05-ledger-variant-db-notice.test.mjs`）——复跑 6/6 绿。
- advisor 轮 2（修复验证）：**pass**——修复项 Fixed（两半具核）· 三轮非修 Accepted（理由复核成立）· 新问题零。
- **终态 = clean**（审计 clean ∥ 评审判定 pass，经修复收敛；无未决 🔴／must-fix）。

**披露**

1. 行数读数（报告态 · 实读回填随 §6）：批内件 214 行（§2 表「估 ≈130」）；`command-interactive.mjs` +9（表「+≈7」）；`startup.mjs` 334 ✓ ∥ `i18n.mjs` 113 ✓ ∥ 新档 47（估 ≈45）。
2. `docs/core/design/CORE-UNIFICATION.md:1103` i18n 读数仍 **108**（实读 113）——§2 披露项 4 维持口径（本批未触该表）。
3. API-CONTRACT 重跑 = 整区替换 ⇒ +89 行含他批在飞导出／行号位移（本批仅新档两行 + 触档行号随动）——生成区单写者时序归父侧收口确认。
4. 未触面（诚实边界）：仓库全套件未跑（归父侧收口）；桌面／VSC／headless 零触（设计边界）；工作树含他批未提交改动（`AGENT-LOOP-*.md` ∥ `BATCH-RECORD.md` ∥ `TOOLS.md` ∥ 两份需求档 ∥ 另两批档）——非本批、零触。

## §6 验证与收口（父代理）

**2026-10-05 17:3x · 收口**

**交付验证（实施 `#7` · 修正轮 `#5` · 设计评审 `#3`）**：

| 面 | 终值 | 核验读数 |
|---|---|---|
| 新档 | `thincoder-core/ledger-variant-notice.mjs` **47 行**——探针 `:23` ∥ 闩 `:26` ∥ 重置缝 `:29` ∥ `ledgerVariantNotice` `:38` | 批件 **U-VN1–U-VN6：6 fail → 6 pass**（先红后绿）∥ 生产径冒烟（沙箱 HOME：zh 文案 · 再唤 `null`（闩）· 重置缝后再出 · 零开库/零伴生档） |
| i18n | `thincoder-core/i18n.mjs` **113**（+2——键 `ledger.variantDbNotice` zh ∥ en `:76`） | 逐字 = 设计 §12.2 ✓（核容器单源） |
| CLI 链 | `thincoder-cli/src/command-interactive.mjs` **205**（计算段 `:170-176` ∥ opts `:186`）∥ `thincoder-cli/src/tui/startup.mjs` **334**（渲染句 `:247-248`） | U-VN6 ①恰一行 ∥ ②零行 ∥ `node --check` ×5 exit 0 |
| 生成区 | `docs/core/design/API-CONTRACT.md` 重跑（+89/−67；新档两导出 `:1027`/`:1028`——**含他批在飞导出/行号位移**，见披露） | `--write` → `--check` = **骨架零漂移**（2900 条 · 641 档） |
| 相邻面 | `2026-10-03-read-data-interface.test.mjs` **12/12** ∥ `2026-10-05-ledger-unification.test.mjs` **18/18** | 零回退 |
| 闸 | `doc-check` exit 0（父侧亲跑：悬空 **0** · 行宽 OK） | 批内件红绿对在档 |

**父侧核验**：§5 实读在盘（`:151-207`）；`doc-check` 亲跑 exit 0；先红后绿读数逐条核过。

**收口结算同步清单（D7）**：角色表六段齐 ✓ ∥ 状态行 = 已收口（close 落）∥ 计数（47 / 113 / 205 / 334 / 214 / 2900）∥ 指针（设计单源 = `LEDGER.md` §12）∥ 变更记录（`LEDGER.md` + 需求档 + 批档）∥ 待办勾销 = **#935** ∥ 前批遗留跨核 = **无** ∥ 台账面 = 核销行。

**提交与推送**：提交 = 产品笔（`ledger-variant-notice.mjs` 新 ∥ `i18n.mjs` ∥ CLI 两档）∥ 文档笔（`LEDGER.md` ∥ `API-CONTRACT.md` ∥ 需求档 ∥ 本记录 + 批内件）∥ 冻结笔 = 本记录（随落）；推送 = 双远端（origin/gitee ∥ github）。**凭证** = 本批 designId 槽位**终消费**（链终——槽值不入档）。

**披露随记**：① API-CONTRACT 生成区含他批在飞导出/行号位移（单写者时序归父侧——批档披露 3）；② `CORE-UNIFICATION.md:1103` i18n 读数 108 vs 实读 113（本批零触——维持口径）；③ `startup.mjs` 334 > 300（既有超线 · 本批 +2 行级 · 非结构性——拆分随该档下次结构性触碰）。
