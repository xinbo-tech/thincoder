# agent 主循环与子代理（AGENT-LOOP）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§8 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。
> **拆分面**（2026-09-15 · 迁移批第 5 批）：§6.7–§6.12 拆出至 `docs/core/design/AGENT-LOOP-SUBAGENT.md`——**节号沿用**（全仓既有指针只改档名、不改节号）；本档续 §6.1–§6.6 + §6.13–§6.17。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 主循环 | `thincoder-core/agent.mjs` | 同名（同路径对） |
| 装配 / 提醒 / 收尾 | `thincoder-core/agent/setup.mjs` · `setup-reminders.mjs` · `run-stages.mjs` · `post-turn.mjs` · `dispatch.mjs` · `completion.mjs` · `record-results.mjs` · `relay-prefix.mjs` · `thincoder-core/agent/helpers.mjs` · `spawn-child.mjs` | `src/agent/*`（拆档：`execute-tools` · `tool-gates` · `run-helpers` · `context-injections` · `agent-state`） |
| 子代理 / 异步 | `src/agent-tools/{subagent-scheduler,subagent,subagent-actions,subagent-async,subagent-run,async-settle,subagent-spawn,escalate-async}.mjs` | 同名 / 拆分档 |
| 挂起与唤醒 | `src/tui/suspension-drive.mjs` | `thincoder-vscode/src/extension/suspension.mjs` |
| 权限 | `thincoder-cli/src/cli/permission.mjs` | `src/extension/permission-gate.mjs` · `agent-tools/child-permission.mjs` |
| hooks | `src/hooks.mjs` | —（零 `runHooks`） |
| 工作区约定（技能 / 规则 / 同伴 / 台账） | —（另档） | → `docs/core/design/WORKSPACE.md` |
| 推理档位 / 模型引用 | `src/auto-think.mjs` · `model-ref.mjs` | `src/extension/reasoning-mode.mjs` · `src/config.mjs`（模型引用解析段） |
| 探索蒸馏 | `thincoder-core/explore-distill.mjs` | 同名（同路径对） |
| token 台账 | `src/agent-tools/design-token.mjs` · `src/token-ttl.mjs` | `src/agent/agent-state.mjs` · `agent/tool-gates.mjs` |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 76 | `explore-distill.mjs` | 同路径 | 0.5247 · 异 | ② | 进核 | 融合：取一侧 + 截断取 VSC 的 UTF-16 安全切片〔**截断面已退役**——2026-09-18 蒸馏前缀批（`safeSliceUTF16` 引用随序列化面删除）；现体 = 会话续写（单源构造 `buildCompressMessages`——核 `thincoder-core/explore-distill.mjs:98-100`）〕 | 分叉 ＝ 截断实现（CLI 裸 slice `thincoder-core/explore-distill.mjs:80` / VSC `safeSliceUTF16` `:82`——时点坐标，两处截断面均随 2026-09-18 批退役）+ 就地改写 vs 返回新值；前提 ＝ 无 | — | S1（建核补齐） |
| 78 | `agent.mjs` | 同路径 | 0.0883 · 异 | ③ | 进核 | 以 CLI 为准（主循环本体）+ VSC 的 onToken 三态门 / 帧回调 / 空响应内联重试并入 | 分叉 ＝ 分层方式 + **一处配置面缺口**（`agent.streamRules` 在 VSC 全仓零消费方——VSC `src/**` 0 命中；CLI `thincoder-core/agent.mjs:237`）+ 中断时入历史的工具结果不同（CLI 丢弃 + 占位 `:387` / VSC 保留真实结果 VSC `thincoder-vscode/src/agent.mjs:342-350`） | **①②** | S1（建核补齐） |
| 94 | `agent-tools/subagent-scheduler.mjs` | 同路径 | 0.1914 · 异 | ② | 进核 | 融合：取 CLI 队列实现 + VSC 的跨 `runAgent` 存活载体面按核内结构归一 | 分叉 ＝ 队列载体（CLI 独立数组 / VSC 池 Map 插入序）与 AUTO 判定取词；域上限、依赖语义、位置计算同规格 | — | S1（建核补齐） |
| 98 | `agent-tools/async-settle.mjs` | 同路径 | 0.0819 · 异 | ② | 进核 | 融合：取 CLI（中止守卫 + 取消提醒落点 + `TURN_CAP_MARK` 常量）+ VSC 的 interrupt 豁免面按端注入 | 分叉 ＝ 载体 / 守卫口径 / 提醒落点 / 事件名（`advisor:done` vs `child:done`）+ VSC 把 turn cap 文案写成字面量（`src/agent-tools/async-settle.mjs:143`）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 99 | `agent-tools/subagent.mjs` | 同路径 | 0.0447 · 异 | ③ | 进核 | 以 CLI 为准（含 `panel` 动作）+ VSC 无 panel 属**有意端差**（其载荷面在 VSC 不存在 ⇒ ④ 段以注入剔除） | 分叉 ＝ 动作枚举（CLI 八动作 / VSC 七动作、有意无 `panel` `src/agent-tools/subagent-spec.mjs:11-12`〔该端档已退役——W12 删除集；现体 = `thincoder-core/agent-tools/subagent.mjs`〕）；前提（`panel` 依赖 CLI TUI 展示面）仍成立 ⇒ ④ 段 | **①** | S1（建核补齐） （迁移期引文） |
| 100 | `agent-tools/subagent-actions.mjs` | 同路径 | 0.0407 · 异 | ② | 进核 | 融合：动作执行器按核内单一切分归位（含 `cancel` 归属） | 分叉 ＝ 纯文件分工（CLI 的 `cancel` 在 `subagent-async.mjs` / VSC 在 `subagent-actions.mjs`）+ VSC 的 advisor 评审取消路由；`status`/`observe`/`send` 语义同规格 | — | S1（建核补齐） |
| 101 | `agent-tools/advisor-async.mjs` | 同路径 | 0.0378 · 异 | ② | 进核 | 融合：取 CLI 拆分（settle 记账 / token 组外提）+ VSC 的会话槽台账写入面归位 | 分叉 ＝ 拆分粒度与落盘路径（CLI 走 token 清理 + slot 权威台账模块 / VSC 直写 slot）；容量拒超 / 取消 / 陈旧判定同规格 | — | S1（建核补齐） |
| 102 | `agent-tools/subagent-async.mjs` | 同路径 | 0.0204 · 异 | ② | 进核 | 融合：异步机械按核内单一切分归位（含 §18 审计门 / `collectSettledAsync` 落点） | 分叉 ＝ 切法不同（CLI 的 `cancel` 执行器在此 / VSC 在 `subagent-actions`；VSC 审计门与 collect 留此档）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 103 | `agent-tools/subagent-run.mjs` | 同路径 | 0.0135 · 异 | ② | 进核 | 融合：**同名不同物**——两端两份能力**分别**归位（CLI = 异步 spawn 执行器；VSC = 子代理 `runAgent` 闭环） | 分叉 ＝ 文件名复用而实体不同（CLI `executeAsyncSpawn` `src/agent-tools/subagent-run.mjs:47-204` / VSC `runChild` `:18-205`）；核内分别落位（CLI 侧对应 VSC `subagent-async.mjs` 的 `spawnAsyncSubagent`） | — | S1（建核补齐） |
| 111 | `thincoder-core/agent/run-stages.mjs` | 同路径 | 0.0709 · 异 | ③ | 进核 | 以 CLI 为准（Stop 钩子 + 收尾编排）+ VSC 的 guard 推回 / 蒸馏发射面按核内结构归位 | 分叉 ＝ 文件职责划分 + 两处行为（CLI 跑 Stop 钩子 `thincoder-core/agent/run-stages.mjs:131-140`、VSC 全仓零 `runHooks`；中止时 CLI 清空子代理池 `:168-169` / VSC 只清已死 `thincoder-vscode/src/agent/run-stages.mjs:296-297,312-313`——**2026-09-15 批 4 已归一：中止清池 → 只清已死 + 墓碑 + 一条整批提醒，见 `AGENT-LOOP-SUBAGENT.md` §6.20**） | **①** | S1（建核补齐） |
| 112 | `thincoder-core/agent/setup.mjs` | 同路径 | 0.0532 · 异 | ③ | 进核 | 以 CLI 为准（装配顺序与注入块）+ 端差注入：VSC 编辑器上下文 / 按模型能力的 `read_image` / 每轮惰性 MCP 扩工具 | 分叉 ＝ VSC 拆 `context-injections.mjs` + 三处挂载条件不同（`read_image` 按多模态 `thincoder-vscode/src/agent/setup.mjs:199`；`settings` 只挂 depth0 `:141`；召回限 depth0 且 `!autoTurn`）；前提（两端同装配面）成立 | **①** | S1（建核补齐） |
| 113 | `thincoder-core/agent/setup-reminders.mjs` | 同路径 | 0.0453 · 异 | ② | 进核 | 融合：取并集 + VSC 编辑器上下文 / 贴图指引按端注入（④ 段） | 分叉 ＝ VSC 独有两条注入（编辑器上下文 · 贴图指引 `thincoder-vscode/src/agent/setup-reminders.mjs:216-223`）+ 提示语同套；前提（贴图依赖宿主）仍成立 | — | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 149 | `src/agent/dispatch.mjs` ↔ `src/agent/execute-tools.mjs` + `src/agent/tool-gates.mjs` | ② | 融合：两阶段执行 + 前置门禁按核内结构归位 | 分叉 ＝ 拆分（VSC 拆 tools / gates —— `tool-gates.mjs:2-6` 自述「自 execute-tools.mjs verbatim 迁出——零语义」）⇒ 前提成立 | — | S1（建核补齐） |
| 150 | `thincoder-core/agent/helpers.mjs` ↔ `src/agent/run-helpers.mjs` | ② | 融合：核内单一工具函数面 | 分叉 ＝ 档名（helpers / run-helpers）；VSC `context-injections.mjs:11` 自述「CLI 对位 `thincoder-core/agent/helpers.mjs:275-348`」⇒ 前提成立 | — | S1（建核补齐） |
| 151 | `src/agent/post-turn.mjs` ↔ `thincoder-vscode/src/agent/setup-reminders.mjs` + `agent.mjs`（内联） | ② | 融合：回合后记账（计时器 / 提醒 / 停滞检测 / goal 追踪）按核内结构归位 | 分叉 ＝ 落点（VSC 住 setup-reminders / 主循环内联——`thincoder-vscode/src/agent.mjs:351` 自述「ported from CLI post-turn」）⇒ 前提成立 | — | S1（建核补齐） |
| 152 | `src/agent/spawn-child.mjs` ↔ `src/agent-tools/subagent-run.mjs` | ② | 融合：子运行器按核内结构归位（含 `_capturedOutput` 额度面） | 分叉 ＝ 文件名复用而实体不同（VSC 该档 = `runChild` 闭环 `:18-205`）；**承 §2.5 #103** | —（承 #103） | S1（建核补齐） |
| 153 | `src/agent/completion.mjs` · `record-results.mjs` · `relay-prefix.mjs` ↔ 核内（VSC 内联） | ② | 融合：按核内结构归位（完成守卫 / 结果提交与记账 / 前缀续写切片） | 分叉 ＝ 拆档（VSC 内联于主循环）；守卫语义两端同（`completion.mjs` 三守卫 / 配对关闭 / UTF-16 安全切片）⇒ 前提成立 | — | S1（建核补齐） |
| 154 | `src/agent-tools/design-token.mjs` + `src/token-ttl.mjs` ↔ `src/agent/agent-state.mjs` + `src/agent/tool-gates.mjs` | ② | 融合：token TTL / 会话槽台账按核内结构归位 | 分叉 ＝ 落点（CLI 独立档 / VSC 住 agent-state · tool-gates）；两端同 token 格式（`uuid:expiresAt`）与 fail-closed 口径 ⇒ 前提成立 | — | S1（建核补齐） |
| 155 | `src/agent-tools/escalate-async.mjs` ↔ `src/agent-tools/subagent-escalate-async.mjs` + `subagent-escalate.mjs` | ② | 融合：异步飞刀引擎按核内结构归位 | 分叉 ＝ 档名与拆分（VSC 拆 sync / async 两档）；同池（「other」域）/ 同 ack 形态 ⇒ 前提成立（VSC 两档已退役——W12 删除集；现体 = `thincoder-core/agent-tools/escalate-async.mjs` + `subagent-actions.mjs`） | — | S1（建核补齐） （迁移期引文） |
| 156 | `src/agent-tools/recent-changes.mjs` ↔ `src/agent-tools/recent_changes.mjs`（W9 已迁核——核内单源，本端镜像已删） | ② | 融合：取一侧（工具名 `recent_changes` 两端同） | 分叉 ＝ 档名连字符 / 下划线 + `readonly` 标记；工具语义同（本轮已读）⇒ 前提成立 | — | S1（建核补齐） （迁移期引文） |
| 157 | `src/agent-tools/subagent-spawn.mjs` ↔ `src/agent-tools/subagent-spawn-gate.mjs` | ② | 融合：spawn 门禁按核内结构归位 | 分叉 ＝ 档名与拆分；VSC `:136` 自述「CLI 同构面；CLI 执行器在 agent-tools/subagent-spawn.mjs」⇒ 前提成立（VSC 自持档已退役——W12 删除集；现体 = `thincoder-core/agent-tools/subagent-spawn.mjs`） | — | S1（建核补齐） （迁移期引文） |
| 158 | `src/agent-tools/advisor-settle.mjs` ↔ 核内（VSC 侧住 `advisor-async.mjs`） | ② | 融合：advisor settle 记账 / 变更日志 / 陈旧判定按核内结构归位 | 分叉 ＝ 拆档（VSC 未拆；**同路径对 #101 的另一半**）⇒ 随 #101 处置 | —（承 #101） | S1（建核补齐） |
| 165 | `thincoder-cli/src/cli/permission.mjs` ↔ `src/extension/permission-gate.mjs` | ② | 融合：权限闸按核内结构归位 + 展示面按端注入 | 分叉 ＝ 目录与展示形态（TUI 卡 / webview 卡）；闸语义（每回合 `autoApprove` 快照 + 中途 live 标志）同 ⇒ 前提成立 | — | S1（建核补齐） |
| 166 | （CLI 无独立档）↔ `src/agent-tools/child-permission.mjs` | ② | 融合：子代理权限通道按核内结构归位（父卡归属 + 定向 signal） | 分叉 ＝ 拆档（VSC 独有拆面）；**承 §2.5 #112（装配）/ §2.12.1 事件语义面** | —（承 #112） | S1（建核补齐） |
| 169 | `src/hooks.mjs` ↔ 核内（VSC 侧零 `runHooks`） | ③ | 以 CLI 为准（Stop 等四事件）——VSC 接线后开始触发（外部副作用随 #111 登记） | 分叉 ＝ VSC 未实现（零命中）；**承 §2.5 #111** | —（承 #111） | S1（建核补齐） |
| 175 | `src/auto-think.mjs` ↔ `src/extension/reasoning-mode.mjs` | ② | 融合：核内自动难度分级 + 端侧推理档位面——**端侧自有 · 经 provider 字段数据面**（UI 下拉 / 档位 patch；核内无需位——2026-09-15 裁定） | 分叉 ＝ 落点（CLI 自动难度分级 / VSC UI→provider 字段映射）；VSC DEFAULTS 已载 `autoThink`（`thincoder-vscode/src/config-io.mjs:319`）但**全仓无消费方** ⇒ 归一后接线（默认 `false` ⇒ 默认无行为变化） | **②**（丁组 D2） | S1（建核补齐） |
| 176 | `src/model-ref.mjs` ↔ `src/config.mjs`（模型引用解析段）+ `specs.mjs` | ② | 融合：核内单一 `provider:model` 解析 | 分叉 ＝ 落点；解析口径（首冒号切分 / 双段非空 / 显式 `p:m` 一律放行）两端同源 ⇒ 前提成立 | — | S1（建核补齐） |
| 184 | `thincoder-vscode/src/extension/suspension.mjs` ↔ `src/tui/suspension-drive.mjs` | ② | 融合：挂起 / 唤醒机制按核内结构归位（池载体按端注入） | 分叉 ＝ 目录（CLI 住 `tui/`）；VSC 头注自述「与 CLI 的结构差异（同语义移植）——CLI 的池 / pending / _suspended 挂 agent 对象」`:9` ⇒ 前提成立 | — | S1（建核补齐） |

### 2.3 #184 挂起 / 唤醒——核内形态（设计定案 · 2026-09-14 · S1 续轮执行面）

**回指**：#184（§2.2——「融合：挂起 / 唤醒机制按核内结构归位（池载体按端注入）」）。
**现状**：CLI 面住 `thincoder-cli/src/tui/suspension-drive.mjs`（299 行）；VSC 面住 `thincoder-vscode/src/extension/suspension.mjs`（362 行——头注自述「与 CLI 的结构差异（同语义移植）：CLI 的池 / pending / `_suspended` 挂 agent 对象（跨 run 存活）」）。
两面语义同源（挂起状态机：池 live → 挂起；用户输入优先 → 消化轮 → 池空退出）、差异面 = **载体**与**呈现** ⇒ 按「机制归核 + 注入面」落核（非机械随迁——故 S1 报告列为未完成面）。

**核内模块**：`thincoder-core/agent/suspension.mjs`（新档 · **已落 2026-09-14——234 行**（原估 +170±40 行被实际取代）· ≤300 软线）。
内容 = 挂起状态机：池 live 判据 · 竞态清扫（settle 未及移交 → pending）· 主循环（用户输入优先 → pending 消化轮 → 池空退出 → 等待 settle / 唤醒）· 消化轮驱动 · 唤醒栓 · 退出清场（abort = 清池不注入 / idle = 残余直注入）。**核内零文案、零渲染、零端名分支**（契约 5 / 10）。

**接口**：`startSuspension(ctx)` 同步返回句柄 `{ pushInput(msg) · wake() · done }`；宿主 `await handle.done` ⇒ `{ reason, residualInput }`（替代两端现行的 `state._suspWake` / `panel._suspWake` 共享字段单槽与 pendingInput 数组直写——宿主改持句柄引用）。

**注入面（池载体如何注入——ctx）**：

| seam | 内容 | CLI 装配（S2） | VSC 装配（S2） |
|---|---|---|---|
| `carrier` | 池 / pending / 标志载体对象——字段集 = 核内异步面现行口径（`_asyncSubagents` · `_asyncAdvisors` · `_consultSessions` · `_pendingAsyncResults` · `_suspended` · `_asyncQueue` · `_asyncAdvisorQueue` · `_asyncTombstones` · `_asyncWaiters` · `_advisorRuns` · `_mutLog` · `_childUpstream` · `_childUpstreamSeq`——2026-09-14 补正五款 + 2026-09-17 af 批补一款 + 2026-09-19 上行通道批补两款，见下「载体字段集与回写义务」） | 传 `agent`（现形——核内已迁异步面同持此形） | 传 depth-0 `history`（现形——池 / pending / 标志全挂 history） |
| `runTurn(text, opts)` | 回合执行器（digest = `{ autoTurn: true, text: "" }`） | 注入 `runAgentTurn` 包装（函数级静态环消失——驱动器不再 import `agent-turn`） | 注入 `entry.runTurn`（现形） |
| `abortSignal` | 会话中止信号（兜底监听） | `agent._sessionAbort.signal`（现形） | `susp.abort.signal`（现形） |
| `hooks.onCounts(counts)` | 计数变化通知（`{ running, queued, pending, done }`） | 组合状态行文本 + `render()` + 1s tick 重绘（现 `backgroundStatusText` + `setInterval`） | `suspension` 消息 + `_publishTurnState`（现 `postSuspension`——文案由 webview 按 locale 组合） |
| `hooks.onDigest(phase, counts)` | 消化轮边界（start / end） | `pushLine("[auto-turn: …]")` + `digest:*` 日志 | webview `{ type: "digest", status }`（现形） |
| `hooks.reclaim(consumed)` | 消化后块回收（不等池空） | `freezeReclaimDigestedBlocks`（`thincoder-cli/src/tui/subagent-blocks.mjs`） | `reclaimDigestedBlocks`（postMessage done——现形） |
| `hooks.freezeAll()` | 退出冻结（兜底残项） | `freezeAllSubTasks` + `sweepToolBlocks`（`thincoder-cli/src/tui/subagent-blocks.mjs` · `thincoder-cli/src/tui/tool-events.mjs`） | `postSuspensionEnd(panel, { freeze: true })`（现形） |
| 唤醒 / 入槽 | `handle.pushInput(msg)` + `handle.wake()` | Enter → `pushInput`；Ctrl+C → 中止 | `routeUserTurn` 拒收 busy + `_chat` → `pushInput`（现形） |
| 退出回执 | `{ reason: "idle" \| "aborted", residualInput }` | abort 残余 → `state.queue` + 提示行（现形） | abort 残余 → 退出后以普通回合消费（现形） |

**载体字段集与回写义务（2026-09-14 补正轮定 · S2 接线前）**：

- **字段集**（核内异步面现行口径——五轮补正：原五字段 + 六款 + 二款〔§6.27 上行通道面〕）= `_asyncSubagents` · `_asyncAdvisors` · `_consultSessions` · `_pendingAsyncResults` · `_suspended` ·
  **`_asyncQueue`**（排队容器）· **`_asyncAdvisorQueue`**（评审排队容器——ED-4；2026-09-17 af 批补入）· **`_asyncTombstones`**（终态墓碑）·
  **`_asyncWaiters`**（唤醒栓注册表）· **`_advisorRuns`**（评审实例注册表）· **`_mutLog`**（变更日志——VSC 对位名 `_fileMutEvents`）·
  **`_childUpstream`**（子→父在飞消息队列——§6.27 上行通道）· **`_childUpstreamSeq`**（其单调计数）——2026-09-19 本批补入（§6.27.2 早已按「载体字段集」引用两款，本表当时未同步，本批对齐）。
  容器类型：三池 / 墓碑 / 评审实例注册表 = `Map`，队列 / pending / 唤醒栓注册表 / 变更日志 = 数组，`_suspended` = 布尔。
  **全集结论（2026-09-19 上行通道批复核）**：**13 款**即全集——本轮补两款 = `_childUpstream` / `_childUpstreamSeq`（§6.27 上行通道；2026-09-19 本批同步，前批只在 `AGENT-LOOP-SUBAGENT.md` §6.27.2 以「同列」引用）；2026-09-14 的「10 款」结论**已被 ED-4（评审池排队）推翻**——新增款 = `_asyncAdvisorQueue`（评审排队容器——与 `_asyncQueue` 同列，两端写侧同形）。
  核实证据 = `thincoder-core/agent-tools/advisor-async.mjs:414`（写）/ `:264-271`·`:295`（读）+ 2026-09-17 af 批探针（部分 parent 下 `dequeue` no-op ⇒ 已取消评审被补位重启）。
- **回写义务（谁写 · 何时写）**：容器类字段（三池 / 队列 / pending / 墓碑 / 唤醒栓注册表 / 评审实例注册表 / 变更日志）的新建 / 借用**只在首次使用的核内单点发生**，并与首次使用**同步**（先落容器后使用——无「已使用未回写」窗口）；写入落**父对象字段**，且须使容器经 `carrierField(parent, 字段)` 与 `parent[字段]` 两条读取路径命中**同一容器**（不另起分叉）。
  - **借用规则**：父对象缺而载体（`history`）有 ⇒ **借用同一容器**（不另建）；两处皆无 ⇒ 就地新建。已按「借用 / 新建」落核的单点：
    pending = `parkAsyncPending`（`thincoder-core/agent-tools/async-settle.mjs:116-122`）· 墓碑 = `writeTombstone`（同档 `:61-72`）· 上行队列 = `upstreamHolder`（`thincoder-core/agent-tools/parent-channel.mjs:67-80`——父字段优先 / 载体命中即借用 / 皆无则建在父字段 + 载体别名）。
  - **唤醒栓注册表三处操作**（`_asyncWaiters`）：注册 = `thincoder-core/agent/suspension.mjs:133`（进入等待即 `carrier._asyncWaiters ??= []` + `push(onSettle)`——首用单点、同步落容器）· 摘除 = 同档 `:121-122`（cleanup `indexOf` / `splice`）。
    兑现 = **核单点 `wakeAsyncWaiters(parent)`**（`thincoder-core/agent-tools/async-settle.mjs`——`splice(0)` 全量唤醒并清空；**两处调用** = settle 公共尾 `:281` +
      上行 ask 入队尾〔`agent-tools/parent-channel.mjs`——2026-09-19 F-UC7 批，见 `AGENT-LOOP-SUBAGENT.md` §6.27.12〕）——`carrier._asyncWaiters`（挂起侧）与 `parent._asyncWaiters`（结算侧）两径经绑定不变式命中同一容器。
      （**实现已落地**：`agent-tools/async-settle.mjs:296-299` 定义（settle 公共尾 `:281` 改调同函数）+ `agent-tools/parent-channel.mjs:115` ask 入队尾唤醒；父侧直接执行 · 可 revert）
  - **评审实例注册表**（`_advisorRuns`——`Map`）：读取（不建）= `thincoder-core/agent-tools/advisor-async.mjs:68-71`（经 `carrierField`）；首用单点（建）= 同档 `:73-83`（无既有容器时创建，落 `agent.history ?? agent`——有载体直接落载体、无则落父对象字段；与首次使用同步）。
    重置写点 = `thincoder-core/agent-tools/eng.mjs:57` / `:75`（模式切换重建空 Map 落父对象字段——**勘定（VSC 形）**：替换写不触载体，重置的跨 run 保持 = S2 装配对位登记项）。
    形态钉于核测 = `thincoder-core/test/advisor-consult-merge.test.mjs:29-56`（有载体 ⇒ 建在载体上、不在父对象旁建第二份；父对象自有 ⇒ 父对象优先）；VSC 现役 = `thincoder-vscode/src/agent-tools/advisor-async.mjs:64-72`（`advisorRunsMap`——history 载体）。
  - **变更日志**（`_mutLog`——数组 · ≤200 环；**VSC 对位名 `_fileMutEvents`——名差登记**）：书写点 = `thincoder-core/agent-tools/advisor-settle.mjs:42-49`（`noteMutations`——`agent._mutLog ??= []` 同步落父对象字段）；读点 = 同档 `:58`（陈旧判定）· `thincoder-core/agent-tools/escalate-async.mjs:47`（飞行重叠判定）。
    调用面 = `thincoder-core/agent/dispatch.mjs:129`（回合写执行成功即记账）· `thincoder-core/agent-tools/subagent-async.mjs:424`（子代理合入）；VSC 现役对位 = `thincoder-vscode/src/agent-tools/advisor-async.mjs:83-85`（写）· `:118`（读——同经 `parent.history ?? parent`）。
  - **队列 / 三池 / 唤醒栓注册表 / 变更日志的新建点均无借用步**：`thincoder-core/agent-tools/subagent-run.mjs:51-52` · `thincoder-core/agent-tools/escalate-async.mjs:149-150` ·
    `thincoder-core/agent-tools/advisor-async.mjs:268` · `thincoder-core/agent-tools/consult.mjs:417` · `thincoder-core/agent/suspension.mjs:133` · `thincoder-core/agent-tools/advisor-settle.mjs:46`（`??=` 形态）——绑定不变式下不可观测（勘定注）。
- **VSC 跨 run 存活面 = 端装配绑定不变式**（S2 装配义务——`_asyncQueue` / `_asyncAdvisorQueue` / `_asyncTombstones` / `_asyncWaiters` / `_advisorRuns` / `_mutLog` 同列）：run 起始对**全部 13 字段**成立
   （VSC 端壳载体表 `thincoder-vscode/src/agent.mjs:36-40` 含 `_childUpstream` / `_childUpstreamSeq`（载体 14 款 · **实现已落地**）；细则见 `AGENT-LOOP-SUBAGENT.md` §6.27.12.12）（父侧直接执行 · 可 revert）——`history` 有容器 ⇒ 绑到 `agent` 字段；`history` 缺 ⇒ **先在 `history` 侧补建**再绑（新建回写载体的落点——否则新建落 per-run `agent`、跨 run 断裂）。
- **验收**：见验收点 2 扩展（「不预置载体字段」夹具——机制须自建容器、同组断言与预置形同值）。

**端特有面（④ 段——不归核）**：

1. CLI：状态行文本与 1s tick 重绘 · `[auto-turn: …]` 提示行 · Enter / Ctrl+C 键位路由 · 中止残余转 `state.queue` 的处置与提示行 · TUI 块冻结 / 回收（`thincoder-cli/src/tui/subagent-blocks.mjs` · `thincoder-cli/src/tui/tool-events.mjs` 面）。
2. VSC：`suspension` / `digest` 消息族与 counts 广播 · 文案由 webview 按 locale 组合 · `routeUserTurn` busy 拒收 + loading 锁 · 面板生命周期（dispose 统一中止——`abortControllers` 快照）· webview 块归档回收 · 退出后残余以普通回合消费。
3. 共同（端差随核内异步面归一后消失）：`_suspended` 标志的读取方（settle 分流）住核内异步面——载体归一后零端差。

**验收点（S1 续轮）**：

1. 落核 + 核测试状态机用例（假 carrier / 假 runTurn / 假 hooks 纯 Node 驱动——不加载端模块，T-C4 / N3）：池空直退 · pending 触发消化轮 · 用户输入优先 · abort 清池不注入 · idle 残余注入 · 唤醒栓双路（settle / wake）。
2. **载体双夹具**：CLI 形（`agent` 字段对象）与 VSC 形（`history` 字段对象）各跑同组断言——证明「池载体按端注入」成立（机制对载体零预设，除上表字段集）；**并各补一组「不预置载体字段」夹具**（池 / 队列 / pending / 墓碑 / 唤醒栓注册表 / 评审实例注册表 / 变更日志 / 上行队列全空缺——字段集 13 款全无预置）：机制须**自建容器**且同组断言与预置形同值（防「两端各自预置才碰巧能跑」——见上「载体字段集与回写义务」）。
3. 核内零端名分支 / 零文案：`suspension.mjs` 无产品名、无状态行文案字面量（grep 零命中——契约 5 / 10）；零 TUI / 宿主依赖（N3——既有 `core-hygiene` 机检覆盖）。
4. **依赖顺序（硬）**：本行与异步机械族的 VSC 侧融合（#98 / #101 / #154 等——清扫 / 计数读法 = 核内异步面单一实现的下游）同批或先后紧邻；先定异步面载体口径，再落本行（池队列表示随 #94 融合收敛——本行不重复裁决）。
5. 行为面：核内零消费方阶段只测内核；S2 接线后按面内裁决口径验收（A10）；**S1 段两产品一行不改**（T-C12）。S2 时两端驱动档退化为**薄适配**（ctx 装配 + 端侧钩子 + 键位 / 消息路由）。

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A7 | `agent.mjs`（#78） | ①② | 读 `config.agent.streamRules` 传给模型（`thincoder-core/agent.mjs:237`）；中断时丢弃工具结果并写占位（`:387`） | `streamRules` **全仓零消费方**（VSC `src/**` 0 命中，本端 PARITY 批亦登记为缺口）；中断时保留真实工具结果（`thincoder-vscode/src/agent.mjs:342-350`） | 以 CLI 为准（主循环本体）+ VSC 的 onToken 三态门 / 帧回调 / 空响应重试并入 | ① CLI 能配的流规则在 VSC 不生效（现状）⇒ 归一后生效；② 中断时模型所见的历史内容不同 | **已裁（2026-09-13）· 按建议** |
| A15 | `agent-tools/subagent.mjs`（#99） | ① | 八动作（含 `panel`） | 七动作——**有意无 `panel`**（`subagent-spec.mjs:11-12`，其载荷面在 VSC 不存在；该端档已退役——W12 删除集） | 以 CLI 为准（保留 `panel`）+ VSC 端按端差**不注入**该动作 | ① VSC 的 `subagent` 动作集不变（`panel` 仍无）；CLI 不变——本行只登记端差合法性与注入位 | **已裁（2026-09-13）· 按建议** （迁移期引文） |
| A22 | `thincoder-core/agent/setup.mjs`（#112） | ① | 每轮装配全内联；`read_image` **恒在**注册表；子代理继承含 `settings` 的工具集；文档 / 记忆召回只受 `!resume` 约束（未按 depth 门控） | 拆 `context-injections.mjs`；`read_image` 仅当模型多模态（`:199`）；`settings` 只挂 depth0（`:141`）；召回限 depth0 且 `!autoTurn`；每轮惰性把 MCP 扩成原生工具 | 以 CLI 为准（装配顺序与注入块）+ 端差注入（编辑器上下文 · 按模型能力的 `read_image` · MCP 扩工具时机） | ① VSC 非多模态模型仍没有 `read_image`（端能力，保留）；② 子代理的 `settings` 工具与记忆召回门控归属（CLI 子代理上下文更肥 vs VSC 更瘦） | **已裁（2026-09-13）· 按建议** |
| A23 | `thincoder-core/agent/run-stages.mjs`（#111） | ① | 收尾跑 **Stop 钩子**（`:131-140`）；中止时**直接清空**异步子代理池与评审池（`:168-169`——**2026-09-15 批 4 已归一：中止清池 → 只清已死 + 墓碑 + 一条整批提醒，见 `AGENT-LOOP-SUBAGENT.md` §6.20**） | **全仓零 `runHooks`**（无 Stop 钩子）；中止时只清**已死**条目（`:296-297,312-313`） | 以 CLI 为准（Stop 钩子 + 收尾编排）+ VSC 的 guard 推回 / 蒸馏发射面按核内结构归位 | ① 归一后 VSC 侧是否开始触发 Stop 钩子（外部副作用）；② 按中断时后台子代理是「被清」还是「被留」⇒ 结果可见差异 | **已裁（2026-09-13）· 按建议** |

**未并入项登记（A7 / #78 · 2026-09-14）**：VSC 的「仅 reasoning ⇒ 视为 content」分支（无 tool calls ∧ `content` 空 ∧ `reasoning` 非空 ⇒ 以 reasoning 填 content——`thincoder-vscode/src/agent.mjs:269-290` 内 `:271-273`）**未并入核内**（核内对应面 = `thincoder-core/agent/completion.mjs:31` 空响应重试径——无该分支）。
原 A7 归一形态清单未列此项、建核亦未并入 ⇒ **非偏离**；登记为**未并入项结论**（后续处置待定）。

### 3.2 丁组（S0b 语义对位遍新增）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| D2 | `src/auto-think.mjs` ↔ `src/extension/reasoning-mode.mjs`（§2.5 #175） | ② | 自动难度分级 → 推理档位（`config.agent.autoThink` 为开关，CLI 有消费方） | VSC DEFAULTS **已载** `autoThink`（`thincoder-vscode/src/config-io.mjs:319`）但**全仓零消费方** ⇒ 该键在 VSC 是**死键** | **建议（方向唯一）**：核内实现 + VSC 接线（死键恢复语义）；默认 `false` ⇒ **默认无行为变化**；面板推理档位面**端侧自有 · 经 provider 字段数据面**（核内无需位——2026-09-15 裁定） | ① 在 VSC 显式设过 `autoThink: true` 的用户：该键从「无效」变「生效」（行为变化，但 = 恢复 CLI parity 的既定语义）；② 默认配置下无变化 | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**（对外事件面的兼容策略模板住 `CORE-UNIFICATION.md` §2.12.1「事件语义」类；行为面变更见上文各行「影响面」列）。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）** · **对外契约兼容面（S0 登记 / S2 落地）**。
**核内落点行数（R24a · S1 落地收正）** → §2.8.1「核内逐档行数与拆分计划」（本子系统面：`thincoder-core/permission.mjs`（#165）· `thincoder-core/undo-stack.mjs`（#149——#180 收正））。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/AGENT-LOOP.md`（1786 行 · CLI 产品档）——根层裁定后该档 = **迁移期参照历史**（只读 · 不维护 · 不参与内容同步）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：已作废 / 旧结构叙述（(d) 类）· 跨板块内容（轨迹 / 会诊 / 飞刀 / 提示词 / 工程模式 / 评审收敛）· 一次性批次材料（用例表 / AC 表 / 变更记录 / 批次叙述）· 旧档「未决状态行」（live 跟踪面归台账）。
> **坐标口径** = as-of 2026-09-14（承旧档 · CLI 侧迁移单元 U1–U16 已落 ⇒ 机制实现面住 `thincoder-core/**`，CLI 树留壳体面 `thincoder-cli/src/**`）；符号名与档路径为契约面，**行号未逐条复核**、仅供定位。
> **§6.7–§6.12 已拆出**（2026-09-15 批 5）→ `docs/core/design/AGENT-LOOP-SUBAGENT.md`（节号沿用）；本档续 §6.1–§6.6 + §6.13–§6.17。

### 6.1 模块地图（职责面）

| 模块 | 职责 |
|---|---|
| `thincoder-core/agent.mjs` | `runAgent` 主循环：prepareRun → turn 循环 → chat → 分发 → 后处理；`ContinueError` / resume；usage 基线；回合收尾（`collectSettledAsync`） |
| `thincoder-core/agent/setup.mjs` | prepareRun：上下文注入（git / 目录 / 指令 / 记忆 / 文档 / outline）、system prompt 组装、阈值解析、角色工具面装配（改调家族单源 `family-tools.mjs`） |
| `family-tools.mjs`（新档——落 `thincoder-core/agent/`） | 家族矩阵单源：`assembleFamilyTools`——task/plan/timer 固定段 + depth 家族 / 角色段；端差经 `decorate` 注入（CLI 与 VSC 同调） |
| `thincoder-core/agent/dispatch.mjs` | `executeToolCalls`：两段调度（权限预审 → 顺序保序执行）、hooks、错误落盘、action 级门控、批权限合并 |
| `thincoder-core/agent/completion.mjs` | `handleCompletion`：零工具调用回合的 guard 链 |
| `thincoder-core/agent/post-turn.mjs` | 回合后注入：停滞检测、goal 预算预警 |
| `thincoder-core/agent/helpers.mjs` | 常量（turn 上限、结果落盘阈值）、`escapeXml`、`repairHistory`、`AUTO_REMINDER` 单源、git 上下文、目录树 |
| `thincoder-core/agent/record-results.mjs` | 工具结果提交 + 变更记账：tool 消息落盘、`FILE_MUTATORS` 失效链、`_touchedFiles` + `noteMutations` |
| `thincoder-core/agent/spawn-child.mjs` | 子代理统一管线：`makeRelay` / `wrapChildCallbacks` / `runWithContinue` / `ensureChildApiKey` / `clampEffort` / `⟦ev⟧` strip / 嵌套 done·stopped 补发射 |
| `thincoder-core/agent/run-stages.mjs` | 回合阶段骨架 / abort 分支 / pending 单容器过滤 / `finalizeAgentTurn`（收尾单点） |
| `thincoder-core/agent/suspension.mjs` | 挂起 / 唤醒状态机（核内形态与载体契约见 §2.3） |
| `thincoder-core/auto-think.mjs` | 任务难度分类 → 自动设置 reasoning effort（opt-in） |
| `thincoder-core/agent-tools/subagent*.mjs` | subagent 工具：spawn / status / observe / send / escalate / cancel / panel 动作面、async 池、调度器、审计任务书；`subagent-panel.mjs` = 面板执行器 |
| `thincoder-core/agent-tools/async-settle.mjs` | async 结果容器统一共享 helper：`settleAsyncEntry` / `getAsyncPool` / `parkAsyncPending` / `parentAborted` 守卫 / `buildChildSignal` |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 任务调度器：`normalizeFileList` / `filesOverlap` / `depInfo` / `queueRunnable` / `assertNoDepCycle` / 停滞检测 |
| `thincoder-core/agent-tools/advisor*.mjs` | advisor 工具（async 面见 `AGENT-LOOP-SUBAGENT.md` §6.10） |
| `thincoder-cli/src/tui/**` | TUI 渲染 / 交互（CLI 壳体面——显示面细节另档） |

### 6.2 主循环（`runAgent`）与中断语义

```
runAgent(agent, input, callbacks, { depth, signal, maxTurns, resume, autoTurn, suspDriven })
```

1. **prepareRun**（§6.3）。
2. **非 resume 时重置 per-run 状态**（mutation / verify / advisor / touchedFiles / emptyRetries / compressFailures / autoThink；`_inheritedGuard` 例外）。
3. **turn 循环**（≤ `maxTurns`，默认 200；goal 模式 200；子代理 100）——每轮顺序：压缩检查（仅 `lastRole ∈ {user, tool}` 安全点）
   → plan-mode 提醒节流注入 + 工程模式状态注入 → autoThink 分类（turn 0 且配置开启）
   → `chat()`（流式；`onToken` / `onReasoning` / `onWait` 透传；`streamRules` 共享 `firedPatterns`）
   → 响应后处理（流规则 abort / warn · 用户中断 · usage 基线 · 异常 `finishReason` 提醒）
   → 有 toolCalls ⇒ `executeToolCalls`（§6.4）回喂重入；无 ⇒ `handleCompletion`（§6.5）→ done / continue。
4. **超 turn 上限 → 抛 `ContinueError`**。续跑规则：`engineering && autoApprove → 自动 resume`，否则询问是否续跑。规则适用所有回合（depth-0 用户回合 / auto-turn / depth>0 子代理）。

**`autoTurn`（无输入回合——digest 用）**：`{ autoTurn: true }` = 不 push input + per-run 状态重置 + history 尾 = 已注入的 reminder user 消息；复用 resume 的「不 push input」机制，但不绑 `ContinueError` 语义。

**`resume` 保留集**：`_mutatedThisRun` / `_verifiedThisRun` / `_verifyRetries` / `_touchedFiles` / `_advisorRound` 保留（guard 连续性与收敛预算不被续跑重置）；`_emptyRetries` / `_compressFailures` 亦保留（跨 turn 计数，防刷）。

**中断语义（`AbortController` + `signal.reason`）**：

- `controller.abort()`——**二按全停**（Ctrl+C 武装化见 `AGENT-LOOP-SUBAGENT.md` §6.8）：chat 抛 AbortError → `runAgent` 直接上抛；
  回合收尾清池分支（`aborted && !interrupt` → **只清已死条目**——`discardAbortedPool(agent)` / `discardAbortedAdvisors(agent)`）：存活 / 已 settle 条目**留池**；
  死条目写 `discarded` 墓碑 + **一条整批提醒**（`subPool?.clear()` 式无条件清已废除——`AGENT-LOOP-SUBAGENT.md` §6.20）。
- `abort({ interrupt: true, message })`（Ctrl+I）：chat 中断 → 提交部分输出 + 注入 `[User interrupt: message]` → 抛 AbortError；调用面捕获后**重建 controller 续跑**（同一轮内继续，用户消息即时生效）。
- `abort({ interrupt: true })` 无 message（Ctrl+C 首按——停回合）：注入后**不续跑**。
- **工具执行期间中断**：先为已提交的 `tool_calls` 合成占位 tool 结果（`[Tool execution interrupted — results discarded]`——tool 消息必须紧跟 assistant `tool_calls`，否则 strict provider 重试轮 400），再注入中断消息后 continue。
- **中断清扫（回合收尾 finally）**：`freezeAllSubTasks` + `sweepToolBlocks`（未 done 工具载体标 done + interrupted、清 `_toolTicks`）——无 running 残留、无陈旧计时泄漏。
- **reason 词汇表扩展**：程序性取消 / 停止 / 定时器中止站点新增 `abortTrigger` 载荷形态（各既有判据点语义零改）——枚举与站点规则见 `AGENT-LOOP-SUBAGENT.md` §6.12。

### 6.3 装配与上下文注入（`prepareRun`）

按序注入（全部 `role: "user"` 机读消息；带 `transient` 标记者落盘时过滤）：

1. **git 上下文**（顶层 `depth === 0`）：分支、最近 5 条提交、未提交改动清单（非 git 仓库静默跳过）。**子代理一律不注入**（`AGENT-LOOP-SUBAGENT.md` §6.7.4）。
2. **目录树**（顶层）：`listWorkDir`（根 ≤30 项、子目录 ≤10 项，隐藏折叠，超限截断）。
3. **项目指令**：`AGENTS.md` / `CLAUDE.md` / `project_rules.md`（≤32K 字符，`<untrusted_project_instructions>` 包裹）。
4. **记忆检索**：`memory search` 前 3 条（`<untrusted_memory>` 包裹 + XML 转义）。
5. **文档检索**：`doc_search` 前 5 条 chunk（`<untrusted_doc_chunk>` 包裹）。
6. **依赖大纲**：`repomap` 输出（`OUTLINE_INJECT_PREFIX`）。
7. **用户输入**（`pushReal`：双线）。
8. **多模态图像**（视觉模型：附加到首条 user 消息）。

**system prompt 字节稳定（前缀缓存契约——2026-09-18 精化，批 PROMPT-FACE · 台账 #23）**：**同一 agent 的相邻请求前缀逐字节相同**（= 缓存命中的操作条件）；
可入 system 的输入 = 在 agent 生命周期内逐字节稳定的那些——槽位装配（`base`）· 项目指令 · skills 清单 · **spawn 固块**（`AGENT-LOOP-SUBAGENT.md` §6.26）；
逐轮变化的记忆 / 文档 / git 注入一律走 user 上下文消息而非 system；`Session start` 时间戳每会话固定一次。有回归测试断言两次请求的 system 消息逐字节相等（同一 agent 面）。
> 精化说明：原句「跨 run 逐字节不变」是上式在「system = 槽位装配 + 项目指令 + skills」下的**充分形态**，非必要条件；spawn 固块在 child 生命周期内恒定 ⇒ 命中不破（跨 spawn 值异不构成损失——新 child 首个请求本来即缓存写）。

### 6.4 工具调度与权限（`dispatch` 两段式）

**工具轮 assistant 消息构造（回声恒带——`CONTEXT-COMPACTION.md` §7 D-CC22）**：模型回复带 `tool_calls` 时，入史消息由核单点 `assistantToolCallMessage(response, spec)`（`thincoder-core/model-specs.mjs`）构造后 `pushReal`（`thincoder-core/agent.mjs:366-376`）——`reasoningEcho:"required"` 族（deepseek / kimi / mimo）**恒带** `reasoning_content`，本轮无推理取**空串**（真机实证：空串被接受；缺字段轮服务端不再回推理）。`optional`（glm 族）/ 未声明族恒不带（行为不变）。显示面零改（`history-window.mjs` `reasoningOf` 对空串返回 null——不出幽灵帧）。**第三站点（2026-09-20 补）**：VSC 端壳自有 depth-0 循环同经本单点（`thincoder-vscode/src/agent.mjs:387-397`——端 `thincoder-vscode/src/specs.mjs` 取值 × 单点构造；端壳静态闭包含 `thincoder-core/model-specs.mjs` 且零 `node:sqlite` ⇒ 静态引合法——W8 契约②）；端侧接线事实见 §6.18 表。

**Phase 1 预审**（全部 toolCalls 先过一遍，任一被拒不影响其他）：

```
JSON 参数解析失败 → error
未知工具 → error
planMode && 非只读 → denied "plan mode"
eng-coder && 未过设计评审 && FILE_MUTATORS → denied "engineering design gate"
父 agent && 工程模式 && 无设计 token && 触及代码文件 → denied（docs/ 与根级文档豁免）
非只读 && !autoApprove → onPermissionRequest / onBatchPermissionRequest（用户确认）；无 handler → denied
PreToolUse hooks → 阻断
```

**Phase 2 执行（顺序保序）**：只读工具 + `parallel` 标记工具可并行（Promise.all 一批）；非只读工具**打断批量串行**（先 flush 再单独执行）——保证顺序语义且允许只读并行。执行前对副作用工具做 `snapshotForUndo`（`/undo` 回滚基线）。

结果超限落盘 `~/.thincoder/tool-results/`（阈值权威源 = 工具输出上限系 + `helpers.mjs` 的 `TOOL_RESULT_OFFLOAD_LIMIT`——双端预览）；错误写入 `~/.thincoder/tool-errors/`（模型只见 message + 关键参数，不见 stack trace）；PostToolUse 钩子 fire-and-forget。

**console 回显**：dispatch 拦截工具 `execute` 期间的 `console.log/error`，收集后附结果回显模型（`[console during <tool>]` 段）；异常路径同样回显；嵌套 dispatch（子代理）各自拦截 / 恢复，捕获分离；`bash` 走子进程 `onOutput` 不受影响。

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

1. **空响应恢复**：`!response.content` → 注入 `[System reminder: your last response was empty…]` 重试，上限 `MAX_EMPTY_RETRIES = 2`（每次用户消息重置），仍空才抛原错误。
2. **pending tasks 提醒**：有 pending → 注入任务列表提醒并继续循环；**最多推回一次**（`_taskPushbacks`，task 工具更新列表即重置）——模型第二次坚持收尾则放行。
3. **verify guard**（opt-in `verifyGuard: true`，工程模式除外）：改过代码未 verify → 推回调 verify（≤2 次）；verify 失败 → 推回修复（≤3 次）；耗尽 → 诚实声明提醒。
4. **advisor guard**（opt-in `advisor.guard === true`，工程模式除外）：改过代码未评审 → 推回调 advisor（≤3 轮）。
   advisor 评审能力**恒启用**（不依赖开关；未配 `advisor.provider` 时继承主 provider）；`advisor.enabled` 字段已废弃。
   guard 是**会话级**（`/advisor` 切换、`saveSession` / `applySession` 往返 `data.advisor.guard`），config.json 的 `agent.advisor.guard` 退为兼容镜像。
5. 通过 → `pushReal` assistant 回复 + 返回 content。

**guard 设计取舍**：guard 链全部「注入提醒 + continue」而非硬中断（模型自我修正优于外部强制，计数上限防死循环）；verify / advisor 仅 opt-in（工程模式用流程驱动评审替代逐轮推回）；resume 保留 guard 状态（续跑不能重置已验证 / 已收敛事实，否则可被无限续跑绕过）。

### 6.6 回合后注入（`post-turn`）

- **停滞检测**：同一工具 + 同一参数序列化签名连续 3 次 → 注入「你在原地空转，换条路或求助」（窗口 5）。
- **goal 预算**：goal 活跃时每轮注入目标 / 已用 turn 数；用满 75% 预警；`goal complete` 需验证证据门槛。

> **§6.7–§6.12 已拆出** → `docs/core/design/AGENT-LOOP-SUBAGENT.md`（节号沿用——子代理 / 挂起 digest / 文件域调度器 / 分域池与 async advisor / 评审池接入 / abort 来源标注）。

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

**引擎改动（`thincoder-core/hooks.mjs`——三处小改，既有三调用点零改）**：① `runOneHook` 载荷构造在基础键与 `timestamp` 之间插 `...(ctx.extra ?? {})`（既有调用点不传 ⇒ 逐字零变）；② `runHooks` matcher 守卫 `if (hook.matcher && ctx.toolName != null)`（无工具名事件忽略 matcher——**否决「仅文档说明」**：配了 matcher 会静默失火，守卫一行可除）；③ 头部事件表删 `Notification` 行、增 `Stop` 行。

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
- **释放点**：`releaseSettledEntry(entry)`（`async-settle.mjs`）——`entry.childAgent = null; entry.report = null`（幂等）；**三消费点**注入完成后调用（回合尾收集 / run 起始 pending 注入 / 挂起残差）；池内与挂起未消化窗口**零变化**（报告仍到达、status / observe 可读）。
- **纯函数单源**：`capText` / `appendCappedText` 本体 = `thincoder-core/text-budget.mjs`（TUI 面 `display-budget.mjs` 与 agent 面共用）。
- **轨迹面**（单遍序列化 / 额度双层 / 在途上界 / 序号缓存）→ 属**轨迹存储**板块，见 §8.2 登记。

### 6.16 权威源接管点（指针汇总）

以下机制**不在本档详述**——权威源在别处，本档只指路（不复制以免漂移）：

| 机制 | 权威源 | 本档说明 |
|---|---|---|
| 工程模式判定 / token 门 / 主流程 | `docs/core/design/ENGINEERING-MODE-V2.md`（`BATCH-RECORD.md` · `DOC-DISCIPLINE.md` · `LEDGER.md`——已迁；v1 设计档已归档） | 拆分面 §6.7.6 协议概览 + 文档纪律来源 |
| 评审轮次收敛 | `docs/core/design/ADVISOR-CONVERGENCE.md` + `ADVISOR-GUARDS.md`（已迁） | 拆分面 §6.10 / §6.11 对象锚 + 轮次语义 |
| 评审判定铁律 R1–R7 / 评审对象锚 | 本层 `AGENT-LOOP-SUBAGENT.md` §6.19 / §6.18 | 本批并入（2026-09-15 批 5） |
| 测试分层 L0 / L1 / L2 | `docs/core/design/TESTING.md` | 拆分面 §6.7.6 指注 |
| 工具注册 / schema / ctx / hooks / undo | 本层 `TOOLS.md` | §6.4 调度决策语义 |
| 结果落盘阈值 | `docs/core/design/TOOL-OUTPUT-LIMITS.md`（已迁） | §6.4 引用 |
| TUI 显示 / 渲染 / 折叠块 | CLI 壳体面（`TUI.md`——未迁） | 拆分面 §6.7 显示面指针 |
| 会话 | 本层 `SESSION.md` | `read_history` 语义 |
| 上下文压缩 | 本层 `CONTEXT-COMPACTION.md` | §6.2 压缩安全点 |
| 会诊 / 飞刀机制 | 会诊 = 本层 `CONSULTATION.md`；飞刀 = `docs/core/design/ESCALATE.md`（已迁） | §8.2 登记 |
| 轨迹存储 | 本层 `TRACES.md` | §8.2 登记 |
| 事件日志 | 本层 `LOGGING.md` | 轨迹上游互补 |
| 模型上下文配置 | 本层 `PROVIDER.md` | 推理 / 预算 |
| 记忆 | 本层 `MEMORY.md` | §6.3 记忆检索 |
| MCP 机制 | 本层 `MCP.md` | 工具面扩展 |
| 多实例协作感知 | 多实例协作档（CLI 仓·设计——未迁） | 并行副本感知 |

### 6.17 普通模式轻量审计（并入 · 2026-09-15）

**普通模式轻量审计**（现行提示词 `persona-normal` / `common` / `discipline-normal`——需求条目 = `thincoder-cli/docs/requirements/NORMAL-MODE.md` §6，待随该档迁移）：主代理验证 coder 交付时，对照 ① 本轮用户指令 ② 板块设计文档（文档地图定位）查三向一致 + 指令落文档——**零额外 LLM**（读是既有动作）。

**F-N1.4 升级**：实现偏差由主 agent **修正至符合设计后才宣布完成**（真实文档漂移 / 超范围 → 报告用户，不擅改）。

**常态化独立审计机制 = 不做**（机械论证：① 与「零额外 LLM」冲突（独立审计 = 新步骤 / 新 spawn）② 数据源无着（实况审计需轨迹 / 会话数据，轨迹默认关）③ 与既有条款语义重复——任一成立即否决）。评估证据（旧档 §19 全文）随旧档留参照历史。

### 6.18 VSC 侧接线面（并入 · 2026-09-15 批 8 · 自 `thincoder-vscode/docs/design/AGENT-LOOP.md`）

VSC 侧**接线**面（端装配 / 面板 / webview 呈现）——机制本体已并 §6.1–§6.17 + `AGENT-LOOP-SUBAGENT.md`；本节只登记**端侧接线事实**（不重复机制，D2）：

| 接线面 | 端侧形态（实核） | 回指 |
|---|---|---|
| 挂起回合 digest | 面板驱动交互层：`panel._suspWake` 唤醒单槽 · `_turnState==="running"` busy 拒收（INPUT-LOCK——可录入禁发、Enter 拒发不排队）· settle 驱动 digest 轮 · 中止残余单槽消息按普通回合兜底执行（零丢失） | 机制核内形态 = §2.3（#184 注入面表）；消化面 = `AGENT-LOOP-SUBAGENT.md` §6.8；呈现 = `docs/vsc/design/WEBVIEW.md` §5 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` §5（digest 轮可见面） |
| eng-coder 交付协议 | 本端闭环：async 缺省 · explore 受限审计（BLOCKING spawn-only + 审计预算 ≤6 · 任务书三要素机械追加）· token 门（`thincoder-core/agent-tools/subagent-spawn.mjs:112` `resolveDesignSlot`——designId 槽解析 + TTL fail-closed 槽回读；原 VSC 镜像 `authorizeEngCoderDesignToken` 随 W12/W13 迁核退场）· 变更记账 `mergeChildMutations`（取消路径不合并——`thincoder-core/agent-tools/subagent-async.mjs:411`） | token 门机制权威 = `docs/core/design/ENGINEERING-MODE.md`；受限通道描述面 = `AGENT-LOOP-SUBAGENT.md` §6.7.6 （迁移期引文） |
| 子代理活动显示 | webview 活动区：区驻留 → awaitingDigest → 消化归档落流（`#subagent-activity`）· 终态即时归档 | 呈现权威 = `docs/vsc/design/WEBVIEW.md` §5.1 / §5.2（生命周期 / 块头形态）——本档不复制 |
| child permission gate | 子代理（depth>0）写操作走审批门：`makeChildPermission`（`thincoder-core/agent-tools/child-permission.mjs:32`——W9 已迁核，原 `thincoder-vscode/src/agent-tools/child-permission.mjs`；announce → ask → 清态）+ `childOwnerLabel`（同档 `:22`——`escalate <model> #<id>` / `<role>#<id>`）· autoApprove 值源 = 父对象字段 `parent.autoApprove`（核引擎 child 权限面三读点：`thincoder-core/agent-tools/subagent-spawn.mjs:305` · `escalate-async.mjs:225` · `subagent-actions.mjs:441`；VSC 侧字段接线 = 本表「自持工具登记面」行）——原 VSC 引擎「三处 autoApprove 形参（eng-coder 恒 true / 其余 `ctx.getAuto?.()`）」坐标随 W12/W13 退役 · 卡释放三路（child abort〔signal = 条目级 controller——端侧供给接回，见下行〕/ Stop / approve-all 连带 `permissionWithdrawn`）· 块头 `⏸` + 态词 `等待审批`（`webview/activity-view.js`） · **端侧供给**（2026-09-16 缺陷修复——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md` §2 F1/F2）：手动档子代询问 = `callbacks.onPermissionRequest`（`thincoder-vscode/src/extension/panel-callbacks.mjs` 供给——面板权限卡 + owner 归属 + `⏸` 态）经 `execute-tools.mjs` toolCtx 透传（核同范式 = `thincoder-core/agent/dispatch.mjs:395`）；缺失 ⇒ 静默拒绝不出卡（`thincoder-core/agent-tools/subagent-spawn.mjs:308-309`）· **残环批收正**（2026-09-16——承 `docs/batches/2026-09-16-subagent-panel-residual-rings.md` §2）：① signal 接回——供给按归属键 id 读池条目（`_asyncSubagents.get(String(id))`）⇒ `signal: entry.controller.signal`——路径①（child abort）VSC 转实态（⏹ / `action:'cancel'` / 会话链中止一律 deny 释放 + `permissionWithdrawn`；迟到弹卡 sig 已 abort ⇒ 即释放）；② 询问名携键 + model 供给——飞刀 async 名 = `escalate#<id>/<tool>`、sync 同构包装、`continue` = args.agent 机器键（三生产者同规）⇒ owner 归属 + `escalate <model> #<id>`（model = 池条目值）· tool-ctx `getAuto` / `sessionSignal` 透传 = 历史残留、零消费面（F2 注释收正——核门读父对象 `autoApprove` 字段；会话 signal 经 `agent._sessionSignal` 达核） | §2.1 #166 裁决行 · 权限调度面 §6.4 · 呈现 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.2（批 2 按现状落笔） |
| 上行通道消费 / 唤醒面（2026-09-19 批并入） | 端壳自有 depth-0 循环的**循环头**调核单源 `drainChildUpstream`（`thincoder-vscode/src/agent.mjs:179` 邻位——紧随 `opts.turnInput?.()` 消费段；动态 import——W8 契约②）+ 载体两字段入 `CARRIER_FIELDS`（同档 `:41-45`，12 → 14 款）；挂起驱动第 2 步判据 `\|\| upstreamWaiting(history)`（`thincoder-vscode/src/extension/suspension.mjs:283-284`）+ `upstreamTurn` 旗标三跳（`thincoder-vscode/src/extension/panel-turn-stages.mjs:156-158` → `panel-chat.mjs:87` / `:243` → `panel-turn-loop.mjs:60` / `:65-80`）+ `digest:start` / `digest:end` 载荷 `upstream: true`（两端同规） | 机制权威 = `AGENT-LOOP-SUBAGENT.md` §6.27.12（§6.27.12.12 = VSC 对位面）；验收机判 = `thincoder-vscode/test/upstream-parity.test.mjs`（T-VS-U1–U7 · **拟新增**）· `thincoder-vscode/test/engine-floor-guard.test.mjs`（W8 契约②） |
| 自持工具登记面（#83） | VSC 经**核登记册**取 14 工具（单一来源）：装配面 `thincoder-vscode/src/agent/setup.mjs` `hydrateRun` 内**动态** `await import("@thincoder/core/agent-tools.mjs")`（静态引入会经 consult/subagent 族触达 `node:sqlite`——W8 契约②；核侧同款动态先例 = 核 `agent-tools.mjs` 头注）；端侧转口面 `thincoder-vscode/src/agent-tools/index.mjs` = `export * from` 核登记册（不再自持 14 名清单）；batch_segment 记账缝（#84）端侧注册 = 同档 `configureBatchSegment({ onWrite })`（`_touchedFiles` 记账——与删除前内联面同语义）；同装配面每轮把**基础集**（除端侧 meta 工具族 `agentTools` 外的装配项）绑定到 agent 对象（`agent.tools`——spawn 读点 `parent.tools` / 子代装配展开；`thincoder-core/agent/family-tools.mjs`（家族单源——`assembleFamilyTools`；核调用点 `thincoder-core/agent/setup.mjs:175-182`）追加 task/plan/timer 等 depth 家族由核负责——**不相交式 = 追加家族 ∥ 绑定值（基础集）**（端侧 meta 族与追加家族实测重叠 11 名，故其不得入绑定值；防子代装配重名）；家族矩阵同批单源化：端侧角色分支链删除、装配改调核侧单源实现——CLI 与 VSC 同调，端差装饰留端；2026-09-15 缺陷修复）。**`agent.autoApprove` 字段接线**（2026-09-16 缺陷修复——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md`）：同装配面 B 类 run 绑定（`hydrateRun` 每轮重指）以**访问器**把 `agent.autoApprove` 接 `getAuto` live 闭包——核侧字段读点（spawn/escalate 门 · 子代权限继承 · 调度 · 结算）获值（宿主曾缺该字段致 AUTO 档核读点恒判非 AUTO）；无 setter（面板 flag 为唯一来源） | 机制行 = §2.2 / §2.5 #83；缝位清单 = `CORE-UNIFICATION.md` §2.13.3；验收机判 = `thincoder-vscode/test/agent-tools-registry.test.mjs`（登记册面）· 新增 autoApprove 字段接线回归档（用例表——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md` §2） |
| 端壳事件中继面 / 调用期适配（W15） | ① **事件中继**：核 relay `⟦ev⟧` 事件 token（`queued` / `cancelled` / `stopped` / `settled` / `done` / `turn` + `⟦ev⟧async`+`[model]`）经 `thincoder-vscode/src/extension/panel-callbacks.mjs` `relaySubagentEventToken` → webview `{type:"subagent"}` 状态消息单点（⏹ queued 等待头回收 + 位置前移——原合成 `callbacks: {}` no-op 面收口；`panel-messages.mjs` ⏹ 路由携 config/autoApprove 真值）。**策略**：未映射的 `⟦ev⟧` 事件**静默消费**（不泄漏进聊天文本；VSC 另有结构化通道者如 `⟦ev⟧approval` = `onSubagentApproval` 不受影响）；嵌套 relay 前缀（孙代事件）按 head 折叠到外层块（扁平活动区语义）；② **循环契约位移 = 调用期适配**（`thincoder-vscode/src/agent.mjs` 端形不变：live `autoApprove` getter · `opts.distillState`↔核 `agent._pendingDistill` · `opts.turnInput`↔核 `consumeInjected` · 载体字段访问器别名住共享 `history`〔设计十一款 + 端自持 `_engDesignTokens` = 十二绑定〕）；③ **核原语改指**：`thincoder-vscode/src/explore-distill.mjs` = 核 `summarizeRunExplorations` 适配器（agent 载体 ↔ 共享数组原位回收）· `thincoder-vscode/src/agent/setup-reminders.mjs` = 端特有面（env 行端身份 R4 / peer / 重启闸）+ 核转口（git/注入/AUTO/ENG）· `thincoder-vscode/src/i18n.mjs` = 核 `projectDictionary` 投影 + 端特有键（webview 面）叠加（本地键恒胜）；④ **`autoThink` 键随 config 归一**（#175 a 半——消费点 = `thincoder-vscode/src/agent.mjs` 首轮核 `auto-think.mjs`，默认 false 零行为变化；档位 patch 全程端侧 = `src/extension/panel-chat.mjs` → provider 字段数据面）；⑤ **内容中继**（2026-09-16 补）：子代内容 chunk（text / think / 工具调用行 / 工具输出行——`wrapChildCallbacks` 四路前缀包装）经 `relaySubagentContentChunk` 分流 → webview `toolPanel` `sub:<role>#<id>` 块（嵌套子标随行；事件面先吃、内容面后判——前缀 chunk 不再落主会话流） | 回指：§2.3（载体字段集）· §6.1（循环）；验收机判 = `thincoder-vscode/test/chat-panel-messages.test.mjs` ⑫/⑬ · `subagent-content-relay.test.mjs`（内容中继 T1–T7——2026-09-16 补） · `agent-lifecycle-singleton.test.mjs`（#175a 归一）· `engine-floor-guard.test.mjs`（W8 契约②静态闭包） |

| 端壳自有循环工具轮推入面（回声恒带——D-CC22 第三站点） | 端壳 depth-0 循环的工具轮 assistant 消息推入 = `thincoder-vscode/src/agent.mjs:387-397` 改由核单点 `assistantToolCallMessage`（`thincoder-core/model-specs.mjs`）构造后 `pushReal`；端取值 = `thincoder-vscode/src/specs.mjs` 的 `specForModel`（核规格表 + 端差 `reasoningEffortDefault`），构造单点经同档转口（`:11` import + `:13` re-export——先例 = 同址 `providerSpec`），`thincoder-vscode/src/agent.mjs:6` 的 import 面同批加名；**W8 契约② 实核（静态闭包扫描——同 `thincoder-vscode/test/engine-floor-guard.test.mjs:101-127` 算法）**：核 `thincoder-core/model-specs.mjs` 闭包 = 自身 1 档 / 零 builtins（`node:sqlite` 不可达）· 端壳 `thincoder-vscode/src/agent.mjs` 闭包 = 123 档 / 11 builtins（无 `node:sqlite`）且**已含**该核档 ⇒ 加名零新增闭包条目，静态引合法（无须动态 import） | 契约 = §6.4（本档）· 判据与决策单源 = `CONTEXT-COMPACTION.md` §6.10 #9 / §7 D-CC22（本档不复制否决表）；验收机判 = `thincoder-vscode/test/integration/reasoning-echo-live.test.mjs`（拟新增）· 结构面 = 同档 T-V-RC3（端壳零 `reasoning_content:` 字面） |

（八面的机制 / 契约权威 = 本档 §2.3 / §6.4 / `AGENT-LOOP-SUBAGENT.md` + 工程模式板；VSC 源档 = 参照历史一字未改。）

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-AL1 | guard 链 = 「注入提醒 + continue」而非硬中断 | 模型自我修正优于外部强制；计数上限防死循环；resume 保留 guard 状态 |
| D-AL2 | 子代理零 git = 工具不存在 + 不注入（双物理防线） | git 是污染源（已提交修复不可见 / untracked 不可见 / status 全工作区脏）；否决「注入但少用」 |
| D-AL3 | 顶层 spawn / escalate / advisor 一律异步（同步例外全移除） | 同步 spawn 反复误用（阻塞自身 turn + 占池）；机制参数保留但不引导（提示词 + 工具描述双面） |
| D-AL4 | 四族 settle 统一单点（`settleAsyncEntry`）+ pending 单容器 + done-in-pool 统一表示 | 族特有段下沉 `onAccounting` hook；否决「三族各持 pending 流」（分叉源） |
| D-AL5 | 调度器动态文件域 = 声明域 ∪ running 的 `_touchedFiles` | out-of-list 写入是交付常态（纪律允许 + 逐项报告）——须获域保护；否决「只看声明域」 |
| D-AL6 | 同文件串行只阻断「先入者」与 running | 后入者不阻断——防两个 queued 同文件互等死锁 |
| D-AL7 | 依赖取消 / 失败 → 依赖者留 queued `dependency-cancelled`（不自动启动） | 滞留有意、显式可清、不静默；仅父侧显式处置或 AUTO 档自动启动 |
| D-AL8 | 挂起回合 = **交互层状态**（`runAgent` 保持「单输入 → 输出」不变式） | 挂起循环落在调用方 turn 循环；否决「改 runAgent 语义」（复杂度下沉错位） |
| D-AL9 | busy 时**提交禁发** + 排队机制整批废弃（`pendingInput` 单槽） | 排队从源头根除（digest 后置意图污染）；`state.queue` 缩为残项单容器 |
| D-AL10 | 待答池分域（engCoder / other）按域记账 + 三键可配 | 跨域总量 8、同域仍 4；否决「单池」（eng-coder 与 explore 互相饿死） |
| D-AL11 | 评审**同 scope 不排队**（同 type+scope → 直接拒）；**池满（异 scope）入队**（**2026-09-16 批 8 修订**——原「超限 / 同 scope 均直接拒」撤销） | 同 scope 续审 stale ⇒ 拒 + 拒文案给指引；异 scope 互不依赖 ⇒ 入队不增 stale 面且复用既有队列语义（不入第二份实现）——落地 = `AGENT-LOOP-SUBAGENT.md` §6.10 / §6.11 |
| D-AL12 | async 池复用既有 pending / digest / 注入 / 冻结机制（角色无关） | 否决「为 advisor 另造消费链」（第二份实现 = 漂移源） |
| D-AL13 | abort 载体 = 结构化 `err.abortInfo`（非 message 内嵌） | 可机判 + message 零改（零回归）+ 一模块一词汇表；否决「message 内嵌」（污染一切 message 消费面）·「上报面新通道」（契约面大 + 与报告正文分离） |
| D-AL14 | reason 词汇表**就地扩展**（新增 `abortTrigger` 形态） | 既有 `{interrupt}` 判据点零触碰；否决「把 user 也迁入新形态」（触发大批既有断点） |
| D-AL15 | 死亡行 = 原 message 前缀 + 后缀（不重写 message） | 既有文案 / 前缀断言零回归；否决「重写 message 为来源优先形态」 |
| D-AL16 | Stop 触发点 = 收尾点单点 + 显式条件 | 单点覆盖全部退出路径（done / maxTurns / error / abort 同点分流）；否决逐内层轮（通知风暴）· 正常返回点（覆盖不足）· TUI 层（headless 丢失） |
| D-AL17 | Stop 排除中止但**撞帽 / 异常也触发**（`reason` 区分） | 两态都是「agent 停了、可能需要你」；否决「仅 done」（覆盖不足） |
| D-AL18 | `Notification` 删除（不接线） | 零调用点（自重引入即死）+ 存活文档不列 + 配置无校验 ⇒ 删除零运行时影响；「能配却永不触发」是陷阱；用途已被 Stop 覆盖 |
| D-AL19 | matcher 守卫进引擎（否决「仅文档说明」） | 无工具名事件配了 matcher 会静默失火——一行守卫可除 |
| D-AL20 | digest 预算 = **共享叶子模块单源** + 四族全接线 | 常量 / 判超 / 记账 / 落盘四处合一；否决「只在 role 分支调用点统一」（直采路径不经调用点）·「各注入器各自实现」（多源漂移 + 跨族合计失效） |
| D-AL21 | 子代理窗口复用主 agent 机制（`_historyWindow`） | 不另造第二套窗口实现 |
| D-AL22 | 捕获 = 滞后水位截断（头 16K + 标记 + 尾 48K） | 消费面读 2K / 4K——头尾保真覆盖；否决「超限落盘全文 + 指针」（热路径 IO + 文件生命周期）·「环形窗口」（丢失「从哪开始」） |
| D-AL23 | 释放点 = 注入完成后置空（三消费点同点 + 幂等守卫） | 池内窗口语义零变；否决「settle 时刻置空」（破坏未消化期 status / observe）·「不置空」（挂起期分钟级驻留） |
| D-AL24 | VSC 侧接线面 = **只登记接线事实、不复制机制本体**（挂起 / 协议 / 呈现 / 权限门回指既有节） | 机制权威已单源（§2.3 / SUBAGENT 档 / WEBVIEW 档 / 工程模式板）——平行档 / 重复叙述 = 漂移源 |
| D-AL25 | child permission gate **按现状并入**（C-2 契约——非「无此状态」） | 批 2 发现「审批态已实装」（activity-view.js ⏸ + 等待审批）——活档口径按现状（VSC 源档为参照历史） |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/AGENT-LOOP.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**，理由如下：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 档首「未决 / 待办状态行」 | 十条 live 未决项（多带 `docs/TODO.md` 指向） | **时点状态行**——live 跟踪面唯一权威 = 台账（D2）；条目现状未经本批复核 |
| 档首「变更记录（历史折叠）」+ 各节「变更记录」 | 逐批变更流水账 | 历史叙述——本档自有变更记录；旧档即该历史的载体 |
| §1 末「模块拆分批」叙述 | 拆分史（subagent-async → scheduler / actions / panel） | 旧结构叙述——现行模块面见 §6.1 |
| §7.7 / §7.7.1 的「改」列表与交付状态 | 逐项改造清单 + 交付核销状态 | 批次材料（改造已完成——结论已入 `AGENT-LOOP-SUBAGENT.md` §6.7.5） |
| §11.3「排队用户指令合并（R15）」 | 已废弃机制的形态描述 | **已作废**——结论（排队整批废弃、`pendingInput` 单槽）已入 `AGENT-LOOP-SUBAGENT.md` §6.8 |
| §12.1 评审对象锚 | 对象声明块（逐字格式 + 每轮注入） | **2026-09-15 批 5 已并入** `AGENT-LOOP-SUBAGENT.md` §6.18（原「属评审收敛板」= 迁移期指态——销项） |
| §12.2 判定铁律 R1–R7 逐字 | 评审判定铁律 | **2026-09-15 批 5 已并入** `AGENT-LOOP-SUBAGENT.md` §6.19（原「属评审收敛板」= 迁移期指态——销项） |
| §12.4「byte-identical 取消」 | 双端字节一致约束取消 | **2026-09-15 批 5 已并入** `PROMPT-SYSTEM.md` §6.4（原「属提示词系统板」= 迁移期指态——销项） |
| §19 会话上下文轮退役 / 普通模式偏差审计评估 | 退役评估（「从未实现」「四机制承接」） | **已作废设计的评估记录**——历史面（承接机制现状见 §6.16 指针表）；普通模式轻量审计面 **2026-09-15 批 5 已并入 §6.17** |
| §20.5 / §21.4 / §23.4 等「否决备选」原文 | 逐条否决论证全文 | 结论已提炼入 §7；原文的批次语境不随迁 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档节 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| §13 完整轨迹存档 | 采集点 / 元数据 / 脱敏 / 写盘 / 默认 OFF | 属**轨迹存储**板块（本层 `TRACES.md`）——本批只覆盖 AGENT-LOOP / MEMORY 两板块 |
| §14 会诊 / 飞刀异步化 | consult settle / 注入时机 / escalate 三分类 | 会诊 = 本层 `CONSULTATION.md`；飞刀 = `docs/core/design/ESCALATE.md`（已迁——2026-09-15 批 5 指态收正） |
| §12.1–§12.4 | 评审对象锚 / 判定铁律 / 文档归属纪律 / byte-identical 取消 | **2026-09-15 批 5 收口**——§12.1 → `AGENT-LOOP-SUBAGENT.md` §6.18 · §12.2 → 同档 §6.19 · §12.4 → `PROMPT-SYSTEM.md` §6.4；§12.3 文档归属纪律 = 文档体系面（`docs/core/design/DOC-DISCIPLINE.md` 已迁 + 提示词正本承载——不重并） |
| §8.1 后半 + §11.2 凭证机制 | 工程交付协议完整面 / designId-token 全链 | 属**工程模式**板——已迁 `docs/core/design/ENGINEERING-MODE-V2.md`（+ `BATCH-RECORD.md` / `DOC-DISCIPLINE.md` / `LEDGER.md`；v1 设计档已归档）；§8.1 后半（普通模式轻量审计）2026-09-15 批 5 已并入本档 §6.17 |
| §15 操作纪律 / 工具使用 | 并行化 / 委托标准 / Module Split Policy / edit 纪律 | 属**提示词系统**板（正本 = `docs/core/design/prompts/`——内容权归主 agent） |
| §7.6 子代理 / 顾问人格逐字锚集 | coder / consult-base / advisor 四模板锚句 | 锚定稿源 → 已落**提示词正本**（`docs/core/design/prompts/` 同名槽位档） |
| §18–§23 各节「用例表 / AC 表 / 受影响文件表」 | 逐批测试与文件清单 | **一次性批次材料**——文档分层纪律（不入长期档）；批次档承载 |
| §23.3.2 轨迹面契约 | 单遍序列化 / 额度双层 / 在途上界 / 序号缓存 | 属**轨迹存储**板块（同上） |
| VSC 档各节「用例表 / AC 表 / 受影响文件表 / 方案选型」（§12 / §15–§18） | 逐批测试 / 验收 / 文件清单与选型论证 | **一次性批次材料** + 决策结论已提炼（Q1–Q6 → 契约 C 系列已并 §6.18；KD 已入 D-AL24/25）——批次档承载 |
| VSC 档「未决 / 待办状态行」+「变更记录」 | 时点状态行 + 逐批流水 | 时点材料——归台账 / 批次档；历史叙述——本档自有变更记录 |
| VSC 档 §2 / §12 / §17（runAgent 主循环 · async 保真 · 上下文注入对齐） | VSC 侧实现细节叙述 | 与 §2.3 / `AGENT-LOOP-SUBAGENT.md` §6.7–§6.12 已并面同族（端差登记 = §6.18 表）——不重并（D2） |

## 变更记录

- 2026-09-19（**批 2026-09-19-upstream-channel-availability · 设计评审修正轮 1 · eng-designer**——承批档 §3 轮次 1 · 父侧逐条裁定）：**同族收正两处（发现 5 / 6）**——
  ① §6.18 上行通道行的验收机判指针 `T-VS-U1–U6` → **`T-VS-U1–U7`**（与 `AGENT-LOOP-SUBAGENT.md` §6.27.12.9 / §6.27.12.10 U9 同源）；
  ② §2.3 两句加**「待实现轮落地」**标记——唤醒栓「两处调用」句（`:104-105`）与 VSC 绑定不变式 14 款句（`:113-114`）（现盘产品码未落：`thincoder-vscode/src/agent.mjs:41-45` 仍 12 款、`thincoder-vscode/src/**` 对新字段 / 旗标零命中）。机制条文零改。

- 2026-09-19（**批 2026-09-19-upstream-channel-availability · D8 收正轮 · eng-designer**——承用户 2026-09-18「失效的表达一定要删掉」裁定 + 批档 §2.16-⑧③ 点名）：§2.3 **两处形态收正**——
  VSC 绑定不变式段的端差注括注改**现态陈述**（去修订式标注与批史对照；留端壳载体表两款 + 细则指针）· 唤醒栓「兑现」点括注去存量坐标对照半句（现值 = `:281` + 上行 ask 入队尾两处调用）。
  同轮同族收正 = `AGENT-LOOP-SUBAGENT.md` §6.27.12.4 ④ / §6.27.12.12 回指 / §6.27.7 F8 行三处（逐处见批档 §2）。机制条文零改。

- 2026-09-19（**批 2026-09-19-upstream-channel-availability · VSC 对位扩面轮 · eng-designer**——承用户 23:23 裁定 + 需求 §4.12 N4）：§2.3「VSC 绑定不变式」**端差注消解**
  （端壳 `CARRIER_FIELDS` 已含 `_childUpstream` / `_childUpstreamSeq`——载体 12 → 14 款）；§6.18 **增一行**「上行通道消费 / 唤醒面」（端壳 drain + 谓词 + 旗标 + 日志标签——六面 → **七面**）；
  机制细则全在 `AGENT-LOOP-SUBAGENT.md` §6.27.12.12（本节零机制裁决）。

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #76 / #78 / #94 / #98–#103 / #111–#113 / #149–#158 / #165 / #166 / #169 / #175 / #176 / #184 · §2.5.1 A7 / A15 / A22 / A23 / D2）；**语义零改**，行号沿用原编号。
- 2026-09-13：同行次——**#170–#173（技能 / 规则 / 同伴）改归 `docs/core/design/WORKSPACE.md`**（同批拆分轮内的归属校正：与 #174 台账展示面同族，归工作区约定档）。
- 2026-09-14（S1 收口轮）：新增 **§2.3 #184 核内形态**（注入面 / 端特有面 / 验收点——S1 续轮执行面）；§3.2 丁组 **D2 裁定状态收正**（已裁 · 按建议）；§2 两处裸 basename 锚补路径前缀（`thincoder-vscode/src/config-io.mjs:319`——机检修复）。
- 2026-09-14（markdown 面小收正轮）：§1 归属表 `helpers.mjs` 补路径前缀（`thincoder-core/agent/helpers.mjs`——与 `thincoder-core/mcp/helpers.mjs` 同名不同物，**消除歧义不改判据**）。
- 2026-09-14（写路径缝落地补正轮 · eng-designer）：§2.3 核内模块行数收正（`thincoder-core/agent/suspension.mjs` 已落 **234 行**——原估 +170±40 被实际取代）；§3.1 增「**未并入项登记**」（A7 / #78：VSC「仅 reasoning ⇒ 视为 content」分支未并入核内——非偏离，登记项）。
- 2026-09-14（载体字段集补正轮 · eng-designer——S2 接线前）：§2.3 carrier 行字段集补两款（`_asyncQueue`（排队容器）· `_asyncTombstones`（终态墓碑））；新增「载体字段集与回写义务」块（回写义务 · 谁写 / 何时写 · VSC 绑定不变式覆盖全 7 字段 · 队列 / 池无借用步勘定注）；验收点 2 扩「不预置载体字段」夹具。
- 2026-09-14（载体字段集小收正轮 · eng-designer——S2 接线前）：§2.3 字段集 **7 款 → 8 款**（补 `_asyncWaiters` 唤醒栓注册表——数组；注册 / 摘除 / 兑现三处坐标 + 无借用步勘定注同扩）；验收点 2「不预置载体字段」夹具与 VSC 绑定不变式同步扩至 8 字段；同族全核实扫（另 2 项同类形待裁）见批次档 §2。
- 2026-09-14（载体字段集二轮小收正 · eng-designer——S2 接线前）：§2.3 字段集 **8 款 → 10 款**（补 `_advisorRuns` 评审实例注册表 · `_mutLog` 变更日志——VSC 对位名 `_fileMutEvents`；访问点 / 回写义务 / 名差登记同扩）；验收点 2「不预置载体字段」夹具与 VSC 绑定不变式同步扩至 10 字段；**10 款即全集**结论落档（实扫依据见批次档 §2）。
- 2026-09-14（**B 轮并入 · 试点批**）：新增 §6 **机制面**（模块职责 / 主循环与中断 / 装配注入 / dispatch 与权限 / guard 链 / 回合后注入 /
  子代理全族 / 挂起 digest / 文件域调度器 / 分域池与 async advisor / 评审池接入 / abort 来源标注 / Stop 钩子 / digest 预算 / 内存上界 / 权威源指针）·
  §7 **关键决策记录（D-AL1–23）** · §8 **不并项与历史沿革**（跨板块 / 一次性材料 / (d) 类逐项登记）；
  来源 = `thincoder-cli/docs/design/AGENT-LOOP.md`（**旧档一字未改**——原地作参照历史）；首部加机制面指针一行。本档 161 → **670 行**。
- 2026-09-15（**迁移批 · 第 5 批 · 并入与拆分 · eng-designer**）：**并入**——评审对象锚（旧档 §12.1）→ `AGENT-LOOP-SUBAGENT.md` §6.18 · 判定铁律 R1–R7（旧档 §12.2）→ 同档 §6.19 · 普通模式轻量审计（旧档 §8.1 后半 / §19）→ 本档 §6.17 · byte-identical 取消（旧档 §12.4）→ 并入 `PROMPT-SYSTEM.md` §6.4（均自 `thincoder-cli/docs/design/AGENT-LOOP.md`——旧档一字未改，留参照历史）。
  **拆分**——§6.7–§6.12 拆出至 `docs/core/design/AGENT-LOOP-SUBAGENT.md`（节号沿用；引用逐处修复）；§6.16 指针表按现状收正（工程模式 / 评审收敛 / 测试 / 结果落盘 / 会诊飞刀 / 多实例指态）；§8.1 / §8.2 并入销项与指态收正。
- 2026-09-15（**B 式迁移轮 · VSC 第 8 批 · 并入 · eng-designer**）：新增 **§6.18 VSC 侧接线面**（挂起回合 digest / eng-coder 交付协议 / 子代理活动显示 / child permission gate——自 `thincoder-vscode/docs/design/AGENT-LOOP.md` 并入；坐标实核）；§7 D-AL24–25 · §8.2 登记 VSC 源档批次材料。
- 2026-09-15（**#175 推理档位面裁定收正 · eng-designer**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 修正轮-3）：用户 2026-09-15 裁定 **推理档位面 = 端侧自有 · 经 provider 字段数据面（核内无需位）**——
  §2.2 #175 行端差处置与 §3.2 D2 行「按端注入」表述收正退场（D2「已裁（2026-09-13）· 按建议」状态不变）。
- 2026-09-15（**S2 W9 · VSC 接线面收正 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W9）：§6.18 新增**「自持工具登记面（#83）」行**
  （VSC 14 工具装配 = 核登记册**动态**载入〔W8 契约②〕+ 端侧转口面 `thincoder-vscode/src/agent-tools/index.mjs` = `export *` + batch_segment 记账缝 `configureBatchSegment({ onWrite })` 端侧注册）；
  同表 child permission gate 行坐标随 W9 迁核收正为 `thincoder-core/agent-tools/child-permission.mjs:32` / `:22`（原 VSC 镜像已删）；§2 :156 行注 W9 迁核。机制条文零改。
- 2026-09-15（**S2 W15 · VSC 接线面收正 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W15〔重定版〕）：§6.18 新增**「端壳事件中继面 / 调用期适配（W15）」行**
  （核 relay `⟦ev⟧` 事件 token → webview `{type:"subagent"}` 状态消息单点 `relaySubagentEventToken`〔⏹ queued 等待头回收面〕· 循环契约四位移的调用期适配 · 蒸馏/提醒/i18n 核单源转口 · `autoThink` 键随 config 归一〔#175 a 半〕）；
  同表 eng-coder 交付协议行两处坐标随 W12/W13 迁核收正（token 门 → `thincoder-core/agent-tools/subagent-spawn.mjs:112` `resolveDesignSlot`；变更记账 → `thincoder-core/agent-tools/subagent-async.mjs:411` `mergeChildMutations`）；§6.18 结句「五面」→「六面」（计数联改）；机制条文零改。
- 2026-09-15（**子代理 spawn 装配缺陷修复 · VSC 接线面收正 · eng-designer**——承 `docs/batches/2026-09-15-vsc-agent-tools-spawn-fix.md`）：§6.18「自持工具登记面（#83）」行补 VSC 装配面 `agent.tools` 每轮绑定事实（spawn 读点 `parent.tools` / 子代装配展开——VSC 宿主曾缺该字段致子代理装配即崩）。
- 2026-09-15（**子代理工具表重名修复 · VSC 接线面收正 · eng-designer**——承 `docs/batches/2026-09-15-vsc-tool-table-dup.md`）：§6.18「自持工具登记面（#83）」行绑定值收正——VSC `agent.tools` = **基础集**（除端侧 meta 工具族外的装配项）；核 `thincoder-core/agent/setup.mjs:175-182` 追加家族与**绑定值（基础集）**不重叠（防子代装配重名——端侧 meta 族与追加家族实测重叠 11 名，故其不得入绑定值）。
  **家族矩阵单源化**（同批）——VSC 端侧角色分支链（depth>0 各分支）删除、装配改调核侧单源实现（CLI 与 VSC 同调，端差装饰留端）；全表保留端侧 schema/执行面；**§6.1 模块地图同收**（新增家族单源行 + `thincoder-core/agent/setup.mjs` 职责句改「改调家族单源」）。
  **修正轮-1（评审 #37 落修）**：不相交式表述收正（追加家族 ∥ 绑定值（基础集））；§6.1 补新档行（`family-tools.mjs`——落 `thincoder-core/agent/`）。
- 2026-09-16（**子代理压缩后推理链回传断裂修复 · 文档面 · eng-designer**——承 `docs/batches/2026-09-16-subagent-reasoning-echo.md`）：压缩注入回声安全（tail 首条为 assistant ⇒ 占位并入该条）并入 `CONTEXT-COMPACTION.md`（§7 D-CC18 · §6.10 #2/#7）；本档机制条文零改（修复落点 = 核 `thincoder-core/context.mjs`）。
- 2026-09-16（**VSC 子代理面板通道恢复 · 内容中继面收正 · eng-coder**——承 `docs/batches/2026-09-16-vsc-subagent-panel-channel.md`）：§6.18 W15 行补**内容中继**（子代内容 chunk 四路 relay 前缀分流 → `sub:<role>#<id>` 块——`panel-callbacks.mjs` `relaySubagentContentChunk`；事件面先吃 / 内容面后判 · 核零改）；
  同表 `:391`/`:393` 两行旧节号收正（`docs/vsc/design/WEBVIEW.md` §7.4/§14 → §5 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` §5——迁移期旧节号收口）。
- 2026-09-16（**VSC autoApprove 字段接线修复 · VSC 接线面收正 · eng-designer**——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md`）：§6.18「自持工具登记面（#83）」行补 `agent.autoApprove` 字段接线事实（B 类 run 绑定访问器 = live getter 转接——核字段读点获值）；
  同表 child permission gate 行 autoApprove 来源收正为核引擎读点（原 VSC 引擎 `ctx.getAuto?.()` 三处坐标随 W12/W13 退役）。
- 2026-09-16（**VSC spawn ctx 权限通道接线 · VSC 接线面收正 · eng-designer**——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md` §2 F1/F2）：§6.18 child permission gate 行补**端侧供给**事实
  （手动档子代询问经 `callbacks.onPermissionRequest`——`panel-callbacks.mjs` 供给〔owner 归属 + `⏸` 态〕→ `execute-tools.mjs` toolCtx 透传；缺失 ⇒ 静默拒绝不出卡；核同范式 = `thincoder-core/agent/dispatch.mjs:395`）；
  **F2 注释收正**句（tool-ctx `getAuto` / `sessionSignal` = 零消费面残留——核门读父对象 `autoApprove` 字段；会话 signal 经 `agent._sessionSignal` 达核）；同表 autoApprove 读点措辞收窄为「child 权限面三读点」（评审 🔵#9——防与既有「三处读点」读混）。
- 2026-09-16（**子代理面板覆盖面残环修复 · VSC 接线面收正 · eng-designer**——承 `docs/batches/2026-09-16-subagent-panel-residual-rings.md` §2）：
  §6.18 child permission gate 行补**残环批收正**（① 条目级 signal 接回 = 池条目 controller——路径① child abort 在 VSC 转实态〔⏹ / `action:'cancel'` / 会话链中止〕；
  ② 询问名携键〔飞刀 `escalate#<id>/<tool>` · `continue` = args.agent 机器键〕+ model 池条目供给〔`escalate <model> #<id>`〕）。
- 2026-09-16（**ENGINE-DEBT 批 8 · ED-4 决策面落档 · eng-designer**——承 `docs/batches/2026-09-16-engine-debt.md` §1 裁定 ④）：§7 **D-AL11 修订**（评审池满由「直接拒」改「异 scope 入队 / 同 scope 仍拒」——原「超限 / 同 scope 直接拒」撤销）；机制落 `AGENT-LOOP-SUBAGENT.md` §6.10/§6.11 · 需求落 `AGENT-LOOP.md`（需求档）§4.3 **F-B5**。

- 2026-09-17（**af 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2）：§2.3「载体字段集与回写义务」**10 款 → 11 款**（增 `_asyncAdvisorQueue`——ED-4 评审排队容器）；
  §2.3 全集结论句改写（原「10 款即全集」结论失效）+ VSC 绑定不变式「全部 10 字段」→「全部 11 字段」；
  同题一致性收口三处：§2.3  seam 表 `carrier` 行字段清单补一款（`:81`）· 验收点 2「不预置载体字段」夹具 10 款 → 11 款（`:122`）· §6.18 VSC 接线行「设计十款 + `_engDesignTokens` = 十一绑定」→「设计十一款 + `_engDesignTokens` = 十二绑定」（`:401`）。对应台账 #21。
- 2026-09-18（**批 PROMPT-FACE · 设计轮 · eng-designer**——承 `docs/batches/2026-09-18-prompt-face.md` §1.1 ① · 台账 #23）：§6.3 **前缀缓存契约精化**——操作条件改述为「同一 agent 的相邻请求前缀逐字节相同」，并明列入可入 system 的输入集（槽位装配 / 项目指令 / skills / **spawn 固块**）；机制落 `AGENT-LOOP-SUBAGENT.md` §6.26。
- 2026-09-18（**漂移收正轮 · eng-designer**——承 `docs/batches/2026-09-18-distill-prefix.md` §5 八、登记 · 台账 #76）：§2.1 #76 行「截断取 VSC 的 UTF-16 安全切片」按实况改述——**截断面已退役**（2026-09-18 蒸馏前缀批：`safeSliceUTF16` 引用随序列化面删除；现体 = 会话续写、单源构造 `buildCompressMessages`）；行内两处时点坐标已标退役。裁决行本体零改。
- 2026-09-19（**批 2026-09-19-upstream-channel-availability · 设计轮 · eng-designer**——承需求 §4.12 F-UC7 / 台账 #104）：§2.3「载体字段集与回写义务」**11 款 → 13 款**（补 `_childUpstream` 子→父在飞队列 · `_childUpstreamSeq` 单调计数——§6.27 上行通道面；前批只在本表以「同列」引用、表未同步，本批对齐）；
  同题联改六处：seam 表 `carrier` 行字段清单扩至 13 · 全集结论句改「13 款即全集」· 唤醒栓「兑现」点由 `async-settle.mjs:270`（时点坐标已陈旧）改指**核单点 `wakeAsyncWaiters(parent)`**（settle 公共尾 `:281` + 上行 ask 入队尾两处调用）· 「借用 / 新建」单点表补 `upstreamHolder` · VSC 绑定不变式「全部 11 字段」→「全部 13 字段」（并注明端壳表未含两款 · 另案）· 验收点 2 夹具 11 款 → 13 款。
  机制本体落 `AGENT-LOOP-SUBAGENT.md` §6.27.12（唤醒面）；本档只做字段集一致性对齐，零机制裁决。
- 2026-09-20（**thinking 回传缺口批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-20-reasoning-echo-gap.md` §1 · 台账 #109）：§6.4 新增「工具轮 assistant 消息构造（回声恒带）」契约行（核单点 `assistantToolCallMessage`——required 族恒带 `reasoning_content`，缺值 ⇒ 空串）；判据与机制单源 = `CONTEXT-COMPACTION.md` §6.10 #9 / §7 D-CC22（本档不复制否决表）；落点 = `thincoder-core/model-specs.mjs` + `config.mjs` re-export + `thincoder-core/agent.mjs:366-376`（advisor 镜像面归 `ADVISOR-CONVERGENCE.md` 变更记录）。本档 as-of **541 行**（**超 500 硬限**——沿革自 D-CC18 批登记的 506 → 537 序列；结构债归总账）；本设计轮落笔后 **544 行**。
- 2026-09-20（**thinking 回传缺口批 · fix 轮（第三站点）· eng-designer**——承 `docs/batches/2026-09-20-reasoning-echo-gap.md` §2.9）：§6.4 契约行补第三站点（VSC 端壳自有循环 `thincoder-vscode/src/agent.mjs:387-397`）；§6.18 表新增「端壳自有循环工具轮推入面」行（七面 → 八面）；上条裸文件名死锚已收正为核路径形态。本档 as-of **547 行**（**超 500 硬限**沿革在册）。
