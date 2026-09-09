# CLI 活动块去加戏（CLI-ACTIVITY-DEBLOAT）

> 板块：CLI TUI 活动块机制（对照 VSC ACTIVITY-REWRITE-SIMPLE 的 CLI 端去加戏——**非镜像**：CLI 形态
> 不同——无恢复族加戏——删冗余显示/容错残留/跨层镜像三族）。权威勘察：explore#5 对照报告（2026-09-10
> ——CLI subagent-freeze/blocks/panel/suspension-drive 全读）。状态：**设计待评审/待批准**。
> 用户裁定：④ awaitingDigest 驻留保留（挂起 UX 有意决策——§17.5.5 不动——锚点补偿机制随 ④ 留）。

---

## 需求

- **总体目标**：CLI 活动块机制删三族加戏（①冗余显示 ②容错残留 ③跨层镜像）——④ 驻留语义与其供养
  结构（_freezeAt/shiftFreezeAnchors/降序 splice）保留不动。不触碰恢复语义（CLI 本就无块落盘）。
- **功能性**：
  - F-1（删 ① preview 8 行）`tool-display.mjs` 两常量（SUBAGENT_PREVIEW_LINES/PREVIEW_LINE_CHARS，
    L19-20）+ `tool-events.mjs` L189-193 preview 段删——sync 完成后不再往会话流塞 8 行 dim 摘要
    （完整报告已在冻结块——点开即看）
  - F-2（删 ② 猜块兜底）`subagent-freeze.mjs` finishSubTask（L34）"最早 started" 启发式兜底支路删
    （7.2.3.1 实测误冻源）——精确 key（finishSubTaskKey）为唯一路径——老回调/测试直调面改精确 key
    或删调用
  - F-3（改 ③ 镜像→读时现算）`agent._panelSnapshot` 手工同步镜像删（21 处 syncPanelSnapshot 命中行
    全清）——`subagent action:'panel'` 查询 + panelFreezeGate 门控改为**读时现算**（从 state.subTasks
    现场合成——打通 agent↔state 反向可达或查询通道携带 state）——单账本无同步
  - F-4（④ 保留边界）awaitingDigest 三态机/锚点补偿/reclaim 回收/panelFreezeGate 的 digested-stuck
    门控语义**零动**——本设计不改变任何用户可见的块生命周期行为（除 F-1 少 8 行重复摘要）
- **非功能**：N1 行为面收敛——除 preview 删除外用户可见行为零变化；N2 测试锚同步（T-S6/T-S14 等
  锚点断言涉及 preview/镜像的同步改）；N3 零协议变化

## 设计

1. **F-1 preview**：tool-display.mjs L19-20 两常量删（grep 消费方仅 tool-events L191）+ tool-events
   L189-193 段删（保留 escalate#N 无 preview 注释面）——相关测试断言同步删
2. **F-2 兜底**：finishSubTask 保留签名但改为**仅精确匹配实现**（roles 参数语义收窄为校验）或直接
   deprecated 删（grep 调用方：老回调/测试——逐个改 finishSubTaskKey 或删）——误冻面归零
3. **F-3 现算**：`state` 挂到查询可达通道（subagent.mjs panel 动作处已有 state 入口——勘察确认接线
   最短路径）——_panelSnapshot 读写全删——panel 视图函数改为从 state.subTasks 合成相同输出形状
   （panelFreezeGate 条件从镜像字段改为真身字段等价改写）——syncPanelSnapshot 函数本体删
4. **顺序**：F-1/F-2 先（trivial/small 独立）→ F-3（medium——涉及 10+ 调用点清扫）

## 受影响文件

| 文件 | 现行数 | 增量 | 改动 |
|---|---|---|---|
| src/tui/tool-display.mjs | 143 | -4 | 两 preview 常量删 |
| src/tui/tool-events.mjs | 405 | -6 | preview 段删（L189-193） |
| src/tui/subagent-freeze.mjs | 173 | -20 区 | finishSubTask 兜底支路删（精确 key 化） |
| src/tui/subagent-blocks.mjs | 457 | -5 区 | syncPanelSnapshot 导出/re-export 删 |
| src/agent-tools/subagent.mjs（或 panel 查询接线点） | 待实测 | ±30 区 | panel 动作读时现算（state 接线） |
| src/tui/subagent-panel.mjs | 205 | ±15 区 | panelFreezeGate/视图改真身字段 |
| test/（涉及 preview/镜像/兜底的测试族） | 待实测 | 同步 | 断言改/删——锚测试同步 |

## 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| preview 删 | sync 完成 | 会话流无 8 行 dim 摘要——冻结块内报告完整——F-1 |
| 精确 key | finishSubTaskKey 无块 | 返 null 不猜不误冻——F-2 |
| panel 现算 | subagent action:'panel' | 输出与真身一致（单账本）——F-3 |
| 驻留保留 | 挂起期 settled | "done · awaiting digestion" 驻留 + digest 回收照旧——F-4 |
| 锚点不回归 | 头裁 1000 | shiftFreezeAnchors 补偿照旧——F-4 |

## 验收

- AC-1 grep：SUBAGENT_PREVIEW_LINES/PREVIEW_LINE_CHARS/syncPanelSnapshot/_panelSnapshot 全仓零命中
- AC-2 finishSubTask 无启发式支路（精确 key 唯一路径）——误冻测试路径改造绿
- AC-3 panel 查询输出形状不变（现算等价）——panelFreezeGate 行为等价
- AC-4 awaitingDigest 驻留/回收/锚点测试全绿（T-S6/T-S14 族——零回归）
- AC-5 CLI npm test 快层零回归（涉及面测试同步改后）
- 红线：④ 语义/锚点机制零动；块落盘恢复不引入；协议零改；单文件改动最小化

## 变更记录
- 2026-09-10：落档（用户裁定 ④ awaitingDigest 保留 + ①②③ 清理——对照 VSC ACTIVITY-REWRITE 的
  CLI 端去加戏——explore#5 勘察为据——CLI 无恢复族加戏——删冗余显示/容错残留/跨层镜像）。
