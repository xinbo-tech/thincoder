# VSC 子代理活动区回归 + Stop 语义（SESSION-ACTIVITY-REVISED）

> 板块：会话流（VSC——B1 修正——对齐 CLI 单面板形态）。权威源：CLI subagent-panel.mjs（单固定块面板蓝本）+ subagent-freeze.mjs（落流锚）。
> 状态：**已交付核销**——2026-09-09（5be6c67——活动区回归 + freeze 落流锚 + 行面板撤除 + Stop running 派生——VSC L2 179/179 绿——audit clean + advisor pass——consume f125c0d5——真机走查实现期——activity.js 579 行拆分已交付核销（ACTIVITY-SPLIT——三文件终局——hub re-export 外部零改动——详见变更记录）。

---

## 需求

- **总体目标**：VSC 子代理呈现对齐 CLI 单面板形态——一个固定活动区（live 固定可见——不随会话流滚动丢失）——行面板撤除（关闭双面冗余）——freeze 落流锚点（CLI _freezeAt DOM 版）——外加 Stop 语义重定义（用户裁定）。
- **功能性**：
  - F-1 活动区回归（D-1 用户裁贴 #messages 下）：固定容器于 messages 与输入之间——空时隐藏不占高——区内每子代理 = 一块（CLI 同构：头行 [▶ key · sync/async · model · elapsed · turn] 状态词 + tail-3——queued/waiting = 等待块头态）
  - F-2 容器形态（D-2 用户裁自适应 + max-height 封顶自滚）：区高度自适应块内容——max-height ~32vh 封顶 + 块内 100px 自滚（webview 可视约束——CLI 终端可挤会话 webview 不能）
  - F-3 行面板全撤（D-3 方案 A 用户裁）：#subagent-panel 从 #panels 撤除——queued/consult 转区内（queued = 等待块头——consult = sub: 频道块——行面板独有载荷迁/弃：autoClean linger 3s/60s 迁区内块生命周期——👥 计数由状态行 _suspCounts 承担——consult 回复 preview 由冻结块 + 流内 preview 覆盖）
  - F-4 freeze 落流锚（CLI _freezeAt DOM 版）：普通 done 尾推 appendChild——settled 记 _freezeAtEl（settle 时流尾元素）→ digest done 时 insertBefore 锚后（digest 报告前）——多 settled 同锚按 settle 降序插——锚被 150 裁退化为尾推——freeze 不强制滚动（折叠单行 ✓ 头 + preview——CLI 同观感）
  - F-5 live 出流：块只活动区更新——#messages 只有冻结块——150 只数冻结块（live 出流自然回 R22 口径——裁剪函数零改）——活动不 invalidate 会话渲染（CLI 防每 token 重建的 DOM 等价）
  - F-6 Stop 语义重定义（用户裁定）：Stop 只在主会话真正 busy（running/digest）显示——susp 纯池跑（主空闲）不显示——Stop 只停主会话（回合 abort/digest abort）——subagent 停止靠活动区各自 ⏹（每块 ⏹——CLI 同）——D-S9 "susp 期 Stop 全停"废除（全停改为逐块 ⏹ + digest 可单停？——见设计 6）
  - **范围边界**：B2（boot/session-boot）零触碰；恢复对齐档（SESSION-RESTORE-PARITY）独立；消息协议名零改（只增不改变延续）；#panels 保留 goal/task（非子代理面）；150 裁剪函数零改；consult 频道机制零改。

## 设计（B1 修正深勘察骨架——照做勿自行解释）

### 1. 活动区容器（F-1/F-2——D-1/D-2 用户裁）
- index.html：#messages 之后 #panels 之前插活动区容器 div（id 定——subagent-activity 回归或新名——grid 子元素）
- base.css：grid 行模板改（messages 下加 auto 行——max-height ~32vh 封顶 + 自滚——空时 display none 零高）
- 区内块 = .advisor-block .sub-block（现样式原样——头/tail/⏹/内容 100px 自滚）

### 2. ensureBlock 挂载回退（F-5）
- activity.js ensureBlock：appendChild 目标 messagesEl → 活动区容器——去出生即 maybeScrollDown（区内自滚管理——区底 pin）——块类/open 初始态/ticker 保留
- streaming.js：subagentChunk 建块随 ensureBlock 自动回退——rAF _advisorScrollDirty 循环改扫活动区 live 块（冻结跳过注释同步）

### 3. freeze 落流锚（F-4）
- 普通 done/error/stopped（非挂起）：ctx.messagesEl.appendChild(block)（CLI 尾推）——preview 与块同移紧跟
- settled：块驻留区（✓ awaiting digestion 头）——记 meta._freezeAtEl = ctx.messagesEl.lastElementChild（settle 时）
- digest done/freezeSettledBlocks/会话退出：insertBefore(block, _freezeAtEl?.nextSibling ?? null)（digest 报告前——锚被 150 裁 isConnected=false → 尾推退化）
- 多 settled 同锚：按 settle 时间降序逐块插（后 settle 先插——相对序 = settle 序）
- 不强制滚动（折叠单行落定——不调 maybeScrollDown——钉底自然可见）

### 4. resetActivity/⏹ 委托（F-5）
- resetActivity：清活动区（live 块从区移除 + map 清 + ticker 停 + 防御孤儿清）——#messages 冻结块不动
- chat.js ⏹ 委托：messagesEl → 活动区容器（区内 live 块 ⏹——冻结块无 ⏹ 无需流级委托）
- state.js ctx 增活动区引用——webview-env fixture 同步

### 5. 行面板撤除（F-3——D-3 方案 A）
- #subagent-panel 从 index.html/#panels 撤——panels.js renderSubagentPanel DOM 渲染面删（簿记保留——S._subagentMap/handleSubagentMessage 状态簿记仍供块 meta 水合）
- queued：区内等待块头（ensureSubTaskKey 在 queued 即建块头——activity.js 现 queued 早退无块——改为建头——D-4）
- consult：sub: 频道块承载（consult.mjs:254 工具流全量 stream——评审 #3：answered 携 replyPreview
  （consult.mjs:202）——appendPreview 只镜像块内文本（activity.js:358-379）——预 digest 回复可见性 = digest
  轮逐字呈现覆盖（agent.mjs:27——设计明示）+ answered 无块防御建冻结块（测试 ⑭）
- autoClean linger 迁区内块生命周期——👥 计数弃（_suspCounts 状态行承担）——consult reply preview 冻结块覆盖
- 实现期 grep subagent-panel|sub-item|consult-reply 全量复核连带面

### 6. Stop 语义（F-6——用户裁定——评审 #1 定论）
- Stop 显示：`S._turnState !== "idle"` → 收窄为 **running**（A3 派生改——susp 不显）——digest 消化 = running
  （定论——评审 #1：webview-turnstate 测试 ① 已实证 digest 期间广播 running——测试行 84-91——无需状态
  细分——实现期以 suspension.mjs/panel-chat 广播点复核确认）
- Stop 作用：主会话 abort（回合/digest——digest controller 单停）——废除 susp 期"全停"（panel-messages
  abort case 收窄——不再 _susp.abortControllers 全链 abort——只停 digest 轮 controller）——subagent 靠活动区
  每块 ⏹（cancelSubagent 定向 abort——panel-messages :199 直连——仅 running+pool 块——CLI 同）
- 全停入口定论（评审 #1）：**无全停按钮——池空自然消化完**（CLI 对拍：CLI 无全停——池空自然退出）——
  queued/waiting 块头不挂 ⏹（未启动不可单独停——CLI 同——接受无取消路径——队列自然推进）——
  用户想停整个后台 = 逐块 ⏹ 停 running 块 + digest 轮 Stop 停消化——池空即退

### 7. 测试（activity-flow.test.mjs 8 组改写 + 新增）
- 改：① 出生活动区（parentNode = 区容器——区内钉底——messages 零扰动）② freeze 移入 messagesEl 尾（DOM move 红线反转——原 N3 无 move 删）③ settled 驻留区 + digest 报告流内 + done 插报告前（_freezeAtEl 锚断言）④ sync 区内出生与父流并行 + 冻结落当前尾 ⑤ resetActivity 清区 frozen 流内保留 ⑥ 150 只数冻结（live 占位断言删）
- 保：⑦ ⏹ 门控（容器换区微调）⑧ parseChannel
- 新：⑨ 区空隐藏 ⑩ 区自适应/封顶自滚 ⑪ 多 settled 同锚降序冻结序 ⑫ _freezeAtEl 被裁尾推退化 ⑬ queued
  等待块头（D-3 A）⑭ consult answered 无块防御（评审 #3——answered 携 replyPreview 无块时按行快照建
  冻结块——回复可见性由 digest 轮逐字呈现覆盖——agent.mjs:27）⑮ #subagent-panel 零残留 grep 断言
  （评审 #3——index.html/panels.js 无 subagent-panel 引用）
- Stop 语义测试：susp 纯池跑 Stop 不显（webview-turnstate ③ 改——state≠idle 派生 → running 派生断言翻转）

## 受影响文件（VSC 单仓）

| 文件 | 改动 | 行数 |
|---|---|---|
| webview/index.html | 活动区容器回 + #subagent-panel 撤 | ~85 现（±~4） |
| webview/base.css | grid 行模板 + 活动区样式 | ~430 现（+~15） |
| webview/activity.js | ensureBlock 挂载回区 + freeze 锚落流 + resetActivity 清区 | ~443 现（±~25） |
| webview/panels.js | renderSubagentPanel 删（簿记留）+ queued 建头 | ~264 现（-~30） |
| webview/chat.js | ⏹ 委托换区 | ~324 现（±~2） |
| webview/state.js | ctx 活动区引用 | ~113 现（+~2） |
| webview/loading.js | Stop running 派生 | ~44 现（1 行改） |
| webview/status-bar.js | sub-badge 处置（评审 #2——#subagent-panel 撤后 badge 点击 null 崩——
  移除 badge 或改指活动区——base.css 徽标规则同步） | ~77 现（±~6——评审 #2 实测） |
| src/extension/panel-messages.mjs | abort 收窄（去 susp 全停）+ digest 单停 | ~431 现（±~8） |
| src/extension/suspension.mjs | digest 期间状态（running？——实现期核） | ~392 现（±~4） |
| webview/streaming.js | rAF 扫区 + 注释 | ~246 现（±~2） |
| test/activity-flow.test.mjs | 改写 + 新 | ~333 现（±~50） |
| test/webview-turnstate.test.mjs | ③ Stop 派生翻转 | ~219 现（改 ~5） |
| test/helpers/webview-env.mjs | fixture 区容器 | ~70 现（+~2） |
| 文档：WEBVIEW.md §2/§5 + AGENT-LOOP.md + AGENTS.md + **ARCHITECTURE.md:24-25 未决行关闭**（评审 #4——
  行面板保留裁定反转——不得当历史折叠） | 权威措辞 | doc |

## 验收

- AC-1 live 块在固定活动区（messages 滚动不丢——测试 ① 锁）+ 区空隐藏（测试 ⑨ 锁——评审 #5 引用修正）
- AC-2 活动区自适应 + 封顶自滚（测试 ⑨⑩ 锁）
- AC-3 行面板撤除（#subagent-panel 零残留——queued 等待块头——consult 频道块——测试 ⑬ 锁）
- AC-4 freeze 落流锚（done 尾推/settled 插 digest 报告前/多 settled 降序/锚裁退化——测试 ②③⑪⑫ 锁）
- AC-5 150 只数冻结（live 出流不计——测试 ⑥ 锁）
- AC-6 Stop running 派生（susp 纯池跑不显——测试翻转锁）+ Stop 只停主会话（subagent 靠块 ⏹）
- AC 红线：消息协议名零改 + B2/恢复对齐档零触碰 + 既有测试全绿（C1/C2/A/B1 部分改写——activity-flow 改版后全绿）
- AC 测试绿（activity-flow 改版 + webview-turnstate + 既有——VSC npm test 快层）
- AC 真机走查：live 固定可见 + 单面板 + 冻结落流观感（用户最终验收）

## 变更记录
- 2026-09-09：B1 修正落档（深勘察一手——CLI 单固定块面板对拍结论——行面板 = VSC 独有历史残留——双面根源——
  单面板形态一体满足用户三连）——D-1/D-2/D-3 用户全裁推荐 + Stop 语义裁定并入。
- 2026-09-09 评审 7 项采纳（digest running 定论/全停入口定论——无全停池空自然完——status-bar 入表/consult
  answered 路径明示 + 测试 ⑭⑮/ARCHITECTURE 入文档/AC-1 引用修正/尺寸注——token 0b9d1f32）——核销时
  README 地图登记（同 SESSION-FLOW 先例）。
- 2026-09-09：activity.js 579 行拆分交付（ACTIVITY-SPLIT——三文件终局——activity.js 编排层
  287 行 + activity-view.js 呈现叶 229 行 + activity-freeze.js 冻结叶 94 行——hub re-export
  外部消费方零改动——依赖纯 DAG 无环——verbatim 移动断言 parity 162/15——resetActivity ticker
  清理提 view.stopTicker（评审 #1 例外标注）——详见 docs/design/ACTIVITY-SPLIT.md）。
