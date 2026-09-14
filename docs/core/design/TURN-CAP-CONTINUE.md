# 撞轮数墙可继续（TURN-CAP-CONTINUE）· Agent 循环板块

> 板块 = **轮数预算耗尽后的续跑**（撞墙可继续）——统一语义 · 四执行体 · 跨段累计编号。
> 本档 = 该机制的**唯一权威**（续跑语义 / 编号口径 / 双端坐标）。
> 相邻权威 = `docs/core/design/AGENT-LOOP.md`（主循环与子代理机制本体）· `docs/core/design/AGENT-PARAMS.md`（轮数预算默认值族）·
> `docs/core/design/ESCALATE.md`（飞刀）· `docs/core/design/CONSULTATION.md`（会诊）——本档不复制其内容（D2）。
> 需求侧 = `docs/core/requirements/TURN-CAP-CONTINUE.md`（F1–F7 / N1–N5）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 3**——`thincoder-vscode/docs/design/TURN-CAP-CONTINUE.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。CLI 侧同名档（`thincoder-cli/docs/design/TURN-CAP-CONTINUE.md`）**已并入（2026-09-15 · CLI 尾部真批）**——
> CLI 独有面（`runWithContinue` 骨架 / TUI 继续通道 / CLI 消费链坐标 / D-19 族决策）已入 §1–§5，(d) 类入 §6.1。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 统一语义

| # | 条目 | 判据 |
|---|---|---|
| 1 | **撞墙** | `runAgent` 耗尽 `maxTurns` 抛 `ContinueError`（VSC `thincoder-vscode/src/agent.mjs:36`（类）/ `:371`（抛点）；核 `thincoder-core/agent.mjs:24`（导入）） |
| 2 | **继续** | `resume:true` 重跑**同一执行体**：不重新注入任务文本、保留 history 与改动记录、每次全新轮数预算（VSC `thincoder-vscode/src/agent.mjs:96` 起 `resume` 参数；核 `thincoder-core/agent.mjs:96`） |
| 3 | **拒绝 / headless** | 无 `onQuestion` 或无权限 handler → 返回部分成果 + turn-cap 标记——`TURN_CAP_MARK = "stopped: turn cap reached"`（常量单源 = `thincoder-core/agent/spawn-child.mjs:32`；尾部附 "work may be partial"）——报告据此判定「撞墙中断、工作可能不完整」 |
| 4 | **用户 Stop 优先** | 中止路径（`AbortError` / `signal.aborted`）恒优先于继续提示——不弹卡、不自动续跑 |
| 5 | **继续提示串行** | 按会话级队列串行（`continueQueue`）——并行执行体同时撞墙不弹多个卡 |
| 6 | **次数不限** | 无次数帽（`MAX_RESUMES` 形态已从代码面移除——VSC 侧 `src/` 零命中实核）；防卡死靠用户 Stop |

## 2. 四执行体（预算 / 通道 / 上限）

| 执行体 | 轮数预算（默认） | 继续通道 | 次数 |
|---|---|---|---|
| 主 agent | `agent.maxTurns`（200） | 面板继续卡（"Continue / Stop"）；AUTO 档自动续跑不弹卡 | 不限 |
| 子 agent | `agent.subagentTurns`（100） | `onQuestion` 面板问题卡（前台弹卡；后台 async 永不弹——engineering && AUTO 自动续跑，否则降级 partial） | 不限 |
| 飞刀 escalate | `agent.subagentTurns`（100） | `onQuestion` 面板问题卡（同步路径弹卡；async 路径 auto-degrade partial） | 不限 |
| 会诊 consult | `agent.consultTurns`（40） | `onQuestion` 面板问题卡（`session.continueQueue` 串行）；继续 = **墙钟 watchdog 重置** | 不限 |

预算默认值单源 = `thincoder-core/agent/helpers.mjs:24`（`DEFAULT_MAX_TURNS = 200`）· `:25`（`DEFAULT_SUBAGENT_TURNS = 100`）；
参数族权威 = `docs/core/design/AGENT-PARAMS.md`（本档只列名，不重述默认值表）。

**CLI 侧继续通道**（与上表 VSC `onQuestion` 面板问题卡对位）：子 agent / 飞刀 / 会诊 = 权限请求 `onPermissionRequest("continue", …)`
（TUI 渲染主 agent 同款 y/n Continue 面板——`thincoder-cli/src/tui/render-frame.mjs:326` / `:352`）；escalate 无 permQueue、直问用户；
主 agent = TUI 权限面板（`src/tui/agent-turn.mjs:182` 捕 `ContinueError` → `:201` 弹 `name: "continue"` 权限卡）——AUTO 档自动 resume，每次重建 controller 续跑。

## 3. 实现坐标（双端 · as-of 2026-09-15 实核）

### 3.1 核 / CLI 面

| 面 | 落点 | 实核 |
|---|---|---|
| `ContinueError` | `thincoder-core/agent.mjs:24`（导入）· `:46` | 在位 |
| `runAgent` 入口（`resume` 参数） | `thincoder-core/agent.mjs:96` | 在位 |
| 每轮编号帧调用点 | `thincoder-core/agent.mjs:200`（`const frame = turnFrame(++agent._turnSeq, turn, maxTurns)`）· `:202` | 在位 |
| 编号帧纯函数 | `thincoder-core/agent/helpers.mjs:221`（`export function turnFrame(seq, turn, maxTurns)`） | 在位 |
| 续跑支（子代理） | `thincoder-core/agent-tools/subagent-run.mjs`（`resume` 分支） | 在位（子代理轮帽语义面） |
| 续跑支（会诊） | `thincoder-core/agent-tools/consult.mjs:304`（注释：每次 continue = 新回合预算 + 重挂 watchdog）· `:319`（`continueQueue`）· `:322`/`:324` | 在位 |
| **续跑骨架（三执行体共用）** | `thincoder-core/agent/spawn-child.mjs:218`（`runWithContinue(runner, child, input, callbacks, runOpts, { askContinue, onDeclined })`——`ContinueError → 询问 → resume:true 重跑`循环骨架，差异点经参数注入）· `:32`（`TURN_CAP_MARK`） | 在位 |
| 主 agent 续跑（CLI） | `thincoder-cli/src/tui/agent-turn.mjs:182`（`ContinueError` 分支）· `:201`（`name: "continue"` 权限卡）· `:108`（续跑重建 controller 登记 abort 集合） | 在位 |
| 编号镜像层（子代理） | `thincoder-core/agent-tools/subagent-run.mjs:105-112`（`⟦ev⟧turn` 原样正则解析 → `entry.turn` / `maxTurns` → status / observe 面） | 在位 |
| 编号镜像层（飞刀） | `thincoder-core/agent-tools/escalate-async.mjs:207-209`（同形解析 → `entry.turn`） | 在位 |
| CLI 消费链 | `thincoder-cli/src/tui/subagent-blocks.mjs:46`（`SUB_EVENT_RE` 块头 `turn n/max`）· `render-frame.mjs:376-377`（主会话状态行读 `_currentTurn` / `_maxTurns`） | 在位 |

### 3.2 VSC 面

| 面 | 落点 | 实核 |
|---|---|---|
| 类 / 抛点 | `thincoder-vscode/src/agent.mjs:36` · `:371` | 在位 |
| 编号复位 / 段间种子 | `thincoder-vscode/src/agent.mjs:125`（`if (!opts.resume)`）· `:126`（`agent._turnSeq = 0`）· `:127-128`（`_turnSeq == null` → `opts._turnSeqBase ?? 0`） | 在位（全档唯一复位点） |
| 编号帧发出 | `thincoder-vscode/src/agent.mjs:142-143`（`turnFrame(++agent._turnSeq, …)` → `callbacks.onAgentTurn?.(frame.turn, frame.maxTurns)`） | 在位 |
| 帧纯函数 / 消费 helper | `thincoder-vscode/src/agent/run-helpers.mjs:29`（`turnFrame`）· `:37`（`applyTurnFrame`） | 在位 |
| 子代理续跑循环 | `thincoder-vscode/src/agent-tools/subagent-run.mjs:85`（`for (let resume = false; ; resume = true)`）· `:132`（`applyTurnFrame`）· `:141`（`resume` → `history` + `_turnSeqBase`）· `:175`（`ContinueError` 分支） | 在位 |
| 撞墙终态文案 | `thincoder-vscode/src/agent-tools/subagent-run.mjs:195`（`onSubagent` error）· `:199`（返回文本） | 在位 |
| 飞刀同步续跑 | `thincoder-vscode/src/agent-tools/subagent-escalate.mjs:153`（`runOpts(resume)`）· `:158`/`:161` · `:163`（`for (let resumes = 0; ; resumes++)`）· `:177`（`runOpts(resumes > 0)`）· `:197`（`ContinueError` 分支） | 在位 |
| 飞刀 async 面 | `thincoder-vscode/src/agent-tools/subagent-escalate-async.mjs:76`（注释：续跑支当前休眠——`ContinueError` 全走 error-class return） | 在位（同构契约驻留） |
| 会诊续跑 | `thincoder-vscode/src/agent-tools/consult.mjs:300`（`consultTurns ?? 40`）· `:310`（`ContinueError`）· `:319-325`（队列 + watchdog 重挂） | 在位 |
| 主 agent 回合循环 | `thincoder-vscode/src/extension/panel-chat.mjs`（回合循环） | 在位 |

**源档坐标漂移（迁移期实核发现，已按现状改写）**：旧档所载 `subagent-run.mjs` 行数 `184` → 现 **206**（续跑循环 `76` → `85`；
`applyTurnFrame` 消费点 `113-118` → `132`；终态文案 `137` → `195`/`199`）；`subagent-escalate.mjs` 行数 `216` → 现 **226**（循环头 `163`）。
上述漂移随 B 式重建**已按现状改写**，旧档坐标不再引用。

## 4. 跨段累计编号（现行机制 · 已落）

**问题**：续跑链内每次重进 `runAgent` 段内 `turn` 从 0 重起 —— 多段任务在池条目 / 冻结身份头上显示**最后一段**计数（如真实 130 轮显 `30/100`），终值失真。

**口径**（双端同源）：**跨段累计**——`turn = 链内累计已跑轮数`；`max = 段前累计 + 本段预算`。

- **编号帧（纯函数）**：`turnFrame(seq, turn, maxTurns) → { turn: seq, maxTurns: seq - turn - 1 + maxTurns }`——差额项 = 本段开始前的链内累计。
  段内帽判定**不读**该帧（循环条件仍只读段内 `turn < maxTurns`）。
- **唯一新增状态**：`agent._turnSeq`（链内累计序数，agent 级）——复位条件 `!opts.resume` 且**仅此一处**；递增 = 每轮无条件 +1（与回调存在与否无关）。
- **段间载体（端差面）**：VSC 子代理面每段续跑 = **新 agent 对象** ⇒ `_turnSeq` 不跨段存活 ⇒ 经 `opts._turnSeqBase` 回传
  （仅 `_turnSeq == null` 时落，非空不覆盖）；核侧同一 child 对象跨段 ⇒ `_turnSeq` 非空 ⇒ 种子零作用。
  **同结果、异载体**——语义同源，实现形态各端自持。
- **消费面零改动**：编号经既有回调与终态快照消费——**桥消息字段零新增**、webview 显示文件零改动（值语义改动即生效）。
- **零改动面**：终态快照、webview 显示文件（`webview/activity.js` / `activity-view.js`）、出生 / queued 事件、段内帽判定与 `ContinueError` 载荷。

## 5. 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-TC1 | **继续次数不设上限**（用户明确要求） | 防卡死靠用户 Stop；否决次数帽（`MAX_RESUMES` 形态已移除） |
| D-TC2 | 编号口径 = **跨段累计**（非分段显式） | 双端语义一致；改动面 = 生成侧 + 两消费点，桥消息字段零新增。否决「段号 + 段内号」（需扩展桥消息 + webview 头部改）·否决「不动」（冻结头终值失真） |
| D-TC3 | 累计预算经**回调第二参**传（非消费端读 `sink.agent`） | 否决「消费端读 agent 字段」（间接、依赖绑定时机）·否决「新桥消息」（桥面不擅建） |
| D-TC4 | 终态快照与 webview **零改动** | `entry` 已是累计值——快照 / 头部逐字消费 |
| D-TC5 | 段间种子经 **`opts`** 回传（VSC 修法 A） | 生成侧单点保持。否决「消费侧偏移」（累计公式在消费侧再写一遍 + 削弱生成侧单点） |
| D-TC6 | **不建 live 头逐轮跳动**（登记保持开放） | 需桥通道（出生 / queued 事件面）；本项只修**值语义** |
| D-TC7 | 段内帽 / 续跑循环结构 / `ContinueError` 载荷零改动 | 累计只作用于编号值 |
| D-TC8 | **编号帧复用 `_currentTurn` / `_maxTurns`**（approval 事件读同一对字段——CLI `thincoder-core/agent/dispatch.mjs:287` 零改动） | 只改 turn 事件载荷而状态行字段仍段内 ⇒ 同链内两类事件交替驱动块头、显示值来回跳。否决「只改 turn 事件载荷」 |
| D-TC9 | **depth 无关**（主会话续跑同构同修） | 同一缺陷结构在主会话续跑（Ctrl+I / AUTO 续跑）同存——只修 depth>0 = 留同构错误。**代价如实披露：主会话状态行编号同样累计**（同源结果） |
| D-TC10 | **继续提示文案不动**（`Ran ${error.turn} turns (limit …)` 描述**本段**撞墙事件） | 改文案 = 动锁定串 / 提示面——`open`：是否补「累计进度」口径留待用户 / 后续批 |
| D-TC11 | escalate 与子代理**共用 `ctx._subagentKey`**（`thincoder-core/agent-tools/subagent-actions.mjs:456-460`） | 继续 / 完成的 TUI 冻结与记账语义一致 |

## 6. 不并项与历史沿革

### 6.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/design/TURN-CAP-CONTINUE.md`（VSC 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「机制已实现并在现行代码生效」） | 时点状态行 | 批次语境——现行态已入 §1–§4 |
| 旧档 §19.1–§19.8（「第 19 批」节标题与批序） | 单批施工叙述（现场复核 / 选型 / 契约稿 / 受影响文件表 / 用例表 T1–T11 / AC1′–AC6′） | 一次性批次材料——现行约束已入 §3–§5 |
| 旧档 §19.5 受影响文件表 | 单次改动的文件 × 行数 | 一次性材料——现行坐标入 §3 |
| 旧档 §19.7 验收标准 AC1′–AC6′ | 单批验收清单（含已退场源码锚） | 批次材料——行为面由现行测试族覆盖 |
| 旧档「显式引例（CLI 仓用例编号）」注 | 跨仓引例编号 | 跨仓指针（P3 自持纪律）——不并 |
| 旧档变更记录（2026-08-17 起逐批流水） | 历史叙述 | 本档自有变更记录 |

> **CLI 侧来源档** `thincoder-cli/docs/design/TURN-CAP-CONTINUE.md`（2026-09-15 CLI 尾部真批对账并入）——原地保留作参照历史。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头部状态行与权威源清单 | 时点状态行 | 批次语境——现行坐标已入 §3 |
| 旧档 §19.1–§19.8（「第 19 批」节：现场复核 / 注①测试面分类 / §19.5 受影响文件 as-of 表 / §19.6 用例 T1–T8 / §19.7 AC1–AC9） | 单批施工叙述与一次性清单 | 批次材料——现行机制与口径已入 §3–§5；用例 / AC 由现行测试族覆盖 |
| 旧档 §19.8 相邻登记两行（VSC 仓 `docs/design/AGENT-LOOP` / `ARCHITECTURE` 行号指针） | 跨仓登记行指针 | 跨仓指针（P3 自持纪律）——不并；「live 头逐轮跳动缺」登记保持开放（§6.2 已有行） |
| 旧档变更记录（2026-08-17 起逐批流水） | 历史叙述 | 本档自有变更记录 |

### 6.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档「需求面随 CLI 仓 requirements 档」注 | 需求层承载指针 | 需求层已自持——见 `docs/core/requirements/TURN-CAP-CONTINUE.md` |
| 登记行「live 头逐轮跳动缺」 | 未决登记（需桥通道） | **保持开放**——非本机制欠账；触发 = 桥通道批次 |
| `AGENT-PARAMS` explore 30 硬帽沿革 | 邻板块参数沿革 | 归 `docs/core/design/AGENT-PARAMS.md` |
| CLI 侧同名档未迁面（CLI 台账列为后续批） | CLI 产品档正文 | **已并入（2026-09-15 CLI 尾部真批）**——CLI 独有面入 §1–§5，(d) 类入 §6.1 |

## 7. 体量与拆分规划（R24a）

**实测行数**：本档 **155 行**（as-of 2026-09-15 CLI 尾部真批并入后实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 并入既有 · eng-designer**）：`thincoder-cli/docs/design/TURN-CAP-CONTINUE.md` 逐节对账并入——
  CLI 独有面入档：`TURN_CAP_MARK` 常量单源（§1 #3）· CLI 继续通道对位段（§2）· §3.1 新增 6 行坐标（`runWithContinue` 骨架 /
  主 agent 续跑 / 编号镜像层 ×2 / CLI 消费链）· 决策补 D-TC8–D-TC11（§5）；(d) 类（§19 批次材料 / 状态行 / 跨仓登记行指针 / 逐批流水）入 §6.1。
  旧档原地一字不改。
- 2026-09-15（**B 式迁移轮 · VSC 批 3**）：建档——`thincoder-vscode/docs/design/TURN-CAP-CONTINUE.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；坐标改写为现状路径并实核（`thincoder-core/agent.mjs` · `agent/helpers.mjs` · `agent-tools/{subagent-run,consult}.mjs`；
  `thincoder-vscode/src/{agent.mjs,agent/run-helpers.mjs,agent-tools/*,extension/panel-chat.mjs}`）；源档漂移按现状收正（§3.2 注）；
  批次材料 / 状态行 / 逐批流水不并（§6）。
