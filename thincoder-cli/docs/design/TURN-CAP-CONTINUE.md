# 撞轮数墙可继续（TURN-CAP-CONTINUE）

> 板块：Agent 循环（`TURN-CAP-CONTINUE.md`——撞墙可继续专题，与 AGENT-LOOP 同板块独立保留，见 README 地图）。
> 状态：**机制已实现并在现行代码生效**——主/子/飞刀/会诊四类 agent 撞轮数墙都能"继续"，且不限次数。与 VS Code 插件端同源（两端语义一致）。
> 权威源：`thincoder-core/agent/spawn-child.mjs`（`runWithContinue` 骨架）、`src/agent-tools/subagent.mjs` / `subagent-actions.mjs` / `escalate-async.mjs` / `consult.mjs`、`src/tui/agent-turn.mjs`（主 agent 面板）、`thincoder-core/agent.mjs`（`ContinueError` / runAgent 循环）。


> 需求层（2026-09-10 拆分批）：本板块需求见 `../requirements/TURN-CAP-CONTINUE.md`——本档保留设计与测试细节。

## 统一语义

- **撞墙** = runAgent 耗尽 maxTurns 抛 `ContinueError`（携带轮数）；
- **继续** = `resume:true` 重跑同一个执行体：不重新注入任务文本、保留 history 与改动记录、每次全新轮数预算；
- **拒绝 / headless** → 部分成果返回；用户 Stop 始终优先；继续提示按会话级队列串行；
- **编号口径**（第 19 批——2026-09-11）：逐轮编号（`turn n/max`）在续跑链内**跨段累计**（不重置、不倒退）——见「跨段累计编号」。

## 各执行体

| 执行体 | 轮数预算 | 继续通道 | 次数 |
|---|---|---|---|
| 主 agent | `maxTurns`（默认 200） | TUI 权限面板（"❯ Continue"） | 不限（既有，不动） |
| 子 agent | `subagentTurns`（默认 100） | 权限请求 `onPermissionRequest("continue", …)` | 不限 |
| 飞刀 escalate | `subagentTurns`（默认 100） | 同上（escalate 无 permQueue，直问用户） | 不限 |
| 会诊 consult | `consultTurns`（默认 40） | 同上；继续时**墙钟 watchdog 重置** | 不限 |

## 实现要点

撞墙可继续统一收敛到 `runWithContinue(runner, child, input, callbacks, runOpts, hooks)`——一个 `ContinueError → 询问 → resume:true 重跑`的循环骨架，差异点（如何问、拒绝怎么降级）经参数注入：

- **子 agent / 飞刀 / 会诊**：`runWithContinue` 包住子执行——捕获 `ContinueError` → `askContinue(e)` → 真则 `{...runOpts, resume:true}` 续跑（同一 child 对象，history 天然保留）；假则走 `onDeclined(e, output)` 返回部分成果（`TURN_CAP_MARK = "stopped: turn cap reached"` 标记部分态，TUI/status/记账据它归类）。
- **会诊 consult**：续跑经 `session.continueQueue`（session 级队列）串行——并行 consultant 的继续提示不互相抢；继续时 `clearTimeout(watchdog)` + 复位 `timedOut` 并重挂 watchdog（继续 = 新预算 = 时钟重起）。
- **主 agent**（`agent-turn.mjs`）：`ContinueError` → TUI 权限面板弹 "❯ Continue"（复用权限机制）——AUTO 档自动 resume，手动档用户点继续；每次重新建 controller 续跑。原已无限次，不动。
- escalate 与子代理共用 `ctx._subagentKey`（role `escalate` / `subagent`）——继续/完成的 TUI 冻结与记账语义一致。

## 跨段累计编号（2026-09-11——第 19 批）

> 需求：`../requirements/TURN-CAP-CONTINUE.md` F7（§2）+ N5/N6（§3）。来源批次：`../batches/2026-09-11-TURN-ACROSS-SEGMENTS.md` §1。
> 状态：**设计就绪待评审**（第 19 批）——实施者 = eng-coder（设计 token 门）。VSC 侧同源异实现 = VSC 仓 `docs/design/TURN-CAP-CONTINUE` §跨段累计编号。

### 19.1 问题陈述（现场复核——as-of 2026-09-11）

续跑以 `resume:true` 重跑同一执行体（见「统一语义」）——段内循环变量 `turn` 从 0 重起，面向消费面的编号载荷随之重置：
`⟦ev⟧turn`（`thincoder-core/agent.mjs:186`——`turn + 1` / `maxTurns` 皆段内值）、状态行字段 `agent._currentTurn` / `agent._maxTurns`（`thincoder-core/agent.mjs:180-181`）、approval 事件载荷（`thincoder-core/agent/dispatch.mjs:287` 读同一对字段）。

消费面复核（批次 §1 待核项「渲染层是否已假设从 1 起」）：**无此假设**——`src/tui/subagent-panel.mjs:84` / `src/tui/render-segments.mjs:87` 逐字渲染载荷值；`src/tui/subagent-blocks.mjs:133-139` 从事件 token 原样解析；`TUI.md:399-400` 只定头形态。
→ 重置是**生成侧**缺陷：修在生成侧，全链消费点零改动。

### 19.2 方案选型对比（判据 = 用户可见语义正确 · 既有锁不破 · 改动范围）

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | **跨段累计**（唯一单调序列——`turn n/max`：n = 链内累计已跑轮数；max = 累计已授予预算） | 语义正确：n 单调不减、恒 ≤ max；改动范围：只改生成侧赋值点，协议格式与四类消费点零改动；锁：既有测试无编号发值断言（全量分类 = 19.2 注①） | 选定代价：max 随续跑增长（100→200→300——「累计已授予」真实口径）；两仓各一份同源实现 | **选定** |
| 2 | 分段显式（段号 + 段内号：`turn 30/100 · seg 2`） | 语义更细（分辨「新预算开始」），但需**新增协议字段** + 两端显示层改（CLI 块解析 / 面板 + VSC webview 头与桥消息）——与「改动范围」判据相抵；VSC 面触桥（登记行明示不擅建） | — | 否决（协议 / 显示面扩张） |
| 3 | 仅 CLI 改、VSC 不动 | 违反双端语义同源——同一时刻两端口径分叉（用户跨端看到两套编号） | — | 否决 |

**注①（测试面全量分类——2026-09-11 复核）**：`⟦ev⟧turn` 全仓 `test/` 仅 1 命中 = `test/subagent-tail-merge.test.mjs:285`（注入式——routeSubToken 直喂，:288 断言内层不路由）。
其余 `turn`/`maxTurns` 命中全为 fixture 显式值（`subagent-observe-send.test.mjs:23/65-66/105`、`queued-stop.test.mjs:36/49`、`input-lock.test.mjs:191`、`tui-exit-cleanup.test.mjs:28`）或 config 键面（`settings.test.mjs`）——无真实 runAgent 发射编号断言。

### 19.3 契约（状态 / 编号帧 / 发送点 / 数据流）

**唯一新增状态**：`agent._turnSeq`（链内累计序数——agent 级）。

- 复位 = `thincoder-core/agent.mjs` 既有 per-run 复位块内（`if (!resume)`——:126-145）`agent._turnSeq = 0`（与 mutation/guard 复位同条件同点）；
- 递增 = 段内每进入一轮 +1（续跑不重置、不回退）。

**编号帧**（单一计算点——纯函数；落 `thincoder-core/agent/helpers.mjs`）：
`turnFrame(seq, turn, maxTurns) → { turn, maxTurns }`——`turn = seq`；`maxTurns = seq - turn - 1 + maxTurns`
（差额项 = 本段开始前的链内累计 → max = 段前累计 + 本段预算）。段内帽判定不读它。

**发送与赋值点**（每轮——单一权威值与两类事件同源）：

| 面 | 现状 | 改后 |
|---|---|---|
| 状态行字段 | `agent._currentTurn = turn + 1`；`agent._maxTurns = maxTurns`（:180-181） | 两字段 = 编号帧（同点赋值——编号唯一权威） |
| `⟦ev⟧turn` | `⟦ev⟧turn\x1e${turn + 1}\x1e${maxTurns}\x1ellm\x1e`（:186） | `⟦ev⟧turn\x1e${agent._currentTurn}\x1e${agent._maxTurns}\x1ellm\x1e`——**格式 / 字段数 / phase 零变化**（phase 实际取值 = `llm`；解析点只取前两参——相位段不参与判定） |
| `⟦ev⟧approval` | 读 `agent._currentTurn` / `_maxTurns`（`src/agent/dispatch.mjs:287`） | **零改动**（同源字段——turn / approval 两类事件天然同帧） |
| 段内帽判定 | `for (let turn = 0; turn < maxTurns; turn++)`（:178）+ `throw new ContinueError(maxTurns)`（:390） | **零改动**（控制流只读段内 `turn` / `maxTurns`） |

**数据流（CLI——消费点全链零改动）**：子 runAgent 发编号帧 →
① `⟦ev⟧turn` →（镜像层 `src/agent-tools/subagent-run.mjs:110-117` / `thincoder-core/agent-tools/escalate-async.mjs:203-205` 原样正则解析）→ `entry.turn` / `maxTurns` → status / observe 面；
② TUI 路由（`src/tui/subagent-blocks.mjs`）→ 活动块头 `turn n/max`；
③ 终态快照 `onSubagent({turn, maxTurns})`（`subagent-run.mjs:137`）→ 冻结头；
④ 状态行 `render-frame.mjs:355`（主会话）。

### 19.4 关键决策记录（含否决备选）

- **D-19a（选定）生成侧单点**：消费侧各自加基要动四类消费点（镜像 / 块解析 / 终态快照 / VSC 面）且公式各写一遍——否决。
- **D-19b（选定）编号帧复用 `_currentTurn` / `_maxTurns`**：approval 事件读同一对字段——若只改 turn 事件而状态行字段仍段内，同链内两类事件交替驱动块头 → 显示值来回跳（101 → 3 → …）。否决「只改 turn 事件载荷」。
- **D-19c（选定）depth 无关**：同一缺陷结构在主会话续跑（Ctrl+I / AUTO 续跑——`src/tui/agent-turn.mjs:133` 循环）同存；只修 depth>0 = 留同构错误（铁律 2）；approval 事件亦无 depth 区分。**代价如实披露：主会话状态行编号同样累计**（同源结果——见 19.8 可观测面）。
- **D-19d（选定）继续提示文案不动**：`Ran ${error.turn} turns (limit …)`（`src/tui/agent-turn.mjs:185`）描述**本段**撞墙事件（ContinueError 载荷 = 段预算），非任务累计进度——改文案 = 动锁定串 / 提示面，超出本批（遗留项见 19.8）。
- **D-19e（选定，N6）段内帽预算语义零改动**：累计只作用于编号值；续跑次数 / 段预算 / ContinueError 载荷原样。
- 否决备选另见 19.2 #2（分段显式）与 19.8（VSC live 逐轮跳动）。

### 19.5 受影响文件全清单（行数口径 = `wc -l`；as-of 2026-09-11）

| 文件 | 改动 | 行数（现 → 预计） |
|---|---|---|
| `thincoder-core/agent.mjs` | ① `if (!resume)` 块加 `_turnSeq = 0` ② 循环内编号帧赋值 + turn 事件改发帧值 | 400 → ~406 |
| `thincoder-core/agent/helpers.mjs` | 新增 `turnFrame`（纯函数 + 注释） | 372 → ~382 |
| `test/turn-across-segments.test.mjs` | 新档——用例 T1-T7 在役（T8 已退场——整删，删除记录 = `TESTING.md` §11.3） | 新（~90） |
| `docs/design/TURN-CAP-CONTINUE.md` | 本节（19.1-19.8） | 全档 45 → 173 行（`wc -l`；本批增补前 → 现档） |
| `docs/requirements/TURN-CAP-CONTINUE.md` | F7 / N5 / N6 + §4 边界追加 | 全档 35 → 44 行（`wc -l` 实测） |
| （父侧排程）`docs/TODO.md` · checklist | 核销 / 登记 | — |

### 19.6 用例表（正常 / 边界 / 错误）

| # | 类型 | 场景 / 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| T1 | 正常 | `turnFrame(1, 0, 100)`——段 1 首轮 | `{turn: 1, maxTurns: 100}` | F7 |
| T2 | 正常 | `turnFrame(100, 99, 100)`——段 1 末轮（该轮累计序数 = 100） | `{turn: 100, maxTurns: 100}` | F7 |
| T3 | 边界 | `turnFrame(101, 0, 100)`——续跑段首轮（缺陷点；累计序数 = 101） | `{turn: 101, maxTurns: 200}`——**不回到 1** | F7 |
| T4 | 边界 | `turnFrame(238, 37, 100)`——第 3 段中段（段前累计 200 + 段内 37 + 1） | `{turn: 238, maxTurns: 300}` | F7 |
| T5 | 边界（不变式） | 扫描（限可达域：段内 `turn ∈ [0, max)`、`seq ≥ turn + 1`）seq∈{1, 100, 101, 250} × max∈{40, 100} | 恒 `turn ≥ 1`、`turn ≤ maxTurns`、`maxTurns = (seq - turn - 1) + max` | F7 / N5 |
| T6 | 正常（显示面零改动） | 注入 token `explore#9/⟦ev⟧turn\x1e101\x1e200\x1ellm\x1e`（相位 `llm` = 实际发射字面 `thincoder-core/agent.mjs:186`；`test/subagent-tail-merge.test.mjs:285` 载同形态——相位段不被解析消费） | 块 `turn = 101 / maxTurns = 200`；面板头含 `turn 101/200` | F7（消费点零改动机械证明） |
| T7 | 正常（同源） | approval 载荷 `⟦ev⟧approval\x1e101\x1e200\x1e…`（与 turn 帧同值） | 块 turn / maxTurns 与 turn 事件同帧（不回落段内值） | D-19b |
| T8 | 错误 / 回归 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | N6 |

用例面声明：CLI 测试为接缝式（无 runAgent 直驱在案）——T1-T5 打纯函数缝、T6-T7 打 TUI 解析 / routing 缝；T8（源码锚 + 全量回归缝）已退场——整删，删除记录 = `TESTING.md` §11.3（`node test/run-fast.mjs` / `run-full.mjs`）。

### 19.7 验收标准（逐条回指——每条可机器验证）

| AC | 判据（机器可验证） | 回指 |
|---|---|---|
| AC1 | T1-T5 绿：段 2 首轮编号 = 段 1 累计 + 1（不重置、不倒退、恒 ≤ max） | 批次 §1 缺陷表两行 + F7 |
| AC2 | `thincoder-core/agent.mjs` 发射行取 `agent._currentTurn` / `_maxTurns`（源码锚——fail-when-unchanged）+ `⟦ev⟧turn\x1e` 字段形态（4 段 + phase）驻留 | 批次 §1 问 3 + N5 |
| AC3 | `_turnSeq = 0` 位于 `if (!resume)` 块内（源码锚）；全档无第二复位点（grep 计数 = 1） | 批次 §1 问 2 + N6 |
| AC4 | `dispatch.mjs:287` approval 行零改动且读同对字段（源码锚）——T7 同帧 | 批次 §1 问 3 |
| AC5 | 显示面三文件（`subagent-panel.mjs` / `render-segments.mjs` / `subagent-blocks.mjs`）diff 零行 + T6 绿 | 批次 §1 已核事实（渲染层假设复核 = 无假设） |
| AC6 | 段内帽机制零改动：T8 已退场（整删——删除记录 = `TESTING.md` §11.3）；CLI 全量回归绿 | 批次 §1 范围边界（不改回合帽 / 续跑机制） |
| AC7 | 双端同源：VSC 侧 AC1' / AC2' 同算式同口径（VSC 仓 `docs/design/TURN-CAP-CONTINUE` §AC 表）——两档各自驻留、互不镜像 | 批次 §1 问 2 + 问 6 |
| AC8 | 三方条目一致：本表条目 = 需求 F7/N5/N6 = 批次档 §2 条目（同清单，逐字可对） | 批次 §1 问 4 |
| AC9 | 相邻登记关系落档：19.8 关系句在位（可 grep）——登记行本体同步 = 父侧排程（他批在途） | 批次 §1 问 5 |

### 19.8 边界（本项——不做）、可观测面与相邻登记

**可观测面（改前 → 改后）**：

| 面 | 改前（续跑后） | 改后 |
|---|---|---|
| CLI 活动块 live 头（`turn n/max`） | 重置回 1/100 再爬 | 101/200 续爬（单调） |
| CLI `subagent status` / `observe` | 段内值 | 累计值 |
| CLI 主会话状态行 | 重置回 1/max | 累计（D-19c 同源结果） |
| VSC 冻结头 / status | 段内终值（如 30/100） | 累计终值（130/200——VSC 仓同源设计） |

**明确不做**：

- 不做分段显式显示（选型 #2——协议字段与显示面扩张）；
- 不改继续提示文案（D-19d——`open`：是否补「累计进度」口径留待用户 / 后续批）；
- 不建 VSC live 头逐轮跳动（`open`——登记行 VSC `docs/design/AGENT-LOOP` :27 / `docs/design/ARCHITECTURE` :21 保持开放：本批修值语义，不建桥通道）；
- 不改段内帽 / 续跑机制与 `ContinueError` 载荷；不动 `TUI.md`（显示形态不变——零必要面）；
- 不碰他批在途档（CLI `docs/design/AGENT-LOOP` 正被第 14 批设计者占用——本项落点避让至本档）。

**与相邻登记两行的关系（批次 §1 问 5）**：

- 两行登记（VSC `docs/design/ARCHITECTURE` :21-23 / VSC `docs/design/AGENT-LOOP` :27-29）=「live 头缺逐轮 turn 段 + 降级口径：终态通知携真实终值」；
- **本批不关该行**（live 逐轮跳动仍缺——需桥通道）；
- 但该行的**降级口径前提**被本批修正：多段任务的「真实终值」此前实为**最后一段计数**——本批后为累计终值（降级口径首次对多段任务成立）；
- 登记行补一行指针（两处：VSC `docs/design/AGENT-LOOP` :27-29 与 `docs/design/ARCHITECTURE` :21-23）= **父侧排程**——两档均为他批在途面（DOC-HYGIENE 批 C3 触 VSC AGENT-LOOP §7），本设计者未改。

## 边界

- **继续次数不设上限**（用户明确要求）；防卡死靠用户 Ctrl+C（中止路径清池不续跑）。
- 触发预算全部来自 config（`agent.maxTurns` / `agent.subagentTurns` / `agent.consultTurns`），可配。
- explore（子代理角色之一）走 `subagentTurns`（AGENT-PARAMS 2026-08-24：插件 explore 的 30 硬帽移除，双端对齐）——主 agent 走 `maxTurns`，见上表。
- 部分成果路径（拒绝/无权限 handler）返回文本带 `TURN_CAP_MARK`——报告可据此判定"撞墙中断、工作可能不完整"，见各调用方的 onDeclined 文案。

## 变更记录

- 2026-08-17：立项实现（CHANGELOG 0.12.33「撞轮数墙可无限继续」）。主 agent 已有无限 continue；子 agent / escalate / consult 补同款——escalate 删 `MAX_RESUMES=2` 封顶、consult 继续时重置 watchdog。
- 2026-09-03~06：随子代理重构收敛——继续循环抽为 `runWithContinue` 共享骨架（`src/agent/spawn-child.mjs`）；escalate 完全异步化（R17）后其继续面移到 `escalate-async.mjs`，仍走同一骨架。
- 2026-09-07：本文档随格式债清理批 A 重写为当前态。
- 2026-09-11：第 19 批——跨段累计编号设计落档（§跨段累计编号 19.1-19.8；需求 F7/N5/N6 同步）——待评审 / 实施。
- 2026-09-11（修正轮）：设计评审轮次 1 后落修（CLI 面 #1/#2/#3/#6——映射见批次档 §2 修正块）；公式文字零改动。
