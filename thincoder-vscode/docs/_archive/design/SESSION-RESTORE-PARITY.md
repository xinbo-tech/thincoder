# VSC 会话恢复呈现对齐（SESSION-RESTORE-PARITY）

> 板块：会话/存储/恢复（VSC——恢复链对齐 CLI 语义）。权威源：CLI startup.mjs historyToLines（恢复蓝本）+ session-io.mjs（VSC 恢复链）。
> 状态：**已交付核销**——2026-09-09（0231627——historyWindow 重写拆分 history-window.mjs + buildFinishedToolCard 拆分 tool-card-restore.mjs + C/A/B/E/F/G/H 全修——VSC L2 179/179 绿——audit clean + advisor pass——consume 592ea112——真机对拍 CLI /session vs VSC 实现期走查）。

---

## 需求

- **总体目标**：VSC 会话退出重进后恢复呈现与原始基本一致——恢复链从"字符串内容子集渲染"对齐 CLI historyToLines 的全量重建语义（同一槽文件——CLI 恢复 ≈ CLI 实时；VSC 恢复应同样）。
- **功能性**：
  - F-C 机器提醒剔除：恢复侧跳过 `[System reminder:` user 条目（判据 = isRealUserMsg 复用——CLI :33 逐字同）——保存侧零改动（CLI 注入也双线持久——人读线保留有机器线回退用途）
  - F-A assistant 帧保留 + turnStart 可见前驱判定（纯工具回合不丢 ❯ ThinCoder: 标签）
  - F-B 工具帧+结果配对一张卡（name+args 头 + 结果体 + Error 红/展开——嵌 assistant 容器内——对齐 live 终态卡）
  - F-E reasoning 可修面（echo-required 帧 reasoning_content → thinking 块——reasoning_content ?? reasoning 键兼容）
  - F-F ts 读时兼容（ts ?? timestamp）——user 气泡真实时间——无 ts 不显示（去 fmtTime(new Date()) 误导回退）
  - F-G 非空历史首屏移除 welcome（空历史保留——真空会话语义不变）
  - F-H 首窗对齐 200（CLI 200 vs VSC 20——用户裁并入本批——HISTORY_PAGE_SIZE）
  - **范围边界**：保存侧与 CLI 零改动（纯恢复链）；天然不可修不补（终答 reasoning 双端不落盘 / thinking-only 正文化盘上不可区分 / D 折叠态 / 子代理 live 块不入 history / 工具耗时/file-links）；孤儿 tool skip（对齐 CLI——防跨页双显）；machine 线注入点零改动。

## 设计（恢复对齐深勘察骨架——照做勿自行解释）

### 1. historyWindow 重写（session-io.mjs:377-408）
输出模型：user{kind,text,timestamp,idx} / assistant{kind,text,reasoning,timestamp,idx,turnStart,tools:[{id,name,args,result}]} / tool{kind,name,text,timestamp,idx}（仅孤儿保底）
- 规则 1（C——评审 #4 谓词精确化）：skip 判据 = `isRealUserMsg(m) && m.content.trim() !== ""` 取反
  （即非 string / startsWith("[System reminder:") / 空串空白 三态全 skip——isRealUserMsg 自身对空串返回
  true——复用须叠加 trim 判）
- 规则 2（A）：assistant 帧全保留（content null 不丢）——幽灵帧（空 content ∧ 无 tool_calls ∧ 无 reasoning）才 skip
- 规则 3（B）：窗口内帧 tool_calls 与紧随 tool 条目滚动配对（tool_call_id 次序——多调用并行批全配）——配对结果随帧 tools[] 下发——被消费 tool 条目不独立产消息——孤儿 tool skip
- 规则 4（评审 #4 配对 scope 精确化）：任何帧的未配 tool_calls 均可消费窗口末界后的紧邻 tool 条目
  （滚动配对跨窗口边界——不限于末帧）——孤儿判定对**全历史**（非仅窗口）——半开区间 [s,e) 防
  loadOlder 重渲染
- 规则 5（A）：turnStart = assistant 帧且上一条**可见**（经跳过规则）消息为 user 或无可见前驱——从 i-1 回扫跳过条目——CLI inTurn 语义（skip 不重置 inTurn）
- 规则 6：多模态 content 数组/幽灵帧 skip（现 :385 保底同）

### 2. builder 重构（ui.js:395-401 + 三 builder）
- assistant 帧容器 = .message.assistant（data-idx 帧原始 idx）——内部序对齐 live：label（turnStart ? ❯ ThinCoder: : 无）→ thinking 块（reasoning 存在 → details.reasoning-block[open] + summary + content——md(reasoning)——live 同 DOM）→ content bubble（md(text)）→ 工具卡 ×n
- 新 buildFinishedToolCard（B——DOM 对齐 live 终态卡）：header（icon + name + args span slice 80 + title 全 + status done/error）→ body（result 文本——textContent = capText(result) 防未 slim 老文件）——卡嵌 assistant 容器内（chat.css 已支持嵌套）——不设 data-idx（分页锚只外层消息）
  - args（评审 #5 槽位定）：JSON.parse 成功 → pretty JSON **入 body（result 上方独立块）**——header 恒 raw
    slice 80 + title 全（对齐 live :209——live 显示 raw 截断）；失败（slim 300 截断串）→ header raw 原样
  - 状态：/^Error[:：]/ → 红 + body open（finishToolCard :286-295 判据复用）；成功 → 绿 done 折叠；无 result → body 空 + done
- user 帧：F 配套（ts 显示/缺失不显示——去 :145 fmtTime(new Date()) 回退）
- 孤儿 tool：现 buildToolHistory 保底（含 data-idx——webview 直构测试用）

### 3. 时间戳（F）
- historyWindow 读 m.ts ?? m.timestamp ?? null（epoch-ms——读时兼容老文件——字段名沿用 timestamp——webview 零改名）
- buildUserMessage 无 ts 不显示时间
- live 配套：chat-panel.mjs:209 quick-input echo + send.js:35 本地气泡补 timestamp: Date.now()
- assistant 标签不显时间（live 同构——newBlock 恒无——恢复同传 null——用户裁）

### 4. welcome（G）
- applyHistoryPage（history.js:43-72）：!m.older && m.messages.length > 0 → 插入前 ctx.messagesEl.querySelector(".welcome")?.remove()——空历史保留（真空语义）——loadSession/clearMessages 不改——send.js 移除逻辑不变

### 5. 首窗 200（H——用户裁并入——评审 #3 定论）
- HISTORY_PAGE_SIZE（session-io.mjs:369）20 → 200——loadOlder 已不传 pageSize（panel-session.mjs:161
  默认同常量）→ 滚顶页步进自动 = 200（**VSC 刻意 200 非 CLI PgUp 20**——文档定论非实现期核）——
  测试锁：① 断言 HISTORY_PAGE_SIZE === 200——⑬ 用 >200 消息真实形状 fixture 断言首页 = 200 +
  hasOlder:true（AC-H 映射补——评审 #3）

### 6. 测试（三层）
① 新 test/history-window.test.mjs（注册 files.mjs——extension 层纯函数——historyWindow 直驱——fixture 真实形状混排）：序列组 turnStart 矩阵 / C reminder 剔除 + reminder 夹帧间不重置 / B 配对多调用全配 + args 透传 + 无结果 null / E reasoning 透传 + ?? 兼容 / F ts/timestamp/缺失三形态 + idx 全局 + hasOlder + 窗口边界跨页配对 + 孤儿 skip
② session-boot.test.mjs 追加 ⑬（补 ⑪ 空 fixture 缺口）：_setSessionsDirForTest 沙箱 + saveSessionToSlot 真实形状非空 history → openSessionContent/loadSession → historyPage 载荷断言（模型/序/turnStart/配对/剔除）——loadOlder 越页配对——⑪⑫ 零破坏
③ 新 test/history-restore.test.mjs（activity-flow 模式——webview DOM——直驱 applyHistoryPage）：G welcome 移除/空保留 / assistant 帧 DOM 序（label→reasoning-block→bubble→嵌套 tool-call×n——无顶层独立卡）/ 工具卡 header args status / Error 红 open / data-idx 仅外层 / user ts 显示缺失不显示 / 孤儿 tool 顶层卡保底

## 受影响文件（VSC 单仓）

| 文件 | 改动 | 行数 |
|---|---|---|
| src/extension/session-io.mjs | historyWindow 重写 + isRealUserMsg 导出（评审 #1 🔴 实测 469 现——**拆分布局**：
  historyWindow/配对/isRealUserMsg 逻辑提新文件 src/extension/history-window.mjs（~180 新——session-io 只留
  isRealUserMsg 导出 + 调用——净 +~5 现 → 474） | 469 现（+~5——评审 #1 实测校正） |
| src/extension/history-window.mjs | 新建——historyWindow 重写全逻辑（评审 #1 拆分方案——防 session-io 跨 500） | 新 ~180 |
| src/extension/panel-session.mjs | sendHistoryPage 清洗适配嵌套字段 | ~294 现（+~6——评审 #1 实测） |
| src/extension/chat-panel.mjs | F 配套 ts（echo 补 timestamp） | ~405 现（+~2） |
| webview/ui.js | buildHistoryMessage 改造 + buildFinishedToolCard + user 时间回退（评审 #1 🔴 实测 460 现——
  **拆分布局**：buildFinishedToolCard 提新文件 webview/tool-card-restore.mjs（~90 新——ui.js 只留分发
  净 +~15 现 → 475） | 460 现（+~15——评审 #1 实测校正） |
| webview/tool-card-restore.mjs | 新建——buildFinishedToolCard（评审 #1 拆分方案——防 ui.js 跨 500） | 新 ~90 |
| webview/history.js | welcome 移除 | ~85 现（+~5） |
| webview/send.js | 本地气泡补 ts | 51 现（+~2——评审 #1 实测校正） |
| test/history-window.test.mjs | 新建 | 新 ~180 |
| test/history-restore.test.mjs | 新建 | 新 ~200 |
| test/session-boot.test.mjs | ⑬ 追加 | ~212 现（+~40） |
| test/files.mjs | 登记 2 新文件 | ~27 现（+2） |
| 文档：SESSION.md §9 懒历史节更新（评审 #2——turnStart 可见语义/页 200/嵌套 tools 载荷——
  权威源不滞后）+ docs/design/README.md 变更记录登记本档 | doc |

## 验收

- AC-C 机器提醒恢复不现（user 气泡零 [System reminder:——测试 ①C 锁）
- AC-A 纯工具回合恢复有 ❯ ThinCoder: 标签（turnStart 可见前驱——测试 ① 锁）
- AC-B 工具卡含 name+args+result 嵌 assistant 容器（Error 红/展开——成功折叠——测试 ③ 锁）
- AC-B 孤儿 tool skip（防跨页双显——测试 ① 锁）
- AC-E echo-required 帧 reasoning 恢复为 thinking 块（reasoning_content ?? reasoning——测试 ①③ 锁）
- AC-F user 气泡真实 ts（无 ts 不显示——误导回退去——测试 ③ 锁）
- AC-G 非空历史首屏无 welcome（空历史保留——测试 ③ 锁）
- AC-H 首窗 200（loadSession 首屏 200——loadOlder 步进同常量）
- AC 红线：保存侧零改动 + CLI 零改动 + 消息类型名零改 + C1/C2/A/B1/B2 面零回退（既有测试全绿）
- AC 测试绿（history-window + history-restore + session-boot ⑬ + 既有——VSC npm test 快层）
- AC 真机对拍（测试外）：同一槽文件 CLI /session vs VSC 双开——A/B/C/E 目检一致

## 变更记录
- 2026-09-09：恢复对齐落档（A-G 差异根因矩阵 + 修复骨架 + CLI 逐行对拍——前提勘误：CLI 注入也双线持久——C 恢复侧跳过判据统一）——3 未决用户裁全采纳（assistant 不显时间 + 首窗 200 并入 + thinking-only 对拍实现期）。
