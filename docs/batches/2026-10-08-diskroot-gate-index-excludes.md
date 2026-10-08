# 2026-10-08 · diskroot-gate-index-excludes
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-08 · 来源 = 用户 2026-10-08：12:22「应该禁止cli端从磁盘根目录启动，碰到这样的行为时应该提示用户进入工作目录再启动。否则真的会炸索引。」+ 12:24「索引也应该排除node_modules之类的引用目录。」+ 12:27「都要进，通用名那几个也收。」+ 12:41「bin先还是不排除吧。」；父侧实核：`D:/` 盘根 origin 存量 132,412 行（2026-10-08 已清）+ obj/vendor 127 行 + 反斜杠变体 239 行在册。。
> 台账 = #1080 · #1081（MEMORY.md ∥ FEATURES.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-08
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源（用户原话 · 逐字）

- 12:22「应该禁止cli端从磁盘根目录启动，碰到这样的行为时应该提示用户进入工作目录再启动。否则真的会炸索引。」
- 12:24「索引也应该排除node_modules之类的引用目录。」
- 12:27「都要进，通用名那几个也收。」（答父侧「通用名 bin ∥ obj ∥ out 收不收」之问）
- 12:41「bin先还是不排除吧。」

### 1.2 父侧实核（2026-10-08 · 实库 + 磁盘对账——设计轮输入）

- **盘根实案**：`D:/` origin = code 55,062 + doc 77,350 = **132,412 行**（已清——`memory sweep --origin` 删除 · 备份 `memory.db.sweep-backup-20261008043913` 在册）；库行 295,299 ⇒ 162,889。
- **现排除表有效**：node_modules ∥ dist ∥ build ∥ coverage ∥ .next ∥ target … 实库**零命中**；实测漏网 = `obj`（156 行）∥ `vendor`（40 行）；`bin`（82 行——WSL rootfs ∥ thinworker bin）——用户裁定**不进排除表**（保持入索引）。
- **origin 归一**：`normalizeOrigin` 在位且写 ∕ 读缝全覆盖（§6.11 ∕ §6.13）；残余 = 反斜杠变体 239 行（`D:\dgx-spark` 130 ∥ `D:\teamcode` 109）；盘符大小写变体实核 **零条**；**239 行已于 04:50 折叠落定（现读非归一行组 = 0）**。
- **参考系体量**（政策面——用户未裁，本批不碰）：剩库 16.3 万行中 `D:/teamcode` origin 的 openclaw + opencode ≈ 8 万行（openclaw 本体 37,075 档 ∥ 375 MiB 索引口径——真体量，非漏排）。
- **连带在册**（用户未点名，随批记待处置）：压实（VACUUM——删后 337,817 页 ≈ 1.3 GiB 可回收）。

### 1.3 本批需求清单（两条 · 对应台账 #1080 ∥ #1081）

| # | 需求 | 需求档落位 | 设计档拟位（设计轮定） |
|---|---|---|---|
| 1 | 盘根启动门：cwd = 磁盘根 ⇒ 会话面硬拦（提示 + 非零退出）；信息维护面放行 | `docs/cli/requirements/FEATURES.md` §3 N10 | `docs/cli/design/CLI-ENTRY.md`（拟） |
| 2 | 索引排除名单补强：通用名 + 平台语义大小写；`bin` 不收 | `docs/core/requirements/MEMORY.md` §4.11（F-S9 ∥ N-S7） | `docs/core/design/MEMORY.md` §6.14 段族（拟） |

### 1.4 口径钉死（用户已裁 · 设计不得偏离）

- `bin` **不进排除表**（保持入索引——本仓 `thincoder-cli/bin` ∥ `thincoder-server/bin` 照常收）；
- 非盘符段大小写折叠**不扩**（§6.11 口径维持）；
- 家目录**维持软防护**（#867 先例——不升硬拦）；
- 信息维护面（`-v` ∥ `--help` ∥ `memory` ∥ `upgrade` ∥ `completion` ∥ `session *`）放行；**无强开旗**；
- 参考系收录政策（worktree 级）**本批不碰**。

### 1.5 随批清算面（存量 · 执行须点名）

- 反斜杠变体 239 行折叠——✅ **已落（04:50 · 合并去重 182 行）**；
- obj ∥ vendor 存量剪枝——✅ **已落（98 行 · 8 径 · fail=0；原报 127 = 立案时含盘根重复账）**；
- 压实 VACUUM——✅ **已落（3185.3 ⇒ 1952.2 MiB · 省 1233 MiB · freelist=0）**；备份清理 = 9 枚已清（留最新 1 枚作锚——`memory.db.sweep-backup-20261008050057` · 1952 MiB）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（两条需求均已落笔（CLI-ENTRY §1 ∥ MEMORY §6.14 面④ + L-⑤ + D-MEM32）；②折叠范围已裁（族分折——两档已定稿）；门禁：本批 0 悬空 ∥ 本批行宽 0）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 · 两条 · 需求档已立案 · 本批 = 纯设计轮）

| # | 需求 | 需求档（判定句源） | 设计档落点 | 本批交付 |
|---|---|---|---|---|
| 1 | 盘根启动门 | `docs/cli/requirements/FEATURES.md` §3 N10 | `docs/cli/design/CLI-ENTRY.md` §1「盘根启动门」条 | 设计落笔（实现 = 实施轮） |
| 2 | 索引排除名单补强 | `docs/core/requirements/MEMORY.md` §4.11（F-S9 ∥ N-S7） | `docs/core/design/MEMORY.md` §6.14 面 ④ + 判据腿 L-⑤ + §7 D-MEM32 | 设计落笔（实现 = 实施轮） |

**限定**：零产品码 ∥ 零测试件 ∥ 需求档零触（已闭）。实现 = 随批实施轮（eng-coder）。

**本批不做（明确排除）**：`bin` 入表 ∥ 家目录升硬拦 ∥ §6.11 路径键折叠扩面 ∥ manifest `index.excludePaths` 面 ∥ 参考系收录政策 ∥ `tools/tree.mjs` ∥ `index-discover.mjs` ∥ 桌面 `at-complete.mjs` ∥ `scripts/**` 同名常量面（各自独立面，非索引判定）。

### 2.2 设计档落点

- ① → `docs/cli/design/CLI-ENTRY.md` §1（启动前置校验族新条——家目录 ∥ 版本门 ∥ 盘根门成族；机制单源 = 该条）。
- ② → `docs/core/design/MEMORY.md` §6.14 面 ④（名表 ∥ 平台语义 ∥ 单源 ∥ 负例集 ∥ 读数 ∥ 收敛二路 ∥ 边界）+ L-⑤（判据腿）+ §7 D-MEM32（含否决备选）。
- 档面随动（同轮）：两档 §5 ∕ 变更记录的「批次落点指针」行 + CLI-ENTRY §2 `sweep` 行词表收正（见 §2.4 行 A6——一致性收正，零新语义）。

### 2.3 机制设计（摘要——单源 = 设计两档，本处只给指针）

- ① 判定 = `resolve(cwd)` 与路径根（`parse(p).root`）相等（win32 大小写归一）；**会话面**（无参 ∥ `tui` ∥ `chat` ∥ `acp`）⇒ 一行提示 + `process.exit(1)`；其余面一律放行（判定式 = 会话集成员）；无强开旗。落点 = `thincoder-cli/bin/thincoder.mjs` argv 解析后 ∥ TUI 包装块前（非 shim——理由与兄弟进程面处置见 `docs/cli/design/CLI-ENTRY.md` §1）。
- ② 名表补六名（精确 basename）+ `SKIP_DIRS_FOLD`（win32 折叠子集）+ `SKIP_DIR_PREFIXES = ["bazel-"]`；判定收正 = **族分折**（垃圾族 win32 折 ∥ 位置族全平台精确 ∥ POSIX 一律精确——父侧 2026-10-08 裁定；落 `isSkippedRelPath` 单源——四消费面零改）；`bin` 不收。负例集 ∥ 读数 ∥ 收敛二路 = `docs/core/design/MEMORY.md` §6.14 面 ④。

### 2.4 受影响文件与测试面（逐项动作 → file:line 落点 → 预期结果）

| # | 动作 | 落点（as-of 2026-10-08 实读 · 行数 = wc -l 口径；delta = 本批预计变更量） | 预期结果 |
|---|---|---|---|
| A1 | 新建判定纯函数档 | `thincoder-cli/bin/disk-root-gate.mjs`（新建——本批 **+≈35 行**（全新增面）） | `diskRootGateError({ command, cwd, platform })` ⇒ `null` ∥ 一行文案；会话集常量同居 |
| A2 | 门接线 | `thincoder-cli/bin/thincoder.mjs:40` 后（∥ 包装块 `:44` 前；现 180 行 · 本批 **≤+8 行**——import 1 + 接线段；结构不变） | 会话面盘根 ⇒ stderr 一行 + `exit 1`；其余行为零改（含包装链与 `--tui-wrapped` 子进程） |
| A3 | 名表 + 折叠子集 + 前缀常量 + 自注收正 | `thincoder-core/memory/schema.mjs:44-57`（现 470 行 · 本批 **≤+15 行**——常量三表 + 自注收正；结构不变） | `SKIP_DIRS` 补 `vendor ∥ Pods ∥ bower_components ∥ third_party ∥ obj ∥ out`；新增 `SKIP_DIRS_FOLD`（垃圾族）∥ `SKIP_DIR_PREFIXES`；`:44-45` 自注改族分折语义句 |
| A4 | 谓词（族分折 ∥ 前缀） | `thincoder-core/memory/file-walk.mjs:22-27`（现 112 行 · 本批 **≤+12 行**——谓词扩支 + 平台入参；结构不变） | `isSkippedRelPath(rel, platform = process.platform)`——精确 ∨ 前缀（POSIX 字面 ∥ win32 折）∨（win32 ∧ 折叠子集）；四消费面零 diff（`file-walk.mjs:94` ∥ `:97` · `file-list.mjs:81` · `code-sync.mjs:98` ∥ `:249`） |
| A5 | 批内件（单测） | `docs/batches/2026-10-08-diskroot-gate-index-excludes.test.mjs`（新建——本批 **+300–500 行量级**（随例数）） | 谓词矩阵双道（win32 ∥ POSIX——正例 ∥ 判假围栏）· 门矩阵（命令面 ∥ 根矩阵）· 子进程 e2e（卷根 cwd：`node bin/thincoder.mjs` ⇒ 一行 + exit 1；同 cwd `-v` ⇒ 照常——沙箱 HOME 纪律照 CLI-ENTRY §3）· git ∥ walk 双径夹具（新名同剪） |
| A6 | 词表随动（一致性收正 · 已披露） | `docs/cli/design/CLI-ENTRY.md:43`（`sweep` 行 · 已落——设计轮随动；源码面 ±0） | 补 `--path <sub>`——实装早已在位（`thincoder-cli/src/cli/memory-command.mjs:85` ∥ `parseSweepArgs` · 2026-09-30 #693 落；词表 as-of 2026-09-25 未随动） |
| A7 | 清算执行（ops——已落 · §2.5） | 见 §2.5（源码面 ±0） | 执行后新名段命中 = 0（执行时读数） |

**零 diff 面（在册 · 各 ±0 行）**：`file-list.mjs`（89 行）· `code-sync.mjs`（286）· `docs.mjs`（234 行）· `sync-tail.mjs`（81 行）· `bin/thincoder.cjs`（6）· `src/tui/wrapped-spawn.mjs`（58）——②全经单源随动。

### 2.5 清算面方案（§1.5 · 顺序 ∥ 时机）

**前置读数 ∥ 执行状态**（设计轮实核 · 只读 2026-10-08 · 现值口径）：反斜杠变体 = **已折叠落定**（239 行 = 立案时存量 → 04:50 折叠；现值非归一行组 = 0）；`obj` ∥ `vendor` 存量 = **已清**（98 行 · 8 径 · fail=0——父侧 ops；§1.2 的 156 ∥ 40 = 立案时基线含盘根重复账）；freelist = 314,949 页（≈1.20 GiB@4k · page_count 815,427）。

1. **前置**：实施轮落盘（新名生效）→ ops 清算；全程以**执行时干跑读数**为准。
2. **步 ① 折叠复核**：已落定（现值零残留）——复核 `memory sweep`（全扫）干跑零命中即结案；若再出变体 ⇒ 复核后 `--confirm`（折叠零丢失）。
3. **步 ② obj ∥ vendor 剪枝**：**已清**（98 行 · 8 径 · fail=0——父侧 ops）。
   防回流复核 = 逐前缀干跑（`thincoder memory sweep --origin "D:/teamcode" --path <p>`，`<p>` ∈ 首探 8 径：
   `thinworker/src/ThinWorker.App/obj` ∥ `thinworker/src/ThinWorker.Core/obj` ∥ `thinworker/tests/ThinWorker.Core.Tests/obj` ∥ `thinworker/tools/*/obj` 四径 ∥ `oh-my-pi/crates/vendor`）——零命中 ⇒ 零写；新产物回流时按同命令再剪（备份先行 · 干跑默认——§6.13 安全三件）。
   **时机注意**：新名生效后首趟全量同步（walk 起点 = 每趟全量）对残余残留再收敛一遍——干跑零命中即「已收敛」凭证。
4. **步 ③ 压实 VACUUM**——✅ **已落（2026-10-08 父侧 ops：3185.3 ⇒ 1952.2 MiB · 省 1233 MiB · freelist = 0；9 枚历史备份已清、留 1 锚）。

执行分工 = **父侧 ops**（步 ① ∥ ② ∥ ③ 已由父侧落定——本档记现值）。

### 2.6 验收对照（判定句 → 机检形 · 三方一致链 = 需求档 ∥ 设计档 ∥ 本表）

| 判定句 | 机检形（可机检形落批内件 A5；ops 腿落 §2.5） |
|---|---|
| N10 会话面硬拦 | ① `diskRootGateError` 根矩阵：win32 `D:\` ∥ `d:\` ∥ `D:/` ⇒ 一行文案；`D:\teamcode` ⇒ `null`；posix `/` ⇒ 文案；`/home/*` ⇒ `null`；UNC 根 ⇒ 文案 ∥ 子 ⇒ `null`；② 子进程 e2e：卷根 cwd（子进程 `cwd` = 当前卷根——可移植）+ `node bin/thincoder.mjs` ⇒ stderr 恰一行 + exit 1 |
| N10 维护面放行 ∥ 无强开旗 | 命令面矩阵：`-v` ∥ `--help` ∥ `memory` ∥ `upgrade` ∥ `completion` ∥ `session *` ⇒ 判 `null`（放行）；无强开旗（结构性：入参无旗标面）；同 cwd `-v` e2e ⇒ exit 0 |
| F-S9 判真 ∥ 判假 | 谓词矩阵双道（族分折版 47 例）：垃圾族正例（精确 ∥ 任意深度 ∥ win32 变体）∥ 位置族正例（精确拼写）判真；判假围栏（近似名 ∥ 前缀护栏 ∥ 位置族变体（win32 同锁）∥ 垃圾族 POSIX 变体 ∥ `bin` ∥ 文件名形）判假 |
| F-S9 三路同谓词 | 行为双径夹具：非 git（walk）∥ git（`ls-files`）同剪；`/reindex` 链经同谓词（cmd-reindex → codeSync ∕ docSync → `listProjectFiles`） |
| F-S9 存量清算 | `--path` 干跑 = 仅命中行动作 `delete`；`--confirm`（沙箱库）⇒ 命中行 0 ∧ 非命中行逐键不变 ∧ 备份 `integrity_check` ok；**实库 = 已清**（obj ∥ vendor 现值 0——父侧 ops；防回流复核见 §2.5） |
| N-S7 零回归 | POSIX 逐例与收正前相等（除新名）；未收名（如 `output` ∥ `bin`）双道判假逐例锁 |
| N-S7 零误剪 ∥ 同名合法面 | 判假围栏读数（47 例矩阵零不一致）+ 同名合法面登记（443 行——族分折下**不剪**） |

### 2.7 关键决策（否决备选在册——全量 = 设计两档）

- ① 落点 = `bin/thincoder.mjs` 首段（**否决 shim**：版本门居 shim 因运行时依赖（旧 Node 不能求值 ESM 链）；本门零 API 依赖，落 .mjs 单点消费既有 argv 解析且同盖直跑 ∥ 包装子进程——shim 方案需 CJS 侧复制命令分类 + `--tui-wrapped` 剥离，收益零）。文案 = 英文一行（**否决 i18n 键**：入口面单语先例 ∥ 核域容器键冻结契约不涉本面）。退出口 = `process.exit(1)`（同版本门先例）。
- ② 名表 = 精确 basename + `bazel-` 前缀（**否决逐名枚举**——便捷目录含工作区名不可穷举）；判定 = **族分折**（垃圾族 win32 折 ∥ 位置族全平台精确 ∥ POSIX 一律精确——父侧裁；**否决全表折**——实核误剪合法同名面 443 行；**否决全平台折** ∥ **否决维持全精确**——F-S9 源起面）；折叠**不扩至路径键**（§6.11 口径——两回事）；**收尾口径零改**（**否决加 `excludePaths` 同款保护位**——声明（用户）≠ 内建名单（产品））。

### 2.8 上抛项（决策级——已发 notify · 同日裁定闭环）

**② 折叠范围——已裁（父侧 2026-10-08）：族分折**（垃圾 ∕ 产物族 win32 折 ∥ 位置族全平台精确 ∥ POSIX 一律精确）。证据 = 本批实核：全表折会误剪合法同名面 443 行（本仓 `thincoder/docs/desktop/**` 286 ∥ `opencode/packages/desktop` 98 ∥ `openclaw` 44 ∥ `library` 15）——设计倾向即此（已采纳）；需求档 F-S9 收正句已由父侧落（族分折口径）。设计两档已按此定稿（面④ 裁决段 + L-⑤ ∕ D-MEM32 ∕ 本节同轮收正）。
**未列名备忘（族单收口）**：`.git` = 点段规则覆盖（行为零变——折与不折不影响判定）；`Application Data` 未列于裁单两族——按语义归位置族（与 `AppData` 同类）。

**读数闭环（原上抛两条——父侧已收正）**：① 反斜杠变体 239 = 立案时存量——已 04:50 折叠落定（现读非归一行组 = 0）；② `obj` ∥ `vendor` 存量已全清（98 行 · 8 径 · fail=0）——§1.2 的 156 ∥ 40 为立案时基线（含盘根重复账），§1 ∕ §2.5 已按现值口径修正。

**设计评审修正轮（§3 轮次 1 发现 1–6 · 父侧逐条裁定接受 · 2026-10-08 · eng-designer）**

- **F1（🟡 · §2.4 delta 注记）**：§2.4 表头补 delta 口径句；A1–A7 逐行补「现行行数 + 本批 delta」注记——A2 **≤+8 行** ∥ A3 **≤+15 行** ∥ A4 **≤+12 行**；A1 ∥ A5 新建面全新增（**+≈35 行** ∥ **+300–500 行量级**（随例数））；A6 ∥ A7 源码面 **±0**（A7 状态词随 §2.5 现值收正：仅方案 ⇒ 已落）；零 diff 面补 `docs.mjs`（234 行）∥ `sync-tail.mjs`（81 行）两读数 + 「各 ±0」标注——**§2.4 块内收正**。
- **F2（🟡 · 枚举对账）**：`docs/core/design/MEMORY.md` §6.14 面④ 补「两族枚举 + `.git` 单列 = `thincoder-core/memory/schema.mjs:46-57` 常量逐名对齐的全集（18 ∥ 20 ∥ 1 = 39 名）」+ `.git` 处置点名（点段规则覆盖——`file-walk.mjs:26`；行为零变）。
- **F3（🔵 · `bin` 读数时点注）**：同档面④ 设计轮读数 `bin` = 45 行补时点注（**清后现值**；立案时 82 = 含盘根重复账）——同 `docs/core/requirements/MEMORY.md` §4.11 行注（父侧同轮已落）同口径。
- **F4（🔵 · 文案逐字钉 + 直测腿）**：`docs/cli/design/CLI-ENTRY.md` §1 门条——文案字面串逐字钉 + 输出流（**stderr**）+ 退出码（`process.exit(1)`）+ 直测腿登记（`diskRootGateError` 直调 ∥ 子进程 e2e——载体 = 实施轮批内件（拟新增））。
- **F5（🔵 · 已知限制登记）**：同档 §1 登记盘根 + 显式 `reindex` ∥ `sync` 索引面残留（需求未圈——后续批或需求侧可取）。
- **F6（🔵 · 档头随动）**：同档档头配对需求行随动列 **§3 N10**。
- **附带（形式面 · 零语义 · 随轮披露）**：MEMORY.md §6.14 面④ 边界行折行（303 字符 ⇒ ≤300——**doc-check 行宽由 1 红转绿**）；两档变更记录各增修正轮条目。**零机制改**（产品码 ∥ 测试件 ∥ 需求档零触）。
- **复核**：doc-check 复跑 exit 1 ⇒ 0（行宽命中 1 ⇒ 0；锚悬空恒 **0**；本批三档 ✗ 列报集不变）。

**实施后随动修正轮（§5 上抛 ① ∥ ② · 父侧裁定采纳 · 2026-10-08 · eng-designer）**

**来源** = §5.5 上抛①（设计两档引程失位——本批合法 delta 所致）+ 上抛②（前缀支文件名面）；**父侧裁定 2026-10-08 = 采纳**（① 改指现行坐标；② 接受面登记——不窄化机制 ∥ 负例表零改）。**坐标基准 = 实施后实读**（A2 `thincoder.mjs` 188 ∥ A3 `schema.mjs` 482 ∥ A4 `file-walk.mjs` 124——§5.1 读数 ∥ §2.4 delta 注记）。**处置 = eng-designer 直接落笔**（设计两档 = 本人笔域；非新设计轮）。**本轮边界 = 机制语义零改 ∥ 产品码零触 ∥ 需求档零触 ∥ 批档 §1/§3/§4/§5 零触**（处置面 = 设计两档活档面 + 本块）。

**① 引程改指（全档清点：三文件名 grep + 逐处归因复核——失效者逐一改指 ∥ 未失效者零动）**

| 号 | 档 ∥ 行 | 前 ⇒ 后 | 实读命中（现行） |
|---|---|---|---|
| 1 | `docs/core/design/MEMORY.md:367` | `schema.mjs:314-327` ∥ `:353-365` ∥ `:404-420` ⇒ `:334-347` ∥ `:373-385` ∥ `:424-440` | 三建表块（code_chunks ∥ doc_chunks ∥ files——PK 列 NOT NULL 取证面） |
| 2 | `MEMORY.md:467` | `schema.mjs:70` ⇒ `:84` | `PRAGMA journal_mode = WAL` exec |
| 3 | `MEMORY.md:471` | `schema.mjs:69-71` ⇒ `:90-91` | `journal_size_limit` ∥ `wal_checkpoint(TRUNCATE)` exec |
| 4 | `MEMORY.md:475` | `schema.mjs:15` ∥ `:71` ⇒ `:19` ∥ `:85` | `SQLITE_BUSY_TIMEOUT` 声明 ∥ `busy_timeout` exec |
| 5 | `MEMORY.md:489` | `schema.mjs:344-359` ⇒ `:356-371` | code_chunks FTS 触发器块（`ai ∕ ad ∥ au`） |
| 6 | `MEMORY.md:533` | `file-walk.mjs:94` ∥ `:97` ⇒ `:106` ∥ `:109` | walk 双守卫（目录展开 ∥ 文件守卫） |
| 7 | `MEMORY.md:552` | `schema.mjs:61-72` ⇒ `:80-91` | `createMemory` 开库段（含 checkpoint） |
| 8 | `MEMORY.md:576` | `schema.mjs:46-57` ⇒ `:48-61` | `SKIP_DIRS` 常量块 |
| 9 | `MEMORY.md:582` | `file-walk.mjs:22-27` ⇒ `:27-39` | `isSkippedRelPath`（签名 + 体） |
| 10 | `MEMORY.md:586` | `schema.mjs:46-57` ∥ `file-walk.mjs:26` ⇒ `:48-61` ∥ `:34` | 常量块 ∥ 点段规则行（`seg.startsWith(".")`） |
| 11 | `MEMORY.md:587` | `schema.mjs:44-45` ⇒ `:44-47` | 表头自注（随批 2 行 ⇒ 4 行） |
| 12 | `MEMORY.md:591` | `file-walk.mjs:94` ∥ `:97` ⇒ `:106` ∥ `:109` | walk 双守卫（同 6 号） |
| 13 | `docs/cli/design/CLI-ENTRY.md:26` | `:38-40` ∥ `:44` ⇒ `:41` ∥ `:52` | argv 解析末行（`[command, ...args]`） ∥ TUI 包装块（`if` 开行） |

**计数 = 13 行 ∥ 20 坐标**（改后逐处实读命中）。父侧映射五处逐处实读复核一致；另 8 行为**全档清点补获**——其中 `:367` 三坐标含**本批前既有偏移（−8）**（按描述面〔建表块〕改指现行，非仅随本批位移）。

**② 接受面登记（零机制改）**：`MEMORY.md` §6.14 面④「误剪接受面」句尾补词条——**`bazel-` 前缀对文件名同判**（前缀支作用于任意路径段——`bazel-<名>` 文件名同剪）——一并登记为已接受（零现值影响：实仓 glob ∥ 实库读数 `bazel-*` 命中 = 0）。**负例表零改**（负例 6 仍只锁精确名文件名形）。

**记录面残留（不属改指面——as-of 引用保留 · 逐一列明）**：`MEMORY.md:30 ∥ :36 ∥ :55`（迁移期引文——含 `src/memory/schema.mjs:9,68` 旧路径；§2 ∥ §3.1 = 自 CORE-UNIFICATION「搬入 · 逐字」）；`MEMORY.md:764 ∥ :826`（变更记录日期条目——修正轮 1 ∥ 2026-09-30 轮时点坐标；同 `:727` 行既有「时点坐标——实现面随演进」口径）。

**读回证据（改后实读）**：① 旧坐标 grep——活档面零残留（`314-327 ∥ 353-365 ∥ 404-420 ∥ :69-71 ∥ 344-359 ∥ 22-27 ∥ 44-45 ∥ 61-72 ∥ 38-40` 零命中；`schema.mjs:46-57 ∥ file-walk.mjs:26 ∥ :91` 仅存记录面两处——上列）；② 新坐标 20 ∕ 20 逐处实读命中；③ `doc-check` 复跑 = **exit 0（不劣化）**——OK(锚) 悬空 0 ∥ OK(行宽) 零超宽（面④ 补词条随落折行：376 ⇒ 276 ∥ 103 字符；变更记录条目 296）；候选 +3（新增批次档 ∥ 档引程——全解析，悬空 0 不变）。

**披露**：ⓐ 新发现（不扩清单——已 notify 父侧）：`MEMORY.md:106` `SCHEMA_VERSION = 9` 与现值 10 不符（非坐标引用面——路由归父侧）；`CLI-ENTRY.md:7` 论域行数读数 178 = as-of 2026-09-29 时点值（非坐标面——零动）。ⓑ 两档变更记录各增随动轮条目（承 2026-09-30「实施后随动轮」先例——随轮披露）。ⓒ 全档清点读法 = 三文件名 grep + 逐处归因复核（含裸坐标形态排查——无漏项）；`CLI-ENTRY.md:27` `wrapped-spawn.mjs:48` 非清单三文件面——顺带实读在位，零动。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

对象 = 盘根启动门（CLI-ENTRY §1）+ 索引排除名单补强（MEMORY §6.14 面④ + L-⑤ + D-MEM32）；评审限制：未声明项目标准档、无文档地图——Document ownership ∥ 方法论合规按 Project Guide（AGENTS.md）+ 档内既有纪律评估（降级）。结论：需求覆盖（FEATURES.md §3 N10 ∥ core/requirements/MEMORY.md §4.11 F-S9 ∥ N-S7）逐条可对上；两档各改各的主（CLI-ENTRY §1 ∥ MEMORY §6.14 + §7 D-MEM32）；无 🔴。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 受影响文件尺寸注记（criterion 8） | 🟡 | 本批两档均未载受影响源档的现行行数与预计 delta——改点档（`thincoder-cli/bin/thincoder.mjs`（`CLI-ENTRY.md:26`「落点 = `thincoder-cli/bin/thincoder.mjs` argv 解析（`:38-40`）之后 ∥ TUI 包装块（`:44`）之前」）∥ 新档 `thincoder-cli/bin/disk-root-gate.mjs`（`CLI-ENTRY.md:28`「新档 `thincoder-cli/bin/disk-root-gate.mjs`（拟新增）」）∥ `thincoder-core/memory/schema.mjs`（`MEMORY.md:576`「声明面 = `thincoder-core/memory/schema.mjs:46-57`」）∥ `thincoder-core/memory/file-walk.mjs`（`MEMORY.md:582`「落 `thincoder-core/memory/file-walk.mjs:22-27` 的 `isSkippedRelPath`」））无「≤±N」∥「结构不变」注记；档内唯一行数读数为 as-of 2026-09-29 的论域文件计数（`CLI-ENTRY.md:9`「读数 as-of 2026-09-29 实读」），不覆盖本批 delta；落点表被指向批档 §2（`CLI-ENTRY.md:94` ∥ `MEMORY.md:81`「（唯一承载面——一次性批次材料）」），批档不在本评审 scope ⇒ 不可核 | 落点表逐档补「现行行数 + `≤±N` ∥ 结构不变」注记（含测试载体档名）；若批档 §2 已承载，本档面留一句指针即足 |
| 2 | Clarity | 🟡 | `SKIP_DIRS_FOLD` 声称为「**win32 折叠子集** = 垃圾 ∕ 产物族全列」（`MEMORY.md:579`），但两族枚举未与 §6.4 既有描述面对齐：垃圾族枚举（`MEMORY.md:583`「（`node_modules` ∥ `dist` ∥ `build` ∥ `.turbo` ∥ `coverage` ∥ `__pycache__` ∥ `.venv` ∥ `venv` ∥ `target` ∥ `.next` ∥ `.nuxt` ∥ `.svelte-kit` ∥ 新六名）」）∥ 位置族枚举（`MEMORY.md:584`）皆未含 `.git`，而 §6.4 句「跳过 `SKIP_DIRS`（node_modules / .git / dist / build / coverage / 系统目录等）与点目录」（`MEMORY.md:166`）把 `.git` 列在 SKIP_DIRS 括注内——`.git`（及任何未枚举既有名）的折叠归类未定；L-⑤ ① 的「垃圾族正例（精确 ∕ 任意深度 ∕ win32 大小写变体）」（`MEMORY.md:637`）按族枚举落 ⇒「全列」边界不可机判 | 补一句「两族枚举 = 与 `schema.mjs:46-57` 常量逐名对齐的全集」（或点名 `.git` 走点目录 ∥ 精确 ∥ 折叠哪一路），使「全列」可核 |
| 3 | Numeric drift | 🔵 | `bin` 段命中读数两档不一致：需求档「`bin` 命中 82 行」（`docs/core/requirements/MEMORY.md:226`）vs 设计档「`bin` = 45 行（不进排除表——零触碰）」（`MEMORY.md:609`）——同日（2026-10-08）两读数；设计档自注「库活跃——读数为时点值」，但两数未对账 | 对齐两读数口径 / 时点（或标一处为失效读数） |
| 4 | Acceptance criteria | 🔵 | 盘根门无「逐字可断」面登记：文案只到「文案 = 英文一行」（`CLI-ENTRY.md:29`），未钉字面串 / 输出流（stdout ∥ stderr）；本档 §4 机检形射程 =「本三例 = **窄射程锁**（sweep 旗标 + 顶层 `ledger` 词）」（`CLI-ENTRY.md:80`）不含本门；需求侧提示语义 =「一行提示（先进工作目录再启动）+ 非零退出」（`FEATURES.md:180`） | 钉可断言的文案 token（含「先进工作目录再启动」语义）+ 流 + 退出码，并登记一条直测腿（`diskRootGateError` 直调 ∥ 子进程真机腿） |
| 5 | Scope（已知限制登记） | 🔵 | 盘根放行面含显式 `reindex` ∥ `sync`（判定式 = 会话集成员——「其余面一律放行」`CLI-ENTRY.md:24`；命令行 `CLI-ENTRY.md:48`）——`reindex` 经同链触发 `codeSync` ∕ `docSync`（`MEMORY.md:591`「`/reindex` 面（`thincoder-cli/src/tui/cmd-reindex.mjs` → `codeSync` ∕ `docSync` → `listProjectFiles`）」），盘根下仍可达 N10 动机面「动机 = 盘根启动 ⇒ 全盘索引」（`FEATURES.md:180`）；需求未点名该面（N10 只圈会话面），设计循需求，属残留面 | 登记一条已知限制 / 后续项（盘根 + 显式 `reindex` ∥ `sync` 的索引面），后续批或需求侧取用 |
| 6 | Doc-state（指针随动） | 🔵 | CLI-ENTRY 档头配对需求行未随动：档头仍写「§2.13 对外文档契约面 + §3 N9」（`CLI-ENTRY.md:4`），而 §1 门条正文已引「含 N10 点名的信息维护面」（`CLI-ENTRY.md:24`） | 档头配对需求档行随动列 §3 N10（门的需求锚） |

**out-of-scope note**：CLI-ENTRY §2 `sweep` 行词表收正（2026-10-08 同批随动——`CLI-ENTRY.md:97` 变更记录「§2 `sweep` 行补 `--path <sub>`」）属本批改动，但不在对象声明的 target（「盘根启动门（CLI-ENTRY §1）」）内；声明 exclude 的理由「本文档其他节——非本批改动面」与该档变更记录不符。无严重度，登记备查。

VERDICT: pass
计数：🔴 0 ∥ 🟡 2 ∥ 🔵 4（合计 6）

## §4 用户批准（主 agent）

### 4.1 批准（代签 · 主 agent 2026-10-08）

**依据** = 用户 2026-10-08「后续自动跑完」（全链授权）+ 三条件齐备：

1. **评审 pass · 0 🔴**——§3 轮次 1（🟡2 ∥ 🔵4；六条已逐条裁定接受）；
2. **修正落定并核验**——修正轮六条逐条落（§2 尾记录块）；父侧抽读核验：`CLI-ENTRY.md:4`（档头 N10）∥ `:29-30`（文案逐字钉 + stderr + exit 1 + 直测腿）∥ `:32`（已知限制登记）∥ `MEMORY.md:586`（39 名对账 + `.git` 点名）∥ `:610`（`bin` 时点注）∥ `:616-617`（折行）∥ §2.4（A1–A7 delta 注记）——逐处实读在位；
3. **token 已签发**（评审 Approved 回执；credential 值不入档）。

**批准范围** = 本批 §2 任务书（A1–A7）——实施轮（eng-coder）按 §2.4 落点表落盘；需求档（F-S9 ∥ N-S7 ∥ N10）三处判定句为验收基准（§2.6 对照表）。

**附**：`bin` 口径以 §1.4「不进排除表（保持入索引）」为准；族分折以 §2.7 裁决为准；参考系政策 ∥ 家目录 ∥ 全折面 = 本批不做（§2.1）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（批内件 9/9 绿 ∥ 内部审计 clean ∥ 代码评审轮 1+2 双 pass（0 🔴）∥ 四消费面与 shim 零 diff）

### 5.1 逐落点（file:line 前 ⇒ 后 · delta 口径 = `wc -l`）

| # | 动作 | 落点（前 ⇒ 后） | 读数 |
|---|---|---|---|
| A1 | 新建判定纯函数档 | `thincoder-cli/bin/disk-root-gate.mjs`（新建） | 35 行（≈35 ✓）；导出 `SESSION_COMMANDS` ∥ `DISK_ROOT_MESSAGE` ∥ `diskRootGateError({ command, cwd, platform })` |
| A2 | 门接线 | `thincoder-cli/bin/thincoder.mjs` 180 ⇒ 188（**+8 ≤ +8** ✓） | import `:29`（1 行）+ 接线段 `:43-:48`（argv 解析 `:41` 后 ∥ TUI 包装块 `:52` 前）；输出流 stderr + `process.exit(1)` |
| A3 | 名表 + 折叠子集 + 前缀 + 自注收正 | `thincoder-core/memory/schema.mjs` 470 ⇒ 482（**+12 ≤ +15** ✓） | `SKIP_DIRS` `:48-61`（39 名 = 既有 33 + 新六）∥ `SKIP_DIRS_FOLD` `:63-67`（18）∥ `SKIP_DIR_PREFIXES` `:69` |
| A4 | 谓词（族分折 ∥ 前缀） | `thincoder-core/memory/file-walk.mjs` 112 ⇒ 124（**+12 ≤ +12** ✓） | 签名 `:27` + 判定体 `:28-39`；四消费面零 diff（`file-list.mjs` ∥ `code-sync.mjs` git diff 零命中；walk 双守卫 `:106` ∥ `:109` 单源随动） |
| A5 | 批内件（单测） | `docs/batches/2026-10-08-diskroot-gate-index-excludes.test.mjs`（新建） | 425 行（+300–500 ✓）；L1–L9 九腿 |
| A6 | 词表随动 | 设计轮已落——本批零触（±0 ✓） | — |

**实现要点**：唯一实现细节补充 = `file-walk.mjs:16` 派生 `SKIP_DIRS_FOLD_LOWER`（win32 折叠索引——`Pods` 类混合大小写名须双侧归一；设计「折叠命中」语义的实现形，非语义改）。**设计偏差 = 零**（判定式 ∥ 文案逐字 ∥ 会话集 ∥ 落点 ∥ 名表两族 ∥ 前缀单源 ∥ `.git` 点段规则均按设计单源落）。

### 5.2 验收读数（命令 + 结果）

- `node --test docs/batches/2026-10-08-diskroot-gate-index-excludes.test.mjs` ⇒ **9/9 pass（0 fail）**（L1–L9；总 2.3s）；
- `node --check` × 5 档（四产品档 + 批内件）⇒ **OK ×5**；
- 四消费面 git diff：`git diff --numstat -- thincoder-core/memory/file-list.mjs thincoder-core/memory/code-sync.mjs` ⇒ **空（零命中）**；shim `bin/thincoder.cjs` 零触（`diskRootGate` 全仓仅 `thincoder.mjs` ∥ 新档两处）；
- 文案逐字：返回串 = `CLI-ENTRY.md:29` 定稿（含 em dash U+2014）；e2e 卷根 cwd ⇒ stderr 恰一行 + exit 1 ∥ 同 cwd `-v` ⇒ exit 0（L3）；
- delta：A1 35 ∥ A2 +8 ∥ A3 +12 ∥ A4 +12 ∥ A5 425 行——**全在 §2.4 注记内**；
- 仓套件：未跑（归父侧收口——纪律）。

### 5.3 审计与代码评审轮次与终态

- **内部审计（explore · 只读）**：轮 1 ⇒ **clean**（四类偏差零发现；§2.6 七行全覆盖、计数 11 ∥ 47 ∥ 39 对账一致、禁止面语义零命中）。
- **代码评审（advisor）**：轮 1 = **pass**（0 🔴；1 🟡 报告态 + 5 🔵）；fix 轮 ⇒ 轮 2 = **pass**（2 Fixed ∥ 2 Accepted ∥ 2 Unfixed 非阻塞；fix 未引入新 🔴）。
- **终态**：**clean**。

### 5.4 fix 轮（评审条目逐条处置）

| 评审项 | 处置 |
|---|---|
| 🟡 设计两档引程失位（`schema.mjs:46-57` ⇒ 现行 `:48-61`；`file-walk.mjs:22-27`/`:26`/`:94∥:97` ⇒ 现行 `:27-39`/`:34`/`:106∥:109`；CLI-ENTRY `:38-40`/`:44` ⇒ 现行 `:41`/`:52`） | **不自行改设计（禁触面）——上抛**：建议父侧随动轮改指现行落点或加 as-of 标记（report-only，不阻塞） |
| 🔵 A2 行数读数（"189 行/末行空" vs ≤+8） | **复核关闭**：读具 "lines total" = `wc -l` + 1（尾行虚影；两锚校准 = `file-list.mjs` 89⇒90 ∥ `thincoder.cjs` 6⇒7）⇒ 本档 `wc -l` = 188 = 180 + 8 ✓ |
| 🔵 前缀支作用于文件名（`bazel-*.md` 类被剪） | **上抛**（零实例——glob `**/bazel-*` 零命中；建议面④负例表补一行登记为接受面 ∥ 前缀判据收窄——机制面改动归设计轮） |
| 🔵 L7 ① 射程窄于判据句（"产品码内"） | **已修**：新腿 ①b 全产品树锁两新名引用面（= `schema.mjs` 定义 + `file-walk.mjs` 消费恰两档）；`SKIP_DIRS` 直用面收窄理由入腿注 |
| 🔵 L6 git 径依赖宿主全局配置 | **已修**：repo-local `core.excludesFile` ⇒ 空档（覆盖全局）——夹具判定只依赖夹具 |
| 🔵 残留面（盘根 + `reindex` ∥ `sync`） | **确认**（`CLI-ENTRY.md:32` 在册、循需求 N10 不拦——零动作） |

### 5.5 披露（偏差 ∥ 未竟 ∥ 上抛）

- **偏差**：零；
- **未竟**：无（A6 设计轮已落；§2.5 清算 ops 已由父侧落定）；
- **上抛**：① 设计两档引程随动（5.4 第 1 行）；② 前缀族文件名形负例登记（5.4 第 3 行）；③ out-of-scope：`thincoder-core/memory/code-index.mjs:5` 死导入（`SKIP_DIRS` 全档无消费点；不在本批落点/零 diff 面——登记备查）。
- **行数口径**：本表 delta = `wc -l`；读具注记 = 本值 + 1（尾行虚影）。

## §6 验证与收口（父代理）

### 6.1 终验读数

- **批内件（父侧亲跑）**：`node --test docs/batches/2026-10-08-diskroot-gate-index-excludes.test.mjs` = **9/9 pass · 0 fail**（L1 门根 11 例 ∥ L2 命令面 ∥ L3 子进程 e2e ∥ L4 谓词 47 例双道 ∥ L5 名表 39 名 ∥ L6 git ∥ walk 双径 ∥ L7 单源结构 ∥ L8 sweep 沙箱 ∥ L9 零回归）。
- **产品码父侧抽读核验**：`disk-root-gate.mjs`（35 行——判定 ∥ 文案 ∥ stderr ∥ exit 1 逐行核）∥ `thincoder.mjs:29 ∥ :43-48`（接线位 = argv 后 ∥ 包装前 ✓）∥ `schema.mjs:44-69`（6 名 + 折叠 18 + 前缀 ✓）∥ `file-walk.mjs:16 ∥ :27-39`（族分折逐支 ✓）。
- **零 diff 面复核**：`file-list.mjs` ∥ `code-sync.mjs` ∥ `sync-tail.mjs` ∥ `docs.mjs` ∥ `thincoder.cjs` ∥ `wrapped-spawn.mjs` —— git 面零命中 ✓。
- **delta**：A1 35 ∥ A2 +8（188）∥ A3 +12（482）∥ A4 +12（124）∥ A5 425 行——全守 §2.4 注记。
- **机检**：`doc-check` exit 0（锚 0 ∥ 行宽 OK）∥ `api-contract --check` 漂移 ⇒ `--write` 后**零漂移（3290 条 · 720 档**，+361/−306——累计漂移 + 本批新导出；机械 · 可 revert）。
- **随动修正轮（§5 上抛闭环）**：设计两档引程 **13 行 ∥ 20 坐标**改指现行（全档清点——含本批前既有偏移 8 处一并收正）；`bazel-` 前缀文件名面 = 接受面登记；记录面 as-of 残留 2 类 5 处 = 列明保留（记录面性质）。

### 6.2 D7 结算清单

- 角色表：§1 主 agent ∥ §2 eng-designer（设计 + 修正轮 ×2）∥ §3 评审子代理（轮 1 · pass）∥ §4 主 agent（代签）∥ §5 eng-coder ∥ §6 父代理 ✓。
- 状态行：§1 → 已收口（随 close）∥ §2 设计完成 ∥ §5 实施完成。
- 计数：批内件 9 腿全绿；评审 🔴0 · 🟡2 · 🔵4（六条全收）；修正轮 2 轮（6 条 + 2 项 + 清点 13 行 ∥ 20 坐标）；台账 #1080 ∥ #1081 → 核销（两段式）；#1091 在册。
- 指针：档头前情指针 ✓；台账指针 ✓；设计两档坐标改指后旧坐标活档面零残留 ✓。
- CHANGELOG = 归发版轮；需求档面已落（N10 ∥ F-S9 ∥ N-S7）。
- 前批遗留交叉核对：无（本批独立）。
- 父侧直接执行项（打标 · 可 revert）：① `api-contract --write` 机械刷新 ② `MEMORY.md:106` `SCHEMA_VERSION 9 ⇒ 10` 值收正（v10 = memory.db 家族批——计数面机械修正）③ 本 §6。
- 知情残留：① 设计记录面 as-of 引文 5 处（迁移期 ∥ 变更记录——记录面性质，零动）② `CLI-ENTRY.md:7` 读数 as-of 2026-09-29（零动）③ 盘根 + 显式 `reindex` ∥ `sync` 索引面 = 设计档登记残留（后续可取）。
- 清算面（§1.5 ∥ §2.5）：折叠 ✅ ∥ obj/vendor 98 行 ✅ ∥ VACUUM 1952.2 MiB ✅ ∥ 备份留 1 锚。

### 6.3 收口结论

全链闭合（设计 → 评审 pass → 修正 ×2 → 代签 → 实施 9/9 → 随动修正）——**#1080 ∥ #1081 核销；记录冻结**；收口序 = close → 台账两段式 → 提交双推 → token 消费。
