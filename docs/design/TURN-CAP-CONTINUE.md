# 撞轮数墙可继续（TURN-CAP-CONTINUE）

> 板块：Agent 循环（`TURN-CAP-CONTINUE.md`——撞墙可继续专题，独立保留，见 README 地图）。
> 状态：**机制已实现并在现行代码生效**——主/子/飞刀/会诊四类执行体撞轮数墙都能"继续"，且不限次数。与 CLI 端同源（两端语义一致）。

> 权威源：`src/agent.mjs`（`ContinueError`）、`src/agent/run-helpers.mjs` / `src/agent/setup.mjs`
> （预算 + `stateSink.history` / resume）、`src/extension/panel-chat.mjs`（主 agent 回合循环）、
> `src/agent-tools/subagent.mjs`（子 agent）、`src/agent-tools/subagent-escalate.mjs` /
> `subagent-escalate-async.mjs`（飞刀）、`src/agent-tools/consult.mjs`（会诊）。
> 文档格式债清理批 V2（2026-09-08）——整文件单物理行 demux 为多行 + 漂移修正（explore-30 表述已随 AGENT-PARAMS 取消）。

## 统一语义

- **撞墙** = runAgent 耗尽 maxTurns 抛 `ContinueError`（携带轮数）；
- **继续** = `resume:true` 重跑同一个执行体：不重新注入任务文本、保留 history 与改动记录、每次全新轮数预算（`resume` 时经 `opts.history = sink.history` 把子执行体的活 history 交回）；
- **拒绝 / headless（无 onQuestion）** → 返回部分成果（标记 turn cap reached，报告可据此判定"撞墙中断、工作可能不完整"）；
- 用户 Stop（`AbortError` / signal.aborted）始终优先于继续提示；
- 继续提示按会话级队列串行（并行子执行体同时撞墙不弹多个）。
- **编号口径**（第 19 批——2026-09-11）：逐轮编号（`turn n/max`）在续跑链内**跨段累计**（不重置、不倒退）——见「跨段累计编号」。

## 各执行体

| 执行体 | 轮数预算 | 继续通道 | 次数 |
|---|---|---|---|
| 主 agent | `maxTurns`（默认 200） | 面板继续卡（`askInPanel` "Continue/Stop"；AUTO 自动续跑不弹卡） | 不限 |
| 子 agent | `subagentTurns`（默认 100） | `onQuestion` 面板问题卡（前台/阻塞子代理弹卡；后台 async 不弹——engineering && AUTO 自动续跑） | 不限 |
| 飞刀 escalate | `subagentTurns`（默认 100） | `onQuestion` 面板问题卡（同步飞刀弹卡；后台 async 自动降级 partial） | 不限（`MAX_RESUMES=2` 已删） |
| 会诊 consult | `consultTurns`（默认 40） | `onQuestion` 面板问题卡（`session.continueQueue` 串行）；继续时**墙钟 watchdog 重置** | 不限 |

## 实现要点（当前态）

### 主 agent

- `src/extension/panel-chat.mjs` 回合循环：`for (let resume = false; ; resume = true)`，runAgent 走 `runOpts(resume)`。
- `ContinueError` 分支与 Ctrl+I 中断（`AbortError` + `reason.interrupt`）并入同一循环：重建 controller → `continue`。
- 手动档：`askInPanel("Agent reached N turns (limit). Continue from here?", ["Continue","Stop"])`——Continue 则重建 controller 续跑（resume 跳过重推用户消息）。
- AUTO 档（`autoTurn`）：不弹卡——`panel._autoApprove` 时自动重建续跑，否则静默停（partial digest 留在 history）。

### 子 agent

- `src/agent-tools/subagent.mjs` execute 内 `for (let resume = false; ; resume = true)` 循环，捕获 `ContinueError`。
- 前台（非 asyncFlag）且有 `ctx.callbacks.onQuestion`：弹 `["Continue","Stop"]` → continue 时 `{ ...baseOpts, resume, history: sink.history }`。
- 后台 async 子代理（`asyncFlag`）**永不弹卡**（§15 D-A3）——engineering && AUTO 时经 `shouldAutoResume`（subagent-async.mjs）自动续跑，否则降级 partial。
- 拒绝 / headless / 无法续跑 → 返回 `turn cap reached (N turns) — work may be partial`（eng-coder 附带 designId 注记供重派）。

### 飞刀 escalate

- `src/agent-tools/subagent-escalate.mjs`（同步）：循环捕获 `ContinueError` → `ctx.callbacks.onQuestion(["Continue","Stop"])` → continue 时 `resume:true`。
- `MAX_RESUMES` 已删除——不限次数。
- 后台 async 飞刀（`subagent-escalate-async.mjs`）：无面板值守，撞 turn cap 归 error-class 自动降级 partial（消化轮处置）。
- 无墙钟 watchdog——仅 turn cap（hang 防护 = per-LLM-call FETCH_TIMEOUT + 用户 Stop）。

### 会诊 consult

- `src/agent-tools/consult.mjs` runConsultant 循环，捕获 `ContinueError`。
- 前台回合内：`session.continueQueue = (session.continueQueue ?? …).then(ask, ask)` 串行排队询问（`["Continue","Stop"]`）→ continue 时 `clearTimeout(watchdog)` + `timedOut=false` + 重挂 watchdog（每次继续 = 新预算 = 墙钟重起）。
- 挂起期（`_suspended`，后台）consult 撞 turn 帽**不再弹继续卡**——自动降级 partial（消化轮处置）。
- consult 预算 `consultTurns ?? 40`；墙钟 `agent.consultTimeoutMs ?? 600_000`（10min）。

## 跨段累计编号（2026-09-11——第 19 批）

> 需求（双端同源）：CLI 仓 `docs/requirements/TURN-CAP-CONTINUE` F7（§2）+ N5/N6（§3）——本端需求面随该节（VSC 仓无独立 requirements/ 目录——惯例同 A2-SUMMARY-PARITY 等档：需求 + 设计同档）。
> 来源批次：CLI 仓 `docs/batches/2026-09-11-TURN-ACROSS-SEGMENTS` §1。CLI 侧设计 = CLI 仓 `docs/design/TURN-CAP-CONTINUE` §跨段累计编号（**同源异实现**——各端以本端代码为准，不互为镜像）。
> 状态：**设计就绪待评审**（第 19 批）——实施者 = eng-coder（设计 token 门）。

### 19.1 问题陈述（现场复核——as-of 2026-09-11）

本端续跑循环内联在各执行体模块（子代理：`src/agent-tools/subagent-run.mjs:76`——`for (let resume = false; ; resume = true)`；
飞刀同款：`subagent-escalate.mjs` / `subagent-escalate-async.mjs`）——每次续跑重进 `runAgent`，段内 `turn` 从 0 重起，
`callbacks.onAgentTurn?.(turn + 1)`（`src/agent.mjs:125-129`）写入池条目的 `entry.turn`（`subagent-run.mjs:113-118`）随之重置。

用户可见面 = **冻结身份头**：`webview/activity-view.js:52`（`turn n/max`）← 终态通知 `subagent-run.mjs:137`（`{turn, maxTurns}`）← `entry.turn/maxTurns`；
模型面 = `subagent status`（`subagent-actions.mjs:65-66`）。

**live 头逐轮跳动本端本就缺**（出生事件 `suspension.mjs:141` 不携 turn——登记行见 19.8）——本批修的是**值语义**（终值 / 查询值跨段累计），不是新增 live 通道。

### 19.2 方案选型对比（判据 = 用户可见语义正确 · 既有锁不破 · 改动范围）

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **跨段累计**（口径与 CLI 同源：n = 链内累计已跑轮数；max = 累计已授予预算） | 语义与 CLI 一致（双端同源）；改动面 = 本端生成侧（复位 + 种子落点 + 循环赋值 + 回调契约）+ 两消费点（取值 + 段间种子回传——19.3）；**桥消息字段零新增**；既有测试无编号发值断言（全量分类 = 19.2 注①） | 代价：回调增第二参（两消费端同步改） | **选定** |
| 2 | 分段显式（段号 + 段内号） | 需扩展桥消息（新字段）+ webview 头部与状态面改——登记行明示「桥白名单不擅建」；与「改动范围」判据冲突 | — | 否决 |
| 3 | 不动（保持段内值） | 冻结头终值失真（多段任务显示最后一段计数，如真实 130 轮显 30/100）——缺陷原样 | — | 否决 |

**注①（测试面全量分类——2026-09-11 复核）**：本端无 `⟦ev⟧` token 协议（全仓 `test/` 对 `⟦ev⟧` 与 `onAgentTurn` 均 0 命中）；`turn`/`maxTurns` 命中全为 fixture 显式值（`activity-flow.test.mjs:101/288/292`、`subagent-observe-send.test.mjs:17/43`、反向断言 :201）。
其余命中 = config 键面（`settings-tool` / `config-io-panel` / `agent-lifecycle-singleton` / `smoke-settings`）与 trace 字段面（`trace-store`——`stage:"turn"` 语义无关）——无真实 runAgent 发射编号断言。

### 19.3 契约（状态 / 编号帧 / 回调 / 消费点）

**唯一新增状态**：`agent._turnSeq`（链内累计序数——agent 级）。

- 复位 = 循环前、条件 `!opts.resume`（可与 `src/agent.mjs:99` 既有 `!opts.resume` 守卫或 `_runStartHistoryLen` 赋值邻位同源——实施者择其一落点，但**不得无条件复位**，否则续跑累计失效）；
- **段间种子**（2026-09-11 载体缺口修正轮——修法 A）：`resume` 且 `agent._turnSeq == null` → 落 `opts._turnSeqBase`（缺省 0）——**非空不覆盖**（见下「段间载体契约」）；
- 递增 = 段内每进入一轮 +1（续跑不重置、不回退）。

**段间载体契约（2026-09-11——批次档 §5 VSC 打回实证）**：本端子代理面每段续跑 = **新 agent 对象**（`runAgent` 内部自建——
`opts.agent` 仅 depth-0 复用，`src/agent.mjs:85`；两续跑循环每段重调 runAgent 且不传 agent——`subagent-run.mjs:81-121` /
`subagent-escalate-async.mjs:90-106`；resume 重跑 setup = D-SF1 刻意语义，`subagent-run.mjs:108-112`）——`agent._turnSeq` 不跨段存活，
故累计经 **`opts._turnSeqBase`** 回传：

- 消费侧义务（种子源）：循环局部「段前累计」（**循环外声明——跨迭代存活**）随 `onAgentTurn` 回调更新为最新帧第一参
  （entry 路径与 `entry.turn` 同点同值；sync 路径（`entry` 空）由同一局部量覆盖）——续跑段以 `opts._turnSeqBase` 传入
  （两循环：`subagent-run.mjs` / `subagent-escalate-async.mjs`）；
- CLI 对照：同一 child 对象跨段 → `_turnSeq` 非空 → 种子零作用——双端语义同源（同结果、异载体）；
- escalate-async 续跑支当前休眠（`ContinueError` 全走 error-class return——`subagent-escalate-async.mjs:119-124`，全档无 `continue`）：
  种子写入 = 同构契约驻留（未来开放续跑即在位），零行为变化。

**编号帧**（纯函数；落 `src/agent/run-helpers.mjs`——本端模块地图既有「常量（turn 上限…）」面）：
`turnFrame(seq, turn, maxTurns) → { turn, maxTurns }`——`turn = seq`；`maxTurns = seq - turn - 1 + maxTurns`
（差额项 = 本段开始前的链内累计 → max = 段前累计 + 本段预算）。段内帽判定不读它。
调用点 = 循环头原位（`callbacks.onAgentTurn?.(turn + 1)`——`src/agent.mjs:129`）：`const frame = turnFrame(++agent._turnSeq, turn, maxTurns)` → `callbacks.onAgentTurn?.(frame.turn, frame.maxTurns)`（每轮无条件递增——与回调存在与否无关）。

**回调契约（签名扩展——向后兼容）**：`callbacks.onAgentTurn?.(turn, maxTurns)`——第一参 = 累计编号，第二参 = 累计预算（同帧）。
消费端（两处：`subagent-run.mjs` / `subagent-escalate-async.mjs`）统一经 `applyTurnFrame(entry, turn, maxTurns)`（同落本端 `run-helpers.mjs`；`entry` 空 → no-op）：
`entry.turn = turn`；`maxTurns > 0 → entry.maxTurns = maxTurns`。

**sync 路径零改动（判定依据）**：sync 飞刀 `subagent-escalate.mjs` 无池条目、子回调集不含 `onAgentTurn`（:161-170）——双参签名对其零消费者、零显示面，故不在改动面；sync spawn 面（`subagent-run.mjs` 中 `entry === null`——:67-68 既有注记）由 `applyTurnFrame` 的 `entry` 空分支 no-op 兜底（T6 锁）。

**零改动面**（同源值自动生效）：终态快照 `subagent-run.mjs:137`、webview 显示文件（`activity.js` / `activity-view.js`）、
`suspension.mjs` 出生 / queued 事件、段内帽判定（`for (let turn = 0; turn < maxTurns; turn++)` + `ContinueError`）。

### 19.4 关键决策记录（含否决备选）

- **D-19a′（选定）回调第二参传累计预算**：否决「消费端读 `sink.agent` 字段」（间接、依赖绑定时机）；否决「新桥消息」（桥面改动——登记行不擅建）。
- **D-19b′（选定）终态快照与 webview 零改动**：`entry` 已是累计值——快照 / 头部逐字消费，不动一行（= 消费点零改动机械证明的落点）。
- **D-19c′（选定）depth 无关**：与 CLI 同规则（本端主会话不显示 turn 编号——本端唯一可观测面 = 池条目/冻结头，均为子代理面）。
- **D-19d′（选定）live 头逐轮跳动不建**：登记行（19.8）保持开放——需桥通道（`suspension.mjs` / panel 消息面），本批只修值语义。
- **D-19e′（选定）段内帽 / 续跑语义零改动**：累计只作用于编号值（续跑循环仅增种子传参——载体补齐，见 D-19f′）。
- **D-19f′（选定——2026-09-11 载体缺口修正轮）段间种子经 `opts`（修法 A）**：种子落点收在生成侧复位块（`_turnSeq == null` 才落——生成侧单点保持，D-19a′）。否决修法 B（消费侧偏移 `applyTurnFrame(entry, base + t, base + mt)`）：累计偏移公式在消费侧再写一遍（两消费点各一份）+ 削弱生成侧单点。

### 19.5 受影响文件全清单（VSC 仓；行数 = `wc -l`；as-of 2026-09-11）

| 文件 | 改动 | 行数（现 → 预计） |
|---|---|---|
| `src/agent.mjs` | ① `!opts.resume` 复位 `_turnSeq` ② resume 支种子落点（`opts._turnSeqBase`——载体缺口修正轮）③ 循环内编号帧 → `onAgentTurn(turn, maxTurns)` | 353 → ~362 |
| `src/agent/run-helpers.mjs` | `turnFrame` + `applyTurnFrame`（+ 注释） | 276 → ~292 |
| `src/agent-tools/subagent-run.mjs` | ① 消费点改 `applyTurnFrame` ② 段前累计捕获 + 续跑支种子传参 | 184 → ~190 |
| `src/agent-tools/subagent-escalate-async.mjs` | 同（种子挂续跑支——当前休眠，见 19.3） | 216 → ~220 |
| `test/turn-across-segments.test.mjs` | 新档——用例 T1-T11（T9-T11 = 载体缺口修正轮新增） | 新（~140） |
| `docs/design/TURN-CAP-CONTINUE.md` | 本节 | 全档 70 → 206 行（`wc -l`；本批增补前 → 载体缺口修正轮落档后） |
| （父侧排程）`docs/design/AGENT-LOOP` · `docs/design/ARCHITECTURE` | 登记行指针 + hook 措辞同步（他批在途——见 19.8） | — |

### 19.6 用例表（正常 / 边界 / 错误）

| # | 类型 | 场景 / 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| T1 | 正常 | `turnFrame(1, 0, 100)`——段 1 首轮 | `{turn: 1, maxTurns: 100}` | F7 |
| T2 | 边界 | `turnFrame(101, 0, 100)`——续跑段首轮（缺陷点；累计序数 = 101） | `{turn: 101, maxTurns: 200}`——**不回到 1** | F7 |
| T3 | 边界 | `turnFrame(238, 37, 100)`——第 3 段中段（段前累计 200 + 段内 37 + 1） | `{turn: 238, maxTurns: 300}` | F7 |
| T4 | 边界（不变式） | 扫描（限可达域：段内 `turn ∈ [0, max)`、`seq ≥ turn + 1`）seq∈{1, 100, 101, 250} × max∈{40, 100} | 恒 `turn ≥ 1`、`turn ≤ maxTurns`、`maxTurns = (seq - turn - 1) + max` | F7 / N5 |
| T5 | 正常 | `applyTurnFrame(entry, 101, 200)`（fixture entry——`mkEntry` 风格；`test/subagent-observe-send.test.mjs` 同款） | `entry.turn = 101`、`entry.maxTurns = 200` | F7 |
| T6 | 边界 | `applyTurnFrame(null, 101, 200)`（`entry` 空——无池条目路径；判定见 19.3 sync 注） | no-op 不抛（sync 零影响） | N6 |
| T7 | 正常（显示面零改动） | fixture：终态消息 `{type: "subagent", status: "done", turn: 130, maxTurns: 200}` → 冻结头（webview 面） | 头含 `turn 130/200` | F7（webview 零改动机械证明） |
| T8 | 错误 / 回归 | ① `_turnSeq = 0` 复位条件 = `!opts.resume`（源码锚）② 既有 activity-flow / webview-turnstate / observe-send 全绿 | 复位无第二点；回归绿 | N5 / N6 |
| T9 | 边界（**段间生产断言**——修正轮新增，本缺口核心） | 真 `runAgent` 直驱 ×3 段（`depth:1`、`maxTurns:100`、provider 不可解析——见接缝注）：段 1 `resume:false` → 段 2 `resume:true` + `opts._turnSeqBase` = 段 1 末帧第一参 → 段 3 `resume:false` | 段 1 首帧 `(1, 100)`；**段 2 首帧 `(2, 101)` = 段 1 累计 + 1（不回到 1）**；段 3 首帧 `(1, 100)`（新链复位） | F7 |
| T10 | 边界（**消费侧接线**——修正轮新增） | 真 `runChild`（`entry` 空夹具、`onQuestion → "Continue"`、空 `parent`——见接缝注）+ 假 `runAgent`：段 1 发 `onAgentTurn(1, 100)` 后抛 `ContinueError`；段 2 采集所收 `opts` | 段 2 `opts.resume === true` 且 `opts._turnSeqBase === 1`；`entry.turn === 2`；终态通知 `{turn: 2, maxTurns: 101}` | F7 |
| T11 | 错误 / 源码锚（修正轮新增） | ① `agent.mjs` 种子落点源锚（`resume` + `_turnSeq == null` → `opts._turnSeqBase`）② 两循环续跑支 `_turnSeqBase` 各 1 命中（`subagent-run.mjs` / `subagent-escalate-async.mjs`——旧码 0 命中） | 锚驻留（fail-when-unchanged）；无第二复位点 | F7 / N6 |

用例面声明：纯函数 / 助手打接缝缝（T1-T6）、webview 真模块 fixture（T7——`test/helpers/webview-env.mjs` 面）、源码锚 + 全量回归（T8）、**真 runAgent 直驱段间断言（T9）+ 真 runChild 循环接线（T10）+ 源码锚（T11）——T9-T11 = 载体缺口修正轮新增**。

**接缝注（T9 / T10——载体缺口修正轮）**：T9 provider 桩 = 不可解析（无 `baseURL` 等——`chat` 即抛、无网络），`onAgentTurn` 在循环头先于 chat 发射
（探针同款 = 批次档 §5 VSC 打回段）——测试 catch 抛错、只收帧；段 2 帧期望 `(2, 101)` = `turnFrame(2, 0, 100)`（差额项 = 段前累计 1 + 段预算 100）。
T10 夹具 = `entry` 空对象 + `ctx.callbacks.onQuestion` 返回 "Continue" + 空 `parent`（`mergeChildMutations` 空 sink 早退）；段 2 假 `runAgent` 以 `onAgentTurn(2, 101)`（= `turnFrame(2, 0, 100)`，与 T9 同口径）模拟生成侧帧。

### 19.7 验收标准（逐条回指——每条可机器验证）

| AC | 判据（机器可验证） | 回指 |
|---|---|---|
| AC1′ | T1-T4 绿：同算式同口径（与 CLI AC1 同源判据——两档各自驻留）+ **T9 段间生产断言：段 2 首帧 = 段 1 累计 + 1（真 runAgent 直驱——载体缺口修正轮）** | 批次 §1 问 2 |
| AC2′ | `onAgentTurn` 双参发出（源码锚）+ 两消费点经 `applyTurnFrame`（T5 / T6 绿）+ **消费侧接线：段前累计 → 续跑段 `opts._turnSeqBase`（T10 绿 + T11 锚）** | 批次 §1 问 2 |
| AC3′ | `_turnSeq = 0` 复位条件 = `!opts.resume`（源码锚——不得无条件复位）+ 无第二复位点 + **种子落点仅在 `_turnSeq == null`（T11 锚）** | 批次 §1 问 2 + 范围边界 |
| AC4′ | 终态快照行（`subagent-run.mjs:137`）与 webview 两文件（`activity.js` / `activity-view.js`——命名清单同 19.3）diff 零行 + T7 绿 | 批次 §1 已核事实（渲染层假设复核 = 无假设） |
| AC5′ | 段内帽 / 续跑语义零改动（**续跑循环仅增种子传参——帽判定 / `ContinueError` 载荷 / 循环结构零改动**）：T8 源码锚 + VSC 全量回归绿 | 批次 §1 范围边界（不改回合帽 / 续跑机制） |
| AC6′ | 登记行关系落档（19.8 同口径）——登记行本体同步 = 父侧排程 | 批次 §1 问 5 |

### 19.8 边界（本项——不做）与相邻登记

**明确不做**：

- 不建 live 头逐轮跳动（`open`——需桥通道；登记行 VSC `docs/design/AGENT-LOOP` :27-29 / `docs/design/ARCHITECTURE` :21-23 保持开放）；
- 不改 `suspension.mjs` 出生 / queued 事件（不带 turn——登记缺口本体）；
- 不改 webview 显示文件与桥消息面（值语义零改动即生效）；
- 不改段内帽 / `ContinueError` 语义（续跑循环仅增种子传参 = 载体补齐——见 19.3）；
- 不碰他批在途档（VSC `docs/design/AGENT-LOOP`——DOC-HYGIENE 批 C3 触其 §7）。

**与相邻登记两行的关系（批次 §1 问 5）**：

- 两行登记（VSC `docs/design/ARCHITECTURE` :21-23 / VSC `docs/design/AGENT-LOOP` :27-29）=「live 头缺逐轮 turn 段 + 降级口径：池条目终态通知携真实终值」；
- **本批不关该行**（live 逐轮跳动仍缺）；但该行的降级口径前提被本批修正：多段任务的「真实终值」此前实为**最后一段计数**——本批后为累计终值；
- **需父侧排程**（本设计者未改——两档为他批在途面 / 禁写面）：① VSC `docs/design/AGENT-LOOP` :27-29 登记行补指针（→ 本档本节）+ :129 hook 措辞同步（`onAgentTurn?.(turn + 1)` → 双参契约）；② VSC `docs/design/ARCHITECTURE` :21-23 同款指针（与 ① 同步改——防两处登记漂移）。

## 边界

- **继续次数不设上限**（用户明确要求）；防卡死靠用户 Stop。
- 触发预算全部来自共享 config（`agent.maxTurns` / `agent.subagentTurns` / `agent.consultTurns`），可配——**explore 与其它子代理角色共用 `subagentTurns`**（AGENT-PARAMS 2026-08-24 已移除插件 explore 的 30 硬帽，两端对齐；本文件不再承载 explore 预算语义，见 AGENT-PARAMS）。
- 部分成果路径（拒绝 / 无权限 handler / headless）返回文本带 turn-cap 标记——报告据此判定"撞墙中断、工作可能不完整"。

## 变更记录

- 2026-08-17：立项实现。主 agent 已有无限 continue；子 agent / escalate / consult 补同款——escalate 删 `MAX_RESUMES=2` 封顶、consult 继续时重置 watchdog（本文件整文件单行最初版）。
- 2026-08-24：AGENT-PARAMS 移除插件 explore 30 硬帽——explore 并入 `subagentTurns`（本文件原"vscode explore 封顶 30"表述随之作废）。
- 2026-09 起：随子代理重构收敛——子 agent/escalate/consult 的继续循环各居其模块；escalate 完全异步化后其同步面 continue 仍走同一 onQuestion 通道；主 agent 循环并入 Ctrl+I 中断续跑语义。
- 2026-09-08：随文档格式债清理批 V2 重写为多行当前态 + 漂移修正。
- 2026-09-11：第 19 批——跨段累计编号设计落档（§跨段累计编号 19.1-19.8——需求 F7/N5/N6 随 CLI 仓 requirements 档）——待评审 / 实施。
- 2026-09-11（修正轮）：设计评审轮次 1 后落修（VSC 面 #1/#2/#4/#5/#6——映射见批次档 §2 修正块）；公式文字零改动。
- 2026-09-11（载体缺口修正轮）：VSC 子代理面每段续跑 = 新 agent 对象（`agent.mjs:85`——`opts.agent` 仅 depth-0；打回见批次档 §5）→ 段间种子经 `opts._turnSeqBase`（修法 A——D-19f′）；AC / 用例补 T9-T11（段间生产断言）；公式 / 回调契约 / `applyTurnFrame` 零改动。
- 2026-09-11（假帧口径修正轮——设计评审「VSC 载体缺口修正轮单轮校验」发现 #1 🟡，批次档 §3）：T10 假 `runAgent` 帧 `(2, 200)` → `(2, 101)`（= `turnFrame(2, 0, 100)`，与 T9 同口径；终态通知同步）；其余零改动。
