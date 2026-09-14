# 崩溃捕获与取证（CRASH-REPORTS）— 设计 + 测试

> 板块：崩溃捕获与取证（CLI 崩溃诊断留痕）。设计+测试层（`docs/design/`）。需求见 `../requirements/CRASH-REPORTS.md`。
> 状态：**已落档——待设计评审**（2026-09-11；评审通过 + 用户批准后转现行）。批次：`../batches/2026-09-11-TUI-OOM-FORENSICS.md`。
> 来源事故：CLI TUI 会话 ~19.4 分钟后 V8 堆 OOM（`Ineffective mark-compacts near heap limit`，堆 ~8192MB——批次档 §1 事实表）。
> 本档实测依据：Node v24.19.0（本机），64MB 小堆合成负载，2026-09-11（矩阵见 §2.1）。

## 1. 问题与现状

### 1.1 捕获链现状（已核事实，as-of 2026-09-11）

| # | 事实 | 证据 |
|---|---|---|
| 1 | 入口最前 `prepareCrashReporting()`：预建 crash-reports 目录 + `process.report.directory` / `reportOnFatalError` 启用（V8 fatal 自动写报告） | `src/crash-reports.mjs:61-71` · 调用点 `bin/thincoder.mjs:43` |
| 2 | TUI 启动默认包装：父 spawn 子（自身 bin）tee 子 stderr → 终端实时 + `tui-stderr-<ts>-<pid>.log` | `src/tui/wrapped-spawn.mjs:14-37` · 包装门 `bin/thincoder.mjs:35-37` |
| 3 | **落点更正（实测）**：`report.*.json` 实测落 `~/.thincoder/crash-reports/`——`process.report.directory` 已被进程内设定，**非 CWD**（批次档 §1 事实表 #2 的文字记述与此不符，以本实测为准） | 实测：重定向 HOME 跑 `test/fixtures/r25-oom.mjs` → 报告落 crash-reports；`src/crash-reports.mjs:66` |
| 4 | 30 天写时自清理（purge）覆盖 crash-*.json / report.*.json / tui-stderr-*.log；「上次异常终止」提示判定集只含前两类 | `src/crash-reports.mjs:37-55` · `:110-128` |
| 5 | 缺口 = 对象级证据：Node 诊断报告只有堆分区统计，**无「谁在持 8GB」** | 报告格式；批次档 §1 事实 #3 |

> 行号口径（修正轮 #3）：本表行号 = as-of 2026-09-11 快照（AGENTS.md 约定——设计档以符号锚引用代码；行号仅存于 as-of 证据表并注明）。

### 1.2 本批目标

把近堆上限堆快照**固化进启动链**（默认开 / 可关 / TUI 主路径落点纳入既有取证目录 / 代价落档）——
下次任意用户 OOM 时现场自动带对象级证据（可回传），无需复现。本批只保证「崩了有证据」；
「为什么崩」（泄漏根因）归姊妹批 TUI-OOM-ROOTCAUSE。

## 2. 方案选型

### 2.1 注入点候选对比

武装方式 × 落点实测矩阵（Node v24.19.0；`--diagnostic-dir` = CLI Node 选项，须在脚本路径前）：

| 实测场景 | 武装方式 | 落点结果 |
|---|---|---|
| A / B | CLI argv 旗标 / `NODE_OPTIONS` 旗标 | 进程 CWD |
| C | `NODE_OPTIONS` 旗标 + `--diagnostic-dir` | 诊断目录（重定向成功） |
| D / E | 运行时 API `v8.setHeapSnapshotNearHeapLimit(1)` | CWD（另证：`process.report.directory` 对快照**无效**） |
| H | 运行时 API + `--diagnostic-dir` | 诊断目录（重定向成功） |

| # | 候选 | 覆盖路径 | 落点控制 | 进程代价 | 污染/耦合 | 结论 |
|---|---|---|---|---|---|---|
| 1 | `wrapped-spawn` 子 argv 注入旗标（批次档 §1 候选①） | 仅 TUI 包装路径（env 门直行 / 包装失败 / 非 TUI 命令不覆盖） | 可控（再 + `--diagnostic-dir`） | 零额外进程 | 低 | **部分采用**——只承担 TUI 落点定向（武装归候选 3） |
| 2 | `bin` 早期自 re-exec（批次档 §1 候选②） | 全路径 | 可控 | **+1 进程/命令**；与既有包装 env 门（`THINCODER_TUI_WRAPPED`）门序交错 | 中 | 否决（代价 + 复杂度；全覆盖已由候选 3 更低成本获得） |
| 3 | 入口 `prepareCrashReporting()` 内运行时 API | **全路径**（TUI 子进程 / chat / acp / 其余——同源入口：bin 入口 `prepareCrashReporting`） | 不可控（仅 CWD——`report.directory` 无效，实测 D/E——修正轮 #1） | 零额外进程、零参数管线 | 零 | **选定（武装机制）** |
| 4 | 包装父以 `NODE_OPTIONS` 注入子 env | TUI 子进程及其**全部后代** | 可控 | 零额外进程 | **高**——agent 的 bash 工具子进程继承 env（`src/tools/bash.mjs` `buildBashEnv` 全量透传）：用户项目里任何 node 进程都被武装 | 否决（污染面） |

**选定组合 = 候选 3（武装——全路径单点）+ 候选 1 的定向变体（`--diagnostic-dir`——TUI 主路径落点）**。
理由：单一机制无法同时做到「全路径武装」与「落点可控」——实测矩阵显示运行时 API 武装下
`report.directory` 无效、`--diagnostic-dir` 有效；而 CLI 旗标无法覆盖非包装路径。

### 2.2 落点决策

| # | 候选 | 覆盖 | 清理 | 取舍 | 结论 |
|---|---|---|---|---|---|
| 1 | 全路径 CWD（Node 默认） | 全部 | 无（手动） | GB 级文件落用户项目目录——git 工作区污染面、无自动清理 | 否决 |
| 2 | **TUI → crash-reports（`--diagnostic-dir`）+ 其余 → CWD** | 主路径定向；其余默认 | TUI 纳入 30 天清理 | 落点按路径分裂（如实登记为已知边界） | **选定** |
| 3 | 全路径 → crash-reports | —— | 需自 re-exec（候选 2——已否决） | —— | 否决（不可行，除 re-exec） |

理由：主路径（TUI = 实测崩溃路径）与既有取证物同址（report / 日志 / crash 记录均已在该目录——§1.1）
+ 纳入 30 天清理；非主路径保留 Node 默认——无运行时定向手段，不为单选路径引入双击进程。

### 2.3 堆上限候选（`--max-old-space-size`）

| # | 候选 | 取舍 | 结论 |
|---|---|---|---|
| 1 | 不改（默认上限） | 快照体积随崩溃时堆规模（GB 级）；但崩溃时机 = 真实内存增长节奏——取证不改变被测行为 | **选定**（与批次档 §1 倾向一致） |
| 2 | 固化较小上限（如 4096） | 快照更小、更早崩——但改变崩溃时机、掩盖泄漏节奏（OOM 何时发生本身就是待观察变量） | 否决 |

### 2.4 关键决策记录

- **D1 武装 = 运行时 API**（全路径单点——bin 入口 `prepareCrashReporting` 调用点；修正轮 #3）；不给非 TUI 路径做 re-exec。
- **D2 落点 = TUI（主路径）crash-reports 定向；其余 CWD**（§2.2 候选 2；分裂边界如实登记）。
- **D3 堆上限不改**（§2.3）。
- **D4 不做启动提示**（对批次档 §1 设计问题的答复）：写时 Node 原生 `Wrote snapshot to <路径>` 行
  （TUI 经 tee 上屏 + 落日志）+ 本档 §3.3 落点表 + 30 天清理 = 可发现性闭环；
  事件罕见而启动期每会话打印一次「快照将落在…」= 常态化噪音，否决。
- **D5 env 开关语义**：`THINCODER_HEAP_SNAPSHOT`——关值集合 {`0`, `false`, `off`, `no`}（trim + 大小写不敏感）；
  其余（含未设 / 空串 / 未知值）默认开（fail-open 向取证）。
- **D6 文档归宿**：本板块此前无现行权威档（R25 在架构档为「归宿待定」占位）——本批建档
  `requirements/CRASH-REPORTS.md` + `design/CRASH-REPORTS.md`；README 地图登记；架构档占位改指针。
- **D7 测试口径**：注入缝断言（无真快照）；手动 QA 面 = `node --max-old-space-size=64 test/fixtures/r25-oom.mjs`
  （重定向 HOME 跑 → crash-reports 出 report + CWD 出 Heap 快照——不进套件；命令含小堆前提——修正轮 #5）。

## 3. 机制契约

### 3.1 武装（注入点 / 时点 / 语义）

- 调用点：`src/crash-reports.mjs` 的 `prepareCrashReporting()`——由 bin 入口（`bin/thincoder.mjs`）最前调用（全部命令同源；TUI 子进程亦经此入口；修正轮 #3）。
- 调用：`v8.setHeapSnapshotNearHeapLimit(1)`——「堆接近上限时写快照、至多 1 份/进程」
  （Node 文档 `--heapsnapshot-near-heap-limit=max_count`：尽力写至少 1 份、至多 max_count 份；
  `v8.setHeapSnapshotNearHeapLimit`：CLI 旗标已设或重复调用时 no-op）。
- 独立 try/catch（尽力面——武装失败不阻断启动、不影响 F1 既有步骤）。
- 导入形态：命名空间 import（`import * as v8 from "node:v8"`——API 缺失降级为调用期异常并被吞，不做 import 期硬失败）。
- 接口（注入缝——默认参数保调用点零改）：`prepareCrashReporting({ dir = crashReportsDir(), env = process.env, armHeapSnapshot = <node:v8 实函数> } = {})`；
  测试注入替身（同款：`spawnTuiWrapped({ spawnImpl, exitImpl })`——`src/tui/wrapped-spawn.mjs`）。
- 返回值不变（目录路径）；`dir` 选项同时服务 mkdir / `report.directory` / purge / 返回（默认值 = 原行为）。

### 3.2 env 开关

- 名：`THINCODER_HEAP_SNAPSHOT`；判定单点 = crash-reports.mjs（包装器**不**判 env——防两处判定漂移）。
- 关值集合 {`0`, `false`, `off`, `no`}（trim + 小写）；其余 → 开（见需求 F3②）。
- wrapper 的 `--diagnostic-dir` 无条件注入（即使开关已关：该参数无快照时无副作用面——报告目录由 `process.report.directory` 决定，同值）。

### 3.3 落点与命名（取证物对照表）

| 取证物 | 触发 | 写入者 | 落点 | 命名 | 清理 |
|---|---|---|---|---|---|
| 堆快照 | 近堆上限 | Node（V8 回调） | TUI：`~/.thincoder/crash-reports/`；其余命令：进程 CWD | `Heap.<YYYYMMDD>.<HHMMSS>.<pid>.<thread>.<seq>.heapsnapshot`（实测形如 `Heap.20260911.234728.23300.0.001.heapsnapshot`） | TUI：30 天写时清理（本批纳入）；CWD：手动 |
| Node 诊断报告 | V8 fatal | Node | `~/.thincoder/crash-reports/` | `report.<YYYYMMDD>.<HHMMSS>.<pid>.<seq>.json` | 30 天 |
| JS 异常记录 | uncaughtException / unhandledRejection | `writeCrashRecord` | 同上 | `crash-<epochms>-<pid>.json` | 30 天 |
| TUI stderr 日志 | TUI 启动 | 包装父 tee | 同上 | `tui-stderr-<ts>-<pid>.log` | 30 天 |

写出时 stderr 行（逐字，v24.19.0 实测）：`Wrote snapshot to <路径>`——TUI 经 tee 双写（上屏 + tui-stderr 日志）。
快照份数 = 1（n = 1）；不做多份对比面。purge 模式扩展 = `/^Heap\..+\.heapsnapshot$/`（仅清理、不入提示判定集——N3）。

### 3.4 TUI 定向（`--diagnostic-dir`）

- `wrapped-spawn.mjs` 子 argv 首位注入 `--diagnostic-dir=<crashReportsDir()>`（Node 选项须在脚本路径前：
  [`--diagnostic-dir=…`, script, ...原始 argv]）。
- 目录由 `spawnTuiWrapped` 包装前置 mkdir（`src/tui/wrapped-spawn.mjs`）——写时目录必在（目录缺失 = 快照丢失面——预建覆盖；修正轮 #3）。
- 无条件注入（gate 单点在 §3.2）。

### 3.5 代价

| 项 | 事实 / 实测 | 说明 |
|---|---|---|
| 体积 | 实测 236MB @64MB 堆（edge 密集合成负载——比例 > 3×）；真实 8GB 级堆**外推未实测** | 体积随堆规模——GB 级至更大可能；「≈ 堆大小」仅为粗略量级 |
| 耗时 | 实测全流程 ~10s @64MB 堆（含 OOM 整体） | 生成期进程同步阻塞（近无响应）——随后照常 fatal |
| 额外内存 | Node 文档：生成快照需额外时间与内存（V8 堆内 + 堆外原生） | Node 语义：会调整堆以容纳开销、尽量避免耗尽进程内存 |
| 次数 | 1 份/进程（n = 1） | 不会多份堆积 |
| 常态开销 | 零（回调注册一次——未近上限不触发） | —— |
| 取舍 | 不设堆上限（§2.3）；体积 = 取证固有成本，接受 | 用户回传后可删；TUI 落点 30 天自动清理兜底 |

### 3.6 失败面（尽力面）

- 武装异常 → 吞（不阻断启动）。
- 快照写失败（磁盘满 / 权限 / 目录缺失）→ 快照不落；其余取证面（报告 / stderr / 记录）不受影响（机制独立）。
- 快照生成期进程无响应，随即仍 fatal abort；F2 的 tee 已收全部 stderr（含快照路径行）。

## 4. 受影响文件清单

| 文件 | as-of 行数 | 预计增量 | 说明 |
|---|---|---|---|
| `src/crash-reports.mjs` | 129 | +~16 | 武装调用（seam + gate + 独立 try）+ purge 模式扩展 + 头注释 |
| `src/tui/wrapped-spawn.mjs` | 41 | +~2 | 子 argv 首位 `--diagnostic-dir` + 注释（行数修正轮 #12 刷新） |
| `test/crash-reports.test.mjs` | 新 | ~110 | 注入缝用例 T1-T5、T7（快层——无真快照） |
| `test/tui-stderr-capture.test.mjs` | 106 | +~10 | T6（spawn 参数断言——既有 mock 族；行数修正轮 #12 刷新） |
| `docs/requirements/CRASH-REPORTS.md` | 新 | 本批 | 需求（F3 + N1-N4） |
| `docs/design/CRASH-REPORTS.md` | 新 | 本档 | 权威设计 + 测试 |
| `docs/README.md` | 240（批前） | **已落（建档时）**——现 243 | 地图登记（§4 / §4.1 / 变更记录）——实现批勿重复落（修正轮 #4） |
| `docs/design/ARCHITECTURE.md` | 84（批前） | **已落（建档时）**——现 85 | §4 模块行登记；§6 R25 占位移除（归宿落定）；变更记录——实现批勿重复落（修正轮 #4） |
| `bin/thincoder.mjs` | 406 | 0 | 零改（`prepareCrashReporting` 调用点已在位） |

> 并行批提示：姊妹批 TUI-OOM-ROOTCAUSE 亦涉及 `wrapped-spawn.mjs`（父包装恢复序列）——
> 实现调度按文件域排队（files 声明），先落者先并、后落者 rebase。
>
> 实现增量注（修正轮 #4）：`docs/*` 行均为**建档时已落**（本批设计者落）——实现批 files 声明只含 `src` / `test` 四档。

## 5. 验收标准

| AC | 回指 | 判据（机验） |
|---|---|---|
| AC1 | F3① 默认武装·全路径 | T1 / T3 / T5 绿；武装点在 `prepareCrashReporting()`（bin 入口单源——零改） |
| AC2 | F3② 可关矩阵 | T2 绿（关值不武装）· T3 绿（其余值武装） |
| AC3 | F3③ 落点与可见 | T6 绿（argv 首位 = `--diagnostic-dir=<dir>`）；本档 §3.3 落点表落档 |
| AC4 | F3④ 代价可知 | 本档 §3.5 表存在（体积 / 耗时 / 额外内存 / 次数 / 常态开销 / 取舍） |
| AC5 | N1 不阻断 | T4 绿（武装替身抛错——启动链照常） |
| AC6 | N2 零回归 | 既有崩溃链用例全绿（含 slow 真 spawn 面）；T6 断言既有 argv 序不破 |
| AC7 | N3 清理与判定集 | T7 / T7b 绿（旧 Heap 快照被清理；`recentCrashHint` 不因快照文件误报——T7b 仅快照无记录 → `null`；修正轮 #2） |
| AC8 | N4 测试口径 | 新用例全部快层 < 500ms；T5（API 存在性）绿；无真快照用例（负断言） |

## 6. 用例表

| # | 层 | 场景 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|---|
| T1 | 快层 unit | 默认武装 | `prepareCrashReporting({ armHeapSnapshot: spy, dir: tmp, env: {} })` | spy 调用恰 1 次、参数 1；返回 dir；目录已建 | AC1 |
| T2 | 快层 unit | 关值矩阵 | `THINCODER_HEAP_SNAPSHOT` ∈ {`0`, `false`, `off`, `no`}（含空格 / 大小写变体） | spy 零调用 | AC2 |
| T3 | 快层 unit | 默认开 | 值 ∈ {未设, 空串, `1`, `true`, `yes`, 未知串} | spy 以 1 调用 | AC2 |
| T4 | 快层 unit | 武装失败不阻断 | 替身抛错 | 不抛；返回 dir；`process.report` 设置照常 | AC5 |
| T5 | 快层 unit | API 存在性守护 | `typeof (await import("node:v8")).setHeapSnapshotNearHeapLimit` | `"function"`（Node ≥ 24 基线） | AC1 / AC8 |
| T6 | 快层 unit | TUI 参数注入 | `spawnTuiWrapped({ spawnImpl: (cmd, args) => …, dir })`（既有 mock 族） | `args[0] === "--diagnostic-dir=<dir>"`；`args[1]` = bin 脚本；其余参数序不变 | AC3 / AC6 |
| T7 | 快层 unit | 清理与判定集（正例） | crash-reports 临时目录：旧 mtime 的 `Heap.*.heapsnapshot` + 新 crash 记录 | `recentCrashHint({ dir })` 后旧快照被删（purge 含 Heap 模式）；返回提示（新记录在场） | AC7 |
| T7b | 快层 unit | 清理与判定集（负例——修正轮 #2） | crash-reports 临时目录：仅新 mtime 的 `Heap.*.heapsnapshot`（无 crash / report 记录） | `recentCrashHint({ dir })` 返回 `null`（快照不入提示判定集——不误报） | AC7 |
| T8 | 手动 QA（**不进套件**） | 真快照 | `node --max-old-space-size=64 test/fixtures/r25-oom.mjs`（重定向 HOME——修正轮 #5） | 期望：crash-reports 出 `report.*.json` + CWD 出 `Heap.*.heapsnapshot`（实测代价 236MB / ≈10s ——污染且拖慢，故不跑） | AC8 |

## 7. 边界（不做）

- 泄漏根因修复 / 堆遥测看门狗（姊妹批 TUI-OOM-ROOTCAUSE——本批只保证「崩了有证据」）。
- 堆上限调整（§2.3）；启动提示（D4）；非 TUI 落点改向（§2.2 候选 3——需 re-exec，否决）。
- 快照对比面（n > 1）；VSC 端；快照压缩 / 自动上传 / 自动删除 CWD 快照。

---

## 8. 堆遥测/看门狗（TUI-OOM-ROOTCAUSE 批——2026-09-11）

> 需求：`../requirements/CRASH-REPORTS.md` F4 + N5/N6。来源：批次档
> `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md` §1（防线实测：「全进程无堆遥测」——`process.memoryUsage()`
> 全仓唯一出现点 = 崩溃写档 `crash-reports.mjs:91`）。

### 8.1 问题陈述

事故会话堆爬升 ~19 分钟无任何事前信号（「炸了才知道」）；进程内周期堆采样缺位。本项补上
「事前预警」：接近堆上限时主动提示（stderr + TUI 行 + 事件日志），为长会话用户/同事留出
保存与取证窗口。**只看不治**（不强制 GC、不阻断、不触发快照——快照近上限面归 F3 既有机制）。

### 8.2 方案选型对比

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **阈值 = 堆上限比例**（`heapUsed / v8.getHeapStatistics().heap_size_limit`） | 可移植（上限随 `--max-old-space-size`/Node 版本变化）；无绝对 MB 常量 | **选定** |
| 2 | 固定 MB 阈值 | 机型/上限相关——不可移植 | 否决 |
| 3 | RSS 口径 | RSS ≠ V8 堆（OOM 判据是堆）——误报面大 | 否决 |

| # | 候选（触发形态） | 评估 | 结论 |
|---|---|---|---|
| 1 | **双档边缘触发**（70% / 85%——每档一次） | 早期提示 + 危急提示；不重复刷屏 | **选定** |
| 2 | 单档 | 缺少升级梯度 | 否决 |
| 3 | 周期重复报告 | 噪音（TUI 行污染） | 否决 |

| # | 候选（告警面） | 评估 | 结论 |
|---|---|---|---|
| 1 | **stderr 行 + TUI 行（订阅制）+ 事件日志** | 全命令可见（headless = stderr）；TUI 走既有 pushLine（安全）；事件日志可检索 | **选定** |
| 2 | 仅 stderr | TUI alt-buffer 下易被帧覆盖（写入即被重绘刷新） | 部分否决（保留为 headless 主面） |
| 3 | 系统通知/响铃 | 越界（平台相关、侵入） | 否决 |

### 8.3 契约（实现对象）

- 模块：`src/heap-watch.mjs`（零依赖）——`startHeapWatch({ intervalMs = 60_000, ratios = [0.7, 0.85],
  sample = process.memoryUsage, heapLimit = () => v8.getHeapStatistics().heap_size_limit,
  env = process.env, timer = setInterval } = {})` → `{ stop(), checkNow() }`；`onHeapWarn(cb)` 订阅
  （返回退订函数）。
- 武装点：`bin/thincoder.mjs` 入口 `prepareCrashReporting()` 之后单点（全命令同源；定时器
  `unref()`——一次性命令自然退出、零阻塞）。
- 开关（单点）：`THINCODER_HEAP_WATCH`——关值集合 {`0`, `false`, `off`, `no`}（trim + 大小写不敏感）
  → 不启动；未设/空串/其他值 → 启动（默认开；与 F3② 同约定——§3.2 单点口径复用）。
- 预警行（逐字——进测试断言）：
  `[heap] warning: heapUsed <U> GB / <L> GB heap limit (<P>%) — long session; consider /new to reset context`
  （U/L 一位小数，P 取整；档 85% 时前缀同、数值不同）。每档一次/进程（`_warnedLevels` 集合）。
- 订阅接线：TUI `startTUI` 内注册 → `pushLine(line, C.warn)` + `render()`（不新增 TUI 定时器——
  采样定时器住本模块）。
- 注入缝：`sample` / `heapLimit` / `timer`（测试以假实现 + `checkNow()` 直驱——零等待）；
  失败面全吞（采样抛错不阻断）。
- TUI 活动时 stderr 面（修正轮 #11）：**不抑制——明示接受噪声**——TUI 下该行经 F2 tee 双写（终端
  上屏 + tui-stderr 日志）；上屏行可被帧重绘刷新（§8.2 表 2 候选 2 同因果）——可靠面 = TUI 行 +
  事件日志，stderr = headless 主面与日志兜底。

### 8.4 关键决策记录（含否决备选）

- **D-HW1 比例阈值双档 70/85**（§8.2 表 1/2）；**D-HW2 只看不治**（不强制 GC/不自动快照——
  F3 已有近上限快照）；**D-HW3 默认开 + env 可关**（与 F3 同约定）；**D-HW4 事件日志复用
  `thincoder-core/log.mjs` 事件骨架**（字段：`kind:"heap-warn"`, used/limit/ratio）；**D-HW5 零常态开销**：
  60s 一次 `memoryUsage()`（微秒级）+ 无输出。

### 8.5 受影响文件

| 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|
| `src/heap-watch.mjs` | 新 | +110 ± 20 | 采样/阈值/订阅/开关 |
| `bin/thincoder.mjs` | 406 | +4 | 武装点单行 + 注释 |
| `src/tui/index.mjs` | 455 | +5 | 订阅接线（pushLine + render） |
| `test/heap-watch.test.mjs` | 新 | +110 ± 20 | T-HW1–T-HW5 |

### 8.6 用例表

| # | 层 | 场景 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|---|
| T-HW1 | 快层 unit | 默认启动 | `startHeapWatch({ timer: spy, env: {} })` | timer 注册恰一次；`unref()` 被调 | F4① |
| T-HW2 | 快层 unit | 关值矩阵 | `THINCODER_HEAP_WATCH` ∈ {`0`,`false`,`off`,`no`}（含大小写/空格变体） | 不注册 | F4② |
| T-HW3 | 快层 unit | 边缘触发 | `sample` 注入 50%→72%→76%→87% | 恰两行（70%、85%）；再采样不重复 | F4③ |
| T-HW4 | 快层 unit | 逐字与订阅 | 订阅者注入 | 行文本逐字（正则锚）；订阅回调收到同一行 | F4③ |
| T-HW5 | 快层 unit | 失败面 | `sample` 抛错 | 不抛、无输出、timer 存续 | N5 |

### 8.7 验收标准

| AC | 回指 | 判据 |
|---|---|---|
| AC-HW1 | F4①/② | T-HW1/T-HW2 绿；grep：开关判定单点（heap-watch.mjs） |
| AC-HW2 | F4③ | T-HW3/T-HW4 绿（逐字锚 + 双档恰一次） |
| AC-HW3 | F4④/N5 | T-HW5 绿；无绝对 MB 常量（grep）；`check-doc-width` 新增违规 0 |

### 8.8 边界（本批不做）

- 不做强制 GC / 自动 /new / 自动快照（只看不治）；不做内存分区细分（rss/external——越界）；
  不做 VSC 端；不改 F3 快照面。

---

## 9. 异常退出的终端恢复（TUI-OOM-ROOTCAUSE 批——2026-09-11）

> 需求：`../requirements/CRASH-REPORTS.md` F5 + N6。来源：批次档 §1 次生症状（进程 abort →
> `mouseOff` 未下发 → 终端持续上报鼠标 → 滚动飞数字串——机制已确证）。

### 9.1 问题陈述

- 正常/JS 异常退出：TUI 自身清理（`tui-lifecycle.mjs:58-87`——`mouseOff` 单写 + 余部）与
  R25 JS 崩溃恢复（`restoreTerminalAfterCrash`）覆盖——**JS 钩子可拦的面**。
- V8 fatal（OOM/abort）：**不走 JS 钩子** → 子进程猝死，终端保持 mouse 上报态（滚动飞数字串）。
  唯一存活方 = 包装父进程（`wrapped-spawn.mjs`）——现仅在子死后同码退出（`:34-35`），零序列动作。

### 9.2 方案选型对比

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **父包装在子异常退出时补发恢复序列**（单源导出——与 JS 崩溃恢复同序） | 唯一能覆盖 V8 fatal 的位置；序列幂等（子已清理时重发无害） | **选定** |
| 2 | 子进程信号钩子 | V8 fatal 不走 JS——不可行 | 否决 |
| 3 | shell 层恢复（用户手动 `reset`） | 现状即此——未满足需求 | 否决 |

| # | 候选（序列内容） | 评估 | 结论 |
|---|---|---|---|
| 1 | **复用清理序列常量**（`clearScreen + mouseOff + bracketedPasteOff + keyboardPop + modifyOtherKeysOff + mainBuffer + showCursor + reset + wrapOn`——`writeCleanupSequence` 同源提取） | 单一序列来源；与 JS 崩溃路径行为一致；幂等 | **选定** |
| 2 | 最小子集（仅 mouseOff + mainBuffer） | 终端键盘/粘贴模式可能残留 | 否决 |
| 3 | 父侧另造字面量 | 第三份序列副本——漂移面（QUICKFIX-BATCH-3 F-3 同题在案） | 否决 |

### 9.3 契约（实现对象）

- `tui-lifecycle.mjs`：提取导出 `RECOVERY_SEQUENCE`（逐字 = 上述序列）；`writeCleanupSequence`
  改为引用同常量（行为逐字不变——既有字节锁测试保持）。
- `wrapped-spawn.mjs`：新增注入缝 `writeImpl = (s) => process.stdout.write(s)`；**守卫落点 = `exit`/
  `close` 事件处置内、`finish(...)` 之前**（按 `exitCode`/`exitSignal` 判定——`code !== 0 ||
  signal != null`）`try { writeImpl(RECOVERY_SEQUENCE) } catch {}`——**每进程恰一次**（`recovered`
  守卫，exit/close 双路 + 30s 兜底路径同守）。**不在共享 `finish(code)` 内判定**（修正轮 #3——
  spawn error 路径现经 `child.on("error") → finish(1)`（`wrapped-spawn.mjs:38`），字面挂共享 finish
  会在子未启动时补发 clearScreen 序列——违 F5③）。
- spawn error（子未启动——`error` 事件路径）/ 正常退出（code 0）→ 零动作（子自身清理为准；F5③）。
- 协同：姊妹批 TUI-OOM-FORENSICS 同文件（`--diagnostic-dir` 注入）——实现按文件域排队；
  先落者先并、后落者 rebase（FORENSICS 设计 §4 并行批提示同款）。

### 9.4 关键决策记录

- **D-RT1 父包装补发**（唯一存活方）；**D-RT2 序列单一来源**（常量提取——否决第三份副本）；
  **D-RT3 仅异常退出触发**（正常退出零干预）；**D-RT4 stdout + 注入缝**（与 TUI 输出面同流；
  mock 族可测）。

### 9.5 受影响文件

| 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|
| `src/tui/tui-lifecycle.mjs` | 88 | +8 | `RECOVERY_SEQUENCE` 提取导出（writeCleanupSequence 引用） |
| `src/tui/wrapped-spawn.mjs` | 41 | +14 | 异常退出补发 + `writeImpl` 缝 + 注释（行数修正轮 #12 刷新） |
| `test/tui-stderr-capture.test.mjs` | 106 | +50 | T-RT1–T-RT4（既有 mock 族扩展；行数修正轮 #12 刷新） |

### 9.6 用例表

| # | 层 | 场景 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|---|
| T-RT1 | 快层 unit | 异常退出补发 | mock spawn → child exit(1) | `writeImpl` 收到含 `\x1b[?1000l\x1b[?1006l` 与 `\x1b[?1049l` 的串；且在 `exitImpl` 之前 | F5① |
| T-RT2 | 快层 unit | 正常退出零干预 | child exit(0) | `writeImpl` 零调用 | F5② |
| T-RT3 | 快层 unit | 恰一次 | exit 与 30s 兜底双路触发 | 序列仍恰一次 | F5① |
| T-RT4 | 快层 unit | spawn error 零动作 | mock spawnImpl 触发 `error` 事件（不发 exit/close） | `writeImpl` 零调用（负断言）；`exitImpl(1)` 照常（不挂死——既有语义） | F5③（修正轮 #3） |

### 9.7 验收标准

| AC | 判据 |
|---|---|
| AC-RT1 | T-RT1/T-RT3 绿（序列子串锚 + 顺序 + 恰一次） |
| AC-RT2 | T-RT2 绿（负断言） |
| AC-RT3 | `writeCleanupSequence` 字节锁既有测试零伤（常量提取零语义） |
| AC-RT4 | T-RT4 绿（负断言——spawn error 零序列）；回指 F5③（修正轮 #3） |

### 9.8 边界（本批不做）

- 不做全屏重绘/字体重置等额外恢复；不做非 TUI 路径（包装仅 TUI）；不做 Windows 控制台特化
  （序列为 ANSI——终端已支持 mouse 上报即支持本序列）。

---

## 10. 变更记录

- 2026-09-11（TUI-OOM-ROOTCAUSE 批）：新增 §8（堆遥测/看门狗——比例双档 / 默认开 + env 关 /
  注入缝 / 用例 T-HW1–T-HW5）与 §9（异常退出终端恢复——包装父补发 `RECOVERY_SEQUENCE` /
  用例 T-RT1–T-RT3）；需求 = `../requirements/CRASH-REPORTS.md` F4/F5 + N5/N6；批次档
  `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md`。**同文件协同**：`wrapped-spawn.mjs` 与姊妹批
  TUI-OOM-FORENSICS 共触（§9.3 排队提示）。
- 2026-09-11（TUI-OOM-ROOTCAUSE 批·设计评审轮次 1 修正轮——本档 #3/#11/#12）：§9.3 守卫落点明确
  （exit/close 处置内按 exitCode/exitSignal 判定——spawn error 路径零动作；修「字面挂 finish(code)」
  自相矛盾；#3）· 新增 T-RT4 + AC-RT4（回指 F5③）· §8.3 补 TUI 活动时 stderr 面接受噪声句（#11）·
  行数实测刷新（wrapped-spawn 41 · tui-stderr 106——§4/§9.5；#12）。
- 2026-09-11（TUI-OOM-FORENSICS 批）：建档 + F3 机制落档——运行时 API 武装（全路径单点）/
  TUI `--diagnostic-dir` 定向（主路径入 crash-reports）/ env 开关（关值集合四值）/ 30 天清理纳入
  （purge 模式扩展、不误报判定集）/ 代价表 / 不改堆上限。依据：批次档 §1 + 本档 §2.1 实测矩阵（Node v24.19.0）。
- 2026-09-11（评审轮次 1 修正轮——5 条全落）：§2.1 删悬空「I」引用（修正轮 #1）· T7b 负例子场景 + AC7 回指（修正轮 #2）·
  契约/决策节符号锚化、行号仅存 as-of 证据表（修正轮 #3）· 受影响表 README/ARCHITECTURE 标「已落（建档时）」（修正轮 #4）·
  T8/D7 命令写全小堆前提（修正轮 #5）。需求档零改。
