# agent 主循环与子代理（AGENT-LOOP）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§8 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

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

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/AGENT-LOOP.md`（1786 行 · CLI 产品档）——根层裁定后该档 = **迁移期参照历史**（只读 · 不维护 · 不参与内容同步）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：已作废 / 旧结构叙述（(d) 类）· 跨板块内容（轨迹 / 会诊 / 飞刀 / 提示词 / 工程模式 / 评审收敛）· 一次性批次材料（用例表 / AC 表 / 变更记录 / 批次叙述）· 旧档「未决状态行」（live 跟踪面归台账）。
> **坐标口径** = as-of 2026-09-14（承旧档 · CLI 侧迁移单元 U1–U16 已落 ⇒ 机制实现面住 `thincoder-core/**`，CLI 树留壳体面 `thincoder-cli/src/**`）；符号名与档路径为契约面，**行号未逐条复核**、仅供定位。

### 6.1 模块地图（职责面）

| 模块 | 职责 |
|---|---|
| `thincoder-core/agent.mjs` | `runAgent` 主循环：prepareRun → turn 循环 → chat → 分发 → 后处理；`ContinueError` / resume；usage 基线；回合收尾（`collectSettledAsync`） |
| `thincoder-core/agent/setup.mjs` | prepareRun：上下文注入（git / 目录 / 指令 / 记忆 / 文档 / outline）、system prompt 组装、阈值解析、角色工具面装配（`depthOnly`） |
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
| `thincoder-core/agent-tools/advisor*.mjs` | advisor 工具（async 面见 §6.10） |
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

- `controller.abort()`——**二按全停**（Ctrl+C 武装化见 §6.8）：chat 抛 AbortError → `runAgent` 直接上抛；回合收尾清池分支（`aborted && !interrupt` → 无条件清 `_asyncSubagents`）。
- `abort({ interrupt: true, message })`（Ctrl+I）：chat 中断 → 提交部分输出 + 注入 `[User interrupt: message]` → 抛 AbortError；调用面捕获后**重建 controller 续跑**（同一轮内继续，用户消息即时生效）。
- `abort({ interrupt: true })` 无 message（Ctrl+C 首按——停回合）：注入后**不续跑**。
- **工具执行期间中断**：先为已提交的 `tool_calls` 合成占位 tool 结果（`[Tool execution interrupted — results discarded]`——tool 消息必须紧跟 assistant `tool_calls`，否则 strict provider 重试轮 400），再注入中断消息后 continue。
- **中断清扫（回合收尾 finally）**：`freezeAllSubTasks` + `sweepToolBlocks`（未 done 工具载体标 done + interrupted、清 `_toolTicks`）——无 running 残留、无陈旧计时泄漏。
- **reason 词汇表扩展**：程序性取消 / 停止 / 定时器中止站点新增 `abortTrigger` 载荷形态（各既有判据点语义零改）——枚举与站点规则见 §6.12。

### 6.3 装配与上下文注入（`prepareRun`）

按序注入（全部 `role: "user"` 机读消息；带 `transient` 标记者落盘时过滤）：

1. **git 上下文**（顶层 `depth === 0`）：分支、最近 5 条提交、未提交改动清单（非 git 仓库静默跳过）。**子代理一律不注入**（§6.7.4）。
2. **目录树**（顶层）：`listWorkDir`（根 ≤30 项、子目录 ≤10 项，隐藏折叠，超限截断）。
3. **项目指令**：`AGENTS.md` / `CLAUDE.md` / `project_rules.md`（≤32K 字符，`<untrusted_project_instructions>` 包裹）。
4. **记忆检索**：`memory search` 前 3 条（`<untrusted_memory>` 包裹 + XML 转义）。
5. **文档检索**：`doc_search` 前 5 条 chunk（`<untrusted_doc_chunk>` 包裹）。
6. **依赖大纲**：`repomap` 输出（`OUTLINE_INJECT_PREFIX`）。
7. **用户输入**（`pushReal`：双线）。
8. **多模态图像**（视觉模型：附加到首条 user 消息）。

**system prompt 字节稳定（前缀缓存契约）**：跨 run 逐字节不变——每轮变化的记忆 / 文档注入走 user 上下文消息而非 system；`Session start` 时间戳每会话固定一次。有回归测试断言两次请求的 system 消息逐字节相等。

### 6.4 工具调度与权限（`dispatch` 两段式）

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

**action 级门控**（子代理单工具动作面——§6.7.2）：工具级 `readonly` 标志无法同时表达 spawn（副作用）/ status（只读查询）/ cancel（控制）⇒ 预审按 **action 参数**分类：

- **readonly 面**：`status`、`observe`（只读查询——planMode 放行、免审批、可批并行）。
- **控制类豁免**（`isSubagentControlAction`——`cancel` + `panel` freeze + `send`）：免权限审批、planMode 允许、批审批不入组、手动档 digest 内放行。
- **`spawn` / `escalate`**：按非只读处理（planMode deny、串行、门禁照常）。

**approval 批确认（防点击疲劳）**：Phase 1 收集同批（同一 `toolCalls` 数组）所有**通过前置门禁、到达权限询问阶段**的非只读工具
（前置已拦下的不计入批）→ **一次询问**（`"N 个工具需要权限：A、B、C — approve all / approve one by one / deny"`）。
回调 `onBatchPermissionRequest({ tools, count })` 返回 `"approveAll"` / `"oneByOne"` / `"deny"`；`deny` → 全批拒绝无二次询问；`oneByOne` → 回退既有逐项通道。
`onPermissionRequest(toolName, args)` 契约签名不变；无 `onBatchPermissionRequest` handler 时缺省回退逐项通道；`autoApprove` 短路不变；只读工具不参与。

**批量形态引导（数据驱动——非新增工具）**：`edits` 数组（同文件多处修改 / 多文件独立修改——原子多文件，任一失败全不写）；`apply_patch`（新建多个文件 / 整文件替换 / 统一 diff）；提示词并行化条款（含 carve-out：并行禁令对声明 `files` 的 async spawn 例外——调度器自动排队，§6.9）。

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

### 6.7 子代理（`subagent` 工具）

**综述**：子代理 = `depth > 0` 的独立 agent 对象 + 丢弃式局部双线；role 决定工具集（只读过滤）与 overlay prompt。

#### 6.7.1 角色与委派

| 角色 | 能力 | 模式 |
|---|---|---|
| explore | 只读查询族 / **零 git**（§6.7.4）/ 报告须列未找到项 / thoroughness 三档 | 普通 + 工程 |
| plan | 纯只读规划 | 普通 + 工程 |
| coder | 父全量读写执行 + verify / advisor 自评 + 强制交付表 | 普通 |
| eng-coder | 工程模式替换 coder + 设计驱动 overlay + 必带 `designToken` + explore 受限审计 | 工程 |
| eng-designer | 工程模式写稿面唯一作者（需求档 / 设计档 / 批次档 §2，含修订）+ **无 designToken**（授权 = 需求已确认）+ 必带 `batchDoc` + explore 受限勘察 | 工程 |

**模式过滤**：普通模式 explore / plan / coder；工程模式 explore / plan / eng-designer / eng-coder——schema enum 反映现行模式（角色互斥：工程禁 coder、普通禁 eng-coder 与 eng-designer；schema 枚举 + 运行期硬门禁双保险）。

**委派动机**：隔离上下文（子 agent 全部读写调用不进父窗口）+ 单任务专注 + 并行省时 + coder / eng-coder 自带 verify / advisor 自评。thoroughness 三档 = quick（单点定向）/ medium（默认，适度并行）/ thorough（多位置全面分析，报告列搜索过什么 / 没找到什么）——提示词约定形态，不加工具参数。

**报告契约**：<200 字符视为交接不完整，打回扩写一次（`MIN_REPORT_CHARS`）；超长报告落盘全量保留。

**权限**：手动模式下子代理非只读工具透传到父 agent 权限审批（人在回路）；**eng-coder 例外 = spawn 时任务域授权**（已批准设计 + 任务书即授权——内部写豁免逐写审批）；非 eng-coder 子代理手动档语义不变。

#### 6.7.2 单工具动作面（七动作）

`spawn / status / observe / send / escalate / cancel / panel`（`check` 已删——§6.7.5）；`action` 缺省 = `spawn`——既有 subagent 调用（无 action）零迁移。**eng-coder role 覆盖**照旧（role 参数不影响工程协议）。

| action | 参数 | 返回 | 阻塞 |
|---|---|---|---|
| spawn（缺省） | task / role / designToken / designId + `files?` / `dependsOn?` | `{ id, role, status, position?, waiting?, reason? }` | 同步 role 等完成；async 立即返回 |
| status | id?（省 = 全部概览） | `{ running / queued / done }` 结构化数组（running 带 model / elapsedSec / turn / maxTurns / touched 摘要） | 不阻塞 |
| observe | id（必填）+ recent?（默认 5） | `{ id, role, status, turn, maxTurns, touched…, currentTool?, recentTurns, done? }` | 不阻塞 |
| send | id + message（均必填） | `{ id, status: "delivered", queued }` | 立即（入队） |
| escalate | task / model? | 术后报告（缺省 async——settle 三分类 → digest） | 缺省 async |
| cancel | id（必填——防误全停） | `{ id, status: "cancelled" }` | 立即（定向 abort） |
| panel | `{ view?, freeze? }`（互斥） | 镜像快照 / 冻结回收确认 | 同步 |

**observe 契约**（readonly——摘要不灌全量）：目标 = 父自身 spawn 的异步子代理池条目（`_asyncSubagents`，非 advisor / escalate）；数据源 = `entry.childAgent`（`_fullHistory` 最近 N 条回合摘要 + `_touchedFiles` + dispatch in-flight `_inflightTools` 当前工具 + turn / maxTurns）；**不读写 token / designId**。

**send 契约**（控制类豁免——父回合内显式调用即授权）：仅**运行中异步子代理**可注入——消息 push 进 `entry._injected`，子回合边界消费 → `pushReal` 成 user 回合进子历史 → 子代理按**普通用户指令**处理（注入不等同偏离豁免——子收敛 / 审计纪律不变）。sync / queued / settled / cancel / 未知 id → 明确错误。**send→settle 竞态**：入队后子代理在下一回合边界前 settle → 消息未投递，settle 收尾附「undelivered」提示（防父误以为引导已落地）。

**cancel 判断纪律（逐字锚）**——`subagent` 工具 cancel 描述尾句：

> Cancel is a last resort: verify alarming signals with reliable checks (git/node — not guesses) first;
> prefer scoped recovery (restore a single affected file) over killing the child — a running child's
> in-flight work dies with it, partial changes stay unmerged and unaudited.

**sync 定向中止（SYNC-CANCEL）**：

- **面**：CLI TUI **顶层 sync 块**运行中 ⏹ 可点——定向中止（只停子代理，父回合继续拿 stopped 报告）；嵌套层无独立 ⏹ 面；
  VSC webview 同步 spawn 块无 ⏹（无池条目 ⇒ cancel 路由定位不到）；`action:"cancel"` 只对 async 池 / advisor 池，sync 由 ⏹ → `cancelSyncChild` 直连。
- **信号链**：`armSyncChildAbort` 建**自属** `AbortController` 并链到基信号 `buildChildSignal`（`_sessionSignal ?? ctx.signal`）；
  注册 `parent._syncChildAborts`（Map，key = relayPrefix 去尾 `role#N`）——try / finally **三路径注销**。
- **catch 三分支**（纯函数 `classifySyncAbort(ctxSignal, baseSignal, ctrlSignal, err)`）：① base / ctx aborted → 整回合停，rethrow；
  ② `AbortError` ∧ ctrl aborted ∧ 非整回合停 → **折叠**（`mergeChildMutations` + stopped partial 报告 + `⟦ev⟧stopped` 直发 + 正常 return）；③ 其他错误原样。
  `STOPPED_MARK`（`spawn-child.mjs`，与 `TURN_CAP_MARK` 同族）= 折叠报告公共锚。
- **TUI 面板门控**：按 `_syncChildAborts` 存在性 + queued 臂判 ⏹ 可见；⏹ 顺带 deny 该 child 的 pending 权限 / continue 模态。

#### 6.7.3 async 子代理（后台并行）

**缺省 async**：`asyncFlag = asyncArg ?? (depth === 0)`——**depth-0 缺省 async（全角色）**；depth>0 缺省 sync（子代理内部强制同步）；`async:false` 显式覆盖（depth-0 参数合法；顶层行为受提示词 / 工具描述约束——§6.7.5）。

**async 分支**：子代理照常启动（复用 `spawnChild` 管线——relay / turn-cap / 权限 / `mergeChildMutations` 全不变），父侧不 await——`_asyncSubagents` 记录 + 立即返回 `{ id, role, status: "running" }`；settle → 报告经自动通道送达（回合尾注入 / 挂起 digest——§6.8）。

**槽位队列 + 分域池**：async 入口检查 running 数（< 域上限 → 立即启动；≥ → 入队 `{ status: "queued", position }`）；任一 running settle → 队列可启动项自动补位（§6.9 / §6.10）。

**settle 统一机制**：四族（subagent / advisor / escalate / consult）settle 公共收尾单点 = `settleAsyncEntry`（`thincoder-core/agent-tools/async-settle.mjs`）：

- 落 done / status、日志三连、cancelled / parentAborted / 挂起分流、`settleSeq` 唤醒 waiter、腾槽补位（subagent / escalate 族恒补；advisor / consult 豁免）；
- 守卫统一 `!parentAborted`（严格版：ctx.signal aborted 或条目 controller aborted）；族特有段作 `onAccounting` hook（advisor 陈旧判定 / token 落盘记账；escalate 三分类 merge 决策）；
- **pending 单容器** `_pendingAsyncResults` + role；**done-in-pool 统一表示** = 留池 `done: true` + pending 单容器（`_inPending` 标记防重复移交）；
- **池 accessor** = `getAsyncPool(parent, role)`；**`buildChildSignal`** = `_sessionSignal ?? ctx.signal ?? null` 单点。

#### 6.7.4 子代理零 git

**全部 explore / plan（及审计）子代理零 git**：不注入 git 上下文、不承诺 git 命令、工具集无 git——子代理证据链只含「任务书 + 磁盘当前状态（read / glob / grep）+（审计时）`_touchedFiles` 机械并集」。顶层主 agent 的 git 上下文保留（§6.3）。动机：git 是污染源（`git diff HEAD` 不见已提交修复、untracked 新文件不可见、`status` 是全工作区脏状态）——比没有 git 更危险。与 advisor 零 git 同构——**双物理防线**（工具不存在 + 不注入）。

#### 6.7.5 `check` 删除与 async 锚句

`action:"check"`（阻塞取回 async 报告）已**删除**——check 是冗余 API：异步 = 后台跑 + 结果自动送达，没有「异步拉起再等它」的路径；删后无「拉回阻塞」动作，模型不再自发轮询钉死回合。结果自动通道不受影响（done 条目无人工消费后自动通道照常接管）。consumed 墓碑保留（`dependsOn` 的「consumed id 视为已满足」）。

**async 锚句（逐字定稿——双端照抄，fail-when-unchanged）**：

> After an async spawn the turn winds down normally — nothing expects you to wait for it: the child runs in the background and its report is delivered to you automatically — before your next turn, or digested in the suspension session — so end the turn; do not poll or wait for the result.
> Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 (the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it). Inside subagents (depth>0) spawns are always synchronous (platform rule).

**顶层一律异步**（2026-09-08 用户裁定）：规则覆盖 `spawn` / `escalate` / `advisor`——三者的顶层同步例外全移除；`async:false` 在 depth-0 仍平台合法（机制零触碰），但提示词与**工具描述**不引导（工具描述面 = 项目仓内文件，是模型的最大引导面）。

#### 6.7.6 工程交付协议（eng-coder——概览）

> 完整协议（内部闭环步骤 / 收敛计数 ≤5 / 任务域授权 / 审计任务书独立性 / 报告终态）→ **工程模式档**（CLI 仓·设计——根层暂无对应档，见 §8.2 登记）；本节只述本机制关系。

- **eng-coder 默认 async**：spawn 即返回 → 主回合结束进挂起 → 交付 settle → digest 注入消化；主会话无跨 digest 状态机。
- **eng-coder 内部 spawn 受限**：只允许 explore role + 同步（机械层——防内部递归 spawn eng-coder 无限嵌套）；非 explore / async → 工具层拒绝。
- **任务域授权**：spawn 时刻授权（用户已批准设计 + 任务）；内部写操作自动放行（豁免粒度仅 `onPermissionRequest` 阶段；planMode / design-token 等前置门照常）；域外写仍受纪律约束——交付偏差审计兜底。
- **收敛与终态**：内部 explore 偏差审计 + advisor 复评闭环；修正轮共享计数 ≤5；报告自述 `clean` 或 `stalled`。
- **审计效率**：审计 explore thoroughness = **quick**（非广度探索）+ 机械预算句（只读 `_touchedFiles` 文件 + 任务书点名节，预算 ≤10 工具轮）。
- **文档漂移处置**：eng-coder **永不编辑设计文档**（设计文档是输入非交付物）——真实漂移写入交付报告 / stalled 注记，修订归设计者 / 父侧（防子代理改文档洗审计）。
- **偏差审计四类**（对照设计逐条查）：**部分实现 / 静默简化 / 文档漂移 / 超清单改动**——「超清单」判据 = 改了且未报告 = 偏差（静默越权）；**已报告 = 透明可接受**（清单外改动允许但必须逐项报告）。

### 6.8 挂起回合与 digest（会话级后台双通道）

> 核内形态（状态机 / 载体契约 / 注入面 / 端特有面）见 §2.3；本节 = 现行机制语义与端面分工。

- **回合尾语义**：回合尾**不再直注入排空**——done 条目留池（settled not consumed）→ `willSuspend`（`poolLive` 覆盖池非空）判 true → 进挂起态 → `sweepSettledToPending` → pending 非空 → digest 回合。**无 suspension 驱动的调用方**（headless / 直连 `runAgent`）保留回合尾直注入兜底（不丢结果）。多条目近邻完成 = **合并一轮消化**。
- **主会话 busy（processing 含 digest）提交禁发**（INPUT-LOCK-BEHAVIOR-REVISED 2026-09-09）：输入不禁（可打字回显），Enter 与斜杠命令同吞；**排队机制整批废弃**——`pendingInput` 收敛**单槽**（至多一条待交接），`state.queue` 缩为残项单容器（释放窗口兜底 / 中止残余——零丢失保留）。

**挂起状态机**：

| 状态 | 事件 | 动作 | 出口 |
|---|---|---|---|
| idle | 回合返回且池非空 | 置 `_suspended` → 挂起态 | → suspension |
| idle | 回合返回且池空 | 正常回 idle | 不变 |
| suspension | 池项 settle 且无 pendingInput | settle 入 `_pendingAsyncResults` → 开 auto-turn | auto-turn 期间仍挂起 |
| suspension | 用户 Enter（无 digest 在跑） | 新回合输入入 `pendingInput` 单槽 + 唤醒 | 回合末池空 → idle；非空 → 回 suspension |
| suspension | 用户 Enter（digest 在跑 = busy） | **提交吞**（不发送）+ busy 提示 | auto-turn 结束后回挂起（文本保留可重发） |
| suspension | 释放窗口 / 槽满 Enter | 单槽交接（槽满吞 + 提示） | 不变 |
| auto-turn | 池项 settle（消化中） | settle 入 pending（不并发开新轮——单 `runAgent` 循环） | 轮末按 pending / 池态续开或退出 |
| auto-turn | 结束且池空 + 无 pendingInput | 补发 done 冻结 + 清 `_suspended` | → idle |
| auto-turn | 结束且 pending 非空 + 无 pendingInput | 立即续开合并消化轮（一次注入全部 pending） | → 新 auto-turn |
| auto-turn | 结束且池非空 | 回挂起等下一 settle | → suspension |
| auto-turn | 结束且有 pendingInput | 自动以该消息开新回合 | → 回合 |

**时序边界**：settle 与 `_suspended` 翻转竞态——`_suspended` 在 `runAgent` finally 返回后（交互层进入挂起前）置位；settle 回调读到的标志若为 false（回合刚结束瞬间）→ 按正常回合语义发 done 冻结（该块本就在流尾，无害）；门控以回调读取时刻为准（确定性，无锁需求）。

**digest 动作域（两档）**：

- **手动档**（无 AUTO——只做「信息整理」）：**允许**总结报告要点注入会话流、更新任务清单、标记需决策点 + 写下建议（只写不执行）；**禁止**写文件 / 改代码、执行类工具（bash / execute / verify）、spawn 一切子代理（async + 同步——**机械拒绝**，subagent 入口检查 `_inAutoTurn && !autoApprove`）。
- **AUTO 档**（`autoApprove` 开——与用户回合一致的全语义推进型）：读 / 写 / spawn / verify / 执行全开放；禁 spawn 的机械限制撤销（推进链终止 = 池空自然停 + 用户输入随时打断）；guard 与普通回合同款。
- **两档通用**：auto-turn 的 mutation 标记不随下轮 per-run 重置而丢（auto-turn 结束时 guard 字段合并保留 `_inheritedGuard`）→ 下一用户回合覆盖 auto-turn 期间改动（防静默漏验）。
- **权限**：手动档 auto-turn 不传 `onPermissionRequest` handler（无 handler 即 denied——不弹审批面板）；AUTO 档沿用 `autoApprove`；自省工具（task / checklist）按只读 / 豁免分类放行。
- **轮次上限**：auto-turn **不另设轮次预算**——统一用系统 `maxTurns`；成本护栏 = 手动档动作域 + 合并消化 + AUTO 责任转移。

**冻结门控 + 消化完成逐条回收**：

- **挂起态 settle 延迟冻结**：settle 时若处于挂起态 → 不发 `⟦ev⟧done`，区块头保持中间态（`done · awaiting digestion` 驻留面板）；正常回合内 settle 行为不变（完成即冻结）。
- **digest 消化完成即逐条补发冻结回收**（不等池空）：pending 条目注入后按 settle 锚点 splice 落位（冻结块位于其 digest 总览文本**之前**）；池空 freeze-out 仅兜底未消化残项。
- **settle 锚点 splice**：`sub._freezeAt` = settle 时刻流位置；多锚点按 `_freezeAt` **降序**冻结（splice 是绝对位置插入——先插小锚点会把大锚点目标后移一位）；>5000 行头裁切处按净位移校正锚点。

**挂起期 Ctrl+C 武装化（三态一致）**：processing / 挂起态首按 → `abort({ interrupt: true })` 无 message（停当前回合——**不清池**——提示「再按中止全部后台」）+ 武装 3s；3s 内二按 → 全停（清池 + 标记 + 唤醒）。二按检查提升到状态路由之前（两次按下之间状态会迁移）；中止后复位 `state._suspAborted`；残余 `pendingInput` 单槽消息转回 `state.queue`（单条——不静默丢）；回合启动解除 `exitArmed` 残留。

### 6.9 文件域调度器（`files` / `dependsOn`）

> 权威 = `thincoder-core/agent-tools/subagent-scheduler.mjs`。**机制**：父代理只声明域与依赖、提交即走——调度器保证同文件串行、依赖有序、并发不误伤。

- **`files?: string[]`**——写域声明（纪律：清单外改动允许但必须逐项报告；不做任务书文本自动解析）。**目录声明不支持**（`normalizeFileList` 对以 `/` 或 `\` 结尾 / 指向既有目录 → 抛明确错误，fail-closed）。归一化：相对 cwd 转绝对 + 正斜杠 + win32 小写比较键。
- **`dependsOn?: string[]`**——子代理 id 列表（显式依赖）。
- **`batchDoc?: string`**（eng-coder spawn **门禁参数**——非调度参数，不参与冲突判定）：工程模式 spawn `role="eng-coder"` **必传**（批次档路径）；判据 = 参数在 + `resolve(cwd, batchDoc)` 存在且为文件（**不校验内容 / 措辞**）；缺失 / 不可读 → spawn 拒绝（校验落点 = `buildSpawnChild`——token 门之前，sync / async 两路共经）。
- **准入（spawn 时）**：(running ∪ queued) 有 files 交集 或 `dependsOn` 未 done → 入 queued（waiting-deps 态记原因）；否则立即 start。**仅 async 参与调度**：sync spawn 带 `files` / `dependsOn` 且命中冲突 → **明确错误**（不队列化）。
- **动态文件域**：冲突判定的「他条目域」= `effectiveFiles(e)` = 声明域 ∪（running 且已绑 `childAgent` 时的 `childAgent._touchedFiles`——写工具批提交实时记录）；queued 条目无 `childAgent`（start 才绑）⇒ 天然只声明域。out-of-list 写入由此获得域保护。
- **补位（`maybeRefillAsync`）**：settle / cancel 释放槽后从 queued 选「依赖全满足 + 域无冲突」的最早条目启动到槽满（先入者优先）。
- **同文件串行序判定（防互等）**：域冲突阻断**只适用「先入者」**（id 数值比较——spawn 序递增）与 running；**后入者不阻断**——避免两个 queued 同文件互等死锁。running 永远阻断。
- **依赖终态释放**：依赖在目标 settle（任何终态）或条目移除时视为满足；依赖取消 / 失败 → 依赖者留 queued 标 `dependency-cancelled` + 注入提醒供模型决策（仅父侧显式处置或 AUTO 档才自动启动——滞留有意、显式可清、不静默）。
- **`dependsOn` 成环 → spawn 拒绝**（防御断言）；**unknown id → 拒绝**（明确错误）。
- **停滞机械检测（`detectStall`）**：池无 running 且 queued ≥1，且每 queued 的 blocker（files 冲突者 + 未 settle 依赖目标）都落在 queued 集内（阻塞闭包无外逃）且无 dep-cancelled 标记 → status 视图标记停滞 + 逐条阻塞链 + 引导 cancel 破环（保守不误报）。
- **排队面板 UX**：任何排队 spawn 在 spawn 返回时立即建面板块（`⟦ev⟧queued` / `cancelled` 事件 token）——块头标注 `[▶ role#N · waiting] waiting for: …` / `queued · position N`；启动后转 running（同 key 不重建）。
- **父侧文件拦截（R26）**：父侧维护文件（`docs/TODO.md` · `CHANGELOG.md` · `checklist.md` 及 `checklist*` 前缀）**不得列入 files 声明**——黑名单机械校验（归一化后 basename 全名匹配 + 大小写不敏感，路径任意层）→ 声明含任一 → 拒绝 + 英文提示（fail-closed，校验先于调度器）。**设计文档仍可声明**（eng-coder 落实现记录是常态——不误伤）。

### 6.10 回合外事件后台化统一模型（分域池 + async advisor）

- **池容量**：`ASYNC_POOL_LIMITS = { engCoder: 4, other: 4 }`（默认）；角色域 = `role === "eng-coder"` → engCoder 池，其余（explore / plan / coder / sub）→ other 池。运行中计数按域分别记；队列补位按域腾槽。**跨域总量 8、同域仍 4**。
- **配置键**：`agent.poolLimits = { engCoder, other, advisor }`——subagent 两键运行期读 + 校验（正整数 ≥1，非法回退默认 4 / 4）；advisor 第三键由独立读取器消费（合法 ≥1 整数生效；非法 / 缺省回退 4）。变更下回合生效。
- **async advisor（独立后台评审池）**：池 = `_asyncAdvisors`（复用 pending / digest / 注入 / 冻结机制；runner 包装 `runAdvisorReview`，不碰 subagent 管线）；容量默认 4——**超限 → 返回错误文案**（「另有一评审在跑——逐个发起」；评审间有依赖语义 ⇒ 排队无意义）。
- **同 scope 并发守卫**：launch 判定两关独立——① 池容量（全局 running ≤ 生效上限）；② 同 scope（同 `reviewType` + scope 有 running 评审 → 拒；design scope = 文档集键 `docSetKey`；code = 单 `code` 线程 `openCodeRun`）。拒文案含 scope 语义与指引；`settled` 续跑语义不变。
- **工具语义**：advisor 加 `async: true`；**缺省 async**——仅 depth-0（depth>0 显式 async 拒 / 缺省恒同步）。发起返回 ack → 回合自然收尾 → 挂起态 → settle → digest。
- **UI 通道**：subagent 面板 + `role="advisor"` 伪角色（块 / ⏹ / 冻结全复用）；cancel = 定向 abort → cancelled settle（不入 pending、不入 token 槽、digest 提示「评审已取消——token 未签发」）。
- **settle 记账**：评审 settle 时（消化链首行注入前）——① **陈旧判定**（launch 后发生 `FILE_MUTATORS` ⇒ 基于旧状态 ⇒ 不置 `_calledAdvisorThisRun`、代码评审不签发 token，guard 仍推回发起新评审）；② 通过 → token 入槽 `_engDesignTokens` + 当场同步落盘权威台账；③ `_advisorRound` 改按 review 实例记（cap 随实例 ≤5 轮）；④ guard 推回判定看后台评审是否已 settle 且非陈旧。
- **收敛状态 per-review 化**：`_advisorRuns: Map<reviewId, { round, priorOutput, stale }>`——`reviewId` = `designId`（设计评审）/ 随机 id（代码复核）；多评审并行隔离。
- **消化处置轮**：报告注入 → 模型消化（呈递发现 + 修复建议——不擅自动手）→ 用户逐项拍板 → 修正轮在 agent 回合内发起 round2（async 再启——round / prior 从 `_advisorRuns` 取）。
- **凭证机制**（designId / token：设计锚 / 同步 / 回显 / 登记 / 消费 / 校验）→ 属工程模式板，见 §8.2 登记。

### 6.11 后台评审池可观测 / 可控（接入面补全）

1. **状态通道**：`subagent status` 读**两池并集**——子代理池 + 评审池（`getAsyncPool(agent, "advisor")`）；单查（带 id）先子代理池、未命中落评审池
   （两池共用 `nextSubagentId` 命名空间——id 全局唯一）；概览 `running` 行含 `role` / `model` / `elapsedSec` / `turn` / `maxTurns`（子代理）
   或 `reviewType` / `round` / `elapsedSec`（评审）；`done` 行带「已 settle 未消化」注记（走自动送达通道）；未命中两池 → 既有错误文案不变。
2. **等待口径**：`wait_for "advisor settled"` 判据 = **评审池无 running / queued 条目**（双载体：`agent._asyncAdvisors` ∪ `history._asyncAdvisors`）——与「未决评审判定」同源（`advisorReviewPending` / `advisorReviewInFlight`）；条件字面 / 超时 / 间隔语义零变。
3. **取消路由**：`subagent cancel <id>` 在子代理池未命中时**落评审池**——命中 running 评审 → `entry.cancelled = true` + `controller.abort()` + 机读线提醒（「评审已取消——token 未签发」）+ 幂等（重复取消返回同一确认）；未命中两池 / 已完成 → 既有错误文案。取消语义同 §6.10（不入 pending、不入 token 槽）。
4. **动作面指引**：`observe` / `send` 遇 advisor id → 明确指引（指向 `action:'status'` 或提醒结果自动送达）；两动作**不为 advisor 开新能力**。
5. **工具描述**：`subagent` 工具描述 status / cancel 句补「后台评审（advisor）同面可查 / 可取消」（两端各自原文自持——语义同源）。

### 6.12 子代理 abort 来源标注（可诊断性）

**单一权威源** = `thincoder-core/abort-provenance.mjs`（纯函数、零 import——任意层可引、无环）。

**trigger（枚举 5 值）**：

| trigger | 判据（`signal.reason`） | 发起面 |
|---|---|---|
| `user` | `reason.interrupt === true` | Ctrl+C 停回合 / Ctrl+I / ACP cancel |
| `timeout` | `reason.name === "TimeoutError"`；或 `reason.abortTrigger === "timeout"` | 读侧 idle / proxy 定时器 / consult watchdog |
| `cancel` | `reason.abortTrigger === "cancel"` | 池 cancel / sync ⏹ / 评审 cancel |
| `stop` | `reason.abortTrigger === "stop"` | 全停 / 清池 / consult 会话停 |
| `unknown` | reason 缺失且错误无 `abortInfo` | **诊断告警态**（残留 / 未标注路径——必须显式呈现，不得静默） |

**layer（枚举 3 值）**：`provider` / `agent` / `settle`；未标注错误回落 `unrecorded`（合成器兜底 token——计入 unknown 告警形态）。

**求值链（一处写死；`deathLine` / `annotateAbort` 共用）**：`err.abortInfo?.trigger`（已标注 ⇒ 直取）→ 否则 `triggerOf(signal)`（信号域）→ 否则 `err.name` 兜底（`TimeoutError` → `timeout`；`AbortError` → `unknown`（告警））。归属：标注域归产生点与 `annotateAbort`；信号域归 `triggerOf`；兜底归合成器。

**reason 形态（4 形态——就地扩展，向后兼容）**：① `{ interrupt: true(, message) }`（既有——user 面）；② `TimeoutError`（Node 原生——timeout 面）；③ `{ abortTrigger: "cancel"|"stop"|"timeout"(, abortDetail) }`（新增——程序性取消 / 停止 / 定时器）；④ 缺失（→ unknown）。既有 `reason.interrupt` 判据点**零触碰**（新增形态不含 `interrupt` 键）。

**模块接口**（纯函数、零 import——任意层可引、无环）：

- `TRIGGERS`（枚举权威，计数 5）；`triggerOf(signal)`（按判据序判定）；`deathLine(err, signal)`（报告面合成器）。
- `abortError(signal, layer, detail)`（产生点：`AbortError` + reason 透传 + `abortInfo` 标注）；`timeoutError(message, layer, detail)`（定时器面）。
- `annotateAbort(err, signal, layer, detail)`（外部错误补标——缺 `abortInfo` 才补，不改 name / message；`detail` 载站点名短串；缺省回落 `unrecorded`）。

**死亡行形态（合成器输出——fail-when-unchanged 断言锚）**：`<原 message>[ ← cause: <cause.message>][ · abort(<trigger>@<layer>:<detail>)]`。

- 原 message 前缀**逐字保留**（零回归——既有前缀 / 包含断言不受影响）；
- 后缀出现条件 = `err.abortInfo` 存在 ∨ `signal?.aborted` ∨ `err.name ∈ { AbortError, TimeoutError }`；
- unknown 形态（告警）= `· abort(unknown@<layer>:no reason on signal)`；未标注回落 `unknown@unrecorded`；总长 ≤300 字符（超长优先截 detail）。

**站点规则（覆盖勘察外漏网）**：**对单个任务目标的定向中止 = cancel；整批 / 会话 / 回合级停止 = stop；用户按键 = user；定时器 = timeout；无标注 = unknown**（unknown 即告警——不得静默）。站点面（产生 / 传播 / 取消停止 / 定时器四类）与报告面合成点（settle 族 5 处）的逐档坐标属**实现面快照**——以本档词汇表 + 模块接口为契约面，坐标随实现演进（旧档 §20 站点总表原文见来源档）。

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
| 工程模式判定 / 铁律 / token 门 / 主流程 | 工程模式档（CLI 仓·设计——根层暂无对应档） | §6.7.6 协议概览 + 文档纪律来源 |
| 评审轮次收敛 | 评审收敛档（CLI 仓·设计） | §6.10 对象锚 + 轮次语义 |
| 测试分层 L0 / L1 / L2 | 测试档（CLI 仓·设计） | §6.7.6 指注 |
| 工具注册 / schema / ctx / hooks / undo | 本层 `TOOLS.md` | §6.4 调度决策语义 |
| 结果落盘阈值 | 工具输出上限系（CLI 仓·设计） | §6.4 引用 |
| TUI 显示 / 渲染 / 折叠块 | CLI 壳体面（`TUI.md`） | §6.7 显示面指针 |
| 会话 | 本层 `SESSION.md` | `read_history` 语义 |
| 上下文压缩 | 本层 `CONTEXT-COMPACTION.md` | §6.2 压缩安全点 |
| 会诊 / 飞刀机制 | 本层 `CONSULTATION.md` | §8.2 登记 |
| 轨迹存储 | 本层 `TRACES.md` | §8.2 登记 |
| 事件日志 | 本层 `LOGGING.md` | 轨迹上游互补 |
| 模型上下文配置 | 本层 `PROVIDER.md` | 推理 / 预算 |
| 记忆 | 本层 `MEMORY.md` | §6.3 记忆检索 |
| MCP 机制 | 本层 `MCP.md` | 工具面扩展 |
| 多实例协作感知 | 多实例协作档（CLI 仓·设计） | 并行副本感知 |

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
| D-AL11 | 评审**不排队**（超限 / 同 scope 直接拒） | 评审间有依赖语义——排队无意义；拒文案给指引 |
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

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/AGENT-LOOP.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**，理由如下：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 档首「未决 / 待办状态行」 | 十条 live 未决项（多带 `docs/TODO.md` 指向） | **时点状态行**——live 跟踪面唯一权威 = 台账（D2）；条目现状未经本批复核 |
| 档首「变更记录（历史折叠）」+ 各节「变更记录」 | 逐批变更流水账 | 历史叙述——本档自有变更记录；旧档即该历史的载体 |
| §1 末「模块拆分批」叙述 | 拆分史（subagent-async → scheduler / actions / panel） | 旧结构叙述——现行模块面见 §6.1 |
| §7.7 / §7.7.1 的「改」列表与交付状态 | 逐项改造清单 + 交付核销状态 | 批次材料（改造已完成——结论已入 §6.7.5） |
| §11.3「排队用户指令合并（R15）」 | 已废弃机制的形态描述 | **已作废**——结论（排队整批废弃、`pendingInput` 单槽）已入 §6.8 |
| §12.2 判定铁律 R1–R7 逐字 | 评审判定铁律 | 属**评审收敛板**（见 §8.2） |
| §12.4「byte-identical 取消」 | 双端字节一致约束取消 | 属**提示词系统板**（见 §8.2） |
| §19 会话上下文轮退役 / 普通模式偏差审计评估 | 退役评估（「从未实现」「四机制承接」） | **已作废设计的评估记录**——历史面（承接机制现状见 §6.16 指针表） |
| §20.5 / §21.4 / §23.4 等「否决备选」原文 | 逐条否决论证全文 | 结论已提炼入 §7；原文的批次语境不随迁 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档节 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| §13 完整轨迹存档 | 采集点 / 元数据 / 脱敏 / 写盘 / 默认 OFF | 属**轨迹存储**板块（本层 `TRACES.md`）——本批只覆盖 AGENT-LOOP / MEMORY 两板块 |
| §14 会诊 / 飞刀异步化 | consult settle / 注入时机 / escalate 三分类 | 属**评审 · 会诊 · 飞刀**板块（本层 `CONSULTATION.md`） |
| §12.1–§12.4 | 评审对象锚 / 判定铁律 / 文档归属纪律 / byte-identical 取消 | 评审面属**评审收敛**板（CLI 仓·设计）；文档纪律属**文档体系**板 |
| §8.1 后半 + §11.2 凭证机制 | 工程交付协议完整面 / designId-token 全链 | 属**工程模式**板（CLI 仓·设计——**根层暂无对应档** ⇒ 缺档登记） |
| §15 操作纪律 / 工具使用 | 并行化 / 委托标准 / Module Split Policy / edit 纪律 | 属**提示词系统**板（正本 = `docs/core/design/prompts/`——内容权归主 agent） |
| §7.6 子代理 / 顾问人格逐字锚集 | coder / consult-base / advisor 四模板锚句 | 锚定稿源 → 已落**提示词正本**（`docs/core/design/prompts/` 同名槽位档） |
| §18–§23 各节「用例表 / AC 表 / 受影响文件表」 | 逐批测试与文件清单 | **一次性批次材料**——文档分层纪律（不入长期档）；批次档承载 |
| §23.3.2 轨迹面契约 | 单遍序列化 / 额度双层 / 在途上界 / 序号缓存 | 属**轨迹存储**板块（同上） |

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **670 行**（B 轮并入前 161 行）——**超 300 行软线且超 500 行硬限** ⇒ 须拆分规划（承 `DOC-SYSTEM` 自身先例）。

| # | 拆分面 | 去向 | 状态 |
|---|---|---|---|
| 1 | §6.13 Stop 钩子（hooks 引擎触发与事件表） | 工具系统板（本层 `TOOLS.md`）——hooks 事件表的长期权威本在工具系统板 | **建议**（待父侧裁定——迁移批落地） |
| 2 | §6.12 abort 来源标注的 provider 产生点半边 | 供应商板（本层 `PROVIDER.md`）——跨板拆分 | **待裁定** |
| 3 | §6.1–§6.6（主循环 / 装配 / dispatch / guard）∥ §6.7–§6.10（子代理 / 异步 / 调度 / 池） | 两档分家（机制族二级档） | **需用户裁定**——与「一板块一档」的板块镜像惯例冲突 |

**落地时点** = 迁移批（本批不拆）；拆分动作不得改语义（段零改动 + 只修引用）。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #76 / #78 / #94 / #98–#103 / #111–#113 / #149–#158 / #165 / #166 / #169 / #175 / #176 / #184 · §2.5.1 A7 / A15 / A22 / A23 / D2）；**语义零改**，行号沿用原编号。
- 2026-09-13：同行次——**#170–#173（技能 / 规则 / 同伴）改归 `docs/design/WORKSPACE.md`**（同批拆分轮内的归属校正：与 #174 台账展示面同族，归工作区约定档）。
- 2026-09-14（S1 收口轮）：新增 **§2.3 #184 核内形态**（注入面 / 端特有面 / 验收点——S1 续轮执行面）；§3.2 丁组 **D2 裁定状态收正**（已裁 · 按建议）；§2 两处裸 basename 锚补路径前缀（`thincoder-vscode/src/config-io.mjs:319`——机检修复）。
- 2026-09-14（markdown 面小收正轮）：§1 归属表 `helpers.mjs` 补路径前缀（`src/agent/helpers.mjs`——与 `src/mcp/helpers.mjs` 同名不同物，**消除歧义不改判据**）。
- 2026-09-14（写路径缝落地补正轮 · eng-designer）：§2.3 核内模块行数收正（`thincoder-core/agent/suspension.mjs` 已落 **234 行**——原估 +170±40 被实际取代）；§3.1 增「**未并入项登记**」（A7 / #78：VSC「仅 reasoning ⇒ 视为 content」分支未并入核内——非偏离，登记项）。
- 2026-09-14（载体字段集补正轮 · eng-designer——S2 接线前）：§2.3 carrier 行字段集补两款（`_asyncQueue`（排队容器）· `_asyncTombstones`（终态墓碑））；新增「载体字段集与回写义务」块（回写义务 · 谁写 / 何时写 · VSC 绑定不变式覆盖全 7 字段 · 队列 / 池无借用步勘定注）；验收点 2 扩「不预置载体字段」夹具。
- 2026-09-14（载体字段集小收正轮 · eng-designer——S2 接线前）：§2.3 字段集 **7 款 → 8 款**（补 `_asyncWaiters` 唤醒栓注册表——数组；注册 / 摘除 / 兑现三处坐标 + 无借用步勘定注同扩）；验收点 2「不预置载体字段」夹具与 VSC 绑定不变式同步扩至 8 字段；同族全核实扫（另 2 项同类形待裁）见批次档 §2。
- 2026-09-14（载体字段集二轮小收正 · eng-designer——S2 接线前）：§2.3 字段集 **8 款 → 10 款**（补 `_advisorRuns` 评审实例注册表 · `_mutLog` 变更日志——VSC 对位名 `_fileMutEvents`；访问点 / 回写义务 / 名差登记同扩）；验收点 2「不预置载体字段」夹具与 VSC 绑定不变式同步扩至 10 字段；**10 款即全集**结论落档（实扫依据见批次档 §2）。
- 2026-09-14（**B 轮并入 · 试点批**）：新增 §6 **机制面**（模块职责 / 主循环与中断 / 装配注入 / dispatch 与权限 / guard 链 / 回合后注入 /
  子代理全族 / 挂起 digest / 文件域调度器 / 分域池与 async advisor / 评审池接入 / abort 来源标注 / Stop 钩子 / digest 预算 / 内存上界 / 权威源指针）·
  §7 **关键决策记录（D-AL1–23）** · §8 **不并项与历史沿革**（跨板块 / 一次性材料 / (d) 类逐项登记）· §9 体量与拆分规划；
  来源 = `thincoder-cli/docs/design/AGENT-LOOP.md`（**旧档一字未改**——原地作参照历史）；首部加机制面指针一行。本档 161 → **670 行**。
