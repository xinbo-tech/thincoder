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
  - F-3（测试清理）pool-snapshot.test.mjs 删除（测的就是快照形状/边界）——activity-flow ⑯（reload 快照
    重放消费面）翻转回原断言——queued 取消路由测试（cancelSubagent 陈旧点击）如有并入 activity-flow 保留
  - F-4（文档同步）bacf545 的 QUEUED-VISIBILITY 设计档 + docs/design/README.md + WEBVIEW.md 相关段注撤销
    （F-3 已撤——F-2 queued 可见保留）
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
| src/extension/panel-messages.mjs | 424 | -2 | webviewReady case 移除 postPoolSnapshot 调用 + 注释 |
| src/extension/panel-callbacks.mjs | 195 | -40 | 删 postPoolSnapshot + SNAPSHOT_ROLES + 注释（保留共用） |
| test/pool-snapshot.test.mjs | 134 | 删除 | F-3 测试整删 |
| test/activity-flow.test.mjs | ~630 | ±5 | ⑯ 翻转回原断言 |
| docs/design/QUEUED-VISIBILITY.md | — | ≤+5 | 注 F-3 已撤销（2026-09-09） |
| docs/design/README.md | — | ≤+3 | 本档登记 + QUEUED-VIS 变更注 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| webviewReady | 界面加载完成 | 不再重放池行——boot 后无快照消息——F-1/F-2 |
| queued 可见 | 任务排队 | 等待块仍显示（增量路径——不受撤除影响）——范围边界 |
| 测试面 | npm test | pool-snapshot 删除——activity-flow ⑯ 翻转——全绿——F-3 |

## 验收

- AC-1 panel-messages webviewReady case 无 postPoolSnapshot 调用
- AC-2 panel-callbacks 无 postPoolSnapshot/SNAPSHOT_ROLES（grep 零命中）
- AC-3 pool-snapshot.test.mjs 删除 + activity-flow ⑯ 翻转——VSC npm test 全绿
- AC-4 queued 等待块可见不受影响（F-2 保留）
- 红线：不撤 F-2 queued 可见/i18n；不动出生链/clearMessages/冻结；CLI 端零动（快照是 VSC 专属机制）
- 诚实注：此撤不修"块不出现"现象（快照空转非因）——现象若复现另起勘察

## 变更记录
- 2026-09-09：落档（用户裁定：postPoolSnapshot 过度工程——retainContextWhenHidden=true + agent 进程内架构
  下无适用场景——撤 F-3 快照重推——F-2 queued 可见保留）。
