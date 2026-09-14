# TUI 会话视图与会话驱动 · CLI 面 · 设计

> 板块 = **TUI（终端界面）**（三档设计之一）——本档承载**会话视图**（启动恢复 / 历史懒加载 / 三层缓存）·
> **回合驱动**（`runAgentTurn` / 挂起会话驱动器）· **显示层内存有界**（字符维度额）。
> 配对需求档 = `docs/cli/requirements/TUI.md`（本板块三档设计共用一份需求档——层归属不对称，理由见该档 §1 注）。
> 同板块其余两档 = `docs/cli/design/TUI.md`（界面核心）· `docs/cli/design/TUI-COMMANDS.md`（命令层与选择面）。
> 对位档 = **无**（VSC webview 的历史窗口显示面独立——端差异登记、各端独立实现）。
> 建档：2026-09-15（**B 式迁移轮 · 第 6 批**——`thincoder-cli/docs/design/TUI.md` 的 §7 / §8 / §15 面重建入本档；
> 旧档原地一字不改、留作参照历史）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与模块地图

> 本表是**结构性快照**——新增 / 改名 / 删除文件时同批回写。**行数列不并**（as-of 数值随实现漂移）。

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/startup.mjs` | 启动屏 + 会话恢复（`historyToLines` 从 history 重建——**display 快照已废弃，恢复唯一路径**；行形态复刻 live）+ 懒加载历史窗口（`restoreLines` / `createLoadOlder`）+ 后台索引 + 崩溃提示 |
| `thincoder-cli/src/tui/agent-turn.mjs` | `runAgentTurn({ autoTurn, skipSession })` 回合驱动器：状态复位 / `runAgent` 循环（flushStream、AbortError 中断区分、ContinueError）/ finally 收尾（挂起决策、sweep、标题、落盘）/ 交接消息单条续发；`userNeededAtTurnEnd` 谓词（attention 置位——见 `docs/cli/design/TUI.md` §7.2） |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 挂起会话驱动器（`suspensionSession`）——状态机行表以 `docs/core/design/AGENT-LOOP.md` §9 为权威 |
| `thincoder-cli/src/tui/display-budget.mjs` | 显示层字符额度：常量单源 + `lineChars` + `syncLineBudget` 对账（§5） |
| `thincoder-cli/src/tui/tool-events.mjs` | 工具事件 → TUI 状态（回合期回调装配点——显示面契约见 `docs/cli/design/TUI-TOOL-OUTPUT.md`） |

**不在本档**：界面骨架（渲染 / 按键 / 折叠）→ `docs/cli/design/TUI.md`；命令与选择面 → `docs/cli/design/TUI-COMMANDS.md`。

## 2. 会话恢复（`startup.mjs`）

- **恢复唯一路径 = `history` 重建**（`historyToLines`）：user / assistant / tool 逐条渲染，行形态复刻 live
  （工具参数摘要 + 全量 JSON dim 行 + 结果全文、思考单条、`_kind` 标记同 live——同一判定代码）。
  **`display` 快照已废弃**（曾 WYSIWYG 原样恢复，与 VSC 写历史漂移出同步）——**不得再写回该路径**。
- **跨页回合态保持**：页首前一条是 assistant / tool 则页内不再发 `❯ ThinCoder:` 标签（一个回合只一个标签）。
- **多模态 user 消息**（图片注入后无文本）渲染无标签无内容（无内容标签是噪音）。
- **恢复渲染过滤 `[System reminder:` 前缀的机读消息**（人读线本就不含——过滤是纵深防御）；markdown 表格 / 行内渲染同样生效。
- 恢复后提示 `/new` 开新会话；多槽位提示 `/session`。

## 3. 懒加载与三层缓存

**懒加载契约**

- 恢复只加载最近 `INITIAL_HISTORY_MESSAGES`（200）条；向上滚动到会话顶部（`scroll >= convMaxScroll` 且 `_hasOlder`）
  → **自动加载更早一页**（`createLoadOlder`，`HISTORY_PAGE_MESSAGES`（20）——与 VSC 端页大小 parity）；
  滚轮 / PgUp 双入口同一判别式（`convMaxScroll` 单源导出复用）；加载后 scroll 补偿保持锚定；
  头部分页标记行 `… N more earlier messages …` 维护。
- **分页数据源下沉**：数据源 = 会话记录存储（磁盘为准）——绝对序号锚定；内存层不再驻留全量。
  机制契约 = `docs/core/design/SESSION.md`（§14.3.6 段）；**本节只落 TUI 面落点**（交互语义不变，逐条见 §5）。

**性能根治——三层缓存**

- ① **全量级 `convCacheKey`**（缓存键摘要，见 `docs/cli/design/TUI.md` §5）；
  ② **行级 `wrapRowsCached`**（键 = 行对象 + cols + 加工后 text + 颜色）；
  ③ **段级 `_lineSegCache`**（行对象 WeakMap → conv 行数组；签名 = `textRef` 引用比较 + 短字段拼接）——
  普通行在 `render-conversation.mjs`、tool / frozen 三段在 `render-segments.mjs` 各自独立 WeakMap。
- **动机**：`buildConvLines` 全量重建 O(总行数) 是卡顿真凶（真实 200 条历史 → 987 conv 行 94ms；loadOlder 后缓存失效 111ms）；
  三层缓存后 loadOlder 只算新增行，rebuild **111ms → 25.7ms（行缓存）→ 5-8ms 平坦**（段缓存，不随已加载历史增长）；
  toggle / 翻窗 / 流式 append 只失效该块段。行级 `_lineId` 在恢复 / 加载时统一分配（折叠键稳定——`docs/cli/design/TUI.md` §6.6）。

**工具参数可见性（恢复路径）**：参数全量落 dim 行（TUI 无悬停——全量必须落行；超长由连续 dim 折叠收纳）；
畸形 args JSON 降级为原始串 dim 行（截 120），不崩。

## 4. 回合驱动与会话

`runAgentTurn(ctx, text, { autoTurn = false, skipSession = false })`（外层 LOGGING turn 包装）：

1. `pushLabel "❯ You:"` + 输入文本（autoTurn 消化轮跳过——系统驱动回合无用户消息）。
2. 置 `processing`、清 `state.exitArmed`（跨回合残留会让停回合后的武装穿透成即时退出）、新建 `AbortController`
   （**回合链登记**——链头清旧链条残留句柄；重建的 controller 持续入链）、1s ticker（`state.processing || subRunning()` 驱动重绘）。
3. callbacks 构造（`tool-events.mjs` `buildToolCallbacks`）：`onToken` / `onReasoning` 流式进 streaming / reasoning 缓冲；
   `role#id/` 前缀分流到子 agent 活动区块；`onToolCall` / `onToolResult` 工具载体与 settle；`onUsage` 累计 token；
   `onCompress` 压缩提示；`onTaskUpdate` 任务行；`onTurnEnd` 增量落盘；**权限 / 批权限 / 问答 handler 按 ctx 提供与否条件接线**
   （手动档 auto-turn 传 null → denied 不弹面板、question 报错不挂起）。
4. `runAgent` 循环：正常完成 → `flushStream`；`AbortError` → **interrupt 区分**——`reason.interrupt && message`（Ctrl+I）= 重建 controller 续跑；
   `reason.interrupt` 无 message（Ctrl+C 首按）= break 不续跑 + 回滚无 message 注入产生的尾部垃圾 + `[stopped]` 行；
   `ContinueError` → 询问 "Continue after N turns?"（**autoTurn 消化轮例外：无面板——AUTO 档自动 resume、手动档静默拒绝**，
   部分消化留在历史不丢）；其他错误 → `[error] …` 一行。
5. **finally 收尾**：停 ticker、清 processing、**挂起决策**——回合正常结束且后台池仍 live → 子 agent 区块**不冻结**
   （各 settle 事件自行处理），本次回合 controller 记为会话中止句柄 + abort 集合快照（= 链条内全部 controller）；
   池空 / 中断 / 错误 → `freezeAllSubTasks`（中断态块标 interrupted）；挂起会话内回合由会话层逐条回收；
   **释放窗口守卫**（willSuspend 判定后、挂起会话启动前——期间 `processing = false` 且 `suspended` 未置位，
   无守卫会并发开第二个 `runAgentTurn`——双驱动器竞态）；`sweepToolBlocks`；`ensureSessionTitle`；
   distill flush 有界等待（超时上限——退出路径不挂死）→ `saveSession` 增量落盘。
6. **交接消息单条续发**：busy 提交吞 + 攒批删——`state.queue` 缩为**残项单容器**（释放窗口兜底池空转正 / 挂起中止残余——
   各至多一条——零丢失）；回合尾单条直发（slash 直接执行——保序）；释放窗口期入 `pendingInput` 的消息在池已空时转回队列。
7. **挂起会话**（`suspension-drive.mjs`——状态机行表以 `docs/core/design/AGENT-LOOP.md` §9 为权威，本档不复制）：
   队列清空后池仍 live 且非 skipSession 且未中止 → 进入挂起态——busy 提交吞；**挂起空闲输入开放**
   （Enter 走 `pendingInput` 单槽——键面契约见 `docs/cli/design/TUI-INPUT-BOX.md` §4）、settle 事件驱动 auto-turn 消化轮、
   状态行「后台 N 子代理运行中 · M 待消化」、池空 + 无待处理输入 → 补发 done 冻结自然退出；
   彻底中止后会话退出**复位中止标志**（防粘滞——不清则中止后池再 live 永不重新进入挂起态）并把残余输入单消息转回队列（不静默丢）。

## 5. 显示层内存有界（字符维额度）

> 动机：行数上限 ≠ 内容上限——`state.lines` 的十条写入路径中只有 `pushLine` 有行数环（5000 行）；
> 工具块 / 冻结子代理块 / 冻结评审行 / 恢复与翻页行全部绕过；无换行的巨 chunk 使行数环永远不触发。

### 5.1 常量（单源 = `thincoder-cli/src/tui/display-budget.mjs`）

| 常量 | 值（UTF-16 码元） | 作用面 |
|---|---|---|
| `LINE_MAX_CHARS` | 64_000 | `pushLine` / `pushLabel` / 恢复行 / 流式 flush 行——超限截断加尾标记 |
| `ARGS_JSON_MAX_CHARS` | 24_000 | 工具块 `argsJson` 总量（尾截断 + 标记；首行保真） |
| `TOOL_RESULT_MAX_CHARS` | 64_000 | 工具块 `result` 行数组总量（与既有 400 行双维） |
| `TOOL_OUTPUT_ENTRY_MAX_CHARS` | 8_000 | 输出环单条目（尾截断 + 标记） |
| `TOOL_OUTPUT_TOTAL_MAX_CHARS` | 128_000 | 输出环总量（与既有 200 条目环同款丢最旧） |
| `SUB_BLOCK_CHAR_LIMIT` | 128_000 | 子代理块单环（与 500 显示行双维；裁最旧——省略标记语义不变） |
| `ADVISOR_TEXT_MAX_CHARS` | 128_000 | 评审载体（头 32K + 尾 96K 保裁决尾部 + 中段标记） |
| `STREAM_MAX_CHARS` | 256_000 | `state.streaming` / `state.reasoning` 累积（头尾保真；flush 行再受 `LINE_MAX_CHARS`） |
| `LINES_CHAR_BUDGET` | 2_000_000 | `state.lines` 全部行与载体文本总量（超出：与 5000 行环同款裁头 + 冻结锚点平移 + 收据行） |
| `SEARCH_MATCH_CAP` | 10_000 | 搜索匹配计数（超出截断 + 提示行） |

**标记形态（逐字——进测试断言）**：行截断 `… [line truncated: N chars omitted]`；子块沿用 `…（已省略 N 行）`（口径不变）；
评审 / 流式 `… [middle truncated: N chars omitted]`。

### 5.2 辅助 API

```text
capText(text, { max, keepHead, keepTail, marker })   // 头尾保真 + 中段标记；≤ max 时零拷贝返回
appendCapped(prev, add, opts)                        // 流式累积（滞后水位：超 hard 裁至 keep——摊还 O(1)）
lineChars(l)                                         // 一行 + 其 _toolBlock / _frozenSubTask / _frozenAdvisor 字段计长
syncLineBudget(state, { pushLineLike })              // state.lines 总量对账（超限裁头——复用 5000 行环机制）
```

- 纯函数本体（`capText` / `appendCappedText`）住 `thincoder-core/text-budget.mjs`（零依赖）——与 agent 侧捕获共用（单一来源）；
  本模块只承载 TUI 面常量与 `lineChars` / `syncLineBudget` 对账。
- `state._linesChars`（TUI state 内部账）为唯一新增状态位；agent 状态对象零新增语义字段。

### 5.3 落点（逐路径）

| 路径 | 落点 |
|---|---|
| `pushLine` / `pushLabel` | 入口 `capText(LINE_MAX_CHARS)` + `syncLineBudget` |
| 工具块载体 | 建块 / 落结果处按 ARGS / RESULT / OUTPUT 常量裁 |
| 子代理块 | `pushBlock` / `dropCarrierLines` 加字符维（载体字符计数） |
| 评审块 | 累积与冻结两处 `appendCapped` / `capText` |
| 流式缓冲 | `onToken` / `onReasoning` `appendCapped` |
| 恢复 / 翻页 | 行构造后过 `capText`；总量的裁头由 `syncLineBudget` 兜（翻页页内不裁头——保锚定） |
| 搜索匹配 | 计数上限 + 提示行 |
| 冻结子代理 splice 插入 | 经总量对账（splice 路径同款） |
| 清屏行集清空 | 字符账同步归零 |

### 5.4 双维记账不变式

- 每个环 / 块：**行数维与字符维同时满足**（先到先裁）；被裁内容计入既有省略 N（行）——字符维裁剪时按被裁文本行数折算 N（无幽灵计数）。
- `state.lines` 总量 = Σ `lineChars(l)`——在 push / splice / unshift 后对账（增量维护：push 加分、裁头减分；测试直算对照）。
- **不碰行数口径**：5000 行环 / 500 行块环 / 200 条目环原样保留，字符维为**第二维**——既有 N5 / N6 语义与既有测试锁逐字不动。
- **不做**：显示层按需回读交互（截断全文在会话记录——回读面另案）；渲染期裁剪 / 虚拟滚动；不改折叠 / 展开 / 锚定语义；
  不改对话缓存结构（其随 `state.lines` 有界化自然有界）；VSC webview 面零改动。

## 6. 不并项与历史沿革

### 6.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/TUI.md`（1529 行）的 §7 / §8 / §15 面——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档 §15.1 问题陈述（十条绕过路径逐条 `file:line` 实测） | 勘察证据表 | 结论已落为 §5 契约；行号为时点证据 |
| 旧档 §15.2 选型对比（计量口径 / 执行点 / 超限处置三表） | 一次性选型材料 | 选定结论入 §5.4（口径 = UTF-16 码元 / 单点包装 + 载体自记账 / 截断 + 标记） |
| 旧档 §15.4 决策 D-TB1–D-TB6 | 批次编号决策表 | 结论已并入 §5.1–§5.4 |
| 旧档 §15.5 受影响文件表（含「实现后同步」补行） | as-of 行数与增量快照 | 时点快照（实装后已漂移） |
| 旧档 §15.6 用例表 · §15.7 验收标准 · §15.8 边界 | 批次验收材料 | 一次性——用例宿主 = `thincoder-cli/test/tui-memory-budget.test.mjs`；边界已入 §5.4 末条 |
| 旧档 §8 各步叙述中的批次注入括注（如「R15 攒批删」「D-C2」） | 批次编号 | 机制语义已入 §4；批次编号不入活档 |
| 旧档变更记录中本面相关行 | 逐批流水 | 历史叙述——本档自有变更记录 |

### 6.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 需求层条目 | F6（修订）/ N10 等 | 需求面——`docs/cli/requirements/TUI.md`（本档只留设计层） |
| 分页源下沉的机制契约 | 记录存储 / 序号锚定 / 描述符口径 | `docs/core/design/SESSION.md`（本节只落 TUI 面落点） |
| 挂起会话状态机 / settle 时序 / 池管理 | 编排语义 | `docs/core/design/AGENT-LOOP.md` §9（本档只留 TUI 侧驱动行为） |
| 回合内工具事件与显示 | 工具载体 / 新区块 / 参数可见性 | `docs/cli/design/TUI-TOOL-OUTPUT.md`（本档只留回调装配点） |
| attention 置位谓词 | `userNeededAtTurnEnd` 的语义与清位 | `docs/cli/design/TUI.md` §7.2（本档只标调用点） |
| 显示层额度的常量数值来源 | 常量本体 | `thincoder-cli/src/tui/display-budget.mjs`（单源——本档引用不复制数值之外的口径） |

## 7. 体量与拆分规划（R24a）

**实测行数**：本档 **186 行**（根层新建 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。
**拆分沿革**：本档自源档 `thincoder-cli/docs/design/TUI.md`（1529 行，超 500 硬门）按读者面拆出（见 `docs/cli/design/TUI.md` §9）。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 6 批**）：建档——`thincoder-cli/docs/design/TUI.md` 的 §7（会话恢复与懒加载）/ §8（回合驱动与挂起会话）/
  §15（长会话内存有界）三面内容重建入本档（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/cli/design/TUI-SESSION-VIEW.md`（P2 板块内的**读者面拆分档**——由 `docs/cli/design/TUI.md` §9 拆分沿革登记）；
  ② §15 的两块（分页源下沉 / 显示层额度）按归属分置：A 块只留 TUI 落点、机制挂 `docs/core/design/SESSION.md`；B 块全量承载（§5）；
  ③ 模块地图按**现文件结构**重建（行数列不并）；④ 坐标全量改**现状路径**并实核；⑤ 批次材料（选型 / 用例 / AC / 受影响文件 / 决策编号）入 §6.1。
