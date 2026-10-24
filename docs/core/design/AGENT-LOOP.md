# agent 主循环与子代理（AGENT-LOOP）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**：机制 / 契约的实质描述 · 关键决策（§7）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策）。
> **拆分面**：§6.7–§6.12 拆出——**节号沿用**（全仓既有指针只改档名、不改节号）。
> 现住档：`docs/core/design/AGENT-LOOP-SUBAGENT.md`（§6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28）·
> `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.8 · §6.10 · §6.11 · §6.18 · §6.19 · §6.20）· `docs/core/design/AGENT-LOOP-UPSTREAM.md`（§6.27 全族）；本档续 §6.1–§6.6 + §6.13–§6.17。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 主循环 | `thincoder-core/agent.mjs`（编排——`beginRun → runTurnLoop → finalizeAgentTurn`）+ `thincoder-core/agent/run-start.mjs` · `agent/turn-loop.mjs` · `agent/chat-call.mjs` | 同名（同路径对） |
| 装配 / 提醒 / 收尾 | `thincoder-core/agent/assemble.mjs` · `thincoder-core/agent/setup.mjs` · `setup-reminders.mjs` · `run-stages.mjs` · `post-turn.mjs` · `dispatch.mjs` · `completion.mjs` · `record-results.mjs` · `relay-prefix.mjs` · `thincoder-core/agent/helpers.mjs` · `spawn-child.mjs` · `child-marks.mjs` | `src/agent/*`（拆档：`execute-tools` · `tool-gates` · `run-helpers` · `context-injections` · `agent-state`） |
| 子代理 / 异步 | `src/agent-tools/{subagent-scheduler,subagent,subagent-actions,subagent-async,subagent-run,async-settle,subagent-spawn,escalate-async}.mjs` | 同名 / 拆分档 |
| 挂起与唤醒 | `thincoder-cli/src/tui/suspension-drive.mjs` | `thincoder-vscode/src/extension/suspension.mjs` |
| 权限 | `thincoder-cli/src/cli/permission.mjs` | `src/extension/permission-gate.mjs` · `agent-tools/child-permission.mjs` |
| hooks | `src/hooks.mjs` | 核 `hooks.mjs`（静态引——Stop + 派发四事件已接线；见 §6.13 / §6.18） |
| 工作区约定（技能 / 规则 / 同伴 / 台账） | —（另档） | → `docs/core/design/WORKSPACE.md` |
| 推理档位 / 模型引用 | `src/auto-think.mjs` · `model-ref.mjs` | `src/extension/reasoning-mode.mjs` · `src/config.mjs`（模型引用解析段） |
| 探索蒸馏 | `thincoder-core/explore-distill.mjs` | 同名（同路径对） |
| token 台账 | `src/agent-tools/design-token.mjs` · `src/token-ttl.mjs` | `src/agent/agent-state.mjs` · `agent/tool-gates.mjs` |

## 2. 核模块裁决行

### 2.1 同路径对

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 76 | `explore-distill.mjs` | 同路径 | 0.5247 · 异 | ② | 进核 | 融合：取一侧 + 截断取 VSC 的 UTF-16 安全切片〔现体 = 会话续写（单源构造 `buildCompressMessages`——核 `thincoder-core/explore-distill.mjs:98-100`）〕 | 分叉 ＝ 截断实现（CLI 裸 slice `thincoder-core/explore-distill.mjs:80` / VSC `safeSliceUTF16` `:82`）+ 就地改写 vs 返回新值；前提 ＝ 无 | — | S1（建核补齐） |
| 78 | `agent.mjs` | 同路径 | 0.0883 · 异 | ③ | 进核 | 以 CLI 为准（主循环本体）+ VSC 的 onToken 三态门 / 帧回调 / 空响应内联重试并入 | 分叉 ＝ 分层方式 + **一处配置面缺口**（`agent.streamRules` 在 VSC 全仓零消费方——VSC `src/**` 0 命中；CLI `thincoder-core/agent.mjs:237`）+ 中断时入历史的工具结果不同（CLI 丢弃 + 占位 `:387` / VSC 保留真实结果 VSC `thincoder-vscode/src/agent.mjs:342-350`） | **①②** | S1（建核补齐） |
| 94 | `agent-tools/subagent-scheduler.mjs` | 同路径 | 0.1914 · 异 | ② | 进核 | 融合：取 CLI 队列实现 + VSC 的跨 `runAgent` 存活载体面按核内结构归一 | 分叉 ＝ 队列载体（CLI 独立数组 / VSC 池 Map 插入序）与 AUTO 判定取词；域上限、依赖语义、位置计算同规格 | — | S1（建核补齐） |
| 98 | `agent-tools/async-settle.mjs` | 同路径 | 0.0819 · 异 | ② | 进核 | 融合：取 CLI（中止守卫 + 取消提醒落点 + `TURN_CAP_MARK` 常量）+ VSC 的 interrupt 豁免面按端注入 | 分叉 ＝ 载体 / 守卫口径 / 提醒落点 / 事件名（`advisor:done` vs `child:done`）+ VSC 把 turn cap 文案写成字面量（`src/agent-tools/async-settle.mjs:143`）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 99 | `agent-tools/subagent.mjs` | 同路径 | 0.0447 · 异 | ③ | 进核 | 以 CLI 为准（含 `panel` 动作）+ VSC 无 panel 属**有意端差**（其载荷面在 VSC 不存在 ⇒ ④ 段以注入剔除） | 分叉 ＝ 动作枚举（CLI 八动作 / VSC 七动作、有意无 `panel` `src/agent-tools/subagent-spec.mjs:11-12`〔现体 = `thincoder-core/agent-tools/subagent.mjs`〕）；前提（`panel` 依赖 CLI TUI 展示面）仍成立 ⇒ ④ 段 | **①** | S1（建核补齐） |
| 100 | `agent-tools/subagent-actions.mjs` | 同路径 | 0.0407 · 异 | ② | 进核 | 融合：动作执行器按核内单一切分归位（含 `cancel` 归属） | 分叉 ＝ 纯文件分工（CLI 的 `cancel` 在 `subagent-async.mjs` / VSC 在 `subagent-actions.mjs`）+ VSC 的 advisor 评审取消路由；`status`/`observe`/`send` 语义同规格 | — | S1（建核补齐） |
| 101 | `agent-tools/advisor-async.mjs` | 同路径 | 0.0378 · 异 | ② | 进核 | 融合：取 CLI 拆分（settle 记账 / token 组外提）+ VSC 的会话槽台账写入面归位 | 分叉 ＝ 拆分粒度与落盘路径（CLI 走 token 清理 + slot 权威台账模块 / VSC 直写 slot）；容量拒超 / 取消 / 陈旧判定同规格 | — | S1（建核补齐） |
| 102 | `agent-tools/subagent-async.mjs` | 同路径 | 0.0204 · 异 | ② | 进核 | 融合：异步机械按核内单一切分归位（含 §18 审计门 / `collectSettledAsync` 落点） | 分叉 ＝ 切法不同（CLI 的 `cancel` 执行器在此 / VSC 在 `subagent-actions`；VSC 审计门与 collect 留此档）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 103 | `agent-tools/subagent-run.mjs` | 同路径 | 0.0135 · 异 | ② | 进核 | 融合：**同名不同物**——两端两份能力**分别**归位（CLI = 异步 spawn 执行器；VSC = 子代理 `runAgent` 闭环） | 分叉 ＝ 文件名复用而实体不同（CLI `executeAsyncSpawn` `thincoder-core/agent-tools/subagent-run.mjs:55-223` / VSC `runChild` `:18-205`）；核内分别落位（CLI 侧对应 VSC `subagent-async.mjs` 的 `spawnAsyncSubagent`） | — | S1（建核补齐） |
| 111 | `thincoder-core/agent/run-stages.mjs` | 同路径 | 0.0709 · 异 | ③ | 进核 | 以 CLI 为准（Stop 钩子 + 收尾编排）+ VSC 的 guard 推回 / 蒸馏发射面按核内结构归位 | 分叉 ＝ 文件职责划分 + 两处行为（CLI 跑 Stop 钩子 `thincoder-core/agent/run-stages.mjs:157-166`、VSC 全仓零 `runHooks`（现由核 `runAgent` 自动获得，见本档 §6.13 / §6.18）；中止时 CLI 清空子代理池 `:168-169` / VSC 只清已死（**中止清池 → 只清已死 + 墓碑 + 一条整批提醒，见 `AGENT-LOOP-ASYNC-POOL.md` §6.20**） | **①** | S1（建核补齐） |
| 112 | `thincoder-core/agent/setup.mjs` | 同路径 | 0.0532 · 异 | ③ | 进核 | 以 CLI 为准（装配顺序与注入块）+ 端差注入：VSC 编辑器上下文 / 按模型能力的 `read_image` / 每轮惰性 MCP 扩工具 | 分叉 ＝ VSC 拆 `context-injections.mjs` + 三处挂载条件不同（`read_image` 按多模态 `thincoder-core/tools/index.mjs:53`；`settings` 只挂 depth0 `:141`；召回限 depth0 且 `!autoTurn`）；前提（两端同装配面）成立 | **①** | S1（建核补齐） |
| 113 | `thincoder-core/agent/setup-reminders.mjs` | 同路径 | 0.0453 · 异 | ② | 进核 | 融合：取并集 + VSC 编辑器上下文 / 贴图指引按端注入（④ 段） | 分叉 ＝ VSC 独有两条注入（编辑器上下文 · 贴图指引 `thincoder-vscode/src/agent/setup-reminders.mjs:216-223`）+ 提示语同套；前提（贴图依赖宿主）仍成立 | — | S1（建核补齐） |

### 2.2 语义对位遍行（同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 149 | `src/agent/dispatch.mjs` ↔ `src/agent/execute-tools.mjs` + `src/agent/tool-gates.mjs` | ② | 融合：两阶段执行 + 前置门禁按核内结构归位 | 分叉 ＝ 拆分（VSC 拆 tools / gates —— `tool-gates.mjs:2-6` 自述「自 execute-tools.mjs verbatim 迁出——零语义」）⇒ 前提成立 | — | S1（建核补齐） |
| 150 | `thincoder-core/agent/helpers.mjs` ↔ `src/agent/run-helpers.mjs` | ② | 融合：核内单一工具函数面 | 分叉 ＝ 档名（helpers / run-helpers）；VSC `context-injections.mjs:11` 自述「CLI 对位 `thincoder-core/agent/helpers.mjs:275-348`」⇒ 前提成立 | — | S1（建核补齐） |
| 151 | `src/agent/post-turn.mjs` ↔ `thincoder-vscode/src/agent/setup-reminders.mjs` + `agent.mjs`（内联） | ② | 融合：回合后记账（计时器 / 提醒 / 停滞检测 / goal 追踪）按核内结构归位 | 分叉 ＝ 落点（VSC 住 setup-reminders / 主循环内联——`thincoder-vscode/src/agent.mjs:351` 自述「ported from CLI post-turn」）⇒ 前提成立 | — | S1（建核补齐） |
| 152 | `src/agent/spawn-child.mjs` ↔ `src/agent-tools/subagent-run.mjs` | ② | 融合：子运行器按核内结构归位（含 `_capturedOutput` 额度面） | 分叉 ＝ 文件名复用而实体不同（VSC 该档 = `runChild` 闭环 `:18-205`）；**承 §2.5 #103** | —（承 #103） | S1（建核补齐） |
| 153 | `src/agent/completion.mjs` · `record-results.mjs` · `relay-prefix.mjs` ↔ 核内（VSC 内联） | ② | 融合：按核内结构归位（完成守卫 / 结果提交与记账 / 前缀续写切片） | 分叉 ＝ 拆档（VSC 内联于主循环）；守卫语义两端同（`completion.mjs` 三守卫 / 配对关闭 / UTF-16 安全切片）⇒ 前提成立 | — | S1（建核补齐） |
| 154 | `src/agent-tools/design-token.mjs` + `src/token-ttl.mjs` ↔ `src/agent/agent-state.mjs` + `src/agent/tool-gates.mjs` | ② | 融合：token TTL / 会话槽台账按核内结构归位 | 分叉 ＝ 落点（CLI 独立档 / VSC 住 agent-state · tool-gates）；两端同 token 格式（`uuid:expiresAt`）与 fail-closed 口径 ⇒ 前提成立 | — | S1（建核补齐） |
| 155 | `src/agent-tools/escalate-async.mjs` ↔ `src/agent-tools/subagent-escalate-async.mjs` + `subagent-escalate.mjs` | ② | 融合：异步飞刀引擎按核内结构归位 | 分叉 ＝ 档名与拆分（VSC 拆 sync / async 两档）；同池（「other」域）/ 同 ack 形态 ⇒ 前提成立（VSC 两档现体 = `thincoder-core/agent-tools/escalate-async.mjs` + `subagent-actions.mjs`） | — | S1（建核补齐） |
| 156 | `src/agent-tools/recent-changes.mjs` ↔ `src/agent-tools/recent_changes.mjs`（核内单源） | ② | 融合：取一侧（工具名 `recent_changes` 两端同） | 分叉 ＝ 档名连字符 / 下划线 + `readonly` 标记；工具语义同（本轮已读）⇒ 前提成立 | — | S1（建核补齐） |
| 157 | `src/agent-tools/subagent-spawn.mjs` ↔ `src/agent-tools/subagent-spawn-gate.mjs` | ② | 融合：spawn 门禁按核内结构归位 | 分叉 ＝ 档名与拆分；VSC `:136` 自述「CLI 同构面；CLI 执行器在 agent-tools/subagent-spawn.mjs」⇒ 前提成立 | — | S1（建核补齐） |
| 158 | `src/agent-tools/advisor-settle.mjs` ↔ 核内（VSC 侧住 `advisor-async.mjs`） | ② | 融合：advisor settle 记账 / 变更日志 / 陈旧判定按核内结构归位 | 分叉 ＝ 拆档（VSC 未拆；**同路径对 #101 的另一半**）⇒ 随 #101 处置 | —（承 #101） | S1（建核补齐） |
| 165 | `thincoder-cli/src/cli/permission.mjs` ↔ `src/extension/permission-gate.mjs` | ② | 融合：权限闸按核内结构归位 + 展示面按端注入 | 分叉 ＝ 目录与展示形态（TUI 卡 / webview 卡）；闸语义（每回合 `autoApprove` 快照 + 中途 live 标志）同 ⇒ 前提成立 | — | S1（建核补齐） |
| 166 | （CLI 无独立档）↔ `src/agent-tools/child-permission.mjs` | ② | 融合：子代理权限通道按核内结构归位（父卡归属 + 定向 signal） | 分叉 ＝ 拆档（VSC 独有拆面）；**承 §2.5 #112（装配）/ §2.12.1 事件语义面** | —（承 #112） | S1（建核补齐） |
| 169 | `src/hooks.mjs` ↔ 核内（VSC 侧接线） | ③ | 以 CLI 为准（Stop 等四事件）——VSC 接线后开始触发（外部副作用登记） | 分叉 ＝ **已消**（端侧接线：Stop + 派发面三调用点 + `hooks` 配置段 plumb；见本档 §6.13 / §6.18）；**承 §2.5 #111** | —（承 #111） | S1（建核补齐） |
| 175 | `src/auto-think.mjs` ↔ `src/extension/reasoning-mode.mjs` | ② | 融合：核内自动难度分级 + 端侧推理档位面——**端侧自有 · 经 provider 字段数据面**（UI 下拉 / 档位 patch；核内无需位——裁定） | 分叉 ＝ 落点（CLI 自动难度分级 / VSC UI→provider 字段映射）；VSC DEFAULTS 已载 `autoThink`（`thincoder-vscode/src/config-io.mjs:319`）但**全仓无消费方** ⇒ 归一后接线（默认 `false` ⇒ 默认无行为变化） | **②**（丁组 D2） | S1（建核补齐） |
| 176 | `src/model-ref.mjs` ↔ `src/config.mjs`（模型引用解析段）+ `specs.mjs` | ② | 融合：核内单一 `provider:model` 解析 | 分叉 ＝ 落点；解析口径（首冒号切分 / 双段非空 / 显式 `p:m` 一律放行）两端同源 ⇒ 前提成立 | — | S1（建核补齐） |
| 184 | `thincoder-vscode/src/extension/suspension.mjs` ↔ `thincoder-cli/src/tui/suspension-drive.mjs` | ② | 融合：挂起 / 唤醒机制按核内结构归位（池载体按端注入） | 分叉 ＝ 目录（CLI 住 `tui/`）；VSC 头注自述「与 CLI 的结构差异（同语义移植）」⇒ 前提成立 ⇒ **已收编：核 `startSuspension` 单源、三端消费，端差只在装配面（见本档 §2.3）** | — | S1（建核补齐） |

### 2.3 #184 挂起 / 唤醒——核内形态（设计定案）

**回指**：#184（§2.2——「融合：挂起 / 唤醒机制按核内结构归位（池载体按端注入）」）。
**现状**：CLI 面住 `thincoder-cli/src/tui/suspension-drive.mjs`（**211 行**——核 `startSuspension` 装配 + 壳）；VSC 面住 `thincoder-vscode/src/extension/suspension.mjs`（**291 行**——核驱动装配面 + 会话外壳；核驱动动态装载——契约②）。
两面语义同源（挂起状态机：池 live → 挂起；用户输入优先 → 消化轮 → 池空退出）、差异面 = **载体**与**呈现** ⇒ 按「机制归核 + 注入面」落核（非机械随迁——故 S1 报告列为未完成面）。

**核内模块**：`thincoder-core/agent/suspension.mjs`（新档 · **297 行** · ≤500 软线）。
内容 = 挂起状态机：池 live 判据 · 竞态清扫（settle 未及移交 → pending）· 主循环（用户输入优先 → pending 消化轮 → 池空退出 → 等待 settle / 唤醒）· 消化轮驱动 · 唤醒栓 · 退出清场（abort = 清池不注入 / idle = 残余直注入）。**核内零文案、零渲染、零端名分支**（契约 5 / 10）。

**现态**：**挂起面单源 = 核驱动（三端消费）**——CLI ∕ VSC ∕ desktop 皆以 `startSuspension` 为唯一驱动，端差只在装配面（carrier ∕ hooks ∕ 输入缝）。

**接口**：`startSuspension(ctx)` 同步返回句柄 `{ pushInput(msg) · wake() · done }`；宿主 `await handle.done` ⇒ `{ reason, residualInput }`（替代两端现行的 `state._suspWake` / `panel._suspWake` 共享字段单槽与 pendingInput 数组直写——宿主改持句柄引用）。

**注入面（池载体如何注入——ctx）**：

| seam | 内容 | CLI 装配（S2） | VSC 装配（S2） |
|---|---|---|---|
| `carrier` | 池 / pending / 标志载体对象——字段集 = 核内异步面现行口径（`_asyncSubagents` · `_asyncAdvisors` · `_consultSessions` · `_pendingAsyncResults` · `_suspended` · `_asyncQueue` · `_asyncAdvisorQueue` · `_asyncTombstones` · `_asyncWaiters` · `_advisorRuns` · `_mutLog` · `_childUpstream` · `_childUpstreamSeq` · `_unsettledDigests` · `_daSession`——见下「载体字段集与回写义务」） | 传 `agent`（现形——核内已迁异步面同持此形） | 传 depth-0 `history`（现形——池 / pending / 标志全挂 history） |
| `runTurn(text, opts)` | 回合执行器（digest = `{ autoTurn: true, text: "" }`） | 注入 `runAgentTurn` 包装（函数级静态环消失——驱动器不再 import `agent-turn`） | 注入 `entry.runTurn`（现形） |
| `abortSignal` | 会话中止信号（兜底监听） | `agent._sessionAbort.signal`（现形） | `susp.abort.signal`（现形） |
| `hooks.onCounts(counts)` | 计数变化通知（`{ running, queued, pending, done }`） | 组合状态行文本 + `render()` + 1s tick 重绘（现 `backgroundStatusText` + `setInterval`） | `suspension` 消息 + `_publishTurnState`（现 `postSuspension`——文案由 webview 按 locale 组合） |
| `hooks.onDigest(phase, counts)` | 消化轮边界（start / end） | `pushLine("[auto-turn: …]")` + `digest:*` 日志 | webview `{ type: "digest", status }`（现形） |
| `hooks.reclaim(consumed)` | 消化后块回收（不等池空） | `freezeReclaimDigestedBlocks`（`thincoder-cli/src/tui/subagent-blocks.mjs`） | `reclaimDigestedBlocks`（postMessage done——现形） |
| `hooks.freezeAll()` | 退出冻结（兜底残项） | `freezeAllSubTasks` + `sweepToolBlocks`（`thincoder-cli/src/tui/subagent-blocks.mjs` · `thincoder-cli/src/tui/tool-events.mjs`） | `postSuspensionEnd(panel, { freeze: true })`（现形） |
| 唤醒 / 入槽 | `handle.pushInput(msg)` + `handle.wake()` | Enter → `pushInput`；Ctrl+C → 中止 | `routeUserTurn` busy ⇒ 队列受理（容量 8——会话在飞 = `_chat` 队列 ∥ 无会话 = `_busyQueued`）+ `_chat` → `pushInput`（现形） |
| 退出回执 | `{ reason: "idle" \| "aborted", residualInput }` | abort 残余 → `state.queue` + 提示行（现形） | abort 残余 → 退出后以普通回合消费（现形） |

**载体字段集与回写义务**：

- **字段集**（核内异步面现行口径）= `_asyncSubagents` · `_asyncAdvisors` · `_consultSessions` · `_pendingAsyncResults` · `_suspended` ·
  **`_asyncQueue`**（排队容器）· **`_asyncAdvisorQueue`**（评审排队容器）· **`_asyncTombstones`**（终态墓碑）·
  **`_asyncWaiters`**（唤醒栓注册表）· **`_advisorRuns`**（评审实例注册表）· **`_mutLog`**（变更日志——VSC 对位名 `_fileMutEvents`）·
  **`_childUpstream`**（子→父在飞消息队列——§6.27 上行通道）· **`_childUpstreamSeq`**（其单调计数）——§6.27 上行通道；**`_unsettledDigests`**（升级账本——Map；机制 = `AGENT-LOOP-ASYNC-POOL.md` §6.31）
  · **`_daSession`**（会话标记——布尔；挂起会话期 true / 退出置 false，读以 `=== true` 判；机制 = 同档 §6.31.2）。
  容器类型：三池 / 墓碑 / 评审实例注册表 = `Map`，队列 / pending / 唤醒栓注册表 / 变更日志 = 数组，`_suspended` / `_daSession` = 布尔。
  **全集结论**：**15 款**即全集——补两款 = `_childUpstream` / `_childUpstreamSeq`
  （§6.27 上行通道）；新增款 `_asyncAdvisorQueue`（评审排队容器——与 `_asyncQueue` 同列，两端写侧同形）。
  核实证据 = `thincoder-core/agent-tools/advisor-async.mjs:454-455`（写 enqueue + position）/ `:298`·`:311`·`:331`（读——三处 `carrierField` 出队 ∕ 剔除 ∕ 补位径）。
  **全集明细**：**15 款**——＋`_unsettledDigests`（升级账本——见上行；读面 = `subagent action:'status'` 的 `unsettled` 段）＋`_daSession`（会话标记——挂起会话期 true / 退出置 false；区分「会话内」与「fallback 面」的唯一判据）——机制 = `AGENT-LOOP-ASYNC-POOL.md` §6.31。
  清单外注：`_lastRunOutput`（run 内落痕——起跑清位 / 收尾取件）不入本集——机制 = 同档 §6.31.5。
- **回写义务（谁写 · 何时写）**：容器类字段（三池 / 队列 / pending / 墓碑 / 唤醒栓注册表 / 评审实例注册表 / 变更日志）的新建 / 借用**只在首次使用的核内单点发生**，并与首次使用**同步**（先落容器后使用——无「已使用未回写」窗口）；写入落**父对象字段**，且须使容器经 `carrierField(parent, 字段)` 与 `parent[字段]` 两条读取路径命中**同一容器**（不另起分叉）。
  - **借用规则**：父对象缺而载体（`history`）有 ⇒ **借用同一容器**（不另建）；两处皆无 ⇒ 就地新建。已按「借用 / 新建」落核的单点：
    pending = `parkAsyncPending`（`thincoder-core/agent-tools/async-settle.mjs:127-133`）· 墓碑 = `writeTombstone`（同档 `:61-72`）· 上行队列 = `upstreamHolder`（`thincoder-core/agent-tools/parent-channel.mjs:67-80`——父字段优先 / 载体命中即借用 / 皆无则建在父字段 + 载体别名）。
  - **唤醒栓注册表三处操作**（`_asyncWaiters`）：注册 = `thincoder-core/agent/suspension.mjs:133`（进入等待即 `carrier._asyncWaiters ??= []` + `push(onSettle)`——首用单点、同步落容器）· 摘除 = 同档 `:121-122`（cleanup `indexOf` / `splice`）。
    兑现 = **核单点 `wakeAsyncWaiters(parent)`**（`thincoder-core/agent-tools/async-settle.mjs`——`splice(0)` 全量唤醒并清空；**两处调用** = settle 公共尾 `:281` +
      上行 ask 入队尾〔`agent-tools/parent-channel.mjs`——2026-09-19 F-UC7 批，见 `AGENT-LOOP-UPSTREAM.md` §6.27.12〕）——`carrier._asyncWaiters`（挂起侧）与 `parent._asyncWaiters`（结算侧）两径经绑定不变式命中同一容器。
      （**实现已落地**：`agent-tools/async-settle.mjs:296-299` 定义（settle 公共尾 `:281` 改调同函数）+ `agent-tools/parent-channel.mjs:115` ask 入队尾唤醒；父侧直接执行 · 可 revert）
  - **评审实例注册表**（`_advisorRuns`——`Map`）：读取（不建）= `thincoder-core/agent-tools/advisor-async.mjs:75-78`（经 `carrierField`）；首用单点（建）= 同档 `:80-90`（无既有容器时创建，落 `agent.history ?? agent`——有载体直接落载体、无则落父对象字段；与首次使用同步）。
    重置写点 = `thincoder-core/agent-tools/eng.mjs:62` / `:93`（模式切换重建空 Map 落父对象字段——**勘定（VSC 形）**：替换写不触载体，重置的跨 run 保持 = S2 装配对位登记项；坐标实读 2026-10-04）。
    形态钉于核测 = `thincoder-core/test/advisor-consult-merge.test.mjs:29-56`（有载体 ⇒ 建在载体上、不在父对象旁建第二份；父对象自有 ⇒ 父对象优先）；VSC 侧现体 = 核 `thincoder-core/agent-tools/advisor-async.mjs`（同经 `carrierField`）。
  - **变更日志**（`_mutLog`——数组 · ≤200 环；**VSC 对位名 `_fileMutEvents`——名差登记**）：书写点 = `thincoder-core/agent-tools/advisor-settle.mjs:42-49`（`noteMutations`——`agent._mutLog ??= []` 同步落父对象字段）；读点 = 同档 `:58`（陈旧判定）· `thincoder-core/agent-tools/escalate-async.mjs:47`（飞行重叠判定）。
    调用面 = `thincoder-core/agent/dispatch.mjs:129`（回合写执行成功即记账）· `thincoder-core/agent-tools/subagent-async.mjs:424`（子代理合入）；VSC 侧现体 = 核 `thincoder-core/agent-tools/advisor-settle.mjs:42-49`（写）· `:58`（读）。
  - **队列 / 三池 / 唤醒栓注册表 / 变更日志的新建点均无借用步**：`thincoder-core/agent-tools/subagent-run.mjs:51-52` · `thincoder-core/agent-tools/escalate-async.mjs:149-150` ·
    `thincoder-core/agent-tools/advisor-async.mjs:268` · `thincoder-core/agent-tools/consult.mjs:417` · `thincoder-core/agent/suspension.mjs:133` · `thincoder-core/agent-tools/advisor-settle.mjs:46`（`??=` 形态）——绑定不变式下不可观测（勘定注）。
- **VSC 跨 run 存活面 = 端装配绑定不变式**（S2 装配义务——`_asyncQueue` / `_asyncAdvisorQueue` / `_asyncTombstones` / `_asyncWaiters` / `_advisorRuns` / `_mutLog` 同列）：run 起始对**全部 15 字段**成立
   （VSC 端壳载体表 `thincoder-vscode/src/extension/panel-turn-loop.mjs:79`——**现读 = 16 款**（＋`_unsettledDigests` ∕ `_daSession`）；细则见 `AGENT-LOOP-UPSTREAM.md` §6.27.12.12）
   （父侧直接执行 · 可 revert）——`history` 有容器 ⇒ 绑到 `agent` 字段；`history` 缺 ⇒ **先在 `history` 侧补建**再绑（新建回写载体的落点——否则新建落 per-run `agent`、跨 run 断裂）。
- **验收**：见验收点 2 扩展（「不预置载体字段」夹具——机制须自建容器、同组断言与预置形同值）。
- **guard 载体（相邻面 · 非本表字段集）**：auto-turn guard 的 7 键标记集与快照 / 回填 = **核单点**（`thincoder-core/agent/helpers.mjs`——`INHERITED_GUARD_KEYS` / `snapshotGuard` / `restoreGuard`）；**载体留端**（核 = `agent._inheritedGuard` 字段 · 端壳 = 宿主容器 `panel._guardCarry`）。本表 15 款 = 挂起载体字段集，与 guard 键集两不相交。

**端特有面（④ 段——不归核）**：

1. CLI：状态行文本与 1s tick 重绘 · `[auto-turn: …]` 提示行 · Enter / Ctrl+C 键位路由 · 中止残余转 `state.queue` 的处置与提示行 · TUI 块冻结 / 回收（`thincoder-cli/src/tui/subagent-blocks.mjs` · `thincoder-cli/src/tui/tool-events.mjs` 面）。
2. VSC：`suspension` / `digest` 消息族与 counts 广播 · 文案由 webview 按 locale 组合 · `routeUserTurn` busy 队列受理（容量 8——吞面收敛四；满队（第 9 条）拒 + 提示 + 文本保留——`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）+ loading 锁 · 面板生命周期（dispose 统一中止——`abortControllers` 快照）· webview 块归档回收 · 退出后残余以普通回合消费。
3. 共同（端差随核内异步面归一后消失）：`_suspended` 标志的读取方（settle 分流）住核内异步面——载体归一后零端差。

**验收点（S1 续轮）**：

1. 落核 + 核测试状态机用例（假 carrier / 假 runTurn / 假 hooks 纯 Node 驱动——不加载端模块，T-C4 / N3）：池空直退 · pending 触发消化轮 · 用户输入优先 · abort 清池不注入 · idle 残余注入 · 唤醒栓双路（settle / wake）。
2. **载体双夹具**：CLI 形（`agent` 字段对象）与 VSC 形（`history` 字段对象）各跑同组断言——证明「池载体按端注入」成立（机制对载体零预设，除上表字段集）；**并各补一组「不预置载体字段」夹具**（池 / 队列 / pending / 墓碑 / 唤醒栓注册表 / 评审实例注册表 / 变更日志 / 上行队列全空缺——字段集 15 款全无预置）：机制须**自建容器**且同组断言与预置形同值（防「两端各自预置才碰巧能跑」——见上「载体字段集与回写义务」）。
3. 核内零端名分支 / 零文案：`suspension.mjs` 无产品名、无状态行文案字面量（grep 零命中——契约 5 / 10）；零 TUI / 宿主依赖（N3——既有 `core-hygiene` 机检覆盖）。
4. **依赖顺序（硬）**：本行与异步机械族的 VSC 侧融合（#98 / #101 / #154 等——清扫 / 计数读法 = 核内异步面单一实现的下游）同批或先后紧邻；先定异步面载体口径，再落本行（池队列表示随 #94 融合收敛——本行不重复裁决）。
5. 行为面：核内零消费方阶段只测内核；S2 接线后按面内裁决口径验收（A10）；**S1 段两产品一行不改**（T-C12）。**驱动面单源**（收编后现态）——挂起面单源 = 核驱动（三端消费）：CLI ∕ VSC ∕ desktop 皆以 `startSuspension` 为唯一驱动，端差只在装配面（carrier ∕ hooks ∕ 输入缝）。

## 3. 须用户裁条目

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A7 | `agent.mjs`（#78） | ①② | 读 `config.agent.streamRules` 传给模型（`thincoder-core/agent/chat-call.mjs:35`）；中断时丢弃工具结果并写占位（`:387`） | `streamRules` **全仓零消费方**（VSC `src/**` 0 命中，本端 PARITY 批亦登记为缺口）；中断时保留真实工具结果（`thincoder-vscode/src/agent.mjs:342-350`） | 以 CLI 为准（主循环本体）+ VSC 的 onToken 三态门 / 帧回调 / 空响应重试并入 | ① CLI 能配的流规则在 VSC 不生效（现状）⇒ 归一后生效；② 中断时模型所见的历史内容不同 | **已裁 · 按建议** |
| A15 | `agent-tools/subagent.mjs`（#99） | ① | 八动作（含 `panel`） | 七动作——**有意无 `panel`**（`subagent-spec.mjs:11-12`，其载荷面在 VSC 不存在） | 以 CLI 为准（保留 `panel`）+ VSC 端按端差**不注入**该动作 | ① VSC 的 `subagent` 动作集不变（`panel` 仍无）；CLI 不变——本行只登记端差合法性与注入位 | **已裁 · 按建议** |
| A22 | `thincoder-core/agent/setup.mjs`（#112） | ① | 每轮装配全内联；`read_image` **恒在**注册表；子代理继承含 `settings` 的工具集；文档 / 记忆召回只受 `!resume` 约束（未按 depth 门控） | 拆 `context-injections.mjs`；`read_image` 仅当模型多模态（`:199`）；`settings` 只挂 depth0（`:141`）；召回限 depth0 且 `!autoTurn`；每轮惰性把 MCP 扩成原生工具 | 以 CLI 为准（装配顺序与注入块）+ 端差注入（编辑器上下文 · 按模型能力的 `read_image` · MCP 扩工具时机） | ① VSC 非多模态模型仍没有 `read_image`（端能力，保留）；② 子代理的 `settings` 工具与记忆召回门控归属（CLI 子代理上下文更肥 vs VSC 更瘦） | **已裁 · 按建议** |
| A23 | `thincoder-core/agent/run-stages.mjs`（#111） | ① | 收尾跑 **Stop 钩子**（`:131-140`）；中止时**直接清空**异步子代理池与评审池（`:168-169`——**中止清池 → 只清已死 + 墓碑 + 一条整批提醒，见 `AGENT-LOOP-ASYNC-POOL.md` §6.20**） | **全仓零 `runHooks`**（无 Stop 钩子）——**已接线**（端侧 Stop 钩子 + 派发面三调用点；见本档 §6.13 / §6.18）；中止时只清**已死**条目（`:296-297,312-313`） | 以 CLI 为准（Stop 钩子 + 收尾编排）+ VSC 的 guard 推回 / 蒸馏发射面按核内结构归位 | ① 归一后 VSC 侧是否开始触发 Stop 钩子（外部副作用）；② 按中断时后台子代理是「被清」还是「被留」⇒ 结果可见差异 | **已裁 · 按建议** |

**未并入项登记（A7 / #78）**：VSC 的「仅 reasoning ⇒ 视为 content」分支（无 tool calls ∧ `content` 空 ∧ `reasoning` 非空 ⇒ 以 reasoning 填 content——`thincoder-vscode/src/agent.mjs:269-290` 内 `:271-273`）**未并入核内**（核内对应面 = `thincoder-core/agent/completion.mjs:31` 空响应重试径——无该分支）。
原 A7 归一形态清单未列此项、建核亦未并入 ⇒ **非偏离**；登记为**未并入项结论**（后续处置待定）。

### 3.2 丁组（S0b 语义对位遍新增）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| D2 | `src/auto-think.mjs` ↔ `src/extension/reasoning-mode.mjs`（§2.5 #175） | ② | 自动难度分级 → 推理档位（`config.agent.autoThink` 为开关，CLI 有消费方） | VSC DEFAULTS **已载** `autoThink`（`thincoder-vscode/src/config-io.mjs:319`）但**全仓零消费方** ⇒ 该键在 VSC 是**死键** | **建议（方向唯一）**：核内实现 + VSC 接线（死键恢复语义）；默认 `false` ⇒ **默认无行为变化**；面板推理档位面**端侧自有 · 经 provider 字段数据面**（核内无需位——裁定） | ① 在 VSC 显式设过 `autoThink: true` 的用户：该键从「无效」变「生效」（行为变化，但 = 恢复 CLI parity 的既定语义）；② 默认配置下无变化 | **已裁 · 按建议** |

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**（对外事件面的兼容策略模板住 `CORE-UNIFICATION.md` §2.12.1「事件语义」类；行为面变更见上文各行「影响面」列）。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）** · **对外契约兼容面（S0 登记 / S2 落地）**。
**核内落点行数** → §2.8.1「核内逐档行数与拆分计划」（本子系统面：`thincoder-core/permission.mjs`（#165）· `thincoder-core/undo-stack.mjs`（#149））。


## 6. 机制面

> **本节内容**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **坐标口径**：机制实现面住 `thincoder-core/**`，CLI 树留壳体面 `thincoder-cli/src/**`；符号名与档路径为契约面。
> 核主循环面分档（`agent/run-start.mjs` ∕ `agent/turn-loop.mjs` ∕ `agent/chat-call.mjs`；`agent.mjs` = 105 行编排面）。
> **§6.7–§6.12 已拆出** → `docs/core/design/AGENT-LOOP-SUBAGENT.md` · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` · `docs/core/design/AGENT-LOOP-UPSTREAM.md`（节号沿用）；本档续 §6.1–§6.6 + §6.13–§6.17。

### 6.1 模块地图（职责面）

| 模块 | 职责 |
|---|---|
| `thincoder-core/agent.mjs` | `runAgent` 编排面：`beginRun` → 回合环 → `finalizeAgentTurn`；状态工厂（`createAgent`）+ re-export 面（105 行） |
| `thincoder-core/agent/run-start.mjs` | 起跑前段（`beginRun`）：蒸馏等待 ∕ pendingAsync 注入 ∕ `_inAutoTurn` ∕ prepareRun 调用 ∕ per-run 复位块 ∕ auto-turn 域文本（自 `agent.mjs` 拆出） |
| `thincoder-core/agent/turn-loop.mjs` | 回合环（`runTurnLoop`）：循环头注入族 ∕ 压缩检查点 ∕ `_turnSeq` 帧 ∕ 工具批调度 ∕ 零落盘结账 + `ContinueError` |
| `thincoder-core/agent/chat-call.mjs` | 单回合模型调用（`callModelTurn`）+ `streamOutputAllowed` 流式门 |
| `thincoder-core/agent/assemble.mjs` | 会话装配序核单源：`assembleAgent`（配置 → 代理注入 → 记忆 / embedder → 文件规则 → 记忆层（项目 / 团队）→ 工具 → `toolsFinalize` 缝 → 代理 + 三字段）；`DEFAULT_DEPS`（八缺省缝）+ `teamConfig` / `gitAuthor` / `validateProvider`（端壳 adapter 消费：cwd / `_slot` / MCP / 校验调用） |
| `thincoder-core/agent/setup.mjs` | prepareRun：上下文注入（git / 目录 / 指令 / 记忆 / 文档 / outline）、system prompt 组装、阈值解析、角色工具面装配（改调家族单源 `family-tools.mjs`） |
| `family-tools.mjs`（新档——落 `thincoder-core/agent/`） | 家族矩阵单源：`assembleFamilyTools`——task/plan/timer 固定段 + depth 家族 / 角色段；端差经 `decorate` 注入（CLI 与 VSC 同调） |
| `thincoder-core/agent/dispatch.mjs` | `executeToolCalls`：两段调度（权限预审 → 顺序保序执行）、hooks、错误落盘、action 级门控、批权限合并 |
| `thincoder-core/agent/completion.mjs` | `handleCompletion`：零工具调用回合的 guard 链 |
| `thincoder-core/agent/post-turn.mjs` | 回合后注入：停滞检测、goal 预算预警 |
| `thincoder-core/agent/helpers.mjs` | 常量（turn 上限、结果落盘阈值）、`escapeXml`、`repairHistory`、`AUTO_REMINDER` 单源、git 上下文、目录树 |
| `thincoder-core/agent/record-results.mjs` | 工具结果提交 + 变更记账：tool 消息落盘、`FILE_MUTATORS` 失效链、`_touchedFiles` + `noteMutations` |
| `thincoder-core/agent/spawn-child.mjs` | 子代理统一管线：`makeRelay` / `wrapChildCallbacks` / `runWithContinue` / `ensureChildApiKey` / `clampEffort` / `⟦ev⟧` strip / 嵌套 done·stopped 补发射 |
| `thincoder-core/agent/child-marks.mjs` | 子代理报告文本锚点（`TURN_CAP_MARK` / `STOPPED_MARK`）**唯一定义**（零依赖叶——先例 `relay-prefix.mjs`；端壳静态导入面，W8 契约②）；`spawn-child.mjs:33` 原样再导出 ⇒ 既有 import 面零改 |
| `thincoder-core/agent/run-stages.mjs` | 回合阶段骨架 / abort 分支 / pending 单容器过滤 / `finalizeAgentTurn`（收尾单点） |
| `thincoder-core/agent/suspension.mjs` | 挂起 / 唤醒状态机（核内形态与载体契约见 §2.3） |
| `thincoder-core/auto-think.mjs` | 任务难度分类 → 自动设置 reasoning effort（opt-in）；分类调用先过**「可关思考」守卫**（不可关 ⇒ 跳过 + 一次可见警示）；失败一次可见——D-AL26 |
| `thincoder-core/agent-tools/subagent*.mjs` | subagent 工具：spawn / status / observe / send / escalate / cancel / panel 动作面、async 池、调度器、审计任务书；`subagent-panel.mjs` = 面板执行器 |
| `thincoder-core/agent-tools/async-settle.mjs` | async 结果容器统一共享 helper：`settleAsyncEntry` / `getAsyncPool` / `parkAsyncPending` / `parentAborted` 守卫 / `buildChildSignal` |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 任务调度器：`normalizeFileList` / `filesOverlap` / `depInfo` / `queueRunnable` / `assertNoDepCycle` / 停滞检测 |
| `thincoder-core/agent-tools/advisor*.mjs` | advisor 工具（async 面见 `AGENT-LOOP-ASYNC-POOL.md` §6.10） |
| `thincoder-cli/src/tui/**` | TUI 渲染 / 交互（CLI 壳体面——显示面细节另档） |

### 6.2 主循环（`runAgent`）与中断语义

```
runAgent(agent, input, callbacks, { depth, signal, maxTurns, resume, autoTurn, suspDriven, consumeQueuedInput })
```

**归位**：`runAgent` = 编排（`thincoder-core/agent.mjs`——`beginRun` → `try{ runTurnLoop }catch{…}finally{ finalizeAgentTurn }` + 状态工厂 + re-export 面）∥ 三段分档 =
起跑前段 → `thincoder-core/agent/run-start.mjs`（蒸馏等待 ∕ pendingAsync 注入 ∕ prepareRun 调用 ∕ per-run 复位块 ∕ auto-turn 域文本）；
回合环 → `thincoder-core/agent/turn-loop.mjs`（循环头注入族 ∕ 压缩点 ∕ `_turnSeq` 帧 ∕ 工具批 ∕ 零落盘结账 + `ContinueError`）；单回合模型调用 → `thincoder-core/agent/chat-call.mjs`（messages 组装 ∕ autoThink ∕ `chat()` ∕ AbortError-中断分支）。
签名逐字不动；下方步骤 / 循环头族 / 中断语义为机制描述（语义零变）。

1. **prepareRun**（§6.3）。
2. **非 resume 时重置 per-run 状态**（mutation / verify / advisor / touchedFiles / emptyRetries / compressFailures / autoThink；`_inheritedGuard` 例外）。
3. **turn 循环**（≤ `maxTurns`，默认 200；goal 模式 200；子代理 100）——每轮顺序：压缩检查（仅 `lastRole ∈ {user, tool}` 安全点）
   → plan-mode 提醒节流注入 + 工程模式状态注入 → autoThink 分类（turn 0 且配置开启）
   → `chat()`（流式；`onToken` / `onReasoning` / `onWait` 透传；`streamRules` 共享 `firedPatterns`）
   → 响应后处理（流规则 abort / warn · 用户中断 · usage 基线 · 异常 / 缺席 `finishReason` 提醒）
   → 有 toolCalls ⇒ `executeToolCalls`（§6.4）回喂重入；无 ⇒ `handleCompletion`（§6.5）→ done / continue。
4. **超 turn 上限 → 抛 `ContinueError`**（中止态除外——`signal.aborted` ⇒ 抛 `abortError`，不落 ContinueError）。续跑规则：`engineering && autoApprove → 自动 resume`，否则询问是否续跑。规则适用所有回合（depth-0 用户回合 / auto-turn / depth>0 子代理）。

**循环头（回合边界）注入族（三成员——同址、各自方向，互不干扰）**：每轮迭代开头（`chat()` 之前——核侧落点 = `thincoder-core/agent/turn-loop.mjs:87-93`）依次 —
① `consumeInjected?.(agent)`（父→子投递——spawn 方装的入向通道；depth>0）；② `drainChildUpstream(agent)`（子→父在飞消息——驱动面落交付轮轮首（§6.34）；`AGENT-LOOP-UPSTREAM.md` §6.27.4）；③ **`consumeQueuedInput`（用户→主会话投递——仅用户回合传参；机制 = `AGENT-LOOP-ASYNC-POOL.md` §6.8「步边界 pickup」）**。
三成员均**只在循环头触发**（在飞工具 / 在飞 LLM / 流式输出零触碰），写入均为 `pushReal` 普通 history 消息；③ 置族尾 ⇒ 真实用户消息恒为 history 尾（`injectTurnReminders` 的「新用户消息」cadence 判据落在它上）。
VSC 端壳自有 depth-0 循环同址（`thincoder-vscode/src/agent.mjs:197` 邻位——`opts.turnInput?.()` 消费段之后（`drainChildUpstream` 调用同段））。

**`autoTurn`（无输入回合——digest 用）**：`{ autoTurn: true }` = 不 push input + per-run 状态重置 + history 尾 = 已注入的 reminder user 消息；复用 resume 的「不 push input」机制，但不绑 `ContinueError` 语义。

**`resume` 保留集**：`_mutatedThisRun` / `_verifiedThisRun` / `_verifyRetries` / `_touchedFiles` / `_advisorRound` 保留（guard 连续性与收敛预算不被续跑重置）；`_emptyRetries` / `_compressFailures` 亦保留（跨 turn 计数，防刷）。

**中断语义（`AbortController` + `signal.reason`）**：

- `controller.abort()`——**二按全停**（Ctrl+C 武装化见 `AGENT-LOOP-ASYNC-POOL.md` §6.8）：chat 抛 AbortError → `runAgent` 直接上抛；
  回合收尾清池分支（`aborted && !interrupt` → **只清已死条目**——`discardAbortedPool(agent)` / `discardAbortedAdvisors(agent)`）：存活 / 已 settle 条目**留池**；
  死条目写 `discarded` 墓碑 + **一条整批提醒**（`subPool?.clear()` 式无条件清已废除——`AGENT-LOOP-ASYNC-POOL.md` §6.20）。
- `abort({ interrupt: true, message })`（Ctrl+I）：chat 中断 → 提交部分输出 + 注入 `[User interrupt: message]` → 抛 AbortError；调用面捕获后**重建 controller 续跑**（同一轮内继续，用户消息即时生效）。
- `abort({ interrupt: true })` 无 message（Ctrl+C 首按——停回合）：注入后**不续跑**。
- **工具执行期间中断**：先为已提交的 `tool_calls` 合成占位 tool 结果（`[Tool execution interrupted — results discarded]`——tool 消息必须紧跟 assistant `tool_calls`，否则 strict provider 重试轮 400），再注入中断消息后 continue。
- **中断清扫（回合收尾 finally）**：`freezeAllSubTasks` + `sweepToolBlocks`（未 done 工具载体标 done + interrupted、清 `_toolTicks`）——无 running 残留、无陈旧计时泄漏。
- **reason 词汇表扩展**：程序性取消 / 停止 / 定时器中止站点新增 `abortTrigger` 载荷形态（各既有判据点语义零改）——枚举与站点规则见 `AGENT-LOOP-SUBAGENT.md` §6.12。
- **环边界中止前置（#793）**：环头 ∥ 环尾两检查点查 `signal.aborted` ⇒ 抛 `abortError(signal, "agent", "turn-head" | "turn-tail")`——中止恒以 AbortError 收束：不开启新轮（环头注入族 / 压缩 / 模型调用零触）∥ 不落 ContinueError（撞帽分支不可达——用户 Stop 优先于继续提示：`docs/core/requirements/TURN-CAP-CONTINUE.md` F5）；
  Ctrl+I 续跑契约零变（外层按 `signal.reason` 换代续跑——`thincoder-core/agent/continue-decision.mjs`）。

### 6.3 装配与上下文注入（`prepareRun`）

按序注入（全部 `role: "user"` 机读消息；带 `transient` 标记者落盘时过滤）：

1. **git 上下文**（顶层 `depth === 0`）：分支、最近 5 条提交、未提交改动清单（非 git 仓库静默跳过）。**子代理一律不注入**（`AGENT-LOOP-SUBAGENT.md` §6.7.4）。
2. **目录树**（顶层）：`listWorkDir`（根 ≤30 项、子目录 ≤10 项，隐藏折叠，超限截断）。
3. **项目指令**：`AGENTS.md` / `CLAUDE.md` / `project_rules.md`（≤32K 字符，`<untrusted_project_instructions>` 包裹）。
4. **记忆检索**：`memory search` 前 3 条（`<untrusted_memory>` 包裹 + XML 转义）。
5. **文档检索**：`doc_search` 前 5 条 chunk（`<untrusted_doc_chunk>` 包裹）；**声明源会话 = 两侧分取配额**（本仓 ≤5 零减 + 声明源 ≤5 补位，上限 10——见下方配额段）。
6. **依赖大纲**：`repomap` 输出（`OUTLINE_INJECT_PREFIX`）。
7. **用户输入**（`pushReal`：双线）。
8. **多模态图像**（视觉模型：附加到首条 user 消息）。

**文档注入·声明源保底名额（需求 §4.17；实现 = `thincoder-core/agent/setup.mjs`）**：注入点按检索 origin 集分侧——
集 ≤1（无声明源）⇒ **原单调用路径逐字保留**（`docSearch(memory, input, { limit: 5 })`）；集 >1 ⇒ **两侧 `Promise.all` 并行**：
本仓侧 `origins: [normalizeOrigin(memory.codeOrigin)]` ∥ 声明侧 `origins: 集 − 本仓`，各 `DOC_SEARCH_LIMIT`（5），
合并序 = 本仓 ≤5 在前 + 声明 ≤5 补位（两侧 origin 集互斥 ⇒ 行不可能重复，无需去重）。
**保底语义 = 任一侧 top-5 齐**——单次调用的全局排序在候选池有界（`max(limit*4,20)`）下不可达（池全被一侧占据 ⇒ 另一侧不可达）；
块形 · `<untrusted_doc_chunk>` 包裹 · 300 字符预览 · `more` 计数行口径**逐字不变**（计数仍 = 全 origin 集）；`doc_search` 工具面 / depth-0 门 / 检索排序 ∥ origin 归一 ∥ 声明解析零改；无配置开关（F-DI1 边界）。
**成本（登记）**：声明源会话每回合查询向量计算 1 ⇒ 2 次（两侧各一）——嵌入 I/O 重叠（≈1 次嵌入量级）+ 本地 FTS ∕ 扫描 ×2（FTS 为同步 `.all()`、向量扫描行处理在单事件循环内串行）；
升级条件 = 单回合召回墙钟复测越线（`docs/core/design/MEMORY.md` §6.14 L-②-5 口径）⇒ 另裁共享查询向量形。
**F-DI3「来源可辨（路径已在块形内——保持）」按需求括注本身即确认**（现值满足——命中行为相对路径）；根名前缀增强形不落。

**system prompt 字节稳定（前缀缓存契约）**：**同一 agent 的相邻请求前缀逐字节相同**（= 缓存命中的操作条件）；
可入 system 的输入 = 在 agent 生命周期内逐字节稳定的那些——槽位装配（`base`）· 项目指令 · skills 清单 · **spawn 固块**（`AGENT-LOOP-SUBAGENT.md` §6.26）；
逐轮变化的记忆 / 文档 / git 注入一律走 user 上下文消息而非 system；`Session start` 时间戳每会话固定一次。有回归测试断言两次请求的 system 消息逐字节相等（同一 agent 面）。

### 6.4 工具调度与权限（`dispatch` 两段式）

**工具轮 assistant 消息构造（回声恒带——`CONTEXT-COMPACTION.md` §7 D-CC22）**：模型回复带 `tool_calls` 时，入史消息由核单点 `assistantToolCallMessage(response, spec)`（`thincoder-core/model-specs.mjs`）构造后 `pushReal`（`thincoder-core/agent/turn-loop.mjs:187`）——`reasoningEcho:"required"`
 族（deepseek / kimi / mimo）**恒带** `reasoning_content`，本轮无推理取**空串**（真机实证 · **活体形状（请求尾 = tool）**：三形态全 **200**）；「缺字段 **200** · 服务端不再回推理」= **设计轮形状（尾 =
 user）**读数）。`optional`（glm 族）/ 未声明族恒不带（行为不变）。显示面零改（`history-window.mjs` `reasoningOf` 对空串返回 null——不出幽灵帧）。**第三站点**：VSC 端壳自有 depth-0
 循环同经本单点（`thincoder-vscode/src/agent.mjs:387-397`——端 `thincoder-vscode/src/specs.mjs` 取值 × 单点构造；静态引合法（W8 契约②）= 结论）；端侧接线事实见 §6.18 表。

**Phase 1 预审**（全部 toolCalls 先过一遍，任一被拒不影响其他）：

```
JSON 参数解析失败 → error
未知工具 → error
planMode && 非只读 → denied "plan mode"
eng-coder && 未过设计评审 && FILE_MUTATORS → denied "engineering design gate"
父 agent && 工程模式 && 无设计 token && 目标在 manifest 树内 && 判 code → denied（树外一律放行；doc / temp / aux / state 豁免——辖域 = 目标所属项目：PORTABILITY.md §3.9）
非只读 && !autoApprove → onPermissionRequest / onBatchPermissionRequest（用户确认）；无 handler → denied
PreToolUse hooks → 阻断
```

**Phase 2 执行（顺序保序）**：只读工具 + `parallel` 标记工具可并行（Promise.all 一批）；非只读工具**打断批量串行**（先 flush 再单独执行）——保证顺序语义且允许只读并行。执行前对副作用工具做 `snapshotForUndo`（`/undo` 回滚基线）。

结果超限落盘 `~/.thincoder/tool-results/`（阈值权威源 = 工具输出上限系 + `helpers.mjs` 的 `TOOL_RESULT_OFFLOAD_LIMIT`——双端预览）；错误写入 `~/.thincoder/tool-errors/`（模型只见 message + 关键参数，不见 stack trace）；PostToolUse 钩子 fire-and-forget。

**console 回显**：dispatch 拦截工具 `execute` 期间的 `console.log/error`，收集后附结果回显模型（`[console during <tool>]` 段）；异常路径同样回显；嵌套 dispatch（子代理）各自拦截 / 恢复，捕获分离；`bash` 走子进程 `onOutput` 不受影响。

**console 回显预算**：capturedConsole 采集与拼接**双上界**——① **采集端 cap** = `CONSOLE_CAPTURE_LIMIT = 64 * 1024`（65536 字符——与 `helpers.mjs` `TOOL_RESULT_OFFLOAD_LIMIT` 同值；落点 = `dispatch-run.mjs` 采集点同档）：拦截为有界收集——累计达限 ⇒ 停止收集（超出丢弃——防「console 洪水」）；
发生丢弃 ⇒ 回显段尾**恰一行**标记（逐字 = `[console truncated at 65536 chars]`）；② **拼接端纳入 offload 判定**——`[console during …]` 段与结果本体拼接**先于** `offloadToolResult`（现形在 offload 之后拼接 ⇒ 可突破 64K 上限）；拼接后总长 > 65536 ⇒ 落盘 + 预览；
错误路径同款（同 cap ∥ 同标记——采集端单点）。实现 = 实施轮。

**action 级门控**（子代理单工具动作面——`AGENT-LOOP-SUBAGENT.md` §6.7.2）：工具级 `readonly` 标志无法同时表达 spawn（副作用）/ status（只读查询）/ cancel（控制）⇒ 预审按 **action 参数**分类：

- **readonly 面**：`status`、`observe`（只读查询——planMode 放行、免审批、可批并行）。
- **控制类豁免**（`isSubagentControlAction`——`cancel` + `panel` freeze + `send`）：免权限审批、planMode 允许、批审批不入组、手动档 digest 内放行。
- **`spawn` / `escalate`**：按非只读处理（planMode deny、串行、门禁照常）。

**approval 批确认（防点击疲劳）**：Phase 1 收集同批（同一 `toolCalls` 数组）所有**通过前置门禁、到达权限询问阶段**的非只读工具
（前置已拦下的不计入批）→ **一次询问**（`"N 个工具需要权限：A、B、C — approve all / approve one by one / deny"`）。
回调 `onBatchPermissionRequest({ tools, count })` 返回 `"approveAll"` / `"oneByOne"` / `"deny"`；`deny` → 全批拒绝无二次询问；`oneByOne` → 回退既有逐项通道。
`onPermissionRequest(toolName, args)` 契约签名不变；无 `onBatchPermissionRequest` handler 时缺省回退逐项通道；`autoApprove` 短路不变；只读工具不参与。

**批量形态引导（数据驱动——非新增工具）**：`edits` 数组（同文件多处修改 / 多文件独立修改——原子多文件，任一失败全不写）；`apply_patch`（新建多个文件 / 整文件替换 / 统一 diff）；提示词并行化条款（含 carve-out：并行禁令对声明 `files` 的 async spawn 例外——调度器自动排队，`AGENT-LOOP-SUBAGENT.md` §6.9）。

### 6.5 零工具调用回合（`handleCompletion`）

顺序（每个 guard 推回一次后 continue，直到通过）：

1. **空响应恢复**：**空白判**（`String(content ?? "").trim() === ""`；机制 = `AGENT-LOOP-ASYNC-POOL.md` §6.31.8）→ 注入 `[System reminder: your last response was empty…]` 重试，上限 `MAX_EMPTY_RETRIES = 2`（每次用户消息重置），仍空才抛原错误。
2. **pending tasks 提醒**：有 pending **且后台池已空**（`!poolLive(agent)`——与挂起尾巴同判据）→ 注入任务列表提醒并继续循环；**最多推回一次**（`_taskPushbacks`，task 工具更新列表即重置）——模型第二次坚持收尾则放行。池里仍有在飞条目时门不触发：task 一更新就归零 × 有 pending 即推回，会把回合拖到小时级（机制单源 = `docs/core/design/TIMEOUT-DIGEST.md` §2.3）。
3. **verify guard**（opt-in `verifyGuard: true`，工程模式除外）：改过代码未 verify → 推回调 verify（≤2 次）；verify 失败 → 推回修复（≤3 次）；耗尽 → 诚实声明提醒。
4. **advisor guard**（opt-in `advisor.guard === true`，工程模式除外）：改过代码未评审 → 推回调 advisor（≤3 轮）。
   advisor 评审能力**恒启用**（不依赖开关；未配 `advisor.provider` 时继承主 provider）；`advisor.enabled` 字段已废弃。
   guard 是**会话级**（`/advisor` 切换、`saveSession` / `applySession` 往返 `data.advisor.guard`），config.json 的 `agent.advisor.guard` 退为兼容镜像。
5. 通过 → `pushReal` assistant 回复 + 返回 content。

**guard 设计取舍**：guard 链全部「注入提醒 + continue」而非硬中断（模型自我修正优于外部强制，计数上限防死循环）；verify / advisor 仅 opt-in（工程模式用流程驱动评审替代逐轮推回）；resume 保留 guard 状态（续跑不能重置已验证 / 已收敛事实，否则可被无限续跑绕过）。

### 6.6 回合后注入（`post-turn`）

- **停滞检测**：同一工具 + 同一参数序列化签名连续 3 次 → 注入「你在原地空转，换条路或求助」（窗口 5）。
- **goal 预算**：goal 活跃时每轮注入目标 / 已用 turn 数；用满 75% 预警；`goal complete` 需验证证据门槛。
- **设计轮轮数注入（`eng-designer` · 台账 #1661）**：设计人格写着「首版 ≤15 回合 / 回合过半（>7）未落盘 ⇒ 降级交付（骨架 + 未决清单）」（提示词 `thincoder-core/prompts/persona-eng-designer.md:35`），而轮数本身是模型看不见的量——实跑 `eng-designer#14` 28 轮零写入、`#15` 16 轮零写入。本注入把「已用轮次 + 是否落过盘」逐轮送到模型眼前（与 goal 预算同文件、同注入点、同形 = `agent.history.push({ role: "user", … })`）。
  - **判据源（一）轮号**：`agent._currentTurn` = **链内累计轮号**（跨段累计，续跑不重置；与状态行 / Stop 载荷同源——`thincoder-core/agent/turn-loop.mjs:73-74` → `thincoder-core/agent/helpers.mjs:274-276`，`turn = seq`）。
  - **为什么不取 `injectPostTurn` 的 `turn` 形参**（`thincoder-core/agent/post-turn.mjs:42`）：`turn` = **段内轮号**（0 起，`turn-loop.mjs:64` 的循环变量）——续跑段从 0 重数；persona 的预算（「首版 ≤15 回合」）是**整个设计轮**的量、不按段重置 ⇒ 取累计轮号才与预算同口径（且 1 起 ⇒ `turn ≥ 5` 即第 5 轮）。
  - **判据源（二）是否落过盘**：`wrote = (agent._touchedFiles ?? []).length > 0 || (agent._batchWrites ?? 0) > 0`。
    - `_touchedFiles` = 六件写工具的记账（`write` / `edit` / `insert_after` / `apply_patch` / `delete` / `hashline_edit`）。
    - `_batchWrites` = `batch` 工具**成功写盘**的计数器（append / status / create / close 五处 `onWritten` 汇聚点单点自增；被拒绝的调用不增）。设计轮落 §2 的唯一通道是 `batch append`，不计它则「§2 已落盘」仍被判成未落盘——注入句与盘面相反（台账 `#1677`）。
    - 两集合都在 resume 保留集内（§6.2「resume 保留集」）⇒ **续跑段沿用上一段痕迹**，`wrote` 按整轮累计读。
    - **`_batchWrites` 不并入 `_touchedFiles`**：后者有五个下游消费者（`verify` 改动清单 / advisor 默认范围 / `doc_check` 默认受检文档 / `recent_changes` / 子代理合入父域），且 `hasCodeMutations` 会把「只写了批档」判成「代码有变更」；计数器只动本注入的判据面。
  - **续跑段后果（如实登记）**：续跑段起手即带前段轮数与写入痕迹 ⇒ 可能首轮就出常行、或直接命中 `turn ≥ 8` 触发降级句（前段已写过文件则降级句不出现）——这是设计轮预算的累计语义，不是漏判。
  - **边界**：机器看得见「写过文件」与「写过批次档」，仍看不见「写的内容是不是设计本体」——判据只回答「有没有落盘」，不回答「落得对不对」。
  - **纯函数（单源）**：`designTurnReminder({ role, turn, wrote })` → 注入串 | `null`（`thincoder-core/agent/post-turn.mjs`，与 goal 预算同一函数体内、`callbacks.onTurnEnd` 之前）；
    常量 `DESIGN_TURN_NOTICE_AT = 5` · `DESIGN_TURN_SKELETON_AT = 8` · `DESIGN_FIRST_VERSION_TURNS = 15`。角色表当前一行（`eng-designer`）。
  - **`eng-coder` 不在本批**：其零落笔面已由 `AGENT-LOOP-UPSTREAM.md` §6.32 看门狗兜（父侧提醒、连续 50 轮）；模型面计数要先定它的预算数，另裁——加一行即扩展，不改函数体。
  - **注入形逐字**（`turn ≥ 5` 起，每工具轮末；两串里的 `15` 一律由常量 `DESIGN_FIRST_VERSION_TURNS` 插值——改常量即改注入文本，不另留字面；`7` = persona 判定点 `turn > 7`）：
    - 常行：`[System reminder: design round turn ${turn}/15 — ${wrote ? "something has been written to disk" : "nothing has been written to disk yet"}. First version budget is 15 turns; past 7 turns with nothing landed the rule is a skeleton + unresolved list.]`
    - 降级行（`turn ≥ 8` 且未落盘，替代常行）：`[System reminder: design round turn ${turn}/15 — nothing has been written to disk yet. The 7-turn mark has passed with nothing landed: degrade the delivery NOW — write the skeleton (design doc + batch record §2) plus an unresolved list, then refine in place.]`
  - **阈值理由**：5 = 在「过半（>7）」判据之前 3 轮给出计数（模型还有 3 轮可动手）；8 = 与 persona「过 7 轮」同一判定点（`turn > 7`）。`turn < 5` 静默——早期注入只是噪声。
  - **机判（纯函数五断言）**：`designTurnReminder` 五断言（`turn 4` ⇒ `null`；`turn 5` 且未落盘 ⇒ 常行、不含降级句；`turn 8` 且未落盘 ⇒ 降级句、含 `skeleton`；`turn 8` 且已落盘 ⇒ 常行、不含降级句；`role` = `eng-coder` / `null` ⇒ `null`）。
  - **机判（`batch` 写面，台账 `#1677`）**：`batch append` 成功后 `agent._batchWrites` 自增（两次追加 ⇒ 2）；被拒的 append（空文本 / 段白名单外）⇒ 不增；`_touchedFiles` 空 ∧ `_batchWrites = 1` ∧ `turn 8` ⇒ 常行、含 `something has been written`、不含降级句。
  - **机判（续跑 + 接线）**：续跑断言一条（`turn 12` ∧ `_touchedFiles:["x"]` ⇒ 常行、含 `turn 12/15` 与 `something has been written`、不含降级句）；接线一条（fake agent 调 `injectPostTurn` ⇒ `history` 末条为注入串；`turn` 实参传段内值、`_currentTurn` 传累计值——二者故意不同，取后者）。

> **§6.7–§6.12 已拆出** → `docs/core/design/AGENT-LOOP-SUBAGENT.md`（子代理 / 文件域调度器 / abort 来源标注）· `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（挂起 digest / 分域池与 async advisor / 评审池接入——节号沿用）。

### 6.13 Stop 钩子（主会话 run 结束事件）

> 用户裁定：事件名 `Stop`；范围 = **每次主会话 run 终止**（非逐内层轮）；子代理不触发。

**触发判定**——`finalizeAgentTurn` 首部（`flushPeerDomains(agent)` 之后）：

```js
// 主会话 run 终止 → fire-and-forget（非阻塞；失败静默——与 PostToolUse 同语义）。
// 排除用户中止（Ctrl+C / Ctrl+I）与 AbortError 展开。
if (depth === 0 && !signal?.aborted && thrownError?.name !== "AbortError") {
  runHooks("Stop", {
    agent,
    error: thrownError && !(thrownError instanceof ContinueError) ? thrownError : undefined,
    extra: {
      turn: agent._currentTurn ?? 0,
      reason: thrownError instanceof ContinueError ? "maxTurns" : thrownError ? "error" : "done",
    },
  }).catch(() => {})
}
```

- 判定语义：`depth === 0`（仅主会话）；`signal?.aborted` 排除 Ctrl+C（停回合）与 Ctrl+I（注入续跑）；`AbortError` 名称兜底（防续跑期假通知）。
- `reason` 三态：`done`（正常完成）· `maxTurns`（`ContinueError`——撞帽暂停）· `error`（其余异常——`error` 字段带 message）。
- 每 `runAgent` 调用至多一次（触发块在收尾函数内、收尾函数在 `finally` 单点调用）。
- **端侧触发面**：随主循环取核归核——VSC 经核 `runAgent` 自动获得（事实表 = 本档 §6.18「生命周期钩子面」行）；
  载荷 `turn` = 链内累计轮号（核 `agent._currentTurn` ← 帧赋值 `thincoder-core/agent/turn-loop.mjs:74`），与本节载荷表一致。

**时序**：回合循环每轮 = chat → dispatch（Pre / Post / Failure hooks）→ post-turn 注入（`onTurnEnd` = 显示面簿记）
→ 循环退出（正常 return / `ContinueError` / 异常 / 中止）→ finally → `finalizeAgentTurn`：
① `flushPeerDomains` ② **Stop 触发** ③ 池收尾（`collectSettledAsync`）④ guard 继承。

Stop 置于收尾链**首部**（后续收尾步骤的任何异常不得吞掉通知）；auto-turn（digest）回合 = depth 0 ⇒ 同样触发；fire-and-forget（不 await、不计入回合时延）。

**载荷（stdin JSON）**：

| 字段 | 值 | 说明 |
|---|---|---|
| `event` | `"Stop"` | 事件名 |
| `toolName` / `toolArgs` / `result` | `null` | 无工具面——骨架字段保留（镜像既有事件形态） |
| `error` | `null` \| string | **仅 `reason="error"` 时** = 异常 message |
| `turn` | number | 链内累计轮号（跨段累计，与状态行同源） |
| `reason` | `"done"` \| `"maxTurns"` \| `"error"` | 终止原因三态 |
| `timestamp` | ISO 8601 | 既有骨架同款 |

不携带回答正文 / agent 对象 / 会话标识；`matcher` 对 Stop 无效；`action: "block"` 无意义（返回值无人消费——fire-and-forget）。

**引擎改动（`thincoder-core/hooks.mjs`——三处小改，既有三调用点零改）**：① `runOneHook` 载荷构造在基础键与 `timestamp` 之间插 `...(ctx.extra ?? {})`（既有调用点不传 ⇒ 逐字零变）；② `runHooks` matcher 守卫 `if (hook.matcher && ctx.toolName != null)`（无工具名事件忽略 matcher——配了 matcher 会静默失火，守卫一行可除）；③ 头部事件表删 `Notification` 行、增 `Stop` 行。

**事件表（四类）**：

| 事件 | 触发点 | matcher | block 语义 |
|---|---|---|---|
| PreToolUse | 工具执行前（dispatch 预审段——可阻断） | 工具名 | 有（非零退出阻断） |
| PostToolUse | 工具成功后（fire-and-forget） | 工具名 | 无（返回值无人消费） |
| PostToolUseFailure | 工具失败后（fire-and-forget） | 工具名 | 无 |
| **Stop** | 主会话 run 终止（fire-and-forget） | 忽略（无工具名） | 无 |

**死事件清退**：`Notification` 原声明零调用点（「能配却永不触发」陷阱）——**删除**而非接线（「通知」用途已被 Stop 覆盖）；配置无校验（hooks 按事件名动态读取）。

### 6.14 digest 注入预算统一

- **单源模块** `thincoder-core/agent-tools/digest-budget.mjs`——导出三件：`DIGEST_INJECT_BUDGET`（64 × 1024）；
  `digestBudgetOver(agent, size)`（判超 + 记账——`used > 0 && used + size > BUDGET` 首条豁免保留；轮界定 `agent.history.length !== r.len + 1`）；
  `persistOverflowReport(raw, { tag })`（`configDir/tool-results` 落盘 + 轮转 + 清单行；失败 null ⇒ 调用方回退 inline）。
- **接线点**：`injectAsyncResult`（subagent / advisor / escalate 三族——判超 / 落盘改调共享模块，标签与墓碑语义零变）· `injectConsultResult`（consult 新接线——统一形态：raw 计入预算 → 超限 → 落盘清单行，失败回退 inline 预览）。
- **计数口径**：计入预算的 `raw` = 报告 / 错误正文（**不含** `[System reminder: …]` 标签行——与既有口径一致）；错误条目同计同落盘。
- **兼容面**：`subagent-async.mjs` 保留 `DIGEST_INJECT_BUDGET` + 测试缝 re-export（测试导入面零改）；单条 offload 预览路径零改。

### 6.15 长会话内存上界（子代理族）

- **子代理人读线窗口**：子代理创建时置 `child._historyWindow = RECORD_WINDOW_MESSAGES`（200——常量单源同主 agent 窗口；机制 = `thincoder-core/context.mjs` `pushReal` 驱逐）。
- **捕获截断（滞后水位）**：捕获闭包改 `appendCappedText(output, t, CAPTURE_CAP_OPTS)` 后赋值 `child._capturedOutput`——`CAPTURE_CAP_OPTS = { hard: 131_072, head: 16_384, tail: 49_152, marker: "… [captured output truncated: N chars omitted] …" }`（超 hard → 裁至头 16K + 标记 + 尾 48K；续跑同闭包累积，语义一致）。
- **释放点**：`releaseSettledEntry(entry)`（`async-settle.mjs`）——`entry.childAgent = null; entry.report = null`（幂等）；**三消费点**注入完成后调用（回合尾收集 / run 起始 pending 注入 / 挂起残差）——**fallback 面**（无挂起驱动）逐字沿用；池内与挂起未消化窗口**零变化**（报告仍到达、status / observe 可读）。
  **会话态（报告保留至销账）**：挂起会话态（`_daSession === true`）注入后改调 `releaseChildHold(entry)`——**仅释放 `childAgent`**；`report` 保留至销账 / 升级（重投需原文；驻留增量以报告量级封顶、以重投上限封顶）。机制 = `AGENT-LOOP-ASYNC-POOL.md` §6.31.4（KD-DA7）。
- **纯函数单源**：`capText` / `appendCappedText` 本体 = `thincoder-core/text-budget.mjs`（TUI 面 `display-budget.mjs` 与 agent 面共用）。
- **轨迹面**（单遍序列化 / 额度双层 / 在途上界 / 序号缓存）→ 属**轨迹存储**板块（`TRACES.md`）。

### 6.16 权威源接管点（指针汇总）

以下机制**不在本档详述**——权威源在别处，本档只指路（不复制以免漂移）：

| 机制 | 权威源 | 本档说明 |
|---|---|---|
| 工程模式判定 / token 门 / 主流程 | `docs/core/design/ENGINEERING-MODE-V2.md`（`BATCH-RECORD.md` · `DOC-DISCIPLINE.md` · `LEDGER.md`——已迁；v1 设计档已归档） | 拆分面 §6.7.6 协议概览 + 文档纪律来源 |
| 评审轮次收敛 | `docs/core/design/ADVISOR-CONVERGENCE.md` + `ADVISOR-GUARDS.md`（已迁） | 拆分面 §6.10 / §6.11 对象锚 + 轮次语义 |
| 评审判定铁律 R1–R7 / 评审对象锚 | 本层 `AGENT-LOOP-ASYNC-POOL.md` §6.19 / §6.18 | 并入 |
| 测试收口（改动内单元测试 ∕ 链终收口时集成测试） | `docs/core/design/TESTING.md` | 拆分面 §6.7.6 指注 |
| 工具注册 / schema / ctx / hooks / undo | 本层 `TOOLS.md` | §6.4 调度决策语义 |
| 结果落盘阈值 | `docs/core/design/TOOL-OUTPUT-LIMITS.md`（已迁） | §6.4 引用 |
| TUI 显示 / 渲染 / 折叠块 | CLI 壳体面（`TUI.md`——未迁） | 拆分面 §6.7 显示面指针 |
| 会话 | 本层 `SESSION.md` | `read_history` 语义 |
| 上下文压缩 | 本层 `CONTEXT-COMPACTION.md` | §6.2 压缩安全点 |
| 会诊 / 飞刀机制 | 会诊 = 本层 `CONSULTATION.md`；飞刀 = `docs/core/design/ESCALATE.md`（已迁） | 属他板 |
| 轨迹存储 | 本层 `TRACES.md` | 属他板 |
| 事件日志 | 本层 `LOGGING.md` | 轨迹上游互补 |
| 模型上下文配置 | 本层 `PROVIDER.md` | 推理 / 预算 |
| 记忆 | 本层 `MEMORY.md` | §6.3 记忆检索 |
| MCP 机制 | 本层 `MCP.md` | 工具面扩展 |
| 多实例协作感知 | 多实例协作档（CLI 仓·设计——未迁） | 并行副本感知 |

### 6.17 普通模式轻量审计

**普通模式轻量审计**（现行提示词 `persona-normal` / `common` / `discipline-normal`——需求条目 = `thincoder-cli/docs/requirements/NORMAL-MODE.md` §6，待随该档迁移）：主代理验证 coder 交付时，对照 ① 本轮用户指令 ② 板块设计文档（文档地图定位）查三向一致 + 指令落文档——**零额外 LLM**（读是既有动作）。

**F-N1.4 升级**：实现偏差由主 agent **修正至符合设计后才宣布完成**（真实文档漂移 / 超范围 → 报告用户，不擅改）。

**常态化独立审计机制 = 不做**（机械论证：① 与「零额外 LLM」冲突（独立审计 = 新步骤 / 新 spawn）② 数据源无着（实况审计需轨迹 / 会话数据，轨迹默认关）③ 与既有条款语义重复——任一成立即否决）。

### 6.18 VSC 侧接线面

VSC 侧**接线**面（端装配 / 面板 / webview 呈现）——机制本体已并 §6.1–§6.17 + `AGENT-LOOP-SUBAGENT.md` / `AGENT-LOOP-ASYNC-POOL.md` / `AGENT-LOOP-UPSTREAM.md`；本节只登记**端侧接线事实**（不重复机制，D2）：

| 接线面 | 端侧形态（实核） | 回指 |
|---|---|---|
| 挂起回合 digest | 核驱动装配（状态机本体 = 核 `startSuspension`——端壳 = carrier ∕ hooks ∕ 输入缝装配面）+ 面板交互层：`panel._suspWake` 绑定核句柄 `handle.wake` · `_turnState==="running"` busy 队列受理（容量 8——吞面收敛四；满队（第 9 条）拒 + 提示 + 文本保留——`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）· settle 驱动 digest 轮 · 中止残余消息按普通回合兜底执行（零丢失） | 机制核内形态 = §2.3（#184 注入面表）；消化面 = `AGENT-LOOP-ASYNC-POOL.md` §6.8；呈现 = `docs/vsc/design/WEBVIEW.md` §5 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` §5（digest 轮可见面） |
| eng-coder 交付协议 | 本端闭环：async 缺省 · explore 受限审计（BLOCKING spawn-only + 审计预算 ≤6 · 任务书三要素机械追加）· token 门（`thincoder-core/agent-tools/subagent-spawn.mjs:100` `resolveDesignSlot`——designId 槽解析 + TTL fail-closed 槽回读）· 变更记账 `mergeChildMutations`（取消路径不合并——`thincoder-core/agent-tools/subagent-async.mjs:411`） | token 门机制权威 = `docs/core/design/_archive/ENGINEERING-MODE.md`；受限通道描述面 = `AGENT-LOOP-SUBAGENT.md` §6.7.6 |
| 子代理活动显示 | webview 活动区：活动区 → `awaitingDigest`（等待消化） → 消化归档落流（`#subagent-activity`）· 终态即时归档 | 呈现权威 = `docs/vsc/design/WEBVIEW.md` §5.1 / §5.2（生命周期 / 块头形态）——本档不复制 |
| child permission gate | 子代理（depth>0）写操作走审批门：`makeChildPermission`（`thincoder-core/agent-tools/child-permission.mjs:32`——announce → ask → 清态）+ `childOwnerLabel`（同档 `:22`——`escalate <model> #<id>` / `<role>#<id>`）· autoApprove 值源 = 父对象字段 `parent.autoApprove`（核引擎 child 权限面三读点：`thincoder-core/agent-tools/subagent-spawn.mjs:305` · `escalate-async.mjs:225` · `subagent-actions.mjs:205`；VSC 侧字段接线 = 本表「自持工具登记面」行）· 卡释放三路（child abort〔signal = 条目级 controller——端侧供给接回，见下行〕/ Stop / approve-all 连带 `permissionWithdrawn`）· 块头 `⏸` + 态词 `等待审批`（`webview/activity-view.js`） · **端侧供给**：手动档子代询问 = `callbacks.onPermissionRequest`（`thincoder-vscode/src/extension/panel-callbacks.mjs` 供给——面板权限卡 + owner 归属 + `⏸` 态）经 `execute-tools.mjs` toolCtx 透传（核同范式 = `thincoder-core/agent/dispatch.mjs:395`）；缺失 ⇒ 静默拒绝不出卡（`thincoder-core/agent-tools/subagent-spawn.mjs:308-309`）· ① signal 接回——供给按归属键 id 读池条目（`_asyncSubagents.get(String(id))`）⇒ `signal: entry.controller.signal`——路径①（child abort）VSC 转实态（⏹ / `action:'cancel'` / 会话链中止一律 deny 释放 + `permissionWithdrawn`；迟到弹卡 sig 已 abort ⇒ 即释放）；② 询问名携键 + model 供给——飞刀 async 名 = `escalate#<id>/<tool>`、sync 同构包装、`continue` = args.agent 机器键（三生产者同规）⇒ owner 归属 + `escalate <model> #<id>`（model = 池条目值）· tool-ctx `getAuto` / `sessionSignal` 透传 = 历史残留、零消费面（F2 注释收正——核门读父对象 `autoApprove` 字段；会话 signal 经 `agent._sessionSignal` 达核） | §2.1 #166 裁决行 · 权限调度面 §6.4 · 呈现 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.2 |
| 上行通道消费 / 唤醒面 | 核循环头调核单源 `drainChildUpstream`（核 `thincoder-core/agent.mjs` 循环头——主循环取核后随主体归核）+ 载体两字段入 `CARRIER_FIELDS`（`thincoder-vscode/src/extension/panel-turn-loop.mjs`——装配期 16 款访问器别名）；挂起驱动第 2 步判据 = 核 `startSuspension` 内 `upstreamWaiting`（端差零自持）+ `upstreamTurn` 旗标三跳（`panel-turn-stages.mjs` → `panel-chat.mjs` → `panel-turn-loop.mjs` 核 opts）+ `digest:start` / `digest:end` 载荷 `upstream: true`（两端同规） | 机制权威 = `AGENT-LOOP-UPSTREAM.md` §6.27.12（§6.27.12.12 = VSC 对位面）；验收机判 = `thincoder-vscode/test/upstream-parity.test.mjs`（T-VS-U1–U7 · **拟新增**） |
| 自持工具登记面（#83） | VSC 经**核登记册**取 14 工具（单一来源）：装配面 `thincoder-vscode/src/agent/setup.mjs` `hydrateRun` 内**动态** `await import("@thincoder/core/agent-tools.mjs")`（静态引入会经 consult/subagent 族触达 `node:sqlite`——W8 契约②；核侧同款动态先例 = 核 `agent-tools.mjs` 头注）；端侧转口面 `thincoder-vscode/src/agent-tools/index.mjs` = `export * from` 核登记册（不再自持 14 名清单）；`batch` 记账缝（#84）端侧注册 = 同档 `configureBatchSegment({ onWrite })`（`_touchedFiles` 记账——与删除前内联面同语义）；同装配面每轮把**基础集**（除端侧 meta 工具族 `agentTools` 外的装配项）绑定到 agent 对象（`agent.tools`——spawn 读点 `parent.tools` / 子代装配展开；`thincoder-core/agent/family-tools.mjs`（家族单源——`assembleFamilyTools`；核调用点 `thincoder-core/agent/setup.mjs:175-182`）追加 task/plan/timer 等 depth 家族由核负责——**不相交式 = 追加家族 ∥ 绑定值（基础集）**（端侧 meta 族与追加家族实测重叠 11 名，故其不得入绑定值；防子代装配重名）；家族矩阵同批单源化：端侧角色分支链删除、装配改调核侧单源实现——CLI 与 VSC 同调，端差装饰留端）。**`agent.autoApprove` 字段接线**：同装配面 B 类 run 绑定（`hydrateRun` 每轮重指）以**访问器**把 `agent.autoApprove` 接 `getAuto` live 闭包——核侧字段读点（spawn/escalate 门 · 子代权限继承 · 调度 · 结算）获值（宿主曾缺该字段致 AUTO 档核读点恒判非 AUTO）；无 setter（面板 flag 为唯一来源） | 机制行 = §2.2 / §2.5 #83；缝位清单 = `CORE-UNIFICATION.md` §2.13.3；验收机判 = `thincoder-vscode/test/agent-tools-registry.test.mjs`（登记册面）· 新增 autoApprove 字段接线回归档（用例表） |
| 端壳事件中继面 / 调用期适配（W15） | ① **事件中继**：核 relay `⟦ev⟧` 事件 token（`queued` / `cancelled` / `stopped` / `settled` / `done` / `turn` + `⟦ev⟧async`+`[model]`）经 `thincoder-vscode/src/extension/panel-callbacks.mjs` `relaySubagentEventToken` → webview `{type:"subagent"}` 状态消息单点（⏹ queued 等待头回收 + 位置前移；`panel-messages.mjs` ⏹ 路由携 config/autoApprove 真值）。**策略**：未映射的 `⟦ev⟧` 事件**静默消费**（不泄漏进聊天文本；VSC 另有结构化通道者如 `⟦ev⟧approval` = `onSubagentApproval` 不受影响）；嵌套 relay 前缀（孙代事件）按 head 折叠到外层块（扁平活动区语义）；② **循环契约位移 = 调用期适配**（主循环面 = `thincoder-vscode/src/extension/panel-turn-loop.mjs`（核 `runAgent` 改接 ∕ 三段续跑）+ 装配面 = `thincoder-vscode/src/agent/setup.mjs`；`thincoder-vscode/src/agent.mjs` = 转口残面（`ContinueError`）：live `autoApprove` getter · `opts.distillState`↔核 `agent._pendingDistill` · 载体字段访问器别名住共享 `history`（16 款））；③ **核原语改指**：`thincoder-vscode/src/explore-distill.mjs` = 核 `summarizeRunExplorations` 适配器（agent 载体 ↔ 共享数组原位回收）· `thincoder-vscode/src/agent/setup-reminders.mjs` = 端特有面（env 行端身份 R4 / peer / 重启闸）+ 核转口（git/注入/AUTO/ENG）· `thincoder-vscode/src/i18n.mjs` = 核 `projectDictionary` 投影 + 端特有键（webview 面）叠加（本地键恒胜）；④ **`autoThink` 键随 config 归一**（#175 a 半——消费点 = `thincoder-vscode/src/agent.mjs` 首轮核 `auto-think.mjs`，默认 false 零行为变化；档位 patch 全程端侧 = `src/extension/panel-chat.mjs` → provider 字段数据面）；⑤ **内容中继**：子代内容 chunk（text / think / 工具调用行 / 工具输出行——`wrapChildCallbacks` 四路前缀包装）经 `relaySubagentContentChunk` 分流 → webview `toolPanel` `sub:<role>#<id>` 块（嵌套子标随行；事件面先吃、内容面后判——前缀 chunk 不再落主会话流） | 回指：§2.3（载体字段集）· §6.1（循环）；验收机判 = `thincoder-vscode/test/chat-panel-messages.test.mjs` ⑫/⑬ · `subagent-content-relay.test.mjs`（内容中继 T1–T7） · `agent-lifecycle-singleton.test.mjs`（#175a 归一） |
| 工具轮推入面（回声恒带——D-CC22 第三站点） | 核主循环单点：工具轮 assistant 消息推入（前端壳站点 = `thincoder-vscode/src/agent.mjs:387-397`）经核单点 `assistantToolCallMessage`（`thincoder-core/model-specs.mjs`）构造后 `pushReal`——主循环取核后随主体归核，端壳零第二站点；端取值 = `thincoder-vscode/src/specs.mjs` 的 `specForModel`（核规格表 + 端差 `reasoningEffortDefault`——核装配期消费） | 契约 = §6.4（本档）· 判据与决策单源 = `CONTEXT-COMPACTION.md` §6.10 #9 / §7 D-CC22（本档不复制否决表）；验收机判 = `thincoder-vscode/test/integration/reasoning-echo-live.test.mjs`（已落）· 结构面 = 同档 T-V-RC3（端壳零 `reasoning_content:` 字面） |
| 生命周期钩子面（Stop + 派发四事件） | 随主循环取核归核：**Stop 钩子**（核 `thincoder-core/agent/run-stages.mjs`——`finalizeAgentTurn` 首部，fire-and-forget；载荷 `turn` = `agent._currentTurn ?? 0`）· **派发面三调用点**（核 `agent/dispatch.mjs` PreToolUse〔可阻断〕· `agent/dispatch-run.mjs` PostToolUse ∕ PostToolUseFailure）· **config plumb**（核 `hooks.mjs` 读 `agent.config.hooks`；VSC `hydrateRun` 装配期写 `agent.config`）——VSC 经核 `runAgent` 自动获得 | 机制 = 本档 §6.13（Stop 钩子）· §6.4（PreToolUse 预审段） |
| 同族事件载荷双改纪律（`⟦ev⟧queued`） | 载荷发射 = 核单点（`thincoder-core/agent-tools/subagent-scheduler.mjs:173-176` 三 kind + `position` + `detail`；发射 `:356`）；**纪律**：改核事件族任一 kind / 字段 ⇒ **同轮改两端消费面**（CLI `thincoder-cli/src/tui/subagent-panel.mjs:73` 分流 + `:100-102` 渲染；VSC `thincoder-vscode/src/extension/panel-subagent-relay.mjs:105-118` 映射 + 入缓存 · `thincoder-vscode/webview/activity-view.js:91-95` `kind` 判词）**+ 两端用例同轮**；字段命名 / 承载形态差异 = 已裁保留（`CORE-UNIFICATION.md` §2.12.3「归一的是语义，不是承载形态」）——不属该消的差；字段**丢失**（#118 类）属真缺陷；**机检补充项**（#135 裁）：端侧只读源锚对拍——核 kind 字面集 ∥ 端映射集（新 kind ⇒ 用例红；只读 · 零产品码改面）——判补 · 执行 = 码面小轮 · 触发 = 核事件族批 ∕ `thincoder-vscode/test/subagent-queued-payload.test.mjs` 下次触碰） | 机制 = `AGENT-LOOP-SUBAGENT.md` 调度面（§6.9） |
| 同形重复族（#127）双改纪律 + 收口登记 | 核 / 端同形重复对 ①–⑦ 逐条（判 / 落点）：① 上下文注入块（核 `thincoder-core/agent/setup.mjs` + `thincoder-core/agent/helpers.mjs`——核单源）；双改纪律 = 改核侧 ⇒ 同轮改端侧。② [4] 层 system 尾块（核 `thincoder-core/agent/setup.mjs:221-229`——端面已收编为 adapter 键；现态见「#127 行收编后现态」注）。③ 提醒族（核 `thincoder-core/agent/setup-reminders.mjs` ∥ 端 `thincoder-vscode/src/agent/setup-reminders.mjs`）——已消解（见「#127 行收编后现态」注）；双改纪律 = 改核档共享行 ⇒ 同轮改端档。④ 续跑循环（CLI `thincoder-cli/src/tui/agent-turn.mjs` ∥ 端 `thincoder-vscode/src/extension/panel-turn-loop.mjs`——规则同形 · 呈现面不同）——**消**（#677 I10：抽核纯函数 `continueDecision(error, {autoTurn, autoApprove, reason})` 单源 + 两端接线（注：`reason` = 宿主解析面，两端同式 `controller.signal.reason` 单源——VSC→CLI 对齐已落）；判保留退场）。⑤ `ContinueError`（核单源 `thincoder-core/agent/helpers.mjs:237`；端转口 `thincoder-vscode/src/agent.mjs:7` import + `:45` re-export——端侧零第二类）——已收口。⑥ memory 工具描述面（端 `thincoder-vscode/src/memory-tool.mjs:42-60` ∥ 核 `thincoder-core/memory/docs.mjs:251` `memoryTools`）——**消**（#677：端描述面退场 ⇒ 核单源——实施清单 I9）；双改登记 = `MEMORY.md` §6.9（本行只回指 · 不重述——D2）。⑦ 多实例聚合（端 `thincoder-vscode/src/extension/peer-instances.mjs`——端 = 核单源转口；现态见「#127 行收编后现态」注）。 | 分析单源 = `MEMORY.md` §6.9；登记单源同上 |

（十一面的机制 / 契约权威 = 本档 §2.3 / §6.4 / `AGENT-LOOP-SUBAGENT.md` + 工程模式板。）

（**#127 行 ①–⑦ 现态**：① 上下文注入块单源 = 核（context-injections）；② 端面收编为 adapter 键（`opts.promptTail`——`thincoder-vscode/src/agent/setup.mjs:281` `scopedRulesBlock`）；
③ 已消解（§2.1 F 端名缝）；④ **消**（#677——抽核 `continueDecision` 单源 + 两端接线；判保留退场）；⑤ 端转口现住 `thincoder-vscode/src/agent.mjs:9`（9 行转口残面）；
⑦ 端 = 核单源转口（`thincoder-vscode/src/extension/peer-instances.mjs` 21 行——核单源转口 + 核缓存预热薄转口；见 `MULTI-INSTANCE-COLLAB.md` §3.1）。⑥ 端描述面单源 = 核。）

## 7. 并入的关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-AL1 | guard 链 = 「注入提醒 + continue」而非硬中断 | 模型自我修正优于外部强制；计数上限防死循环；resume 保留 guard 状态 |
| D-AL2 | 子代理零 git = 工具不存在 + 不注入（双物理防线） | git 是污染源（已提交修复不可见 / untracked 不可见 / status 全工作区脏） |
| D-AL3 | 顶层 spawn / escalate / advisor 一律异步（同步例外全移除） | 同步 spawn 反复误用（阻塞自身 turn + 占池）；机制参数保留但不引导（提示词 + 工具描述两处） |
| D-AL4 | 四族 settle 统一单点（`settleAsyncEntry`）+ pending 单容器 + done-in-pool 统一表示 | 族特有段下沉 `onAccounting` hook |
| D-AL5 | 调度器动态文件域 = 声明域 ∪ running 的 `_touchedFiles` | out-of-list 写入是交付常态（纪律允许 + 逐项报告）——须获域保护 |
| D-AL6 | 同文件串行只阻断「先入者」与 running | 后入者不阻断——防两个 queued 同文件互等死锁 |
| D-AL7 | 依赖取消 / 失败 → 依赖者留 queued `dependency-cancelled`（不自动启动） | 滞留有意、显式可清、不静默；仅父侧显式处置或 AUTO 档自动启动 |
| D-AL8 | 挂起回合 = **交互层状态**（`runAgent` 保持「单输入 → 输出」不变式） | 挂起循环落在调用方 turn 循环 |
| D-AL9 | busy 时**提交入队列**（`pendingInput`——**容量 8 条**；普通 / 会话内 busy 同判据；吞面收敛四 = 模态 / 斜杠 / 空 / **队满（第 9 条）**）（多槽 + 合并消费（R15 恢复）+ 步边界 pickup） | 受理 = 入队（反馈三段式 = `docs/cli/design/TUI.md` §7.5；机制 = `AGENT-LOOP-ASYNC-POOL.md` §6.8）；`state.queue` 缩为残项单容器 |
| D-AL10 | 待答池分域（engCoder / other）按域记账 + 三键可配 | 跨域总量 8、同域仍 4 |
| D-AL11 | 评审**同 scope 不排队**（同 type+scope → 直接拒）；**池满（异 scope）入队** | 同 scope 续审 stale ⇒ 拒 + 拒文案给指引；异 scope 互不依赖 ⇒ 入队不增 stale 面且复用既有队列语义（不入第二份实现）——落地 = `AGENT-LOOP-ASYNC-POOL.md` §6.10 / §6.11 |
| D-AL12 | async 池复用既有 pending / digest / 注入 / 冻结机制（角色无关） | — |
| D-AL13 | abort 载体 = 结构化 `err.abortInfo`（非 message 内嵌） | 可机判 + message 零改（零回归）+ 一模块一词汇表 |
| D-AL14 | reason 词汇表**就地扩展**（新增 `abortTrigger` 形态） | 既有 `{interrupt}` 判据点零触碰 |
| D-AL15 | 死亡行 = 原 message 前缀 + 后缀（不重写 message） | 既有文案 / 前缀断言零回归 |
| D-AL16 | Stop 触发点 = 收尾点单点 + 显式条件 | 单点覆盖全部退出路径（done / maxTurns / error / abort 同点分流） |
| D-AL17 | Stop 排除中止但**撞帽 / 异常也触发**（`reason` 区分） | 两态都是「agent 停了、可能需要你」 |
| D-AL18 | `Notification` 删除（不接线） | 零调用点（自重引入即死）+ 存活文档不列 + 配置无校验 ⇒ 删除零运行时影响；「能配却永不触发」是陷阱；用途已被 Stop 覆盖 |
| D-AL19 | matcher 守卫进引擎 | 无工具名事件配了 matcher 会静默失火——一行守卫可除 |
| D-AL20 | digest 预算 = **共享叶子模块单源** + 四族全接线 | 常量 / 判超 / 记账 / 落盘四处合一 |
| D-AL21 | 子代理窗口复用主 agent 机制（`_historyWindow`） | 不另造第二套窗口实现 |
| D-AL22 | 捕获 = 滞后水位截断（头 16K + 标记 + 尾 48K） | 消费面读 2K / 4K——头尾保真覆盖 |
| D-AL23 | 释放点 = 注入完成后置空（三消费点同点 + 幂等守卫）——**fallback 面**（无挂起驱动）逐字沿用；会话态见右列 | 池内窗口语义零变。会话态 = 注入后仅释放 `childAgent`（`releaseChildHold`），`report` 保留至销账 / 升级（理由 = 重投需原文）——机制 = `AGENT-LOOP-ASYNC-POOL.md` §6.31.4 / KD-DA7。 |
| D-AL24 | VSC 侧接线面 = **只登记接线事实、不复制机制本体**（挂起 / 协议 / 呈现 / 权限门回指既有节） | 机制权威已单源（§2.3 / SUBAGENT 档 / WEBVIEW 档 / 工程模式板）——平行档 / 重复叙述 = 漂移源 |
| D-AL25 | child permission gate **按现状并入**（C-2 契约——非「无此状态」） | 发现「审批态已实装」（activity-view.js ⏸ + 等待审批）——活档口径按现状（VSC 源档为参照历史） |
| D-AL26 | auto-think 分类 = **可关思考守卫 + 关思考小预算请求 + 失败一次可见** | 思考型模型上分类调用 100% 失败（思考吃光 `maxTokens: 10` + 无思考开关守卫；catch 静默 ⇒ 功能失效无感知）。修法：`thinkOffPath(spec)` 假 ⇒ 不调用（+ 一次 warn）；真 ⇒ `thinking = thinkOffShape(spec)` + `reasoningEffort` 清空 + `maxTokens = 32`；失败一次可见 warn（回退 null 语义不变）。 |
| D-AL27 | 文档注入配额 = **两侧分取**（本仓侧 ∥ 声明侧）+ `docSearch` 可选 `origins` 覆盖参 | 单次调用的全局排序在候选池有界（`max(limit*4,20)`）下不保任一侧 top-5（F-DI1 保底不可达）⇒ 两侧各独立 top-5、合并序 = 本仓 ≤5 + 声明 ≤5（上限 10）；`origins` 缺省 `null` ⇒ 现行为逐字（无声明源零变）· 给定 ⇒ 以其为集 · 空数组 ⇒ 现「不过滤」语义。机制 = `docs/core/design/MEMORY.md` §6.15；实现 = `thincoder-core/agent/setup.mjs` ∥ `thincoder-core/memory/docs.mjs`。 |

