# 排队 subagent 可见性对齐（QUEUED-VISIBILITY）

> 板块：subagent 活动面板（双端——CLI subagent-panel + VSC chat 活动区）。权威源：SESSION-ACTIVITY-REVISED（VSC 已交付——queued 等待块头 + ⟦ev⟧queued 等价通道）+ AGENT-LOOP §19.5（⏹ 门控）+ §20 D-SD3b（CLI queued 块）。
> 状态：**设计待评审**——2026-09-09 落档（深勘察双端现状——**重要发现：VSC queued 可见链已存在并交付核销**（SESSION-ACTIVITY-REVISED 5be6c67——179/179 绿）——本设计 = **差集增量**非从零建通道）。需求：TODO live 面板排队 subagent 可见（用户裁全量：位置 + 原因 + 依赖链 + 可取消）。

---

## 需求

- **总体目标**：排队中的 subagent 在双端 live 面板可见且可控。勘察结论——VSC queued 显示链已交付（等待块头 + queued · position N / waiting — reason——状态词三分支与 CLI 已对齐）——**真差集 = ① queued 取消 ⏹ 双端 UI 未暴露（工具层有——裁定层"接受无取消"）② VSC webview Reload 冷启 queued 等待块头丢失（无快照重推——SESSION-RESTORE-PARITY 只覆盖保存侧——
  live 块不入 history 裁定不覆盖运行中恢复）③ i18n 小缺（waiting 词 + position 段未走 i18n）**。
- **功能性**：
  - F-1 现状确认基线（非改动）：VSC queued 等待块头显示已在（SESSION-ACTIVITY-REVISED 交付）——CLI 排队显示已在（subagent-panel §20 D-SD3b）——验收含不回归
  - F-2（可取消——用户新裁覆盖 SESSION-ACTIVITY-REVISED F-6 "接受无取消路径"旧裁定）queued/waiting 等待块头挂 **取消 ⏹**（双端——VSC activity-view ⏹ 门控扩 queued + CLI subagent-panel ⏹ 门控扩 queued）——点击 = 出队 + 墓碑 + 位置前移（引擎/工具层 cancelSubagent queued 路径已存在——纯 UI 暴露 + 路由接线）
  - F-3 VSC Reload 冷启快照重推（真缺口）：webview reload 后 queued/running 子代理块重建——extension 侧补队列快照推送（getState 或 reload 后事件重推——复用 refreshQueuedRows 载荷）
  - F-4 i18n：waiting 状态词 + "· position N" 段走 i18n（en/zh——对齐 queued 词现有模式）
  - **范围边界**：consult 无排队语义不涉及；advisor 池独立（cancelAdvisorReview 已存在——不扩）；冻结/settled 块不涉及；CLI 数据通道零改（渲染循环从池重读已覆盖）。

## 设计（双端差集增量——照做勿自行解释）

### 1. F-2 取消 ⏹（双端——引擎路径已有纯 UI 暴露）
- **VSC**：activity-view.mjs updateStopButton 门控扩——`status==="running"` → `running || queued/waiting`（slot/wait/depc 三态都挂 ⏹——用户可撤销排队决策）——但 ⏹ 图标/文案区分（running = 停 / queued = 取消排队）——
  click → chat.js postMessage {type:"cancelSubagent", id, role}（现路由 panel-messages:198-215 已处理 queued 目标出队——引擎 cancelSubagent 对 queued = dequeue + 墓碑 + {was:"queued"}——webview 移除块 + refreshQueuedRows 位置前移——链路通——纯门控扩展）
- **CLI**：subagent-blocks/subagent-panel ⏹ 门控扩 queued（现"async 启动后才置"注——排队块 ⏹ 补）——mouse D-S1a cancelSubagent 路由对 queued 同路径（工具层支持——CLI cancel 命令/mouse 已走引擎同实现）
- 测试：双端活动区测试——queued 块挂 ⏹ → 点击 → 出队 + 墓碑 + 位置前移 + 块移除（VSC activity-flow 测试族 + CLI subagent 测试族）

### 2. F-3 Reload 冷启快照重推（VSC）
- extension reload 握手补队列快照：panel-messages getState/reload 响应带 queued/running 子代理清单（池 _asyncSubagents/_asyncAdvisors 的 running+queued 条目——字段 id/role/status/position/waiting/reason——复用 describeBlockers/refreshQueuedRows 载荷形状）——webview 冷启重建等待块头 + running 块（对齐 CLI 渲染循环从池重建语义）
- 注：SESSION-RESTORE-PARITY "子代理 live 块不入 history" = 保存侧裁定（磁盘不落）——F-3 是运行中池态推 webview（内存——不冲突）
- 测试：VSC reload 握手——queued 条目在 reload 后块头仍在（新测试）

### 3. F-4 i18n（VSC——CLI 无 i18n 层不涉及）
- "waiting" 词 + "· position N" 段 → i18n en/zh（en: waiting/· position N——zh: 等待中/· 位置 N——对齐 queued 词 en "queued"/zh "排队中" 模式）

## 受影响文件（双端——差集增量）

| 文件 | 端 | 现行数 | 预计净变 | 改动 |
|---|---|---|---|---|
| webview/activity-view.mjs | VSC | ~150 | ≤+10 | F-2 ⏹ 门控扩 queued + F-4 i18n 词 |
| webview/activity.js | VSC | ~250 | ≤+5 | F-2 queued 取消态处理（若有） |
| webview/chat.js | VSC | ~330 | ≤+2 | F-2 路由确认（现路由已通——小） |
| src/extension/panel-messages.mjs | VSC | 427 | ≤+15 | F-3 reload 快照重推 + F-2 路由（若现无） |
| src/extension/panel-callbacks.mjs | VSC | ~80 | ≤+5 | F-3 快照载荷（若现无） |
| src/tui/subagent-panel.mjs | CLI | 200 | ≤+5 | F-2 ⏹ 门控扩 queued |
| src/tui/subagent-blocks.mjs | CLI | ~250 | ≤+3 | F-2 queued 块 ⏹ 态 |
| src/tui/mouse.mjs | CLI | ~130 | ≤+2 | F-2 queued 取消路由确认 |
| test/（activity-flow + subagent 族） | 双端 | 既有 | +10~+20 | F-2/F-3 测试 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 queued 显示现状 | VSC/CLI 排队 spawn | 等待块头可见（位置/原因）——不回归——F-1 |
| F-2 排队取消 | queued 块 ⏹ 点击 | 出队 + 墓碑 + 位置前移 + 块移除——F-2 |
| F-2 running 取消不回归 | running 块 ⏹ | 原取消路径不变——F-2 |
| F-3 reload 后排队可见 | webview reload + queued 在池 | 块头重建——位置/原因保留——F-3 |
| F-4 i18n | zh 环境 waiting/position | 中文词——F-4 |

## 验收

- AC-1 双端 queued 等待块头显示不回归（F-1 基线——SESSION-ACTIVITY-REVISED/§20 D-SD3b 测试绿）
- AC-2 queued ⏹ 双端（点击 = 出队——测试绿——running ⏹ 不回归）
- AC-3 VSC reload 后 queued 块重建（新测试绿）
- AC-4 i18n waiting/position 词（en/zh——测试绿）
- AC-5 双端 npm test 快层零回归
- 红线：引擎/工具层 cancelSubagent queued 路径零改（纯 UI 暴露）；数据通道零新建（复用 refreshQueuedRows/⟦ev⟧queued 载荷）；冻结/settled/consult 不涉及

## 变更记录
- 2026-09-09：落档（深勘察——**VSC queued 可见已存在**（SESSION-ACTIVITY-REVISED 5be6c67 核销）——真差集 = F-2 取消 ⏹（用户全量裁覆盖 F-6 旧"接受无取消"裁定）+ F-3 Reload 快照（SESSION-RESTORE-PARITY 不覆盖——真空缺）+ F-4 i18n——CLI 参照系确认（subagent-panel queued 显示已有——补 ⏹ 即齐）。
