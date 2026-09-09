# TUI §6.4 补充：CLI 活动块去加戏（CLI-ACTIVITY-DEBLOAT——2026-09-10 批）

> **归属**：本板块 = TUI.md（§6.4 子 agent 活动区块——权威章节）。本文件为本次变更的施工册（评审
> 定稿后并入 TUI.md §6.4/变更记录并删除本文件）。需求来源：对照 VSC ACTIVITY-REWRITE-SIMPLE 的 CLI
> 端去加戏（explore#5 勘察报告 2026-09-10）。**用户裁定：④ awaitingDigest 驻留保留**（§17.5.5
> 有意决策——_freezeAt/shiftFreezeAnchors/降序 splice 锚点机制随 ④ 供养零动）。
> 评审：2026-09-10 PASS（9 项 advisory 全采纳——见文末修订记录）。

## F-1（删 preview 8 行——冗余显示面）

tool-display.mjs（143 行）L19-20 两常量（SUBAGENT_PREVIEW_LINES=8/PREVIEW_LINE_CHARS=120）删；
tool-events.mjs（405 行）L189-193 preview 段删（保留 escalate#N 无 preview 注释面）。行为变化：
sync 完成后不再往会话流塞 8 行 dim 摘要（完整报告已在冻结块）。grep 消费方仅 tool-events L191。

## F-2（删 finishSubTask 猜块兜底——容错残留）

subagent-freeze.mjs（173 行）finishSubTask（L34-57）"最早 started" 启发式支路删（7.2.3.1 实测误冻
源）。**路线裁定（评审 #4 定死）：保留函数签名、函数体收窄为精确匹配校验**（roles 参数仅用于校验
断言——不再猜最早块；无精确 key 命中即 no-op 返 null——finishSubTaskKey 为唯一完成路径）。调用面
处置：生产路径已走 finishSubTaskKey（grep 核实）；剩余 finishSubTask 直调（老回调/测试）逐个改
finishSubTaskKey 或删调用。误冻面归零。

## F-3（删 _panelSnapshot 手工镜像——改读时现算）

**字段推导清单（评审 #2——已勘察确证，subagent-freeze.mjs L20-31）**：镜像四字段 key/role/status/
startedAt 均为 sync 时刻 state.subTasks **活值纯推导**（status 三态映射 done/awaitingDigest|queued|
running 亦纯函数）——无时点快照语义——读时现算等价成立。改法：
- `agent._panelSnapshot` 读写全删（subagent-freeze.mjs syncPanelSnapshot 函数体改现算导出
  computePanelBlocks(state)——同输出形状；subagent-blocks.mjs re-export 同步）
- 消费面两处改真身：agent-tools/subagent-panel.mjs（154 行）panelFreezeGate（L28-56）+
  executePanelAction view 面（L103）——镜像读改为经 ctx.state 现算（**接线点裁定（评审 #4）：
  subagent.mjs 391 行**——panel 动作 ctx 已携带 TUI state 通道（勘察确认最短路径））
- **降级路径零动（F-4 边界）**：无 TUI 装配（headless/VSC/子代理）→ 现算返 null → 池视图降级/
  freeze 报不可用照旧（T-P5 语义不变）
- syncPanelSnapshot 全部手动调用点（grep 21 命中行 ⊃ 定义 1+re-export 2+调用 10+——评审 #9 口径）
  随函数改现算后逐点清（变更点不再需要手动同步——单账本）
- panelFreezeGate 语义零动（F-4）：awaitingDigest 门控/池归属查/pending 查逐字保留——仅数据源从
  镜像换现算

## F-4（④ 保留边界——零动声明）

awaitingDigest 三态机/_freezeAt settle 锚 splice/shiftFreezeAnchors 头裁补偿/降序 splice 纪律/
freezeReclaimDigestedBlocks 回收/panelFreezeGate digested-stuck 门控——**全部零动**。用户可见变化
仅 F-1（少 8 行重复摘要）与 F-2（误冻消除——生产路径本不走兜底支路，生产行为不变——评审 #1 口径
统一）。不引入块落盘恢复（CLI 本无——红线）。协议零改。

## 受影响文件（评审 #3 补全）

| 文件 | 现行数 | 增量 | 改动 |
|---|---|---|---|
| src/tui/tool-display.mjs | 143 | -4 | 两 preview 常量删 |
| src/tui/tool-events.mjs | 405 | -6 | preview 段删（L189-193） |
| src/tui/subagent-freeze.mjs | 173 | -20 区 | finishSubTask 兜底支路删 + syncPanelSnapshot→computePanelBlocks 现算化 |
| src/tui/subagent-blocks.mjs | 457 | -5 区 | syncPanelSnapshot re-export 换 computePanelBlocks |
| src/agent-tools/subagent-panel.mjs | 154 | ±10 区 | panelFreezeGate/view 镜像读→现算入参 |
| src/agent-tools/subagent.mjs | 391 | ±5 | panel 动作 ctx.state 接线（现算通道） |
| test/tui-exit-cleanup.test.mjs | 97 | ±10 区 | 镜像/preview 断言改现算 |
| test/async-settle.test.mjs | 349 | ±10 区 | finishSubTask 直调面改精确 key + 兜底删除断言 |
| docs/design/TUI.md | — | §6.4/变更记录 | 本施工册并档（评审 #7 归属裁定） |

（五源文件均 ≤457 行且增量为负——不跨 500 硬档——无 split plan。）

## 用例表（评审 #6 补正常路径/空态）

| 用例 | 输入 | 预期 |
|---|---|---|
| preview 删 | sync 完成 | 会话流无 8 行 dim 摘要——冻结块内报告完整——F-1 |
| 精确 key 命中（正常路径） | finishSubTaskKey(key) 且块在 | 块正常完成冻结——对照旧行为回归绿——F-2 |
| 精确 key 无块（边界） | finishSubTaskKey(不存在 key) | 返 null 不猜不误冻——F-2 |
| panel 现算-正常 | subagent action:'panel' | 输出与 TUI 面板真身一致（单账本）——F-3 |
| panel 现算-空态（边界） | 零 subtask/全 settled | 现算输出形状与改前镜像一致/空列表——F-3 |
| 驻留保留 | 挂起期 settled | "done · awaiting digestion" 驻留 + digest 回收照旧——F-4 |
| 锚点不回归 | 头裁 1000 | shiftFreezeAnchors 补偿照旧——F-4 |
| 降级路径 | headless/VSC 上下文 | 现算返 null→池视图/freeze 不可用照旧——F-3 降级零动 |

## 验收

- AC-1 grep src/ + test/：SUBAGENT_PREVIEW_LINES/PREVIEW_LINE_CHARS/syncPanelSnapshot/_panelSnapshot
  零命中（**范围 = 源码与测试——文档提及不算**——评审 #5 口径）
- AC-2 finishSubTask 无启发式支路（精确匹配唯一路径）——命中/无块两侧测试绿
- AC-3 panel 现算输出形状不变（正常/空态两侧）——panelFreezeGate 行为等价
- AC-4 awaitingDigest 驻留/回收/锚点测试全绿（零回归）
- AC-5 CLI npm test 快层零回归
- 红线：④ 语义/锚点机制零动；不引入块落盘恢复；协议零改；F-1/F-2→F-3 顺序执行

## 被否决备选（评审 #8）

- F-3「修复镜像（事件驱动自动同步）而非删除」——否决：双账本结构性漂移风险仍在（VSC _subagentMap
  同款已删）——现算单账本根治
- F-2「保留兜底加告警日志」——否决：误冻是错动作（冻错块），日志救不回——宁可 no-op 不误冻
- ④ 删除（连带锚点机制全删）——用户裁定保留（挂起期可见 UX 有意决策）

## 变更记录
- 2026-09-10：初版落独立档 CLI-ACTIVITY-DEBLOAT.md（用户裁定 ④ 保留 + ①②③ 清理）。
- 2026-09-10：评审 PASS + 9 项修订——#1 F-2 生产行为不变口径统一进 N1/F-4；#2 镜像字段推导清单
  （活值纯推导确证）；#3 受影响表补全（subagent.mjs 391/panel 154/测试两文件 + 行数）；#4 F-2 路线
  定死（保留签名收窄）+ 接线点定死（subagent.mjs）；#5 AC-1 收窄 src/+test/；#6 用例表补命中路径/
  空态两行；#7 **归属裁定：并入 TUI.md（§6.4 归属章节）——本档转施工册，并档后删**；#8 被否决备选
  三条；#9 grep 命中口径注明。执行版定稿——token 96713fb2。
