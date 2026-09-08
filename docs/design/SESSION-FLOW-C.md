# VSC 会话流 C 方向（消息秩序与忙态收敛——VSC-SESSION-FLOW-C）

> 板块：会话流（panel/webview 时序——用户裁 C 先行 A+B 后做）。权威源：WEBVIEW.md（消息协议）+ AGENT-LOOP.md（机制权威——VSC 侧）。
> 状态：**设计待评审**——2026-09-09 落档（C 深勘察 explore 一手——消息路由全路径 + 忙态镜像全清单 + 6 竞态 H-A~F + 测试基建损坏点）。需求：TODO 需求池「VSC 会话流时序对齐 CLI」——C 先行。

---

## 需求

- **总体目标**：VSC 会话流时序对齐 CLI——C 层（架构级）= 消息路由秩序化 + 忙态状态机收敛——用户裁 C 先行 A+B 后做（A：sendMessage 守卫等——依赖 C1；B：块原地/原子打开——依赖 C2）。
- **功能性**：
  - C1 竞态修复 + turn 句柄化（独立可交付——先做）：
    - F-C1a turn 句柄 + catch 兜底（修 H-B——回合 setup 期异常 → UI 永卡 running——加 _turnHandle.catch → error + loading:false 保底）
    - F-C1b abort 启动闩（修 H-C——Startup 窗口 abort 吞——_abortRequested 闩——newTurnController 消费）
    - F-C1c atComplete seq（修 H-A——findFiles 无 seq——旧扫描覆盖新下拉）
    - F-C1d 响应器 id 匹配 + questionCancelled case（修 H-D——shift 无条件——错 resolve 队头）
    - F-C1e retry 并入 userMessage 同入口（修守卫双份 H-F 之 retry 脆口）
  - C2 状态机收敛（依赖 C1——后做）：
    - F-C2a host 唯一 `_turnState` 枚举（idle/running/susp——waiting 为 running 修饰态非互斥——_refreshStatus 语义保留）
    - F-C2b `_publishTurnState()` 单一广播点 + `{type:"turnState"}` 新消息 + webview 单一 reducer
    - F-C2c renderStatusBar 单 writer（修 H-E——loading case 不再 innerHTML 覆写——thinking 态改 S._phase 由 renderStatusBar 绘制）
    - F-C2d Stop 常显（susp 期由 _turnState==="susp" 派生——修 digest 间按钮闪烁）
    - F-C2e（评审 #3 补）_suspCounts 陈旧修复（digest 间——suspension.mjs:282/:300 重发时机——reducer 派生或触发点补）
  - **范围边界**：不做全量 FIFO 串行（**杀 Stop——红线——回归测试立不变量**）；慢 settings/网络 handler 不排队（并发无害——写 config.json 与回合无共享态）；renameSession 原生对话框不改；消息类型**只增不改**（既有 token/reasoning/subagent/suspension 名不动——只新增 turnState/seq/promptId 字段）；C 为 VSC 独有（CLI 单线程 TUI 无此问题——无对拍面）。

## 非功能性需求（评审 #4 补）
- N1 兼容：消息类型只增不改（既有 token/reasoning/subagent/suspension 名零改——硬标准）
- N2 延迟红线：不引入全量 FIFO 串行（abort/控制消息直通——杀 Stop 即失败）
- N3 可维护：忙态单来源（_turnState 枚举 + _publishTurnState 单广播 + renderStatusBar 单 writer）
- N4 可靠性：回合 promise 永不悬挂（_turnHandle.catch 保底）

## 设计（C 深勘察骨架——照做勿自行解释）

### C1（先做——独立可交付——只动 host 路由/类字段）

1. **turn 句柄化**（评审 #5 call graph：chat-panel.mjs:298 _chat 委托 runPanelChat（panel-chat.mjs:73）
   ——单入口——turn handle 挂在 chat-panel 层）：
   `panel._turnHandle = runPanelChat(...)`（fire 语义不变仍不 await）——`_turnHandle.catch(e => { postMessage error +
   loading:false 保底 })`——不变量：回合 promise 永不悬挂——实现期核 _chat 委托关系后按实际定单入口
2. **abort 启动闩**（评审 #1：**消费即复位**）：abort/interrupt case 置 `panel._abortRequested = true`——
   `newTurnController`（panel-chat.mjs:41-46）或回合起点消费——**置位则新建 controller 立即 abort 并
   复位闩**（防下次正常回合被误杀）——回归用例：Startup 窗口 abort 后下次正常回合干净启动
3. **atComplete seq**（评审 #2 决定：seq 在 webview 侧产生——autocomplete.js 入受影响表）：请求带 seq
   （autocomplete.js:29 侧自增——webview/autocomplete.js 改）——host 只回显最新 seq（panel-index.mjs:37-41
   过滤）——实现期核 autocomplete 防抖现状后确认是否还需 webview 配合（如防抖已有则 seq 足够）
4. **响应器 id 匹配**（panel-callbacks.mjs:22-39 + panel-messages.mjs:218-243）：卡片带 {promptId}——host 按 id 查队列条目（非无条件 shift——找不到 no-op）——补 chat.js questionCancelled case（移除卡片）
5. **retry 并入** userMessage 同入口（panel-messages.mjs:148-151 → 经 _suspQueue 统一队列）
6. **测试清单漂移修复**（先决——损坏点）：test/files.mjs:9-28 8 项缺失（agent-core/config-io/execute/git/provider/chat-panel/edit-eol/edit-semantics）——git 核实际状态后修清单（删缺项或补回文件）——否则新测试无法入册

### C2（后做——依赖 C1）

1. host 唯一 `_turnState` 枚举（{idle, running, susp}——waiting = running 修饰态）——`_turnActive`/`_suspPending` 等布尔改谓词方法 `panel.turnBusy()`（缩小迁移面——读者表 6+ 处）
2. `_publishTurnState()` 唯一广播——§3.1 各 set/clear 行调——发 {type:"turnState", state, counts?}——webview 单一 reducer 更新 S._turnState
3. renderStatusBar 单 writer——loading case 只 setLoading + 置 S._phase（thinking 由 renderStatusBar 绘——修 H-E）
4. Stop 常显——_turnState==="susp" 派生（loading:true/false 不再每 digest 重画 thinking + 隐 abort 按钮）
5. _suspCounts 陈旧修复（digest 间——suspension.mjs:282/:300 重发时机——reducer 派生或触发点补——F-C2e）

## 受影响文件（VSC 单仓）

| 文件 | 改动 | 行数 |
|---|---|---|
| src/extension/chat-panel.mjs | turn 句柄 + 闩字段 + _turnState 枚举 + _publishTurnState | ~340 现（+~40——评审 #1 实测） |
| src/extension/panel-messages.mjs | retry 并入 + 响应器 id 匹配 + 路由兜底 | ~378 现（+~25——评审 #1 实测） |
| src/extension/panel-chat.mjs | newTurnController 闩消费 + 释放窗对齐 | ~440 现（+~15——评审 #1 实测） |
| src/extension/panel-index.mjs | atComplete seq | ~55 现（+~8——评审 #1 实测） |
| src/extension/panel-callbacks.mjs | makeAskInPanel promptId + questionCancelled | ~135 现（+~10——评审 #1 实测） |
| src/extension/suspension.mjs | 状态转换对齐 _turnState + 计数重发 | ~360 现（+~8——评审 #1 实测） |
| webview/chat.js | questionCancelled case + loading 收敛 | ~310 现（+~10——评审 #1 实测） |
| webview/state.js | S._turnState + _phase | ~105 现（+~8——评审 #1 实测） |
| webview/status-bar.js | renderStatusBar 单 writer | ~65 现（+~6——评审 #1 实测） |
| webview/loading.js | setLoading 对齐 | ~30 现（+~4——评审 #1 实测） |
| webview/panels.js | suspension 消息对齐 | ~240 现（+~4——评审 #1 实测） |
| test/files.mjs | 清单修复（先决）+ 新测试登记 | ~28 现（+~4——评审 #1 实测） |
| test/chat-panel.test.mjs（评审 #6：新文件——若树中已有同名则重建——以 files.mjs 实况定） | C1 6 组测试 | 新 ~200 |
| docs/design/WEBVIEW.md | 新章节「消息秩序与忙态收敛」（评审 #7：权威锚——协议正文唯一来源） | doc |
| AGENTS.md:72-98 协议表 | 新消息类型行（评审 #7：镜像指 WEBVIEW.md——不重复正文） | doc |

## 验收

- AC-C1 回合 setup 异常不再永卡 UI（_turnHandle.catch 保底——error + loading:false——回归红线测试）
- AC-C1 Startup 窗口 abort 生效（闩消费——Stop 不再被吞）
- AC-C1 atComplete 旧扫描不覆盖新下拉（seq 只采纳最新）
- AC-C1 迟到响应器 no-op 不 resolve 错队头（id 匹配）
- AC-C1 retry 与 userMessage 同入口（守卫统一——_suspQueue 零丢失）
- AC-C2 _turnState 枚举转换正确（webview reducer 测试——susp 进出 + waiting 修饰）
- AC-C2 renderStatusBar 单 writer（loading 不覆写徽标——终态 = 最后消息驱动）
- AC-C2 Stop susp 期常显（_turnState==="susp" 派生）
- AC-C2e（评审 #3）_suspCounts 不陈旧（digest 间重发后 webview 计数 = host 实际——测试断言）
- AC 红线：全量 FIFO 串行不引入（abort 直通测试立不变量）+ 既有消息类型名零改
- AC 测试绿（C1 6 组 chat-panel.test + C2 webview reducer 组 + 既有不回归——VSC npm test 快层 + L2 父侧）

## 变更记录
- 2026-09-09：C 深勘察落档（消息路由全路径 + 忙态镜像全清单 + H-A~F 竞态 + 方案选型单 FIFO 否决——杀 Stop 红线——C1/C2 分阶——测试基建漂移发现）。需求登记 TODO 需求池（用户裁 C 先行 A+B 后做）。
