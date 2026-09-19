# TUI 界面核心（渲染 / 按键 / 折叠）· CLI 面 · 设计

> 板块 = **TUI（终端界面）**——CLI 终端界面的**界面骨架**：输入层 → 状态 → 渲染 → 按键。
> 配对需求档 = `docs/cli/requirements/TUI.md`（本板块**三档设计共用一份需求档**——层归属不对称，理由见该档 §1 注）。
> 本档 = 三档之一：**界面核心**（本档）· `docs/cli/design/TUI-COMMANDS.md`（命令层与选择面）·
> `docs/cli/design/TUI-SESSION-VIEW.md`（会话视图 / 回合驱动 / 显示层内存）。
> 另有输入框契约档 `docs/cli/design/TUI-INPUT-BOX.md` 与工具输出档 `docs/cli/design/TUI-TOOL-OUTPUT.md`。
> 对位档 = `docs/vsc/design/WEBVIEW*.md`（VSC webview 族——**非同机制**：CLI 为裸 ANSI 终端渲染、VSC 为 webview DOM；差异如实登记，各端独立实现）。
> 建档：2026-09-15（**B 式迁移轮 · 第 6 批**——`thincoder-cli/docs/design/TUI.md`（1529 行）内容重建入基准层并**按读者面拆三档**；旧档原地一字不改、留作参照历史）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 设计原则与模块地图

**设计原则**：**纯函数可测**（渲染 / 布局抽成无副作用纯函数）；**分层**（stdin 解码 / 状态 / 渲染 / 交互 / 命令各自独立）；
**零依赖**（裸 ANSI 转义 + `node:` 标准库，不用 ink / React、不用 termbox）。

> **模块地图口径**：本表是**结构性快照**——新增 / 改名 / 删除文件时同批回写。**行数列不并**（as-of 数值随实现漂移；档位以实测为准）。

### 核心管线（stdin → 状态 → 渲染 → 回合）

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/index.mjs` | `startTUI` 入口：raw mode、keyStream + readline、分块解码、粘贴协议、Shift+Enter 翻译、resize、state 对象、`pushLine` / `pushLabel`、提交门禁、行缓冲裁剪；装配归位（`createMouseDispatch` / `createLoadOlder` / update-notice re-export）；`state._agent` ↔ `agent._tuiState` 双向挂载 |
| `thincoder-cli/src/tui/tui-lifecycle.mjs` | TUI 生命周期终端序列：`writeStartupSequence`（alt buffer + 光标 + 鼠标 / 粘贴 / 键盘增强 + **DECRST 7 禁环绕**）、`writeCleanupSequence`、`RECOVERY_SEQUENCE`（异常退出恢复序列单源——见 `docs/cli/design/CRASH-REPORTS.md` §5）、`createExitCleanup`、`setTuiActive` |
| `thincoder-cli/src/tui/update-notice.mjs` | 后台升级提示（`upgradeFailureText` / `pendingNoticeReady` 纯函数 + `createUpdateNotice` 装配） |
| `thincoder-cli/src/tui/key-handler.mjs` | 按键分发：模态入口（permission / question / search / picker / wizard / interruptPrompt）+ 输入编辑；**busy 门禁**；挂起空闲 Enter → pendingInput；Ctrl+C 分支；`convMaxScroll` 导出 |
| `thincoder-cli/src/tui/key-handler-search.mjs` | 搜索模式按键子处理（Ctrl+F 分支） |
| `thincoder-cli/src/tui/key-modes.mjs` | 按键模态层：permission / question / interruptPrompt 独占模态 handler（激活即消费全部按键） |
| `thincoder-cli/src/tui/render-frame.mjs` | 帧布局装配：header / conversation / subagent 面板 / todo / input / status 各面板；状态栏（含 attention 态——§7）；question 自由文本态光标例外 |
| `thincoder-cli/src/tui/render-conversation.mjs` | 对话面板行构建（纯函数）：三层缓存、搜索高亮、折叠装配、主输出前后空行、连续 dim 折叠；`convViewport` 视口数学单源导出 |
| `thincoder-cli/src/tui/render-segments.mjs` | 对话行三类特殊段渲染：tool 块 / frozenSubTask / frozenAdvisor（各带独立段缓存 WeakMap） |
| `thincoder-cli/src/tui/fold-block.mjs` | 公共折叠组件（§6）——`foldCapRows` / `isExpanded` / `toggleFoldBlock` / `renderFoldedHead` / `renderExpandedBlock` / `renderBlockTimeline` / `foldTailLines` / `scrollFoldBlock` |
| `thincoder-cli/src/tui/render.mjs` | 纯函数：字符宽度（CJK / emoji / 组合字符）、`wrap` / `slice`、markdown 表格对齐、`sanitize` |
| `thincoder-cli/src/tui/render-loop.mjs` | 渲染调度：整帧 recompute + 行 diff（只重绘变化行）+ 光标定位；`MIN_RENDER_INTERVAL_MS` 节流；每帧 write 包 `wrapOff` / `wrapOn` |
| `thincoder-cli/src/tui/layout.mjs` | 面板布局计算（行 / 列分配）；小终端压缩链；question 自由文本态 `boxLines = layoutAnswer` |
| `thincoder-cli/src/tui/dims.mjs` | 终端尺寸单源：`get()` 读缓存；`refresh()` 只在事件钩子（启动 seed / resize）；sane-gate（`cols >= 40` / `rows >= 10`）挡 falsy |

### 渲染内容层

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/markdown.mjs` | 轻量行内 markdown → ANSI（粗体 / 下划线 / 删除线 / 标题）；code-span 不透明 |
| `thincoder-cli/src/tui/math.mjs` | LaTeX → Unicode 近似（表驱动子集转换器——零依赖、纯函数） |
| `thincoder-cli/src/tui/tool-summaries.mjs` | 工具完成行摘要（`formatToolSummary`——按工具特化 + 首行兜底） |

### 输入与交互（基础设施）

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/mouse.mjs` | SGR 鼠标序列解析（滚轮 / 左键点击）；`handleWheel`（展开块内容行块内滚动 + 穿出语义）；点击命中（picker 选项 / 折叠块 toggle / 翻窗 / ⏹ 取消）；`createMouseDispatch` 装配簇 |
| `thincoder-cli/src/tui/clipboard.mjs` | 剪贴板文本 / 图像读写（Win powershell 强制 UTF-8 / macOS pbpaste / Linux xclip）+ `translateShiftEnter` + `insertPastedText` 目标路由 |
| `thincoder-cli/src/tui/ansi.mjs` | ANSI 色板 / 控制序列；键盘增强协议启停；`wrapOff` / `wrapOn`；attention 色对常量 |
| `thincoder-cli/src/tui/config-helpers.mjs` | `persistRaw`（写配置收口——mtime 门控 + 并发冲突 throw）/ `syncProviderField` / `maskKey` |
| `thincoder-cli/src/tui/display-budget.mjs` | 显示层字符额度常量与对账（单源）——机制面见 `docs/cli/design/TUI-SESSION-VIEW.md` §5 |

**不在本档的三面**（各挂指针，D2）：命令层与选择面 → `docs/cli/design/TUI-COMMANDS.md` §1；
会话恢复 / 回合驱动 / 显示层内存 → `docs/cli/design/TUI-SESSION-VIEW.md` §1；输入框键契约 → `docs/cli/design/TUI-INPUT-BOX.md`。

## 2. stdin 输入层（`index.mjs`）

- **keyStream 双流**：`emitKeypressEvents(keyStream)`（`node:readline`）把原始字节转 keypress 事件；
  `keyStream` 是 `process.stdin` 的 PassThrough 副本——**粘贴多块数据先写入 keyStream 再交给 readline 解析**，
  保证按键与粘贴按序到达。鼠标序列先在 data 层拦截剥离，碎片不落输入框。
- **分块解码**：`utf8Decoder.decode(chunk, { stream: true })`——CJK 字符跨 chunk 边界时正确拼装；
  鼠标序列可能跨 chunk 截断：`mousePending` 保存不完整尾部，下个 chunk 拼接。
- **鼠标滚轮**：SGR 序列（上 3 行 / 下 3 行），坐标命中展开块内容行 → 块内滚动（§6）；未命中 → 会话滚动
  （到顶触发 loadOlder，回底恢复 `_followTail`）。
- **鼠标点击**：左键按下 → picker 选项点击选中（跳过标题行，按 `_row` 映射 filteredItems）；
  对话区 / 面板点击带 `_foldToggle` 的行折叠 / 展开切换、控制行翻窗、子 agent 面板头 ⏹ 标记列点击 = cancel。
  **消息行点击无动作**（行菜单已移除——终端拖选复制是原生能力）。坐标 1-based、col 在前；release / 滚轮不消费。
- **粘贴协议（bracketed paste）**：`\x1b[200~` 进入 pasteMode、`\x1b[201~` 退出；跨多 chunk 的粘贴先写前缀 + 累积，
  退出时一次性写入。粘贴文本**跳过按键分发**直接进输入缓冲（`insertPastedText`）。
- **Shift+Enter**：stdin 层 `translateShiftEnter` 把 CSI-u 的 Shift+Enter 序列翻译为 `\x1b\r` → key-handler 插入 `\n`
  （多行键三层方案见 `docs/cli/design/TUI-INPUT-BOX.md` §5）。
- **state 对象**（渲染全部数据源）：`lines` / `streaming` / `reasoning` / `_advisorBlocks` / `input`（codepoint 数组）/
  `cursor` / `history` / `scroll` / `_foldScroll` / `_followTail` / `processing` / `controller` / `permission` / `question` /
  `picker` + `pickerStack` / `wizard` / `tasks` / `dims` / `tokens` / `ctxCache` / `search` / `expandedBlocks` / `foldEnabled` /
  `exitArmed` / `suspAbortArmed` / `_lineIdCounter` / `subTasks` / `queue` / `interruptPrompt` / `pendingNotice` /
  `pendingInput` / `attentionAwaiting`（§7）/ `_history*` 等。
- **cleanup（退出路径统一）**：`saveSession` 同步写盘 → 关 MCP → 终端复位（alt buffer 退出、mouse / paste / keyboard /
  modifyOtherKeys off、wrapOn、主缓冲区、显示光标）。`process.on("exit", cleanup)` 注册一次；
  `/exit` 与 Ctrl+C 双确认最终都走 `process.exit`（`exitTimer` 延迟可注入防真退出）。
- **行缓冲裁剪**：`lines` 超 5000 时裁掉头部 1000 行并插入裁剪标记行（freeze 锚点整体前移——净位移校正，防冻结落点漂移）。
  字符维额度见 `docs/cli/design/TUI-SESSION-VIEW.md` §5。

## 3. 行语法与逐行对齐（`_kind` 单一事实源）

- **行语法单一事实源**：对话行有三个生产者——live（`tool-events.mjs` `flushStream`）、恢复（`startup.mjs` `historyToLines`）、
  注入（session / 命令 `pushLine`）——**全部产出带 `_kind` 类型标记的行**：`"thinking"`（思考）/ `"text"`（主文本）/
  `"tool"`（工具载体）/ 无标记 = 用户消息与标签行。`buildConvLines` 读标记判定折叠行为，不再从颜色猜
  （颜色降级为纯视觉属性；旧无标记行的颜色启发式仅作兼容兜底）。
  这是「恢复体验 = 执行体验」的结构保证。**新增生产者必须打 `_kind` 标记**。
- **逐行对齐契约**：同一回合在 live 与 restore 两种管道下渲染**逐行一致**（白名单：done 行 `❯ name — done (耗时)` 为 live 独有——
  历史不存耗时，恢复管道无此行，其完成态状态词回落 `"done"`）。为此统一的点：
  ① 工具标题行两态同格式 `❯ name <参数摘要>`（`describeToolArgs` 单源）；
  ② live `onToolCall` 落参数全量 JSON dim 行（= restore `toolArgsLines`）；
  ③ live `onToolResult` 落结果正文 dim 行（= restore 全文；`slimToolResultForDisplay` 两管道共享）；
  ④ live 不再有孤立的行数摘要行。
- **回归 guard**：工具载体的计时与中断清扫覆盖全部工具载体来源（`docs/cli/design/TUI-TOOL-OUTPUT.md` §5）。

## 4. 按键分发与中断

**状态优先级**（从高到低，每个状态独占处理并 `return`）：

```text
permission（y/n/a/esc；batch a/o/n；continue y/n）
→ question（选项 ↑↓ / enter / esc，自由文本——key-modes）
→ search 模式（Ctrl+F 进入：Ctrl+N/P/G/R 导航、esc 退出、字符输入过滤）
→ interruptPrompt（Ctrl+I 后输入注入消息——创建 / 模态分支先于 picker）
→ picker 栈 / wizard（↑↓ 选择、enter 确认、esc 取消）
→ 正常输入编辑（字符 / 退格 / Ctrl+U / Ctrl+V / ↑↓ 竖移·历史 / 多行）
```

- **模态分支**（`key-modes.mjs`）：permission / question / interruptPrompt 激活时**消费全部按键**（含未匹配键——不落入下层编辑路径）；
  搜索模态另居 `key-handler-search.mjs`。
- **busy 门禁**（`processing` 含 digest 单一判据）：**输入不禁**——打字照常进输入框回显（吞提交不吞字符）；
  **Enter 提交吞 + busy 提示**；**斜杠命令同禁发**（白名单机制已删——`/exit` 也发不出，退出靠 Ctrl+C 终端层武装通道）；
  空 Enter 静默（text 非空才吞）。
- **挂起空闲**（`docs/core/design/AGENT-LOOP.md` §9——busy 之外）：Enter（非 slash）→ `pendingInput` **单槽**
  （至多一条待交接——槽满吞 + 提示）+ 唤醒（`_suspWake`，不打断后台）；释放窗口期间同语义。
- **输入编辑键表与 ↑↓ 三规则** = `docs/cli/design/TUI-INPUT-BOX.md` §2 / §3（本档不重述——D2）。

### 4.1 Ctrl+C 分支（三态武装一致）

1. **picker 打开 → 取消当前 picker**（等同 Esc），不杀进程。
2. **武装窗口内二按**（状态路由前统一检查 `suspAbortArmed`——跨态桥接）→ **显式全停**：
   当前回合平 abort（无 interrupt——走回合收尾清池分支）+ abort 集合 = 链条内全部 controller（`agent._sessionAbortAll`）
   + **挂起态才置 `_suspAborted`** + 唤醒 driver（收尾清池）；**非挂起语境不置**（粘滞会阻塞未来挂起会话重入）。
   无目标可停（无 processing / 无 abort 集合 / 未挂起）→ 不吞键、落空放行到下方分支。
3. **挂起态**（`state.suspended`）→ 武装窗口两级中止：
   - 未武装 + 有回合在跑（digest / 会话内回合）：仅中止当前回合（`abort({ interrupt: true })` 无 message——
     interrupt 排除清池分支）——后台池保留，回挂起等待；
   - 未武装 + 纯挂起等待：仅提示不清池（提示含运行中数量）；
   - 武装 3s 窗口内再按 → 统一全停。
   提示：`[stopped current turn — press Ctrl+C again within 3s to abort all background subagents]` /
   `[abort] Press Ctrl+C again within 3s to abort all background subagents (N running)`。
4. **processing（非挂起）→ 武装窗口两级中止**：首按 = `abort({ interrupt: true })`（无 message——停当前回合不续跑）+ 提示
   + 武装 3s（`suspAbortArmed` + `suspArmTimer`，`ctx.exitArmDelay ?? 3000` 过期自动复位）；窗口内再按 → 统一全停。
   （无条件平 abort 会命中清池分支误杀全部后台子代理——已实测修正。）
5. **空闲态 → 双确认**：第一次只提示 `[exit] Press Ctrl+C again within 3s to exit` 并置 `exitArmed`
   （超时自动解除，可注入；回合启动即清除 `exitArmed` 防跨回合残留）；窗口内再按才走 cleanup + 延迟退出。

### 4.2 Ctrl+I 中断注入

- processing 时进入 `interruptPrompt` 状态；输入消息 Enter 提交 → `controller.abort({ interrupt: true, message })`
  → agent 循环把中断消息注入历史后**重开 controller 续跑**。
- **interrupt 区分**：**有 message**（Ctrl+I）= 重建 controller 续跑；**无 message**（Ctrl+C 首按停回合）= 不续跑 break
  ——回合层回滚无 message 注入产生的尾部垃圾（`agent` 侧零改动；partial 输出**不**回滚——interrupt 家族「提交部分输出」语义）。
- 注入框的键集 / 光标 / 提示 = `docs/cli/design/TUI-INPUT-BOX.md` §8。

## 5. 渲染管线（帧装配 / 布局 / 对话行构建）

**帧装配（`render-frame.mjs`）**

```text
header（logo / 版本 / 模型 / think 徽章 / cwd）
对话面板（renderConversation）
子 agent 面板（运行中 / 排队 waiting 区块，会话与 todo 之间）
todo 面板（task 列表，≤5 行，全部 done 自动收起）
输入框（layoutInput：多行展开、光标定位、粘贴快捷键提示角标）
状态栏（模式 / 耗时 / token / 上下文利用率 / busy 提示 / 快捷键提示；attention 态见 §7）
```

- **布局分配**（`layout.mjs` `computeLayout`）：面板高度随内容伸缩；**运行中子 agent 活动为固定底部面板**——
  位于会话区与 todo 之间，高度完全自适应（= 全部运行中区块的渲染行数，会话区被挤小），不随会话滚动；
  完成后立即冻结进会话流（`_frozenSubTask` 折叠块）；无驻留区块时面板不渲染（无悬空分隔线）。
- **小终端压缩链**：subagent 面板最先让位（可至 0 隐藏——数据保留在缓冲区）→ conversation → picker → permission →
  todo 分隔线（任务行永不压缩）。
- **对话行构建管道**（`render-conversation.mjs` `buildConvLines`，纯函数）：

```text
原始 text → highlightSearchMatches（搜索命中：当前项反白、其余黄下划线）
→ sanitizeDisplay（剥 ANSI / 控制字符，防网格污染）
→ renderMathInline + renderMathBlock + markdown（先 math 后 markdown——math 把 $…$ 视为不透明段）
→ formatTables（markdown 表格按显示宽度重排，CJK 对齐）
→ wrapText（按 stringWidth 换行，宽度 = cols − 1）
→ 折叠（判定与装配见 §6）
```

- **特殊段**（行对象载体分支互斥）：`_frozenSubTask` → frozenSubSeg、`_toolBlock` → toolSeg、
  `_frozenAdvisor` → frozenAdvSeg（`render-segments.mjs`）。工具块的完整语义以 `docs/cli/design/TUI-TOOL-OUTPUT.md` 为权威。

**关键约束**

- **markdown / math ANSI 在 wrap 之前插入**——插入的转义序列零显示宽度（`stringWidth` 剥离 ANSI），不参与宽度计算、不破坏对齐；
  渲染先于 wrap 保证跨 wrap 边界的公式 / 标记完整转换。窄作用域复位（`22`/`24`/`29` 而非 `0`）保证不冲掉行底色。
- **宽度补偿**：标记（`` ` `` / `**` / `~~`）渲染后消失，含标记的表格行会比 `formatTables` 计算的列宽短——
  `renderMarkdownPreservingWidth` 在行尾补空格恢复原宽（竖线对齐）。math 先于 `formatTables` 执行 → 表格列宽按转换后文本测量，无需补偿。
- **缓存**：`convCacheKey`（lines 长度 / 末行长度 / streaming / reasoning 长度 + `_advisorBlocks` 摘要 + frozen 载体签名 +
  工具块缓冲签名 + **colorSig** + foldEnabled / expandedBlocks 摘要 + cap 分量 + search 状态 + `_foldScroll` 分量）命中则跳过重建；
  运行中区块居固定面板——子 agent 活动不再失效会话缓存。
- **Ambiguous 宽度低估 + DECAWM 防线**：`—`（U+2014）· `│`（U+2502）· `●`（U+25CF）· `▸`（U+25B8）· `…`（U+2026）·
  `↑↓`（U+2191/2193）属东亚 Ambiguous 宽度——`charWidth` 按 1 格算，但中文 locale 终端实际渲染 2 格 → 行宽低估 → 物理 wrap + 清错行。
  **三层防御**：① 启动禁环绕（`writeStartupSequence` 的 DECRST 7）+ 每帧 write 包 `wrapOff` / `wrapOn`——超宽行硬截断在边距；
  退出 `writeCleanupSequence` 恢复 DECSET 7。② picker 行与标题行右边距留 8 格余量。③ 标签截断改按显示宽度（原按 UTF-16 length 截）。
- **渲染调度**（`render-loop.mjs`）：`scheduleRender()`（setImmediate 合并 + 16ms 节流）+ 整帧 recompute 后行 diff
  （`rows[i] !== prevRows[i]` 只重绘变化行 + 光标定位），防闪烁。1s ticker 在回合驱动器（`docs/cli/design/TUI-SESSION-VIEW.md` §4）。
- **宽度数学**（`render.mjs`）：`charWidth`——CJK / emoji / 全角 2 列、组合字符 / 零宽 0、其余 1；`wrap` / `slice` / `pad` 全按显示宽度。

## 6. 折叠与区块交互

### 6.1 公共折叠组件（`fold-block.mjs`）

- **组件化**：折叠交互统一收敛到公共组件——任何「流式 / 超长输出要可折叠」的功能直接复用，不再复制渲染逻辑。
  API：`foldCapRows`（60% 封顶数学）/ `isExpanded` / `toggleFoldBlock`（收起时同步清 `_foldScroll` 残留）/
  `renderFoldedHead` / `renderExpandedBlock` / `renderBlockTimeline` / `foldTailLines`（tail-3 提取单源）/
  `scrollFoldBlock` / `blankLine` / `foldHintLine`。
- **接入面**：子 agent 区块（运行中固定面板 / 冻结流内）、advisor 块、工具块、长消息、连续 dim；鼠标点击 toggle 也走单源 `toggleFoldBlock`。
- **接入约定**：凡「超长输出想可折叠」用本组件拼装——封顶、可达性与统一形态只在组件里有。

### 6.2 统一折叠形态

**「所有折叠区块 = 默认三行 tail，展开封顶 60%」**：折叠态单源为
`renderFoldedHead` —— `▶ <身份标签> · N lines — click to expand` + 末 3 行（dim，去 gutter 后按 cols 截断）。
身份标签按内容分类：`thinking`（思考块）/ `tool output`（dim 行与连续 dim 块）/ `message`（其余可折叠长行兜底）；
子 agent、advisor 用各自既有的括号身份头。**折叠 / 收起标志始终在块头部同一位置**；控制行 = bold cyan `▶` / `▼`
+ 短语中 `click to expand/collapse` 下划线——**点击任意带 `_foldToggle` 的行即双向切换**。

### 6.3 展开封顶与窗口（含块内滚动）

- 展开态经 `renderExpandedBlock` 统一渲染，**区块总高 ≤ `floor(rows × 0.6)`**（`foldCapRows`；rows 未知 → 不封顶）；
  高度封顶保留，内容不一次性截断——超封顶正文渲染为**窗口**（`state._foldScroll` 记每块窗口起点；
  窗口可读行 = `cap − 5`，预留 blank + 顶部控制 + ▲ + ▼ + 底部收起开销）。
- 窗口上下渲染 **`▲ 上方还有 N 行（点击向上翻窗）`** / **`▼ 下方还有 N 行（点击向下翻窗）`** 控制行；点击翻窗 = 一整窗；
  越界 offset 渲染时 clamp 并写回（防滚轮 / 翻窗误判「未到边界」卡死）。
- **滚动读全文、60% 高度内、底部 ▼ 收起控制行永远在块尾**——触封顶时区块底部追加第二个控制行（唯一保证可达的收起入口）；
  整块 ≤ `cap − 5` 行时全量显示、无底部控制行。
- `convCacheKey` 含 `_foldScroll` 分量（翻窗必须重渲染）；`maxRows` 由调用链贯穿；`foldEnabled = false`（/fold off）时
  控制行与窗口一并消失（原样正文直出）。

### 6.4 滚轮块内滚动 + 穿出语义

- 滚轮事件带坐标 → `handleWheel` 命中展开块**内容行**（窗口行带 `_foldBlock` / `_foldWindow` / `_foldTotal` 标记——
  每行自描述所属块，无区间簿记）→ **块内 offset ±3 行**（与会话滚动节拍一致）；未命中块 → 走会话滚动。
- **穿出**：块顶滚上 / 块底滚下 → 返回 false 交还会话滚动（否则滚轮永远被块吃掉、会话顶懒加载不可达）；
  ▲ / ▼ 控制行点击翻窗保留为快速跳转。子 agent 面板行默认穿出滚会话；命中面板内展开块内容行才块内滚动。
- **视口数学单源 `convViewport(convLen, convH, scroll)`**（渲染 + 鼠标命中共用）。

### 6.5 流式跟随尾部

- `state._followTail` 默认 true——渲染前 `state.scroll = 0`（最新内容钉在视口底，tool 行 / pushLine 同样生效）；
  用户上滚（PgUp / 滚轮上）→ 暂停跟随；暂停期间**锚定补偿**（渲染帧按 convLen 增量补偿 scroll，视口顶保持绝对行——
  loadOlder 加载后同样补偿）；PgDn / 滚轮滚回底部或新提交消息 → 恢复跟随。
- **↑ / ↓ 键是输入框内语义，不执行会话滚动**——滚动入口 = PgUp / PgDn 与滚轮。

### 6.6 折叠对象与折叠决策

折叠对象（要求 `foldEnabled !== false` 且 key 不在 `expandedBlocks`）：

1. **长消息折叠**：思考（`C.reason`）**无条件折叠**（行数 / 字符阈值思路整体废弃——思考是过程内容，一律收进命名头）；
   工具摘要等 dim / 工具行 > 12 行折叠（`LONG_FOLD_LINES`）；key = `long-{_lineId ?? i}`。
2. **连续 dim 块折叠**：连续 dim 行 > 8（`FOLD_LINES`）→ 统一形态；key = `fold-{首行 _lineId ?? i}`（连续 dim 块首行即稳定锚）；
   块内含展开块行（`_skipDimFold` 标记）时不折叠（防套叠）。

- **主输出永不折叠**：`foldable = l.color !== C.text`（含用户消息）直接全量渲染——折叠会把真正的回答藏在点击之后；
  思考 / 工具摘要才是辅助流。判定以 `_kind` 为主（`thinking` / `tool` 显式标记即折叠），颜色仅对旧无标记行兜底。
- **折叠无例外**：思考块在 `flushStream` 完成**瞬间即折叠**（命名头 + tail 3）——与恢复路径完全同构；
  「完成瞬间保持展开、下一轮输入收起」的旧设计（`_autoExpand` 簿记）**连根删除**，不得以任何形式写回。
- **流式过程同框**：思考的 live 流式缓冲（`state.reasoning`）渲染为**同一只折叠框**（key = `thinking-live`）：
  默认 `▶ thinking · N lines` + tail 3，点击展开 = 60% 封顶的实时视图；flush 后块重挂到 `long-{idx}`，形态完全一致。
  live / 完成 / 恢复三态同构。
- **折叠 key 稳定化**：`_lineId`（state 自增计数器——live 工具载体 / 恢复 / 懒加载统一分配）派生，位置索引只作 `??` 回退：
  `tool-${_lineId}` / `long-${_lineId ?? i}` / `fold-{首行 _lineId ?? i}` / `advisor-done-${_lineId ?? i}`——
  loadOlder 头部 unshift 后展开态与 `_foldScroll` offset 不串位。子代理块键 `sub-${key}` 天然身份化（key = `role#id`）。
- **组件解耦**：`fold-block` 不 import 任何业务常量（advisor 占位符经 `strip: []` 参数注入）。
- **组件 `cols` 纪律（教训级）**：`renderExpandedBlock` / `renderFoldedHead` / `renderBlockTimeline` 的 `cols` 是**必传语义参数**
  （签名默认 80 只是测试兜底）——**漏传 = 全部生成行按 80 列 wrap，输入框却是全宽**（同帧宽度分裂）。
  任何新增组件调用**必须显式传 `cols`**；排障口诀：**同帧内 A 面板正常 B 面板异常 → 先查 A/B 的输入参数差异**。

### 6.7 空行分区与分隔线

- **主输出前后空行**：每个主输出段（`C.text` 行连续段）**前后各插一个空行**，与思考块 / 工具块 / 子 agent 块拉开距离。
  渲染期插入（不写 `state.lines`、不影响 `convCacheKey`）；相邻段共享一个空行；**streaming 分支同样适用**（两条渲染路径必须一致）。
- **任务面板顶部分隔线**与**子 agent 固定面板顶部边界线**：dim `─` 线；后者**仅当存在驻留区块时渲染**（无驻留区块 → 无面板、无悬空线）。
- **折叠控制行的空行规则**：控制行不缩进、与输出内容平齐；**空行分隔仅展开态使用**；折叠态 ▶ 头**不空行**。
  展开态每行加 `│ ` gutter 左框线（组件拥有 gutter：统一加、行宽硬切 `cols − 2`）。

### 6.8 子 agent 活动区块

区块数据层在 `subagent-blocks.mjs` / `subagent-children.mjs` / `subagent-freeze.mjs` / `subagent-panel.mjs`；
编排语义（settle 时序、async 生命周期、排队规则）以 `docs/core/design/AGENT-LOOP.md` 为权威。**显示层契约**：

- **运行中 = 固定底部面板**（`subagent-panel.mjs`，会话与 todo 之间）；**冻结 = 流内折叠块**（`render-segments.mjs` `frozenSubSeg`）。
  折叠键 `sub-${key}` 跨运行 / 冻结边界共用（折叠态无缝衔接）。
- **折叠头形态**（显式头标）：`[▶ eng-coder#2 · async · glm-5.3 · 45s · turn 12/100] bash — npm test`
  ——`[▶/⏸/✓ key · <mode/status 词> · model · elapsed · turn] state`；⏸ = 等待审批；✓ = 已完成。
  **sync / async 显式词**（真实 subagent 角色与 advisor 伪角色才标；async 由 spawn 实际启动时发的 `⟦ev⟧async` 标记置位，
  缺失 key 时缓冲 `_pendingAsyncKeys`）；**旧区块（无 async 字段）回退标 sync**。model 名先按显示宽度截断（≤ cols/3）——
  整行 ≤ cols 铁律。
- **⏹ 停止标记（门控）**：**仅 running ∪ queued/waiting 且属子代理角色族**的区块；
  sync 侧由 `state._agent._syncChildAborts` live 判据置位（注册即出现、注销即消失——钉与可中止一一对应；
  headless / 测试无 `_agent` → sync 不钉——零回归）；dim，钉在折叠头右缘**内收一列**；
  命中区 = `col >= _stopCol`，点击 = 定向 cancel（不经模型回合、不触发折叠翻转）；左邻 padding 与无 ⏹ 块右缘点击 = 折叠切换。
- **waiting / queued 块**：排队 spawn 返回即建面板块（不等子代理首 token）；状态词 = `waiting`（依赖未满足 / 域冲突——
  原因恒标；依赖取消 / 失败滞留恒标 `dependency cancelled`）或 `queued`（槽满等位——`queued · position N`）；
  **不标 sync / async**（未启动——标 sync 会误导）；**queued / waiting 块头即置取消 ⏹**；
   启动 → 清 waiting 标转正常 running 头（同 key 不重建）；取消 / 出队 → 移除块（不冻结）。**`⟦ev⟧cancelled` 发射源（按族 × 落点逐条列名）**：
   - **子代理族**：`executeCancelAction` 工具路径与 mouse ⏹ 直连路径（`thincoder-core/agent-tools/subagent-async.mjs` · `thincoder-cli/src/tui/mouse.mjs`）——两路互斥（同一事件只有其中一路在链上），通道分别是 `ctx.callbacks.onToken` 与 `routeSubToken` 就地路由。
   - **评审族**：核 `cancelAsyncAdvisor` queued 分支 = **唯一发射点**（2026-09-18 设计评审轮 1 #1 裁定单源化；工具路径 / mouse ⏹ / VSC ⏹ 三路各传本层通道、均不另发）——
     此前缺发射源，评审排队块孤悬不移除（2026-09-17 af 批补；机制细节见 `AGENT-LOOP-SUBAGENT.md` §6.11 第 3 条）。
   **已移除块不复建（2026-09-17 af 批 c2——裁定落条文）**：`⟦ev⟧cancelled` 移除分支**同址落键级墓碑**——经**新增 helper** `tombstoneSubKey(state, key)`（定义于 `subagent-freeze.mjs`，与墓碑写点 `freezeSubTaskLines` 同址
   ⇒ **墓碑写入单一权威**保持〔§6.8.3.3〕；**只写** `_frozenSubKeys`、**不写** `_frozenSubTask` 载体行）⇒ 后续 `⟦ev⟧stopped` 经 `ensureSubTaskKey` 直接丢弃（零幻影块——af 批探针实证的 `state.lines` 0 → 1 路径封死）；
   写入条件 = **与移除同一守卫**（`live && !live.done && live.async !== true`——命中即移除 + 写墓碑；无块可移除的 no-op 面不写，语义零扩）。
   **与墓碑存活闸（§6.8.3.2 P0-a）的交互**：写入时该条目已终态（`cancelled` + `done` + 出池）⇒ 存活判据 false ⇒ 维持丢弃（不再建块）；
   若同 key 条目仍存活（未来重启路径清终态位）⇒ 闸门摘墓碑 + 重建块（`ev:subagent-block-revived` 留痕）——**不构成永久失明**。
   同一幻影的**另一面已同批封死（c1）**：补位不启动终态条目（`AGENT-LOOP-SUBAGENT.md` §6.9）——「取消后仍被 settle」的燃料族无关消失。
- **冻结头**：`[✓ explore#1 · sync · model · done 45s]`——✓ / stopped 动词按状态（cancel 冻结 → stopped；
  interrupt 清场 → interrupted 标）；挂起期**已结算待消化中间态**驻留面板显示 `done · awaiting digestion`。
- **advisor 块**：运行中 = 对话流内可折叠框（key = `advisor-blocks`，单实例；头 `[advisor · review] N lines` + tail 3；
  展开 = `renderBlockTimeline` 有序块时间线——think ↔ tool 交替按发射序）；完成 → 冻结 `_frozenAdvisor` 载体；
  async advisor ⏹ = 取消后台评审；压缩以同款面板块渲染（`docs/core/design/CONTEXT-COMPACTION.md` §8 权威）。

#### 6.8.1 活动块去加戏（既有决策）

- **报告 preview 已删**：sync spawn 完成不再往会话流塞 8 行 dim 摘要与 `... (N more lines)` 行——
  冻结块是子代理报告的**唯一显示载体**（全文在 history 供模型）。
- **`finishSubTask` 收窄为精确匹配校验**：`finishSubTask(state, roles, lastError)` 恒 no-op 返 null
  （「最早 started」启发式支路删除——宁可 no-op 不误冻）；`finishSubTaskKey`（dispatch `ctx._subagentKey` 精确 key）
  是**唯一完成路径**；无 key 窗口的块由回合尾 `freezeAllSubTasks` 兜底清场。
- **墓碑存活闸（2026-09-17——zero-block 批）**：「回合尾 `freezeAllSubTasks` 兜底清场」的兜底面**收窄为仅非存活块**——
  池内仍存活的条目不得被冻结 / 写墓碑；墓碑生效点与复活语义见 **§6.8.3**（本节不重述）。
- **面板手工镜像退役——读时现算**：`computePanelBlocks(state)`（subTasks 活值纯推导）；`agent._panelSnapshot` 读写全删，
  `index.mjs` 反向挂载 `agent._tuiState = state`——**门控语义零动**（状态变更点不再手动刷镜——单账本）。
- **降级路径**：无 TUI 装配（headless / VSC / 子代理）→ 现算返 null → view 降级池视图 + freeze 报不可用。
- **已结算待消化驻留零动**：settled 三态机 / `_freezeAt` settle 锚 splice / `shiftFreezeAnchors` 头裁补偿 /
  降序 splice / `freezeReclaimDigestedBlocks` 逐条回收 / `panelFreezeGate` 门控全部保留。

#### 6.8.2 嵌套子代理：内层活动并入外层流

**机制**：内层 relay 前缀（如 eng-coder 内 explore）的活动行（工具 / 输出 / 文本 / 思考）**并入外层块活动流**
（`sub.blocks`）——与其他工具调用同款：折叠 tail 3 直达、展开全量时间线可达（任意 inner 深度）。
内层完成 / 终止信号照旧（供子块守护定格，不再有显示面）。

- **路由目标上移**：`routeSubToken` / `routeSubReasoning` / `routeSubToolCall` / `routeSubToolOutput` 的嵌套分支
  append 目标 = 外层块（与单层分支同函数）；kind 合并 / fresh 语义照旧；内层 `[model]` token 与 `⟦ev⟧done/stopped`
  定格照旧剥除（不进内容流）。
- **子块载体 = 守护元数据**（key / role / model / done / stopped / currentTool / children——无内容行）：职责收窄为
  ① done 后迟到 chunk 丢弃；② 外层冻结时未收尾子块不悬空（定格 stopped）；③ 内层工具 fresh 判别。
  正读者只有 `done` / `currentTool` / `children`。
- **渲染单流**：子块段 / 子块头行 / 子块折叠键全部删除——面板与冻结渲染只读 `sub.blocks`（折叠 = 头 + tail 3；
  展开 = `renderBlockTimeline` 60% 封顶窗口——既有组件零改）。折叠键只剩 `sub-${key}`。
- **行数额度单环**：内层内容就地计入外层 500 行环（原「子块计入外层配额」的树记账收窄为单载体记账）；
  trim 收窄为单载体最旧先行（否决「保留子块先丢」优先级遍历——收益不值；代价如实：内层批量输出与外层叙述同环最旧先行）。
- **省略计数真值**：`…（已省略 N 行）` 的 N 只随**内容移除**增长；标记自身不占额度、不计入 N；
  `countBlockLines` 口径 = **显示行**（块尾 `\n` 的空元素不计）。
- **已知失效前提（未来复核项）**：同一外层块若出现两个**并发**内层子块交错，内层输出会并入末块的他人工具头块
  （`pushBlock` 仅按 kind 合并）；当前不可达——`depth > 0` spawn 恒同步（下游对 `depth > 0` 拒 async），
  未来放开并行嵌套时须复核。
- **端差异**：VSC 侧嵌套活动保留「子标」形态（行首 dim 子标）——本批后**两端不再同构**（CLI 内层行无归属标）；
  差异如实登记，各端独立实现、互不追赶。

#### 6.8.3 异步子代理「零块」修复（subagent-zero-block——2026-09-17）

> 需求锚：台账技术待办 **#19**（异步子代理「零块」）；批次档 `docs/batches/2026-09-17-subagent-zero-block.md`（§2 任务书 + §2.0 复现读数）。
> 范围：块生命周期的**墓碑存活闸**（显示面）+ 静默面留痕；**发射面零改**。
> 本节 = 本批设计落点（canonical 基准层）；受影响文件 / 用例 / 验收面为本批**执行与验收材料**（时点值随实装漂移）。

**6.8.3.1 问题陈述与根因（复现实测——非推断）**

**症状**：已起跑的异步子代理在活动面板**永久零块**——2026-09-16 活体样本 `eng-coder#20`
（域冲突排队 → 域释放后起跑）**56 回合 24 分钟在跑、面板零块**；同批直发 `#4/#6/#8` 均有块。

**根因 RC-1（正证——已复现）**：墓碑 `_frozenSubKeys` 一旦写入某 key，`ensureSubTaskKey` 对该 key
**永久返回 null**（`subagent-blocks.mjs:82-83`）⇒ 该条目**此后全部 token 被静默丢弃** ⇒ 面板零块，
而子代理照常跑完（`subagent-blocks.mjs:181` 丢弃分支无痕）。

**证据链**（设计轮 read 实读 + 定向复现试跑；读数原文 = 批次档 §2.0）：

| # | 证据 | 结论 |
|---|---|---|
| E1 | 定向复现①：真实链路 撞域 → queued → 域释放 → `maybeRefillAsync` → `entry.start()`，捕获 token = `["explore#2/⟦ev⟧async\x1e","explore#2/[model]m"]`；真实 TUI 侧 waiting 块 → running 块 | 批次档 §1.1 假设「域释放补位路径缺发射」**= 证伪**（起跑链无缺陷） |
| E2 | 定向复现②：`⟦ev⟧queued` 建块（panel 1 块）→ 墓碑 → 后续 `⟦ev⟧async` / `[model]` / turn / 文本 / 工具全投 | **panel 0 块、`subTasks` 空、`_pendingAsyncKeys` 缓冲不落地**——症状逐条复现 |
| E3 | 逻辑必然：运行中子代理自身 token 流（turn / approval / 文本 / 工具）经 `ensureSubTaskKey` 即可建块 | 零块 ⇒ 必为**墓碑命中**（否则首个子 token 即建块）——排除「只是两个建块 token 丢了」 |
| E4 | 同类失效**已被承认**：`tool-events.mjs:202-204` 注释逐字「it would tombstone a live block and drop its relay stream」+ `isAsyncSpawnResult` 守卫（`tool-display.mjs:119-126`） | 危险已被识别，但**只在 tool 结果一个入口设防**；墓碑本身**无存活条件** |

**触发源归属（如实标注——不可重建）**：2026-09-16 事故中**哪一个**墓碑源触发**不可重建**
（丢弃面按设计无痕，且当时无 log）。已实核存在的墓碑入口三条（**非**归属结论，而是「修法必须与触发源无关」的依据）：

| 入口 | 落点 | 存活闸 |
|---|---|---|
| 回合尾 / 会话退出清扫 `freezeAllSubTasks` | `agent-turn.mjs:244` · `suspension-drive.mjs:296` → `subagent-freeze.mjs:142-154` | **无**——对 `state.subTasks` 全部条目无条件冻结 〔① 注〕 |
| `⟦ev⟧done` / `⟦ev⟧stopped` 事件分支 | `subagent-blocks.mjs:235-257` | **无**——按 key 直接冻结 |
| tool 结果面 `finishSubTaskKey` + `freezeDoneSubTasks` | `tool-events.mjs:219-221` | **有**（async ack 守卫 `isAsyncSpawnResult`——`running` / `queued`） |

⇒ 修法落在**墓碑生效点单一收口**，不逐触发源打补丁（D-ZB1）。

**① 行可达条件（评审 #11 收正——落点不改）**：`agent-turn.mjs:244` 站点仅在 `!willSuspend && !inSessionTurn` 时执行
（`:232` / `:240`；`willSuspend = poolLive(agent)`）⇒ 执行时两池必空 ⇒ P0-b 对该站点恒 no-op（存活条目**不可达**）；
**P0-b 真实生效面 = `suspension-drive.mjs:296`**（挂起会话退出：中止路径经 discard 只清已死条目 ⇒ 池内存活者在场）。

**6.8.3.2 设计与逐字契约**

**不变量（本批立）**：**墓碑只能断言「此块已终」，不得对「仍在池中存活」的条目生效。**

```text
spawn 撞域 → ⟦ev⟧queued → routeSubToken → ensureSubTaskKey 建 waiting 块             [不变·E1 证无缺陷]
域释放   → maybeRefillAsync → entry.start() → ⟦ev⟧async + [model] → 同 key 转 running  [不变]
墓碑源   → freezeSubTaskLines（写 _frozenSubKeys）                                     [不变]
后续 token → ensureSubTaskKey：墓碑命中 → ★存活闸（新）
              存活   → 摘墓碑 + 重建块 + 摘旧冻结载体行 + 留痕（日志面一行 / 每次复活一条）                    [P0-a 复活]
              不存活（池外 / done / cancelled）→ 丢弃（现状——迟到 chunk 正常面，不留痕）               [不变]
回合尾清扫 freezeAllSubTasks → ★存活跳过（新）：池内存活条目保留 live 驻留（已终态照旧冻结）                     [P0-b]
```

**P0-a 存活复活**（`subagent-blocks.mjs:80-99` `ensureSubTaskKey`）：墓碑命中时，先以 key（`role#id`）调
`livePoolHas(state, key)`（活池查询面与 key 映射见 §6.8.3.3）——**存活判据（逐字）**：**条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**〔判据先例 = `thincoder-core/agent-tools/async-discard.mjs:55`——零新谓词；仅「键在池内」会违 `subagent-blocks.mjs:81` 守卫原意〕；
命中存活 ⇒ ① `_frozenSubKeys.delete(key)`；② **摘旧冻结载体行**（见下）；③ 照常建块（model / async 由后续
`⟦ev⟧async` / `[model]` 重填）+ 留痕；**否则维持现状丢弃**。
**旧载体行处置（评审 #2 收正——二选一取「摘除」）**：墓碑源已把 `_frozenSubTask` 行 splice 进 `state.lines`
（`subagent-freeze.mjs:88-92`）；不摘则一 key 两载体、折叠键 `sub-${key}` 两处共用
（`thincoder-cli/src/tui/render-segments.mjs:76` / `thincoder-cli/src/tui/subagent-panel.mjs:50`）⇒ 旧块永久留流。**取摘除**：`removeFrozenSubTaskLine(state, key)` = 摘该 key 全部
`_frozenSubTask` 载体行 + `releaseLine` 负向出账（增删均须过账——`display-budget.mjs:145-151`）+ 摘除位之后
`_freezeAt` 在途锚点 −1（`shiftFreezeAnchors` 同款语义）。
**helper 归址**：`livePoolHas` / `removeFrozenSubTaskLine` 定义于 `subagent-freeze.mjs`（与墓碑写点 `freezeSubTaskLines` 同址——
墓碑条件 / 墓碑写入 / 载体行增删单一权威）。import 方向 blocks → freeze 既存（`subagent-blocks.mjs:31`）⇒ **无环**。

**P0-b 清扫存活跳过**（`subagent-freeze.mjs:142-154` `freezeAllSubTasks`）：遍历时对**存活** key **跳过**（不置 done、
不 `freezeSubTaskLines`、不出 `subTasks`）——**存活判据（逐字）**：**条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**；
**已终态（含 done-in-pool——`entry.done` 置位 = `async-settle.mjs:194`，settle 后未收集条目仍留池：`async-settle.mjs:259` / `thincoder-core/agent-tools/async-discard.mjs:13-14`）照旧冻结清场**；
池外条目照旧冻结（中断 ghost 语义不变）。

**P1 禁静默留痕**（批次档 §1.3 判据 3）：① 复活分支留痕——**走日志面** `logEvent("ev:subagent-block-revived")`；
**每次复活记一条（无去重状态）**——墓碑删后可再次命中复活，逐次留痕；若要「同 key 去重」须新增载体 = 第二份存活账，
否决（D-ZB3 同源）。② `refreshQueuedTokens` 的 `catch {}`（`subagent-scheduler.mjs:340-342`）保持不破坏池状态，
补 `logEvent("ev:queued-paint-failed")` 留痕。
**UI 决策（已定——不悬空）**：本批**不新增**会话流提示行与面板形态——用户的可见证据 = **块回归本身**
（活动流恢复跟随）；留痕只走日志面（机判可查）。

**降级**：`state._agent` 缺省（headless / 子代理内 / 测试夹具）⇒ 无存活信息 ⇒ 与批前**逐字等价**（丢弃），零回归。

**6.8.3.3 接口契约（读取面）**

| 面 | 形态 | 说明 |
|---|---|---|
| 池读取 | `state._agent?._asyncSubagents` / `_asyncAdvisors`（Map） | 存活单一事实源；键 `String(id)`；**存活判据（逐字）**：**条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**（done-in-pool 留池 = `async-settle.mjs:259` / `thincoder-core/agent-tools/async-discard.mjs:13-14`） |
| helper 归址 | `livePoolHas(state, key)` / `removeFrozenSubTaskLine(state, key)` 定义于 `subagent-freeze.mjs`，导出供 `subagent-blocks.mjs` import | import 方向 blocks → freeze 既存（`subagent-blocks.mjs:31`）——**无环** |
| key 匹配 | **写死映射**：最后 `#` 切分 → `role` + `id`；命中 = `pool.has(String(id))` ∧ `entry.role === role`；非池键（`compress#N` 等）= false | 池键 = `String(id)`（`subagent-run.mjs:187` / `advisor-async.mjs:410`）⇒ `pool.has(key)` 恒 miss；与 `_frozenSubKeys` / `subTasks` 同命名空间；存活判据（逐字）同 §6.8.3.2 P0-a |
| 挂载 | `index.mjs` 已挂 `state._agent`（§6.8.1 降级路径条） | 既有先例：`thincoder-cli/src/tui/subagent-panel.mjs:123` 读 `_syncChildAborts` |
| 降级 | `state._agent` 缺省 ⇒ 无存活信息 | 维持丢弃（零回归） |

**6.8.3.4 受影响文件（当前行数 = 设计轮 read 实测，含尾行）**

| # | 档 | 文件 | 现况 | 本批动作（file:line） | 预计后 |
|---|---|---|---|---|---|
| 1 | CLI·源 | `thincoder-cli/src/tui/subagent-blocks.mjs` | 437 | `:31` import 面加 `livePoolHas` / `removeFrozenSubTaskLine` · `:80-99` `ensureSubTaskKey` 墓碑分支加存活复活 + 旧载体行摘除 + 留痕 | ~460 |
| 2 | CLI·源 | `thincoder-cli/src/tui/subagent-freeze.mjs` | 176 | `:142-154` `freezeAllSubTasks` 加存活跳过 + 新增导出 `livePoolHas(state, key)` / `removeFrozenSubTaskLine(state, key)`（与墓碑写点同址） | ~205 |
| 3 | 核·源 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 429 | `:340-342` catch 补 `logEvent`（+ 顶注 import 面 `:12-22` 补 `logEvent`——现未 import） | ~437 |
| 4 | CLI·测（**拟新增**） | `thincoder-cli/test/subagent-zero-block.test.mjs` | 新 | T-ZB1–T-ZB6（§6.8.3.6）；直驱 `routeSubToken` / `freezeAllSubTasks` / `refreshQueuedTokens`——零网络、零定时器 | ~120 |
| 5 | 设计档 | `docs/cli/design/TUI.md` | 555 | 本节（§6.8.3）+ §6.8.1 指针行 + 变更记录一行 | 本档已落（→ 576 行——本 fix 轮后） |

**跨文件限**：三份源档预计后均 < 500 硬限（460 / 205 / 437）——**无拆分需要**。

**>300 advisory 档审视结论（F-R24a——评审 #6 收正）**：
- `subagent-blocks.mjs`（437 → ~460）：改动面 = 既有 `ensureSubTaskKey` 内一分支 + 一条摘行调用（未新增职责 / 未新增模块级函数）⇒ **无需拆分**；>300 为存量（2026-09-05 由 625 行拆出后的漂移）——登记存量债。
- `subagent-scheduler.mjs`（429 → ~437）：改动面 = 既有 `catch` 内补一条 `logEvent` + 顶注 import（未新增职责）⇒ **无需拆分**；>300 为存量——登记存量债。

**6.8.3.5 关键决策记录（含否决备选）**

| # | 决定 | 理由 | 否决备选 |
|---|---|---|---|
| D-ZB1 | 落点 = **墓碑生效点单一收口** | 触发源 ≥2 且会增；单点 = 存活性判据一处（单一权威源） | 逐触发源加守卫（`agent-turn:244` + `suspension-drive:296` + 事件分支）——漏第三个源即复发 |
| D-ZB2 | 存活 ⇒ **复活建块**（非仅留痕） | 块是子代理活动的唯一显示载体；复活让运行重新可见并继续跟随活动流 | 只留一行警告——用户仍看不到 56 回合的活动流 |
| D-ZB3 | 存活判据（逐字）= **条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**——取 `state._agent` 活池 | 池即存活单一事实源；**done-in-pool 常态留池**（`async-settle.mjs:259` / `thincoder-core/agent-tools/async-discard.mjs:13-14`）⇒ 仅「键在池内」会误判已终态为存活 | TUI 侧自维护 `liveKeys` 集合 = 第二份存活账（违单一权威源） |
| D-ZB4 | **发射面零改** | E1 复现已证 `⟦ev⟧async` / `[model]` 锚点无缺陷；by-design「queued 不发 `[model]`」保持 | 把建块 token 提前到入队（改 by-design 语义）——否决 |
| D-ZB5 | 不存活 ⇒ 维持丢弃**且不留痕** | 迟到 chunk 是**正常高频面**（§6.8.1 定格丢弃）；留痕会刷屏 | 全部丢弃都留痕——噪声 |

**6.8.3.6 用例表（正常 / 边界 / 错误）**

| # | 类 | 输入 | 期望输出 |
|---|---|---|---|
| T-ZB1 | 正常 | `⟦ev⟧queued` 建块 → 墓碑（`freezeSubTaskLines`）→ **池内该条目仍存活**（真实池键形 `set("2", entry)`；`done` / `cancelled` 非 true）→ `⟦ev⟧async` + `[model]` | 块复活：`subTasks[key]` 存在、`_frozenSubKeys` 无该 key、`async === true`、`model` 落位（`[model]` 面）；**旧 `_frozenSubTask` 载体行已摘除 + 账不飘** |
| T-ZB2 | 正常 | 接 T-ZB1 → 文本 + `⟦ev⟧turn` + 工具 token | 全部入块（活动流跟随；面板渲染 1 块） |
| T-ZB3 | 边界 | 墓碑命中 + **不存活两形**：① 池外真终态 ② 池内 done-in-pool（`entry.done === true`——settle 后未收集）→ 迟到 chunk | 维持丢弃（两形同判）：`_frozenSubKeys` 仍含该 key、`subTasks` 无该 key（不复活幽灵块） |
| T-ZB4 | 边界 | `freezeAllSubTasks`：池内存活块 + 池外已终块 + **池内 done-in-pool 块** | 存活块保留在 `subTasks`（未置 done、未写墓碑）；池外已终块与池内 done-in-pool 块照旧冻结进流（已终态不被跳过） |
| T-ZB5 | 错误 | `state._agent` 缺省（headless / 夹具）→ 墓碑命中 | 与批前逐字等价（丢弃）——零回归 |
| T-ZB6 | 错误 | `refreshQueuedTokens` 的 `onToken` 抛错 | 池状态不被破坏（现状）；留痕一条（新） |

**6.8.3.7 验收标准（逐条回指；每条可机判）**

| # | 验收标准 | 机判 | 回指 |
|---|---|---|---|
| AC-ZB1 | 墓碑命中且条目**存活** ⇒ 复活建块 | T-ZB1 / T-ZB2 | 台账 #19 症状 |
| AC-ZB2 | 墓碑命中且条目**不存活**（池外 / `entry.done === true`〔含 done-in-pool〕/ `entry.cancelled === true`）⇒ 维持丢弃（迟到 chunk 丢弃语义不回归） | T-ZB3 | 批次档 §1.1 by-design 面 |
| AC-ZB3 | `freezeAllSubTasks` 不冻存活条目；已终态（含 done-in-pool）照旧冻结 | T-ZB4 | 批次档 §1.2 ②（清扫面） |
| AC-ZB4 | 发射面零改：域释放补位仍发 `⟦ev⟧async` + `[model]`；queued 仍不发 `[model]` | 既有断言（`advisor-pool-queue.test.mjs:86/211`——**仅 async 面**）+ T-ZB1（**`[model]` 面**落位断言） | 批次档 §1.3 判据 2 |
| AC-ZB5 | 降级面（无 `state._agent`）行为与批前逐字一致 | T-ZB5 | §6.8.1 降级路径条 |
| AC-ZB6 | 留痕：复活分支与 relay 异常各留一条可观测痕（禁静默） | T-ZB6 | 批次档 §1.3 判据 3 |
| AC-ZB7 | 两端全量 `npm test` 绿 | `npm test`（cli + core） | 常规门 |

**6.8.3.8 边界（本批不做）**

- **不改发射面**：`subagent-run.mjs:147-149` 两 token 锚点、`subagent-scheduler.mjs:331-344` queued 发射——E1 已证无缺陷。
- **不新增按族分支**：墓碑是共享单点，修复天然覆盖 subagent / escalate / advisor / consult / compress 五族，但**不新增任何按族代码**（非「扩族」）；**复活可达面** = 键可映射到 §6.8.3.3 两池条目者（subagent / escalate / advisor）；非池键（`compress#N` 等）判 false ⇒ 维持既有丢弃语义（零回归——非本批修面）。
- **不改**：`isAsyncSpawnResult` 判定面（`tool-display.mjs:119-126`）· `⟦ev⟧cancelled` 出队语义（`subagent-blocks.mjs:180-192`）· awaitingDigest 驻留与 `_freezeAt` 锚点（§6.8.1 已结算待消化驻留零动——用户裁定）· `computePanelBlocks` 现算面。
- **不引入**块落盘恢复；不改提示词 / 需求档 / `_archive/**`。
- **VSC 对位不在本批**（VSC `panel-callbacks.mjs` / `suspension.mjs` 为独立实现）——登记为观察项（批次档 §2.7 同源）。

## 7. 状态栏与用户介入提醒（attention 态）

> 动机：Agent 跑长任务或弹审批 / 提问时，用户切去别处 → 需要反复切回来查看。本机制让「需要用户介入」在状态栏**可见**。

### 7.1 触发集合（裁决）

| 信号面 | 裁决 | 理由 |
|---|---|---|
| 审批卡挂起（`state.permission`） | **计**（blocked） | agent 阻塞——不回应则零进展 |
| 提问卡挂起（`state.question`） | **计**（blocked） | 同上 |
| 回合结束等待输入（顶层回合链尾） | **计**（awaiting） | agent 已停、无自动续跑——「不用反复切回来」的主用例 |
| picker / wizard / search / interruptPrompt | 不计 | 用户自己发起——在场已由发起动作证明 |
| pendingInput（挂起期输入单槽） | 不计 | 是**用户自己的**待交接输入，非 agent 需要用户 |
| 挂起会话（池 live） | 不计 | 自动续跑中——不需要用户动作 |
| design token 门 / 工具拒绝 | 不计 | 无独立 UI 态；其「需要用户」部分由上述三类承接 |

### 7.2 契约

- **派生（纯函数——`render-frame.mjs` 导出，供测试直驱）**：`attentionKind(state)` →
  `"blocked"`（`state.permission || state.question`）∥ `"awaiting"`（`state.attentionAwaiting && !processing && !suspended && !_suspPending`）∥ `null`。
- **提示语（chip——逐字；优先级 kind 内 blocked > awaiting；blocked 内 permission > question）**：
  `⚠ 等待你的审批` / `⚠ 等待你的回答` / `⚠ 等待你的输入`。
- **渲染契约（`renderStatus`）**：attention 非 null ⇒ 整行以注意力色对包裹——**背景 = ANSI 43（黄底）+ 前景 = ANSI 30（黑字）**；
  行首 = chip，其后 ` │ ` 分隔，再接既有内容——**内容零省略**。既有内容含内部 `ansi.reset`（banner / ctx 警示段）——
  实现须在每次内部复位后**重施加底色**（否决替代 = 剥离内部样式——会丢上下文警示色与 banner 色相）。
- **宽度预算**：`statusMax = cols − 1 − width(bannerPrefix) − width(chip + " │ ")`——整行仍 ≤ `cols − 1`（既有口径）。
- **稳态（不闪烁）**：attention 色随帧派生——**无空闲重绘定时器**。
- **负向锁（零侵入）**：attention 为 null ⇒ 输出与改动前**逐字节等价**（机判口径 = 零 `\x1b[43m` 序列 + strip-ANSI 文本无 chip）。
- **置位（1 点——回合链尾）**：`userNeededAtTurnEnd(state, agent, skipSession)`（`agent-turn.mjs` 导出纯函数，可直测）——
  排除 `skipSession` / 挂起两态 / 池 live / 队列非空 / processing；命中 ⇒ `state.attentionAwaiting = true` + `render()`。
  置位点 = 顶层链尾（**非回合末 finally**——finally 后还有队列续发与挂起会话，在那之后才真正「无人接手」）。
  中断结束与错误结束同样置位（agent 已停、等用户——语义一致）。
- **清位（2 点——输入即在场）**：**键盘** = `key-handler.mjs` `onKeypress` 入口（模态分派**之前**）清位 + 仅当原值为真时 `render()`；
  **鼠标** = `index.mjs` stdin `data` 处理器内（滚轮分支与 `onMouseClick` 调用前——单点覆盖滚轮 / 点击）。
  blocked 两态无需清位（实时派生——提示消解即消失，零残留）。
- **state 字段**：`attentionAwaiting: false`（`index.mjs` state 字面量——默认关；不落盘、不进会话）。
- **边界**：不做闪烁 / 系统级通知 / 终端标题改写 / 响铃；不引入空闲重绘定时器；不改状态栏既有信息面与既有按键 / 模态 / 挂起语义。
  **VSC 对位**：审批 / 提问挂起已有 waiting 态；回合结束等待输入与面板内 attention 态待建——**各端独立实现**，
  语义同源（不做 byte-identical），登记归 VSC 轮。

### 7.3 模式 banner（ENG / PLAN / AUTO / ADVISOR）——工具驱动变更的显示契约（#45）

- **位置**：`renderStatus` 行首 banner 段（`thincoder-cli/src/tui/render-frame.mjs:220-224`）——`AUTO│` / `PLAN│` / `ADVISOR│` / `ENG│` 四段，其中 PLAN / ENG 即**模式指示器**。
- **契约（每帧 recompute——本批登记的结构性属性）**：banner 从**活对象**直读（`agent.planMode` / `agent.config.agent.engineering` / `agent.autoApprove` / `agent.config.advisor.guard`），**零缓存副本、零推送链**。
- **后果（本批核实）**：agent 经工具翻转模式（`eng` / `plan` 工具）⇒ banner 在帧内反映——回合中 1s ticker + 行 diff 重绘（`thincoder-cli/src/tui/agent-turn.mjs` 回合驱动器）⇒ **CLI 端无需任何联动改动**（台账 #45 的 CLI 半）。
- **参数面同款（本批补核——设计评审轮 1 发现 8）**：状态栏 turn / token / context 段与模型段同取**活对象 / TUI 状态**
  （`thincoder-cli/src/tui/render-frame.mjs` 的 `:376-392` 段——`agent._currentTurn` / `agent._maxTurns` / `agent.provider` / `state.tokens` / `state.ctxCache`）；
  **零 `config.json` 镜像链** ⇒ `settings` 工具驱动的参数变更在 CLI 侧**无端显示待联动项**（其生效点 = 装配期读盘，与模式面不同族）——参数面**零改**（结论同模式面）。
- **边界（负向锁）**：**不得**为模式再引入缓存副本（引入即须自建失效链——本面因此天然免维护）；本面**不入推送链**（VSC 端另有多文件推送链——单一权威源 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.3，本档不重述——D2）。
- **可机判**：`renderStatus(state, agent, cols, slashCommands)` 为纯函数（既有导出）——改 `agent.config.agent.engineering` / `agent.planMode` 后重调 ⇒ banner 段随变（同调用内零状态）。

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/TUI.md`（1529 行）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档 §10 关键设计决策表（as-of 表） | 设计决策与理由的时点快照 | 语义已被正文 supersede——现行结论在各机制节；表本体 = 时点材料 |
| 旧档 §11 专题完成史表 | 逐专题「日期 / 专题 / 现状」 | 历史叙述——机制已入正文 |
| 旧档 §12.2 三面现状表 · §12.3 方案选型对比 · §12.6 决策 D-SS1–D-SS7 | 选择面收口批（第 20 批）的选型与决策材料 | 结论已入 `docs/cli/design/TUI-COMMANDS.md` §3 / §4；被否决候选理由不入活档 |
| 旧档 §12.7 / §13.5 受影响文件表 · §12.8 / §13.6 用例表 · §12.9 / §13.7 验收标准 | 批次执行与验收材料 | 一次性——实装后已漂移 / 已验收 |
| 旧档 §13.1 问题陈述（含 `file:line` 现场核实） · §13.2 守卫三候选择型 | 输入面小修批的勘察材料 | 结论已入 `docs/cli/design/TUI-COMMANDS.md` §5（契约句） |
| 旧档 §14.1 现状复核 / §14.2 三表选型 / §14.4 受影响文件 / §14.5 决策 D-AT1–D-AT8 / §14.6 纪律核对 / §14.7 用例 / §14.8 AC / §14.9 边界与登记 | attention 批（第 33 批）的批次材料 | 结论已归并为 §7（触发表 + 契约）；登记项保留于 §7.2 末 |
| 旧档 §15.1 问题陈述（十条绕过路径实测） / §15.2 选型表 / §15.4 决策 D-TB1–D-TB6 / §15.5 受影响文件 / §15.6 用例 / §15.7 AC | 内存有界批（TUI-OOM-ROOTCAUSE）的批次材料 | 结论已入 `docs/cli/design/TUI-SESSION-VIEW.md` §5 |
| 旧档 §1 模块地图**行数列** + 表头「行数实测回写」注 + 「同批如实注（未入表三档 / pickers 行文字未随拆重写）」 | as-of 行数快照与补登注 | 行数随实现漂移（本档地图不携行数）；未入表三档已按现文件结构补入地图 |
| 旧档变更记录（2026-08-30 起逐批流水） | 逐批流水 | 历史叙述——本档自有变更记录 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 需求层条目 | F1–F13 / N1–N11 | 需求面——`docs/cli/requirements/TUI.md`（本档只留设计层） |
| 输入框键契约 | 状态模型不变量 / 按键表 / ↑↓ 三规则 / Inject 框 / question 自由文本态 | `docs/cli/design/TUI-INPUT-BOX.md`（本档只挂指针） |
| 普通工具行间区块 | 区块格式 / chunk 契约 / 参数可见性 / 收尾守卫 | `docs/cli/design/TUI-TOOL-OUTPUT.md`（本档只挂指针） |
| 命令层与选择面 | slash 命令族 / picker / wizard / 交互桥 | `docs/cli/design/TUI-COMMANDS.md` |
| 会话恢复 / 懒加载 / 回合驱动 / 显示层额度 | 恢复管道 / 三层缓存 / runAgentTurn / 字符额度 | `docs/cli/design/TUI-SESSION-VIEW.md` |
| 挂起会话状态机 / 子代理编排语义 | settle 时序 / 池管理 / 调度排队 | `docs/core/design/AGENT-LOOP.md`（本档只留显示层契约） |
| 压缩面板 / MCP 表单 / 会话存档 | 跨板块机制 | `docs/core/design/CONTEXT-COMPACTION.md` §8 · `docs/core/design/MCP.md` §5/§8 · `docs/core/design/SESSION.md` |
| VSC webview 对位 | webview 渲染 / 消息协议 / 子标 | `docs/vsc/design/WEBVIEW*.md`——**非同机制**（端差异登记，不追赶） |

## 变更记录

- 2026-09-18（**失效表达清理批 · 本批直接执行 · 可 revert**——承用户 2026-09-18 裁定「修订式表达很害人，失效的表达一定要删掉」）：§6.8.3.8 边界「不改」行删 `⟦ev⟧cancelled` 坐标的「原记 `:167-179` 系…非机制变更」句。历史沿革 = 本档既有历史段 + 批档 `docs/batches/2026-09-18-stale-expression-purge.md`。

- 2026-09-18（**模式联动批 · #45 CLI 半** · eng-designer——承 `docs/batches/2026-09-18-mode-propagation.md` §1.1）：新增 **§7.3**（banner 每帧 recompute 契约 + 「不得引入缓存副本」负向锁 + 可机判句）；CLI 端经核实**零改动**（结构性属性成文，非新机制）。
- 2026-09-18（**模式联动批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承批档 §3 发现 8）：§7.3 补**参数面同款**条（turn / token / context / 模型段同取活对象 / TUI 状态——`render-frame.mjs:376-392`；`settings` 工具驱动面**无待联动项**，CLI 参数面零改）——与核实表行 4 同口径。

- 2026-09-17（**zero-block 批 · 设计评审轮次 1 修正轮 · eng-designer**）：承 §3 发现表 11 条（🔴1 / 🟡5 / 🔵5）——
  存活判据收窄为「条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）」（四处同文：P0-a / P0-b / 接口契约 / D-ZB3——done-in-pool 不再误判存活）；
  P0-a 增旧冻结载体行摘除（`removeFrozenSubTaskLine` + `releaseLine` + 锚点 −1）；接口契约写死 key 映射（最后 `#` 切分 + `pool.has(String(id))` ∧ `entry.role === role`）；
  T-ZB1 / T-ZB3 / T-ZB4 断言增补；AC-ZB2 / AC-ZB3 / AC-ZB4 收窄；入口表①行可达条件注（P0-b 真实生效面 = `suspension-drive.mjs:296`）；
  受影响文件表数值 / 坐标收正（`:12-22`）+ >300 两档审视结论。发现 #5（LOGGING 字段面）缓办（实装后回填）。
- 2026-09-17（**zero-block 批 · 设计轮 · eng-designer · 收正重落**）：§6.8 新增 **§6.8.3**（异步子代理「零块」修复——
  根因 RC-1 = 墓碑对存活条目生效致全 token 流被静默丢弃〔复现正证；「域释放补位缺发射」假设经定向复现**证伪**〕/
  墓碑存活闸 P0-a + 清扫存活跳过 P0-b + 禁静默留痕 P1 / 接口契约 / 受影响文件 / D-ZB1–D-ZB5 / T-ZB1–T-ZB6 /
  AC-ZB1–AC-ZB7 / 边界）；§6.8.1 补墓碑存活闸指针一行；需求锚 = 台账 #19；批次档 `docs/batches/2026-09-17-subagent-zero-block.md`。
   **收正说明**：本节原误落参照档 `thincoder-cli/docs/design/TUI.md`（迁移期参照历史——保留 ≠ 维护）——本批收割重落本档。

- 2026-09-17（**af 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2）：§6.8.2 排队块条补**取消 / 出队发射源两处**（子代理族 / 评审族）+
  **已移除块不复建**风险行（`⟦ev⟧stopped` 对已移除块建幻影冻结块——可达面 = 取消后补位重启；台账 #31 判「CLI 不可复现」+ 加固候选）。
- 2026-09-17（**af 批 · fix 轮 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2.12）：§6.8.2 排队块条**风险行收正为已裁设计**——
  「已移除块不复建」由加固候选改落**键级墓碑**（c2：`⟦ev⟧cancelled` 移除分支同址写 `_frozenSubKeys`，无载体行；写入条件 = 与移除同一守卫）；补写与 §6.8.3.2 存活闸的交互（终态 ⇒ 丢弃；同 key 存活 ⇒ 复活不失明）；
  发射源句补评审族**工具路径**（`executeCancelAction` 落池分支——fix 轮收口）；c1 落 `AGENT-LOOP-SUBAGENT.md` §6.9。
- 2026-09-18（**af 批 · 三轮 fix 轮 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2.14 · 设计评审轮 1）：§6.8.2 排队块条**发射源句改写为「族 × 落点逐条列名」**（#7——原「发射源两处」与其后枚举计数不符）；
  评审族改述为**唯一发射点**（核 `cancelAsyncAdvisor` queued 分支——#1 单源化裁定）；§6.8.3.8 边界行 `⟦ev⟧cancelled` 坐标收正为 `subagent-blocks.mjs:180-192` 并标 **as-of**（#6——原 `:167-179` 系 implementation 后漂移）。
- 2026-09-15（**B 式迁移轮 · 第 6 批**）：建档——`thincoder-cli/docs/design/TUI.md`（1529 行）内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/cli/design/`（P2：CLI 终端界面结构性只属 CLI）；② **按读者面拆三档**（承接台账「TUI 须拆分」判）+ 本档 = 界面核心；
  ③ 模块地图按**现文件结构**重建（补入旧档未收的三档与拆分后新增的 cmd-* 族——行数列不并）；
  ④ §12–§15 四个批次节的**机制结论**并入对应机制节（选择面 → 命令档 / attention → §7 / 内存 → 会话视图档），批次材料入 §8.1；
  ⑤ 坐标全量改**现状路径**并实核；⑥ 「嵌套子代理」按现行机制（内层活动并入外层流）重建，旧子块小节形态入 §8.1。
