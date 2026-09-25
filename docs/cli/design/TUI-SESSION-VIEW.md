# TUI 会话视图与会话驱动 · CLI 面 · 设计

> 板块 = **TUI（终端界面）**（三档设计之一）——本档承载**会话视图**（启动恢复 / 历史懒加载 / 三层缓存）·
> **回合驱动**（`runAgentTurn` / 挂起会话驱动器）· **显示层内存有界**（字符维度额）。
> 配对需求档 = `docs/cli/requirements/TUI.md`（本板块三档设计共用一份需求档——层归属不对称，理由见该档 §1 注）。
> 同板块其余两档 = `docs/cli/design/TUI.md`（界面核心）· `docs/cli/design/TUI-COMMANDS.md`（命令层与选择面）。
> 对位档 = **无**（VSC webview 的历史窗口显示面独立——**已裁保留（A9 · 复核 = 2026-09-25 本批）**：结构性不对称 = 历史窗口显示面各随宿主渲染（VSC webview 分页容器 ∥ CLI 终端窗口）；证据 = 两端实现树；显式裁定 = CORE-UNIFICATION §2.5 端特有桶族（2026-09-13）+ 本批确认）。
> 建档：2026-09-15（**B 式迁移轮 · 第 6 批**——`thincoder-cli/docs/design/TUI.md` 的 §7 / §8 / §15 面重建入本档；
> 旧档原地一字不改、留作参照历史）。
> 本档坐标与行数 = **as-of 2026-09-16 实核**（仓根 = `thincoder/`）。

## 1. 定位与模块地图

> 本表是**结构性快照**——新增 / 改名 / 删除文件时同批回写。**行数列不并**（as-of 数值随实现漂移）。

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/startup.mjs` | 启动屏 + 会话恢复（`historyToLines` 从 history 重建——**display 快照已废弃，恢复唯一路径**；行形态复刻 live）+ 懒加载历史窗口（`restoreLines` / `createLoadOlder`）+ 后台索引 + 崩溃提示 |
| `thincoder-cli/src/tui/agent-turn.mjs` | `runAgentTurn({ autoTurn, skipSession })` 回合驱动器：状态复位 / `runAgent` 循环（flushStream、AbortError 中断区分、ContinueError）/ finally 收尾（挂起决策、sweep、标题、落盘）/ 交接消息单条续发；`userNeededAtTurnEnd` 谓词（attention 置位——见 `docs/cli/design/TUI.md` §7.2） |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 挂起会话驱动器（`suspensionSession`）——状态机行表以 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8 为权威 |
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
  机制契约 = `docs/core/design/SESSION.md`（§6.14 段）；**本节只落 TUI 面落点**（交互语义不变，逐条见 §5）。

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
   部分消化留在历史不丢）；其他错误 → `[error] <首行（URL 脱敏）>` + `→ Provider` / `→ Model` 诊断两行 + Retry 询问（同意 ⇒ `resume` 重入；形态与边界 = `docs/cli/design/TUI.md` §4.3——本档不复述）。
5. **finally 收尾**：停 ticker、清 processing、**挂起决策**——回合正常结束且后台池仍 live → 子 agent 区块**不冻结**
   （各 settle 事件自行处理），本次回合 controller 记为会话中止句柄 + abort 集合快照（= 链条内全部 controller）；
   池空 / 中断 / 错误 → `freezeAllSubTasks`（中断态块标 interrupted）；挂起会话内回合由会话层逐条回收；
   **释放窗口守卫**（willSuspend 判定后、挂起会话启动前——期间 `processing = false` 且 `suspended` 未置位，
   无守卫会并发开第二个 `runAgentTurn`——双驱动器竞态）；`sweepToolBlocks`；`ensureSessionTitle`；
   distill flush 有界等待（超时上限——退出路径不挂死）→ `saveSession` 增量落盘。
6. **交接消息按批合并续发**：busy 提交入队列（受理判据 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1——吞面收敛四）+ **合并消费**（R15 恢复：`planQueuedInput` 攒批——连续非 `/` 且 ≤8 条 ∧ 合并 ≤2000 字符 ⇒ 合并为一条、一次回合；超批截批先行；单条 > 2000 字符直发；`/cmd` 逐条保序）——
   `state.queue` 为**残项单容器**（释放窗口兜底池空转正 / 挂起中止残余——零丢失）；回合尾按批直发（**残项路径**——队列主消费 = **步边界 pickup**：机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8「步边界 pickup」）；
   释放窗口期入 `pendingInput` 的条目在池已空时按计划转回队列。
7. **挂起会话**（`suspension-drive.mjs`——状态机行表以 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8 为权威，本档不复制）：
   队列清空后池仍 live 且非 skipSession 且未中止 → 进入挂起态——**挂起内 busy 与普通 busy 同判据入队**（受理判据 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1）；
   **挂起空闲输入开放**（Enter 走 `pendingInput` 队列——键面契约见 `docs/cli/design/TUI-INPUT-BOX.md` §4）、settle 事件驱动 auto-turn 消化轮、
   状态行「后台 N 子代理运行中 · M 待消化」、池空 + 无待处理输入 → 补发 done 冻结自然退出；
   彻底中止后会话退出**复位中止标志**（防粘滞——不清则中止后池再 live 永不重新进入挂起态）并把残余输入**按合并计划**转回队列（不静默丢）。

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
| `LINES_CHAR_BUDGET` | 2_000_000 | `state.lines` 全部行与载体文本总量（超出：最小步进裁头 + 冻结锚点平移 + 收据行——保底见下行） |
| `LINES_TRIM_FLOOR` | 200 | 字符超额裁剪保底行数——裁剪不得使 `state.lines` 低于该值；触底仍未脱额即停（接受超额——上界 = 保底 × 单行上限） |
| `SEARCH_MATCH_CAP` | 10_000 | 搜索匹配计数（超出截断 + 提示行） |

**标记形态（逐字——进测试断言）**：行截断 `… [line truncated: N chars omitted]`；子块沿用 `…（已省略 N 行）`（口径不变）；
评审 / 流式 `… [middle truncated: N chars omitted]`。

### 5.2 辅助 API

```text
capText(text, { max, keepHead, keepTail, marker })   // 头尾保真 + 中段标记；≤ max 时零拷贝返回
appendCapped(prev, add, opts)                        // 流式累积（滞后水位：超 hard 裁至 keep——摊还 O(1)）
lineChars(l)                                         // 一行 + 其 _toolBlock / _frozenSubTask / _frozenAdvisor 字段计长
syncLineBudget(state, { pushLineLike, onTrim })      // state.lines 总量对账（超限裁头——最小步进 + 保底；onTrim 注入冻结锚点平移）
```

- 纯函数本体（`capText` / `appendCappedText`）住 `thincoder-core/text-budget.mjs`（零依赖）——与 agent 侧捕获共用（单一来源）；
  本模块只承载 TUI 面常量与 `lineChars` / `syncLineBudget` 对账。
- `state._linesChars`（TUI state 内部账）为唯一新增状态位；agent 状态对象零新增语义字段。
- **裁剪策略（2026-09-16 修订）**：超限按**最小步进**裁剪——只裁至额度内所需的最少行数（非固定 1000 行颗粒）；
  且不得使 `lines.length` 低于 `LINES_TRIM_FLOOR`——触底仍未脱额即停（接受超额，上界 = 保底 × 单行上限）。
  收据行文本与计数口径不变（`N` = 裁后 `lines.length`——插收据前）。

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
- **裁剪终态不变量**：单次对账后恒满足 `_linesChars ≤ LINES_CHAR_BUDGET` **或** `lines.length ≤ LINES_TRIM_FLOOR + 1`
  （第二支 = 保底态——行数下限成立时字符上界改由「保底 × 单行上限」兜）；「不清到近空」判据 = 裁剪后可见行数 ≥ `LINES_TRIM_FLOOR`。
- **不碰行数口径**：5000 行环 / 500 行块环 / 200 条目环原样保留，字符维为**第二维**——既有 N5 / N6 语义与既有测试锁逐字不动。
- **不做**：显示层按需回读交互（截断全文在会话记录——回读面另案）；渲染期裁剪 / 虚拟滚动；不改折叠 / 展开 / 锚定语义；
  不改对话缓存结构（其随 `state.lines` 有界化自然有界）；VSC webview 面零改动。

### 5.5 保底与视口语义（2026-09-16 修订）

- **保底修订**：旧裁剪颗粒（`take = min(1000, lines.length − 1)`）在行数 ≤1001 且字符超额时**一轮裁到 1 行**
  （收据「1 lines remaining」——用户实测 2026-09-16）；最小步进下常规内容稳态窗口 ≈ 额度/行宽 ≈ 1000 行，
  胖行场景下限 = `LINES_TRIM_FLOOR`（200 行——≥8 屏@24 行制）。
- **恢复 / 翻页记账**：恢复 / 切槽 / 清空路径全部经既有对账（直算重对账或逐行入账 + 重跑对账 / 同步归零）——
  「恢复路径绕过记账」不成立；**例外 = 翻页路径的占位行移除**（见下条限定——本批修复面）；「裁了又回来」的循环 = 每次恢复 / 翻页 materialize 后立即对账裁剪，旧颗粒下每次裁到近空。
- **记账口径（2026-09-16 批 8 修订）**：`state.lines` 的一切增删都必须过账——
  增 = 逐行 `accountLine`（`thincoder-cli/src/tui/display-budget.mjs:137`）/ 批算 `accountAll`（同档 `:146`）；
  **删 = 同额负向出账**（新增导出 `releaseLine(state, l)` = `state._linesChars -= lineChars(l)`，钳 0）——`:170` `loadOlder` 移除占位行即归此列。
  不变式 = `state._linesChars === Σ lineChars(l)`（`:147` 恢复路径的直算对账即该式）。
  **复用不可（实读）**：既有 `accountLine` 以行对象 `_budgetChars` 为基、幂等（`display-budget.mjs:137-143`）——行已从 `state.lines` 脱落后再调用，增量值恒 0 ⇒ 不产生负向出账，故本批需新增导出。
- **限定（2026-09-16 批 8 修订）**：`loadOlder` 占位行移除（`thincoder-cli/src/tui/startup.mjs:170`）此前**未出账** ⇒ 直算账对 Σ 有高估（数十码元 / 页）；`thincoder-cli/src/tui/display-budget.mjs:175` 的 `!Number.isFinite(_linesChars)` 守卫对该路径不触发（账仍有限）⇒ 不重算、漂移逐页累积。**本批修复**（选定选型 ① = `shift()` 处补同额出账；对比表紧随本节）。

**选型对比（2026-09-16 批 8）**：占位行移除的记账处置两候选——

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | `shift()` 处补同额出账 | 不变式 `_linesChars = Σ lineChars` 恒成立；与 `:147` 直算对账同口径；一行改动 | 需核对该行字符数（既有 `lineChars` 可复用） | **选定** |
| 2 | 占位行不单独入账 | 无需新增调用 | 占位行确在 `state.lines` 渲染面 ⇒ 该行**不计入**账即反向失真（账 < 实际），不变式破坏 | **否决** |
- **两层 scrollback**：TUI 全程 alt screen（`\x1b[?1049h`——`thincoder-cli/src/tui/tui-lifecycle.mjs` 启动序列）——终端自身
  scrollback 不承载会话（退出即弃）；滚轮 / 键面滚动全走内层 `state.lines` ⇒ **单层可见历史**。视口 = 内层自底偏移
  （增长补偿 + clamp，`thincoder-cli/src/tui/render-loop.mjs`）——不改、不加外层锚定 / 提示。

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
| 需求层条目 | F6（修订）/ N10–N11 等 | 需求面——`docs/cli/requirements/TUI.md`（本档只留设计层） |
| 分页源下沉的机制契约 | 记录存储 / 序号锚定 / 描述符口径 | `docs/core/design/SESSION.md`（本节只落 TUI 面落点） |
| 挂起会话状态机 / settle 时序 / 池管理 | 编排语义 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8（本档只留 TUI 侧驱动行为） |
| 回合内工具事件与显示 | 工具载体 / 新区块 / 参数可见性 | `docs/cli/design/TUI-TOOL-OUTPUT.md`（本档只留回调装配点） |
| attention 置位谓词 | `userNeededAtTurnEnd` 的语义与清位 | `docs/cli/design/TUI.md` §7.2（本档只标调用点） |
| 显示层额度的常量数值来源 | 常量本体 | `thincoder-cli/src/tui/display-budget.mjs`（单源——本档引用不复制数值之外的口径） |

## 变更记录

- 2026-09-25（**misc-four 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-25-misc-four.md` §2 · 台账 #185）：档头对位行裸读法收正——补 A9 三件（结构性不对称 / 证据 / 裁定）。**零新机制**。

- 2026-09-24（**queue-visible 批 · fix 轮（步边界 pickup）· eng-designer**——承 `docs/batches/2026-09-24-busy-queue-visible.md` §1.11）：§4 第 6 条收正——回合尾直发句限定为**残项路径**，队列主消费 = **步边界 pickup**（机制单源回指 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8）。**回合驱动其余步 / 恢复 / 分页 / 额度零变**。

- 2026-09-24（**queue-visible 批 · 需求裁定升级轮（多槽 + 合并消费）· eng-designer**——承 `docs/batches/2026-09-24-busy-queue-visible.md` §1.10）：§4 第 6 / 7 条改**多槽 + 合并消费**口径（交接消息按批合并续发 / 残余按计划转回队列；机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8）。**回合驱动其余步 / 恢复 / 分页 / 额度零变**。
- 2026-09-22（**hygiene-sweep 批 · 文档卫生轮 · eng-designer**——承 `docs/batches/2026-09-22-hygiene-sweep.md` §2 · 台账 #225）：规范面修订式标记清理——记账限定条去「原「存量漂移、本批零改」撤」对照语（留现行限定）。**语义零改**。


- 2026-09-22（**busy-extend 批 · 同族扩面轮 · eng-designer**——承 `docs/batches/2026-09-22-busy-extend.md` §1 裁定 · 父侧并入本批）：§4 两处旧口径收正——第 6 条「busy 提交吞」→ **入单槽**（受理判据 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1）；第 7 条「进入挂起态——busy 提交吞」→ **挂起内 busy 与普通 busy 同判据入槽**（键面契约回指同处）。机制条文零改。

- 2026-09-22（**busy-extend 批 · 设计评审轮 2 修正** · eng-designer——承 `docs/batches/2026-09-22-busy-extend.md` §3 轮次 2 发现 #3）：
  §1 模块地图行与 §6.2 不并项登记行的节号收正（`docs/core/design/AGENT-LOOP.md` §9 → **`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8**——挂起状态机 / settle 时序 / 池管理的现住档）。**条文语义零变**。

- 2026-09-20（**卫生族二批 · 台账 #141 · eng-designer**——承 `docs/batches/2026-09-20-hygiene-sweep-2-batch.md` §2.1）：§3 分页数据源下沉条机制契约指称收正——`docs/core/design/SESSION.md` 节号改指现核档 `§6.14`；零新语义。

- 2026-09-20（**显示面消差批 · 批 4 随轮收正 · eng-designer**——承 `docs/batches/2026-09-20-display-parity-batch.md` §2.3 X8）：§4 第 4 条「其他错误 → `[error] …` 一行」按实现面收正为三件形（脱敏首行 + 诊断两行 + Retry 询问），面细节挂 `docs/cli/design/TUI.md` §4.3（D2 不重述）。

- 2026-09-17（**zero-block 批 · 微 fix 轮 · eng-designer**）：变更记录 2026-09-15 条①内**悬空节号收正**——原引节号在 canonical 界面核心档无此节，收正为「§8 不并项与历史沿革」（拆分沿革登记现住 §8）；批档 `docs/batches/2026-09-17-subagent-zero-block.md` §2 出批发现 ⑥ 收口。

- 2026-09-16（**批 8 ENGINE-DEBT · 设计轮 · eng-designer**——承 `docs/batches/2026-09-16-engine-debt.md` §2 ED-3）：§5.5 修订——「`loadOlder` 占位行移除未入账」由**存量漂移（本批零改）**改判为**本批修复**；新增**记账口径**条（增删均须过账——不变式 `_linesChars === Σ lineChars`）+ **选型对比**表（补出账 vs 占位行不入账）；
  需求侧同批新增 `docs/cli/requirements/TUI.md` **N11**（显示层字符账账实一致；**N10 文本零改**）。

- 2026-09-16（**TUI-HISTORY-TRIM 批 · 设计轮**）：§5 裁剪策略修订——新增 `LINES_TRIM_FLOOR`（保底 200 行）+ **最小步进裁剪**
  （超限只裁至额度内所需最少行数；保底触底即停——接受超额）；新增 §5.5（保底与视口语义：恢复 / 翻页记账在册、单层可见历史）。
  动机 = 旧颗粒在行数 ≤1001 且超额时一轮裁到 1 行（用户实测收据「1 lines remaining」）。
- 2026-09-15（**B 式迁移轮 · 第 6 批**）：建档——`thincoder-cli/docs/design/TUI.md` 的 §7（会话恢复与懒加载）/ §8（回合驱动与挂起会话）/
  §15（长会话内存有界）三面内容重建入本档（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/cli/design/TUI-SESSION-VIEW.md`（P2 板块内的**读者面拆分档**——由 `docs/cli/design/TUI.md` §8 拆分沿革登记）；
  ② §15 的两块（分页源下沉 / 显示层额度）按归属分置：A 块只留 TUI 落点、机制挂 `docs/core/design/SESSION.md`；B 块全量承载（§5）；
  ③ 模块地图按**现文件结构**重建（行数列不并）；④ 坐标全量改**现状路径**并实核；⑤ 批次材料（选型 / 用例 / AC / 受影响文件 / 决策编号）入 §6.1。
