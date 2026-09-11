# TUI OOM 取证固化（堆快照参数进启动链）· 批次记录（2026-09-11）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 23:42 · 来源 = 用户 23:39「这个故障比较难复现，这个参数你是不是能固化在代码里，这样碰到的时候他们能截图发给我；他说是会话很长的时候容易发生」。

---

## §1 讨论（主 agent 记）

### 状态

**已收口 2026-09-11**（用户直述）。下一步 = **设计**（spawn eng-designer）。

### 背景（已核事实，as-of 2026-09-11）

| # | 事实 | 证据 |
|---|---|---|
| 1 | 同事实测：CLI TUI 会话 ~19.4 分钟（1,166,708ms）后 **Node 堆 OOM**（`Ineffective mark-compacts near heap limit`，堆 ~8192MB） | 截图（用户 23:35 提供）；次生症状 = 进程猝死后鼠标上报未恢复（滚动飞数字串） |
| 2 | 崩溃捕获链已生效（TUI-STDERR-CAPTURE + R25）：stderr 落屏 + `report.<ts>.<pid>.json`（Node 诊断报告，写进程 CWD）+ `~/.thincoder/crash-reports/tui-stderr-<ts>-<pid>.log`（父包装 tee） | `bin/thincoder.mjs:32-46` · `src/tui/wrapped-spawn.mjs:14-35` · `src/crash-reports.mjs:6/28-29` |
| 3 | **缺对象级证据**：Node 诊断报告只有堆分区统计，**无「谁在持 8GB」** | 报告格式所限 |
| 4 | TUI 路径 = 父包装 spawn 子（`bin/thincoder.mjs` 自包装——子进程 stderr 被 tee）；**child spawn 处可注入 node 参数** | `wrapped-spawn.mjs:29`（`stdio: ["inherit","inherit","pipe"]`） |
| 5 | 用户目标：**固化取证参数**——下次任意用户碰到即在事故现场留下对象级证据（可截图/回传）；不追求眼前复现 | 用户 23:39 原话 |

### 需求（U1——本批）

**把 `--heapsnapshot-near-heap-limit=1` 固化进启动链**（近堆上限时自动落一份 `.heapsnapshot`），使 OOM 事故现场自动留对象级证据；配套要求：
- **落点可见**：快照路径在 stderr 有明确打印（用户/同事可截图回传）；
- **可关**：env 开关（如 `THINCODER_HEAP_SNAPSHOT=0`）——供不需要/不便时关闭；
- **主路径 = TUI**（实测崩溃路径）；非 TUI 路径（chat/run）是否同覆盖由设计判（写明理由）；
- **代价可知**：快照 ≈ 堆大小（本例 ~8GB 级）+ 写入耗时可观——设计须评估对「崩溃现场」的影响并写明取舍（另：是否同时固化 `--max-old-space-size` 以限快照体积——由设计给候选，**倾向不改**，改堆上限会改变崩溃时机）。

### 设计约束

- 注入点候选（选择理由进档）：① `wrapped-spawn.mjs` child spawn 的 execArgv 注入（TUI 主路径，最小面）② `bin` 早期自 re-exec（全路径覆盖，但双进程）——候选 ≥2 对比；
- 与既有捕获链协同：快照 + Node report + tui-stderr 三件套的落点/命名/可发现性写清（快照由 Node 写 CWD——是否需要启动时提示「快照将落在 <cwd>」）；
- 测试：参数注入可机验（spawn 参数断言族——`wrapped-spawn` 有既有测试先例）；env 开关用例；真快照不跑（代价大——用参数断言替代，写明）。
- **范围外**：泄漏根因修复（另波/另批——勘察 explore#7 在跑 + 同事物证待取回）· 不改堆上限默认值 · 不改崩溃捕获既有面。

### 关联

- 同主题后续：CLI TUI 长会话堆 OOM 根因修复（需求池已在册——本批只做取证前置）。
- 勘察在跑：explore#7（泄漏点候选清单）。

---

## §2 批次任务（eng-designer 写）

---

**状态：任务书就绪**（2026-09-11——需求档 `docs/requirements/CRASH-REPORTS.md`（新板块）· 设计档 `docs/design/CRASH-REPORTS.md`（新板块）已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求 = `docs/requirements/CRASH-REPORTS.md` §2（F3）+ §3（N1-N4）· 设计+测试 = `docs/design/CRASH-REPORTS.md` §3（契约）/ §5（AC）/ §6（用例）。

**板块建档说明**：崩溃捕获与取证此前无现行权威档（R25 在架构档为「归宿待定」占位）——本批建档；README 地图（§4 / §4.1）与架构档（§4 模块行登记、§6 占位移除）已同批更新（设计师落）。

**覆盖需求（本批）**：
- F3① 默认武装·全路径（注入缝断言：`setHeapSnapshotNearHeapLimit(1)` 恰一次；入口单点 `bin/thincoder.mjs:43`）
- F3② 可关（`THINCODER_HEAP_SNAPSHOT` 关值集合 {0, false, off, no}——trim + 大小写不敏感）
- F3③ 落点与可见（TUI 子进程 argv 首位 `--diagnostic-dir=<crash-reports 目录>`；其余路径 CWD；写时 Node 原生 stderr 行上屏 + 落 tee 日志）
- F3④ 代价落档（设计档 §3.5——不改堆上限）
- N1 不阻断 · N2 零回归 · N3 清理与判定集（purge 扩展、不误报）· N4 测试口径

**不在本批（范围外）**：泄漏根因（姊妹批 TUI-OOM-ROOTCAUSE）· `--max-old-space-size` · 启动提示 · VSC 端 · 非 TUI 落点改向。

**受影响文件（files 声明用）**：`src/crash-reports.mjs`（+~16 · 129→~145）· `src/tui/wrapped-spawn.mjs`（+~2 · 39→~41）· `test/crash-reports.test.mjs`（新 ~110）· `test/tui-stderr-capture.test.mjs`（+~10 · 79→~89）。

**实现要点（防跑偏——细节以设计档为准）**：
- 武装 = 运行时 API（**不是** CLI 旗标注入）——§1 候选①在选定组合中只承担落点定向（设计档 §2.1）
- 落点定向 = 子 argv 首位 `--diagnostic-dir`（无条件注入）
- env gate 单点在 crash-reports.mjs（wrapper 不判 env）
- 武装步骤独立 try/catch（尽力面——失败不阻断）
- 命名空间 import（API 缺失降级为调用期异常，不做 import 期硬失败）
- 注入缝 = `prepareCrashReporting({ dir, env, armHeapSnapshot })`——默认参数保 `bin/thincoder.mjs:43` 调用点零改

**验收标准**：AC1-AC8（设计档 §5——逐条回指 F3①-④ / N1-N4）。**测试**：设计档 §6 用例 T1-T8（快层注入缝断言——无真快照；T8 = 手动 QA 面，不进套件）。

**事实更正（供评审知悉）**：§1 事实表 #2 的「report.*.json 写进程 CWD」经实测更正为写 `~/.thincoder/crash-reports/`（`process.report.directory` 已由进程内设定——`src/crash-reports.mjs:66`）——设计档 §1.1 已落更正与证据。

**占位行清理（本节作者）**：本段正文前的模板遗留占位行「_（待写——eng-designer）_」已清除（append-only 工具语义不删既有行——由本节作者手工清理并留此注；同 REVIEW-CHAIN-GUARDS 先例——D6 回读核实无正文重复）。

### 修正轮（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）**pass**（🔴 0 · 🟡 3 · 🔵 2——发现表见 §3）。父侧裁决：**5 条全修**（#1–#5）。本轮 = 修正轮（**只改文档、不碰实现**——`src/**` / `test/**` 零改；未新建档；§1 / §3 零碰；同链内，不重新发起评审）。

**发现 → 落点映射（5/5 已落——行内标记「修正轮 #N」可核）**：

| 发现 | 级别 | 落点 |
|---|---|---|
| #1 矩阵引用不可解析（「D/E/I」） | 🟡 | `design/CRASH-REPORTS.md` §2.1 候选 3 行——「实测 D/E/I」→「实测 D/E」（矩阵无 I 行，悬空引用删；行内标 修正轮 #1） |
| #2 AC7/T7 负例隔离不足 | 🟡 | 同档 §6 新增 **T7b** 行（仅新 Heap 快照、无 crash/report 记录 → `recentCrashHint` 返回 `null`）+ AC7 回指改「T7 / T7b 绿」（修正轮 #2） |
| #3 行号锚定 | 🟡 | 同档 §1.1 加 as-of 口径注 + §2.1 候选 3/4 · D1 · §3.1（调用点 / 注入先例）· §3.4 · §4 `bin` 行 · AC1 行号锚 → 符号锚（`prepareCrashReporting` / `spawnTuiWrapped` / `buildBashEnv` /「bin 入口」；修正轮 #3） |
| #4 .md 行已在盘 | 🔵 | 同档 §4 表 README / ARCHITECTURE 两行——增量列改「**已落（建档时）**——现 243 / 85」+ 表下实现增量注（修正轮 #4） |
| #5 T8/D7 命令缺参 | 🔵 | 同档 §6 T8 行 + D7——命令写全 `node --max-old-space-size=64 test/fixtures/r25-oom.mjs`（修正轮 #5） |

**变更记录注记**：`design/CRASH-REPORTS.md` §8 追加一行修正轮注记（5 条全落）。需求档 `requirements/CRASH-REPORTS.md` 零改（#2 修法落在设计侧——T7b / AC7 回指）。

**检查（修正后实测）**：D6 回读（5 处落点逐处复核）✓；`node scripts/check-doc-width.mjs`——本批触碰档（`design/CRASH-REPORTS.md` + 本档）零超宽、零新增一致性违规；其余 FAIL（18 档 29 行 + 一致性新增 2 条）均为他批在飞档，不在本批触碰面。

## §3 设计评审（评审子代理写）

_（待写——评审子代理）_

---

### 轮次 1（评审子代理）

评审对象：`docs/requirements/CRASH-REPORTS.md`（F3 + N1-N4）+ `docs/design/CRASH-REPORTS.md`（§1-§8——近堆上限堆快照进启动链）——待评审态。独立设计评审；抽检：设计全部代码锚点与受影响文件行数（crash-reports.mjs 129 / wrapped-spawn.mjs 39 / bin/thincoder.mjs 406 / tui-stderr-capture.test.mjs 79）与盘上一致；§2.1 Node 行为实测矩阵未复跑（采信设计自证据）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity | 🟡 | `docs/design/CRASH-REPORTS.md:41` 引用「实测 D/E/I」，但 §2.1 矩阵（:34-37）无 I 行（A/B、C、D/E、H——F/G 亦缺）——引用不可解析 | 补齐场景行或改指/删除「I」引用 |
| 2 | Acceptance | 🟡 | AC7（`docs/design/CRASH-REPORTS.md:166`）称 T7（:179）机验「不因快照文件误报」，但 T7 场景含新 crash 记录——正例在场，快照误报（判定集若误纳 Heap）不可观察（对应需求 `docs/requirements/CRASH-REPORTS.md:47`） | T7 补子场景：仅新 Heap 快照（无 crash/report 记录）→ `recentCrashHint` 返回 null |
| 3 | Methodology | 🟡 | 设计以行号锚定代码（`docs/design/CRASH-REPORTS.md:14-17` 证据表、:87、:119、D1/D2 :70-71）——AGENTS.md（评审上下文 Project Guide）约定：设计档用符号锚定、不用行号；本批自身 +~16 行改动即令 §1.1 行号锚移位（行号现均与盘上一致——问题在可持性） | 契约/决策节改符号锚（prepareCrashReporting / spawnTuiWrapped /「bin 入口」）；行号仅留 as-of 证据表并注明 |
| 4 | Doc hygiene | 🔵 | 受影响文件表（`docs/design/CRASH-REPORTS.md:149-150`）两行 .md 所述改动已在盘（README 现 243 行——:193/:227；ARCHITECTURE 现 85 行——:61/:79/:83；批次档 :53 记「已同批更新（设计师落）」）——实现者有重复落档面 | 标注「已落（建档时）」或移出实现增量 |
| 5 | Clarity | 🔵 | T8/D7 手动 QA 命令（`docs/design/CRASH-REPORTS.md:80-81`、:180）`node test/fixtures/r25-oom.mjs` 缺夹具前提 `--max-old-space-size=64`（`test/fixtures/r25-oom.mjs:6`）——照抄运行非 236MB/≈10s 场景 | 命令写全：`node --max-old-space-size=64 test/fixtures/r25-oom.mjs` |

VERDICT: pass

计数：🔴 0 · 🟡 3 · 🔵 2

## §4 用户批准（主 agent 记）

**2026-09-12 00:10 父侧代签**——用户 23:43「自动推进到排空」授权；条件齐备：轮次 1 pass（0🔴 · 3🟡 · 2🔵）→ 修正轮 5/5 落地（#17——含 T7b 负例 + 符号锚化 + 「已落」标注）→ token 已签发（值不落档）。

**批准范围**：近堆上限堆快照进启动链（F3①-④ / N1-N4）——实施面 = §2 / 设计 §4（`src/crash-reports.mjs` + `src/tui/wrapped-spawn.mjs` + 新测档 + `test/files.mjs` 入册；README/ARCHITECTURE 两行**已落（建档时）**——剔除实现增量）；实施者 = eng-coder（设计 token 门）。

**遗留**：① 设计档 L4 状态行陈旧（「待设计评审」）——随链路推进统一刷新（非阻断）；② 与 TUI-OOM-ROOTCAUSE 批在 `wrapped-spawn.mjs` 同域——调度器串行；commit 随「扫」批。

---

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

---

**状态：交付完成 · 收敛（clean）**（2026-09-12——实施者 = eng-coder · 设计 token 门已过）。写域 = §2 声明四档；未 commit、未发起评审、未碰他批档。

### 一、交付摘要（交付表按需求点）

| # | 需求点（§2 / 设计 §5） | 交付 | 证据（file:line） |
|---|---|---|---|
| F3① 默认武装·全路径 | `prepareCrashReporting()` 内 `armHeapSnapshot(1)`（默认 = `v8.setHeapSnapshotNearHeapLimit`——命名空间 import，API 缺失降级为调用期异常并被吞）；单点 = bin 入口既有调用（`bin/thincoder.mjs:43` 零改） | `src/crash-reports.mjs:80`（签名）·`:88-90`（武装）；T1 / T3 / T5 |
| F3② 可关 | `THINCODER_HEAP_SNAPSHOT` 关值集合 {0,false,off,no}（trim + 小写）；判定单点在 crash-reports（包装器不判 env） | `:33` / `:66-69`；T2（含空格/大小写变体）· T3（未设/空串/1/true/yes/未知） |
| F3③ 落点与可见 | TUI 子 argv 首位 `--diagnostic-dir=<crashReportsDir()>`（Node 选项须在脚本路径前；无条件注入——gate 单点）；其余路径 CWD（设计既有边界） | `src/tui/wrapped-spawn.mjs:30`；T6（含「env 关值下仍注入」负例锁） |
| F3④ 代价可知 | 设计档 §3.5 表（体积/耗时/额外内存/次数/常态开销/取舍）——建档时已落（设计者） | `docs/design/CRASH-REPORTS.md:124-133` |
| N1 不阻断 | 武装独立 try/catch——不阻断启动、不影响 F1 既有步骤 | `src/crash-reports.mjs:87-90`；T4 |
| N2 零回归 | 既有崩溃链用例（含慢例真 spawn）全绿；T6 断言 argv 序零破；非 TUI 面除 CWD 快照外零变化 | 套件证据见「三、验证证据」 |
| N3 清理与判定集 | purge 模式 `/^Heap\..+\.heapsnapshot$/`；不入 `recentCrashHint` 判定集 | `:49-51` / `:46-48`；T7（正例）· T7b（负例——仅快照 → null 且不误删） |
| N4 测试口径 | 注入缝断言（无真快照）；T5 API 存在性守护；T8 手动 QA 面未进套件（全仓零测试驱动 `r25-oom.mjs`） | `test/crash-reports.test.mjs` 全文 |

### 二、决策透明表（实现期自决——非设计空白）

| # | 决策 | 备选 | 理由 |
|---|---|---|---|
| 1 | T6 落 `test/tui-stderr-capture.test.mjs`（非新档） | 新档收 T1-T7b vs 按设计 §4 分配 | 设计 §4 该行明写「+~10 → T6（既有 mock 族）」——复用 `fakeChild`/`runMock`；任务书括注「T1-T7b（新档）」为简写，以设计档为准 |
| 2 | 武装块置于 F1（mkdir/report）try 之后、purge 之前 | 与 F1 合并 try / 置于最前 | 设计 §3.1「独立 try/catch——不影响 F1 既有步骤」；purge 在后保持既有搭车点序 |
| 3 | env 判定 = `String(env?.THINCODER_HEAP_SNAPSHOT ?? "").trim().toLowerCase()` 单表达式 | 多分支判定 | 未设/空串/非字符串统一归「开」（fail-open 向取证）；关值集合单点比较；T2/T3 两向覆盖 |
| 4 | T6 内追加「env 关值下仍注入」断言（不新增用例编号） | 新增 T6b 子用例号 | 设计 §6 编号表为批准面——并入 T6 保持清单不变；该断言钉死设计 §3.2「无条件注入」（防两处判定漂移） |
| 5 | 慢例 env 显式中和 `THINCODER_TUI_WRAPPED: ""` | 保原样透传宿主 env | 宿主 TUI 会话把该门透传给套件 → 慢例假红（本批实测重现）；中和后两态宿主下均确定性绿（修 #1，advisor 🔵） |

### 三、验证证据（真跑）

| 命令 | 结果 |
|---|---|
| `node --test test/crash-reports.test.mjs test/tui-stderr-capture.test.mjs` | 14 例：12 过 / 0 败 / 2 skip（slow 归册）；`node test/run-fast.mjs` 同两档：slow-gate 零拦截（最长 7.2ms，<< 500ms 阈值——AC8） |
| `set "THINCODER_TEST_FULL=1" && node --test test/tui-stderr-capture.test.mjs test/crash-reports.test.mjs` | **14/14 绿 · 0 skip**（含 AC-1/2/3/6 真 spawn 慢例——AC6 真面；宿主带 `THINCODER_TUI_WRAPPED=1` 时仍 14/14——修 #1 后确定性） |
| `npm run test:full` | 575 例：**572 过 / 3 红 / 0 skip**——3 红全为他批在飞文档（见「五、外批红」） |
| `node --check` 四档 | 全绿 |

### 四、偏离审计 + 代码评审（轮次与终态）

- **内部偏离审计**（explore·只读·blocking）：**clean**——四类（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）零发现；逐条 AC 核验表见其报告；审计自标证据边界（无 shell 面——测试 pass/fail 采信本实施者实测基线，断言存在性与 AC 对应已核）。
- **内部 advisor 代码评审轮次 1**（完整评审）：**pass**——🔴 0 · 🟡 0 · 🔵 3（① 慢例 env 泄漏 → 假红；② T4 进程级 report 全局态未复原；③ T6 缺「无条件注入」负例）。
- **修正轮 1**：**3/3 全修**——① `test/tui-stderr-capture.test.mjs:84-86`（`THINCODER_TUI_WRAPPED: ""` + 注释）；② `test/crash-reports.test.mjs:13-20`（`prevReport` 捕获 + `after()` 复原）；③ `test/tui-stderr-capture.test.mjs:64-77`（env 关值负例 + try/finally 复原）。
- **内部 advisor 代码评审轮次 2**（修正复核）：**pass**——三项逐条确证已修、无新增问题；host 机械复核 4/4 引证命中当前盘面。
- **终态：`clean`**（0 🔴；修正轮落地并复跑验证）。

### 五、外批红（非本批面，如实登记）

`npm run test:full` 3 红：`doc-consistency` T41（V1 `2026-09-11-VSC-LIVE-UX（VSC 仓）` 失效引用 + V3 `docs/batches/2026-09-11-TUI-OOM-ROOTCAUSE.md` §3 缺轮次行）· `ledger` T67/T96（`docs/TODO.md:15/:17` 锚形态）。两校验器扫描域 = docs（`test/doc-consistency.test.mjs:26` SCAN_DIRS；ledger 扫 `docs/TODO.md`），本批零文档写入 → 与本批无因果；属他批在飞档，父侧收口面。

### 六、披露（超声明 / 未落项 / 规模）

1. **`test/files.mjs` 不存在**（任务书测试行 + §4 批准范围提及）：CLI 仓测试发现 = `test/*.test.mjs` glob（`test/run-fast.mjs:19` / `test/run-full.mjs:9`）→ **注册改动 = 0**（无需动作；POOL-LEDGER 批同款裁定先例）。
2. **仓外临时件**：诊断期在 `%TEMP%` 建过两个一次性脚本（`diag-wrapped-spawn.mjs` / `diag-wrapper-ret.mjs`），已删；仓内零残留。
3. **规模（现读·内容行）**：`src/crash-reports.mjs` 129→150（设计预告 +~16）· `src/tui/wrapped-spawn.mjs` 39→41 · 新档 `test/crash-reports.test.mjs` 82 行（预告 ~110）· `test/tui-stderr-capture.test.mjs` 79→106（预告 +~10；含修正轮 #1/#3 增量）。全部低于 300 行档位。
4. **零改守**：`bin/thincoder.mjs`（调用点零改）· `docs/*` 全部（他批/designer/父侧写域）· 堆上限（未引入 `--max-old-space-size`）。

## §6 验证与收口（父代理自写）

**2026-09-12 00:24 收口（父侧核验）**

- **读码核验**（父侧实读）：武装单点 `src/crash-reports.mjs:88-90`（独立 try、默认参 `armHeapSnapshot = v8.setHeapSnapshotNearHeapLimit`——`bin` 零改）· env 单点判定 `:67-69`（関值集 {0,false,off,no}）· purge 纳 `Heap..heapsnapshot` 且不入提示判定集（`:49-51` / `:46-47`）· TUI 定向 `src/tui/wrapped-spawn.mjs:30`（无条件注入、gate 单点在 crash-reports）；
- **真跑**：`node --test test/crash-reports.test.mjs test/tui-stderr-capture.test.mjs` → **14 例 / 12 过 / 0 败 / 2 skip**（slow 归册——`THINCODER_TEST_FULL=1` 下 14/14）；全套件（coder）575 例 572 过，**3 红均他批在飞文档面**（doc-consistency V1/V3 + ledger T67/T96），非本批因果；
- **AC 勾销**：AC1-AC8 全绿（§5 交付表逐条）；F3①-④ / N1-N4 全 Done；
- **偏差（估算内、如实记录）**：crash-reports.mjs +21（预告 +16）· 新测档 82 行（预告 ~110）· tui-stderr-capture +26（预告 +10——含修正轮增量）；
- **披露采纳**：`test/files.mjs` 不存在（CLI 测试发现 = glob——注册改动 0，POOL-LEDGER 先例）；T6 落既有 mock 族档（设计 §4 为准）；
- **遗留（文档面微项，随收口划扫）**：① 设计 §4:147 摘要行漏列 T7b（正文/AC 均在）；② 批次档 §2:94 交叉引用 stale（`design §8` → 姊妹批后为 §10）；
- **链终**：design 链令牌已消费（值不落档）——再动需新评审。
