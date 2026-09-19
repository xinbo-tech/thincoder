# 轮末探索蒸馏的时序（SEND-STALL-DISTILL）· 需求

> 板块 = **轮末探索蒸馏的时序**——「何时等待 / 是否等待」。
> 本档 = 该时序面的**需求层权威**（FR1–FR4 / N1–N5 判定句）。
> **蒸馏本体需求不属本档**：机制本体（替换规则与静默语义）= `docs/core/requirements/CONTEXT-COMPACTION.md`（单一权威源，本档不复制）。
> 设计侧 = `docs/core/design/SEND-STALL-DISTILL.md`（三段时序 / 中止面 / 失败路径 / 双端坐标）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 3**——`thincoder-vscode/docs/requirements/SEND-STALL-DISTILL.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。**CLI 侧同名需求档已对账并入**（2026-09-15 批 5——并入面 = N3 的 CLI 中止形态；旧档留参照历史）。
> 实测口径 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 总体定位

一轮会话最后一段输出渲染完成后，UI 仍僵持数秒到十几秒才恢复输入（send 按钮不出现）。根因 = 轮末探索蒸馏在最终回复之后、
`onComplete`（前端恢复按钮的唯一信号）之前**同步阻塞**执行——一次静默的第二次 LLM 调用。

目标：`onComplete` **先于**蒸馏发出、蒸馏异步完成、按钮立即恢复——**同时**保持蒸馏语义不变、磁盘会话仍为压缩版、失败仍静默。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证） |
|---|---|---|
| **FR1** | 输入按钮立即恢复 | `onComplete` 在蒸馏**之前**发出、蒸馏不阻塞回合结束——发射点 VSC `thincoder-vscode/src/agent/run-stages.mjs:232`（`fireEndOfRunDistill`）由轮末调用且**不 await**（核侧同语义：`thincoder-core/agent.mjs:342-347`） |
| **FR2** | 蒸馏语义不变 | 蒸馏 promise 在**下一轮 push 用户输入之前**被 await——摘要必在下一轮 LLM 调用前就位（核 `thincoder-core/agent.mjs:99-101`；VSC `thincoder-vscode/src/extension/panel-chat.mjs:170-172`） |
| **FR3** | 磁盘仍为压缩版 | 蒸馏**实际替换历史后**触发保存回调（哨兵 = `onDistilled`）——VSC `thincoder-vscode/src/extension/panel-callbacks.mjs:187-189`（含槽位守卫）；核侧 = 会话退出 flush（`thincoder-core/agent.mjs:84` 注释） |
| **FR4** | 失败路径不变 | 蒸馏失败静默、原始探索结果保留、不影响回合结果与历史——失败 = 返回 null ⇒ 不替换、不触发保存；发射侧 `.catch(() => null)` 防 unhandled rejection（核 `.catch(() => {})`——`thincoder-core/agent.mjs:346`） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| **N1** | 竞态安全 | 蒸馏替换历史与下一轮 push 输入**互斥**——await 必须在 push 输入之前，否则新输入被压缩替换清掉 |
| **N2** | 数据一致性 | 会话文件最终为压缩版；快速连发下一条消息不丢输入、不丢摘要；切换会话不串写（槽位守卫） |
| **N3** | 可中止（与运行 signal 分离） | 蒸馏使用**面板生命周期专用**中止信号——**仅面板 dispose / 会话切换时 abort**；用户 Stop（中止运行 signal）不影响蒸馏。中止器每生命周期一个、**不随轮次重置**（VSC `panel-chat.mjs:161-162`）。**CLI 侧形态（批 5 并入）**：由下一轮开头 await 与**退出 flush（≤5s）兑底**——异步化后**不再声称用户 Stop 可中断蒸馏**（该保证结构性失效）；Stop 只中断回合本身 |
| **N4** | 双端一致 | 同一时序（结束信号 → 异步蒸馏 → 保存回调）与同一挂载点语义（会话 / 面板侧 `pending`）。语义同源、**实现形态各端自持** |
| **N5** | 可测试 | 竞态时序（连发消息）/ 保存回调触发 / 槽位守卫 / 失败静默均有测试 |

## 4. 范围边界（不做）

- 不改蒸馏本体（替换规则 / 静默语义 / 摘要提示词）——归 `CONTEXT-COMPACTION.md`。
- 不改回合末 `onComplete` 的既有载荷与前端消费面。
- 不为子轮（`depth > 0`）开蒸馏。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/SEND-STALL-DISTILL.md`（VSC 产品需求档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已实现——2026-08-25 … + 2026-09-05 模块化；0.1.49 发布」） | 时点状态行 + 发版号 | 批次语境——现行态已入 §2–§3 |
| 旧档「归位注记」（自 `docs/design/…-REQUIREMENTS.md` 归位） | 文档树归位流水 | 树降格后失效——一次性材料 |
| 旧档变更记录（2026-08-25 起逐批流水） | 历史叙述 | 本档自有变更记录 |

### 5.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档「机制本体归 CLI 端 CONTEXT-COMPACTION」注 | 跨档归属指针 | 已归位——本体见 `docs/core/requirements/CONTEXT-COMPACTION.md` |
| 旧档「跨端 lockstep（改动须两端同步）」注 | 跨仓协作注 | 多实现面纪律已由纪律层承载（本档不重述） |
| 旧档「关联：README.md（文档地图）」 | 旧树地图指针 | 树降格后失效 |
| CLI 侧同名需求档未迁面（**已销项**） | CLI 产品需求正文 | **已对账并入（2026-09-15 批 5）**——并入面 = N3 CLI 中止形态（退出 flush / Stop 不中止蒸馏）；旧档留参照历史 |

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 批 3**）：建档——`thincoder-vscode/docs/requirements/SEND-STALL-DISTILL.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；判定句坐标按现状实核改写（双端）；与设计档成对（N-b 镜像同名）。
- 2026-09-15（**B 式迁移轮 · CLI 批 5**）：`thincoder-cli/docs/requirements/SEND-STALL-DISTILL.md` **对账并入**——并入面 = N3 的 CLI 中止形态（下一轮开头 await + 退出 flush ≤5s 兑底；不再声称用户 Stop 可中断蒸馏——Stop 只中断回合本身）；§5.2「CLI 侧同名需求档未迁面」**销项**；FR1–FR4 / N1–N2 / N4–N5 逐节比对已由现有正文承载（零新增）。
