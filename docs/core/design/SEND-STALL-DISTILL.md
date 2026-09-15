# 轮末探索蒸馏的时序（SEND-STALL-DISTILL）· 上下文板块

> 板块 = **轮末探索蒸馏的时序**——「何时等待 / 是否等待」（蒸馏的**何时**面）。
> 本档 = 该时序面的**唯一权威**（会话级挂载点 / 三段时序 / 中止面 / 失败路径 / 双端坐标）。
> **蒸馏本体不属本档**：替换规则与静默语义 = `docs/core/design/CONTEXT-COMPACTION.md` §6.9（探索结果语义摘要——单一权威源，本档不复制）。
> 相邻权威 = `docs/core/design/AGENT-LOOP.md`（主循环轮末）· `docs/core/design/SESSION.md`（保存面）。
> 需求侧 = `docs/core/requirements/SEND-STALL-DISTILL.md`（FR1–FR4 / N1–N5）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 3**——`thincoder-vscode/docs/design/SEND-STALL-DISTILL-TUNING.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。CLI 侧同名档（`thincoder-cli/docs/design/SEND-STALL-DISTILL.md`）**已并入（2026-09-15 · CLI 尾部真批）**——
> CLI 独有面（TUI 保存回调接线 / 退出 flush 有界等待）已入 §2.3 / §2.6 / §3，(d) 类入 §5.1。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 问题陈述

一轮会话最后一段输出渲染完成后，UI 仍僵持数秒到十几秒才恢复输入（send 按钮不出现）。根因 = 轮末「探索结果蒸馏」在最终回复之后、
`onComplete`（前端恢复按钮的唯一信号）**之前**同步阻塞执行——一次静默的第二次 LLM 调用。

| # | 问题 | 说明 |
|---|---|---|
| P1 | **轮末同步阻塞（send 延迟）** | 蒸馏原在 `onComplete` 之前同步 `await`——按钮恢复被延迟 10+ 秒；蒸馏静默（无 UI 反馈） |
| P2 | **替换后不触发保存** | 蒸馏用原地替换把机器行换成压缩版，发生在 `onComplete` 的保存**之前**——异步化后 `onComplete` 提前 ⇒ 保存的将是未压缩版，必须蒸馏完成后再保存一次 |
| P3 | **蒸馏 promise 需跨轮存活** | 每轮 `runAgent` 重建 agent 对象 ⇒ 挂载点必须在会话 / 面板侧（跨回合存活），经 `runOpts` 传入 |

## 2. 现行机制（时序）

**总纲**：`onComplete` **先行** → 蒸馏异步在途（挂 `pending`）→ **下一轮开头 await** → 落位后 **`onDistilled` 保存回调**。

### 2.1 轮末：`onComplete` 先行 + 发射蒸馏（FR1）

仅顶层（`depth === 0`）触发：先发 `onComplete` 释放前端，再把蒸馏 promise 化挂起、**不 await**，立即返回回合内容。

- 发射函数 = `fireEndOfRunDistill`（VSC `thincoder-vscode/src/agent/run-stages.mjs:232`；核侧同语义调用点 = `thincoder-core/agent.mjs:346`）。
- **depth 守卫**：子轮（`depth > 0`）不得创建蒸馏——否则先创建者晚 resolve 会 clobber 历史（竞态）。
- 落位时 **原地改保持 history 引用**（同一数组），并失效 token 基线（机器行形状变了）；随后调 `onDistilled`。
- 蒸馏本体 = `summarizeRunExplorations`（VSC `thincoder-vscode/src/explore-distill.mjs:154`；核 `thincoder-core/explore-distill.mjs:145`）——
  两档为**同名同源模块**（各端自持、语义同源）；旧 VSC re-export 中转档 `thincoder-vscode/src/compact.mjs:388` **已删**（W6 迁核——现体消费 = `thincoder-vscode/src/agent/run-stages.mjs` 直引 VSC 蒸馏本体；核侧 re-export 见 `thincoder-core/context.mjs:392`）。

### 2.2 下一轮开头 await（FR2 / N1）

`runAgent` 开头、**push 本轮输入之前** await 上一轮蒸馏——压缩后的机器行是本轮起点，先落定再 push，否则新输入被压缩替换清掉。

- 核侧：`thincoder-core/agent.mjs:99-101`（`_pendingDistill` 取出 → 置 null → await；字段声明 `:84` 注释直引本机制）。
- VSC 侧：`runAgent` 内同款 await，**另**在 `runPanelChat` 级有一处同因 await（`thincoder-vscode/src/extension/panel-chat.mjs:170-172`）——
  面板每轮从磁盘**重建** history 数组，若只在 `runAgent` 内 await，缩掉的会是上一轮那根**已脱离**的数组、本轮仍从陈旧未压缩行开始。
  两层互不冲突。
- resume 场景（`ContinueError` 后 continue）：重建运行参数时 pending 已清——幂等。

### 2.3 保存回调（FR3）

蒸馏实际替换历史后触发 `onDistilled` → 再保存一次（`onComplete` 保存的是未压缩版）。

- VSC：`thincoder-vscode/src/extension/panel-callbacks.mjs:187-189`（`onDistilled`：槽位守卫 `panel._slot !== distillSlot` 即返回；随后 `panel._saveLines(..., distillSlot)`；失败静默）。
- CLI：`thincoder-cli/src/tui/tool-events.mjs:395`（`buildToolCallbacks` 提供 `onDistilled` → 复用现有保存逻辑 `saveSessionImpl`，try/catch 静默；
  callbacks 由 `src/tui/agent-turn.mjs` 传入 `runAgent`）。**仅在实际替换成功时**触发（失败 / no-op 不调——历史保持原样）。
- **槽位快照**：`distillSlot` = 回合开头、任何 await **之前**捕获的面板槽位（经 `ensureSlot` 而非裸读——裸读会把 null 冻进快照、使槽守卫恒拒绝）。
- **工程字段复用**：`onComplete` 时捕获的 agent state 随闭包携带，供异步的 `onDistilled` 保存复用（VSC `panel-callbacks.mjs:115-116`）。

### 2.4 中止面（N3——与运行 signal 分离）

- VSC 挂载点 = `panel._distillState ??= { pending: null }`（`thincoder-vscode/src/extension/panel-chat.mjs:157`，跨回合存活）；
  中止器 = `panel._distillController`（`:161-162`，**每面板生命周期一个、不复用 / 不随轮次重置**——快速连发下不得取消在途蒸馏）；
  传入运行参数见 `:403`。
- **abort 点**（运行 signal 之外的独立中止）：面板 dispose / 视图销毁 · 会话切换（新建 / 删除 / 加载）。
- 运行 signal 只用于 abort **运行中**的回合——**不再传导到蒸馏**：用户 Stop 不影响蒸馏。
- 核侧对照：`_pendingDistill` 的会话退出 flush（`thincoder-core/agent.mjs:84` 注释：awaited at next run start / **TUI exit flush**）。

### 2.6 CLI 退出前 flush 蒸馏（FR3 补强 · CLI 专有面）

进程退出（TUI 关闭 / Ctrl+C 二次确认退出）前，给在途蒸馏一个**有界等待窗口**再执行最终保存：
窗口值 = `ctx.distillFlushTimeoutMs ?? DISTILL_FLUSH_TIMEOUT_MS`（默认 **5s**——`thincoder-cli/src/tui/agent-turn.mjs:29`；
flush 点 = 每轮 `runAgentTurn` 的 finally——`:286-287`，render 已先行、退出场景自然覆盖）。

关键点：flush **不摘除** `_pendingDistill`（`:282` NOTE）——蒸馏窗口内新一轮提交 / 退出，下一轮 `runAgent` 开头的 await 仍能看到在途蒸馏并先 await（N1）；否则用户在蒸馏窗口内退出会丢摘要。

### 2.5 失败路径（FR4）

- 蒸馏失败 → 返回 null → 不替换、**不调** `onDistilled`（无变化无需保存）→ 下一轮 await 立即通过。行为与现状一致。
- 用户 Stop → 运行 signal aborted → 蒸馏继续完成、`onDistilled` 正常触发。
- 面板 dispose / 会话切换 → 蒸馏 signal aborted → promise reject 被吞掉 → 不替换、不保存。
- **双保险**：发射侧 `.catch(() => null)`（核侧同款 `.catch(() => {})` —— `thincoder-core/agent.mjs:346`），防 unhandled rejection。

## 3. 实现坐标汇总（双端 · as-of 2026-09-15 实核）

| 面 | 核 / CLI | VSC |
|---|---|---|
| 轮末发射 | `thincoder-core/agent.mjs:342-347`（depth 守卫 + `summarizeRunExplorations(...).catch(() => {})` + `_pendingDistill = distill`） | `thincoder-vscode/src/agent/run-stages.mjs:232`（`fireEndOfRunDistill`）· `:243`（`onDistilled` 调用） |
| 跨轮挂载点 | `thincoder-core/agent.mjs:84`（`_pendingDistill`） | `thincoder-vscode/src/extension/panel-chat.mjs:157`（`_distillState`） |
| 下一轮 await | `thincoder-core/agent.mjs:99-101` | `thincoder-vscode/src/agent.mjs`（runAgent 内）· `panel-chat.mjs:170-172` |
| 蒸馏本体 | `thincoder-core/explore-distill.mjs:145` | `thincoder-vscode/src/explore-distill.mjs:154` |
| re-export | `thincoder-core/context.mjs:392` | 旧档 `thincoder-vscode/src/compact.mjs:388` **已删**（W6 迁核——现体消费 = `thincoder-vscode/src/agent/run-stages.mjs`） |
| 保存回调 | `thincoder-cli/src/tui/tool-events.mjs:395`（`onDistilled` → `saveSessionImpl` 静默保存；callbacks 由 `src/tui/agent-turn.mjs` 传入） | `thincoder-vscode/src/extension/panel-callbacks.mjs:187-189` |
| 退出 flush | `thincoder-cli/src/tui/agent-turn.mjs:29`（`DISTILL_FLUSH_TIMEOUT_MS = 5000`）· `:286-287`（finally 内有界等待）· `:282`（不摘除 `_pendingDistill`） | —（面板生命周期中止面替代——见 §2.4） |
| 中止器 | —（会话退出 flush） | `panel-chat.mjs:161-162` · `chat-panel.mjs`（dispose）· `panel-session.mjs`（会话切换） |

## 4. 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-SD1 | `onComplete` **先行**、蒸馏**异步**在途 | send 按钮恢复不得等一次额外 LLM 调用；否决「保持同步」（P1 原样） |
| D-SD2 | 挂载点在**会话 / 面板侧**（跨回合存活），经运行参数传入 | 每轮重建 agent 对象 ⇒ 挂 agent 上必丢（P3）。否决「挂 agent」 |
| D-SD3 | 下一轮 **push 输入之前** await | 先 push 会被压缩替换清掉（N1 竞态）。否决「轮末 await」 |
| D-SD4 | 蒸馏**原地替换** history（保引用） | 面板持有同一数组 ⇒ 后续保存天然拿到压缩版 |
| D-SD5 | 蒸馏完成后再保存一次（`onDistilled`） | 否决「不保存」——异步化后磁盘会留住未压缩版（P2） |
| D-SD6 | 中止面 = **独立 signal**（panel 生命周期），运行 signal 不传导 | 用户 Stop 不该杀掉在途蒸馏；否决「复用运行 signal」 |
| D-SD7 | 中止器**不随轮次重置**、快速连发不取消在途蒸馏 | 连发下第二条消息会误杀第一条的蒸馏（竞态） |
| D-SD8 | `depth === 0` 守卫 | 子轮创建蒸馏会 clobber 历史。否决「不加 depth 守卫」 |
| D-SD9 | 槽位快照用 `ensureSlot` 而非裸读 | 首个回合可先于状态解析——裸读会把 null 冻进快照、槽守卫恒拒绝 |
| D-SD10 | 失败静默（返回 null，不替换不保存） | 蒸馏是体验优化面——失败不得影响回合结果与历史 |

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/design/SEND-STALL-DISTILL-TUNING.md`（VSC 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已实现——2026-08-25 … marketplace / Open VSX 0.1.49」） | 时点状态行 + 发版号 | 批次语境——现行态已入 §2–§3 |
| 旧档 §2.1 / §2.2 / §2.3 内嵌代码块 | 改动前的原样代码摘录（逐字实现形态） | 现态源码即权威——正文只留机制与坐标 |
| 旧档 §4 验收标准 AC1–AC8 | 一次性验收清单 | 批次材料——行为面由现行测试族覆盖 |
| 旧档「评审 #1 / #2 / #5」括注 | 单批评审批注与批序 | 一次性材料——结论已入 §4 决策表 |
| 旧档变更记录（2026-08-25 起逐批流水） | 历史叙述 | 本档自有变更记录 |

> **CLI 侧来源档** `thincoder-cli/docs/design/SEND-STALL-DISTILL.md`（2026-09-15 CLI 尾部真批对账并入）——原地保留作参照历史。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已实现（2026-08-25 实施；npm 0.12.43）」） | 时点状态行 + 发版号 | 批次语境——现行态已入 §2–§3 |
| 旧档 §2.1 / §2.3 / §2.4 内嵌代码块 | 实现形态摘录 | 现态源码即权威——正文只留机制与坐标（与 VSC 侧同型判例一致） |
| 旧档 §3 验收清单（「轮末 runAgent 不等待蒸馏（<1s 返回）…全套测试通过」） | 一次性验收清单 | 批次材料——行为面由现行测试族覆盖 |
| 旧档变更记录（含 2026-09-05 模块拆分注） | 历史叙述 | 拆分结论已反映于 §3 坐标；本档自有变更记录 |

### 5.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档 §1「评审 #4」括注（机制本体归 CLI 端） | 跨档归属指针 | 已归位——本体见 `docs/core/design/CONTEXT-COMPACTION.md` §6.9 |
| 旧档「文档地图惯例」注 | 旧树地图惯例 | 树降格后失效——登记表已退休 |
| CLI 侧同名档未迁面（CLI 台账列为后续批） | CLI 产品档正文 | **已并入（2026-09-15 CLI 尾部真批）**——CLI 独有面入 §2.3 / §2.6 / §3，(d) 类入 §5.1 |

## 6. 体量与拆分规划（R24a）

**实测行数**：本档 **约 155 行**（as-of 2026-09-15 CLI 尾部真批并入后实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 并入既有 · eng-designer**）：`thincoder-cli/docs/design/SEND-STALL-DISTILL.md` 逐节对账并入——
  CLI 独有面入档：TUI 保存回调接线（`tool-events.mjs:395` `onDistilled` → `saveSessionImpl`，§2.3 / §3）· **§2.6 CLI 退出前 flush**
  （有界等待 5s · 不摘除 `_pendingDistill`）；§3 坐标表「保存回调 / 退出 flush」两行按实装收正（原核/CLI 栏仅「—（会话退出 flush）」——不完整）；
  (d) 类（状态行 / 内嵌代码块 / 验收清单 / 逐批流水）入 §5.1。旧档原地一字不改。
- 2026-09-15（**B 式迁移轮 · VSC 批 3**）：建档——`thincoder-vscode/docs/design/SEND-STALL-DISTILL-TUNING.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；坐标改写为现状路径并实核（`thincoder-core/agent.mjs` · `explore-distill.mjs` · `context.mjs`；
  `thincoder-vscode/src/{agent/run-stages.mjs,explore-distill.mjs,compact.mjs,extension/panel-chat.mjs,extension/panel-callbacks.mjs}`）；
  内嵌代码块与验收清单不并（§5）；蒸馏本体指向 `CONTEXT-COMPACTION.md` §6.9（D2 单一权威源）。
