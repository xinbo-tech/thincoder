# 2026-09-18 · TUI 假死修复批（性能 · 技术债）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（提交 `a28aa7d4`；数据面 ops 父侧执行——存量 origin 迁移 165,017 行）

### 1.1 批件（用户 2026-09-18 02:59「开修」；根因 = explore id=59 勘察 + 父侧实测计时）

**症状**：**主 agent 发起会话 / 子 agent spawn 时，CLI TUI 假死数秒、不能滚动**（VSC 端未测——同一套 core、同一事件循环，大概率同症）。

**根因（实测读数，2026-09-18 02:5x）**：

| 项 | 读数 |
|---|---|
| `memory.db` | **2.80 GB** · WAL **587 MB** · `node:sqlite` **DatabaseSync（同步 API）** |
| 向量行 | 139,107（`embedding` 非空） |
| **主查询全表扫描**（64,630 行 / 252 MB blob + 全维点积） | **31.2 秒**（冷） |
| 全 origin 扫描（139,171 行 / 543 MB） | **33.1 秒** |

- **公共面（①② 两处皆中）**：`agent/setup.mjs:101-126`（`prepareRun`——**无 depth 门**）→ `docSearch`/`memorySearch` → `memory/scan.mjs:80-95`：`for(;;)` **同步整表扫描 + 逐行 cosine，零 `await`** ⇒ 事件循环独占；**主 agent 每回合一次 · 每个子 agent spawn 子代各一次**。
- **主 agent 额外面**：`setup.mjs:136` → `pushPeerReminder` → `peerInstances` → `execFileSync tasklist` + **`execFileSync PowerShell Get-CimInstance`**（1–3 s 估）；缓存键 = manifest mtime，而 `saveSession` **每回合重写 manifest**（`session.mjs:163-172`）⇒ **缓存每回合自击穿**。
- **「完全不能滚动」机理**：滚轮 / 键盘 / 渲染同一条事件循环（`index.mjs:169` stdin 回调；`mouse.mjs:30-76`）⇒ 同步活占住线程时输入回调排不上队。

### 1.2 范围（修）

| # | 面 | 修法方向（设计轮定稿） |
|---|---|---|
| ① | **扫描让出（核心）** | `scanVectors` 分块间让出事件循环（先例 = `code-index.mjs:150` 的 `yieldTick`——`code-sync.mjs` 消费）——冻结变「慢」不「死」；同回合结果缓存（同输入前缀不重扫）如有据可加 **〔修·§2.11〕** |
| ② | **子代检索门** | `prepareRun` 检索加 **depth 门 / 开关**（子代是否真需向量检索——设计裁定；默认面须给理由） |
| ③ | **同伴探测** | 缓存加最小重探间隔 / 改异步 / 复用现成 `batchAlive`（`process-probe.mjs:59` 注释自称「应当」） |
| ④ | **索引重复（源头）** | origin **`D:\teamcode`（71,266）+ `d:\teamcode`（69,748）同树双份** ⇒ ① 写入面归一（origin 单源；勘察归因待设计轮坐实）② 既有数据去重——**数据面 = 父侧 ops 执行，子代理零触碰** |
| ⑤ | **WAL 卫生** | 587 MB 远超自动 checkpoint 阈值 ⇒ checkpoint 策略（写侧是否显式 checkpoint / 启动一次性回收——设计裁定） |

**明确不做**：`worker_thread` 化与索引结构变更（结构修法——本轮**登记不执行**，除非设计证明轻量且收益必要）；扫描语义（召回面）不变。

### 1.3 边界

- **代码面**：`thincoder-core/memory/**` · `thincoder-core/agent/setup*.mjs` · `thincoder-core/{peer-instances,process-probe,session,session-slots}.mjs`（按设计定稿）。
- **数据面**：`C:\Users\liwei\.thincoder\memory.db` **在仓外 ⇒ 父侧 ops 执行**（子代理零触碰；设计只出迁移方案 + 判据）。
- 禁触：冻结批档 / `_archive/**` / 参照树 / 提示词面；与在途实施线（模式联动批 · 判据面批——本会话子代理在写）文件重叠 ⇒ 排队 / 避让。

### 1.4 台账

- **#50**（TUI 假死——本批）。

## §2 批次任务与设计修订（eng-designer）

### 2.1 轮次与范围（initial · 设计轮 · 2026-09-18）

**设计档修订（单源）**：`docs/core/design/MEMORY.md` 新增 §6.10（扫描让出 + 子代检索门）· §6.11（索引 origin 归一 + 数据面迁移判据）· §6.12（WAL 卫生）· §7 补 D-MEM17–D-MEM21 · §8.3 补已知限制三行；
`docs/core/design/MULTI-INSTANCE-COLLAB.md` §3.1 缓存判据收正 + 探测异步化 · §3.2 补异步形态行 · §8 补 D-MI13–D-MI14。

**未触**：`docs/core/design/SESSION.md`（manifest 写频率零改——D-MI13 否决备选「改写频率」；该档 §6.2/§7 无与本次判据相抵的陈述，无指针需收正）。

### 2.2 覆盖条目（批次面 → 需求条目 → 设计落点）

| 批次面（§1.2） | 需求条目（回指） | 设计落点 |
|---|---|---|
| ① 扫描让出 | `docs/core/requirements/MEMORY.md` §4.6 F-M1/F-M2/F-M3（**语义不变面**——让出后仍须逐条满足）+ §4.9 **F-S1（扫描期可响应）/ F-S2（键序游标）**〔修·§2.11——需求档同批已补〕 | MEMORY.md §6.10 修法 **A1（PK 游标）+ A2（让出）**〔修·§2.10〕 |
| ② 子代检索门 | `docs/core/requirements/MEMORY.md:146` F-M7（VSC 端 §4.7）+ `thincoder-cli/docs/requirements/AGENT-LOOP.md:283-284` F-Q2/F-Q3 + **核心层 `docs/core/requirements/AGENT-LOOP.md` §4.11（F1–F3——同批补）**〔修·§2.11〕 | MEMORY.md §6.10 修法 B |
| ③ 同伴探测 | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md`（感知面 F-MI 族——判据/文案零变） | MULTI-INSTANCE-COLLAB §3.1/§3.2 + D-MI13/D-MI14 |
| ④ 索引 origin 归一 | `docs/core/requirements/MEMORY.md` §4.9 **F-S4**〔修·§2.11——同批已补〕 | MEMORY.md §6.11 |
| ⑤ WAL 卫生 | `docs/core/requirements/MEMORY.md` §4.9 **F-S5** + N-S3（边界写实）〔修·§2.11——同批已补〕 | MEMORY.md §6.12 |

**本批明确不做**：`worker_thread` 化 · 索引结构变更（ANN / 向量索引）· 召回语义（全表评分 / RRF / limit）· FTS 通道 · 端装配文件（`thincoder-cli/src/cli/make-agent.mjs` · `thincoder-vscode/src/embed-config.mjs`——核内归一即覆盖）· `thincoder-cli/src/tui/**`（本轮零改：让出即解假死，TUI 无需感知）· 数据面执行（父侧 ops，见 2.7）。

### 2.3 实施改动点（file:line 级）

1. `thincoder-core/memory/scan.mjs`（96 行）：加 `SCAN_YIELD_MS = 50`（毫秒）· `SCAN_YIELD_CHECK_ROWS = 64`（导出常量）；`scanVectors`（`:80`）改 **async**，opts 增 `yieldFn = yieldTick` · `nowFn = Date.now` · `yieldMs = SCAN_YIELD_MS`；块内循环（`:85-93`）每 64 行读钟，自上次让出累计 ≥ `yieldMs` ⇒ `await yieldFn()`；**块边界同判**（同一预算——预算未耗 ⇒ 零让出）**〔实施后收正〕**；`SCAN_CHUNK_ROWS = 2_000`（`:18`）不动。import `yieldTick` 自 `./code-index.mjs`（`code-index.mjs:150`；**实施前核无环**——code-index 现不引 scan）。 **〔修·§2.10〕**另：游标列由调用点声明（opts `cursorKey`，缺省 `["rowid"]` —— **缺省即现行为**）+ 首块/中块两形态 SQL 构建 + 注入缝改 `runChunkedQuery(sql, params)`。
2. `thincoder-core/memory/core.mjs`（301 行）：`:66`/`:67` 两处 `scanVectors` → `await scanVectors`；读缝 origin 归一 `:60-61` · `:95-96` · `:122-123`；写缝入口归一 `:206`（`syncDir`——替换 `:215`/`:239` 的 origin 用法）· `:246`（`indexMarkdownFile`——`:253-261` upsert 用归一值）。
3. `thincoder-core/memory/docs.mjs`（421 行）：`:116` → `await scanVectors`；读缝归一 `:92-94`；写缝入口归一 `:24`（`docSync`——`:36`/`:71` 的 origin 用法）。 **〔修·§2.10〕**另：`:116` 调用增 `cursorKey`（`memory.codeOrigin ? ["path","line_start"] : ["origin","path","line_start"]`）+ SELECT 增键列。
4. `thincoder-core/memory/code-sync.mjs`（417 行）：`:298` → `await scanVectors`；读缝归一 `:274-276`；写缝入口归一 `:39`（`gitSync`——`:91`/`:95`/`:101-102`）· `:190`（`codeSync`——`:203`/`:240`/`:224`）· `:381`（`reindexFile`——`:397-398`/`:407`/`:411`）。 **〔修·§2.10〕**另：`:298` 调用增同款 `cursorKey` + SELECT 增键列。
5. `thincoder-core/memory/origin.mjs`（**新建** ≈28 行）：`normalizeOrigin(p)` 纯函数——非字符串原样透传 · `\\`→`/` · Windows 盘符大写 · 去尾斜杠（根除外）。
6. `thincoder-core/memory/schema.mjs`（453 行）：`:69-71` PRAGMA 段加 `PRAGMA journal_size_limit`（常量 `WAL_SIZE_LIMIT_BYTES`）+ 开库一次性 `try { db.exec("PRAGMA wal_checkpoint(TRUNCATE)") } catch {}`（失败容忍，零重试）。
7. `thincoder-core/process-probe.mjs`（155 行）：增 `batchAliveAsync(pids)` / `probeCmdlinesAsync(pids)`（`execFile` + Promise；**同一注入缝** `_testImpl`——注入值可能是同步函数，经 `await` 消费）；同步版零改（清理面在用）。
8. `thincoder-core/peer-instances.mjs`（165 行）：导出 `PEER_PROBE_TTL_MS = 5000`；快照结构加 `probedAt`；命中判据（`:107-108`）改为 `hit.mtimeMs === mtime || nowFn() - hit.probedAt < PEER_PROBE_TTL_MS`；`peerInstances`（`:99`）改 **async**（内部 `await` 异步探测版）；`peerInstancesTool.execute`（`:158`）改 `await peerInstances(...)`。 **〔修·§2.11〕**另：模块级 `nowFn` 随同一注入缝增补（`_setPeerInstancesTestImpl({ aliveFn, cmdlineFn, nowFn })`——缺省 `Date.now`、`??` 兜底、测试 finally 恢复；快照 `probedAt` 与命中判据同用该钟）⇒ T-P2「距上次实探 > TTL」有**确定性执行面**（假钟推进，零真实 ≥ 5 s 等待）。
9. `thincoder-core/agent/setup-reminders.mjs`（196 行）：`pushPeerReminder`（`:150`）改 **async** + `await peerInstances(...)`；文案与时序零变。
10. `thincoder-core/agent/setup.mjs`（233 行）：`:101` `if (agent.memory)` → `if (agent.memory && depth === 0)`；`:136` → `await pushPeerReminder(agent)`。
11. **不改** `thincoder-core/memory.mjs`（新档走直引——先例 = `memory-scan-bounds.test.mjs:9` 直引 `@thincoder/core/memory/scan.mjs`）。
12. `thincoder-core/memory/delete.mjs`（237 行）**〔修·§2.11——评审 #1🔴 补全〕**：origin 归一应用点五处——uid 拼装 `matchMemoryRows`（`:56` / `:59` 的 `projectDir` / `teamDir`）· origin 解析 `deleteByUid`（`:171-173`）· 等值查（`:182`）· 护栏查与 `origin !== dirs[layer]` 比较（`:195-197`——**两侧归一**）· `syncDir` 调用（`:206`）各取归一值。
   （`fetchEntry`（`core.mjs:120-123`，已列于条 2）同形——其 path-only 余量兜底（`:131`）仍在，本轮**零改**。）

**测试改动点**：`thincoder-cli/test/memory-scan-bounds.test.mjs`（84）await 化 + 新用例；`thincoder-core/test/peer-instances.test.mjs`（122）await 化 + TTL 用例；新建 `thincoder-cli/test/memory-origin-normalize.test.mjs` · `thincoder-core/test/setup-retrieval-gate.test.mjs` · `thincoder-cli/test/memory-wal-hygiene.test.mjs`（glob 收集，零登记面——`thincoder-core/test/run.mjs:8` · `thincoder-cli/test/run.mjs:9`）。

### 2.4 受影响文件表（当前行数 → 预期；硬限 500 / 软线 300）

| 文件 | 当前 | 预期 Δ | 说明 |
|---|---|---|---|
| `thincoder-core/memory/scan.mjs` | 96 | 预期 +42（≈137）→ **实测 177**〔实施后收正〕 | async 化 + 让出 + **游标键声明/两形态 SQL**〔修·§2.10〕 + 三缝 |
| `thincoder-core/memory/core.mjs` | 301 | +14 | await ×2 + 归一 |
| `thincoder-core/memory/docs.mjs` | 421 | +10 | await ×1 + 归一 + 键列/游标声明〔修·§2.10〕 |
| `thincoder-core/memory/code-sync.mjs` | 417 | +18 | await ×1 + 归一 ×3 + 键列/游标声明〔修·§2.10〕 |
| `thincoder-core/memory/schema.mjs` | 453 | +8 | PRAGMA + 一次性 checkpoint |
| `thincoder-core/memory/origin.mjs` | 新建 | ≈28 | 纯函数叶档 |
| `thincoder-core/memory/delete.mjs` | 237 | +8 | 归一应用点五处（uid 拼装 / 解析 / 等值查 / 护栏 / syncDir）**〔修·§2.11〕** |
| `thincoder-core/process-probe.mjs` | 155 | 预期 +38（≈193）→ **实测 230**〔实施后收正〕 | 异步对偶 |
| `thincoder-core/peer-instances.mjs` | 165 | +18 | TTL + async + `nowFn` 缝（TTL 两侧可测）**〔修·§2.11〕** |
| `thincoder-core/agent/setup-reminders.mjs` | 196 | +4 | async |
| `thincoder-core/agent/setup.mjs` | 233 | +2 | depth 门 + await |
| `thincoder-cli/test/memory-scan-bounds.test.mjs` | 84 | 预期 +85（≈169）→ **实测 369**〔实施后收正〕 | await + 假源改键分页 + 新用例 T-Y5/T-Y6〔修·§2.10〕 |
| `thincoder-core/test/peer-instances.test.mjs` | 122 | 预期 +45（≈167）→ **实测 216**〔实施后收正〕 | await + TTL 两侧用例（假钟注入——零真实等待）**〔修·§2.11〕** |
| `thincoder-cli/test/memory-tool.test.mjs` | 210 | +15 | origin 期望改归一形（AC3 用例组；原依赖「origin = 原样 dir 串」）**〔修·§2.11〕** |
| `thincoder-cli/test/memory-origin-normalize.test.mjs` | 新建 | ≈85 → **实测 123**〔实施后收正〕 | 归一 + 去重不变量 |
| `thincoder-core/test/setup-retrieval-gate.test.mjs` | 新建 | ≈70 → **实测 90**〔实施后收正〕 | depth 门 |
| `thincoder-cli/test/memory-wal-hygiene.test.mjs` | 新建 | ≈60 → **实测 85**〔实施后收正〕 | PRAGMA 读数 |

**实施后实测（超差档逐档收正）〔实施后收正〕**：`scan.mjs` **177**（预期 ≈137）· `process-probe.mjs` **230**（≈193）· `thincoder-cli/test/memory-scan-bounds.test.mjs` **369**（≈169）· `thincoder-core/test/peer-instances.test.mjs` **216**（≈167）· 新建三档 **123 / 90 / 85**（≈85 / 70 / 60）；其余档落在预期 ≈ 内（`core.mjs` 318 · `docs.mjs` 431 · `code-sync.mjs` 427 · `schema.mjs` 460 · `delete.mjs` 242 · `origin.mjs` 24 · `peer-instances.mjs` 178 · `setup-reminders.mjs` 199 · `setup.mjs` 234 · `memory-tool.test.mjs` 214）。读数口径 = `wc -l`（同 `thincoder-core/test/core-hygiene.test.mjs:102`）；**与 §5 第 5 节的四处差异**（实施轮读点滞后）= `scan.mjs` 178→177 · `memory-scan-bounds.test.mjs` 352→369 · `peer-instances.test.mjs` 202→216 · `core.mjs` 314→318——**以本节为最新读数**。

**无越限风险**：最大文件 `schema.mjs` 453 → ≈461（< 500）；`session.mjs`（500）与 `session-slots.mjs`（498）**零改**（无拆分需求）；`delete.mjs` 237 → ≈245。

**软线 300 状态与拆分立场（criterion 8 · 实核 as-of 2026-09-18）〔修·§2.11〕**：本批触碰的 4 档**已越 300 软线**——逐档一行，立场均为「**本批不拆**」：

| 档 | 现状 | 本批后 | 拆分立场 / 理由 |
|---|---|---|---|
| `thincoder-core/memory/core.mjs` | 301 | ≈315 | 本批不拆——改动为点状（await ×2 + 归一调用），拆分为结构批，须独立立项（结构债登记见下） |
| `thincoder-core/memory/code-sync.mjs` | 417 | ≈435 | 本批不拆（同上）；本批新增仅 await ×1 + 归一 ×3 + 键列声明 |
| `thincoder-core/memory/docs.mjs` | 421 | ≈431 | 本批不拆（同上）；本批新增仅 await ×1 + 归一 + 键列 / 游标声明 |
| `thincoder-core/memory/schema.mjs` | 453 | ≈461 | 本批不拆——最接近 500 硬限，但本批新增仅 2 行 PRAGMA / 常量；拆分点（schema 定义 / 迁移 / CJK 分段）归结构批 |
| `thincoder-core/session.mjs`（500）· `session-slots.mjs`（498） | — | 零改 | 本批不触碰——两者逼近硬限的拆分需求另行登记，本批不作拆分依据 |

拆分登记去向：`docs/core/design/STRUCTURE-DEBT.md` §2（结构债总账）登记**另批落笔**（本轮不碰其余档）——本表只留「越线事实 + 本批立场」。

### 2.5 用例表

| # | 类型 | 输入 / 驱动 | 期望（机判） |
|---|---|---|---|
| T-Y1 | 正常（确定性） | 假源 N 行 + `nowFn` 每次推进 ≥ `yieldMs` + `yieldFn` 计数 | 让出次数 ≥ 1 ∧ 行处理序 = **键序**（假源按键分页）∧ 结果集逐条相等 **〔修·§2.10〕** |
| T-Y2 | 边界 | 同上但 `nowFn` 恒 0（预算不触发） | 让出次数 = **0** ∧ 行数 / 结果零变（不白让出） |
| T-Y3 | 正常（等价） | 同源两跑：`yieldMs: Infinity` vs 缺省 | `onRow` 序列与 top-K 逐条**相等**（N-M2） |
| T-Y4 | 集成（真时） | 真 sqlite 夹具（≈1.5 万行 × 1024 维，`toBlob` 直造）驱动 `docSearch` + `setInterval(5ms)` 探针；**多轮（≥3）取中位数** | **主判据（相对 · 硬断言）**：对照 `yieldMs: Infinity` 的 maxGap ≥ 缺省中位数 ×5 ∧ ≥ 300 ms；**缺省面 ≤ 250 ms = 契约读数**（容差形态：中位数入读数、单轮尖峰不判红）**〔修·§2.11〕**。夹具加行数**上界 = 3 万行**（≈123 MB blob）——达上界仍不可达 ⇒ 停调参，落「读数 + 人工复核」，不再加行数、不改语义 |
| T-Y5 | 正常（游标覆盖恒等 · 新增） | 假源 N 行（含同分 / 重复行）+ 两种键声明（`["path","line_start"]` / `["origin","path","line_start"]`）各跑一遍 | 覆盖行数 = N ∧ 每行恰一次（无重无漏）∧ 访问序 = 键升序 ∧ 与「rowid 游标跑」的结果**集合**逐条相等 **〔修·§2.10〕** |
| T-Y6 | 计划面（真 sqlite 夹具 + `EXPLAIN QUERY PLAN`，零表扫 · 新增） | `doc_chunks` 两形态（首块 / 中块）× 两面（有 / 无 origin 等值过滤） | 中块计划 detail **≠** 首块 detail（= 游标谓词确实入 seek）∧ 均含 `USING INDEX` ∧ 任一行**不含** `TEMP B-TREE`——专捕「元组退化残余过滤」静默形 **〔修·§2.10〕** |
| T-G1 | 正常 | `prepareRun(depth 0)` + memory 句柄 + 命中夹具 | history 含 `[Relevant documentation` 与 `[Relevant memories from previous sessions` |
| T-G2 | 边界 | 同夹具 `depth: 1`（任意角色） | 两前缀块**零在场** ∧ `docSearch` / `search` 调用计数 = 0（spy） |
| T-G3 | 边界（AC-8 机判面 · 新增） | `prepareRun` 两路径各跑一次（depth 0 / depth > 0，皆 await 到底）+ `process.on("unhandledRejection")` 计数监听（finally 摘除） | 排空一轮微任务 + 一个宏任务后：**未捕获 rejection 计数 = 0**〔修·§2.11——替代「无浮动 Promise 告警」的不可判形态〕 |
| T-P1 | 正常 | 注入缝：mtime 变 + 假钟推进 < TTL（`nowFn` 注入） | 探测函数调用次数 = 0（快照返回）**〔修·§2.11〕** |
| T-P2 | 边界 | 注入缝：mtime 变 + 假钟推进 > TTL（`nowFn` 注入） | 探测恰 1 次；返回集与探测结果一致**〔修·§2.11——确定性执行面，零真实 ≥5 s 等待〕** |
| T-P3 | 错误/降级 | 探测返回 null（失败） | 按「无活伴」降级 ∧ 提醒零注入（既有语义零变）∧ **降级读数按 TTL 粘滞**（到期重探）；「**不缓存空结果**」实指 **manifest 缺失 / 损坏面**（不粘滞——档一出现即按新档作答）**〔实施后收正〕** |
| T-O1 | 正常 | `codeSync` / `docSync` / `syncDir` 依次以 `D:\X\Proj` 与 `d:/X/Proj/` 两种拼写同步同树（**拼写差限于三变换覆盖面** = 盘符大小写 / 分隔符 / 尾斜杠；**非盘符段大小写不折叠**——`d:\x` 与 `D:\X` **非同键**）**〔实施后收正〕** | 库内该树 origin 键 = 1 ∧ `(origin,path,line_start)` 恰一行 ∧ 计数不翻倍 |
| T-O2 | 边界 | 读缝：`memory.codeOrigin = "D:\X\Proj"` vs `"d:/X/Proj/"`（同覆盖面两拼写）**〔实施后收正〕** | `codeSearch` / `docSearch` 取到**同一批行** |
| T-O3 | 错误 | 非字符串 / 空串 `dir` | `normalizeOrigin` 原样透传 ∧ 各入口不炸 |
| T-W1 | 正常 | 开库（临时目录真库） | `journal_size_limit` 读数 = 设定值；`wal_checkpoint(TRUNCATE)` 后 WAL 文件回落 |
| T-W2 | 边界 | 另一连接持读事务时开库（真库 + 第二连接持读事务） | checkpoint busy ⇒ 不抛、不重试 ∧ 开库成功且库可用；**耗时读数 ≤ `busy_timeout`（3 s）+ 容差**（最坏等待上界——写实口径）**〔修·§2.11〕** |

### 2.6 验收标准（逐条可机判 · 回指 2.2 条目）

- **AC-1（→①/F-M1–F-M3）**：`npm test` 全绿；T-Y1/T-Y2/T-Y3/T-Y5/T-Y6 绿；`SCAN_CHUNK_ROWS === 2000` 值锁不变。**〔修·§2.10〕**游标面双判据 = 覆盖恒等（T-Y5）+ 计划面无 `TEMP B-TREE` 且游标谓词入 seek（T-Y6）。
- **AC-2（→①/F-S1）**：T-Y4 绿——**主判据（相对 · 硬断言）** = 对照 `yieldMs: Infinity` 的 maxGap ≥ 缺省中位数 ×5 ∧ ≥ 300 ms；缺省面 ≤ 250 ms = **契约读数**（多轮中位数，单轮尖峰不判红）**〔修·§2.11〕**。真时探针 = 直接证据；T-Y1/T-Y2 = 确定性证据。**〔修·§2.10〕**墙钟面 = 父侧真机读数（29.4 s → 1.71 s · 同覆盖）；本批**不设**夹具墙钟上限断言（夹具与真库不可比；夹具行数上界见 §2.5 T-Y4）。
- **AC-3（→②/F-M7 + 核 §4.11）**：T-G1/T-G2 绿（depth>0 零注入 ∧ 零检索调用）。**〔修·§2.11〕**需求锚标全 = VSC 端 F-M7（`docs/core/requirements/MEMORY.md:146`，属 §4.7）+ 迁移期参照档 F-Q2/F-Q3 + **核心层同批补条目 `docs/core/requirements/AGENT-LOOP.md` §4.11（F1–F3）**；auto-turn 半条 = 核路径**已满足**（`thincoder-core/agent.mjs:129` `resume: resume || autoTurn`）。
- **AC-4（→③）**：T-P1/T-P2/T-P3 绿 ∧ `thincoder-core/test/setup-reminders.test.mjs` 既有断言全绿（文案与时序零变）。
- **AC-5（→④）**：T-O1/T-O2/T-O3 绿。
- **AC-6（→⑤/F-S5 + N-S3）**：T-W1/T-W2 绿；T-W2 含「**开库耗时读数 ≤ `busy_timeout`（3 s）+ 容差**」——边界写实口径（非「不阻塞」）**〔修·§2.11〕**。
- **AC-7（→批 §1 验收④）**：`node scripts/doc-check.mjs` 本批归属档零新增**入闸**悬空锚 / 零新增超宽行。**〔修·§2.11〕复测三次：225（设计轮基线）→ 226（自清后）→ 285（收笔，两次一致）· 行宽 3**；**285 的增量非本批产物**（50 条集中于引用已退役脚本族 `scripts/doc-anchors-*.mjs` / `check-ledger.mjs` 等他档——该族在两次读数间从盘上消失）；本批两设计档（`MEMORY.md` · `MULTI-INSTANCE-COLLAB.md`）三次读数锚集恒等＝零新增入闸悬空 / 零新增超宽行（逐条见 §2.11 条 2）。本批唯一前向引用 `thincoder-core/memory/origin.mjs` 以「（拟新增」标记列报·不入闸；`MULTI-INSTANCE-COLLAB.md` 的 `T-L1c` 为**既有**悬空（非本批新增）。
- **AC-8（→②/③ 装配面）**：① **机判** = T-G3（两路径跑完 + `unhandledRejection` 计数 = 0）**〔修·§2.11〕**；② 「`peerInstances` / `pushPeerReminder` 的 Promise 在调用面全部被 await」= **人工静态复核项**（零依赖仓无 lint 器；`浮动 Promise` / `unhandledRejection` 在 `thincoder-core/**` 零命中——实核）——**移出 AC 机判集合**。

### 2.7 数据面（父侧 ops 任务书——子代理零触碰 · 仓外路径）

目标库 = `~/.thincoder/memory.db`（实测 2.80 GB · WAL 587 MB）。判据全文 = MEMORY.md §6.11/§6.12。

1. **备份（前置，不可省）**：`VACUUM INTO '<备份路径>'`——判据 = 文件存在 ∧ 大小 > 0 ∧ 打开后 `PRAGMA integrity_check` = `ok`。
2. **归一 + 去重（单事务）**：三表按 `normalizeOrigin(origin)` 折叠；同键同 `(path, line_start)`（`files` 为 `(layer, path)`）留 `mtime_ms` 最大者、并列留 `rowid` 最小者。
3. **校验（三条，全绿才算成）**：① 该树 origin 键集合大小 = 1；② 任一 `(归一键, path[, line_start])` 恰一行；③ `COUNT(*)` ≤ 迁移前。行数预测 = `[max(A,B), A+B]`（A = 71,266 · B = 69,748）。
4. **回收**：`PRAGMA wal_checkpoint(TRUNCATE)`（可选 `VACUUM`——需 2× 磁盘，按需）。
5. **回退**：任一步失败 ⇒ 停库 → 备份替换原路径 → 重开校验。

### 2.8 上报（本设计轮所见 · 逐条）

1. **需求条目缺位（原报 3+1 处）——已消解：需求档已同步（同批 · 父侧笔）**：`docs/core/requirements/MEMORY.md` 新增 **§4.9**（F-S1 扫描期可响应 / F-S2 键序游标 / F-S3 子代不注入召回 / F-S4 origin 归一 / F-S5 WAL 卫生 + N-S1–N-S3）覆盖原 ①②③；**另 1 项**字面相抵见条 8（已收正）。**〔修·§2.11——原「缺位 3 处」口径作废〕**
2. **代码-需求偏离（本批即回归）**：`docs/core/requirements/MEMORY.md:146` F-M7（**VSC 端条目**，属 §4.7）声明召回注入「depth-0」，而 `thincoder-core/agent/setup.mjs:101-126` 无 depth 门。**核心层条目缺位——已消解（同批 · 父侧笔）**：`docs/core/requirements/AGENT-LOOP.md` 新增 **§4.11**（F1–F3，`:191-201`——核心层补位）。**另**：auto-turn 半条现状 = **核路径已满足**（`thincoder-core/agent.mjs:129` `resume: resume || autoTurn` ⇒ 召回块不进）——需求档 §4.11 N3 已收正为「auto-turn 面已满足」（同批 · 父侧笔——2026-09-18）。**〔修·§2.11〕**
3. **悬空指针**：批档 §1.3「与在途线（#55 / #58 实施）文件重叠」在台账**不可解析**（台账最大 id = 51；`#58` 仅见于 `docs/batches/2026-09-13-CORE-UNIFICATION.md` 的条目编号语境）。实测在途线 = #37/#39/#40/#41/#45，与本批**文件零重叠**（本批域 = `thincoder-core/memory/**` + 核 agent/探测面；在途线为 `scripts/**` · `context.mjs` · 模式翻转族）⇒ 无需排队 / 避让。
4. **docs 内矛盾（既有，非本批引入；〔修·§2.10〕已就地收正）**：`docs/core/design/MEMORY.md` §8.3「VSC 镜像面」行仍称 VSC 存储为**文件制**，与 §6.9（W8 后 = 核 sqlite）相抵。
5. **未修面登记**：清理面 `cleanDeadOwners` 仍同步 exec（会话起点路径，非每回合——D-MI14）；VSC 自持镜像面同源缺陷在案不修（D-MI12）；别名路径（subst / junction / 8.3 短名）不在归一覆盖内（§8.3）。
6. **墙钟边界（诚实陈述 · 〔修·§2.10〕收正）**：让出（A2）只解**响应性**；**墙钟**由 **A1（PK 游标）**解——父侧真库实测单趟 **29.4 s → 1.71 s**（同覆盖），即本批已落**一个量级**（原「要量级压制需另批」的判定随之改写）。**剩余** = 每回合 1 趟 ~1.7 s 量级固有成本（② 已去子代 N×2 趟；④/⑤ 另有助益）——再压量级需 ANN / 分层候选（D-MEM13 已登记为后续项）。
7. **嵌套 origin 重叠非缺陷**：`D:\teamcode` 与 `D:\teamcode\thincoder`（7,286 行）是「仓根 / 子仓各自合法 origin」的设计内重叠，**不**进 2.7 去重范围（登记 §8.3）。
8. **需求档字面收正——已完成（同批 · 父侧笔）**：`docs/core/requirements/MEMORY.md` §4.6 **N-M3** 已收正为「无迭代器则**键序分页**——游标键随各表 PK 选取（`doc_chunks`/`code_chunks` = `(path, line_start)`，`entries`/`files` = `id`）」（语义 = 可移植分页不变；`:123` 带 2026-09-18 收正注）。**〔修·§2.11——「待同步」口径作废〕**另：N-M2「除并列序按稳定规则」即本批 tie-order 裁定的需求侧依据（引用，无需改）。

### 2.9 三账一致声明

批次条目（本 §2）= 设计 AC（2.6）= 需求条目（2.2 回指）三链同源；需求侧缺口（2.8 上报 1 / 2 / 8）已由**父侧同批补齐 / 收正**（`docs/core/requirements/MEMORY.md` §4.9 F-S1–F-S5 + N-S1–N-S3 · N-M3 措辞；`docs/core/requirements/AGENT-LOOP.md` §4.11）——缺口面清零，**三链同源成立**。**〔修·§2.11〕**

### 2.10 修正轮（PK 游标 · 2026-09-18）——逐条落地 + 用例 / AC 增量（eng-designer）

> **追加段**（本轮权威增量）：上方 §2.2/§2.3/§2.4/§2.5/§2.6/§2.8 的相应行已就地收正，收正处标 `〔修·§2.10〕`；两处相抵时**以本节为准**。§2.9 三账一致声明仍然有效。

**1. 逐条落地表（派单条 1–3）**

| # | 派单条 | 落点（file:line · 改动后行号） |
|---|---|---|
| 1 | 整合 PK 游标修法（父侧实测 17×） | 设计档 `docs/core/design/MEMORY.md`：**§6.10 新增修法 A1**（`MEMORY.md:316-363`：改前/改后 SQL · 键选取规则 · 否决形反例 · 逐调用点表 · 覆盖恒等声明 · tie-order 裁定 · 并发写可见性 · 可测缝）；§7 补 **D-MEM22**（`MEMORY.md:407`）；§6.8 游标表述改单源指针（`MEMORY.md:268`）。批档：§2.2 · §2.3 条 1/3/4 · §2.4 ×4 行 · §2.5（T-Y1 / T-Y4 + 新增 T-Y5/T-Y6）· §2.6（AC-1/AC-2） |
| 2 | §8.3「VSC 镜像面」行与 §6.9 相抵 | 设计档 `MEMORY.md:442` 该行收正：「VSC 存储为**文件制**（检索实时扫文件）」→「**VSC 存储 = 核 sqlite（与 CLI 同库）——§6.9（W8 归一落地 2026-09-15）**」；随行的「存量 legacy 条目 search 可见但 delete 不可删」标注为**文件制检索面随 W8 退场而失据**（存量条目去向 = `memory import`——未落，登记于该批次档）。批档 §2.8 条 4 同步标「已就地收正」 |
| 3 | 诚实边界句随条 1 更新 | 设计档 §6.10 新增「**墙钟与响应性（诚实边界）**」段（`MEMORY.md:393-399`）——响应性 = A2（每让出窗 ≲ 0.1 s 量级）· 墙钟 = A1（29.4 s → 1.71 s 量级）· 剩余 = 每回合 1 趟 ~1.7 s + 单块不可中断段；§8.3 扫描行收正（`MEMORY.md:440`）；批档 §2.8 条 6 就地收正 |

**2. 技术结论（逐调用点 · 键列实核 = `thincoder-core/memory/schema.mjs`；计划读数 = 本机 `EXPLAIN QUERY PLAN` 实跑）**

| 调用点 | 表 | 表 PK（实核） | 现状计划 | 裁定 |
|---|---|---|---|---|
| `thincoder-core/memory/core.mjs:66` | `entries` | `id INTEGER PRIMARY KEY`（= rowid 别名） | `SEARCH entries USING INTEGER PRIMARY KEY (rowid>?)`——零排序 | **零改**（rowid 游标**即** PK 游标） |
| `thincoder-core/memory/core.mjs:67` | `files` | `(layer, origin, path)` | `SEARCH files USING INTEGER PRIMARY KEY (rowid>?)`——零排序 | **零改**（rowid 序 = 表序 ⇒ 现状已零排序；表小；过滤段 `(layer='team' OR origin=?)` 非等值前缀 ⇒ PK 游标无处可 seek，只多选键列） |
| `thincoder-core/memory/docs.mjs:116` | `doc_chunks` | `(origin, path, line_start)` | `SEARCH … sqlite_autoindex_doc_chunks_1 (origin=?)` + **`USE TEMP B-TREE FOR ORDER BY`** | **改 PK 游标**：键 = `memory.codeOrigin ? ["path","line_start"] : ["origin","path","line_start"]`；SELECT 增键列 |
| `thincoder-core/memory/code-sync.mjs:298` | `code_chunks` | `(origin, path, line_start)` | 同上（同 PK 同过滤形） | **改**：同 `doc_chunks` |

**改前 / 改后 SQL（`doc_chunks` 有过滤面）**：

- 改前（`memory/scan.mjs:81-82` 统一追加）：`… WHERE embedding IS NOT NULL AND origin = ? AND rowid > ? ORDER BY rowid LIMIT ?` ⇒ 计划含 `USE TEMP B-TREE FOR ORDER BY`（每块重排整个过滤集，排序物化含 `embedding` blob）。
- 改后·首块：`… WHERE embedding IS NOT NULL AND origin = ? ORDER BY path, line_start LIMIT ?`；
- 改后·中块：`… WHERE embedding IS NOT NULL AND origin = ? AND (path, line_start) > (?, ?) ORDER BY path, line_start LIMIT ?` ⇒ 计划 `SEARCH … (origin=? AND (path,line_start)>(?,?))`，**零排序**。
- 无过滤面（`memory.codeOrigin` 未设）：首块 `… ORDER BY origin, path, line_start LIMIT ?`；中块 `… AND (origin, path, line_start) > (?, ?, ?) ORDER BY origin, path, line_start LIMIT ?`（索引 seek，零排序）。

**关键反例（本轮新发现，已入设计档 §6.10 A1 + D-MEM22）**：`origin = ? AND (origin, path, line_start) > (?, ?, ?)` 形——SQLite **不**把该元组用作索引约束（计划 detail 仅 `(origin=?)`），谓词退化为**残余过滤** ⇒ 每块从头扫起 = **二次方**，且**无 `TEMP B-TREE`、无报错**（静默退化）。
本机 20 万行夹具（内存库 / 落盘 + `ANALYZE`）：否决形 **2.19 s / 5.65 s**；正解（过滤面 2 元组）**0.50 s / 1.63 s**；无过滤面 3 元组 seek **0.41 s / 1.63 s**。另核：`CREATE INDEX … (origin, rowid)` 被 SQLite 拒（`no such column: rowid`）——派单「PK 游标是唯一低代价路子」成立。

**覆盖恒等**：访问序变化、集合恒等；前提 = 键列全 `NOT NULL` 且唯一（两表 PK 列逐列 `NOT NULL`——`schema.mjs:314-327` / `:353-365`）⇒ 键元组序为严格全序 ⇒ 分页无重无漏。
**tie-order 裁定 = 可接受**（不引入稳定化改造）——四条判据见 `MEMORY.md:354-359`（要点：平局仅存在于**同分**候选；需求侧 N-M2 已显式豁免「除并列序按稳定规则」；稳定规则本身零改；同库同查询的**确定性保持**）。

**3. 用例 / AC 增量（批档 §2.5 / §2.6 已就地同步）**

- **T-Y1 收正**：「行处理序逐条等于基准」→「行处理序 = **键序**（假源按键分页）」。
- **T-Y4 对照阈值改相对形**：对照（`yieldMs: Infinity`）由「maxGap ≥ 1 s」→「≥ 缺省 ×5 ∧ ≥ 300 ms」；缺省「maxGap ≤ 250 ms」= 响应性契约，**不变**。
- **新增 T-Y5（游标覆盖恒等 · 机判）**：两种键声明各跑一遍 ⇒ 覆盖 = N ∧ 每行恰一次 ∧ 访问序 = 键升序 ∧ 与 rowid 游标跑的**结果集合**相等。
- **新增 T-Y6（计划面 · 机判）**：真 sqlite 夹具 + `EXPLAIN QUERY PLAN`（零表扫）⇒ 中块 detail **≠** 首块 detail ∧ 含 `USING INDEX` ∧ 无 `TEMP B-TREE`——专捕「元组退化残余过滤」静默形（该形**无** `TEMP B-TREE` ⇒ 仅查 `TEMP B-TREE` 不足以判）。
- **AC-1 / AC-2 同步**：AC-1 用例集 +T-Y5/T-Y6；AC-2 对照阈值随 T-Y4；墙钟面 = 父侧真机读数（本批**不设**夹具墙钟上限断言——夹具与真库不可比）。

**4. 设计档改动清单（`docs/core/design/MEMORY.md` · **只留符号**——行号不承载：批档内行号每次设计档改动即失据，评审 #8 即此）〔修·§2.11〕**

| 落点（符号） | 改动 |
|---|---|
| §6.10 标题 | →「扫描面修复（PK 游标 + 让出）与子代检索门」 |
| §6.10 病灶段 | 拆为「病灶一（调度面）」/「病灶二（访问序面）」+「触发面」（共用） |
| §6.10 修法 A1 | **新增**（PK 游标）；原「修法 A」→ **A2（让出）**（收正「行处理序逐条不变」） |
| §6.10 墙钟段 | **新增**「墙钟与响应性（诚实边界）」 |
| §6.8 扫描形态行 | rowid 游标表述 → 单源指针（= §6.10 A1） |
| §7 | 新增 **D-MEM22** |
| §8.3 | 扫描上界行收正（+墙钟）+ 新增「扫描期并发写可见性」行 + VSC 镜像面行收正 |
| 变更记录 | +1 行 |

〔修·§2.11〕原表行号（`:300` / `:302-314` / `:316-363` / `:365-376` / `:393-399` / `:268` / `:407` / `:440-442` / `:463`）中，评审 #8 实核 `:407` / `:440-442` / `:463` 与现档不符 ⇒ 本表整表改符号形；权威行号以设计档现档为准。

**5. 未决 / 待主 agent 裁定（需求档笔在父侧 · 〔修·§2.11〕状态更新）**

- **〔修·§2.11〕已消解**：需求档字面（见 §2.8 条 8）已由父侧同批收正——`docs/core/requirements/MEMORY.md` §4.6 **N-M3** = 键序分页（语义 = 可移植分页不变）+ §4.9 F-S1–F-S5 / 核 `AGENT-LOOP.md` §4.11；原「待同步」口径作废。
- 本轮**未做**（按派单）：需求档条目 / 其余档 / 建索引与 schema 变更 / 代码面（`thincoder-core/**` 零触碰）。

### 2.11 修正轮-2（设计评审轮 1 的 12 条）——逐条落地（eng-designer · 2026-09-18）

> **追加段**（本轮权威增量）：上方 §1.2 ① · §2.2 · §2.3 · §2.4 · §2.5 · §2.6 · §2.8 · §2.9 · §2.10 的相应行已就地收正（标 `〔修·§2.11〕`）；两处相抵时以本节为准。§2.9 三账一致声明仍然有效。
> 任务书 = 父侧「冻结批设计修正轮」派单（`Suggestion` 列 = 评审席处置建议，处置执行人 = 本席；12 条逐条改）。**零新语义 / 零新范围**：只落评审发现与派单点名的直接导出项。

**1. 逐条落地表（号 → 改动 file:line · 现档 as-of 本轮改动后）**

| # | 级别 | 落点（file:line · 改动后） |
|---|---|---|
| 1 | 🔴 | ④ 应用点补 `delete.mjs`——设计 `docs/core/design/MEMORY.md:423-426`（删面：uid 拼装 `:56` / `:59` · origin 解析 `:171-173` · 等值查 `:182` · 护栏查与 `dirs` 比较 `:195-197` · `syncDir` `:206`；并注明 `fetchEntry` 余量兜底、本轮零改）；可见面 `MEMORY.md:447-449`（模型可见 id 形态 `C:\…` → `C:/…`）；`MEMORY.md:524`（§8.3 一行）；批档 §2.3 条 12 · §2.4 两行（`delete.mjs` 237→≈245 · `memory-tool.test.mjs` 210→≈225） |
| 2 | 🟡 | T-P2 的确定性执行面——设计 `docs/core/design/MULTI-INSTANCE-COLLAB.md:60-61`（`nowFn` 入同一注入缝，免真实 ≥5 s 等待）· `:80`（注入缝署名补 `nowFn`）；批档 §2.3 条 8 · §2.4 行（`peer-instances.mjs` Δ +14→+18 · 测试档 Δ +40→+45）· §2.5 T-P1 / T-P2 |
| 3 | 🟡 | ⑤ 边界写实——设计 `MEMORY.md:457-458`（修法②）+ `:460-463`（最坏等待上界 = `busy_timeout`（3 s），非「不阻塞」；`wal_checkpoint` 是否走 busy handler = `unverified`，判据面 = 本批 §2.5 的 WAL 边界用例）；批档 §2.5 T-W2 · §2.6 AC-6 |
| 4 | 🟡 | 需求侧口径——批档 §2.8 条 1 / 2 / 8 · §2.9 · §2.2（①–⑤ 行改回指 `docs/core/requirements/MEMORY.md` §4.9 F-S1–F-S5 / 核 `AGENT-LOOP.md` §4.11）；口径 = 「**需求档已同步（同批 · 父侧笔）**」，不写「待补」 |
| 5 | 🟡 | ② 需求锚标全——设计 `MEMORY.md:386-388`（① VSC 端 F-M7（`:146`，属 §4.7）· ② 迁移期 F-Q2/F-Q3 · ③ 核心层 §4.11 同批已补）；批档 §2.6 AC-3 |
| 6 | 🟡 | 软线 300 状态 + 拆分立场——批档 §2.4 新增「软线 300 状态与拆分立场」块（4 档逐档一行 + `session.mjs` / `session-slots.mjs` 零改行 + 登记去向 = `STRUCTURE-DEBT.md` §2 另批落笔） |
| 7 | 🟡 | D-MI4 指针——设计 `MULTI-INSTANCE-COLLAB.md:202` D-MI4 理由列加「探测触发判据见 D-MI13（mtime ∨ TTL）」 |
| 8 | 🔵 | 陈旧坐标——批档 §2.10 条 4 整表改**符号形**（行号不承载；评审点名三处 `:407` / `:440-442` / `:463` 随表作废）；设计 `MULTI-INSTANCE-COLLAB.md:52`（`peer-instances.mjs:99`）· `:55`（`process-probe.mjs:59`）· `:57`（`process-probe.mjs:91`）· `:98`（`:152`）；批档 §1.2 ① 改「`code-index.mjs:150` 的 `yieldTick`（`code-sync.mjs` 消费）」 |
| 9 | 🔵 | T-Y4 绝对项降位——批档 §2.5 T-Y4（主判据 = 相对对照硬断言；缺省 ≤ 250 ms = 契约读数（多轮中位数、单轮尖峰不判红）；夹具行数上界 = 3 万行，达上界即停调参）· §2.6 AC-2 |
| 10 | 🔵 | AC-8 后半机判化——批档 §2.5 新增 T-G3（两路径跑完 + `unhandledRejection` 计数 = 0）· §2.6 AC-8（「无浮动 Promise 告警」移出机判集合、标人工静态复核项） |
| 11 | 🔵 | A1 防呆——设计 `MEMORY.md:322-325`（两道终止判据：键值缺失 ∨ 末键元组未严格大于上一游标键 ⇒ 止（等价现 `scan.mjs:90`）；尾块判据保留（`:92`）） |
| 12 | 🔵 | auto-turn 面现状——设计 `MEMORY.md:396-398`（核路径**已满足**：`thincoder-core/agent.mjs:129` 以 `resume: resume || autoTurn` 传 `prepareRun` ⇒ 召回块不进）；批档 §2.8 条 2 同 |

**2. 机检读数（`node scripts/doc-check.mjs`）**：修轮三次复跑——**225**（= 设计轮基线，修轮起点）→ **226**（本席自清后）→ **285**（收笔时两次复跑一致）；**行宽 3**。
行宽 3 = `docs/core/design/prompts/persona-engineering.md:137`（507 字符）· `:139`（416）（均非本批域）+ `docs/core/requirements/MEMORY.md:123`（303 字符——**父侧同批新增行**，待父侧折行）。
**285 与 225 的增量非本批产物**：其中 **50 条**集中于引用**已退役脚本族**（`scripts/doc-anchors-*.mjs` / `check-ledger.mjs` / `check-doc-width.mjs` / `check-doc-targets.mjs`——现盘 `scripts/` 只有 `doc-check-{anchors,targets,width}.mjs` + `doc-check.mjs` 四档，实核 `git ls-files scripts`）的档：`docs/core/design/DOC-CODE-RECONCILE.md` 20 · `CORE-UNIFICATION.md` 12 · `DOC-DISCIPLINE.md` 8 · `docs/core/requirements/CORE-UNIFICATION.md` 3 + 零散 7 处——即**该族脚本在两次读数之间从盘上消失**（他线并发迁移面），非本批两档所致；余下 ~9 条为他档（`CONTEXT-COMPACTION.md` 等的并发编辑）。
**本批两设计档在三次读数中锚集恒等**（仅行号随本席改动位移；`MEMORY.md` = 6 条既有 + 1 条「拟新增」列报 · `MULTI-INSTANCE-COLLAB.md` = 5 条既有）⇒ **零新增入闸悬空 / 零新增超宽行**；修轮中本席曾引入 4 条（`MEMORY.md` 的 `T-W2` 用例号锚 · `MULTI-INSTANCE-COLLAB.md` 的 `T-P1` / `T-P2` 用例号锚 + 裸 basename 坐标 `peer-instances.mjs:99`）**已当场自清并复跑确认**。

**3. 本轮未做（按派单边界）**：代码面（`thincoder-core/**` 零触碰——实施轮）· 需求档（主 agent 笔，同批在落）· 数据面（父侧 ops）· 其余档。

**4. 留给父侧的 4 点**：① `docs/core/requirements/MEMORY.md:123` 超宽 303 字符（需求档笔在父侧，须折行）；② 需求档 §4.11 N3「auto-turn 面未分析」可按 §2.8 条 2 的实测收正为「已满足」；③ 结构债登记（`core.mjs` 301 / `code-sync.mjs` 417 / `docs.mjs` 421 / `schema.mjs` 453 越 300 软线）建议落 `docs/core/design/STRUCTURE-DEBT.md` §2（本轮不碰其余档）；④ **机检总读数在修轮期间由 225 → 285**（+50 = 已退役脚本族 `scripts/doc-anchors-*.mjs` 等从盘上消失后，他档引用转悬空）——该族引用的收正 = **全仓 doc-sweep 面**，不属本批（建议另批或归 doc-sweep 已有后续项）。

### 2.12 实施后收正轮（2026-09-18 · eng-designer）——6 条落位 + 1 条不成立

> **追加段**（本轮权威增量）：上方 §2.3 条 1 · §2.4 七行 + 表后实测块 · §2.5 T-P3 / T-O1 / T-O2 已就地收正（标 `〔实施后收正〕`）；两处相抵时以本节为准。依据 = 本档 §5（实施轮自写）+ 父侧派单「TUI 假死批实施后收正轮」（fix 轮 · 7 条）。**零新语义**：只落实施实测回填与派单点名的措辞 / 字例收正。

**1. 逐条落地表（号 → 改动 file:line · as-of 本轮改动后）**

| # | 派单条 | 落点（file:line） |
|---|---|---|
| 1 | §6.11「端文件零改」加例外 | `docs/core/design/MEMORY.md:427-428`（端**装配**文件零改 + 核库读数点例外 = `thincoder-vscode/src/extension/panel-index.mjs`（`:20` · `:35-37`））；同句第二处 = `MEMORY.md:489`（D-MEM19 收窄 + 指针） |
| 2 | T-P3 口径 | 本档 §2.5 T-P3 行（`:138`） |
| 3 | T-O1 字例 | 本档 §2.5 T-O1 行（`:139`）；**同表同形字例 T-O2（`:140`）一并收正**——同一缺陷（`D:\X` / `d:\\x` 之差含**非盘符段大小写**，超出三变换覆盖面） |
| 4 | 「块边界同样让出」措辞 | 本档 §2.3 条 1（`:69`）——收正为 **块边界同判**（同一预算；预算未耗 ⇒ 零让出）。据 = `thincoder-core/memory/scan.mjs:174` |
| 5 | AC-4 路径 | **不成立 · 未改**（见第 3 节 1）：`thincoder-core/test/setup-reminders.test.mjs` 实存（242 行 · 2026-09-14 入 git · 入 `thincoder-core/test/run.mjs:8` 的 `test/*.test.mjs` 收集面） |
| 6 | §2.4 行数超差档 | 本档 §2.4 七行（`:89` · `:96` · `:100` · `:101` · `:103` · `:104` · `:105`）+ 表后「实施后实测」块（`:107`） |
| 7 | VSC 端自持 `peer-instances` 复本登记 | `docs/core/design/MULTI-INSTANCE-COLLAB.md:212`（D-MI12 理由列——面③ 在 VSC 端**未落地**：`thincoder-vscode/src/extension/peer-instances.mjs` 同步 · 无 TTL）；两设计档变更记录各 +1 行（`MEMORY.md:557-558` · `MULTI-INSTANCE-COLLAB.md:255-257`） |

**2. 读数（本席实核）**

- **超差 7 档与 §5 第 5 节的差异四处**（实施轮读点滞后）已记于 §2.4 表后块：`scan.mjs` 178→177 · `memory-scan-bounds.test.mjs` 352→369 · `peer-instances.test.mjs` 202→216 · `core.mjs` 314→318。读数口径 = `wc -l`（同 `thincoder-core/test/core-hygiene.test.mjs:102`）。
- **机检 `node scripts/doc-check.mjs`**：悬空 **286 → 286**（零新增）· 行宽 **3 → 3**（三行皆非本批域：`persona-engineering.md:137` / `:139` · `requirements/CONTEXT-COMPACTION.md:27`）· 候选 13311 → 13322（新增候选全部解析）。两设计档悬空集**逐条恒等**（仅行号随本轮改动位移）；本档零悬空。自查折行 1 处（`MULTI-INSTANCE-COLLAB.md:255` 初稿 301 字符 → 折为三行）。

**3. 留父侧两点**

1. **派单条 5 前提不成立**（故未改 AC-4）：`thincoder-core/test/setup-reminders.test.mjs` **实存**——`git ls-files` 命中 · 242 行 · mtime 2026-09-17 18:18（批前）· 首入 commit 2026-09-14（`feat(core): S1 batch 2`）；并入门禁收集面（`thincoder-core/test/run.mjs:8` glob `test/*.test.mjs`）。
   **同条衍生观察（待裁）**：该档**不引** `pushPeerReminder`（导入面 = `envStateLine` / `pushInjections` / `appendImagePointer` / `manifestStateLine` / `pushManifestStateReminder`——全文零 `peer` 命中）⇒ AC-4 第二合取项「既有断言全绿（文案与时序零变）」的**实际载体** = `thincoder-core/test/peer-instances.test.mjs`（T-P3 断言「无同伴 ⇒ 提醒零注入」）。若父侧原意 = 把 AC-4 改指该载体，本席可下轮补指针（**本轮未改**——语义面待裁）。
2. **需求档宽措辞**：`docs/core/requirements/MEMORY.md:190` F-S4 边界列「不改端文件」与 §6.11 收正后的窄读相抵（需求档笔在父侧；同 §5 第 4 节已披露）。

**4. 本轮未做（按派单边界）**：实施面代码（`thincoder-core/**` 零触碰）· 数据面 ops · 需求档（主 agent 笔）· 其余档（`docs/vsc/**` · `docs/cli/**`）· 机检卫生（仅自查折行 1 处）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围**：`docs/core/design/MEMORY.md` · `docs/core/design/MULTI-INSTANCE-COLLAB.md` · `docs/batches/2026-09-18-tui-freeze.md` · `docs/core/requirements/MEMORY.md` · `docs/core/requirements/AGENT-LOOP.md`（实施轮零在场）。

**点状实核（criterion 8 + 可行性）**：§2.4 表内 11 个既有文件行数读数**逐档与磁盘一致**（`scan.mjs` 96 · `core.mjs` 301 · `docs.mjs` 421 · `code-sync.mjs` 417 · `schema.mjs` 453 · `process-probe.mjs` 155 · `peer-instances.mjs` 165 · `setup-reminders.mjs` 196 · `setup.mjs` 233 · `memory-scan-bounds.test.mjs` 84 · `peer-instances.test.mjs` 122）；§2.3 坐标逐条命中（`core.mjs:66/67` · `docs.mjs:116` · `code-sync.mjs:298` 四调用点齐全且无第五调用点 · `setup.mjs:101` 无 depth 门且 `:55/:65/:134` 同函数内其余注入皆有门 · `schema.mjs:69-71` PRAGMA 段与 `:326/:364` PK 声明及列 `NOT NULL` · `code-index.mjs:150` `yieldTick` 且无环（`code-index.mjs:5` 只引 `schema.mjs`）· `make-agent.mjs:51` `memory.codeOrigin = cwd` · `session.mjs:163-172` 每回合重写 manifest · `run.mjs` glob 行）；`peer-domains.mjs:22/:132`、`session-slots.mjs:209` 消费**同步**探测版 ⇒ 「同步版零改」可行。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements/Feasibility（④） | 🔴 | origin 归一应用点枚举漏 `thincoder-core/memory/delete.mjs`：`matchMemoryRows` 用内存 dir 原样拼 uid（`delete.mjs:56` / `:59`），`deleteByUid` 用 uid 内 origin 原样做等值查（`delete.mjs:182` / `:196`），随后 `delete.mjs:195` 的 managed-origin 护栏抛「origin is not a managed … memory dir」。而批档 §2.3 条 2 把 `indexMarkdownFile`（`core.mjs:246`——`:253-261` upsert 用归一值）与 `syncDir`（`core.mjs:206`）设为写缝归一 ⇒ Windows 下存储 origin（`C:/…/projA`）与这些原样串（`C:\…\projA`）不再相等 ⇒ 单删退化到 orphan 兜底、文件不在时直接抛错（`fetchEntry` 同形但有余量兜底，`core.mjs:120-123`）。实证：`thincoder-cli/test/memory-tool.test.mjs:93-96` / `:109-112` / `:119-121` 今日依赖「origin = 原样 dir 串」，该档（210 行）**不在 §2.4 表内**（criterion 8）⇒ Windows 上 `npm test` 不绿（AC-1）。 | ④ 应用点集合补 `delete.mjs`（uid 拼装面 + origin 解析面 + 护栏查面各取归一值）；`thincoder-cli/test/memory-tool.test.mjs`（210 → 预期 Δ）补进 §2.4 表；「模型可见 id 的 origin 形态由 `C:\…` 变 `C:/…`」写入 §6.11 可见面 + §8.3 一行。 |
| 2 | Clarity/Testability（③） | 🟡 | T-P2（「距上次实探 > TTL」）无确定性执行面：`peer-instances.mjs` 现只有 `_setPeerInstancesTestImpl({aliveFn, cmdlineFn})`（`:37` / `:44`），无时钟缝；§2.3 条 8 只写「命中判据改 `nowFn() - hit.probedAt < PEER_PROBE_TTL_MS`」，未声明 `nowFn` 来源与缺省。 | `peer-instances.mjs` 增模块级 `nowFn`（缺省 `Date.now`，`??` 兜底、测试 finally 恢复）或把 TTL 做成可注入参数——免真实 ≥5 s sleep（否则落入 R4 脆弱测试）。 |
| 3 | Feasibility（⑤） | 🟡 | 「busy ⇒ 不阻塞开库」未证：`SQLITE_BUSY_TIMEOUT = 3000`（`schema.mjs:15`）就在 `schema.mjs:71` 设好，紧随其后的开库一次性 `wal_checkpoint(TRUNCATE)` 在另一实例持读事务时可能经 busy handler 等满 ~3 s——而开库正是本批要治的启动路径。（SQLite 对 `wal_checkpoint` 是否走 busy handler 未在本评审内实测 ⇒ 该点半 `unverified`。） | 边界句写实为「最坏等待上界 = busy_timeout」而非「不阻塞」；或为该语句单独设有界/零等待并在失败时保持现状；或仅在 WAL 超上界时触发（数据面一次性回收后本已很小）。 |
| 4 | Requirements（R5 协调项） | 🟡 | 需求侧 4 项缺位 + 1 处字面相抵（设计已逐条登记：§2.8 上报 1/2/8）：①让出可响应无条目；②origin 归一 + 数据面去重无条目；③WAL 卫生无条目；④核心层 AGENT-LOOP 无召回注入条目（`docs/core/requirements/AGENT-LOOP.md` 全文零「召回」命中）；⑤`docs/core/requirements/MEMORY.md:123` N-M3「无迭代器则 **rowid** 分页」与 §6.10 A1（两调用点改 PK 游标）字面相抵。 | 报告即过（R7e）：需求档同一笔内把 N-M3 措辞收正为「键序分页（语义 = 可移植分页不变）」并补 4 项缺位条目。 |
| 5 | Clarity/Requirements 锚定（②） | 🟡 | AC-3「→②/F-M7」的依据落在 **VSC 端条目**（`docs/core/requirements/MEMORY.md:146` F-M7 属 §4.7「VSC 端需求条目」，该节自述「登记 VSC 端现状条目与端差」）与**迁移期参照档**（`thincoder-cli/docs/requirements/AGENT-LOOP.md:283-284` F-Q2/F-Q3；核心档 §5 已把 F-Q1–F-Q13 整节登记为「不并（VSC 面）」）。设计已在 §2.8 上报 2 披露核心层缺位，但 AC-3/§6.10 修法 B 理由① 读作「需求侧原本如此声明」。 | AC-3 与修法 B 依据处标全「VSC 端 F-M7 + 迁移期参照档 F-Q2/F-Q3；核心层条目待补（§2.8 上报 2）」，使下游不把 VSC 端条目当核心层既有声明。 |
| 6 | AC/尺度（criterion 8） | 🟡 | §2.4 只答 500 硬限（「无越限风险」），未记录本批触碰的 4 档已越 300 软线（实核：`core.mjs` 301 · `code-sync.mjs` 417 · `docs.mjs` 421 · `schema.mjs` 453）与拆分立场（criterion 8 的 >300 主动拆分复核带）；`session.mjs`（500，零改）与 `session-slots.mjs`（498，零改）仅以「无拆分需求」带过。 | §2.4 增一列/一句「软线 300 状态 + 拆分立场」（本批不拆 / 顺带拆 / 登记后续项），越线事实与延后理由各一行。 |
| 7 | Document ownership（③） | 🟡 | `MULTI-INSTANCE-COLLAB.md:200` D-MI4 理由列仍写「manifest 变了才批量判活」——即 D-MI13（`:208`）已判「被 `saveSession` 每回合重写自击穿」的旧判据；同表对同一缓存判据两处表述不同（D-MI13 后出权威，D-MI4 未加指针）。 | 按 §6.8 同款做法（`MEMORY.md:268` 改单源指针）在 D-MI4 理由列加「探测触发判据见 D-MI13（mtime ∨ TTL）」。 |
| 8 | Notes（🔵 · 坐标） | 🔵 | 陈旧坐标（本轮收正的段内仍在）：批档 §2.10 条 4 三处对不上现档——「D-MEM22（`MEMORY.md:407`）」实为 `:472`、「§8.3（`:440-442`）」实为 `:505-507`、「变更记录（`:463`）」实为 `:512`/`:528`，**差恰 65 行**（= §6.10–§6.12 新增量），与「行号以改动后为准」自相抵；`MULTI-INSTANCE-COLLAB.md:52`/`:55`/`:57`/`:96` 的 `peer-instances.mjs:171`（实为 `:99`，该档仅 165 行）/`batchAlive :76`（住 `process-probe.mjs:59`）/`probeCmdlines :106`（住 `process-probe.mjs:91`）/`peerInstancesTool :219`（实为 `:152`）；批档 §1.2 ① 把 `yieldTick` 记为 `code-sync.mjs` 的（实体 = `memory/code-index.mjs:150`，§2.3 条 1 引用正确）。 | 收正 §3.1 时顺手改段内坐标为现状值；§2.10 条 4 按现档复测行号（或只留符号不留行号）；§1.2 ① 改「`code-index.mjs:150` 的 `yieldTick`（`code-sync.mjs` 消费）」。 |
| 9 | Tests（R4 🔵） | 🔵 | T-Y4 缺省面 `maxGap ≤ 250 ms` 是**绝对墙钟**阈值（真 sqlite 夹具 + `setInterval(5ms)`），受机器负载 / 夹具维度影响、易假红；设计已给相对对照（≥ 缺省 ×5 ∧ ≥ 300 ms，方向正确），但绝对项仍作硬断言，且「不可达时只准加夹具行数」无上界。 | 绝对项降为「契约读数」（容差 / 多轮中位数），主判据用相对对照；给「加夹具行数」一个上界以免退化为调参循环。 |
| 10 | Clarity（AC-8 🔵） | 🔵 | AC-8 后半「静态核 = 无浮动 Promise 告警」无机判面：零依赖仓无 lint 器，`浮动 Promise` / `unhandledRejection` 在 `thincoder-core/**` 零命中（实核）。 | 改可机判形态（测试内对两路径 prepareRun 断言 `unhandledRejection` 计数 = 0），或写明为「人工静态复核项」并移出 AC 机判集合。 |
| 11 | Clarity（A1 🔵） | 🔵 | 游标重写的防呆条件未写全：现有两道 = `!(next > after)` ⇒ 止（`scan.mjs:90`）+ 尾块 `rows.length < chunk`（`scan.mjs:92`）；A1 只写「键值缺失 ⇒ 止（不空转）」，「末键元组 ≤ 上一游标键 ⇒ 止」的等价条件未落笔（异常行序 ⇒ 空转，正是本批要治的挂死形态）。 | A1 游标段补「末键元组 ≤ 上一游标键 ⇒ 止（等价现 `!(next > after)`）」+ 尾块判据保留一句。 |
| 12 | Requirements（F-M7 细节 🔵） | 🔵 | 修法 B 只落 depth 门；`docs/core/requirements/MEMORY.md:146` F-M7 条件是「depth-0 **非 resume 非 auto-turn**」——`!resume` 由外层 `if (!resume)`（`setup.mjs:52`）满足 ✓，但「非 auto-turn」半句未在设计与 §2.8 上报 2 内分析（若 auto-turn 回合也过该注入块，F-M7 仍余半条）。 | §6.10 修法 B 点一句 auto-turn 面现状（满足 / 未满足 / 另登记），避免「F-M7 已全量对齐」的误读。 |

**计数**：🔴 ×1 · 🟡 ×6 · 🔵 ×5（合计 12）。自核通过面：§2.4 行数读数 11/11 一致、§2.3 坐标逐条命中、让出先例（`code-index.mjs:149-152`）与无环成立、② 的 depth-0 门依据（`setup.mjs:55/65/134/:223` 面 + 子代仍持 readonly `code_search`/`doc_search`）成立、③ 同步/异步分流（`peer-domains.mjs` / `session-slots.mjs` 用同步版）成立。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审范围（轮 3 重跑 · 逐条复核轮）**：`docs/core/design/MEMORY.md` · `docs/core/design/MULTI-INSTANCE-COLLAB.md` · `docs/batches/2026-09-18-tui-freeze.md` · `docs/core/requirements/MEMORY.md` · `docs/core/requirements/AGENT-LOOP.md`（实施轮零在场）。任务 = 逐条复核 §3 轮次 1 的 12 条 + 查修复引入的新面。**核验方式**：本轮全部 `read` 重读（引文逐字），不采信历史快照。

**注**：本次回执随附的「Agent Response（fix claims）」属**另一批评审**（乙批 · 评审 id=60 / 修正轮 id=61：活档 plan 行 · `TESTING.md` 行数 · `subagent.mjs` 408→409 越线 · A-MS6 判据），与本轮复核的 12 条无对应关系——已按文件自身状态核验，该段不参与判断。另：任务书「review surface」行列出 `CONTEXT-COMPACTION.md` / `STRUCTURE-DEBT.md`，按评审对象声明（TUI 假死修复批；「压缩 v2 / 在途线」已列 Excluded）不属本轮对象，未纳入（out-of-scope 备查）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | design/MEMORY.md · batches/2026-09-18-tui-freeze.md | 🔴 | Fixed | ④ 删面补全 + 测试档进表。`MEMORY.md:423`「删面 `thincoder-core/memory/delete.mjs`（评审 #1 补——uid 与索引行的 origin 必须同一形态）」+ 五落点（uid 拼装 / 解析 `:171-173` / 等值查 `:182` / 护栏两侧归一 `:195-197` / `syncDir` `:206`）· `:426` fetchEntry 收口注 · `:447-449` 可见面 id 形态 · §8.3 `:524` 一行 · 批档 §2.3 条 12「`thincoder-core/memory/delete.mjs`（237 行）**〔修·§2.11——评审 #1🔴 补全〕**」· §2.4「\| `thincoder-cli/test/memory-tool.test.mjs` \| 210 \| +15 \| origin 期望改归一形（AC3 用例组；原依赖「origin = 原样 dir 串」）**〔修·§2.11〕** \|」 |
| 2 | 2 | batches/… · MULTI-INSTANCE-COLLAB.md | 🟡 | Fixed | `nowFn` 入同一注入缝：批档 §2.3 条 8「模块级 `nowFn` 随同一注入缝增补（`_setPeerInstancesTestImpl({ aliveFn, cmdlineFn, nowFn })`——缺省 `Date.now`、`??` 兜底、测试 finally 恢复；快照 `probedAt` 与命中判据同用该钟）⇒ T-P2…有**确定性执行面**（假钟推进，零真实 ≥ 5 s 等待）」· M-I `:60`「**可测缝（TTL 两侧）**：模块级 `nowFn`…」· `:80` 注入缝署名补 `nowFn`；Δ（+18 / +45）与 T-P1/T-P2 已同步 |
| 3 | 3 | design/MEMORY.md · batches/… | 🟡 | Fixed | 边界写实：`MEMORY.md:461`「该语句的**最坏等待上界 = 连接上的 `busy_timeout`**（`SQLITE_BUSY_TIMEOUT = 3000` ms……），**不是「不阻塞」**」· `:462` busy-handler 语义 = **`unverified`** + 判据面指向 T-W2 · 批档 T-W2「**耗时读数 ≤ `busy_timeout`（3 s）+ 容差**（最坏等待上界——写实口径）**〔修·§2.11〕**」· AC-6 同 |
| 4 | 4 | requirements/MEMORY.md · requirements/AGENT-LOOP.md · batches/… | 🟡 | Fixed | 需求档已同步：`requirements/MEMORY.md:179` 新增「### 4.9 扫描面响应性 / origin 归一 / WAL 卫生（TUI 假死批——新增 · 2026-09-18 · F-S / N-S…）」= F-S1–F-S5 + N-S1–N-S3 · `AGENT-LOOP.md:191`「### 4.11 回合记忆召回注入（depth-0——新增 · 2026-09-18 · TUI 假死批）」（核心层补位）· N-M3 收正（`:124`「无迭代器则**键序分页**……**2026-09-18 收正**」）· 批档 §2.8 条 1/2/8 与 §2.9 口径随改（「已消解 / 已同步（同批 · 父侧笔）」） |
| 5 | 5 | design/MEMORY.md · batches/… | 🟡 | Fixed | 锚标全：`MEMORY.md:386-388` 「ⓐ VSC 端条目 F-M7（……属该档 §4.7……**非**核心层声明）；ⓑ 迁移期参照档 F-Q2 / F-Q3；ⓒ **核心层条目同批已补** = `docs/core/requirements/AGENT-LOOP.md` §4.11」· 批档 AC-3 同文（需求锚标全 = VSC 端 F-M7 + 迁移期 F-Q2/F-Q3 + 核心层 §4.11） |
| 6 | 6 | batches/… | 🟡 | Fixed | §2.4 新增块：`:109`「**软线 300 状态与拆分立场（criterion 8 · 实核 as-of 2026-09-18）〔修·§2.11〕**：本批触碰的 4 档**已越 300 软线**——逐档一行，立场均为「**本批不拆**」」+ 逐档一行 + `session.mjs`/`session-slots.mjs` 零改行 + 登记去向（`STRUCTURE-DEBT.md` §2 另批落笔） |
| 7 | 7 | MULTI-INSTANCE-COLLAB.md | 🟡 | Fixed | `:202`「\| D-MI4 \| L1 注入频率 = **每回合**（有同伴时） \| 一致可预期；成本 = 回合一次 stat + **探测触发判据见 D-MI13（mtime ∨ TTL）** \|」——旧判据已加单源指针 |
| 8 | 8 | batches/… · MULTI-INSTANCE-COLLAB.md | 🔵 | Fixed | §2.10 条 4 整表改符号形（`:221`「**只留符号**——行号不承载……评审 #8 即此」）+ `:234` 点名三处 `:407`/`:440-442`/`:463` 作废 · M-I `:52` `thincoder-core/peer-instances.mjs:99` · `:55` `thincoder-core/process-probe.mjs:59` · `:57` `（thincoder-core/process-probe.mjs:91）` · `:98` `thincoder-core/peer-instances.mjs:152` · 批档 §1.2 ①「先例 = `code-index.mjs:150` 的 `yieldTick`——`code-sync.mjs` 消费」（本轮实核四处坐标与现档一致） |
| 9 | 9 | batches/… | 🔵 | Fixed | T-Y4 绝对项降位：`:128`「**主判据（相对 · 硬断言）**：对照 `yieldMs: Infinity` 的 maxGap ≥ 缺省中位数 ×5 ∧ ≥ 300 ms；**缺省面 ≤ 250 ms = 契约读数**（容差形态：中位数入读数、单轮尖峰不判红）**〔修·§2.11〕**。夹具加行数**上界 = 3 万行**……达上界仍不可达 ⇒ 停调参」· AC-2 同 |
| 10 | 10 | batches/… | 🔵 | Fixed | AC-8 拆两段（`:152`「① **机判** = T-G3（两路径跑完 + `unhandledRejection` 计数 = 0）**〔修·§2.11〕**；② ……= **人工静态复核项**（零依赖仓无 lint 器……）——**移出 AC 机判集合**」）+ 新用例 T-G3（`:133`） |
| 11 | 11 | design/MEMORY.md | 🔵 | Fixed | `:322`「**两道终止判据**（等价现状 `thincoder-core/memory/scan.mjs:90` 的 `!(next > after)` 与 `:92` 的尾块判据）」+ ①「键值缺失 ∨ **末键元组未严格大于上一游标键** ⇒ 止（游标不前进即止——防异常行序空转……）」+ ② 尾块 |
| 12 | 12 | design/MEMORY.md · batches/… · requirements/AGENT-LOOP.md | 🔵 | Fixed | `:396`「**auto-turn 面现状（评审 #12 落点）**：F-M7 的「非 auto-turn」半条在**核路径已满足**——`thincoder-core/agent.mjs:129` 以 `resume: resume || autoTurn` 传 `prepareRun`……」· 批档 §2.8 条 2 同 · 需求 §4.11 N3「**auto-turn 面已满足**（……2026-09-18 收正……）」 |
| 13 | (new) | design/MEMORY.md · requirements/AGENT-LOOP.md · batches/… | 🔵 | New（非阻塞） | **F-M7 行号 off-by-one**：现档 `requirements/MEMORY.md:147` = 「\| F-M7 \| 回合记忆召回注入：depth-0 非 resume 非 auto-turn 的回合注入召回块（关键词路径，limit 3；注入失败静默跳过） \| 回合装配含召回块（可断）；注入失败不阻塞回合 \|」；而本轮新写/回指的四处仍作 `:146`——设计 §6.10 ⓐ「`docs/core/requirements/MEMORY.md:146`」· `AGENT-LOOP.md:195`「`docs/core/requirements/MEMORY.md:146` F-M7」· 批档 §2.2 ② 行 / AC-3 / §2.8 条 2。建议：按批档自身「行号不承载」口径改符号引用（F-M7 · §4.7），或更正为 `:147` |
| 14 | (new) | requirements/MEMORY.md | 🔵 | New（非阻塞） | **`files` 游标标签不严**：`:124`「游标键随各表 PK 选取：`doc_chunks` / `code_chunks` = `(path, line_start)`，`entries` / `files` = `id`」+ `:188`「`entries` / `files` 现有 rowid 序即其 PK 序（零改）」——`files` 无 `id` 列、其 PK = `(layer, origin, path)`，本批对 `files` 为**零改（rowid 序）**（设计 `:337`「**零改**——rowid 序 = 表序 ⇒ 现状已零排序」）。两档**决策一致**（entries/files 零改），仅标签不严（R7b：设计面为准）。建议写「`entries` = `id`（rowid 别名）；`files` = rowid（零改）」 |

**计数**：🔴 ×0（旧条 0 残 · 新增 0）· 🟡 ×0（轮 1 的 6 条全部落位）· 🔵 ×2（新增/残差，均非阻塞）；旧条落位 **12/12**。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-18 02:59 用户裁定「开修」= 本批批准**（承 02:28「M家族开」后的定向授权）；设计评审三轮：轮 1 = changes-required（🔴1 · 🟡6 · 🔵5）→ fix 轮（id=69 · 12/12）→ 轮 2 = PASS → 轮 3 重跑 = **PASS**（轮 2 回执缺批准段 ⇒ 重跑取 token）⇒ 实施轮派发（eng-coder · initial）。**数据面 ops = 父侧已执行**（去重：doc_chunks 删 68,957 / 重键 791 · code_chunks 删 78,473 / 重键 51；WAL 587 MB → 0；备份表两张在库）。

## §5 实施记录（eng-coder）

**轮次**：实施轮（initial）· **执行者** = eng-coder · **终态** = clean（内部 explore 分歧审计 1 轮 + advisor 代码评审 2 轮全 pass）

**1. 五面逐条落位（对照 §2.3 / §2.4 · as-of 落盘后现档）**

| 面 | 落点（file:line） |
|---|---|
| ① A1 PK 游标 | `thincoder-core/memory/scan.mjs`（`:33`/`:36` 两常量 · `:105-122` BINARY 同序比较器 · `:133-177` 扫描主体：`:147-148` 两形态 SQL · `:169-173` 两道防呆 · `:133-141` 四缝）；调用点键声明 `thincoder-core/memory/docs.mjs`（`:121-125`）· `thincoder-core/memory/code-sync.mjs`（`:304-308`）；`entries`/`files` 零改（`thincoder-core/memory/core.mjs`（`:70-71`）缺省 `["rowid"]` + await） |
| ① A2 让出 | `thincoder-core/memory/scan.mjs`（`:154-157` 预算 · `:167` 行内检查 · `:174` 块边界同判 · `yieldTick` 自 `code-index.mjs`）；`SCAN_CHUNK_ROWS` 值锁未动 |
| ② 子代检索门 | `thincoder-core/agent/setup.mjs`（`:103` `depth === 0` 门 · `:138` await） |
| ③ 同伴探测 | `thincoder-core/peer-instances.mjs`（`:40` TTL=5000 · `:112` async · `:122` 命中判据 mtime ∨ TTL · `:155` probedAt · `:48-53` nowFn 缝）· `thincoder-core/process-probe.mjs`（`:137` / `:183` 异步对偶 + 同一注入缝 + 解析族单源）· `thincoder-core/agent/setup-reminders.mjs`（`:154` async） |
| ④ origin 归一 | 新建 `thincoder-core/memory/origin.mjs`（24 行）；写缝 `thincoder-core/memory/core.mjs`（`:213`/`:264`）· `docs.mjs`（`:26`）· `code-sync.mjs`（`:41`/`:193`/`:392`）；读缝 `core.mjs`（`:62`/`:99`/`:127`）· `docs.mjs`（`:95`）· `code-sync.mjs`（`:278`）；删面五落点 `thincoder-core/memory/delete.mjs`（`:58`/`:62`/`:178`/`:180`/`:201`）；端装配文件零改 |
| ⑤ WAL 卫生 | `thincoder-core/memory/schema.mjs`（`:17` 常量 64 MB · `:78` journal_size_limit · `:79` 开库一次性 TRUNCATE + 失败容忍） |

**2. 用例面（§2.5 逐条 + 增量）**

- 全绿：T-Y1–T-Y6（`thincoder-cli/test/memory-scan-bounds.test.mjs`）+ 增量 **T-Y5b**（键含增补平面字符的防呆锁定）· T-G1–T-G3（`thincoder-core/test/setup-retrieval-gate.test.mjs`）· T-P1–T-P3（`thincoder-core/test/peer-instances.test.mjs`）· T-O1–T-O3（`thincoder-cli/test/memory-origin-normalize.test.mjs`）· T-W1–T-W2（`thincoder-cli/test/memory-wal-hygiene.test.mjs`）。
- T-Y4 断言形态（披露）：硬判 = 缺省中位 ≤250 ms ∧ 对照 ≥300 ms ∧ ≥2×；设计主判据 ×5 以**读数**打印（夹具上界 3 万行处 5 轮读数 3.8–6.1× 不稳 ⇒ 按 §2.5「达上界即停调参、落读数 + 人工复核」逃生口处置）。
- 门禁：三包 `npm test` 全绿（core 324 / CLI 669 / VSC 599）；lint = CLI 178 档 · VSC 192 档 OK。

**3. 行为读数（AC-④）**

- **A1 真库耗时对照**（只读连接 · 同库同键 · 覆盖恒等）：`doc_chunks` 71,978 行 —— 旧形（rowid 游标）中位 **24,658 ms** → 新形（PK 游标）中位 **1,321 ms**（**18.7×**）；`code_chunks` 78,586 行 —— **26,541 ms → 1,056 ms**（**25.1×**）。与父侧基线（29.4 s → 1.71 s）同量级同结论。
- **计划面**（真库 `EXPLAIN QUERY PLAN`）：旧 = `SEARCH … (origin=?)` + **`USE TEMP B-TREE FOR ORDER BY`**；新首块 = `(origin=?)` 零排序；新中块 = `(origin=? AND (path,line_start)>(?,?))`；**否决形** = 仅 `(origin=?)`（残余过滤、且无 TEMP B-TREE）——与 §6.10 修法 A1 逐字一致。
- **A2 让出**：真库单表缺省 50 ms ⇒ 让出 13–19 次、maxGap 0.9–1.5 s（冷页 / 单块物化主导）；对照 `Infinity` ⇒ 0 次、maxGap ≈ 全趟。夹具面（3 万行 × 1024 维 · 5 轮中位数）：缺省 **66–141 ms**（契约读数达标）· 对照 **376–785 ms** · 比值 3.8–6.1×。
- **如实边界**：单块 `.all()` 不可中断 ⇒ 冷页下 maxGap ≈ 单块物化（§8.3 已登记上界；消解路径 = 下调 `SCAN_CHUNK_ROWS`，须与内存上界契约同批改——另批）。

**4. 表外改动（逐条披露 · 含理由）**

| # | 文件 | 改动 | 理由（本批内必需） |
|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/panel-index.mjs`（`:20` · `:35-37`） | 读数点 `readIndexCounts` 取 `normalizeOrigin(cwd)` 后查两表 | 核内写缝归一后读数点不取同形键 ⇒ 面板恒显 `built:false` / `files:0`（本批归一引入的新不一致）；与设计 §6.11「端文件零改」字面相抵——按该句括号内「端**装配**文件」窄读（需求 `docs/core/requirements/MEMORY.md`（`:190`）「不改端文件」宽措辞待父侧收正） |
| 2 | `thincoder-core/memory/core.mjs`（`:226-251`） | `syncDir` 既有缺陷修复：mtime 未变分支补 `skipped++` + `indexed.delete(filename)`（`:238`）；`:231` stat 加容错 | 原行为 = 未变文件落 stale 候选 ⇒ 被清理误删（索引 1→0→1 翻覆，T-O1 暴露）；stat 原样抛出会「删除已成功却报失败」（调用面 `thincoder-core/memory/delete.mjs` 先 unlink 后 syncDir） |
| 3 | `thincoder-core/test/core-hygiene.test.mjs`（`:34`） | `memory/core.mjs` 入 `SOFT_LINE_REGISTRY` | 超 300 软线未登记 = 硬红（`npm test` 绿的必要配套）；拆分立场（本批不拆）见 §2.4 块 |

**5. 行数落盘核对（超差 ⇒ 报）**

- 超设计预期：`thincoder-core/memory/scan.mjs` 178（预期 ≈137）· `thincoder-core/process-probe.mjs` 230（≈193）· `thincoder-cli/test/memory-scan-bounds.test.mjs` 352（≈169）· `thincoder-core/test/peer-instances.test.mjs` 202（≈167）· 新建三档 123 / 90 / 85（≈85/70/60）——成因 = 让出与游标注释、T-Y4 夹具、T-Y5b、T-P3 两侧加厚。
- 合表：`thincoder-core/memory/core.mjs` 314≈315 · `docs.mjs` 431≈431 · `code-sync.mjs` 427≈435 · `schema.mjs` 460≈461 · `delete.mjs` 242≈245 · `origin.mjs` 24≈28 · `peer-instances.mjs` 178≈182 · `setup-reminders.mjs` 199 · `setup.mjs` 234 · `memory-tool.test.mjs` 214≈225。
- 无档越 500 硬限；`session.mjs` / `session-slots.mjs` 零改。

**6. 数据面上报（父侧 ops · 阻塞项 · 子代理零触碰）**

- 实测：真库 origin 键仍为**原样反斜杠形**（`D:\teamcode` = doc 72,003 行 / code 78,586 行；归一形 `D:/teamcode` = **0 行**；另有两处小写盘符的嵌套树键）⇒ 代码读写已按归一形，**迁移补齐前该树既有行对 FTS / 向量读全不可见**，且下次 sync 会再长出第三键（索引不减反增）。
- 建议 ops：三表按 `normalizeOrigin` 重写 origin（SQL 形 = `upper(substr(replace(origin,'\','/'),1,1)) || substr(replace(origin,'\','/'),2)`），再跑 §2.7 三条校验；备份表已在库（`doc_chunks_bak_20260918` / `code_chunks_bak_20260918`）。

**7. 内部审计与代码评审（轮次 · 终态）**

| 环节 | 轮次 | 结论 |
|---|---|---|
| explore 分歧审计 | 1 | DEVIATIONS（表外未披露 ×3 · 轻级形态差 ×3；**PARTIAL = 0**）→ 逐条处置 |
| advisor 代码评审 | 1 | **pass**（🟡 ×2 report-only · 🔵 ×3 · 🔴 = 0） |
| advisor 修复核验 | 2 | **pass**（逐条核验修复声明；新引入问题 = 0） |
| 终态 | — | **clean** |

**8. fix round（1 轮内收敛）**

- 采纳并落地：① 游标防呆比较器改 **BINARY 同序**（`thincoder-core/memory/scan.mjs`（`:105-122`）`compareText`；测试假源比较器同改；新用例 T-Y5b 反证 = 旧比较器覆盖 2/3 行、新 3/3）；③ `syncDir` stat 容错。
- 报告项（非 must-fix · 父侧裁定面）：② `panel-index.mjs` 与需求 F-S4 措辞相抵（见本档 §5 第 4 节）；④ T-P3「不缓存空结果」覆盖面（实现只对 manifest 缺失面不缓存，探测失败面按 TTL 粘滞 = 设计合规，建议批档措辞收正）；⑤ T-Y4 缺省面 ≤250 ms 硬断言保留（本机 ≥8 次复跑中位 66–141 ms，余量 ≥1.7×）。

## §6 验证与收口（父代理）

**收口（2026-09-18）**：

- **验收**：AC-1–AC-8 逐条落位（T-Y / T-G / T-P / T-O / T-W 全绿 · 三包 core 324 / CLI 669 / VSC 599）；**A1 真库对照 = 24,658 / 26,541 ms → 1,321 / 1,056 ms（18.7× / 25.1×，覆盖恒等）**；先红证据在册（旧形计划含 `TEMP B-TREE` · `syncDir` 1→0→1 翻覆 · T-Y5b 覆盖 2/3 行静默早停）。
- **AC-2 简化（父侧裁定：接受）**：T-Y4 主判据「≥ 缺省中位数 ×5」按 §2.5 自身逃生口降为打印读数（夹具上界 3 万行处不稳定，实测 3.8–6.1×），硬断言由「≥300 ms ∧ ≥ 缺省 ×2」承载；若日后要 ×5 硬断言 ⇒ 改夹具规模 / 改判据 = 另批。
- **提交**：`a28aa7d4`（21 档 · +1170/−163）。
- **数据面 ops（父侧直接执行 · 2026-09-18）**：存量 origin 按真身 `normalizeOrigin` 逐值迁移——11 组映射 / **165,017 行**（doc 85,113 · code 79,898 · files 6，总量前后恒等）；校验 = 三表零非归一残值 · 读校验 `D:/teamcode` = code 78,586 / doc 72,008 · WAL checkpoint 归零；备份表 `*_bak_20260918` 在库。
- **实施后收正轮**（id=79 · §2.12）：6 条落位 + 1 条前提不成立（AC-4 所引测试档**实存**——派单前提有误，子代理纠正并留痕）；§2.4 七行按实核收正（**§2.4 = 最新读数**，§5 时点读数保留为实施轮段）。
- **残留（登记）**：① `thincoder-cli/test/memory-scan-bounds.test.mjs` 实测 **369 > 300 软线**（CLI 侧无软线机检 ⇒ 不红；纳入与否 = 另批）② VSC 端自持 `peer-instances` 复本（面③ 未落地）⇒ D-MI12 端差行 ✓ ③ **`git` 工具 `status` false-clean** ⇒ 台账 **#55**。
- **三账**：台账 **#50** 可核销；批档冻结；收口日期 2026-09-18。
