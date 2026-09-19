# VSC 会话流 B 批（SESSION-FLOW-B）

> 板块：会话流（panel/webview 时序——B 批 = B1 子代理块原地 + B2 会话打开原子化——A 批已交付 aacebee 后）。权威源：WEBVIEW.md（§2 布局/§5 子代理机制/§8 消息秩序——权威措辞只落此）。
> 状态：**已交付核销**——2026-09-09（B1 52e03f3 + B2 6e98807——B1：拆容器/freeze 原地/150 无豁免/activity-flow 8 组——B2：openSessionContent 单向 boot/session-boot 组——VSC L2 154/154 绿——audit clean + advisor pass——consume 2e3c1b83——VSC 会话流 C+A+B 全链闭合——A4 尾巴/忙态冷启 boot 守卫观察项留 TODO）。
> 〔2026-09-12 活动区收口批（VSC-ACTIVITY-CLOSURE）〕**B1 的“块原地（无 DOM move）”限缩为区驻留期**——终态消化回收后归档落流（`WEBVIEW.md` §14——A 方案）；本档 N3 不变式 / AC-B1c / AC-B1d 的“无 DOM move”句以 §14 为准（旧链本体仍禁——§14.4）；F-B1a（拆容器）/ F-B1b（流尾出生）仍为已废位置形态。

---

## 需求

- **总体目标**：VSC 会话流时序对齐 CLI——B 批（治观感根源）：B1 子代理块原地（删"跳位置"——live 块出生即在对话流）+ B2 会话打开原子化（删"波浪式落地"——单向 boot）。
- **功能性**：
  - F-B1 子代理块原地（用户裁纯时序序）：
    - F-B1a 拆 #subagent-activity 容器（live 块全入流后容器死码——grid 五行→四行）
    - F-B1b ensureBlock 挂载 → #messages 当前流尾（落点 A——流级独立块与 .message 同层——非嵌入父段——150 裁剪只数直接子元素）
    - F-B1c freezeBlock 退化为原地折叠（DOM move/锚点链/freezeAnchor 全删——settle 只翻状态——位置 = 出生位——CLI _freezeAt 语义由出生时序结构性取代）
    - F-B1d resetActivity 清流内孤儿 live 块（map 清 + .sub-live 防御清——frozen 不动）
    - F-B1e live 块从出生即计入 150 窗口（无豁免——预算 = 并发子代理数——池有界）
    - F-B1f history.js 锚选择器扩 .advisor-block（懒历史与流内块共存插位正确——顺带修 advisor 块同款小瑕疵）
  - F-B2 会话打开原子化（用户裁移门）：
    - F-B2a status() 拆快慢段——快段（评审 #3 计数校正：resumeSlot 绑槽 + project + loadSession 三件——sessions
      同 tick 双发经 F-B2c 合并故不单列）移入 webviewReady——慢段（migrate/fullStatus/mcpStatus/索引）resolve
      期起（探测与 webview 加载重叠）
    - F-B2b 单向 boot（webviewReady = 全量内容一次性落定——clearMessages→historyPage→autoApprove→planMode→sessions）——resolve 不再发内容（**修 Reload 后对话区空缺陷**——静态判定实现缺陷）
    - F-B2c sessions 同 tick 双发合并（删 status():262 独立发——loadSession:150 单发保留——异步第三发保留不同 tick）
  - **范围边界**：行面板 #subagent-panel 保留（queued/waiting/consult——B1 不动）；不动消息类型名（C 边界延续）；autoClean/ticker 保留；B1/B2 **顺序交付不并行**（WEBVIEW.md 同仓共享文档面——不重叠章节）；真机验证项标记实现期（Reload 复现 + digest 窗口走查）。

## 非功能性需求（评审 #4 补）
- N1 兼容：消息类型名零改 + C1/C2/A 面零回退（既有测试全绿）
- N2 时序：同 tick 单发纪律（sessions 恰一次）——跨 tick 保留（异步第三发）
- N3 不变式：子代理块无 DOM move（位置 == 出生位）
- N4 真机验证项归实现期（Reload 复现 + digest 窗口走查）

## 设计（B 批深勘察骨架——照做勿自行解释）

### B1（先行——webview 8 文件 + 测试骨架从零立）

1. **拆容器**：index.html:31 删 div——base.css:87 grid 五行→四行（删 #subagent-activity 行）——
   base.css:98-107 整段删——chat.css:384-385 删——chat.js:89 subagent-activity click 监听删（messagesEl
   委托 :88 仍在——in-flow ⏹ 由它接）——activity.js activityPanel()/updateVisibility() 及调用点删——
   webview-env.mjs:67 fixture id 移除
2. **ensureBlock 挂载**（activity.js:250-254）：appendChild → ctx.messagesEl（state.js:15——流尾）+
   出生后 maybeScrollDown(ctx)（ui.js:431-433 import——钉底替代面板 scrollTop）——落点 A（流级独立块
   ——.advisor-block 同层）——两路汇合：applySubagentStatus started（:284）+ subagentChunk→ensureBlock
   （streaming.js:237-246）都改挂载
3. **freezeBlock 退化**（activity.js:350-393）：freezeAnchor 机制全删（:317/:374-388/字段 :247）——settled 分支（:303-325）只翻状态（✓ done · awaiting digestion 原地显）——freezeBlock 保留终态翻/class 换/⏹ 移除/refreshBlock/appendPreview（原地即其下方）——freezeSettledBlocks（:422-432）不变
4. **resetActivity 扩展**（activity.js:471-477）：清 ticker + S._subBlocks 值中 !frozen && isConnected remove() + 防御 .sub-live 孤儿清——frozen 不动
5. **CSS**：删面如上——零新增主体规则（.advisor-block/.sub-block/.sub-report-preview 原样适用 in-flow——.advisor-content 100px 内滚/content-visibility 原样——live 块内容增长天然有界）
6. **history 锚**（history.js:29/:51）：锚选择器扩含 .advisor-block
7. **文档**：WEBVIEW.md §2 布局正文/grid 行模板 + §5 全节重写（"子代理块（live/冻结）计入 150"措辞）+ AGENT-LOOP.md:65/:345 活动面板行 + activity.js 模块头/chat.js:76-80/panels.js:155-162 注释同步（机制描述文档债随代码批）
8. **测试骨架**（前置项——B1 从零立——评审 #5：占位形态——实现前补全为输入/预期用例表）：
   test/activity-flow.test.mjs 新建（登记 files.mjs）——
   webview-turnstate 骨架复制（setupWebview + installChatFixture + 动态 import——ticker seam
   setActivityTickDisabled + activityTick 假时钟）——用例 8 组：① 出生 #messages 尾 + 钉底 ② freeze
   原地（parentNode 不变/头翻/preview 紧跟/stopped 无 preview）③ settled 挂起驻留 + digest done 原地冻
   ——**无 DOM move 断言**（回归红线）④ sync 父回合中途出生 + 续段后块位不变 ⑤ resetActivity live
   移除 + frozen 保留 ⑥ trimOldMessages 计入 ⑦ ⏹ 可见性规则 ⑧ parseChannel 轻量

### B2（后行——extension 3 文件）

1. **status() 快慢段拆**（panel-session.mjs:255-274——评审 #3 计数校正）：快段 = :260-263
   （resumeSlot 绑槽 + _pushProject + pushSessions 单发 + loadSession——四调用）提为导出 `openSessionContent(panel)`；
   慢段 = :266-273（migrate + fullStatus + mcpStatus + modelPrefs + maybePromptIndex）
2. **resolveWebviewView**（chat-panel.mjs:116-142）：set html → listener → _initStatusBar → **只调慢段**（探测尽早并行——慢段头部 pushStatus 可能丢——webviewReady _pushStatus 兜底已有——幂等）——删 this._status() 或改调慢段——**不得双跑快段**
3. **webviewReady case**（panel-messages.mjs:367-382）：现四件（turnState/i18n/agentSettings/providerStatus）保留原序（:377-380）后**接快段 openSessionContent**（单向 boot——clearMessages→historyPage→autoApprove→planMode→sessions 落定——槽绑定时机顺延 resolve→webviewReady——webviewReady 前无 slot 读者安全）
4. **sessions 合并**：删 status():262 独立 pushSessions（loadSession:150 单发保留——既有调用方依赖）——异步第三发（fullStatus cb :307）保留不同 tick
5. **文档**：WEBVIEW.md §8 增 B2 boot 段——AGENTS.md webviewReady 行如涉补
6. **测试**（评审 #2：新文件 test/session-boot.test.mjs——组 ⑪⑫——chat-panel.test.mjs 485
   近 500 不再追加）：stubPanel（:53-77 posted 捕获）补 _agentSettingsSession/_pushStatus/_pushProject/
   _loadSession/_pushSessions overrides——① webviewReady boot：posted 序列含四件+快段、clearMessages 在
   historyPage 前、sessions 恰一次（红线）② status() 快慢段分离断言 ③ resolve 不再发内容——Reload
   真机验证标记实现期项

## 受影响文件

| 文件（B1） | 改动 | 行数 |
|---|---|---|
| webview/activity.js | 挂载改 messagesEl + freeze 原地 + resetActivity 扩展 + 死码删 | ~480 现（净 ~-60——评审 #1 实测） |
| webview/chat.js | :89 容器监听删 + 注释 | ~330 现（-~3） |
| webview/streaming.js | ensureBlock 汇合挂载（两处调点改） | ~250 现（+~2） |
| webview/ui.js | maybeScrollDown 导出（供 activity import） | ~445 现（+~2） |
| webview/history.js | 锚选择器扩 | ~55 现（+~1） |
| webview/index.html | 容器 div 删 | ~35 现（-2） |
| webview/base.css | grid 五行→四行 + 滚动带段删 | ~110 现（-~12） |
| webview/chat.css | 面板内距删 | ~495 现（-2——>300 既有债不重论） |
| test/activity-flow.test.mjs | 新建 8 组 | 新 ~260 |
| test/helpers/webview-env.mjs | fixture id 移除 | ~71 现（-1） |
| webview/panels.js | 注释同步（评审 #1——:155-162 机制描述随代码批——行数不变结构不变） | ~263 现（0——结构不变） |
| 文档：WEBVIEW.md §2/§5 + AGENT-LOOP.md | B1 文档面（评审 #1 归位——权威措辞） | doc |
| test/files.mjs | 登记 activity-flow | ~26 现（+1） |

| 文件（B2） | 改动 | 行数 |
|---|---|---|
| src/extension/panel-session.mjs | 快慢段拆 + openSessionContent 导出 | ~275 现（+~10） |
| src/extension/panel-messages.mjs | webviewReady 接快段 | ~420 现（+~6） |
| src/extension/chat-panel.mjs | resolve 只起慢段 | ~400 现（+~2） |
| test/chat-panel.test.mjs | 不追加（评审 #2：组 ⑪⑫ 移新文件——防超 500 硬限） | ~485 现（0） |
| test/session-boot.test.mjs | 新建——组 ⑪⑫（评审 #2——拆分方案入设计） | 新 ~60 |
| 文档：WEBVIEW.md §8 + AGENTS.md | B2 文档面（评审 #1 归位——§2/§5/AGENT-LOOP 归 B1 表） | doc |

## 验收

- AC-B1a 容器拆除（#subagent-activity 无残留——grid 四行——测试 fixture 同步）
- AC-B1b live 块出生即在 #messages 流尾（与 .message 兄弟序——测试 ① 锁）
- AC-B1c freeze 原地（块位置 == 出生位——无 DOM move——测试 ③ 回归红线锁）
- AC-B1d resetActivity 清流内孤儿（live 移除 + frozen 保留——测试 ⑤ 锁）
- AC-B1e 150 窗口计入（live/冻结占位——测试 ⑥ 锁）
- AC-B1f history 锚扩（懒历史插位正确）
- AC-B1 测试绿（activity-flow 8 组 + 既有不回归——VSC npm test 快层）
- AC-B2a 单向 boot（webviewReady 全量内容——clearMessages 先于 historyPage——sessions 恰一次）
- AC-B2b resolve 不再发内容（结构性断言——组 ③ 锁）
- AC-B2c 快慢段分离（status 慢段不含 loadSession——组 ② 锁）
- AC-B2 测试绿（session-boot 组 ⑪⑫ + 既有不回归——评审 #2 新文件）
- AC 红线：消息类型名零改 + C1/C2/A 面零回退（既有测试全绿——含 A 批 ⑧⑨⑩）
- AC 真机验证项（实现期标记）：Reload 后对话区内容在位（B2 主验）+ digest 窗口走查（A3 回归）

## 变更记录
- 2026-09-09：B 批落档（B 批深勘察一手——A 批后基线——B1 拆容器/挂载 messagesEl/freeze 原地/150 无豁免/resetActivity 清孤儿——B2 快慢段拆/webviewReady 单向 boot/sessions 合并——Reload 空缺陷静态判定——B1/B2 文件面零重叠——顺序交付 B1 先行——分两次 eng-coder）。
