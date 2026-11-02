# TUI 会话视图与会话驱动 · CLI 面 · 设计

> 板块 = **TUI（终端界面）**（三档设计之一）——本档承载**会话视图**（启动恢复 / 历史懒加载 / 三层缓存）·
> **回合驱动**（`runAgentTurn` / 挂起会话驱动器）· **显示层内存有界**（字符维度额）。
> 配对需求档 = `docs/cli/requirements/TUI.md`（本板块三档设计共用一份需求档——层归属不对称，理由见该档 §1 注）。
> 同板块其余两档 = `docs/cli/design/TUI.md`（界面核心）· `docs/cli/design/TUI-COMMANDS.md`（命令层与选择面）。
> 对位档 = **无**（VSC webview 的历史窗口显示面独立——**已裁保留**：结构性不对称 = 历史窗口显示面各随宿主渲染（VSC webview 分页容器 ∥ CLI 终端窗口）；显式裁定 = CORE-UNIFICATION §2.5 端特有桶族）。

## 1. 定位与模块地图

> 本表是**结构性快照**——新增 / 改名 / 删除文件时同批回写。

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/startup.mjs` | 启动屏 + 会话恢复（`historyToLines` 从 history 重建——**恢复唯一路径**；行形态复刻 live）+ 懒加载历史窗口（`restoreLines` / `createLoadOlder`）+ 后台索引 + 崩溃提示 |
| `thincoder-cli/src/tui/agent-turn.mjs` | `runAgentTurn({ autoTurn, skipSession })` 回合驱动器：状态复位 / `runAgent` 循环（flushStream、AbortError 中断区分、ContinueError）/ finally 收尾（挂起决策、sweep、标题、落盘）/ 交接消息单条续发；`userNeededAtTurnEnd` 谓词（attention 置位——见 `docs/cli/design/TUI.md` §7.2） |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 挂起会话驱动器（`suspensionSession`）——状态机行表以 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8 为权威 |
| `thincoder-cli/src/tui/display-budget.mjs` | 显示层字符额度：常量单源 + `lineChars` + `syncLineBudget` 对账（§5） |
| `thincoder-cli/src/tui/tool-events.mjs` | 工具事件 → TUI 状态（回合期回调装配点——显示面契约见 `docs/cli/design/TUI-TOOL-OUTPUT.md`） |
| `thincoder-cli/src/tui/lifecycle-records.mjs` | 消化生命周期面记录承载件：记录形构建（`digest` 痕三型 ∥ `subagent` 快照）∥ 痕行文本 live ∥ 重建同调（单一实现）∥ rows 保尾 ∥ 终态行回扫——写点三处 + 恢复面同调（§6） |

**不在本档**：界面骨架（渲染 / 按键 / 折叠）→ `docs/cli/design/TUI.md`；命令与选择面 → `docs/cli/design/TUI-COMMANDS.md`。

## 2. 会话恢复（`startup.mjs`）

- **恢复唯一路径 = `history` 重建**（`historyToLines`）：user / assistant / tool 逐条渲染，行形态复刻 live
  （工具参数摘要 + 全量 JSON dim 行 + 结果全文、思考单条、`_kind` 标记同 live——同一判定代码）。
  **恢复径唯一**——`display` 快照路径**不得写回**。
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
- **分页数据源下沉**：数据源 = 会话记录存储（磁盘为准）——绝对序号锚定；内存层不驻留全量。
  机制契约 = `docs/core/design/SESSION.md`（§6.14 段）；**本节只落 TUI 面落点**（交互语义不变，逐条见 §5）。

**性能根治——三层缓存**

- ① **全量级 `convCacheKey`**（缓存键摘要，见 `docs/cli/design/TUI.md` §5）；
  ② **行级 `wrapRowsCached`**（键 = 行对象 + cols + 加工后 text + 颜色）；
  ③ **段级 `_lineSegCache`**（行对象 WeakMap → conv 行数组；签名 = `textRef` 引用比较 + 短字段拼接）——
  普通行在 `render-conversation.mjs`、tool / frozen 三段在 `render-segments.mjs` 各自独立 WeakMap。
- **动机**：`buildConvLines` 全量重建 O(总行数) 是卡顿真凶（真实 200 条历史 → 987 conv 行）；三层缓存后 loadOlder 只算新增行（段缓存不随已加载历史增长）；
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
   `reason.interrupt` 无 message（Ctrl+C 首按）= break 不续跑 + 回滚无 message 注入产生的尾部垃圾 + `[stopped]` 行。

   `ContinueError` → 询问 "Ran ${seg} turns — ${total} turns total. Continue?"，待答状态行 "Continue after ${seg} turns (${total} total)?"。其中 `seg` = 本段轮数、`total` = 链内累计（逐字模板单源 = `docs/core/design/TURN-CAP-CONTINUE.md` §6.3）。

   **autoTurn 消化轮例外：无面板**——AUTO 档自动 resume、手动档静默拒绝；部分消化留在历史不丢。

   其余错误 → `[error] <首行（URL 脱敏）>` + `→ Provider` / `→ Model` 诊断两行 + Retry 询问（同意 ⇒ `resume` 重入；形态与边界 = `docs/cli/design/TUI.md` §4.3——本档不复述）。
5. **finally 收尾**：停 ticker、清 processing、**挂起决策**——回合正常结束且后台池仍 live → 子 agent 区块**不冻结**
   （各 settle 事件自行处理），本次回合 controller 记为会话中止句柄 + abort 集合快照（= 链条内全部 controller）；
   池空 / 中断 / 错误 → `freezeAllSubTasks`（中断态块标 interrupted）；挂起会话内回合由会话层逐条回收；
   **释放窗口守卫**（willSuspend 判定后、挂起会话启动前——期间 `processing = false` 且 `suspended` 未置位，
   无守卫会并发开第二个 `runAgentTurn`——双驱动器竞态）；`sweepToolBlocks`。

   收尾另补两件：`ensureSessionTitle` 补会话标题；distill flush 有界等待（超时上限——退出路径不挂死）后 `saveSession` 增量落盘。
6. **交接消息按批合并续发**：busy 提交入队列（受理判据 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1——吞面收敛四）+ **合并消费**（`planQueuedInput` 攒批——连续非 `/` 且 ≤8 条 ∧ 合并 ≤2000 字符 ⇒ 合并为一条、一次回合；超批截批先行；单条 > 2000 字符直发；`/cmd` 逐条保序）——
   `state.queue` 为**残项单容器**（释放窗口兜底池空转正 / 挂起中止残余——零丢失）；回合尾按批直发（**残项路径**——队列主消费 = **步边界 pickup**：机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8「步边界 pickup」）；
   释放窗口期入 `pendingInput` 的条目在池已空时按计划转回队列。
7. **挂起会话**（`suspension-drive.mjs`——状态机行表以 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8 为权威，本档不复制）：
   队列清空后池仍 live 且非 skipSession 且未中止 → 进入挂起态——**挂起内 busy 与普通 busy 同判据入队**（受理判据 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1）。

   挂起态另开三面：空闲输入 Enter 走 `pendingInput` 队列（键面契约见 `docs/cli/design/TUI-INPUT-BOX.md` §4）；settle 事件驱动 auto-turn 消化轮；状态行显示「后台 N 子代理运行中 · M 待消化」，池空且无待处理输入时补发 done 冻结、自然退出。

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
- **裁剪策略**：超限按**最小步进**裁剪——只裁至额度内所需的最少行数（非固定 1000 行颗粒）；
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

### 5.5 保底与视口语义

- **保底**：最小步进下常规内容稳态窗口 ≈ 额度/行宽 ≈ 1000 行，
  胖行场景下限 = `LINES_TRIM_FLOOR`（200 行——≥8 屏@24 行制）。
- **恢复 / 翻页记账**：恢复 / 切槽 / 清空路径全部经既有对账（直算重对账或逐行入账 + 重跑对账 / 同步归零）——**例外 = 翻页路径的占位行移除**（见下条限定）；每次恢复 / 翻页 materialize 后立即对账裁剪。
- **记账口径**：`state.lines` 的一切增删都必须过账——
  增 = 逐行 `accountLine`（`thincoder-cli/src/tui/display-budget.mjs:137`）/ 批算 `accountAll`（同档 `:146`）；
  **删 = 同额负向出账**（新增导出 `releaseLine(state, l)` = `state._linesChars -= lineChars(l)`，钳 0）——`:170` `loadOlder` 移除占位行即归此列。
  不变式 = `state._linesChars === Σ lineChars(l)`（`:147` 恢复路径的直算对账即该式）。

  **复用不可**：既有 `accountLine` 以行对象 `_budgetChars` 为基、幂等（`display-budget.mjs:137-143`）——行已从 `state.lines` 脱落后再调用，增量值恒 0 ⇒ 不产生负向出账，故需新增导出。
- **限定**：`loadOlder` 占位行移除（`thincoder-cli/src/tui/startup.mjs:170`）不出账 ⇒ 直算账对 Σ 有高估（数十码元 / 页）；`thincoder-cli/src/tui/display-budget.mjs:175` 的 `!Number.isFinite(_linesChars)` 守卫对该路径不触发（账仍有限）⇒ 不重算、漂移逐页累积。**处置 = `shift()` 处补同额出账**（对比表紧随本节）。

**选型对比**：占位行移除的记账处置两候选——

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | `shift()` 处补同额出账 | 不变式 `_linesChars = Σ lineChars` 恒成立；与 `:147` 直算对账同口径；一行改动 | 需核对该行字符数（既有 `lineChars` 可复用） | **选定** |
| 2 | 占位行不单独入账 | 无需新增调用 | 占位行确在 `state.lines` 渲染面 ⇒ 该行**不计入**账即反向失真（账 < 实际），不变式破坏 | **否决** |
- **两层 scrollback**：TUI 全程 alt screen（`\x1b[?1049h`——`thincoder-cli/src/tui/tui-lifecycle.mjs` 启动序列）——终端自身
  scrollback 不承载会话（退出即弃）；滚轮 / 键面滚动全走内层 `state.lines` ⇒ **单层可见历史**。视口 = 内层自底偏移
  （增长补偿 + clamp，`thincoder-cli/src/tui/render-loop.mjs`）——不改、不加外层锚定 / 提示。

## 6. 消化生命周期面（痕 ∥ 冻结块）记录与恢复

> 机制（记录形 ∥ 写缝 ∥ 读缝 ∥ 重建义务 ∥ 容差）单源 = `docs/core/design/SESSION.md` §6.26；需求 = `docs/cli/requirements/TUI.md` **F18**（node = core §4.4 F-S7）。本档 = **CLI 侧承接细则**：写点 ∥ 恢复重建 ∥ 翻页 ∥ 容差。

- **写点（三处——进程内同点追加，核 `pushRecord(agent, record)` 单点）**：
  - 痕起跑 ∥ 收尾 = `thincoder-cli/src/tui/suspension-drive.mjs` `digestTurn`：起跑（两行同点）⇒ `{ kind:"digest", status:"start", n:pend0, tier:upstream?"ask":"digest", ...(ask ?? {}) }`；
    收尾⇒ `{ kind:"digest", status:"end", ok:outcome==="ok", ms }`（`ms` 与行文案 `seconds` **同值单算式**——`(ms/1000).toFixed(1)`）。
  - cap = `thincoder-cli/src/tui/agent-turn.mjs`（`cap-stop` 分支——行同点）⇒ `{ kind:"digest", status:"cap", mode:"stop", turns:error.turn }`（CLI 现无 auto 档产者——读取面按契约前向兼容）。
  - 归档快照 = `thincoder-cli/src/tui/subagent-freeze.mjs` `freezeSubTaskLines`（冻结载体行插入同点）⇒ `{ kind:"subagent", meta, rows }`。

    `meta` 记冻结时点块头事实：`key`（写面归一 = 规范形 `sub:<role>#<id>`）∥ `role` ∥ `model` ∥ `startedAt`（= `sub.started`）∥ `doneAt` ∥ `turn` ∥ `maxTurns` ∥ `status` ∥ `pool?` ∥ `queued?`。

    `status` 取值三态：`stopped` ⇒ `"stopped"`；`lastError` 在场 ⇒ `"error"`；其余 ⇒ `"done"`。`pool` 只对 `sub.async === true` 显式两写（非排队）；排队 ⇒ 写 `queued:true` 且不写 `pool`。字段文法单源 = `docs/core/design/SESSION.md` §6.26。

    `rows` = `sub.blocks` 行集（条目形 `{kind,text}` 同备）；`sub.dropped > 0` 时前置一条省略标记行（行数真值）。
  - 追加失败不阻断（核尽力面）；`state._agent` ∥ `ctx.agent` 缺席（headless / 子代理内）⇒ 零动作。
  - **承载件** = `thincoder-cli/src/tui/lifecycle-records.mjs`（记录形构建 ∥ 痕行文本（live ∥ 重建同调——单一实现零副本）∥ rows 保尾 ∥ 终态行回扫——三写点 + 恢复面同调）。
- **恢复重建**（`thincoder-cli/src/tui/startup.mjs` `historyToLines` 增记录分支——渲染面零改）：
  - **复列 = 全量**：多轮 `digest` 记录逐轮按其记录位次复列——**记录序 ≡ 恢复序**（零截点；未结轮照现——无 `end` 记录 ⇒ 起跑行 ∥ 计数行 ∥ cap 行照出；三端同判）。
  - `digest` 记录 ⇒ 痕行：`start` ⇒ 标签行（`tier==="ask"` 携 `from`/`msg` 取 `digest.turnLabelAsk` ∥ `digest.turnLabel`）+ `n>0` 计数行（`digest.start`）；`cap` ⇒ `digest.capStop`（`turns`）；`end` ⇒ 终态行（`ok!==false` ⇒ `digest.done`（`n` + `seconds`）∥ `digest.aborted`（`seconds`）——**文案与活流同算式**）。
  - **终态行 `n` 解析**：页内（含 ±1 页沿）有本轮 `start` ⇒ 直用；缺席（跨页分裂）⇒ **存储回扫**（`store.page` 向更早逐段回读，至命中本轮 `start` 止）⇒ **跨页零损（容差①于 CLI 不成立——绑定态；模式 F 未绑 ⇒ 不适用——模式 F = 未绑定，单源 = `docs/core/design/SESSION.md` §6.26）**。解析由调用面（`restoreLines` ∥ `createLoadOlder`——持有存储读口）预完成；`historyToLines` 仅增分支（形零改）。
  - `subagent` 记录 ⇒ 冻结载体行 `{ text:"subagent activity: <key>", color:C.dim, _frozenSubTask: 合成件 }`——合成件 = 由 `meta`/`rows` 构建（`key`（剥 `sub:` 前缀——显示 = 本地无前缀形；行文取值同源自合成件 `key`）
    ∥ `role ∥ model ∥ done:true ∥ doneAt ∥ blocks(=rows 行集) ∥ stopped ∥ errored ∥ _charCount(=行集字符和——账实一致 §5.4）` ∥ `async(= meta.pool === true)` ∥ `queued(= meta.queued === true)`），**渲染端零改**（`render-segments.mjs` 折叠头 + tail-3 原式消费——模式词 waiting/async/sync 三态照出）。

    **停面词判据**：合成件 `stopped` = 记录 `status` 停止面词集（词面判据单源 = `docs/core/design/SESSION.md` §6.26——本档不复述）。
    **错误面词判据**：合成件 `errored` = 记录 `status` 错误面词集（词面判据单源 = `docs/core/design/SESSION.md` §6.26——本档不复述）。
- 负控 = 记录缺 ⇒ 恢复面逐字等价；未绑（模式 F）⇒ 既有径零改（无 sidecar 存储侧——记录入人读线、落盘随既有保存链）。
- **行首子标（跨端恢复）**：记录条目的 `sub` 在本端以**行首文本前缀**呈现——TUI 是纯文本行（渲染两端逐字消费 `b.text`，无 span 面），子标在行首、以 `<sub> · ` 起头。
  - **合成点 = 读面** `synthSubTask`（`thincoder-cli/src/tui/lifecycle-records.mjs`）：条目带 `sub` ⇒ 行文 = 子标 + 分隔符 + 正文（即 `<sub> · <text>`）；不带 ⇒ 原样。渲染面零改——折叠尾 3 行（`thincoder-cli/src/tui/render-segments.mjs` `foldTailLines`）与展开体（同档 `renderBlockTimeline`）同点出形。
  - **空正文行 = 两端同判丢弃**：条目 `text` 为空 ⇒ 不产行，与 `sub` 在场与否无关（与 VSC 派生面 `rowsOf` 同一谓词）——该态在活流不可达（核 `thincoder-render-core/flow/block.mjs` `appendAdvisorChunk` 空串早返），同一份记录两端行数同判。
  - **写面不设该跳过**：CLI 写面 `rowsOf`（`thincoder-cli/src/tui/lifecycle-records.mjs`——`typeof b.text !== "string"` 之外不再过滤）不跳过空正文行——该态活流不可达，读面两端同判已足；加写面分支 = 给不可达输入修桥。写面写出一条两端都不显示的行不产生端差（两端都不显示），只留一条没人走的路径。
  - **三端同一件事**：同一 `sub` 字面（记录字段，不派生）· 同一位置（行首）· 同一分隔符（` · `，U+00B7 前后各一空格——即 VSC ∥ 桌面 `span.advisor-sub` 的同一串）⇒ 同一份记录在 VSC ∥ 桌面（DOM span）与 CLI（文本前缀）读出同一行全文 `explore#1 · read — src/x.mjs`；差别只在承载，不在内容。
  - **写面不变**：CLI 活流 `sub.blocks` 行不带 `sub`（逐行身份由块载体承载——顶层的在冻结头 `<key>`，嵌套子代各占自己载体）⇒ CLI 自产快照恒为无 `sub` 形。
  - **存量容读**：条目无 `sub` ⇒ 零前缀、`text` 原样（存量 VSC 快照字面烙在 `text` 内）⇒ 恢复后逐字不变；零迁移 ∥ 零版本标记。

  **用例（本档编号域 `T-S`；机判 = 本批单元用例件，与批档同名同址、收口删）**：

  | # | 场景 | 输入 | 期望 |
  |---|---|---|---|
  | T-S1 | 正常：新形记录 ⇒ 前缀在场 | `rows:[{kind:"tool", text:"read — src/x.mjs", sub:"explore#1"}]` | 合成件 `blocks[0].text` = `explore#1 · read — src/x.mjs`（**修前红**：前缀缺席） |
  | T-S2 | 边界：父自己的行（负控） | 同条去 `sub` | `blocks[0].text` 与记录 `text` 逐字等、零前缀 |
  | T-S3 | 边界：存量记录容读 | `rows:[{kind:"tool", text:"explore#1 · read — src/x.mjs"}]` | `blocks[0].text` 逐字不变（子标恰一份，不双份） |
  
- **翻页**：数据源零改（`store.page`——记录已在存储、随页自然可见）；「N more earlier messages」与「N messages」口径含记录（与桌面 KD-55 ⑤ 同口径容忍）。
- **容差（CLI 侧状态）**：① 跨页分裂 = **消**（上「`n` 解析」）；② 归档快照晚一拍 = **消**（产生面 = 进程内冻结点，先于回合落盘 ∥ 读径 = 存储直读——追加即达）；③ 复活径双记录（墓碑复活 ⇒ 同键两代冻结 ⇒ 重建面双块 ∥ 活流单块）——**在册**（低频异常修复径 ∥ 数据零损；重开条件 = 实测走查命中 ⇒ 另批）。
- **验收回指**：F18 判定句（重启 ∥ `/session` 重建含痕行族 + 冻结载体 ∥ 负控）；机检用例 ∥ 真机项 = 收口轮（含痕行族重建 ∥ 冻结载体 ∥ 负控）；跨端行首子标 = 上「行首子标」条用例表 T-S1–T-S3（机检 = 本批单元用例件）。
