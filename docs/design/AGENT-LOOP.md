# agent 主循环与子代理（AGENT-LOOP）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 主循环 | `thincoder-cli/src/agent.mjs` | 同名（同路径对） |
| 装配 / 提醒 / 收尾 | `src/agent/setup.mjs` · `setup-reminders.mjs` · `run-stages.mjs` · `post-turn.mjs` · `dispatch.mjs` · `completion.mjs` · `record-results.mjs` · `relay-prefix.mjs` · `src/agent/helpers.mjs` · `spawn-child.mjs` | `src/agent/*`（拆档：`execute-tools` · `tool-gates` · `run-helpers` · `context-injections` · `agent-state`） |
| 子代理 / 异步 | `src/agent-tools/{subagent-scheduler,subagent,subagent-actions,subagent-async,subagent-run,async-settle,subagent-spawn,escalate-async}.mjs` | 同名 / 拆分档 |
| 挂起与唤醒 | `src/tui/suspension-drive.mjs` | `src/extension/suspension.mjs` |
| 权限 | `src/cli/permission.mjs` | `src/extension/permission-gate.mjs` · `agent-tools/child-permission.mjs` |
| hooks | `src/hooks.mjs` | —（零 `runHooks`） |
| 工作区约定（技能 / 规则 / 同伴 / 台账） | —（另档） | → `docs/design/WORKSPACE.md` |
| 推理档位 / 模型引用 | `src/auto-think.mjs` · `model-ref.mjs` | `src/extension/reasoning-mode.mjs` · `src/config.mjs`（模型引用解析段） |
| 探索蒸馏 | `src/explore-distill.mjs` | 同名（同路径对） |
| token 台账 | `src/agent-tools/design-token.mjs` · `src/token-ttl.mjs` | `src/agent/agent-state.mjs` · `agent/tool-gates.mjs` |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 76 | `explore-distill.mjs` | 同路径 | 0.5247 · 异 | ② | 进核 | 融合：取一侧 + 截断取 VSC 的 UTF-16 安全切片 | 分叉 ＝ 截断实现（CLI 裸 slice `src/explore-distill.mjs:80` / VSC `safeSliceUTF16` `:82`）+ 就地改写 vs 返回新值；前提 ＝ 无 | — | S1（建核补齐） |
| 78 | `agent.mjs` | 同路径 | 0.0883 · 异 | ③ | 进核 | 以 CLI 为准（主循环本体）+ VSC 的 onToken 三态门 / 帧回调 / 空响应内联重试并入 | 分叉 ＝ 分层方式 + **一处配置面缺口**（`agent.streamRules` 在 VSC 全仓零消费方——VSC `src/**` 0 命中；CLI `src/agent.mjs:237`）+ 中断时入历史的工具结果不同（CLI 丢弃 + 占位 `:387` / VSC 保留真实结果 VSC `src/agent.mjs:342-350`） | **①②** | S1（建核补齐） |
| 94 | `agent-tools/subagent-scheduler.mjs` | 同路径 | 0.1914 · 异 | ② | 进核 | 融合：取 CLI 队列实现 + VSC 的跨 `runAgent` 存活载体面按核内结构归一 | 分叉 ＝ 队列载体（CLI 独立数组 / VSC 池 Map 插入序）与 AUTO 判定取词；域上限、依赖语义、位置计算同规格 | — | S1（建核补齐） |
| 98 | `agent-tools/async-settle.mjs` | 同路径 | 0.0819 · 异 | ② | 进核 | 融合：取 CLI（中止守卫 + 取消提醒落点 + `TURN_CAP_MARK` 常量）+ VSC 的 interrupt 豁免面按端注入 | 分叉 ＝ 载体 / 守卫口径 / 提醒落点 / 事件名（`advisor:done` vs `child:done`）+ VSC 把 turn cap 文案写成字面量（`src/agent-tools/async-settle.mjs:143`）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 99 | `agent-tools/subagent.mjs` | 同路径 | 0.0447 · 异 | ③ | 进核 | 以 CLI 为准（含 `panel` 动作）+ VSC 无 panel 属**有意端差**（其载荷面在 VSC 不存在 ⇒ ④ 段以注入剔除） | 分叉 ＝ 动作枚举（CLI 八动作 / VSC 七动作、有意无 `panel` `src/agent-tools/subagent-spec.mjs:11-12`）；前提（`panel` 依赖 CLI TUI 展示面）仍成立 ⇒ ④ 段 | **①** | S1（建核补齐） |
| 100 | `agent-tools/subagent-actions.mjs` | 同路径 | 0.0407 · 异 | ② | 进核 | 融合：动作执行器按核内单一切分归位（含 `cancel` 归属） | 分叉 ＝ 纯文件分工（CLI 的 `cancel` 在 `subagent-async.mjs` / VSC 在 `subagent-actions.mjs`）+ VSC 的 advisor 评审取消路由；`status`/`observe`/`send` 语义同规格 | — | S1（建核补齐） |
| 101 | `agent-tools/advisor-async.mjs` | 同路径 | 0.0378 · 异 | ② | 进核 | 融合：取 CLI 拆分（settle 记账 / token 组外提）+ VSC 的会话槽台账写入面归位 | 分叉 ＝ 拆分粒度与落盘路径（CLI 走 token 清理 + slot 权威台账模块 / VSC 直写 slot）；容量拒超 / 取消 / 陈旧判定同规格 | — | S1（建核补齐） |
| 102 | `agent-tools/subagent-async.mjs` | 同路径 | 0.0204 · 异 | ② | 进核 | 融合：异步机械按核内单一切分归位（含 §18 审计门 / `collectSettledAsync` 落点） | 分叉 ＝ 切法不同（CLI 的 `cancel` 执行器在此 / VSC 在 `subagent-actions`；VSC 审计门与 collect 留此档）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 103 | `agent-tools/subagent-run.mjs` | 同路径 | 0.0135 · 异 | ② | 进核 | 融合：**同名不同物**——两端两份能力**分别**归位（CLI = 异步 spawn 执行器；VSC = 子代理 `runAgent` 闭环） | 分叉 ＝ 文件名复用而实体不同（CLI `executeAsyncSpawn` `src/agent-tools/subagent-run.mjs:47-204` / VSC `runChild` `:18-205`）；核内分别落位（CLI 侧对应 VSC `subagent-async.mjs` 的 `spawnAsyncSubagent`） | — | S1（建核补齐） |
| 111 | `agent/run-stages.mjs` | 同路径 | 0.0709 · 异 | ③ | 进核 | 以 CLI 为准（Stop 钩子 + 收尾编排）+ VSC 的 guard 推回 / 蒸馏发射面按核内结构归位 | 分叉 ＝ 文件职责划分 + 两处行为（CLI 跑 Stop 钩子 `src/agent/run-stages.mjs:131-140`、VSC 全仓零 `runHooks`；中止时 CLI 清空子代理池 `:168-169` / VSC 只清已死 `:296-297,312-313`） | **①** | S1（建核补齐） |
| 112 | `agent/setup.mjs` | 同路径 | 0.0532 · 异 | ③ | 进核 | 以 CLI 为准（装配顺序与注入块）+ 端差注入：VSC 编辑器上下文 / 按模型能力的 `read_image` / 每轮惰性 MCP 扩工具 | 分叉 ＝ VSC 拆 `context-injections.mjs` + 三处挂载条件不同（`read_image` 按多模态 `src/agent/setup.mjs:199`；`settings` 只挂 depth0 `:141`；召回限 depth0 且 `!autoTurn`）；前提（两端同装配面）成立 | **①** | S1（建核补齐） |
| 113 | `agent/setup-reminders.mjs` | 同路径 | 0.0453 · 异 | ② | 进核 | 融合：取并集 + VSC 编辑器上下文 / 贴图指引按端注入（④ 段） | 分叉 ＝ VSC 独有两条注入（编辑器上下文 · 贴图指引 `src/agent/setup-reminders.mjs:216-223`）+ 提示语同套；前提（贴图依赖宿主）仍成立 | — | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 149 | `src/agent/dispatch.mjs` ↔ `src/agent/execute-tools.mjs` + `src/agent/tool-gates.mjs` | ② | 融合：两阶段执行 + 前置门禁按核内结构归位 | 分叉 ＝ 拆分（VSC 拆 tools / gates —— `tool-gates.mjs:2-6` 自述「自 execute-tools.mjs verbatim 迁出——零语义」）⇒ 前提成立 | — | S1（建核补齐） |
| 150 | `src/agent/helpers.mjs` ↔ `src/agent/run-helpers.mjs` | ② | 融合：核内单一工具函数面 | 分叉 ＝ 档名（helpers / run-helpers）；VSC `context-injections.mjs:11` 自述「CLI 对位 `agent/helpers.mjs:275-348`」⇒ 前提成立 | — | S1（建核补齐） |
| 151 | `src/agent/post-turn.mjs` ↔ `src/agent/setup-reminders.mjs` + `agent.mjs`（内联） | ② | 融合：回合后记账（计时器 / 提醒 / 停滞检测 / goal 追踪）按核内结构归位 | 分叉 ＝ 落点（VSC 住 setup-reminders / 主循环内联——`thincoder-vscode/src/agent.mjs:351` 自述「ported from CLI post-turn」）⇒ 前提成立 | — | S1（建核补齐） |
| 152 | `src/agent/spawn-child.mjs` ↔ `src/agent-tools/subagent-run.mjs` | ② | 融合：子运行器按核内结构归位（含 `_capturedOutput` 额度面） | 分叉 ＝ 文件名复用而实体不同（VSC 该档 = `runChild` 闭环 `:18-205`）；**承 §2.5 #103** | —（承 #103） | S1（建核补齐） |
| 153 | `src/agent/completion.mjs` · `record-results.mjs` · `relay-prefix.mjs` ↔ 核内（VSC 内联） | ② | 融合：按核内结构归位（完成守卫 / 结果提交与记账 / 前缀续写切片） | 分叉 ＝ 拆档（VSC 内联于主循环）；守卫语义两端同（`completion.mjs` 三守卫 / 配对关闭 / UTF-16 安全切片）⇒ 前提成立 | — | S1（建核补齐） |
| 154 | `src/agent-tools/design-token.mjs` + `src/token-ttl.mjs` ↔ `src/agent/agent-state.mjs` + `src/agent/tool-gates.mjs` | ② | 融合：token TTL / 会话槽台账按核内结构归位 | 分叉 ＝ 落点（CLI 独立档 / VSC 住 agent-state · tool-gates）；两端同 token 格式（`uuid:expiresAt`）与 fail-closed 口径 ⇒ 前提成立 | — | S1（建核补齐） |
| 155 | `src/agent-tools/escalate-async.mjs` ↔ `src/agent-tools/subagent-escalate-async.mjs` + `subagent-escalate.mjs` | ② | 融合：异步飞刀引擎按核内结构归位 | 分叉 ＝ 档名与拆分（VSC 拆 sync / async 两档）；同池（「other」域）/ 同 ack 形态 ⇒ 前提成立 | — | S1（建核补齐） |
| 156 | `src/agent-tools/recent-changes.mjs` ↔ `src/agent-tools/recent_changes.mjs` | ② | 融合：取一侧（工具名 `recent_changes` 两端同） | 分叉 ＝ 档名连字符 / 下划线 + `readonly` 标记；工具语义同（本轮已读）⇒ 前提成立 | — | S1（建核补齐） |
| 157 | `src/agent-tools/subagent-spawn.mjs` ↔ `src/agent-tools/subagent-spawn-gate.mjs` | ② | 融合：spawn 门禁按核内结构归位 | 分叉 ＝ 档名与拆分；VSC `:136` 自述「CLI 同构面；CLI 执行器在 agent-tools/subagent-spawn.mjs」⇒ 前提成立 | — | S1（建核补齐） |
| 158 | `src/agent-tools/advisor-settle.mjs` ↔ 核内（VSC 侧住 `advisor-async.mjs`） | ② | 融合：advisor settle 记账 / 变更日志 / 陈旧判定按核内结构归位 | 分叉 ＝ 拆档（VSC 未拆；**同路径对 #101 的另一半**）⇒ 随 #101 处置 | —（承 #101） | S1（建核补齐） |
| 165 | `src/cli/permission.mjs` ↔ `src/extension/permission-gate.mjs` | ② | 融合：权限闸按核内结构归位 + 展示面按端注入 | 分叉 ＝ 目录与展示形态（TUI 卡 / webview 卡）；闸语义（每回合 `autoApprove` 快照 + 中途 live 标志）同 ⇒ 前提成立 | — | S1（建核补齐） |
| 166 | （CLI 无独立档）↔ `src/agent-tools/child-permission.mjs` | ② | 融合：子代理权限通道按核内结构归位（父卡归属 + 定向 signal） | 分叉 ＝ 拆档（VSC 独有拆面）；**承 §2.5 #112（装配）/ §2.12.1 事件语义面** | —（承 #112） | S1（建核补齐） |
| 169 | `src/hooks.mjs` ↔ 核内（VSC 侧零 `runHooks`） | ③ | 以 CLI 为准（Stop 等四事件）——VSC 接线后开始触发（外部副作用随 #111 登记） | 分叉 ＝ VSC 未实现（零命中）；**承 §2.5 #111** | —（承 #111） | S1（建核补齐） |
| 175 | `src/auto-think.mjs` ↔ `src/extension/reasoning-mode.mjs` | ② | 融合：核内推理档位面 + 端侧选择面（UI 下拉 / 自动分级）按端注入 | 分叉 ＝ 落点（CLI 自动难度分级 / VSC UI→provider 字段映射）；VSC DEFAULTS 已载 `autoThink`（`thincoder-vscode/src/config-io.mjs:319`）但**全仓无消费方** ⇒ 归一后接线（默认 `false` ⇒ 默认无行为变化） | **②**（丁组 D2） | S1（建核补齐） |
| 176 | `src/model-ref.mjs` ↔ `src/config.mjs`（模型引用解析段）+ `specs.mjs` | ② | 融合：核内单一 `provider:model` 解析 | 分叉 ＝ 落点；解析口径（首冒号切分 / 双段非空 / 显式 `p:m` 一律放行）两端同源 ⇒ 前提成立 | — | S1（建核补齐） |
| 184 | `src/extension/suspension.mjs` ↔ `src/tui/suspension-drive.mjs` | ② | 融合：挂起 / 唤醒机制按核内结构归位（池载体按端注入） | 分叉 ＝ 目录（CLI 住 `tui/`）；VSC 头注自述「与 CLI 的结构差异（同语义移植）——CLI 的池 / pending / _suspended 挂 agent 对象」`:9` ⇒ 前提成立 | — | S1（建核补齐） |

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
| `carrier` | 池 / pending / 标志载体对象——字段集 = 核内异步面现行口径（`_asyncSubagents` · `_asyncAdvisors` · `_consultSessions` · `_pendingAsyncResults` · `_suspended` · `_asyncQueue` · `_asyncTombstones` · `_asyncWaiters` · `_advisorRuns` · `_mutLog`——2026-09-14 补正五款，见下「载体字段集与回写义务」） | 传 `agent`（现形——核内已迁异步面同持此形） | 传 depth-0 `history`（现形——池 / pending / 标志全挂 history） |
| `runTurn(text, opts)` | 回合执行器（digest = `{ autoTurn: true, text: "" }`） | 注入 `runAgentTurn` 包装（函数级静态环消失——驱动器不再 import `agent-turn`） | 注入 `entry.runTurn`（现形） |
| `abortSignal` | 会话中止信号（兜底监听） | `agent._sessionAbort.signal`（现形） | `susp.abort.signal`（现形） |
| `hooks.onCounts(counts)` | 计数变化通知（`{ running, queued, pending, done }`） | 组合状态行文本 + `render()` + 1s tick 重绘（现 `backgroundStatusText` + `setInterval`） | `suspension` 消息 + `_publishTurnState`（现 `postSuspension`——文案由 webview 按 locale 组合） |
| `hooks.onDigest(phase, counts)` | 消化轮边界（start / end） | `pushLine("[auto-turn: …]")` + `digest:*` 日志 | webview `{ type: "digest", status }`（现形） |
| `hooks.reclaim(consumed)` | 消化后块回收（不等池空） | `freezeReclaimDigestedBlocks`（`thincoder-cli/src/tui/subagent-blocks.mjs`） | `reclaimDigestedBlocks`（postMessage done——现形） |
| `hooks.freezeAll()` | 退出冻结（兜底残项） | `freezeAllSubTasks` + `sweepToolBlocks`（`thincoder-cli/src/tui/subagent-blocks.mjs` · `thincoder-cli/src/tui/tool-events.mjs`） | `postSuspensionEnd(panel, { freeze: true })`（现形） |
| 唤醒 / 入槽 | `handle.pushInput(msg)` + `handle.wake()` | Enter → `pushInput`；Ctrl+C → 中止 | `routeUserTurn` 拒收 busy + `_chat` → `pushInput`（现形） |
| 退出回执 | `{ reason: "idle" \| "aborted", residualInput }` | abort 残余 → `state.queue` + 提示行（现形） | abort 残余 → 退出后以普通回合消费（现形） |

**载体字段集与回写义务（2026-09-14 补正轮定 · S2 接线前）**：

- **字段集**（核内异步面现行口径——三轮补正：原五字段 + 五款）= `_asyncSubagents` · `_asyncAdvisors` · `_consultSessions` · `_pendingAsyncResults` · `_suspended` · **`_asyncQueue`**（排队容器）· **`_asyncTombstones`**（终态墓碑）· **`_asyncWaiters`**（唤醒栓注册表）· **`_advisorRuns`**（评审实例注册表）· **`_mutLog`**（变更日志——VSC 对位名 `_fileMutEvents`）。
  容器类型：三池 / 墓碑 / 评审实例注册表 = `Map`，队列 / pending / 唤醒栓注册表 / 变更日志 = 数组，`_suspended` = 布尔。
  **全集结论（二轮小收正复核 · 2026-09-14）**：10 款即全集——VSC `history` 载体面（8 款）∪ 核侧新机制（`_asyncQueue` / `_asyncWaiters` 两款）两侧实扫去重，无第 11 款（实扫明细与排除项见批次档 §2）。
- **回写义务（谁写 · 何时写）**：容器类字段（三池 / 队列 / pending / 墓碑 / 唤醒栓注册表 / 评审实例注册表 / 变更日志）的新建 / 借用**只在首次使用的核内单点发生**，并与首次使用**同步**（先落容器后使用——无「已使用未回写」窗口）；写入落**父对象字段**，且须使容器经 `carrierField(parent, 字段)` 与 `parent[字段]` 两条读取路径命中**同一容器**（不另起分叉）。
  - **借用规则**：父对象缺而载体（`history`）有 ⇒ **借用同一容器**（不另建）；两处皆无 ⇒ 就地新建。已按「借用 / 新建」落核的单点：pending = `parkAsyncPending`（`thincoder-core/agent-tools/async-settle.mjs:116-122`）· 墓碑 = `writeTombstone`（同档 `:61-72`）。
  - **唤醒栓注册表三处操作**（`_asyncWaiters`）：注册 = `thincoder-core/agent/suspension.mjs:133`（进入等待即 `carrier._asyncWaiters ??= []` + `push(onSettle)`——首用单点、同步落容器）· 摘除 = 同档 `:121-122`（cleanup `indexOf` / `splice`）。
    兑现 = `thincoder-core/agent-tools/async-settle.mjs:270`（settle 尾部 `splice(0)` 全量唤醒并清空）——`carrier._asyncWaiters`（挂起侧）与 `parent._asyncWaiters`（结算侧）两径经绑定不变式命中同一容器。
  - **评审实例注册表**（`_advisorRuns`——`Map`）：读取（不建）= `thincoder-core/agent-tools/advisor-async.mjs:68-71`（经 `carrierField`）；首用单点（建）= 同档 `:73-83`（无既有容器时创建，落 `agent.history ?? agent`——有载体直接落载体、无则落父对象字段；与首次使用同步）。
    重置写点 = `thincoder-core/agent-tools/eng.mjs:57` / `:75`（模式切换重建空 Map 落父对象字段——**勘定（VSC 形）**：替换写不触载体，重置的跨 run 保持 = S2 装配对位登记项）。
    形态钉于核测 = `thincoder-core/test/advisor-consult-merge.test.mjs:29-56`（有载体 ⇒ 建在载体上、不在父对象旁建第二份；父对象自有 ⇒ 父对象优先）；VSC 现役 = `thincoder-vscode/src/agent-tools/advisor-async.mjs:64-72`（`advisorRunsMap`——history 载体）。
  - **变更日志**（`_mutLog`——数组 · ≤200 环；**VSC 对位名 `_fileMutEvents`——名差登记**）：书写点 = `thincoder-core/agent-tools/advisor-settle.mjs:42-49`（`noteMutations`——`agent._mutLog ??= []` 同步落父对象字段）；读点 = 同档 `:58`（陈旧判定）· `thincoder-core/agent-tools/escalate-async.mjs:47`（飞行重叠判定）。
    调用面 = `thincoder-core/agent/dispatch.mjs:129`（回合写执行成功即记账）· `thincoder-core/agent-tools/subagent-async.mjs:424`（子代理合入）；VSC 现役对位 = `thincoder-vscode/src/agent-tools/advisor-async.mjs:83-85`（写）· `:118`（读——同经 `parent.history ?? parent`）。
  - **队列 / 三池 / 唤醒栓注册表 / 变更日志的新建点均无借用步**：`thincoder-core/agent-tools/subagent-run.mjs:51-52` · `thincoder-core/agent-tools/escalate-async.mjs:149-150` ·
    `thincoder-core/agent-tools/advisor-async.mjs:268` · `thincoder-core/agent-tools/consult.mjs:417` · `thincoder-core/agent/suspension.mjs:133` · `thincoder-core/agent-tools/advisor-settle.mjs:46`（`??=` 形态）——绑定不变式下不可观测（勘定注）。
- **VSC 跨 run 存活面 = 端装配绑定不变式**（S2 装配义务——`_asyncQueue` / `_asyncTombstones` / `_asyncWaiters` / `_advisorRuns` / `_mutLog` 同列）：run 起始对**全部 10 字段**成立——`history` 有容器 ⇒ 绑到 `agent` 字段；`history` 缺 ⇒ **先在 `history` 侧补建**再绑（新建回写载体的落点——否则新建落 per-run `agent`、跨 run 断裂）。
- **验收**：见验收点 2 扩展（「不预置载体字段」夹具——机制须自建容器、同组断言与预置形同值）。

**端特有面（④ 段——不归核）**：

1. CLI：状态行文本与 1s tick 重绘 · `[auto-turn: …]` 提示行 · Enter / Ctrl+C 键位路由 · 中止残余转 `state.queue` 的处置与提示行 · TUI 块冻结 / 回收（`thincoder-cli/src/tui/subagent-blocks.mjs` · `thincoder-cli/src/tui/tool-events.mjs` 面）。
2. VSC：`suspension` / `digest` 消息族与 counts 广播 · 文案由 webview 按 locale 组合 · `routeUserTurn` busy 拒收 + loading 锁 · 面板生命周期（dispose 统一中止——`abortControllers` 快照）· webview 块归档回收 · 退出后残余以普通回合消费。
3. 共同（端差随核内异步面归一后消失）：`_suspended` 标志的读取方（settle 分流）住核内异步面——载体归一后零端差。

**验收点（S1 续轮）**：

1. 落核 + 核测试状态机用例（假 carrier / 假 runTurn / 假 hooks 纯 Node 驱动——不加载端模块，T-C4 / N3）：池空直退 · pending 触发消化轮 · 用户输入优先 · abort 清池不注入 · idle 残余注入 · 唤醒栓双路（settle / wake）。
2. **载体双夹具**：CLI 形（`agent` 字段对象）与 VSC 形（`history` 字段对象）各跑同组断言——证明「池载体按端注入」成立（机制对载体零预设，除上表字段集）；**并各补一组「不预置载体字段」夹具**（池 / 队列 / pending / 墓碑 / 唤醒栓注册表 / 评审实例注册表 / 变更日志全空缺——字段集 10 款全无预置）：机制须**自建容器**且同组断言与预置形同值（防「两端各自预置才碰巧能跑」——见上「载体字段集与回写义务」）。
3. 核内零端名分支 / 零文案：`suspension.mjs` 无产品名、无状态行文案字面量（grep 零命中——契约 5 / 10）；零 TUI / 宿主依赖（N3——既有 `core-hygiene` 机检覆盖）。
4. **依赖顺序（硬）**：本行与异步机械族的 VSC 侧融合（#98 / #101 / #154 等——清扫 / 计数读法 = 核内异步面单一实现的下游）同批或先后紧邻；先定异步面载体口径，再落本行（池队列表示随 #94 融合收敛——本行不重复裁决）。
5. 行为面：核内零消费方阶段只测内核；S2 接线后按面内裁决口径验收（A10）；**S1 段两产品一行不改**（T-C12）。S2 时两端驱动档退化为**薄适配**（ctx 装配 + 端侧钩子 + 键位 / 消息路由）。

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A7 | `agent.mjs`（#78） | ①② | 读 `config.agent.streamRules` 传给模型（`src/agent.mjs:237`）；中断时丢弃工具结果并写占位（`:387`） | `streamRules` **全仓零消费方**（VSC `src/**` 0 命中，本端 PARITY 批亦登记为缺口）；中断时保留真实工具结果（`:342-350`） | 以 CLI 为准（主循环本体）+ VSC 的 onToken 三态门 / 帧回调 / 空响应重试并入 | ① CLI 能配的流规则在 VSC 不生效（现状）⇒ 归一后生效；② 中断时模型所见的历史内容不同 | **已裁（2026-09-13）· 按建议** |
| A15 | `agent-tools/subagent.mjs`（#99） | ① | 八动作（含 `panel`） | 七动作——**有意无 `panel`**（`subagent-spec.mjs:11-12`，其载荷面在 VSC 不存在） | 以 CLI 为准（保留 `panel`）+ VSC 端按端差**不注入**该动作 | ① VSC 的 `subagent` 动作集不变（`panel` 仍无）；CLI 不变——本行只登记端差合法性与注入位 | **已裁（2026-09-13）· 按建议** |
| A22 | `agent/setup.mjs`（#112） | ① | 每轮装配全内联；`read_image` **恒在**注册表；子代理继承含 `settings` 的工具集；文档 / 记忆召回只受 `!resume` 约束（未按 depth 门控） | 拆 `context-injections.mjs`；`read_image` 仅当模型多模态（`:199`）；`settings` 只挂 depth0（`:141`）；召回限 depth0 且 `!autoTurn`；每轮惰性把 MCP 扩成原生工具 | 以 CLI 为准（装配顺序与注入块）+ 端差注入（编辑器上下文 · 按模型能力的 `read_image` · MCP 扩工具时机） | ① VSC 非多模态模型仍没有 `read_image`（端能力，保留）；② 子代理的 `settings` 工具与记忆召回门控归属（CLI 子代理上下文更肥 vs VSC 更瘦） | **已裁（2026-09-13）· 按建议** |
| A23 | `agent/run-stages.mjs`（#111） | ① | 收尾跑 **Stop 钩子**（`:131-140`）；中止时**直接清空**异步子代理池与评审池（`:168-169`） | **全仓零 `runHooks`**（无 Stop 钩子）；中止时只清**已死**条目（`:296-297,312-313`） | 以 CLI 为准（Stop 钩子 + 收尾编排）+ VSC 的 guard 推回 / 蒸馏发射面按核内结构归位 | ① 归一后 VSC 侧是否开始触发 Stop 钩子（外部副作用）；② 按中断时后台子代理是「被清」还是「被留」⇒ 结果可见差异 | **已裁（2026-09-13）· 按建议** |

**未并入项登记（A7 / #78 · 2026-09-14）**：VSC 的「仅 reasoning ⇒ 视为 content」分支（无 tool calls ∧ `content` 空 ∧ `reasoning` 非空 ⇒ 以 reasoning 填 content——`thincoder-vscode/src/agent.mjs:269-290` 内 `:271-273`）**未并入核内**（核内对应面 = `thincoder-core/agent/completion.mjs:31` 空响应重试径——无该分支）。
原 A7 归一形态清单未列此项、建核亦未并入 ⇒ **非偏离**；登记为**未并入项结论**（后续处置待定）。

### 3.2 丁组（S0b 语义对位遍新增）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| D2 | `src/auto-think.mjs` ↔ `src/extension/reasoning-mode.mjs`（§2.5 #175） | ② | 自动难度分级 → 推理档位（`config.agent.autoThink` 为开关，CLI 有消费方） | VSC DEFAULTS **已载** `autoThink`（`thincoder-vscode/src/config-io.mjs:319`）但**全仓零消费方** ⇒ 该键在 VSC 是**死键** | **建议（方向唯一）**：核内实现 + VSC 接线（死键恢复语义）；默认 `false` ⇒ **默认无行为变化**；面板推理档位面按端注入 | ① 在 VSC 显式设过 `autoThink: true` 的用户：该键从「无效」变「生效」（行为变化，但 = 恢复 CLI parity 的既定语义）；② 默认配置下无变化 | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**（对外事件面的兼容策略模板住 `CORE-UNIFICATION.md` §2.12.1「事件语义」类；行为面变更见上文各行「影响面」列）。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）** · **对外契约兼容面（S0 登记 / S2 落地）**。
**核内落点行数（R24a · S1 落地收正）** → §2.8.1「核内逐档行数与拆分计划」（本子系统面：`thincoder-core/permission.mjs`（#165）· `thincoder-core/undo-stack.mjs`（#149——#180 收正））。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #76 / #78 / #94 / #98–#103 / #111–#113 / #149–#158 / #165 / #166 / #169 / #175 / #176 / #184 · §2.5.1 A7 / A15 / A22 / A23 / D2）；**语义零改**，行号沿用原编号。
- 2026-09-13：同行次——**#170–#173（技能 / 规则 / 同伴）改归 `docs/design/WORKSPACE.md`**（同批拆分轮内的归属校正：与 #174 台账展示面同族，归工作区约定档）。
- 2026-09-14（S1 收口轮）：新增 **§2.3 #184 核内形态**（注入面 / 端特有面 / 验收点——S1 续轮执行面）；§3.2 丁组 **D2 裁定状态收正**（已裁 · 按建议）；§2 两处裸 basename 锚补路径前缀（`thincoder-vscode/src/config-io.mjs:319`——机检修复）。
- 2026-09-14（markdown 面小收正轮）：§1 归属表 `helpers.mjs` 补路径前缀（`src/agent/helpers.mjs`——与 `src/mcp/helpers.mjs` 同名不同物，**消除歧义不改判据**）。
- 2026-09-14（写路径缝落地补正轮 · eng-designer）：§2.3 核内模块行数收正（`thincoder-core/agent/suspension.mjs` 已落 **234 行**——原估 +170±40 被实际取代）；§3.1 增「**未并入项登记**」（A7 / #78：VSC「仅 reasoning ⇒ 视为 content」分支未并入核内——非偏离，登记项）。
- 2026-09-14（载体字段集补正轮 · eng-designer——S2 接线前）：§2.3 carrier 行字段集补两款（`_asyncQueue`（排队容器）· `_asyncTombstones`（终态墓碑））；新增「载体字段集与回写义务」块（回写义务 · 谁写 / 何时写 · VSC 绑定不变式覆盖全 7 字段 · 队列 / 池无借用步勘定注）；验收点 2 扩「不预置载体字段」夹具。
- 2026-09-14（载体字段集小收正轮 · eng-designer——S2 接线前）：§2.3 字段集 **7 款 → 8 款**（补 `_asyncWaiters` 唤醒栓注册表——数组；注册 / 摘除 / 兑现三处坐标 + 无借用步勘定注同扩）；验收点 2「不预置载体字段」夹具与 VSC 绑定不变式同步扩至 8 字段；同族全核实扫（另 2 项同类形待裁）见批次档 §2。
- 2026-09-14（载体字段集二轮小收正 · eng-designer——S2 接线前）：§2.3 字段集 **8 款 → 10 款**（补 `_advisorRuns` 评审实例注册表 · `_mutLog` 变更日志——VSC 对位名 `_fileMutEvents`；访问点 / 回写义务 / 名差登记同扩）；验收点 2「不预置载体字段」夹具与 VSC 绑定不变式同步扩至 10 字段；**10 款即全集**结论落档（实扫依据见批次档 §2）。
