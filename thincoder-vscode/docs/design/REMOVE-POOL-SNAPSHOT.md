# 撤销 webviewReady 池快照重推（REMOVE-POOL-SNAPSHOT）

> 板块：VSC webview 活动区机制（QUEUED-VISIBILITY F-3 回退）。权威源：panel-callbacks.mjs
> postPoolSnapshot（L162-194）+ panel-messages.mjs webviewReady 调用（L422-423 区）+ pool-snapshot.test.mjs。
> 状态：**设计待评审/待批准**——2026-09-09 落档（用户裁定：过度工程——撤）。
> 需求：TODO VSC live 块显示不可靠（2026-09-09——用户裁定快照机制无场景应撤）。

---

## 需求

- **总体目标**：移除 postPoolSnapshot（webviewReady 后重放池行快照的机制）——它是过度工程。
- **功能性**：
  - F-1（撤除调用）panel-messages.mjs webviewReady case 移除 postPoolSnapshot 调用——boot 后不再重放
    池行
  - F-2（撤除函数）panel-callbacks.mjs 删除 postPoolSnapshot 函数 + SNAPSHOT_ROLES 常量 + 相关注释——
    refreshQueuedRows/describeBlockers 等共用函数保留（queued 可见 F-2 的增量路径仍用）
  - F-3（测试清理）pool-snapshot.test.mjs 删除——**其中 F-2 queued 取消路由测试（L115-134——扩展侧
    handlePanelMessage cancelSubagent 路由——唯一覆盖）迁移到 chat-panel.test.mjs（同 stub 风格）保留**（2026-09-12 拆档后居 `test/chat-panel-messages.test.mjs`）——
    activity-flow ⑯（reload 快照重放消费面）改冷启空断言（无快照消息——区空——等增量消息才建块）
  - F-4（文档同步）QUEUED-VISIBILITY 设计档 + docs/design/README.md 注撤销（F-3 已撤——F-2 queued 可见保留）
    ——**WEBVIEW.md 不含 F-3 快照段注（grep 实证）——从 F-4 删 WEBVIEW.md**——若顺手修其 L112-115 陈旧 F-6
    ⏹ 措辞（与已交付 F-2 矛盾）另行登记不并此批
- **范围边界**：**只撤 F-3 快照重推**——F-2 queued 等待块可见（增量消息驱动——非快照）+ F-4 i18n 词保留
  ——不动出生链/clearMessages/resetActivity/冻结（那些是既有机制非本批引入）
- **不做**：不修"块不出现"现象本身（快照空转非其因——现象若复现另查——此批只撤无场景机制）

## 设计

- 撤除后行为 = bacf545 前：boot 清块后靠**增量消息**重建（池条目继续跑发 chunk/终态 → ensureBlock）——
  快照重放整段移除——无替代机制
- 理由记录：retainContextWhenHidden=true（chat-panel.mjs L118）→ view 隐藏不销毁 webview → 无"webview
  重建需补发"场景；agent 跑在扩展宿主进程内 → 整窗 reload 池清 → 快照空转。两场景皆无 → 机制无服务对象
  ——过度工程——撤

## 受影响文件（VSC 端）

| 文件 | 现行数 | 预计增量 | 改动 |
|---|---|---|---|
| src/extension/panel-messages.mjs | 463 | -9 | webviewReady case 移除 postPoolSnapshot 调用 + **import（L14）**
  + F-3 注释块（L12-13/L418-421）——整段切除 |
| src/extension/panel-callbacks.mjs | 195 | -45 | 删 postPoolSnapshot + SNAPSHOT_ROLES + 注释 + **死 import
  describeBlockers（L15——仅快照内用）**（保留共用函数本体于其原模块） |
| test/pool-snapshot.test.mjs | 134 | 删除 | F-3 测试整删——F-2 取消路由测试迁 chat-panel.test.mjs（2026-09-12 拆档后居 `test/chat-panel-messages.test.mjs`） |
| test/chat-panel.test.mjs | — | +25 | 承接 F-2 queued 取消路由测试（L115-134 迁入；2026-09-12 拆档后居 `test/chat-panel-messages.test.mjs`） |
| test/activity-flow.test.mjs | 683 | ±3 | ⑯ 改冷启空断言（无快照重放——等增量） |
| docs/design/QUEUED-VISIBILITY.md | — | ≤+5 | 注 F-3 已撤销（2026-09-09——REMOVE-POOL-SNAPSHOT） |
| docs/design/README.md | — | ≤+3 | 本档登记 + QUEUED-VIS 变更注 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| webviewReady | 界面加载完成 | 不再重放池行——boot 后无快照消息——F-1/F-2 |
| queued 可见 | 任务排队 | 等待块仍显示（增量路径——不受撤除影响）——范围边界 |
| 测试面 | npm test | pool-snapshot 删除——activity-flow ⑯ 翻转——全绿——F-3 |

## 验收

- AC-1 panel-messages webviewReady case 无 postPoolSnapshot **调用与 import**（grep src/** 零命中）
- AC-2 src/** 无 postPoolSnapshot/SNAPSHOT_ROLES 引用（grep 零命中——含 panel-messages import 清除）
- AC-3 pool-snapshot.test.mjs 删除 + F-2 取消路由测试已迁 chat-panel.test.mjs（2026-09-12 拆档后居 `test/chat-panel-messages.test.mjs`） + activity-flow ⑯ 冷启空断言——
  VSC npm test 全绿
- AC-4 queued 等待块可见不受影响（F-2 保留）
- 红线：不撤 F-2 queued 可见/i18n（引用 QUEUED-VISIBILITY 的 F-2/F-4——本档 F-1-F-4 为撤除需求——撞名
  已注——两者不同物）；不动出生链/clearMessages/冻结；CLI 端零动（快照是 VSC 专属机制）
- 诚实注：此撤不修"块不出现"现象（用户实证：正常会话（非 reload）丢块——reload 全死本无恢复对象——
  快照两者皆不服务——撤除正确清理——丢块真因（出生投递/显示层）另起勘察——TODO 已登记间歇性观察）

## 变更记录
- 2026-09-09：落档（用户裁定：postPoolSnapshot 过度工程——retainContextWhenHidden=true + reload 全死无
  恢复对象——撤 F-3 快照重推——F-2 queued 可见保留）。
- 2026-09-09：评审 PASS + 8 项 advisory 修正（🟡① F-2 取消路由测试迁 chat-panel 保留（2026-09-12 拆档后居 `test/chat-panel-messages.test.mjs`） ② WEBVIEW.md 无快照段
  注——从 F-4 删——陈旧 F-6 措辞另登记 ③ panel-messages 463 行/Δ-9 含 import 切除 ④ 新档 vs 并入板块档——
  采独立档+QUEUED-VIS 变更注注 ⑤ ⑯ 改冷启空断言 ⑥ activity-flow 683 行 ⑦ 死 import 清除+AC grep 扩
  src/** ⑧ 撞名注——执行版定稿）。
