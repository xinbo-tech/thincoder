# 活动块去加戏重写（ACTIVITY-REWRITE-SIMPLE）

> 板块：VSC webview 活动块（去加戏——手工重写——不用 git 回滚）。权威源：explore#1 加戏面识别
> （2026-09-09——逐机制判定：容器 = 加戏链根——DOM move 落流/settle 驻留/锚插/簿记/跨 reload 恢复 =
> 补丁堆叠）+ SESSION-RESTORE-PARITY（底层定论：live 块不入 history——消息流是历史——块无需跨 reload
> 生命）+ SESSION-FLOW-B B1（52e03f3 流尾形态 = 重写参照）。
> 状态：**设计待评审/待批准**——2026-09-09 落档（用户裁定：块显示机制整体加戏——补丁叠补丁致间歇丢块
> ——回 B1 简单形态——手工重写去加戏——绝不用 git 回滚——queued 排队可见保留（用户 F-2 裁决）但不做
> 跨 reload 恢复）。需求：TODO VSC live 块显示不可靠（2026-09-09）。

---

## 需求

- **总体目标**：把 VSC 活动块机制从"补丁叠补丁的复杂状态机"重写为最简形态——消除间歇性丢块——
  保留核心功能（子代理/评审活动可见 + 结束留史 + queued 排队可见）——删除一切为补上一层的洞而加的
  机制。**手工重写（write/edit）——不用 git checkout/revert/reset**。
- **功能性**：
  - F-1（流尾形态）块出生即 #messages 流尾（与 .message 同层）——结束原地折叠——无 DOM move/锚插/
    顺序维护——生命周期只有 live → frozen
  - F-2（queued 排队可见——保留）queued 消息 → 建等待头（⏳）；started → 翻 running；cancelled
    (was:queued) → 移除——三分支——**去掉 position/waiting 实时刷新反复**（块头不需实时位置——
    启动瞬间翻转）——**不做跨 reload 恢复**（reload 进程死块死——消息流是历史——SESSION-RESTORE-
    PARITY 定论）
  - F-3（删加戏）容器及其派生全删（区样式/显隐/pin/32vh/区内自滚）；DOM move 落流 + freezeInsertPoint
    锚插链删（freeze = 原地折叠）；settle 驻留 + awaiting digestion 词删（settled 视同 done 即时折叠）；
    _subagentMap/rowFor 簿记删（事件字段自足）；frozen 守卫族缩一行幂等守卫；consult answered 无块防御
    删（回复走 digest 呈现——权威面）；preview/ticker 删（纯事件驱动显示 done Ns）；queued position/
    waiting 分支删
  - F-4（留核心）150 窗 trim（核心——防 DOM 无界——live/冻结出生即计窗无豁免）；resetActivity 简化版
    （清 .sub-live + map）；块内内容流 append（ui.js appendAdvisorChunk 原样）；头行状态词
    （noteChunk/refreshBlock 核心）；⏹ 停止控制（running 块——委托回 messagesEl）；一层幂等终态守卫
  - F-5（扩展端零动——安全边界）消息协议零改——settled 仍发 webview 视同 done；reclaim 补发 done 被
    守卫吞（惰性 no-op）——扩展端/桥/测试协议面不动
  - **范围边界**：只动 VSC webview 端（activity 三文件 + panels/chat/streaming/state + index.html/base.css
    + activity-flow 测试族）——扩展端零动——CLI 端零动——boot 原子化（B2——会话消息流正确性——与块
    无关）保留不动

## 设计（手工重写——照做勿自行解释）

### 目标生命周期（最简——事件驱动无 ticker）
```
spawn/首 chunk → ensureBlock(channelKey)：
  map 无键 → 建 details.advisor-block.sub-block（label = channelKey 去 sub: 前缀）
              appendChild(ctx.messagesEl)（出生即流尾）；meta = { status, label }
  map 有键且已终态 → 返回 null（幂等守卫——迟来消息丢弃）
  map 有键且 live → 返回既有元素（重复 started 覆盖式更新头词）
chunk → appendAdvisorChunk 进 .advisor-content（ui.js 原样）
头行 = [▶/⏳ label · running/工具尾句]（事件驱动状态词——无 ticker）
终态（done/settled/error/cancelled——settled 视同 done）：
  原地 meta 终态 + class sub-live→sub-frozen + open=false + 头词换 [✓ label · done Ns]
  此后任何消息 → 幂等守卫丢弃
块 = 会话流折叠 details——与 advisor 块同规则被 150 窗裁
会话清/回合中止 → resetActivity：移除 .sub-live + 清 map
reload/新会话 → 无块特殊恢复（clearMessages→historyPage 即一切）
```

### 受影响文件（VSC webview 端——手工重写）

| 文件 | 现职责 | 重写后 |
|---|---|---|
| webview/activity.js（287） | 编排 + hub：parse 族/rowFor/ensureBlock 区出生/六分支状态机/freezeSettledBlocks/resetActivity | **~150 行**——ensureBlock（流尾出生）+ 状态三分支（queued 头/started/终态折叠）+ 一行幂等守卫 + resetActivity——parse 族/rowFor/hub re-export 删（保留 applySubagentStatus 名——panels 消费面） |
| webview/activity-view.js（242） | 呈现叶 + ticker + 区显隐 | ~80-100 行并入 activity.js 或留叶：refreshBlock（头词）+ updateStopButton（委托 messagesEl）+ noteChunk——删 updateAreaVisibility/pin/ticker/awaiting·position·waiting 词 |
| webview/activity-freeze.js（94） | freezeInsertPoint + freezeBlock(DOM move/锚) + appendPreview | **整文件删**（freeze 原地折叠 ~15 行并入 activity.js） |
| webview/panels.js | _subagentMap 簿记 → handleSubagentMessage 先 applySubagentStatus 再簿记 | 簿记段全删 → handleSubagentMessage = 纯转发 applySubagentStatus；suspension freeze 分支保留（对 live 块兜底折叠——settle 已即时折叠故多为 no-op） |
| webview/chat.js | case subagent/toolPanel/⏹ 委托区容器/clearMessages | ⏹ 委托回 messagesEl（删区容器委托）；其余签名不变 |
| webview/streaming.js | subagentChunk + rAF 扫活动区 | subagentChunk 主体不变（守卫缩一行）；rAF 扫描目标 = 流内 live 子块（或省扫描）；finish(aborted) resetActivity 不变 |
| webview/state.js | ctx.subAgentArea + S._subBlocks | 删 ctx.subAgentArea；S._subBlocks 保留（省 import 面改动）或模块局部——选保留 S 面 |
| index.html / base.css | 容器 div + grid 五行 + #subagent-activity 规则 | 容器 div 删 + grid 五行→四行 + CSS 减 ~30 行（B1 原样） |
| test/activity-flow.test.mjs（17 组） | 锁定器——挂载点/DOM move/锚序/区显隐/只数冻结/answered 防御 | **全族按新形态重写**（留 parse 类可保——多数重写）——输入/预期按目标生命周期 |
| webview-env.mjs | fixture #subagent-activity id | 删 id fixture |

### 实现顺序（安全——逐步收敛）
1. activity-freeze.js 删（freeze 并入 activity.js 原地折叠）——activity-view.js 删 ticker/区显隐/
   awaiting 词——activity.js 重写（流尾出生 + 三分支 + 守卫 + resetActivity）——panels.js 簿记删
2. index.html/base.css 容器删（grid 五行→四行）
3. chat.js/streaming.js 委托/扫描目标改 messagesEl
4. activity-flow.test.mjs 全族重写 + webview-env fixture 删
5. VSC npm test 全绿

## 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| 出生 | started 消息 | 块 append #messages 流尾——label 去 sub: 前缀——F-1 |
| 内容 | chunk | appendAdvisorChunk 进块——F-1 |
| 结束 | done 消息 | 原地折叠 sub-live→sub-frozen——头词 done——F-1 |
| settled | settled 消息 | 视同 done 即时折叠（无 awaiting 驻留）——F-1/F-3 |
| queued | queued 消息 | 建 ⏳ 等待头——F-2 |
| queued→started | started 到达 | 头翻 running——F-2 |
| queued 取消 | cancelled was:queued | 头移除（不冻结）——F-2 |
| 迟来消息 | 终态后 chunk | 幂等守卫丢弃（不复活不重建）——F-1 |
| 多并行 | 两 spawn | 两独立块各自 live/结束（互不干扰）——F-1 |
| 会话清 | clearMessages | resetActivity 清 .sub-live + map——F-4 |
| reload | 整窗 reload | 无块特殊恢复——消息流为历史——F-2 范围 |
| 150 裁 | 超窗 | 冻结块随窗裁（isConnected=false 后迟来消息守卫丢）——F-4 |

## 验收

- AC-1 grep 零命中：freezeInsertPoint/settleSeq/_freezeAtEl/freezeSettledBlocks/reclaim 消费/
  updateAreaVisibility/pinActivityArea/subagent-activity（webview 端——测试除外待重写）
- AC-2 块出生 #messages 流尾（activity-flow 断言 parentNode = messagesEl）
- AC-3 终态原地折叠无 DOM move（parentNode 不变断言）
- AC-4 queued 三分支（⏳ 头/翻转/取消移除）绿——扩展端消息协议零改
- AC-5 扩展端文件零改动（git diff 仅 webview 端 + 测试）
- AC-6 VSC npm test 全绿（activity-flow 重写后 + 其余回归）
- 红线：不用 git checkout/revert/reset（纯 write/edit）；CLI 零动；boot 原子化不动；preview/ticker 删
  除（用户已确认）；不做跨 reload 恢复（reload 进程死块死——消息流为历史）

## 变更记录
- 2026-09-09：落档（用户裁定：块机制加戏——补丁叠补丁致间歇丢块——回 B1 流尾简单形态——手工重写
  不用 git——queued 可见保留但去实时刷新——不做跨 reload 恢复——扩展端零动安全边界——preview/ticker/
  answered 防御删）。
