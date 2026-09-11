# 活动块去加戏重写（ACTIVITY-REWRITE-SIMPLE）

> 板块：VSC webview 活动块（去加戏——手工重写——不用 git 回滚）。权威源：explore#1 加戏面识别
> （2026-09-09——逐机制判定：容器 = 加戏链根——DOM move 落流/settle 驻留/锚插/簿记/跨 reload 恢复 =
> 补丁堆叠）+ SESSION-RESTORE-PARITY（底层定论：live 块不入 history——消息流是历史——块无需跨 reload
> 生命）+ SESSION-FLOW-B B1（52e03f3 流尾形态 = 重写参照）。
> 状态：**设计待评审/待批准**——2026-09-09 落档（用户裁定：块显示机制整体加戏——补丁叠补丁致间歇丢块
> ——回 B1 简单形态——手工重写去加戏——绝不用 git 回滚——queued 排队可见保留（用户 F-2 裁决）但不做
> 跨 reload 恢复）。需求：TODO VSC live 块显示不可靠（2026-09-09）。
> 〔2026-09-11 活动区回归批（VSC-ACTIVITY-REGION-RESTORE）〕本档**位置形态（流尾出生）已被取代**
> ——块改驻固定活动区（`WEBVIEW.md` §12——区内出生 · 原地折叠 · 区内保留）。本档**机制纪律保留**：
> 无 DOM move / 终态集合闭合 / 幂等守卫 / 150 窗口径（`#messages` 面）/ queued 三分支 / 无
> 跨 reload 恢复；AC-1 中 `subagent-activity` grep 零命中句随新批反转（容器回归——新批 AC-R1 为准）。
> 〔2026-09-12 活动区收口批（VSC-ACTIVITY-CLOSURE）〕**冻结块去向再修订**：消化回收后归档落流
> （`WEBVIEW.md` §14——A 方案）；本档删除的旧链本体（DOM move 落流 + `freezeInsertPoint` 锚插链）
> **仍禁**——新机制非其复活（§14.4 对照）；其余机制纪律（幂等守卫 / 终态闭合 / 150 窗）保持。

---

## 需求

- **总体目标**：把 VSC 活动块机制从"补丁叠补丁的复杂状态机"重写为最简形态——消除间歇性丢块——
  保留核心功能（子代理/评审活动可见 + 结束留史 + queued 排队可见）——删除一切为补上一层的洞而加的
  机制。**手工重写（write/edit）——不用 git checkout/revert/reset**。
- **功能性**：
  - F-1（流尾形态）块出生即 #messages 流尾（与 .message 同层）——结束原地折叠——无 DOM move/锚插/
    顺序维护——生命周期只有 live → frozen——**终态集合闭合：任何非 queued/started 的 status（done/settled/
    error/cancelled/answered/terminated/failed…）一律视同终态折叠——settled 视同 done——answered 对无块
    频道 no-op（有块则折叠——consult 终态驱动保留）**——**终态/trim 路径 lookup-only 绝不建块**（评审
    round2 #1）
  - F-2（queued 排队可见——保留）queued 消息 → 建等待头（⏳ **含取消 ⏹——QUEUED-VISIBILITY F-2 保留——
    取消 ⏹ 沿既有 cancelSubagent 路径（协议零改）——其标签键 sub.cancelQueueBtn 保留不删**）；started →
    翻 running；cancelled (was:queued) → 移除——三分支——**position/waiting 状态词删（头只显 ⏳ + 取消
    ⏹——无位置/等待原因文本——sub.waiting/sub.position/sub.awaitingDigest 三键删）**——**不做跨 reload 恢复**（reload 进程死块死——消息流是历史——SESSION-RESTORE-
    PARITY 定论）
  - F-3（删加戏）容器及其派生全删（区样式/显隐/pin/32vh/区内自滚）；DOM move 落流 + freezeInsertPoint
    锚插链删（freeze = 原地折叠）；settle 驻留 + awaiting digestion 词删（settled 视同 done 即时折叠）；
    _subagentMap/rowFor 簿记删（事件字段自足）；frozen 守卫族缩一行幂等守卫；consult answered 无块防御
    删（回复走 digest 呈现——权威面）；preview/ticker 删（纯事件驱动显示 done Ns）；queued position/
    waiting 分支删
  - F-4（留核心）150 窗 trim（核心——防 DOM 无界——live/冻结出生即计窗无豁免）；resetActivity 简化版
    （清 .sub-live + map）；块内内容流 append（ui.js appendAdvisorChunk 原样）；头行状态词
    （noteChunk/refreshBlock 核心）；⏹ 停止控制（**running + queued——委托回 messagesEl——queued 取消沿
    既有 cancelSubagent 路径——评审 round2 #3**）；一层幂等终态守卫
  - F-5（扩展端零动——安全边界）消息协议零改——settled 仍发 webview 视同 done；reclaim 补发 done 被
    守卫吞（惰性 no-op）——扩展端/桥/测试协议面不动
  - **范围边界**：只动 VSC webview 端（activity 三文件 + panels/chat/streaming/state + index.html/base.css
    + activity-flow 测试族 + **locales（删 3 词键）**）——扩展端零动——CLI 端零动——boot 原子化（B2）保留
    ——ui.js appendAdvisorChunk 零改动假设（其冻结守卫已含 null/非块保护——不成立则计入受影响面）
- **非功能性需求（评审 round2 #4——机制文档标准成层）**：
  - N1 性能：150 窗 DOM 有界（live/冻结出生即计窗无豁免——trim 保底）——内容流 append 零额外复制
  - N2 兼容：扩展端消息协议零改（F-5 边界）——settled/answered 等既有 status 全被终态闭合覆盖
  - N3 语义：reload/新会话无块特殊恢复（消息流 = 历史——SESSION-RESTORE-PARITY）
  - N4 可维护：块生命周期只 live → frozen 两态——单 map 单守卫——无 DOM move/锚/顺序维护

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
终态（任何非 queued/started 的 status——done/settled/error/cancelled/answered/terminated/failed——
  settled 视同 done——answered 无块 no-op 有块折叠）：
  原地 meta 终态 + class sub-live→sub-frozen + open=false + 头词换 [✓ label · done Ns]
  此后任何消息 → 幂等守卫丢弃（map 有键且终态 → null）
块 = 会话流折叠 details——与 advisor 块同规则被 150 窗裁
会话清/回合中止 → resetActivity：移除 .sub-live + 清 map
reload/新会话 → 无块特殊恢复（clearMessages→historyPage 即一切）
```

### 受影响文件（VSC webview 端——手工重写——评审 #1 补全行数+增量）

| 文件 | 现行数（实测） | 预计增量 | 重写后 |
|---|---|---|---|
| webview/activity.js | 287 | -137 | ~150 行（独立成档——不并入 view——评审 #1 消矛盾） |
| webview/activity-view.js | 242 | -150 | **保留独立叶 ~90 行**（refreshBlock/updateStopButton/noteChunk——删区显隐/ticker/awaiting·position·waiting 词） |
| webview/activity-freeze.js | 94 | 整文件删 | freeze 原地折叠 ~15 行并入 activity.js |
| webview/panels.js | 185 | -40 | 簿记段删 → handleSubagentMessage 纯转发；suspension freeze 兜底保留 |
| webview/chat.js | 319 | -3 | ⏹ 委托回 messagesEl（删区容器委托）——其余不变（>300 档：改动仅删 2 行委托——结构不变——不涉拆分） |
| webview/streaming.js | 254 | -15 | subagentChunk 守卫改空安全（`if (!block || frozen) return`）+ 删 rAF 活动区扫描 |
| webview/state.js | 118 | -3 | 删 ctx.subAgentArea；S._subBlocks 保留 |
| index.html | 89 | -4 | 容器 div + 注释（L25-28 区）删——评审 round2 #5 口径 |
| base.css | 449 | -30 | grid 五行→四行 + #subagent-activity 规则删（>300 档：净删不改结构——不涉拆分） |
| test/activity-flow.test.mjs | 680 | 重写 | **全族按新形态重写——目标 ≤300 行（拆简后规模参考 B1 8 组 ~260——超出则拆多文件）** |
| test/helpers/webview-env.mjs | 73 | -1 | fixture #subagent-activity id 删 |
| locales/en.json + zh.json | — | -3 词键 | sub.waiting/sub.position/sub.awaitingDigest 死键删——**sub.cancelQueueBtn
  保留（queued ⏹ 标题——F-2）**——评审 round2 #2 |
| docs/design/README.md | — | ≤+5 | 本档登记 + 被取代档（SESSION-ACTIVITY-REVISED/QUEUED-VIS/ACTIVITY-SPLIT/SESSION-FLOW-B B1 段）标 superseded——评审 #1 #4 |
| docs/design/WEBVIEW.md | — | ≤+15 | §2 布局 + §5 子代理机制权威措辞同步（流尾形态——删容器/DOM-move/awaiting 描述）——评审 #1 #4 |

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
| 150 裁（冻结） | 超窗 | 冻结块随窗裁——迟来消息守卫丢——F-4 |
| 150 裁（live 运行中） | live 块成最旧被裁 | map 中 !frozen && !isConnected → 移出簿记（tombstone——后续消息丢弃）——评审 #1 #6 |
| error | error 消息 | 终态折叠 + error 头词——F-1 |
| answered（有块） | consult answered 消息 | 折叠（consult 终态驱动）——F-1 |
| answered（无块） | answered 但无块 | no-op（回复走 digest 呈现）——F-1 |
| 重复 started | 同频道二次 started | 覆盖式刷新头词不重挂——F-1 |

## 验收

- AC-1 grep 零命中：freezeInsertPoint/settleSeq/_freezeAtEl/freezeSettledBlocks/reclaim 消费/
  updateAreaVisibility/pinActivityArea/subagent-activity（webview 端——测试除外待重写）
- AC-1b 死键确认：locales 无 sub.waiting/sub.position/sub.awaitingDigest——**sub.cancelQueueBtn 在**
  （queued ⏹ 标题活键）
- AC-2 块出生 #messages 流尾（activity-flow 断言 parentNode = messagesEl）
- AC-3 终态原地折叠无 DOM move（parentNode 不变断言）
- AC-4 queued 三分支（⏳ 头 + **取消 ⏹**/翻转/取消移除）绿——扩展端消息协议零改
- AC-5 扩展端文件零改动（git diff 仅 webview 端 + 测试 + locales + docs）
- AC-6 VSC npm test 全绿（activity-flow 重写后 ≤300 行 + 其余回归）
- 红线：不用 git checkout/revert/reset（纯 write/edit）；CLI 零动；boot 原子化不动；preview/ticker 删
  除（用户已确认）；不做跨 reload 恢复（reload 进程死块死——消息流为历史）

## 变更记录
- 2026-09-09：落档（用户裁定：块机制加戏——补丁叠补丁致间歇丢块——回 B1 流尾简单形态——手工重写
  不用 git——queued 可见保留但去实时刷新——不做跨 reload 恢复——扩展端零动安全边界——preview/ticker/
  answered 防御删）。
- 2026-09-09：评审 #1 changes-required 全 8 项采纳修正（🔴#1 受影响表全量补行数+增量实测 + 消
  activity/view 合并矛盾（view 留叶 ~90）+ 测试族目标 ≤300 + 🟡#2 终态集合闭合（非 queued/started 一律
  折叠——answered 有块折叠无块 no-op）+ 用例表补 error/answered×2/重复 started/live 被裁行 + 🟡#3 queued
  头保留取消 ⏹（F-4 扩 running+queued）position/waiting 词整删 + 🟡#4 doc-sync 行（README 登记 + 被取代档
  superseded + WEBVIEW §2/§5 同步）+ 🔵#5 streaming 空安全守卫注 + 🔵#6 live 被裁 tombstone 路径 + 🔵#7
  locales 词键/ui.js 面处理——round 2 待评）。
- 2026-09-09：评审 round2 PASS + 5 项 advisory 修正（🟡#1 终态/trim lookup-only 绝不建块明写 + 🟡#2 locales
  只删 3 键（waiting/position/awaitingDigest）——cancelQueueBtn 保留（queued ⏹ 活键）键名精确化 + 🟡#3 F-4
  ⏹ 措辞对齐 running+queued + 🔵#4 NFR 块成层（N1-N4）+ 🔵#5 index.html 增量 -4 口径——执行版定稿——
  token 73ee0eee）。
