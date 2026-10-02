# 2026-10-01 · core 越线档拆分批（#755 context 455 ∥ #786 conventions 330 ∥ code-sync 458 ∥ docs 437）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 用户 2026-10-01 16:50「翻倍上量」令——台账 #755 ∥ #786（core 越线档拆分）。
> 台账 = #755 ∥ #786（core · 归批）。前情 = docs/batches/2026-09-30-cross-end-digest-recovery.md §6（已收口 2026-10-01）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**任务（父侧选批 · 用户 2026-10-01 16:50「翻倍上量」令）**：

core 越线档拆分（顾问线 300 行——纯结构搬 ∥ 零行为变）：
- `thincoder-core/context.mjs` **455**（#755——#726 已实质触碰（`pushRecord` 落盘）⇒ 触碰已至，拆分执行）；
- `thincoder-core/conventions.mjs` **330** ∥ `thincoder-core/memory/code-sync.mjs` **458** ∥ `thincoder-core/memory/docs.mjs` **437**（#786——`code-sync` 拆分候选面 = 四起效点/消费面族（`base` 换算面））。

**链**：设计（逐档拆点 + 新档命名 + 回线目标 + 量级对账）→ 评审 → 批准 → 实施 → 收口。
**判据**：拆分 = 纯结构搬 ∥ 行为零变 ∥ 导出面（如需）转口保名 ∥ API-CONTRACT 随重生成。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-01 · 四档（context ∥ conventions ∥ code-sync ∥ docs）拆点 ∥ 新档命名 ∥ 回线 ∥ 量级对账 ∥ 验证法已落；评审轮 1 修正块（1–6 采纳 ∥ 7 零动）已落档）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 一、本批条目（覆盖）· 判据 · diff 白名单

**覆盖（台账）**：**#755** `thincoder-core/context.mjs` **455** ∥ **#786** `thincoder-core/conventions.mjs` **330** ∥ `thincoder-core/memory/code-sync.mjs` **458** ∥ `thincoder-core/memory/docs.mjs` **437**——四档 = 本批全部射程（**四档外零扩**）。
**判据**：纯结构搬 ∥ 零行为变 ∥ 转口保名（如需）∥ API-CONTRACT 随重生成（父侧）。
**实施 diff 白名单（枚举外即判红）**：
① 原档删块（迁出块逐字）；② 原档新增 import / 转口行 + 迁出后未用 import 清理；③ 新档 = 迁出块逐字 + 头注 + 跨档被引**原私有面**的 `export` 关键字（`shrinkOversized` ∥ `buildDeclaration` ∥ `prefixContent` 等）；④ 批内件 `2026-09-29-tools-carryover-t4.test.mjs` SOURCES 表 2 行改指（见四）；⑤ 批内件 `2026-10-01-core-split-line.probe.mjs` 新增（验证物，见五）。
**设计档落点**：本批设计 = 本 §2（一次性方案，含验收）；**设计侧注册面**（`CORE-UNIFICATION.md` §2.8.1 / §2.6.3 ∥ `STRUCTURE-DEBT.md` #9 ∥ API-CONTRACT 生成区）随实施 / 收口轮更新——清单见三.3（本轮零动注册面；本批验收 = §2 落档 + 读回）。

### 二、四档拆分方案（拆点 ∥ 新档命名 ∥ 回线 ∥ 量级）

#### 2.1 `context.mjs`：455 → 主档 ≈271 ∥ 三新档（写缝 ∥ 回声 ∥ 降级）

**拆点（三面，皆叶节点——新档零回指主档，依赖图 = DAG）**：

| 面（职责） | 新档 | 迁出（逐字） | 迁出块 |
|---|---|---|---|
| 写缝面（消息双线写入单点） | `context-push.mjs` | `pushReal` ∥ `pushRecord` | `:74-117`（44 行） |
| 回声安全面（D-CC18/D-CC19 恢复面归并） | `context-echo.mjs` | `prefixContent` ∥ `withPlaceholderPrefix` ∥ `COMPACTION_PLACEHOLDER` ∥ `isAssistantEchoPair` ∥ `contentTextOf` ∥ `absorbEchoContent` ∥ `mergeAdjacentAssistantEchoes` | `:119-195`（77）+ `:37-38`（2） |
| 确定性降级面（无 LLM 有损收缩） | `context-degrade.mjs` | `pruneStub` ∥ `pruneStaleToolOutputs` ∥ `OVERSIZE_CONTENT_LIMIT` ∥ `shrinkOversized` | `:359-360` ∥ `:362-388` ∥ `:406-407` ∥ `:409-446`（计 69） |

**主档留**：压缩引擎（`SUMMARIZE_PROMPT` ∥ `COMPACTION_PREFIX` ∥ `COMPRESS_FAILURE_LIMIT` ∥ `TASK_REINJECT_PREFIX` ∥ `FALLBACK_NOTE` ∥ `focusBlock` ∥ `anchorText` ∥ `applyCompression` ∥ `compressIfNeeded` ∥ `compressFallback`）+ 转口块（`estimateTokens` ∥ explore-distill 既有两条 + 新增三条）。
**主档 import 增**：`{ COMPACTION_PLACEHOLDER, withPlaceholderPrefix }`（echo）· `{ shrinkOversized }`（degrade）。
**转口（保 import 面）**：`export { pushReal, pushRecord } from "./context-push.mjs"` ∥ `export { isAssistantEchoPair, mergeAdjacentAssistantEchoes } from "./context-echo.mjs"` ∥ `export { pruneStaleToolOutputs } from "./context-degrade.mjs"`。
**行数账**：455 = 主文块 263 + 迁出 192；拆后 ≈271+54+91+85 = **501**（Δ+46 = 头注 ∥ import ∥ 转口行）。
**回线目标**：主档 ≤300（预估 ≈271，余量 ≥29）；新档三档全部 ≤300。

#### 2.2 `conventions.mjs`：330 → 主档 ≈177 ∥ `declaration.mjs` ≈173

**拆点**：**声明装载面**外提——`RETIRED_REL_PATH`（`:50-51`）+ `:174-329` 全段（归一三器 ∥ `buildDeclaration` ∥ `DEFAULT_DECLARATION` ∥ `isExcludedRelPath` ∥ 缓存 ∥ `warnRetiredCarrier` ∥ `loadProjectDeclaration`）。
**分类裁判面原位不动**（`classifyPath` / `isCodePath` / `isDocPath` / `isTempPath` / `isAuxPath`——`PORTABILITY.md:26/:30/:67-72` 主体句字面保持真）。
**依赖向**：`conventions.mjs → declaration.mjs`（`hasCodeSegment` 缺省取 `DEFAULT_DECLARATION.codePaths`，`:129`）；反向零出边（无环）。
**转口**：`loadProjectDeclaration` ∥ `DEFAULT_DECLARATION` ∥ `isExcludedRelPath` ∥ `clearDeclarationCache` 经 `conventions.mjs` 转口（9 消费档 + 2 批内件零改）。
**行数账**：330 = 分类面 172（含头注 37）+ 迁出 158；拆后 ≈177+173 = **350**（Δ+20）。
**回线目标**：两档 ≤300（主档 ≈177 ∥ 新档 ≈173）。

#### 2.3 `memory/code-sync.mjs`：458 → 主档 ≈268 ∥ `memory/code-search.mjs` ≈138 ∥ `memory/file-list.mjs` ≈92

**拆点（两面外提）**：
- **检索面** → `memory/code-search.mjs`：`CODE_EMBED_BATCH` ∥ `codeSearch` ∥ `ensureCodeEmbeddings`（含并发锁 + `_runEnsureCodeEmbeddings`）∥ `codeSearchTool`（`:20` ∥ `:295-415`）。
- **清单面** → `memory/file-list.mjs`：`indexExtensions` ∥ `listProjectFiles`（`:25-38` ∥ `:135-198`）。

**主档留**：增量 / 全量 / 锚 / 单文件写面（`anchorKey` ∥ `gitSync` ∥ `codeSync` ∥ `markIndexedCommit` ∥ `reindexFile`）。
**四起效点（`isExcludedRelPath`·`base` 换算面）零改形**：`gitSync`（原位）∥ `listProjectFiles`（随迁，调用形 `(rel, decl, dir)` 逐字不动）∥ `reindexFile`（原位）∥ `sweepStaleRows` 消费面（经 `decl` 传递，不直调）。
**转口**：`codeSearch` ∥ `ensureCodeEmbeddings` ∥ `codeSearchTool` ∥ `listProjectFiles` ∥ `indexExtensions` 经 `code-sync.mjs` 转口（`memory.mjs` ∥ `memory/core.mjs` ∥ `advisor/loop.mjs` ∥ `memory/docs.mjs` 零改）。
**行数账**：458 = 主文块 260 + 迁出 198；拆后 ≈268+138+92 = **498**（Δ+40）。
**回线目标**：三档 ≤300（主档 ≈268，余量 ≈32）。

#### 2.4 `memory/docs.mjs`：437 → 主档 ≈223 ∥ `memory/memory-tool.mjs` ≈236

**拆点**：**memory agent 工具面**外提（`:221-436`，216 行——`MEMORY_ACTIONS` ∥ `MEMORY_LAYERS` ∥ `validateTypeFilter` ∥ `normalizeLimit` ∥ `fmtDate` ∥ `listRowLine` ∥ `memoryTools` ∥ `execSearch` ∥ `execPut` ∥ `execList` ∥ `execDelete` ∥ `execDeleteSingle` ∥ `execClear`）。
**主档留**：doc 索引引擎 + doc_search 工具面（`docSync` ∥ `docSearch` ∥ `ensureDocEmbeddings` ∥ `docSearchTool`）。
**转口**：`memoryTools` 经 `docs.mjs` 转口（`memory.mjs` 面零改；消费链 = `memory.mjs → docs.mjs → memory-tool.mjs`）。
**行数账**：437 = 主文块 221 + 迁出 216；拆后 ≈223+236 = **459**（Δ+22）。
**回线目标**：两档 ≤300（主档 ≈223 ∥ 新档 ≈236）。
（否决备选见九 D5。）

### 三、量级对账

1. **现盘实读 = 批档同口径**（行数谓词 = `read` 末行口径）：**455 ∥ 330 ∥ 458 ∥ 437**——与批档 §1 逐值相等（**零漂**；`wc -l` 口径 = 454 ∥ 329 ∥ 457 ∥ 436——差 1 行 = 尾空行，本批沿用末行口径）。
2. **拆后预估合计**：2.1–2.4 全部 ≤300（最小余量 = `code-sync.mjs` ≈32 ∥ `context.mjs` ≈29；新档最大 = `memory-tool.mjs` ≈236）；**总 Δ ≈ +128**（头注 ∥ import ∥ 转口行——非行为代码）。
3. **登记面（实施 / 收口轮更新——本轮零动）**：
   - `docs/core/design/API-CONTRACT.md` 生成区：父侧 `node scripts/api-contract.mjs --root . --target docs/core/design/API-CONTRACT.md --write`；复跑 `--check` 绿。
   - `docs/core/design/CORE-UNIFICATION.md` §2.8.1：行 15（`context.mjs` **440**「无计划行」⇒ 本批执行 + 兑现回填）+ **补登 3 行**（`conventions.mjs` ∥ `code-sync.mjs` ∥ `docs.mjs`——现属「其余 26 档待补」）+ 计数句同改。
   - 同档 §2.6.3（三）逐档清单读数：U4 `conventions.mjs` **223 ⇒ 329**；U6 `context.mjs` **392 ⇒ 455**；U8 `code-sync.mjs` **426 ⇒ 457** ∥ `docs.mjs` **419 ⇒ 436**（拆后实读回填）。
   - `docs/core/design/STRUCTURE-DEBT.md` #9（扫描面四档越线）：`docs.mjs` ∥ `code-sync.mjs` 两面**消解**；余 `schema.mjs` ∥ `memory/core.mjs` 在册——本批外（见十）。
   - 台账 **#755 ∥ #786**：收口轮父侧核销（本批为两行共同载体）。

### 四、测试面与导入面影响

1. **套件面 = 零**：核 `test/` 树现仅 `run.mjs`（空清单守卫——零用例即绿）+ `slow.mjs`；无任何 `.test.mjs`（2026-09-28 全清重置在册）。拆后套件面零影响。
2. **批内件（全扫）**：

| 批内件 | 引用面 | 拆后影响 | 处置 |
|---|---|---|---|
| `2026-09-29-tools-carryover-t4.test.mjs`（SOURCES 表 `:40-41` + DESC 在位正检 `:91-99`） | `memory/docs.mjs`（memory ∥ doc_search）∥ `memory/code-sync.mjs`（code_search） | **红**：`DESC("memory")` 随迁 `memory-tool.mjs`、`DESC("code_search")` 随迁 `code-search.mjs` | **须改 2 行**（表项改指新档；`doc_search` 留 docs.mjs）——唯一必须触碰的批内件 |
| `2026-09-30-memory-db-family.test.mjs`（`:44-47`） | `conventions.*` ∥ `codeSyncMod.*`（9 名）∥ `docsMod.*`（2 名） | 零（转口可取全部） | 复跑复验 |
| `2026-09-30-defect-fixes-core.test.mjs`（`:27`） | `conv.{isExcludedRelPath ∥ loadProjectDeclaration}` | 零 | 复跑复验 |
| `2026-09-30-cross-end-digest-recovery.test.mjs`（`:34/:38`） | context 存在检 + `{pushRecord, pushReal}` | 零 | 复跑复验 |
| `2026-09-29-core-carryover.test.mjs`（`:33`） | `{compressIfNeeded}` | 零 | 复跑复验 |
| `2026-09-28-desktop-session-title.test.mjs`（`:19`）∥ `2026-09-29-agent-p2-baseline.mjs`（`:7`）∥ `2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs`（`:25`） | `{pushReal…}` ∥ 存在检 | 零 | 随复跑面（可选） |

3. **消费面（产品码）= 零改**：四档静态导入面全扫 = **42 档**（core 27 ∥ CLI 6 ∥ VSC 6 ∥ desktop 3）——全部经转口零改（逐档清单 = 探针基线自动枚举，本表不硬编码）。`package.json` 零改（`exports: "./*"` 通配已覆盖新档路径）。

### 五、验收对照（回指 #755 ∥ #786）与验证法

**AC（机检物见下）**：
- **AC-1 回线**：四档拆后实读 ≤300（含全部新档）；读数回填三.3。
- **AC-2 导出面不变**：四档模块命名空间集 = 拆前逐名相等（无增 ∥ 无减 ∥ 无改名）。
- **AC-3 零行为变**：全部导出函数 `String(fn)` 逐字相等 + 值导出（`SUMMARIZE_PROMPT` ∥ `DEFAULT_DECLARATION` ∥ `DEFAULT_AUX_PATHS` 等）逐值相等；批内件定向复跑全绿。
- **AC-4 零消费面改动**：diff ⊆ 一.白名单五类，逐档可枚举。
- **AC-5 文档面**：API-CONTRACT 重生成后 `--check` 绿；注册面（三.3）更新。
- **AC-6 无新越线 / 无新依赖**：新档全部 ≤300；`package.json` 零改。

**验证法（机检执行物）**：
1. **探针**（新增批内件）`docs/batches/2026-10-01-core-split-line.probe.mjs`——两模式，仓根跑：
   - `snapshot`（**改前**跑）：对四档收集 { 导出名集 ∥ 每导出 `String(fn)`（函数）∥ JSON 值（常量）} → 写 `2026-10-01-core-split-line.probe-baseline.json`（批内件留档）。
   - `check`（改后跑）：同法收集 → 与基线逐名逐值比对（差异清单打印；空 = pass）。
   该探针即 AC-2 的执行物（同时核四档转口面：context 三组 ∥ conventions 四名 ∥ code-sync 五名 ∥ docs 一名）。
2. **批内件定向复跑**（改后，仓根 `node --test`）：`…memory-db-family` ∥ `…defect-fixes-core` ∥ `…cross-end-digest-recovery` ∥ `…core-carryover` ∥ `…tools-carryover-t4`（改表后）。
3. `node --check` 全部 11 档（4 原 + 7 新）。
4. 父侧：API-CONTRACT 重生成 + `--check`；四档实读复核（回线）。

### 六、用例表（正常 / 边界 / 错误）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| N1 | 正常 | 全量拆 + 转口 + 探针 `check` + 复跑 | 全绿；四档 ≤300；命名空间 / 函数文逐字等 |
| B1 | 边界 | 跨档被引的**原私有面**（`shrinkOversized` ∥ `buildDeclaration` ∥ `prefixContent`…） | 新档补 `export`（仅新档面；原档公开导出面零变） |
| B2 | 边界 | 两级转口链（`memory.mjs → docs.mjs → memory-tool.mjs`） | 解析正常（同一函数对象，`String(fn)` 等） |
| B3 | 边界 | t4 批内件 SOURCES 改指后 | 复跑绿（DESC 正检在新档命中） |
| E1 | 错误 | 迁出块夹带编辑（函数文被改） | 探针 `check` 红（`String(fn)` 不等） |
| E2 | 错误 | 漏转口（消费面取不到名） | 探针 `check` 红（命名空间缺名）+ 复跑红 |
| E3 | 错误 | 漏改 t4 SOURCES | 该件红（`DESC("memory")` / `DESC("code_search")` 正检失败） |
| E4 | 错误 | 某档拆后 >300 | 回线判定红（AC-1） |

### 七、受影响文件清单（R24a 口径：现行数 + 预计）

| 面 | 档 | 现行 | 拆后预估 |
|---|---|---|---|
| 源（原档） | `thincoder-core/context.mjs` | 455 | ≈271 |
| 源（新档） | `context-push.mjs` ∥ `context-echo.mjs` ∥ `context-degrade.mjs` | — | ≈54 ∥ ≈91 ∥ ≈85 |
| 源（原档） | `thincoder-core/conventions.mjs` | 330 | ≈177 |
| 源（新档） | `declaration.mjs` | — | ≈173 |
| 源（原档） | `thincoder-core/memory/code-sync.mjs` | 458 | ≈268 |
| 源（新档） | `memory/code-search.mjs` ∥ `memory/file-list.mjs` | — | ≈138 ∥ ≈92 |
| 源（原档） | `thincoder-core/memory/docs.mjs` | 437 | ≈223 |
| 源（新档） | `memory/memory-tool.mjs` | — | ≈236 |
| 批内件（改） | `docs/batches/2026-09-29-tools-carryover-t4.test.mjs` | 117 | 117（2 行改指） |
| 批内件（新） | `docs/batches/2026-10-01-core-split-line.probe.mjs` | — | ≈90（两模式） |
| 消费面（零改） | 42 档（core 27 ∥ CLI 6 ∥ VSC 6 ∥ desktop 3） | — | 0 |
| 文档面（随动） | 见 三.3（注册面）+ 八（变错句） | — | 随动 |

### 八、文档面「变错句」清单（实施轮随动——只改拆分后变错者；全量坐标随动 = 既有锚债 #779，不属本批）

`docs/core/design/SESSION.md:141/:177/:853/:971`（上下文写缝 ∥ 回声族承载句 → 改指 `context-push` / `context-echo`）∥ `docs/core/design/CONTEXT-COMPACTION.md:175/:183/:184/:187/:497`（归属表 / 坐标 → 改指新档）∥ `docs/core/design/MEMORY.md:185/:289`（工具面承载句 → `memory/memory-tool.mjs`）∥ `docs/core/design/PORTABILITY.md:26/:30/:67-72`（声明装载面承载句 → `declaration.mjs`；分类裁判句原位）∥ `CORE-UNIFICATION.md` §2.6.3 ∥ §2.8.1 ∥ `STRUCTURE-DEBT.md` #9（三.3 已列）∥ `API-CONTRACT.md`（重生成）。

### 九、关键决策（含否决备选）

| # | 决策 | 依据 / 否决 |
|---|---|---|
| D1 | **四档一律转口保名**（迁出符号由原档 re-export；消费面 / 批内件 import 面零改） | 批判据明文允许（「转口保名（如需）」）；先例 = init-block `session-lifecycle` 拆分（10 消费档未动）∥ 本档 `estimateTokens` 再导出（`:448`）∥ explore-distill 迁出（`:450-455`）。**备选（记录·未采纳）**：撤转口、消费面改指（conventions 9 档 + 批内件 2 件）——机械 churn 无收益；`PORTABILITY.md:26/:144`「不设 re-export——只留一个导入路径」的对象 = **分类裁判谓词**（本批原位不动、唯一路径不变）与 VSC 镜像退役语境，声明 / 写缝 / 检索面不属该纪律对象；如审查判须扩及 ⇒ 该备选可整体切换（删转口块 + import 行改指，机械可执行） |
| D2 | `context.mjs` **三刀**（写 ∥ 回声 ∥ 降级） | 两刀任一组合主档 ≥311 > 300 不达标；三面皆叶（零回指主档）⇒ 无环 |
| D3 | `conventions.mjs` 拆**声明面**、分类裁判原位 | `PORTABILITY.md:26/:30` 主体句（分类裁判 = conventions.mjs）保持真；依赖向单向（分类 → 声明）；反向外提会使该等句变错 ⇒ 否决 |
| D4 | `code-sync.mjs` **两刀**（检索面 ∥ 清单面） | 一刀任一组合余 ≥330 > 300；两面皆叶；四起效点调用形零改（清单面随迁 + 两处原位） |
| D5 | `docs.mjs` 一刀 = **memory 工具面**（216 行）外提 | 单块最大内聚面，一刀回线（余 ≈223）；否决「docSync / docSearch 外提」（档名与内容错位 ∥ `docSearchTool` 与 `docSearch` 跨档拆分） |
| D6 | 新档命名 | `context-push` / `context-echo` / `context-degrade`（context 族前缀——面名 + 词）∥ `declaration.mjs`（声明面）∥ `code-search.mjs` ∥ `file-list.mjs`（`file-walk.mjs` 邻居）∥ `memory-tool.mjs`（MEMORY.md「工具面」同词；与 VSC 端面名呼应） |
| D7 | t4 批内件 2 行随动（唯一触碰件） | DESC 正检面随迁；不改 ⇒ 件红；改 = 机械表项——先例（#774 / #788 批内件随批收正） |

### 十、上抛与披露（报告不改 / 本批外）

- ① **同族越线档在册未动**：`memory/schema.mjs` **452** ∥ `memory/core.mjs` **300**（贴线）∥ `tools/file.mjs` **468**（在册读数）等——本批四档外零扩；`STRUCTURE-DEBT.md` #9 四档中 `docs` ∥ `code-sync` 随本批消解，余两档在册。
- ② **读数陈旧面**（随三.3 收正）：`STRUCTURE-DEBT.md` #9 载 2026-09-18 读数（`docs` 421 ∥ `code-sync` 417）；`CORE-UNIFICATION.md` §2.6.3 三处（U4 223 ∥ U6 392 ∥ U8 426/419）。
- ③ `DOC-DISCIPLINE.md:558/:568` `context.mjs:495` 坐标陈旧（现 455）——同族坐标债，随实施 / 收口轮或另轮。
- ④ 新档无 >300 者；`exports: "./*"` 通配 ⇒ `package.json` 零改（已核）；四档拆分点均**无需行为变更**（禁面「须行为变更 ⇒ 停报」未触发）。

### 十一、评审轮 1 修正块（fix 轮 · 1–6 采纳 ∥ 7 零动 · 零新语义）

> 承 §3 轮次 1（本档 `:183-195`——7 条：1–3 🟡 ∥ 4–7 🔵）；父侧裁决 = **1–6 采纳 ∥ 7 零动**（限制声明原样保留）。本块逐号落定并**覆盖前文对应表述**；括注行号 = 修正前本档读数。前文原行不改写（append-only），效力以本块为准。

**修正 1（🟡 · 白名单③ ∥ 主档 import 增 ∥ 验证法——覆盖 `:27③` ∥ `:43` ∥ `:115-122`）**

- 白名单③ 增一类：**新档 import 声明行**（新档自第三档取用的全部 `import`；例 = `declaration.mjs` 取 `manifest.mjs` 的 `readManifest`/`manifestFilePath`、`file-list.mjs` 取 `file-walk.mjs` 各族）。
- 「主档 import 增」固定名录（原 `:43` 仅列 context 一档三名 ∥ `:52` 以依赖向捎带 conventions 一档）废止，改**留档代码对迁出符号引用面逐名对账**：转口行 `export { … } from` **不产生本地绑定**——留档代码（迁出块之外的全部保留代码）凡引用迁出符号者，须同时写 `import`。设计轮对账落定（按现盘代码逐名核；源档行号 = 现盘读数）：
  - `context.mjs`：留档引用 = `withPlaceholderPrefix`（`context.mjs:232`）∥ `COMPACTION_PLACEHOLDER`（`:244`）∥ `shrinkOversized`（`:302`）⇒ 新增 import 两行（echo 两名 + degrade 一名；注释提及 `:199`/`:218`/`:229`/`:365` 不计）；
  - `conventions.mjs`：留档引用 = `DEFAULT_DECLARATION`（`conventions.mjs:129`）⇒ 新增 import 一行（自 `declaration.mjs`）；
  - `code-sync.mjs`：留档引用 = `indexExtensions`（`code-sync.mjs:50`/`:210`/`:428`）∥ `listProjectFiles`（`:211`）⇒ 新增 import 一行（自 `file-list.mjs`，两名同档；原 §2 未列此档）；
  - `docs.mjs`：留档面（`:1-219`）零引用迁出符号 ⇒ 零 import 增（仅转口行）。
- 反向（清理）同按名对账：`code-sync.mjs` 的 file-walk 导入行（现 `:12`）**拆留**——`isSkippedRelPath`（留档 `:91`/`:425` 在引）∥ `extensionOf`（留档 `:89`/`:422` 在引）留；`walkProjectFiles`/`createUnlistedTally`/`MAX_WALK_FILES`（随迁）移 `file-list.mjs`。
- 验证法补一条（并入第 3 项执行）：**留档块内迁出符号名核对**——对四原档留档代码逐名 grep 全部迁出符号；每命中须有 `import` 覆盖或属本地定义（`node --check` 兜语法面 ∥ 批内件定向复跑兜运行面）。
- 实施轮以复读为准（本条名单 = 设计轮对账读数）。

**修正 2（🟡 · §8 变错句清单——覆盖 `:156` 的 `PORTABILITY.md` 条目）**

`PORTABILITY.md` 条目扩为：`:26`（分类裁判单源句——补区分句，见 6）∥ `:30`（落点表行——含陈旧批句清理，见 3）∥ `:40`（索引回退接线坐标「`:11`（导入）· `:154`（walk 调用）」——walk 调用住 `listProjectFiles` 体内 ⇒ 改指 `memory/file-list.mjs`）∥ `:42`（「结构重构 ≠ 权威迁移」句——D1 判据，见 6）∥ `:67-72`（声明装载面承载句 → `declaration.mjs`；分类裁判句原位）∥ `:112`（落点句「`code-sync.mjs`（`listProjectFiles` 走 walk 回退 + unlisted 计数）」→ 改指 `memory/file-list.mjs`）∥ `:140`（W4 状态注括注「现体 = core conventions.mjs，装载面现体 = `loadProjectDeclaration`」——拆分后按转口语义**一并核**：分类裁判现体仍在 `conventions.mjs`；装载面现体迁 `declaration.mjs`，经 `conventions.mjs` 转口可达）。

**修正 3（🟡 · `PORTABILITY.md:30` 陈旧批句清理——覆盖 §8 内 `:30` 条目的实施注）**

本批更新 `:30` 时**删除 2026-09-28-guard 批的一次性批句**（「本批改后行号实施轮读回；档级行数 = 244 行 ⇒ 本批 ≈275 行（面判 helper + `root` 入声明对象；受影响文件全表 = `docs/batches/2026-09-28-guard-face-micro.md` §2）」整段括注），**仅留 as-of 现状读数**（行号以实施轮读回为准）——遵 `PORTABILITY.md:276` 所承 2026-09-18 裁定（失效表达须删 ∥ 历史归记录面）。

**修正 4（🔵 · 三.3 回填口径——覆盖 `:85`）**

统一按已声明口径（read 末行，同三.1）：U4 `conventions.mjs` 223 ⇒ **330** ∥ U6 `context.mjs` 392 ⇒ **455** ∥ U8 `code-sync.mjs` 426 ⇒ **458** ∥ `docs.mjs` 419 ⇒ **437**（左值 = `CORE-UNIFICATION.md` §2.6.3 载读数原样；拆后实读按本口径回填——注册面与批档零 1 行差）。

**修正 5（🔵 · 白名单⑤ ∥ §7 表——覆盖 `:27⑤` ∥ `:150`）**

- 白名单⑤ 扩为两件（落点目录 `docs/batches/`）：`2026-10-01-core-split-line.probe.mjs`（验证物——snapshot/check 两模式）**+ `2026-10-01-core-split-line.probe-baseline.json`**（snapshot 写一次 · 批内件留档）。
- §7 表补一行：批内件（新）`docs/batches/2026-10-01-core-split-line.probe-baseline.json`｜—｜拆前读数快照（snapshot 生成）。

**修正 6（🔵 · D1 判据 ∥ §8——覆盖 `:162` D1 行）**

- D1 补引 `PORTABILITY.md:42`（「对照：`messages.mjs` 拆分面**保留 re-export**（结构重构 ≠ 权威迁移）」——转口保名的直接支撑句）。
- `PORTABILITY.md:26` 更新时附一句区分（结构重构面保留转口 ∥ 权威迁移面不设 re-export）——并入 §8 `:26` 条目（见 2）。

**7（🔵 · 零动）**：限制声明原样保留；射程外事实（源档读数 ∥ 42 消费档 ∥ `test/` 树 ∥ 台账）以实施 / 收口轮实读复核为准（设计已含该步）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：本批 §2（四档拆点 ∥ 新档命名 ∥ 回线 ∥ 量级对账 ∥ 验证法）+ 射程档 `thincoder/docs/core/design/PORTABILITY.md`（行号 = 现盘实读）。文档地图 / 项目标准档未声明——归属面按 Project Guide 与档内既有惯例判读（降级）；源档与被引台账不在评审射程，行数读数按 unverified 记（内部算术已逐项复核一致）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / Acceptance（diff 白名单） | 🟡 | 白名单③（`docs/batches/2026-10-01-core-split-line.md:27`）只枚举「迁出块逐字 + 头注 + `export` 关键字」，**未含新档 import 行**——与同档 `:45` 行数账「Δ+46 = 头注 ∥ import ∥ 转口行」自相矛盾；七新档必然新增 import（如 `declaration.mjs` 需 `manifest.mjs` 的 `readManifest`/`manifestFilePath`），按「枚举外即判红」+ AC-4（`:111`）将被判红。另：主档 import 增名录（`:43`）仅三名（`COMPACTION_PLACEHOLDER` ∥ `withPlaceholderPrefix` ∥ `shrinkOversized`），而转口写法 `export { … } from`（`:44`）**不产生本地绑定**——留档代码若仍引用迁出符号（如写缝族），漏 import 只在运行时炸（`node --check` 不报） | 白名单③ 补「新档 import 声明行」一类；「主档 import 增」改按留档代码对迁出符号的引用面逐名对账（转口行之外被引用者须同时 `import`）；验证法补一条留档块内迁出符号名的核对（grep / 冒烟） |
| 2 | Document ownership（doc-state） | 🟡 | §8 变错句清单（`:156`）只列 `PORTABILITY.md:26/:30/:67-72`，漏两处拆后必错句：`thincoder/docs/core/design/PORTABILITY.md:40`（「索引回退接线 = `code-sync.mjs:11`（导入）· `:154`（walk 调用）」——该调用点住在 `listProjectFiles` 体内，随 2.3（`:61`，`:135-198` 迁出）落 `memory/file-list.mjs`）与 `PORTABILITY.md:112`（「`code-sync.mjs`（`listProjectFiles` 走 walk 回退 + unlisted 计数）」——归属档失真）。两处均属 §8 自定射程「拆分后变错者」，非「全量坐标随动」（#779） | §8 补 `:40` / `:112` 两处改指 `memory/file-list.mjs`；同族 `PORTABILITY.md:140` 括注「现体 = core conventions.mjs，装载面现体 = `loadProjectDeclaration`」判读可能含混，宜一并核 |
| 3 | Doc hygiene | 🟡 | `PORTABILITY.md:30` 规范面（§2 落点表）残留上一批现状⇒改法句：「本批改后行号实施轮读回；档级行数 = 244 行 ⇒ 本批 ≈275 行（…受影响文件全表 = `docs/batches/2026-09-28-guard-face-micro.md` §2）」——该批已收口、读数失效（本批实测 330，见 `:80`），与 `PORTABILITY.md:276` 所承 2026-09-18 裁定（失效表达须删、历史归记录面）相抵；§8 只指令「声明装载面承载句 → `declaration.mjs`」，未含该句清理 | 本批更新 `:30` 时删除陈旧批句，仅保留 as-of 现状读数（行号以实施轮读回为准） |
| 4 | 量级对账（numeric drift） | 🔵 | 三.3 回填数字口径混用（`:85`）：`conventions.mjs 223 ⇒ 329` ∥ `code-sync.mjs 426 ⇒ 457` ∥ `docs.mjs 419 ⇒ 436` 用 `wc -l` 口径（= 本批读数减 1），`context.mjs 392 ⇒ 455` 同行却用 read 末行口径；同档 `:80` 已声明「本批沿用末行口径」 | 逐行标注所属口径，或统一按已声明口径回填（455 ∥ 330 ∥ 458 ∥ 437），避免注册面与批档再现 1 行差 |
| 5 | 验证法 / AC-4 自洽 | 🔵 | 探针 snapshot 写出的 `2026-10-01-core-split-line.probe-baseline.json`（`:117`「批内件留档」）既不在白名单五类（`:27` ⑤ 仅含 `.probe.mjs`），也不在 §7 受影响表（`:150`）——按 AC-4（`:111`「diff ⊆ 白名单五类」）该新增档将被判红 | 白名单⑤ 与 §7 表补「基线 JSON 新增（批内件留档）」一条，明确落点目录 |
| 6 | 关键决策记录（clarity） | 🔵 | D1（`:162`）解释「不设 re-export」射程时仅引 `PORTABILITY.md:26/:144`，未引本档现成的直接支撑句 `PORTABILITY.md:42`（「对照：`messages.mjs` 拆分面**保留 re-export**（结构重构 ≠ 权威迁移）」）；拆后 `conventions.mjs` 将出现转口块，读者若只按 `:26` 字面易误判违纪 | D1 补引 `PORTABILITY.md:42` 为判据；`PORTABILITY.md:26` 更新时附一句区分（结构重构面保留转口 ∥ 权威迁移面不设 re-export） |
| 7 | 证据边界（limitation） | 🔵 | 射程 = 批档 + `PORTABILITY.md`：源档行数读数（455 ∥ 330 ∥ 458 ∥ 437；批内件 117）、42 消费档枚举、`test/` 树现状、台账 #755 ∥ #786 内容均在射程外，无法实核（记 unverified）。射程内可核项：内部算术逐条一致（455=263+192 · 330=172+158 · 458=260+198 · 437=221+216 · Δ 合计 +128 · 最小余量 29/32）、`wc -l` ↔ 末行口径差 1 行自洽 | —（实施 / 收口轮以实读复核为准——设计已含该步） |

**计数**：🔴 0 ∥ 🟡 3 ∥ 🔵 4（共 7）。

**VERDICT: pass**

## §4 用户批准（主 agent）

**代签（父侧 · 2026-10-01）**：依据 = 用户全链自动授权 + **评审 pass**（0🔴 ∥ 3🟡 ∥ 4🔵——修正 1–6 全采纳，7 零动）+ **修复轮（#26）落定经核**（§2 修正块 `:177-215` 读回核讫：白名单③ 闭包 ∥ 逐名 import 对账（含 code-sync 漏账补全）∥ §8 扩面 ∥ `:30` 陈句清理 ∥ 口径统一 330/455/458/437 ∥ 基线 JSON 入册 ∥ D1 补引 `:42`）。**批准范围** = §2 全（以修正块为覆盖面）：四档拆十一档（四原 + 七新——转口保名 ∥ 消费面 42 档零改）+ 唯一批内件触碰（`tools-carryover-t4` SOURCES 两行）。实施 = eng-coder 单舱；登记面（CORE-UNIFICATION ∥ STRUCTURE-DEBT ∥ API-CONTRACT 重生成）= 收口轮父侧。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-10-01 · 四档拆 4 原 + 7 新——零行为变 ∥ 转口保名 ∥ 消费面零改；偏离审计 1 轮 ∥ 代码评审 1 轮 pass ∥ fix 轮 0；终态 clean）

**交付摘要（逐拆点）**
- `context.mjs` 455→**262** ∥ 新 `context-push.mjs` **52**（`pushReal:27-37` ∥ `pushRecord:46-51`）∥ `context-echo.mjs` **89**（`COMPACTION_PLACEHOLDER:8` ∥ `withPlaceholderPrefix:36-38` ∥ `mergeAdjacentAssistantEchoes:70-88`）∥ `context-degrade.mjs` **82**（`pruneStaleToolOutputs:19-39` ∥ `shrinkOversized:52-81`）
- `conventions.mjs` 330→**172**（分类裁判原位：`classifyPath:136` ∥ `isCodePath:146` ∥ `isDocPath:152` ∥ `isTempPath:53` ∥ `isAuxPath:163`）∥ 新 `declaration.mjs` **173**（`DEFAULT_DECLARATION:100` ∥ `isExcludedRelPath:108` ∥ `clearDeclarationCache:124` ∥ `loadProjectDeclaration:149`）
- `memory/code-sync.mjs` 458→**258** ∥ 新 `memory/code-search.mjs` **138**（`codeSearch:21` ∥ `ensureCodeEmbeddings:87` ∥ `codeSearchTool:115`）∥ `memory/file-list.mjs` **90**（`indexExtensions:18` ∥ `listProjectFiles:41`，walk 调用 `:61`）
- `memory/docs.mjs` 437→**222** ∥ 新 `memory/memory-tool.mjs` **230**（`memoryTools:49` ∥ `DESC("memory"):57`）
- 行数口径 = read 末行；11 档全部 ≤300；对 §2 目标逐档 Δ = −9/−2/−2/−3/−5/0/−10/0/−2/−1/−6（全在 ±10 内）
- 转口：context 三组 5 名（`context.mjs:254-256`）∥ conventions 四名（`:171`）∥ code-sync 五名（`code-sync.mjs:256-257`）∥ docs 一名（`docs.mjs:220`）——探针 `check` 四档命名集 13/10/9/5 逐名逐值同一（exit 0）
- 留档引用 import 增照修正 1：context 2 行 3 名（`:17-18`）∥ conventions 1 行（`:38`，唯引用 `:122`）∥ code-sync 1 行（`:15`，留档引用 `:33/:127/:128/:223`——原 §2 未列档）∥ docs 零增；file-walk 导入行拆留照办（`code-sync.mjs:11` 留两名 ∥ `file-list.mjs:8` 收三名）
- 验证物（白名单⑤）：`docs/batches/2026-10-01-core-split-line.probe.mjs`（snapshot/check 两模式）+ `…probe-baseline.json`（改前基线在册——修正 5 两件）
- 文档面 §8 变错句照落（父裁覆盖「禁写设计档」= 禁写登记面）：`PORTABILITY.md:26-28`（射程区分句）∥ `:30`（行号 + 行数 172/173 回填，2026-09-28-guard 陈旧批句已删——修正 3）∥ `:40` ∥ `:42`（核讫不变）∥ `:63/:67-72` ∥ `:112` ∥ `:140`；`SESSION.md:141-143` ∥ `:177` ∥ `:852-855` ∥ `:973-975`；`CONTEXT-COMPACTION.md:175` ∥ `:183/:184/:187` ∥ `:497-500`；`MEMORY.md:185-186` ∥ `:290-291`

**决策透明表**
| # | 事件 | 处置 |
|---|---|---|
| 1 | spawn「禁写设计档」vs §2 八「变错句清单（实施轮随动）」两表述冲突 | 上抛 ask；父裁 = §8 四档本实施轮照落、「禁写设计档」原义 = 禁写登记面（CORE-UNIFICATION ∥ STRUCTURE-DEBT ∥ API-CONTRACT = 收口轮父侧）。已照落（届盘实读坐标） |
| 2 | t4 批内件写门拒（cross-batch：本舱 token 绑本批） | 上抛 ask（带逐字 2 行改法）；父侧直执行落定 + 计数标签（六具→七具）四处随正；本舱复跑复验 4/4 绿 |
| 3 | spawn 称探针在盘——磁盘实读 = 无 | 按白名单⑤自建；先跑 snapshot 产基线（capturedAt 09:11:53Z，早于全部代码改动），改后 check |
| 4 | 行宽面：随动行引入 6 行 >300（PORTABILITY:26 ∥ SESSION:141/:971 ∥ CC:497 ∥ MEMORY:185/:289） | 按仓内判据（`scripts/doc-check.mjs`，lineWidth 300）折行收正；复扫本舱行零超限（余为既有红面）；另收正 MEMORY.md:186 相对路径锚（`doc-check` 悬空面） |
| 5 | `cross-end-digest-recovery.test.mjs` 3 腿红 | 归因 = 并行批 #790（`thincoder-cli/src/tui/lifecycle-records.mjs` mtime 09:21Z，本舱复跑前 1 分钟）改 meta 形（`sub:<role>#<id>` ∥ `pool`/`queued`），其旧冻件仍断言旧形；本舱零触该链。复现命令见下 |
| 6 | 评审 🟡-optional：`conventions.mjs:16` 头注「projected HERE」承载句成假 | 白名单①–⑤未枚举源档头注编辑 ⇒ 未动（评审亦注非 must-fix）；报父侧（收口轮或顺轮） |
| 7 | 审计发现：`MEMORY.md:137` 归属句（`code_chunks` → `memory/code-sync.mjs`，实体已迁 `code-search.mjs`）——§8 未列 | 未动（coder 无权扩面）；报父侧裁定 |

**审计与评审轮次（自含协议终态：clean）**
- 偏离审计（explore · 只读 · 1 轮）：四类判据 —— (a) 部分实现 = 未发现 ∥ (b) 静默简化 = 未发现 ∥ (d) 越白名单 = 未发现 ∥ (c) 文档面 3 条留痕项（§5 缺写【本段即销】∥ 四档变更记录行未加 ∥ MEMORY.md:137 归属句）——后两条报父侧。
- 代码评审（advisor · code · 1 轮）：**VERDICT: pass**（0🔴 ∥ 1🟡-optional ∥ 4🔵）。响应：🟡1 与 🔵2（conventions/code-sync/docs 头注承载句）= 未动——白名单外，报父侧；🔵3/4（探针值面 `JSON.stringify` 对 Set 退化 ∥ snapshot 无覆盖护栏）= 未动（批内件·留档件，限制登记）；🔵5（批档 `:239`「四档拆十档」vs `:121`「11 档」计数漂移）= 未动（记录面，父侧收口轮）。
- fix 轮 0（无 must-fix）；执行期自纠 1 处（MEMORY.md:186 锚改全路径）。

**验证读数（改后 · 工作区 thincoder/）**
- `node --check`：11/11 + probe 绿（13 档）
- 探针 `node docs/batches/2026-10-01-core-split-line.probe.mjs check` → 「OK(core-split-probe): 四档导出面逐名逐值同一」exit 0
- 批内件复跑（`node --test`）：t4 **4/4** ∥ memory-db-family **21/21** ∥ defect-fixes-core **11/11** ∥ core-carryover **8/8** 绿；cross-end-digest-recovery **17/20**（3 红 = 并行批 #790 面——`node --test docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs` 可复现，断言面 = meta `key`/`pool` 形，非本舱文件）
- 运行面冒烟（inline）：转口同一性 6/6 真（`pushReal`/`pushRecord`/`mergeAdjacentAssistantEchoes`/`pruneStaleToolOutputs`/`loadProjectDeclaration`/`DEFAULT_DECLARATION`——`===` 同对象）；echo 归并 ∥ pushReal 双写+窗口 ∥ pushRecord 机器线零触 ∥ shrinkOversized 截断+基线失效 ∥ compressFallback 并入分支（占位并尾首 assistant）全绿
- 迁移逐字：`git show HEAD` 迁出块逐块 byte-exact 命中断言——唯二 MISS = 工作树先行差（#700 三参 `isExcludedRelPath` ∥ `(rel, decl, dir)` 调用），随迁保形（逐行 diff 核讫）
- 文档面：`scripts/doc-check.mjs --root .` 本舱随动行零行宽超限、零新增悬空锚

**未及面（如实）**
① 登记面三件（API-CONTRACT 重生成 ∥ CORE-UNIFICATION §2.6.3/§2.8.1 ∥ STRUCTURE-DEBT #9）+ 台账 #755 ∥ #786 核销 = 父侧收口轮（§3.3 安排）；② 评审 🟡1/🔵2（源档头注承载句）∥ 审计 c-2（四档变更记录行）∥ c-3 与决策 7（MEMORY.md:137）= 报父侧；③ #779 全量坐标债面未动（含 MEMORY.md:341/:342/:475/:534-541 等坐标残留）。

## §6 验证与收口（父代理）

**收口轮（父侧 · 2026-10-01）**

① **父侧亲跑验证**：探针 `node docs/batches/2026-10-01-core-split-line.probe.mjs check` ⇒ **OK（四档命名集 13/10/9/5 逐名逐值同一）** ∥ 批内件 t4 **4/4**（SOURCES 两行父侧落定后）∥ 冒烟复跑（memory-db-family **21/21** ∥ defect-fixes-core **11/11** ∥ core-carryover **8/8**）∥ cross-end-digest-recovery——#30 读数 17/20（时点 = #790 钉随动前）+ **#36 复跑 20/20 = 现盘终值**。
② **头注收正**（父侧直执行 · 机械 · 可 revert）：`conventions.mjs:15-18`（「projected HERE」⇒ 声明装载已迁 `declaration.mjs`）∥ `code-sync.mjs:2` ∥ `docs.mjs:2`（迁出面向注）——评审 🟡1 / 🔵2 就此销。
③ **记录面计数收正**：本档 §4「四档拆十档」⇒「**四档拆十一档（四原 + 七新）**」（评审 🔵5）。
④ **登记面闭合**：`api-contract.mjs --write` ⇒ WROTE（2773 条）∥ `--check` = **OK（骨架零漂移 · 2773 条 · 621 档）** ∥ `CORE-UNIFICATION.md` §2.8.1 行 15 兑现收正（context 440 ⇒ 262）+ 变更记录落 ∥ `STRUCTURE-DEBT.md` #9 **部分消解**（docs/code-sync 两档）+ 变更记录落。
⑤ **披露受理**：🔵3/4（探针值面 Set 退化 ∥ snapshot 无覆盖护栏）= 批内留档件限制，在册零动作；对账差异（探针在盘）= #30 已按白名单自建，如实记。
⑥ **台账结算**：#755 ∥ #786 → 已核销（经 待核销）。

**收口完成 ⇒ 冻结。**
