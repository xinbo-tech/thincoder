# VSC 会话流 A 批（消息秩序后补——SESSION-FLOW-A）

> 板块：会话流（panel/webview 时序——A+B 批的 A 部分——C 全链交付后）。权威源：WEBVIEW.md §8（消息秩序与忙态收敛）+ SESSION.md §7（标题触发）。
> 状态：**设计待评审**——2026-09-09 落档（A+B 深勘察 explore 一手——C2 后基线内容锚）。需求：TODO 需求池「VSC 会话流时序对齐 CLI」——A+B 后做——用户裁全做 + 定夺点全裁推荐项。

---

## 需求

- **总体目标**：VSC 会话流时序对齐 CLI——A 批（局部快赢——C1/C2 已交付后）：A1 sendMessage 守卫 + A2 标题回合内 + A3/A4 Stop 派生补齐——用户裁 A 批先落（A1/A2/A3 合并）。
- **功能性**：
  - F-A1 sendMessage 走 routeUserTurn 单一入口（修 R6 残留——sendMessage 是唯一绕过入口——回合中 Ask ThinCoder 杀当前回合）：导出 routeUserTurn——sendMessage 改为回显 postMessage → routeUserTurn——running→_suspQueue + messageQueued（与 webview 输入同语义——零丢失）——susp 两态不变——_panel 空 warning 分支保留
  - F-A2 标题生成回合内（修 R3 双缺陷）：**用户裁方案 Y**——仅首回合把标题 await 放进 finally 忙态归位之前（stream 完成即 await 标题——再一并 idle/loading:false——标题窗口 = busy——路由守卫 running→排队——修无池首回合并发 + 有池首回合消化劫持）
  - F-A3/A4 Stop 派生补齐（修 digest 窗口隐藏 + Reload 冷启不恢复——同根）：**用户裁 reducer 派生**——Stop 可见性公式 `(susp||on)` → `S._turnState !== "idle" || on`（loading.js 一行——host 零改动——A3 digest 起跑窗口 + A4 Reload 冷启同解——A4 尾巴可选：webviewReady 时 host 顺带补推 loading:true 一个 message 供 thinking 段恢复）
  - **范围边界**：不动消息类型名（C 边界延续——只增不改）；B 组（B1 块原地/B2 打开原子化）不在本批——后落；A2 只首回合（非首回合无标题逻辑——generateTitle 内部已有 isFirstMessage 判定）。

## 设计（A+B 深勘察骨架——照做勿自行解释）

### A1（独立最小）
- 导出 routeUserTurn（panel-messages.mjs:46-69 现模块私有——加 export）
- sendMessage（chat-panel.mjs:199-206）：回显 postMessage → `routeUserTurn(panel, {text, modelOverride:undefined, …})`——running→_suspQueue（回合尾 FIFO 消费零丢失）+ messageQueued 回执——susp 两态走 _chat 上游分流不变——_panel 空 warning 保留
- 测试：chat-panel.test.mjs 桩面板加例——_turnState:"running" 下 sendMessage → _chatCalls 空 + 队列含文本 +
  messageQueued 一次 + 回显 userMessage 一次；susp-active/susp 释放窗口两例保回归——评审 #5：回合尾
  FIFO 排空断言 = 既有 susp 释放窗口测试覆盖（routeUserTurn 共享排空路径）——实现期确认，若缺补一条

### A2（方案 Y——用户裁）
- panel-chat.mjs:311-312 标题调用**上移**进 finally 忙态归位（:292-298）之前——stream 完成即 `if (isFirstMessage) await panel._generateTitle(turnSlot)`——再 _publishTurnState(idle|susp) + loading:false
- 效果：标题窗口 = running（webview Stop 显——路由守卫 running→排队——修并发）——会话内 digest 首回合标题不再阻塞消化入口（标题在归位 susp 前完成——释放窗口不延）
- 注意：归位前 10s 上限内 webview 停 running（派生 Stop 显——正是想要效果）；_publishTurnState 只在归位行调
  （无广播时序冲突）
- 错误路径（评审 #2）：标题 await 包 try/finally 或确认 _generateTitle 内部吞错——_publishTurnState +
  loading:false 归位恒执行（防标题抛错卡永久 busy）
- 测试：chat-panel.test.mjs 桩测——首回合 isFirstMessage 无池时标题 await 期间 userMessage 入队（不并发直发）
  + 错误用例：标题失败仍正常归位（_publishTurnState + loading:false 发出）

### A3/A4（reducer 派生——用户裁——合并项）
- loading.js:35 Stop 公式 `(susp||on)` → `S._turnState !== "idle" || on`（一行）
- 时序安全核验（勘察已证）：host 所有 loading:false 均在 finally _publishTurnState(idle|susp) 之后发（:292-298→:300；F-C1a catch 先 idle :369 后 loading:false :372）——回合尾先隐 Stop 后 loading 翻转——无新闪烁——ctx.isRunning 无门控作用（loading.js:36 恒 false）——不涟漪
- A4 尾巴（可选）：webviewReady 时 host 补推 loading:true 一个 message——Reload 冷启 thinking 段恢复（_phase 非 null）
- 测试：webview-turnstate.test.mjs ③ 尾段断言翻转（"running+loading:false→Stop 隐" → "running 派生常显"）——同步更新为 state!==idle 派生

### 文档锚
- WEBVIEW.md §8.1 措辞扩一行（routeUserTurn 补命令直发路径）+ §8.4 "Stop 常显"一句（susp 派生 → state≠idle 派生）
- SESSION.md §7 标题触发时机段（A2 方案 Y——回合内）
- AGENTS.md:98 turnState 行措辞如涉及

## 受影响文件（VSC 单仓）

| 文件 | 改动 | 行数 |
|---|---|---|
| src/extension/panel-messages.mjs | routeUserTurn 导出（评审 #3：接线实际在 chat-panel——sendMessage 宿主） | ~418 现（+~2） |
| src/extension/chat-panel.mjs | sendMessage 走 routeUserTurn | ~392 现（+~2） |
| src/extension/panel-chat.mjs | A2 标题上移 finally 归位前 | ~493 现（0——移动非新增） |
| webview/loading.js | Stop 公式 state≠idle 派生 | ~42 现（1 行改） |
| webview/chat.js | 不涉及（评审 #4：A4 尾巴不入本批——TODO 技术组登记——如需 thinking 段恢复后续做） | ~326 现（0） |
| test/chat-panel.test.mjs | A1 + A2 桩测追加 | ~345 现（+~25） |
| test/webview-turnstate.test.mjs | ③ 断言翻转 state≠idle | ~206 现（改 ~5） |
| docs/design/WEBVIEW.md | §8.1/§8.4 措辞 | doc |
| docs/design/SESSION.md | §7 标题时机 | doc |
| AGENTS.md | turnState 行措辞 | doc |

## 验收

- AC-A1 sendMessage running 守卫（_chatCalls 空 + 队列 + messageQueued + 回显——回合尾 FIFO 消费）
- AC-A1 susp 两态零回归（susp-active/susp 释放窗口走 _chat 上游分流不变）
- AC-A1e 空面板 warning 分支保留（_panel 空时 sendMessage warning 不发 _chat——评审 #6 错误用例）
- AC-A2 标题窗口 = busy（首回合标题 await 期间 userMessage 入队不并发——测试锁）
- AC-A2 会话内 digest 首回合标题不劫持消化（释放窗口不延——标题在归位 susp 前完成）
- AC-A3 Stop state≠idle 派生（digest 起跑窗口 Stop 显——测试断言翻转）
- AC-A3 回合尾无新闪烁（loading:false 在 idle 广播后——时序核验）
- AC-A4 Reload 冷启 running Stop 恢复（派生——A4 尾巴 thinking 段恢复如做）
- AC 红线：消息类型名零改 + C1/C2 面零回退（既有测试全绿）
- AC 测试绿（chat-panel + webview-turnstate 更新组 + 既有——VSC npm test 快层）

## 变更记录
- 2026-09-09：A 批落档（A+B 深勘察一手——C2 后基线——A1 残留确认/A2 双缺陷/A3+A4 同根——4 定夺点用户全裁推荐项：
  A1 routeUserTurn + A2 方案 Y + A3 reducer 派生 + B1 纯时序序 + B2 移门——A 批先落）。
- 2026-09-09 评审 6 项采纳（文档归属注——评审 #1：本档批载体——实现后权威措辞只落 WEBVIEW/SESSION——
  本文档收敛为实现记录——随核销 README 登记 / 标题错误路径 try-finally / 受影响表一致性修正 / A4 尾巴
  明确 +~1 或 TODO 登记 / FIFO 断言确认 / 错误用例补——token c6671007）。

> 归属注（评审 #1）：本档 = A 批设计/实现记录载体——权威措辞只落 WEBVIEW.md §8 + SESSION.md §7（文档锚
> 段）——核销时随 README 地图登记（同 SESSION-FLOW-C 先例）——不双处详述。
